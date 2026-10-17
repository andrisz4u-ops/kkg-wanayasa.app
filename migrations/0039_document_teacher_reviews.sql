-- Append-only teacher actions on an exact private draft revision and content hash.
CREATE TABLE document_teacher_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  document_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK(revision > 0),
  content_hash TEXT NOT NULL CHECK(length(content_hash) = 64),
  status TEXT NOT NULL CHECK(status IN ('reviewed', 'rejected')),
  mutation_id TEXT NOT NULL CHECK(length(mutation_id) BETWEEN 1 AND 128),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, mutation_id),
  FOREIGN KEY(user_id, module, document_id)
    REFERENCES document_drafts(user_id, module, document_id) ON DELETE CASCADE
);

CREATE INDEX idx_document_teacher_reviews_current
  ON document_teacher_reviews(user_id, module, document_id, revision, id DESC);

CREATE INDEX idx_document_teacher_reviews_module_status
  ON document_teacher_reviews(module, status, user_id, document_id, revision);
