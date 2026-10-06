import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import presentation from '../src/routes/presentation';
import tts from '../src/routes/tts';
import guru from '../src/routes/guru';
import absensi from '../src/routes/absensi';
import { getCurrentUser } from '../src/lib/auth';
import { allowedCorsOrigin } from '../src/lib/cors-origin';
import { attendanceSummary } from '../src/lib/attendance-summary';
import { reserveSuratNumbers, SuratNumberConflict } from '../src/lib/surat-numbering';
import { SqliteD1 } from './helpers/sqlite-d1';

vi.mock('../src/lib/auth', async importOriginal => ({ ...await importOriginal<typeof import('../src/lib/auth')>(), getCurrentUser: vi.fn() }));

let db: SqliteD1;
let app: Hono;
beforeEach(() => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, nama TEXT, role TEXT, role_label TEXT, email TEXT, nip TEXT, no_hp TEXT, sekolah TEXT, mata_pelajaran TEXT, foto_url TEXT, created_at TEXT, status TEXT);
    INSERT INTO users VALUES(1, 'Guru, "A"', 'user', NULL, 'contoh@example.test', '123', '08123', 'SD Uji', 'Matematika', NULL, '2026-01-01', 'active');
    INSERT INTO users(id, nama, role, status) VALUES(2, 'Guru B', 'user', 'active');
    CREATE TABLE kegiatan(id INTEGER PRIMARY KEY, tanggal TEXT);
    INSERT INTO kegiatan VALUES(1, '2026-09-01'), (2, '2026-10-05');
    CREATE TABLE absensi(user_id INTEGER, kegiatan_id INTEGER, status TEXT);
    INSERT INTO absensi VALUES(1, 1, 'hadir'), (1, 2, 'hadir');
    CREATE TABLE surat_undangan(id INTEGER PRIMARY KEY, user_id INTEGER, nomor_surat TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, metadata TEXT);`);
  app = new Hono().route('/presentation', presentation).route('/tts', tts).route('/guru', guru).route('/absensi', absensi);
});
afterEach(() => { db.close(); vi.clearAllMocks(); });
const request = (url: string, options?: RequestInit) => app.request(url, options, { DB: db });

describe('Session gates and contact privacy', () => {
  it.each(['/presentation/outline', '/presentation/generate', '/presentation/patch-slide', '/tts/generate', '/tts/custom'])('rejects anonymous %s before reaching generation', async path => {
    expect((await request(path, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })).status).toBe(401);
  });
  it.each(['/absensi/rekap', '/absensi/rekap/export', '/absensi/kegiatan/2/absensi'])('guards attendance contact data at %s', async path => {
    expect((await request(path)).status).toBe(401);
  });
  it('redacts anonymous teacher detail while retaining authenticated contact fields', async () => {
    db.sqlite.exec("UPDATE users SET role_label = 'Guru Kelas' WHERE id = 1");
    const anonymous = (await (await request('/guru/1')).json()).data;
    expect(anonymous.nama).toBe('Guru, "A"');
    expect(anonymous.role).toBe('Guru Kelas');
    for (const field of ['email', 'nip', 'no_hp']) expect(anonymous).not.toHaveProperty(field);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user' } as any);
    expect((await (await request('/guru/1')).json()).data).toMatchObject({ nip: '123', no_hp: '08123', email: 'contoh@example.test' });
  });
  it('permits an authenticated caller to reach normal payload validation', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user' } as any);
    expect((await request('/presentation/outline', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })).status).toBe(400);
  });
});

describe('Attendance period consistency', () => {
  it('counts numerator and denominator in the same interval and keeps teachers with no attendance', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'admin' } as any);
    const data = (await (await request('/absensi/rekap?start_date=2026-10-05&end_date=2026-10-05')).json()).data;
    expect(data[0]).toMatchObject({ total_hadir: 1, total_tercatat: 1, total_kegiatan: 1, total_alpha: 0 });
    expect(data[1]).toMatchObject({ total_hadir: 0, total_tercatat: 0, total_kegiatan: 1, total_alpha: 1 });
    const csv = await (await request('/absensi/rekap/export?start_date=2026-10-05&end_date=2026-10-05')).text();
    expect(csv).toContain('"Guru, ""A""",123,SD Uji,1,0,0,0,1,100.0%');
    expect(csv).not.toContain('200.0%');
  });
  it('uses one-sided filters and rejects invalid or reversed dates', () => {
    const query = attendanceSummary('2026-10-01');
    expect(db.sqlite.prepare(query.sql).get(...query.params)).toMatchObject({ total_hadir: 1, total_kegiatan: 1 });
    expect(() => attendanceSummary('2026-02-30')).toThrow(RangeError);
    expect(() => attendanceSummary('2026-10-06', '2026-10-05')).toThrow(RangeError);
  });
});

describe('Exact CORS origins', () => {
  it('accepts only same-origin, explicitly configured origins, or local-to-local development', () => {
    expect(allowedCorsOrigin('https://kkg-wanayasa.pages.dev', 'https://kkg-wanayasa.pages.dev/api/guru')).toBe('https://kkg-wanayasa.pages.dev');
    expect(allowedCorsOrigin('https://guru.example', 'https://kkg.example/api', 'production', 'https://guru.example')).toBe('https://guru.example');
    expect(allowedCorsOrigin('http://localhost:5173', 'http://127.0.0.1:8788/api')).toBe('http://localhost:5173');
    for (const origin of ['https://kkg-wanayasa.evil.test', 'https://evil.test/kkg-wanayasa', 'https://localhost.evil.test', 'null', 'http://localhost:5173']) {
      expect(allowedCorsOrigin(origin, 'https://kkg.example/api', 'production')).toBeNull();
    }
  });
});

describe('Atomic document numbers', () => {
  const migrate = () => db.sqlite.exec(readFileSync('migrations/0028_atomic_surat_numbering.sql', 'utf8'));
  const reserve = () => reserveSuratNumbers(db as any, { year: 2026, userId: 1, makeNumbers: sequence => ({ surat: `${sequence}/KKG/UND/10/2026` }) });
  it('allocates distinct numbers for concurrent requests and does not reuse a deleted document number', async () => {
    migrate();
    const jobs = await Promise.all(Array.from({ length: 12 }, reserve));
    expect(new Set(jobs.map(job => job.numbers.surat)).size).toBe(12);
    const first = jobs[0];
    await db.batch([db.prepare('INSERT INTO surat_undangan(user_id, nomor_surat) VALUES(?, ?)').bind(1, first.numbers.surat), first.issueStatement(first.numbers.surat)]);
    db.sqlite.exec('DELETE FROM surat_undangan');
    expect((await reserve()).numbers.surat).toBe('013/KKG/UND/10/2026');
    expect(db.sqlite.prepare("SELECT state FROM surat_number_reservations WHERE number_key = ?").get(first.numbers.surat)).toMatchObject({ state: 'issued' });
  });
  it('backfills historical numbers without changing duplicates and protects historical SPPD numbers', async () => {
    db.sqlite.exec(`INSERT INTO surat_undangan(user_id, nomor_surat, created_at, metadata) VALUES
      (1, '017/KKG/UND/10/2026', '2026-10-01', NULL),
      (1, '017/KKG/UND/10/2026', '2026-10-01', NULL),
      (1, '421.2 / 018 / SDN / X / 2026', '2026-10-01', '{"nomor_sppd":"090 / 018 / SDN / X / 2026"}');`);
    migrate();
    expect((await reserve()).numbers.surat).toBe('019/KKG/UND/10/2026');
    expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM surat_undangan').get()).toMatchObject({ total: 3 });
    await expect(reserveSuratNumbers(db as any, { year: 2026, userId: 1, automatic: false, manualNumbers: ['090/018/SDN/X/2026'], makeNumbers: () => ({ sppd: '090/018/SDN/X/2026' }) })).rejects.toBeInstanceOf(SuratNumberConflict);
  });
  it('rolls back the complete SPT/SPPD reservation on manual collision and releases failed work', async () => {
    migrate();
    const first = await reserveSuratNumbers(db as any, { year: 2026, userId: 1, automatic: false, manualNumbers: ['SPPD/1'], makeNumbers: () => ({ sppd: 'SPPD/1' }) });
    await expect(reserveSuratNumbers(db as any, { year: 2026, userId: 1, automatic: false, manualNumbers: ['SPPD/1'], makeNumbers: () => ({ spt: 'SPT/1', sppd: 'SPPD/1' }) })).rejects.toBeInstanceOf(SuratNumberConflict);
    expect(db.sqlite.prepare('SELECT number_key FROM surat_number_reservations WHERE number_key = ?').get('SPT/1')).toBeUndefined();
    await first.release();
    expect((await reserveSuratNumbers(db as any, { year: 2026, userId: 1, automatic: false, makeNumbers: () => ({ sppd: 'SPPD/1' }) })).numbers.sppd).toBe('SPPD/1');
  });
});
