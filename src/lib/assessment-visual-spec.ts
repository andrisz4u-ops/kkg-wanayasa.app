import { VISUAL_RENDERER_REGISTRY, type VisualRendererFn } from './visual-engine';
import { getVisualCatalog } from './visuals/catalog';

export type AssessmentVisualSpec = { type: string; params: Record<string, any>; caption?: string };

type ParamSchema =
  | { kind: 'text' | 'number' | 'boolean' }
  | { kind: 'array'; item: ParamSchema }
  | { kind: 'object'; fields: Record<string, ParamSchema> }
  | { kind: 'enum'; values: readonly string[] }
  | { kind: 'oneOf'; variants: readonly ParamSchema[] };

const TEXT: ParamSchema = { kind: 'text' };
const NUMBER: ParamSchema = { kind: 'number' };
const BOOLEAN: ParamSchema = { kind: 'boolean' };
const UNSAFE_KEY = /(?:url|uri|svg|script|href|src|html|xml|image|gambar|^on|^__proto__$|^constructor$|^prototype$)/i;

// These fields are renderer contracts absent from the catalog examples. Keep
// supplements explicit: registry membership never permits arbitrary parameters.
const SUPPLEMENTAL_SCHEMAS: Record<string, Record<string, ParamSchema>> = {
  perisai_pancasila: {
    sila: { kind: 'oneOf', variants: [NUMBER, TEXT] },
    pointer: TEXT,
    showAll: BOOLEAN,
  },
  pola_warna: {
    pola: { kind: 'array', item: TEXT },
    bentuk: { kind: 'enum', values: ['lingkaran', 'kotak'] },
    label: TEXT,
  },
  perangkat_komputer: { pointer: TEXT, label: TEXT },
};

function record(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function schemaFromSample(sample: unknown): ParamSchema | undefined {
  if (typeof sample === 'string') return TEXT;
  if (typeof sample === 'number') return NUMBER;
  if (typeof sample === 'boolean') return BOOLEAN;
  if (Array.isArray(sample)) {
    const item = schemaFromSample(sample[0]);
    return item ? { kind: 'array', item } : undefined;
  }
  if (!record(sample)) return undefined;
  const fields: Record<string, ParamSchema> = {};
  for (const [key, value] of Object.entries(sample)) {
    if (UNSAFE_KEY.test(key)) continue;
    const schema = schemaFromSample(value);
    if (schema) fields[key] = schema;
  }
  return { kind: 'object', fields };
}

const schemasByRenderer = new Map<VisualRendererFn, Record<string, ParamSchema>>();
for (const item of getVisualCatalog()) {
  if (!Object.prototype.hasOwnProperty.call(VISUAL_RENDERER_REGISTRY, item.id)) continue;
  const schema = schemaFromSample(item.sampleParams);
  if (schema?.kind === 'object') schemasByRenderer.set(VISUAL_RENDERER_REGISTRY[item.id].render, schema.fields);
}
for (const [type, fields] of Object.entries(SUPPLEMENTAL_SCHEMAS)) {
  if (!Object.prototype.hasOwnProperty.call(VISUAL_RENDERER_REGISTRY, type)) continue;
  const renderer = VISUAL_RENDERER_REGISTRY[type].render;
  schemasByRenderer.set(renderer, { ...schemasByRenderer.get(renderer), ...fields });
}

function safeText(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 120) return undefined;
  const text = value.trim();
  if (!text || /(?:https?:|data:|blob:|javascript:|vbscript:|file:|ftp:|www\.|\/\/|[<>]|\b[a-z0-9-]+\.[a-z]{2,}(?:[:/]|\b)|\bon\w+\s*=)/i.test(text)) return undefined;
  if ([...text].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return undefined;
  return text;
}

function sanitizeValue(value: unknown, schema: ParamSchema, depth = 0): any {
  if (depth > 5) return undefined;
  switch (schema.kind) {
    case 'text': return safeText(value);
    case 'boolean': return typeof value === 'boolean' ? value : undefined;
    case 'number': {
      // Only declared numeric fields accept decimal strings. Do not coerce
      // booleans, blank strings, objects, hex, URLs, or free-text labels.
      let number = value;
      if (typeof number === 'string') {
        if (number.length > 120 || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(number.trim())) return undefined;
        number = Number(number.trim());
      }
      return typeof number === 'number' && Number.isFinite(number) && Math.abs(number) <= 1_000_000 ? number : undefined;
    }
    case 'enum': {
      const text = safeText(value);
      return text !== undefined && schema.values.includes(text) ? text : undefined;
    }
    case 'oneOf': {
      for (const variant of schema.variants) {
        const clean = sanitizeValue(value, variant, depth);
        if (clean !== undefined) return clean;
      }
      return undefined;
    }
    case 'array': {
      if (!Array.isArray(value) || value.length > 64) return undefined;
      const clean = Array.from(value, item => sanitizeValue(item, schema.item, depth + 1));
      return clean.some(item => item === undefined) ? undefined : clean;
    }
    case 'object': {
      if (!record(value)) return undefined;
      const clean: Record<string, any> = {};
      // Iterate the bounded schema, not untrusted keys or inherited properties.
      for (const [key, child] of Object.entries(schema.fields)) {
        if (UNSAFE_KEY.test(key) || !Object.prototype.hasOwnProperty.call(value, key)) continue;
        const sanitized = sanitizeValue(value[key], child, depth + 1);
        if (sanitized !== undefined) clean[key] = sanitized;
      }
      return clean;
    }
  }
}

/** A bounded renderer input, never a claim that supplied SVG bytes are trusted. */
export function validatedAssessmentVisualSpec(value: unknown): AssessmentVisualSpec | null {
  if (!record(value) || typeof value.type !== 'string' || value.type.length > 120) return null;
  const type = value.type.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(VISUAL_RENDERER_REGISTRY, type)) return null;
  // Aliases share a schema only when they share the exact renderer function.
  const fields = schemasByRenderer.get(VISUAL_RENDERER_REGISTRY[type].render);
  if (!fields) return null;
  const params = sanitizeValue(record(value.params) ? value.params : {}, { kind: 'object', fields });
  const caption = safeText(value.caption);
  // Retain the registered alias: some aliases have distinct accessible titles.
  const spec = { type, params, ...(caption ? { caption } : {}) };
  return JSON.stringify(spec).length <= 8_192 ? spec : null;
}
