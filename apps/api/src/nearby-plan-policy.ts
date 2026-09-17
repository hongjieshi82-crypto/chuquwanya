import { z } from 'zod';
import type { NearbyLivePlace } from './nearby-live-places.js';
import type { CityWeather } from './weather.service.js';

export const nearbyPlanInputSchema = z.object({
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  coordinateSystem: z.enum(['wgs84', 'gcj02']).default('wgs84'),
  locationTimestamp: z.number().int().positive(), accuracyMeters: z.number().min(0).max(1_000),
  availableMinutes: z.union([z.literal(60), z.literal(120), z.literal(180)]).default(120),
  maxWalkMinutes: z.union([z.literal(10), z.literal(20), z.literal(30)]).default(20),
  budgetPerPersonYuan: z.number().int().min(0).max(2_000), partySize: z.number().int().min(1).max(8).default(2),
  mood: z.enum(['放松', '探索', '热闹']).default('放松'),
  kind: z.enum(['any', 'games', 'walk', 'food', 'culture']).default('any'),
  allowUnverified: z.boolean().default(false),
  excludePoiIds: z.array(z.string().max(80)).max(100).default([]),
});
export type NearbyPlanInput = z.infer<typeof nearbyPlanInputSchema>;

export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const r = Math.PI / 180;
  const x = Math.sin((b.latitude - a.latitude) * r / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin((b.longitude - a.longitude) * r / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(x)));
}

export type PlayKind = 'games' | 'walk' | 'food' | 'culture';
export const explicitlyClosedToday = (raw: string | null | undefined) => /^(?:今天|今日|全天)?\s*(?:休息|闭馆|停业|不开放|暂停营业)(?:中)?[。！!]?\s*$/.test(raw?.trim() || '');
export function classifyPlace(place: NearbyLivePlace): { kind: PlayKind; indoor: boolean; minimumMinutes: number } | null {
  const type = place.type;
  if (/宾馆|酒店|住宿|学校|培训|公司|住宅|售票|停车场|出入口|售楼/.test(type + place.name)) return null;
  if (/棋牌|麻将|桌游|台球|保龄球|密室|电玩|剧本杀/.test(type + place.name)) return { kind: 'games', indoor: !/室外|露天/.test(type + place.name), minimumMinutes: /密室|剧本杀/.test(type + place.name) ? 90 : 60 };
  if (/餐饮|咖啡|茶艺|茶馆/.test(type)) return { kind: 'food', indoor: !/露天|夜市/.test(type + place.name), minimumMinutes: 30 };
  if (/博物馆|美术馆|展览馆|科技馆/.test(type + place.name)) return { kind: 'culture', indoor: true, minimumMinutes: 45 };
  if (/风景名胜|公园|广场|步行街/.test(type)) return { kind: 'walk', indoor: false, minimumMinutes: 30 };
  return null;
}

/** Only parse explicit time ranges for today. Weekly prose/seasonal exceptions stay unknown. */
export function openingCoverage(raw: string | null | undefined, start: Date, end: Date, checkedAt: Date): 'covered' | 'closed' | 'unknown' {
  if (!raw?.trim()) return 'unknown';
  if (explicitlyClosedToday(raw)) return 'closed';
  if (/^(24小时(?:营业)?|全天(?:开放|营业)?)$/.test(raw.trim())) return 'covered';
  if (!/^\s*\d{1,2}:\d{2}\s*[-~～—至]\s*\d{1,2}:\d{2}(?:\s*[,，;；、]\s*\d{1,2}:\d{2}\s*[-~～—至]\s*\d{1,2}:\d{2})*\s*$/.test(raw)) return 'unknown';
  const chinaDay = Math.floor((checkedAt.getTime() + 8 * 3600_000) / 86400_000) * 86400_000 - 8 * 3600_000;
  const startMinute = (start.getTime() - chinaDay) / 60_000;
  const endMinute = (end.getTime() - chinaDay) / 60_000;
  const windows: Array<[number, number]> = [];
  for (const range of raw.matchAll(/(\d{1,2}):(\d{2})\s*[-~～—至]\s*(\d{1,2}):(\d{2})/g)) {
    const hours = [Number(range[1]), Number(range[3])], minutes = [Number(range[2]), Number(range[4])];
    if (hours.some(h => h > 24) || minutes.some(m => m > 59) || hours.some((h, i) => h === 24 && minutes[i] !== 0)) return 'unknown';
    const a = hours[0]! * 60 + minutes[0]!;
    let b = hours[1]! * 60 + minutes[1]!;
    if (a === b) return 'unknown';
    if (b < a) b += 1440;
    windows.push([a, b]);
  }
  if (windows.some(([a, b]) => startMinute >= a && endMinute <= b)) return 'covered';
  if (startMinute >= 1440 || windows.some(([, b]) => b > 1440 && startMinute < b - 1440)) return 'unknown';
  return 'closed';
}

export function freshWeather(weather: CityWeather | null, now: Date) {
  if (!weather) return null;
  const dateText = weather.observedAt.trim();
  const timestamp = Date.parse(/Z$|[+-]\d{2}:?\d{2}$/.test(dateText) ? dateText : dateText.replace(' ', 'T') + '+08:00');
  return Number.isFinite(timestamp) && now.getTime() - timestamp >= -300_000 && now.getTime() - timestamp <= 2 * 3600_000 ? weather : null;
}

export function isWeatherSuitable(weather: CityWeather | null, indoor: boolean) {
  if (!weather) return null;
  if (/雷|暴雨|暴雪|台风|沙尘暴/.test(weather.condition)) return false;
  return indoor || !weather.risks.some(risk => risk !== 'normal');
}

export const aiPlanChoiceSchema = z.object({
  candidateId: z.string().max(80), stayMinutes: z.number().int().min(30).max(120),
  playIdeas: z.array(z.string().min(4).max(100)).min(2).max(3),
}).strict();
export type AiPlanChoice = z.infer<typeof aiPlanChoiceSchema>;
export function parseAiPlanChoice(text: string): AiPlanChoice | null {
  try {
    const raw = JSON.parse(text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''));
    const choice = aiPlanChoiceSchema.parse(raw);
    // Model may suggest actions; all factual claims/numbers/URLs remain server-owned.
    if (choice.playIdeas.some(idea => /\d|https?:|免费|免预约|无需预约|营业|开放时间|门票|票价|元|价格|保证|已核实|一定有/.test(idea))) return null;
    return choice;
  } catch { return null; }
}
