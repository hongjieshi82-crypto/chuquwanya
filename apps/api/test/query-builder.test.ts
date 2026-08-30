import assert from "node:assert/strict";
import test from "node:test";

import { buildActivityQuery, buildCandidatePoolQuery, findCityIdFromOriginName, parseDrawInput, resolveCityFromOriginName } from "../src/app.js";

test("不限条件不会生成额外筛选", () => {
  const result = buildActivityQuery(
    {
      userId: 1,
      cityId: 1,
      preferences: {
        partySize: 2,
        durationMinutes: 180,
        budgetMax: null,
        mood: "随便",
        randomLevel: 68,
        category: "不限",
        environment: "either",
        radiusKm: null,
      },
    },
    "00000000-0000-4000-8000-000000000000",
  );

  assert.equal(result.sql.includes("JSON_CONTAINS(a.mood_tags, JSON_QUOTE(?))"), false);
  assert.equal(result.sql.includes("a.category = ?"), false);
  assert.equal(result.sql.includes("a.city_distance_km <= ?"), false);
  assert.equal(result.sql.includes("a.content_status = 'published'"), true);
  assert.equal(result.sql.includes("a.content_score >= 70"), true);
});

test("明确偏好会生成对应筛选", () => {
  const result = buildActivityQuery(
    {
      userId: 1,
      cityId: 1,
      preferences: {
        partySize: 2,
        durationMinutes: 180,
        budgetMax: 100,
        mood: "治愈",
        randomLevel: 68,
        category: "探索",
        environment: "outdoor",
        radiusKm: 10,
      },
    },
    "00000000-0000-4000-8000-000000000000",
  );

  assert.equal(result.sql.includes("(a.budget_yuan * ?) <= ?"), true);
  assert.equal(result.sql.includes("JSON_CONTAINS(a.mood_tags, JSON_QUOTE(?))"), true);
  assert.equal(result.sql.includes("a.category = ?"), true);
  assert.equal(result.sql.includes("a.city_distance_km <= ?"), true);
});

test("抽取偏好会接收出发地字段", () => {
  const result = parseDrawInput({
    userId: 1,
    cityId: 1,
    preferences: {
      partySize: 2,
      durationMinutes: 180,
      budgetMax: 100,
      mood: "治愈",
      randomLevel: 42,
      category: "探索",
      environment: "outdoor",
      radiusKm: 10,
      originName: " 静安寺地铁站 ",
      originLatitude: 31.223,
      originLongitude: 121.445,
      originAccuracyMeters: 32,
      originSource: "device",
    },
  });

  assert.equal(result.preferences.originName, "静安寺地铁站");
  assert.equal(result.preferences.randomLevel, 42);
  assert.equal(result.preferences.originLatitude, 31.223);
  assert.equal(result.preferences.originLongitude, 121.445);
  assert.equal(result.preferences.originAccuracyMeters, 32);
  assert.equal(result.preferences.originSource, "device");
});

test("抽取偏好未传随机程度时默认 68", () => {
  const result = parseDrawInput({
    userId: 1,
    cityId: 1,
    preferences: {
      partySize: 2,
      durationMinutes: 180,
      budgetMax: 100,
      mood: "治愈",
      category: "探索",
      environment: "outdoor",
      radiusKm: 10,
    },
  });

  assert.equal(result.preferences.randomLevel, 68);
});

test("PC 抽取偏好会接收来源和中文条件标签", () => {
  const result = parseDrawInput({
    userId: 1,
    cityId: 1,
    preferences: {
      partySize: 2,
      durationMinutes: null,
      budgetMax: null,
      mood: "放松",
      randomLevel: 60,
      category: "不限",
      environment: "either",
      radiusKm: null,
      clientSource: "pc",
      destinationScope: "nationwide",
      destinationScopeLabel: "全国",
      travelDuration: "3-5days",
      travelDurationLabel: "3-5天",
      budgetLabel: "轻奢",
      surpriseLevelLabel: "中度",
    },
  });

  assert.equal(result.preferences.clientSource, "pc");
  assert.equal(result.preferences.destinationScope, "nationwide");
  assert.equal(result.preferences.destinationScopeLabel, "全国");
  assert.equal(result.preferences.travelDuration, "3-5days");
  assert.equal(result.preferences.travelDurationLabel, "3-5天");
  assert.equal(result.preferences.budgetLabel, "轻奢");
  assert.equal(result.preferences.surpriseLevelLabel, "中度");
  assert.equal(result.preferences.budgetMax, null);
});


test("出发地包含城市名时优先使用出发地城市", () => {
  const cityId = findCityIdFromOriginName(
    "北京市朝阳区高碑店乡文化新大街2号印象里文创园",
    [
      { id: 1, name: "上海", code: "shanghai", province: "上海" },
      { id: 13, name: "北京", code: "beijing", province: "北京" },
    ],
    1,
  );

  assert.equal(cityId, 13);
});

