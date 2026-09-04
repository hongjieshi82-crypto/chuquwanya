import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(clientRoot, 'public/media/cards/city-reference/hangzhou-master.png');
const outputSvgPath = join(clientRoot, 'public/media/cards/city-reference/hangzhou-final.svg');
const source = readFileSync(sourcePath).toString('base64');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="456" height="418" viewBox="0 0 456 418">
  <defs>
    <radialGradient id="badge-fill" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#24282a"/><stop offset=".58" stop-color="#16191b"/><stop offset="1" stop-color="#0c0e10"/></radialGradient>
    <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".48"/></filter>
  </defs>
  <image href="data:image/png;base64,${source}" width="456" height="418"/>
  <circle cx="391" cy="286" r="57" fill="#0a0c0e"/>
  <g transform="translate(391 286) rotate(4)" filter="url(#badge-shadow)">
    <circle r="49" fill="#090b0d" stroke="#090b0d" stroke-width="3"/>
    <circle r="46" fill="url(#badge-fill)" stroke="#f7f7f2" stroke-opacity=".34" stroke-width="1.2"/>
    <circle r="41.5" fill="none" stroke="#d8ee79" stroke-width="2" stroke-dasharray="4.5 4.5"/>
    <path d="M-37 -34A50 50 0 0 1 42 -26" fill="none" stroke="#f7f7f2" stroke-opacity=".72" stroke-width="2" stroke-linecap="round"/>
    <text y="-8" text-anchor="middle" fill="#f7f7f2" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="15" font-weight="850" letter-spacing="1.2">春秋</text>
    <path d="M-10 1H10" stroke="#d8ee79" stroke-width="1.4" stroke-linecap="round"/>
    <text y="20" text-anchor="middle" fill="#c9ff62" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="13.5" font-weight="900" letter-spacing="1">最佳</text>
  </g>
</svg>`;

writeFileSync(outputSvgPath, svg);
console.log(outputSvgPath);
