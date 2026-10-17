import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';
import documentDrafts from '../src/routes/document-drafts';
import pedagogyQuality from '../src/routes/pedagogy-quality';
import { SqliteD1 } from './helpers/sqlite-d1';

function createDatabase() {
  const db = new SqliteD1();
  db.sqlite.exec(`
    CREATE TABLE users(
      id INTEGER PRIMARY KEY, nama TEXT, email TEXT, password_hash TEXT, role TEXT,
      role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT,
      foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT
    );
    INSERT INTO users(id, nama, email, role) VALUES
      (1, 'Owner One', 'one@example.test', 'user'),
      (2, 'Owner Two', 'two@example.test', 'user'),
      (3, 'Private Admin', 'admin@example.test', 'admin');
    CREATE TABLE sessions(id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT);
    INSERT INTO sessions VALUES
      ('session-one', 1, '2999-01-01 00:00:00'),
      ('session-two', 2, '2999-01-01 00:00:00'),
      ('session-admin', 3, '2999-01-01 00:00:00');
    CREATE TABLE sekolah(
      id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT,
      kop_surat_url TEXT, npsn TEXT, alamat TEXT
    );
  `);
  db.sqlite.exec(readFileSync('migrations/0035_document_drafts.sql', 'utf8'));
  db.sqlite.exec(readFileSync('migrations/0039_document_teacher_reviews.sql', 'utf8'));
  return db;
}

function createApp(db: SqliteD1) {
  const app = new Hono()
    .route('/api/document-drafts', documentDrafts)
    .route('/api/pedagogy-quality', pedagogyQuality);
  return { app, db };
}

function request(app: Hono, db: SqliteD1, path: string, method: string, body?: unknown, session = 'session-one') {
  return app.request(path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), 'x-session-id': session },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, { DB: db });
}

async function save(app: Hono, db: SqliteD1, path: string, revision: number, session = 'session-one') {
  return request(app, db, path, 'PUT', {
    title: `Draft ${revision}`,
    payload: { value: revision },
    baseRevision: revision - 1,
  }, session);
}

async function review(app: Hono, db: SqliteD1, path: string, expectedRevision: number, status: string, mutationId: string, session = 'session-one') {
  return request(app, db, `${path}/review`, 'POST', { expectedRevision, status, mutationId }, session);
}

function pauseInitialMutationLookup(db: SqliteD1, mutationId: string) {
  let reached!: () => void;
  let release!: () => void;
  const lookupReached = new Promise<void>(resolve => { reached = resolve; });
  const waitForRelease = new Promise<void>(resolve => { release = resolve; });
  const originalPrepare = db.prepare.bind(db);
  let pauseNextLookup = true;

  db.prepare = ((sql: string) => {
    const statement: any = originalPrepare(sql);
    if (/FROM document_teacher_reviews WHERE user_id = \? AND mutation_id = \?/i.test(sql)) {
      const originalBind = statement.bind.bind(statement);
      const originalFirst = statement.first.bind(statement);
      let bound: any[] = [];
      statement.bind = (...values: any[]) => {
        bound = values;
        originalBind(...values);
        return statement;
      };
      statement.first = async (column?: string) => {
        const row = await originalFirst(column);
        if (pauseNextLookup && bound[1] === mutationId) {
          pauseNextLookup = false;
          reached();
          await waitForRelease;
        }
        return row;
      };
    }
    return statement;
  }) as typeof db.prepare;

  return { lookupReached, release };
}

