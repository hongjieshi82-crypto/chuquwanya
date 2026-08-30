import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDistanceConstraintText,
  buildRuntimeData,
  getHardFailure,
  type CandidateCard,
} from "../src/draw-recommendation.js";

const basePreferences = {
  partySize: 1,
  durationMinutes: 180,
  budgetMax: null,
  mood: "热闹",
  randomLevel: 83,
  category: "不限",
  environment: "either" as const,
  radiusKm: 10,
  originName: "上海市",
  originLatitude: null,
  originLongitude: null,
  originAccuracyMeters: null,
  originSource: "manual" as const,
};

const baseCandidate: CandidateCard = {
  card_id: 25,
  poi_id: 25,
  title: "安福路",
  summary: "上海安福路",
  description: "上海 · 安福路",
  category: "美食",
  mood: "放松",
  mood_tags: ["放松", "探索", "热闹"],
  environment: "either",
  min_party_size: 1,
  max_party_size: 6,
  duration_minutes: 90,
  card_price: 100,
  distance_km: 0,
  distance_source: "missing",
  district: "上海",
  address: "上海 · 安福路",
  latitude: null,
  longitude: null,
  steps: [],
  tips: [],
};

test("缺少坐标的候选不会把 0km 当真实距离展示", async () => {
  const text = await buildDistanceConstraintText(basePreferences, baseCandidate, { useAiDistance: false });

  assert.equal(text.includes("0.0 km"), false);
  assert.equal(text.includes("不能按 0 km 展示"), true);
  assert.equal(text.includes("地图确认"), true);
});

test("已有距离的候选仍展示数值距离", async () => {
  const text = await buildDistanceConstraintText(basePreferences, {
    ...baseCandidate,
    distance_km: 4.2,
    distance_source: "stored",
  });

  assert.equal(text, "距离 4.2 km，范围 10 km。");
});

test("半径筛选下缺少目的地坐标不能通过硬约束", () => {
  const runtime = buildRuntimeData([baseCandidate]);

  assert.equal(getHardFailure(basePreferences, baseCandidate, runtime), "距离无法确认");
});

test("PC 端旅游时间偏好不按分钟级时长做硬失败", () => {
  const preferences = {
    ...basePreferences,
    durationMinutes: null,
    budgetMax: null,
    radiusKm: null,
    clientSource: "pc" as const,
    travelDuration: "1-3days" as const,
    travelDurationLabel: "1-3天",
  };
  const candidate: CandidateCard = {
    ...baseCandidate,
    distance_source: "stored",
    distance_km: 2.8,
    duration_minutes: 10 * 60,
    latitude: 31.22,
    longitude: 121.45,
  };
  const runtime = buildRuntimeData([candidate]);

  assert.equal(getHardFailure(preferences, candidate, runtime), null);
});

test("雨天会排除未确认雨天友好的户外活动", () => {
  const candidate: CandidateCard = {
    ...baseCandidate,
    distance_source: "stored",
    distance_km: 2,
    rain_friendly: "no",
  };
  const runtime = buildRuntimeData([candidate], {
    city: "上海",
    condition: "中雨",
    temperature: 24,
    windLevel: 3,
    humidity: 90,
    risks: ["rain"],
    observedAt: "2026-08-30 10:00:00",
    source: "amap",
  });

  assert.equal(getHardFailure({ ...basePreferences, radiusKm: null }, candidate, runtime), "雨天不适合");
});

test("雨天仍允许已确认雨天友好的室内活动", () => {
  const candidate: CandidateCard = {
    ...baseCandidate,
    environment: "indoor",
    distance_source: "stored",
    distance_km: 2,
    rain_friendly: "yes",
  };
  const runtime = buildRuntimeData([candidate], {
    city: "上海",
    condition: "小雨",
    temperature: 24,
    windLevel: 2,
    humidity: 88,
    risks: ["rain"],
    observedAt: "2026-08-30 10:00:00",
    source: "amap",
  });

  assert.equal(getHardFailure({ ...basePreferences, radiusKm: null }, candidate, runtime), null);
});
