import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import { requireSession } from '../lib/session-middleware';
import { hasPermission, PERMISSIONS } from '../lib/permissions';

type Bindings = { DB: D1Database };

const sertifikat = new Hono<{ Bindings: Bindings; Variables: { user: any } }>();

// Helper Romawi bulan
function toRomanMonth(dateStr: string): string {
  const d = new Date(dateStr);
  const month = isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[month] || 'I';
}

function getYear(dateStr: string): string {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? String(new Date().getFullYear()) : String(d.getFullYear());
}

function generateRandomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getDefaultSigners(db: D1Database) {
  try {
    const keys = ['nama_ketua', 'nip_ketua', 'pengawas_nama', 'pengawas_nip', 'pengawas_instansi'];
    const placeholders = keys.map(() => '?').join(',');
    const rows = await db.prepare(
      `SELECT key, value FROM settings WHERE key IN (${placeholders})`
    ).bind(...keys).all();

    const map: Record<string, string> = {};
    rows.results?.forEach((r: any) => { map[r.key] = r.value; });

    return {
      ketua: {
        nama: map.nama_ketua || 'Ketua KKG Gugus 3',
        nip: map.nip_ketua || ''
      },
      pengawas: {
        nama: map.pengawas_nama || 'Pengawas Pembina SD',
        nip: map.pengawas_nip || '',
        instansi: map.pengawas_instansi || 'Pengawas SD Pembina Gugus 3 Wanayasa'
      }
    };
  } catch (_) {
    return {
      ketua: { nama: 'Ketua KKG Gugus 3', nip: '' },
      pengawas: { nama: 'Pengawas Pembina SD', nip: '', instansi: 'Pengawas SD Pembina' }
    };
  }
}

// -------------------------------------------------------------
// 1. Ambil status presensi & sertifikat user pada kegiatan
// -------------------------------------------------------------
sertifikat.get('/kegiatan/:id/status', requireSession, async (c) => {
  try {
    const user = c.get('user');
    const kegiatanId = c.req.param('id');

    const kegiatan: any = await c.env.DB.prepare(`
      SELECT id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi,
             alokasi_jp, narasumber, materi_struktur, is_locked,
             ttd_ketua_nama, ttd_ketua_nip, ttd_ketua_at,
             ttd_pengawas_nama, ttd_pengawas_nip, ttd_pengawas_at
      FROM kegiatan
      WHERE id = ?
    `).bind(kegiatanId).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Cek kehadiran user
    const absensiRow: any = await c.env.DB.prepare(`
      SELECT id, status, waktu_checkin, keterangan
      FROM absensi
      WHERE kegiatan_id = ? AND user_id = ?
    `).bind(kegiatanId, user.id).first();

    // Cek sertifikat yang sudah terbit / draft refleksi
    const sertifikatRow: any = await c.env.DB.prepare(`
      SELECT id, nomor_sertifikat, token_hash, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status, created_at
      FROM sertifikat_presensi
      WHERE kegiatan_id = ? AND user_id = ?
    `).bind(kegiatanId, user.id).first();

    const isFullySigned = Boolean(kegiatan.ttd_ketua_at && kegiatan.ttd_pengawas_at);
    const hasAttended = absensiRow?.status === 'hadir';
    const hasReflection = Boolean(
      sertifikatRow?.refleksi_konsep &&
      sertifikatRow?.refleksi_tantangan &&
      sertifikatRow?.refleksi_rencana_aksi
    );

    const defaultSigners = await getDefaultSigners(c.env.DB);

    return successResponse(c, {
      kegiatan,
      absensi: absensiRow || null,
      sertifikat: sertifikatRow || null,
      has_attended: hasAttended,
      has_reflection: hasReflection,
      is_fully_signed: isFullySigned,
      can_download: Boolean(hasAttended && hasReflection && isFullySigned && sertifikatRow?.nomor_sertifikat),
      default_signers: defaultSigners
    });
  } catch (e: any) {
    console.error('Get sertifikat status error:', e);
    return Errors.internal(c);
  }
});

