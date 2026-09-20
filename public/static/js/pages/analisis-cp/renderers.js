import { escapeHtml, showToast } from '../../utils.js';
import { getKopSuratHtml, getPengesahanHtml, getItemJpText, parseJpNum, getKaldikTitimangsa } from './helpers.js';
import { getAlokasiWaktuResmi, balanceSemesterJpItems } from './alokasi-waktu.js';
import { calculateRpe, KALDIK_PURWAKARTA_2026_2027 } from './kaldik-purwakarta.js';

/**
 * Ekstraksi blok-blok Elemen dari teks CP (mendukung multi-elemen seperti [Pemahaman IPAS] dan [Keterampilan Proses])
 */
export function parseCpElementBlocks(rawCp) {
  if (!rawCp || typeof rawCp !== 'string') return [];
  const text = rawCp.trim();
  if (!text) return [];

  // Match all [ElementName] or [Elemen: ElementName] followed by content up to the next bracket or end
  const bracketRegex = /\[([^\]]+)\]\s*([\s\S]*?)(?=(?:\[[^\]]+\]|$))/g;
  const matches = [...text.matchAll(bracketRegex)];

  if (matches.length > 0) {
    return matches.map(m => ({
      element: m[1].replace(/^Elemen\s*:\s*/i, '').trim(),
      content: m[2].trim()
    })).filter(b => b.element || b.content);
  }

  // Fallback colon format: "Elemen: ..." or "Pemahaman IPAS: ..."
  const colonMatch = text.match(/^(Elemen\s*[^:\n]+|[^:\n]{3,35}):\s*([\s\S]*)$/is);
  if (colonMatch && !colonMatch[1].includes('http') && !colonMatch[1].toLowerCase().includes('contoh')) {
    return [{
      element: colonMatch[1].replace(/^Elemen\s*:\s*/i, '').trim(),
      content: colonMatch[2].trim()
    }];
  }

  return [{
    element: '',
    content: text
  }];
}

/**
 * Format teks Capaian Pembelajaran dengan badge/penanda Elemen yang jelas (mendukung dwi-elemen IPAS)
 */
export function formatCpContentHtml(cpText, babTitle = '') {
  if (!cpText) {
    const titleMatch = (babTitle || '').match(/\[(.*?)\]/);
    if (titleMatch) {
      return `<div class="font-bold text-indigo-950 dark:text-indigo-200 mb-1 text-[10.5px] uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded w-fit">[Elemen: ${escapeHtml(titleMatch[1])}]</div><div>-</div>`;
    }
    return '-';
  }

  const blocks = parseCpElementBlocks(cpText);
  if (blocks.length === 0) return escapeHtml(cpText).replace(/\n/g, '<br>');

  if (blocks.length === 1 && !blocks[0].element) {
    const titleMatch = (babTitle || '').match(/\[(.*?)\]/);
    if (titleMatch) {
      blocks[0].element = titleMatch[1];
    }
  }

  return blocks.map((b, idx) => {
    const elLower = (b.element || '').toLowerCase();
    let badgeClass = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border-indigo-200/80 dark:border-indigo-800/60';
    if (elLower.includes('proses') || elLower.includes('keterampilan')) {
      badgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-800/60';
    }

    const badgeHtml = b.element
      ? `<div class="font-bold mb-1 text-[10.5px] uppercase tracking-wide border px-1.5 py-0.5 rounded w-fit ${badgeClass}">[Elemen: ${escapeHtml(b.element)}]</div>`
      : '';
    const contentHtml = b.content ? `<div class="leading-relaxed">${escapeHtml(b.content).replace(/\n/g, '<br>')}</div>` : '';
    const divider = (blocks.length > 1 && idx < blocks.length - 1) ? '<div class="my-2 border-b border-dashed border-slate-300 dark:border-slate-700"></div>' : '';

    return `<div>${badgeHtml}${contentHtml}</div>${divider}`;
  }).join('');
}

/**
 * Ekstraksi seluruh Capaian Pembelajaran (CP) dan Elemen unik yang diajarkan pada semester tertentu
 */
