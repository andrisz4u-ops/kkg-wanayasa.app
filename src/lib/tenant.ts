/**
 * Multi-Tenancy Resolution & Configuration Library
 * Provides cluster and organizational abstraction for KKG Gugus and District levels
 */

export interface TenantConfig {
  id: string;
  nama: string;
  jenjang: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamat_sekretariat: string;
  email: string;
  no_kontak?: string;
  logo_url?: string;
  kop_surat_url?: string;
  is_active: number;
  max_users?: number;
}

// Legacy storage namespace, NOT the display name or deployment slug. Separate
// installations deliberately retain this key for schema/session compatibility.
export const DEFAULT_TENANT_ID = 'kkg-gugus-3-wanayasa';

export const DEFAULT_TENANT: TenantConfig = {
  id: DEFAULT_TENANT_ID,
  nama: 'KKG',
  jenjang: 'SD',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  alamat_sekretariat: '',
  email: '',
  is_active: 1,
  max_users: 500,
};

export function isMissingOrganizationTable(error: unknown, table: 'settings' | 'tenants'): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return new RegExp(`no such table:\\s*(?:main\\.)?${table}(?:\\b|$)`, 'i').test(message);
}

/** @deprecated Profiles are read from the current database, never globally cached. */
export function invalidateTenantCache(_tenantId?: string): void {}

/**
 * Resolve tenant from request headers, query string, or fallback
 */
export function resolveTenantId(req?: Request | { header: (name: string) => string | undefined }): string {
  if (!req) return DEFAULT_TENANT_ID;

  let tenantHeader: string | undefined | null;

  if ('header' in req && typeof req.header === 'function') {
    tenantHeader = req.header('X-Tenant-ID');
  } else if ('headers' in req && req.headers instanceof Headers) {
    tenantHeader = req.headers.get('X-Tenant-ID');
  }

  if (tenantHeader && tenantHeader.trim()) {
    return tenantHeader.trim();
  }

  return DEFAULT_TENANT_ID;
}

/**
 * Read current organization metadata from this installation's database.
 */
export async function getTenantConfig(db?: D1Database, tenantId: string = DEFAULT_TENANT_ID): Promise<TenantConfig> {
  let config: TenantConfig = { ...DEFAULT_TENANT };
  if (db) {
    try {
      const row = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
      if (row) {
        config = row as unknown as TenantConfig;
      }
    } catch (error) {
      if (!isMissingOrganizationTable(error, 'tenants')) throw error;
    }
  }
  if (db && tenantId === DEFAULT_TENANT_ID) {
    const { getOrganizationSettings } = await import('./organization');
    const profile = await getOrganizationSettings(db, config);
    return { ...config, nama: profile.nama_kkg, jenjang: profile.jenjang,
      kecamatan: profile.kecamatan, kabupaten: profile.kabupaten, provinsi: profile.provinsi,
      alamat_sekretariat: profile.alamat_sekretariat, email: profile.email_kkg,
      no_kontak: profile.telepon_kkg, logo_url: profile.logo_url, kop_surat_url: profile.kop_surat_url };
  }
  return config;
}
