import { cityPlaySeeds, secondCityChoices, affordableEntertainment, nightCityChoices } from './city-play-seeds.js';
import photoData from './city-play-photos.json' with { type: 'json' };
import { cityFoodOptions } from './city-food-options.js';
import type { PlanActivity, PracticalItinerary, ItineraryStop } from './itinerary-policy.js';

export type PhotoCredit = { author: string; license: string; licenseUrl: string; source: string; kind: 'photo' | 'illustration' };
type Photo = PhotoCredit & { uri: string | null; page?: string };
const photos = photoData as Record<string, Photo>;
const categories = ['约会', '休闲躺平', '娱乐玩乐', '娱乐玩乐', '探险猎奇', '美食吃喝', '美食吃喝', '城市散步', '约会', '休闲躺平', '探险猎奇', '城市散步', '娱乐玩乐', '城市散步'];
const moods: Record<string, string> = { '约会': '放松', '休闲躺平': '放松', '娱乐玩乐': '热闹', '探险猎奇': '探索', '美食吃喝': '热闹', '城市散步': '放松' };
const supplies = ['充满电的手机', '充电宝与充电线', '饮用水与纸巾'];
export type CityPlayActivity = PlanActivity & { coverCredit?: PhotoCredit; placeKey: string; placeKeys?: string[]; experienceKey: string; contentStatus: 'review'; verificationNote: string };
export const nationalSingleActivities: CityPlayActivity[] = cityPlaySeeds.flatMap((city) => {
  const entries = [...city.plays, ...(secondCityChoices[city.id] ?? []), affordableEntertainment[city.id]!, nightCityChoices[city.id]!];
  return entries.map((seed, index) => {
    const id = 820000 + city.id * 100 + index;
    const category = categories[index]!;
    const night = index === 13;
    const samePlaceIndex = entries.slice(0, 13).findIndex((entry) => entry.place === seed.place);
    const fallbackPhoto = night && samePlaceIndex >= 0 ? photos[String(820000 + city.id * 100 + samePlaceIndex)] : undefined;
    const indoor = index === 2 || /博物|科技馆|科学技术馆|天文馆|海底世界/.test(seed.place);
    const environment = indoor ? 'indoor' : category === '美食吃喝' ? 'either' : 'outdoor';
    const food = category === '美食吃喝';
    const longVisit = seed.minutes >= 360;
    const source = seed.source || photos[String(id)]?.page || '';
    const opening = indoor || index === 3 || index === 12 || /博物|古德寺|植物园|海底|海洋/.test(seed.place);
    const reservation = night
      ? '立即出发前用地图核对步道或街区开放、照明、天气与末班交通；只走人流稳定的公共区域，不将商户营业作为保证。'
      : opening
      ? '出发前用场馆官方渠道确认所选日期的开放、门票、预约和项目限制；下面是参考节奏，不代表已订票。'
      : food ? '出发前在地图核对营业店铺、菜单与等位；参考预算不是报价，先确认价格再下单。'
        : '只安排公开开放区域；临时封闭、天气与开放时间以当日公告为准，收费项目不默认包含。';
    const intro = longVisit ? 45 : 20;
    const finish = 20;
    const meal = longVisit ? 60 : 0;
    const transfer = longVisit ? 30 : 20;
    const core = seed.minutes - intro - finish - meal - transfer;
    const stops: ItineraryStop[] = [
      { title: `${seed.place}集合与确认`, minutes: intro, transferMinutes: 0, kind: 'visit', description: opening ? '按预约时段抵达，确认开放展区与返程出口，安检或等位较长时减少后续项目。' : food ? '先看两家营业门店菜单与等位，确认预算、份量和忌口。' : '确认开放步道与返程位置，按体力选择可完成的范围。' },
      { title: seed.title, minutes: longVisit ? Math.floor(core / 2) : core, transferMinutes: 10, kind: food ? 'meal' : 'visit', description: seed.action },
    ];
    if (longVisit) {
      stops.push({ title: '园内用餐与休息', minutes: meal, transferMinutes: 10, kind: 'meal', description: '通过园区官方导览选择正在营业的就近餐饮点，先看菜单价格和等位；餐厅未确认时请自行准备符合入园规定的补给。' });
      stops.push({ title: '继续体验已选项目', minutes: core - Math.floor(core / 2), transferMinutes: 10, kind: 'visit', description: '按当日等候与体力选择剩余项目，遇到停运或排队过久即缩减，不跨区赶其他景点。' });
    }
    stops.push({ title: '收尾与返程', minutes: finish, transferMinutes: longVisit ? 0 : 10, kind: 'rest', description: seed.finish });
    if (food && cityFoodOptions[id]) stops[1]!.meals = cityFoodOptions[id];
    stops.forEach((s) => { s.place = seed.place; s.navigationUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(city.name + ' ' + seed.place)}`; });
    const arrival = night ? '19:30' : /早餐|过早/.test(seed.title) ? '08:30' : /晚餐/.test(seed.title) ? '17:00' : food ? '11:00' : longVisit ? '09:30' : indoor || category === '探险猎奇' ? '10:00' : category === '约会' ? '15:00' : '14:00';
    const itinerary: PracticalItinerary = {
      arrival, arrivalNote: '参考抵达时刻，须按出行日期的预约、营业和实际交通调整；预计用时不含住处往返。',
      preparation: [...supplies, ...(opening ? ['预约凭证与购票所用有效身份证件'] : []), ...(food ? ['确认食物过敏、忌口和共同接受的口味'] : indoor ? [] : ['舒适步行鞋、按预报准备遮阳或雨具']), '相机与备用电池（可选）'],
      stops, reservation, source, checkedOn: '',
    };
    return {
      id, cityId: city.id, cityName: city.name, title: seed.title, summary: seed.action, description: seed.action + seed.finish,
      category, mood: night ? '放松' : moods[category]!, moodTags: [category, night ? '放松' : moods[category]!, '当天', ...(night ? ['夜间', '即刻出发'] : []), ...(indoor ? ['室内'] : []), ...(category === '探险猎奇' ? ['独自探索'] : []), ...(index === 3 ? ['朋友同行'] : [])], environment,
      minPartySize: category === '约会' || /朋友|组局/.test(seed.title) ? 2 : 1, maxPartySize: category === '约会' ? 2 : 6,
      durationMinutes: seed.minutes, budgetYuan: seed.budget, district: seed.district, address: seed.place,
      latitude: null, longitude: null, distanceKm: 0, navigationUrl: `https://uri.amap.com/search?keyword=${encodeURIComponent(city.name + ' ' + seed.place)}`,
      coverImageUri: photos[String(id)]?.uri || (seed.localImage ? '/media/travel/' + seed.localImage : null) || fallbackPhoto?.uri || (night ? '/media/city-plays/night-placeholder.svg' : null),
      coverCredit: photos[String(id)]?.author ? photos[String(id)] : fallbackPhoto?.author ? fallbackPhoto : night ? {author: '粗去玩鸭', kind: 'illustration', license: 'Original', licenseUrl: '', source: ''} : undefined,
      steps: stops.map((s) => s.title), tips: [reservation, seed.finish], sourceType: 'curated_itinerary', itinerary,
      placeKey: city.id + ':' + seed.place, experienceKey: category + ':' + city.id + ':' + seed.place,
      contentStatus: 'review', verificationNote: night ? '夜间公共区域参考玩法；出发前必须确认照明、天气、临时封闭和返程交通。' : '地点参考玩法；票价、营业、预约与现场条件需按出行日确认。', accentColor: '#C9FF62',
    };
  });
});

