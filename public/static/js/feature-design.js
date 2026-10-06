import { arrangeFeatureForms } from './feature-forms.js';
import { enhanceFeatureControls } from './feature-controls.js';
import { enhanceFeatureStudio } from './feature-studio.js';

const FEATURE_PAGES = new Set([
  'rpp', 'kisi', 'slide', 'analisis-cp', 'program-sekolah', 'surat', 'proker',
  'laporan', 'absensi', 'materi', 'guru', 'forum', 'pengumuman', 'kalender',
  'profile', 'notifications', 'games', 'tts', 'admin', 'login', 'reset-password'
]);

// These surfaces also supply document exports or classroom presentation content.
export const OUTPUT_SURFACES = [
  '#rpp-canvas', '#lampiran-canvas', '#asesmen-canvas', '#analisis-canvas',
  '#program-canvas', '#laporan-printable-area', '#surat-result', '#proker-result',
  '#sppd-rendered-preview', '#tts-canvas', '#interactive-tts-modal', '#sg-canvas-container',
  '#sg-slide-render-area', '#sg-fullscreen-container', '.sg-thumbnail-item',
  '.sg-editable', '[contenteditable="true"]', 'svg', 'canvas:not(#activity-chart):not(#member-chart)', 'iframe',
  '#game-active-container:not(:has(#tts-ai-form))'
].join(',');

const HERO_SELECTORS = [
  '.rpp-header', '.asesmen-header', '#analisis-form-view > div:first-child',
  '#program-sekolah-page > div:first-child', '#panel-dashboard > div:first-child'
].join(',');
const FLOATING_SURFACES = '#kkg-archive-drawer-root, #loading-overlay, .soal-editor-overlay, [id$="-modal"], [id$="-modal-root"]';
let observer;
let floatingObserver;
let pendingFrame;
let layoutQuery;
let layoutChanged;

function isOutput(element) {
  return Boolean(element.closest(OUTPUT_SURFACES) || element.closest('[data-ai-job-ui]'));
}

function canStyle(element) {
  return !isOutput(element) && !element.querySelector(OUTPUT_SURFACES);
}

function mark(element, className) {
  if (!element.classList.contains(className)) element.classList.add(className);
}

