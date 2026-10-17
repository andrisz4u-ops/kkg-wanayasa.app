-- Durable, idempotent notification delivery for newly created announcements.
-- Historical announcements are deliberately not backfilled.
CREATE TABLE IF NOT EXISTS announcement_notification_outbox (
    announcement_id INTEGER PRIMARY KEY,
    author_id INTEGER NOT NULL,
    max_recipient_id INTEGER NOT NULL DEFAULT 0 CHECK (max_recipient_id >= 0),
    cursor_recipient_id INTEGER NOT NULL DEFAULT 0 CHECK (cursor_recipient_id >= 0),
    is_complete INTEGER NOT NULL DEFAULT 0 CHECK (is_complete IN (0, 1)),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (announcement_id) REFERENCES pengumuman(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcement_notification_deliveries (
    announcement_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (announcement_id, recipient_id),
    FOREIGN KEY (announcement_id) REFERENCES announcement_notification_outbox(announcement_id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);