// -------------------------------------------------------------
// 2. Simpan Exit Ticket (Mikro-Refleksi Pembelajaran)
// -------------------------------------------------------------
sertifikat.post('/refleksi', requireSession, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { kegiatan_id, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi } = body;

    const validation = validateRequired(body, ['kegiatan_id', 'refleksi_konsep', 'refleksi_tantangan', 'refleksi_rencana_aksi']);
    if (!validation.valid) {
      return Errors.validation(c, `Field wajib diisi: ${validation.missing.join(', ')}`);
    }

    // Pastikan user hadir di kegiatan ini
    const absensiRow: any = await c.env.DB.prepare(`
      SELECT id, status FROM absensi WHERE kegiatan_id = ? AND user_id = ?
    `).bind(kegiatan_id, user.id).first();

    if (!absensiRow || absensiRow.status !== 'hadir') {
      return Errors.forbidden(c, 'Mikro-refleksi hanya dapat diisi oleh peserta yang telah tercatat HADIR pada kegiatan ini.');
    }

    const kegiatan: any = await c.env.DB.prepare(`
      SELECT id, tanggal, nomor_surat_prefix, ttd_ketua_at, ttd_pengawas_at
      FROM kegiatan WHERE id = ?
    `).bind(kegiatan_id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    const isFullySigned = Boolean(kegiatan.ttd_ketua_at && kegiatan.ttd_pengawas_at);

    // Cek apakah sudah ada record sertifikat_presensi
    const existing: any = await c.env.DB.prepare(`
      SELECT id, nomor_sertifikat, token_hash FROM sertifikat_presensi WHERE kegiatan_id = ? AND user_id = ?
    `).bind(kegiatan_id, user.id).first();

    let tokenHash = existing?.token_hash || generateRandomToken();
    let nomorSertifikat = existing?.nomor_sertifikat;

    if (!nomorSertifikat && isFullySigned) {
      // Hitung urutan sertifikat untuk nomor surat
      const countRes: any = await c.env.DB.prepare(`
        SELECT COUNT(*) as total FROM sertifikat_presensi WHERE kegiatan_id = ? AND nomor_sertifikat IS NOT NULL
      `).bind(kegiatan_id).first();

      const urut = String((countRes?.total || 0) + 1).padStart(3, '0');
      const romawi = toRomanMonth(kegiatan.tanggal);
      const tahun = getYear(kegiatan.tanggal);
      const prefix = kegiatan.nomor_surat_prefix || '421.2';
      nomorSertifikat = `${prefix}/${urut}/KKG-G3.WNY/${romawi}/${tahun}`;
    }

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE sertifikat_presensi
        SET refleksi_konsep = ?,
            refleksi_tantangan = ?,
            refleksi_rencana_aksi = ?,
            nomor_sertifikat = COALESCE(nomor_sertifikat, ?),
            status = 'terbit'
        WHERE id = ?
      `).bind(
        refleksi_konsep.trim(),
        refleksi_tantangan.trim(),
        refleksi_rencana_aksi.trim(),
        nomorSertifikat || null,
        existing.id
      ).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO sertifikat_presensi (
          kegiatan_id, user_id, nomor_sertifikat, token_hash,
          refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'terbit')
      `).bind(
        kegiatan_id,
        user.id,
        nomorSertifikat || `DRAFT-${generateRandomToken().slice(0, 8).toUpperCase()}`,
        tokenHash,
        refleksi_konsep.trim(),
        refleksi_tantangan.trim(),
        refleksi_rencana_aksi.trim()
      ).run();
    }

    return successResponse(c, {
      kegiatan_id,
      is_ready: Boolean(isFullySigned && nomorSertifikat),
      token_hash: tokenHash
    }, 'Mikro-refleksi berhasil disimpan! Terima kasih atas refleksi bermakna Anda.');
  } catch (e: any) {
    console.error('Submit refleksi error:', e);
    return Errors.internal(c);
  }
});

// -------------------------------------------------------------
// 3. Tanda Tangan Digital Ketua KKG (Kunci Presensi)
// -------------------------------------------------------------
sertifikat.post('/kegiatan/:id/sign-ketua', requireSession, async (c) => {
  try {
    const user = c.get('user');
    const userRole = (user.role_label || user.role || '').toLowerCase();
    
    // Hanya Ketua/Admin/Operator yang diizinkan membubuhkan TTD Ketua KKG
    if (!hasPermission(userRole, PERMISSIONS.SERTIFIKAT_SIGN_KETUA) && userRole !== 'admin') {
      return Errors.forbidden(c, 'Hanya Ketua KKG atau Administrator yang berwenang menandatangani sebagai Pelaksana');
    }

    const kegiatanId = c.req.param('id');
    const body = await c.req.json();
    const { ttd_nama, ttd_nip } = body;

    const defaultSigners = await getDefaultSigners(c.env.DB);
    const signerNama = ttd_nama?.trim() || defaultSigners.ketua.nama;
    const signerNip = ttd_nip?.trim() || defaultSigners.ketua.nip || null;

    if (!signerNama) {
      return Errors.validation(c, 'Nama Ketua KKG belum diatur pada Pengaturan Organisasi');
    }

    const kegiatan: any = await c.env.DB.prepare(`
      SELECT id, tanggal, nomor_surat_prefix, ttd_pengawas_at FROM kegiatan WHERE id = ?
    `).bind(kegiatanId).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Update tanda tangan Ketua KKG dan kunci presensi
    await c.env.DB.prepare(`
      UPDATE kegiatan
      SET ttd_ketua_nama = ?,
          ttd_ketua_nip = ?,
          ttd_ketua_at = datetime('now'),
          is_locked = 1
      WHERE id = ?
    `).bind(signerNama, signerNip, kegiatanId).run();

    // Jika Pengawas sudah tanda tangan, jalankan auto-issue sertifikat
    if (kegiatan.ttd_pengawas_at) {
      await autoIssueCertificatesForKegiatan(c.env.DB, Number(kegiatanId), kegiatan);
    }

    return successResponse(c, {
      kegiatan_id: Number(kegiatanId),
      ttd_ketua_nama: signerNama,
      ttd_ketua_at: new Date().toISOString()
    }, 'Presensi berhasil dikunci & Tanda tangan Ketua KKG berhasil dibubuhkan!');
  } catch (e: any) {
    console.error('Sign ketua error:', e);
    return Errors.internal(c);
  }
});

