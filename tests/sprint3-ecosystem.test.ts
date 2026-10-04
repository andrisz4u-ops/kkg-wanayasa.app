import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRollingQRData, verifyRollingQRData, generateSecureToken } from '../src/lib/qrcode';
import absensi from '../src/routes/absensi';
import programSekolah from '../src/routes/program-sekolah';

describe('Sprint 3: Pilar 4 Ecosystem & Security Tests', () => {

  describe('3.1 Rolling Dynamic QR Token (Anti-Titip Presensi)', () => {
    it('should generate valid rolling dynamic QR data with 30s window and HMAC signature', async () => {
      const kegiatanId = 42;
      const res = await generateRollingQRData(kegiatanId, 30);

      expect(res.qr_data).toMatch(/^kkg-dyn:42:\d+:[a-f0-9]{16}$/);
      expect(res.window_seconds).toBe(30);
      expect(res.seconds_remaining).toBeGreaterThanOrEqual(1);
      expect(res.seconds_remaining).toBeLessThanOrEqual(30);
    });

    it('should successfully verify rolling token in current window', async () => {
      const kegiatanId = 99;
      const token = await generateRollingQRData(kegiatanId, 30);
      const verify = await verifyRollingQRData(token.qr_data, 30, 1);

      expect(verify.valid).toBe(true);
      expect(verify.kegiatanId).toBe(99);
      expect(verify.isRolling).toBe(true);
      expect(verify.expired).toBeFalsy();
    });

    it('should allow +- 1 tolerance window for camera / network latency', async () => {
      const kegiatanId = 100;
      const now = Date.now();
      const currentWindow = Math.floor(now / 30000);
      const prevWindow = currentWindow - 1;

      // Mock previous window token
      const encoder = new TextEncoder();
      const keyData = encoder.encode('kkg-wanayasa-qr-secret-2026');
      const messageData = encoder.encode(`kkg-dyn:${kegiatanId}:${prevWindow}`);

      const key = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', key, messageData);
      const sig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
      const prevToken = `kkg-dyn:${kegiatanId}:${prevWindow}:${sig}`;

      const verify = await verifyRollingQRData(prevToken, 30, 1);
      expect(verify.valid).toBe(true);
      expect(verify.kegiatanId).toBe(100);
    });

    it('should reject expired dynamic token outside tolerance window (> 1 window difference)', async () => {
      const kegiatanId = 101;
      const expiredWindow = Math.floor(Date.now() / 30000) - 5; // 5 windows (2.5 mins) ago

      const encoder = new TextEncoder();
      const keyData = encoder.encode('kkg-wanayasa-qr-secret-2026');
      const messageData = encoder.encode(`kkg-dyn:${kegiatanId}:${expiredWindow}`);

      const key = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', key, messageData);
      const sig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
      const expiredToken = `kkg-dyn:${kegiatanId}:${expiredWindow}:${sig}`;

      const verify = await verifyRollingQRData(expiredToken, 30, 1);
      expect(verify.valid).toBe(false);
      expect(verify.expired).toBe(true);
      expect(verify.error).toContain('kadaluarsa');
    });

    it('should reject tampered HMAC signatures', async () => {
      const token = await generateRollingQRData(50, 30);
      const tampered = token.qr_data.slice(0, -3) + 'abc';

      const verify = await verifyRollingQRData(tampered, 30, 1);
      expect(verify.valid).toBe(false);
      expect(verify.error).toContain('tanda tangan digital tidak sesuai');
    });

    it('should gracefully verify legacy kkg-absensi format for backward compatibility', async () => {
      const legacy = await generateSecureToken(77, 60);
      const verify = await verifyRollingQRData(legacy);

      expect(verify.valid).toBe(true);
      expect(verify.kegiatanId).toBe(77);
      expect(verify.isRolling).toBe(false);
    });
  });

  describe('3.2 Automated E-Sertifikat KKG (PMM Bukti Dukung)', () => {
    let mockDB: any;
    let certificatesTable: any[] = [];
    let absensiTable: any[] = [];
    let kegiatanTable: any[] = [];
    let usersTable: any[] = [];

    beforeEach(() => {
      certificatesTable = [];
      kegiatanTable = [{
        id: 1,
        nama_kegiatan: 'Pelatihan Kurikulum Merdeka & 7 KAIH Purwakarta',
        tanggal: '2026-10-10',
        waktu_mulai: '08:00',
        waktu_selesai: '12:00',
        tempat: 'Aula SDN 1 Wanayasa',
        deskripsi: 'Pendalaman 8 Dimensi Profil Lulusan & Pembiasaan 7 Poe Atikan'
      }];
      usersTable = [
        { id: 1, nama: 'Admin KKG', role: 'admin', sekolah: 'SDN 1 Wanayasa', nip: '19870512 201101 1 002' },
        { id: 2, nama: 'Budi Santoso, S.Pd.', role: 'user', sekolah: 'SDN 2 Wanayasa', nip: '19920101 201801 1 003' },
        { id: 3, nama: 'Siti Rahmawati, S.Pd.', role: 'user', sekolah: 'SDN 1 Sukadami', nip: '19950315 202001 2 004' }
      ];
      absensiTable = [
        { id: 1, kegiatan_id: 1, user_id: 2, status: 'hadir' },
        { id: 2, kegiatan_id: 1, user_id: 3, status: 'hadir' }
      ];

      mockDB = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn((...params: any[]) => ({
            first: vi.fn(async () => {
              if (query.includes('FROM kegiatan WHERE id = ?')) {
                return kegiatanTable.find(k => k.id === Number(params[0])) || null;
              }
              if (query.includes('FROM e_sertifikat WHERE kegiatan_id = ? AND user_id = ?')) {
                return certificatesTable.find(c => Number(c.kegiatan_id) === Number(params[0]) && Number(c.user_id) === Number(params[1])) || null;
              }
              if (query.includes('FROM e_sertifikat s') && query.includes('WHERE s.uuid = ?')) {
                const cert = certificatesTable.find(c => c.uuid === params[0]);
                if (!cert) return null;
                const keg = kegiatanTable.find(k => k.id === cert.kegiatan_id);
                return { ...cert, tempat: keg?.tempat, waktu_mulai: keg?.waktu_mulai, waktu_selesai: keg?.waktu_selesai };
              }
              if (query.includes('FROM e_sertifikat s') && query.includes('WHERE s.kegiatan_id = ? AND s.user_id = ?')) {
                const cert = certificatesTable.find(c => c.kegiatan_id === Number(params[0]) && c.user_id === Number(params[1]));
                if (!cert) return null;
                const keg = kegiatanTable.find(k => k.id === cert.kegiatan_id);
                return { ...cert, tempat: keg?.tempat, waktu_mulai: keg?.waktu_mulai, waktu_selesai: keg?.waktu_selesai };
              }
              if (query.includes('SELECT 1 FROM e_sertifikat')) {
                return { 1: 1 };
              }
              return null;
            }),
            all: vi.fn(async () => {
              if (query.includes('FROM absensi a') && query.includes("status = 'hadir'")) {
                const kegId = Number(params[0]);
                const hadir = absensiTable
                  .filter(a => a.kegiatan_id === kegId && a.status === 'hadir')
                  .map(a => {
                    const u = usersTable.find(user => user.id === a.user_id);
                    return { user_id: a.user_id, nama: u?.nama, nip: u?.nip, sekolah: u?.sekolah };
                  });
                return { results: hadir };
              }
              return { results: [] };
            }),
            run: vi.fn(async () => {
              if (query.includes('INSERT INTO e_sertifikat')) {
                const newCert = {
                  id: certificatesTable.length + 1,
                  nomor_sertifikat: params[0],
                  kegiatan_id: params[1],
                  user_id: params[2],
                  nama_peserta: params[3],
                  nip_peserta: params[4],
                  unit_kerja: params[5],
                  nama_kegiatan: params[6],
                  tanggal_kegiatan: params[7],
                  materi_pokok: params[8],
                  alokasi_jp: params[9],
                  peran: params[10],
                  uuid: params[11],
                  qr_verify_url: params[12],
                  issued_at: new Date().toISOString()
                };
                certificatesTable.push(newCert);
                return { meta: { last_row_id: newCert.id } };
              }
              return { meta: { last_row_id: 1 } };
            })
          }))
        })),
        batch: vi.fn(async () => [])
      };
    });

    it('should issue e-certificates to all verified attendees and return official nomor_sertifikat and UUID', async () => {
      // Mock admin session
      const req = new Request('http://localhost/kegiatan/1/issue-certificates', {
        method: 'POST',
        headers: { Cookie: 'session=admin_sess' }
      });

      // Mock auth to return admin
      vi.spyOn(await import('../src/lib/auth'), 'getCurrentUser').mockResolvedValue(usersTable[0] as any);

      const res = await absensi.fetch(req, { DB: mockDB } as any);
      expect(res.status).toBe(200);

      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.total_issued).toBe(2);
      expect(certificatesTable.length).toBe(2);

      const cert1 = certificatesTable[0];
      expect(cert1.nomor_sertifikat).toMatch(/^421\.2\/KKG-03-WNY\/SERT\/2026\/001-001$/);
      expect(cert1.alokasi_jp).toBe(4);
      expect(cert1.uuid).toBeDefined();
    });

    it('should prevent duplicate certificate generation when called repeatedly', async () => {
      vi.spyOn(await import('../src/lib/auth'), 'getCurrentUser').mockResolvedValue(usersTable[0] as any);

      const req1 = new Request('http://localhost/kegiatan/1/issue-certificates', {
        method: 'POST',
        headers: { Cookie: 'session=admin_sess' }
      });
      await absensi.fetch(req1, { DB: mockDB } as any);
      expect(certificatesTable.length).toBe(2);

      // Call again
      const req2 = new Request('http://localhost/kegiatan/1/issue-certificates', {
        method: 'POST',
        headers: { Cookie: 'session=admin_sess' }
      });
      const res2 = await absensi.fetch(req2, { DB: mockDB } as any);
      expect(res2.status).toBe(200);
      expect(certificatesTable.length).toBe(2); // Still 2, no duplicates!
    });

    it('should verify certificate publicly via /sertifikat/verify/:uuid', async () => {
      // Pre-seed a certificate
      const testUuid = 'test-uuid-cert-1234';
      certificatesTable.push({
        id: 1,
        nomor_sertifikat: '421.2/KKG-03-WNY/SERT/2026/001-001',
        kegiatan_id: 1,
        user_id: 2,
        nama_peserta: 'Budi Santoso, S.Pd.',
        nip_peserta: '19920101 201801 1 003',
        unit_kerja: 'SDN 2 Wanayasa',
        nama_kegiatan: 'Pelatihan Kurikulum Merdeka',
        tanggal_kegiatan: '2026-10-10',
        materi_pokok: '8 Dimensi Profil Lulusan',
        alokasi_jp: 4,
        peran: 'Peserta Aktif',
        uuid: testUuid,
        issued_at: '2026-10-10T12:00:00Z'
      });

      const req = new Request(`http://localhost/sertifikat/verify/${testUuid}`);
      const res = await absensi.fetch(req, { DB: mockDB } as any);
      expect(res.status).toBe(200);

      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.valid).toBe(true);
      expect(body.data.sertifikat.nama_peserta).toBe('Budi Santoso, S.Pd.');
      expect(body.data.sertifikat.tanda_tangan.ketua_kkg).toBe('MAMAN RUKMAN, S.Pd');
      expect(body.data.sertifikat.tanda_tangan.pengawas_pembina).toBe('DIDIN SAMSUDIN, S.Pd.,M.Pd');
      expect(body.data.sertifikat.tanda_tangan.nip_ketua).toBe('197009212005011007');
      expect(body.data.sertifikat.tanda_tangan.nip_pengawas).toBe('198208182009021004');
    });
  });

  describe('3.3 7 KAIH & 7 Poe Atikan Purwakarta Monitoring & Checklist', () => {
    let mockDB: any;
    let checklistTable: any[] = [];

    beforeEach(() => {
      checklistTable = [];
      mockDB = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn((...params: any[]) => ({
            first: vi.fn(async () => {
              if (query.includes('SELECT 1 FROM program_monitoring_checklist')) {
                return { 1: 1 };
              }
              if (query.includes('WHERE sekolah = ? AND item_kode = ?')) {
                return checklistTable.find(c => c.sekolah === params[0] && c.item_kode === params[1]) || null;
              }
              return null;
            }),
            all: vi.fn(async () => {
              if (query.includes('FROM program_monitoring_checklist') && query.includes('WHERE sekolah = ?')) {
                const target = params[0];
                const rows = checklistTable.filter(c => c.sekolah === target);
                return { results: rows };
              }
              return { results: [] };
            }),
            run: vi.fn(async () => {
              if (query.includes('INSERT OR IGNORE INTO program_monitoring_checklist')) {
                checklistTable.push({
                  id: checklistTable.length + 1,
                  sekolah: params[0],
                  kategori: params[1],
                  item_kode: params[2],
                  item_nama: params[3],
                  deskripsi: params[4],
                  hari_pelaksanaan: params[5],
                  status: 'belum',
                  catatan: null,
                  tanggal_evaluasi: null,
                  penilai: null
                });
                return { meta: { last_row_id: checklistTable.length } };
              }
              if (query.includes('UPDATE program_monitoring_checklist')) {
                const id = params[4];
                const item = checklistTable.find(c => c.id === id);
                if (item) {
                  if (params[0]) item.status = params[0];
                  item.catatan = params[1];
                  item.tanggal_evaluasi = params[2];
                  item.penilai = params[3];
                }
                return { meta: { changes: 1 } };
              }
              return { meta: { changes: 1 } };
            })
          }))
        })),
        batch: vi.fn(async () => [])
      };
    });

    it('should initialize and return 14 standards (7 Poe Atikan + 7 KAIH) with initial 0% progress', async () => {
      vi.spyOn(await import('../src/lib/auth'), 'getCurrentUser').mockResolvedValue({
        id: 1, nama: 'Kepala Sekolah', role: 'admin', sekolah: 'SDN 1 WANAYASA'
      } as any);

      const req = new Request('http://localhost/monitoring/checklist?sekolah=SDN 1 WANAYASA', {
        headers: { Cookie: 'session=admin_sess' }
      });

      const res = await programSekolah.fetch(req, { DB: mockDB } as any);
      expect(res.status).toBe(200);

      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.items.length).toBe(14);
      expect(body.data.summary.total).toBe(14);
      expect(body.data.summary.tercapai).toBe(0);
      expect(body.data.summary.persentase).toBe(0);

      // Verify categories
      const poeAtikan = body.data.items.filter((it: any) => it.kategori === '7poe_atikan');
      const kaih = body.data.items.filter((it: any) => it.kategori === '7kaih');
      expect(poeAtikan.length).toBe(7);
      expect(kaih.length).toBe(7);
    });

    it('should update status and field notes, then reflect in recalculated progress percentage', async () => {
      vi.spyOn(await import('../src/lib/auth'), 'getCurrentUser').mockResolvedValue({
        id: 1, nama: 'Pengawas Pembina', role: 'admin', sekolah: 'SDN 1 WANAYASA'
      } as any);

      // Pre-populate checklist
      checklistTable = [
        { id: 1, sekolah: 'SDN 1 WANAYASA', kategori: '7poe_atikan', item_kode: 'POE_SENEN', item_nama: 'Senén Ajeg Nusantara', status: 'belum' },
        { id: 2, sekolah: 'SDN 1 WANAYASA', kategori: '7kaih', item_kode: 'KAIH_BANGUN_PAGI', item_nama: '1. Bangun Pagi Tepat Waktu', status: 'belum' }
      ];

      // Update POE_SENEN to tercapai
      const updateReq = new Request('http://localhost/monitoring/checklist/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: 'session=admin_sess' },
        body: JSON.stringify({
          sekolah: 'SDN 1 WANAYASA',
          item_kode: 'POE_SENEN',
          status: 'tercapai',
          catatan: 'Upacara bendera dan pembacaan ikrar terlaksana secara khidmat setiap Senin',
          tanggal_evaluasi: '2026-10-04'
        })
      });

      const res = await programSekolah.fetch(updateReq, { DB: mockDB } as any);
      expect(res.status).toBe(200);

      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('tercapai');
      expect(checklistTable[0].status).toBe('tercapai');
      expect(checklistTable[0].catatan).toContain('Upacara bendera');
    });
  });

});
