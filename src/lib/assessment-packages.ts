import { ASSESSMENT_ASSET_OWNER_MAX_BYTES, ASSESSMENT_ASSET_OWNER_MAX_COUNT, validateAssessmentImage, type AssessmentImageMime } from './assessment-assets';
import { copyBytesToArrayBuffer } from './binary';
import { assessmentSvgDataUri, decodeAssessmentSvgDataUri, sanitizeAssessmentSvg, UnsafeAssessmentSvgError } from './assessment-package-svg';
import { generateVisualStimulus } from './visual-engine';
import { getVisualCatalog } from './visuals/catalog';
import { generationFencePredicate, type AssessmentGenerationFence } from './assessment-generation-requests';

export const PACKAGE_MAX_CONTENT_BYTES = 1024 * 1024;
export const PACKAGE_MAX_ASSETS = 8;
export const PACKAGE_MAX_ASSET_BYTES = 4 * 1024 * 1024;
export const PACKAGE_MAX_DEPTH = 32;

export type AssessmentPackageMetadata = {
  user_nama: string;
  sekolah?: string | null;
  mata_pelajaran: string;
  topik: string;
  jenjang_kelas: string;
  semester?: string | null;
  jenis_ujian?: string | null;
  capaian_pembelajaran?: string | null;
  jumlah_pg?: number;
  jumlah_isian?: number;
  jumlah_uraian?: number;
  isian_type?: string;
  hots_ratio?: string;
  ai_provider?: string | null;
};

export class AssessmentPackageWriteError extends Error {
  constructor(readonly code: 'content_too_large' | 'invalid_content' | 'invalid_image_reference' | 'too_many_assets' | 'package_assets_too_large' | 'asset_not_owned' | 'document_id_conflict' | 'creation_failed' | 'stale_revision' | 'package_missing' | 'forbidden' | 'source_unavailable' | 'quota_count' | 'quota_bytes' | 'untrusted_svg' | 'image_recovery_limit' | 'generation_fenced_conflict') {
    super(code);
  }
}

export function canonicalContent(value: unknown): string {
  let json: string;
  try { json = typeof value === 'string' ? value : JSON.stringify(value); }
  catch { throw new AssessmentPackageWriteError('invalid_content'); }
  if (!json || new TextEncoder().encode(json).byteLength > PACKAGE_MAX_CONTENT_BYTES) throw new AssessmentPackageWriteError('content_too_large');
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { throw new AssessmentPackageWriteError('invalid_content'); }
  if (!isRecord(parsed) || !hasAllowedDepth(parsed, PACKAGE_MAX_DEPTH)) throw new AssessmentPackageWriteError('invalid_content');
  return json;
}

export async function hashContent(content: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
}

const IMAGE_METADATA_FIELDS = ['alt', 'credit', 'title', 'description', 'caption', 'type'] as const;
const FAILURE_REASONS = new Set(['invalid_url', 'untrusted_host', 'fetch_failed', 'expired_or_missing', 'invalid_image', 'too_large', 'identity_conflict', 'quota_count', 'quota_bytes', 'invalid_storage', 'asset_not_owned_or_missing', 'required_image_missing', 'image_unavailable', 'image_search_unavailable', 'duplicate_image_rejected', 'duplicate_visual_rejected', 'required_diagram_missing', 'image_not_selected', 'image_generation_disabled', 'untrusted_svg']);

function safeImageMetadata(image: Record<string, any>) {
  const result: Record<string, string> = {};
  for (const key of IMAGE_METADATA_FIELDS) {
    const value = image[key];
    if (typeof value !== 'string') continue;
    const normalized = value.trim();
    if (!normalized || normalized.length > (key === 'description' ? 500 : 240) || /(?:https?:\/\/|data:|www\.|javascript:|<|>|\b(?:bearer|token)\b)/i.test(normalized)) continue;
    if (key === 'type' && !['ai', 'photo', 'svg'].includes(normalized)) continue;
    result[key] = normalized;
  }
  return result;
}

function imageRecord(value: unknown): Record<string, any> | null {
  if (typeof value === 'string') return { url: value };
  return isRecord(value) ? value : null;
}

function svgAliases(image: Record<string, any>): string[] {
  const candidates: string[] = [];
  for (const key of ['svg', 'url', 'dataUri', 'src', 'gambar', 'data']) {
    if (typeof image[key] !== 'string') continue;
    const value = image[key] as string;
    if (key === 'svg' || /<\s*svg\b/i.test(value)) candidates.push(value);
    else {
      try {
        const decoded = decodeAssessmentSvgDataUri(value);
        if (decoded !== null) candidates.push(decoded);
      } catch { throw new AssessmentPackageWriteError('untrusted_svg'); }
    }
  }
  return candidates;
}

export type LegacyImageSource = { kind: 'svg'; svg: string } | { kind: 'raster'; url: string };
export function legacyImageSource(imageValue: unknown, legacySvgValue?: unknown): LegacyImageSource | null {
  const image = imageRecord(imageValue);
  if (!image) return null;
  const svgs = svgAliases(image);
  if (typeof legacySvgValue === 'string') svgs.unshift(legacySvgValue);
  if (svgs.length) {
    try {
      const svg = sanitizeAssessmentSvg(svgs[0]);
      return typeof image.assetId === 'string' ? null : { kind: 'svg', svg };
    }
    catch { throw new AssessmentPackageWriteError('untrusted_svg'); }
  }
  if (typeof image.assetId === 'string') return null;
  for (const key of ['url', 'dataUri', 'src', 'gambar', 'data']) {
    if (typeof image[key] === 'string' && image[key].trim()) return { kind: 'raster', url: image[key].trim() };
  }
  return null;
}

