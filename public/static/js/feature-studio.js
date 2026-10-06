import { composeFeatureWorkspace } from './feature-composition.js';

const sections = {
  rpp: ['generator', 'Perencanaan pembelajaran'],
  'analisis-cp': ['generator', 'Pemetaan kurikulum'],
  kisi: ['generator', 'Evaluasi pembelajaran'],
  slide: ['generator', 'Media presentasi'],
  'program-sekolah': ['generator', 'Program satuan pendidikan'],
  surat: ['generator', 'Korespondensi KKG'],
  proker: ['generator', 'Perencanaan kegiatan'],
  laporan: ['generator', 'Dokumentasi kegiatan'],
  tts: ['generator', 'Media latihan'],
  materi: ['library', 'Perpustakaan bersama'],
  guru: ['library', 'Jejaring pendidik'],
  forum: ['community', 'Percakapan komunitas'],
  pengumuman: ['community', 'Informasi komunitas'],
  kalender: ['agenda', 'Agenda komunitas'],
  absensi: ['agenda', 'Kehadiran kegiatan'],
  games: ['play', 'Belajar melalui permainan'],
  profile: ['account', 'Identitas pendidik'],
  notifications: ['account', 'Kabar untuk Anda'],
  admin: ['control', 'Pengelolaan komunitas'],
};

function mark(element, name) {
  if (element && !element.classList.contains(name)) element.classList.add(name);
}

export function enhanceFeatureStudio(root, outputSelector) {
  const config = sections[root.dataset.featurePage];
  if (!config) return;
  root.dataset.studioKind = config[0];
  const safe = element => !element.closest(outputSelector) && !element.querySelector(outputSelector);
  if (!root.querySelector('.fw-hero, .fw-slide-intro, .control-context-header')) {
    const title = [...root.querySelectorAll('h1')].find(safe);
    if (title) {
      let header = title.parentElement;
      while (header.parentElement && header.parentElement !== root && safe(header.parentElement)
        && !header.parentElement.querySelector('form, input, select, textarea, article, h2, h3, [role="dialog"], [id$="-modal"], #calendar-body, #guru-list, #materi-list, #thread-list, #notifications-page-list, #absensi-detail')) header = header.parentElement;
      if (header !== root && safe(header)) {
        for (const nested of header.querySelectorAll('.fw-page-heading')) nested.classList.remove('fw-page-heading', 'fs-heading');
        mark(header, 'fw-page-heading');
      }
    }
  }
  for (const header of root.querySelectorAll('.fw-hero, .fw-page-heading, .fw-slide-intro, .control-context-header')) {
    if (config[0] === 'control' && !header.matches('.control-context-header')) continue;
    if (!safe(header) || !header.querySelector('h1, h2')) continue;
    mark(header, 'fs-heading');
    if (!header.querySelector(':scope > .fs-eyebrow')) {
      const label = document.createElement('span');
      label.className = 'fs-eyebrow';
      label.textContent = config[1];
      header.prepend(label);
    }
  }
  for (const fieldId of ['filter-search', 'guru-search']) {
    const field = root.querySelector(`#${fieldId}`);
    if (!field) continue;
    const toolbar = fieldId === 'filter-search' ? field.parentElement.parentElement : field.parentElement;
    if (safe(toolbar)) mark(toolbar, 'fs-search-toolbar');
  }
  for (const card of root.querySelectorAll('#materi-list > div, #thread-list > article, #guru-list .guru-group .grid > div, [data-game-id], .template-card[data-id]')) {
    if (!safe(card)) continue;
    if (card.matches('#materi-list > .text-center') && card.querySelector('h3')) {
      mark(card, 'fs-empty');
      continue;
    }
    if (card.matches('#materi-list > div') && !card.querySelector('h3')) continue;
    mark(card, 'fs-collection-item');
  }
  composeFeatureWorkspace(root, outputSelector);
  const entranceSelector = '.fs-heading, .fw-panel, .fs-search-toolbar';
  const entrance = [...root.querySelectorAll(entranceSelector)]
    .filter(element => safe(element) && !element.parentElement?.closest(entranceSelector))
    .slice(0, 5);
  entrance.forEach((element, index) => {
    mark(element, 'os-reveal');
    mark(element, `os-step-${index}`);
  });
}
