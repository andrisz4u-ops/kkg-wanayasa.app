/**
 * Bank Soal Kolaboratif Routes
 * Persistent server-side question bank with search, filter, ratings, and sharing
 */

import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors } from '../lib/response';
import { BANK_SOAL_ACCESS_PREDICATE, BANK_SOAL_PUBLIC_PREDICATE, ensureBankSoalModerationSchema } from '../lib/bank-soal-policy';
import { AssessmentPackageWriteError, canonicalContent, copyAccessibleAssessmentPackage, createOwnedAssessmentPackage, findAssetIds, legacyImageSource, normalizeAssetUrls, preparePackageContent, saveOwnedAssessmentPackage, type LegacyImageSource } from '../lib/assessment-packages';
import { readBoundedJson } from '../lib/document-drafts';
import { ASSESSMENT_ASSET_MAX_BYTES, ASSESSMENT_ASSET_OWNER_MAX_BYTES, ASSESSMENT_ASSET_OWNER_MAX_COUNT, ingestTrustedAssessmentImage, TrustedImageIngestError } from '../lib/assessment-assets';
import { assessmentSvgDataUri } from '../lib/assessment-package-svg';

type Bindings = { DB: D1Database };

function blobBytes(blob: unknown): Uint8Array {
    if (blob instanceof Uint8Array) return blob;
    if (blob instanceof ArrayBuffer) return new Uint8Array(blob);
    if (ArrayBuffer.isView(blob)) return new Uint8Array(blob.buffer, blob.byteOffset, blob.byteLength);
    if (Array.isArray(blob) && blob.every(value => Number.isInteger(value) && value >= 0 && value <= 255)) return Uint8Array.from(blob);
    throw new Error('Invalid D1 asset BLOB');
}

function packageInputError(c: any, error: any) {
    const reason = error?.message;
    if (error instanceof AssessmentPackageWriteError && reason === 'document_id_conflict') return Errors.conflict(c, 'clientDocumentId sudah digunakan untuk konten berbeda');
    if (error instanceof AssessmentPackageWriteError && reason === 'generation_fenced_conflict') return Errors.conflict(c, 'Permintaan generator sudah berakhir atau tidak cocok dengan identitas paket; hasil belum disimpan');
    if (error instanceof AssessmentPackageWriteError && reason === 'stale_revision') return Errors.conflict(c, 'Paket berubah sejak terakhir dimuat; perubahan lokal dipertahankan');
    if (error instanceof AssessmentPackageWriteError && reason === 'package_missing') return Errors.notFound(c, 'Paket tidak ditemukan');
    if (error instanceof AssessmentPackageWriteError && reason === 'forbidden') return Errors.forbidden(c, 'Hanya pemilik paket yang dapat menyimpan perubahan');
    if (error instanceof AssessmentPackageWriteError && reason === 'source_unavailable') return Errors.notFound(c, 'Paket sumber tidak tersedia');
    if (error instanceof AssessmentPackageWriteError && reason === 'quota_count') return Errors.validation(c, 'Kuota aset pemilik terlampaui saat menyalin paket');
    if (error instanceof AssessmentPackageWriteError && reason === 'quota_bytes') return c.json({ success: false, error: { message: 'Kuota byte aset pemilik terlampaui saat menyalin paket' } }, 413);
    if (reason === 'content_too_large') return c.json({ success: false, error: { message: 'Konten melebihi batas 1 MiB' } }, 413);
    if (error instanceof AssessmentPackageWriteError && reason === 'image_recovery_limit') return Errors.validation(c, 'Batas gambar paket atau kuota tidak mencukupi untuk pemulihan; unggah ulang gambar secara bertahap');
    if (error instanceof AssessmentPackageWriteError && reason === 'untrusted_svg') return Errors.validation(c, 'SVG tidak aman atau tidak valid');
    if (['too_many_assets', 'package_assets_too_large', 'asset_not_owned'].includes(reason)) return Errors.validation(c, 'Referensi gambar tidak valid atau batas gambar paket terlampaui');
    if (['invalid_content', 'invalid_image_reference'].includes(reason)) return Errors.validation(c, 'Konten atau referensi gambar tidak valid');
    console.error('Assessment package write failed:', reason || 'unknown');
    return Errors.internal(c);
}

