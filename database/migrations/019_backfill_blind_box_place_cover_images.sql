START TRANSACTION;

-- Backfill public, directly linkable cover images for blind-box places.
-- Sources were matched by exact Wikipedia page images, Wikidata P18,
-- exact Wikimedia Commons file names, or official/government/city tourism image results.
-- Kept as direct UPDATE statements because the application DB user may not have CREATE TEMPORARY TABLES.

-- source: zhwiki-exact:故宫博物院
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Forbidden_City_Beijing_Shenwumen_Gate.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '故宫博物院'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:颐和园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/06/%E9%A2%90%E5%92%8C%E5%9B%AD%E4%B8%87%E5%AF%BF%E5%B1%B1%E4%BD%9B%E9%A6%99%E9%98%81.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '颐和园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:景山公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/93/Jingshan_Park_from_north_gate_of_Forbidden_City.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '景山公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:奧林匹克森林公園
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/5/5b/%E5%A5%A5%E6%9E%97%E5%8C%B9%E5%85%8B%E6%A3%AE%E6%9E%97%E5%85%AC%E5%9B%AD%E5%85%A8%E6%99%AF.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '奥林匹克森林公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: sparql:Q1203470:北京市朝陽區的藝術園區
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Space-gallery%20798-art-district.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '798艺术区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: commons-exact:Wudaoying Hutong
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Beijing_hutong_Wudaoying_3.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '五道营胡同'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:什刹海
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/95/Shishahai.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '什刹海'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:中国美术馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/9c/National_Art_Museum_of_China_%2820240627%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国美术馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:首钢园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Shougang_International_Convention_and_Exhibition_Center_during_CIFTIS_2024_%2820240916125402%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '首钢园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:中国园林博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/6/64/%E5%9B%AD%E6%9E%97%E5%8D%9A%E7%89%A9%E9%A6%86.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国园林博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京坊
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/1/12/Muji_Hotel_Beijing_%2820201211133431%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京坊'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:三里屯太古里
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/e/ee/%E4%B8%89%E9%87%8C%E5%B1%AF%E5%A4%AA%E5%8F%A4%E9%87%8C%E5%8D%97%E5%8C%BA.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '三里屯太古里'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:天坛
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Temple_of_Heaven_20160323_01.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '天坛公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北海公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/3/32/Beihai_Park_65414.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北海公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京中山公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/7/7f/China_IMG_0502_%2829203705461%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中山公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:陶然亭公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/2/26/%E9%99%B6%E7%84%B6%E4%BA%AD_-_Joyful_Pavilion_-_2011.11_-_panoramio_%281%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '陶然亭公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:玉渊潭公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Yuyuantan_Park_2010.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '玉渊潭公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: wikidata:Q1062603:朝阳公园 (北京)
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/South_gate_of_Chaoyang_Park_20240818154413.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '朝阳公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:紫竹院公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/4/49/Rockery_%26_Bamboo_in_Zizhuyuan.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '紫竹院公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:香山公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Xishan_Qingxue_monument_at_Fragrant_Hills.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '香山公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: sparql:Q111647783:位于北京海淀区的植物园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Beijing%20Botanical%20Garden%20-%20Oct%2009%20-%20IMG%201193.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '国家植物园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京动物园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Gate_of_Beijing_Zoo_%2820210219172711%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京动物园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:雍和宫
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Lascar_Lama_temple_%284478042700%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '雍和宫'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: alias-sparql:北京国子监:Q718582:元明清朝代的最高学府
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Guozijian%20building%201.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '孔庙和国子监博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: alias-sparql:北京鼓楼:Q10397389
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Beijing_drum_tower.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '鼓楼'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: alias-sparql:北京钟楼:Q21039255
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Beijingbelltower1.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '钟楼'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:烟袋斜街
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/d/d5/CN-pek-hutong-bei-trommelturm.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '烟袋斜街'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:南锣鼓巷
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/7/73/View_down_Nanluoguxiang_2011.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '南锣鼓巷'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:东交民巷
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Peking_Corner_of_the_Embassys_1910s.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '东交民巷'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:大栅栏
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Dashala_Enterance_2010.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '大栅栏'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:天安门广场
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/99/Tian%27anmen_from_the_square_%2820200825114150%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '天安门广场'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:中国国家博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/08/62684-Beijing-Tiananmen-Square_%2828609003992%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国国家博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:国家大剧院
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/01/NationalGrandTheaterBeijing.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '国家大剧院'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:首都博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/3/36/Capital_Museum_in_Beijing.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '首都博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:国家自然博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/01/Beijing_Museum_of_Natural_History_exterior_2010_Sep_04.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京自然博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京天文馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Beijing_Planetarium_%2820221112164636%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京天文馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:中国科学技术馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/e/ee/China_Science_and_Technology_Museum_%2820210403155720%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国科学技术馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:中国电影博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/b/b6/China_National_Film_Museum_%2820240808162205%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国电影博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京汽车博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Beijing_Automobile_Museum_%28from_north%29_2016_April.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京汽车博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: commons-exact:China Railway Museum Dongjiao
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Gate_of_China_Railway_Museum%2C_Dongjiao_%2820240808161123%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '中国铁道博物馆东郊馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: sparql:Q605463:
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Ullens%20Center%20for%20Contemporary%20Art%20%28UCCA%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = 'UCCA尤伦斯当代艺术中心'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: sparql:Q7812188:位于北京市的美术馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/SZ%20Art%20Center.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '今日美术馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: alias-sparql:妙应寺:Q2298526:
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Whitepagoda%20temple.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '白塔寺'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: alias-sparql:法源寺:Q1399104:
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fa%20yuan%20temple02.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '法源寺'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: commons-exact:西什库教堂
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/%E5%8C%97%E4%BA%AC%E8%A5%BF%E4%BB%80%E5%BA%93%E6%95%99%E5%A0%82%E5%A4%96%E9%83%A82023.3_%281%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '西什库教堂'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:杨梅竹斜街
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/7/78/Yangmeizhu_Xiejie_%2820240210151543%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '杨梅竹斜街'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京鲁迅博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/d/db/%E9%B2%81%E8%BF%85%E5%8D%9A%E7%89%A9%E9%A6%86_-_2162549628.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京鲁迅博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京大观园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Main_gate%2C_Daguanyuan.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京大观园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:南海子公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/98/%E5%8D%97%E6%B5%B7%E5%AD%90%E5%85%AC%E5%9B%AD.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '南海子公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:大运河森林公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/d/d9/West_gate_of_Grand_Canal_Forest_Park_%2820220415142954%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '大运河森林公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:城市绿心森林公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Central_Green_%2820220415132657%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '城市绿心森林公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:百望山森林公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Near_the_top_of_Baiwangshan_%2820160219151434%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '百望山森林公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:野鸭湖国家湿地公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/09/Gate_of_Yeya_Lake_National_Wetland_Park_%2820160709114929%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京野鸭湖国家湿地公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:潭柘寺
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Tanzhe_Si.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '潭柘寺'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:戒台寺
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Jietai_Temple_%2820150117134744%29.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '戒台寺'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:慕田峪长城
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Great_Wall_of_China%2C_Mutianyu%2C_Huairou_County%2C_China-10June2009.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '慕田峪长城'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:八达岭
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/c/c4/GreatWall_Badaling.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '八达岭长城'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:居庸关
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Juyongguanfromnorth.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '居庸关长城'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北京欢乐谷
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/4/44/Happy_Valley_Beijing_%285%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京欢乐谷'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:外滩
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/e/e5/A_picture_from_China_every_day_101.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '外滩'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:思南公馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Sinan_Mansions_Shanghai.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '思南公馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:北外滩滨江绿地
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/b/b8/%E5%8C%97%E5%A4%96%E7%81%98%E6%BF%B1%E6%B1%9F%E7%B6%A0%E5%9C%B0.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '北外滩滨江绿地'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:M50创意园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/0e/201703_M50_Creative_Park.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = 'M50创意园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:徐汇滨江地区
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/1/11/%E5%BE%90%E6%B1%87%E6%BB%A8%E6%B1%9F.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '徐汇滨江'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:美国乡村总会
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/4/42/Colombia_Club_01.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '上生新所'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:田子坊
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/90/Shanghai_Tianzifang_%E4%B8%8A%E6%B5%B7%E7%94%B0%E5%AD%90%E5%9D%8A_-_panoramio.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '田子坊'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:前灘太古里
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/3/3e/%E4%B8%8A%E6%B5%B7%E5%89%8D%E6%BB%A9%E5%A4%AA%E5%8F%A4%E9%87%8C.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '前滩太古里'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:上海公共租界工部局宰牲场
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/d/db/1933%C2%B7%E4%B8%8A%E6%B5%B7%E5%85%AC%E5%85%B1%E7%A7%9F%E7%95%8C%E5%B7%A5%E9%83%A8%E5%B1%80%E5%AE%B0%E7%89%B2%E5%9C%BA%C2%B7%E4%B8%8A%E6%B5%B7%E8%99%B9%E5%8F%A3%C2%B7%EF%BC%88%E6%AD%A3%E9%9D%A2%E4%BF%AF%E6%8B%8D%EF%BC%89.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '1933老场坊'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: alias-sparql:永庆坊:Q63925707:中國廣東廣州一個南北走向的內街創意園區
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Yongqingfang.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '西关永庆坊旅游区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:上下九步行街
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/a/a8/SHK2.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '上下九步行街'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:陈家祠
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Chen_Clan_Ancestral_Hall_2025.06_02.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '陈家祠'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:荔湾湖公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/f/f9/North_gate_of_Liwanhu_Park_20080314.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '荔湾湖公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:广州塔
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/8/84/Canton_Tower_2013.11.15_18-12-45.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '广州塔'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:广东省博物馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/5/5b/53334088348_Guangdong_Museum_%28cropped%29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '广东省博物馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:越秀山
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/5/54/Yuexiu_Park_Main_Gate_20260518.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '越秀公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: en-sparql:Shenzhen Bay Park:Q20716864
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Shenzhen%20Bay%20Park%20-%202019-12-09%20-%201.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '深圳湾公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:莲花山 (深圳)
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/8/85/Shenzhen_Lianhuashan_Park_South_East.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '莲花山公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:南頭古城
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/a/ad/%E5%8D%97%E5%A4%B4%E5%8F%A4%E5%9F%8E%E5%8D%97%E9%97%A82022.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '南头古城'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:華僑城創意園
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/d/d4/%E5%8D%8E%E4%BE%A8%E5%9F%8E%E5%88%9B%E6%84%8F%E5%9B%AD.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '华侨城创意文化园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:甘坑古鎮
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Gankeng_at_night%2C_December_2024_-9.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '甘坑古镇'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:海上世界
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/2/2d/%E6%B5%B7%E4%B8%8A%E4%B8%96%E7%95%8C%E6%98%8E%E5%8D%8E%E8%BD%AE.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '海上世界'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:仙湖植物园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/0/04/Hongfa_Temple%2C_Shenzhen_001.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '仙湖植物园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: alias-sparql:梧桐山:Q996504:中国深圳最高峰
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Ngtungsaan.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '梧桐山风景区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: visitbeijing:红砖美术馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://r1.visitbeijing.com.cn/vbj-s/2017/0419/20170419053817825.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '红砖美术馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: visitbeijing:亮马河国际风情水岸
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://r1.visitbeijing.com.cn/vbj-s/2023/1212/9967be3b17a2112fe03d7030bb041b29.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '亮马河国际风情水岸'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: visitbeijing:前门大街景区
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://r1.visitbeijing.com.cn/vbj-s/2023/0331/937c7ddf95f654f7c21b9959b5fc782b.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '前门大街'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: gooood:北京民生现代美术馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://oss.gooood.cn/uploads/2015/07/008-Minsheng-Contemporary-Art-Museum-Beijing-China-by-Studio-Pei-Zhu-960x640.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '北京民生现代美术馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: visitbeijing:凤凰岭自然风景区
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://r1.visitbeijing.com.cn/vbj-s/2015/1208/20151208044934408.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '北京'
  AND a.title = '凤凰岭自然风景区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: meet-in-shanghai:武康路-安福路街区
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://www.meet-in-shanghai.net/cn/uploads/2025/06/12/1933038428293681154.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '武康路历史文化风貌区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: meet-in-shanghai:武康路-安福路街区
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://www.meet-in-shanghai.net/cn/uploads/2025/06/12/1933038428293681154.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '安福路'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: shanghai-changning:愚园路
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://cn.storage.shmedia.tech/adfb12d8f3e14cab87e3a6a1590a298b',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '愚园路历史风貌街区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: meet-in-shanghai:苏州河水岸
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://obj.shine.cn/files/2024/04/21/123d4e26-8562-4f21-b445-ea2acf8774bf_0.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '苏州河滨水步道'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: commons-exact:豫园商城
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Yuyuan_Tourist_Mart_outside.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '上海'
  AND a.title = '豫园商城'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: xinhua:广州沙面
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://www.news.cn/politics/20240424/f4ace8da3c1a451b8c95a8c32981e3c3/20240424b4d4d17714d84a33934150737dfdecd5_33e83d025fb44067967bf4a181bfa258.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '沙面历史文化街区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: expedia:北京路步行街
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://images.trvl-media.com/place/6209409/9bca385c-7dfc-4655-b508-9de828bd2880.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '北京路文化旅游区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: qianggen:珠江夜游天字码头
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://img.qianggen.net/uploadfile/2023/0508/20230508054617823.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '珠江夜游天字码头路线'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: xinhua:东山口
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://www.news.cn/politics/20240116/1b8600703bf04c988cae535e155e5f9b/202401161b8600703bf04c988cae535e155e5f9b_59ca5667b2364d52846a8812b224c1c1.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '东山口历史文化街区'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: wikimedia:海珠湖
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Haizhu_Lake.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '海珠湖公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: huacheng:太古仓码头
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://huacheng.gz-cmc.com/upload/news/image/2021/10/05/dde21028711846d480ecbbbe9cf6434d.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '太古仓码头'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: oeeee:广州文化馆新馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://p1-mp.oeeee.com/202301/24/2047x3000_63cf5db46bca2.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '广州'
  AND a.title = '广州文化馆新馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: oeeee:前海石公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://p1-mp.oeeee.com/202503/20/1730x1280_67dbf4824c04b.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '前海石公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: zhwiki-exact:大芬村
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://upload.wikimedia.org/wikipedia/commons/9/98/Dafen_Oil_Painting_Village_%28Day%29.JPG',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '大芬油画村'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: bendibao:西湾红树林公园
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://imgbdb4.bendibao.com/szbdb/tour/202210/14/20221014151703_33254.png',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '西湾红树林公园'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: ourchinastory:欢乐港湾
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://www.ourchinastory.com/images/content/shenzhen/2023/07/%E6%AD%A1%E6%A8%82%E6%B8%AF%E7%81%A31_x1.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '欢乐港湾'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: archdaily:深圳当代艺术与城市规划馆
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://images.adsttc.com/media/images/583c/2371/e58e/ce78/6500/0090/large_jpg/P_0711_F009_DM.jpg?1480336224',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '深圳当代艺术与城市规划馆'
  AND (a.cover_image IS NULL OR a.cover_image = '');

-- source: utravel:万象天地
UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = 'https://resource02.ulifestyle.com.hk/ulcms/content/article/image/w600/2024/01/20240117211416_073212e6190287e725454ae5d6064d4ca44f95ce.jpg',
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = '深圳'
  AND a.title = '万象天地'
  AND (a.cover_image IS NULL OR a.cover_image = '');

COMMIT;

SELECT COUNT(*) AS blind_box_place_cover_images_after
FROM activities a
INNER JOIN cities c ON c.id = a.city_id
WHERE c.name IN ('北京', '上海', '广州', '深圳')
  AND a.cover_image IS NOT NULL
  AND a.cover_image <> '';
