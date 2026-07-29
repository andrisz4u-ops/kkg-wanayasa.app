-- =============================================
-- Migration: Add Kop Surat & sekolah_id linkage
-- Portal Digital KKG Gugus 3 Wanayasa
-- =============================================

-- Add kop_surat_url and nip_kepala_sekolah to sekolah table
ALTER TABLE sekolah ADD COLUMN kop_surat_url TEXT;
ALTER TABLE sekolah ADD COLUMN nip_kepala_sekolah TEXT;

-- Add sekolah_id foreign key to users table
ALTER TABLE users ADD COLUMN sekolah_id INTEGER REFERENCES sekolah(id);

-- Backfill sekolah_id based on existing text sekolah field
UPDATE users SET sekolah_id = (SELECT id FROM sekolah WHERE sekolah.nama = users.sekolah LIMIT 1) WHERE sekolah IS NOT NULL AND sekolah != '';

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_sekolah_id ON users(sekolah_id);
