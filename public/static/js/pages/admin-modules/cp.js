import { api } from '../../api.js';
import { escapeHtml, showToast, debounce } from '../../utils.js';
import { openAdminModal, closeAdminModal, setBusyButton } from './shared-state.js';

let cpList = [];
let currentFilter = {
  mata_pelajaran: 'all',
  fase: 'all',
  search: ''
};

const STANDARD_MAPEL = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Bahasa Inggris',
  'Seni Rupa',
  'Seni Musik',
  'Seni Tari',
  'Koding dan Kecerdasan Artifisial',
  'B.Sunda',
  'Tatanen di Bale Atikan',
  'AKPK'
];

window.loadAdminCPData = async function () {
  const container = document.getElementById('cp-list-container');
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full py-16 text-center text-slate-500">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
      <p class="text-sm font-medium">Memuat data Capaian Pembelajaran...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (currentFilter.mata_pelajaran !== 'all') params.append('mata_pelajaran', currentFilter.mata_pelajaran);
    if (currentFilter.fase !== 'all') params.append('fase', currentFilter.fase);
    if (currentFilter.search.trim()) params.append('search', currentFilter.search.trim());

    const res = await api(`/admin/cp?${params.toString()}`);
    cpList = res.data?.items || [];

    updateCPStatsUI();
    renderCPList();
  } catch (err) {
    console.error('Failed loading CP data:', err);
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-rose-500">
        <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
        <p class="text-sm font-semibold">Gagal memuat data CP: ${escapeHtml(err.message || 'Error server')}</p>
        <button onclick="loadAdminCPData()" class="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700">
          Coba Lagi
        </button>
      </div>
    `;
  }
};

function updateCPStatsUI() {
  const totalEl = document.getElementById('cp-stat-total');
  const mapelCountEl = document.getElementById('cp-stat-mapel-count');
  if (totalEl) totalEl.textContent = cpList.length;

  if (mapelCountEl) {
    const uniqueMapels = new Set(cpList.map(item => item.mata_pelajaran));
    mapelCountEl.textContent = uniqueMapels.size;
  }
}

function renderCPList() {
  const container = document.getElementById('cp-list-container');
  if (!container) return;

  if (cpList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 bg-white/60 dark:bg-slate-800/40 rounded-3xl border border-slate-200/70 dark:border-slate-700/60 p-8">
        <i class="fas fa-book-open text-4xl opacity-30 mb-3 block"></i>
        <h4 class="text-base font-semibold text-slate-700 dark:text-slate-300">Tidak ada Capaian Pembelajaran ditemukan</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">Sesuaikan kata kunci pencarian atau filter mata pelajaran dan fase di atas.</p>
        <div class="mt-4 flex justify-center gap-2">
          <button onclick="resetCPFilter()" class="px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100">
            Reset Filter
          </button>
          <button onclick="confirmResetAllCP()" class="px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl hover:bg-emerald-100">
            Inisialisasi Standar BSKAP
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = cpList.map(item => {
    const faseColor = item.fase === 'Fase A'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
      : item.fase === 'Fase B'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700'
        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700';

    const elementsObj = item.elements || {};
    const elementKeys = Object.keys(elementsObj);
    const elementsCount = elementKeys.length;

    // Truncate narrative for card preview
    const previewText = item.teks_cp.length > 220
      ? item.teks_cp.substring(0, 220) + '...'
      : item.teks_cp;

    return `
      <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group">
        <div>
          <!-- Header card -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${faseColor} mb-2">
                <i class="fas fa-layer-group mr-1.5 text-[10px]"></i>${escapeHtml(item.fase)}
              </span>
              <h3 class="text-base font-bold text-slate-800 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                ${escapeHtml(item.mata_pelajaran)}
              </h3>
            </div>
            <span class="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap border border-slate-200 dark:border-slate-600">
              ${escapeHtml(item.regulasi || 'BSKAP 046/2025')}
            </span>
          </div>

          <!-- Narasi preview -->
          <div class="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 line-clamp-4">
            ${escapeHtml(previewText)}
          </div>

          <!-- Elemen pills -->
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <div class="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-2">
              <span><i class="fas fa-cubes mr-1.5 text-indigo-500"></i>${elementsCount} Elemen Pembelajaran:</span>
            </div>
            <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              ${elementKeys.length > 0 ? elementKeys.map(k => `
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 truncate max-w-[200px]" title="${escapeHtml(k)}">
                  ${escapeHtml(k)}
                </span>
              `).join('') : '<span class="text-[11px] text-slate-600 italic">Belum ada rincian elemen</span>'}
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="mt-6 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <span class="text-[10px] text-slate-600 dark:text-slate-300">
            Diperbarui: ${item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
          </span>
          <div class="flex items-center gap-1.5">
            <button onclick="confirmResetSingleCP('${escapeHtml(item.mata_pelajaran)}', '${escapeHtml(item.fase)}')" class="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-xs font-semibold" title="Reset ke Standar BSKAP">
              <i class="fas fa-rotate-left mr-1"></i>Reset
            </button>
            <button onclick="openEditCPModal(${item.id})" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-500/20 hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5">
              <i class="fas fa-pen-to-square text-[11px]"></i> Edit CP
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// Filter Handlers
// ============================================

window.onCPMapelFilterChange = function (val) {
  currentFilter.mata_pelajaran = val;
  window.loadAdminCPData();
};

window.onCPFaseFilterChange = function (val) {
  currentFilter.fase = val;
  // Update button active styles
  document.querySelectorAll('.cp-fase-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-fase') === val) {
      btn.className = 'cp-fase-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm transition-all';
    } else {
      btn.className = 'cp-fase-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all';
    }
  });
  window.loadAdminCPData();
};

