import { DEFAULT_TENANT, DEFAULT_TENANT_ID } from './tenant';

// One organization per deployment. Settings are the canonical editable profile;
// the legacy tenant row supplies backward-compatible defaults only.
export const PUBLIC_ORGANIZATION_KEYS = [
    'nama_kkg', 'nama_organisasi', 'gugus', 'jenjang', 'alamat_sekretariat',
    'logo_url', 'kop_surat_url', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos',
    'tahun_ajaran', 'nama_sekolah_induk', 'npsn_sekolah_induk',
    'nama_ketua', 'nip_ketua', 'nama_sekretaris', 'nama_bendahara',
    'email_kkg', 'telepon_kkg', 'website_kkg', 'app_name', 'app_url', 'region_profile', 'installation_slug',
    'hero_title', 'hero_deskripsi', 'visi', 'misi', 'visi_misi',
    'pengawas_nama', 'pengawas_nip', 'pengawas_instansi', 'kutipan_pengawas',
    'kutipan_ketua', 'theme_color',
] as const;

export async function getOrganizationSettings(db: D1Database, baseTenant?: any): Promise<Record<string, string>> {
    let tenant: any = baseTenant || DEFAULT_TENANT;
    if (!baseTenant) {
        try {
            tenant = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(DEFAULT_TENANT_ID).first() || tenant;
        } catch { /* Older databases may not yet have the tenant metadata table. */ }
    }
    const defaults: Record<string, string> = {
        nama_kkg: tenant.nama || 'KKG', nama_organisasi: tenant.nama || 'KKG',
        jenjang: tenant.jenjang || 'SD', kecamatan: tenant.kecamatan || '',
        kabupaten: tenant.kabupaten || '', provinsi: tenant.provinsi || '',
        alamat_sekretariat: tenant.alamat_sekretariat || '', email_kkg: tenant.email || '',
        telepon_kkg: tenant.no_kontak || '', logo_url: tenant.logo_url || '/static/icons/icon-192x192.png',
        kop_surat_url: tenant.kop_surat_url || '', app_name: 'RuangKKG', app_url: '',
        region_profile: String(tenant.kabupaten || '').toLowerCase() === 'purwakarta' ? 'purwakarta' : 'custom',
    };
    const rows = await db.prepare(`SELECT key, value FROM settings WHERE key IN (${PUBLIC_ORGANIZATION_KEYS.map(() => '?').join(',')})`)
        .bind(...PUBLIC_ORGANIZATION_KEYS).all<{ key: string; value: string }>();
    for (const row of rows.results || []) defaults[row.key] = row.value;
    if (!(rows.results || []).some(row => row.key === 'nama_kkg') && (rows.results || []).some(row => row.key === 'nama_organisasi')) {
        defaults.nama_kkg = defaults.nama_organisasi;
    }
    defaults.nama_organisasi = defaults.nama_kkg;
    return defaults;
}

/** These templates contain regional regulations and have no generic substitute yet. */
export async function usesPurwakartaContent(db: D1Database): Promise<boolean> {
    const settings = await getOrganizationSettings(db);
    return settings.region_profile === 'purwakarta';
}

export async function getDocumentOrganizationSettings(db: D1Database, storage?: R2Bucket): Promise<Record<string, any>> {
    const profile: Record<string, any> = await getOrganizationSettings(db);
    profile.legacy_logo_assets = !profile.installation_slug;
    // Uploaded local logos are read directly from this installation's R2 binding.
    // Do not fetch arbitrary external URLs while generating a document.
    const path = String(profile.logo_url || '').replace(/^https?:\/\/[^/]+/, '');
    if (storage && path.startsWith('/api/files/logos/')) {
        const object = await storage.get(path.slice('/api/files/'.length));
        const mime = object?.httpMetadata?.contentType;
        if (object && object.size <= 2 * 1024 * 1024 && (mime === 'image/png' || mime === 'image/jpeg')) {
            profile.logo_image = new Uint8Array(await object.arrayBuffer());
            profile.logo_image_type = mime === 'image/jpeg' ? 'jpg' : 'png';
        }
    }
    return profile;
}

export function expandOrganizationTokens(template: string, profile: Record<string, string>): string {
    return template.replace(/\{\{(nama_kkg|kecamatan|kabupaten|alamat_sekretariat)\}\}/g, (_token, key: string) => profile[key] || '');
}
