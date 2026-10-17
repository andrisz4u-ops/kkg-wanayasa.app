-- Raise the assessment raster BLOB ceiling without rewriting the 0041/0042
-- migrations. Wrangler's D1 migration runner executes this migration as one
-- atomic batch; do not run these statements individually.

-- A failed assertion aborts the D1 batch. Keep this guard until every copy,
-- schema, and foreign-key check has succeeded.
CREATE TABLE _0044_assessment_image_cap_assert (
  ok INTEGER NOT NULL UNIQUE
);
-- Seed the failure value: a false assertion tries to insert 0 again and the
-- UNIQUE constraint aborts even on D1 paths that defer CHECK enforcement.
INSERT INTO _0044_assessment_image_cap_assert (ok) VALUES (0);

-- Refuse to rebuild a schema with unexpected dependencies. The explicit
-- read-only preflight documented in docs/assessment-image-cap-migration.md is
-- still required before production execution.
INSERT INTO _0044_assessment_image_cap_assert
SELECT CASE WHEN
  (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'table' AND name = 'assessment_image_assets') = 1
  AND (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'table' AND name = 'bank_soal_assets') = 1
  AND EXISTS (SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'assessment_image_assets'
    AND lower(replace(replace(replace(sql, ' ', ''), char(10), ''), char(13), '')) =
      'createtableassessment_image_assets(idtextprimarykey,owner_idintegernotnull,mimetextnotnullcheck(mimein(''image/png'',''image/jpeg'',''image/webp'')),byte_lengthintegernotnullcheck(byte_length>0andbyte_length<=524288),sha256textnotnull,bytesblobnotnull,created_atdatetimenotnulldefaultcurrent_timestamp,foreignkey(owner_id)referencesusers(id)ondeletecascade)')
  AND EXISTS (SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'bank_soal_assets'
    AND lower(replace(replace(replace(sql, ' ', ''), char(10), ''), char(13), '')) =
      'createtablebank_soal_assets(bank_soal_idintegernotnull,asset_idtextnotnull,created_atdatetimenotnulldefaultcurrent_timestamp,primarykey(bank_soal_id,asset_id),foreignkey(bank_soal_id)referencesbank_soal(id)ondeletecascade,foreignkey(asset_id)referencesassessment_image_assets(id)ondeletecascade)')
  AND (SELECT COUNT(*) FROM sqlite_schema WHERE type = 'index' AND tbl_name IN ('assessment_image_assets', 'bank_soal_assets') AND name NOT LIKE 'sqlite_autoindex_%') = 2
  AND EXISTS (SELECT 1 FROM sqlite_schema WHERE type = 'index' AND name = 'idx_assessment_image_assets_owner' AND tbl_name = 'assessment_image_assets' AND lower(replace(sql, ' ', '')) = 'createindexidx_assessment_image_assets_owneronassessment_image_assets(owner_id,created_at)')
  AND EXISTS (SELECT 1 FROM sqlite_schema WHERE type = 'index' AND name = 'idx_bank_soal_assets_asset' AND tbl_name = 'bank_soal_assets' AND lower(replace(sql, ' ', '')) = 'createindexidx_bank_soal_assets_assetonbank_soal_assets(asset_id)')
  AND NOT EXISTS (
    SELECT 1 FROM sqlite_schema
    WHERE type = 'trigger'
      AND (tbl_name IN ('assessment_image_assets', 'bank_soal_assets')
        OR lower(sql) LIKE '%assessment_image_assets%'
        OR lower(sql) LIKE '%bank_soal_assets%')
  )
  AND NOT EXISTS (
    SELECT 1 FROM sqlite_schema
    WHERE type = 'view'
      AND (lower(sql) LIKE '%assessment_image_assets%' OR lower(sql) LIKE '%bank_soal_assets%')
  )
THEN 1 ELSE 0 END;
DELETE FROM _0044_assessment_image_cap_assert WHERE ok = 1;

-- Reserved staging names must be unused. CREATE TABLE below would fail safely
-- if any name collides; this explicit check gives a clear atomic guard.
INSERT INTO _0044_assessment_image_cap_assert
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM sqlite_schema WHERE name IN (
    '_0044_assessment_image_cap_asset_snapshot',
    '_0044_assessment_image_cap_association_snapshot',
    '_0044_assessment_image_cap_asset_replacement'
  )
) THEN 1 ELSE 0 END;
DELETE FROM _0044_assessment_image_cap_assert WHERE ok = 1;

-- Snapshot every explicit persisted value. The association snapshot has no FK,
-- so it remains available while the original child and parent are rebuilt.
CREATE TABLE _0044_assessment_image_cap_asset_snapshot AS
SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at
FROM assessment_image_assets;

CREATE TABLE _0044_assessment_image_cap_association_snapshot AS
SELECT bank_soal_id, asset_id, created_at
FROM bank_soal_assets;

CREATE TABLE _0044_assessment_image_cap_asset_replacement (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  mime TEXT NOT NULL CHECK (mime IN ('image/png', 'image/jpeg', 'image/webp')),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 1572864),
  sha256 TEXT NOT NULL,
  bytes BLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO _0044_assessment_image_cap_asset_replacement
  (id, owner_id, mime, byte_length, sha256, bytes, created_at)
SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at
FROM assessment_image_assets;