test("有真实出发地坐标时按坐标计算半径", () => {
  const result = buildActivityQuery(
    {
      userId: 1,
      cityId: 1,
      preferences: {
        partySize: 2,
        durationMinutes: 180,
        budgetMax: null,
        mood: "随便",
        randomLevel: 68,
        category: "不限",
        environment: "either",
        radiusKm: 3,
        originName: "静安寺地铁站",
        originLatitude: 31.223,
        originLongitude: 121.445,
        originAccuracyMeters: 32,
        originSource: "device",
      },
    },
    "00000000-0000-4000-8000-000000000000",
  );

  assert.equal(result.sql.includes("a.city_distance_km <= ?"), false);
  assert.equal(result.sql.includes("a.latitude IS NOT NULL AND a.longitude IS NOT NULL"), true);
  assert.equal(result.sql.includes("COS(RADIANS(?))"), true);
  assert.deepEqual(result.values.slice(0, 3), [31.223, 121.445, 31.223]);
});

test("出发城市与目的地不一致时仍锁定用户明确选择的目的地", () => {
  const cities = [
    { id: 1, name: "上海", code: "sh", province: "上海" },
    { id: 13, name: "北京", code: "bj", province: "北京" },
  ];

  const result = resolveCityFromOriginName(
    {
      userId: 1,
      cityId: 1,
      preferences: {
        partySize: 1,
        durationMinutes: 180,
        budgetMax: null,
        mood: "随便",
        randomLevel: 68,
        category: "不限",
        environment: "either",
        radiusKm: null,
        originName: "北京市朝阳区文化新大街2号印象里文创园",
      },
    },
    cities,
  );

  assert.equal(result.cityId, 1);
  assert.equal(result.cityMismatchHint, undefined);
});

test("出发地与当前城市一致时不会返回冲突提示", () => {
  const cities = [
    { id: 1, name: "上海", code: "sh", province: "上海" },
    { id: 13, name: "北京", code: "bj", province: "北京" },
  ];

  const result = resolveCityFromOriginName(
    {
      userId: 1,
      cityId: 1,
      preferences: {
        partySize: 1,
        durationMinutes: 180,
        budgetMax: null,
        mood: "随便",
        randomLevel: 68,
        category: "不限",
        environment: "either",
        radiusKm: null,
        originName: "上海浦东新区川沙",
      },
    },
    cities,
  );

  assert.equal(result.cityId, 1);
  assert.equal(result.cityMismatchHint, undefined);
});

test("全国范围和惊喜程度都不能擅自更换目的地", () => {
  const cities = [
    { id: 1, name: "上海", code: "sh", province: "上海" },
    { id: 13, name: "北京", code: "bj", province: "北京" },
  ];

  const result = resolveCityFromOriginName(
    {
      userId: 1,
      cityId: 1,
      preferences: {
        partySize: 1,
        durationMinutes: null,
        budgetMax: 100,
        mood: "放松",
        randomLevel: 60,
        category: "不限",
        environment: "either",
        radiusKm: null,
        originName: "上海",
        destinationScope: "nationwide",
      },
    },
    cities,
  );

  assert.equal(result.cityId, 1);
  assert.equal(result.cityMismatchHint, undefined);
});

test("轻度惊喜会锁定出发城市", () => {
  const cities = [
    { id: 1, name: "上海", code: "sh", province: "上海" },
    { id: 13, name: "北京", code: "bj", province: "北京" },
  ];

  const result = resolveCityFromOriginName(
    {
      userId: 1,
      cityId: 1,
      preferences: {
        partySize: 1,
        durationMinutes: null,
        budgetMax: 100,
        mood: "放松",
        randomLevel: 25,
        category: "不限",
        environment: "either",
        radiusKm: null,
        originName: "上海",
        destinationScope: "nationwide",
      },
    },
    cities,
  );

  assert.equal(result.cityId, 1);
  assert.equal(result.cityMismatchHint, undefined);
});

test("候选池查询会排除当前用户本周已有的非取消行程", () => {
  const result = buildCandidatePoolQuery(
    {
      userId: 185,
      cityId: 1,
      preferences: {
        partySize: 1,
        durationMinutes: null,
        budgetMax: null,
        mood: "随便",
        randomLevel: 68,
        category: "不限",
        environment: "either",
        radiusKm: null,
      },
    },
    "00000000-0000-4000-8000-000000000000",
  );

  assert.equal(result.sql.includes("FROM todos t"), true);
  assert.equal(result.sql.includes("t.user_id = ?"), true);
  assert.equal(result.sql.includes("t.week_start_date = ?"), true);
  assert.equal(result.sql.includes("t.status <> 'cancelled'"), true);
  assert.equal(result.values[2], 185);
  assert.match(String(result.values[3]), /^\d{4}-\d{2}-\d{2}$/);
});