// -------------------------------------------------------------
// 4. Tanda Tangan Digital Pengawas Pembina (Pengesahan Resmi)
// -------------------------------------------------------------
sertifikat.post('/kegiatan/:id/sign-pengawas', requireSession, async (c) => {
  try {
    const user = c.get('user');
    const userRole = (user.role_label || user.role || '').toLowerCase();

    // Hanya Pengawas Pembina atau Admin yang dapat mengesahkan
    if (!hasPermission(userRole, PERMISSIONS.SERTIFIKAT_SIGN_PENGAWAS) && userRole !== 'admin') {
      return Errors.forbidden(c, 'Hanya Pengawas Pembina Sekolah atau Administrator yang berwenang mengesahkan sertifikat');
    }

    const kegiatanId = c.req.param('id');
    const body = await c.req.json();
    const { ttd_nama, ttd_nip } = body;

    const defaultSigners = await getDefaultSigners(c.env.DB);
    const signerNama = ttd_nama?.trim() || defaultSigners.pengawas.nama;
    const signerNip = ttd_nip?.trim() || defaultSigners.pengawas.nip || null;

    if (!signerNama) {
      return Errors.validation(c, 'Nama Pengawas Pembina belum diatur pada Pengaturan Organisasi');
    }

    const kegiatan: any = await c.env.DB.prepare(`
      SELECT id, tanggal, nomor_surat_prefix, ttd_ketua_at FROM kegiatan WHERE id = ?
    `).bind(kegiatanId).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Simpan tanda tangan pengawas
    await c.env.DB.prepare(`
      UPDATE kegiatan
      SET ttd_pengawas_nama = ?,
          ttd_pengawas_nip = ?,
          ttd_pengawas_at = datetime('now')
      WHERE id = ?
    `).bind(signerNama, signerNip, kegiatanId).run();

    // Jalankan auto-issue untuk seluruh peserta hadir
    const issuedCount = await autoIssueCertificatesForKegiatan(c.env.DB, Number(kegiatanId), {
      ...kegiatan,
      ttd_pengawas_at: new Date().toISOString()
    });

    return successResponse(c, {
      kegiatan_id: Number(kegiatanId),
      ttd_pengawas_nama: signerNama,
      ttd_pengawas_at: new Date().toISOString(),
      sertifikat_issued: issuedCount
    }, `Sertifikat resmi berhasil disahkan oleh Pengawas! (${issuedCount} sertifikat aktif diterbitkan)`);
  } catch (e: any) {
    console.error('Sign pengawas error:', e);
    return Errors.internal(c);
  }
});

