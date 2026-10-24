// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { csrfMiddleware, setCSRFCookie } from '../src/lib/csrf';
import { request } from '../public/static/js/http-client.js';

let app: Hono;
let cookie: string;
let accepted: number;
const bytes = new Uint8Array([0x50, 0x4b, 3, 4, 17, 255]);

beforeEach(() => {
  cookie = 'csrf_token=initial'; accepted = 0;
  vi.stubGlobal('document', { get cookie() { return cookie; } });
  app = new Hono();
  app.use('/api/*', csrfMiddleware());
  app.get('/api/auth/csrf-token', c => {
    cookie = 'csrf_token=refreshed';
    return c.json({ success: true, data: { csrf_token: 'refreshed' } });
  });
  app.post('/api/export', c => { accepted++; return c.body(bytes, 200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); });
  app.post('/api/upload', async c => {
    accepted++;
    const form = await c.req.formData();
    return c.json({ filename: (form.get('file') as File).name });
  });
  vi.stubGlobal('fetch', vi.fn((path: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (cookie) headers.set('Cookie', cookie);
    return app.request(`http://localhost${path}`, { ...init, headers });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('client and real CSRF middleware contract', () => {
  it('preserves a binary Response through a protected POST', async () => {
    const response = await request('/export', { method: 'POST', body: { title: 'RPP' } });
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(response.headers.get('content-type')).toContain('wordprocessingml');
    expect(accepted).toBe(1);
  });

  it('sends multipart with its browser-owned boundary and a CSRF header', async () => {
    const form = new FormData(); form.set('file', new File(['fixture'], 'lesson.txt'));
    const response = await request('/upload', { method: 'POST', body: form, headers: { 'Content-Type': 'application/json' } });
    expect(await response.json()).toEqual({ filename: 'lesson.txt' });
    expect(accepted).toBe(1);
  });

  it('refreshes after a rejected stale header and performs the mutation once', async () => {
    const response = await request('/export', { method: 'POST', headers: { 'X-CSRF-Token': 'stale' }, body: { title: 'RPP' } });
    expect(response.status).toBe(200);
    expect(accepted).toBe(1);
    expect(vi.mocked(fetch).mock.calls.filter(([path]) => String(path).includes('csrf-token'))).toHaveLength(1);
  });

  it('deduplicates initial token refreshes for concurrent requests', async () => {
    cookie = '';
    await Promise.all([request('/export', { method: 'POST' }), request('/export', { method: 'POST' })]);
    expect(accepted).toBe(2);
    expect(vi.mocked(fetch).mock.calls.filter(([path]) => String(path).includes('csrf-token'))).toHaveLength(1);
  });

  it('does not repeat a POST after a network failure', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('fixture network failure')); vi.stubGlobal('fetch', fetcher);
    await expect(request('/export', { method: 'POST' })).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('bounds CSRF retries to one even if the refreshed token is rejected', async () => {
    const fetcher = vi.fn(async (path: string) => path.includes('csrf-token')
      ? Response.json({ data: { csrf_token: 'new' } })
      : Response.json({ error: { code: 'CSRF_INVALID' } }, { status: 403 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(request('/export', { method: 'POST' })).rejects.toMatchObject({ status: 403 });
    expect(fetcher.mock.calls.filter(([path]) => path.includes('/export'))).toHaveLength(2);
  });

  it('never forwards tokens to an external origin', async () => {
    await expect(request('https://external.invalid/api/export', { method: 'POST' })).rejects.toMatchObject({ code: 'INVALID_API_URL' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('CSRF rules are identical in tests and production', () => {
  it.each(['/api/export', '/api/files/upload', '/api/admin/settings/logo', '/api/auth/logout', '/api/init-db', '/api/auth/login/extra'])(
    'rejects missing cookie at %s, including requests with a session header', async path => {
      const response = await app.request(path, { method: 'POST', headers: { 'X-CSRF-Token': 'token', 'X-Session-Id': 'session' } });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'CSRF_MISSING' } });
      expect(accepted).toBe(0);
    });

  it('rejects a mismatched pair before invoking the handler', async () => {
    const response = await app.request('/api/export', { method: 'POST', headers: { Cookie: 'csrf_token=one', 'X-CSRF-Token': 'two' } });
    expect(response.status).toBe(403); expect(accepted).toBe(0);
  });

  it('sets a readable HTTPS cookie and preserves other cookies', async () => {
    app.get('/cookie', c => { c.header('Set-Cookie', 'session=fixture; HttpOnly'); setCSRFCookie(c); return c.text('ok'); });
    const response = await app.request('https://example.test/cookie');
    const cookies = response.headers.getSetCookie();
    expect(cookies.some(value => value.startsWith('session='))).toBe(true);
    const csrf = cookies.find(value => value.startsWith('csrf_token='))!;
    expect(csrf).toContain('Secure'); expect(csrf).toContain('SameSite=Lax'); expect(csrf).not.toContain('HttpOnly');
  });
});
