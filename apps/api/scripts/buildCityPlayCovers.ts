import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cityPlaySeeds, secondCityChoices, affordableEntertainment } from '../src/city-play-seeds.js';
const manifestPath = resolve('src/city-play-photos.json');
const photos = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, any>;
const folder = resolve('../client/public/media/city-plays');
await mkdir(folder, { recursive: true });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cats = ['约会', '休闲躺平', '娱乐玩乐', '娱乐玩乐', '探险猎奇', '美食吃喝', '美食吃喝', '城市散步', '约会', '休闲躺平', '探险猎奇', '城市散步', '娱乐玩乐'];
const palette = [['#182c32','#99dfd0','#e5c2ab'],['#212b20','#c9ef99','#b6cdcc'],['#342348','#c9acf0','#f1c56d'],['#352a22','#efc994','#a9c7eb']];
let count = 0;
for (const city of cityPlaySeeds) {
  const entries = [...city.plays, ...secondCityChoices[city.id]!, affordableEntertainment[city.id]!];
  for (const [index, play] of entries.entries()) {
    const key = String(820000 + city.id * 100 + index);
    if (photos[key]?.uri && photos[key]?.kind === 'photo') continue;
    const [ink, accent, second] = palette[(city.id + index) % palette.length]!;
    const category = cats[index]!;
    const food = category === '美食吃喝';
    const art = food ? '<ellipse cx="825" cy="490" rx="195" ry="75"/><path d="M635 490q30 155 190 155t190-155M660 410q120-90 310 0M730 325q-45-60 10-110M830 325q-45-60 10-110M920 340q-45-60 10-110"/>' : category === '娱乐玩乐' ? '<circle cx="850" cy="400" r="190"/><circle cx="850" cy="400" r="30"/><path d="M850 210v160m0 60v160M660 400h160m60 0h160M715 265l110 110m45 50 110 110M715 535l110-110m45-50 110-110M850 430 720 680m130-250 130 250"/>' : category === '探险猎奇' ? '<circle cx="845" cy="385" r="160"/><path d="m955 505 120 150M760 350h170M760 400h100M760 300h115"/>' : '<path d="M620 610q120-170 220-70t240-155M610 490q100-90 220-25t230-155M765 260q0-85 85-85t85 85q0 80-85 165-85-85-85-165Z"/><circle cx="850" cy="260" r="30"/>';
    const lines = play.place.match(/.{1,10}/gu) ?? [play.place];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="850" viewBox="0 0 1280 850"><defs><radialGradient id="g"><stop stop-color="${accent}" stop-opacity=".2"/><stop offset="1" stop-color="${ink}" stop-opacity="0"/></radialGradient><pattern id="grid" width="55" height="55" patternUnits="userSpaceOnUse"><path d="M55 0H0V55" fill="none" stroke="${accent}" stroke-opacity=".08"/></pattern></defs><rect width="1280" height="850" fill="${ink}"/><rect width="1280" height="850" fill="url(#grid)"/><circle cx="880" cy="340" r="430" fill="url(#g)"/><rect x="52" y="48" width="1176" height="754" rx="36" fill="none" stroke="${accent}" stroke-opacity=".35"/><g fill="none" stroke="${second}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".9">${art}</g><g font-family="PingFang SC,Microsoft YaHei,sans-serif"><text x="95" y="150" fill="${accent}" font-size="28" letter-spacing="4">${esc(city.name)} / ${esc(category)}</text>${lines.map((s,i)=>`<text x="95" y="${290+i*74}" fill="#f4f4e9" font-weight="700" font-size="58">${esc(s)}</text>`).join('')}<path d="M95 540h340" stroke="${accent}" stroke-width="4"/><text x="95" y="610" fill="${accent}" font-size="24">给下一次出发，留一点期待</text><text x="95" y="740" fill="#c5c9c4" font-size="21">粗去玩鸭 · 玩法主题示意 / 非地点实拍</text></g></svg>`;
    // The UI already presents the activity title. Keep the image quiet on the
    // left so its lettering never collides with the hero title at either width.
    const cleanCover = svg.replace(/<text x="95" y="(?:290|364|438|512|610)"[^>]*>[\s\S]*?<\/text>/g, '');
    await writeFile(resolve(folder, key + '.svg'), cleanCover);
    photos[key] = { ...(photos[key] ?? {}), uri: '/media/city-plays/' + key + '.svg', source: '', author: '粗去玩鸭', license: '原创主题示意', licenseUrl: '', width: 1280, height: 850, kind: 'illustration' };
    count++;
  }
}
await writeFile(manifestPath, JSON.stringify(photos, null, 2) + '\n');
const credits = Object.entries(photos).filter(([, p]) => p.kind === 'photo' && p.author).map(([id, p]) => `<article><h2>${id}</h2><img src="${esc(p.uri)}" alt="${esc(p.photoTitle ?? id)}" loading="lazy"/><p>${esc(p.author)} · <a href="${esc(p.licenseUrl)}">${esc(p.license)}</a></p><a href="${esc(p.source)}">原图与来源</a></article>`).join('');
await writeFile(resolve(folder, 'credits.html'), `<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>城市玩法图片来源</title><style>body{max-width:1000px;margin:30px auto;padding:20px;font:16px/1.7 sans-serif}article{display:inline-block;vertical-align:top;width:280px;margin:16px}img{width:100%;height:170px;object-fit:cover}a{color:#276747}</style><h1>城市玩法图片来源</h1><p>实景图片来自 Wikimedia Commons，作者与许可逐图列出。SVG 为原创主题示意，不表示地点实拍。旧版 travel 目录图片沿用原项目来源记录。</p>${credits}</html>`);
console.log('Illustrated covers created:', count, 'Photo covers:', Object.values(photos).filter((p) => p.kind === 'photo' && p.uri).length);
