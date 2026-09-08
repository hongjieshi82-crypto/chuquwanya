import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cityPlaySeeds, secondCityChoices, affordableEntertainment } from '../src/city-play-seeds.js';
const exec = promisify(execFile);
const folder = resolve('../client/public/media/city-plays');
await mkdir(folder, { recursive: true });
const manifestPath = resolve('src/city-play-photos.json');
type Photo = { uri: string | null; source: string; author: string; license: string; licenseUrl: string; width: number; height: number; kind: 'photo' | 'illustration'; page: string; photoTitle?: string };
let manifest: Record<string, Photo> = {};
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}
async function request(base: string, params: Record<string, string>) {
  const url = base + '?' + new URLSearchParams({ format: 'json', ...params });
  const { stdout } = await exec('curl', ['-fsSL', '--http1.1', '--max-time', '20', '--retry', '2', '--retry-all-errors', '--retry-delay', '2', url], { maxBuffer: 30 * 1024 * 1024 });
  return JSON.parse(stdout);
}
const entries = cityPlaySeeds.flatMap((c) => [...c.plays, ...(secondCityChoices[c.id] ?? []), affordableEntertainment[c.id]!].map((p, i) => ({ key: String(820000 + c.id * 100 + i), city: c, play: p })));
const pending = entries.filter((e) => !manifest[e.key]);
for (let offset = 0; offset < pending.length; offset += 20) {
  const chunk = pending.slice(offset, offset + 20);
  let data: any;
  try {
    data = await request('https://zh.wikipedia.org/w/api.php', { action: 'query', prop: 'pageimages|info', inprop: 'url', piprop: 'thumbnail|name', pithumbsize: '1280', redirects: '1', titles: chunk.map((e) => e.play.wiki).join('|') });
  } catch (e) { console.log('PAGE BATCH FAILED', offset, String(e).slice(0, 100)); continue; }
  const pages = Object.values(data.query?.pages ?? {}) as any[];
  const aliases: Record<string, string> = {};
  for (const n of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) aliases[n.from] = n.to;
  for (const e of chunk) {
    let title = e.play.wiki; for (let i = 0; i < 4 && aliases[title]; i++) title = aliases[title]!;
    const page = pages.find((p) => p.title === title && p.missing === undefined);
    manifest[e.key] = { uri: e.play.localImage ? '/media/travel/' + e.play.localImage : null, source: e.play.source || page?.fullurl || '', page: page?.fullurl || '', author: '', license: '', licenseUrl: '', width: 0, height: 0, kind: 'photo', photoTitle: page?.pageimage };
    if (page?.thumbnail?.source) (manifest[e.key] as any).download = page.thumbnail.source;
  }
  console.log('PAGE', Math.min(offset + 20, pending.length), '/', pending.length);
}
const photos = Object.entries(manifest).filter(([, v]) => (!v.uri || v.kind === 'illustration') && v.photoTitle);
const clean = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
async function findCommonsPhoto(query: string) {
  const data = await request('https://commons.wikimedia.org/w/api.php', {
    action: 'query', generator: 'search', gsrnamespace: '6', gsrlimit: '8',
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo',
    iiprop: 'url|size|extmetadata', iiurlwidth: '1280',
  });
  const pages = Object.values(data.query?.pages ?? {}) as any[];
  return pages.map((page) => ({ page, info: page.imageinfo?.[0], meta: page.imageinfo?.[0]?.extmetadata }))
    .filter(({ info, meta }) => info && meta && /CC BY|CC0|Public domain|PD/i.test(meta.LicenseShortName?.value ?? ''))
    .filter(({ info }) => info.width >= 1000 && info.height >= 600 && info.width / info.height >= 1.2)
    .sort((a, b) => (b.info.width * b.info.height) - (a.info.width * a.info.height))[0] ?? null;
}
for (let offset = 0; offset < photos.length; offset += 4) {
  const chunk = photos.slice(offset, offset + 4);
  try {
    const data = await request('https://commons.wikimedia.org/w/api.php', { action: 'query', prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1280', titles: chunk.map(([, p]) => 'File:' + p.photoTitle).join('|') });
    const pages = Object.values(data.query?.pages ?? {}) as any[];
    const tasks = chunk.map(([key, photo]) => async () => {
      const page = pages.find((p) => p.title.replace(/_/g, ' ') === ('File:' + photo.photoTitle).replace(/_/g, ' '));
      const info = page?.imageinfo?.[0]; const meta = info?.extmetadata;
      if (!info || !meta || !/CC BY|CC0|Public domain|PD/i.test(meta.LicenseShortName?.value ?? '')) return;
      if (info.width < 900 || info.height < 500) return;
      const url = info.thumburl || info.url;
      const mime = /\.png(?:\?|$)/i.test(url) ? 'png' : 'jpg';
      const file = key + '.' + mime;
      try {
        try {
          await exec('curl', ['-fsSL', '--http1.1', '--max-time', '25', '--retry', '2', '--retry-all-errors', '--retry-delay', '2', url, '-o', resolve(folder, file)]);
        } catch {
          await exec('curl', ['-fsSL', '--http1.1', '--max-filesize', '8000000', '--max-time', '35', info.url, '-o', resolve(folder, file)]);
        }
        Object.assign(photo, { kind: 'photo', uri: '/media/city-plays/' + file, source: info.descriptionurl, author: clean(meta.Artist?.value ?? ''), license: meta.LicenseShortName.value, licenseUrl: meta.LicenseUrl?.value ?? '', width: info.thumbwidth || info.width, height: info.thumbheight || info.height });
      } catch { console.log('DOWNLOAD FAILED', key); }
    });
    for (let i = 0; i < tasks.length; i += 4) await Promise.all(tasks.slice(i, i + 4).map((run) => run()));
    console.log('PHOTO', Math.min(offset + 4, photos.length), '/', photos.length);
  } catch (e) { console.log('LICENSE BATCH FAILED', offset, (e as {stderr?: string}).stderr?.slice(-200) ?? String(e).slice(0, 80)); }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
const entryByKey = new Map(entries.map((entry) => [entry.key, entry]));
const remaining = Object.entries(manifest).filter(([, photo]) => photo.kind === 'illustration' || !photo.uri);
for (let offset = 0; offset < remaining.length; offset += 4) {
  const chunk = remaining.slice(offset, offset + 4);
  await Promise.all(chunk.map(async ([key, photo]) => {
    const entry = entryByKey.get(key);
    if (!entry) return;
    try {
      const found = await findCommonsPhoto(`${entry.city.name} ${entry.play.place}`);
      if (!found) return;
      const { page, info, meta } = found;
      const url = info.thumburl || info.url;
      const extension = /\.png(?:\?|$)/i.test(url) ? 'png' : 'jpg';
      const file = `${key}.${extension}`;
      await exec('curl', ['-fsSL', '--http1.1', '--max-filesize', '8000000', '--max-time', '35', url, '-o', resolve(folder, file)]);
      Object.assign(photo, {
        kind: 'photo', uri: `/media/city-plays/${file}`, source: info.descriptionurl,
        page: info.descriptionurl, photoTitle: page.title.replace(/^File:/, ''),
        author: clean(meta.Artist?.value ?? ''), license: meta.LicenseShortName.value,
        licenseUrl: meta.LicenseUrl?.value ?? '', width: info.thumbwidth || info.width,
        height: info.thumbheight || info.height,
      });
    } catch { console.log('SEARCH/DOWNLOAD FAILED', key); }
  }));
  console.log('SEARCH PHOTO', Math.min(offset + 4, remaining.length), '/', remaining.length);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
for (const p of Object.values(manifest)) delete (p as any).download;
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('RESULT', Object.keys(manifest).length, 'photos', Object.values(manifest).filter((v) => v.uri).length);