export function extractSemesterCpItems(sem) {
  const babs = sem?.babs || [];
  const items = [];

  babs.forEach((bab, babIdx) => {
    const rawCp = (bab?.cp || '').trim();
    if (!rawCp) return;

    const blocks = parseCpElementBlocks(rawCp);
    blocks.forEach(b => {
      let element = (b.element || '').replace(/^Elemen\s*:?\s*/i, '').trim();
      let cpText = (b.content || '').trim();

      if (!element && !cpText) return;
      if (!element) {
        const titleMatch = (bab.bab || '').match(/\[(.*?)\]/);
        if (titleMatch) {
          element = titleMatch[1].replace(/^Elemen\s*:\s*/i, '').trim();
        }
      }

      element = element.replace(/^Elemen\s*:?\s*/i, '').trim();

      // Deduplikasi berdasarkan nama elemen (jika ada) atau kemiripan teks CP
      const existingIndex = items.findIndex(it => {
        if (element && it.element) {
          return it.element.toUpperCase() === element.toUpperCase();
        }
        return it.cp.toLowerCase().replace(/\s+/g, ' ') === cpText.toLowerCase().replace(/\s+/g, ' ');
      });

      if (existingIndex >= 0) {
        if (!items[existingIndex].babIndices.includes(babIdx)) {
          items[existingIndex].babIndices.push(babIdx);
        }
        if (cpText.length > items[existingIndex].cp.length) {
          items[existingIndex].cp = cpText;
          items[existingIndex].raw = element ? `[${element}] ${cpText}` : rawCp;
        }
      } else {
        items.push({
          element,
          cp: cpText || rawCp,
          raw: element ? `[${element}] ${cpText}` : rawCp,
          babIndices: [babIdx]
        });
      }
    });
  });

  if (items.length === 0) {
    items.push({
      element: '',
      cp: 'Memahami konsep dasar dan menerapkan kompetensi esensial pembelajaran sesuai standar kurikulum merdeka.',
      raw: 'Memahami konsep dasar dan menerapkan kompetensi esensial pembelajaran sesuai standar kurikulum merdeka.',
      babIndices: [0]
    });
  }

  return items;
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

    const realSemIdx = allSemesters.findIndex(s => s.semester === sem.semester);
    const effectiveSemIdx = realSemIdx >= 0 ? realSemIdx : currentSemIdx;
    const cpItems = extractSemesterCpItems(sem);

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
          <strong class="block mb-2 text-slate-900 font-bold">A. Capaian Pembelajaran (CP) Resmi:</strong>
          <div class="space-y-3">
            ${cpItems.map((item, itemIdx) => `
              <div class="cp-element-item ${itemIdx > 0 ? 'pt-2.5 border-t border-slate-200/80' : ''}">
                ${item.element ? `
                  <div class="font-bold text-slate-900 mb-1 text-[11px] tracking-wide uppercase">
                    [ELEMEN: ${escapeHtml(item.element)}]
                  </div>
                ` : ''}
                <p class="text-slate-800 text-justify" contenteditable="true" data-field="promes_cp_overview" data-sem-idx="${effectiveSemIdx}" data-bab-idx="${item.babIndices[0]}">
                  ${escapeHtml(item.cp).replace(/\n/g, '<br>')}
                </p>
              </div>
            `).join('')}
          </div>
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
 * Helper client-side untuk mengelompokkan data analisis ke dalam Elemen CP resmi BSKAP
 */
export function groupAnalysisDataByElementsClient(data) {
  const metadata = data?.metadata || {};
  const mapel = (metadata.mata_pelajaran || '').toLowerCase();
  const kelas = metadata.kelas || '5';
  
  // Kamus elemen standar untuk mapel-mapel utama SD
  let elementDefs = [];
  if (mapel.includes('matematika')) {
    elementDefs = [
      { name: "Bilangan", cp: "Menunjukkan pemahaman dan memiliki intuisi bilangan (number sense) pada bilangan cacah sampai tingkat yang dipelajari; melakukan operasi penjumlahan, pengurangan, perkalian, pembagian, serta memahami konsep pecahan dan desimal." },
      { name: "Aljabar", cp: "Menemukan pola gambar atau objek sederhana dan pola bilangan membesar/mengecil; memahami makna kalimat matematika dan menyelesaikan permasalahan yang melibatkan operasi hitung dasar." },
      { name: "Pengukuran", cp: "Mengukur dan membandingkan panjang, berat, luas, volume benda, durasi waktu, serta besar sudut menggunakan satuan baku dan satuan tidak baku." },
      { name: "Geometri", cp: "Mendeskripsikan dan mengonstruksi ciri berbagai bangun datar dan bangun ruang; mengenali visualisasi spasial serta menentukan posisi dan lokasi benda." },
      { name: "Analisis Data dan Peluang", cp: "Mengurutkan, membandingkan, menyajikan, dan menganalisis data banyak benda dalam bentuk tabel, piktogram, dan diagram batang; serta memahami konsep peluang kejadian sederhana." }
    ];
  } else if (mapel.includes('ipas') || mapel.includes('ilmu pengetahuan alam') || mapel.includes('sains')) {
    elementDefs = [
      { name: "Pemahaman IPAS", cp: "Memahami dan merefleksikan sistem organ tubuh manusia dan kesehatan, interaksi komponen biotik dan abiotik dalam ekosistem, fenomena gelombang bunyi dan cahaya, siklus air dan penghematan energi, letak geografis Indonesia, sejarah perjuangan pahlawan dan keragaman budaya, serta kegiatan ekonomi masyarakat." },
      { name: "Keterampilan Proses", cp: "Menerapkan keterampilan proses sains: mengamati fenomena dan peristiwa secara cermat, membuat prediksi ilmiah, merencanakan dan melakukan penyelidikan sederhana, mengorganisasikan data hasil observasi, mengevaluasi hasil penyelidikan, serta mengomunikasikan kesimpulan secara lisan maupun tertulis." }
    ];
  } else if (mapel.includes('indonesia')) {
    elementDefs = [
      { name: "Menyimak", cp: "Memahami dan menganalisis informasi, pesan, ide pokok, dan ide pendukung dari berbagai tipe teks nonsastra dan sastra berbentuk teks aural (yang dibacakan atau didengarkan)." },
      { name: "Membaca dan Memirsa", cp: "Membaca kata-kata dan teks dengan fasih, serta memahami dan menganalisis informasi, nilai-nilai moral, dan karakter tokoh dalam teks visual maupun audiovisual." },
      { name: "Berbicara dan Mempresentasikan", cp: "Menyampaikan gagasan, tanggapan, dan perasaan secara lisan dengan pilihan kata yang santun, intonasi yang tepat, serta sikap tubuh/gestur yang percaya diri dalam berbagai konteks komunikasi." },
      { name: "Menulis", cp: "Menulis berbagai tipe teks narasi, deskripsi, eksposisi, dan kreatif dengan kalimat efektif, kosakata yang kaya, serta menerapkan kaidah kebahasaan dan ejaan yang benar." }
    ];
  } else if (mapel.includes('pancasila') || mapel.includes('pkn')) {
    elementDefs = [
      { name: "Pancasila", cp: "Memahami sejarah kelahiran Pancasila, makna simbol dan sila-sila Pancasila, serta meneladani sikap para perumus Pancasila dalam kehidupan sehari-hari." },
      { name: "Undang-Undang Dasar Negara Republik Indonesia Tahun 1945", cp: "Mengimplementasikan bentuk-bentuk norma, hak, dan kewajiban sebagai warga negara, serta mempraktikkan musyawarah untuk mencapai mufakat dalam membuat aturan bersama." },
      { name: "Bhinneka Tunggal Ika", cp: "Menghormati, menjaga, dan melestarikan keberagaman budaya, suku bangsa, bahasa, dan agama dalam bingkai Bhinneka Tunggal Ika." },
      { name: "Negara Kesatuan Republik Indonesia", cp: "Mengenal karakteristik wilayah tempat tinggal dan lingkungan sekitar, serta menunjukkan perilaku gotong royong untuk menjaga persatuan bangsa." }
    ];
  } else if (mapel.includes('agama') || mapel.includes('paibp') || mapel.includes('pai') || mapel.includes('islam')) {
    elementDefs = [
      { name: "Al-Qur’an Hadis", cp: "Membaca, menulis huruf hijaiah bersambung, menghafal serta menjelaskan kandungan beberapa surah pendek Al-Qur'an dan hadis tentang akhlak mulia." },
      { name: "Akidah", cp: "Menjelaskan dan meyakini rukun iman, sifat-sifat Allah Swt., beberapa asmaulhusna, dan hari akhir." },
      { name: "Akhlak", cp: "Menerapkan akhlak terpuji terhadap Allah Swt., diri sendiri, orang tua, keluarga, guru, sesama manusia, serta menjaga kelestarian lingkungan." },
      { name: "Fikih", cp: "Menerapkan ketentuan tata cara bersuci (thaharah), salat fardu dan sunah, puasa, serta zakat/infak/sedekah sesuai syariat Islam." },
      { name: "Sejarah Peradaban Islam", cp: "Menceritakan dan mengambil keteladanan dari kisah perjuangan dakwah Nabi Muhammad saw., para sahabat, dan khulafaur rasyidin." }
    ];
  } else if (mapel.includes('seni rupa') || mapel.includes('rupa')) {
    elementDefs = [
      { name: "Mengalami (Experiencing)", cp: "Mengidentifikasi dan mengamati unsur rupa (garis, bentuk, warna, tekstur) dan prinsip desain pada karya seni rupa di lingkungan sekitar." },
      { name: "Merefleksikan (Reflecting)", cp: "Merefleksikan dan mengapresiasi karya seni rupa diri sendiri dan teman menggunakan kosakata seni yang sesuai." },
      { name: "Berpikir dan Bekerja Artistik", cp: "Mengenali dan menguji coba variasi alat, bahan, dan teknik berkarya seni rupa." },
      { name: "Menciptakan (Making/Creating)", cp: "Membuat karya seni rupa dua atau tiga dimensi berdasarkan pengalaman dan pengamatan terhadap lingkungan sekitar." },
      { name: "Berdampak (Impacting)", cp: "Menghasilkan karya seni rupa yang berdampak positif pada perasaan dirinya atau menyampaikan pesan kepedulian lingkungan." }
    ];
  } else {
    // Fallback: ambil elemen unik dari bab-bab yang ada
    const fallbackMap = new Map();
    (data?.semesters || []).forEach(sem => {
      (sem.babs || []).forEach(bab => {
        fallbackMap.set(bab.bab, {
          name: bab.bab,
          cp: bab.cp || 'Memahami dan menerapkan materi pokok pada bab ini.'
        });
      });
    });
    elementDefs = Array.from(fallbackMap.values());
  }

  // Buat buckets
  const buckets = elementDefs.map((def, idx) => ({
    no: idx + 1,
    elemen: def.name,
    cp: def.cp,
    lingkup_materi: new Set(),
    items: [],
    total_jp: 0
  }));

  // Kumpulkan items
  const allItems = [];
  (data?.semesters || []).forEach(sem => {
    (sem.babs || []).forEach((bab, bIdx) => {
      (bab.items || []).forEach(it => {
        allItems.push({
          item: it,
          babTitle: bab.bab,
          babNo: bab.no || bIdx + 1,
          babCp: bab.cp || ''
        });
      });
    });
  });

  // Scoring function yang presisi
  const scoreItem = (elemName, itemText, babCp, babTitle) => {
    const t = (itemText || '').toLowerCase();
    const cpLower = (babCp || '').toLowerCase();
    const titleLower = (babTitle || '').toLowerCase();
    const e = elemName.toLowerCase();
    const cleanElem = e.split('(')[0].trim();
    let score = 0;

    // 1. Prioritas utama: jika ada tag kurung siku [Nama Elemen] pada babCp atau babTitle
    const tags = [`[${cleanElem}`];
    if (cleanElem.includes('data') || cleanElem.includes('peluang')) {
      tags.push('[analisis data', '[data dan diagram', '[data dan peluang', '[data]', '[peluang]');
    } else if (cleanElem.includes('pengukuran')) {
      tags.push('[pengukuran', '[mengukur');
    } else if (cleanElem.includes('geometri')) {
      tags.push('[geometri', '[bangun datar', '[bangun ruang');
    } else if (cleanElem.includes('aljabar')) {
      tags.push('[aljabar', '[pola bilangan', '[rasio', '[proporsi');
    } else if (cleanElem.includes('bilangan')) {
      tags.push('[bilangan', '[bilangan cacah', '[pecahan');
    }

    const hasTagMatch = tags.some(tag => cpLower.includes(tag) || titleLower.includes(tag));
    if (hasTagMatch) {
      score += 100;
    }

    // 2. Jika judul bab secara eksplisit menyebut elemen atau aliasnya
    if (titleLower.includes(cleanElem)) {
      score += 35;
    } else if (cleanElem.includes('data') || cleanElem.includes('peluang')) {
      if (/\b(data|diagram|piktogram|turus|grafik|peluang|frekuensi)\b/i.test(titleLower.replace(/datar/g, ''))) score += 35;
    } else if (cleanElem.includes('pengukuran')) {
      if (/\b(pengukuran|mengukur|keliling|luas|sudut|panjang|berat|volume|durasi|waktu)\b/i.test(titleLower)) score += 35;
    } else if (cleanElem.includes('geometri')) {
      if (/\b(geometri|bangun ruang|bangun datar|spasial|kubus|balok|prisma|tabung|simetri)\b/i.test(titleLower)) score += 35;
    } else if (cleanElem.includes('aljabar')) {
      if (/\b(aljabar|rasio|proporsi|skala|variabel)\b/i.test(titleLower)) score += 35;
    } else if (cleanElem.includes('bilangan')) {
      if (/\b(bilangan|cacah|kpk|fpb|pecahan|desimal)\b/i.test(titleLower)) score += 35;
    }

    // 3. Keyword scoring pada judul & item
    const combined = `${titleLower} ${t}`;

    if (cleanElem.includes('data') || cleanElem.includes('peluang')) {
      const withoutDatar = combined.replace(/datar/g, '');
      if (withoutDatar.includes('analisis data') || withoutDatar.includes('diagram') || withoutDatar.includes('tabel data') || withoutDatar.includes('tabel frekuensi') || withoutDatar.includes('piktogram') || withoutDatar.includes('turus') || withoutDatar.includes('grafik') || withoutDatar.includes('peluang') || withoutDatar.includes('mengumpulkan data') || withoutDatar.includes('pengumpulan data') || withoutDatar.includes('penyajian data') || /\bdata\b/i.test(withoutDatar)) {
        score += 30;
      }
    }

    if (cleanElem.includes('geometri')) {
      if (combined.includes('bangun datar') || combined.includes('bangun ruang') || combined.includes('geometri') || combined.includes('kubus') || combined.includes('balok') || combined.includes('segitiga') || combined.includes('lingkaran') || combined.includes('spasial') || combined.includes('simetri lipat') || combined.includes('simetri putar') || combined.includes('jaring-jaring')) {
        score += 25;
      }
    }

    if (cleanElem.includes('pengukuran')) {
      if (combined.includes('pengukuran') || combined.includes('mengukur') || combined.includes('panjang') || combined.includes('berat') || combined.includes('luas') || combined.includes('volume') || combined.includes('durasi') || combined.includes('sudut') || combined.includes('keliling') || combined.includes('busur')) {
        score += 25;
      }
    }

    if (cleanElem.includes('aljabar')) {
      if (combined.includes('aljabar') || combined.includes('pola bilangan') || combined.includes('kalimat matematika') || combined.includes('simbol') || combined.includes('rasio') || combined.includes('proporsi') || combined.includes('variabel') || combined.includes('skala')) {
        score += 25;
      }
    }

    if (cleanElem.includes('bilangan')) {
      if (combined.includes('bukan bilangan')) {
        // Abaikan jika negasi
      } else if (combined.includes('bilangan cacah') || combined.includes('nilai tempat') || combined.includes('membaca dan menulis bilangan') || combined.includes('pecahan') || combined.includes('desimal') || combined.includes('operasi hitung') || combined.includes('kpk') || combined.includes('fpb') || combined.includes('faktor prima') || combined.includes('uang')) {
        score += 25;
      } else if (combined.includes('bilangan')) {
        score += 10;
      }
    }

    if (cleanElem.includes('menyimak') && (combined.includes('simak') || combined.includes('dengar') || combined.includes('aural') || combined.includes('audio'))) score += 25;
    if ((cleanElem.includes('membaca') || cleanElem.includes('memirsa')) && (combined.includes('baca') || combined.includes('memirsa') || combined.includes('teks visual') || combined.includes('kosakata'))) score += 25;
    if ((cleanElem.includes('berbicara') || cleanElem.includes('mempresentasikan')) && (combined.includes('bicara') || combined.includes('presentasi') || combined.includes('lisan') || combined.includes('diskusi'))) score += 25;
    if (cleanElem.includes('menulis') && (combined.includes('tulis') || combined.includes('kalimat') || combined.includes('paragraf') || combined.includes('karangan') || combined.includes('ejaan'))) score += 25;
    if (cleanElem.includes('pemahaman ipas') && !combined.includes('keterampilan proses')) score += 25;
    if (cleanElem.includes('keterampilan proses') && (combined.includes('keterampilan proses') || combined.includes('mengamati') || combined.includes('penyelidikan') || combined.includes('percobaan'))) score += 25;
    return score;
  };

  allItems.forEach(({ item, babTitle, babNo, babCp }) => {
    const itemContent = `${item.materi_pokok || ''} ${item.tp || ''} ${item.atp || ''}`;
    let bestIdx = 0;
    let maxScore = -1;

    buckets.forEach((b, idx) => {
      const sc = scoreItem(b.elemen, itemContent, babCp, babTitle);
      if (sc > maxScore) {
        maxScore = sc;
        bestIdx = idx;
      }
    });

    if (maxScore <= 0) {
      bestIdx = (babNo - 1) % buckets.length;
    }

    const jp = parseJpNum(item.alokasi_waktu);
    buckets[bestIdx].total_jp += jp;
    if (item.materi_pokok) {
      buckets[bestIdx].lingkup_materi.add(item.materi_pokok.trim());
    }

    const cleanKode = item.kode_tp && item.kode_tp.startsWith(`${kelas}.`)
      ? item.kode_tp
      : `${kelas}.${bestIdx + 1}.${buckets[bestIdx].items.length + 1}`;

    buckets[bestIdx].items.push({
      kode_tp: cleanKode,
      tp: item.tp,
      materi_pokok: item.materi_pokok,
      alokasi_waktu: item.alokasi_waktu
    });
  });

  return buckets.map(b => ({
    ...b,
    lingkup_materi: Array.from(b.lingkup_materi)
  }));
}

/**
 * 4b. RENDER TABEL ALUR TUJUAN PEMBELAJARAN (ATP) MODEL REKAPITULASI ELEMEN CP
 */
export function renderAtpElemenTable(data, inputData = {}) {
  const metadata = data.metadata || {};
  const groups = groupAnalysisDataByElementsClient(data);
  const jenjangKelas = metadata.kelas || inputData.jenjangKelas || '5';
  const faseCode = metadata.fase ? metadata.fase.replace(/^Fase\s*/i, '').trim() : 'C';
  const faseStr = `Fase ${faseCode}`;

  let grandTotalJp = 0;
  groups.forEach(g => { grandTotalJp += g.total_jp; });

  let html = `
    ${getKopSuratHtml()}

    <div class="text-center mb-6">
      <h2 class="text-xl font-black uppercase tracking-wide text-slate-950 font-serif">ALUR TUJUAN PEMBELAJARAN</h2>
      <p class="text-xs font-bold text-slate-700 font-serif uppercase tracking-widest mt-0.5">KURIKULUM MERDEKA</p>
    </div>

    <div class="mb-5 max-w-xl">
      <table class="w-full text-xs font-bold font-serif text-slate-900 border-collapse">
        <tr><td class="py-0.5 w-44">SATUAN PENDIDIKAN</td><td>: ${escapeHtml(metadata.satuan_pendidikan || inputData.namaSekolah || '-')}</td></tr>
        <tr><td class="py-0.5">MATA PELAJARAN</td><td>: ${escapeHtml(metadata.mata_pelajaran || inputData.mataPelajaran || '-')}</td></tr>
        <tr><td class="py-0.5">FASE</td><td>: ${escapeHtml(faseCode)}</td></tr>
        <tr><td class="py-0.5">KELAS</td><td>: ${escapeHtml(jenjangKelas)}</td></tr>
        <tr><td class="py-0.5">TAHUN AJARAN</td><td>: ${escapeHtml(metadata.tahun_pembelajaran || inputData.tahunAjaran || '2026/2027')}</td></tr>
      </table>
    </div>

    <p class="text-xs italic text-slate-800 font-serif mb-3">
      Pada akhir ${escapeHtml(faseStr)}, murid memiliki kemampuan sebagai berikut:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full border-collapse border border-slate-900 text-xs font-serif text-slate-900">
        <thead>
          <tr class="bg-slate-100 font-bold text-center">
            <th class="border border-slate-900 p-2 w-[4%]">NO.</th>
            <th class="border border-slate-900 p-2 w-[13%]">ELEMEN</th>
            <th class="border border-slate-900 p-2 w-[27%]">CAPAIAN PEMBELAJARAN</th>
            <th class="border border-slate-900 p-2 w-[15%]">LINGKUP MATERI</th>
            <th class="border border-slate-900 p-2 w-[33%]">TUJUAN PEMBELAJARAN</th>
            <th class="border border-slate-900 p-2 w-[8%]">ALOKASI WAKTU</th>
          </tr>
        </thead>
        <tbody>
  `;

  groups.forEach(group => {
    const isAljabarKelas5 = group.elemen.toLowerCase().includes('aljabar') && (String(jenjangKelas).includes('5'));

    const materiHtml = (group.lingkup_materi && group.lingkup_materi.length > 0)
      ? group.lingkup_materi.map(m => `<div class="mb-1">• ${escapeHtml(m)}</div>`).join('')
      : (isAljabarKelas5 ? '<span class="italic text-slate-500 font-sans">• (Diprogramkan di Kelas 6)</span>' : '-');

    const tpHtml = (group.items && group.items.length > 0)
      ? group.items.map(it => `
          <div class="mb-2 text-justify">
            <strong class="text-slate-950">${escapeHtml(it.kode_tp)}</strong> ${escapeHtml(it.tp)}
          </div>
        `).join('')
      : (isAljabarKelas5
          ? '<div class="italic text-slate-600 font-sans leading-relaxed">Kompetensi Elemen Aljabar Fase C (Rasio & Proporsi) diprogramkan pada pembelajaran Kelas 6 sesuai struktur kurikulum resmi Kemendikbudristek.</div>'
          : '<div>Mencapai tujuan pembelajaran elemen ini.</div>');

    html += `
      <tr class="hover:bg-slate-50/50">
        <td class="border border-slate-900 p-2 text-center align-top font-bold">${group.no}</td>
        <td class="border border-slate-900 p-2.5 align-top font-bold text-slate-900">${escapeHtml(group.elemen)}</td>
        <td class="border border-slate-900 p-2.5 align-top text-justify leading-relaxed">${escapeHtml(group.cp)}</td>
        <td class="border border-slate-900 p-2.5 align-top">${materiHtml}</td>
        <td class="border border-slate-900 p-2.5 align-top">${tpHtml}</td>
        <td class="border border-slate-900 p-2 text-center align-top font-bold text-slate-900">${group.total_jp > 0 ? `${group.total_jp} JP` : '-'}</td>
      </tr>
    `;
  });

  html += `
        <tr class="bg-slate-50 font-bold">
          <td colspan="5" class="border border-slate-900 p-2.5 text-right uppercase tracking-wider">
            TOTAL ALOKASI WAKTU 1 TAHUN AJARAN:
          </td>
          <td class="border border-slate-900 p-2.5 text-center text-sm font-black text-slate-950">
            ${grandTotalJp} JP
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  `;

  const tahunAjaran = metadata.tahun_pembelajaran || inputData?.tahunAjaran || '2026/2027';
  const titimangsa = getKaldikTitimangsa(tahunAjaran, 1);
  html += getPengesahanHtml(inputData, titimangsa);

  return html;
}

/**
 * 4c. HELPER CLIENT: DATA DOKUMEN CAPAIAN PEMBELAJARAN RESMI
 */
export function getOfficialCpDocumentDataClient(mataPelajaran = 'Matematika', jenjangKelas = '5') {
  const mapelLower = (mataPelajaran || '').toLowerCase();
  const kNum = parseInt((String(jenjangKelas).match(/\d+/) || ['5'])[0], 10);
  const fase = kNum <= 2 ? 'Fase A' : kNum <= 4 ? 'Fase B' : 'Fase C';

  if (mapelLower.includes('pancasila') || mapelLower.includes('pkn')) {
    return {
      mata_pelajaran: 'Pendidikan Pancasila',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
      rasional: 'Pendidikan Pancasila merupakan muatan pembelajaran strategis untuk menanamkan nilai-nilai luhur falsafah dasar negara, membina moralitas, konstitusionalisme, semangat kebangsaan, dan kebinekaan global bagi murid. Mata pelajaran ini berorientasi pada pembentukan karakter warga negara yang beriman, bertakwa kepada Tuhan Yang Maha Esa, berakhlak mulia, bergotong royong, mandiri, bernalar kritis, dan berjiwa patriotik.',
      tujuan: [
        'Menginternalisasi dan mengamalkan nilai-nilai Pancasila dalam kehidupan berkeluarga, bermasyarakat, berbangsa, dan bernegara.',
        'Menumbuhkan kesadaran hukum dan kepatuhan terhadap norma, hak, dan kewajiban konstitusional warga negara berdasarkan UUD 1945.',
        'Mengembangkan sikap toleransi, inklusivitas, dan penghargaan terhadap keragaman suku, agama, ras, dan antargolongan dalam bingkai Bhinneka Tunggal Ika.',
        'Memperkokoh komitmen kebangsaan, rasa cinta tanah air, dan partisipasi aktif dalam menjaga keutuhan Negara Kesatuan Republik Indonesia.'
      ],
      karakteristik: 'Pendidikan Pancasila berorientasi pada pengamalan nilai nyata dan pembiasaan keteladanan (habituasi), mengedepankan pendekatan kontekstual dan reflektif melalui 4 (empat) pilar elemen esensial kebangsaan.',
      elemen_deskripsi: [
        { elemen: 'Pancasila', deskripsi: 'Membahas sejarah kelahiran, makna simbol, sila-sila, nilai-nilai dasar, dan pengamalan Pancasila sebagai pandangan hidup bangsa serta dasar negara.' },
        { elemen: 'UUD Negara Republik Indonesia Tahun 1945', deskripsi: 'Membahas norma, aturan hidup bermasyarakat, hak dan kewajiban asasi warga negara, serta musyawarah mufakat dalam kehidupan sehari-hari.' },
        { elemen: 'Bhinneka Tunggal Ika', deskripsi: 'Membahas identitas diri, apresiasi keragaman budaya, kearifan lokal, sikap saling menghargai, dan toleransi sosial.' },
        { elemen: 'Negara Kesatuan Republik Indonesia', deskripsi: 'Membahas wilayah tempat tinggal, sekolah, daerah kabupaten/provinsi, gotong royong, persatuan, dan wujud bela negara.' }
      ],
      capaian_umum: fase === 'Fase A'
        ? 'Pada akhir Fase A, murid mengenal bendera negara, lagu kebangsaan, lambang Garuda Pancasila, simbol dan sila Pancasila di lingkungan keluarga; mengenal dan mematuhi aturan di rumah dan sekolah; menghargai identitas diri dan teman; serta bekerja sama menjaga lingkungan sekitar.'
        : fase === 'Fase B'
          ? 'Pada akhir Fase B, murid memahami makna sila-sila Pancasila dan penerapannya; mengidentifikasi serta melaksanakan aturan, hak, dan kewajiban di sekolah dan masyarakat; membedakan dan menghargai keragaman budaya dan suku; serta bekerja sama menjaga keutuhan lingkungan sekitar.'
          : 'Pada akhir Fase C, murid memahami kronologi sejarah kelahiran Pancasila dan meneladani perumusnya; mengimplementasikan norma, hak, dan kewajiban serta musyawarah mufakat; melestarikan keberagaman budaya nasional; serta menunjukkan perilaku gotong royong menjaga keutuhan NKRI.',
      capaian_elemen: [
        { no: 1, elemen: 'Pancasila', cp: fase === 'Fase A' ? 'Mengenal bendera negara, lagu kebangsaan, simbol dan sila-sila Pancasila dalam lambang negara Garuda Pancasila dan simbol Pancasila beserta sila-sila Pancasila; menerapkan nilai-nilai Pancasila di lingkungan keluarga.' : fase === 'Fase B' ? 'Mengidentifikasi makna sila-sila Pancasila, dan penerapannya dalam kehidupan sehari-hari; mengenal karakter para perumus Pancasila; menunjukkan sikap bangga menjadi anak Indonesia yang memiliki bahasa Indonesia sebagai bahasa persatuan di lingkungan sekitar.' : 'Memahami kronologi sejarah kelahiran Pancasila; meneladani sikap para perumus Pancasila dan menerapkan di lingkungan masyarakat; menghubungkan sila-sila dalam Pancasila sebagai suatu kesatuan yang utuh; menguraikan makna nilai-nilai Pancasila sebagai dasar negara, dan pandangan hidup bangsa.' },
        { no: 2, elemen: 'UUD Negara Republik Indonesia Tahun 1945', cp: fase === 'Fase A' ? 'Mengenal aturan di lingkungan keluarga; menunjukkan dan menceritakan mematuhi aturan di lingkungan keluarga.' : fase === 'Fase B' ? 'Mengidentifikasi dan melaksanakan aturan di sekolah dan lingkungan tempat tinggal; mengidentifikasi dan menerapkan hak yang didapat dan kewajiban sebagai anggota keluarga dan sebagai warga sekolah.' : 'Mengimplementasikan bentuk-bentuk norma, hak, dan kewajiban dalam kedudukannya sebagai warga negara; mengenal Pembukaan UUD 1945; mempraktikkan musyawarah untuk membuat kesepakatan dan aturan bersama.' },
        { no: 3, elemen: 'Bhinneka Tunggal Ika', cp: fase === 'Fase A' ? 'Mengenal semboyan Bhinneka Tunggal Ika; mengidentifikasi dan menghargai identitas dirinya sesuai dengan jenis kelamin, hobi, bahasa, serta agama dan kepercayaan di lingkungan sekitar.' : fase === 'Fase B' ? 'Membedakan dan menghargai identitas, keluarga, dan teman-temannya sesuai budaya, suku bangsa, bahasa, agama dan kepercayaannya di lingkungan sekitar.' : 'Menyajikan hasil identifikasi sikap menghormati, menjaga, dan melestarikan keberagaman budaya sesuai semboyan dalam bingkai Bhinneka Tunggal Ika di lingkungan sekitar.' },
        { no: 4, elemen: 'Negara Kesatuan Republik Indonesia', cp: fase === 'Fase A' ? 'Mengenal karakteristik lingkungan tempat tinggal dan sekolah, sebagai bagian dari wilayah NKRI; menceritakan dan mempraktikkan bekerja sama menjaga lingkungan sekitar dalam keberagaman.' : fase === 'Fase B' ? 'Mengidentifikasi lingkungan tempat tinggal (RT, RW, desa atau kelurahan, dan kecamatan) sebagai bagian dari wilayah NKRI; menunjukkan perilaku bekerja sama dalam berbagai bentuk keberagaman suku bangsa, sosial, dan budaya di Indonesia.' : 'Mengenal wilayahnya dalam konteks kabupaten/kota, dan provinsi sebagai bagian dari wilayah NKRI; menunjukkan perilaku gotong royong untuk menjaga persatuan di lingkungan sekolah dan sekitar sebagai wujud bela negara.' }
      ]
    };
  }

  if (mapelLower.includes('indonesia')) {
    return {
      mata_pelajaran: 'Bahasa Indonesia',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
      rasional: 'Bahasa Indonesia adalah wahana utama untuk mengembangkan kecakapan berpikir kritis, bernalar kreatif, berkomunikasi santun, dan menumbuhkan kecintaan terhadap karya sastra serta identitas kebangsaan. Pembelajaran bahasa membekali murid dengan literasi multi-moda yang relevan untuk mengakses ilmu pengetahuan dan berkontribusi positif di masyarakat.',
      tujuan: [
        'Menumbuhkan kemahiran berbahasa Indonesia lisan dan tulis secara tepat, santun, efektif, dan percaya diri dalam berbagai konteks sosial.',
        'Meningkatkan kemampuan literasi membaca, memirsa, dan bernalar analitis terhadap berbagai teks informatif dan sastra.',
        'Mengembangkan keterampilan menulis secara kreatif, terstruktur, dan mematuhi kaidah kebahasaan yang baik.',
        'Menghargai dan membudayakan karya sastra Indonesia sebagai warisan luhur nilai estetika dan kemanusiaan.'
      ],
      karakteristik: 'Pembelajaran Bahasa Indonesia berbasis teks multimodal yang integratif, mencakup 4 (empat) elemen reseptif dan produktif yang berkesinambungan.',
      elemen_deskripsi: [
        { elemen: 'Menyimak', deskripsi: 'Kemampuan memahami, memaknai, menginterpretasi, dan menganalisis informasi dan pesan dari teks aural (teks lisan yang dibacakan/didengarkan).' },
        { elemen: 'Membaca dan Memirsa', deskripsi: 'Kemampuan melafalkan, memahami kosa kata baru, menemukan ide pokok dan pendukung, serta menganalisis teks tertulis dan visual multimodal.' },
        { elemen: 'Berbicara dan Mempresentasikan', deskripsi: 'Kemampuan menyampaikan gagasan, pendapat, perasaan, dan tanggapan secara lisan dengan artikulasi, intonasi, dan gestur santun.' },
        { elemen: 'Menulis', deskripsi: 'Kemampuan mengekspresikan gagasan, fakta, dan imajinasi ke dalam bentuk teks tulis dengan ejaan, tanda baca, dan struktur kalimat yang tepat.' }
      ],
      capaian_umum: fase === 'Fase A'
        ? 'Pada akhir Fase A, murid memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar; memahami instruksi dan teks aural sederhana; membaca kata-kata sederhana dengan fasih; merespons pembicaraan secara santun; serta menulis permulaan dengan tulisan yang rapi dan benar.'
        : fase === 'Fase B'
          ? 'Pada akhir Fase B, murid memiliki kemampuan berbahasa untuk memahami ide pokok teks aural dan visual multimodal; menyajikan pendapat dengan intonasi dan pilihan kata santun; serta menulis teks narasi dan deskripsi sederhana dengan kosakata beragam dan ejaan yang tepat.'
          : 'Pada akhir Fase C, murid memiliki kemampuan berbahasa untuk menganalisis teks sastra dan nonsastra aural/visual; mempresentasikan ide secara efektif; serta menulis berbagai jenis teks narasi, eksposisi, dan kreatif dengan kalimat kompleks dan kosakata konotatif/denotatif.',
      capaian_elemen: [
        { no: 1, elemen: 'Menyimak', cp: fase === 'Fase A' ? 'Memahami informasi dari teks nonsastra berbentuk teks aural (teks yang dibacakan dan/atau didengarkan) berupa percakapan; dan memahami pesan teks sastra berbentuk teks aural.' : fase === 'Fase B' ? 'Memahami ide pokok suatu informasi dari teks nonsastra berbentuk teks aural (teks yang dibacakan dan/atau didengarkan); dan memahami isi teks sastra berbentuk teks aural.' : 'Menganalisis informasi dari teks nonsastra berbentuk teks aural (teks yang dibacakan dan/atau didengarkan); dan menganalisis isi teks sastra berbentuk teks aural.' },
        { no: 2, elemen: 'Membaca dan Memirsa', cp: fase === 'Fase A' ? 'Membaca kata-kata sederhana dengan fasih dari bacaan/tayangan yang dipirsa; dan memahami isi bacaan/tayangan tentang diri, keluarga, dan lingkungan sekitar.' : fase === 'Fase B' ? 'Membaca kata-kata baru dengan fasih; dan memahami ide pokok, ide pendukung, pesan, dan informasi dalam teks sastra dan nonsastra cetak/elektronik.' : 'Membaca kata-kata dengan berbagai pola kombinasi huruf dengan fasih; dan menganalisis informasi serta nilai-nilai dalam teks sastra dan nonsastra berwujud visual/audiovisual.' },
        { no: 3, elemen: 'Berbicara dan Mempresentasikan', cp: fase === 'Fase A' ? 'Merespons dengan bertanya, menjawab, dan menanggapi komentar orang lain dengan santun; mengungkapkan perasaan secara lisan dengan atau tanpa bantuan gambar; dan menceritakan kembali isi teks.' : fase === 'Fase B' ? 'Menyajikan pendapat dengan pilihan kata dan sikap tubuh/gestur yang sesuai, menggunakan volume dan intonasi tepat sesuai konteks; menanggapi diskusi sesuai tata cara.' : 'Mempresentasikan gagasan dari berbagai tipe teks dengan efektif dan santun; dan menyampaikan perasaan berdasarkan fakta/imajinasi secara indah dan menarik dalam bentuk teks sastra.' },
        { no: 4, elemen: 'Menulis', cp: fase === 'Fase A' ? 'Menulis permulaan dengan benar di atas kertas/media digital; mengembangkan tulisan tangan yang semakin baik; dan menulis kalimat sederhana.' : fase === 'Fase B' ? 'Menulis berbagai tipe teks sederhana dengan rangkaian kalimat beragam; dan menggunakan kaidah kebahasaan dan kosakata baru ber-makna denotatif sesuai konteks.' : 'Menulis berbagai tipe teks sederhana berdasarkan gagasan, hasil pengamatan, pengalaman, dan/atau imajinasi dengan kalimat kompleks secara kreatif; serta menggunakan kaidah kebahasaan yang benar.' }
      ]
    };
  }

  if (mapelLower.includes('ipas') || mapelLower.includes('ilmu pengetahuan alam') || mapelLower.includes('sains')) {
    return {
      mata_pelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      fase: fase === 'Fase A' ? 'Fase B' : fase,
      kelas: jenjangKelas,
      regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
      rasional: 'IPAS merupakan integrasi holistik antara sains kealaman dan ilmu sosial yang dirancang untuk merawat rasa ingin tahu alami murid tentang dirinya, lingkungan fisik, ekosistem, sejarah peradaban, serta interaksi sosial-ekonomi. Pembelajaran IPAS melatih murid menjadi penyelidik cilik yang berwawasan ilmiah, peka terhadap kelestarian lingkungan, dan bangga akan warisan budaya nusantara.',
      tujuan: [
        'Menumbuhkan rasa ingin tahu, kecintaan terhadap alam, dan kepedulian sosial terhadap dinamika lingkungan tempat tinggal.',
        'Memahami konsep esensial kealaman dan kemasyarakatan serta interaksi dinamis antara manusia dan ekosistem.',
        'Mengembangkan keterampilan proses sains (inkuiri ilmiah): mengamati, memprediksi, merencanakan penyelidikan, menganalisis data, dan mengomunikasikan temuan.',
        'Menumbuhkan kesadaran mitigasi bencana, pelestarian sumber daya alam, kearifan lokal, dan tanggung jawab sosial.'
      ],
      karakteristik: 'Pembelajaran IPAS menggabungkan dua elemen yang saling menopang: pemahaman konsep esensial dan keterampilan proses berbasis penyelidikan langsung (hands-on inquiry).',
      elemen_deskripsi: [
        { elemen: 'Pemahaman IPAS', deskripsi: 'Mencakup pemahaman konsep tentang anatomi dan kesehatan organ tubuh, ekosistem, energi, gelombang bunyi/cahaya, sistem tata surya, letak geografis, sejarah pahlawan, keanekaragaman budaya, dan kegiatan ekonomi.' },
        { elemen: 'Keterampilan Proses', deskripsi: 'Mencakup kemampuan penyelidikan ilmiah yang meliputi: Mengamati; Mempertanyakan dan Memprediksi; Merencanakan dan Melakukan Penyelidikan; Memproses, Menganalisis Data dan Informasi; Mengevaluasi dan Refleksi; serta Mengomunikasikan Hasil.' }
      ],
      capaian_umum: fase === 'Fase B'
        ? 'Pada akhir Fase B, murid mampu menjelaskan bentuk dan fungsi pancaindra, menganalisis siklus hidup makhluk hidup, wujud zat, energi, gaya; mengenali letak kabupaten/provinsi dengan peta; mengidentifikasi sejarah dan keragaman budaya lokal; menjelaskan pengelolaan keuangan secara bijak; serta menerapkan keterampilan proses inkuiri sains terpadu.'
        : 'Pada akhir Fase C, murid merefleksikan sistem organ tubuh dan masa pubertas, hubungan ekosistem, gelombang bunyi dan cahaya, sistem tata surya, siklus air dan penghematan energi; menjelaskan letak geografis Indonesia; meninjau sejarah perjuangan pahlawan; memahami kearifan lokal dan ekonomi masyarakat; serta melakukan penyelidikan sains mandiri yang sistematis.',
      capaian_elemen: [
        { no: 1, elemen: 'Pemahaman IPAS', cp: fase === 'Fase B' ? 'Menjelaskan bentuk dan fungsi pancaindra; menganalisis siklus hidup makhluk hidup dan pelestariannya; menghasilkan solusi pelestarian SDA; menyimpulkan proses perubahan wujud zat; menjelaskan sumber/bentuk energi dan gaya; mengenali letak kabupaten/provinsi dengan peta; mengklasifikasikan bentang alam dan kearifan lokal; serta menjelaskan nilai mata uang dan keuangan bijak.' : 'Merefleksikan sistem organ tubuh manusia dan pubertas; menganalisis hubungan antar komponen ekosistem; menjelaskan fenomena gelombang bunyi dan cahaya; menghasilkan upaya penghematan energi dan siklus air; menjelaskan sistem tata surya; menjelaskan letak geografis Indonesia dengan peta; meninjau sejarah pahlawan dan keragaman budaya; serta menerapkan kegiatan ekonomi masyarakat.' },
        { no: 2, elemen: 'Keterampilan Proses', cp: 'Mampu menerapkan keterampilan proses sains yang meliputi: 1) Mengamati fenomena secara cermat; 2) Mempertanyakan dan memprediksi secara mandiri; 3) Merencanakan dan melakukan penyelidikan terpadu; 4) Memproses, menganalisis data, dan menemukan pola informasi; 5) Mengevaluasi dan refleksi hasil observasi; serta 6) Mengomunikasikan kesimpulan ilmiah secara lisan maupun tertulis.' }
      ]
    };
  }

  if (mapelLower.includes('seni rupa') || mapelLower.includes('rupa')) {
    return {
      mata_pelajaran: 'Seni Rupa',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
      rasional: 'Seni Rupa merupakan wadah pengembangan sensibilitas visual, imajinasi kreatif, keterampilan motorik halus, serta apresiasi nilai keindahan karya seni dan alam sekitar untuk memperkaya kesejahteraan emosional murid.',
      tujuan: [
        'Mengembangkan kepekaan mengamati unsur-unsur rupa dan prinsip estetika di lingkungan sekitar.',
        'Mengekspresikan ide, perasaan, dan imajinasi melalui ragam media dan teknik seni rupa.',
        'Mengapresiasi karya seni diri sendiri dan teman dengan sikap saling menghargai.',
        'Menghasilkan karya seni yang mencerminkan rasa syukur dan kepedulian terhadap lingkungan.'
      ],
      karakteristik: 'Pembelajaran Seni Rupa berpusat pada eksplorasi bahan, visual thinking, dan siklus kreasi artistik yang mencakup 5 (lima) elemen utama.',
      elemen_deskripsi: [
        { elemen: 'Mengalami (Experiencing)', deskripsi: 'Mengamati, mengidentifikasi, dan merasakan unsur rupa (garis, bidang, warna, tekstur) pada objek visual dan karya seni di sekitar.' },
        { elemen: 'Merefleksikan (Reflecting)', deskripsi: 'Menghargai, menilai, dan mengevaluasi karya seni rupa diri dan teman menggunakan kosakata seni yang sesuai.' },
        { elemen: 'Berpikir dan Bekerja Artistik', deskripsi: 'Mengenali dan menguji coba variasi alat, bahan, dan teknik berkarya seni secara mandiri, aman, dan kreatif.' },
        { elemen: 'Menciptakan (Making/Creating)', deskripsi: 'Membuat karya seni rupa dua atau tiga dimensi berdasarkan pengalaman nyata, pengamatan lingkungan, dan imajinasi kreatif.' },
        { elemen: 'Berdampak (Impacting)', deskripsi: 'Menghasilkan karya seni yang memberikan kepuasan batin bagi murid dan menyampaikan pesan positif bagi orang lain/lingkungan.' }
      ],
      capaian_umum: fase === 'Fase A'
        ? 'Pada akhir Fase A, murid mampu mengenali unsur rupa di lingkungan sekitar, mengapresiasi karyanya, mencoba ragam alat dan bahan gambar, serta membuat karya 2D/3D sederhana secara kreatif.'
        : fase === 'Fase B'
          ? 'Pada akhir Fase B, murid mampu mengidentifikasi unsur rupa dan prinsip desain di lingkungan sekitar, merefleksikan karya dengan kosakata seni, menguji coba variasi bahan, dan menciptakan karya rupa kreatif yang berdampak positif.'
          : 'Pada akhir Fase C, murid mampu menjelaskan unsur rupa dan prinsip desain (keseimbangan, proporsi, ritme) dalam karya seni rupa secara analitis, bereksperimen dengan teknik rupa tingkat lanjut, serta menciptakan karya yang berdampak sosial/ekologis.',
      capaian_elemen: [
        { no: 1, elemen: 'Mengalami (Experiencing)', cp: fase === 'Fase A' ? 'Mengenali dan menyebutkan unsur-unsur rupa (garis, bentuk, warna) dalam benda-benda di sekitar dan karya seni rupa.' : fase === 'Fase B' ? 'Mengidentifikasi unsur rupa dan prinsip desain (ritme, pola berulang) dalam benda-benda di sekitar atau karya seni rupa.' : 'Menjelaskan unsur rupa dan prinsip desain (keseimbangan, proporsi, ritme, kontras) dalam benda-benda di sekitar dan karya seni rupa.' },
        { no: 2, elemen: 'Merefleksikan (Reflecting)', cp: fase === 'Fase A' ? 'Merefleksikan dan mengapresiasi karya diri sendiri dengan kata-kata sederhana.' : fase === 'Fase B' ? 'Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas menggunakan kosakata seni rupa yang sesuai.' : 'Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas menggunakan kosakata seni rupa yang sesuai dan objektif.' },
        { no: 3, elemen: 'Berpikir dan Bekerja Artistik', cp: fase === 'Fase A' ? 'Mengenali, menguji coba, dan menggunakan alat serta bahan rupa secara aman.' : fase === 'Fase B' ? 'Mengenali, menguji coba, dan menerapkan variasi alat, media, dan teknik berkarya seni rupa.' : 'Mengenali dan menguji coba variasi teknik penggunaan alat, bahan, dan media seni rupa tingkat lanjut.' },
        { no: 4, elemen: 'Menciptakan (Making/Creating)', cp: fase === 'Fase A' ? 'Membuat karya seni rupa dua dimensi dan tiga dimensi berdasarkan pengalaman dan hasil pengamatan lingkungan.' : fase === 'Fase B' ? 'Membuat karya seni rupa 2D dan 3D berdasarkan pengalaman dan pengamatan terhadap lingkungan sekitar.' : 'Membuat karya seni rupa berdasarkan pengalaman nyata, pengamatan lingkungan, dan pengembangan imajinasi kreatif.' },
        { no: 5, elemen: 'Berdampak (Impacting)', cp: fase === 'Fase A' ? 'Menghasilkan karya seni rupa yang berdampak positif pada perasaan dirinya.' : fase === 'Fase B' ? 'Menghasilkan karya seni rupa yang berdampak pada perasaan atau mewakili harapannya.' : 'Menghasilkan karya seni rupa yang mewakili minat pribadi serta memberikan dampak positif bagi lingkungan sekitar.' }
      ]
    };
  }

  if (mapelLower.includes('koding') || mapelLower.includes('kecerdasan artifisial') || mapelLower.includes('ai')) {
    return {
      mata_pelajaran: 'Koding dan Kecerdasan Artifisial',
      fase: 'Fase C',
      kelas: jenjangKelas,
      regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
      rasional: 'Koding dan Kecerdasan Artifisial (KA) membekali generasi muda dengan kompetensi berpikir komputasional, pemecahan masalah algoritmis, literasi kecerdasan artifisial, dan kesadaran etika digital di era revolusi industri 4.0 dan Society 5.0.',
      tujuan: [
        'Mengembangkan pola pikir komputasional (dekomposisi, pengenalan pola, abstraksi, dan algoritma) dalam menyelesaikan masalah.',
        'Memahami konsep dasar sistem komputasi, perangkat digital, dan pemanfaatan internet secara aman dan bertanggung jawab.',
        'Memahami prinsip kerja dan pemanfaatan teknologi Kecerdasan Artifisial (KA) untuk kesejahteraan manusia.',
        'Menumbuhkan etika digital, empati, perlindungan data pribadi, dan integritas berkarya di ruang siber.'
      ],
      karakteristik: 'Pembelajaran disajikan dengan metode unplugged (tanpa gawai) dan plugged (berbantuan aplikasi visual koding) yang berfokus pada logika dan nalar kritis.',
      elemen_deskripsi: [
        { elemen: 'Berpikir Komputasional', deskripsi: 'Penerapan pemecahan masalah secara terstruktur melalui dekomposisi persoalan, pengenalan pola, abstraksi, dan penulisan algoritma logis.' },
        { elemen: 'Literasi Digital', deskripsi: 'Pemahaman sistem digital, pemanfaatan internet sehat, keamanan informasi pribadi, dan etika komunikasi siber.' },
        { elemen: 'Literasi dan Etika Kecerdasan Artifisial', deskripsi: 'Pemahaman konsep KA, perbedaan kecerdasan manusia dan mesin, etika pemanfaatan KA, dan dampak sosialnya.' },
        { elemen: 'Pemanfaatan dan Pengembangan Kecerdasan Artifisial', deskripsi: 'Simulasi cara kerja KA dalam mengenali pola data konkret, klasifikasi objek, dan evaluasi hasil prediksi cerdas.' }
      ],
      capaian_umum: 'Pada akhir Fase C, murid mampu merumuskan langkah pemecahan masalah secara logis terstruktur; mengoperasikan aplikasi digital dan mengamankan data pribadi; memahami etika dasar pemanfaatan AI; serta menyimulasikan cara kerja model AI sederhana dalam mengenali pola data kehidupan nyata.',
      capaian_elemen: [
        { no: 1, elemen: 'Berpikir Komputasional', cp: 'Menerapkan pemecahan masalah secara terstruktur melalui dekomposisi persoalan nyata, pengenalan pola, abstraksi informasi esensial, dan perumusan algoritma langkah demi langkah secara runtut baik secara unplugged maupun plugged.' },
        { no: 2, elemen: 'Literasi Digital', cp: 'Mengoperasikan perangkat keras dan lunak digital secara aman, mempraktikkan etika komunikasi siber, menjaga privasi data pribadi, dan menyaring informasi di dunia maya secara kritis.' },
        { no: 3, elemen: 'Literasi dan Etika Kecerdasan Artifisial', cp: 'Memahami konsep dasar kecerdasan artifisial, membedakan proses belajar manusia dengan model komputasi cerdas, serta menerapkan etika pemanfaatan AI yang jujur dan bertanggung jawab.' },
        { no: 4, elemen: 'Pemanfaatan dan Pengembangan Kecerdasan Artifisial', cp: 'Mengeksplorasi penggunaan aplikasi cerdas untuk mengenali pola suara/gambar, menyimulasikan klasifikasi data visual, serta mengevaluasi keluaran prediksi AI secara mandiri.' }
      ]
    };
  }

  if (mapelLower.includes('jasmani') || mapelLower.includes('pjok') || mapelLower.includes('olahraga')) {
    return {
      mata_pelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
      rasional: 'PJOK merupakan sarana esensial untuk membentuk kebiasaan beraktivitas jasmani secara teratur, meningkatkan kebugaran jasmani, menumbuhkan sportivitas, serta mengembangkan pemahaman komprehensif tentang pola hidup bersih dan sehat sepanjang hayat.',
      tujuan: [
        'Mengembangkan keterampilan gerak dasar fundamental hingga variasi dan kombinasi gerak terstruktur.',
        'Meningkatkan derajat kebugaran jasmani dan ketahanan motorik murid.',
        'Menanamkan nilai sportivitas, disiplin, kerja sama, respek, dan fair play.',
        'Membiasakan pola hidup sehat, konsumsi gizi seimbang, dan keselamatan diri.'
      ],
      karakteristik: 'Pembelajaran PJOK memadukan aktivitas fisik langsung, permainan edukatif, dan literasi kesehatan melalui 4 (empat) elemen kompetensi.',
      elemen_deskripsi: [
        { elemen: 'Keterampilan Gerak', deskripsi: 'Penguasaan gerak lokomotor, nonlokomotor, manipulatif, senam, gerak berirama, dan aktivitas air.' },
        { elemen: 'Pengetahuan Gerak', deskripsi: 'Pemahaman konsep, prinsip, dan mekanika gerak untuk efisiensi dan keamanan aktivitas jasmani.' },
        { elemen: 'Pemanfaatan Gerak', deskripsi: 'Penerapan aktivitas fisik untuk memelihara kebugaran jasmani, postur tubuh, dan pola hidup sehat.' },
        { elemen: 'Pengembangan Karakter dan Nilai-nilai Gerak', deskripsi: 'Internalisasi nilai tanggung jawab personal dan sosial, kepemimpinan, dan etika berolahraga.' }
      ],
      capaian_umum: fase === 'Fase A'
        ? 'Pada akhir Fase A, murid mempraktikkan gerak fundamental dalam situasi bermain, mematuhi aturan sederhana, memilih makanan bergizi, dan mengenali situasi aman untuk beraktivitas.'
        : fase === 'Fase B'
          ? 'Pada akhir Fase B, murid memperhalus variasi dan kombinasi gerak dasar, menyesuaikan strategi gerak permainan, berpartisipasi aktif dalam tim, serta mempraktikkan P3K sederhana.'
          : 'Pada akhir Fase C, murid menguasai pola gerak kompleks, memodifikasi aturan untuk permainan fair play, mengaitkan aktivitas jasmani dengan pencegahan penyakit sedenter, serta mengelola kebugaran diri.',
      capaian_elemen: [
        { no: 1, elemen: 'Keterampilan Gerak', cp: fase === 'Fase A' ? 'Mempraktikkan gerak fundamental lokomotor, nonlokomotor, dan manipulatif dalam situasi bermain teratur.' : fase === 'Fase B' ? 'Mempraktikkan variasi dan kombinasi pola gerak dasar secara lancar dalam permainan beregu dan aktivitas kebugaran.' : 'Mempraktikkan modifikasi pola gerak dasar kompleks dalam permainan bola besar, bola kecil, atletik, dan senam lantai.' },
        { no: 2, elemen: 'Pengetahuan Gerak', cp: fase === 'Fase A' ? 'Memahami prosedur melakukan gerak fundamental dalam permainan sederhana.' : fase === 'Fase B' ? 'Memahami konsep variasi dan kombinasi pola gerak dasar serta strategi gerak sederhana.' : 'Menganalisis prinsip dan mekanika gerak untuk meningkatkan efektivitas gerak dalam berbagai cabang olahraga.' },
        { no: 3, elemen: 'Pemanfaatan Gerak', cp: fase === 'Fase A' ? 'Membiasakan aktivitas fisik harian dan mengenal makanan bergizi seimbang.' : fase === 'Fase B' ? 'Memantau kebugaran jasmani pribadi dan mempraktikkan pertolongan pertama pada cedera ringan.' : 'Mengukur kebugaran jasmani mandiri dan mengaitkannya dengan pencegahan penyakit perilaku sedenter.' },
        { no: 4, elemen: 'Pengembangan Karakter dan Nilai-nilai Gerak', cp: fase === 'Fase A' ? 'Menunjukkan perilaku patuh aturan, kerja sama, dan percaya diri saat beraktivitas jasmani.' : fase === 'Fase B' ? 'Menunjukkan sportivitas, menerima kemenangan dan kekalahan, serta menghargai teman dalam aktivitas tim.' : 'Menunjukkan kepemimpinan, integritas etika fair play, dan tanggung jawab sosial dalam aktivitas jasmani beregu.' }
      ]
    };
  }

  if (mapelLower.includes('inggris')) {
    return {
      mata_pelajaran: 'Bahasa Inggris',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
      rasional: 'Bahasa Inggris di sekolah dasar membekali murid dengan rasa percaya diri, keterampilan interaksi verbal dasar, dan wawasan antarbudaya dalam bahasa komunikasi global melalui aktivitas yang menyenangkan, kontekstual, dan bermakna.',
      tujuan: [
        'Menumbuhkan minat dan keberanian berkomunikasi dalam Bahasa Inggris pada ranah kehidupan sehari-hari.',
        'Mengembangkan kecakapan reseptif (menyimak, membaca) dan produktif (berbicara, menulis) secara terpadu.',
        'Membangun pemahaman kosakata dasar dan struktur kalimat fungsional sederhana.'
      ],
      karakteristik: 'Pembelajaran Bahasa Inggris di SD berpusat pada pemerolehan bahasa secara alami melalui lagu, cerita, permainan, dan media visual interaktif.',
      elemen_deskripsi: [
        { elemen: 'Menyimak – Berbicara (Listening – Speaking)', deskripsi: 'Kemampuan memahami tuturan lisan guru/rekan dan merespons secara verbal/non-verbal dalam percakapan sehari-hari.' },
        { elemen: 'Membaca – Memirsa (Reading – Viewing)', deskripsi: 'Kemampuan membaca dan memahami teks tertulis bergambar atau visual multimodal pendek.' },
        { elemen: 'Menulis – Mempresentasikan (Writing – Presenting)', deskripsi: 'Kemampuan menulis kata atau kalimat pendek terpandu dan menyampaikan ide secara lisan.' }
      ],
      capaian_umum: fase === 'Fase B'
        ? 'Pada akhir Fase B, murid dapat memahami dan merespons teks lisan sederhana tentang diri dan lingkungan, membaca teks bergambar pendek, serta menulis kalimat sederhana sesuai konteks.'
        : 'Pada akhir Fase C, murid dapat memahami alur informasi teks lisan secara runtut, merespons percakapan topik sehari-hari dengan kalimat sederhana yang percaya diri, membaca beragam teks pendek, serta menuliskan ide dan pengalamannya secara mandiri.',
      capaian_elemen: [
        { no: 1, elemen: 'Menyimak – Berbicara (Listening – Speaking)', cp: fase === 'Fase B' ? 'Memahami dan merespons teks lisan atau teks multimodal sederhana tentang kehidupan sehari-hari secara verbal atau non-verbal sesuai konteks.' : 'Memahami alur informasi teks secara keseluruhan dan merespons teks lisan topik sehari-hari secara lisan dengan kalimat pendek dan runtut.' },
        { no: 2, elemen: 'Membaca – Memirsa (Reading – Viewing)', cp: fase === 'Fase B' ? 'Memahami teks tulis pendek sederhana atau teks multimodal tentang kehidupan sehari-hari dan meresponsnya sesuai konteks.' : 'Memahami alur ide pokok dan informasi rinci dari beragam teks pendek bergambar dan meresponsnya secara tertulis/lisan.' },
        { no: 3, elemen: 'Menulis – Mempresentasikan (Writing – Presenting)', cp: fase === 'Fase B' ? 'Mengomunikasikan gagasan tentang topik sehari-hari dalam teks tulis pendek atau teks visual sederhana.' : 'Mengomunikasikan ide dan pengalamannya melalui berbagai jenis teks tulis sederhana dan mempresentasikannya dengan percaya diri.' }
      ]
    };
  }

  if (mapelLower.includes('agama') || mapelLower.includes('paibp') || mapelLower.includes('pai') || mapelLower.includes('islam')) {
    return {
      mata_pelajaran: 'Pendidikan Agama dan Budi Pekerti',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Keputusan Dirjen Pendidikan Islam / Kepka BKPDM No. 020 Tahun 2026',
      rasional: 'Pendidikan Agama dan Budi Pekerti membimbing murid memperkokoh keimanan dan ketakwaan kepada Allah Swt., berakhlak mulia (akhlakul karimah) kepada sesama dan alam ciptaan, serta menumbuhkan sikap moderasi beragama dalam kebinekaan bangsa.',
      tujuan: [
        'Membaca, menulis, menghafal, dan memahami pesan pokok Al-Qur\'an dan hadis Nabi saw.',
        'Meyakini rukun iman dan meneladani sifat-sifat mulia Allah Swt. dan para rasul.',
        'Membiasakan akhlak terpuji terhadap Allah Swt., diri sendiri, sesama manusia, dan alam semesta.',
        'Memahami dan mempraktikkan tata cara ibadah fardu dan sunah secara tertib dan benar.'
      ],
      karakteristik: 'Pembelajaran agama mengintegrasikan pemahaman teologis, pembiasaan ibadah praktis, dan keteladanan moral melalui 5 (lima) elemen pokok keagamaan.',
      elemen_deskripsi: [
        { elemen: 'Al-Qur’an Hadis', deskripsi: 'Kemampuan membaca ayat-ayat Al-Qur\'an dan hadis dengan tajwid yang baik, menulis, menghafal, serta memahami kandungan maknanya.' },
        { elemen: 'Akidah', deskripsi: 'Pemahaman dan keyakinan teguh terhadap rukun iman, asmaulhusna, dan dimensi keimanan islam.' },
        { elemen: 'Akhlak', deskripsi: 'Penerapan adab dan akhlakul karimah kepada Allah, sesama manusia, orang tua, guru, dan pelestarian lingkungan.' },
        { elemen: 'Fikih', deskripsi: 'Ketentuan hukum ibadah: bersuci (thaharah), salat fardu/sunah, puasa, zakat, infak, dan sedekah.' },
        { elemen: 'Sejarah Peradaban Islam', deskripsi: 'Kisah keteladanan para nabi, rasul, sahabat, dan khulafaurasyidin sebagai inspirasi hidup.' }
      ],
      capaian_umum: fase === 'Fase A'
        ? 'Pada akhir Fase A, murid mengenal huruf hijaiah bersambung, menghafal surah pendek, meyakini rukun iman, membiasakan akhlak mulia, mempraktikkan tata cara bersuci dan salat fardu, serta meneladani kisah nabi.'
        : fase === 'Fase B'
          ? 'Pada akhir Fase B, murid fasih membaca Al-Qur\'an dan hadis tentang silaturahmi, meyakini kitab suci dan rasul, menerapkan akhlak terpuji kepada orang tua dan guru, melaksanakan salat jumat/sunah, serta memahami masa kerasulan Nabi di Makkah.'
          : 'Pada akhir Fase C, murid memahami surah pilihan, meyakini hari akhir dan qada/qadar, mengamalkan akhlak terpuji dan toleransi, mempraktikkan puasa, zakat, dan sedekah, serta menjelaskan dakwah Nabi periode Madinah dan khulafaurasyidin.',
      capaian_elemen: [
        { no: 1, elemen: 'Al-Qur’an Hadis', cp: fase === 'Fase A' ? 'Membaca dan membedakan huruf hijaiah berharakat, huruf hijaiah bersambung; menghafal Surah al-Fatihah dan surah-surah pendek pilihan.' : fase === 'Fase B' ? 'Membaca, menulis, menghafal, dan menjelaskan beberapa surah pendek serta hadis tentang kewajiban salat dan silaturahmi.' : 'Membaca Al-Qur’an dengan tartil, menulis ayat pilihan, dan menjelaskan kandungan surah-surah pendek tentang tolong-menolong dan keadilan.' },
        { no: 2, elemen: 'Akidah', cp: fase === 'Fase A' ? 'Menjelaskan dan meyakini rukun iman, iman kepada Allah Swt., beberapa asmaulhusna, dan iman kepada malaikat.' : fase === 'Fase B' ? 'Menjelaskan dan meyakini sifat-sifat Allah Swt., iman kepada kitab-kitab suci Allah Swt., dan iman kepada rasul-rasul Allah Swt.' : 'Menjelaskan dan meyakini asmaulhusna pilihan, iman kepada hari akhir, serta iman kepada qada dan qadar.' },
        { no: 3, elemen: 'Akhlak', cp: fase === 'Fase A' ? 'Membiasakan akhlak mulia terhadap Allah Swt., diri sendiri, orang tua, dan teman di lingkungan sekolah.' : fase === 'Fase B' ? 'Menerapkan akhlak terpuji kepada orang tua, keluarga, guru, serta menjaga kerukunan antar sesama.' : 'Menerapkan akhlak terpuji kepada Allah Swt., bertawakal, toleran dalam perbedaan, dan menjaga kelestarian lingkungan.' },
        { no: 4, elemen: 'Fikih', cp: fase === 'Fase A' ? 'Menerapkan rukun Islam, syahadatain, tata cara bersuci (wudu), dan salat fardu lima waktu.' : fase === 'Fase B' ? 'Menerapkan tata cara salat jumat, salat sunah berjemaah, dan memahami tanda-tanda usia balig.' : 'Menerapkan ketentuan puasa wajib dan sunah, zakat, infak, sedekah, serta makanan dan minuman yang halal dan berkah.' },
        { no: 5, elemen: 'Sejarah Peradaban Islam', cp: fase === 'Fase A' ? 'Menceritakan kisah keteladanan Nabi Adam a.s., Nabi Nuh a.s., dan Nabi Ibrahim a.s.' : fase === 'Fase B' ? 'Menceritakan dan meneladani kisah perjuangan Nabi Muhammad saw. periode awal dakwah di Makkah.' : 'Menceritakan peristiwa hijrah Nabi Muhammad saw. ke Madinah serta keteladanan Khulafaur Rasyidin.' }
      ]
    };
  }

  if (mapelLower.includes('sunda')) {
    return {
      mata_pelajaran: 'Bahasa Sunda (Mulok)',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Peraturan Gubernur Jawa Barat / Kurikulum Muatan Lokal',
      rasional: 'Pangajaran Basa jeung Sastra Sunda miboga fungsi pikeun ngaraksa, ngariksa, tur ngamumulé ajén-inajén budaya luhur Sunda, ngaronjatkeun kamampuh komunikasi santun maké tatakrama basa, sarta ngajembaran wawasan kearifan lokal urang Sunda.',
      tujuan: [
        'Mampuh komunikasi dina basa Sunda kalawan bener, merenah, tur sopan luyu jeung undak-usuk basa.',
        'Mikareueus jeung mikanyaah kana basa, sastra, jeung aksara Sunda minangka warisan budaya karuhun.',
        'Ngagali ajén kearifan lokal tina dongéng, pupuh, jeung kasenian Sunda pikeun ngawangun karakter murid nu nyunda.'
      ],
      karakteristik: 'Pangajaran basa Sunda museur kana kaparigelan ngagunakeun basa dina kahirupan sapopoé ngaliwatan 4 (opat) aspék kaparigelan basa.',
      elemen_deskripsi: [
        { elemen: 'Ngaregepkeun', deskripsi: 'Kaparigelan mikaharti jeung nyurahan eusi omongan, dongéng, guguritan, atawa warta anu kadéngé.' },
        { elemen: 'Maca jeung Miarsa', deskripsi: 'Kaparigelan maca téks kalayan lafal jeung lentong anu merenah sarta mikaharti pesenna.' },
        { elemen: 'Nyarita jeung Midangkeun', deskripsi: 'Kaparigelan ngedalkeun pamikiran jeung rasa sacara lisan maké tatakrama basa (loma jeung lemes).' },
        { elemen: 'Nulis', deskripsi: 'Kaparigelan nuliskeun kecap, kalimah, jeung karangan dina aksara Latén atawa aksara Sunda kalawan bener.' }
      ],
      capaian_umum: fase === 'Fase A'
        ? 'Dina ahir Fase A, murid mampuh ngaregepkeun jeung ngaréspons caritaan basajan ngeunaan diri jeung kulawarga, maca kecap basajan kalawan lancar, sarta nuliskeun aksara jeung kecap kalawan rapih.'
        : fase === 'Fase B'
          ? 'Dina ahir Fase B, murid mampuh nyurahan eusi dongéng jeung carita, cumarita ngagunakeun tatakrama basa Sunda anu luyu, sarta nyusun karangan dheskripsi pondok dumasar pangalaman pribadi.'
          : 'Dina ahir Fase C, murid mampuh nganalisis téks aural basa Sunda (warta, pupuh), nepikeun biantara atawa pamadegan kalayan tartib tur sopan, sarta nulis rupa-rupa karangan narasi atawa éksposisi kalayan merenah.',
      capaian_elemen: [
        { no: 1, elemen: 'Ngaregepkeun', cp: 'Kaparigelan mikaharti jeung nyurahan eusi dongeng, pupuh, guguritan, atawa pedaran basa Sunda kalawan saregep.' },
        { no: 2, elemen: 'Maca jeung Miarsa', cp: 'Kaparigelan maca rupa-rupa wacana basa Sunda kalawan lentong, intonasi, jeung artikulasi anu merenah.' },
        { no: 3, elemen: 'Nyarita jeung Midangkeun', cp: 'Kaparigelan ngedalkeun pamadegan, rasa, jeung pangalaman lisan ngagunakeun undak-usuk basa Sunda sacara santun.' },
        { no: 4, elemen: 'Nulis', cp: 'Kaparigelan nyusun kalimah, paragraf, karangan pondok, atawa aksara Sunda kalawan tartib jeung merenah.' }
      ]
    };
  }

  if (mapelLower.includes('tatanen') || mapelLower.includes('tdba') || mapelLower.includes('bale atikan')) {
    const capaianUmumMap = {
      'Fase A': 'Pada akhir Fase A, murid mampu mengenal dan memahami jenis-jenis sampah di lingkungan sekitar serta pengaruhnya bagi kehidupan, terlibat dalam praktik pengelolaan sampah sederhana (kompos/infused water), mengenal bagian tanaman dan berpartisipasi menanam di sekolah, serta membiasakan pola hidup sehat dan peduli kebersihan lingkungan belajar.',
      'Fase B': 'Pada akhir Fase B, murid mampu mengelola sampah secara terstruktur (mengurangi, memilah, mengolah), mengidentifikasi tanaman pangan lokal dan pascapanen dengan energi alam, menguasai teknik dasar budidaya tanaman, serta membangun kesadaran pola hidup sehat dan perawatan bumi.',
      'Fase C': 'Pada akhir Fase C, murid memahami pentingnya menjaga keseimbangan ekosistem dan menganalisis dampak aktivitas manusia, mempraktikkan budidaya tanaman mandiri (semai hingga panen), mengolah sampah organik untuk pangan sehat, membiasakan konsumsi pangan bergizi, serta mengembangkan kepedulian sosial dan kearifan lokal Sunda (leuweung hejo, rakyat ngejo).'
    };

    const capaianElemenMap = {
      'Fase A': [
        { no: 1, elemen: 'Hidup Berkelanjutan', cp: 'Murid mampu mengenal, mengidentifikasi, dan memahami jenis-jenis sampah di lingkungan sekitar serta pengaruhnya bagi kehidupan. Murid juga mulai dilibatkan dalam praktik pengelolaan sampah sederhana dan pemanfaatan bahan/sisa benda alam (seperti daun atau bagian tumbuhan) untuk kegiatan terdekat seperti pembuatan kompos atau infused water dari buah/sayur.' },
        { no: 2, elemen: 'Permakultur', cp: 'Murid mengenal bagian-bagian tanaman, mengamati fenomena alam di sekitar, serta ikut serta dalam praktik menanam sederhana di lingkungan sekolah.' },
        { no: 3, elemen: 'Pola Hidup Sehat', cp: 'Murid mengenal produk atau makanan sehat sederhana dari lingkungan sekitar serta membiasakan diri peduli pada kebersihan lingkungan belajar.' },
        { no: 4, elemen: 'Kecakapan Hidup (Life Skills)', cp: 'Murid membiasakan diri berkolaborasi, berkomunikasi, dan peduli terhadap kebersihan serta keasrian lingkungan belajar dan kebun sekolah.' }
      ],
      'Fase B': [
        { no: 1, elemen: 'Hidup Berkelanjutan', cp: 'Murid mampu menjelaskan, mempraktikkan, dan mengambil keputusan mandiri terkait pengelolaan sampah secara lebih terstruktur (mengurangi, memilah, dan mengolah sampah organik/anorganik).' },
        { no: 2, elemen: 'Permakultur', cp: 'Murid mampu mengidentifikasi bagian tanaman yang dapat dimanfaatkan sebagai bahan pangan atau olahan (misalnya singkong, pisang, atau sayuran lokal), memanfaatkan energi alam seperti sinar matahari untuk proses pascapanen sederhana (mengeringkan atau mengawetkan hasil Tatanén), serta memahami teknik dasar budidaya tanaman.' },
        { no: 3, elemen: 'Pola Hidup Sehat', cp: 'Murid mengembangkan kesadaran pola hidup sehat melalui pemahaman keterkaitan antara perawatan bumi, sumber pangan lokal yang bersih, dan kesehatan diri.' },
        { no: 4, elemen: 'Kecakapan Hidup (Life Skills)', cp: 'Murid menumbuhkan keterampilan berpikir kritis, pemecahan masalah lingkungan, kreativitas, dan kerja sama tim dalam merawat kebun dan mengolah hasil panen.' }
      ],
      'Fase C': [
        { no: 1, elemen: 'Hidup Berkelanjutan', cp: 'Murid memahami pentingnya menjaga keseimbangan ekosistem alam, serta mampu menganalisis dampak aktivitas manusia terhadap lingkungan sekitar.' },
        { no: 2, elemen: 'Permakultur', cp: 'Murid mempraktikkan teknik budidaya tanaman secara mandiri (mulai dari penyemaian, perawatan, hingga panen), serta memahami konsep pengolahan sampah organik dan pemanfaatan pekarangan sekolah untuk pangan sehat.' },
        { no: 3, elemen: 'Pola Hidup Sehat', cp: 'Murid membiasakan diri mengonsumsi makanan bergizi hasil tatanen/pertanian lokal, serta menyadari hubungan antara kesehatan tubuh dengan kebersihan lingkungan sekitar.' },
        { no: 4, elemen: 'Kecakapan Hidup (Life Skills)', cp: 'Murid mengembangkan kepedulian sosial melalui kerja kelompok dalam mengelola kebun sekolah, serta mengenal nilai kearifan lokal Sunda terkait kecintaan terhadap bumi (leuweung hejo, rakyat ngejo / pelestarian alam), kreativitas, dan jiwa wirausaha.' }
      ]
    };

    return {
      mata_pelajaran: 'Tatanen di Bale Atikan (TdBA)',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Peraturan Bupati Purwakarta No. 69 Tahun 2021 tentang Pendidikan Berkarakter Tatanen di Bale Atikan (TdBA)',
      rasional: 'Tatanen di Bale Atikan (TdBA) adalah gerakan pendidikan transformatif berbasis kearifan lokal Purwakarta yang mengintegrasikan budidaya pertanian alami (permakultur), ekoliterasi, konservasi lingkungan hidup berkelanjutan, pola hidup sehat, dan penumbuhan kecakapan hidup (life skills) murid demi terwujudnya keharmonisan hidup dengan alam.',
      tujuan: [
        'Mengembangkan kesadaran ekoliterasi dan hidup berkelanjutan melalui pemahaman jenis sampah, efisiensi energi, dan pelestarian alam.',
        'Membekali keterampilan permakultur dan ketahanan pangan melalui budidaya tanaman selaras alam dan pemanfaatan pekarangan.',
        'Membiasakan pola hidup sehat, menjaga kebersihan diri dan lingkungan, serta mengonsumsi pangan bergizi seimbang hasil tanam sendiri.',
        'Menumbuhkan kecakapan hidup (life skills), komunikasi, berpikir kritis, kreativitas, jiwa wirausaha, dan pengamalan nilai kearifan lokal Sunda (leuweung hejo, rakyat ngejo).'
      ],
      karakteristik: 'Pembelajaran berbasis aksi nyata di kebun sekolah dan lingkungan sekitar yang mengintegrasikan empat elemen utama: Hidup Berkelanjutan, Permakultur, Pola Hidup Sehat, dan Kecakapan Hidup (Life Skills).',
      elemen_deskripsi: [
        { elemen: 'Hidup Berkelanjutan', deskripsi: 'Memahami jenis sampah, pengelolaan sampah bijak, efisiensi energi, dan pelestarian lingkungan.' },
        { elemen: 'Permakultur', deskripsi: 'Sistem pertanian selaras dengan alam, pemanfaatan wadah/barang bekas, media tanam, pembuatan kompos, dan budidaya tanaman.' },
        { elemen: 'Pola Hidup Sehat', deskripsi: 'Menjaga kebersihan diri, kesehatan fisik, dan konsumsi pangan bergizi seimbang dari hasil tanam sendiri.' },
        { elemen: 'Kecakapan Hidup (Life Skills)', deskripsi: 'Keterampilan sosial, komunikasi, berpikir kritis, pemecahan masalah, kecakapan ekologi, kreativitas, dan jiwa wirausaha.' }
      ],
      capaian_umum: capaianUmumMap[fase] || capaianUmumMap['Fase C'],
      capaian_elemen: capaianElemenMap[fase] || capaianElemenMap['Fase C']
    };
  }

  if (mapelLower.includes('akpk') || mapelLower.includes('atikan karakter')) {
    return {
      mata_pelajaran: 'AKPK Purwakarta',
      fase,
      kelas: jenjangKelas,
      regulasi: 'Peraturan Daerah / Kebijakan Atikan Karakter Purwakarta',
      rasional: 'Atikan Karakter Purwakarta (AKPK) mangrupakeun pondasi ngawangun jati diri generasi emas nu mibanda karakter luhur dumasar kana ajén Pancasila jeung kearifan kabudayaan Sunda ngaliwatan pola pembiasaan Tujuh Poe Atikan Istimewa.',
      tujuan: [
        'Ngukuhkeun karakter mulia murid dumasar kana nilai-nilai kearifan budaya Sunda jeung falsafah Pancasila.',
        'Ngadidik kabiasaan hirup disiplin, mandiri, tanggung jawab, welas asih, jeung produktif ngaliwatan Tujuh Poe Atikan.',
        'Ngajaga kasaimbangan spiritual, intelektual, émosional, jeung fisik murid sacara holistik.'
      ],
      karakteristik: 'Pembelajaran reflektif terintegrasi dalam pembiasaan harian 7 Poe Atikan (Senen Ajeg Nusantara, Salasa Mapag Buana, Rebo Maneh, Kemis Nyanding Rasa, Jumaah Nyucikeun Diri, Saptu-Minggu Betah di Imah).',
      elemen_deskripsi: [
        { elemen: 'Ajeg Nusantara', deskripsi: 'Ngemban karakter cinta tanah air, wawasan kabangsaan, jeung ngamalkeun nilai-nilai luhur Pancasila.' },
        { elemen: 'Mapag Buana', deskripsi: 'Nyiapkeun diri nyanghareupan kamajuan dunya kalawan wawasan global, literasi, jeung téknologi.' },
        { elemen: 'Maneh', deskripsi: 'Miboga kamandirian, mikawanoh potensi diri, kasadaran emosi, jeung pamikiran kritis.' },
        { elemen: 'Nyanding Rasa', deskripsi: 'Miboga rasa empati, welas asih, gotong royong, apresiasi seni budaya, jeung toleransi.' },
        { elemen: 'Nyucikeun Diri', deskripsi: 'Ngaronjatkeun kataqwaan ka Gusti, kaberesihan hate, ucapan jujur, jeung ibadah harian.' },
        { elemen: 'Betah di Imah & Reureuh', deskripsi: 'Ngukuhkeun tatali asih jeung kulawarga, bakti ka kolot, sarta istirahat anu seimbang.' }
      ],
      capaian_umum: fase === 'Fase A'
        ? 'Murid némbongkeun rasa reueus ka tanah air, mikawanoh kabiasaan hadé diri sorangan, nyaah ka babaturan, hormat ka guru/kolot, sarta getol ibadah.'
        : fase === 'Fase B'
          ? 'Murid ngamalkeun wawasan diajar aktif, literasi dasar, gotong royong dina rupa-rupa kabudayaan, disiplin ibadah, jeung komunikasi harmonis di kulawarga.'
          : 'Murid miboga wawasan nusantara kuat, literasi digital tanggung jawab, kepemimpinan diri berintegritas, filantropi sosial, jeung ketahanan mental tangguh.',
      capaian_elemen: [
        { no: 1, elemen: 'Ajeg Nusantara', cp: 'Ngemban rasa patriotik, mikacinta lambang nagara, jeung ngamalkeun nilai-nilai Pancasila dina kahirupan sapopoé.' },
        { no: 2, elemen: 'Mapag Buana', cp: 'Ngaronjatkeun literasi élmu pangaweruh, téknologi, sarta kabiasaan maca pikeun nyanghareupan kamajuan jaman.' },
        { no: 3, elemen: 'Maneh', cp: 'Mikawanoh poténsi diri, mibanda kapercayaan diri, mandiri, sarta tanggung jawab kana sagala tugas.' },
        { no: 4, elemen: 'Nyanding Rasa', cp: 'Némbongkeun sikep welas asih, silih tulungan, empati, sarta ngajénan karagaman kasenian jeung budaya.' },
        { no: 5, elemen: 'Nyucikeun Diri', cp: 'Ngaronjatkeun ibadah ritual ka Gusti, ngajaga kasucian badan, kaberesihan lingkungan, jeung kajujuran lampah.' },
        { no: 6, elemen: 'Betah di Imah & Reureuh', cp: 'Bakti ka ibu-rama, ngaraketkeun duduluran di kulawarga, sarta ngamangpaatkeun waktu istirahat kalawan produktif.' }
      ]
    };
  }

  // Matematika (Default jika nama mapel mengandung matematika atau fallback umum)
  return {
    mata_pelajaran: 'Matematika',
    fase,
    kelas: jenjangKelas,
    regulasi: 'Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025',
    rasional: 'Matematika merupakan ilmu universal yang mendasari perkembangan sains, teknologi, dan kecakapan bernalar logis, sistematis, kritis, dan analitis. Melalui pembelajaran matematika, murid dibimbing membangun kepekaan numerik (number sense), pemecahan masalah (problem solving), dan penalaran matematis yang konkret hingga abstrak dalam kehidupan sehari-hari.',
    tujuan: [
      'Memahami konsep matematis, operasi hitung, dan hubungan antar-konsep secara mendalam dan fleksibel.',
      'Menggunakan penalaran matematis pada pola, representasi data, dan hubungan spasial untuk menyusun argumen logis.',
      'Menyelesaikan masalah kontekstual nyata melalui permodelan matematis yang tepat dan efisien.',
      'Menumbuhkan sikap pantang menyerah, teliti, apresiatif, dan percaya diri terhadap kegunaan matematika.'
    ],
    karakteristik: 'Pembelajaran Matematika disajikan secara hierarkis dan spiral melalui peragaan konkret, semi-konkret (gambar), hingga simbolis abstrak yang mencakup 5 (lima) elemen utama.',
    elemen_deskripsi: [
      { elemen: 'Bilangan', deskripsi: 'Membahas konsep dan intuisi bilangan cacah, pecahan, desimal, operasi hitung penjumlahan, pengurangan, perkalian, pembagian, serta KPK dan FPB.' },
      { elemen: 'Aljabar', deskripsi: 'Membahas pola gambar/objek, kalimat matematika, persamaan sederhana, rasio, proporsi, dan penalaran aljabar pemecahan masalah.' },
      { elemen: 'Pengukuran', deskripsi: 'Membahas satuan baku dan tidak baku untuk panjang, berat, luas, volume, durasi waktu, serta besar sudut.' },
      { elemen: 'Geometri', deskripsi: 'Membahas karakteristik bangun datar, bangun ruang, visualisasi spasial, komposisi, dekomposisi, serta sistem posisi berpetak.' },
      { elemen: 'Analisis Data dan Peluang', deskripsi: 'Membahas pengumpulan, pengorganisasian, penyajian data (tabel, diagram batang, piktogram), interpretasi data, dan peluang percobaan sederhana.' }
    ],
    capaian_umum: fase === 'Fase A'
      ? 'Pada akhir Fase A, murid memiliki intuisi bilangan cacah sampai 100, melakukan operasi tambah/kurang benda konkret sampai 20; mengenal pola bukan bilangan; membandingkan panjang, berat, dan durasi waktu; mengenal bangun datar dan bangun ruang; serta menyajikan data menggunakan turus dan piktogram.'
      : fase === 'Fase B'
        ? 'Pada akhir Fase B, murid menguasai bilangan cacah sampai 10.000, operasi hitung dasar, pecahan senilai dan desimal; menemukan nilai yang belum diketahui dalam pola; mengukur panjang, berat, luas, dan volume dengan satuan baku; mendeskripsikan sifat bangun datar; serta menginterpretasi diagram batang.'
        : 'Pada akhir Fase C, murid menguasai bilangan cacah sampai 1.000.000, pecahan campuran, perbandingan dan rasio; bernalar proporsional; menghitung keliling dan luas bangun datar serta sudut; mengonstruksi bangun ruang dan visualisasi spasial; serta menganalisis diagram batang, tabel frekuensi, dan peluang sederhana.',
    capaian_elemen: [
      { no: 1, elemen: 'Bilangan', cp: fase === 'Fase A' ? 'Menunjukkan pemahaman dan memiliki intuisi bilangan (number sense) pada bilangan cacah sampai 100; membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, serta melakukan komposisi dan dekomposisi bilangan; melakukan operasi penjumlahan dan pengurangan menggunakan benda konkret sampai 20; dan mengenal pecahan setengah dan seperempat.' : fase === 'Fase B' ? 'Memiliki pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 10.000; membaca, menulis, membandingkan, menentukan nilai tempat; menyelesaikan masalah operasi hitung sampai 1.000; operasi perkalian dan pembagian sampai 100; perbandingan pecahan dan desimal.' : 'Menunjukkan pemahaman dan intuisi bilangan pada bilangan cacah sampai 1.000.000; menyelesaikan masalah uang, KPK dan FPB; operasi hitung pecahan biasa, campuran, dan desimal.' },
      { no: 2, elemen: 'Aljabar', cp: fase === 'Fase A' ? 'Menunjukkan pemahaman makna simbol matematika "=" dalam kalimat matematika penjumlahan dan pengurangan bilangan cacah sampai 20 menggunakan gambar; mengenali, meniru, dan melanjutkan pola bukan bilangan.' : fase === 'Fase B' ? 'Menemukan nilai yang tidak diketahui dalam kalimat matematika penjumlahan dan pengurangan bilangan cacah sampai 100; mengidentifikasi dan mengembangkan pola gambar serta pola bilangan membesar/mengecil.' : 'Menemukan nilai belum diketahui dalam kalimat matematika sampai 1000; mengembangkan pola bilangan; bernalar secara proporsional dan menyelesaikan masalah perbandingan rasio satuan.' },
      { no: 3, elemen: 'Pengukuran', cp: fase === 'Fase A' ? 'Membandingkan panjang dan berat benda secara langsung, membandingkan durasi waktu; mengukur dan mengestimasi panjang dan berat menggunakan satuan tidak baku.' : fase === 'Fase B' ? 'Mengukur panjang dan berat benda menggunakan satuan baku (cm, m, g, kg); mengukur dan mengestimasi luas dan volume menggunakan satuan tidak baku dan satuan baku.' : 'Menentukan keliling dan luas berbagai bentuk bangun datar (segitiga, segiempat, segi banyak) serta gabungannya; menghitung durasi waktu dan mengukur besar sudut.' },
      { no: 4, elemen: 'Geometri', cp: fase === 'Fase A' ? 'Mengenal berbagai bangun datar (segitiga, segiempat, lingkaran) dan bangun ruang (balok, kubus, kerucut, bola); melakukan komposisi dan dekomposisi bangun datar; menentukan posisi benda.' : fase === 'Fase B' ? 'Mendeskripsikan ciri berbagai bentuk bangun datar (segiempat, segitiga, segi banyak); menyusun dan mengurai berbagai bangun datar dengan lebih dari satu cara.' : 'Mengonstruksi dan mengurai bangun ruang (kubus, balok, gabungannya); mengenali visualisasi spasial; membandingkan karakteristik bangun ruang; menentukan lokasi pada sistem koordinat berpetak.' },
      { no: 5, elemen: 'Analisis Data dan Peluang', cp: fase === 'Fase A' ? 'Mengurutkan, menyortir, mengelompokkan, membandingkan, dan menyajikan data dari banyak benda menggunakan turus dan piktogram paling banyak 4 kategori.' : fase === 'Fase B' ? 'Mengurutkan, membandingkan, menyajikan, menganalisis dan menginterpretasi data dalam bentuk tabel, diagram gambar, piktogram, dan diagram batang skala satu satuan.' : 'Mengurutkan, membandingkan, menyajikan, dan menganalisis data dalam bentuk gambar, diagram batang, tabel frekuensi; menentukan peluang kejadian sederhana dalam percobaan acak.' }
    ]
  };
}


/**
 * 4d. RENDER DOKUMEN CAPAIAN PEMBELAJARAN (CP) AWAL RESMI
 */
export function renderDataCpView(data, inputData = {}) {
  const metadata = data?.metadata || {};
  const mapel = metadata.mata_pelajaran || inputData?.mataPelajaran || document.getElementById('select-mata-pelajaran')?.value || 'Matematika';
  const jenjangKelas = metadata.kelas || inputData?.jenjangKelas || document.getElementById('select-jenjang-kelas')?.value || '5';
  
  const cpDoc = getOfficialCpDocumentDataClient(mapel, jenjangKelas);

  let html = `
    ${getKopSuratHtml()}

    <div class="text-center mb-6">
      <div class="inline-block px-3 py-1 mb-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-black tracking-wider uppercase font-sans shadow-2xs">
        <i class="fas fa-certificate text-emerald-600 mr-1"></i> DOKUMEN RESMI KURIKULUM MERDEKA - ${escapeHtml(cpDoc.regulasi)}
      </div>
      <h2 class="text-xl font-black uppercase tracking-wide text-slate-950 font-serif">CAPAIAN PEMBELAJARAN (CP)</h2>
      <p class="text-xs font-bold text-slate-700 font-serif uppercase tracking-widest mt-0.5">
        MATA PELAJARAN: ${escapeHtml(mapel.toUpperCase())} &bull; ${escapeHtml(cpDoc.fase.toUpperCase())}
      </p>
    </div>

    <!-- Identitas Dokumen -->
    <div class="mb-6 p-4 rounded-xl border border-slate-300 bg-slate-50/70">
      <table class="w-full text-xs font-bold font-serif text-slate-900 border-collapse">
        <tr><td class="py-1 w-48 text-slate-600">SATUAN PENDIDIKAN</td><td>: ${escapeHtml(metadata.satuan_pendidikan || inputData.namaSekolah || '-')}</td></tr>
        <tr><td class="py-1 text-slate-600">MATA PELAJARAN</td><td>: ${escapeHtml(mapel)}</td></tr>
        <tr><td class="py-1 text-slate-600">FASE / KELAS</td><td>: ${escapeHtml(cpDoc.fase)} / Kelas ${escapeHtml(jenjangKelas)}</td></tr>
        <tr><td class="py-1 text-slate-600">TAHUN AJARAN</td><td>: ${escapeHtml(metadata.tahun_pembelajaran || inputData.tahunAjaran || '2025/2026')}</td></tr>
        <tr><td class="py-1 text-slate-600">DASAR REGULASI</td><td>: ${escapeHtml(cpDoc.regulasi)}</td></tr>
      </table>
    </div>

    <!-- I. Rasional Mata Pelajaran -->
    <div class="mb-6">
      <h3 class="text-sm font-black font-serif uppercase tracking-wider text-slate-950 mb-2 flex items-center gap-2">
        <span class="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-sans">I</span>
        <span>RASIONAL MATA PELAJARAN</span>
      </h3>
      <div class="p-4 rounded-xl border border-slate-200 bg-white font-serif text-xs text-slate-800 leading-relaxed text-justify" contenteditable="true" data-field="cp_rasional">
        ${escapeHtml(cpDoc.rasional)}
      </div>
    </div>

    <!-- II. Tujuan Belajar Mata Pelajaran -->
    <div class="mb-6">
      <h3 class="text-sm font-black font-serif uppercase tracking-wider text-slate-950 mb-2 flex items-center gap-2">
        <span class="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-sans">II</span>
        <span>TUJUAN BELAJAR MATA PELAJARAN</span>
      </h3>
      <div class="p-4 rounded-xl border border-slate-200 bg-white font-serif text-xs text-slate-800 leading-relaxed space-y-2" contenteditable="true" data-field="cp_tujuan">
        ${cpDoc.tujuan.map((t, idx) => `
          <div class="flex items-start gap-2">
            <span class="font-bold">${idx + 1}.</span>
            <span class="text-justify">${escapeHtml(t)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- III. Karakteristik & Elemen -->
    <div class="mb-6">
      <h3 class="text-sm font-black font-serif uppercase tracking-wider text-slate-950 mb-2 flex items-center gap-2">
        <span class="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-sans">III</span>
        <span>KARAKTERISTIK MATA PELAJARAN & RUANG LINGKUP ELEMEN</span>
      </h3>
      <p class="font-serif text-xs text-slate-800 leading-relaxed text-justify mb-3 p-3 bg-white rounded-xl border border-slate-200" contenteditable="true" data-field="cp_karakteristik">
        ${escapeHtml(cpDoc.karakteristik)}
      </p>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-slate-900 text-xs font-serif text-slate-900 mb-2">
          <thead>
            <tr class="bg-slate-100 font-bold text-center">
              <th class="border border-slate-900 p-2.5 w-[30%]">ELEMEN</th>
              <th class="border border-slate-900 p-2.5 w-[70%]">DESKRIPSI RUANG LINGKUP</th>
            </tr>
          </thead>
          <tbody>
            ${cpDoc.elemen_deskripsi.map(el => `
              <tr>
                <td class="border border-slate-900 p-2.5 font-bold align-top bg-slate-50/50">${escapeHtml(el.elemen)}</td>
                <td class="border border-slate-900 p-2.5 align-top text-justify leading-relaxed">${escapeHtml(el.deskripsi)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- IV. Capaian Pembelajaran Fase -->
    <div class="mb-6">
      <h3 class="text-sm font-black font-serif uppercase tracking-wider text-slate-950 mb-2 flex items-center gap-2">
        <span class="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-sans">IV</span>
        <span>CAPAIAN PEMBELAJARAN ${escapeHtml(cpDoc.fase.toUpperCase())}</span>
      </h3>

      <div class="mb-4">
        <h4 class="text-xs font-bold font-serif text-slate-900 mb-1">A. Capaian Pembelajaran Umum Akhir Fase</h4>
        <div class="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/30 font-serif text-xs text-slate-800 italic leading-relaxed text-justify" contenteditable="true" data-field="cp_umum">
          ${escapeHtml(cpDoc.capaian_umum)}
        </div>
      </div>

      <div>
        <h4 class="text-xs font-bold font-serif text-slate-900 mb-2">B. Capaian Pembelajaran Berdasarkan Elemen</h4>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-slate-900 text-xs font-serif text-slate-900">
            <thead>
              <tr class="bg-slate-100 font-bold text-center">
                <th class="border border-slate-900 p-2.5 w-[6%]">NO.</th>
                <th class="border border-slate-900 p-2.5 w-[26%]">ELEMEN</th>
                <th class="border border-slate-900 p-2.5 w-[68%]">CAPAIAN PEMBELAJARAN</th>
              </tr>
            </thead>
            <tbody>
              ${cpDoc.capaian_elemen.map(item => `
                <tr class="hover:bg-slate-50/60">
                  <td class="border border-slate-900 p-2.5 text-center font-bold align-top">${item.no}</td>
                  <td class="border border-slate-900 p-2.5 font-bold align-top text-slate-950 bg-slate-50/40">${escapeHtml(item.elemen)}</td>
                  <td class="border border-slate-900 p-2.5 align-top text-justify leading-relaxed" contenteditable="true" data-field="cp_elemen_${item.no}">${escapeHtml(item.cp)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const tahunAjaran = metadata.tahun_pembelajaran || inputData?.tahunAjaran || '2025/2026';
  const titimangsa = getKaldikTitimangsa(tahunAjaran, 1);
  html += getPengesahanHtml(inputData, titimangsa);

  return html;
}

/**
 * 5. MASTER CANVAS DISPATCHER (5-in-1 Output Engine)
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
    if (activeAnalysisTab === 'data-cp') downloadLabel.innerText = 'Unduh Word Data CP';
    else if (activeAnalysisTab === 'prota') downloadLabel.innerText = 'Unduh Word Prota';
    else if (activeAnalysisTab === 'promes') downloadLabel.innerText = 'Unduh Word Promes';
    else if (activeAnalysisTab === 'rpe') downloadLabel.innerText = 'Unduh Word RPE';
    else if (activeAnalysisTab === 'kktp') downloadLabel.innerText = 'Unduh Word KKTP';
    else if (activeAnalysisTab === 'atp-elemen') downloadLabel.innerText = 'Unduh Word ATP (Elemen)';
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
    if (activeAnalysisTab === 'data-cp') {
      contentHtml = renderDataCpView(data, inputData);
    } else if (activeAnalysisTab === 'prota') {
      contentHtml = renderProtaTable(data, inputData);
    } else if (activeAnalysisTab === 'promes') {
      contentHtml = renderPromesTable(data, inputData, activePromesSemester);
    } else if (activeAnalysisTab === 'rpe') {
      contentHtml = renderRpeTable(data, inputData, activePromesSemester);
    } else if (activeAnalysisTab === 'kktp') {
      contentHtml = renderKktpTable(data, inputData, activePromesSemester);
    } else if (activeAnalysisTab === 'atp-elemen') {
      contentHtml = renderAtpElemenTable(data, inputData);
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
    else if (field === 'cp') {
      const rawIndices = el.dataset.babIndices;
      if (rawIndices) {
        const indices = rawIndices.split(',').map(n => Number(n.trim())).filter(n => !isNaN(n));
        // Hanya sinkronkan jika elemen ini menargetkan tepat 1 bab (jangan pernah menimpa banyak bab secara massal)
        if (indices.length === 1) {
          const bIdx = indices[0];
          if (targetSem.babs?.[bIdx]) {
            const orig = targetSem.babs[bIdx].cp || '';
            const elMatch = orig.match(/^(\[[^\]]+\]\s*|(?:Elemen\s*[^:\n]+|[^:\n]{3,35}):\s*)/i);
            if (elMatch && !val.startsWith('[') && !val.toLowerCase().startsWith('elemen')) {
              targetSem.babs[bIdx].cp = `${elMatch[1].trim()}\n${val}`;
            } else {
              targetSem.babs[bIdx].cp = val;
            }
          }
        }
      } else {
        targetBab.cp = val;
      }
    }
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
