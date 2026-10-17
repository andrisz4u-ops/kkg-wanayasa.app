import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AssessmentPackageWriteError, canonicalContent, createOwnedAssessmentPackage, findAssetIds, normalizeAssetUrls, preparePackageContent, saveOwnedAssessmentPackage } from '../src/lib/assessment-packages';
import { prepareAssessmentAsset } from '../src/lib/assessment-assets';
import { acquireAssessmentGenerationRequest, completeAssessmentGenerationRequest, endAssessmentGenerationRequest, type AssessmentGenerationFence } from '../src/lib/assessment-generation-requests';
import { SqliteD1 } from './helpers/sqlite-d1';
import banksoal from '../src/routes/banksoal';
import { ensureBankSoalTables } from '../src/routes/banksoal';
import { assertLocalSchemaReady, REQUIRED_LOCAL_SCHEMA, runIfLocalSchemaReady, type LocalSchemaStatement } from '../scripts/dev-schema-check.mjs';

const imageIds = ['123e4567-e89b-42d3-a456-426614174001', '123e4567-e89b-42d3-a456-426614174002'];
afterEach(() => vi.restoreAllMocks());
const png = new Uint8Array(readFileSync('public/static/screenshots/home-mobile.png'));
function routeDb() {
  const db = new SqliteD1();
  const basePrepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => {
    const statement: any = basePrepare(sql);
    const bind = statement.bind.bind(statement);
    statement.bind = (...values: any[]) => bind(...values.map(value => value instanceof ArrayBuffer ? Buffer.from(value) : value));
    return statement;
  }) as any;
  db.sqlite.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT);
    CREATE TABLE sekolah (id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT, kop_surat_url TEXT, npsn TEXT, alamat TEXT);
    CREATE TABLE sessions (id TEXT PRIMARY KEY,user_id INTEGER,expires_at TEXT);
    INSERT INTO users(id,nama,email,role) VALUES (1,'Owner','owner@test','user'),(2,'Foreign','foreign@test','user'),(3,'Admin','admin@test','admin');
    INSERT INTO sessions VALUES ('owner',1,datetime('now','+1 day')),('foreign',2,datetime('now','+1 day')),('admin',3,datetime('now','+1 day'));`);
  for (const migration of ['0018_bank_soal.sql', '0040_bank_soal_moderation.sql', '0041_assessment_image_assets.sql', '0042_assessment_package_revisions.sql', '0043_assessment_generation_requests.sql', '0044_assessment_image_capacity.sql']) {
    db.sqlite.exec(readFileSync(resolve(process.cwd(), `migrations/${migration}`), 'utf8'));
  }
  db.sqlite.exec('CREATE TABLE ai_generation_jobs (user_id INTEGER NOT NULL, job_id TEXT NOT NULL, state TEXT NOT NULL, lease_until INTEGER NOT NULL, PRIMARY KEY(user_id,job_id));');
  return db;
}
function req(db: SqliteD1, path: string, method: string, body: any, session = 'owner') {
  return banksoal.request(path, { method, headers: { Authorization: `Bearer ${session}`, 'Content-Type': 'application/json' }, ...(['GET', 'HEAD'].includes(method) ? {} : { body: JSON.stringify(body) }) }, { DB: db as any } as any);
}
function insertAsset(db: SqliteD1, id: string, owner = 1) {
  insertPngAsset(db, id, owner);
}
function insertPngAsset(db: SqliteD1, id: string, owner = 1) {
  db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,?,'image/png',?,'valid-fixture',?)`).run(id, owner, png.length, png);
}
function paddedPng(targetLength: number) {
  const source = png; const chunkLength = targetLength - source.byteLength;
  const payloadLength = chunkLength - 12; const chunk = new Uint8Array(chunkLength); const view = new DataView(chunk.buffer);
  view.setUint32(0, payloadLength); chunk.set([116, 69, 88, 116], 4);
  let crc = 0xffffffff;
  for (let i = 4; i < 8 + payloadLength; i++) { crc ^= chunk[i]; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  view.setUint32(8 + payloadLength, (crc ^ 0xffffffff) >>> 0);
  const iend = source.byteLength - 12; const result = new Uint8Array(targetLength);
  result.set(source.subarray(0, iend)); result.set(chunk, iend); result.set(source.subarray(iend), iend + chunkLength);
  return result;
}
async function createPackage(db: SqliteD1, content: any, clientDocumentId?: string) {
  const result = await req(db, '/', 'POST', { mata_pelajaran: 'IPAS', topik: 'Air', jenjang_kelas: '5', content, clientDocumentId });
  return { response: result, payload: await result.json() as any };
}
const generationMetadata = { user_nama: 'Owner', sekolah: '', mata_pelajaran: 'IPAS', topik: 'Fenced generation', jenjang_kelas: '5' };
async function acquireFence(db: SqliteD1, clientDocumentId: string, jobId?: string): Promise<AssessmentGenerationFence> {
  const acquired = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId, semanticInput: { topic: 'fenced' } });
  if (acquired.kind !== 'acquired') throw new Error('Expected fresh assessment generation fence');
  return { ...acquired.fence, ...(jobId ? { jobId } : {}) };
}
function fencedWrite(db: SqliteD1, fence: AssessmentGenerationFence, content: any, clientDocumentId = fence.clientDocumentId, stagedAssets?: ReadonlyMap<string, any>) {
  return createOwnedAssessmentPackage(db as any, { ownerId: 1, clientDocumentId, content, metadata: generationMetadata, generationFence: fence, stagedAssets });
}