function cleanVisualSpec(value: any): { type: string; params: Record<string, any>; caption?: string } | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null;
  const sample = getVisualCatalog().find(item => item.id === value.type)?.sampleParams;
  if (!sample) return null;
  const clean = (source: any, shape: any, depth = 0): any => {
    if (depth > 5) return undefined;
    if (Array.isArray(shape)) {
      if (!Array.isArray(source) || source.length > 64) return undefined;
      const values = source.map(item => clean(item, shape[0], depth + 1));
      return values.some(item => item === undefined) ? undefined : values;
    }
    if (isRecord(shape)) {
      if (!isRecord(source)) return undefined;
      const output: Record<string, any> = {};
      for (const [key, item] of Object.entries(source)) {
        if (!Object.prototype.hasOwnProperty.call(shape, key) || /(?:url|uri|svg|script|href|src|html|xml|image|gambar|onload)/i.test(key)) continue;
        const sanitized = clean(item, shape[key], depth + 1);
        if (sanitized !== undefined) output[key] = sanitized;
      }
      return output;
    }
    if (typeof shape === 'number') return typeof source === 'number' && Number.isFinite(source) && Math.abs(source) <= 1_000_000 ? source : undefined;
    if (typeof shape === 'boolean') return typeof source === 'boolean' ? source : undefined;
    if (typeof shape === 'string') return typeof source === 'string' && source.length <= 120 && !/(?:https?:\/\/|data:|javascript:|[<>]|\bon\w+\s*=)/i.test(source) ? source : undefined;
    return undefined;
  };
  const params = clean(isRecord(value.params) ? value.params : {}, sample);
  if (!isRecord(params)) return null;
  const spec = { type: value.type, params, ...(typeof value.caption === 'string' && value.caption.length <= 120 && !/(?:https?:\/\/|data:|[<>])/i.test(value.caption) ? { caption: value.caption } : {}) };
  return JSON.stringify(spec).length <= 8192 ? spec : null;
}

function sanitizedSvg(svg: string): string {
  try { return sanitizeAssessmentSvg(svg); }
  catch (error) { if (error instanceof UnsafeAssessmentSvgError) throw new AssessmentPackageWriteError('untrusted_svg'); throw error; }
}

export function preparePackageContent(value: unknown): { content: any; json: string; warnings: string[] } {
  const content: any = JSON.parse(canonicalContent(value));
  const warnings: string[] = [];
  for (const item of questionItems(content)) { const warning = prepareQuestionImage(item); if (warning) warnings.push(warning); }
  return { content, json: canonicalContent(content), warnings };
}

function prepareQuestionImage(item: any): string | null {
  const image = imageRecord(item.gambar) || (typeof item.svg === 'string' ? {} : null);
  if (image && typeof item.svg === 'string' && typeof image.svg !== 'string') image.svg = item.svg;
  delete item.svg;
  const metadata = image ? safeImageMetadata(image) : {};
  const safeSvgs = image ? svgAliases(image).map(sanitizedSvg) : [];
  const assetId = image && typeof image.assetId === 'string' ? image.assetId : null;
  if (assetId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assetId)) throw new AssessmentPackageWriteError('invalid_image_reference');
    item.gambar = { ...metadata, assetId, url: `/api/assessment-assets/${encodeURIComponent(assetId)}` };
    delete item.visual_stimulus;
    return null;
  }
  const visualSpec = cleanVisualSpec(item.visual_stimulus);
  if (visualSpec) {
    const rendered = generateVisualStimulus(visualSpec);
    if (rendered?.svg) {
      const svg = sanitizedSvg(rendered.svg);
      item.gambar = { ...metadata, type: 'svg', svg, url: assessmentSvgDataUri(svg), ...(typeof rendered.credit === 'string' ? { credit: safeImageMetadata({ credit: rendered.credit }).credit || 'Examplate Visual Engine' } : {}) };
      item.visual_stimulus = visualSpec;
      return null;
    }
  }
  if (safeSvgs.length) {
    const svg = safeSvgs[0];
    item.gambar = { ...metadata, type: 'svg', svg, url: assessmentSvgDataUri(svg) };
    delete item.visual_stimulus;
    return null;
  }
  const hasSource = !!image && ['url', 'dataUri', 'src', 'gambar', 'data', 'svg'].some(key => typeof image[key] === 'string' && image[key].trim());
  const requiresStimulus = item.imageRequired === true || /(?:perhatikan|amatilah|lihat|berdasarkan)\s+(?:gambar|foto|diagram|ilustrasi)|look\s+at\s+the\s+(?:picture|image|diagram)/i.test(String(item.soal || ''));
  const reason = image?.imageUnavailable === true
    ? FAILURE_REASONS.has(String(image.imageUnavailableReason || image.imageWarningReason)) ? String(image.imageUnavailableReason || image.imageWarningReason) : 'image_unavailable'
    : hasSource || requiresStimulus ? 'required_image_missing' : null;
  if (reason) {
    item.gambar = { ...metadata, imageUnavailable: true, imageUnavailableReason: reason };
    if (hasSource || requiresStimulus) return `Butir ${item.no ?? '?'}: gambar tidak tersimpan; unggah atau pulihkan sumber asli.`;
  } else if (image) {
    const clean = Object.keys(metadata).length ? metadata : null;
    if (clean) item.gambar = clean; else delete item.gambar;
  } else {
    delete item.gambar;
  }
  if (!visualSpec) delete item.visual_stimulus;
  return null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function hasAllowedDepth(root: unknown, max: number): boolean {
  const stack: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }];
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (depth > max) return false;
    if (value && typeof value === 'object') for (const child of Object.values(value)) stack.push({ value: child, depth: depth + 1 });
  }
  return true;
}

