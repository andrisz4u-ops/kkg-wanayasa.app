import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, formatDate } from '../utils.js';
import { getDocArchives } from '../storage-archive.js';

const documentModules = {
  rpp: { label: 'RPP / Modul ajar', icon: 'fa-file-lines' },
  kisi: { label: 'Asesmen', icon: 'fa-list-check' },
  slide: { label: 'Slide presentasi', icon: 'fa-file-powerpoint' },
};

export function getWorkspaceAccess(role) {
  return {
    management: ['admin', 'super_admin', 'operator'].includes(role),
    approvals: ['admin', 'super_admin'].includes(role),
  };
}

export function getUpcomingActivities(items, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return items.filter(item => {
    if (typeof item.tanggal !== 'string') return false;
    const match = item.tanggal.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
    if (!match) return false;
    const [, year, month, day] = match.map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1
      && date.getDate() === day && date.getTime() >= today;
  }).sort((a, b) => `${a.tanggal.slice(0, 10)} ${a.waktu_mulai || '00:00'}`
    .localeCompare(`${b.tanggal.slice(0, 10)} ${b.waktu_mulai || '00:00'}`));
}

export function getRecentWorkspaceDocuments() {
  return Object.keys(documentModules).flatMap(module => getDocArchives(module)
    .filter(item => item && /^doc_[a-zA-Z0-9_]+$/.test(item.id)
      && Number.isFinite(Date.parse(item.createdAt)))
    .map(item => ({ ...item, module })))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

const icon = name => `<i class="fas ${name}" aria-hidden="true"></i>`;
const link = (page, label) => `<button type="button" class="wk-text-link" onclick="navigate('${page}')">${label}${icon('fa-arrow-right')}</button>`;
const placeholder = label => `<div class="wk-skeleton" role="status" aria-label="${label}"><span></span><span></span><span></span><span class="sr-only">${label}</span></div>`;
const empty = (title, detail, page, action) => `<div class="wk-empty"><p>${title}</p><span>${detail}</span>${page ? link(page, action) : ''}</div>`;
const errorState = label => `<div class="wk-data-error" role="status">${icon('fa-circle-exclamation')}<p>${label} belum dapat dimuat.</p><button type="button" class="wk-text-link" onclick="window.refreshEducatorDashboard()">Coba lagi</button></div>`;

function renderDocuments() {
  const docs = getRecentWorkspaceDocuments();
  return docs.length ? `<table class="wk-documents-table">
    <caption class="sr-only">Empat dokumen terbaru yang disimpan untuk akun Anda di perangkat ini.</caption>
    <thead><tr><th scope="col">Nama dan jenis dokumen</th><th scope="col">Tanggal dibuat</th><th scope="col">Aksi</th></tr></thead>
    <tbody>${docs.slice(0, 4).map(doc => `<tr>
      <td class="wk-document-name"><div><span class="wk-file-icon wk-file-${doc.module}">${icon(documentModules[doc.module].icon)}</span><span class="wk-document-copy"><strong id="document-title-${doc.id}">${escapeHtml(doc.title || 'Dokumen')}</strong><span><span class="wk-document-kind">${documentModules[doc.module].label}</span>${doc.subtitle ? ` · ${escapeHtml(doc.subtitle)}` : ''}</span></span></div></td>
      <td class="wk-document-date"><time datetime="${new Date(doc.createdAt).toISOString()}">${escapeHtml(new Date(doc.createdAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }))}</time></td>
      <td class="wk-document-action"><button type="button" class="wk-open-document" aria-describedby="document-title-${doc.id}" onclick="navigate('${doc.module}', { archiveId: '${doc.id}' })">Buka</button></td>
    </tr>`).join('')}</tbody>
  </table>`
    : `<div class="wk-documents-empty"><span class="wk-empty-file" aria-hidden="true">${icon('fa-file-lines')}</span>${empty('Belum ada dokumen tersimpan', 'Hasil RPP, asesmen, dan slide yang Anda buat akan tampil di sini.', 'rpp', 'Buat RPP pertama')}</div>`;
}

