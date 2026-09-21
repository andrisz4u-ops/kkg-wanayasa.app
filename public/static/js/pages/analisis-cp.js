import { showToast, showLoading, hideLoading, escapeHtml, populateAiModelSelect, getActiveAiProviders, renderTahunAjaranOptions, detectUserDefaultKelas, detectUserDefaultMapel, openAiLiveMonitor, closeAiLiveMonitor, streamPost } from '../utils.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { renderLockedFeature } from '../components.js';
import { saveDocArchive } from '../storage-archive.js';

// Modul Terpisah Analisis CP
import { fetchStandardChapters, fetchBookProfiles, saveBookProfile, deleteBookProfile, loadPdfJsScript, parseChaptersHeuristically } from './analisis-cp/helpers.js';
import { validateAndRepairAnalysisData } from './analisis-cp/validator.js';
import { renderAnalysisCanvas, syncCanvasToAnalysisData, applyPrintOrientation, getOfficialCpDocumentDataClient } from './analisis-cp/renderers.js';
import { downloadDocx, downloadAllDocs, saveToDatabase, openAnalisisArchiveDrawer } from './analisis-cp/downloaders.js';
import { loadCpKolaboratifCountBadge, openCpKolaboratifDrawer } from './analisis-cp/kolaboratif.js';

// State lokal untuk sesi Analisis CP
let currentAnalysisData = null;
let currentInputData = null;
let detectedChapters = [];
let isCustomPdfUploaded = false;
let activeAnalysisTab = 'analisis'; // 'analisis' | 'prota' | 'promes' | 'rpe' | 'kktp'
let activePromesSemester = 'all'; // 'all' | 1 | 2
let lastLoadedUserId = null;
let availableBookProfiles = [];
let selectedBookProfileId = null;

function handleSemesterChange(newSem) {
  activePromesSemester = newSem;
  renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
}

// ============================================================
// DRAFT LOCAL STORAGE HELPERS (MODULE-LEVEL)
// ============================================================
function getDraftStorageKey() {
  const uid = state.user?.id || 'guest';
  return `kkg_analisis_cp_draft_${uid}`;
}

export function saveDraftToStorage() {
  // No-op: fitur banner draf dinonaktifkan agar tidak mengganggu alur kerja pengguna
}




