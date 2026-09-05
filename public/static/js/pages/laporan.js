import { api } from '../api.js';
import { showToast, showLoading, hideLoading, escapeHtml, getActiveTahunAjaran, populateAiModelSelect, getActiveAiProviders } from '../utils.js';
import { state } from '../state.js';
import { renderAdminLayout } from '../layouts/admin.js';

let laporanList = [];
let activeLaporanId = null;
let currentLaporanData = {
    judul_laporan: '',
    periode: '',
    tema: '',
    tempat: '',
    narasumber: '',
    pendahuluan_latar_belakang: '',
    pendahuluan_tujuan: '',
    pendahuluan_manfaat: '',
    pelaksanaan_waktu_tempat: '',
    pelaksanaan_materi: '',
    pelaksanaan_peserta: '',
    hasil_uraian: '',
    hasil_tindak_lanjut: '',
    hasil_dampak: '',
    penutup_simpulan: '',
    penutup_saran: '',
    lampiran_foto: [],
    status: 'draft'
};
let isInlineEditing = false;

// Main Render Function
export async function renderLaporan() {
    // 1. Fetch saved reports list
    try {
        const res = await api('/laporan');
        if (res.success) {
            laporanList = res.data || [];
        }
    } catch (e) {
        console.error('Error fetching laporan:', e);
        showToast('Gagal memuat daftar riwayat laporan', 'error');
    }

    const currentYear = getActiveTahunAjaran();
    const namaOrg = state.settings?.nama_organisasi || 'KKG Gugus 3 Wanayasa';
    const namaKetua = state.settings?.nama_ketua || 'Admin KKG Gugus 3';
    const nipKetua = state.settings?.nip_ketua || '-';

    const content = `
    <div class="animate-fade-in max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        
        <!-- 1. HEADER SECTION (No-Print) -->
        <div class="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <i class="fas fa-file-signature text-2xl"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2.5 flex-wrap">
                        <h1 class="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                            Laporan Kegiatan (LPJ) KKG
                        </h1>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            T.A ${escapeHtml(currentYear)}
                        </span>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Penyusunan Laporan Pertanggungjawaban Kegiatan Resmi Berstandar Dinas dengan Dukungan AI
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button type="button" onclick="openHistoryDrawer()" class="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold border border-gray-200 dark:border-gray-600 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                    <i class="fas fa-history text-amber-500"></i>
                    <span>Riwayat LPJ</span>
                    <span id="laporan-count-badge" class="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                        ${laporanList.length}
                    </span>
                </button>
                <button type="button" onclick="resetLaporanForm()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95">
                    <i class="fas fa-plus"></i>
                    <span>Buat Laporan Baru</span>
                </button>
            </div>
        </div>

        <!-- 2. STUDIO VIEW TABS (No-Print) -->
        <div class="no-print flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
            <div class="flex gap-2">
                <button type="button" id="tab-btn-form" onclick="switchStudioTab('form')" class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <i class="fas fa-sliders-h"></i>
                    <span>Form & Parameter</span>
                </button>
                <button type="button" id="tab-btn-preview" onclick="switchStudioTab('preview')" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <i class="fas fa-file-alt"></i>
                    <span>Pratinjau Dokumen A4</span>
                    <span id="preview-indicator" class="hidden w-2 h-2 rounded-full bg-emerald-500"></span>
                </button>
            </div>
            <div class="text-xs text-gray-500 hidden sm:flex items-center gap-1.5">
                <i class="fas fa-shield-alt text-emerald-500"></i>
                <span>Tersinkronisasi dengan Pengaturan Organisasi</span>
            </div>
        </div>

        <!-- 3. VIEW: FORM & PARAMETER -->
        <div id="studio-view-form" class="space-y-6">
            <form id="laporan-main-form" onsubmit="event.preventDefault();" class="space-y-6">
                
                <!-- Card 1: Informasi Kegiatan & Identitas Organisasi -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                                <i class="fas fa-info-circle text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-gray-900 dark:text-white">Informasi Dasar Kegiatan</h3>
                                <p class="text-xs text-gray-500">Isi data umum kegiatan yang akan disusunkan laporannya</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200/60 dark:border-gray-700">
                            <span class="font-medium text-gray-700 dark:text-gray-300">${escapeHtml(namaOrg)}</span>
                            <span>•</span>
                            <span class="font-medium text-indigo-600 dark:text-indigo-400">T.A ${escapeHtml(currentYear)}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="col-span-1 md:col-span-2">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Judul Laporan Kegiatan <span class="text-rose-500">*</span>
                            </label>
                            <input type="text" id="input-judul_laporan" required
                                placeholder="Contoh: Laporan Kegiatan Workshop Pembelajaran Mendalam Berbasis AI Guru Gugus 3"
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Periode / Tanggal Pelaksanaan <span class="text-rose-500">*</span>
                            </label>
                            <input type="text" id="input-periode" required
                                placeholder="Contoh: Sabtu, 14 Februari 2026"
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Tema / Fokus Kegiatan
                            </label>
                            <input type="text" id="input-tema"
                                placeholder="Contoh: Penguatan Literasi Digital dan Pemanfaatan AI untuk Guru SD"
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Tempat / Lokasi Kegiatan
                            </label>
                            <input type="text" id="input-tempat"
                                placeholder="Contoh: Gedung Pertemuan SDN 1 Wanayasa"
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Narasumber / Fasilitator
                            </label>
                            <input type="text" id="input-narasumber"
                                placeholder="Contoh: Dr. H. Ahmad Sudrajat, M.Pd (Pengawas Pembina)"
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        </div>
                    </div>
                </div>

                <!-- Card 2: Pemilihan AI Provider Dinamis (Dikelola Administrator) -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                                <i class="fas fa-brain text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-gray-900 dark:text-white">Pilih AI Provider (Dikelola Administrator)</h3>
                                <p class="text-xs text-gray-500">Pilihan model AI disinkronkan secara dinamis dari database penyedia AI yang dikonfigurasi oleh Admin</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
                            <i class="fas fa-server text-[10px]"></i>
                            <span>Admin AI Gateway</span>
                        </div>
                    </div>

                    <div class="space-y-4 pt-1">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Model / Engine AI Aktif <span class="text-rose-500">*</span>
                            </label>
                            <div class="relative">
                                <select id="input-ai_model" name="ai_model" class="w-full px-4 py-3.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm cursor-pointer">
                                    <option value="">Memuat daftar provider AI admin...</option>
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <i class="fas fa-chevron-down text-xs"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Live Selected Provider Details Banner -->
                        <div id="ai-provider-detail-box" class="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-4 text-xs">
                            <div class="flex items-center gap-2.5">
                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                <div>
                                    <span class="font-bold text-gray-800 dark:text-gray-200" id="ai-detail-name">Memuat Provider AI...</span>
                                    <span class="text-gray-500 dark:text-gray-400 text-[11px] ml-1.5" id="ai-detail-model"></span>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800 shrink-0 uppercase tracking-wider" id="ai-detail-type">
                                Siap Digunakan
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Card 3: Lampiran Foto Dokumentasi Kegiatan -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 rounded-xl">
                                <i class="fas fa-camera text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-gray-900 dark:text-white">Lampiran Foto Dokumentasi Kegiatan</h3>
                                <p class="text-xs text-gray-500">Foto dokumentasi akan otomatis dimasukkan ke lampiran laporan dan file Word (.docx)</p>
                            </div>
                        </div>
                        <button type="button" onclick="triggerFotoUpload()" class="px-4 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 text-xs font-bold border border-pink-200 dark:border-pink-800 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto">
                            <i class="fas fa-upload"></i> Unggah Foto Kegiatan
                        </button>
                        <input type="file" id="foto-uploader" class="hidden" accept="image/*" multiple onchange="handleFotoUploadBatch(this)">
                    </div>

                    <div id="foto-gallery-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        <!-- Rendered dynamically -->
                    </div>
                    
                    <div id="foto-empty-state" class="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <i class="fas fa-images text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
                        <p class="text-sm font-medium text-gray-500">Belum ada foto dokumentasi yang dilampirkan.</p>
                        <p class="text-xs text-gray-400 mt-1">Klik tombol 'Unggah Foto Kegiatan' di atas untuk melampirkan foto acara.</p>
                    </div>
                </div>

                <!-- 4. GENERATE BANNER ACTION -->
                <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="relative z-10 space-y-1 text-center md:text-left">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-2">
                            <i class="fas fa-sparkles text-amber-300"></i> AI Studio Generator
                        </div>
                        <h3 class="text-xl md:text-2xl font-bold">Siap Menyusun Laporan Pertanggungjawaban?</h3>
                        <p class="text-blue-100 text-sm max-w-xl">
                            AI akan menyusun draf resmi lengkap dari Pendahuluan, Waktu/Tempat, Uraian Materi, Hasil & Dampak, hingga Lembar Pengesahan.
                        </p>
                    </div>

                    <div class="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <button type="button" id="btn-generate-ai" onclick="generateAIContent()" class="w-full sm:w-auto px-8 py-4 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-base cursor-pointer active:scale-95 whitespace-nowrap">
                            <i class="fas fa-magic text-indigo-600"></i>
                            <span>Generate Draf dengan AI</span>
                        </button>
                        <button type="button" onclick="switchStudioTab('preview')" class="w-full sm:w-auto px-5 py-4 bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold rounded-xl border border-indigo-400/40 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                            <i class="fas fa-eye"></i>
                            <span>Buka Pratinjau Langsung</span>
                        </button>
                    </div>
                </div>

            </form>
        </div>

        <!-- 4. VIEW: PRATINJAU DOKUMEN A4 -->
        <div id="studio-view-preview" class="hidden space-y-6">
            
            <!-- Toolbar Aksi Preview (No-Print) -->
            <div class="no-print bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-20 z-20 backdrop-blur-md bg-white/95 dark:bg-gray-800/95">
                <div class="flex items-center gap-2 flex-wrap">
                    <button type="button" onclick="switchStudioTab('form')" class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                        <i class="fas fa-arrow-left"></i> Kembali ke Form
                    </button>
                    <button type="button" id="btn-toggle-edit" onclick="toggleInlineEditing()" class="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1.5 cursor-pointer">
                        <i class="fas fa-pen-fancy"></i> <span id="toggle-edit-label">Mode Edit Teks</span>
                    </button>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                    <button type="button" onclick="printLaporan()" class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Cetak langsung atau simpan PDF">
                        <i class="fas fa-print text-gray-500"></i> Cetak / PDF
                    </button>
                    <button type="button" onclick="downloadCurrentDocx()" class="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1.5 cursor-pointer" title="Download dokumen Word">
                        <i class="fas fa-file-word text-blue-600"></i> Unduh DOCX
                    </button>
                    <button type="button" onclick="saveLaporanAction('draft')" class="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-yellow-950 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                        <i class="fas fa-save"></i> Simpan Draft
                    </button>
                    <button type="button" onclick="saveLaporanAction('final')" class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                        <i class="fas fa-check-circle"></i> Simpan & Sahkan
                    </button>
                </div>
            </div>

            <!-- LEMBAR KERTAS A4 DIGITAL -->
            <div class="flex justify-center bg-slate-100 dark:bg-slate-900/70 p-4 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-800">
                <div id="laporan-printable-area" class="w-full max-w-4xl bg-white text-gray-900 shadow-2xl rounded-sm p-8 sm:p-14 border border-gray-200 font-serif leading-relaxed text-sm space-y-6">
                    
                    <!-- KOP SURAT RESMI KKG -->
                    <div class="border-b-4 border-double border-gray-900 pb-3 flex items-center gap-6">
                        <img src="${escapeHtml(state.settings?.logo_url || '/static/img/logo-kkg.png')}" alt="Logo KKG" class="w-20 h-20 object-contain shrink-0" onerror="this.src='/static/img/logo-kkg.png'">
                        <div class="flex-1 text-center font-sans">
                            <h4 class="text-xs uppercase tracking-widest font-semibold text-gray-600">PEMERINTAH KABUPATEN PURWAKARTA</h4>
                            <h3 class="text-sm font-bold uppercase text-gray-800">DINAS PENDIDIKAN</h3>
                            <h2 class="text-base sm:text-lg font-black uppercase text-gray-900 tracking-wide">
                                KELOMPOK KERJA GURU (KKG) GUGUS 3 WANAYASA
                            </h2>
                            <p class="text-[11px] text-gray-600 leading-tight mt-0.5">
                                ${escapeHtml(state.settings?.alamat_sekretariat || 'Sekretariat: SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta 41174')}
                            </p>
                        </div>
                    </div>

                    <!-- JUDUL LAPORAN -->
                    <div class="text-center font-sans pt-3 space-y-1">
                        <h2 class="text-base sm:text-lg font-extrabold uppercase underline tracking-wider text-gray-950">
                            LAPORAN PERTANGGUNGJAWABAN KEGIATAN
                        </h2>
                        <h3 id="preview-judul-laporan" class="text-sm sm:text-base font-bold uppercase text-indigo-900">
                            [JUDUL LAPORAN KEGIATAN]
                        </h3>
                        <p class="text-xs font-semibold text-gray-600 tracking-wide">
                            TAHUN AJARAN <span id="preview-tahun-ajaran">${escapeHtml(currentYear)}</span>
                        </p>
                    </div>

                    <!-- RINGKASAN PELAKSANAAN -->
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs font-sans space-y-2">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div><span class="font-bold text-gray-700">Waktu / Tanggal:</span> <span id="preview-ringkasan-periode">-</span></div>
                            <div><span class="font-bold text-gray-700">Tempat:</span> <span id="preview-ringkasan-tempat">-</span></div>
                            <div><span class="font-bold text-gray-700">Fokus / Tema:</span> <span id="preview-ringkasan-tema">-</span></div>
                            <div><span class="font-bold text-gray-700">Narasumber:</span> <span id="preview-ringkasan-narasumber">-</span></div>
                        </div>
                    </div>

                    <!-- BAB I: PENDAHULUAN -->
                    <div class="space-y-3 pt-2">
                        <h3 class="font-sans font-bold text-sm uppercase tracking-wide border-b border-gray-300 pb-1 text-gray-900">
                            BAB I : PENDAHULUAN
                        </h3>
                        
                        <div class="space-y-1.5">
                            <h4 class="font-sans font-bold text-xs text-gray-800">A. Latar Belakang</h4>
                            <div id="display-pendahuluan_latar_belakang" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">
                                Belum ada teks draf. Silakan isi form atau tekan tombol 'Generate Draf dengan AI'.
                            </div>
                        </div>

                        <div class="space-y-1.5 pt-2">
                            <h4 class="font-sans font-bold text-xs text-gray-800">B. Tujuan Kegiatan</h4>
                            <div id="display-pendahuluan_tujuan" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>

                        <div class="space-y-1.5 pt-2">
                            <h4 class="font-sans font-bold text-xs text-gray-800">C. Manfaat Kegiatan</h4>
                            <div id="display-pendahuluan_manfaat" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>
                    </div>

                    <!-- BAB II: PELAKSANAAN KEGIATAN -->
                    <div class="space-y-3 pt-4">
                        <h3 class="font-sans font-bold text-sm uppercase tracking-wide border-b border-gray-300 pb-1 text-gray-900">
                            BAB II : PELAKSANAAN KEGIATAN
                        </h3>

                        <div class="space-y-1.5">
                            <h4 class="font-sans font-bold text-xs text-gray-800">A. Waktu dan Tempat Pelaksanaan</h4>
                            <div id="display-pelaksanaan_waktu_tempat" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>

                        <div class="space-y-1.5 pt-2">
                            <h4 class="font-sans font-bold text-xs text-gray-800">B. Materi dan Agenda Kegiatan</h4>
                            <div id="display-pelaksanaan_materi" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>

                        <div class="space-y-1.5 pt-2">
                            <h4 class="font-sans font-bold text-xs text-gray-800">C. Narasumber dan Peserta</h4>
                            <div id="display-pelaksanaan_peserta" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>
                    </div>

                    <!-- BAB III: HASIL KEGIATAN -->
                    <div class="space-y-3 pt-4">
                        <h3 class="font-sans font-bold text-sm uppercase tracking-wide border-b border-gray-300 pb-1 text-gray-900">
                            BAB III : HASIL KEGIATAN & EVALUASI
                        </h3>

                        <div class="space-y-1.5">
                            <h4 class="font-sans font-bold text-xs text-gray-800">A. Uraian Pelaksanaan dan Dinamika Kegiatan</h4>
                            <div id="display-hasil_uraian" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>

                        <div class="space-y-1.5 pt-2">
                            <h4 class="font-sans font-bold text-xs text-gray-800">B. Rencana Tindak Lanjut (RTL)</h4>
                            <div id="display-hasil_tindak_lanjut" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>

                        <div class="space-y-1.5 pt-2">
                            <h4 class="font-sans font-bold text-xs text-gray-800">C. Dampak dan Evaluasi Ketercapaian</h4>
                            <div id="display-hasil_dampak" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>
                    </div>

                    <!-- BAB IV: PENUTUP -->
                    <div class="space-y-3 pt-4">
                        <h3 class="font-sans font-bold text-sm uppercase tracking-wide border-b border-gray-300 pb-1 text-gray-900">
                            BAB IV : PENUTUP
                        </h3>

                        <div class="space-y-1.5">
                            <h4 class="font-sans font-bold text-xs text-gray-800">A. Simpulan</h4>
                            <div id="display-penutup_simpulan" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>

                        <div class="space-y-1.5 pt-2">
                            <h4 class="font-sans font-bold text-xs text-gray-800">B. Saran dan Rekomendasi</h4>
                            <div id="display-penutup_saran" class="text-justify text-xs sm:text-sm whitespace-pre-line text-gray-800 leading-relaxed pl-3">-</div>
                        </div>
                    </div>

                    <!-- LAMPIRAN DOKUMENTASI FOTO -->
                    <div id="preview-lampiran-section" class="space-y-3 pt-6 border-t border-gray-200">
                        <h3 class="font-sans font-bold text-sm uppercase tracking-wide border-b border-gray-300 pb-1 text-gray-900">
                            LAMPIRAN : DOKUMENTASI KEGIATAN
                        </h3>
                        <div id="preview-foto-grid" class="grid grid-cols-2 gap-4 pt-2">
                            <!-- Rendered dynamically -->
                        </div>
                    </div>

                    <!-- LEMBAR PENGESAHAN TANDA TANGAN -->
                    <div class="pt-8 font-sans text-xs sm:text-sm break-inside-avoid">
                        <div class="text-right mb-4">
                            Wanayasa, <span id="preview-tanggal-pengesahan">........................ 2026</span>
                        </div>
                        
                        <div class="grid grid-cols-2 text-center gap-8">
                            <div>
                                <p class="text-gray-700">Pelaksana Kegiatan / Sekretaris,</p>
                                <div class="h-20 flex items-center justify-center text-gray-300 italic text-xs">( Tanda Tangan )</div>
                                <p class="font-bold text-gray-950 underline" id="preview-nama-pelaksana">Narasumber / Panitia</p>
                                <p class="text-gray-500 text-xs">Penanggung Jawab Kegiatan</p>
                            </div>

                            <div>
                                <p class="text-gray-700">Mengetahui,</p>
                                <p class="text-gray-700">Ketua KKG Gugus 3 Wanayasa,</p>
                                <div class="h-16 flex items-center justify-center text-gray-300 italic text-xs">( Tanda Tangan & Cap )</div>
                                <p class="font-bold text-gray-950 underline">${escapeHtml(namaKetua)}</p>
                                <p class="text-gray-500 text-xs">NIP. ${escapeHtml(nipKetua)}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- 5. SLIDE-OVER DRAWER: RIWAYAT LAPORAN (No-Print) -->
        <div id="laporan-history-drawer" class="no-print fixed inset-0 z-50 hidden" aria-modal="true" role="dialog">
            <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onclick="closeHistoryDrawer()"></div>
            <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div class="w-screen max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-700">
                    
                    <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                                <i class="fas fa-folder-open text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-gray-900 dark:text-white">Riwayat Laporan (LPJ)</h3>
                                <p class="text-xs text-gray-500">Daftar laporan kegiatan yang telah tersimpan</p>
                            </div>
                        </div>
                        <button type="button" onclick="closeHistoryDrawer()" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-6 space-y-4" id="drawer-laporan-list">
                        ${renderDrawerItems()}
                    </div>

                    <div class="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center">
                        <button type="button" onclick="resetLaporanForm(); closeHistoryDrawer();" class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm">
                            <i class="fas fa-plus mr-1.5"></i> Buat Laporan Baru
                        </button>
                    </div>
                </div>
            </div>
        </div>

    </div>
    `;

    setTimeout(() => {
        initLaporanEvents();
    }, 50);

    return renderAdminLayout(content, 'laporan');
}

