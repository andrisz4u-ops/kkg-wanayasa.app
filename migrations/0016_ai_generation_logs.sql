-- =============================================
-- Migration: Add AI Generation Logs (Telemetry) Table
-- Tracks real-time AI generation metrics per teacher & school
-- =============================================

CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_nama TEXT NOT NULL,
    sekolah TEXT NOT NULL,
    feature_type TEXT NOT NULL CHECK(feature_type IN ('RPP', 'ASESMEN', 'SLIDE')),
    mata_pelajaran TEXT,
    topik TEXT,
    jenjang_kelas TEXT,
    ai_provider TEXT,
    duration_ms INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gen_logs_sekolah ON ai_generation_logs(sekolah);
CREATE INDEX IF NOT EXISTS idx_gen_logs_feature ON ai_generation_logs(feature_type);
CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON ai_generation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_gen_logs_sekolah_created ON ai_generation_logs(sekolah, created_at);
