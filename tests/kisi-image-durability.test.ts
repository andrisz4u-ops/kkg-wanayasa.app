import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeAssessmentImages } from '../src/lib/assessment-image-durability';
import { preparePackageContent } from '../src/lib/assessment-packages';
import { finalizeAssessmentPackage, saveAssessmentTelemetryAndBankSoal } from '../src/routes/kisi';
import { SqliteD1 } from './helpers/sqlite-d1';
import { acquireAssessmentGenerationRequest } from '../src/lib/assessment-generation-requests';

const ownerId = 1;
const webp = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==', 'base64').subarray(0, 42);
const makeId = (n: number) => `123e4567-e89b-42d3-a456-${String(n).padStart(12, '0')}`;
const originalFetch = globalThis.fetch;

function database() {
  const db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT);
    CREATE TABLE sekolah (id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT, kop_surat_url TEXT, npsn TEXT, alamat TEXT);
    INSERT INTO users(id,nama,email,role) VALUES (1,'Owner','owner@test','user');`);
  for (const migration of ['0018_bank_soal.sql', '0040_bank_soal_moderation.sql', '0041_assessment_image_assets.sql', '0042_assessment_package_revisions.sql', '0043_assessment_generation_requests.sql', '0044_assessment_image_capacity.sql']) {
    db.sqlite.exec(readFileSync(resolve(process.cwd(), `migrations/${migration}`), 'utf8'));
  }
  return db;
}

function insertAsset(db: SqliteD1, n: number) {
  db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,?,'image/webp',?,'test',?)`)
    .run(makeId(n), ownerId, webp.length, webp);
}

afterEach(() => { globalThis.fetch = originalFetch; vi.restoreAllMocks(); });

