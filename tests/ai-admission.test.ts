// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { requireAIAdmission } from '../src/lib/ai-admission';
import { requireSession } from '../src/lib/session-middleware';

function createApp(limit = 1) {
  const counters = new Map<string, number>();
  let providerCalls = 0;
  const db: any = {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            async first() {
              if (sql.includes('FROM sessions')) return args[0] === 'valid-session' ? { id: 7, role: 'admin' } : null;
              if (sql.includes('INSERT INTO ai_user_admission')) {
                const key = `${args[0]}:${args[1]}`;
                const count = counters.get(key) || 0;
                if (count >= args[2]) return null;
                counters.set(key, count + 1);
                return { request_count: count + 1 };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  };
  const app = new Hono<any>();
  app.post('/generate', requireSession, requireAIAdmission, async c => {
    providerCalls++;
    return c.json({ success: true });
  });
  app.use('/generate-stream', requireSession, requireAIAdmission);
  app.post('/generate-stream', async c => {
    providerCalls++;
    return streamSSE(c, async stream => { await stream.writeSSE({ event: 'done', data: JSON.stringify({ success: true }) }); });
  });
  return { app, db, providerCalls: () => providerCalls, env: { DB: db, AI_ADMISSION_MAX_REQUESTS: String(limit) } };
}

describe('AI session and admission middleware', () => {
  it('rejects before provider invocation if the quota schema is missing', async () => {
    let invoked = false;
    const app = new Hono<any>();
    app.use('*', async (c, next) => { c.set('user', { id: 7 }); await next(); });
    app.post('/generate', requireAIAdmission, c => { invoked = true; return c.text('unexpected'); });
    const response = await app.request('/generate', { method: 'POST' }, { DB: { prepare() { throw new Error('no such table: ai_user_admission'); } } });
    expect(response.status).toBe(503); expect(invoked).toBe(false);
    expect(response.headers.get('retry-after')).toBe('30');
    expect(await response.text()).not.toContain('no such table');
  });
  it('rejects anonymous requests before the provider is called', async () => {
    const test = createApp();
    const response = await test.app.request('/generate', { method: 'POST' }, test.env);
    expect(response.status).toBe(401);
    expect(test.providerCalls()).toBe(0);
  });

  it('returns a consistent 429 before provider invocation when quota is exhausted', async () => {
    const test = createApp(1);
    const init = { method: 'POST', headers: { 'x-session-id': 'valid-session' } };
    expect((await test.app.request('/generate', init, test.env)).status).toBe(200);
    const response = await test.app.request('/generate', init, test.env);
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
    expect(test.providerCalls()).toBe(1);
  });

  it('admits an authenticated stream and keeps the SSE done event intact', async () => {
    const test = createApp();
    const response = await test.app.request('/generate-stream', {
      method: 'POST', headers: { 'x-session-id': 'valid-session' },
    }, test.env);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(await response.text()).toContain('event: done');
    expect(test.providerCalls()).toBe(1);
  });
});
