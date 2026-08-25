INSERT INTO cities (name, code, province, is_active)
VALUES
  ('上海', 'shanghai', '上海', TRUE),
  ('杭州', 'hangzhou', '浙江', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  province = VALUES(province),
  is_active = VALUES(is_active);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '去江边等一场日落',
  '带一杯喜欢的饮料，到江边把今天慢下来。',
  '不需要复杂攻略。选一个视野开阔的位置，提前半小时到达，沿江慢走，等天空从金色变成蓝紫色。',
  '探索', '治愈', 'outdoor', 1, 4, 120, 30, 6.0,
  '徐汇区', '龙腾大道与瑞宁路附近', 31.1839000, 121.4657000,
  'https://uri.amap.com/search?keyword=徐汇滨江',
  JSON_ARRAY('提前查看日落时间', '带一杯水或饮料', '沿江散步并选一个喜欢的位置'),
  JSON_ARRAY('雨天不推荐', '夜间注意返程交通'), '#FF7A59', TRUE
FROM cities c
WHERE c.code = 'shanghai'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '去江边等一场日落' AND a.city_id = c.id);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '在旧书店盲选一本书',
  '不看评分，只凭封面和第一页选一本今天的书。',
  '给自己一小时，把推荐算法关在门外。去一家旧书店，随机走进一个书架区，只凭直觉挑一本书。',
  '文艺', '放松', 'indoor', 1, 2, 90, 80, 4.0,
  '黄浦区', '复兴中路周边书店', 31.2186000, 121.4691000,
  'https://uri.amap.com/search?keyword=复兴中路书店',
  JSON_ARRAY('走进一家没去过的书店', '从陌生书架挑三本', '读第一页后只买一本'),
  JSON_ARRAY('可先向店员确认旧书价格', '保持安静'), '#7357FF', TRUE
FROM cities c
WHERE c.code = 'shanghai'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '在旧书店盲选一本书' AND a.city_id = c.id);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '坐一站没坐过的轮渡',
  '把过江当成一次迷你旅行，在甲板上重新看看城市。',
  '从码头出发，选一条平时不会经过的轮渡线。上船后不要赶时间，到对岸再散步二十分钟。',
  '惊喜', '刺激', 'outdoor', 1, 5, 100, 20, 8.0,
  '浦东新区', '东昌路渡口附近', 31.2379000, 121.5054000,
  'https://uri.amap.com/search?keyword=东昌路渡口',
  JSON_ARRAY('确认当日轮渡运营时间', '到码头后随机选择一个靠窗位置', '到对岸步行探索二十分钟'),
  JSON_ARRAY('大风或停航时更换玩法', '保管好随身物品'), '#28B8A0', TRUE
FROM cities c
WHERE c.code = 'shanghai'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '坐一站没坐过的轮渡' AND a.city_id = c.id);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '吃一份地图上没收藏的小吃',
  '在老街上只走十五分钟，选第一家让你停下来的店。',
  '不用排行和收藏夹，只凭现场的香味、排队情况和直觉做一次小决定。',
  '美食', '社交', 'either', 1, 4, 80, 100, 5.0,
  '静安区', '陕西北路历史文化风貌区', 31.2342000, 121.4569000,
  'https://uri.amap.com/search?keyword=陕西北路美食',
  JSON_ARRAY('沿街步行十五分钟', '不打开点评软件', '选一家最想尝试的小店'),
  JSON_ARRAY('注意过敏原', '高峰期预留排队时间'), '#F6B73C', TRUE
FROM cities c
WHERE c.code = 'shanghai'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '吃一份地图上没收藏的小吃' AND a.city_id = c.id);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '绕西湖走一段陌生的路',
  '避开打卡点，从一条没走过的小路开始慢慢散步。',
  '不必环湖。选一个不熟悉的入口，沿湖走四十分钟，再在喜欢的位置停下来休息。',
  '探索', '治愈', 'outdoor', 1, 5, 120, 30, 6.0,
  '西湖区', '北山街与孤山路周边', 30.2531000, 120.1439000,
  'https://uri.amap.com/search?keyword=杭州北山街',
  JSON_ARRAY('选一个陌生入口', '不设终点散步四十分钟', '拍下一处让你停步的景色'),
  JSON_ARRAY('节假日尽量错峰', '注意天气和防晒'), '#28B8A0', TRUE
FROM cities c
WHERE c.code = 'hangzhou'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '绕西湖走一段陌生的路' AND a.city_id = c.id);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '在运河边找三座桥',
  '沿着运河散步，用三座不同的桥串起一条临时路线。',
  '从拱宸桥附近出发，每经过一座桥就换一个观察角度，最后找一家小店休息。',
  '惊喜', '放松', 'outdoor', 1, 4, 150, 60, 9.0,
  '拱墅区', '拱宸桥历史文化街区', 30.3194000, 120.1425000,
  'https://uri.amap.com/search?keyword=拱宸桥',
  JSON_ARRAY('从拱宸桥开始', '沿河找到另外两座桥', '结束后找一家小店休息'),
  JSON_ARRAY('夜间注意沿河安全', '雨天地面湿滑'), '#FF7A59', TRUE
FROM cities c
WHERE c.code = 'hangzhou'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '在运河边找三座桥' AND a.city_id = c.id);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '做一次安静的手作体验',
  '把手机放远一点，用双手完成一个可以带走的小作品。',
  '选择陶艺、木作或植物手作中的一种。重点不是成品完美，而是给注意力换一个方向。',
  '文艺', '治愈', 'indoor', 1, 4, 180, 300, 7.0,
  '上城区', '湖滨与南山路周边手作店', 30.2458000, 120.1625000,
  'https://uri.amap.com/search?keyword=杭州手作体验',
  JSON_ARRAY('提前电话确认是否需要预约', '选择一种手作项目', '完成后给作品取一个名字'),
  JSON_ARRAY('不同门店价格不同', '可能需要预约'), '#7357FF', TRUE
FROM cities c
WHERE c.code = 'hangzhou'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '做一次安静的手作体验' AND a.city_id = c.id);

INSERT INTO activities (
  city_id, title, summary, description, category, mood, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan,
  city_distance_km, district, address, latitude, longitude,
  navigation_url, steps, tips, accent_color, is_active
)
SELECT
  c.id,
  '随机点一杯没喝过的茶',
  '去茶馆，请店员按你今天的心情推荐一杯陌生的茶。',
  '告诉店员你今天想放松、提神或尝鲜，让对方替你做一次选择，再慢慢喝完。',
  '美食', '社交', 'indoor', 1, 3, 90, 100, 5.0,
  '西湖区', '青芝坞与玉泉周边', 30.2630000, 120.1310000,
  'https://uri.amap.com/search?keyword=杭州青芝坞茶馆',
  JSON_ARRAY('选一家顺眼的茶馆', '只描述心情不指定茶名', '认真喝完第一泡'),
  JSON_ARRAY('提前确认最低消费', '对咖啡因敏感者说明需求'), '#F6B73C', TRUE
FROM cities c
WHERE c.code = 'hangzhou'
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.title = '随机点一杯没喝过的茶' AND a.city_id = c.id);

