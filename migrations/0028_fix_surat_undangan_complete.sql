-- Migration: Ensure complete schema for surat_undangan with SPPD and Public Verification support
-- File: 0028_fix_surat_undangan_complete.sql

-- Ensure columns exist (in SQLite, if they already exist, this file acts as documentation and index creator)
CREATE INDEX IF NOT EXISTS idx_surat_tipe ON surat_undangan(tipe_surat);
CREATE INDEX IF NOT EXISTS idx_surat_nomor ON surat_undangan(nomor_surat);
CREATE INDEX IF NOT EXISTS idx_surat_created ON surat_undangan(created_at);
