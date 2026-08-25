import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDianpingScenicActivityDraft,
  dedupeDianpingScenicPois,
  normalizeDianpingScenicRecord,
  parseDianpingScenicExport,
  type DianpingScenicPoi,
} from "../src/dianping-scenic-import.js";

const shanghai = { id: 1, name: "上海", code: "shanghai", province: "上海" };

test("解析大众点评 CSV 导出并兼容中文表头", () => {
  const records = parseDianpingScenicExport(
    `城市,景点名称,区县,地址,分类,评分,评价数,人均,纬度,经度,封面,点评链接,标签\n上海,上海博物馆,黄浦区,人民大道201号,博物馆,4.8,"12,345条",0,31.228833,121.475190,https://example.com/museum.jpg,https://example.com/shop/1,"文艺、亲子"`,
    { fileName: "dianping-scenic.csv" },
  );

  assert.equal(records.length, 1);
  const poi = normalizeDianpingScenicRecord(records[0]!);

  assert.ok(poi);
  assert.equal(poi.cityName, "上海");
  assert.equal(poi.name, "上海博物馆");
  assert.equal(poi.districtName, "黄浦区");
  assert.equal(poi.rating, 4.8);
  assert.equal(poi.reviewCount, 12345);
  assert.equal(poi.avgPriceYuan, 0);
  assert.equal(poi.latitude, 31.228833);
  assert.equal(poi.longitude, 121.47519);
  assert.deepEqual(poi.tags, ["文艺", "亲子"]);
});

test("解析 JSON/JSONL 大众点评导出", () => {
  const jsonRecords = parseDianpingScenicExport(JSON.stringify({ items: [{ city: "上海", shopName: "共青森林公园" }] }), {
    fileName: "dianping-scenic.json",
  });
  const jsonlRecords = parseDianpingScenicExport('{"city":"上海","shopName":"豫园","score":"4.7"}\n', {
    fileName: "dianping-scenic.jsonl",
  });

  assert.equal(jsonRecords.length, 1);
  assert.equal(normalizeDianpingScenicRecord(jsonRecords[0]!)?.name, "共青森林公园");
  assert.equal(jsonlRecords.length, 1);
  assert.equal(normalizeDianpingScenicRecord(jsonlRecords[0]!)?.rating, 4.7);
});

test("大众点评景区数据会映射为可玩地活动草稿", () => {
  const draft = buildDianpingScenicActivityDraft(shanghai, {
    sourceId: "dp-1",
    name: "上海博物馆",
    cityName: "上海",
    districtName: "黄浦区",
    address: "人民大道201号",
    category: "景点/博物馆",
    rating: 4.8,
    reviewCount: 12345,
    avgPriceYuan: 0,
    latitude: 31.228833,
    longitude: 121.47519,
    coverImage: "https://example.com/museum.jpg",
    sourceUrl: "https://example.com/shop/1",
    tags: ["文艺", "亲子"],
  });

  assert.ok(draft);
  assert.equal(draft.title, "上海博物馆");
  assert.equal(draft.category, "探索");
  assert.equal(draft.mood, "探索");
  assert.equal(draft.environment, "indoor");
  assert.equal(draft.durationMinutes, 150);
  assert.equal(draft.budgetYuan, 0);
  assert.equal(draft.district, "黄浦区");
  assert.equal(draft.latitude, 31.228833);
  assert.equal(draft.longitude, 121.47519);
  assert.equal(draft.navigationUrl, "https://example.com/shop/1");
  assert.equal(draft.coverImage, "https://example.com/museum.jpg");
  assert.equal(draft.description.includes("评分 4.8"), true);
  assert.equal(draft.description.includes("12345 条评价"), true);
  assert.equal(draft.tips.some((tip) => tip.includes("合法导入的大众点评数据")), true);
});

test("缺少坐标时仍可导入，并回退到地图搜索链接", () => {
  const draft = buildDianpingScenicActivityDraft(shanghai, {
    sourceId: null,
    name: "无坐标景点",
    cityName: "上海",
    districtName: null,
    address: null,
    category: "公园",
    rating: null,
    reviewCount: null,
    avgPriceYuan: null,
    latitude: null,
    longitude: null,
    coverImage: null,
    sourceUrl: null,
    tags: [],
  });

  assert.ok(draft);
  assert.equal(draft.latitude, null);
  assert.equal(draft.longitude, null);
  assert.equal(draft.address, "上海 · 无坐标景点");
  assert.equal(draft.navigationUrl, "https://uri.amap.com/search?keyword=%E4%B8%8A%E6%B5%B7%20%E6%97%A0%E5%9D%90%E6%A0%87%E6%99%AF%E7%82%B9");
});

test("大众点评导入结果按来源 id 或名称坐标去重", () => {
  const pois: DianpingScenicPoi[] = [
    {
      sourceId: "dp-1",
      name: "上海博物馆",
      cityName: "上海",
      districtName: "黄浦区",
      address: "人民大道201号",
      category: "博物馆",
      rating: 4.8,
      reviewCount: 100,
      avgPriceYuan: 0,
      latitude: 31.228833,
      longitude: 121.47519,
      coverImage: null,
      sourceUrl: null,
      tags: [],
    },
    {
      sourceId: "dp-1",
      name: "上海博物馆",
      cityName: "上海",
      districtName: "黄浦区",
      address: "人民大道201号",
      category: "博物馆",
      rating: 4.8,
      reviewCount: 100,
      avgPriceYuan: 0,
      latitude: 31.228833,
      longitude: 121.47519,
      coverImage: null,
      sourceUrl: null,
      tags: [],
    },
    {
      sourceId: null,
      name: "无 id 景点",
      cityName: "上海",
      districtName: null,
      address: null,
      category: "公园",
      rating: null,
      reviewCount: null,
      avgPriceYuan: null,
      latitude: 31.1,
      longitude: 121.1,
      coverImage: null,
      sourceUrl: null,
      tags: [],
    },
    {
      sourceId: null,
      name: "无 id 景点",
      cityName: "上海",
      districtName: null,
      address: null,
      category: "公园",
      rating: null,
      reviewCount: null,
      avgPriceYuan: null,
      latitude: 31.1,
      longitude: 121.1,
      coverImage: null,
      sourceUrl: null,
      tags: [],
    },
  ];

  assert.equal(dedupeDianpingScenicPois(pois).length, 2);
});
