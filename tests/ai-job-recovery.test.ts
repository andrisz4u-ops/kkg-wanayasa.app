import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { state } from '../public/static/js/state.js';
import { api } from '../public/static/js/api.js';
import { streamPost } from '../public/static/js/ai-stream.js';
import { openAiLiveMonitor, hasActiveAiJob } from '../public/static/js/ai-live-monitor.js';
import aiJobs from '../src/routes/ai-jobs';
import { getCurrentUser } from '../src/lib/auth';
import { SqliteD1 } from './helpers/sqlite-d1';

vi.mock('../public/static/js/api.js', async original => ({ ...await original<any>(), getCsrfToken: vi.fn(async () => 'csrf'), refreshCsrfToken: vi.fn(async () => 'csrf-new') }));
vi.mock('../src/lib/auth', async original => ({ ...await original<typeof import('../src/lib/auth')>(), getCurrentUser: vi.fn() }));

let monitor: ReturnType<typeof openAiLiveMonitor> | undefined;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('crypto', webcrypto);
  state.user = { id: 1, nama: 'Guru uji' };
  document.body.innerHTML = '<div id="app"><main id="main-content"><button>Mulai</button></main></div>';
});
afterEach(() => { monitor?.close(); monitor = undefined; vi.unstubAllGlobals(); document.body.innerHTML = ''; });

describe('Job result recovery and account ownership', () => {
  it.each(['completed', 'partial'])('recovers a %s result through GET after a lost completion frame without repeating generation', async status => {
    const jobId = 'recovery-job-123';
    const fetch = vi.fn().mockResolvedValueOnce(new Response('event:token\ndata:{"text":"draf"}\n\n'))
      .mockResolvedValueOnce(Response.json({ success: true, data: { state: status, result: { success: true, jobId, data: { hasil: 'Draf' }, partial: status === 'partial' } } }));
    vi.stubGlobal('fetch', fetch);
    const events: any[] = [];
    await streamPost('/rpp/generate-stream', {}, (event, payload) => events.push([event, payload]), { jobId });
    expect(events.at(-1)).toEqual(['done', expect.objectContaining({ recovered: true, partial: status === 'partial', data: { hasil: 'Draf' } })]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toBe('/api/ai-jobs/recovery-job-123');
    expect(fetch.mock.calls[1][1].method).toBeUndefined();
  });
  it('does not query cached success after a server explicitly rejects the job', async () => {
    const fetch = vi.fn(async () => new Response('event:error\ndata:{"message":"Jawaban belum lengkap"}\n\n'));
    vi.stubGlobal('fetch', fetch);
    await expect(streamPost('/rpp/generate-stream', {}, () => {}, { jobId: 'failure-job-123' })).rejects.toThrow('Jawaban belum lengkap');
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('blocks unrelated generation while allowing requests belonging to the running monitor', async () => {
    monitor = openAiLiveMonitor({ title: 'Program sekolah' });
    const fetch = vi.fn(async () => Response.json({ success: true, data: { token: 'csrf', csrfToken: 'csrf' } }));
    vi.stubGlobal('fetch', fetch);
    await expect(api('/api/tts/generate', { method: 'POST', body: '{}' })).rejects.toThrow('proses AI');
    expect(fetch).not.toHaveBeenCalled();
    await expect(api('/api/program-sekolah/generate-section', { method: 'POST', body: '{}', signal: monitor.signal })).resolves.toMatchObject({ success: true });
  });
  it('aborts and disposes the monitor when the authenticated account changes', async () => {
    monitor = openAiLiveMonitor({ title: 'RPP privat' });
    state.user = { id: 2, nama: 'Akun lain' };
    document.querySelector('#main-content')!.append(document.createElement('section'));
    await vi.waitFor(() => expect(document.querySelector('#ai-live-monitor-modal')).toBeNull());
    expect(monitor.signal.aborted).toBe(true);
    expect(hasActiveAiJob()).toBe(false);
  });
  it('serves cached status only to its authenticated owner', async () => {
    const db = new SqliteD1();
    try {
      db.sqlite.exec('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2);');
      db.sqlite.exec(readFileSync('migrations/0029_ai_generation_jobs.sql', 'utf8'));
      await db.prepare("INSERT INTO ai_generation_jobs(user_id,job_id,operation,request_hash,state,result_json,lease_until,expires_at) VALUES(1,'private-job-123','rpp','hash','completed',?,0,?)").bind(JSON.stringify({ data: { hasil: 'Draf privat' } }), Math.floor(Date.now() / 1000) + 3600).run();
      const app = new Hono<any>().route('/jobs', aiJobs);
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      expect((await app.request('/jobs/private-job-123', {}, { DB: db })).status).toBe(401);
      vi.mocked(getCurrentUser).mockResolvedValue({ id: 2 } as any);
      expect((await app.request('/jobs/private-job-123', {}, { DB: db })).status).toBe(404);
      vi.mocked(getCurrentUser).mockResolvedValue({ id: 1 } as any);
      expect(await (await app.request('/jobs/private-job-123', {}, { DB: db })).json()).toMatchObject({ success: true, data: { state: 'completed', result: { data: { hasil: 'Draf privat' } } } });
    } finally { db.close(); }
  });
  it('does not render a private result if the account changes while restoring its origin page', async () => {
    const root = document.querySelector<HTMLElement>('#main-content')!;
    root.dataset.featurePage = 'rpp';
    const review = vi.fn();
    monitor = openAiLiveMonitor({ title: 'RPP privat' });
    monitor.complete(review);
    root.dataset.featurePage = 'kisi';
    let finishNavigation: () => void;
    window.navigate = vi.fn(() => new Promise<void>(resolve => { finishNavigation = resolve; }));
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    expect(window.navigate).toHaveBeenCalledWith('rpp');
    state.user = { id: 2, nama: 'Akun lain' };
    root.dataset.featurePage = 'rpp';
    root.append(document.createElement('section'));
    finishNavigation!();
    await vi.waitFor(() => expect(hasActiveAiJob()).toBe(false));
    expect(review).not.toHaveBeenCalled();
  });
});
