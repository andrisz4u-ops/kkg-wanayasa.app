import type { MiddlewareHandler } from 'hono';
import { Errors } from './response';

type AdmissionBindings = {
  DB: D1Database;
  AI_ADMISSION_MAX_REQUESTS?: string;
  AI_ADMISSION_WINDOW_SECONDS?: string;
};

/** Atomically admits one AI operation per user and fixed time window using D1. */
export const requireAIAdmission: MiddlewareHandler<{
  Bindings: AdmissionBindings;
  Variables: { user: any };
}> = async (c, next) => {
  const user = c.get('user');
  if (!user?.id) return Errors.unauthorized(c);

  const maxRequests = positiveInteger(c.env.AI_ADMISSION_MAX_REQUESTS, 20);
  const windowSeconds = positiveInteger(c.env.AI_ADMISSION_WINDOW_SECONDS, 60);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;

  const admitted = await c.env.DB.prepare(`
    INSERT INTO ai_user_admission (user_id, window_start, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(user_id) DO UPDATE SET
      window_start = CASE WHEN excluded.window_start > ai_user_admission.window_start THEN excluded.window_start ELSE ai_user_admission.window_start END,
      request_count = CASE WHEN excluded.window_start > ai_user_admission.window_start THEN 1 ELSE ai_user_admission.request_count + 1 END
    WHERE excluded.window_start > ai_user_admission.window_start
       OR (excluded.window_start = ai_user_admission.window_start AND ai_user_admission.request_count < ?)
    RETURNING request_count
  `).bind(user.id, windowStart, maxRequests).first();

  if (!admitted) {
    return Errors.rateLimited(c, Math.max(1, windowStart + windowSeconds - now));
  }
  await next();
};

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
