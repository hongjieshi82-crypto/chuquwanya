import { z } from "zod";

import type { ActivityRow } from "./types.js";
import { parseJsonArray } from "./types.js";
import { llmService } from "./travel/ai/llm.service.js";
import type { CityWeather } from "./weather.service.js";

type DrawPreferences = {
  partySize: number;
  durationMinutes: number | null;
  budgetMax: number | null;
  mood: string;
  randomLevel: number;
  category: string;
  environment: "indoor" | "outdoor" | "either";
  radiusKm: number | null;
  originName?: string | null;
  originLatitude?: number | null;
  originLongitude?: number | null;
  originAccuracyMeters?: number | null;
  originSource?: "device" | "manual" | null;
  destinationScope?: "nearby" | "province" | "nationwide";
  travelDuration?: "same-day" | "1-2days" | "1-3days" | "3-5days" | "5-7days";
  clientSource?: "mobile" | "pc";
  destinationScopeLabel?: string | null;
  travelDurationLabel?: string | null;
  budgetLabel?: string | null;
  surpriseLevelLabel?: string | null;
};

type DrawContext = {
  selectedCardId?: number | null;
  drawnCardIds?: number[];
  rerollRemaining?: number | null;
  drawCostPolicy?: string | null;
  userMemory?: {
    completedCardIds?: number[];
    dislikedCardIds?: number[];
    favoriteTags?: string[];
    blockedTags?: string[];
  };
};

export type CandidateCard = {
  card_id: number;
  poi_id: number;
  title: string;
  summary: string;
  description: string;
  category: string;
  mood: string;
  mood_tags: string[];
  environment: "indoor" | "outdoor" | "either";
  rain_friendly?: "yes" | "no" | "unknown";
  heat_sensitive?: "yes" | "no" | "unknown";
  wind_sensitive?: "yes" | "no" | "unknown";
  weather_notes?: string | null;
  min_party_size: number;
  max_party_size: number;
  duration_minutes: number;
  card_price: number;
  distance_km: number;
  distance_source: "coordinate" | "stored" | "missing";
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  steps: string[];
  tips: string[];
};

type RuntimeCandidate = {
  card_id: number;
  estimated_one_way_minutes: number;
  estimated_round_trip_minutes: number;
  estimated_total_minutes: number;
  opening_hours: null;
  close_status: "unknown";
};

const LLM_DECISION_TIMEOUT_MS = 8_000;


const destinationScopeLabels: Record<NonNullable<DrawPreferences["destinationScope"]>, string> = {
  nearby: "周边",
  province: "本省",
  nationwide: "全国",
};

const travelDurationLabels: Record<NonNullable<DrawPreferences["travelDuration"]>, string> = {
  "same-day": "当天",
  "1-2days": "1-2天",
  "1-3days": "1-3天",
  "3-5days": "3-5天",
  "5-7days": "5-7天",
};

