import { Hono } from 'hono';
import { getCurrentUser, getCookie, hashPassword } from '../lib/auth';
import { encrypt, decrypt, isEncrypted } from '../lib/crypto';
import { successResponse, Errors } from '../lib/response';
import {
  createAuditLog,
  getAuditLogs,
  getAuditActionTypes,
  getAuditEntityTypes,
  getAuditStats,
  cleanOldAuditLogs,
  formatAuditAction
} from '../lib/audit';
import { rateLimitMiddleware, RATE_LIMITS } from '../lib/ratelimit';
import { validate, createUserAdminSchema, updateUserAdminSchema, resetPasswordSchema, updateSettingsSchema, listUsersQuerySchema, auditLogsQuerySchema, bulkApproveSchema, cleanupLogsSchema, createAiProviderSchema, updateAiProviderSchema } from '../lib/validation';
import { AIService, parseKeyPool } from '../services/ai';

import type { DashboardStats } from '../types';
import type { AppBindings, AppVariables } from '../types/env';

const admin = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

const ADMIN_PANEL_ROLES = ['admin', 'operator'] as const;

// Middleware: Check admin panel access role
const requireAdminPanelAccess = async (c: any, next: () => Promise<void>) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  if (!ADMIN_PANEL_ROLES.includes(user.role)) {
    return Errors.forbidden(c, 'Halaman ini hanya untuk admin atau operator');
  }

  c.set('user', user);
  await next();
};

const requireStrictAdmin = async (c: any, next: () => Promise<void>) => {
  const currentUser: any = c.get('user');

  if (!currentUser || currentUser.role !== 'admin') {
    return Errors.forbidden(c, 'Aksi ini hanya dapat dilakukan oleh admin');
  }

  await next();
};

// Apply admin-panel access check to all routes
admin.use('/*', requireAdminPanelAccess);

// Apply rate limiting (stricter for admin)
admin.use('/*', rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,    // 100 requests per minute for admin
  keyPrefix: 'admin'
}));

// Stricter rate limiting for write operations
const writeRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyPrefix: 'admin-write'
});

// Even stricter for user creation
const userCreateRateLimit = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,          // 20 new users per hour
  keyPrefix: 'admin-create-user'
});

// Bulk operation rate limit
const bulkRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'admin-bulk'
});




