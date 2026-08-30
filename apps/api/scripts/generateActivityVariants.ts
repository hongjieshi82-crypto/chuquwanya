import mysql, { type RowDataPacket } from 'mysql2/promise';

import { buildActivityVariants, type VariantSourceActivity } from '../src/activity-variant.js';
import { config } from '../src/config.js';
import { parseJsonArray } from '../src/types.js';

const connection = await mysql.createConnection(config.database);
try {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT a.id, a.city_id AS cityId, c.name AS cityName, a.address, a.district, a.summary,
            a.description, a.category, a.environment, a.duration_minutes AS durationMinutes,
            a.budget_yuan AS budgetYuan, a.latitude, a.longitude, a.navigation_url AS navigationUrl,
            a.cover_image AS coverImage, a.accent_color AS accentColor, a.tips,
            COALESCE(a.place_key, LOWER(REPLACE(CONCAT(a.city_id, ':', a.address), ' ', ''))) AS placeKey
     FROM activities a
     INNER JOIN cities c ON c.id = a.city_id
     WHERE a.is_active = TRUE AND a.content_status = 'published' AND a.content_score >= 70
       AND a.source_type <> 'derived'
     ORDER BY a.city_id, a.id`,
  );

  let inserted = 0;
  for (const row of rows) {
    const source: VariantSourceActivity = {
      id: Number(row.id), cityId: Number(row.cityId), cityName: String(row.cityName),
      address: String(row.address), district: String(row.district), summary: String(row.summary),
      description: String(row.description), category: String(row.category), environment: row.environment,
      durationMinutes: Number(row.durationMinutes), budgetYuan: Number(row.budgetYuan),
      latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude),
      navigationUrl: row.navigationUrl ? String(row.navigationUrl) : null, coverImage: row.coverImage ? String(row.coverImage) : null,
      accentColor: String(row.accentColor), tips: parseJsonArray(row.tips), placeKey: String(row.placeKey),
    };
    for (const variant of buildActivityVariants(source)) {
      const [existing] = await connection.execute<RowDataPacket[]>("SELECT id FROM activities WHERE city_id = ? AND title = ? LIMIT 1", [variant.cityId, variant.title]);
      if (existing.length) continue;
      await connection.execute(
        `INSERT INTO activities
          (city_id,title,summary,description,category,mood,mood_tags,environment,rain_friendly,heat_sensitive,wind_sensitive,
           min_party_size,max_party_size,duration_minutes,budget_yuan,city_distance_km,district,address,latitude,longitude,
           navigation_url,cover_image,steps,tips,accent_color,is_active,content_status,content_score,quality_issues,
           source_type,source_url,place_key,suitable_periods,source_confidence)
         VALUES (?,?,?,?,?,?,CAST(? AS JSON),?,'unknown','unknown','unknown',1,6,?,?,0,?,?,?,?,?,?,CAST(? AS JSON),CAST(? AS JSON),?,TRUE,'review',65,CAST(? AS JSON),'derived',?,?,CAST(? AS JSON),60)`,
        [variant.cityId, variant.title, variant.summary, variant.description, variant.category, variant.mood, JSON.stringify(variant.moodTags), variant.environment,
          variant.durationMinutes, variant.budgetYuan, variant.district, variant.address, variant.latitude, variant.longitude,
          variant.navigationUrl, variant.coverImage, JSON.stringify(variant.steps), JSON.stringify(variant.tips), variant.accentColor,
          JSON.stringify(['玩法文案待审核', '天气适用性需继承原地点核验']), variant.navigationUrl, variant.placeKey,
          JSON.stringify(variant.environment === 'indoor' ? ['morning','afternoon'] : ['morning','afternoon','evening'])],
      );
      inserted += 1;
    }
  }
  console.log(`玩法变体草稿生成完成：${inserted} 条，均处于 review 状态`);
} finally {
  await connection.end();
}
