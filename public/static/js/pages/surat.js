
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, escapeHtml, showToast, populateAiModelSelect } from '../utils.js';
import { navigate } from '../router.js';
import { renderAdminLayout } from '../layouts/admin.js';

// DOCX functions will be defined inline below

// Store current surat metadata for export
let currentSuratData = null;

export function renderSurat() {
  const content = `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">
          <i class="fas fa-file-signature text-blue-500 mr-3"></i>Generator Surat
        </h1>
        <p class="text-[var(--color-text-secondary)] mt-2">Buat surat undangan KKG secara otomatis dengan AI atau Template.</p>
      </div>
      ${state.user ? `
        <button onclick="loadSuratHistory()" class="btn bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] shadow-sm">
          <i class="fas fa-history mr-2"></i>Riwayat Surat
        </button>` : ''}
    </div>

    ${!state.user ? `
      <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 mb-6 flex items-start gap-4">
        <i class="fas fa-lock text-yellow-600 dark:text-yellow-400 mt-1"></i>
        <p class="text-yellow-800 dark:text-yellow-200">Silakan <a href="javascript:void(0)" onclick="navigate('login')" class="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-100">login</a> untuk membuat surat undangan.</p>
      </div>
    ` : ''}

    <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-xl p-6 md:p-8 border border-[var(--color-border-subtle)]">
      <!-- Document Type Switcher -->
      <div class="mb-8 p-1.5 bg-[var(--color-bg-tertiary)] rounded-2xl flex flex-wrap gap-2 border border-[var(--color-border-subtle)]">
        <button type="button" onclick="switchDocType('undangan')" id="doc-type-undangan" class="flex-1 min-w-[200px] py-3 px-5 rounded-xl font-bold text-sm transition-all shadow-sm bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] flex items-center justify-center gap-2">
          <i class="fas fa-envelope-open-text text-blue-500"></i> Surat Undangan KKG
        </button>
        <button type="button" onclick="switchDocType('sppd')" id="doc-type-sppd" class="flex-1 min-w-[200px] py-3 px-5 rounded-xl font-semibold text-sm transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center justify-center gap-2">
          <i class="fas fa-file-contract text-emerald-500"></i> Paket Surat Tugas & SPPD (+ LHP)
          <span class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">4-in-1</span>
        </button>
      </div>

      <!-- UNDANGAN CONTAINER -->
      <div id="undangan-container">
        <!-- Mode Tabs -->
        <div class="flex p-1 mb-8 bg-[var(--color-bg-tertiary)] rounded-xl w-fit">
          <button type="button" onclick="switchSuratMode('ai')" id="mode-ai" class="px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
            <i class="fas fa-magic mr-2 text-blue-500"></i>AI Generator
          </button>
          <button type="button" onclick="switchSuratMode('template')" id="mode-template" class="px-6 py-2.5 rounded-lg text-sm font-medium transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <i class="fas fa-file-alt mr-2"></i>Template
          </button>
        </div>

        <!-- Template Selector (hidden by default) -->
        <div id="template-selector" class="hidden mb-8 animate-fade-in">
          <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Pilih Template Surat</label>
          <div class="relative">
            <select id="template_id" onchange="loadTemplateForSurat()" class="w-full pl-4 pr-10 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] appearance-none transition shadow-sm">
              <option value="">-- Pilih Template --</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
              <i class="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
          <p id="template-desc" class="text-xs text-[var(--color-text-tertiary)] mt-2 italic"></p>
        </div>

        <!-- Template Variables Form (dynamic) -->
        <div id="template-variables-form" class="hidden mb-8 animate-fade-in">
          <h3 class="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
             <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs"><i class="fas fa-pen"></i></span>
             Isi Data Surat
          </h3>
          <div id="template-variables-fields" class="grid md:grid-cols-2 gap-6"></div>
        </div>

        <!-- AI Form -->
        <form id="surat-form" onsubmit="generateSurat(event)" class="animate-fade-in">
          <div id="ai-form-fields" class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Jenis Kegiatan <span class="text-red-500">*</span></label>
              <div class="relative">
                <select id="jenis_kegiatan" name="jenis_kegiatan" required class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] appearance-none transition">
                  <option value="">-- Pilih Jenis Kegiatan / Surat --</option>
                  <option value="Surat Tugas Kegiatan">📋 Surat Tugas Kegiatan</option>
                  <option value="Surat Tugas / Penugasan Guru">📋 Surat Tugas / Penugasan Guru</option>
                  <option value="Pelatihan">Pelatihan</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Bimtek / Diklat">Bimtek / Diklat</option>
                  <option value="Rapat Rutin KKG">Rapat Rutin KKG</option>
                  <option value="Rapat Koordinasi">Rapat Koordinasi</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Kegiatan Bersama">Kegiatan Bersama</option>
                  <option value="Sosialisasi">Sosialisasi</option>
                  <option value="Kunjungan Kerja">Kunjungan Kerja</option>
                  <option value="Lomba/Kompetisi">Lomba/Kompetisi</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
                  <i class="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Tempat Kegiatan <span class="text-red-500">*</span></label>
              <div class="relative">
                <select id="tempat_kegiatan" name="tempat_kegiatan" required class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] appearance-none transition">
                  ${(state.sekolahList && state.sekolahList.length > 0)
                    ? state.sekolahList.map((s, idx) => `<option value="${escapeHtml(s.nama)}" ${idx === 0 ? 'selected' : ''}>${escapeHtml(s.nama)}</option>`).join('')
                    : `
                      <option value="Sekretariat KKG" selected>Sekretariat KKG</option>
                      <option value="Gedung Pertemuan">Gedung Pertemuan</option>
                    `
                  }
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
                  <i class="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Tanggal Kegiatan <span class="text-red-500">*</span></label>
              <input type="date" id="tanggal_kegiatan" name="tanggal_kegiatan" required
                class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition">
            </div>
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Waktu Kegiatan <span class="text-red-500">*</span></label>
              <input type="text" id="waktu_kegiatan" name="waktu_kegiatan" required placeholder="Contoh: 09.00 - 12.00 WIB"
                class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition">
            </div>
          </div>

          <div class="mt-6">
            <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Agenda/Acara <span class="text-red-500">*</span></label>
            <textarea id="agenda" name="agenda" required rows="3" placeholder="Tuliskan agenda kegiatan, pisahkan dengan enter untuk setiap poin..."
              class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition resize-none"></textarea>
            <p class="text-xs text-[var(--color-text-tertiary)] mt-1">Tips: Pisahkan setiap agenda dengan baris baru untuk bullet points otomatis.</p>
          </div>

          <div class="mt-6">
            <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Peserta yang Diundang</label>
            <textarea id="peserta" name="peserta" rows="2" placeholder="Contoh: Seluruh anggota ${escapeHtml(state.settings?.nama_kkg || 'KKG')}, Kepala Sekolah mitra..."
              class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition resize-none"></textarea>
          </div>

          <div class="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Penanggung Jawab</label>
              <input type="text" id="penanggung_jawab" name="penanggung_jawab" placeholder="Nama Ketua KKG" value="${state.user ? escapeHtml(state.user.nama) : ''}"
                class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition">
            </div>
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">AI Model</label>
              <div class="relative">
                <select id="model" name="model" class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] appearance-none transition">
                  <option value="bedrock">🚀 AWS Bedrock (Claude Sonnet 4.6)</option>
                  <option value="vertex">⚡ Gemini 3 Flash Preview via Vertex AI (Berbayar - Terbaru)</option>
                  <option value="gemini">✨ Gemini 2.0 Flash (Gratis)</option>
                  <option value="mistral">Mistral Large (Formal)</option>
                  <option value="z_ai">GLM-4.7-Flash</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
                  <i class="fas fa-robot text-xs"></i>
                </div>
              </div>
              <p class="text-[10px] text-[var(--color-text-tertiary)] mt-2 italic"><i class="fas fa-info-circle mr-1"></i>AWS Bedrock (Claude) memberikan kualitas terbaik. Gemini 2.0 gratis namun sedikit lebih lambat.</p>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Lampiran</label>
              <input type="text" id="lampiran" name="lampiran" placeholder="Contoh: 1 (satu) berkas, - (jika tidak ada)"
                class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition">
              <div class="flex items-center gap-2 mt-3 p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <input type="checkbox" id="include_struktur" name="include_struktur" class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300">
                <label for="include_struktur" class="text-sm text-[var(--color-text-primary)] cursor-pointer user-select-none font-medium">Sertakan Lampiran Struktur Organisasi</label>
              </div>
            </div>
          </div>

          <button type="submit" id="generate-btn" ${!state.user ? 'disabled' : ''}
            class="mt-8 w-full py-4 px-6 bg-[#111111] text-white rounded-full font-medium shadow-[var(--shadow-elevated)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-lg group">
            <i class="fas fa-magic mr-2 group-hover:scale-110 transition-transform"></i>Generate Surat dengan AI
          </button>
        </form>

        <!-- Template Generate Button (hidden by default) -->
        <button type="button" id="generate-from-template-btn" onclick="generateFromTemplateNew()" ${!state.user ? 'disabled' : ''}
          class="hidden mt-8 w-full py-4 px-6 bg-[#111111] text-white rounded-full font-medium shadow-[var(--shadow-elevated)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-lg group">
          <i class="fas fa-file-signature mr-2 group-hover:scale-110 transition-transform"></i>Buat Surat dari Template
        </button>
      </div>

      <!-- SPPD CONTAINER (Paket Surat Tugas, SPPD, Visum & LHP) -->
      <div id="sppd-container" class="hidden">
        <form id="sppd-form" onsubmit="generateSppd(event)" class="animate-fade-in space-y-6">
          <!-- Card 1: Sekolah Asal (Pemberi Tugas) -->
          <div class="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] shadow-sm">
            <h3 class="text-base font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-black">1</span>
              Sekolah Asal Guru (Instansi Pemberi Tugas & KOP Surat)
            </h3>
            <div class="grid md:grid-cols-3 gap-5">
              <div class="md:col-span-3">
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Pilih Sekolah Asal Akun <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select id="sppd_sekolah_asal_select" onchange="onSekolahAsalChange(this.value)" required class="w-full pl-4 pr-10 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-emerald-500 text-[var(--color-text-primary)] appearance-none font-semibold">
                    <option value="">-- Pilih Sekolah Asal Guru --</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
                    <i class="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
                <input type="hidden" id="sppd_kop_surat_url" value="">
                <div id="sppd_kop_status_container" class="mt-2"></div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Nama Kepala Sekolah Asal <span class="text-red-500">*</span></label>
                <input type="text" id="sppd_kepala_sekolah_asal" required placeholder="Nama Lengkap & Gelar KS" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-emerald-500 text-[var(--color-text-primary)]">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">NIP Kepala Sekolah Asal</label>
                <input type="text" id="sppd_nip_kepala_sekolah_asal" placeholder="NIP Kepala Sekolah (atau -)" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-emerald-500 text-[var(--color-text-primary)] font-mono text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Alamat Sekolah Asal</label>
                <input type="text" id="sppd_alamat_sekolah_asal" placeholder="Alamat / Desa" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-emerald-500 text-[var(--color-text-primary)] text-sm">
              </div>
            </div>
          </div>

          <!-- Card 2: Guru yang Ditugaskan -->
          <div class="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-black">2</span>
                Daftar Guru yang Ditugaskan
              </h3>
              <button type="button" onclick="addSppdGuruRow()" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition flex items-center gap-1.5">
                <i class="fas fa-plus"></i> Tambah Guru
              </button>
            </div>
            <div id="sppd-guru-list" class="space-y-3">
              <!-- Dynamic Rows inserted by initDefaultSppdGuru() -->
            </div>
            <p class="text-xs text-[var(--color-text-tertiary)] mt-3 italic">* Guru urutan pertama akan menjadi Pegawai Utama yang diperintahkan pada SPD dan Pelapor pada LHP. Guru selanjutnya otomatis dicatat sebagai Pengikut.</p>
          </div>

          <!-- Card 3: Waktu, Lokasi & Acara Kegiatan KKG -->
          <div class="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] shadow-sm">
            <h3 class="text-base font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-black">3</span>
              Waktu, Lokasi & Maksud Penugasan
            </h3>
            <div class="grid md:grid-cols-3 gap-5">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Tanggal Kegiatan <span class="text-red-500">*</span></label>
                <input type="date" id="sppd_tanggal_kegiatan" onchange="onSppdDateChange(this.value)" required class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)]">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Waktu Kegiatan <span class="text-red-500">*</span></label>
                <input type="text" id="sppd_waktu_kegiatan" value="08.00 s.d Selesai" required class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)]">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Lokasi / Tempat Tujuan <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input type="text" id="sppd_tempat_kegiatan" list="sppd_daftar_lokasi_tujuan" oninput="onTempatTujuanInput(this.value)" required placeholder="Ketik lokasi tujuan atau pilih rekomendasi..." class="w-full pl-4 pr-10 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)] font-semibold text-sm">
                  <datalist id="sppd_daftar_lokasi_tujuan"></datalist>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-tertiary)]">
                    <i class="fas fa-map-marker-alt text-xs"></i>
                  </div>
                </div>
                <p class="text-[11px] text-[var(--color-text-tertiary)] mt-1.5 flex items-center gap-1">
                  <i class="fas fa-info-circle text-purple-500"></i>
                  <span>Fleksibel: Bebas ketik sekolah lain, Gedung PGRI, Aula Dinas, hotel, dll.</span>
                </p>
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Maksud Penugasan / Agenda Kegiatan <span class="text-red-500">*</span></label>
                <textarea id="sppd_agenda" required rows="2" placeholder="Contoh: Mengikuti Pertemuan Rutin KKG Pembahasan Analisis Capaian Pembelajaran dan Modul Ajar" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)] resize-none"></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Dasar Surat Tugas</label>
                <input type="text" id="sppd_dasar_surat" value="Surat Undangan Pengurus Kelompok Kerja Guru (KKG)" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)] text-sm">
              </div>
              <div class="md:col-span-3 grid md:grid-cols-2 gap-4 pt-3 border-t border-[var(--color-border-subtle)]">
                <div>
                  <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Pejabat / KS / Panitia di Tempat Tujuan (Untuk Lembar Visum):</label>
                  <input type="text" id="sppd_kepala_sekolah_tujuan" placeholder="Contoh: Nama KS / Panitia (kosongkan jika ttd basah)" class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)] text-sm">
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">NIP / Jabatan di Tempat Tujuan (Untuk Lembar Visum):</label>
                  <input type="text" id="sppd_nip_kepala_sekolah_tujuan" placeholder="NIP (atau - / Jabatan di lokasi)" class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-purple-500 text-[var(--color-text-primary)] text-sm font-mono">
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: Ketentuan SPPD & Pembebanan Anggaran -->
          <div class="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] shadow-sm">
            <h3 class="text-base font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-black">4</span>
              Ketentuan Perjalanan Dinas & Pembebanan Anggaran BOS
            </h3>
            <div class="grid md:grid-cols-3 gap-5">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Alat Angkut yang Digunakan</label>
                <select id="sppd_alat_angkut" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-amber-500 text-[var(--color-text-primary)]">
                  <option value="Kendaraan Pribadi / Sepeda Motor" selected>Kendaraan Pribadi / Sepeda Motor</option>
                  <option value="Kendaraan Pribadi / Mobil">Kendaraan Pribadi / Mobil</option>
                  <option value="Angkutan Umum / Darat">Angkutan Umum / Darat</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Tingkat Biaya Perjalanan Dinas</label>
                <input type="text" id="sppd_tingkat_biaya" value="Tingkat C / Biaya Transport Lokal" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-amber-500 text-[var(--color-text-primary)] text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Uang Transport / Biaya</label>
                <input type="text" id="sppd_biaya_transport" value="Rp 20.000" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-amber-500 text-[var(--color-text-primary)] text-sm font-semibold">
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Pembebanan Akun / Mata Anggaran</label>
                <input type="text" id="sppd_mata_anggaran" value="Dana BOS Tahap II Tahun Anggaran 2026" class="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-amber-500 text-[var(--color-text-primary)] text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Tanggal Laporan (LHP) <span class="text-emerald-600 dark:text-emerald-400 font-bold">(Wajib H+1)</span></label>
                <input type="date" id="sppd_tanggal_lhp" readonly class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] font-bold cursor-not-allowed">
                <p class="text-[11px] text-amber-600 dark:text-amber-400 mt-1 italic"><i class="fas fa-info-circle mr-1"></i>Sesuai berkas acuan (Hal 5 PDF), LHP wajib dilaporkan H+1 setelah kegiatan.</p>
              </div>
            </div>
          </div>

          <!-- AI Model Selection & Generate Button -->
          <div class="flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border border-emerald-500/20">
            <div>
              <div class="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <i class="fas fa-sparkles text-amber-500"></i> AI Generator Resume Hasil Pekerjaan (LHP)
              </div>
              <p class="text-xs text-[var(--color-text-secondary)] mt-1">AI otomatis menyusun butir-butir resume hasil pelaksanaan tugas KKG secara substansial & formal.</p>
            </div>
            <div class="flex items-center gap-3 w-full md:w-auto">
              <select id="sppd_model" class="px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-sm font-semibold text-[var(--color-text-primary)]">
                <option value="vertex">⚡ Gemini 3 Flash via Vertex</option>
                <option value="bedrock">🚀 AWS Bedrock (Claude)</option>
                <option value="gemini">✨ Gemini 2.0 Flash</option>
                <option value="mistral">Mistral Large</option>
              </select>
              <button type="submit" id="sppd-generate-btn" class="flex-1 md:flex-initial py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <i class="fas fa-magic"></i> Buat Paket 4 Dokumen
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- PREVIEW RESULT CONTAINER -->
    <div id="surat-result" class="hidden mt-10 animate-slide-up">
      <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-xl p-6 md:p-8 border border-[var(--color-border-subtle)]">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <i class="fas fa-eye text-emerald-500"></i>Preview Dokumen
          </h2>
          <div class="flex flex-wrap gap-2 items-center">
            <button id="edit-surat-btn" onclick="editSuratContent()" class="btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20 border-none">
              <i class="fas fa-edit mr-1"></i>Edit Teks
            </button>
            <button onclick="downloadSuratDocx()" class="px-4 py-2 bg-[#111111] hover:bg-gray-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
              <i class="fas fa-file-word text-blue-400"></i> Unduh DOCX
            </button>
            <button onclick="downloadSuratPDF()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
              <i class="fas fa-print"></i> Cetak / Print PDF
            </button>
          </div>
        </div>

        <!-- SPPD 4 Tabs Navigation (only active for SPPD) -->
        <div id="sppd-preview-tabs-container" class="hidden mb-6">
          <div class="flex p-1.5 bg-[var(--color-bg-tertiary)] rounded-xl w-fit flex-wrap gap-1 border border-[var(--color-border-subtle)]">
            <button type="button" onclick="switchSppdPreviewTab(1)" id="sppd-tab-1" class="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
              <i class="fas fa-file-signature mr-1.5 text-blue-500"></i>1. Surat Tugas (SPT)
            </button>
            <button type="button" onclick="switchSppdPreviewTab(2)" id="sppd-tab-2" class="px-4 py-2 rounded-lg text-xs font-medium transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              <i class="fas fa-table mr-1.5 text-emerald-500"></i>2. SPPD Lembar 1
            </button>
            <button type="button" onclick="switchSppdPreviewTab(3)" id="sppd-tab-3" class="px-4 py-2 rounded-lg text-xs font-medium transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              <i class="fas fa-stamp mr-1.5 text-purple-500"></i>3. Lembar Visum
            </button>
            <button type="button" onclick="switchSppdPreviewTab(4)" id="sppd-tab-4" class="px-4 py-2 rounded-lg text-xs font-medium transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              <i class="fas fa-clipboard-check mr-1.5 text-amber-500"></i>4. Laporan Hasil (LHP)
            </button>
          </div>
        </div>
        
        <!-- Standard Undangan Preview -->
        <div id="surat-content" class="surat-preview bg-white text-black border border-gray-200 shadow-inner rounded-xl p-8 md:p-10 text-sm font-serif whitespace-pre-wrap leading-relaxed min-h-[500px]" style="font-family: 'Times New Roman', serif;"></div>

        <!-- SPPD HTML Rendered Preview -->
        <div id="sppd-rendered-preview" class="hidden bg-white text-black border border-gray-200 shadow-inner rounded-xl p-8 md:p-12 text-sm font-serif leading-relaxed min-h-[600px]" style="font-family: 'Times New Roman', serif;"></div>
        
        <!-- Edit mode (Undangan) -->
        <div id="surat-edit-mode" class="hidden">
          <textarea id="surat-edit-textarea" rows="25" class="w-full px-6 py-4 border border-[var(--color-border-default)] bg-white text-black rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition font-serif leading-relaxed shadow-inner" style="font-family: 'Times New Roman', serif;"></textarea>
          <div class="flex gap-2 mt-4 items-center">
            <button onclick="saveSuratEdit()" class="btn btn-sm btn-success">
              <i class="fas fa-save mr-1"></i>Simpan
            </button>
            <button onclick="cancelSuratEdit()" class="btn btn-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]">
              <i class="fas fa-times mr-1"></i>Batal
            </button>
            <button onclick="insertStructureAttachment()" class="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200 ml-auto border-none">
              <i class="fas fa-sitemap mr-1"></i>+ Struktur
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="surat-history" class="hidden mt-10"></div>
  </div>`;

  setTimeout(async () => {
    populateAiModelSelect('#model');
    populateAiModelSelect('#sppd_model');
    await ensureSekolahLoaded();
    populateSppdSchoolSelects();
    initDefaultSppdGuru();
  }, 0);

  return renderAdminLayout(content, 'surat');
}

