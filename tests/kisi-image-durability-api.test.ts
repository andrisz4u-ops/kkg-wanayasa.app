import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { webcrypto } from 'node:crypto';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';

const harness = vi.hoisted(() => ({
  aiCalls: [] as string[],
  fakeImageCalls: [] as string[],
  fetchCalls: [] as string[],
  png: [] as number[],
  pg: [] as any[],
  batchItems: [] as any[],
}));

vi.mock('../src/lib/auth', async original => ({ ...await original<any>(), getCurrentUser: vi.fn() }));
vi.mock('../src/services/ai', () => ({ AIService: class {
  async loadProviders() {}
  async generateJSON(prompt: string) {
    harness.aiCalls.push(prompt);
    if (/^\s*Bertindaklah sebagai "Auditor & Pakar Penilaian Asesmen/i.test(prompt)) return { verifications: [] };
    if (/NOMOR URUT:|butir soal pengganti/i.test(prompt)) return { items: structuredClone(harness.batchItems) };
    return { pg: structuredClone(harness.pg) };
  }
  async generateJSONStream(prompt: string, _provider: string, onToken: (token: string) => Promise<void>) {
    harness.aiCalls.push(prompt);
    await onToken('{"pg":');
    return { pg: structuredClone(harness.pg) };
  }
  setAbortSignal() {}
} }));
vi.mock('../src/lib/assessment-assets', async original => {
  const actual = await original<any>();
  return {
    ...actual,
    fetchTrustedAssessmentImage: async (ownerId: number, sourceUrl: string) => {
      harness.fetchCalls.push(sourceUrl);
      if (sourceUrl.includes('/expired-case')) throw new actual.TrustedImageIngestError('expired_or_missing');
      return actual.prepareAssessmentAsset(ownerId, Uint8Array.from(harness.png), 'image/png');
    },
  };
});
import kisi from '../src/routes/kisi';
import { getCurrentUser } from '../src/lib/auth';
import { UnsplashService } from '../src/services/unsplash';

const OWNER_ID = 41;
let db: SqliteD1;
let app: Hono;

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, payload: Uint8Array) {
  const typeBytes = new TextEncoder().encode(type);
  const output = new Uint8Array(12 + payload.length);
  const view = new DataView(output.buffer);
  view.setUint32(0, payload.length);
  output.set(typeBytes, 4);
  output.set(payload, 8);
  view.setUint32(8 + payload.length, crc32(output.subarray(4, 8 + payload.length)));
  return output;
}

function validPng() {
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, 1);
  new DataView(ihdr.buffer).setUint32(4, 1);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const idat = new Uint8Array(deflateSync(Uint8Array.from([0, 255, 0, 0, 255])));
  const chunks = [pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', new Uint8Array())];
  const length = signature.length + chunks.reduce((sum, item) => sum + item.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of [signature, ...chunks]) { result.set(part, offset); offset += part.length; }
  return result;
}

function migration(name: string) {
  db.sqlite.exec(readFileSync(`migrations/${name}`, 'utf8'));
}

