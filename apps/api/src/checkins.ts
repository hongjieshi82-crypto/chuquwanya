import type { Express, NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "./auth.js";
import { isSupabaseAuthConfigured, requestAuthUserId } from "./supabase-auth.js";
import { pool } from "./db.js";
import { AppError } from "./errors.js";
import { buildWeekWindow, toChinaDateKey } from "./todos.js";

const WEEK_DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;
const rewardThreshold = 5;
const rewardPoints = 1;
const rewardType = "next_week_points" as const;
const completedTodoXp = 20;
const approvedDiaryXp = 12;
const checkinXp = 5;

const levelTable = [
  { level: 1, minXp: 0, name: "城市探索者" },
  { level: 2, minXp: 80, name: "新手探路者" },
  { level: 3, minXp: 180, name: "城市漫游者" },
  { level: 4, minXp: 320, name: "旅程探索者" },
  { level: 5, minXp: 500, name: "周末向导" },
  { level: 6, minXp: 760, name: "行程策划师" },
  { level: 7, minXp: 1_100, name: "节奏大师" },
  { level: 8, minXp: 1_500, name: "奇遇骑士" },
  { level: 9, minXp: 2_000, name: "出行导师" },
  { level: 10, minXp: 2_700, name: "城市驭者" },
] as const;

type CheckinDateValue = Date | string;

type WeekCheckinDay = {
  date: string;
  weekday: (typeof WEEK_DAY_LABELS)[number];
  status: "signed" | "failed" | "idle";
  isToday: boolean;
};

type WeekCheckinSummary = {
  today: string;
  weekStart: string;
  signedDays: number;
  failedDays: number;
  rewardThreshold: number;
  remainingDaysForReward: number;
  rewardEarned: boolean;
  rewardType: typeof rewardType;
  rewardPoints: number;
  rewardLabel: string;
  days: WeekCheckinDay[];
};

type UserProfileProgress = {
  level: number;
  levelName: string;
  totalXp: number;
  levelProgressXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  levelProgressPercent: number;
  completedTodoCount: number;
  approvedDiaryCount: number;
  checkinCount: number;
  weekCheckinDays: number;
  nextLevelName: string;
};

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function normalizeCheckinDate(value: CheckinDateValue) {
  return value instanceof Date ? toChinaDateKey(value) : value.slice(0, 10);
}

function addDateKeyDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toCount(value: { count: string | number }) {
  return Number(value.count);
}

function resolveProfileProgress(
  totalXp: number,
  completedTodoCount: number,
  approvedDiaryCount: number,
  checkinCount: number,
  weekCheckinDays: number,
) {
  let levelIndex = 0;
  for (let i = levelTable.length - 1; i >= 1; i -= 1) {
    const candidate = levelTable[i];
    if (!candidate) {
      continue;
    }
    if (totalXp >= candidate.minXp) {
      levelIndex = i;
      break;
    }
  }

  const level = levelTable[levelIndex]!;
  const next = levelTable[levelIndex + 1];
  const nextLevelXp = next?.minXp ?? totalXp;
  const levelRange = Math.max(nextLevelXp - level.minXp, 1);
  const currentRange = totalXp - level.minXp;
  const xpToNextLevel = next ? Math.max(next.minXp - totalXp, 0) : 0;

  return {
    level: level.level,
    levelName: level.name,
    totalXp,
    levelProgressXp: Math.max(currentRange, 0),
    nextLevelXp,
    xpToNextLevel,
    levelProgressPercent: next ? Math.min(currentRange / levelRange, 1) : 1,
    completedTodoCount,
    approvedDiaryCount,
    checkinCount,
    weekCheckinDays,
    nextLevelName: next?.name ?? level.name,
  };
}

function getAuthenticatedUserId(request: Request) {
  const supabaseUserId = requestAuthUserId(request);
  if (supabaseUserId !== null) return supabaseUserId;
  if (isSupabaseAuthConfigured()) throw new AppError(401, "INVALID_TOKEN", "登录已过期，请重新登录");
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

async function assertRegisteredUser(userId: number) {
  const [rows] = await pool.execute(
    "SELECT id FROM users WHERE id = ? AND auth_type = 'registered'",
    [userId],
  );

  if (!(rows as Array<{ id: number }>)[0]) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }
}

export function buildWeekCheckinSummary(
  signedDateValues: CheckinDateValue[],
  referenceDate = new Date(),
): WeekCheckinSummary {
  const signedDates = new Set(signedDateValues.map(normalizeCheckinDate));
  const today = toChinaDateKey(referenceDate);
  const { weekStartDate: weekStart } = buildWeekWindow(today);

  const days = WEEK_DAY_LABELS.map<WeekCheckinDay>((weekday, index) => {
    const dateKey = addDateKeyDays(weekStart, index);
    const isToday = dateKey === today;
    const status = signedDates.has(dateKey) ? "signed" : dateKey < today ? "failed" : "idle";

    return {
      date: dateKey,
      weekday,
      status,
      isToday,
    };
  });

  const signedDays = days.filter((day) => day.status === "signed").length;
  const failedDays = days.filter((day) => day.status === "failed").length;

  return {
    today,
    weekStart,
    signedDays,
    failedDays,
    rewardThreshold,
    remainingDaysForReward: Math.max(rewardThreshold - signedDays, 0),
    rewardEarned: signedDays >= rewardThreshold,
    rewardType,
    rewardPoints,
    rewardLabel: `下周获得 ${rewardPoints} 个积分`,
    days,
  };
}

async function getWeekCheckinSummary(userId: number) {
  const now = new Date();
  const { weekStartDate, weekEndDate } = buildWeekWindow(toChinaDateKey(now));

  const [rows] = await pool.execute(
    `SELECT checkin_date AS checkinDate
     FROM user_checkins
     WHERE user_id = ?
       AND checkin_date BETWEEN ? AND ?
     ORDER BY checkin_date`,
    [userId, weekStartDate, weekEndDate],
  );

  return buildWeekCheckinSummary(
    (rows as Array<{ checkinDate: CheckinDateValue }>).map((row) => row.checkinDate),
    now,
  );
}

async function getProfileProgress(userId: number): Promise<UserProfileProgress> {
  const [completedTodoRows] = await pool.execute(
    "SELECT COUNT(*) AS count FROM todos WHERE user_id = ? AND status = 'completed'",
    [userId],
  );
  const [approvedDiaryRows] = await pool.execute(
    "SELECT COUNT(*) AS count FROM todo_completion_submissions WHERE user_id = ? AND review_status = 'approved'",
    [userId],
  );
  const [checkinRows] = await pool.execute(
    "SELECT COUNT(*) AS count FROM user_checkins WHERE user_id = ?",
    [userId],
  );

  const completedTodoCount = toCount((completedTodoRows as Array<{ count: string | number }>)[0] ?? { count: 0 });
  const approvedDiaryCount = toCount((approvedDiaryRows as Array<{ count: string | number }>)[0] ?? { count: 0 });
  const checkinCount = toCount((checkinRows as Array<{ count: string | number }>)[0] ?? { count: 0 });
  const weekSummary = await getWeekCheckinSummary(userId);
  const totalXp = completedTodoCount * completedTodoXp
    + approvedDiaryCount * approvedDiaryXp
    + checkinCount * checkinXp;

  return resolveProfileProgress(
    totalXp,
    completedTodoCount,
    approvedDiaryCount,
    checkinCount,
    weekSummary.signedDays,
  );
}

export function registerCheckinRoutes(app: Express) {
  app.get(
    "/api/v1/checkins/week",
    asyncRoute(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      await assertRegisteredUser(userId);
      response.json({ data: await getWeekCheckinSummary(userId) });
    }),
  );

  app.post(
    "/api/v1/checkins/today",
    asyncRoute(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      await assertRegisteredUser(userId);

      const today = toChinaDateKey();
      const [existingRows] = await pool.execute(
        "SELECT id FROM user_checkins WHERE user_id = ? AND checkin_date = ? LIMIT 1",
        [userId, today],
      );
      const alreadySigned = Boolean((existingRows as Array<{ id: number }>)[0]);

      await pool.execute(
        `INSERT INTO user_checkins (user_id, checkin_date, source)
         VALUES (?, ?, 'auto_login')
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [userId, today],
      );

      response.status(alreadySigned ? 200 : 201).json({
        data: {
          alreadySigned,
          ...(await getWeekCheckinSummary(userId)),
        },
      });
    }),
  );

  app.get(
    "/api/v1/profile/progress",
    asyncRoute(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      await assertRegisteredUser(userId);
      response.json({ data: await getProfileProgress(userId) });
    }),
  );
}
