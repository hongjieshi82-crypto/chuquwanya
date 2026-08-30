import mysql from 'mysql2/promise';

import { config } from '../src/config.js';

const connection = await mysql.createConnection(config.database);
try {
  const [result] = await connection.execute(
    `UPDATE activities
     SET rain_friendly = CASE WHEN environment IN ('indoor','either') THEN 'yes' ELSE 'no' END,
         heat_sensitive = CASE WHEN environment = 'outdoor' THEN 'yes' ELSE 'no' END,
         wind_sensitive = CASE
           WHEN environment = 'outdoor' AND CONCAT(title,' ',summary,' ',description) REGEXP '海|湖|江|河|山|骑行|露营|登高|公园|步道' THEN 'yes'
           ELSE 'no'
         END,
         weather_notes = CASE
           WHEN environment = 'indoor' THEN '室内地点，普通降雨天气下可优先考虑'
           WHEN environment = 'either' THEN '包含室内或有遮蔽区域，恶劣天气仍需现场确认'
           ELSE '户外地点，降雨、高温或大风时需谨慎安排'
         END,
         last_verified_at = CURRENT_TIMESTAMP,
         content_score = CASE WHEN cover_image IS NOT NULL AND cover_image <> '' THEN 85 ELSE 80 END,
         quality_issues = JSON_ARRAY('营业时间未核验','预约要求未核验','预算与建议时长为规则估算'),
         content_status = 'published',
         source_confidence = 70
     WHERE source_type = 'amap' AND content_status = 'review'
       AND address <> '' AND latitude IS NOT NULL AND longitude IS NOT NULL`,
  );
  console.log(`高德内容保守审核完成：发布 ${'affectedRows' in result ? result.affectedRows : 0} 条`);
} finally {
  await connection.end();
}
