import { z } from 'zod';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

export const LEGACY_PRIMARY_ID = 'kkg-gugus-3-wanayasa';
const text = z.string().trim().min(1).max(200);
const name = z.string().regex(/^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$/);
const httpUrl = z.string().url().refine(value => /^https?:\/\//.test(value));
const schema = z.object({
    slug: name,
    projectName: name,
    databaseName: name,
    databaseId: z.string().uuid().refine(value => value !== '00000000-0000-0000-0000-000000000000'),
    bucketName: name,
    organization: z.object({
        nama_kkg: text, gugus: text, kecamatan: text, kabupaten: text, provinsi: text,
        alamat_sekretariat: z.string().trim().min(1).max(500), email_kkg: z.string().email(),
        telepon_kkg: z.string().max(50).default(''), website_kkg: httpUrl,
        app_name: text.default('RuangKKG'), app_url: httpUrl,
        region_profile: z.enum(['purwakarta', 'custom']),
        jenjang: z.string().max(30).default('SD'), tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/),
        nama_ketua: text, nip_ketua: z.string().max(30).default(''),
        nama_sekretaris: z.string().max(100).default(''), nama_bendahara: z.string().max(100).default(''),
        pengawas_nama: z.string().max(100).default(''), pengawas_nip: z.string().max(30).default(''),
        pengawas_instansi: z.string().max(200).default(''),
        logo_url: z.string().regex(/^(?:\/static\/[\w./-]+|https?:\/\/[^\s]+)$/).default('/static/icons/icon-192x192.png'),
        theme_color: z.enum(['teal', 'blue', 'indigo', 'emerald', 'amber', 'rose']).default('teal'),
    }).strict(),
    admin: z.object({ nama: text, email: z.string().email() }).strict(),
    schools: z.array(z.object({ nama: text, npsn: z.string().regex(/^\d{8}$/).optional(),
        tipe: z.enum(['negeri', 'swasta']).default('negeri'), alamat: z.string().max(500).default(''),
        kepala_sekolah: z.string().max(100).default(''), nip_kepala_sekolah: z.string().max(30).default(''),
        is_sekretariat: z.boolean().default(false),
    }).strict()).min(1).max(500),
}).strict();

export function parseInstallation(input) {
    const config = schema.parse(input);
    if (config.projectName === 'kkg-wanayasa' || config.databaseName === 'kkg-wanayasa-db'
        || config.databaseId === 'b873f582-533c-4907-95f3-4b01f2ca0f23' || config.bucketName === 'kkg-wanayasa-storage') {
        throw new Error('Resource Wanayasa tidak boleh menjadi target pemasangan gugus baru.');
    }
    if (config.organization.region_profile === 'purwakarta' && config.organization.kabupaten.toLowerCase() !== 'purwakarta') {
        throw new Error('Profil Purwakarta hanya untuk Kabupaten Purwakarta; pilih custom untuk daerah lain.');
    }
    const unique = key => new Set(config.schools.map(key)).size === config.schools.length;
    if (!unique(school => school.nama.toLowerCase())) throw new Error('Nama sekolah duplikat.');
    const npsns = config.schools.map(school => school.npsn).filter(Boolean);
    if (new Set(npsns).size !== npsns.length) throw new Error('NPSN sekolah duplikat.');
    if (config.schools.filter(school => school.is_sekretariat).length !== 1) throw new Error('Pilih tepat satu sekolah sekretariat.');
    return config;
}

export function makeWranglerConfig(config) {
    return {
        name: config.projectName, compatibility_date: '2024-09-23', compatibility_flags: ['nodejs_compat'],
        pages_build_output_dir: '../../dist',
        d1_databases: [{ binding: 'DB', database_name: config.databaseName, database_id: config.databaseId, migrations_dir: '../../migrations' }],
        r2_buckets: [{ binding: 'STORAGE', bucket_name: config.bucketName }], ai: { binding: 'AI' },
        vars: { ENVIRONMENT: 'production', APP_NAME: config.organization.app_name, APP_URL: config.organization.app_url,
            REGION_PROFILE: config.organization.region_profile, CORS_ORIGINS: new URL(config.organization.app_url).origin },
    };
}

const literal = value => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
export const LEGACY_SCHOOL_NAMES = ['SDN 2 Nangerang', 'SDN 1 Nangerang', 'SDN Nagrog', 'SDN Raharja', 'SDN 1 Cibuntu', 'SDN 2 Cibuntu', 'SDN Sumurugul', 'SDN Sakambang', 'SDIT Al-Qalam'];

