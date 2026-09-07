import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { PoolConnection } from "mysql2/promise";

import { config } from "./config.js";

export type AuthTokenPayload = {
  userId: number;
};

export type UserRow = {
  id: number;
  device_id: string | null;
  phone: string | null;
  email: string | null;
  password_hash: string | null;
  auth_type: "guest" | "registered";
  nickname: string;
  avatar_uri: string | null;
};

export function toUserDto(user: UserRow) {
  return {
    id: user.id,
    deviceId: user.device_id,
    phone: user.phone,
    email: user.email,
    nickname: user.nickname,
    authType: user.auth_type,
    avatarUri: user.avatar_uri,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(userId: number) {
  return jwt.sign({ userId } satisfies AuthTokenPayload, config.jwtSecret, {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string) {
  const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
  return payload.userId;
}

export async function mergeGuestIntoUser(
  connection: Pick<PoolConnection, "execute">,
  guestUserId: number,
  targetUserId: number,
) {
  if (guestUserId === targetUserId) {
    return;
  }

  await connection.execute(
    `UPDATE users target
     INNER JOIN users guest ON guest.id = ?
     SET target.avatar_uri = COALESCE(target.avatar_uri, guest.avatar_uri)
     WHERE target.id = ?`,
    [guestUserId, targetUserId],
  );

  await connection.execute(
    `INSERT IGNORE INTO saved_activities (user_id, activity_id, created_at)
     SELECT ?, activity_id, created_at FROM saved_activities WHERE user_id = ?`,
    [targetUserId, guestUserId],
  );
  await connection.execute("DELETE FROM saved_activities WHERE user_id = ?", [guestUserId]);

  await connection.execute(
    `INSERT INTO activity_reactions (user_id, activity_id, reaction, updated_at)
     SELECT ?, source.activity_id, source.reaction, source.updated_at
     FROM (
       SELECT activity_id, reaction, updated_at
       FROM activity_reactions
       WHERE user_id = ?
     ) AS source
     ON DUPLICATE KEY UPDATE
       reaction = IF(activity_reactions.reaction = 'disliked' OR VALUES(reaction) = 'disliked', 'disliked', 'visited'),
       updated_at = GREATEST(activity_reactions.updated_at, VALUES(updated_at))`,
    [targetUserId, guestUserId],
  );
  await connection.execute("DELETE FROM activity_reactions WHERE user_id = ?", [guestUserId]);

  await connection.execute(
    `UPDATE draw_sessions
     SET user_id = ?
     WHERE user_id = ?`,
    [targetUserId, guestUserId],
  );

  await connection.execute(
    `UPDATE todos
     SET user_id = ?
     WHERE user_id = ?`,
    [targetUserId, guestUserId],
  );

  await connection.execute(
    `UPDATE todo_completion_submissions
     SET user_id = ?
     WHERE user_id = ?`,
    [targetUserId, guestUserId],
  );

  await connection.execute(
    `UPDATE trip_feedback SET user_id = ? WHERE user_id = ?`,
    [targetUserId, guestUserId],
  );

  await connection.execute(
    `INSERT INTO user_weekly_todo_usage (user_id, week_start_date, limit_count, used_count)
     SELECT ?, u.week_start_date, u.limit_count, u.used_count
     FROM (
       SELECT week_start_date, limit_count, used_count
       FROM user_weekly_todo_usage
       WHERE user_id = ?
     ) AS u
     ON DUPLICATE KEY UPDATE
       limit_count = GREATEST(user_weekly_todo_usage.limit_count, VALUES(limit_count)),
       used_count = user_weekly_todo_usage.used_count + VALUES(used_count)`,
    [targetUserId, guestUserId],
  );

  await connection.execute("DELETE FROM user_weekly_todo_usage WHERE user_id = ?", [guestUserId]);

  // Keep any legacy/community references recoverable. Removing the device id
  // prevents logout from reopening the pre-login guest identity.
  await connection.execute(
    "UPDATE users SET device_id = NULL, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?",
    [guestUserId],
  );
}
