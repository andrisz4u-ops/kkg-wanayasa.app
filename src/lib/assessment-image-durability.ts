import { TrustedImageIngestError, fetchTrustedAssessmentImage, readOwnedAssessmentAssetMetadata } from './assessment-assets';
import type { AssessmentAssetMetadata, AssessmentAssetStage, StagedAssessmentAsset } from './assessment-assets';
import { questionItems } from './assessment-packages';
import { generateVisualStimulus } from './visual-engine';
import { getVisualCatalog } from './visuals/catalog';

export const ASSESSMENT_PACKAGE_IMAGE_MAX_REFERENCES = 8;
export const ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export type AssessmentImageWarning = { questionNo: number | string; reason: string };

const IMAGE_METADATA_FIELDS = ['alt', 'credit', 'title', 'description', 'caption'] as const;
const KNOWN_IMAGE_FAILURES = new Set([
  'invalid_url', 'untrusted_host', 'fetch_failed', 'fetch_timeout', 'fetch_redirect', 'fetch_status', 'body_read_failed', 'persistence_failed', 'storage_hash_failed', 'storage_read_failed', 'storage_write_failed', 'expired_or_missing', 'invalid_image', 'too_large',
  'identity_conflict', 'quota_count', 'quota_bytes', 'invalid_storage', 'asset_not_owned_or_missing',
  'package_image_count_limit', 'package_image_byte_limit', 'untrusted_svg', 'required_image_missing',
  'image_unavailable', 'image_search_unavailable', 'duplicate_image_rejected', 'duplicate_visual_rejected',
  'required_diagram_missing', 'image_not_selected', 'image_generation_disabled',
]);

function record(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value: unknown, maxLength = 240): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /(?:https?:|data:|blob:|javascript:|www\.|\/\/|<|>|\b[a-z0-9-]+\.[a-z]{2,}(?:[:/]|\b))/i.test(normalized)) return undefined;
  return normalized;
}

function safeImageMetadata(image: unknown): Record<string, string> {
  if (!record(image)) return {};
  const result: Record<string, string> = {};
  for (const key of IMAGE_METADATA_FIELDS) {
    const value = safeText(image[key]);
    if (value) result[key] = value;
  }
  if (['ai', 'photo'].includes(image.type)) result.type = image.type;
  return result;
}

function unavailable(question: Record<string, any>, reason: string) {
  const safeReason = KNOWN_IMAGE_FAILURES.has(reason) ? reason : 'image_unavailable';
  const current = typeof question.gambar === 'string' ? {} : question.gambar;
  question.gambar = {
    ...safeImageMetadata(current),
    imageUnavailable: true,
    imageUnavailableReason: safeReason,
    imageWarningReason: safeReason,
  };
  return question.gambar;
}

function questionLabel(question: Record<string, any>, index: number) {
  return question.no ?? index + 1;
}

function canonicalAssetImage(image: unknown, metadata: AssessmentAssetMetadata) {
  return {
    ...safeImageMetadata(image),
    assetId: metadata.assetId,
    url: metadata.url,
    mime: metadata.mime,
    byteLength: metadata.byteLength,
  };
}

const visualCatalog = new Map(getVisualCatalog().map(item => [item.id, item.sampleParams]));

/** Keep only known renderer kinds, sample-schema keys, and bounded primitive values. */
function sanitizeBySample(value: unknown, sample: unknown, depth = 0): any {
  if (depth > 5) return undefined;
  if (Array.isArray(sample)) {
    if (!Array.isArray(value) || value.length > 64) return undefined;
    const sampleItem = sample[0];
    const result = value.map(item => sanitizeBySample(item, sampleItem, depth + 1));
    return result.some(item => item === undefined) ? undefined : result;
  }
  if (record(sample)) {
    if (!record(value)) return undefined;
    const result: Record<string, any> = {};
    for (const [key, child] of Object.entries(value)) {
      if (!Object.prototype.hasOwnProperty.call(sample, key) || /(?:url|uri|svg|script|href|src|html|xml|image|gambar|onload)/i.test(key)) continue;
      const clean = sanitizeBySample(child, sample[key], depth + 1);
      if (clean !== undefined) result[key] = clean;
    }
    return result;
  }
  if (typeof sample === 'number') {
    return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1_000_000 ? value : undefined;
  }
  if (typeof sample === 'boolean') return typeof value === 'boolean' ? value : undefined;
  if (typeof sample === 'string') {
    return safeText(value, 120);
  }
  return undefined;
}

