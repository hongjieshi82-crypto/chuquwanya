import assert from 'node:assert/strict';
import test from 'node:test';
import { nearbyPlanInputSchema, openingCoverage, parseAiPlanChoice, freshWeather } from '../src/nearby-plan-policy.js';
import { generateNearbyPlan, type PlanDependencies } from '../src/nearby-plan.js';
import { normalizeNearbyLivePlace } from '../src/nearby-live-places.js';
import { currentVenueIds, historyVenueIds } from '../src/nearby-venues.js';
import { tagNearbyPlace } from '../src/nearby-tags.js';

const now = new Date('2026-09-16T06:00:00Z'); // Beijing 14:00
const place = normalizeNearbyLivePlace({ id: 'P1', name: '真实咖啡馆', cityname: '北京市', location: '116.41,39.91', type: '餐饮服务;咖啡厅', business: { cost: '45', opentime_today: '10:00-22:00' } }, '北京')!;
const input = () => nearbyPlanInputSchema.parse({ latitude: 39.9, longitude: 116.4, locationTimestamp: now.getTime(), accuracyMeters: 40, budgetPerPersonYuan: 100, partySize: 2 });
const deps = (): PlanDependencies => ({
  now: () => now,
  convert: async () => ({ latitude: 39.901, longitude: 116.406 }),
  reverse: async () => ({ city: '北京市', address: '北京市', adcode: '110101' }),
  weather: async () => ({ city: '北京', condition: '晴', temperature: 25, windLevel: 2, humidity: 50, risks: ['normal'], observedAt: '2026-09-16 13:55:00', source: 'amap' }),
  search: async () => [place],
  walk: async () => ({ minutes: 10, meters: 600 }),
  choose: async () => JSON.stringify({ candidateId: 'P1', stayMinutes: 45, playIdeas: ['各自选喜欢的饮品，聊聊最近的趣事', '分享今天看到的风景，放松休息'] }),
});

test('校准 GPS 后查询城市与真实往返路线，AI 只能安排给定地点', async () => {
  const d = deps();
  let firstPoint: unknown;
  d.reverse = async (latitude, longitude) => { firstPoint = { latitude, longitude }; return { city: '北京市', address: '北京' }; };
  const result = await generateNearbyPlan(input(), d);
  assert.deepEqual(firstPoint, { latitude: 39.901, longitude: 116.406 });
  assert.equal(result.status, 'ready');
  if (!('plan' in result)) assert.fail();
  assert.equal(result.generation, 'ai');
  assert.equal(result.plan.totalMinutes, 75);
  assert.equal(result.plan.budget.groupReferenceYuan, 90);
  assert.equal(result.plan.timeline[2]?.label, '步行返回出发点');
  assert.equal(result.plan.place.id, 'P1');
});

test('过期定位在调用外部服务前拒绝', async () => {
  const d = deps(); d.convert = async () => { assert.fail('不应请求外部服务'); };
  await assert.rejects(generateNearbyPlan({ ...input(), locationTimestamp: now.getTime() - 360_000 }, d), /位置已过期/);
});

test('超预算、闭馆和路线失败不生成可执行攻略', async () => {
  for (const override of [
    { search: async () => [{ ...place, cityName: '上海市' }] },
    { search: async () => [{ ...place, cityName: null }] },
    { search: async () => [{ ...place, costYuan: 150 }] },
    { search: async () => [{ ...place, openingToday: '09:00-14:10' }] },
    { walk: async () => null },
    { walk: async () => ({ minutes: 40, meters: 2500 }) },
  ]) {
    const d = { ...deps(), ...override, choose: async () => { assert.fail('没有合格候选不能调用模型'); } };
    const result = await generateNearbyPlan(input(), d);
    assert.equal(result.status, 'no_match');
  }
});

test('未知营业和价格需要用户明确允许，且不冒充已知预算', async () => {
  const d = deps(); d.search = async () => [{ ...place, costYuan: null, openingToday: null }];
  assert.equal((await generateNearbyPlan(input(), d)).status, 'no_match');
  const conditional = await generateNearbyPlan({ ...input(), allowUnverified: true }, d);
  assert.equal(conditional.status, 'conditional');
  if (!('plan' in conditional)) assert.fail();
  assert.equal(conditional.plan.budget.referencePerPersonYuan, null);
  assert.equal(conditional.plan.checks.hours, 'unknown');
});

test('AI 无效地点、超时长、营业承诺均回退基础规则', async () => {
  for (const choice of [
    { candidateId: 'FAKE', stayMinutes: 45, playIdeas: ['看看喜欢的东西', '和朋友聊聊感受'] },
    { candidateId: 'P1', stayMinutes: 120, playIdeas: ['看看喜欢的东西', '和朋友聊聊感受'] },
    { candidateId: 'P1', stayMinutes: 45, playIdeas: ['这里免费且免预约', '和朋友聊聊感受'] },
  ]) {
    const result = await generateNearbyPlan(input(), { ...deps(), choose: async () => JSON.stringify(choice) });
    if (!('plan' in result)) assert.fail();
    assert.equal(result.generation, 'rules');
    assert.equal(result.plan.place.id, 'P1');
    assert.ok(result.plan.totalMinutes <= 120);
  }
});

test('午休、跨午夜、无法解析的营业描述不误判', () => {
  const date = (time: string) => new Date(`2026-09-16T${time}+08:00`);
  assert.equal(openingCoverage('09:00-12:00;14:00-18:00', date('11:30:00'), date('12:30:00'), now), 'closed');
  assert.equal(openingCoverage('18:00-02:00', date('23:00:00'), new Date('2026-09-17T01:00:00+08:00'), now), 'covered');
  assert.equal(openingCoverage('周一休息，其他时间开放', date('14:00:00'), date('15:00:00'), now), 'unknown');
  assert.equal(openingCoverage('09:00-25:00', date('14:00:00'), date('15:00:00'), now), 'unknown');
});

