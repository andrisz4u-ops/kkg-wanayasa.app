import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { CreateKegiatanRequest, Kegiatan, AbsensiWithUser } from '../types';

type Bindings = { DB: D1Database };

const absensi = new Hono<{ Bindings: Bindings }>();

// Get all kegiatan
absensi.get('/kegiatan', async (c) => {
  try {
    const results = await c.env.DB.prepare(`
      SELECT k.*, u.nama as created_by_name
      FROM kegiatan k
      LEFT JOIN users u ON k.created_by = u.id
      ORDER BY k.tanggal DESC, k.waktu_mulai DESC
      LIMIT 100
    `).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get kegiatan error:', e);
    return Errors.internal(c);
  }
});

// Create kegiatan (admin only)
absensi.post('/kegiatan', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  if (user.role !== 'admin') {
    return Errors.forbidden(c, 'Hanya admin yang dapat membuat kegiatan');
  }

  try {
    const body = await c.req.json() as CreateKegiatanRequest;

    const validation = validateRequired(body, ['nama_kegiatan', 'tanggal']);
    if (!validation.valid) {
      return Errors.validation(c, `Field berikut harus diisi: ${validation.missing.join(', ')}`);
    }

    const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi } = body;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return Errors.validation(c, 'Format tanggal tidak valid (gunakan YYYY-MM-DD)');
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO kegiatan (nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      nama_kegiatan.trim(),
      tanggal,
      waktu_mulai?.trim() || null,
      waktu_selesai?.trim() || null,
      tempat?.trim() || null,
      deskripsi?.trim() || null,
      user.id
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      nama_kegiatan,
      tanggal
    }, 'Kegiatan berhasil dibuat', 201);
  } catch (e: any) {
    console.error('Create kegiatan error:', e);
    return Errors.internal(c);
  }
});

// Check-in to kegiatan with status support
absensi.post('/checkin', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const body = await c.req.json();
    const { kegiatan_id, keterangan, status = 'hadir', latitude, longitude } = body;

    if (!kegiatan_id) {
      return Errors.validation(c, 'ID kegiatan harus diisi');
    }

    // Validate status
    const validStatuses = ['hadir', 'izin', 'sakit'];
    if (!validStatuses.includes(status)) {
      return Errors.validation(c, 'Status tidak valid. Gunakan: hadir, izin, atau sakit');
    }

    // Check if kegiatan exists
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan FROM kegiatan WHERE id = ?'
    ).bind(kegiatan_id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Check if already checked in
    const existing: any = await c.env.DB.prepare(
      'SELECT id, status FROM absensi WHERE kegiatan_id = ? AND user_id = ?'
    ).bind(kegiatan_id, user.id).first();

    if (existing) {
      // Update existing record if status changed
      await c.env.DB.prepare(`
        UPDATE absensi SET status = ?, keterangan = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(status, keterangan?.trim() || null, existing.id).run();

      return successResponse(c, {
        id: existing.id,
        status,
        updated: true
      }, `Status absensi diperbarui menjadi ${status}`);
    }

    // Insert new check-in
    const result = await c.env.DB.prepare(`
      INSERT INTO absensi (kegiatan_id, user_id, keterangan, status, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      kegiatan_id,
      user.id,
      keterangan?.trim() || null,
      status,
      latitude || null,
      longitude || null
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      status,
      waktu_checkin: new Date().toISOString()
    }, status === 'hadir' ? 'Check-in berhasil' : `Status ${status} berhasil dicatat`);
  } catch (e: any) {
    console.error('Checkin error:', e);
    return Errors.internal(c);
  }
});

// Get absensi for a kegiatan
absensi.get('/kegiatan/:id/absensi', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    const results = await c.env.DB.prepare(`
      SELECT a.*, u.nama, u.nip, u.sekolah
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      WHERE a.kegiatan_id = ?
      ORDER BY a.waktu_checkin ASC
    `).bind(id).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get absensi error:', e);
    return Errors.internal(c);
  }
});

