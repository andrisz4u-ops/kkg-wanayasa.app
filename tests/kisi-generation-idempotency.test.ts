// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';
import { createAssessmentSchema } from '../src/lib/validation';

const harness = vi.hoisted(() => ({ calls: 0, responses: [] as any[], wait: undefined as undefined | (() => Promise<void>), failLoad: false, onGenerate: undefined as undefined | (() => void) }));
vi.mock('../src/lib/auth', async original => ({ ...await original<any>(), getCurrentUser: vi.fn() }));
vi.mock('../src/services/ai', () => ({ AIService: class {
  async loadProviders() { if (harness.failLoad) throw new Error('fixture provider configuration failure'); }
  async generateJSON() { harness.calls++; await harness.wait?.(); harness.onGenerate?.(); return harness.responses.shift() || { pg: [{ no: 1, soal: 'Apa hasil pengamatan pada materi ini?', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' }] }; }
  async generateJSONStream(_prompt: string, _provider: string, onToken: (token: string) => Promise<void>) { harness.calls++; await harness.wait?.(); harness.onGenerate?.(); await onToken('{}'); return harness.responses.shift() || { pg: [{ no: 1, soal: 'Apa hasil pengamatan pada materi ini?', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' }] }; }
  setAbortSignal() {}
} }));
vi.mock('../src/lib/assessment-validator', async original => ({ ...await original<any>(), runAssessmentQualityGate: async () => {} }));
import kisi from '../src/routes/kisi';
import { getCurrentUser } from '../src/lib/auth';

const ownerId = 72;
const clientDocumentId = '378c86f3-7d4a-4c6f-bb41-064b0d2b6379';
const payload = { mataPelajaran: 'IPAS', topik: 'Pengamatan alam', capaianPembelajaran: 'Murid mengamati alam.', jumlahPG: 1, jumlahIsian: 0, jumlahUraian: 0, useGambar: false };
let db: SqliteD1;
let app: Hono;

function migrate(name: string) { db.sqlite.exec(readFileSync(`migrations/${name}`, 'utf8')); }
function request(path: string, id = clientDocumentId, headers: Record<string, string> = {}, body: any = { ...payload, clientDocumentId: id }, bindings: Record<string, unknown> = {}) {
  return app.request(`/api/kisi/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer generation-fixture', 'X-AI-Job-Id': 'fixture-job-0001', ...headers }, body: JSON.stringify(body) }, { DB: db as any, ...bindings });
}
function canonical(value: any): any { return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value; }
async function legacySseRequestHash() {
  const input = { ...createAssessmentSchema.parse({ ...payload, clientDocumentId }), clientDocumentId };
  const encoded = JSON.stringify({ operation: 'kisi', input: canonical(input) });
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encoded))), byte => byte.toString(16).padStart(2, '0')).join('');
}
function fixture() {
  db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,nama TEXT,sekolah TEXT,role TEXT,email TEXT);
    INSERT INTO users VALUES (${ownerId},'Fixture Teacher','Fixture School','guru','fixture@example.test');
    CREATE TABLE sessions(id TEXT PRIMARY KEY,user_id INTEGER,expires_at TEXT);
    INSERT INTO sessions VALUES ('generation-fixture',${ownerId},datetime('now','+1 day'));`);
  for (const name of ['0016_ai_generation_logs.sql', '0018_bank_soal.sql', '0029_ai_generation_jobs.sql', '0032_ai_admission.sql', '0038_curriculum_source_provenance.sql', '0040_bank_soal_moderation.sql', '0041_assessment_image_assets.sql', '0042_assessment_package_revisions.sql', '0043_assessment_generation_requests.sql']) migrate(name);
  db.sqlite.exec(`CREATE TABLE capaian_pembelajaran(id INTEGER PRIMARY KEY,mata_pelajaran TEXT NOT NULL,fase TEXT NOT NULL,teks_cp TEXT NOT NULL,elemen_json TEXT NOT NULL,regulasi TEXT,UNIQUE(mata_pelajaran,fase));`);
  app = new Hono().route('/api/kisi', kisi);
  vi.mocked(getCurrentUser).mockResolvedValue({ id: ownerId, role: 'guru', nama: 'Fixture Teacher', sekolah: 'Fixture School' } as any);
}

beforeEach(() => { vi.stubGlobal('crypto', webcrypto); harness.calls = 0; harness.responses = []; harness.wait = undefined; harness.failLoad = false; harness.onGenerate = undefined; fixture(); });
afterEach(() => { db.close(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('actual assessment generation ledger routes', () => {
  it.each(['generate', 'generate-stream'])('fills 8 PG to 10 before saving and replaying through %s', async (route) => {
    const questions = Array.from({ length: 10 }, (_, index) => ({ no: index + 1, soal: `Apa kesimpulan percobaan nomor ${index + 1}?`, opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' }));
    harness.responses = [{ pg: questions.slice(0, 8) }, { pg: questions.slice(8) }];
    const body = { ...payload, jumlahPG: 10, clientDocumentId };
    const response = await request(route, clientDocumentId, {}, body);
    expect(response.status).toBe(200);
    const text = await response.text();
    const result = route === 'generate' ? JSON.parse(text) : JSON.parse(text.split(/\r?\n\r?\n/).find(frame => frame.includes('event: done'))!.split(/\r?\n/).find(line => line.startsWith('data: '))!.slice(6));
    expect(result.data.pg).toHaveLength(10);
    expect(new Set(result.data.pg.map((q: any) => q.soal)).size).toBe(10);
    expect(result.data._generation).toMatchObject({ partial: false, requested: { pg: 10 } });
    expect(harness.calls).toBe(2);
    expect(db.sqlite.prepare('SELECT jumlah_pg FROM bank_soal').get()).toMatchObject({ jumlah_pg: 10 });
    const replay: any = await (await request('generate', clientDocumentId, {}, body)).json();
    expect(replay.data.pg).toHaveLength(10);
    expect(harness.calls).toBe(2);
  });

  it('uses one winner across normal/SSE and replays the current saved package without another admission/provider call', async () => {
    const response = await request('generate');
    expect(response.status).toBe(200);
    const first: any = await response.json();
    expect(first.data.clientDocumentId).toBe(clientDocumentId);
    expect(harness.calls).toBe(1);
    const replay = await request('generate-stream');
    expect(replay.status).toBe(200);
    expect(replay.headers.get('content-type')).toContain('text/event-stream');
    const replayText = await replay.text();
    const replayData = replayText.split(/\r?\n/).find(line => line.startsWith('data: '));
    const replayPayload: any = JSON.parse(replayData!.slice(6));
    expect(replayPayload.data._persistence.revision).toBe(1);
    expect(harness.calls).toBe(1);
    expect(db.sqlite.prepare('SELECT request_count FROM ai_user_admission WHERE user_id=?').get(ownerId)).toMatchObject({ request_count: 1 });
    db.sqlite.prepare('UPDATE bank_soal SET content=?,revision=revision+1 WHERE id=?').run(JSON.stringify({ pg: [{ no: 1, soal: 'Edited current package', opsi: { A: 'A' } }], isian: null, uraian: [] }), first.data._persistence.packageId);
    const edited = await request('generate');
    const editedPayload: any = await edited.json();
    expect(editedPayload.data.pg[0].soal).toBe('Edited current package');
    expect(editedPayload.data._persistence.revision).toBe(2);
    expect(harness.calls).toBe(1);
  });

  it('rejects a matching cached legacy SSE job without treating its result as an assessment replay', async () => {
    const hash = await legacySseRequestHash();
    const now = Math.floor(Date.now() / 1000);
    db.sqlite.prepare(`INSERT INTO ai_generation_jobs(user_id,job_id,operation,request_hash,state,result_json,lease_until,expires_at) VALUES(?,?,'kisi',?,'completed',?,?,?)`)
      .run(ownerId, 'fixture-job-0001', hash, JSON.stringify({ success: true, data: { legacy: 'not ledger-backed' } }), now, now + 3600);
    const response = await request('generate-stream');
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ success: false });
    expect(harness.calls).toBe(0);
    expect(db.sqlite.prepare('SELECT state FROM assessment_generation_requests').get()).toMatchObject({ state: 'failed' });
  });

  it('keeps replay-only strictly lookup-only and rejects missing identity without a reservation', async () => {
    const missing = await request('generate', undefined as any, { 'X-Assessment-Replay-Only': '1' }, payload);
    expect(missing.status).toBe(409);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_generation_requests').get()).toMatchObject({ n: 0 });
    await request('generate');
    const mismatchedCompleted = await request('generate', clientDocumentId, { 'X-Assessment-Replay-Only': '1' }, { ...payload, topik: 'Input differs', clientDocumentId });
    expect(mismatchedCompleted.status).toBe(409);
    expect(harness.calls).toBe(1);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_generation_requests').get()).toMatchObject({ n: 1 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM ai_user_admission').get()).toMatchObject({ n: 1 });
  });

  it('returns a server-generated identity when callers omit one', async () => {
    const response = await request('generate', undefined as any, {}, payload);
    expect(response.status).toBe(200);
    const result: any = await response.json();
    expect(result.data.clientDocumentId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(db.sqlite.prepare('SELECT client_document_id FROM assessment_generation_requests').get()).toMatchObject({ client_document_id: result.data.clientDocumentId });
  });

  it('admits only one provider execution for simultaneous normal and SSE requests sharing an identity', async () => {
    let entered!: () => void, release!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const blocked = new Promise<void>(resolve => { release = resolve; });
    harness.wait = async () => { entered(); await blocked; };
    const normal = request('generate');
    await started;
    const concurrentSse = await request('generate-stream');
    expect(concurrentSse.status).toBe(409);
    release();
    expect((await normal).status).toBe(200);
    expect(harness.calls).toBe(1);
    expect(db.sqlite.prepare('SELECT request_count FROM ai_user_admission WHERE user_id=?').get(ownerId)).toMatchObject({ request_count: 1 });
  });

  it('caches normalized usable content when package insertion fails and replay-only returns it without generation', async () => {
    db.sqlite.exec(`CREATE TRIGGER reject_generated_package BEFORE INSERT ON bank_soal BEGIN SELECT RAISE(ABORT,'fixture package write rejected'); END;`);
    const response = await request('generate');
    expect(response.status).toBe(200);
    const failedSave: any = await response.json();
    expect(failedSave.data._persistence.saveStatus).toBe('failed');
    expect(failedSave.data.pg[0].soal).toContain('hasil pengamatan');
    expect(db.sqlite.prepare('SELECT state,package_id,result_json FROM assessment_generation_requests').get()).toMatchObject({ state: 'completed', package_id: null });
    const replay = await request('generate', clientDocumentId, { 'X-Assessment-Replay-Only': '1' });
    const replayPayload: any = await replay.json();
    expect(replayPayload.data._persistence.saveStatus).toBe('failed');
    expect(replayPayload.data.pg[0].soal).toBe(failedSave.data.pg[0].soal);
    expect(harness.calls).toBe(1);
  });

  it('does not resurrect a completed package that was deleted', async () => {
    const generated = await request('generate');
    const result: any = await generated.json();
    db.sqlite.prepare('DELETE FROM bank_soal WHERE id=?').run(result.data._persistence.packageId);
    const replay = await request('generate');
    expect(replay.status).toBe(409);
    expect(harness.calls).toBe(1);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
  });

  it('does not replay a completed pointer after its package ownership changes', async () => {
    const generated = await request('generate');
    const result: any = await generated.json();
    db.sqlite.prepare(`INSERT INTO users VALUES (999,'Foreign Owner','Other School','guru','other@example.test')`).run();
    db.sqlite.prepare('UPDATE bank_soal SET user_id=999 WHERE id=?').run(result.data._persistence.packageId);
    const replay = await request('generate');
    expect(replay.status).toBe(409);
    expect(harness.calls).toBe(1);
  });

  it('does not return success when recovery-ledger settlement itself fails', async () => {
    db.sqlite.exec(`CREATE TRIGGER reject_ledger_completion BEFORE UPDATE OF state ON assessment_generation_requests WHEN NEW.state='completed' BEGIN SELECT RAISE(ABORT,'fixture ledger settlement rejected'); END;
      CREATE TRIGGER reject_generated_package BEFORE INSERT ON bank_soal BEGIN SELECT RAISE(ABORT,'fixture package write rejected'); END;`);
    const response = await request('generate');
    expect(response.status).not.toBe(200);
    expect(db.sqlite.prepare('SELECT state FROM assessment_generation_requests').get()).toMatchObject({ state: 'failed' });
  });

  it('settles a reservation failed when AI admission storage throws', async () => {
    db.sqlite.exec(`CREATE TRIGGER reject_admission BEFORE INSERT ON ai_user_admission BEGIN SELECT RAISE(ABORT,'fixture admission storage failure'); END;`);
    const response = await request('generate');
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'ADMISSION_UNAVAILABLE' } });
    expect(harness.calls).toBe(0);
    expect(db.sqlite.prepare('SELECT state,failure_code FROM assessment_generation_requests').get()).toMatchObject({ state: 'failed', failure_code: 'AI_ADMISSION_REJECTED' });
  });

  it('retains the shared admission middleware 429 contract and closes the rejected ledger reservation', async () => {
    const firstId = '8fefac27-cd03-48a0-9ff6-ccf7b263d090';
    const secondId = '798dcb72-8d82-49bf-8d81-bbcf0632e196';
    const first = await request('generate', firstId, {}, { ...payload, clientDocumentId: firstId }, { AI_ADMISSION_MAX_REQUESTS: '1' });
    expect(first.status).toBe(200);
    const second = await request('generate', secondId, {}, { ...payload, clientDocumentId: secondId }, { AI_ADMISSION_MAX_REQUESTS: '1' });
    expect(second.status).toBe(429);
    expect(harness.calls).toBe(1);
    expect(db.sqlite.prepare('SELECT client_document_id,state,failure_code FROM assessment_generation_requests WHERE client_document_id=?').get(secondId)).toMatchObject({ state: 'failed', failure_code: 'AI_ADMISSION_REJECTED' });
  });

  it('keeps partial metadata consistent across saved normal and SSE replays without another admission/provider call', async () => {
    const partialBody = { ...payload, jumlahPG: 2, clientDocumentId };
    const first = await request('generate', clientDocumentId, {}, partialBody);
    const firstPayload: any = await first.json();
    expect(firstPayload.data._generation).toMatchObject({ partial: true, requested: { pg: 2 } });
    expect(firstPayload.data._generation.warnings).toHaveLength(1);
    const normalReplay: any = await (await request('generate', clientDocumentId, {}, partialBody)).json();
    expect(normalReplay.data._generation).toEqual(firstPayload.data._generation);
    const sseReplay = await request('generate-stream', clientDocumentId, {}, partialBody);
    const done = (await sseReplay.text()).split(/\r?\n/).find(line => line.startsWith('data: '));
    const ssePayload = JSON.parse(done!.slice(6));
    expect(ssePayload.partial).toBe(true);
    expect(ssePayload.warnings).toEqual(firstPayload.data._generation.warnings);
    expect(ssePayload.data._generation).toEqual(firstPayload.data._generation);
    expect(harness.calls).toBe(3); // Initial generation plus two bounded duplicate-only refills.
    expect(db.sqlite.prepare('SELECT request_count FROM ai_user_admission WHERE user_id=?').get(ownerId)).toMatchObject({ request_count: 1 });
  });

  it('keeps partial metadata consistent in failed-save recovery replay across normal and SSE transports', async () => {
    db.sqlite.exec(`CREATE TRIGGER reject_generated_package BEFORE INSERT ON bank_soal BEGIN SELECT RAISE(ABORT,'fixture package write rejected'); END;`);
    const partialBody = { ...payload, jumlahPG: 2, clientDocumentId };
    const first: any = await (await request('generate', clientDocumentId, {}, partialBody)).json();
    expect(first.data._generation).toMatchObject({ partial: true, requested: { pg: 2 } });
    expect(first.data._persistence.saveStatus).toBe('failed');
    const normalReplay: any = await (await request('generate', clientDocumentId, {}, partialBody)).json();
    expect(normalReplay.data._generation).toEqual(first.data._generation);
    const sseReplay = await request('generate-stream', clientDocumentId, {}, partialBody);
    const done = (await sseReplay.text()).split(/\r?\n/).find(line => line.startsWith('data: '));
    const ssePayload = JSON.parse(done!.slice(6));
    expect(ssePayload.partial).toBe(true);
    expect(ssePayload.warnings).toEqual(first.data._generation.warnings);
    expect(ssePayload.data._generation).toEqual(first.data._generation);
    expect(harness.calls).toBe(3); // Replays never repeat the bounded refill attempts.
    expect(db.sqlite.prepare('SELECT request_count FROM ai_user_admission WHERE user_id=?').get(ownerId)).toMatchObject({ request_count: 1 });
  });

  it('ends the ledger on pre-stream provider-configuration failure', async () => {
    harness.failLoad = true;
    const response = await request('generate-stream');
    expect(response.status).toBe(500);
    expect(harness.calls).toBe(0);
    expect(db.sqlite.prepare('SELECT state,failure_code FROM assessment_generation_requests').get()).toMatchObject({ state: 'failed', failure_code: 'PRE_STREAM_FAILED' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM ai_generation_jobs').get()).toMatchObject({ n: 0 });
  });

  it('ends the ledger without provider generation when a requested SSE job identity conflicts', async () => {
    const now = Math.floor(Date.now() / 1000);
    db.sqlite.prepare(`INSERT INTO ai_generation_jobs(user_id,job_id,operation,request_hash,state,lease_until,expires_at) VALUES(?,?,'kisi','occupied-hash','running',?,?)`)
      .run(ownerId, 'fixture-job-0001', now + 90, now + 3600);
    const response = await request('generate-stream');
    expect(response.status).toBe(409);
    expect(harness.calls).toBe(0);
    expect(db.sqlite.prepare('SELECT state FROM assessment_generation_requests').get()).toMatchObject({ state: 'failed' });
  });

  it('rolls back package commit when the SSE job lease expires during fenced package creation', async () => {
    harness.onGenerate = () => { db.sqlite.prepare('UPDATE ai_generation_jobs SET lease_until=0 WHERE job_id=?').run('lease-fixture-0001'); };
    const response = await request('generate-stream', clientDocumentId, { 'X-AI-Job-Id': 'lease-fixture-0001' });
    expect(response.status).toBe(200);
    const stream = await response.text();
    expect(stream).toContain('event: error');
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    expect(db.sqlite.prepare('SELECT state FROM assessment_generation_requests').get()).toMatchObject({ state: 'failed' });
    expect(harness.calls).toBe(1);
  });

  it('cancels an in-flight SSE generation before package creation when its response stream is abandoned', async () => {
    let entered!: () => void, release!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const blocked = new Promise<void>(resolve => { release = resolve; });
    harness.wait = async () => { entered(); await blocked; };
    const response = await request('generate-stream', clientDocumentId, { 'X-AI-Job-Id': 'cancel-fixture-0001' });
    const reader = response.body!.getReader();
    const reading = reader.read();
    await started;
    await reader.cancel();
    release();
    await reading.catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    expect(db.sqlite.prepare('SELECT state FROM assessment_generation_requests').get()).toMatchObject({ state: 'cancelled' });
  });
});
