import type { Express, NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { assessContentQuality } from './content-quality.js';
import { pool } from './db.js';
import { AppError } from './errors.js';

function asyncRoute(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction) => void handler(request, response).catch(next);
}

function localOnly(request: Request, _response: Response, next: NextFunction) {
  const address = request.socket.remoteAddress ?? '';
  const localAddress = address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
  const localHost = request.hostname === 'localhost' || request.hostname === '127.0.0.1';
  if (!localAddress || !localHost) return next(new AppError(403, 'LOCAL_ADMIN_ONLY', '内容审核后台只允许从本机访问'));
  next();
}

const listSchema = z.object({
  cityId: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived', 'all']).default('review'),
  query: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  summary: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).max(4000).optional(),
  address: z.string().trim().min(1).max(255).optional(),
  durationMinutes: z.number().int().min(30).max(1440).optional(),
  budgetYuan: z.number().int().min(0).max(10000).optional(),
  environment: z.enum(['indoor', 'outdoor', 'either']).optional(),
  rainFriendly: z.enum(['yes', 'no', 'unknown']).optional(),
  heatSensitive: z.enum(['yes', 'no', 'unknown']).optional(),
  windSensitive: z.enum(['yes', 'no', 'unknown']).optional(),
  reservationRequired: z.enum(['yes', 'no', 'unknown']).optional(),
  reservationUrl: z.string().trim().url().max(500).nullable().optional(),
  weatherNotes: z.string().trim().max(255).nullable().optional(),
  contentStatus: z.enum(['draft', 'review', 'published', 'archived']).optional(),
});

function parseJson(value: unknown) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value) as unknown; } catch { return value; }
}

function toAdminItem(row: Record<string, unknown>) {
  return {
    id: Number(row.id), cityId: Number(row.city_id), cityName: String(row.city_name),
    title: String(row.title), summary: String(row.summary), description: String(row.description),
    address: String(row.address), district: String(row.district), latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude),
    durationMinutes: Number(row.duration_minutes), budgetYuan: Number(row.budget_yuan), environment: row.environment,
    rainFriendly: row.rain_friendly, heatSensitive: row.heat_sensitive, windSensitive: row.wind_sensitive,
    weatherNotes: row.weather_notes, reservationRequired: row.reservation_required, reservationUrl: row.reservation_url,
    contentStatus: row.content_status, contentScore: Number(row.content_score), qualityIssues: parseJson(row.quality_issues),
    sourceType: row.source_type, sourceUrl: row.source_url, sourceConfidence: Number(row.source_confidence ?? 0),
    coverImageUri: row.cover_image, lastVerifiedAt: row.last_verified_at,
  };
}

export function registerContentAdminRoutes(app: Express) {
  app.use('/api/v1/admin/content', localOnly);

  app.get('/api/v1/admin/content/activities', asyncRoute(async (request, response) => {
    const input = listSchema.parse(request.query);
    const conditions = ['1=1'];
    const values: Array<string | number> = [];
    if (input.cityId) { conditions.push('a.city_id = ?'); values.push(input.cityId); }
    if (input.status !== 'all') { conditions.push('a.content_status = ?'); values.push(input.status); }
    if (input.query) { conditions.push('(a.title LIKE ? OR a.address LIKE ? OR a.summary LIKE ?)'); const like = `%${input.query}%`; values.push(like, like, like); }
    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM activities a WHERE ${conditions.join(' AND ')}`, values) as unknown as [[{ total: number }]];
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS city_name FROM activities a INNER JOIN cities c ON c.id = a.city_id
       WHERE ${conditions.join(' AND ')} ORDER BY a.content_score ASC, a.id DESC LIMIT ? OFFSET ?`,
      [...values, input.limit, input.offset],
    );
    response.json({ data: { items: (rows as Record<string, unknown>[]).map(toAdminItem), total: Number(count.total), limit: input.limit, offset: input.offset } });
  }));

  app.patch('/api/v1/admin/content/activities/:id', asyncRoute(async (request, response) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const input = updateSchema.parse(request.body);
    const columnMap: Record<string, string> = {
      title: 'title', summary: 'summary', description: 'description', address: 'address',
      durationMinutes: 'duration_minutes', budgetYuan: 'budget_yuan', environment: 'environment',
      rainFriendly: 'rain_friendly', heatSensitive: 'heat_sensitive', windSensitive: 'wind_sensitive',
      reservationRequired: 'reservation_required', reservationUrl: 'reservation_url', weatherNotes: 'weather_notes',
    };
    const assignments: string[] = [];
    const values: Array<string | number | null> = [];
    for (const [key, column] of Object.entries(columnMap)) {
      if (key in input) { assignments.push(`${column} = ?`); values.push(input[key as keyof typeof input] ?? null); }
    }
    if (assignments.length) await pool.execute(`UPDATE activities SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);

    const [rows] = await pool.query('SELECT a.*, c.name AS city_name FROM activities a INNER JOIN cities c ON c.id = a.city_id WHERE a.id = ? LIMIT 1', [id]);
    const row = (rows as Record<string, unknown>[])[0];
    if (!row) throw new AppError(404, 'ACTIVITY_NOT_FOUND', '活动不存在');
    const quality = assessContentQuality({ ...row, steps: parseJson(row.steps), tips: parseJson(row.tips), opening_hours: parseJson(row.opening_hours) });
    if (input.contentStatus === 'published' && !quality.recommendable) {
      throw new AppError(422, 'CONTENT_NOT_RECOMMENDABLE', '关键字段仍不完整，暂时不能发布', { score: quality.score, issues: quality.issues });
    }
    const nextStatus = input.contentStatus ?? String(row.content_status);
    await pool.execute('UPDATE activities SET content_score = ?, quality_issues = CAST(? AS JSON), content_status = ?, last_verified_at = IF(? = \'published\', CURRENT_TIMESTAMP, last_verified_at) WHERE id = ?', [quality.score, JSON.stringify(quality.issues), nextStatus, nextStatus, id]);
    const [updated] = await pool.query('SELECT a.*, c.name AS city_name FROM activities a INNER JOIN cities c ON c.id = a.city_id WHERE a.id = ? LIMIT 1', [id]);
    response.json({ data: toAdminItem((updated as Record<string, unknown>[])[0]!) });
  }));
}
