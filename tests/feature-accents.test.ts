import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

const css = readFileSync(join(__dirname, '..', 'src', 'styles', 'feature-accents.css'), 'utf8');
const inputCss = readFileSync(join(__dirname, '..', 'src', 'styles', 'input.css'), 'utf8');
const stylesheet = postcss.parse(css);

function declarationsFor(selector: string) {
  let result: Record<string, string> | undefined;
  stylesheet.walkRules(rule => {
    if (rule.selector === selector) {
      result = Object.fromEntries(rule.nodes.filter(node => node.type === 'decl')
        .map(node => [(node as postcss.Declaration).prop, (node as postcss.Declaration).value]));
    }
  });
  return result;
}

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c;
  const rgb = [0, 2, 4].map(i => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('aksen warna per fitur', () => {
  it('diimpor setelah classroom-slides agar menimpa gaya lama', () => {
    expect(inputCss).toContain(`@import './feature-accents.css';`);
    expect(inputCss.indexOf(`@import './feature-accents.css';`)).toBeGreaterThan(
      inputCss.indexOf(`@import './classroom-slides.css';`),
    );
  });

  it('mendefinisikan token aksen untuk lima halaman fitur', () => {
    for (const page of ['rpp', 'kisi', 'analisis-cp', 'slide', 'games']) {
      expect(css).toContain(`[data-feature-page="${page}"]`);
      expect(css).toContain('--page-accent');
      expect(css).toContain('--page-soft');
      expect(css).toContain('--page-ink');
    }
  });

  it('mewarnai CTA, progres, kepala halaman, dan badge tiap fitur', () => {
    expect(css).toContain('#btn-generate-rpp');
    expect(css).toContain('.asesmen-generate-btn');
    expect(css).toContain('#btn-submit-generate');
    expect(css).toContain('.fw-progress-fill');
    expect(css).toContain('.fs-eyebrow');
    expect(css).toContain('.fw-badge');
  });

  it('uses one approved green palette for all eight profile tags and their selected state', () => {
    const baseSelector = '.feature-workspace[data-feature-page="rpp"] #profil-tags .rpp-tag';
    const selectedSelector = '.feature-workspace[data-feature-page="rpp"] #profil-tags .rpp-tag.active';
    expect(declarationsFor(baseSelector)).toMatchObject({ background: '#dff0e4', 'border-color': '#166534', color: '#14532d' });
    expect(declarationsFor(selectedSelector)).toMatchObject({ background: '#166534', 'border-color': '#166534', color: '#fff' });
    expect(css).not.toMatch(/#profil-tags\s+\.rpp-tag:nth-child\(/);
    expect(css).not.toMatch(/#profil-tags\s+\.rpp-tag\s*\{[^}]*nth-child/i);
  });

  it('memberi cip ikon berwarna pada pintasan Beranda', () => {
    for (const tool of ['rpp', 'analisis-cp', 'kisi', 'slide', 'absensi', 'materi', 'forum', 'games']) {
      expect(css).toContain(`[data-tool="${tool}"]`);
    }
  });

  it('semua pasangan teks dan latar memenuhi kontras WCAG AA 4.5:1', () => {
    const pairs: Array<[string, string, string]> = [
      ['CTA RPP putih di #176b4b', '#ffffff', '#176b4b'],
      ['CTA Asesmen putih di #92400e', '#ffffff', '#92400e'],
      ['CTA Asesmen hover putih di #a84e0b', '#ffffff', '#a84e0b'],
      ['CTA RPP gelap putih di #176b4b', '#ffffff', '#176b4b'],
      ['CTA Asesmen gelap putih di #92400e', '#ffffff', '#92400e'],
      ['CTA Asesmen gelap putih di #6b300a', '#ffffff', '#6b300a'],
      ['CTA CP gelap putih di #0f766e', '#ffffff', '#0f766e'],
      ['CTA Slide gelap putih di #7e22ce', '#ffffff', '#7e22ce'],
      ['CTA Slide gelap putih di #5b21b6', '#ffffff', '#5b21b6'],
      ['CTA CP putih di #0f766e', '#ffffff', '#0f766e'],
      ['CTA Slide putih di #7e22ce', '#ffffff', '#7e22ce'],
      ['tag Profil Lulusan', '#14532d', '#dff0e4'],
      ['tag Profil Lulusan terpilih', '#ffffff', '#166534'],
      ['cip RPP', '#176b4b', '#dff0e4'],
      ['cip CP', '#0f766e', '#d3f0ec'],
      ['cip Asesmen', '#92400e', '#fdeecd'],
      ['cip Slide', '#7e22ce', '#ead9fb'],
      ['cip Presensi', '#3730a3', '#e0e7ff'],
      ['cip Materi', '#0369a1', '#e0f2fe'],
      ['cip Forum', '#be185d', '#fce7f3'],
      ['cip Game', '#4338ca', '#ddd7ff'],
    ];
    for (const [label, fg, bg] of pairs) {
      expect(ratio(fg, bg), `${label}: ${fg} di atas ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('terbatas pada @media screen agar tidak menyentuh cetak/unduhan', () => {
    expect(css).toContain('@media screen');
    expect(css).not.toContain('@media print');
  });
});
