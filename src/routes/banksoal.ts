/**
 * Bank Soal Kolaboratif Routes
 * Persistent server-side question bank with search, filter, ratings, and sharing
 */

import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors } from '../lib/response';

type Bindings = { DB: D1Database };

const banksoal = new Hono<{ Bindings: Bindings }>();

// ============================================
// Self-healing: ensure tables exist
// ============================================
async function ensureBankSoalTables(db: D1Database): Promise<void> {
    try {
        await db.prepare('SELECT 1 FROM bank_soal LIMIT 1').first();
    } catch {
        // Table doesn't exist yet — create it
        await db.batch([
            db.prepare(`CREATE TABLE IF NOT EXISTS bank_soal (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_nama TEXT NOT NULL,
                sekolah TEXT,
                mata_pelajaran TEXT NOT NULL,
                topik TEXT NOT NULL,
                jenjang_kelas TEXT NOT NULL,
                semester TEXT,
                jenis_ujian TEXT,
                capaian_pembelajaran TEXT,
                jumlah_pg INTEGER DEFAULT 0,
                jumlah_isian INTEGER DEFAULT 0,
                jumlah_uraian INTEGER DEFAULT 0,
                isian_type TEXT DEFAULT 'Standard',
                hots_ratio TEXT DEFAULT '30:40:30',
                content TEXT NOT NULL,
                is_public INTEGER DEFAULT 1,
                use_count INTEGER DEFAULT 0,
                avg_rating REAL DEFAULT 0,
                total_reviews INTEGER DEFAULT 0,
                ai_provider TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`),
            db.prepare(`CREATE TABLE IF NOT EXISTS bank_soal_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bank_soal_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                komentar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(bank_soal_id, user_id)
            )`),
            db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_user ON bank_soal(user_id)'),
            db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_mapel ON bank_soal(mata_pelajaran)'),
            db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_kelas ON bank_soal(jenjang_kelas)'),
            db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_public ON bank_soal(is_public)'),
            db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_created ON bank_soal(created_at DESC)'),
            db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_reviews_bs ON bank_soal_reviews(bank_soal_id)'),
        ]);
    }
}

