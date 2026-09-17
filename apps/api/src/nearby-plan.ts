import { AppError } from './errors.js';
import { reverseGeocodeLocationWithAmap } from './amap-geocode.js';
import { getCityWeather, type CityWeather } from './weather.service.js';
import { searchAmapNearbyPlaces, type NearbyLivePlace } from './nearby-live-places.js';
import { convertGpsToAmap, getWalkingRoute, lngLat, type Point, type WalkingRoute } from './nearby-plan-facts.js';
import { chooseNearbyPlan } from './nearby-plan-ai.js';
import { classifyPlace, distanceKm, freshWeather, isWeatherSuitable, openingCoverage, parseAiPlanChoice, explicitlyClosedToday, type NearbyPlanInput, type PlayKind } from './nearby-plan-policy.js';

export type PlanDependencies = {
  now: () => Date;
  convert: (point: Point) => Promise<Point | null>;
  reverse: typeof reverseGeocodeLocationWithAmap;
  weather: (city: string) => Promise<CityWeather | null>;
  search: typeof searchAmapNearbyPlaces;
  walk: (from: Point, to: Point) => Promise<WalkingRoute | null>;
  choose: (candidates: unknown, preferences: unknown) => Promise<string | null>;
};
const dependencies: PlanDependencies = {
  now: () => new Date(), convert: convertGpsToAmap, reverse: reverseGeocodeLocationWithAmap,
  weather: getCityWeather, search: searchAmapNearbyPlaces, walk: getWalkingRoute, choose: chooseNearbyPlan,
};
type Candidate = {
  place: NearbyLivePlace; kind: PlayKind; indoor: boolean; minimumMinutes: number;
  outbound: WalkingRoute; returning: WalkingRoute; maxStay: number;
  opening: 'covered' | 'unknown'; warnings: string[]; estimatedPerPerson: number | null;
};
const fallbackIdeas: Record<PlayKind, string[]> = {
  games: ['和朋友先商量都愿意玩的项目，现场确认规则后再开始', '轮流选择轻松的小挑战，照顾不熟悉玩法的同伴'],
  walk: ['选一段开放步道慢慢走，各自寻找最喜欢的景色', '互相分享沿途注意到的小细节，累了就就近休息'],
  food: ['先一起看菜单，按各自喜好和实际价格决定点单', '找一个舒服的位置聊天，各分享最近的一件趣事'],
  culture: ['根据现场开放内容，各自挑一个感兴趣的展项', '交换观察到的细节，用自己的话讲讲为什么喜欢'],
};
const unique = (values: string[]) => [...new Set(values)];

