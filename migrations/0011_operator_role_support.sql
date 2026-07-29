-- =============================================
-- Migration: Operator Role Compatibility Layer
-- Keep legacy users.role CHECK constraint untouched
-- and introduce role_label as effective role field.
-- =============================================

ALTER TABLE users ADD COLUMN role_label TEXT CHECK(role_label IN ('admin', 'operator', 'user'));

-- Backfill existing rows to keep behavior stable
UPDATE users SET role_label = role WHERE role_label IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_label ON users(role_label);
