START TRANSACTION;

INSERT INTO cities (name, code, province, is_active)
VALUES
  ('北京', 'beijing', '北京', TRUE),
  ('上海', 'shanghai', '上海', TRUE),
  ('广州', 'guangzhou', '广东', TRUE),
  ('深圳', 'shenzhen', '广东', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  province = VALUES(province),
  is_active = VALUES(is_active);

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9188330,
  a.longitude = 116.3970240,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '故宫博物院';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '故宫博物院',
  '北京故宫博物院：适合1 人, 双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 故宫博物院。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：39.918833, 116.397024。
地点图片文件名：__1_Jingshan_View_of_Forbidden_City_Beijing_9862105446_.jpg。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 故宫博物院',
  39.9188330,
  116.3970240,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%95%85%E5%AE%AB%E5%8D%9A%E7%89%A9%E9%99%A2',
  NULL,
  CAST('["打开地图搜索“北京 故宫博物院”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：__1_Jingshan_View_of_Forbidden_City_Beijing_9862105446_.jpg", "坐标：39.918833, 116.397024"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '故宫博物院'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9979510,
  a.longitude = 116.2818470,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '颐和园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '颐和园',
  '北京颐和园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 颐和园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.997951, 116.281847。
地点图片文件名：__1_2014.08.27.135937_Paiyun_Dian_Foxiang_Ge_Summer_Palace_Beijing.jpg,__2_2014.08.27.142433_Foxiang_Ge_Zihui_Hai_Wanshou_Shan_Summer_Palace_Beijing.jpg。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 颐和园',
  39.9979510,
  116.2818470,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%A2%90%E5%92%8C%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 颐和园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：__1_2014.08.27.135937_Paiyun_Dian_Foxiang_Ge_Summer_Palace_Beijing.jpg,__2_2014.08.27.142433_Foxiang_Ge_Zihui_Hai_Wanshou_Shan_Summer_Palace_Beijing.jpg", "坐标：39.997951, 116.281847"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '颐和园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9258600,
  a.longitude = 116.3966400,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '景山公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '景山公园',
  '北京景山公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 景山公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.925860, 116.396640。
地点图片文件名：__1_Beijing_Jingshan_Park_View_of_Beihai_Park_1991_Skyline_10553715555_.jpg,__2_Beijing_Jingshan_Park_Pavilion_10553770266_.jpg。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 景山公园',
  39.9258600,
  116.3966400,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%99%AF%E5%B1%B1%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 景山公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：__1_Beijing_Jingshan_Park_View_of_Beihai_Park_1991_Skyline_10553715555_.jpg,__2_Beijing_Jingshan_Park_Pavilion_10553770266_.jpg", "坐标：39.925860, 116.396640"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '景山公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 40.0221220,
  a.longitude = 116.3911900,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '奥林匹克森林公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '奥林匹克森林公园',
  '北京奥林匹克森林公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 奥林匹克森林公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：40.022122, 116.391190。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 奥林匹克森林公园',
  40.0221220,
  116.3911900,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%A5%A5%E6%9E%97%E5%8C%B9%E5%85%8B%E6%A3%AE%E6%9E%97%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 奥林匹克森林公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：40.022122, 116.391190"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '奥林匹克森林公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9840630,
  a.longitude = 116.4965360,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '798艺术区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '798艺术区',
  '北京798艺术区：适合1 人, 双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 798艺术区。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.984063, 116.496536。
地点图片文件名：798__1_File_789_art_museum_Unsplash_.jpg.jpg。',
  '文艺',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 798艺术区',
  39.9840630,
  116.4965360,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20798%E8%89%BA%E6%9C%AF%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“北京 798艺术区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：798__1_File_789_art_museum_Unsplash_.jpg.jpg", "坐标：39.984063, 116.496536"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '798艺术区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 2,
  a.budget_yuan = 100,
  a.latitude = 40.0423400,
  a.longitude = 116.4998330,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '红砖美术馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '红砖美术馆',
  '北京红砖美术馆：适合1 人, 双人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 红砖美术馆。
适合人数：1 人, 双人；人均预算：50-100。
心情标签：放松, 探索。
坐标：40.042340, 116.499833。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'indoor',
  1,
  2,
  180,
  100,
  0,
  '北京',
  '北京 · 红砖美术馆',
  40.0423400,
  116.4998330,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E7%BA%A2%E7%A0%96%E7%BE%8E%E6%9C%AF%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 红砖美术馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：40.042340, 116.499833"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '红砖美术馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9483940,
  a.longitude = 116.4126100,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '五道营胡同';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '五道营胡同',
  '北京五道营胡同：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 五道营胡同。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：39.948394, 116.412610。',
  '美食',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 五道营胡同',
  39.9483940,
  116.4126100,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%BA%94%E9%81%93%E8%90%A5%E8%83%A1%E5%90%8C',
  NULL,
  CAST('["打开地图搜索“北京 五道营胡同”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.948394, 116.412610"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '五道营胡同'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9373550,
  a.longitude = 116.3963090,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '什刹海';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '什刹海',
  '北京什刹海：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 什刹海。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索, 热闹。
坐标：39.937355, 116.396309。
地点图片文件名：__1_2014.09.04.154246_Houhai_Lake_Beijing.jpg,__2_2014.09.04.154526_Xiaoshibei_Hutong_beijing.jpg。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 什刹海',
  39.9373550,
  116.3963090,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%BB%80%E5%88%B9%E6%B5%B7',
  NULL,
  CAST('["打开地图搜索“北京 什刹海”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：__1_2014.09.04.154246_Houhai_Lake_Beijing.jpg,__2_2014.09.04.154526_Xiaoshibei_Hutong_beijing.jpg", "坐标：39.937355, 116.396309"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '什刹海'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9484910,
  a.longitude = 116.4672180,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '亮马河国际风情水岸';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '亮马河国际风情水岸',
  '北京亮马河国际风情水岸：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 亮马河国际风情水岸。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索, 热闹。
坐标：39.948491, 116.467218。
地点图片文件名：Liangma_River_1__.jpg。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 亮马河国际风情水岸',
  39.9484910,
  116.4672180,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%BA%AE%E9%A9%AC%E6%B2%B3%E5%9B%BD%E9%99%85%E9%A3%8E%E6%83%85%E6%B0%B4%E5%B2%B8',
  NULL,
  CAST('["打开地图搜索“北京 亮马河国际风情水岸”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：Liangma_River_1__.jpg", "坐标：39.948491, 116.467218"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '亮马河国际风情水岸'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 2,
  a.budget_yuan = 50,
  a.latitude = 39.9250330,
  a.longitude = 116.4107900,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国美术馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '中国美术馆',
  '北京中国美术馆：适合1 人, 双人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 中国美术馆。
适合人数：1 人, 双人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.925033, 116.410790。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'indoor',
  1,
  2,
  180,
  50,
  0,
  '北京',
  '北京 · 中国美术馆',
  39.9250330,
  116.4107900,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%AD%E5%9B%BD%E7%BE%8E%E6%9C%AF%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 中国美术馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.925033, 116.410790"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '中国美术馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9159040,
  a.longitude = 116.1547300,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '首钢园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '首钢园',
  '北京首钢园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 首钢园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.915904, 116.154730。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 首钢园',
  39.9159040,
  116.1547300,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%A6%96%E9%92%A2%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 首钢园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.915904, 116.154730"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '首钢园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8791840,
  a.longitude = 116.1770540,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国园林博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '中国园林博物馆',
  '北京中国园林博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 中国园林博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.879184, 116.177054。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 中国园林博物馆',
  39.8791840,
  116.1770540,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%AD%E5%9B%BD%E5%9B%AD%E6%9E%97%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 中国园林博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.879184, 116.177054"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '中国园林博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.8979550,
  a.longitude = 116.3961900,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京坊';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京坊',
  '北京坊：适合双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京坊。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：39.897955, 116.396190。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 北京坊',
  39.8979550,
  116.3961900,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E5%9D%8A',
  NULL,
  CAST('["打开地图搜索“北京 北京坊”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.897955, 116.396190"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京坊'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 39.9349110,
  a.longitude = 116.4543840,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '三里屯太古里';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '三里屯太古里',
  '北京三里屯太古里：适合双人, 多人，预算100以上，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 三里屯太古里。
适合人数：双人, 多人；人均预算：100以上。
心情标签：探索, 热闹。
坐标：39.934911, 116.454384。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  200,
  0,
  '北京',
  '北京 · 三里屯太古里',
  39.9349110,
  116.4543840,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%89%E9%87%8C%E5%B1%AF%E5%A4%AA%E5%8F%A4%E9%87%8C',
  NULL,
  CAST('["打开地图搜索“北京 三里屯太古里”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.934911, 116.454384"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '三里屯太古里'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8813090,
  a.longitude = 116.4091120,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '天坛公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '天坛公园',
  '北京天坛公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 天坛公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.881309, 116.409112。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 天坛公园',
  39.8813090,
  116.4091120,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%A4%A9%E5%9D%9B%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 天坛公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.881309, 116.409112"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '天坛公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9277990,
  a.longitude = 116.3887000,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北海公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北海公园',
  '北京北海公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北海公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.927799, 116.388700。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 北海公园',
  39.9277990,
  116.3887000,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E6%B5%B7%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 北海公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.927799, 116.388700"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北海公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9105190,
  a.longitude = 116.3931450,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中山公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '中山公园',
  '北京中山公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 中山公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：39.910519, 116.393145。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 中山公园',
  39.9105190,
  116.3931450,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%AD%E5%B1%B1%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 中山公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：39.910519, 116.393145"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '中山公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8753060,
  a.longitude = 116.3832900,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '陶然亭公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '陶然亭公园',
  '北京陶然亭公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 陶然亭公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：39.875306, 116.383290。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 陶然亭公园',
  39.8753060,
  116.3832900,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%99%B6%E7%84%B6%E4%BA%AD%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 陶然亭公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：39.875306, 116.383290"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '陶然亭公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9170940,
  a.longitude = 116.3201360,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '玉渊潭公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '玉渊潭公园',
  '北京玉渊潭公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 玉渊潭公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：39.917094, 116.320136。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 玉渊潭公园',
  39.9170940,
  116.3201360,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E7%8E%89%E6%B8%8A%E6%BD%AD%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 玉渊潭公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：39.917094, 116.320136"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '玉渊潭公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9457110,
  a.longitude = 116.4820490,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '朝阳公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '朝阳公园',
  '北京朝阳公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 朝阳公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 热闹。
坐标：39.945711, 116.482049。',
  '惊喜',
  '放松',
  CAST('["放松", "热闹"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 朝阳公园',
  39.9457110,
  116.4820490,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%9C%9D%E9%98%B3%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 朝阳公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 热闹", "原始图片文件名：未配置", "坐标：39.945711, 116.482049"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '朝阳公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9424890,
  a.longitude = 116.3183780,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '紫竹院公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '紫竹院公园',
  '北京紫竹院公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 紫竹院公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：39.942489, 116.318378。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 紫竹院公园',
  39.9424890,
  116.3183780,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E7%B4%AB%E7%AB%B9%E9%99%A2%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 紫竹院公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：39.942489, 116.318378"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '紫竹院公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9906940,
  a.longitude = 116.1875380,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '香山公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '香山公园',
  '北京香山公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 香山公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.990694, 116.187538。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 香山公园',
  39.9906940,
  116.1875380,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%A6%99%E5%B1%B1%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 香山公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.990694, 116.187538"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '香山公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 40.0030630,
  a.longitude = 116.2089010,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '国家植物园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '国家植物园',
  '北京国家植物园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 国家植物园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：40.003063, 116.208901。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 国家植物园',
  40.0030630,
  116.2089010,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%9B%BD%E5%AE%B6%E6%A4%8D%E7%89%A9%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 国家植物园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：40.003063, 116.208901"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '国家植物园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '热闹',
  a.mood_tags = CAST('["热闹", "探索"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9423570,
  a.longitude = 116.3356840,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京动物园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京动物园',
  '北京动物园：适合双人, 多人，预算50-100，心情标签：热闹、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京动物园。
适合人数：双人, 多人；人均预算：50-100。
心情标签：热闹, 探索。
坐标：39.942357, 116.335684。',
  '惊喜',
  '热闹',
  CAST('["热闹", "探索"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 北京动物园',
  39.9423570,
  116.3356840,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E5%8A%A8%E7%89%A9%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 北京动物园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：热闹、探索"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：热闹, 探索", "原始图片文件名：未配置", "坐标：39.942357, 116.335684"]' AS JSON),
  '#F6B73C',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京动物园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9469830,
  a.longitude = 116.4172510,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '雍和宫';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '雍和宫',
  '北京雍和宫：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 雍和宫。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.946983, 116.417251。',
  '探索',
  '探索',
  CAST('["探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 雍和宫',
  39.9469830,
  116.4172510,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%9B%8D%E5%92%8C%E5%AE%AB',
  NULL,
  CAST('["打开地图搜索“北京 雍和宫”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.946983, 116.417251"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '雍和宫'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9465220,
  a.longitude = 116.4145550,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '孔庙和国子监博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '孔庙和国子监博物馆',
  '北京孔庙和国子监博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 孔庙和国子监博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.946522, 116.414555。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 孔庙和国子监博物馆',
  39.9465220,
  116.4145550,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%AD%94%E5%BA%99%E5%92%8C%E5%9B%BD%E5%AD%90%E7%9B%91%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 孔庙和国子监博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.946522, 116.414555"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '孔庙和国子监博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9407190,
  a.longitude = 116.3959900,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '鼓楼';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '鼓楼',
  '北京鼓楼：适合1 人, 双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 鼓楼。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.940719, 116.395990。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 鼓楼',
  39.9407190,
  116.3959900,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%BC%93%E6%A5%BC',
  NULL,
  CAST('["打开地图搜索“北京 鼓楼”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.940719, 116.395990"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '鼓楼'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9424510,
  a.longitude = 116.3958840,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '钟楼';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '钟楼',
  '北京钟楼：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 钟楼。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.942451, 116.395884。',
  '惊喜',
  '探索',
  CAST('["探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 钟楼',
  39.9424510,
  116.3958840,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%92%9F%E6%A5%BC',
  NULL,
  CAST('["打开地图搜索“北京 钟楼”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.942451, 116.395884"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '钟楼'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9390510,
  a.longitude = 116.3948490,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '烟袋斜街';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '烟袋斜街',
  '北京烟袋斜街：适合1 人, 双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 烟袋斜街。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.939051, 116.394849。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 烟袋斜街',
  39.9390510,
  116.3948490,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E7%83%9F%E8%A2%8B%E6%96%9C%E8%A1%97',
  NULL,
  CAST('["打开地图搜索“北京 烟袋斜街”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.939051, 116.394849"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '烟袋斜街'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9337140,
  a.longitude = 116.4039350,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '南锣鼓巷';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '南锣鼓巷',
  '北京南锣鼓巷：适合双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 南锣鼓巷。
适合人数：双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.933714, 116.403935。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  2,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 南锣鼓巷',
  39.9337140,
  116.4039350,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8D%97%E9%94%A3%E9%BC%93%E5%B7%B7',
  NULL,
  CAST('["打开地图搜索“北京 南锣鼓巷”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.933714, 116.403935"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '南锣鼓巷'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9026130,
  a.longitude = 116.4096000,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '东交民巷';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '东交民巷',
  '北京东交民巷：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 东交民巷。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.902613, 116.409600。',
  '美食',
  '探索',
  CAST('["探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 东交民巷',
  39.9026130,
  116.4096000,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%9C%E4%BA%A4%E6%B0%91%E5%B7%B7',
  NULL,
  CAST('["打开地图搜索“北京 东交民巷”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.902613, 116.409600"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '东交民巷'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8951110,
  a.longitude = 116.3981860,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '前门大街';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '前门大街',
  '北京前门大街：适合双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 前门大街。
适合人数：双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.895111, 116.398186。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  2,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 前门大街',
  39.8951110,
  116.3981860,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%89%8D%E9%97%A8%E5%A4%A7%E8%A1%97',
  NULL,
  CAST('["打开地图搜索“北京 前门大街”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.895111, 116.398186"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '前门大街'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8958990,
  a.longitude = 116.3964110,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '大栅栏';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '大栅栏',
  '北京大栅栏：适合双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 大栅栏。
适合人数：双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.895899, 116.396411。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 大栅栏',
  39.8958990,
  116.3964110,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%A4%A7%E6%A0%85%E6%A0%8F',
  NULL,
  CAST('["打开地图搜索“北京 大栅栏”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.895899, 116.396411"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '大栅栏'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9041230,
  a.longitude = 116.3976820,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '天安门广场';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '天安门广场',
  '北京天安门广场：适合1 人, 双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 天安门广场。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.904123, 116.397682。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 天安门广场',
  39.9041230,
  116.3976820,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%A4%A9%E5%AE%89%E9%97%A8%E5%B9%BF%E5%9C%BA',
  NULL,
  CAST('["打开地图搜索“北京 天安门广场”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.904123, 116.397682"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '天安门广场'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9051490,
  a.longitude = 116.4016320,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国国家博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '中国国家博物馆',
  '北京中国国家博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 中国国家博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.905149, 116.401632。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 中国国家博物馆',
  39.9051490,
  116.4016320,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%AD%E5%9B%BD%E5%9B%BD%E5%AE%B6%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 中国国家博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.905149, 116.401632"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '中国国家博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9047450,
  a.longitude = 116.3897830,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '国家大剧院';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '国家大剧院',
  '北京国家大剧院：适合1 人, 双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 国家大剧院。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：39.904745, 116.389783。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 国家大剧院',
  39.9047450,
  116.3897830,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%9B%BD%E5%AE%B6%E5%A4%A7%E5%89%A7%E9%99%A2',
  NULL,
  CAST('["打开地图搜索“北京 国家大剧院”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.904745, 116.389783"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '国家大剧院'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9063460,
  a.longitude = 116.3420250,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '首都博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '首都博物馆',
  '北京首都博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 首都博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.906346, 116.342025。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 首都博物馆',
  39.9063460,
  116.3420250,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E9%A6%96%E9%83%BD%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 首都博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.906346, 116.342025"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '首都博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8853930,
  a.longitude = 116.4006450,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京自然博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京自然博物馆',
  '北京自然博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京自然博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.885393, 116.400645。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 北京自然博物馆',
  39.8853930,
  116.4006450,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E8%87%AA%E7%84%B6%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 北京自然博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.885393, 116.400645"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京自然博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9369950,
  a.longitude = 116.3370320,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京天文馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京天文馆',
  '北京天文馆：适合1 人, 双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京天文馆。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：39.936995, 116.337032。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 北京天文馆',
  39.9369950,
  116.3370320,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E5%A4%A9%E6%96%87%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 北京天文馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.936995, 116.337032"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京天文馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 40.0058760,
  a.longitude = 116.3987860,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国科学技术馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '中国科学技术馆',
  '北京中国科学技术馆：适合1 人, 双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 中国科学技术馆。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：40.005876, 116.398786。',
  '文艺',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 中国科学技术馆',
  40.0058760,
  116.3987860,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%AD%E5%9B%BD%E7%A7%91%E5%AD%A6%E6%8A%80%E6%9C%AF%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 中国科学技术馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：40.005876, 116.398786"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '中国科学技术馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9963250,
  a.longitude = 116.5211390,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国电影博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '中国电影博物馆',
  '北京中国电影博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 中国电影博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.996325, 116.521139。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 中国电影博物馆',
  39.9963250,
  116.5211390,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%AD%E5%9B%BD%E7%94%B5%E5%BD%B1%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 中国电影博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.996325, 116.521139"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '中国电影博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.8287760,
  a.longitude = 116.3022300,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京汽车博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京汽车博物馆',
  '北京汽车博物馆：适合1 人, 双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京汽车博物馆。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：39.828776, 116.302230。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 北京汽车博物馆',
  39.8287760,
  116.3022300,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E6%B1%BD%E8%BD%A6%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 北京汽车博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.828776, 116.302230"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京汽车博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9972040,
  a.longitude = 116.5157100,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国铁道博物馆东郊馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '中国铁道博物馆东郊馆',
  '北京中国铁道博物馆东郊馆：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 中国铁道博物馆东郊馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.997204, 116.515710。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 中国铁道博物馆东郊馆',
  39.9972040,
  116.5157100,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%B8%AD%E5%9B%BD%E9%93%81%E9%81%93%E5%8D%9A%E7%89%A9%E9%A6%86%E4%B8%9C%E9%83%8A%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 中国铁道博物馆东郊馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.997204, 116.515710"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '中国铁道博物馆东郊馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9840130,
  a.longitude = 116.4952430,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = 'UCCA尤伦斯当代艺术中心';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  'UCCA尤伦斯当代艺术中心',
  '北京UCCA尤伦斯当代艺术中心：适合1 人, 双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · UCCA尤伦斯当代艺术中心。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：39.984013, 116.495243。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · UCCA尤伦斯当代艺术中心',
  39.9840130,
  116.4952430,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20UCCA%E5%B0%A4%E4%BC%A6%E6%96%AF%E5%BD%93%E4%BB%A3%E8%89%BA%E6%9C%AF%E4%B8%AD%E5%BF%83',
  NULL,
  CAST('["打开地图搜索“北京 UCCA尤伦斯当代艺术中心”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.984013, 116.495243"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = 'UCCA尤伦斯当代艺术中心'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.8999670,
  a.longitude = 116.4676730,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '今日美术馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '今日美术馆',
  '北京今日美术馆：适合1 人, 双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 今日美术馆。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：39.899967, 116.467673。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 今日美术馆',
  39.8999670,
  116.4676730,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E4%BB%8A%E6%97%A5%E7%BE%8E%E6%9C%AF%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 今日美术馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.899967, 116.467673"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '今日美术馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9885260,
  a.longitude = 116.4937940,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京民生现代美术馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京民生现代美术馆',
  '北京民生现代美术馆：适合1 人, 双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京民生现代美术馆。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：39.988526, 116.493794。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 北京民生现代美术馆',
  39.9885260,
  116.4937940,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E6%B0%91%E7%94%9F%E7%8E%B0%E4%BB%A3%E7%BE%8E%E6%9C%AF%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 北京民生现代美术馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.988526, 116.493794"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京民生现代美术馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9249210,
  a.longitude = 116.3632360,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '白塔寺';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '白塔寺',
  '北京白塔寺：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 白塔寺。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.924921, 116.363236。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 白塔寺',
  39.9249210,
  116.3632360,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E7%99%BD%E5%A1%94%E5%AF%BA',
  NULL,
  CAST('["打开地图搜索“北京 白塔寺”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.924921, 116.363236"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '白塔寺'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8848820,
  a.longitude = 116.3700140,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '法源寺';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '法源寺',
  '北京法源寺：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 法源寺。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.884882, 116.370014。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 法源寺',
  39.8848820,
  116.3700140,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%B3%95%E6%BA%90%E5%AF%BA',
  NULL,
  CAST('["打开地图搜索“北京 法源寺”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.884882, 116.370014"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '法源寺'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9253150,
  a.longitude = 116.3787520,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '西什库教堂';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '西什库教堂',
  '北京西什库教堂：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 西什库教堂。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.925315, 116.378752。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 西什库教堂',
  39.9253150,
  116.3787520,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E8%A5%BF%E4%BB%80%E5%BA%93%E6%95%99%E5%A0%82',
  NULL,
  CAST('["打开地图搜索“北京 西什库教堂”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.925315, 116.378752"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '西什库教堂'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8955900,
  a.longitude = 116.3920900,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '杨梅竹斜街';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '杨梅竹斜街',
  '北京杨梅竹斜街：适合1 人, 双人, 多人，预算0-50，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 杨梅竹斜街。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索, 热闹。
坐标：39.895590, 116.392090。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 杨梅竹斜街',
  39.8955900,
  116.3920900,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%9D%A8%E6%A2%85%E7%AB%B9%E6%96%9C%E8%A1%97',
  NULL,
  CAST('["打开地图搜索“北京 杨梅竹斜街”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：39.895590, 116.392090"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '杨梅竹斜街'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.9255310,
  a.longitude = 116.3585100,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京鲁迅博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京鲁迅博物馆',
  '北京鲁迅博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京鲁迅博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：探索。
坐标：39.925531, 116.358510。',
  '文艺',
  '探索',
  CAST('["探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 北京鲁迅博物馆',
  39.9255310,
  116.3585100,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E9%B2%81%E8%BF%85%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“北京 北京鲁迅博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：39.925531, 116.358510"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京鲁迅博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.8716510,
  a.longitude = 116.3562580,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京大观园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京大观园',
  '北京大观园：适合1 人, 双人, 多人，预算50-100，心情标签：探索、放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京大观园。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索, 放松。
坐标：39.871651, 116.356258。',
  '探索',
  '探索',
  CAST('["探索", "放松"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 北京大观园',
  39.8716510,
  116.3562580,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E5%A4%A7%E8%A7%82%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 北京大观园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 放松", "原始图片文件名：未配置", "坐标：39.871651, 116.356258"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京大观园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.7771900,
  a.longitude = 116.4641790,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '南海子公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '南海子公园',
  '北京南海子公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 南海子公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.777190, 116.464179。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 南海子公园',
  39.7771900,
  116.4641790,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8D%97%E6%B5%B7%E5%AD%90%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 南海子公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.777190, 116.464179"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '南海子公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8708220,
  a.longitude = 116.7467610,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '大运河森林公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '大运河森林公园',
  '北京大运河森林公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 大运河森林公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：39.870822, 116.746761。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 大运河森林公园',
  39.8708220,
  116.7467610,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%A4%A7%E8%BF%90%E6%B2%B3%E6%A3%AE%E6%9E%97%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 大运河森林公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：39.870822, 116.746761"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '大运河森林公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 39.8730120,
  a.longitude = 116.7263610,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '城市绿心森林公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '城市绿心森林公园',
  '北京城市绿心森林公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 城市绿心森林公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：39.873012, 116.726361。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 城市绿心森林公园',
  39.8730120,
  116.7263610,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%9F%8E%E5%B8%82%E7%BB%BF%E5%BF%83%E6%A3%AE%E6%9E%97%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 城市绿心森林公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.873012, 116.726361"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '城市绿心森林公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 40.0290160,
  a.longitude = 116.2539990,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '百望山森林公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '百望山森林公园',
  '北京百望山森林公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 百望山森林公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：40.029016, 116.253999。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '北京',
  '北京 · 百望山森林公园',
  40.0290160,
  116.2539990,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E7%99%BE%E6%9C%9B%E5%B1%B1%E6%A3%AE%E6%9E%97%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 百望山森林公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：40.029016, 116.253999"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '百望山森林公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 40.1057030,
  a.longitude = 116.0819550,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '凤凰岭自然风景区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '凤凰岭自然风景区',
  '北京凤凰岭自然风景区：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 凤凰岭自然风景区。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：40.105703, 116.081955。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 凤凰岭自然风景区',
  40.1057030,
  116.0819550,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%87%A4%E5%87%B0%E5%B2%AD%E8%87%AA%E7%84%B6%E9%A3%8E%E6%99%AF%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“北京 凤凰岭自然风景区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：40.105703, 116.081955"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '凤凰岭自然风景区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 40.4148230,
  a.longitude = 115.8498780,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京野鸭湖国家湿地公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京野鸭湖国家湿地公园',
  '北京野鸭湖国家湿地公园：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京野鸭湖国家湿地公园。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：40.414823, 115.849878。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 北京野鸭湖国家湿地公园',
  40.4148230,
  115.8498780,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E9%87%8E%E9%B8%AD%E6%B9%96%E5%9B%BD%E5%AE%B6%E6%B9%BF%E5%9C%B0%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“北京 北京野鸭湖国家湿地公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：40.414823, 115.849878"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京野鸭湖国家湿地公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.9041260,
  a.longitude = 116.0306830,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '潭柘寺';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '潭柘寺',
  '北京潭柘寺：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 潭柘寺。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：39.904126, 116.030683。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 潭柘寺',
  39.9041260,
  116.0306830,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%BD%AD%E6%9F%98%E5%AF%BA',
  NULL,
  CAST('["打开地图搜索“北京 潭柘寺”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.904126, 116.030683"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '潭柘寺'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 39.8697900,
  a.longitude = 116.0861170,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '戒台寺';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '戒台寺',
  '北京戒台寺：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 戒台寺。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：39.869790, 116.086117。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 戒台寺',
  39.8697900,
  116.0861170,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%88%92%E5%8F%B0%E5%AF%BA',
  NULL,
  CAST('["打开地图搜索“北京 戒台寺”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：39.869790, 116.086117"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '戒台寺'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 40.4355700,
  a.longitude = 116.5693320,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '慕田峪长城';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '慕田峪长城',
  '北京慕田峪长城：适合双人, 多人，预算100以上，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 慕田峪长城。
适合人数：双人, 多人；人均预算：100以上。
心情标签：探索, 热闹。
坐标：40.435570, 116.569332。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  2,
  6,
  180,
  200,
  0,
  '北京',
  '北京 · 慕田峪长城',
  40.4355700,
  116.5693320,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E6%85%95%E7%94%B0%E5%B3%AA%E9%95%BF%E5%9F%8E',
  NULL,
  CAST('["打开地图搜索“北京 慕田峪长城”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：40.435570, 116.569332"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '慕田峪长城'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 40.3616090,
  a.longitude = 116.0112560,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '八达岭长城';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '八达岭长城',
  '北京八达岭长城：适合双人, 多人，预算100以上，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 八达岭长城。
适合人数：双人, 多人；人均预算：100以上。
心情标签：探索, 热闹。
坐标：40.361609, 116.011256。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  2,
  6,
  180,
  200,
  0,
  '北京',
  '北京 · 八达岭长城',
  40.3616090,
  116.0112560,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%85%AB%E8%BE%BE%E5%B2%AD%E9%95%BF%E5%9F%8E',
  NULL,
  CAST('["打开地图搜索“北京 八达岭长城”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：40.361609, 116.011256"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '八达岭长城'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 40.2896310,
  a.longitude = 116.0764530,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '居庸关长城';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '居庸关长城',
  '北京居庸关长城：适合双人, 多人，预算50-100，心情标签：探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 居庸关长城。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索。
坐标：40.289631, 116.076453。',
  '惊喜',
  '探索',
  CAST('["探索"]' AS JSON),
  'outdoor',
  2,
  6,
  180,
  100,
  0,
  '北京',
  '北京 · 居庸关长城',
  40.2896310,
  116.0764530,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%B1%85%E5%BA%B8%E5%85%B3%E9%95%BF%E5%9F%8E',
  NULL,
  CAST('["打开地图搜索“北京 居庸关长城”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索", "原始图片文件名：未配置", "坐标：40.289631, 116.076453"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '居庸关长城'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '热闹',
  a.mood_tags = CAST('["热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 39.8679990,
  a.longitude = 116.4945040,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京欢乐谷';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京欢乐谷',
  '北京欢乐谷：适合双人, 多人，预算100以上，心情标签：热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：北京 · 北京欢乐谷。
适合人数：双人, 多人；人均预算：100以上。
心情标签：热闹。
坐标：39.867999, 116.494504。',
  '惊喜',
  '热闹',
  CAST('["热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  200,
  0,
  '北京',
  '北京 · 北京欢乐谷',
  39.8679990,
  116.4945040,
  'https://uri.amap.com/search?keyword=%E5%8C%97%E4%BA%AC%20%E5%8C%97%E4%BA%AC%E6%AC%A2%E4%B9%90%E8%B0%B7',
  NULL,
  CAST('["打开地图搜索“北京 北京欢乐谷”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：热闹", "原始图片文件名：未配置", "坐标：39.867999, 116.494504"]' AS JSON),
  '#F6B73C',
  TRUE
FROM cities c
WHERE c.name = '北京'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京欢乐谷'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 31.2333560,
  a.longitude = 121.4921080,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '外滩';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '外滩',
  '上海外滩：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 外滩。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索, 热闹。
坐标：31.233356, 121.492108。
地点图片文件名：____1__.jpg,____2__2024.3.jpg。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '上海',
  '上海 · 外滩',
  31.2333560,
  121.4921080,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E5%A4%96%E6%BB%A9',
  NULL,
  CAST('["打开地图搜索“上海 外滩”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：____1__.jpg,____2__2024.3.jpg", "坐标：31.233356, 121.492108"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '外滩'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2095370,
  a.longitude = 121.4407060,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '武康路历史文化风貌区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '武康路历史文化风貌区',
  '上海武康路历史文化风貌区：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 武康路历史文化风貌区。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：31.209537, 121.440706。
地点图片文件名：____1_Duan-ShangHai-WuKang.jpg。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · 武康路历史文化风貌区',
  31.2095370,
  121.4407060,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E6%AD%A6%E5%BA%B7%E8%B7%AF%E5%8E%86%E5%8F%B2%E6%96%87%E5%8C%96%E9%A3%8E%E8%B2%8C%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“上海 武康路历史文化风貌区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：____1_Duan-ShangHai-WuKang.jpg", "坐标：31.209537, 121.440706"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '武康路历史文化风貌区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2153640,
  a.longitude = 121.4484720,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '安福路';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '安福路',
  '上海安福路：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 安福路。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索, 热闹。
坐标：31.215364, 121.448472。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · 安福路',
  31.2153640,
  121.4484720,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E5%AE%89%E7%A6%8F%E8%B7%AF',
  NULL,
  CAST('["打开地图搜索“上海 安福路”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：未配置", "坐标：31.215364, 121.448472"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '安福路'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2232050,
  a.longitude = 121.4434000,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '愚园路历史风貌街区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '愚园路历史风貌街区',
  '上海愚园路历史风貌街区：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 愚园路历史风貌街区。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：31.223205, 121.443400。',
  '美食',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · 愚园路历史风貌街区',
  31.2232050,
  121.4434000,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E6%84%9A%E5%9B%AD%E8%B7%AF%E5%8E%86%E5%8F%B2%E9%A3%8E%E8%B2%8C%E8%A1%97%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“上海 愚园路历史风貌街区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：31.223205, 121.443400"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '愚园路历史风貌街区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2141370,
  a.longitude = 121.4689820,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '思南公馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '思南公馆',
  '上海思南公馆：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 思南公馆。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：31.214137, 121.468982。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · 思南公馆',
  31.2141370,
  121.4689820,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E6%80%9D%E5%8D%97%E5%85%AC%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“上海 思南公馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：31.214137, 121.468982"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '思南公馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 31.2445560,
  a.longitude = 121.4693250,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '苏州河滨水步道';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '苏州河滨水步道',
  '上海苏州河滨水步道：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 苏州河滨水步道。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：31.244556, 121.469325。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '上海',
  '上海 · 苏州河滨水步道',
  31.2445560,
  121.4693250,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E8%8B%8F%E5%B7%9E%E6%B2%B3%E6%BB%A8%E6%B0%B4%E6%AD%A5%E9%81%93',
  NULL,
  CAST('["打开地图搜索“上海 苏州河滨水步道”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：31.244556, 121.469325"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '苏州河滨水步道'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 31.2504460,
  a.longitude = 121.4983320,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '北外滩滨江绿地';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北外滩滨江绿地',
  '上海北外滩滨江绿地：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 北外滩滨江绿地。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索, 热闹。
坐标：31.250446, 121.498332。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '上海',
  '上海 · 北外滩滨江绿地',
  31.2504460,
  121.4983320,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E5%8C%97%E5%A4%96%E6%BB%A9%E6%BB%A8%E6%B1%9F%E7%BB%BF%E5%9C%B0',
  NULL,
  CAST('["打开地图搜索“上海 北外滩滨江绿地”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：未配置", "坐标：31.250446, 121.498332"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北外滩滨江绿地'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2481010,
  a.longitude = 121.4493610,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = 'M50创意园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  'M50创意园',
  '上海M50创意园：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · M50创意园。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：31.248101, 121.449361。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · M50创意园',
  31.2481010,
  121.4493610,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20M50%E5%88%9B%E6%84%8F%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“上海 M50创意园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：31.248101, 121.449361"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = 'M50创意园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 31.1859760,
  a.longitude = 121.4677810,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '徐汇滨江';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '徐汇滨江',
  '上海徐汇滨江：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 徐汇滨江。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索, 热闹。
坐标：31.185976, 121.467781。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '上海',
  '上海 · 徐汇滨江',
  31.1859760,
  121.4677810,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E5%BE%90%E6%B1%87%E6%BB%A8%E6%B1%9F',
  NULL,
  CAST('["打开地图搜索“上海 徐汇滨江”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：未配置", "坐标：31.185976, 121.467781"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '徐汇滨江'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2265260,
  a.longitude = 121.4912560,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '豫园商城';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '豫园商城',
  '上海豫园商城：适合双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 豫园商城。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：31.226526, 121.491256。
地点图片文件名：____1_Shanghai_Yu_Garden.jpg。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · 豫园商城',
  31.2265260,
  121.4912560,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E8%B1%AB%E5%9B%AD%E5%95%86%E5%9F%8E',
  NULL,
  CAST('["打开地图搜索“上海 豫园商城”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：____1_Shanghai_Yu_Garden.jpg", "坐标：31.226526, 121.491256"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '豫园商城'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2083040,
  a.longitude = 121.4281440,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '上生新所';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '上生新所',
  '上海上生新所：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 上生新所。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：31.208304, 121.428144。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · 上生新所',
  31.2083040,
  121.4281440,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E4%B8%8A%E7%94%9F%E6%96%B0%E6%89%80',
  NULL,
  CAST('["打开地图搜索“上海 上生新所”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：31.208304, 121.428144"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '上生新所'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 31.2084130,
  a.longitude = 121.4686550,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '田子坊';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '田子坊',
  '上海田子坊：适合双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 田子坊。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：31.208413, 121.468655。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '上海',
  '上海 · 田子坊',
  31.2084130,
  121.4686550,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E7%94%B0%E5%AD%90%E5%9D%8A',
  NULL,
  CAST('["打开地图搜索“上海 田子坊”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：31.208413, 121.468655"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '田子坊'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 31.1530420,
  a.longitude = 121.4814960,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '前滩太古里';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '前滩太古里',
  '上海前滩太古里：适合双人, 多人，预算100以上，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 前滩太古里。
适合人数：双人, 多人；人均预算：100以上。
心情标签：探索, 热闹。
坐标：31.153042, 121.481496。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  200,
  0,
  '上海',
  '上海 · 前滩太古里',
  31.1530420,
  121.4814960,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E5%89%8D%E6%BB%A9%E5%A4%AA%E5%8F%A4%E9%87%8C',
  NULL,
  CAST('["打开地图搜索“上海 前滩太古里”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：31.153042, 121.481496"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '前滩太古里'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 2,
  a.budget_yuan = 50,
  a.latitude = 31.2579780,
  a.longitude = 121.4911240,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '1933老场坊';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '1933老场坊',
  '上海1933老场坊：适合1 人, 双人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 1933老场坊。
适合人数：1 人, 双人；人均预算：0-50。
心情标签：放松, 探索。
坐标：31.257978, 121.491124。',
  '美食',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  2,
  180,
  50,
  0,
  '上海',
  '上海 · 1933老场坊',
  31.2579780,
  121.4911240,
  'https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%201933%E8%80%81%E5%9C%BA%E5%9D%8A',
  NULL,
  CAST('["打开地图搜索“上海 1933老场坊”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：31.257978, 121.491124"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '上海'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '1933老场坊'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 23.1067830,
  a.longitude = 113.2446450,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '沙面历史文化街区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '沙面历史文化街区',
  '广州沙面历史文化街区：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 沙面历史文化街区。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：23.106783, 113.244645。
地点图片文件名：____1_BankofTaiwan_Shamian.jpg,____2_Bridge_to_Shamian_Island_in_Guangzhou_China.jpg。',
  '美食',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '广州',
  '广州 · 沙面历史文化街区',
  23.1067830,
  113.2446450,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E6%B2%99%E9%9D%A2%E5%8E%86%E5%8F%B2%E6%96%87%E5%8C%96%E8%A1%97%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“广州 沙面历史文化街区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：____1_BankofTaiwan_Shamian.jpg,____2_Bridge_to_Shamian_Island_in_Guangzhou_China.jpg", "坐标：23.106783, 113.244645"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '沙面历史文化街区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 23.1148230,
  a.longitude = 113.2382280,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '西关永庆坊旅游区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '西关永庆坊旅游区',
  '广州西关永庆坊旅游区：适合1 人, 双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 西关永庆坊旅游区。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：23.114823, 113.238228。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '广州',
  '广州 · 西关永庆坊旅游区',
  23.1148230,
  113.2382280,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E8%A5%BF%E5%85%B3%E6%B0%B8%E5%BA%86%E5%9D%8A%E6%97%85%E6%B8%B8%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“广州 西关永庆坊旅游区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：23.114823, 113.238228"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '西关永庆坊旅游区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 23.1208250,
  a.longitude = 113.2691920,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '北京路文化旅游区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '北京路文化旅游区',
  '广州北京路文化旅游区：适合双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 北京路文化旅游区。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：23.120825, 113.269192。
地点图片文件名：____1__.jpg。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '广州',
  '广州 · 北京路文化旅游区',
  23.1208250,
  113.2691920,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E5%8C%97%E4%BA%AC%E8%B7%AF%E6%96%87%E5%8C%96%E6%97%85%E6%B8%B8%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“广州 北京路文化旅游区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：____1__.jpg", "坐标：23.120825, 113.269192"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '北京路文化旅游区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 23.1132190,
  a.longitude = 113.2436980,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '上下九步行街';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '上下九步行街',
  '广州上下九步行街：适合双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 上下九步行街。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：23.113219, 113.243698。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'outdoor',
  2,
  6,
  180,
  100,
  0,
  '广州',
  '广州 · 上下九步行街',
  23.1132190,
  113.2436980,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E4%B8%8A%E4%B8%8B%E4%B9%9D%E6%AD%A5%E8%A1%8C%E8%A1%97',
  NULL,
  CAST('["打开地图搜索“广州 上下九步行街”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：23.113219, 113.243698"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '上下九步行街'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 23.1271490,
  a.longitude = 113.2454580,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '陈家祠';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '陈家祠',
  '广州陈家祠：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 陈家祠。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：23.127149, 113.245458。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '广州',
  '广州 · 陈家祠',
  23.1271490,
  113.2454580,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E9%99%88%E5%AE%B6%E7%A5%A0',
  NULL,
  CAST('["打开地图搜索“广州 陈家祠”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：23.127149, 113.245458"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '陈家祠'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 23.1215600,
  a.longitude = 113.2319740,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '荔湾湖公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '荔湾湖公园',
  '广州荔湾湖公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 荔湾湖公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：23.121560, 113.231974。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '广州',
  '广州 · 荔湾湖公园',
  23.1215600,
  113.2319740,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E8%8D%94%E6%B9%BE%E6%B9%96%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“广州 荔湾湖公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：23.121560, 113.231974"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '荔湾湖公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 23.1155190,
  a.longitude = 113.2716870,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '珠江夜游天字码头路线';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '珠江夜游天字码头路线',
  '广州珠江夜游天字码头路线：适合双人, 多人，预算100以上，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 珠江夜游天字码头路线。
适合人数：双人, 多人；人均预算：100以上。
心情标签：放松, 探索, 热闹。
坐标：23.115519, 113.271687。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  200,
  0,
  '广州',
  '广州 · 珠江夜游天字码头路线',
  23.1155190,
  113.2716870,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E7%8F%A0%E6%B1%9F%E5%A4%9C%E6%B8%B8%E5%A4%A9%E5%AD%97%E7%A0%81%E5%A4%B4%E8%B7%AF%E7%BA%BF',
  NULL,
  CAST('["打开地图搜索“广州 珠江夜游天字码头路线”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：未配置", "坐标：23.115519, 113.271687"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '珠江夜游天字码头路线'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 23.1238330,
  a.longitude = 113.2955220,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '东山口历史文化街区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '东山口历史文化街区',
  '广州东山口历史文化街区：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 东山口历史文化街区。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索。
坐标：23.123833, 113.295522。',
  '美食',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  100,
  0,
  '广州',
  '广州 · 东山口历史文化街区',
  23.1238330,
  113.2955220,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E4%B8%9C%E5%B1%B1%E5%8F%A3%E5%8E%86%E5%8F%B2%E6%96%87%E5%8C%96%E8%A1%97%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“广州 东山口历史文化街区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：23.123833, 113.295522"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '东山口历史文化街区'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 23.0706890,
  a.longitude = 113.3236910,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '海珠湖公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '海珠湖公园',
  '广州海珠湖公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 海珠湖公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：23.070689, 113.323691。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '广州',
  '广州 · 海珠湖公园',
  23.0706890,
  113.3236910,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E6%B5%B7%E7%8F%A0%E6%B9%96%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“广州 海珠湖公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：23.070689, 113.323691"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '海珠湖公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 23.1064040,
  a.longitude = 113.3245580,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '广州塔';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '广州塔',
  '广州塔：适合双人, 多人，预算100以上，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 广州塔。
适合人数：双人, 多人；人均预算：100以上。
心情标签：探索, 热闹。
坐标：23.106404, 113.324558。
地点图片文件名：____1_Canton_Tower_Guangzhou.jpg。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  200,
  0,
  '广州',
  '广州 · 广州塔',
  23.1064040,
  113.3245580,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E5%B9%BF%E5%B7%9E%E5%A1%94',
  NULL,
  CAST('["打开地图搜索“广州 广州塔”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：____1_Canton_Tower_Guangzhou.jpg", "坐标：23.106404, 113.324558"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '广州塔'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 23.1147970,
  a.longitude = 113.3268320,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '广东省博物馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '广东省博物馆',
  '广州广东省博物馆：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 广东省博物馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：23.114797, 113.326832。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'indoor',
  1,
  6,
  180,
  50,
  0,
  '广州',
  '广州 · 广东省博物馆',
  23.1147970,
  113.3268320,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E5%B9%BF%E4%B8%9C%E7%9C%81%E5%8D%9A%E7%89%A9%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“广州 广东省博物馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：23.114797, 113.326832"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '广东省博物馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 23.0867220,
  a.longitude = 113.2528870,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '太古仓码头';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '太古仓码头',
  '广州太古仓码头：适合双人, 多人，预算50-100，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 太古仓码头。
适合人数：双人, 多人；人均预算：50-100。
心情标签：放松, 探索, 热闹。
坐标：23.086722, 113.252887。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '广州',
  '广州 · 太古仓码头',
  23.0867220,
  113.2528870,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E5%A4%AA%E5%8F%A4%E4%BB%93%E7%A0%81%E5%A4%B4',
  NULL,
  CAST('["打开地图搜索“广州 太古仓码头”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：未配置", "坐标：23.086722, 113.252887"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '太古仓码头'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 23.1397770,
  a.longitude = 113.2614030,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '越秀公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '越秀公园',
  '广州越秀公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 越秀公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：23.139777, 113.261403。
地点图片文件名：____1_Old_Cannon_from_Second_Opium_War_Yuexiu_Park_Guangzhou.jpg,____2_Old_Cannon_Yuexiu_Park_Guangzhou.jpg。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '广州',
  '广州 · 越秀公园',
  23.1397770,
  113.2614030,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E8%B6%8A%E7%A7%80%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“广州 越秀公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：____1_Old_Cannon_from_Second_Opium_War_Yuexiu_Park_Guangzhou.jpg,____2_Old_Cannon_Yuexiu_Park_Guangzhou.jpg", "坐标：23.139777, 113.261403"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '越秀公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 23.0756730,
  a.longitude = 113.3293810,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '广州文化馆新馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '广州文化馆新馆',
  '广州文化馆新馆：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：广州 · 广州文化馆新馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：23.075673, 113.329381。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '广州',
  '广州 · 广州文化馆新馆',
  23.0756730,
  113.3293810,
  'https://uri.amap.com/search?keyword=%E5%B9%BF%E5%B7%9E%20%E5%B9%BF%E5%B7%9E%E6%96%87%E5%8C%96%E9%A6%86%E6%96%B0%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“广州 广州文化馆新馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：23.075673, 113.329381"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '广州'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '广州文化馆新馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 22.5215840,
  a.longitude = 113.9929610,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '深圳湾公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '深圳湾公园',
  '深圳湾公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 深圳湾公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：22.521584, 113.992961。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '深圳',
  '深圳 · 深圳湾公园',
  22.5215840,
  113.9929610,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E6%B7%B1%E5%9C%B3%E6%B9%BE%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“深圳 深圳湾公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：22.521584, 113.992961"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '深圳湾公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 22.5539030,
  a.longitude = 114.0583480,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '莲花山公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '莲花山公园',
  '深圳莲花山公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 莲花山公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：22.553903, 114.058348。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '深圳',
  '深圳 · 莲花山公园',
  22.5539030,
  114.0583480,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E8%8E%B2%E8%8A%B1%E5%B1%B1%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“深圳 莲花山公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：22.553903, 114.058348"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '莲花山公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 22.5260910,
  a.longitude = 113.8896400,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '前海石公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '前海石公园',
  '深圳前海石公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 前海石公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：22.526091, 113.889640。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '深圳',
  '深圳 · 前海石公园',
  22.5260910,
  113.8896400,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E5%89%8D%E6%B5%B7%E7%9F%B3%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“深圳 前海石公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：22.526091, 113.889640"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '前海石公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 22.5373060,
  a.longitude = 113.9242900,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '南头古城';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '南头古城',
  '深圳南头古城：适合1 人, 双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 南头古城。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：22.537306, 113.924290。
地点图片文件名：____1__.jpg。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '深圳',
  '深圳 · 南头古城',
  22.5373060,
  113.9242900,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E5%8D%97%E5%A4%B4%E5%8F%A4%E5%9F%8E',
  NULL,
  CAST('["打开地图搜索“深圳 南头古城”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：____1__.jpg", "坐标：22.537306, 113.924290"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '南头古城'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 22.5383200,
  a.longitude = 113.9935880,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '华侨城创意文化园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '华侨城创意文化园',
  '深圳华侨城创意文化园：适合1 人, 双人, 多人，预算50-100，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 华侨城创意文化园。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松, 探索, 热闹。
坐标：22.538320, 113.993588。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '深圳',
  '深圳 · 华侨城创意文化园',
  22.5383200,
  113.9935880,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E5%8D%8E%E4%BE%A8%E5%9F%8E%E5%88%9B%E6%84%8F%E6%96%87%E5%8C%96%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“深圳 华侨城创意文化园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：未配置", "坐标：22.538320, 113.993588"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '华侨城创意文化园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 22.6077690,
  a.longitude = 114.1368220,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '大芬油画村';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '大芬油画村',
  '深圳大芬油画村：适合1 人, 双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 大芬油画村。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：22.607769, 114.136822。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  1,
  6,
  180,
  100,
  0,
  '深圳',
  '深圳 · 大芬油画村',
  22.6077690,
  114.1368220,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E5%A4%A7%E8%8A%AC%E6%B2%B9%E7%94%BB%E6%9D%91',
  NULL,
  CAST('["打开地图搜索“深圳 大芬油画村”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：22.607769, 114.136822"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '大芬油画村'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 22.6563050,
  a.longitude = 114.1047160,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '甘坑古镇';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '甘坑古镇',
  '深圳甘坑古镇：适合双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 甘坑古镇。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：22.656305, 114.104716。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '深圳',
  '深圳 · 甘坑古镇',
  22.6563050,
  114.1047160,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E7%94%98%E5%9D%91%E5%8F%A4%E9%95%87',
  NULL,
  CAST('["打开地图搜索“深圳 甘坑古镇”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：22.656305, 114.104716"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '甘坑古镇'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 22.4850760,
  a.longitude = 113.9150160,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '海上世界';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '海上世界',
  '深圳海上世界：适合双人, 多人，预算100以上，心情标签：放松、探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 海上世界。
适合人数：双人, 多人；人均预算：100以上。
心情标签：放松, 探索, 热闹。
坐标：22.485076, 113.915016。',
  '惊喜',
  '放松',
  CAST('["放松", "探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  200,
  0,
  '深圳',
  '深圳 · 海上世界',
  22.4850760,
  113.9150160,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E6%B5%B7%E4%B8%8A%E4%B8%96%E7%95%8C',
  NULL,
  CAST('["打开地图搜索“深圳 海上世界”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：放松, 探索, 热闹", "原始图片文件名：未配置", "坐标：22.485076, 113.915016"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '海上世界'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 22.5866970,
  a.longitude = 113.8390460,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '西湾红树林公园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '西湾红树林公园',
  '深圳西湾红树林公园：适合1 人, 双人, 多人，预算0-50，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 西湾红树林公园。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松。
坐标：22.586697, 113.839046。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '深圳',
  '深圳 · 西湾红树林公园',
  22.5866970,
  113.8390460,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E8%A5%BF%E6%B9%BE%E7%BA%A2%E6%A0%91%E6%9E%97%E5%85%AC%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“深圳 西湾红树林公园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：22.586697, 113.839046"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '西湾红树林公园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 22.5430160,
  a.longitude = 113.8881910,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '欢乐港湾';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '欢乐港湾',
  '深圳欢乐港湾：适合双人, 多人，预算50-100，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 欢乐港湾。
适合人数：双人, 多人；人均预算：50-100。
心情标签：探索, 热闹。
坐标：22.543016, 113.888191。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  100,
  0,
  '深圳',
  '深圳 · 欢乐港湾',
  22.5430160,
  113.8881910,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E6%AC%A2%E4%B9%90%E6%B8%AF%E6%B9%BE',
  NULL,
  CAST('["打开地图搜索“深圳 欢乐港湾”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：22.543016, 113.888191"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '欢乐港湾'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 100,
  a.latitude = 22.5780130,
  a.longitude = 114.1807050,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '仙湖植物园';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '仙湖植物园',
  '深圳仙湖植物园：适合1 人, 双人, 多人，预算50-100，心情标签：放松。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 仙湖植物园。
适合人数：1 人, 双人, 多人；人均预算：50-100。
心情标签：放松。
坐标：22.578013, 114.180705。',
  '探索',
  '放松',
  CAST('["放松"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  100,
  0,
  '深圳',
  '深圳 · 仙湖植物园',
  22.5780130,
  114.1807050,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E4%BB%99%E6%B9%96%E6%A4%8D%E7%89%A9%E5%9B%AD',
  NULL,
  CAST('["打开地图搜索“深圳 仙湖植物园”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松", "原始图片文件名：未配置", "坐标：22.578013, 114.180705"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '仙湖植物园'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 22.5458910,
  a.longitude = 114.0617830,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '深圳当代艺术与城市规划馆';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '深圳当代艺术与城市规划馆',
  '深圳当代艺术与城市规划馆：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 深圳当代艺术与城市规划馆。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：22.545891, 114.061783。',
  '文艺',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'either',
  1,
  6,
  180,
  50,
  0,
  '深圳',
  '深圳 · 深圳当代艺术与城市规划馆',
  22.5458910,
  114.0617830,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E6%B7%B1%E5%9C%B3%E5%BD%93%E4%BB%A3%E8%89%BA%E6%9C%AF%E4%B8%8E%E5%9F%8E%E5%B8%82%E8%A7%84%E5%88%92%E9%A6%86',
  NULL,
  CAST('["打开地图搜索“深圳 深圳当代艺术与城市规划馆”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：22.545891, 114.061783"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '深圳当代艺术与城市规划馆'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '探索',
  a.mood_tags = CAST('["探索", "热闹"]' AS JSON),
  a.min_party_size = 2,
  a.max_party_size = 6,
  a.budget_yuan = 200,
  a.latitude = 22.5429560,
  a.longitude = 113.9568140,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '万象天地';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '万象天地',
  '深圳万象天地：适合双人, 多人，预算100以上，心情标签：探索、热闹。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 万象天地。
适合人数：双人, 多人；人均预算：100以上。
心情标签：探索, 热闹。
坐标：22.542956, 113.956814。',
  '惊喜',
  '探索',
  CAST('["探索", "热闹"]' AS JSON),
  'either',
  2,
  6,
  180,
  200,
  0,
  '深圳',
  '深圳 · 万象天地',
  22.5429560,
  113.9568140,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E4%B8%87%E8%B1%A1%E5%A4%A9%E5%9C%B0',
  NULL,
  CAST('["打开地图搜索“深圳 万象天地”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：探索、热闹"]' AS JSON),
  CAST('["适合人数：双人, 多人", "心情标签：探索, 热闹", "原始图片文件名：未配置", "坐标：22.542956, 113.956814"]' AS JSON),
  '#7357FF',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '万象天地'
  );

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = '放松',
  a.mood_tags = CAST('["放松", "探索"]' AS JSON),
  a.min_party_size = 1,
  a.max_party_size = 6,
  a.budget_yuan = 50,
  a.latitude = 22.5794290,
  a.longitude = 114.2195390,
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '梧桐山风景区';

INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  '梧桐山风景区',
  '深圳梧桐山风景区：适合1 人, 双人, 多人，预算0-50，心情标签：放松、探索。',
  '来自《出行盲盒地点库 (1).xlsx》的地点：深圳 · 梧桐山风景区。
适合人数：1 人, 双人, 多人；人均预算：0-50。
心情标签：放松, 探索。
坐标：22.579429, 114.219539。',
  '探索',
  '放松',
  CAST('["放松", "探索"]' AS JSON),
  'outdoor',
  1,
  6,
  180,
  50,
  0,
  '深圳',
  '深圳 · 梧桐山风景区',
  22.5794290,
  114.2195390,
  'https://uri.amap.com/search?keyword=%E6%B7%B1%E5%9C%B3%20%E6%A2%A7%E6%A1%90%E5%B1%B1%E9%A3%8E%E6%99%AF%E5%8C%BA',
  NULL,
  CAST('["打开地图搜索“深圳 梧桐山风景区”", "按当天开放时间、排队情况或天气调整停留节奏", "围绕心情标签选择玩法：放松、探索"]' AS JSON),
  CAST('["适合人数：1 人, 双人, 多人", "心情标签：放松, 探索", "原始图片文件名：未配置", "坐标：22.579429, 114.219539"]' AS JSON),
  '#28B8A0',
  TRUE
FROM cities c
WHERE c.name = '深圳'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = '梧桐山风景区'
  );

COMMIT;

SELECT COUNT(*) AS imported_rows_after
FROM (
SELECT '北京' AS city_name, '故宫博物院' AS title
UNION ALL
SELECT '北京' AS city_name, '颐和园' AS title
UNION ALL
SELECT '北京' AS city_name, '景山公园' AS title
UNION ALL
SELECT '北京' AS city_name, '奥林匹克森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '798艺术区' AS title
UNION ALL
SELECT '北京' AS city_name, '红砖美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '五道营胡同' AS title
UNION ALL
SELECT '北京' AS city_name, '什刹海' AS title
UNION ALL
SELECT '北京' AS city_name, '亮马河国际风情水岸' AS title
UNION ALL
SELECT '北京' AS city_name, '中国美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '首钢园' AS title
UNION ALL
SELECT '北京' AS city_name, '中国园林博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京坊' AS title
UNION ALL
SELECT '北京' AS city_name, '三里屯太古里' AS title
UNION ALL
SELECT '北京' AS city_name, '天坛公园' AS title
UNION ALL
SELECT '北京' AS city_name, '北海公园' AS title
UNION ALL
SELECT '北京' AS city_name, '中山公园' AS title
UNION ALL
SELECT '北京' AS city_name, '陶然亭公园' AS title
UNION ALL
SELECT '北京' AS city_name, '玉渊潭公园' AS title
UNION ALL
SELECT '北京' AS city_name, '朝阳公园' AS title
UNION ALL
SELECT '北京' AS city_name, '紫竹院公园' AS title
UNION ALL
SELECT '北京' AS city_name, '香山公园' AS title
UNION ALL
SELECT '北京' AS city_name, '国家植物园' AS title
UNION ALL
SELECT '北京' AS city_name, '北京动物园' AS title
UNION ALL
SELECT '北京' AS city_name, '雍和宫' AS title
UNION ALL
SELECT '北京' AS city_name, '孔庙和国子监博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '鼓楼' AS title
UNION ALL
SELECT '北京' AS city_name, '钟楼' AS title
UNION ALL
SELECT '北京' AS city_name, '烟袋斜街' AS title
UNION ALL
SELECT '北京' AS city_name, '南锣鼓巷' AS title
UNION ALL
SELECT '北京' AS city_name, '东交民巷' AS title
UNION ALL
SELECT '北京' AS city_name, '前门大街' AS title
UNION ALL
SELECT '北京' AS city_name, '大栅栏' AS title
UNION ALL
SELECT '北京' AS city_name, '天安门广场' AS title
UNION ALL
SELECT '北京' AS city_name, '中国国家博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '国家大剧院' AS title
UNION ALL
SELECT '北京' AS city_name, '首都博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京自然博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京天文馆' AS title
UNION ALL
SELECT '北京' AS city_name, '中国科学技术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '中国电影博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京汽车博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '中国铁道博物馆东郊馆' AS title
UNION ALL
SELECT '北京' AS city_name, 'UCCA尤伦斯当代艺术中心' AS title
UNION ALL
SELECT '北京' AS city_name, '今日美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京民生现代美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '白塔寺' AS title
UNION ALL
SELECT '北京' AS city_name, '法源寺' AS title
UNION ALL
SELECT '北京' AS city_name, '西什库教堂' AS title
UNION ALL
SELECT '北京' AS city_name, '杨梅竹斜街' AS title
UNION ALL
SELECT '北京' AS city_name, '北京鲁迅博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京大观园' AS title
UNION ALL
SELECT '北京' AS city_name, '南海子公园' AS title
UNION ALL
SELECT '北京' AS city_name, '大运河森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '城市绿心森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '百望山森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '凤凰岭自然风景区' AS title
UNION ALL
SELECT '北京' AS city_name, '北京野鸭湖国家湿地公园' AS title
UNION ALL
SELECT '北京' AS city_name, '潭柘寺' AS title
UNION ALL
SELECT '北京' AS city_name, '戒台寺' AS title
UNION ALL
SELECT '北京' AS city_name, '慕田峪长城' AS title
UNION ALL
SELECT '北京' AS city_name, '八达岭长城' AS title
UNION ALL
SELECT '北京' AS city_name, '居庸关长城' AS title
UNION ALL
SELECT '北京' AS city_name, '北京欢乐谷' AS title
UNION ALL
SELECT '上海' AS city_name, '外滩' AS title
UNION ALL
SELECT '上海' AS city_name, '武康路历史文化风貌区' AS title
UNION ALL
SELECT '上海' AS city_name, '安福路' AS title
UNION ALL
SELECT '上海' AS city_name, '愚园路历史风貌街区' AS title
UNION ALL
SELECT '上海' AS city_name, '思南公馆' AS title
UNION ALL
SELECT '上海' AS city_name, '苏州河滨水步道' AS title
UNION ALL
SELECT '上海' AS city_name, '北外滩滨江绿地' AS title
UNION ALL
SELECT '上海' AS city_name, 'M50创意园' AS title
UNION ALL
SELECT '上海' AS city_name, '徐汇滨江' AS title
UNION ALL
SELECT '上海' AS city_name, '豫园商城' AS title
UNION ALL
SELECT '上海' AS city_name, '上生新所' AS title
UNION ALL
SELECT '上海' AS city_name, '田子坊' AS title
UNION ALL
SELECT '上海' AS city_name, '前滩太古里' AS title
UNION ALL
SELECT '上海' AS city_name, '1933老场坊' AS title
UNION ALL
SELECT '广州' AS city_name, '沙面历史文化街区' AS title
UNION ALL
SELECT '广州' AS city_name, '西关永庆坊旅游区' AS title
UNION ALL
SELECT '广州' AS city_name, '北京路文化旅游区' AS title
UNION ALL
SELECT '广州' AS city_name, '上下九步行街' AS title
UNION ALL
SELECT '广州' AS city_name, '陈家祠' AS title
UNION ALL
SELECT '广州' AS city_name, '荔湾湖公园' AS title
UNION ALL
SELECT '广州' AS city_name, '珠江夜游天字码头路线' AS title
UNION ALL
SELECT '广州' AS city_name, '东山口历史文化街区' AS title
UNION ALL
SELECT '广州' AS city_name, '海珠湖公园' AS title
UNION ALL
SELECT '广州' AS city_name, '广州塔' AS title
UNION ALL
SELECT '广州' AS city_name, '广东省博物馆' AS title
UNION ALL
SELECT '广州' AS city_name, '太古仓码头' AS title
UNION ALL
SELECT '广州' AS city_name, '越秀公园' AS title
UNION ALL
SELECT '广州' AS city_name, '广州文化馆新馆' AS title
UNION ALL
SELECT '深圳' AS city_name, '深圳湾公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '莲花山公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '前海石公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '南头古城' AS title
UNION ALL
SELECT '深圳' AS city_name, '华侨城创意文化园' AS title
UNION ALL
SELECT '深圳' AS city_name, '大芬油画村' AS title
UNION ALL
SELECT '深圳' AS city_name, '甘坑古镇' AS title
UNION ALL
SELECT '深圳' AS city_name, '海上世界' AS title
UNION ALL
SELECT '深圳' AS city_name, '西湾红树林公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '欢乐港湾' AS title
UNION ALL
SELECT '深圳' AS city_name, '仙湖植物园' AS title
UNION ALL
SELECT '深圳' AS city_name, '深圳当代艺术与城市规划馆' AS title
UNION ALL
SELECT '深圳' AS city_name, '万象天地' AS title
UNION ALL
SELECT '深圳' AS city_name, '梧桐山风景区' AS title
) t
INNER JOIN cities c ON c.name = t.city_name
INNER JOIN activities a ON a.city_id = c.id AND a.title = t.title;

SELECT t.city_name AS city, COUNT(*) AS imported_city_rows
FROM (
SELECT '北京' AS city_name, '故宫博物院' AS title
UNION ALL
SELECT '北京' AS city_name, '颐和园' AS title
UNION ALL
SELECT '北京' AS city_name, '景山公园' AS title
UNION ALL
SELECT '北京' AS city_name, '奥林匹克森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '798艺术区' AS title
UNION ALL
SELECT '北京' AS city_name, '红砖美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '五道营胡同' AS title
UNION ALL
SELECT '北京' AS city_name, '什刹海' AS title
UNION ALL
SELECT '北京' AS city_name, '亮马河国际风情水岸' AS title
UNION ALL
SELECT '北京' AS city_name, '中国美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '首钢园' AS title
UNION ALL
SELECT '北京' AS city_name, '中国园林博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京坊' AS title
UNION ALL
SELECT '北京' AS city_name, '三里屯太古里' AS title
UNION ALL
SELECT '北京' AS city_name, '天坛公园' AS title
UNION ALL
SELECT '北京' AS city_name, '北海公园' AS title
UNION ALL
SELECT '北京' AS city_name, '中山公园' AS title
UNION ALL
SELECT '北京' AS city_name, '陶然亭公园' AS title
UNION ALL
SELECT '北京' AS city_name, '玉渊潭公园' AS title
UNION ALL
SELECT '北京' AS city_name, '朝阳公园' AS title
UNION ALL
SELECT '北京' AS city_name, '紫竹院公园' AS title
UNION ALL
SELECT '北京' AS city_name, '香山公园' AS title
UNION ALL
SELECT '北京' AS city_name, '国家植物园' AS title
UNION ALL
SELECT '北京' AS city_name, '北京动物园' AS title
UNION ALL
SELECT '北京' AS city_name, '雍和宫' AS title
UNION ALL
SELECT '北京' AS city_name, '孔庙和国子监博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '鼓楼' AS title
UNION ALL
SELECT '北京' AS city_name, '钟楼' AS title
UNION ALL
SELECT '北京' AS city_name, '烟袋斜街' AS title
UNION ALL
SELECT '北京' AS city_name, '南锣鼓巷' AS title
UNION ALL
SELECT '北京' AS city_name, '东交民巷' AS title
UNION ALL
SELECT '北京' AS city_name, '前门大街' AS title
UNION ALL
SELECT '北京' AS city_name, '大栅栏' AS title
UNION ALL
SELECT '北京' AS city_name, '天安门广场' AS title
UNION ALL
SELECT '北京' AS city_name, '中国国家博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '国家大剧院' AS title
UNION ALL
SELECT '北京' AS city_name, '首都博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京自然博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京天文馆' AS title
UNION ALL
SELECT '北京' AS city_name, '中国科学技术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '中国电影博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京汽车博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '中国铁道博物馆东郊馆' AS title
UNION ALL
SELECT '北京' AS city_name, 'UCCA尤伦斯当代艺术中心' AS title
UNION ALL
SELECT '北京' AS city_name, '今日美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京民生现代美术馆' AS title
UNION ALL
SELECT '北京' AS city_name, '白塔寺' AS title
UNION ALL
SELECT '北京' AS city_name, '法源寺' AS title
UNION ALL
SELECT '北京' AS city_name, '西什库教堂' AS title
UNION ALL
SELECT '北京' AS city_name, '杨梅竹斜街' AS title
UNION ALL
SELECT '北京' AS city_name, '北京鲁迅博物馆' AS title
UNION ALL
SELECT '北京' AS city_name, '北京大观园' AS title
UNION ALL
SELECT '北京' AS city_name, '南海子公园' AS title
UNION ALL
SELECT '北京' AS city_name, '大运河森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '城市绿心森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '百望山森林公园' AS title
UNION ALL
SELECT '北京' AS city_name, '凤凰岭自然风景区' AS title
UNION ALL
SELECT '北京' AS city_name, '北京野鸭湖国家湿地公园' AS title
UNION ALL
SELECT '北京' AS city_name, '潭柘寺' AS title
UNION ALL
SELECT '北京' AS city_name, '戒台寺' AS title
UNION ALL
SELECT '北京' AS city_name, '慕田峪长城' AS title
UNION ALL
SELECT '北京' AS city_name, '八达岭长城' AS title
UNION ALL
SELECT '北京' AS city_name, '居庸关长城' AS title
UNION ALL
SELECT '北京' AS city_name, '北京欢乐谷' AS title
UNION ALL
SELECT '上海' AS city_name, '外滩' AS title
UNION ALL
SELECT '上海' AS city_name, '武康路历史文化风貌区' AS title
UNION ALL
SELECT '上海' AS city_name, '安福路' AS title
UNION ALL
SELECT '上海' AS city_name, '愚园路历史风貌街区' AS title
UNION ALL
SELECT '上海' AS city_name, '思南公馆' AS title
UNION ALL
SELECT '上海' AS city_name, '苏州河滨水步道' AS title
UNION ALL
SELECT '上海' AS city_name, '北外滩滨江绿地' AS title
UNION ALL
SELECT '上海' AS city_name, 'M50创意园' AS title
UNION ALL
SELECT '上海' AS city_name, '徐汇滨江' AS title
UNION ALL
SELECT '上海' AS city_name, '豫园商城' AS title
UNION ALL
SELECT '上海' AS city_name, '上生新所' AS title
UNION ALL
SELECT '上海' AS city_name, '田子坊' AS title
UNION ALL
SELECT '上海' AS city_name, '前滩太古里' AS title
UNION ALL
SELECT '上海' AS city_name, '1933老场坊' AS title
UNION ALL
SELECT '广州' AS city_name, '沙面历史文化街区' AS title
UNION ALL
SELECT '广州' AS city_name, '西关永庆坊旅游区' AS title
UNION ALL
SELECT '广州' AS city_name, '北京路文化旅游区' AS title
UNION ALL
SELECT '广州' AS city_name, '上下九步行街' AS title
UNION ALL
SELECT '广州' AS city_name, '陈家祠' AS title
UNION ALL
SELECT '广州' AS city_name, '荔湾湖公园' AS title
UNION ALL
SELECT '广州' AS city_name, '珠江夜游天字码头路线' AS title
UNION ALL
SELECT '广州' AS city_name, '东山口历史文化街区' AS title
UNION ALL
SELECT '广州' AS city_name, '海珠湖公园' AS title
UNION ALL
SELECT '广州' AS city_name, '广州塔' AS title
UNION ALL
SELECT '广州' AS city_name, '广东省博物馆' AS title
UNION ALL
SELECT '广州' AS city_name, '太古仓码头' AS title
UNION ALL
SELECT '广州' AS city_name, '越秀公园' AS title
UNION ALL
SELECT '广州' AS city_name, '广州文化馆新馆' AS title
UNION ALL
SELECT '深圳' AS city_name, '深圳湾公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '莲花山公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '前海石公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '南头古城' AS title
UNION ALL
SELECT '深圳' AS city_name, '华侨城创意文化园' AS title
UNION ALL
SELECT '深圳' AS city_name, '大芬油画村' AS title
UNION ALL
SELECT '深圳' AS city_name, '甘坑古镇' AS title
UNION ALL
SELECT '深圳' AS city_name, '海上世界' AS title
UNION ALL
SELECT '深圳' AS city_name, '西湾红树林公园' AS title
UNION ALL
SELECT '深圳' AS city_name, '欢乐港湾' AS title
UNION ALL
SELECT '深圳' AS city_name, '仙湖植物园' AS title
UNION ALL
SELECT '深圳' AS city_name, '深圳当代艺术与城市规划馆' AS title
UNION ALL
SELECT '深圳' AS city_name, '万象天地' AS title
UNION ALL
SELECT '深圳' AS city_name, '梧桐山风景区' AS title
) t
INNER JOIN cities c ON c.name = t.city_name
INNER JOIN activities a ON a.city_id = c.id AND a.title = t.title
GROUP BY t.city_name
ORDER BY t.city_name;