-- Verify exact two-way row equality, including BLOB content and timestamps,
-- before either original table is dropped.
INSERT INTO _0044_assessment_image_cap_assert
SELECT CASE WHEN
  (SELECT COUNT(*) FROM assessment_image_assets) = (SELECT COUNT(*) FROM _0044_assessment_image_cap_asset_snapshot)
  AND NOT EXISTS (
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM assessment_image_assets
    EXCEPT
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_snapshot
  )
  AND NOT EXISTS (
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_snapshot
    EXCEPT
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM assessment_image_assets
  )
  AND (SELECT COUNT(*) FROM _0044_assessment_image_cap_asset_replacement) = (SELECT COUNT(*) FROM _0044_assessment_image_cap_asset_snapshot)
  AND NOT EXISTS (
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_replacement
    EXCEPT
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_snapshot
  )
  AND NOT EXISTS (
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_snapshot
    EXCEPT
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_replacement
  )
  AND (SELECT COUNT(*) FROM bank_soal_assets) = (SELECT COUNT(*) FROM _0044_assessment_image_cap_association_snapshot)
  AND NOT EXISTS (
    SELECT bank_soal_id, asset_id, created_at FROM bank_soal_assets
    EXCEPT
    SELECT bank_soal_id, asset_id, created_at FROM _0044_assessment_image_cap_association_snapshot
  )
  AND NOT EXISTS (
    SELECT bank_soal_id, asset_id, created_at FROM _0044_assessment_image_cap_association_snapshot
    EXCEPT
    SELECT bank_soal_id, asset_id, created_at FROM bank_soal_assets
  )
THEN 1 ELSE 0 END;
DELETE FROM _0044_assessment_image_cap_assert WHERE ok = 1;

-- DESTRUCTIVE STEP: drop child before parent to preserve FK-on correctness.
DROP TABLE bank_soal_assets;
-- DESTRUCTIVE STEP: no expected or unexpected inbound FK may remain.
DROP TABLE assessment_image_assets;
-- DESTRUCTIVE STEP: restore the canonical name after replacement is complete.
ALTER TABLE _0044_assessment_image_cap_asset_replacement RENAME TO assessment_image_assets;

CREATE INDEX idx_assessment_image_assets_owner ON assessment_image_assets(owner_id, created_at);

CREATE TABLE bank_soal_assets (
  bank_soal_id INTEGER NOT NULL,
  asset_id TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(bank_soal_id, asset_id),
  FOREIGN KEY(bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE,
  FOREIGN KEY(asset_id) REFERENCES assessment_image_assets(id) ON DELETE CASCADE
);

INSERT INTO bank_soal_assets (bank_soal_id, asset_id, created_at)
SELECT bank_soal_id, asset_id, created_at
FROM _0044_assessment_image_cap_association_snapshot;

CREATE INDEX idx_bank_soal_assets_asset ON bank_soal_assets(asset_id);

-- Final exact comparisons and integrity checks occur while both snapshots
-- remain available. Any CHECK/FK error aborts the encompassing D1 batch.
INSERT INTO _0044_assessment_image_cap_assert
SELECT CASE WHEN
  (SELECT COUNT(*) FROM assessment_image_assets) = (SELECT COUNT(*) FROM _0044_assessment_image_cap_asset_snapshot)
  AND NOT EXISTS (
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM assessment_image_assets
    EXCEPT
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_snapshot
  )
  AND NOT EXISTS (
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM _0044_assessment_image_cap_asset_snapshot
    EXCEPT
    SELECT id, owner_id, mime, byte_length, sha256, bytes, created_at FROM assessment_image_assets
  )
  AND (SELECT COUNT(*) FROM bank_soal_assets) = (SELECT COUNT(*) FROM _0044_assessment_image_cap_association_snapshot)
  AND NOT EXISTS (
    SELECT bank_soal_id, asset_id, created_at FROM bank_soal_assets
    EXCEPT
    SELECT bank_soal_id, asset_id, created_at FROM _0044_assessment_image_cap_association_snapshot
  )
  AND NOT EXISTS (
    SELECT bank_soal_id, asset_id, created_at FROM _0044_assessment_image_cap_association_snapshot
    EXCEPT
    SELECT bank_soal_id, asset_id, created_at FROM bank_soal_assets
  )
  AND NOT EXISTS (SELECT 1 FROM assessment_image_assets AS asset
    LEFT JOIN users AS owner ON owner.id = asset.owner_id WHERE owner.id IS NULL)
  AND NOT EXISTS (SELECT 1 FROM bank_soal_assets AS association
    LEFT JOIN bank_soal AS package ON package.id = association.bank_soal_id
    LEFT JOIN assessment_image_assets AS asset ON asset.id = association.asset_id
    WHERE package.id IS NULL OR asset.id IS NULL)
  AND EXISTS (SELECT 1 FROM sqlite_schema WHERE type = 'index' AND name = 'idx_assessment_image_assets_owner' AND tbl_name = 'assessment_image_assets')
  AND EXISTS (SELECT 1 FROM sqlite_schema WHERE type = 'index' AND name = 'idx_bank_soal_assets_asset' AND tbl_name = 'bank_soal_assets')
THEN 1 ELSE 0 END;
DELETE FROM _0044_assessment_image_cap_assert WHERE ok = 1;

-- Remove staging only after all integrity checks passed.
DROP TABLE _0044_assessment_image_cap_association_snapshot;
DROP TABLE _0044_assessment_image_cap_asset_snapshot;
DROP TABLE _0044_assessment_image_cap_assert;