const banksoal = new Hono<{ Bindings: Bindings }>();

// ============================================
// Self-healing: ensure tables exist
// ============================================
export async function ensureBankSoalTables(db: D1Database): Promise<void> {
    await ensureBankSoalModerationSchema(db);
    const columns = await db.prepare('PRAGMA table_info(bank_soal)').all();
    const existing = new Set((columns.results || []).map((col: any) => col.name));
    for (const [name, declaration] of [['revision', 'INTEGER NOT NULL DEFAULT 1'], ['content_hash', 'TEXT'], ['client_document_id', 'TEXT'], ['content_write_token', 'TEXT'], ['copy_source_id', 'INTEGER'], ['copy_source_revision', 'INTEGER'], ['copy_source_hash', 'TEXT']] as const) {
        if (!existing.has(name)) await db.prepare(`ALTER TABLE bank_soal ADD COLUMN ${name} ${declaration}`).run();
    }
    await db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_soal_owner_client_document ON bank_soal(user_id, client_document_id) WHERE client_document_id IS NOT NULL').run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS bank_soal_assets (bank_soal_id INTEGER NOT NULL, asset_id TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(bank_soal_id,asset_id), FOREIGN KEY(bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE, FOREIGN KEY(asset_id) REFERENCES assessment_image_assets(id) ON DELETE CASCADE)`).run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_assets_asset ON bank_soal_assets(asset_id)').run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS bank_soal_write_tokens (token TEXT PRIMARY KEY, bank_soal_id INTEGER NOT NULL, revision INTEGER NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS bank_soal_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bank_soal_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                komentar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(bank_soal_id, user_id)
            )`).run();
    await db.batch([
        db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_user ON bank_soal(user_id)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_mapel ON bank_soal(mata_pelajaran)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_kelas ON bank_soal(jenjang_kelas)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_created ON bank_soal(created_at DESC)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_bank_soal_reviews_bs ON bank_soal_reviews(bank_soal_id)'),
    ]);
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

    where += ` AND ${BANK_SOAL_ACCESS_PREDICATE}`;
    params.push((user as any).id);

    if (mine === '1') {
        where += ` AND bs.user_id = ?`;
        params.push((user as any).id);
    }

    if (mapel) {
        where += ` AND (LOWER(bs.mata_pelajaran) = LOWER(?) OR LOWER(bs.mata_pelajaran) LIKE LOWER(?))`;
        params.push(mapel, `%${mapel}%`);
    }
    if (kelas) {
        const num = kelas.replace(/[^0-9]/g, '');
        if (num) {
            where += ` AND (LOWER(bs.jenjang_kelas) = LOWER(?) OR LOWER(bs.jenjang_kelas) = LOWER(?) OR LOWER(bs.jenjang_kelas) = ?)`;
            params.push(kelas, `Kelas ${num}`, num);
        } else {
            where += ` AND LOWER(bs.jenjang_kelas) = LOWER(?)`;
            params.push(kelas);
        }
    }
    if (topik) {
        where += ` AND LOWER(bs.topik) LIKE LOWER(?)`;
        params.push(`%${topik}%`);
    }
    if (jenis) {
        where += ` AND LOWER(bs.jenis_ujian) = LOWER(?)`;
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
                    bs.is_public, bs.moderation_status, bs.is_hidden, bs.use_count, bs.avg_rating, bs.total_reviews,
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
            c.env.DB.prepare(`SELECT COUNT(*) as total FROM bank_soal bs WHERE ${BANK_SOAL_PUBLIC_PREDICATE}`).first(),
            c.env.DB.prepare(`
                SELECT mata_pelajaran, COUNT(*) as count
                FROM bank_soal bs WHERE ${BANK_SOAL_PUBLIC_PREDICATE}
                GROUP BY mata_pelajaran ORDER BY count DESC LIMIT 10
            `).all(),
            c.env.DB.prepare(`
                SELECT jenjang_kelas, COUNT(*) as count
                FROM bank_soal bs WHERE ${BANK_SOAL_PUBLIC_PREDICATE}
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

