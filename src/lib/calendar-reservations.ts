export interface CalendarActivity {
  id: number;
  nama_kegiatan: string;
  tanggal: string;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  tempat?: string | null;
  deskripsi?: string | null;
}

/** Create a linked manual event only if the activity has no linked calendar event. */
export async function createReservedCalendarEvent(
  db: D1Database,
  input: { kegiatanId: number; eventValues: unknown[] },
): Promise<number | null> {
  const reservation = db.prepare(`
    INSERT INTO calendar_event_reservations (kegiatan_id) VALUES (?)
    ON CONFLICT (kegiatan_id) DO NOTHING
  `).bind(input.kegiatanId);
  const insert = db.prepare(`
    INSERT INTO calendar_events
      (title, description, event_type, start_date, end_date, start_time, end_time,
       location, is_all_day, color, kegiatan_id, created_by)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE EXISTS (
      SELECT 1 FROM calendar_event_reservations
      WHERE kegiatan_id = ? AND event_id IS NULL
    ) AND NOT EXISTS (
      SELECT 1 FROM calendar_events WHERE kegiatan_id = ?
    )
  `).bind(...input.eventValues, input.kegiatanId, input.kegiatanId);
  const repair = db.prepare(`
    UPDATE calendar_event_reservations
    SET event_id = (SELECT MIN(id) FROM calendar_events WHERE kegiatan_id = ?)
    WHERE kegiatan_id = ? AND event_id IS NULL
  `).bind(input.kegiatanId, input.kegiatanId);
  const [, inserted] = await db.batch([reservation, insert, repair]);
  if (!inserted.meta.changes) return null;
  return Number(inserted.meta.last_row_id);
}

/** Syncs each eligible activity through an atomic reservation/insert/repair batch. */
export async function syncUpcomingCalendarActivities(
  db: D1Database,
  activities: CalendarActivity[],
  createdBy: number,
): Promise<number> {
  let synced = 0;
  for (const activity of activities) {
    const reservation = db.prepare(`
      INSERT INTO calendar_event_reservations (kegiatan_id) VALUES (?)
      ON CONFLICT (kegiatan_id) DO NOTHING
    `).bind(activity.id);
    const insert = db.prepare(`
      INSERT INTO calendar_events
        (title, description, event_type, start_date, start_time, end_time, location, color, kegiatan_id, created_by)
      SELECT nama_kegiatan, deskripsi, 'meeting', tanggal, waktu_mulai, waktu_selesai, tempat, '#3B82F6', id, ?
      FROM kegiatan
      WHERE id = ? AND tanggal >= date('now')
        AND EXISTS (
        SELECT 1 FROM calendar_event_reservations WHERE kegiatan_id = ? AND event_id IS NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM calendar_events WHERE kegiatan_id = ?
      )
    `).bind(createdBy, activity.id, activity.id, activity.id);
    const repair = db.prepare(`
      UPDATE calendar_event_reservations
      SET event_id = (SELECT MIN(id) FROM calendar_events WHERE kegiatan_id = ?)
      WHERE kegiatan_id = ? AND event_id IS NULL
    `).bind(activity.id, activity.id);
    const [, inserted] = await db.batch([reservation, insert, repair]);
    synced += Number(inserted.meta.changes || 0);
  }
  return synced;
}

