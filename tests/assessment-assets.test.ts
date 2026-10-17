import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';
import route from '../src/routes/assessment-assets';
import { getCurrentUser } from '../src/lib/auth';
import { ASSESSMENT_ASSET_MAX_BYTES, prepareAssessmentAsset, fetchTrustedAssessmentImage, resolveAssessmentAssetMetadata, buildStagedAssessmentAssetInsert, persistAssessmentAsset, readOwnedAssessmentAsset, ingestTrustedAssessmentImage, TrustedImageIngestError } from '../src/lib/assessment-assets';

vi.mock('../src/lib/auth', async original => ({ ...await original<typeof import('../src/lib/auth')>(), getCurrentUser: vi.fn() }));
let db: SqliteD1; let app: Hono;
function d1(readAs?: 'number-array' | 'buffer' | 'arraybuffer' | 'subview' | 'invalid-array' | 'wrong-length') {
  return { prepare(sql: string) {
    const statement = db.prepare(sql); const wrapper: any = {
      bind(...args: any[]) { statement.bind(...args.map(value => value instanceof ArrayBuffer ? Buffer.from(value) : value)); return wrapper; },
      async first(column?: string) {
        const row: any = await statement.first(column);
        if (row && !column && row.bytes && readAs) {
          const raw = Buffer.from(row.bytes);
          if (readAs === 'number-array') row.bytes = Array.from(raw);
          if (readAs === 'invalid-array') row.bytes = [0, 256, -1];
          if (readAs === 'wrong-length') row.byte_length = Number(row.byte_length) + 1;
          if (readAs === 'buffer') row.bytes = raw;
          if (readAs === 'arraybuffer') row.bytes = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
          if (readAs === 'subview') { const outer = new Uint8Array(raw.length + 4); outer.set(raw, 2); row.bytes = outer.subarray(2, 2 + raw.length); }
        }
        return row;
      },
      run: () => statement.run(), all: () => statement.all(), execute: () => statement.execute(),
    };
    return wrapper;
  } };
}
beforeEach(() => {
  db = new SqliteD1(); db.sqlite.exec('PRAGMA foreign_keys=ON;');
  db.sqlite.exec(readFileSync('migrations/0001_initial_schema.sql', 'utf8'));
  db.sqlite.exec(readFileSync('migrations/0041_assessment_image_assets.sql', 'utf8'));
  db.sqlite.prepare("INSERT INTO users(id,nama,email,password_hash,role) VALUES(1,'A','a@test','x','user'),(2,'B','b@test','x','user')").run();
  vi.mocked(getCurrentUser).mockImplementation(async (_db, sid) => sid === 'one' ? { id: 1 } : sid === 'two' ? { id: 2 } : null);
  app = new Hono().route('/api/assessment-assets', route);
});
afterEach(() => { db.close(); vi.restoreAllMocks(); vi.clearAllMocks(); vi.useRealTimers(); });

// Real small, decodable project images keep success cases beyond header-only fixtures.
function png() { return new Uint8Array(readFileSync('public/static/screenshots/home-mobile.png')); }
function jpeg() { return new Uint8Array(readFileSync('public/static/img/gallery-2.jpg')); }
function webpLossy() { return new Uint8Array(Buffer.from('UklGRjoAAABXRUJQVlA4IC4AAADQAQCdASoBAAEAAUAmJaACdLoB+AADsAD+8Por/0mzxNnibPkkf/NgVzXPuaAA','base64')); }
function webpLossless() { return new Uint8Array(Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAdQsGKUtv+BiOh/AAA=','base64')); }
function recalcPngHeaderCrc(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 12; i < 29; i++) { crc ^= bytes[i]; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(29, (crc ^ 0xffffffff) >>> 0);
}
function paddedPng(targetLength: number) {
  const source = png(); const chunkLength = targetLength - source.byteLength;
  if (chunkLength < 12) throw new Error('PNG target too small');
  const payloadLength = chunkLength - 12; const chunk = new Uint8Array(chunkLength);
  const view = new DataView(chunk.buffer); view.setUint32(0, payloadLength);
  chunk.set([116, 69, 88, 116], 4); // tEXt
  let crc = 0xffffffff;
  for (let i = 4; i < 8 + payloadLength; i++) { crc ^= chunk[i]; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  view.setUint32(8 + payloadLength, (crc ^ 0xffffffff) >>> 0);
  const iend = source.byteLength - 12; const result = new Uint8Array(targetLength);
  result.set(source.subarray(0, iend)); result.set(chunk, iend); result.set(source.subarray(iend), iend + chunkLength);
  return result;
}
function mutatePngText(bytes: Uint8Array, value: number) {
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, bytes.byteLength - offset);
    const length = view.getUint32(0);
    if (String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)) === 'tEXt') {
      bytes[offset + 8] = value;
      let crc = 0xffffffff;
      for (let i = offset + 4; i < offset + 8 + length; i++) { crc ^= bytes[i]; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
      view.setUint32(8 + length, (crc ^ 0xffffffff) >>> 0);
      return;
    }
    offset += 12 + length;
  }
  throw new Error('PNG tEXt chunk missing');
}
const headers = (session: string, type = 'image/png') => ({ 'x-session-id': session, 'Content-Type': type });