/** Multi-day local outings: one real place per day, with separate dates and no fabricated hotel/transfer. */
function compose(id: number, items: CityPlayActivity[], category: string, label: string): CityPlayActivity {
  const first = items[0]!;
  const daysCount = items.length;
  const names = items.map((a) => a.address);
  const stops = items.flatMap((a, index) => a.itinerary!.stops.map((s, i) => ({
    ...s, day: index + 1, arrival: a.itinerary!.arrival,
    title: i === 1 ? a.title : s.title,
    // Place photographs appear only on that day's main visit, never on a meal.
    image: i === 1 && s.kind === 'visit' && a.coverCredit?.kind !== 'illustration' ? a.coverImageUri ?? undefined : undefined,
  })));
  return {
    ...first, id, title: `${first.cityName}·${daysCount}天${category === '不限' ? '城市微旅行' : category}计划`,
    summary: names.map((name, i) => `第${i + 1}天 ${name}`).join('；') + '。每天一段独立体验，留出自由用餐和休息。',
    description: '本地分日出游安排，具体日期需自行确定；城市内各天独立出发，未包含住处往返、住宿与未列明正餐。',
    category, moodTags: [category, first.mood, label],
    minPartySize: Math.max(...items.map((a) => a.minPartySize)), maxPartySize: Math.min(...items.map((a) => a.maxPartySize)),
    durationMinutes: items.reduce((sum, a) => sum + a.durationMinutes, 0), budgetYuan: items.reduce((sum, a) => sum + a.budgetYuan, 0),
    address: first.address, steps: stops.map((s) => `第${s.day}天 · ${s.title}`),
    placeKeys: items.map((a) => a.placeKey), placeKey: items.map((a) => a.placeKey).join('|'), experienceKey: `${category}:${first.cityId}:${names.join('|')}`,
    itinerary: { ...first.itinerary!, daysCount, stops,
      arrivalNote: '每一天按对应地点的参考时段独立出发，须按实际出行日期核对开放；这是一组本地分日体验，不是含酒店、全餐及往返交通的旅行套餐。',
      preparation: [...new Set(items.flatMap((a) => a.itinerary!.preparation))],
      reservation: items.map((a, i) => `第${i + 1}天 ${a.address}：${a.itinerary!.reservation}`).join('\n'),
    },
  };
}
export const nationalMultiDayActivities: CityPlayActivity[] = cityPlaySeeds.flatMap((city) => {
  const singles = nationalSingleActivities.filter((a) => a.cityId === city.id && !a.moodTags.includes('夜间'));
  const result: CityPlayActivity[] = [];
  const groups = ['约会', '休闲躺平', '娱乐玩乐', '探险猎奇', '美食吃喝', '城市散步'];
  groups.forEach((category, index) => {
    const items = singles.filter((a) => a.category === category).sort((a, b) => a.budgetYuan - b.budgetYuan);
    if (items.length >= 2) result.push(compose(850000 + city.id * 100 + index, items.slice(0, 2), category, '周末游'));
  });
  // Four-day mixed outings are explicitly unclassified; a locked food category
  // must never receive a four-day collection padded with parks and museums.
  const mixed = ['休闲躺平', '探险猎奇', '美食吃喝', '城市散步'].map((category) => singles.find((a) => a.category === category)!);
  result.push(compose(850000 + city.id * 100 + 10, mixed, '不限', '小长假'));
  return result;
});
// Night-time editorial variants retain the actual place and its matching image.
// Source confirms the night-life district, not live business availability.
const beijingNightSource = 'https://www.beijing.gov.cn/ywdt/gzdt/202408/t20240827_3783414.html';
export const beijingEveningActivities: CityPlayActivity[] = [
  {base: 820105, id: 860101, title: '簋街一顿不赶场的夜宵', category: '美食吃喝', minutes: 90, budget: 180},
  {base: 820100, id: 860102, title: '亮马河双人夜色约会', category: '约会', minutes: 90, budget: 60},
].map((entry) => {
  const base = nationalSingleActivities.find((activity) => activity.id === entry.base)!;
  const stops: ItineraryStop[] = ([
    {title: `${base.address}集合与开放确认`, minutes: 15, transferMinutes: 0, kind: 'visit', description: '先核对实际导航耗时、入口开放及返程方式；商户等位或道路封闭时停止本方案。'},
    {title: entry.title, minutes: 50, transferMinutes: 10, kind: entry.category === '美食吃喝' ? 'meal' : 'visit', description: base.summary, ...(entry.category === '美食吃喝' ? {meals: base.itinerary?.stops[1]?.meals} : {})},
    {title: '收尾与返程', minutes: 10, transferMinutes: 5, kind: 'rest', description: '确认返程交通，按实际消费结账，不临时追加跨区行程。'},
  ] satisfies ItineraryStop[]).map((stop) => ({...stop, place: base.address, navigationUrl: base.navigationUrl ?? undefined}));
  return {...base, id: entry.id, title: entry.title, category: entry.category, durationMinutes: entry.minutes, budgetYuan: entry.budget,
    minPartySize: entry.category === '约会' ? 2 : 1, maxPartySize: entry.category === '约会' ? 2 : 6,
    moodTags: [entry.category, base.mood, '当天', '夜间'], experienceKey: `${base.placeKey}:night:${entry.category}`,
    steps: stops.map((stop) => stop.title), itinerary: {...base.itinerary!, arrival: '19:30', stops, source: beijingNightSource,
      reservation: '夜间街区参考方案；请先确认所选商户或公共区域当晚开放，预算为估算。',
      arrivalNote: '预留交通后安排；超过参考时间缓冲请重新选择附近地点。'},
    verificationNote: '官方夜经济指南支持街区夜间属性；具体门店营业、交通和价格仍需当日核验。'};
});
const shichahaiNight: CityPlayActivity = {
  ...nationalSingleActivities.find((activity) => activity.id === 820113)!,
  id:860103,title:'什刹海灯影与湖畔短走',address:'什刹海',district:'西城区',
  placeKey:'1:什刹海',experienceKey:'1:什刹海:night',
  coverImageUri:'/media/travel/beijing-shichahai.jpg',coverCredit:undefined,
  summary:'沿开放公共湖岸走一段短线，看灯影、聊天，避开无照明支路；不含游船和酒吧消费。',
  steps:['什刹海集合与确认','沿开放湖岸看灯影','收尾与返程'],
  itinerary:{...nationalSingleActivities.find((activity) => activity.id === 820113)!.itinerary!,
    source:beijingNightSource,
    stops:[
      {title:'什刹海集合与确认',minutes:15,transferMinutes:0,kind:'visit',place:'什刹海',description:'确认公共区域开放、照明及返程方式。'},
      {title:'沿开放湖岸看灯影',minutes:50,transferMinutes:10,kind:'visit',place:'什刹海',description:'沿照明良好的公共步道短走，不进入酒吧、私人院落或封闭水域。'},
      {title:'收尾与返程',minutes:10,transferMinutes:5,kind:'rest',place:'什刹海',description:'确认地铁末班或其他返程方式，结束后不追加跨区活动。'},
    ]},
};
export const nationalPlayActivities = [...nationalSingleActivities, ...nationalMultiDayActivities, ...beijingEveningActivities, shichahaiNight];
