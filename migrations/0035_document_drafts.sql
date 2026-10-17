-- Private, owner-scoped server drafts with compare-and-swap revisions.
CREATE TABLE document_drafts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK(length(module) BETWEEN 1 AND 32),
  document_id TEXT NOT NULL CHECK(length(document_id) BETWEEN 1 AND 128),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  revision INTEGER NOT NULL CHECK(revision > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  server_updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, module, document_id)
);

CREATE INDEX idx_document_drafts_owner_updated
  ON document_drafts(user_id, server_updated_at DESC);

CREATE TABLE document_draft_checkpoints (
  user_id INTEGER NOT NULL,
  module TEXT NOT NULL,
  document_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK(revision > 0),
  title TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, module, document_id, revision),
  FOREIGN KEY(user_id, module, document_id)
    REFERENCES document_drafts(user_id, module, document_id) ON DELETE CASCADE
);

CREATE INDEX idx_document_draft_checkpoints_owner
  ON document_draft_checkpoints(user_id, module, document_id, revision DESC);
