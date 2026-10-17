import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import app from '../src/index';
import { requireAIAdmission } from '../src/lib/ai-admission';
import { SqliteD1 } from './helpers/sqlite-d1';

function createDatabase() {
  const db = new SqliteD1();
  db.sqlite.exec(`
    CREATE TABLE users(
      id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT,
      nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT,
      sekolah_id INTEGER, tenant_id TEXT
    );
    INSERT INTO users(id, role, tenant_id) VALUES(1, 'admin', NULL);
    INSERT INTO users(id, role, tenant_id) VALUES(2, 'user', NULL);
    CREATE TABLE sessions(id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT);
    INSERT INTO sessions VALUES
      ('admin-session', 1, '2999-01-01 00:00:00'),
      ('user-session', 2, '2999-01-01 00:00:00');
    CREATE TABLE sekolah(
      id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT,
      kop_surat_url TEXT, npsn TEXT, alamat TEXT
    );
  `);
  db.sqlite.exec(readFileSync('migrations/0032_ai_admission.sql', 'utf8'));
  return db;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('AI admission with SQLite', () => {
  it('keeps a saturated quota when requests arrive in an older window, then advances monotonically', async () => {
    vi.useFakeTimers();
    const db = createDatabase();
    try {
      const protectedApp = new Hono<any>();
      protectedApp.use('*', async (c, next) => {
        c.set('user', { id: 1 });
        await next();
      });
      protectedApp.get('/admitted', requireAIAdmission, c => c.json({ success: true }));
      const env = { DB: db, AI_ADMISSION_MAX_REQUESTS: '1', AI_ADMISSION_WINDOW_SECONDS: '60' };
      const request = () => protectedApp.request('/admitted', {}, env);

      vi.setSystemTime(new Date(120_000));
      expect((await request()).status).toBe(200);
      expect((await request()).status).toBe(429);

      vi.setSystemTime(new Date(60_000));
      expect((await request()).status).toBe(429);
      vi.setSystemTime(new Date(120_000));
      expect((await request()).status).toBe(429);

      vi.setSystemTime(new Date(180_000));
      expect((await request()).status).toBe(200);
      vi.setSystemTime(new Date(120_000));
      expect((await request()).status).toBe(429);

      expect(db.sqlite.prepare('SELECT window_start, request_count FROM ai_user_admission WHERE user_id = 1').get())
        .toMatchObject({ window_start: 180, request_count: 1 });
    } finally {
      db.close();
    }
  });

  it('applies admission to the actual AI diagnostic inference and rejects exhaustion before fetch', async () => {
    const db = createDatabase();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ model: 'test-model', content: [{ text: 'OK' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const env = {
        DB: db,
        AI_ADMISSION_MAX_REQUESTS: '1',
        AI_ADMISSION_WINDOW_SECONDS: '60',
        BEDROCK_API_KEY: 'test-bedrock-key',
      };
      const request = (sessionId: string) => app.request('/api/ai-diagnostic', { headers: { 'x-session-id': sessionId } }, env as any);

      expect((await request('unrecognized')).status).toBe(403);
      expect((await request('user-session')).status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();

      const first = await request('admin-session');
      expect(first.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const exhausted = await request('admin-session');
      expect(exhausted.status).toBe(429);
      expect(await exhausted.json()).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      db.close();
    }
  });
});