// Dashboard stats with enhanced analytics
admin.get('/dashboard', async (c) => {
  try {
    const period = c.req.query('period') || '30'; // days
    const periodDays = Math.min(365, Math.max(1, parseInt(period) || 30));

    const [
      guru, surat, proker, kegiatan, materi, pengumuman, threads,
      newUsersThisMonth, activeUsersToday, userGrowth, topUsers
    ] = await Promise.all([
      // Basic counts
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users WHERE is_active = 1 OR is_active IS NULL').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM surat_undangan').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM program_kerja').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM kegiatan').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM materi').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM pengumuman').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM forum_threads').first(),

      // Enhanced analytics
      c.env.DB.prepare(`
        SELECT COUNT(*) as cnt FROM users 
        WHERE created_at >= date('now', '-30 days')
        AND (is_active = 1 OR is_active IS NULL)
      `).first(),

      c.env.DB.prepare(`
        SELECT COUNT(DISTINCT user_id) as cnt FROM audit_logs 
        WHERE DATE(created_at) = DATE('now')
        AND action = 'USER_LOGIN'
      `).first(),

      c.env.DB.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM users 
        WHERE created_at >= date('now', '-${periodDays} days')
        AND (is_active = 1 OR is_active IS NULL)
        GROUP BY DATE(created_at)
        ORDER BY date
      `).all(),

      c.env.DB.prepare(`
        SELECT u.nama, COUNT(a.id) as activity_count
        FROM users u
        LEFT JOIN audit_logs a ON u.id = a.user_id
        WHERE a.created_at >= date('now', '-30 days')
        GROUP BY u.id
        ORDER BY activity_count DESC
        LIMIT 5
      `).all()
    ]) as any[];

    const stats: DashboardStats & { analytics: any } = {
      total_guru: guru?.cnt || 0,
      total_surat: surat?.cnt || 0,
      total_proker: proker?.cnt || 0,
      total_kegiatan: kegiatan?.cnt || 0,
      total_materi: materi?.cnt || 0,
      total_pengumuman: pengumuman?.cnt || 0,
      total_threads: threads?.cnt || 0,
      analytics: {
        new_users_this_month: newUsersThisMonth?.cnt || 0,
        active_users_today: activeUsersToday?.cnt || 0,
        user_growth: userGrowth.results || [],
        top_active_users: topUsers.results || [],
        period_days: periodDays
      }
    };

    return successResponse(c, stats);
  } catch (e: any) {
    console.error('Get dashboard error:', e);
    return Errors.internal(c);
  }
});

// GET /api/admin/analytics/schools — Leaderboard & monthly analytics per school
admin.get('/analytics/schools', async (c) => {
  try {
    const requestedMonth = c.req.query('month') || new Date().toISOString().substring(0, 7); // e.g. "2026-08"

    // 1. Get all registered schools
    const schoolsRes = await c.env.DB.prepare(
      'SELECT id, nama, npsn, tipe, is_sekretariat, is_sekolah_penggerak FROM sekolah ORDER BY nama ASC'
    ).all();
    const allSchools = schoolsRes.results || [];

    // 2. Get distinct available months in logs for filter dropdown
    const monthsRes = await c.env.DB.prepare(
      "SELECT DISTINCT strftime('%Y-%m', created_at) as month FROM ai_generation_logs ORDER BY month DESC"
    ).all();
    const availableMonths: string[] = (monthsRes.results || []).map((r: any) => r.month).filter(Boolean);
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    if (!availableMonths.includes(currentMonthStr)) {
      availableMonths.unshift(currentMonthStr);
    }

    // 3. Aggregate generation counts per school for the selected month (or 'all')
    const statsQuery = requestedMonth === 'all'
      ? `SELECT 
           sekolah,
           COUNT(*) as total_all,
           SUM(CASE WHEN feature_type = 'RPP' THEN 1 ELSE 0 END) as total_rpp,
           SUM(CASE WHEN feature_type = 'ASESMEN' THEN 1 ELSE 0 END) as total_asesmen,
           SUM(CASE WHEN feature_type = 'SLIDE' THEN 1 ELSE 0 END) as total_slide
         FROM ai_generation_logs
         GROUP BY sekolah`
      : `SELECT 
           sekolah,
           COUNT(*) as total_all,
           SUM(CASE WHEN feature_type = 'RPP' THEN 1 ELSE 0 END) as total_rpp,
           SUM(CASE WHEN feature_type = 'ASESMEN' THEN 1 ELSE 0 END) as total_asesmen,
           SUM(CASE WHEN feature_type = 'SLIDE' THEN 1 ELSE 0 END) as total_slide
         FROM ai_generation_logs
         WHERE strftime('%Y-%m', created_at) = ?
         GROUP BY sekolah`;

    const statsRes = requestedMonth === 'all'
      ? await c.env.DB.prepare(statsQuery).all()
      : await c.env.DB.prepare(statsQuery).bind(requestedMonth).all();

    const statsMap = new Map<string, any>();
    (statsRes.results || []).forEach((row: any) => {
      statsMap.set(row.sekolah, row);
    });

    // 4. Find the most active teacher per school in this period
    const topTeacherQuery = requestedMonth === 'all'
      ? `SELECT sekolah, user_nama, COUNT(*) as gen_count 
         FROM ai_generation_logs 
         GROUP BY sekolah, user_nama 
         ORDER BY sekolah, gen_count DESC`
      : `SELECT sekolah, user_nama, COUNT(*) as gen_count 
         FROM ai_generation_logs 
         WHERE strftime('%Y-%m', created_at) = ? 
         GROUP BY sekolah, user_nama 
         ORDER BY sekolah, gen_count DESC`;

    const teachersRes = requestedMonth === 'all'
      ? await c.env.DB.prepare(topTeacherQuery).all()
      : await c.env.DB.prepare(topTeacherQuery).bind(requestedMonth).all();

    const topTeacherMap = new Map<string, { nama: string; count: number }>();
    (teachersRes.results || []).forEach((row: any) => {
      if (!topTeacherMap.has(row.sekolah)) {
        topTeacherMap.set(row.sekolah, { nama: row.user_nama, count: row.gen_count });
      }
    });

    // 5. Build unified leaderboard (including schools with 0 generations)
    const schoolLeaderboard = allSchools.map((sch: any) => {
      const stats = statsMap.get(sch.nama) || {
        total_all: 0,
        total_rpp: 0,
        total_asesmen: 0,
        total_slide: 0
      };
      const topTeacher = topTeacherMap.get(sch.nama) || null;

      return {
        id: sch.id,
        nama: sch.nama,
        npsn: sch.npsn,
        tipe: sch.tipe,
        is_sekretariat: sch.is_sekretariat === 1,
        is_sekolah_penggerak: sch.is_sekolah_penggerak === 1,
        total_all: Number(stats.total_all) || 0,
        total_rpp: Number(stats.total_rpp) || 0,
        total_asesmen: Number(stats.total_asesmen) || 0,
        total_slide: Number(stats.total_slide) || 0,
        top_teacher: topTeacher,
      };
    });

    // Also include any unknown schools from logs that aren't in \`sekolah\` table
    (statsRes.results || []).forEach((row: any) => {
      if (!schoolLeaderboard.some(s => s.nama === row.sekolah)) {
        const topTeacher = topTeacherMap.get(row.sekolah) || null;
        schoolLeaderboard.push({
          id: 0,
          nama: row.sekolah,
          npsn: '-',
          tipe: 'negeri',
          is_sekretariat: false,
          is_sekolah_penggerak: false,
          total_all: Number(row.total_all) || 0,
          total_rpp: Number(row.total_rpp) || 0,
          total_asesmen: Number(row.total_asesmen) || 0,
          total_slide: Number(row.total_slide) || 0,
          top_teacher: topTeacher,
        });
      }
    });

    // Sort by total_all DESC, then name ASC
    schoolLeaderboard.sort((a, b) => {
      if (b.total_all !== a.total_all) return b.total_all - a.total_all;
      return a.nama.localeCompare(b.nama);
    });

    // Assign ranks
    schoolLeaderboard.forEach((s, idx) => {
      (s as any).rank = idx + 1;
    });

    // 6. Calculate Gugus-wide totals
    const totalGenerations = schoolLeaderboard.reduce((sum, s) => sum + s.total_all, 0);
    const totalRpp = schoolLeaderboard.reduce((sum, s) => sum + s.total_rpp, 0);
    const totalAsesmen = schoolLeaderboard.reduce((sum, s) => sum + s.total_asesmen, 0);
    const totalSlide = schoolLeaderboard.reduce((sum, s) => sum + s.total_slide, 0);
    const activeSchoolsCount = schoolLeaderboard.filter(s => s.total_all > 0).length;

    return successResponse(c, {
      selected_month: requestedMonth,
      available_months: availableMonths,
      summary: {
        total_generations: totalGenerations,
        total_rpp: totalRpp,
        total_asesmen: totalAsesmen,
        total_slide: totalSlide,
        active_schools_count: activeSchoolsCount,
        total_schools_count: schoolLeaderboard.length,
        top_school: schoolLeaderboard[0] || null
      },
      leaderboard: schoolLeaderboard
    });
  } catch (e: any) {
    console.error('Get school analytics error:', e);
    return Errors.internal(c, e.message);
  }
});

// Get settings
admin.get('/settings', requireStrictAdmin, async (c) => {
  try {
    // Get all relevant settings
    const settingsKeys = [
      'mistral_api_key', 'z_ai_api_key', 'gemini_api_key', 'bedrock_api_key', 'vertex_api_key', 'vertex_project_id', 'nama_ketua', 'tahun_ajaran', 'alamat_sekretariat',
      // Supabase settings
      'supabase_url', 'supabase_key', 'supabase_bucket',
      // New KKG Profile fields
      'nama_kkg', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos',
      'email_kkg', 'telepon_kkg', 'website_kkg',
      'logo_url', 'kop_surat_url',
      'nama_sekretaris', 'nama_bendahara',
      'struktur_organisasi', 'visi_misi',
      'npsn_sekolah_induk', 'nama_sekolah_induk'
    ];

    const placeholders = settingsKeys.map(() => '?').join(',');
    const result = await c.env.DB.prepare(
      `SELECT key, value FROM settings WHERE key IN (${placeholders})`
    ).bind(...settingsKeys).all();

    const settings: any = {};
    result.results?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    // Mask API key for security
    if (settings.mistral_api_key) {
      const key = settings.mistral_api_key;
      settings.mistral_api_key = key.length > 8
        ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
        : '****';
    }

    if (settings.z_ai_api_key) {
      const key = settings.z_ai_api_key;
      settings.z_ai_api_key = key.length > 8
        ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
        : '****';
    }

    if (settings.gemini_api_key) {
      const key = settings.gemini_api_key;
      settings.gemini_api_key = key.length > 8
        ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
        : '****';
    }

    if (settings.bedrock_api_key) {
      const key = settings.bedrock_api_key;
      settings.bedrock_api_key = key.length > 8
        ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
        : '****';
    }

    if (settings.vertex_api_key) {
      const key = settings.vertex_api_key;
      settings.vertex_api_key = key.length > 8
        ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
        : '****';
    }

    if (settings.supabase_key) {
      const key = settings.supabase_key;
      settings.supabase_key = key.length > 8
        ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
        : '****';
    }

    return successResponse(c, settings);
  } catch (e: any) {
    console.error('Get settings error:', e);
    return Errors.internal(c);
  }
});

// Update settings with Zod validation
admin.put('/settings', requireStrictAdmin, writeRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const currentUser: any = c.get('user');

    // Validate input with Zod
    const validation = validate(updateSettingsSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const validatedData = validation.data;

    // All updatable settings
    const allowedKeys = [
      'nama_ketua', 'nip_ketua', 'tahun_ajaran', 'alamat_sekretariat',
      'nama_kkg', 'gugus', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos',
      'email_kkg', 'telepon_kkg', 'website_kkg',
      'logo_url', 'kop_surat_url',
      'nama_sekretaris', 'nama_bendahara',
      'struktur_organisasi', 'visi_misi',
      'npsn_sekolah_induk', 'nama_sekolah_induk',
      'supabase_url', 'supabase_bucket'
    ];

    const updates: { key: string; value: string }[] = [];

    // Collect all valid updates
    for (const key of allowedKeys) {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updates.push({ key, value: String(validatedData[key as keyof typeof validatedData] || '') });
      }
    }

    // Handle API key separately (only if not masked)
    if (validatedData.mistral_api_key && !validatedData.mistral_api_key.includes('****')) {
      updates.push({ key: 'mistral_api_key', value: validatedData.mistral_api_key });
    }

    if (validatedData.z_ai_api_key && !validatedData.z_ai_api_key.includes('****')) {
      updates.push({ key: 'z_ai_api_key', value: validatedData.z_ai_api_key });
    }

    if (validatedData.gemini_api_key && !validatedData.gemini_api_key.includes('****')) {
      updates.push({ key: 'gemini_api_key', value: validatedData.gemini_api_key });
    }

    if (validatedData.bedrock_api_key && !validatedData.bedrock_api_key.includes('****')) {
      updates.push({ key: 'bedrock_api_key', value: validatedData.bedrock_api_key });
    }

    if (validatedData.vertex_api_key && !validatedData.vertex_api_key.includes('****')) {
      updates.push({ key: 'vertex_api_key', value: validatedData.vertex_api_key });
    }

    if (validatedData.vertex_project_id) {
      updates.push({ key: 'vertex_project_id', value: validatedData.vertex_project_id });
    }

    if (validatedData.supabase_key && !validatedData.supabase_key.includes('****')) {
      updates.push({ key: 'supabase_key', value: validatedData.supabase_key });
    }

    // Execute updates
    for (const { key, value } of updates) {
      await c.env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
      `).bind(key, value, value).run();
    }

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'SETTINGS_UPDATE',
      details: { updated_keys: updates.map(u => u.key) },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, null, 'Pengaturan berhasil disimpan');
  } catch (e: any) {
    console.error('Update settings error:', e);
    return Errors.internal(c);
  }
});