function setupDatabase() {
  const value = new SqliteD1();
  db = value;
  // The local SQLite adapter needs D1's ArrayBuffer BLOB bindings mapped to Buffer.
  const basePrepare = value.prepare.bind(value);
  value.prepare = ((sql: string) => {
    const statement: any = basePrepare(sql);
    const bind = statement.bind.bind(statement);
    statement.bind = (...args: any[]) => bind(...args.map(arg => arg instanceof ArrayBuffer ? Buffer.from(arg) : arg));
    return statement;
  }) as any;
  value.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, nama TEXT, sekolah TEXT, role TEXT, email TEXT);
    INSERT INTO users(id,nama,sekolah,role,email) VALUES (${OWNER_ID},'API Fixture Teacher','Fixture School','guru','teacher@example.test');
    CREATE TABLE sessions(id TEXT PRIMARY KEY,user_id INTEGER,expires_at TEXT);
    INSERT INTO sessions VALUES ('fixture-session',${OWNER_ID},datetime('now','+1 day'));`);
  for (const name of [
    '0016_ai_generation_logs.sql', '0018_bank_soal.sql', '0029_ai_generation_jobs.sql',
    '0032_ai_admission.sql', '0038_curriculum_source_provenance.sql',
    '0040_bank_soal_moderation.sql', '0041_assessment_image_assets.sql', '0042_assessment_package_revisions.sql', '0043_assessment_generation_requests.sql', '0044_assessment_image_capacity.sql',
  ]) migration(name);
  value.sqlite.exec(`CREATE TABLE capaian_pembelajaran (
    id INTEGER PRIMARY KEY, mata_pelajaran TEXT NOT NULL, fase TEXT NOT NULL, teks_cp TEXT NOT NULL,
    elemen_json TEXT NOT NULL, regulasi TEXT, UNIQUE(mata_pelajaran, fase)
  );`);
  return value;
}

const body = {
  mataPelajaran: 'IPAS', topik: 'Buah dan ekosistem', jenjangKelas: 'Kelas 5', semester: 'Semester 1',
  jenisUjian: 'Sumatif', jumlahPG: 10, jumlahIsian: 0, jumlahUraian: 0,
  useGambar: true, aiProvider: 'fake', capaianPembelajaran: 'Murid memahami hubungan makhluk hidup.',
};

function assessmentQuestions() {
  const questions: any[] = Array.from({ length: 10 }, (_, index) => ({
    no: index + 1, soal: `Manakah hubungan dalam ekosistem nomor ${index + 1}?`,
    opsi: { A: 'Pilihan benar', B: 'Pilihan kedua', C: 'Pilihan ketiga', D: 'Pilihan keempat' },
    kunci: 'A', level: 'L1', materi: 'Ekosistem', bentuk: 'Pilihan Ganda',
    cp: 'Murid memahami hubungan makhluk hidup.', indikator: 'Disajikan konteks, murid menentukan hubungan.',
  }));
  questions[0].soal = 'Perhatikan gambar buah apel berikut (fixture-valid-case). Buah apa yang terlihat?';
  questions[0].gambar_keyword = 'apel';
  questions[1].soal = 'Perhatikan gambar buah jeruk berikut (expired-case). Buah apa yang terlihat?';
  questions[1].gambar_keyword = 'jeruk';
  return questions;
}

function request(path: string, payload: any, id: string) {
  return app.request(`/api/kisi/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer fixture-session',
      'X-AI-Job-Id': id,
    },
    body: JSON.stringify(payload),
  }, { DB: db as any });
}

function parseDone(text: string) {
  const frame = text.split(/\r?\n\r?\n/).find(part => /^event: done\r?\n/m.test(part));
  expect(frame, `SSE done frame missing; got ${text}`).toBeTruthy();
  const dataLine = frame!.split(/\r?\n/).find(line => line.startsWith('data: '));
  expect(dataLine).toBeTruthy();
  return JSON.parse(dataLine!.slice(6));
}

function expectPersisted(payload: any) {
  const data = payload.data;
  expect(data._persistence).toMatchObject({ packageId: expect.any(Number), revision: 1, saveStatus: 'saved' });
    expect(data._persistence.imageWarnings, JSON.stringify({ calls: harness.aiCalls, fakeImages: harness.fakeImageCalls, fetchCalls: harness.fetchCalls, payload })).toEqual(expect.arrayContaining([
    expect.objectContaining({ questionNo: 2, reason: 'expired_or_missing' }),
  ]));
  const persisted: any = db.sqlite.prepare('SELECT content FROM bank_soal WHERE id=? AND user_id=?').get(data._persistence.packageId, OWNER_ID);
  expect(persisted).toBeTruthy();
  const content = JSON.parse(persisted.content);
  const returnedAsset = data.pg[0].gambar.assetId;
  expect(returnedAsset, JSON.stringify({ calls: harness.fakeImageCalls, fetchCalls: harness.fetchCalls, image: data.pg[0].gambar, content: content.pg.slice(0, 2) })).toMatch(/^[0-9a-f-]{36}$/i);
  expect(content.pg[0].gambar.assetId).toBe(returnedAsset);
  expect(data.pg[0].gambar.url).toBe(`/api/banksoal/${data._persistence.packageId}/assets/${returnedAsset}`);
  expect(db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=?').all(data._persistence.packageId)).toEqual([{ asset_id: returnedAsset }]);
  expect(db.sqlite.prepare('SELECT owner_id,mime,byte_length FROM assessment_image_assets WHERE id=?').get(returnedAsset)).toMatchObject({ owner_id: OWNER_ID, mime: 'image/png', byte_length: validPng().length });
  expect(Buffer.from(db.sqlite.prepare('SELECT bytes FROM assessment_image_assets WHERE id=?').get(returnedAsset)?.bytes as Uint8Array)).toEqual(Buffer.from(validPng()));
  expect(JSON.stringify(payload)).not.toContain('secret-valid-token');
  expect(JSON.stringify(payload)).not.toContain('secret-expired-token');
  expect(persisted.content).not.toContain('secret-valid-token');
  expect(persisted.content).not.toContain('secret-expired-token');
  expect(content.pg[1].soal).toContain('Perhatikan gambar buah jeruk');
  expect(content.pg[1].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'expired_or_missing' });
  expect(harness.fetchCalls).toHaveLength(2);
}

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  harness.aiCalls = [];
  harness.fakeImageCalls = [];
  harness.fetchCalls = [];
  harness.png = [...validPng()];
  harness.pg = assessmentQuestions();
  harness.batchItems = [];
  db = setupDatabase();
  app = new Hono().route('/api/kisi', kisi);
  vi.mocked(getCurrentUser).mockResolvedValue({ id: OWNER_ID, role: 'guru', nama: 'API Fixture Teacher', sekolah: 'Fixture School' } as any);
  vi.spyOn(UnsplashService.prototype, 'searchImage').mockImplementation(async (_keyword: string, question: string) => {
    harness.fakeImageCalls.push(question);
    const expired = harness.fakeImageCalls.length === 2;
    return {
      url: expired
        ? 'https://sewr2.vultrobjects.com/generated/expired-case?signature=secret-expired-token'
        : 'https://sewr2.vultrobjects.com/generated/valid-case?signature=secret-valid-token',
      source: 'vultr-ai', creditName: 'Fixture image', unsplashId: expired ? 'expired' : 'valid',
    } as any;
  });
});