// Get rekap absensi with status breakdown
absensi.get('/rekap', async (c) => {
  try {
    // Get optional filters
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = `AND k.tanggal BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = `AND k.tanggal >= ?`;
      params.push(startDate);
    } else if (endDate) {
      dateFilter = `AND k.tanggal <= ?`;
      params.push(endDate);
    }

    const results = await c.env.DB.prepare(`
      SELECT 
        u.id, u.nama, u.nip, u.sekolah,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as total_hadir,
        COUNT(CASE WHEN a.status = 'izin' THEN 1 END) as total_izin,
        COUNT(CASE WHEN a.status = 'sakit' THEN 1 END) as total_sakit,
        COUNT(DISTINCT a.kegiatan_id) as total_tercatat,
        (SELECT COUNT(*) FROM kegiatan k WHERE 1=1 ${dateFilter}) as total_kegiatan
      FROM users u
      LEFT JOIN absensi a ON u.id = a.user_id
      LEFT JOIN kegiatan k ON a.kegiatan_id = k.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY total_hadir DESC, u.nama ASC
    `).bind(...params).all();

    // Calculate alpha (tidak hadir tanpa keterangan)
    const dataWithAlpha = results.results?.map((row: any) => ({
      ...row,
      total_alpha: Math.max(0, row.total_kegiatan - row.total_tercatat)
    }));

    return successResponse(c, dataWithAlpha);
  } catch (e: any) {
    console.error('Get rekap error:', e);
    return Errors.internal(c);
  }
});

// Export rekap absensi as CSV
absensi.get('/rekap/export', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const format = c.req.query('format') || 'csv';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = `AND k.tanggal BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    const results = await c.env.DB.prepare(`
      SELECT 
        u.nama, u.nip, u.sekolah,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN a.status = 'izin' THEN 1 END) as izin,
        COUNT(CASE WHEN a.status = 'sakit' THEN 1 END) as sakit,
        COUNT(DISTINCT a.kegiatan_id) as tercatat,
        (SELECT COUNT(*) FROM kegiatan k WHERE 1=1 ${dateFilter}) as total_kegiatan
      FROM users u
      LEFT JOIN absensi a ON u.id = a.user_id
      LEFT JOIN kegiatan k ON a.kegiatan_id = k.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.nama ASC
    `).bind(...params).all();

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Nama', 'NIP', 'Sekolah', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total Kegiatan', 'Persentase'];
      const rows = results.results?.map((r: any) => {
        const alpha = Math.max(0, r.total_kegiatan - r.tercatat);
        const percentage = r.total_kegiatan > 0
          ? ((r.hadir / r.total_kegiatan) * 100).toFixed(1) + '%'
          : '0%';
        return [r.nama, r.nip || '', r.sekolah || '', r.hadir, r.izin, r.sakit, alpha, r.total_kegiatan, percentage].join(',');
      });

      const csv = [headers.join(','), ...(rows || [])].join('\n');

      const dateStr = new Date().toISOString().split('T')[0];

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rekap_absensi_${dateStr}.csv"`
        }
      });
    }

    // JSON format (for Excel generation on client)
    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Export rekap error:', e);
    return Errors.internal(c);
  }
});

// Get detailed absensi per kegiatan for export
absensi.get('/export/detail', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const results = await c.env.DB.prepare(`
      SELECT 
        k.nama_kegiatan,
        k.tanggal,
        u.nama,
        u.nip,
        u.sekolah,
        a.status,
        a.waktu_checkin,
        a.keterangan
      FROM kegiatan k
      LEFT JOIN absensi a ON k.id = a.kegiatan_id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY k.tanggal DESC, k.nama_kegiatan, u.nama
    `).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Export detail error:', e);
    return Errors.internal(c);
  }
});

