export const DOCUMENT_DRAFT_BODY_LIMIT_BYTES = 1024 * 1024;
export const DOCUMENT_DRAFT_MAX_DEPTH = 32;
export const DOCUMENT_DRAFT_MAX_PER_USER = 50;
export const DOCUMENT_DRAFT_MAX_CHECKPOINTS = 20;
export const DOCUMENT_DRAFT_MAX_TITLE_LENGTH = 200;

export type BoundedJsonResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: 'too_large' | 'invalid_json' | 'invalid_payload' };

export async function readBoundedJson(request: Request): Promise<BoundedJsonResult> {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null && /^\d+$/.test(contentLength) && Number(contentLength) > DOCUMENT_DRAFT_BODY_LIMIT_BYTES) {
    return { ok: false, reason: 'too_large' };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, reason: 'invalid_json' };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > DOCUMENT_DRAFT_BODY_LIMIT_BYTES) {
        await reader.cancel();
        return { ok: false, reason: 'too_large' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: 'invalid_json' };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes));
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
  if (!isJsonObject(value) || !hasAllowedDepth(value, DOCUMENT_DRAFT_MAX_DEPTH)) {
    return { ok: false, reason: 'invalid_payload' };
  }
  return { ok: true, value };
}

export function isDraftModule(value: string): boolean {
  return /^[a-z][a-z0-9-]{0,31}$/.test(value);
}

export function isDraftDocumentId(value: string): boolean {
  return value.length > 0 && value.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(value);
}

export function normalizeDraftTitle(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const title = value.trim();
  return title.length > 0 && title.length <= DOCUMENT_DRAFT_MAX_TITLE_LENGTH ? title : null;
}

export function isValidRevision(value: unknown, allowCreate = false): value is number {
  return typeof value === 'number'
    && Number.isSafeInteger(value)
    && (allowCreate ? value >= 0 : value > 0);
}

export function parseDraft<T extends { payload_json: string }>(row: T) {
  return { ...row, payload: JSON.parse(row.payload_json), payload_json: undefined };
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasAllowedDepth(value: unknown, maxDepth: number): boolean {
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  while (stack.length) {
    const current = stack.pop()!;
    if (current.depth > maxDepth) return false;
    if (current.value && typeof current.value === 'object') {
      for (const child of Object.values(current.value)) stack.push({ value: child, depth: current.depth + 1 });
    }
  }
  return true;
}