function cleanLabel(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function getDestinationScopeLabel(preferences: DrawPreferences) {
  return cleanLabel(preferences.destinationScopeLabel) ?? destinationScopeLabels[preferences.destinationScope ?? "nearby"];
}

function getTravelDurationLabel(preferences: DrawPreferences) {
  return cleanLabel(preferences.travelDurationLabel) ?? (
    preferences.travelDuration ? travelDurationLabels[preferences.travelDuration] : "未设置"
  );
}

function getBudgetLabel(preferences: DrawPreferences) {
  const label = cleanLabel(preferences.budgetLabel);
  if (label) return label;
  if (preferences.budgetMax === null) return "不限";
  if (preferences.budgetMax <= 50) return "穷游";
  if (preferences.budgetMax <= 100) return "平价";
  if (preferences.budgetMax <= 300) return "舒适";
  return `¥${preferences.budgetMax}`;
}

function getSurpriseLevelLabel(preferences: DrawPreferences) {
  const label = cleanLabel(preferences.surpriseLevelLabel);
  if (label) return label;
  if (preferences.randomLevel <= 30) return "轻度";
  if (preferences.randomLevel <= 70) return "中度";
  return "重度";
}

function isPcDraw(preferences: DrawPreferences) {
  return preferences.clientSource === "pc";
}

export type DrawRecommendationDto = {
  status: "selected";
  cardId: number;
  poiId: number;
  reason: string;
  constraintSummary: {
    distance: string;
    budget: string;
    time: string;
    random: string;
    weather: string;
  };
  display: {
    badge: string;
    cardPage: string;
    detailPage: string;
    schedulePage: string;
    executableLabel: string;
  };
};

type SelectionResult =
  | { status: "selected"; activity: ActivityRow; recommendation: DrawRecommendationDto }
  | { status: "no_result"; suggestion: string };

const decisionSchema = z.object({
  status: z.enum(["selected", "no_result"]),
  card_id: z.number().int().positive().nullable(),
  poi_id: z.number().int().positive().nullable(),
  reason: z.string().min(1).max(240),
  constraint_summary: z.object({
    distance: z.string().min(1).max(160),
    budget: z.string().min(1).max(160),
    time: z.string().min(1).max(160),
    random: z.string().min(1).max(160),
    weather: z.string().min(1).max(160),
  }),
  display: z.object({
    badge: z.string().min(1).max(40),
    card_page: z.string().min(1).max(120),
    detail_page: z.string().min(1).max(180),
    schedule_page: z.string().min(1).max(120),
    executable_label: z.string().min(1).max(24),
  }),
  no_result_suggestion: z.string().max(180).nullable(),
});

const outputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "status",
    "card_id",
    "poi_id",
    "reason",
    "constraint_summary",
    "display",
    "no_result_suggestion",
  ],
  properties: {
    status: { type: "string", enum: ["selected", "no_result"] },
    card_id: { type: ["number", "null"], description: "最终选择的 candidate_cards.card_id；no_result 时为 null" },
    poi_id: { type: ["number", "null"], description: "最终选择的 candidate_cards.poi_id；no_result 时为 null" },
    reason: { type: "string", description: "不超过 120 字的最终选择理由或无结果说明" },
    constraint_summary: {
      type: "object",
      additionalProperties: false,
      required: ["distance", "budget", "time", "random", "weather"],
      properties: {
        distance: { type: "string" },
        budget: { type: "string" },
        time: { type: "string" },
        random: { type: "string" },
        weather: { type: "string" },
      },
    },
    display: {
      type: "object",
      additionalProperties: false,
      required: ["badge", "card_page", "detail_page", "schedule_page", "executable_label"],
      properties: {
        badge: { type: "string", description: "卡片页短标签" },
        card_page: { type: "string", description: "卡片页显示的一句话推荐理由" },
        detail_page: { type: "string", description: "详情页显示的推荐解释" },
        schedule_page: { type: "string", description: "选择时间页显示的确认提示" },
        executable_label: { type: "string", description: "可执行性短标签" },
      },
    },
    no_result_suggestion: { type: ["string", "null"], description: "no_result 时说明建议放宽的条件" },
  },
};

