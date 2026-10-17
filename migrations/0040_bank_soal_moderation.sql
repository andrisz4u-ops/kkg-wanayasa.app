-- Preserve the original content and is_public values. This migration is the
-- sole legacy marker backfill; runtime initialization never repeats it.
ALTER TABLE bank_soal ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'private';
ALTER TABLE bank_soal ADD COLUMN legacy_compat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bank_soal ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bank_soal ADD COLUMN moderation_actor_id INTEGER;
ALTER TABLE bank_soal ADD COLUMN moderation_at DATETIME;
ALTER TABLE bank_soal ADD COLUMN moderation_event_id TEXT;

UPDATE bank_soal
SET legacy_compat = 1,
    moderation_status = CASE WHEN is_public = 1 THEN 'approved' ELSE 'private' END;

CREATE TABLE bank_soal_moderation_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_soal_id INTEGER NOT NULL,
    actor_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('approved','hidden','unhidden','share_withdrawn')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE
);

CREATE INDEX idx_bank_soal_moderation_public ON bank_soal(is_public, moderation_status, is_hidden);
CREATE INDEX idx_bank_soal_legacy ON bank_soal(legacy_compat);
