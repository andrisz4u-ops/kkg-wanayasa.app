import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { Hono } from 'hono';
import { createStreamJob } from '../src/lib/ai-stream-job';
import { AIService } from '../src/services/ai';
import { SqliteD1 } from './helpers/sqlite-d1';

let db: SqliteD1;
const contexts = (jobId: string, userId = 1, controller = new AbortController()) => ({ env: { DB: db }, get: () => ({ id: userId }), req: { header: () => jobId, raw: new Request('http://localhost/job', { signal: controller.signal }) }, json: (body: any, status: number) => new Response(JSON.stringify(body), { status }) } as any);
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  db = new SqliteD1();
  db.sqlite.exec('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2);');
  db.sqlite.exec(readFileSync('migrations/0029_ai_generation_jobs.sql', 'utf8'));
});
afterEach(() => { db.close(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const attach = (job: any) => {
  const callbacks: (() => void)[] = [];
  const ai = { setAbortSignal: vi.fn() };
  const raw = { onAbort: (callback: () => void) => callbacks.push(callback), writeSSE: vi.fn(async () => {}), write: vi.fn(async () => {}) };
  return { raw, ai, callbacks, stream: job.attach(raw, ai) };
};

describe('Owned AI request registry', () => {
  it('rejects simultaneous jobs across features and closes the lease after a partial result', async () => {
    const job: any = await createStreamJob(contexts('job-first-123'), 'rpp', { topik: 'Pecahan' });
    expect((await createStreamJob(contexts('job-other-123'), 'kisi', {})).response?.status).toBe(409);
    const bound = attach(job);
    await bound.stream.writeSSE({ event: 'done', data: JSON.stringify({ success: true, partial: true, warnings: ['Uraian belum tersedia'] }) });
    await job.dispose();
    expect(db.sqlite.prepare('SELECT state FROM ai_generation_jobs WHERE job_id=?').get(job.id)).toMatchObject({ state: 'partial' });
    expect(JSON.parse(bound.raw.writeSSE.mock.calls[0][0].data).jobId).toBe(job.id);
    const next: any = await createStreamJob(contexts('job-after-123'), 'kisi', {});
    expect(next.response).toBeUndefined();
    await next.dispose();
  });
  it('replays a completed result for the same canonical request and rejects changed input', async () => {
    const job: any = await createStreamJob(contexts('job-replay-123'), 'rpp', { b: 2, a: { z: 1, x: 0 } });
    const bound = attach(job);
    await bound.stream.writeSSE({ event: 'done', data: JSON.stringify({ success: true, data: { hasil: 'Draf' } }) });
    await job.dispose();
    const row = db.sqlite.prepare('SELECT request_hash,result_json FROM ai_generation_jobs').get()!;
    expect(JSON.parse(String(row.result_json)).data.hasil).toBe('Draf');
    const app = new Hono<any>();
    app.post('/replay', async c => {
      c.set('user', { id: 1 });
      const replay = await createStreamJob(c, 'rpp', { a: { x: 0, z: 1 }, b: 2 });
      return replay.response!;
    });
    const replay = await app.request('/replay', { method: 'POST', headers: { 'X-AI-Job-Id': 'job-replay-123' } }, { DB: db });
    expect(await replay.text()).toContain('"hasil":"Draf"');
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM ai_generation_jobs').get()).toMatchObject({ count: 1 });
    const changed = await createStreamJob(contexts('job-replay-123'), 'rpp', { a: 3 });
    expect(changed.response?.status).toBe(409);
    const otherUser: any = await createStreamJob(contexts('job-replay-123', 2), 'rpp', { a: 3 });
    expect(otherUser.response).toBeUndefined();
    await otherUser.dispose();
  });
  it('propagates disconnection into the AI signal and never writes a success after cancellation', async () => {
    const job: any = await createStreamJob(contexts('job-abort-123'), 'rpp', {});
    const bound = attach(job);
    bound.callbacks[0]();
    await expect(bound.stream.writeSSE({ event: 'done', data: '{}' })).rejects.toMatchObject({ name: 'AbortError' });
    await job.dispose();
    expect(job.signal.aborted).toBe(true);
    expect(bound.ai.setAbortSignal.mock.calls[0][0]).toBe(job.signal);
    expect(db.sqlite.prepare('SELECT state FROM ai_generation_jobs').get()).toMatchObject({ state: 'cancelled' });
  });
  it('rejects a stale worker result after its lease has been released', async () => {
    const job: any = await createStreamJob(contexts('job-stale-123'), 'rpp', {});
    const bound = attach(job);
    db.sqlite.exec("UPDATE ai_generation_jobs SET state = 'failed'");
    await expect(bound.stream.writeSSE({ event: 'done', data: '{"success":true}' })).rejects.toMatchObject({ name: 'AbortError' });
    await job.dispose();
    expect(bound.raw.writeSSE).not.toHaveBeenCalled();
    expect(job.signal.aborted).toBe(true);
    expect(db.sqlite.prepare('SELECT state, result_json FROM ai_generation_jobs').get()).toMatchObject({ state: 'failed', result_json: null });
  });
});

describe('Provider cancellation and fallback boundaries', () => {
  const provider = { id: 1, name: 'Test', slug: 'test', api_type: 'openai_compat', model: 'test', base_url: 'https://provider.example/v1', api_key: 'test-key', is_active: 1, priority: 1, max_tokens: 1024 };
  it('does not make a non-stream fallback after caller cancellation', async () => {
    const controller = new AbortController();
    const fetch = vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })));
    vi.stubGlobal('fetch', fetch);
    const ai = new AIService({} as any); (ai as any).providers = [provider]; ai.setAbortSignal(controller.signal);
    const pending = ai.generateTextStream('Pecahan', 'test', true, vi.fn());
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    controller.abort(new DOMException('Dibatalkan', 'AbortError'));
    await assertion;
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('emits a reset before replacing a failed stream with a complete response', async () => {
    const order: string[] = [];
    const ai = new AIService({} as any); (ai as any).providers = [provider]; ai.setAbortSignal(new AbortController().signal, () => { order.push('reset'); });
    vi.spyOn(ai as any, 'callOpenAICompatStream').mockImplementation(async (_provider, _prompt, _json, onToken: any) => { onToken('partial'); throw new Error('Stream terputus'); });
    vi.spyOn(ai as any, 'callOpenAICompat').mockResolvedValue({ content: 'complete', provider: 'test', model: 'test' });
    await ai.generateTextStream('Pecahan', 'test', true, token => order.push(token));
    expect(order).toEqual(['partial', 'reset', 'complete']);
  });
});
