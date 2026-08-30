// Document Archive & History Helper - KKG Wanayasa Digital
import { state } from './state.js';
import { showToast, escapeHtml } from './utils.js';

const MAX_ARCHIVE_ITEMS = 30;

function getStorageKey(module) {
  const userId = state.user?.id || 'guest';
  return `kkg_archive_${module}_${userId}`;
}

export function saveDocArchive({ module, title, subtitle, inputData, content, extra = {} }) {
  try {
    const key = getStorageKey(module);
    const raw = localStorage.getItem(key);
    let items = [];
    if (raw) {
      try {
        items = JSON.parse(raw);
        if (!Array.isArray(items)) items = [];
      } catch (_) {
        items = [];
      }
    }

    const newItem = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      module,
      title: title || 'Dokumen Tanpa Judul',
      subtitle: subtitle || '',
      inputData,
      content,
      extra
    };

    // Prepend new item
    items.unshift(newItem);

    // Limit to max items
    if (items.length > MAX_ARCHIVE_ITEMS) {
      items = items.slice(0, MAX_ARCHIVE_ITEMS);
    }

    localStorage.setItem(key, JSON.stringify(items));
    return newItem;
  } catch (e) {
    console.warn('Failed to save document archive:', e);
    return null;
  }
}

export function getDocArchives(module) {
  try {
    const key = getStorageKey(module);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.warn('Failed to get document archives:', e);
    return [];
  }
}

export function getDocArchiveById(module, id) {
  const items = getDocArchives(module);
  return items.find(item => item.id === id) || null;
}

export function deleteDocArchive(module, id) {
  try {
    const key = getStorageKey(module);
    const items = getDocArchives(module).filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch (e) {
    console.warn('Failed to delete document archive:', e);
    return false;
  }
}

export function clearDocArchives(module) {
  try {
    const key = getStorageKey(module);
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

function formatArchiveDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Hari ini, ${timeStr}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Kemarin, ${timeStr}`;
    }

    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ` ${timeStr}`;
  } catch (_) {
    return isoString;
  }
}

/**
 * Open Slide-over Drawer for Document History
 */
export function openArchiveDrawer({ module, moduleName = 'Dokumen', onSelect, onDownloadDocx }) {
  const existing = document.getElementById('kkg-archive-drawer-root');
  if (existing) existing.remove();

  const items = getDocArchives(module);

  const root = document.createElement('div');
  root.id = 'kkg-archive-drawer-root';
  root.className = 'fixed inset-0 z-[9999] overflow-hidden animate-fade-in';
  
  root.innerHTML = `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" id="kkg-drawer-backdrop"></div>
    <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
      <div class="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 translate-x-0">
        
        <!-- Drawer Header -->
        <div class="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <i class="fas fa-folder-open text-lg"></i>
            </div>
            <div>
              <h3 class="font-bold text-base text-white font-display">Riwayat ${escapeHtml(moduleName)}</h3>
              <p class="text-xs text-indigo-200/80">${items.length} dokumen tersimpan di perangkat ini</p>
            </div>
          </div>
          <button id="kkg-drawer-close" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div class="relative">
            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" id="kkg-drawer-search" placeholder="Cari topik atau mata pelajaran..." class="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500">
          </div>
        </div>

        <!-- Document List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3" id="kkg-drawer-list">
          ${items.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 text-2xl">
                <i class="fas fa-file-signature"></i>
              </div>
              <p class="font-bold text-slate-700 dark:text-slate-300 text-sm">Belum Ada Riwayat Tersimpan</p>
              <p class="text-xs text-slate-500 mt-1 max-w-xs">Setiap kali Anda selesai men-generate ${escapeHtml(moduleName)}, dokumen akan otomatis diarsipkan di sini.</p>
            </div>
          ` : items.map((item, idx) => `
            <div class="archive-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:shadow-md group relative" data-id="${item.id}" data-title="${escapeHtml(item.title).toLowerCase()}" data-sub="${escapeHtml(item.subtitle).toLowerCase()}">
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex-1 min-w-0">
                  <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wide">
                    ${escapeHtml(item.subtitle || moduleName)}
                  </span>
                  <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    ${escapeHtml(item.title)}
                  </h4>
                </div>
                <button class="btn-del-archive p-1.5 text-slate-400 hover:text-red-500 transition-colors" data-id="${item.id}" title="Hapus Dokumen">
                  <i class="fas fa-trash-alt text-xs"></i>
                </button>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                <span class="flex items-center gap-1.5">
                  <i class="far fa-clock text-[10px]"></i> ${formatArchiveDate(item.createdAt)}
                </span>
                <div class="flex items-center gap-2">
                  ${onDownloadDocx ? `
                    <button class="btn-download-archive px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-[11px] flex items-center gap-1" data-id="${item.id}">
                      <i class="fas fa-file-word"></i> DOCX
                    </button>
                  ` : ''}
                  <button class="btn-open-archive px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm" data-id="${item.id}">
                    <i class="fas fa-eye"></i> Buka
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Drawer Footer -->
        ${items.length > 0 ? `
          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <button id="kkg-drawer-clear-all" class="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5">
              <i class="fas fa-trash"></i> Bersihkan Semua
            </button>
            <span class="text-[11px] text-slate-400">Maks. 30 draft terakhir</span>
          </div>
        ` : ''}

      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Close handlers
  const close = () => root.remove();
  document.getElementById('kkg-drawer-close')?.addEventListener('click', close);
  document.getElementById('kkg-drawer-backdrop')?.addEventListener('click', close);

  // Search filter
  const searchInput = document.getElementById('kkg-drawer-search');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    root.querySelectorAll('.archive-card').forEach(card => {
      const title = card.dataset.title || '';
      const sub = card.dataset.sub || '';
      const match = !q || title.includes(q) || sub.includes(q);
      card.style.display = match ? '' : 'none';
    });
  });

  // Open item
  root.querySelectorAll('.btn-open-archive').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = getDocArchiveById(module, id);
      if (item && onSelect) {
        onSelect(item);
        close();
      }
    });
  });

  // Download direct DOCX
  root.querySelectorAll('.btn-download-archive').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = getDocArchiveById(module, id);
      if (item && onDownloadDocx) {
        onDownloadDocx(item);
      }
    });
  });

  // Delete single item
  root.querySelectorAll('.btn-del-archive').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Hapus dokumen ini dari riwayat lokal?')) {
        deleteDocArchive(module, id);
        showToast('Dokumen dihapus dari riwayat.', 'info');
        openArchiveDrawer({ module, moduleName, onSelect, onDownloadDocx }); // re-render
      }
    });
  });

  // Clear all
  document.getElementById('kkg-drawer-clear-all')?.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat dokumen tersimpan di modul ini?')) {
      clearDocArchives(module);
      showToast('Semua riwayat telah dibersihkan.', 'info');
      openArchiveDrawer({ module, moduleName, onSelect, onDownloadDocx }); // re-render
    }
  });
}
