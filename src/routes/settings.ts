
import { Hono } from 'hono';
import { successResponse, Errors } from '../lib/response';
import { getOrganizationSettings } from '../lib/organization';

type Bindings = { DB: D1Database };

const settings = new Hono<{ Bindings: Bindings }>();

settings.get('/manifest', async (c) => {
    const profile = await getOrganizationSettings(c.env.DB);
    c.header('Cache-Control', 'no-cache');
    c.header('Content-Type', 'application/manifest+json');
    return c.body(JSON.stringify({ name: `${profile.app_name} - ${profile.nama_kkg}`, short_name: profile.app_name,
        start_url: '/', scope: '/', id: '/', display: 'standalone', lang: 'id',
        icons: [{ src: '/static/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/static/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }] }));
});

// Get public settings (no auth required)
settings.get('/public', async (c) => {
    try {
        return successResponse(c, await getOrganizationSettings(c.env.DB));
    } catch (e: any) {
        console.error('Get public settings error:', e);
        return Errors.internal(c);
    }
});

export default settings;
