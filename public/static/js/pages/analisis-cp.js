import { showToast, showLoading, hideLoading, escapeHtml, populateAiModelSelect, getActiveAiProviders, renderTahunAjaranOptions, detectUserDefaultKelas, openAiLiveMonitor, closeAiLiveMonitor, streamPost } from '../utils.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { renderLockedFeature } from '../components.js';
import { saveDocArchive } from '../storage-archive.js';

// Modul Terpisah Analisis CP
import { fetchStandardChapters, loadPdfJsScript, parseChaptersHeuristically } from './analisis-cp/helpers.js';
import { validateAndRepairAnalysisData } from './analisis-cp/validator.js';
import { renderAnalysisCanvas, syncCanvasToAnalysisData, applyPrintOrientation } from './analisis-cp/renderers.js';
import { downloadDocx, downloadAllDocs, saveToDatabase, openAnalisisArchiveDrawer } from './analisis-cp/downloaders.js';

// State lokal untuk sesi Analisis CP
let currentAnalysisData = null;
let currentInputData = null;
let detectedChapters = [];
let isCustomPdfUploaded = false;
let activeAnalysisTab = 'analisis'; // 'analisis' | 'prota' | 'promes' | 'rpe' | 'kktp'
let activePromesSemester = 'all'; // 'all' | 1 | 2

function handleSemesterChange(newSem) {
  activePromesSemester = newSem;
  renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
}

