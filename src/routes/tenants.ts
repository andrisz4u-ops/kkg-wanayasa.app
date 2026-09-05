import { Hono } from 'hono';
import { getTenantConfig, resolveTenantId, invalidateTenantCache, DEFAULT_TENANT_ID } from '../lib/tenant';
import { successResponse, Errors } from '../lib/response';
import { getCurrentUser, getCookie } from '../lib/auth';
import { createAuditLog } from '../lib/audit';

type Bindings = { DB: D1Database };

const tenants = new Hono<{ Bindings: Bindings }>();

/**
 * Get current active tenant info (Public & Member overview)
 */
tenants.get('/current', async (c) => {
  try {
    const tenantId = resolveTenantId(c.req.raw);
    const tenantConfig = await getTenantConfig(c.env.DB, tenantId);

    // Count affiliated schools
    let schoolCount = 9;
    try {
      const countRes: any = await c.env.DB.prepare(
        'SELECT COUNT(*) as total FROM sekolah WHERE tenant_id = ? OR tenant_id IS NULL'
      ).bind(tenantId).first();
      if (countRes && typeof countRes.total === 'number') {
        schoolCount = countRes.total;
      }
    } catch (_) { }

    return successResponse(c, {
      ...tenantConfig,
      school_count: schoolCount,
    }, 'Data organisasi gugus berhasil diambil');
  } catch (e: any) {
    console.error('Get current tenant error:', e);
    return Errors.internal(c);
  }
});

/**
 * List all tenants (Super Admin / Admin only)
 */
tenants.get('/', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user || (user.role !== 'admin' && user.role !== 'operator' && user.role !== 'super_admin')) {
      return Errors.forbidden(c, 'Hanya administrator yang dapat melihat daftar tenant');
    }

    try {
      const rows = await c.env.DB.prepare(
        'SELECT id, nama, jenjang, kecamatan, kabupaten, provinsi, email, no_kontak, is_active, created_at FROM tenants ORDER BY created_at ASC'
      ).all();

      return successResponse(c, rows.results || []);
    } catch (_) {
      const current = await getTenantConfig(c.env.DB);
      return successResponse(c, [current]);
    }
  } catch (e: any) {
    console.error('List tenants error:', e);
    return Errors.internal(c);
  }
});

/**
 * Update current tenant metadata (Admin only)
 */
tenants.put('/current', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Errors.forbidden(c, 'Hanya administrator yang dapat memperbarui data organisasi');
    }

    const tenantId = resolveTenantId(c.req.raw);
    const body = await c.req.json();
    const { nama, kecamatan, kabupaten, alamat_sekretariat, email, no_kontak, logo_url } = body;

    if (!nama) {
      return Errors.validation(c, 'Nama organisasi gugus tidak boleh kosong');
    }

    try {
      await c.env.DB.prepare(`
        UPDATE tenants 
        SET nama = ?, kecamatan = COALESCE(?, kecamatan), kabupaten = COALESCE(?, kabupaten),
            alamat_sekretariat = COALESCE(?, alamat_sekretariat), email = COALESCE(?, email),
            no_kontak = COALESCE(?, no_kontak), logo_url = COALESCE(?, logo_url),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        nama.trim(),
        kecamatan?.trim() || null,
        kabupaten?.trim() || null,
        alamat_sekretariat?.trim() || null,
        email?.trim() || null,
        no_kontak?.trim() || null,
        logo_url?.trim() || null,
        tenantId
      ).run();

      invalidateTenantCache(tenantId);

      await createAuditLog(c.env.DB, {
        user_id: user.id,
        action: 'SETTINGS_UPDATE',
        entity_type: 'tenants',
        details: { tenant_id: tenantId, nama, kecamatan, kabupaten },
        ip_address: c.req.header('CF-Connecting-IP') || 'unknown',
        user_agent: c.req.header('User-Agent') || 'unknown'
      });
    } catch (e: any) {
      console.warn('Tenant update warning:', e);
    }

    const updated = await getTenantConfig(c.env.DB, tenantId);
    return successResponse(c, updated, 'Data organisasi gugus berhasil diperbarui');
  } catch (e: any) {
    console.error('Update tenant error:', e);
    return Errors.internal(c);
  }
});

export default tenants;
