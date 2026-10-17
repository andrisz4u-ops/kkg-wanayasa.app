CREATE TABLE IF NOT EXISTS calendar_event_reservations (
  kegiatan_id INTEGER PRIMARY KEY,
  event_id INTEGER UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE SET NULL
);

-- Preserve all legacy events and their manual fields; only record the lowest-id survivor.
INSERT INTO calendar_event_reservations (kegiatan_id, event_id)
SELECT kegiatan_id, MIN(id)
FROM calendar_events
WHERE kegiatan_id IS NOT NULL
GROUP BY kegiatan_id
ON CONFLICT (kegiatan_id) DO NOTHING;
