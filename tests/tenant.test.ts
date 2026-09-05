import { describe, it, expect, beforeEach } from 'vitest';
import { resolveTenantId, getTenantConfig, invalidateTenantCache, DEFAULT_TENANT_ID, DEFAULT_TENANT } from '../src/lib/tenant';

describe('Multi-Tenancy Resolution & Config Library', () => {
  beforeEach(() => {
    invalidateTenantCache();
  });

  it('should resolve default tenant ID when no header is provided', () => {
    expect(resolveTenantId()).toBe(DEFAULT_TENANT_ID);
    expect(resolveTenantId(new Request('http://localhost:5173/api/tenants/current'))).toBe(DEFAULT_TENANT_ID);
  });

  it('should resolve custom tenant ID from X-Tenant-ID header in Request', () => {
    const req = new Request('http://localhost:5173/api/tenants/current', {
      headers: {
        'X-Tenant-ID': 'kkg-gugus-1-purwakarta'
      }
    });
    expect(resolveTenantId(req)).toBe('kkg-gugus-1-purwakarta');
  });

  it('should resolve custom tenant ID from object with header() helper', () => {
    const mockHonoReq = {
      header: (name: string) => name === 'X-Tenant-ID' ? 'kkg-gugus-2-pasawahan' : undefined
    };
    expect(resolveTenantId(mockHonoReq as any)).toBe('kkg-gugus-2-pasawahan');
  });

  it('should return DEFAULT_TENANT fallback when db is undefined or table missing', async () => {
    const config = await getTenantConfig();
    expect(config.id).toBe(DEFAULT_TENANT_ID);
    expect(config.nama).toBe(DEFAULT_TENANT.nama);
    expect(config.is_active).toBe(1);
  });

  it('should fetch custom tenant config from mock database', async () => {
    const mockDb: any = {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: async () => {
            if (args[0] === 'kkg-custom-test') {
              return {
                id: 'kkg-custom-test',
                nama: 'KKG Gugus Hebat',
                jenjang: 'SD',
                kecamatan: 'Sukasari',
                kabupaten: 'Purwakarta',
                provinsi: 'Jawa Barat',
                alamat_sekretariat: 'SDN Sukasari',
                email: 'kontak@kkghebat.id',
                is_active: 1,
                max_users: 300
              };
            }
            return null;
          }
        })
      })
    };

    const config = await getTenantConfig(mockDb, 'kkg-custom-test');
    expect(config.id).toBe('kkg-custom-test');
    expect(config.nama).toBe('KKG Gugus Hebat');
    expect(config.kecamatan).toBe('Sukasari');
  });
});
