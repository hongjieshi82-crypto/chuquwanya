-- Backfill the remaining blind-box imported activities. Exact matches are
-- filled first. Any still-missing rows receive a city-level fallback image.

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
INNER JOIN (
  SELECT '南京' AS city_name, '中山陵景区' AS title, 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Hall_of_Sun_Yat-sen_Mausoleum.jpg' AS cover_image UNION ALL
  SELECT '南京', '先锋书店五台山店', 'https://commons.wikimedia.org/wiki/Special:FilePath/Facade_of_Libraire_Avant-Garde%28Wutai_Mountain_branch%29.jpg' UNION ALL
  SELECT '南京', '南京1865创意园', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ginling_Machinery_Manufacture_Bureau_2011-03.JPG' UNION ALL
  SELECT '南京', '南京博物院', 'https://commons.wikimedia.org/wiki/Special:FilePath/Banner_of_Nanjing_Museum%2C_2015-06-20.jpg' UNION ALL
  SELECT '南京', '南京城墙', 'https://upload.wikimedia.org/wikipedia/commons/9/90/Nanjing_in_Ming_Dynasty.jpg' UNION ALL
  SELECT '南京', '夫子庙秦淮风光带', 'https://upload.wikimedia.org/wikipedia/commons/9/91/Qinhuai_River_along_Fuzimiao_2008.jpg' UNION ALL
  SELECT '南京', '明孝陵景区', 'https://commons.wikimedia.org/wiki/Special:FilePath/Nanjing_Ming_Xiaoling_2017.11.11_08-10-27.jpg' UNION ALL
  SELECT '南京', '玄武湖公园', 'https://commons.wikimedia.org/wiki/Special:FilePath/Xuanwuhu.jpg' UNION ALL
  SELECT '南京', '老门东历史文化街区', 'https://upload.wikimedia.org/wikipedia/commons/9/91/Qinhuai_River_along_Fuzimiao_2008.jpg' UNION ALL
  SELECT '南京', '陵园路梧桐大道', 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Hall_of_Sun_Yat-sen_Mausoleum.jpg' UNION ALL
  SELECT '南京', '颐和路历史文化街区', 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Ninghai_Road.jpg' UNION ALL
  SELECT '南京', '鸡鸣寺', 'https://commons.wikimedia.org/wiki/Special:FilePath/Jiming_Temple_Nanjing%2C_2019_%28cropped%29.jpg' UNION ALL
  SELECT '成都', '东郊记忆', 'https://commons.wikimedia.org/wiki/Special:FilePath/Name_Wall_of_Dongjiao_Memory_Station%2C_Chengdu_Metro_Line_8.jpg' UNION ALL
  SELECT '成都', '人民公园', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%88%90%E9%83%BD%E4%BA%BA%E6%B0%91%E5%85%AC%E5%9B%AD%E5%8C%97%E5%A4%A7%E9%97%A8.jpg' UNION ALL
  SELECT '成都', '宽窄巷子', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chengdu_travel_045_%2836150300546%29.jpg' UNION ALL
  SELECT '成都', '彭镇观音阁老茶馆', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pengzhen_Street_Scene_1.jpg' UNION ALL
  SELECT '成都', '成都博物馆', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%88%90%E9%83%BD%E5%8D%9A%E7%89%A9%E9%A6%86%E6%AD%A3%E9%97%A8.jpg' UNION ALL
  SELECT '成都', '成都大熊猫繁育研究基地', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chengdu_Research_Base_Eingang.jpg' UNION ALL
  SELECT '成都', '望江楼公园', 'https://commons.wikimedia.org/wiki/Special:FilePath/Wangjianglou-Tower.jpg' UNION ALL
  SELECT '成都', '杜甫草堂博物馆', 'https://commons.wikimedia.org/wiki/Special:FilePath/Du_Fu_cao_tang.jpg' UNION ALL
  SELECT '成都', '浣花溪公园', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%B5%A3%E8%8A%B1%E6%BA%AA%E5%85%AC%E5%9B%AD%EF%BC%8D%E5%B0%8F%E6%A1%A5_-_panoramio.jpg' UNION ALL
  SELECT '成都', '铁像寺水街', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E9%90%B5%E5%83%8F%E5%AF%BA%E5%B1%B1%E9%96%80.jpg' UNION ALL
  SELECT '成都', '锦里古街', 'https://commons.wikimedia.org/wiki/Special:FilePath/Jinli_Street_35201-Chengdu_%2849068150581%29.jpg' UNION ALL
  SELECT '杭州', '上天竺法喜讲寺', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%9D%AD%E5%B7%9E._%E5%A4%B4%E5%A4%A9%E7%AB%BA%EF%BC%88%E6%B3%95%E5%96%9C%E8%AE%B2%E5%AF%BA%EF%BC%89_-_panoramio.jpg' UNION ALL
  SELECT '杭州', '中国茶叶博物馆', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E4%B8%AD%E5%9B%BD%E8%8C%B6%E5%8F%B6%E5%8D%9A%E7%89%A9%E9%A6%86%E5%8F%8C%E5%B3%B0%E9%A6%86%E5%8C%BA%2C_2022-05-01_01.jpg' UNION ALL
  SELECT '杭州', '九溪烟树', 'https://commons.wikimedia.org/wiki/Special:FilePath/Jiuxiyanshu.JPG' UNION ALL
  SELECT '杭州', '天目里', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%9D%AD%E5%B7%9E%E5%A4%A9%E7%9B%AE%E9%87%8C%E5%B9%BF%E5%9C%BA.png' UNION ALL
  SELECT '杭州', '灵隐寺', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hangzhou_Lingyin-Temple_20161003.jpg' UNION ALL
  SELECT '杭州', '西湖风景名胜区', 'https://commons.wikimedia.org/wiki/Special:FilePath/West_Lake%2C_Hangzhou_2025.jpg' UNION ALL
  SELECT '武汉', '东湖绿道', 'https://commons.wikimedia.org/wiki/Special:FilePath/East_Lake_Wuhan.JPG' UNION ALL
  SELECT '武汉', '古德寺', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E5%8F%A4%E5%BE%B7%E5%AF%BA%E5%9C%86%E9%80%9A%E6%AE%BF2023.4_%281%29.jpg' UNION ALL
  SELECT '武汉', '咸安坊', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E5%92%B8%E5%AE%89%E5%9D%8A.jpg' UNION ALL
  SELECT '武汉', '昙华林', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tanhualin.JPG' UNION ALL
  SELECT '武汉', '楚河汉街', 'https://upload.wikimedia.org/wikipedia/commons/d/d6/WuhanChuRiverHanStreet.png' UNION ALL
  SELECT '武汉', '武汉美术馆汉口馆', 'https://commons.wikimedia.org/wiki/Special:FilePath/Wuhanam.jpg' UNION ALL
  SELECT '武汉', '江汉路步行街', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hankou-Hanjiang-Lu-0247.jpg' UNION ALL
  SELECT '武汉', '湖北省博物馆', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hubei_Provincial_Museum.JPG' UNION ALL
  SELECT '武汉', '黄鹤楼公园', 'https://commons.wikimedia.org/wiki/Special:FilePath/CN_-_Hubei_-_Wuhan_-_Kranichpagode.jpg' UNION ALL
  SELECT '武汉', '黎黄陂路', 'https://commons.wikimedia.org/wiki/Special:FilePath/LiHuangPi_Road%EF%BC%8CWuhan%EF%BC%8CChina.jpg' UNION ALL
  SELECT '西安', '书院门文化街', 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Baoqing_Temple_Pagoda.jpg' UNION ALL
  SELECT '西安', '回民街', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bei_Yuan_Men.JPG' UNION ALL
  SELECT '西安', '大唐不夜城', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E9%9B%81%E5%A1%94_%E5%A4%A7%E5%94%90%E4%B8%8D%E5%A4%9C%E5%9F%8E%E5%92%8C%E5%A4%A7%E9%9B%81%E5%A1%94.jpg' UNION ALL
  SELECT '西安', '大雁塔北广场', 'https://commons.wikimedia.org/wiki/Special:FilePath/Giant_Wild_Goose_Pagoda.jpg' UNION ALL
  SELECT '西安', '曲江池遗址公园', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%9B%B2%E6%B1%9F%E6%B1%A0%E5%85%AC%E5%9B%AD%E8%88%AA%E6%8B%8D%E5%9B%BE.jpg' UNION ALL
  SELECT '西安', '秦始皇帝陵博物院', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E7%A7%A6%E5%A7%8B%E7%9A%87%E5%B8%9D%E9%99%B5%C2%B7%E7%A7%A6%E5%A7%8B%E7%9A%87%E9%99%B5%C2%B7%E8%A5%BF%E5%AE%89%E8%87%A8%E6%BD%BC%C2%B7%EF%BC%88%E5%B0%81%E5%9C%9F%E6%AD%A3%E5%8C%97%E5%81%B4%EF%BC%89.jpg' UNION ALL
  SELECT '西安', '西安博物院', 'https://commons.wikimedia.org/wiki/Special:FilePath/Xi%27an_Museum_2024.jpg' UNION ALL
  SELECT '西安', '西安城墙', 'https://commons.wikimedia.org/wiki/Special:FilePath/City_wall_of_Xi%27an_51550-Xian_%2827959363326%29.jpg' UNION ALL
  SELECT '西安', '陕西历史博物馆', 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Shan3xi_History_Museum.jpg' UNION ALL
  SELECT '重庆', '南滨路', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E5%8D%97%E6%BF%B1%E8%B7%AF%E9%90%98%E6%A8%93.jpg' UNION ALL
  SELECT '重庆', '山城步道', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E5%B1%B1%E5%9F%8E%E5%B7%B7%E4%B8%8A%E5%8C%BA.jpg' UNION ALL
  SELECT '重庆', '李子坝轻轨站观景平台', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%9D%8E%E5%AD%90%E5%9D%9D%E7%AB%99%E8%BD%BB%E8%BD%A8%E7%A9%BF%E6%A5%BC_0023.png' UNION ALL
  SELECT '重庆', '洪崖洞民俗风貌区', 'https://commons.wikimedia.org/wiki/Special:FilePath/202308_Hongya_Cave_at_night_from_Qiansimen_Bridge.jpg' UNION ALL
  SELECT '重庆', '白象居', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E9%87%8D%E5%BA%86_%E9%95%BF%E6%B1%9F%E4%B8%8A%E7%9A%84%E6%B8%A1%E6%B1%9F%E7%B4%A2%E9%81%932.jpg' UNION ALL
  SELECT '重庆', '磁器口古镇', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E9%87%8D%E5%BA%86%E7%A3%81%E5%99%A8%E5%8F%A3%E5%8F%A4%E9%95%87%E8%BF%9C%E7%9C%BA.jpg' UNION ALL
  SELECT '重庆', '重庆中国三峡博物馆', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chongqing_Zhongguo_Sanxia_Bowuguan_2014.04.21_11-11-06.jpg' UNION ALL
  SELECT '重庆', '长江索道景区', 'https://commons.wikimedia.org/wiki/Special:FilePath/%E9%87%8D%E5%BA%86_%E9%95%BF%E6%B1%9F%E4%B8%8A%E7%9A%84%E6%B8%A1%E6%B1%9F%E7%B4%A2%E9%81%931_-_panoramio.jpg'
) v ON v.city_name = c.name AND v.title = a.title
SET
  a.cover_image = v.cover_image,
  a.updated_at = CURRENT_TIMESTAMP
WHERE a.description LIKE '来自《出行盲盒地点库%'
  AND (a.cover_image IS NULL OR a.cover_image = '');

UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.cover_image = CASE c.name
    WHEN '南京' THEN 'https://upload.wikimedia.org/wikipedia/commons/9/91/Qinhuai_River_along_Fuzimiao_2008.jpg'
    WHEN '成都' THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Chengdu_travel_045_%2836150300546%29.jpg'
    WHEN '杭州' THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/West_Lake%2C_Hangzhou_2025.jpg'
    WHEN '武汉' THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/East_Lake_Wuhan.JPG'
    WHEN '西安' THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/City_wall_of_Xi%27an_51550-Xian_%2827959363326%29.jpg'
    WHEN '重庆' THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/202308_Hongya_Cave_at_night_from_Qiansimen_Bridge.jpg'
  END,
  a.updated_at = CURRENT_TIMESTAMP
WHERE a.description LIKE '来自《出行盲盒地点库%'
  AND c.name IN ('南京', '成都', '杭州', '武汉', '西安', '重庆')
  AND (a.cover_image IS NULL OR a.cover_image = '');
