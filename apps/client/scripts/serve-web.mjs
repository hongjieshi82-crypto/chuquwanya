import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { request as createHttpsRequest } from 'node:https';
import { extname, join, normalize, resolve } from 'node:path';
import { createGzip } from 'node:zlib';

const root = resolve(process.cwd(), 'dist');
const portArgument = process.argv.find((value) => /^\d+$/.test(value));
const port = Number(portArgument ?? 8092);
const hostArgument = process.argv.find((value) => value.startsWith('--host='));
const host = hostArgument?.slice('--host='.length) || '127.0.0.1';
const apiHost = 'api.chuquwanya.fun';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function resolveRequestPath(pathname) {
  const decoded = decodeURIComponent(pathname.split('?')[0]);
  const cleanPath = normalize(decoded).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  const candidates = cleanPath
    ? [join(root, cleanPath), join(root, `${cleanPath}.html`), join(root, cleanPath, 'index.html')]
    : [join(root, 'index.html')];
  return candidates.find((candidate) => candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile());
}

function cacheControl(filePath) {
  if (extname(filePath) === '.html') return 'no-cache';
  if (filePath.includes('/_expo/static/') || filePath.includes('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=86400';
}

const server = createServer((request, response) => {
  const requestPath = request.url ?? '/';
  if (requestPath.startsWith('/api/v1/') || requestPath.startsWith('/assets/activity-covers/')) {
    const upstream = createHttpsRequest({
      hostname: apiHost,
      method: request.method,
      path: requestPath,
      headers: { ...request.headers, host: apiHost },
    }, (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    });
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: { code: 'LOCAL_PREVIEW_PROXY_ERROR', message: '本地预览暂时无法连接正式 API' } }));
    });
    request.pipe(upstream);
    return;
  }
  const filePath = resolveRequestPath(requestPath);
  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const stats = statSync(filePath);
  const extension = extname(filePath);
  const etag = `W/\"${stats.size}-${Math.trunc(stats.mtimeMs)}\"`;
  if (request.headers['if-none-match'] === etag) {
    response.writeHead(304, { ETag: etag, 'Cache-Control': cacheControl(filePath) });
    response.end();
    return;
  }

  const headers = {
    'Cache-Control': cacheControl(filePath),
    'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
    ETag: etag,
    Vary: 'Accept-Encoding',
  };
  const canGzip = /\bgzip\b/.test(request.headers['accept-encoding'] ?? '')
    && ['.css', '.html', '.js', '.json', '.svg'].includes(extension);
  if (canGzip) headers['Content-Encoding'] = 'gzip';

  response.writeHead(200, headers);
  const stream = createReadStream(filePath);
  if (canGzip) stream.pipe(createGzip({ level: 6 })).pipe(response);
  else stream.pipe(response);
});

server.listen(port, host, () => {
  console.log(`Fast web preview: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});
