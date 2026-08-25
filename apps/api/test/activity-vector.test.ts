import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActivityVectorMetadata,
  buildActivityVectorText,
  buildDrawPreferenceVectorText,
  getActivityVectorId,
} from "../src/activityVector.service.js";
import { buildCandidatePoolQuery } from "../src/app.js";
import type { ActivityRow } from "../src/types.js";

function activity(overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    id: 101,
    city_id: 1,
    city_name: "上海",
    title: "河边旧书咖啡店",
    summary: "翻旧书、看窗外、低电量也能完成。",
    description: "来自《出行盲盒地点库 (1).xlsx》的地点：上海 · 河边旧书咖啡店。",
    category: "文艺",
    mood: "放松",
    mood_tags: JSON.stringify(["放松", "安静"]),
    environment: "indoor",
    min_party_size: 1,
    max_party_size: 2,
    duration_minutes: 150,
    budget_yuan: 80,
    city_distance_km: "2.4",
    district: "姑苏区",
    address: "河边路 1 号",
    latitude: null,
    longitude: null,
    navigation_url: null,
    cover_image: null,
    steps: JSON.stringify(["找一家靠窗的位置", "翻一本旧书"]),
    tips: JSON.stringify(["适合工作日下午"]),
    accent_color: "#7357FF",
    ...overrides,
  };
}

test("活动向量文本包含稳定的活动语义字段", () => {
  const text = buildActivityVectorText(activity());

  assert.equal(text.includes("城市：上海"), true);
  assert.equal(text.includes("标题：河边旧书咖啡店"), true);
  assert.equal(text.includes("心情标签：放松、安静"), true);
  assert.equal(text.includes("步骤：找一家靠窗的位置、翻一本旧书"), true);
});

test("活动向量 metadata 不写入空数组并保留必要筛选字段", () => {
  const metadata = buildActivityVectorMetadata(activity({ mood_tags: JSON.stringify([]), steps: JSON.stringify([]), tips: JSON.stringify([]) }));

  assert.equal(metadata.activity_id, 101);
  assert.equal(metadata.city_id, 1);
  assert.equal(metadata.source, "blind_box_import");
  assert.equal(metadata.is_active, true);
  assert.equal(Object.values(metadata).some((value) => Array.isArray(value) && value.length === 0), false);
});

test("抽卡偏好向量文本包含用户偏好但跳过不限条件", () => {
  const text = buildDrawPreferenceVectorText({
    cityId: 1,
    preferences: {
      partySize: 1,
      durationMinutes: null,
      budgetMax: 100,
      mood: "放松",
      randomLevel: 68,
      category: "不限",
      environment: "either",
      radiusKm: null,
      originName: "苏州河边",
    },
  });

  assert.equal(text.includes("预算上限：100元"), true);
  assert.equal(text.includes("想要的心情：放松"), true);
  assert.equal(text.includes("活动分类：不限"), false);
  assert.equal(text.includes("出发地：苏州河边"), true);
});

test("PC 抽卡偏好向量文本使用 PC 条件标签", () => {
  const text = buildDrawPreferenceVectorText({
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
      originName: "上海",
      clientSource: "pc",
      destinationScope: "nationwide",
      destinationScopeLabel: "全国",
      travelDuration: "3-5days",
      travelDurationLabel: "3-5天",
      budgetLabel: "轻奢",
      surpriseLevelLabel: "中度",
    },
  });

  assert.equal(text.includes("客户端：PC旅行盲盒"), true);
  assert.equal(text.includes("目的地范围：全国"), true);
  assert.equal(text.includes("旅游时间：3-5天（旅行天数偏好，不是分钟级硬约束）"), true);
  assert.equal(text.includes("预算档位：轻奢（不设硬上限）"), true);
  assert.equal(text.includes("惊喜程度：中度（randomLevel=60）"), true);
});

test("Chroma 候选 id 回表查询仍排除当前抽卡会话已出结果", () => {
  const result = buildCandidatePoolQuery(
    {
      userId: 185,
      cityId: 1,
      preferences: {
        partySize: 1,
        durationMinutes: null,
        budgetMax: null,
        mood: "放松",
        randomLevel: 68,
        category: "不限",
        environment: "either",
        radiusKm: null,
      },
    },
    "00000000-0000-4000-8000-000000000000",
    3,
    { activityIds: [30, 10, 30, 20] },
  );

  assert.equal(result.sql.includes("dr.draw_session_id = ? AND dr.activity_id = a.id"), true);
  assert.equal(result.sql.includes("a.id IN (?, ?, ?)"), true);
  assert.equal(result.sql.includes("ORDER BY FIELD(a.id, ?, ?, ?)"), true);
  assert.equal(result.sql.includes("FROM todos t"), true);
  assert.equal(result.sql.includes("t.status <> 'cancelled'"), true);
  assert.deepEqual(result.values.slice(0, 3), [
    1,
    "00000000-0000-4000-8000-000000000000",
    185,
  ]);
  assert.match(String(result.values[3]), /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(result.values.slice(4), [
    30,
    10,
    20,
    30,
    10,
    20,
  ]);
});

test("活动向量 id 使用 activity 前缀", () => {
  assert.equal(getActivityVectorId(42), "activity:42");
});
