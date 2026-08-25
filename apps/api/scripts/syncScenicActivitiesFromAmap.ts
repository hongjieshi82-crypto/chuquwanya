import mysql, { type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

import { config } from "../src/config.js";
import {
  buildScenicActivityDraft,
  DEFAULT_AMAP_PAGE_LIMIT,
  DEFAULT_AMAP_POI_OFFSET,
  DEFAULT_AMAP_SCENIC_TYPES,
  fetchAmapScenicPois,
  type ScenicActivityDraft,
  type ScenicImportCity,
} from "../src/scenic-activity-import.js";

type CliOptions = {
  cities: string[];
  cityIds: number[];
  keywords: string[];
  types: string;
  limitCities: number | null;
  pageLimit: number;
  offset: number;
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
  fetched: number;
  mapped: number;
  inserted: number;
  updated: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  dryRunCandidates: ScenicActivityDraft[];
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
  if (!next || next.startsWith("--")) {
    throw new Error(`参数 ${key} 需要提供值`);
  }
  return { value: next, nextIndex: index + 1 };
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} 必须是正整数`);
  }
  return parsed;
}

export function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    cities: [],
    cityIds: [],
    keywords: [],
    types: DEFAULT_AMAP_SCENIC_TYPES,
    limitCities: null,
    pageLimit: DEFAULT_AMAP_PAGE_LIMIT,
    offset: DEFAULT_AMAP_POI_OFFSET,
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
    if (arg === "--keywords" || arg.startsWith("--keywords=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--keywords");
      options.keywords.push(...parseList(value));
      index = nextIndex;
      continue;
    }
    if (arg === "--types" || arg.startsWith("--types=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--types");
      options.types = value.trim() || DEFAULT_AMAP_SCENIC_TYPES;
      index = nextIndex;
      continue;
    }
    if (arg === "--limit-cities" || arg.startsWith("--limit-cities=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--limit-cities");
      options.limitCities = parsePositiveInteger(value, "--limit-cities");
      index = nextIndex;
      continue;
    }
    if (arg === "--page-limit" || arg.startsWith("--page-limit=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--page-limit");
      options.pageLimit = parsePositiveInteger(value, "--page-limit");
      index = nextIndex;
      continue;
    }
    if (arg === "--offset" || arg.startsWith("--offset=")) {
      const { value, nextIndex } = readOptionValue(args, index, "--offset");
      options.offset = parsePositiveInteger(value, "--offset");
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

  return options;
}

function printUsage() {
  console.log(`按景区 POI 扩充可玩地数据

用法：
  npm --prefix apps/api run data:sync:scenic -- --city 上海 --dry-run --page-limit 1
  npm --prefix apps/api run data:sync:scenic -- --city 上海,杭州 --types 风景名胜 --max-insert 50

参数：
  --city <城市名或code>          可重复或逗号分隔；不传则读取所有 active 城市
  --city-id <id>                可重复或逗号分隔
  --types <POI类型>             默认：${DEFAULT_AMAP_SCENIC_TYPES}；可填高德 POI 分类汉字或编码
  --keywords <关键词>           可选；可重复或逗号分隔，例如 景区,公园
  --page-limit <页数>           默认：${DEFAULT_AMAP_PAGE_LIMIT}
  --offset <每页条数>           默认：${DEFAULT_AMAP_POI_OFFSET}，高德建议不超过 25
  --limit-cities <城市数>       限制处理城市数量
  --max-insert <条数>           限制本次新增/更新数量
  --dry-run                     只预览，不写入 activities
  --update-existing             重复命中时更新现有活动；默认跳过，避免覆盖手工数据
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

async function findExistingActivity(connection: mysql.Connection, draft: ScenicActivityDraft) {
  const [rows] = await connection.execute<ExistingActivityRow[]>(
    `SELECT id, title, address
     FROM activities
     WHERE city_id = ?
       AND (
         title = ?
         OR (
           latitude IS NOT NULL
           AND longitude IS NOT NULL
           AND ABS(latitude - ?) <= 0.0002
           AND ABS(longitude - ?) <= 0.0002
         )
       )
     LIMIT 1`,
    [draft.cityId, draft.title, draft.latitude, draft.longitude],
  );
  return rows[0] ?? null;
}

async function insertActivity(connection: mysql.Connection, draft: ScenicActivityDraft) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO activities (
       city_id, title, summary, description, category, mood, mood_tags, environment,
       min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
       district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
       accent_color, is_active
     ) VALUES (
       ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON),
       ?, TRUE
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
    ],
  );
  return result.insertId;
}

