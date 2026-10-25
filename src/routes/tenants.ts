import { Hono } from 'hono';
import { getTenantConfig, resolveTenantId, invalidateTenantCache, DEFAULT_TENANT_ID } from '../lib/tenant';
import { successResponse, Errors } from '../lib/response';
import { getCurrentUser, getCookie } from '../lib/auth';
import { buildAuditStatement } from '../lib/audit';
import { validate, updateSettingsSchema } from '../lib/validation';

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
    let schoolCount = 0;
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

    return successResponse(c, [await getTenantConfig(c.env.DB)]);
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
    const accountTenantId = user.tenant_id || DEFAULT_TENANT_ID;
    if (tenantId !== DEFAULT_TENANT_ID || tenantId !== accountTenantId) {
      return Errors.forbidden(c, 'Anda tidak dapat mengubah organisasi ini.');
    }
    const body = await c.req.json();
    if (typeof body.nama !== 'string' || !body.nama.trim()) {
      return Errors.validation(c, 'Nama organisasi gugus tidak boleh kosong');
    }
    const aliases: Record<string, string> = { nama: 'nama_kkg', jenjang: 'jenjang', kecamatan: 'kecamatan', kabupaten: 'kabupaten', provinsi: 'provinsi', alamat_sekretariat: 'alamat_sekretariat', email: 'email_kkg', no_kontak: 'telepon_kkg', logo_url: 'logo_url', kop_surat_url: 'kop_surat_url' };
    const profile: Record<string, unknown> = {};
    for (const [input, key] of Object.entries(aliases)) if (body[input] !== undefined) profile[key] = body[input];
    const checked = validate(updateSettingsSchema, profile);
    if (!checked.success) return Errors.validation(c, 'Profil organisasi tidak valid');

    try {
      const statements = Object.entries(checked.data).map(([key, value]) => c.env.DB.prepare(
        "INSERT INTO settings(key,value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
      ).bind(key, String(value).trim()));
      await c.env.DB.batch([...statements, buildAuditStatement(c.env.DB, {
        user_id: user.id,
        action: 'SETTINGS_UPDATE',
        entity_type: 'tenants',
        details: { tenant_id: tenantId, updated_keys: Object.keys(profile) },
        ip_address: c.req.header('CF-Connecting-IP') || 'unknown',
        user_agent: c.req.header('User-Agent') || 'unknown'
      })]);
      invalidateTenantCache(tenantId);
    } catch (e: any) {
      console.error('Tenant update failed:', e);
      return Errors.internal(c, 'Data organisasi gagal diperbarui.');
    }

    const updated = await getTenantConfig(c.env.DB, tenantId);
    return successResponse(c, updated, 'Data organisasi gugus berhasil diperbarui');
  } catch (e: any) {
    console.error('Update tenant error:', e);
    return Errors.internal(c);
  }
});

export default tenants;
