import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as policy from '../src/itinerary-policy.js';
import * as departure from '../src/departure-policy.js';

// Exercise the actual preview catalog and draw code; only native asset resolution
// and browser storage are substituted so this can run without React Native.
function load(storage = new Map<string, string>()) {
  const source = readFileSync('../client/src/services/demo-data.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} as any };
  const browser = { location: { hostname: 'localhost', pathname: '/' }, localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } };
  new Function('require', 'module', 'exports', 'window', code)((name: string) => {
    if (name === 'react-native') return { Image: { resolveAssetSource: () => ({ uri: '/test-asset.jpg' }) } };
    if (name.includes('itinerary-policy')) return policy;
    if (name.includes('departure-policy')) return departure;
    if (name.endsWith('.jpg')) return '/test-asset.jpg';
    throw new Error(name);
  }, mod, mod.exports, browser);
  return mod.exports;
}
const input = { userId: 900001, cityId: 1, preferences: { partySize: 2, category: '美食吃喝', budgetMax: 200, budgetMin: 0, budgetLabel: '划算出行', durationMinutes: null, environment: 'either', radiusKm: null, travelDurationLabel: '当天', randomLevel: 70, mood: '热闹' } };

test('实际本地抽取：刷新后记得已看过地点，结果ID能继续查详情', () => {
  const storage = new Map<string, string>();
  const firstApp = load(storage);
  const first = firstApp.createDemoDraw(input);
  assert.equal(first.activity.category, '美食吃喝');
  const secondApp = load(storage);
  const second = secondApp.createDemoDraw(input);
  assert.notEqual(first.activity.id, second.activity.id);
  assert.notEqual(first.activity.address, second.activity.address);
  assert.equal(second.attemptsUsed, 2);
  assert.ok(secondApp.demoActivities.some((a: { id: number }) => a.id === second.activity.id));
});

test('实际本地抽取：看完候选不回退重复，失败不扣次数', () => {
  const storage = new Map<string, string>();
  const app = load(storage);
  const filteredInput = { ...input, cityId: 3, preferences: { ...input.preferences, category: '约会' } };
  const first = app.createDemoDraw(filteredInput);
  const second = app.createDemoDraw(filteredInput, first);
  assert.notEqual(first.activity.address, second.activity.address);
  assert.equal(second.alternativesRemaining, 0);
  const before = storage.get('@lazyde/draw-memory:v2');
  assert.throws(() => app.createDemoDraw(filteredInput, second), /新地点已经看完/);
  assert.equal(storage.get('@lazyde/draw-memory:v2'), before);
});

test('实际本地抽取：单人不会抽到双人约会，双日结果保留每天全部步骤', () => {
  const app = load();
  assert.throws(() => app.createDemoDraw({ ...input, preferences: { ...input.preferences, category: '约会', partySize: 1 } }), /没有同时符合/);
  const result = app.createDemoDraw({ ...input, cityId: 2, preferences: { ...input.preferences, category: '美食吃喝', travelDurationLabel: '周末游', budgetMax: 700 } });
  assert.equal(result.activity.itinerary.daysCount, 2);
  assert.ok(result.activity.steps.length > 3);
  assert.equal(new Set(result.activity.itinerary.stops.map((s: {day: number}) => s.day)).size, 2);
});

test('仅浏览不锁死30天：新一轮可重游，明确不喜欢才排除', () => {
  const storage = new Map<string, string>();
  const app = load(storage);
  const args = { ...input, cityId: 3, preferences: { ...input.preferences, category: '约会' } };
  const first = app.createDemoDraw(args); const second = app.createDemoDraw(args, first);
  const nextVisit = load(storage).createDemoDraw(args);
  assert.ok([first.activity.id, second.activity.id].includes(nextVisit.activity.id));
  const isolated = load(); isolated.recordDemoOutcome(first.activity, 'disliked');
  const remaining = isolated.createDemoDraw(args);
  assert.notEqual(remaining.activity.id, first.activity.id);
});

test('实际本地抽取：晚上九点选现在出发能返回夜间玩法', () => {
  const app = load();
  const evening = new Date('2026-09-06T13:00:00Z');
  const result = app.createDemoDraw({
    ...input,
    cityId: 1,
    preferences: { ...input.preferences, category: '不限', mood: '放松', departureMode: 'now' },
  }, null, evening);
  assert.ok(result.activity.moodTags.includes('夜间'));
  assert.equal(result.activity.plannedDate, '2026-09-06');
  assert.equal(result.activity.plannedArrival, '21:30');
});

test('本地抽取不再受每日三次限制', () => {
  const evening = new Date('2026-09-06T13:00:00Z');
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const storage = new Map<string, string>([['@lazyde/draw-memory:v2', JSON.stringify({ date, count: 3, records: [] })]]);
  const app = load(storage);
  const result = app.createDemoDraw({ ...input, preferences: { ...input.preferences, category: '不限', mood: '放松', departureMode: 'now' } }, null, evening);
  assert.ok(result.activity.moodTags.includes('夜间'));
  assert.equal(result.attemptsUsed, 4);
});
