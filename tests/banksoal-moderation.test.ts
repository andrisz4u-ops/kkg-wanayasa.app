import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SqliteD1 } from './helpers/sqlite-d1';
import { BANK_SOAL_ACCESS_PREDICATE, BANK_SOAL_PUBLIC_PREDICATE, bankSoalCreationVisibility, ensureBankSoalModerationSchema } from '../src/lib/bank-soal-policy';
import banksoal from '../src/routes/banksoal';

function legacyDb() {
  const db = new SqliteD1();
  db.sqlite.exec('CREATE TABLE users (id INTEGER PRIMARY KEY);');
  db.sqlite.exec('INSERT INTO users (id) VALUES (1)');
  db.sqlite.exec(readFileSync(resolve(process.cwd(), 'migrations/0018_bank_soal.sql'), 'utf8'));
  return db;
}

function routeDb() {
  const db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT,
    mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT
  );
  CREATE TABLE sekolah (id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT,
    kop_surat_url TEXT, npsn TEXT, alamat TEXT);
  CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT);
  INSERT INTO users (id,nama,email,role) VALUES (1,'Owner','owner@example.test','user'),
    (2,'Foreign','foreign@example.test','user'), (3,'Admin','admin@example.test','admin');
  INSERT INTO sessions VALUES ('owner-session',1,datetime('now','+1 day')),
    ('foreign-session',2,datetime('now','+1 day')), ('admin-session',3,datetime('now','+1 day'));`);
  db.sqlite.exec(readFileSync(resolve(process.cwd(), 'migrations/0018_bank_soal.sql'), 'utf8'));
  db.sqlite.exec(`INSERT INTO bank_soal (id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public)
    VALUES (10,1,'Owner','IPAS','Legacy private','5','{"q":"private"}',0),
           (11,1,'Owner','IPAS','Legacy public','5','{"q":"public"}',1);`);
  db.sqlite.exec(readFileSync(resolve(process.cwd(), 'migrations/0040_bank_soal_moderation.sql'), 'utf8'));
  return db;
}

function request(db: SqliteD1, path: string, token: string, method = 'GET', body?: unknown) {
  return banksoal.request(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }, { DB: db as any } as any);
}

describe('bank soal moderation schema and visibility (SQLite)', () => {
  it('preserves legacy public/private values and content exactly once in migration', () => {
    const db = legacyDb();
    db.sqlite.exec(`INSERT INTO bank_soal (user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public)
      VALUES (1,'Legacy','IPAS','Air','5','{"legacy":true}',1), (1,'Private','IPAS','Tanah','5','{"keep":1}',0);`);
    db.sqlite.exec(readFileSync(resolve(process.cwd(), 'migrations/0040_bank_soal_moderation.sql'), 'utf8'));
    const rows = db.sqlite.prepare('SELECT is_public, content, moderation_status, legacy_compat FROM bank_soal ORDER BY id').all() as any[];
    expect(rows).toEqual([
      { is_public: 1, content: '{"legacy":true}', moderation_status: 'approved', legacy_compat: 1 },
      { is_public: 0, content: '{"keep":1}', moderation_status: 'private', legacy_compat: 1 },
    ]);
    db.close();
  });

  it('sets new records private and runtime initialization does not promote them to legacy', async () => {
    const db = legacyDb();
    db.sqlite.exec(readFileSync(resolve(process.cwd(), 'migrations/0040_bank_soal_moderation.sql'), 'utf8'));
    const visibility = bankSoalCreationVisibility();
    db.sqlite.prepare(`INSERT INTO bank_soal (user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES (1,'New','IPAS','Air','5','{}',?,?,?,?)`).run(visibility.is_public, visibility.moderation_status, visibility.legacy_compat, visibility.is_hidden);
    await ensureBankSoalModerationSchema(db as any);
    const row = db.sqlite.prepare('SELECT is_public, moderation_status, legacy_compat, is_hidden FROM bank_soal').get();
    expect(row).toEqual({ is_public: 0, moderation_status: 'private', legacy_compat: 0, is_hidden: 0 });
    db.close();
  });

  it('requires both owner opt-in and approval, and excludes hidden rows from public and foreign access', () => {
    const db = legacyDb();
    db.sqlite.exec(readFileSync(resolve(process.cwd(), 'migrations/0040_bank_soal_moderation.sql'), 'utf8'));
    db.sqlite.exec(`INSERT INTO bank_soal (user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES (1,'Owner','IPAS','pending','5','{}',1,'pending',0,0),
             (1,'Owner','IPAS','approved private','5','{}',0,'approved',0,0),
             (1,'Owner','IPAS','approved shared','5','{}',1,'approved',0,0),
             (1,'Owner','IPAS','hidden','5','{}',1,'approved',0,1);`);
    const visible = db.sqlite.prepare(`SELECT bs.topik FROM bank_soal bs WHERE ${BANK_SOAL_PUBLIC_PREDICATE} ORDER BY bs.id`).all();
    expect(visible).toEqual([{ topik: 'approved shared' }]);
    const owner = db.sqlite.prepare(`SELECT COUNT(*) AS n FROM bank_soal bs WHERE bs.id = 2 AND ${BANK_SOAL_ACCESS_PREDICATE}`).get(1) as any;
    const foreign = db.sqlite.prepare(`SELECT COUNT(*) AS n FROM bank_soal bs WHERE bs.id = 2 AND ${BANK_SOAL_ACCESS_PREDICATE}`).get(99) as any;
    expect(owner.n).toBe(1);
    expect(foreign.n).toBe(0);
    db.close();
  });

  it('keeps legacy public compatibility but hidden legacy rows are not public', () => {
    const db = legacyDb();
    db.sqlite.exec(`ALTER TABLE bank_soal ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'private';
      ALTER TABLE bank_soal ADD COLUMN legacy_compat INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE bank_soal ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;
      INSERT INTO bank_soal (user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES (1,'Legacy','IPAS','legacy','5','{}',1,'approved',1,0),
             (1,'Legacy','IPAS','legacy private','5','{}',0,'private',1,0),
             (1,'Legacy','IPAS','hidden','5','{}',1,'approved',1,1);`);
    const visible = db.sqlite.prepare(`SELECT bs.topik FROM bank_soal bs WHERE ${BANK_SOAL_PUBLIC_PREDICATE} ORDER BY bs.id`).all();
    expect(visible).toEqual([{ topik: 'legacy' }]);
    db.close();
  });

  it('enforces migrated legacy visibility consistently across list, detail, stats, use, and review', async () => {
    const db = routeDb();
    const listRes = await request(db, '/', 'foreign-session');
    expect(listRes.status).toBe(200);
    const list = await listRes.json() as any;
    expect(list.data.items.map((row: any) => row.topik)).toEqual(['Legacy public']);
    const statsRes = await request(db, '/stats', 'foreign-session');
    expect((await statsRes.json() as any).data.total_soal).toBe(1);
    expect((await request(db, '/11', 'foreign-session')).status).toBe(200);
    expect((await request(db, '/11/use', 'foreign-session', 'POST')).status).toBe(200);
    expect((await request(db, '/11/review', 'foreign-session', 'POST', { rating: 5 })).status).toBe(200);
    expect((db.sqlite.prepare('SELECT use_count, total_reviews FROM bank_soal WHERE id = 11').get() as any))
      .toEqual({ use_count: 1, total_reviews: 1 });
    expect((await request(db, '/10', 'foreign-session')).status).toBe(404);
    expect((await request(db, '/10/use', 'foreign-session', 'POST')).status).toBe(404);
    expect((await request(db, '/10/review', 'foreign-session', 'POST', { rating: 5 })).status).toBe(404);
    expect((db.sqlite.prepare('SELECT use_count FROM bank_soal WHERE id = 10').get() as any).use_count).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_reviews WHERE bank_soal_id = 10').get() as any).n).toBe(0);
    db.close();
  });

  it('keeps withdrawn legacy items private and re-shares only as pending until approval', async () => {
    const db = routeDb();
    const withdraw = await request(db, '/11/share', 'owner-session', 'POST', { share: false });
    expect(withdraw.status).toBe(200);
    expect((await request(db, '/11', 'foreign-session')).status).toBe(404);
    expect((await request(db, '/11/use', 'foreign-session', 'POST')).status).toBe(404);
    expect((await request(db, '/11/review', 'foreign-session', 'POST', { rating: 4 })).status).toBe(404);
    expect((db.sqlite.prepare('SELECT is_public, legacy_compat FROM bank_soal WHERE id = 11').get() as any))
      .toEqual({ is_public: 0, legacy_compat: 0 });

    const reshare = await request(db, '/11/share', 'owner-session', 'POST', { share: true });
    expect((await reshare.json() as any).data.moderation_status).toBe('pending');
    expect((await request(db, '/11', 'foreign-session')).status).toBe(404);
    const adminQueue = await request(db, '/moderation/queue', 'admin-session');
    expect((await adminQueue.json() as any).data.items.map((row: any) => row.id)).toContain(11);
    expect((await request(db, '/moderation/11/approve', 'admin-session', 'POST', { expectedRevision: 1 })).status).toBe(200);
    expect((await request(db, '/moderation/11/approve', 'admin-session', 'POST', { expectedRevision: 1 })).status).toBe(200);
    expect((await request(db, '/11', 'foreign-session')).status).toBe(200);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_moderation_audit WHERE bank_soal_id = 11').get() as any).n).toBe(2);
    db.close();
  });

  it('withdraws a hidden item once, clears hidden state, and treats repeated withdrawal as a no-op', async () => {
    const db = routeDb();
    db.sqlite.exec(`UPDATE bank_soal SET is_public = 1, legacy_compat = 0, moderation_status = 'approved', is_hidden = 1 WHERE id = 11;`);
    expect((await request(db, '/11/share', 'owner-session', 'POST', { share: false })).status).toBe(200);
    expect((await request(db, '/11/share', 'owner-session', 'POST', { share: false })).status).toBe(200);
    expect(db.sqlite.prepare('SELECT is_public, legacy_compat, moderation_status, is_hidden FROM bank_soal WHERE id = 11').get())
      .toEqual({ is_public: 0, legacy_compat: 0, moderation_status: 'private', is_hidden: 0 });
    expect((db.sqlite.prepare(`SELECT COUNT(*) AS n FROM bank_soal_moderation_audit
      WHERE bank_soal_id = 11 AND action = 'share_withdrawn'`).get() as any).n).toBe(1);
    db.close();
  });

  it('rejects moderation if sharing is withdrawn after the initial read and before the batch', async () => {
    const db = routeDb();
    db.sqlite.exec(`UPDATE bank_soal SET is_public = 1, legacy_compat = 0, moderation_status = 'pending' WHERE id = 11;`);
    const originalPrepare = db.prepare.bind(db);
    let reachedRead!: () => void;
    let releaseRead!: () => void;
    const readReached = new Promise<void>(resolveRead => { reachedRead = resolveRead; });
    const holdRead = new Promise<void>(resolveRead => { releaseRead = resolveRead; });
    db.prepare = ((sql: string) => {
      const statement: any = originalPrepare(sql);
      if (!sql.includes('SELECT id, is_public, legacy_compat, moderation_status, is_hidden')) return statement;
      const wrapped: any = {
        ...statement,
        bind(...values: any[]) { statement.bind(...values); return wrapped; },
        async first(...args: any[]) {
          const row = await statement.first(...args);
          reachedRead();
          await holdRead;
          return row;
        },
      };
      return wrapped;
    }) as any;

    const moderationPromise = request(db, '/moderation/11/approve', 'admin-session', 'POST', { expectedRevision: 1 });
    await readReached;
    const withdrawal = await request(db, '/11/share', 'owner-session', 'POST', { share: false });
    expect(withdrawal.status).toBe(200);
    releaseRead();
    const response = await moderationPromise;
    expect(response.status).toBe(409);
    expect((db.sqlite.prepare('SELECT is_public, moderation_status FROM bank_soal WHERE id = 11').get() as any))
      .toEqual({ is_public: 0, moderation_status: 'private' });
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_moderation_audit WHERE bank_soal_id = 11').get() as any).n).toBe(1);
    db.close();
  });

  it('rolls back moderation state if its atomic audit insert fails', async () => {
    const db = routeDb();
    db.sqlite.exec(`UPDATE bank_soal SET is_public = 1, legacy_compat = 0, moderation_status = 'pending' WHERE id = 10;
      CREATE TRIGGER fail_moderation_audit BEFORE INSERT ON bank_soal_moderation_audit
      BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END;`);
    const response = await request(db, '/moderation/10/approve', 'admin-session', 'POST', { expectedRevision: 1 });
    expect(response.status).toBe(500);
    expect((db.sqlite.prepare('SELECT moderation_status FROM bank_soal WHERE id = 10').get() as any).moderation_status).toBe('pending');
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_moderation_audit').get() as any).n).toBe(0);
    db.close();
  });
});
