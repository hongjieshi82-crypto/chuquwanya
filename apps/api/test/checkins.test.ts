import assert from "node:assert/strict";
import test from "node:test";

import { buildWeekCheckinSummary } from "../src/checkins.js";

test("本周签到按当前星期计算成功、失败和未到", () => {
  const summary = buildWeekCheckinSummary(
    ["2026-07-01"],
    new Date("2026-07-01T10:00:00+08:00"),
  );

  assert.equal(summary.today, "2026-07-01");
  assert.equal(summary.weekStart, "2026-06-29");
  assert.equal(summary.signedDays, 1);
  assert.equal(summary.failedDays, 2);
  assert.equal(summary.rewardThreshold, 5);
  assert.equal(summary.remainingDaysForReward, 4);
  assert.equal(summary.rewardEarned, false);
  assert.equal(summary.rewardType, "next_week_points");
  assert.equal(summary.rewardPoints, 1);
  assert.equal(summary.rewardLabel, "下周获得 1 个积分");
  assert.deepEqual(
    summary.days.map((day) => [day.weekday, day.status, day.isToday]),
    [
      ["一", "failed", false],
      ["二", "failed", false],
      ["三", "signed", true],
      ["四", "idle", false],
      ["五", "idle", false],
      ["六", "idle", false],
      ["日", "idle", false],
    ],
  );
});