async function updateActivity(connection: mysql.Connection, activityId: number, draft: ScenicActivityDraft) {
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
      activityId,
    ],
  );
}

async function syncCity(connection: mysql.Connection, city: ScenicImportCity, options: CliOptions): Promise<ImportStats> {
  const pois = await fetchAmapScenicPois({
    key: config.amap.webServiceKey,
    city: city.name,
    types: options.types,
    keywords: options.keywords,
    pageLimit: options.pageLimit,
    offset: options.offset,
  });

  const stats: ImportStats = {
    fetched: pois.length,
    mapped: 0,
    inserted: 0,
    updated: 0,
    skippedDuplicate: 0,
    skippedInvalid: 0,
    dryRunCandidates: [],
  };

  for (const poi of pois) {
    if (options.maxInsert !== null && stats.inserted + stats.updated >= options.maxInsert) break;

    const draft = buildScenicActivityDraft(city, poi);
    if (!draft) {
      stats.skippedInvalid += 1;
      continue;
    }
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

function logCityResult(city: ScenicImportCity, stats: ImportStats, dryRun: boolean) {
  const prefix = dryRun ? "[DRY-RUN]" : "[DONE]";
  console.log(
    `${prefix} ${city.name}：拉取 ${stats.fetched} 个 POI，映射 ${stats.mapped} 个，` +
      `${dryRun ? "预计新增" : "新增"} ${stats.inserted} 个，` +
      `${dryRun ? "预计更新" : "更新"} ${stats.updated} 个，重复跳过 ${stats.skippedDuplicate} 个，无效跳过 ${stats.skippedInvalid} 个`,
  );

  if (dryRun && stats.dryRunCandidates.length > 0) {
    for (const draft of stats.dryRunCandidates.slice(0, 8)) {
      console.log(`  - ${draft.title}｜${draft.district}｜${draft.environment}｜${draft.budgetYuan}元｜${draft.address}`);
    }
    if (stats.dryRunCandidates.length > 8) {
      console.log(`  ... 另有 ${stats.dryRunCandidates.length - 8} 条未展示`);
    }
  }
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  if (!config.amap.webServiceKey) {
    throw new Error("缺少 AMAP_WEB_SERVICE_KEY，请先在 apps/api/.env 配置高德 Web 服务 Key");
  }

  const connection = await mysql.createConnection(config.database);
  try {
    const cities = await loadCities(connection, options);
    if (cities.length === 0) {
      throw new Error("没有找到符合条件的 active 城市，请检查 --city / --city-id 或 cities 表数据");
    }

    console.log(
      `开始按景区 POI 扩充可玩地：城市=${cities.map((city) => city.name).join("、")}，types=${options.types}，` +
        `keywords=${options.keywords.length > 0 ? options.keywords.join("、") : "(不限定)"}，dryRun=${options.dryRun}`,
    );

    const totals: ImportStats = {
      fetched: 0,
      mapped: 0,
      inserted: 0,
      updated: 0,
      skippedDuplicate: 0,
      skippedInvalid: 0,
      dryRunCandidates: [],
    };

    for (const city of cities) {
      const stats = await syncCity(connection, city, options);
      logCityResult(city, stats, options.dryRun);
      totals.fetched += stats.fetched;
      totals.mapped += stats.mapped;
      totals.inserted += stats.inserted;
      totals.updated += stats.updated;
      totals.skippedDuplicate += stats.skippedDuplicate;
      totals.skippedInvalid += stats.skippedInvalid;
    }

    console.log(
      `汇总：拉取 ${totals.fetched} 个，映射 ${totals.mapped} 个，` +
        `${options.dryRun ? "预计新增" : "新增"} ${totals.inserted} 个，` +
        `${options.dryRun ? "预计更新" : "更新"} ${totals.updated} 个，重复跳过 ${totals.skippedDuplicate} 个，无效跳过 ${totals.skippedInvalid} 个`,
    );

    if (!options.dryRun && (totals.inserted > 0 || totals.updated > 0)) {
      console.log("提示：如需让新可玩地进入语义抽取，可继续运行 npm --prefix apps/api run vectors:sync:activities");
    }
  } finally {
    await connection.end();
  }
}

await main();
