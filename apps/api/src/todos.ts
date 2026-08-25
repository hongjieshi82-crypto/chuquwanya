import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Express, NextFunction, Request, Response } from "express";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { z } from "zod";

import { verifyAuthToken } from "./auth.js";
import { pool, withTransaction } from "./db.js";
import { AppError } from "./errors.js";
import { parseJsonArray } from "./types.js";

const todoStatusValues = ["pending", "in_progress", "completed", "cancelled"] as const;
const todoVisibilityValues = ["private", "public_requested"] as const;
const todoHistoryStatuses = ["completed", "expired", "abandoned"] as const;
const todoReviewStatuses = ["pending", "approved", "rejected"] as const;
const todoDiaryVisibilityValues = ["private", "public_requested", "public"] as const;
const allowedAttachmentMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
]);
const maxAttachmentBytes = 20 * 1024 * 1024;
const attachmentUploadMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
const attachmentUploadMaxBytes = 20 * 1024 * 1024;
const freeWeeklyTodoLimit = 1;
const vipWeeklyTodoLimit = 3;
const chinaTimeOffsetMs = 8 * 60 * 60 * 1_000;
const completionUploadDir = resolve(process.cwd(), "uploads", "completion");

const attachmentMimeExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
} as const;

type CompletionAttachmentMimeType = keyof typeof attachmentMimeExtensions;

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD");
function parseListQueryValues(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}

const historyFilterStatusSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim());
  }

  return value;
}, z.array(z.enum(todoHistoryStatuses)).optional());

const createTodoSchema = z.object({
  userId: z.number().int().positive().optional(),
  activityId: z.number().int().positive(),
  drawSessionId: z.string().uuid().nullable().optional(),
  scheduledDate: dateKeySchema.optional(),
});

const todoQuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const historyQuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  status: historyFilterStatusSchema,
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const diaryQuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  keyword: z.string().trim().max(80).optional(),
  sort: z.enum(["latest", "popular"]).default("latest"),
  favoritesOnly: z.preprocess(
    (value) => value === true || value === "true",
    z.boolean(),
  ).default(false),
  visibility: z
    .preprocess(parseListQueryValues, z.array(z.enum(todoDiaryVisibilityValues)).optional())
    .optional(),
  reviewStatus: z
    .preprocess(parseListQueryValues, z.array(z.enum(todoReviewStatuses)).optional())
    .optional(),
  moods: z
    .preprocess(parseListQueryValues, z.array(z.string().trim().min(1).max(32)).optional())
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const updateTodoSchema = z.object({
  userId: z.number().int().positive().optional(),
  status: z.enum(todoStatusValues),
});

const attachmentSchema = z.object({
  objectKey: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .regex(/^[a-zA-Z0-9/_\-.]+$/, "附件路径格式不正确")
    .refine((value) => !value.includes(".."), "附件路径不能包含上级目录"),
  mimeType: z.string().trim().max(80).refine((value) => allowedAttachmentMimeTypes.has(value), {
    message: "仅支持 jpg、png、webp 图片或 mp4 视频",
  }),
  sizeBytes: z.number().int().positive().max(maxAttachmentBytes),
  checksum: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
});

const completionSchema = z.object({
  feelingText: z.string().trim().min(1).max(500),
  visibility: z.enum(todoVisibilityValues).default("private"),
  attachments: z.array(attachmentSchema).max(6).default([]),
});

const attachmentUploadSchema = z.object({
  mediaBase64: z.string().min(1, "请上传完成凭证"),
  mimeType: z.string().trim().max(80).optional(),
});
const diaryCommentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
const diaryCommentCreateSchema = z.object({
  body: z.string().trim().min(1).max(500),
  parentCommentId: z.coerce.number().int().positive().optional(),
});
const diaryCommentLikeSchema = z.object({
  action: z.enum(["like", "unlike"]),
});
const diaryLikeSchema = z.object({
  action: z.enum(["like", "unlike"]),
});
const diaryFavoriteSchema = z.object({
  action: z.enum(["favorite", "unfavorite"]),
});
const diaryHiddenSchema = z.object({
  action: z.enum(["hide", "unhide"]),
});
const diaryReportSchema = z.object({
  reason: z.enum(["spam", "harassment", "false_information", "inappropriate", "other"]),
  detail: z.string().trim().max(300).optional(),
});
const communityFollowSchema = z.object({
  action: z.enum(["follow", "unfollow"]),
});

type TodoStatus = (typeof todoStatusValues)[number];

type TodoRow = {
  id: number;
  status: TodoStatus;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  cancelledAt: Date | string | null;
  submittedAt: Date | string | null;
  reviewStatus: "none" | "pending" | "approved" | "rejected";
  createdAt: Date | string;
  scheduledDate: Date | string;
  weekStartDate: Date | string;
  activityId: number;
  title: string;
  summary: string;
  durationMinutes: number;
  budgetYuan: number;
  district: string;
  address: string;
  navigationUrl: string | null;
  accentColor: string;
  cityName: string;
};

type TodoHistoryRow = {
  id: number;
  status: TodoStatus;
  completedAt: Date | string | null;
  cancelledAt: Date | string | null;
  scheduledDate: Date | string;
  createdAt: Date | string;
  title: string;
  summary: string;
  district: string;
  cityName: string;
};

type DiarySubmissionRow = {
  id: number;
  todoId: number;
  authorId: number;
  authorName: string;
  authorAvatarUri: string | null;
  feelingText: string;
  mood: string;
  moodTags: string | string[] | null;
  visibility: (typeof todoDiaryVisibilityValues)[number];
  reviewStatus: (typeof todoReviewStatuses)[number];
  submittedAt: Date | string;
  scheduledDate: Date | string;
  title: string;
  summary: string;
  district: string;
  cityName: string;
  attachmentCount: number | string;
  commentCount: number | string;
  likes?: number | string;
  isLikedByMe?: number | boolean;
  isFavoritedByMe?: number | boolean;
};

type DiaryAttachmentRow = {
  submissionId: number;
  objectKey: string;
  mimeType: string;
};

type DiaryAttachmentItem = {
  uri: string;
  mimeType: string;
};

type HistoryTodoStatus = (typeof todoHistoryStatuses)[number];

type Entitlement = {
  tier: "free" | "vip";
  weeklyTodoLimit: number;
};

type DiaryCommentRow = {
  id: number;
  diaryId: number;
  parentCommentId: number | null;
  replyToCommentId: number | null;
  replyToAuthor: string | null;
  userId: number;
  author: string;
  authorAvatarUri: string | null;
  body: string;
  createdAt: Date | string;
  likes: number | string;
  replyCount: number | string;
  isLikedByMe: number | boolean;
};

type DiaryCommentItem = {
  id: number;
  diaryId: number;
  parentCommentId: number | null;
  replyToCommentId: number | null;
  replyToAuthor: string | null;
  userId: number;
  author: string;
  authorAvatarUri: string | null;
  body: string;
  createdAt: string;
  likes: number;
  replyCount: number;
  isLikedByMe: boolean;
  replies: DiaryCommentItem[];
};

type DiaryCommentListResult = {
  items: DiaryCommentItem[];
  total: number;
  topLevelTotal: number;
  limit: number;
  offset: number;
};

type CommunityAuthorRow = {
  id: number;
  name: string;
  avatarUri: string | null;
  diaryCount: number | string;
  followerCount: number | string;
  isFollowedByMe: number | boolean | null;
};

type CommunityTopicRow = {
  mood: string;
  moodTags: string | string[] | null;
};

type DiaryCommentLikeResult = {
  id: number;
  likes: number;
  isLikedByMe: boolean;
};
type DiaryLikeResult = {
  id: number;
  likes: number;
  isLikedByMe: boolean;
};

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function padDateUnit(value: number) {
  return String(value).padStart(2, "0");
}

function formatUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${padDateUnit(date.getUTCMonth() + 1)}-${padDateUnit(
    date.getUTCDate(),
  )}`;
}

function publicBaseUrl(request: Request) {
  const host = request.headers.host || "localhost";
  const proto = request.headers["x-forwarded-proto"] || request.protocol;
  return `${proto}://${host}`;
}

