import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { nationalSingleActivities as single, nationalMultiDayActivities as multi, beijingEveningActivities } from '../src/city-play-catalog.js';
import { departureFailure } from '../src/departure-policy.js';
import { playCategories, preferenceFailure, timelineRows } from '../src/itinerary-policy.js';
const base = { category: '不限', partySize: 2, budgetMin: 0, budgetMax: 200, budgetLabel: '划算出行', durationMinutes: null, environment: 'either', radiusKm: null, travelDurationLabel: '当天' };
test('北京晚间美食与双人约会可匹配，封面不借用其他地点', () => {
  const now = new Date('2026-09-06T13:00:00Z');
  for (const category of ['美食吃喝', '约会']) {
    const activity = beijingEveningActivities.find((a) => a.category === category)!;
    assert.equal(preferenceFailure({...base, category}, activity), null);
    assert.equal(departureFailure(activity, {departureMode:'now'}, now), null);
    const original = single.find((a) => a.cityId === 1 && a.address === activity.address)!;
    assert.equal(activity.coverImageUri, original.coverImageUri);
    assert.equal(activity.itinerary!.stops.reduce((sum, stop) => sum + stop.minutes + stop.transferMinutes, 0), activity.durationMinutes);
  }
  const shanghai = single.find((a) => a.id === 820213)!;
  assert.equal(shanghai.coverCredit?.kind, 'illustration');
  assert.notEqual(shanghai.coverImageUri, single.find((a) => a.id === 820200)!.coverImageUri);
});

test('18城各有14条单项，六分类各至少两个不同地点', () => {
  assert.equal(single.length, 252);
  assert.equal(new Set(single.map((a) => a.id)).size, single.length);
  for (let city = 1; city <= 18; city++) {
    assert.equal(single.filter((a) => a.cityId === city).length, 14);
    for (const category of playCategories) {
      const items = single.filter((a) => a.cityId === city && a.category === category);
      assert.ok(new Set(items.map((a) => a.placeKey)).size >= 2, city + category);
      assert.ok(items.some((a) => !preferenceFailure({ ...base, category }, a)), `默认预算无候选：${city}/${category}`);
    }
  }
});

test('18城都有晚上九点可立即出发的夜间候选', () => {
  const evening = new Date('2026-09-06T13:00:00Z');
  for (let city = 1; city <= 18; city++) {
    const nights = single.filter((a) => a.cityId === city && a.moodTags.includes('夜间'));
    assert.equal(nights.length, 1, `夜间候选数量：${city}`);
    assert.equal(departureFailure(nights[0]!, { departureMode: 'now' }, evening), null, `夜间不可立即出发：${city}`);
  }
});

test('人数与预算正确交叉筛选，不改写活动费用来凑结果', () => {
  for (let city = 1; city <= 18; city++) for (const category of playCategories) for (const partySize of [1, 2, 4]) for (const budgetMax of [200, 400, 1000]) {
    const pool = single.filter((a) => a.cityId === city && !preferenceFailure({ ...base, category, partySize, budgetMax }, a));
    if (category === '约会' && partySize !== 2) assert.equal(pool.length, 0);
    else assert.ok(pool.length >= 1, `交叉筛选空池：${city}/${category}/${partySize}/${budgetMax}`);
    pool.forEach((a) => { assert.ok(a.budgetYuan <= budgetMax); assert.equal(a.category, category); });
  }
});

test('预算档位不强制花够下限，但显式自定义下限仍生效', () => {
  const a = single.find((a) => a.budgetYuan < 100)!;
  assert.equal(preferenceFailure({ ...base, budgetMin: 200, budgetMax: 400, budgetLabel: '舒服躺玩' }, a), null);
  assert.equal(preferenceFailure({ ...base, budgetMin: 200, budgetMax: 400, budgetLabel: '' }, a), '预算不匹配');
});

test('双日按主题和不同地点组合，四日综合不冒充专项分类', () => {
  assert.equal(multi.filter((a) => a.itinerary?.daysCount === 2).length, 108);
  assert.equal(multi.filter((a) => a.itinerary?.daysCount === 4).length, 18);
  for (const a of multi) {
    assert.equal(new Set(a.placeKeys).size, a.itinerary!.daysCount);
    if (a.itinerary!.daysCount === 4) assert.equal(a.category, '不限');
    assert.ok(a.itinerary!.stops.every((s) => s.day && s.navigationUrl));
  }
});

test('所有分段总时长一致，多日重置时钟且不排到午夜以后', () => {
  for (const a of [...single, ...multi]) {
    const plan = a.itinerary!;
    assert.equal(plan.stops.reduce((sum, s) => sum + s.minutes + s.transferMinutes, 0), a.durationMinutes);
    const rows = timelineRows(plan);
    for (const row of rows) { assert.ok(row.minutes > 0); assert.ok(Number(row.endTime.split(':')[0]) < 24); }
    if (plan.daysCount) assert.equal(new Set(rows.map((r) => r.day)).size, plan.daysCount);
  }
});

test('每条单项封面存在，实景与主题示意有明确区分', () => {
  for (const a of single) {
    assert.ok(a.coverImageUri, a.title);
    assert.ok(existsSync(resolve('../client/public', '.' + a.coverImageUri)), a.coverImageUri!);
    if (a.coverImageUri!.endsWith('.svg')) assert.equal(a.coverCredit?.kind, 'illustration');
    if (a.coverCredit?.kind === 'photo') { assert.ok(a.coverCredit.author); assert.ok(a.coverCredit.license); assert.ok(a.coverCredit.source); }
  }
});