// Helper auto-issue batch nomor sertifikat untuk seluruh yang hadir & isi refleksi
async function autoIssueCertificatesForKegiatan(db: D1Database, kegiatanId: number, kegiatan: any): Promise<number> {
  const attendees = await db.prepare(`
    SELECT a.user_id, s.id as sertifikat_id, s.nomor_sertifikat, s.token_hash
    FROM absensi a
    LEFT JOIN sertifikat_presensi s ON a.kegiatan_id = s.kegiatan_id AND a.user_id = s.user_id
    WHERE a.kegiatan_id = ? AND a.status = 'hadir'
    ORDER BY a.waktu_checkin ASC
  `).bind(kegiatanId).all();

  const romawi = toRomanMonth(kegiatan.tanggal);
  const tahun = getYear(kegiatan.tanggal);
  const prefix = kegiatan.nomor_surat_prefix || '421.2';

  let currentNumber = 1;
  const countRow: any = await db.prepare(`
    SELECT COUNT(*) as cnt FROM sertifikat_presensi WHERE nomor_sertifikat NOT LIKE 'DRAFT-%'
  `).first();
  if (countRow?.cnt) {
    currentNumber = countRow.cnt + 1;
  }

  let issuedCount = 0;

  for (const row of attendees.results as any[]) {
    const token = row.token_hash || generateRandomToken();
    const needsNewNumber = !row.nomor_sertifikat || row.nomor_sertifikat.startsWith('DRAFT-');

    if (row.sertifikat_id) {
      if (needsNewNumber) {
        const urut = String(currentNumber++).padStart(3, '0');
        const noSertif = `${prefix}/${urut}/KKG-G3.WNY/${romawi}/${tahun}`;
        await db.prepare(`
          UPDATE sertifikat_presensi
          SET nomor_sertifikat = ?, status = 'terbit'
          WHERE id = ?
        `).bind(noSertif, row.sertifikat_id).run();
        issuedCount++;
      }
    } else {
      // Buat baru jika peserta belum submit refleksi (bisa disusulkan atau terbit langsung)
      const urut = String(currentNumber++).padStart(3, '0');
      const noSertif = `${prefix}/${urut}/KKG-G3.WNY/${romawi}/${tahun}`;
      await db.prepare(`
        INSERT INTO sertifikat_presensi (
          kegiatan_id, user_id, nomor_sertifikat, token_hash, status
        ) VALUES (?, ?, ?, ?, 'terbit')
      `).bind(kegiatanId, row.user_id, noSertif, token).run();
      issuedCount++;
    }
  }

  return issuedCount;
}

// -------------------------------------------------------------
// 5. Portofolio Sertifikat Saya (Guru)
// -------------------------------------------------------------
sertifikat.get('/saya', requireSession, async (c) => {
  try {
    const user = c.get('user');

    const results = await c.env.DB.prepare(`
      SELECT s.id, s.nomor_sertifikat, s.token_hash, s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi,
             s.created_at as diterbitkan_at,
             k.id as kegiatan_id, k.nama_kegiatan, k.tanggal, k.tempat, k.alokasi_jp, k.narasumber,
             k.ttd_ketua_nama, k.ttd_ketua_nip, k.ttd_ketua_at,
             k.ttd_pengawas_nama, k.ttd_pengawas_nip, k.ttd_pengawas_at
      FROM sertifikat_presensi s
      JOIN kegiatan k ON s.kegiatan_id = k.id
      WHERE s.user_id = ? AND s.nomor_sertifikat NOT LIKE 'DRAFT-%'
      ORDER BY k.tanggal DESC
    `).bind(user.id).all();

    return successResponse(c, results.results || []);
  } catch (e: any) {
    console.error('Get user certificates error:', e);
    return Errors.internal(c);
  }
});

// -------------------------------------------------------------
// 6. Detail Dokumen Sertifikat Lengkap (Untuk Render / Cetak PDF)
// -------------------------------------------------------------
sertifikat.get('/detail/:token', async (c) => {
  try {
    const token = c.req.param('token');

    const row: any = await c.env.DB.prepare(`
      SELECT s.id, s.nomor_sertifikat, s.token_hash, s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi,
             s.created_at,
             u.nama as nama_guru, u.nip as nip_guru, u.sekolah as sekolah_guru, u.mata_pelajaran,
             k.nama_kegiatan, k.tanggal, k.tempat, k.alokasi_jp, k.narasumber, k.materi_struktur,
             k.ttd_ketua_nama, k.ttd_ketua_nip, k.ttd_ketua_at,
             k.ttd_pengawas_nama, k.ttd_pengawas_nip, k.ttd_pengawas_at
      FROM sertifikat_presensi s
      JOIN users u ON s.user_id = u.id
      JOIN kegiatan k ON s.kegiatan_id = k.id
      WHERE s.token_hash = ?
    `).bind(token).first();

    if (!row) {
      return Errors.notFound(c, 'Sertifikat tidak ditemukan');
    }

    let parsedMateri = [];
    try {
      if (row.materi_struktur) {
        parsedMateri = JSON.parse(row.materi_struktur);
      }
    } catch (_) {
      parsedMateri = [];
    }

    if (!parsedMateri || parsedMateri.length === 0) {
      const jp = row.alokasi_jp || 4;
      parsedMateri = [
        { materi: 'Kebijakan Penguatan Kurikulum Merdeka & Pendampingan Pembelajaran', jp: 1 },
        { materi: `Pendalaman Materi & Analisis Praktik Baik: ${row.nama_kegiatan}`, jp: Math.max(1, jp - 2) },
        { materi: 'Refleksi Bermakna, Diskusi Interaktif, & Rencana Tindak Lanjut Kelas', jp: 1 }
      ];
    }

    const host = c.req.header('host') || 'kkg-wanayasa.app';
    const proto = c.req.header('x-forwarded-proto') || 'https';
    const verifyUrl = `${proto}://${host}/verifikasi?token=${encodeURIComponent(row.token_hash)}`;

    return successResponse(c, {
      ...row,
      materi_list: parsedMateri,
      verify_url: verifyUrl,
      is_valid: Boolean(row.ttd_ketua_at && row.ttd_pengawas_at && !row.nomor_sertifikat.startsWith('DRAFT-'))
    });
  } catch (e: any) {
    console.error('Get certificate detail error:', e);
    return Errors.internal(c);
  }
});