function toNumber(value: string | number | null): number | null {
  if (value === null) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function toCandidate(row: ActivityRow): CandidateCard {
  const latitude = toNumber(row.latitude);
  const longitude = toNumber(row.longitude);
  const distanceKm = Number(row.city_distance_km);
  const hasUsefulStoredDistance = Number.isFinite(distanceKm) && distanceKm > 0;
  const distanceSource =
    latitude !== null && longitude !== null
      ? hasUsefulStoredDistance
        ? "coordinate"
        : "missing"
      : hasUsefulStoredDistance
        ? "stored"
        : "missing";

  return {
    card_id: Number(row.id),
    poi_id: Number(row.id),
    title: row.title,
    summary: row.summary,
    description: row.description,
    category: row.category,
    mood: row.mood,
    mood_tags: parseJsonArray(row.mood_tags),
    environment: row.environment,
    rain_friendly: row.rain_friendly ?? "unknown",
    heat_sensitive: row.heat_sensitive ?? "unknown",
    wind_sensitive: row.wind_sensitive ?? "unknown",
    weather_notes: row.weather_notes ?? null,
    min_party_size: Number(row.min_party_size),
    max_party_size: Number(row.max_party_size),
    duration_minutes: Number(row.duration_minutes),
    card_price: Number(row.budget_yuan),
    distance_km: distanceKm > 0 ? distanceKm : 0,
    distance_source: distanceSource,
    district: row.district,
    address: row.address,
    latitude,
    longitude,
    steps: parseJsonArray(row.steps),
    tips: parseJsonArray(row.tips),
  };
}

function hasMissingDistance(candidate: CandidateCard) {
  return candidate.distance_source === "missing";
}

function isContextExcluded(candidate: CandidateCard, drawContext?: DrawContext | null) {
  if (!drawContext) return false;
  if (drawContext.selectedCardId && candidate.card_id === drawContext.selectedCardId) {
    return false;
  }
  if (drawContext.drawnCardIds?.includes(candidate.card_id)) return true;
  if (drawContext.userMemory?.dislikedCardIds?.includes(candidate.card_id)) return true;
  const blockedTags = drawContext.userMemory?.blockedTags ?? [];
  return blockedTags.some((tag) => candidate.mood_tags.includes(tag) || candidate.mood === tag || candidate.summary.includes(tag));
}

function formatRadius(preferences: DrawPreferences) {
  return preferences.radiusKm === null ? "全城" : `${preferences.radiusKm} km`;
}

function hasZeroDistanceText(value: string) {
  return /(?:^|[^\d])0(?:\.0+)?\s*(?:km|公里)/i.test(value);
}

function sanitizeDistanceText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

async function buildAiDistanceText(preferences: DrawPreferences, candidate: CandidateCard) {
  if (!hasMissingDistance(candidate) || !llmService.isAvailable()) return null;

  const originName = preferences.originName?.trim() || "当前出发地";
  const destinationName = candidate.address || candidate.title;

  try {
    const raw = await withTimeout(
      llmService.complete(
        [
          {
            role: "system",
            content:
              "你是中文出行距离估算器。只输出一句话，不要 JSON。必须包含约Xkm或约X-Ykm；缺少精确坐标时必须写“AI估算”，不得输出0km，除非起终点是同一地点。",
          },
          {
            role: "user",
            content: `originName=${originName}\ndestination=${destinationName}\nradius=${formatRadius(preferences)}\n请估算两者出行距离，用一句中文说明，并提醒以地图为准。`,
          },
        ],
        { temperature: 0.2 },
      ),
      4_000,
    );
    const text = sanitizeDistanceText(raw);
    return text && !hasZeroDistanceText(text) ? text : null;
  } catch {
    return null;
  }
}

async function buildDistanceConstraintText(
  preferences: DrawPreferences,
  candidate: CandidateCard,
  options: { useAiDistance?: boolean } = {},
) {
  const radiusText = formatRadius(preferences);
  if (!hasMissingDistance(candidate)) {
    return `距离 ${candidate.distance_km.toFixed(1)} km，范围 ${radiusText}。`;
  }

  const shouldUseAiDistance = options.useAiDistance ?? true;
  const aiDistanceText = shouldUseAiDistance ? await buildAiDistanceText(preferences, candidate) : null;
  if (aiDistanceText) return aiDistanceText;

  const originName = preferences.originName?.trim() || "当前出发地";
  return `候选缺少坐标，不能按 0 km 展示；${originName} → ${candidate.address || candidate.title} 的距离需以地图确认，当前仅按${radiusText}偏好进入同城候选池。`;
}

function estimateOneWayMinutes(distanceKm: number) {
  return Math.max(8, Math.ceil(10 + distanceKm * 5));
}

function buildRuntimeData(candidateCards: CandidateCard[], weather: CityWeather | null = null) {
  const traffic_estimates: RuntimeCandidate[] = candidateCards.map((candidate) => {
    const estimated_one_way_minutes = estimateOneWayMinutes(candidate.distance_km);
    const estimated_round_trip_minutes = estimated_one_way_minutes * 2;
    return {
      card_id: candidate.card_id,
      estimated_one_way_minutes,
      estimated_round_trip_minutes,
      estimated_total_minutes: estimated_round_trip_minutes + candidate.duration_minutes,
      opening_hours: null,
      close_status: "unknown",
    };
  });

  return {
    timezone: "Asia/Shanghai",
    current_time_iso: new Date().toISOString(),
    weather,
    traffic_estimates,
    note:
      "本地 activities 表暂无营业时间字段，close_status=unknown 时只能按玩法时长约束+交通估算展示预期耗时，不做额外硬校验。",
  };
}

function getRuntimeForCard(runtime: ReturnType<typeof buildRuntimeData>, cardId: number) {
  return runtime.traffic_estimates.find((item) => item.card_id === cardId);
}

function getHardFailure(
  preferences: DrawPreferences,
  candidate: CandidateCard,
  runtime: ReturnType<typeof buildRuntimeData>,
) {
  const totalCost = candidate.card_price * preferences.partySize;

  if (candidate.min_party_size > preferences.partySize || candidate.max_party_size < preferences.partySize) {
    return "人数不匹配";
  }
  if (
    preferences.environment !== "either" &&
    candidate.environment !== "either" &&
    candidate.environment !== preferences.environment
  ) {
    return "环境冲突";
  }
  if (runtime.weather?.risks.includes("rain") && candidate.rain_friendly !== "yes") {
    return "雨天不适合";
  }
  if (runtime.weather?.risks.includes("wind") && candidate.wind_sensitive === "yes") {
    return "大风不适合";
  }
  if (runtime.weather?.risks.includes("heat") && candidate.heat_sensitive === "yes") {
    return "高温不适合";
  }
  if (preferences.radiusKm !== null && candidate.distance_source === "missing") {
    return "距离无法确认";
  }
  if (preferences.radiusKm !== null && candidate.distance_km > preferences.radiusKm) {
    return "距离超出";
  }
  if (preferences.budgetMax !== null && totalCost > preferences.budgetMax) {
    return "预算超出";
  }
  const runtimeCard = getRuntimeForCard(runtime, candidate.card_id);
  const totalDuration = runtimeCard?.estimated_total_minutes ?? candidate.duration_minutes;
  if (preferences.durationMinutes !== null && totalDuration > preferences.durationMinutes) {
    return "时长不足";
  }
  return null;
}

function scoreCandidate(preferences: DrawPreferences, candidate: CandidateCard) {
  const moodWords = new Set([candidate.mood, candidate.category, ...candidate.mood_tags]);
  let score = 0.35;

  if (moodWords.has(preferences.mood)) score += 0.3;
  if (candidate.summary.includes(preferences.mood) || candidate.description.includes(preferences.mood)) score += 0.12;
  if (preferences.category !== "不限" && candidate.category === preferences.category) score += 0.16;
  if (preferences.environment === "either" || candidate.environment === "either" || candidate.environment === preferences.environment) {
    score += 0.1;
  }
  if (preferences.radiusKm !== null) {
    score += Math.max(0, (preferences.radiusKm - candidate.distance_km) / preferences.radiusKm) * 0.12;
  }
  if (preferences.budgetMax !== null) {
    const totalCost = candidate.card_price * preferences.partySize;
    score += Math.max(0, (preferences.budgetMax - totalCost) / preferences.budgetMax) * 0.12;
  }

  return Math.max(0.01, Math.min(1, score));
}

function localWeightedPick(preferences: DrawPreferences, candidateCards: CandidateCard[]) {
  const ranked = [...candidateCards]
    .map((candidate) => ({ candidate, score: scoreCandidate(preferences, candidate) }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return null;
  if (preferences.randomLevel <= 5) return ranked[0]!.candidate;

  const randomness = Math.max(0, Math.min(1, preferences.randomLevel / 100));
  const weights = ranked.map((item) => item.score * (1 - randomness) + randomness);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = Math.random() * total;

  for (let index = 0; index < ranked.length; index += 1) {
    cursor -= weights[index]!;
    if (cursor <= 0) return ranked[index]!.candidate;
  }

  return ranked[ranked.length - 1]!.candidate;
}

function buildNoResultSuggestion(preferences: DrawPreferences, candidates: CandidateCard[], runtime: ReturnType<typeof buildRuntimeData>) {
  const reasons = new Map<string, number>();
  for (const candidate of candidates) {
    const reason = getHardFailure(preferences, candidate, runtime);
    if (reason) reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }

  const [topReason] = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["候选不足"];
  switch (topReason) {
    case "预算超出":
      return "没有同时满足预算的候选卡，建议提高预算或减少人数。";
    case "距离超出":
      return "没有同时满足距离的候选卡，建议扩大距离范围。";
    case "距离无法确认":
      return "候选地点缺少经纬度，暂时无法校验距离，建议补充高德 Web 服务 Key 或选择全城。";
    case "时长不足":
      return "没有同时满足时长的候选卡，建议选择更长时间窗口。";
    case "环境冲突":
      return "当前环境偏好与候选卡场景冲突，建议调整室内/户外偏好。";
    case "人数不匹配":
      return "没有适合当前人数的候选卡，建议调整人数。";
    case "雨天不适合":
      return "当前天气有雨，内容池里暂时没有已确认雨天友好的活动。";
    case "大风不适合":
      return "当前风力较大，海边、骑行、登高等活动已暂时排除。";
    case "高温不适合":
      return "当前处于高温天气，普通户外活动已暂时排除。";
    default:
      return "当前城市候选卡不足，建议换个城市或稍后再试。";
  }
}

async function buildFallbackRecommendation(
  preferences: DrawPreferences,
  candidate: CandidateCard,
  runtime: ReturnType<typeof buildRuntimeData>,
): Promise<DrawRecommendationDto> {
  const runtimeCard = getRuntimeForCard(runtime, candidate.card_id);
  const totalCost = candidate.card_price * preferences.partySize;
  const totalMinutes = runtimeCard?.estimated_total_minutes ?? candidate.duration_minutes;
  const pcMode = isPcDraw(preferences);
  const scopeLabel = getDestinationScopeLabel(preferences);
  const travelDurationLabel = getTravelDurationLabel(preferences);
  const budgetLabel = getBudgetLabel(preferences);
  const surpriseLevelLabel = getSurpriseLevelLabel(preferences);
  const timeSummary = pcMode
    ? `PC 端旅游时间偏好「${travelDurationLabel}」是旅行天数偏好，不做分钟级硬过滤；候选玩法预计总耗时 ${totalMinutes} 分钟。`
    : preferences.durationMinutes === null
      ? `预计总耗时 ${totalMinutes} 分钟，无时间上限约束。`
      : `预计总耗时 ${totalMinutes} 分钟，时间窗口 ${preferences.durationMinutes} 分钟。`;
  const budgetSummary = pcMode
    ? preferences.budgetMax === null
      ? `预算偏好「${budgetLabel}」，总预算 ${totalCost} 元；该档位不设置硬上限。`
      : `预算偏好「${budgetLabel}」，总预算 ${totalCost} 元，预算上限 ${preferences.budgetMax} 元。`
    : `总预算 ${totalCost} 元，预算上限 ${preferences.budgetMax ?? "不限"}。`;
  const reasonPrefix = pcMode
    ? `符合 PC 端「${scopeLabel} / ${travelDurationLabel} / ${budgetLabel}」条件`
    : preferences.durationMinutes === null
      ? "满足距离、预算硬约束"
      : "满足距离、预算和时间硬约束";
  const cardPageText = pcMode
    ? `这张卡匹配「${scopeLabel}」目的地范围、预算「${budgetLabel}」和今天的「${preferences.mood}」心情。`
    : preferences.durationMinutes === null
      ? `这张卡通过了距离、预算硬校验，适合今天的「${preferences.mood}」。`
      : `这张卡通过了距离、预算和时间硬校验，适合今天的「${preferences.mood}」。`;
  const detailPageText = pcMode
    ? "系统先避开本周已有行程，再按 PC 端人数、目的地范围、预算和心情条件筛出候选，最后结合惊喜程度抽中它。"
    : preferences.durationMinutes === null
      ? "系统先剔除了超预算、超距离和环境冲突的候选，再在合格池里按随机程度抽中它。"
      : "系统先剔除了超预算、超距离和时间不足的候选，再在合格池里按随机程度抽中它。";
  const randomText = pcMode
    ? `盲盒惊喜程度「${surpriseLevelLabel}」（randomLevel=${preferences.randomLevel}%），只在合格候选池内控制探索程度。`
    : preferences.randomLevel >= 65
      ? `randomLevel=${preferences.randomLevel}%，在合格池内保留探索感。`
      : `randomLevel=${preferences.randomLevel}%，更偏向高匹配确定解。`;
  const weatherText = runtime.weather
    ? `已核验${runtime.weather.city}${runtime.weather.condition}${runtime.weather.temperature === null ? "" : `，${runtime.weather.temperature}℃`}；${candidate.weather_notes || "活动天气适用性已进入规则校验"}。`
    : "天气服务暂不可用，本次未冒充实时天气已核验，出发前请再次确认。";

  return {
    status: "selected",
    cardId: candidate.card_id,
    poiId: candidate.poi_id,
    reason: `${reasonPrefix}，并与「${preferences.mood}」心情匹配。`,
    constraintSummary: {
      distance: await buildDistanceConstraintText(preferences, candidate),
      budget: budgetSummary,
      time: timeSummary,
      random: randomText,
      weather: weatherText,
    },
    display: {
      badge: `${candidate.category} · ${preferences.mood}`,
      cardPage: cardPageText,
      detailPage: detailPageText,
      schedulePage: pcMode
        ? `适合放进「${travelDurationLabel}」旅行安排，确认后会加入本周约定。`
        : `预计 ${Math.ceil(totalMinutes / 60)} 小时内可完成，确认后会加入本周约定。`,
      executableLabel: "高",
    },
  };
}

async function withResolvedDistanceText(
  preferences: DrawPreferences,
  candidate: CandidateCard,
  recommendation: DrawRecommendationDto,
) {
  if (!hasMissingDistance(candidate) || !hasZeroDistanceText(recommendation.constraintSummary.distance)) {
    return recommendation;
  }

  return {
    ...recommendation,
    constraintSummary: {
      ...recommendation.constraintSummary,
      distance: await buildDistanceConstraintText(preferences, candidate),
    },
  };
}

function extractJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) return cleaned;
  return cleaned.slice(start, end + 1);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("LLM decision timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function mapDecisionToRecommendation(decision: z.infer<typeof decisionSchema>): DrawRecommendationDto | null {
  if (decision.status !== "selected" || !decision.card_id || !decision.poi_id) return null;
  return {
    status: "selected",
    cardId: decision.card_id,
    poiId: decision.poi_id,
    reason: decision.reason,
    constraintSummary: {
      distance: decision.constraint_summary.distance,
      budget: decision.constraint_summary.budget,
      time: decision.constraint_summary.time,
      random: decision.constraint_summary.random,
      weather: decision.constraint_summary.weather,
    },
    display: {
      badge: decision.display.badge,
      cardPage: decision.display.card_page,
      detailPage: decision.display.detail_page,
      schedulePage: decision.display.schedule_page,
      executableLabel: decision.display.executable_label,
    },
  };
}

function buildPrompt(input: {
  userContext: DrawPreferences;
  candidateCards: CandidateCard[];
  runtimeData: ReturnType<typeof buildRuntimeData>;
  drawContext?: DrawContext | null;
}) {
  const drawContext = input.drawContext ?? null;
  const promptUserContext = {
    task_type: "generate_card",
    user_context: {
      city: "当前抽卡城市（后端已按 cityId 筛选）",
      client_source: input.userContext.clientSource ?? "mobile",
      origin_name: input.userContext.originName ?? null,
      origin_latitude: input.userContext.originLatitude ?? null,
      origin_longitude: input.userContext.originLongitude ?? null,
      party_size: input.userContext.partySize,
      duration_minutes: input.userContext.durationMinutes,
      budget_max: input.userContext.budgetMax,
      budget_label: getBudgetLabel(input.userContext),
      radius_km: input.userContext.radiusKm,
      mood: input.userContext.mood,
      random_level: input.userContext.randomLevel,
      surprise_level_label: getSurpriseLevelLabel(input.userContext),
      category: input.userContext.category,
      environment: input.userContext.environment,
      origin_source: input.userContext.originSource ?? null,
      destination_scope: input.userContext.destinationScope ?? "nearby",
      destination_scope_label: getDestinationScopeLabel(input.userContext),
      travel_duration: input.userContext.travelDuration ?? null,
      travel_duration_label: getTravelDurationLabel(input.userContext),
    },
    draw_context: {
      selected_card_id: drawContext?.selectedCardId ?? null,
      drawn_card_ids: drawContext?.drawnCardIds ?? [],
      reroll_remaining: drawContext?.rerollRemaining ?? 2,
      draw_cost_policy: drawContext?.drawCostPolicy ?? "平台后端配置",
      user_memory: {
        completed_card_ids: drawContext?.userMemory?.completedCardIds ?? [],
        disliked_card_ids: drawContext?.userMemory?.dislikedCardIds ?? [],
        favorite_tags: drawContext?.userMemory?.favoriteTags ?? [],
        blocked_tags: drawContext?.userMemory?.blockedTags ?? [],
      },
    },
    runtime_data: {
      online_search_enabled: false,
      current_time: input.runtimeData.current_time_iso,
      weather: input.runtimeData.weather,
      traffic: {
        default_mode: "driving",
        items: input.runtimeData.traffic_estimates.map((item) => ({
          card_id: item.card_id,
          one_way_minutes: item.estimated_one_way_minutes,
          distance_km: null,
        })),
      },
      candidate_cards: input.candidateCards.map((candidate) => ({
        card_id: candidate.card_id,
        poi_id: candidate.poi_id,
        city: candidate.district,
        poi_name: candidate.title,
        area: candidate.district,
        suitable_party_size: `${candidate.min_party_size} 人, ${candidate.max_party_size >= 2 ? "双人" : "单人"}, 多人`,
        price_range_label: `¥${candidate.card_price} 人均（单价字段）`,
        budget_min_per_person: candidate.card_price,
        budget_max_per_person: candidate.card_price,
        budget_note: "后端候选单价字段",
        tags: candidate.mood_tags,
        secondary_tags: [candidate.mood],
        place_type: candidate.category,
        object_type: "具体POI",
        environment: candidate.environment,
        cover_image: "",
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        source: "",
        estimated_stay_minutes: candidate.duration_minutes,
        reservation_required: "待补",
        open_status: "unknown",
        open_hours: null,
        rain_friendly: candidate.rain_friendly,
        heat_sensitive: candidate.heat_sensitive,
        wind_sensitive: candidate.wind_sensitive,
        weather_notes: candidate.weather_notes,
        night_friendly: "待补",
        task_template: candidate.steps.join("；"),
        avoid_pitfalls: candidate.tips.join("；"),
        data_completeness: "中",
        missing_fields: [
          candidate.distance_source === "missing" ? "coordinates" : null,
          candidate.latitude === null || candidate.longitude === null ? "destination_coordinate" : null,
        ]
          .filter(Boolean)
          .join(","),
      })),
    },
  };

  return `# Role

你是「懒得(děi)动」的出门盲盒结果生成 Agent。你不是推荐系统，而是做约束求解与可控随机的决策器，最终只输出 1 条可执行方案。

# Input

你只处理以下输入，字段缺失时禁止编造：
\n${JSON.stringify(promptUserContext, null, 2)}

# Operating Mode

1. 如果 draw_context.selected_card_id 存在：必须将该卡作为最终结果，不允许改选其他卡牌，仅做硬约束核验，必要时返回无结果重抽建议。
2. 如果 draw_context.selected_card_id 不存在：从 candidate_cards 中选择 1 个最终卡牌，经过 hard filters 后在合格池内按 random_level 进行排序抽样。

# PC Input Mapping

- 当 user_context.client_source=pc 时，输入来自 PC 端「人数 / 目的地范围 / 旅游时间 / 预算 / 心情 / 盲盒惊喜程度」。
- destination_scope 的含义：nearby=周边，province=本省，nationwide=全国；优先使用 destination_scope_label 生成中文说明。
- travel_duration 的含义：1-3days / 3-5days / 5-7days 是旅行天数偏好，不等同于分钟级硬约束；PC 当前 duration_minutes 通常为 null，不要因为候选玩法分钟数超过某个天数推导值而剔除。
- budget_label 的含义：穷游 / 平价 / 舒适 / 轻奢；budget_max=null 表示不限或轻奢档位，不要默认成 100。
- surprise_level_label 的含义：轻度 / 中度 / 重度，对应 random_level 的探索程度；random_level 只能在 hard filters 通过后影响排序/抽样。

# Decision Logic

硬约束（Hard Filters）严格顺序：
1. 人数匹配：party_size 落在适用区间内。
2. 距离约束：若设置 radius_km 且 distance_source=missing，视为不可用；distance_km <= radius_km。
3. 预算约束：若有 budget_max，party_size * card_price <= budget_max。
4. 时间约束：
   - 若 duration_minutes 为 null：不执行分钟级时间上限硬约束；
   - 否则要求 runtime.estimated_total_minutes <= duration_minutes（该值包含往返交通+停留时长估算）。
5. 环境偏好：environment 与用户偏好冲突则剔除。

软约束（Soft Matching）：
- mood / category / tags / secondary_tags 命中优先；
- 在可执行性与信息完整性更高的候选中提权；
- random_level 仅在 hard 通过后起效。

随机级别（random_level）解释：
- 0-30：更接近确定解，优先匹配度最高；
- 31-70：可控探索，保留次优选项；
- 71-100：更偏向新鲜感，但不得突破硬约束。

# Hard Rules

- 只能使用输入中的 card_id / poi_id，不得新增虚构候选；
- 后端 SQL 候选池已排除当前用户本周已有的非 cancelled 行程；模型只能在 candidate_cards 内选择，不得选择已排除或不在候选池里的地点；
- distance_source=missing 时，constraint_summary.distance 不得直接输出 0km；
- 无可用候选返回 status=no_result，并在 no_result_suggestion 中给出放宽建议；
- 不得输出推荐列表，只返回 1 条结果，禁止 Markdown。

# Output JSON Schema

${JSON.stringify(outputJsonSchema)}`;
}

export async function selectActivityWithRecommendation(
  preferences: DrawPreferences,
  rows: ActivityRow[],
  drawContext?: DrawContext,
  weather: CityWeather | null = null,
): Promise<SelectionResult> {
  const allCandidates = rows.map(toCandidate);
  const runtime = buildRuntimeData(allCandidates, weather);
  const byId = new Map(allCandidates.map((candidate) => [candidate.card_id, candidate]));
  const rowById = new Map(rows.map((row) => [Number(row.id), row]));

  const selectedFromContext = drawContext?.selectedCardId ? byId.get(drawContext.selectedCardId) : null;
  if (
    selectedFromContext &&
    drawContext?.selectedCardId &&
    !isContextExcluded(selectedFromContext, drawContext) &&
    getHardFailure(preferences, selectedFromContext, runtime) === null
  ) {
    const selectedRow = rowById.get(selectedFromContext.card_id);
    if (selectedRow) {
      return {
        status: "selected",
        activity: selectedRow,
        recommendation: await buildFallbackRecommendation(preferences, selectedFromContext, runtime),
      };
    }
  }

  if (drawContext?.selectedCardId && !selectedFromContext) {
    return {
      status: "no_result",
      suggestion: `已锁定卡片 ${drawContext.selectedCardId} 不在本次候选池中或已无效，请重新抽取。`,
    };
  }

  const hardPassedCandidates = allCandidates.filter(
    (candidate) => !isContextExcluded(candidate, drawContext) && getHardFailure(preferences, candidate, runtime) === null,
  );

  if (hardPassedCandidates.length === 0) {
    return { status: "no_result", suggestion: buildNoResultSuggestion(preferences, allCandidates, runtime) };
  }

  if (selectedFromContext && getHardFailure(preferences, selectedFromContext, runtime) !== null) {
    return {
      status: "no_result",
      suggestion: `已锁定卡片 ${selectedFromContext.card_id} 不满足当前硬约束条件，请重新抽取。`,
    };
  }

  if (selectedFromContext && isContextExcluded(selectedFromContext, drawContext)) {
    return {
      status: "no_result",
      suggestion: `已锁定卡片 ${selectedFromContext.card_id} 已被排除规则屏蔽，请重新抽取。`,
    };
  }

  if (llmService.isAvailable()) {
    try {
      const raw = await withTimeout(
        llmService.complete(
          [
          {
            role: "system",
            content:
              "你是严格 JSON 决策器。必须遵守硬约束，只能从 candidate_cards 中选择一个 card_id，不得输出 Markdown。",
          },
          {
            role: "user",
            content: buildPrompt({
              userContext: preferences,
              candidateCards: allCandidates,
              runtimeData: runtime,
              drawContext,
            }),
          },
        ],
          { temperature: Math.max(0.05, Math.min(0.95, preferences.randomLevel / 100)) },
        ),
        LLM_DECISION_TIMEOUT_MS,
      );
      const decision = decisionSchema.parse(JSON.parse(extractJson(raw)));
      const recommendation = mapDecisionToRecommendation(decision);
      const selected = recommendation ? byId.get(recommendation.cardId) : null;
      const selectedRow = recommendation ? rowById.get(recommendation.cardId) : null;

      if (recommendation && selected && selectedRow && getHardFailure(preferences, selected, runtime) === null) {
        return {
          status: "selected",
          activity: selectedRow,
          recommendation: await withResolvedDistanceText(preferences, selected, recommendation),
        };
      }
    } catch {
      // LLM 输出异常时使用本地同约束加权抽样，避免抽卡链路中断。
    }
  }

  const fallback = localWeightedPick(preferences, hardPassedCandidates);
  if (!fallback) {
    return { status: "no_result", suggestion: buildNoResultSuggestion(preferences, allCandidates, runtime) };
  }

  const selectedRow = rowById.get(fallback.card_id);
  if (!selectedRow) {
    return { status: "no_result", suggestion: "候选卡数据异常，请稍后再试。" };
  }

  return {
    status: "selected",
    activity: selectedRow,
    recommendation: await buildFallbackRecommendation(preferences, fallback, runtime),
  };
}

export {
  buildDistanceConstraintText,
  buildRuntimeData,
  getHardFailure,
  outputJsonSchema,
};
