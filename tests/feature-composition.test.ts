import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { composeFeatureWorkspace } from '../public/static/js/feature-composition.js';
import { arrangeFeatureForms } from '../public/static/js/feature-forms.js';
import { OUTPUT_SURFACES } from '../public/static/js/feature-design.js';

function mount(page: string, html: string) {
  document.body.innerHTML = `<main data-feature-page="${page}">${html}</main>`;
  return document.querySelector('main')!;
}

describe('Feature composition preserves existing contracts', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('moves the one assessment submit across breakpoints without losing form data or its listener', () => {
    let wide = true;
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: wide })));
    const root = mount('kisi', '<form id="asesmen-form"><div class="asesmen-grid"><div class="asesmen-card"><input name="namaSekolah" value="SD Uji"></div><div class="asesmen-card"><textarea name="topik" required>Pecahan</textarea></div><div class="asesmen-card"><input name="jumlahPG" value="10"><div class="asesmen-action-footer"><button class="asesmen-generate-btn" type="submit">Buat Asesmen</button></div></div></div></form><div id="asesmen-canvas"><h2>Dokumen</h2></div>');
    const form = root.querySelector('form')!;
    const cards = root.querySelectorAll('.asesmen-card');
    const button = root.querySelector<HTMLButtonElement>('.asesmen-generate-btn')!;
    const fields = [...form.querySelectorAll('input, textarea')];
    const before = [...new FormData(form).entries()];
    const output = root.querySelector('#asesmen-canvas')!.outerHTML;
    const submitted = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', submitted);
    for (const isWide of [true, false, true]) {
      wide = isWide;
      composeFeatureWorkspace(root, OUTPUT_SURFACES);
      expect(button.closest('.asesmen-card')).toBe(cards[isWide ? 1 : 2]);
      expect(button.form).toBe(form);
      expect(root.querySelectorAll('.asesmen-generate-btn')).toHaveLength(1);
      expect([...form.querySelectorAll('input, textarea')]).toEqual(fields);
      expect([...new FormData(form).entries()]).toEqual(before);
      expect(root.querySelector('#asesmen-canvas')!.outerHTML).toBe(output);
      const composed = root.innerHTML;
      composeFeatureWorkspace(root, OUTPUT_SURFACES);
      expect(root.innerHTML).toBe(composed);
      button.click();
    }
    expect(submitted).toHaveBeenCalledTimes(3);
  });

  it('groups letter fields without replacing controls, values, validation or submit listeners', () => {
    const root = mount('surat', '<form id="surat-form"><div id="ai-form-fields"><input name="tanggal" value="2026-10-03"></div><div><label for="agenda">Agenda</label><textarea id="agenda" name="agenda" required>Rapat\nDiskusi</textarea></div><div><select name="model"><option value="bedrock" selected>Bedrock</option></select><input type="checkbox" name="struktur" checked></div><button id="generate-btn" type="submit">Buat</button></form><div id="surat-result"><h2>Dokumen</h2></div>');
    const form = root.querySelector('form')!;
    const values = [...new FormData(form).entries()];
    const controls = [...form.elements];
    const output = root.querySelector('#surat-result')!.outerHTML;
    const submitted = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', submitted);
    composeFeatureWorkspace(root, OUTPUT_SURFACES);
    const first = root.innerHTML;
    composeFeatureWorkspace(root, OUTPUT_SURFACES);
    expect(root.innerHTML).toBe(first);
    expect([...form.elements]).toEqual(controls);
    expect([...new FormData(form).entries()]).toEqual(values);
    expect(form.querySelector('textarea')!.required).toBe(true);
    expect(root.querySelector('#surat-result')!.outerHTML).toBe(output);
    (form.querySelector('button') as HTMLButtonElement).click();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('keeps CP cards and generation action in place while reusing the original model selector', () => {
    const root = mount('analisis-cp', '<form id="analisis-cp-form"><div><div><div><input id="input-nama-sekolah" name="namaSekolah" value="SDN"></div><div><div id="preview-cp-summary">Rumusan resmi</div><button id="btn-toggle-cp-details" type="button">Lihat rincian</button></div></div><details class="fw-disclosure"><summary>AI</summary><select id="analisis-ai-model-select" name="model"><option selected>Bedrock</option></select></details></div><div id="source"><button id="btn-submit-generate">Buat Sekarang</button></div><div id="review"><textarea name="bab">Bab 1</textarea></div></form><div id="analisis-canvas"><p>Hasil</p></div>');
    const form = root.querySelector('form')!;
    const cards = [...form.children];
    const fields = [...new FormData(form).entries()];
    const model = root.querySelector('#analisis-ai-model-select');
    composeFeatureWorkspace(root, OUTPUT_SURFACES);
    composeFeatureWorkspace(root, OUTPUT_SURFACES);
    expect([...form.children]).toEqual(cards);
    expect([...new FormData(form).entries()]).toEqual(fields);
    expect(root.querySelector('#analisis-ai-model-select')).toBe(model);
    expect(root.querySelector('#source')!.contains(root.querySelector('#btn-submit-generate'))).toBe(true);
    expect(root.querySelectorAll('.fc-curriculum-reference')).toHaveLength(0);
    expect(root.querySelector('#preview-cp-summary')!.closest('details')).toBeNull();
    expect(root.querySelector('#analisis-canvas')!.outerHTML).toBe('<div id="analisis-canvas"><p>Hasil</p></div>');
  });

  it('keeps all three generator cards visible and keeps the CP action inside Review Struktur Bab', () => {
    const fixtures = [
      ['rpp', '<form id="rpp-form"><div class="rpp-card"><h3>Identitas</h3><input name="namaSekolah" value="SDN"></div><div class="rpp-card"><h3>Kurikulum</h3><input name="topik" required></div><div class="rpp-card"><h3>Strategi</h3><select name="aiProvider"><option selected>Bedrock</option></select></div><div class="rpp-profil-bar"><button type="button" class="rpp-tag" data-dim="Kolaborasi">Kolaborasi</button></div></form><div class="rpp-action-center"><button id="btn-generate-rpp">Buat RPP</button></div>', '#rpp-form', '.rpp-card', '#btn-generate-rpp'],
      ['kisi', '<form id="asesmen-form"><div class="asesmen-grid"><div class="asesmen-card"><h3>Identitas</h3><input name="namaSekolah" value="SDN"><input name="namaGuru" value="Guru"></div><div class="asesmen-card"><h3>Kurikulum & Materi</h3><textarea name="topik" required></textarea></div><div class="asesmen-card"><h3>Karakteristik</h3><select name="aiProvider"><option selected>Bedrock</option></select></div></div><button class="asesmen-generate-btn" type="submit">Buat asesmen</button></form>', '.asesmen-grid', '.asesmen-card', '.asesmen-generate-btn'],
      ['analisis-cp', '<form id="analisis-cp-form"><div><h3>Identitas Dokumen</h3><div><div><input id="input-nama-sekolah" name="namaSekolah" value="SDN"></div><div id="preview-cp-summary">Rumusan CP</div></div><select id="analisis-ai-model-select" name="aiProvider"><option selected>Bedrock</option></select></div><div><h3>Sumber Buku Ajar</h3><input name="sumberBuku" value="Buku guru"></div><div><h3>Review Struktur Bab</h3><button id="btn-submit-generate" type="submit">Buat Sekarang</button></div></form>', '#analisis-cp-form', '#analisis-cp-form > div', '#btn-submit-generate'],
    ] as const;
    for (const [page, html, gridSelector, cardSelector, actionSelector] of fixtures) {
      const root = mount(page, html);
      const form = root.querySelector('form')!;
      const values = [...new FormData(form).entries()];
      const controls = [...form.elements];
      arrangeFeatureForms(root, page, OUTPUT_SURFACES);
      composeFeatureWorkspace(root, OUTPUT_SURFACES);
      const first = root.innerHTML;
      arrangeFeatureForms(root, page, OUTPUT_SURFACES);
      composeFeatureWorkspace(root, OUTPUT_SURFACES);
      expect(root.innerHTML).toBe(first);
      expect(root.querySelectorAll(cardSelector)).toHaveLength(3);
      expect(root.querySelector(gridSelector)!.children).toHaveLength(page === 'rpp' ? 4 : 3);
      expect([...form.elements]).toEqual(controls);
      expect([...new FormData(form).entries()]).toEqual(values);
      expect(root.querySelector(actionSelector)).toBeTruthy();
      if (page === 'rpp' || page === 'kisi') {
        expect(root.querySelector('input[name="namaSekolah"]')!.closest('details')).toBeNull();
        expect(root.querySelector('select[name="aiProvider"]')!.closest('details')).toBeNull();
        if (page === 'rpp') {
          expect(form.lastElementChild).toBe(root.querySelector('.fc-dimensions'));
          expect(form.querySelector('.rpp-tag')?.getAttribute('type')).toBe('button');
        }
      } else {
        expect(root.querySelector('#preview-cp-summary')!.closest('details')).toBeNull();
        expect(root.querySelector('#analisis-cp-form')!.lastElementChild!.contains(root.querySelector('#btn-submit-generate'))).toBe(true);
        expect(root.querySelectorAll('.fw-cp-generate-action')).toHaveLength(1);
      }
    }
  });

  it('retains filter listeners and list identity when creating the library layout', () => {
    const root = mount('materi', '<div><div><div><input id="filter-search" value="Matematika"></div><select id="filter-jenis"><option selected>RPP</option></select></div><div id="materi-list"><div><h3>Materi</h3></div></div><div id="upload-materi-modal" class="hidden"></div></div>');
    const field = root.querySelector('#filter-search')!;
    const list = root.querySelector('#materi-list')!;
    const onInput = vi.fn(); field.addEventListener('input', onInput);
    composeFeatureWorkspace(root, OUTPUT_SURFACES);
    const html = root.innerHTML;
    composeFeatureWorkspace(root, OUTPUT_SURFACES);
    expect(root.innerHTML).toBe(html);
    expect(root.querySelector('#materi-list')).toBe(list);
    expect(root.querySelectorAll('#filter-search')).toHaveLength(1);
    field.dispatchEvent(new Event('input'));
    expect(onInput).toHaveBeenCalledOnce();
  });

  it('leaves the game arena and generated documents outside composition markers', () => {
    for (const page of ['games', 'rpp', 'laporan', 'program-sekolah', 'surat', 'slide']) {
      const root = mount(page, '<div id="game-active-container"><div id="rpp-form" class="rpp-grid"><div class="rpp-card"><h3>Document</h3></div></div><button data-game-id="math">Game</button><div id="surat-form"><div id="ai-form-fields"><input name="prompt"></div></div></div>');
      const output = root.innerHTML;
      composeFeatureWorkspace(root, OUTPUT_SURFACES);
      expect(root.innerHTML).toBe(output);
    }
  });

  it('keeps composition CSS scoped to screen and explicit UI markers', () => {
    const sheet = postcss.parse(readFileSync('src/styles/feature-composition.css', 'utf8'));
    sheet.walkRules(rule => {
      expect(rule.selector).toContain('.feature-workspace[data-composition]');
      let parent = rule.parent; let screen = false;
      while (parent) {
        if (parent.type === 'atrule' && parent.name === 'media' && parent.params === 'screen') screen = true;
        parent = parent.parent;
      }
      expect(screen).toBe(true);
    });
  });
});
