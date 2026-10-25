// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeAssessmentImages } from '../src/lib/assessment-image-durability';
import { normalizeAssetUrls, preparePackageContent } from '../src/lib/assessment-packages';
import { sanitizeAssessmentSvg } from '../src/lib/assessment-package-svg';
import { validatedAssessmentVisualSpec } from '../src/lib/assessment-visual-spec';
import { generateVisualStimulus, getRegisteredVisualTypes, type VisualStimulusConfig } from '../src/lib/visual-engine';

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Unexpected renderer-spec network request'); })));
afterEach(() => {
  const fetch = globalThis.fetch;
  vi.unstubAllGlobals();
  expect(fetch).not.toHaveBeenCalled();
});

async function roundTrip(spec: VisualStimulusConfig) {
  const rendered = generateVisualStimulus(spec)!;
  expect(rendered?.svg).toBeTruthy();
  const expectedSvg = sanitizeAssessmentSvg(rendered.svg);
  const content = { pg: [{ no: 1, soal: 'Perhatikan diagram berikut.', visual_stimulus: spec,
    gambar: { type: 'svg', svg: rendered.svg, url: rendered.dataUri } }] };
  const first = await normalizeAssessmentImages({} as D1Database, 7, content);
  const second = await normalizeAssessmentImages({} as D1Database, 7, structuredClone(first.content));
  expect(first.warnings).toEqual([]);
  expect(second.warnings).toEqual([]);
  expect(first.stagedAssets.size).toBe(0);
  expect(second.stagedAssets.size).toBe(0);
  expect(second.content).toEqual(first.content);
  const prepared = preparePackageContent(second.content);
  const savedAgain = preparePackageContent(prepared.json);
  const reloaded = normalizeAssetUrls(JSON.parse(savedAgain.json), 31);
  const reloadedAgain = normalizeAssetUrls(reloaded.content, 31);
  expect(prepared.warnings).toEqual([]);
  expect(savedAgain.warnings).toEqual([]);
  expect(reloaded.warnings).toEqual([]);
  expect(reloadedAgain.warnings).toEqual([]);
  expect(savedAgain.json).toBe(prepared.json);
  expect(reloaded.content).toEqual(prepared.content);
  expect(reloadedAgain.content).toEqual(reloaded.content);
  expect(reloaded.content.pg[0].gambar.svg).toBe(expectedSvg);
  expect(reloaded.content.pg[0].gambar.imageUnavailable).toBeUndefined();
  return reloaded.content.pg[0];
}

