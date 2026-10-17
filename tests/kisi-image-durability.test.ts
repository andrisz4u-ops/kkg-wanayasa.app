import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeAssessmentImages } from '../src/lib/assessment-image-durability';
import { finalizeAssessmentPackage, saveAssessmentTelemetryAndBankSoal } from '../src/routes/kisi';
import { SqliteD1 } from './helpers/sqlite-d1';

const ownerId = 1;
const webp = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==', 'base64').subarray(0, 42);
const makeId = (n: number) => `123e4567-e89b-42d3-a456-${String(n).padStart(12, '0')}`;
const originalFetch = globalThis.fetch;

function database() {
  const db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT);
    CREATE TABLE sekolah (id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT, kop_surat_url TEXT, npsn TEXT, alamat TEXT);
    INSERT INTO users(id,nama,email,role) VALUES (1,'Owner','owner@test','user');`);
  for (const migration of ['0018_bank_soal.sql', '0040_bank_soal_moderation.sql', '0041_assessment_image_assets.sql', '0042_assessment_package_revisions.sql']) {
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
  it('preserves dependent question text and never persists/logs an expired signed URL', async () => {
    const db = database();
    const source = 'https://sewr2.vultrobjects.com/private/signed-secret?expires=old';
    globalThis.fetch = vi.fn(async () => new Response('expired', { status: 403 })) as any;
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
