import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { state } from '../public/static/js/state.js';
import { renderRpp } from '../public/static/js/pages/rpp.js';
import { renderKisi } from '../public/static/js/pages/kisi.js';
import { renderAnalisisCp } from '../public/static/js/pages/analisis-cp.js';
import { mountFeatureDesign } from '../public/static/js/feature-design.js';
import { openUiDialog, closeUiDialog } from '../public/static/js/ui-dialog.js';
import { renderAdminLayout, syncAdminContext } from '../public/static/js/layouts/admin.js';
import { mountWorkspaceLayout } from '../public/static/js/layouts/workspace.js';
import { navigate, readAdminPanelLocation, updateAdminPanelLocation } from '../public/static/js/router.js';

vi.mock('../public/static/js/api.js', () => ({ api: vi.fn(async () => ({ data: [] })) }));
vi.mock('../public/static/js/asesmen-docx.js', () => ({ generateAsesmenDocx: vi.fn(), preloadAsesmenImages: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"data":[]}', { status: 200 })));
  state.user = { id: 7, role: 'user', nama: 'Guru Uji', sekolah_nama: 'SD Uji', kelas: '5' };
});
afterEach(() => {
  closeUiDialog();
  mountFeatureDesign('home', document.body);
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Refined teacher forms', () => {
  it('keeps the original CP submit action inside Review Struktur Bab without losing form behavior', async () => {
    document.body.innerHTML = `<div id="app"><main id="main-content">${await renderAnalisisCp()}</main></div>`;
    const form = document.querySelector('#analisis-cp-form')! as HTMLFormElement;
    const action = form.querySelector('#btn-submit-generate')! as HTMLButtonElement;
    const listener = vi.fn();
    action.addEventListener('click', event => { event.preventDefault(); listener(); });
    const before = [...new FormData(form).entries()];
    mountFeatureDesign('analisis-cp', document.getElementById('app'));
    expect(form.children[2].querySelector('#btn-submit-generate')).toBe(action);
    expect(action.textContent!.trim()).toBe('Buat Sekarang');
    expect(action.type).toBe('submit');
    expect(action.form).toBe(form);
    expect([...new FormData(form).entries()]).toEqual(before);
    action.click();
    expect(listener).toHaveBeenCalledOnce();
    mountFeatureDesign('analisis-cp', document.getElementById('app'));
    expect(form.querySelectorAll('.fw-cp-generate-action')).toHaveLength(1);
  });

  it('names dynamically loaded admin selection controls by their row', () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><input id="pending-check-all" type="checkbox"><table><tbody id="panel-users-tbody"><tr><td><input type="checkbox"></td><td><span>D</span><p>Dewi</p></td></tr></tbody></table></main></div>';
    mountFeatureDesign('admin', document.getElementById('app'));
    expect(document.querySelector('#pending-check-all')!.getAttribute('aria-label') || document.querySelector('label')!.textContent).toContain('menunggu persetujuan');
    expect(document.querySelector('td input')!.getAttribute('aria-label')).toBe('Pilih pengguna Dewi');
  });

  it('keeps mobile history actions named when their text is hidden', () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><button><i class="fas fa-folder"></i><span class="hidden sm:inline">Riwayat Saya</span></button></main></div>';
    mountFeatureDesign('analisis-cp', document.getElementById('app'));
    expect(document.querySelector('button')!.getAttribute('aria-label')).toBe('Riwayat Saya');
  });

  it('allows template selection by keyboard and updates its pressed state', async () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><div class="template-card border-indigo-600" data-id="a">Template A</div><div class="template-card" data-id="b">Template B</div></main></div>';
    const cards = [...document.querySelectorAll('.template-card')];
    cards[1].addEventListener('click', () => {
      cards[0].classList.remove('border-indigo-600');
      cards[1].classList.add('border-indigo-600');
    });
    mountFeatureDesign('program-sekolah', document.getElementById('app'));
    expect(cards[1].getAttribute('role')).toBe('button');
    cards[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(cards[1].getAttribute('aria-pressed')).toBe('true'));
    expect(cards[0].getAttribute('aria-pressed')).toBe('false');
  });

  it.each([
    ['rpp', renderRpp, '#rpp-form'],
    ['kisi', renderKisi, '#asesmen-form'],
    ['analisis-cp', renderAnalisisCp, '#analisis-cp-form'],
  ])('preserves actual %s form values, defaults, choices and original controls', async (page, renderer, selector) => {
    document.body.innerHTML = `<div id="app"><main id="main-content">${await renderer()}</main></div>`;
    const form = document.querySelector(selector)! as HTMLFormElement;
    const fields = [...form.querySelectorAll('input, select, textarea')];
    const before = [...new FormData(form).entries()];
    const options = [...form.querySelectorAll('select')].map(select => select.innerHTML);
    const rules = fields.map(field => [field.getAttribute('name'), field.getAttribute('required'), field.getAttribute('min'), field.getAttribute('max')]);
    const originalListener = vi.fn();
    fields[0].addEventListener('change', originalListener);
    mountFeatureDesign(page, document.getElementById('app'));
    expect([...new FormData(form).entries()]).toEqual(before);
    expect([...form.querySelectorAll('select')].map(select => select.innerHTML)).toEqual(options);
    expect(fields.map(field => [field.getAttribute('name'), field.getAttribute('required'), field.getAttribute('min'), field.getAttribute('max')])).toEqual(rules);
    expect(fields.every(field => form.contains(field))).toBe(true);
    fields[0].dispatchEvent(new Event('change', { bubbles: true }));
    expect(originalListener).toHaveBeenCalledOnce();
    const visibleFields = fields.filter(field => field.getAttribute('type') !== 'hidden');
    expect(visibleFields.every(field => (field as HTMLInputElement).labels?.length || field.hasAttribute('aria-label') || field.hasAttribute('aria-labelledby'))).toBe(true);
    if (page === 'analisis-cp') {
      expect(form.querySelector('#preview-cp-summary')!.closest('details')).toBeNull();
      expect(form.lastElementChild!.contains(form.querySelector('#btn-submit-generate'))).toBe(true);
    } else {
      expect(form.querySelector('input[name="namaSekolah"]')!.closest('details')).toBeNull();
      expect(form.querySelector('select[name="aiProvider"]')!.closest('details')).toBeNull();
    }
    for (const details of form.querySelectorAll('details')) (details as HTMLDetailsElement).open = true;
    expect([...new FormData(form).entries()]).toEqual(before);
  });

  it('opens a collapsed required field on invalid without changing its validation rule', async () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><form><details><summary>Identitas</summary><label>Nama</label><input name="nama" required></details></form></main></div>';
    mountFeatureDesign('profile', document.getElementById('app'));
    const form = document.querySelector('form')!;
    const input = document.querySelector('input')!;
    expect(form.checkValidity()).toBe(false);
    expect(document.querySelector('details')!.open).toBe(true);
    await vi.waitFor(() => expect(document.querySelector('.fw-error-summary')?.textContent).toContain('Nama'));
    input.value = 'Dewi';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.required).toBe(true);
    expect(form.checkValidity()).toBe(true);
    expect(document.querySelector('.fw-error-summary')).toBe(null);
  });

  it('keeps output markup intact even if a document title matches a UI selector', () => {
    document.body.innerHTML = '<div id="app"><main id="main-content"><div id="rpp-canvas"><h1 class="rpp-title">Judul hasil</h1><label>Jawaban</label><input value="Isi"></div></main></div>';
    const before = document.getElementById('rpp-canvas')!.outerHTML;
    mountFeatureDesign('rpp', document.getElementById('app'));
    expect(document.getElementById('rpp-canvas')!.outerHTML).toBe(before);
  });

  it('keeps all refinement styles inside screen media', () => {
    const css = postcss.parse(readFileSync('src/styles/workspace-refinement.css', 'utf8'));
    css.walkRules(rule => {
      let parent = rule.parent;
      let screen = false;
      while (parent) {
        if (parent.type === 'atrule' && parent.name === 'media' && parent.params === 'screen') screen = true;
        parent = parent.parent;
      }
      expect(screen, rule.selector).toBe(true);
    });
  });
});

