import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';
import route from '../src/routes/assessment-assets';
import { getCurrentUser } from '../src/lib/auth';
import { persistAssessmentAsset, readOwnedAssessmentAsset, ingestTrustedAssessmentImage, TrustedImageIngestError } from '../src/lib/assessment-assets';

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
afterEach(() => { db.close(); vi.clearAllMocks(); });

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
    const oversize = new Uint8Array(512 * 1024 + 1); oversize.set(png());
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
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual({ Accept: 'image/png,image/jpeg,image/webp' });
    fetchMock.mockRestore();
  });
  it('streams valid trusted bytes without credentials, rejects redirects, and bounds remote reads', async () => {
    const response = new Response(png(), { headers: { 'Content-Type': 'image/png' } });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const result = await ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png');
    expect(result.mime).toBe('image/png');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ Accept: 'image/png,image/jpeg,image/webp' });
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'https://evil.test/a' } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'expired_or_missing' });
    fetchMock.mockResolvedValue(new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(300000)); controller.enqueue(new Uint8Array(300000)); controller.close(); } }), { headers: { 'Content-Type': 'image/png' } }));
    await expect(ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png')).rejects.toMatchObject({ reason: 'too_large' });
    fetchMock.mockRestore();
  });
  it('times out trusted fetches and maps the abort to a controlled failure', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
    const pending = ingestTrustedAssessmentImage(d1() as any, 1, 'https://upload.wikimedia.org/a.png');
    const outcome = pending.then(() => null, error => error);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await outcome).toMatchObject({ reason: 'fetch_failed' });
    fetchMock.mockRestore(); vi.useRealTimers();
  });
});