export function makeBootstrapSql(config, password) {
    if (typeof password !== 'string' || password.length < 12) throw new Error('KKG_INITIAL_ADMIN_PASSWORD minimal 12 karakter.');
    const salt = randomBytes(16);
    const hash = `${salt.toString('hex')}:${pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')}`;
    const profile = { ...config.organization, nama_organisasi: config.organization.nama_kkg, installation_slug: config.slug };
    const school = config.schools.find(item => item.is_sekretariat);
    profile.nama_sekolah_induk = school.nama;
    profile.npsn_sekolah_induk = school.npsn || '';
    // Guard BEFORE changes to application data, including when re-running a file.
    // Historical migrations seed exactly nine schools. Only a pristine migrated
    // database qualifies; populated installations are never rebranded by this tool.
    const queries = [
        'CREATE TABLE IF NOT EXISTS installation_bootstrap_guard(ok INTEGER NOT NULL CHECK(ok=1));',
        `INSERT INTO installation_bootstrap_guard(ok) SELECT CASE WHEN
            (SELECT COUNT(*) FROM users)=0 AND (SELECT COUNT(*) FROM sessions)=0
            AND (SELECT COUNT(*) FROM settings)=0 AND (SELECT COUNT(*) FROM kegiatan)=0
            AND (SELECT COUNT(*) FROM materi)=0 AND (SELECT COUNT(*) FROM bank_soal)=0
            AND (SELECT COUNT(*) FROM program_kerja)=0 AND (SELECT COUNT(*) FROM surat_undangan)=0
            AND (SELECT COUNT(*) FROM file_ownership)=0
            AND (SELECT COUNT(*) FROM laporan_kegiatan)=0 AND (SELECT COUNT(*) FROM rpp_history)=0
            AND (SELECT COUNT(*) FROM presentation_history)=0 AND (SELECT COUNT(*) FROM analisis_cp_history)=0
            AND (SELECT COUNT(*) FROM forum_threads)=0
            AND (SELECT COUNT(*) FROM pengumuman)=0 AND (SELECT COUNT(*) FROM files)=0
            AND (SELECT COUNT(*) FROM document_drafts)=0 AND (SELECT COUNT(*) FROM assessment_image_assets)=0
            AND (SELECT COUNT(*) FROM sekolah)=9
            AND (SELECT COUNT(DISTINCT nama) FROM sekolah)=9
            AND NOT EXISTS(SELECT 1 FROM sekolah WHERE nama NOT IN (${LEGACY_SCHOOL_NAMES.map(literal).join(',')}))
            AND NOT EXISTS(SELECT 1 FROM sekolah WHERE npsn IS NOT NULL OR alamat IS NOT NULL OR kepala_sekolah IS NOT NULL OR kop_surat_url IS NOT NULL)
            THEN 1 ELSE 0 END;`,
        'DELETE FROM sekolah;',
        ...config.schools.map(s => `INSERT INTO sekolah(nama,npsn,tipe,alamat,kepala_sekolah,nip_kepala_sekolah,is_sekretariat,tenant_id) VALUES(${[s.nama,s.npsn,s.tipe,s.alamat,s.kepala_sekolah,s.nip_kepala_sekolah,s.is_sekretariat ? 1 : 0,LEGACY_PRIMARY_ID].map(literal).join(',')});`),
        ...Object.entries(profile).map(([key,value]) => `INSERT INTO settings(key,value) VALUES(${literal(key)},${literal(value)});`),
        `UPDATE tenants SET nama=${literal(profile.nama_kkg)},kecamatan=${literal(profile.kecamatan)},kabupaten=${literal(profile.kabupaten)},provinsi=${literal(profile.provinsi)},alamat_sekretariat=${literal(profile.alamat_sekretariat)},email=${literal(profile.email_kkg)},logo_url=${literal(profile.logo_url)} WHERE id=${literal(LEGACY_PRIMARY_ID)};`,
        `UPDATE surat_templates SET konten=${literal('Dengan hormat,\n\nSehubungan dengan agenda kegiatan {{nama_kkg}}, kami mengundang Bapak/Ibu untuk hadir pada:\n\nHari/Tanggal: {{tanggal}}\nWaktu: {{waktu}}\nTempat: {{tempat}}\nAcara: {{acara}}')} WHERE created_by IS NULL AND nama='Undangan Rapat Rutin';`,
        `INSERT INTO users(nama,email,password_hash,role,role_label,is_approved,is_active,tenant_id) VALUES(${[config.admin.nama,config.admin.email.toLowerCase(),hash,'admin','admin',1,1,LEGACY_PRIMARY_ID].map(literal).join(',')});`,
        'DROP TABLE installation_bootstrap_guard;',
    ];
    return queries.join('\n');
}
