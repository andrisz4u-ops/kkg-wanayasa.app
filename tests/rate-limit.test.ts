import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { checkRateLimit, rateLimitMiddleware, resetRateLimits } from '../src/lib/ratelimit';

function createApp() {
  const app = new Hono<any>();
  app.use('/api/*', rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 2, keyPrefix: 'test' }));
  app.get('/api/data', (c) => c.json({ success: true }));
  // Route dengan user sesi terisi: kunci per-user, bukan IP.
  app.get('/api/me', (c) => {
    c.set('user', { id: 9, role: 'admin' });
    return c.json({ success: true });
  });
  return app;
}

describe('rate limit seragam + kunci per-user', () => {
  it('mengizinkan dalam kuota lalu 429 dengan header Retry-After', async () => {
    resetRateLimits();
    const app = createApp();
    const init = { headers: { 'CF-Connecting-IP': '10.0.0.1' } };
    expect((await app.request('/api/data', init)).status).toBe(200);
    expect((await app.request('/api/data', init)).status).toBe(200);
    const limited = await app.request('/api/data', init);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).not.toBeNull();
    expect(await limited.json()).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
  });

  it('tidak ada bypass untuk admin: admin yang melebihi kuota tetap 429', async () => {
    resetRateLimits();
    const app = createApp();
    const admin = new Hono<any>();
    admin.use('/admin/*', rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 1, keyPrefix: 'admin-test' }));
    admin.get('/admin/panel', (c) => {
      c.set('user', { id: 1, role: 'admin' });
      return c.json({ success: true });
    });
    const init = { headers: { 'CF-Connecting-IP': '10.0.0.2' } };
    expect((await admin.request('/admin/panel', init)).status).toBe(200);
    // Permintaan kedua dari admin yang sama tetap ditolak — tidak ada bypass peran.
    expect((await admin.request('/admin/panel', init)).status).toBe(429);
  });

  it('kuota IP habis tidak memblokir user sesi yang berbeda kunci', async () => {
    resetRateLimits();
    // Kunci user:9 terpisah dari kunci ip, walau IP sama.
    const key1 = 'user:9';
    const key2 = 'ip:10.0.0.3';
    const config = { windowMs: 60 * 1000, maxRequests: 1, keyPrefix: 'split' };
    expect(checkRateLimit(key1, config).allowed).toBe(true);
    expect(checkRateLimit(key1, config).allowed).toBe(false);
    expect(checkRateLimit(key2, config).allowed).toBe(true);
  });
});