// Upload KKG Logo
admin.post('/settings/logo', requireStrictAdmin, async (c) => {
  try {
    const currentUser: any = c.get('user');
    const contentType = c.req.header('Content-Type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return Errors.validation(c, 'Content-Type harus multipart/form-data');
    }

    let file: File | undefined;
    try {
      const body = await c.req.parseBody();
      file = body['logo'] as File;
    } catch (e) {
      console.error('Body parsing error:', e);
      return Errors.validation(c, 'Gagal membaca file upload. Mungkin ukuran file terlalu besar.');
    }

    if (!file || typeof file === 'string') {
      return Errors.validation(c, 'File logo tidak valid');
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Errors.validation(c, 'Tipe file tidak didukung. Gunakan PNG, JPEG, GIF, atau WebP');
    }

    // Supabase Upload Logic
    const { uploadFile } = await import('../lib/storage');
    // Using explicit cast to any for env to satisfy StorageBindings check inside uploadFile if needed, 
    // or better, validate env first. But uploadFile does check env.

    // Check file size for Supabase (e.g. 2MB limit same as before)
    if (file.size > 2 * 1024 * 1024) {
      return Errors.validation(c, 'Ukuran file maksimal 2MB');
    }

    const result = await uploadFile(c.env as any, file, 'logos');

    if (result.error) {
      console.error('Supabase upload error:', result.error);

      // Fallback to DB if Supabase fails? 
      // No, user specifically said they use Supabase and NOT R2. 
      // If Supabase is not configured, we should error out or maybe fallback to DB if absolutely necessary but let's stick to Supabase first as requested.
      // Actually, for small files (logos), DB fallback is still useful for dev/quickstart without config.
      // But user request "cek secara mendalam bagian mana yang masih berhubungan dengan R2" implies they want R2 GONE.

      return Errors.internal(c, 'Gagal mengupload logo ke Supabase: ' + result.error);
    }

    const logoUrl = result.url;

    await c.env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES ('logo_url', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
    `).bind(logoUrl, logoUrl).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'SETTINGS_UPDATE',
      details: { action: 'upload_logo', file_name: file.name, storage: 'supabase' },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { logo_url: logoUrl }, 'Logo berhasil diupload');

  } catch (e: any) {
    console.error('Upload logo error:', e);
    return Errors.internal(c, 'Gagal mengupload logo: ' + e.message);
  }
});

// Create new user (admin only) with Zod validation and rate limiting
admin.post('/users', requireStrictAdmin, userCreateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const currentUser: any = c.get('user');

    // Validate input with Zod
    const validation = validate(createUserAdminSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data user tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { nama, email, password, role, sekolah, nip } = validation.data;
    const dbRole = role === 'operator' ? 'admin' : role;

    // Check if email exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (existing) {
      return Errors.conflict(c, 'Email sudah terdaftar');
    }

    const passwordHash = await hashPassword(password);

    const result = await c.env.DB.prepare(`
      INSERT INTO users (nama, email, password_hash, role, role_label, sekolah, nip, is_approved, approved_at, approved_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), ?)
    `).bind(
      nama,
      email.toLowerCase(),
      passwordHash,
      dbRole,
      role,
      sekolah || null,
      nip || null,
      currentUser.id
    ).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_CREATE',
      entity_type: 'user',
      entity_id: result.meta.last_row_id,
      details: { name: nama, email, role },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { id: result.meta.last_row_id }, 'User berhasil dibuat', 201);
  } catch (e: any) {
    console.error('Create user error:', e);
    return Errors.internal(c);
  }
});

// Get all users with pagination and filtering
admin.get('/users', async (c) => {
  try {
    // Validate query parameters
    const queryParams = {
      search: c.req.query('search') || undefined,
      role: c.req.query('role') || undefined,
      page: c.req.query('page') || '1',
      limit: c.req.query('limit') || '20'
    };

    const validation = validate(listUsersQuerySchema, queryParams);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter query tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { search, role, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    // Build query dynamically
    let whereClause = '(is_active = 1 OR is_active IS NULL)';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (nama LIKE ? OR email LIKE ? OR nip LIKE ? OR sekolah LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (role) {
      if (role === 'operator') {
        whereClause += ` AND role_label = ?`;
        params.push('operator');
      } else if (role === 'admin') {
        whereClause += ` AND role = 'admin' AND (role_label IS NULL OR role_label = 'admin')`;
      } else {
        whereClause += ` AND role = 'user'`;
      }
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as cnt FROM users WHERE ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first() as any;
    const total = countResult?.cnt || 0;

    // Get users with pagination
    const usersQuery = `
      SELECT id, nama, email, COALESCE(role_label, role) as role, nip, sekolah, mata_pelajaran, no_hp, created_at, last_login_at
      FROM users
      WHERE ${whereClause}
      ORDER BY nama ASC
      LIMIT ? OFFSET ?
    `;

    const results = await c.env.DB.prepare(usersQuery).bind(...params, limit, offset).all();

    return successResponse(c, {
      users: results.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (e: any) {
    console.error('Get users error:', e);
    return Errors.internal(c);
  }
});

// Update user details with Zod validation
admin.put('/users/:id', requireStrictAdmin, writeRateLimit, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const currentUser: any = c.get('user');

    // Validate ID
    const idNum = parseInt(id);
    if (!id || isNaN(idNum) || idNum <= 0) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Validate input with Zod
    const validation = validate(updateUserAdminSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data update tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { nama, sekolah, email, role, nip } = validation.data;
    const dbRole = role === 'operator' ? 'admin' : role;

    // Check user exists
    const user: any = await c.env.DB.prepare(
      'SELECT id, role, role_label, email FROM users WHERE id = ? AND (is_active = 1 OR is_active IS NULL)'
    ).bind(idNum).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Prevent demoting last admin
    const currentEffectiveRole = user.role_label || user.role;
    if (currentEffectiveRole === 'admin' && role && role !== 'admin') {
      const adminCount: any = await c.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND (role_label IS NULL OR role_label = 'admin') AND (is_active = 1 OR is_active IS NULL)"
      ).first();

      if (adminCount.cnt <= 1) {
        return Errors.validation(c, 'Tidak dapat mengubah role admin terakhir');
      }
    }

    // Validate email uniqueness
    if (email && email !== user.email) {
      const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?').bind(email.toLowerCase(), idNum).first();
      if (existing) {
        return Errors.conflict(c, 'Email sudah digunakan user lain');
      }
    }

    const updates: any[] = [];
    let query = 'UPDATE users SET updated_at = datetime("now")';

    if (nama !== undefined) { query += ', nama = ?'; updates.push(nama); }
    if (nip !== undefined) { query += ', nip = ?'; updates.push(nip || null); }

    // Allow clearing sekolah (if explicitly sent as null or empty string)
    if (sekolah !== undefined) {
      query += ', sekolah = ?';
      updates.push(sekolah || null);

      // Also resolve and set sekolah_id FK
      if (sekolah) {
        const matchedSchool: any = await c.env.DB.prepare(
          'SELECT id FROM sekolah WHERE nama = ? LIMIT 1'
        ).bind(sekolah).first();
        query += ', sekolah_id = ?';
        updates.push(matchedSchool ? matchedSchool.id : null);
      } else {
        query += ', sekolah_id = NULL';
      }
    }

    if (email !== undefined) { query += ', email = ?'; updates.push(email.toLowerCase()); }
    if (role !== undefined) {
      query += ', role = ?, role_label = ?';
      updates.push(dbRole, role);
    }

    query += ' WHERE id = ?';
    updates.push(idNum);

    await c.env.DB.prepare(query).bind(...updates).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_PROFILE_UPDATE',
      entity_type: 'user',
      entity_id: idNum,
      details: { updated_user_id: idNum, updates: { nama, sekolah, email, role } },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, null, 'Data user berhasil diperbarui');
  } catch (e: any) {
    console.error('Update user error:', e);
    // Return explicit error for constraint violations if missed
    if (e.message && e.message.includes('UNIQUE constraint failed')) {
      return Errors.conflict(c, 'Email sudah terdaftar');
    }
    return Errors.internal(c);
  }
});

// Reset user password with Zod validation
admin.post('/users/:id/reset-password', requireStrictAdmin, writeRateLimit, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Validate ID
    const idNum = parseInt(id);
    if (!id || isNaN(idNum) || idNum <= 0) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Validate input with Zod
    const validation = validate(resetPasswordSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { new_password } = validation.data;

    // Check user exists
    const user: any = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ? AND (is_active = 1 OR is_active IS NULL)'
    ).bind(idNum).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Hash and update password
    const newHash = await hashPassword(new_password);
    await c.env.DB.prepare(`
      UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(newHash, idNum).run();

    // Invalidate all sessions for this user
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(idNum).run();

    return successResponse(c, null, 'Password berhasil direset');
  } catch (e: any) {
    console.error('Reset password error:', e);
    return Errors.internal(c);
  }
});