export function questionItems(content: any): any[] {
  if (!isRecord(content)) throw new AssessmentPackageWriteError('invalid_content');
  const items: any[] = [];
  if (Array.isArray(content.pg)) items.push(...content.pg);
  if (isRecord(content.isian) && Array.isArray(content.isian.data)) items.push(...content.isian.data);
  if (Array.isArray(content.uraian)) items.push(...content.uraian);
  if (items.some(item => !isRecord(item))) throw new AssessmentPackageWriteError('invalid_content');
  return items;
}

export function findAssetIds(content: unknown): string[] {
  const parsed = typeof content === 'string' ? JSON.parse(content) : content;
  const found = new Set<string>();
  let references = 0;
  for (const item of questionItems(parsed)) {
    const image = item.gambar;
    if (image == null) continue;
    if (!isRecord(image)) throw new AssessmentPackageWriteError('invalid_image_reference');
    if (typeof image.assetId === 'string') {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(image.assetId)) throw new AssessmentPackageWriteError('invalid_image_reference');
      found.add(image.assetId);
      references++;
    }
  }
  if (references > PACKAGE_MAX_ASSETS) throw new AssessmentPackageWriteError('too_many_assets');
  return [...found];
}

export async function validateOwnedAssets(db: D1Database, ownerId: number, ids: string[]) {
  if (!ids.length) return;
  const placeholders = ids.map(() => '?').join(',');
  const result: any = await db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(byte_length),0) AS bytes FROM assessment_image_assets WHERE owner_id = ? AND id IN (${placeholders})`)
    .bind(ownerId, ...ids).first();
  if (Number(result?.count) !== ids.length) throw new AssessmentPackageWriteError('asset_not_owned');
  if (Number(result?.bytes) > PACKAGE_MAX_ASSET_BYTES) throw new AssessmentPackageWriteError('package_assets_too_large');
}

export async function saveOwnedAssessmentPackage(
  db: D1Database,
  input: { ownerId: number; packageId: number | string; baseRevision: number; content: unknown },
): Promise<{ packageId: number; revision: number; saveStatus: 'saved'; content: any; imageWarnings: string[] }> {
  if (!Number.isSafeInteger(input.baseRevision) || input.baseRevision < 1) throw new AssessmentPackageWriteError('invalid_content');
  const { content, json } = preparePackageContent(input.content);
  const ids = findAssetIds(json);
  await validateOwnedAssets(db, input.ownerId, ids);
  const hash = await hashContent(json), token = crypto.randomUUID(), nextRevision = input.baseRevision + 1;
  const idList = ids.length ? ids.map(() => '?').join(',') : "''";
  const statements: D1PreparedStatement[] = [
    db.prepare(`UPDATE bank_soal SET content=?,content_hash=?,content_write_token=?,revision=revision+1,
        legacy_compat=0,moderation_status=CASE WHEN is_public=1 THEN 'pending' ELSE 'private' END,is_hidden=0,
        moderation_actor_id=NULL,moderation_at=NULL,moderation_event_id=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND user_id=? AND revision=?
        AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idList}))=?
        AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idList})),0)<=4194304`)
      .bind(json, hash, token, input.packageId, input.ownerId, input.baseRevision, input.ownerId, ...ids, ids.length, input.ownerId, ...ids),
    db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision)
      SELECT ?,id,revision FROM bank_soal WHERE id=? AND user_id=? AND revision=? AND content_write_token=?`)
      .bind(token, input.packageId, input.ownerId, nextRevision, token),
    db.prepare(`DELETE FROM bank_soal_assets WHERE bank_soal_id=? AND EXISTS(SELECT 1 FROM bank_soal WHERE id=? AND user_id=? AND revision=? AND content_write_token=?)`)
      .bind(input.packageId, input.packageId, input.ownerId, nextRevision, token),
    ...ids.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT ?,a.id FROM assessment_image_assets a JOIN bank_soal bs ON bs.id=? AND bs.user_id=? AND bs.revision=? AND bs.content_write_token=?
      WHERE a.id=? AND a.owner_id=?`).bind(input.packageId, input.packageId, input.ownerId, nextRevision, token, assetId, input.ownerId)),
  ];
  const result = await db.batch(statements);
  if (!result[0]?.meta?.changes) {
    const row: any = await db.prepare('SELECT user_id,revision FROM bank_soal WHERE id=?').bind(input.packageId).first();
    if (!row) throw new AssessmentPackageWriteError('package_missing');
    if (Number(row.user_id) !== input.ownerId) throw new AssessmentPackageWriteError('forbidden');
    if (Number(row.revision) !== input.baseRevision) throw new AssessmentPackageWriteError('stale_revision');
    await validateOwnedAssets(db, input.ownerId, ids);
    throw new AssessmentPackageWriteError('package_assets_too_large');
  }
  const normalized = normalizeAssetUrls(content, input.packageId);
  return { packageId: Number(input.packageId), revision: nextRevision, saveStatus: 'saved', content: normalized.content, imageWarnings: normalized.warnings };
}

export async function copyAccessibleAssessmentPackage(
  db: D1Database,
  input: { ownerId: number; ownerName: string; ownerSchool?: string; sourcePackageId: number | string; clientDocumentId?: string | null },
): Promise<{ packageId: number; revision: number; saveStatus: 'saved'; content: any; imageWarnings: string[] }> {
  const { ownerId, sourcePackageId, clientDocumentId } = input;
  if (clientDocumentId != null && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientDocumentId)) throw new AssessmentPackageWriteError('invalid_content');
  if (clientDocumentId) {
    const prior: any = await db.prepare(`SELECT id,revision,copy_source_id,copy_source_revision,copy_source_hash,content FROM bank_soal WHERE user_id=? AND client_document_id=?`).bind(ownerId, clientDocumentId).first();
    if (prior) {
      if (String(prior.copy_source_id) !== String(sourcePackageId)) throw new AssessmentPackageWriteError('document_id_conflict');
      const currentSource: any = await db.prepare('SELECT revision,content FROM bank_soal WHERE id=?').bind(sourcePackageId).first();
      if (currentSource && (Number(prior.copy_source_revision) !== Number(currentSource.revision) || prior.copy_source_hash !== await hashContent(String(currentSource.content)))) throw new AssessmentPackageWriteError('document_id_conflict');
      const normalized = normalizeAssetUrls(JSON.parse(prior.content), prior.id);
      return { packageId: Number(prior.id), revision: Number(prior.revision), saveStatus: 'saved', content: normalized.content, imageWarnings: normalized.warnings };
    }
  }

  const publicPredicate = `(bs.is_hidden=0 AND bs.is_public=1 AND (bs.moderation_status='approved' OR bs.legacy_compat=1))`;
  const access = `(bs.user_id=? OR ${publicPredicate})`;
  const source: any = await db.prepare(`SELECT bs.* FROM bank_soal bs WHERE bs.id=? AND ${access}`).bind(sourcePackageId, ownerId).first();
  if (!source) throw new AssessmentPackageWriteError('source_unavailable');

  let content: any;
  try { content = JSON.parse(String(source.content)); } catch { throw new AssessmentPackageWriteError('invalid_content'); }
  if (!isRecord(content) || !hasAllowedDepth(content, PACKAGE_MAX_DEPTH)) throw new AssessmentPackageWriteError('invalid_content');
  const references = findAssetIds(content);
  const sourceRows: any[] = references.length
    ? (await db.prepare(`SELECT a.id,a.owner_id,a.mime,a.byte_length,a.sha256,a.bytes FROM bank_soal_assets ba
        JOIN assessment_image_assets a ON a.id=ba.asset_id WHERE ba.bank_soal_id=? AND a.owner_id=? AND a.id IN (${references.map(() => '?').join(',')})`)
        .bind(sourcePackageId, source.user_id, ...references).all()).results as any[]
    : [];
  const assets = new Map<string, any>(sourceRows.map(row => [row.id, row]));
  const cloneBySource = new Map<string, string>();
  const clones: Array<{ id: string; mime: AssessmentImageMime; byteLength: number; sha256: string; bytes: Uint8Array }> = [];
  const warnings: string[] = [];
  for (const sourceId of references) {
    const row = assets.get(sourceId);
    if (!row) continue;
    const raw = row.bytes;
    let bytes: Uint8Array;
    if (raw instanceof ArrayBuffer) bytes = new Uint8Array(raw.slice(0));
    else if (ArrayBuffer.isView(raw)) bytes = Uint8Array.from(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength));
    else if (Array.isArray(raw) && raw.every((value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 255)) bytes = Uint8Array.from(raw);
    else throw new AssessmentPackageWriteError('invalid_content');
    if (bytes.length !== Number(row.byte_length)) throw new AssessmentPackageWriteError('invalid_content');
    validateAssessmentImage(bytes, row.mime);
    const cloneId = crypto.randomUUID();
    cloneBySource.set(sourceId, cloneId);
    clones.push({ id: cloneId, mime: row.mime, byteLength: bytes.length, sha256: row.sha256, bytes });
  }
  for (const item of questionItems(content)) {
    if (!isRecord(item.gambar)) continue;
    if (typeof item.gambar.assetId === 'string') {
      const cloneId = cloneBySource.get(item.gambar.assetId);
      if (cloneId) { item.gambar.assetId = cloneId; item.gambar.url = `/api/assessment-assets/${cloneId}`; }
      else {
        delete item.gambar.assetId; delete item.gambar.url; item.gambar.imageUnavailable = true;
        warnings.push(`Butir ${item.no ?? '?'}: aset sumber tidak lagi terkait; unggah ulang gambar asli.`);
      }
    }
  }
  const prepared = preparePackageContent(content);
  const destinationIds = findAssetIds(prepared.json);
  const sourceHash = await hashContent(String(source.content));
  const destHash = await hashContent(prepared.json);
  const token = crypto.randomUUID();
  const bytesTotal = clones.reduce((sum, asset) => sum + asset.byteLength, 0);
  const sourceGuard = `EXISTS(SELECT 1 FROM bank_soal bs WHERE bs.id=? AND bs.revision=? AND bs.content=? AND ${access})`;
  const attachedIds = [...assets.keys()];
  const attachedGuard = `(SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id IN (${attachedIds.length ? attachedIds.map(() => '?').join(',') : "''"}))=?`;
  const cloneUnion = clones.map(() => 'SELECT ? AS id,? AS owner_id,? AS mime,? AS byte_length,? AS sha256,? AS bytes').join(' UNION ALL ');
  const cloneInsert = clones.length ? db.prepare(`INSERT INTO assessment_image_assets(id,owner_id,mime,byte_length,sha256,bytes)
    SELECT incoming.id,incoming.owner_id,incoming.mime,incoming.byte_length,incoming.sha256,incoming.bytes FROM (${cloneUnion}) incoming
    WHERE (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=?)+?<=?
      AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=?),0)+?<=?
      AND ${sourceGuard} AND ${attachedGuard}`)
    .bind(...clones.flatMap(asset => [asset.id, ownerId, asset.mime, asset.byteLength, asset.sha256, copyBytesToArrayBuffer(asset.bytes)]),
      ownerId, clones.length, ASSESSMENT_ASSET_OWNER_MAX_COUNT, ownerId, bytesTotal, ASSESSMENT_ASSET_OWNER_MAX_BYTES,
      sourcePackageId, source.revision, source.content, ownerId, sourcePackageId, ...attachedIds, attachedIds.length)
    : null;
  const metadata = source;
  const insertPackage = db.prepare(`INSERT INTO bank_soal(user_id,user_nama,sekolah,mata_pelajaran,topik,jenjang_kelas,semester,jenis_ujian,capaian_pembelajaran,
      jumlah_pg,jumlah_isian,jumlah_uraian,isian_type,hots_ratio,content,ai_provider,is_public,moderation_status,legacy_compat,is_hidden,content_hash,client_document_id,content_write_token,
      copy_source_id,copy_source_revision,copy_source_hash)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    WHERE ${sourceGuard} AND ${attachedGuard}
      AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${destinationIds.length ? destinationIds.map(() => '?').join(',') : "''"}))=?`)
    .bind(ownerId, input.ownerName, input.ownerSchool || '', metadata.mata_pelajaran, metadata.topik, metadata.jenjang_kelas, metadata.semester, metadata.jenis_ujian,
      metadata.capaian_pembelajaran, metadata.jumlah_pg, metadata.jumlah_isian, metadata.jumlah_uraian, metadata.isian_type, metadata.hots_ratio,
      prepared.json, metadata.ai_provider, 0, 'private', 0, 0, destHash, clientDocumentId || null, token, sourcePackageId, source.revision, sourceHash,
      sourcePackageId, source.revision, source.content, ownerId, sourcePackageId, ...attachedIds, attachedIds.length, ownerId, ...destinationIds, destinationIds.length);
  const statements: D1PreparedStatement[] = [];
  if (cloneInsert) statements.push(cloneInsert);
  statements.push(insertPackage,
    db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision) SELECT ?,id,revision FROM bank_soal WHERE content_write_token=? AND user_id=?`)
      .bind(token, token, ownerId),
    ...destinationIds.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT bs.id,a.id FROM bank_soal bs JOIN assessment_image_assets a ON a.id=? AND a.owner_id=? WHERE bs.content_write_token=? AND bs.user_id=?`)
      .bind(assetId, ownerId, token, ownerId)));
  try { await db.batch(statements); }
  catch (error) {
    if (!clientDocumentId) throw error;
    const winner: any = await db.prepare(`SELECT id,revision,copy_source_id,copy_source_revision,copy_source_hash,content FROM bank_soal WHERE user_id=? AND client_document_id=?`).bind(ownerId, clientDocumentId).first();
    if (!winner) throw error;
    if (String(winner.copy_source_id) !== String(sourcePackageId) || Number(winner.copy_source_revision) !== Number(source.revision) || winner.copy_source_hash !== sourceHash) throw new AssessmentPackageWriteError('document_id_conflict');
    const normalized = normalizeAssetUrls(JSON.parse(winner.content), winner.id);
    return { packageId: Number(winner.id), revision: Number(winner.revision), saveStatus: 'saved', content: normalized.content, imageWarnings: [...warnings, ...normalized.warnings] };
  }
  const row: any = await db.prepare('SELECT id,revision,content FROM bank_soal WHERE user_id=? AND content_write_token=?').bind(ownerId, token).first();
  if (!row) {
    const stillVisible: any = await db.prepare(`SELECT 1 FROM bank_soal bs WHERE bs.id=? AND ${access}`).bind(sourcePackageId, ownerId).first();
    if (!stillVisible) throw new AssessmentPackageWriteError('source_unavailable');
    const quota: any = await db.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(byte_length),0) AS bytes FROM assessment_image_assets WHERE owner_id=?').bind(ownerId).first();
    if (Number(quota?.count) + clones.length > ASSESSMENT_ASSET_OWNER_MAX_COUNT) throw new AssessmentPackageWriteError('quota_count');
    if (Number(quota?.bytes) + bytesTotal > ASSESSMENT_ASSET_OWNER_MAX_BYTES) throw new AssessmentPackageWriteError('quota_bytes');
    throw new AssessmentPackageWriteError('creation_failed');
  }
  const normalized = normalizeAssetUrls(JSON.parse(row.content), row.id);
  return { packageId: Number(row.id), revision: Number(row.revision), saveStatus: 'saved', content: normalized.content, imageWarnings: [...warnings, ...normalized.warnings] };
}

function assertGenerationFenceIdentity(ownerId: number, clientDocumentId: string | null | undefined, fence: AssessmentGenerationFence) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!Number.isSafeInteger(ownerId) || ownerId < 1 || ownerId !== fence.ownerId || !clientDocumentId || clientDocumentId !== fence.clientDocumentId ||
      !uuid.test(fence.clientDocumentId) || !uuid.test(fence.runToken) || fence.jobId !== undefined && (!fence.jobId || fence.jobId.length > 128)) {
    throw new AssessmentPackageWriteError('generation_fenced_conflict');
  }
}

function fencedCompletionStatements(db: D1Database, fence: AssessmentGenerationFence, writeToken: string) {
  const selectPackage = `SELECT id FROM bank_soal WHERE user_id=? AND client_document_id=? AND content_write_token=?`;
  const complete = db.prepare(`UPDATE assessment_generation_requests SET state='completed',package_id=(${selectPackage}),result_json='null',failure_code=NULL,updated_at=CAST(strftime('%s','now') AS INTEGER)
    WHERE owner_id=? AND client_document_id=? AND run_token=? AND state='running'
      AND EXISTS(${selectPackage})`)
    .bind(fence.ownerId, fence.clientDocumentId, writeToken, fence.ownerId, fence.clientDocumentId, fence.runToken, fence.ownerId, fence.clientDocumentId, writeToken);
  // The latch row is selected even when settlement fails; NULL then violates the
  // receipt's NOT NULL bank_soal_id constraint and atomically rolls the batch back.
  const receipt = db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision)
    SELECT ?,CASE WHEN agr.state='completed' AND agr.package_id=bs.id THEN bs.id ELSE NULL END,bs.revision
    FROM bank_soal bs LEFT JOIN assessment_generation_requests agr
      ON agr.owner_id=? AND agr.client_document_id=? AND agr.run_token=?
    WHERE bs.user_id=? AND bs.client_document_id=? AND bs.content_write_token=?`)
    .bind(writeToken, fence.ownerId, fence.clientDocumentId, fence.runToken, fence.ownerId, fence.clientDocumentId, writeToken);
  const finish = db.prepare(`SELECT bs.id,bs.revision,bs.content,bs.content_hash,bs.is_public,bs.moderation_status,bs.legacy_compat,bs.is_hidden
    FROM bank_soal bs JOIN assessment_generation_requests agr ON agr.owner_id=bs.user_id AND agr.client_document_id=bs.client_document_id
    JOIN bank_soal_write_tokens wst ON wst.token=? AND wst.bank_soal_id=bs.id
    WHERE bs.user_id=? AND bs.client_document_id=? AND bs.content_write_token=? AND agr.run_token=? AND agr.state='completed' AND agr.package_id=bs.id`)
    .bind(writeToken, fence.ownerId, fence.clientDocumentId, writeToken, fence.runToken);
  return [complete, receipt, finish];
}

