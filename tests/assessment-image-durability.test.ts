import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { normalizeAssessmentImages } from '../src/lib/assessment-image-durability';
import { SqliteD1 } from './helpers/sqlite-d1';

const DUPLICATE_ID = '123e4567-e89b-42d3-a456-426614174099';

function ownedAssetDb() {
  const db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users(id) VALUES (7);`);
  db.sqlite.exec(readFileSync('migrations/0041_assessment_image_assets.sql', 'utf8'));
  const bytes = Buffer.from([1, 2, 3, 4]);
  db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes)
    VALUES(?,7,'image/png',?,'fixture-hash',?)`).run(DUPLICATE_ID, bytes.length, bytes);
  return db;
}

describe('assessment image durability normalization boundaries', () => {
  it('walks only supported question sections and q.gambar, not arbitrary nested URLs', async () => {
    const requests: string[] = [];
    const db: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: any) => { requests.push(String(input)); throw new Error('should not fetch arbitrary fields'); }) as any;
    try {
      const content = {
        pg: [{ no: 1, soal: 'tekstual', nested: { url: 'https://sewr2.vultrobjects.com/not-a-stimulus' } }],
        isian: { data: [{ no: 2, soal: 'teks', gambar: { type: 'svg', svg: '<svg onload="x"></svg>' } }] },
        uraian: [{ no: 3, soal: 'teks', gambar: { url: 'https://example.invalid/unknown' } }],
        metadata: { url: 'https://sewr2.vultrobjects.com/not-a-question' },
      };
      const result = await normalizeAssessmentImages(db, 1, content);
      expect(requests).toEqual([]);
      expect(result.content.pg[0].nested.url).toBe('https://sewr2.vultrobjects.com/not-a-stimulus');
      expect(result.content.isian.data[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'untrusted_svg' });
      expect(result.content.uraian[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'untrusted_host' });
      expect(result.warnings.map(item => item.questionNo)).toEqual([2, 3]);
      expect(JSON.stringify(result.warnings)).not.toContain('example.invalid');
      expect(result.content.metadata.url).toBe('https://sewr2.vultrobjects.com/not-a-question');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does not let provider metadata claim saved package identity', async () => {
    // A DB with no valid schema fails closed; no source URL is reflected in the result.
    const db: any = { prepare: () => ({ bind: () => ({ first: async () => null }) }) };
    const data = { pg: [{ no: 4, soal: 'Lihat gambar.', imageRequired: true, gambar: { assetId: 'foreign-id', url: 'https://secret.invalid/token' } }] };
    const result = await normalizeAssessmentImages(db, 2, data);
    expect(result.content.pg[0].soal).toBe('Lihat gambar.');
    expect(result.content.pg[0].gambar.imageUnavailable).toBe(true);
    expect(JSON.stringify(result)).not.toContain('secret.invalid');
  });

  it('canonicalizes every repeated owned asset reference from cached server metadata', async () => {
    const db = ownedAssetDb();
    let ownerReads = 0;
    const prepare = db.prepare.bind(db);
    db.prepare = ((sql: string) => {
      if (/SELECT id, mime, byte_length, sha256 FROM assessment_image_assets/i.test(sql)) ownerReads++;
      return prepare(sql);
    }) as any;
    const content: any = { pg: [
      { no: 1, soal: 'Teks pertama tetap.', gambar: { assetId: DUPLICATE_ID, url: 'https://signed.invalid/old?token=one', alt: 'Buah', credit: 'Koleksi sekolah' } },
      { no: 2, soal: 'Teks kedua tetap.', gambar: {
        assetId: DUPLICATE_ID, url: 'https://signed.invalid/second?token=two', gambar: 'https://signed.invalid/alias',
        dataUri: 'data:image/svg+xml,<svg/>', svg: '<svg onload="evil()"></svg>', sourceUrl: 'https://signed.invalid/source',
        type: 'svg', imageUnavailable: true, imageUnavailableReason: 'expired_or_missing', description: 'Buah kedua',
      } },
    ] };

    const result = await normalizeAssessmentImages(db as any, 7, content);
    const first = result.content.pg[0].gambar;
    const second = result.content.pg[1].gambar;
    expect(first).toEqual({ assetId: DUPLICATE_ID, url: `/api/assessment-assets/${DUPLICATE_ID}`, mime: 'image/png', byteLength: 4, alt: 'Buah', credit: 'Koleksi sekolah' });
    expect(second).toEqual({ assetId: DUPLICATE_ID, url: `/api/assessment-assets/${DUPLICATE_ID}`, mime: 'image/png', byteLength: 4, description: 'Buah kedua' });
    expect(result.content.pg.map((item: any) => item.soal)).toEqual(['Teks pertama tetap.', 'Teks kedua tetap.']);
    expect(JSON.stringify(result.content)).not.toMatch(/signed\.invalid|data:image|<svg|sourceUrl|imageUnavailable/);
    expect(result.warnings).toEqual([]);
    expect(ownerReads).toBe(1);
    db.close();
  });

  it('scrubs string and object image aliases into controlled unavailable objects without changing prose', async () => {
    const originalFetch = globalThis.fetch;
    const requests: string[] = [];
    globalThis.fetch = vi.fn(async (input: any) => { requests.push(String(input)); throw new Error('unexpected network'); }) as any;
    try {
      const content: any = { pg: [
        { no: 1, soal: 'Perhatikan gambar ini, lalu jawab.', imageRequired: true, gambar: 'https://untrusted.invalid/private/signature' },
        { no: 2, soal: 'Amati gambar kedua.', gambar: {
          url: 'https://signed.invalid/url?token=x', gambar: 'data:image/svg+xml,<svg/>',
          dataUri: 'data:image/png;base64,private', svg: '<svg onload="x"></svg>', sourceUrl: 'https://signed.invalid/source',
          alt: 'Stimulus kedua', credit: 'Koleksi guru',
        } },
      ] };
      const result = await normalizeAssessmentImages({} as any, 7, content);
      expect(requests).toEqual([]);
      expect(result.content.pg[0].soal).toBe('Perhatikan gambar ini, lalu jawab.');
      expect(result.content.pg[1].soal).toBe('Amati gambar kedua.');
      expect(result.content.pg[0].gambar).toEqual({ imageUnavailable: true, imageUnavailableReason: 'untrusted_host', imageWarningReason: 'untrusted_host' });
      expect(result.content.pg[1].gambar).toEqual({ alt: 'Stimulus kedua', credit: 'Koleksi guru', imageUnavailable: true, imageUnavailableReason: 'untrusted_svg', imageWarningReason: 'untrusted_svg' });
      expect(JSON.stringify(result)).not.toMatch(/untrusted\.invalid|signed\.invalid|data:image|<svg|sourceUrl|private\/signature/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rebuilds validated structured SVG specifications identically over repeated normalization', async () => {
    const data: any = { pg: [{ no: 8, soal: 'Balok memiliki ukuran tertentu.', visual_stimulus: { type: 'balok', params: { p: 12, l: 8, t: 6, unit: 'cm', injected: 'https://evil.invalid/x' } }, gambar: { type: 'svg', svg: '<svg onload="evil()"></svg>', url: 'data:image/svg+xml,<svg/>' } }] };
    const first = await normalizeAssessmentImages({} as any, 7, data);
    const firstSvg = first.content.pg[0].gambar.svg;
    const second = await normalizeAssessmentImages({} as any, 7, first.content);
    expect(firstSvg).toContain('Balok');
    expect(second.content.pg[0].gambar.svg).toBe(firstSvg);
    expect(second.content.pg[0].visual_stimulus).toEqual({ type: 'balok', params: { p: 12, l: 8, t: 6, unit: 'cm' } });
    expect(first.warnings).toEqual([]);
    expect(second.warnings).toEqual([]);
    expect(JSON.stringify(second.content)).not.toMatch(/evil|evil\.invalid|<svg onload|injected/);
  });

  it('counts duplicate owned IDs as nine raster references without reading or staging another asset', async () => {
    const db = ownedAssetDb();
    const content: any = { pg: Array.from({ length: 9 }, (_, no) => ({ no: no + 1, soal: 'same asset', gambar: { assetId: DUPLICATE_ID } })) };
    const result = await normalizeAssessmentImages(db as any, 7, content);
    expect(result.content.pg.slice(0, 8).every((item: any) => item.gambar.assetId === DUPLICATE_ID)).toBe(true);
    expect(result.content.pg[8].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'package_image_count_limit' });
    expect(result.stagedAssets.size).toBe(0);
    expect(result.warnings.at(-1)?.reason).toBe('package_image_count_limit');
    db.close();
  });

  it('counts duplicate URLs toward the eight-reference ceiling while fetching/staging that source once', async () => {
    const db: any = {};
    const imageBytes = new Uint8Array(readFileSync('public/static/screenshots/home-mobile.png'));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(imageBytes, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    try {
      const url = 'https://upload.wikimedia.org/repeated-image.png';
      const content: any = { pg: Array.from({ length: 9 }, (_, no) => ({ no: no + 1, soal: 'same source', gambar: { url } })) };
      const result = await normalizeAssessmentImages(db, 7, content);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.stagedAssets.size).toBe(1);
      expect(result.content.pg.slice(0, 8).every((item: any) => item.gambar.assetId)).toBe(true);
      expect(result.content.pg[8].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'package_image_count_limit' });
      expect(result.warnings.at(-1)?.reason).toBe('package_image_count_limit');
      expect(JSON.stringify(result.content)).not.toContain(url);
    } finally { fetchSpy.mockRestore(); }
  });
});
