import { load } from 'cheerio';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_SVG_CHARS = 256 * 1024;
const TAGS = new Set(['svg', 'g', 'defs', 'linearGradient', 'radialGradient', 'stop', 'pattern', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text', 'tspan', 'title', 'desc', 'clipPath', 'marker', 'filter', 'feDropShadow', 'feGaussianBlur', 'feOffset', 'feMerge', 'feMergeNode', 'feBlend']);
const NUMERIC_ATTRS = new Set([
  'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'viewBox', 'points', 'd',
  'stroke-width', 'stroke-dasharray', 'stroke-dashoffset', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'opacity', 'offset',
  'gradientTransform', 'gradientUnits', 'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'clipPathUnits',
  'transform', 'preserveAspectRatio', 'font-size', 'font-weight', 'letter-spacing', 'word-spacing', 'text-anchor',
  'dominant-baseline', 'stroke-linecap', 'stroke-linejoin', 'shape-rendering', 'vector-effect', 'filterUnits', 'primitiveUnits',
  'dx', 'dy', 'stdDeviation', 'flood-opacity', 'k1', 'k2', 'k3', 'k4',
]);
const PAINT_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'color']);
const LOCAL_REF_ATTRS = new Set(['clip-path', 'filter', 'marker-start', 'marker-mid', 'marker-end']);
const STYLE_PROPS = new Set(['background', 'border-radius', 'box-shadow', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline']);

export class UnsafeAssessmentSvgError extends Error {
  constructor(reason = 'untrusted_svg') { super(reason); }
}

function escText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(value: string) {
  return escText(value).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function boundedNumbers(value: string) {
  const values = value.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi) || [];
  return values.every(number => Number.isFinite(Number(number)) && Math.abs(Number(number)) <= 1_000_000);
}
function validNumberList(value: string, percent = false) { return (percent ? /^[0-9eE.,+\-%\s]+$/ : /^[0-9eE.,+\-\s]+$/).test(value) && value.length <= 512 && boundedNumbers(value); }
function validPaint(value: string) {
  return /^(?:none|currentColor|transparent|black|white|red|blue|green|gray|grey|yellow|orange|purple|pink|brown|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w.-]*\))$/i.test(value.trim());
}
function validTransform(value: string) {
  if (value.length > 512 || /[^A-Za-z0-9eE.,+\-\s()]/.test(value) || !boundedNumbers(value)) return false;
  return /^(?:(?:matrix|translate|scale|rotate|skewX|skewY)\([0-9eE.,+\-\s]+\)\s*)+$/.test(value.trim());
}
function validDropShadow(value: string) {
  if (value.length > 160) return false;
  return /^drop-shadow\(\s*-?[0-9.]+(?:px)?\s+-?[0-9.]+(?:px)?\s+[0-9.]+(?:px)?\s+(?:rgba?\(\s*[0-9.,\s%]{5,40}\)|#[0-9a-f]{3,8}|[a-z]{3,20})\s*\)$/i.test(value.trim());
}
function validBoxShadow(value: string) {
  if (value.length > 160) return false;
  return /^(?:none|(?:inset\s+)?-?[0-9.]+(?:px)?\s+-?[0-9.]+(?:px)?\s+[0-9.]+(?:px)?(?:\s+[0-9.]+(?:px)?)?\s+(?:rgba?\(\s*[0-9.,\s%]{5,40}\)|#[0-9a-f]{3,8}|[a-z]{3,20}))$/i.test(value.trim());
}
function safeStyle(input: string) {
  if (input.length > 1024 || /(?:url\s*\(|@import|expression|javascript:|data:|\\|[<>])/i.test(input)) throw new UnsafeAssessmentSvgError();
  const declarations: string[] = [];
  for (const declaration of input.split(';').map(value => value.trim()).filter(Boolean)) {
    const colon = declaration.indexOf(':');
    if (colon <= 0) throw new UnsafeAssessmentSvgError();
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim();
    if (!STYLE_PROPS.has(property) || !safeStyleValue(property, value)) throw new UnsafeAssessmentSvgError();
    declarations.push(`${property}:${value}`);
  }
  return declarations.join(';');
}
function safeStyleValue(property: string, value: string) {
  if (PAINT_ATTRS.has(property)) return validPaint(value);
  if (property === 'background') return /^(?:none|transparent|#[0-9a-f]{3,8}|white|black)$/i.test(value);
  if (property === 'box-shadow') return validBoxShadow(value);
  if (property === 'border-radius') return /^[0-9.]+(?:px|%)?$/.test(value);
  if (property === 'font-family') return /^[A-Za-z0-9 ,"'-]{1,120}$/.test(value);
  if (property === 'font-weight') return /^(?:normal|bold|[1-9]00)$/.test(value);
  if (property === 'font-style') return /^(?:normal|italic|oblique)$/.test(value);
  if (property === 'stroke-miterlimit') return validNumberList(value);
  if (property === 'text-anchor') return /^(?:start|middle|end)$/.test(value);
  if (property === 'stroke-linecap') return /^(?:butt|round|square)$/.test(value);
  if (property === 'stroke-linejoin') return /^(?:miter|round|bevel|miter-clip|arcs)$/.test(value);
  if (property === 'dominant-baseline') return /^(?:auto|middle|central|hanging|text-before-edge|text-after-edge|alphabetic|ideographic)$/.test(value);
  if (property === 'font-size' || property === 'letter-spacing' || property === 'word-spacing') return /^(?:normal|[0-9eE.+-]+(?:px|em|rem|%)?)$/.test(value);
  return validNumberList(value);
}

function checkAttribute(name: string, value: string, isRoot: boolean): string {
  const lowerName = name.toLowerCase();
  if (lowerName.startsWith('on') || lowerName === 'style' && /(?:url\s*\(|@import|expression|javascript:|data:|\\)/i.test(value)) throw new UnsafeAssessmentSvgError();
  if (lowerName === 'xmlns') {
    if (!isRoot || value !== SVG_NS) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'href' || lowerName === 'xlink:href') {
    if (!/^#[A-Za-z_][\w.-]*$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'id') {
    if (!/^[A-Za-z_][\w.-]{0,127}$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'role') {
    if (value !== 'img') throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'aria-label') {
    if (value.length > 240 || /(?:https?:\/\/|data:|javascript:|[<>])/i.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'aria-labelledby' || lowerName === 'aria-describedby') {
    if (!/^[A-Za-z_][\w.-]*(?:\s+[A-Za-z_][\w.-]*)*$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'style') return safeStyle(value);
  if (PAINT_ATTRS.has(lowerName)) {
    if (!validPaint(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'font-family') {
    if (!/^[A-Za-z0-9 ,"'-]{1,120}$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'font-weight') {
    if (!/^(?:normal|bold|[1-9]00)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'stroke-linecap') {
    if (!/^(?:butt|round|square)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'stroke-linejoin') {
    if (!/^(?:miter|round|bevel|miter-clip|arcs)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'shape-rendering') {
    if (!/^(?:auto|optimizeSpeed|crispEdges|geometricPrecision)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'dominant-baseline') {
    if (!/^(?:auto|middle|central|hanging|text-before-edge|text-after-edge|alphabetic|ideographic)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'letter-spacing' || lowerName === 'word-spacing' || lowerName === 'font-size') {
    if (!/^(?:normal|[0-9eE.+-]+(?:px|em|rem|%)?)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'vector-effect') {
    if (!/^(?:none|non-scaling-stroke)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'font-style') {
    if (!/^(?:normal|italic|oblique)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'stroke-miterlimit') {
    if (!validNumberList(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'patternunits') {
    if (!/^(?:objectBoundingBox|userSpaceOnUse)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'patterntransform') {
    if (!validTransform(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'orient') {
    if (value !== 'auto' && value !== 'auto-start-reverse' && !validNumberList(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (LOCAL_REF_ATTRS.has(lowerName)) {
    if (value === 'none') return value;
    if (/^url\(#[A-Za-z_][\w.-]*\)$/.test(value)) return value;
    if (lowerName === 'filter' && validDropShadow(value)) return value;
    throw new UnsafeAssessmentSvgError();
  }
  if (lowerName === 'text-anchor') {
    if (!/^(?:start|middle|end)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'gradientunits') {
    if (!/^(?:objectBoundingBox|userSpaceOnUse)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'filterunits' || lowerName === 'primitiveunits') {
    if (!/^(?:objectBoundingBox|userSpaceOnUse)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'mode') {
    if (!/^(?:normal|multiply|screen|darken|lighten)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'operator') {
    if (!/^(?:over|in|out|atop|xor|arithmetic)$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'in' || lowerName === 'in2') {
    if (!/^(?:SourceGraphic|SourceAlpha|BackgroundImage|BackgroundAlpha|FillPaint|StrokePaint|[A-Za-z_][\w.-]{0,127})$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (lowerName === 'result') {
    if (!/^[A-Za-z_][\w.-]{0,127}$/.test(value)) throw new UnsafeAssessmentSvgError();
    return value;
  }
  if (NUMERIC_ATTRS.has(name)) {
    const ok = name === 'transform' || name === 'gradientTransform' ? validTransform(value)
      : name === 'viewBox' || name === 'points' || name === 'd' || name === 'stroke-dasharray' ? validNumberList(value) || name === 'stroke-dasharray' && value === 'none' || name === 'd' && /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]+$/.test(value)
      : name === 'preserveAspectRatio' ? /^(?:none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?: meet| slice)?)$/.test(value)
      : name === 'orient' ? value === 'auto' || validNumberList(value)
      : ['x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'offset'].includes(name) ? validNumberList(value, true)
      : validNumberList(value);
    if (!ok) throw new UnsafeAssessmentSvgError();
    return value;
  }
  throw new UnsafeAssessmentSvgError();
}

/** Parse and rebuild only the bounded, self-contained SVG subset used by diagrams/gallery stimuli. */
export function sanitizeAssessmentSvg(source: string): string {
  if (typeof source !== 'string' || source.length === 0 || source.length > MAX_SVG_CHARS) throw new UnsafeAssessmentSvgError();
  const withoutStandardNamespace = source.replace(/xmlns\s*=\s*(["'])http:\/\/www\.w3\.org\/2000\/svg\1/gi, '');
  if (/(?:https?:\/\/|javascript:|data:)/i.test(withoutStandardNamespace)) throw new UnsafeAssessmentSvgError();
  if (/<!\s*(?:doctype|entity)\b|<\?|&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(source)) throw new UnsafeAssessmentSvgError();
  let $: ReturnType<typeof load>;
  try { $ = load(source, { xml: true }); } catch { throw new UnsafeAssessmentSvgError(); }
  const top = $.root().contents().toArray().filter(node => node.type !== 'comment' && !(node.type === 'text' && !(node as any).data.trim()));
  if (top.length !== 1 || top[0].type !== 'tag' || (top[0] as any).name !== 'svg') throw new UnsafeAssessmentSvgError();
  const ids = new Set<string>(), refs: string[] = [];
  let elements = 0;
  const serialize = (node: any, depth: number, root = false): string => {
    if (depth > 32) throw new UnsafeAssessmentSvgError();
    if (node.type === 'text') return escText(String(node.data || ''));
    if (node.type === 'comment') return '';
    if (node.type !== 'tag') throw new UnsafeAssessmentSvgError();
    const tag = String(node.name);
    if (!TAGS.has(tag)) throw new UnsafeAssessmentSvgError();
    if (++elements > 5000) throw new UnsafeAssessmentSvgError();
    const attrs: string[] = [];
    for (const [name, raw] of Object.entries(node.attribs || {})) {
      const value = checkAttribute(name, String(raw), root);
      if (name.toLowerCase() === 'id') {
        if (ids.has(value)) throw new UnsafeAssessmentSvgError();
        ids.add(value);
      }
      if (name.toLowerCase() === 'href' || name.toLowerCase() === 'xlink:href') refs.push(value.slice(1));
      if (name.toLowerCase() === 'aria-labelledby' || name.toLowerCase() === 'aria-describedby') refs.push(...value.split(/\s+/));
      const urlRef = /url\(#[A-Za-z_][\w.-]*\)/g;
      let match: RegExpExecArray | null = urlRef.exec(value);
      while (match) { refs.push(match[0].slice(5, -1)); match = urlRef.exec(value); }
      attrs.push(`${name}="${escAttr(value)}"`);
    }
    if (root && !Object.prototype.hasOwnProperty.call(node.attribs || {}, 'xmlns')) attrs.push(`xmlns="${SVG_NS}"`);
    const children = (node.children || []).map((child: any) => serialize(child, depth + 1)).join('');
    return `<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>${children}</${tag}>`;
  };
  let canonical: string;
  try { canonical = serialize(top[0], 0, true); } catch (error) { throw error; }
  if (!canonical.includes('viewBox=') && !(/\bwidth=/.test(canonical) && /\bheight=/.test(canonical))) throw new UnsafeAssessmentSvgError();
  if (refs.some(id => !ids.has(id))) throw new UnsafeAssessmentSvgError();
  return canonical;
}

export function decodeAssessmentSvgDataUri(value: string): string | null {
  const match = /^data:image\/svg\+xml(?:;charset=[^;,]+)?(?:;utf8)?(;base64)?,(.*)$/is.exec(value);
  if (!match) return null;
  try {
    if (match[1]) {
      const raw = atob(match[2]);
      return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(raw, char => char.charCodeAt(0)));
    }
    return decodeURIComponent(match[2]);
  } catch { throw new UnsafeAssessmentSvgError(); }
}

export function assessmentSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
