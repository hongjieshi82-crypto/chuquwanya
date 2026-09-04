import { randomInt, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { z, ZodError } from "zod";

import type { PoolConnection } from "mysql2/promise";

import { geocodeAddressWithAmap } from "./amap-geocode.js";
import { activityVectorService } from "./activityVector.service.js";
import { config } from "./config.js";
import { registerCheckinRoutes } from "./checkins.js";
import { selectActivityWithRecommendation } from "./draw-recommendation.js";
import { sendAuthCodeEmail } from "./email.js";
import {
  mergeGuestIntoUser,
  signAuthToken,
  toUserDto,
  verifyAuthToken,
  type UserRow,
} from "./auth.js";
import { pool, withTransaction } from "./db.js";
import { AppError } from "./errors.js";
import { registerPaymentRoutes } from "./payments.js";
import { parseJsonArray, type ActivityRow, toActivityDto } from "./types.js";
import { buildWeekWindow, registerTodoRoutes } from "./todos.js";
import { registerTravelRoutes } from "./travel/routes.js";
import { getCityWeather } from "./weather.service.js";
import { registerContentAdminRoutes } from "./content-admin.js";

const environmentValues = ["indoor", "outdoor", "either"] as const;
const DRAW_SEMANTIC_TOP_K = 3;
const DAILY_DRAW_LIMIT = 3;

const guestSessionSchema = z.object({
  deviceId: z.string().min(8).max(128),
});

const emailSchema = z.string().trim().toLowerCase().email("邮箱格式不正确").max(255);
const authCodeSchema = z.string().regex(/^\d{6}$/, "验证码格式不正确");

const sendAuthCodeSchema = z.object({
  email: emailSchema,
});

const registerSchema = z.object({
  email: emailSchema,
  code: authCodeSchema,
  nickname: z.string().min(1).max(64).optional(),
  deviceId: z.string().min(8).max(128).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  code: authCodeSchema,
  deviceId: z.string().min(8).max(128).optional(),
});

const avatarUploadSchema = z.object({
  imageBase64: z.string().min(1, "请选择头像图片"),
  mimeType: z.string().min(1).max(80).optional(),
});

const profileUpdateSchema = z
  .object({
    nickname: z.string().trim().min(1, "昵称不能为空").max(64, "昵称不能超过 64 个字符").optional(),
  })
  .refine((input) => input.nickname !== undefined, {
    message: "请提供要更新的资料",
  });

const preferencesSchema = z.object({
  partySize: z.number().int().min(1).max(20),
  durationMinutes: z.number().int().min(30).max(1_440).nullable().default(null),
  budgetMin: z.number().int().min(0).max(10_000).nullable().optional(),
  budgetMax: z.number().int().min(0).max(10_000).nullable(),
  mood: z.string().min(1).max(32),
  randomLevel: z.number().int().min(0).max(100).default(68),
  category: z.string().min(1).max(32),
  environment: z.enum(environmentValues),
  radiusKm: z.number().positive().max(100).nullable(),
  originName: z.string().trim().min(1).max(80).nullable().optional(),
  originLatitude: z.number().min(-90).max(90).nullable().optional(),
  originLongitude: z.number().min(-180).max(180).nullable().optional(),
  originAccuracyMeters: z.number().min(0).max(100_000).nullable().optional(),
  originSource: z.enum(["device", "manual"]).nullable().optional(),
  destinationScope: z.enum(["nearby", "province", "nationwide"]).optional(),
  travelDuration: z.enum(["same-day", "1-2days", "1-3days", "2-3days", "3-5days", "4-5days", "5-7days"]).optional(),
  clientSource: z.enum(["mobile", "pc"]).optional(),
  destinationScopeLabel: z.string().trim().min(1).max(24).nullable().optional(),
  travelDurationLabel: z.string().trim().min(1).max(24).nullable().optional(),
  budgetLabel: z.string().trim().min(1).max(24).nullable().optional(),
  surpriseLevelLabel: z.string().trim().min(1).max(24).nullable().optional(),
});

const drawContextSchema = z
  .object({
    selectedCardId: z.number().int().positive().nullable().optional(),
    drawnCardIds: z.array(z.number().int().positive()).optional(),
    rerollRemaining: z.number().int().min(0).max(10).nullable().optional(),
    drawCostPolicy: z.string().min(1).max(64).nullable().optional(),
    userMemory: z
      .object({
        completedCardIds: z.array(z.number().int().positive()).optional(),
        dislikedCardIds: z.array(z.number().int().positive()).optional(),
        favoriteTags: z.array(z.string().trim().min(1).max(24)).optional(),
        blockedTags: z.array(z.string().trim().min(1).max(24)).optional(),
      })
      .partial()
      .optional(),
  })
  .partial()
  .optional();

const drawSchema = z.object({
  userId: z.number().int().positive(),
  cityId: z.number().int().positive(),
  drawSessionId: z.string().uuid().optional(),
  preferences: preferencesSchema,
  drawContext: drawContextSchema,
});

const homeCommunityFeedSchema = z.object({
  cityId: z.coerce.number().int().positive().optional(),
  sourceType: z.enum(["itinerary_workbook"]).optional(),
  channel: z
    .string()
    .trim()
    .max(20, "频道名过长")
    .optional(),
  limit: z.coerce.number().int().positive().max(30).default(8),
  offset: z.coerce.number().int().min(0).default(0),
});

type DrawInput = z.infer<typeof drawSchema>;

type CityLookupRow = {
  id: number;
  name: string;
  code: string;
  province: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type OriginPreferenceCoordinates = {
  originLatitude: number;
  originLongitude: number;
};

type AuthCodeRecord = {
  code: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
};

type EmailCodeAuthInput = {
  email: string;
  nickname?: string;
  deviceId?: string;
};

const authCodeStore = new Map<string, AuthCodeRecord>();
const authCodeTtlMs = 120 * 1_000;
const authCodeResendMs = 60 * 1_000;
const maxAuthCodeAttempts = 5;
const avatarUploadDir = resolve(process.cwd(), "uploads", "avatars");
const avatarMaxBytes = 4 * 1024 * 1024;
const freeWeeklyTodoLimit = 21;
const vipWeeklyTodoLimit = 21;

const avatarMimeExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AvatarMimeType = keyof typeof avatarMimeExtensions;

function createAuthCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function issueAuthCode(email: string) {
  const now = Date.now();
  const current = authCodeStore.get(email);
  if (current && current.sentAt + authCodeResendMs > now) {
    const retryAfterSeconds = Math.ceil((current.sentAt + authCodeResendMs - now) / 1_000);
    throw new AppError(429, "AUTH_CODE_TOO_FREQUENT", "验证码发送太频繁，请稍后再试", {
      retryAfterSeconds,
    });
  }

  const code = createAuthCode();
  authCodeStore.set(email, {
    code,
    expiresAt: now + authCodeTtlMs,
    sentAt: now,
    attempts: 0,
  });

  return {
    code,
    expiresInSeconds: Math.floor(authCodeTtlMs / 1_000),
    retryAfterSeconds: Math.floor(authCodeResendMs / 1_000),
  };
}

function assertValidAuthCode(email: string, code: string) {
  const current = authCodeStore.get(email);
  const now = Date.now();
  if (!current || current.expiresAt <= now) {
    authCodeStore.delete(email);
    throw new AppError(400, "AUTH_CODE_EXPIRED", "验证码已过期，请重新获取");
  }

  if (current.code !== code) {
    current.attempts += 1;
    if (current.attempts >= maxAuthCodeAttempts) {
      authCodeStore.delete(email);
    }
    throw new AppError(400, "INVALID_AUTH_CODE", "验证码不正确");
  }
}

function consumeAuthCode(email: string) {
  authCodeStore.delete(email);
}

async function authenticateByEmailCode(
  connection: Pick<PoolConnection, "execute">,
  input: EmailCodeAuthInput,
) {
  const [userRows] = await connection.execute(
    `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
     FROM users
     WHERE email = ? AND auth_type = 'registered'
     FOR UPDATE`,
    [input.email],
  );
  const registered = (userRows as UserRow[])[0];

  if (registered) {
    if (input.deviceId) {
      const [guestRows] = await connection.execute(
        `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
         FROM users
         WHERE device_id = ? AND auth_type = 'guest'
         FOR UPDATE`,
        [input.deviceId],
      );
      const guest = (guestRows as UserRow[])[0];
      if (guest) {
        await mergeGuestIntoUser(connection, guest.id, registered.id);
      }
    }

    await connection.execute("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?", [
      registered.id,
    ]);
    return registered;
  }

  let deviceIdForNewUser = input.deviceId ?? null;

  if (input.deviceId) {
    const [deviceRows] = await connection.execute(
      `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
       FROM users
       WHERE device_id = ?
       FOR UPDATE`,
      [input.deviceId],
    );
    const deviceUser = (deviceRows as UserRow[])[0];

    if (deviceUser?.auth_type === "guest") {
      await connection.execute(
        `UPDATE users
         SET email = ?, password_hash = NULL, auth_type = 'registered',
             nickname = COALESCE(?, nickname), last_seen_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [input.email, input.nickname ?? null, deviceUser.id],
      );
      const [updatedRows] = await connection.execute(
        `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
         FROM users
         WHERE id = ?`,
        [deviceUser.id],
      );
      return (updatedRows as UserRow[])[0];
    }

    if (deviceUser) {
      deviceIdForNewUser = null;
    }
  }

  await connection.execute(
    `INSERT INTO users (device_id, email, password_hash, auth_type, nickname)
     VALUES (?, ?, NULL, 'registered', ?)`,
    [deviceIdForNewUser, input.email, input.nickname ?? "探索者"],
  );
  const [createdRows] = await connection.execute(
    `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
     FROM users
     WHERE email = ?`,
    [input.email],
  );
  return (createdRows as UserRow[])[0];
}

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function readAuthenticatedUserId(request: Request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }

  try {
    return verifyAuthToken(authorization.slice("Bearer ".length));
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "登录已过期，请重新登录");
  }
}

function hasOriginCoordinates(
  preferences: z.infer<typeof preferencesSchema>,
): preferences is z.infer<typeof preferencesSchema> & OriginPreferenceCoordinates {
  return (
    typeof preferences.originLatitude === "number" &&
    Number.isFinite(preferences.originLatitude) &&
    typeof preferences.originLongitude === "number" &&
    Number.isFinite(preferences.originLongitude)
  );
}

function normalizeRadiusWithoutPreciseOrigin(input: DrawInput): DrawInput {
  if (input.preferences.radiusKm === null || hasOriginCoordinates(input.preferences)) {
    return input;
  }

  return {
    ...input,
    preferences: {
      ...input.preferences,
      radiusKm: null,
    },
  };
}

function toFiniteNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function calculateDistanceKm(origin: Coordinates, destination: Coordinates) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function normalizeCityText(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, "");
}

function detectAvatarMimeType(buffer: Buffer): AvatarMimeType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function parseAvatarImage(input: z.infer<typeof avatarUploadSchema>) {
  const dataUrlMatch = input.imageBase64.match(/^data:[^;,]+;base64,(.+)$/s);
  const compactBase64 = (dataUrlMatch?.[1] ?? input.imageBase64).replace(/\s/g, "");

  if (!compactBase64 || compactBase64.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compactBase64)) {
    throw new AppError(400, "INVALID_AVATAR_IMAGE", "头像图片格式不正确");
  }

  const buffer = Buffer.from(compactBase64, "base64");
  if (buffer.byteLength <= 0) {
    throw new AppError(400, "INVALID_AVATAR_IMAGE", "头像图片为空");
  }
  if (buffer.byteLength > avatarMaxBytes) {
    throw new AppError(413, "AVATAR_TOO_LARGE", "头像图片不能超过 4MB");
  }

  const mimeType = detectAvatarMimeType(buffer);
  if (!mimeType) {
    throw new AppError(400, "UNSUPPORTED_AVATAR_TYPE", "头像仅支持 JPG、PNG 或 WebP");
  }

  return {
    buffer,
    mimeType,
    extension: avatarMimeExtensions[mimeType],
  };
}

function publicBaseUrl(request: Request) {
  const forwardedProto = request.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.protocol;
  return `${protocol}://${request.get("host")}`;
}

function avatarUrl(request: Request, filename: string) {
  return `${publicBaseUrl(request)}/uploads/avatars/${filename}`;
}

function resolveAvatarUri(request: Request, avatarUri: string | null | undefined) {
  if (!avatarUri) {
    return null;
  }
  if (
    avatarUri.startsWith("http://") ||
    avatarUri.startsWith("https://") ||
    avatarUri.startsWith("data:")
  ) {
    return avatarUri;
  }
  if (avatarUri.startsWith("/")) {
    return `${publicBaseUrl(request)}${avatarUri}`;
  }
  return avatarUri;
}

function toIsoDateTime(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

async function getUserMembershipSummary(userId: number, isRegistered: boolean) {
  if (!isRegistered) {
    return {
      isVip: false,
      tier: "free" as const,
      status: "inactive" as const,
      startsAt: null,
      expiresAt: null,
      weeklyTodoLimit: freeWeeklyTodoLimit,
      label: "未登录",
    };
  }

  const [rows] = await pool.execute(
    `SELECT tier, status, starts_at, expires_at
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
  const membership = (
    rows as Array<{
      tier: "vip";
      status: "active";
      starts_at: Date | string;
      expires_at: Date | string | null;
    }>
  )[0];

  if (!membership) {
    return {
      isVip: false,
      tier: "free" as const,
      status: "inactive" as const,
      startsAt: null,
      expiresAt: null,
      weeklyTodoLimit: freeWeeklyTodoLimit,
      label: "普通用户",
    };
  }

  return {
    isVip: true,
    tier: "vip" as const,
    status: "active" as const,
    startsAt: toIsoDateTime(membership.starts_at),
    expiresAt: toIsoDateTime(membership.expires_at),
    weeklyTodoLimit: vipWeeklyTodoLimit,
    label: membership.expires_at ? "奇遇会员" : "永久会员",
  };
}

async function toUserDtoForRequest(request: Request, user: UserRow) {
  return {
    ...toUserDto(user),
    avatarUri: resolveAvatarUri(request, user.avatar_uri),
    membership: await getUserMembershipSummary(user.id, user.auth_type === "registered"),
  };
}

function storedAvatarPath(uri: string | null | undefined) {
  if (!uri) return null;

  let pathname = uri;
  try {
    pathname = new URL(uri).pathname;
  } catch {
    // 支持历史上可能保存过的相对路径。
  }

  const prefix = "/uploads/avatars/";
  if (!pathname.startsWith(prefix)) return null;

  const filename = basename(pathname);
  if (!filename || filename !== pathname.slice(prefix.length)) return null;
  return join(avatarUploadDir, filename);
}

async function removeStoredAvatar(uri: string | null | undefined) {
  const path = storedAvatarPath(uri);
  if (!path) return;
  await unlink(path).catch(() => undefined);
}

function cityMatchTokens(city: CityLookupRow) {
  const rawTokens = [
    city.name,
    `${city.name}市`,
    city.province,
    `${city.province}市`,
    city.code,
  ];
  return Array.from(new Set(rawTokens.map(normalizeCityText).filter((token) => token.length > 1)));
}

function findCityIdFromOriginName(
  originName: string | null | undefined,
  cities: CityLookupRow[],
  fallbackCityId: number,
) {
  if (!originName) return fallbackCityId;

  const normalizedOrigin = normalizeCityText(originName);
  const matchedCity = cities.find((city) =>
    cityMatchTokens(city).some((token) => normalizedOrigin.includes(token)),
  );

  return matchedCity?.id ?? fallbackCityId;
}

function findCityIdFromOriginNameStrict(
  originName: string | null | undefined,
  cities: CityLookupRow[],
) {
  if (!originName) return null;
  const normalizedOrigin = normalizeCityText(originName);
  return cities.find((city) =>
    cityMatchTokens(city).some((token) => normalizedOrigin.includes(token)),
  )?.id ?? null;
}

type CityResolution = {
  cityId: number;
  cityMismatchHint?: {
    requestCityId: number;
    requestCityName: string;
    detectedCityId: number;
    detectedCityName: string;
  } | null;
};

function getCityDisplayName(city: CityLookupRow | undefined, cityId: number) {
  return city?.name || `城市 #${cityId}`;
}

function resolveCityFromOriginName(
  input: DrawInput,
  cities: CityLookupRow[],
): CityResolution {
  const requestedCity = cities.find((city) => city.id === input.cityId);
  return { cityId: requestedCity?.id ?? input.cityId };
}

async function resolveDrawCityId(
  connection: Pick<PoolConnection, "execute">,
  input: DrawInput,
) {
  const [cityRows] = await connection.execute(
    `SELECT id, name, code, province
     FROM cities
     WHERE is_active = TRUE
     ORDER BY CHAR_LENGTH(name) DESC, id ASC`,
  );

  return resolveCityFromOriginName(input, cityRows as CityLookupRow[]);
}

function buildDestinationGeocodeAddress(row: ActivityRow) {
  const cityName = row.city_name.trim();
  const title = row.title.trim();
  const address = row.address.trim().replace(/\s*·\s*/g, "");
  if (address && address !== cityName && address !== title) return address;
  return `${cityName}${title}`;
}

// 地理编码只用于补全候选距离。不能让冷缓存下的大候选池逐条串行请求外部服务，阻塞抽取结果。
const MAX_DESTINATION_GEOCODES_PER_DRAW = 8;

async function resolveOriginCoordinates(input: DrawInput) {
  if (hasOriginCoordinates(input.preferences)) {
    return {
      latitude: input.preferences.originLatitude,
      longitude: input.preferences.originLongitude,
    };
  }

  const originName = input.preferences.originName?.trim();
  if (!originName) return null;

  const resolved = await geocodeAddressWithAmap(originName);
  return resolved ? { latitude: resolved.latitude, longitude: resolved.longitude } : null;
}

async function enrichCandidateRowsWithCoordinates(
  connection: Pick<PoolConnection, "execute">,
  input: DrawInput,
  rows: ActivityRow[],
) {
  const origin = await resolveOriginCoordinates(input);
  if (!origin) return rows;

  const enrichedRows = [...rows];
  const rowsNeedingCoordinates = enrichedRows
    .filter((row) => toFiniteNumber(row.latitude) === null || toFiniteNumber(row.longitude) === null)
    .slice(0, MAX_DESTINATION_GEOCODES_PER_DRAW);

  const resolvedCoordinates = await Promise.all(
    rowsNeedingCoordinates.map(async (row) => ({
      row,
      resolved: await geocodeAddressWithAmap(buildDestinationGeocodeAddress(row), {
        city: row.city_name,
      }),
    })),
  );

  // MySQL 写入保持串行，避免在同一个事务连接上并发执行；网络地理编码已并行完成。
  for (const { row, resolved } of resolvedCoordinates) {
    if (!resolved) continue;

    row.latitude = resolved.latitude;
    row.longitude = resolved.longitude;
    await connection.execute(
      `UPDATE activities
       SET latitude = ?, longitude = ?
       WHERE id = ? AND (latitude IS NULL OR longitude IS NULL)`,
      [resolved.latitude, resolved.longitude, row.id],
    );
  }

  for (const row of enrichedRows) {
    const latitude = toFiniteNumber(row.latitude);
    const longitude = toFiniteNumber(row.longitude);
    if (latitude !== null && longitude !== null) {
      row.city_distance_km = calculateDistanceKm(origin, { latitude, longitude }).toFixed(2);
    }
  }

  return enrichedRows;
}

function createDistanceSql(preferences: z.infer<typeof preferencesSchema>) {
  if (!hasOriginCoordinates(preferences)) {
    return {
      selectSql: "a.city_distance_km AS city_distance_km",
      selectValues: [] as number[],
      filterSql: "a.city_distance_km <= ?",
      filterValues: [] as number[],
    };
  }

  const originLatitude = preferences.originLatitude;
  const originLongitude = preferences.originLongitude;
  const distanceSql = `
    (6371 * ACOS(
      LEAST(1, GREATEST(-1,
        COS(RADIANS(?)) * COS(RADIANS(a.latitude)) *
        COS(RADIANS(a.longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(a.latitude))
      ))
    ))
  `;
  const distanceValues = [originLatitude, originLongitude, originLatitude];
  const distanceWithFallbackSql = `
    CASE
      WHEN a.latitude IS NULL OR a.longitude IS NULL THEN a.city_distance_km
      ELSE ${distanceSql}
    END
  `;

  return {
    selectSql: `${distanceWithFallbackSql} AS city_distance_km`,
    selectValues: distanceValues,
    filterSql: `a.latitude IS NOT NULL AND a.longitude IS NOT NULL AND ${distanceSql} <= ?`,
    filterValues: distanceValues,
  };
}

function buildActivityQuery(
  input: z.infer<typeof drawSchema>,
  drawSessionId: string,
  options?: {
    preferences?: z.infer<typeof preferencesSchema>;
    applyOptionalFilters?: boolean;
    applyPartySize?: boolean;
    applyDuration?: boolean;
  },
) {
  const preferences = options?.preferences ?? input.preferences;
  const applyOptionalFilters = options?.applyOptionalFilters ?? true;
  const applyPartySize = options?.applyPartySize ?? true;
  const applyDuration = options?.applyDuration ?? true;
  const distance = createDistanceSql(preferences);
  const isCategoryBlindBox = input.preferences.clientSource === "pc" &&
    input.preferences.surpriseLevelLabel?.endsWith("分类盲盒") === true;

  const currentWeek = buildWeekWindow().weekStartDate;
  const conditions = [
    "a.city_id = ?",
    "a.is_active = TRUE",
    ...(isCategoryBlindBox
      ? ["a.source_type = 'itinerary_workbook'"]
      : ["a.content_status = 'published'", "a.content_score >= 70"]),
    `NOT EXISTS (
      SELECT 1
      FROM draw_results dr
      WHERE dr.draw_session_id = ? AND dr.activity_id = a.id
    )`,
    `NOT EXISTS (
      SELECT 1
      FROM todos t
      WHERE t.user_id = ?
        AND t.activity_id = a.id
        AND t.week_start_date = ?
        AND t.status <> 'cancelled'
    )`,
  ];
  const values: Array<string | number> = [
    ...distance.selectValues,
    input.cityId,
    drawSessionId,
    input.userId,
    currentWeek,
  ];

  if (applyPartySize) {
    conditions.push("a.min_party_size <= ?", "a.max_party_size >= ?");
    values.push(input.preferences.partySize, input.preferences.partySize);
  }

  if (applyDuration && preferences.durationMinutes !== null) {
    conditions.push("a.duration_minutes <= ?");
    values.push(preferences.durationMinutes);
  }

  if (applyOptionalFilters) {
    if (preferences.budgetMin !== null && preferences.budgetMin !== undefined) {
      conditions.push(input.preferences.clientSource === "pc" ? "a.budget_yuan >= ?" : "(a.budget_yuan * ?) >= ?");
      if (input.preferences.clientSource === "pc") values.push(preferences.budgetMin);
      else values.push(input.preferences.partySize, preferences.budgetMin);
    }
    if (preferences.budgetMax !== null) {
      conditions.push(input.preferences.clientSource === "pc" ? "a.budget_yuan <= ?" : "(a.budget_yuan * ?) <= ?");
      if (input.preferences.clientSource === "pc") values.push(preferences.budgetMax);
      else values.push(input.preferences.partySize, preferences.budgetMax);
    }

    if (preferences.mood !== "随便") {
      conditions.push("(JSON_CONTAINS(a.mood_tags, JSON_QUOTE(?)) OR a.mood = ?)");
      values.push(preferences.mood, preferences.mood);
    }

    if (preferences.category !== "不限") {
      if (isCategoryBlindBox) {
        conditions.push("(a.category = ? OR JSON_CONTAINS(a.mood_tags, JSON_QUOTE(?)))");
        values.push(preferences.category, preferences.category);
      } else {
        conditions.push("a.category = ?");
        values.push(preferences.category);
      }
    }

    if (isCategoryBlindBox && preferences.travelDurationLabel) {
      conditions.push("JSON_CONTAINS(a.mood_tags, JSON_QUOTE(?))");
      values.push(preferences.travelDurationLabel);
    }

    if (preferences.environment !== "either") {
      conditions.push("(a.environment = ? OR a.environment = 'either')");
      values.push(preferences.environment);
    }

    if (preferences.radiusKm !== null) {
      conditions.push(distance.filterSql);
      values.push(...distance.filterValues, preferences.radiusKm);
    }
  }

  return {
    sql: `
      SELECT
        a.id,
        a.city_id,
        c.name AS city_name,
        a.title,
        a.summary,
        a.description,
        a.category,
        a.mood,
        a.mood_tags,
        a.environment,
        a.rain_friendly,
        a.heat_sensitive,
        a.wind_sensitive,
        a.weather_notes,
        a.last_verified_at,
        a.opening_hours,
        a.reservation_required,
        a.reservation_url,
        a.content_status,
        a.content_score,
        a.quality_issues,
        a.source_type,
        a.source_url,
        a.min_party_size,
        a.max_party_size,
        a.duration_minutes,
        a.budget_yuan,
        ${distance.selectSql},
        a.district,
        a.address,
        a.latitude,
        a.longitude,
        a.navigation_url,
        a.cover_image,
        a.steps,
        a.tips,
        a.accent_color
      FROM activities a
      INNER JOIN cities c ON c.id = a.city_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY RAND()
      LIMIT 1
    `,
    values,
  };
}

function buildCandidatePoolQuery(
  input: z.infer<typeof drawSchema>,
  drawSessionId: string,
  limit = 50,
  options?: {
    activityIds?: number[];
  },
) {
  const distance = createDistanceSql(input.preferences);
  const isCategoryBlindBox = input.preferences.clientSource === "pc" &&
    input.preferences.surpriseLevelLabel?.endsWith("分类盲盒") === true;
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const activityIds = Array.from(new Set(options?.activityIds ?? []))
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  const activityIdPlaceholders = activityIds.map(() => "?").join(", ");
  const currentWeek = buildWeekWindow().weekStartDate;
  const conditions = [
    "a.city_id = ?",
    "a.is_active = TRUE",
    ...(isCategoryBlindBox
      ? ["a.source_type = 'itinerary_workbook'"]
      : ["a.content_status = 'published'", "a.content_score >= 70"]),
    `NOT EXISTS (
          SELECT 1
          FROM draw_results dr
          WHERE dr.draw_session_id = ? AND dr.activity_id = a.id
        )`,
    `NOT EXISTS (
          SELECT 1
          FROM todos t
          WHERE t.user_id = ?
            AND t.activity_id = a.id
            AND t.week_start_date = ?
            AND t.status <> 'cancelled'
        )`,
  ];
  const values: Array<string | number> = [
    ...distance.selectValues,
    input.cityId,
    drawSessionId,
    input.userId,
    currentWeek,
  ];

  if (isCategoryBlindBox) {
    conditions.push("a.min_party_size <= ?", "a.max_party_size >= ?");
    values.push(input.preferences.partySize, input.preferences.partySize);
    if (input.preferences.budgetMin !== null && input.preferences.budgetMin !== undefined) {
      conditions.push("a.budget_yuan >= ?");
      values.push(input.preferences.budgetMin);
    }
    if (input.preferences.budgetMax !== null) {
      conditions.push("a.budget_yuan <= ?");
      values.push(input.preferences.budgetMax);
    }
    if (input.preferences.category !== "不限") {
      conditions.push("(a.category = ? OR JSON_CONTAINS(a.mood_tags, JSON_QUOTE(?)))");
      values.push(input.preferences.category, input.preferences.category);
    }
    if (input.preferences.travelDurationLabel) {
      conditions.push("JSON_CONTAINS(a.mood_tags, JSON_QUOTE(?))");
      values.push(input.preferences.travelDurationLabel);
    }
  }

  if (activityIds.length > 0) {
    conditions.push(`a.id IN (${activityIdPlaceholders})`);
    values.push(...activityIds);
  }

  const orderSql =
    activityIds.length > 0
      ? `FIELD(a.id, ${activityIdPlaceholders})`
      : "city_distance_km ASC, a.id ASC";

  if (activityIds.length > 0) {
    values.push(...activityIds);
  }

  return {
    sql: `
      SELECT
        a.id,
        a.city_id,
        c.name AS city_name,
        a.title,
        a.summary,
        a.description,
        a.category,
        a.mood,
        a.mood_tags,
        a.environment,
        a.rain_friendly,
        a.heat_sensitive,
        a.wind_sensitive,
        a.weather_notes,
        a.last_verified_at,
        a.opening_hours,
        a.reservation_required,
        a.reservation_url,
        a.content_status,
        a.content_score,
        a.quality_issues,
        a.source_type,
        a.source_url,
        a.min_party_size,
        a.max_party_size,
        a.duration_minutes,
        a.budget_yuan,
        ${distance.selectSql},
        a.district,
        a.address,
        a.latitude,
        a.longitude,
        a.navigation_url,
        a.cover_image,
        a.steps,
        a.tips,
        a.accent_color
      FROM activities a
      INNER JOIN cities c ON c.id = a.city_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderSql}
      LIMIT ${safeLimit}
    `,
    values,
  };
}

function parseDrawInput(input: unknown) {
  return drawSchema.parse(input);
}

async function findActivityForDraw(
  connection: Pick<PoolConnection, "execute">,
  input: z.infer<typeof drawSchema>,
  drawSessionId: string,
) {
  let cityWeather: Awaited<ReturnType<typeof getCityWeather>> = null;
  try {
    const [cityRows] = await connection.execute("SELECT name FROM cities WHERE id = ? AND is_active = TRUE LIMIT 1", [input.cityId]);
    const cityName = (cityRows as Array<{ name: string }>)[0]?.name;
    cityWeather = cityName ? await getCityWeather(cityName) : null;
  } catch (error) {
    console.warn({ error, cityId: input.cityId }, "Weather lookup failed; continuing without weather hard filters");
  }
  try {
    const activityIds = await activityVectorService.searchActivityIds(
      { cityId: input.cityId, preferences: input.preferences },
      DRAW_SEMANTIC_TOP_K,
    );

    if (activityIds.length > 0) {
      const semanticQuery = buildCandidatePoolQuery(input, drawSessionId, activityIds.length, {
        activityIds,
      });
      const [semanticRows] = await connection.execute(semanticQuery.sql, semanticQuery.values);
      const enrichedSemanticRows = await enrichCandidateRowsWithCoordinates(
        connection,
        input,
        semanticRows as ActivityRow[],
      );
      const semanticSelection = await selectActivityWithRecommendation(
        input.preferences,
        enrichedSemanticRows,
        input.drawContext,
        cityWeather,
      );

      if (semanticSelection.status === "selected") {
        return semanticSelection;
      }

      console.warn("Chroma activity recall returned no compatible draw selection; falling back to SQL pool");
    }
  } catch (error) {
    console.warn({ error }, "Chroma activity recall failed; falling back to SQL pool");
  }

  const query = buildCandidatePoolQuery(input, drawSessionId);
  const [activityRows] = await connection.execute(query.sql, query.values);
  const fallbackRows = activityRows as ActivityRow[];
  if (fallbackRows.length === 0) {
    return {
      status: "no_result" as const,
      suggestion: "本周已有行程已自动避开，当前条件下暂时没有新的可抽取行程，建议扩大目的地范围或调整预算后重试。",
    };
  }
  const rows = await enrichCandidateRowsWithCoordinates(connection, input, fallbackRows);
  return selectActivityWithRecommendation(input.preferences, rows, input.drawContext, cityWeather);
}

const activitySelect = `
  SELECT a.*, c.name AS city_name
  FROM activities a
  INNER JOIN cities c ON c.id = a.city_id
`;

function getBearerUserId(request: Request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }

  try {
    return verifyAuthToken(authorization.slice("Bearer ".length));
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "登录已过期，请重新登录");
  }
}

function parseStoredPreferences(value: unknown): z.infer<typeof preferencesSchema> | null {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  try {
    return preferencesSchema.parse(value);
  } catch {
    return null;
  }
}

async function getCurrentDrawForUser(userId: number) {
  const [sessionRows] = await pool.execute(
    `SELECT id, city_id, attempts_used, preferences
     FROM draw_sessions
     WHERE user_id = ?
       AND status = 'active'
       AND DATE(CONVERT_TZ(created_at, @@session.time_zone, '+08:00')) =
           DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+08:00'))
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId],
  );

  const session = (sessionRows as Array<{ id: string; city_id: number; attempts_used: number; preferences: string | null }>)[0];
  if (!session) {
    return null;
  }

  const preferences = parseStoredPreferences(session.preferences);
  if (!preferences) {
    return null;
  }

  const [resultRows] = await pool.execute(
    `${activitySelect}
      INNER JOIN draw_results dr ON dr.activity_id = a.id
     WHERE dr.draw_session_id = ?
       AND a.is_active = TRUE
     ORDER BY dr.attempt_no DESC
     LIMIT 1`,
    [session.id],
  );

  const result = (resultRows as Array<{ attempt_no: number } & ActivityRow>)[0];
  if (!result) {
    return null;
  }

  const dailyAttemptsUsed = await getDailyDrawCount(pool, userId);
  return {
    draw: {
      drawSessionId: session.id,
      attemptsUsed: dailyAttemptsUsed,
      attemptsRemaining: Math.max(0, DAILY_DRAW_LIMIT - dailyAttemptsUsed),
      activity: toActivityDto(result),
    },
    input: {
      cityId: Number(session.city_id),
      preferences,
    },
  };
}

async function getDailyDrawCount(
  connection: Pick<PoolConnection, "execute">,
  userId: number,
) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS drawCount
     FROM draw_results dr
     INNER JOIN draw_sessions ds ON ds.id = dr.draw_session_id
     WHERE ds.user_id = ?
       AND DATE(CONVERT_TZ(dr.created_at, @@session.time_zone, '+08:00')) =
           DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+08:00'))`,
    [userId],
  );
  return Number((rows as Array<{ drawCount: number }>)[0]?.drawCount ?? 0);
}

/** 开发环境下允许任意 localhost 端口，避免 Expo Web 端口变化导致 CORS 失败 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (config.clientOrigins.includes("*")) return true;
  if (config.clientOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  return false;
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    pinoHttp({
      level: config.logLevel,
      redact: ["req.headers.authorization", "req.body.password", "req.body.code"],
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use("/uploads", express.static(resolve(process.cwd(), "uploads")));
  app.use("/assets", express.static(resolve(process.cwd(), "assets")));
  app.use(express.json({ limit: "30mb" }));

  app.get(
    "/api/v1/health",
    asyncRoute(async (_request, response) => {
      await pool.query("SELECT 1");
      response.json({
        ok: true,
        service: "lazyde-api",
        timestamp: new Date().toISOString(),
      });
    }),
  );

  app.get(
    "/api/v1/cities",
    asyncRoute(async (_request, response) => {
      const [rows] = await pool.query(
        `SELECT id, name, code, province
         FROM cities
         WHERE is_active = TRUE
         ORDER BY CASE WHEN name = '北京' THEN 0 ELSE 1 END, id`,
      );
      response.json({ data: rows });
    }),
  );

  app.get(
    "/api/v1/content/coverage",
    asyncRoute(async (_request, response) => {
      const [rows] = await pool.query(
        `SELECT
           c.id AS cityId,
           c.name AS cityName,
           COUNT(a.id) AS totalActivities,
           COUNT(DISTINCT CASE WHEN a.content_status = 'published' AND a.content_score >= 70 AND a.is_active = TRUE THEN COALESCE(a.place_key, CONCAT(a.city_id, ':', a.address)) END) AS uniquePlaces,
           SUM(CASE WHEN a.content_status = 'published' AND a.content_score >= 70 AND a.is_active = TRUE THEN 1 ELSE 0 END) AS recommendableActivities,
           SUM(CASE WHEN a.content_status IN ('draft', 'review') THEN 1 ELSE 0 END) AS pendingReview,
           SUM(CASE WHEN a.environment = 'indoor' AND a.content_status = 'published' AND a.content_score >= 70 THEN 1 ELSE 0 END) AS indoorActivities,
           SUM(CASE WHEN a.rain_friendly = 'yes' AND a.content_status = 'published' AND a.content_score >= 70 THEN 1 ELSE 0 END) AS rainFriendlyActivities,
           SUM(CASE WHEN a.budget_yuan <= 50 AND a.content_status = 'published' AND a.content_score >= 70 THEN 1 ELSE 0 END) AS lowBudgetActivities,
           ROUND(AVG(CASE WHEN a.content_status = 'published' THEN a.content_score END), 1) AS averageScore
         FROM cities c
         LEFT JOIN activities a ON a.city_id = c.id AND a.content_status <> 'archived'
         WHERE c.is_active = TRUE
         GROUP BY c.id, c.name
         ORDER BY recommendableActivities ASC, c.id ASC`,
      );
      response.json({ data: rows });
    }),
  );

  app.get(
    "/api/v1/preferences/options",
    asyncRoute(async (_request, response) => {
      const [activityRows] = await pool.query(
        `SELECT mood, mood_tags AS moodTags
         FROM activities
         WHERE is_active = TRUE AND content_status = 'published' AND content_score >= 70`,
      );
      const moods = new Set<string>();
      for (const row of activityRows as Array<{ mood: string; moodTags: unknown }>) {
        for (const mood of parseJsonArray(row.moodTags)) {
          if (mood) moods.add(mood);
        }
        if (row.mood) moods.add(row.mood);
      }

      response.json({
        data: {
          partySizes: [
            { label: "独自", value: 1 },
            { label: "双人", value: 2 },
            { label: "3–5 人", value: 4 },
            { label: "6 人以上", value: 6 },
          ],
          durations: [
            { label: "1 小时内", value: 60 },
            { label: "2–3 小时", value: 180 },
            { label: "半天", value: 360 },
            { label: "一天", value: 720 },
          ],
          budgets: [
            { label: "免费", value: 0 },
            { label: "50 元内", value: 50 },
            { label: "100 元内", value: 100 },
            { label: "300 元内", value: 300 },
            { label: "不限", value: null },
          ],
          moods: ["随便", ...Array.from(moods).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))],
          categories: ["不限", "探索", "文艺", "惊喜", "美食"],
          environments: [
            { label: "不限", value: "either" },
            { label: "室内", value: "indoor" },
            { label: "室外", value: "outdoor" },
          ],
          radiuses: [
            { label: "3 km", value: 3 },
            { label: "10 km", value: 10 },
            { label: "全城", value: null },
          ],
        },
      });
    }),
  );

  app.get(
    "/api/v1/activities",
    asyncRoute(async (request, response) => {
      const query = homeCommunityFeedSchema.parse(request.query);
      const filters: string[] = query.sourceType === "itinerary_workbook"
        ? ["a.is_active = TRUE", "a.source_type = 'itinerary_workbook'"]
        : ["a.is_active = TRUE", "a.content_status = 'published'", "a.content_score >= 70"];
      const params: Array<string | number> = [];
      const tagFilters: Array<string | number> = [];

      if (query.cityId) {
        filters.push("a.city_id = ?");
        params.push(query.cityId);
      }

      if (query.channel && query.channel !== "推荐") {
        if (query.channel === "附近") {
          filters.push("a.city_distance_km IS NOT NULL");
        } else if (query.channel === "低预算") {
          filters.push("a.budget_yuan <= 100");
        } else if (query.channel === "City Walk") {
          filters.push("(a.category = '探索' OR a.mood = '探索' OR JSON_CONTAINS(a.mood_tags, CAST(? AS JSON), '$'))");
          tagFilters.push(JSON.stringify("City Walk"));
        } else if (query.channel === "搭子") {
          filters.push("(a.mood = '社交' OR a.category = '美食' OR JSON_CONTAINS(a.mood_tags, CAST(? AS JSON), '$'))");
          tagFilters.push(JSON.stringify("搭子"));
        } else if (query.channel === "雨天") {
          filters.push("(a.summary LIKE '%雨%' OR a.description LIKE '%雨%' OR a.title LIKE '%雨%' OR a.mood = '治愈')");
        } else if (query.channel !== "随便") {
          filters.push("(a.mood = ? OR a.category = ? OR JSON_CONTAINS(a.mood_tags, CAST(? AS JSON), '$'))");
          tagFilters.push(JSON.stringify(query.channel));
          params.push(query.channel, query.channel);
        }
      }

      const whereSql = [...filters];
      const queryParams: Array<string | number> = [...params, ...tagFilters];
      const countRows = (await pool.execute(`SELECT COUNT(*) AS total FROM activities a WHERE ${whereSql.join(" AND ")}`, queryParams))[0] as Array<{
        total: string;
      }>;
      const total = Number(countRows[0]?.total ?? 0);
      const rows = (await pool.execute(
        `${activitySelect}
         WHERE ${whereSql.join(" AND ")}
         ORDER BY a.city_distance_km ASC, a.id DESC
         LIMIT ${query.limit}
         OFFSET ${query.offset}`,
        queryParams,
      ))[0] as ActivityRow[];

      response.json({
        data: {
          items: rows.map((row) => ({
            id: row.id,
            title: row.title,
            summary: row.summary,
            description: row.description,
            cityName: row.city_name,
            mood: row.mood,
            moodTags: parseJsonArray(row.mood_tags),
            category: row.category,
            budgetYuan: Number(row.budget_yuan),
            durationMinutes: Number(row.duration_minutes),
            minPartySize: Number(row.min_party_size),
            maxPartySize: Number(row.max_party_size),
            coverImageUri: row.cover_image,
            steps: parseJsonArray(row.steps),
            tips: parseJsonArray(row.tips),
            accentColor: row.accent_color || "#7357FF",
            district: row.district,
          })),
          total,
          limit: query.limit,
          offset: query.offset,
        },
      });
    }),
  );

  app.post(
    "/api/v1/session/guest",
    asyncRoute(async (request, response) => {
      const input = guestSessionSchema.parse(request.body);
      await pool.execute(
        `INSERT INTO users (device_id)
         VALUES (?)
         ON DUPLICATE KEY UPDATE last_seen_at = CURRENT_TIMESTAMP`,
        [input.deviceId],
      );
      const [rows] = await pool.execute(
        `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
         FROM users
         WHERE device_id = ?`,
        [input.deviceId],
      );
      const user = (rows as UserRow[])[0];
      if (!user) {
        throw new AppError(500, "GUEST_SESSION_FAILED", "访客会话创建失败");
      }
      response.status(201).json({ data: await toUserDtoForRequest(request, user) });
    }),
  );

  app.post(
    "/api/v1/auth/code",
    asyncRoute(async (request, response) => {
      const input = sendAuthCodeSchema.parse(request.body);
      const authCode = issueAuthCode(input.email);
      try {
        await sendAuthCodeEmail(input.email, authCode.code, {
          expiresInSeconds: authCode.expiresInSeconds,
        });
      } catch (error) {
        authCodeStore.delete(input.email);
        throw error;
      }
      request.log.info({ email: input.email, emailProvider: config.email.provider }, "邮箱验证码已发送");

      response.status(201).json({
        data: {
          expiresInSeconds: authCode.expiresInSeconds,
          retryAfterSeconds: authCode.retryAfterSeconds,
          ...(config.email.provider === "mock" && process.env.NODE_ENV !== "production"
            ? { devCode: authCode.code }
            : {}),
        },
      });
    }),
  );

  app.post(
    "/api/v1/auth/register",
    asyncRoute(async (request, response) => {
      const input = registerSchema.parse(request.body);
      assertValidAuthCode(input.email, input.code);

      const user = await withTransaction((connection) => authenticateByEmailCode(connection, input));

      if (!user) {
        throw new AppError(500, "REGISTER_FAILED", "注册失败，请稍后重试");
      }
      consumeAuthCode(input.email);

      response.status(201).json({
        data: {
          token: signAuthToken(user.id),
          user: await toUserDtoForRequest(request, user),
        },
      });
    }),
  );

  app.post(
    "/api/v1/auth/login",
    asyncRoute(async (request, response) => {
      const input = loginSchema.parse(request.body);
      assertValidAuthCode(input.email, input.code);

      const user = await withTransaction((connection) => authenticateByEmailCode(connection, input));
      if (!user) {
        throw new AppError(500, "LOGIN_FAILED", "登录失败，请稍后重试");
      }
      consumeAuthCode(input.email);

      response.json({
        data: {
          token: signAuthToken(user.id),
          user: await toUserDtoForRequest(request, user),
        },
      });
    }),
  );

  app.get(
    "/api/v1/auth/me",
    asyncRoute(async (request, response) => {
      const userId = readAuthenticatedUserId(request);

      const [rows] = await pool.execute(
        `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
         FROM users
         WHERE id = ?`,
        [userId],
      );
      const user = (rows as UserRow[])[0];

      if (!user || user.auth_type !== "registered") {
        throw new AppError(401, "UNAUTHORIZED", "请先登录");
      }

      response.json({ data: await toUserDtoForRequest(request, user) });
    }),
  );

  app.patch(
    "/api/v1/users/me/profile",
    asyncRoute(async (request, response) => {
      const userId = readAuthenticatedUserId(request);
      const input = profileUpdateSchema.parse(request.body);
      const nickname = input.nickname;

      if (nickname === undefined) {
        throw new AppError(400, "PROFILE_UPDATE_EMPTY", "请提供要更新的资料");
      }

      const [rows] = await pool.execute(
        `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
         FROM users
         WHERE id = ?`,
        [userId],
      );
      const user = (rows as UserRow[])[0];
      if (!user || user.auth_type !== "registered") {
        throw new AppError(401, "UNAUTHORIZED", "请先登录");
      }

      await pool.execute(
        `UPDATE users
         SET nickname = ?
         WHERE id = ?`,
        [nickname, userId],
      );

      const [updatedRows] = await pool.execute(
        `SELECT id, device_id, phone, email, password_hash, auth_type, nickname, avatar_uri
         FROM users
         WHERE id = ?`,
        [userId],
      );
      const updatedUser = (updatedRows as UserRow[])[0];
      if (!updatedUser) {
        throw new AppError(500, "PROFILE_UPDATE_FAILED", "保存失败，请稍后重试");
      }

      response.json({ data: await toUserDtoForRequest(request, updatedUser) });
    }),
  );

  app.post(
    "/api/v1/users/:userId/avatar",
    asyncRoute(async (request, response) => {
      const userId = z.coerce.number().int().positive().parse(request.params.userId);
      const input = avatarUploadSchema.parse(request.body);
      const avatar = parseAvatarImage(input);

      const [rows] = await pool.execute(
        `SELECT id, avatar_uri
         FROM users
         WHERE id = ?`,
        [userId],
      );
      const user = (rows as Array<{ id: number; avatar_uri: string | null }>)[0];
      if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "用户不存在");
      }

      await mkdir(avatarUploadDir, { recursive: true });
      const filename = `${userId}-${Date.now()}-${randomUUID()}.${avatar.extension}`;
      await writeFile(join(avatarUploadDir, filename), avatar.buffer);

      const nextAvatarUri = avatarUrl(request, filename);
      await pool.execute(
        `UPDATE users
         SET avatar_uri = ?
         WHERE id = ?`,
        [nextAvatarUri, userId],
      );
      await removeStoredAvatar(user.avatar_uri);

      response.status(201).json({
        data: {
          avatarUri: nextAvatarUri,
          mimeType: avatar.mimeType,
          sizeBytes: avatar.buffer.byteLength,
        },
      });
    }),
  );

  app.delete(
    "/api/v1/users/:userId/avatar",
    asyncRoute(async (request, response) => {
      const userId = z.coerce.number().int().positive().parse(request.params.userId);
      const [rows] = await pool.execute(
        `SELECT id, avatar_uri
         FROM users
         WHERE id = ?`,
        [userId],
      );
      const user = (rows as Array<{ id: number; avatar_uri: string | null }>)[0];
      if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "用户不存在");
      }

      await pool.execute(
        `UPDATE users
         SET avatar_uri = NULL
         WHERE id = ?`,
        [userId],
      );
      await removeStoredAvatar(user.avatar_uri);

      response.json({ data: { avatarUri: null } });
    }),
  );

  app.get(
    "/api/v1/activities/:id",
    asyncRoute(async (request, response) => {
      const activityId = z.coerce.number().int().positive().parse(request.params.id);
      const [rows] = await pool.execute(
        `${activitySelect} WHERE a.id = ? AND a.is_active = TRUE`,
        [activityId],
      );
      const activity = (rows as ActivityRow[])[0];

      if (!activity) {
        throw new AppError(404, "ACTIVITY_NOT_FOUND", "这个玩法不存在或已经下架");
      }

      response.json({ data: toActivityDto(activity) });
    }),
  );

  app.post(
    "/api/v1/draws",
    asyncRoute(async (request, response) => {
      const input = normalizeRadiusWithoutPreciseOrigin(drawSchema.parse(request.body));

      const result = await withTransaction(async (connection) => {
        const cityResolution = await resolveDrawCityId(connection, input);
        if (cityResolution.cityMismatchHint) {
          const { requestCityName, detectedCityName } = cityResolution.cityMismatchHint;
          throw new AppError(
            422,
            "CITY_MISMATCH",
            `出发地定位在“${detectedCityName}”，但当前抽取城市是“${requestCityName}”，请先切换城市后重试。`,
          );
        }
        const drawInput: DrawInput =
          cityResolution.cityId === input.cityId ? input : { ...input, cityId: cityResolution.cityId };
        const drawSessionId = input.drawSessionId ?? randomUUID();
        const dailyAttemptsUsed = await getDailyDrawCount(connection, drawInput.userId);

        if (dailyAttemptsUsed >= DAILY_DRAW_LIMIT) {
          throw new AppError(
            429,
            "DAILY_DRAW_LIMIT_REACHED",
            "今天的 3 次抽卡机会已经用完，明天 0 点后再来吧",
            { limit: DAILY_DRAW_LIMIT, used: dailyAttemptsUsed, remaining: 0 },
          );
        }

        if (!input.drawSessionId) {
          await connection.execute(
            `INSERT INTO draw_sessions
              (id, user_id, city_id, attempts_used, preferences)
             VALUES (?, ?, ?, 0, ?)`,
            [
              drawSessionId,
              drawInput.userId,
              drawInput.cityId,
              JSON.stringify(drawInput.preferences),
            ],
          );
        }

        const [sessionRows] = await connection.execute(
          `SELECT id, user_id, city_id, attempts_used, status
           FROM draw_sessions
           WHERE id = ?
           FOR UPDATE`,
          [drawSessionId],
        );
        const session = (
          sessionRows as Array<{
            id: string;
            user_id: number;
            city_id: number;
            attempts_used: number;
            status: string;
          }>
        )[0];

        if (!session || session.user_id !== drawInput.userId || session.city_id !== drawInput.cityId) {
          throw new AppError(404, "DRAW_SESSION_NOT_FOUND", "抽取会话不存在");
        }

        if (session.status !== "active") {
          throw new AppError(409, "DRAW_SESSION_CLOSED", "这次抽取已经结束");
        }

        if (session.attempts_used >= 3) {
          throw new AppError(409, "DRAW_LIMIT_REACHED", "本次免费抽取已经用完");
        }

        const selection = await findActivityForDraw(connection, drawInput, drawSessionId);

        if (selection.status === "no_result") {
          throw new AppError(
            422,
            "NO_MATCH",
            selection.suggestion,
            { suggestion: selection.suggestion },
          );
        }

        const { activity, recommendation } = selection;
        const attemptNo = session.attempts_used + 1;
        await connection.execute(
          `INSERT INTO draw_results
            (draw_session_id, activity_id, attempt_no)
           VALUES (?, ?, ?)`,
          [drawSessionId, activity.id, attemptNo],
        );
        await connection.execute(
          `UPDATE draw_sessions
           SET attempts_used = ?
           WHERE id = ?`,
          [attemptNo, drawSessionId],
        );

        return {
          drawSessionId,
          attemptsUsed: dailyAttemptsUsed + 1,
          attemptsRemaining: Math.max(0, DAILY_DRAW_LIMIT - dailyAttemptsUsed - 1),
          activity: toActivityDto(activity),
          recommendation,
        };
      });

      response.status(input.drawSessionId ? 200 : 201).json({ data: result });
    }),
  );

  app.get(
    "/api/v1/draws/current",
    asyncRoute(async (request, response) => {
      const userId = getBearerUserId(request);
      const current = await getCurrentDrawForUser(userId);
      if (!current) {
        response.json({ data: null });
        return;
      }

      response.json({ data: current });
    }),
  );

  registerTodoRoutes(app);
  registerCheckinRoutes(app);
  registerTravelRoutes(app);
  registerContentAdminRoutes(app);
  registerPaymentRoutes(app);

  app.use((_request, _response, next) => {
    next(new AppError(404, "ROUTE_NOT_FOUND", "接口不存在"));
  });

  app.use(
    (error: unknown, request: Request, response: Response, _next: NextFunction) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        (error as { type?: unknown }).type === "entity.too.large"
      ) {
        response.status(413).json({
          error: {
            code: "REQUEST_TOO_LARGE",
            message: "上传内容太大，请换一张更小的图片",
          },
        });
        return;
      }

      if (error instanceof ZodError) {
        response.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "提交的信息格式不正确",
            details: error.flatten(),
          },
        });
        return;
      }

      if (error instanceof AppError) {
        const retryAfterSeconds =
          typeof error.details === "object" &&
          error.details !== null &&
          "retryAfterSeconds" in error.details &&
          typeof error.details.retryAfterSeconds === "number" &&
          Number.isFinite(error.details.retryAfterSeconds) &&
          error.details.retryAfterSeconds > 0
            ? Math.ceil(error.details.retryAfterSeconds)
            : null;

        if (error.statusCode === 429 && retryAfterSeconds !== null) {
          response.setHeader("Retry-After", String(retryAfterSeconds));
        }

        response.status(error.statusCode).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }

      request.log.error({ err: error }, "未处理的 API 错误");
      response.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "服务暂时开小差了，请稍后重试",
        },
      });
    },
  );

  return app;
}

export {
  buildCandidatePoolQuery,
  buildActivityQuery,
  findCityIdFromOriginName,
  parseAvatarImage,
  parseDrawInput,
  resolveCityFromOriginName,
};
