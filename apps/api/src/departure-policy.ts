import type { PracticalItinerary } from './itinerary-policy.js';
export type DepartureMode = 'idea' | 'now' | 'plan';
export type DeparturePreferences = { departureMode?: DepartureMode; departureDate?: string | null };
export function chinaDate(now = new Date()) { return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10); }
export function chinaMinutes(now = new Date()) { const date = new Date(now.getTime() + 8 * 3600000); return date.getUTCHours() * 60 + date.getUTCMinutes(); }
export function addDays(date: string, days: number) { return new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10); }
export function nextWeekend(now = new Date()) { const today = chinaDate(now); const weekday = new Date(today + 'T00:00:00Z').getUTCDay(); return addDays(today, (6 - weekday + 7) % 7); }
export function validDepartureDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value && value >= chinaDate(now) && value <= addDays(chinaDate(now), 365);
}
type Schedulable = { title: string; durationMinutes: number; steps: string[]; openingHours?: unknown; moodTags?: string[]; itinerary?: PracticalItinerary; reservationRequired?: string; plannedDate?: string | null; plannedArrival?: string };
function openingWindows(activity: Schedulable): [number,number][] {
  try {
    const value = typeof activity.openingHours === 'string' ? JSON.parse(activity.openingHours) : activity.openingHours;
    const windows = (value as {windows?:unknown})?.windows;
    return Array.isArray(windows) ? windows.filter((entry): entry is [number,number] => Array.isArray(entry) && entry.length === 2 && entry.every(Number.isFinite) && entry[0] >= 0 && entry[1] > entry[0] && entry[1] <= 2880) : [];
  } catch { return []; }
}
function fitsOpening(activity: Schedulable, start: number) {
  const windows = openingWindows(activity);
  if (!windows.length) return true;
  return windows.flatMap(([from,to]) => to > 1440 ? [[from,to], [from-1440,to-1440]] : [[from,to]])
    .some(([from,to]) => start >= from! && start + activity.durationMinutes <= to!);
}
function isNightActivity(activity: Schedulable) {
  return activity.moodTags?.includes('夜间') === true;
}
function immediateStart(activity: Schedulable, now: Date) {
  const leadMinutes = isNightActivity(activity) ? 30 : 60;
  return Math.ceil((chinaMinutes(now) + leadMinutes) / 15) * 15;
}
export function departureFailure(activity: Schedulable, preferences: DeparturePreferences, now = new Date()): string | null {
  if (preferences.departureMode === 'plan' && !validDepartureDate(preferences.departureDate ?? '', now)) return '请选择今天起一年内的有效出发日期';
  if (preferences.departureMode === 'plan' && activity.itinerary && (activity.itinerary.daysCount ?? 1) === 1) {
    const [hour, minute] = activity.itinerary.arrival.split(':').map(Number);
    if (!fitsOpening(activity, hour! * 60 + minute!)) return '参考游玩时段超出地点开放时间，请选择其他时段或玩法。';
  }
  if (preferences.departureMode === 'plan' && preferences.departureDate === chinaDate(now) && activity.itinerary) {
    const [h, m] = activity.itinerary.arrival.split(':').map(Number);
    if ((h ?? 0) * 60 + (m ?? 0) < chinaMinutes(now) + 30) return '今天的参考抵达时刻已过，请另选日期或用现在出发重新匹配';
  }
  if (preferences.departureMode !== 'now') return null;
  if ((activity.itinerary?.daysCount ?? 1) > 1) return '多日计划需要先安排出发日期';
  const night = isNightActivity(activity);
  const start = immediateStart(activity, now);
  const windows = openingWindows(activity);
  if (windows.length) {
    if (!fitsOpening(activity, start)) return '抵达及游玩时间不在已核验的开放时段内，请调整日期或选择其他活动。';
  }
  if (!windows.length && night && chinaMinutes(now) < 6 * 60) return '当前已进入凌晨，这条路线的夜间参考时段已结束，请另选营业中的活动或安排今晚。';
  if (!windows.length && night && chinaMinutes(now) < 17 * 60) return '夜间玩法将在傍晚后开放立即出发';
  const latestEnd = night ? 24 * 60 + 30 : 20 * 60 + 30;
  if ((!night || !windows.length) && start + activity.durationMinutes > latestEnd) return night ? '现在出发会结束太晚，请收藏或另约日期' : '今天剩余时间不足，请收藏或另约日期';
  const text = activity.title + activity.steps.join(' ') + (activity.itinerary?.reservation ?? '');
  if (/早餐|过早/.test(text) && start > 10 * 60) return '已过早餐时段';
  if (/午餐/.test(text) && start > 13 * 60) return '已过午餐出发时段';
  if (/晚餐/.test(text) && start < 16 * 60) return '尚未到晚餐时段';
  return null;
}
export function departureAdvisory(activity: Schedulable, preferences: DeparturePreferences): string | null {
  if (preferences.departureMode !== 'now') return null;
  const text = activity.title + activity.steps.join(' ') + (activity.itinerary?.reservation ?? '');
  if (activity.reservationRequired === 'yes' || /预约|实名|票种|有效门票|购票|门票/.test(text)) {
    return '这条玩法可能需要购票、预约或实名核验。系统不知道你是否已有票；你可以继续出发，但请先在官方渠道确认当日余票、入园要求和现场售票情况。';
  }
  return null;
}
export function withDeparture<T extends Schedulable>(activity: T, preferences: DeparturePreferences, now = new Date()) {
  const mode = preferences.departureMode ?? 'idea';
  const night = isNightActivity(activity);
  const start = immediateStart(activity, now);
  const arrival = mode === 'now' ? `${String(Math.floor(start / 60) % 24).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}` : activity.itinerary?.arrival;
  return { ...activity, plannedDate: mode === 'idea' ? null : mode === 'now' ? addDays(chinaDate(now), Math.floor(start / 1440)) : preferences.departureDate ?? null, plannedArrival: arrival,
    itinerary: activity.itinerary ? { ...activity.itinerary, arrival: arrival ?? activity.itinerary.arrival, arrivalNote: mode === 'now' ? `按当前时间预留约${night ? 30 : 60}分钟准备和交通后安排；实际耗时以导航为准，出发前仍需确认开放。` : activity.itinerary.arrivalNote } : undefined };
}

export function calendarText(input: { id: number; title: string; date: string; days?: number; address: string; description?: string }) {
  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chuquwanya//Trip//ZH', 'BEGIN:VEVENT', `UID:trip-${input.id}@chuquwanya.local`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART;VALUE=DATE:${input.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(input.date, input.days ?? 1).replace(/-/g, '')}`, `SUMMARY:${escape(input.title)}`, `LOCATION:${escape(input.address)}`, `DESCRIPTION:${escape(input.description ?? '')}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}
