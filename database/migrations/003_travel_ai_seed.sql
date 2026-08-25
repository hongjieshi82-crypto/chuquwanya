-- 演示数据：标签、目的地（来自 cities）、景点（来自 activities）

INSERT INTO travel_tags (name, category, sort_order) VALUES
  ('自然风光', 'scene', 1),
  ('历史文化', 'scene', 2),
  ('美食购物', 'food', 3),
  ('亲子游', 'audience', 4),
  ('情侣游', 'audience', 5),
  ('户外运动', 'theme', 6),
  ('城市观光', 'theme', 7),
  ('海岛度假', 'scene', 8),
  ('探索', 'theme', 9),
  ('文艺', 'theme', 10),
  ('治愈', 'theme', 11),
  ('放松', 'theme', 12)
ON DUPLICATE KEY UPDATE category = VALUES(category);

INSERT INTO destinations (city_id, name, province, summary, best_seasons, avg_cost_per_day, rating, popularity, is_hot, is_active)
SELECT
  c.id,
  c.name,
  c.province,
  CONCAT(c.name, ' — 周末轻旅行与深度探索'),
  JSON_ARRAY('春', '秋'),
  300,
  4.60,
  100,
  TRUE,
  TRUE
FROM cities c
WHERE c.is_active = TRUE
  AND NOT EXISTS (SELECT 1 FROM destinations d WHERE d.city_id = c.id);

INSERT INTO attractions (
  destination_id, activity_id, name, summary, description, address,
  latitude, longitude, ticket_price_min, ticket_price_max,
  suggested_duration, suitable_audiences, best_seasons, rating, popularity, is_active
)
SELECT
  d.id,
  a.id,
  a.title,
  a.summary,
  a.description,
  a.address,
  a.latitude,
  a.longitude,
  0,
  a.budget_yuan,
  a.duration_minutes,
  JSON_ARRAY('独自', '双人', '家庭'),
  JSON_ARRAY('春', '夏', '秋', '冬'),
  4.50,
  GREATEST(10, 100 - CAST(a.budget_yuan AS SIGNED)),
  a.is_active
FROM activities a
INNER JOIN destinations d ON d.city_id = a.city_id
WHERE NOT EXISTS (SELECT 1 FROM attractions x WHERE x.activity_id = a.id);

INSERT INTO attraction_tags (attraction_id, tag_id)
SELECT a.id, t.id
FROM attractions a
INNER JOIN activities act ON act.id = a.activity_id
INNER JOIN travel_tags t ON t.name = act.category COLLATE utf8mb4_unicode_ci
WHERE NOT EXISTS (
  SELECT 1 FROM attraction_tags at WHERE at.attraction_id = a.id AND at.tag_id = t.id
);

INSERT INTO attraction_tags (attraction_id, tag_id)
SELECT a.id, t.id
FROM attractions a
INNER JOIN activities act ON act.id = a.activity_id
INNER JOIN travel_tags t ON t.name = act.mood COLLATE utf8mb4_unicode_ci
WHERE NOT EXISTS (
  SELECT 1 FROM attraction_tags at WHERE at.attraction_id = a.id AND at.tag_id = t.id
);