// ─────────────────────────────────────────────────────────────
// COMPONENT HELPERS & EVENT HOOKS
// ─────────────────────────────────────────────────────────────

function renderDrawerItems() {
    if (!laporanList || laporanList.length === 0) {
        return `
        <div class="text-center py-12">
            <i class="fas fa-file-invoice text-3xl text-gray-300 dark:text-gray-600 mb-3"></i>
            <p class="text-sm font-medium text-gray-500">Belum ada laporan tersimpan.</p>
            <p class="text-xs text-gray-400 mt-1">Laporan yang Anda simpan akan muncul di sini.</p>
        </div>
        `;
    }

    return laporanList.map(item => `
        <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-gray-800 transition-all shadow-sm space-y-2.5">
            <div class="flex items-start justify-between gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${item.status === 'final' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}">
                    ${item.status === 'final' ? 'Final (Disahkan)' : 'Draft'}
                </span>
                <span class="text-[11px] text-gray-400">${escapeHtml(item.periode || '')}</span>
            </div>
            
            <h4 class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">${escapeHtml(item.judul_laporan)}</h4>
            
            <div class="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onclick="loadLaporanToStudio(${item.id})" class="flex-1 py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all text-center">
                    <i class="fas fa-edit mr-1"></i> Buka LPJ
                </button>
                <button type="button" onclick="downloadLaporanDocx(${item.id})" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors" title="Unduh DOCX">
                    <i class="fas fa-file-word"></i>
                </button>
                <button type="button" onclick="deleteLaporanById(${item.id})" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors" title="Hapus Laporan">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function initLaporanEvents() {
    renderFotoGallery();
    syncFormToPreview();
    await initLaporanAiProviders();
}

async function initLaporanAiProviders() {
    const selectEl = document.getElementById('input-ai_model');
    if (!selectEl) return;

    await populateAiModelSelect(selectEl);

    const updateDetailBanner = async () => {
        const providers = await getActiveAiProviders();
        const selectedSlug = selectEl.value;
        const currentP = providers.find(p => p.slug === selectedSlug);

        const nameEl = document.getElementById('ai-detail-name');
        const modelEl = document.getElementById('ai-detail-model');
        const typeEl = document.getElementById('ai-detail-type');

        if (currentP) {
            if (nameEl) nameEl.textContent = currentP.name;
            if (modelEl) modelEl.textContent = `· Model: ${currentP.model}`;
            if (typeEl) typeEl.textContent = `${(currentP.api_type || 'AI').toUpperCase()} · Aktif`;
        } else if (providers.length === 0) {
            if (nameEl) nameEl.textContent = 'Belum ada provider AI aktif';
            if (modelEl) modelEl.textContent = '· Atur di menu Admin AI Provider';
            if (typeEl) typeEl.textContent = 'Nonaktif';
        }
    };

    selectEl.addEventListener('change', updateDetailBanner);
    await updateDetailBanner();
}

function syncFormToPreview() {
    const judul = document.getElementById('input-judul_laporan')?.value || currentLaporanData.judul_laporan || '[Judul Kegiatan KKG]';
    const periode = document.getElementById('input-periode')?.value || currentLaporanData.periode || '-';
    const tema = document.getElementById('input-tema')?.value || currentLaporanData.tema || '-';
    const tempat = document.getElementById('input-tempat')?.value || currentLaporanData.tempat || '-';
    const narasumber = document.getElementById('input-narasumber')?.value || currentLaporanData.narasumber || '-';

    setElText('preview-judul-laporan', judul.toUpperCase());
    setElText('preview-ringkasan-periode', periode);
    setElText('preview-ringkasan-tema', tema);
    setElText('preview-ringkasan-tempat', tempat);
    setElText('preview-ringkasan-narasumber', narasumber);
    setElText('preview-nama-pelaksana', narasumber !== '-' ? narasumber : 'Panitia Pelaksana');
    setElText('preview-tanggal-pengesahan', periode !== '-' ? periode : '........................ 2026');

    // Content fields
    const fields = [
        'pendahuluan_latar_belakang', 'pendahuluan_tujuan', 'pendahuluan_manfaat',
        'pelaksanaan_waktu_tempat', 'pelaksanaan_materi', 'pelaksanaan_peserta',
        'hasil_uraian', 'hasil_tindak_lanjut', 'hasil_dampak',
        'penutup_simpulan', 'penutup_saran'
    ];

    fields.forEach(f => {
        const val = currentLaporanData[f] || '-';
        const displayEl = document.getElementById(`display-${f}`);
        if (displayEl) {
            displayEl.textContent = val;
        }
    });

    renderPreviewFotoGrid();
}

function renderPreviewFotoGrid() {
    const grid = document.getElementById('preview-foto-grid');
    const section = document.getElementById('preview-lampiran-section');
    if (!grid) return;

    const fotos = currentLaporanData.lampiran_foto || [];
    if (fotos.length === 0) {
        if (section) section.classList.add('hidden');
        grid.innerHTML = '';
        return;
    }

    if (section) section.classList.remove('hidden');
    grid.innerHTML = fotos.map((f, idx) => {
        const url = typeof f === 'string' ? f : f.url;
        const caption = (typeof f === 'object' && f.caption) ? f.caption : `Dokumentasi Kegiatan ${idx + 1}`;
        return `
        <div class="border border-gray-300 rounded p-2 bg-gray-50 text-center font-sans">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" class="w-full h-40 object-cover rounded mb-1.5 border border-gray-200">
            <p class="text-[10px] text-gray-700 italic">${escapeHtml(caption)}</p>
        </div>
        `;
    }).join('');
}

function renderFotoGallery() {
    const container = document.getElementById('foto-gallery-container');
    const emptyState = document.getElementById('foto-empty-state');
    if (!container) return;

    const fotos = currentLaporanData.lampiran_foto || [];
    if (fotos.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = fotos.map((f, idx) => {
        const url = typeof f === 'string' ? f : f.url;
        const caption = (typeof f === 'object' && f.caption) ? f.caption : '';
        return `
        <div class="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-2 relative group">
            <div class="relative h-32 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src="${escapeHtml(url)}" alt="Foto Kegiatan" class="w-full h-full object-cover">
                <button type="button" onclick="removeFoto(${idx})" class="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors" title="Hapus Foto">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
            <input type="text" value="${escapeHtml(caption)}" onchange="updateFotoCaption(${idx}, this.value)" placeholder="Keterangan foto..." class="w-full px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
        </div>
        `;
    }).join('');
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ─────────────────────────────────────────────────────────────
// WINDOW EXPOSED STUDIO INTERACTIONS
// ─────────────────────────────────────────────────────────────

window.switchStudioTab = (tab) => {
    const formView = document.getElementById('studio-view-form');
    const previewView = document.getElementById('studio-view-preview');
    const tabBtnForm = document.getElementById('tab-btn-form');
    const tabBtnPreview = document.getElementById('tab-btn-preview');

    if (tab === 'form') {
        formView?.classList.remove('hidden');
        previewView?.classList.add('hidden');

        tabBtnForm?.classList.add('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-500/20');
        tabBtnForm?.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');

        tabBtnPreview?.classList.remove('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-500/20');
        tabBtnPreview?.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
    } else {
        // Collect current input values into state before switching
        currentLaporanData.judul_laporan = document.getElementById('input-judul_laporan')?.value || '';
        currentLaporanData.periode = document.getElementById('input-periode')?.value || '';
        currentLaporanData.tema = document.getElementById('input-tema')?.value || '';
        currentLaporanData.tempat = document.getElementById('input-tempat')?.value || '';
        currentLaporanData.narasumber = document.getElementById('input-narasumber')?.value || '';

        syncFormToPreview();

        formView?.classList.add('hidden');
        previewView?.classList.remove('hidden');

        tabBtnPreview?.classList.add('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-500/20');
        tabBtnPreview?.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');

        tabBtnForm?.classList.remove('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-500/20');
        tabBtnForm?.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.openHistoryDrawer = () => {
    document.getElementById('laporan-history-drawer')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

window.closeHistoryDrawer = () => {
    document.getElementById('laporan-history-drawer')?.classList.add('hidden');
    document.body.style.overflow = 'auto';
};

window.resetLaporanForm = () => {
    activeLaporanId = null;
    currentLaporanData = {
        judul_laporan: '',
        periode: '',
        tema: '',
        tempat: '',
        narasumber: '',
        pendahuluan_latar_belakang: '',
        pendahuluan_tujuan: '',
        pendahuluan_manfaat: '',
        pelaksanaan_waktu_tempat: '',
        pelaksanaan_materi: '',
        pelaksanaan_peserta: '',
        hasil_uraian: '',
        hasil_tindak_lanjut: '',
        hasil_dampak: '',
        penutup_simpulan: '',
        penutup_saran: '',
        lampiran_foto: [],
        status: 'draft'
    };

    const form = document.getElementById('laporan-main-form');
    if (form) form.reset();

    renderFotoGallery();
    syncFormToPreview();
    switchStudioTab('form');
    showToast('Form laporan siap diisi untuk kegiatan baru', 'info');
};

window.triggerFotoUpload = () => {
    document.getElementById('foto-uploader')?.click();
};

window.handleFotoUploadBatch = async (input) => {
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    showLoading('Mengunggah foto dokumentasi...');

    try {
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                showToast(`Foto ${file.name} melebihi 5MB, dilewati`, 'warning');
                continue;
            }

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                currentLaporanData.lampiran_foto.push({
                    url: data.data.url,
                    caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
                });
            }
        }

        renderFotoGallery();
        renderPreviewFotoGrid();
        showToast('Foto dokumentasi berhasil ditambahkan', 'success');
    } catch (e) {
        console.error('Foto Upload Error:', e);
        showToast('Gagal mengunggah beberapa foto: ' + e.message, 'error');
    } finally {
        hideLoading();
        input.value = '';
    }
};

window.removeFoto = (index) => {
    currentLaporanData.lampiran_foto.splice(index, 1);
    renderFotoGallery();
    renderPreviewFotoGrid();
};

window.updateFotoCaption = (index, val) => {
    if (currentLaporanData.lampiran_foto[index]) {
        if (typeof currentLaporanData.lampiran_foto[index] === 'string') {
            currentLaporanData.lampiran_foto[index] = {
                url: currentLaporanData.lampiran_foto[index],
                caption: val
            };
        } else {
            currentLaporanData.lampiran_foto[index].caption = val;
        }
    }
    renderPreviewFotoGrid();
};

window.generateAIContent = async () => {
    const judul = document.getElementById('input-judul_laporan')?.value?.trim();
    const periode = document.getElementById('input-periode')?.value?.trim();

    if (!judul || !periode) {
        showToast('Mohon isi Judul Laporan dan Periode terlebih dahulu', 'warning');
        document.getElementById('input-judul_laporan')?.focus();
        return;
    }

    const model = document.getElementById('input-ai_model')?.value || 'mistral-medium';
    const tema = document.getElementById('input-tema')?.value?.trim() || '';
    const tempat = document.getElementById('input-tempat')?.value?.trim() || '';
    const narasumber = document.getElementById('input-narasumber')?.value?.trim() || '';

    const btn = document.getElementById('btn-generate-ai');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin text-lg"></i><span>Menyusun Laporan Lengkap...</span>';
    btn.disabled = true;

    showLoading('AI sedang menyusun draf Laporan Kegiatan KKG (LPJ) lengkap...');

    try {
        const res = await api('/laporan/generate-content', {
            method: 'POST',
            body: {
                judul_laporan: judul,
                periode: periode,
                tema: tema,
                tempat: tempat,
                narasumber: narasumber,
                model: model
            },
            timeout: 90000
        });

        if (res.success && res.data) {
            const d = res.data;
            currentLaporanData = {
                ...currentLaporanData,
                judul_laporan: judul,
                periode: periode,
                tema: tema,
                tempat: tempat,
                narasumber: narasumber,
                pendahuluan_latar_belakang: d.pendahuluan_latar_belakang || '',
                pendahuluan_tujuan: d.pendahuluan_tujuan || '',
                pendahuluan_manfaat: d.pendahuluan_manfaat || '',
                pelaksanaan_waktu_tempat: d.pelaksanaan_waktu_tempat || '',
                pelaksanaan_materi: d.pelaksanaan_materi || '',
                pelaksanaan_peserta: d.pelaksanaan_peserta || '',
                hasil_uraian: d.hasil_uraian || '',
                hasil_tindak_lanjut: d.hasil_tindak_lanjut || '',
                hasil_dampak: d.hasil_dampak || '',
                penutup_simpulan: d.penutup_simpulan || '',
                penutup_saran: d.penutup_saran || ''
            };

            syncFormToPreview();
            document.getElementById('preview-indicator')?.classList.remove('hidden');
            showToast('Draf Laporan Kegiatan berhasil dibuat oleh AI!', 'success');
            
            // Otomatis arahkan ke Pratinjau Dokumen A4
            switchStudioTab('preview');
        } else {
            throw new Error(res.error?.message || 'Gagal menghasilkan konten draf');
        }
    } catch (e) {
        console.error('AI Generation Error:', e);
        showToast('Gagal generate AI: ' + (e.message || 'Koneksi timeout'), 'error');
    } finally {
        hideLoading();
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
};

window.toggleInlineEditing = () => {
    isInlineEditing = !isInlineEditing;
    const label = document.getElementById('toggle-edit-label');
    const btn = document.getElementById('btn-toggle-edit');

    const fields = [
        'pendahuluan_latar_belakang', 'pendahuluan_tujuan', 'pendahuluan_manfaat',
        'pelaksanaan_waktu_tempat', 'pelaksanaan_materi', 'pelaksanaan_peserta',
        'hasil_uraian', 'hasil_tindak_lanjut', 'hasil_dampak',
        'penutup_simpulan', 'penutup_saran'
    ];

    if (isInlineEditing) {
        if (label) label.textContent = 'Selesai Edit';
        btn?.classList.replace('bg-amber-50', 'bg-emerald-50');
        btn?.classList.replace('text-amber-700', 'text-emerald-700');

        fields.forEach(f => {
            const el = document.getElementById(`display-${f}`);
            if (el) {
                const text = currentLaporanData[f] || el.textContent;
                el.innerHTML = `
                    <textarea class="w-full p-2.5 text-xs sm:text-sm border border-amber-300 rounded-lg bg-amber-50/40 text-gray-900 focus:bg-white focus:ring-2 focus:ring-amber-500 font-serif leading-relaxed" rows="${f.includes('uraian') || f.includes('latar') || f.includes('materi') ? 8 : 4}" onchange="updateLaporanField('${f}', this.value)">${escapeHtml(text)}</textarea>
                `;
            }
        });
        showToast('Mode Edit Teks aktif. Anda dapat langsung mengedit narasi laporan.', 'info');
    } else {
        if (label) label.textContent = 'Mode Edit Teks';
        btn?.classList.replace('bg-emerald-50', 'bg-amber-50');
        btn?.classList.replace('text-emerald-700', 'text-amber-700');

        fields.forEach(f => {
            const el = document.getElementById(`display-${f}`);
            if (el) {
                el.textContent = currentLaporanData[f] || '-';
            }
        });
        showToast('Perubahan narasi berhasil diterapkan ke pratinjau', 'success');
    }
};

window.updateLaporanField = (field, value) => {
    currentLaporanData[field] = value;
};

window.saveLaporanAction = async (status = 'draft') => {
    const judul = currentLaporanData.judul_laporan || document.getElementById('input-judul_laporan')?.value?.trim();
    if (!judul) {
        showToast('Judul laporan wajib diisi sebelum menyimpan', 'warning');
        switchStudioTab('form');
        document.getElementById('input-judul_laporan')?.focus();
        return;
    }

    currentLaporanData.status = status;
    currentLaporanData.periode = currentLaporanData.periode || document.getElementById('input-periode')?.value?.trim();
    currentLaporanData.tema = currentLaporanData.tema || document.getElementById('input-tema')?.value?.trim();
    currentLaporanData.tempat = currentLaporanData.tempat || document.getElementById('input-tempat')?.value?.trim();
    currentLaporanData.narasumber = currentLaporanData.narasumber || document.getElementById('input-narasumber')?.value?.trim();

    // Prepare payload (convert photos to strings array if necessary)
    const photoUrls = (currentLaporanData.lampiran_foto || []).map(f => typeof f === 'string' ? f : f.url);

    const payload = {
        ...currentLaporanData,
        lampiran_foto: photoUrls,
        status: status
    };

    showLoading(status === 'final' ? 'Mengesahkan dan menyimpan laporan...' : 'Menyimpan draf laporan...');

    try {
        const url = activeLaporanId ? `/laporan/${activeLaporanId}` : '/laporan';
        const method = activeLaporanId ? 'PUT' : 'POST';

        const res = await api(url, { method, body: payload });
        if (res.success) {
            if (!activeLaporanId && res.data?.id) {
                activeLaporanId = res.data.id;
            }

            showToast(status === 'final' ? 'Laporan berhasil disimpan & disahkan!' : 'Draf laporan berhasil disimpan!', 'success');

            // Refresh list
            const listRes = await api('/laporan');
            if (listRes.success) {
                laporanList = listRes.data || [];
                const drawerContainer = document.getElementById('drawer-laporan-list');
                if (drawerContainer) drawerContainer.innerHTML = renderDrawerItems();
                const badge = document.getElementById('laporan-count-badge');
                if (badge) badge.textContent = laporanList.length;
            }
        } else {
            throw new Error(res.error?.message || 'Gagal menyimpan laporan');
        }
    } catch (e) {
        console.error('Save Error:', e);
        showToast('Gagal menyimpan: ' + e.message, 'error');
    } finally {
        hideLoading();
    }
};

window.loadLaporanToStudio = async (id) => {
    showLoading('Memuat laporan...');
    try {
        const res = await api(`/laporan/${id}`);
        if (res.success && res.data) {
            const d = res.data;
            activeLaporanId = d.id;
            currentLaporanData = {
                judul_laporan: d.judul_laporan || '',
                periode: d.periode || '',
                tema: d.tema || '',
                tempat: d.tempat || '',
                narasumber: d.narasumber || '',
                pendahuluan_latar_belakang: d.pendahuluan_latar_belakang || '',
                pendahuluan_tujuan: d.pendahuluan_tujuan || '',
                pendahuluan_manfaat: d.pendahuluan_manfaat || '',
                pelaksanaan_waktu_tempat: d.pelaksanaan_waktu_tempat || '',
                pelaksanaan_materi: d.pelaksanaan_materi || '',
                pelaksanaan_peserta: d.pelaksanaan_peserta || '',
                hasil_uraian: d.hasil_uraian || '',
                hasil_tindak_lanjut: d.hasil_tindak_lanjut || '',
                hasil_dampak: d.hasil_dampak || '',
                penutup_simpulan: d.penutup_simpulan || '',
                penutup_saran: d.penutup_saran || '',
                lampiran_foto: Array.isArray(d.lampiran_foto) ? d.lampiran_foto : [],
                status: d.status || 'draft'
            };

            // Set Form Values
            const setVal = (inputValId, val) => {
                const el = document.getElementById(inputValId);
                if (el) el.value = val || '';
            };

            setVal('input-judul_laporan', currentLaporanData.judul_laporan);
            setVal('input-periode', currentLaporanData.periode);
            setVal('input-tema', currentLaporanData.tema);
            setVal('input-tempat', currentLaporanData.tempat);
            setVal('input-narasumber', currentLaporanData.narasumber);

            renderFotoGallery();
            syncFormToPreview();
            closeHistoryDrawer();
            switchStudioTab('preview');

            showToast(`Laporan "${currentLaporanData.judul_laporan}" dimuat`, 'success');
        }
    } catch (e) {
        console.error('Load Error:', e);
        showToast('Gagal memuat detail laporan: ' + e.message, 'error');
    } finally {
        hideLoading();
    }
};

window.downloadCurrentDocx = async () => {
    if (!activeLaporanId) {
        // Jika belum tersimpan, simpan otomatis dulu
        await saveLaporanAction('draft');
    }

    if (activeLaporanId) {
        window.downloadLaporanDocx(activeLaporanId);
    } else {
        showToast('Simpan laporan terlebih dahulu sebelum mengunduh DOCX', 'warning');
    }
};

window.downloadLaporanDocx = (id) => {
    window.location.href = `/api/laporan/${id}/docx`;
};

window.deleteLaporanById = async (id) => {
    if (!window.confirm('Hapus laporan ini secara permanen?')) return;

    showLoading('Menghapus laporan...');
    try {
        const res = await api(`/laporan/${id}`, { method: 'DELETE' });
        if (res.success) {
            showToast('Laporan berhasil dihapus', 'success');
            laporanList = laporanList.filter(item => item.id !== id);
            
            const drawerContainer = document.getElementById('drawer-laporan-list');
            if (drawerContainer) drawerContainer.innerHTML = renderDrawerItems();
            const badge = document.getElementById('laporan-count-badge');
            if (badge) badge.textContent = laporanList.length;

            if (activeLaporanId === id) {
                resetLaporanForm();
            }
        }
    } catch (e) {
        showToast('Gagal menghapus laporan: ' + e.message, 'error');
    } finally {
        hideLoading();
    }
};

window.printLaporan = () => {
    // Pastikan berada di tab preview
    switchStudioTab('preview');
    setTimeout(() => {
        window.print();
    }, 200);
};