// -------------------------------------------------------------
// 7. Mesin Verifikasi Publik (Public Trust Engine)
// -------------------------------------------------------------
sertifikat.get('/verify/:token', async (c) => {
  try {
    const token = c.req.param('token');

    const row: any = await c.env.DB.prepare(`
      SELECT s.nomor_sertifikat, s.token_hash, s.created_at,
             u.nama as nama_guru, u.nip as nip_guru, u.sekolah as sekolah_guru,
             k.nama_kegiatan, k.tanggal, k.tempat, k.alokasi_jp, k.narasumber,
             k.ttd_ketua_nama, k.ttd_ketua_nip, k.ttd_ketua_at,
             k.ttd_pengawas_nama, k.ttd_pengawas_nip, k.ttd_pengawas_at
      FROM sertifikat_presensi s
      JOIN users u ON s.user_id = u.id
      JOIN kegiatan k ON s.kegiatan_id = k.id
      WHERE s.token_hash = ?
    `).bind(token).first();

    if (!row || row.nomor_sertifikat.startsWith('DRAFT-')) {
      return successResponse(c, {
        valid: false,
        message: 'Nomor atau token sertifikat tidak terdaftar atau belum disahkan resmi.'
      });
    }

    return successResponse(c, {
      valid: true,
      message: 'DOKUMEN RESMI TERVERIFIKASI & TERDAFTAR DI DATABASE KKG GUGUS 3 WANAYASA',
      sertifikat: {
        nomor_sertifikat: row.nomor_sertifikat,
        nama_peserta: row.nama_guru,
        nip_peserta: row.nip_guru || '-',
        unit_kerja: row.sekolah_guru || '-',
        nama_kegiatan: row.nama_kegiatan,
        tanggal: row.tanggal,
        alokasi_jp: row.alokasi_jp || 4,
        narasumber: row.narasumber || 'Tim Pengembang KKG',
        disahkan_oleh: {
          ketua_kkg: {
            nama: row.ttd_ketua_nama,
            nip: row.ttd_ketua_nip || '-',
            waktu_ttd: row.ttd_ketua_at
          },
          pengawas_pembina: {
            nama: row.ttd_pengawas_nama,
            nip: row.ttd_pengawas_nip || '-',
            waktu_ttd: row.ttd_pengawas_at
          }
        }
      }
    });
  } catch (e: any) {
    console.error('Verify certificate error:', e);
    return Errors.internal(c);
  }
});

// -------------------------------------------------------------
// 8. Rekap Semua Sertifikat per Kegiatan (Admin / Pengawas)
// -------------------------------------------------------------
sertifikat.get('/kegiatan/:id/list', requireSession, async (c) => {
  try {
    const user = c.get('user');
    const userRole = (user.role_label || user.role || '').toLowerCase();

    if (!hasPermission(userRole, PERMISSIONS.SERTIFIKAT_VIEW_ALL) && userRole !== 'admin') {
      return Errors.forbidden(c, 'Hanya Pengawas atau Administrator yang dapat melihat rekap seluruh sertifikat kegiatan');
    }

    const kegiatanId = c.req.param('id');
    const results = await c.env.DB.prepare(`
      SELECT s.id, s.nomor_sertifikat, s.token_hash, s.status, s.created_at,
             s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi,
             u.nama as nama_guru, u.nip, u.sekolah
      FROM sertifikat_presensi s
      JOIN users u ON s.user_id = u.id
      WHERE s.kegiatan_id = ?
      ORDER BY s.nomor_sertifikat ASC
    `).bind(kegiatanId).all();

    return successResponse(c, results.results || []);
  } catch (e: any) {
    console.error('List activity certificates error:', e);
    return Errors.internal(c);
  }
});

export default sertifikat;
