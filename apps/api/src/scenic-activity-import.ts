export const DEFAULT_AMAP_SCENIC_TYPES = "风景名胜";
export const DEFAULT_AMAP_POI_OFFSET = 25;
export const DEFAULT_AMAP_PAGE_LIMIT = 8;

const AMAP_POI_SEARCH_URL = "https://restapi.amap.com/v3/place/text";
const AMAP_POI_SEARCH_TIMEOUT_MS = 8_000;
const MAX_AMAP_TEXT_SEARCH_RESULTS = 200;
const AMAP_MAX_OFFSET = 25;
const AMAP_REQUEST_INTERVAL_MS = 420;
const AMAP_RATE_LIMIT_RETRIES = 4;

export type ScenicImportCity = {
  id: number;
  name: string;
  code?: string | null;
  province?: string | null;
};

export type AmapPoiPhoto = {
  title?: unknown;
  url?: unknown;
};

export type AmapPoi = {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  typecode?: unknown;
  location?: unknown;
  pname?: unknown;
  cityname?: unknown;
  adname?: unknown;
  address?: unknown;
  biz_ext?: unknown;
  photos?: unknown;
};

type AmapTextSearchResponse = {
  status?: unknown;
  info?: unknown;
  infocode?: unknown;
  count?: unknown;
  pois?: unknown;
};

export type NormalizedScenicPoi = {
  id: string | null;
  name: string;
  type: string | null;
  typecode: string | null;
  provinceName: string | null;
  cityName: string | null;
  districtName: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  costYuan: number | null;
  coverImage: string | null;
};

export type ScenicActivityDraft = {
  cityId: number;
  title: string;
  summary: string;
  description: string;
  category: string;
  mood: string;
  moodTags: string[];
  environment: "indoor" | "outdoor" | "either";
  minPartySize: number;
  maxPartySize: number;
  durationMinutes: number;
  budgetYuan: number;
  cityDistanceKm: number;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  navigationUrl: string;
  coverImage: string | null;
  steps: string[];
  tips: string[];
  accentColor: string;
};

export type FetchAmapScenicPoisOptions = {
  key: string;
  city: string;
  types?: string;
  keywords?: string[];
  offset?: number;
  pageLimit?: number;
  fetchImpl?: typeof fetch;
};

