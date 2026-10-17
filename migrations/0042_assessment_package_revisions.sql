-- Additive revision and current-image association metadata. Historical package
-- content and visibility are intentionally left untouched.
ALTER TABLE bank_soal ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE bank_soal ADD COLUMN content_hash TEXT;
ALTER TABLE bank_soal ADD COLUMN client_document_id TEXT;
ALTER TABLE bank_soal ADD COLUMN content_write_token TEXT;
ALTER TABLE bank_soal ADD COLUMN copy_source_id INTEGER;
ALTER TABLE bank_soal ADD COLUMN copy_source_revision INTEGER;
ALTER TABLE bank_soal ADD COLUMN copy_source_hash TEXT;

CREATE UNIQUE INDEX idx_bank_soal_owner_client_document
  ON bank_soal(user_id, client_document_id) WHERE client_document_id IS NOT NULL;

CREATE TABLE bank_soal_assets (
  bank_soal_id INTEGER NOT NULL,
  asset_id TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(bank_soal_id, asset_id),
  FOREIGN KEY(bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE,
  FOREIGN KEY(asset_id) REFERENCES assessment_image_assets(id) ON DELETE CASCADE
);
CREATE INDEX idx_bank_soal_assets_asset ON bank_soal_assets(asset_id);

CREATE TABLE bank_soal_write_tokens (
  token TEXT PRIMARY KEY,
  bank_soal_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE
);
