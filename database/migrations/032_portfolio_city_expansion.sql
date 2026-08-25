-- Portfolio-ready city expansion: provincial capitals, tourism hubs and AI industry cities.

INSERT INTO cities (name, code, province, is_active)
VALUES
  ('青岛', 'qingdao', '山东', TRUE),
  ('南京', 'nanjing', '江苏', TRUE),
  ('武汉', 'wuhan', '湖北', TRUE),
  ('成都', 'chengdu', '四川', TRUE),
  ('西安', 'xian', '陕西', TRUE),
  ('长沙', 'changsha', '湖南', TRUE),
  ('广州', 'guangzhou', '广东', TRUE),
  ('合肥', 'hefei', '安徽', TRUE),
  ('重庆', 'chongqing', '重庆', TRUE),
  ('厦门', 'xiamen', '福建', TRUE),
  ('济南', 'jinan', '山东', TRUE),
  ('昆明', 'kunming', '云南', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  province = VALUES(province),
  is_active = TRUE;

CREATE TEMPORARY TABLE tmp_portfolio_city_activities (
  city_code VARCHAR(32) NOT NULL,
  title VARCHAR(120) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(32) NOT NULL,
  mood VARCHAR(32) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  budget_yuan SMALLINT UNSIGNED NOT NULL,
  district VARCHAR(64) NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  cover_image VARCHAR(500) NOT NULL,
  steps JSON NOT NULL,
  tips JSON NOT NULL,
  accent_color CHAR(7) NOT NULL
);

INSERT INTO tmp_portfolio_city_activities VALUES
  ('qingdao', '从八大关走到海边收集红瓦色卡', '在林荫路、老建筑和海岸之间，收集一组属于青岛的颜色。', '从八大关景区慢走到第二海水浴场，只拍红瓦、树影和海面三组颜色。', '风景人文', '放松', 150, 50, '市南区', '八大关风景区至第二海水浴场', 36.0524000, 120.3452000, 'https://upload.wikimedia.org/wikipedia/commons/9/99/Qingdao_%2831424840488%29.jpg', JSON_ARRAY('从八大关林荫路出发', '收集三种城市颜色', '在海边停留十分钟'), JSON_ARRAY('海边风大时带薄外套', '不进入未开放建筑'), '#78E8FF'),
  ('nanjing', '沿陵园路梧桐走到明孝陵', '让梧桐、城墙与山林把一段周末变成电影画面。', '从苜蓿园一带进入陵园路，沿梧桐大道慢走到明孝陵附近。', '风景人文', '放松', 180, 80, '玄武区', '陵园路梧桐大道至明孝陵', 32.0584000, 118.8333000, 'https://upload.wikimedia.org/wikipedia/commons/f/fd/%E5%8D%97%E4%BA%AC%E6%80%BB%E7%BB%9F%E5%BA%9C%E8%A5%BF%E8%8A%B1%E5%8E%852024.3.jpg', JSON_ARRAY('从陵园路入口出发', '沿梧桐大道慢走', '选一处历史细节停留'), JSON_ARRAY('节假日尽量早到', '穿舒适步行鞋'), '#C9FF62'),
  ('wuhan', '在东湖绿道骑到湖面变蓝', '用一段湖边骑行，把注意力从屏幕换到风和水面。', '从东湖绿道湖光序曲附近租车出发，在最喜欢的一处湖湾停下。', '轻户外', '探索', 180, 60, '武昌区', '东湖绿道湖光序曲', 30.5621000, 114.4097000, 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Revolution_of_1911_Museum.jpg', JSON_ARRAY('湖光序曲附近租车', '沿湖骑到想停的位置', '在湖湾休息后返回'), JSON_ARRAY('高温天气避开正午', '遵守绿道规则'), '#78E8FF'),
  ('chengdu', '在人民公园把下午交给一杯茶', '不赶景点，在茶馆、树影和城市闲谈里体验成都的松弛。', '到人民公园找一处露天茶座，喝一杯盖碗茶，再沿少城街巷散步。', '城市漫游', '放松', 150, 80, '青羊区', '人民公园与少城街巷', 30.6614000, 104.0555000, 'https://upload.wikimedia.org/wikipedia/commons/7/74/%E9%9B%AA%E5%B1%B1%E4%B8%8B%E7%9A%84%E6%88%90%E9%83%BD%E5%B8%82%E5%A4%A9%E9%99%85%E7%BA%BF_Chengdu_skyline_with_snow_capped_mountains.jpg', JSON_ARRAY('找一处露天茶座', '安静喝茶四十分钟', '沿少城街巷散步'), JSON_ARRAY('周末可能需要等位', '尊重本地休闲秩序'), '#D9A94E'),
  ('xian', '在城墙上追一段古都夜色', '从黄昏走到灯亮，用高处视角重新认识西安。', '傍晚从永宁门登城墙，向任意方向慢走，在灯光亮起后选择一处城楼停留。', '历史夜游', '探索', 150, 100, '碑林区', '西安城墙永宁门', 34.2493000, 108.9427000, 'https://upload.wikimedia.org/wikipedia/commons/4/44/%E8%A5%BF%E5%AE%89%E9%92%9F%E6%A5%BC2020_%281%29.jpg', JSON_ARRAY('日落前从永宁门登城', '沿城墙任选方向慢走', '灯亮后在城楼停留'), JSON_ARRAY('确认开放时间', '城墙风大注意保暖'), '#FFCF68'),
  ('changsha', '沿湘江走到橘子洲夜色亮起', '把江风、城市灯光和街头烟火串成一条轻松路线。', '从湘江东岸出发，沿江慢走观察橘子洲灯光，最后只选一种长沙小吃。', '城市夜游', '热闹', 150, 80, '岳麓区', '橘子洲与湘江风光带', 28.1914000, 112.9615000, 'https://upload.wikimedia.org/wikipedia/commons/c/cc/%E7%88%B1%E6%99%9A%E4%BA%AD%EF%BC%88%E7%A7%8B-%E4%BE%A7%E9%9D%A2%EF%BC%89.jpg', JSON_ARRAY('从湘江风光带出发', '沿江看橘子洲亮灯', '只选一种小吃收尾'), JSON_ARRAY('提前规划交通', '江边注意步行安全'), '#FF8F72'),
  ('guangzhou', '从永庆坊走到荔枝湾听粤语街声', '沿骑楼与水岸慢走，找一处传统和年轻生活交叠的细节。', '从永庆坊进入西关街巷，沿恩宁路走到荔枝湾。', '风景人文', '探索', 150, 100, '荔湾区', '永庆坊至荔枝湾', 23.1163000, 113.2388000, 'https://upload.wikimedia.org/wikipedia/commons/2/24/Canton_Tower_20241027.jpg', JSON_ARRAY('从永庆坊进入西关', '找一栋喜欢的骑楼', '沿荔枝湾慢走收尾'), JSON_ARRAY('夏季注意补水', '避免打扰居民'), '#C9FF62'),
  ('hefei', '在天鹅湖边完成一次未来城市观察', '从湖岸看向城市新中心，记录自然、建筑和科技感的交界。', '沿天鹅湖步道慢走，分别拍下一张自然、公共建筑和城市灯光照片。', '未来城市', '探索', 120, 30, '蜀山区', '天鹅湖公园', 31.8157000, 117.2272000, 'https://upload.wikimedia.org/wikipedia/commons/9/91/%E5%A4%A9%E9%B9%85%E6%B9%96.jpg', JSON_ARRAY('从湖岸步道出发', '记录三类城市画面', '在城市新中心方向停留'), JSON_ARRAY('夜间注意湖边安全', '适合通透的傍晚'), '#78E8FF'),
  ('chongqing', '沿山城步道寻找三次空间反转', '从屋顶走到街道，再从街道看见轻轨，用脚理解立体重庆。', '从山城巷附近出发，寻找楼梯、穿楼交通和高低落差三种空间反转。', '城市漫游', '探索', 180, 80, '渝中区', '山城巷传统风貌区', 29.5549000, 106.5702000, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Chongqing_Nightscape.jpg', JSON_ARRAY('从山城巷进入步道', '寻找三种空间反转', '在江景平台结束路线'), JSON_ARRAY('台阶较多穿防滑鞋', '雨天缩短路线'), '#AA72FF'),
  ('xiamen', '沿环岛路骑到一处没计划的海滩', '让海风决定终点，不追热门打卡点。', '从曾厝垵附近租车，沿环岛路骑行，在第一处想停下的海滩休息。', '轻户外', '放松', 180, 80, '思明区', '环岛路曾厝垵附近', 24.4434000, 118.1216000, 'https://upload.wikimedia.org/wikipedia/commons/5/51/Xiamen_night_cityscape_2018_-_Flickr_-_Jaykhuang.jpg', JSON_ARRAY('曾厝垵附近租车', '沿环岛路骑行', '在第一处想停的海滩休息'), JSON_ARRAY('注意骑行车道', '做好海边防晒'), '#78E8FF'),
  ('jinan', '从曲水亭街循着泉声走到大明湖', '不看地图，只沿水声和老街走进泉城的日常。', '从曲水亭街出发，沿水渠慢走到大明湖，找一处泉水边观察当地生活。', '风景人文', '放松', 120, 50, '历下区', '曲水亭街至大明湖', 36.6747000, 117.0249000, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/China_Jinan_5196975.jpg', JSON_ARRAY('沿水渠从曲水亭街出发', '在泉水边停留', '步行进入大明湖'), JSON_ARRAY('保持泉池清洁', '夏季注意防晒'), '#58BFA8'),
  ('kunming', '从翠湖走到文化巷找一束当季花', '在高原阳光、湖边树影和花市色彩中慢慢度过半天。', '从翠湖公园开始，经文林街到文化巷，只凭颜色选择一束花或一份小食。', '城市漫游', '放松', 150, 80, '五华区', '翠湖公园至文化巷', 25.0544000, 102.7035000, 'https://upload.wikimedia.org/wikipedia/commons/e/e2/%E4%BA%94%E5%8D%8E%E5%8C%BA%E4%B8%8E%E7%9B%98%E9%BE%99%E5%8C%BA%E5%A4%A9%E9%99%85%E7%BA%BF_-_%E8%88%AA%E6%8B%8D_-_2025-05-16_03.jpg', JSON_ARRAY('沿翠湖慢走一圈', '经文林街前往文化巷', '只凭颜色选一束花或一份小食'), JSON_ARRAY('高原紫外线强', '尊重市场秩序'), '#C9FF62');

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, cover_image, steps, tips, accent_color, is_active
)
SELECT
  c.id, p.title, p.summary, p.description, p.category, p.mood, 'outdoor',
  1, 4, p.duration_minutes, p.budget_yuan,
  8.00, p.district, p.address, p.latitude, p.longitude,
  CONCAT('https://uri.amap.com/search?keyword=', c.name, p.address),
  p.cover_image, p.steps, p.tips, p.accent_color, TRUE
FROM tmp_portfolio_city_activities p
INNER JOIN cities c ON c.code = p.city_code
WHERE NOT EXISTS (
  SELECT 1 FROM activities a WHERE a.city_id = c.id AND a.title = p.title
);

INSERT INTO destinations (
  city_id, name, province, summary, description, cover_image, best_seasons,
  avg_cost_per_day, rating, popularity, is_hot, is_active
)
SELECT
  c.id, c.name, c.province,
  CONCAT(c.name, '周末城市探索'),
  CONCAT('用一条真实可执行的路线，在', c.name, '完成一次无需复杂攻略的周末探索。'),
  p.cover_image,
  JSON_ARRAY('春', '夏', '秋', '冬'),
  360, 4.80,
  CASE WHEN c.code IN ('chengdu', 'chongqing', 'xian', 'qingdao', 'nanjing', 'wuhan', 'guangzhou') THEN 96 ELSE 90 END,
  c.code IN ('chengdu', 'chongqing', 'xian', 'qingdao', 'nanjing', 'wuhan', 'guangzhou'),
  TRUE
FROM cities c
INNER JOIN tmp_portfolio_city_activities p ON p.city_code = c.code
WHERE NOT EXISTS (SELECT 1 FROM destinations d WHERE d.city_id = c.id);

UPDATE destinations d
INNER JOIN cities c ON c.id = d.city_id
INNER JOIN tmp_portfolio_city_activities p ON p.city_code = c.code
SET
  d.name = c.name,
  d.province = c.province,
  d.summary = CONCAT(c.name, '周末城市探索'),
  d.description = CONCAT('用一条真实可执行的路线，在', c.name, '完成一次无需复杂攻略的周末探索。'),
  d.cover_image = p.cover_image,
  d.rating = 4.80,
  d.popularity = CASE WHEN c.code IN ('chengdu', 'chongqing', 'xian', 'qingdao', 'nanjing', 'wuhan', 'guangzhou') THEN 96 ELSE 90 END,
  d.is_hot = c.code IN ('chengdu', 'chongqing', 'xian', 'qingdao', 'nanjing', 'wuhan', 'guangzhou'),
  d.is_active = TRUE;

INSERT INTO travel_tags (name, category, sort_order, is_active)
VALUES
  ('治愈', 'theme', 40, TRUE), ('松弛', 'theme', 41, TRUE), ('人文', 'theme', 42, TRUE),
  ('美食', 'food', 43, TRUE), ('轻户外', 'scene', 44, TRUE), ('亲子', 'audience', 45, TRUE),
  ('古镇', 'scene', 46, TRUE), ('海边', 'scene', 47, TRUE), ('5A景区', 'scene', 48, TRUE),
  ('秘境', 'scene', 49, TRUE), ('季节限定', 'season', 50, TRUE),
  ('AI之城', 'other', 51, TRUE), ('城市夜游', 'theme', 52, TRUE)
ON DUPLICATE KEY UPDATE category = VALUES(category), is_active = TRUE;

CREATE TEMPORARY TABLE tmp_portfolio_destination_tags (
  city_code VARCHAR(32) NOT NULL,
  tag_name VARCHAR(32) NOT NULL
);

INSERT INTO tmp_portfolio_destination_tags VALUES
  ('qingdao','海边'),('qingdao','人文'),('qingdao','美食'),('qingdao','轻户外'),('qingdao','秘境'),('qingdao','5A景区'),
  ('nanjing','人文'),('nanjing','治愈'),('nanjing','5A景区'),('nanjing','季节限定'),('nanjing','古镇'),
  ('wuhan','轻户外'),('wuhan','人文'),('wuhan','美食'),('wuhan','亲子'),('wuhan','秘境'),('wuhan','5A景区'),
  ('chengdu','松弛'),('chengdu','美食'),('chengdu','亲子'),('chengdu','人文'),('chengdu','古镇'),
  ('xian','人文'),('xian','美食'),('xian','5A景区'),('xian','亲子'),
  ('changsha','美食'),('changsha','人文'),('changsha','松弛'),('changsha','城市夜游'),
  ('guangzhou','美食'),('guangzhou','人文'),('guangzhou','亲子'),('guangzhou','松弛'),('guangzhou','古镇'),
  ('hefei','轻户外'),('hefei','亲子'),('hefei','治愈'),('hefei','秘境'),('hefei','AI之城'),
  ('chongqing','美食'),('chongqing','轻户外'),('chongqing','人文'),('chongqing','城市夜游'),('chongqing','秘境'),
  ('xiamen','海边'),('xiamen','治愈'),('xiamen','亲子'),('xiamen','松弛'),('xiamen','季节限定'),
  ('jinan','治愈'),('jinan','人文'),('jinan','亲子'),('jinan','5A景区'),('jinan','古镇'),
  ('kunming','治愈'),('kunming','松弛'),('kunming','美食'),('kunming','季节限定'),('kunming','古镇'),('kunming','秘境');

INSERT INTO destination_tags (destination_id, tag_id)
SELECT d.id, t.id
FROM tmp_portfolio_destination_tags m
INNER JOIN cities c ON c.code = m.city_code
INNER JOIN destinations d ON d.city_id = c.id
INNER JOIN travel_tags t ON t.name = m.tag_name COLLATE utf8mb4_unicode_ci
WHERE NOT EXISTS (
  SELECT 1 FROM destination_tags dt WHERE dt.destination_id = d.id AND dt.tag_id = t.id
);

DROP TEMPORARY TABLE tmp_portfolio_destination_tags;

INSERT INTO attractions (
  destination_id, activity_id, name, summary, description, address,
  latitude, longitude, ticket_price_min, ticket_price_max,
  suggested_duration, suitable_audiences, best_seasons,
  rating, popularity, is_active
)
SELECT
  d.id, a.id, a.title, a.summary, a.description, a.address,
  a.latitude, a.longitude, 0, a.budget_yuan, a.duration_minutes,
  JSON_ARRAY('独自', '双人', '朋友'), JSON_ARRAY('春', '夏', '秋', '冬'),
  4.70, 92, TRUE
FROM activities a
INNER JOIN cities c ON c.id = a.city_id
INNER JOIN destinations d ON d.city_id = c.id
INNER JOIN tmp_portfolio_city_activities p ON p.city_code = c.code AND p.title = a.title
WHERE NOT EXISTS (SELECT 1 FROM attractions x WHERE x.activity_id = a.id);

INSERT INTO attraction_tags (attraction_id, tag_id)
SELECT x.id, t.id
FROM attractions x
INNER JOIN activities a ON a.id = x.activity_id
INNER JOIN tmp_portfolio_city_activities p ON p.title = a.title
INNER JOIN travel_tags t ON t.name = p.mood COLLATE utf8mb4_unicode_ci
WHERE NOT EXISTS (
  SELECT 1 FROM attraction_tags at WHERE at.attraction_id = x.id AND at.tag_id = t.id
);

DROP TEMPORARY TABLE tmp_portfolio_city_activities;
