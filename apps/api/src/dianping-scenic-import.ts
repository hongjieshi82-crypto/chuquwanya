import { basename, extname } from "node:path";

import type { ScenicImportCity } from "./scenic-activity-import.js";

export type DianpingRawRecord = Record<string, unknown>;

export type DianpingScenicPoi = {
  sourceId: string | null;
  name: string;
  cityName: string | null;
  districtName: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
  reviewCount: number | null;
  avgPriceYuan: number | null;
  latitude: number | null;
  longitude: number | null;
  coverImage: string | null;
  sourceUrl: string | null;
  tags: string[];
};

export type DianpingScenicActivityDraft = {
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
  latitude: number | null;
  longitude: number | null;
  navigationUrl: string;
  coverImage: string | null;
  steps: string[];
  tips: string[];
  accentColor: string;
  sourceId: string | null;
  sourceUrl: string | null;
};

export type ParseDianpingScenicExportOptions = {
  fileName?: string;
};

const JSON_ARRAY_KEYS = ["items", "data", "list", "records", "pois", "shops", "scenics"];

const FIELD_ALIASES = {
  sourceId: ["source_id", "shop_id", "shopId", "business_id", "businessId", "poi_id", "poiId", "id", "dp_id", "点评ID", "商户ID", "景点ID"],
  name: ["name", "title", "shop_name", "shopName", "poi_name", "poiName", "scenic_name", "scenicName", "景点名称", "商户名称", "名称", "景区名称"],
  cityName: ["city", "city_name", "cityName", "城市", "城市名", "所在城市"],
  districtName: ["district", "district_name", "districtName", "adname", "region", "area", "区县", "行政区", "地区", "商圈"],
  address: ["address", "addr", "地址", "详细地址", "门店地址"],
  category: ["category", "categories", "type", "biz_type", "分类", "品类", "景点类型", "商户类型"],
  rating: ["rating", "score", "star", "stars", "点评评分", "评分", "星级", "rating_score"],
  reviewCount: ["review_count", "reviewCount", "reviews", "comment_count", "commentCount", "评价数", "点评数", "评论数", "review_num"],
  avgPriceYuan: ["avg_price", "avgPrice", "price", "cost", "人均", "人均价格", "均价", "门票", "参考价格", "价格"],
  latitude: ["latitude", "lat", "纬度"],
  longitude: ["longitude", "lng", "lon", "经度"],
  coverImage: ["cover_image", "coverImage", "image", "image_url", "imageUrl", "photo", "photo_url", "封面", "封面图", "图片"],
  sourceUrl: ["source_url", "sourceUrl", "url", "link", "链接", "页面链接", "点评链接", "详情页"],
  tags: ["tags", "tag", "labels", "keywords", "标签", "特色", "关键词"],
} satisfies Record<string, string[]>;

function asCleanString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return null;
    return trimmed;
  }

  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => asCleanString(item))
      .filter((item): item is string => Boolean(item))
      .join(",")
      .trim();
    return joined || null;
  }

  return null;
}

function normalizeFieldName(value: string) {
  return value.replace(/^\uFEFF/, "").replace(/[\s_\-./()（）:：]/g, "").toLowerCase();
}

function createFieldReader(record: DianpingRawRecord) {
  const keyMap = new Map<string, string>();
  for (const key of Object.keys(record)) {
    keyMap.set(normalizeFieldName(key), key);
  }

  return (aliases: string[]) => {
    for (const alias of aliases) {
      const originalKey = keyMap.get(normalizeFieldName(alias));
      if (originalKey !== undefined) return record[originalKey];
    }
    return undefined;
  };
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = asCleanString(value);
  if (!text) return null;
  const normalized = text.replace(/[￥¥元人均起+约大概左右,，\s]/g, "");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCount(value: unknown): number | null {
  const text = asCleanString(value);
  if (!text) return null;
  const normalized = text.replace(/[,，\s]/g, "");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  if (/万/.test(normalized)) return Math.round(parsed * 10_000);
  return Math.round(parsed);
}

function parseRating(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed === null || parsed < 0) return null;
  if (parsed > 5 && parsed <= 50) return Math.round((parsed / 10) * 10) / 10;
  if (parsed > 5) return null;
  return Math.round(parsed * 10) / 10;
}

function parsePrice(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed === null || parsed < 0) return null;
  return Math.min(9999, Math.round(parsed));
}

function parseCoordinate(value: unknown, type: "latitude" | "longitude") {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  if (type === "latitude" && (parsed < -90 || parsed > 90)) return null;
  if (type === "longitude" && (parsed < -180 || parsed > 180)) return null;
  return parsed;
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asCleanString(item))
      .filter((item): item is string => Boolean(item))
      .flatMap((item) => splitTags(item));
  }

  const text = asCleanString(value);
  return text ? splitTags(text) : [];
}

function splitTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[、,，;；|/\n\t]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);

  return rows.filter((currentRow) => currentRow.some((cell) => cell.trim()));
}

function parseCsvRecords(content: string) {
  const rows = parseCsv(content);
  if (rows.length === 0) return [];

  const headers = rows[0]?.map((header) => header.replace(/^\uFEFF/, "").trim()) ?? [];
  if (headers.length === 0 || headers.every((header) => !header)) return [];

  return rows.slice(1).map((row) => {
    const record: DianpingRawRecord = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = row[index]?.trim() ?? "";
    });
    return record;
  });
}

function unwrapJsonRecords(value: unknown): DianpingRawRecord[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is DianpingRawRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const objectValue = value as Record<string, unknown>;

  for (const key of JSON_ARRAY_KEYS) {
    const maybeArray = objectValue[key];
    if (Array.isArray(maybeArray)) return unwrapJsonRecords(maybeArray);
  }

  return [objectValue];
}

function parseJsonRecords(content: string) {
  return unwrapJsonRecords(JSON.parse(content) as unknown);
}

function parseJsonlRecords(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown)
    .flatMap((item) => unwrapJsonRecords(item));
}

export function parseDianpingScenicExport(content: string, options: ParseDianpingScenicExportOptions = {}) {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const extension = extname(options.fileName ?? "").toLowerCase();
  if (extension === ".jsonl" || extension === ".ndjson") return parseJsonlRecords(trimmed);
  if (extension === ".csv") return parseCsvRecords(content);
  if (extension === ".json") return parseJsonRecords(trimmed);

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return parseJsonRecords(trimmed);
  return parseCsvRecords(content);
}

