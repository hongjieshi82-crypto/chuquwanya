import mysql, { type RowDataPacket } from "mysql2/promise";

import { assessContentQuality, type QualityActivity } from "../src/content-quality.js";
import { config } from "../src/config.js";

type ActivityRow = RowDataPacket & QualityActivity & { id: number; title: string; content_status: string };

const args = process.argv.slice(2);
const publishIndex = args.indexOf("--publish");
const activityId = publishIndex >= 0 ? Number(args[publishIndex + 1]) : null;
const connection = await mysql.createConnection(config.database);

try {
  if (activityId !== null) {
    if (!Number.isInteger(activityId) || activityId <= 0) throw new Error("--publish 后需要活动 ID");
    const [rows] = await connection.query<ActivityRow[]>("SELECT * FROM activities WHERE id = ? LIMIT 1", [activityId]);
    const activity = rows[0];
    if (!activity) throw new Error(`未找到活动 ${activityId}`);
    const quality = assessContentQuality(activity);
    await connection.query(
      `UPDATE activities
       SET content_score = ?, quality_issues = CAST(? AS JSON),
           content_status = ?, last_verified_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [quality.score, JSON.stringify(quality.issues), quality.recommendable ? "published" : "review", activityId],
    );
    console.log(`${quality.recommendable ? "已发布" : "仍待审核"}：${activity.title}（${quality.score}分）`);
    if (quality.issues.length) console.log(`待补：${quality.issues.join("、")}`);
  } else {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT c.name AS city,
              COUNT(a.id) AS total,
              COUNT(DISTINCT CASE WHEN a.content_status = 'published' AND a.content_score >= 70 AND a.is_active = TRUE THEN COALESCE(a.place_key, CONCAT(a.city_id, ':', a.address)) END) AS uniquePlaces,
              SUM(CASE WHEN a.content_status = 'published' AND a.content_score >= 70 AND a.is_active = TRUE THEN 1 ELSE 0 END) AS recommendable,
              SUM(CASE WHEN a.content_status IN ('draft','review') THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN a.environment = 'indoor' AND a.content_status = 'published' AND a.content_score >= 70 THEN 1 ELSE 0 END) AS indoor,
              SUM(CASE WHEN a.rain_friendly = 'yes' AND a.content_status = 'published' AND a.content_score >= 70 THEN 1 ELSE 0 END) AS rainFriendly,
              ROUND(AVG(CASE WHEN a.content_status = 'published' THEN a.content_score END), 1) AS averageScore
       FROM cities c
       LEFT JOIN activities a ON a.city_id = c.id AND a.content_status <> 'archived'
       WHERE c.is_active = TRUE
       GROUP BY c.id, c.name
       ORDER BY recommendable ASC, c.id ASC`,
    );
    console.table(rows);
  }
} finally {
  await connection.end();
}
