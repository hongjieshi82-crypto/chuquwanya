import assert from "node:assert/strict";
import test from "node:test";

import { assessContentQuality } from "../src/content-quality.js";

const complete = {
  city_id: 1,
  title: "城市美术馆",
  summary: "雨天也能出发",
  description: "一条经过核验的室内玩法",
  address: "某区某路1号",
  latitude: 31.2,
  longitude: 121.4,
  duration_minutes: 120,
  budget_yuan: 50,
  environment: "indoor",
  rain_friendly: "yes",
  heat_sensitive: "no",
  wind_sensitive: "no",
  navigation_url: "https://uri.amap.com/search?keyword=test",
  cover_image: "/assets/test.jpg",
  steps: ["到达", "参观"],
  tips: ["提前确认"],
  opening_hours: { monday: [["09:00", "17:00"]] },
  reservation_required: "no" as const,
  source_type: "manual",
  last_verified_at: "2026-08-30",
};

test("完整内容达到推荐准入标准", () => {
  const result = assessContentQuality(complete);
  assert.equal(result.score, 100);
  assert.equal(result.recommendable, true);
  assert.deepEqual(result.issues, []);
});

test("缺少坐标和天气核验的内容不能发布", () => {
  const result = assessContentQuality({ ...complete, latitude: null, rain_friendly: "unknown" });
  assert.equal(result.recommendable, false);
  assert.equal(result.issues.includes("地址或坐标缺失"), true);
  assert.equal(result.issues.includes("天气适用性未核验"), true);
});
