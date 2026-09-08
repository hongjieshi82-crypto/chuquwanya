import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, calendarText, chinaDate, departureAdvisory, departureFailure, nextWeekend, validDepartureDate, withDeparture } from '../src/departure-policy.js';
import { beijingPracticalActivities } from '../src/itinerary-policy.js';
import { timelineRows } from '../src/itinerary-policy.js';
import { practicalActivities } from '../src/itinerary-policy.js';
import { nationalSingleActivities } from '../src/city-play-catalog.js';
const afternoon = new Date('2026-09-06T06:00:00Z'); // 14:00, China
const morning = new Date('2026-09-06T01:00:00Z');
test('已核验的跨午夜窗口允许凌晨夜宵，现在出发的时间风险只提醒不拦截', () => {
  const food = practicalActivities.find(a => a.id === 860101)!;
  assert.equal(departureFailure(food, {departureMode:'now'}, new Date('2026-09-06T16:10:00Z')), null);
  assert.equal(departureFailure(food, {departureMode:'now'}, new Date('2026-09-06T19:00:00Z')), null);
  assert.ok(departureAdvisory(food, {departureMode:'now'}, new Date('2026-09-06T19:00:00Z')));
  const park = practicalActivities.find(a => a.id === 810002)!;
  assert.equal(departureFailure(park, {departureMode:'now'}, new Date('2026-09-06T12:00:00Z')), null);
  assert.ok(departureAdvisory(park, {departureMode:'now'}, new Date('2026-09-06T12:00:00Z')));
  assert.ok(departureFailure({...park,itinerary:{...park.itinerary!,arrival:'20:30'}}, {departureMode:'plan',departureDate:'2026-09-12'}, morning));
});
const evening = new Date('2026-09-06T13:00:00Z'); // 21:00, China
test('跨午夜显示次日时间，不产生24点格式；标题关键词不能开放夜间权限', () => {
  const night = nationalSingleActivities.find((a) => a.id === 820113)!;
  const now = new Date('2026-09-06T14:30:00Z');
  assert.equal(departureFailure(night, {departureMode: 'now'}, now), null);
  assert.equal(timelineRows(withDeparture(night, {departureMode: 'now'}, now).itinerary!).at(-1)?.endTime, '次日 00:30');
  assert.equal(departureFailure({...night, moodTags: []}, {departureMode: 'now'}, now), null);
  assert.match(departureAdvisory(night, {departureMode: 'now'}, new Date('2026-09-06T16:10:00Z'))!, /凌晨/);
});
test('日期按北京时间处理并验证真实日期、过去日期和一年上限', () => {
  assert.equal(chinaDate(new Date('2026-09-06T18:00:00Z')), '2026-09-07');
  assert.equal(validDepartureDate('2026-02-30', morning), false);
  assert.equal(validDepartureDate('2026-09-05', morning), false);
  assert.equal(validDepartureDate('2027-09-07', morning), false);
  assert.equal(validDepartureDate('2026-09-12', morning), true);
  assert.equal(nextWeekend(morning), '2026-09-12');
  assert.equal(addDays('2026-09-12', 1), '2026-09-13');
});
test('下午现在出发可继续，但会提醒完整一天或午餐路线的时间风险', () => {
  const universal = beijingPracticalActivities.find((a) => a.id === 810001)!;
  const food = beijingPracticalActivities.find((a) => a.id === 810004)!;
  assert.equal(departureFailure(universal, { departureMode: 'now' }, afternoon), null);
  assert.match(departureAdvisory(universal, { departureMode: 'now' }, afternoon)!, /剩余时间/);
  assert.equal(departureFailure(food, { departureMode: 'now' }, afternoon), null);
  assert.ok(departureAdvisory(food, { departureMode: 'now' }, afternoon));
});
test('早上现在出发可选环球，票务风险交给用户确认', () => {
  const universal = beijingPracticalActivities.find((a) => a.id === 810001)!;
  assert.equal(departureFailure(universal, { departureMode: 'now' }, morning), null);
  assert.match(departureAdvisory(universal, { departureMode: 'now' })!, /系统不知道你是否已有票/);
});
test('灵感不要求日期，计划需要日期，未来日期不受现在时间限制', () => {
  const a = beijingPracticalActivities[0]!;
  assert.equal(departureFailure(a, { departureMode: 'idea' }, afternoon), null);
  assert.ok(departureFailure(a, { departureMode: 'plan' }, afternoon));
  assert.equal(departureFailure(a, { departureMode: 'plan', departureDate: '2026-09-12' }, afternoon), null);
});
test('现在出发平移参考时间；多日不能作为现在出发', () => {
  const a = beijingPracticalActivities.find((a) => a.id === 810003)!;
  assert.equal(departureFailure(a, { departureMode: 'now' }, afternoon), null);
  const planned = withDeparture(a, { departureMode: 'now' }, afternoon);
  assert.equal(planned.plannedDate, '2026-09-06');
  assert.equal(planned.itinerary?.arrival, '15:00');
  assert.ok(departureFailure({ ...a, itinerary: { ...a.itinerary!, daysCount: 2 } }, { departureMode: 'now' }, morning));
});
test('晚上保留夜间短线，不再用 20:30 统一截止', () => {
  const night = nationalSingleActivities.find((a) => a.cityId === 1 && a.moodTags.includes('夜间'))!;
  const daytime = beijingPracticalActivities.find((a) => a.id === 810003)!;
  assert.equal(departureFailure(night, { departureMode: 'now' }, evening), null);
  assert.equal(departureFailure(daytime, { departureMode: 'now' }, evening), null);
  assert.match(departureAdvisory(daytime, { departureMode: 'now' }, evening)!, /剩余时间/);
  const planned = withDeparture(night, { departureMode: 'now' }, evening);
  assert.equal(planned.itinerary?.arrival, '21:30');
  assert.match(planned.itinerary?.arrivalNote ?? '', /30分钟/);
});
test('过深夜仍允许现在出发，但明确提醒', () => {
  const night = nationalSingleActivities.find((a) => a.cityId === 1 && a.moodTags.includes('夜间'))!;
  const tooLate = new Date('2026-09-06T15:00:00Z'); // 23:00, China
  assert.equal(departureFailure(night, { departureMode: 'now' }, tooLate), null);
  assert.match(departureAdvisory(night, { departureMode: 'now' }, tooLate)!, /结束太晚/);
});
test('日历事件结束日期排他并转义文案', () => {
  const text = calendarText({ id: 1, title: '周末,出发;记录', date: '2026-09-12', days: 2, address: '北京\n街区' });
  assert.ok(text.includes('DTSTART;VALUE=DATE:20260912'));
  assert.ok(text.includes('DTEND;VALUE=DATE:20260914'));
  assert.ok(text.includes('SUMMARY:周末\\,出发\\;记录'));
  assert.ok(text.includes('LOCATION:北京\\n街区'));
});
