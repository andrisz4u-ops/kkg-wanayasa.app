import { copyBytesToArrayBuffer } from './binary';

export const ASSESSMENT_ASSET_MAX_BYTES = 1_572_864;
export const ASSESSMENT_ASSET_OWNER_MAX_COUNT = 100;
export const ASSESSMENT_ASSET_OWNER_MAX_BYTES = 32 * 1024 * 1024;
export const ASSESSMENT_IMAGE_MAX_PIXELS = 8_000_000;
export type UUID = string;
export type AssessmentImageMime = 'image/png' | 'image/jpeg' | 'image/webp';

export type AssessmentAssetMetadata = {
  id: string;
  assetId: string;
  mime: AssessmentImageMime;
  byteLength: number;
  sha256: string;
  url: string;
};
export type OwnedAssessmentAsset = AssessmentAssetMetadata & { bytes: Uint8Array };
export type StagedAssessmentAsset = Readonly<{ ownerId: number; id: UUID; mime: AssessmentImageMime; byteLength: number; sha256: string; bytes: ArrayBuffer }>;
export type AssessmentAssetStage = ReadonlyMap<string, StagedAssessmentAsset>;
export type TrustedImageFailureReason = 'invalid_url' | 'untrusted_host' | 'fetch_failed' | 'fetch_timeout' | 'fetch_redirect' | 'fetch_status' | 'body_read_failed' | 'persistence_failed' | 'storage_hash_failed' | 'storage_read_failed' | 'storage_write_failed' | 'expired_or_missing' | 'invalid_image' | 'too_large' | 'package_image_byte_limit' | 'identity_conflict' | 'quota_count' | 'quota_bytes' | 'invalid_storage';
export class TrustedImageIngestError extends Error {
  constructor(readonly reason: TrustedImageFailureReason) { super(`Trusted image ingest failed: ${reason}`); }
}

const preparedAssetBytes = new WeakMap<object, ArrayBuffer>();
const sha256 = async (bytes: ArrayBuffer) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(v => v.toString(16).padStart(2, '0')).join('');
async function prepareOwnedAssessmentAsset(ownerId: number, bytes: Uint8Array, mime: string, options: { id?: string }, takeOwnership: boolean): Promise<StagedAssessmentAsset> {
  validateAssessmentImage(bytes, mime);
  const ownedBytes = takeOwnership && bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? bytes
    : new Uint8Array(bytes);
  let hash: string;
  try { hash = await sha256(ownedBytes.buffer as ArrayBuffer); } catch { throw new TrustedImageIngestError('storage_hash_failed'); }
  const id = options.id || crypto.randomUUID();
  if (!Number.isSafeInteger(ownerId) || ownerId < 1 || !uuidV4(id)) throw new TrustedImageIngestError('invalid_image');
  const canonical = ownedBytes.buffer as ArrayBuffer;
  const asset = Object.freeze({ ownerId, id, mime: mime as AssessmentImageMime, byteLength: ownedBytes.byteLength, sha256: hash, get bytes() { return canonical.slice(0); } }) as StagedAssessmentAsset;
  preparedAssetBytes.set(asset, canonical);
  return asset;
}
export function prepareAssessmentAsset(ownerId: number, bytes: Uint8Array, mime: string, options: { id?: string } = {}): Promise<StagedAssessmentAsset> {
  return prepareOwnedAssessmentAsset(ownerId, bytes, mime, options, false);
}

export async function readOwnedAssessmentAssetMetadata(db: D1Database, ownerId: number | string, id: string): Promise<AssessmentAssetMetadata | null> {
  const row = await db.prepare('SELECT id, mime, byte_length, sha256 FROM assessment_image_assets WHERE id = ? AND owner_id = ?').bind(id, ownerId).first();
  return row ? meta(row) : null;
}

export async function resolveAssessmentAssetMetadata(db: D1Database, ownerId: number, id: string, stage: AssessmentAssetStage): Promise<AssessmentAssetMetadata | null> {
  const staged = stage.get(id);
  if (staged) {
    if (staged.id !== id || staged.ownerId !== ownerId || !preparedAssetBytes.has(staged)) throw new TrustedImageIngestError('invalid_storage');
    return { id, assetId: id, mime: staged.mime, byteLength: staged.byteLength, sha256: staged.sha256, url: `/api/assessment-assets/${id}` };
  }
  return readOwnedAssessmentAssetMetadata(db, ownerId, id);
}

