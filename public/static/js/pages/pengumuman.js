
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDateTime, escapeHtml, nl2br, showToast } from '../utils.js';

let currentPengumumanList = [];
let lastFocusedElementBeforeModal = null;

function getModalFocusableElements(modal) {
  if (!modal) return [];
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  return Array.from(modal.querySelectorAll(selector)).filter((el) => !el.hasAttribute('hidden'));
}

function handlePengumumanModalKeydown(event) {
  const modal = document.getElementById('pengumuman-modal');
  if (!modal || modal.classList.contains('hidden')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    window.closePengumumanModal();
    return;
  }

  if (event.key !== 'Tab') return;

  const focusables = getModalFocusableElements(modal);
  if (focusables.length === 0) {
    event.preventDefault();
    modal.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function openPengumumanModal(contentHtml) {
  const modal = document.getElementById('pengumuman-modal');
  const content = document.getElementById('pengumuman-modal-content');
  if (!modal || !content) return;

  lastFocusedElementBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  content.innerHTML = contentHtml;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modal.removeEventListener('keydown', handlePengumumanModalKeydown);
  modal.addEventListener('keydown', handlePengumumanModalKeydown);

  const focusables = getModalFocusableElements(modal);
  if (focusables.length > 0) {
    focusables[0].focus();
  } else {
    modal.focus();
  }
}

export async function renderPengumuman() {
  try {
    const res = await api('/pengumuman');
    currentPengumumanList = res.data || [];
  } catch (e) {
    console.error(e);
    currentPengumumanList = [];
  }

  // Assign to window for access in inline handlers if needed
  window.currentPengumumanList = currentPengumumanList;

  return `
  <div class="fade-in max-w-6xl mx-auto py-8 px-4 md:px-6">
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"></div>
      <div class="absolute top-40 right-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(38,148,148,0.05)_1px,transparent_0)] [background-size:28px_28px]"></div>
    </div>

    <div class="mb-10 rounded-[40px] border border-teal-500/10 bg-white/70 p-6 shadow-xl shadow-teal-500/5 backdrop-blur-xl md:p-10 border-b-4 border-b-teal-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-display font-black text-teal-950 md:text-5xl tracking-tight">
            <i class="fas fa-bullhorn text-teal-500 mr-4"></i>Pengumuman
          </h1>
          <p class="text-slate-600 mt-3 text-lg">Informasi terkini, agenda, dan berita seputar KKG Gugus 3.</p>
        </div>
        ${state.user?.role === 'admin' ? `
          <button onclick="showAddPengumuman()" class="px-8 py-4 bg-teal-500 text-white rounded-full font-bold text-sm shadow-xl shadow-teal-500/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 focus:outline-none">
            <i class="fas fa-plus mr-2"></i>Buat Pengumuman
          </button>` : ''}
      </div>
    </div>

    <!-- Modal Container -->
    <div id="pengumuman-modal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true" aria-hidden="true" tabindex="-1">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" aria-hidden="true" onclick="closePengumumanModal()"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-[40px] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-teal-500/10">
            <div id="pengumuman-modal-content"></div>
        </div>
      </div>
    </div>

    <div class="grid gap-8">
      ${currentPengumumanList.length > 0 ? currentPengumumanList.map(p => `
        <div class="bg-white/80 rounded-[40px] p-6 md:p-10 border border-teal-500/10 hover:border-teal-500/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 motion-safe:hover:-translate-y-1 group relative overflow-hidden backdrop-blur-sm">
          <!-- Decoration -->
          <div class="absolute top-0 right-0 p-12 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <i class="fas fa-bullhorn text-[12rem]"></i>
          </div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-6">
               <div class="flex items-center gap-3">
                  ${p.is_pinned ? `<span class="px-4 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] rounded-full font-black uppercase tracking-wider shadow-sm"><i class="fas fa-thumbtack mr-1.5"></i>Penting</span>` : ''}
                  <span class="px-4 py-1.5 bg-teal-50 border border-teal-100 text-teal-600 text-[11px] rounded-full font-black uppercase tracking-wider shadow-sm">${escapeHtml(p.kategori || 'umum')}</span>
               </div>
               ${state.user?.role === 'admin' ? `
                <div class="flex gap-2">
                   <button onclick="editPengumuman(${p.id})" class="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-2xl transition-all" title="Edit"><i class="fas fa-edit"></i></button>
                   <button onclick="deletePengumuman(${p.id})" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>` : ''}
            </div>
            
            <h2 class="font-display font-black text-teal-950 text-2xl md:text-3xl mb-5 leading-tight group-hover:text-teal-600 transition-colors uppercase tracking-tight">${escapeHtml(p.judul)}</h2>
            <div class="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8 text-lg">${nl2br(escapeHtml(p.isi))}</div>
            
            <div class="flex flex-wrap items-center gap-y-4 gap-x-8 pt-8 border-t border-teal-500/10 text-sm text-slate-500 font-medium">
              <span class="flex items-center"><i class="fas fa-user-circle mr-2.5 text-teal-500 text-xl"></i>${escapeHtml(p.author_name || 'Admin')}</span>
              <span class="flex items-center"><i class="far fa-calendar-alt mr-2.5 text-teal-500 text-lg"></i>${formatDateTime(p.created_at)}</span>
            </div>
          </div>
          <!-- Accent Light -->
          <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      `).join('') : `
        <div class="text-center py-20 rounded-[40px] border-4 border-dashed border-teal-500/10 bg-teal-500/5 backdrop-blur">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-xl shadow-teal-500/10 mb-8 text-teal-500">
                <i class="fas fa-bullhorn text-4xl"></i>
            </div>
            <h3 class="text-2xl font-black text-teal-950 mb-3">Belum ada pengumuman</h3>
            <p class="text-slate-600 text-lg">Pengumuman terbaru akan muncul di sini.</p>
        </div>
      `}
    </div>
  </div>`;
}

// Modal Helpers
window.closePengumumanModal = function () {
  const modal = document.getElementById('pengumuman-modal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  modal.removeEventListener('keydown', handlePengumumanModalKeydown);

  if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
    lastFocusedElementBeforeModal.focus();
  }
}

function renderModalContent(title, btnText, data = {}) {
  const isEdit = !!data.id;
  return `
    <div class="px-8 py-6 bg-white border-b border-teal-500/10">
        <h3 class="font-display font-black text-xl text-teal-950 flex items-center tracking-tight">
            <i class="fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'} text-teal-500 mr-4"></i>
            ${title}
        </h3>
    </div>
    <form onsubmit="handlePengumumanSubmit(event, ${isEdit ? data.id : null})" class="p-8">
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-bold text-teal-900 mb-2 ml-1">Judul Pengumuman</label>
                <input type="text" name="judul" required value="${isEdit ? escapeHtml(data.judul) : ''}" 
                       placeholder="Contoh: Rapat Bulanan Februari" 
                       class="w-full px-5 py-4 bg-slate-50 border border-teal-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400 font-medium">
            </div>
            
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-bold text-teal-900 mb-2 ml-1">Kategori</label>
                    <div class="relative">
                      <select name="kategori" class="w-full px-5 py-4 bg-slate-50 border border-teal-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-slate-800 appearance-none font-medium">
                          <option value="umum" ${data.kategori === 'umum' ? 'selected' : ''}>Umum</option>
                          <option value="jadwal" ${data.kategori === 'jadwal' ? 'selected' : ''}>Jadwal</option>
                          <option value="kegiatan" ${data.kategori === 'kegiatan' ? 'selected' : ''}>Kegiatan</option>
                          <option value="penting" ${data.kategori === 'penting' ? 'selected' : ''}>Penting</option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-teal-500">
                        <i class="fas fa-chevron-down text-xs"></i>
                      </div>
                    </div>
                </div>
                <div class="flex items-center pt-8">
                    <label class="inline-flex items-center cursor-pointer group">
                        <input type="checkbox" name="is_pinned" class="form-checkbox h-6 w-6 text-teal-500 rounded-xl border-teal-200 bg-slate-50 focus:ring-teal-500/20 transition duration-200" ${data.is_pinned ? 'checked' : ''}>
                        <span class="ml-3 text-sm font-bold text-slate-700 group-hover:text-teal-600 transition-colors">Sematkan di atas</span>
                    </label>
                </div>
            </div>

            <div>
                <label class="block text-sm font-bold text-teal-900 mb-2 ml-1">Isi Pengumuman</label>
                <textarea name="isi" required rows="6" 
                          placeholder="Tulis detail pengumuman di sini..." 
                          class="w-full px-5 py-4 bg-slate-50 border border-teal-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-slate-800 resize-y font-medium placeholder:text-slate-400">${isEdit ? escapeHtml(data.isi) : ''}</textarea>
            </div>
        </div>

        <div class="mt-10 flex gap-4 justify-end pt-8 border-t border-teal-500/10">
            <button type="button" onclick="closePengumumanModal()" class="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-full font-bold text-sm hover:bg-slate-50 transition-all active:scale-95">
                Batal
            </button>
            <button type="submit" class="px-8 py-3.5 bg-teal-500 text-white rounded-full font-bold text-sm shadow-xl shadow-teal-500/20 hover:-translate-y-1 hover:shadow-2xl transition-all active:scale-95">
                ${btnText}
            </button>
        </div>
    </form>
    `;
}

// Global functions
window.showAddPengumuman = function () {
  openPengumumanModal(renderModalContent('Buat Pengumuman Baru', 'Posting Pengumuman'));
}

window.editPengumuman = function (id) {
  const data = window.currentPengumumanList.find(p => p.id === id);
  if (!data) return;

  openPengumumanModal(renderModalContent('Edit Pengumuman', 'Simpan Perubahan', data));
}

window.handlePengumumanSubmit = async function (e, id) {
  e.preventDefault();
  const form = e.target;
  // Find the submit button and disable it to prevent double submission
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';

  try {
    const payload = {
      judul: form.judul.value,
      isi: form.isi.value,
      kategori: form.kategori.value,
      is_pinned: form.is_pinned.checked,
    };

    let res;
    if (id) {
      // Edit mode
      res = await api(`/pengumuman/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast('Pengumuman berhasil diperbarui!', 'success');
    } else {
      // Create mode
      res = await api('/pengumuman', {
        method: 'POST',
        body: payload
      });
      showToast('Pengumuman berhasil dibuat!', 'success');
    }

    closePengumumanModal();
    // Reload parent content (re-render)
    const mainContent = document.querySelector('main') || document.body;
    // Ideally trigger a re-render of this page component specifically, 
    // but reloading window is a safe fallback for now or re-calling render logic if available.
    // Since this is an SPA, we might want to just re-render this view.
    // Assuming renderPengumuman is called by router, we can try to re-render using router or refresh.
    // For now, let's just reload to be safe and simple.
    window.location.reload();

  } catch (e) {
    showToast(e.message || 'Terjadi kesalahan', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

window.deletePengumuman = async function (id) {
  if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

  try {
    await api(`/pengumuman/${id}`, { method: 'DELETE' });
    showToast('Pengumuman berhasil dihapus', 'success');
    window.location.reload();
  } catch (e) {
    showToast(e.message || 'Gagal menghapus pengumuman', 'error');
  }
}
