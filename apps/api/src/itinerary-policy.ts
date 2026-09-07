/** Shared by the API and the local preview. No network or framework imports. */
import { nationalPlayActivities } from './city-play-catalog.js';
import { verifiedMetadata } from './beijing-verified.js';
export type MealOption = { name: string; area: string; note: string; source: string };
export type ItineraryStop = { title: string; minutes: number; transferMinutes: number; description: string; kind: 'visit' | 'meal' | 'rest'; meals?: MealOption[]; image?: string; day?: number; arrival?: string; place?: string; navigationUrl?: string };
export type PracticalItinerary = { arrival: string; arrivalNote: string; preparation: string[]; stops: ItineraryStop[]; reservation: string; source: string; checkedOn: string; weatherContingency?: string; daysCount?: number };
export type PlanActivity = {
  id: number; cityId: number; cityName: string; title: string; summary: string; description: string;
  category: string; mood: string; moodTags: string[]; environment: 'indoor' | 'outdoor' | 'either';
  minPartySize: number; maxPartySize: number; durationMinutes: number; budgetYuan: number;
  district: string; address: string; latitude: number | null; longitude: number | null;
  distanceKm: number; navigationUrl: string | null; coverImageUri: string | null;
  steps: string[]; tips: string[]; sourceType: string; itinerary?: PracticalItinerary; accentColor: string;
};
const phoneKit = ['充满电的手机', '充电宝和匹配的充电线', '饮用水、纸巾', '个人常用药（按需）'];
const outdoorKit = [...phoneKit, '舒适步行鞋、遮阳帽', '雨具（按出行日预报准备）', '相机、备用电池（可选）'];
const universal = 'https://www.universalbeijingresort.com/zh_CN/ubrbasepage/ruyuanxuzhi';
const foodSource = 'https://www.visitbeijing.com.cn/article/4IHsWFfnARG';
const universalMeals: MealOption[] = [
  { name: '三把扫帚', area: '哈利·波特的魔法世界', note: '英式餐点；按当时所在园区和排队情况选择，不为吃饭往返穿园。', source: 'https://www.universalbeijingresort.com/zh_CN/restaurant/sanbasaozhoutm' },
  { name: '熊猫婆婆私房菜', area: '功夫熊猫盖世之地', note: '中式餐点备选；营业和菜单以当天官方 App 为准。', source: 'https://www.universalbeijingresort.com/zh_CN/restaurant/xiongmaopoposifangcai' },
];
const niujieMeals: MealOption[] = [
  { name: '聚宝源（牛街）', area: '牛街街区', note: '涮肉正餐备选；先确认门店及等位，不把排队时间算作零。', source: foodSource },
  { name: '洪记小吃（牛街）', area: '牛街街区', note: '小吃备选，可替换正餐；按食量购买，确认食材和过敏原。', source: foodSource },
  { name: '白记年糕（牛街）', area: '牛街街区', note: '糕点外带备选，不必三家都吃；门店信息出发前再确认。', source: foodSource },
];
function stop(title: string, minutes: number, description: string, transferMinutes = 0, kind: ItineraryStop['kind'] = 'visit'): ItineraryStop {
  return { title, minutes, description, transferMinutes, kind };
}
type Seed = { id: number; place: string; title: string; category: string; categories?: string[]; mood: string; district: string; budget: number; image: string; summary: string; itinerary: PracticalItinerary };
const seeds: Seed[] = [
  { id: 810001, place: '北京环球度假区', title: '北京环球影城完整一日游', category: '娱乐玩乐', mood: '热闹', district: '通州区', budget: 800, image: 'beijing-universal-studios.jpg', summary: '一天留在环球园内，按实时等候选择项目，午餐也在园内解决，不串联牛街或故宫。', itinerary: {
    arrival: '09:30', arrivalNote: '完整日参考安排，须按所选日期开园时间平移。下午才到请另选日期或半日玩法，不保证玩遍项目。', preparation: ['购票使用的有效身份证件原件', '有效门票及适用的入园预约记录', ...outdoorKit], source: universal, checkedOn: '2026-09-06', reservation: '提前确认指定日期门票和预约要求；票价、开园时间、项目限制及等候时间以官方 App 为准。参考预算含门票、园内餐饮和市内交通，不含优速通。', weatherContingency: '若出行日有强降雨或大风，先查看园区项目停运公告；不要以室内备选保证全天项目开放。', stops: [
      stop('安检、入园与确认项目', 45, '完成入园核验，查看官方 App 的等候时间；先选两到三个最想体验的项目。'),
      stop('上午核心项目', 120, '集中游玩相邻主题区，时间包含排队；单项目等候过长时减少数量。', 15),
      { ...stop('园内午餐', 60, '从下面餐厅中就近选一家；等位较长时换另一家，午餐不出园。', 15, 'meal'), meals: universalMeals },
      stop('下午项目与演出', 180, '在园内继续体验，演出以当天场次为准；预留步行、排队和补水时间。', 15),
      stop('休息与返程准备', 45, '根据体力结束游玩，检查随身物品并查看返程交通。若自愿留到晚间，另留晚餐和返程时间。', 15, 'rest'),
    ],
  } },
  { id: 810002, place: '北海公园', title: '北海公园湖畔慢游', category: '休闲躺平', categories: ['城市散步'], mood: '放松', district: '西城区', budget: 60, image: 'beijing-beihai-park.jpg', summary: '只在北海公园内慢走与休息，预留两小时，不再附带故宫或跨区景点。', itinerary: {
    arrival: '14:00', arrivalNote: '参考下午场；先确认出行日开放、售票和停止入园时间。', preparation: outdoorKit, reservation: '门票和园内单独收费项目以官方售票信息为准；预算不含游船与正餐。', source: 'https://www.beihaipark.com.cn/', checkedOn: '', stops: [stop('入园与湖畔步行', 45, '从所选入口入园，沿开放的湖岸步道散步；不强制登高。'), stop('湖边休息', 30, '找开放的休息区补水；游船不作为默认项目。', 10, 'rest'), stop('沿原路或就近出口离园', 25, '根据体力慢走，出园后再安排正餐。', 10)],
  } },
  { id: 810003, place: '什刹海', title: '什刹海双人湖畔约会', category: '约会', categories: ['城市散步'], mood: '放松', district: '西城区', budget: 80, image: 'beijing-shichahai.jpg', summary: '两个人在同一湖区慢走、聊天和拍照，路线约两小时，不默认包含船票或餐厅预订。', itinerary: {
    arrival: '15:30', arrivalNote: '参考下午安排；不承诺固定日落时刻。', preparation: outdoorKit, reservation: '公共步道安排；若增加游船或商户消费，请单独核对开放及价格。', source: '', checkedOn: '', stops: [stop('前海湖畔集合', 35, '先确认双方到达位置，沿公共步道慢走。'), stop('银锭桥附近停留', 35, '在开放的公共区域聊天、拍照，不阻塞通道。', 15, 'rest'), stop('回到方便返程的位置', 25, '按双方体力结束，晚餐另行选择，不挤进跨区景点。', 10)],
  } },
  { id: 810004, place: '牛街', title: '牛街小吃与涮肉半日路线', category: '美食吃喝', mood: '热闹', district: '西城区', budget: 180, image: 'beijing-niujie.jpg', summary: '围绕牛街安排一顿正餐和少量小吃，提供具体门店备选，留足排队时间。', itinerary: {
    arrival: '11:00', arrivalNote: '这是一条午餐时段的参考路线，建议在计划出行日的午前抵达；请为排队留出余量。', preparation: [...phoneKit, '确认同行人的食物过敏与饮食禁忌', '小包装湿巾、外带袋'], reservation: '备选店并非已预约；出发前通过地图核对门店、营业状态和等位情况。预算为估算，以菜单实际价格为准。', source: foodSource, checkedOn: '2026-09-06', stops: [stop('牛街集合与确认等位', 30, '先看正餐门店等位情况，超过可接受时间即换小吃方案。'), { ...stop('午餐：选择一家正餐或小吃店', 75, '以下是备选关系，不要求逐家用餐；排队时间不够就缩减后续项目。', 10, 'meal'), meals: niujieMeals }, stop('少量糕点外带与返程', 35, '吃饱后在同一街区取少量外带，按需结束。', 10, 'rest')],
  } },
  { id: 810005, place: '首钢园', title: '首钢园工业遗迹观察路线', category: '探险猎奇', mood: '探索', district: '石景山区', budget: 80, image: 'beijing-shougang.jpg', summary: '在首钢园开放公共区域观察工业建筑，只安排园内步行，不进入未开放设施。', itinerary: {
    arrival: '13:30', arrivalNote: '参考下午场，预留日间步行时间。', preparation: outdoorKit, reservation: '园内展馆、登高和活动可能单独收费或预约，本路线仅覆盖开放公共区域。', source: '', checkedOn: '', stops: [stop('园区入口与导览确认', 30, '根据现场导览确认当日开放步道和出口。'), stop('工业建筑外部观察', 75, '选择同一片区的开放路线观察高炉建筑外观，不翻越围挡。', 20), stop('公共休息区补水、返程', 35, '补水后回到合适出口，未确认开放的节点直接跳过。', 20, 'rest')],
  } },
  { id: 810006, place: '砖塔胡同', title: '砖塔胡同与西四街巷散步', category: '城市散步', mood: '放松', district: '西城区', budget: 50, image: 'beijing-zhuanta-hutong.jpg', summary: '沿砖塔胡同公共街巷走一段短路线，观察建筑，停留后就近返程。', itinerary: {
    arrival: '14:00', arrivalNote: '日间参考安排，不依赖特定店铺营业。', preparation: outdoorKit, reservation: '不包含收费展馆或店铺消费；不要进入私人院落。', source: '', checkedOn: '', stops: [stop('西四一带集合', 20, '确认砖塔胡同入口，在公共街道集合。'), stop('沿砖塔胡同慢走', 45, '观察建筑与街巷；书店只作开放时的可选停留。', 10), stop('休息与原路返程', 35, '在开放公共区域短休，回到便于乘车的位置。', 10, 'rest')],
  } },
  { id: 810007, place: '故宫博物院', title: '故宫中轴线半日参观', category: '风景人文', mood: '探索', district: '东城区', budget: 120, image: 'beijing-forbidden-city.jpg', summary: '预约后留出半天参观故宫，从午门进入、按开放路线离院，当天不再拼接环球。', itinerary: {
    arrival: '08:30', arrivalNote: '参考上午场，必须服从实际预约时段；周一通常闭馆，节假日及公告例外。', preparation: ['预约使用的有效身份证件', '已确认的故宫预约记录', ...outdoorKit], reservation: '须实名预约，从午门检票。预约、开放及特展要求查看官方信息；不是可随到随进的项目。', source: 'https://ticket.dpm.org.cn/', checkedOn: '2026-09-06', stops: [stop('午门安检与检票', 45, '按预约时段抵达，留出安检时间。'), stop('中轴线参观', 120, '按现场开放路线参观，不把排队和步行忽略。', 15), stop('休息与离院', 45, '体力允许再看开放的支线，按指示离院，出院后午餐另行安排。', 15, 'rest')],
  } },
];
export const beijingPracticalActivities: PlanActivity[] = seeds.map((s) => ({
  id: s.id, cityId: 1, cityName: '北京', title: s.title, summary: s.summary, description: s.summary,
  category: s.category, mood: s.mood, moodTags: [s.category, ...(s.categories ?? []), s.mood, '当天'],
  environment: 'outdoor', minPartySize: s.category === '约会' ? 2 : 1, maxPartySize: s.category === '约会' ? 2 : 6,
  durationMinutes: s.itinerary.stops.reduce((n, stop) => n + stop.minutes + stop.transferMinutes, 0),
  budgetYuan: s.budget, district: s.district, address: s.place, latitude: null, longitude: null,
  distanceKm: 0, navigationUrl: `https://uri.amap.com/search?keyword=${encodeURIComponent('北京 ' + s.place)}`,
  coverImageUri: `/media/travel/${s.image}`, steps: s.itinerary.stops.map((stop) => stop.title),
  tips: [s.itinerary.reservation], sourceType: 'curated_itinerary', itinerary: s.itinerary, accentColor: '#C9FF62',
}));

