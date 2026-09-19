
import { Hono } from 'hono';
import { successResponse, Errors } from '../lib/response';

type Bindings = { DB: D1Database };

const settings = new Hono<{ Bindings: Bindings }>();

// Get public settings (no auth required)
settings.get('/public', async (c) => {
    try {
        const keys = [
            'nama_kkg', 'alamat_sekretariat', 'logo_url', 'kecamatan', 'kabupaten', 'provinsi', 'tahun_ajaran', 
            'nama_organisasi', 'npsn_sekolah_induk', 'nama_sekolah_induk',
            'nama_ketua', 'nama_sekretaris', 'nama_bendahara', 'email_kkg', 'telepon_kkg', 'website_kkg',
            'hero_title', 'hero_deskripsi', 'visi', 'misi', 'visi_misi',
            'pengawas_nama', 'pengawas_instansi', 'kutipan_pengawas', 'kutipan_ketua',
            'theme_color'
        ];

        const placeholders = keys.map(() => '?').join(',');
        const result = await c.env.DB.prepare(
            `SELECT key, value FROM settings WHERE key IN (${placeholders})`
        ).bind(...keys).all();

        const publicSettings: any = {};
        result.results?.forEach((row: any) => {
            publicSettings[row.key] = row.value;
        });

        return successResponse(c, publicSettings);
    } catch (e: any) {
        console.error('Get public settings error:', e);
        return Errors.internal(c);
    }
});

export default settings;
