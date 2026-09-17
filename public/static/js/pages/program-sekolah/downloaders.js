// public/static/js/pages/program-sekolah/downloaders.js

import { api } from '../../api.js';
import { showToast, showLoading, hideLoading } from '../../utils.js';

/**
 * Unduh Dokumen Lengkap Program Sekolah (BAB I-V + Seluruh Lampiran dalam 1 File DOCX)
 */
export async function downloadProgramDocx(programData) {
  if (!programData || !programData.metadata) {
    showToast('Data dokumen program sekolah tidak ditemukan', 'error');
    return;
  }

  showLoading('Menyiapkan file Microsoft Word (DOCX)...');

  try {
    const res = await fetch('/api/program-sekolah/docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(programData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mengekspor dokumen DOCX');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = 'Program_Sekolah.docx';
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    } else {
      const safeTitle = (programData.metadata.judul_program || 'Program_Sekolah')
        .replace(/[\\/?%*:|"<>]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 40);
      filename = `${safeTitle}.docx`;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showToast('Dokumen Program Kerja (DOCX) berhasil diunduh!', 'success');
  } catch (err) {
    console.error('Download DOCX Error:', err);
    showToast(err.message || 'Terjadi kesalahan saat mengunduh DOCX', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Simpan Dokumen Program Sekolah ke Database Arsip
 */
export async function saveProgramToArchive(programData) {
  if (!programData || !programData.metadata) {
    showToast('Tidak ada dokumen yang dapat disimpan', 'error');
    return false;
  }

  showLoading('Menyimpan dokumen ke arsip...');
  try {
    const res = await api('/program-sekolah/save', {
      method: 'POST',
      body: JSON.stringify({ data: programData }),
    });

    showToast('Dokumen Program Sekolah berhasil disimpan ke arsip!', 'success');
    return res;
  } catch (err) {
    console.error('Save Archive Error:', err);
    showToast(err.message || 'Gagal menyimpan dokumen ke arsip', 'error');
    return false;
  } finally {
    hideLoading();
  }
}

/**
 * Buka Drawer Riwayat Program Sekolah
 */
export async function openProgramArchiveDrawer(onSelectProgram) {
  showLoading('Memuat daftar riwayat arsip...');
  try {
    const res = await api('/program-sekolah/history');
    const items = (res && res.data) ? res.data : [];

    renderArchiveDrawerHtml(items, onSelectProgram);
  } catch (err) {
    console.error('History Error:', err);
    showToast(err.message || 'Gagal memuat riwayat dokumen', 'error');
  } finally {
    hideLoading();
  }
}

function renderArchiveDrawerHtml(items, onSelectProgram) {
  // Remove existing drawer if any
  const existing = document.getElementById('program-archive-drawer');
  if (existing) existing.remove();

  const drawer = document.createElement('div');
  drawer.id = 'program-archive-drawer';
  drawer.className = 'fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in';

  drawer.innerHTML = `
    <div class="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col transform transition-transform duration-300">
      
      <!-- Drawer Header -->
      <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-xs">
            <i class="fa-solid fa-folder-open"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-base">Riwayat Dokumen Program</h3>
            <p class="text-xs text-slate-500">${items.length} dokumen tersimpan</p>
          </div>
        </div>
        <button type="button" onclick="document.getElementById('program-archive-drawer').remove()" 
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Drawer Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-3">
        ${items.length === 0 ? `
          <div class="text-center py-16 text-slate-400">
            <i class="fa-solid fa-box-open text-5xl mb-3 text-slate-300"></i>
            <p class="font-medium text-slate-600">Belum ada dokumen yang disimpan</p>
            <p class="text-xs text-slate-400 mt-1">Buat dokumen program sekolah baru dan klik "Simpan ke Arsip".</p>
          </div>
        ` : items.map(item => `
          <div class="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group bg-white shadow-xs">
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                ${item.template_id || 'Program'}
              </span>
              <span class="text-[11px] text-slate-400">
                ${item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>

            <h4 class="font-bold text-slate-900 text-sm mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
              ${item.judul_program}
            </h4>

            <p class="text-xs text-slate-500 mb-3 flex items-center gap-2">
              <span><i class="fa-solid fa-school mr-1 text-slate-400"></i>${item.nama_sekolah}</span>
              <span>•</span>
              <span>${item.tahun_ajaran}</span>
            </p>

            <div class="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <button type="button" class="btn-load-item text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 py-1 px-2.5 rounded hover:bg-indigo-50 transition-colors" data-id="${item.id}">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Canvas
              </button>
              
              <div class="flex items-center gap-1">
                <button type="button" class="btn-delete-item text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors" title="Hapus" data-id="${item.id}">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  document.body.appendChild(drawer);

  // Bind actions
  drawer.querySelectorAll('.btn-load-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      showLoading('Memuat dokumen program...');
      try {
        const res = await api(`/program-sekolah/${id}`);
        if (res && res.data && res.data.content) {
          drawer.remove();
          if (typeof onSelectProgram === 'function') {
            onSelectProgram(res.data.content);
          }
          showToast('Dokumen berhasil dimuat ke Canvas!', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Gagal memuat detail program', 'error');
      } finally {
        hideLoading();
      }
    });
  });

  drawer.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Apakah Anda yakin ingin menghapus dokumen arsip ini?')) return;

      showLoading('Menghapus dokumen...');
      try {
        await api(`/program-sekolah/${id}`, { method: 'DELETE' });
        showToast('Dokumen berhasil dihapus', 'success');
        btn.closest('.rounded-xl')?.remove();
      } catch (err) {
        showToast(err.message || 'Gagal menghapus dokumen', 'error');
      } finally {
        hideLoading();
      }
    });
  });
}

/**
 * Unduh Khusus Lembar Refleksi Diri Murid & Rubrik Asesmen Autentik (DOCX Siap Cetak/Fotokopi)
 */
export async function downloadProgramLampiranOnlyDocx(programData) {
  if (!programData || !programData.metadata) {
    showToast('Data dokumen program sekolah tidak ditemukan', 'error');
    return;
  }

  showLoading('Menyiapkan Lembar Refleksi & Rubrik (DOCX)...');

  try {
    const res = await fetch('/api/program-sekolah/docx-lampiran', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(programData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mengekspor instrumen lampiran DOCX');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = 'Lembar_Refleksi_dan_Rubrik.docx';
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    } else {
      const safeTitle = (programData.metadata.judul_program || 'Program_Sekolah')
        .replace(/[\\/?%*:|"<>]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 35);
      filename = `${safeTitle}_Refleksi_dan_Rubrik.docx`;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showToast('Instrumen Lembar Refleksi & Rubrik (DOCX) berhasil diunduh!', 'success');
  } catch (err) {
    console.error('Download Lampiran DOCX Error:', err);
    showToast(err.message || 'Terjadi kesalahan saat mengunduh instrumen lampiran', 'error');
  } finally {
    hideLoading();
  }
}

