import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import programSekolah from '../src/routes/program-sekolah';
import { getCurrentUser } from '../src/lib/auth';
import { SqliteD1 } from './helpers/sqlite-d1';

const generation = vi.hoisted(() => ({ calls: 0, signal: undefined as AbortSignal | undefined, run: undefined as undefined | ((signal: AbortSignal) => Promise<any>) }));
vi.mock('../src/lib/auth', async original => ({ ...await original<typeof import('../src/lib/auth')>(), getCurrentUser: vi.fn() }));
vi.mock('../src/lib/telemetry', async original => ({ ...await original<any>(), recordAIGeneration: vi.fn() }));
vi.mock('../src/services/ai', async original => ({ ...await original<any>(), AIService: class {
  async loadProviders() {}
  setAbortSignal(signal: AbortSignal) { generation.signal = signal; }
  async generateJSONStream(_prompt: string, _provider: string, onToken: (text: string) => void) {
    generation.calls++; onToken('{"bab_1_pendahuluan":');
    return generation.run!(generation.signal!);
  }
} }));

let db: SqliteD1;
let app: Hono;
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  generation.calls = 0;
  generation.run = async () => ({ bab_1_pendahuluan: { latar_belakang: ['Draf program sekolah'] } });
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'admin', nama: 'Guru uji' } as any);
  db = new SqliteD1();
  db.sqlite.exec('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1);');
  db.sqlite.exec(readFileSync('migrations/0029_ai_generation_jobs.sql', 'utf8'));
  app = new Hono().route('/program', programSekolah);
});
afterEach(() => { db.close(); vi.unstubAllGlobals(); });
const start = () => app.request('/program/generate-section-stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AI-Job-Id': 'section-job-123-1' },
  body: JSON.stringify({ template: 'literasi', section: 'bab1', currentData: { metadata: { judul_program: 'Program Literasi' } } }),
}, { DB: db });

describe('Cancellable per-chapter program generation', () => {
  it('requires an authenticated administrator or operator before generation', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await start()).status).toBe(401);
    expect(generation.calls).toBe(0);
  });
  it('preserves chapter merge and replays a completed request without generating twice', async () => {
    const first = await (await start()).text();
    expect(first).toContain('event: done');
    expect(first).toContain('"metadata":{"judul_program":"Program Literasi"}');
    expect(first).toContain('"bab_1_pendahuluan":{"latar_belakang":["Draf program sekolah"]}');
    expect(await (await start()).text()).toContain('"section":"bab1"');
    expect(generation.calls).toBe(1);
  });
  it('rejects an empty chapter instead of reporting a completed section', async () => {
    generation.run = async () => ({});
    const response = await (await start()).text();
    expect(response).toContain('event: error');
    expect(response).not.toContain('event: done');
    expect(db.sqlite.prepare('SELECT state FROM ai_generation_jobs').get()).toMatchObject({ state: 'failed' });
  });
  it('aborts the provider and marks the chapter cancelled when its SSE reader disconnects', async () => {
    generation.run = signal => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    const reader = (await start()).body!.getReader();
    await reader.read();
    await reader.cancel();
    await vi.waitFor(() => expect(generation.signal?.aborted).toBe(true));
    await vi.waitFor(() => expect(db.sqlite.prepare('SELECT state FROM ai_generation_jobs').get()).toMatchObject({ state: 'cancelled' }));
    expect(generation.calls).toBe(1);
  });
});