function completionUploadUrl(request: Request, objectKey: string) {
  return `${publicBaseUrl(request)}/uploads/${objectKey}`;
}

function detectAttachmentMimeType(
  buffer: Buffer,
  hintMimeType?: string,
): CompletionAttachmentMimeType {
  if (hintMimeType && attachmentUploadMimeTypes.has(hintMimeType)) {
    return hintMimeType as CompletionAttachmentMimeType;
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }

  if (buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }

  if (buffer.length >= 12) {
    if (buffer.slice(0, 4).toString("ascii") === "RIFF") {
      if (buffer.slice(8, 12).toString("ascii") === "WEBP") {
        return "image/webp";
      }
      if (buffer.slice(4, 8).toString("ascii") === "ftyp") {
        return "video/mp4";
      }
    }
  }

  throw new AppError(
    400,
    "INVALID_ATTACHMENT_TYPE",
    "仅支持 jpg、png、webp 图片或 mp4 视频",
  );
}

function parseCompletionMedia(input: z.infer<typeof attachmentUploadSchema>) {
  const dataUrlMatch = input.mediaBase64.match(/^data:[^;,]+;base64,(.+)$/s);
  const compactBase64 = (dataUrlMatch?.[1] ?? input.mediaBase64).replace(/\s/g, "");

  const buffer = Buffer.from(compactBase64, "base64");
  if (buffer.byteLength === 0) {
    throw new AppError(400, "INVALID_ATTACHMENT_IMAGE", "完成凭证不能为空");
  }

  if (buffer.byteLength > attachmentUploadMaxBytes) {
    throw new AppError(413, "ATTACHMENT_TOO_LARGE", "完成凭证不能超过 20MB");
  }

  const hintMimeType = input.mimeType?.trim();
  const mimeType = detectAttachmentMimeType(buffer, hintMimeType);

  return {
    buffer,
    mimeType,
    extension: attachmentMimeExtensions[mimeType],
  };
}

function assertValidDateKey(dateKey: string) {
  const parsed = dateKeySchema.parse(dateKey);
  const year = Number(parsed.slice(0, 4));
  const month = Number(parsed.slice(5, 7));
  const day = Number(parsed.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(400, "INVALID_DATE", "约定日期不存在");
  }

  return parsed;
}

function dateKeyToUtcDate(dateKey: string) {
  const parsed = assertValidDateKey(dateKey);
  const year = Number(parsed.slice(0, 4));
  const month = Number(parsed.slice(5, 7));
  const day = Number(parsed.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day));
}

export function toChinaDateKey(date = new Date()) {
  return formatUtcDate(new Date(date.getTime() + chinaTimeOffsetMs));
}

export function getWeekStartDateKey(dateKey: string) {
  const date = dateKeyToUtcDate(dateKey);
  const mondayBasedDayIndex = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayBasedDayIndex);
  return formatUtcDate(date);
}

export function isDateKeyInSameWeek(dateKey: string, referenceDateKey = toChinaDateKey()) {
  return getWeekStartDateKey(dateKey) === getWeekStartDateKey(referenceDateKey);
}

export function isDateKeyTodayOrLater(dateKey: string, referenceDateKey = toChinaDateKey()) {
  assertValidDateKey(dateKey);
  assertValidDateKey(referenceDateKey);
  return dateKey >= referenceDateKey;
}

function addDays(dateKey: string, days: number) {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

export function buildWeekWindow(dateKey = toChinaDateKey()) {
  const today = assertValidDateKey(dateKey);
  const weekStartDate = getWeekStartDateKey(today);

  return {
    today,
    weekStartDate,
    weekEndDate: addDays(weekStartDate, 6),
  };
}

function normalizeDateValue(value: Date | string | null) {
  if (value === null) {
    return null;
  }
  if (value instanceof Date) {
    return formatUtcDate(value);
  }
  return value.slice(0, 10);
}

function normalizeDateTimeValue(value: Date | string | null) {
  return value instanceof Date ? value.toISOString() : value;
}

function toTodoDto(row: TodoRow) {
  return {
    id: row.id,
    status: row.status,
    startedAt: normalizeDateTimeValue(row.startedAt),
    completedAt: normalizeDateTimeValue(row.completedAt),
    cancelledAt: normalizeDateTimeValue(row.cancelledAt),
    submittedAt: normalizeDateTimeValue(row.submittedAt),
    reviewStatus: row.reviewStatus,
    createdAt: normalizeDateTimeValue(row.createdAt),
    scheduledDate: normalizeDateValue(row.scheduledDate),
    weekStartDate: normalizeDateValue(row.weekStartDate),
    activityId: row.activityId,
    title: row.title,
    summary: row.summary,
    durationMinutes: row.durationMinutes,
    budgetYuan: row.budgetYuan,
    district: row.district,
    address: row.address,
    navigationUrl: row.navigationUrl,
    accentColor: row.accentColor,
    cityName: row.cityName,
  };
}

function buildHistoryStatus(row: Pick<TodoHistoryRow, "status" | "scheduledDate">, today: string): HistoryTodoStatus {
  if (row.status === "completed") {
    return "completed";
  }

  const scheduledDate = normalizeDateValue(row.scheduledDate);
  if (!scheduledDate) {
    return "abandoned";
  }

  return scheduledDate < today ? "expired" : "abandoned";
}

function toTodoHistoryDto(row: TodoHistoryRow, today: string) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    date: normalizeDateValue(row.scheduledDate),
    status: buildHistoryStatus(row, today),
  };
}

function toDiaryAttachmentUri(objectKey: string) {
  const normalized = objectKey.trim().replace(/^\/+/, "");
  return normalized.startsWith("uploads/") ? `/${normalized}` : `/uploads/${normalized}`;
}

async function listDiaryAttachments(
  connection: Pick<PoolConnection, "execute">,
  submissionIds: number[],
) {
  const attachmentsBySubmission = new Map<number, DiaryAttachmentItem[]>();
  if (submissionIds.length === 0) {
    return attachmentsBySubmission;
  }

  const placeholders = submissionIds.map(() => "?").join(", ");
  const [rows] = await connection.execute(
    `SELECT
       submission_id AS submissionId,
       object_key AS objectKey,
       mime_type AS mimeType
     FROM completion_attachments
     WHERE submission_id IN (${placeholders})
       AND status <> 'rejected'
     ORDER BY id ASC`,
    submissionIds,
  );

  for (const row of rows as DiaryAttachmentRow[]) {
    const items = attachmentsBySubmission.get(row.submissionId) ?? [];
    items.push({ uri: toDiaryAttachmentUri(row.objectKey), mimeType: row.mimeType });
    attachmentsBySubmission.set(row.submissionId, items);
  }

  return attachmentsBySubmission;
}

function toDiarySubmissionDto(row: DiarySubmissionRow, attachments: DiaryAttachmentItem[] = []) {
  return {
    id: row.id,
    todoId: row.todoId,
    authorId: row.authorId,
    authorName: row.authorName,
    authorAvatarUri: row.authorAvatarUri ?? null,
    title: row.title,
    summary: row.summary,
    district: row.district,
    cityName: row.cityName,
    scheduledDate: normalizeDateValue(row.scheduledDate),
    submittedAt: normalizeDateTimeValue(row.submittedAt),
    feelingText: row.feelingText,
    visibility: row.visibility,
    reviewStatus: row.reviewStatus,
    mood: row.mood,
    moodTags: parseJsonArray(row.moodTags),
    attachmentCount: Number(row.attachmentCount ?? 0),
    attachments,
    commentCount: Number(row.commentCount ?? 0),
    likes: Number(row.likes ?? 0),
    isLikedByMe: Boolean(Number(row.isLikedByMe ?? 0)),
    isFavoritedByMe: Boolean(Number(row.isFavoritedByMe ?? 0)),
  };
}

function getBearerUserId(request: Request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  try {
    return verifyAuthToken(authorization.slice("Bearer ".length));
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "登录已过期，请重新登录");
  }
}

function resolveUserId(request: Request, fallbackUserId?: number) {
  const tokenUserId = getBearerUserId(request);
  if (tokenUserId !== null) {
    if (fallbackUserId !== undefined && fallbackUserId !== tokenUserId) {
      throw new AppError(403, "USER_MISMATCH", "不能操作其他用户的约定");
    }
    return tokenUserId;
  }

  if (fallbackUserId !== undefined) {
    return fallbackUserId;
  }

  throw new AppError(401, "UNAUTHORIZED", "请先登录");
}

