import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import calendar from '../src/routes/calendar';
import { getCurrentUser } from '../src/lib/auth';
import { syncUpcomingCalendarActivities, updateCalendarEvent } from '../src/lib/calendar-reservations';
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
  db.sqlite.exec(readFileSync('migrations/0002_enhancements.sql', 'utf8'));
  db.sqlite.exec(readFileSync('migrations/0037_calendar_reservations.sql', 'utf8'));
  db.sqlite.prepare(`INSERT INTO users(id, nama, email, password_hash, role) VALUES (1, 'Admin', 'admin@test', 'hash', 'admin')`).run();
  db.sqlite.prepare(`INSERT INTO users(id, nama, email, password_hash, role) VALUES (2, 'User', 'user@test', 'hash', 'user')`).run();
  db.sqlite.prepare(`INSERT INTO kegiatan(id, nama_kegiatan, tanggal, created_by) VALUES (10, 'Kegiatan', date('now', '+1 day'), 1)`).run();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'admin' } as any);
  app = new Hono().route('/api/calendar', calendar);
});

afterEach(() => {
  db.close();
  vi.clearAllMocks();
});

function request(path: string, method: string, body?: unknown) {
  return app.request(`/api/calendar${path}`, {
    method,
    headers: { Cookie: 'session=test', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }, { DB: db as any });
}

function eventCount(kegiatanId = 10) {
  return Number(db.sqlite.prepare('SELECT COUNT(*) AS count FROM calendar_events WHERE kegiatan_id = ?').get(kegiatanId)?.count || 0);
}

describe('calendar activity reservations', () => {
  it('makes overlapping sync requests idempotent and counts only rows inserted by each request', async () => {
    const responses = await Promise.all([
      request('/sync-kegiatan', 'POST'), request('/sync-kegiatan', 'POST'),
    ]);
    expect(responses.map(response => response.status)).toEqual([200, 200]);
    const counts = await Promise.all(responses.map(async response => (await response.json() as any).data.synced));
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(1);
    expect(counts.sort()).toEqual([0, 1]);
    expect(eventCount()).toBe(1);
    expect(db.sqlite.prepare('SELECT event_id FROM calendar_event_reservations WHERE kegiatan_id = 10').get()?.event_id).toBeTruthy();
  });

  it('does not allow sync to duplicate a manual linked event and reports accurate inserts', async () => {
    const manual = await request('/events', 'POST', { title: 'Manual', start_date: '2030-01-01', kegiatan_id: 10 });
    expect(manual.status).toBe(201);
    const response = await request('/sync-kegiatan', 'POST');
    expect((await response.json() as any).data.synced).toBe(0);
    expect(eventCount()).toBe(1);
    expect(db.sqlite.prepare('SELECT title FROM calendar_events WHERE kegiatan_id = 10').get()?.title).toBe('Manual');
  });

  it('uses current activity fields at insert time and preserves events when activity changes between snapshot and batch', async () => {
    db.sqlite.prepare(`INSERT INTO kegiatan(id, nama_kegiatan, tanggal, created_by) VALUES
      (11, 'Manual activity', date('now', '+2 day'), 1),
      (12, 'Withdrawn activity', date('now', '+3 day'), 1)`).run();
    const snapshot = db.sqlite.prepare(`SELECT id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi
      FROM kegiatan WHERE id IN (10, 11, 12) ORDER BY id`).all() as any[];
    let interleaved = false;
    const interleavedDb = {
      prepare: db.prepare.bind(db),
      batch: async (statements: any[]) => {
        if (!interleaved) {
          interleaved = true;
          db.sqlite.prepare(`UPDATE kegiatan SET nama_kegiatan = 'Latest title', deskripsi = 'Latest description',
            tanggal = date('now', '+5 day'), waktu_mulai = '13:00', waktu_selesai = '14:00',
            tempat = 'Latest location' WHERE id = 10`).run();
          db.sqlite.prepare(`INSERT INTO calendar_events(title, description, start_date, kegiatan_id, created_by)
            VALUES ('Manual event', 'Manual description', '2030-02-01', 11, 1)`).run();
          db.sqlite.prepare(`UPDATE kegiatan SET tanggal = date('now', '-1 day') WHERE id = 12`).run();
        }
        return db.batch(statements);
      },
    };

    const synced = await syncUpcomingCalendarActivities(interleavedDb as any, snapshot, 1);

    expect(synced).toBe(1);
    expect(db.sqlite.prepare(`SELECT title, description, start_date, start_time, end_time, location
      FROM calendar_events WHERE kegiatan_id = 10`).get()).toEqual({
      title: 'Latest title', description: 'Latest description', start_date: db.sqlite.prepare('SELECT date(\'now\', \'+5 day\') AS date').get()?.date,
      start_time: '13:00', end_time: '14:00', location: 'Latest location',
    });
    expect(db.sqlite.prepare('SELECT title, description, start_date FROM calendar_events WHERE kegiatan_id = 11').get()).toEqual({
      title: 'Manual event', description: 'Manual description', start_date: '2030-02-01',
    });
    expect(eventCount(12)).toBe(0);
  });

  it('returns 409 for a second manual linked create and preserves omitted links on PUT', async () => {
    const first = await request('/events', 'POST', { title: 'First', start_date: '2030-01-01', kegiatan_id: 10 });
    const eventId = (await first.json() as any).data.id;
    const conflict = await request('/events', 'POST', { title: 'Second', start_date: '2030-01-02', kegiatan_id: 10 });
    expect(conflict.status).toBe(409);
    const updated = await request(`/events/${eventId}`, 'PUT', { title: 'Updated' });
    expect(updated.status).toBe(200);
    expect(db.sqlite.prepare('SELECT kegiatan_id, title FROM calendar_events WHERE id = ?').get(eventId)).toMatchObject({ kegiatan_id: 10, title: 'Updated' });
  });

  it('recreates a deleted linked event and returns the ID inserted by that transaction', async () => {
    const first = await request('/events', 'POST', { title: 'First', start_date: '2030-01-01', kegiatan_id: 10 });
    const deletedId = (await first.json() as any).data.id;
    expect((await request(`/events/${deletedId}`, 'DELETE')).status).toBe(200);
    const recreated = await request('/events', 'POST', { title: 'Recreated', start_date: '2030-01-02', kegiatan_id: 10 });
    const payload = await recreated.json() as any;
    expect(recreated.status).toBe(201);
    expect(payload.data.id).not.toBe(deletedId);
    expect(db.sqlite.prepare('SELECT event_id FROM calendar_event_reservations WHERE kegiatan_id = 10').get()?.event_id).toBe(payload.data.id);
  });

  it('adopts an unmapped legacy event instead of creating another linked event', async () => {
    const legacyId = Number(db.sqlite.prepare(`INSERT INTO calendar_events(title, start_date, kegiatan_id, created_by)
      VALUES ('Unmapped legacy', '2030-01-01', 10, 1)`).run().lastInsertRowid);
    const response = await request('/events', 'POST', { title: 'Must not duplicate', start_date: '2030-01-02', kegiatan_id: 10 });
    expect(response.status).toBe(409);
    expect(eventCount()).toBe(1);
    expect(db.sqlite.prepare('SELECT event_id FROM calendar_event_reservations WHERE kegiatan_id = 10').get()?.event_id).toBe(legacyId);
  });

  it('keeps legacy duplicates and their manual fields while mapping the lowest id', async () => {
    const insert = db.sqlite.prepare(`INSERT INTO calendar_events
      (title, description, event_type, start_date, end_date, start_time, end_time, location, is_all_day, color, kegiatan_id, created_by)
      VALUES (?, 'Manual description', 'training', '2030-01-01', '2030-01-02', '09:00', '10:00', 'Manual location', 1, '#ABCDEF', 10, 1)`);
    const first = Number(insert.run('Legacy first').lastInsertRowid);
    const second = Number(insert.run('Legacy duplicate manually edited').lastInsertRowid);
    db.sqlite.exec(readFileSync('migrations/0037_calendar_reservations.sql', 'utf8'));
    expect(eventCount()).toBe(2);
    expect(db.sqlite.prepare('SELECT event_id FROM calendar_event_reservations WHERE kegiatan_id = 10').get()?.event_id).toBe(first);
    expect(db.sqlite.prepare('SELECT title FROM calendar_events WHERE id = ?').get(second)?.title).toBe('Legacy duplicate manually edited');
    const editableDuplicate = await request(`/events/${second}`, 'PUT', { kegiatan_id: 10, title: 'Still editable' });
    expect(editableDuplicate.status).toBe(200);
    expect(eventCount()).toBe(2);
    expect(db.sqlite.prepare(`SELECT title, description, event_type, start_date, end_date, start_time,
      end_time, location, is_all_day, color FROM calendar_events WHERE id = ?`).get(second)).toEqual({
      title: 'Still editable', description: 'Manual description', event_type: 'training',
      start_date: '2030-01-01', end_date: '2030-01-02', start_time: '09:00', end_time: '10:00',
      location: 'Manual location', is_all_day: 1, color: '#ABCDEF',
    });
  });

  it('guards link changes by ownership and rejects attaching when another event is linked', async () => {
    const insert = db.sqlite.prepare(`INSERT INTO calendar_events(title, start_date, created_by) VALUES ('Owned by user', '2030-01-01', 2)`);
    const id = Number(insert.run().lastInsertRowid);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user' } as any);
    const forbidden = await request(`/events/${id}`, 'PUT', { kegiatan_id: 10 });
    expect(forbidden.status).toBe(403);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'admin' } as any);
    const first = await request('/events', 'POST', { title: 'Linked', start_date: '2030-01-01', kegiatan_id: 10 });
    expect(first.status).toBe(201);
    const conflict = await request(`/events/${id}`, 'PUT', { kegiatan_id: 10 });
    expect(conflict.status).toBe(409);
    expect(db.sqlite.prepare('SELECT kegiatan_id FROM calendar_events WHERE id = ?').get(id)?.kegiatan_id).toBeNull();
  });

  it('allows only one concurrent link update for the same activity', async () => {
    const insert = db.sqlite.prepare(`INSERT INTO calendar_events(title, start_date, created_by) VALUES (?, '2030-01-01', 1)`);
    const firstId = Number(insert.run('First candidate').lastInsertRowid);
    const secondId = Number(insert.run('Second candidate').lastInsertRowid);
    const responses = await Promise.all([
      request(`/events/${firstId}`, 'PUT', { kegiatan_id: 10 }),
      request(`/events/${secondId}`, 'PUT', { kegiatan_id: 10 }),
    ]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    expect(eventCount()).toBe(1);
  });

  it('rejects a stale unlink after another update moves the event and keeps its new mapping valid', async () => {
    db.sqlite.prepare(`INSERT INTO kegiatan(id, nama_kegiatan, tanggal, created_by) VALUES (11, 'Other activity', date('now', '+2 day'), 1)`).run();
    const eventId = Number(db.sqlite.prepare(`INSERT INTO calendar_events(title, start_date, kegiatan_id, created_by)
      VALUES ('Moving event', '2030-01-01', 10, 1)`).run().lastInsertRowid);
    db.sqlite.prepare('INSERT INTO calendar_event_reservations(kegiatan_id, event_id) VALUES (10, ?)').run(eventId);
    const unchangedFields = [0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null];
    const moved = await updateCalendarEvent(db as any, {
      eventId, userId: 1, isAdmin: true, linkChanged: true, kegiatanId: 11, oldKegiatanId: 10,
      updateValues: unchangedFields,
    });
    const staleUnlink = await updateCalendarEvent(db as any, {
      eventId, userId: 1, isAdmin: true, linkChanged: true, kegiatanId: null, oldKegiatanId: 10,
      updateValues: unchangedFields,
    });
    expect(moved).toBe(true);
    expect(staleUnlink).toBe(false);
    expect(db.sqlite.prepare('SELECT kegiatan_id FROM calendar_events WHERE id = ?').get(eventId)?.kegiatan_id).toBe(11);
    expect(db.sqlite.prepare('SELECT event_id FROM calendar_event_reservations WHERE kegiatan_id = 11').get()?.event_id).toBe(eventId);
    expect(db.sqlite.prepare('SELECT event_id FROM calendar_event_reservations WHERE kegiatan_id = 10').get()?.event_id).toBeNull();
  });

  it('repairs a reservation to a surviving legacy duplicate after unlink', async () => {
    const insert = db.sqlite.prepare(`INSERT INTO calendar_events(title, start_date, kegiatan_id, created_by) VALUES (?, '2030-01-01', 10, 1)`);
    const first = Number(insert.run('Legacy first').lastInsertRowid);
    const second = Number(insert.run('Legacy second').lastInsertRowid);
    db.sqlite.exec(readFileSync('migrations/0037_calendar_reservations.sql', 'utf8'));
    const response = await request(`/events/${first}`, 'PUT', { kegiatan_id: null });
    expect(response.status).toBe(200);
    expect(db.sqlite.prepare('SELECT kegiatan_id FROM calendar_events WHERE id = ?').get(first)?.kegiatan_id).toBeNull();
    expect(db.sqlite.prepare('SELECT event_id FROM calendar_event_reservations WHERE kegiatan_id = 10').get()?.event_id).toBe(second);
  });

  it('rolls back reservation and event when the linked insert fails', async () => {
    db.sqlite.exec(`CREATE TRIGGER reject_calendar_insert BEFORE INSERT ON calendar_events
      BEGIN SELECT RAISE(ABORT, 'calendar unavailable'); END;`);
    const response = await request('/events', 'POST', { title: 'Broken', start_date: '2030-01-01', kegiatan_id: 10 });
    expect(response.status).toBe(500);
    expect(eventCount()).toBe(0);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM calendar_event_reservations WHERE kegiatan_id = 10').get()?.count).toBe(0);
  });
});