function asCleanString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]") return null;
    return trimmed;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join(" ")
      .trim();
    return joined || null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function parseCost(value: unknown): number | null {
  const text = asCleanString(value);
  if (!text) return null;
  const parsed = Number(text.replace(/[元￥¥,\s]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(9999, Math.round(parsed));
}

function readBizExtCost(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return parseCost((value as { cost?: unknown }).cost);
}

function readFirstPhotoUrl(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const url = asCleanString((item as AmapPoiPhoto).url);
    if (url) return url;
  }
  return null;
}

export function parseAmapPoiLocation(value: unknown) {
  const location = asCleanString(value);
  if (!location) return null;

  const [longitudeText, latitudeText] = location.split(",");
  const longitude = Number(longitudeText);
  const latitude = Number(latitudeText);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export function normalizeAmapPoi(poi: AmapPoi): NormalizedScenicPoi | null {
  const name = asCleanString(poi.name);
  const location = parseAmapPoiLocation(poi.location);
  if (!name || !location) return null;

  return {
    id: asCleanString(poi.id),
    name,
    type: asCleanString(poi.type),
    typecode: asCleanString(poi.typecode),
    provinceName: asCleanString(poi.pname),
    cityName: asCleanString(poi.cityname),
    districtName: asCleanString(poi.adname),
    address: asCleanString(poi.address),
    latitude: location.latitude,
    longitude: location.longitude,
    costYuan: readBizExtCost(poi.biz_ext),
    coverImage: readFirstPhotoUrl(poi.photos),
  };
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getPoiSearchText(poi: NormalizedScenicPoi) {
  return [poi.name, poi.type, poi.typecode, poi.address].filter(Boolean).join(" ");
}

function resolveEnvironment(poi: NormalizedScenicPoi): ScenicActivityDraft["environment"] {
  const text = getPoiSearchText(poi);
  if (containsAny(text, ["博物馆", "美术馆", "科技馆", "纪念馆", "展览馆", "艺术馆", "图书馆", "文化馆", "剧院"])) {
    return "indoor";
  }
  if (containsAny(text, ["古镇", "老街", "步行街", "文化旅游区", "旅游区", "度假区", "主题公园", "乐园", "动物园"])) {
    return "either";
  }
  return "outdoor";
}

function resolveDurationMinutes(poi: NormalizedScenicPoi) {
  const text = getPoiSearchText(poi);
  if (containsAny(text, ["主题公园", "乐园", "动物园", "植物园", "度假区", "风景区", "景区"])) return 240;
  if (containsAny(text, ["博物馆", "美术馆", "科技馆", "纪念馆", "展览馆", "艺术馆"])) return 150;
  if (containsAny(text, ["公园", "湿地", "湖", "山", "森林"])) return 180;
  return 150;
}

function resolveBudgetYuan(poi: NormalizedScenicPoi) {
  if (poi.costYuan !== null) return poi.costYuan;

  const text = getPoiSearchText(poi);
  if (containsAny(text, ["主题公园", "乐园", "度假区"])) return 300;
  if (containsAny(text, ["风景区", "景区", "动物园", "植物园"])) return 120;
  if (containsAny(text, ["博物馆", "美术馆", "科技馆", "纪念馆", "展览馆", "艺术馆"])) return 50;
  return 30;
}

function resolveAccentColor(environment: ScenicActivityDraft["environment"]) {
  if (environment === "indoor") return "#7357FF";
  if (environment === "either") return "#FF7A59";
  return "#28B8A0";
}

function buildNavigationUrl(cityName: string, poiName: string) {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${cityName} ${poiName}`)}`;
}

function buildActivityAddress(city: ScenicImportCity, poi: NormalizedScenicPoi) {
  const cityPrefix = poi.cityName && poi.cityName !== city.name ? `${poi.cityName} · ` : "";
  return poi.address ? `${cityPrefix}${poi.address}` : `${city.name} · ${poi.name}`;
}

export function buildScenicActivityDraft(
  city: ScenicImportCity,
  poi: AmapPoi | NormalizedScenicPoi,
): ScenicActivityDraft | null {
  const normalized = "latitude" in poi && "longitude" in poi ? poi : normalizeAmapPoi(poi);
  if (!normalized) return null;

  const environment = resolveEnvironment(normalized);
  const district = normalized.districtName ?? city.name;
  const address = buildActivityAddress(city, normalized);
  const typeLabel = normalized.type ?? DEFAULT_AMAP_SCENIC_TYPES;
  const budgetYuan = resolveBudgetYuan(normalized);
  const durationMinutes = resolveDurationMinutes(normalized);
  const moodTags = environment === "indoor" ? ["探索", "放松", "文艺"] : ["探索", "放松", "拍照"];

  return {
    cityId: city.id,
    title: truncate(normalized.name, 120),
    summary: truncate(`${city.name} · ${district} · 景区探索`, 255),
    description: `来自高德地图景区 POI：${city.name} · ${normalized.name}。地址：${address}。分类：${typeLabel}。适合想低负担探索城市景点、拍照打卡或安排半日游时使用。`,
    category: "探索",
    mood: "探索",
    moodTags,
    environment,
    minPartySize: 1,
    maxPartySize: 6,
    durationMinutes,
    budgetYuan,
    cityDistanceKm: 0,
    district: truncate(district, 64),
    address: truncate(address, 255),
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    navigationUrl: buildNavigationUrl(city.name, normalized.name),
    coverImage: normalized.coverImage,
    steps: [
      `打开地图前往“${normalized.name}”`,
      "到达后先确认开放时间、入口和现场预约要求",
      "按体力选择一条轻量游览路线，保留拍照和休息时间",
    ],
    tips: [
      "节假日建议提前查看预约、门票和交通管制信息",
      "如遇天气变化，优先选择室内展馆或缩短户外停留",
      `地点来源：高德地图 POI（${typeLabel}）`,
    ],
    accentColor: resolveAccentColor(environment),
  };
}

export function getAmapPoiDedupeKey(poi: AmapPoi | NormalizedScenicPoi) {
  const normalized = "latitude" in poi && "longitude" in poi ? poi : normalizeAmapPoi(poi);
  if (!normalized) return null;
  return normalized.id ?? `${normalized.name}|${normalized.longitude.toFixed(6)},${normalized.latitude.toFixed(6)}`;
}

export function dedupeAmapPois(pois: AmapPoi[]) {
  const seen = new Set<string>();
  const result: AmapPoi[] = [];

  for (const poi of pois) {
    const key = getAmapPoiDedupeKey(poi);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(poi);
  }

  return result;
}

function normalizeKeywords(keywords: string[] | undefined) {
  return (keywords ?? [])
    .flatMap((keyword) => keyword.split(","))
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

async function fetchAmapTextSearchPage(
  options: Required<Pick<FetchAmapScenicPoisOptions, "key" | "city" | "fetchImpl">> & {
    types: string;
    keyword: string | null;
    offset: number;
    page: number;
  },
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AMAP_POI_SEARCH_TIMEOUT_MS);

  try {
    const url = new URL(AMAP_POI_SEARCH_URL);
    url.searchParams.set("key", options.key);
    url.searchParams.set("output", "JSON");
    url.searchParams.set("city", options.city);
    url.searchParams.set("citylimit", "true");
    url.searchParams.set("types", options.types);
    url.searchParams.set("offset", String(options.offset));
    url.searchParams.set("page", String(options.page));
    url.searchParams.set("extensions", "all");
    if (options.keyword) {
      url.searchParams.set("keywords", options.keyword);
    }

    const response = await options.fetchImpl(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`高德 POI 搜索请求失败：HTTP ${response.status}`);
    }

    const body = (await response.json().catch(() => null)) as AmapTextSearchResponse | null;
    if (!body || String(body.status) !== "1") {
      const info = asCleanString(body?.info) ?? "UNKNOWN_ERROR";
      const infocode = asCleanString(body?.infocode);
      throw new Error(`高德 POI 搜索失败：${info}${infocode ? ` (${infocode})` : ""}`);
    }

    const pois = Array.isArray(body.pois) ? (body.pois as AmapPoi[]) : [];
    const countText = asCleanString(body.count);
    const total = countText ? Number(countText) : pois.length;
    return { pois, total: Number.isFinite(total) ? total : pois.length };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAmapScenicPois(options: FetchAmapScenicPoisOptions) {
  const key = options.key.trim();
  if (!key) throw new Error("缺少 AMAP_WEB_SERVICE_KEY，无法调用高德 Web 服务 POI 搜索");

  const city = options.city.trim();
  if (!city) throw new Error("缺少 city，无法按城市拉取景区 POI");

  const types = options.types?.trim() || DEFAULT_AMAP_SCENIC_TYPES;
  const keywords = normalizeKeywords(options.keywords);
  const queryKeywords = keywords.length > 0 ? keywords : [null];
  const offset = Math.min(Math.max(Math.trunc(options.offset ?? DEFAULT_AMAP_POI_OFFSET), 1), AMAP_MAX_OFFSET);
  const pageLimit = Math.max(Math.trunc(options.pageLimit ?? DEFAULT_AMAP_PAGE_LIMIT), 1);
  const fetchImpl = options.fetchImpl ?? fetch;
  const shouldThrottle = options.fetchImpl === undefined;
  const allPois: AmapPoi[] = [];

  const requestPage = async (input: Parameters<typeof fetchAmapTextSearchPage>[0]) => {
    for (let attempt = 0; attempt <= AMAP_RATE_LIMIT_RETRIES; attempt += 1) {
      try {
        const result = await fetchAmapTextSearchPage(input);
        if (shouldThrottle) await new Promise((resolve) => setTimeout(resolve, AMAP_REQUEST_INTERVAL_MS));
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const rateLimited = /1002[0-3]|QPS_HAS_EXCEEDED_THE_LIMIT/.test(message);
        if (!shouldThrottle || !rateLimited || attempt === AMAP_RATE_LIMIT_RETRIES) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1_200 * (attempt + 1)));
      }
    }
    throw new Error('高德 POI 搜索重试失败');
  };

  for (const keyword of queryKeywords) {
    for (let page = 1; page <= pageLimit; page += 1) {
      const { pois, total } = await requestPage({
        key,
        city,
        types,
        keyword,
        offset,
        page,
        fetchImpl,
      });

      allPois.push(...pois);
      const reachedProviderLimit = page * offset >= Math.min(total, MAX_AMAP_TEXT_SEARCH_RESULTS);
      if (pois.length < offset || reachedProviderLimit) break;
    }
  }

  return dedupeAmapPois(allPois);
}