describe('kisi assessment image durability', () => {
  it.each(['storage_write_failed', 'body_read_failed'])('preserves safe failure reason %s through normalization and package preparation', async reason => {
    const db = database();
    globalThis.fetch = vi.fn() as any;
    const initial = { pg: [{ no: 1, soal: 'Preserve stimulus', gambar: { imageUnavailable: true, imageUnavailableReason: reason } }] };
    const normalized = await normalizeAssessmentImages(db as any, ownerId, initial);
    expect(normalized.content.pg[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: reason, imageWarningReason: reason });
    const prepared = preparePackageContent(normalized.content);
    expect(prepared.content.pg[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: reason });
    expect(JSON.stringify(prepared.content)).not.toMatch(/Error:|secret|https?:/i);
    db.close();
  });

  it('preserves dependent question text and never persists/logs an expired signed URL', async () => {
    const db = database();
    const source = 'https://sewr2.vultrobjects.com/private/signed-secret?expires=old';
    globalThis.fetch = vi.fn(async () => new Response('expired', { status: 404 })) as any;
    const data: any = { pg: [{ no: 1, soal: 'Perhatikan gambar berikut. Tentukan bagian X.', imageRequired: true, gambar: { url: source } }] };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' }, { mataPelajaran: 'IPAS', topik: 'Organ', jenjangKelas: '5' }, data);

    expect(data.pg[0].soal).toBe('Perhatikan gambar berikut. Tentukan bagian X.');
    expect(data.pg[0].imageRequired).toBe(true);
    expect(data.pg[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'expired_or_missing' });
    expect(data._persistence).toMatchObject({ packageId: expect.any(Number), revision: 1, saveStatus: 'saved' });
    expect(JSON.stringify(data)).not.toContain('signed-secret');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('signed-secret');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    db.close();
  });

  it('trusts only structured SVG rebuilt by the application renderer without a network request', async () => {
    const db = database();
    globalThis.fetch = vi.fn() as any;
    const data: any = { pg: [{ no: 1, soal: 'Balok memiliki ukuran tertentu.', visual_stimulus: { type: 'balok', params: { p: 12, l: 8, t: 6, unit: 'cm' } }, gambar: { type: 'svg', svg: '<svg onload="evil()"></svg>', url: 'data:image/svg+xml,<svg/>' } }] };
    const result = await normalizeAssessmentImages(db as any, ownerId, data);
    expect(result.content.pg[0].gambar.svg).toContain('Balok');
    expect(result.content.pg[0].gambar.svg).not.toContain('onload');
    expect(result.content.pg[0].visual_stimulus).toEqual({ type: 'balok', params: { p: 12, l: 8, t: 6, unit: 'cm' } });
    const secondPass = await normalizeAssessmentImages(db as any, ownerId, result.content);
    expect(secondPass.content.pg[0].gambar.svg).toBe(result.content.pg[0].gambar.svg);
    expect(secondPass.content.pg[0].visual_stimulus).toEqual(result.content.pg[0].visual_stimulus);
    expect(result.warnings).toEqual([]);
    expect(secondPass.warnings).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets').get()).toMatchObject({ n: 0 });
    db.close();
  });

  it('checks owner records and stops before ingesting a ninth unique raster reference', async () => {
    const db = database();
    for (let n = 1; n <= 8; n++) insertAsset(db, n);
    globalThis.fetch = vi.fn() as any;
    const content = { pg: Array.from({ length: 9 }, (_, i) => ({ no: i + 1, gambar: i < 8 ? { assetId: makeId(i + 1) } : { url: 'https://sewr2.vultrobjects.com/private/ninth' } })) };
    const result = await normalizeAssessmentImages(db as any, ownerId, content);
    expect(result.content.pg[8].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'package_image_count_limit' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets').get()).toMatchObject({ n: 8 });
    db.close();
  });

  it('rolls package creation and asset associations back together on association failure', async () => {
    const db = database();
    insertAsset(db, 10);
    db.sqlite.exec(`CREATE TRIGGER reject_generation_asset BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'fixture failure'); END;`);
    const data: any = { pg: [{ no: 1, soal: 'stimulus', imageRequired: true, gambar: { assetId: makeId(10) } }] };
    await saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' }, { mataPelajaran: 'IPAS', topik: 'Air', jenjangKelas: '5' }, data);
    expect(data._persistence).toMatchObject({ packageId: null, revision: null, saveStatus: 'failed' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets').get()).toMatchObject({ n: 0 });
    db.close();
  });

  it('scrubs every duplicate owned-asset alias before returning controlled failed-save content', async () => {
    const db = database();
    insertAsset(db, 11);
    db.sqlite.exec(`CREATE TRIGGER reject_duplicate_generation_asset BEFORE INSERT ON bank_soal_assets BEGIN SELECT RAISE(ABORT,'fixture failure'); END;`);
    const data: any = { pg: [
      { no: 1, soal: 'Stimulus pertama.', gambar: { assetId: makeId(11), url: 'https://signed.invalid/first?secret=a', alt: 'Gambar valid' } },
      { no: 2, soal: 'Stimulus kedua.', gambar: {
        assetId: makeId(11), url: 'https://signed.invalid/second?secret=b', gambar: 'https://signed.invalid/alias',
        dataUri: 'data:image/svg+xml,<svg/>', svg: '<svg onload="evil()"></svg>', sourceUrl: 'https://signed.invalid/source',
        imageUnavailable: true, imageUnavailableReason: 'expired_or_missing',
      } },
    ] };
    await saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' }, { mataPelajaran: 'IPAS', topik: 'Air', jenjangKelas: '5' }, data);
    expect(data._persistence).toMatchObject({ packageId: null, revision: null, saveStatus: 'failed' });
    expect(data.pg[0].gambar).toEqual({ assetId: makeId(11), url: `/api/assessment-assets/${makeId(11)}`, mime: 'image/webp', byteLength: webp.length, alt: 'Gambar valid' });
    expect(data.pg[1].gambar).toEqual({ assetId: makeId(11), url: `/api/assessment-assets/${makeId(11)}`, mime: 'image/webp', byteLength: webp.length });
    expect(data.pg.map((item: any) => item.soal)).toEqual(['Stimulus pertama.', 'Stimulus kedua.']);
    expect(JSON.stringify(data)).not.toMatch(/signed\.invalid|data:image|<svg|sourceUrl|secret=/);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_assets').get()).toMatchObject({ n: 0 });
    db.close();
  });

  it('removes only staged references and source aliases from a definitely failed save', async () => {
    const db = database();
    const basePrepare = db.prepare.bind(db);
    db.prepare = ((sql: string) => {
      const statement: any = basePrepare(sql);
      const bind = statement.bind.bind(statement);
      statement.bind = (...values: any[]) => bind(...values.map(value => value instanceof ArrayBuffer ? Buffer.from(value) : value));
      return statement;
    }) as any;
    insertAsset(db, 12);
    const imageBytes = new Uint8Array(readFileSync('public/static/screenshots/home-mobile.png'));
    const source = 'https://upload.wikimedia.org/staged-private-source.png?signature=private';
    globalThis.fetch = vi.fn(async () => new Response(imageBytes, { status: 200, headers: { 'Content-Type': 'image/png' } })) as any;
    db.sqlite.exec(`CREATE TRIGGER reject_staged_generation BEFORE INSERT ON bank_soal BEGIN SELECT RAISE(ABORT,'staged package failed'); END;`);
    const data: any = { pg: [
      { no: 1, soal: 'existing remains', gambar: { assetId: makeId(12) } },
      { no: 2, soal: 'staged removed', gambar: { url: source } },
    ] };
    await saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' }, { mataPelajaran: 'IPAS', topik: 'Air', jenjangKelas: '5' }, data);
    expect(data._persistence).toMatchObject({ saveStatus: 'failed', packageId: null });
    expect(data.pg[0].gambar.assetId).toBe(makeId(12));
    expect(data.pg[1].gambar).toMatchObject({ imageUnavailable: true });
    expect(data.pg[1].gambar).not.toHaveProperty('assetId');
    expect(data.pg[1].gambar).not.toHaveProperty('url');
    expect(JSON.stringify(data)).not.toContain(source);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=1').get()).toEqual({ n: 1 });
    db.close();
  });

  it('does not mark a fenced generation failed after an uncertain staged settlement outcome', async () => {
    const db = database();
    const clientDocumentId = '123e4567-e89b-42d3-a456-426614174999';
    const acquired = await acquireAssessmentGenerationRequest(db as any, { ownerId, clientDocumentId, semanticInput: { topic: 'uncertain' } });
    if (acquired.kind !== 'acquired') throw new Error('fence not acquired');
    const originalBatch = db.batch.bind(db);
    let batches = 0;
    db.batch = async statements => { batches++; if (batches === 2) throw new Error('simulated uncertain D1 outcome'); return originalBatch(statements); };
    const imageBytes = new Uint8Array(readFileSync('public/static/screenshots/home-mobile.png'));
    globalThis.fetch = vi.fn(async () => new Response(imageBytes, { status: 200, headers: { 'Content-Type': 'image/png' } })) as any;
    const data: any = { pg: [{ no: 1, soal: 'unknown result', gambar: { url: 'https://upload.wikimedia.org/unknown-outcome.png' } }] };
    await expect(saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' },
      { clientDocumentId, mataPelajaran: 'IPAS', topik: 'uncertain', jenjangKelas: '5' }, data, null, acquired.fence)).rejects.toThrow('assessment_package_settlement_unknown');
    db.batch = originalBatch;
    expect(db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE owner_id=? AND client_document_id=?').get(ownerId, clientDocumentId)).toEqual({ state: 'running', package_id: null });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=?').get(ownerId)).toEqual({ n: 0 });
    db.close();
  });

  it('scrubs staged references from a fenced, deterministic pre-batch package validation failure', async () => {
    const db = database();
    const clientDocumentId = '123e4567-e89b-42d3-a456-426614174998';
    const acquired = await acquireAssessmentGenerationRequest(db as any, { ownerId, clientDocumentId, semanticInput: { topic: 'deep' } });
    if (acquired.kind !== 'acquired') throw new Error('fence not acquired');
    const imageBytes = new Uint8Array(readFileSync('public/static/screenshots/home-mobile.png'));
    const source = 'https://upload.wikimedia.org/deep-invalid.png?secret=do-not-return';
    globalThis.fetch = vi.fn(async () => new Response(imageBytes, { status: 200, headers: { 'Content-Type': 'image/png' } })) as any;
    let nested: any = { leaf: true };
    for (let i = 0; i < 40; i++) nested = { child: nested };
    const data: any = { pg: [{ no: 1, soal: 'preserved prompt', nested, gambar: { url: source } }] };
    await saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' },
      { clientDocumentId, mataPelajaran: 'IPAS', topik: 'deep', jenjangKelas: '5' }, data, null, acquired.fence);
    expect(data._persistence).toMatchObject({ saveStatus: 'failed', packageId: null });
    expect(data.pg[0].soal).toBe('preserved prompt');
    expect(data.pg[0].gambar).toMatchObject({ imageUnavailable: true });
    expect(data.pg[0].gambar).not.toHaveProperty('assetId');
    expect(data.pg[0].gambar).not.toHaveProperty('url');
    expect(JSON.stringify(data)).not.toContain(source);
    expect(db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE owner_id=? AND client_document_id=?').get(ownerId, clientDocumentId)).toEqual({ state: 'completed', package_id: null });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=?').get(ownerId)).toEqual({ n: 0 });
    db.close();
  });

  it('settles a live fenced owner-quota rejection as sanitized failed-save recovery, not a fence conflict', async () => {
    const db = database();
    for (let i = 0; i < 100; i++) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',1,'quota-fixture',X'00')`).run(`quota-${i}`);
    const clientDocumentId = '123e4567-e89b-42d3-a456-426614174997';
    const acquired = await acquireAssessmentGenerationRequest(db as any, { ownerId, clientDocumentId, semanticInput: { topic: 'quota' } });
    if (acquired.kind !== 'acquired') throw new Error('fence not acquired');
    const imageBytes = new Uint8Array(readFileSync('public/static/screenshots/home-mobile.png'));
    const source = 'https://upload.wikimedia.org/quota-failed.png?secret=private';
    globalThis.fetch = vi.fn(async () => new Response(imageBytes, { status: 200, headers: { 'Content-Type': 'image/png' } })) as any;
    const data: any = { pg: [{ no: 1, soal: 'Keep this prompt', gambar: { url: source } }] };
    await saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' },
      { clientDocumentId, mataPelajaran: 'IPAS', topik: 'quota', jenjangKelas: '5' }, data, null, acquired.fence);
    expect(data._persistence).toMatchObject({ saveStatus: 'failed', packageId: null });
    expect(data.pg[0].soal).toBe('Keep this prompt');
    expect(data.pg[0].gambar).toMatchObject({ imageUnavailable: true });
    expect(data.pg[0].gambar).not.toHaveProperty('assetId');
    expect(data.pg[0].gambar).not.toHaveProperty('url');
    expect(JSON.stringify(data)).not.toContain(source);
    expect(db.sqlite.prepare('SELECT state,package_id FROM assessment_generation_requests WHERE owner_id=? AND client_document_id=?').get(ownerId, clientDocumentId)).toEqual({ state: 'completed', package_id: null });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_image_assets WHERE owner_id=?').get(ownerId)).toEqual({ n: 100 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toEqual({ n: 0 });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal_write_tokens').get()).toEqual({ n: 0 });
    db.close();
  });

  it('keeps a validated renderer specification across failed package creation and another normalization pass', async () => {
    const db = database();
    db.sqlite.exec(`CREATE TRIGGER reject_visual_package BEFORE INSERT ON bank_soal BEGIN SELECT RAISE(ABORT,'fixture package failure'); END;`);
    const data: any = { pg: [{
      no: 1, soal: 'Perhatikan balok berikut. Tentukan volumenya.', imageRequired: true,
      visual_stimulus: { type: 'balok', params: { p: 12, l: 8, t: 6, unit: 'cm', unsafe: 'javascript:alert(1)' } },
      gambar: { type: 'svg', url: 'data:image/svg+xml,<svg onload="evil()"></svg>', svg: '<svg onload="evil()"></svg>' },
    }] };
    await saveAssessmentTelemetryAndBankSoal(db as any, { id: ownerId, nama: 'Owner' }, { mataPelajaran: 'Matematika', topik: 'Balok', jenjangKelas: '5' }, data);
    expect(data._persistence).toMatchObject({ packageId: null, revision: null, saveStatus: 'failed' });
    const failedSaveSvg = data.pg[0].gambar.svg;
    const secondPass = await normalizeAssessmentImages(db as any, ownerId, data);
    expect(secondPass.content.pg[0].gambar.svg).toBe(failedSaveSvg);
    expect(secondPass.content.pg[0].visual_stimulus).toEqual({ type: 'balok', params: { p: 12, l: 8, t: 6, unit: 'cm' } });
    expect(secondPass.warnings).toEqual([]);
    expect(JSON.stringify(data)).not.toMatch(/javascript:|onload|<svg onload/);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM bank_soal').get()).toMatchObject({ n: 0 });
    db.close();
  });

  it('attaches server-owned failure metadata when package persistence is not configured', async () => {
    const data: any = { pg: [{ no: 1, soal: 'Perhatikan gambar', imageRequired: true }], _persistence: { packageId: 77, revision: 42, saveStatus: 'saved' } };
    const result = await finalizeAssessmentPackage(data, { resolvedCP: 'CP', topik: 'Topik', totalPG: 1 });
    expect(result.pg[0].imageRequired).toBe(true);
    expect(result._persistence).toEqual({ packageId: null, revision: null, saveStatus: 'failed', imageWarnings: [] });
  });
});
