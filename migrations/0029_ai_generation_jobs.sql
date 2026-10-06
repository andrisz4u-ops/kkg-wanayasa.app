CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('running', 'completed', 'partial', 'failed', 'cancelled')),
  result_json TEXT,
  lease_until INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, job_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_generation_active ON ai_generation_jobs(user_id) WHERE state = 'running';
CREATE INDEX IF NOT EXISTS idx_ai_generation_expiry ON ai_generation_jobs(expires_at);
