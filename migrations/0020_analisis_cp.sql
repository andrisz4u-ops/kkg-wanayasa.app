-- Migration 0020: Add Analisis CP (Capaian Pembelajaran, TP, ATP) History
CREATE TABLE IF NOT EXISTS analisis_cp_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nama_sekolah TEXT NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    jenjang_kelas TEXT NOT NULL,
    fase TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    sumber_buku TEXT,
    content_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analisis_cp_user ON analisis_cp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analisis_cp_created ON analisis_cp_history(created_at);
