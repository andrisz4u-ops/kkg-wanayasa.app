// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectAssessmentImageCapDependencies } from '../scripts/preflight-assessment-image-cap.mjs';

const cap = 1_572_864;
const tempParent = tmpdir();
const migrationPath = resolve('migrations/0044_assessment_image_capacity.sql');
const migrations = new Set<Awaited<ReturnType<typeof getPlatformProxy>>>();
const temporaryRoots = new Set<string>();

function sqlStatements(source: string): string[] {
  return source
    .split(/\r?\n/)
    .filter(line => !line.trimStart().startsWith('--'))
    .join('\n')
    .split(';')
    .map(statement => statement.trim())
    .filter(Boolean);
}

async function isolatedDatabase() {
  await stat(tempParent);
  const root = await mkdtemp(join(tempParent, 'kkg-assessment-image-cap-'));
  temporaryRoots.add(root);
  const configPath = join(root, 'wrangler.jsonc');
  const proxy = await getPlatformProxy({
    configPath: await (async () => {
      await writeFile(configPath, JSON.stringify({
        name: 'assessment-image-cap-isolated',
        compatibility_date: '2026-10-17',
        d1_databases: [{ binding: 'DB', database_name: 'assessment-image-cap-isolated', database_id: '00000000-0000-0000-0000-000000000044' }],
      }));
      return configPath;
    })(),
    remoteBindings: false,
    envFiles: [],
    persist: { path: join(root, 'state') },
  });
  migrations.add(proxy);
  const db = (proxy.env as { DB: D1Database }).DB;
  await db.prepare(`CREATE TABLE users (
    id INTEGER PRIMARY KEY, nama TEXT NOT NULL, email TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE TABLE bank_soal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_nama TEXT NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    topik TEXT NOT NULL,
    jenjang_kelas TEXT NOT NULL,
    content TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`).run();
  const baseMigrations = [
    ...sqlStatements(await readFile(resolve('migrations/0041_assessment_image_assets.sql'), 'utf8')),
    ...sqlStatements(await readFile(resolve('migrations/0042_assessment_package_revisions.sql'), 'utf8')),
  ];
  await db.batch(baseMigrations.map(statement => db.prepare(statement)));
  await db.prepare("INSERT INTO users(id,nama,email,password_hash,role) VALUES (1,'One','one@test','x','user'),(2,'Two','two@test','x','user')").run();
  await db.prepare(`INSERT INTO bank_soal
    (id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,created_at,updated_at)
    VALUES
    (10,1,'One','PJOK','Private','5','{"text":"untouched-private"}',0,'2026-10-01T10:00:00Z','2026-10-02T10:00:00Z'),
    (11,1,'One','PJOK','Public','5','{"text":"untouched-public"}',1,'2026-10-03T10:00:00Z','2026-10-04T10:00:00Z'),
    (12,2,'Two','IPAS','Private','4','{"text":"owner-two"}',0,'2026-10-05T10:00:00Z','2026-10-06T10:00:00Z')`).run();
  const imageRows = [
    ['asset-shared', 1, 'image/png', new Uint8Array([0, 255, 1, 128, 0, 12]), '2026-10-07T11:12:13.000Z'],
    ['asset-two', 2, 'image/jpeg', new Uint8Array([255, 216, 255, 0, 7]), '2026-10-08T12:13:14.000Z'],
    ['asset-unattached', 2, 'image/webp', new Uint8Array([82, 73, 70, 70, 0]), '2026-10-09T13:14:15.000Z'],
  ] as const;
  for (const [id, owner, mime, bytes, createdAt] of imageRows) {
    await db.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes,created_at)
      VALUES(?,?,?,?,?,?,?)`).bind(id, owner, mime, bytes.length, `sha-${id}`, bytes, createdAt).run();
  }
  await db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id,created_at) VALUES
    (10,'asset-shared','2026-10-10T10:00:00Z'),
    (11,'asset-shared','2026-10-11T11:00:00Z'),
    (12,'asset-two','2026-10-12T12:00:00Z')`).run();
  const migrationSql = await readFile(migrationPath, 'utf8');
  const migrationStatements = sqlStatements(migrationSql);
  return { root, proxy, db, migrationStatements, imageRows };
}

async function queryRows(db: D1Database, sql: string) {
  return (await db.prepare(sql).all()).results as Record<string, any>[];
}

