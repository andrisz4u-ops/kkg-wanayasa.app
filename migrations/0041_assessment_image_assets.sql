CREATE TABLE IF NOT EXISTS assessment_image_assets (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  mime TEXT NOT NULL CHECK (mime IN ('image/png', 'image/jpeg', 'image/webp')),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 524288),
  sha256 TEXT NOT NULL,
  bytes BLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assessment_image_assets_owner ON assessment_image_assets(owner_id, created_at);
