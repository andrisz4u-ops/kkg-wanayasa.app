import { ASSESSMENT_ASSET_OWNER_MAX_BYTES, ASSESSMENT_ASSET_OWNER_MAX_COUNT, prepareAssessmentAsset } from './assessment-assets';
import { assessmentSvgDataUri, decodeAssessmentSvgDataUri, sanitizeAssessmentSvg, UnsafeAssessmentSvgError } from './assessment-package-svg';
import { generateVisualStimulus } from './visual-engine';
import { validatedAssessmentVisualSpec } from './assessment-visual-spec';
import { generationFencePredicate, type AssessmentGenerationFence } from './assessment-generation-requests';
import { buildStagedAssessmentAssetInsert, readOwnedAssessmentAssetMetadata, resolveAssessmentAssetMetadata } from './assessment-assets';
import type { AssessmentAssetStage, StagedAssessmentAsset } from './assessment-assets';

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
  constructor(readonly code: 'content_too_large' | 'invalid_content' | 'invalid_image_reference' | 'too_many_assets' | 'package_assets_too_large' | 'asset_not_owned' | 'document_id_conflict' | 'creation_failed' | 'stale_revision' | 'package_missing' | 'forbidden' | 'source_unavailable' | 'quota_count' | 'quota_bytes' | 'identity_conflict' | 'untrusted_svg' | 'image_recovery_limit' | 'generation_fenced_conflict') {
    super(code);
  }
}
export class AssessmentPackageSettlementUnknownError extends Error {
  constructor() { super('assessment_package_settlement_unknown'); }
}
export class AssessmentPackageSettlementRolledBackError extends Error {
  constructor() { super('assessment_package_settlement_rolled_back'); }
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
const FAILURE_REASONS = new Set(['invalid_url', 'untrusted_host', 'fetch_failed', 'fetch_timeout', 'fetch_redirect', 'fetch_status', 'body_read_failed', 'persistence_failed', 'storage_hash_failed', 'storage_read_failed', 'storage_write_failed', 'expired_or_missing', 'invalid_image', 'too_large', 'identity_conflict', 'quota_count', 'quota_bytes', 'invalid_storage', 'asset_not_owned_or_missing', 'required_image_missing', 'image_unavailable', 'image_search_unavailable', 'duplicate_image_rejected', 'duplicate_visual_rejected', 'required_diagram_missing', 'image_not_selected', 'image_generation_disabled', 'untrusted_svg']);

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
  const visualSpec = validatedAssessmentVisualSpec(item.visual_stimulus);
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
  const requiresStimulus = item.imageRequired === true || /(?:perhatikan|amatilah|lihat|berdasarkan)\s+(?:gambar|foto|diagram)|(?:perhatikan|amatilah)\s+ilustrasi\s+(?:berikut|di\s+bawah)|look\s+at\s+the\s+(?:picture|image|diagram)/i.test(String(item.soal || ''));
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

async function validatePackageAssetSet(db: D1Database, ownerId: number, ids: string[], stage?: AssessmentAssetStage) {
  if (ids.length > PACKAGE_MAX_ASSETS) throw new AssessmentPackageWriteError('too_many_assets');
  let total = 0;
  for (const id of ids) {
    const staged = stage?.get(id);
    if (staged) {
      const collision: any = await db.prepare('SELECT owner_id,mime,byte_length,sha256 FROM assessment_image_assets WHERE id=?').bind(id).first();
      if (collision && (Number(collision.owner_id) !== ownerId || collision.mime !== staged.mime || Number(collision.byte_length) !== staged.byteLength || collision.sha256 !== staged.sha256)) {
        throw new AssessmentPackageWriteError('identity_conflict');
      }
    }
    const metadata = staged
      ? await resolveAssessmentAssetMetadata(db, ownerId, id, stage!)
      : await readOwnedAssessmentAssetMetadata(db, ownerId, id);
    if (!metadata) throw new AssessmentPackageWriteError('asset_not_owned');
    if (staged && (staged.ownerId !== ownerId || staged.id !== id || staged.byteLength !== metadata.byteLength || staged.mime !== metadata.mime || staged.sha256 !== metadata.sha256)) throw new AssessmentPackageWriteError('asset_not_owned');
    total += metadata.byteLength;
  }
  for (const [id, asset] of stage || []) if (!ids.includes(id) || asset.ownerId !== ownerId) throw new AssessmentPackageWriteError('invalid_image_reference');
  if (total > PACKAGE_MAX_ASSET_BYTES) throw new AssessmentPackageWriteError('package_assets_too_large');
}

function stagedInsertStatements(db: D1Database, ownerId: number, ids: string[], stage?: AssessmentAssetStage) {
  return [...(stage || [])].filter(([id]) => ids.includes(id)).map(([, asset]) => {
    if (asset.ownerId !== ownerId) throw new AssessmentPackageWriteError('asset_not_owned');
    return buildStagedAssessmentAssetInsert(db, asset);
  });
}

function stagedIdentityGuard(ids: string[], stage: AssessmentAssetStage | undefined, ownerId: number) {
  const assets = [...(stage || [])].filter(([id]) => ids.includes(id)).map(([, asset]) => asset);
  return {
    sql: assets.map(() => 'EXISTS(SELECT 1 FROM assessment_image_assets WHERE id=? AND owner_id=? AND mime=? AND byte_length=? AND sha256=?)').join(' AND ') || '1=1',
    bindings: assets.flatMap(asset => [asset.id, ownerId, asset.mime, asset.byteLength, asset.sha256]),
  };
}

async function classifyStagedQuotaOrIdentity(db: D1Database, ownerId: number, stage?: AssessmentAssetStage) {
  const assets = [...(stage || []).values()];
  if (!assets.length) return;
  for (const asset of assets) {
    const row: any = await db.prepare('SELECT owner_id,mime,byte_length,sha256 FROM assessment_image_assets WHERE id=?').bind(asset.id).first();
    if (row && (Number(row.owner_id) !== ownerId || row.mime !== asset.mime || Number(row.byte_length) !== asset.byteLength || row.sha256 !== asset.sha256)) throw new AssessmentPackageWriteError('identity_conflict');
    // An exactly matching pre-existing row may be the durable result of an
    // uncertain prior attempt. It is not a quota delta and cannot alone prove
    // either success or conflict; callers must reconcile a receipt or stay unknown.
    if (row) throw new AssessmentPackageSettlementUnknownError();
  }
  const quota: any = await db.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(byte_length),0) AS bytes FROM assessment_image_assets WHERE owner_id=?').bind(ownerId).first();
  if (Number(quota?.count) + assets.length > ASSESSMENT_ASSET_OWNER_MAX_COUNT) throw new AssessmentPackageWriteError('quota_count');
  if (Number(quota?.bytes) + assets.reduce((sum, asset) => sum + asset.byteLength, 0) > ASSESSMENT_ASSET_OWNER_MAX_BYTES) throw new AssessmentPackageWriteError('quota_bytes');
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
  input: { ownerId: number; packageId: number | string; baseRevision: number; content: unknown; stagedAssets?: AssessmentAssetStage },
): Promise<{ packageId: number; revision: number; saveStatus: 'saved'; content: any; imageWarnings: string[] }> {
  if (!Number.isSafeInteger(input.baseRevision) || input.baseRevision < 1) throw new AssessmentPackageWriteError('invalid_content');
  const { content, json } = preparePackageContent(input.content);
  const ids = findAssetIds(json);
  await validatePackageAssetSet(db, input.ownerId, ids, input.stagedAssets);
  const hash = await hashContent(json), token = crypto.randomUUID(), nextRevision = input.baseRevision + 1;
  const idList = ids.length ? ids.map(() => '?').join(',') : "''";
  const stageGuard = stagedIdentityGuard(ids, input.stagedAssets, input.ownerId);
  const statements: D1PreparedStatement[] = [
    ...stagedInsertStatements(db, input.ownerId, ids, input.stagedAssets),
    db.prepare(`UPDATE bank_soal SET content=?,content_hash=?,content_write_token=?,revision=revision+1,
        legacy_compat=0,moderation_status=CASE WHEN is_public=1 THEN 'pending' ELSE 'private' END,is_hidden=0,
        moderation_actor_id=NULL,moderation_at=NULL,moderation_event_id=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND user_id=? AND revision=?
        AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idList}))=?
        AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idList})),0)<=4194304
        AND ${stageGuard.sql}`)
      .bind(json, hash, token, input.packageId, input.ownerId, input.baseRevision, input.ownerId, ...ids, ids.length, input.ownerId, ...ids, ...stageGuard.bindings),
    db.prepare(`DELETE FROM bank_soal_assets WHERE bank_soal_id=? AND EXISTS(SELECT 1 FROM bank_soal WHERE id=? AND user_id=? AND revision=? AND content_write_token=?)`)
      .bind(input.packageId, input.packageId, input.ownerId, nextRevision, token),
    ...ids.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT ?,a.id FROM assessment_image_assets a JOIN bank_soal bs ON bs.id=? AND bs.user_id=? AND bs.revision=? AND bs.content_write_token=?
       WHERE a.id=? AND a.owner_id=?`).bind(input.packageId, input.packageId, input.ownerId, nextRevision, token, assetId, input.ownerId)),
  ];
  statements.push(db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision)
    SELECT ?, (SELECT id FROM bank_soal WHERE id=? AND user_id=? AND revision=? AND content_write_token=? AND
      (SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id IN (${idList}))=? AND
      NOT EXISTS(SELECT 1 FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id NOT IN (${idList}))),
      COALESCE((SELECT revision FROM bank_soal WHERE id=? AND user_id=? AND revision=? AND content_write_token=?),1)`)
    .bind(token, input.packageId, input.ownerId, nextRevision, token, input.packageId, ...ids, ids.length, input.packageId, ...ids, input.packageId, input.ownerId, nextRevision, token));
  let result: any[];
  try { result = await db.batch(statements) as any[]; }
  catch (error) {
    const winner: any = await db.prepare('SELECT id,revision,content,content_hash FROM bank_soal WHERE id=? AND user_id=? AND content_write_token=?').bind(input.packageId, input.ownerId, token).first();
    if (winner && winner.content === json && winner.content_hash === hash) return { packageId: Number(winner.id), revision: Number(winner.revision), saveStatus: 'saved', content: normalizeAssetUrls(JSON.parse(winner.content), winner.id).content, imageWarnings: [] };
    if (/NOT NULL constraint failed: bank_soal_write_tokens\.bank_soal_id/i.test(String((error as Error)?.message))) {
      const current: any = await db.prepare('SELECT user_id,revision FROM bank_soal WHERE id=?').bind(input.packageId).first();
    if (!current) throw new AssessmentPackageWriteError('package_missing');
      if (Number(current.user_id) !== input.ownerId) throw new AssessmentPackageWriteError('forbidden');
      if (Number(current.revision) !== input.baseRevision) throw new AssessmentPackageWriteError('stale_revision');
      await classifyStagedQuotaOrIdentity(db, input.ownerId, input.stagedAssets);
    }
    throw error;
  }
  const updateResult = result[stagedInsertStatements(db, input.ownerId, ids, input.stagedAssets).length];
  if (!updateResult?.meta?.changes) {
    const row: any = await db.prepare('SELECT user_id,revision FROM bank_soal WHERE id=?').bind(input.packageId).first();
    if (!row) throw new AssessmentPackageWriteError('package_missing');
    if (Number(row.user_id) !== input.ownerId) throw new AssessmentPackageWriteError('forbidden');
    if (Number(row.revision) !== input.baseRevision) throw new AssessmentPackageWriteError('stale_revision');
    await classifyStagedQuotaOrIdentity(db, input.ownerId, input.stagedAssets);
    await validatePackageAssetSet(db, input.ownerId, ids, input.stagedAssets);
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
  // Freeze the complete source association set before touching any BLOB. The same
  // exact set is checked again by the conditional package insert below.
  const sourceAssociationRows: any[] = (await db.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=? ORDER BY asset_id').bind(sourcePackageId).all()).results as any[];
  const sourceAssociationIds = sourceAssociationRows.map(row => String(row.asset_id));
  const referenceSet = new Set(references);
  const expectedSourceIds = sourceAssociationIds.filter(id => referenceSet.has(id));
  const metadataRows: any[] = expectedSourceIds.length
    ? (await db.prepare(`SELECT a.id,a.owner_id,a.mime,a.byte_length,a.sha256 FROM bank_soal_assets ba
        JOIN assessment_image_assets a ON a.id=ba.asset_id WHERE ba.bank_soal_id=? AND a.owner_id=? AND a.id IN (${expectedSourceIds.map(() => '?').join(',')})`)
        .bind(sourcePackageId, source.user_id, ...expectedSourceIds).all()).results as any[]
    : [];
  const metadataById = new Map<string, any>(metadataRows.map(row => [String(row.id), row]));
  const metadataBytes = metadataRows.reduce((sum, row) => sum + Number(row.byte_length), 0);
  if (metadataRows.length > PACKAGE_MAX_ASSETS || metadataBytes > PACKAGE_MAX_ASSET_BYTES) throw new AssessmentPackageWriteError('package_assets_too_large');
  // Do not issue a BLOB query until unique reference count and authoritative byte
  // lengths have passed the package budget.
  const blobRows: any[] = expectedSourceIds.length
    ? (await db.prepare(`SELECT a.id,a.owner_id,a.mime,a.byte_length,a.sha256,a.bytes FROM bank_soal_assets ba
        JOIN assessment_image_assets a ON a.id=ba.asset_id WHERE ba.bank_soal_id=? AND a.owner_id=? AND a.id IN (${expectedSourceIds.map(() => '?').join(',')})`)
        .bind(sourcePackageId, source.user_id, ...expectedSourceIds).all()).results as any[]
    : [];
  const blobsById = new Map<string, any>(blobRows.map(row => [String(row.id), row]));
  if (blobRows.length !== metadataRows.length) throw new AssessmentPackageWriteError('source_unavailable');
  const cloneBySource = new Map<string, string>();
  const clones: StagedAssessmentAsset[] = [];
  const warnings: string[] = [];
  for (const sourceId of references) {
    const metadata = metadataById.get(sourceId);
    if (!metadata) continue;
    const row = blobsById.get(sourceId);
    if (!row) throw new AssessmentPackageWriteError('source_unavailable');
    if (Number(row.owner_id) !== Number(metadata.owner_id) || row.mime !== metadata.mime || Number(row.byte_length) !== Number(metadata.byte_length) || row.sha256 !== metadata.sha256) throw new AssessmentPackageWriteError('source_unavailable');
    const raw = row.bytes;
    let bytes: Uint8Array;
    if (raw instanceof ArrayBuffer) bytes = new Uint8Array(raw.slice(0));
    else if (ArrayBuffer.isView(raw)) bytes = Uint8Array.from(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength));
    else if (Array.isArray(raw) && raw.every((value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 255)) bytes = Uint8Array.from(raw);
    else throw new AssessmentPackageWriteError('invalid_content');
    if (bytes.length !== Number(row.byte_length)) throw new AssessmentPackageWriteError('invalid_content');
    const clone = await prepareAssessmentAsset(ownerId, bytes, row.mime);
    cloneBySource.set(sourceId, clone.id);
    clones.push(clone);
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
  const bytesTotal = clones.reduce((sum, asset) => sum + asset.byteLength, 0);
  if (bytesTotal > PACKAGE_MAX_ASSET_BYTES) throw new AssessmentPackageWriteError('package_assets_too_large');
  const sourceHash = await hashContent(String(source.content));
  const destHash = await hashContent(prepared.json);
  const token = crypto.randomUUID();
  const sourceGuard = `EXISTS(SELECT 1 FROM bank_soal bs WHERE bs.id=? AND bs.revision=? AND bs.content=? AND ${access}
    AND (SELECT COUNT(*) FROM bank_soal_assets ba JOIN assessment_image_assets a ON a.id=ba.asset_id WHERE ba.bank_soal_id=bs.id AND a.owner_id=bs.user_id)=?)`;
  const attachedIds = sourceAssociationIds;
  const attachedList = attachedIds.length ? attachedIds.map(() => '?').join(',') : "''";
  const attachedGuard = `(SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id IN (${attachedList}))=? AND NOT EXISTS(SELECT 1 FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id NOT IN (${attachedList}))`;
  const stage = new Map(clones.map(asset => [asset.id, asset]));
  const stagedGuardSql = [...stage.values()].map(() => 'EXISTS(SELECT 1 FROM assessment_image_assets WHERE id=? AND owner_id=? AND mime=? AND byte_length=? AND sha256=?)').join(' AND ') || '1=1';
  const stagedGuardBindings = [...stage.values()].flatMap(asset => [asset.id, ownerId, asset.mime, asset.byteLength, asset.sha256]);
  const metadata = source;
  const insertPackage = db.prepare(`INSERT INTO bank_soal(user_id,user_nama,sekolah,mata_pelajaran,topik,jenjang_kelas,semester,jenis_ujian,capaian_pembelajaran,
      jumlah_pg,jumlah_isian,jumlah_uraian,isian_type,hots_ratio,content,ai_provider,is_public,moderation_status,legacy_compat,is_hidden,content_hash,client_document_id,content_write_token,
      copy_source_id,copy_source_revision,copy_source_hash)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      WHERE ${sourceGuard} AND ${attachedGuard}
      AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${destinationIds.length ? destinationIds.map(() => '?').join(',') : "''"}))=?
      AND ${stagedGuardSql}`)
    .bind(ownerId, input.ownerName, input.ownerSchool || '', metadata.mata_pelajaran, metadata.topik, metadata.jenjang_kelas, metadata.semester, metadata.jenis_ujian,
      metadata.capaian_pembelajaran, metadata.jumlah_pg, metadata.jumlah_isian, metadata.jumlah_uraian, metadata.isian_type, metadata.hots_ratio,
      prepared.json, metadata.ai_provider, 0, 'private', 0, 0, destHash, clientDocumentId || null, token, sourcePackageId, source.revision, sourceHash,
      sourcePackageId, source.revision, source.content, ownerId, sourceAssociationIds.length, sourcePackageId, ...attachedIds, attachedIds.length, sourcePackageId, ...attachedIds,
      ownerId, ...destinationIds, destinationIds.length, ...stagedGuardBindings);
  const statements: D1PreparedStatement[] = [];
  statements.push(...stagedInsertStatements(db, ownerId, destinationIds, stage));
  statements.push(insertPackage,
    ...destinationIds.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT bs.id,a.id FROM bank_soal bs JOIN assessment_image_assets a ON a.id=? AND a.owner_id=? WHERE bs.content_write_token=? AND bs.user_id=?`)
      .bind(assetId, ownerId, token, ownerId)));
  const idList = destinationIds.length ? destinationIds.map(() => '?').join(',') : "''";
  statements.push(db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision)
    SELECT ?, (SELECT bs.id FROM bank_soal bs WHERE bs.user_id=? AND bs.content_write_token=? AND bs.copy_source_id=? AND bs.copy_source_revision=? AND bs.copy_source_hash=?
      AND (SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=bs.id AND asset_id IN (${idList}))=?
      AND NOT EXISTS(SELECT 1 FROM bank_soal_assets WHERE bank_soal_id=bs.id AND asset_id NOT IN (${idList}))),
      COALESCE((SELECT revision FROM bank_soal WHERE user_id=? AND content_write_token=?),1)`)
    .bind(token, ownerId, token, sourcePackageId, source.revision, sourceHash, ...destinationIds, destinationIds.length, ...destinationIds, ownerId, token));
  try { await db.batch(statements); }
  catch (error) {
    const winner: any = clientDocumentId ? await db.prepare(`SELECT bs.id,bs.revision,bs.copy_source_id,bs.copy_source_revision,bs.copy_source_hash,bs.content FROM bank_soal bs JOIN bank_soal_write_tokens w ON w.bank_soal_id=bs.id AND w.token=bs.content_write_token WHERE bs.user_id=? AND bs.client_document_id=?`).bind(ownerId, clientDocumentId).first() : null;
    if (!winner) {
      if (/NOT NULL constraint failed: bank_soal_write_tokens\.bank_soal_id/i.test(String((error as Error)?.message))) {
        const stillVisible: any = await db.prepare(`SELECT 1 FROM bank_soal bs WHERE bs.id=? AND ${access}`).bind(sourcePackageId, ownerId).first();
        if (!stillVisible) throw new AssessmentPackageWriteError('source_unavailable');
        const currentSourceAssociations: any[] = (await db.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=? ORDER BY asset_id').bind(sourcePackageId).all()).results as any[];
        if (currentSourceAssociations.length !== sourceAssociationIds.length || currentSourceAssociations.some((row, i) => String(row.asset_id) !== sourceAssociationIds[i])) throw new AssessmentPackageWriteError('source_unavailable');
        const quota: any = await db.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(byte_length),0) AS bytes FROM assessment_image_assets WHERE owner_id=?').bind(ownerId).first();
        if (Number(quota?.count) + clones.length > ASSESSMENT_ASSET_OWNER_MAX_COUNT) throw new AssessmentPackageWriteError('quota_count');
        if (Number(quota?.bytes) + bytesTotal > ASSESSMENT_ASSET_OWNER_MAX_BYTES) throw new AssessmentPackageWriteError('quota_bytes');
        if (clientDocumentId) {
          const collision: any = await db.prepare('SELECT 1 FROM bank_soal WHERE user_id=? AND client_document_id=?').bind(ownerId, clientDocumentId).first();
          if (collision) throw new AssessmentPackageWriteError('document_id_conflict');
        }
      }
      throw error;
    }
    if (String(winner.copy_source_id) !== String(sourcePackageId) || Number(winner.copy_source_revision) !== Number(source.revision) || winner.copy_source_hash !== sourceHash) throw new AssessmentPackageWriteError('document_id_conflict');
    const normalized = normalizeAssetUrls(JSON.parse(winner.content), winner.id);
    return { packageId: Number(winner.id), revision: Number(winner.revision), saveStatus: 'saved', content: normalized.content, imageWarnings: [...warnings, ...normalized.warnings] };
  }
  const row: any = await db.prepare('SELECT bs.id,bs.revision,bs.content FROM bank_soal bs JOIN bank_soal_write_tokens w ON w.bank_soal_id=bs.id AND w.token=bs.content_write_token WHERE bs.user_id=? AND bs.content_write_token=?').bind(ownerId, token).first();
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

function fencedCompletionStatements(db: D1Database, fence: AssessmentGenerationFence, writeToken: string, assetIds: string[]) {
  const selectPackage = `SELECT id FROM bank_soal WHERE user_id=? AND client_document_id=? AND content_write_token=?`;
  const assetList = assetIds.length ? assetIds.map(() => '?').join(',') : "''";
  const complete = db.prepare(`UPDATE assessment_generation_requests SET state='completed',package_id=(${selectPackage}),result_json='null',failure_code=NULL,updated_at=CAST(strftime('%s','now') AS INTEGER)
    WHERE owner_id=? AND client_document_id=? AND run_token=? AND state='running'
      AND EXISTS(${selectPackage})`)
    .bind(fence.ownerId, fence.clientDocumentId, writeToken, fence.ownerId, fence.clientDocumentId, fence.runToken, fence.ownerId, fence.clientDocumentId, writeToken);
  // The latch row is selected even when settlement fails; NULL then violates the
  // receipt's NOT NULL bank_soal_id constraint and atomically rolls the batch back.
  const receipt = db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision)
    SELECT ?, (SELECT bs.id FROM bank_soal bs JOIN assessment_generation_requests agr
      ON agr.owner_id=bs.user_id AND agr.client_document_id=bs.client_document_id AND agr.run_token=?
      WHERE bs.user_id=? AND bs.client_document_id=? AND bs.content_write_token=? AND agr.state='completed' AND agr.package_id=bs.id
        AND (SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=bs.id AND asset_id IN (${assetList}))=?
        AND NOT EXISTS(SELECT 1 FROM bank_soal_assets WHERE bank_soal_id=bs.id AND asset_id NOT IN (${assetList}))),
      COALESCE((SELECT revision FROM bank_soal WHERE user_id=? AND client_document_id=? AND content_write_token=?),1)`)
    .bind(writeToken, fence.runToken, fence.ownerId, fence.clientDocumentId, writeToken, ...assetIds, assetIds.length, ...assetIds, fence.ownerId, fence.clientDocumentId, writeToken);
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
  input: { ownerId: number; clientDocumentId: string; content: string; contentHash: string; metadata: AssessmentPackageMetadata; assetIds: string[]; fence: AssessmentGenerationFence; stagedAssets?: AssessmentAssetStage },
): Promise<{ packageId: number; revision: number; saveStatus: 'saved'; contentHash: string; content: any; visibility: { is_public: number; moderation_status: string; legacy_compat: number; is_hidden: number } }> {
  const { ownerId, clientDocumentId, content, contentHash, metadata, assetIds, fence, stagedAssets } = input;
  const prior: any = await db.prepare(`SELECT id,revision,content,content_hash,is_public,moderation_status,legacy_compat,is_hidden
    FROM bank_soal WHERE user_id=? AND client_document_id=?`).bind(ownerId, clientDocumentId).first();
  const writeToken = crypto.randomUUID();
  const idsSql = assetIds.length ? assetIds.map(() => '?').join(',') : "''";
  const stageGuard = stagedIdentityGuard(assetIds, stagedAssets, ownerId);
  const predicate = generationFencePredicate(fence);
  const latch = prior
    ? db.prepare(`UPDATE bank_soal SET content_write_token=? WHERE id=? AND user_id=? AND client_document_id=? AND revision=? AND content_hash=? AND content=?
        AND ${predicate.sql}
        AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql}))=?
        AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql})),0)<=4194304
        AND (SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id IN (${idsSql}))=?
        AND NOT EXISTS(SELECT 1 FROM bank_soal_assets WHERE bank_soal_id=? AND asset_id NOT IN (${idsSql}))
        AND ${stageGuard.sql}`)
      .bind(writeToken, prior.id, ownerId, clientDocumentId, prior.revision, contentHash, content, ...predicate.bindings,
         ownerId, ...assetIds, assetIds.length, ownerId, ...assetIds, prior.id, ...assetIds, assetIds.length, prior.id, ...assetIds, ...stageGuard.bindings)
    : db.prepare(`INSERT INTO bank_soal(user_id,user_nama,sekolah,mata_pelajaran,topik,jenjang_kelas,semester,jenis_ujian,capaian_pembelajaran,
        jumlah_pg,jumlah_isian,jumlah_uraian,isian_type,hots_ratio,content,ai_provider,is_public,moderation_status,legacy_compat,is_hidden,content_hash,client_document_id,content_write_token)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      WHERE ${predicate.sql}
        AND (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql}))=?
         AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${idsSql})),0)<=4194304
         AND ${stageGuard.sql}`)
      .bind(ownerId, metadata.user_nama, metadata.sekolah || '', metadata.mata_pelajaran, metadata.topik, metadata.jenjang_kelas, metadata.semester || null,
        metadata.jenis_ujian || null, metadata.capaian_pembelajaran || null, metadata.jumlah_pg || 0, metadata.jumlah_isian || 0, metadata.jumlah_uraian || 0,
        metadata.isian_type || 'Standard', metadata.hots_ratio || '30:40:30', content, metadata.ai_provider || null, 0, 'private', 0, 0,
         contentHash, clientDocumentId, writeToken, ...predicate.bindings, ownerId, ...assetIds, assetIds.length, ownerId, ...assetIds, ...stageGuard.bindings);
  const statements: D1PreparedStatement[] = [...stagedInsertStatements(db, ownerId, assetIds, stagedAssets), latch];
  if (!prior) {
    statements.push(...assetIds.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT bs.id,a.id FROM bank_soal bs JOIN assessment_image_assets a ON a.id=? AND a.owner_id=?
      WHERE bs.user_id=? AND bs.client_document_id=? AND bs.content_write_token=?`).bind(assetId, ownerId, ownerId, clientDocumentId, writeToken)));
  }
  statements.push(...fencedCompletionStatements(db, fence, writeToken, assetIds));
  let results: any[];
  try { results = await db.batch(statements) as any[]; }
  catch (error) {
    let completed: Awaited<ReturnType<typeof readCompletedFencedWinner>>;
    try { completed = await readCompletedFencedWinner(db, fence, contentHash, content); }
    catch { throw new AssessmentPackageSettlementUnknownError(); }
    if (completed) return completed;
    let ledger: any, current: any;
    try {
      ledger = await db.prepare('SELECT state,run_token FROM assessment_generation_requests WHERE owner_id=? AND client_document_id=?').bind(ownerId, clientDocumentId).first();
      current = await db.prepare('SELECT id,revision,content_hash,content FROM bank_soal WHERE user_id=? AND client_document_id=?').bind(ownerId, clientDocumentId).first();
    }
    catch { throw new AssessmentPackageSettlementUnknownError(); }
    if (!ledger || ledger.state !== 'running' || ledger.run_token !== fence.runToken) throw new AssessmentPackageWriteError('generation_fenced_conflict');
    if (prior && (!current || Number(current.id) !== Number(prior.id) || Number(current.revision) !== Number(prior.revision) || current.content_hash !== prior.content_hash || current.content !== prior.content)) throw new AssessmentPackageWriteError('generation_fenced_conflict');
    if (!prior && current) throw new AssessmentPackageWriteError('generation_fenced_conflict');
    if (prior) {
      let assoc: any[];
      try { assoc = (await db.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=? ORDER BY asset_id').bind(prior.id).all()).results as any[]; }
      catch { throw new AssessmentPackageSettlementUnknownError(); }
      const actual = assoc.map(row => String(row.asset_id));
      const expected = [...assetIds].sort();
      if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) throw new AssessmentPackageWriteError('generation_fenced_conflict');
    }
    if (fence.jobId !== undefined) {
      let job: any;
      try { job = await db.prepare('SELECT state,lease_until FROM ai_generation_jobs WHERE user_id=? AND job_id=?').bind(ownerId, fence.jobId).first(); }
      catch { throw new AssessmentPackageSettlementUnknownError(); }
      if (!job || job.state !== 'running' || Number(job.lease_until) < Math.floor(Date.now() / 1000)) throw new AssessmentPackageWriteError('generation_fenced_conflict');
    }
    await classifyStagedQuotaOrIdentity(db, ownerId, stagedAssets);
    const code = String((error as any)?.code || '');
    if (/^(ERR_SQLITE_ERROR|ERR_SQLITE_CONSTRAINT|SQLITE_CONSTRAINT)$/.test(code)) {
      if (stagedAssets?.size) {
        try {
          const ids = [...stagedAssets.keys()];
          const count: any = await db.prepare(`SELECT COUNT(*) AS n FROM assessment_image_assets WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).first();
          if (Number(count?.n) !== 0) throw new AssessmentPackageSettlementUnknownError();
        } catch (reconcileError) {
          if (reconcileError instanceof AssessmentPackageSettlementUnknownError) throw reconcileError;
          throw new AssessmentPackageSettlementUnknownError();
        }
      }
      throw new AssessmentPackageSettlementRolledBackError();
    }
    throw new AssessmentPackageSettlementUnknownError();
  }
  const selected = results[results.length - 1]?.results?.[0] as any;
  if (!selected) throw new AssessmentPackageWriteError('generation_fenced_conflict');
  const normalized = normalizeAssetUrls(JSON.parse(selected.content), selected.id);
  return { packageId: Number(selected.id), revision: Number(selected.revision), saveStatus: 'saved', contentHash: selected.content_hash,
    content: normalized.content, visibility: { is_public: selected.is_public, moderation_status: selected.moderation_status, legacy_compat: selected.legacy_compat, is_hidden: selected.is_hidden } };
}

export async function createOwnedAssessmentPackage(
  db: D1Database,
  input: { ownerId: number; clientDocumentId?: string | null; content: unknown; metadata: AssessmentPackageMetadata; generationFence?: AssessmentGenerationFence; stagedAssets?: AssessmentAssetStage },
): Promise<{ packageId: number; revision: number; saveStatus: 'saved'; contentHash: string; content: any; visibility: { is_public: number; moderation_status: string; legacy_compat: number; is_hidden: number } }> {
  const { ownerId, clientDocumentId, metadata } = input;
  if (input.generationFence) assertGenerationFenceIdentity(ownerId, clientDocumentId, input.generationFence);
  if (clientDocumentId != null && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientDocumentId)) throw new AssessmentPackageWriteError('invalid_content');
  const { content, json: contentJson } = preparePackageContent(input.content);
  const assetIds = findAssetIds(contentJson);
  await validatePackageAssetSet(db, ownerId, assetIds, input.stagedAssets);
  const contentHash = await hashContent(contentJson);
  if (input.generationFence) {
    const completed = await readCompletedFencedWinner(db, input.generationFence, contentHash, contentJson);
    if (completed) return completed;
    return createFencedAssessmentPackage(db, { ownerId, clientDocumentId: clientDocumentId!, content: contentJson, contentHash, metadata, assetIds, fence: input.generationFence, stagedAssets: input.stagedAssets });
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
  const stageGuard = stagedIdentityGuard(ids, input.stagedAssets, ownerId);
  const insert = db.prepare(`INSERT INTO bank_soal (
      user_id,user_nama,sekolah,mata_pelajaran,topik,jenjang_kelas,semester,jenis_ujian,capaian_pembelajaran,
      jumlah_pg,jumlah_isian,jumlah_uraian,isian_type,hots_ratio,content,ai_provider,is_public,moderation_status,
      legacy_compat,is_hidden,content_hash,client_document_id,content_write_token
    ) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      WHERE (SELECT COUNT(*) FROM assessment_image_assets WHERE owner_id=? AND id IN (${ids.length ? ids.map(() => '?').join(',') : "''"}))=?
      AND COALESCE((SELECT SUM(byte_length) FROM assessment_image_assets WHERE owner_id=? AND id IN (${ids.length ? ids.map(() => '?').join(',') : "''"})),0)<=4194304
      AND ${stageGuard.sql}`)
    .bind(ownerId, metadata.user_nama, metadata.sekolah || '', metadata.mata_pelajaran, metadata.topik, metadata.jenjang_kelas,
      metadata.semester || null, metadata.jenis_ujian || null, metadata.capaian_pembelajaran || null,
      metadata.jumlah_pg || 0, metadata.jumlah_isian || 0, metadata.jumlah_uraian || 0,
      metadata.isian_type || 'Standard', metadata.hots_ratio || '30:40:30', contentJson, metadata.ai_provider || null,
      0, 'private', 0, 0, contentHash, clientDocumentId || null, token, ownerId, ...ids, ids.length, ownerId, ...ids, ...stageGuard.bindings);
  const statements: D1PreparedStatement[] = [
    ...stagedInsertStatements(db, ownerId, ids, input.stagedAssets),
    insert,
    ...ids.map(assetId => db.prepare(`INSERT INTO bank_soal_assets(bank_soal_id,asset_id)
      SELECT bs.id,a.id FROM bank_soal bs JOIN assessment_image_assets a ON a.id=? AND a.owner_id=?
      WHERE bs.content_write_token=? AND bs.user_id=?`).bind(assetId, ownerId, token, ownerId)),
  ];
  const idList = ids.length ? ids.map(() => '?').join(',') : "''";
  statements.push(db.prepare(`INSERT INTO bank_soal_write_tokens(token,bank_soal_id,revision)
    SELECT ?, (SELECT bs.id FROM bank_soal bs WHERE bs.content_write_token=? AND bs.user_id=?
      AND (SELECT COUNT(*) FROM bank_soal_assets WHERE bank_soal_id=bs.id AND asset_id IN (${idList}))=?
      AND NOT EXISTS(SELECT 1 FROM bank_soal_assets WHERE bank_soal_id=bs.id AND asset_id NOT IN (${idList}))),
      COALESCE((SELECT revision FROM bank_soal WHERE content_write_token=? AND user_id=?),1)`)
    .bind(token, token, ownerId, ...ids, ids.length, ...ids, token, ownerId));
  try { await db.batch(statements); }
  catch (error) {
    const winner: any = clientDocumentId ? await db.prepare('SELECT id,revision,content_hash,is_public,moderation_status,legacy_compat,is_hidden FROM bank_soal WHERE user_id=? AND client_document_id=?').bind(ownerId, clientDocumentId).first() : null;
    if (!winner) {
      await classifyStagedQuotaOrIdentity(db, ownerId, input.stagedAssets);
      throw error;
    }
    if (winner.content_hash !== contentHash) throw new AssessmentPackageWriteError('document_id_conflict');
    return { packageId: Number(winner.id), revision: Number(winner.revision), saveStatus: 'saved', contentHash, content: JSON.parse(contentJson), visibility: { is_public: winner.is_public, moderation_status: winner.moderation_status, legacy_compat: winner.legacy_compat, is_hidden: winner.is_hidden } };
  }
  const row: any = await db.prepare('SELECT id,revision FROM bank_soal WHERE user_id=? AND content_write_token=?').bind(ownerId, token).first();
  if (!row) {
    await classifyStagedQuotaOrIdentity(db, ownerId, input.stagedAssets);
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
    // Presigned URLs cannot be recovered here. An independent renderer spec can
    // still rebuild the stimulus locally; preparation validates SVG aliases and
    // replaces the transient URL without losing that spec.
    const presignedUrl = typeof item.gambar?.assetId !== 'string' && typeof item.gambar?.url === 'string'
      && /[?&]x-amz-(?:expires|signature|credential)=/i.test(item.gambar.url);
    if (presignedUrl && !validatedAssessmentVisualSpec(item.visual_stimulus)) {
      item.gambar = { ...(safeImageMetadata(imageRecord(item.gambar) || {})), imageUnavailable: true, imageUnavailableReason: 'expired_or_missing' };
      delete item.visual_stimulus;
    }
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
