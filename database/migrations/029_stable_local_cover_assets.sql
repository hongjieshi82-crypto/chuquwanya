-- Replace missing uploads and fragile remote hotlinks with committed local cover assets.

UPDATE destinations d
INNER JOIN cities c ON c.id = d.city_id
SET d.cover_image = CASE c.code
  WHEN 'shanghai' THEN '/assets/city-covers/shanghai.png'
  WHEN 'hangzhou' THEN '/assets/city-covers/hangzhou.jpg'
  WHEN 'beijing' THEN '/assets/city-covers/beijing.png'
  WHEN 'shenzhen' THEN '/assets/city-covers/shenzhen.jpg'
  WHEN 'tianjin' THEN '/assets/city-covers/tianjin.png'
  WHEN 'yantai' THEN '/assets/city-covers/yantai.png'
  ELSE d.cover_image
END
WHERE c.code IN ('shanghai', 'hangzhou', 'beijing', 'shenzhen', 'tianjin', 'yantai');

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET a.cover_image = CASE
  WHEN a.category = '文艺' THEN '/assets/activity-covers/art.png'
  WHEN a.category = '美食' THEN '/assets/activity-covers/food.png'
  WHEN a.category = '惊喜' THEN '/assets/activity-covers/surprise.png'
  WHEN a.environment = 'outdoor' THEN '/assets/activity-covers/outdoor.png'
  ELSE '/assets/activity-covers/explore.png'
END
WHERE c.code IN ('shanghai', 'hangzhou', 'beijing', 'shenzhen', 'tianjin', 'yantai')
  AND a.is_active = TRUE;

UPDATE attractions x
INNER JOIN activities a ON a.id = x.activity_id
SET x.cover_image = a.cover_image
WHERE x.is_active = TRUE;
