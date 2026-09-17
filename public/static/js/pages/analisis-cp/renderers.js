import { escapeHtml, showToast } from '../../utils.js';
import { getKopSuratHtml, getPengesahanHtml, getItemJpText, parseJpNum, getKaldikTitimangsa } from './helpers.js';
import { getAlokasiWaktuResmi, balanceSemesterJpItems } from './alokasi-waktu.js';
import { calculateRpe, KALDIK_PURWAKARTA_2026_2027 } from './kaldik-purwakarta.js';

/**
 * Format teks Capaian Pembelajaran dengan badge/penanda Elemen yang jelas
 */
export function formatCpContentHtml(cpText, babTitle = '') {
  if (!cpText) {
    const titleMatch = (babTitle || '').match(/\[(.*?)\]/);
    if (titleMatch) {
      return `<div class="font-bold text-indigo-950 dark:text-indigo-200 mb-1 text-[10.5px] uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded w-fit">[Elemen: ${escapeHtml(titleMatch[1])}]</div><div>-</div>`;
    }
    return '-';
  }

  // Check if cpText starts with [Elemen] or [Elemen: ...]
  const bracketMatch = cpText.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (bracketMatch) {
    const elName = bracketMatch[1].replace(/^Elemen\s*:\s*/i, '').trim();
    const rest = bracketMatch[2].trim();
    return `<div class="font-bold text-indigo-950 dark:text-indigo-200 mb-1 text-[10.5px] uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded w-fit">[Elemen: ${escapeHtml(elName)}]</div><div class="leading-relaxed">${escapeHtml(rest).replace(/\n/g, '<br>')}</div>`;
  }

  // Check if cpText starts with "Elemen: ..." or "Pemahaman IPAS: ..."
  const colonMatch = cpText.match(/^(Elemen\s*[^:\n]+|[^:\n]{3,35}):\s*(.*)$/is);
  if (colonMatch && !colonMatch[1].includes('http') && !colonMatch[1].toLowerCase().includes('contoh')) {
    const elName = colonMatch[1].replace(/^Elemen\s*:\s*/i, '').trim();
    const rest = colonMatch[2].trim();
    return `<div class="font-bold text-indigo-950 dark:text-indigo-200 mb-1 text-[10.5px] uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded w-fit">[Elemen: ${escapeHtml(elName)}]</div><div class="leading-relaxed">${escapeHtml(rest).replace(/\n/g, '<br>')}</div>`;
  }

  // If babTitle has [Elemen] and cpText doesn't have an element yet:
  const titleMatch = (babTitle || '').match(/\[(.*?)\]/);
  if (titleMatch) {
    return `<div class="font-bold text-indigo-950 dark:text-indigo-200 mb-1 text-[10.5px] uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded w-fit">[Elemen: ${escapeHtml(titleMatch[1])}]</div><div class="leading-relaxed">${escapeHtml(cpText).replace(/\n/g, '<br>')}</div>`;
  }

  return escapeHtml(cpText).replace(/\n/g, '<br>');
}

/**
 * 1. RENDER TABEL UTAMA: ANALISIS CP, TP, DAN ATP (7 KOLOM)
 */
export function renderAnalisisTable(data, inputData = {}) {
  const metadata = data.metadata || {};
  const semesters = data.semesters || [];
  const faseKelas = metadata.fase_kelas || `${metadata.fase || 'C'}/${metadata.kelas || '5'}`;

  let html = `
    ${getKopSuratHtml()}

    <div class="text-center mb-6">
      <h2 class="text-xl font-black uppercase tracking-wide text-slate-950 font-serif">ANALISIS CP, TP, DAN ATP</h2>
      <p class="text-xs text-slate-600 font-serif uppercase tracking-widest mt-0.5">STANDAR DOKUMEN MUTU PENDIDIKAN KURIKULUM MERDEKA</p>
    </div>

    <div class="mb-6 max-w-xl">
      <table class="w-full text-xs font-bold font-serif text-slate-900 border-collapse">
        <tr>
          <td class="py-1 w-44">SATUAN PENDIDIKAN</td>
          <td class="py-1">: ${escapeHtml(metadata.satuan_pendidikan || inputData.namaSekolah || '-')}</td>
        </tr>
        <tr>
          <td class="py-1">MATA PELAJARAN</td>
          <td class="py-1">: ${escapeHtml(metadata.mata_pelajaran || inputData.mataPelajaran || '-')}</td>
        </tr>
        <tr>
          <td class="py-1">FASE / KELAS</td>
          <td class="py-1">: ${escapeHtml(faseKelas)}</td>
        </tr>
        <tr>
          <td class="py-1">TAHUN PEMBELAJARAN</td>
          <td class="py-1">: ${escapeHtml(metadata.tahun_pembelajaran || inputData.tahunAjaran || '-')}</td>
        </tr>
      </table>
    </div>

    <div class="overflow-x-auto mb-8">
      <table id="table-analisis-content" class="w-full text-[11.5px] border-collapse border border-slate-900 font-serif leading-relaxed text-slate-900">
        <thead>
          <tr class="bg-[#D9D2E9] text-center font-bold">
            <th class="border border-slate-900 p-2 w-[4%]">No</th>
            <th class="border border-slate-900 p-2 w-[15%]">BAB</th>
            <th class="border border-slate-900 p-2 w-[22%]">Elemen / Capaian Pembelajaran</th>
            <th class="border border-slate-900 p-2 w-[17%]">Materi Pokok</th>
            <th class="border border-slate-900 p-2 w-[7%]">Kode TP</th>
            <th class="border border-slate-900 p-2 w-[17%]">TP (Tujuan Pembelajaran)</th>
            <th class="border border-slate-900 p-2 w-[18%]">ATP (Alur Tujuan Pembelajaran)</th>
          </tr>
        </thead>
        <tbody>
  `;

  semesters.forEach((sem, semIdx) => {
    html += `
      <tr class="bg-[#EAE6F3] font-bold text-center">
        <td colspan="7" class="border border-slate-900 py-1.5 px-3 uppercase tracking-wider text-xs font-serif">
          ${escapeHtml(sem.semester_label || `SEMESTER ${sem.semester}`)}
        </td>
      </tr>
    `;

    (sem.babs || []).forEach((bab, babIdx) => {
      const items = bab.items && bab.items.length > 0 ? bab.items : [{
        kode_tp: `${metadata.kelas || '5'}.${bab.no}`,
        materi_pokok: (bab.materi_list || []).join('<br>') || bab.bab,
        tp: 'Menyelesaikan capaian materi pada bab ini.',
        atp: 'Murid melakukan serangkaian aktivitas terpadu untuk mencapai tujuan pembelajaran.',
        alokasi_waktu: '2 JP'
      }];

      const rowSpan = items.length;

      items.forEach((item, itemIdx) => {
        const isFirst = itemIdx === 0;
        html += `<tr class="hover:bg-slate-50/50">`;

        if (isFirst) {
          html += `
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2 text-center align-top font-bold" contenteditable="true" data-field="no" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}">
              ${escapeHtml(String(bab.no))}
            </td>
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2.5 align-top font-bold" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}">
              <div contenteditable="true" data-field="bab" class="outline-none">${escapeHtml(bab.bab)}</div>
              <div class="mt-2 flex flex-col gap-1.5 print:hidden">
                <button type="button" onclick="window.bridgeToRpp('${escapeHtml(bab.bab).replace(/'/g, "\\'")}', '${escapeHtml(bab.cp).replace(/'/g, "\\'")}', ${sem.semester})" class="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-300 text-[9.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs" title="Lanjut buat RPP untuk Bab ini">
                  <i class="fas fa-magic text-teal-600"></i> Buat RPP Bab Ini
                </button>
                <button type="button" onclick="window.bridgeToKisi('${escapeHtml(bab.bab).replace(/'/g, "\\'")}', '${escapeHtml(bab.cp).replace(/'/g, "\\'")}', ${sem.semester})" class="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 text-[9.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs" title="Lanjut buat Kisi-Kisi & Soal untuk Bab ini">
                  <i class="fas fa-file-signature text-indigo-600"></i> Buat Soal Bab Ini
                </button>
              </div>
            </td>
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2.5 align-top text-justify" contenteditable="true" data-field="cp" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}">
              ${formatCpContentHtml(bab.cp, bab.bab)}
            </td>
          `;
        }

        const itemMateri = item.materi_pokok || (bab.materi_list && bab.materi_list[itemIdx]) || '-';

        html += `
          <td class="border border-slate-900 p-2.5 align-top" contenteditable="true" data-field="materi_pokok" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(itemMateri).replace(/\n/g, '<br>')}
          </td>
          <td class="border border-slate-900 p-2 text-center align-top font-bold" contenteditable="true" data-field="kode_tp" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(item.kode_tp)}
          </td>
          <td class="border border-slate-900 p-2.5 align-top text-justify" contenteditable="true" data-field="tp" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(item.tp)}
          </td>
          <td class="border border-slate-900 p-2.5 align-top text-justify">
            <div contenteditable="true" data-field="atp" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}" class="outline-none">${escapeHtml(item.atp)}</div>
            <div class="mt-2 flex items-center justify-end gap-1.5 print:hidden">
              <button type="button" onclick="window.addTpItemToBab(${semIdx}, ${babIdx}, ${itemIdx})" class="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs" title="Tambah baris TP baru pada bab ini">
                <i class="fas fa-plus text-[8px]"></i> TP
              </button>
              ${items.length > 1 ? `
              <button type="button" onclick="window.removeTpItemFromBab(${semIdx}, ${babIdx}, ${itemIdx})" class="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs" title="Hapus baris TP ini">
                <i class="fas fa-trash-alt text-[8px]"></i>
              </button>
              ` : ''}
            </div>
          </td>
        </tr>`;
      });
    });
  });

  const tahunAjaran = metadata.tahun_pembelajaran || inputData?.tahunAjaran || '2026/2027';
  const titimangsa = getKaldikTitimangsa(tahunAjaran, 1);

  html += `
        </tbody>
      </table>
    </div>
    ${getPengesahanHtml(inputData, titimangsa)}
  `;

  return html;
}

