import assert from 'node:assert/strict';
import test from 'node:test';
import { beijingPracticalActivities as plans, matchesPlayCategory, practicalReplacement, preferenceFailure, timelineRows, playCategories } from '../src/itinerary-policy.js';
const prefs = { category: '不限', partySize: 2, budgetMax: null, durationMinutes: null, environment: 'either', radiusKm: null, travelDurationLabel: '当天' };

test('环球整日计划含园内午餐与真实餐厅备选，没有跨区跳转', () => {
  const plan = plans.find((p) => p.id === 810001)!;
  assert.ok(plan.durationMinutes >= 8 * 60);
  assert.ok(plan.itinerary!.stops.every((s) => !/牛街|故宫/.test(s.title + s.description)));
  const meal = timelineRows(plan.itinerary!).find((s) => s.kind === 'meal')!;
  assert.ok(meal.meals!.length >= 2);
  assert.match(meal.time, /^12:/);
  assert.equal(plan.itinerary!.arrival, timelineRows(plan.itinerary!)[0]!.time);
  assert.ok(plan.itinerary!.preparation.some((s) => s.includes('充电线')));
  assert.ok(plan.itinerary!.preparation.some((s) => s.includes('身份证件')));
});

test('所有北京计划时间连续、留有转场且总时长一致', () => {
  for (const p of plans) {
    const rows = timelineRows(p.itinerary!);
    const minutes = (s: string) => Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]);
    assert.equal(minutes(rows.at(-1)!.endTime) - minutes(p.itinerary!.arrival), p.durationMinutes);
    assert.ok(minutes(rows.at(-1)!.endTime) < 24 * 60);
    rows.slice(1).forEach((r, i) => assert.equal(minutes(r.time) - minutes(rows[i]!.endTime), r.transferMinutes));
    assert.ok(p.itinerary!.preparation.every((s) => !/心情|喜欢的饮料/.test(s)));
  }
});

test('北京六类玩法均有明确候选，故宫与北海不进入美食和娱乐池', () => {
  for (const c of playCategories) assert.ok(plans.some((p) => matchesPlayCategory(c, p)), c);
  for (const c of ['娱乐玩乐', '美食吃喝']) {
    assert.ok(plans.filter((p) => matchesPlayCategory(c, p)).every((p) => !/故宫|北海/.test(p.title)));
  }
  assert.equal(matchesPlayCategory('浪漫约会', plans.find((p) => p.id === 810003)!), true);
});

test('分类、预算、人数和天数是约束，不能重写活动凑出结果', () => {
  const universal = plans[0]!;
  assert.equal(preferenceFailure(prefs, universal), null);
  assert.equal(preferenceFailure({ ...prefs, budgetMax: 200 }, universal), '预算不匹配');
  assert.equal(preferenceFailure({ ...prefs, travelDurationLabel: '小长假' }, universal), '出游天数不匹配');
  assert.equal(preferenceFailure({ ...prefs, category: '美食吃喝' }, universal), '玩法分类不匹配');
  assert.equal(preferenceFailure({ ...prefs, partySize: 1 }, plans.find((p) => p.id === 810003)!), '人数不匹配');
  assert.equal(preferenceFailure(prefs, { ...universal, sourceType: 'itinerary_workbook' }), '原批量路线尚未完成内容核验');
});

test('旧环球路线修复按主地点，不因附带牛街而变成美食行程', () => {
  const result = practicalReplacement({ id: 600006, cityName: '北京', address: '环球度假区', title: '环球度假区·一日欢乐组局06' });
  assert.equal(result?.id, 810001);
  assert.equal(result?.category, '娱乐玩乐');
  assert.equal(practicalReplacement({ id: 600006, cityName: '上海', address: '环球度假区', title: '环球度假区·一日欢乐组局06' }), null);
});
