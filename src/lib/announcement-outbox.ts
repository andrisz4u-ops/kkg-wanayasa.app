const CHUNK_SIZE = 40;

export interface CreateAnnouncementOutboxInput {
  title: string;
  body: string;
  category: string;
  authorId: number;
  pinned: boolean;
}

export interface AnnouncementOutboxDrainResult {
  processed: number;
  complete: boolean;
}

interface OutboxRow {
  announcementId: number;
  authorId: number;
  maxRecipientId: number;
  cursorRecipientId: number;
  complete: number;
  title: string;
  message: string;
  type: 'info' | 'warning';
}

/** Inserts the announcement and its notification event in the same D1 transaction. */
export async function createAnnouncementWithOutbox(
  db: D1Database,
  input: CreateAnnouncementOutboxInput,
): Promise<number> {
  const insertAnnouncement = db.prepare(`
    INSERT INTO pengumuman (judul, isi, kategori, is_pinned, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).bind(input.title.trim(), input.body.trim(), input.category, input.pinned ? 1 : 0, input.authorId);
  const insertOutbox = db.prepare(`
    INSERT INTO announcement_notification_outbox
      (announcement_id, author_id, max_recipient_id, title, message, type)
    SELECT last_insert_rowid(), ?, COALESCE(MAX(id), 0), ?, ?, ?
    FROM users
  `).bind(
    input.authorId,
    'Pengumuman Baru 📢',
    `"${input.title}" telah diterbitkan oleh Admin.`,
    input.pinned ? 'warning' : 'info',
  );
  const [inserted] = await db.batch([insertAnnouncement, insertOutbox]);
  return Number(inserted.meta.last_row_id);
}

/** Processes at most one bounded recipient chunk; all writes and cursor movement commit together. */
export async function drainAnnouncementOutbox(
  db: D1Database,
  announcementId: number,
): Promise<AnnouncementOutboxDrainResult | null> {
  const outbox = await db.prepare(`
    SELECT announcement_id as announcementId, author_id as authorId,
      max_recipient_id as maxRecipientId, cursor_recipient_id as cursorRecipientId,
      is_complete as complete, title, message, type
    FROM announcement_notification_outbox WHERE announcement_id = ?
  `).bind(announcementId).first<OutboxRow>();
  if (!outbox) return null;
  if (outbox.complete) return { processed: 0, complete: true };

  // Fetch one look-ahead row so a final full chunk can still be marked complete.
  const { results } = await db.prepare(`
    SELECT id FROM users
    WHERE id > ? AND id <= ? AND id != ?
    ORDER BY id LIMIT ?
  `).bind(outbox.cursorRecipientId, outbox.maxRecipientId, outbox.authorId, CHUNK_SIZE + 1).all<{ id: number }>();
  const recipients = results.slice(0, CHUNK_SIZE);
  if (recipients.length === 0) {
    await db.prepare(`
      UPDATE announcement_notification_outbox SET is_complete = 1
      WHERE announcement_id = ? AND cursor_recipient_id = ? AND is_complete = 0
    `).bind(announcementId, outbox.cursorRecipientId).run();
    return { processed: 0, complete: true };
  }

  const statements: D1PreparedStatement[] = [];
  for (const recipient of recipients) {
    // Delivery marker is inserted after the notification. Both statements are in
    // one atomic batch, so a failure rolls back both and leaves the cursor intact.
    statements.push(db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      SELECT ?, ?, ?, ?, '/pengumuman'
      WHERE NOT EXISTS (
        SELECT 1 FROM announcement_notification_deliveries
        WHERE announcement_id = ? AND recipient_id = ?
      )
    `).bind(recipient.id, outbox.title, outbox.message, outbox.type, announcementId, recipient.id));
    statements.push(db.prepare(`
      INSERT INTO announcement_notification_deliveries (announcement_id, recipient_id)
      VALUES (?, ?) ON CONFLICT (announcement_id, recipient_id) DO NOTHING
    `).bind(announcementId, recipient.id));
  }

  const lastRecipientId = Number(recipients[recipients.length - 1].id);
  const complete = results.length <= CHUNK_SIZE;
  statements.push(db.prepare(`
    UPDATE announcement_notification_outbox
    SET cursor_recipient_id = ?, is_complete = ?
    WHERE announcement_id = ? AND cursor_recipient_id = ? AND is_complete = 0
  `).bind(lastRecipientId, complete ? 1 : 0, announcementId, outbox.cursorRecipientId));
  await db.batch(statements);
  return { processed: recipients.length, complete };
}

export const ANNOUNCEMENT_OUTBOX_CHUNK_SIZE = CHUNK_SIZE;