export async function renderAnalisisCp() {
  if (!state.user) {
    return renderLockedFeature(
      'Generator Analisis CP, TP, dan ATP (AI)',
      'Fitur ini khusus untuk pendidik terdaftar. Silakan login untuk menyusun Analisis Capaian Pembelajaran, Tujuan Pembelajaran, dan Alur Tujuan Pembelajaran otomatis dari buku teks/ebook sekolah Anda.',
      ['Ekstraksi Otomatis Buku Teks PDF', 'Sinkronisasi CP Resmi BSKAP 046/2025', 'Format Dokumen Resmi Landscape A4', 'Ekspor ke Microsoft Word (.docx) & Siap Cetak']
    );
  }

  const defaultK = detectUserDefaultKelas(state.user);
  const defaultFase = (defaultK <= 2) ? 'A' : (defaultK <= 4) ? 'B' : 'C';
  const defaultKsNama = (state.user?.kepala_sekolah && state.user.kepala_sekolah !== 'null') ? state.user.kepala_sekolah : '';
  const defaultKsNip = (state.user?.nip_kepala_sekolah && state.user.nip_kepala_sekolah !== 'null') ? state.user.nip_kepala_sekolah : '';

  let activeProviders = [];
  try {
    activeProviders = await getActiveAiProviders();
  } catch (_) {}

  const aiOptionsHtml = (activeProviders && activeProviders.length > 0)
    ? activeProviders.map((p, idx) => `<option value="${escapeHtml(p.slug)}" ${idx === 0 ? 'selected' : ''}>${escapeHtml(p.name)} (${escapeHtml(p.model)})</option>`).join('')
    : `
      <option value="awz" selected>awz (deepseek.v3.2)</option>
      <option value="claude-anthropic">Claude (claude-haiku)</option>
      <option value="nvi">Nvi (nemotron-3)</option>
      <option value="mistral-medium">Mistral (mistral-medium-latest)</option>
    `;

  return `
    <div class="animate-fade-in" id="analisis-cp-page">
      <!-- FORM & WIZARD VIEW -->
      <div id="analisis-form-view">
        <!-- Header -->
        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-xl">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/30">
              <i class="fas fa-book-bookmark"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Kurikulum Merdeka • BSKAP No. 046/2025
                </span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">ANALISIS <span class="bg-gradient-to-r from-indigo-400 to-sky-300 bg-clip-text text-transparent">CP, TP, & ATP</span></h1>
              <p class="text-xs sm:text-sm text-slate-300">Ekstraksi materi buku ajar guru/siswa menjadi pemetaan CP, TP, dan ATP resmi siap cetak</p>
            </div>
          </div>
          <button type="button" id="btn-analisis-archive" class="px-5 py-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer">
            <i class="fas fa-folder-open text-amber-400"></i> Riwayat Tersimpan
          </button>
        </div>

        <!-- Form Utama 3 Kartu (Grid 3 Kolom Responsif) -->
        <form id="analisis-cp-form" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

          <!-- KARTU 1: IDENTITAS DOKUMEN -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div class="flex items-center gap-2.5">
                  <span class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shadow-2xs">1</span>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Identitas Dokumen</h3>
                    <p class="text-[10.5px] text-slate-400 font-medium">Satuan pendidikan & kurikulum</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 text-[9.5px] font-extrabold uppercase border border-indigo-200/50">BSKAP 046</span>
              </div>

              <div class="space-y-3.5">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SATUAN PENDIDIKAN</label>
                  <input type="text" id="input-nama-sekolah" name="namaSekolah" list="daftar-sekolah-list" value="${escapeHtml(state.user?.sekolah_nama || state.user?.sekolah || '')}" required placeholder="Pilih / ketik nama sekolah..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <datalist id="daftar-sekolah-list"></datalist>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">MATA PELAJARAN</label>
                    <select name="mataPelajaran" id="select-mata-pelajaran" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="Pendidikan Agama dan Budi Pekerti">Pendidikan Agama dan Budi Pekerti</option>
                      <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                      <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                      <option value="Matematika">Matematika</option>
                      <option value="Ilmu Pengetahuan Alam dan Sosial (IPAS)" selected>Ilmu Pengetahuan Alam dan Sosial (IPAS)</option>
                      <option value="Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)">Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)</option>
                      <option value="Bahasa Inggris">Bahasa Inggris</option>
                      <option value="Seni Rupa">Seni Rupa</option>
                      <option value="Koding dan Kecerdasan Artifisial">Koding dan Kecerdasan Artifisial</option>
                      <option value="B.Sunda">Bahasa Sunda (Mulok)</option>
                      <option value="Tatanen di Bale Atikan">Tatanen di Bale Atikan (TdBA)</option>
                      <option value="AKPK">AKPK Purwakarta</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">KELAS / FASE</label>
                    <select name="jenjangKelas" id="select-jenjang-kelas" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="Kelas 1" ${defaultK === 1 ? 'selected' : ''}>Kelas 1 (Fase A)</option>
                      <option value="Kelas 2" ${defaultK === 2 ? 'selected' : ''}>Kelas 2 (Fase A)</option>
                      <option value="Kelas 3" ${defaultK === 3 ? 'selected' : ''}>Kelas 3 (Fase B)</option>
                      <option value="Kelas 4" ${defaultK === 4 ? 'selected' : ''}>Kelas 4 (Fase B)</option>
                      <option value="Kelas 5" ${defaultK === 5 ? 'selected' : ''}>Kelas 5 (Fase C)</option>
                      <option value="Kelas 6" ${defaultK === 6 ? 'selected' : ''}>Kelas 6 (Fase C)</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">TAHUN AJARAN</label>
                    <select name="tahunAjaran" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      ${renderTahunAjaranOptions()}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">TARGET SEMESTER</label>
                    <select name="targetSemester" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="all" selected>Setahun Penuh (Smt 1 & 2)</option>
                      <option value="1">Semester 1 Saja</option>
                      <option value="2">Semester 2 Saja</option>
                    </select>
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Kepala Sekolah</label>
                      <input type="text" id="input-nama-kepala-sekolah" name="namaKepalaSekolah" value="${escapeHtml(defaultKsNama)}" placeholder="Nama Kepala Sekolah" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-1 focus:ring-indigo-400">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">NIP Kepala Sekolah</label>
                      <input type="text" id="input-nip-kepala-sekolah" name="nipKepalaSekolah" value="${escapeHtml(defaultKsNip)}" placeholder="19xxxxxxxxxxxx" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-1 focus:ring-indigo-400">
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 mt-2.5">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Guru Pengampu</label>
                      <input type="text" name="namaGuru" value="${escapeHtml(state.user?.nama || '')}" required class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-1 focus:ring-indigo-400">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">NIP Guru</label>
                      <input type="text" name="nipGuru" value="${escapeHtml(state.user?.nip || '')}" placeholder="19xxxxxxxxxxxx" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-1 focus:ring-indigo-400">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">MESIN KECERDASAN ARTIFISIAL (AI)</label>
              <select name="aiProvider" id="analisis-ai-model-select" class="w-full px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-950 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                ${aiOptionsHtml}
              </select>
            </div>
          </div>

          <!-- KARTU 2: SUMBER BUKU TEKS (PDF / DAFTAR ISI) -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div class="flex items-center gap-2.5">
                  <span class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shadow-2xs">2</span>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Sumber Buku Ajar</h3>
                    <p class="text-[10.5px] text-slate-400 font-medium">Unggah PDF atau tempel teks</p>
                  </div>
                </div>
                <!-- Tabs: PDF vs Manual -->
                <div class="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                  <button type="button" id="tab-btn-pdf" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs transition-all text-[11px]">
                    <i class="fas fa-file-pdf mr-1 text-rose-500"></i> PDF
                  </button>
                  <button type="button" id="tab-btn-text" class="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all text-[11px]">
                    <i class="fas fa-align-left mr-1 text-sky-500"></i> Teks
                  </button>
                </div>
              </div>

              <div class="mb-3.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">JUDUL BUKU TEKS RUJUKAN</label>
                <input type="text" name="sumberBuku" id="input-sumber-buku" value="Buku Siswa Ilmu Pengetahuan Alam dan Sosial (IPAS) Kelas V (Kemendikbudristek)" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>

              <!-- VIEW TAB 1: UPLOAD PDF DROPZONE -->
              <div id="tab-view-pdf" class="space-y-3">
                <div id="pdf-dropzone" class="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all group">
                  <input type="file" id="pdf-file-input" accept="application/pdf" class="hidden">
                  <div class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-rose-500 flex items-center justify-center text-xl mx-auto mb-2.5 shadow-sm group-hover:scale-110 transition-transform">
                    <i class="fas fa-cloud-arrow-up text-indigo-600 dark:text-indigo-400"></i>
                  </div>
                  <h4 class="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-1">Klik / Tarik Buku PDF ke Sini</h4>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 leading-snug">Mendukung Buku Guru / Buku Siswa PDF hingga 100MB</p>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                    <i class="fas fa-bolt text-amber-500"></i> Ekstraksi Otomatis Halaman Daftar Isi
                  </span>
                </div>

                <!-- PDF Status Bar -->
                <div id="pdf-progress-bar" class="hidden p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span id="pdf-status-text" class="flex items-center gap-1.5 text-[11px]">
                      <i class="fas fa-spinner fa-spin text-indigo-500"></i> Membaca PDF...
                    </span>
                    <span id="pdf-progress-percent" class="text-[11px]">0%</span>
                  </div>
                  <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div id="pdf-progress-fill" class="bg-gradient-to-r from-indigo-500 to-sky-500 h-full w-0 transition-all duration-300"></div>
                  </div>
                </div>
              </div>

              <!-- VIEW TAB 2: MANUAL TEXTAREA -->
              <div id="tab-view-text" class="hidden space-y-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SALIN & TEMPEL DAFTAR ISI ATAU MATERI POKOK</label>
                  <textarea id="input-daftar-isi-text" rows="6" placeholder="Contoh format:&#10;Bab 1: Cahaya dan Bunyi&#10;- Sifat Cahaya&#10;- Bagian Mata&#10;&#10;Bab 2: Harmoni dalam Ekosistem&#10;- Rantai Makanan&#10;- Ekosistem Alami" class="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
                </div>
                <button type="button" id="btn-extract-from-text" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fas fa-wand-magic-sparkles"></i> Ekstrak Struktur Bab dengan AI
                </button>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
              <i class="fas fa-circle-info text-indigo-600 mt-0.5 shrink-0"></i>
              <span class="leading-relaxed">Sistem secara cerdas mengisolasi lembar <strong>Daftar Isi</strong> pada file PDF agar bab dan submateri terekstrak akurat dan cepat.</span>
            </div>
          </div>

          <!-- KARTU 3: STAGING BAB & GENERATOR -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div class="flex items-center gap-2.5">
                  <span class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shadow-2xs">3</span>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Review Struktur Bab</h3>
                    <p class="text-[10.5px] text-slate-400 font-medium">Atur & sesuaikan semester sebelum generate</p>
                  </div>
                </div>
                <span id="badge-total-bab" class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold">
                  0 Bab
                </span>
              </div>

              <!-- List Bab Dinamis yang Siap Dianalisis -->
              <div id="chapters-list-container" class="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                <div id="empty-chapters-notice" class="text-center py-8 text-slate-400 dark:text-slate-500">
                  <i class="fas fa-book-open text-3xl mb-2 opacity-50 block"></i>
                  <p class="text-xs">Belum ada bab yang dimuat. Silakan unggah PDF atau tempel teks daftar isi di Kartu 2.</p>
                </div>
              </div>
            </div>

            <div class="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" id="btn-add-bab" class="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <i class="fas fa-plus text-xs"></i> Tambah Bab Manual
              </button>

              <button type="submit" id="btn-submit-generate" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                <i class="fas fa-bolt text-amber-400 text-base"></i> Susun Analisis CP, TP & ATP Sekarang
              </button>
            </div>
          </div>

        </form>
      </div>

      <!-- HASIL / RESULT VIEW (CANVAS LANDSCAPE A4) -->
      <div id="analisis-result-view" class="hidden">
        <!-- Floating Result Toolbar -->
        <div class="sticky top-20 z-20 mb-6 bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
          <div class="flex items-center gap-3">
            <button type="button" id="btn-back-to-form" class="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <i class="fas fa-arrow-left"></i> <span class="hidden sm:inline">Ubah Data</span>
            </button>
            
            <!-- Tab View Dokumen: Analisis CP vs Prota vs Promes vs KKTP -->
            <div id="analisis-view-tabs" class="flex p-1 rounded-xl bg-slate-800/90 text-xs font-bold border border-slate-700/60">
              <button type="button" data-tab="analisis" class="analisis-tab-btn active px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-indigo-600 text-white shadow-sm flex items-center gap-1.5">
                <i class="fas fa-table-columns"></i> <span>Analisis CP</span>
              </button>
              <button type="button" data-tab="prota" class="analisis-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5">
                <i class="fas fa-calendar-check text-sky-400"></i> <span>Prota</span>
              </button>
              <button type="button" data-tab="promes" class="analisis-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5">
                <i class="fas fa-calendar-days text-amber-400"></i> <span>Promes</span>
              </button>
              <button type="button" data-tab="rpe" class="analisis-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5">
                <i class="fas fa-calendar-week text-purple-400"></i> <span>RPE</span>
              </button>
              <button type="button" data-tab="kktp" class="analisis-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5">
                <i class="fas fa-list-check text-emerald-400"></i> <span>KKTP</span>
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <!-- Zoom Controls -->
            <div class="hidden md:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <button type="button" id="btn-zoom-out" class="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-300" title="Zoom Out"><i class="fas fa-minus text-[10px]"></i></button>
              <span id="zoom-level-text" class="px-1 text-[11px] font-mono font-bold text-slate-300">100%</span>
              <button type="button" id="btn-zoom-in" class="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-300" title="Zoom In"><i class="fas fa-plus text-[10px]"></i></button>
              <button type="button" id="btn-zoom-reset" class="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-400 text-[10px]" title="Reset Zoom">1:1</button>
            </div>

            <!-- Print Button -->
            <button type="button" id="btn-print-analisis" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Cetak Dokumen">
              <i class="fas fa-print"></i> <span class="hidden sm:inline">Cetak / PDF</span>
            </button>

            <!-- Save DB Button -->
            <button type="button" id="btn-save-analisis" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Simpan ke Arsip Sekolah">
              <i class="fas fa-floppy-disk text-amber-400"></i> <span class="hidden sm:inline">Simpan</span>
            </button>

            <!-- Download Single Docx Button -->
            <button type="button" id="btn-download-docx" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer">
              <i class="fas fa-file-word"></i> <span id="btn-download-docx-label">Unduh Word</span>
            </button>

            <!-- Download All 5 Documents Button -->
            <button type="button" id="btn-download-all-docs" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer" title="Unduh 5 Dokumen Word Sekaligus (Analisis CP, Prota, Promes, RPE, KKTP)">
              <i class="fas fa-download"></i> <span class="hidden lg:inline">Unduh Semua (5 File)</span>
            </button>
          </div>
        </div>

        <!-- Permendikdasmen No. 13 Tahun 2025 Alokasi Waktu Compliance Banner -->
        <div id="analisis-alokasi-banner"></div>

        <!-- Notification Bar Inline Editing -->
        <div class="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs">
          <span class="flex items-center gap-2">
            <i class="fas fa-pen-to-square text-amber-600"></i>
            <strong>Mode Edit Interaktif:</strong> Anda dapat mengklik dan mengedit langsung teks apa saja di dalam tabel di bawah sebelum mengekspor ke Word atau mencetak.
          </span>
          <span class="text-[11px] opacity-80 hidden sm:inline">Perubahan otomatis terbawa saat unduh Word</span>
        </div>

        <!-- CANVAS KERTAS LANDSCAPE A4 -->
        <div class="bg-slate-200/70 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl overflow-x-auto shadow-inner">
          <div id="analisis-canvas" class="bg-white text-slate-950 min-w-[980px] max-w-[1240px] mx-auto p-8 sm:p-12 rounded-xl shadow-2xl font-serif">
            <!-- Kop Surat & Konten Dokumen akan dirender secara dinamis di sini -->
          </div>
        </div>
      </div>
    </div>
  `;
}

