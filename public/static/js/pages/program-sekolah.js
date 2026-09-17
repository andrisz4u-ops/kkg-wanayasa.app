import { api } from '../api.js';
import { showToast, showLoading, hideLoading, populateAiModelSelect, renderTahunAjaranOptions, openAiLiveMonitor, closeAiLiveMonitor, streamPost } from '../utils.js';
import { PROGRAM_TEMPLATES } from './program-sekolah/templates.js';
import { renderProgramCanvas, syncCanvasToProgramData } from './program-sekolah/renderers.js';
import { downloadProgramDocx, downloadProgramLampiranOnlyDocx, saveProgramToArchive, openProgramArchiveDrawer } from './program-sekolah/downloaders.js';

let currentProgramData = null;
let currentProgramInput = null;
let selectedTemplateId = 'kokurikuler-p5';
let activeProgramTab = 'all';

/**
 * Render main page HTML layout
 */
export function renderProgramSekolah() {
  return `
    <div class="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="program-sekolah-page">
      
      <!-- Top Header Banner -->
      <div class="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden mb-8 border border-indigo-500/20">
        <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute right-1/4 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-3 backdrop-blur-xs">
              <i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
              <span>Generator Program Sekolah Universal (AI)</span>
              <span class="bg-indigo-500/40 text-[10px] px-1.5 py-0.5 rounded-full font-mono">BSKAP / Merdeka</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Program Kerja & Pembiasaan Sekolah
            </h1>
            <p class="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Susun dokumen program kerja resmi berstruktur BAB ilmiah lengkap (BAB I–V, Lembar Pengesahan, Action Plan 12 Bulan, dan Format Jurnal Siswa dalam 1 file DOCX siap cetak).
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button type="button" id="btn-open-archive"
                    class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-xs transition-all shadow-xs cursor-pointer">
              <i class="fa-solid fa-folder-open text-indigo-300"></i>
              <span>Riwayat Dokumen</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Grid: Form Wizard -->
      <div id="program-wizard-section" class="space-y-8">
        
        <!-- STEP 1 & 2: Identitas & Template Card Selector -->
        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          
          <!-- Step 1: Identitas Satuan Pendidikan -->
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h3 class="font-bold text-slate-900 text-base">Identitas Satuan Pendidikan & Penyusun</h3>
                <p class="text-xs text-slate-500">Informasi ini akan dicetak pada Cover dan Lembar Pengesahan resmi.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Satuan Pendidikan</label>
                <input type="text" id="inp-nama-sekolah" list="program-daftar-sekolah-list" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="SD Negeri ...">
                <datalist id="program-daftar-sekolah-list"></datalist>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <select id="inp-tahun-ajaran" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                  ${renderTahunAjaranOptions()}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Jenjang Pendidikan</label>
                <select id="inp-jenjang" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="Sekolah Dasar (SD)" selected>Sekolah Dasar (SD)</option>
                  <option value="Sekolah Menengah Pertama (SMP)">Sekolah Menengah Pertama (SMP)</option>
                  <option value="Sekolah Menengah Atas/Kejuruan (SMA/SMK)">Sekolah Menengah Atas (SMA)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                <input type="text" id="inp-kota" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" value="Purwakarta">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Penyusun / Koordinator</label>
                <input type="text" id="inp-penyusun" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Nama Guru / Penyusun">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">NIP Penyusun (Opsional)</label>
                <input type="text" id="inp-nip-penyusun" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="NIP. ...">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                <input type="text" id="inp-kepala-sekolah" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Nama Kepala Sekolah">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input type="text" id="inp-nip-kepala-sekolah" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="NIP. ...">
              </div>

              <div class="sm:col-span-2 lg:col-span-4 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                <div>
                  <label class="block text-xs font-bold text-slate-800 mb-0.5">
                    <i class="fa-solid fa-file-signature text-indigo-600 mr-1.5"></i>Format Lembar Pengesahan
                  </label>
                  <p class="text-[11px] text-slate-500">Pilih susunan tanda tangan pengesahan pada dokumen program kerja.</p>
                </div>
                <select id="inp-opsi-pengesahan" class="text-xs rounded-lg border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-500 py-1.5 px-3 font-medium text-slate-800">
                  <option value="lengkap" selected>Format Dinas Lengkap (4 Tanda Tangan: Komite, Penyusun, Pengawas, Kepala Sekolah)</option>
                  <option value="internal">Format Internal Sekolah (2 Tanda Tangan: Penyusun & Kepala Sekolah)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 2: Pilihan Template Program -->
          <div>
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h3 class="font-bold text-slate-900 text-base">Pilih Jenis Program Sekolah</h3>
                <p class="text-xs text-slate-500">Pilih salah satu template program terstruktur di bawah ini.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="template-card-grid">
              ${PROGRAM_TEMPLATES.map(tmpl => `
                <div class="template-card p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${tmpl.id === selectedTemplateId ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'}" 
                     data-id="${tmpl.id}">
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl.gradient} text-white flex items-center justify-center shadow-xs">
                        <i class="fa-solid ${tmpl.icon} text-lg"></i>
                      </div>
                      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        ${tmpl.tag}
                      </span>
                    </div>

                    <h4 class="font-bold text-slate-900 text-sm mb-1 leading-snug">
                      ${tmpl.title}
                    </h4>

                    <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                      ${tmpl.description}
                    </p>
                  </div>

                  <div class="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100 ${tmpl.id === selectedTemplateId ? 'text-indigo-700' : 'text-slate-400'}">
                    <span>${tmpl.id === selectedTemplateId ? '✓ Terpilih' : 'Pilih Template'}</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Step 3: Parameter Spesifik Sesuai Template Terpilih -->
        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200" id="specific-form-box">
          <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">3</div>
            <div>
              <h3 class="font-bold text-slate-900 text-base" id="specific-title">Parameter Khusus Program</h3>
              <p class="text-xs text-slate-500" id="specific-subtitle">Sesuaikan target, fokus kegiatan, dan rincian alokasi program.</p>
            </div>
          </div>

          <div id="dynamic-fields-container" class="space-y-4">
            <!-- Rendered dynamically by updateSpecificFieldsUI() -->
          </div>

          <!-- AI Model Selection, Method Selector & Action Button -->
          <div class="mt-8 pt-6 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-2">
                <label class="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  <i class="fa-solid fa-microchip mr-1 text-indigo-500"></i> Model AI:
                </label>
                <select id="program-ai-model-select" class="text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 min-w-[160px]">
                  <option value="gemini-flash">Gemini 2.5 Flash</option>
                </select>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  <i class="fa-solid fa-layer-group mr-1 text-teal-600"></i> Metode:
                </label>
                <select id="program-generate-mode-select" class="text-xs rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 bg-white font-medium text-slate-800">
                  <option value="section" selected>Bertahap Per-Bab (Rekomendasi - Narasi Kaya & Bebas Potong Token)</option>
                  <option value="full">Sekaligus 1 Kali (Cepat)</option>
                </select>
              </div>
            </div>

            <button type="button" id="btn-generate-program"
                    class="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer">
              <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i>
              <span>Buat Program Sekolah (AI)</span>
            </button>
          </div>

        </div>

      </div>

      <!-- Result Canvas Section (Hidden until generated) -->
      <div id="program-result-section" class="hidden mt-8 space-y-6">
        
        <!-- Sticky Action Toolbar -->
        <div class="sticky top-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shadow-xs">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Dokumen Program Siap</h4>
              <p class="text-[11px] text-slate-500">Format A4 Portrait • Rata Kanan-Kiri • Terintegrasi Lampiran</p>
            </div>
          </div>

          <div class="flex items-center flex-wrap gap-2.5">
            <button type="button" id="btn-back-to-form"
                    class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer">
              <i class="fa-solid fa-sliders"></i>
              <span>Ubah Form</span>
            </button>

            <button type="button" id="btn-save-archive"
                    class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer">
              <i class="fa-regular fa-bookmark"></i>
              <span>Simpan ke Arsip</span>
            </button>

            <button type="button" id="btn-print-canvas"
                    class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
              <i class="fa-solid fa-print"></i>
              <span>Cetak / PDF</span>
            </button>

            <!-- UNDUH LAMPIRAN REFLEKSI & RUBRIK -->
            <button type="button" id="btn-download-lampiran-only"
                    class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="Unduh khusus Lembar Refleksi Diri Murid & Rubrik Asesmen format Word terpisah siap cetak/fotokopi">
              <i class="fa-solid fa-clipboard-check text-teal-600"></i>
              <span>Cetak Refleksi & Rubrik (DOCX)</span>
            </button>

            <!-- PRIMARY DOWNLOAD DOCX BUTTON -->
            <button type="button" id="btn-download-docx"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 active:scale-95 transition-all cursor-pointer">
              <i class="fa-solid fa-file-word text-sm"></i>
              <span>Unduh Program Lengkap (DOCX)</span>
            </button>
          </div>
        </div>

        <!-- Document Canvas Container -->
        <div id="program-canvas" class="program-canvas-container">
          <!-- Rendered by renderProgramCanvas() -->
        </div>

      </div>

    </div>
  `;
}

/**
 * Initialize interactions and bindings
 */
export function initProgramSekolah() {
  const user = window.state?.user || {};
  const settings = window.state?.settings || {};

  // Prefill default identity fields
  const elSekolah = document.getElementById('inp-nama-sekolah');
  if (elSekolah) elSekolah.value = user.sekolah || settings.nama_organisasi || 'SD Negeri Gugus 3 Wanayasa';

  const elPenyusun = document.getElementById('inp-penyusun');
  if (elPenyusun) elPenyusun.value = user.nama || 'Tim Pengembang Kurikulum';

  const elNipPenyusun = document.getElementById('inp-nip-penyusun');
  if (elNipPenyusun && user.nip) elNipPenyusun.value = user.nip;

  const elKs = document.getElementById('inp-kepala-sekolah');
  const elNipKs = document.getElementById('inp-nip-kepala-sekolah');

  // 1. Ambil dari data profil user jika tersedia
  if (elKs && user.kepala_sekolah && user.kepala_sekolah !== 'null') {
    elKs.value = user.kepala_sekolah;
  }
  if (elNipKs && user.nip_kepala_sekolah && user.nip_kepala_sekolah !== 'null') {
    elNipKs.value = user.nip_kepala_sekolah;
  }

  // 2. Deteksi otomatis dari master database sekolah (/api/sekolah)
  async function lookupSchoolHeadmaster(schoolName, forceUpdate = false) {
    if (!schoolName) return;
    try {
      if (!window.__sekolahCache) {
        const res = await api('/sekolah');
        if (res && res.success && Array.isArray(res.data)) {
          window.__sekolahCache = res.data;
        }
      }
      if (window.__sekolahCache) {
        const dataList = document.getElementById('program-daftar-sekolah-list');
        if (dataList && !dataList.children.length) {
          dataList.innerHTML = window.__sekolahCache.map(s => `<option value="${s.nama || ''}"></option>`).join('');
        }
        const cleanTarget = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matched = window.__sekolahCache.find(s => {
          const sName = (s.nama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return sName === cleanTarget || sName.includes(cleanTarget) || cleanTarget.includes(sName);
        });
        if (matched) {
          if (elKs && (forceUpdate || !elKs.value)) {
            if (matched.kepala_sekolah && matched.kepala_sekolah !== 'null') {
              elKs.value = matched.kepala_sekolah;
            }
          }
          if (elNipKs && (forceUpdate || !elNipKs.value)) {
            if (matched.nip_kepala_sekolah && matched.nip_kepala_sekolah !== 'null') {
              elNipKs.value = matched.nip_kepala_sekolah;
            }
          }
        }
      }
    } catch (_) {}
  }

  if (elSekolah?.value) {
    lookupSchoolHeadmaster(elSekolah.value.trim(), false);
  }

  elSekolah?.addEventListener('input', () => {
    lookupSchoolHeadmaster(elSekolah.value.trim(), true);
  });
  elSekolah?.addEventListener('change', () => {
    lookupSchoolHeadmaster(elSekolah.value.trim(), true);
  });

  // Initialize AI Provider Select
  populateAiModelSelect('#program-ai-model-select');

  // Update Dynamic Specific Fields UI
  updateSpecificFieldsUI(selectedTemplateId);

  // Bind Template Card Clicks
  const cards = document.querySelectorAll('.template-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      selectedTemplateId = card.getAttribute('data-id');
      
      // Update UI classes
      cards.forEach(c => {
        const isCurrent = c.getAttribute('data-id') === selectedTemplateId;
        c.className = `template-card p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
          isCurrent ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
        }`;
        const badge = c.querySelector('div.border-t span');
        if (badge) badge.textContent = isCurrent ? '✓ Terpilih' : 'Pilih Template';
      });

      updateSpecificFieldsUI(selectedTemplateId);
    });
  });

  // Global tab switcher for canvas
  window.switchProgramTab = (tab) => {
    activeProgramTab = tab;
    if (currentProgramData) {
      syncCanvasToProgramData(currentProgramData);
      const canvasEl = document.getElementById('program-canvas');
      if (canvasEl) {
        canvasEl.innerHTML = renderProgramCanvas(currentProgramData, activeProgramTab);
        bindCanvasLiveSync();
      }
    }
  };

  // Bind Generate Button
  const btnGen = document.getElementById('btn-generate-program');
  if (btnGen) {
    btnGen.addEventListener('click', handleGenerateProgram);
  }

  // Bind Archive Drawer Button
  const btnArchive = document.getElementById('btn-open-archive');
  if (btnArchive) {
    btnArchive.addEventListener('click', () => {
      openProgramArchiveDrawer((loadedData) => {
        currentProgramData = loadedData;
        showCanvasResult(currentProgramData);
      });
    });
  }

  // Bind Toolbar Buttons
  const btnBack = document.getElementById('btn-back-to-form');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      document.getElementById('program-wizard-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const btnSave = document.getElementById('btn-save-archive');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      if (currentProgramData) {
        syncCanvasToProgramData(currentProgramData);
        await saveProgramToArchive(currentProgramData);
      }
    });
  }

  const btnPrint = document.getElementById('btn-print-canvas');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      if (activeProgramTab !== 'all') {
        window.switchProgramTab('all');
      }
      setTimeout(() => window.print(), 300);
    });
  }

  const btnDocx = document.getElementById('btn-download-docx');
  if (btnDocx) {
    btnDocx.addEventListener('click', async () => {
      if (currentProgramData) {
        syncCanvasToProgramData(currentProgramData);
        await downloadProgramDocx(currentProgramData);
      }
    });
  }

  const btnDocxLampiran = document.getElementById('btn-download-lampiran-only');
  if (btnDocxLampiran) {
    btnDocxLampiran.addEventListener('click', async () => {
      if (currentProgramData) {
        syncCanvasToProgramData(currentProgramData);
        await downloadProgramLampiranOnlyDocx(currentProgramData);
      }
    });
  }

  // Global window functions for Canvas Toolbar & Chapter buttons
  window.downloadProgramLampiranOnlyDocx = async () => {
    if (currentProgramData) {
      syncCanvasToProgramData(currentProgramData);
      await downloadProgramLampiranOnlyDocx(currentProgramData);
    } else {
      showToast('Dokumen belum disusun', 'warning');
    }
  };

  // In-memory snapshot store untuk undo per-section
  const _programSectionSnapshots = {};

  window.regenerateProgramSection = async (section) => {
    if (!currentProgramData) {
      showToast('Dokumen belum disusun. Silakan buat dokumen terlebih dahulu.', 'warning');
      return;
    }

    const sectionLabels = {
      bab1: 'BAB I (Pendahuluan & Dasar Hukum)',
      bab2: 'BAB II (Kajian Konseptual & Profil Lulusan)',
      bab3: 'BAB III (Rencana Aksi & Estimasi RAB)',
      bab4_5: 'BAB IV & V (Monev, Indikator & Penutup)'
    };
    const secLabel = sectionLabels[section] || section;

    if (!confirm(`Apakah Anda ingin menyusun ulang ${secLabel} dengan AI?\nBab ini akan dielaborasi ulang secara mendalam tanpa mengubah bab lainnya.`)) {
      return;
    }

    // ── Snapshot bab sebelum dioverwrite ──────────────────────────────────────
    syncCanvasToProgramData(currentProgramData);
    const snapshotKeys = {
      bab1: ['bab_1_pendahuluan'],
      bab2: ['bab_2_kajian_konseptual'],
      bab3: ['bab_3_rencana_program'],
      bab4_5: ['bab_4_monitoring_evaluasi', 'bab_5_penutup'],
    };
    const keysToSnapshot = snapshotKeys[section] || [];
    _programSectionSnapshots[section] = {};
    keysToSnapshot.forEach(k => {
      if (currentProgramData[k] !== undefined) {
        _programSectionSnapshots[section][k] = JSON.parse(JSON.stringify(currentProgramData[k]));
      }
    });
    // ─────────────────────────────────────────────────────────────────────────

    showLoading(`Menyusun ulang ${secLabel} dengan AI...`);
    try {
      const aiProvider = document.getElementById('program-ai-model-select')?.value || 'gemini-flash';
      const payload = {
        template: currentProgramData.metadata?.template_id || selectedTemplateId,
        identitas: {
          namaSekolah: currentProgramData.metadata?.nama_sekolah,
          tahunAjaran: currentProgramData.metadata?.tahun_ajaran,
          jenjang: currentProgramData.metadata?.fase_jenjang,
          kota: currentProgramData.metadata?.kota,
          penyusun: currentProgramData.metadata?.penyusun,
          nipPenyusun: currentProgramData.metadata?.nip_penyusun,
          kepalaSekolah: currentProgramData.metadata?.kepala_sekolah,
          nipKepalaSekolah: currentProgramData.metadata?.nip_kepala_sekolah,
          opsiPengesahan: currentProgramData.metadata?.opsi_pengesahan,
        },
        spesifik: currentProgramInput?.spesifik || {},
        section,
        aiProvider,
        currentData: currentProgramData
      };

      const res = await api('/program-sekolah/generate-section', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.data && res.data.mergedData) {
        currentProgramData = res.data.mergedData;
        const canvasEl = document.getElementById('program-canvas');
        if (canvasEl) {
          canvasEl.innerHTML = renderProgramCanvas(currentProgramData, activeProgramTab);
          bindCanvasLiveSync();
        }
        // Toast dengan tombol Undo (10 detik)
        showUndoableToast(
          `${secLabel} berhasil diperbarui!`,
          () => {
            // Restore snapshot
            const snap = _programSectionSnapshots[section];
            if (snap) {
              Object.assign(currentProgramData, snap);
              delete _programSectionSnapshots[section];
              const canvas = document.getElementById('program-canvas');
              if (canvas) {
                canvas.innerHTML = renderProgramCanvas(currentProgramData, activeProgramTab);
                bindCanvasLiveSync();
              }
              showToast(`${secLabel} dikembalikan ke versi sebelumnya.`, 'info');
            }
          }
        );
      } else {
        throw new Error(res?.message || 'Respons server tidak valid');
      }
    } catch (err) {
      console.error('Regenerate Section Error:', err);
      // Auto-restore snapshot jika gagal
      const snap = _programSectionSnapshots[section];
      if (snap && Object.keys(snap).length > 0) {
        Object.assign(currentProgramData, snap);
        delete _programSectionSnapshots[section];
        const canvas = document.getElementById('program-canvas');
        if (canvas) {
          canvas.innerHTML = renderProgramCanvas(currentProgramData, activeProgramTab);
          bindCanvasLiveSync();
        }
        showToast(`Gagal menyusun ulang ${secLabel}. Konten bab sebelumnya dipulihkan otomatis.`, 'error');
      } else {
        showToast(err.message || `Gagal menyusun ulang ${secLabel}`, 'error');
      }
    } finally {
      hideLoading();
    }
  };

  /**
   * Toast dengan tombol Undo yang menghilang otomatis setelah 10 detik
   */
  function showUndoableToast(message, onUndo) {
    // Hapus toast undo sebelumnya jika ada
    const prev = document.getElementById('_undo-toast');
    if (prev) prev.remove();

    const el = document.createElement('div');
    el.id = '_undo-toast';
    el.style.cssText = `
      position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
      background: #1e293b; color: #f8fafc; border-radius: 0.75rem;
      padding: 0.75rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;
      z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,0.35); max-width: 480px;
      font-size: 0.875rem; animation: slideUpFadeIn 0.3s ease;
    `;
    el.innerHTML = `
      <span style="flex:1">${message}</span>
      <button id="_undo-btn" style="
        background:#6366f1; color:#fff; border:none; border-radius:0.5rem;
        padding:0.35rem 0.9rem; font-weight:600; cursor:pointer; white-space:nowrap;
        font-size:0.8rem;
      ">↩ Urungkan</button>
      <div id="_undo-countdown" style="
        width:8px; height:8px; border-radius:50%; background:#6366f1; flex-shrink:0;
        animation: countdownShrink 10s linear forwards;
      "></div>
    `;
    document.body.appendChild(el);

    // CSS keyframes jika belum ada
    if (!document.getElementById('_undo-toast-styles')) {
      const style = document.createElement('style');
      style.id = '_undo-toast-styles';
      style.textContent = `
        @keyframes slideUpFadeIn { from { opacity:0; transform: translateX(-50%) translateY(12px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
        @keyframes countdownShrink { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }

    const closeToast = () => {
      if (el.parentNode) { el.style.opacity = '0'; setTimeout(() => el.remove(), 200); }
    };

    const timer = setTimeout(closeToast, 10000);

    el.querySelector('#_undo-btn').addEventListener('click', () => {
      clearTimeout(timer);
      closeToast();
      onUndo();
    });
  }
}

/**
 * Render dynamic specific form fields based on chosen template
 */
function updateSpecificFieldsUI(tmplId) {
  const tmpl = PROGRAM_TEMPLATES.find(t => t.id === tmplId) || PROGRAM_TEMPLATES[0];
  const container = document.getElementById('dynamic-fields-container');
  const titleEl = document.getElementById('specific-title');
  const subEl = document.getElementById('specific-subtitle');

  if (titleEl) titleEl.textContent = `Parameter Khusus: ${tmpl.title}`;
  if (subEl) subEl.textContent = tmpl.description;

  if (!container) return;

  container.innerHTML = tmpl.fields.map(f => {
    if (f.type === 'select') {
      return `
        <div>
          <label class="block text-xs font-semibold text-slate-800 mb-1">${f.label}</label>
          <select id="field-${f.id}" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
            ${f.options.map(opt => `<option value="${opt}" ${opt === f.default ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
          ${f.hint ? `<p class="text-[11px] text-slate-400 mt-1">${f.hint}</p>` : ''}
        </div>
      `;
    } else if (f.type === 'textarea') {
      return `
        <div>
          <label class="block text-xs font-semibold text-slate-800 mb-1">${f.label}</label>
          <textarea id="field-${f.id}" rows="3" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="${f.default || ''}">${f.default || ''}</textarea>
          ${f.hint ? `<p class="text-[11px] text-slate-400 mt-1">${f.hint}</p>` : ''}
        </div>
      `;
    } else {
      return `
        <div>
          <label class="block text-xs font-semibold text-slate-800 mb-1">${f.label}</label>
          <input type="text" id="field-${f.id}" class="w-full text-xs rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" value="${f.default || ''}">
          ${f.hint ? `<p class="text-[11px] text-slate-400 mt-1">${f.hint}</p>` : ''}
        </div>
      `;
    }
  }).join('');
}

/**
 * Handle AI Generation with SSE Streaming Monitor
 */
async function handleGenerateProgram() {
  const namaSekolah = document.getElementById('inp-nama-sekolah')?.value?.trim();
  const tahunAjaran = document.getElementById('inp-tahun-ajaran')?.value?.trim();
  const jenjang = document.getElementById('inp-jenjang')?.value?.trim();
  const kota = document.getElementById('inp-kota')?.value?.trim() || 'Purwakarta';
  const penyusun = document.getElementById('inp-penyusun')?.value?.trim();
  const nipPenyusun = document.getElementById('inp-nip-penyusun')?.value?.trim();
  const kepalaSekolah = document.getElementById('inp-kepala-sekolah')?.value?.trim();
  const nipKepalaSekolah = document.getElementById('inp-nip-kepala-sekolah')?.value?.trim();
  const opsiPengesahan = document.getElementById('inp-opsi-pengesahan')?.value || 'lengkap';
  const aiProvider = document.getElementById('program-ai-model-select')?.value || 'gemini-flash';
  const generateMode = document.getElementById('program-generate-mode-select')?.value || 'section';

  if (!namaSekolah) {
    showToast('Nama Satuan Pendidikan wajib diisi', 'error');
    return;
  }

  // Collect specific fields
  const tmpl = PROGRAM_TEMPLATES.find(t => t.id === selectedTemplateId);
  const spesifik = {};
  if (tmpl) {
    tmpl.fields.forEach(f => {
      const el = document.getElementById(`field-${f.id}`);
      if (el) spesifik[f.id] = el.value.trim();
    });
  }

  currentProgramInput = {
    template: selectedTemplateId,
    identitas: {
      namaSekolah,
      tahunAjaran,
      jenjang,
      kota,
      penyusun: penyusun || 'Tim Pengembang Kurikulum',
      nipPenyusun,
      kepalaSekolah,
      nipKepalaSekolah,
      opsiPengesahan,
    },
    spesifik,
    aiProvider,
  };

  // Launch AI Live Monitor
  const monitor = openAiLiveMonitor({
    title: 'Menyusun Dokumen Program Sekolah',
    subtitle: `${tmpl?.title || 'Program Kerja'} • ${generateMode === 'section' ? 'Mode Bertahap Per-Bab (Detail Maksimal)' : 'Mode Penuh'}`,
    steps: [
      { id: 1, label: 'BAB I', icon: 'fa-book-open' },
      { id: 2, label: 'BAB II', icon: 'fa-graduation-cap' },
      { id: 3, label: 'BAB III & RAB', icon: 'fa-calendar-check' },
      { id: 4, label: 'BAB IV & V', icon: 'fa-clipboard-list' },
      { id: 5, label: 'Finalisasi', icon: 'fa-file-circle-check' },
    ],
    onCancel: () => {
      showToast('Penyusunan program dibatalkan', 'info');
    },
  });

  // JIKA MEMILIH MODE BERTAHAP PER-BAB (REKOMENDASI: BEBAS LIMIT TOKEN & NARASI MENDALAM)
  if (generateMode === 'section') {
    await handleGenerateBySections(monitor, currentProgramInput, tmpl);
    return;
  }

  let rawGeneratedResult = null;

  try {
    await streamPost('/program-sekolah/generate-stream', currentProgramInput, (event, payload) => {
      if (event === 'step') {
        monitor.updateStep(payload.step, payload.title, payload.message, payload.percent);
      } else if (event === 'token') {
        monitor.appendToken(payload.text || '');
      } else if (event === 'done') {
        rawGeneratedResult = payload;
      } else if (event === 'error') {
        throw new Error(payload.message || 'Gagal menghasilkan dokumen');
      }
    });

    if (rawGeneratedResult) {
      monitor.complete(() => {
        currentProgramData = rawGeneratedResult;
        showCanvasResult(currentProgramData);
        showToast('Dokumen Program Kerja berhasil disusun secara lengkap!', 'success');
      });
    } else {
      throw new Error('Hasil respon AI kosong');
    }
  } catch (streamErr) {
    console.warn('SSE stream failed or interrupted, falling back to direct JSON:', streamErr);
    
    // Direct JSON Fallback
    try {
      monitor.updateStep(3, 'Mengalihkan ke Mode Buffer...', 'Menyelesaikan penyusunan program via jalur stabil...', 80);
      
      const res = await fetch('/api/program-sekolah/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProgramInput),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal menghasilkan dokumen program');
      }

      const jsonRes = await res.json();
      currentProgramData = jsonRes.data;

      monitor.complete(() => {
        showCanvasResult(currentProgramData);
        showToast('Dokumen Program Kerja berhasil disusun!', 'success');
      });
    } catch (fallbackErr) {
      monitor.close();
      showToast(fallbackErr.message || 'Gagal menyusun program sekolah', 'error');
    }
  }
}

/**
 * Handle Granular AI Generation per Chapter (Mengatasi Batasan Token & Narasi Lebih Mendalam)
 */
async function handleGenerateBySections(monitor, baseInput, tmpl) {
  const sections = [
    { key: 'bab1', name: 'BAB I (Pendahuluan & Dasar Hukum)', step: 1, percent: 20 },
    { key: 'bab2', name: 'BAB II (Kajian Konseptual & Profil Lulusan)', step: 2, percent: 45 },
    { key: 'bab3', name: 'BAB III (Rencana Aksi & Estimasi RAB)', step: 3, percent: 70 },
    { key: 'bab4_5', name: 'BAB IV & V (Monev, Indikator & Penutup)', step: 4, percent: 90 },
  ];

  // ── Kata Pengantar Dinamis Per-Template ────────────────────────────────────
  const judul = baseInput.spesifik?.judul_kegiatan || tmpl?.defaultJudul || `PROGRAM ${(tmpl?.title || 'KERJA SEKOLAH').toUpperCase()}`;
  const namaSekolah = baseInput.identitas?.namaSekolah || 'satuan pendidikan kami';
  const tahunAjaran = baseInput.identitas?.tahunAjaran || '2025/2026';
  const kepalaSekolah = baseInput.identitas?.kepalaSekolah || 'Kepala Sekolah';

  // Paragraf 1: kontekstual per template
  const kataP1Map = {
    'kokurikuler-p5': `Puji syukur ke hadirat Tuhan Yang Maha Esa atas terselesaikannya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program ini merupakan perwujudan nyata komitmen satuan pendidikan dalam memperkuat 8 Dimensi Profil Lulusan sebagaimana amanat SK BSKAP No. 058/H/KR/2025 dan Permendikdasmen No. 13 Tahun 2025 tentang Kurikulum Merdeka.`,
    '7kaih': `Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) ini merupakan wujud nyata harmonisasi antara kebijakan karakter nasional dan falsafah budaya lokal Purwakarta "7 Poé Atikan Purwakarta Istimewa" demi membentuk murid yang berkarakter, sehat, dan berprestasi.`,
    'hari-belajar-guru': `Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program Hari Belajar Guru (HBG) dan Komunitas Belajar (Kombel) ini merupakan ikhtiar kolektif dalam meningkatkan kompetensi, refleksi praksis, dan kolaborasi profesional seluruh pendidik demi mutu pembelajaran yang terus berkembang.`,
    'literasi': `Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program Gerakan Literasi Sekolah (GLS) ini merupakan respons strategis terhadap capaian literasi pada Rapor Pendidikan sekolah, sekaligus upaya membangun budaya membaca yang mengakar dan membekali murid dengan kecakapan literasi abad ke-21.`,
    'uks': `Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program UKS dan Sekolah Sehat ini merupakan implementasi Trias UKS yang holistik, disinergikan dengan Gerakan Sekolah Sehat Kemendikdasmen demi mewujudkan murid yang sehat fisik, jiwa, dan lingkungan belajarnya.`,
    'adiwiyata': `Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program Adiwiyata dan Lingkungan Hidup Berkelanjutan ini merupakan wujud integrasi Program Berbudaya Lingkungan Hidup di Sekolah (PBLHS) dengan kearifan lokal Program Tatanen di Bale Atikan (TdBA) khas Purwakarta, demi membentuk insan yang peduli dan berwawasan lingkungan.`,
    'keagamaan': `Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program Pembiasaan Keagamaan dan Akhlak Mulia ini merupakan upaya memperkuat fondasi spiritual dan moral murid melalui habituasi ibadah yang konsisten, keteladanan guru, serta penguatan moderasi beragama di lingkungan satuan pendidikan.`,
  };
  const kataP1 = kataP1Map[baseInput.template] || `Puji syukur ke hadirat Tuhan Yang Maha Esa atas terselesaikannya dokumen ${judul} Tahun Ajaran ${tahunAjaran} di ${namaSekolah}. Program kerja ini disusun sebagai panduan strategis dan operasional untuk meningkatkan mutu pendidikan, membangun karakter murid, dan menggerakkan ekosistem belajar yang kondusif dan bermakna.`;

  let accumulated = {
    metadata: {
      template_id: baseInput.template,
      judul_program: judul,
      nama_sekolah: namaSekolah,
      tahun_ajaran: tahunAjaran,
      fase_jenjang: baseInput.identitas?.jenjang,
      kota: baseInput.identitas?.kota,
      penyusun: baseInput.identitas?.penyusun,
      nip_penyusun: baseInput.identitas?.nipPenyusun,
      kepala_sekolah: kepalaSekolah,
      nip_kepala_sekolah: baseInput.identitas?.nipKepalaSekolah,
      opsi_pengesahan: baseInput.identitas?.opsiPengesahan,
      tanggal_pengesahan: `14 Juli ${tahunAjaran.split('/')[0] || '2025'}`,
    },
    kata_pengantar: [
      kataP1,
      `Dokumen program kerja ini disusun secara sistematis, ilmiah, dan operasional mengacu pada regulasi resmi yang berlaku, mulai dari Undang-Undang Sistem Pendidikan Nasional hingga kebijakan kurikulum terkini. Setiap rencana kegiatan dirancang berbasis data, berorientasi pada capaian murid yang terukur, dan berlandaskan prinsip tata kelola sekolah yang transparan dan akuntabel.`,
      `Kami mengucapkan terima kasih yang sebesar-besarnya kepada Bapak/Ibu ${kepalaSekolah} selaku Kepala Sekolah yang telah memberikan arahan dan dukungan penuh, kepada seluruh Dewan Guru, Tenaga Kependidikan, Komite Sekolah, serta para orang tua murid yang telah berkontribusi aktif. Kritik dan saran konstruktif senantiasa kami sambut dengan tangan terbuka demi penyempurnaan program di tahun-tahun mendatang.`
    ]
  };

  try {
    for (const sec of sections) {
      monitor.updateStep(sec.step, `Menyusun ${sec.name}`, `AI sedang menyusun narasi mendalam untuk ${sec.name}...`, sec.percent);
      monitor.appendToken(`\n=== [Bagian ${sec.step}/4] Menyusun ${sec.name} ===\n`);

      const res = await api('/program-sekolah/generate-section', {
        method: 'POST',
        body: JSON.stringify({
          template: baseInput.template,
          identitas: baseInput.identitas,
          spesifik: baseInput.spesifik,
          section: sec.key,
          aiProvider: baseInput.aiProvider,
          currentData: accumulated
        })
      });

      if (!res || !res.data || !res.data.mergedData) {
        throw new Error(res?.message || `Gagal menyusun ${sec.name}`);
      }

      accumulated = { ...accumulated, ...res.data.mergedData };
      monitor.appendToken(`[SUKSES] ${sec.name} berhasil disusun tanpa terpotong batas token.\n`);
    }

    monitor.updateStep(5, 'Finalisasi Dokumen Program', 'Mengintegrasikan instrumen asesmen dan lembar refleksi...', 98);

    monitor.complete(() => {
      currentProgramData = accumulated;
      showCanvasResult(currentProgramData);
      showToast('Dokumen Program Kerja (Semua Bab) berhasil disusun secara bertahap dengan narasi komprehensif!', 'success');
    });
  } catch (err) {
    console.error('Generate by Section Error:', err);
    monitor.close();
    showToast(err.message || 'Gagal menyusun program secara bertahap', 'error');
  }
}


/**
 * Display canvas result and scroll into view
 */
function showCanvasResult(data) {
  const resultSec = document.getElementById('program-result-section');
  const canvasEl = document.getElementById('program-canvas');
  if (!resultSec || !canvasEl) return;

  resultSec.classList.remove('hidden');
  canvasEl.innerHTML = renderProgramCanvas(data, activeProgramTab);
  bindCanvasLiveSync();

  resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Bind live input listener for contenteditable fields
 */
function bindCanvasLiveSync() {
  const editableFields = document.querySelectorAll('#program-canvas [contenteditable="true"]');
  editableFields.forEach(f => {
    f.addEventListener('blur', () => {
      if (currentProgramData) {
        syncCanvasToProgramData(currentProgramData);
      }
    });
  });
}