// Delete user (with safeguards)
admin.delete('/users/:id', requireStrictAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Prevent self-deletion
    if (Number(id) === currentUser.id) {
      return Errors.validation(c, 'Anda tidak dapat menghapus akun sendiri');
    }

    const user: any = await c.env.DB.prepare(
      'SELECT id, role, role_label FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Prevent deleting last admin
    const effectiveRole = user.role_label || user.role;
    if (effectiveRole === 'admin') {
      const adminCount: any = await c.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND (role_label IS NULL OR role_label = 'admin')"
      ).first();

      if (adminCount.cnt <= 1) {
        return Errors.validation(c, 'Tidak dapat menghapus admin terakhir');
      }
    }

    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    // Log the action
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_DELETE',
      entity_type: 'user',
      entity_id: Number(id),
      details: { deleted_user_id: id },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, null, 'User berhasil dihapus');
  } catch (e: any) {
    console.error('Delete user error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// Audit Log Endpoints
// ============================================

// Get audit logs with filtering and Zod validation
admin.get('/logs', requireStrictAdmin, async (c) => {
  try {
    // Validate query parameters
    const queryParams = {
      user_id: c.req.query('user_id') || undefined,
      action: c.req.query('action') || undefined,
      entity_type: c.req.query('entity_type') || undefined,
      start_date: c.req.query('start_date') || undefined,
      end_date: c.req.query('end_date') || undefined,
      search: c.req.query('search') || undefined,
      page: c.req.query('page') || '1',
      limit: c.req.query('limit') || '50'
    };

    const validation = validate(auditLogsQuerySchema, queryParams);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter query tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { user_id, action, entity_type, start_date, end_date, search, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    const { logs, total } = await getAuditLogs(c.env.DB, {
      userId: user_id,
      action: action,
      entityType: entity_type,
      startDate: start_date,
      endDate: end_date,
      search: search,
      limit,
      offset
    });

    return successResponse(c, {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (e: any) {
    console.error('Get audit logs error:', e);
    return Errors.internal(c);
  }
});

// Get audit log statistics
admin.get('/logs/stats', requireStrictAdmin, async (c) => {
  try {
    const stats = await getAuditStats(c.env.DB);
    return successResponse(c, stats);
  } catch (e: any) {
    console.error('Get audit stats error:', e);
    return Errors.internal(c);
  }
});

// Get available action types for filtering
admin.get('/logs/actions', requireStrictAdmin, async (c) => {
  try {
    const actions = await getAuditActionTypes(c.env.DB);
    return successResponse(c, actions.map(action => ({
      value: action,
      label: formatAuditAction(action)
    })));
  } catch (e: any) {
    console.error('Get audit actions error:', e);
    return Errors.internal(c);
  }
});

// Get available entity types for filtering
admin.get('/logs/entities', requireStrictAdmin, async (c) => {
  try {
    const entities = await getAuditEntityTypes(c.env.DB);
    return successResponse(c, entities);
  } catch (e: any) {
    console.error('Get audit entities error:', e);
    return Errors.internal(c);
  }
});

// Clean old audit logs (retention) with Zod validation
admin.post('/logs/cleanup', requireStrictAdmin, bulkRateLimit, async (c) => {
  try {
    const body = await c.req.json();

    // Validate input with Zod
    const validation = validate(cleanupLogsSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter cleanup tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { days_to_keep } = validation.data;
    const deleted = await cleanOldAuditLogs(c.env.DB, days_to_keep);

    const currentUser: any = c.get('user');
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'ADMIN_ACTION',
      details: { action: 'cleanup_audit_logs', days_to_keep, deleted_count: deleted },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { deleted }, `${deleted} log lama berhasil dihapus`);
  } catch (e: any) {
    console.error('Cleanup audit logs error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// User Approval System
// ============================================

// Get pending users
admin.get('/users/pending', async (c) => {
  try {
    const results = await c.env.DB.prepare(`
      SELECT id, nama, email, nip, sekolah, COALESCE(role_label, role) as role, created_at
      FROM users
      WHERE is_approved = 0 OR is_approved IS NULL
      ORDER BY created_at DESC
    `).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get pending users error:', e);
    return Errors.internal(c);
  }
});

// Approve user
admin.post('/users/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser: any = c.get('user');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Check if user exists and is pending
    const user: any = await c.env.DB.prepare(
      'SELECT id, nama, email, is_approved FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    if (user.is_approved === 1) {
      return Errors.validation(c, 'User sudah disetujui sebelumnya');
    }

    // Approve user
    await c.env.DB.prepare(`
      UPDATE users 
      SET is_approved = 1, approved_at = datetime('now'), approved_by = ?
      WHERE id = ?
    `).bind(currentUser.id, id).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_APPROVE',
      entity_type: 'users',
      entity_id: Number(id),
      details: { approved_user: user.nama, email: user.email },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { approved: true }, `User ${user.nama} berhasil disetujui`);
  } catch (e: any) {
    console.error('Approve user error:', e);
    return Errors.internal(c);
  }
});

// Reject user (delete)
admin.post('/users/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    const { reason } = await c.req.json();
    const currentUser: any = c.get('user');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Check if user exists
    const user: any = await c.env.DB.prepare(
      'SELECT id, nama, email FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Can't reject admin
    const userDetail: any = await c.env.DB.prepare(
      'SELECT role, role_label FROM users WHERE id = ?'
    ).bind(id).first();

    const targetRole = userDetail?.role_label || userDetail?.role;
    if (targetRole === 'admin') {
      return Errors.forbidden(c, 'Tidak dapat menolak user admin');
    }

    // Delete user
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_REJECT',
      entity_type: 'users',
      entity_id: Number(id),
      details: { rejected_user: user.nama, email: user.email, reason },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { rejected: true }, `User ${user.nama} berhasil ditolak`);
  } catch (e: any) {
    console.error('Reject user error:', e);
    return Errors.internal(c);
  }
});

// Bulk approve users with Zod validation and rate limiting
admin.post('/users/bulk-approve', bulkRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const currentUser: any = c.get('user');

    // Validate input with Zod
    const validation = validate(bulkApproveSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Daftar user ID tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { user_ids } = validation.data;

    let approved = 0;
    for (const userId of user_ids) {
      try {
        await c.env.DB.prepare(`
          UPDATE users 
          SET is_approved = 1, approved_at = datetime('now'), approved_by = ?
          WHERE id = ? AND (is_approved = 0 OR is_approved IS NULL)
        `).bind(currentUser.id, userId).run();
        approved++;
      } catch (e) {
        console.warn(`Failed to approve user ${userId}:`, e);
      }
    }

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_BULK_APPROVE',
      details: { approved_count: approved, user_ids },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { approved }, `${approved} user berhasil disetujui`);
  } catch (e: any) {
    console.error('Bulk approve error:', e);
    return Errors.internal(c);
  }
});

// Get user approval stats
admin.get('/users/approval-stats', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN is_approved = 0 OR is_approved IS NULL THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as registered_today
      FROM users
    `).first();

    return successResponse(c, stats);
  } catch (e: any) {
    console.error('Get approval stats error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// AI Provider Management (with Multi-Key Pooling & Encryption)
// ============================================

const providerWriteLimit = rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 30, keyPrefix: 'admin-ai' });

function maskApiKey(key: string): string {
  if (!key || key.length === 0) return '';
  if (key.length <= 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

function maskApiKeyPool(rawKey: string | null | undefined): { masked: string; key_count: number } {
  if (!rawKey || rawKey.length === 0) return { masked: '', key_count: 0 };
  let keys: string[] = [];
  try {
    if (rawKey.startsWith('[') && rawKey.endsWith(']')) {
      const parsed = JSON.parse(rawKey);
      if (Array.isArray(parsed)) keys = parsed.map(k => String(k).trim()).filter(Boolean);
    }
  } catch {}
  if (keys.length === 0) {
    keys = rawKey.split(/[\r\n]+/).map(k => k.trim()).filter(Boolean);
  }
  if (keys.length === 0) return { masked: '', key_count: 0 };

  const maskedLines = keys.map(k => maskApiKey(k));
  return {
    masked: maskedLines.join('\n'),
    key_count: keys.length
  };
}

// GET /admin/ai-providers — List all providers
admin.get('/ai-providers', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM ai_providers ORDER BY priority ASC, id ASC'
    ).all();

    const providers = await Promise.all((result.results || []).map(async (row: any) => {
      let rawKey = row.api_key || '';
      if (rawKey && isEncrypted(rawKey)) {
        try {
          rawKey = await decrypt(rawKey, c.env);
        } catch {
          // keep as is
        }
      }
      const pool = maskApiKeyPool(rawKey);
      return {
        ...row,
        api_key: pool.masked,
        key_count: pool.key_count,
      };
    }));

    return successResponse(c, providers);
  } catch (e: any) {
    console.error('List AI providers error:', e);
    return Errors.internal(c);
  }
});

// POST /admin/ai-providers — Create new provider (with Multi-Key Pooling & AES-GCM encryption)
admin.post('/ai-providers', requireStrictAdmin, providerWriteLimit, async (c) => {
  try {
    const body = await c.req.json();
    const validation = validate(createAiProviderSchema, body);
    if (!validation.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: validation.errors } }, 400);
    }

    const d = validation.data;

    // Check slug uniqueness
    const existing = await c.env.DB.prepare('SELECT id FROM ai_providers WHERE slug = ?').bind(d.slug).first();
    if (existing) {
      return c.json({ success: false, error: { code: 'DUPLICATE', message: `Slug "${d.slug}" sudah digunakan.` } }, 409);
    }

    // Enforce max 20 providers
    const count: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM ai_providers').first();
    if ((count?.cnt || 0) >= 20) {
      return c.json({ success: false, error: { code: 'LIMIT', message: 'Maksimal 20 provider.' } }, 400);
    }

    // Process & serialize key pool
    let storedKey = d.api_key || '';
    if (storedKey) {
      const keys = parseKeyPool(storedKey);
      if (keys.length > 1) {
        storedKey = JSON.stringify(keys);
      } else if (keys.length === 1) {
        storedKey = keys[0];
      }
      if (storedKey && !isEncrypted(storedKey)) {
        storedKey = await encrypt(storedKey, c.env);
      }
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO ai_providers (name, slug, api_type, base_url, model, api_key, priority, is_active, max_tokens, temperature, extra_headers, extra_body)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      d.name, d.slug, d.api_type, d.base_url, d.model, storedKey,
      d.priority, d.is_active, d.max_tokens, d.temperature,
      d.extra_headers || '{}', d.extra_body || '{}'
    ).run();

    const currentUser: any = c.get('user');
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'AI_PROVIDER_CREATE',
      entity_type: 'ai_provider',
      entity_id: result.meta.last_row_id,
      details: `Created AI provider: ${d.name} (${d.slug})`
    });

    return successResponse(c, { id: result.meta.last_row_id, slug: d.slug }, 'Provider berhasil ditambahkan', 201);
  } catch (e: any) {
    console.error('Create AI provider error:', e);
    return Errors.internal(c);
  }
});

// PUT /admin/ai-providers/:id — Update provider (with Multi-Key Pooling & AES-GCM encryption)
admin.put('/ai-providers/:id', requireStrictAdmin, providerWriteLimit, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (!id || id <= 0) return c.json({ success: false, error: { code: 'INVALID_ID', message: 'ID tidak valid' } }, 400);

    const existing: any = await c.env.DB.prepare('SELECT * FROM ai_providers WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Provider tidak ditemukan' } }, 404);

    const body = await c.req.json();
    const validation = validate(updateAiProviderSchema, body);
    if (!validation.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: validation.errors } }, 400);
    }

    const d = validation.data;

    // Check if api_key was modified or left masked (Smart Mask Reconciliation)
    if (d.api_key !== undefined) {
      const lines = d.api_key.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);

      // Decrypt existing stored keys to reconcile masked lines
      let existingRawKey = existing.api_key || '';
      if (existingRawKey && isEncrypted(existingRawKey)) {
        try {
          existingRawKey = await decrypt(existingRawKey, c.env);
        } catch {}
      }
      const existingKeyList = parseKeyPool(existingRawKey);

      if (lines.length === 0) {
        // User explicitly cleared all keys
        d.api_key = '';
      } else {
        // Reconcile each line: if line contains ****, retain corresponding existing key
        const reconciledKeys: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('****')) {
            // Find existing key by matching prefix & suffix, or fallback to index i
            const prefix = line.substring(0, line.indexOf('****'));
            const suffix = line.substring(line.indexOf('****') + 4);
            const matchedKey = existingKeyList.find(k => 
              (prefix ? k.startsWith(prefix) : true) && (suffix ? k.endsWith(suffix) : true)
            ) || existingKeyList[i];

            if (matchedKey) {
              reconciledKeys.push(matchedKey);
            }
          } else {
            // New or modified raw key
            reconciledKeys.push(line);
          }
        }

        // Deduplicate
        const uniqueKeys = Array.from(new Set(reconciledKeys));
        const serialized = uniqueKeys.length > 1 ? JSON.stringify(uniqueKeys) : (uniqueKeys[0] || '');

        if (serialized) {
          d.api_key = await encrypt(serialized, c.env);
        } else {
          d.api_key = '';
        }
      }
    }

    // Check slug uniqueness if changing
    if (d.slug && d.slug !== existing.slug) {
      const slugConflict = await c.env.DB.prepare('SELECT id FROM ai_providers WHERE slug = ? AND id != ?').bind(d.slug, id).first();
      if (slugConflict) {
        return c.json({ success: false, error: { code: 'DUPLICATE', message: `Slug "${d.slug}" sudah digunakan.` } }, 409);
      }
    }

    // Build dynamic update
    const updates: string[] = [];
    const values: any[] = [];
    const fields: Record<string, any> = {
      name: d.name, slug: d.slug, api_type: d.api_type, base_url: d.base_url,
      model: d.model, api_key: d.api_key, priority: d.priority, is_active: d.is_active,
      max_tokens: d.max_tokens, temperature: d.temperature,
      extra_headers: d.extra_headers, extra_body: d.extra_body,
    };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return successResponse(c, null, 'Tidak ada perubahan');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE ai_providers SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const currentUser: any = c.get('user');
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'AI_PROVIDER_UPDATE',
      entity_type: 'ai_provider',
      entity_id: id,
      details: `Updated AI provider: ${d.name || existing.name}`
    });

    return successResponse(c, null, 'Provider berhasil diperbarui');
  } catch (e: any) {
    console.error('Update AI provider error:', e);
    return Errors.internal(c);
  }
});

// DELETE /admin/ai-providers/:id — Delete provider
admin.delete('/ai-providers/:id', requireStrictAdmin, providerWriteLimit, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (!id || id <= 0) return c.json({ success: false, error: { code: 'INVALID_ID', message: 'ID tidak valid' } }, 400);

    const existing: any = await c.env.DB.prepare('SELECT name FROM ai_providers WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Provider tidak ditemukan' } }, 404);

    await c.env.DB.prepare('DELETE FROM ai_providers WHERE id = ?').bind(id).run();

    const currentUser: any = c.get('user');
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'AI_PROVIDER_DELETE',
      entity_type: 'ai_provider',
      entity_id: id,
      details: `Deleted AI provider: ${existing.name}`
    });

    return successResponse(c, null, 'Provider berhasil dihapus');
  } catch (e: any) {
    console.error('Delete AI provider error:', e);
    return Errors.internal(c);
  }
});

// POST /admin/ai-providers/:id/check — Check Live
admin.post('/ai-providers/:id/check', requireStrictAdmin, providerWriteLimit, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (!id || id <= 0) return c.json({ success: false, error: { code: 'INVALID_ID', message: 'ID tidak valid' } }, 400);

    const ai = new AIService(c.env);
    const result = await ai.checkLive(c.env.DB, id);

    return successResponse(c, result, result.ok ? 'Provider aktif dan responsif' : 'Provider gagal merespons');
  } catch (e: any) {
    console.error('Check AI provider error:', e);
    return c.json({ success: false, error: { code: 'CHECK_FAILED', message: e.message } }, 500);
  }
});

// POST /admin/ai-providers/fetch-models — Fetch live model list from provider's endpoint
admin.post('/ai-providers/fetch-models', requireStrictAdmin, providerWriteLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { base_url, api_type = 'openai_compat', provider_id } = body;
    let rawApiKey = (body.api_key || '').trim();

    // If masked key is passed (contains ****) and provider_id is provided, load and decrypt existing key from DB
    if (provider_id && (!rawApiKey || rawApiKey.includes('****'))) {
      const existing: any = await c.env.DB.prepare('SELECT api_key FROM ai_providers WHERE id = ?').bind(provider_id).first();
      if (existing?.api_key) {
        let stored = existing.api_key;
        if (isEncrypted(stored)) {
          try {
            stored = await decrypt(stored, c.env);
          } catch {}
        }
        const keyList = parseKeyPool(stored);
        if (keyList.length > 0) {
          rawApiKey = keyList[0];
        }
      }
    } else if (rawApiKey) {
      const keyList = parseKeyPool(rawApiKey);
      if (keyList.length > 0) {
        rawApiKey = keyList[0];
      }
    }

    if (!base_url && api_type !== 'gemini_sdk') {
      return c.json({ success: false, error: { code: 'INVALID_URL', message: 'Base URL tidak boleh kosong' } }, 400);
    }

    let models: string[] = [];

    if (api_type === 'gemini_sdk' || (base_url && base_url.includes('generativelanguage.googleapis.com'))) {
      const keyParam = rawApiKey ? `?key=${rawApiKey}` : '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models${keyParam}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Google Gemini Error ${res.status}: ${txt.substring(0, 300)}`);
      }
      const data: any = await res.json();
      models = (data.models || [])
        .map((m: any) => (m.name || '').replace(/^models\//, ''))
        .filter((name: string) => name && !name.includes('embedding') && !name.includes('aqa'));
    } else if (api_type === 'anthropic' || (base_url && base_url.includes('api.anthropic.com'))) {
      const url = 'https://api.anthropic.com/v1/models';
      const res = await fetch(url, {
        headers: {
          'x-api-key': rawApiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Anthropic Error ${res.status}: ${txt.substring(0, 300)}`);
      }
      const data: any = await res.json();
      models = (data.data || []).map((m: any) => m.id || m.name).filter(Boolean);
    } else {
      // OpenAI Compatible (OpenAI, Mistral, Groq, NVIDIA NIM, OpenRouter, SiliconFlow, Ollama, etc.)
      let cleanUrl = (base_url || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions\/?$/, '');
      let modelsUrl = cleanUrl.endsWith('/models') ? cleanUrl : `${cleanUrl}/models`;

      if (!cleanUrl.endsWith('/v1') && !cleanUrl.endsWith('/models') && !cleanUrl.includes('/v1/')) {
        modelsUrl = `${cleanUrl}/v1/models`;
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (rawApiKey) {
        headers['Authorization'] = `Bearer ${rawApiKey}`;
      }

      let res = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(15000) });

      // Fallback: If /v1/models returned 404, try /models directly
      if (res.status === 404 && modelsUrl.includes('/v1/models')) {
        const fallbackUrl = cleanUrl.endsWith('/models') ? cleanUrl : `${cleanUrl}/models`;
        res = await fetch(fallbackUrl, { headers, signal: AbortSignal.timeout(15000) });
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Provider Error ${res.status}: ${txt.substring(0, 300)}`);
      }

      const data: any = await res.json();

      if (Array.isArray(data.data)) {
        models = data.data.map((m: any) => m.id || m.name).filter(Boolean);
      } else if (Array.isArray(data.models)) {
        models = data.models.map((m: any) => m.name || m.id || m.model).filter(Boolean);
      } else if (Array.isArray(data)) {
        models = data.map((m: any) => (typeof m === 'string' ? m : m.id || m.name)).filter(Boolean);
      }
    }

    // Filter out non-generative / embedding / audio / image models
    const nonChatPatterns = /embedding|embed|whisper|tts-|dall-e|moderation|rerank|bge-|flux|stable-diffusion|speech|audio/i;
    const filteredModels = models.filter((m: string) => typeof m === 'string' && m && !nonChatPatterns.test(m));

    // Deduplicate and sort alphabetically (fallback to raw if filter was too aggressive)
    const candidateList = filteredModels.length > 0 ? filteredModels : models;
    const uniqueModels = Array.from(new Set(candidateList)).sort((a, b) => a.localeCompare(b));

    if (uniqueModels.length === 0) {
      return c.json({ success: false, error: { code: 'NO_MODELS', message: 'Tidak ada model yang ditemukan dari server provider.' } }, 404);
    }

    return successResponse(c, {
      count: uniqueModels.length,
      models: uniqueModels,
    }, `Berhasil menemukan ${uniqueModels.length} model`);
  } catch (e: any) {
    console.error('Fetch AI provider models error:', e);
    return c.json({ success: false, error: { code: 'FETCH_MODELS_FAILED', message: e.message || 'Gagal mengambil daftar model dari server' } }, 500);
  }
});

// PUT /admin/ai-providers/:id/toggle — Toggle active/inactive
admin.put('/ai-providers/:id/toggle', requireStrictAdmin, providerWriteLimit, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (!id || id <= 0) return c.json({ success: false, error: { code: 'INVALID_ID', message: 'ID tidak valid' } }, 400);

    const existing: any = await c.env.DB.prepare('SELECT name, is_active FROM ai_providers WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Provider tidak ditemukan' } }, 404);

    const newState = existing.is_active ? 0 : 1;
    await c.env.DB.prepare(
      'UPDATE ai_providers SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newState, id).run();

    return successResponse(c, { is_active: newState }, `Provider ${newState ? 'diaktifkan' : 'dinonaktifkan'}`);
  } catch (e: any) {
    console.error('Toggle AI provider error:', e);
    return Errors.internal(c);
  }
});