// Moderator queue contains only explicit owner submissions (never private items).
banksoal.get('/moderation/queue', async (c) => {
    const token = getCookie(c.req.header('Cookie') || '', 'session') || c.req.header('Authorization')?.replace(/^Bearer /, '');
    const user: any = await getCurrentUser(c.env.DB, token);
    if (!user) return Errors.unauthorized(c);
    if (user.role !== 'admin') return Errors.forbidden(c, 'Akses moderator admin diperlukan');
    await ensureBankSoalTables(c.env.DB);
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')));
    const rows = await c.env.DB.prepare(`SELECT id, user_id, user_nama, mata_pelajaran, topik, jenjang_kelas,
        content, moderation_status, is_hidden, revision, content_hash, created_at FROM bank_soal
        WHERE is_public = 1 AND legacy_compat = 0 AND moderation_status = 'pending'
        ORDER BY created_at ASC LIMIT ? OFFSET ?`).bind(limit, (page - 1) * limit).all();
    const count = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM bank_soal
        WHERE is_public = 1 AND legacy_compat = 0 AND moderation_status = 'pending'`).first() as any;
    return successResponse(c, { items: rows.results || [], pagination: { page, limit, total: count?.total || 0 } });
});

banksoal.post('/moderation/:id/:action', async (c) => {
    const token = getCookie(c.req.header('Cookie') || '', 'session') || c.req.header('Authorization')?.replace(/^Bearer /, '');
    const user: any = await getCurrentUser(c.env.DB, token);
    if (!user) return Errors.unauthorized(c);
    if (user.role !== 'admin') return Errors.forbidden(c, 'Akses moderator admin diperlukan');
    await ensureBankSoalTables(c.env.DB);
    const { id, action } = c.req.param();
    if (action !== 'approve' && action !== 'hide') return Errors.validation(c, 'Aksi moderasi tidak valid');
    const moderatedBody: any = await c.req.json().catch(() => ({}));
    const row: any = await c.env.DB.prepare(`SELECT id, is_public, legacy_compat, moderation_status, is_hidden, revision
        FROM bank_soal WHERE id = ?`).bind(id).first();
    if (!row) return Errors.notFound(c, 'Soal tidak ditemukan');
    if (!row.is_public || row.legacy_compat) return Errors.validation(c, 'Soal belum diajukan untuk berbagi');
    if (!Number.isSafeInteger(moderatedBody.expectedRevision) || moderatedBody.expectedRevision < 1) return Errors.validation(c, 'expectedRevision wajib berupa bilangan bulat positif');
    if (moderatedBody.expectedRevision !== Number(row.revision)) return Errors.conflict(c, 'Revisi paket berubah; muat ulang antrean moderasi');
    const expectedRevision = moderatedBody.expectedRevision;
    const auditAction = action === 'approve' ? 'approved' : 'hidden';
    const eventId = crypto.randomUUID();
    let moderationUpdate: D1PreparedStatement;
    if (action === 'approve') {
        moderationUpdate = c.env.DB.prepare(`UPDATE bank_soal SET moderation_status = 'approved', is_hidden = 0,
            moderation_actor_id = ?, moderation_at = CURRENT_TIMESTAMP, moderation_event_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND revision = ? AND is_public = 1 AND legacy_compat = 0 AND (moderation_status != 'approved' OR is_hidden != 0)`).bind(user.id, eventId, id, expectedRevision);
    } else {
        moderationUpdate = c.env.DB.prepare(`UPDATE bank_soal SET is_hidden = 1, moderation_actor_id = ?,
            moderation_at = CURRENT_TIMESTAMP, moderation_event_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND revision = ? AND is_public = 1 AND legacy_compat = 0 AND is_hidden = 0`).bind(user.id, eventId, id, expectedRevision);
    }
    // D1 batch is atomic. The event token ties the audit insert to the exact
    // conditional state transition, so concurrent no-op retries add no audit.
    const batchResults: any[] = await c.env.DB.batch([
        moderationUpdate,
        c.env.DB.prepare(`INSERT INTO bank_soal_moderation_audit (bank_soal_id, actor_id, action)
            SELECT id, ?, ? FROM bank_soal WHERE id = ? AND moderation_event_id = ?`).bind(user.id, auditAction, id, eventId),
    ]);
    if (!batchResults[0]?.meta?.changes) {
        const current: any = await c.env.DB.prepare(`SELECT id, is_public, legacy_compat, moderation_status, is_hidden
            FROM bank_soal WHERE id = ?`).bind(id).first();
        if (!current) return Errors.notFound(c, 'Soal tidak ditemukan');
        const stillEligible = current.is_public === 1 && current.legacy_compat === 0;
        const alreadyDesired = action === 'approve'
            ? current.moderation_status === 'approved' && current.is_hidden === 0
            : current.is_hidden === 1;
        if (stillEligible && alreadyDesired) return successResponse(c, { moderated: true, action: auditAction });
        return Errors.conflict(c, 'Status berbagi atau moderasi telah berubah; muat ulang dan coba lagi');
    }
    return successResponse(c, { moderated: true, action: auditAction });
});

// ============================================
// GET /api/banksoal/:id - Detail Single Soal
// ============================================
banksoal.get('/:id/assets/:assetId', async (c) => {
    const token = getCookie(c.req.header('Cookie') || '', 'session') || c.req.header('Authorization')?.replace(/^Bearer /, '');
    const user: any = await getCurrentUser(c.env.DB, token);
    if (!user) return Errors.unauthorized(c);
    await ensureBankSoalTables(c.env.DB);
    const { id, assetId } = c.req.param();
    const row: any = await c.env.DB.prepare(`SELECT a.mime, a.bytes FROM assessment_image_assets a JOIN bank_soal_assets bsa ON bsa.asset_id = a.id JOIN bank_soal bs ON bs.id = bsa.bank_soal_id WHERE bs.id = ? AND a.id = ? AND ${BANK_SOAL_ACCESS_PREDICATE}`)
        .bind(id, assetId, user.id).first();
    if (!row) return Errors.notFound(c, 'Gambar tidak ditemukan');
    const bytes = blobBytes(row.bytes);
    return new Response(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, { headers: { 'Content-Type': row.mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
});

banksoal.post('/:id/copy', async (c) => {
    const token = getCookie(c.req.header('Cookie') || '', 'session') || c.req.header('Authorization')?.replace(/^Bearer /, '');
    const user: any = await getCurrentUser(c.env.DB, token);
    if (!user) return Errors.unauthorized(c);
    await ensureBankSoalTables(c.env.DB);
    const parsed = await readBoundedJson(c.req.raw);
    if (!parsed.ok) return parsed.reason === 'too_large'
        ? c.json({ success: false, error: { message: 'Request melebihi batas 1 MiB' } }, 413)
        : Errors.validation(c, 'Payload JSON tidak valid atau terlalu dalam');
    try {
        const result = await copyAccessibleAssessmentPackage(c.env.DB, {
            ownerId: user.id,
            ownerName: user.nama || 'Guru',
            ownerSchool: user.sekolah || '',
            sourcePackageId: c.req.param('id'),
            clientDocumentId: (parsed.value as any).clientDocumentId || null,
        });
        return successResponse(c, { id: result.packageId, packageId: result.packageId, revision: result.revision,
            saveStatus: result.saveStatus, imageWarnings: result.imageWarnings, content: result.content, is_public: false, moderation_status: 'private' });
    } catch (error: any) { return packageInputError(c, error); }
});

banksoal.post('/:id/recover-images', async (c) => {
    const token = getCookie(c.req.header('Cookie') || '', 'session') || c.req.header('Authorization')?.replace(/^Bearer /, '');
    const user: any = await getCurrentUser(c.env.DB, token);
    if (!user) return Errors.unauthorized(c);
    await ensureBankSoalTables(c.env.DB);
    const parsed = await readBoundedJson(c.req.raw);
    if (!parsed.ok) return parsed.reason === 'too_large'
        ? c.json({ success: false, error: { message: 'Request melebihi batas 1 MiB' } }, 413)
        : Errors.validation(c, 'Payload JSON tidak valid atau terlalu dalam');
    const body: any = parsed.value;
    if (!Number.isSafeInteger(body.baseRevision) || body.baseRevision < 1) return Errors.validation(c, 'baseRevision wajib berupa bilangan bulat positif');
    const packageId = c.req.param('id');
    const packageRow: any = await c.env.DB.prepare('SELECT id,user_id,revision,content FROM bank_soal WHERE id=?').bind(packageId).first();
    if (!packageRow) return Errors.notFound(c, 'Paket tidak ditemukan');
    if (Number(packageRow.user_id) !== Number(user.id)) return Errors.forbidden(c, 'Hanya pemilik paket yang dapat memulihkan gambar');
    if (Number(packageRow.revision) !== body.baseRevision) return Errors.conflict(c, 'Paket berubah; muat ulang sebelum memulihkan gambar');

    let content: any;
    try { content = JSON.parse(String(packageRow.content)); }
    catch { return Errors.validation(c, 'Konten paket tidak dapat diproses'); }
    let knownIds: string[];
    try { canonicalContent(content); knownIds = findAssetIds(content); }
    catch (error: any) { return packageInputError(c, error); }
    const ownerAssets: any[] = knownIds.length
        ? (await c.env.DB.prepare(`SELECT a.id,a.byte_length FROM bank_soal_assets ba JOIN assessment_image_assets a ON a.id=ba.asset_id
            WHERE ba.bank_soal_id=? AND a.owner_id=? AND a.id IN (${knownIds.map(() => '?').join(',')})`).bind(packageId, user.id, ...knownIds).all()).results as any[]
        : [];
    const owned = new Map<string, number>(ownerAssets.map(asset => [asset.id, Number(asset.byte_length)]));
    const items: any[] = [];
    if (Array.isArray(content.pg)) items.push(...content.pg);
    if (content.isian && Array.isArray(content.isian.data)) items.push(...content.isian.data);
    if (Array.isArray(content.uraian)) items.push(...content.uraian);
    const warnings: string[] = [];
    const pending: Array<{ item: any; index: number; url: string }> = [];
    let rasterReferenceCount = 0;
    let contentChanged = false;
    for (const [index, item] of items.entries()) {
        if (!item || typeof item !== 'object') continue;
        let source: LegacyImageSource | null;
        try { source = legacyImageSource(item.gambar, item.svg); }
        catch (error: any) { return packageInputError(c, error); }
        let assetId = item.gambar && typeof item.gambar === 'object' && typeof item.gambar.assetId === 'string' ? item.gambar.assetId : null;
        if (assetId) {
            if (owned.has(assetId)) rasterReferenceCount++;
            else {
                const legacyImage = { ...item.gambar };
                delete legacyImage.assetId;
                item.gambar = legacyImage;
                assetId = null;
                try { source = legacyImageSource(legacyImage, item.svg); }
                catch (error: any) { return packageInputError(c, error); }
                if (!source) {
                    item.gambar = { imageUnavailable: true, imageUnavailableReason: 'asset_not_owned_or_missing' };
                    delete item.svg;
                    warnings.push(`Butir ${item.no ?? index + 1}: aset tidak lagi terkait pada paket ini; unggah ulang gambar asli.`);
                }
                contentChanged = true;
            }
            if (assetId) continue;
        }
        if (source?.kind === 'svg') {
            item.gambar = { ...(item.gambar && typeof item.gambar === 'object' ? item.gambar : {}), type: 'svg', svg: source.svg, url: assessmentSvgDataUri(source.svg) };
            delete item.svg;
            contentChanged = true;
        } else if (source?.kind === 'raster') {
            rasterReferenceCount++;
            pending.push({ item, index, url: source.url });
        } else if (item.gambar?.imageUnavailable === true) {
            warnings.push(`Butir ${item.no ?? index + 1}: sumber gambar asli tidak tersimpan; unggah ulang gambar asli.`);
        }
    }
    const uniqueSources = new Set(pending.map(item => item.url));
    if (rasterReferenceCount > 8) return Errors.validation(c, 'Pemulihan dibatalkan: paket melebihi delapan referensi gambar');
    const currentBytes = [...owned.values()].reduce((sum, value) => sum + value, 0);
    if (currentBytes + uniqueSources.size * ASSESSMENT_ASSET_MAX_BYTES > 4 * 1024 * 1024) return Errors.validation(c, 'Pemulihan dibatalkan: batas 4 MiB gambar paket akan terlampaui');
    if (uniqueSources.size) {
        const ownerQuota: any = await c.env.DB.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(byte_length),0) AS bytes FROM assessment_image_assets WHERE owner_id=?').bind(user.id).first();
        if (Number(ownerQuota?.count) + uniqueSources.size > ASSESSMENT_ASSET_OWNER_MAX_COUNT || Number(ownerQuota?.bytes) + uniqueSources.size * ASSESSMENT_ASSET_MAX_BYTES > ASSESSMENT_ASSET_OWNER_MAX_BYTES) {
            return Errors.validation(c, 'Pemulihan dibatalkan sebelum unduh karena kuota aset pemilik tidak mencukupi');
        }
    }
    const fetched = new Map<string, { asset?: any; reason?: string }>();
    for (const plan of pending) {
        let result = fetched.get(plan.url);
        if (!result) {
            try { result = { asset: await ingestTrustedAssessmentImage(c.env.DB, user.id, plan.url) }; }
            catch (error: any) { result = { reason: error instanceof TrustedImageIngestError ? error.reason : 'fetch_failed' }; }
            fetched.set(plan.url, result);
        }
        const metadata = plan.item.gambar && typeof plan.item.gambar === 'object' ? plan.item.gambar : {};
        if (result.asset) {
            plan.item.gambar = { ...metadata, assetId: result.asset.assetId, url: result.asset.url };
            delete plan.item.gambar.imageUnavailable;
            delete plan.item.gambar.imageUnavailableReason;
            delete plan.item.gambar.imageWarningReason;
            delete plan.item.svg;
        } else {
            const reason = result.reason || 'fetch_failed';
            plan.item.gambar = { ...metadata, imageUnavailable: true, imageUnavailableReason: reason };
            delete plan.item.svg;
            warnings.push(`Butir ${plan.item.no ?? plan.index + 1}: gambar tidak dapat dipulihkan (${reason}); unggah ulang gambar asli.`);
        }
        contentChanged = true;
    }
    let prepared: ReturnType<typeof preparePackageContent>;
    try { prepared = preparePackageContent(content); }
    catch (error: any) { return packageInputError(c, error); }
    contentChanged ||= prepared.json !== String(packageRow.content);
    if (!contentChanged) {
        const normalized = normalizeAssetUrls(prepared.content, packageRow.id);
        return successResponse(c, { packageId: Number(packageRow.id), revision: Number(packageRow.revision), saveStatus: 'saved', content: normalized.content,
            imageWarnings: [...warnings, ...prepared.warnings, ...normalized.warnings] });
    }
    try {
        const saved = await saveOwnedAssessmentPackage(c.env.DB, { ownerId: user.id, packageId, baseRevision: body.baseRevision, content: prepared.content });
        return successResponse(c, { packageId: saved.packageId, revision: saved.revision, saveStatus: saved.saveStatus, content: saved.content,
            imageWarnings: [...warnings, ...prepared.warnings, ...saved.imageWarnings] });
    } catch (error: any) { return packageInputError(c, error); }
});

banksoal.put('/:id', async (c) => {
    const token = getCookie(c.req.header('Cookie') || '', 'session') || c.req.header('Authorization')?.replace(/^Bearer /, '');
    const user: any = await getCurrentUser(c.env.DB, token);
    if (!user) return Errors.unauthorized(c);
    await ensureBankSoalTables(c.env.DB);
    const id = c.req.param('id');
    try {
        const parsedBody = await readBoundedJson(c.req.raw);
        if (!parsedBody.ok) return parsedBody.reason === 'too_large'
            ? c.json({ success: false, error: { message: 'Request melebihi batas 1 MiB' } }, 413)
            : Errors.validation(c, 'Payload JSON tidak valid atau terlalu dalam');
        const body: any = parsedBody.value;
        if (!Number.isInteger(body.baseRevision) || body.baseRevision < 1) return Errors.validation(c, 'baseRevision wajib berupa bilangan bulat positif');
        const visibility: any = await c.env.DB.prepare('SELECT is_public, moderation_status FROM bank_soal WHERE id = ? AND user_id = ?').bind(id, user.id).first();
        if (!visibility) {
            const exists: any = await c.env.DB.prepare('SELECT user_id FROM bank_soal WHERE id = ?').bind(id).first();
            return exists ? Errors.forbidden(c, 'Hanya pemilik paket yang dapat menyimpan perubahan') : Errors.notFound(c, 'Paket tidak ditemukan');
        }
        if (body.is_public !== undefined && body.is_public !== Boolean(visibility.is_public)) return Errors.validation(c, 'Ubah niat berbagi melalui endpoint share khusus');
        const saved = await saveOwnedAssessmentPackage(c.env.DB, { ownerId: user.id, packageId: id, baseRevision: body.baseRevision, content: body.content });
        return successResponse(c, { packageId: saved.packageId, revision: saved.revision, saveStatus: saved.saveStatus, imageWarnings: saved.imageWarnings });
    } catch (error: any) {
        return packageInputError(c, error);
    }
});

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
            `SELECT * FROM bank_soal bs WHERE bs.id = ? AND ${BANK_SOAL_ACCESS_PREDICATE}`
        ).bind(id, (user as any).id).first();

        if (!row) return Errors.notFound(c, 'Soal tidak ditemukan');

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
        const normalized = normalizeAssetUrls(content, (row as any).id);

        return successResponse(c, {
            ...row,
            content: normalized.content,
            _persistence: { packageId: (row as any).id, revision: Number((row as any).revision || 1), saveStatus: 'saved', imageWarnings: normalized.warnings },
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
        const parsedBody = await readBoundedJson(c.req.raw);
        if (!parsedBody.ok) return parsedBody.reason === 'too_large'
            ? c.json({ success: false, error: { message: 'Request melebihi batas 1 MiB' } }, 413)
            : Errors.validation(c, 'Payload JSON tidak valid atau terlalu dalam');
        const body: any = parsedBody.value;
        const {
            mata_pelajaran, topik, jenjang_kelas, semester, jenis_ujian,
            capaian_pembelajaran, jumlah_pg, jumlah_isian, jumlah_uraian,
            isian_type, hots_ratio, content, ai_provider, is_public, clientDocumentId
        } = body;

        if (!mata_pelajaran || !topik || !jenjang_kelas || !content) {
            return Errors.validation(c, 'Field mata_pelajaran, topik, jenjang_kelas, dan content wajib diisi');
        }

        const created = await createOwnedAssessmentPackage(c.env.DB, {
            ownerId: user.id,
            clientDocumentId: clientDocumentId || null,
            content,
            metadata: {
                user_nama: user.nama,
                sekolah: user.sekolah || '',
                mata_pelajaran,
                topik,
                jenjang_kelas,
                semester,
                jenis_ujian,
                capaian_pembelajaran,
                jumlah_pg: Number(jumlah_pg) || 0,
                jumlah_isian: Number(jumlah_isian) || 0,
                jumlah_uraian: Number(jumlah_uraian) || 0,
                isian_type: isian_type || 'Standard',
                hots_ratio: hots_ratio || '30:40:30',
                ai_provider: ai_provider || null,
            },
        });
        const imageUrls = normalizeAssetUrls(created.content, created.packageId);
        return successResponse(c, { id: created.packageId, packageId: created.packageId, revision: created.revision, saved: true, saveStatus: created.saveStatus, ...created.visibility, _persistence: { packageId: created.packageId, revision: created.revision, saveStatus: 'saved', imageWarnings: imageUrls.warnings } });
    } catch (e: any) {
        return packageInputError(c, e);
    }
});

// ============================================
// DELETE /api/banksoal/:id - Delete Own Soal
// ============================================
banksoal.post('/:id/share', async (c) => {
    const token = getCookie(c.req.header('Cookie') || '', 'session') || c.req.header('Authorization')?.replace(/^Bearer /, '');
    const user: any = await getCurrentUser(c.env.DB, token);
    if (!user) return Errors.unauthorized(c);
    await ensureBankSoalTables(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => null);
    if (typeof body?.share !== 'boolean') return Errors.validation(c, 'Field share harus boolean');
    const existing: any = await c.env.DB.prepare('SELECT user_id FROM bank_soal WHERE id = ?').bind(id).first();
    if (!existing) return Errors.notFound(c, 'Soal tidak ditemukan');
    if (existing.user_id !== user.id) return Errors.forbidden(c, 'Hanya pemilik yang dapat mengubah niat berbagi');
    if (body.share) {
        await c.env.DB.prepare(`UPDATE bank_soal SET is_public = 1, legacy_compat = 0, moderation_status = 'pending',
            is_hidden = 0, moderation_actor_id = NULL, moderation_at = NULL, moderation_event_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`)
            .bind(id, user.id).run();
        return successResponse(c, { is_public: true, moderation_status: 'pending' });
    }
    const eventId = crypto.randomUUID();
    await c.env.DB.batch([
        c.env.DB.prepare(`UPDATE bank_soal SET is_public = 0, legacy_compat = 0, moderation_status = 'private', is_hidden = 0,
            moderation_actor_id = ?, moderation_at = CURRENT_TIMESTAMP, moderation_event_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ? AND (is_public != 0 OR legacy_compat != 0 OR moderation_status != 'private' OR is_hidden != 0)`)
            .bind(user.id, eventId, id, user.id),
        c.env.DB.prepare(`INSERT INTO bank_soal_moderation_audit (bank_soal_id, actor_id, action)
            SELECT id, ?, 'share_withdrawn' FROM bank_soal WHERE id = ? AND moderation_event_id = ?`).bind(user.id, id, eventId),
    ]);
    return successResponse(c, { is_public: false, moderation_status: 'private' });
});

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
        await ensureBankSoalTables(c.env.DB);
        const updated: any = await c.env.DB.prepare(`UPDATE bank_soal AS bs SET use_count = use_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE bs.id = ? AND ${BANK_SOAL_ACCESS_PREDICATE}`).bind(id, (user as any).id).run();
        if (!updated.meta?.changes) return Errors.notFound(c, 'Soal tidak ditemukan');
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
            `SELECT bs.id, bs.user_id FROM bank_soal bs WHERE bs.id = ? AND ${BANK_SOAL_ACCESS_PREDICATE}`
        ).bind(id, user.id).first();
        if (!soal) return Errors.notFound(c, 'Soal tidak ditemukan');

        // Can't review own soal
        if ((soal as any).user_id === user.id) {
            return Errors.validation(c, 'Anda tidak bisa memberi rating pada soal sendiri');
        }

        // Atomically guard the write and cache refresh against an owner withdrawing
        // sharing after the earlier self-review/access check.
        const results: any[] = await c.env.DB.batch([c.env.DB.prepare(`
            INSERT INTO bank_soal_reviews (bank_soal_id, user_id, rating, komentar)
            SELECT bs.id, ?, ?, ? FROM bank_soal bs
            WHERE bs.id = ? AND ${BANK_SOAL_PUBLIC_PREDICATE} AND bs.user_id != ?
            ON CONFLICT(bank_soal_id, user_id) DO UPDATE SET
                rating = excluded.rating,
                komentar = excluded.komentar,
                created_at = CURRENT_TIMESTAMP
        `).bind(user.id, parseInt(rating), komentar || null, id, user.id),

        // Keep the cached aggregate in the same atomic D1 batch.
        c.env.DB.prepare(`
            UPDATE bank_soal AS bs SET
                avg_rating = COALESCE((SELECT AVG(rating) FROM bank_soal_reviews WHERE bank_soal_id = ?), 0),
                total_reviews = (SELECT COUNT(*) FROM bank_soal_reviews WHERE bank_soal_id = ?),
                updated_at = CURRENT_TIMESTAMP
            WHERE bs.id = ? AND ${BANK_SOAL_PUBLIC_PREDICATE}
        `).bind(id, id, id),
        ]);
        if (!results[0]?.meta?.changes) return Errors.notFound(c, 'Soal tidak ditemukan');

        return successResponse(c, { reviewed: true });
    } catch (e: any) {
        console.error('Bank Soal review error:', e);
        return Errors.internal(c, e.message);
    }
});

export default banksoal;
