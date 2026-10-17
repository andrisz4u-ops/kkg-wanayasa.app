import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import announcements from '../src/routes/pengumuman';
import { getCurrentUser } from '../src/lib/auth';
import {
  ANNOUNCEMENT_OUTBOX_CHUNK_SIZE,
  createAnnouncementWithOutbox,
  drainAnnouncementOutbox,
} from '../src/lib/announcement-outbox';
import { SqliteD1 } from './helpers/sqlite-d1';

vi.mock('../src/lib/auth', async original => ({
  ...await original<typeof import('../src/lib/auth')>(),
  getCurrentUser: vi.fn(),
}));

let db: SqliteD1;
let app: Hono;

beforeEach(() => {
  db = new SqliteD1();
  db.sqlite.exec('PRAGMA foreign_keys = ON;');
  db.sqlite.exec(readFileSync('migrations/0001_initial_schema.sql', 'utf8'));
  db.sqlite.exec(readFileSync('migrations/0009_notifications.sql', 'utf8'));
  db.sqlite.exec(readFileSync('migrations/0036_announcement_outbox.sql', 'utf8'));
  addUser(1, 'admin');
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'admin' } as any);
  app = new Hono().route('/api/pengumuman', announcements);
});

afterEach(() => {
  db.close();
  vi.clearAllMocks();
});

function addUser(id: number, role = 'user') {
  db.sqlite.prepare(`INSERT INTO users(id, nama, email, password_hash, role) VALUES (?, ?, ?, 'hash', ?)`).run(id, `User ${id}`, `user${id}@example.test`, role);
}

function postAnnouncement(title = 'Pengumuman uji') {
  return app.request('/api/pengumuman', {
    method: 'POST',
    headers: { Cookie: 'session=admin', 'Content-Type': 'application/json' },
    body: JSON.stringify({ judul: title, isi: 'Isi pengumuman' }),
  }, { DB: db as any });
}

function notificationCount() {
  return Number(db.sqlite.prepare('SELECT COUNT(*) AS count FROM notifications').get()?.count || 0);
}

describe('announcement notification outbox', () => {
  it('creates announcement and unique event atomically, excludes author, and preserves response data', async () => {
    addUser(2);
    addUser(3);
    const response = await postAnnouncement('Jadwal baru');
    const payload = await response.json() as any;

    expect(response.status).toBe(201);
    expect(payload.data).toMatchObject({ judul: 'Jadwal baru', kategori: 'umum', is_pinned: false });
    expect(payload.data.id).toBeGreaterThan(0);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM announcement_notification_outbox').get()?.count).toBe(1);
    expect(db.sqlite.prepare('SELECT user_id FROM notifications ORDER BY user_id').all().map((row: any) => row.user_id)).toEqual([2, 3]);
    expect(db.sqlite.prepare('SELECT recipient_id FROM announcement_notification_deliveries ORDER BY recipient_id').all().map((row: any) => row.recipient_id)).toEqual([2, 3]);
  });

  it('keeps failed chunks durable and resumes from the first undelivered recipient', async () => {
    for (let id = 2; id <= 46; id++) addUser(id);
    const response = await postAnnouncement();
    expect(response.status).toBe(201);
    expect(notificationCount()).toBe(ANNOUNCEMENT_OUTBOX_CHUNK_SIZE);
    expect(db.sqlite.prepare('SELECT cursor_recipient_id FROM announcement_notification_outbox').get()?.cursor_recipient_id).toBe(41);

    db.sqlite.exec(`CREATE TRIGGER fail_recipient BEFORE INSERT ON notifications
      WHEN NEW.user_id = 42 BEGIN SELECT RAISE(ABORT, 'temporary notification failure'); END;`);
    const failedRetry = await app.request('/api/pengumuman/1/notifications/retry', {
      method: 'POST', headers: { Cookie: 'session=admin' },
    }, { DB: db as any });
    expect(failedRetry.status).toBe(500);
    expect(notificationCount()).toBe(ANNOUNCEMENT_OUTBOX_CHUNK_SIZE);
    expect(db.sqlite.prepare('SELECT cursor_recipient_id FROM announcement_notification_outbox').get()?.cursor_recipient_id).toBe(41);

    db.sqlite.exec('DROP TRIGGER fail_recipient;');
    const retryResponse = await app.request('/api/pengumuman/1/notifications/retry', {
      method: 'POST', headers: { Cookie: 'session=admin' },
    }, { DB: db as any });
    expect(retryResponse.status).toBe(200);
    expect((await retryResponse.json() as any).data).toMatchObject({ processed: 5, complete: true });
    expect(notificationCount()).toBe(45);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM announcement_notification_deliveries WHERE recipient_id = 1').get()?.count).toBe(0);
    expect(db.sqlite.prepare('SELECT cursor_recipient_id, is_complete FROM announcement_notification_outbox').get()).toMatchObject({ cursor_recipient_id: 46, is_complete: 1 });
  });

  it('deduplicates overlapping concurrent drain requests', async () => {
    for (let id = 2; id <= 20; id++) addUser(id);
    await createAnnouncementWithOutbox(db as any, {
      title: 'Concurrent', body: 'Body', category: 'umum', authorId: 1, pinned: false,
    });

    await Promise.all([
      drainAnnouncementOutbox(db as any, 1),
      drainAnnouncementOutbox(db as any, 1),
    ]);
    expect(notificationCount()).toBe(19);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM announcement_notification_deliveries').get()?.count).toBe(19);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM announcement_notification_outbox WHERE is_complete = 1').get()?.count).toBe(1);
  });

  it('rolls back announcement creation if its outbox event cannot be inserted', async () => {
    db.sqlite.exec(`CREATE TRIGGER fail_outbox BEFORE INSERT ON announcement_notification_outbox
      BEGIN SELECT RAISE(ABORT, 'outbox unavailable'); END;`);
    const response = await postAnnouncement();

    expect(response.status).toBe(500);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM pengumuman').get()?.count).toBe(0);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM announcement_notification_outbox').get()?.count).toBe(0);
    expect(notificationCount()).toBe(0);
  });

  it('does not expose a public or non-admin outbox drain', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await app.request('/api/pengumuman/1/notifications/retry', { method: 'POST' }, { DB: db as any })).status).toBe(401);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 2, role: 'operator' } as any);
    expect((await app.request('/api/pengumuman/1/notifications/retry', { method: 'POST', headers: { Cookie: 'session=operator' } }, { DB: db as any })).status).toBe(403);
  });
});