export function buildStagedAssessmentAssetInsert(db: D1Database, asset: StagedAssessmentAsset): D1PreparedStatement {
  const canonical = preparedAssetBytes.get(asset);
  if (!canonical || !uuidV4(asset.id) || !Number.isSafeInteger(asset.ownerId) || asset.ownerId < 1 || asset.byteLength !== canonical.byteLength || asset.byteLength < 1 || asset.byteLength > ASSESSMENT_ASSET_MAX_BYTES || !/^[0-9a-f]{64}$/.test(asset.sha256)) throw new TrustedImageIngestError('invalid_storage');
  const bytes = new Uint8Array(canonical);
  validateAssessmentImage(bytes, asset.mime);
  return db.prepare(`INSERT INTO assessment_image_assets(id, owner_id, mime, byte_length, sha256, bytes)
    SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM assessment_image_assets WHERE id = ?)
    AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id = ?) < ?
    AND (SELECT COALESCE(SUM(byte_length),0) FROM assessment_image_assets WHERE owner_id = ?) + ? <= ?`)
    .bind(asset.id, asset.ownerId, asset.mime, asset.byteLength, asset.sha256, canonical, asset.id, asset.ownerId, ASSESSMENT_ASSET_OWNER_MAX_COUNT, asset.ownerId, asset.byteLength, ASSESSMENT_ASSET_OWNER_MAX_BYTES);
}