describe('Calendar dialog keyboard behavior', () => {
  it('restores a stable menu trigger when the action that opened the dialog is hidden', () => {
    document.body.innerHTML = '<button id="menu-trigger">Menu akun</button><div class="hidden"><button id="menu-action">Pasang aplikasi</button></div><div id="guide" class="hidden"><button id="guide-close">Tutup</button></div>';
    const trigger = document.getElementById('menu-trigger')!;
    const dialog = document.getElementById('guide')!;
    document.getElementById('menu-action')!.focus();
    openUiDialog(dialog, { initialFocus: '#guide-close', returnFocus: trigger });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(trigger);
    expect(trigger.hasAttribute('inert')).toBe(false);
  });

  it('keeps a nested preview isolated and restores the catalog before its original trigger', () => {
    document.body.innerHTML = '<main><button id="catalog-trigger">Katalog</button></main><aside inert>Sudah inert</aside><div id="catalog" class="hidden"><h2 id="catalog-title">Katalog visual</h2><input id="catalog-search"><button id="preview-trigger">Pratinjau</button></div><div id="preview" class="hidden"><h2 id="preview-title">Pratinjau visual</h2><button id="preview-close">Tutup</button></div>';
    const catalog = document.getElementById('catalog')!;
    const preview = document.getElementById('preview')!;
    document.getElementById('catalog-trigger')!.focus();
    openUiDialog(catalog, { labelledBy: 'catalog-title', initialFocus: '#catalog-search' });
    document.getElementById('preview-trigger')!.focus();
    openUiDialog(preview, { labelledBy: 'preview-title', initialFocus: '#preview-close', nested: true });
    expect(catalog.hasAttribute('inert')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement?.id).toBe('preview-close');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(preview.classList.contains('hidden')).toBe(true);
    expect(catalog.classList.contains('hidden')).toBe(false);
    expect(catalog.hasAttribute('inert')).toBe(false);
    expect(document.querySelector('main')!.hasAttribute('inert')).toBe(true);
    expect(document.activeElement?.id).toBe('preview-trigger');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(document.activeElement?.id).toBe('catalog-trigger');
    expect(document.querySelector('main')!.hasAttribute('inert')).toBe(false);
    expect(document.querySelector('aside')!.hasAttribute('inert')).toBe(true);
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus inside, cycles it, closes with Escape and restores background state and trigger', () => {
    document.body.innerHTML = '<main><button id="trigger">Tambah kegiatan</button><aside inert>Sudah inert</aside><div id="dialog" class="hidden"><h2 id="title">Kegiatan</h2><input id="name"><button id="last">Batal</button></div></main>';
    const trigger = document.getElementById('trigger')!;
    const dialog = document.getElementById('dialog')!;
    trigger.focus();
    openUiDialog(dialog, { labelledBy: 'title', initialFocus: '#name' });
    expect(document.activeElement?.id).toBe('name');
    expect(trigger.hasAttribute('inert')).toBe(true);
    document.getElementById('last')!.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('name');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(dialog.classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(trigger.hasAttribute('inert')).toBe(false);
    expect(document.querySelector('aside')!.hasAttribute('inert')).toBe(true);
    expect(document.body.style.overflow).toBe('');
  });
});

describe('Administration in the shared workspace', () => {
  it('contains unbalanced feature markup without moving mobile navigation outside the workspace content', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.getElementById('app');
    mountWorkspaceLayout(app, { content: '<section>Konten</section></div></main></div></div>', page: 'admin', meta: {title: 'Panel kontrol'}, name: 'KKG', topNav: '', sidebarNav: '', mobileNav: '', bottomNav: '<nav class="wk-bottom-nav">Menu ponsel</nav>', aiSheet: '', notificationBell: '' });
    expect(document.querySelector('.wk-content > .wk-bottom-nav')).not.toBe(null);
    expect(document.querySelector('#main-content #page-content-wrapper section')?.textContent).toBe('Konten');
    expect(document.querySelector('.wk-content > .wk-workspace-body')).not.toBe(null);
  });

  it.each(['admin', 'super_admin', 'operator'])('retains role-specific context destinations for %s without a second sidebar', role => {
    state.user.role = role;
    document.body.innerHTML = renderAdminLayout('<section id="content">Contenu</section>', 'users');
    expect(document.querySelector('.control-sidebar')).toBe(null);
    expect(document.getElementById('content')).not.toBe(null);
    expect(document.querySelectorAll('[data-control-tab]')).toHaveLength(role === 'operator' ? 4 : 8);
    if (role === 'operator') expect(document.getElementById('tab-ai-providers')).toBe(null);
    syncAdminContext('sekolah');
    expect(document.querySelector('[aria-current="page"]')?.id).toBe('tab-sekolah');
  });

  it('shows no administration controls to a teacher', () => {
    document.body.innerHTML = renderAdminLayout('<form>Rahasia</form>');
    expect(document.querySelectorAll('[data-control-tab]')).toHaveLength(0);
    expect(document.body.textContent).toContain('Akses ditolak');
  });
  it('retains a shareable panel location and ignores unrecognized panels', () => {
    state.currentAdminTab = 'users';
    navigate('admin');
    expect(readAdminPanelLocation()).toBe('users');
    updateAdminPanelLocation('sekolah');
    expect(window.location.search).toBe('?panel=sekolah');
    updateAdminPanelLocation('unknown');
    expect(readAdminPanelLocation()).toBe('sekolah');
  });
});