// Delete kegiatan (admin only)
absensi.delete('/kegiatan/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    await c.env.DB.prepare('DELETE FROM kegiatan WHERE id = ?').bind(id).run();

    return successResponse(c, null, 'Kegiatan berhasil dihapus');
  } catch (e: any) {
    console.error('Delete kegiatan error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// QR Code Endpoints
// ============================================

// Generate QR code for kegiatan (admin only)
absensi.get('/kegiatan/:id/qr', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c, 'Hanya admin yang dapat generate QR code');
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    // Check if kegiatan exists
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan, tanggal FROM kegiatan WHERE id = ?'
    ).bind(id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Get expiry from query param (default 60 minutes)
    const expiryMinutes = parseInt(c.req.query('expiry') || '60', 10);

    // Import QR code generator
    const { generateSecureToken, generateQRCodePNG } = await import('../lib/qrcode');

    // Generate QR data
    const qrData = await generateSecureToken(Number(id), expiryMinutes);

    // Generate QR code image
    const qrImage = await generateQRCodePNG(qrData, 300);

    return successResponse(c, {
      kegiatan_id: kegiatan.id,
      nama_kegiatan: kegiatan.nama_kegiatan,
      tanggal: kegiatan.tanggal,
      qr_data: qrData,
      qr_image: qrImage,
      expires_in_minutes: expiryMinutes,
      expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
    });
  } catch (e: any) {
    console.error('Generate QR error:', e);
    return Errors.internal(c);
  }
});

// Generate Rolling Dynamic QR code (changes every 30 seconds for anti-titip presensi)
absensi.get('/kegiatan/:id/rolling-qr', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c, 'Hanya admin yang dapat mengaktifkan Rolling Dynamic QR');
  }

  try {
    const id = c.req.param('id');
    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat FROM kegiatan WHERE id = ?'
    ).bind(id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    const { generateRollingQRData, generateQRCodePNG } = await import('../lib/qrcode');
    const rolling = await generateRollingQRData(Number(id), 30);
    const qrImage = await generateQRCodePNG(rolling.qr_data, 320);

    return successResponse(c, {
      kegiatan_id: kegiatan.id,
      nama_kegiatan: kegiatan.nama_kegiatan,
      tanggal: kegiatan.tanggal,
      tempat: kegiatan.tempat,
      qr_data: rolling.qr_data,
      qr_image: qrImage,
      window_index: rolling.window_index,
      seconds_remaining: rolling.seconds_remaining,
      window_seconds: rolling.window_seconds,
      mode: 'rolling_dynamic'
    });
  } catch (e: any) {
    console.error('Generate Rolling QR error:', e);
    return Errors.internal(c);
  }
});

