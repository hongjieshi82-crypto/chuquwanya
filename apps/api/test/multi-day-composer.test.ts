import assert from "node:assert/strict";
import test from "node:test";

import { composeTripFromActivities, type MultiDayActivity } from "../src/travel/modules/multiDayComposer.service.js";

const activities: MultiDayActivity[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: `玩法${index + 1}`,
  summary: `第${index + 1}条真实玩法`,
  district: index % 2 === 0 ? "东城区" : "西城区",
  address: `测试地址${index + 1}`,
  durationMinutes: 120,
  budgetYuan: 50,
  coverImageUri: null,
  tips: ["出发前确认"],
}));

test("多日行程每天使用两个不重复核心活动", () => {
  const trip = composeTripFromActivities({ cityId: 1, cityName: "北京", days: 3, travelers: 2, budget: null, mood: "放松", activities });
  assert.equal(trip.days.length, 3);
  assert.equal(new Set(trip.days.flatMap((day) => day.items.filter((item) => item.type === "activity").map((item) => item.activityId))).size, 6);
  assert.equal(trip.destination, "北京");
});

test("内容数量不足时拒绝伪造多日行程", () => {
  assert.throws(
    () => composeTripFromActivities({ cityId: 1, cityName: "北京", days: 5, travelers: 1, budget: null, mood: "探索", activities: activities.slice(0, 2) }),
    /不足以生成每天两个地点的 5 天详细行程/,
  );
});

test("预算不足时不会生成表面完整但实际超支的行程", () => {
  assert.throws(
    () => composeTripFromActivities({ cityId: 1, cityName: "北京", days: 3, travelers: 2, budget: 100, mood: "放松", activities }),
    /最低可执行估算/,
  );
});
