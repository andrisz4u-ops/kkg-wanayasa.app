
import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { callAI, buildLaporanPrompt } from '../lib/mistral';
import { generateLaporanBuffer } from '../lib/docx-generator';
import { rateLimitMiddleware, RATE_LIMITS } from '../lib/ratelimit';
import { successResponse, Errors, ErrorCodes } from '../lib/response';
import type { LaporanData } from '../types';

type Bindings = {
    DB: D1Database;
    MISTRAL_API_KEY?: string;
    Z_AI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    BEDROCK_API_KEY?: string;
    BEDROCK_REGION?: string;
    VERTEX_API_KEY?: string;
};

const laporan = new Hono<{ Bindings: Bindings }>();

// Helper to check ownership or admin status
async function checkLaporanAccess(c: any, id: string) {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) return { user: null, allowed: false };

    if (user.role === 'admin' || user.role === 'operator') {
        return { user, allowed: true };
    }

    const result = await c.env.DB.prepare(
        "SELECT user_id FROM laporan_kegiatan WHERE id = ?"
    ).bind(id).first();

    if (!result) return { user, allowed: false, notFound: true };

    return { user, allowed: result.user_id === user.id };
}

// POST /api/laporan/generate-content - Generate AI Content for Laporan
laporan.post('/generate-content', rateLimitMiddleware(RATE_LIMITS.ai), async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) return Errors.unauthorized(c);

    try {
        const body = await c.req.json();
        const { judul_laporan, periode, program_kerja_judul, tema, narasumber, tempat, model = 'vertex' } = body;
        const providerMap: Record<string, string> = { mistral: 'mistral', z_ai: 'z_ai', gemini: 'gemini', bedrock: 'bedrock', vertex: 'vertex' };
        const provider = providerMap[model] || 'vertex';

        // Get API keys from settings
        const results: any = await c.env.DB.prepare(
            "SELECT key, value FROM settings WHERE key IN ('mistral_api_key', 'z_ai_api_key', 'gemini_api_key', 'bedrock_api_key', 'vertex_api_key')"
        ).all();

        const settingsDict: any = {};
        results.results?.forEach((row: any) => {
            settingsDict[row.key] = row.value;
        });

        const keyMap: Record<string, { dbKey: string; envKey: string }> = {
            mistral: { dbKey: 'mistral_api_key', envKey: 'MISTRAL_API_KEY' },
            z_ai: { dbKey: 'z_ai_api_key', envKey: 'Z_AI_API_KEY' },
            gemini: { dbKey: 'gemini_api_key', envKey: 'GEMINI_API_KEY' },
            bedrock: { dbKey: 'bedrock_api_key', envKey: 'BEDROCK_API_KEY' },
            vertex: { dbKey: 'vertex_api_key', envKey: 'VERTEX_API_KEY' },
        };
        const keyConfig = keyMap[provider] || keyMap.vertex;
        const apiKey = settingsDict[keyConfig.dbKey] || (c.env as any)[keyConfig.envKey];

        if (!apiKey) {
            const providerNames: Record<string, string> = { mistral: 'Mistral', z_ai: 'GLM', gemini: 'Gemini', bedrock: 'AWS Bedrock', vertex: 'Vertex AI' };
            return Errors.configError(c, `API Key ${providerNames[provider] || provider} belum dikonfigurasi.`);
        }

        // Get All Settings for prompt context
        const { results: allSettingsRows } = await c.env.DB.prepare(
            "SELECT key, value FROM settings"
        ).all();
        const settings = allSettingsRows.reduce((acc: any, row: any) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        const prompt = buildLaporanPrompt({
            judul_laporan,
            periode,
            program_kerja_judul,
            tema,
            narasumber,
            tempat,
            settings
        });

        const generatedText = await callAI(provider as any, apiKey as string, prompt);

        // Robust parsing logic
        const extractRegex = (startPattern: RegExp, endPattern: RegExp | null = null): string => {
            try {
                const matchStart = generatedText.match(startPattern);
                if (!matchStart) return '';

                const startIndex = matchStart.index! + matchStart[0].length;
                let endIndex = generatedText.length;

                if (endPattern) {
                    const restOfText = generatedText.slice(startIndex);
                    const matchEnd = restOfText.match(endPattern);
                    if (matchEnd) {
                        endIndex = startIndex + matchEnd.index!;
                    } else {
                        const nextChapter = restOfText.match(/\nBAB\s+[IVX]+/i);
                        if (nextChapter) endIndex = startIndex + nextChapter.index!;
                    }
                }

                let content = generatedText.substring(startIndex, endIndex).trim();
                content = content.replace(/^[:\-\s]+/, '').trim();
                return content;
            } catch (e) {
                return '';
            }
        };

        const p = (str: string) => new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?\\s*${str}\\s*(?:\\*\\*)?\\s*(?:$|\\n|:)`, 'i');
        const bab = (num: string, title: string) => new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?\\s*BAB\\s+${num}[:\\s]+${title}\\s*(?:\\*\\*)?\\s*(?:$|\\n)`, 'i');

        const parsed = {
            pendahuluan_latar_belakang: extractRegex(p('A\\.\\s*Latar\\s*Belakang'), p('B\\.\\s*Tujuan')),
            pendahuluan_tujuan: extractRegex(p('B\\.\\s*Tujuan'), p('C\\.\\s*Manfaat')),
            pendahuluan_manfaat: extractRegex(p('C\\.\\s*Manfaat'), bab('II', 'PELAKSANAAN')),
            pelaksanaan_waktu_tempat: extractRegex(p('A\\.\\s*Waktu\\s*dan\\s*Tempat'), p('B\\.\\s*Materi')),
            pelaksanaan_materi: extractRegex(p('B\\.\\s*Materi\\s*Kegiatan'), p('C\\.\\s*Narasumber')),
            pelaksanaan_peserta: extractRegex(p('C\\.\\s*Narasumber\\s*dan\\s*Peserta'), bab('III', 'HASIL')),
            hasil_uraian: extractRegex(p('A\\.\\s*Uraian\\s*Jalannya\\s*Kegiatan'), p('B\\.\\s*Tindak\\s*Lanjut')),
            hasil_tindak_lanjut: extractRegex(p('B\\.\\s*Tindak\\s*Lanjut'), p('C\\.\\s*Dampak')),
            hasil_dampak: extractRegex(p('C\\.\\s*Dampak'), bab('IV', 'PENUTUP')),
            penutup_simpulan: extractRegex(p('A\\.\\s*Simpulan'), p('B\\.\\s*Saran')),
            penutup_saran: extractRegex(p('B\\.\\s*Saran'), null)
        };

        return successResponse(c, parsed);

    } catch (e: any) {
        console.error('Error generating AI content:', e);
        return c.json({
            success: false,
            error: {
                code: ErrorCodes.AI_ERROR,
                message: e.message || 'Gagal menghubungkan ke AI. Silakan coba lagi.',
            }
        }, 500);
    }
});