// 游客会话没有 token，只能凭 userId 兜底；注册用户的数据必须持 token 访问。
async function ensureGuestFallbackAccess(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
) {
  const [rows] = await connection.execute(
    "SELECT auth_type AS authType FROM users WHERE id = ?",
    [userId],
  );
  const row = (rows as Array<{ authType: "guest" | "registered" }>)[0];
  if (row && row.authType !== "guest") {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }
}

async function getEntitlement(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
): Promise<Entitlement> {
  const [rows] = await connection.execute(
    `SELECT id
     FROM user_memberships
     WHERE user_id = ?
       AND tier = 'vip'
       AND status = 'active'
       AND starts_at <= CURRENT_TIMESTAMP
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
     ORDER BY expires_at IS NULL DESC, expires_at DESC
     LIMIT 1`,
    [userId],
  );

  if ((rows as Array<{ id: number }>)[0]) {
    return { tier: "vip", weeklyTodoLimit: vipWeeklyTodoLimit };
  }

  return { tier: "free", weeklyTodoLimit: freeWeeklyTodoLimit };
}

async function ensureUserExists(connection: Pick<PoolConnection, "execute">, userId: number) {
  const [rows] = await connection.execute("SELECT id FROM users WHERE id = ?", [userId]);
  if (!(rows as Array<{ id: number }>)[0]) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }
}

async function ensureActivityIsActive(
  connection: Pick<PoolConnection, "execute">,
  activityId: number,
) {
  const [rows] = await connection.execute(
    "SELECT id FROM activities WHERE id = ? AND is_active = TRUE",
    [activityId],
  );
  if (!(rows as Array<{ id: number }>)[0]) {
    throw new AppError(404, "ACTIVITY_NOT_FOUND", "这个玩法不存在或已经下架");
  }
}

type DiaryPermissionRow = {
  ownerUserId: number;
  visibility: (typeof todoDiaryVisibilityValues)[number];
  reviewStatus: (typeof todoReviewStatuses)[number];
};

function isDiaryPublic(row: Pick<DiaryPermissionRow, "visibility" | "reviewStatus">) {
  return row.visibility === "public_requested" && row.reviewStatus === "approved";
}

async function getDiaryPermission(
  connection: Pick<PoolConnection, "execute">,
  diaryId: number,
) {
  const [rows] = await connection.execute(
    `SELECT cs.user_id AS ownerUserId,
            cs.visibility,
            cs.review_status AS reviewStatus
     FROM todo_completion_submissions cs
     WHERE cs.id = ?
     LIMIT 1`,
    [diaryId],
  );

  const row = (rows as DiaryPermissionRow[])[0];
  if (!row) {
    throw new AppError(404, "DIARY_NOT_FOUND", "这篇日记不存在或无权限查看");
  }

  return row;
}

async function ensureDiaryReadable(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
) {
  const permission = await getDiaryPermission(connection, diaryId);
  if (permission.ownerUserId === userId) {
    return;
  }

  if (!isDiaryPublic(permission)) {
    throw new AppError(404, "DIARY_NOT_FOUND", "这篇日记不存在或无权限查看");
  }
}

async function ensureCommentVisibleToViewer(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  commentId: number,
) {
  const [rows] = await connection.execute(
    `SELECT cs.user_id AS ownerUserId,
            cs.visibility,
            cs.review_status AS reviewStatus
     FROM diary_comments dc
     INNER JOIN todo_completion_submissions cs
       ON cs.id = dc.diary_id
     WHERE dc.id = ?
     LIMIT 1`,
    [commentId],
  );

  const row = (rows as DiaryPermissionRow[])[0];
  if (!row) {
    throw new AppError(404, "COMMENT_NOT_FOUND", "评论不存在");
  }

  if (row.ownerUserId === userId) {
    return;
  }

  if (!isDiaryPublic(row)) {
    throw new AppError(404, "COMMENT_NOT_FOUND", "评论不存在");
  }
}

async function listTodoHistory(connection: Pick<PoolConnection, "execute">, userId: number) {
  const [rows] = await connection.execute(
    `SELECT
       t.id,
       t.status,
       t.completed_at AS completedAt,
       t.cancelled_at AS cancelledAt,
       t.scheduled_date AS scheduledDate,
       t.created_at AS createdAt,
       a.title,
       a.summary,
       a.district,
       c.name AS cityName
     FROM todos t
     INNER JOIN activities a ON a.id = t.activity_id
     INNER JOIN cities c ON c.id = a.city_id
     WHERE t.user_id = ?
       AND t.status IN ('completed', 'cancelled')
     ORDER BY
       t.scheduled_date DESC,
       t.created_at DESC`,
    [userId],
  );

  return (rows as TodoHistoryRow[]).map((row) => row);
}

async function listMyDiaries(
  connection: Pick<PoolConnection, "execute">,
  input: z.infer<typeof diaryQuerySchema>,
  ownerUserId?: number,
  viewerUserId?: number,
) {
  const conditions: string[] = [];
  const conditionParams: Array<string | number> = [];

  if (ownerUserId === undefined) {
    conditions.push("cs.visibility = 'public_requested'", "cs.review_status = 'approved'");
  } else {
    conditions.push("cs.user_id = ?");
    conditionParams.push(ownerUserId);
  }

  if (ownerUserId === undefined && viewerUserId !== undefined) {
    conditions.push(`NOT EXISTS (
          SELECT 1
          FROM diary_hidden_posts dhp
          WHERE dhp.diary_id = cs.id
            AND dhp.user_id = ?
        )`);
    conditionParams.push(viewerUserId);
  }

  if (input.visibility?.length) {
    conditions.push(`cs.visibility IN (${input.visibility.map(() => "?").join(", ")})`);
    conditionParams.push(...input.visibility);
  }

  if (input.reviewStatus?.length) {
    conditions.push(`cs.review_status IN (${input.reviewStatus.map(() => "?").join(", ")})`);
    conditionParams.push(...input.reviewStatus);
  }

  if (input.moods?.length) {
    conditions.push(`(a.mood IN (${input.moods.map(() => "?").join(", ")})
        OR JSON_OVERLAPS(a.mood_tags, CAST(? AS JSON)))`);
    conditionParams.push(...input.moods, JSON.stringify(input.moods));
  }

  if (input.favoritesOnly) {
    conditions.push(`EXISTS (
          SELECT 1
          FROM diary_favorites df
          WHERE df.diary_id = cs.id
            AND df.user_id = ?
        )`);
    conditionParams.push(viewerUserId ?? 0);
  }

  const keyword = input.keyword?.trim();
  if (keyword) {
    // utf8mb4 的 *_ci 排序规则本身不区分大小写；转义通配符保持字面匹配。
    const escapedKeyword = keyword.replace(/[\\%_]/g, (char) => `\\${char}`);
    conditions.push(`CONCAT_WS(' ',
        u.nickname, cs.feeling_text, a.title, a.summary, a.district, c.name, a.mood, a.mood_tags
      ) LIKE ?`);
    conditionParams.push(`%${escapedKeyword}%`);
  }

  const fromClause = `FROM todo_completion_submissions cs
     INNER JOIN todos t ON t.id = cs.todo_id
     INNER JOIN activities a ON a.id = t.activity_id
     INNER JOIN cities c ON c.id = a.city_id
     INNER JOIN users u ON u.id = cs.user_id`;
  const whereClause = `WHERE ${conditions.join("\n       AND ")}`;

  const [countRows] = await connection.execute(
    `SELECT COUNT(*) AS total
     ${fromClause}
     ${whereClause}`,
    conditionParams,
  );
  const total = Number((countRows as Array<{ total: number | string }>)[0]?.total ?? 0);
  if (total === 0 || input.offset >= total) {
    return { items: [], total };
  }

  const orderClause = input.sort === "popular"
    ? "ORDER BY (likes + commentCount) DESC, cs.submitted_at DESC"
    : "ORDER BY cs.submitted_at DESC";

  const [rows] = await connection.execute(
    `SELECT
       cs.id,
       cs.todo_id AS todoId,
       u.id AS authorId,
       u.nickname AS authorName,
       u.avatar_uri AS authorAvatarUri,
       cs.feeling_text AS feelingText,
       cs.visibility,
       cs.review_status AS reviewStatus,
       cs.submitted_at AS submittedAt,
       t.scheduled_date AS scheduledDate,
       a.mood,
       a.mood_tags AS moodTags,
       a.title,
       a.summary,
       a.district,
       c.name AS cityName,
       COALESCE(
         (SELECT COUNT(*)
          FROM diary_likes dl
          WHERE dl.diary_id = cs.id),
         0
       ) AS likes,
       COALESCE(
         (SELECT SUM(user_id = ?)
          FROM diary_likes dl
          WHERE dl.diary_id = cs.id),
         0
       ) AS isLikedByMe,
       COALESCE(
         (SELECT SUM(user_id = ?)
          FROM diary_favorites df
          WHERE df.diary_id = cs.id),
         0
       ) AS isFavoritedByMe,
       COALESCE(
         (SELECT COUNT(*)
          FROM completion_attachments ca
          WHERE ca.submission_id = cs.id
            AND ca.status <> 'rejected'),
         0
       ) AS attachmentCount,
       COALESCE(
         (SELECT COUNT(*)
          FROM diary_comments dc
          WHERE dc.diary_id = cs.id),
         0
       ) AS commentCount
     ${fromClause}
     ${whereClause}
     ${orderClause}
     LIMIT ${input.limit} OFFSET ${input.offset}`,
    [viewerUserId ?? 0, viewerUserId ?? 0, ...conditionParams],
  );

  const pagedRows = rows as DiarySubmissionRow[];
  const attachmentsBySubmission = await listDiaryAttachments(
    connection,
    pagedRows.map((row) => row.id),
  );
  return {
    items: pagedRows.map((row) =>
      toDiarySubmissionDto(row, attachmentsBySubmission.get(row.id) ?? []),
    ),
    total,
  };
}

