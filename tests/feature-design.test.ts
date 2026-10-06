import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import { mountFeatureDesign, OUTPUT_SURFACES } from '../public/static/js/feature-design.js';

afterEach(() => {
  mountFeatureDesign('home', document.body);
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Feature design boundaries', () => {
  it('distinguishes the library empty state from resource cards', () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><div id="materi-list"><div class="text-center"><h3>Belum ada materi</h3></div><div class="bg-white rounded-xl p-6"><h3>Materi</h3><button>Buka</button></div></div></main></div>';
    mountFeatureDesign('materi', document.getElementById('app'));
    expect(document.querySelector('#materi-list > div')!.classList.contains('fs-empty')).toBe(true);
    expect(document.querySelector('#materi-list > div')!.classList.contains('fs-collection-item')).toBe(false);
    expect(document.querySelectorAll('.fs-collection-item')).toHaveLength(1);
  });

  it('gives feature headings one meaningful category without replacing their actions', () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><div class="wk-page"><div><div class="rpp-header"><h1 class="rpp-title">Buat RPP</h1><button id="history">Riwayat</button></div></div></div></main></div>';
    const button = document.getElementById('history');
    const listener = vi.fn();
    button!.addEventListener('click', listener);
    mountFeatureDesign('rpp', document.getElementById('app'));
    mountFeatureDesign('rpp', document.getElementById('app'));
    expect(document.querySelectorAll('.fs-eyebrow')).toHaveLength(1);
    expect(document.querySelector('.fs-eyebrow')!.textContent).toBe('Perencanaan pembelajaran');
    expect(document.getElementById('main-content')!.dataset.studioKind).toBe('generator');
    expect(document.getElementById('history')).toBe(button);
    button!.click();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('adds collection styling to async items while keeping output markup intact', async () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><div id="thread-list"></div><div id="analisis-canvas"><h1>Hasil</h1><p>Dokumen</p></div></main></div>';
    const before = document.getElementById('analisis-canvas')!.outerHTML;
    mountFeatureDesign('forum', document.getElementById('app'));
    const article = document.createElement('article');
    article.innerHTML = '<h3>Diskusi</h3><button>Buka</button>';
    document.getElementById('thread-list')!.append(article);
    await vi.waitFor(() => expect(article.classList.contains('fs-collection-item')).toBe(true));
    expect(document.getElementById('analisis-canvas')!.outerHTML).toBe(before);
  });

  it('limits studio rules to screen media and styled UI markers', () => {
    const css = postcss.parse(readFileSync(resolve('src/styles/feature-studio.css'), 'utf8'));
    css.walkRules(rule => {
      let parent = rule.parent;
      while (parent && !(parent.type === 'atrule' && parent.name === 'media' && parent.params === 'screen')) parent = parent.parent;
      expect(parent, rule.selector).toBeTruthy();
      expect(rule.selector).toContain('.feature-workspace');
    });
  });

  it('preserves submitted field values, options, validation, and existing events', () => {
    document.body.innerHTML = `<div id="app"><main id="main-content"><div class="wk-page"><div>
      <div class="flex"><h1>RPP</h1><button id="archive" onclick="openArchive()">Riwayat</button></div>
      <form id="form"><div class="rpp-card"><label>Topik</label>
        <input name="topik" value="Pecahan" required maxlength="80">
        <select name="semester"><option value="Ganjil">Ganjil</option><option value="Genap" selected>Genap</option></select>
        <textarea name="cp">Membandingkan pecahan</textarea><button type="submit" id="generate">Buat RPP</button>
      </div></form></div></div></main></div>`;
    const form = document.querySelector('form')!;
    const before = [...new FormData(form).entries()];
    const options = document.querySelector('select')!.innerHTML;
    const clicked = vi.fn();
    document.getElementById('generate')!.addEventListener('click', event => { event.preventDefault(); clicked(); });
    mountFeatureDesign('rpp', document.getElementById('app'));
    expect([...new FormData(form).entries()]).toEqual(before);
    expect(document.querySelector('select')!.innerHTML).toBe(options);
    expect(document.querySelector('input')!.required).toBe(true);
    expect(document.querySelector('input')!.maxLength).toBe(80);
    expect(document.getElementById('archive')!.getAttribute('onclick')).toBe('openArchive()');
    document.getElementById('generate')!.click();
    expect(clicked).toHaveBeenCalledOnce();
    expect(document.querySelectorAll('.fw-field')).toHaveLength(3);
  });

  it('leaves output DOM and its inherited ancestors unmarked', () => {
    const ids = ['rpp-canvas', 'lampiran-canvas', 'asesmen-canvas', 'analisis-canvas', 'program-canvas',
      'laporan-printable-area', 'surat-result', 'proker-result', 'sppd-rendered-preview',
      'tts-canvas', 'sg-canvas-container', 'sg-slide-render-area', 'sg-fullscreen-container', 'game-active-container'];
    document.body.innerHTML = `<div id="app"><main id="main-content"><div class="bg-white rounded-xl p-6 border" id="output-parent">
      ${ids.map(id => `<div id="${id}" class="original"><h1>Hasil dokumen</h1><p class="text-slate-500">Isi</p><label>Jawaban</label><input name="hasil" value="1"><button>Cetak</button><svg><text>Visual</text></svg></div>`).join('')}
      <div class="sg-thumbnail-item"><h2>Slide</h2></div></div></main></div>`;
    const outputBefore = ids.map(id => document.getElementById(id)!.outerHTML);
    const parentClass = document.getElementById('output-parent')!.className;
    mountFeatureDesign('kisi', document.getElementById('app'));
    expect(ids.map(id => document.getElementById(id)!.outerHTML)).toEqual(outputBefore);
    expect(document.getElementById('output-parent')!.className).toBe(parentClass);
    expect(document.querySelector('.sg-thumbnail-item')!.innerHTML).toBe('<h2>Slide</h2>');
    expect([...document.querySelectorAll(OUTPUT_SURFACES)].some(el => el.querySelector('[class*="fw-"]'))).toBe(false);
    expect([...document.querySelectorAll(OUTPUT_SURFACES)].some(el => el.querySelector('.os-reveal'))).toBe(false);
  });

  it('styles newly opened UI dialogs without touching their generated output', async () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><h1>Asesmen</h1></main></div>';
    mountFeatureDesign('kisi', document.getElementById('app'));
    const dialog = document.createElement('div');
    dialog.id = 'test-modal';
    dialog.innerHTML = '<div class="bg-white rounded-xl p-6"><input id="dialog-input" value="Materi"><div id="asesmen-canvas"><h2>Hasil</h2></div></div>';
    document.body.append(dialog);
    await vi.waitFor(() => expect(document.getElementById('dialog-input')!.classList.contains('fw-field')).toBe(true));
    expect(document.getElementById('asesmen-canvas')!.outerHTML).toBe('<div id="asesmen-canvas"><h2>Hasil</h2></div>');
    mountFeatureDesign('home', document.getElementById('app'));
    dialog.innerHTML = '<input id="after-navigation">';
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(document.getElementById('after-navigation')!.className).toBe('');
  });

  it('keeps public home and legal pages outside the feature theme', () => {
    for (const page of ['home', 'privacy', 'terms']) {
      document.body.innerHTML = '<div id="app"><h1 class="original">Publik</h1><input class="original"></div>';
      const app = document.getElementById('app')!;
      const html = app.outerHTML;
      mountFeatureDesign(page, app);
      expect(app.outerHTML).toBe(html);
    }
  });

  it('finds a generator header beside protected previews without styling their shared ancestor', () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><div id="shared"><div id="header"><div><h1>Generator Surat</h1><p>Susun surat</p></div><button>Riwayat</button></div><form><input value="Workshop"></form><div id="surat-result"><h2>Hasil</h2></div></div></main></div>';
    const output = document.getElementById('surat-result')!.outerHTML;
    mountFeatureDesign('surat', document.getElementById('app'));
    expect(document.getElementById('header')!.classList.contains('fs-heading')).toBe(true);
    expect(document.getElementById('shared')!.className).toBe('');
    expect(document.getElementById('surat-result')!.outerHTML).toBe(output);
  });

  it('restores UI styling after existing tab handlers replace control classes', async () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><button id="tab" class="bg-white">Bulan</button></main></div>';
    mountFeatureDesign('kalender', document.getElementById('app'));
    const tab = document.getElementById('tab')!;
    tab.className = 'bg-blue-600 text-white';
    await vi.waitFor(() => expect(tab.classList.contains('fw-action')).toBe(true));
    expect(tab.classList.contains('bg-blue-600')).toBe(true);
    expect(tab.textContent).toBe('Bulan');
  });

  it('removes presentation markers from ancestors when output is inserted later', async () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><div id="panel" class="bg-white rounded-xl p-6 border"><input value="Topik"></div></main></div>';
    mountFeatureDesign('slide', document.getElementById('app'));
    const panel = document.getElementById('panel')!;
    expect(panel.classList.contains('fw-panel')).toBe(true);
    expect(panel.classList.contains('os-reveal')).toBe(true);
    const output = document.createElement('div');
    output.id = 'sg-slide-render-area';
    output.innerHTML = '<h2>Materi slide</h2>';
    panel.append(output);
    await vi.waitFor(() => expect(panel.classList.contains('fw-panel')).toBe(false));
    expect(panel.classList.contains('os-reveal')).toBe(false);
    expect([...panel.classList].some(name => name.startsWith('os-step-'))).toBe(false);
    expect(output.outerHTML).toBe('<div id="sg-slide-render-area"><h2>Materi slide</h2></div>');
  });

  it('limits staggered entry to five safe surfaces and keeps repeated decoration idempotent', () => {
    document.body.innerHTML = `<div id="app"><main id="main-content"><div><h1>Bank materi</h1></div>
      ${Array.from({ length: 8 }, (_, index) => `<section class="bg-white rounded-xl p-6 border"><h2>Bidang ${index}</h2><input value="${index}"></section>`).join('')}
      <div class="bg-white rounded-xl p-6 border" id="protected"><div id="rpp-canvas">Dokumen</div></div>
    </main></div>`;
    const app = document.getElementById('app')!;
    mountFeatureDesign('materi', app);
    const entrance = [...document.querySelectorAll('.os-reveal')];
    expect(entrance).toHaveLength(5);
    const classes = entrance.map(element => element.className);
    mountFeatureDesign('materi', app);
    expect([...document.querySelectorAll('.os-reveal')].map(element => element.className)).toEqual(classes);
    expect(document.getElementById('protected')!.classList.contains('os-reveal')).toBe(false);
  });

  it('keeps every new style rule inside screen media so print styles remain intact', () => {
    const css = postcss.parse(readFileSync(resolve('src/styles/features.css'), 'utf8'));
    css.walkRules(rule => {
      let parent = rule.parent;
      let screenOnly = false;
      while (parent) {
        if (parent.type === 'atrule' && parent.name === 'media' && parent.params === 'screen') screenOnly = true;
        parent = parent.parent;
      }
      expect(screenOnly, rule.selector).toBe(true);
    });
  });
});
