import { escapeHtml, showToast } from '../../utils.js';
import { getKopSuratHtml, getPengesahanHtml, getItemJpText, parseJpNum } from './helpers.js';
import { getAlokasiWaktuResmi, balanceSemesterJpItems } from './alokasi-waktu.js';

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
            <th class="border border-slate-900 p-2 w-[22%]">CP (Capaian Pembelajaran)</th>
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
        atp: 'Peserta didik melakukan serangkaian aktivitas terpadu untuk mencapai tujuan pembelajaran.',
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
              <button type="button" onclick="window.bridgeToRpp('${escapeHtml(bab.bab).replace(/'/g, "\\'")}', '${escapeHtml(bab.cp).replace(/'/g, "\\'")}', ${sem.semester})" class="mt-2.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-300 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer print:hidden transition-all shadow-2xs" title="Lanjut buat RPP untuk Bab ini">
                <i class="fas fa-magic text-teal-600"></i> Buat RPP Bab Ini
              </button>
            </td>
            <td rowspan="${rowSpan}" class="border border-slate-900 p-2.5 align-top text-justify" contenteditable="true" data-field="cp" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}">
              ${escapeHtml(bab.cp).replace(/\n/g, '<br>')}
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
          <td class="border border-slate-900 p-2.5 align-top text-justify" contenteditable="true" data-field="atp" data-sem-idx="${semIdx}" data-bab-idx="${babIdx}" data-item-idx="${itemIdx}">
            ${escapeHtml(item.atp)}
          </td>
        </tr>`;
      });
    });
  });

  html += `
        </tbody>
      </table>
    </div>
    ${getPengesahanHtml(inputData)}
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
        atp: 'Peserta didik melakukan serangkaian alur aktivitas pembelajaran.',
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
  ${getPengesahanHtml(inputData)}
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
    <div class="flex items-center justify-between mb-5 pb-3 border-b border-slate-200 print:hidden font-sans">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-700">Tampilkan Semester:</span>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="all">Semua Semester</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="1">Semester 1 (Ganjil)</button>
        <button type="button" class="btn-sem-filter px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePromesSemester === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-sem="2">Semester 2 (Genap)</button>
      </div>
      <span class="text-[11px] text-slate-400 font-medium">Matriks 6 Bulan x 5 Minggu (30 Kolom Efektif)</span>
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

    // Minggu Efektif KBM (18-20 pekan):
    // Masuk sekolah pertama 13 Juli 2026 (Minggu ke-3 Juli):
    // Juli: w=3, 4, 5 (w=1,2 Libur TP Lalu, w=3 MPLS/Awal KBM)
    // Agustus: w=6, 7, 8, 9, 10
    // September: w=11, 12 (KBM), w=13, 14 (STS), w=15 (KBM)
    // Oktober: w=16, 17, 18, 19, 20
    // November: w=21, 22, 23, 24 (KBM / Kokurikuler)
    // Desember: w=26, 27 (SAS), w=28 (RPT), w=29, 30 (LBR)
    const activeKbmWeeks = isSem1
      ? [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

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

        if (allocJp) {
          html += `<td class="border border-slate-900 p-0.5 text-center font-black bg-indigo-100/70 text-indigo-950">${allocJp}</td>`;
        } else if (isSem1 && (w === 1 || w === 2)) {
          html += `<td class="border border-slate-900 p-0.5 text-center bg-slate-100/80 text-[8px] text-slate-400"></td>`;
        } else if (w === 13 || w === 14) {
          html += `<td class="border border-slate-900 p-0.5 text-center bg-amber-50/40 text-[8px] text-amber-800"></td>`;
        } else if (w === 26 || w === 27) {
          html += `<td class="border border-slate-900 p-0.5 text-center bg-purple-50/40 text-[8px] text-purple-800"></td>`;
        } else if (w === 28) {
          html += `<td class="border border-slate-900 p-0.5 text-center bg-teal-50/40 text-[8px] text-teal-800"></td>`;
        } else if (w >= 29) {
          html += `<td class="border border-slate-900 p-0.5 text-center bg-slate-100 text-[8px] text-slate-400"></td>`;
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
      `;
    }

    html += `
      <tr class="bg-amber-50 font-bold text-amber-950">
        <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Sumatif Tengah Semester (STS)</td>
        ${Array.from({ length: 30 }, (_, i) => {
          const w = i + 1;
          if (w === 13 || w === 14) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-amber-200 text-amber-900">STS</td>`;
          return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
        }).join('')}
      </tr>
      <tr class="bg-purple-50 font-bold text-purple-950">
        <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Sumatif Akhir Semester (SAS / ASAT)</td>
        ${Array.from({ length: 30 }, (_, i) => {
          const w = i + 1;
          if (w === 26 || w === 27) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-purple-200 text-purple-900">SAS</td>`;
          return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
        }).join('')}
      </tr>
      <tr class="bg-teal-50 font-bold text-teal-950">
        <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Pengolahan Nilai & Pembagian Rapor</td>
        ${Array.from({ length: 30 }, (_, i) => {
          const w = i + 1;
          if (w === 28) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-teal-200 text-teal-900">RPT</td>`;
          return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
        }).join('')}
      </tr>
      <tr class="bg-slate-200 font-bold text-slate-800">
        <td colspan="4" class="border border-slate-900 p-1.5 text-left text-[10.5px]">Libur Akhir Semester</td>
        ${Array.from({ length: 30 }, (_, i) => {
          const w = i + 1;
          if ((isSem1 && (w === 1 || w === 2)) || w >= 29) return `<td class="border border-slate-900 p-0.5 text-center font-black bg-slate-300 text-slate-900">LBR</td>`;
          return `<td class="border border-slate-900 p-0.5 text-center"></td>`;
        }).join('')}
      </tr>
    `;

    html += `
            </tbody>
          </table>
        </div>
        ${getPengesahanHtml(inputData)}
      </div>
    `;
  });

  return html;
}

/**
 * 4. RENDER TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
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

        ${getPengesahanHtml(inputData)}
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

    const isFullYear = (data.semesters?.length || 1) > 1;
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
  if (activeAnalysisTab === 'prota') {
    contentHtml = renderProtaTable(data, inputData);
  } else if (activeAnalysisTab === 'promes') {
    contentHtml = renderPromesTable(data, inputData, activePromesSemester);
  } else if (activeAnalysisTab === 'kktp') {
    contentHtml = renderKktpTable(data, inputData, activePromesSemester);
  } else {
    contentHtml = renderAnalisisTable(data, inputData);
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
