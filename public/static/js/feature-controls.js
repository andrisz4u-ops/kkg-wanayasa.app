let fieldSequence = 0;
const validationForms = new WeakSet();
const keyboardActions = new WeakSet();
const filterNames = {
  'filter-jenis': 'Jenis materi', 'filter-jenjang': 'Kelas', 'filter-search': 'Cari materi',
  'guru-search': 'Cari guru', 'user-search-input': 'Cari pengguna', 'user-role-filter': 'Peran pengguna',
  'cp-filter-mapel': 'Mata pelajaran', 'cp-filter-search': 'Cari capaian pembelajaran',
  'users-check-all': 'Pilih semua pengguna', 'sekolah-check-all': 'Pilih semua sekolah',
  'pending-check-all': 'Pilih semua pengguna yang menunggu persetujuan',
  'dashboard-trend-select': 'Periode tren aktivitas', 'dashboard-activity-select': 'Periode log aktivitas',
};

const readableName = value => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[-_]+/g, ' ').replace(/^(input|select|filter|sg|aip)\s+/i, '').trim();

function precedingLabel(field, root) {
  let branch = field;
  while (branch && branch !== root && branch.tagName !== 'FORM') {
    for (let sibling = branch.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
      if (sibling.matches('input, select, textarea, h1, h2, h3, h4')) break;
      const label = sibling.matches('label') ? sibling : [...sibling.querySelectorAll('label')].at(-1);
      if (label && !label.htmlFor && !label.querySelector('input, select, textarea')) return label;
      if (sibling.querySelector('input, select, textarea')) break;
    }
    branch = branch.parentElement;
  }
}