/** Update event fields and an optional activity link with ownership/uniqueness guards. */
export async function updateCalendarEvent(
  db: D1Database,
  input: {
    eventId: number;
    userId: number;
    isAdmin: boolean;
    linkChanged: boolean;
    kegiatanId: number | null;
    oldKegiatanId: number | null;
    updateValues: unknown[];
  },
): Promise<boolean> {
  const statements: D1PreparedStatement[] = [];
  if (input.linkChanged && input.kegiatanId !== null) {
    statements.push(db.prepare(`
      INSERT INTO calendar_event_reservations (kegiatan_id) VALUES (?)
      ON CONFLICT (kegiatan_id) DO NOTHING
    `).bind(input.kegiatanId));
  }
  statements.push(db.prepare(`
    UPDATE calendar_events SET
      title = CASE WHEN ? THEN COALESCE(?, title) ELSE title END,
      description = CASE WHEN ? THEN ? ELSE description END,
      event_type = CASE WHEN ? THEN COALESCE(?, event_type) ELSE event_type END,
      start_date = CASE WHEN ? THEN COALESCE(?, start_date) ELSE start_date END,
      end_date = CASE WHEN ? THEN ? ELSE end_date END,
      start_time = CASE WHEN ? THEN ? ELSE start_time END,
      end_time = CASE WHEN ? THEN ? ELSE end_time END,
      location = CASE WHEN ? THEN ? ELSE location END,
      is_all_day = CASE WHEN ? THEN ? ELSE is_all_day END,
      color = CASE WHEN ? THEN COALESCE(?, color) ELSE color END,
      kegiatan_id = CASE WHEN ? THEN ? ELSE kegiatan_id END, updated_at = datetime('now')
    WHERE id = ? AND (? = 1 OR created_by = ?)
      AND (NOT ? OR kegiatan_id IS ?)
      AND (NOT ? OR ? IS NULL OR (
        NOT EXISTS (SELECT 1 FROM calendar_events other WHERE other.kegiatan_id = ? AND other.id != calendar_events.id)
        AND EXISTS (SELECT 1 FROM calendar_event_reservations r
          WHERE r.kegiatan_id = ? AND (r.event_id IS NULL OR r.event_id = calendar_events.id))
      ))
  `).bind(
    ...input.updateValues, input.linkChanged ? 1 : 0, input.kegiatanId,
    input.eventId, input.isAdmin ? 1 : 0, input.userId,
    input.linkChanged ? 1 : 0, input.oldKegiatanId,
    input.linkChanged ? 1 : 0, input.kegiatanId,
    input.kegiatanId, input.kegiatanId,
  ));
  if (input.linkChanged && input.oldKegiatanId !== null) {
    statements.push(db.prepare(`
      UPDATE calendar_event_reservations SET event_id = NULL
      WHERE kegiatan_id = ? AND event_id = ?
        AND NOT EXISTS (SELECT 1 FROM calendar_events WHERE id = ? AND kegiatan_id = ?)
    `).bind(input.oldKegiatanId, input.eventId, input.eventId, input.oldKegiatanId));
    statements.push(db.prepare(`
      UPDATE calendar_event_reservations
      SET event_id = (SELECT MIN(id) FROM calendar_events WHERE kegiatan_id = ?)
      WHERE kegiatan_id = ? AND event_id IS NULL
    `).bind(input.oldKegiatanId, input.oldKegiatanId));
  }
  if (input.linkChanged && input.kegiatanId !== null) {
    statements.push(db.prepare(`
      UPDATE calendar_event_reservations SET event_id = ?
      WHERE kegiatan_id = ? AND event_id IS NULL
        AND EXISTS (SELECT 1 FROM calendar_events WHERE id = ? AND kegiatan_id = ?)
    `).bind(input.eventId, input.kegiatanId, input.eventId, input.kegiatanId));
  }
  const results = await db.batch(statements);
  const updateIndex = input.linkChanged && input.kegiatanId !== null ? 1 : 0;
  return Number(results[updateIndex].meta.changes || 0) > 0;
}

/** Clear a mapping's deleted event and adopt the lowest-id remaining legacy event. */
export async function repairCalendarReservation(db: D1Database, kegiatanId: number): Promise<void> {
  await db.batch([
    db.prepare(`UPDATE calendar_event_reservations SET event_id = NULL WHERE kegiatan_id = ? AND event_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM calendar_events WHERE id = calendar_event_reservations.event_id AND kegiatan_id = calendar_event_reservations.kegiatan_id)`).bind(kegiatanId),
    db.prepare(`UPDATE calendar_event_reservations SET event_id = (SELECT MIN(id) FROM calendar_events WHERE kegiatan_id = ?) WHERE kegiatan_id = ? AND event_id IS NULL`).bind(kegiatanId, kegiatanId),
  ]);
}
