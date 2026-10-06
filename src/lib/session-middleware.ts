import type { MiddlewareHandler } from 'hono';
import { getCookie, getCurrentUser } from './auth';
import { Errors } from './response';

export const requireSession: MiddlewareHandler<{
  Bindings: { DB: D1Database };
  Variables: { user: any };
}> = async (c, next) => {
  const user = c.get('user') || await getCurrentUser(c.env.DB, getCookie(c.req.header('Cookie'), 'session'));
  if (!user) return Errors.unauthorized(c);
  c.set('user', user);
  await next();
};
