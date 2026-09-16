import type { Express } from 'express';
import { isIP } from 'node:net';
import { AppError } from './errors.js';
import { nearbyPlanInputSchema } from './nearby-plan-policy.js';
import { generateNearbyPlan } from './nearby-plan.js';

export function registerNearbyPlanRoutes(app: Express) {
  const attempts = new Map<string, { count: number; expiresAt: number }>();
  let running = 0;
  app.post('/api/v1/nearby/plan', async (request, response, next) => {
    let acquired = false;
    try {
      const input = nearbyPlanInputSchema.parse(request.body);
      const peer = (request.socket.remoteAddress || '').replace(/^::ffff:/, '');
      // Production API is bound to localhost through Docker; Nginx overwrites X-Real-IP.
      const localProxy = peer === '::1' || peer === '127.0.0.1' || /^172\.(1[6-9]|2\d|3[01])\./.test(peer);
      const forwarded = request.get('x-real-ip') || '';
      const key = localProxy && isIP(forwarded) ? forwarded : peer || 'unknown';
      const now = Date.now();
      let quota = attempts.get(key);
      if (!quota || quota.expiresAt <= now) quota = { count: 0, expiresAt: now + 60_000 };
      if (quota.count >= 4 || running >= 2) {
        response.setHeader('Retry-After', '30');
        throw new AppError(429, 'NEARBY_PLAN_BUSY', '正在安排附近攻略，请稍等半分钟再试。');
      }
      quota.count += 1;
      if (attempts.size >= 1_000 && !attempts.has(key)) attempts.delete(attempts.keys().next().value!);
      attempts.set(key, quota);
      running += 1; acquired = true;
      response.setHeader('Cache-Control', 'no-store');
      const result = await generateNearbyPlan(input);
      response.json({ data: result });
    } catch (error) { next(error); }
    finally { if (acquired) running -= 1; }
  });
}
