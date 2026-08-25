import assert from "node:assert/strict";
import test from "node:test";

import {
  buildScenicActivityDraft,
  dedupeAmapPois,
  DEFAULT_AMAP_SCENIC_TYPES,
  parseAmapPoiLocation,
  type AmapPoi,
} from "../src/scenic-activity-import.js";

const shanghai = { id: 1, name: "上海", code: "shanghai", province: "上海" };

test("高德 POI 坐标按 lng,lat 解析", () => {
  assert.deepEqual(parseAmapPoiLocation("121.475190,31.228833"), {
    longitude: 121.47519,
    latitude: 31.228833,
  });
  assert.equal(parseAmapPoiLocation("31.228833"), null);
  assert.equal(parseAmapPoiLocation("bad,31.228833"), null);
});

test("景区 POI 会映射为可玩地活动草稿", () => {
  const draft = buildScenicActivityDraft(shanghai, {
    id: "B00155A1BC",
    name: "上海博物馆",
    type: "科教文化服务;博物馆",
    typecode: "140100",
    cityname: "上海市",
    adname: "黄浦区",
    address: "人民大道201号",
    location: "121.475190,31.228833",
    biz_ext: { cost: "0" },
    photos: [{ url: "https://example.com/museum.jpg" }],
  });

  assert.ok(draft);
  assert.equal(draft.title, "上海博物馆");
  assert.equal(draft.category, "探索");
  assert.equal(draft.mood, "探索");
  assert.deepEqual(draft.moodTags, ["探索", "放松", "文艺"]);
  assert.equal(draft.environment, "indoor");
  assert.equal(draft.durationMinutes, 150);
  assert.equal(draft.budgetYuan, 0);
  assert.equal(draft.district, "黄浦区");
  assert.equal(draft.latitude, 31.228833);
  assert.equal(draft.longitude, 121.47519);
  assert.equal(draft.coverImage, "https://example.com/museum.jpg");
  assert.equal(draft.navigationUrl, "https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E4%B8%8A%E6%B5%B7%E5%8D%9A%E7%89%A9%E9%A6%86");
});

test("没有类型时使用默认风景名胜标签，并按户外景区生成玩法提示", () => {
  const draft = buildScenicActivityDraft(shanghai, {
    name: "滨江森林公园",
    cityname: "上海市",
    adname: "浦东新区",
    address: "高桥镇凌桥高沙滩3号",
    location: "121.585000,31.382000",
    photos: [],
  });

  assert.ok(draft);
  assert.equal(draft.environment, "outdoor");
  assert.equal(draft.budgetYuan, 30);
  assert.equal(draft.durationMinutes, 180);
  assert.equal(draft.tips.some((tip) => tip.includes(DEFAULT_AMAP_SCENIC_TYPES)), true);
});

test("拉取结果按高德 id 或名称坐标去重", () => {
  const pois: AmapPoi[] = [
    { id: "poi-1", name: "共青森林公园", location: "121.550000,31.320000" },
    { id: "poi-1", name: "共青森林公园", location: "121.550000,31.320000" },
    { name: "无 id 景点", location: "121.100000,31.100000" },
    { name: "无 id 景点", location: "121.100000,31.100000" },
    { name: "缺坐标景点" },
  ];

  assert.equal(dedupeAmapPois(pois).length, 2);
});
