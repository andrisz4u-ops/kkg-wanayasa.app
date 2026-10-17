-- Preserve historical events, but distinguish them from events recorded after
-- feature names and user attribution were corrected.
CREATE TABLE ai_generation_logs_next (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_nama TEXT NOT NULL,
    sekolah TEXT NOT NULL,
    feature_type TEXT NOT NULL CHECK(feature_type IN (
        'RPP', 'ASESMEN', 'SLIDE', 'TTS', 'ANALISIS_CP',
        'PROGRAM_SEKOLAH', 'PROGRAM_SEKOLAH_SECTION'
    )),
    mata_pelajaran TEXT,
    topik TEXT,
    jenjang_kelas TEXT,
    ai_provider TEXT,
    duration_ms INTEGER DEFAULT 0,
    classification_quality TEXT NOT NULL DEFAULT 'verified'
        CHECK(classification_quality IN ('verified', 'legacy_uncertain')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO ai_generation_logs_next (
    id, user_id, user_nama, sekolah, feature_type, mata_pelajaran,
    topik, jenjang_kelas, ai_provider, duration_ms, classification_quality, created_at
)
SELECT id, user_id, user_nama, sekolah,
    CASE WHEN feature_type = 'RPP' AND substr(COALESCE(topik, ''), 1, 13) = '[Analisis CP]'
        THEN 'ANALISIS_CP' ELSE feature_type END,
    mata_pelajaran, topik, jenjang_kelas, ai_provider, duration_ms,
    'legacy_uncertain', created_at
FROM ai_generation_logs;

DROP TABLE ai_generation_logs;
ALTER TABLE ai_generation_logs_next RENAME TO ai_generation_logs;

CREATE INDEX idx_gen_logs_sekolah ON ai_generation_logs(sekolah);
CREATE INDEX idx_gen_logs_feature ON ai_generation_logs(feature_type);
CREATE INDEX idx_gen_logs_created ON ai_generation_logs(created_at);
CREATE INDEX idx_gen_logs_sekolah_created ON ai_generation_logs(sekolah, created_at);
