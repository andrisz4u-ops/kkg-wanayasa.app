import type { MiddlewareHandler } from 'hono';
import { getCookie, getCurrentUser } from './auth';
import { Errors } from './response';

export const requireSession: MiddlewareHandler<{
  Bindings: { DB: D1Database };
  Variables: { user: any };
}> = async (c, next) => {
  const cookieHeader = c.req.header('Cookie') || c.req.header('cookie');
  const sessionId = getCookie(cookieHeader, 'session') || c.req.header('x-session-id') || c.req.header('authorization')?.replace('Bearer ', '');
  const user = c.get('user') || await getCurrentUser(c.env.DB, sessionId);
  if (!user) return Errors.unauthorized(c);
  c.set('user', user);
  await next();
};
