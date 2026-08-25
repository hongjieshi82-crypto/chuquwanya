-- Use committed, licensed landmark photos for every active MVP city.

UPDATE destinations d
INNER JOIN cities c ON c.id = d.city_id
SET d.cover_image = CASE c.code
  WHEN 'shanghai' THEN '/assets/city-covers/shanghai.jpg'
  WHEN 'hangzhou' THEN '/assets/city-covers/hangzhou.jpg'
  WHEN 'beijing' THEN '/assets/city-covers/beijing.jpg'
  WHEN 'shenzhen' THEN '/assets/city-covers/shenzhen.jpg'
  WHEN 'tianjin' THEN '/assets/city-covers/tianjin.jpg'
  WHEN 'yantai' THEN '/assets/city-covers/yantai.jpg'
  ELSE d.cover_image
END
WHERE c.code IN ('shanghai', 'hangzhou', 'beijing', 'shenzhen', 'tianjin', 'yantai');
