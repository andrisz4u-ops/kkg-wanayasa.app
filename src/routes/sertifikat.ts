import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import { requireSession } from '../lib/session-middleware';
import { hasPermission, PERMISSIONS } from '../lib/permissions';
import { hasCompleteReflections, isValidCertificateDate, issueCertificate, issueForActivity, READY_CERTIFICATE_SQL } from '../lib/certificate-issuance';
import { getOrganizationSettings } from '../lib/organization';

type Bindings = { DB: D1Database };

const sertifikat = new Hono<{ Bindings: Bindings; Variables: { user: any } }>();

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
        nama: map.nama_ketua || 'Ketua KKG',
        nip: map.nip_ketua || ''
      },
      pengawas: {
        nama: map.pengawas_nama || 'Pengawas Pembina SD',
        nip: map.pengawas_nip || '',
        instansi: map.pengawas_instansi || 'Pengawas SD Pembina'
      }
    };
  } catch (_) {
    return {
      ketua: { nama: 'Ketua KKG', nip: '' },
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
    const hasReflection = hasCompleteReflections(sertifikatRow);
    const ready = Boolean(sertifikatRow && sertifikatRow.status === 'terbit' && sertifikatRow.nomor_sertifikat &&
      !sertifikatRow.nomor_sertifikat.startsWith('DRAFT-') && hasAttended && hasReflection && isFullySigned);

    const defaultSigners = await getDefaultSigners(c.env.DB);

    return successResponse(c, {
      kegiatan,
      absensi: absensiRow || null,
      sertifikat: sertifikatRow || null,
      has_attended: hasAttended,
      has_reflection: hasReflection,
      is_fully_signed: isFullySigned,
      can_download: ready,
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
      SELECT id FROM kegiatan WHERE id = ?
    `).bind(kegiatan_id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // A single conditional UPSERT serializes simultaneous first submissions on
    // UNIQUE(kegiatan_id, user_id). Conflict updates touch reflections only, so
    // issuance metadata, status, and any other persisted fields remain intact.
    const write = await c.env.DB.prepare(`
      INSERT INTO sertifikat_presensi (
        kegiatan_id, user_id, nomor_sertifikat, token_hash,
        refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi, status
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, 'draft'
      WHERE EXISTS (SELECT 1 FROM absensi WHERE kegiatan_id = ? AND user_id = ? AND status = 'hadir')
      ON CONFLICT(kegiatan_id, user_id) DO UPDATE SET
        refleksi_konsep = excluded.refleksi_konsep,
        refleksi_tantangan = excluded.refleksi_tantangan,
        refleksi_rencana_aksi = excluded.refleksi_rencana_aksi
      WHERE sertifikat_presensi.status IN ('draft', 'terbit')
        AND EXISTS (SELECT 1 FROM absensi WHERE kegiatan_id = ? AND user_id = ? AND status = 'hadir')
    `).bind(
      kegiatan_id, user.id, `DRAFT-${generateRandomToken().toUpperCase()}`,
      generateRandomToken(), refleksi_konsep.trim(), refleksi_tantangan.trim(), refleksi_rencana_aksi.trim(),
      kegiatan_id, user.id, kegiatan_id, user.id
    ).run();
    const persisted: any = await c.env.DB.prepare(`
      SELECT id, nomor_sertifikat, token_hash, status, refleksi_konsep, refleksi_tantangan, refleksi_rencana_aksi
      FROM sertifikat_presensi WHERE kegiatan_id = ? AND user_id = ?
    `).bind(kegiatan_id, user.id).first();
    if (!write.meta?.changes) {
      if (persisted && !['draft', 'terbit'].includes(persisted.status)) {
        return Errors.forbidden(c, 'Refleksi sertifikat dengan status yang tidak dapat diubah.');
      }
      return Errors.forbidden(c, 'Mikro-refleksi hanya dapat diisi oleh peserta yang telah tercatat HADIR pada kegiatan ini.');
    }

    // Reflection updates never mutate issuance metadata; the common issuer decides readiness.
    const issued = await issueCertificate(c.env.DB, Number(kegiatan_id), Number(user.id));
    const tokenHash = issued.certificate?.token_hash || persisted?.token_hash;
    const readiness: any = await c.env.DB.prepare(`
      SELECT s.status AS certificate_status, s.nomor_sertifikat,
             s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi,
             a.status AS attendance_status,
             k.tanggal, k.ttd_ketua_at, k.ttd_pengawas_at
      FROM sertifikat_presensi s
      JOIN absensi a ON a.kegiatan_id = s.kegiatan_id AND a.user_id = s.user_id
      JOIN kegiatan k ON k.id = s.kegiatan_id
      WHERE s.kegiatan_id = ? AND s.user_id = ?
    `).bind(kegiatan_id, user.id).first();
    const ready = Boolean(readiness?.certificate_status === 'terbit' &&
      readiness.nomor_sertifikat && !readiness.nomor_sertifikat.startsWith('DRAFT-') &&
      readiness.attendance_status === 'hadir' && hasCompleteReflections(readiness) &&
      readiness.ttd_ketua_at && readiness.ttd_pengawas_at && isValidCertificateDate(readiness.tanggal));

    return successResponse(c, {
      kegiatan_id,
      is_ready: ready,
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

    await issueForActivity(c.env.DB, Number(kegiatanId));

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

    // Always re-read and issue against current persisted signature/eligibility state.
    const issuedCount = await issueForActivity(c.env.DB, Number(kegiatanId));

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

// -------------------------------------------------------------
// 5. Portofolio Sertifikat Saya (Guru)
// -------------------------------------------------------------
sertifikat.get('/saya', requireSession, async (c) => {
  try {
    const user = c.get('user');

    const results = await c.env.DB.prepare(`
       SELECT s.id, s.nomor_sertifikat, s.token_hash, s.status, s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi,
             s.created_at as diterbitkan_at,
             k.id as kegiatan_id, k.nama_kegiatan, k.tanggal, k.tempat, k.alokasi_jp, k.narasumber,
             k.ttd_ketua_nama, k.ttd_ketua_nip, k.ttd_ketua_at,
             k.ttd_pengawas_nama, k.ttd_pengawas_nip, k.ttd_pengawas_at
       FROM sertifikat_presensi s
       JOIN kegiatan k ON s.kegiatan_id = k.id
       JOIN absensi a ON a.kegiatan_id = s.kegiatan_id AND a.user_id = s.user_id
       WHERE s.user_id = ? AND ${READY_CERTIFICATE_SQL}
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
       SELECT s.id, s.nomor_sertifikat, s.token_hash, s.status, s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi,
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

    const host = new URL(c.req.url).host;
    const proto = c.req.header('x-forwarded-proto') || 'https';
    const verifyUrl = `${proto}://${host}/verifikasi?token=${encodeURIComponent(row.token_hash)}`;

    return successResponse(c, {
      ...row,
      materi_list: parsedMateri,
      verify_url: verifyUrl,
      is_valid: Boolean(row.status === 'terbit' && row.ttd_ketua_at && row.ttd_pengawas_at &&
        row.nomor_sertifikat && !row.nomor_sertifikat.startsWith('DRAFT-') && hasCompleteReflections(row) &&
        (await c.env.DB.prepare(`SELECT 1 FROM absensi WHERE kegiatan_id = (SELECT kegiatan_id FROM sertifikat_presensi WHERE token_hash = ?) AND user_id = (SELECT user_id FROM sertifikat_presensi WHERE token_hash = ?) AND status = 'hadir'`).bind(token, token).first()))
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
       SELECT s.nomor_sertifikat, s.token_hash, s.created_at, s.status,
              s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi,
             u.nama as nama_guru, u.nip as nip_guru, u.sekolah as sekolah_guru,
             k.nama_kegiatan, k.tanggal, k.tempat, k.alokasi_jp, k.narasumber,
             k.ttd_ketua_nama, k.ttd_ketua_nip, k.ttd_ketua_at,
             k.ttd_pengawas_nama, k.ttd_pengawas_nip, k.ttd_pengawas_at
      FROM sertifikat_presensi s
      JOIN users u ON s.user_id = u.id
      JOIN kegiatan k ON s.kegiatan_id = k.id
      WHERE s.token_hash = ?
    `).bind(token).first();

    const attended: any = row ? await c.env.DB.prepare(`SELECT 1 FROM absensi a JOIN sertifikat_presensi s ON s.kegiatan_id = a.kegiatan_id AND s.user_id = a.user_id WHERE s.token_hash = ? AND a.status = 'hadir'`).bind(token).first() : null;
    if (!row || row.status !== 'terbit' || !row.nomor_sertifikat || row.nomor_sertifikat.startsWith('DRAFT-') ||
        !hasCompleteReflections(row) || !row.ttd_ketua_at || !row.ttd_pengawas_at || !attended) {
      return successResponse(c, {
        valid: false,
        message: 'Nomor atau token sertifikat tidak terdaftar atau belum disahkan resmi.'
      });
    }

    const profile = await getOrganizationSettings(c.env.DB);
    return successResponse(c, {
      valid: true,
      message: `DOKUMEN RESMI TERVERIFIKASI & TERDAFTAR DI DATABASE ${profile.nama_kkg.toUpperCase()}`,
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
