/**
 * Telemetry & Analytics Helper for AI Generations
 * Non-blocking, isolated logging of RPP, Asesmen, and Slide generations
 */

export interface LogAIOptions {
    user_id?: number;
    user_nama?: string;
    sekolah?: string;
    feature_type: 'RPP' | 'ASESMEN' | 'SLIDE' | 'TTS' | 'ANALISIS_CP';
    mata_pelajaran?: string;
    topik?: string;
    jenjang_kelas?: string;
    ai_provider?: string;
    duration_ms?: number;
}

/**
 * Record an AI generation event in ai_generation_logs.
 * Designed to be fire-and-forget / non-blocking: never throws error to caller.
 */
export async function recordAIGeneration(db: D1Database, opts: LogAIOptions): Promise<void> {
    try {
        const safeFeature = ['RPP', 'ASESMEN', 'SLIDE'].includes(opts.feature_type) ? opts.feature_type : 'RPP';
        const safeTopic = opts.feature_type === 'ANALISIS_CP' ? `[Analisis CP] ${opts.topik || ''}` : (opts.topik || null);

        await db.prepare(`
            INSERT INTO ai_generation_logs (
                user_id, user_nama, sekolah, feature_type,
                mata_pelajaran, topik, jenjang_kelas, ai_provider, duration_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            opts.user_id || 1,
            opts.user_nama || 'Guru',
            opts.sekolah || 'SD Negeri Binaan',
            safeFeature,
            opts.mata_pelajaran || null,
            safeTopic,
            opts.jenjang_kelas || null,
            opts.ai_provider || null,
            opts.duration_ms || 0
        ).run();
    } catch (e) {
        console.error('[Telemetry Warning] Failed to record AI generation log:', e);
        // Non-blocking fail-safe: never throw so the user always gets their generated document
    }
}
