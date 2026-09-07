import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as policy from '../src/itinerary-policy.js';
import * as departure from '../src/departure-policy.js';

function loadClient(storage: Map<string, string>, outcomes: string[]) {
  const code = ts.transpileModule(readFileSync('../client/src/services/api.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} as any };
  new Function('require', 'module', 'exports', 'fetch', code)((name: string) => {
    if (name === 'react-native') return { Platform: { OS: 'web', select: (v: any) => v.default } };
    if (name.includes('async-storage')) return { __esModule: true, default: { getItem: async (k: string) => storage.get(k) ?? null, setItem: async (k: string, v: string) => { storage.set(k, v); }, removeItem: async (k: string) => { storage.delete(k); } } };
    if (name.includes('itinerary-policy')) return policy;
    if (name.includes('departure-policy')) return departure;
    if (name === '@/formatters') return { formatActivityTitle: (v: string) => v };
    if (name.includes('auth-storage')) return { getAuthToken: async () => null, clearAuthToken: async () => {}, setAuthToken: async () => {} };
    if (name.includes('itinerary-plans.json')) return { __esModule: true, default: [] };
    if (name.includes('demo-data')) return { demoActivities: policy.practicalActivities, resolveCuratedActivityCover: () => null, recordDemoOutcome: (_a: unknown, kind: string) => outcomes.push(kind) };
    throw new Error(name);
  }, mod, mod.exports, async () => { throw new TypeError('Test: offline preview'); });
  return mod.exports;
}
test('真实客户端服务：收藏无日期，未来安排可恢复，改期后开始并保存反馈', async (t) => {
  t.mock.timers.enable({apis: ['Date'], now: new Date('2026-09-06T01:00:00Z')});
  const storage = new Map<string, string>(); const outcomes: string[] = [];
  let app = loadClient(storage, outcomes);
  await app.saveActivity(810003, 900001);
  assert.equal((await app.getTodos(900001)).length, 0);
  assert.equal((await app.getSavedActivities(900001))[0].id, 810003);
  const future = departure.addDays(departure.chinaDate(), 8);
  const added = await app.addTodo({ userId: 900001, activityId: 810003, scheduledDate: future, scheduledTime: '15:30' });
  app = loadClient(storage, outcomes);
  const restored = (await app.getTodos(900001))[0];
  assert.equal(restored.scheduledDate, future);
  assert.equal(restored.scheduledTime, '15:30');
  await assert.rejects(app.startTodo(added.id, 900001), /出发当天/);
  await app.scheduleTodo(added.id, departure.chinaDate(), '15:30');
  await app.startTodo(added.id, 900001);
  await app.saveTripProgress(added.id, {activeStep: 1, paused: true, skipped: [0]});
  assert.deepEqual(await loadClient(storage, outcomes).getTripProgress(added.id), {activeStep: 1, paused: true, skipped: [0]});
  await app.submitTripFeedback(added.id, 'worth_it', '路线轻松，愿意再来');
  const completed = (await loadClient(storage, outcomes).getTodos(900001))[0];
  assert.equal(completed.status, 'completed');
  assert.equal(completed.feedbackVerdict, 'worth_it');
  assert.equal(completed.feedbackNote, '路线轻松，愿意再来');
  assert.deepEqual(outcomes, ['completed']);
});
test('未开始不能提交完成感受；不喜欢会进入后续排除', async () => {
  const outcomes: string[] = []; const app = loadClient(new Map(), outcomes);
  const added = await app.addTodo({ activityId: 810006, scheduledDate: departure.chinaDate() });
  await assert.rejects(app.submitTripFeedback(added.id, 'not_for_me', ''), /先开始/);
  await app.startTodo(added.id);
  await app.submitTripFeedback(added.id, 'not_for_me', '不喜欢这条路线');
  assert.deepEqual(outcomes, ['disliked']);
});