test('恶劣天气拒绝，过期天气不冒充已核实', async () => {
  const d = deps(); const w = (await d.weather('北京'))!;
  d.weather = async () => ({ ...w, condition: '暴雨', risks: ['rain'] });
  assert.equal((await generateNearbyPlan({ ...input(), allowUnverified: true }, d)).status, 'no_match');
  assert.equal(freshWeather({ ...w, observedAt: '2026-09-15 12:00:00' }, now), null);
});

test('模型不得注入 URL 或价格', () => {
  assert.equal(parseAiPlanChoice(JSON.stringify({ candidateId: 'P1', stayMinutes: 45, playIdeas: ['请打开https://evil.test', '喝茶只要10元'] })), null);
});

test('面议和空白费用不能当成零元，缺失经纬度不能当成零坐标', () => {
  assert.equal(normalizeNearbyLivePlace({ id: 'P2', name: '棋牌室', location: '116.4,39.9', business: { cost: '面议' } }, '北京')?.costYuan, null);
  assert.equal(normalizeNearbyLivePlace({ id: 'P2', name: '棋牌室', location: ',39.9' }, '北京'), null);
});

test('连续生成携带历史排除地点，不再重复第一家；全部已看过时明确无新结果', async () => {
  const d = deps();
  d.search = async () => [place, { ...place, id: 'P2', name: '另一家咖啡馆' }];
  d.choose = async () => null;
  const first = await generateNearbyPlan(input(), d);
  assert.ok(first.plan);
  const next = await generateNearbyPlan({ ...input(), excludePoiIds: [first.plan.place.id] }, d);
  assert.ok(next.plan);
  assert.notEqual(first.plan.place.id, next.plan.place.id);
  const end = await generateNearbyPlan({ ...input(), excludePoiIds: ['P1', 'P2'] }, d);
  assert.equal(end.status, 'no_match');
  assert.ok('message' in end && end.message.includes('近期看过'));
});

test('动物园门口不反复推荐动物园和海洋馆，历史也排除相近项目', async () => {
  const d = deps();
  d.reverse = async () => ({ city: '北京市', address: '北京市北京动物园南门' });
  d.search = async () => [{ ...place, id: 'ZOO', name: '北京动物园', type: '风景名胜' }, { ...place, id: 'OCEAN', parentId: 'ZOO', name: '北京海洋馆', type: '风景名胜' }, place];
  d.choose = async () => null;
  const result = await generateNearbyPlan(input(), d);
  assert.ok(result.plan);
  assert.equal(result.plan.place.id, 'P1');
  assert.equal(result.excluded['当前场所及内部项目'], 2);
  d.reverse = async () => ({ city: '北京市', address: '北京某街道' });
  const next = await generateNearbyPlan({ ...input(), excludePlaceNames: ['北京动物园'] }, d);
  assert.ok(next.plan);
  assert.equal(next.plan.place.id, 'P1');
});

test('当前商场整体排除内部店铺和多层项目，外部同类商店保留', async () => {
  const places = [
    { ...place, id: 'MALL', name: '测试购物中心', type: '购物服务' },
    { ...place, id: 'SHOP', name: '馆内咖啡', parentId: 'MALL' },
    { ...place, id: 'SUB', name: '馆内桌游', type: '棋牌室', parentId: 'SHOP' },
    place,
  ];
  const located = { city: '北京市', address: '某街道', venues: [{ id: 'AOI', name: '测试购物中心' }] };
  const ids = currentVenueIds(located, places);
  assert.ok(ids.has('MALL') && ids.has('SHOP') && ids.has('SUB'));
  assert.ok(!ids.has('P1'));
  const d = deps(); d.reverse = async () => located; d.search = async () => places;
  const result = await generateNearbyPlan(input(), d);
  assert.equal(result.plan?.place.id, 'P1');
  assert.equal(result.excluded['当前场所及内部项目'], 3);
});

test('历史项目归属同一场所时排除兄弟项目，不按同类型整体排除', () => {
  const places = [
    { ...place, id: 'ZOO', name: '北京动物园' },
    { ...place, id: 'OCEAN', parentId: 'ZOO', name: '北京海洋馆' },
    { ...place, id: 'PANDA', parentId: 'ZOO', name: '熊猫馆' },
    { ...place, id: 'OTHER', name: '独立海洋馆' },
  ];
  const ids = historyVenueIds(places, ['OCEAN'], []);
  assert.ok(ids.has('ZOO') && ids.has('PANDA'));
  assert.ok(!ids.has('OTHER'));
});

test('标签区分心情与玩法，景区不冒充散步，棋牌优先于附带餐饮标签', () => {
  assert.equal(tagNearbyPlace({ ...place, name: '北京海洋馆', type: '风景名胜' }), null);
  assert.equal(tagNearbyPlace({ ...place, name: '河边公园', type: '风景名胜' })?.kind, 'walk');
  assert.equal(tagNearbyPlace({ ...place, name: '朋友桌游咖啡', type: '餐饮服务' })?.kind, 'games');
  assert.equal(tagNearbyPlace({ ...place, name: '美术馆', type: '科教文化服务' })?.kind, 'culture');
  assert.equal(tagNearbyPlace(place)?.experience, '咖啡茶饮');
});
