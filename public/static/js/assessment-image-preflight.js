/** @typedef {'pg' | 'isian' | 'uraian'} AssessmentImageSection */

export const ASSESSMENT_IMAGE_LIMITS = Object.freeze({
  maxConcurrency: 2,
  maxImageBytes: 512 * 1024,
  maxTotalBytes: 4 * 1024 * 1024,
  loadTimeoutMs: 10_000,
  decodeTimeoutMs: 5_000,
  maxPixels: 8_000_000,
  maxCacheEntries: 32,
});

/** @typedef {{ buffer: ArrayBuffer, type: 'png' | 'jpeg', width: number, height: number, sourceFingerprint: string, bytesFingerprint: string }} LoadedAssessmentImage */
/** @typedef {(image: AssessmentImageSource, expectation: AssessmentImageExpectation, options: { signal: AbortSignal, maxImageBytes: number }) => Promise<{ buffer: ArrayBuffer, type: 'png' | 'jpeg' }>} AssessmentImageLoader */
/** @typedef {{ url: string | undefined, svg: string | undefined }} AssessmentImageSource */
/** @typedef {{ no?: number | string, gambar?: unknown, visual_stimulus?: unknown, [key: string]: unknown }} AssessmentImageQuestion */
/** @typedef {{ pg?: AssessmentImageQuestion[], isian?: { data?: AssessmentImageQuestion[] } | null, uraian?: AssessmentImageQuestion[] }} AssessmentData */
/** @typedef {{ section: AssessmentImageSection, number: number | string, question: AssessmentImageQuestion, image: AssessmentImageSource, sourceSnapshot: { gambar: unknown, visual_stimulus: unknown } }} AssessmentImageExpectation */
/** @typedef {'missing-source' | 'load-failed' | 'decode-failed' | 'invalid-image' | 'budget-exceeded' | 'timeout' | 'source-changed'} AssessmentImageFailureCategory */
/** @typedef {{ section: AssessmentImageSection, number: number | string, category: AssessmentImageFailureCategory }} AssessmentImageFailure */
/** @typedef {{ ready: boolean, images: Map<AssessmentImageQuestion, LoadedAssessmentImage>, failures: AssessmentImageFailure[] }} AssessmentImagePreflightResult */

/**
 * @param {unknown} value
 * @returns {value is { type: string, params?: Record<string, unknown> }}
 */
function isRequiredVisualStimulus(value) {
  if (!value || typeof value !== 'object') return false;
  const stimulus = /** @type {{ type?: unknown, params?: unknown }} */ (value);
  return typeof stimulus.type === 'string'
    && stimulus.type.trim().length > 0
    && stimulus.type.trim().toLowerCase() !== 'none'
    && (!stimulus.params || (typeof stimulus.params === 'object' && !Array.isArray(stimulus.params)));
}

/** @param {unknown} value */
function hasImageValue(value) {
  return value !== undefined && value !== null;
}

/**
 * @param {AssessmentData | null | undefined} data
 * @returns {AssessmentImageExpectation[]}
 */
export function collectExpectedAssessmentImages(data) {
  if (!data) return [];
  /** @type {AssessmentImageExpectation[]} */
  const expected = [];
  const sections = [['pg', data.pg], ['isian', data.isian?.data], ['uraian', data.uraian]];
  for (const [section, questions] of sections) {
    if (!Array.isArray(questions)) continue;
    questions.forEach((question, index) => {
      if (!question || (!hasImageValue(question.gambar) && !isRequiredVisualStimulus(question.visual_stimulus))) return;
      const gambar = question.gambar;
      const image = gambar && typeof gambar === 'object'
        ? {
            url: typeof gambar.url === 'string' ? gambar.url : undefined,
            svg: typeof gambar.svg === 'string' ? gambar.svg : undefined,
          }
        : { url: typeof gambar === 'string' ? gambar : undefined, svg: undefined };
      expected.push({
        section: /** @type {AssessmentImageSection} */ (section),
        number: question.no ?? index + 1,
        question,
        image,
        sourceSnapshot: imageSourceIdentity(question),
      });
    });
  }
  return expected;
}