/**
 * 2. RENDER TABEL PROGRAM TAHUNAN (PROTA)
 */
export function renderProtaTable(data, inputData = {}) {
  const metadata = data.metadata || {};
  const semesters = data.semesters || [];
  const faseKelas = metadata.fase_kelas || `Fase ${metadata.fase || 'C'}, Kelas ${metadata.kelas || '5'}`;

  let totalTahunJp = 0;
  const semJpTotals = {};

  semesters.forEach(sem => {
    let semSum = 0;
    (sem.babs || []).forEach(bab => {
      (bab.items || []).forEach(item => {
        const jp = parseJpNum(getItemJpText(item));
        semSum += jp;
        totalTahunJp += jp;
      });
    });
    semJpTotals[sem.semester] = semSum;
  });

  let html = `
    ${getKopSuratHtml()}

    <div class="text-center mb-6">
      <h2 class="text-xl font-black uppercase tracking-wide text-slate-950 font-serif">PROGRAM TAHUNAN (PROTA)</h2>
      <p class="text-xs font-bold text-slate-700 font-serif uppercase tracking-widest mt-0.5">KURIKULUM MERDEKA</p>
    </div>

    <div class="mb-6 max-w-xl">
      <table class="w-full text-xs font-bold font-serif text-slate-900 border-collapse">
        <tr>
          <td class="py-1 w-44">Mata Pelajaran</td>
          <td class="py-1">: ${escapeHtml(metadata.mata_pelajaran || inputData.mataPelajaran || '-')}</td>
        </tr>
        <tr>
          <td class="py-1">Satuan Pendidikan</td>
          <td class="py-1">: ${escapeHtml(metadata.satuan_pendidikan || inputData.namaSekolah || '-')}</td>
        </tr>
        <tr>
          <td class="py-1">Nama Guru</td>
          <td class="py-1">: ${escapeHtml(metadata.guru || inputData.namaGuru || '-')}</td>
        </tr>
        <tr>
          <td class="py-1">Tahun Pelajaran</td>
          <td class="py-1">: ${escapeHtml(metadata.tahun_pembelajaran || inputData.tahunAjaran || '-')}</td>
        </tr>
        <tr>
          <td class="py-1">Fase / Kelas</td>
          <td class="py-1">: ${escapeHtml(faseKelas)} / I (Ganjil) & II (Genap)</td>
        </tr>
      </table>
    </div>

    <div class="overflow-x-auto mb-8">
      <table id="table-prota-content" class="w-full text-[11.5px] border-collapse border border-slate-900 font-serif leading-relaxed text-slate-900">
        <thead>
          <tr class="bg-[#D9D2E9] text-center font-bold">
            <th class="border border-slate-900 p-2 w-[5%]">No</th>
            <th class="border border-slate-900 p-2 w-[20%]">Bab</th>
            <th class="border border-slate-900 p-2 w-[45%]">Alur Tujuan Pembelajaran</th>
            <th class="border border-slate-900 p-2 w-[20%]">Materi</th>
            <th class="border border-slate-900 p-2 w-[10%]">Alokasi Waktu</th>
          </tr>
        </thead>
        <tbody>
  `;

  semesters.forEach((sem, semIdx) => {
    html += `
      <tr class="bg-[#EAE6F3] font-bold text-center">
        <td colspan="5" class="border border-slate-900 py-1.5 px-3 uppercase tracking-wider text-xs font-serif">
          ${escapeHtml(sem.semester_label || `SEMESTER ${sem.semester}`)}
        </td>
      </tr>
    `;

    (sem.babs || []).forEach((bab, babIdx) => {
      const items = bab.items && bab.items.length > 0 ? bab.items : [{
        kode_tp: `${metadata.kelas || '5'}.${bab.no}`,
        materi_pokok: (bab.materi_list || []).join('<br>') || bab.bab,
        tp: 'Menyelesaikan capaian materi.',
        atp: 'Murid melakukan serangkaian alur aktivitas pembelajaran.',
        alokasi_waktu: '2 JP'
      }];

      const rowSpan = items.length;

      items.forEach((item, itemIdx) => {
        const isFirst = itemIdx === 0;
        const itemMateri = item.materi_pokok || (bab.materi_list && bab.materi_list[itemIdx]) || '-';
        const jpVal = getItemJpText(item);

        html += `<tr class="hover:bg-slate-50/50">`;

        if (isFirst) {
          html += `
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2 text-center align-top font-bold" contenteditable="true" data-field="no" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}">
              ${escapeHtml(String(bab.no))}
            </td>
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2.5 align-top font-bold" contenteditable="true" data-field="bab" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}">
              ${escapeHtml(bab.bab)}
            </td>
          `;
        }

        html += `
          <td class="border border-slate-900 p-2.5 align-top text-justify" contenteditable="true" data-field="atp" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(item.atp)}
          </td>
          <td class="border border-slate-900 p-2.5 align-top" contenteditable="true" data-field="materi_pokok" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(itemMateri).replace(/\n/g, '<br>')}
          </td>
          <td class="border border-slate-900 p-2 text-center align-top font-bold" contenteditable="true" data-field="alokasi_waktu" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(jpVal)}
          </td>
        </tr>`;
      });
    });

    const semSum = semJpTotals[sem.semester] || 0;
    html += `
      <tr class="bg-slate-100 font-bold">
        <td colspan="4" class="border border-slate-900 p-2 text-right uppercase text-xs">
          Total Alokasi Waktu ${escapeHtml(sem.semester_label || `Semester ${sem.semester}`)}:
        </td>
        <td class="border border-slate-900 p-2 text-center text-xs font-black bg-indigo-50/60">
          ${semSum} JP
        </td>
      </tr>
    `;
  });

  html += `
        <tr class="bg-indigo-100 font-black text-slate-950">
          <td colspan="4" class="border border-slate-900 p-2.5 text-right uppercase text-xs tracking-wide">
            TOTAL ALOKASI WAKTU (1 TAHUN):
          </td>
          <td class="border border-slate-900 p-2.5 text-center text-sm font-black text-indigo-900 bg-indigo-200">
            ${totalTahunJp} JP
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  ${(() => {
    const tahunAjaran = metadata.tahun_pembelajaran || inputData?.tahunAjaran || '2026/2027';
    const titimangsa = getKaldikTitimangsa(tahunAjaran, 1);
    return getPengesahanHtml(inputData, titimangsa);
  })()}
  `;

  return html;
}