describe('Private document teacher review', () => {
  it('binds append-only review actions to current revision and canonical server hash', async () => {
    const { app, db } = createApp(createDatabase());
    const path = '/api/document-drafts/rpp/reviewed-doc';
    try {
      expect((await save(app, db, path, 1)).status).toBe(201);
      const initial = await (await request(app, db, `${path}/review`, 'GET')).json() as any;
      expect(initial.data).toMatchObject({ revision: 1, status: 'needs-review', action: null });
      expect(initial.data.content_hash).toMatch(/^[a-f0-9]{64}$/);

      const first = await review(app, db, path, 1, 'reviewed', 'action-1');
      expect(first.status).toBe(201);
      const firstBody = await first.json() as any;
      expect(firstBody.data.content_hash).toBe(initial.data.content_hash);
      expect((await review(app, db, path, 1, 'reviewed', 'action-1')).status).toBe(200);
      expect((await review(app, db, path, 1, 'rejected', 'action-1')).status).toBe(409);

      const changedStatus = await review(app, db, path, 1, 'rejected', 'action-2');
      expect(changedStatus.status).toBe(201);
      const active = await (await request(app, db, `${path}/review`, 'GET')).json() as any;
      expect(active.data.status).toBe('rejected');
      const detailWithReview = await (await request(app, db, path, 'GET')).json() as any;
      expect(detailWithReview.data.review).toMatchObject({ status: 'rejected', action: { revision: 1 } });
      const history = await (await request(app, db, `${path}/review/history`, 'GET')).json() as any;
      expect(history.data).toHaveLength(2);
      expect(history.data.map((action: any) => action.status)).toEqual(['rejected', 'reviewed']);

      expect((await save(app, db, path, 2)).status).toBe(200);
      const afterEdit = await (await request(app, db, `${path}/review`, 'GET')).json() as any;
      expect(afterEdit.data).toMatchObject({ revision: 2, status: 'needs-review', action: null });
      const detailAfterEdit = await (await request(app, db, path, 'GET')).json() as any;
      expect(detailAfterEdit.data.review).toMatchObject({ status: 'needs-review', action: null });
      const retainedHistory = await (await request(app, db, `${path}/review/history`, 'GET')).json() as any;
      expect(retainedHistory.data).toHaveLength(2);
    } finally {
      db.close();
    }
  });

  it('rejects stale and foreign actions, keeps admin out of owner-private detail, and requires a session', async () => {
    const { app, db } = createApp(createDatabase());
    const path = '/api/document-drafts/rpp/private-doc';
    try {
      await save(app, db, path, 1);
      await save(app, db, path, 2);
      const stale = await review(app, db, path, 1, 'reviewed', 'stale-action');
      expect(stale.status).toBe(409);
      expect(await stale.json()).toMatchObject({ error: { code: 'REVISION_CONFLICT', details: { currentRevision: 2 } } });

      expect((await review(app, db, path, 2, 'reviewed', 'foreign-action', 'session-two')).status).toBe(404);
      expect((await request(app, db, path, 'GET', undefined, 'session-admin')).status).toBe(404);
      expect((await app.request(`${path}/review`, { method: 'GET' }, { DB: db })).status).toBe(401);
      expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM document_teacher_reviews').get()).toMatchObject({ total: 0 });
    } finally {
      db.close();
    }
  });

  it('rereads the owner mutation winner after a stale revision read', async () => {
    const { app, db } = createApp(createDatabase());
    const path = '/api/document-drafts/rpp/revision-race';
    try {
      await save(app, db, path, 1);
      const sameActionBarrier = pauseInitialMutationLookup(db, 'same-action');
      const retryPromise = review(app, db, path, 1, 'reviewed', 'same-action');
      await sameActionBarrier.lookupReached;
      expect((await review(app, db, path, 1, 'reviewed', 'same-action')).status).toBe(201);
      expect((await save(app, db, path, 2)).status).toBe(200);
      sameActionBarrier.release();
      const retry = await retryPromise;
      expect(retry.status).toBe(200);
      expect(await retry.json()).toMatchObject({ data: { revision: 1, status: 'reviewed', mutation_id: 'same-action' } });

      const active = await (await request(app, db, `${path}/review`, 'GET')).json() as any;
      expect(active.data).toMatchObject({ revision: 2, status: 'needs-review', action: null });
      expect(db.sqlite.prepare('SELECT COUNT(*) AS total FROM document_teacher_reviews WHERE revision = 2').get()).toMatchObject({ total: 0 });

      const reusedPath = '/api/document-drafts/rpp/revision-race-reused';
      await save(app, db, reusedPath, 1);
      const reusedBarrier = pauseInitialMutationLookup(db, 'reused-action');
      const conflictingRetryPromise = review(app, db, reusedPath, 1, 'rejected', 'reused-action');
      await reusedBarrier.lookupReached;
      expect((await review(app, db, reusedPath, 1, 'reviewed', 'reused-action')).status).toBe(201);
      expect((await save(app, db, reusedPath, 2)).status).toBe(200);
      reusedBarrier.release();
      const conflictingRetry = await conflictingRetryPromise;
      expect(conflictingRetry.status).toBe(409);
      expect(await conflictingRetry.json()).toMatchObject({ error: { code: 'REVIEW_MUTATION_ID_REUSED' } });
    } finally {
      db.close();
    }
  });

  it('returns privacy-safe active aggregates, suppressing module cohorts below five', async () => {
    const { app, db } = createApp(createDatabase());
    try {
      for (let index = 0; index < 5; index++) {
        const path = `/api/document-drafts/rpp/cohort-${index}`;
        await save(app, db, path, 1);
        if (index === 0) {
          await review(app, db, path, 1, 'reviewed', `rpp-${index}-a`);
          await review(app, db, path, 1, 'rejected', `rpp-${index}-b`);
        } else if (index === 1) {
          await review(app, db, path, 1, 'reviewed', `rpp-${index}`);
          await save(app, db, path, 2);
        } else if (index === 2) {
          await review(app, db, path, 1, 'reviewed', `rpp-${index}`);
        }
      }
      for (let index = 0; index < 4; index++) {
        await save(app, db, `/api/document-drafts/tiny/small-${index}`, 1);
      }

      expect((await request(app, db, '/api/pedagogy-quality/teacher-reviews', 'GET')).status).toBe(403);
      expect((await request(app, db, '/api/pedagogy-quality/teacher-reviews', 'GET', undefined, 'session-two')).status).toBe(403);
      const response = await request(app, db, '/api/pedagogy-quality/teacher-reviews', 'GET', undefined, 'session-admin');
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.data).toMatchObject({
        scope: 'current private server drafts',
        denominator: 9,
        needs_review: 7,
        reviewed: 1,
        rejected: 1,
        suppressed_module_cohorts: 1,
        modules: [{ module: 'rpp', denominator: 5, needs_review: 3, reviewed: 1, rejected: 1 }],
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('cohort-');
      expect(serialized).not.toContain('Owner One');
      expect(serialized).not.toContain('Private Admin');
      expect(serialized).not.toContain('content_hash');
      expect(result.data).not.toHaveProperty('payload');
      expect(result.data.modules[0]).not.toHaveProperty('document_id');
    } finally {
      db.close();
    }
  });
});
