import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { requireNearbyCoordinates } from '../src/draw-location-policy.js';

function loadClient(path: string, globals: Record<string, unknown> = {}) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: Record<string, any> = {};
  vm.runInNewContext(code, { exports, ...globals });
  return exports;
}
const flow = loadClient('../client/src/lib/web-draw-flow.ts');
const cities = [{ id: 1, name: '上海' }, { id: 3, name: '北京' }, { id: 2, name: '杭州' }];

test('首页北京序号1的旧消息按真实名字解析为数据库北京3，不再成为上海1', () => {
  assert.equal(flow.resolveHomeCityId({ cityName: '北京', cityId: 1 }, []), null);
  assert.equal(flow.resolveHomeCityId({ cityName: '北京', cityId: 1 }, cities), 3);
  assert.equal(flow.resolveHomeCityId({ cityName: '北京市', cityId: 1 }, cities), 3);
  assert.equal(flow.resolveHomeCityId({ cityName: '未收录城市', cityId: 1 }, cities), null);
});

test('真实首页脚本启动不会抢发北京=1，拿到城市列表后请求北京=3且不回写循环', () => {
  const source = readFileSync('../client/public/gravity-home/app.js', 'utf8');
  const start = source.indexOf('function setupCityRecommendations() {');
  const end = source.lastIndexOf('\nsetupSectionObserver();');
  const messages: Array<{ type: string; cityId?: number }> = [];
  const events = new Map<string, (event: any) => void>();
  const cards = Array.from({ length: 4 }, () => ({ style: {}, dataset: {}, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} }));
  const document = { querySelector: () => null, querySelectorAll: (selector: string) => selector === '.place-card' ? cards : [], addEventListener() {} };
  const window = { location: { origin: 'https://chuquwanya.fun' }, parent: { postMessage: (message: any) => messages.push(message) }, addEventListener: (type: string, listener: any) => events.set(type, listener) };
  vm.runInNewContext(source.slice(start, end) + '\nsetupCityRecommendations();', { window, document, localStorage: { getItem: () => null, setItem() {} } });
  assert.equal(messages.length, 0);
  const listener = events.get('message');
  assert.ok(listener, '首页城市消息处理器应已注册');
  listener({ origin: 'https://chuquwanya.fun', data: { type: 'gravity-home:cities', cities, selectedCityName: '北京' } });
  assert.equal(messages.filter(message => message.type === 'gravity-home:city-selected').length, 0);
  assert.equal(messages.find(message => message.type === 'gravity-home:request-guides')?.cityId, 3);
});

test('缓存的首页直抽链接也进入附近流程，不执行默认城市抽取', () => {
  assert.equal(flow.routeHomeDrawHref('/box/slot-preview'), '/box/config?mode=nearby');
  assert.equal(flow.routeHomeDrawHref('/box/slot-preview?old=1'), '/box/config?mode=nearby');
  assert.equal(flow.routeHomeDrawHref('/box/open'), '/box/config?mode=nearby');
  assert.equal(flow.routeHomeDrawHref('/activity/12'), '/activity/12');
});

test('分类入口沿用同一附近流程并传递心情、类型和人数', () => {
  assert.equal(flow.nearbyCategoryPreset('休闲躺平').mood, '放松');
  assert.equal(flow.nearbyCategoryPreset('城市散步').kind, 'walk');
  assert.equal(flow.nearbyCategoryPreset('美食吃喝').kind, 'food');
  assert.equal(flow.nearbyCategoryPreset('娱乐玩乐').kind, 'games');
  assert.ok(flow.nearbyConfigHref('休闲躺平').includes('mode=nearby'));
});

test('旧上海待抽缓存不能被新附近入口默默复用，明确城市请求仍可恢复', () => {
  const storage = new Map<string, string>();
  const state = loadClient('../client/src/lib/pc-box-open-state.ts', {
    require: () => flow,
    window: { sessionStorage: { setItem: (k: string, v: string) => storage.set(k, v), getItem: (k: string) => storage.get(k) ?? null, removeItem: (k: string) => storage.delete(k) } },
  });
  state.savePendingPcBoxDraw({ cityId: 1, preferences: {}, summary: '旧上海请求' });
  assert.equal(state.readPendingPcBoxDraw(), null);
  state.savePendingPcBoxDraw({ intent: 'city', cityId: 3, preferences: {}, summary: '明确选择北京全城' });
  assert.equal(state.readPendingPcBoxDraw()?.cityId, 3);
});

test('服务端拒绝没有真实坐标的附近抽取，但允许明确城市行程', () => {
  assert.throws(() => requireNearbyCoordinates({ destinationScope: 'nearby', originLatitude: null, originLongitude: null }), { code: 'LOCATION_REQUIRED' });
  assert.throws(() => requireNearbyCoordinates({ destinationScope: 'nearby', originLatitude: NaN, originLongitude: 116.4 }), { code: 'LOCATION_REQUIRED' });
  assert.doesNotThrow(() => requireNearbyCoordinates({ destinationScope: 'nearby', originLatitude: 39.9, originLongitude: 116.4 }));
  assert.doesNotThrow(() => requireNearbyCoordinates({ destinationScope: 'nationwide', originLatitude: null, originLongitude: null }));
});
