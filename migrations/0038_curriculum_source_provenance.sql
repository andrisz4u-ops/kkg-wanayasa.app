-- Immutable snapshots identify the exact curriculum text used, not its authority or correctness.
CREATE TABLE IF NOT EXISTS curriculum_source_snapshots (
  digest TEXT PRIMARY KEY CHECK (length(digest) = 64),
  mata_pelajaran TEXT NOT NULL,
  fase TEXT NOT NULL,
  source_origin TEXT NOT NULL CHECK (source_origin IN ('d1', 'static', 'user-input', 'mixed')),
  regulation_label TEXT,
  locator TEXT,
  canonical_content_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS curriculum_source_snapshots_no_update
BEFORE UPDATE ON curriculum_source_snapshots
BEGIN
  SELECT RAISE(ABORT, 'curriculum source snapshots are append-only');
END;

CREATE TRIGGER IF NOT EXISTS curriculum_source_snapshots_no_delete
BEFORE DELETE ON curriculum_source_snapshots
BEGIN
  SELECT RAISE(ABORT, 'curriculum source snapshots are append-only');
END;