function toDiaryCommentDto(row: DiaryCommentRow) {
  return {
    id: row.id,
    diaryId: row.diaryId,
    parentCommentId: row.parentCommentId ?? null,
    replyToCommentId: row.replyToCommentId ?? null,
    replyToAuthor: row.replyToAuthor ?? null,
    userId: row.userId,
    author: row.author,
    authorAvatarUri: row.authorAvatarUri ?? null,
    body: row.body,
    createdAt: normalizeDateTimeValue(row.createdAt) ?? "",
    likes: Number(row.likes ?? 0),
    replyCount: Number(row.replyCount ?? 0),
    isLikedByMe: Boolean(Number(row.isLikedByMe ?? 0)),
    replies: [],
  };
}

function toCommentLikeResult(row: { likes: number | string; isLikedByMe: number | boolean | null }) {
  return {
    likes: Number(row.likes ?? 0),
    isLikedByMe: Boolean(Number(row.isLikedByMe ?? 0)),
  };
}

function toDiaryLikeResult(row: { likes: number | string; isLikedByMe: number | boolean | null }) {
  return {
    likes: Number(row.likes ?? 0),
    isLikedByMe: Boolean(Number(row.isLikedByMe ?? 0)),
  };
}

function buildCommentSelect() {
  return `
    dc.id,
    dc.diary_id AS diaryId,
    dc.parent_comment_id AS parentCommentId,
    dc.reply_to_comment_id AS replyToCommentId,
    reply_user.nickname AS replyToAuthor,
    dc.user_id AS userId,
    u.nickname AS author,
    u.avatar_uri AS authorAvatarUri,
    dc.content AS body,
    dc.created_at AS createdAt,
    dc.likes_count AS likes,
    COALESCE(
      (SELECT COUNT(*)
       FROM diary_comments rc
       WHERE rc.parent_comment_id = dc.id),
      0
    ) AS replyCount,
    CASE WHEN dcl.user_id IS NULL THEN 0 ELSE 1 END AS isLikedByMe`;
}

async function listDiaryComments(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
  input: z.infer<typeof diaryCommentQuerySchema>,
): Promise<DiaryCommentListResult> {
  await ensureDiaryReadable(connection, userId, diaryId);

  const diaryPermission = await getDiaryPermission(connection, diaryId);
  const visibilityClause =
    diaryPermission.ownerUserId === userId
      ? ""
      : "AND cs.visibility = 'public_requested' AND cs.review_status = 'approved'";

  const [[totalRow]] = await connection.execute<(RowDataPacket & { total: number | string })[]>(
    `SELECT COUNT(*) AS total
     FROM diary_comments dc
     INNER JOIN todo_completion_submissions cs
       ON cs.id = dc.diary_id
     WHERE dc.diary_id = ? ${visibilityClause}`,
    [diaryId],
  );

  const [[topLevelTotalRow]] = await connection.execute<(RowDataPacket & { total: number | string })[]>(
    `SELECT COUNT(*) AS total
     FROM diary_comments dc
     INNER JOIN todo_completion_submissions cs
       ON cs.id = dc.diary_id
     WHERE dc.diary_id = ? ${visibilityClause} AND dc.parent_comment_id IS NULL`,
    [diaryId],
  );

  const [topRows] = await connection.execute(
    `SELECT ${buildCommentSelect()}
     FROM diary_comments dc
     INNER JOIN users u ON u.id = dc.user_id
     INNER JOIN todo_completion_submissions cs ON cs.id = dc.diary_id
     LEFT JOIN diary_comments reply_target ON reply_target.id = dc.reply_to_comment_id
     LEFT JOIN users reply_user ON reply_user.id = reply_target.user_id
     LEFT JOIN diary_comment_likes dcl
       ON dcl.comment_id = dc.id AND dcl.user_id = ?
     WHERE dc.diary_id = ? ${visibilityClause} AND dc.parent_comment_id IS NULL
     ORDER BY dc.created_at DESC
     LIMIT ${input.limit} OFFSET ${input.offset}`,
    [userId, diaryId],
  );

  const topLevel = (topRows as DiaryCommentRow[]).map((row) => toDiaryCommentDto(row));

  const topLevelIds = topLevel.map((comment) => comment.id);
  if (topLevelIds.length === 0) {
    return {
      items: [],
      total: Number(totalRow?.total ?? 0),
      topLevelTotal: Number(topLevelTotalRow?.total ?? 0),
      limit: input.limit,
      offset: input.offset,
    };
  }

  const replyPlaceholders = topLevelIds.map(() => "?").join(",");
  const [replyRows] = await connection.execute(
    `SELECT ${buildCommentSelect()}
     FROM diary_comments dc
     INNER JOIN users u ON u.id = dc.user_id
     INNER JOIN todo_completion_submissions cs ON cs.id = dc.diary_id
     LEFT JOIN diary_comments reply_target ON reply_target.id = dc.reply_to_comment_id
     LEFT JOIN users reply_user ON reply_user.id = reply_target.user_id
     LEFT JOIN diary_comment_likes dcl
       ON dcl.comment_id = dc.id AND dcl.user_id = ?
     WHERE dc.diary_id = ? ${visibilityClause}
       AND dc.parent_comment_id IN (${replyPlaceholders})
     ORDER BY dc.parent_comment_id ASC, dc.created_at ASC`,
    [userId, diaryId, ...topLevelIds],
  );

  const repliesByParent = new Map<number, DiaryCommentItem[]>();
  for (const reply of replyRows as DiaryCommentRow[]) {
    const parentId = reply.parentCommentId;
    if (parentId === null) {
      continue;
    }

    const replyWithLikes = toDiaryCommentDto(reply);
    const current = repliesByParent.get(parentId) ?? [];
    current.push(replyWithLikes);
    repliesByParent.set(parentId, current);
  }

  const items = topLevel.map((comment) => ({
    ...comment,
    replies: repliesByParent.get(comment.id) ?? [],
  }));

  return {
    items,
    total: Number(totalRow?.total ?? 0),
    topLevelTotal: Number(topLevelTotalRow?.total ?? 0),
    limit: input.limit,
    offset: input.offset,
  };
}

