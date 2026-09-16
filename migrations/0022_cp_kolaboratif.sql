-- Migration 0022: CP Kolaboratif Support
ALTER TABLE analisis_cp_history ADD COLUMN user_nama TEXT;
ALTER TABLE analisis_cp_history ADD COLUMN total_bab INTEGER DEFAULT 0;
ALTER TABLE analisis_cp_history ADD COLUMN is_public INTEGER DEFAULT 1;
ALTER TABLE analisis_cp_history ADD COLUMN use_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_analisis_cp_mapel ON analisis_cp_history(mata_pelajaran);
CREATE INDEX IF NOT EXISTS idx_analisis_cp_kelas ON analisis_cp_history(jenjang_kelas);
CREATE INDEX IF NOT EXISTS idx_analisis_cp_public ON analisis_cp_history(is_public);
