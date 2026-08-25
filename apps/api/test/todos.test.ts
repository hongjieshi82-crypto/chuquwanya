import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWeekWindow,
  getWeekStartDateKey,
  isDateKeyInSameWeek,
  isDateKeyTodayOrLater,
  toChinaDateKey,
} from "../src/todos.js";

test("本周约定按周一作为自然周开始", () => {
  assert.equal(getWeekStartDateKey("2026-07-02"), "2026-06-29");
  assert.deepEqual(buildWeekWindow("2026-07-02"), {
    today: "2026-07-02",
    weekStartDate: "2026-06-29",
    weekEndDate: "2026-07-05",
  });
});

test("周日仍归属同一个自然周", () => {
  assert.equal(getWeekStartDateKey("2026-07-05"), "2026-06-29");
});

test("下周日期不属于当前本周约定窗口", () => {
  assert.equal(isDateKeyInSameWeek("2026-07-05", "2026-07-03"), true);
  assert.equal(isDateKeyInSameWeek("2026-07-06", "2026-07-03"), false);
});

test("不能选择今天以前的本周日期", () => {
  assert.equal(isDateKeyTodayOrLater("2026-07-02", "2026-07-03"), false);
  assert.equal(isDateKeyTodayOrLater("2026-07-03", "2026-07-03"), true);
  assert.equal(isDateKeyTodayOrLater("2026-07-05", "2026-07-03"), true);
});

test("北京时间日期键使用 Asia/Shanghai 日期", () => {
  assert.equal(toChinaDateKey(new Date("2026-07-01T16:30:00.000Z")), "2026-07-02");
});
