import { state } from '../state.js';
import { escapeHtml } from '../utils.js';

const panels = [
  ['dashboard', 'Ringkasan', 'fa-chart-line'],
  ['users', 'Pengguna', 'fa-users'],
  ['sekolah', 'Sekolah', 'fa-school'],
  ['cp', 'Data CP', 'fa-book-open'],
  ['ai-providers', 'Provider AI', 'fa-robot'],
  ['logs', 'Log aktivitas', 'fa-history'],
  ['templates', 'Template surat', 'fa-file-alt'],
  ['profil', 'Organisasi', 'fa-building'],
];
const operatorRestricted = new Set(['logs', 'templates', 'profil', 'ai-providers']);

export function syncAdminContext(activePage) {
  document.querySelectorAll('[data-control-tab]').forEach(button => {
    const active = button.dataset.controlTab === activePage;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

export function renderAdminLayout(content, activePage = 'dashboard') {
  const user = state.user;
  if (!user || !['super_admin', 'admin', 'operator'].includes(user.role)) {
    return `<div class="fw-access-denied"><h1>Akses ditolak</h1><p>Halaman ini hanya dapat diakses oleh admin atau operator.</p><button onclick="navigate('home')" class="btn btn-primary">Kembali ke beranda</button></div>`;
  }
  if (['surat', 'proker', 'laporan'].includes(activePage)) return `<div class="control-workspace"><div class="control-content">${content}</div></div>`;
  const mode = user.role === 'operator' || localStorage.getItem('admin_panel_mode') === 'operator' ? 'operator' : 'admin';
  if (mode === 'operator' && operatorRestricted.has(activePage)) activePage = 'dashboard';
  const links = panels.filter(([id]) => mode !== 'operator' || !operatorRestricted.has(id));
  return `<div class="control-workspace">
    <div class="control-context-header">
      <div><p>Administrasi KKG</p><h1>${escapeHtml(['surat', 'proker', 'laporan'].includes(activePage) ? 'Dokumen administrasi' : 'Panel kontrol')}</h1></div>
      ${user.role !== 'operator' ? `<div class="control-mode" role="group" aria-label="Mode panel">
        <button type="button" onclick="setAdminPanelMode('admin')" aria-pressed="${mode === 'admin'}">Admin</button>
        <button type="button" onclick="setAdminPanelMode('operator')" aria-pressed="${mode === 'operator'}">Operator</button>
      </div>` : '<span class="control-mode-label">Mode operator</span>'}
    </div>
    <nav class="control-context-nav" aria-label="Bagian panel kontrol">
      ${links.map(([id, label, icon]) => `<button type="button" id="tab-${id}" data-control-tab="${id}" class="control-context-link ${activePage === id ? 'is-active' : ''}" onclick="window.handleAdminTabClick('${id}')" ${activePage === id ? 'aria-current="page"' : ''}><span><i class="fas ${icon}" aria-hidden="true"></i></span><span>${label}</span></button>`).join('')}
    </nav>
    <div class="control-content">${content}</div>
  </div>`;
}
