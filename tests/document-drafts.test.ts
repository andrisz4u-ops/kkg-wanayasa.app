// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import documentDrafts from '../src/routes/document-drafts';
import rpp from '../src/routes/rpp';
import { SqliteD1 } from './helpers/sqlite-d1';

function createDatabase() {
  const db = new SqliteD1();
  db.sqlite.exec(`
    CREATE TABLE users(
      id INTEGER PRIMARY KEY, nama TEXT, email TEXT, password_hash TEXT, role TEXT,
      role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT,
      foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT, is_active INTEGER DEFAULT 1
    );
    INSERT INTO users(id, nama, email, role) VALUES(1, 'Owner One', 'one@example.test', 'user'), (2, 'Owner Two', 'two@example.test', 'user');
    CREATE TABLE sessions(id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT);
    INSERT INTO sessions VALUES
      ('session-one', 1, '2999-01-01 00:00:00'),
      ('session-two', 2, '2999-01-01 00:00:00');
    CREATE TABLE sekolah(
      id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT,
      kop_surat_url TEXT, npsn TEXT, alamat TEXT
    );
  `);
  db.sqlite.exec(readFileSync('migrations/0035_document_drafts.sql', 'utf8'));
  db.sqlite.exec(readFileSync('migrations/0039_document_teacher_reviews.sql', 'utf8'));
  return db;
}

function jsonRequest(app: Hono, db: SqliteD1, path: string, method: string, body: unknown, session = 'session-one') {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-session-id': session },
    body: JSON.stringify(body),
  }, { DB: db });
}

function createApp(db: SqliteD1) {
  const app = new Hono().route('/api/document-drafts', documentDrafts);
  return { app, db };
}