// ============================================
// SPPD Date & Text Helpers
// ============================================
function formatIndoDateStr(dateStr) {
  if (!dateStr) return '';
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && m >= 0 && m < 12) {
      return `${d} ${bulan[m]} ${y}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function formatHariIndoStr(dateStr) {
  if (!dateStr) return '';
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      return `${hari[dateObj.getDay()]}, ${d} ${bulan[m]} ${y}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// ============================================
// Document Type Switcher (Undangan vs SPPD)
// ============================================
window.switchDocType = function (type) {
  const btnUndangan = document.getElementById('doc-type-undangan');
  const btnSppd = document.getElementById('doc-type-sppd');
  const cUndangan = document.getElementById('undangan-container');
  const cSppd = document.getElementById('sppd-container');

  if (type === 'sppd') {
    btnSppd?.classList.add('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    btnSppd?.classList.remove('text-[var(--color-text-secondary)]');

    btnUndangan?.classList.remove('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    btnUndangan?.classList.add('text-[var(--color-text-secondary)]');

    cUndangan?.classList.add('hidden');
    cSppd?.classList.remove('hidden');

    window.populateSppdSchoolSelects();
    window.initDefaultSppdGuru();
  } else {
    btnUndangan?.classList.add('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    btnUndangan?.classList.remove('text-[var(--color-text-secondary)]');

    btnSppd?.classList.remove('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    btnSppd?.classList.add('text-[var(--color-text-secondary)]');

    cSppd?.classList.add('hidden');
    cUndangan?.classList.remove('hidden');
  }
};

window.ensureSekolahLoaded = async function () {
  if (!state.sekolahList || state.sekolahList.length === 0) {
    try {
      const res = await api('/sekolah');
      if (res.data) {
        state.sekolahList = res.data;
      }
    } catch (e) {
      console.error('Failed to load sekolah list:', e);
    }
  }
};

window.populateSppdSchoolSelects = function () {
  const asalSelect = document.getElementById('sppd_sekolah_asal_select');
  const tujuanDatalist = document.getElementById('sppd_daftar_lokasi_tujuan');
  if (!asalSelect) return;

  const schools = state.sekolahList || [];
  const userSchool = state.user?.sekolah_nama || state.user?.sekolah || '';
  const currentAsal = asalSelect.value || userSchool;

  asalSelect.innerHTML = '<option value="">-- Pilih Sekolah Asal Guru --</option>' +
    schools.map(s => `<option value="${escapeHtml(s.nama)}" ${currentAsal === s.nama ? 'selected' : ''}>${escapeHtml(s.nama)}</option>`).join('');

  // Populate datalist with schools and common educational/official venues
  if (tujuanDatalist) {
    const commonVenues = [
      `Gedung Guru PGRI Cabang ${state.settings?.kecamatan || 'Wanayasa'}`,
      `Kantor Dinas Pendidikan Kabupaten ${state.settings?.kabupaten || 'Purwakarta'}`,
      `Aula Bale Guru Linuhung ${state.settings?.kabupaten || 'Purwakarta'}`,
      `Kantor Korwil Bidik Kecamatan ${state.settings?.kecamatan || 'Wanayasa'}`,
      'Bale Pasanggrahan Padjadjaran',
      'Hotel Harper Purwakarta',
      'Hotel Prime Plaza Purwakarta'
    ];

    const schoolOptions = schools.map(s => `<option value="${escapeHtml(s.nama)}">${escapeHtml(s.nama)} (Sekolah Anggota)</option>`).join('');
    const venueOptions = commonVenues.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)} (Gedung/Instansi)</option>`).join('');
    tujuanDatalist.innerHTML = schoolOptions + venueOptions;
  }

  // Trigger change handler if origin school is already selected
  if (asalSelect.value) {
    window.onSekolahAsalChange(asalSelect.value);
  }
};

window.onSekolahAsalChange = function (namaSekolah) {
  if (!namaSekolah) return;
  const s = (state.sekolahList || []).find(x => x.nama === namaSekolah);
  const ksInput = document.getElementById('sppd_kepala_sekolah_asal');
  const nipInput = document.getElementById('sppd_nip_kepala_sekolah_asal');
  const alamatInput = document.getElementById('sppd_alamat_sekolah_asal');
  const kopInput = document.getElementById('sppd_kop_surat_url');
  const kopStatus = document.getElementById('sppd_kop_status_container');

  if (s) {
    if (ksInput) ksInput.value = s.kepala_sekolah || '';
    if (nipInput) nipInput.value = s.nip_kepala_sekolah || '-';
    if (alamatInput) alamatInput.value = s.alamat || `Kecamatan ${state.settings?.kecamatan || 'Wanayasa'}, Kabupaten ${state.settings?.kabupaten || 'Purwakarta'}`;

    const kopUrl = s.kop_surat_url || (state.user?.sekolah === namaSekolah ? state.user?.kop_surat_url : '') || '';
    if (kopInput) kopInput.value = kopUrl;

    if (kopStatus) {
      if (kopUrl) {
        kopStatus.innerHTML = `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <i class="fas fa-check-circle text-emerald-600 text-sm"></i>
              <span class="font-medium">KOP Surat Resmi Sekolah Terhubung</span>
            </div>
            <a href="${escapeHtml(kopUrl)}" target="_blank" class="text-[11px] text-emerald-700 dark:text-emerald-400 underline font-semibold hover:text-emerald-900 flex items-center gap-1">
              <i class="fas fa-image"></i> Pratinjau KOP
            </a>
          </div>
        `;
      } else {
        kopStatus.innerHTML = `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)]">
            <div class="flex items-center gap-2">
              <i class="fas fa-info-circle text-blue-500"></i>
              <span>KOP surat menggunakan format standar kedinasan otomatis.</span>
            </div>
            <a href="/admin#tab-sekolah" class="text-[11px] text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700">
              Atur KOP Gambar
            </a>
          </div>
        `;
      }
    }
  }
};

window.onTempatTujuanInput = function (namaLokasi) {
  if (!namaLokasi) return;
  const s = (state.sekolahList || []).find(x => x.nama === namaLokasi);
  const ksTujuan = document.getElementById('sppd_kepala_sekolah_tujuan');
  const nipTujuan = document.getElementById('sppd_nip_kepala_sekolah_tujuan');
  if (s) {
    if (ksTujuan) ksTujuan.value = s.kepala_sekolah || '';
    if (nipTujuan) nipTujuan.value = s.nip_kepala_sekolah || '-';
  }
};

window.onSppdDateChange = function (val) {
  if (!val) return;
  const parts = val.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const nextDate = new Date(y, m, d + 1);
    const ry = nextDate.getFullYear();
    const rm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const rd = String(nextDate.getDate()).padStart(2, '0');
    const lhpInput = document.getElementById('sppd_tanggal_lhp');
    if (lhpInput) lhpInput.value = `${ry}-${rm}-${rd}`;
  }
};

window.initDefaultSppdGuru = function () {
  const container = document.getElementById('sppd-guru-list');
  if (!container || container.children.length > 0) return;

  const defaultNama = state.user?.nama || 'Guru Kelas VI';
  const defaultNip = state.user?.nip || '-';
  window.addSppdGuruRow({
    nama: defaultNama,
    nip: defaultNip,
    pangkat_golongan: 'Penata Muda / IX',
    jabatan: 'Guru Kelas'
  });
};

window.addSppdGuruRow = function (data = {}) {
  const container = document.getElementById('sppd-guru-list');
  if (!container) return;
  const index = container.children.length;
  const row = document.createElement('div');
  row.className = 'grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] items-center animate-fade-in sppd-guru-row shadow-sm';
  row.innerHTML = `
    <div class="md:col-span-1 text-center font-bold text-xs text-[var(--color-text-tertiary)] guru-row-num">${index + 1}</div>
    <div class="md:col-span-3">
      <label class="block md:hidden text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase mb-1">Nama Guru</label>
      <input type="text" name="guru_nama" placeholder="Nama Guru & Gelar *" required value="${escapeHtml(data.nama || '')}" class="w-full px-3 py-2 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 text-[var(--color-text-primary)] font-medium">
    </div>
    <div class="md:col-span-3">
      <label class="block md:hidden text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase mb-1">NIP</label>
      <input type="text" name="guru_nip" placeholder="NIP (atau -)" value="${escapeHtml(data.nip || '-')}" class="w-full px-3 py-2 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 text-[var(--color-text-primary)] font-mono">
    </div>
    <div class="md:col-span-2">
      <label class="block md:hidden text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase mb-1">Pangkat/Gol</label>
      <input type="text" name="guru_pangkat" placeholder="Pangkat / Gol" value="${escapeHtml(data.pangkat_golongan || 'Penata Muda / IX')}" class="w-full px-3 py-2 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 text-[var(--color-text-primary)]">
    </div>
    <div class="md:col-span-2">
      <label class="block md:hidden text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase mb-1">Jabatan</label>
      <input type="text" name="guru_jabatan" placeholder="Jabatan" value="${escapeHtml(data.jabatan || 'Guru Kelas')}" class="w-full px-3 py-2 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 text-[var(--color-text-primary)]">
    </div>
    <div class="md:col-span-1 text-right">
      <button type="button" onclick="removeSppdGuruRow(this)" class="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-xs transition" title="Hapus Guru">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `;
  container.appendChild(row);
  window.updateGuruRowNumbers();
};

window.removeSppdGuruRow = function (btn) {
  const container = document.getElementById('sppd-guru-list');
  if (!container) return;
  if (container.children.length <= 1) {
    showToast('Minimal harus ada satu guru yang ditugaskan', 'warning');
    return;
  }
  const row = btn.closest('.sppd-guru-row');
  if (row) {
    row.remove();
    window.updateGuruRowNumbers();
  }
};

window.updateGuruRowNumbers = function () {
  const rows = document.querySelectorAll('.sppd-guru-row');
  rows.forEach((r, idx) => {
    const numEl = r.querySelector('.guru-row-num');
    if (numEl) numEl.textContent = idx + 1;
  });
};

// ============================================
// Generate SPPD Action
// ============================================
window.generateSppd = async function (e) {
  e.preventDefault();
  if (!state.user) { showToast('Silakan login terlebih dahulu', 'error'); return; }

  const btn = document.getElementById('sppd-generate-btn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Menyusun 4 Dokumen & AI LHP...';
  btn.disabled = true;

  try {
    const rows = document.querySelectorAll('.sppd-guru-row');
    const daftar_guru = [];
    rows.forEach(r => {
      const nama = r.querySelector('[name="guru_nama"]')?.value?.trim();
      const nip = r.querySelector('[name="guru_nip"]')?.value?.trim() || '-';
      const pangkat_golongan = r.querySelector('[name="guru_pangkat"]')?.value?.trim() || '-';
      const jabatan = r.querySelector('[name="guru_jabatan"]')?.value?.trim() || 'Guru Kelas';
      if (nama) {
        daftar_guru.push({ nama, nip, pangkat_golongan, jabatan });
      }
    });

    if (daftar_guru.length === 0) {
      throw new Error('Minimal harus mengisi 1 orang guru yang ditugaskan');
    }

    const tglKegiatan = document.getElementById('sppd_tanggal_kegiatan').value;
    const tglLhp = document.getElementById('sppd_tanggal_lhp').value;

    const tempatTujuan = document.getElementById('sppd_tempat_kegiatan')?.value?.trim() || '';
    const kopSuratUrl = document.getElementById('sppd_kop_surat_url')?.value || null;

    const payload = {
      sekolah_asal_nama: document.getElementById('sppd_sekolah_asal_select').value,
      kepala_sekolah_asal: document.getElementById('sppd_kepala_sekolah_asal').value,
      nip_kepala_sekolah_asal: document.getElementById('sppd_nip_kepala_sekolah_asal').value || '-',
      alamat_sekolah_asal: document.getElementById('sppd_alamat_sekolah_asal').value || '',
      kop_surat_url: kopSuratUrl,
      sekolah_tujuan_nama: tempatTujuan,
      tempat_kegiatan: tempatTujuan,
      kepala_sekolah_tujuan: document.getElementById('sppd_kepala_sekolah_tujuan').value || '',
      nip_kepala_sekolah_tujuan: document.getElementById('sppd_nip_kepala_sekolah_tujuan').value || '',
      daftar_guru: daftar_guru,
      tanggal_kegiatan: tglKegiatan,
      waktu_kegiatan: document.getElementById('sppd_waktu_kegiatan').value || '08.00 s.d Selesai',
      agenda: document.getElementById('sppd_agenda').value,
      dasar_surat: document.getElementById('sppd_dasar_surat').value,
      alat_angkut: document.getElementById('sppd_alat_angkut').value,
      tingkat_biaya: document.getElementById('sppd_tingkat_biaya').value,
      biaya_transport: document.getElementById('sppd_biaya_transport').value,
      mata_anggaran: document.getElementById('sppd_mata_anggaran').value,
      lama_hari: '1 (satu) hari',
      tanggal_lhp: tglLhp,
      model: document.getElementById('sppd_model').value,
      aiProvider: document.getElementById('sppd_model').value,
    };

    const res = await api('/surat/generate-sppd', {
      method: 'POST',
      body: payload
    });

    currentSuratData = res.data;
    window.renderSppdPreview(res.data);
    showToast('Paket Surat Tugas & SPPD berhasil dibuat!', 'success');
  } catch (err) {
    console.error('Generate SPPD error:', err);
    showToast(err.message || 'Gagal generate SPPD', 'error');
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
};

// ============================================
// SPPD 4-Tab Interactive Preview
// ============================================
let currentActiveSppdTab = 1;

window.renderSppdPreview = function (data) {
  currentSuratData = data;
  const meta = data.metadata || data;

  const resultContainer = document.getElementById('surat-result');
  const tabsContainer = document.getElementById('sppd-preview-tabs-container');
  const suratContent = document.getElementById('surat-content');
  const sppdRendered = document.getElementById('sppd-rendered-preview');
  const editBtn = document.getElementById('edit-surat-btn');

  if (resultContainer) resultContainer.classList.remove('hidden');
  if (tabsContainer) tabsContainer.classList.remove('hidden');
  if (suratContent) suratContent.classList.add('hidden');
  if (sppdRendered) sppdRendered.classList.remove('hidden');
  if (editBtn) editBtn.classList.add('hidden'); // Structured 4-page doc uses form inputs

  window.switchSppdPreviewTab(1);
  resultContainer?.scrollIntoView({ behavior: 'smooth' });
};

window.switchSppdPreviewTab = function (tabIndex) {
  currentActiveSppdTab = tabIndex;
  const meta = currentSuratData?.metadata || currentSuratData || {};

  // Update tabs highlight
  for (let i = 1; i <= 4; i++) {
    const tab = document.getElementById(`sppd-tab-${i}`);
    if (tab) {
      if (i === tabIndex) {
        tab.classList.add('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
        tab.classList.remove('text-[var(--color-text-secondary)]');
      } else {
        tab.classList.remove('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
        tab.classList.add('text-[var(--color-text-secondary)]');
      }
    }
  }

  const container = document.getElementById('sppd-rendered-preview');
  if (!container) return;

  if (tabIndex === 1) {
    container.innerHTML = getSptPageHtml(meta);
  } else if (tabIndex === 2) {
    container.innerHTML = getSpdPageHtml(meta);
  } else if (tabIndex === 3) {
    container.innerHTML = getVisumPageHtml(meta);
  } else if (tabIndex === 4) {
    container.innerHTML = getLhpPageHtml(meta);
  }
};

function renderKopSekolahHtml(meta) {
  const cleanSekolahNama = escapeHtml(meta.sekolah_asal_nama || 'SD NEGERI');
  const cleanKabupaten = escapeHtml((state.settings?.kabupaten || 'Purwakarta').toUpperCase());
  const cleanKecamatan = escapeHtml(state.settings?.kecamatan || 'Wanayasa');
  const cleanAlamat = escapeHtml(meta.alamat_sekolah_asal || `Kecamatan ${cleanKecamatan}, Kabupaten ${state.settings?.kabupaten || 'Purwakarta'}`);
  const logoUrl = escapeHtml(state.settings?.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Logo_Kabupaten_Purwakarta.png');

  if (meta.kop_surat_url) {
    return `
      <!-- KOP RESMI SEKOLAH -->
      <div class="mb-5 text-center">
        <img src="${escapeHtml(meta.kop_surat_url)}" alt="KOP Surat ${cleanSekolahNama}" class="w-full max-h-36 object-contain mx-auto" onerror="this.parentElement.style.display='none'; if (this.parentElement.nextElementSibling) this.parentElement.nextElementSibling.style.display='flex';" />
      </div>
      <div class="hidden items-center gap-4 pb-3 mb-5" style="border-bottom: 3px double #000;">
        <img src="${logoUrl}" alt="Logo Pemda" class="w-16 h-20 object-contain">
        <div class="text-center flex-1 pr-14">
          <div class="text-xs md:text-sm font-bold tracking-wider">PEMERINTAH KABUPATEN ${cleanKabupaten}</div>
          <div class="text-sm md:text-base font-bold">DINAS PENDIDIKAN</div>
          <div class="text-sm md:text-base font-extrabold uppercase">SATUAN PENDIDIKAN FORMAL ${cleanSekolahNama}</div>
          <div class="text-[11px] md:text-xs italic text-gray-700 mt-0.5">${cleanAlamat}</div>
        </div>
      </div>
    `;
  }

  return `
    <!-- KOP DINAS STANDAR -->
    <div class="flex items-center gap-4 pb-3 mb-5" style="border-bottom: 3px double #000;">
      <img src="${logoUrl}" alt="Logo Pemda" class="w-16 h-20 object-contain">
      <div class="text-center flex-1 pr-14">
        <div class="text-xs md:text-sm font-bold tracking-wider">PEMERINTAH KABUPATEN ${cleanKabupaten}</div>
        <div class="text-sm md:text-base font-bold">DINAS PENDIDIKAN</div>
        <div class="text-sm md:text-base font-extrabold uppercase">SATUAN PENDIDIKAN FORMAL ${cleanSekolahNama}</div>
        <div class="text-[11px] md:text-xs italic text-gray-700 mt-0.5">${cleanAlamat}</div>
      </div>
    </div>
  `;
}

function getSptPageHtml(meta) {
  const tglIndo = formatIndoDateStr(meta.tanggal_kegiatan);
  const hariTgl = formatHariIndoStr(meta.tanggal_kegiatan);
  const guruList = meta.daftar_guru || [];

  return `
    <div class="sppd-doc-page max-w-[760px] mx-auto bg-white p-6 md:p-8 text-black font-serif leading-relaxed text-sm">
      <!-- KOP SEKOLAH -->
      ${renderKopSekolahHtml(meta)}

      <!-- TITLE -->
      <div class="text-center mb-5">
        <div class="text-sm md:text-base font-bold underline tracking-wide">SURAT PERINTAH TUGAS</div>
        <div class="text-xs mt-0.5">Nomor : ${escapeHtml(meta.nomor_surat_tugas || meta.nomor_surat || '-')}</div>
      </div>

      <!-- DASAR -->
      <table class="w-full text-xs mb-3">
        <tr>
          <td class="w-20 font-bold align-top">Dasar</td>
          <td class="w-4 align-top">:</td>
          <td class="align-top">${escapeHtml(meta.dasar_surat || 'Surat Undangan dari Pengurus Kelompok Kerja Guru (KKG) Gugus 3 Wanayasa')}</td>
        </tr>
      </table>

      <div class="text-center font-bold text-xs my-2 tracking-wider">MEMERINTAHKAN :</div>
      <div class="text-xs mb-3">Kepala ${escapeHtml(meta.sekolah_asal_nama)} Kecamatan ${escapeHtml(state.settings?.kecamatan || 'Wanayasa')} Kabupaten ${escapeHtml(state.settings?.kabupaten || 'Purwakarta')} menugaskan kepada:</div>

      <!-- TABEL GURU -->
      <table class="w-full text-xs mb-4 border-collapse border border-black">
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-black p-2 w-8 text-center">No</th>
            <th class="border border-black p-2 text-center">Nama</th>
            <th class="border border-black p-2 text-center">NIP</th>
            <th class="border border-black p-2 text-center">Pangkat / Gol</th>
            <th class="border border-black p-2 text-center">Jabatan</th>
          </tr>
        </thead>
        <tbody>
          ${guruList.map((g, idx) => `
            <tr>
              <td class="border border-black p-2 text-center">${idx + 1}</td>
              <td class="border border-black p-2 font-semibold">${escapeHtml(g.nama)}</td>
              <td class="border border-black p-2 font-mono text-center">${escapeHtml(g.nip || '-')}</td>
              <td class="border border-black p-2 text-center">${escapeHtml(g.pangkat_golongan || '-')}</td>
              <td class="border border-black p-2 text-center">${escapeHtml(g.jabatan || 'Guru')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- UNTUK -->
      <div class="text-xs mb-2">Untuk : Mengikuti kegiatan Kelompok Kerja Guru (KKG), yang akan dilaksanakan pada:</div>
      <table class="w-full text-xs mb-4 ml-4">
        <tr>
          <td class="w-28 py-1 font-medium">Hari / Tanggal</td>
          <td class="w-4">:</td>
          <td class="font-bold py-1">${hariTgl}</td>
        </tr>
        <tr>
          <td class="w-28 py-1 font-medium">Waktu</td>
          <td class="w-4">:</td>
          <td class="py-1">${escapeHtml(meta.waktu_kegiatan || '08.00 WIB s.d Selesai')}</td>
        </tr>
        <tr>
          <td class="w-28 py-1 font-medium">Tempat</td>
          <td class="w-4">:</td>
          <td class="py-1">${escapeHtml(meta.tempat_kegiatan)}</td>
        </tr>
        <tr>
          <td class="w-28 py-1 font-medium">Keperluan / Acara</td>
          <td class="w-4">:</td>
          <td class="font-bold py-1">${escapeHtml(meta.agenda)}</td>
        </tr>
      </table>

      <div class="text-xs mb-6">Demikian Surat Perintah Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab dan melaporkan hasilnya setelah kegiatan selesai.</div>

      <!-- TTD -->
      <div class="flex justify-end text-xs">
        <div class="w-64 text-left">
          <div>Dikeluarkan di : ${escapeHtml(state.settings?.kecamatan || 'Wanayasa')}</div>
          <div class="mb-1">Pada tanggal : ${tglIndo}</div>
          <div class="mb-16">Kepala Sekolah,</div>
          <div class="font-bold underline text-sm">${escapeHtml(meta.kepala_sekolah_asal)}</div>
          <div>NIP. ${escapeHtml(meta.nip_kepala_sekolah_asal || '-')}</div>
        </div>
      </div>
    </div>
  `;
}

function getSpdPageHtml(meta) {
  const tglIndo = formatIndoDateStr(meta.tanggal_kegiatan);
  const guruUtama = meta.daftar_guru?.[0] || { nama: 'Guru', nip: '-', pangkat_golongan: '-', jabatan: 'Guru' };
  const pengikutList = (meta.daftar_guru || []).slice(1);
  const pengikutStr = pengikutList.length > 0
    ? pengikutList.map(g => `${g.nama} (${g.jabatan || 'Guru'})`).join(', ')
    : '-';

  return `
    <div class="sppd-doc-page max-w-[760px] mx-auto bg-white p-6 md:p-8 text-black font-serif leading-relaxed text-sm">
      <!-- HEADER KANAN ATAS -->
      <div class="flex justify-end text-xs mb-3">
        <div class="w-56 text-left">
          <div>Lembar Ke : I</div>
          <div>Kode No    : -</div>
          <div>Nomor       : ${escapeHtml(meta.nomor_sppd || '-')}</div>
        </div>
      </div>

      <!-- TITLE -->
      <div class="text-center mb-5">
        <div class="text-sm md:text-base font-bold underline tracking-wide">SURAT PERJALANAN DINAS (SPD)</div>
        <div class="text-xs mt-0.5">Nomor : ${escapeHtml(meta.nomor_sppd || '-')}</div>
      </div>

      <!-- TABEL 10 POIN -->
      <table class="w-full text-xs mb-5 border-collapse border border-black">
        <tbody>
          <tr>
            <td class="border border-black p-2 w-8 text-center align-top">1.</td>
            <td class="border border-black p-2 w-64 align-top">Pejabat Pembuat Komitmen / Pejabat yang memberi perintah</td>
            <td class="border border-black p-2 font-bold align-top">Kepala ${escapeHtml(meta.sekolah_asal_nama)}</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">2.</td>
            <td class="border border-black p-2 align-top">Nama Pegawai yang diperintahkan</td>
            <td class="border border-black p-2 align-top">
              <div class="font-bold">${escapeHtml(guruUtama.nama)}</div>
              <div class="font-mono text-[11px]">NIP. ${escapeHtml(guruUtama.nip || '-')}</div>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">3.</td>
            <td class="border border-black p-2 align-top">
              <div>a. Pangkat dan Golongan ruang gaji</div>
              <div>b. Jabatan / Instansi</div>
              <div>c. Tingkat Biaya Perjalanan Dinas</div>
            </td>
            <td class="border border-black p-2 align-top">
              <div>a. ${escapeHtml(guruUtama.pangkat_golongan || '-')}</div>
              <div>b. ${escapeHtml(guruUtama.jabatan || 'Guru')} / ${escapeHtml(meta.sekolah_asal_nama)}</div>
              <div>c. ${escapeHtml(meta.tingkat_biaya || 'Tingkat C / Biaya Transport Lokal')}</div>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">4.</td>
            <td class="border border-black p-2 align-top">Maksud Perjalanan Dinas</td>
            <td class="border border-black p-2 align-top">${escapeHtml(meta.agenda)}</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">5.</td>
            <td class="border border-black p-2 align-top">Alat angkut yang dipergunakan</td>
            <td class="border border-black p-2 align-top">${escapeHtml(meta.alat_angkut || 'Kendaraan Pribadi / Sepeda Motor')}</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">6.</td>
            <td class="border border-black p-2 align-top">
              <div>a. Tempat berangkat</div>
              <div>b. Tempat tujuan</div>
            </td>
            <td class="border border-black p-2 align-top">
              <div>a. ${escapeHtml(meta.sekolah_asal_nama)}</div>
              <div>b. ${escapeHtml(meta.tempat_kegiatan)}</div>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">7.</td>
            <td class="border border-black p-2 align-top">
              <div>a. Lamanya Perjalanan Dinas</div>
              <div>b. Tanggal berangkat</div>
              <div>c. Tanggal harus kembali/tiba</div>
            </td>
            <td class="border border-black p-2 align-top">
              <div>a. ${escapeHtml(meta.lama_hari || '1 (satu) hari')}</div>
              <div>b. ${tglIndo}</div>
              <div>c. ${tglIndo}</div>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">8.</td>
            <td class="border border-black p-2 align-top">Pengikut : Nama</td>
            <td class="border border-black p-2 align-top">${escapeHtml(pengikutStr)}</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">9.</td>
            <td class="border border-black p-2 align-top">
              <div>Pembebanan Anggaran:</div>
              <div>a. Instansi</div>
              <div>b. Akun / Mata Anggaran</div>
            </td>
            <td class="border border-black p-2 align-top">
              <div><br></div>
              <div>a. ${escapeHtml(meta.sekolah_asal_nama)}</div>
              <div>b. ${escapeHtml(meta.mata_anggaran || 'Dana BOS')}</div>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center align-top">10.</td>
            <td class="border border-black p-2 align-top">Keterangan lain-lain</td>
            <td class="border border-black p-2 align-top">-</td>
          </tr>
        </tbody>
      </table>

      <!-- TTD -->
      <div class="flex justify-end text-xs">
        <div class="w-64 text-left">
          <div>Dikeluarkan di : ${escapeHtml(state.settings?.kecamatan || 'Wanayasa')}</div>
          <div class="mb-1">Pada tanggal : ${tglIndo}</div>
          <div class="mb-16">Kepala Sekolah,</div>
          <div class="font-bold underline text-sm">${escapeHtml(meta.kepala_sekolah_asal)}</div>
          <div>NIP. ${escapeHtml(meta.nip_kepala_sekolah_asal || '-')}</div>
        </div>
      </div>
    </div>
  `;
}

function getVisumPageHtml(meta) {
  const tglIndo = formatIndoDateStr(meta.tanggal_kegiatan);

  return `
    <div class="sppd-doc-page max-w-[760px] mx-auto bg-white p-6 md:p-8 text-black font-serif leading-relaxed text-sm">
      <!-- HEADER VISUM -->
      <table class="w-full text-xs mb-5">
        <tr>
          <td class="w-1/2 align-top">
            <div class="font-bold">SPPD No : ${escapeHtml(meta.nomor_sppd || '-')}</div>
            <div>Berangkat dari : ${escapeHtml(meta.sekolah_asal_nama)}</div>
            <div class="italic text-[11px]">(Tempat Kedudukan)</div>
            <div>Ke : ${escapeHtml(meta.tempat_kegiatan)}</div>
            <div>Pada tanggal : ${tglIndo}</div>
            <div class="mt-2 mb-14">Kepala Sekolah Asal,</div>
            <div class="font-bold underline">${escapeHtml(meta.kepala_sekolah_asal)}</div>
            <div>NIP. ${escapeHtml(meta.nip_kepala_sekolah_asal || '-')}</div>
          </td>
          <td class="w-1/2"></td>
        </tr>
      </table>

      <!-- TABEL 2 KOLOM VISUM -->
      <table class="w-full text-xs mb-5 border-collapse border border-black">
        <tbody>
          <tr>
            <td class="border border-black p-3 w-1/2 align-top">
              <div class="font-bold mb-1">I. Tiba di : ${escapeHtml(meta.tempat_kegiatan)}</div>
              <div class="mb-1">   Pada tanggal : ${tglIndo}</div>
              <div class="mb-14">Kepala Sekolah / Pejabat di Tempat Tujuan,</div>
              <div class="font-bold underline">${escapeHtml(meta.kepala_sekolah_tujuan || '( .................................................. )')}</div>
              <div>NIP. ${escapeHtml(meta.nip_kepala_sekolah_tujuan || '........................................')}</div>
            </td>
            <td class="border border-black p-3 w-1/2 align-top">
              <div class="font-bold mb-1">Berangkat dari : ${escapeHtml(meta.tempat_kegiatan)}</div>
              <div>Ke : ${escapeHtml(meta.sekolah_asal_nama)}</div>
              <div class="mb-1">Pada tanggal : ${tglIndo}</div>
              <div class="mb-14">Kepala Sekolah / Pejabat di Tempat Tujuan,</div>
              <div class="font-bold underline">${escapeHtml(meta.kepala_sekolah_tujuan || '( .................................................. )')}</div>
              <div>NIP. ${escapeHtml(meta.nip_kepala_sekolah_tujuan || '........................................')}</div>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-3 w-1/2 align-top">
              <div class="font-bold mb-1">II. Tiba di : ${escapeHtml(meta.sekolah_asal_nama)}</div>
              <div class="italic text-[11px] mb-1">    (Tempat Kedudukan)</div>
              <div class="mb-1">    Pada tanggal : ${tglIndo}</div>
              <div class="mb-14">Kepala Sekolah Asal,</div>
              <div class="font-bold underline">${escapeHtml(meta.kepala_sekolah_asal)}</div>
              <div>NIP. ${escapeHtml(meta.nip_kepala_sekolah_asal || '-')}</div>
            </td>
            <td class="border border-black p-3 w-1/2 align-top">
              <div class="italic text-[11px] mb-2 leading-normal">Telah diperiksa dengan keterangan bahwa perjalanan tersebut di atas benar-benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.</div>
              <div class="mb-12">Kepala Sekolah Asal,</div>
              <div class="font-bold underline">${escapeHtml(meta.kepala_sekolah_asal)}</div>
              <div>NIP. ${escapeHtml(meta.nip_kepala_sekolah_asal || '-')}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- KLAUSUL KEUANGAN NEGARA -->
      <div class="text-xs">
        <div class="font-bold mb-1">III. CATATAN LAIN-LAIN / PERHATIAN:</div>
        <div class="italic text-gray-700 leading-normal">PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.</div>
      </div>
    </div>
  `;
}

function getLhpPageHtml(meta) {
  const tglIndo = formatIndoDateStr(meta.tanggal_kegiatan);
  const hariTgl = formatHariIndoStr(meta.tanggal_kegiatan);
  const tglLhpIndo = formatIndoDateStr(meta.tanggal_lhp);
  const guruUtama = meta.daftar_guru?.[0] || { nama: 'Guru Pelapor', nip: '-' };

  const rawLhp = meta.isi_lhp || meta.isi_surat || '';
  const lines = rawLhp.split('\n').map(l => l.trim()).filter(Boolean);

  return `
    <div class="sppd-doc-page max-w-[760px] mx-auto bg-white p-6 md:p-8 text-black font-serif leading-relaxed text-sm">
      <!-- KOP SEKOLAH -->
      ${renderKopSekolahHtml(meta)}

      <!-- TITLE -->
      <div class="text-center mb-5">
        <div class="text-sm md:text-base font-bold underline tracking-wide">LAPORAN HASIL PEKERJAAN</div>
        <div class="text-xs mt-0.5">Kegiatan Kelompok Kerja Guru (KKG)</div>
      </div>

      <!-- KEPADA YTH -->
      <div class="text-xs mb-3">
        <div>Kepada Yth.</div>
        <div class="font-bold">Kepala ${escapeHtml(meta.sekolah_asal_nama)}</div>
        <div>di Tempat</div>
      </div>

      <!-- BUTIR LAPORAN -->
      <div class="text-xs space-y-2.5 mb-6">
        <div>
          <span class="font-bold">1. Dasar Penugasan:</span>
          <div class="ml-4 mt-0.5">Surat Perintah Tugas Nomor: ${escapeHtml(meta.nomor_surat_tugas || meta.nomor_surat || '-')} tertanggal ${tglIndo}.</div>
        </div>

        <div>
          <span class="font-bold">2. Waktu dan Tempat Pelaksanaan:</span>
          <table class="ml-4 mt-1 w-full">
            <tr><td class="w-28 py-0.5">- Hari / Tanggal</td><td class="w-3">:</td><td>${hariTgl}</td></tr>
            <tr><td class="w-28 py-0.5">- Waktu</td><td class="w-3">:</td><td>${escapeHtml(meta.waktu_kegiatan || '08.00 WIB s.d Selesai')}</td></tr>
            <tr><td class="w-28 py-0.5">- Tempat</td><td class="w-3">:</td><td>${escapeHtml(meta.tempat_kegiatan)}</td></tr>
          </table>
        </div>

        <div>
          <span class="font-bold">3. Maksud dan Tujuan:</span>
          <div class="ml-4 mt-0.5">${escapeHtml(meta.agenda)}</div>
        </div>

        <div>
          <span class="font-bold">4. Hasil Pelaksanaan Tugas:</span>
          <div class="ml-4 mt-1 space-y-1 text-justify">
            ${lines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
          </div>
        </div>

        <div>
          <span class="font-bold">5. Tindak Lanjut:</span>
          <div class="ml-4 mt-0.5">Mengimplementasikan materi kegiatan dalam pembelajaran di kelas serta mengimbaskan hasil kegiatan kepada rekan pendidik di lingkungan ${escapeHtml(meta.sekolah_asal_nama)}.</div>
        </div>

        <div>
          <span class="font-bold">6. Penutup:</span>
          <div class="ml-4 mt-0.5">Demikian laporan hasil pekerjaan ini disampaikan sebagai bentuk pertanggungjawaban atas pelaksanaan tugas yang telah diberikan.</div>
        </div>
      </div>

      <!-- TTD (Wajib H+1 !) -->
      <div class="flex justify-end text-xs">
        <div class="w-64 text-left">
          <div class="mb-1">${escapeHtml(state.settings?.kecamatan || 'Wanayasa')}, <span class="font-bold">${tglLhpIndo}</span></div>
          <div class="mb-16">Pegawai yang Melaporkan,</div>
          <div class="font-bold underline text-sm">${escapeHtml(guruUtama.nama)}</div>
          <div>NIP. ${escapeHtml(guruUtama.nip || '-')}</div>
        </div>
      </div>
    </div>
  `;
}

window.insertStructureAttachment = function () {
  const textarea = document.getElementById('surat-edit-textarea');
  if (!textarea) return;

  // Check if already exists
  if (textarea.value.includes('[LAMPIRAN_STRUKTUR]')) {
    showToast('Lampiran struktur sudah ada di surat ini', 'info');
    return;
  }

  textarea.value += '\n\n[LAMPIRAN_STRUKTUR]';
  showToast('Marker lampiran struktur ditambahkan ke akhir surat', 'success');
}

// Store current surat for export
window.setCurrentSuratData = function (data) {
  currentSuratData = data;
}

// Global functions
window.generateSurat = async function (e) {
  e.preventDefault();
  if (!state.user) { showToast('Silakan login terlebih dahulu', 'error'); return; }

  const form = e.target;
  const btn = document.getElementById('generate-btn');
  btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Memproses dengan AI... (30-60s)';
  btn.disabled = true;

  try {
    const formData = {
      jenis_kegiatan: form.jenis_kegiatan.value,
      tanggal_kegiatan: form.tanggal_kegiatan.value,
      waktu_kegiatan: form.waktu_kegiatan.value,
      tempat_kegiatan: form.tempat_kegiatan.value,
      agenda: form.agenda.value,
      peserta: form.peserta.value,
      penanggung_jawab: form.penanggung_jawab.value,
      model: form.model.value,
      aiProvider: form.model.value,
      lampiran: form.lampiran?.value || '',
    };

    const res = await api('/surat/generate', {
      method: 'POST',
      body: formData
    });

    // Auto-append structure attachment if requested
    const includeStruktur = document.getElementById('include_struktur')?.checked;
    if (includeStruktur) {
      res.data.isi_surat += '\n\n[LAMPIRAN_STRUKTUR]';

      // Auto-save the updated content to server so DOCX generation includes it
      try {
        await api(`/surat/${res.data.id}`, {
          method: 'PUT',
          body: { isi_surat: res.data.isi_surat }
        });
      } catch (saveErr) {
        console.error('Auto-save lampiran error:', saveErr);
      }
    }

    // Store data for export
    currentSuratData = {
      ...formData,
      id: res.data.id,
      nomor_surat: res.data.nomor_surat,
      isi_surat: res.data.isi_surat,
      created_at: res.data.created_at
    };

    document.getElementById('surat-content').textContent = res.data.isi_surat;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });
    showToast('Surat berhasil di-generate!', 'success');
  } catch (e) {
    showToast(e.message || 'Gagal generate surat', 'error');
  }

  btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Surat dengan AI';
  btn.disabled = false;
}

window.downloadSuratPDF = function () {
  if (currentSuratData?.tipe_surat === 'sppd') {
    const meta = currentSuratData.metadata || currentSuratData;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Paket SPT & SPPD - ${escapeHtml(meta.sekolah_asal_nama || 'KKG')}</title>
        <style>
          @page { size: A4; margin: 15mm 15mm 15mm 20mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.35; color: #000; margin: 0; padding: 0; background: #fff; }
          .page-print { page-break-after: always; break-after: page; min-height: 98vh; box-sizing: border-box; padding-bottom: 20px; }
          .page-print:last-child { page-break-after: avoid; break-after: avoid; }
          table { width: 100%; border-collapse: collapse; }
          @media print {
            body { padding: 0; margin: 0; }
            .page-print { page-break-after: always; break-after: page; }
            .page-print:last-child { page-break-after: avoid; break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page-print">${getSptPageHtml(meta)}</div>
        <div class="page-print">${getSpdPageHtml(meta)}</div>
        <div class="page-print">${getVisumPageHtml(meta)}</div>
        <div class="page-print">${getLhpPageHtml(meta)}</div>
        <script>
          setTimeout(function() { window.print(); }, 500);
        </script>
      </body>
      </html>
    `);
    win.document.close();
    return;
  }

  const content = document.getElementById('surat-content').textContent;
  if (!content) return;

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
      <html><head>
        <title>Surat Undangan - ${escapeHtml(state.settings?.nama_kkg || 'Portal KKG')}</title>
        <style>
          @page {size: A4; margin: 2.5cm 2cm 2cm 2.5cm; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            max-width: 210mm;
            margin: auto;
            padding: 20px;
            color: #000;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            margin: 0;
          }
          @media print {
            body {padding: 0; } 
          }
        </style>
      </head>
      <body>
        <pre>${escapeHtml(content)}</pre>
        <script>
          setTimeout(function() {window.print(); }, 500);
        </script>
      </body></html>
  `);
  win.document.close();
}

window.downloadSuratDocx = async function () {
  // If no data
  if (!currentSuratData) {
    showToast('Tidak ada surat untuk diunduh. Silakan generate atau pilih surat terlebih dahulu.', 'warning');
    return;
  }

  // If no ID (template preview), use client-side generation
  if (!currentSuratData.id) {
    return window.downloadSuratDocxClientSide();
  }

  try {
    showToast('Mengunduh dokumen...', 'info');

    // Use server-side DOCX generation
    const response = await fetch(`/api/surat/${currentSuratData.id}/download`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Gagal mengunduh dokumen' }));
      throw new Error(error.message || 'Gagal mengunduh dokumen');
    }

    // Get blob and download
    const blob = await response.blob();
    const isSppd = currentSuratData?.tipe_surat === 'sppd';
    const prefix = isSppd ? 'Paket_SPT_SPPD' : 'Surat_Undangan';
    const cleanName = isSppd
      ? (currentSuratData.metadata?.sekolah_asal_nama || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_')
      : (currentSuratData.jenis_kegiatan || 'KKG').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${prefix}_${cleanName}_${new Date().toISOString().slice(0, 10)}.docx`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    showToast('Dokumen berhasil diunduh sebagai DOCX', 'success');
  } catch (error) {
    console.error('DOCX download error:', error);
    showToast('Gagal mengunduh dokumen: ' + error.message, 'error');
  }
}

// Fallback client-side DOCX generation (in case server fails)
window.downloadSuratDocxClientSide = async function () {
  const content = document.getElementById('surat-content').textContent;
  if (!content) {
    showToast('Tidak ada surat untuk diunduh', 'warning');
    return;
  }

  // Fetch logo if settings loaded
  let logoBuffer = null;
  if (typeof letterSettings !== 'undefined' && letterSettings?.logo_url) {
    try {
      const resp = await fetch(letterSettings.logo_url);
      if (resp.ok) logoBuffer = await resp.arrayBuffer();
    } catch (e) {
      console.warn("Failed to load logo", e);
    }
  }

  try {
    const docxLib = window.docx;
    if (!docxLib) throw new Error('Library DOCX belum dimuat. Silakan refresh halaman.');

    // Destructure needed modules - check lib version compatibility
    const { Document, Paragraph, TextRun, AlignmentType, BorderStyle, convertInchesToTwip, Table, TableRow, TableCell, WidthType, ImageRun, VerticalAlign } = docxLib;

    const lines = content.split('\n');
    const headerLines = [];
    const bodyLines = [];
    const footerLines = [];

    let section = 'HEADER';

    // Parse content
    for (const line of lines) {
      const txt = line.trim();
      if (txt.includes('_____')) {
        section = 'BODY';
        continue;
      }

      if (section === 'HEADER') {
        if (txt) headerLines.push(txt);
      } else if (section === 'BODY') {
        // Check footer start
        if (txt.match(/^[A-Za-z\s]+,\s+\d+\s+[A-Za-z]+\s+\d{4}$/) || txt.startsWith('Ketua KKG') || txt.startsWith('Kepala')) {
          section = 'FOOTER';
          footerLines.push(txt);
        } else {
          bodyLines.push(txt);
        }
      } else {
        footerLines.push(txt);
      }
    }

    const docChildren = [];

    // 1. Header (Table with Logo)
    if (headerLines.length > 0) {
      const headerParagraphs = headerLines.map(text => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text, font: 'Times New Roman', size: text.startsWith('Alamat') ? 20 : 24, bold: !text.startsWith('Alamat') })]
      }));

      const logoCellChildren = [];
      if (logoBuffer) {
        logoCellChildren.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new ImageRun({ data: logoBuffer, transformation: { width: 80, height: 80 } })]
        }));
      } else {
        logoCellChildren.push(new Paragraph({}));
      }

      docChildren.push(new Table({
        columnWidths: [convertInchesToTwip(5.5), convertInchesToTwip(1.5)],
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: headerParagraphs,
                width: { size: 80, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              }),
              new TableCell({
                children: logoCellChildren,
                width: { size: 20, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign ? VerticalAlign.CENTER : undefined,
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              })
            ]
          })
        ],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 24, space: 1 }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
      }));

      // Separation
      docChildren.push(new Paragraph({ spacing: { before: 240 } }));
    }

    // 2. Body
    for (const line of bodyLines) {
      if (!line.trim()) {
        docChildren.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }

      const isBoldKey = line.startsWith('Nomor') || line.startsWith('Perihal') || line.startsWith('Lampiran');

      docChildren.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120, line: 276 },
        children: [new TextRun({ text: line, font: 'Times New Roman', size: 24, bold: isBoldKey })]
      }));
    }

    // 3. Footer
    for (const line of footerLines) {
      if (!line.trim()) {
        docChildren.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }

      const isDate = line.match(/^[A-Za-z\s]+,\s+\d+\s+[A-Za-z]+\s+\d{4}$/);
      const isNip = line.startsWith('NIP');
      const isTitle = line.startsWith('Ketua') || line.startsWith('Kepala') || line.startsWith('Sekretaris');
      const isName = !isDate && !isTitle && !isNip && line.length > 2;

      docChildren.push(new Paragraph({
        indent: { left: convertInchesToTwip(4) },
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: line, font: 'Times New Roman', size: 24, bold: isName, underline: isName ? {} : undefined })]
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) }
          }
        },
        children: docChildren
      }]
    });

    const filename = `Surat_Undangan_${currentSuratData?.jenis_kegiatan || 'KKG'}_${new Date().toISOString().slice(0, 10)}.docx`.replace(/\s+/g, '_');

    docx.Packer.toBlob(doc).then(blob => {
      saveAs(blob, filename);
      showToast('Surat berhasil diunduh sebagai DOCX', 'success');
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    showToast('Gagal membuat dokumen DOCX: ' + error.message, 'error');
  }
}

window.editSuratContent = function () {
  const content = document.getElementById('surat-content').textContent;
  document.getElementById('surat-edit-textarea').value = content;
  document.getElementById('surat-content').classList.add('hidden');
  document.getElementById('surat-edit-mode').classList.remove('hidden');
}

window.saveSuratEdit = async function () {
  const newContent = document.getElementById('surat-edit-textarea').value;
  const btn = document.querySelector('#surat-edit-mode button:first-child');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Menyimpan...';

  try {
    // Update stored data locally first
    document.getElementById('surat-content').textContent = newContent;
    if (currentSuratData) {
      currentSuratData.isi_surat = newContent;
    }

    // If it's a saved surat (has ID), update in database
    if (currentSuratData && currentSuratData.id) {
      await api(`/surat/${currentSuratData.id}`, {
        method: 'PUT',
        body: { isi_surat: newContent }
      });
    }

    cancelSuratEdit();
    showToast('Perubahan berhasil disimpan', 'success');
  } catch (e) {
    console.error('Save surat error:', e);
    showToast('Gagal menyimpan perubahan: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

window.cancelSuratEdit = function () {
  document.getElementById('surat-content').classList.remove('hidden');
  document.getElementById('surat-edit-mode').classList.add('hidden');
}

window.loadSuratHistory = async function () {
  try {
    const res = await api('/surat/history');
    const container = document.getElementById('surat-history');
    container.classList.remove('hidden');

    if (!res.data?.items || res.data.items.length === 0) {
      container.innerHTML = '<div class="text-center py-16 text-[var(--color-text-tertiary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">Belum ada riwayat surat.</div>';
      return;
    }

    container.innerHTML = `
      <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-xl p-6 border border-[var(--color-border-subtle)] animate-slide-up">
        <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center">
          <i class="fas fa-history text-blue-500 mr-2"></i>Riwayat Surat
        </h2>
        <div class="space-y-4">
          ${res.data.items.map(s => `
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-subtle)] hover:border-blue-400 transition group">
              <div>
                <div class="flex items-center gap-2">
                  <div class="font-bold text-[var(--color-text-primary)] group-hover:text-blue-600 transition-colors">${escapeHtml(s.jenis_kegiatan)}</div>
                  ${s.tipe_surat === 'sppd' ? `<span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1"><i class="fas fa-file-contract"></i> Paket SPPD</span>` : ''}
                </div>
                <div class="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
                  <span class="bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded text-[var(--color-text-tertiary)] font-mono">${escapeHtml(s.nomor_surat)}</span>
                  <span class="text-[var(--color-text-tertiary)]"><i class="far fa-calendar-alt mr-1"></i>${formatDate(s.tanggal_kegiatan)}</span>
                </div>
              </div>
              <div class="flex gap-2 self-end sm:self-auto">
                <button onclick="viewSurat(${s.id})" class="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none">
                   <i class="fas fa-eye mr-1"></i>Lihat
                </button>
                <button onclick="deleteSurat(${s.id})" class="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200 border-none shadow-none px-3">
                   <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        ${res.data.pagination.totalPages > 1 ? `
          <div class="mt-6 text-center text-xs font-medium text-[var(--color-text-tertiary)]">
            Halaman ${res.data.pagination.page} dari ${res.data.pagination.totalPages} (${res.data.pagination.total} surat)
          </div>
        ` : ''}
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

window.viewSurat = async function (id) {
  try {
    const res = await api(`/surat/${id}`);

    // Store data for export
    currentSuratData = res.data;

    if (res.data.tipe_surat === 'sppd') {
      window.renderSppdPreview(res.data);
    } else {
      document.getElementById('sppd-preview-tabs-container')?.classList.add('hidden');
      document.getElementById('sppd-rendered-preview')?.classList.add('hidden');
      document.getElementById('edit-surat-btn')?.classList.remove('hidden');
      const suratContentEl = document.getElementById('surat-content');
      if (suratContentEl) {
        suratContentEl.classList.remove('hidden');
        suratContentEl.textContent = res.data.isi_surat;
      }
      document.getElementById('surat-result')?.classList.remove('hidden');
      document.getElementById('surat-result')?.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (e) { showToast(e.message, 'error'); }
}

window.deleteSurat = async function (id) {
  if (!confirm('Yakin ingin menghapus surat ini?')) return;
  try {
    await api(`/surat/${id}`, { method: 'DELETE' });
    showToast('Surat berhasil dihapus', 'success');
    loadSuratHistory();
  } catch (e) { showToast(e.message, 'error'); }
}

// ============================================
// Template Integration Functions
// ============================================

let currentSuratMode = 'ai';
let loadedTemplates = [];
let selectedTemplate = null;
let letterSettings = null;

async function fetchLetterSettings() {
  if (letterSettings) return;
  try {
    const res = await api('/surat/settings');
    letterSettings = res.data;
  } catch (e) {
    console.error('Fetch settings error:', e);
    // Fallback defaults
    letterSettings = {
      nama_ketua: state.settings?.nama_ketua || 'Ketua KKG',
      nip_ketua: state.settings?.nip_ketua || '-',
      alamat_sekretariat: state.settings?.alamat_sekretariat || '',
      kabupaten: state.settings?.kabupaten || 'Purwakarta',
      kecamatan: state.settings?.kecamatan || '',
      gugus: state.settings?.gugus || '01'
    };
  }
}

// Switch between AI and Template mode
window.switchSuratMode = function (mode) {
  currentSuratMode = mode;

  // Update tab styles
  const aiTab = document.getElementById('mode-ai');
  const templateTab = document.getElementById('mode-template');

  if (mode === 'ai') {
    aiTab.classList.add('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    aiTab.classList.remove('text-[var(--color-text-secondary)]', 'hover:text-[var(--color-text-primary)]');

    templateTab.classList.remove('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    templateTab.classList.add('text-[var(--color-text-secondary)]', 'hover:text-[var(--color-text-primary)]');

    // Show AI form, hide template
    document.getElementById('surat-form').classList.remove('hidden');
    document.getElementById('template-selector').classList.add('hidden');
    document.getElementById('template-variables-form').classList.add('hidden');
    document.getElementById('generate-from-template-btn').classList.add('hidden');
  } else {
    templateTab.classList.add('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    templateTab.classList.remove('text-[var(--color-text-secondary)]', 'hover:text-[var(--color-text-primary)]');

    aiTab.classList.remove('bg-[var(--color-bg-elevated)]', 'text-[var(--color-text-primary)]', 'shadow-sm', 'font-bold');
    aiTab.classList.add('text-[var(--color-text-secondary)]', 'hover:text-[var(--color-text-primary)]');

    // Hide AI form, show template
    document.getElementById('surat-form').classList.add('hidden');
    document.getElementById('template-selector').classList.remove('hidden');
    document.getElementById('generate-from-template-btn').classList.remove('hidden');

    // Load settings and templates if not loaded
    fetchLetterSettings();
    if (loadedTemplates.length === 0) {
      loadTemplatesForSurat();
    }
  }
}

// Load available templates
async function loadTemplatesForSurat() {
  try {
    const res = await api('/templates?active=true');
    loadedTemplates = res.data || [];

    const select = document.getElementById('template_id');
    select.innerHTML = '<option value="">-- Pilih Template --</option>';

    // Group by jenis
    const grouped = {};
    loadedTemplates.forEach(t => {
      if (!grouped[t.jenis]) grouped[t.jenis] = [];
      grouped[t.jenis].push(t);
    });

    Object.entries(grouped).forEach(([jenis, templates]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = jenis.charAt(0).toUpperCase() + jenis.slice(1);
      templates.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.nama;
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    });
  } catch (e) {
    console.error('Load templates error:', e);
    showToast('Gagal memuat template', 'error');
  }
}

// Load selected template and show variable fields
window.loadTemplateForSurat = async function () {
  const templateId = document.getElementById('template_id').value;

  if (!templateId) {
    document.getElementById('template-variables-form').classList.add('hidden');
    document.getElementById('template-desc').textContent = '';
    selectedTemplate = null;
    return;
  }

  try {
    const res = await api(`/templates/${templateId}`);
    selectedTemplate = res.data;

    // Show description
    document.getElementById('template-desc').textContent = selectedTemplate.deskripsi || '';

    // Build variable fields
    const variables = selectedTemplate.variables || [];
    const fieldsContainer = document.getElementById('template-variables-fields');

    if (variables.length === 0) {
      fieldsContainer.innerHTML = '<p class="text-[var(--color-text-tertiary)] text-sm col-span-2 italic">Template ini tidak memerlukan input data tambahan.</p>';
    } else {
      fieldsContainer.innerHTML = variables.map(v => {
        // Generate user-friendly label
        const label = v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const isTextarea = ['isi_edaran', 'acara', 'materi', 'agenda'].includes(v);

        return `
          <div class="${isTextarea ? 'md:col-span-2' : ''}">
            <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">${label}</label>
            ${isTextarea
            ? `<textarea id="var-${v}" name="var-${v}" rows="3" placeholder="Isi ${label.toLowerCase()}..." class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition resize-none"></textarea>`
            : `<input type="${v.includes('tanggal') ? 'date' : 'text'}" id="var-${v}" name="var-${v}" placeholder="Isi ${label.toLowerCase()}..." class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] transition">`
          }
          </div>
        `;
      }).join('');
    }

    document.getElementById('template-variables-form').classList.remove('hidden');
  } catch (e) {
    console.error('Load template error:', e);
    showToast('Gagal memuat template', 'error');
  }
}

// Generate surat from template
window.generateFromTemplate = async function () {
  if (!selectedTemplate) {
    showToast('Pilih template terlebih dahulu', 'error');
    return;
  }

  const btn = document.getElementById('generate-from-template-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Membuat Surat...';

  try {
    // Collect variable values
    const variables = selectedTemplate.variables || [];
    const data = {};

    for (const v of variables) {
      const input = document.getElementById(`var-${v}`);
      if (input) {
        const value = input.value.trim();
        // Format date if needed
        if (v.includes('tanggal') && value) {
          const date = new Date(value);
          data[v] = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
          data[v] = value || `[${v}]`;
        }
      }
    }

    // Replace variables in template content
    let content = selectedTemplate.konten;
    for (const [key, value] of Object.entries(data)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Store for export
    currentSuratData = {
      id: null,
      nomor_surat: generateTempNomorSurat(selectedTemplate.jenis),
      jenis_kegiatan: selectedTemplate.nama,
      tanggal_kegiatan: data.tanggal || new Date().toISOString().split('T')[0],
      isi_surat: content,
      template_id: selectedTemplate.id,
      created_at: new Date().toISOString()
    };

    // Show result
    document.getElementById('surat-content').textContent = content;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });

    showToast('Surat berhasil dibuat dari template!', 'success');
  } catch (e) {
    console.error('Generate from template error:', e);
    showToast(e.message || 'Gagal membuat surat', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-alt mr-2"></i>Buat Surat dari Template';
  }
}

// Generate temporary nomor surat
function generateTempNomorSurat(jenis) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const jenisCode = {
    'undangan': 'UND',
    'tugas': 'TGS',
    'keterangan': 'KET',
    'edaran': 'EDR',
    'permohonan': 'PHN',
    'lainnya': 'SRT'
  };
  const code = jenisCode[jenis] || 'SRT';
  const num = String(Math.floor(Math.random() * 100) + 1).padStart(3, '0');
  return `${num}/KKG-G3/${code}/${month}/${year}`;
}

// Wrap content with Kop Surat and Signature
async function wrapWithKopAndSignature(content, nomorSurat) {
  // Ensure settings are loaded
  await fetchLetterSettings();
  const s = letterSettings;

  // Format date now
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return `PEMERINTAH KABUPATEN ${s.kabupaten.toUpperCase()}
DINAS PENDIDIKAN
KELOMPOK KERJA GURU (KKG) GUGUS ${s.gugus}
KECAMATAN ${s.kecamatan.toUpperCase()}
Alamat: ${s.alamat_sekretariat}

__________________________________________________________________________

Nomor   : ${nomorSurat}
Lampiran: -
Perihal : ${selectedTemplate.nama}

${content}

${s.kecamatan}, ${today}
Ketua KKG Gugus ${s.gugus},


${s.nama_ketua}
NIP. ${s.nip_ketua}`;
}

// New Generate Function
window.generateFromTemplateNew = async function () {
  if (!selectedTemplate) {
    showToast('Pilih template terlebih dahulu', 'error');
    return;
  }

  const btn = document.getElementById('generate-from-template-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Membuat Surat...';

  try {
    // Collect variables
    const variables = selectedTemplate.variables || [];
    const data = {};

    for (const v of variables) {
      const input = document.getElementById(`var-${v}`);
      if (input) {
        let value = input.value.trim();
        if (v.includes('tanggal') && value) {
          const date = new Date(value);
          value = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        data[v] = value || `[${v}]`;
      }
    }

    // Replace content
    let content = selectedTemplate.konten;
    for (const [key, value] of Object.entries(data)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Generate nomor
    const nomorSurat = generateTempNomorSurat(selectedTemplate.jenis);

    // Wrap
    const fullContent = await wrapWithKopAndSignature(content, nomorSurat);

    // Store
    currentSuratData = {
      id: null,
      nomor_surat: nomorSurat,
      jenis_kegiatan: selectedTemplate.nama,
      tanggal_kegiatan: data.tanggal || new Date().toISOString().split('T')[0],
      isi_surat: fullContent,
      template_id: selectedTemplate.id,
      created_at: new Date().toISOString()
    };

    // Show
    document.getElementById('surat-content').textContent = fullContent;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });

    showToast('Surat berhasil dibuat!', 'success');
  } catch (e) {
    console.error('Error generation:', e);
    showToast('Gagal membuat surat: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-signature mr-2"></i>Buat Surat dari Template';
  }
}