export function normalizeDianpingScenicRecord(record: DianpingRawRecord): DianpingScenicPoi | null {
  const read = createFieldReader(record);
  const name = asCleanString(read(FIELD_ALIASES.name));
  if (!name) return null;

  const latitude = parseCoordinate(read(FIELD_ALIASES.latitude), "latitude");
  const longitude = parseCoordinate(read(FIELD_ALIASES.longitude), "longitude");

  return {
    sourceId: asCleanString(read(FIELD_ALIASES.sourceId)),
    name,
    cityName: asCleanString(read(FIELD_ALIASES.cityName)),
    districtName: asCleanString(read(FIELD_ALIASES.districtName)),
    address: asCleanString(read(FIELD_ALIASES.address)),
    category: asCleanString(read(FIELD_ALIASES.category)),
    rating: parseRating(read(FIELD_ALIASES.rating)),
    reviewCount: parseCount(read(FIELD_ALIASES.reviewCount)),
    avgPriceYuan: parsePrice(read(FIELD_ALIASES.avgPriceYuan)),
    latitude,
    longitude,
    coverImage: asCleanString(read(FIELD_ALIASES.coverImage)),
    sourceUrl: asCleanString(read(FIELD_ALIASES.sourceUrl)),
    tags: parseTags(read(FIELD_ALIASES.tags)),
  };
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getSearchText(poi: DianpingScenicPoi) {
  return [poi.name, poi.category, poi.address, ...poi.tags].filter(Boolean).join(" ");
}

function resolveEnvironment(poi: DianpingScenicPoi): DianpingScenicActivityDraft["environment"] {
  const text = getSearchText(poi);
  if (containsAny(text, ["博物馆", "美术馆", "科技馆", "纪念馆", "展览馆", "艺术馆", "剧院", "室内"])) return "indoor";
  if (containsAny(text, ["古镇", "老街", "街区", "旅游区", "度假区", "主题公园", "乐园", "动物园", "亲子"])) return "either";
  return "outdoor";
}

function resolveDurationMinutes(poi: DianpingScenicPoi) {
  const text = getSearchText(poi);
  if (containsAny(text, ["主题公园", "乐园", "动物园", "植物园", "度假区", "风景区", "景区"])) return 240;
  if (containsAny(text, ["博物馆", "美术馆", "科技馆", "纪念馆", "展览馆", "艺术馆"])) return 150;
  if (containsAny(text, ["公园", "湿地", "湖", "山", "森林", "古镇", "老街"])) return 180;
  return 150;
}

function resolveBudgetYuan(poi: DianpingScenicPoi) {
  if (poi.avgPriceYuan !== null) return poi.avgPriceYuan;
  const text = getSearchText(poi);
  if (containsAny(text, ["主题公园", "乐园", "度假区"])) return 300;
  if (containsAny(text, ["风景区", "景区", "动物园", "植物园"])) return 120;
  if (containsAny(text, ["博物馆", "美术馆", "科技馆", "纪念馆", "展览馆", "艺术馆"])) return 50;
  return 30;
}

function resolveMoodTags(poi: DianpingScenicPoi, environment: DianpingScenicActivityDraft["environment"]) {
  const tags = new Set<string>(["探索", "放松"]);
  const text = getSearchText(poi);

  if (environment === "indoor" || containsAny(text, ["展", "馆", "艺术", "历史", "文化"])) tags.add("文艺");
  if (containsAny(text, ["拍照", "出片", "打卡", "夜景", "花海", "古镇", "老街"])) tags.add("拍照");
  if (containsAny(text, ["亲子", "动物园", "乐园", "游乐", "萌宠"])) tags.add("社交");
  if (containsAny(text, ["山", "森林", "徒步", "骑行", "攀岩", "漂流"])) tags.add("刺激");

  return Array.from(tags).slice(0, 4);
}

function resolveAccentColor(environment: DianpingScenicActivityDraft["environment"]) {
  if (environment === "indoor") return "#7357FF";
  if (environment === "either") return "#FF7A59";
  return "#28B8A0";
}

function buildNavigationUrl(cityName: string, poi: DianpingScenicPoi) {
  if (poi.sourceUrl) return poi.sourceUrl;
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${cityName} ${poi.name}`)}`;
}

function buildDescription(city: ScenicImportCity, poi: DianpingScenicPoi, address: string) {
  const details = [
    poi.rating !== null ? `评分 ${poi.rating.toFixed(1)}` : null,
    poi.reviewCount !== null ? `${poi.reviewCount} 条评价` : null,
    poi.avgPriceYuan !== null ? `参考人均/门票约 ${poi.avgPriceYuan} 元` : null,
    poi.tags.length > 0 ? `标签：${poi.tags.join("、")}` : null,
  ].filter(Boolean);
  const meta = details.length > 0 ? `参考信息：${details.join("，")}。` : "";
  const category = poi.category ? `分类：${poi.category}。` : "";
  return `来自合法导入的大众点评景区/玩乐数据：${city.name} · ${poi.name}。地址：${address}。${category}${meta}适合想低负担探索城市景点、拍照打卡或安排半日游时使用。`;
}

export function buildDianpingScenicActivityDraft(
  city: ScenicImportCity,
  poi: DianpingScenicPoi | DianpingRawRecord,
): DianpingScenicActivityDraft | null {
  const normalized = "name" in poi && typeof poi.name === "string" ? (poi as DianpingScenicPoi) : normalizeDianpingScenicRecord(poi as DianpingRawRecord);
  if (!normalized) return null;

  const environment = resolveEnvironment(normalized);
  const district = normalized.districtName ?? city.name;
  const address = normalized.address ?? `${city.name} · ${normalized.name}`;
  const budgetYuan = resolveBudgetYuan(normalized);
  const moodTags = resolveMoodTags(normalized, environment);
  const sourceTip = normalized.sourceUrl ? "地点来源：合法导入的大众点评数据，详情以来源页面和现场公告为准" : "地点来源：合法导入的大众点评数据";

  return {
    cityId: city.id,
    title: truncate(normalized.name, 120),
    summary: truncate(`${city.name} · ${district} · 点评景区参考`, 255),
    description: buildDescription(city, normalized, address),
    category: "探索",
    mood: "探索",
    moodTags,
    environment,
    minPartySize: 1,
    maxPartySize: 6,
    durationMinutes: resolveDurationMinutes(normalized),
    budgetYuan,
    cityDistanceKm: 0,
    district: truncate(district, 64),
    address: truncate(address, 255),
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    navigationUrl: buildNavigationUrl(city.name, normalized),
    coverImage: normalized.coverImage,
    steps: [
      `打开地图或来源页面确认“${normalized.name}”`,
      "出发前核对营业时间、预约/门票要求和交通方式",
      "到达后按体力选择轻量游览路线，保留拍照和休息时间",
    ],
    tips: [
      "大众点评类信息可能随时间变化，价格、评分和开放状态以现场或官方公告为准",
      "节假日建议提前查看预约、门票和交通管制信息",
      sourceTip,
    ],
    accentColor: resolveAccentColor(environment),
    sourceId: normalized.sourceId,
    sourceUrl: normalized.sourceUrl,
  };
}

export function getDianpingPoiDedupeKey(poi: DianpingScenicPoi) {
  if (poi.sourceId) return `id:${poi.sourceId}`;
  if (poi.latitude !== null && poi.longitude !== null) {
    return `geo:${poi.name}|${poi.longitude.toFixed(6)},${poi.latitude.toFixed(6)}`;
  }
  return `name:${poi.name}|${poi.address ?? ""}`;
}

export function dedupeDianpingScenicPois(pois: DianpingScenicPoi[]) {
  const seen = new Set<string>();
  const result: DianpingScenicPoi[] = [];

  for (const poi of pois) {
    const key = getDianpingPoiDedupeKey(poi);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(poi);
  }

  return result;
}

export function describeDianpingImportFile(filePath: string) {
  const name = basename(filePath);
  const extension = extname(name).replace(/^\./, "").toUpperCase() || "AUTO";
  return `${name} (${extension})`;
}