/**
 * 3. RENDER TABEL PROGRAM SEMESTER (PROMES)
 */
export function renderPromesTable(data, inputData = {}, activePromesSemester = 'all') {
  const metadata = data.metadata || {};
  const allSemesters = data.semesters || [];
  const faseKelas = metadata.fase_kelas || `Fase ${metadata.fase || 'C'}, Kelas ${metadata.kelas || '5'}`;

  const activeSemesters = allSemesters.filter(s => {
    if (activePromesSemester === 'all') return true;
    return s.semester === activePromesSemester;
  });

  let html = `
    <!-- Filter Bar Semester Promes -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200 print:hidden font-sans">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-bold text-slate-700">Tampilkan Semester:</span>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="all">Semua Semester</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="1">Semester 1 (Ganjil)</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="2">Semester 2 (Genap)</button>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[10.5px] border border-amber-300 flex items-center gap-1.5 shadow-xs" title="Format cetak otomatis diset ke A4 Landscape untuk efisiensi kertas dan kerapian matriks minggu">
          <i class="fas fa-file-lines fa-rotate-90 text-amber-700"></i> Kertas: A4 Landscape (Cetak Otomatis)
        </span>
        <span class="text-[11px] text-slate-400 font-medium">Matriks 6 Bulan x 5 Minggu (30 Kolom Efektif)</span>
      </div>
    </div>
  `;

  activeSemesters.forEach((sem, currentSemIdx) => {
    const isSem1 = sem.semester === 1;
    const months = isSem1
      ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

    const firstCp = sem.babs?.[0]?.cp || 'Memahami konsep dasar dan menerapkan kompetensi esensial pembelajaran sesuai standar kurikulum merdeka.';

    html += `
      <div class="promes-semester-block mb-12 ${currentSemIdx > 0 ? 'mt-12 pt-8 border-t-2 border-dashed border-slate-300' : ''}">
        ${getKopSuratHtml()}

        <div class="text-center mb-6">
          <h2 class="text-xl font-black uppercase tracking-wide text-slate-950 font-serif">PROGRAM SEMESTER (PROMES) DEEP LEARNING</h2>
          <p class="text-xs font-bold text-slate-700 font-serif uppercase tracking-widest mt-0.5">
            KURIKULUM MERDEKA - SEMESTER ${sem.semester} (${isSem1 ? 'GANJIL' : 'GENAP'})
          </p>
        </div>

        <div class="mb-5 max-w-xl">
          <table class="w-full text-xs font-bold font-serif text-slate-900 border-collapse">
            <tr>
              <td class="py-1 w-44">Mata Pelajaran</td>
              <td class="py-1">: ${escapeHtml(metadata.mata_pelajaran || inputData.mataPelajaran || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Satuan Pendidikan</td>
              <td class="py-1">: ${escapeHtml(metadata.satuan_pendidikan || inputData.namaSekolah || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Nama Guru</td>
              <td class="py-1">: ${escapeHtml(metadata.guru || inputData.namaGuru || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Tahun Pelajaran</td>
              <td class="py-1">: ${escapeHtml(metadata.tahun_pembelajaran || inputData.tahunAjaran || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Fase / Kelas / Semester</td>
              <td class="py-1">: ${escapeHtml(faseKelas)} / ${isSem1 ? 'I (Ganjil)' : 'II (Genap)'}</td>
            </tr>
          </table>
        </div>

        <!-- Bagian A: Capaian Pembelajaran Utuh -->
        <div class="mb-5 p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-serif leading-relaxed">
          <strong class="block mb-1 text-slate-900">A. Capaian Pembelajaran (CP) Resmi:</strong>
          <p class="text-slate-800 text-justify" contenteditable="true" data-field="cp" data-sem-idx="${sem.semester - 1}" data-bab-idx="0">
            ${escapeHtml(firstCp).replace(/\n/g, '<br>')}
          </p>
        </div>

        <!-- Bagian B: Matriks Distribusi Alokasi Waktu Pembelajaran (30 Minggu) -->
        <div class="mb-2 text-xs font-bold font-serif text-slate-900">
          B. Matriks Distribusi Alokasi Waktu Pembelajaran:
        </div>

        <div class="overflow-x-auto mb-6">
          <table class="w-full text-[10.5px] border-collapse border border-slate-900 font-serif text-slate-900">
            <thead>
              <tr class="bg-[#D9D2E9] text-center font-bold">
                <th rowspan="2" class="border border-slate-900 p-1.5 w-[3%]">No</th>
                <th rowspan="2" class="border border-slate-900 p-1.5 w-[15%]">Bab</th>
                <th rowspan="2" class="border border-slate-900 p-1.5 w-[32%]">Alur Tujuan Pembelajaran (ATP)</th>
                <th rowspan="2" class="border border-slate-900 p-1.5 w-[6%]">AW (JP)</th>
                ${months.map(m => `<th colspan="5" class="border border-slate-900 p-1 text-[11px]">${escapeHtml(m)}</th>`).join('')}
              </tr>
              <tr class="bg-[#EAE6F3] text-center font-bold text-[9.5px]">
                ${months.map(() => `
                  <th class="border border-slate-900 p-1 w-[1.8%]">1</th>
                  <th class="border border-slate-900 p-1 w-[1.8%]">2</th>
                  <th class="border border-slate-900 p-1 w-[1.8%]">3</th>
                  <th class="border border-slate-900 p-1 w-[1.8%]">4</th>
                  <th class="border border-slate-900 p-1 w-[1.8%]">5</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
    `;

    const semItems = [];
    (sem.babs || []).forEach((bab, babIdx) => {
      const items = bab.items && bab.items.length > 0 ? bab.items : [{
        atp: bab.bab,
        alokasi_waktu: '2 JP'
      }];
      items.forEach((item, itemIdx) => {
        semItems.push({
          babNo: bab.no,
          babTitle: bab.bab,
          item,
          babIdx,
          itemIdx,
          isFirstInBab: itemIdx === 0,
          babRowSpan: items.length
        });
      });
    });

    const quota = getAlokasiWaktuResmi(metadata.mata_pelajaran || inputData?.mataPelajaran || '', metadata.kelas || inputData?.jenjangKelas || '5');
    const jpPerMinggu = quota.jpPerMinggu || 2;

    const jenjangKelas = metadata.kelas || inputData?.jenjangKelas || '5';
    const isKelas6 = String(jenjangKelas).replace(/\D/g, '') === '6';
    const rpeData = calculateRpe(sem.semester, jpPerMinggu, jenjangKelas);
    const activeKbmWeeks = rpeData.activeKbmWeeks;

    // Distribusi Waterfall (Mengalir teratur sesuai jpPerMinggu tanpa tumpang tindih)
    const itemWeekAllocations = new Map();
    let kbmIdx = 0;
    let weekRemainingJp = jpPerMinggu;

    semItems.forEach((si, rowIdx) => {
      let neededJp = parseJpNum(getItemJpText(si.item)) || jpPerMinggu;

      while (neededJp > 0 && kbmIdx < activeKbmWeeks.length) {
        const currentWeek = activeKbmWeeks[kbmIdx];
        const canTake = Math.min(neededJp, weekRemainingJp);

        if (canTake > 0) {
          if (!itemWeekAllocations.has(rowIdx)) {
            itemWeekAllocations.set(rowIdx, {});
          }
          const rowAlloc = itemWeekAllocations.get(rowIdx);
          rowAlloc[currentWeek] = (rowAlloc[currentWeek] || 0) + canTake;

          neededJp -= canTake;
          weekRemainingJp -= canTake;
        }

        if (weekRemainingJp === 0) {
          kbmIdx++;
          weekRemainingJp = jpPerMinggu;
        }
      }
    });

    semItems.forEach((si, rowIdx) => {
      const rowAlloc = itemWeekAllocations.get(rowIdx) || {};

      html += `<tr class="hover:bg-slate-50/50">`;

      if (si.isFirstInBab) {
        html += `
          <td rowspan="${si.babRowSpan}" class="border border-slate-900 p-1 text-center align-top font-bold" contenteditable="true" data-field="no" data-sem-idx="${sem.semester - 1}" data-bab-idx="${si.babIdx}">
            ${escapeHtml(String(si.babNo))}
          </td>
          <td rowspan="${si.babRowSpan}" class="border border-slate-900 p-1.5 align-top font-bold" contenteditable="true" data-field="bab" data-sem-idx="${sem.semester - 1}" data-bab-idx="${si.babIdx}">
            ${escapeHtml(si.babTitle)}
          </td>
        `;
      }

      html += `
        <td class="border border-slate-900 p-1.5 align-top text-justify" contenteditable="true" data-field="atp" data-sem-idx="${sem.semester - 1}" data-bab-idx="${si.babIdx}" data-item-idx="${si.itemIdx}">
          ${escapeHtml(si.item.atp)}
        </td>
        <td class="border border-slate-900 p-1 text-center align-top font-bold" contenteditable="true" data-field="alokasi_waktu" data-sem-idx="${sem.semester - 1}" data-bab-idx="${si.babIdx}" data-item-idx="${si.itemIdx}">
          ${escapeHtml(getItemJpText(si.item))}
        </td>
      `;

      for (let w = 1; w <= 30; w++) {
        const allocJp = rowAlloc[w];
        const weekStatus = rpeData.weekStatusMap[w];
        const isNonKbm = weekStatus && !weekStatus.isKbm;

        if (allocJp) {
          html += `<td class="border border-slate-900 p-0.5 text-center font-black bg-indigo-100/70 text-indigo-950">${allocJp}</td>`;
        } else if (isNonKbm) {
          html += `<td class="border border-slate-900 p-0.5 text-center bg-slate-50/80 text-[7.5px] text-slate-400 select-none" title="${escapeHtml(weekStatus.label)}"></td>`;
        } else {
          html += `<td class="border border-slate-900 p-0.5 text-center"></td>`;
        }
      }

      html += `</tr>`;
    });

    if (isSem1) {
      html += `
        <tr class="bg-sky-50 font-bold text-sky-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Masa Pengenalan Lingkungan Sekolah (MPLS)</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 3) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-sky-200 text-sky-900">MPLS</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-amber-50 font-bold text-amber-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Sumatif Tengah Semester (STS)</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 15) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-amber-200 text-amber-900">STS</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-purple-50 font-bold text-purple-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Perkiraan Penilaian Sumatif Akhir Semester (SAS)</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 25 || w === 26 || w === 27) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-purple-200 text-purple-900">SAS</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-teal-50 font-bold text-teal-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Pengolahan Nilai & Remedial / Classmeeting</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 28) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-teal-200 text-teal-900">PENG</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-emerald-50 font-bold text-emerald-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Pembagian Rapor Semester 1</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 29) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-emerald-200 text-emerald-900">RPT</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-slate-200 font-bold text-slate-800">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Libur Akhir Tahun Ajaran Lalu / Libur Semester 1</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 1 || w === 2 || w === 30) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-slate-300 text-slate-900">LBR</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
      `;
    } else {
      html += `
        <tr class="bg-slate-100 font-bold text-slate-800">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Libur Semester 1 (1 - 8 Januari 2027)</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 1) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-slate-300 text-slate-900">LBR</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-slate-100 font-bold text-slate-800">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Prakiraan Libur Awal Ramadhan 1448 H</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 7) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-slate-300 text-slate-900">LBR</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-emerald-50 font-bold text-emerald-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Kegiatan Masantren di Sakola (Purwakarta Karakter)</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 8 || w === 9 || w === 11) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-emerald-200 text-emerald-900">SAN</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-slate-100 font-bold text-slate-800">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Prakiraan Libur Idul Fitri 1448 H & Nyepi</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 12) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-slate-300 text-slate-900">LBR</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        ${isKelas6 ? `
          <tr class="bg-orange-50 font-bold text-orange-950">
            <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Penilaian Sumatif Akhir Jenjang (PSAJ Kelas 6)</td>
            ${Array.from({ length: 30 }, (_, i) => {
              const w = i + 1;
              if (w === 22 || w === 23) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-orange-200 text-orange-900">PSAJ</td>`;
              return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
            }).join('')}
          </tr>
        ` : ''}
        <tr class="bg-purple-50 font-bold text-purple-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Perkiraan Penilaian Sumatif Akhir Tahun (ASAT)</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 26 || w === 27) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-purple-200 text-purple-900">ASAT</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-teal-50 font-bold text-teal-950">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Pengolahan Nilai & Pembagian Rapor Semester 2</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 28) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-teal-200 text-teal-900">RPT</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
        <tr class="bg-slate-200 font-bold text-slate-800">
          <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Libur Akhir Tahun Ajaran 2026/2027</td>
          ${Array.from({ length: 30 }, (_, i) => {
            const w = i + 1;
            if (w === 29 || w === 30) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-slate-300 text-slate-900">LBR</td>`;
            return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
          }).join('')}
        </tr>
      `;
    }

    const tahunAjaran = metadata.tahun_pembelajaran || inputData?.tahunAjaran || '2026/2027';
    const titimangsa = getKaldikTitimangsa(tahunAjaran, isSem1 ? 1 : 2);

    html += `
            </tbody>
          </table>
        </div>
        ${getPengesahanHtml(inputData, titimangsa)}
      </div>
    `;
  });

  return html;
}

/**
 * 4. RENDER TABEL RINCIAN PEKAN EFEKTIF (RPE) - STANDAR DISDIK KAB. PURWAKARTA
 */
export function renderRpeTable(data, inputData = {}, activeRpeSemester = 'all') {
  const metadata = data.metadata || {};
  const allSemesters = data.semesters || [];
  const faseKelas = metadata.fase_kelas || `Fase ${metadata.fase || 'C'}, Kelas ${metadata.kelas || '5'}`;
  const jenjangKelas = metadata.kelas || inputData?.jenjangKelas || '5';
  const quota = getAlokasiWaktuResmi(metadata.mata_pelajaran || inputData?.mataPelajaran || '', jenjangKelas);
  const jpPerMinggu = quota.jpPerMinggu || 2;

  const activeSemesters = allSemesters.filter(s => {
    if (activeRpeSemester === 'all') return true;
    return s.semester === activeRpeSemester;
  });

  let html = `
    <!-- Filter Bar Semester RPE -->
    <div class="flex items-center justify-between mb-5 pb-3 border-b border-slate-200 print:hidden font-sans">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-700">Tampilkan Semester:</span>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeRpeSemester === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="all">Semua Semester</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeRpeSemester === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="1">Semester 1 (Ganjil)</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeRpeSemester === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="2">Semester 2 (Genap)</button>
      </div>
      <span class="text-[11px] text-slate-500 font-medium">Acuan: SE Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026</span>
    </div>
  `;

  activeSemesters.forEach((sem, currentSemIdx) => {
    const isSem1 = sem.semester === 1;
    const rpe = calculateRpe(sem.semester, jpPerMinggu, jenjangKelas);

    html += `
      <div class="rpe-semester-block mb-12 ${currentSemIdx > 0 ? 'mt-12 pt-8 border-t-2 border-dashed border-slate-300' : ''}">
        ${getKopSuratHtml()}

        <div class="text-center mb-6">
          <h2 class="text-xl font-black uppercase tracking-wide text-slate-950 font-serif">RINCIAN PEKAN EFEKTIF (RPE)</h2>
          <p class="text-xs font-bold text-slate-700 font-serif uppercase tracking-widest mt-0.5">
            KURIKULUM MERDEKA - SEMESTER ${sem.semester} (${isSem1 ? 'GANJIL' : 'GENAP'}) TAHUN AJARAN ${escapeHtml(rpe.tahunAjaran)}
          </p>
          <p class="text-[11px] text-slate-500 italic font-serif mt-1">
            Berdasarkan Pedoman Kalender Pendidikan Dinas Pendidikan Kabupaten Purwakarta TA 2026/2027
          </p>
        </div>

        <div class="mb-6 max-w-xl">
          <table class="w-full text-xs font-bold font-serif text-slate-900 border-collapse">
            <tr>
              <td class="py-1 w-44">Satuan Pendidikan</td>
              <td class="py-1">: ${escapeHtml(metadata.satuan_pendidikan || inputData.namaSekolah || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Mata Pelajaran</td>
              <td class="py-1">: ${escapeHtml(metadata.mata_pelajaran || inputData.mataPelajaran || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Fase / Kelas / Semester</td>
              <td class="py-1">: ${escapeHtml(faseKelas)} / ${isSem1 ? 'I (Ganjil)' : 'II (Genap)'}</td>
            </tr>
            <tr>
              <td class="py-1">Tahun Pelajaran</td>
              <td class="py-1">: ${escapeHtml(metadata.tahun_pembelajaran || inputData.tahunAjaran || rpe.tahunAjaran)}</td>
            </tr>
            <tr>
              <td class="py-1">Nama Guru</td>
              <td class="py-1">: ${escapeHtml(metadata.guru || inputData.namaGuru || '-')}</td>
            </tr>
          </table>
        </div>

        <!-- Bagian I: Jumlah Pekan dalam Semester -->
        <div class="mb-5">
          <h3 class="text-xs font-bold font-serif text-slate-900 mb-2">I. Jumlah Pekan dalam Semester:</h3>
          <table class="w-full text-[11px] border-collapse border border-slate-900 font-serif text-slate-900 mb-2">
            <thead>
              <tr class="bg-slate-100 text-center font-bold">
                <th class="border border-slate-900 p-1.5 w-10">No</th>
                <th class="border border-slate-900 p-1.5 text-left">Nama Bulan</th>
                <th class="border border-slate-900 p-1.5 w-28">Jumlah Pekan</th>
                <th class="border border-slate-900 p-1.5 w-28 bg-emerald-50 text-emerald-950">Pekan Efektif</th>
                <th class="border border-slate-900 p-1.5 w-28 bg-rose-50 text-rose-950">Tidak Efektif</th>
                <th class="border border-slate-900 p-1.5 text-left">Keterangan Agenda</th>
              </tr>
            </thead>
            <tbody>
              ${rpe.bulanList.map((b, idx) => `
                <tr class="hover:bg-slate-50/60">
                  <td class="border border-slate-900 p-1.5 text-center">${idx + 1}</td>
                  <td class="border border-slate-900 p-1.5 font-bold">${escapeHtml(b.bulan)}</td>
                  <td class="border border-slate-900 p-1.5 text-center">${b.totalPekan}</td>
                  <td class="border border-slate-900 p-1.5 text-center font-bold bg-emerald-50/40 text-emerald-900">${b.pekanEfektif}</td>
                  <td class="border border-slate-900 p-1.5 text-center bg-rose-50/30 text-rose-900">${b.pekanTidakEfektif}</td>
                  <td class="border border-slate-900 p-1.5 text-slate-600">${escapeHtml(b.keterangan || '-')}</td>
                </tr>
              `).join('')}
              <tr class="bg-slate-100 font-bold">
                <td colspan="2" class="border border-slate-900 p-1.5 text-center">JUMLAH TOTAL</td>
                <td class="border border-slate-900 p-1.5 text-center">${rpe.totalPekanKalender}</td>
                <td class="border border-slate-900 p-1.5 text-center bg-emerald-100 text-emerald-950">${rpe.pekanEfektif}</td>
                <td class="border border-slate-900 p-1.5 text-center bg-rose-100 text-rose-950">${rpe.pekanTidakEfektif}</td>
                <td class="border border-slate-900 p-1.5 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bagian II: Rincian Pekan Tidak Efektif -->
        <div class="mb-5">
          <h3 class="text-xs font-bold font-serif text-slate-900 mb-2">II. Rincian Pekan Tidak Efektif (KBM &lt; 3 Hari):</h3>
          <table class="w-full text-[11px] border-collapse border border-slate-900 font-serif text-slate-900 mb-2">
            <thead>
              <tr class="bg-slate-100 text-center font-bold">
                <th class="border border-slate-900 p-1.5 w-10">No</th>
                <th class="border border-slate-900 p-1.5 text-left">Nama Kegiatan / Agenda Sekolah</th>
                <th class="border border-slate-900 p-1.5 text-center w-52">Waktu Pelaksanaan</th>
                <th class="border border-slate-900 p-1.5 text-center w-24">Jml Pekan</th>
                <th class="border border-slate-900 p-1.5 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${rpe.agendaTidakEfektif.map((ag, idx) => `
                <tr class="hover:bg-slate-50/60">
                  <td class="border border-slate-900 p-1.5 text-center">${idx + 1}</td>
                  <td class="border border-slate-900 p-1.5 font-bold">${escapeHtml(ag.kegiatan)}</td>
                  <td class="border border-slate-900 p-1.5 text-center text-slate-700">${escapeHtml(ag.tanggal)}</td>
                  <td class="border border-slate-900 p-1.5 text-center font-bold">${ag.jumlahPekan} Pekan</td>
                  <td class="border border-slate-900 p-1.5 text-slate-600">${escapeHtml(ag.keterangan)}</td>
                </tr>
              `).join('')}
              <tr class="bg-slate-100 font-bold">
                <td colspan="3" class="border border-slate-900 p-1.5 text-center">TOTAL PEKAN TIDAK EFEKTIF</td>
                <td class="border border-slate-900 p-1.5 text-center bg-rose-100 text-rose-950">${rpe.pekanTidakEfektif} Pekan</td>
                <td class="border border-slate-900 p-1.5 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bagian III: Rekapitulasi Pekan Efektif -->
        <div class="mb-5 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-serif leading-relaxed">
          <h3 class="font-bold text-slate-900 mb-2">III. Rekapitulasi Pekan Efektif Pembelajaran:</h3>
          <ul class="space-y-1.5 text-slate-800">
            <li>1. Jumlah Pekan Kalender Pendidikan : <strong>${rpe.totalPekanKalender} Pekan</strong></li>
            <li>2. Jumlah Pekan Tidak Efektif : <strong>${rpe.pekanTidakEfektif} Pekan</strong></li>
            <li class="text-emerald-800 font-black text-sm pt-1">
              3. Jumlah Pekan Efektif KBM (1 - 2) : <strong>${rpe.pekanEfektif} PEKAN EFEKTIF</strong>
            </li>
          </ul>
        </div>

        <!-- Bagian IV: Distribusi Jam Pelajaran (JP) -->
        <div class="mb-6">
          <h3 class="text-xs font-bold font-serif text-slate-900 mb-2">IV. Distribusi Alokasi Waktu Jam Pelajaran (JP):</h3>
          <table class="w-full text-[11px] border-collapse border border-slate-900 font-serif text-slate-900">
            <thead>
              <tr class="bg-slate-100 text-center font-bold">
                <th class="border border-slate-900 p-1.5 w-10">No</th>
                <th class="border border-slate-900 p-1.5 text-left">Uraian Alokasi Waktu</th>
                <th class="border border-slate-900 p-1.5 text-center w-52">Perhitungan</th>
                <th class="border border-slate-900 p-1.5 text-center w-28">Jumlah JP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-slate-900 p-1.5 text-center font-bold">1</td>
                <td class="border border-slate-900 p-1.5 font-bold">Jumlah Jam Pelajaran Efektif Tersedia (Intrakurikuler)</td>
                <td class="border border-slate-900 p-1.5 text-center">${rpe.pekanEfektif} Pekan × ${rpe.jpPerMinggu} JP</td>
                <td class="border border-slate-900 p-1.5 text-center font-black bg-emerald-100 text-emerald-950">${rpe.totalJpTersedia} JP</td>
              </tr>
              <tr>
                <td class="border border-slate-900 p-1.5 text-center">2</td>
                <td class="border border-slate-900 p-1.5">Alokasi Pembelajaran Tatap Muka (Materi Pokok & TP)</td>
                <td class="border border-slate-900 p-1.5 text-center text-slate-600">Sesuai Distribusi Bab di Promes</td>
                <td class="border border-slate-900 p-1.5 text-center font-bold">${rpe.jpTatapMuka} JP</td>
              </tr>
              <tr>
                <td class="border border-slate-900 p-1.5 text-center">3</td>
                <td class="border border-slate-900 p-1.5">Alokasi Jam Cadangan (Asesmen Sumatif Lingkup Materi / Remedial / Pengayaan)</td>
                <td class="border border-slate-900 p-1.5 text-center text-slate-600">Cadangan ~10%</td>
                <td class="border border-slate-900 p-1.5 text-center font-bold text-indigo-900">${rpe.jpCadangan} JP</td>
              </tr>
            </tbody>
          </table>
          <p class="text-[10px] text-slate-500 italic mt-1.5 font-serif">
            * Catatan: Sesuai pedoman Dinas Pendidikan Kabupaten Purwakarta, alokasi waktu mengacu pada Permendikdasmen No. 13 Tahun 2025 (${rpe.jpPerMinggu} JP/minggu).
          </p>
        </div>

        ${(() => {
          const tahunAjaran = metadata.tahun_pembelajaran || inputData?.tahunAjaran || rpe.tahunAjaran || '2026/2027';
          const titimangsa = getKaldikTitimangsa(tahunAjaran, isSem1 ? 1 : 2);
          return getPengesahanHtml(inputData, titimangsa);
        })()}
      </div>
    `;
  });

  return html;
}

/**
 * 5. RENDER TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
 */
export function renderKktpTable(data, inputData = {}, activePromesSemester = 'all') {
  const metadata = data.metadata || {};
  const allSemesters = data.semesters || [];
  const faseKelas = metadata.fase_kelas || `Fase ${metadata.fase || 'C'}, Kelas ${metadata.kelas || '5'}`;

  const activeSemesters = allSemesters.filter(s => {
    if (activePromesSemester === 'all') return true;
    return s.semester === activePromesSemester;
  });

  let html = `
    <!-- Filter Bar Semester KKTP -->
    <div class="flex items-center justify-between mb-5 pb-3 border-b border-slate-200 print:hidden font-sans">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-700">Tampilkan Semester:</span>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="all">Semua Semester</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="1">Semester 1</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="2">Semester 2</button>
      </div>
      <span class="text-[11px] text-slate-400 font-medium">Interval 4 Kategori Ketuntasan & Tindak Lanjut</span>
    </div>
  `;

  activeSemesters.forEach((sem, currentSemIdx) => {
    html += `
      <div class="kktp-semester-block mb-12 ${currentSemIdx > 0 ? 'mt-12 pt-8 border-t-2 border-dashed border-slate-300' : ''}">
        ${getKopSuratHtml()}

        <div class="text-center mb-6">
          <h2 class="text-xl font-black uppercase tracking-wide text-slate-950 font-serif">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h2>
          <p class="text-xs font-bold text-slate-700 font-serif uppercase tracking-widest mt-0.5">
            KURIKULUM MERDEKA - SEMESTER ${sem.semester} (${sem.semester === 1 ? 'GANJIL' : 'GENAP'})
          </p>
        </div>

        <div class="mb-5 max-w-xl">
          <table class="w-full text-xs font-bold font-serif text-slate-900 border-collapse">
            <tr>
              <td class="py-1 w-44">Mata Pelajaran</td>
              <td class="py-1">: ${escapeHtml(metadata.mata_pelajaran || inputData.mataPelajaran || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Satuan Pendidikan</td>
              <td class="py-1">: ${escapeHtml(metadata.satuan_pendidikan || inputData.namaSekolah || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Nama Guru</td>
              <td class="py-1">: ${escapeHtml(metadata.guru || inputData.namaGuru || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Tahun Pelajaran</td>
              <td class="py-1">: ${escapeHtml(metadata.tahun_pembelajaran || inputData.tahunAjaran || '-')}</td>
            </tr>
            <tr>
              <td class="py-1">Fase / Kelas / Semester</td>
              <td class="py-1">: ${escapeHtml(faseKelas)} / ${sem.semester === 1 ? 'I (Ganjil)' : 'II (Genap)'}</td>
            </tr>
          </table>
        </div>

        <div class="overflow-x-auto mb-6">
          <table class="w-full text-[11px] border-collapse border border-slate-900 font-serif text-slate-900">
            <thead>
              <tr class="bg-[#D9D2E9] text-center font-bold">
                <th rowspan="2" class="border border-slate-900 p-2 w-[5%]">No</th>
                <th rowspan="2" class="border border-slate-900 p-2 w-[22%]">Bab</th>
                <th rowspan="2" class="border border-slate-900 p-2 w-[39%]">Alur Tujuan Pembelajaran</th>
                <th colspan="4" class="border border-slate-900 p-1.5 w-[34%]">Skala atau Interval Nilai</th>
              </tr>
              <tr class="bg-[#EAE6F3] text-center font-bold text-[10px]">
                <th class="border border-slate-900 p-1.5 w-[8.5%] bg-rose-50/70">0 - 40%</th>
                <th class="border border-slate-900 p-1.5 w-[8.5%] bg-amber-50/70">41 - 65%</th>
                <th class="border border-slate-900 p-1.5 w-[8.5%] bg-emerald-50/70">66 - 85%</th>
                <th class="border border-slate-900 p-1.5 w-[8.5%] bg-sky-50/70">86 - 100%</th>
              </tr>
            </thead>
            <tbody>
    `;

    (sem.babs || []).forEach((bab, babIdx) => {
      const items = bab.items && bab.items.length > 0 ? bab.items : [{
        atp: bab.bab,
        alokasi_waktu: '2 JP'
      }];

      const rowSpan = items.length;

      items.forEach((item, itemIdx) => {
        const isFirst = itemIdx === 0;
        html += `<tr class="hover:bg-slate-50/50">`;

        if (isFirst) {
          html += `
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2 text-center align-top font-bold" contenteditable="true" data-field="no" data-sem-idx="${sem.semester - 1}" data-bab-idx="${babIdx}">
              ${escapeHtml(String(bab.no))}
            </td>
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2.5 align-top font-bold" contenteditable="true" data-field="bab" data-sem-idx="${sem.semester - 1}" data-bab-idx="${babIdx}">
              ${escapeHtml(bab.bab)}
            </td>
          `;
        }

        html += `
          <td class="border border-slate-900 p-2.5 align-top text-justify" contenteditable="true" data-field="atp" data-sem-idx="${sem.semester - 1}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(item.atp)}
          </td>
          <td class="border border-slate-900 p-2 text-center align-middle cursor-pointer hover:bg-rose-100 transition-colors kktp-check-cell" data-target-scale="1" title="Klik untuk tandai remedial total">
            ${item.kktp_scale === 1 ? '<i class="fas fa-check text-rose-600 font-bold"></i>' : ''}
          </td>
          <td class="border border-slate-900 p-2 text-center align-middle cursor-pointer hover:bg-amber-100 transition-colors kktp-check-cell" data-target-scale="2" title="Klik untuk tandai remedial parsial">
            ${item.kktp_scale === 2 ? '<i class="fas fa-check text-amber-600 font-bold"></i>' : ''}
          </td>
          <td class="border border-slate-900 p-2 text-center align-middle cursor-pointer hover:bg-emerald-100 transition-colors kktp-check-cell font-bold text-emerald-700 bg-emerald-50/20" data-target-scale="3" title="Klik untuk tandai tuntas">
            ${(!item.kktp_scale || item.kktp_scale === 3) ? '<i class="fas fa-check text-emerald-600 font-black"></i>' : ''}
          </td>
          <td class="border border-slate-900 p-2 text-center align-middle cursor-pointer hover:bg-sky-100 transition-colors kktp-check-cell" data-target-scale="4" title="Klik untuk tandai pengayaan">
            ${item.kktp_scale === 4 ? '<i class="fas fa-check text-sky-600 font-bold"></i>' : ''}
          </td>
        </tr>`;
      });
    });

    html += `
            </tbody>
          </table>
        </div>

        <div class="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs font-serif leading-relaxed">
          <h4 class="font-bold text-slate-900 uppercase tracking-wider mb-2">Keterangan Interval Kriteria Ketercapaian & Tindak Lanjut:</h4>
          <table class="w-full text-xs border border-slate-400">
            <tr class="bg-slate-100 font-bold border-b border-slate-400">
              <th class="p-2 border-r border-slate-400 w-28 text-center">Interval Nilai</th>
              <th class="p-2 text-left">Kriteria & Tindak Lanjut Intervensi Pendidik</th>
            </tr>
            <tr class="border-b border-slate-300">
              <td class="p-2 font-bold text-center border-r border-slate-300 bg-rose-50 text-rose-800">0 - 40%</td>
              <td class="p-2">Belum mencapai ketuntasan tujuan pembelajaran, remedial di seluruh bagian materi</td>
            </tr>
            <tr class="border-b border-slate-300">
              <td class="p-2 font-bold text-center border-r border-slate-300 bg-amber-50 text-amber-800">41 - 65%</td>
              <td class="p-2">Belum mencapai ketuntasan tujuan pembelajaran, remedial di bagian materi tertentu yang belum dikuasai</td>
            </tr>
            <tr class="border-b border-slate-300">
              <td class="p-2 font-bold text-center border-r border-slate-300 bg-emerald-50 text-emerald-800">66 - 85%</td>
              <td class="p-2"><strong>Sudah mencapai ketuntasan standar</strong>, tidak perlu remedial, dapat melanjutkan ke materi berikutnya</td>
            </tr>
            <tr>
              <td class="p-2 font-bold text-center border-r border-slate-300 bg-sky-50 text-sky-800">86 - 100%</td>
              <td class="p-2">Sudah mencapai ketuntasan istimewa, diberikan tantangan materi atau aktivitas pengayaan mandiri</td>
            </tr>
          </table>
        </div>

        ${(() => {
          const isSem1 = sem.semester === 1 || String(sem.semester).includes('1') || sem.semester_label?.includes('1');
          const tahunAjaran = metadata.tahun_pembelajaran || inputData?.tahunAjaran || '2026/2027';
          const titimangsa = getKaldikTitimangsa(tahunAjaran, isSem1 ? 1 : 2);
          return getPengesahanHtml(inputData, titimangsa);
        })()}
      </div>
    `;
  });

  return html;
}

/**
 * 5. MASTER CANVAS DISPATCHER (4-in-1 Output Engine)
 */
export function renderAnalysisCanvas(data, inputData, activeAnalysisTab = 'analisis', activePromesSemester = 'all', onSemesterFilterChange = null) {
  const canvas = document.getElementById('analisis-canvas');
  if (!canvas || !data) return;

  // Update floating toolbar tab buttons
  document.querySelectorAll('#analisis-view-tabs .analisis-tab-btn').forEach(btn => {
    if (btn.dataset.tab === activeAnalysisTab) {
      btn.className = 'analisis-tab-btn active px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-indigo-600 text-white shadow-sm flex items-center gap-1.5';
    } else {
      btn.className = 'analisis-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5';
    }
  });

  // Update download button label
  const downloadLabel = document.getElementById('btn-download-docx-label');
  if (downloadLabel) {
    if (activeAnalysisTab === 'prota') downloadLabel.innerText = 'Unduh Word Prota';
    else if (activeAnalysisTab === 'promes') downloadLabel.innerText = 'Unduh Word Promes';
    else if (activeAnalysisTab === 'rpe') downloadLabel.innerText = 'Unduh Word RPE';
    else if (activeAnalysisTab === 'kktp') downloadLabel.innerText = 'Unduh Word KKTP';
    else downloadLabel.innerText = 'Unduh Word Analisis CP';
  }

  // Update Permendikdasmen No. 13 Tahun 2025 Alokasi Waktu Compliance Banner
  const banner = document.getElementById('analisis-alokasi-banner');
  if (banner) {
    const mapel = data.metadata?.mata_pelajaran || inputData?.mataPelajaran || '';
    const kelas = data.metadata?.kelas || inputData?.jenjangKelas || '5';
    const quota = getAlokasiWaktuResmi(mapel, kelas);

    let totalJpAll = 0;
    (data.semesters || []).forEach(sem => {
      (sem.babs || []).forEach(b => {
        (b.items || []).forEach(it => {
          totalJpAll += parseJpNum(it.alokasi_waktu);
        });
      });
    });

    const activeSemestersWithBabs = (data.semesters || []).filter(s => (s.babs || []).length > 0);
    const isFullYear = activeSemestersWithBabs.length > 1;
    const targetJp = isFullYear ? quota.intrakurikulerPerTahun : quota.intrakurikulerPerSemester;
    const isBalanced = totalJpAll === targetJp;

    banner.innerHTML = `
      <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-base shadow-sm shrink-0">
            <i class="fas fa-scale-balanced"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">STANDAR ALOKASI WAKTU RESMI</span>
              <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] tracking-wide">Permendikdasmen No. 13/2025</span>
              <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">${escapeHtml(quota.namaResmi)} - Kelas ${quota.kelas}</span>
            </div>
            <p class="text-slate-600 dark:text-slate-300 mt-1 leading-normal">
              Intrakurikuler: <strong class="text-slate-900 dark:text-white">${quota.jpPerMinggu} JP/minggu</strong> (${quota.intrakurikulerPerSemester} JP/semester • ${quota.intrakurikulerPerTahun} JP/tahun) • Kokurikuler: <strong class="text-slate-900 dark:text-white">${quota.kokurikulerPerTahun} JP/tahun</strong> (7 Kebiasaan Anak Indonesia Hebat)
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 self-end md:self-auto shrink-0">
          <div class="px-3.5 py-1.5 rounded-xl ${isBalanced ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'} font-bold flex items-center gap-2 text-xs">
            <i class="fas ${isBalanced ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-triangle-exclamation text-amber-600 dark:text-amber-400'}"></i>
            <span>Total: <strong>${totalJpAll} JP</strong> ${isBalanced ? '✅ Klop 100%' : `(Target: ${targetJp} JP)`}</span>
          </div>
          <button type="button" id="btn-auto-balance-jp" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer" title="Seimbangkan ulang jam pelajaran secara otomatis agar tepat sesuai kuota resmi pemerintah">
            <i class="fas fa-wand-magic-sparkles text-amber-300"></i> Seimbangkan JP
          </button>
        </div>
      </div>
    `;

    const autoBtn = document.getElementById('btn-auto-balance-jp');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        (data.semesters || []).forEach(sem => {
          balanceSemesterJpItems(sem.babs, quota.intrakurikulerPerSemester, quota.jpPerMinggu);
        });
        showToast('Alokasi waktu berhasil diseimbangkan sesuai Permendikdasmen No. 13 Tahun 2025!', 'success');
        renderAnalysisCanvas(data, inputData, activeAnalysisTab, activePromesSemester, onSemesterFilterChange);
      });
    }
  }

  let contentHtml = '';
  try {
    if (activeAnalysisTab === 'prota') {
      contentHtml = renderProtaTable(data, inputData);
    } else if (activeAnalysisTab === 'promes') {
      contentHtml = renderPromesTable(data, inputData, activePromesSemester);
    } else if (activeAnalysisTab === 'rpe') {
      contentHtml = renderRpeTable(data, inputData, activePromesSemester);
    } else if (activeAnalysisTab === 'kktp') {
      contentHtml = renderKktpTable(data, inputData, activePromesSemester);
    } else {
      contentHtml = renderAnalisisTable(data, inputData);
    }
  } catch (renderErr) {
    console.error(`[Canvas Render Error] Tab: ${activeAnalysisTab}`, renderErr);
    contentHtml = `
      <div class="p-8 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-3xl text-rose-800 dark:text-rose-200 my-6">
        <i class="fas fa-triangle-exclamation text-3xl mb-3 text-rose-500"></i>
        <h3 class="font-black text-base mb-1">Gagal Menampilkan Tab ${escapeHtml(activeAnalysisTab.toUpperCase())}</h3>
        <p class="text-xs text-rose-600 dark:text-rose-300 mb-4">${escapeHtml(renderErr.message || 'Terjadi kesalahan perenderan')}</p>
      </div>
    `;
  }

  // Terapkan orientasi cetak dan penyesuaian lebar canvas untuk Promes
  applyPrintOrientation(activeAnalysisTab);

  if (activeAnalysisTab === 'promes') {
    canvas.classList.remove('max-w-[1240px]');
    canvas.classList.add('max-w-[1440px]', 'min-w-[1100px]');
  } else {
    canvas.classList.remove('max-w-[1440px]', 'min-w-[1100px]');
    canvas.classList.add('max-w-[1240px]');
  }

  canvas.innerHTML = contentHtml;

  // Attach Semester Filter Listener (Promes & KKTP)
  canvas.querySelectorAll('.btn-sem-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      syncCanvasToAnalysisData(data);
      const newSem = btn.dataset.sem === 'all' ? 'all' : Number(btn.dataset.sem);
      if (typeof onSemesterFilterChange === 'function') {
        onSemesterFilterChange(newSem);
      }
    });
  });

  // Attach KKTP Checklist Click Listener
  canvas.querySelectorAll('.kktp-check-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const targetScale = Number(cell.dataset.targetScale);
      const row = cell.closest('tr');
      if (!row) return;

      row.querySelectorAll('.kktp-check-cell').forEach(c => c.innerHTML = '');
      cell.innerHTML = '<i class="fas fa-check text-indigo-600 font-bold"></i>';

      const atpEl = row.querySelector('[data-field="atp"]');
      if (atpEl) {
        const semIdx = Number(atpEl.dataset.semIdx);
        const babIdx = Number(atpEl.dataset.babIdx);
        const itemIdx = Number(atpEl.dataset.itemIdx);
        if (data.semesters?.[semIdx]?.babs?.[babIdx]?.items?.[itemIdx]) {
          data.semesters[semIdx].babs[babIdx].items[itemIdx].kktp_scale = targetScale;
        }
      }
    });
  });

  document.getElementById('analisis-form-view')?.classList.add('hidden');
  document.getElementById('analisis-result-view')?.classList.remove('hidden');
}

