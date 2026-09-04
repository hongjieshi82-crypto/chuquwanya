import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const travelDir = join(root, 'public/media/travel');
const outputDir = join(root, 'public/media/cards/cities');

const cities = [
  ['beijing', '北京', '古都人文', ['人文', '治愈'], 'beijing-cbd.jpg', '4.8', '古都轴线与公园绿意交织，适合一场不赶路的城市探索。'],
  ['shanghai', '上海', '都市漫游', ['美食', '人文'], 'shanghai.jpg', '4.9', '从街区漫游到滨江日落，把熟悉的城市换一种打开方式。'],
  ['hangzhou', '杭州', '湖山治愈', ['治愈', '松弛'], 'hangzhou.jpg', '4.9', '湖山、茶园与老街相连，慢慢走就能遇见好风景。'],
  ['shenzhen', '深圳', '山海轻户外', ['轻户外', '海边'], 'shenzhen.jpg', '4.8', '山海公园与年轻街区同框，适合随时出发的小冒险。'],
  ['qingdao', '青岛', '滨海人文', ['海边', '人文'], 'qingdao.jpg', '4.8', '红瓦、海岸与山色相连，适合用半天收集一组海城画面。'],
  ['nanjing', '南京', '古都人文', ['人文', '治愈'], 'nanjing.jpg', '4.8', '梧桐、城墙与秦淮夜色交织，慢走也能读到城市层次。'],
  ['wuhan', '武汉', '江湖漫游', ['轻户外', '人文'], 'wuhan.jpg', '4.8', '江湖相逢，大学与老街并置，适合骑行和夜间漫游。'],
  ['chengdu', '成都', '松弛美食', ['松弛', '美食'], 'chengdu.jpg', '4.9', '在公园、茶馆与街巷之间，体验一座松弛又有活力的城市。'],
  ['xian', '西安', '古都夜游', ['人文', '美食'], 'xian.jpg', '4.9', '城墙、博物馆与夜景相连，用一步一景打开古都。'],
  ['changsha', '长沙', '烟火夜游', ['美食', '人文'], 'changsha.jpg', '4.8', '山水洲城与街头烟火同框，适合热闹又轻松的周末。'],
  ['chongqing', '重庆', '立体城市', ['美食', '轻户外'], 'chongqing.jpg', '4.9', '山城步道、江景与立体交通，让每次转弯都有新视角。'],
  ['xiamen', '厦门', '海岛松弛', ['海边', '治愈'], 'xiamen.jpg', '4.8', '海风、骑楼与岛屿生活并置，适合不赶时间的慢旅行。'],
  ['tianjin', '天津', '建筑人文', ['人文', '美食'], 'tianjin.jpg', '4.7', '在洋楼、海河与旧街之间，收集一组城市建筑色卡。'],
  ['yantai', '烟台', '海岸治愈', ['海边', '治愈'], 'yantai.jpg', '4.8', '沿着海岸线吹风看浪，把周末调成轻松模式。'],
  ['guangzhou', '广州', '岭南生活', ['美食', '人文'], 'guangzhou.jpg', '4.8', '从西关骑楼到珠江夜色，感受岭南生活和创新活力。'],
  ['hefei', '合肥', '科创湖岸', ['轻户外', '亲子'], 'hefei.jpg', '4.7', '湖景、科创园区与城市新中心相连，适合一场未来感漫游。'],
  ['jinan', '济南', '泉城人文', ['治愈', '人文'], 'jinan.jpg', '4.7', '泉水、老城和湖岸串成一条清凉路线，四季都适合散步。'],
  ['kunming', '昆明', '高原慢游', ['治愈', '松弛'], 'kunming.jpg', '4.8', '高原阳光、翠湖与花市交织，把周末过成温柔的慢镜头。'],
];

const seasonBySlug = {
  beijing: '春秋最佳', shanghai: '四季皆宜', hangzhou: '春秋最佳', shenzhen: '秋冬最佳',
  qingdao: '夏秋最佳', nanjing: '秋日限定', wuhan: '春秋最佳', chengdu: '四季皆宜',
  xian: '春秋最佳', changsha: '四季皆宜', chongqing: '秋冬最佳', xiamen: '秋冬最佳',
  tianjin: '四季皆宜', yantai: '夏秋最佳', guangzhou: '秋冬最佳', hefei: '春秋最佳',
  jinan: '春秋最佳', kunming: '春日限定',
};

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const dataUri = (filename) => {
  const extension = extname(filename).slice(1);
  return `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${readFileSync(join(travelDir, filename)).toString('base64')}`;
};