async function readCompletedFencedWinner(db: D1Database, fence: AssessmentGenerationFence, expectedHash: string, expectedContent: string) {
  const row: any = await db.prepare(`SELECT bs.id,bs.revision,bs.content,bs.content_hash,bs.is_public,bs.moderation_status,bs.legacy_compat,bs.is_hidden
    FROM assessment_generation_requests agr JOIN bank_soal bs
      ON bs.id=agr.package_id AND bs.user_id=agr.owner_id AND bs.client_document_id=agr.client_document_id
    JOIN bank_soal_write_tokens wst ON wst.bank_soal_id=bs.id AND wst.token=bs.content_write_token
    WHERE agr.owner_id=? AND agr.client_document_id=? AND agr.run_token=? AND agr.state='completed' AND agr.package_id IS NOT NULL`)
    .bind(fence.ownerId, fence.clientDocumentId, fence.runToken).first();
  if (!row || row.content_hash !== expectedHash || row.content !== expectedContent) return null;
  const normalized = normalizeAssetUrls(JSON.parse(row.content), row.id);
  return { packageId: Number(row.id), revision: Number(row.revision), saveStatus: 'saved' as const, contentHash: row.content_hash,
    content: normalized.content, imageWarnings: normalized.warnings,
    visibility: { is_public: row.is_public, moderation_status: row.moderation_status, legacy_compat: row.legacy_compat, is_hidden: row.is_hidden } };
}