function openAncestors(field) {
  for (let parent = field.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
}

function mountValidation(form) {
  if (validationForms.has(form)) return;
  validationForms.add(form);
  let frame;
  form.addEventListener('invalid', event => {
    const field = event.target;
    openAncestors(field);
    field.setAttribute('aria-invalid', 'true');
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (!form.isConnected) return;
      const invalid = [...form.querySelectorAll('input, select, textarea')].filter(control => control.willValidate && !control.validity.valid);
      if (!invalid.length) return;
      let summary = form.querySelector(':scope > .fw-error-summary');
      if (!summary) {
        summary = document.createElement('div');
        summary.className = 'fw-error-summary';
        summary.setAttribute('role', 'alert');
        form.prepend(summary);
      }
      summary.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = 'Periksa isian berikut';
      const list = document.createElement('ul');
      for (const control of invalid) {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${control.id}`;
        link.textContent = `${control.labels?.[0]?.textContent?.trim() || control.getAttribute('aria-label') || 'Isian'}: ${control.validationMessage}`;
        link.addEventListener('click', event => { event.preventDefault(); openAncestors(control); control.focus(); });
        row.append(link);
        list.append(row);
      }
      summary.append(title, list);
    });
  }, true);
  const clear = event => {
    if (event.target.validity?.valid) event.target.removeAttribute('aria-invalid');
    if (![...form.querySelectorAll('[aria-invalid="true"]')].length) form.querySelector('.fw-error-summary')?.remove();
  };
  form.addEventListener('input', clear);
  form.addEventListener('change', clear);
  form.addEventListener('reset', () => {
    form.querySelector('.fw-error-summary')?.remove();
    form.querySelectorAll('[aria-invalid="true"]').forEach(control => control.removeAttribute('aria-invalid'));
  });
}

export function enhanceFeatureControls(root, page, outputSelector) {
  const safe = node => !node.closest(outputSelector);
  for (const label of root.querySelectorAll('label')) {
    if (!safe(label)) continue;
    if (/^(AI NEURAL ENGINE|MESIN KECERDASAN ARTIFISIAL \(AI\))$/.test(label.textContent.trim())) label.textContent = 'Model AI';
  }
  for (const field of root.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
    if (!safe(field)) continue;
    if (!field.id) {
      do { field.id = `ui-${page}-${readableName(field.name).replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'field'}-${++fieldSequence}`; }
      while (document.querySelectorAll(`[id="${field.id}"]`).length > 1);
    }
    if (field.matches('.chapter-title-input, .chapter-materi-input')) {
      const chapter = Number(field.dataset.idx) + 1;
      field.setAttribute('aria-label', `${field.matches('.chapter-title-input') ? 'Judul' : 'Materi pokok'} Bab ${chapter}`);
      continue;
    }
    if (field.matches('input[type="checkbox"]') && field.closest('#panel-users-tbody, #pending-users-tbody, #sekolah-table-body')) {
      const row = field.closest('tr');
      const nameCell = row?.cells?.[1];
      const name = nameCell?.querySelector('p')?.textContent?.trim() || nameCell?.textContent?.trim();
      if (name) field.setAttribute('aria-label', `Pilih ${field.closest('#sekolah-table-body') ? 'sekolah' : 'pengguna'} ${name}`);
    }
    if (filterNames[field.id] && !field.labels?.length) {
      const label = document.createElement('label');
      label.htmlFor = field.id; label.className = 'sr-only'; label.textContent = filterNames[field.id];
      field.before(label);
    }
    if (!field.labels?.length && !field.hasAttribute('aria-label') && !field.hasAttribute('aria-labelledby')) {
      const label = precedingLabel(field, root);
      if (label && safe(label)) label.htmlFor = field.id;
      else field.setAttribute('aria-label', field.title || field.placeholder || readableName(field.name || field.id));
    }
  }
  for (const button of root.querySelectorAll('button')) {
    if (!safe(button)) continue;
    if (!button.hasAttribute('aria-label') && !button.hasAttribute('aria-labelledby') && button.querySelector('[class*="hidden"]')) {
      const text = button.cloneNode(true);
      text.querySelectorAll('i, [aria-hidden="true"]').forEach(icon => icon.remove());
      const name = text.textContent.replace(/\s+/g, ' ').trim();
      if (name) button.setAttribute('aria-label', name);
    }
    const chapter = button.dataset.idx;
    const chapterLabel = chapter !== undefined ? ` Bab ${Number(chapter) + 1}` : '';
    if (button.matches('.btn-delete-bab')) button.setAttribute('aria-label', `Hapus${chapterLabel}`);
    else if (button.matches('.btn-toggle-sem')) button.setAttribute('aria-label', `Ubah semester${chapterLabel}`);
    else if (button.textContent.trim() === '+' || button.textContent.trim() === '−' || button.textContent.trim() === '-') {
      const context = button.closest('.asesmen-counter-item')?.querySelector('.asesmen-counter-label')?.textContent?.trim()
        || (button.id.startsWith('btn-prt') ? 'pertemuan' : readableName(button.dataset.field) || 'jumlah');
      button.setAttribute('aria-label', `${button.textContent.trim() === '+' ? 'Tambah' : 'Kurangi'} ${context}`);
    } else if (!button.textContent.trim() && !button.hasAttribute('aria-label') && button.title) button.setAttribute('aria-label', button.title);
    if ((!button.textContent.trim() || /^[+−-]$/.test(button.textContent.trim())) && !button.classList.contains('fw-icon-action')) button.classList.add('fw-icon-action');
  }
  root.querySelectorAll('form').forEach(form => { if (safe(form) && !form.querySelector(outputSelector)) mountValidation(form); });
  for (const element of root.querySelectorAll('.template-card[data-id]')) {
    if (safe(element)) element.setAttribute('aria-pressed', String(element.classList.contains('border-indigo-600')));
  }
  for (const element of root.querySelectorAll('div[onclick], article[onclick], .template-card[data-id]')) {
    if (!safe(element) || element.querySelector('button, a, input, select, textarea') || element.closest('[role="button"]') || keyboardActions.has(element)) continue;
    element.setAttribute('role', 'button');
    element.tabIndex = 0;
    keyboardActions.add(element);
    element.addEventListener('keydown', event => {
      if (event.target !== element || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault(); element.click();
    });
  }
}