// Inisialisasi Event Listener dan Logika Halaman
export function initAnalisisCp() {
  const form = document.getElementById('analisis-cp-form');
  if (!form) return;

  // Inisialisasi orientasi cetak default
  applyPrintOrientation(activeAnalysisTab);

  // Auto-fill kepala sekolah jika belum terisi dari state.user atau lookup data sekolah
  const sekolahInput = form.querySelector('input[name="namaSekolah"]');
  const ksInput = form.querySelector('input[name="namaKepalaSekolah"]');
  const ksNipInput = form.querySelector('input[name="nipKepalaSekolah"]');
  const sekolahDataList = document.getElementById('daftar-sekolah-list');

  const defaultKsNama = (state.user?.kepala_sekolah && state.user.kepala_sekolah !== 'null') ? state.user.kepala_sekolah : '';
  const defaultKsNip = (state.user?.nip_kepala_sekolah && state.user.nip_kepala_sekolah !== 'null') ? state.user.nip_kepala_sekolah : '';

  if (ksInput && !ksInput.value && defaultKsNama) {
    ksInput.value = defaultKsNama;
  }
  if (ksNipInput && !ksNipInput.value && defaultKsNip) {
    ksNipInput.value = defaultKsNip;
  }

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
        if (sekolahDataList && !sekolahDataList.children.length) {
          sekolahDataList.innerHTML = window.__sekolahCache.map(s => `<option value="${escapeHtml(s.nama)}"></option>`).join('');
        }
        const cleanTarget = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matched = window.__sekolahCache.find(s => {
          const sName = (s.nama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return sName === cleanTarget || sName.includes(cleanTarget) || cleanTarget.includes(sName);
        });
        if (matched) {
          if (ksInput && (forceUpdate || !ksInput.value || ksInput.value === '...........................................')) {
            if (matched.kepala_sekolah && matched.kepala_sekolah !== 'null') ksInput.value = matched.kepala_sekolah;
          }
          if (ksNipInput && (forceUpdate || !ksNipInput.value || ksNipInput.value.includes('...'))) {
            if (matched.nip_kepala_sekolah && matched.nip_kepala_sekolah !== 'null') ksNipInput.value = matched.nip_kepala_sekolah;
          }
        }
      }
    } catch (_) {}
  }

  if (sekolahInput?.value) {
    lookupSchoolHeadmaster(sekolahInput.value.trim(), false);
  }

  sekolahInput?.addEventListener('change', (e) => {
    lookupSchoolHeadmaster(e.target.value.trim(), true);
  });
  sekolahInput?.addEventListener('blur', (e) => {
    lookupSchoolHeadmaster(e.target.value.trim(), false);
  });

  // 1. Populate AI Models
  populateAiModelSelect('#analisis-ai-model-select');
  populateAiModelSelect('select[name="aiProvider"]');

  // 2. Tab Switching (PDF vs Text)
  const tabBtnPdf = document.getElementById('tab-btn-pdf');
  const tabBtnText = document.getElementById('tab-btn-text');
  const tabViewPdf = document.getElementById('tab-view-pdf');
  const tabViewText = document.getElementById('tab-view-text');

  tabBtnPdf?.addEventListener('click', () => {
    tabBtnPdf.className = 'px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs transition-all text-[11px]';
    tabBtnText.className = 'px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all text-[11px]';
    tabViewPdf.classList.remove('hidden');
    tabViewText.classList.add('hidden');
  });

  tabBtnText?.addEventListener('click', () => {
    tabBtnText.className = 'px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs transition-all text-[11px]';
    tabBtnPdf.className = 'px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all text-[11px]';
    tabViewText.classList.remove('hidden');
    tabViewPdf.classList.add('hidden');
  });

  // 3. Dropzone PDF handling
  const dropzone = document.getElementById('pdf-dropzone');
  const fileInput = document.getElementById('pdf-file-input');

  dropzone?.addEventListener('click', () => fileInput?.click());

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-indigo-500', 'bg-indigo-100/50');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-indigo-500', 'bg-indigo-100/50');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-indigo-500', 'bg-indigo-100/50');
    if (e.dataTransfer?.files?.length) {
      handlePdfFile(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target?.files?.length) {
      handlePdfFile(e.target.files[0]);
    }
  });

  // 4. Manual Text Extraction Button
  const btnExtractText = document.getElementById('btn-extract-from-text');
  btnExtractText?.addEventListener('click', () => {
    const text = document.getElementById('input-daftar-isi-text')?.value;
    if (!text || !text.trim()) {
      showToast('Mohon masukkan atau tempel daftar isi buku terlebih dahulu', 'warning');
      return;
    }
    extractStructureFromText(text.trim());
  });

  // 5. Tambah Bab Manual
  const btnAddBab = document.getElementById('btn-add-bab');
  btnAddBab?.addEventListener('click', () => {
    const nextNo = detectedChapters.length + 1;
    const sem1Count = Math.ceil((detectedChapters.length + 1) / 2);
    const newChapter = {
      no: nextNo,
      bab: `Bab ${nextNo}: Topik Baru`,
      materi_pokok: ['Materi Pokok 1', 'Materi Pokok 2'],
      semester: nextNo <= sem1Count ? 1 : 2
    };
    detectedChapters.push(newChapter);
    redistributeSemesters();
    renderChaptersList();
    showToast(`Bab ${nextNo} berhasil ditambahkan`, 'info');
  });

  // 6. Form Submission (Generate Analisis CP)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (detectedChapters.length === 0) {
      showToast('Daftar Bab masih kosong. Silakan unggah PDF atau tambahkan bab terlebih dahulu.', 'warning');
      return;
    }
    await generateAnalisisCpFromForm();
  });

  // 7. Result Toolbar Buttons & Tab Switcher
  document.getElementById('btn-back-to-form')?.addEventListener('click', () => {
    document.getElementById('analisis-result-view')?.classList.add('hidden');
    document.getElementById('analisis-form-view')?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Multi-Tab 4-in-1 Output Switcher
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.analisis-tab-btn');
    if (tabBtn && tabBtn.dataset.tab) {
      const tab = tabBtn.dataset.tab;
      if (tab === activeAnalysisTab) return;
      syncCanvasToAnalysisData(currentAnalysisData);
      activeAnalysisTab = tab;
      applyPrintOrientation(activeAnalysisTab);

      if (currentAnalysisData) {
        renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
      }
    }
  });

  // Download DOCX button (tab-aware)
  document.getElementById('btn-download-docx')?.addEventListener('click', () => {
    downloadDocx(activeAnalysisTab, currentAnalysisData, currentInputData, activePromesSemester);
  });

  // Download All 4 Documents
  document.getElementById('btn-download-all-docs')?.addEventListener('click', () => {
    downloadAllDocs(currentAnalysisData, currentInputData);
  });

  document.getElementById('btn-print-analisis')?.addEventListener('click', () => {
    applyPrintOrientation(activeAnalysisTab);
    window.print();
  });
  document.getElementById('btn-save-analisis')?.addEventListener('click', () => {
    saveToDatabase(currentAnalysisData, currentInputData);
  });

  // Zoom Controls Handlers
  let currentZoom = 1;
  const updateZoom = (z) => {
    currentZoom = Math.min(1.4, Math.max(0.6, Math.round(z * 10) / 10));
    const canvas = document.getElementById('analisis-canvas');
    const zoomText = document.getElementById('zoom-level-text');
    if (canvas) {
      canvas.style.transform = `scale(${currentZoom})`;
      canvas.style.transformOrigin = 'top center';
    }
    if (zoomText) zoomText.innerText = `${Math.round(currentZoom * 100)}%`;
  };

  document.getElementById('btn-zoom-in')?.addEventListener('click', () => updateZoom(currentZoom + 0.1));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => updateZoom(currentZoom - 0.1));
  document.getElementById('btn-zoom-reset')?.addEventListener('click', () => updateZoom(1));

  // 8. Riwayat Drawer Button
  document.getElementById('btn-analisis-archive')?.addEventListener('click', () => {
    openAnalisisArchiveDrawer(
      (item) => {
        currentInputData = item.inputData || {};
        currentAnalysisData = validateAndRepairAnalysisData(item.content, item.inputData?.chapters || [], currentInputData);
        renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
        showToast(`Membuka riwayat: ${item.title}`, 'info');
      },
      async (item) => {
        currentInputData = item.inputData || {};
        currentAnalysisData = validateAndRepairAnalysisData(item.content, item.inputData?.chapters || [], currentInputData);
        await downloadDocx(activeAnalysisTab, currentAnalysisData, currentInputData, activePromesSemester);
      }
    );
  });

  // Bridge to RPP generator global handler
  window.bridgeToRpp = function(babTitle, cpText, semester) {
    const mapel = currentInputData?.mataPelajaran || '';
    const jenjangKelas = currentInputData?.jenjangKelas || 'Kelas 5';

    sessionStorage.setItem('kkg_rpp_prefill', JSON.stringify({
      mataPelajaran: mapel,
      jenjangKelas: jenjangKelas,
      semester: semester || 1,
      topik: babTitle,
      cp: cpText
    }));

    showToast(`Membuka generator RPP untuk "${babTitle}"...`, 'info');
    navigate('rpp');
  };

  // Subject & Grade change listeners to auto-suggest official textbook structure
  document.getElementById('select-mata-pelajaran')?.addEventListener('change', async (e) => {
    const mapel = e.target.value;
    const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
    if (!isCustomPdfUploaded || detectedChapters.length <= 2) {
      await seedDefaultChaptersForClass(kelas, mapel);
      showToast(`Struktur materi disesuaikan dengan ${mapel} (${kelas})`, 'info');
    }
  });

  document.getElementById('select-jenjang-kelas')?.addEventListener('change', async (e) => {
    const kelas = e.target.value;
    const mapel = document.getElementById('select-mata-pelajaran')?.value || 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
    if (!isCustomPdfUploaded || detectedChapters.length <= 2) {
      await seedDefaultChaptersForClass(kelas, mapel);
    }
  });

  // Global click handler for loading official presets button in Card 3
  document.addEventListener('click', async (e) => {
    const btnPreset = e.target.closest('#btn-load-official-preset');
    if (btnPreset) {
      const mapel = document.getElementById('select-mata-pelajaran')?.value || 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
      const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
      isCustomPdfUploaded = false;
      await seedDefaultChaptersForClass(kelas, mapel);
      showToast(`Berhasil memuat struktur 8 BAB resmi Kemendikbudristek untuk ${mapel} (${kelas})!`, 'success');
    }
  });

  // Load initial chapters if empty for immediate testing delight
  if (detectedChapters.length === 0) {
    const initialMapel = document.getElementById('select-mata-pelajaran')?.value || 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
    seedDefaultChaptersForClass(detectUserDefaultKelas(state.user), initialMapel);
  }
}