function validatedVisualSpec(value: unknown): { type: string; params: Record<string, any>; caption?: string } | null {
  if (!record(value) || typeof value.type !== 'string') return null;
  const sample = visualCatalog.get(value.type);
  if (!sample) return null;
  const params = sanitizeBySample(record(value.params) ? value.params : {}, sample);
  if (!record(params)) return null;
  const caption = safeText(value.caption, 120);
  const spec = { type: value.type, params, ...(caption ? { caption } : {}) };
  if (JSON.stringify(spec).length > 8_192) return null;
  return spec;
}

function trustedSvg(question: Record<string, any>, image: Record<string, any>, spec: NonNullable<ReturnType<typeof validatedVisualSpec>>) {
  const rendered = generateVisualStimulus(spec);
  if (!rendered?.svg || !rendered.dataUri) return false;
  question.gambar = {
    ...safeImageMetadata(image),
    type: 'svg',
    svg: rendered.svg,
    url: rendered.dataUri,
    credit: safeText(rendered.credit) || 'Examplate Visual Engine',
    title: safeText(rendered.title) || spec.type,
  };
  // This is a validated renderer specification, not a trusted-SVG marker. Keeping it
  // allows a later normalization pass to rebuild the SVG instead of trusting bytes.
  question.visual_stimulus = spec;
  return true;
}

/**
 * Normalize only known question stimulus locations. Provider URLs are transient input:
 * they are never copied into output, errors, or warnings.
 */