describe('Private server document drafts', () => {
  it('is owner-scoped for list, detail, and write; creation retries are idempotent', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      const body = { title: 'Lesson draft', payload: { topic: 'Fractions' }, baseRevision: 0 };
      const concurrentCreates = await Promise.all([
        jsonRequest(app, db, '/api/document-drafts/rpp/doc-1', 'PUT', body),
        jsonRequest(app, db, '/api/document-drafts/rpp/doc-1', 'PUT', body),
      ]);
      expect(concurrentCreates.map(response => response.status).sort()).toEqual([200, 201]);
      expect((await jsonRequest(app, db, '/api/document-drafts/rpp/doc-1', 'PUT', body)).status).toBe(200);

      const ownList = await (await app.request('/api/document-drafts', { headers: { 'x-session-id': 'session-one' } }, { DB: db })).json() as any;
      expect(ownList.data).toHaveLength(1);
      expect(ownList.data[0]).toMatchObject({ module: 'rpp', document_id: 'doc-1', revision: 1 });
      expect(ownList.data[0]).not.toHaveProperty('payload');
      const ownDetail = await (await app.request('/api/document-drafts/rpp/doc-1', { headers: { 'x-session-id': 'session-one' } }, { DB: db })).json() as any;
      expect(ownDetail.data.payload).toEqual({ topic: 'Fractions' });

      const foreignDetail = await app.request('/api/document-drafts/rpp/doc-1', { headers: { 'x-session-id': 'session-two' } }, { DB: db });
      expect(foreignDetail.status).toBe(404);
      const foreignWrite = await jsonRequest(app, db, '/api/document-drafts/rpp/doc-1', 'PUT', { ...body, baseRevision: 1, payload: { topic: 'stolen' } }, 'session-two');
      expect(foreignWrite.status).toBe(404);
      const foreignList = await (await app.request('/api/document-drafts', { headers: { 'x-session-id': 'session-two' } }, { DB: db })).json() as any;
      expect(foreignList.data).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('uses compare-and-swap for stale and concurrent writes', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      await jsonRequest(app, db, '/api/document-drafts/rpp/concurrent', 'PUT', { title: 'Draft', payload: { n: 0 }, baseRevision: 0 });
      const writes = await Promise.all([
        jsonRequest(app, db, '/api/document-drafts/rpp/concurrent', 'PUT', { title: 'Draft A', payload: { n: 1 }, baseRevision: 1 }),
        jsonRequest(app, db, '/api/document-drafts/rpp/concurrent', 'PUT', { title: 'Draft B', payload: { n: 2 }, baseRevision: 1 }),
      ]);
      expect(writes.map(response => response.status).sort()).toEqual([200, 409]);
      const row = db.sqlite.prepare('SELECT revision FROM document_drafts WHERE user_id = 1 AND document_id = ?').get('concurrent') as any;
      expect(row.revision).toBe(2);

      const stale = await jsonRequest(app, db, '/api/document-drafts/rpp/concurrent', 'PUT', { title: 'Stale', payload: { n: 3 }, baseRevision: 1 });
      expect(stale.status).toBe(409);
      expect(await stale.json()).toMatchObject({ error: { code: 'REVISION_CONFLICT', details: { currentRevision: 2 } } });
    } finally {
      db.close();
    }
  });

  it('returns the winning row for concurrent duplicate checkpoints below and at quota', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      const path = '/api/document-drafts/rpp/concurrent-checkpoint';
      await jsonRequest(app, db, path, 'PUT', { title: 'Draft', payload: { revision: 1 }, baseRevision: 0 });
      const belowQuota = await Promise.all([
        jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 1 }),
        jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 1 }),
      ]);
      expect(belowQuota.map(response => response.status).sort()).toEqual([200, 201]);
      expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM document_draft_checkpoints WHERE document_id = ?').get('concurrent-checkpoint')).toMatchObject({ total: 1 });

      for (let revision = 2; revision <= 19; revision++) {
        expect((await jsonRequest(app, db, path, 'PUT', {
          title: 'Draft', payload: { revision }, baseRevision: revision - 1,
        })).status).toBe(200);
        expect((await jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: revision })).status).toBe(201);
      }
      expect((await jsonRequest(app, db, path, 'PUT', {
        title: 'Draft', payload: { revision: 20 }, baseRevision: 19,
      })).status).toBe(200);
      const atQuota = await Promise.all([
        jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 20 }),
        jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 20 }),
      ]);
      expect(atQuota.map(response => response.status).sort()).toEqual([200, 201]);
      expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM document_draft_checkpoints WHERE document_id = ?').get('concurrent-checkpoint')).toMatchObject({ total: 20 });

      expect((await jsonRequest(app, db, path, 'PUT', {
        title: 'Draft', payload: { revision: 21 }, baseRevision: 20,
      })).status).toBe(200);
      const retry = await jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 20 });
      expect(retry.status).toBe(200);
      expect(await retry.json()).toMatchObject({ data: { revision: 20, payload: { revision: 20 } } });
    } finally {
      db.close();
    }
  });

  it('lists metadata without selecting or parsing near-limit draft payloads', async () => {
    const { app, db } = createApp(createDatabase());
    const queries: string[] = [];
    const prepare = db.prepare.bind(db);
    db.prepare = ((sql: string) => {
      queries.push(sql);
      return prepare(sql);
    }) as typeof db.prepare;
    try {
      const largePayload = JSON.stringify({ blob: 'x'.repeat(900 * 1024) });
      const insert = db.sqlite.prepare(`
        INSERT INTO document_drafts (user_id, module, document_id, title, payload_json, revision)
        VALUES (1, 'rpp', ?, ?, ?, 1)
      `);
      for (let index = 0; index < 50; index++) {
        insert.run(`listed-${index}`, `Draft ${index}`, index === 0 ? largePayload : '{"index":' + index + '}');
      }

      const response = await app.request('/api/document-drafts', { headers: { 'x-session-id': 'session-one' } }, { DB: db });
      expect(response.status).toBe(200);
      const listed = await response.json() as any;
      expect(listed.data).toHaveLength(50);
      expect(listed.data[0]).not.toHaveProperty('payload');
      const listQuery = queries.find(sql => /FROM document_drafts WHERE user_id = \?/i.test(sql));
      expect(listQuery).toBeDefined();
      expect(listQuery).not.toMatch(/payload_json/i);

      const detail = await app.request('/api/document-drafts/rpp/listed-0', { headers: { 'x-session-id': 'session-one' } }, { DB: db });
      expect(detail.status).toBe(200);
      expect((await detail.json() as any).data.payload.blob).toHaveLength(900 * 1024);
    } finally {
      db.close();
    }
  });

  it('enforces the per-user document quota without deleting existing drafts', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      const quotaAttempts = await Promise.all(Array.from({ length: 51 }, (_, index) => jsonRequest(
        app, db, `/api/document-drafts/rpp/quota-${index}`, 'PUT', {
          title: `Draft ${index}`, payload: { index }, baseRevision: 0,
        },
      )));
      expect(quotaAttempts.filter(response => response.status === 201)).toHaveLength(50);
      const rejected = quotaAttempts.find(response => response.status === 409)!;
      expect(await rejected.json()).toMatchObject({ error: { code: 'DRAFT_LIMIT_REACHED' } });
      expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM document_drafts WHERE user_id = 1').get()).toMatchObject({ total: 50 });
    } finally {
      db.close();
    }
  });

  it('saves explicit checkpoints idempotently and rejects the 21st checkpoint', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      const path = '/api/document-drafts/rpp/with-history';
      await jsonRequest(app, db, path, 'PUT', { title: 'Versioned', payload: { revision: 1 }, baseRevision: 0 });
      const firstCheckpoint = await jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 1 });
      expect(firstCheckpoint.status).toBe(201);
      expect((await jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 1 })).status).toBe(200);

      for (let revision = 2; revision <= 20; revision++) {
        expect((await jsonRequest(app, db, path, 'PUT', {
          title: 'Versioned', payload: { revision }, baseRevision: revision - 1,
        })).status).toBe(200);
        expect((await jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: revision })).status).toBe(201);
      }
      expect((await jsonRequest(app, db, path, 'PUT', {
        title: 'Versioned', payload: { revision: 21 }, baseRevision: 20,
      })).status).toBe(200);
      const rejected = await jsonRequest(app, db, `${path}/checkpoints`, 'POST', { baseRevision: 21 });
      expect(rejected.status).toBe(409);
      expect(await rejected.json()).toMatchObject({ error: { code: 'CHECKPOINT_LIMIT_REACHED' } });
      const history = await (await app.request(`${path}/checkpoints`, { headers: { 'x-session-id': 'session-one' } }, { DB: db })).json() as any;
      expect(history.data).toHaveLength(20);
    } finally {
      db.close();
    }
  });

  it('rejects oversized chunked JSON before parsing or storing it', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      const prefix = new TextEncoder().encode('{"title":"Large","baseRevision":0,"payload":{"blob":"');
      const chunk = new TextEncoder().encode('x'.repeat(256 * 1024));
      const suffix = new TextEncoder().encode('"}}');
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(prefix);
          controller.enqueue(chunk);
          controller.enqueue(chunk);
          controller.enqueue(chunk);
          controller.enqueue(chunk);
          controller.enqueue(suffix);
          controller.close();
        },
      });
      const response = await app.request('/api/document-drafts/rpp/too-large', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-session-id': 'session-one' },
        body: stream,
        duplex: 'half',
      } as any, { DB: db });
      expect(response.status).toBe(413);
      expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM document_drafts').get()).toMatchObject({ total: 0 });
    } finally {
      db.close();
    }
  });

  it('rejects JSON bodies that exceed the documented nesting bound', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      let nested: any = { leaf: true };
      for (let index = 0; index < 32; index++) nested = { next: nested };
      const response = await jsonRequest(app, db, '/api/document-drafts/rpp/too-deep', 'PUT', {
        title: 'Too deep', payload: nested, baseRevision: 0,
      });
      expect(response.status).toBe(400);
      expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM document_drafts').get()).toMatchObject({ total: 0 });
    } finally {
      db.close();
    }
  });
});