/**
 * 6. SINKRONKAN PERUBAHAN TEKS INTERAKTIF DI KANVAS (contenteditable) KE STATE DATA
 */
export function syncCanvasToAnalysisData(analysisData) {
  if (!analysisData) return;
  const canvas = document.getElementById('analisis-canvas');
  if (!canvas) return;

  canvas.querySelectorAll('[data-field]').forEach(el => {
    const semIdx = Number(el.dataset.semIdx);
    const babIdx = Number(el.dataset.babIdx);
    const itemIdx = el.dataset.itemIdx !== undefined ? Number(el.dataset.itemIdx) : -1;
    const field = el.dataset.field;
    const val = el.innerText.trim();

    const targetSem = analysisData.semesters?.[semIdx];
    if (!targetSem) return;
    const targetBab = targetSem.babs?.[babIdx];
    if (!targetBab) return;

    if (field === 'no') targetBab.no = val;
    else if (field === 'bab') targetBab.bab = val;
    else if (field === 'cp') targetBab.cp = val;
    else if (itemIdx >= 0 && targetBab.items?.[itemIdx]) {
      if (field === 'materi_pokok') targetBab.items[itemIdx].materi_pokok = val;
      else if (field === 'kode_tp') targetBab.items[itemIdx].kode_tp = val;
      else if (field === 'tp') targetBab.items[itemIdx].tp = val;
      else if (field === 'atp') targetBab.items[itemIdx].atp = val;
      else if (field === 'alokasi_waktu') targetBab.items[itemIdx].alokasi_waktu = val;
    }
  });
}

/**
 * 7. TERAPKAN ORIENTASI CETAK OTOMATIS (@media print @page)
 * Khusus Promes (dan Prota) menggunakan A4 Landscape agar efisien dan matriks 30 minggu tidak terpotong
 */
export function applyPrintOrientation(tab) {
  let styleEl = document.getElementById('analisis-print-page-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'analisis-print-page-style';
    document.head.appendChild(styleEl);
  }

  const isLandscape = (tab === 'promes' || tab === 'prota');
  if (isLandscape) {
    document.body.classList.add('print-landscape');
    styleEl.textContent = `
      @media print {
        @page {
          size: A4 landscape !important;
          margin: 0.8cm 1cm !important;
        }
      }
    `;
  } else {
    document.body.classList.remove('print-landscape');
    styleEl.textContent = `
      @media print {
        @page {
          size: A4 portrait !important;
          margin: 1cm 1.25cm 1cm 1.25cm !important;
        }
      }
    `;
  }
}