describe('bounded assessment renderer specifications', () => {
  it('recognizes every registered renderer and alias, including the two uncatalogued renderers', () => {
    const unsupported = getRegisteredVisualTypes().filter(type => !validatedAssessmentVisualSpec({ type, params: {} }));
    expect(unsupported).toEqual([]);
  });

  it.each(['unknown', 'perisai-pancasila', 'pola_warna_extra', ' balok ', 'constructor', '__proto__', 'toString'])('rejects unregistered type %s without fuzzy matching', type => {
    expect(validatedAssessmentVisualSpec({ type, params: {}, trustedSvg: true })).toBeNull();
  });

  it.each([
    { type: 'prisma_segitiga', params: { alas: 6, tinggiSegitiga: 8, panjang: 12, unit: 'cm' } },
    { type: 'jajargenjang', params: { alas: 15, tinggi: 10, unit: 'cm' } },
    { type: 'pecahan_campuran', params: { pembagi: 4, diarsir: 3, utuh: 2 } },
    { type: 'bar_chart', params: { judul: 'Data Kelas', labels: ['A', 'B'], data: [2, 4] } },
  ])('preserves the exact parameters and rendered meaning of $type through repeated server preparation', async spec => {
    const item = await roundTrip(spec);
    expect(item.visual_stimulus).toEqual(spec);
  });

  it.each(['pola_warna', 'urutan_warna', 'barisan_warna'])('retains the explicit color-pattern schema for %s', async type => {
    const spec = { type, params: { pola: ['ungu', 'putih', 'hijau', 'ungu'], bentuk: 'kotak', label: '?' } };
    const item = await roundTrip(spec);
    expect(item.visual_stimulus).toEqual(spec);
    expect(item.gambar.svg).toContain('Ungu');
    expect(item.gambar.svg).toContain('Putih');
    const clean = validatedAssessmentVisualSpec({ type, params: { ...spec.params, custom: 4, showAll: true, svg: '<svg/>', url: 'https://invalid.test' } });
    expect(clean).toEqual(spec);
  });

  it.each(['perangkat_komputer', 'komponen_komputer', 'sistem_komputer', 'cpu', 'monitor_komputer'])('retains the explicit computer schema and alias title for %s', async type => {
    const spec = { type, params: { pointer: 'keyboard', label: 'Y' } };
    const item = await roundTrip(spec);
    expect(item.visual_stimulus).toEqual(spec);
    expect(item.gambar.svg).toContain('x1="140" y1="185" x2="175" y2="165"');
  });

  it.each([1, 2, 3, 4, 5])('preserves numeric/string sila %s with both showAll modes', async sila => {
    const coords = { 1: '564.8,322', 2: '615,380', 3: '615,265', 4: '515,265', 5: '515,380' };
    for (const selection of [sila, String(sila)]) {
      for (const showAll of [false, true]) {
        const item = await roundTrip({ type: 'perisai_pancasila', params: { sila: selection, label: 'Y', showAll } });
        expect(item.visual_stimulus).toEqual({ type: 'perisai_pancasila', params: { sila, label: 'Y', showAll } });
        if (showAll) expect(item.gambar.svg).not.toContain('marker-end="url(#arrOfficial)"');
        else {
          const [x, y] = coords[sila as keyof typeof coords].split(',');
          expect(item.gambar.svg).toContain(`<circle cx="${x}" cy="${y}" r="26"`);
        }
      }
    }
  });

  it.each([
    { type: 'pancasila', params: { sila: 'kepala_banteng', label: 'X', showAll: false } },
    { type: 'garuda_pancasila', params: { pointer: 'padi dan kapas', label: 'Y', showAll: false } },
    { type: 'lambang_pancasila', params: { sila: 'Ketuhanan Yang Maha Esa', label: 'X', showAll: true } },
  ])('preserves supported textual Pancasila selection fields for $type', async spec => {
    expect((await roundTrip(spec)).visual_stimulus).toEqual(spec);
  });

  it('coerces decimal strings only at known numeric leaves, including nested fields and arrays', () => {
    expect(validatedAssessmentVisualSpec({ type: 'BALOK', params: { p: '12', l: ' 8.5 ', t: '+6e0', unit: '007', other: '9' } }))
      .toEqual({ type: 'balok', params: { p: 12, l: 8.5, t: 6, unit: '007' } });
    expect(validatedAssessmentVisualSpec({ type: 'kartesius', params: { titik: [{ x: '-2.5', y: '+.3e2', label: '4', url: 'https://invalid.test' }] } }))
      .toEqual({ type: 'kartesius', params: { titik: [{ x: -2.5, y: 30, label: '4' }] } });
    expect(validatedAssessmentVisualSpec({ type: 'bar_chart', params: { labels: ['1', '02'], data: ['0', '1.25e2'] } }))
      .toEqual({ type: 'bar_chart', params: { labels: ['1', '02'], data: [0, 125] } });
    expect(validatedAssessmentVisualSpec({ type: 'rangkaian', params: { s1: 'false', s2: false, trusted: true } }))
      .toEqual({ type: 'rangkaian', params: { s2: false } });
    expect(validatedAssessmentVisualSpec({ type: 'pancasila', params: { sila: '4', label: 4, showAll: 'true' } }))
      .toEqual({ type: 'pancasila', params: { sila: 4 } });
  });

  it.each(['', ' ', '0x10', '12cm', 'NaN', 'Infinity', '1e309', '1000001', true, false, null, [], {}, Number.NaN, Infinity, -1_000_001])('rejects invalid numeric input %j instead of generic Number coercion', value => {
    expect(validatedAssessmentVisualSpec({ type: 'balok', params: { p: value, l: 0, t: -1 } }))
      .toEqual({ type: 'balok', params: { l: 0, t: -1 } });
  });

  it.each(['<svg onload="evil()"/>', 'https://evil.invalid/x', 'http:evil', '//evil.invalid', 'www.evil.invalid', 'evil.invalid', 'data:image/svg+xml,x', 'javascript:evil()', 'blob:private', 'file:private', 'onload=evil()', 'x\u0000y'])('drops unsafe text and captions: %s', text => {
    expect(validatedAssessmentVisualSpec({ type: 'balok', params: { p: 12, unit: text }, caption: text }))
      .toEqual({ type: 'balok', params: { p: 12 } });
  });

  it('bounds arrays, text and aggregate specifications and ignores inherited or unknown fields', () => {
    expect(validatedAssessmentVisualSpec({ type: 'pola_warna', params: { pola: Array(65).fill('biru'), bentuk: 'triangle', label: 'x'.repeat(121) } }))
      .toEqual({ type: 'pola_warna', params: {} });
    expect(validatedAssessmentVisualSpec({ type: 'pola_warna', params: { pola: ['biru', '<script/>', 'hijau'] } }))
      .toEqual({ type: 'pola_warna', params: {} });
    expect(validatedAssessmentVisualSpec({ type: 'bar_chart', params: { labels: Array(64).fill('x'.repeat(120)), data: Array(64).fill(1_000_000) } })).toBeNull();
    const params = Object.assign(Object.create({ p: 99 }), JSON.parse('{"l":8,"t":6,"__proto__":{"p":100},"constructor":{"prototype":{"trusted":true}},"trusted":true,"showAll":true}'));
    expect(validatedAssessmentVisualSpec({ type: 'balok', params, trustedSvg: true, svg: '<svg/>' }))
      .toEqual({ type: 'balok', params: { l: 8, t: 6 } });
  });
});

