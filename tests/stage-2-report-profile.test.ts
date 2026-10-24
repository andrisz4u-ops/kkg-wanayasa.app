// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import laporan from '../src/routes/laporan';
import profile from '../src/routes/profile';
import guru from '../src/routes/guru';
import { getCurrentUser } from '../src/lib/auth';
import { SqliteD1 } from './helpers/sqlite-d1';

vi.mock('../src/lib/auth', async importOriginal => ({ ...await importOriginal<typeof import('../src/lib/auth')>(), getCurrentUser: vi.fn() }));

let db: SqliteD1;
let app: Hono;
beforeEach(() => {
  db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT, nip TEXT, nik TEXT,
    mata_pelajaran TEXT, sekolah TEXT, sekolah_id INTEGER, no_hp TEXT, alamat TEXT, foto_url TEXT,
    updated_at TEXT, created_at TEXT
  );
  INSERT INTO users(id,nama,email,role,sekolah,sekolah_id) VALUES
    (1,'Owner','o@example.test','user','Old School',77), (2,'Other','x@example.test','user','Old School',77);
  CREATE TABLE sekolah(id INTEGER PRIMARY KEY, nama TEXT);
  INSERT INTO sekolah VALUES(1,'SDN 2 Nangerang');
  CREATE TABLE audit_logs(id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT, entity_type TEXT, entity_id INTEGER, details TEXT, ip_address TEXT, user_agent TEXT);
  CREATE TABLE laporan_kegiatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, program_kerja_id INTEGER, judul_laporan TEXT, periode TEXT,
    pendahuluan_latar_belakang TEXT, pendahuluan_tujuan TEXT, pendahuluan_manfaat TEXT,
    pelaksanaan_waktu_tempat TEXT, pelaksanaan_materi TEXT, pelaksanaan_peserta TEXT,
    hasil_uraian TEXT, hasil_tindak_lanjut TEXT, hasil_dampak TEXT, penutup_simpulan TEXT, penutup_saran TEXT,
    lampiran_foto TEXT, status TEXT, updated_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO laporan_kegiatan(id,user_id,judul_laporan,periode,status) VALUES(1,1,'Existing','2026','draft'),(2,2,'Other','2026','draft');`);
  app = new Hono().route('/laporan', laporan).route('/profile', profile).route('/guru', guru);
});
afterEach(() => { db.close(); vi.clearAllMocks(); });
const request = (url: string, options?: RequestInit) => app.request(url, options, { DB: db });
const reportBody = (status?: string) => ({
  judul_laporan: 'Updated', periode: '2026', lampiran_foto: [],
  pendahuluan_latar_belakang: null, pendahuluan_tujuan: null, pendahuluan_manfaat: null,
  pelaksanaan_waktu_tempat: null, pelaksanaan_materi: null, pelaksanaan_peserta: null,
  hasil_uraian: null, hasil_tindak_lanjut: null, hasil_dampak: null, penutup_simpulan: null, penutup_saran: null,
  ...(status === undefined ? {} : { status })
});

describe('Stage 2 report status and authorization', () => {
  it('keeps reports owner-scoped for normal users while admin/operator can access any owner', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user' } as any);
    expect((await request('/laporan/2')).status).toBe(403);
    expect((await request('/laporan/2', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportBody('final')) })).status).toBe(403);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'operator' } as any);
    expect((await request('/laporan/2')).status).toBe(200);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'admin' } as any);
    expect((await request('/laporan/2', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportBody('final')) })).status).toBe(200);
  });

  it('rejects invalid status values on create and update', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user' } as any);
    expect((await request('/laporan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportBody('approved')) })).status).toBe(400);
    expect((await request('/laporan/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportBody('approved')) })).status).toBe(400);
    expect(db.sqlite.prepare('SELECT status FROM laporan_kegiatan WHERE id=1').get()).toMatchObject({ status: 'draft' });
  });

  it('conditionally updates the previous status, reports stale transitions as 409, and accepts legacy payloads without status', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user' } as any);
    const response = await request('/laporan/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportBody('final')) });
    expect(response.status).toBe(200);
    db.sqlite.exec(`CREATE TRIGGER stale_status_update BEFORE UPDATE ON laporan_kegiatan
      WHEN OLD.status = 'final' AND NEW.status = 'final'
      BEGIN SELECT RAISE(IGNORE); END;`);
    const stale = await request('/laporan/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportBody('final')) });
    expect(stale.status).toBe(409);
    expect(db.sqlite.prepare('SELECT status FROM laporan_kegiatan WHERE id=1').get()).toMatchObject({ status: 'final' });
    db.sqlite.exec('DROP TRIGGER stale_status_update');
    db.sqlite.prepare("UPDATE laporan_kegiatan SET status='draft' WHERE id=1").run();
    expect((await request('/laporan/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportBody()) })).status).toBe(200);
  });
});

describe('Shared profile school resolver', () => {
  it('canonicalizes a unique match through JSON and multipart writes', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user', foto_url: null } as any);
    await request('/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: 'Owner', sekolah: 'sd negeri 02 nangerang' }) });
    expect(db.sqlite.prepare('SELECT sekolah,sekolah_id FROM users WHERE id=1').get()).toMatchObject({ sekolah: 'SDN 2 Nangerang', sekolah_id: 1 });
    const data = new FormData();
  data.set('nama', 'Owner'); data.set('sekolah', 'SD Negeri 2 Nangerang'); data.set('nip', ''); data.set('mata_pelajaran', ''); data.set('no_hp', ''); data.set('alamat', '');
    await request('/guru/profile', { method: 'PUT', body: data });
    expect(db.sqlite.prepare('SELECT sekolah,sekolah_id FROM users WHERE id=1').get()).toMatchObject({ sekolah: 'SDN 2 Nangerang', sekolah_id: 1 });
  });

  it('clears stale school ids for unmatched and ambiguous normalized names', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user', foto_url: null } as any);
    await request('/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: 'Owner', sekolah: '  SD Negeri 9 Sukatani  ' }) });
    expect(db.sqlite.prepare('SELECT sekolah,sekolah_id FROM users WHERE id=1').get()).toMatchObject({ sekolah: 'SDN 9 Sukatani', sekolah_id: null });
    db.sqlite.exec("INSERT INTO sekolah VALUES(2,'SD Negeri 2 Nangerang')");
    const data = new FormData(); data.set('nama', 'Owner'); data.set('sekolah', 'SDN 02 Nangerang'); data.set('nip', ''); data.set('mata_pelajaran', ''); data.set('no_hp', ''); data.set('alamat', '');
    await request('/guru/profile', { method: 'PUT', body: data });
    expect(db.sqlite.prepare('SELECT sekolah,sekolah_id FROM users WHERE id=1').get()).toMatchObject({ sekolah: 'SDN 2 Nangerang', sekolah_id: null });
  });
});
