-- One global sequence: the visible certificate number does not contain an activity ID.
CREATE TABLE IF NOT EXISTS certificate_issuance_counter (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  next_number INTEGER NOT NULL CHECK (next_number >= 0)
);

-- Seed from all historical numbered rows before owner/activity cascades can erase them.
INSERT OR IGNORE INTO certificate_issuance_counter (singleton_id, next_number) VALUES (1, 0);

WITH RECURSIVE parts(certificate, rest, part, previous_part) AS (
  SELECT nomor_sertifikat, nomor_sertifikat, '', ''
  FROM sertifikat_presensi
  WHERE nomor_sertifikat LIKE '%/KKG-G3.WNY/%'
  UNION ALL
  SELECT certificate,
         substr(rest, instr(rest, '/') + 1),
         substr(rest, 1, instr(rest, '/') - 1),
         part
  FROM parts
  WHERE instr(rest, '/') > 0
)
UPDATE certificate_issuance_counter
SET next_number = MAX(next_number, COALESCE((
  SELECT MAX(CAST(previous_part AS INTEGER))
  FROM parts
  WHERE part = 'KKG-G3.WNY'
    AND previous_part <> ''
    AND previous_part NOT GLOB '*[^0-9]*'
), 0))
WHERE singleton_id = 1;