// Check-in via QR code scan (supports rolling dynamic QR and legacy format)
absensi.post('/checkin/qr', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const { qr_data, keterangan, latitude, longitude } = await c.req.json();

    if (!qr_data) {
      return Errors.validation(c, 'QR data tidak boleh kosong');
    }

    // Verify QR code with rolling dynamic verifier
    const { verifyRollingQRData } = await import('../lib/qrcode');
    const verification = await verifyRollingQRData(qr_data);

    if (!verification.valid) {
      return Errors.validation(c, verification.error || 'QR code tidak valid atau telah kadaluarsa');
    }

    const kegiatanId = verification.kegiatanId!;

    // Check if kegiatan exists
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan FROM kegiatan WHERE id = ?'
    ).bind(kegiatanId).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Check if already checked in
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM absensi WHERE kegiatan_id = ? AND user_id = ?'
    ).bind(kegiatanId, user.id).first();

    if (existing) {
      return Errors.validation(c, 'Anda sudah check-in untuk kegiatan ini');
    }

    // Perform check-in with optional GPS coordinates
    const result = await c.env.DB.prepare(`
      INSERT INTO absensi (kegiatan_id, user_id, keterangan, latitude, longitude)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      kegiatanId,
      user.id,
      keterangan?.trim() || (verification.isRolling ? 'Check-in via Dynamic Rolling QR' : 'Check-in via QR'),
      latitude || null,
      longitude || null
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      kegiatan_id: kegiatanId,
      nama_kegiatan: kegiatan.nama_kegiatan,
      waktu_checkin: new Date().toISOString(),
      method: verification.isRolling ? 'rolling_qr' : 'qr',
      is_rolling: verification.isRolling
    }, 'Check-in berhasil');
  } catch (e: any) {
    console.error('QR Checkin error:', e);
    return Errors.internal(c);
  }
});

// Verify QR code (for preview before check-in)
absensi.post('/verify-qr', async (c) => {
  try {
    const { qr_data } = await c.req.json();

    if (!qr_data) {
      return Errors.validation(c, 'QR data tidak boleh kosong');
    }

    // Verify QR code
    const { verifyRollingQRData } = await import('../lib/qrcode');
    const verification = await verifyRollingQRData(qr_data);

    if (!verification.valid) {
      return successResponse(c, {
        valid: false,
        error: verification.error,
        expired: verification.expired || false
      });
    }

    // Get kegiatan info
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan, tanggal, waktu_mulai, tempat FROM kegiatan WHERE id = ?'
    ).bind(verification.kegiatanId).first();

    if (!kegiatan) {
      return successResponse(c, {
        valid: false,
        error: 'Kegiatan tidak ditemukan'
      });
    }

    return successResponse(c, {
      valid: true,
      is_rolling: verification.isRolling,
      kegiatan: {
        id: kegiatan.id,
        nama_kegiatan: kegiatan.nama_kegiatan,
        tanggal: kegiatan.tanggal,
        waktu_mulai: kegiatan.waktu_mulai,
        tempat: kegiatan.tempat
      }
    });
  } catch (e: any) {
    console.error('Verify QR error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// E-Sertifikat KKG Endpoints (PMM Bukti Dukung)
// ============================================

async function ensureSertifikatTable(db: D1Database): Promise<void> {
  try {
    await db.prepare('SELECT 1 FROM e_sertifikat LIMIT 1').first();
  } catch {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS e_sertifikat (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nomor_sertifikat TEXT UNIQUE NOT NULL,
          kegiatan_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          nama_peserta TEXT NOT NULL,
          nip_peserta TEXT,
          unit_kerja TEXT,
          nama_kegiatan TEXT NOT NULL,
          tanggal_kegiatan TEXT NOT NULL,
          materi_pokok TEXT,
          alokasi_jp INTEGER DEFAULT 4,
          peran TEXT DEFAULT 'Peserta Aktif',
          status_kehadiran TEXT DEFAULT 'hadir',
          uuid TEXT UNIQUE NOT NULL,
          qr_verify_url TEXT,
          issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(kegiatan_id, user_id)
        )
      `),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_sertifikat_uuid ON e_sertifikat(uuid)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_sertifikat_user ON e_sertifikat(user_id)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_sertifikat_kegiatan ON e_sertifikat(kegiatan_id)')
    ]);
  }
}