export async function normalizeAssessmentImages(
  db: D1Database,
  ownerId: number | string,
  content: any,
): Promise<{ content: any; warnings: AssessmentImageWarning[]; stagedAssets: AssessmentAssetStage }> {
  const warnings: AssessmentImageWarning[] = [];
  const items = questionItems(content);
  const ownedAssets = new Map<string, AssessmentAssetMetadata>();
  const stagedAssets = new Map<string, StagedAssessmentAsset>();
  const sourceAssets = new Map<string, StagedAssessmentAsset | null>();
  const rejectedAssets = new Map<string, string>();
  let totalBytes = 0;
  let rasterReferenceCount = 0;

  // Normalize legacy string forms before the one lookup per unique stable asset ID.
  for (const item of items) {
    if (typeof item.gambar === 'string') item.gambar = { url: item.gambar };
  }

  // Budget counts unique owned assets. Cache full authoritative metadata so every
  // duplicate reference can be rebuilt from the same verified owner record.
  for (const [index, item] of items.entries()) {
    if (!record(item.gambar) || typeof item.gambar.assetId !== 'string') continue;
    const id = item.gambar.assetId;
    if (ownedAssets.has(id) || rejectedAssets.has(id)) continue;
    if (ownedAssets.size + stagedAssets.size >= ASSESSMENT_PACKAGE_IMAGE_MAX_REFERENCES) {
      rejectedAssets.set(id, 'package_image_count_limit');
      continue;
    }
    let owned: AssessmentAssetMetadata | null;
    try { owned = await readOwnedAssessmentAssetMetadata(db, ownerId, id); }
    catch { owned = null; }
    if (!owned) {
      rejectedAssets.set(id, 'asset_not_owned_or_missing');
      continue;
    }
    if (totalBytes + owned.byteLength > ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES) {
      rejectedAssets.set(id, 'package_image_byte_limit');
      continue;
    }
    ownedAssets.set(id, owned);
    totalBytes += owned.byteLength;
  }

  for (const [index, item] of items.entries()) {
    if (!record(item.gambar)) item.gambar = {};
    const image = item.gambar as Record<string, any>;
    const requestedAssetId = typeof image.assetId === 'string' ? image.assetId : null;

    if (requestedAssetId) {
      rasterReferenceCount++;
      if (rasterReferenceCount > ASSESSMENT_PACKAGE_IMAGE_MAX_REFERENCES) {
        unavailable(item, 'package_image_count_limit');
        warnings.push({ questionNo: questionLabel(item, index), reason: 'package_image_count_limit' });
        delete item.visual_stimulus;
        continue;
      }
      const owned = ownedAssets.get(requestedAssetId);
      if (owned) {
        item.gambar = canonicalAssetImage(image, owned);
        delete item.visual_stimulus;
        continue;
      }
      const reason = rejectedAssets.get(requestedAssetId) || 'asset_not_owned_or_missing';
      unavailable(item, reason);
      warnings.push({ questionNo: questionLabel(item, index), reason });
      delete item.visual_stimulus;
      continue;
    }

    const rawVisualSpec = item.visual_stimulus;
    const spec = rawVisualSpec == null ? null : validatedVisualSpec(rawVisualSpec);
    if (spec) {
      item.visual_stimulus = spec;
      const hasSvgSource = /svg/i.test(String(image.type || '')) || /data:image\/svg|<svg/i.test(String(image.url || image.gambar || image.dataUri || '')) || typeof image.svg === 'string';
      if ((!image.url || hasSvgSource) && trustedSvg(item, image, spec)) continue;
    } else if (rawVisualSpec != null) {
      delete item.visual_stimulus;
    }

    const rawUrl = typeof image.url === 'string' ? image.url : typeof image.gambar === 'string' ? image.gambar : typeof image.dataUri === 'string' ? image.dataUri : '';
    const looksLikeSvg = /svg/i.test(String(image.type || '')) || /data:image\/svg|<svg/i.test(String(image.url || image.gambar || image.dataUri || '')) || typeof image.svg === 'string';
    if (looksLikeSvg) {
      unavailable(item, 'untrusted_svg');
      warnings.push({ questionNo: questionLabel(item, index), reason: 'untrusted_svg' });
      continue;
    }
    if (!rawUrl) {
      if (image.imageUnavailable === true) {
        const reason = KNOWN_IMAGE_FAILURES.has(String(image.imageUnavailableReason)) ? String(image.imageUnavailableReason) : 'image_unavailable';
        unavailable(item, reason);
        warnings.push({ questionNo: questionLabel(item, index), reason });
      } else {
        const requiresImage = item.imageRequired === true || /(?:perhatikan|amatilah|lihat|berdasarkan)\s+(?:gambar|foto|diagram)|(?:perhatikan|amatilah)\s+ilustrasi\s+(?:berikut|di\s+bawah)|look\s+at\s+the\s+(?:picture|image|diagram)/i.test(String(item.soal || ''));
        if (requiresImage) {
          unavailable(item, 'required_image_missing');
          warnings.push({ questionNo: questionLabel(item, index), reason: 'required_image_missing' });
        } else delete item.gambar;
      }
      continue;
    }

    rasterReferenceCount++;
    if (rasterReferenceCount > ASSESSMENT_PACKAGE_IMAGE_MAX_REFERENCES) {
      unavailable(item, 'package_image_count_limit');
      warnings.push({ questionNo: questionLabel(item, index), reason: 'package_image_count_limit' });
      continue;
    }
    if (sourceAssets.has(rawUrl)) {
      const prior = sourceAssets.get(rawUrl);
      if (!prior) {
        unavailable(item, 'image_unavailable');
        warnings.push({ questionNo: questionLabel(item, index), reason: 'image_unavailable' });
      } else {
        item.gambar = canonicalAssetImage(image, { id: prior.id, assetId: prior.id, mime: prior.mime, byteLength: prior.byteLength, sha256: prior.sha256, url: `/api/assessment-assets/${prior.id}` });
        delete item.visual_stimulus;
      }
      continue;
    }
    if (ownedAssets.size + stagedAssets.size >= ASSESSMENT_PACKAGE_IMAGE_MAX_REFERENCES) {
      unavailable(item, 'package_image_count_limit');
      warnings.push({ questionNo: questionLabel(item, index), reason: 'package_image_count_limit' });
      continue;
    }
    try {
      const remaining = ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES - totalBytes;
      if (remaining <= 0) throw new TrustedImageIngestError('package_image_byte_limit');
      const asset = await fetchTrustedAssessmentImage(Number(ownerId), rawUrl, { maxBytes: Math.min(1_572_864, remaining) });
      const nextBytes = totalBytes + asset.byteLength;
      if (nextBytes > ASSESSMENT_PACKAGE_IMAGE_MAX_BYTES) {
        unavailable(item, 'package_image_byte_limit');
        warnings.push({ questionNo: questionLabel(item, index), reason: 'package_image_byte_limit' });
        continue;
      }
      stagedAssets.set(asset.id, asset);
      sourceAssets.set(rawUrl, asset);
      totalBytes = nextBytes;
      item.gambar = canonicalAssetImage(image, { id: asset.id, assetId: asset.id, mime: asset.mime, byteLength: asset.byteLength, sha256: asset.sha256, url: `/api/assessment-assets/${asset.id}` });
      delete item.visual_stimulus;
    } catch (error) {
      const reason = error instanceof TrustedImageIngestError && KNOWN_IMAGE_FAILURES.has(error.reason) ? error.reason : 'image_unavailable';
      sourceAssets.set(rawUrl, null);
      unavailable(item, reason);
      warnings.push({ questionNo: questionLabel(item, index), reason });
    }
  }

  return { content, warnings, stagedAssets };
}