describe('assessment image assets', () => {
  it('persists validated bytes, idempotently retries same-owner content, and keeps BLOB readable', async () => {
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; const bytes = png();
    const first = await persistAssessmentAsset(d1() as any, 1, bytes, 'image/png', { assetId: id });
    expect(await persistAssessmentAsset(d1() as any, 1, bytes, 'image/png', { assetId: id })).toEqual(first);
    expect((await readOwnedAssessmentAsset(d1() as any, 1, id))?.bytes).toEqual(bytes);
    for (const mode of ['number-array','buffer','arraybuffer','subview'] as const) expect((await readOwnedAssessmentAsset(d1(mode) as any, 1, id))?.bytes).toEqual(bytes);
    await expect(readOwnedAssessmentAsset(d1('invalid-array') as any, 1, id)).rejects.toMatchObject({ reason: 'invalid_storage' });
    await expect(readOwnedAssessmentAsset(d1('wrong-length') as any, 1, id)).rejects.toMatchObject({ reason: 'invalid_storage' });
    await expect(readOwnedAssessmentAsset(d1() as any, 2, id)).resolves.toBeNull();
    await expect(persistAssessmentAsset(d1() as any, 2, bytes, 'image/png', { assetId: id })).rejects.toBeInstanceOf(TrustedImageIngestError);
  });
  it('returns the same metadata for simultaneous retries with the same owner, ID, and bytes', async () => {
    const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const [left, right] = await Promise.all([
      persistAssessmentAsset(d1() as any, 1, png(), 'image/png', { assetId: id }),
      persistAssessmentAsset(d1() as any, 1, png(), 'image/png', { assetId: id }),
    ]);
    expect(left).toEqual(right);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets WHERE id=?').get(id)?.count).toBe(1);
  });
  it('serves owner-only private data and hides foreign identifiers', async () => {
    const asset = await persistAssessmentAsset(d1() as any, 1, png(), 'image/png');
    const own = await app.request(`/api/assessment-assets/${asset.id}`, { headers: headers('one') }, { DB: d1() as any });
    expect(own.status).toBe(200); expect(own.headers.get('cache-control')).toBe('private, no-store'); expect(own.headers.get('x-content-type-options')).toBe('nosniff');
    const foreign = await app.request(`/api/assessment-assets/${asset.id}`, { headers: headers('two') }, { DB: d1() as any }); expect(foreign.status).toBe(404);
    expect((await app.request(`/api/assessment-assets/${asset.id}` , {}, { DB: d1() as any })).status).toBe(401);
  });
  it('uploads raw raster bytes through the route with stable retry metadata', async () => {
    const id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const request = () => app.request('/api/assessment-assets', { method: 'POST', headers: { ...headers('one'), 'X-Asset-Id': id }, body: png() }, { DB: d1() as any });
    const first = await request(); const second = await request();
    expect(first.status).toBe(201); expect(second.status).toBe(201);
    const payload = await first.json() as any;
    expect(payload.data).toMatchObject({ id, assetId: id, mime: 'image/png', byteLength: png().byteLength, url: `/api/assessment-assets/${id}` });
    expect((await second.json() as any).data.sha256).toBe(payload.data.sha256);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets WHERE id=?').get(id)?.count).toBe(1);
  });
  it('rejects mismatched MIME and oversized streamed request bodies', async () => {
    expect((await app.request('/api/assessment-assets', { method: 'POST', headers: headers('one','image/jpeg'), body: png() }, { DB: d1() as any })).status).toBe(400);
    const oversize = new Uint8Array(ASSESSMENT_ASSET_MAX_BYTES + 1); oversize.set(png());
    expect((await app.request('/api/assessment-assets', { method: 'POST', headers: headers('one'), body: oversize }, { DB: d1() as any })).status).toBe(400);
    let streamChunk = 0;
    const chunked = new ReadableStream<Uint8Array>({ pull(controller) { if (streamChunk++ < 3) controller.enqueue(new Uint8Array(200 * 1024)); else controller.close(); } });
    expect((await app.request('/api/assessment-assets', { method: 'POST', headers: headers('one'), body: chunked, duplex: 'half' } as any, { DB: d1() as any })).status).toBe(400);
    const oversizedPixels = png(); new DataView(oversizedPixels.buffer, oversizedPixels.byteOffset, oversizedPixels.byteLength).setUint32(16, 4000); new DataView(oversizedPixels.buffer, oversizedPixels.byteOffset, oversizedPixels.byteLength).setUint32(20, 3000);
    recalcPngHeaderCrc(oversizedPixels);
    await expect(persistAssessmentAsset(d1() as any, 1, oversizedPixels, 'image/png')).rejects.toMatchObject({ reason: 'invalid_image' });
    await expect(persistAssessmentAsset(d1() as any, 1, new Uint8Array(24).fill(1), 'image/png')).rejects.toMatchObject({ reason: 'invalid_image' });
    const jpegThroughSof = jpeg().subarray(0, 360);
    await expect(persistAssessmentAsset(d1() as any, 1, jpegThroughSof, 'image/jpeg')).rejects.toMatchObject({ reason: 'invalid_image' });
    await expect(persistAssessmentAsset(d1() as any, 1, webpLossy().subarray(0, 25), 'image/webp')).rejects.toMatchObject({ reason: 'invalid_image' });
    const canvasOnly = new Uint8Array([82,73,70,70,22,0,0,0,87,69,66,80,86,80,56,88,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    await expect(persistAssessmentAsset(d1() as any, 1, canvasOnly, 'image/webp')).rejects.toMatchObject({ reason: 'invalid_image' });
  });
  it('accepts structurally valid bounded JPEG and both WebP frame variants', async () => {
    expect((await persistAssessmentAsset(d1() as any, 1, jpeg(), 'image/jpeg')).mime).toBe('image/jpeg');
    expect((await persistAssessmentAsset(d1() as any, 1, webpLossy(), 'image/webp')).mime).toBe('image/webp');
    expect((await persistAssessmentAsset(d1() as any, 1, webpLossless(), 'image/webp')).mime).toBe('image/webp');
    const oversizedVp8 = webpLossy(); oversizedVp8[26] = 0; oversizedVp8[27] = 16; oversizedVp8[28] = 0; oversizedVp8[29] = 8;
    await expect(persistAssessmentAsset(d1() as any, 1, oversizedVp8, 'image/webp')).rejects.toMatchObject({ reason: 'invalid_image' });
  });
  it('prepares exclusively-owned assets and resolves staged metadata without database writes', async () => {
    const original = png();
    const staged = await prepareAssessmentAsset(1, original, 'image/png');
    original.fill(0);
    expect(staged.bytes).not.toBe(original.buffer);
    expect(new Uint8Array(staged.bytes)).not.toEqual(original);
    expect(await resolveAssessmentAssetMetadata(d1() as any, 1, staged.id, new Map([[staged.id, staged]]))).toMatchObject({ id: staged.id, byteLength: staged.byteLength, sha256: staged.sha256 });
    await expect(resolveAssessmentAssetMetadata(d1() as any, 2, staged.id, new Map([[staged.id, staged]]))).rejects.toMatchObject({ reason: 'invalid_storage' });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(png(), { headers: { 'Content-Type': 'image/png' } }));
    const fetched = await fetchTrustedAssessmentImage(1, 'https://upload.wikimedia.org/a.png');
    expect(fetched.mime).toBe('image/png');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets').get()?.count).toBe(0);
    fetchMock.mockRestore();
  });
  it('accepts the exact 1.5 MiB raw boundary and rejects one byte over without database access', async () => {
    expect((await prepareAssessmentAsset(1, paddedPng(ASSESSMENT_ASSET_MAX_BYTES), 'image/png')).byteLength).toBe(ASSESSMENT_ASSET_MAX_BYTES);
    await expect(prepareAssessmentAsset(1, paddedPng(ASSESSMENT_ASSET_MAX_BYTES + 1), 'image/png')).rejects.toMatchObject({ reason: 'too_large' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets').get()?.count).toBe(0);
  });
  it('keeps canonical staged bytes private across public-buffer mutation and D1 binding', async () => {
    const original = paddedPng(png().byteLength + 20);
    const staged = await prepareAssessmentAsset(1, original, 'image/png');
    const expectedHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', original))).map(value => value.toString(16).padStart(2, '0')).join('');
    const exposed = staged.bytes;
    mutatePngText(new Uint8Array(exposed), 1);
    const insert = buildStagedAssessmentAssetInsert(d1() as any, staged);
    mutatePngText(new Uint8Array(staged.bytes), 2);
    await insert.run();
    const saved = await readOwnedAssessmentAsset(d1() as any, 1, staged.id);
    expect(saved?.bytes).toEqual(original);
    expect(saved?.sha256).toBe(expectedHash);
  });
  it('rejects staged metadata under a different map key before querying storage', async () => {
    const staged = await prepareAssessmentAsset(1, png(), 'image/png');
    let queried = false;
    const noReadDb = { prepare() { queried = true; throw new Error('unexpected database access'); } };
    await expect(resolveAssessmentAssetMetadata(noReadDb as any, 1, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', new Map([['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', staged]]))).rejects.toMatchObject({ reason: 'invalid_storage' });
    expect(queried).toBe(false);
  });
  it('applies the remaining package byte limit before staging and returns only an insert statement', async () => {
    const source = png();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(source, { headers: { 'Content-Type': 'image/png' } }));
    await expect(fetchTrustedAssessmentImage(1, 'https://upload.wikimedia.org/a.png', { maxBytes: source.byteLength - 1 })).rejects.toMatchObject({ reason: 'package_image_byte_limit' });
    const staged = await prepareAssessmentAsset(1, source, 'image/png');
    const statement = buildStagedAssessmentAssetInsert(d1() as any, staged);
    expect(typeof statement.run).toBe('function');
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets').get()?.count).toBe(0);
    vi.restoreAllMocks();
  });
  it('returns conflict for stable asset ID reuse with differing content', async () => {
    const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    await persistAssessmentAsset(d1() as any, 1, png(), 'image/png', { assetId: id });
    const response = await app.request('/api/assessment-assets', { method: 'POST', headers: { ...headers('one','image/jpeg'), 'X-Asset-Id': id }, body: jpeg() }, { DB: d1() as any });
    expect(response.status).toBe(409);
    expect(db.sqlite.prepare('SELECT owner_id, mime FROM assessment_image_assets WHERE id=?').get(id)).toMatchObject({ owner_id: 1, mime: 'image/png' });
  });
  it('enforces the owner cap with conditional insertion without replacing existing assets', async () => {
    for (let i = 0; i < 100; i++) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',1,'x',X'00')`).run(`asset-${i}`);
    await expect(persistAssessmentAsset(d1() as any, 1, png(), 'image/png')).rejects.toMatchObject({ reason: 'quota_count' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets WHERE owner_id=1').get()?.count).toBe(100);
    expect(db.sqlite.prepare("SELECT id FROM assessment_image_assets WHERE id='asset-0'").get()?.id).toBe('asset-0');
  });
  it('keeps simultaneous count-quota writes atomic and enforces the separate byte quota', async () => {
    for (let i = 0; i < 99; i++) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',1,'x',X'00')`).run(`count-${i}`);
    const outcomes = await Promise.allSettled([
      persistAssessmentAsset(d1() as any, 1, png(), 'image/png'),
      persistAssessmentAsset(d1() as any, 1, jpeg(), 'image/jpeg'),
    ]);
    expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter(outcome => outcome.status === 'rejected')).toHaveLength(1);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets WHERE owner_id=1').get()?.count).toBe(100);

    db.sqlite.exec('DELETE FROM assessment_image_assets;');
    for (let i = 0; i < 64; i++) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',524288,'x',zeroblob(1))`).run(`bytes-${i}`);
    await expect(persistAssessmentAsset(d1() as any, 1, png(), 'image/png')).rejects.toMatchObject({ reason: 'quota_bytes' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM assessment_image_assets WHERE owner_id=1').get()?.count).toBe(64);
  });
  it('keeps simultaneous byte-quota writes atomic', async () => {
    for (let i = 0; i < 63; i++) db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES(?,1,'image/png',524288,'x',zeroblob(1))`).run(`byte-race-${i}`);
    db.sqlite.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes) VALUES('byte-race-last',1,'image/png',324288,'x',zeroblob(1))`).run();
    const outcomes = await Promise.allSettled([
      persistAssessmentAsset(d1() as any, 1, png(), 'image/png'),
      persistAssessmentAsset(d1() as any, 1, jpeg(), 'image/jpeg'),
    ]);
    expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter(outcome => outcome.status === 'rejected')).toHaveLength(1);
    expect(Number(db.sqlite.prepare('SELECT SUM(byte_length) AS bytes FROM assessment_image_assets WHERE owner_id=1').get()?.bytes)).toBeLessThanOrEqual(32 * 1024 * 1024);
  });
  it('uses only exact trusted hosts and reports unavailable sources with controlled reasons', async () => {
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://example.test/a.png')).rejects.toMatchObject({ reason: 'untrusted_host' });
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://user:pass@upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'untrusted_host' });
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org:8443/a.png')).rejects.toMatchObject({ reason: 'untrusted_host' });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('missing', { status: 404 }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'expired_or_missing' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual({ Accept: 'image/png,image/jpeg,image/webp' });
    fetchMock.mockResolvedValue(new Response('gone', { status: 410 }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'expired_or_missing' });
    fetchMock.mockResolvedValue(new Response('server error', { status: 500 }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'fetch_status' });
  });
  it('streams valid trusted bytes without credentials, rejects redirects, and bounds remote reads', async () => {
    const response = new Response(png(), { headers: { 'Content-Type': 'image/png' } });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const result = await ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png');
    expect(result.mime).toBe('image/png');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ Accept: 'image/png,image/jpeg,image/webp' });
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'https://evil.test/a' } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'untrusted_host' });
    fetchMock.mockResolvedValue(new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(800000)); controller.enqueue(new Uint8Array(800000)); controller.close(); } }), { headers: { 'Content-Type': 'image/png' } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'too_large' });
    fetchMock.mockRestore();
  });
  it('manually follows bounded trusted redirects, resolves relative locations, and persists only final bytes', async () => {
    const bytes = png();
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/images/final.png' } }))
      .mockResolvedValueOnce(new Response(null, { status: 307, headers: { Location: 'https://sewr2.vultrobjects.com/private/final.png' } }))
      .mockResolvedValueOnce(new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    const saved = await ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/start.png');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [input, init] of fetchMock.mock.calls) {
      expect((input instanceof URL ? input : new URL(String(input))).protocol).toBe('https:');
      expect(init).toMatchObject({ redirect: 'manual', headers: { Accept: 'image/png,image/jpeg,image/webp' } });
      expect(init?.headers).not.toHaveProperty('Authorization');
      expect(init?.headers).not.toHaveProperty('Cookie');
    }
    expect(String(fetchMock.mock.calls[1][0])).toBe('https://upload.wikimedia.org/images/final.png');
    expect(String(fetchMock.mock.calls[2][0])).toBe('https://sewr2.vultrobjects.com/private/final.png');
    expect((await readOwnedAssessmentAsset(d1() as any, 1, saved.assetId))?.bytes).toEqual(bytes);
  });
  it.each([
    ['http downgrade', 'http://upload.wikimedia.org/private.png'],
    ['IP address', 'https://127.0.0.1/private.png'],
    ['credentials', 'https://user:password@upload.wikimedia.org/private.png'],
    ['nonstandard port', 'https://upload.wikimedia.org:8443/private.png'],
    ['untrusted host', 'https://evil.example/private.png'],
  ])('rejects redirect to forbidden %s before fetching it', async (_label, location) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 302, headers: { Location: location } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/start.png')).rejects.toMatchObject({ reason: 'untrusted_host' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['missing location', new Response(null, { status: 302 })],
    ['malformed location', new Response(null, { status: 302, headers: { Location: 'http://[invalid' } })],
  ])('rejects %s with a controlled redirect reason', async (_label, response) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/start.png')).rejects.toMatchObject({ reason: 'fetch_redirect' });
  });
  it('rejects redirect loops and chains beyond three redirects', async () => {
    const loopFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/start.png' } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/start.png')).rejects.toMatchObject({ reason: 'fetch_redirect' });
    expect(loopFetch).toHaveBeenCalledTimes(1);
    loopFetch.mockRestore();
    const chainFetch = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/1.png' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/2.png' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/3.png' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/4.png' } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/start.png')).rejects.toMatchObject({ reason: 'fetch_redirect' });
    expect(chainFetch).toHaveBeenCalledTimes(4);
  });
  it('keeps one timeout across redirects and response-body streaming', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      await new Promise(resolve => setTimeout(resolve, 6_000));
      return new Response(null, { status: 302, headers: { Location: '/final.png' } });
    }).mockImplementationOnce(async (_input, init) => {
      const body = new ReadableStream<Uint8Array>({ start(controller) {
        init?.signal?.addEventListener('abort', () => controller.error(new DOMException('aborted', 'AbortError')));
      } });
      return new Response(body, { headers: { 'Content-Type': 'image/png' } });
    });
    const pending = ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/start.png');
    const outcome = pending.then(() => null, error => error);
    await vi.advanceTimersByTimeAsync(6_000);
    await vi.advanceTimersByTimeAsync(4_000);
    expect(await outcome).toMatchObject({ reason: 'fetch_timeout' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('times out trusted fetches and maps the abort to a controlled failure', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
    const pending = ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png');
    const outcome = pending.then(() => null, error => error);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await outcome).toMatchObject({ reason: 'fetch_timeout' });
    fetchMock.mockRestore(); vi.useRealTimers();
  });
  it('separates a successful remote fetch from a failed database write without leaking errors', async () => {
    const brokenDb = { prepare(sql: string) {
      if (sql.includes('INSERT INTO assessment_image_assets')) return { bind() { return { run: async () => { throw new Error('SQL secret signed=https://x.test/a?token=secret'); } }; } };
      return d1().prepare(sql);
    } };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(png(), { headers: { 'Content-Type': 'image/png' } }));
    let caught: any;
    try { await ingestTrustedAssessmentImage(brokenDb as any, 1, 'https://upload.wikimedia.org/a.png'); } catch (error) { caught = error; }
    expect(caught).toMatchObject({ reason: 'storage_write_failed' });
    expect(caught.message).toBe('Trusted image ingest failed: storage_write_failed');
    expect(caught.message).not.toMatch(/SQL|secret|token|https:/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });
  it('classifies network errors, stream failures, and non-OK statuses with stable safe reasons', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockRejectedValueOnce(new TypeError('network failure with https://x.test/?key=secret'));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'fetch_failed', message: 'Trusted image ingest failed: fetch_failed' });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/redirected.png' } }));
    fetchMock.mockRejectedValueOnce(new TypeError('network failure with https://x.test/?key=secret'));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'fetch_failed', message: 'Trusted image ingest failed: fetch_failed' });
    const brokenStream = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new Error('upstream secret')); } });
    fetchMock.mockResolvedValueOnce(new Response(brokenStream, { headers: { 'Content-Type': 'image/png' } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'body_read_failed' });
    fetchMock.mockResolvedValueOnce(new Response('upstream', { status: 503 }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'fetch_status' });
    fetchMock.mockRestore();
  });
});
