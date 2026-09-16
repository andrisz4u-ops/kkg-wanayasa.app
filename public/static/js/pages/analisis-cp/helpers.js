// Helper functions untuk modul Analisis CP
// public/static/js/pages/analisis-cp/helpers.js

import { escapeHtml, showToast } from '../../utils.js';
import { api } from '../../api.js';
import { state } from '../../state.js';

// In-memory cache client-side untuk standard curriculum presets
const presetCache = new Map();

/**
 * Mengambil daftar bab kurikulum standar resmi dari API backend dengan in-memory cache
 * @param {string} mataPelajaran 
 * @param {string} jenjangKelas 
 * @returns {Promise<{buku_judul: string, total_babs: number, chapters: Array}>}
 */
export async function fetchStandardChapters(mataPelajaran, jenjangKelas) {
  const normMapel = (mataPelajaran || 'IPAS').trim();
  const normKelas = (jenjangKelas || 'Kelas 5').trim();
  const cacheKey = `${normMapel.toLowerCase()}_${normKelas.toLowerCase()}`;

  if (presetCache.has(cacheKey)) {
    return presetCache.get(cacheKey);
  }

  try {
    const res = await api(`/analisis-cp/standard-chapters?mataPelajaran=${encodeURIComponent(normMapel)}&jenjangKelas=${encodeURIComponent(normKelas)}`);
    if (res && res.success && res.data) {
      presetCache.set(cacheKey, res.data);
      return res.data;
    }
  } catch (err) {
    console.warn(`[Analisis CP] Gagal memuat preset resmi untuk ${normMapel} ${normKelas}:`, err.message);
  }

  // Fallback standar 4 bab jika koneksi terputus atau mapel belum ada di DB resmi
  const defaultFallback = {
    buku_judul: `Buku Siswa ${normMapel} (${normKelas})`,
    total_babs: 4,
    chapters: [
      { no: 1, bab: 'Bab 1: Eksplorasi Materi Awal', materi_pokok: ['Konsep Dasar', 'Eksplorasi Lingkungan'], semester: 1 },
      { no: 2, bab: 'Bab 2: Interaksi & Penerapan Konsep', materi_pokok: ['Aplikasi Nyata', 'Latihan Terbimbing'], semester: 1 },
      { no: 3, bab: 'Bab 3: Pendalaman Kompetensi', materi_pokok: ['Analisis Masalah', 'Karya Sederhana'], semester: 2 },
      { no: 4, bab: 'Bab 4: Evaluasi & Kolaborasi', materi_pokok: ['Proyek Kolaboratif', 'Refleksi Pembelajaran'], semester: 2 }
    ]
  };

  return defaultFallback;
}

/**
 * Memuat pustaka PDF.js secara on-demand jika belum ada di window
 */
export async function loadPdfJsScript() {
  if (typeof window.pdfjsLib !== 'undefined') return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      } else {
        reject(new Error('PDF.js gagal diinisialisasi'));
      }
    };
    script.onerror = () => reject(new Error('Gagal memuat pustaka PDF reader dari CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Parser heuristik berbasis pola teks Daftar Isi Indonesia
 * @param {string} rawText 
 * @returns {Array}
 */
export function parseChaptersHeuristically(rawText) {
  if (!rawText) return [];
  
  const chapters = [];
  const babSplitPattern = /(?=(?:^|\n)\s*(?:BAB|UNIT|TEMA|BAGIAN|PELAJARAN)\s+[0-9ivx]+[\s.:\-–—])/im;
  const rawSections = rawText.split(babSplitPattern);

  for (const sec of rawSections) {
    const lines = sec.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    const babHeaderMatch = firstLine.match(/^(?:BAB|UNIT|TEMA|BAGIAN|PELAJARAN)\s+([0-9ivx]+)[\s.:\-–—]*(.*)$/i);
    
    if (babHeaderMatch) {
      const babNumRaw = babHeaderMatch[1];
      let babTitleRest = babHeaderMatch[2]?.trim() || '';

      if (!babTitleRest && lines.length > 1 && !/^[A-Z0-9]\./i.test(lines[1])) {
        babTitleRest = lines[1].replace(/\s*\.{3,}\s*\d+$/, '').trim();
      }

      const cleanBabTitle = `Bab ${babNumRaw}: ${babTitleRest || 'Materi Pembelajaran'}`.replace(/\s+/g, ' ');
      const subMaterials = [];

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j];
        if (/(?:halaman|hal\.|daftar isi|isi buku|semester|kementerian|kurikulum)/i.test(line)) continue;

        const subMatch = line.match(/^(?:[A-Z0-9]\.|\d+[\s.)]|\*|-|•)\s*(.+)$/i);
        if (subMatch) {
          const cleanSub = subMatch[1].replace(/\s*\.{3,}\s*\d+$/, '').replace(/\s+\d+\s*$/, '').trim();
          if (cleanSub.length >= 3 && cleanSub.length <= 80 && !subMaterials.includes(cleanSub)) {
            subMaterials.push(cleanSub);
          }
        }
      }

      if (subMaterials.length === 0) {
        subMaterials.push(babTitleRest || `Konsep & Praktik Bab ${babNumRaw}`);
      }

      chapters.push({
        no: chapters.length + 1,
        bab: cleanBabTitle,
        materi_pokok: subMaterials.slice(0, 5),
        semester: 1
      });
    }
  }

  return chapters;
}

