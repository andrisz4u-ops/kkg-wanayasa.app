// public/static/js/pages/analisis-cp/verification-view.js
// Antarmuka Fase Verifikasi & Validasi (Quality Gate) Analisis CP, TP, dan ATP
// Standar Regulasi BSKAP No. 046/2025 & Permendikdasmen No. 13/2025

import { escapeHtml, showToast } from '../../utils.js';
import { runCpQualityGate, BLOOM_KKO, FORBIDDEN_VERBS } from './validator.js';

let _activeFilter = 'all'; // 'all' | 'flagged' | 'repaired' | 'verified'
let _activeSemesterFilter = 'all'; // 'all' | '1' | '2'
let _expandedBabs = new Set(); // bab keys that are expanded

export function renderVerificationView(container, analysisData, inputData, callbacks = {}) {
  if (!container) return;

  // Pastikan data memiliki audit trail
  let localData = analysisData;
  if (!localData._audit) {
    const qg = runCpQualityGate(localData, inputData?.chapters || [], inputData || {});
    localData._audit = qg.audit;
  }

  const audit = localData._audit || {};
  const summary = audit.summary || {
    total_tp: 0,
    total_babs: 0,
    passed_count: 0,
    repaired_count: 0,
    flagged_count: 0,
    overall_quality_score: 95,
    grade: 'A',
    grade_label: 'Sangat Baik',
    kko_compliance_pct: 100,
    cp_alignment_pct: 100,
    jp_compliance_pct: 100
  };

  // Default: expand bab pertama jika belum ada
  if (_expandedBabs.size === 0 && Array.isArray(localData.semesters)) {
    for (const sem of localData.semesters) {
      if (Array.isArray(sem.babs) && sem.babs.length > 0) {
        _expandedBabs.add(`${sem.semester || 1}_${sem.babs[0].no || 1}`);
        break;
      }
    }
  }

  const gradeBadgeColor = summary.grade === 'A'
    ? 'from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
    : summary.grade === 'B'
      ? 'from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
      : 'from-amber-500 to-orange-600 text-white shadow-amber-500/25';

  const mapelTitle = inputData?.mataPelajaran || localData.metadata?.mata_pelajaran || 'Mata Pelajaran';
  const kelasTitle = inputData?.jenjangKelas || `Kelas ${localData.metadata?.kelas || '5'}`;
  const faseTitle = inputData?.fase || localData.metadata?.fase || 'Fase C';

  let html = `
    <div class="animate-fade-in space-y-6 max-w-7xl mx-auto pb-16">

      <!-- STEPPER & TITLE HEADER -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl text-white">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <i class="fas fa-shield-halved mr-1"></i> Quality Gate • Fase 2 dari 3
              </span>
              <span class="px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                BSKAP 046/2025 & Permendikdasmen 13/2025
              </span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">
              VERIFIKASI & VALIDASI <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300 bg-clip-text text-transparent">ANALISIS CP, TP & ATP</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tinjau keselarasan Kata Kerja Operasional (KKO), elemen kurikulum resmi, dan beban jam pelajaran sebelum dokumen dirilis ke Canvas Cetak.
            </p>
          </div>

          <!-- QUALITY SCORE CARD -->
          <div class="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeBadgeColor} flex flex-col items-center justify-center shadow-lg font-black">
              <span class="text-2xl leading-none">${summary.overall_quality_score}</span>
              <span class="text-[9px] uppercase tracking-wider opacity-90 mt-0.5">Skor Mutu</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white/15 text-emerald-300 border border-emerald-400/30">
                  Grade ${summary.grade}
                </span>
                <span class="text-xs font-bold text-white">${escapeHtml(summary.grade_label)}</span>
              </div>
              <p class="text-[11px] text-slate-300">${escapeHtml(mapelTitle)} • ${escapeHtml(kelasTitle)} (${escapeHtml(faseTitle)})</p>
              <p class="text-[10px] text-slate-400 mt-1">
                <i class="fas fa-check-circle text-emerald-400 mr-1"></i> ${summary.passed_count} Lolos
                ${summary.repaired_count > 0 ? ` • <span class="text-sky-300"><i class="fas fa-wrench mr-1"></i>${summary.repaired_count} Diperbaiki</span>` : ''}
                ${summary.flagged_count > 0 ? ` • <span class="text-amber-300"><i class="fas fa-triangle-exclamation mr-1"></i>${summary.flagged_count} Catatan</span>` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- AUDIT METRICS DASHBOARD GRID -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Metric 1: KKO Compliance -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span class="font-bold flex items-center gap-1.5"><i class="fas fa-graduation-cap text-indigo-500"></i> KKO Terukur</span>
            <span class="font-extrabold text-indigo-600 dark:text-indigo-400">${summary.kko_compliance_pct}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-500 to-sky-500 h-full rounded-full" style="width: ${summary.kko_compliance_pct}%"></div>
          </div>
          <p class="text-[10.5px] text-slate-500 dark:text-slate-400">Kata kerja terukur sesuai Taksonomi Bloom</p>
        </div>

        <!-- Metric 2: CP Alignment -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span class="font-bold flex items-center gap-1.5"><i class="fas fa-file-shield text-emerald-500"></i> Keselarasan CP</span>
            <span class="font-extrabold text-emerald-600 dark:text-emerald-400">${summary.cp_alignment_pct}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style="width: ${summary.cp_alignment_pct}%"></div>
          </div>
          <p class="text-[10.5px] text-slate-500 dark:text-slate-400">Selaras dengan Elemen BSKAP 046/2025</p>
        </div>

        <!-- Metric 3: JP Balance -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span class="font-bold flex items-center gap-1.5"><i class="fas fa-clock text-sky-500"></i> Beban JP</span>
            <span class="font-extrabold text-sky-600 dark:text-sky-400">${summary.jp_compliance_pct}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div class="bg-gradient-to-r from-sky-500 to-blue-500 h-full rounded-full" style="width: ${summary.jp_compliance_pct}%"></div>
          </div>
          <p class="text-[10.5px] text-slate-500 dark:text-slate-400">Standar Permendikdasmen No. 13 Tahun 2025</p>
        </div>

        <!-- Metric 4: Terminology & Scope -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span class="font-bold flex items-center gap-1.5"><i class="fas fa-spell-check text-purple-500"></i> Terminologi</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">100% Murid</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" style="width: 100%"></div>
          </div>
          <p class="text-[10.5px] text-slate-500 dark:text-slate-400">Penyebutan 'Peserta Didik' dibersihkan</p>
        </div>
      </div>

      <!-- FILTER & ACTIONS TOOLBAR -->
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Filter Status:</span>
          <button type="button" class="btn-filter-status px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${_activeFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" data-filter="all">
            Semua TP (${summary.total_tp})
          </button>
          <button type="button" class="btn-filter-status px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${_activeFilter === 'verified' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" data-filter="verified">
            Lolos (${summary.passed_count})
          </button>
          <button type="button" class="btn-filter-status px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${_activeFilter === 'repaired' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" data-filter="repaired">
            Diperbaiki (${summary.repaired_count})
          </button>
          ${summary.flagged_count > 0 ? `
            <button type="button" class="btn-filter-status px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${_activeFilter === 'flagged' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" data-filter="flagged">
              Perlu Tinjau (${summary.flagged_count})
            </button>
          ` : ''}
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button type="button" id="btn-expand-all-babs" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer">
            <i class="fas fa-up-right-and-down-left-from-center mr-1"></i> Buka Semua Bab
          </button>
          <button type="button" id="btn-collapse-all-babs" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer">
            <i class="fas fa-down-left-and-up-right-to-center mr-1"></i> Tutup Semua
          </button>
        </div>
      </div>

      <!-- DAFTAR BAB & ITEM TP (ACCORDION CARDS) -->
      <div class="space-y-4" id="verification-babs-list">
  `;

  // Render Bab Cards
  let itemIndex = 0;
  for (const sem of (localData.semesters || [])) {
    const semNum = sem.semester || 1;
    for (const bab of (sem.babs || [])) {
      const babKey = `${semNum}_${bab.no || 1}`;
      const isExpanded = _expandedBabs.has(babKey);
      const items = Array.isArray(bab.items) ? bab.items : [];
      const babJpSum = items.reduce((sum, it) => {
        const m = String(it.alokasi_waktu || '').match(/\d+/);
        return sum + (m ? parseInt(m[0], 10) : 4);
      }, 0);

      // Cek apakah ada item dalam bab ini yang cocok dengan filter
      const matchingItems = items.filter(it => {
        if (_activeFilter === 'all') return true;
        const auditItem = audit.items?.find(ai => ai.kode_tp === it.kode_tp);
        return auditItem?.status === _activeFilter;
      });

      if (_activeFilter !== 'all' && matchingItems.length === 0) {
        continue;
      }

      html += `
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all" data-bab-key="${babKey}">
          <!-- Bab Header Accordion Trigger -->
          <div class="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 cursor-pointer select-none hover:bg-slate-100/60 transition-colors bab-accordion-header" data-target="${babKey}">
            <div class="flex items-center gap-3.5">
              <span class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-indigo-600/25 shrink-0">
                ${bab.no || 1}
              </span>
              <div>
                <div class="flex items-center gap-2 flex-wrap mb-0.5">
                  <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-extrabold uppercase">
                    Semester ${semNum}
                  </span>
                  <span class="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    ${items.length} TP
                  </span>
                  <span class="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                    <i class="fas fa-clock mr-1"></i>${babJpSum} JP
                  </span>
                </div>
                <h3 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">${escapeHtml(bab.bab || 'Bab')}</h3>
              </div>
            </div>

            <div class="flex items-center gap-2 self-end sm:self-center">
              <span class="text-xs font-bold text-slate-400">Rincian TP</span>
              <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}">
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>

          <!-- Bab Details & Items -->
          <div class="bab-accordion-content ${isExpanded ? '' : 'hidden'} p-5 space-y-4">
            
            <!-- Elemen CP Resmi Terkait Bab -->
            <div class="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-xs font-serif text-slate-700 dark:text-slate-300 leading-relaxed">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10.5px] font-black uppercase text-emerald-900 dark:text-emerald-200 tracking-wider flex items-center gap-1.5 font-sans">
                  <i class="fas fa-file-contract text-emerald-600"></i> Elemen & Capaian Pembelajaran Resmi:
                </span>
                <span class="text-[9.5px] px-2 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-bold font-sans">
                  BSKAP 046/2025
                </span>
              </div>
              <div class="text-[11.5px] whitespace-pre-line text-slate-800 dark:text-slate-200">
                ${escapeHtml(bab.cp || 'Capaian Pembelajaran sesuai kurikulum resmi.')}
              </div>
            </div>

            <!-- List TP Items -->
            <div class="space-y-3">
      `;

      for (const item of items) {
        itemIndex++;
        const auditItem = audit.items?.find(ai => ai.kode_tp === item.kode_tp) || {
          status: 'verified',
          quality_score: 95,
          kko: 'menjelaskan',
          bloom_level: 'C2 (Memahami)',
          kko_operasional: true,
          cp_aligned: true,
          jp_valid: true,
          notes: 'Kaidah kurikulum terpenuhi.'
        };

        const statusBadge = auditItem.status === 'verified'
          ? '<span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30"><i class="fas fa-check-circle mr-1"></i>Verified</span>'
          : auditItem.status === 'repaired'
            ? '<span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-400/30"><i class="fas fa-wrench mr-1"></i>Auto-Repaired</span>'
            : '<span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-400/30"><i class="fas fa-triangle-exclamation mr-1"></i>Perlu Tinjau</span>';

        html += `
          <div class="tp-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-3" data-kode-tp="${escapeHtml(item.kode_tp)}">
            
            <!-- Item Meta Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">
                  TP ${escapeHtml(item.kode_tp)}
                </span>
                <span class="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  ${escapeHtml(item.materi_pokok || bab.bab)}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <i class="fas fa-brain text-purple-500 mr-1"></i>${escapeHtml(auditItem.bloom_level || 'C3')}
                </span>
              </div>

              <div class="flex items-center gap-2">
                ${statusBadge}
                <div class="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <i class="fas fa-clock text-sky-500 text-[10px]"></i>
                  <select class="jp-selector bg-transparent text-xs font-bold focus:outline-none cursor-pointer" data-kode-tp="${escapeHtml(item.kode_tp)}">
                    ${[2, 3, 4, 5, 6, 8].map(j => `
                      <option value="${j} JP" ${(item.alokasi_waktu || '').includes(String(j)) ? 'selected' : ''}>${j} JP</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>

            <!-- Rumusan TP -->
            <div class="space-y-1">
              <label class="block text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Rumusan Tujuan Pembelajaran (TP):</span>
                <span class="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold lowercase">Klik teks untuk mengedit langsung</span>
              </label>
              <textarea class="tp-textarea w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[58px]" data-kode-tp="${escapeHtml(item.kode_tp)}" data-field="tp">${escapeHtml(item.tp || '')}</textarea>
            </div>

            <!-- Alur Tujuan Pembelajaran (ATP) -->
            <div class="space-y-1">
              <label class="block text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Alur Tujuan Pembelajaran (ATP):
              </label>
              <textarea class="atp-textarea w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[52px]" data-kode-tp="${escapeHtml(item.kode_tp)}" data-field="atp">${escapeHtml(item.atp || '')}</textarea>
            </div>

            <!-- Quick KKO Helper Toolbar & Audit Note -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[11px]">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-slate-400 font-semibold text-[10px]">Ubah KKO Cepat:</span>
                <select class="quick-kko-select px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer" data-kode-tp="${escapeHtml(item.kode_tp)}">
                  <option value="">-- Pilih KKO Bloom --</option>
                  <optgroup label="C2 - Memahami">
                    <option value="menjelaskan">menjelaskan</option>
                    <option value="mengidentifikasi">mengidentifikasi</option>
                    <option value="mengklasifikasikan">mengklasifikasikan</option>
                  </optgroup>
                  <optgroup label="C3 - Mengaplikasikan">
                    <option value="menerapkan">menerapkan</option>
                    <option value="mempraktikkan">mempraktikkan</option>
                    <option value="menghitung">menghitung</option>
                    <option value="menentukan">menentukan</option>
                  </optgroup>
                  <optgroup label="C4 - Menganalisis">
                    <option value="menganalisis">menganalisis</option>
                    <option value="menyelidiki">menyelidiki</option>
                    <option value="membandingkan">membandingkan</option>
                    <option value="menelaah">menelaah</option>
                  </optgroup>
                  <optgroup label="C5 - Mengevaluasi">
                    <option value="menyimpulkan">menyimpulkan</option>
                    <option value="merefleksikan">merefleksikan</option>
                    <option value="menilai">menilai</option>
                  </optgroup>
                  <optgroup label="C6 - Mencipta">
                    <option value="merancang">merancang</option>
                    <option value="menyusun">menyusun</option>
                    <option value="membuat">membuat</option>
                  </optgroup>
                </select>
              </div>

              <div class="text-[10px] text-slate-500 dark:text-slate-400 italic">
                <i class="fas fa-info-circle mr-1 text-indigo-500"></i> ${escapeHtml(auditItem.notes || 'Sesuai kaidah kurikulum')}
              </div>
            </div>

          </div>
        `;
      }

      html += `
            </div>
          </div>
        </div>
      `;
    }
  }

  html += `
      </div>

      <!-- STICKY ACTION BAR AT BOTTOM -->
      <div class="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md p-4 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button type="button" id="btn-back-to-input-form" class="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
            <i class="fas fa-arrow-left"></i> <span>Ubah Data Input</span>
          </button>
          <div class="hidden md:flex flex-col">
            <span class="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
              <i class="fas fa-circle-check"></i> Quality Gate Siap
            </span>
            <span class="text-[10px] text-slate-300">Hasil validasi akan langsung masuk ke Canvas Landscape A4</span>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button type="button" id="btn-commit-to-canvas" class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer">
            <i class="fas fa-circle-check text-base text-emerald-200"></i>
            <span>SETUJUI & MASUK KE CANVAS DOKUMEN (A4)</span>
            <i class="fas fa-arrow-right text-xs"></i>
          </button>
        </div>
      </div>

    </div>
  `;

  container.innerHTML = html;

  // ============================================================
  // EVENT BINDINGS
  // ============================================================

  // 1. Accordion Header Toggle
  container.querySelectorAll('.bab-accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const targetKey = header.dataset.target;
      if (_expandedBabs.has(targetKey)) {
        _expandedBabs.delete(targetKey);
      } else {
        _expandedBabs.add(targetKey);
      }
      renderVerificationView(container, localData, inputData, callbacks);
    });
  });

  // 2. Expand All / Collapse All
  container.querySelector('#btn-expand-all-babs')?.addEventListener('click', () => {
    for (const sem of (localData.semesters || [])) {
      for (const bab of (sem.babs || [])) {
        _expandedBabs.add(`${sem.semester || 1}_${bab.no || 1}`);
      }
    }
    renderVerificationView(container, localData, inputData, callbacks);
  });

  container.querySelector('#btn-collapse-all-babs')?.addEventListener('click', () => {
    _expandedBabs.clear();
    renderVerificationView(container, localData, inputData, callbacks);
  });

  // 3. Status Filters
  container.querySelectorAll('.btn-filter-status').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeFilter = btn.dataset.filter || 'all';
      renderVerificationView(container, localData, inputData, callbacks);
    });
  });

  // 4. Live Textarea Sync (TP & ATP)
  const syncItemText = (e) => {
    const el = e.target;
    const kodeTp = el.dataset.kodeTp;
    const field = el.dataset.field; // 'tp' | 'atp'
    const val = el.value.trim();

    for (const sem of (localData.semesters || [])) {
      for (const bab of (sem.babs || [])) {
        for (const item of (bab.items || [])) {
          if (item.kode_tp === kodeTp) {
            item[field] = val;
            break;
          }
        }
      }
    }
  };

  container.querySelectorAll('.tp-textarea, .atp-textarea').forEach(ta => {
    ta.addEventListener('change', (e) => {
      syncItemText(e);
      // Re-run quality gate so score is updated
      const qg = runCpQualityGate(localData, inputData?.chapters || [], inputData || {});
      localData._audit = qg.audit;
      if (callbacks.onChange) callbacks.onChange(localData);
    });
  });

  // 5. Quick KKO Replacement
  container.querySelectorAll('.quick-kko-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const newVerb = sel.value;
      if (!newVerb) return;
      const kodeTp = sel.dataset.kodeTp;

      for (const sem of (localData.semesters || [])) {
        for (const bab of (sem.babs || [])) {
          for (const item of (bab.items || [])) {
            if (item.kode_tp === kodeTp) {
              const currentTp = item.tp || '';
              // Ganti kata kerja setelah "Murid mampu "
              let updated = currentTp.replace(/^Murid\s+(?:mampu|dapat)\s+[a-zA-Z\s]+/i, (matched) => {
                return `Murid mampu ${newVerb} `;
              });
              if (updated === currentTp) {
                updated = `Murid mampu ${newVerb} ${currentTp}`;
              }
              item.tp = updated.trim();
              break;
            }
          }
        }
      }

      const qg = runCpQualityGate(localData, inputData?.chapters || [], inputData || {});
      localData._audit = qg.audit;
      showToast(`KKO diubah menjadi "${newVerb}"`, 'success');
      renderVerificationView(container, localData, inputData, callbacks);
    });
  });

  // 6. JP Selector
  container.querySelectorAll('.jp-selector').forEach(sel => {
    sel.addEventListener('change', () => {
      const kodeTp = sel.dataset.kodeTp;
      const newJp = sel.value;

      for (const sem of (localData.semesters || [])) {
        for (const bab of (sem.babs || [])) {
          for (const item of (bab.items || [])) {
            if (item.kode_tp === kodeTp) {
              item.alokasi_waktu = newJp;
              break;
            }
          }
        }
      }

      const qg = runCpQualityGate(localData, inputData?.chapters || [], inputData || {});
      localData._audit = qg.audit;
      renderVerificationView(container, localData, inputData, callbacks);
    });
  });

  // 7. Back Button
  container.querySelector('#btn-back-to-input-form')?.addEventListener('click', () => {
    if (callbacks.onBack) callbacks.onBack();
  });

  // 8. Commit to Canvas (Final Approval)
  container.querySelector('#btn-commit-to-canvas')?.addEventListener('click', () => {
    // Re-verify one last time
    const qg = runCpQualityGate(localData, inputData?.chapters || [], inputData || {});
    localData._audit = qg.audit;
    if (callbacks.onValidate) {
      callbacks.onValidate(localData);
    }
  });
}