export function renderEducatorDashboard() {
  const user = state.user || {};
  const access = getWorkspaceAccess(user.role);
  const school = user.sekolah || 'Sekolah belum diisi';
  const role = ({ admin: 'Admin', super_admin: 'Super admin', operator: 'Operator' })[user.role] || 'Guru';
  const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const tools = [
    { page: 'rpp', title: 'Buat RPP', description: 'Rencana dan modul ajar', icon: 'fa-file-lines', variant: 'primary' },
    { page: 'analisis-cp', title: 'Analisis CP', description: 'CP, TP, ATP dan perangkat ajar', icon: 'fa-book-open', variant: 'cp' },
    { page: 'kisi', title: 'Buat Asesmen', description: 'Soal dan kisi-kisi', icon: 'fa-list-check' },
    { page: 'slide', title: 'Buat slide', description: 'Media presentasi kelas', icon: 'fa-file-powerpoint' },
    { page: 'absensi', title: 'Presensi', description: 'Kehadiran kegiatan KKG', icon: 'fa-qrcode' },
  ];

  return `<div id="educator-workspace" class="wk-dashboard wk-monochrome-dashboard wk-paper-dashboard wk-green-dashboard">
    <section class="wk-welcome" aria-labelledby="workspace-title">
      <div class="wk-hero-main">
        <p class="wk-hero-kicker">RUANG KERJA PENDIDIK</p>
        <h1 id="workspace-title">Selamat datang, <span>${escapeHtml(user.nama?.split(' ')[0] || 'Bapak/Ibu')}</span></h1>
        <p class="wk-welcome-description">Siapkan pembelajaran hari ini. Semua perangkat ajar Anda ada di sini.</p>
        <div class="wk-hero-actions">
          <button type="button" class="wk-hero-primary" onclick="navigate('rpp')">Buat RPP ${icon('fa-arrow-right')}</button>
          <button type="button" class="wk-hero-secondary" onclick="navigate('analisis-cp')">Analisis CP ${icon('fa-arrow-right')}</button>
        </div>
        <p class="wk-welcome-context"><span>${escapeHtml(school)}</span><span class="wk-role-label">${role}</span></p>
      </div>
      <div class="wk-hero-side">
        <div class="wk-today"><span>${escapeHtml(date)}</span>${state.settings?.tahun_ajaran ? `<strong>Tahun ajaran ${escapeHtml(state.settings.tahun_ajaran)}</strong>` : ''}</div>
        <section class="wk-studio-agenda" aria-labelledby="workspace-agenda-title">
          <div class="wk-section-heading"><h2 id="workspace-agenda-title">${icon('fa-calendar-days')}Agenda KKG</h2>${link('kalender', 'Buka kalender')}</div>
          <div id="workspace-agenda" aria-live="polite" aria-busy="true">${placeholder('Memuat agenda')}</div>
        </section>
      </div>
    </section>

    <aside class="wk-studio-tools" aria-labelledby="workspace-tools-title">
      <div class="wk-tool-heading"><div><p class="wk-section-kicker">MULAI PEKERJAAN</p><h2 id="workspace-tools-title">Perangkat ajar</h2></div><p>Pilih yang ingin Anda kerjakan.</p></div>
      <nav aria-label="Pintasan perangkat ajar" class="wk-studio-tool-navigation">
        ${tools.filter(tool => tool.variant).map(tool => `<button type="button" class="wk-studio-launch wk-studio-launch-${tool.variant}" onclick="navigate('${tool.page}')"><span class="wk-studio-launch-icon">${icon(tool.icon)}</span><span><strong>${tool.title}</strong><small>${tool.description}</small></span>${icon('fa-chevron-right')}</button>`).join('')}
        <div class="wk-studio-support-tools">${tools.filter(tool => !tool.variant).map(tool => `<button type="button" class="wk-support-tool" onclick="navigate('${tool.page}')"><span class="wk-support-tool-icon">${icon(tool.icon)}</span><span><strong>${tool.title}</strong><small>${tool.description}</small></span>${icon('fa-chevron-right')}</button>`).join('')}</div>
      </nav>
    </aside>

    <div class="wk-studio-worktable">
      <section class="wk-documents-panel" aria-labelledby="workspace-documents-title">
        <div class="wk-section-heading"><h2 id="workspace-documents-title">Dokumen terakhir</h2><p class="wk-local-storage-note">${icon('fa-circle-info')}<span>Disimpan untuk akun Anda di perangkat ini.</span></p></div>
        <div id="workspace-documents">${renderDocuments()}</div>
      </section>

      <section class="wk-studio-announcements" aria-labelledby="workspace-announcements-title">
        <div class="wk-section-heading"><h2 id="workspace-announcements-title">Pengumuman</h2>${link('pengumuman', 'Lihat semua')}</div>
        <div id="workspace-announcements" aria-live="polite" aria-busy="true">${placeholder('Memuat pengumuman')}</div>
      </section>
      <nav class="wk-studio-community-access" aria-labelledby="workspace-community-access-title">
        <h2 id="workspace-community-access-title">Akses komunitas</h2>
        <div class="wk-studio-community-links">${[
          { page: 'materi', title: 'Bank materi', description: 'Materi dari rekan pendidik', icon: 'fa-folder-open' },
          { page: 'forum', title: 'Forum diskusi', description: 'Diskusi dan praktik baik', icon: 'fa-comments' },
          { page: 'games', title: 'Game edukasi', description: 'Aktivitas untuk pembelajaran', icon: 'fa-gamepad' },
        ].map(item => `<button type="button" onclick="navigate('${item.page}')">${icon(item.icon)}<span><strong>${item.title}</strong><small>${item.description}</small></span>${icon('fa-chevron-right')}</button>`).join('')}</div>
        <p id="workspace-materials" class="wk-materials-context" aria-live="polite">Telusuri materi yang dibagikan rekan pendidik.</p>
      </nav>
    </div>

    <section class="wk-panel wk-community-panel" aria-labelledby="workspace-community-title">
      <div class="wk-section-heading"><div><h2 id="workspace-community-title">Dari rekan pendidik</h2><p>Pertanyaan dan praktik baik di komunitas.</p></div>${link('forum', 'Buka forum')}</div>
      <div id="workspace-community" aria-live="polite" aria-busy="true">${placeholder('Memuat diskusi')}</div>
    </section>

    ${access.management ? `<section class="wk-management" aria-labelledby="workspace-management-title">
          <div><span class="wk-eyebrow">${role}</span><h2 id="workspace-management-title">Kelola kegiatan & organisasi</h2><p>${access.approvals ? 'Kelola anggota dan administrasi KKG.' : 'Akses pekerjaan operasional sesuai kewenangan Anda.'}</p></div>
          <div class="wk-management-links">${link('surat', 'Buat surat')}${link('proker', 'Program kerja')}${link('admin', 'Panel kontrol')}</div>
          ${access.approvals ? `<div id="workspace-approvals" aria-live="polite" aria-busy="true">${placeholder('Memuat persetujuan anggota')}</div>` : ''}
        </section>` : ''}
    <footer class="wk-dashboard-footer"><span>${escapeHtml(state.settings?.nama_kkg || state.tenant?.nama || 'RuangKKG')}</span><button type="button" class="wk-text-link" onclick="window.togglePublicLanding()">Lihat situs publik ${icon('fa-arrow-up-right-from-square')}</button></footer>
  </div>`;
}

