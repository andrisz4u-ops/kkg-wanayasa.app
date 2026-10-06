CREATE TABLE IF NOT EXISTS surat_number_counters (
  year INTEGER PRIMARY KEY,
  last_value INTEGER NOT NULL CHECK (last_value >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surat_number_reservations (
  number_key TEXT PRIMARY KEY,
  display_number TEXT NOT NULL,
  year INTEGER NOT NULL,
  reservation_id TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  document_id INTEGER REFERENCES surat_undangan(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved', 'issued')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_surat_reservation_owner ON surat_number_reservations(reservation_id);

WITH historical AS (
  SELECT CAST(strftime('%Y', created_at) AS INTEGER) AS year,
    TRIM(nomor_surat) AS number,
    SUBSTR(nomor_surat, INSTR(nomor_surat, '/') + 1) AS remainder
  FROM surat_undangan WHERE nomor_surat IS NOT NULL
), numbered AS (
  SELECT year, CASE
    WHEN number LIKE '421.2%' OR number LIKE '090 /%' OR number LIKE '090/%'
      THEN CAST(TRIM(SUBSTR(remainder, 1, INSTR(remainder, '/') - 1)) AS INTEGER)
    ELSE CAST(number AS INTEGER)
  END AS sequence FROM historical
)
INSERT INTO surat_number_counters(year, last_value)
SELECT year, MAX(COUNT(*), MAX(sequence), 0) FROM numbered
WHERE year IS NOT NULL GROUP BY year
ON CONFLICT(year) DO UPDATE SET last_value = MAX(surat_number_counters.last_value, excluded.last_value);

INSERT OR IGNORE INTO surat_number_reservations
  (number_key, display_number, year, reservation_id, user_id, document_id, state)
SELECT UPPER(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(nomor_surat), ' ', ''), CHAR(9), ''), CHAR(10), ''), CHAR(13), '')),
  nomor_surat, COALESCE(CAST(strftime('%Y', created_at) AS INTEGER), 0),
  'legacy-' || id, user_id, id, 'issued'
FROM surat_undangan WHERE TRIM(COALESCE(nomor_surat, '')) != '' ORDER BY id;

WITH historical_sppd AS (
  SELECT id, user_id, created_at,
    json_extract(CASE WHEN json_valid(metadata) THEN metadata ELSE '{}' END, '$.nomor_sppd') AS number
  FROM surat_undangan
)
INSERT OR IGNORE INTO surat_number_reservations
  (number_key, display_number, year, reservation_id, user_id, document_id, state)
SELECT UPPER(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(number), ' ', ''), CHAR(9), ''), CHAR(10), ''), CHAR(13), '')),
  number, COALESCE(CAST(strftime('%Y', created_at) AS INTEGER), 0),
  'legacy-' || id, user_id, id, 'issued'
FROM historical_sppd WHERE TRIM(COALESCE(number, '')) != '' ORDER BY id;