describe('renderer specs across signed-URL and raw-SVG boundaries', () => {
  it.each(['X-Amz-Signature', 'x-amz-expires', 'X-Amz-Credential'])('rebuilds valid independent specs while discarding %s URLs without fetching', key => {
    const content = {
      pg: [{ no: 1, soal: 'Perhatikan pola warna.', visual_stimulus: { type: 'urutan_warna', params: { pola: ['ungu', 'putih', 'ungu'], label: '?' }, caption: 'Pola Kelas' } }],
      isian: { data: [{ no: 2, soal: 'Perhatikan gambar komputer.', visual_stimulus: { type: 'perangkat_komputer', params: { pointer: 'monitor', label: 'X' } } }] },
      uraian: [{ no: 3, soal: 'Perhatikan perisai.', visual_stimulus: { type: 'pancasila', params: { sila: '4', showAll: true, label: 'Y' } } }],
    };
    const items: any[] = [content.pg[0], content.isian.data[0], content.uraian[0]];
    for (const item of items) item.gambar = { url: `https://signed.invalid/private?other=1&${key}=secret`, alt: 'Diagram kelas', src: 'https://signed.invalid/alias', trustedSvg: true, imageUnavailable: true };
    const original = structuredClone(content);
    const result = normalizeAssetUrls(content, 31);
    expect(content).toEqual(original);
    expect(result.warnings).toEqual([]);
    expect(JSON.stringify(result.content)).not.toMatch(/signed\.invalid|secret|trustedSvg|imageUnavailable/);
    for (const item of [result.content.pg[0], result.content.isian.data[0], result.content.uraian[0]]) {
      expect(item.gambar).toMatchObject({ type: 'svg', alt: 'Diagram kelas' });
      expect(item.gambar.svg).toBe(sanitizeAssessmentSvg(generateVisualStimulus(item.visual_stimulus)!.svg));
    }
    expect(result.content.pg[0].visual_stimulus.caption).toBe('Pola Kelas');
    expect(result.content.uraian[0].visual_stimulus.params).toEqual({ sila: 4, label: 'Y', showAll: true });
    const prepared = preparePackageContent(result.content);
    expect(preparePackageContent(prepared.json).json).toBe(prepared.json);
    expect(normalizeAssetUrls(prepared.content, 31).content).toEqual(result.content);
  });

  it('keeps signed images without a recognized renderer explicitly unavailable despite trust flags', async () => {
    const input = { pg: [{ no: 1, soal: 'Perhatikan gambar berikut.', visual_stimulus: { type: 'pola-warna', params: {}, trustedSvg: true },
      gambar: { url: 'https://signed.invalid/private?X-Amz-Signature=secret', trustedSvg: true } }] };
    const result = normalizeAssetUrls(input, 31);
    expect(result.content.pg[0].gambar).toEqual({ imageUnavailable: true, imageUnavailableReason: 'expired_or_missing' });
    expect(result.content.pg[0].visual_stimulus).toBeUndefined();
    expect(result.warnings).toHaveLength(1);
    expect(JSON.stringify(result)).not.toMatch(/signed\.invalid|secret|trustedSvg/);
    const durable = await normalizeAssessmentImages({} as D1Database, 7, result.content);
    expect(durable.content.pg[0].gambar.imageUnavailable).toBe(true);
    expect(durable.stagedAssets.size).toBe(0);
  });

  it.each([
    '<svg viewBox="0 0 10 10"><script>evil()</script></svg>',
    '<svg viewBox="0 0 10 10"><rect onload="evil()"/></svg>',
    '<svg viewBox="0 0 10 10"><foreignObject><div>evil</div></foreignObject></svg>',
    '<svg viewBox="0 0 10 10"><a href="https://evil.invalid/x"><text>x</text></a></svg>',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///private">]><svg viewBox="0 0 10 10">&x;</svg>',
  ])('still rejects malicious raw SVG on save and marks it unavailable on read: %s', async svg => {
    for (const visual_stimulus of [undefined, { type: 'garuda_pancasila', params: { sila: '4', showAll: true } }]) {
      const input = { pg: [{ no: 1, soal: 'Perhatikan gambar berikut.', visual_stimulus,
        gambar: { svg, url: 'https://signed.invalid/private?X-Amz-Signature=secret', trustedSvg: true } }] };
      expect(() => preparePackageContent(input)).toThrow('untrusted_svg');
      // A valid spec must not bypass validation of supplied raw SVG on read.
      if (visual_stimulus) {
        const result = normalizeAssetUrls(input, 31);
        expect(result.content.pg[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'untrusted_svg' });
        expect(result.content.pg[0].visual_stimulus).toBeUndefined();
        expect(JSON.stringify(result)).not.toMatch(/evil|signed\.invalid|secret|trustedSvg/);
      } else {
        const durable = await normalizeAssessmentImages({} as D1Database, 7, structuredClone(input));
        expect(durable.content.pg[0].gambar.imageUnavailableReason).toBe('untrusted_svg');
        expect(durable.content.pg[0].visual_stimulus).toBeUndefined();
      }
    }
  });

  it('does not accept encoded SVG aliases or top-level SVG bytes through a valid renderer spec', () => {
    const svg = '<svg viewBox="0 0 10 10"><rect onload="evil()"/></svg>';
    const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    for (const alias of ['url', 'dataUri', 'src', 'gambar', 'data']) {
      expect(() => preparePackageContent({ pg: [{ no: 1, visual_stimulus: { type: 'cpu', params: {} }, gambar: { [alias]: encoded } }] })).toThrow('untrusted_svg');
    }
    expect(() => preparePackageContent({ pg: [{ no: 1, visual_stimulus: { type: 'pancasila', params: {} }, svg }] })).toThrow('untrusted_svg');
  });
});