async function createDiaryComment(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
  input: z.infer<typeof diaryCommentCreateSchema>,
) {
  await ensureDiaryReadable(connection, userId, diaryId);

  let finalParentCommentId = input.parentCommentId;
  const replyToCommentId = input.parentCommentId ?? null;

  if (input.parentCommentId !== undefined) {
    const [parentRows] = await connection.execute(
      `SELECT
         dc.id,
         dc.parent_comment_id AS parentCommentId,
         p.parent_comment_id AS grandParentCommentId
       FROM diary_comments dc
       LEFT JOIN diary_comments p ON p.id = dc.parent_comment_id
       WHERE dc.id = ? AND dc.diary_id = ?
       LIMIT 1`,
      [input.parentCommentId, diaryId],
    );
    const parent = (
      parentRows as Array<{
        id: number;
        parentCommentId: number | null;
        grandParentCommentId: number | null;
      }>
    )[0];
    if (!parent) {
      throw new AppError(404, "COMMENT_NOT_FOUND", "回复对象不存在或无权限");
    }

    if (parent.grandParentCommentId !== null) {
      throw new AppError(
        400,
        "COMMENT_DEPTH_EXCEEDED",
        "评论仅支持两层，不能继续回复回复。",
      );
    }

    if (parent.parentCommentId !== null) {
      finalParentCommentId = parent.parentCommentId;
    }
  }

  const [insertResult] = await connection.execute(
     `INSERT INTO diary_comments
       (diary_id, user_id, parent_comment_id, reply_to_comment_id, content)
     VALUES (?, ?, ?, ?, ?)`,
    [diaryId, userId, finalParentCommentId ?? null, replyToCommentId, input.body],
  );

  const commentId = (insertResult as { insertId: number }).insertId;
  const [rows] = await connection.execute(
    `SELECT ${buildCommentSelect()}
     FROM diary_comments dc
     INNER JOIN users u ON u.id = dc.user_id
     LEFT JOIN diary_comments reply_target ON reply_target.id = dc.reply_to_comment_id
     LEFT JOIN users reply_user ON reply_user.id = reply_target.user_id
     LEFT JOIN diary_comment_likes dcl
       ON dcl.comment_id = dc.id AND dcl.user_id = ?
     WHERE dc.id = ? LIMIT 1`,
    [userId, commentId],
  );

  const row = (rows as Array<DiaryCommentRow>)[0];
  if (!row) {
    throw new AppError(500, "COMMENT_CREATE_FAILED", "评论发布失败");
  }

  return toDiaryCommentDto(row);
}

async function toggleDiaryCommentLike(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  commentId: number,
  action: "like" | "unlike",
) : Promise<DiaryCommentLikeResult> {
  await ensureCommentVisibleToViewer(connection, userId, commentId);

  if (action === "like") {
    const [insertResult] = await connection.execute(
      `INSERT IGNORE INTO diary_comment_likes (comment_id, user_id)
       VALUES (?, ?)`,
      [commentId, userId],
    );
    if ((insertResult as { affectedRows: number }).affectedRows > 0) {
      await connection.execute(
        `UPDATE diary_comments
         SET likes_count = likes_count + 1
         WHERE id = ?`,
        [commentId],
      );
    }
  } else {
    const [deleteResult] = await connection.execute(
      `DELETE FROM diary_comment_likes
       WHERE comment_id = ? AND user_id = ?`,
      [commentId, userId],
    );
    if ((deleteResult as { affectedRows: number }).affectedRows > 0) {
      await connection.execute(
        `UPDATE diary_comments
         SET likes_count = GREATEST(likes_count - 1, 0)
         WHERE id = ?`,
        [commentId],
      );
    }
  }

  const [rows] = await connection.execute(
    `SELECT
      dc.likes_count AS likes,
      CASE WHEN dcl.user_id IS NULL THEN 0 ELSE 1 END AS isLikedByMe
     FROM diary_comments dc
     LEFT JOIN diary_comment_likes dcl
       ON dcl.comment_id = dc.id AND dcl.user_id = ?
     WHERE dc.id = ?`,
    [userId, commentId],
  );

  const row = (rows as Array<{ likes: number | string; isLikedByMe: number | boolean | null }>)[0];
  if (!row) {
    throw new AppError(500, "COMMENT_LIKE_FAILED", "点赞更新失败");
  }

  return {
    id: commentId,
    ...toCommentLikeResult(row),
  };
}

async function toggleDiaryLike(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
  action: "like" | "unlike",
) : Promise<DiaryLikeResult> {
  await ensureDiaryReadable(connection, userId, diaryId);

  if (action === "like") {
    await connection.execute(
      `INSERT IGNORE INTO diary_likes (diary_id, user_id)
       VALUES (?, ?)`,
      [diaryId, userId],
    );
  } else {
    await connection.execute(
      `DELETE FROM diary_likes
       WHERE diary_id = ? AND user_id = ?`,
      [diaryId, userId],
    );
  }

  const [rows] = await connection.execute(
    `SELECT
      COUNT(*) AS likes,
      SUM(user_id = ?) AS isLikedByMe
     FROM diary_likes
     WHERE diary_id = ?`,
    [userId, diaryId],
  );
  const row = (rows as Array<{ likes: number | string; isLikedByMe: number | boolean | null }>)[0];
  if (!row) {
    throw new AppError(500, "DIARY_LIKE_FAILED", "点赞更新失败");
  }

  return {
    id: diaryId,
    ...toDiaryLikeResult(row),
  };
}

async function toggleDiaryFavorite(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
  action: "favorite" | "unfavorite",
) {
  await ensureDiaryReadable(connection, userId, diaryId);

  if (action === "favorite") {
    await connection.execute(
      `INSERT IGNORE INTO diary_favorites (diary_id, user_id)
       VALUES (?, ?)`,
      [diaryId, userId],
    );
  } else {
    await connection.execute(
      `DELETE FROM diary_favorites
       WHERE diary_id = ? AND user_id = ?`,
      [diaryId, userId],
    );
  }

  const [rows] = await connection.execute(
    `SELECT EXISTS(
       SELECT 1
       FROM diary_favorites
       WHERE diary_id = ? AND user_id = ?
     ) AS isFavoritedByMe`,
    [diaryId, userId],
  );
  const row = (rows as Array<{ isFavoritedByMe: number | boolean }>)[0];
  return {
    id: diaryId,
    isFavoritedByMe: Boolean(Number(row?.isFavoritedByMe ?? 0)),
  };
}

async function toggleDiaryHidden(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
  action: "hide" | "unhide",
) {
  await ensureDiaryReadable(connection, userId, diaryId);

  if (action === "hide") {
    await connection.execute(
      `INSERT IGNORE INTO diary_hidden_posts (diary_id, user_id)
       VALUES (?, ?)`,
      [diaryId, userId],
    );
  } else {
    await connection.execute(
      `DELETE FROM diary_hidden_posts
       WHERE diary_id = ? AND user_id = ?`,
      [diaryId, userId],
    );
  }

  return { id: diaryId, isHiddenByMe: action === "hide" };
}

async function reportDiary(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
  input: z.infer<typeof diaryReportSchema>,
) {
  const permission = await getDiaryPermission(connection, diaryId);
  if (permission.ownerUserId === userId) {
    throw new AppError(400, "CANNOT_REPORT_OWN_DIARY", "不能举报自己的日记");
  }
  if (!isDiaryPublic(permission)) {
    throw new AppError(404, "DIARY_NOT_FOUND", "这篇日记不存在或无权限查看");
  }

  await connection.execute(
    `INSERT INTO diary_reports (diary_id, user_id, reason, detail, status)
     VALUES (?, ?, ?, ?, 'pending')
     ON DUPLICATE KEY UPDATE
       reason = VALUES(reason),
       detail = VALUES(detail),
       status = 'pending',
       updated_at = CURRENT_TIMESTAMP`,
    [diaryId, userId, input.reason, input.detail || null],
  );

  return { id: diaryId, reported: true };
}

