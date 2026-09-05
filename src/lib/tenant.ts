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

export const DEFAULT_TENANT_ID = 'kkg-gugus-3-wanayasa';

export const DEFAULT_TENANT: TenantConfig = {
  id: DEFAULT_TENANT_ID,
  nama: 'KKG Gugus 3 Wanayasa',
  jenjang: 'SD',
  kecamatan: 'Wanayasa',
  kabupaten: 'Purwakarta',
  provinsi: 'Jawa Barat',
  alamat_sekretariat: 'SDN 1 Wanayasa, Kec. Wanayasa, Kab. Purwakarta',
  email: 'admin@kkg-wanayasa.id',
  is_active: 1,
  max_users: 500,
};

// In-memory edge cache for tenant metadata
const tenantCache = new Map<string, { data: TenantConfig; cachedAt: number }>();
const TENANT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Clear tenant cache (on update)
 */
export function invalidateTenantCache(tenantId?: string): void {
  if (tenantId) {
    tenantCache.delete(tenantId);
  } else {
    tenantCache.clear();
  }
}

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
 * Fetch tenant configuration with edge caching and safe fallback
 */
export async function getTenantConfig(db?: D1Database, tenantId: string = DEFAULT_TENANT_ID): Promise<TenantConfig> {
  const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST === 'true');
  const now = Date.now();

  if (!isTest) {
    const cached = tenantCache.get(tenantId);
    if (cached && (now - cached.cachedAt) < TENANT_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  if (db) {
    try {
      const row = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
      if (row) {
        const config = row as unknown as TenantConfig;
        if (!isTest) {
          tenantCache.set(tenantId, { data: config, cachedAt: now });
        }
        return config;
      }
    } catch (_) {
      // Fallback gracefully if table not yet initialized
    }
  }

  return DEFAULT_TENANT;
}
