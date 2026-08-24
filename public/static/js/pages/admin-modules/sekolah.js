import { state } from '../../state.js';
import { api } from '../../api.js';
import { debounce, escapeHtml, skeletonTable } from '../../utils.js';
import {
  sekolahSelectionState,
  openAdminModal,
  closeAdminModal,
  showUndoActionBar,
  setBusyButton,
} from './shared-state.js';

const moduleToast = (section, message, type = 'info') => window.showToast?.(message, type);
const getTableSpacing = () => window.getTableSpacing?.() || { td: 'px-6 py-4 text-sm', row: 'text-sm' };

window.loadSekolah = async function () {
  const container = document.getElementById('sekolah-table-body');
  if (!container) return;
  const spacing = getTableSpacing();

  // Skeleton loader
  container.innerHTML = skeletonTable(6, 6);

  try {
    const res = await api('/sekolah');
    const sekolahList = res.data || [];
    sekolahSelectionState.selectedIds.clear();
    const checkAllSekolah = document.getElementById('sekolah-check-all');
    if (checkAllSekolah) checkAllSekolah.checked = false;
    if (sekolahList.length === 0) {
      sekolahSelectionState.selectedIds.clear();
      container.innerHTML = `<tr > <td colspan="7" class="text-center py-12 text-slate-500"><div class="flex flex-col items-center gap-3"><i class="fas fa-school text-4xl opacity-20"></i><span>Belum ada data sekolah</span><button onclick="showAddSekolahModal()" class="text-xs px-3 py-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-50 backdrop-blur-xl">Tambah Sekolah</button></div></td></tr> `;
      updateSekolahSelectionUI();
      return;
    }

    container.innerHTML = sekolahList.map((s, idx) => `
    <tr tabindex = "0" class="hover:bg-slate-50 backdrop-blur-xl odd:bg-slate-900/50 backdrop-blur-xl even:bg-slate-50 backdrop-blur-xl/35 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors border-b border-slate-200/70 last:border-0 group ${spacing.row}" >
              <td class="px-4 py-3 text-center"><input data-sekolah-id="${s.id}" type="checkbox" onchange="toggleSekolahRowSelection('${s.id}', this.checked)"></td>
              <td class="${spacing.td} text-slate-600">${idx + 1}</td>
              <td class="${spacing.td}">
                  <div class="flex flex-col">
                      <span class="font-bold text-slate-900 text-base group-hover:text-blue-500 transition-colors">${escapeHtml(s.nama)}</span>
                      ${s.is_sekretariat ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 w-fit mt-1"><i class="fas fa-star mr-1 text-[10px]"></i>Sekretariat</span>' : ''}
                  </div>
              </td>
              <td class="${spacing.td}">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.tipe === 'negeri' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-700'} capitalize">
                    ${s.tipe}
                  </span>
              </td>
              <td class="${spacing.td} text-slate-900">
                 ${s.kepala_sekolah ? `<div class="font-medium">${escapeHtml(s.kepala_sekolah)}</div>` : '<span class="text-slate-500 italic">Belum diset</span>'}
                 ${s.nip_kepala_sekolah ? `<div class="text-xs text-slate-500 font-mono mt-0.5">${escapeHtml(s.nip_kepala_sekolah)}</div>` : ''}
              </td>
              <td class="${spacing.td} text-center">
                <span class="font-mono text-sm bg-slate-50 backdrop-blur-xl px-2 py-1 rounded border border-slate-200/70">${s.jumlah_guru || '-'}</span>
              </td>
               <td class="${spacing.td} text-center">
                <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick='editSekolah(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors" title="Edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteSekolah(${s.id}, '${escapeHtml(s.nama || '')}')" class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                </div>
              </td >
            </tr >
    `).join('');

    updateSekolahSelectionUI();
  } catch (e) {
    sekolahSelectionState.selectedIds.clear();
    container.innerHTML = `<tr > <td colspan="7" class="text-center py-8"><div class="inline-flex flex-col items-center gap-2 text-rose-600"><i class="fas fa-triangle-exclamation"></i><span>${escapeHtml(e.message || 'Gagal memuat data sekolah')}</span><button onclick="loadSekolah()" class="text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100">Coba Lagi</button></div></td></tr> `;
    updateSekolahSelectionUI();
  }
}

function updateSekolahSelectionUI() {
  const toolbar = document.getElementById('sekolah-selection-toolbar');
  const countLabel = document.getElementById('sekolah-selected-count');
  const selectedCount = sekolahSelectionState.selectedIds.size;
  if (toolbar) toolbar.classList.toggle('hidden', selectedCount === 0);
  if (countLabel) countLabel.textContent = `${selectedCount} sekolah terpilih`;
}

window.toggleSekolahRowSelection = function (id, checked) {
  if (checked) sekolahSelectionState.selectedIds.add(String(id));
  else sekolahSelectionState.selectedIds.delete(String(id));
  updateSekolahSelectionUI();
}

window.toggleAllSekolahRows = function (checked) {
  const checkboxes = document.querySelectorAll('#sekolah-table-body input[type="checkbox"]');
  sekolahSelectionState.selectedIds.clear();
  checkboxes.forEach((cb) => {
    cb.checked = checked;
    const id = cb.getAttribute('data-sekolah-id');
    if (checked && id) sekolahSelectionState.selectedIds.add(String(id));
  });
  updateSekolahSelectionUI();
}