// GET /api/laporan - List all laporan (with auth)
laporan.get('/', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    try {
        let query = `SELECT l.*, u.nama as pembuat FROM laporan_kegiatan l LEFT JOIN users u ON l.user_id = u.id`;
        let params: any[] = [];

        // If not admin/operator, only show own reports
        if (user.role !== 'admin' && user.role !== 'operator') {
            query += ` WHERE l.user_id = ?`;
            params.push(user.id);
        }

        query += ` ORDER BY l.created_at DESC`;

        const { results } = await c.env.DB.prepare(query).bind(...params).all();

        const processedResults = (results || []).map(row => ({
            ...row,
            lampiran_foto: (row as any).lampiran_foto ? JSON.parse((row as any).lampiran_foto as string) : []
        }));

        return successResponse(c, processedResults);
    } catch (e) {
        return Errors.internal(c);
    }
});

// GET /api/laporan/:id - Get single laporan details
laporan.get('/:id', async (c) => {
    const id = c.req.param('id');
    const { user, allowed, notFound } = await checkLaporanAccess(c, id);

    if (!user) return Errors.unauthorized(c);
    if (notFound) return Errors.notFound(c, 'Laporan');
    if (!allowed) return Errors.forbidden(c);

    try {
        const result = await c.env.DB.prepare(
            `SELECT * FROM laporan_kegiatan WHERE id = ?`
        ).bind(id).first();

        const data = {
            ...result,
            lampiran_foto: (result as any).lampiran_foto ? JSON.parse((result as any).lampiran_foto as string) : []
        };

        return successResponse(c, data);
    } catch (e) {
        return Errors.internal(c);
    }
});

