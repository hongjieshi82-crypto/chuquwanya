-- Backfill cover images for the original seed activities that predate the
-- blind-box place import. Keep this idempotent so it is safe across envs.

-- source: zhwiki-exact:徐汇滨江地区
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/1/11/%E5%BE%90%E6%B1%87%E6%BB%A8%E6%B1%9F.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '去江边等一场日落'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: sina/thepaper:上海旧书店搬入三楼
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://n.sinaimg.cn/sinakd20250418s/192/w1024h768/20250418/bb90-adff2d5f601309cf60d5e9f85341d16b.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '在旧书店盲选一本书'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: ctrip:黄浦江游览(金陵东路码头)
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://dimg04.c-ctrip.com/images/0102s12000f6q7xqzE259_W_750_0.jpg?proc=autoorient',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '坐一站没坐过的轮渡'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:田子坊
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/90/Shanghai_Tianzifang_%E4%B8%8A%E6%B5%B7%E7%94%B0%E5%AD%90%E5%9D%8A_-_panoramio.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '吃一份地图上没收藏的小吃'
  AND (a.cover_image IS NULL OR a.cover_image = '');
