-- Expand the playable MVP to six cities.
-- The first pack is intentionally curated and small. POI sync can expand it later.

INSERT INTO cities (name, code, province, is_active)
VALUES
  ('北京', 'beijing', '北京', TRUE),
  ('深圳', 'shenzhen', '广东', TRUE),
  ('天津', 'tianjin', '天津', TRUE),
  ('烟台', 'yantai', '山东', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  province = VALUES(province),
  is_active = VALUES(is_active);

-- Guangzhou exists in the historical place library but is outside the current six-city MVP.
UPDATE cities SET is_active = FALSE WHERE code = 'guangzhou';
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET a.is_active = FALSE
WHERE c.code = 'guangzhou';
UPDATE destinations d
INNER JOIN cities c ON c.id = d.city_id
SET d.is_active = FALSE
WHERE c.code = 'guangzhou';
UPDATE attractions x
INNER JOIN destinations d ON d.id = x.destination_id
INNER JOIN cities c ON c.id = d.city_id
SET x.is_active = FALSE
WHERE c.code = 'guangzhou';

CREATE TEMPORARY TABLE tmp_core_activity_pack (
  city_code VARCHAR(32) NOT NULL,
  title VARCHAR(120) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(32) NOT NULL,
  mood VARCHAR(32) NOT NULL,
  environment ENUM('indoor', 'outdoor', 'either') NOT NULL,
  min_party_size TINYINT UNSIGNED NOT NULL,
  max_party_size TINYINT UNSIGNED NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  budget_yuan SMALLINT UNSIGNED NOT NULL,
  city_distance_km DECIMAL(5,2) NOT NULL,
  district VARCHAR(64) NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  navigation_url VARCHAR(500) NULL,
  steps JSON NOT NULL,
  tips JSON NOT NULL,
  accent_color CHAR(7) NOT NULL
);

INSERT INTO tmp_core_activity_pack VALUES
  (
    'beijing', '在五道营胡同随机拐三次',
    '不按地图走完一条胡同，用三次随机转弯遇见北京的日常。',
    '从五道营胡同西口附近出发，每次遇到叉路都凭直觉选择，找一家小店或一处老建筑作为终点。',
    '探索', '放松', 'outdoor', 1, 4, 120, 80, 4.0,
    '东城区', '五道营胡同', 39.9471000, 116.4174000,
    'https://uri.amap.com/search?keyword=北京五道营胡同',
    JSON_ARRAY('从胡同口选一个方向', '连续随机拐三次', '找一处想停下来的小店或建筑'),
    JSON_ARRAY('尊重居民生活', '避免在狭窄路段长时间停留'), '#7565F6'
  ),
  (
    'beijing', '在 798 只看一场陌生展览',
    '不看热门推荐，随机选一个正在开放的展厅。',
    '把选择权交给现场。进入 798 艺术区后，只根据门口海报选一场展览，看完后记下最喜欢的一件作品。',
    '文艺', '探索', 'indoor', 1, 3, 150, 100, 10.0,
    '朝阳区', '酒仙桥路 4 号 798 艺术区', 39.9849000, 116.4970000,
    'https://uri.amap.com/search?keyword=北京798艺术区',
    JSON_ARRAY('到现场再选展览', '认真看完一个展', '写下最喜欢的作品和原因'),
    JSON_ARRAY('不同展览开放时间不同', '付费展览先现场确认票价'), '#8EC8FF'
  ),
  (
    'beijing', '在奥森盲走一段林间路',
    '进入公园后不设终点，跟着树影和鸟声走四十分钟。',
    '从奥林匹克森林公园的任一入口进入，暂时关掉导航，每遇到分叉就选更安静的一边。',
    '惊喜', '治愈', 'outdoor', 1, 5, 150, 30, 12.0,
    '朝阳区', '科荟路 33 号奥林匹克森林公园', 40.0171000, 116.3898000,
    'https://uri.amap.com/search?keyword=北京奥林匹克森林公园',
    JSON_ARRAY('关掉导航走四十分钟', '选一处有树影的地方休息', '返程时再打开导航'),
    JSON_ARRAY('大风或恶劣天气不推荐', '留意公园闭园时间'), '#58BFA8'
  ),
  (
    'beijing', '去砖塔胡同找一本北京旧书',
    '用一本书认识一条七百年的胡同。',
    '到砖塔胡同和万松老人塔附近慢走，然后在书店里挑一本和北京历史或城市有关的书。',
    '文艺', '治愈', 'either', 1, 2, 100, 100, 3.0,
    '西城区', '砖塔胡同与西四南大街附近', 39.9231000, 116.3713000,
    'https://uri.amap.com/search?keyword=北京砖塔胡同',
    JSON_ARRAY('先看万松老人塔', '沿胡同慢走一圈', '只凭封面和第一页选一本书'),
    JSON_ARRAY('书店营业时间可能变动', '保持胡同环境安静'), '#E0B95B'
  ),
  (
    'shenzhen', '去深圳湾等一次海边日落',
    '不赶打卡点，只沿海走到天色变成蓝紫色。',
    '提前半小时到深圳湾公园，沿滨海慢走，选一处开阔的草地或岸线停下来。',
    '探索', '治愈', 'outdoor', 1, 5, 120, 30, 8.0,
    '南山区', '深圳湾公园滨海休闲带', 22.5155000, 113.9499000,
    'https://uri.amap.com/search?keyword=深圳湾公园',
    JSON_ARRAY('查看当天日落时间', '沿海慢走四十分钟', '在喜欢的视野处等日落'),
    JSON_ARRAY('夏季注意防晒和补水', '不要进入生态保护区'), '#FF8B6A'
  ),
  (
    'shenzhen', '在南头古城盲选一家小店',
    '沿老城街巷走十五分钟，只凭香味和门面做决定。',
    '不打开点评软件，在南头古城的街巷中漫游，选第一家让你愿意停下来的小店。',
    '美食', '社交', 'either', 1, 4, 120, 100, 10.0,
    '南山区', '南头古城', 22.5398000, 113.9250000,
    'https://uri.amap.com/search?keyword=深圳南头古城',
    JSON_ARRAY('不看榜单慢走十五分钟', '选第一家想进去的店', '点一份以前没吃过的东西'),
    JSON_ARRAY('注意过敏原', '高峰期预留排队时间'), '#F0BC55'
  ),
  (
    'shenzhen', '登莲花山看一次城市天际线',
    '用一段缓坡把今天的注意力从手机换到城市。',
    '从莲花山公园缓慢上行，到山顶广场后不急着拍照，先完整看一分钟城市天际线。',
    '惊喜', '放松', 'outdoor', 1, 5, 100, 20, 3.0,
    '福田区', '红荔路 6030 号莲花山公园', 22.5549000, 114.0648000,
    'https://uri.amap.com/search?keyword=深圳莲花山公园',
    JSON_ARRAY('选一条缓坡上山', '在山顶静看天际线一分钟', '换一条路下山'),
    JSON_ARRAY('炎热天气避开正午', '雨后路面可能湿滑'), '#58BFA8'
  ),
  (
    'shenzhen', '在海上世界做一次夜间漫游',
    '从黄昏走到灯光亮起，只选一处想停留的地方。',
    '沿蛇口海上世界和海边慢走，看街区从白天进入夜晚，最后在露天广场或岸边休息。',
    '文艺', '社交', 'outdoor', 1, 5, 120, 80, 14.0,
    '南山区', '蛇口望海路 1128 号海上世界', 22.4827000, 113.9187000,
    'https://uri.amap.com/search?keyword=深圳海上世界',
    JSON_ARRAY('黄昏前到达', '沿海边和街区慢走', '选一处有音乐或海风的地方休息'),
    JSON_ARRAY('夜间留意返程交通', '活动日可能人流较多'), '#7565F6'
  ),
  (
    'tianjin', '在五大道收集四种建筑颜色',
    '把洋楼变成一张城市色卡，边走边找颜色。',
    '从民园广场周边出发，在五大道找到砖红、奶油白、深绿和青灰四种建筑色彩。',
    '探索', '放松', 'outdoor', 1, 4, 120, 30, 4.0,
    '和平区', '五大道文化旅游区民园广场周边', 39.1168000, 117.1965000,
    'https://uri.amap.com/search?keyword=天津五大道',
    JSON_ARRAY('从民园广场出发', '收集四种建筑颜色', '选一栋最想了解的洋楼'),
    JSON_ARRAY('不进入私人住宅', '骑行时注意街巷行人'), '#D9A94E'
  ),
  (
    'tianjin', '沿海河数三座不同的桥',
    '用桥梁串起一段夜色，在河风里慢慢走回城市。',
    '从海河中心广场附近出发，沿河岸找到三座造型不同的桥，每座桥只拍一张照片。',
    '惊喜', '社交', 'outdoor', 1, 5, 120, 50, 3.0,
    '河北区', '海河中心广场公园及周边河岸', 39.1347000, 117.2057000,
    'https://uri.amap.com/search?keyword=天津海河中心广场',
    JSON_ARRAY('天黑前后出发', '沿河岸找三座桥', '在第三座桥附近休息'),
    JSON_ARRAY('夜间注意沿河安全', '冬季海河风大注意保暖'), '#8EC8FF'
  ),
  (
    'tianjin', '在意风区让店员选一杯饮品',
    '只告诉对方今天的心情，把口味选择交给陌生人。',
    '在意式风情区找一家顺眼的小店，不看招牌推荐，只描述想放松、提神或尝鲜，让店员帮你选。',
    '美食', '社交', 'either', 1, 3, 100, 120, 4.0,
    '河北区', '意式风情区自由道周边', 39.1403000, 117.2100000,
    'https://uri.amap.com/search?keyword=天津意式风情区',
    JSON_ARRAY('选一家没有收藏过的店', '只描述今天的心情', '不换款慢慢喝完'),
    JSON_ARRAY('提前确认营业时间', '对咖啡因敏感时主动说明'), '#FF8B6A'
  ),
  (
    'tianjin', '去天津博物馆挑一件最意外的展品',
    '不贪多，只用一件展品记住今天。',
    '进馆后不按完整路线打卡，先选一个展厅，找到一件名字、造型或故事最出乎意料的展品。',
    '文艺', '治愈', 'indoor', 1, 4, 150, 30, 7.0,
    '河西区', '平江道 62 号天津博物馆', 39.0831000, 117.2160000,
    'https://uri.amap.com/search?keyword=天津博物馆',
    JSON_ARRAY('只选一个展厅', '找一件最意外的展品', '用一句话记录它'),
    JSON_ARRAY('出发前确认预约和开放安排', '遵守馆内拍摄规定'), '#7565F6'
  ),
  (
    'yantai', '从朝阳街慢走到所城里',
    '从开埠建筑走进胶东老城，一次看到烟台的两层记忆。',
    '从朝阳街出发，看老建筑和街区细节，再慢慢走到所城里，只选一项胶东小吃或非遗手作。',
    '探索', '放松', 'outdoor', 1, 5, 150, 80, 3.0,
    '芝罘区', '朝阳街历史文化街区至所城里', 37.5426000, 121.4010000,
    'https://uri.amap.com/search?keyword=烟台朝阳街历史文化街区',
    JSON_ARRAY('在朝阳街找一栋喜欢的老建筑', '步行前往所城里', '只选一项胶东小吃或手作'),
    JSON_ARRAY('商户营业时间各不相同', '节假日尽量错峰'), '#D9A94E'
  ),
  (
    'yantai', '在第一海水浴场等海上日落',
    '沿海走到风慢下来，用一次日落结束今天。',
    '提前到第一海水浴场和滨海广场附近，先沿沙滩或栈道慢走，再找一处面向海面的位置停下。',
    '惊喜', '治愈', 'outdoor', 1, 5, 120, 30, 5.0,
    '芝罘区', '滨海北路第一海水浴场', 37.5358000, 121.4213000,
    'https://uri.amap.com/search?keyword=烟台第一海水浴场',
    JSON_ARRAY('确认当天日落时间', '沿沙滩或栈道慢走', '在安全位置等到天色变暗'),
    JSON_ARRAY('不熟悉海况时不下水', '海风大时注意保暖'), '#8EC8FF'
  ),
  (
    'yantai', '在张裕酒文化博物馆找一段开埠故事',
    '不只看酒，从一件老物中认识烟台的近代开埠记忆。',
    '在博物馆中只选一条故事线索，找到和开埠、海运或工业有关的一件展品，看完后再去附近老街走一段。',
    '文艺', '探索', 'indoor', 1, 4, 120, 100, 4.0,
    '芝罘区', '大马路 56 号张裕酒文化博物馆', 37.5459000, 121.3996000,
    'https://uri.amap.com/search?keyword=烟台张裕酒文化博物馆',
    JSON_ARRAY('确认开放和购票安排', '找一件和开埠有关的展品', '看完后去附近老街散步'),
    JSON_ARRAY('未成年人不参与酒精品鉴', '开放和票价以现场公告为准'), '#7565F6'
  ),
  (
    'yantai', '从月亮湾走到东炮台听海',
    '用一段滨海步道串起海风、栈桥和老炮台。',
    '从月亮湾附近出发，沿滨海北路慢走到东炮台一带，中途少拍照，多留意海风和声音变化。',
    '探索', '社交', 'outdoor', 1, 5, 120, 30, 7.0,
    '芝罘区', '月亮湾至东炮台滨海步道', 37.5316000, 121.4403000,
    'https://uri.amap.com/search?keyword=烟台月亮湾',
    JSON_ARRAY('从月亮湾附近出发', '沿滨海步道慢走', '在东炮台附近听海十分钟'),
    JSON_ARRAY('大风和浓雾天气调整路线', '夜间注意返程交通'), '#58BFA8'
  );

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id, p.title, p.summary, p.description, p.category, p.mood, p.environment,
  p.min_party_size, p.max_party_size, p.duration_minutes, p.budget_yuan,
  p.city_distance_km, p.district, p.address, p.latitude, p.longitude,
  p.navigation_url, p.steps, p.tips, p.accent_color, TRUE
FROM tmp_core_activity_pack p
INNER JOIN cities c ON c.code = p.city_code
WHERE NOT EXISTS (
  SELECT 1 FROM activities a WHERE a.city_id = c.id AND a.title = p.title
);

DROP TEMPORARY TABLE tmp_core_activity_pack;

INSERT INTO destinations (
  city_id, name, province, summary, description, best_seasons,
  avg_cost_per_day, rating, popularity, is_hot, is_active
)
SELECT
  c.id,
  c.name,
  c.province,
  CONCAT(c.name, ' — 周末轻旅行与城市奇遇'),
  CONCAT('在', c.name, '用一个周末从熟悉地标里抽到一条能直接出发的路线。'),
  JSON_ARRAY('春', '秋'),
  CASE c.code
    WHEN 'beijing' THEN 360
    WHEN 'shenzhen' THEN 380
    WHEN 'tianjin' THEN 300
    ELSE 320
  END,
  CASE c.code
    WHEN 'beijing' THEN 4.80
    WHEN 'shenzhen' THEN 4.70
    ELSE 4.60
  END,
  CASE c.code
    WHEN 'beijing' THEN 98
    WHEN 'shenzhen' THEN 95
    WHEN 'tianjin' THEN 88
    ELSE 84
  END,
  TRUE,
  TRUE
FROM cities c
WHERE c.code IN ('beijing', 'shenzhen', 'tianjin', 'yantai')
  AND NOT EXISTS (SELECT 1 FROM destinations d WHERE d.city_id = c.id);

INSERT INTO attractions (
  destination_id, activity_id, name, summary, description, address,
  latitude, longitude, ticket_price_min, ticket_price_max,
  suggested_duration, suitable_audiences, best_seasons,
  rating, popularity, is_active
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
  JSON_ARRAY('独自', '双人', '朋友'),
  JSON_ARRAY('春', '夏', '秋', '冬'),
  4.50,
  GREATEST(20, 100 - CAST(a.budget_yuan / 5 AS SIGNED)),
  a.is_active
FROM activities a
INNER JOIN cities c ON c.id = a.city_id
INNER JOIN destinations d ON d.city_id = a.city_id
WHERE c.code IN ('beijing', 'shenzhen', 'tianjin', 'yantai')
  AND NOT EXISTS (SELECT 1 FROM attractions x WHERE x.activity_id = a.id);

INSERT INTO attraction_tags (attraction_id, tag_id)
SELECT x.id, t.id
FROM attractions x
INNER JOIN activities a ON a.id = x.activity_id
INNER JOIN cities c ON c.id = a.city_id
INNER JOIN travel_tags t
  ON t.name = CASE WHEN a.category = '美食' THEN '美食购物' ELSE a.category END COLLATE utf8mb4_unicode_ci
WHERE c.code IN ('beijing', 'shenzhen', 'tianjin', 'yantai')
  AND NOT EXISTS (
    SELECT 1 FROM attraction_tags at WHERE at.attraction_id = x.id AND at.tag_id = t.id
  );

INSERT INTO attraction_tags (attraction_id, tag_id)
SELECT x.id, t.id
FROM attractions x
INNER JOIN activities a ON a.id = x.activity_id
INNER JOIN cities c ON c.id = a.city_id
INNER JOIN travel_tags t ON t.name = a.mood COLLATE utf8mb4_unicode_ci
WHERE c.code IN ('beijing', 'shenzhen', 'tianjin', 'yantai')
  AND NOT EXISTS (
    SELECT 1 FROM attraction_tags at WHERE at.attraction_id = x.id AND at.tag_id = t.id
  );