function renderCard([slug, city, category, tags, photo, _rating, description], index) {
  const dotsId = `dots-${slug}`;
  const clipId = `photo-${slug}`;
  const shortDescription = description.length > 25 ? `${description.slice(0, 25)}…` : description;
  const season = seasonBySlug[slug] ?? '四季皆宜';
  const seasonTop = season.slice(0, 2);
  const seasonBottom = season.slice(2);
  const descriptionLineOne = description.slice(0, 15);
  const descriptionLineTwo = description.slice(15, 30);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="940" height="820" viewBox="0 0 940 820">
  <defs>
    <pattern id="${dotsId}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#c9ff62" opacity=".12"/></pattern>
    <clipPath id="${clipId}"><path d="M430 18H940V580L840 625H360Z"/></clipPath>
  </defs>
  <rect width="940" height="820" fill="#090b0e"/>
  <rect width="940" height="820" fill="url(#${dotsId})" opacity=".28"/>
  <image href="${dataUri(photo)}" x="350" y="0" width="590" height="640" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
  <path d="M430 18L360 625H840" fill="none" stroke="#f4f2ea" stroke-opacity=".34" stroke-width="2"/>
  <path d="M32 160C70 174 103 169 136 185S199 196 222 183" fill="none" stroke="#476dff" stroke-opacity=".55" stroke-width="4"/>
  <g transform="translate(28 35) rotate(-4)">
    <path d="M0 13L270 0 286 15 280 88 12 102 0 84Z" fill="#c9ff62"/>
    <path d="M235 0L280 15 250 31Z" fill="#ebff97" opacity=".7"/>
    <circle cx="24" cy="55" r="11" fill="#090b0e"/>
    <text x="49" y="69" fill="#10150c" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="35" font-weight="900">${escapeXml(category)}</text>
  </g>
  <g transform="translate(60 154)">
    <g transform="rotate(-5)"><path d="M4 6L118 0 126 12 120 61 9 67 0 54Z" fill="#101216" stroke="#f7f7f2" stroke-opacity=".7" stroke-width="3"/><text x="63" y="44" text-anchor="middle" fill="#f7f7f2" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="25" font-weight="850">${escapeXml(tags[0])}</text></g>
    <g transform="translate(22 76) rotate(3)"><path d="M4 6L118 0 126 12 120 61 9 67 0 54Z" fill="#101216" stroke="#f7f7f2" stroke-opacity=".7" stroke-width="3"/><text x="63" y="44" text-anchor="middle" fill="#f7f7f2" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="25" font-weight="850">${escapeXml(tags[1])}</text></g>
  </g>
  <g transform="translate(30 600) scale(.7 1)"><text x="0" y="0" fill="#f7f7f2" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="168" font-weight="950" letter-spacing="-16">${escapeXml(city)}</text></g>
  <path d="M34 619C92 600 142 632 220 607S292 625 346 612" fill="none" stroke="#c9ff62" stroke-width="10"/>
  <path d="M58 674V774" stroke="#f7f7f2" stroke-opacity=".35" stroke-width="2"/>
  <text x="84" y="708" fill="#f7f7f2" fill-opacity=".86" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="27">${escapeXml(descriptionLineOne)}</text>
  <text x="84" y="748" fill="#f7f7f2" fill-opacity=".86" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="27">${escapeXml(descriptionLineTwo)}</text>
  <path d="M84 770H430" stroke="#f7f7f2" stroke-opacity=".18" stroke-width="2"/>
  <g transform="translate(805 562) rotate(4)"><circle r="57" fill="#090b0d"/><circle r="50" fill="#171a1c" stroke="#f7f7f2" stroke-opacity=".34" stroke-width="1.5"/><circle r="45" fill="none" stroke="#d8ee79" stroke-width="2.4" stroke-dasharray="5 5"/><path d="M-40 -36A54 54 0 0 1 45 -28" fill="none" stroke="#f7f7f2" stroke-opacity=".72" stroke-width="2.3" stroke-linecap="round"/><text y="-8" text-anchor="middle" fill="#f7f7f2" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="18" font-weight="850" letter-spacing="1.3">${seasonTop}</text><path d="M-12 2H12" stroke="#d8ee79" stroke-width="1.6"/><text y="24" text-anchor="middle" fill="#c9ff62" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="16" font-weight="900" letter-spacing="1">${seasonBottom}</text></g>
  <g transform="translate(572 696) rotate(-2)"><path d="M0 14L306 0 319 12 316 101 8 112 0 99 12 88 0 76 12 64 0 52 12 40 0 28Z" fill="#c9ff62"/><path d="M18 5L48 0 28 23Z" fill="#b2b2a9" opacity=".8"/><text x="45" y="72" fill="#10150c" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="36" font-weight="950">立刻探索</text><path d="M244 56H286M270 39L288 56 270 73" fill="none" stroke="#10150c" stroke-width="8"/></g>
  <g opacity=".7" transform="translate(864 742)"><rect width="6" height="6" fill="#c9ff62"/><rect x="14" width="6" height="6" fill="#c9ff62"/><rect x="28" width="6" height="6" fill="#c9ff62"/><rect y="14" width="6" height="6" fill="#c9ff62"/><rect x="14" y="14" width="6" height="6" fill="#c9ff62"/><rect x="28" y="14" width="6" height="6" fill="#c9ff62"/></g>
</svg>`;
}

mkdirSync(outputDir, { recursive: true });
cities.forEach((city, index) => writeFileSync(join(outputDir, `${city[0]}.svg`), renderCard(city, index)));
console.log(`Generated ${cities.length} city card assets in ${outputDir}`);
