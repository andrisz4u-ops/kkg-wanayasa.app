import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

const TARGETS = new Set(['assessment_image_assets', 'bank_soal_assets']);
const EXPECTED_INDEXES = new Map([
  ['idx_assessment_image_assets_owner', 'assessment_image_assets'],
  ['idx_bank_soal_assets_asset', 'bank_soal_assets'],
]);
const identifierKey = value => String(value).toLowerCase();

function fail(message) {
  throw new Error(`Assessment image capacity preflight failed: ${message}`);
}

/** Read-only dependency inventory for an exported SQLite snapshot. */
export function inspectAssessmentImageCapDependencies(db) {
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => row.name);
  for (const name of TARGETS) if (!tables.includes(name)) fail(`required table missing: ${name}`);

  const expectedTables = new Map([
    ['assessment_image_assets', "createtableassessment_image_assets(idtextprimarykey,owner_idintegernotnull,mimetextnotnullcheck(mimein('image/png','image/jpeg','image/webp')),byte_lengthintegernotnullcheck(byte_length>0andbyte_length<=524288),sha256textnotnull,bytesblobnotnull,created_atdatetimenotnulldefaultcurrent_timestamp,foreignkey(owner_id)referencesusers(id)ondeletecascade)"],
    ['bank_soal_assets', 'createtablebank_soal_assets(bank_soal_idintegernotnull,asset_idtextnotnull,created_atdatetimenotnulldefaultcurrent_timestamp,primarykey(bank_soal_id,asset_id),foreignkey(bank_soal_id)referencesbank_soal(id)ondeletecascade,foreignkey(asset_id)referencesassessment_image_assets(id)ondeletecascade)'.replace(/\s+/g, '')],
  ]);
  for (const [name, expected] of expectedTables) {
    const table = db.prepare("SELECT sql FROM sqlite_schema WHERE type='table' AND name=?").get(name);
    if (String(table?.sql || '').toLowerCase().replace(/\s+/g, '') !== expected) fail(`noncanonical schema for ${name}`);
  }

  const indexes = db.prepare("SELECT name,tbl_name,sql FROM sqlite_schema WHERE type='index' AND tbl_name IN ('assessment_image_assets','bank_soal_assets') AND name NOT LIKE 'sqlite_autoindex_%'").all();
  if (indexes.length !== EXPECTED_INDEXES.size) fail('unexpected explicit indexes on target tables');
  for (const row of indexes) {
    if (EXPECTED_INDEXES.get(row.name) !== row.tbl_name) fail(`unexpected target index: ${row.name}`);
    const normalized = String(row.sql || '').toLowerCase().replace(/\s+/g, '');
    const expected = row.name === 'idx_assessment_image_assets_owner'
      ? 'createindexidx_assessment_image_assets_owneronassessment_image_assets(owner_id,created_at)'
      : 'createindexidx_bank_soal_assets_assetonbank_soal_assets(asset_id)';
    if (normalized !== expected) fail(`unexpected definition for index: ${row.name}`);
  }

  const triggers = db.prepare("SELECT name,tbl_name,sql FROM sqlite_schema WHERE type='trigger'").all();
  for (const row of triggers) {
    const sql = String(row.sql || '').toLowerCase();
    if (TARGETS.has(row.tbl_name) || [...TARGETS].some(name => sql.includes(name))) fail(`unexpected trigger dependency: ${row.name}`);
  }
  const views = db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='view'").all();
  for (const row of views) {
    const sql = String(row.sql || '').toLowerCase();
    if ([...TARGETS].some(name => sql.includes(name))) fail(`unexpected view dependency: ${row.name}`);
  }

  const incoming = [];
  const outgoing = new Map();
  for (const table of tables) {
    const escaped = table.replaceAll('"', '""');
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list("${escaped}")`).all();
    outgoing.set(table, foreignKeys);
    for (const fk of foreignKeys) if (TARGETS.has(identifierKey(fk.table))) incoming.push({ source: table, ...fk });
  }
  const assetIncoming = incoming.filter(fk => identifierKey(fk.table) === 'assessment_image_assets');
  if (assetIncoming.length !== 1 || identifierKey(assetIncoming[0].source) !== 'bank_soal_assets'
    || identifierKey(assetIncoming[0].from) !== 'asset_id' || identifierKey(assetIncoming[0].to) !== 'id' || String(assetIncoming[0].on_delete).toUpperCase() !== 'CASCADE') {
    fail('unexpected inbound foreign key to assessment_image_assets');
  }
  if (incoming.some(fk => identifierKey(fk.table) === 'bank_soal_assets')) fail('unexpected inbound foreign key to bank_soal_assets');

  const assetFks = outgoing.get('assessment_image_assets') || [];
  if (assetFks.length !== 1 || identifierKey(assetFks[0].table) !== 'users' || identifierKey(assetFks[0].from) !== 'owner_id'
    || identifierKey(assetFks[0].to) !== 'id' || String(assetFks[0].on_delete).toUpperCase() !== 'CASCADE') {
    fail('assessment_image_assets owner cascade differs from migration 0041');
  }
  const associationFks = outgoing.get('bank_soal_assets') || [];
  const expectedAssociations = [
    ['bank_soal', 'bank_soal_id', 'id'],
    ['assessment_image_assets', 'asset_id', 'id'],
  ];
  if (associationFks.length !== expectedAssociations.length || expectedAssociations.some(([table, from, to]) =>
    !associationFks.some(fk => identifierKey(fk.table) === identifierKey(table)
      && identifierKey(fk.from) === identifierKey(from) && identifierKey(fk.to) === identifierKey(to)
      && String(fk.on_delete).toUpperCase() === 'CASCADE'))) {
    fail('bank_soal_assets cascade foreign keys differ from migration 0042');
  }
  const violations = db.prepare('PRAGMA foreign_key_check').all();
  if (violations.length) fail('snapshot contains foreign-key violations');
  return { tables: tables.length, targetIndexes: indexes.length, incomingTargetForeignKeys: incoming.length };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const input = argument('--database');
  if (!input || process.argv.length !== 4) {
    console.error('Usage: node scripts/preflight-assessment-image-cap.mjs --database <read-only-sqlite-snapshot>');
    process.exitCode = 2;
  } else {
    let db;
    try {
      db = new DatabaseSync(resolve(input), { readOnly: true });
      db.exec('PRAGMA query_only = ON');
      const report = inspectAssessmentImageCapDependencies(db);
      console.log(JSON.stringify({ status: 'PASS', ...report }));
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Preflight failed');
      process.exitCode = 1;
    } finally {
      db?.close();
    }
  }
}
