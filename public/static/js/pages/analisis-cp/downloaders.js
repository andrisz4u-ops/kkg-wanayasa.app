// Modul ekspor berkas Word (.docx), batch download, dan penyimpanan arsip database
// public/static/js/pages/analisis-cp/downloaders.js

import { showToast } from '../../utils.js';
import { api } from '../../api.js';
import { state } from '../../state.js';
import { openArchiveDrawer } from '../../storage-archive.js';
import { syncCanvasToAnalysisData } from './renderers.js';
import { replacePesertaDidik } from './validator.js';

let isBatchDownloading = false;

/**
 * Unduh Dokumen Word (.docx) sesuai tab aktif dengan auto-retry otomatis jika server sibuk (503)
 * @param {string} type - 'analisis' | 'prota' | 'promes' | 'rpe' | 'kktp' | 'data-cp' | 'atp-elemen'
 * @param {object} currentAnalysisData 
 * @param {object} currentInputData 
 * @param {string|number} activePromesSemester 
 * @param {boolean} isBatch
 */
export async function downloadDocx(type = 'analisis', currentAnalysisData, currentInputData, activePromesSemester = 'all', isBatch = false) {
  if (!currentAnalysisData) {
    showToast('Belum ada dokumen analisis yang dirakit', 'warning');
    return false;
  }

  // Sinkronkan editan teks pengguna di kanvas terlebih dahulu
  syncCanvasToAnalysisData(currentAnalysisData);
  replacePesertaDidik(currentAnalysisData);

  const docTypeName = type === 'data-cp' ? 'Capaian Pembelajaran (CP)'
                    : type === 'prota' ? 'Program Tahunan (PROTA)'
                    : type === 'promes' ? 'Program Semester (PROMES)'
                    : type === 'rpe' ? 'Rincian Pekan Efektif (RPE)'
                    : type === 'kktp' ? 'Kriteria Ketercapaian (KKTP)'
                    : type === 'atp-elemen' ? 'Alur Tujuan Pembelajaran (ATP Elemen)'
                    : 'Analisis CP, TP, dan ATP';

  if (!isBatch) {
    showToast(`Menyiapkan berkas Word ${docTypeName}...`, 'info');
  }

  const origin = window.location.origin;
  const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;

  const endpoint = type === 'data-cp' ? '/api/analisis-cp/docx/data-cp'
                 : type === 'prota' ? '/api/analisis-cp/docx/prota'
                 : type === 'promes' ? '/api/analisis-cp/docx/promes'
                 : type === 'rpe' ? '/api/analisis-cp/docx/rpe'
                 : type === 'kktp' ? '/api/analisis-cp/docx/kktp'
                 : type === 'atp-elemen' ? '/api/analisis-cp/docx/atp-elemen'
                 : '/api/analisis-cp/docx';

  const payload = {
    metadata: {
      ...currentAnalysisData.metadata,
      satuan_pendidikan: currentInputData?.namaSekolah || currentAnalysisData.metadata?.satuan_pendidikan,
      mata_pelajaran: currentInputData?.mataPelajaran || currentAnalysisData.metadata?.mata_pelajaran,
      kepala_sekolah: currentInputData?.namaKepalaSekolah,
      nip_kepala_sekolah: currentInputData?.nipKepalaSekolah,
      guru: currentInputData?.namaGuru,
      nip_guru: currentInputData?.nipGuru,
      kop_surat_url: kopSuratUrl,
      sumber_buku: currentInputData?.sumberBuku
    },
    semesters: currentAnalysisData.semesters,
    semester: activePromesSemester !== 'all' ? activePromesSemester : undefined
  };

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        showToast(`Server sedang padat, mencoba ulang ${docTypeName} (${attempt}/${maxRetries})...`, 'warning');
        await new Promise(r => setTimeout(r, attempt * 1200));
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if ((res.status === 503 || res.status === 504 || res.status === 429) && attempt < maxRetries) {
          lastError = new Error(`Server returned ${res.status}`);
          continue;
        }
        throw new Error(`Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const mapelSafe = (currentInputData?.mataPelajaran || 'Mapel').replace(/\s+/g, '_');
      const kelasSafe = (currentInputData?.jenjangKelas || 'Kelas_5').replace(/\s+/g, '_');
      const prefix = type === 'data-cp' ? 'Capaian_Pembelajaran'
                   : type === 'prota' ? 'PROTA'
                   : type === 'promes' ? 'PROMES'
                   : type === 'rpe' ? 'RPE'
                   : type === 'kktp' ? 'KKTP'
                   : type === 'atp-elemen' ? 'ATP_Elemen'
                   : 'Analisis_CP_TP_ATP';

      a.download = `${prefix}_${mapelSafe}_${kelasSafe}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (!isBatch) {
        showToast(`Berkas ${prefix} (.docx) berhasil diunduh!`, 'success');
      }
      return true;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && (String(err.message).includes('503') || String(err.message).includes('429') || String(err.message).includes('Failed to fetch'))) {
        continue;
      }
      break;
    }
  }

  console.error(`Download DOCX Error (${type}):`, lastError);
  showToast(`Gagal mengunduh berkas ${docTypeName}: ${lastError?.message || 'Koneksi terputus'}`, 'error');
  return false;
}

/**
 * Unduh Semua 7 Paket Dokumen Word Sekaligus secara berurutan dengan proteksi kuota server
 * @param {object} currentAnalysisData 
 * @param {object} currentInputData 
 * @param {string|number} activePromesSemester
 */
