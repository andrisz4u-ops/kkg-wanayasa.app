// Modul ekspor berkas Word (.docx), batch download, dan penyimpanan arsip database
// public/static/js/pages/analisis-cp/downloaders.js

import { showToast } from '../../utils.js';
import { api } from '../../api.js';
import { state } from '../../state.js';
import { openArchiveDrawer } from '../../storage-archive.js';
import { syncCanvasToAnalysisData } from './renderers.js';

/**
 * Unduh Dokumen Word (.docx) sesuai tab aktif
 * @param {string} type - 'analisis' | 'prota' | 'promes' | 'kktp'
 * @param {object} currentAnalysisData 
 * @param {object} currentInputData 
 * @param {string|number} activePromesSemester 
 */
export async function downloadDocx(type = 'analisis', currentAnalysisData, currentInputData, activePromesSemester = 'all') {
  if (!currentAnalysisData) {
    showToast('Belum ada dokumen analisis yang dirakit', 'warning');
    return;
  }

  // Sinkronkan editan teks pengguna di kanvas terlebih dahulu
  syncCanvasToAnalysisData(currentAnalysisData);

  const docTypeName = type === 'prota' ? 'Program Tahunan (PROTA)'
                    : type === 'promes' ? 'Program Semester (PROMES)'
                    : type === 'kktp' ? 'Kriteria Ketercapaian (KKTP)'
                    : 'Analisis CP, TP, dan ATP';

  showToast(`Menyiapkan berkas Word ${docTypeName}...`, 'info');

  try {
    const origin = window.location.origin;
    const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;

    const endpoint = type === 'prota' ? '/api/analisis-cp/docx/prota'
                   : type === 'promes' ? '/api/analisis-cp/docx/promes'
                   : type === 'kktp' ? '/api/analisis-cp/docx/kktp'
                   : '/api/analisis-cp/docx';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const mapelSafe = (currentInputData?.mataPelajaran || 'Mapel').replace(/\s+/g, '_');
    const kelasSafe = (currentInputData?.jenjangKelas || 'Kelas_5').replace(/\s+/g, '_');
    const prefix = type === 'prota' ? 'PROTA'
                 : type === 'promes' ? 'PROMES'
                 : type === 'kktp' ? 'KKTP'
                 : 'Analisis_CP_TP_ATP';

    a.download = `${prefix}_${mapelSafe}_${kelasSafe}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Berkas ${prefix} (.docx) berhasil diunduh!`, 'success');
  } catch (err) {
    console.error('Download DOCX Error:', err);
    showToast('Gagal mengunduh berkas Word: ' + err.message, 'error');
  }
}

/**
 * Unduh Semua 4 Paket Dokumen Word Sekaligus secara berurutan
 * @param {object} currentAnalysisData 
 * @param {object} currentInputData 
 */
export async function downloadAllDocs(currentAnalysisData, currentInputData) {
  if (!currentAnalysisData) {
    showToast('Belum ada dokumen analisis yang dirakit', 'warning');
    return;
  }

  showToast('Memulai pengunduhan 4 paket dokumen Word (Analisis CP, Prota, Promes, KKTP)...', 'info');
  const tabs = ['analisis', 'prota', 'promes', 'kktp'];

  for (let i = 0; i < tabs.length; i++) {
    await downloadDocx(tabs[i], currentAnalysisData, currentInputData);
    if (i < tabs.length - 1) {
      await new Promise(r => setTimeout(r, 450));
    }
  }

  showToast('Seluruh 4 paket dokumen berhasil diunduh!', 'success');
}

/**
 * Simpan Data Analisis CP ke Database D1
 * @param {object} currentAnalysisData 
 * @param {object} currentInputData 
 */
export async function saveToDatabase(currentAnalysisData, currentInputData) {
  if (!currentAnalysisData || !currentInputData) {
    showToast('Tidak ada data analisis untuk disimpan', 'warning');
    return;
  }

  syncCanvasToAnalysisData(currentAnalysisData);

  showToast('Menyimpan ke database...', 'info');

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
        contentJson: currentAnalysisData
      }
    });

    if (res && res.success) {
      showToast('Analisis CP berhasil disimpan ke arsip sekolah!', 'success');
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