window.onCPSearchInput = debounce(function (val) {
  currentFilter.search = val;
  window.loadAdminCPData();
}, 300);

window.resetCPFilter = function () {
  currentFilter = { mata_pelajaran: 'all', fase: 'all', search: '' };
  const mapelSelect = document.getElementById('cp-filter-mapel');
  if (mapelSelect) mapelSelect.value = 'all';
  const searchInput = document.getElementById('cp-filter-search');
  if (searchInput) searchInput.value = '';
  window.onCPFaseFilterChange('all');
};

// ============================================
// Edit CP Modal
// ============================================

let currentEditingElements = [];

window.openEditCPModal = async function (id) {
  const item = cpList.find(c => c.id === id);
  if (!item) return;

  const modal = document.getElementById('modal-edit-cp');
  if (!modal) return;

  document.getElementById('edit-cp-id').value = item.id;
  document.getElementById('edit-cp-mapel').value = item.mata_pelajaran;
  document.getElementById('edit-cp-fase').value = item.fase;
  document.getElementById('edit-cp-regulasi').value = item.regulasi || 'BSKAP No. 046 Tahun 2025';
  document.getElementById('edit-cp-teks').value = item.teks_cp;

  // Populate dynamic elements
  const elementsObj = item.elements || {};
  currentEditingElements = Object.entries(elementsObj).map(([nama, deskripsi]) => ({
    nama,
    deskripsi
  }));

  renderModalElementsList();
  openAdminModal('modal-edit-cp');
};

