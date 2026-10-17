import { Hono } from 'hono';
import { getCookie, getCurrentUser } from '../lib/auth';
import { TrustedImageIngestError, persistAssessmentAsset, readOwnedAssessmentAsset, ASSESSMENT_ASSET_MAX_BYTES } from '../lib/assessment-assets';
import { Errors, successResponse } from '../lib/response';

const assets = new Hono<{ Bindings: { DB: D1Database }; Variables: { user: any } }>();
assets.use('*', async (c, next) => {
  const session = getCookie(c.req.header('Cookie'), 'session') || c.req.header('x-session-id') || c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const user = await getCurrentUser(c.env.DB, session);
  if (!user) return Errors.unauthorized(c);
  c.set('user', user);
  await next();
});

assets.post('/', async (c) => {
  const mime = c.req.header('content-type')?.split(';')[0].trim().toLowerCase();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime || '')) return Errors.validation(c, 'Format gambar tidak didukung.');
  const rawId = c.req.header('X-Asset-Id');
  if (rawId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawId)) return Errors.validation(c, 'ID aset tidak valid.');
  const reader = c.req.raw.body?.getReader();
  if (!reader) return Errors.validation(c, 'Isi gambar wajib diisi.');
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > ASSESSMENT_ASSET_MAX_BYTES) { await reader.cancel(); return Errors.validation(c, 'Ukuran gambar melebihi 1,5 MiB.'); }
      chunks.push(value);
    }
  } catch { try { await reader.cancel(); } catch { /* best-effort upload reader cleanup */ } return Errors.validation(c, 'Isi gambar tidak dapat dibaca.'); }
  finally { try { reader.releaseLock(); } catch { /* reader may already be released */ } }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const result = await persistAssessmentAsset(c.env.DB, c.get('user').id, bytes, mime!, { assetId: rawId || undefined });
    return successResponse(c, result, undefined, 201);
  } catch (error) {
    if (error instanceof TrustedImageIngestError) {
      if (error.reason === 'identity_conflict') return Errors.conflict(c, 'ID aset telah digunakan dengan konten berbeda.');
      if (error.reason === 'quota_count' || error.reason === 'quota_bytes') return Errors.validation(c, error.reason === 'quota_count' ? 'Batas jumlah aset telah tercapai.' : 'Batas penyimpanan aset telah tercapai.');
      return Errors.validation(c, error.reason === 'too_large' ? 'Ukuran aset melebihi batas.' : 'Gambar tidak valid.');
    }
    return Errors.internal(c);
  }
});

assets.get('/:id', async (c) => {
  const asset = await readOwnedAssessmentAsset(c.env.DB, c.get('user').id, c.req.param('id'));
  if (!asset) return Errors.notFound(c, 'Aset');
  c.header('Content-Type', asset.mime);
  c.header('Content-Length', String(asset.byteLength));
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Cache-Control', 'private, no-store');
  return c.body(asset.bytes as any);
});

export default assets;
