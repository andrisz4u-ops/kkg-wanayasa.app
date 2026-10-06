function mark(element, className, safe) {
  if (element && safe(element) && !element.classList.contains(className)) element.classList.add(className);
  return element;
}

function frame(nodes, className, safe) {
  if (!nodes.length || nodes.some(node => !node || !safe(node))) return;
  if (nodes[0].parentElement.classList.contains(className)) return nodes[0].parentElement;
  if (nodes.some(node => node.parentElement !== nodes[0].parentElement)) return;
  const container = document.createElement('div');
  container.className = className;
  nodes[0].before(container);
  for (const node of nodes) container.append(node);
  return container;
}

function section(node, title, safe) {
  if (!node || !safe(node)) return;
  mark(node, 'fc-form-section', safe);
  if (!node.querySelector(':scope > .fc-section-heading')) {
    const heading = document.createElement('h3');
    heading.className = 'fc-section-heading';
    heading.textContent = title;
    node.prepend(heading);
  }
}

export function composeFeatureWorkspace(root, outputSelector) {
  const page = root.dataset.featurePage;
  const safe = element => !element.closest(outputSelector) && !element.querySelector(outputSelector);
  const tag = (selector, name) => mark(root.querySelector(selector), name, safe);
  root.dataset.composition = page;

  if (page === 'rpp') {
    tag('#rpp-form', 'fc-planning-grid');
    const cards = [...root.querySelectorAll('#rpp-form > .rpp-card')];
    ['fc-identity-strip', 'fc-primary-panel', 'fc-options-panel'].forEach((name, index) => mark(cards[index], name, safe));
    tag('.rpp-profil-bar', 'fc-dimensions');
    tag('.rpp-action-center', 'fc-action-dock');
  }
  if (page === 'kisi') {
    tag('.asesmen-grid', 'fc-assessment-grid');
    const cards = [...root.querySelectorAll('.asesmen-grid > .asesmen-card')];
    ['fc-context-panel', 'fc-primary-panel', 'fc-options-panel'].forEach((name, index) => mark(cards[index], name, safe));
    const footer = root.querySelector('#asesmen-form .asesmen-action-footer');
    const target = window.matchMedia('(min-width: 1280px)').matches ? cards[1] : cards[2];
    if (footer && target && safe(footer) && safe(target) && footer.parentElement !== target) target.append(footer);
    const exam = root.querySelector('select[name="jenisUjian"]');
    if (exam?.previousElementSibling?.matches('label')) frame([exam.previousElementSibling, exam], 'fc-exam-field', safe);
    tag('.asesmen-generate-btn', 'fc-wide-action');
  }
  if (page === 'analisis-cp') {
    const form = tag('#analisis-cp-form', 'fc-curriculum-grid');
    const identity = form?.children[0];
    mark(identity, 'fc-curriculum-identity', safe);
    const fields = root.querySelector('#input-nama-sekolah')?.parentElement.parentElement;
    mark(fields, 'fc-curriculum-fields', safe);
  }
  if (page === 'materi') {
    const toolbar = root.querySelector('#filter-search')?.parentElement.parentElement;
    const list = root.querySelector('#materi-list');
    const layout = frame([toolbar, list], 'fc-library-layout', safe);
    if (layout) {
      mark(toolbar, 'fc-filter-rail', safe);
      if (!toolbar.querySelector('.fc-section-heading')) {
        const heading = document.createElement('h2');
        heading.className = 'fc-section-heading'; heading.textContent = 'Temukan materi';
        toolbar.prepend(heading);
      }
    }
  }
  if (page === 'forum') {
    const compose = root.querySelector('#new-thread-modal');
    const list = root.querySelector('#thread-list');
    const conversation = frame([compose, list], 'fc-conversation-layout', safe);
    mark(conversation?.parentElement, 'fc-community-page', safe);
    tag('#thread-list', 'fc-conversation-list');
    tag('#thread-detail', 'fc-reading-panel');
  }
  if (page === 'guru') {
    for (const group of root.querySelectorAll('#guru-list .guru-group')) mark(group, 'fc-directory-group', safe);
  }
  if (page === 'kalender') {
    const body = root.querySelector('#calendar-body');
    mark(body?.parentElement, 'fc-calendar-surface', safe);
    tag('.fw-calendar-toolbar', 'fc-calendar-controls');
  }
  if (page === 'absensi') {
    const list = root.querySelector('#absensi-detail')?.previousElementSibling;
    mark(list, 'fc-attendance-list', safe);
    for (const card of list?.children || []) if (card.querySelector('h3')) mark(card, 'fc-attendance-card', safe);
    tag('#rekap-container', 'fc-reading-panel');
  }
  if (page === 'pengumuman') {
    const modal = root.querySelector('#pengumuman-modal');
    const list = modal?.nextElementSibling;
    mark(list, 'fc-bulletin-grid', safe);
    for (const card of list?.children || []) if (card.querySelector('h2')) mark(card, 'fc-bulletin-card', safe);
  }
  if (page === 'games') {
    const game = root.querySelector('[data-game-id]');
    mark(game?.parentElement.parentElement, 'fc-game-catalog', safe);
    for (const item of root.querySelectorAll('[data-game-id]')) mark(item.closest('.group') || item.parentElement, 'fc-game-card', safe);
    const intro = [...root.querySelectorAll('h2')].find(title => /Game Edukasi Layar Sentuh/.test(title.textContent));
    mark(intro?.parentElement.parentElement, 'fc-game-intro', safe);
  }
  if (page === 'slide') {
    const prompt = root.querySelector('#sg-main-prompt');
    if (prompt) {
      const panel = prompt.parentElement.parentElement;
      mark(panel, 'fc-slide-composer', safe);
      mark(panel.parentElement, 'fc-slide-input-column', safe);
      mark(root.querySelector('.sg-quick-btn')?.parentElement, 'fc-slide-suggestions', safe);
      const intro = root.querySelector('.fw-slide-intro');
      const suggestions = root.querySelector('.sg-quick-btn')?.parentElement;
      frame([intro, panel.parentElement, suggestions], 'fc-slide-landing', safe);
    }
    tag('#sg-outline-list', 'fc-slide-outline');
  }
  if (page === 'program-sekolah') {
    const wizard = root.querySelector('#program-wizard-section');
    mark(wizard, 'fc-program-workspace', safe);
    mark(wizard?.children[0], 'fc-program-selection', safe);
    tag('#specific-form-box', 'fc-program-parameters');
    tag('#template-card-grid', 'fc-program-catalog');
  }
  if (page === 'surat') {
    const form = root.querySelector('#surat-form');
    mark(form, 'fc-letter-form', safe);
    section(root.querySelector('#ai-form-fields'), 'Kegiatan dan pelaksanaan', safe);
    if (form && !form.querySelector('.fc-letter-details')) {
      const first = [...form.children].find(node => node.querySelector('[name="agenda"]') || node.matches('[name="agenda"]'));
      const action = form.querySelector('#generate-btn');
      if (first && action?.parentElement === form) {
        const nodes = [];
        for (let node = first; node && node !== action; node = node.nextElementSibling) nodes.push(node);
        const details = frame(nodes, 'fc-letter-details', safe);
        section(details, 'Isi dan kelengkapan surat', safe);
      }
    }
  }
  if (page === 'proker') {
    const form = root.querySelector('#proker-form');
    mark(form, 'fc-workplan-form', safe);
    const fields = [...(form?.children || [])];
    for (const node of fields) {
      if (node.querySelector('[name="visi"]')) section(node, 'Visi', safe);
      if (node.querySelector('[name="misi"]')) section(node, 'Misi', safe);
      if (node.querySelector('#kegiatan-container')) mark(node, 'fc-workplan-activities', safe);
      if (node.querySelector('[name="analisis_kebutuhan"]')) mark(node, 'fc-workplan-notes', safe);
    }
  }
  if (page === 'laporan') {
    tag('#laporan-main-form', 'fc-report-grid');
    const info = root.querySelector('#input-judul_laporan')?.closest('.fw-panel');
    const model = root.querySelector('#input-ai_model')?.closest('.fw-panel');
    const photos = root.querySelector('#foto-gallery-container')?.closest('.fw-panel');
    mark(info, 'fc-report-info', safe); mark(model, 'fc-report-model', safe); mark(photos, 'fc-report-photos', safe);
    const modelHeading = model?.querySelector('h3');
    if (modelHeading && modelHeading.textContent !== 'Model penyusunan') modelHeading.textContent = 'Model penyusunan';
  }
  if (page === 'profile') {
    const form = root.querySelector('form[onsubmit*="updateProfile"]');
    const column = form?.parentElement.parentElement;
    mark(column?.parentElement, 'fc-account-layout', safe);
    mark(column?.previousElementSibling, 'fc-account-summary', safe);
    mark(column, 'fc-account-forms', safe);
  }
  if (page === 'notifications') {
    tag('#notifications-page-list', 'fc-notification-list');
  }
  if (page === 'tts' || page === 'games') {
    tag('#tts-ai-form', 'fc-tts-form');
    tag('#tts-custom-form', 'fc-tts-custom');
  }
  if (page === 'admin') {
    tag('.control-context-nav', 'fc-control-nav');
    for (const panel of root.querySelectorAll('[id^="panel-"]')) {
      for (const surface of panel.querySelectorAll('.fw-panel')) mark(surface, 'fc-control-surface', safe);
    }
  }
}
