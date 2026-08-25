import mysql from "mysql2/promise";

import { activityVectorService } from "../src/activityVector.service.js";
import { config } from "../src/config.js";
import type { ActivityRow } from "../src/types.js";

const connection = await mysql.createConnection(config.database);

try {
  const [rows] = await connection.execute(
    `SELECT
       a.id,
       a.city_id,
       c.name AS city_name,
       a.title,
       a.summary,
       a.description,
       a.category,
       a.mood,
       a.mood_tags,
       a.environment,
       a.min_party_size,
       a.max_party_size,
       a.duration_minutes,
       a.budget_yuan,
       a.city_distance_km,
       a.district,
       a.address,
       a.latitude,
       a.longitude,
       a.navigation_url,
       a.cover_image,
       a.steps,
       a.tips,
       a.accent_color
     FROM activities a
     INNER JOIN cities c ON c.id = a.city_id
     WHERE a.is_active = TRUE
     ORDER BY a.id ASC`,
  );

  const activities = rows as ActivityRow[];
  const result = await activityVectorService.upsertActivities(activities);
  console.log(
    `活动向量同步完成：${result.count}/${activities.length} 条，collection=${activityVectorService.collectionName}`,
  );
} finally {
  await connection.end();
}
