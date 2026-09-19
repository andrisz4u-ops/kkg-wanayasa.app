import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { AIService } from '../services/ai';
import { buildSuratPrompt } from '../lib/prompts';
import { rateLimitMiddleware, RATE_LIMITS } from '../lib/ratelimit';
import { successResponse, Errors, ErrorCodes } from '../lib/response';
import { validate, validateId, generateSuratSchema, generateSppdSchema } from '../lib/validation';
import { logger } from '../lib/logger';
import type { SuratUndangan } from '../types';

type Bindings = { DB: D1Database; MISTRAL_API_KEY?: string; Z_AI_API_KEY?: string; GEMINI_API_KEY?: string; BEDROCK_API_KEY?: string; BEDROCK_REGION?: string; AI_BACKEND_KEY?: string };

const surat = new Hono<{ Bindings: Bindings }>();

// ============================================
// Get Surat Settings (Kop & Signer)
// ============================================
surat.get('/settings', async (c) => {
  try {
    const settings = await c.env.DB.prepare(`
      SELECT key, value FROM settings 
      WHERE key IN ('nama_ketua', 'nip_ketua', 'alamat_sekretariat', 'logo_url', 'kabupaten', 'kecamatan', 'gugus')
    `).all();

    // Transform array to object
    const savedSettings: any = {};
    if (settings.results) {
      settings.results.forEach((s: any) => {
        savedSettings[s.key] = s.value;
      });
    }

    // Defaults
    const defaults = {
      nama_ketua: 'Ketua KKG',
      nip_ketua: '-',
      alamat_sekretariat: '',
      kabupaten: 'Purwakarta',
      kecamatan: '',
      gugus: ''
    };

    return successResponse(c, { ...defaults, ...savedSettings });
  } catch (e: any) {
    logger.error('Get surat settings error', e);
    return Errors.internal(c);
  }
});