afterEach(() => {
  db.close();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('kisi image durability HTTP and SSE contracts', () => {
  it('returns a saved normal-generation response with durable associations, missing-image warning, and telemetry failure isolation', async () => {
    db.sqlite.exec(`CREATE TRIGGER fail_fixture_telemetry BEFORE INSERT ON ai_generation_logs BEGIN SELECT RAISE(ABORT,'telemetry fixture failure'); END;`);
    const response = await request('generate', body, 'normal-durable-001');
    expect(response.status).toBe(200);
    const payload: any = await response.json();
    expect(payload.success).toBe(true);
    expectPersisted(payload);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 1 });
    expect(db.sqlite.prepare('SELECT request_count FROM ai_user_admission WHERE user_id=?').get(OWNER_ID)).toMatchObject({ request_count: 1 });
    expect(harness.aiCalls.length).toBeGreaterThanOrEqual(2); // generation and deterministic quality-gate fixture
  });

  it('emits the same saved package identity and association in the actual SSE done.data payload', async () => {
    const response = await request('generate-stream', body, 'stream-durable-001');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const streamText = await response.text();
    const payload = parseDone(streamText);
    expect(payload.success).toBe(true);
    expectPersisted(payload);
    const job: any = db.sqlite.prepare('SELECT state,result_json FROM ai_generation_jobs WHERE job_id=?').get('stream-durable-001');
    expect(job.state).toBe('completed');
    expect(JSON.parse(job.result_json).data._persistence.packageId).toBe(payload.data._persistence.packageId);
    expect(harness.aiCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('returns failed persistence metadata when the actual package-association batch aborts atomically', async () => {
    db.sqlite.exec(`CREATE TRIGGER fail_fixture_association BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'association fixture failure'); END;`);
    const response = await request('generate', body, 'normal-rollback-001');
    expect(response.status).toBe(200);
    const payload: any = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data._persistence).toMatchObject({ packageId: null, revision: null, saveStatus: 'failed' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets').get()).toMatchObject({ n: 0 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=?').get(OWNER_ID)).toMatchObject({ n: 0 });
  });

  it('normalizes batch-regeneration replacement images for the owner without creating a package', async () => {
    harness.batchItems = [{
      no: 7, soal: 'Perhatikan gambar apel berikut. Apa nama buah ini?', gambar_keyword: 'apel',
      opsi: { A: 'Apel', B: 'Jeruk', C: 'Pisang', D: 'Mangga' }, kunci: 'A',
    }];
    const response = await request('regenerate-batch', {
      mataPelajaran: 'IPAS', topik: 'Buah', jenjangKelas: 'Kelas 5', itemsToReplace: [{ type: 'pg', no: 7 }],
      useGambar: true,
    }, 'batch-durable-001');
    expect(response.status).toBe(200);
    const payload: any = await response.json();
    expect(payload.success).toBe(true);
    const image = payload.data.items[0].gambar;
    expect(image.assetId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(image.url).toMatch(/^\/api\/assessment-assets\//);
    expect(db.sqlite.prepare('SELECT owner_id,mime FROM assessment_image_assets WHERE id=?').get(image.assetId)).toMatchObject({ owner_id: OWNER_ID, mime: 'image/png' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    expect(JSON.stringify(payload)).not.toContain('secret-valid-token');
    expect(harness.fetchCalls).toHaveLength(1);
  });
});
