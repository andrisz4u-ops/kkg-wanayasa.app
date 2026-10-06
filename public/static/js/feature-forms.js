const pageCopy = {
  rpp: ['.rpp-title', 'Buat RPP', '.rpp-subtitle', 'Susun rencana pembelajaran dan lampiran sesuai kebutuhan kelas.'],
  kisi: ['.asesmen-title', 'Buat Asesmen', '.asesmen-subtitle', 'Atur materi, jumlah soal, dan tingkat kognitif.'],
  'analisis-cp': ['#analisis-form-view h1', 'Analisis CP, TP & ATP'],
  slide: ['#slidegen-container > :is(main, .sg-landing-view) h1', 'Buat slide pembelajaran'],
};

function disclosure(nodes, label, { open = false, className = '' } = {}) {
  const elements = nodes.filter(Boolean);
  if (!elements.length || elements.find(node => node.nodeType === 1)?.closest('.fw-disclosure')) return;
  const details = document.createElement('details');
  details.className = `fw-disclosure ${className}`.trim();
  details.open = open;
  const summary = document.createElement('summary');
  summary.textContent = label;
  const body = document.createElement('div');
  body.className = 'fw-disclosure-body';
  elements[0].before(details);
  for (const element of elements) body.append(element);
  details.append(summary, body);
  return details;
}

function identityCard(card, label) {
  if (!card || card.classList.contains('fw-identity-card')) return;
  card.classList.add('fw-identity-card');
  const heading = card.querySelector('h3');
  if (heading) heading.remove();
  disclosure([...card.childNodes], label);
}

function optionalIdentity(root, page) {
  const wide = window.matchMedia('(min-width: 768px)').matches;
  if (page === 'rpp') {
    const row = root.querySelector('[name="namaKepalaSekolah"]')?.closest('.rpp-row');
    disclosure([row], 'Pengesahan kepala sekolah', { open: wide });
  }
  if (page === 'kisi') {
    const row = root.querySelector('[name="nipGuru"]')?.closest('.asesmen-row');
    const nip = root.querySelector('[name="nipKepalaSekolah"]');
    disclosure([row, nip?.previousElementSibling, nip], 'NIP dan pengesahan', { open: wide });
  }
  if (page === 'analisis-cp') {
    const row = root.querySelector('#input-nama-kepala-sekolah')?.parentElement.parentElement;
    disclosure([row], 'Pengesahan kepala sekolah', { open: wide });
  }
}

export function arrangeFeatureForms(root, page, outputSelector) {
  optionalIdentity(root, page);
  const copy = pageCopy[page];
  if (copy) {
    const title = root.querySelector(copy[0]);
    if (title && !title.closest(outputSelector) && title.textContent !== copy[1]) title.textContent = copy[1];
    if (copy[2]) {
      const subtitle = root.querySelector(copy[2]);
      if (subtitle && !subtitle.closest(outputSelector) && subtitle.textContent !== copy[3]) subtitle.textContent = copy[3];
    }
  }
  if (page === 'rpp') {
    const action = root.querySelector('#btn-generate-rpp');
    if (action && !action.dataset.uiCopy) { action.lastChild.textContent = ' Buat RPP'; action.dataset.uiCopy = '1'; }
  }
  if (page === 'kisi') {
    const action = root.querySelector('.asesmen-generate-btn');
    if (action && !action.dataset.uiCopy) { action.lastChild.textContent = ' Buat Asesmen'; action.dataset.uiCopy = '1'; }
  }
  if (page === 'analisis-cp') {
    const form = root.querySelector('#analisis-cp-form');
    const sourceCard = form?.children[1];
    const reviewCard = form?.children[2];
    if (sourceCard && reviewCard) {
      sourceCard.classList.add('fw-cp-source-card');
      reviewCard.classList.add('fw-cp-review-card');
      const action = form.querySelector('#btn-submit-generate');
      if (action && reviewCard.contains(action) && !action.closest('.fw-cp-generate-action')) {
        const footer = document.createElement('div');
        footer.className = 'fw-cp-generate-action';
        action.before(footer);
        footer.append(action);
      }
      if (action && !action.dataset.uiCopy) {
        action.lastChild.textContent = ' Buat Sekarang';
        action.dataset.uiCopy = '1';
      }
    }
    for (const input of root.querySelectorAll('.chapter-materi-input')) {
      input.closest('div[data-idx]')?.classList.add('fw-chapter-card');
      if (!input.closest('.fw-disclosure')) {
        const label = `Materi pokok Bab ${Number(input.dataset.idx) + 1}`;
        const details = disclosure([input.parentElement], label, { className: 'fw-chapter-detail' });
        if (details) details.title = input.value;
      }
    }
  }
  if (page === 'slide') {
    const title = root.querySelector('#slidegen-container > :is(main, .sg-landing-view) h1');
    const intro = title?.parentElement;
    intro?.classList.add('fw-slide-intro');
    const subtitle = intro?.querySelector('p');
    if (subtitle && subtitle.textContent !== 'Isi topik dan kelas, lalu pilih template. Tinjau kerangka terlebih dahulu jika ingin mengatur urutan slide.') subtitle.textContent = 'Isi topik dan kelas, lalu pilih template. Tinjau kerangka terlebih dahulu jika ingin mengatur urutan slide.';
    const model = root.querySelector('#sg-landing-model-select');
    model?.parentElement.parentElement.classList.add('fw-slide-model-row');
    const prompt = root.querySelector('#sg-main-prompt');
    if (prompt && !root.querySelector('label[for="sg-main-prompt"]')) {
      const label = document.createElement('label');
      label.htmlFor = 'sg-main-prompt'; label.className = 'fw-label'; label.textContent = 'Topik dan konteks kelas';
      prompt.before(label);
    }
  }
  if (page === 'program-sekolah') {
    const identityHeading = [...root.querySelectorAll('h3')].find(node => /Identitas Satuan Pendidikan/.test(node.textContent));
    const identitySection = identityHeading?.closest('.mb-8');
    if (identitySection && identitySection.querySelector('input')) identityCard(identitySection, 'Identitas sekolah dan penyusun');
  }
  if (page === 'guru') root.querySelector('#guru-search')?.parentElement.querySelector('span')?.remove();
  if (page === 'admin') {
    const dashboard = root.querySelector('#panel-dashboard');
    const summary = dashboard?.querySelector('#total-guru')?.closest('.grid');
    summary?.classList.add('ui-admin-summary');
    const secondary = dashboard?.querySelector('#metric-new-users')?.closest('.grid');
    disclosure([secondary], 'Rincian aktivitas dan konten');
    for (const [selector, label] of [['#activity-chart', 'Grafik aktivitas'], ['#member-chart', 'Perkembangan anggota'], ['#school-analytics-month', 'Analitik dan peringkat sekolah']]) {
      const surface = dashboard?.querySelector(selector)?.closest('.rounded-3xl');
      if (surface && !surface.querySelector(outputSelector)) disclosure([surface], label, { open: window.matchMedia('(min-width: 768px)').matches });
    }
    const form = root.querySelector('#panel-profil form') || root.querySelector('#panel-profil');
    if (form && !form.dataset.uiGrouped) {
      form.dataset.uiGrouped = '1';
      for (const section of [...form.children]) {
        const heading = section.querySelector('h2, h3, h4');
        if (!heading || !section.querySelector('input, textarea, select') || section.querySelector('[type="submit"]')) continue;
        disclosure([section], heading.textContent.trim(), { open: !/integrasi|pemeliharaan|bahaya|api|sosial/i.test(heading.textContent) });
      }
    }
  }
}