// POST /api/laporan - Create new laporan
laporan.post('/', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    try {
        const body = await c.req.json<LaporanData>();

        const result = await c.env.DB.prepare(`
            INSERT INTO laporan_kegiatan (
                user_id, program_kerja_id, judul_laporan, periode,
                pendahuluan_latar_belakang, pendahuluan_tujuan, pendahuluan_manfaat,
                pelaksanaan_waktu_tempat, pelaksanaan_materi, pelaksanaan_peserta,
                hasil_uraian, hasil_tindak_lanjut, hasil_dampak,
                penutup_simpulan, penutup_saran,
                lampiran_foto, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            user.id, body.program_kerja_id || null, body.judul_laporan, body.periode,
            body.pendahuluan_latar_belakang, body.pendahuluan_tujuan, body.pendahuluan_manfaat,
            body.pelaksanaan_waktu_tempat, body.pelaksanaan_materi, body.pelaksanaan_peserta,
            body.hasil_uraian, body.hasil_tindak_lanjut, body.hasil_dampak,
            body.penutup_simpulan, body.penutup_saran,
            JSON.stringify(body.lampiran_foto || []), body.status || 'draft'
        ).run();

        return successResponse(c, { id: result.meta.last_row_id }, 'Laporan berhasil dibuat', 201);
    } catch (e: any) {
        console.error('Error creating laporan:', e);
        return Errors.internal(c, e.message);
    }
});

// PUT /api/laporan/:id - Update laporan
laporan.put('/:id', async (c) => {
    const id = c.req.param('id');
    const { user, allowed, notFound } = await checkLaporanAccess(c, id);

    if (!user) return Errors.unauthorized(c);
    if (notFound) return Errors.notFound(c, 'Laporan');
    if (!allowed) return Errors.forbidden(c);

    try {
        const body = await c.req.json<LaporanData>();

        await c.env.DB.prepare(`
            UPDATE laporan_kegiatan SET
                judul_laporan = ?, periode = ?,
                pendahuluan_latar_belakang = ?, pendahuluan_tujuan = ?, pendahuluan_manfaat = ?,
                pelaksanaan_waktu_tempat = ?, pelaksanaan_materi = ?, pelaksanaan_peserta = ?,
                hasil_uraian = ?, hasil_tindak_lanjut = ?, hasil_dampak = ?,
                penutup_simpulan = ?, penutup_saran = ?,
                lampiran_foto = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            body.judul_laporan, body.periode,
            body.pendahuluan_latar_belakang, body.pendahuluan_tujuan, body.pendahuluan_manfaat,
            body.pelaksanaan_waktu_tempat, body.pelaksanaan_materi, body.pelaksanaan_peserta,
            body.hasil_uraian, body.hasil_tindak_lanjut, body.hasil_dampak,
            body.penutup_simpulan, body.penutup_saran,
            JSON.stringify(body.lampiran_foto || []), body.status,
            id
        ).run();

        return successResponse(c, null, 'Laporan berhasil diperbarui');
    } catch (e: any) {
        return Errors.internal(c, e.message);
    }
});

// DELETE /api/laporan/:id - Delete laporan
laporan.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const { user, allowed, notFound } = await checkLaporanAccess(c, id);

    if (!user) return Errors.unauthorized(c);
    if (notFound) return Errors.notFound(c, 'Laporan');
    if (!allowed) return Errors.forbidden(c);

    try {
        await c.env.DB.prepare(`DELETE FROM laporan_kegiatan WHERE id = ?`).bind(id).run();
        return successResponse(c, null, 'Laporan berhasil dihapus');
    } catch (e) {
        return Errors.internal(c);
    }
});

// GET /api/laporan/:id/docx - Generate DOCX
laporan.get('/:id/docx', async (c) => {
    const id = c.req.param('id');
    const { user, allowed, notFound } = await checkLaporanAccess(c, id);

    if (!user) return Errors.unauthorized(c);
    if (notFound) return Errors.notFound(c, 'Laporan');
    if (!allowed) return Errors.forbidden(c);

    try {
        const result: any = await c.env.DB.prepare(
            `SELECT * FROM laporan_kegiatan WHERE id = ?`
        ).bind(id).first();

        // Get Settings
        const { results: settingsRows } = await c.env.DB.prepare("SELECT key, value FROM settings").all();
        const settings = settingsRows.reduce((acc: any, row: any) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        const data = {
            ...result,
            lampiran_foto: result.lampiran_foto ? JSON.parse(result.lampiran_foto as string) : []
        } as unknown as LaporanData;

        const buffer = await generateLaporanBuffer(data, settings);

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Laporan_KKG_${data.judul_laporan.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`,
            },
        });
    } catch (e: any) {
        console.error('Download laporan DOCX error:', e, e.stack);
        return c.json({
            success: false,
            error: {
                code: 'DOCX_GENERATION_ERROR',
                message: `Gagal generate DOCX: ${e.message}`,
            }
        }, 500);
    }
});

export default laporan;