async function listCommunityOverview(
  connection: Pick<PoolConnection, "execute">,
  viewerUserId?: number,
) {
  const [authorRows] = await connection.execute(
    `SELECT
       u.id,
       u.nickname AS name,
       u.avatar_uri AS avatarUri,
       COUNT(DISTINCT cs.id) AS diaryCount,
       (SELECT COUNT(*)
        FROM community_user_follows cuf
        WHERE cuf.followed_user_id = u.id) AS followerCount,
       EXISTS(
         SELECT 1
         FROM community_user_follows cuf
         WHERE cuf.followed_user_id = u.id
           AND cuf.follower_user_id = ?
       ) AS isFollowedByMe
     FROM todo_completion_submissions cs
     INNER JOIN users u ON u.id = cs.user_id
     WHERE cs.visibility = 'public_requested'
       AND cs.review_status = 'approved'
     GROUP BY u.id, u.nickname, u.avatar_uri
     ORDER BY diaryCount DESC, followerCount DESC, u.id ASC
     LIMIT 4`,
    [viewerUserId ?? 0],
  );

  const [topicRows] = await connection.execute(
    `SELECT a.mood, a.mood_tags AS moodTags
     FROM todo_completion_submissions cs
     INNER JOIN todos t ON t.id = cs.todo_id
     INNER JOIN activities a ON a.id = t.activity_id
     WHERE cs.visibility = 'public_requested'
       AND cs.review_status = 'approved'`,
  );

  const topicCounts = new Map<string, number>();
  for (const row of topicRows as CommunityTopicRow[]) {
    const tags = new Set([row.mood, ...parseJsonArray(row.moodTags)].map((item) => item.trim()).filter(Boolean));
    for (const tag of tags) {
      topicCounts.set(tag, (topicCounts.get(tag) ?? 0) + 1);
    }
  }

  const topics = [...topicCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))
    .slice(0, 5)
    .map(([mood, count]) => ({ mood, name: `#${mood}`, count }));

  return {
    topics,
    activeUsers: (authorRows as CommunityAuthorRow[]).map((row) => ({
      id: Number(row.id),
      name: row.name,
      avatarUri: row.avatarUri ?? null,
      diaryCount: Number(row.diaryCount ?? 0),
      followerCount: Number(row.followerCount ?? 0),
      isFollowedByMe: Boolean(Number(row.isFollowedByMe ?? 0)),
    })),
  };
}

async function toggleCommunityUserFollow(
  connection: Pick<PoolConnection, "execute">,
  followerUserId: number,
  followedUserId: number,
  action: "follow" | "unfollow",
) {
  if (followerUserId === followedUserId) {
    throw new AppError(400, "CANNOT_FOLLOW_SELF", "不能关注自己");
  }

  await ensureUserExists(connection, followedUserId);
  if (action === "follow") {
    await connection.execute(
      `INSERT IGNORE INTO community_user_follows (follower_user_id, followed_user_id)
       VALUES (?, ?)`,
      [followerUserId, followedUserId],
    );
  } else {
    await connection.execute(
      `DELETE FROM community_user_follows
       WHERE follower_user_id = ? AND followed_user_id = ?`,
      [followerUserId, followedUserId],
    );
  }

  const [rows] = await connection.execute(
    `SELECT
       COUNT(*) AS followerCount,
       COALESCE(SUM(follower_user_id = ?), 0) AS isFollowedByMe
     FROM community_user_follows
     WHERE followed_user_id = ?`,
    [followerUserId, followedUserId],
  );
  const row = (rows as Array<{ followerCount: number | string; isFollowedByMe: number | string }>)[0];
  return {
    id: followedUserId,
    followerCount: Number(row?.followerCount ?? 0),
    isFollowedByMe: Boolean(Number(row?.isFollowedByMe ?? 0)),
  };
}

async function getDiaryById(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  diaryId: number,
) {
  await ensureDiaryReadable(connection, userId, diaryId);

  const [rows] = await connection.execute(
     `SELECT
       cs.id,
       cs.todo_id AS todoId,
       u.id AS authorId,
       u.nickname AS authorName,
       u.avatar_uri AS authorAvatarUri,
       cs.feeling_text AS feelingText,
       cs.visibility,
       cs.review_status AS reviewStatus,
       cs.submitted_at AS submittedAt,
       t.scheduled_date AS scheduledDate,
       a.mood,
       a.mood_tags AS moodTags,
       a.title,
       a.summary,
       a.district,
       c.name AS cityName,
       COALESCE(
          (SELECT COUNT(*)
           FROM completion_attachments ca
           WHERE ca.submission_id = cs.id
             AND ca.status <> 'rejected'),
         0
       ) AS attachmentCount,
       COALESCE(
         (SELECT COUNT(*)
          FROM diary_comments dc
          WHERE dc.diary_id = cs.id),
         0
       ) AS commentCount,
       (SELECT COUNT(*) AS likes
        FROM diary_likes dl
        WHERE dl.diary_id = cs.id) AS likes,
       CASE WHEN EXISTS(
         SELECT 1
         FROM diary_likes dl
         WHERE dl.diary_id = cs.id AND dl.user_id = ?
       ) THEN 1 ELSE 0 END AS isLikedByMe
     FROM todo_completion_submissions cs
     INNER JOIN todos t ON t.id = cs.todo_id
     INNER JOIN activities a ON a.id = t.activity_id
     INNER JOIN cities c ON c.id = a.city_id
     INNER JOIN users u ON u.id = cs.user_id
     WHERE cs.id = ?
     LIMIT 1`,
    [userId, diaryId],
  );

  const row = (rows as DiarySubmissionRow[])[0];
  if (!row) {
    return null;
  }
  const attachmentsBySubmission = await listDiaryAttachments(connection, [row.id]);
  return toDiarySubmissionDto(row, attachmentsBySubmission.get(row.id) ?? []);
}

async function listTodosForWeek(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  weekStartDate: string,
) {
  const [rows] = await connection.execute(
    `SELECT
       t.id,
       t.status,
       t.started_at AS startedAt,
       t.completed_at AS completedAt,
       t.cancelled_at AS cancelledAt,
       t.submitted_at AS submittedAt,
       t.review_status AS reviewStatus,
       t.created_at AS createdAt,
       t.scheduled_date AS scheduledDate,
       t.week_start_date AS weekStartDate,
       a.id AS activityId,
       a.title,
       a.summary,
       a.duration_minutes AS durationMinutes,
       a.budget_yuan AS budgetYuan,
       a.district,
       a.address,
       a.navigation_url AS navigationUrl,
       a.accent_color AS accentColor,
       c.name AS cityName
     FROM todos t
     INNER JOIN activities a ON a.id = t.activity_id
     INNER JOIN cities c ON c.id = a.city_id
     WHERE t.user_id = ?
       AND t.week_start_date = ?
     ORDER BY
       FIELD(t.status, 'in_progress', 'pending', 'completed', 'cancelled'),
       t.scheduled_date ASC,
       t.created_at DESC`,
    [userId, weekStartDate],
  );

  return (rows as TodoRow[]).map(toTodoDto);
}

async function getWeeklyQuota(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
  weekStartDate: string,
  entitlement: Entitlement,
) {
  await connection.execute(
    `INSERT INTO user_weekly_todo_usage (user_id, week_start_date, limit_count, used_count)
     SELECT ?, ?, ?, COUNT(*)
     FROM todos
     WHERE user_id = ? AND week_start_date = ?
     ON DUPLICATE KEY UPDATE limit_count = VALUES(limit_count)`,
    [userId, weekStartDate, entitlement.weeklyTodoLimit, userId, weekStartDate],
  );

  const [usageRows] = await connection.execute(
    `SELECT limit_count AS limitCount, used_count AS usedCount
     FROM user_weekly_todo_usage
     WHERE user_id = ? AND week_start_date = ?
     FOR UPDATE`,
    [userId, weekStartDate],
  );
  const usage = (usageRows as Array<{ limitCount: number; usedCount: number }>)[0];

  if (!usage) {
    throw new AppError(500, "TODO_USAGE_NOT_FOUND", "本周约定额度初始化失败");
  }

  return {
    tier: entitlement.tier,
    limit: usage.limitCount,
    used: usage.usedCount,
    remaining: Math.max(usage.limitCount - usage.usedCount, 0),
  };
}