async function createFencedAssessmentPackage(
  db: D1Database,
  input: { ownerId: number; clientDocumentId: string; content: string; contentHash: string; metadata: AssessmentPackageMetadata; assetIds: string[]; fence: AssessmentGenerationFence },
): Promise<{ packageId: number; revision: number; saveStatus: 'saved'; contentHash: string; content: any; visibility: { is_public: number; moderation_status: string; legacy_compat: number; is_hidden: number } }> {
  const { ownerId, clientDocumentId, content, contentHash, metadata, assetIds, fence } = input;
  const prior: any = await db.prepare(`SELECT id,revision,content,content_hash,is_public,moderation_status,legacy_compat,is_hidden
    FROM bank_soal WHERE user_id=? AND client_document_id=?`).bind(ownerId, clientDocumentId).first();
  const writeToken = crypto.randomUUID();
  const idsSql = assetIds.length ? assetIds.map(() => '?').join(',') : "''";
  const predicate = generationFencePredicate(fence);
  const latch = prior
    ? db.prepare(`UPDATE bank_soal SET content_write_token=? WHERE id=? AND user_id=? AND client_document_id=? AND revision=? AND content_hash=? AND content=?
        AND ${predicate.sql}
        AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql}))=?
        AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql})),0)<=4194304
        AND (SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id IN (${idsSql}))=?
        AND NOT EXISTS(SELECT 1 FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id NOT IN (${idsSql}))`)
      .bind(writeToken, prior.id, ownerId, clientDocumentId, prior.revision, contentHash, content, ...predicate.bindings,
        ownerId, ...assetIds, assetIds.length, ownerId, ...assetIds, prior.id, ...assetIds, assetIds.length, prior.id, ...assetIds)
    : db.prepare(`INSERT INTO bank_soal(user_id,user_nama,sekolah,mata_pelajaran,topik,jenjang_kelas,semester,jenis_ujian,capaian_pembelajaran,
        jumlah_pg,jumlah_isian,jumlah_uraian,isian_type,hots_ratio,content,ai_provider,is_public,moderation_status,legacy_compat,is_hidden,content_hash,client_document_id,content_write_token)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      WHERE ${predicate.sql}
        AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql}))=?
        AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql})),0)<=4194304`)
      .bind(ownerId, metadata.user_nama, metadata.sekolah || '', metadata.mata_pelajaran, metadata.topik, metadata.jenjang_kelas, metadata.semester || null,
        metadata.jenis_ujian || null, metadata.capaian_pembelajaran || null, metadata.jumlah_pg || 0, metadata.jumlah_isian || 0, metadata.jumlah_uraian || 0,
        metadata.isian_type || 'Standard', metadata.hots_ratio || '30:40:30', content, metadata.ai_provider || null, 0, 'private', 0, 0,
        contentHash, clientDocumentId, writeToken, ...predicate.bindings, ownerId, ...assetIds, assetIds.length, ownerId, ...assetIds);
  const statements: D1PreparedStatement[] = [latch];
  if (!prior) {
    statements.push(...assetIds.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT bs.id,a.id FROM bank_soal bs JOIN assessment_image_assets a ON a.id=? AND a.owner_id=?
      WHERE bs.user_id=? AND bs.client_document_id=? AND bs.content_write_token=?`).bind(assetId, ownerId, ownerId, clientDocumentId, writeToken)));
  }
  statements.push(...fencedCompletionStatements(db, fence, writeToken));
  let results: any[];
  try { results = await db.batch(statements) as any[]; }
  catch (error) {
    const completed = await readCompletedFencedWinner(db, fence, contentHash, content);
    if (completed) return completed;
    const conflicting: any = await db.prepare('SELECT id FROM bank_soal WHERE user_id=? AND client_document_id=?').bind(ownerId, clientDocumentId).first();
    if (conflicting) throw new AssessmentPackageWriteError('generation_fenced_conflict');
    throw error;
  }
  const selected = results[results.length - 1]?.results?.[0] as any;
  if (!selected) throw new AssessmentPackageWriteError('generation_fenced_conflict');
  const normalized = normalizeAssetUrls(JSON.parse(selected.content), selected.id);
  return { packageId: Number(selected.id), revision: Number(selected.revision), saveStatus: 'saved', contentHash: selected.content_hash,
    content: normalized.content, visibility: { is_public: selected.is_public, moderation_status: selected.moderation_status, legacy_compat: selected.legacy_compat, is_hidden: selected.is_hidden } };
}

export async function createOwnedAssessmentPackage(
  db: D1Database,
  input: { ownerId: number; clientDocumentId?: string | null; content: unknown; metadata: AssessmentPackageMetadata; generationFence?: AssessmentGenerationFence },
): Promise<{ packageId: number; revision: number; saveStatus: 'saved'; contentHash: string; content: any; visibility: { is_public: number; moderation_status: string; legacy_compat: number; is_hidden: number } }> {
  const { ownerId, clientDocumentId, metadata } = input;
  if (input.generationFence) assertGenerationFenceIdentity(ownerId, clientDocumentId, input.generationFence);
  if (clientDocumentId != null && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientDocumentId)) throw new AssessmentPackageWriteError('invalid_content');
  const { content, json: contentJson } = preparePackageContent(input.content);
  const assetIds = findAssetIds(contentJson);
  await validateOwnedAssets(db, ownerId, assetIds);
  const contentHash = await hashContent(contentJson);
  if (input.generationFence) {
    const completed = await readCompletedFencedWinner(db, input.generationFence, contentHash, contentJson);
    if (completed) return completed;
    return createFencedAssessmentPackage(db, { ownerId, clientDocumentId: clientDocumentId!, content: contentJson, contentHash, metadata, assetIds, fence: input.generationFence });
  }
  if (clientDocumentId) {
    const prior: any = await db.prepare('SELECT id,revision,content_hash,is_public,moderation_status,legacy_compat,is_hidden FROM bank_soal WHERE user_id=? AND client_document_id=?').bind(ownerId, clientDocumentId).first();
    if (prior) {
      if (prior.content_hash !== contentHash) throw new AssessmentPackageWriteError('document_id_conflict');
      return { packageId: Number(prior.id), revision: Number(prior.revision), saveStatus: 'saved', contentHash, content: JSON.parse(contentJson), visibility: { is_public: prior.is_public, moderation_status: prior.moderation_status, legacy_compat: prior.legacy_compat, is_hidden: prior.is_hidden } };
    }
  }

  const token = crypto.randomUUID();
  const ids = assetIds;
  const insert = db.prepare(`INSERT INTO bank_soal (
      user_id,user_nama,sekolah,mata_pelajaran,topik,jenjang_kelas,semester,jenis_ujian,capaian_pembelajaran,
      jumlah_pg,jumlah_isian,jumlah_uraian,isian_type,hots_ratio,content,ai_provider,is_public,moderation_status,
      legacy_compat,is_hidden,content_hash,client_document_id,content_write_token
    ) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    WHERE (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${ids.length ? ids.map(() => '?').join(',') : "''"}))=?
      AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${ids.length ? ids.map(() => '?').join(',') : "''"})),0)<=4194304`)
    .bind(ownerId, metadata.user_nama, metadata.sekolah || '', metadata.mata_pelajaran, metadata.topik, metadata.jenjang_kelas,
      metadata.semester || null, metadata.jenis_ujian || null, metadata.capaian_pembelajaran || null,
      metadata.jumlah_pg || 0, metadata.jumlah_isian || 0, metadata.jumlah_uraian || 0,
      metadata.isian_type || 'Standard', metadata.hots_ratio || '30:40:30', contentJson, metadata.ai_provider || null,
      0, 'private', 0, 0, contentHash, clientDocumentId || null, token, ownerId, ...ids, ids.length, ownerId, ...ids);
  const statements: D1PreparedStatement[] = [
    insert,
    db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision)
      SELECT ?,id,revision FROM bank_soal WHERE content_write_token=? AND user_id=?`).bind(token, token, ownerId),
    ...ids.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT bs.id,a.id FROM bank_soal bs JOIN assessment_image_assets a ON a.id=? AND a.owner_id=?
      WHERE bs.content_write_token=? AND bs.user_id=?`).bind(assetId, ownerId, token, ownerId)),
  ];
  try { await db.batch(statements); }
  catch (error) {
    if (!clientDocumentId) throw error;
    const winner: any = await db.prepare('SELECT id,revision,content_hash,is_public,moderation_status,legacy_compat,is_hidden FROM bank_soal WHERE user_id=? AND client_document_id=?').bind(ownerId, clientDocumentId).first();
    if (!winner) throw error;
    if (winner.content_hash !== contentHash) throw new AssessmentPackageWriteError('document_id_conflict');
    return { packageId: Number(winner.id), revision: Number(winner.revision), saveStatus: 'saved', contentHash, content: JSON.parse(contentJson), visibility: { is_public: winner.is_public, moderation_status: winner.moderation_status, legacy_compat: winner.legacy_compat, is_hidden: winner.is_hidden } };
  }
  const row: any = await db.prepare('SELECT id,revision FROM bank_soal WHERE user_id=? AND content_write_token=?').bind(ownerId, token).first();
  if (!row) {
    await validateOwnedAssets(db, ownerId, ids);
    throw new AssessmentPackageWriteError('creation_failed');
  }
  return { packageId: Number(row.id), revision: Number(row.revision), saveStatus: 'saved', contentHash, content: JSON.parse(contentJson), visibility: { is_public: 0, moderation_status: 'private', legacy_compat: 0, is_hidden: 0 } };
}

export function normalizeAssetUrls(content: any, packageId: number | string) {
  const clone = JSON.parse(JSON.stringify(content));
  const warnings: string[] = [];
  for (const [index, item] of questionItems(clone).entries()) {
    let warning: string | null = null;
    try { warning = prepareQuestionImage(item); }
    catch {
      const image = imageRecord(item.gambar);
      item.gambar = { ...(image ? safeImageMetadata(image) : {}), imageUnavailable: true, imageUnavailableReason: 'untrusted_svg' };
      delete item.visual_stimulus;
      warning = `Butir ${item.no ?? index + 1}: SVG tidak aman atau tidak valid.`;
    }
    if (typeof item.gambar?.assetId === 'string') item.gambar.url = `/api/banksoal/${packageId}/assets/${encodeURIComponent(item.gambar.assetId)}`;
    if (warning) warnings.push(warning);
    if (item.gambar?.imageUnavailable === true && !warnings.some(w => w.startsWith(`Butir ${item.no ?? index + 1}:`))) warnings.push(`Butir ${item.no ?? index + 1}: gambar belum tersimpan sebagai aset paket.`);
  }
  return { content: clone, warnings };
}
