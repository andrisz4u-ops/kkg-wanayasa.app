-- Migration: Support Surat Tugas & SPPD (Surat Perjalanan Dinas) in surat_undangan
ALTER TABLE surat_undangan ADD COLUMN tipe_surat TEXT DEFAULT 'undangan';
ALTER TABLE surat_undangan ADD COLUMN metadata TEXT;

CREATE INDEX IF NOT EXISTS idx_surat_tipe ON surat_undangan(tipe_surat);