window.showAddSekolahModal = function () {
  openAdminModal('sekolah-modal', 'input[name="nama"]');
  const form = document.getElementById('sekolah-form');
  form.reset();
  form.id_sekolah.value = '';
  document.getElementById('sekolah-modal-title').textContent = 'Tambah Sekolah';
}

window.editSekolah = function (sekolah) {
  openAdminModal('sekolah-modal', 'input[name="nama"]');
  document.getElementById('sekolah-modal-title').textContent = 'Edit Sekolah';

  const form = document.getElementById('sekolah-form');
  form.id_sekolah.value = sekolah.id;
  form.nama.value = sekolah.nama || '';
  form.alamat.value = sekolah.alamat || '';
  form.npsn.value = sekolah.npsn || '';
  form.tipe.value = sekolah.tipe || 'negeri';
  form.kepala_sekolah.value = sekolah.kepala_sekolah || '';
  form.nip_kepala_sekolah.value = sekolah.nip_kepala_sekolah || '';
  form.kop_surat_url.value = sekolah.kop_surat_url || '';

  // Show kop surat preview if exists
  const preview = document.getElementById('kop-surat-preview');
  const img = document.getElementById('kop-surat-img');
  if (sekolah.kop_surat_url) {
    img.src = sekolah.kop_surat_url;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
  form.jumlah_guru.value = sekolah.jumlah_guru || '';
  form.is_sekretariat.checked = !!sekolah.is_sekretariat;
  form.is_sekolah_penggerak.checked = !!sekolah.is_sekolah_penggerak;
}

window.saveSekolah = async function (e) {
  e.preventDefault();
  const form = e.target;
  const id = form.id_sekolah.value;
  const submitBtn = document.getElementById('sekolah-submit-btn');
  const restoreBtn = setBusyButton(submitBtn, true, id ? 'Memperbarui...' : 'Menyimpan...');

  try {
    // Handle kop surat - compress and convert to base64 data URL
    let kopUrl = form.kop_surat_url.value || null;
    const fileInput = form.querySelector('input[name="kop_surat_file"]');
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
          moduleToast('Sekolah', 'Ukuran file kop surat maksimal 5MB', 'warning');
        } else {
          // Compress image using canvas
          kopUrl = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              let w = img.width, h = img.height;
              if (w > MAX_WIDTH) { h = Math.round(h * MAX_WIDTH / w); w = MAX_WIDTH; }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              console.log('[KOP SURAT] Compressed:', Math.round(dataUrl.length / 1024), 'KB');
              resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
          });
        }
      } catch (err) {
        console.error('[KOP SURAT] Compression failed:', err);
        moduleToast('Sekolah', 'Gagal memproses gambar kop surat', 'warning');
      }
    }

    // Collect data
    const data = {
      nama: form.nama.value,
      alamat: form.alamat.value,
      npsn: form.npsn.value,
      tipe: form.tipe.value,
      kepala_sekolah: form.kepala_sekolah.value,
      nip_kepala_sekolah: form.nip_kepala_sekolah.value,
      jumlah_guru: form.jumlah_guru.value,
      is_sekretariat: form.is_sekretariat.checked,
      is_sekolah_penggerak: form.is_sekolah_penggerak.checked,
      kop_surat_url: kopUrl
    };

    if (id) {
      await api(`/sekolah/${id}`, { method: 'PUT', body: data });
      moduleToast('Sekolah', 'Data sekolah berhasil diperbarui', 'success');
    } else {
      await api('/sekolah', { method: 'POST', body: data });
      moduleToast('Sekolah', 'Data sekolah berhasil ditambahkan', 'success');
    }
    document.getElementById('sekolah-modal').classList.add('hidden');
    closeAdminModal('sekolah-modal');
    loadSekolah();
  } catch (e) { moduleToast('Sekolah', e.message || 'Gagal menyimpan data sekolah', 'error'); }
  finally { restoreBtn(); }
}

window.previewKopSurat = function (input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById('kop-surat-preview');
      const img = document.getElementById('kop-surat-img');
      img.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(input.files[0]);
  }
}

window.removeKopSurat = function () {
  const form = document.getElementById('sekolah-form');
  form.kop_surat_url.value = '';
  const preview = document.getElementById('kop-surat-preview');
  preview.classList.add('hidden');
  const fileInput = form.querySelector('input[name="kop_surat_file"]');
  if (fileInput) fileInput.value = '';
}

window.closeSekolahModal = function () {
  closeAdminModal('sekolah-modal');
}

window.deleteSekolah = async function (id, nama = '') {
  if (!confirm('Hapus sekolah ini?')) return;

  showUndoActionBar(
    `Penghapusan sekolah ${nama || ''} dijadwalkan(5 detik).`,
    async () => {
      try {
        await api(`/sekolah/${id}`, { method: 'DELETE' });
        moduleToast('Sekolah', 'Data sekolah berhasil dihapus', 'success');
        loadSekolah();
      } catch (e) {
        moduleToast('Sekolah', e.message || 'Gagal menghapus data sekolah', 'error');
      }
    },
    () => moduleToast('Sekolah', 'Aksi penghapusan dibatalkan', 'info')
  );
}