describe('assessment package persistence contracts', () => {
  it('bounds persisted JSON and rejects malformed content', () => {
    expect(() => canonicalContent({ x: 'x'.repeat(1024 * 1024) })).toThrow('content_too_large');
    expect(() => canonicalContent('{')).toThrow();
  });
  it('enumerates unique raster references and rewrites them to package routes', () => {
    const content = { pg: [{ gambar: { assetId: '123e4567-e89b-42d3-a456-426614174000', url: 'https://temporary.invalid/a' } }] };
    expect(findAssetIds(content)).toEqual(['123e4567-e89b-42d3-a456-426614174000']);
    expect(normalizeAssetUrls(content, 12).content.pg[0].gambar.url).toBe('/api/banksoal/12/assets/123e4567-e89b-42d3-a456-426614174000');
  });
  it('does not count duplicate references more than once', () => {
    expect(findAssetIds({ pg: [{ gambar: { assetId: '123e4567-e89b-42d3-a456-426614174000' } }, { gambar: { assetId: '123e4567-e89b-42d3-a456-426614174000' } }] })).toEqual(['123e4567-e89b-42d3-a456-426614174000']);
  });

  it('uses the winning CAS token to protect associations from a stale concurrent writer', async () => {
    const db = routeDb();
    insertAsset(db, imageIds[0]); insertAsset(db, imageIds[1]);
    db.sqlite.exec(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(20,1,'Owner','IPAS','Air','5','{"pg":[]}',0,'private',0,0);`);
    const contentA = { pg: [{ no: 1, soal: 'A', gambar: { assetId: imageIds[0] } }] };
    const contentB = { pg: [{ no: 1, soal: 'B', gambar: { assetId: imageIds[1] } }] };
    const [first, stale] = await Promise.all([
      req(db, '/20', 'PUT', { baseRevision: 1, content: contentA }),
      req(db, '/20', 'PUT', { baseRevision: 1, content: contentB }),
    ]);
    expect([first.status, stale.status].sort()).toEqual([200, 409]);
    const saved: any = db.sqlite.prepare('SELECT content FROM bank_soal WHERE id=20').get();
    const savedId = JSON.parse(saved.content).pg[0].gambar.assetId;
    expect(db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=20').all()).toEqual([{ asset_id: savedId }]);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens WHERE bank_soal_id=20').get()).toMatchObject({ n: 1 });
    db.close();
  });

  it('rolls back content and associations when reconciliation fails', async () => {
    const db = routeDb(); insertAsset(db, imageIds[0]);
    db.sqlite.exec(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(20,1,'Owner','IPAS','Air','5','{"pg":[]}',0,'private',0,0);
      CREATE TRIGGER fail_package_asset BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'association failed'); END;`);
    const result = await req(db, '/20', 'PUT', { baseRevision: 1, content: { pg: [{ gambar: { assetId: imageIds[0] } }] } });
    expect(result.status).toBe(500);
    expect(db.sqlite.prepare('SELECT revision,content FROM bank_soal WHERE id=20').get()).toMatchObject({ revision: 1, content: '{"pg":[]}' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets').get()).toMatchObject({ n: 0 });
    db.close();
  });

  it('creates idempotently for matching owner/document/content and conflicts on reuse with different content', async () => {
    const db = routeDb(); const docId = '123e4567-e89b-42d3-a456-426614174000';
    const content = { pg: [{ no: 1, soal: 'same' }] };
    const first = await createPackage(db, content, docId);
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='pending' WHERE client_document_id=?`).run(docId);
    const retry = await createPackage(db, content, docId);
    const conflict = await createPackage(db, { pg: [{ no: 1, soal: 'different' }] }, docId);
    expect(first.response.status).toBe(200);
    expect(retry.payload.data.id).toBe(first.payload.data.id);
    expect(retry.payload.data.is_public).toBe(1);
    expect(retry.payload.data.moderation_status).toBe('pending');
    expect(conflict.response.status).toBe(409);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE client_document_id=?').get(docId)).toMatchObject({ n: 1 });
    db.close();
  });

  it('rejects foreign-owned assets and requires a current queue revision for moderation', async () => {
    const db = routeDb(); insertAsset(db, imageIds[0], 2);
    const rejected = await createPackage(db, { pg: [{ gambar: { assetId: imageIds[0] } }] });
    expect(rejected.response.status).toBe(400);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    db.sqlite.exec(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(30,1,'Owner','IPAS','Air','5','{"pg":[]}',1,'pending',0,0);`);
    expect((await req(db, '/moderation/30/approve', 'POST', {}, 'admin')).status).toBe(400);
    expect((await req(db, '/moderation/30/approve', 'POST', { expectedRevision: 9 }, 'admin')).status).toBe(409);
    expect((await req(db, '/moderation/30/approve', 'POST', { expectedRevision: 1 }, 'admin')).status).toBe(200);
    db.close();
  });

  it('streams package creation input under the 1 MiB cap', async () => {
    const db = routeDb();
    const response = await req(db, '/', 'POST', { mata_pelajaran: 'IPAS', topik: 'Air', jenjang_kelas: '5', content: { pg: [{ soal: 'x'.repeat(1024 * 1024) }] } });
    expect(response.status).toBe(413);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    db.close();
  });

  it('atomically creates and saves >512 KiB staged assets with exact bytes and owner associations', async () => {
    const db = routeDb();
    const large = paddedPng(700 * 1024);
    const staged = await prepareAssessmentAsset(1, large, 'image/png');
    const created = await createOwnedAssessmentPackage(db as any, {
      ownerId: 1, clientDocumentId: '223e4567-e89b-42d3-a456-426614174222',
      content: { pg: [{ no: 1, soal: 'staged create', gambar: { assetId: staged.id } }] }, metadata: generationMetadata, stagedAssets: new Map([[staged.id, staged]]),
    });
    let row: any = db.sqlite.prepare('SELECT owner_id,byte_length,bytes FROM assessment_image_assets WHERE id=?').get(staged.id);
    expect(row.owner_id).toBe(1); expect(row.byte_length).toBe(large.length); expect(Buffer.from(row.bytes)).toEqual(Buffer.from(large));
    const replacement = await prepareAssessmentAsset(1, paddedPng(710 * 1024), 'image/png');
    const before = await saveOwnedAssessmentPackage(db as any, { ownerId: 1, packageId: created.packageId, baseRevision: 1,
      content: { pg: [{ no: 1, soal: 'staged save', gambar: { assetId: replacement.id } }] }, stagedAssets: new Map([[replacement.id, replacement]]) });
    row = db.sqlite.prepare('SELECT owner_id,byte_length,bytes FROM assessment_image_assets WHERE id=?').get(replacement.id);
    expect(before.revision).toBe(2); expect(row.owner_id).toBe(1); expect(row.byte_length).toBe(710 * 1024); expect(Buffer.from(row.bytes)).toEqual(Buffer.from(new Uint8Array(replacement.bytes)));
    expect(db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=?').get(created.packageId)).toEqual({ asset_id: replacement.id });
    const winnerBefore: any = db.sqlite.prepare('SELECT content,revision FROM bank_soal WHERE id=?').get(created.packageId);
    const associationsBefore: any[] = db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=? ORDER BY asset_id').all(created.packageId) as any[];
    const failing = await prepareAssessmentAsset(1, paddedPng(720 * 1024), 'image/png');
    db.sqlite.exec(`CREATE TRIGGER abort_staged_save_association BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'staged save association failure'); END;`);
    await expect(saveOwnedAssessmentPackage(db as any, { ownerId: 1, packageId: created.packageId, baseRevision: 2,
      content: { pg: [{ no: 1, soal: 'failed staged save', gambar: { assetId: failing.id } }] }, stagedAssets: new Map([[failing.id, failing]]) })).rejects.toThrow();
    expect(db.sqlite.prepare('SELECT content,revision FROM bank_soal WHERE id=?').get(created.packageId)).toEqual(winnerBefore);
    expect(db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=? ORDER BY asset_id').all(created.packageId)).toEqual(associationsBefore);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE id=?').get(failing.id)).toEqual({ n: 0 });
    db.close();
  });

  it('rolls back earlier conditional staged inserts when a later sequential quota insert is denied', async () => {
    const db = routeDb();
    for (let i = 0; i < 99; i++) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',1,'quota-fixture',X'00')`).run(`owned-${i}`);
    const first = await prepareAssessmentAsset(1, png, 'image/png');
    const second = await prepareAssessmentAsset(1, paddedPng(700 * 1024), 'image/png');
    await expect(createOwnedAssessmentPackage(db as any, { ownerId: 1, clientDocumentId: '223e4567-e89b-42d3-a456-426614174224',
      content: { pg: [{ no: 1, gambar: { assetId: first.id } }, { no: 2, gambar: { assetId: second.id } }] }, metadata: generationMetadata,
      stagedAssets: new Map([[first.id, first], [second.id, second]]) })).rejects.toMatchObject({ code: 'quota_count' });
    expect((db.sqlite.prepare(`SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1 AND id IN (?,?)`).get(first.id, second.id) as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get() as any).n).toBe(99);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get() as any).n).toBe(0);
    db.close();
  });

  it('rolls staged assets back when package association settlement fails', async () => {
    const db = routeDb();
    const large = paddedPng(700 * 1024);
    const staged = await prepareAssessmentAsset(1, large, 'image/png');
    db.sqlite.exec(`CREATE TRIGGER abort_after_staged_insert BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'staged association failure'); END;`);
    await expect(createOwnedAssessmentPackage(db as any, { ownerId: 1, clientDocumentId: '223e4567-e89b-42d3-a456-426614174223',
      content: { pg: [{ no: 1, soal: 'rollback staged', gambar: { assetId: staged.id } }] }, metadata: generationMetadata, stagedAssets: new Map([[staged.id, staged]]) })).rejects.toThrow();
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get()).toEqual({ n: 0 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toEqual({ n: 0 });
    db.close();
  });

  it('treats a staged UUID collision with different authoritative metadata as failure, not a successful asset reuse', async () => {
    const db = routeDb();
    const id = imageIds[0];
    insertPngAsset(db, id, 1);
    const staged = await prepareAssessmentAsset(1, png, 'image/png', { id });
    await expect(createOwnedAssessmentPackage(db as any, { ownerId: 1, clientDocumentId: '223e4567-e89b-42d3-a456-426614174225',
      content: { pg: [{ no: 1, gambar: { assetId: id } }] }, metadata: generationMetadata, stagedAssets: new Map([[id, staged]]) })).rejects.toMatchObject({ code: 'identity_conflict' });
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT byte_length,sha256 FROM assessment_image_assets WHERE id=?').get(id) as any)).toEqual({ byte_length: png.length, sha256: 'valid-fixture' });
    db.close();
  });

  it('stores legacy remote images as explicit unavailable markers, never provider URLs', async () => {
    const db = routeDb();
    const created = await createPackage(db, { pg: [{ no: 1, soal: 'stimulus', gambar: { url: 'https://sewr2.vultrobjects.com/signed-secret' } }] });
    expect(created.response.status).toBe(200);
    const saved: any = db.sqlite.prepare('SELECT content FROM bank_soal WHERE id=?').get(created.payload.data.id);
    expect(saved.content).not.toContain('signed-secret');
    expect(JSON.parse(saved.content).pg[0].gambar).toMatchObject({ imageUnavailable: true });
    expect(created.payload.data._persistence.imageWarnings).toHaveLength(1);
    db.close();
  });

  it('parses and rebuilds safe gallery SVG while stripping image source aliases', async () => {
    const db = routeDb(); insertAsset(db, imageIds[0]);
    const gallerySvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><defs><linearGradient id="g"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#06c"/></linearGradient></defs><rect x="2" y="2" width="96" height="76" fill="url(#g)" stroke="#111" stroke-width="2"/><text x="50" y="44" text-anchor="middle" font-size="12" fill="#111">A &amp; B</text></svg>';
    const created = await createPackage(db, { pg: [
      { no: 1, soal: 'safe SVG', gambar: { svg: gallerySvg, url: 'https://signed.example/secret?token=leak', dataUri: 'data:image/png;base64,leak', src: 'https://alias.invalid/leak', alt: 'Diagram A' } },
      { no: 2, soal: 'asset wins', gambar: { assetId: imageIds[0], svg: gallerySvg, url: 'https://signed.example/asset-secret', data: 'private source' } },
      { no: 3, soal: 'encoded safe SVG', gambar: { dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(gallerySvg)}` } },
    ] });
    expect(created.response.status).toBe(200);
    const stored: any = db.sqlite.prepare('SELECT content FROM bank_soal WHERE id=?').get(created.payload.data.id);
    expect(stored.content).not.toMatch(/signed\.example|token=leak|alias\.invalid|base64,leak|asset-secret|private source/);
    const parsed = JSON.parse(stored.content);
    expect(parsed.pg[0].gambar.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(parsed.pg[0].gambar.url).toMatch(/^data:image\/svg\+xml;utf8,/);
    expect(Object.keys(parsed.pg[1].gambar).sort()).toEqual(['assetId', 'url']);
    expect(parsed.pg[2].gambar.svg).toContain('<linearGradient');
    expect(parsed.pg[2].gambar).not.toHaveProperty('dataUri');
    expect(created.payload.data._persistence.imageWarnings).toHaveLength(0);
    db.close();
  });

  it('rejects active, malformed-entity, external-reference and foreignObject SVG on create, CAS, and copy', async () => {
    const db = routeDb(); insertAsset(db, imageIds[0]);
    const badSvgs = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect onload="evil()"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><foreignObject><div>x</div></foreignObject></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><a href="https://evil.invalid"><text>x</text></a></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect style="fill:url(https://evil.invalid/a.svg#x)"/></svg>',
      '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">&x;</svg>',
      'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2010%2010%22%3E%3Cscript%3Ebad()%3C%2Fscript%3E%3C%2Fsvg%3E',
    ];
    for (const svg of badSvgs) {
      const rejected = await createPackage(db, { pg: [{ no: 1, soal: 'x', gambar: { svg } }] });
      expect(rejected.response.status).toBe(400);
    }
    expect((await createPackage(db, { pg: [{ no: 1, gambar: { assetId: imageIds[0], svg: badSvgs[0], url: 'https://signed.invalid/token-secret' } }] })).response.status).toBe(400);
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(51,1,'Owner','IPAS','Old','5',?,1,'approved',0,0);`).run('{"pg":[]}');
    const unsafeAssetContent = { pg: [{ no: 1, gambar: { assetId: imageIds[0], svg: badSvgs[0] } }] };
    db.sqlite.prepare('UPDATE bank_soal SET content=? WHERE id=51').run(JSON.stringify(unsafeAssetContent));
    db.sqlite.prepare('INSERT INTO bank_soal_assets(bank_soal_id,asset_id) VALUES(51,?)').run(imageIds[0]);
    expect((await req(db, '/51', 'PUT', { baseRevision: 1, content: unsafeAssetContent })).status).toBe(400);
    expect((await req(db, '/51/copy', 'POST', {}, 'foreign')).status).toBe(400);
    expect((db.sqlite.prepare('SELECT revision FROM bank_soal WHERE id=51').get() as any).revision).toBe(1);
    db.close();
  });

  it('rebuilds validated application renderer specs instead of retaining supplied SVG bytes', () => {
    const result = preparePackageContent({ pg: [{ no: 1, soal: 'volume', visual_stimulus: { type: 'balok', params: { p: 12, l: 8, t: 6, unit: 'cm', url: 'https://bad.invalid' } } }] });
    expect(result.content.pg[0].gambar.type).toBe('svg');
    expect(result.content.pg[0].gambar.svg).toContain('<svg');
    expect(result.json).not.toContain('bad.invalid');
  });

  it('copies a public package into recipient-owned independent asset bytes and supports stable retries', async () => {
    const db = routeDb(); insertPngAsset(db, imageIds[0]);
    const source = await createPackage(db, { pg: [{ no: 1, soal: 'Keep this text', gambar: { assetId: imageIds[0], alt: 'original' } }] });
    const sourceId = source.payload.data.id;
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='approved' WHERE id=?`).run(sourceId);
    const clientDocumentId = '223e4567-e89b-42d3-a456-426614174000';
    const first = await req(db, `/${sourceId}/copy`, 'POST', { clientDocumentId }, 'foreign');
    const firstData: any = await first.json();
    const retry = await req(db, `/${sourceId}/copy`, 'POST', { clientDocumentId }, 'foreign');
    const retryData: any = await retry.json();
    expect(first.status).toBe(200);
    expect(firstData.data.packageId).not.toBe(sourceId);
    expect(firstData.data.packageId).toBe(retryData.data.packageId);
    const cloneId = firstData.data.content.pg[0].gambar.assetId;
    expect(cloneId).not.toBe(imageIds[0]);
    const cloneRow: any = db.sqlite.prepare('SELECT owner_id,bytes FROM assessment_image_assets WHERE id=?').get(cloneId);
    expect(cloneRow.owner_id).toBe(2);
    expect(Buffer.from(cloneRow.bytes).equals(Buffer.from(png))).toBe(true);
    expect(db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=?').get(firstData.data.packageId)).toEqual({ asset_id: cloneId });
    const otherSource = await createPackage(db, { pg: [{ no: 1, soal: 'other source' }] });
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='approved' WHERE id=?`).run(otherSource.payload.data.id);
    expect((await req(db, `/${otherSource.payload.data.id}/copy`, 'POST', { clientDocumentId }, 'foreign')).status).toBe(409);
    db.sqlite.prepare('DELETE FROM bank_soal WHERE id=?').run(sourceId);
    expect((await req(db, `/${firstData.data.packageId}/assets/${cloneId}`, 'GET', {}, 'foreign')).status).toBe(200);
    expect((await req(db, `/${firstData.data.packageId}`, 'GET', {}, 'foreign')).status).toBe(200);
    db.close();
  });

  it('copies a >512 KiB raster through staged core preparation with byte-exact atomic settlement', async () => {
    const db = routeDb();
    const large = paddedPng(700 * 1024);
    const largeId = imageIds[0];
    db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',?,'large-fixture',?)`).run(largeId, large.length, large);
    const source = await createPackage(db, { pg: [{ no: 1, soal: 'large image', gambar: { assetId: largeId } }] });
    const sourceId = source.payload.data.id;
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='approved' WHERE id=?`).run(sourceId);
    const copied = await req(db, `/${sourceId}/copy`, 'POST', { clientDocumentId: '223e4567-e89b-42d3-a456-426614174111' }, 'foreign');
    expect(copied.status).toBe(200);
    const data: any = await copied.json();
    const cloneId = data.data.content.pg[0].gambar.assetId;
    const clone: any = db.sqlite.prepare('SELECT owner_id,mime,byte_length,bytes FROM assessment_image_assets WHERE id=?').get(cloneId);
    expect(clone).toMatchObject({ owner_id: 2, mime: 'image/png', byte_length: large.length });
    expect(Buffer.from(clone.bytes)).toEqual(Buffer.from(large));
    expect(db.sqlite.prepare('SELECT bank_soal_id,revision FROM bank_soal_write_tokens WHERE bank_soal_id=?').get(data.data.packageId)).toEqual({ bank_soal_id: data.data.packageId, revision: 1 });
    db.close();
  });

  it('rejects a copy over the 4 MiB metadata budget before issuing any source BLOB query', async () => {
    const db = routeDb();
    const ids = Array.from({ length: 8 }, (_, i) => `523e4567-e89b-42d3-a456-${String(i + 1).padStart(12, '0')}`);
    for (const id of ids) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',614400,'metadata-only',X'00')`).run(id);
    const content = { pg: ids.map((assetId, i) => ({ no: i + 1, soal: `large ${i}`, gambar: { assetId } })) };
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(80,1,'Owner','IPAS','Oversize copy','5',?,1,'approved',0,0)`).run(JSON.stringify(content));
    for (const id of ids) db.sqlite.prepare('INSERT INTO bank_soal_assets(bank_soal_id,asset_id) VALUES(80,?)').run(id);
    let blobQueries = 0;
    const basePrepare = db.prepare.bind(db);
    db.prepare = ((sql: string) => { if (/SELECT[\s\S]*a\.bytes[\s\S]*FROM bank_soal_assets/i.test(sql)) blobQueries++; return basePrepare(sql); }) as any;
    const response = await req(db, '/80/copy', 'POST', {}, 'foreign');
    expect(response.status).toBe(400);
    expect(blobQueries).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=2').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=2').get() as any).n).toBe(0);
    db.close();
  });

  it('captures the complete association snapshot before source BLOB reads and aborts if it changes between queries', async () => {
    const db = routeDb(); insertPngAsset(db, imageIds[0]); insertPngAsset(db, imageIds[1]);
    const source = await createPackage(db, { pg: [
      { no: 1, soal: 'A', gambar: { assetId: imageIds[0] } }, { no: 2, soal: 'B', gambar: { assetId: imageIds[1] } },
    ] });
    const sourceId = source.payload.data.id;
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='approved' WHERE id=?`).run(sourceId);
    const basePrepare = db.prepare.bind(db);
    let removed = false;
    db.prepare = ((sql: string) => {
      const statement: any = basePrepare(sql);
      const all = statement.all.bind(statement);
      if (/SELECT a\.id,a\.owner_id,a\.mime,a\.byte_length,a\.sha256 FROM bank_soal_assets/i.test(sql)) {
        statement.all = async () => {
          const result = await all();
          if (!removed) { removed = true; db.sqlite.prepare('DELETE FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id=?').run(sourceId, imageIds[1]); }
          return result;
        };
      }
      return statement;
    }) as any;
    const response = await req(db, `/${sourceId}/copy`, 'POST', {}, 'foreign');
    expect(removed).toBe(true);
    expect(response.status).toBe(404);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=2').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=2').get() as any).n).toBe(0);
    db.close();
  });

  it('denies private foreign/admin copies and rechecks withdrawal at the atomic copy boundary', async () => {
    const db = routeDb(); insertPngAsset(db, imageIds[0]);
    const source = await createPackage(db, { pg: [{ no: 1, soal: 'private', gambar: { assetId: imageIds[0] } }] });
    const sourceId = source.payload.data.id;
    expect((await req(db, `/${sourceId}/copy`, 'POST', {}, 'foreign')).status).toBe(404);
    expect((await req(db, `/${sourceId}/copy`, 'POST', {}, 'admin')).status).toBe(404);
    await ensureBankSoalTables(db as any);
    const originalBatch = db.batch.bind(db);
    let batchNumber = 0;
    db.batch = async (statements: any[]) => {
      batchNumber++;
      if (batchNumber === 1) {
        db.sqlite.prepare(`UPDATE bank_soal SET is_public=0,moderation_status='private' WHERE id=?`).run(sourceId);
      }
      return originalBatch(statements);
    };
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='approved' WHERE id=?`).run(sourceId);
    const beforeAssets = (db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=2').get() as any).n;
    const response = await req(db, `/${sourceId}/copy`, 'POST', {}, 'foreign');
    expect(response.status).toBe(404);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=2').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=2').get() as any).n).toBe(beforeAssets);
    db.close();
  });

  it('serializes concurrent stable copy retries to one recipient-owned package', async () => {
    const db = routeDb(); insertPngAsset(db, imageIds[0]);
    const source = await createPackage(db, { pg: [{ no: 1, soal: 'copy me', gambar: { assetId: imageIds[0] } }] });
    const sourceId = source.payload.data.id;
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='approved' WHERE id=?`).run(sourceId);
    const clientDocumentId = '323e4567-e89b-42d3-a456-426614174000';
    const [left, right] = await Promise.all([
      req(db, `/${sourceId}/copy`, 'POST', { clientDocumentId }, 'foreign'),
      req(db, `/${sourceId}/copy`, 'POST', { clientDocumentId }, 'foreign'),
    ]);
    expect([left.status, right.status]).toEqual([200, 200]);
    const leftData: any = await left.json(), rightData: any = await right.json();
    expect(leftData.data.packageId).toBe(rightData.data.packageId);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=2 AND client_document_id=?').get(clientDocumentId) as any).n).toBe(1);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=2').get() as any).n).toBe(1);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets WHERE bank_soal_id=?').get(leftData.data.packageId) as any).n).toBe(1);
    db.close();
  });

  it('rolls back all copy rows when recipient quota or association commit fails', async () => {
    const db = routeDb(); insertPngAsset(db, imageIds[0]);
    const source = await createPackage(db, { pg: [{ no: 1, gambar: { assetId: imageIds[0] } }] });
    const sourceId = source.payload.data.id;
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='approved' WHERE id=?`).run(sourceId);
    for (let i = 0; i < 100; i++) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,2,'image/png',1,'x',X'00')`).run(`quota-${i}`);
    const quota = await req(db, `/${sourceId}/copy`, 'POST', {}, 'foreign');
    expect(quota.status).toBe(400);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=2').get() as any).n).toBe(0);
    db.sqlite.prepare('DELETE FROM assessment_image_assets WHERE owner_id=2').run();
    db.sqlite.exec(`CREATE TRIGGER fail_copy_association BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'copy association failed'); END;`);
    const failed = await req(db, `/${sourceId}/copy`, 'POST', {}, 'foreign');
    expect(failed.status).toBe(500);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=2').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=2').get() as any).n).toBe(0);
    db.close();
  });

  it('recovers trusted legacy bytes, marks expired and untrusted images unavailable, and preserves question text', async () => {
    const db = routeDb();
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(40,1,'Owner','IPAS','Air','5',?,0,'private',0,0)`).run(JSON.stringify({ pg: [
        { no: 1, soal: 'Expired keeps the stimulus text', gambar: { url: 'https://sewr2.vultrobjects.com/expired' } },
        { no: 2, soal: 'Untrusted keeps this too', gambar: { url: 'https://attacker.invalid/pixel' } },
      ] }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('missing', { status: 404 }));
    const recovered = await req(db, '/40/recover-images', 'POST', { baseRevision: 1 });
    const recoveredData: any = await recovered.json();
    expect(recovered.status).toBe(200);
    expect(recoveredData.data.revision).toBe(2);
    const stored: any = db.sqlite.prepare('SELECT content FROM bank_soal WHERE id=40').get();
    const parsed = JSON.parse(stored.content);
    expect(parsed.pg[0].soal).toBe('Expired keeps the stimulus text');
    expect(parsed.pg[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'expired_or_missing' });
    expect(parsed.pg[1].soal).toBe('Untrusted keeps this too');
    expect(parsed.pg[1].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'untrusted_host' });
    expect(stored.content).not.toContain('attacker.invalid');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
    db.close();
  });

  it('rejects an unsafe legacy SVG before fetching other recoverable images in the same package', async () => {
    const db = routeDb();
    const content = { pg: [
      { no: 1, soal: 'valid legacy photo', gambar: { url: 'https://upload.wikimedia.org/should-not-fetch.png' } },
      { no: 2, soal: 'bad old SVG', gambar: { type: 'svg', dataUri: 'data:image/svg+xml;utf8,%3Csvg%20onload%3D%22evil()%22/%3E' } },
    ] };
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content) VALUES(63,1,'Owner','IPAS','SVG','5',?)`).run(JSON.stringify(content));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    const response = await req(db, '/63/recover-images', 'POST', { baseRevision: 1 });
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((db.sqlite.prepare('SELECT revision FROM bank_soal WHERE id=63').get() as any).revision).toBe(1);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get() as any).n).toBe(0);
    fetchSpy.mockRestore(); db.close();
  });

  it('persists recovered raster association and rejects stale revisions before trusted fetch', async () => {
    const db = routeDb();
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(40,1,'Owner','IPAS','Air','5',?,0,'private',0,0)`).run(JSON.stringify({ pg: [{ no: 1, soal: 'Preserve', gambar: { url: 'https://upload.wikimedia.org/image.png' } }] }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    expect((await req(db, '/40/recover-images', 'POST', { baseRevision: 2 })).status).toBe(409);
    expect(fetchSpy).not.toHaveBeenCalled();
    const response = await req(db, '/40/recover-images', 'POST', { baseRevision: 1 });
    const payload: any = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.revision).toBe(2);
    const content = payload.data.content.pg[0];
    expect(content.soal).toBe('Preserve');
    expect(content.gambar.url).toMatch(/^\/api\/banksoal\/40\/assets\//);
    const assetId = content.gambar.assetId;
    expect(db.sqlite.prepare('SELECT owner_id FROM assessment_image_assets WHERE id=?').get(assetId)).toEqual({ owner_id: 1 });
    expect(db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=40').get()).toEqual({ asset_id: assetId });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore(); db.close();
  });

  it('recovers three small unique sources using their actual aggregate bytes and settles them together', async () => {
    const db = routeDb();
    const content = { pg: Array.from({ length: 3 }, (_, i) => ({ no: i + 1, soal: `small ${i + 1}`, gambar: { url: `https://upload.wikimedia.org/small-${i + 1}.png` } })) };
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content) VALUES(70,1,'Owner','IPAS','Small','5',?)`).run(JSON.stringify(content));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    const response = await req(db, '/70/recover-images', 'POST', { baseRevision: 1 });
    const result: any = await response.json();
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    const ids = result.data.content.pg.map((item: any) => item.gambar.assetId);
    expect(new Set(ids).size).toBe(3);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets WHERE bank_soal_id=70').get() as any).n).toBe(3);
    expect((db.sqlite.prepare(`SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1 AND id IN (${ids.map(() => '?').join(',')})`).get(...ids) as any).n).toBe(3);
    expect((db.sqlite.prepare('SELECT SUM(byte_length) AS n FROM assessment_image_assets WHERE owner_id=1 AND id IN (?,?,?)').get(...ids) as any).n).toBe(png.length * 3);
    fetchSpy.mockRestore(); db.close();
  });

  it('preflights nine legacy refs and mixed owned/new refs before any fetch or asset insertion', async () => {
    const db = routeDb();
    const nine = { pg: Array.from({ length: 9 }, (_, i) => ({ no: i + 1, soal: `q${i + 1}`, gambar: { url: `https://upload.wikimedia.org/p${i}.png` } })) };
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content) VALUES(60,1,'Owner','IPAS','Limit','5',?)`).run(JSON.stringify(nine));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    expect((await req(db, '/60/recover-images', 'POST', { baseRevision: 1 })).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get() as any).n).toBe(0);

    const ids = Array.from({ length: 8 }, (_, i) => `423e4567-e89b-42d3-a456-${String(i + 1).padStart(12, '0')}`);
    for (const id of ids) insertAsset(db, id);
    const mixed = { pg: [...ids.map((assetId, i) => ({ no: i + 1, gambar: { assetId } })), { no: 9, gambar: { src: 'https://upload.wikimedia.org/new.png' } }] };
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content) VALUES(61,1,'Owner','IPAS','Mixed','5',?)`).run(JSON.stringify(mixed));
    db.sqlite.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id) VALUES ${ids.map(() => '(61,?)').join(',')}`).run(...ids);
    expect((await req(db, '/61/recover-images', 'POST', { baseRevision: 1 })).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get() as any).n).toBe(8);
    fetchSpy.mockRestore(); db.close();
  });

  it('fetches a duplicate trusted legacy URL once and shares one recovered owned asset', async () => {
    const db = routeDb();
    const repeated = { pg: [
      { no: 1, soal: 'one', gambar: { url: 'https://upload.wikimedia.org/shared.png' } },
      { no: 2, soal: 'two', gambar: { dataUri: 'https://upload.wikimedia.org/shared.png' } },
    ] };
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content) VALUES(62,1,'Owner','IPAS','Repeated','5',?)`).run(JSON.stringify(repeated));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    const response = await req(db, '/62/recover-images', 'POST', { baseRevision: 1 });
    const payload: any = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.revision).toBe(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(payload.data.content.pg[0].gambar.assetId).toBe(payload.data.content.pg[1].gambar.assetId);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get() as any).n).toBe(1);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets WHERE bank_soal_id=62').get() as any).n).toBe(1);
    const retry = await req(db, '/62/recover-images', 'POST', { baseRevision: 2 });
    expect(retry.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore(); db.close();
  });

  it('preserves a competing revision after recovery fetch and reports CAS conflict', async () => {
    const db = routeDb();
    db.sqlite.prepare(`INSERT INTO bank_soal(id,user_id,user_nama,mata_pelajaran,topik,jenjang_kelas,content,is_public,moderation_status,legacy_compat,is_hidden)
      VALUES(40,1,'Owner','IPAS','Air','5',?,0,'private',0,0)`).run(JSON.stringify({ pg: [{ no: 1, soal: 'old', gambar: { url: 'https://upload.wikimedia.org/image.png' } }] }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      db.sqlite.prepare('UPDATE bank_soal SET revision=2,content=? WHERE id=40').run(JSON.stringify({ pg: [{ no: 1, soal: 'concurrent winner' }] }));
      return new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } });
    });
    const response = await req(db, '/40/recover-images', 'POST', { baseRevision: 1 });
    expect(response.status).toBe(409);
    expect(JSON.parse((db.sqlite.prepare('SELECT content FROM bank_soal WHERE id=40').get() as any).content).pg[0].soal).toBe('concurrent winner');
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets WHERE bank_soal_id=40').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get() as any).n).toBe(0);
    fetchSpy.mockRestore(); db.close();
  });

  it('commits a valid generation fence, package, owned associations, ledger pointer, and receipt in one batch', async () => {
    const db = routeDb(); insertAsset(db, imageIds[0]);
    const clientDocumentId = '523e4567-e89b-42d3-a456-426614174000';
    const fence = await acquireFence(db, clientDocumentId);
    const content = { pg: [{ no: 1, soal: 'Generated once', gambar: { assetId: imageIds[0] } }] };
    const saved = await fencedWrite(db, fence, content);
    const replay = await fencedWrite(db, fence, content);
    const ledger: any = db.sqlite.prepare('SELECT state,package_id,result_json,failure_code FROM assessment_generation_requests WHERE owner_id=1 AND client_document_id=?').get(clientDocumentId);
    expect(ledger).toEqual({ state: 'completed', package_id: saved.packageId, result_json: 'null', failure_code: null });
    expect(saved.saveStatus).toBe('saved');
    expect(replay.packageId).toBe(saved.packageId);
    expect(saved.content.pg[0].gambar.assetId).toBe(imageIds[0]);
    expect(db.sqlite.prepare('SELECT revision FROM bank_soal WHERE id=?').get(saved.packageId)).toEqual({ revision: 1 });
    expect(db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=?').get(saved.packageId)).toEqual({ asset_id: imageIds[0] });
    expect(db.sqlite.prepare('SELECT bank_soal_id,revision FROM bank_soal_write_tokens WHERE token=(SELECT content_write_token FROM bank_soal WHERE id=?)').get(saved.packageId)).toEqual({ bank_soal_id: saved.packageId, revision: 1 });
    db.close();
  });

  it('reconciles same-stage retries for fenced and ordinary creates without treating matching bytes as an ID conflict', async () => {
    const fencedDb = routeDb();
    const fence = await acquireFence(fencedDb, '523e4567-e89b-42d3-a456-426614174226');
    const staged = await prepareAssessmentAsset(1, png, 'image/png');
    const content = { pg: [{ no: 1, soal: 'same stage retry', gambar: { assetId: staged.id } }] };
    const stage = new Map([[staged.id, staged]]);
    const first = await fencedWrite(fencedDb, fence, content, fence.clientDocumentId, stage);
    const retry = await fencedWrite(fencedDb, fence, content, fence.clientDocumentId, stage);
    expect(retry.packageId).toBe(first.packageId);
    expect(fencedDb.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=1 AND client_document_id=?').get(fence.clientDocumentId)).toEqual({ n: 1 });
    expect(fencedDb.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE id=? AND owner_id=1').get(staged.id)).toEqual({ n: 1 });
    expect(fencedDb.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id=?').get(first.packageId, staged.id)).toEqual({ n: 1 });
    expect(fencedDb.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens WHERE bank_soal_id=?').get(first.packageId)).toEqual({ n: 1 });
    fencedDb.close();

    const ordinaryDb = routeDb();
    const ordinaryStage = await prepareAssessmentAsset(1, png, 'image/png');
    const documentId = '523e4567-e89b-42d3-a456-426614174227';
    const ordinaryContent = { pg: [{ no: 1, soal: 'ordinary same stage retry', gambar: { assetId: ordinaryStage.id } }] };
    const ordinaryInput = { ownerId: 1, clientDocumentId: documentId, content: ordinaryContent, metadata: generationMetadata, stagedAssets: new Map([[ordinaryStage.id, ordinaryStage]]) };
    const ordinaryFirst = await createOwnedAssessmentPackage(ordinaryDb as any, ordinaryInput);
    const ordinaryRetry = await createOwnedAssessmentPackage(ordinaryDb as any, ordinaryInput);
    expect(ordinaryRetry.packageId).toBe(ordinaryFirst.packageId);
    expect((ordinaryDb.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE id=? AND owner_id=1').get(ordinaryStage.id) as any).n).toBe(1);
    expect((ordinaryDb.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=1 AND client_document_id=?').get(documentId) as any).n).toBe(1);
    expect((ordinaryDb.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens WHERE bank_soal_id=?').get(ordinaryFirst.packageId) as any).n).toBe(1);
    ordinaryDb.close();
  });

  it('rejects wrong owner/document and cancelled, missing-job, or expired-job fences without package writes', async () => {
    const db = routeDb();
    const wrongDocId = '623e4567-e89b-42d3-a456-426614174000';
    const wrongDocFence = await acquireFence(db, wrongDocId);
    await expect(fencedWrite(db, wrongDocFence, { pg: [{ soal: 'wrong doc' }] }, '723e4567-e89b-42d3-a456-426614174000'))
      .rejects.toMatchObject({ code: 'generation_fenced_conflict' });
    await expect(createOwnedAssessmentPackage(db as any, { ownerId: 2, clientDocumentId: wrongDocId, content: { pg: [{ soal: 'wrong owner' }] }, metadata: generationMetadata, generationFence: wrongDocFence }))
      .rejects.toMatchObject({ code: 'generation_fenced_conflict' });
    await expect(fencedWrite(db, { ...wrongDocFence, runToken: 'f23e4567-e89b-42d3-a456-426614174000' }, { pg: [{ soal: 'wrong run' }] }))
      .rejects.toMatchObject({ code: 'generation_fenced_conflict' });

    const cancelledId = '823e4567-e89b-42d3-a456-426614174000';
    const cancelledFence = await acquireFence(db, cancelledId);
    expect((await endAssessmentGenerationRequest(db as any, cancelledFence, 'cancelled', 'USER_CANCELLED')).ended).toBe(true);
    await expect(fencedWrite(db, cancelledFence, { pg: [{ soal: 'cancelled' }] })).rejects.toMatchObject({ code: 'generation_fenced_conflict' });

    const missingJobId = '923e4567-e89b-42d3-a456-426614174000';
    const missingJobFence = { ...(await acquireFence(db, missingJobId)), jobId: 'sse-job-missing' };
    await expect(fencedWrite(db, missingJobFence, { pg: [{ soal: 'missing lease' }] })).rejects.toMatchObject({ code: 'generation_fenced_conflict' });

    const expiredJobId = 'a23e4567-e89b-42d3-a456-426614174000';
    const expiredJobFence = { ...(await acquireFence(db, expiredJobId)), jobId: 'sse-job-expired' };
    db.sqlite.prepare(`INSERT INTO ai_generation_jobs(user_id,job_id,state,lease_until) VALUES(1,?,'running',0)`).run(expiredJobFence.jobId);
    const expiredAsset = await prepareAssessmentAsset(1, png, 'image/png');
    await expect(fencedWrite(db, expiredJobFence, { pg: [{ soal: 'expired lease', gambar: { assetId: expiredAsset.id } }] }, expiredJobFence.clientDocumentId, new Map([[expiredAsset.id, expiredAsset]]))).rejects.toMatchObject({ code: 'generation_fenced_conflict' });
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets').get() as any).n).toBe(0);
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get() as any).n).toBe(0);
    db.close();
  });

  it('latches a valid SSE lease once and completes even if lease time expires mid-batch', async () => {
    const db = routeDb();
    const clientDocumentId = 'b23e4567-e89b-42d3-a456-426614174000';
    const fence = { ...(await acquireFence(db, clientDocumentId)), jobId: 'sse-job-live' };
    db.sqlite.prepare(`INSERT INTO ai_generation_jobs(user_id,job_id,state,lease_until) VALUES(1,?,'running',?)`).run(fence.jobId, Math.floor(Date.now() / 1000) + 3600);
    db.sqlite.exec(`CREATE TRIGGER expire_lease_after_package_insert AFTER INSERT ON bank_soal BEGIN
      UPDATE ai_generation_jobs SET lease_until=0 WHERE user_id=1 AND job_id='sse-job-live'; END;`);
    const staged = await prepareAssessmentAsset(1, png, 'image/png');
    const saved = await fencedWrite(db, fence, { pg: [{ soal: 'latched before expiry', gambar: { assetId: staged.id } }] }, fence.clientDocumentId, new Map([[staged.id, staged]]));
    expect(saved.packageId).toBeGreaterThan(0);
    expect((db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE client_document_id=?').get(clientDocumentId) as any)).toEqual({ state: 'completed', package_id: saved.packageId });
    expect((db.sqlite.prepare('SELECT lease_until FROM ai_generation_jobs WHERE job_id=?').get(fence.jobId) as any).lease_until).toBe(0);
    expect((db.sqlite.prepare('SELECT owner_id FROM assessment_image_assets WHERE id=?').get(staged.id) as any)).toEqual({ owner_id: 1 });
    db.close();
  });

  it('rolls back package, associations, ledger settlement, and receipt on association/completion/receipt failures', async () => {
    for (const failure of ['association', 'completion', 'receipt']) {
      const db = routeDb(); insertAsset(db, imageIds[0]);
      const clientDocumentId = failure === 'association' ? 'c23e4567-e89b-42d3-a456-426614174000'
        : failure === 'completion' ? 'd23e4567-e89b-42d3-a456-426614174000' : 'e23e4567-e89b-42d3-a456-426614174000';
      const fence = await acquireFence(db, clientDocumentId);
      if (failure === 'association') db.sqlite.exec(`CREATE TRIGGER fail_fenced_association BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'association failed'); END;`);
      if (failure === 'completion') db.sqlite.exec(`CREATE TRIGGER fail_fenced_completion BEFORE UPDATE OF state ON assessment_generation_requests WHEN NEW.state='completed' BEGIN SELECT RAISE(ABORT,'completion failed'); END;`);
      if (failure === 'receipt') db.sqlite.exec(`CREATE TRIGGER fail_fenced_receipt BEFORE INSERT ON bank_soal_write_tokens BEGIN SELECT RAISE(ABORT,'receipt failed'); END;`);
      await expect(fencedWrite(db, fence, { pg: [{ no: 1, soal: 'rollback', gambar: { assetId: imageIds[0] } }] })).rejects.toThrow();
      expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get() as any).n).toBe(0);
      expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets').get() as any).n).toBe(0);
      expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens').get() as any).n).toBe(0);
      expect((db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE client_document_id=?').get(clientDocumentId) as any)).toEqual({ state: 'running', package_id: null });
      db.close();
    }
  });

  it('settles an identical existing stable package without altering content, revision, visibility, or associations', async () => {
    const db = routeDb(); insertAsset(db, imageIds[0]);
    const clientDocumentId = 'f23e4567-e89b-42d3-a456-426614174000';
    const content = { pg: [{ no: 1, soal: 'existing winner', gambar: { assetId: imageIds[0] } }] };
    const ordinary = await createOwnedAssessmentPackage(db as any, { ownerId: 1, clientDocumentId, content, metadata: generationMetadata });
    db.sqlite.prepare(`UPDATE bank_soal SET is_public=1,moderation_status='pending' WHERE id=?`).run(ordinary.packageId);
    const before: any = db.sqlite.prepare('SELECT content,content_hash,revision,is_public,moderation_status FROM bank_soal WHERE id=?').get(ordinary.packageId);
    const fence = await acquireFence(db, clientDocumentId);
    const saved = await fencedWrite(db, fence, content);
    const after = db.sqlite.prepare('SELECT content,content_hash,revision,is_public,moderation_status FROM bank_soal WHERE id=?').get(ordinary.packageId);
    expect(saved.packageId).toBe(ordinary.packageId);
    expect(after).toEqual(before);
    expect((db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE client_document_id=?').get(clientDocumentId) as any)).toEqual({ state: 'completed', package_id: ordinary.packageId });
    expect((db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=?').get(ordinary.packageId) as any).asset_id).toBe(imageIds[0]);
    db.close();
  });

  it('rejects completed-ledger pointers to a same-owner different document or a foreign-owner package', async () => {
    const cases = [
      { packageOwner: 1, packageDocumentId: 'e43e4567-e89b-42d3-a456-426614174000' },
      { packageOwner: 2, packageDocumentId: 'd43e4567-e89b-42d3-a456-426614174000' },
    ];
    for (const scenario of cases) {
      const db = routeDb();
      const targetDocumentId = scenario.packageOwner === 2 ? scenario.packageDocumentId : 'd43e4567-e89b-42d3-a456-426614174000';
      const fence = await acquireFence(db, targetDocumentId);
      const content = { pg: [{ no: 1, soal: 'identical snapshot' }] };
      const unrelated = await createOwnedAssessmentPackage(db as any, {
        ownerId: scenario.packageOwner,
        clientDocumentId: scenario.packageDocumentId,
        content,
        metadata: { ...generationMetadata, user_nama: scenario.packageOwner === 1 ? 'Owner' : 'Foreign' },
      });
      expect((await completeAssessmentGenerationRequest(db as any, fence, { packageId: unrelated.packageId })).completed).toBe(true);
      await expect(fencedWrite(db, fence, content)).rejects.toMatchObject({ code: 'generation_fenced_conflict' });
      expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get() as any).n).toBe(1);
      expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=1 AND client_document_id=?').get(targetDocumentId) as any).n).toBe(0);
      expect((db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE owner_id=1 AND client_document_id=?').get(targetDocumentId) as any))
        .toEqual({ state: 'completed', package_id: unrelated.packageId });
      expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens').get() as any).n).toBe(1);
      db.close();
    }
  });

  it('does not settle or overwrite an existing stable package edited before the fence latch', async () => {
    const db = routeDb();
    const clientDocumentId = 'a33e4567-e89b-42d3-a456-426614174000';
    const content = { pg: [{ no: 1, soal: 'observed content' }] };
    const ordinary = await createOwnedAssessmentPackage(db as any, { ownerId: 1, clientDocumentId, content, metadata: generationMetadata });
    const receiptsBefore = (db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens').get() as any).n;
    const fence = await acquireFence(db, clientDocumentId);
    const originalBatch = db.batch.bind(db);
    let interleaved = false;
    db.batch = async statements => {
      if (!interleaved) {
        interleaved = true;
        db.sqlite.prepare('UPDATE bank_soal SET content=?,revision=revision+1,content_hash=? WHERE id=?')
          .run('{"pg":[{"soal":"concurrent edit"}]}', 'edited-hash', ordinary.packageId);
      }
      return originalBatch(statements);
    };
    await expect(fencedWrite(db, fence, content)).rejects.toMatchObject({ code: 'generation_fenced_conflict' });
    expect((db.sqlite.prepare('SELECT content,revision FROM bank_soal WHERE id=?').get(ordinary.packageId) as any)).toEqual({ content: '{"pg":[{"soal":"concurrent edit"}]}', revision: 2 });
    expect((db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE client_document_id=?').get(clientDocumentId) as any)).toEqual({ state: 'running', package_id: null });
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens').get() as any).n).toBe(receiptsBefore);
    db.close();
  });

  it('refuses fenced settlement when an existing package association set differs from the expected content', async () => {
    const db = routeDb(); insertAsset(db, imageIds[0]); insertAsset(db, imageIds[1]);
    const clientDocumentId = 'd33e4567-e89b-42d3-a456-426614174000';
    const content = { pg: [{ no: 1, soal: 'association snapshot', gambar: { assetId: imageIds[0] } }] };
    const ordinary = await createOwnedAssessmentPackage(db as any, { ownerId: 1, clientDocumentId, content, metadata: generationMetadata });
    db.sqlite.prepare('DELETE FROM bank_soal_assets WHERE bank_soal_id=?').run(ordinary.packageId);
    db.sqlite.prepare('INSERT INTO bank_soal_assets(bank_soal_id,asset_id) VALUES(?,?)').run(ordinary.packageId, imageIds[1]);
    const fence = await acquireFence(db, clientDocumentId);
    await expect(fencedWrite(db, fence, content)).rejects.toMatchObject({ code: 'generation_fenced_conflict' });
    expect((db.sqlite.prepare('SELECT revision FROM bank_soal WHERE id=?').get(ordinary.packageId) as any).revision).toBe(1);
    expect((db.sqlite.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=?').get(ordinary.packageId) as any).asset_id).toBe(imageIds[1]);
    expect((db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE client_document_id=?').get(clientDocumentId) as any)).toEqual({ state: 'running', package_id: null });
    db.close();
  });

  it('cancellation before a fence prevents writes; cancellation after completion cannot unsettle it', async () => {
    const db = routeDb();
    const cancelledId = 'b33e4567-e89b-42d3-a456-426614174000';
    const cancelledFence = await acquireFence(db, cancelledId);
    expect((await endAssessmentGenerationRequest(db as any, cancelledFence, 'cancelled', 'USER_CANCELLED')).ended).toBe(true);
    await expect(fencedWrite(db, cancelledFence, { pg: [{ soal: 'cancelled' }] })).rejects.toMatchObject({ code: 'generation_fenced_conflict' });
    const completedId = 'c33e4567-e89b-42d3-a456-426614174000';
    const completedFence = await acquireFence(db, completedId);
    const saved = await fencedWrite(db, completedFence, { pg: [{ soal: 'complete' }] });
    expect((await endAssessmentGenerationRequest(db as any, completedFence, 'cancelled', 'USER_CANCELLED')).ended).toBe(false);
    expect((db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE client_document_id=?').get(completedId) as any)).toEqual({ state: 'completed', package_id: saved.packageId });
    expect((db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal WHERE user_id=1').get() as any).n).toBe(1);
    db.close();
  });

  it('requires migration 0043 generation-ledger schema at dev startup without attempting database writes', async () => {
    const tables = new Map(Object.entries(REQUIRED_LOCAL_SCHEMA).filter(([table]) => table !== 'assessment_generation_requests'));
    const fakeDb: any = {
      prepare(sql: string) {
        let table = '';
        const statement: LocalSchemaStatement = {
          bind(...values: unknown[]) { if (typeof values[0] === 'string') table = values[0]; return statement; },
          async first() {
            if (sql.includes('sqlite_schema')) return tables.has(table) ? { name: table } : null;
            if (sql.includes('certificate_issuance_counter')) return { singleton_id: 1 };
            return null;
          },
          async all() {
            const match = sql.match(/^PRAGMA table_info\('([^']+)'\)$/);
            return { results: [...(tables.get(match?.[1] || '') || [])].map(name => ({ name })) };
          },
        };
        return statement;
      },
    };
    const factory = async () => ({ env: { DB: fakeDb }, dispose: async () => {} });
    await expect(assertLocalSchemaReady({ getPlatformProxy: factory as any, configPath: 'wrangler.jsonc' }))
      .rejects.toMatchObject({ missing: expect.arrayContaining(['assessment_generation_requests (tabel)']) });
    const startDev = vi.fn();
    const logger = { error: vi.fn() };
    await expect(runIfLocalSchemaReady({ getPlatformProxy: factory as any, configPath: 'wrangler.jsonc', logger }, startDev)).resolves.toBe(false);
    expect(startDev).not.toHaveBeenCalled();
  });
});