export async function renderAnalisisCp() {
  if (!state.user) {
    return renderLockedFeature(
      'Generator Analisis CP, TP, dan ATP (AI)',
      'Fitur ini khusus untuk pendidik terdaftar. Silakan login untuk menyusun Analisis Capaian Pembelajaran, Tujuan Pembelajaran, dan Alur Tujuan Pembelajaran otomatis dari buku teks/ebook sekolah Anda.',
      ['Ekstraksi Otomatis Buku Teks PDF', 'Sinkronisasi CP Resmi BSKAP 046/2025', 'Format Dokumen Resmi Landscape A4', 'Ekspor ke Microsoft Word (.docx) & Siap Cetak']
    );
  }

  // If user changed since last load, reset stale local state
  if (lastLoadedUserId !== state.user.id) {
    lastLoadedUserId = state.user.id;
    currentAnalysisData = null;
    currentInputData = null;
    detectedChapters = [];
    isCustomPdfUploaded = false;
  }

  const defaultK = detectUserDefaultKelas(state.user);
  const defaultFase = (defaultK <= 2) ? 'A' : (defaultK <= 4) ? 'B' : 'C';
  const defaultMapel = detectUserDefaultMapel(state.user, defaultK);
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
          <div class="flex items-center gap-2.5">
            <button type="button" id="btn-cp-kolaboratif" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white border border-purple-400/30 text-xs font-black tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-purple-600/25 cursor-pointer">
              <i class="fas fa-users text-amber-300"></i>
              <span>CP Kolaboratif</span>
              <span id="cp-kolaboratif-count-badge" class="hidden px-1.5 py-0.5 text-[10px] rounded-full bg-amber-400 text-slate-900 font-black ml-0.5"></span>
            </button>
            <button type="button" id="btn-analisis-archive" class="px-4 py-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer">
              <i class="fas fa-folder-open text-amber-400"></i> <span class="hidden sm:inline">Riwayat Saya</span>
            </button>
          </div>
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
                      <option value="Pendidikan Agama dan Budi Pekerti" ${defaultMapel === 'Pendidikan Agama dan Budi Pekerti' ? 'selected' : ''}>Pendidikan Agama dan Budi Pekerti</option>
                      <option value="Pendidikan Pancasila" ${defaultMapel === 'Pendidikan Pancasila' ? 'selected' : ''}>Pendidikan Pancasila</option>
                      <option value="Bahasa Indonesia" ${defaultMapel === 'Bahasa Indonesia' ? 'selected' : ''}>Bahasa Indonesia</option>
                      <option value="Matematika" ${defaultMapel === 'Matematika' ? 'selected' : ''}>Matematika</option>
                      <option value="Ilmu Pengetahuan Alam dan Sosial (IPAS)" ${defaultMapel === 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' ? 'selected' : ''} ${defaultK <= 2 ? 'disabled class="hidden"' : ''}>Ilmu Pengetahuan Alam dan Sosial (IPAS) ${defaultK <= 2 ? '(Mulai Kls 3)' : ''}</option>
                      <option value="Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)" ${defaultMapel === 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)' ? 'selected' : ''}>Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)</option>
                      <option value="Bahasa Inggris" ${defaultMapel === 'Bahasa Inggris' ? 'selected' : ''}>Bahasa Inggris</option>
                      <option value="Seni Rupa" ${defaultMapel === 'Seni Rupa' ? 'selected' : ''}>Seni Rupa</option>
                      <option value="Koding dan Kecerdasan Artifisial" ${defaultMapel === 'Koding dan Kecerdasan Artifisial' ? 'selected' : ''} ${defaultK < 5 ? 'disabled class="hidden"' : ''}>Koding dan Kecerdasan Artifisial ${defaultK < 5 ? '(Mulai Kls 5)' : ''}</option>
                      <option value="B.Sunda" ${defaultMapel === 'B.Sunda' ? 'selected' : ''}>Bahasa Sunda (Mulok)</option>
                      <option value="Tatanen di Bale Atikan" ${defaultMapel === 'Tatanen di Bale Atikan' ? 'selected' : ''}>Tatanen di Bale Atikan (TdBA)</option>
                      <option value="AKPK" ${defaultMapel === 'AKPK' ? 'selected' : ''}>AKPK Purwakarta</option>
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
                    <select name="targetSemester" id="select-target-semester" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="all" selected>Setahun Penuh (Smt 1 & 2)</option>
                      <option value="1">Semester 1 Saja (Ganjil)</option>
                      <option value="2">Semester 2 Saja (Genap)</option>
                    </select>
                  </div>
                </div>

                <!-- PRATINJAU DATA AWAL CAPAIAN PEMBELAJARAN (CP) RESMI -->
                <div class="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 transition-all">
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="text-[11px] font-extrabold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fas fa-file-contract text-emerald-600"></i> Data Awal CP Resmi:
                    </label>
                    <span id="badge-cp-fase" class="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 shadow-2xs">
                      BSKAP 046
                    </span>
                  </div>
                  <div id="preview-cp-summary" class="text-[11px] font-serif text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    Memuat data capaian pembelajaran resmi...
                  </div>
                  <div class="mt-2 flex items-center justify-between pt-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    <div id="preview-cp-elements-tags" class="flex flex-wrap gap-1">
                      <!-- Elemen tags -->
                    </div>
                    <button type="button" id="btn-toggle-cp-details" class="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 underline flex items-center gap-1 cursor-pointer">
                      <span id="btn-toggle-cp-text">Lihat Rincian</span> <i id="btn-toggle-cp-icon" class="fas fa-chevron-down text-[9px]"></i>
                    </button>
                  </div>
                  <!-- Collapsible Details Box -->
                  <div id="preview-cp-details-box" class="hidden mt-2 pt-2 border-t border-emerald-200/60 text-[11px] font-serif space-y-2 max-h-48 overflow-y-auto pr-1">
                    <!-- Expanded elements details -->
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

              <!-- PROFIL STRUKTUR BUKU (DARI DATABASE & PRESET RESMI) -->
              <div class="mb-3.5 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-[11px] font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-book-bookmark text-indigo-600"></i> Profil Struktur Buku:
                  </label>
                  <div class="flex items-center gap-1">
                    <button type="button" id="btn-refresh-book-profiles" class="p-1 px-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs transition-all cursor-pointer" title="Segarkan Profil Buku">
                      <i class="fas fa-rotate"></i>
                    </button>
                    <button type="button" id="btn-delete-book-profile" class="hidden p-1 px-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-xs transition-all cursor-pointer" title="Hapus Profil Buku Kustom Ini">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <select id="select-book-profile" class="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="">Memuat profil buku...</option>
                </select>
                <div id="book-profile-info-badge" class="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Pilih profil buku kurikulum atau unggah buku baru</span>
                </div>
              </div>

              <!-- Opsi Cakupan Buku Ajar: 1 Tahun vs Semester 1 vs Semester 2 -->
              <div class="mb-3 p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-[11px] font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-book-bookmark text-indigo-600"></i> Cakupan Buku Ajar:
                  </label>
                  <span id="badge-detected-coverage" class="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-900 dark:text-indigo-100 hidden">Auto</span>
                </div>
                <div class="grid grid-cols-3 gap-1.5 text-xs font-bold" id="coverage-selector">
                  <button type="button" data-coverage="all" class="coverage-btn active py-1.5 px-1 rounded-xl text-center transition-all bg-indigo-600 text-white shadow-xs text-[10.5px] font-extrabold cursor-pointer">
                    1 Tahun Penuh
                  </button>
                  <button type="button" data-coverage="1" class="coverage-btn py-1.5 px-1 rounded-xl text-center transition-all bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold cursor-pointer">
                    Semester 1 Saja
                  </button>
                  <button type="button" data-coverage="2" class="coverage-btn py-1.5 px-1 rounded-xl text-center transition-all bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold cursor-pointer">
                    Semester 2 Saja
                  </button>
                </div>
                <input type="hidden" name="bookCoverage" id="input-book-coverage" value="all">
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

              <!-- Quick Action Bar: Atur Semester Cepat 1-Klik -->
              <div class="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-[10.5px]">
                <span class="text-slate-500 dark:text-slate-400 font-semibold">Atur Cepat:</span>
                <div class="flex items-center gap-1">
                  <button type="button" id="btn-quick-all-sem1" class="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-200 font-extrabold transition-all cursor-pointer text-[10px]" title="Jadikan semua bab sebagai Semester 1">
                    Semua Smt 1
                  </button>
                  <button type="button" id="btn-quick-all-sem2" class="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 font-extrabold transition-all cursor-pointer text-[10px]" title="Jadikan semua bab sebagai Semester 2">
                    Semua Smt 2
                  </button>
                  <button type="button" id="btn-quick-split-auto" class="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 font-extrabold transition-all cursor-pointer text-[10px]" title="Bagi proporsional Bab 1..N menjadi Semester 1 & 2">
                    Bagi 2 (Auto)
                  </button>
                </div>
              </div>

              <!-- List Bab Dinamis yang Siap Dianalisis -->
              <div id="chapters-list-container" class="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                <div id="empty-chapters-notice" class="text-center py-8 text-slate-400 dark:text-slate-500">
                  <i class="fas fa-book-open text-3xl mb-2 opacity-50 block"></i>
                  <p class="text-xs">Belum ada bab yang dimuat. Silakan unggah PDF atau tempel teks daftar isi di Kartu 2.</p>
                </div>
              </div>
            </div>

            <div class="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div class="grid grid-cols-2 gap-2">
                <button type="button" id="btn-add-bab" class="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <i class="fas fa-plus text-xs"></i> Tambah Bab
                </button>
                <button type="button" id="btn-save-as-new-book" class="py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200/60 dark:border-indigo-800/40" title="Simpan struktur bab ini sebagai profil buku baru di database">
                  <i class="fas fa-bookmark text-indigo-600 text-xs"></i> Simpan Profil
                </button>
              </div>

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
            
            <!-- Tab View Dokumen: Data CP vs Analisis CP vs Prota vs Promes vs KKTP vs ATP Elemen -->
            <div id="analisis-view-tabs" class="flex p-1 rounded-xl bg-slate-800/90 text-xs font-bold border border-slate-700/60">
              <button type="button" data-tab="data-cp" class="analisis-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5" title="Dokumen Resmi Capaian Pembelajaran (CP) Kurikulum Merdeka">
                <i class="fas fa-file-contract text-emerald-400"></i> <span>Data CP</span>
              </button>
              <button type="button" data-tab="analisis" class="analisis-tab-btn active px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-indigo-600 text-white shadow-sm flex items-center gap-1.5">
                <i class="fas fa-table-columns"></i> <span>Analisis CP</span>
              </button>
              <button type="button" data-tab="atp-elemen" class="analisis-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5" title="Alur Tujuan Pembelajaran Format Rekapitulasi Berbasis Elemen CP (Model PPA BSKAP)">
                <i class="fas fa-route text-rose-400"></i> <span>ATP (Elemen)</span>
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
                <i class="fas fa-list-check text-teal-400"></i> <span>KKTP</span>
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

            <!-- Save DB & CP Kolaboratif Button -->
            <button type="button" id="btn-save-analisis" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer" title="Simpan ke CP Kolaboratif & Arsip">
              <i class="fas fa-cloud-arrow-up text-amber-300"></i> <span class="hidden sm:inline">Simpan ke CP Kolaboratif</span>
            </button>
            <button type="button" id="btn-result-cp-kolaboratif" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Buka Dokumen CP Kolaboratif Rekan Guru">
              <i class="fas fa-users text-purple-400"></i> <span class="hidden md:inline">CP Kolaboratif</span>
            </button>

            <!-- Download Single Docx Button -->
            <button type="button" id="btn-download-docx" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer">
              <i class="fas fa-file-word"></i> <span id="btn-download-docx-label">Unduh Word</span>
            </button>

            <!-- Download All 7 Documents Button -->
            <button type="button" id="btn-download-all-docs" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer" title="Unduh 7 Dokumen Word Sekaligus (Data CP, Analisis CP, ATP Elemen, Prota, Promes, RPE, KKTP)">
              <i class="fas fa-download"></i> <span class="hidden lg:inline">Unduh Semua (7 File)</span>
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
    e.target.value = '';
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
    const cov = document.getElementById('input-book-coverage')?.value || 'all';
    const sem1Count = Math.ceil((detectedChapters.length + 1) / 2);
    const newSem = cov === '1' ? 1 : cov === '2' ? 2 : (nextNo <= sem1Count ? 1 : 2);
    const newChapter = {
      no: nextNo,
      bab: `Bab ${nextNo}: Topik Baru`,
      materi_pokok: ['Materi Pokok 1', 'Materi Pokok 2'],
      semester: newSem
    };
    detectedChapters.push(newChapter);
    redistributeSemesters();
    renderChaptersList();
    showToast(`Bab ${nextNo} berhasil ditambahkan (Semester ${newSem})`, 'info');
  });

  // 5b. Selector Cakupan Buku Ajar (1 Tahun vs Smt 1 vs Smt 2)
  document.querySelectorAll('#coverage-selector .coverage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cov = btn.dataset.coverage;
      setBookCoverage(cov);
      const label = cov === '1' ? 'Semester 1 Saja' : cov === '2' ? 'Semester 2 Saja' : '1 Tahun Penuh';
      showToast(`Cakupan buku diatur: ${label}`, 'info');
    });
  });

  // Sinkronisasi Target Semester Dropdown
  document.getElementById('select-target-semester')?.addEventListener('change', (e) => {
    const val = e.target.value;
    setBookCoverage(val);
  });

  // Tombol Atur Cepat Semester di Kartu 3
  document.getElementById('btn-quick-all-sem1')?.addEventListener('click', () => {
    setBookCoverage('1');
    showToast('Semua bab diatur ke Semester 1 (tidak dibagi 2)', 'info');
  });

  document.getElementById('btn-quick-all-sem2')?.addEventListener('click', () => {
    setBookCoverage('2');
    showToast('Semua bab diatur ke Semester 2 (tidak dibagi 2)', 'info');
  });

  document.getElementById('btn-quick-split-auto')?.addEventListener('click', () => {
    setBookCoverage('all');
    showToast('Bab dibagi proporsional ke Semester 1 & 2', 'info');
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
  document.getElementById('btn-download-docx')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-docx');
    if (btn?.disabled) return;
    const origHtml = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-75', 'cursor-not-allowed');
    }
    try {
      await downloadDocx(activeAnalysisTab, currentAnalysisData, currentInputData, activePromesSemester);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        if (origHtml) btn.innerHTML = origHtml;
      }
    }
  });

  // Download All 7 Documents
  document.getElementById('btn-download-all-docs')?.addEventListener('click', () => {
    downloadAllDocs(currentAnalysisData, currentInputData, activePromesSemester);
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
        saveDraftToStorage();
        showToast(`Membuka riwayat: ${item.title}`, 'info');
      },
      async (item) => {
        currentInputData = item.inputData || {};
        currentAnalysisData = validateAndRepairAnalysisData(item.content, item.inputData?.chapters || [], currentInputData);
        await downloadDocx(activeAnalysisTab, currentAnalysisData, currentInputData, activePromesSemester);
      }
    );
  });

  // 8b. CP Kolaboratif Drawer Handler
  const handleOpenCpKolaboratif = () => {
    openCpKolaboratifDrawer({
      onApply: (item) => {
        currentInputData = {
          namaSekolah: item.nama_sekolah,
          mataPelajaran: item.mata_pelajaran,
          jenjangKelas: item.jenjang_kelas,
          fase: item.fase,
          tahunAjaran: item.tahun_ajaran,
          sumberBuku: item.sumber_buku,
          namaGuru: state.user?.nama || item.user_nama,
          nipGuru: state.user?.nip || '',
          namaKepalaSekolah: state.user?.kepala_sekolah || '',
          nipKepalaSekolah: state.user?.nip_kepala_sekolah || ''
        };
        currentAnalysisData = validateAndRepairAnalysisData(item.content, [], currentInputData);

        // Sinkronkan input form
        const sekolahInput = document.getElementById('input-nama-sekolah'); if (sekolahInput) sekolahInput.value = item.nama_sekolah || '';
        const mapelSelect = document.getElementById('select-mata-pelajaran'); if (mapelSelect) mapelSelect.value = item.mata_pelajaran || '';
        const kelasSelect = document.getElementById('select-jenjang-kelas'); if (kelasSelect) kelasSelect.value = item.jenjang_kelas || '';
        const bukuInput = document.getElementById('input-sumber-buku'); if (bukuInput) bukuInput.value = item.sumber_buku || '';

        document.getElementById('analisis-form-view')?.classList.add('hidden');
        document.getElementById('analisis-result-view')?.classList.remove('hidden');
        renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
        saveDraftToStorage();
        showToast(`Dokumen CP "${item.mata_pelajaran} (${item.jenjang_kelas})" dari ${item.nama_sekolah} berhasil dimuat!`, 'success');
      },
      onDownload: async (item) => {
        const docInput = {
          namaSekolah: item.nama_sekolah,
          mataPelajaran: item.mata_pelajaran,
          jenjangKelas: item.jenjang_kelas,
          fase: item.fase,
          tahunAjaran: item.tahun_ajaran,
          sumberBuku: item.sumber_buku,
          namaGuru: state.user?.nama || item.user_nama,
          nipGuru: state.user?.nip || '',
          namaKepalaSekolah: state.user?.kepala_sekolah || '',
          nipKepalaSekolah: state.user?.nip_kepala_sekolah || ''
        };
        const validated = validateAndRepairAnalysisData(item.content, [], docInput);
        await downloadDocx('analisis', validated, docInput, 'all');
      }
    });
  };

  document.getElementById('btn-cp-kolaboratif')?.addEventListener('click', handleOpenCpKolaboratif);
  document.getElementById('btn-result-cp-kolaboratif')?.addEventListener('click', handleOpenCpKolaboratif);

  // Load badge count CP Kolaboratif
  loadCpKolaboratifCountBadge();

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

  // Bridge to Kisi-Kisi & Asesmen Soal global handler
  window.bridgeToKisi = function(babTitle, cpText, semester) {
    const mapel = currentInputData?.mataPelajaran || document.getElementById('select-mata-pelajaran')?.value || '';
    const jenjangKelas = currentInputData?.jenjangKelas || document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';

    sessionStorage.setItem('kkg_bridge_data', JSON.stringify({
      target: 'kisi',
      source: 'analisis-cp',
      mataPelajaran: mapel,
      jenjangKelas: jenjangKelas,
      semester: semester ? String(semester) : '1',
      topik: babTitle,
      capaian: cpText
    }));

    showToast(`Membuka generator Asesmen & Soal untuk "${babTitle}"...`, 'info');
    navigate('kisi');
  };

  // Global handler to add a TP item to a Bab in currentAnalysisData
  window.addTpItemToBab = function(semIdx, babIdx, itemIdx) {
    if (!currentAnalysisData) return;
    syncCanvasToAnalysisData(currentAnalysisData);

    const sem = currentAnalysisData.semesters?.[semIdx];
    if (!sem) return;
    const bab = sem.babs?.[babIdx];
    if (!bab) return;

    if (!Array.isArray(bab.items) || bab.items.length === 0) {
      bab.items = [{
        kode_tp: `${currentAnalysisData.metadata?.kelas || '5'}.${bab.no}.1`,
        materi_pokok: bab.bab,
        tp: 'Menyelesaikan capaian materi pada bab ini.',
        atp: 'Murid melakukan serangkaian aktivitas pembelajaran terpadu.',
        alokasi_waktu: '2 JP'
      }];
    }

    const kelasVal = currentAnalysisData.metadata?.kelas || (currentInputData?.jenjangKelas?.match(/\d+/) || ['5'])[0];
    const newIdx = bab.items.length + 1;
    const prevItem = bab.items[itemIdx] || {};
    const newItem = {
      kode_tp: `${kelasVal}.${bab.no}.${newIdx}`,
      materi_pokok: prevItem.materi_pokok || bab.bab,
      tp: 'Tujuan pembelajaran lanjutan untuk memperdalam materi.',
      atp: 'Melaksanakan aktivitas telaah mandiri dan penguatan konsep secara terarah.',
      alokasi_waktu: '2 JP'
    };

    bab.items.splice(itemIdx + 1, 0, newItem);
    renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
    saveDraftToStorage();
    showToast('Baris Tujuan Pembelajaran (TP) berhasil ditambahkan!', 'success');
  };

  // Global handler to remove a TP item from a Bab in currentAnalysisData
  window.removeTpItemFromBab = function(semIdx, babIdx, itemIdx) {
    if (!currentAnalysisData) return;
    syncCanvasToAnalysisData(currentAnalysisData);

    const sem = currentAnalysisData.semesters?.[semIdx];
    if (!sem) return;
    const bab = sem.babs?.[babIdx];
    if (!bab || !Array.isArray(bab.items)) return;

    if (bab.items.length <= 1) {
      showToast('Setiap bab minimal harus memiliki satu baris TP.', 'warning');
      return;
    }

    bab.items.splice(itemIdx, 1);
    renderAnalysisCanvas(currentAnalysisData, currentInputData, activeAnalysisTab, activePromesSemester, handleSemesterChange);
    saveDraftToStorage();
    showToast('Baris TP berhasil dihapus.', 'info');
  };

  // Bersihkan sisa draf lokal agar tidak meninggalkan banner/state yang mengganggu
  try {
    localStorage.removeItem(getDraftStorageKey());
  } catch (_) {}

  // Autosave triggers on form and canvas changes
  let autosaveTimer = null;
  const triggerAutoSave = (delay = 1000) => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      if (currentAnalysisData) {
        syncCanvasToAnalysisData(currentAnalysisData);
      }
      saveDraftToStorage();
    }, delay);
  };

  form?.addEventListener('input', () => triggerAutoSave(1500));
  document.getElementById('analisis-canvas')?.addEventListener('input', () => triggerAutoSave(1500));

  // Subject & Grade change listeners to auto-suggest official textbook structure
  document.getElementById('select-mata-pelajaran')?.addEventListener('change', async (e) => {
    const mapel = e.target.value;
    const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
    isCustomPdfUploaded = false;
    await loadBookProfilesForClass(kelas, mapel);
    updatePreviewDataCp(mapel, kelas);
    showToast(`Struktur materi disesuaikan dengan ${mapel} (${kelas})`, 'info');
  });

  document.getElementById('select-jenjang-kelas')?.addEventListener('change', async (e) => {
    const kelas = e.target.value;
    const kNum = parseInt(kelas.replace(/\D/g, ''), 10) || 5;
    const mapelEl = document.getElementById('select-mata-pelajaran');
    let mapel = mapelEl?.value || 'Bahasa Indonesia';

    // Update visibility and disabled state of IPAS and Koding
    const ipasOpt = mapelEl?.querySelector('option[value="Ilmu Pengetahuan Alam dan Sosial (IPAS)"]');
    const kodingOpt = mapelEl?.querySelector('option[value="Koding dan Kecerdasan Artifisial"]');

    if (kNum <= 2) {
      if (ipasOpt) {
        ipasOpt.disabled = true;
        ipasOpt.classList.add('hidden');
      }
      if (mapel === 'Ilmu Pengetahuan Alam dan Sosial (IPAS)') {
        mapel = 'Bahasa Indonesia';
        if (mapelEl) mapelEl.value = 'Bahasa Indonesia';
        showToast(`IPAS tidak ada di ${kelas} (Fase A), otomatis dialihkan ke Bahasa Indonesia.`, 'info');
      }
    } else {
      if (ipasOpt) {
        ipasOpt.disabled = false;
        ipasOpt.classList.remove('hidden');
      }
    }

    if (kNum < 5) {
      if (kodingOpt) {
        kodingOpt.disabled = true;
        kodingOpt.classList.add('hidden');
      }
      if (mapel === 'Koding dan Kecerdasan Artifisial') {
        mapel = 'Bahasa Indonesia';
        if (mapelEl) mapelEl.value = 'Bahasa Indonesia';
        showToast(`Koding & AI baru dimulai di Kelas 5, otomatis dialihkan ke Bahasa Indonesia.`, 'info');
      }
    } else {
      if (kodingOpt) {
        kodingOpt.disabled = false;
        kodingOpt.classList.remove('hidden');
      }
    }

    isCustomPdfUploaded = false;
    await loadBookProfilesForClass(kelas, mapel);
    updatePreviewDataCp(mapel, kelas);
    showToast(`Struktur materi disesuaikan untuk ${kelas} (${mapel})`, 'info');
  });

  // Listener Pemilihan Profil Buku dari Dropdown
  document.getElementById('select-book-profile')?.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val === '__custom_upload__') {
      showToast('Silakan unggah PDF atau tempel teks daftar isi buku di bawah.', 'info');
      document.getElementById('tab-view-pdf')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const mapel = document.getElementById('select-mata-pelajaran')?.value || 'IPAS';
    const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
    const k = String(kelas).replace(/\D/g, '') || '5';
    const storageKey = `kkg_book_profile_${mapel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${k}`;

    const profile = availableBookProfiles.find(p => String(p.id) === String(val));
    if (profile) {
      selectedBookProfileId = String(profile.id);
      localStorage.setItem(storageKey, selectedBookProfileId);

      const cov = document.getElementById('input-book-coverage')?.value || 'all';
      let chs = JSON.parse(JSON.stringify(profile.chapters));
      if (cov === '1') {
        const sem1Only = chs.filter(c => c.semester === 1);
        chs = sem1Only.length > 0 ? sem1Only : chs.map(c => ({ ...c, semester: 1 }));
      } else if (cov === '2') {
        const sem2Only = chs.filter(c => c.semester === 2);
        chs = sem2Only.length > 0 ? sem2Only : chs.map(c => ({ ...c, semester: 2 }));
      }
      detectedChapters = chs;

      const titleInput = document.getElementById('input-sumber-buku');
      if (titleInput) {
        const suffix = cov === '1' ? ' (Semester 1)' : cov === '2' ? ' (Semester 2)' : '';
        titleInput.value = (profile.buku_judul || `Buku Siswa ${mapel} Kelas ${k}`) + suffix;
      }

      const infoBadge = document.getElementById('book-profile-info-badge');
      if (infoBadge) {
        infoBadge.innerHTML = `
          <span><i class="fas fa-calendar-alt text-indigo-500 mr-1"></i>Tahun: <strong>${profile.tahun_terbit || '-'}</strong> | Penerbit: <strong>${escapeHtml(profile.penerbit || 'Kemendikbudristek')}</strong></span>
          <span><i class="fas fa-list-check text-sky-500 mr-1"></i><strong>${profile.total_babs}</strong> Bab</span>
        `;
      }

      const deleteBtn = document.getElementById('btn-delete-book-profile');
      if (deleteBtn) {
        if (profile.is_custom) {
          deleteBtn.classList.remove('hidden');
        } else {
          deleteBtn.classList.add('hidden');
        }
      }

      redistributeSemesters(cov);
      renderChaptersList();
      showToast(`Struktur bab dialihkan ke: ${profile.buku_judul}`, 'success');
    }
  });

  // Segarkan Profil Buku
  document.getElementById('btn-refresh-book-profiles')?.addEventListener('click', async () => {
    const mapel = document.getElementById('select-mata-pelajaran')?.value || 'IPAS';
    const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
    await loadBookProfilesForClass(kelas, mapel);
    showToast('Daftar profil buku berhasil disegarkan.', 'success');
  });

  // Hapus Profil Buku Kustom
  document.getElementById('btn-delete-book-profile')?.addEventListener('click', async () => {
    if (!selectedBookProfileId || selectedBookProfileId.startsWith('preset_')) {
      showToast('Hanya buku kustom yang dapat dihapus.', 'warning');
      return;
    }
    const profile = availableBookProfiles.find(p => String(p.id) === String(selectedBookProfileId));
    const title = profile?.buku_judul || 'Buku ini';
    if (!confirm(`Apakah Anda yakin ingin menghapus profil buku:\n"${title}"?`)) {
      return;
    }
    try {
      showLoading('Menghapus Profil...', 'Menghapus profil buku dari database');
      await deleteBookProfile(selectedBookProfileId);
      hideLoading();
      showToast('Profil buku berhasil dihapus.', 'success');

      const mapel = document.getElementById('select-mata-pelajaran')?.value || 'IPAS';
      const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
      const k = String(kelas).replace(/\D/g, '') || '5';
      const storageKey = `kkg_book_profile_${mapel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${k}`;
      localStorage.removeItem(storageKey);

      await loadBookProfilesForClass(kelas, mapel);
    } catch (err) {
      hideLoading();
      showToast('Gagal menghapus profil buku: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
  });

  // Simpan Struktur Bab Sebagai Profil Buku Baru
  document.getElementById('btn-save-as-new-book')?.addEventListener('click', async () => {
    if (!detectedChapters || detectedChapters.length === 0) {
      showToast('Belum ada bab yang dimuat untuk disimpan sebagai profil buku.', 'warning');
      return;
    }

    const currentTitle = document.getElementById('input-sumber-buku')?.value || '';
    const mapel = document.getElementById('select-mata-pelajaran')?.value || 'IPAS';
    const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';

    const inputTitle = prompt('Masukkan Judul / Nama Buku:', currentTitle);
    if (!inputTitle || !inputTitle.trim()) return;

    let defaultYear = 2025;
    const yearMatch = inputTitle.match(/\b(202[0-9])\b/);
    if (yearMatch) defaultYear = parseInt(yearMatch[1], 10);

    const inputYearStr = prompt('Masukkan Tahun Terbit Buku (misal: 2025):', String(defaultYear));
    if (!inputYearStr) return;
    const inputYear = parseInt(inputYearStr.replace(/\D/g, ''), 10) || defaultYear;

    const inputPenerbit = prompt('Masukkan Penerbit / Pengarang (misal: Kemendikbudristek / Erlangga / Yudhistira / Guru):', 'Kemendikbudristek');
    if (inputPenerbit === null) return;

    try {
      showLoading('Menyimpan Profil Buku...', 'Menyimpan struktur bab ke database untuk digunakan bersama guru lain');
      const res = await saveBookProfile({
        mataPelajaran: mapel,
        jenjangKelas: kelas,
        bukuJudul: inputTitle.trim(),
        tahunTerbit: inputYear,
        penerbit: (inputPenerbit || 'Kemendikbudristek / Mandiri').trim(),
        chapters: detectedChapters
      });
      hideLoading();

      if (res && res.success) {
        showToast('Profil struktur buku baru berhasil disimpan ke database!', 'success');
        const newId = res.data?.id;
        await loadBookProfilesForClass(kelas, mapel, newId);
      } else {
        throw new Error(res?.error || 'Gagal menyimpan profil');
      }
    } catch (err) {
      hideLoading();
      showToast('Gagal menyimpan profil buku: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
  });

  // Global click handler for loading official presets button in Card 3
  document.addEventListener('click', async (e) => {
    const btnPreset = e.target.closest('#btn-load-official-preset');
    if (btnPreset) {
      const kelas = document.getElementById('select-jenjang-kelas')?.value || 'Kelas 5';
      const mapel = document.getElementById('select-mata-pelajaran')?.value || 'Bahasa Indonesia';
      isCustomPdfUploaded = false;
      await loadBookProfilesForClass(kelas, mapel);
      showToast(`Berhasil memuat struktur 8 BAB resmi Kemendikbudristek untuk ${mapel} (${kelas})!`, 'success');
    }
  });

  // Toggle Collapsible Details Box for CP
  document.getElementById('btn-toggle-cp-details')?.addEventListener('click', () => {
    const box = document.getElementById('preview-cp-details-box');
    const text = document.getElementById('btn-toggle-cp-text');
    const icon = document.getElementById('btn-toggle-cp-icon');
    if (!box) return;
    const isHidden = box.classList.contains('hidden');
    if (isHidden) {
      box.classList.remove('hidden');
      if (text) text.textContent = 'Tutup Rincian';
      if (icon) icon.className = 'fas fa-chevron-up text-[9px]';
    } else {
      box.classList.add('hidden');
      if (text) text.textContent = 'Lihat Rincian';
      if (icon) icon.className = 'fas fa-chevron-down text-[9px]';
    }
  });

  // Load initial chapters if empty or if no active analysis session
  const activeKelas = document.getElementById('select-jenjang-kelas')?.value || `Kelas ${detectUserDefaultKelas(state.user)}`;
  const activeMapel = document.getElementById('select-mata-pelajaran')?.value || detectUserDefaultMapel(state.user, detectUserDefaultKelas(state.user));
  updatePreviewDataCp(activeMapel, activeKelas);
  if (detectedChapters.length === 0 || !currentAnalysisData) {
    loadBookProfilesForClass(activeKelas, activeMapel);
  }
}

/**
 * Memperbarui Pratinjau Data Awal Capaian Pembelajaran (CP) di Kartu 1
 */
export function updatePreviewDataCp(mapel, kelas) {
  const summaryEl = document.getElementById('preview-cp-summary');
  const tagsEl = document.getElementById('preview-cp-elements-tags');
  const detailsBox = document.getElementById('preview-cp-details-box');
  const badgeFase = document.getElementById('badge-cp-fase');
  if (!summaryEl) return;

  const applyCpData = (cpData) => {
    if (!cpData) return;

    if (badgeFase) {
      badgeFase.textContent = `${cpData.fase} • ${cpData.kelas}`;
    }

    if (summaryEl) {
      summaryEl.textContent = cpData.capaian_umum || 'Capaian pembelajaran mata pelajaran pada fase ini.';
    }

    if (tagsEl && Array.isArray(cpData.capaian_elemen)) {
      tagsEl.innerHTML = cpData.capaian_elemen.map(el => `
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 shadow-2xs">
          ${escapeHtml(el.elemen)}
        </span>
      `).join('');
    }

    if (detailsBox && Array.isArray(cpData.capaian_elemen)) {
      detailsBox.innerHTML = cpData.capaian_elemen.map(el => `
        <div class="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40">
          <div class="font-bold text-emerald-900 dark:text-emerald-300 text-[10.5px] mb-0.5">${escapeHtml(el.elemen)}:</div>
          <div class="text-slate-700 dark:text-slate-300 text-[10px] leading-relaxed">${escapeHtml(el.cp)}</div>
        </div>
      `).join('');
    }
  };

  try {
    // 1. Terapkan data lokal secara instan (tanpa flicker/delay)
    const localData = getOfficialCpDocumentDataClient(mapel, kelas);
    applyCpData(localData);

    // 2. Sinkronkan dengan server (jika ada data database kustom)
    api(`/analisis-cp/official-cp?mapel=${encodeURIComponent(mapel || '')}&kelas=${encodeURIComponent(kelas || '')}`)
      .then(res => {
        if (res && res.success && res.data) {
          applyCpData(res.data);
        }
      })
      .catch(() => {});
  } catch (err) {
    console.error('Error updating preview Data CP:', err);
  }
}

/**
 * Memuat daftar profil buku yang tersedia (buku standar Kemendikbud & buku kustom yang pernah diunggah/dibuat guru)
 * Otomatis memprioritaskan:
 * 1. preferProfileId (jika baru saja diekstrak / disimpan)
 * 2. Profil tersimpan di localStorage pengguna untuk mapel+kelas ini
 * 3. Buku dengan tahun terbit terbaru (Default: is_default = true)
 */
async function loadBookProfilesForClass(kelas, mapelName, preferProfileId = null) {
  const k = String(kelas || '5').replace(/\D/g, '') || '5';
  const normMapel = mapelName || document.getElementById('select-mata-pelajaran')?.value || 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
  const cov = document.getElementById('input-book-coverage')?.value || document.getElementById('select-target-semester')?.value || 'all';

  const selectEl = document.getElementById('select-book-profile');
  const infoBadge = document.getElementById('book-profile-info-badge');
  const deleteBtn = document.getElementById('btn-delete-book-profile');

  if (selectEl) {
    selectEl.innerHTML = '<option value="">Memuat daftar buku...</option>';
  }

  const data = await fetchBookProfiles(normMapel, `Kelas ${k}`, cov);
  availableBookProfiles = data?.profiles || [];

  // Jika profiles kosong, buat minimal 1 default preset
  if (availableBookProfiles.length === 0) {
    const fallbackPreset = await fetchStandardChapters(normMapel, `Kelas ${k}`);
    availableBookProfiles = [{
      id: `preset_${normMapel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${k}`,
      buku_judul: fallbackPreset.buku_judul,
      tahun_terbit: 2024,
      penerbit: 'Kemendikbudristek',
      total_babs: fallbackPreset.chapters.length,
      chapters: fallbackPreset.chapters,
      is_default: true,
      is_custom: false
    }];
  }

  // Tentukan profil mana yang harus dipilih
  const storageKey = `kkg_book_profile_${normMapel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${k}`;
  const savedProfileId = localStorage.getItem(storageKey);

  let targetProfile = null;
  if (preferProfileId) {
    targetProfile = availableBookProfiles.find(p => String(p.id) === String(preferProfileId));
  }
  if (!targetProfile && savedProfileId) {
    targetProfile = availableBookProfiles.find(p => String(p.id) === String(savedProfileId));
  }
  if (!targetProfile) {
    targetProfile = availableBookProfiles.find(p => p.is_default) || availableBookProfiles[0];
  }

  selectedBookProfileId = targetProfile ? String(targetProfile.id) : null;

  // Render options ke select dropdown
  if (selectEl) {
    let optionsHtml = '';
    availableBookProfiles.forEach(p => {
      const isSel = targetProfile && String(p.id) === String(targetProfile.id);
      const isDef = p.is_default;
      const yr = p.tahun_terbit ? `[${p.tahun_terbit}] ` : '';
      const defBadge = isDef ? '★ ' : '';
      const customTag = p.is_custom ? ' (Buku Kustom)' : ' (Resmi Kemendikbud)';
      optionsHtml += `<option value="${p.id}" ${isSel ? 'selected' : ''}>${defBadge}${yr}${escapeHtml(p.buku_judul)} - ${p.total_babs} Bab${customTag}</option>`;
    });

    optionsHtml += `<option value="__custom_upload__">➕ Unggah E-Book PDF / Input Struktur Baru...</option>`;
    selectEl.innerHTML = optionsHtml;
  }

  // Tampilkan/sembunyikan tombol hapus jika buku kustom
  if (deleteBtn) {
    if (targetProfile && targetProfile.is_custom) {
      deleteBtn.classList.remove('hidden');
    } else {
      deleteBtn.classList.add('hidden');
    }
  }

  // Update info badge
  if (infoBadge && targetProfile) {
    infoBadge.innerHTML = `
      <span><i class="fas fa-calendar-alt text-indigo-500 mr-1"></i>Tahun: <strong>${targetProfile.tahun_terbit || '-'}</strong> | Penerbit: <strong>${escapeHtml(targetProfile.penerbit || 'Kemendikbudristek')}</strong></span>
      <span><i class="fas fa-list-check text-sky-500 mr-1"></i><strong>${targetProfile.total_babs}</strong> Bab</span>
    `;
  }

  // Terapkan chapters ke staging
  if (targetProfile && Array.isArray(targetProfile.chapters)) {
    let chs = JSON.parse(JSON.stringify(targetProfile.chapters));
    if (cov === '1') {
      const sem1Only = chs.filter(c => c.semester === 1);
      chs = sem1Only.length > 0 ? sem1Only : chs.map(c => ({ ...c, semester: 1 }));
    } else if (cov === '2') {
      const sem2Only = chs.filter(c => c.semester === 2);
      chs = sem2Only.length > 0 ? sem2Only : chs.map(c => ({ ...c, semester: 2 }));
    }
    detectedChapters = chs;

    const titleInput = document.getElementById('input-sumber-buku');
    if (titleInput) {
      const suffix = cov === '1' ? ' (Semester 1)' : cov === '2' ? ' (Semester 2)' : '';
      titleInput.value = (targetProfile.buku_judul || `Buku Siswa ${normMapel} Kelas ${k}`) + suffix;
    }

    if (selectedBookProfileId) {
      localStorage.setItem(storageKey, selectedBookProfileId);
    }
  }

  redistributeSemesters(cov);
  renderChaptersList();
}

/**
 * Seed default chapters sesuai mapel dan kelas menggunakan backend API (ter-cache client side)
 */
async function seedDefaultChaptersForClass(kelas, mapelName) {
  return await loadBookProfilesForClass(kelas, mapelName);
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

  // 1. Smart Auto-Detection dari Nama File
  const lowerName = file.name.toLowerCase();
  let detectedSemester = null;
  if (/\b(semester\s*1|smt\s*1|sem\s*1|ganjil|jilid\s*a|volume\s*1|vol\s*1|buku\s*1)\b/i.test(lowerName)) {
    detectedSemester = '1';
  } else if (/\b(semester\s*2|smt\s*2|sem\s*2|genap|jilid\s*b|volume\s*2|vol\s*2|buku\s*2)\b/i.test(lowerName)) {
    detectedSemester = '2';
  }

  if (detectedSemester) {
    setBookCoverage(detectedSemester);
    const badge = document.getElementById('badge-detected-coverage');
    if (badge) {
      badge.innerText = `Terdeteksi: Smt ${detectedSemester}`;
      badge.classList.remove('hidden');
    }
  }

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

      // 2. Smart Auto-Detection dari teks halaman awal jika belum terdeteksi dari nama file
      if (!detectedSemester && i <= 10) {
        if (/\b(semester\s*1|semester\s*ganjil|smt\s*1)\b/i.test(lower)) {
          detectedSemester = '1';
          setBookCoverage('1');
          const badge = document.getElementById('badge-detected-coverage');
          if (badge) {
            badge.innerText = 'Terdeteksi: Smt 1';
            badge.classList.remove('hidden');
          }
        } else if (/\b(semester\s*2|semester\s*genap|smt\s*2)\b/i.test(lower)) {
          detectedSemester = '2';
          setBookCoverage('2');
          const badge = document.getElementById('badge-detected-coverage');
          if (badge) {
            badge.innerText = 'Terdeteksi: Smt 2';
            badge.classList.remove('hidden');
          }
        }
      }

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
    if (sumberBukuInput) {
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
  const coverage = document.getElementById('input-book-coverage')?.value || document.getElementById('select-target-semester')?.value || 'all';

  const heuristicChapters = parseChaptersHeuristically(rawText);

  try {
    const res = await api('/analisis-cp/extract-structure', {
      method: 'POST',
      body: {
        text: rawText,
        mataPelajaran: mapel,
        jenjangKelas: kelas,
        targetSemester: coverage,
        bookCoverage: coverage,
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
        if (titleInput) {
          titleInput.value = res.data.buku_judul;
        }
      }

      redistributeSemesters(coverage);
      renderChaptersList();

      // Refresh profil buku dan otomatis pilih buku yang baru diekstrak ini
      await loadBookProfilesForClass(kelas, mapel, res.data.profile_id || null);

      if (res.data.is_enriched) {
        showToast(`Struktur bab lengkap (${detectedChapters.length} BAB) berhasil disinkronkan dengan kurikulum resmi Kemendikbudristek!`, 'success');
      } else {
        showToast(`Berhasil mengekstrak ${detectedChapters.length} BAB dan menyimpannya sebagai profil buku baru!`, 'success');
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
      redistributeSemesters(coverage);
      renderChaptersList();

      const titleInput = document.getElementById('input-sumber-buku');
      const bookTitle = titleInput?.value || `Buku Siswa ${mapel} ${kelas}`;
      let year = 2025;
      const ym = bookTitle.match(/\b(202[0-9])\b/);
      if (ym) year = parseInt(ym[1], 10);

      try {
        const saveRes = await saveBookProfile({
          mataPelajaran: mapel,
          jenjangKelas: kelas,
          bukuJudul: bookTitle,
          tahunTerbit: year,
          penerbit: 'Ekstraksi PDF / Guru Pengunggah',
          chapters: detectedChapters
        });
        if (saveRes?.data?.id) {
          await loadBookProfilesForClass(kelas, mapel, saveRes.data.id);
        }
      } catch (_) {}

      showToast(`Berhasil memuat ${detectedChapters.length} BAB langsung dari Daftar Isi file PDF!`, 'success');
    } else {
      await loadBookProfilesForClass(kelas, mapel);
      showToast(`Koneksi AI sibuk. Struktur BAB standar resmi Kemendikbudristek untuk ${mapel} telah dimuat otomatis.`, 'info');
    }
  }
}

/**
 * Mengatur mode cakupan buku ajar: 'all' (1 tahun), '1' (Semester 1 saja), '2' (Semester 2 saja)
 */
function setBookCoverage(coverage) {
  const cov = coverage || 'all';
  const hiddenInput = document.getElementById('input-book-coverage');
  if (hiddenInput) hiddenInput.value = cov;

  const targetSelect = document.getElementById('select-target-semester');
  if (targetSelect && targetSelect.value !== cov) {
    targetSelect.value = cov;
  }

  document.querySelectorAll('#coverage-selector .coverage-btn').forEach(btn => {
    if (btn.dataset.coverage === cov) {
      btn.className = 'coverage-btn active py-1.5 px-1 rounded-xl text-center transition-all bg-indigo-600 text-white shadow-xs text-[10.5px] font-extrabold cursor-pointer';
    } else {
      btn.className = 'coverage-btn py-1.5 px-1 rounded-xl text-center transition-all bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold cursor-pointer';
    }
  });

  redistributeSemesters(cov);
  renderChaptersList();
}

/**
 * Aturan alokasi semester bab:
 * - Jika cakupan buku '1': seluruh bab menjadi Semester 1 (TIDAK DIBAGI 2)
 * - Jika cakupan buku '2': seluruh bab menjadi Semester 2 (TIDAK DIBAGI 2)
 * - Jika cakupan buku 'all': genap dibagi 2 sama rata, ganjil semester 1 lebih banyak 1 bab
 */
function redistributeSemesters(forceCoverage) {
  const cov = forceCoverage || document.getElementById('input-book-coverage')?.value || document.getElementById('select-target-semester')?.value || 'all';
  const total = detectedChapters.length;
  const sem1Count = Math.ceil(total / 2);

  detectedChapters.forEach((ch, idx) => {
    ch.no = idx + 1;
    if (cov === '1') {
      ch.semester = 1;
    } else if (cov === '2') {
      ch.semester = 2;
    } else {
      // 1 Tahun Penuh ('all')
      if (typeof ch.semester !== 'number' || forceCoverage === 'all') {
        ch.semester = idx < sem1Count ? 1 : 2;
      }
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
      saveDraftToStorage();
    });
  });

  container.querySelectorAll('.chapter-materi-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.idx);
      if (detectedChapters[idx]) {
        detectedChapters[idx].materi_pokok = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
        saveDraftToStorage();
      }
    });
  });

  container.querySelectorAll('.btn-toggle-sem').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.dataset.idx);
      if (detectedChapters[idx]) {
        detectedChapters[idx].semester = detectedChapters[idx].semester === 1 ? 2 : 1;
        renderChaptersList();
        saveDraftToStorage();
      }
    });
  });

  container.querySelectorAll('.btn-delete-bab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.dataset.idx);
      detectedChapters.splice(idx, 1);
      redistributeSemesters();
      renderChaptersList();
      saveDraftToStorage();
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
    bookCoverage: formData.get('bookCoverage') || 'all',
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
        saveDraftToStorage();
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
        saveDraftToStorage();
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
