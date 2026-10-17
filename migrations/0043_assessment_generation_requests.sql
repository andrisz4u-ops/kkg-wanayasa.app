CREATE TABLE assessment_generation_requests (
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_document_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  hash_schema INTEGER NOT NULL CHECK (hash_schema = 1),
  run_token TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('running', 'completed', 'failed', 'cancelled')),
  package_id INTEGER,
  result_json TEXT,
  failure_code TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (owner_id, client_document_id)
);