export async function downloadAllDocs(currentAnalysisData, currentInputData, activePromesSemester = 'all') {
  if (!currentAnalysisData) {
    showToast('Belum ada dokumen analisis yang dirakit', 'warning');
    return;
  }

  if (isBatchDownloading) {
    showToast('Proses pengunduhan sedang berjalan, mohon tunggu...', 'warning');
    return;
  }

  isBatchDownloading = true;
  const btnDownloadAll = document.getElementById('btn-download-all-docs');
  const btnDownloadSingle = document.getElementById('btn-download-docx');
  const origAllText = btnDownloadAll ? btnDownloadAll.innerHTML : null;

  if (btnDownloadAll) {
    btnDownloadAll.disabled = true;
    btnDownloadAll.classList.add('opacity-75', 'cursor-not-allowed');
  }
  if (btnDownloadSingle) {
    btnDownloadSingle.disabled = true;
  }

  const tabsConfig = [
    { type: 'data-cp', label: 'Capaian Pembelajaran (CP)' },
    { type: 'analisis', label: 'Analisis CP-TP-ATP' },
    { type: 'atp-elemen', label: 'ATP Elemen' },
    { type: 'prota', label: 'Program Tahunan (PROTA)' },
    { type: 'promes', label: 'Program Semester (PROMES)' },
    { type: 'rpe', label: 'Rincian Pekan Efektif (RPE)' },
    { type: 'kktp', label: 'Kriteria Ketercapaian (KKTP)' },
  ];

  let successCount = 0;
  const failedDocs = [];

  try {
    for (let i = 0; i < tabsConfig.length; i++) {
      const { type, label } = tabsConfig[i];
      if (btnDownloadAll) {
        btnDownloadAll.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> (${i + 1}/7) ${type.toUpperCase()}`;
      }
      showToast(`Mengunduh (${i + 1}/7): ${label}...`, 'info');

      const ok = await downloadDocx(type, currentAnalysisData, currentInputData, activePromesSemester, true);
      if (ok) {
        successCount++;
      } else {
        failedDocs.push(label);
      }

      // Jeda 1100ms agar CPU isolate Cloudflare mendingin dan tidak ter-throttle
      if (i < tabsConfig.length - 1) {
        await new Promise(r => setTimeout(r, 1100));
      }
    }

    if (successCount === tabsConfig.length) {
      showToast('Seluruh 7 paket dokumen Word berhasil diunduh lengkap!', 'success');
    } else {
      showToast(`${successCount} dari 7 dokumen berhasil diunduh. Dokumen yang tertunda (${failedDocs.join(', ')}) dapat diunduh langsung lewat tabnya.`, 'warning');
    }
  } finally {
    isBatchDownloading = false;
    if (btnDownloadAll) {
      btnDownloadAll.disabled = false;
      btnDownloadAll.classList.remove('opacity-75', 'cursor-not-allowed');
      if (origAllText) btnDownloadAll.innerHTML = origAllText;
    }
    if (btnDownloadSingle) {
      btnDownloadSingle.disabled = false;
    }
  }
}

import { loadCpKolaboratifCountBadge } from './kolaboratif.js';

/**
 * Simpan Data Analisis CP ke Database D1 & CP Kolaboratif
 * @param {object} currentAnalysisData 
 * @param {object} currentInputData 
 */
export async function saveToDatabase(currentAnalysisData, currentInputData) {
  if (!currentAnalysisData || !currentInputData) {
    showToast('Tidak ada data analisis untuk disimpan', 'warning');
    return;
  }

  syncCanvasToAnalysisData(currentAnalysisData);
  replacePesertaDidik(currentAnalysisData);

  showToast('Menyimpan ke CP Kolaboratif...', 'info');

  try {
    const res = await api('/analisis-cp/save', {
      method: 'POST',
      body: {
        namaSekolah: currentInputData.namaSekolah,
        mataPelajaran: currentInputData.mataPelajaran,
        jenjangKelas: currentInputData.jenjangKelas,
        fase: currentInputData.fase || 'C',
        tahunAjaran: currentInputData.tahunAjaran,
        sumberBuku: currentInputData.sumberBuku,
        contentJson: currentAnalysisData,
        isPublic: 1
      }
    });

    if (res && res.success) {
      showToast('Analisis CP berhasil disimpan ke CP Kolaboratif!', 'success');
      loadCpKolaboratifCountBadge();
    } else {
      throw new Error(res?.error || 'Gagal menyimpan');
    }
  } catch (err) {
    console.error('Save DB Error:', err);
    showToast('Gagal menyimpan: ' + err.message, 'error');
  }
}

/**
 * Buka Drawer Arsip Riwayat Analisis CP
 * @param {Function} onSelect - Callback saat item arsip dipilih
 * @param {Function} onDownload - Callback saat tombol unduh di arsip diklik
 */
export function openAnalisisArchiveDrawer(onSelect, onDownload) {
  openArchiveDrawer({
    module: 'analisis-cp',
    moduleName: 'Analisis CP, TP & ATP',
    onSelect: (item) => {
      if (typeof onSelect === 'function') {
        onSelect(item);
      }
    },
    onDownloadDocx: async (item) => {
      if (typeof onDownload === 'function') {
        await onDownload(item);
      }
    }
  });
}