describe('RPP history ownership', () => {
  it('requires a session and scopes save, history, and detail to that user', async () => {
    const db = createDatabase();
    db.sqlite.exec(readFileSync('migrations/0010_teacher_features_v2.sql', 'utf8'));
    try {
      const save = (session?: string) => rpp.request('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { 'x-session-id': session } : {}) },
        body: JSON.stringify({
          mataPelajaran: 'IPAS', topik: 'Ekosistem', jenjangKelas: 'Kelas 5', semester: 'Ganjil',
          alokasiWaktu: '2 x 35', strategi: 'Diskusi', content: { kegiatan: [] }, inputData: {},
        }),
      }, { DB: db });
      expect((await save()).status).toBe(401);
      const saved = await (await save('session-one')).json() as any;
      const id = saved.data.id;

      const ownHistory = await (await rpp.request('/history', { headers: { 'x-session-id': 'session-one' } }, { DB: db })).json() as any;
      expect(ownHistory.data).toHaveLength(1);
      const otherHistory = await (await rpp.request('/history', { headers: { 'x-session-id': 'session-two' } }, { DB: db })).json() as any;
      expect(otherHistory.data).toEqual([]);
      expect((await rpp.request(`/${id}`, { headers: { 'x-session-id': 'session-two' } }, { DB: db })).status).toBe(404);
      expect((await rpp.request(`/${id}`, { headers: { 'x-session-id': 'session-one' } }, { DB: db })).status).toBe(200);
    } finally {
      db.close();
    }
  });
});