function uuidV4(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
const text = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
function pngCrc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngDimensions(bytes: Uint8Array): [number, number] | null {
  const sig = [137,80,78,71,13,10,26,10];
  if (bytes.length < 57 || !sig.every((value, i) => bytes[i] === value)) return null;
  let offset = 8, width = 0, height = 0, seenHeader = false, seenData = false;
  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, bytes.byteLength - offset);
    const length = view.getUint32(0); const end = offset + 12 + length;
    if (end > bytes.length) return null;
    const type = text(bytes, offset + 4, offset + 8);
    if (view.getUint32(8 + length) !== pngCrc32(bytes, offset + 4, offset + 8 + length)) return null;
    if (!seenHeader) {
      if (type !== 'IHDR' || length !== 13) return null;
      width = view.getUint32(8); height = view.getUint32(12); seenHeader = true;
    } else if (type === 'IHDR') return null;
    if (type === 'IDAT' && length > 0) seenData = true;
    if (type === 'IEND') return length === 0 && seenData && end === bytes.length && width > 0 && height > 0 ? [width, height] : null;
    offset = end;
  }
  return null;
}
const jpegSof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
function jpegDimensions(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2, width = 0, height = 0, seenSof = false, seenSos = false;
  while (i < bytes.length) {
    if (bytes[i++] !== 0xff) return null;
    while (i < bytes.length && bytes[i] === 0xff) i++;
    if (i >= bytes.length) return null;
    const marker = bytes[i++];
    if (marker === 0xd9) return seenSof && seenSos && i === bytes.length ? [width, height] : null;
    if (marker === 0x00 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) return null;
    if (i + 2 > bytes.length) return null;
    const length = (bytes[i] << 8) | bytes[i + 1];
    if (length < 2 || i + length > bytes.length) return null;
    if (jpegSof.has(marker)) {
      if (length < 8) return null;
      height = (bytes[i + 3] << 8) | bytes[i + 4]; width = (bytes[i + 5] << 8) | bytes[i + 6]; seenSof = true;
    }
    if (marker !== 0xda) { i += length; continue; }
    if (!seenSof || length < 6) return null;
    seenSos = true; i += length;
    // Consume entropy-coded data; 0xFF00 is stuffed data and restart markers are in-band.
    let nextMarker = -1;
    while (i < bytes.length) {
      if (bytes[i++] !== 0xff) continue;
      while (i < bytes.length && bytes[i] === 0xff) i++;
      if (i >= bytes.length) return null;
      const candidate = bytes[i];
      if (candidate === 0x00 || (candidate >= 0xd0 && candidate <= 0xd7)) { i++; continue; }
      nextMarker = candidate; i--; break;
    }
    if (nextMarker < 0) return null;
  }
  return null;
}
function webpDimensions(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 20 || text(bytes,0,4) !== 'RIFF' || text(bytes,8,12) !== 'WEBP') return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) + 8 !== bytes.length) return null;
  let offset = 12, canvas: [number,number] | null = null, image: [number,number] | null = null;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return null;
    const kind = text(bytes,offset,offset+4), length = view.getUint32(offset+4,true);
    const payload = offset + 8, end = payload + length, paddedEnd = end + (length & 1);
    if (end > bytes.length || paddedEnd > bytes.length) return null;
    if (kind === 'VP8X') {
      if (length !== 10 || bytes[payload] & 0xc1) return null;
      canvas = [1 + bytes[payload+4] + (bytes[payload+5]<<8) + (bytes[payload+6]<<16), 1 + bytes[payload+7] + (bytes[payload+8]<<8) + (bytes[payload+9]<<16)];
    } else if (kind === 'VP8 ') {
      if (length < 10 || bytes[payload+3] !== 0x9d || bytes[payload+4] !== 0x01 || bytes[payload+5] !== 0x2a) return null;
      image = [((bytes[payload+7]&0x3f)<<8)|bytes[payload+6], ((bytes[payload+9]&0x3f)<<8)|bytes[payload+8]];
    } else if (kind === 'VP8L') {
      if (length < 5 || bytes[payload] !== 0x2f) return null;
      image = [1 + bytes[payload+1] + ((bytes[payload+2]&0x3f)<<8), 1 + (bytes[payload+2]>>6) + (bytes[payload+3]<<2) + ((bytes[payload+4]&0x0f)<<10)];
    }
    offset = paddedEnd;
  }
  if (offset !== bytes.length || !image) return null;
  if (canvas && (canvas[0] !== image[0] || canvas[1] !== image[1])) return null;
  return image;
}
function dimensions(bytes: Uint8Array, mime: AssessmentImageMime): [number, number] | null {
  if (mime === 'image/png') return pngDimensions(bytes);
  if (mime === 'image/jpeg') return jpegDimensions(bytes);
  return webpDimensions(bytes);
}
export function validateAssessmentImage(bytes: Uint8Array, mime: string): asserts mime is AssessmentImageMime {
  if (!bytes.length || bytes.length > ASSESSMENT_ASSET_MAX_BYTES || !['image/png','image/jpeg','image/webp'].includes(mime)) throw new TrustedImageIngestError(bytes.length > ASSESSMENT_ASSET_MAX_BYTES ? 'too_large' : 'invalid_image');
  const size = dimensions(bytes, mime as AssessmentImageMime);
  if (!size || size[0] < 1 || size[1] < 1 || size[0] * size[1] > ASSESSMENT_IMAGE_MAX_PIXELS) throw new TrustedImageIngestError('invalid_image');
}
function normalizeStoredBytes(value: unknown, expectedLength: unknown): Uint8Array {
  if (!Number.isInteger(expectedLength) || Number(expectedLength) < 1 || Number(expectedLength) > ASSESSMENT_ASSET_MAX_BYTES) throw new TrustedImageIngestError('invalid_storage');
  let bytes: Uint8Array;
  if (value instanceof ArrayBuffer) bytes = new Uint8Array(value.slice(0));
  else if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    bytes = new Uint8Array(view.byteLength);
    bytes.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  } else if (Array.isArray(value) && value.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) bytes = Uint8Array.from(value);
  else throw new TrustedImageIngestError('invalid_storage');
  if (bytes.byteLength !== Number(expectedLength)) throw new TrustedImageIngestError('invalid_storage');
  return bytes;
}
function sniff(bytes: Uint8Array): AssessmentImageMime | null {
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') return 'image/webp';
  return null;
}
function meta(row: any): AssessmentAssetMetadata {
  return { id: row.id, assetId: row.id, mime: row.mime, byteLength: Number(row.byte_length), sha256: row.sha256, url: `/api/assessment-assets/${row.id}` };
}
export async function persistAssessmentAsset(db: D1Database, ownerId: number | string, bytes: Uint8Array, mime: string, options: { assetId?: string } = {}): Promise<AssessmentAssetMetadata> {
  validateAssessmentImage(bytes, mime);
  let hash: string;
  try { hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', copyBytesToArrayBuffer(bytes)))).map(v => v.toString(16).padStart(2,'0')).join(''); }
  catch { throw new TrustedImageIngestError('storage_hash_failed'); }
  const id = options.assetId || crypto.randomUUID();
  if (!uuidV4(id)) throw new TrustedImageIngestError('invalid_image');
  let prior: unknown;
  try { prior = await db.prepare('SELECT id, mime, byte_length, sha256 FROM assessment_image_assets WHERE id = ? AND owner_id = ?').bind(id, ownerId).first(); }
  catch { throw new TrustedImageIngestError('storage_read_failed'); }
  if (prior) {
    if ((prior as any).mime === mime && Number((prior as any).byte_length) === bytes.length && (prior as any).sha256 === hash) return meta(prior);
    throw new TrustedImageIngestError('identity_conflict');
  }
  let result: D1Result;
  try {
    result = await db.prepare(`INSERT INTO assessment_image_assets(id, owner_id, mime, byte_length, sha256, bytes)
      SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id = ?) < ?
      AND (SELECT COALESCE(SUM(byte_length),0) FROM assessment_image_assets WHERE owner_id = ?) + ? <= ?
      AND NOT EXISTS (SELECT 1 FROM assessment_image_assets WHERE id = ?)`)
      .bind(id, ownerId, mime, bytes.length, hash, copyBytesToArrayBuffer(bytes), ownerId, ASSESSMENT_ASSET_OWNER_MAX_COUNT, ownerId, bytes.length, ASSESSMENT_ASSET_OWNER_MAX_BYTES, id).run();
  } catch { throw new TrustedImageIngestError('storage_write_failed'); }
  if (!result.success || !result.meta?.changes) {
    let raced: any;
    try { raced = await db.prepare('SELECT id, owner_id, mime, byte_length, sha256 FROM assessment_image_assets WHERE id = ?').bind(id).first(); }
    catch { throw new TrustedImageIngestError('storage_read_failed'); }
    if (raced && (raced as any).owner_id !== ownerId) throw new TrustedImageIngestError('identity_conflict');
    if (raced && (raced as any).mime === mime && Number((raced as any).byte_length) === bytes.length && (raced as any).sha256 === hash) return meta(raced);
    if (raced) throw new TrustedImageIngestError('identity_conflict');
    let quota: any;
    try { quota = await db.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(byte_length), 0) AS bytes FROM assessment_image_assets WHERE owner_id = ?').bind(ownerId).first(); }
    catch { throw new TrustedImageIngestError('storage_read_failed'); }
    if (Number(quota?.count) >= ASSESSMENT_ASSET_OWNER_MAX_COUNT) throw new TrustedImageIngestError('quota_count');
    if (Number(quota?.bytes) + bytes.length > ASSESSMENT_ASSET_OWNER_MAX_BYTES) throw new TrustedImageIngestError('quota_bytes');
    throw new TrustedImageIngestError('identity_conflict');
  }
  return { id, assetId: id, mime: mime as AssessmentImageMime, byteLength: bytes.length, sha256: hash, url: `/api/assessment-assets/${id}` };
}
export async function readOwnedAssessmentAsset(db: D1Database, ownerId: number | string, id: string): Promise<OwnedAssessmentAsset | null> {
  const row: any = await db.prepare('SELECT id, mime, byte_length, sha256, bytes FROM assessment_image_assets WHERE id = ? AND owner_id = ?').bind(id, ownerId).first();
  if (!row) return null;
  const bytes = normalizeStoredBytes(row.bytes, row.byte_length);
  return { ...meta(row), bytes };
}
export async function fetchTrustedAssessmentImage(ownerId: number, sourceUrl: string, options: { maxBytes?: number; id?: string } = {}): Promise<StagedAssessmentAsset> {
  const effectiveLimit = Math.min(ASSESSMENT_ASSET_MAX_BYTES, options.maxBytes ?? ASSESSMENT_ASSET_MAX_BYTES);
  if (!Number.isSafeInteger(effectiveLimit) || effectiveLimit < 0) throw new TrustedImageIngestError('package_image_byte_limit');
  let url: URL;
  try { url = new URL(sourceUrl); } catch { throw new TrustedImageIngestError('invalid_url'); }
  if (url.protocol === 'data:') {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(sourceUrl);
    if (!match) throw new TrustedImageIngestError('invalid_image');
    if (match[2].length > Math.ceil(effectiveLimit / 3) * 4) throw new TrustedImageIngestError(effectiveLimit < ASSESSMENT_ASSET_MAX_BYTES ? 'package_image_byte_limit' : 'too_large');
    const raw = atob(match[2]); if (raw.length > effectiveLimit) throw new TrustedImageIngestError(effectiveLimit < ASSESSMENT_ASSET_MAX_BYTES ? 'package_image_byte_limit' : 'too_large');
    const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
    const detected = sniff(bytes); if (!detected || detected !== match[1]) throw new TrustedImageIngestError('invalid_image');
    return prepareOwnedAssessmentAsset(ownerId, bytes, detected, { id: options.id }, true);
  }
  const assertTrustedUrl = (candidate: URL) => {
    const host = candidate.hostname.toLowerCase();
    const isTrustedHost = host === 'upload.wikimedia.org' || /^[a-z0-9-]+\.vultrobjects\.com$/.test(host);
    if (candidate.protocol !== 'https:' || candidate.username || candidate.password || (candidate.port && candidate.port !== '443') || !isTrustedHost) {
      throw new TrustedImageIngestError('untrusted_host');
    }
  };
  assertTrustedUrl(url);
  const controller = new AbortController(); let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 10_000);
  try {
    let response: Response;
    const visited = new Set<string>();
    let redirects = 0;
    while (true) {
      const requestUrl = url.href;
      if (visited.has(requestUrl)) throw new TrustedImageIngestError('fetch_redirect');
      visited.add(requestUrl);
      try {
        response = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { Accept: 'image/png,image/jpeg,image/webp' } });
      } catch (error) {
        if (timedOut || (error instanceof DOMException && error.name === 'AbortError')) throw new TrustedImageIngestError('fetch_timeout');
        throw new TrustedImageIngestError('fetch_failed');
      }
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get('location');
      try { await response.body?.cancel(); } catch { /* best-effort response cleanup */ }
      if (!location || redirects >= 3) throw new TrustedImageIngestError('fetch_redirect');
      let next: URL;
      try { next = new URL(location, url); }
      catch { throw new TrustedImageIngestError('fetch_redirect'); }
      assertTrustedUrl(next);
      redirects++;
      url = next;
    }
    if (!response.ok) {
      try { await response.body?.cancel(); } catch { /* best-effort response cleanup */ }
      throw new TrustedImageIngestError(response.status === 404 || response.status === 410 ? 'expired_or_missing' : 'fetch_status');
    }
    if (!response.body) throw new TrustedImageIngestError('body_read_failed');
    const rawDeclared = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const declared = rawDeclared === 'image/jpg' ? 'image/jpeg' : rawDeclared;
    if (!['image/png','image/jpeg','image/webp'].includes(declared || '')) {
      try { await response.body.cancel(); } catch { /* best-effort response cleanup */ }
      throw new TrustedImageIngestError('invalid_image');
    }
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
    let streamComplete = false;
    try {
      while (true) {
        let result: ReadableStreamReadResult<Uint8Array>;
        try { result = await reader.read(); }
        catch { throw new TrustedImageIngestError(timedOut ? 'fetch_timeout' : 'body_read_failed'); }
        if (result.done) { streamComplete = true; break; }
        total += result.value.length;
        if (total > effectiveLimit) throw new TrustedImageIngestError(effectiveLimit < ASSESSMENT_ASSET_MAX_BYTES ? 'package_image_byte_limit' : 'too_large');
        chunks.push(result.value);
      }
    } finally {
      if (!streamComplete) { try { await reader.cancel(); } catch { /* best-effort reader cleanup */ } }
      reader.releaseLock();
    }
    const bytes = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
    chunks.length = 0;
    const detected = sniff(bytes); if (!detected || detected !== declared) throw new TrustedImageIngestError('invalid_image');
    return prepareOwnedAssessmentAsset(ownerId, bytes, detected, { id: options.id }, true);
  } finally { clearTimeout(timer); }
}