// ============================================
// GET /api/banksoal - Browse & Filter
// ============================================
banksoal.get('/', async (c) => {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureBankSoalTables(c.env.DB);

    const mapel = c.req.query('mapel') || '';
    const kelas = c.req.query('kelas') || '';
    const topik = c.req.query('topik') || '';
    const jenis = c.req.query('jenis') || '';
    const sort = c.req.query('sort') || 'newest';
    const mine = c.req.query('mine') || '';
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(50, Math.max(6, parseInt(c.req.query('limit') || '12')));
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    // Only show public soal OR own soal
    where += ` AND (bs.is_public = 1 OR bs.user_id = ?)`;
    params.push((user as any).id);

    if (mine === '1') {
        where += ` AND bs.user_id = ?`;
        params.push((user as any).id);
    }

    if (mapel) {
        where += ` AND bs.mata_pelajaran = ?`;
        params.push(mapel);
    }
    if (kelas) {
        where += ` AND bs.jenjang_kelas = ?`;
        params.push(kelas);
    }
    if (topik) {
        where += ` AND bs.topik LIKE ?`;
        params.push(`%${topik}%`);
    }
    if (jenis) {
        where += ` AND bs.jenis_ujian = ?`;
        params.push(jenis);
    }

    let orderBy = 'ORDER BY bs.created_at DESC';
    if (sort === 'popular') orderBy = 'ORDER BY bs.use_count DESC, bs.created_at DESC';
    if (sort === 'rating') orderBy = 'ORDER BY bs.avg_rating DESC, bs.total_reviews DESC, bs.created_at DESC';

    try {
        // Count total
        const countStmt = c.env.DB.prepare(
            `SELECT COUNT(*) as total FROM bank_soal bs ${where}`
        );
        const countResult = params.length > 0
            ? await countStmt.bind(...params).first()
            : await countStmt.first();
        const total = (countResult as any)?.total || 0;

        // Fetch page
        const dataQuery = `
            SELECT bs.id, bs.user_id, bs.user_nama, bs.sekolah,
                   bs.mata_pelajaran, bs.topik, bs.jenjang_kelas,
                   bs.semester, bs.jenis_ujian,
                   bs.jumlah_pg, bs.jumlah_isian, bs.jumlah_uraian,
                   bs.isian_type, bs.hots_ratio,
                   bs.is_public, bs.use_count, bs.avg_rating, bs.total_reviews,
                   bs.ai_provider, bs.created_at
            FROM bank_soal bs
            ${where}
            ${orderBy}
            LIMIT ? OFFSET ?
        `;
        const allParams = [...params, limit, offset];
        const dataStmt = c.env.DB.prepare(dataQuery);
        const dataResult = await dataStmt.bind(...allParams).all();

        return successResponse(c, {
            items: dataResult.results || [],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (e: any) {
        console.error('Bank Soal list error:', e);
        return Errors.internal(c, e.message);
    }
});

// ============================================
// GET /api/banksoal/stats - Summary Statistics
// ============================================
banksoal.get('/stats', async (c) => {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureBankSoalTables(c.env.DB);

    try {
        const [totalResult, mapelResult, kelasResult, myResult] = await Promise.all([
            c.env.DB.prepare('SELECT COUNT(*) as total FROM bank_soal WHERE is_public = 1').first(),
            c.env.DB.prepare(`
                SELECT mata_pelajaran, COUNT(*) as count
                FROM bank_soal WHERE is_public = 1
                GROUP BY mata_pelajaran ORDER BY count DESC LIMIT 10
            `).all(),
            c.env.DB.prepare(`
                SELECT jenjang_kelas, COUNT(*) as count
                FROM bank_soal WHERE is_public = 1
                GROUP BY jenjang_kelas ORDER BY jenjang_kelas ASC
            `).all(),
            c.env.DB.prepare(
                'SELECT COUNT(*) as total FROM bank_soal WHERE user_id = ?'
            ).bind((user as any).id).first(),
        ]);

        return successResponse(c, {
            total_soal: (totalResult as any)?.total || 0,
            my_soal: (myResult as any)?.total || 0,
            per_mapel: mapelResult.results || [],
            per_kelas: kelasResult.results || [],
        });
    } catch (e: any) {
        console.error('Bank Soal stats error:', e);
        return Errors.internal(c);
    }
});

// ============================================
// GET /api/banksoal/:id - Detail Single Soal
// ============================================
banksoal.get('/:id', async (c) => {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureBankSoalTables(c.env.DB);
    const id = c.req.param('id');

    try {
        const row = await c.env.DB.prepare(
            'SELECT * FROM bank_soal WHERE id = ?'
        ).bind(id).first();

        if (!row) return Errors.notFound(c, 'Soal tidak ditemukan');

        // Check access: public or own
        if (!(row as any).is_public && (row as any).user_id !== (user as any).id) {
            return Errors.forbidden(c, 'Soal ini bersifat privat');
        }

        // Parse content JSON
        let content = {};
        try { content = JSON.parse((row as any).content || '{}'); } catch { }

        // Get reviews
        const reviews = await c.env.DB.prepare(`
            SELECT r.*, u.nama as reviewer_nama
            FROM bank_soal_reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.bank_soal_id = ?
            ORDER BY r.created_at DESC
        `).bind(id).all();

        // Check if current user already reviewed
        const myReview = await c.env.DB.prepare(
            'SELECT * FROM bank_soal_reviews WHERE bank_soal_id = ? AND user_id = ?'
        ).bind(id, (user as any).id).first();

        return successResponse(c, {
            ...row,
            content,
            reviews: reviews.results || [],
            my_review: myReview || null,
            is_mine: (row as any).user_id === (user as any).id,
        });
    } catch (e: any) {
        console.error('Bank Soal detail error:', e);
        return Errors.internal(c);
    }
});

// ============================================
// POST /api/banksoal - Save New Soal
// ============================================
banksoal.post('/', async (c) => {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user: any = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureBankSoalTables(c.env.DB);

    try {
        const body = await c.req.json();
        const {
            mata_pelajaran, topik, jenjang_kelas, semester, jenis_ujian,
            capaian_pembelajaran, jumlah_pg, jumlah_isian, jumlah_uraian,
            isian_type, hots_ratio, content, ai_provider, is_public
        } = body;

        if (!mata_pelajaran || !topik || !jenjang_kelas || !content) {
            return Errors.validation(c, 'Field mata_pelajaran, topik, jenjang_kelas, dan content wajib diisi');
        }

        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

        const result = await c.env.DB.prepare(`
            INSERT INTO bank_soal (
                user_id, user_nama, sekolah, mata_pelajaran, topik,
                jenjang_kelas, semester, jenis_ujian, capaian_pembelajaran,
                jumlah_pg, jumlah_isian, jumlah_uraian, isian_type, hots_ratio,
                content, ai_provider, is_public
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            user.id, user.nama, user.sekolah || '',
            mata_pelajaran, topik, jenjang_kelas,
            semester || null, jenis_ujian || null, capaian_pembelajaran || null,
            parseInt(jumlah_pg) || 0, parseInt(jumlah_isian) || 0, parseInt(jumlah_uraian) || 0,
            isian_type || 'Standard', hots_ratio || '30:40:30',
            contentStr, ai_provider || null,
            is_public !== undefined ? (is_public ? 1 : 0) : 1
        ).run();

        return successResponse(c, { id: result.meta?.last_row_id, saved: true });
    } catch (e: any) {
        console.error('Bank Soal save error:', e);
        return Errors.internal(c, e.message);
    }
});

// ============================================
// DELETE /api/banksoal/:id - Delete Own Soal
// ============================================
banksoal.delete('/:id', async (c) => {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user: any = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    const id = c.req.param('id');

    try {
        const row = await c.env.DB.prepare(
            'SELECT user_id FROM bank_soal WHERE id = ?'
        ).bind(id).first();

        if (!row) return Errors.notFound(c, 'Soal tidak ditemukan');

        // Only owner or admin can delete
        if ((row as any).user_id !== user.id && user.role !== 'admin') {
            return Errors.forbidden(c, 'Anda hanya bisa menghapus soal milik sendiri');
        }

        await c.env.DB.prepare('DELETE FROM bank_soal WHERE id = ?').bind(id).run();
        return successResponse(c, { deleted: true });
    } catch (e: any) {
        console.error('Bank Soal delete error:', e);
        return Errors.internal(c);
    }
});

// ============================================
// POST /api/banksoal/:id/use - Track Usage
// ============================================
banksoal.post('/:id/use', async (c) => {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    const id = c.req.param('id');

    try {
        await c.env.DB.prepare(
            'UPDATE bank_soal SET use_count = use_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(id).run();
        return successResponse(c, { tracked: true });
    } catch (e: any) {
        console.error('Bank Soal use track error:', e);
        return Errors.internal(c);
    }
});

// ============================================
// POST /api/banksoal/:id/review - Rate & Review
// ============================================
banksoal.post('/:id/review', async (c) => {
    const cookieHeader = c.req.header('Cookie') || c.req.header('cookie') || c.req.raw?.headers?.get('cookie') || c.req.raw?.headers?.get('Cookie');
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const sessionId = getCookie(cookieHeader, 'session') || bearerToken;
    const user: any = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    const id = c.req.param('id');

    try {
        const body = await c.req.json();
        const { rating, komentar } = body;

        if (!rating || rating < 1 || rating > 5) {
            return Errors.validation(c, 'Rating harus antara 1 dan 5');
        }

        // Check soal exists
        const soal = await c.env.DB.prepare(
            'SELECT id, user_id FROM bank_soal WHERE id = ?'
        ).bind(id).first();
        if (!soal) return Errors.notFound(c, 'Soal tidak ditemukan');

        // Can't review own soal
        if ((soal as any).user_id === user.id) {
            return Errors.validation(c, 'Anda tidak bisa memberi rating pada soal sendiri');
        }

        // Upsert review (UNIQUE constraint on bank_soal_id, user_id)
        await c.env.DB.prepare(`
            INSERT INTO bank_soal_reviews (bank_soal_id, user_id, rating, komentar)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(bank_soal_id, user_id) DO UPDATE SET
                rating = excluded.rating,
                komentar = excluded.komentar,
                created_at = CURRENT_TIMESTAMP
        `).bind(id, user.id, parseInt(rating), komentar || null).run();

        // Manually update cache (in case trigger doesn't fire on ON CONFLICT UPDATE)
        await c.env.DB.prepare(`
            UPDATE bank_soal SET
                avg_rating = COALESCE((SELECT AVG(rating) FROM bank_soal_reviews WHERE bank_soal_id = ?), 0),
                total_reviews = (SELECT COUNT(*) FROM bank_soal_reviews WHERE bank_soal_id = ?),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(id, id, id).run();

        return successResponse(c, { reviewed: true });
    } catch (e: any) {
        console.error('Bank Soal review error:', e);
        return Errors.internal(c, e.message);
    }
});

export default banksoal;
