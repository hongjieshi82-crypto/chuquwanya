import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextFunction, Request, Response } from 'express';

import { config } from './config.js';
import { pool } from './db.js';

type AuthenticatedRequest = Request & { authUserId?: number; supabaseUserId?: string };
let adminClient: SupabaseClient | null = null;

export function isSupabaseAuthConfigured() {
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
}

function getSupabaseAdmin() {
  if (!isSupabaseAuthConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

export function requestAuthUserId(request: Request) {
  return (request as AuthenticatedRequest).authUserId ?? null;
}

export async function attachSupabaseUser(request: Request, _response: Response, next: NextFunction) {
  const match = request.headers.authorization?.match(/^Bearer\s+(.+)$/i);
  const supabase = getSupabaseAdmin();
  if (!match || !supabase) { next(); return; }
  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    const authUser = data.user;
    if (error || !authUser?.email) { next(); return; }
    await pool.execute(
      `INSERT INTO users (device_id,email,password_hash,auth_type,nickname,supabase_user_id,last_seen_at)
       VALUES (NULL,?,NULL,'registered',?,?,CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE supabase_user_id=VALUES(supabase_user_id),auth_type='registered',last_seen_at=CURRENT_TIMESTAMP`,
      [authUser.email.toLowerCase(), authUser.user_metadata?.nickname || authUser.email.split('@')[0] || '探索者', authUser.id],
    );
    const [rows] = await pool.execute('SELECT id FROM users WHERE supabase_user_id=? LIMIT 1', [authUser.id]);
    const businessUserId = Number((rows as Array<{ id: number }>)[0]?.id);
    if (Number.isFinite(businessUserId)) {
      (request as AuthenticatedRequest).authUserId = businessUserId;
      (request as AuthenticatedRequest).supabaseUserId = authUser.id;
    }
  } catch (error) {
    request.log?.warn?.({ error }, 'Supabase bearer verification failed');
  }
  next();
}
