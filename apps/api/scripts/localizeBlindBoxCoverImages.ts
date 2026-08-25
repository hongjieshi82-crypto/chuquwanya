import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

import mysql from "mysql2/promise";

import { config } from "../src/config.js";

type BlindBoxCoverRow = {
  id: number;
  title: string;
  cover_image: string;
};

type DownloadedCover = {
  id: number;
  title: string;
  sourceUrl: string;
  localPath: string;
  filePath: string;
};

type FailedCover = {
  id: number;
  title: string;
  sourceUrl: string;
  reason: string;
};

const uploadsDir = resolve(process.cwd(), "uploads", "activity-covers", "blind-box");
const migrationPath = resolve(
  process.cwd(),
  "..",
  "..",
  "database",
  "migrations",
  "022_localize_blind_box_cover_images.sql",
);
const MAX_CONCURRENCY = 1;
const DOWNLOAD_TIMEOUT_MS = 20_000;
const DOWNLOAD_RETRIES = 1;
const DOWNLOAD_DELAY_MS = 1_500;

function sqlString(value: string) {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function slugify(value: string) {
  const ascii = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (ascii) return ascii.slice(0, 48);
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function extensionFromContentType(contentType: string | null) {
  if (!contentType) return null;
  const normalized = contentType.split(";")[0]?.trim().toLowerCase();
  switch (normalized) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return null;
  }
}

function extensionFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const ext = extname(basename(decodeURIComponent(url.pathname))).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? (ext === ".jpeg" ? ".jpg" : ext) : null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "lazy2move-image-localizer/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function wikimediaThumbnailUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === "commons.wikimedia.org" && url.pathname.includes("/wiki/Special:FilePath/")) {
      url.searchParams.set("width", "640");
      return url.toString();
    }

    if (url.hostname === "upload.wikimedia.org") {
      const filename = basename(decodeURIComponent(url.pathname));
      if (filename) {
        const thumbUrl = new URL(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`);
        thumbUrl.searchParams.set("width", "640");
        return thumbUrl.toString();
      }
    }
  } catch {
    return null;
  }

  return null;
}

function candidateUrls(rawUrl: string) {
  const thumbUrl = wikimediaThumbnailUrl(rawUrl);
  if (thumbUrl) {
    return [thumbUrl];
  }
  return [rawUrl];
}

async function fetchImageWithRetry(url: string) {
  let lastError: unknown;
  for (const candidateUrl of candidateUrls(url)) {
    for (let attempt = 1; attempt <= DOWNLOAD_RETRIES; attempt += 1) {
      try {
        if (attempt > 1) {
          await sleep(DOWNLOAD_DELAY_MS * attempt * attempt);
        } else {
          await sleep(DOWNLOAD_DELAY_MS);
        }

        const response = await fetchWithTimeout(candidateUrl);
        if (response.ok) return response;

        const retryable = response.status === 429 || response.status >= 500;
        lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
        if (!retryable) throw lastError;

        if (response.status === 429 && attempt < DOWNLOAD_RETRIES) {
          await sleep(15_000 * attempt);
        }
      } catch (error) {
        lastError = error;
        if (attempt === DOWNLOAD_RETRIES) break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function downloadCover(row: BlindBoxCoverRow): Promise<DownloadedCover> {
  const response = await fetchImageWithRetry(row.cover_image);

  const arrayBuffer = await response.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  if (bytes.length === 0) {
    throw new Error("empty image response");
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    throw new Error(`unexpected content-type ${contentType}`);
  }

  const ext = extensionFromContentType(contentType) ?? extensionFromUrl(response.url) ?? extensionFromUrl(row.cover_image) ?? ".jpg";
  const filename = `${String(row.id).padStart(4, "0")}-${slugify(row.title)}${ext}`;
  const filePath = resolve(uploadsDir, filename);
  const localPath = `/uploads/activity-covers/blind-box/${filename}`;

  await writeFile(filePath, bytes);

  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.cover_image,
    localPath,
    filePath,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function buildMigration(downloaded: DownloadedCover[]) {
  return [
    "-- Localize blind-box activity cover images under apps/api/assets.",
    "-- Generated by apps/api/scripts/localizeBlindBoxCoverImages.ts.",
    "",
    ...downloaded.flatMap((item) => [
      `UPDATE activities`,
      `SET cover_image = ${sqlString(item.localPath)}`,
      `WHERE id = ${item.id}`,
      `  AND description LIKE '来自《出行盲盒地点库%'`,
      `  AND cover_image = ${sqlString(item.sourceUrl)};`,
      "",
    ]),
  ].join("\n");
}

const connection = await mysql.createConnection(config.database);

try {
  await mkdir(uploadsDir, { recursive: true });

  const [rows] = await connection.execute(
    `SELECT id, title, cover_image
     FROM activities
     WHERE description LIKE '来自《出行盲盒地点库%'
       AND cover_image REGEXP '^https?://'
     ORDER BY id ASC`,
  );

  const covers = rows as BlindBoxCoverRow[];
  if (covers.length === 0) {
    console.log("没有需要本地化的盲盒远程图片。");
    process.exit(0);
  }

  let completed = 0;
  const failures: FailedCover[] = [];
  const results = await mapWithConcurrency(covers, MAX_CONCURRENCY, async (row) => {
    try {
      const item = await downloadCover(row);
      completed += 1;
      console.log(`[${completed}/${covers.length}] ${row.id} ${row.title} -> ${item.localPath}`);
      return item;
    } catch (error) {
      completed += 1;
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({
        id: row.id,
        title: row.title,
        sourceUrl: row.cover_image,
        reason,
      });
      console.warn(`[${completed}/${covers.length}] ${row.id} ${row.title} 下载失败：${reason}`);
      return null;
    }
  });
  const downloaded = results.filter((item): item is DownloadedCover => item !== null);

  for (const item of downloaded) {
    await connection.execute(
      `UPDATE activities
       SET cover_image = ?
       WHERE id = ?
         AND description LIKE '来自《出行盲盒地点库%'
         AND cover_image = ?`,
      [item.localPath, item.id, item.sourceUrl],
    );
  }

  if (downloaded.length > 0) {
    await writeFile(migrationPath, buildMigration(downloaded), "utf8");
  }

  console.log(`盲盒图片本地化完成：${downloaded.length}/${covers.length} 张`);
  if (downloaded.length > 0) {
    console.log(`迁移文件：${migrationPath}`);
  }
  if (failures.length > 0) {
    console.warn("以下图片仍需人工补源：");
    for (const failure of failures) {
      console.warn(`- ${failure.id} ${failure.title}: ${failure.reason} (${failure.sourceUrl})`);
    }
  }
} finally {
  await connection.end();
}
