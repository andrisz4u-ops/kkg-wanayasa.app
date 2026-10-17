-- Ownership and visibility for objects created by the generic upload endpoint.
-- Existing files are intentionally not backfilled or claimed by any user.
CREATE TABLE IF NOT EXISTS file_ownership (
    key TEXT PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    tenant_id TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL CHECK (size > 0),
    filename TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_file_ownership_owner ON file_ownership(owner_id, tenant_id);