function renderModalElementsList() {
  const container = document.getElementById('edit-cp-elements-container');
  if (!container) return;

  if (currentEditingElements.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
        <p class="text-xs">Belum ada elemen ditambahkan.</p>
        <button type="button" onclick="addModalElementRow()" class="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <i class="fas fa-plus mr-1"></i>Tambah Elemen Pertama
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = currentEditingElements.map((el, idx) => `
    <div class="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 relative group">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 flex-1">
          <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
            ${idx + 1}
          </span>
          <input
            type="text"
            value="${escapeHtml(el.nama)}"
            placeholder="Nama Elemen (misal: Membaca dan Memirsa)"
            onchange="updateModalElement(${idx}, 'nama', this.value)"
            class="flex-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button type="button" onclick="removeModalElementRow(${idx})" class="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors" title="Hapus elemen">
          <i class="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
      <div>
        <textarea
          rows="2"
          placeholder="Deskripsi Capaian Elemen..."
          onchange="updateModalElement(${idx}, 'deskripsi', this.value)"
          class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
        >${escapeHtml(el.deskripsi)}</textarea>
      </div>
    </div>
  `).join('');
}

window.addModalElementRow = function () {
  currentEditingElements.push({ nama: '', deskripsi: '' });
  renderModalElementsList();
};

window.updateModalElement = function (index, field, value) {
  if (currentEditingElements[index]) {
    currentEditingElements[index][field] = value;
  }
};

window.removeModalElementRow = function (index) {
  currentEditingElements.splice(index, 1);
  renderModalElementsList();
};

window.saveCPEdit = async function () {
  const id = document.getElementById('edit-cp-id').value;
  const teks_cp = document.getElementById('edit-cp-teks').value.trim();
  const regulasi = document.getElementById('edit-cp-regulasi').value.trim();
  const mata_pelajaran = document.getElementById('edit-cp-mapel').value;
  const fase = document.getElementById('edit-cp-fase').value;
  const saveBtn = document.getElementById('btn-save-cp-edit');

  if (!teks_cp) {
    showToast('Narasi Capaian Pembelajaran wajib diisi', 'error');
    return;
  }

  // Convert elements array to key-value object
  const elemen_json = {};
  currentEditingElements.forEach(el => {
    const k = (el.nama || '').trim();
    if (k) {
      elemen_json[k] = (el.deskripsi || '').trim();
    }
  });

  setBusyButton(saveBtn, true, 'Menyimpan...');

  try {
    const res = await api(`/admin/cp/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        teks_cp,
        regulasi,
        mata_pelajaran,
        fase,
        elemen_json
      })
    });

    if (res.success) {
      showToast('Capaian Pembelajaran berhasil diperbarui', 'success');
      closeAdminModal('modal-edit-cp');
      window.loadAdminCPData();
    } else {
      showToast(res.error?.message || 'Gagal menyimpan perubahan', 'error');
    }
  } catch (err) {
    console.error('Save CP error:', err);
    showToast(err.message || 'Terjadi kesalahan sistem saat menyimpan', 'error');
  } finally {
    setBusyButton(saveBtn, false, 'Simpan Perubahan');
  }
};

// ============================================
// Add Custom CP Modal
// ============================================

window.openAddCPModal = function () {
  const modal = document.getElementById('modal-add-cp');
  if (!modal) return;

  document.getElementById('add-cp-teks').value = '';
  document.getElementById('add-cp-regulasi').value = 'BSKAP No. 046 Tahun 2025';
  currentEditingElements = [];
  renderAddModalElementsList();
  openAdminModal('modal-add-cp');
};

function renderAddModalElementsList() {
  const container = document.getElementById('add-cp-elements-container');
  if (!container) return;

  if (currentEditingElements.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
        <p class="text-xs">Belum ada elemen ditambahkan.</p>
        <button type="button" onclick="addAddModalElementRow()" class="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <i class="fas fa-plus mr-1"></i>Tambah Elemen
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = currentEditingElements.map((el, idx) => `
    <div class="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 flex-1">
          <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
            ${idx + 1}
          </span>
          <input
            type="text"
            value="${escapeHtml(el.nama)}"
            placeholder="Nama Elemen"
            onchange="updateAddModalElement(${idx}, 'nama', this.value)"
            class="flex-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
        </div>
        <button type="button" onclick="removeAddModalElementRow(${idx})" class="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg">
          <i class="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
      <div>
        <textarea
          rows="2"
          placeholder="Deskripsi Capaian Elemen..."
          onchange="updateAddModalElement(${idx}, 'deskripsi', this.value)"
          class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white leading-relaxed"
        >${escapeHtml(el.deskripsi)}</textarea>
      </div>
    </div>
  `).join('');
}

window.addAddModalElementRow = function () {
  currentEditingElements.push({ nama: '', deskripsi: '' });
  renderAddModalElementsList();
};

window.updateAddModalElement = function (index, field, value) {
  if (currentEditingElements[index]) {
    currentEditingElements[index][field] = value;
  }
};

window.removeAddModalElementRow = function (index) {
  currentEditingElements.splice(index, 1);
  renderAddModalElementsList();
};

window.saveNewCP = async function () {
  const mapelSelect = document.getElementById('add-cp-mapel');
  const customMapelInput = document.getElementById('add-cp-custom-mapel');
  const mata_pelajaran = mapelSelect.value === '__custom__'
    ? customMapelInput.value.trim()
    : mapelSelect.value;

  const fase = document.getElementById('add-cp-fase').value;
  const regulasi = document.getElementById('add-cp-regulasi').value.trim();
  const teks_cp = document.getElementById('add-cp-teks').value.trim();
  const saveBtn = document.getElementById('btn-save-new-cp');

  if (!mata_pelajaran) {
    showToast('Mata Pelajaran wajib dipilih atau diisi', 'error');
    return;
  }
  if (!fase) {
    showToast('Fase wajib dipilih', 'error');
    return;
  }
  if (!teks_cp) {
    showToast('Narasi Capaian Pembelajaran wajib diisi', 'error');
    return;
  }

  const elemen_json = {};
  currentEditingElements.forEach(el => {
    const k = (el.nama || '').trim();
    if (k) elemen_json[k] = (el.deskripsi || '').trim();
  });

  setBusyButton(saveBtn, true, 'Menambahkan...');

  try {
    const res = await api('/admin/cp', {
      method: 'POST',
      body: JSON.stringify({
        mata_pelajaran,
        fase,
        teks_cp,
        elemen_json,
        regulasi
      })
    });

    if (res.success) {
      showToast('Capaian Pembelajaran baru berhasil ditambahkan', 'success');
      closeAdminModal('modal-add-cp');
      window.loadAdminCPData();
    } else {
      showToast(res.error?.message || 'Gagal menambahkan CP', 'error');
    }
  } catch (err) {
    console.error('Add CP error:', err);
    showToast(err.message || 'Terjadi kesalahan sistem', 'error');
  } finally {
    setBusyButton(saveBtn, false, 'Simpan Capaian Pembelajaran');
  }
};

window.onAddMapelSelectChange = function (val) {
  const customWrapper = document.getElementById('add-cp-custom-mapel-wrapper');
  if (customWrapper) {
    if (val === '__custom__') {
      customWrapper.classList.remove('hidden');
    } else {
      customWrapper.classList.add('hidden');
    }
  }
};

// ============================================
// Reset Handlers
// ============================================

window.confirmResetSingleCP = async function (mataPelajaran, fase) {
  if (!confirm(`Apakah Anda yakin ingin mereset Capaian Pembelajaran "${mataPelajaran}" (${fase}) ke standar baku resmi BSKAP No. 046 Tahun 2025?\n\nPerubahan teks yang pernah Anda lakukan pada mata pelajaran ini akan dikembalikan ke teks awal.`)) {
    return;
  }

  try {
    const res = await api('/admin/cp/reset', {
      method: 'POST',
      body: JSON.stringify({ mata_pelajaran: mataPelajaran, fase })
    });

    if (res.success) {
      showToast(`CP ${mataPelajaran} (${fase}) berhasil direset ke standar BSKAP`, 'success');
      window.loadAdminCPData();
    } else {
      showToast(res.error?.message || 'Gagal mereset CP', 'error');
    }
  } catch (err) {
    console.error('Reset single CP error:', err);
    showToast(err.message || 'Gagal mereset data', 'error');
  }
};

window.confirmResetAllCP = async function () {
  if (!confirm('PERINGATAN: Apakah Anda yakin ingin mereset SEMUA Capaian Pembelajaran ke standar resmi BSKAP No. 046 Tahun 2025?\n\nSeluruh 12 mata pelajaran dan muatan lokal akan dikembalikan ke teks baku resmi. Tindakan ini tidak dapat dibatalkan.')) {
    return;
  }

  try {
    const res = await api('/admin/cp/reset', {
      method: 'POST',
      body: JSON.stringify({ reset_all: true })
    });

    if (res.success) {
      showToast('Semua Capaian Pembelajaran berhasil direset ke standar resmi', 'success');
      window.loadAdminCPData();
    } else {
      showToast(res.error?.message || 'Gagal mereset CP', 'error');
    }
  } catch (err) {
    console.error('Reset all CP error:', err);
    showToast(err.message || 'Gagal mereset semua data', 'error');
  }
};