/**
 * Kop Surat Dokumen Resmi
 * @returns {string}
 */
export function getKopSuratHtml() {
  const origin = window.location.origin;
  const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;
  return `
    <div class="text-center mb-6">
      <img src="${kopSuratUrl}" style="width:100%; max-height:140px; object-fit:contain;" alt="Kop Surat" crossorigin="anonymous" onerror="this.style.display='none'">
      <div class="h-0.5 bg-slate-900 mt-2 mb-1"></div>
      <div class="h-px bg-slate-900 mb-4"></div>
    </div>
  `;
}

/**
 * Helper untuk menentukan titimangsa Purwakarta berdasarkan tahun ajaran dan semester
 * Prota & Sem 1: Purwakarta, 13 Juli [startYear]
 * Sem 2: Purwakarta, 11 Januari [endYear]
 * @param {string} tahunStr 
 * @param {number|string} semester 
 * @returns {string}
 */
export function getKaldikTitimangsa(tahunStr, semester = 1) {
  let startYear = '2026';
  let endYear = '2027';
  if (tahunStr) {
    const match = String(tahunStr).match(/(\d{4})\s*[\/-]\s*(\d{4})/);
    if (match) {
      startYear = match[1];
      endYear = match[2];
    } else {
      const singleMatch = String(tahunStr).match(/(\d{4})/);
      if (singleMatch) {
        startYear = singleMatch[1];
        endYear = String(parseInt(startYear, 10) + 1);
      }
    }
  }
  const isSem2 = semester === 2 || String(semester).includes('2');
  return isSem2 
    ? `Purwakarta, 11 Januari ${endYear}`
    : `Purwakarta, 13 Juli ${startYear}`;
}

/**
 * Lembar Pengesahan Tanda Tangan Dokumen
 * @param {object} inputData 
 * @param {string} titimangsa
 * @returns {string}
 */
export function getPengesahanHtml(inputData, titimangsa = '') {
  const ksName = inputData?.namaKepalaSekolah || '...........................................';
  const ksNip = inputData?.nipKepalaSekolah ? `NIP. ${inputData.nipKepalaSekolah}` : 'NIP. .....................................';
  const guruName = inputData?.namaGuru || '...........................................';
  const guruNip = inputData?.nipGuru ? `NIP. ${inputData.nipGuru}` : 'NIP. .....................................';
  const defaultTitimangsa = getKaldikTitimangsa(inputData?.tahunAjaran || inputData?.tahun_pembelajaran, 1);
  const titimangsaDisplay = titimangsa || defaultTitimangsa;

  return `
    <div class="grid grid-cols-2 text-center text-xs font-serif pt-6 break-inside-avoid">
      <div>
        <p class="mb-1">Mengetahui,</p>
        <p class="font-bold mb-16">Kepala Sekolah</p>
        <p class="font-bold underline text-sm mb-0.5">${escapeHtml(ksName)}</p>
        <p>${escapeHtml(ksNip)}</p>
      </div>
      <div>
        <p class="mb-1">${escapeHtml(titimangsaDisplay)}</p>
        <p class="font-bold mb-16">Guru Mata Pelajaran / Kelas</p>
        <p class="font-bold underline text-sm mb-0.5">${escapeHtml(guruName)}</p>
        <p>${escapeHtml(guruNip)}</p>
      </div>
    </div>
  `;
}

/**
 * Mengambil teks JP dari item
 * @param {object} item 
 * @returns {string}
 */
export function getItemJpText(item) {
  if (item && item.alokasi_waktu) return item.alokasi_waktu;
  return '2 JP';
}

/**
 * Mengurai angka dari string alokasi waktu JP
 * @param {string} jpStr 
 * @returns {number}
 */
export function parseJpNum(jpStr) {
  const m = String(jpStr || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 2;
}