function renderAgenda(items) {
  const upcoming = getUpcomingActivities(items).slice(0, 1);
  if (!upcoming.length) return empty('Belum ada agenda mendatang', 'Kegiatan berikutnya akan tampil setelah dijadwalkan.');
  return `<ul class="wk-agenda-list">${upcoming.map(item => {
    const date = new Date(`${item.tanggal.slice(0, 10)}T00:00:00`);
    return `<li><div class="wk-calendar-date"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString('id-ID', { month: 'short' })}</span></div><div><h3>${escapeHtml(item.nama_kegiatan || 'Kegiatan KKG')}</h3><p>${escapeHtml(item.waktu_mulai?.slice(0, 5) || 'Waktu belum ditentukan')}${item.tempat ? ` · ${escapeHtml(item.tempat)}` : ''}</p>${link('absensi', 'Buka presensi')}</div></li>`;
  }).join('')}</ul>`;
}

function renderAnnouncements(items) {
  if (!items.length) return empty('Belum ada pengumuman', 'Informasi terbaru dari KKG akan tampil di sini.');
  return `<ul class="wk-announcement-list">${items.slice(0, 3).map(item => `<li><button type="button" class="wk-announcement" onclick="navigate('pengumuman')"><span class="wk-item-meta">${item.is_pinned ? `${icon('fa-thumbtack')} ` : ''}${escapeHtml(item.kategori || 'Umum')}${item.created_at ? ` · ${escapeHtml(formatDate(item.created_at))}` : ''}</span><strong>${escapeHtml(item.judul || 'Pengumuman')}</strong><span class="wk-clamp">${escapeHtml(String(item.isi || '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim())}</span></button></li>`).join('')}</ul>`;
}

function renderCommunity(items) {
  if (!items.length) return empty('Mulai percakapan dengan rekan guru', 'Ajukan pertanyaan atau bagikan praktik baik dari kelas Anda.', 'forum', 'Buka forum diskusi');
  return `<ul class="wk-discussion-list">${items.slice(0, 3).map(item => `<li><button type="button" class="wk-discussion" onclick="navigate('forum')"><span class="wk-discussion-icon">${icon('fa-comment-dots')}</span><span><strong>${escapeHtml(item.judul || 'Diskusi')}</strong><span>${escapeHtml(item.author_name || 'Anggota KKG')} · ${Number(item.reply_count) || 0} balasan</span></span>${icon('fa-chevron-right')}</button></li>`).join('')}</ul>`;
}

export async function initEducatorDashboard() {
  const root = document.getElementById('educator-workspace');
  if (!root || !state.user) return;
  const userId = state.user.id;
  const access = getWorkspaceAccess(state.user.role);
  const sources = [
    { id: 'workspace-agenda', path: '/absensi/kegiatan', label: 'Agenda', render: renderAgenda },
    { id: 'workspace-announcements', path: '/pengumuman?limit=3', label: 'Pengumuman', render: renderAnnouncements },
    { id: 'workspace-community', path: '/forum/threads', label: 'Diskusi', render: renderCommunity },
    { id: 'workspace-materials', path: '/materi', label: 'Materi', render: items => items.length ? `${items.length} materi tersedia untuk Anda telusuri.` : 'Belum ada materi yang dibagikan.' },
  ];
  if (access.approvals) sources.push({ id: 'workspace-approvals', path: '/admin/users/pending', label: 'Persetujuan anggota', render: items => `<div class="wk-approval-summary">${icon('fa-user-check')}<span>${items.length ? `${items.length} anggota menunggu persetujuan` : 'Tidak ada pendaftaran menunggu persetujuan'}</span>${link('admin', 'Buka panel kontrol')}</div>` });
  for (const source of sources) {
    const target = root.querySelector(`#${source.id}`);
    target?.setAttribute('aria-busy', 'true');
  }
  const results = await Promise.allSettled(sources.map(source => api(source.path, { timeout: 10000 })));
  if (!root.isConnected || state.user?.id !== userId) return;
  sources.forEach((source, index) => {
    const target = root.querySelector(`#${source.id}`);
    if (!target) return;
    const result = results[index];
    if (result.status === 'fulfilled' && Array.isArray(result.value?.data)) {
      target.innerHTML = source.render(result.value.data);
    } else if (source.id === 'workspace-materials') {
      target.textContent = 'Daftar materi belum dapat dimuat. Buka bank materi untuk mencoba lagi.';
    } else {
      target.innerHTML = errorState(source.label);
    }
    target.setAttribute('aria-busy', 'false');
  });
}

window.refreshEducatorDashboard = initEducatorDashboard;