export async function generateNearbyPlan(input: NearbyPlanInput, deps: PlanDependencies = dependencies) {
  const requestTime = deps.now();
  if (input.locationTimestamp > requestTime.getTime() + 60_000 || requestTime.getTime() - input.locationTimestamp > 5 * 60_000) {
    throw new AppError(422, 'LOCATION_STALE', '位置已过期，请重新定位后生成现在出发的攻略。');
  }
  const origin = input.coordinateSystem === 'gcj02' ? { latitude: input.latitude, longitude: input.longitude } : await deps.convert(input);
  if (!origin) throw new AppError(503, 'COORDINATE_UNAVAILABLE', '暂时无法校准设备坐标，请稍后重试。');
  const location = await deps.reverse(origin.latitude, origin.longitude);
  if (!location) throw new AppError(503, 'LOCATION_UNVERIFIED', '暂时无法核实当前城市，未生成跨城攻略。');
  // Bounded recall and route verification; recent places remain excluded across new requests.
  const [places, reportedWeather] = await Promise.all([
    deps.search({ ...origin, cityName: location.city.replace(/市$/, ''), radiusKm: 3, mood: input.mood, kind: input.kind }),
    deps.weather(location.adcode || location.city),
  ]);
  if (places === null) throw new AppError(503, 'LIVE_PLACES_UNAVAILABLE', '实时地点查询暂不可用，请稍后再试；未用模板冒充实时攻略。');
  const checkedAt = deps.now();
  const weather = freshWeather(reportedWeather, checkedAt);
  const excluded: Record<string, number> = {};
  const reject = (reason: string) => { excluded[reason] = (excluded[reason] ?? 0) + 1; };
  const seen = new Set<string>();
  const candidates = places.flatMap(place => {
    if (seen.has(place.id)) return [];
    seen.add(place.id);
    if (!place.cityName || place.cityName.replace(/市$/, '') !== location.city.replace(/市$/, '')) { reject('地点城市未核实'); return []; }
    if (input.excludePoiIds.includes(place.id)) { reject('已看过'); return []; }
    const info = classifyPlace(place);
    if (!info || (input.kind !== 'any' && info.kind !== input.kind)) { reject('玩法类型不符'); return []; }
    if (input.partySize < 4 && /麻将/.test(place.name + place.type) && !/桌游|台球/.test(place.name + place.type)) { reject('麻将人数不足'); return []; }
    if (distanceKm(origin, place) > 3) { reject('超出附近范围'); return []; }
    if (place.costYuan !== null && place.costYuan > input.budgetPerPersonYuan) { reject('超出预算'); return []; }
    if (place.costYuan === null && !input.allowUnverified) { reject('价格待确认'); return []; }
    const suitable = isWeatherSuitable(weather, info.indoor);
    if (suitable === false) { reject('天气不适合'); return []; }
    if (!weather && !input.allowUnverified) { reject('天气待确认'); return []; }
    const initialOpening = openingCoverage(place.openingToday, checkedAt, new Date(checkedAt.getTime() + info.minimumMinutes * 60_000), checkedAt);
    // A currently closed place may open before arrival, so only authoritative closed-all-day is rejected here.
    if (explicitlyClosedToday(place.openingToday)) { reject('今日不开放'); return []; }
    if (initialOpening === 'unknown' && !input.allowUnverified) { reject('营业时间待确认'); return []; }
    return [{ place, ...info }];
  }).sort((a, b) => {
    const affinity = (kind: PlayKind) => input.mood === '热闹' ? (kind === 'games' ? 0 : 1) : input.mood === '探索' ? (kind === 'culture' ? 0 : 1) : (kind === 'walk' || kind === 'food' ? 0 : 1);
    return affinity(a.kind) - affinity(b.kind) || distanceKm(origin, a.place) - distanceKm(origin, b.place);
  });
  // Round-robin different experience types instead of letting one nearest type fill the pool.
  const diversified: typeof candidates = [];
  const groups = new Map<PlayKind, typeof candidates>();
  for (const candidate of candidates) groups.set(candidate.kind, [...(groups.get(candidate.kind) || []), candidate]);
  while (diversified.length < 6 && [...groups.values()].some(group => group.length)) {
    for (const group of groups.values()) {
      const candidate = group.shift();
      if (candidate && diversified.length < 6) diversified.push(candidate);
    }
  }

  const start = new Date(deps.now().getTime() + 60_000);
  const facts = (await Promise.all(diversified.map(async candidate => {
    const { place, minimumMinutes, indoor } = candidate;
    const [outbound, returning] = await Promise.all([deps.walk(origin, place), deps.walk(place, origin)]);
    if (!outbound || !returning) { reject('步行路线无法核实'); return null; }
    if (outbound.minutes > input.maxWalkMinutes || returning.minutes > input.maxWalkMinutes) { reject('步行太远'); return null; }
    const maxStay = Math.min(120, input.availableMinutes - outbound.minutes - returning.minutes - 10);
    if (maxStay < minimumMinutes) { reject('时间不够'); return null; }
    const arrival = new Date(start.getTime() + outbound.minutes * 60_000);
    const opening = openingCoverage(place.openingToday, arrival, new Date(arrival.getTime() + minimumMinutes * 60_000), checkedAt);
    if (opening === 'closed') { reject('到达或游玩时段不开放'); return null; }
    if (opening === 'unknown' && !input.allowUnverified) { reject('营业时间待确认'); return null; }
    const warnings: string[] = [];
    if (opening === 'unknown') warnings.push('营业时段无法完整核实，先联系商家确认再出发。');
    if (place.costYuan === null) warnings.push('费用未知，无法确认是否符合预算，确认实际收费后再决定。');
    if (!weather) warnings.push('实时天气未核实，请查看现场天气再出发。');
    if (weather && indoor && weather.risks.some(risk => risk !== 'normal')) warnings.push('目的地以室内活动为主，但步行转场仍会受到当前天气影响。');
    return { ...candidate, outbound, returning, maxStay, opening, warnings, estimatedPerPerson: place.costYuan } satisfies Candidate;
  }))).filter((candidate): candidate is Candidate => candidate !== null);

  if (facts.length === 0) return {
    status: 'no_match' as const, city: location.city, generatedAt: deps.now().toISOString(),
    message: excluded['已看过'] ? '近期看过的地点已排除，当前条件下暂时没有新的可核实行程。可以扩大步行范围或调整玩法类型。' : '没有找到同时满足当前时间、步行距离和预算的可核实行程。',
    excluded, weather,
  };
  const rawChoice = await deps.choose(facts.map(c => ({ candidateId: c.place.id, name: c.place.name, type: c.place.type, minStay: c.minimumMinutes, maxStay: c.maxStay, walkMinutes: c.outbound.minutes, referenceCostYuan: c.estimatedPerPerson })), { partySize: input.partySize, mood: input.mood, availableMinutes: input.availableMinutes, budgetPerPersonYuan: input.budgetPerPersonYuan, localTime: start.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }), weather: weather?.condition ?? '未知' }).catch(() => null);
  const choice = rawChoice ? parseAiPlanChoice(rawChoice) : null;
  let selected = facts[0]!;
  let stayMinutes = selected.minimumMinutes;
  let generation: 'ai' | 'rules' = 'rules';
  let playIdeas = fallbackIdeas[selected.kind];
  if (choice) {
    const candidate = facts.find(c => c.place.id === choice.candidateId);
    if (candidate && choice.stayMinutes >= candidate.minimumMinutes && choice.stayMinutes <= candidate.maxStay) {
      const arrival = new Date(start.getTime() + candidate.outbound.minutes * 60_000);
      const coverage = openingCoverage(candidate.place.openingToday, arrival, new Date(arrival.getTime() + choice.stayMinutes * 60_000), checkedAt);
      if (coverage === 'covered' || (coverage === 'unknown' && input.allowUnverified)) {
        selected = candidate; stayMinutes = choice.stayMinutes; playIdeas = choice.playIdeas; generation = 'ai';
      }
    }
  }
  const arrival = new Date(start.getTime() + selected.outbound.minutes * 60_000);
  const leaving = new Date(arrival.getTime() + stayMinutes * 60_000);
  const backAt = new Date(leaving.getTime() + selected.returning.minutes * 60_000);
  const totalMinutes = selected.outbound.minutes + stayMinutes + selected.returning.minutes + 10;
  const warnings = [...selected.warnings, '价格为平台参考人均费用，并非实时报价；预约、排队和席位需出发前确认。'];
  if (generation === 'rules') warnings.push('AI 暂未生成合格内容，本次展示按已核实数据整理的基础攻略。');
  const referenceCost = selected.estimatedPerPerson;
  const reserve = referenceCost === null ? null : Math.min(input.budgetPerPersonYuan - referenceCost, Math.ceil(referenceCost * .2));
  return {
    status: selected.warnings.length > 0 ? 'conditional' as const : 'ready' as const,
    generation, city: location.city, generatedAt: deps.now().toISOString(), expiresAt: new Date(start.getTime() + 10 * 60_000).toISOString(),
    plan: {
      title: `${selected.place.name} · ${input.partySize}人附近小行程`,
      place: { id: selected.place.id, name: selected.place.name, address: selected.place.address, photoUrl: selected.place.photoUrl ?? null, sourceUrl: `https://www.amap.com/place/${encodeURIComponent(selected.place.id)}`, openingToday: selected.place.openingToday ?? null, phone: selected.place.phone ?? null },
      playIdeas,
      timeline: [
        { phase: 'outbound', label: '步行前往', startsAt: start.toISOString(), endsAt: arrival.toISOString(), minutes: selected.outbound.minutes },
        { phase: 'activity', label: '核心体验', startsAt: arrival.toISOString(), endsAt: leaving.toISOString(), minutes: stayMinutes },
        { phase: 'return', label: '步行返回出发点', startsAt: leaving.toISOString(), endsAt: backAt.toISOString(), minutes: selected.returning.minutes },
      ],
      totalMinutes, bufferMinutes: 10, walkingMeters: selected.outbound.meters + selected.returning.meters,
      budget: { capPerPersonYuan: input.budgetPerPersonYuan, referencePerPersonYuan: referenceCost, reservePerPersonYuan: reserve, groupReferenceYuan: referenceCost === null ? null : referenceCost * input.partySize, priceStatus: referenceCost === null ? 'unknown' : 'reference', transportYuan: 0 },
      checks: { city: 'verified', coordinates: 'gcj02', route: 'amap_walking_roundtrip', hours: selected.opening, weather: weather ? 'checked' : 'unknown', withinAvailableTime: totalMinutes <= input.availableMinutes },
      navigationUrl: `https://uri.amap.com/navigation?to=${lngLat(selected.place)},${encodeURIComponent(selected.place.name)}&mode=walk&coordinate=gaode&callnative=1`,
    }, weather, warnings: unique(warnings), excluded,
  };
}
