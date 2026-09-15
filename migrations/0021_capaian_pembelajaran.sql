-- Migration 0021: Add Capaian Pembelajaran (CP) Management Table
CREATE TABLE IF NOT EXISTS capaian_pembelajaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mata_pelajaran TEXT NOT NULL,
    fase TEXT NOT NULL, -- 'Fase A', 'Fase B', 'Fase C'
    teks_cp TEXT NOT NULL,
    elemen_json TEXT NOT NULL, -- JSON string format: { "Elemen": "Deskripsi CP Elemen" }
    regulasi TEXT DEFAULT 'BSKAP No. 046 Tahun 2025',
    updated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mata_pelajaran, fase)
);

CREATE INDEX IF NOT EXISTS idx_cp_mapel_fase ON capaian_pembelajaran(mata_pelajaran, fase);
CREATE INDEX IF NOT EXISTS idx_cp_fase ON capaian_pembelajaran(fase);
