// Modul CP Kolaboratif — Ruang Berbagi & Kolaborasi Dokumen CP Guru KKG
// public/static/js/pages/analisis-cp/kolaboratif.js

import { escapeHtml, showToast } from '../../utils.js';
import { api } from '../../api.js';
import { state } from '../../state.js';

/**
 * Muat dan perbarui badge jumlah dokumen CP Kolaboratif di Header
 */
export async function loadCpKolaboratifCountBadge() {
  try {
    const res = await api('/analisis-cp/kolaboratif/stats');
    if (res && res.success && res.data) {
      const badge = document.getElementById('cp-kolaboratif-count-badge');
      if (badge) {
        const total = Number(res.data.total_cp) || 0;
        if (total > 0) {
          badge.textContent = total;
          badge.classList.remove('hidden');
          badge.classList.add('scale-110');
          setTimeout(() => badge.classList.remove('scale-110'), 300);
        } else {
          badge.textContent = '0';
          badge.classList.add('hidden');
        }
      }
      const subtitle = document.getElementById('cp-kolaboratif-subtitle');
      if (subtitle) {
        subtitle.textContent = `${res.data.total_cp || 0} dokumen CP · ${res.data.my_cp || 0} milik Anda`;
      }
    }
  } catch (_) {}
}

function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `Hari ini, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/**
 * Buka Drawer / Modal CP Kolaboratif
 * @param {object} callbacks - { onApply: (cpData, inputData) => void, onDownload: (item) => void }
 */
export async function openCpKolaboratifDrawer(callbacks = {}) {
  // Bersihkan modal lama jika ada
  const existing = document.getElementById('cp-kolaboratif-modal-root');
  if (existing) existing.remove();

  const filters = {
    search: '',
    mapel: '',
    kelas: '',
    mine: '',
    sort: 'newest',
    page: 1
  };

  // Muat opsi Mapel dari statistik
  let stats = { total_cp: 0, my_cp: 0, per_mapel: [] };
  try {
    const statsRes = await api('/analisis-cp/kolaboratif/stats');
    if (statsRes && statsRes.success && statsRes.data) {
      stats = statsRes.data;
    }
  } catch (_) {}

  const mapelOptions = (stats.per_mapel || []).map(m => 
    `<option value="${escapeHtml(m.mata_pelajaran)}">${escapeHtml(m.mata_pelajaran)} (${m.count})</option>`
  ).join('');

  const kelasOptions = [1, 2, 3, 4, 5, 6].map(k => 
    `<option value="Kelas ${k}">Kelas ${k}</option>`
  ).join('');

  const root = document.createElement('div');
  root.id = 'cp-kolaboratif-modal-root';
  root.className = 'fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fade-in';

  root.innerHTML = `
    <div class="fixed inset-0 bg-black/65 backdrop-blur-md" id="cpk-backdrop"></div>
    <div class="bg-white dark:bg-slate-900 w-full max-w-5xl xl:max-w-6xl h-[92vh] max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 relative z-10 flex flex-col overflow-hidden animate-scale-up">

      <!-- Header Modal -->
      <div class="px-6 py-4 sm:px-8 sm:py-4.5 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/40 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg shadow-lg shadow-purple-500/30">
            <i class="fas fa-users"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-black text-base sm:text-lg text-white tracking-tight">CP Kolaboratif</h3>
              <span class="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">Komunitas Guru</span>
            </div>
            <p class="text-xs text-indigo-200/80" id="cp-kolaboratif-subtitle">${stats.total_cp} dokumen CP tersimpan · ${stats.my_cp} milik Anda</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button id="cpk-refresh-btn" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer" title="Segarkan data">
            <i class="fas fa-rotate text-xs"></i>
          </button>
          <button id="cpk-close-btn" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer" title="Tutup">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="p-4 sm:px-6 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5 shrink-0">
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <!-- Search Input -->
          <div class="sm:col-span-6 relative">
            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" id="cpk-filter-search" placeholder="Cari mapel, materi/buku, sekolah, atau nama guru..." class="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all">
            <button id="cpk-clear-search" type="button" class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Filter Mapel -->
          <div class="sm:col-span-3">
            <select id="cpk-filter-mapel" class="w-full text-xs py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="">Semua Mapel</option>
              ${mapelOptions}
            </select>
          </div>

          <!-- Filter Kelas -->
          <div class="sm:col-span-2">
            <select id="cpk-filter-kelas" class="w-full text-xs py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="">Semua Kelas</option>
              ${kelasOptions}
            </select>
          </div>

          <!-- Toggle Dokumen Saya -->
          <div class="sm:col-span-1 flex items-center justify-end">
            <label class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:bg-indigo-50/50 transition-colors whitespace-nowrap" title="Tampilkan hanya CP yang saya buat">
              <input type="checkbox" id="cpk-filter-mine" class="rounded accent-indigo-600 cursor-pointer">
              <span class="hidden xl:inline">CP Saya</span>
              <i class="fas fa-user-check text-[11px] text-indigo-600 xl:hidden"></i>
            </label>
          </div>
        </div>

        <!-- Sort Tabs & Counter -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div class="flex items-center gap-1.5" id="cpk-sort-group">
            <button class="cpk-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-indigo-600 text-white shadow-xs" data-sort="newest">
              <i class="fas fa-clock mr-1 text-[11px]"></i>Terbaru
            </button>
            <button class="cpk-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50" data-sort="popular">
              <i class="fas fa-fire mr-1 text-[11px]"></i>Paling Sering Digunakan
            </button>
          </div>

          <div class="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span id="cpk-result-counter" class="font-medium">Memuat data...</span>
            <button id="cpk-reset-filters-btn" type="button" class="hidden text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1">
              <i class="fas fa-rotate-left text-[10px]"></i> Reset Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Cards Grid Area -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-900/40" id="cpk-cards-container">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="cpk-cards-grid">
          <!-- Dynamic cards injected here -->
        </div>
      </div>

      <!-- Pagination Footer -->
      <div id="cpk-pagination-container" class="p-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between shrink-0"></div>
    </div>
  `;

  document.body.appendChild(root);

  const closeModal = () => {
    root.remove();
    loadCpKolaboratifCountBadge();
  };

  document.getElementById('cpk-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('cpk-backdrop')?.addEventListener('click', closeModal);

  let currentFetchId = 0;
  async function loadData() {
    const fetchId = ++currentFetchId;
    const grid = document.getElementById('cpk-cards-grid');
    const paginationContainer = document.getElementById('cpk-pagination-container');
    const counterEl = document.getElementById('cpk-result-counter');
    const resetBtn = document.getElementById('cpk-reset-filters-btn');
    const clearSearchBtn = document.getElementById('cpk-clear-search');

    if (!grid) return;

    if (clearSearchBtn) {
      if (filters.search) clearSearchBtn.classList.remove('hidden');
      else clearSearchBtn.classList.add('hidden');
    }

    const hasActiveFilters = Boolean(filters.search || filters.mapel || filters.kelas || filters.mine || filters.sort !== 'newest');
    if (resetBtn) {
      if (hasActiveFilters) resetBtn.classList.remove('hidden');
      else resetBtn.classList.add('hidden');
    }

    // Skeleton loader
    grid.innerHTML = Array(4).fill(0).map(() => `
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 animate-pulse space-y-3">
        <div class="flex items-center justify-between">
          <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div class="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div class="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div class="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
          <div class="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div class="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    `).join('');

    let url = `/analisis-cp/kolaboratif?page=${filters.page}&limit=10&sort=${filters.sort}`;
    if (filters.mapel) url += `&mapel=${encodeURIComponent(filters.mapel)}`;
    if (filters.kelas) url += `&kelas=${encodeURIComponent(filters.kelas)}`;
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.mine) url += `&mine=1`;

    try {
      const res = await api(url);
      if (fetchId !== currentFetchId) return;

      const items = res.success && res.data ? (res.data.items || []) : [];
      const pagination = res.success && res.data ? (res.data.pagination || { page: 1, totalPages: 1, total: 0 }) : { page: 1, totalPages: 1, total: 0 };

      if (counterEl) {
        counterEl.textContent = `Menampilkan ${items.length} dari ${pagination.total} dokumen CP`;
      }

      if (items.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div class="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 mb-3 text-2xl shadow-inner">
              <i class="fas fa-folder-open"></i>
            </div>
            <h4 class="font-bold text-slate-700 dark:text-slate-200 text-sm">Belum Ada Dokumen CP yang Cocok</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-sm">Coba ubah kata kunci pencarian, pilih jenjang kelas lain, atau tekan tombol simpan di hasil analisis CP untuk berbagi.</p>
            ${hasActiveFilters ? `
              <button id="cpk-inline-reset-btn" class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-700 transition-colors cursor-pointer">
                <i class="fas fa-rotate-left mr-1.5"></i>Reset Semua Filter
              </button>
            ` : ''}
          </div>
        `;
        document.getElementById('cpk-inline-reset-btn')?.addEventListener('click', () => {
          filters.search = '';
          filters.mapel = '';
          filters.kelas = '';
          filters.mine = '';
          filters.sort = 'newest';
          filters.page = 1;
          const s = document.getElementById('cpk-filter-search'); if (s) s.value = '';
          const m = document.getElementById('cpk-filter-mapel'); if (m) m.value = '';
          const k = document.getElementById('cpk-filter-kelas'); if (k) k.value = '';
          const mine = document.getElementById('cpk-filter-mine'); if (mine) mine.checked = false;
          loadData();
        });
      } else {
        grid.innerHTML = items.map(item => {
          const isMine = (item.user_id === state.user?.id) || (state.user?.role === 'admin');
          const totalBabText = item.total_bab ? `${item.total_bab} BAB` : 'Bab Lengkap';
          return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group" data-id="${item.id}">
              <div>
                <!-- Top Badges -->
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                      ${escapeHtml(item.mata_pelajaran)}
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                      ${escapeHtml(item.jenjang_kelas)} (Fase ${escapeHtml(item.fase || 'C')})
                    </span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      ${totalBabText}
                    </span>
                    ${isMine ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70"><i class="fas fa-check mr-1"></i>Milik Anda</span>` : ''}
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    ${isMine ? `
                      <button type="button" class="cpk-delete-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer" data-id="${item.id}" title="Hapus dokumen dari CP Kolaboratif">
                        <i class="fas fa-trash-alt text-xs"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>

                <!-- Judul / Sumber Buku -->
                <h4 class="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1 group-hover:text-indigo-600 transition-colors cursor-pointer cpk-card-title-btn" data-id="${item.id}">
                  ${escapeHtml(item.sumber_buku || `Analisis CP ${item.mata_pelajaran} ${item.jenjang_kelas}`)}
                </h4>

                <!-- Sekolah & Pembuat -->
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span><i class="fas fa-school mr-1 text-slate-400"></i>${escapeHtml(item.nama_sekolah)}</span>
                  <span class="text-slate-300 dark:text-slate-600">·</span>
                  <span><i class="fas fa-user-circle mr-1 text-slate-400"></i>${escapeHtml(item.user_nama || 'Guru')}</span>
                  <span class="text-slate-300 dark:text-slate-600">·</span>
                  <span class="text-[11px]">${formatDate(item.created_at)}</span>
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-auto space-y-2.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <i class="fas fa-file-lines text-indigo-500"></i> 5 Dokumen Siap Cetak
                  </span>
                  <span class="text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1">
                    <i class="fas fa-download text-[10px]"></i> ${item.use_count || 0}x digunakan
                  </span>
                </div>

                <div class="flex items-center gap-2 pt-0.5">
                  <button type="button" class="cpk-use-btn flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer" data-id="${item.id}">
                    <i class="fas fa-folder-open text-xs"></i> Gunakan / Buka
                  </button>
                  <button type="button" class="cpk-download-btn py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer" data-id="${item.id}" title="Unduh langsung Word (.docx)">
                    <i class="fas fa-file-word text-blue-500"></i> Word
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Pagination
      if (paginationContainer) {
        if (pagination.totalPages > 1) {
          paginationContainer.innerHTML = `
            <span class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Halaman <strong>${pagination.page}</strong> dari <strong>${pagination.totalPages}</strong> (${pagination.total} dokumen)
            </span>
            <div class="flex items-center gap-2">
              <button id="cpk-prev-page" class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" ${pagination.page <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left mr-1"></i>Sebelumnya
              </button>
              <button id="cpk-next-page" class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>
                Berikutnya<i class="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          `;
          document.getElementById('cpk-prev-page')?.addEventListener('click', () => {
            if (filters.page > 1) { filters.page--; loadData(); }
          });
          document.getElementById('cpk-next-page')?.addEventListener('click', () => {
            if (filters.page < pagination.totalPages) { filters.page++; loadData(); }
          });
        } else {
          paginationContainer.innerHTML = `
            <span class="text-[11px] text-slate-400">Menampilkan seluruh ${pagination.total} dokumen CP Kolaboratif</span>
          `;
        }
      }

    } catch (err) {
      console.error('Fetch CP Kolaboratif Error:', err);
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-rose-500 text-xs">
          <i class="fas fa-circle-exclamation text-2xl mb-2"></i>
          <p>Gagal memuat dokumen: ${err.message}</p>
        </div>
      `;
    }
  }

  // Event Listeners for Filters
  let searchTimeout = null;
  document.getElementById('cpk-filter-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filters.search = e.target.value.trim();
      filters.page = 1;
      loadData();
    }, 300);
  });

  document.getElementById('cpk-clear-search')?.addEventListener('click', () => {
    const s = document.getElementById('cpk-filter-search');
    if (s) s.value = '';
    filters.search = '';
    filters.page = 1;
    loadData();
  });

  document.getElementById('cpk-filter-mapel')?.addEventListener('change', (e) => {
    filters.mapel = e.target.value;
    filters.page = 1;
    loadData();
  });

  document.getElementById('cpk-filter-kelas')?.addEventListener('change', (e) => {
    filters.kelas = e.target.value;
    filters.page = 1;
    loadData();
  });

  document.getElementById('cpk-filter-mine')?.addEventListener('change', (e) => {
    filters.mine = e.target.checked ? '1' : '';
    filters.page = 1;
    loadData();
  });

  document.querySelectorAll('.cpk-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cpk-sort-btn').forEach(b => {
        b.className = 'cpk-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50';
      });
      btn.className = 'cpk-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-indigo-600 text-white shadow-xs';
      filters.sort = btn.dataset.sort;
      filters.page = 1;
      loadData();
    });
  });

  document.getElementById('cpk-refresh-btn')?.addEventListener('click', loadData);
  document.getElementById('cpk-reset-filters-btn')?.addEventListener('click', () => {
    filters.search = '';
    filters.mapel = '';
    filters.kelas = '';
    filters.mine = '';
    filters.sort = 'newest';
    filters.page = 1;
    const s = document.getElementById('cpk-filter-search'); if (s) s.value = '';
    const m = document.getElementById('cpk-filter-mapel'); if (m) m.value = '';
    const k = document.getElementById('cpk-filter-kelas'); if (k) k.value = '';
    const mine = document.getElementById('cpk-filter-mine'); if (mine) mine.checked = false;
    loadData();
  });

  // Delegated Clicks on Cards (Use, Download, Delete)
  document.getElementById('cpk-cards-grid')?.addEventListener('click', async (e) => {
    const btnUse = e.target.closest('.cpk-use-btn') || e.target.closest('.cpk-card-title-btn');
    if (btnUse) {
      const id = btnUse.dataset.id;
      showToast('Memuat dokumen CP Kolaboratif...', 'info');
      try {
        const detailRes = await api(`/analisis-cp/${id}`);
        if (!detailRes || !detailRes.success || !detailRes.data) {
          throw new Error('Gagal mengambil data dokumen');
        }
        await api(`/analisis-cp/${id}/use`, { method: 'POST' });
        closeModal();
        if (typeof callbacks.onApply === 'function') {
          callbacks.onApply(detailRes.data);
        }
      } catch (err) {
        showToast('Gagal memuat dokumen: ' + err.message, 'error');
      }
      return;
    }

    const btnDownload = e.target.closest('.cpk-download-btn');
    if (btnDownload) {
      const id = btnDownload.dataset.id;
      showToast('Menyiapkan berkas Word...', 'info');
      try {
        const detailRes = await api(`/analisis-cp/${id}`);
        if (!detailRes || !detailRes.success || !detailRes.data) {
          throw new Error('Gagal mengambil data dokumen');
        }
        await api(`/analisis-cp/${id}/use`, { method: 'POST' });
        if (typeof callbacks.onDownload === 'function') {
          callbacks.onDownload(detailRes.data);
        }
      } catch (err) {
        showToast('Gagal mengunduh: ' + err.message, 'error');
      }
      return;
    }

    const btnDelete = e.target.closest('.cpk-delete-btn');
    if (btnDelete) {
      const id = btnDelete.dataset.id;
      if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini dari CP Kolaboratif?')) return;
      try {
        const delRes = await api(`/analisis-cp/${id}`, { method: 'DELETE' });
        if (delRes && delRes.success) {
          showToast('Dokumen berhasil dihapus dari CP Kolaboratif', 'success');
          loadData();
          loadCpKolaboratifCountBadge();
        } else {
          throw new Error(delRes?.error || 'Gagal menghapus');
        }
      } catch (err) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    }
  });

  // Initial Load
  loadData();
}