// ============================================
// Generate Surat Undangan (AI)
// ============================================
surat.post('/generate', rateLimitMiddleware(RATE_LIMITS.ai), async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  const startTime = Date.now();

  try {
    const body = await c.req.json();

    // Validate with Zod
    const validation = validate(generateSuratSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Data tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const {
      jenis_kegiatan,
      tanggal_kegiatan,
      waktu_kegiatan,
      tempat_kegiatan,
      agenda,
      peserta,
      penanggung_jawab,
      model = 'vertex',
      aiProvider
    } = validation.data;

    const selectedModel = aiProvider || model || 'vertex';

    // Generate nomor surat
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const count: any = await c.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM surat_undangan WHERE strftime("%Y", created_at) = ?'
    ).bind(String(currentYear)).first();

    const settingsRows = await c.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('nama_kkg', 'nama_organisasi', 'gugus', 'kecamatan', 'kabupaten')"
    ).all();
    const settingsMap: any = {};
    settingsRows.results?.forEach((r: any) => { settingsMap[r.key] = r.value; });

    const isTugas = /tugas|spt|penugasan/i.test(jenis_kegiatan) || /tugas|spt|penugasan/i.test(agenda);
    const kodeSurat = isTugas ? 'ST' : 'UND';
    const gugusCode = settingsMap.gugus ? `KKG-G${settingsMap.gugus}` : 'KKG';
    const nomorSurat = `${String((count?.cnt || 0) + 1).padStart(3, '0')}/${gugusCode}/${kodeSurat}/${currentMonth}/${currentYear}`;

    // Build prompt
    const prompt = buildSuratPrompt({
      jenis_kegiatan,
      tanggal_kegiatan,
      waktu_kegiatan,
      tempat_kegiatan,
      agenda,
      peserta: typeof peserta === 'string' ? peserta : (Array.isArray(peserta) ? peserta.join(', ') : 'Seluruh anggota KKG'),
      penanggung_jawab: penanggung_jawab || user.nama,
      nomor_surat: nomorSurat,
      settings: settingsMap,
    });

    // Call AI using AIService
    let isiSurat: string;
    try {
      const ai = new AIService(c.env);
      await ai.loadProviders(c.env.DB);

      // Support backward-compatible model aliases
      const slugMap: Record<string, string> = {
        vertex: 'vertex-proxy',
        gemini: 'gemini-flash',
        bedrock: 'bedrock-claude',
        mistral: 'mistral-large',
        z_ai: 'glm4-flash'
      };
      const preferredSlug = slugMap[selectedModel] || selectedModel;
      const aiResponse = await ai.generateText(prompt, preferredSlug);
      isiSurat = aiResponse.content;

      if (!isiSurat || isiSurat.length < 10) {
        throw new Error('AI returned an empty or invalid response');
      }
      logger.info('AI Response length', { length: isiSurat.length, userId: user.id, provider: aiResponse.provider });
      logger.ai('generate_surat', true, Date.now() - startTime, { userId: user.id });
    } catch (aiError: any) {
      logger.ai('generate_surat', false, Date.now() - startTime, {
        userId: user.id,
        error: aiError.message
      });
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.AI_ERROR,
          message: aiError.message || 'Gagal menghasilkan surat. Silakan coba lagi.',
        }
      }, 500);
    }

    // Save to database
    const result = await c.env.DB.prepare(`
      INSERT INTO surat_undangan 
      (user_id, nomor_surat, jenis_kegiatan, tanggal_kegiatan, waktu_kegiatan, 
       tempat_kegiatan, agenda, peserta, penanggung_jawab, isi_surat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'final')
    `).bind(
      user.id,
      nomorSurat,
      jenis_kegiatan,
      tanggal_kegiatan,
      waktu_kegiatan,
      tempat_kegiatan,
      agenda,
      JSON.stringify(peserta || []),
      penanggung_jawab || user.nama,
      isiSurat
    ).run();

    logger.info('Surat created', {
      userId: user.id,
      suratId: result.meta.last_row_id,
      nomorSurat
    });

    return successResponse(c, {
      id: result.meta.last_row_id,
      nomor_surat: nomorSurat,
      isi_surat: isiSurat,
      jenis_kegiatan,
      tanggal_kegiatan,
      created_at: new Date().toISOString()
    }, 'Surat undangan berhasil dibuat', 201);

  } catch (e: any) {
    logger.error('Generate surat error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Generate Surat Tugas & SPPD (AI + Auto-Fill)
// ============================================
surat.post('/generate-sppd', rateLimitMiddleware(RATE_LIMITS.ai), async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const body = await c.req.json();

    // Validate with Zod
    const validation = validate(generateSppdSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Data SPPD tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const data = validation.data;
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;
    const romawiBulan = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][currentMonthNum - 1] || 'IX';

    const count: any = await c.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM surat_undangan WHERE strftime("%Y", created_at) = ?'
    ).bind(String(currentYear)).first();

    const sequenceNum = String((count?.cnt || 0) + 1).padStart(3, '0');
    const cleanKodeSekolah = (data.sekolah_asal_nama || 'SDN')
      .replace(/SD NEGERI/i, 'SDN')
      .replace(/[^a-zA-Z0-9]/g, '');

    const nomorSPT = data.nomor_surat_tugas || `421.2 / ${sequenceNum} / ${cleanKodeSekolah} / ${romawiBulan} / ${currentYear}`;
    const nomorSPPD = data.nomor_sppd || `090 / ${sequenceNum} / ${cleanKodeSekolah} / ${romawiBulan} / ${currentYear}`;

    // Auto-calculate H+1 date for LHP if not provided
    const { hitungHPlus1 } = await import('../lib/docx/sppd');
    const tanggalLHP = data.tanggal_lhp || hitungHPlus1(data.tanggal_kegiatan);

    // Prepare guru string for prompt and storage
    const daftarGuruStr = data.daftar_guru.map((g: any) => `${g.nama} (${g.jabatan || 'Guru'}, NIP: ${g.nip || '-'})`).join(', ');

    // Call AI to generate LHP if not provided
    let isiLhp = data.isi_lhp || '';
    if (!isiLhp.trim()) {
      try {
        const { buildSppdLhpPrompt } = await import('../lib/prompts');
        const prompt = buildSppdLhpPrompt({
          agenda: data.agenda,
          tanggal_kegiatan: data.tanggal_kegiatan,
          tempat_kegiatan: data.tempat_kegiatan,
          daftar_guru_str: daftarGuruStr,
          sekolah_asal_nama: data.sekolah_asal_nama
        });

        const selectedModel = data.aiProvider || data.model || 'vertex';
        const aiService = new AIService(c.env, selectedModel);
        isiLhp = await aiService.generateText(prompt, {
          userId: user.id,
          featureType: 'surat_sppd'
        });
      } catch (aiError: any) {
        logger.warn('AI LHP generation failed, using fallback points', { error: aiError.message });
        isiLhp = `1. Telah mengikuti seluruh rangkaian kegiatan KKG Gugus 3 Wanayasa dengan materi "${data.agenda}" secara aktif dan tuntas.\n2. Memahami dan menguasai langkah-langkah implementasi materi pembelajaran serta berpartisipasi dalam penyusunan instrumen perangkat pembelajaran bersama guru-guru gugus.\n3. Berdiskusi dan memecahkan kendala teknis kurikulum di satuan pendidikan masing-masing bersama narasumber dan pengurus KKG.\n4. Menyusun rencana tindak lanjut untuk mengimbaskan hasil kegiatan kepada rekan pendidik dan menerapkannya pada proses belajar mengajar di ${data.sekolah_asal_nama}.`;
      }
    }

    // Resolve kop_surat_url from input or database for sekolah_asal
    let kopSuratUrl = (data as any).kop_surat_url;
    if (!kopSuratUrl && data.sekolah_asal_nama) {
      const sekolahRow: any = await c.env.DB.prepare(
        'SELECT kop_surat_url FROM sekolah WHERE nama = ? LIMIT 1'
      ).bind(data.sekolah_asal_nama).first();
      if (sekolahRow?.kop_surat_url) {
        kopSuratUrl = sekolahRow.kop_surat_url;
      } else if (user.kop_surat_url) {
        kopSuratUrl = user.kop_surat_url;
      }
    }

    // Complete metadata payload
    const metadataPayload = {
      ...data,
      kop_surat_url: kopSuratUrl || null,
      nomor_surat_tugas: nomorSPT,
      nomor_sppd: nomorSPPD,
      tanggal_lhp: tanggalLHP,
      isi_lhp: isiLhp
    };

    // Save to database
    const result = await c.env.DB.prepare(`
      INSERT INTO surat_undangan 
      (user_id, nomor_surat, jenis_kegiatan, tanggal_kegiatan, waktu_kegiatan, 
       tempat_kegiatan, agenda, peserta, penanggung_jawab, isi_surat, status, tipe_surat, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'final', 'sppd', ?)
    `).bind(
      user.id,
      nomorSPT,
      `Surat Tugas & SPPD - ${data.sekolah_asal_nama}`,
      data.tanggal_kegiatan,
      data.waktu_kegiatan || '08.00 s.d Selesai',
      data.tempat_kegiatan,
      data.agenda,
      JSON.stringify(data.daftar_guru),
      data.kepala_sekolah_asal,
      isiLhp,
      JSON.stringify(metadataPayload)
    ).run();

    logger.info('Surat Tugas & SPPD created', {
      userId: user.id,
      suratId: result.meta.last_row_id,
      nomorSurat: nomorSPT
    });

    return successResponse(c, {
      id: result.meta.last_row_id,
      nomor_surat: nomorSPT,
      nomor_sppd: nomorSPPD,
      tipe_surat: 'sppd',
      jenis_kegiatan: `Surat Tugas & SPPD - ${data.sekolah_asal_nama}`,
      tanggal_kegiatan: data.tanggal_kegiatan,
      tanggal_lhp: tanggalLHP,
      isi_lhp: isiLhp,
      metadata: metadataPayload,
      created_at: new Date().toISOString()
    }, 'Paket Surat Tugas & SPPD berhasil dibuat', 201);

  } catch (e: any) {
    logger.error('Generate SPPD error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Get Surat History
// ============================================
surat.get('/history', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    const [results, countResult] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, nomor_surat, jenis_kegiatan, tanggal_kegiatan, 
               tempat_kegiatan, status, created_at, tipe_surat, metadata 
        FROM surat_undangan 
        WHERE user_id = ? 
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(user.id, limit, offset).all(),

      c.env.DB.prepare('SELECT COUNT(*) as total FROM surat_undangan WHERE user_id = ?')
        .bind(user.id).first() as any
    ]);

    return successResponse(c, {
      items: results.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    });
  } catch (e: any) {
    logger.error('Get surat history error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Get Surat Detail
// ============================================
surat.get('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  if (user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    const result: any = await c.env.DB.prepare(`
      SELECT * FROM surat_undangan 
      WHERE id = ? AND user_id = ?
    `).bind(idValidation.id, user.id).first();

    if (!result) {
      return Errors.notFound(c, 'Surat');
    }

    // Parse peserta JSON
    if (result.peserta) {
      try {
        result.peserta = JSON.parse(result.peserta);
      } catch { }
    }

    // Parse metadata JSON
    if (result.metadata) {
      try {
        result.metadata = JSON.parse(result.metadata);
      } catch { }
    }

    return successResponse(c, result);
  } catch (e: any) {
    logger.error('Get surat detail error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Update Surat
// ============================================
surat.put('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  if (user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    // Check ownership
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM surat_undangan WHERE id = ? AND user_id = ?'
    ).bind(idValidation.id, user.id).first();

    if (!existing) {
      return Errors.notFound(c, 'Surat');
    }

    const { isi_surat } = await c.req.json();

    if (!isi_surat || typeof isi_surat !== 'string') {
      return Errors.validation(c, 'Isi surat harus diisi');
    }

    await c.env.DB.prepare(`
      UPDATE surat_undangan 
      SET isi_surat = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(isi_surat, idValidation.id, user.id).run();

    logger.info('Surat updated', { userId: user.id, suratId: idValidation.id });

    return successResponse(c, { id: idValidation.id }, 'Surat berhasil diperbarui');
  } catch (e: any) {
    logger.error('Update surat error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Delete Surat
// ============================================
surat.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM surat_undangan WHERE id = ? AND user_id = ?'
    ).bind(idValidation.id, user.id).first();

    if (!existing) {
      return Errors.notFound(c, 'Surat');
    }

    await c.env.DB.prepare(
      'DELETE FROM surat_undangan WHERE id = ? AND user_id = ?'
    ).bind(idValidation.id, user.id).run();

    logger.info('Surat deleted', { userId: user.id, suratId: idValidation.id });

    return successResponse(c, null, 'Surat berhasil dihapus');
  } catch (e: any) {
    logger.error('Delete surat error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Download Surat as DOCX
// ============================================
surat.get('/:id/download', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    // Get surat data
    const result: any = await c.env.DB.prepare(`
      SELECT * FROM surat_undangan 
      WHERE id = ? AND user_id = ?
    `).bind(idValidation.id, user.id).first();

    if (!result) {
      return Errors.notFound(c, 'Surat');
    }

    // Get KKG settings
    const settingsResult = await c.env.DB.prepare(
      "SELECT key, value FROM settings"
    ).all();

    const settings: any = {};
    settingsResult.results?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    // Parse peserta JSON
    let peserta = [];
    if (result.peserta) {
      try {
        peserta = JSON.parse(result.peserta);
      } catch { }
    }

    // Check if tipe_surat === 'sppd'
    if (result.tipe_surat === 'sppd') {
      let meta: any = {};
      try {
        meta = JSON.parse(result.metadata || '{}');
      } catch { }

      const { generateSppdBuffer } = await import('../lib/docx');
      const buffer = await generateSppdBuffer({
        sekolah_asal_id: meta.sekolah_asal_id,
        sekolah_asal_nama: meta.sekolah_asal_nama || 'SD Negeri',
        kepala_sekolah_asal: meta.kepala_sekolah_asal || result.penanggung_jawab || 'Kepala Sekolah',
        nip_kepala_sekolah_asal: meta.nip_kepala_sekolah_asal || '-',
        alamat_sekolah_asal: meta.alamat_sekolah_asal || '',
        kop_surat_url: meta.kop_surat_url || null,
        nomor_surat_tugas: meta.nomor_surat_tugas || result.nomor_surat,
        nomor_sppd: meta.nomor_sppd,
        sekolah_tujuan_nama: meta.sekolah_tujuan_nama || result.tempat_kegiatan,
        kepala_sekolah_tujuan: meta.kepala_sekolah_tujuan || '',
        nip_kepala_sekolah_tujuan: meta.nip_kepala_sekolah_tujuan || '',
        daftar_guru: meta.daftar_guru || peserta || [],
        tanggal_kegiatan: meta.tanggal_kegiatan || result.tanggal_kegiatan,
        waktu_kegiatan: meta.waktu_kegiatan || result.waktu_kegiatan,
        tempat_kegiatan: meta.tempat_kegiatan || result.tempat_kegiatan,
        agenda: meta.agenda || result.agenda,
        alat_angkut: meta.alat_angkut,
        tingkat_biaya: meta.tingkat_biaya,
        biaya_transport: meta.biaya_transport,
        mata_anggaran: meta.mata_anggaran,
        lama_hari: meta.lama_hari,
        tanggal_lhp: meta.tanggal_lhp,
        dasar_surat: meta.dasar_surat,
        isi_lhp: meta.isi_lhp || result.isi_surat,
      }, settings);

      const safeSekolah = (meta.sekolah_asal_nama || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');
      const safeNomor = (result.nomor_surat || 'SPT').replace(/[^a-zA-Z0-9]/g, '-');
      const filename = `Paket_SPT_SPPD_${safeSekolah}_${safeNomor}.docx`;

      logger.info('SPPD downloaded', { userId: user.id, suratId: idValidation.id });

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Import and generate DOCX for Undangan
    const { generateSuratBuffer } = await import('../lib/docx-generator');

    const buffer = await generateSuratBuffer({
      nomor_surat: result.nomor_surat,
      jenis_kegiatan: result.jenis_kegiatan,
      tanggal_kegiatan: result.tanggal_kegiatan,
      waktu_kegiatan: result.waktu_kegiatan,
      tempat_kegiatan: result.tempat_kegiatan,
      agenda: result.agenda,
      peserta: peserta,
      penanggung_jawab: result.penanggung_jawab,
      isi_surat: result.isi_surat,
      created_at: result.created_at
    }, settings);

    // Generate filename - Sanitize for safe download
    const safeJenisKegiatan = result.jenis_kegiatan.replace(/[^a-zA-Z0-9]/g, '_');
    const safeNomorSurat = result.nomor_surat.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `Surat_Undangan_${safeJenisKegiatan}_${safeNomorSurat}.docx`;

    logger.info('Surat downloaded', { userId: user.id, suratId: idValidation.id });

    // Return as downloadable file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (e: any) {
    logger.error('Download surat error', e, { userId: user.id, stack: e.stack });
    return c.json({
      success: false,
      error: {
        code: 'DOCX_GENERATION_ERROR',
        message: `Gagal membuat dokumen DOCX: ${e.message}`,
      }
    }, 500);
  }
});

export default surat;
