import { readFile } from "node:fs/promises";

import mysql, { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import { config } from "../src/config.js";
import {
  buildDianpingScenicActivityDraft,
  dedupeDianpingScenicPois,
  describeDianpingImportFile,
  getDianpingPoiDedupeKey,
  normalizeDianpingScenicRecord,
  parseDianpingScenicExport,
  type DianpingScenicActivityDraft,
  type DianpingScenicPoi,
} from "../src/dianping-scenic-import.js";
import type { ScenicImportCity } from "../src/scenic-activity-import.js";

type CliOptions = {
  file: string | null;
  cities: string[];
  cityIds: number[];
  limitCities: number | null;
  maxInsert: number | null;
  dryRun: boolean;
  updateExisting: boolean;
};

type CityRow = RowDataPacket & ScenicImportCity;

type ExistingActivityRow = RowDataPacket & {
  id: number;
  title: string;
  address: string;
};

type ImportStats = {
  read: number;
  normalized: number;
  mapped: number;
  inserted: number;
  updated: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  skippedNoCity: number;
  dryRunCandidates: DianpingScenicActivityDraft[];
};

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readOptionValue(args: string[], index: number, key: string) {
  const current = args[index];
  const prefix = `${key}=`;
  if (current?.startsWith(prefix)) return { value: current.slice(prefix.length), nextIndex: index };
  const next = args[index + 1];
  if (!next || next.startsWith("--")) throw new Error(`参数 ${key} 需要提供值`);
  return { value: next, nextIndex: index + 1 };
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} 必须是正整数`);
  return parsed;
}

export function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    file: null,
    cities: [],
    cityIds: [],
    limitCities: null,
    maxInsert: null,
    dryRun: false,
    updateExisting: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) continue;

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--update-existing") {
      options.updateExisting = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--file" || arg.startsWith("--file=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--file");
      options.file = value.trim();
      index = nextIndex;
      continue;
    }
    if (arg === "--city" || arg.startsWith("--city=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--city");
      options.cities.push(...parseList(value));
      index = nextIndex;
      continue;
    }
    if (arg === "--city-id" || arg.startsWith("--city-id=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--city-id");
      options.cityIds.push(...parseList(value).map((item) => parsePositiveInteger(item, "--city-id")));
      index = nextIndex;
      continue;
    }
    if (arg === "--limit-cities" || arg.startsWith("--limit-cities=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--limit-cities");
      options.limitCities = parsePositiveInteger(value, "--limit-cities");
      index = nextIndex;
      continue;
    }
    if (arg === "--max-insert" || arg.startsWith("--max-insert=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--max-insert");
      options.maxInsert = parsePositiveInteger(value, "--max-insert");
      index = nextIndex;
      continue;
    }

    throw new Error(`未知参数：${arg}`);
  }

  if (!options.file) throw new Error("缺少 --file，请提供已授权导出的 CSV / JSON / JSONL 文件");
  return options;
}

function printUsage() {
  console.log(`导入已授权的大众点评景区/玩乐数据

说明：
  本脚本只读取你已合法取得并放在本地的 CSV / JSON / JSONL 文件；不会抓取大众点评网页、非公开接口或登录态数据。

用法：
  npm --prefix apps/api run data:import:dianping-scenic -- --file ./data/dianping-scenic.csv --dry-run --city 上海
  npm --prefix apps/api run data:import:dianping-scenic -- --file ./data/dianping-scenic.jsonl --max-insert 100

常用字段：
  city/name/district/address/category/rating/review_count/avg_price/latitude/longitude/cover_image/source_url/tags
  也支持中文表头：城市、景点名称、区县、地址、分类、评分、评价数、人均、纬度、经度、封面、点评链接、标签

参数：
  --file <路径>                必填；CSV / JSON / JSONL，本地合法导出文件
  --city <城市名或code>        可重复或逗号分隔；用于限制城市，且单城市时可为缺 city 字段的数据补齐城市
  --city-id <城市ID>           可重复或逗号分隔
  --limit-cities <城市数>      限制处理城市数量
  --max-insert <条数>          限制本次新增/更新数量
  --dry-run                   只预览，不写入 activities
  --update-existing           重复命中时更新现有活动；默认跳过，避免覆盖手工数据
`);
}

function placeholders(count: number) {
  return Array.from({ length: count }, () => "?").join(", ");
}

async function loadCities(connection: mysql.Connection, options: CliOptions) {
  const where: string[] = ["is_active = TRUE"];
  const params: Array<string | number> = [];

  if (options.cityIds.length > 0) {
    where.push(`id IN (${placeholders(options.cityIds.length)})`);
    params.push(...options.cityIds);
  }

  if (options.cities.length > 0) {
    where.push(`(name IN (${placeholders(options.cities.length)}) OR code IN (${placeholders(options.cities.length)}))`);
    params.push(...options.cities, ...options.cities);
  }

  const limitSql = options.limitCities === null ? "" : " LIMIT ?";
  if (options.limitCities !== null) params.push(options.limitCities);

  const [rows] = await connection.execute<CityRow[]>(
    `SELECT id, name, code, province
     FROM cities
     WHERE ${where.join(" AND ")}
     ORDER BY id ASC${limitSql}`,
    params,
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    code: row.code ? String(row.code) : null,
    province: row.province ? String(row.province) : null,
  } satisfies ScenicImportCity));
}

function normalizeCityName(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/市$/u, "")
    .replace(/特别行政区$/u, "")
    .replace(/地区$/u, "")
    .toLowerCase();
}

function resolveCityForPoi(poi: DianpingScenicPoi, cities: ScenicImportCity[]) {
  if (poi.cityName) {
    const normalizedPoiCity = normalizeCityName(poi.cityName);
    return (
      cities.find((city) => normalizeCityName(city.name) === normalizedPoiCity || normalizeCityName(city.code) === normalizedPoiCity) ?? null
    );
  }

  return cities.length === 1 ? cities[0] ?? null : null;
}

async function findExistingActivity(connection: mysql.Connection, draft: DianpingScenicActivityDraft) {
  const predicates = ["title = ?"];
  const params: Array<string | number> = [draft.cityId, draft.title];

  if (draft.address) {
    predicates.push("address = ?");
    params.push(draft.address);
  }

  if (draft.latitude !== null && draft.longitude !== null) {
    predicates.push(`(
      latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND ABS(latitude - ?) <= 0.0002
      AND ABS(longitude - ?) <= 0.0002
    )`);
    params.push(draft.latitude, draft.longitude);
  }

  const [rows] = await connection.execute<ExistingActivityRow[]>(
    `SELECT id, title, address
     FROM activities
     WHERE city_id = ?
       AND (${predicates.join(" OR ")})
     LIMIT 1`,
    params,
  );

  return rows[0] ?? null;
}

async function insertActivity(connection: mysql.Connection, draft: DianpingScenicActivityDraft) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO activities (
       city_id, title, summary, description, category, mood, mood_tags, environment,
       min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
       district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
       accent_color, is_active, rain_friendly, heat_sensitive, wind_sensitive, weather_notes,
       reservation_required, content_status, content_score, quality_issues, source_type, source_url
     ) VALUES (
       ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON),
       ?, TRUE, ?, ?, ?, ?,
       'unknown', 'review', 65, CAST(? AS JSON), 'dianping_import', ?
     )`,
    [
      draft.cityId,
      draft.title,
      draft.summary,
      draft.description,
      draft.category,
      draft.mood,
      JSON.stringify(draft.moodTags),
      draft.environment,
      draft.minPartySize,
      draft.maxPartySize,
      draft.durationMinutes,
      draft.budgetYuan,
      draft.cityDistanceKm,
      draft.district,
      draft.address,
      draft.latitude,
      draft.longitude,
      draft.navigationUrl,
      draft.coverImage,
      JSON.stringify(draft.steps),
      JSON.stringify(draft.tips),
      draft.accentColor,
      draft.environment === "outdoor" ? "no" : "yes",
      draft.environment === "outdoor" ? "yes" : "no",
      draft.environment === "outdoor" ? "yes" : "no",
      "导入数据的天气适用性为初步推断，发布前需人工确认",
      JSON.stringify(["营业时间未核验", "预约要求未核验", "天气适用性需人工确认"]),
      draft.sourceUrl ?? draft.navigationUrl,
    ],
  );
  return result.insertId;
}