export async function ingestTrustedAssessmentImage(db: D1Database, ownerId: number | string, sourceUrl: string): Promise<AssessmentAssetMetadata> {
  let prepared: StagedAssessmentAsset;
  try { prepared = await fetchTrustedAssessmentImage(Number(ownerId), sourceUrl); }
  catch (error) { if (error instanceof TrustedImageIngestError) throw error; throw new TrustedImageIngestError('persistence_failed'); }
  // Preserve the standalone API's retry/quota behavior while reusing the prepared identity and digest.
  let prior: any;
  try { prior = await db.prepare('SELECT id, mime, byte_length, sha256 FROM assessment_image_assets WHERE id = ? AND owner_id = ?').bind(prepared.id, ownerId).first(); }
  catch { throw new TrustedImageIngestError('storage_read_failed'); }
  if (prior) {
    if (prior.mime === prepared.mime && Number(prior.byte_length) === prepared.byteLength && prior.sha256 === prepared.sha256) return meta(prior);
    throw new TrustedImageIngestError('identity_conflict');
  }
  let result: D1Result;
  try { result = await buildStagedAssessmentAssetInsert(db, prepared).run(); }
  catch { throw new TrustedImageIngestError('storage_write_failed'); }
  if (result.success && result.meta?.changes) return { id: prepared.id, assetId: prepared.id, mime: prepared.mime, byteLength: prepared.byteLength, sha256: prepared.sha256, url: `/api/assessment-assets/${prepared.id}` };
  return persistAssessmentAsset(db, ownerId, new Uint8Array(prepared.bytes), prepared.mime, { assetId: prepared.id });
}
