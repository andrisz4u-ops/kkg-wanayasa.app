// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import authRoutes from '../src/routes/auth';
import absensiRoutes from '../src/routes/absensi';
import { generateSecureToken, verifySecureToken } from '../src/lib/qrcode';
import { SqliteD1 } from './helpers/sqlite-d1';

vi.mock('../src/lib/auth', async importOriginal => ({
  ...await importOriginal<typeof import('../src/lib/auth')>(),
  getCurrentUser: vi.fn(async () => ({ id: 1, role: 'admin' }))
}));

describe('Stage 1 QR and login safeguards', () => {
  let db: SqliteD1;
  let app: Hono<any>;

  beforeEach(() => {
    db = new SqliteD1();
    db.sqlite.exec(`
      CREATE TABLE sekolah(id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT, kop_surat_url TEXT, npsn TEXT, alamat TEXT);
      CREATE TABLE users(id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT, is_approved INTEGER, password_hash TEXT);
      CREATE TABLE sessions(id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT);
      CREATE TABLE kegiatan(id INTEGER PRIMARY KEY, nama_kegiatan TEXT, is_locked INTEGER DEFAULT 0);
      CREATE TABLE absensi(id INTEGER PRIMARY KEY AUTOINCREMENT, kegiatan_id INTEGER, user_id INTEGER, status TEXT DEFAULT 'hadir', waktu_checkin TEXT DEFAULT CURRENT_TIMESTAMP, keterangan TEXT, latitude REAL, longitude REAL);
      INSERT INTO users(id, nama, email, role, role_label, tenant_id, is_approved, password_hash) VALUES(1, 'Admin', 'admin@example.test', 'admin', 'admin', 'kkg-gugus-3-wanayasa', 1, 'unused');
      INSERT INTO sessions(id, user_id, expires_at) VALUES('admin-session', 1, datetime('now', '+1 day'));
      INSERT INTO kegiatan(id, nama_kegiatan, is_locked) VALUES(10, 'Kegiatan', 0);
    `);
    app = new Hono().route('/absensi', absensiRoutes).route('/auth', authRoutes);
  });

  afterEach(() => db.close());

  it('generates and verifies valid tokens, rejects tampering, and fails safely without a key', async () => {
    const token = await generateSecureToken(10, 'test-secret-with-high-entropy');
    expect((await verifySecureToken(token, 'test-secret-with-high-entropy')).valid).toBe(true);
    expect((await verifySecureToken(`${token}x`, 'test-secret-with-high-entropy')).valid).toBe(false);
    expect(await verifySecureToken(token)).toMatchObject({ valid: false, error: 'QR signing configuration unavailable' });
    await expect(generateSecureToken(10, '')).rejects.toThrow('QR signing configuration unavailable');
  });

  it.each(['hadir', 'izin', 'sakit'])('rejects locked kegiatan for %s on both new and existing check-ins', async status => {
    db.sqlite.exec(`UPDATE kegiatan SET is_locked = 1 WHERE id = 10`);
    const request = (body: object) => app.request('/absensi/checkin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }, { DB: db });

    const absent = await request({ kegiatan_id: 10, status });
    expect(absent.status).toBe(400);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM absensi').get()).toMatchObject({ count: 0 });

    db.sqlite.exec("INSERT INTO absensi(kegiatan_id, user_id, status) VALUES(10, 1, 'hadir')");
    const existing = await request({ kegiatan_id: 10, status });
    expect(existing.status).toBe(400);
    expect(db.sqlite.prepare('SELECT status FROM absensi WHERE kegiatan_id = 10 AND user_id = 1').get()).toMatchObject({ status: 'hadir' });
  });

  it('does not expose internal login exception text or stack to the client', async () => {
    const response = await app.request('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.test', password: 'ValidPassword123!' })
    }, { DB: { prepare: () => { throw new Error('internal database failure with stack'); } } as any });
    const body = await response.text();
    expect(response.status).toBe(500);
    expect(body).not.toContain('no such column');
    expect(body).not.toContain('stack');
    expect(body).toContain('Terjadi kesalahan internal');
  });
});