async function updateActivity(connection: mysql.Connection, activityId: number, draft: DianpingScenicActivityDraft) {
  await connection.execute(
    `UPDATE activities
     SET summary = ?,
         description = ?,
         category = ?,
         mood = ?,
         mood_tags = CAST(? AS JSON),
         environment = ?,
         min_party_size = ?,
         max_party_size = ?,
         duration_minutes = ?,
         budget_yuan = ?,
         city_distance_km = ?,
         district = ?,
         address = ?,
         latitude = ?,
         longitude = ?,
         navigation_url = ?,
         cover_image = COALESCE(?, cover_image),
         steps = CAST(? AS JSON),
         tips = CAST(? AS JSON),
         accent_color = ?,
         rain_friendly = ?,
         heat_sensitive = ?,
         wind_sensitive = ?,
         weather_notes = ?,
         reservation_required = 'unknown',
         content_status = 'review',
         content_score = 65,
         quality_issues = CAST(? AS JSON),
         source_type = 'dianping_import',
         source_url = ?,
         is_active = TRUE,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      draft.summary,
      draft.description,
      draft.category,
      draft.mood,
      JSON.stringify(draft.moodTags),
      draft.environment,
      draft.minPartySize,
      draft.maxPartySize,
      draft.durationMinutes,
      draft.budgetYuan,
      draft.cityDistanceKm,
      draft.district,
      draft.address,
      draft.latitude,
      draft.longitude,
      draft.navigationUrl,
      draft.coverImage,
      JSON.stringify(draft.steps),
      JSON.stringify(draft.tips),
      draft.accentColor,
      draft.environment === "outdoor" ? "no" : "yes",
      draft.environment === "outdoor" ? "yes" : "no",
      draft.environment === "outdoor" ? "yes" : "no",
      "导入数据的天气适用性为初步推断，发布前需人工确认",
      JSON.stringify(["营业时间未核验", "预约要求未核验", "天气适用性需人工确认"]),
      draft.sourceUrl ?? draft.navigationUrl,
      activityId,
    ],
  );
}

async function importPois(connection: mysql.Connection, pois: DianpingScenicPoi[], cities: ScenicImportCity[], options: CliOptions) {
  const stats: ImportStats = {
    read: pois.length,
    normalized: pois.length,
    mapped: 0,
    inserted: 0,
    updated: 0,
    skippedDuplicate: 0,
    skippedInvalid: 0,
    skippedNoCity: 0,
    dryRunCandidates: [],
  };
  const seenDraftKeys = new Set<string>();

  for (const poi of pois) {
    if (options.maxInsert !== null && stats.inserted + stats.updated >= options.maxInsert) break;

    const city = resolveCityForPoi(poi, cities);
    if (!city) {
      stats.skippedNoCity += 1;
      continue;
    }

    const draft = buildDianpingScenicActivityDraft(city, poi);
    if (!draft) {
      stats.skippedInvalid += 1;
      continue;
    }

    const draftKey = `${city.id}|${getDianpingPoiDedupeKey(poi)}`;
    if (seenDraftKeys.has(draftKey)) {
      stats.skippedDuplicate += 1;
      continue;
    }
    seenDraftKeys.add(draftKey);
    stats.mapped += 1;

    const existing = await findExistingActivity(connection, draft);
    if (existing && !options.updateExisting) {
      stats.skippedDuplicate += 1;
      continue;
    }

    if (options.dryRun) {
      stats.dryRunCandidates.push(draft);
      if (existing) stats.updated += 1;
      else stats.inserted += 1;
      continue;
    }

    if (existing) {
      await updateActivity(connection, Number(existing.id), draft);
      stats.updated += 1;
    } else {
      await insertActivity(connection, draft);
      stats.inserted += 1;
    }
  }

  return stats;
}

function logResult(stats: ImportStats, dryRun: boolean) {
  const prefix = dryRun ? "[DRY-RUN]" : "[DONE]";
  console.log(
    `${prefix} 读取 ${stats.read} 条，标准化 ${stats.normalized} 条，映射 ${stats.mapped} 条，` +
      `${dryRun ? "预计新增" : "新增"} ${stats.inserted} 条，` +
      `${dryRun ? "预计更新" : "更新"} ${stats.updated} 条，` +
      `重复跳过 ${stats.skippedDuplicate} 条，无效跳过 ${stats.skippedInvalid} 条，城市未匹配 ${stats.skippedNoCity} 条`,
  );

  if (dryRun && stats.dryRunCandidates.length > 0) {
    for (const draft of stats.dryRunCandidates.slice(0, 8)) {
      const location = draft.latitude !== null && draft.longitude !== null ? `${draft.longitude},${draft.latitude}` : "无坐标";
      console.log(`  - ${draft.title}｜${draft.district}｜${draft.environment}｜${draft.budgetYuan}元｜${location}｜${draft.address}`);
    }
    if (stats.dryRunCandidates.length > 8) {
      console.log(`  ... 另有 ${stats.dryRunCandidates.length - 8} 条未展示`);
    }
  }
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const filePath = options.file;
  if (!filePath) throw new Error("缺少 --file，请提供已授权导出的 CSV / JSON / JSONL 文件");

  const content = await readFile(filePath, "utf8");
  const rawRecords = parseDianpingScenicExport(content, { fileName: filePath });
  const normalizedPois = rawRecords
    .map((record) => normalizeDianpingScenicRecord(record))
    .filter((poi): poi is DianpingScenicPoi => Boolean(poi));
  const pois = dedupeDianpingScenicPois(normalizedPois);

  const connection = await mysql.createConnection(config.database);
  try {
    const cities = await loadCities(connection, options);
    if (cities.length === 0) {
      throw new Error("没有找到符合条件的 active 城市，请检查 --city / --city-id 或 cities 表数据");
    }

    console.log(
      `开始导入大众点评景区/玩乐数据：文件=${describeDianpingImportFile(filePath)}，` +
        `城市范围=${cities.map((city) => city.name).join("、")}，dryRun=${options.dryRun}`,
    );
    console.log(`文件解析 ${rawRecords.length} 条，标准化有效 ${normalizedPois.length} 条，文件内去重后 ${pois.length} 条`);

    const stats = await importPois(connection, pois, cities, options);
    stats.read = rawRecords.length;
    stats.normalized = normalizedPois.length;
    logResult(stats, options.dryRun);

    if (!options.dryRun && (stats.inserted > 0 || stats.updated > 0)) {
      console.log("提示：如需让新可玩地进入语义抽取，可继续运行 npm --prefix apps/api run vectors:sync:activities");
    }
  } finally {
    await connection.end();
  }
}

await main();
