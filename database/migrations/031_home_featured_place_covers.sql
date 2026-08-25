-- Give the three featured homepage activities location-specific real photos.

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET a.cover_image = '/assets/place-covers/shenzhen-lianhuashan.jpg'
WHERE c.code = 'shenzhen' AND a.title = '登莲花山看一次城市天际线';

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET a.cover_image = '/assets/place-covers/beijing-olympic-forest.jpg'
WHERE c.code = 'beijing' AND a.title = '在奥森盲走一段林间路';

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET a.cover_image = '/assets/place-covers/tianjin-five-avenues.jpg'
WHERE c.code = 'tianjin' AND a.title = '在五大道收集四种建筑颜色';

UPDATE attractions x
INNER JOIN activities a ON a.id = x.activity_id
SET x.cover_image = a.cover_image
WHERE a.cover_image LIKE '/assets/place-covers/%';