async function assetSnapshot(db: D1Database) {
  const rows = await queryRows(db, `SELECT id,owner_id,mime,byte_length,sha256,hex(bytes) AS bytes,created_at
    FROM assessment_image_assets ORDER BY id`);
  const associations = await queryRows(db, `SELECT bank_soal_id,asset_id,created_at
    FROM bank_soal_assets ORDER BY bank_soal_id,asset_id`);
  const packages = await queryRows(db, 'SELECT * FROM bank_soal ORDER BY id');
  return { rows, associations, packages };
}

describe('0044 assessment image capacity migration', () => {
  afterEach(async () => {
    for (const proxy of migrations) {
      try { await proxy.dispose(); } catch { /* cleanup best effort */ }
      migrations.delete(proxy);
    }
    for (const root of temporaryRoots) {
      await rm(root, { recursive: true, force: true });
      temporaryRoots.delete(root);
    }
  });

  it('atomically rolls back after every destructive rebuild step, then applies cleanly', async () => {
    const { db, migrationStatements } = await isolatedDatabase();
    const before = await assetSnapshot(db);
    const destructive = [
      'DROP TABLE bank_soal_assets',
      'DROP TABLE assessment_image_assets',
      'ALTER TABLE _0044_assessment_image_cap_asset_replacement RENAME TO assessment_image_assets',
      'DROP TABLE _0044_assessment_image_cap_association_snapshot',
      'DROP TABLE _0044_assessment_image_cap_asset_snapshot',
      'DROP TABLE _0044_assessment_image_cap_assert',
    ];
    for (const needle of destructive) {
      const index = migrationStatements.findIndex(statement => statement.toLowerCase() === needle.toLowerCase());
      expect(index, `migration destructive step exists: ${needle}`).toBeGreaterThanOrEqual(0);
      const failedBatch = migrationStatements.slice(0, index + 1).concat('SELECT * FROM _0044_intentional_failure;');
      await expect(db.batch(failedBatch.map(statement => db.prepare(statement))), needle).rejects.toBeTruthy();
      expect(await assetSnapshot(db), `transaction rolled back after ${needle}`).toEqual(before);
      expect((await queryRows(db, `SELECT name FROM sqlite_schema WHERE type='table'
        AND name LIKE '_0044_assessment_image_cap_%'`))).toEqual([]);
      expect(await queryRows(db, `SELECT name FROM sqlite_schema WHERE type='index'
        AND name IN ('idx_assessment_image_assets_owner','idx_bank_soal_assets_asset') ORDER BY name`)).toEqual([
        { name: 'idx_assessment_image_assets_owner' }, { name: 'idx_bank_soal_assets_asset' },
      ]);
    }
    await db.batch(migrationStatements.map(statement => db.prepare(statement)));
    const after = await assetSnapshot(db);
    expect(after).toEqual(before);
  });

  it('rejects unexpected inbound FK, index, trigger, and view dependencies before changing the schema', async () => {
    const { db, migrationStatements } = await isolatedDatabase();
    const before = await assetSnapshot(db);
    const unexpected = [
      ['index', 'CREATE INDEX unexpected_assessment_asset_idx ON assessment_image_assets(owner_id)'],
      ['trigger', `CREATE TRIGGER unexpected_assessment_asset_trigger AFTER UPDATE ON users BEGIN
        SELECT COUNT(*) FROM assessment_image_assets;
      END`],
      ['view', 'CREATE VIEW unexpected_assessment_asset_view AS SELECT id FROM assessment_image_assets'],
    ] as const;
    for (const [label, createSql] of unexpected) {
      await db.prepare(createSql).run();
      await expect(db.batch(migrationStatements.map(statement => db.prepare(statement))), label).rejects.toBeTruthy();
      expect(await assetSnapshot(db), `${label} preflight leaves records intact`).toEqual(before);
      expect(await queryRows(db, `SELECT name FROM sqlite_schema WHERE type='table'
        AND name LIKE '_0044_assessment_image_cap_%'`)).toEqual([]);
      const objectType = label;
      const objectName = `unexpected_assessment_asset_${label === 'index' ? 'idx' : label}`;
      await db.prepare(`DROP ${objectType.toUpperCase()} ${objectName}`).run();
    }
  });

  it('read-only snapshot preflight detects every unexpected FK, index, trigger, and view', async () => {
    await stat(tempParent);
    const root = await mkdtemp(join(tempParent, 'kkg-assessment-image-cap-preflight-'));
    const file = join(root, 'snapshot.sqlite');
    const db = new DatabaseSync(file);
    try {
      db.exec(`PRAGMA foreign_keys=ON;
        CREATE TABLE users(id INTEGER PRIMARY KEY);
        CREATE TABLE bank_soal(id INTEGER PRIMARY KEY);
        CREATE TABLE assessment_image_assets(
          id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL,
          mime TEXT NOT NULL CHECK(mime IN ('image/png','image/jpeg','image/webp')),
          byte_length INTEGER NOT NULL CHECK(byte_length>0 AND byte_length<=524288),
          sha256 TEXT NOT NULL, bytes BLOB NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_assessment_image_assets_owner ON assessment_image_assets(owner_id, created_at);
        CREATE TABLE bank_soal_assets(
          bank_soal_id INTEGER NOT NULL, asset_id TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY(bank_soal_id,asset_id),
          FOREIGN KEY(bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE,
          FOREIGN KEY(asset_id) REFERENCES assessment_image_assets(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_bank_soal_assets_asset ON bank_soal_assets(asset_id);`);
      db.exec(`INSERT INTO users(id) VALUES(1);
        INSERT INTO bank_soal(id) VALUES(10);
        INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes,created_at)
          VALUES('asset-case',1,'image/png',2,'case-hash',X'00FF','2026-10-10T10:00:00Z');
        INSERT INTO bank_soal_assets(bank_soal_id,asset_id,created_at)
          VALUES(10,'asset-case','2026-10-11T11:00:00Z');`);
      expect(inspectAssessmentImageCapDependencies(db)).toMatchObject({ targetIndexes: 2, incomingTargetForeignKeys: 1 });
      const cliReport = execFileSync(process.execPath, [
        resolve('scripts/preflight-assessment-image-cap.mjs'), '--database', file,
      ], { encoding: 'utf8' });
      expect(JSON.parse(cliReport)).toMatchObject({ status: 'PASS', targetIndexes: 2, incomingTargetForeignKeys: 1 });
      const defects = [
        ['index', 'CREATE INDEX unexpected_assessment_asset_idx ON assessment_image_assets(owner_id)', 'DROP INDEX unexpected_assessment_asset_idx'],
        ['trigger', `CREATE TRIGGER unexpected_assessment_asset_trigger AFTER UPDATE ON users BEGIN SELECT COUNT(*) FROM assessment_image_assets; END`, 'DROP TRIGGER unexpected_assessment_asset_trigger'],
        ['view', 'CREATE VIEW unexpected_assessment_asset_view AS SELECT id FROM assessment_image_assets', 'DROP VIEW unexpected_assessment_asset_view'],
        ['foreign key', `CREATE TABLE unexpected_assessment_asset_fk(id TEXT PRIMARY KEY, asset_id TEXT REFERENCES assessment_image_assets(id) ON DELETE CASCADE)`, 'DROP TABLE unexpected_assessment_asset_fk'],
      ] as const;
      for (const [label, createSql, dropSql] of defects) {
        db.exec(createSql);
        expect(() => inspectAssessmentImageCapDependencies(db), label).toThrow(/preflight failed/i);
        db.exec(dropSql);
        expect(inspectAssessmentImageCapDependencies(db), `${label} removed`).toMatchObject({ targetIndexes: 2, incomingTargetForeignKeys: 1 });
      }

      db.exec(`CREATE TABLE unexpected_upper_asset_fk(
        id INTEGER PRIMARY KEY, asset_ref TEXT NOT NULL,
        FOREIGN KEY(asset_ref) REFERENCES ASSESSMENT_IMAGE_ASSETS(id) ON DELETE CASCADE
      );
      INSERT INTO unexpected_upper_asset_fk(id,asset_ref) VALUES(1,'asset-case');`);
      expect(db.prepare('SELECT COUNT(*) AS count FROM unexpected_upper_asset_fk').get()).toMatchObject({ count: 1 });
      expect(() => inspectAssessmentImageCapDependencies(db), 'uppercase asset target').toThrow(/unexpected inbound foreign key/i);
      db.exec('DROP TABLE unexpected_upper_asset_fk');

      db.exec(`CREATE TABLE unexpected_mixed_association_fk(
        id INTEGER PRIMARY KEY, package_id INTEGER NOT NULL, asset_ref TEXT NOT NULL,
        FOREIGN KEY(package_id,asset_ref) REFERENCES Bank_Soal_Assets(bank_soal_id,asset_id) ON DELETE CASCADE
      );
      INSERT INTO unexpected_mixed_association_fk(id,package_id,asset_ref) VALUES(1,10,'asset-case');`);
      expect(db.prepare('SELECT COUNT(*) AS count FROM unexpected_mixed_association_fk').get()).toMatchObject({ count: 1 });
      expect(() => inspectAssessmentImageCapDependencies(db), 'mixed-case composite association target').toThrow(/unexpected inbound foreign key/i);
      db.exec('DROP TABLE unexpected_mixed_association_fk');
      expect(inspectAssessmentImageCapDependencies(db)).toMatchObject({ targetIndexes: 2, incomingTargetForeignKeys: 1 });
    } finally {
      db.close();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('preserves byte-exact rows, metadata, associations, timestamps, counts, constraints, and cascades at the new cap', async () => {
    const { db, migrationStatements } = await isolatedDatabase();
    const before = await assetSnapshot(db);
    const ownerCountsBefore = await queryRows(db, `SELECT owner_id,COUNT(*) AS count,SUM(byte_length) AS bytes
      FROM assessment_image_assets GROUP BY owner_id ORDER BY owner_id`);
    await db.batch(migrationStatements.map(statement => db.prepare(statement)));
    expect(await assetSnapshot(db)).toEqual(before);
    expect(await queryRows(db, `SELECT owner_id,COUNT(*) AS count,SUM(byte_length) AS bytes
      FROM assessment_image_assets GROUP BY owner_id ORDER BY owner_id`)).toEqual(ownerCountsBefore);
    expect(await queryRows(db, `SELECT name FROM sqlite_schema WHERE type='index'
      AND name IN ('idx_assessment_image_assets_owner','idx_bank_soal_assets_asset') ORDER BY name`)).toEqual([
        { name: 'idx_assessment_image_assets_owner' }, { name: 'idx_bank_soal_assets_asset' },
      ]);

    const maxBytes = new Uint8Array(cap);
    for (let i = 0; i < maxBytes.length; i += 4096) maxBytes[i] = (i / 4096) & 0xff;
    await db.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes,created_at)
      VALUES('asset-max',1,'image/png',?,?,?,'2026-10-13T13:00:00Z')`).bind(cap, 'sha-max', maxBytes).run();
    const stored = await db.prepare("SELECT byte_length,hex(substr(bytes,1,8)) AS first,hex(substr(bytes,-8)) AS last FROM assessment_image_assets WHERE id='asset-max'").first() as any;
    expect(stored).toMatchObject({ byte_length: cap, first: '0000000000000000' });
    expect(stored.last).toBe(Buffer.from(maxBytes.slice(-8)).toString('hex').toUpperCase());
    await expect(db.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes)
      VALUES('asset-over',1,'image/png',?,?,zeroblob(?))`).bind(cap + 1, 'over', cap + 1).run()).rejects.toBeTruthy();
    await expect(db.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes)
      VALUES('asset-bad-mime',1,'image/gif',1,'x',X'00')`).run()).rejects.toBeTruthy();
    await expect(db.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes)
      VALUES('asset-max',1,'image/png',1,'duplicate',X'00')`).run()).rejects.toBeTruthy();
    await expect(db.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes)
      VALUES('asset-no-owner',999,'image/png',1,'x',X'00')`).run()).rejects.toBeTruthy();
    await expect(db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      VALUES(10,'not-an-asset')`).run()).rejects.toBeTruthy();

    await db.prepare("DELETE FROM bank_soal WHERE id=10").run();
    expect(await db.prepare("SELECT COUNT(*) AS count FROM bank_soal_assets WHERE asset_id='asset-shared'").first()).toMatchObject({ count: 1 });
    expect(await db.prepare("SELECT id FROM assessment_image_assets WHERE id='asset-shared'").first()).toMatchObject({ id: 'asset-shared' });
    await db.prepare("DELETE FROM assessment_image_assets WHERE id='asset-two'").run();
    expect(await db.prepare("SELECT COUNT(*) AS count FROM bank_soal_assets WHERE asset_id='asset-two'").first()).toMatchObject({ count: 0 });
    await db.prepare('DELETE FROM users WHERE id=2').run();
    expect(await db.prepare("SELECT COUNT(*) AS count FROM assessment_image_assets WHERE owner_id=2").first()).toMatchObject({ count: 0 });
    expect(await db.prepare('SELECT COUNT(*) AS count FROM bank_soal_assets WHERE bank_soal_id=12').first()).toMatchObject({ count: 0 });
  });
});
