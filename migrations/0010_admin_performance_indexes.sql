-- =============================================
-- Migration: Performance Indexes for Admin Dashboard
-- Improves query performance for user management, audit logs, and statistics
-- =============================================

-- Add is_active column to users table
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Update existing records
UPDATE users SET is_active = 1 WHERE is_active IS NULL;

-- Indexes for Users table
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_sekolah ON users(sekolah);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved) WHERE is_approved = 0 OR is_approved IS NULL;

-- Indexes for Audit Logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(user_id, action, created_at);

-- Indexes for Sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Indexes for Surat Undangan
CREATE INDEX IF NOT EXISTS idx_surat_user_created ON surat_undangan(user_id, created_at);

-- Indexes for Program Kerja
CREATE INDEX IF NOT EXISTS idx_proker_user_created ON program_kerja(user_id, created_at);

-- Indexes for Kegiatan
CREATE INDEX IF NOT EXISTS idx_kegiatan_tanggal ON kegiatan(tanggal);

-- Indexes for Materi
CREATE INDEX IF NOT EXISTS idx_materi_user_uploaded ON materi(uploaded_by, created_at);

-- Indexes for Pengumuman
CREATE INDEX IF NOT EXISTS idx_pengumuman_pinned_created ON pengumuman(is_pinned, created_at);

-- Indexes for Forum
CREATE INDEX IF NOT EXISTS idx_forum_threads_user_created ON forum_threads(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id, created_at);

-- Add status column to materi table if not exists
ALTER TABLE materi ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending', 'rejected'));

-- Update existing materi records
UPDATE materi SET status = 'active' WHERE status IS NULL;
