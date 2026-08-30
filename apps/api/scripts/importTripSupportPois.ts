import mysql, { type RowDataPacket } from 'mysql2/promise';

import { config } from '../src/config.js';
import { fetchAmapScenicPois, normalizeAmapPoi, type AmapPoi } from '../src/scenic-activity-import.js';

type Kind = 'restaurant' | 'cafe' | 'hotel' | 'nightlife';
const configs: { kind: Kind; types: string; keywords: string[] }[] = [
  { kind: 'restaurant', types: '餐饮服务', keywords: ['餐厅', '特色菜'] },
  { kind: 'cafe', types: '餐饮服务', keywords: ['咖啡'] },
  { kind: 'hotel', types: '住宿服务', keywords: ['五星级酒店', '豪华酒店', '精品酒店'] },
  { kind: 'nightlife', types: '体育休闲服务', keywords: ['酒吧', '剧场'] },
];

function resolveTier(kind: Kind, cost: number | null, name: string) {
  if (kind === 'hotel' && /青年|快捷|驿站|客栈|民宿|如家|汉庭|锦江之星|7天|速8/.test(name)) return 'budget';
  if (/奢华|豪华|五星|臻选|黑珍珠|米其林|丽思|华尔道夫|四季|半岛|瑰丽|柏悦|文华东方|瑞吉|安缦|康莱德/.test(name) || (cost ?? 0) >= 500) return 'luxury';
  if (/精品|高端|艺术|设计/.test(name) || (cost ?? 0) >= 250) return 'premium';
  if ((cost ?? 0) > 0 && (cost ?? 0) <= 80) return 'budget';
  return kind === 'hotel' ? 'premium' : 'standard';
}

const connection = await mysql.createConnection(config.database);
try {
  const [cities] = await connection.query<RowDataPacket[]>('SELECT id,name FROM cities WHERE is_active=TRUE ORDER BY id');
  let inserted = 0;
  for (const city of cities) {
    for (const source of configs) {
      const raw = await fetchAmapScenicPois({ key: config.amap.webServiceKey, city: String(city.name), types: source.types, keywords: source.keywords, pageLimit: 1, offset: 25 });
      let cityKindCount = 0;
      for (const item of raw as AmapPoi[]) {
        if (cityKindCount >= 12) break;
        const poi = normalizeAmapPoi(item);
        if (!poi) continue;
        const address = poi.address ?? `${city.name} · ${poi.name}`;
        await connection.execute(
          `INSERT INTO trip_support_pois
            (city_id,name,kind,tier,address,district,latitude,longitude,avg_price_yuan,tags,cover_image,source_url)
           VALUES (?,?,?,?,?,?,?,?,?,CAST(? AS JSON),?,?)
           ON DUPLICATE KEY UPDATE tier=VALUES(tier),address=VALUES(address),district=VALUES(district),latitude=VALUES(latitude),longitude=VALUES(longitude),avg_price_yuan=VALUES(avg_price_yuan),cover_image=COALESCE(VALUES(cover_image),cover_image),updated_at=CURRENT_TIMESTAMP`,
          [Number(city.id), poi.name, source.kind, resolveTier(source.kind, poi.costYuan, poi.name), address, poi.districtName ?? String(city.name), poi.latitude, poi.longitude, poi.costYuan, JSON.stringify([source.kind, poi.type].filter(Boolean)), poi.coverImage, `https://uri.amap.com/search?keyword=${encodeURIComponent(`${city.name} ${poi.name}`)}`],
        );
        cityKindCount += 1; inserted += 1;
      }
    }
    console.log(`${city.name}：餐饮住宿支持POI已同步`);
  }
  console.log(`行程支持POI导入完成：处理 ${inserted} 条`);
} finally { await connection.end(); }
