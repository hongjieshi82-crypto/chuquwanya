import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { createGzip } from 'node:zlib';

const root = resolve(process.cwd(), 'dist');
const portArgument = process.argv.find((value) => /^\d+$/.test(value));
const port = Number(portArgument ?? 8092);

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
  const filePath = resolveRequestPath(request.url ?? '/');
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

server.listen(port, '127.0.0.1', () => {
  console.log(`Fast web preview: http://localhost:${port}`);
});