export function practicalReplacement(activity: { id: number; cityName: string; title: string; address: string }) {
  const exact = [...beijingPracticalActivities, ...nationalPlayActivities].find((p) => p.id === activity.id);
  if (exact) return {...exact, ...verifiedMetadata(exact.id)};
  if (activity.cityName !== '北京' || !/·(?:一日|周末|假期)/.test(activity.title)) return null;
  // Only repair by the primary place, never by incidental stops in a summary.
  const place = activity.title.split('·')[0];
  return beijingPracticalActivities.find((p) => p.address === place || (place === '环球度假区' && p.id === 810001)) ?? null;
}
export const cityRouteCategories: Record<number, string[]> = {
  1001: ['休闲躺平', '城市散步'], 1020: ['城市散步'], 1021: ['探险猎奇'], 1022: ['城市散步'],
  1002: ['城市散步'], 1003: ['休闲躺平', '城市散步'], 1004: ['休闲躺平', '城市散步'],
  1005: ['城市散步'], 1006: ['休闲躺平', '城市散步'], 1007: ['城市散步'],
  1008: ['休闲躺平', '城市散步'], 1009: ['城市散步'], 1010: ['休闲躺平'],
  1011: ['休闲躺平'], 1012: ['城市散步'], 1013: ['城市散步'], 1014: ['城市散步'],
  1015: ['休闲躺平', '城市散步'], 1016: ['城市散步'], 1017: ['休闲躺平', '城市散步'],
  1018: ['城市散步'], 1019: ['休闲躺平', '城市散步'],
};
export const playCategories = ['约会', '休闲躺平', '娱乐玩乐', '探险猎奇', '美食吃喝', '城市散步'];
export function matchesPlayCategory(category: string, item: { category: string; moodTags: string[] }) {
  const normalized = category === '浪漫约会' ? '约会' : category;
  return normalized === '不限' || item.category === normalized || item.moodTags.includes(normalized);
}
export function requestedTravelDays(p: { travelDuration?: string | null; travelDurationLabel?: string | null }) {
  const labels: Record<string, string> = { 'same-day': '当天', '2-3days': '周末游', '4-5days': '小长假' };
  return p.travelDurationLabel ?? labels[p.travelDuration ?? ''];
}
export function hardBudgetMinimum(p: { budgetMin?: number | null; budgetLabel?: string | null }) {
  return ['划算出行', '舒服躺玩', '品质享受'].includes(p.budgetLabel ?? '') ? 0 : p.budgetMin ?? 0;
}
export function preferenceFailure(p: { category: string; partySize: number; budgetMin?: number | null; budgetMax: number | null; budgetLabel?: string | null; durationMinutes: number | null; travelDuration?: string | null; travelDurationLabel?: string | null; environment: string; radiusKm: number | null }, a: Pick<PlanActivity, 'category' | 'moodTags' | 'minPartySize' | 'maxPartySize' | 'budgetYuan' | 'durationMinutes' | 'environment' | 'latitude' | 'longitude' | 'sourceType'>) {
  if (a.sourceType === 'itinerary_workbook') return '原批量路线尚未完成内容核验';
  if (!matchesPlayCategory(p.category, a)) return '玩法分类不匹配';
  if (p.partySize < a.minPartySize || p.partySize > a.maxPartySize) return '人数不匹配';
  if (a.budgetYuan < hardBudgetMinimum(p) || (p.budgetMax !== null && a.budgetYuan > p.budgetMax)) return '预算不匹配';
  if (p.durationMinutes !== null && a.durationMinutes > p.durationMinutes) return '可用时间不足';
  const days = requestedTravelDays(p);
  if (days && !a.moodTags.includes(days)) return '出游天数不匹配';
  if (p.environment !== 'either' && a.environment !== 'either' && p.environment !== a.environment) return '环境不匹配';
  if (p.radiusKm !== null && (a.latitude === null || a.longitude === null)) return '距离尚未核验';
  return null;
}

export function timelineRows(plan: PracticalItinerary) {
  const [hours, minutes] = plan.arrival.split(':').map(Number);
  let cursor = (hours ?? 0) * 60 + (minutes ?? 0);
  let currentDay = 1;
  const clock = (v: number) => `${v >= 1440 ? '次日 ' : ''}${String(Math.floor(v / 60) % 24).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
  return plan.stops.map((stop) => {
    if ((stop.day ?? 1) !== currentDay) {
      currentDay = stop.day ?? 1;
      const [h, m] = (stop.arrival ?? plan.arrival).split(':').map(Number);
      cursor = (h ?? 0) * 60 + (m ?? 0);
    }
    cursor += stop.transferMinutes;
    const time = clock(cursor); cursor += stop.minutes;
    return { ...stop, time, endTime: clock(cursor) };
  });
}

export function practicalPreparation(environment: string) { return environment === 'indoor' ? phoneKit : outdoorKit; }
export const practicalActivities = [...beijingPracticalActivities, ...nationalPlayActivities].map((activity) => ({...activity, ...verifiedMetadata(activity.id)}));
