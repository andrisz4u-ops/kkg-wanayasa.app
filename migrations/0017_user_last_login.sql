-- =============================================
-- Migration 0017: Track Last Login Timestamp for Users
-- =============================================

ALTER TABLE users ADD COLUMN last_login_at DATETIME;