// Terbitkan E-Sertifikat untuk seluruh peserta hadir pada suatu kegiatan (Admin only)
absensi.post('/kegiatan/:id/issue-certificates', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c, 'Hanya admin yang dapat menerbitkan E-Sertifikat');
  }

  try {
    const id = c.req.param('id');
    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    await ensureSertifikatTable(c.env.DB);

    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan, tanggal, deskripsi, tempat FROM kegiatan WHERE id = ?'
    ).bind(id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Ambil peserta yang hadir
    const hadirList: any = await c.env.DB.prepare(`
      SELECT a.user_id, u.nama, u.nip, u.sekolah
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      WHERE a.kegiatan_id = ? AND a.status = 'hadir'
    `).bind(id).all();

    const attendees = hadirList.results || [];
    if (attendees.length === 0) {
      return Errors.validation(c, 'Belum ada peserta yang berstatus hadir untuk diterbitkan sertifikat.');
    }

    const year = kegiatan.tanggal ? kegiatan.tanggal.substring(0, 4) : new Date().getFullYear().toString();
    const issued: any[] = [];

    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];

      const existing: any = await c.env.DB.prepare(
        'SELECT id, nomor_sertifikat, uuid FROM e_sertifikat WHERE kegiatan_id = ? AND user_id = ?'
      ).bind(id, att.user_id).first();

      if (existing) {
        issued.push({
          user_id: att.user_id,
          nama: att.nama,
          nomor_sertifikat: existing.nomor_sertifikat,
          uuid: existing.uuid,
          is_new: false
        });
        continue;
      }

      const uuid = crypto.randomUUID();
      const nomorPadded = String(i + 1).padStart(3, '0');
      const kegPadded = String(id).padStart(3, '0');
      const nomorSertifikat = `421.2/KKG-03-WNY/SERT/${year}/${kegPadded}-${nomorPadded}`;
      const verifyUrl = `/verify/sertifikat/${uuid}`;

      await c.env.DB.prepare(`
        INSERT INTO e_sertifikat (
          nomor_sertifikat, kegiatan_id, user_id, nama_peserta, nip_peserta, unit_kerja,
          nama_kegiatan, tanggal_kegiatan, materi_pokok, alokasi_jp, peran, uuid, qr_verify_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        nomorSertifikat,
        id,
        att.user_id,
        att.nama,
        att.nip || '-',
        att.sekolah || 'SDN Gugus 3 Wanayasa',
        kegiatan.nama_kegiatan,
        kegiatan.tanggal,
        kegiatan.deskripsi || kegiatan.nama_kegiatan,
        4,
        'Peserta Aktif',
        uuid,
        verifyUrl
      ).run();

      issued.push({
        user_id: att.user_id,
        nama: att.nama,
        nomor_sertifikat: nomorSertifikat,
        uuid,
        is_new: true
      });
    }

    return successResponse(c, {
      kegiatan_id: id,
      total_issued: issued.length,
      certificates: issued
    }, `Berhasil menerbitkan ${issued.length} E-Sertifikat resmi KKG Gugus 3 Wanayasa`);
  } catch (e: any) {
    console.error('Issue certificates error:', e);
    return Errors.internal(c);
  }
});

// Ambil E-Sertifikat milik user yang sedang login untuk kegiatan tertentu
absensi.get('/kegiatan/:id/my-certificate', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');
    await ensureSertifikatTable(c.env.DB);

    const cert: any = await c.env.DB.prepare(`
      SELECT s.*, k.tempat, k.waktu_mulai, k.waktu_selesai
      FROM e_sertifikat s
      JOIN kegiatan k ON s.kegiatan_id = k.id
      WHERE s.kegiatan_id = ? AND s.user_id = ?
    `).bind(id, user.id).first();

    if (!cert) {
      return Errors.notFound(c, 'E-Sertifikat belum diterbitkan atau Anda belum tercatat hadir dalam kegiatan ini.');
    }

    const signers = await getCertificateSigners(c.env.DB);
    return successResponse(c, {
      ...cert,
      tanda_tangan: signers
    });
  } catch (e: any) {
    console.error('Get my-certificate error:', e);
    return Errors.internal(c);
  }
});

// Helper untuk mengambil identitas resmi penandatangan E-Sertifikat
async function getCertificateSigners(db: D1Database) {
  let settingsMap: Record<string, string> = {};
  try {
    const sRows = await db.prepare(
      "SELECT key, value FROM settings WHERE key IN ('nama_ketua', 'nip_ketua', 'pengawas_nama', 'pengawas_nip', 'pengawas_instansi')"
    ).all();
    if (sRows?.results) {
      for (const row of sRows.results as any[]) {
        settingsMap[row.key] = row.value;
      }
    }
  } catch (_) {}

  const ketuaNama = settingsMap.nama_ketua && settingsMap.nama_ketua !== 'Admin KKG Gugus 3' && settingsMap.nama_ketua !== 'Ketua KKG'
    ? settingsMap.nama_ketua
    : 'MAMAN RUKMAN, S.Pd';
  const ketuaNip = settingsMap.nip_ketua && settingsMap.nip_ketua !== '198501012010011001'
    ? settingsMap.nip_ketua
    : '197009212005011007';

  const pengawasNama = settingsMap.pengawas_nama || 'DIDIN SAMSUDIN, S.Pd.,M.Pd';
  const pengawasNip = settingsMap.pengawas_nip || '198208182009021004';
  const pengawasInstansi = settingsMap.pengawas_instansi || 'Pengawas Pembina Korwil V';

  return {
    ketua_kkg: ketuaNama,
    nip_ketua: ketuaNip,
    jabatan_ketua: 'Ketua KKG Gugus 3',
    pengawas_pembina: pengawasNama,
    nip_pengawas: pengawasNip,
    jabatan_pengawas: pengawasInstansi
  };
}

// Public Verification Endpoint untuk E-Sertifikat KKG
absensi.get('/sertifikat/verify/:uuid', async (c) => {
  try {
    const uuid = c.req.param('uuid');
    if (!uuid) {
      return Errors.validation(c, 'UUID sertifikat diperlukan');
    }

    await ensureSertifikatTable(c.env.DB);

    const cert: any = await c.env.DB.prepare(`
      SELECT s.*, k.tempat
      FROM e_sertifikat s
      JOIN kegiatan k ON s.kegiatan_id = k.id
      WHERE s.uuid = ?
    `).bind(uuid).first();

    if (!cert) {
      return successResponse(c, {
        valid: false,
        error: 'Sertifikat tidak ditemukan atau kode verifikasi tidak terdaftar di pangkalan data KKG Gugus 3 Wanayasa.'
      });
    }

    const signers = await getCertificateSigners(c.env.DB);

    return successResponse(c, {
      valid: true,
      instansi: 'Pemerintah Kabupaten Purwakarta - Dinas Pendidikan',
      organisasi: 'Kelompok Kerja Guru (KKG) Gugus 3 Wanayasa',
      sertifikat: {
        nomor_sertifikat: cert.nomor_sertifikat,
        nama_peserta: cert.nama_peserta,
        nip_peserta: cert.nip_peserta,
        unit_kerja: cert.unit_kerja,
        nama_kegiatan: cert.nama_kegiatan,
        tanggal_kegiatan: cert.tanggal_kegiatan,
        materi_pokok: cert.materi_pokok,
        alokasi_jp: cert.alokasi_jp,
        peran: cert.peran,
        issued_at: cert.issued_at,
        tanda_tangan: signers
      }
    });
  } catch (e: any) {
    console.error('Verify sertifikat error:', e);
    return Errors.internal(c);
  }
});

// Detail sertifikat lengkap untuk render UI / Print
absensi.get('/sertifikat/:uuid', async (c) => {
  try {
    const uuid = c.req.param('uuid');
    await ensureSertifikatTable(c.env.DB);

    const cert: any = await c.env.DB.prepare(`
      SELECT s.*, k.tempat, k.waktu_mulai, k.waktu_selesai
      FROM e_sertifikat s
      JOIN kegiatan k ON s.kegiatan_id = k.id
      WHERE s.uuid = ?
    `).bind(uuid).first();

    if (!cert) {
      return Errors.notFound(c, 'E-Sertifikat tidak ditemukan');
    }

    const signers = await getCertificateSigners(c.env.DB);

    return successResponse(c, {
      ...cert,
      tanda_tangan: signers
    });
  } catch (e: any) {
    console.error('Get sertifikat by uuid error:', e);
    return Errors.internal(c);
  }
});

export default absensi;