async function buildWeekResponse(userId: number, dateKey = toChinaDateKey()) {
  const week = buildWeekWindow(dateKey);
  const entitlement = await getEntitlement(pool, userId);
  const quota = await getWeeklyQuota(pool, userId, week.weekStartDate, entitlement);
  const items = await listTodosForWeek(pool, userId, week.weekStartDate);

  return { week, quota, items };
}

export function registerTodoRoutes(app: Express) {
  app.get(
    "/api/v1/community/overview",
    asyncRoute(async (request, response) => {
      const viewerUserId = getBearerUserId(request) ?? undefined;
      if (viewerUserId !== undefined) {
        await ensureUserExists(pool, viewerUserId);
      }
      response.json({ data: await listCommunityOverview(pool, viewerUserId) });
    }),
  );

  app.post(
    "/api/v1/community/users/:id/follow",
    asyncRoute(async (request, response) => {
      const followedUserId = z.coerce.number().int().positive().parse(request.params.id);
      const input = communityFollowSchema.parse(request.body);
      const followerUserId = resolveUserId(request);
      const result = await withTransaction((connection) =>
        toggleCommunityUserFollow(connection, followerUserId, followedUserId, input.action),
      );
      response.json({ data: result });
    }),
  );

  app.get(
    "/api/v1/diaries",
    asyncRoute(async (request, response) => {
      const input = diaryQuerySchema.parse(request.query);
      const tokenUserId = getBearerUserId(request) ?? undefined;
      const ownerUserId = input.userId === undefined ? undefined : resolveUserId(request, input.userId);
      if (tokenUserId === undefined && ownerUserId !== undefined) {
        await ensureGuestFallbackAccess(pool, ownerUserId);
      }
      const viewerUserId = tokenUserId ?? ownerUserId;
      if (viewerUserId !== undefined) {
        await ensureUserExists(pool, viewerUserId);
      }

      const result = await listMyDiaries(pool, input, ownerUserId, viewerUserId);
      const offset = input.offset;
      const limit = input.limit;
      response.json({
        data: {
          items: result.items,
          total: result.total,
          limit,
          offset,
        },
      });
    }),
  );

  app.get(
    "/api/v1/diaries/:id",
    asyncRoute(async (request, response) => {
      const diaryId = z.coerce.number().int().positive().parse(request.params.id);
      const input = z.object({ userId: z.coerce.number().int().positive().optional() }).parse(request.query);
      const tokenUserId = getBearerUserId(request);
      // 匿名访客以 0 号身份浏览，只能读到公开日记。
      const userId = tokenUserId === null && input.userId === undefined
        ? 0
        : resolveUserId(request, input.userId);
      if (userId !== 0) {
        if (tokenUserId === null) {
          await ensureGuestFallbackAccess(pool, userId);
        }
        await ensureUserExists(pool, userId);
      }

      const diary = await getDiaryById(pool, userId, diaryId);
      if (!diary) {
        throw new AppError(404, "DIARY_NOT_FOUND", "这篇日记不存在或无权限查看");
      }

      response.json({ data: diary });
    }),
  );

  app.get(
    "/api/v1/diaries/:id/comments",
    asyncRoute(async (request, response) => {
      const diaryId = z.coerce.number().int().positive().parse(request.params.id);
      const input = diaryCommentQuerySchema.parse(request.query);
      // 公开日记的评论允许匿名浏览，0 号身份读不到未公开内容。
      const userId = getBearerUserId(request) ?? 0;
      const comments = await listDiaryComments(pool, userId, diaryId, input);
      response.json({ data: comments });
    }),
  );

  app.post(
    "/api/v1/diaries/:id/comments",
    asyncRoute(async (request, response) => {
      const diaryId = z.coerce.number().int().positive().parse(request.params.id);
      const input = diaryCommentCreateSchema.parse(request.body);
      const userId = resolveUserId(request);

      const result = await withTransaction(async (connection) => {
        return createDiaryComment(connection, userId, diaryId, input);
      });

      response.status(201).json({ data: result });
    }),
  );

  app.post(
    "/api/v1/comments/:id/like",
    asyncRoute(async (request, response) => {
      const commentId = z.coerce.number().int().positive().parse(request.params.id);
      const input = diaryCommentLikeSchema.parse(request.body);
      const userId = resolveUserId(request);

      const result = await withTransaction(async (connection) => {
        return toggleDiaryCommentLike(connection, userId, commentId, input.action);
      });

      response.json({ data: result });
    }),
  );

  app.post(
    "/api/v1/diaries/:id/like",
    asyncRoute(async (request, response) => {
      const diaryId = z.coerce.number().int().positive().parse(request.params.id);
      const input = diaryLikeSchema.parse(request.body);
      const userId = resolveUserId(request);

      const result = await withTransaction(async (connection) => {
        return toggleDiaryLike(connection, userId, diaryId, input.action);
      });

      response.json({ data: result });
    }),
  );

  app.post(
    "/api/v1/diaries/:id/favorite",
    asyncRoute(async (request, response) => {
      const diaryId = z.coerce.number().int().positive().parse(request.params.id);
      const input = diaryFavoriteSchema.parse(request.body);
      const userId = resolveUserId(request);
      const result = await withTransaction((connection) =>
        toggleDiaryFavorite(connection, userId, diaryId, input.action),
      );
      response.json({ data: result });
    }),
  );

  app.post(
    "/api/v1/diaries/:id/hidden",
    asyncRoute(async (request, response) => {
      const diaryId = z.coerce.number().int().positive().parse(request.params.id);
      const input = diaryHiddenSchema.parse(request.body);
      const userId = resolveUserId(request);
      const result = await withTransaction((connection) =>
        toggleDiaryHidden(connection, userId, diaryId, input.action),
      );
      response.json({ data: result });
    }),
  );

  app.post(
    "/api/v1/diaries/:id/report",
    asyncRoute(async (request, response) => {
      const diaryId = z.coerce.number().int().positive().parse(request.params.id);
      const input = diaryReportSchema.parse(request.body);
      const userId = resolveUserId(request);
      const result = await withTransaction((connection) =>
        reportDiary(connection, userId, diaryId, input),
      );
      response.status(201).json({ data: result });
    }),
  );

  app.get(
    "/api/v1/history",
    asyncRoute(async (request, response) => {
      const input = historyQuerySchema.parse(request.query);
      const userId = resolveUserId(request, input.userId);
      await ensureUserExists(pool, userId);

      const today = toChinaDateKey();
      const rows = await listTodoHistory(pool, userId);
      const converted = rows.map((row) => toTodoHistoryDto(row, today));
      const filtered = input.status
        ? converted.filter((item) => {
            const requested = (input.status as HistoryTodoStatus[]) ?? [];
            return requested.includes(item.status);
          })
        : converted;

      const offset = input.offset ?? 0;
      const limit = input.limit ?? 100;
      const items = filtered.slice(offset, offset + limit);

      response.json({
        data: {
          items,
          total: filtered.length,
          limit,
          offset,
        },
      });
    }),
  );

  app.get(
    "/api/v1/todos/week",
    asyncRoute(async (request, response) => {
      const input = todoQuerySchema.parse(request.query);
      const userId = resolveUserId(request, input.userId);
      await ensureUserExists(pool, userId);

      response.json({ data: await buildWeekResponse(userId) });
    }),
  );

  app.post(
    "/api/v1/todos",
    asyncRoute(async (request, response) => {
      const input = createTodoSchema.parse(request.body);
      const userId = resolveUserId(request, input.userId);
      const scheduledDate = assertValidDateKey(input.scheduledDate ?? toChinaDateKey());
      const currentWeek = buildWeekWindow();
      if (!isDateKeyTodayOrLater(scheduledDate, currentWeek.today)) {
        throw new AppError(400, "TODO_DATE_IN_PAST", "不能选择今天以前的日期", {
          scheduledDate,
          today: currentWeek.today,
        });
      }
      if (!isDateKeyInSameWeek(scheduledDate, currentWeek.today)) {
        throw new AppError(400, "TODO_DATE_OUT_OF_CURRENT_WEEK", "只能加入本周内的约定", {
          scheduledDate,
          weekStartDate: currentWeek.weekStartDate,
          weekEndDate: currentWeek.weekEndDate,
        });
      }
      const weekStartDate = getWeekStartDateKey(scheduledDate);

      const result = await withTransaction(async (connection) => {
        await ensureUserExists(connection, userId);
        await ensureActivityIsActive(connection, input.activityId);

        const [existingRows] = await connection.execute(
          `SELECT id
           FROM todos
           WHERE user_id = ?
             AND activity_id = ?
             AND week_start_date = ?
           LIMIT 1`,
          [userId, input.activityId, weekStartDate],
        );
        const existing = (existingRows as Array<{ id: number }>)[0];

        if (existing) {
          return {
            status: 200,
            data: { id: existing.id, alreadyExists: true },
          };
        }

        const entitlement = await getEntitlement(connection, userId);
        const quota = await getWeeklyQuota(connection, userId, weekStartDate, entitlement);
        if (quota.used >= quota.limit) {
          throw new AppError(
            409,
            "WEEKLY_TODO_LIMIT_REACHED",
            quota.tier === "vip"
              ? "本周约定额度已用完，会员每周最多 3 条"
              : "本周约定额度已用完，普通用户每周最多 1 条，会员每周最多 3 条",
            { quota },
          );
        }

        const [insertResult] = await connection.execute(
          `INSERT INTO todos
             (user_id, activity_id, draw_session_id, scheduled_date, week_start_date, source)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            input.activityId,
            input.drawSessionId ?? null,
            scheduledDate,
            weekStartDate,
            input.drawSessionId ? "draw" : "manual",
          ],
        );
        const todoId = (insertResult as { insertId: number }).insertId;
        await connection.execute(
          `UPDATE user_weekly_todo_usage
           SET used_count = used_count + 1
           WHERE user_id = ? AND week_start_date = ?`,
          [userId, weekStartDate],
        );

        if (input.drawSessionId) {
          await connection.execute(
            `UPDATE draw_sessions
             SET status = 'confirmed'
             WHERE id = ? AND user_id = ?`,
            [input.drawSessionId, userId],
          );
        }

        return {
          status: 201,
          data: {
            id: todoId,
            alreadyExists: false,
            quota: {
              ...quota,
              used: quota.used + 1,
              remaining: Math.max(quota.limit - quota.used - 1, 0),
            },
          },
        };
      });

      response.status(result.status).json({ data: result.data });
    }),
  );

  app.get(
    "/api/v1/todos",
    asyncRoute(async (request, response) => {
      const input = todoQuerySchema.parse(request.query);
      const userId = resolveUserId(request, input.userId);
      await ensureUserExists(pool, userId);
      const week = buildWeekWindow();

      response.json({ data: await listTodosForWeek(pool, userId, week.weekStartDate) });
    }),
  );

  app.patch(
    "/api/v1/todos/:id/start",
    asyncRoute(async (request, response) => {
      const todoId = z.coerce.number().int().positive().parse(request.params.id);
      const input = todoQuerySchema.parse(request.body ?? {});
      const userId = resolveUserId(request, input.userId);

      const [result] = await pool.execute(
        `UPDATE todos
         SET status = 'in_progress',
             started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
             completed_at = NULL,
             cancelled_at = NULL
         WHERE id = ?
           AND user_id = ?
           AND status = 'pending'`,
        [todoId, userId],
      );

      if ((result as { affectedRows: number }).affectedRows === 0) {
        throw new AppError(404, "TODO_NOT_FOUND", "没有找到可开始的本周约定");
      }

      response.json({ data: { id: todoId, status: "in_progress" } });
    }),
  );

  app.patch(
    "/api/v1/todos/:id/status",
    asyncRoute(async (request, response) => {
      const todoId = z.coerce.number().int().positive().parse(request.params.id);
      const input = updateTodoSchema.parse(request.body);
      const userId = resolveUserId(request, input.userId);

      const timestampUpdates: Record<TodoStatus, string> = {
        pending:
          "started_at = NULL, completed_at = NULL, cancelled_at = NULL, submitted_at = NULL, review_status = 'none'",
        in_progress:
          "started_at = COALESCE(started_at, CURRENT_TIMESTAMP), completed_at = NULL, cancelled_at = NULL",
        completed: "completed_at = CURRENT_TIMESTAMP, cancelled_at = NULL",
        cancelled: "cancelled_at = CURRENT_TIMESTAMP, completed_at = NULL",
      };

      const [result] = await pool.execute(
        `UPDATE todos
         SET status = ?, ${timestampUpdates[input.status]}
         WHERE id = ? AND user_id = ?`,
        [input.status, todoId, userId],
      );

      if ((result as { affectedRows: number }).affectedRows === 0) {
        throw new AppError(404, "TODO_NOT_FOUND", "没有找到这条本周约定");
      }

      response.json({ data: { id: todoId, status: input.status } });
    }),
  );

  app.post(
    "/api/v1/todos/:id/completion",
    asyncRoute(async (request, response) => {
      const todoId = z.coerce.number().int().positive().parse(request.params.id);
      const input = completionSchema.parse(request.body);
      const userId = resolveUserId(request);

      const result = await withTransaction(async (connection) => {
        const [todoRows] = await connection.execute(
          `SELECT id, status, review_status AS reviewStatus
           FROM todos
           WHERE id = ? AND user_id = ?
           FOR UPDATE`,
          [todoId, userId],
        );
        const todo = (
          todoRows as Array<{
            id: number;
            status: TodoStatus;
            reviewStatus: "none" | "pending" | "approved" | "rejected";
          }>
        )[0];

        if (!todo) {
          throw new AppError(404, "TODO_NOT_FOUND", "没有找到这条本周约定");
        }

        if (todo.status === "completed" && todo.reviewStatus !== "rejected") {
          throw new AppError(409, "TODO_ALREADY_SUBMITTED", "这条约定已经完成回传");
        }

        if (todo.status !== "in_progress") {
          throw new AppError(409, "TODO_NOT_STARTED", "请先开始约定，再完成回传");
        }

        const [submissionResult] = await connection.execute(
          `INSERT INTO todo_completion_submissions
             (todo_id, user_id, feeling_text, visibility, review_status)
           VALUES (?, ?, ?, ?, 'pending')`,
          [todoId, userId, input.feelingText, input.visibility],
        );
        const submissionId = (submissionResult as { insertId: number }).insertId;

        for (const attachment of input.attachments) {
          await connection.execute(
            `INSERT INTO completion_attachments
               (submission_id, object_key, mime_type, size_bytes, checksum, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [
              submissionId,
              attachment.objectKey,
              attachment.mimeType,
              attachment.sizeBytes,
              attachment.checksum ?? null,
            ],
          );
        }

        await connection.execute(
          `UPDATE todos
           SET status = 'completed',
               completed_at = CURRENT_TIMESTAMP,
               submitted_at = CURRENT_TIMESTAMP,
               cancelled_at = NULL,
               review_status = 'pending'
           WHERE id = ? AND user_id = ?`,
          [todoId, userId],
        );

        return {
          id: submissionId,
          todoId,
          reviewStatus: "pending",
          visibility: input.visibility,
          attachmentCount: input.attachments.length,
        };
      });

      response.status(201).json({ data: result });
    }),
  );

  app.post(
    "/api/v1/todos/:id/attachments",
    asyncRoute(async (request, response) => {
      const todoId = z.coerce.number().int().positive().parse(request.params.id);
      const input = attachmentUploadSchema.parse(request.body);
      const userId = resolveUserId(request);
      const attachment = parseCompletionMedia(input);

      const [todoRows] = await pool.execute(
        `SELECT id
         FROM todos
         WHERE id = ? AND user_id = ?`,
        [todoId, userId],
      );
      const todo = (todoRows as Array<{ id: number }>)[0];
      if (!todo) {
        throw new AppError(404, "TODO_NOT_FOUND", "没有找到这条本周约定");
      }

      const uploadDir = resolve(completionUploadDir, String(todoId));
      await mkdir(uploadDir, { recursive: true });

      const filename = `${todoId}-${Date.now()}-${randomUUID()}.${attachment.extension}`;
      const objectKey = `completion/${todoId}/${filename}`;
      await writeFile(join(uploadDir, filename), attachment.buffer);

      response.status(201).json({
        data: {
          objectKey,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.buffer.byteLength,
          uri: completionUploadUrl(request, objectKey),
        },
      });
    }),
  );
}
