import { Platform } from 'react-native';

import { getAuthToken } from '@/lib/auth-storage';
import { isLocalDemoMode, resolveApiMediaUrl } from '@/services/api';
import {
  demoAttractions,
  demoActivities,
  demoDestinationProfiles,
  demoDestinations,
  demoTravelTags,
} from '@/services/demo-data';
import type {
  AiRecommendParams,
  Attraction,
  Destination,
  DestinationDetail,
  RecommendResponse,
  SemanticSearchHit,
  TravelTag,
  TripGenerateParams,
  ComposedTrip,
} from '@/types/travel';

const platformDefault = Platform.select({
  android: 'http://10.0.2.2:3001/api/v1',
  default: 'http://localhost:3001/api/v1',
});

const API_URL = process.env.EXPO_PUBLIC_API_URL || platformDefault;

class TravelConnectionError extends Error {
  constructor() {
    super('无法连接服务器，请稍后重试');
  }
}

async function withTravelDemoFallback<T>(
  request: () => Promise<T>,
  fallback: () => T | Promise<T>,
) {
  if (isLocalDemoMode()) return await fallback();

  try {
    return await request();
  } catch (reason) {
    if (!(reason instanceof TravelConnectionError)) throw reason;
    return await fallback();
  }
}

async function travelRequest<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new TravelConnectionError();
  }

  const body = (await response.json().catch(() => ({}))) as { data?: T; error?: { message?: string } };

  if (!response.ok) {
    throw new Error(body.error?.message ?? '请求失败');
  }

  return body.data as T;
}

function normalizeDestination(item: Destination): Destination {
  return {
    ...item,
    coverImageUri: resolveApiMediaUrl(item.coverImageUri),
  };
}

function normalizeAttraction(item: Attraction): Attraction {
  return {
    ...item,
    coverImageUri: resolveApiMediaUrl(item.coverImageUri),
  };
}

function normalizeRecommendResponse(response: RecommendResponse): RecommendResponse {
  return {
    ...response,
    recommendations: response.recommendations.map((item) => ({
      ...item,
      coverImageUri: resolveApiMediaUrl(item.coverImageUri),
    })),
  };
}

export async function getTravelTags() {
  return await withTravelDemoFallback(
    () => travelRequest<TravelTag[]>('/travel/tags', undefined, false),
    () => demoTravelTags,
  );
}

export async function getDestinations(hot?: boolean) {
  const q = hot ? '?hot=true' : '';
  const destinations = await withTravelDemoFallback(
    () => travelRequest<Destination[]>(`/destinations${q}`, undefined, false),
    () => hot ? demoDestinations.filter((item) => item.isHot) : demoDestinations,
  );
  return destinations.map(normalizeDestination);
}

function splitDetailValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  return value
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getDestinationDetail(id: number): Promise<DestinationDetail> {
  const item = await withTravelDemoFallback(
    () => travelRequest<Record<string, unknown>>(`/destinations/${id}`, undefined, false),
    () => {
      const destination = demoDestinations.find((candidate) => candidate.id === id) ?? demoDestinations[0];
      const profile = demoDestinationProfiles[destination.name];
      return {
        ...destination,
        description: destination.summary,
        city: destination.name,
        category: profile?.category ?? '城市探索',
        type: '周末目的地',
        tags: profile?.tags ?? ['真实地点', '周末可玩', '轻松出发'],
        suitableDays: '当天 / 1-2 天',
        bestSeason: profile?.bestSeason ?? '四季皆宜',
        tips: ['优先选择天气舒适的时段', '出发前确认场地开放信息'],
        difficulty: profile?.difficulty ?? 2,
        relaxation: profile?.relaxation ?? 5,
      };
    },
  );
  const rawCityId = item.cityId ?? item.city_id;
  const rawHot = item.isHot ?? item.is_hot;
  const coverImageUri =
    (item.coverImageUri ?? item.cover_image ?? item.cover ?? item.image) as string | null | undefined;

  return {
    id: Number(item.id ?? id),
    cityId:
      rawCityId === null || rawCityId === undefined || !Number.isFinite(Number(rawCityId))
        ? null
        : Number(rawCityId),
    name: String(item.name ?? ''),
    province: typeof item.province === 'string' ? item.province : null,
    summary: String(item.summary ?? item.description ?? ''),
    coverImageUri: resolveApiMediaUrl(coverImageUri ?? null),
    rating: Number(item.rating ?? 0),
    popularity: Number(item.popularity ?? 0),
    isHot: rawHot === true || rawHot === 1 || rawHot === '1',
    city: typeof item.city === 'string' ? item.city : null,
    description: typeof item.description === 'string' ? item.description : null,
    category: typeof item.category === 'string' ? item.category : null,
    type: typeof item.type === 'string' ? item.type : null,
    tags: splitDetailValues(item.tags),
    duration:
      typeof item.duration === 'number' || typeof item.duration === 'string' ? item.duration : null,
    suitableDays:
      typeof item.suitableDays === 'number' || typeof item.suitableDays === 'string'
        ? item.suitableDays
        : typeof item.suitable_days === 'number' || typeof item.suitable_days === 'string'
          ? item.suitable_days
          : null,
    bestSeason:
      typeof item.bestSeason === 'string'
        ? item.bestSeason
        : typeof item.best_season === 'string'
          ? item.best_season
          : null,
    tips: splitDetailValues(item.tips),
    difficulty: Number.isFinite(Number(item.difficulty)) ? Number(item.difficulty) : null,
    relaxation: Number.isFinite(Number(item.relaxation)) ? Number(item.relaxation) : null,
  };
}