function decorate(root) {
  arrangeFeatureForms(root, root.dataset.featurePage, OUTPUT_SURFACES);
  enhanceFeatureControls(root, root.dataset.featurePage || 'dialog', `${OUTPUT_SURFACES}, [data-ai-job-ui]`);
  for (const element of root.querySelectorAll('[class*="fw-"]')) {
    if (!canStyle(element)) {
      for (const className of [...element.classList]) {
        if (className.startsWith('fw-')) element.classList.remove(className);
      }
    }
  }
  for (const element of root.querySelectorAll('[class*="fs-"]')) {
    if (!canStyle(element)) {
      for (const className of [...element.classList]) {
        if (className.startsWith('fs-')) element.classList.remove(className);
      }
      element.querySelector(':scope > .fs-eyebrow')?.remove();
    }
  }
  for (const element of root.querySelectorAll('[class*="fc-"]')) {
    if (!canStyle(element)) {
      for (const className of [...element.classList]) {
        if (className.startsWith('fc-')) element.classList.remove(className);
      }
    }
  }
  for (const element of root.querySelectorAll('[class*="os-"]')) {
    if (!canStyle(element)) {
      for (const className of [...element.classList]) {
        if (className.startsWith('os-')) element.classList.remove(className);
      }
    }
  }
  const calendarTitle = root.querySelector('#calendar-title');
  if (calendarTitle) {
    mark(calendarTitle.parentElement, 'fw-calendar-navigation');
    mark(calendarTitle.parentElement.parentElement, 'fw-calendar-toolbar');
  }
  const programMode = root.querySelector('#program-generate-mode-select');
  if (programMode) mark(programMode.parentElement, 'fw-wrap-row');
  for (const [buttonId, formId] of [['tab-login', 'login-form'], ['tab-register', 'register-form']]) {
    const button = root.querySelector(`#${buttonId}`);
    const form = root.querySelector(`#${formId}`);
    if (!button || !form) continue;
    if (!form.classList.contains('hidden')) mark(button, 'fw-current');
    else if (button.classList.contains('fw-current')) button.classList.remove('fw-current');
  }

  for (const hero of root.querySelectorAll(HERO_SELECTORS)) {
    if (canStyle(hero)) mark(hero, 'fw-hero');
  }

  const title = [...root.querySelectorAll('h1')].find(canStyle);
  if (title) {
    mark(title, 'fw-title');
    if (!title.closest('.fw-hero, #slidegen-root') && !['login', 'reset-password'].includes(root.dataset.featurePage)) {
      const container = root.querySelector('.wk-page > div') || root.querySelector(':scope > div > div') || root;
      let header = title.parentElement;
      while (header?.parentElement && header.parentElement !== container && header.parentElement !== root) {
        header = header.parentElement;
      }
      if (header && header !== root && canStyle(header)) mark(header, 'fw-page-heading');
    }
  }

  for (const element of root.querySelectorAll('div, section, article, aside, header, main, form, button, a, input, select, textarea, label, h2, h3, h4, p, span, strong, small, i, th, td')) {
    if (!canStyle(element)) continue;
    mark(element, 'fw-ui');
    const tag = element.tagName;
    const classes = [...element.classList];

    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
      if (!['hidden', 'checkbox', 'radio', 'range', 'file', 'color'].includes(element.type)) mark(element, 'fw-field');
      else if (['checkbox', 'radio', 'range'].includes(element.type)) mark(element, 'fw-choice');
    } else if (tag === 'BUTTON' || (tag === 'A' && classes.some(c => c.startsWith('btn')))) {
      mark(element, 'fw-action');
    } else if (tag === 'LABEL' && !element.querySelector('input')) {
      mark(element, 'fw-label');
    } else if (['H2', 'H3', 'H4'].includes(tag)) {
      mark(element, 'fw-section-title');
    } else if (['P', 'SPAN', 'STRONG', 'SMALL'].includes(tag)) {
      const semanticColor = classes.some(c => /^text-(red|rose|amber|yellow|green|emerald)-/.test(c));
      if (!semanticColor && (tag === 'P' || classes.some(c => /^text-(gray|slate|white|transparent|teal|cyan|blue|indigo|purple|pink|\[var)/.test(c)))) mark(element, 'fw-copy');
      if (tag === 'SPAN' && !semanticColor && classes.some(c => c.startsWith('bg-')) && classes.some(c => c.startsWith('rounded'))) mark(element, 'fw-badge');
      if (classes.some(c => /^text-(green|emerald)-/.test(c)) && classes.some(c => c.startsWith('bg-'))) mark(element, 'fw-status');
    } else if (tag === 'I' && !classes.includes('fa-spinner')) {
      if (element.closest('h1, h2, h3, h4, .fw-hero')) mark(element, 'fw-heading-icon');
    } else if (['TH', 'TD'].includes(tag)) {
      mark(element, tag === 'TH' ? 'fw-table-heading' : 'fw-table-cell');
    } else {
      if (classes.some(c => /^text-(gray|slate|teal|cyan|blue|indigo|purple|pink|\[var)/.test(c))) mark(element, 'fw-copy');
      if (element.parentElement?.classList.contains('grid') || element.parentElement?.classList.contains('flex')) mark(element, 'fw-layout-item');
      const rounded = classes.some(c => c.startsWith('rounded'));
      const padding = classes.some(c => /^p-[4568]|^p-10|^p-12|^px-[68]/.test(c));
      const surface = classes.some(c => /^bg-(white|gray|slate|surface|\[var)/.test(c));
      const border = classes.some(c => /^border($|-)/.test(c));
      const darkHeader = tag === 'HEADER' && classes.some(c => /^bg-(slate|gray)-(8|9)/.test(c));
      if (!rounded && (darkHeader || (classes.includes('text-white') && classes.some(c => c.includes('bg-gradient')) && element.querySelector('h2, h3')))) mark(element, 'fw-dark-bar');
      if ((rounded && surface && (padding || border)) || classes.includes('rpp-card') || classes.includes('asesmen-card')) {
        mark(element, 'fw-panel');
      }
      if (classes.some(c => c.includes('bg-gradient')) && !element.closest('.fw-hero') && rounded && canStyle(element)) {
        mark(element, 'fw-tint');
      }
      if (rounded && border && classes.some(c => /^bg-(indigo|purple|blue|pink|cyan)-/.test(c))) mark(element, 'fw-tint');
      if (classes.includes('pointer-events-none') && (classes.some(c => c.startsWith('absolute') || c.startsWith('fixed')))) {
        if (element.closest('.fw-hero') || classes.some(c => c.includes('blur') || c.includes('-z-10'))) mark(element, 'fw-decoration');
      }
      if (classes.includes('overflow-x-auto')) {
        mark(element, 'fw-table-scroll');
        if (element.querySelector('table')) {
          element.tabIndex = 0;
          element.setAttribute('role', 'region');
          if (!element.hasAttribute('aria-label')) element.setAttribute('aria-label', 'Tabel data, gulir untuk melihat seluruh kolom');
        }
      }
    }
  }
  enhanceFeatureStudio(root, OUTPUT_SURFACES);
  let level = 1;
  for (const heading of root.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    if (!canStyle(heading) || heading.closest('.hidden, [hidden]') || heading.closest('details:not([open]) > :not(summary)')) continue;
    let visible = true;
    for (let node = heading; node && node !== root; node = node.parentElement) {
      if (getComputedStyle(node).display === 'none') { visible = false; break; }
    }
    if (!visible) continue;
    const current = Number(heading.tagName.slice(1));
    const next = current === 1 ? 1 : Math.min(current, level + 1);
    if (next !== current) {
      const replacement = document.createElement(`h${next}`);
      for (const attribute of heading.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...heading.childNodes);
      heading.replaceWith(replacement);
    }
    level = next;
  }
}

export function mountFeatureDesign(page, app) {
  if (layoutQuery && layoutChanged) layoutQuery.removeEventListener('change', layoutChanged);
  layoutQuery = undefined;
  layoutChanged = undefined;
  observer?.disconnect();
  floatingObserver?.disconnect();
  if (pendingFrame) cancelAnimationFrame(pendingFrame);
  pendingFrame = undefined;
  if (!FEATURE_PAGES.has(page)) return;

  const root = app.querySelector('#main-content') || app;
  root.classList.add('feature-workspace');
  root.dataset.featurePage = page;
  decorate(root);

  const refresh = () => {
    decorate(root);
    for (const floating of document.querySelectorAll(FLOATING_SURFACES)) {
      if (!app.contains(floating) && !isOutput(floating)) {
        mark(floating, 'feature-workspace');
        decorate(floating);
      }
    }
  };
  if (page === 'kisi') {
    layoutQuery = window.matchMedia('(min-width: 1280px)');
    layoutChanged = () => { if (root.isConnected) refresh(); };
    layoutQuery.addEventListener('change', layoutChanged);
  }

  observer = new MutationObserver(records => {
    const uiChanged = records.some(record => !isOutput(record.target) && (
      record.type === 'attributes'
        ? record.oldValue !== record.target.getAttribute(record.attributeName)
        : [...record.addedNodes].some(node => node.nodeType === 1 && !node.closest('[data-ai-job-ui]'))
    ));
    if (!uiChanged || pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = undefined;
      if (root.isConnected) refresh();
    });
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'open', 'hidden'] });
  floatingObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1 || app.contains(node) || isOutput(node)) continue;
        if (node.matches(FLOATING_SURFACES)) {
          mark(node, 'feature-workspace');
          decorate(node);
          observer.observe(node, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'open', 'hidden'] });
        }
      }
    }
  });
  floatingObserver.observe(document.body, { childList: true });
}