/**
 * Seed default chapters sesuai mapel dan kelas menggunakan backend API (ter-cache client side)
 */
async function seedDefaultChaptersForClass(kelas, mapelName) {
  const k = String(kelas || '5').replace(/\D/g, '') || '5';
  const normMapel = mapelName || document.getElementById('select-mata-pelajaran')?.value || 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';

  const preset = await fetchStandardChapters(normMapel, `Kelas ${k}`);
  if (preset && Array.isArray(preset.chapters) && preset.chapters.length > 0) {
    detectedChapters = JSON.parse(JSON.stringify(preset.chapters));
    const titleInput = document.getElementById('input-sumber-buku');
    if (titleInput && (!titleInput.value || titleInput.value.includes('Buku Siswa') || titleInput.value.includes('IPAS') || titleInput.value.includes('Bahasa Indonesia'))) {
      titleInput.value = preset.buku_judul || `Buku Siswa ${normMapel} Kelas ${k}`;
    }
  }

  redistributeSemesters();
  renderChaptersList();
}

/**
 * Handle PDF file upload with in-browser pdf.js
 */
async function handlePdfFile(file) {
  if (!file || file.type !== 'application/pdf') {
    showToast('File harus berformat PDF (.pdf)', 'error');
    return;
  }
  isCustomPdfUploaded = true;

  const progressBar = document.getElementById('pdf-progress-bar');
  const statusText = document.getElementById('pdf-status-text');
  const progressPercent = document.getElementById('pdf-progress-percent');
  const progressFill = document.getElementById('pdf-progress-fill');

  progressBar?.classList.remove('hidden');
  if (statusText) statusText.innerHTML = '<i class="fas fa-spinner fa-spin text-indigo-500"></i> Membaca data file PDF...';
  if (progressPercent) progressPercent.innerText = '10%';
  if (progressFill) progressFill.style.width = '10%';

  try {
    if (typeof window.pdfjsLib === 'undefined') {
      showToast('Memuat pustaka PDF reader... Harap tunggu sebentar', 'info');
      await loadPdfJsScript();
    }

    const arrayBuffer = await file.arrayBuffer();
    if (progressPercent) progressPercent.innerText = '25%';
    if (progressFill) progressFill.style.width = '25%';
    if (statusText) statusText.innerHTML = '<i class="fas fa-spinner fa-spin text-indigo-500"></i> Membuka dokumen buku...';

    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    const scanPagesCount = Math.min(35, totalPages);
    const pageRecords = [];
    let tocStartPage = -1;
    let tocEndPage = -1;

    for (let i = 1; i <= scanPagesCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY = undefined;
      for (const item of textContent.items) {
        if (!item.str) continue;
        const currentY = item.transform ? item.transform[5] : undefined;
        if (lastY !== undefined && currentY !== undefined && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (item.hasEOL) {
          pageText += '\n';
        } else if (pageText && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = currentY;
      }

      pageRecords.push({ pageNum: i, text: pageText });

      const lower = pageText.toLowerCase();
      if (lower.includes('daftar isi') || lower.includes('table of contents') || lower.includes('isi buku') || lower.includes('peta materi')) {
        if (tocStartPage === -1) tocStartPage = i;
        tocEndPage = Math.min(totalPages, i + 3);
      }

      const pct = Math.round(20 + (i / scanPagesCount) * 45);
      if (progressPercent) progressPercent.innerText = `${pct}%`;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (statusText) statusText.innerHTML = `<i class="fas fa-spinner fa-spin text-indigo-500"></i> Memindai Daftar Isi (${i}/${scanPagesCount})...`;
    }

    let extractedText = '';
    if (tocStartPage !== -1) {
      extractedText = pageRecords
        .filter(p => p.pageNum >= tocStartPage && p.pageNum <= tocEndPage)
        .map(p => `--- Halaman ${p.pageNum} (Daftar Isi) ---\n${p.text}`)
        .join('\n\n');
    }

    if (!extractedText || extractedText.length < 200) {
      const babPages = pageRecords.filter(p => /\b(bab|unit|tema)\s+[0-9ivx]+/i.test(p.text));
      if (babPages.length > 0) {
        extractedText = babPages.slice(0, 8).map(p => `--- Halaman ${p.pageNum} ---\n${p.text}`).join('\n\n');
      } else {
        extractedText = pageRecords.slice(0, 8).map(p => `--- Halaman ${p.pageNum} ---\n${p.text}`).join('\n\n');
      }
    }

    if (progressPercent) progressPercent.innerText = '75%';
    if (progressFill) progressFill.style.width = '75%';
    if (statusText) statusText.innerHTML = '<i class="fas fa-wand-magic-sparkles text-indigo-500"></i> AI sedang mengekstrak seluruh BAB buku...';

    const sumberBukuInput = document.getElementById('input-sumber-buku');
    if (sumberBukuInput && (!sumberBukuInput.value || sumberBukuInput.value.includes('Buku Siswa IPAS'))) {
      sumberBukuInput.value = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
    }

    await extractStructureFromText(extractedText);

    if (progressPercent) progressPercent.innerText = '100%';
    if (progressFill) progressFill.style.width = '100%';
    if (statusText) statusText.innerHTML = '<i class="fas fa-check text-emerald-500"></i> Selesai memproses file PDF!';
    setTimeout(() => progressBar?.classList.add('hidden'), 2500);

  } catch (err) {
    console.error('PDF parsing error:', err);
    showToast('Gagal membaca PDF: ' + (err.message || 'File mungkin terenkripsi atau rusak'), 'error');
    progressBar?.classList.add('hidden');
  }
}

/**
 * Ekstraksi struktur bab dengan AI / Heuristic fallback
 */
async function extractStructureFromText(rawText) {
  showLoading('Mengekstrak Struktur Bab...', 'AI sedang memetakan seluruh daftar bab dan submateri buku');
  
  const mapel = document.getElementById('select-mata-pelajaran')?.value || 'IPAS';
  const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
  const aiProvider = document.getElementById('analisis-ai-model-select')?.value || '';

  const heuristicChapters = parseChaptersHeuristically(rawText);

  try {
    const res = await api('/analisis-cp/extract-structure', {
      method: 'POST',
      body: {
        text: rawText,
        mataPelajaran: mapel,
        jenjangKelas: kelas,
        aiProvider
      },
      timeout: 120000
    });

    hideLoading();

    if (res && res.success && res.data && Array.isArray(res.data.chapters) && res.data.chapters.length > 0) {
      if (res.data.chapters.length <= 2 && heuristicChapters && heuristicChapters.length >= 3) {
        console.info(`[Fallback AI] AI hanya mengembalikan ${res.data.chapters.length} bab, menggunakan ${heuristicChapters.length} bab dari ekstraksi presisi Daftar Isi.`);
        detectedChapters = heuristicChapters;
      } else {
        detectedChapters = res.data.chapters;
      }

      if (res.data.buku_judul) {
        const titleInput = document.getElementById('input-sumber-buku');
        if (titleInput && (!titleInput.value || titleInput.value.length < 5 || titleInput.value.includes('Buku Siswa IPAS'))) {
          titleInput.value = res.data.buku_judul;
        }
      }

      redistributeSemesters();
      renderChaptersList();

      if (res.data.is_enriched) {
        showToast(`Struktur bab lengkap (${detectedChapters.length} BAB) berhasil disinkronkan dengan kurikulum resmi Kemendikbudristek!`, 'success');
      } else {
        showToast(`Berhasil mengekstrak ${detectedChapters.length} BAB dari buku!`, 'success');
      }
      return;
    } else {
      throw new Error(res?.error || 'Gagal mengekstrak struktur bab dari AI');
    }
  } catch (e) {
    hideLoading();
    console.warn('AI structure extraction slow or timed out, trying heuristic parser...', e);

    if (heuristicChapters && heuristicChapters.length > 0) {
      detectedChapters = heuristicChapters;
      redistributeSemesters();
      renderChaptersList();
      showToast(`Berhasil memuat ${detectedChapters.length} BAB langsung dari Daftar Isi file PDF!`, 'success');
    } else {
      await seedDefaultChaptersForClass(kelas, mapel);
      showToast(`Koneksi AI sibuk. Struktur 8 BAB standar resmi Kemendikbudristek untuk ${mapel} telah dimuat otomatis.`, 'info');
    }
  }
}

/**
 * Aturan pembagian semester: genap dibagi 2 sama rata, ganjil semester 1 lebih banyak 1 bab
 */
function redistributeSemesters() {
  const total = detectedChapters.length;
  const sem1Count = Math.ceil(total / 2);

  detectedChapters.forEach((ch, idx) => {
    ch.no = idx + 1;
    if (typeof ch.semester !== 'number') {
      ch.semester = idx < sem1Count ? 1 : 2;
    }
  });
}

/**
 * Render daftar BAB di kartu staging
 */
function renderChaptersList() {
  const container = document.getElementById('chapters-list-container');
  const badgeTotal = document.getElementById('badge-total-bab');
  if (!container) return;

  if (badgeTotal) {
    badgeTotal.innerText = `${detectedChapters.length} Bab`;
  }

  if (detectedChapters.length === 0) {
    container.innerHTML = `
      <div id="empty-chapters-notice" class="text-center py-8 text-slate-400 dark:text-slate-500">
        <i class="fas fa-book-open text-3xl mb-2 opacity-50 block"></i>
        <p class="text-xs">Belum ada bab yang dimuat. Silakan unggah PDF atau tempel teks daftar isi di atas.</p>
      </div>
    `;
    return;
  }

  const mapel = document.getElementById('select-mata-pelajaran')?.value || 'Bahasa Indonesia';
  const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';

  const lowChaptersAlert = detectedChapters.length <= 2 ? `
    <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2 mb-2">
      <div class="flex items-start gap-2">
        <i class="fas fa-lightbulb text-amber-600 mt-0.5 shrink-0"></i>
        <div class="leading-snug">
          <strong>Hanya ${detectedChapters.length} Bab terdeteksi?</strong> Buku ${mapel} umumnya memiliki 8 BAB untuk setahun penuh. PDF mungkin terpotong di bab pertama.
        </div>
      </div>
      <button type="button" id="btn-load-official-preset" class="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
        <i class="fas fa-book-bookmark"></i> Muat Struktur Lengkap 8 BAB Resmi (${mapel})
      </button>
    </div>
  ` : '';

  container.innerHTML = lowChaptersAlert + detectedChapters.map((ch, idx) => {
    const isSem1 = ch.semester === 1;
    const materiArr = Array.isArray(ch.materi_pokok) ? ch.materi_pokok : [ch.materi_pokok || 'Materi Pokok'];

    return `
      <div class="p-3.5 rounded-2xl border ${isSem1 ? 'border-sky-200 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/20' : 'border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20'} transition-all space-y-2 group" data-idx="${idx}">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="w-6 h-6 rounded-lg ${isSem1 ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'bg-purple-500/20 text-purple-700 dark:text-purple-300'} font-extrabold text-xs flex items-center justify-center shrink-0">
              ${idx + 1}
            </span>
            <input type="text" value="${escapeHtml(ch.bab || '')}" class="chapter-title-input w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5" data-idx="${idx}">
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" class="btn-toggle-sem px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${isSem1 ? 'bg-sky-500 text-white shadow-xs' : 'bg-purple-600 text-white shadow-xs'}" data-idx="${idx}" title="Klik untuk mengubah semester">
              <i class="fas fa-calendar-alt mr-1"></i> SMT ${ch.semester}
            </button>
            <button type="button" class="btn-delete-bab p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" data-idx="${idx}" title="Hapus bab ini">
              <i class="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
        </div>

        <div class="pl-8">
          <input type="text" value="${escapeHtml(materiArr.join(', '))}" placeholder="Materi pokok (pisahkan dengan koma)" class="chapter-materi-input w-full text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400" data-idx="${idx}">
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.chapter-title-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.idx);
      if (detectedChapters[idx]) detectedChapters[idx].bab = e.target.value.trim();
    });
  });

  container.querySelectorAll('.chapter-materi-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.idx);
      if (detectedChapters[idx]) {
        detectedChapters[idx].materi_pokok = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
      }
    });
  });

  container.querySelectorAll('.btn-toggle-sem').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.dataset.idx);
      if (detectedChapters[idx]) {
        detectedChapters[idx].semester = detectedChapters[idx].semester === 1 ? 2 : 1;
        renderChaptersList();
      }
    });
  });

  container.querySelectorAll('.btn-delete-bab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.dataset.idx);
      detectedChapters.splice(idx, 1);
      redistributeSemesters();
      renderChaptersList();
    });
  });
}

/**
 * Generate Analisis CP Process (Streaming SSE with fallback)
 */
async function generateAnalisisCpFromForm() {
  const form = document.getElementById('analisis-cp-form');
  const formData = new FormData(form);

  const jenjangKelas = formData.get('jenjangKelas') || 'Kelas 5';
  const kelasNum = (jenjangKelas.match(/\d+/) || ['5'])[0];
  const fase = (Number(kelasNum) <= 2) ? 'A' : (Number(kelasNum) <= 4) ? 'B' : 'C';

  const payload = {
    namaSekolah: formData.get('namaSekolah'),
    namaKepalaSekolah: formData.get('namaKepalaSekolah'),
    nipKepalaSekolah: formData.get('nipKepalaSekolah'),
    namaGuru: formData.get('namaGuru'),
    nipGuru: formData.get('nipGuru'),
    mataPelajaran: formData.get('mataPelajaran'),
    jenjangKelas,
    fase,
    tahunAjaran: formData.get('tahunAjaran'),
    sumberBuku: document.getElementById('input-sumber-buku')?.value || 'Buku Teks Kurikulum Merdeka',
    targetSemester: formData.get('targetSemester') || 'all',
    aiProvider: formData.get('aiProvider'),
    chapters: detectedChapters
  };

  currentInputData = payload;

  const modelSelect = document.getElementById('analisis-ai-model-select');
  const modelName = modelSelect?.options[modelSelect.selectedIndex]?.text || 'AI Model';

  const monitor = openAiLiveMonitor({
    title: 'Analisis CP, TP & ATP Deep Learning',
    subtitle: `Memetakan ${detectedChapters.length} BAB ${payload.mataPelajaran} (${jenjangKelas}) ke Regulasi BSKAP 046/2025`,
    modelName,
    steps: [
      { num: 1, label: 'Sinkronisasi CP BSKAP No. 046/2025' },
      { num: 2, label: 'Pemetaan Bab & Materi Pokok' },
      { num: 3, label: 'Perumusan TP & ATP Operasional' },
      { num: 4, label: 'Perakitan Tabel Hasil Analisis' }
    ]
  });

  let finalResultData = null;

  try {
    await streamPost('/analisis-cp/generate-stream', payload, (event, eventPayload) => {
      if (event === 'step') {
        monitor?.updateStep?.(eventPayload.step, eventPayload.title, eventPayload.message, eventPayload.percent);
      } else if (event === 'token') {
        monitor?.appendToken?.(eventPayload.text);
      } else if (event === 'done') {
        finalResultData = eventPayload?.data || eventPayload?.result || eventPayload;
      } else if (event === 'error') {
        throw new Error(eventPayload?.message || 'Gagal menghasilkan streaming AI');
      }
    });

    if (finalResultData) {
      monitor?.complete?.(() => {
        // Validasi & Auto-repair Client Side
        currentAnalysisData = validateAndRepairAnalysisData(finalResultData, detectedChapters, payload);
        renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
        showToast('Analisis CP, TP, dan ATP berhasil dirakit!', 'success');

        saveDocArchive({
          module: 'analisis-cp',
          title: `Analisis CP ${payload.mataPelajaran} ${jenjangKelas}`,
          subtitle: `${payload.namaSekolah} • ${detectedChapters.length} BAB`,
          inputData: currentInputData,
          content: currentAnalysisData
        });
      });
    } else {
      throw new Error('Tidak ada data hasil analisis dari server streaming');
    }
  } catch (err) {
    console.warn('Stream failed, trying standard fallback...', err);
    try {
      showLoading('Merakit Dokumen Analisis...', 'Menggunakan mesin AI cadangan');
      const fallbackRes = await api('/analisis-cp/generate', {
        method: 'POST',
        body: payload
      });
      hideLoading();
      closeAiLiveMonitor();

      if (fallbackRes && fallbackRes.success && fallbackRes.data) {
        currentAnalysisData = validateAndRepairAnalysisData(fallbackRes.data, detectedChapters, payload);
        renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
        showToast('Analisis CP, TP, dan ATP berhasil dirakit!', 'success');

        saveDocArchive({
          module: 'analisis-cp',
          title: `Analisis CP ${payload.mataPelajaran} ${jenjangKelas}`,
          subtitle: `${payload.namaSekolah} • ${detectedChapters.length} BAB`,
          inputData: currentInputData,
          content: currentAnalysisData
        });
      } else {
        throw new Error(fallbackRes?.error || 'Gagal generate Analisis CP');
      }
    } catch (fallbackErr) {
      hideLoading();
      closeAiLiveMonitor();
      console.error('All generation failed:', fallbackErr);
      showToast('Gagal merakit Analisis CP: ' + fallbackErr.message, 'error');
    }
  }
}