// GET /admin/ai-providers/presets — Get preset provider templates
admin.get('/ai-providers/presets', async (c) => {
  const presets = [
    { name: 'OpenAI GPT-4o', slug: 'openai-gpt4o', api_type: 'openai_compat', base_url: 'https://api.openai.com/v1', model: 'gpt-4o', max_tokens: 8192 },
    { name: 'OpenAI GPT-4o Mini', slug: 'openai-gpt4o-mini', api_type: 'openai_compat', base_url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', max_tokens: 16384 },
    { name: 'Google Gemini 2.0 Flash', slug: 'gemini-flash', api_type: 'openai_compat', base_url: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash', max_tokens: 8192 },
    { name: 'Google Gemini 2.5 Flash', slug: 'gemini-25-flash', api_type: 'openai_compat', base_url: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash-preview-05-20', max_tokens: 8192 },
    { name: 'Claude Sonnet 4.6 (Direct)', slug: 'claude-anthropic', api_type: 'anthropic', base_url: 'https://api.anthropic.com', model: 'claude-sonnet-4-6-20250514', max_tokens: 8192 },
    { name: 'Mistral Large', slug: 'mistral-large', api_type: 'openai_compat', base_url: 'https://api.mistral.ai/v1', model: 'mistral-large-latest', max_tokens: 16384 },
    { name: 'Groq LLaMA 3.3 70B', slug: 'groq-llama', api_type: 'openai_compat', base_url: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', max_tokens: 8192 },
    { name: 'OpenRouter (Auto)', slug: 'openrouter-auto', api_type: 'openai_compat', base_url: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o', max_tokens: 8192 },
    { name: 'Together AI', slug: 'together-ai', api_type: 'openai_compat', base_url: 'https://api.together.xyz/v1', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', max_tokens: 8192 },
    { name: 'DeepSeek V3', slug: 'deepseek-v3', api_type: 'openai_compat', base_url: 'https://api.deepseek.com/v1', model: 'deepseek-chat', max_tokens: 8192 },
    { name: 'GLM-4 Flash (Zhipu)', slug: 'glm4-flash', api_type: 'openai_compat', base_url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', max_tokens: 8192 },
    { name: 'Ollama (Local)', slug: 'ollama-local', api_type: 'openai_compat', base_url: 'http://localhost:11434/v1', model: 'llama3', max_tokens: 4096 },
  ];

  return successResponse(c, presets);
});

export default admin;