/** @param {unknown} value */
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const key of Object.keys(value).sort()) {
    const child = /** @type {Record<string, unknown>} */ (value)[key];
    if (child !== undefined && typeof child !== 'function') output[key] = stableValue(child);
  }
  return output;
}

/** @param {AssessmentImageQuestion} question */
function imageSourceIdentity(question) {
  return {
    // Include the entire image descriptor, not just today's known fields. Image
    // parameters, alternate asset/hash names, and future source metadata must
    // invalidate a prepared export when they change.
    gambar: stableValue(question.gambar ?? null),
    visual_stimulus: stableValue(question.visual_stimulus ?? null),
  };
}

/** @param {{ gambar: unknown, visual_stimulus: unknown }} identity */
async function fingerprintAssessmentImage(identity) {
  const canonical = JSON.stringify(identity);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Estimate inline input before any decode/allocation. */
function estimateInlineBytes(image, maxImageBytes) {
  let total = 0;
  for (const value of [image.url, image.svg]) {
    if (!value) continue;
    if (value.startsWith('data:')) {
      const comma = value.indexOf(',');
      if (comma < 0) return Number.POSITIVE_INFINITY;
      const header = value.slice(0, comma).toLowerCase();
      const payloadLength = value.length - comma - 1;
      const payload = value.slice(comma + 1);
      const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
      const decodedUpperBound = header.includes(';base64')
        ? (payload.length % 4 === 0 ? (payload.length / 4) * 3 - padding : Number.POSITIVE_INFINITY)
        : payloadLength;
      if (decodedUpperBound > maxImageBytes) return Number.POSITIVE_INFINITY;
      total += decodedUpperBound;
    } else if (value.trimStart().startsWith('<svg')) {
      if (value.length > maxImageBytes) return Number.POSITIVE_INFINITY;
      total += new TextEncoder().encode(value).byteLength;
    }
  }
  const visual = JSON.stringify(stableValue(image));
  if (visual.length > maxImageBytes) return Number.POSITIVE_INFINITY;
  return total;
}

/** @param {ArrayBuffer} buffer @param {'png' | 'jpeg'} type */
function readRasterHeader(buffer, type) {
  const bytes = new Uint8Array(buffer);
  if (bytes.byteLength === 0) return null;
  if (type === 'png') {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length < 24 || !signature.every((byte, index) => bytes[index] === byte)
      || bytes[12] !== 73 || bytes[13] !== 72 || bytes[14] !== 68 || bytes[15] !== 82) return null;
    const view = new DataView(buffer);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let cursor = 2;
  while (cursor + 4 <= bytes.length) {
    if (bytes[cursor] !== 0xff) return null;
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor++;
    if (cursor >= bytes.length) return null;
    const marker = bytes[cursor++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (cursor + 2 > bytes.length) return null;
    const segmentLength = (bytes[cursor] << 8) | bytes[cursor + 1];
    if (segmentLength < 2 || cursor + segmentLength > bytes.length) return null;
    if (sofMarkers.has(marker)) {
    if (segmentLength < 8) return null;
      return { height: (bytes[cursor + 3] << 8) | bytes[cursor + 4], width: (bytes[cursor + 5] << 8) | bytes[cursor + 6] };
    }
    cursor += segmentLength;
  }
  return null;
}

/** @param {ArrayBuffer} buffer @param {'png' | 'jpeg'} type @param {{ signal: AbortSignal }} options */
async function decodeRasterImage(buffer, type, { signal }) {
  const blob = new Blob([buffer], { type: type === 'png' ? 'image/png' : 'image/jpeg' });
  if (typeof createImageBitmap === 'function') {
    const pending = createImageBitmap(blob);
    pending.then(bitmap => { if (signal.aborted) bitmap.close(); }, () => {});
    const bitmap = await abortable(pending, signal);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  if (typeof Image !== 'function' || typeof URL.createObjectURL !== 'function') throw new Error('decoder-unavailable');
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  try {
    return await new Promise((resolve, reject) => {
      const cleanup = () => {
        image.onload = null;
        image.onerror = null;
        signal.removeEventListener('abort', onAbort);
      };
      const onAbort = () => { cleanup(); image.src = ''; reject(new Error('decode-aborted')); };
      image.onload = () => { const dims = { width: image.naturalWidth, height: image.naturalHeight }; cleanup(); resolve(dims); };
      image.onerror = () => { cleanup(); reject(new Error('decode-failed')); };
      signal.addEventListener('abort', onAbort, { once: true });
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** @param {Promise<unknown>} promise @param {AbortSignal} signal */
function abortable(promise, signal) {
  if (signal.aborted) return Promise.reject(new Error('operation-aborted'));
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new Error('operation-aborted'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

/** @type {Map<string, { loader: AssessmentImageLoader, value: LoadedAssessmentImage, size: number }>} */
const decodedCache = new Map();
let decodedCacheBytes = 0;
/** @type {Map<string, { loader: AssessmentImageLoader, promise: Promise<LoadedAssessmentImage> }>} */
const inFlightByFingerprint = new Map();
/** @type {WeakMap<AssessmentImagePreflightResult, Map<AssessmentImageQuestion, { sourceFingerprint: string, bytesFingerprint: string }>>} */
const preflightSnapshots = new WeakMap();
let activeLoadCount = 0;
/** @type {Array<() => void>} */
const queueWaiters = [];

async function acquireGlobalSlot() {
  if (activeLoadCount >= ASSESSMENT_IMAGE_LIMITS.maxConcurrency) {
    await new Promise(resolve => queueWaiters.push(resolve));
  } else {
    activeLoadCount++;
  }
}

function releaseGlobalSlot() {
  const next = queueWaiters.shift();
  if (next) next();
  else activeLoadCount--;
}

/** @param {string} key */
function touchCache(key) {
  const entry = decodedCache.get(key);
  if (!entry) return undefined;
  decodedCache.delete(key);
  decodedCache.set(key, entry);
  return entry;
}

/** @param {string} key @param {AssessmentImageLoader} loader @param {LoadedAssessmentImage} value */
function storeCache(key, loader, value) {
  const size = value.buffer.byteLength;
  if (size > ASSESSMENT_IMAGE_LIMITS.maxImageBytes) return;
  const prior = decodedCache.get(key);
  if (prior) {
    decodedCacheBytes -= prior.size;
    decodedCache.delete(key);
  }
  while (decodedCache.size >= ASSESSMENT_IMAGE_LIMITS.maxCacheEntries
    || decodedCacheBytes + size > ASSESSMENT_IMAGE_LIMITS.maxTotalBytes) {
    const oldestKey = decodedCache.keys().next().value;
    if (oldestKey === undefined) break;
    const oldest = decodedCache.get(oldestKey);
    decodedCache.delete(oldestKey);
    decodedCacheBytes -= oldest?.size || 0;
  }
  // Keep cache-owned bytes private from callers: ArrayBuffers are mutable even
  // when the enclosing result object is frozen or copied.
  decodedCache.set(key, { loader, value: { ...value, buffer: value.buffer.slice(0) }, size });
  decodedCacheBytes += size;
}

/** @param {AssessmentImageSource} image @param {number} maxImageBytes */
function expectedInputBytes(image, maxImageBytes) {
  return estimateInlineBytes(image, maxImageBytes);
}

/**
 * @param {AssessmentData | null | undefined} data
 * @param {{
 *   loadImage: (image: AssessmentImageSource, expectation: AssessmentImageExpectation, options: { signal: AbortSignal, maxImageBytes: number }) => Promise<{ buffer: ArrayBuffer, type: 'png' | 'jpeg' }>,
 *   decodeImage?: (buffer: ArrayBuffer, type: 'png' | 'jpeg', options: { signal: AbortSignal }) => Promise<{ width: number, height: number }>,
 *   maxConcurrency?: number, maxImageBytes?: number, maxTotalBytes?: number, loadTimeoutMs?: number, decodeTimeoutMs?: number,
 * }} options
 * @returns {Promise<AssessmentImagePreflightResult>}
 */
export async function preflightAssessmentImages(data, options) {
  const expected = collectExpectedAssessmentImages(data);
  const loadImage = options.loadImage;
  const decodeImage = options.decodeImage || decodeRasterImage;
  const maxConcurrency = Math.max(1, Math.min(ASSESSMENT_IMAGE_LIMITS.maxConcurrency, options.maxConcurrency ?? ASSESSMENT_IMAGE_LIMITS.maxConcurrency));
  const maxImageBytes = Math.max(1, Math.min(ASSESSMENT_IMAGE_LIMITS.maxImageBytes, options.maxImageBytes ?? ASSESSMENT_IMAGE_LIMITS.maxImageBytes));
  const maxTotalBytes = Math.max(1, Math.min(ASSESSMENT_IMAGE_LIMITS.maxTotalBytes, options.maxTotalBytes ?? ASSESSMENT_IMAGE_LIMITS.maxTotalBytes));
  const loadTimeoutMs = Math.max(1, Math.min(ASSESSMENT_IMAGE_LIMITS.loadTimeoutMs, options.loadTimeoutMs ?? ASSESSMENT_IMAGE_LIMITS.loadTimeoutMs));
  const decodeTimeoutMs = Math.max(1, Math.min(ASSESSMENT_IMAGE_LIMITS.decodeTimeoutMs, options.decodeTimeoutMs ?? ASSESSMENT_IMAGE_LIMITS.decodeTimeoutMs));
  const images = new Map();
  const failures = [];
  let nextIndex = 0;
  let packageBytes = 0;
  const inputBytes = expected.map(item => {
    try {
      const inlineSize = expectedInputBytes(item.image, maxImageBytes);
      const visualSize = JSON.stringify(stableValue(item.question.visual_stimulus ?? null)).length;
      return Math.max(inlineSize, visualSize > maxImageBytes ? Number.POSITIVE_INFINITY : inlineSize + visualSize);
    } catch { return Number.POSITIVE_INFINITY; }
  });
  const inlineTotal = inputBytes.reduce((sum, size) => sum + size, 0);

  const recordFailure = (expectation, category) => failures.push({
    section: expectation.section,
    number: expectation.number,
    category,
  });

  async function loadOne(expectation) {
    if (!expectation.image.url && !expectation.image.svg) {
      recordFailure(expectation, 'missing-source');
      return;
    }
    if (inlineTotal > maxTotalBytes || inputBytes[expected.indexOf(expectation)] > maxImageBytes) {
      recordFailure(expectation, 'budget-exceeded');
      return;
    }
    let fingerprint;
    try {
      fingerprint = await fingerprintAssessmentImage(expectation.sourceSnapshot);
      const liveFingerprint = await fingerprintAssessmentImage(imageSourceIdentity(expectation.question));
      if (liveFingerprint !== fingerprint) {
        recordFailure(expectation, 'source-changed');
        return;
      }
    } catch {
      recordFailure(expectation, 'load-failed');
      return;
    }

    const cacheEntry = touchCache(fingerprint);
    let loadedPromise;
    if (cacheEntry && cacheEntry.loader === loadImage) {
      loadedPromise = Promise.resolve(cacheEntry.value);
    } else {
      const inflight = inFlightByFingerprint.get(fingerprint);
      if (inflight && inflight.loader === loadImage) {
        loadedPromise = inflight.promise;
      } else {
        const promise = (async () => {
          await acquireGlobalSlot();
          try {
            const loaded = await runWithDeadline(
              signal => loadImage(expectation.image, expectation, { signal, maxImageBytes }),
              loadTimeoutMs,
              'timeout',
            );
            if (!loaded || !(loaded.buffer instanceof ArrayBuffer) || loaded.buffer.byteLength === 0
              || loaded.buffer.byteLength > maxImageBytes || (loaded.type !== 'png' && loaded.type !== 'jpeg')) {
              throw new Error('invalid-image');
            }
            const header = readRasterHeader(loaded.buffer, loaded.type);
            if (!header || header.width <= 0 || header.height <= 0
              || header.width * header.height > ASSESSMENT_IMAGE_LIMITS.maxPixels) throw new Error('invalid-image');
            let dims;
            try {
              dims = await runWithDeadline(
                signal => decodeImage(loaded.buffer, loaded.type, { signal }),
                decodeTimeoutMs,
                'decode-failed',
              );
            } catch { throw new Error('decode-failed'); }
            if (!Number.isInteger(dims.width) || !Number.isInteger(dims.height)
              || dims.width <= 0 || dims.height <= 0
              || dims.width * dims.height > ASSESSMENT_IMAGE_LIMITS.maxPixels
              || dims.width !== header.width || dims.height !== header.height) throw new Error('decode-failed');
            const currentFingerprint = await fingerprintAssessmentImage(imageSourceIdentity(expectation.question));
            if (currentFingerprint !== fingerprint) throw new Error('source-changed');
            const bytesFingerprint = await fingerprintBuffer(loaded.buffer);
            const validated = { ...loaded, width: dims.width, height: dims.height, sourceFingerprint: fingerprint, bytesFingerprint };
            storeCache(fingerprint, loadImage, validated);
            return validated;
          } finally {
            releaseGlobalSlot();
          }
        })();
        inFlightByFingerprint.set(fingerprint, { loader: loadImage, promise });
        promise.finally(() => {
          if (inFlightByFingerprint.get(fingerprint)?.promise === promise) inFlightByFingerprint.delete(fingerprint);
        }).catch(() => {});
        loadedPromise = promise;
      }
    }
    try {
      const loaded = await loadedPromise;
      const currentFingerprint = await fingerprintAssessmentImage(imageSourceIdentity(expectation.question));
      if (currentFingerprint !== fingerprint || loaded.sourceFingerprint !== fingerprint) {
        recordFailure(expectation, 'source-changed');
        return;
      }
      if (packageBytes + loaded.buffer.byteLength > maxTotalBytes) {
        recordFailure(expectation, 'budget-exceeded');
        return;
      }
      packageBytes += loaded.buffer.byteLength;
      // The result map is caller-owned; never expose the ArrayBuffer retained by
      // the decoded cache or shared by an in-flight request.
      images.set(expectation.question, { ...loaded, buffer: loaded.buffer.slice(0) });
    } catch (error) {
      const category = error instanceof Error && ['timeout', 'invalid-image', 'decode-failed', 'source-changed', 'image-too-large'].includes(error.message)
        ? error.message === 'image-too-large' ? 'budget-exceeded' : error.message
        : 'load-failed';
      recordFailure(expectation, /** @type {AssessmentImageFailureCategory} */ (category));
    }
  }

  const resultWithSnapshot = () => {
    const result = { ready: failures.length === 0, images, failures };
    preflightSnapshots.set(result, new Map([...images].map(([question, image]) => [question, {
      sourceFingerprint: image.sourceFingerprint,
      bytesFingerprint: image.bytesFingerprint,
    }])));
    return result;
  };

  if (inlineTotal > maxTotalBytes) {
    for (const expectation of expected) recordFailure(expectation, 'budget-exceeded');
    return resultWithSnapshot();
  }

  async function worker() {
    while (nextIndex < expected.length) {
      const current = expected[nextIndex++];
      await loadOne(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(maxConcurrency, expected.length) }, () => worker()));
  return resultWithSnapshot();
}

/** @param {ArrayBuffer} buffer */
async function fingerprintBuffer(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify caller-supplied prepared bytes and their source metadata before use.
 * @param {AssessmentData | null | undefined} data
 * @param {AssessmentImagePreflightResult} prepared
 * @param {{ decodeImage?: typeof decodeRasterImage | false, decodeTimeoutMs?: number }} [options]
 * @returns {Promise<AssessmentImageFailure[]>}
 */
export async function validatePreparedAssessmentImages(data, prepared, options = {}) {
  const decodeImage = options.decodeImage === false ? false : (options.decodeImage || decodeRasterImage);
  const decodeTimeoutMs = Math.max(1, Math.min(ASSESSMENT_IMAGE_LIMITS.decodeTimeoutMs, options.decodeTimeoutMs ?? ASSESSMENT_IMAGE_LIMITS.decodeTimeoutMs));
  const failures = [];
  const trustedSnapshot = prepared && preflightSnapshots.get(prepared);
  if (!trustedSnapshot || !(prepared.images instanceof Map) || prepared.ready !== true
    || !Array.isArray(prepared.failures) || prepared.failures.length > 0) {
    return collectExpectedAssessmentImages(data).map(expectation => ({
      section: expectation.section,
      number: expectation.number,
      category: 'invalid-image',
    }));
  }
  let aggregateBytes = 0;
  for (const expectation of collectExpectedAssessmentImages(data)) {
    const loaded = prepared?.images?.get(expectation.question);
    if (!loaded || !(loaded.buffer instanceof ArrayBuffer) || loaded.buffer.byteLength === 0
      || loaded.buffer.byteLength > ASSESSMENT_IMAGE_LIMITS.maxImageBytes
      || (loaded.type !== 'png' && loaded.type !== 'jpeg')) {
      failures.push({ section: expectation.section, number: expectation.number, category: 'invalid-image' });
      continue;
    }
    aggregateBytes += loaded.buffer.byteLength;
    if (aggregateBytes > ASSESSMENT_IMAGE_LIMITS.maxTotalBytes) {
      failures.push({ section: expectation.section, number: expectation.number, category: 'budget-exceeded' });
      continue;
    }
    try {
      const fingerprint = await fingerprintAssessmentImage(imageSourceIdentity(expectation.question));
      const bytesFingerprint = await fingerprintBuffer(loaded.buffer);
      const snapshot = trustedSnapshot.get(expectation.question);
      const header = readRasterHeader(loaded.buffer, loaded.type);
      if (!snapshot || !header || fingerprint !== snapshot.sourceFingerprint || bytesFingerprint !== snapshot.bytesFingerprint
        || loaded.sourceFingerprint !== snapshot.sourceFingerprint || loaded.bytesFingerprint !== snapshot.bytesFingerprint
        || header.width !== loaded.width || header.height !== loaded.height
        || header.width <= 0 || header.height <= 0
        || header.width * header.height > ASSESSMENT_IMAGE_LIMITS.maxPixels) {
        failures.push({ section: expectation.section, number: expectation.number, category: 'source-changed' });
        continue;
      }
      if (decodeImage !== false) {
        const decoded = await runWithDeadline(
          signal => decodeImage(loaded.buffer, loaded.type, { signal }),
          decodeTimeoutMs,
          'decode-failed',
        );
        if (decoded.width !== header.width || decoded.height !== header.height) {
          failures.push({ section: expectation.section, number: expectation.number, category: 'decode-failed' });
        }
      }
    } catch (error) {
      failures.push({
        section: expectation.section,
        number: expectation.number,
        category: error instanceof Error && error.message === 'decode-failed' ? 'decode-failed' : 'source-changed',
      });
    }
  }
  return failures;
}

/** @param {(signal: AbortSignal) => Promise<unknown>} work @param {number} timeoutMs @param {string} timeoutError */
function runWithDeadline(work, timeoutMs, timeoutError) {
  const controller = new AbortController();
  let timer;
  let timedOut = false;
  const pending = Promise.resolve().then(() => work(controller.signal));
  pending.catch(() => {});
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error(timeoutError));
    }, timeoutMs);
  });
  return Promise.race([pending, timeout]).finally(() => {
    clearTimeout(timer);
    if (timedOut) controller.abort();
  });
}

export class AssessmentImagePreflightError extends Error {
  /** @param {AssessmentImageFailure[]} failures */
  constructor(failures) {
    const summary = failures.map(failure => `${failure.section} #${failure.number}: ${failure.category}`).join('; ');
    super(`Required assessment image preflight failed (${summary})`);
    this.name = 'AssessmentImagePreflightError';
    this.failures = failures;
  }
}
