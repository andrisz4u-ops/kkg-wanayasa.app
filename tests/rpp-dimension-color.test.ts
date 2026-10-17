import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { state } from '../public/static/js/state.js';
import { renderRpp } from '../public/static/js/pages/rpp.js';

const accentSheet = postcss.parse(readFileSync('src/styles/feature-accents.css', 'utf8'));

function declarationsFor(selector: string) {
  let declarations: Record<string, string> | undefined;
  accentSheet.walkRules(rule => {
    if (rule.selector === selector) {
      declarations = Object.fromEntries(rule.nodes
        .filter(node => node.type === 'decl')
        .map(node => [(node as postcss.Declaration).prop, (node as postcss.Declaration).value]));
    }
  });
  return declarations;
}

describe('RPP graduate profile dimension colors', () => {
  it('uses the shared light-green palette for all eight choices and dark green when selected', async () => {
    state.user = { id: 7, role: 'user', nama: 'Guru Uji', sekolah_nama: 'SD Uji', kelas: '5' };
    const root = document.createElement('div');
    root.innerHTML = await renderRpp();
    const tags = [...root.querySelectorAll<HTMLButtonElement>('#profil-tags .rpp-tag')];

    expect(tags).toHaveLength(8);
    expect(tags.every(tag => tag.type === 'button')).toBe(true);
    expect(tags.map(tag => tag.dataset.dim)).toEqual([
      'Keimanan & Ketakwaan', 'Kewargaan', 'Penalaran Kritis', 'Kreativitas',
      'Kolaborasi', 'Kemandirian', 'Kesehatan', 'Komunikasi',
    ]);

    const base = declarationsFor('.feature-workspace[data-feature-page="rpp"] #profil-tags .rpp-tag');
    expect(base).toMatchObject({ background: '#dff0e4', 'border-color': '#166534', color: '#14532d' });
    const selected = declarationsFor('.feature-workspace[data-feature-page="rpp"] #profil-tags .rpp-tag.active');
    expect(selected).toMatchObject({ background: '#166534', 'border-color': '#166534', color: '#fff' });
    expect(accentSheet.toString()).not.toMatch(/#profil-tags \.rpp-tag:nth-child/);
  });
});