export async function getAttractions(destinationId?: number, limit?: number) {
  const params = new URLSearchParams();
  if (destinationId) params.set('destinationId', String(destinationId));
  if (typeof limit === 'number' && Number.isFinite(limit)) params.set('limit', String(limit));
  const q = params.toString();
  const attractions = await withTravelDemoFallback(
    () => travelRequest<Attraction[]>(`/attractions${q ? `?${q}` : ''}`, undefined, false),
    () => {
      const filtered = destinationId
        ? demoAttractions.filter((item) => item.destinationId === destinationId)
        : demoAttractions;
      return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
    },
  );
  return attractions.map(normalizeAttraction);
}

export async function getAiRecommendations(params: AiRecommendParams) {
  const response = await travelRequest<RecommendResponse>('/recommendations/ai', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return normalizeRecommendResponse(response);
}

export async function semanticSearch(query: string, target: 'all' | 'attraction' | 'destination' = 'all') {
  return await travelRequest<{ results: SemanticSearchHit[]; total: number; mode: string }>(
    '/search/semantic',
    { method: 'POST', body: JSON.stringify({ query, target }) },
    false,
  );
}

export async function saveTravelPreferences(input: {
  preferenceTags: string[];
  tripTypes?: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
}) {
  return await travelRequest<{ ok: boolean }>('/users/me/travel-preferences', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function generateTripStream(
  params: TripGenerateParams,
  onDelta: (text: string) => void,
  onDone: (full: string) => void,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/trips/ai-generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...params, stream: true }),
    });
  } catch {
    throw new TravelConnectionError();
  }

  if (!response.ok || !response.body) {
    const err = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? '行程生成失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as { delta?: string; done?: boolean; full?: string };
        if (payload.delta) {
          full += payload.delta;
          onDelta(payload.delta);
        }
        if (payload.done && payload.full) full = payload.full;
      } catch {
        // 忽略不完整 chunk
      }
    }
  }

  onDone(full);
}

export async function generateTripAsync(params: TripGenerateParams) {
  return await travelRequest<{ taskId: string; status: string }>('/trips/ai-generate', {
    method: 'POST',
    body: JSON.stringify({ ...params, stream: false }),
  });
}

export async function composeMultiDayTrip(params: {
  cityId: number;
  originName?: string | null;
  days: number;
  travelers: number;
  budgetMin?: number | null;
  budget: number | null;
  mood: string;
  budgetTier?: 'budget' | 'standard' | 'premium' | 'luxury';
}) {
  const trip = await withTravelDemoFallback(
    () => travelRequest<ComposedTrip>('/trips/compose', {
      method: 'POST',
      body: JSON.stringify(params),
    }, false),
    () => {
      const candidates = demoActivities
        .filter((activity) => activity.cityId === params.cityId)
        .filter((activity, index, list) => list.findIndex((candidate) => candidate.address === activity.address) === index);
      const cityName = candidates[0]?.cityName ?? '当前城市';
      if (candidates.length < params.days) {
        throw new Error(`${cityName}目前只有 ${candidates.length} 条演示玩法，不足以生成 ${params.days} 天不重复行程。`);
      }
      const selected = [] as typeof candidates;
      let selectedCost = 0;
      for (const activity of candidates) {
        const nextCost = activity.budgetYuan * params.travelers;
        if (params.budget !== null && selectedCost + nextCost > params.budget) continue;
        selected.push(activity);
        selectedCost += nextCost;
        if (selected.length === params.days) break;
      }
      if (selected.length < params.days) {
        throw new Error(`当前预算不足以组合 ${params.days} 天不重复核心玩法，请提高预算或减少天数。`);
      }
      const activityCost = selected.reduce((sum, activity) => sum + activity.budgetYuan * params.travelers, 0);
      const flexibleDailyBudget = params.budget === null
        ? 80 * params.travelers
        : Math.max(0, Math.floor((params.budget - activityCost) / params.days));
      return {
        destinationCityId: params.cityId,
        destination: cityName,
        daysCount: params.days,
        travelers: params.travelers,
        totalBudgetEstimate: activityCost + flexibleDailyBudget * params.days,
        summary: `${cityName} ${params.days} 天不重复城市任务。`,
        days: selected.map((activity, index) => ({
          day: index + 1,
          theme: index === 0 ? `先认识${cityName}` : index === selected.length - 1 ? '低强度收尾' : `${params.mood}城市任务`,
          items: [
            { type: 'transport' as const, activityId: null, name: `前往${activity.district}`, summary: '根据实时位置选择公共交通或步行。', timeSlot: '上午' as const, durationMinutes: 45, budgetYuan: 0, district: activity.district, address: activity.address, coverImageUri: null, tips: ['出发前确认实时交通'] },
            { type: 'activity' as const, activityId: activity.id, name: activity.title, summary: activity.summary, timeSlot: '下午' as const, durationMinutes: activity.durationMinutes, budgetYuan: activity.budgetYuan * params.travelers, district: activity.district, address: activity.address, coverImageUri: activity.coverImageUri ?? null, tips: activity.tips },
            { type: 'meal' as const, activityId: null, name: `在${activity.district}自由用餐`, summary: '结合实时营业状态和口味现场选择。', timeSlot: '晚上' as const, durationMinutes: 75, budgetYuan: flexibleDailyBudget, district: activity.district, address: activity.district, coverImageUri: null, tips: ['以现场菜单和营业状态为准'] },
          ],
        })),
      } satisfies ComposedTrip;
    },
  );
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      items: day.items.map((item) => ({ ...item, coverImageUri: resolveApiMediaUrl(item.coverImageUri) })),
    })),
  };
}

export async function getTripGenerateTask(taskId: string) {
  return await travelRequest<{ status: string; result?: unknown; error?: string }>(
    `/trips/ai-generate/${taskId}`,
    undefined,
    false,
  );
}
