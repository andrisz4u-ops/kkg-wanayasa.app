import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';
import sertifikatRoutes from '../src/routes/sertifikat';

describe('Sistem Sertifikat Presensi KKG & Dual Sign-Off (Ketua KKG & Pengawas)', () => {
  let db: SqliteD1;
  let app: Hono<any>;

  beforeEach(() => {
    db = new SqliteD1();

    // Inisialisasi skema tabel pengujian
    db.sqlite.exec(`
      CREATE TABLE sekolah (
        id INTEGER PRIMARY KEY,
        nama TEXT,
        kepala_sekolah TEXT,
        nip_kepala_sekolah TEXT,
        kop_surat_url TEXT,
        npsn TEXT,
        alamat TEXT
      );

      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        nama TEXT,
        email TEXT,
        role TEXT DEFAULT 'user',
        role_label TEXT DEFAULT 'user',
        nip TEXT,
        sekolah TEXT,
        mata_pelajaran TEXT,
        no_hp TEXT,
        foto_url TEXT,
        sekolah_id INTEGER,
        is_approved INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        expires_at DATETIME
      );

      CREATE TABLE kegiatan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_kegiatan TEXT NOT NULL,
        tanggal TEXT NOT NULL,
        waktu_mulai TEXT,
        waktu_selesai TEXT,
        tempat TEXT,
        deskripsi TEXT,
        created_by INTEGER,
        alokasi_jp INTEGER DEFAULT 4,
        narasumber TEXT,
        materi_struktur TEXT,
        is_locked INTEGER DEFAULT 0,
        ttd_ketua_nama TEXT,
        ttd_ketua_nip TEXT,
        ttd_ketua_at DATETIME,
        ttd_pengawas_nama TEXT,
        ttd_pengawas_nip TEXT,
        ttd_pengawas_at DATETIME,
        nomor_surat_prefix TEXT DEFAULT '421.2'
      );

      CREATE TABLE absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kegiatan_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'hadir',
        waktu_checkin DATETIME DEFAULT CURRENT_TIMESTAMP,
        keterangan TEXT
      );

      CREATE TABLE sertifikat_presensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kegiatan_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        nomor_sertifikat TEXT UNIQUE NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        refleksi_konsep TEXT,
        refleksi_tantangan TEXT,
        refleksi_rencana_aksi TEXT,
        status TEXT DEFAULT 'terbit',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed data pengguna
    db.sqlite.exec(`
      INSERT INTO users (id, nama, email, role, role_label, nip, sekolah)
      VALUES (1, 'Budi Santoso, S.Pd', 'budi@sd.id', 'user', 'user', '198501012010011001', 'SDN 1 Sukadami');

      INSERT INTO users (id, nama, email, role, role_label, nip, sekolah)
      VALUES (2, 'Ketua KKG Gugus 3, M.Pd', 'ketua@kkg.id', 'admin', 'admin', '197905152005011002', 'SDN 2 Nangerang');

      INSERT INTO users (id, nama, email, role, role_label, nip, sekolah)
      VALUES (3, 'Pengawas Pembina, M.M.Pd', 'pengawas@disdik.id', 'pengawas', 'pengawas', '196803121992031005', 'Dinas Pendidikan Purwakarta');

      INSERT INTO sessions (id, user_id, expires_at) VALUES ('sess_guru', 1, datetime('now', '+1 day'));
      INSERT INTO sessions (id, user_id, expires_at) VALUES ('sess_ketua', 2, datetime('now', '+1 day'));
      INSERT INTO sessions (id, user_id, expires_at) VALUES ('sess_pengawas', 3, datetime('now', '+1 day'));
    `);

    // Seed kegiatan
    db.sqlite.exec(`
      INSERT INTO kegiatan (id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, alokasi_jp, narasumber)
      VALUES (101, 'Workshop Pembelajaran Berdiferensiasi & Deep Learning', '2026-10-15', '08:00', '13:00', 'SDN 2 Nangerang', 4, 'Pengawas SD Pembina');
    `);

    app = new Hono<{ Bindings: { DB: any }; Variables: { user: any } }>();
    app.route('/api/sertifikat', sertifikatRoutes);
  });

  afterEach(() => {
    db.close();
  });

  it('1. Cek status awal: guru belum hadir dan belum ada tanda tangan', async () => {
    const res = await app.request('/api/sertifikat/kegiatan/101/status', {
      method: 'GET',
      headers: { 'x-session-id': 'sess_guru' }
    }, { DB: db });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.has_attended).toBe(false);
    expect(body.data.is_fully_signed).toBe(false);
    expect(body.data.can_download).toBe(false);
  });

  it('2. Tolak pengisian mikro-refleksi jika guru belum tercatat hadir', async () => {
    const res = await app.request('/api/sertifikat/refleksi', {
      method: 'POST',
      headers: {
        'x-session-id': 'sess_guru',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kegiatan_id: 101,
        refleksi_konsep: 'Konsep diferensiasi konten dan proses',
        refleksi_tantangan: 'Waktu persiapan modul yang terbatas',
        refleksi_rencana_aksi: 'Membuat asesmen awal pada hari Senin'
      })
    }, { DB: db });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error?.message).toContain('HADIR');
  });

  it('3. Catat kehadiran, lalu simpan mikro-refleksi (Exit Ticket) dengan sukses', async () => {
    // Guru check-in hadir
    db.sqlite.exec(`
      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
    `);

    const res = await app.request('/api/sertifikat/refleksi', {
      method: 'POST',
      headers: {
        'x-session-id': 'sess_guru',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kegiatan_id: 101,
        refleksi_konsep: 'Memahami rubrik diferensiasi Kurikulum Merdeka',
        refleksi_tantangan: 'Variasi kesiapan belajar murid di kelas 4',
        refleksi_rencana_aksi: 'Mendesain LKPD bertingkat (scaffolding)'
      })
    }, { DB: db });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token_hash).toBeDefined();

    // Cek di status
    const statusRes = await app.request('/api/sertifikat/kegiatan/101/status', {
      method: 'GET',
      headers: { 'x-session-id': 'sess_guru' }
    }, { DB: db });

    const statusBody = await statusRes.json();
    expect(statusBody.data.has_attended).toBe(true);
    expect(statusBody.data.has_reflection).toBe(true);
    expect(statusBody.data.is_fully_signed).toBe(false); // Masih menunggu TTD pengawas & ketua
  });

  it('4. Dual Sign-Off: Ketua KKG kunci presensi dan Pengawas sahkan sertifikat', async () => {
    // Guru sudah hadir dan submit refleksi
    db.sqlite.exec(`
      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi)
      VALUES (101, 1, 'DRAFT-TEMP', 'token_guru_123', 'Konsep baru', 'Tantangan kelas', 'Aksi nyata');
    `);

    // A. Ketua KKG tanda tangan
    const signKetuaRes = await app.request('/api/sertifikat/kegiatan/101/sign-ketua', {
      method: 'POST',
      headers: {
        'x-session-id': 'sess_ketua',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ttd_nama: 'Drs. H. Ujang Permana, M.Pd',
        ttd_nip: '197505122002121003'
      })
    }, { DB: db });

    expect(signKetuaRes.status).toBe(200);

    // B. Pengawas Pembina sahkan
    const signPengawasRes = await app.request('/api/sertifikat/kegiatan/101/sign-pengawas', {
      method: 'POST',
      headers: {
        'x-session-id': 'sess_pengawas',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ttd_nama: 'Hj. Nenden Rohaeti, M.M.Pd',
        ttd_nip: '196803121992032001'
      })
    }, { DB: db });

    expect(signPengawasRes.status).toBe(200);
    const signPengawasBody = await signPengawasRes.json();
    expect(signPengawasBody.data.sertifikat_issued).toBeGreaterThanOrEqual(1);

    // C. Cek status sertifikat guru sekarang sudah aktif dan bernomor resmi
    const certRow: any = db.sqlite.prepare(`
      SELECT nomor_sertifikat, token_hash FROM sertifikat_presensi WHERE kegiatan_id = 101 AND user_id = 1
    `).get();

    expect(certRow.nomor_sertifikat).toMatch(/^421\.2\/\d{3}\/KKG-G3\.WNY\/X\/2026$/);
  });

  it('5. Portofolio "Sertifikat Saya" mengembalikan sertifikat resmi guru', async () => {
    // Setup kegiatan selesai bertanda tangan ganda
    db.sqlite.exec(`
      UPDATE kegiatan
      SET ttd_ketua_nama = 'Drs. H. Ujang Permana, M.Pd',
          ttd_ketua_nip = '197505122002121003',
          ttd_ketua_at = '2026-10-15 13:00:00',
          ttd_pengawas_nama = 'Hj. Nenden Rohaeti, M.M.Pd',
          ttd_pengawas_nip = '196803121992032001',
          ttd_pengawas_at = '2026-10-15 14:00:00'
      WHERE id = 101;

      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, refleksi_konsep, status)
      VALUES (101, 1, '421.2/001/KKG-G3.WNY/X/2026', 'token_valid_hash', 'Refleksi sukses', 'terbit');
    `);

    const res = await app.request('/api/sertifikat/saya', {
      method: 'GET',
      headers: { 'x-session-id': 'sess_guru' }
    }, { DB: db });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].nomor_sertifikat).toBe('421.2/001/KKG-G3.WNY/X/2026');
    expect(body.data[0].ttd_ketua_nama).toBe('Drs. H. Ujang Permana, M.Pd');
    expect(body.data[0].ttd_pengawas_nama).toBe('Hj. Nenden Rohaeti, M.M.Pd');
  });

  it('6. Detail Dokumen Sertifikat 2 Halaman & Mesin Verifikasi Publik', async () => {
    db.sqlite.exec(`
      UPDATE kegiatan
      SET ttd_ketua_nama = 'Drs. H. Ujang Permana, M.Pd',
          ttd_ketua_at = '2026-10-15 13:00:00',
          ttd_pengawas_nama = 'Hj. Nenden Rohaeti, M.M.Pd',
          ttd_pengawas_at = '2026-10-15 14:00:00'
      WHERE id = 101;

      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, status)
      VALUES (101, 1, '421.2/001/KKG-G3.WNY/X/2026', 'token_verif_999', 'terbit');
    `);

    // A. Endpoint Detail Sertifikat (halaman 1 + lampiran halaman 2 materi_list)
    const detailRes = await app.request('/api/sertifikat/detail/token_verif_999', {
      method: 'GET'
    }, { DB: db });

    expect(detailRes.status).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.data.is_valid).toBe(true);
    expect(detailBody.data.nama_guru).toBe('Budi Santoso, S.Pd');
    expect(detailBody.data.materi_list).toBeInstanceOf(Array);
    expect(detailBody.data.materi_list.length).toBeGreaterThan(0);

    // B. Endpoint Verifikasi Publik Anti-Pemalsuan
    const verifyRes = await app.request('/api/sertifikat/verify/token_verif_999', {
      method: 'GET'
    }, { DB: db });

    expect(verifyRes.status).toBe(200);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.data.valid).toBe(true);
    expect(verifyBody.data.sertifikat.nomor_sertifikat).toBe('421.2/001/KKG-G3.WNY/X/2026');
    expect(verifyBody.data.sertifikat.disahkan_oleh.pengawas_pembina.nama).toBe('Hj. Nenden Rohaeti, M.M.Pd');
    expect(verifyBody.data.sertifikat.disahkan_oleh.ketua_kkg.nama).toBe('Drs. H. Ujang Permana, M.Pd');

    // C. Verifikasi token invalid
    const invalidRes = await app.request('/api/sertifikat/verify/token_palsu_random', {
      method: 'GET'
    }, { DB: db });
    const invalidBody = await invalidRes.json();
    expect(invalidBody.data.valid).toBe(false);
  });
});
