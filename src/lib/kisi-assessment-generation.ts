import { readBoundedJson } from './document-drafts';

export const KISI_ASSESSMENT_BODY_LIMIT_BYTES = 1024 * 1024;

export async function readKisiAssessmentJson(request: Request) {
  const parsed = await readBoundedJson(request);
  if (!parsed.ok) return { ok: false as const, reason: parsed.reason };
  return { ok: true as const, value: parsed.value };
}

function canonicalSemanticInput(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return item;
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(normalize);
    if (typeof item === 'object') {
      const source = item as Record<string, unknown>;
      const result: Record<string, unknown> = Object.create(null);
      for (const key of Object.keys(source).sort()) {
        if (source[key] === undefined) throw new TypeError('semantic_input_invalid');
        result[key] = normalize(source[key]);
      }
      return result;
    }
    throw new TypeError('semantic_input_invalid');
  };
  return JSON.stringify({ schema: 1, semanticInput: normalize(value) });
}

export async function hashKisiAssessmentSemanticInput(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalSemanticInput(value)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
