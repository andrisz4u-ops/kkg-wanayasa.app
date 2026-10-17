import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';
import sertifikatRoutes from '../src/routes/sertifikat';
import { readFileSync } from 'node:fs';
import { issueCertificate } from '../src/lib/certificate-issuance';
import { arrayField, booleanField, numberField, recordField, readApiRecord, stringField } from './helpers/typed-api-response';

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
        tenant_id TEXT DEFAULT 'kkg-gugus-3-wanayasa',
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
        created_by INTEGER
      );

      CREATE TABLE absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kegiatan_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'hadir',
        waktu_checkin DATETIME DEFAULT CURRENT_TIMESTAMP,
        keterangan TEXT
      );

    `);
    db.sqlite.exec(readFileSync('migrations/0030_sertifikat_presensi_kkg.sql', 'utf8'));
    db.sqlite.exec(readFileSync('migrations/0034_atomic_certificate_issuance.sql', 'utf8'));

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
    const body = await readApiRecord(res);
    expect(body.success).toBe(true);
    const data = recordField(body, 'data');
    expect(booleanField(data, 'has_attended')).toBe(false);
    expect(booleanField(data, 'is_fully_signed')).toBe(false);
    expect(booleanField(data, 'can_download')).toBe(false);
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
    const body = await readApiRecord(res);
    expect(stringField(recordField(body, 'error'), 'message')).toContain('HADIR');
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
    const body = await readApiRecord(res);
    expect(body.success).toBe(true);
    expect(recordField(body, 'data').token_hash).toBeDefined();

    // Cek di status
    const statusRes = await app.request('/api/sertifikat/kegiatan/101/status', {
      method: 'GET',
      headers: { 'x-session-id': 'sess_guru' }
    }, { DB: db });

    const statusBody = await readApiRecord(statusRes);
    const statusData = recordField(statusBody, 'data');
    expect(booleanField(statusData, 'has_attended')).toBe(true);
    expect(booleanField(statusData, 'has_reflection')).toBe(true);
    expect(booleanField(statusData, 'is_fully_signed')).toBe(false); // Masih menunggu TTD pengawas & ketua
  });

  it('serializes concurrent first reflection requests through the route without a UNIQUE race', async () => {
    db.sqlite.exec(`INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');`);
    const submit = (konsep: string) => app.request('/api/sertifikat/refleksi', {
      method: 'POST',
      headers: { 'x-session-id': 'sess_guru', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kegiatan_id: 101,
        refleksi_konsep: konsep,
        refleksi_tantangan: 'Tantangan serentak',
        refleksi_rencana_aksi: 'Rencana serentak'
      })
    }, { DB: db });

    // Starting both requests before either resolves interleaves their initial
    // reads; both therefore exercise the formerly-racy absent-row insert.
    const [first, second] = await Promise.all([submit('Konsep pertama'), submit('Konsep kedua')]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const [firstBody, secondBody] = await Promise.all([readApiRecord(first), readApiRecord(second)]);
    const stored: any = db.sqlite.prepare(`
      SELECT nomor_sertifikat, token_hash, status FROM sertifikat_presensi WHERE kegiatan_id = 101 AND user_id = 1
    `).get();
    expect(stored).toBeDefined();
    expect(stored.nomor_sertifikat).toMatch(/^DRAFT-/);
    expect(stored.nomor_sertifikat).toHaveLength('DRAFT-'.length + 32);
    expect(stored.status).toBe('draft');
    expect(recordField(firstBody, 'data').token_hash).toBe(stored.token_hash);
    expect(recordField(secondBody, 'data').token_hash).toBe(stored.token_hash);
  });

  it('reports readiness from persisted eligibility when signatures arrive after the initial snapshot', async () => {
    db.sqlite.exec(`INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');`);
    const interleavedDb = {
      prepare(sql: string) {
        const statement = db.prepare(sql);
        let bound: any = statement;
        const wrapper: any = {
          bind(...values: any[]) { bound = statement.bind(...values); return wrapper; },
          first(...args: any[]) { return bound.first(...args); },
          all(...args: any[]) { return bound.all(...args); },
          execute(...args: any[]) { return bound.execute(...args); },
          async run() {
            const result = await bound.run();
            if (/INSERT INTO sertifikat_presensi/i.test(sql)) {
              db.sqlite.prepare(`UPDATE kegiatan SET ttd_ketua_at = '2026-10-15', ttd_pengawas_at = '2026-10-15' WHERE id = 101`).run();
            }
            return result;
          }
        };
        return wrapper;
      },
      batch: db.batch.bind(db)
    };

    const response = await app.request('/api/sertifikat/refleksi', {
      method: 'POST',
      headers: { 'x-session-id': 'sess_guru', 'Content-Type': 'application/json' },
      body: JSON.stringify({ kegiatan_id: 101, refleksi_konsep: 'Konsep', refleksi_tantangan: 'Tantangan', refleksi_rencana_aksi: 'Rencana' })
    }, { DB: interleavedDb });

    expect(response.status).toBe(200);
    expect(booleanField(recordField(await readApiRecord(response), 'data'), 'is_ready')).toBe(true);
  });

  it('does not report an existing numbered certificate ready after attendance changes between write and issue', async () => {
    db.sqlite.exec(`
      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
      UPDATE kegiatan SET ttd_ketua_at = '2026-10-15', ttd_pengawas_at = '2026-10-15' WHERE id = 101;
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash,
        refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status)
        VALUES (101, 1, '421.2/007/KKG-G3.WNY/X/2026', 'preserved-token', 'Old concept', 'Old challenge', 'Old action', 'terbit');
    `);
    const interleavedDb = {
      prepare(sql: string) {
        const statement = db.prepare(sql);
        let bound: any = statement;
        const wrapper: any = {
          bind(...values: any[]) { bound = statement.bind(...values); return wrapper; },
          first(...args: any[]) { return bound.first(...args); },
          all(...args: any[]) { return bound.all(...args); },
          execute(...args: any[]) { return bound.execute(...args); },
          async run() {
            const result = await bound.run();
            if (/INSERT INTO sertifikat_presensi/i.test(sql)) {
              db.sqlite.prepare(`UPDATE absensi SET status = 'izin' WHERE kegiatan_id = 101 AND user_id = 1`).run();
            }
            return result;
          }
        };
        return wrapper;
      },
      batch: db.batch.bind(db)
    };

    const response = await app.request('/api/sertifikat/refleksi', {
      method: 'POST',
      headers: { 'x-session-id': 'sess_guru', 'Content-Type': 'application/json' },
      body: JSON.stringify({ kegiatan_id: 101, refleksi_konsep: 'New concept', refleksi_tantangan: 'New challenge', refleksi_rencana_aksi: 'New action' })
    }, { DB: interleavedDb });

    expect(response.status).toBe(200);
    expect(booleanField(recordField(await readApiRecord(response), 'data'), 'is_ready')).toBe(false);
    const stored: any = db.sqlite.prepare(`SELECT nomor_sertifikat, token_hash FROM sertifikat_presensi WHERE kegiatan_id = 101 AND user_id = 1`).get();
    expect(stored.nomor_sertifikat).toBe('421.2/007/KKG-G3.WNY/X/2026');
    expect(stored.token_hash).toBe('preserved-token');
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
    const signPengawasBody = await readApiRecord(signPengawasRes);
    expect(numberField(recordField(signPengawasBody, 'data'), 'sertifikat_issued')).toBeGreaterThanOrEqual(1);

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
       INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status)
       VALUES (101, 1, '421.2/001/KKG-G3.WNY/X/2026', 'token_valid_hash', 'Refleksi sukses', 'Tantangan', 'Rencana', 'terbit');
    `);

    const res = await app.request('/api/sertifikat/saya', {
      method: 'GET',
      headers: { 'x-session-id': 'sess_guru' }
    }, { DB: db });

    expect(res.status).toBe(200);
    const body = await readApiRecord(res);
    expect(body.success).toBe(true);
    const certificates = arrayField(body, 'data').map(certificate =>
      recordField({ certificate }, 'certificate')
    );
    expect(certificates.length).toBe(1);
    expect(stringField(certificates[0], 'nomor_sertifikat')).toBe('421.2/001/KKG-G3.WNY/X/2026');
    expect(stringField(certificates[0], 'ttd_ketua_nama')).toBe('Drs. H. Ujang Permana, M.Pd');
    expect(stringField(certificates[0], 'ttd_pengawas_nama')).toBe('Hj. Nenden Rohaeti, M.M.Pd');
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
       UPDATE sertifikat_presensi SET refleksi_konsep = 'Konsep', refleksi_tantangan = 'Tantangan', refleksi_rencana_aksi = 'Rencana' WHERE token_hash = 'token_verif_999';
       INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
    `);

    // A. Endpoint Detail Sertifikat (halaman 1 + lampiran halaman 2 materi_list)
    const detailRes = await app.request('/api/sertifikat/detail/token_verif_999', {
      method: 'GET'
    }, { DB: db });

    expect(detailRes.status).toBe(200);
    const detailBody = await readApiRecord(detailRes);
    const detailData = recordField(detailBody, 'data');
    expect(booleanField(detailData, 'is_valid')).toBe(true);
    expect(stringField(detailData, 'nama_guru')).toBe('Budi Santoso, S.Pd');
    expect(arrayField(detailData, 'materi_list')).toBeInstanceOf(Array);
    expect(arrayField(detailData, 'materi_list').length).toBeGreaterThan(0);

    // B. Endpoint Verifikasi Publik Anti-Pemalsuan
    const verifyRes = await app.request('/api/sertifikat/verify/token_verif_999', {
      method: 'GET'
    }, { DB: db });

    expect(verifyRes.status).toBe(200);
    const verifyBody = await readApiRecord(verifyRes);
    const verifyData = recordField(verifyBody, 'data');
    expect(booleanField(verifyData, 'valid')).toBe(true);
    const certificate = recordField(verifyData, 'sertifikat');
    expect(stringField(certificate, 'nomor_sertifikat')).toBe('421.2/001/KKG-G3.WNY/X/2026');
    const approvedBy = recordField(certificate, 'disahkan_oleh');
    expect(stringField(recordField(approvedBy, 'pengawas_pembina'), 'nama')).toBe('Hj. Nenden Rohaeti, M.M.Pd');
    expect(stringField(recordField(approvedBy, 'ketua_kkg'), 'nama')).toBe('Drs. H. Ujang Permana, M.Pd');

    // C. Verifikasi token invalid
    const invalidRes = await app.request('/api/sertifikat/verify/token_palsu_random', {
      method: 'GET'
    }, { DB: db });
    const invalidBody = await readApiRecord(invalidRes);
    expect(booleanField(recordField(invalidBody, 'data'), 'valid')).toBe(false);
  });

  it('7. Idempotent issuance, historical high-water seed (including revoked), and cross-activity sequence', async () => {
    db.sqlite.exec(`
      UPDATE kegiatan SET ttd_ketua_at = '2026-10-15', ttd_pengawas_at = '2026-10-15' WHERE id = 101;
      INSERT INTO kegiatan (id, nama_kegiatan, tanggal, nomor_surat_prefix, ttd_ketua_at, ttd_pengawas_at)
        VALUES (102, 'Kegiatan kedua', '2026-10-15', '421.2', '2026-10-15', '2026-10-15');
      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir'), (102, 1, 'hadir');
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status)
        VALUES (101, 1, 'DRAFT-ISSUE', 'token_issue', 'Konsep', 'Tantangan', 'Rencana', 'draft'),
               (102, 1, 'DRAFT-ISSUE2', 'token_issue2', 'Konsep', 'Tantangan', 'Rencana', 'draft'),
               (101, 2, '421.2/008/KKG-G3.WNY/X/2026', 'revoked-token', 'a', 'b', 'c', 'revoked');
    `);
    const first = await issueCertificate(db as any, 101, 1);
    const retry = await issueCertificate(db as any, 101, 1);
    const secondEvent = await issueCertificate(db as any, 102, 1);
    expect(first.issued).toBe(true);
    expect(retry.issued).toBe(false);
    expect(first.certificate.nomor_sertifikat).toBe('421.2/009/KKG-G3.WNY/X/2026');
    expect(secondEvent.certificate.nomor_sertifikat).toBe('421.2/010/KKG-G3.WNY/X/2026');
    expect(db.sqlite.prepare(`SELECT next_number FROM certificate_issuance_counter WHERE singleton_id = 1`).get()?.next_number).toBe(10);
  });

  it('8. Requires all nonblank reflections, both persisted signatures, and refuses revoked rows', async () => {
    db.sqlite.exec(`
      UPDATE kegiatan SET ttd_ketua_at = '2026-10-15', ttd_pengawas_at = '2026-10-15' WHERE id = 101;
      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status)
        VALUES (101, 1, 'DRAFT-WHITE', 'white-token', 'Concept', '   ', 'Action', 'draft');
    `);
    expect((await issueCertificate(db as any, 101, 1)).issued).toBe(false);
    db.sqlite.prepare(`UPDATE sertifikat_presensi SET refleksi_tantangan = 'Challenge', status = 'revoked' WHERE user_id = 1`).run();
    expect((await issueCertificate(db as any, 101, 1)).issued).toBe(false);
    expect(db.sqlite.prepare(`SELECT next_number FROM certificate_issuance_counter`).get()?.next_number).toBe(0);
  });

  it('9. Rejects invalid dates, reports missing counter configuration, and rolls back failed allocation batches', async () => {
    db.sqlite.exec(`
      UPDATE kegiatan SET tanggal = '2026-02-30', ttd_ketua_at = '2026-10-15', ttd_pengawas_at = '2026-10-15' WHERE id = 101;
      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status)
        VALUES (101, 1, 'DRAFT-BADDATE', 'bad-date-token', 'Concept', 'Challenge', 'Action', 'draft');
    `);
    expect((await issueCertificate(db as any, 101, 1)).issued).toBe(false);
    expect(db.sqlite.prepare(`SELECT next_number FROM certificate_issuance_counter`).get()?.next_number).toBe(0);

    await expect(db.batch([
      db.prepare(`UPDATE certificate_issuance_counter SET next_number = next_number + 1 WHERE singleton_id = 1`),
      db.prepare(`INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash) VALUES (101, 2, 'DRAFT-BADDATE', 'duplicate-number')`)
    ])).rejects.toThrow();
    expect(db.sqlite.prepare(`SELECT next_number FROM certificate_issuance_counter`).get()?.next_number).toBe(0);

    db.sqlite.prepare(`DELETE FROM certificate_issuance_counter WHERE singleton_id = 1`).run();
    await expect(issueCertificate(db as any, 101, 1)).rejects.toThrow(/apply migration 0034/);
  });

  it('seeds the legacy high-water mark in migration before cascades delete historical rows', async () => {
    db.sqlite.exec(`
      PRAGMA foreign_keys = ON;
      UPDATE kegiatan SET ttd_ketua_at = '2026-10-15', ttd_pengawas_at = '2026-10-15' WHERE id = 101;
      INSERT INTO kegiatan (id, nama_kegiatan, tanggal, nomor_surat_prefix, ttd_ketua_at, ttd_pengawas_at)
        VALUES (102, 'Kegiatan legacy', '2026-10-15', '421.2', '2026-10-15', '2026-10-15');
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash, status)
        VALUES (102, 2, '421.2/008/KKG-G3.WNY/X/2026', 'historical-revoked', 'revoked');
      INSERT INTO absensi (kegiatan_id, user_id, status) VALUES (101, 1, 'hadir');
      INSERT INTO sertifikat_presensi (kegiatan_id, user_id, nomor_sertifikat, token_hash,
        refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status)
        VALUES (101, 1, 'DRAFT-LEGACY-SEED', 'new-issue-token', 'Concept', 'Challenge', 'Action', 'draft');
      DELETE FROM certificate_issuance_counter WHERE singleton_id = 1;
    `);
    db.sqlite.exec(readFileSync('migrations/0034_atomic_certificate_issuance.sql', 'utf8'));
    expect(db.sqlite.prepare(`SELECT next_number FROM certificate_issuance_counter WHERE singleton_id = 1`).get()?.next_number).toBe(8);

    db.sqlite.exec(`DELETE FROM users WHERE id = 2; DELETE FROM kegiatan WHERE id = 102;`);
    expect(db.sqlite.prepare(`SELECT COUNT(*) AS count FROM sertifikat_presensi WHERE token_hash = 'historical-revoked'`).get()?.count).toBe(0);
    const issued = await issueCertificate(db as any, 101, 1);
    expect(issued.issued).toBe(true);
    expect(issued.certificate.nomor_sertifikat).toBe('421.2/009/KKG-G3.WNY/X/2026');
  });
});
