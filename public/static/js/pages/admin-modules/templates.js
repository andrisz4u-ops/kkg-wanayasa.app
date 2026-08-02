import { state } from '../state.js';
import { api } from '../api.js';
import { debounce, moduleToast, escapeHtml } from '../utils.js';

window.loadTemplates = async function () {
  const list = document.getElementById('templates-list');
  if (!list) return;

  try {
    const url = window.currentTemplateFilter
      ? `/templates?jenis=${window.currentTemplateFilter}&active=false`
      : '/templates?active=false';

    const res = await api(url);
    if (!res.data || res.data.length === 0) {
      list.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500 flex flex-col items-center"><i class="fas fa-folder-open text-4xl mb-4 opacity-20"></i><span>Belum ada template surat.</span></div>';
      return;
    }

    list.innerHTML = res.data.map(t => `
    <div class="group relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/70 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden flex flex-col">
        <div class="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="p-5 flex flex-col flex-1">
          <div class="flex justify-between items-start mb-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.jenis === 'undangan' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'} capitalize">
              ${escapeHtml(t.jenis || '-')}
            </span>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="editTemplate(${t.id})" class="p-1.5 rounded-lg hover:bg-slate-50 backdrop-blur-xl text-blue-500 transition-colors" title="Edit"><i class="fas fa-edit"></i></button>
              <button onclick="deleteTemplate(${t.id}, '${escapeHtml(t.nama)}')" class="p-1.5 rounded-lg hover:bg-slate-50 backdrop-blur-xl text-red-500 transition-colors" title="Hapus"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${escapeHtml(t.nama)}</h3>
          <p class="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">${escapeHtml(t.deskripsi || 'Tidak ada deskripsi')}</p>
          <div class="pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
            <span><i class="far fa-clock mr-1"></i>${formatDate(t.created_at)}</span>
                        <button onclick="previewTemplate(${t.id})" class="text-blue-500 hover:underline">Pratinjau</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<div class="col-span-full text-center text-red-500 py-4">${escapeHtml(e.message || 'Gagal memuat template')}</div>`;
  }
}

window.filterTemplates = function (type) {
  window.currentTemplateFilter = type;
  document.querySelectorAll('.template-filter-btn').forEach(btn => {
    const isMatch = (type === '' && btn.innerText === 'Semua') || btn.innerText.toLowerCase().includes(type);
    if (isMatch) {
      btn.classList.add('bg-primary-50', 'text-primary-600', 'border', 'border-primary-100');
      btn.classList.remove('text-slate-600');
    } else {
      btn.classList.remove('bg-primary-50', 'text-primary-600', 'border', 'border-primary-100');
      btn.classList.add('text-slate-600');
    }
  });
  loadTemplates();
}

// [User Functions] 
