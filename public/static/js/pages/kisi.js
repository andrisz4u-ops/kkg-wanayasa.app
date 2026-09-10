import { api } from '../api.js';
import { showToast, showLoading, hideLoading, populateAiModelSelect, escapeHtml, getActiveTahunAjaran, detectUserDefaultKelas, openAiLiveMonitor, closeAiLiveMonitor, streamPost } from '../utils.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';
import { generateAsesmenDocx } from '../asesmen-docx.js';
import { saveDocArchive, openArchiveDrawer } from '../storage-archive.js';

export async function renderKisi() {
  if (!state.user) {
    return renderLockedFeature(
      'Generator Soal & Asesmen',
      'Penyusunan instrumen penilaian kini 10x lebih cepat. Dapatkan paket soal lengkap dengan kunci jawaban dan kisi-kisi berstandar HOTS (Higher Order Thinking Skills).',
      ['Paket Soal Lengkap (PG, Isian, Uraian)', 'Kisi-kisi Otomatis', 'Analisis Tingkat Kesulitan (HOTS)', 'Download Format MS Word Siap Cetak']
    );
  }

  const defaultK = detectUserDefaultKelas(state.user);

  return `
    <div class="animate-fade-in" id="asesmen-page">
      <!-- FORM VIEW -->
      <div id="asesmen-form-view">
        <!-- Header -->
        <div class="asesmen-header flex-col sm:flex-row justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="asesmen-logo-mark">
              <i class="fas fa-brain"></i>
            </div>
            <div>
              <h1 class="asesmen-title">ASESMEN A4EDU</h1>
              <p class="asesmen-subtitle">NEURAL QUESTION ARCHITECT A4EDU</p>
            </div>
          </div>
          <button type="button" id="btn-kisi-archive" class="px-5 py-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-2 shadow-sm mt-3 sm:mt-0 cursor-pointer">
            <i class="fas fa-folder-open text-amber-500"></i> Riwayat Lokal
          </button>
          <button type="button" id="btn-bank-soal" class="px-5 py-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-500/30 text-xs font-bold transition-all flex items-center gap-2 shadow-sm mt-3 sm:mt-0 cursor-pointer">
            <i class="fas fa-database text-violet-500"></i> Bank Soal Kolaboratif <span id="bank-soal-count-badge" class="hidden px-1.5 py-0.5 text-[10px] rounded-full bg-violet-600 text-white font-bold ml-1"></span>
          </button>
        </div>

        <!-- 3-Column Form -->
        <form id="asesmen-form">
          <div class="asesmen-grid">

          <!-- Column 1: IDENTITAS -->
          <div class="asesmen-card">
            <h3 class="asesmen-card-title"><i class="fas fa-school"></i> IDENTITAS</h3>

            <label class="asesmen-label">NAMA SEKOLAH</label>
            <input type="text" name="namaSekolah" value="${state.user?.sekolah_nama || state.user?.sekolah || ''}" class="asesmen-input">

            <label class="asesmen-label">GURU PENGAMPU</label>
            <input type="text" name="namaGuru" value="${state.user?.nama || ''}" class="asesmen-input">

            <div class="asesmen-row">
              <div class="asesmen-col">
                <label class="asesmen-label">NIP GURU</label>
                <input type="text" name="nipGuru" value="${state.user?.nip || ''}" class="asesmen-input">
              </div>
              <div class="asesmen-col">
                 <label class="asesmen-label">KEPALA SEKOLAH</label>
                 <input type="text" name="namaKepalaSekolah" value="${state.user?.kepala_sekolah || ''}" class="asesmen-input">
              </div>
            </div>

            <label class="asesmen-label">NIP KEPALA SEKOLAH</label>
            <input type="text" name="nipKepalaSekolah" value="${state.user?.nip_kepala_sekolah || ''}" class="asesmen-input">

            <div class="asesmen-row">
              <div class="asesmen-col">
                <label class="asesmen-label">KELAS</label>
                <select name="jenjangKelas" class="asesmen-input">
                  ${[1, 2, 3, 4, 5, 6].map(k => `
                    <option value="Kelas ${k}" ${k === defaultK ? 'selected' : ''}>Kelas ${k}</option>
                  `).join('')}
                </select>
              </div>
              <div class="asesmen-col">
                <label class="asesmen-label">SEMESTER</label>
                <select name="semester" class="asesmen-input">
                  <option selected>Ganjil</option><option>Genap</option>
                </select>
              </div>
            </div>

            <label class="asesmen-label">JENIS SOAL / UJIAN</label>
            <select name="jenisUjian" class="asesmen-input">
              <option>Ulangan Harian</option>
              <option>STS</option>
              <option>SAS</option>
              <option>ASAT</option>
            </select>
          </div>

          <!-- Column 2: KURIKULUM & MATERI -->
          <div class="asesmen-card">
            <h3 class="asesmen-card-title"><i class="fas fa-graduation-cap"></i> KURIKULUM & MATERI</h3>

            <label class="asesmen-label">MATA PELAJARAN</label>
            <select name="mataPelajaran" class="asesmen-input" required>
              <option value="">Pilih Mata Pelajaran...</option>
              <option>Pendidikan Agama dan Budi Pekerti</option>
              <option>Pendidikan Pancasila</option>
              <option>Bahasa Indonesia</option>
              <option>Matematika</option>
              <option>Ilmu Pengetahuan Alam dan Sosial (IPAS)</option>
              <option>Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)</option>
              <option>Bahasa Inggris</option>
              <option>Seni Rupa</option>
              <option>Koding dan Kecerdasan Artifisial</option>
              <option>B.Sunda</option>
              <option>Tatanen di Bale Atikan</option>
              <option>AKPK</option>
            </select>

            <label class="asesmen-label">RUANG LINGKUP / TOPIK</label>
            <textarea name="topik" rows="3" placeholder="Tuliskan topik bahasan di sini..." class="asesmen-input asesmen-textarea" required></textarea>

            <div class="flex items-center justify-between mb-1 mt-3">
              <label class="asesmen-label mb-0">CAPAIAN PEMBELAJARAN (OPSIONAL)</label>
              <button type="button" id="btn-auto-cp" class="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer transition-colors" title="Muat rumusan CP resmi BSKAP No. 046 Tahun 2025">
                <i class="fas fa-book-reader text-cyan-500"></i> Muat CP BSKAP 2025
              </button>
            </div>
            <textarea name="capaianPembelajaran" id="input-cp-text" rows="3" placeholder="Kosongkan untuk otomatisasi cerdas AI, atau klik 'Muat CP BSKAP 2025'..." class="asesmen-input asesmen-textarea"></textarea>
          </div>

          <!-- Column 3: KARAKTERISTIK -->
          <div class="asesmen-card">
            <h3 class="asesmen-card-title"><i class="fas fa-sliders-h"></i> KARAKTERISTIK</h3>

            <!-- Question Type Counters -->
            <div class="asesmen-counter-grid">
              <div class="asesmen-counter-item">
                <span class="asesmen-counter-label">PG</span>
                <div class="asesmen-counter-controls">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahPG" data-dir="-1">−</button>
                  <input type="number" name="jumlahPG" value="10" min="0" max="50" class="asesmen-counter-value">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahPG" data-dir="1">+</button>
                </div>
              </div>
              <div class="asesmen-counter-item">
                <span class="asesmen-counter-label">Isian</span>
                <div class="asesmen-counter-controls">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahIsian" data-dir="-1">−</button>
                  <input type="number" name="jumlahIsian" value="5" min="0" max="20" class="asesmen-counter-value">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahIsian" data-dir="1">+</button>
                </div>
              </div>
              <div class="asesmen-counter-item">
                <span class="asesmen-counter-label">Essay</span>
                <div class="asesmen-counter-controls">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahUraian" data-dir="-1">−</button>
                  <input type="number" name="jumlahUraian" value="2" min="0" max="10" class="asesmen-counter-value">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahUraian" data-dir="1">+</button>
                </div>
              </div>
            </div>

            <label class="asesmen-label">FORMAT ISIAN SINGKAT</label>
            <select name="isianType" class="asesmen-input">
              <option value="Standard">Standard (Daftar Pertanyaan)</option>
              <option value="Crossword">Teka-Teki Silang</option>
              <option value="Menjodohkan">Menjodohkan</option>
            </select>

            <label class="asesmen-label">KOMPLEKSITAS LEVEL KOGNITIF</label>
            <select name="hotsRatio" class="asesmen-input">
              <option value="30:40:30">Balanced (30% L1 : 40% L2 : 30% L3)</option>
              <option value="50:30:20">Dasar / Pemahaman (50% L1 : 30% L2 : 20% L3)</option>
              <option value="20:30:50">Tinggi / Penalaran (20% L1 : 30% L2 : 50% L3)</option>
            </select>

            <label class="asesmen-label">AI NEURAL ENGINE</label>
            <select name="aiProvider" class="asesmen-input">
              <option value="bedrock-deepseek">🚀 AWS Bedrock (DeepSeek 3.2)</option>
              <option value="bedrock" selected>AWS Bedrock (Claude Sonnet 4.6)</option>
              <option value="vertex">⚡ Vertex AI</option>
              <option value="gemini">✨ Gemini 2.0 (Gratis)</option>
              <option value="mistral">Mistral Medium</option>
              <option value="z_ai">GLM-4.7</option>
            </select>
            <!-- Streaming Mode Toggle Switch -->
            <div class="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-500/30">
              <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none" title="Aktifkan untuk memantau proses berpikir & naskah soal AI secara realtime">
                <input type="checkbox" id="toggle-kisi-stream" class="rounded accent-cyan-600 w-4 h-4 cursor-pointer">
                <span><i class="fas fa-satellite-dish text-cyan-600 dark:text-cyan-400 mr-1 animate-pulse"></i>Live AI Streaming Monitor</span>
              </label>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">Live</span>
            </div>
            <!-- Stimulus Gambar / Visual Mode Toggle Switch -->
            <div class="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-500/30">
              <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none" title="Sertakan stimulus visual/diagram pada butir soal yang relevan (misal IPA/Matematika). Matikan jika ingin soal berbasis teks/wacana murni.">
                <input type="checkbox" id="toggle-kisi-gambar" class="rounded accent-indigo-600 w-4 h-4 cursor-pointer" checked>
                <span><i class="fas fa-images text-indigo-600 dark:text-indigo-400 mr-1"></i>Stimulus Gambar & Diagram</span>
              </label>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">Otomatis</span>
            </div>
          </div>
          </div>

          <div class="asesmen-action-center">
            <button type="submit" class="asesmen-generate-btn">
              <i class="fas fa-magic"></i> GENERATE ASESMEN SEKARANG
            </button>
          </div>
        </form>
      </div>

      <!-- RESULT VIEW (Hidden by default) -->
      <div id="asesmen-result-view" class="hidden">
        <div class="asesmen-result-toolbar flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
          <div class="flex items-center gap-2 flex-wrap justify-between xl:justify-start">
            <button id="btn-back-form" class="px-4 py-2 rounded-full text-xs font-semibold border border-[var(--color-border-subtle)] bg-white dark:bg-slate-800 text-[var(--color-text-secondary)] hover:bg-[#f8f9fa] hover:text-[#111111] transition-colors cursor-pointer flex items-center gap-1.5"><i class="fas fa-arrow-left"></i> Form</button>

            <!-- View Switcher Tabs -->
            <div class="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-inner print:hidden" id="kisi-view-tabs">
              <button type="button" class="kisi-tab-btn active px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-sm" data-tab="soal">
                <i class="fas fa-file-alt mr-1"></i>Naskah Soal
              </button>
              <button type="button" class="kisi-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:text-cyan-600" data-tab="kisi">
                <i class="fas fa-th-list mr-1 text-teal-600"></i>Kisi-Kisi
              </button>
              <button type="button" class="kisi-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:text-cyan-600" data-tab="kunci">
                <i class="fas fa-key mr-1 text-amber-500"></i>Kunci & Rubrik
              </button>
              <button type="button" class="kisi-tab-btn px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:text-cyan-600" data-tab="all">
                <i class="fas fa-layer-group mr-1 text-indigo-500"></i>Paket Lengkap
              </button>
            </div>
          </div>

          <div class="flex gap-2 sm:gap-2.5 flex-wrap justify-end">
            <button id="btn-toggle-edit-mode" class="px-3.5 py-2 rounded-full text-xs font-semibold border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"><i class="fas fa-pencil-alt text-blue-500"></i>Edit: <span id="edit-mode-status" class="font-bold text-emerald-600">Aktif</span></button>
            <button id="btn-kisi-history" class="px-3.5 py-2 rounded-full text-xs font-semibold border border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 transition-colors cursor-pointer"><i class="fas fa-folder-open mr-1 text-amber-500"></i>Riwayat</button>
            <button id="btn-download-doc" class="px-4 py-2 rounded-full text-xs font-bold border border-[#10b981]/20 bg-[#f8f9fa] text-[#10b981] hover:bg-[#10b981] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"><i class="fas fa-download"></i>Unduh .docx</button>
            <button id="btn-print" class="px-4 py-2 bg-[#111111] text-white rounded-full font-bold text-xs shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-1.5"><i class="fas fa-print"></i>Cetak / PDF</button>
          </div>
        </div>

        <!-- Informative Live Edit Banner -->
        <div class="asesmen-edit-banner max-w-[210mm] mx-auto mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-500/20 text-[var(--color-text-primary)] flex items-center justify-between shadow-sm text-xs font-medium print:hidden">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <i class="fas fa-pencil-alt text-xs"></i>
            </div>
            <div>
              <span class="font-bold text-blue-600 dark:text-blue-400">Mode Live Edit Aktif:</span>
              <span class="text-slate-600 dark:text-slate-300 ml-1">Arahkan kursor mouse ke setiap butir soal di bawah untuk memunculkan tombol <b>Edit</b> & <b>Hapus</b>.</span>
            </div>
          </div>
          <div class="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg font-semibold border border-blue-200 dark:border-blue-800 hidden md:flex items-center gap-1.5">
            <i class="fas fa-check-circle text-emerald-500"></i> Otomatis update Word (.docx) & PDF
          </div>
        </div>

        <!-- A4 Canvas -->
        <div id="asesmen-canvas" class="asesmen-a4">
          <!-- Content will be rendered here -->
        </div>
      </div>
    </div>

    <style>
      .asesmen-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 32px;
        padding: 24px;
      }
      .asesmen-logo-mark {
        width: 56px; height: 56px;
        background: linear-gradient(135deg, #06b6d4, #8b5cf6);
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; color: white;
        box-shadow: 0 8px 32px rgba(6,182,212,0.3);
      }
      .asesmen-title {
        font-size: 28px; font-weight: 900;
        letter-spacing: 4px;
        background: linear-gradient(90deg, #06b6d4, #a78bfa);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        margin: 0;
      }
      .asesmen-subtitle {
        font-size: 11px; letter-spacing: 6px;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        margin: 4px 0 0;
      }
      .asesmen-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
      @media (max-width: 1024px) { .asesmen-grid { grid-template-columns: 1fr; } }
      .asesmen-card {
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 16px;
        padding: 24px;
      }
      .asesmen-card-title {
        font-size: 14px; font-weight: 700;
        letter-spacing: 2px; text-transform: uppercase;
        margin: 0 0 20px;
        display: flex; align-items: center; gap: 10px;
        color: var(--color-text-primary);
      }
      .asesmen-card-title i { color: #06b6d4; }
      .asesmen-label {
        display: block;
        font-size: 10px; font-weight: 600;
        letter-spacing: 1.5px; text-transform: uppercase;
        color: var(--color-text-secondary);
        margin: 16px 0 6px;
      }
      .asesmen-input {
        width: 100%; padding: 10px 14px;
        background: var(--color-bg-tertiary);
        border: 1px solid transparent;
        border-radius: 10px;
        color: var(--color-text-primary);
        font-size: 14px;
        transition: border-color 0.2s;
      }
      .asesmen-input:focus { border-color: #06b6d4; outline: none; }
      .asesmen-textarea { resize: vertical; min-height: 80px; font-family: inherit; }
      .asesmen-row { display: flex; gap: 12px; }
      .asesmen-col { flex: 1; }

      /* Counter Controls */
      .asesmen-counter-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        margin-bottom: 8px;
      }
      .asesmen-counter-item { text-align: center; }
      .asesmen-counter-label {
        display: block; font-size: 10px; font-weight: 600;
        letter-spacing: 1px; text-transform: uppercase;
        color: var(--color-text-secondary); margin-bottom: 8px;
      }
      .asesmen-counter-controls {
        display: flex; align-items: center; justify-content: center;
        background: var(--color-bg-tertiary); border-radius: 10px;
        overflow: hidden;
      }
      .asesmen-counter-btn {
        width: 36px; height: 36px;
        background: transparent; border: none;
        color: var(--color-text-primary); font-size: 18px;
        cursor: pointer; transition: background 0.15s;
      }
      .asesmen-counter-btn:hover { background: var(--color-bg-primary); }
      .asesmen-counter-value {
        width: 48px; text-align: center;
        background: transparent; border: none;
        color: var(--color-text-primary);
        font-size: 18px; font-weight: 700;
        -moz-appearance: textfield;
      }
      .asesmen-counter-value::-webkit-outer-spin-button,
      .asesmen-counter-value::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      /* AI Engine Selection */
      .asesmen-ai-engines {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        margin-bottom: 12px;
      }
      .asesmen-engine-option {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 14px;
        background: var(--color-bg-tertiary);
        border: 1px solid transparent;
        border-radius: 10px;
        font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all 0.2s;
        color: var(--color-text-primary);
      }
      .asesmen-engine-option:has(input:checked) {
        border-color: #06b6d4;
        background: rgba(6,182,212,0.1);
      }
      .asesmen-engine-option input[type="radio"] { accent-color: #06b6d4; }
      .asesmen-engine-highlight {
        grid-column: span 2;
        background: linear-gradient(90deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15));
        border: 1px solid rgba(6,182,212,0.3);
      }

      /* Generate Button */
      .asesmen-action-center {
        text-align: center;
        margin-top: 28px;
        margin-bottom: 28px;
      }
      .asesmen-generate-btn {
        padding: 14px 56px;
        background: linear-gradient(135deg, #3ab8b8, #269494);
        color: white; border: none;
        border-radius: 14px;
        font-size: 15px; font-weight: 800;
        letter-spacing: 1px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 8px 32px rgba(38, 148, 148, 0.3);
      }
      .asesmen-generate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(38, 148, 148, 0.45);
      }

      /* Result View */
      .asesmen-result-toolbar {
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 12px;
        padding: 16px 24px; margin-bottom: 24px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 12px;
        position: sticky; top: 16px; z-index: 50;
      }

      .asesmen-a4 {
        max-width: 21cm;
        margin: 0 auto 40px auto;
        background: #ffffff;
        color: #0f172a;
        padding: 1.8cm 2cm;
        font-family: 'Times New Roman', 'Noto Sans Sundanese', Times, serif;
        font-size: 11pt;
        line-height: 1.45;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        border-radius: 4px;
        min-height: 29.7cm;
        box-sizing: border-box;
      }
      .asesmen-a4 table { border-collapse: collapse; }
      .asesmen-a4 .main-table { width: 100%; border-collapse: collapse; }
      .asesmen-a4 .main-table td, .asesmen-a4 .main-table th { padding: 4px 6px; }
      
      .soal-item-wrapper {
        position: relative;
        margin-bottom: 14px;
        padding: 6px 10px;
        border-radius: 10px;
        border: 1.5px solid transparent;
        transition: all 0.2s ease;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .soal-item-wrapper:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      }
      .soal-item-row {
        margin-bottom: 0;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .soal-text {
        text-align: justify;
        line-height: 1.45;
        margin-bottom: 6px;
        padding-right: 90px;
      }
      .soal-options-table {
        width: 100%;
        margin-top: 5px;
        border-collapse: collapse;
      }
      .soal-options-table td {
        vertical-align: top;
        line-height: 1.35;
      }
      .soal-actions {
        position: absolute;
        top: 4px;
        right: -32px;
        display: flex;
        gap: 6px;
        opacity: 0.88;
        transition: all 0.2s ease;
        z-index: 30;
      }
      .soal-item-wrapper:hover .soal-actions {
        opacity: 1;
        transform: scale(1.03);
      }
      #asesmen-canvas.preview-only .soal-actions {
        display: none !important;
      }
      #asesmen-canvas.preview-only .soal-item-wrapper:hover {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }
      .soal-actions button {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid transparent;
        line-height: 1;
      }
      .soal-actions .btn-edit-soal {
        background: #2563eb;
        color: #ffffff;
        border-color: #1d4ed8;
      }
      .soal-actions .btn-edit-soal:hover {
        background: #1d4ed8;
        transform: scale(1.03);
      }
      .soal-actions .btn-delete-soal {
        background: #fee2e2;
        color: #dc2626;
        border-color: #fca5a5;
        padding: 4px 8px;
      }
      .soal-actions .btn-delete-soal:hover {
        background: #dc2626;
        color: #ffffff;
        border-color: #dc2626;
        transform: scale(1.03);
      }
      .soal-editor-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
      }
      .soal-editor-modal {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        width: 90%;
        max-width: 600px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 28px;
        animation: soalEditorIn 0.2s ease-out;
      }
      @keyframes soalEditorIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .soal-editor-modal h3 {
        font-size: 16px;
        font-weight: 700;
        margin: 0 0 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .soal-editor-modal label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .soal-editor-modal textarea,
      .soal-editor-modal input[type="text"],
      .soal-editor-modal select {
        width: 100%;
        padding: 10px 12px;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        font-size: 13px;
        font-family: inherit;
        margin-bottom: 12px;
        transition: border-color 0.15s;
        box-sizing: border-box;
      }
      .soal-editor-modal textarea:focus,
      .soal-editor-modal input[type="text"]:focus,
      .soal-editor-modal select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
      }
      .soal-editor-modal textarea {
        resize: vertical;
        min-height: 80px;
      }
      .soal-editor-modal .editor-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 8px;
      }
      .soal-editor-modal .editor-actions button {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.15s;
      }
      .soal-editor-modal .btn-editor-cancel {
        background: #f1f5f9;
        color: #475569;
      }
      .soal-editor-modal .btn-editor-cancel:hover {
        background: #e2e8f0;
      }
      .soal-editor-modal .btn-editor-save {
        background: #2563eb;
        color: #fff;
      }
      .soal-editor-modal .btn-editor-save:hover {
        background: #1d4ed8;
      }
      .section-title {
        margin-top: 22px;
        margin-bottom: 8px;
        page-break-after: avoid;
        break-after: avoid;
      }
      .section-title h4 {
        font-weight: bold;
        font-size: 11.5pt;
        margin: 0 0 3px 0;
      }
      .section-title p {
        font-size: 9.5pt;
        font-style: italic;
        margin: 0;
        color: #475569;
      }
      .kunci-page-break {
        page-break-before: always;
        break-before: page;
        margin-top: 30px;
        padding-top: 10px;
      }
      .kisi-page-break {
        page-break-before: always;
        break-before: page;
        margin-top: 30px;
        padding-top: 10px;
      }

      /* View Mode Tab Filtering */
      #asesmen-canvas.view-tab-soal #section-kisi-view,
      #asesmen-canvas.view-tab-soal #section-kunci-view {
        display: none !important;
      }
      #asesmen-canvas.view-tab-kisi #section-soal-view,
      #asesmen-canvas.view-tab-kisi #section-kunci-view {
        display: none !important;
      }
      #asesmen-canvas.view-tab-kunci #section-soal-view,
      #asesmen-canvas.view-tab-kunci #section-kisi-view {
        display: none !important;
      }
      #asesmen-canvas.view-tab-all #section-soal-view,
      #asesmen-canvas.view-tab-all #section-kunci-view,
      #asesmen-canvas.view-tab-all #section-kisi-view {
        display: block !important;
      }

      /* Level badges in matrix table */
      .badge-level-l1 {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 4px;
        font-weight: 800;
        font-size: 8.5pt;
        background: #ecfdf5;
        color: #047857;
        border: 1px solid #a7f3d0;
      }
      .badge-level-l2 {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 4px;
        font-weight: 800;
        font-size: 8.5pt;
        background: #fef3c7;
        color: #b45309;
        border: 1px solid #fde68a;
      }
      .badge-level-l3 {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 4px;
        font-weight: 800;
        font-size: 8.5pt;
        background: #f5f3ff;
        color: #6d28d9;
        border: 1px solid #ddd6fe;
      }

      /* Image container & Graceful load failure handling */
      .soal-image-container.image-load-failed {
        border: 1px dashed #f59e0b !important;
        background: #fffbeb !important;
        padding: 6px 10px !important;
      }
      .soal-image-container.image-load-failed img,
      .soal-image-container.image-load-failed .image-credit-badge,
      .soal-image-container.image-load-failed .image-hover-actions {
        display: none !important;
      }
      .soal-image-container.image-load-failed .image-failed-alert {
        display: flex !important;
      }

      @page {
        size: A4 portrait;
        margin: 1.5cm 1.8cm 1.5cm 1.8cm;
      }

      @media print {
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: 'Times New Roman', 'Noto Sans Sundanese', Times, serif !important;
        }
        .soal-image-container.image-load-failed {
          display: none !important;
        }
        #asesmen-form-view,
        .asesmen-result-toolbar,
        .asesmen-edit-banner,
        .sidebar,
        .app-header,
        .btn-remove-soal-image,
        .soal-actions,
        .soal-editor-overlay,
        #btn-launch-tts-game,
        .print-hidden,
        nav,
        header {
          display: none !important;
        }
        #asesmen-result-view {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .asesmen-a4 {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          font-size: 10.5pt !important;
          line-height: 1.4 !important;
        }
        .soal-item-wrapper {
          margin-bottom: 12px !important;
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .soal-item-row {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0 !important;
        }
        .soal-text {
          padding-right: 0 !important;
        }
        .section-title {
          page-break-after: avoid !important;
          break-after: avoid !important;
          margin-top: 16px !important;
          margin-bottom: 6px !important;
        }
        .kunci-page-break {
          page-break-before: always !important;
          break-before: page !important;
        }
        .kisi-page-break {
          page-break-before: always !important;
          break-before: page !important;
        }

        #asesmen-canvas.view-tab-soal #section-kisi-view,
        #asesmen-canvas.view-tab-soal #section-kunci-view {
          display: none !important;
        }
        #asesmen-canvas.view-tab-kisi #section-soal-view,
        #asesmen-canvas.view-tab-kisi #section-kunci-view {
          display: none !important;
        }
        #asesmen-canvas.view-tab-kunci #section-soal-view,
        #asesmen-canvas.view-tab-kunci #section-kisi-view {
          display: none !important;
        }
        #asesmen-canvas.view-tab-all #section-soal-view,
        #asesmen-canvas.view-tab-all #section-kunci-view,
        #asesmen-canvas.view-tab-all #section-kisi-view {
          display: block !important;
        }
      }
    </style>
  `;
}

// Module-level: simpan formData dan raw data terakhir
let _lastFormData = {};
let _lastGeneratedData = {};
let _currentActiveTab = 'soal';

// Helper: pastikan setiap butir soal memiliki metadata kisi-kisi (CP, Materi, Indikator, Level L1/L2/L3, Bentuk)
function ensureClientKisiMetadata(data, formData = {}) {
  if (!data) return;
  const fallbackCP = (formData.capaianPembelajaran && String(formData.capaianPembelajaran).trim()) || 
                     `Peserta didik dapat memahami dan menerapkan konsep dasar ${formData.topik || 'materi pembelajaran'}.`;
  const fallbackMateri = (formData.topik && String(formData.topik).trim()) || 'Materi Pokok';

  const normalizeLevel = (raw) => {
    const s = String(raw || '').toUpperCase();
    if (s.includes('L3') || s.includes('HOTS') || s.includes('C4') || s.includes('C5') || s.includes('C6')) return 'L3';
    if (s.includes('L2') || s.includes('MOTS') || s.includes('C3')) return 'L2';
    return 'L1';
  };

  if (data.pg && Array.isArray(data.pg)) {
    data.pg.forEach((q, idx) => {
      q.no = q.no || (idx + 1);
      q.cp = (q.cp && String(q.cp).trim()) || fallbackCP;
      q.materi = (q.materi && String(q.materi).trim()) || fallbackMateri;
      if (!q.indikator || !String(q.indikator).trim()) {
        q.indikator = `Disajikan pertanyaan mengenai ${q.materi}, peserta didik dapat menentukan jawaban yang tepat.`;
      }
      q.level = normalizeLevel(q.level);
      q.bentuk = q.bentuk || 'Pilihan Ganda';
    });
  }

  if (data.isian?.data && Array.isArray(data.isian.data)) {
    const isianType = data.isian.type || formData.isianType || 'Standard';
    const isianBentuk = isianType === 'Crossword' ? 'Teka-Teki Silang' : isianType === 'Menjodohkan' ? 'Menjodohkan' : 'Isian Singkat';
    data.isian.data.forEach((q, idx) => {
      q.no = q.no || ((data.pg?.length || 0) + idx + 1);
      q.cp = (q.cp && String(q.cp).trim()) || fallbackCP;
      q.materi = (q.materi && String(q.materi).trim()) || fallbackMateri;
      if (!q.indikator || !String(q.indikator).trim()) {
        q.indikator = `Disajikan stimulus mengenai ${q.materi}, peserta didik dapat melengkapi pernyataan dengan tepat.`;
      }
      q.level = normalizeLevel(q.level);
      q.bentuk = q.bentuk || isianBentuk;
    });
  }

  if (data.uraian && Array.isArray(data.uraian)) {
    data.uraian.forEach((q, idx) => {
      const maxIsian = data.isian?.data?.length ? Math.max(...data.isian.data.map(x => x.no || 0)) : (data.pg?.length || 0);
      q.no = q.no || (maxIsian + idx + 1);
      q.cp = (q.cp && String(q.cp).trim()) || fallbackCP;
      q.materi = (q.materi && String(q.materi).trim()) || fallbackMateri;
      if (!q.indikator || !String(q.indikator).trim()) {
        q.indikator = `Disajikan masalah/wacana mengenai ${q.materi}, peserta didik dapat menganalisis dan menyajikan pemecahan yang logis.`;
      }
      q.level = normalizeLevel(q.level || 'L3');
      q.bentuk = q.bentuk || 'Uraian';
    });
  }
}

// Helper: deteksi apakah teks mengandung karakter Aksara Sunda (Unicode blok U+1B80–U+1BBF)
function containsSundaneseScript(text) {
  if (!text) return false;
  return /[\u1B80-\u1BBF\u1CC0-\u1CCF]/.test(text);
}

// Helper: bersihkan segala artefak sisa prompt, visual_stimulus, gambar_keyword dari naskah soal
function cleanPromptDebris(text) {
  if (!text) return '';
  let s = String(text);

  // 1. Hapus tag kurung siku prompt: [gambar: ...], [visual_stimulus: ...], [diagram: ...], dsb.
  s = s.replace(/\[(?:visual_stimulus|stimulus|visual|gambar|foto|diagram|ilustrasi|deskripsi|keterangan)[^\]]*\]/gi, '');
  s = s.replace(/\[[^\]]*\]/g, '');

  // 2. Hapus blok visual_stimulus { ... } (dengan balanced brace counting untuk mendukung nested object/array)
  let safetyCounter = 0;
  while (safetyCounter++ < 20) {
    const match = s.match(/visual_stimulus\s*:?\s*\{/i);
    if (!match || match.index === undefined) break;

    const startIdx = match.index;
    const braceStart = s.indexOf('{', startIdx);
    let depth = 0;
    let endIdx = -1;

    for (let i = braceStart; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      let pre = s.substring(0, startIdx);
      let post = s.substring(endIdx + 1);
      if (pre.endsWith('\n') && post.startsWith('\n')) {
        post = post.substring(1);
      }
      s = pre + post;
    } else {
      const newlineIdx = s.indexOf('\n', startIdx);
      if (newlineIdx !== -1) {
        s = s.substring(0, startIdx) + s.substring(newlineIdx);
      } else {
        s = s.substring(0, startIdx);
      }
      break;
    }
  }

  // 3. Hapus objek JSON stimulus mandiri yang bocor di naskah soal (misal {"type": "sudut", "params": {...}})
  safetyCounter = 0;
  while (safetyCounter++ < 20) {
    const match = s.match(/\{\s*"type"\s*:\s*"[a-zA-Z0-9_-]+"/i);
    if (!match || match.index === undefined) break;

    const startIdx = match.index;
    let depth = 0;
    let endIdx = -1;

    for (let i = startIdx; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      let pre = s.substring(0, startIdx);
      let post = s.substring(endIdx + 1);
      if (pre.endsWith('\n') && post.startsWith('\n')) {
        post = post.substring(1);
      }
      s = pre + post;
    } else {
      break;
    }
  }

  // 4. Bersihkan sisa-sisa keyword prompt baris tunggal
  s = s.replace(/^[ \t]*visual_stimulus\s*:?[^\n\r]*\r?\n?/gim, '');
  s = s.replace(/visual_stimulus\s*:[^\n\r]*/gi, '');
  s = s.replace(/^[ \t]*gambar_keyword\s*:?[^\n\r]*\r?\n?/gim, '');
  s = s.replace(/gambar_keyword\s*:[^\n\r]*/gi, '');
  s = s.replace(/^[ \t]*gambar_prompt_en\s*:?[^\n\r]*\r?\n?/gim, '');
  s = s.replace(/gambar_prompt_en\s*:[^\n\r]*/gi, '');

  // 5. Bersihkan spasi horizontal berlebih dan baris kosong berlebih
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

  return s;
}

// Helper: normalisasi teks soal agar tabel (Markdown, tabel titik dua, maupun spasi tabular) terformat rapi
function normalizeSoalMarkdown(text) {
  if (!text) return '';
  let clean = cleanPromptDebris(text);

  // 1. Pisahkan baris-baris tabel yang tergabung dalam satu baris (| ... | | ... |)
  clean = clean.replace(/(?<=\|)\s{1,4}(?=\|)/g, '\n');

  const rawLines = clean.split(/\r?\n/);
  const normalizedLines = [];

  // 2. Pre-process baris tabel berpola titik dua (misal: 'Hari : Senin | Selasa | ...')
  for (let rawLine of rawLines) {
    let line = rawLine.trim();
    if (!line) continue;

    if (line.includes('|')) {
      const firstPipe = line.indexOf('|');
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1 && colonIdx < firstPipe) {
        line = line.replace(/\s*:\s*/, ' | ');
      }
      if (!line.startsWith('|')) line = '| ' + line;
      if (!line.endsWith('|')) line = line + ' |';
      normalizedLines.push(line);
    } else {
      normalizedLines.push(line);
    }
  }

  // 3. Pre-process baris tabel tanpa pipa yang dipisahkan oleh tab atau 2+ spasi (tabular)
  const outLines = [];
  let spaceTableCandidates = [];

  function flushSpaceCandidates() {
    if (spaceTableCandidates.length >= 2) {
      const colCounts = spaceTableCandidates.map(r => r.length);
      const firstCol = colCounts[0];
      const isConsistent = colCounts.every(c => c === firstCol && c >= 2);
      if (isConsistent) {
        outLines.push('| ' + spaceTableCandidates[0].join(' | ') + ' |');
        outLines.push('| ' + spaceTableCandidates[0].map(() => '---').join(' | ') + ' |');
        for (let k = 1; k < spaceTableCandidates.length; k++) {
          outLines.push('| ' + spaceTableCandidates[k].join(' | ') + ' |');
        }
        spaceTableCandidates = [];
        return;
      }
    }
    for (const raw of spaceTableCandidates) {
      outLines.push(raw.join('    '));
    }
    spaceTableCandidates = [];
  }

  for (let line of normalizedLines) {
    if (line.startsWith('|')) {
      flushSpaceCandidates();
      outLines.push(line);
      continue;
    }

    const cells = line.split(/\t|\s{2,}/).map(c => c.trim()).filter(Boolean);
    const isSentence = /[.?!]$/.test(line) || /^\d+\.\s/.test(line) || cells.length < 2 || line.length > 140;

    if (!isSentence && cells.length >= 2) {
      spaceTableCandidates.push(cells);
    } else {
      flushSpaceCandidates();
      outLines.push(line);
    }
  }
  flushSpaceCandidates();

  return outLines.join('\n');
}

// Helper: format teks soal dan render Markdown table secara rapi dan proporsional
function formatSoalText(text) {
  if (!text) return '';
  const normalizedText = normalizeSoalMarkdown(text);
  const lines = normalizedText.split('\n');
  const resultBlocks = [];
  let tableLines = [];

  const isTableDivider = (line) => {
    const trimmed = line.trim();
    return /^[:\s\-|]+$/.test(trimmed) && trimmed.includes('-') && (trimmed.includes('|') || trimmed.includes('+'));
  };

  const isPossibleTableRow = (line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && (trimmed.includes('|') || isTableDivider(trimmed));
  };

  const parseTableRow = (line) => {
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.substring(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1);
    return trimmed.split('|').map(c => c.trim());
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const hasDivider = tableLines.some(l => isTableDivider(l));
    if (!hasDivider && tableLines.length < 2) {
      for (const rawLine of tableLines) {
        if (rawLine.trim().length > 0) {
          resultBlocks.push(`<div style="line-height:1.45; margin-bottom:4px;">${escapeHtml(rawLine)}</div>`);
        }
      }
      tableLines = [];
      return;
    }

    const rows = tableLines
      .filter(l => !isTableDivider(l))
      .map(parseTableRow)
      .filter(row => row.length > 0);

    if (rows.length > 0) {
      const header = rows[0];
      const dataRows = rows.slice(1);
      const colCount = Math.max(...rows.map(r => r.length));
      const fontSize = colCount >= 6 ? '9pt' : '10pt';
      const cellPad = colCount >= 6 ? '4px 8px' : '5px 12px';

      let tableHtml = `<div class="soal-table-container" style="margin: 8px 0 12px 0; padding: 0; clear: both; overflow-x: auto;"><table class="soal-inner-table" style="border-collapse: collapse; border: 1.5px solid #334155; font-size: ${fontSize}; width: auto; min-width: 260px; max-width: 100%; margin: 0;">`;
      tableHtml += `<thead style="background-color: #f1f5f9; font-weight: bold;"><tr>`;
      header.forEach(h => {
        tableHtml += `<th style="border: 1px solid #475569; padding: ${cellPad}; text-align: center; vertical-align: middle;">${escapeHtml(h)}</th>`;
      });
      tableHtml += `</tr></thead><tbody>`;
      dataRows.forEach((r, rIdx) => {
        const bg = rIdx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
        tableHtml += `<tr style="${bg}">`;
        r.forEach((c, idx) => {
          const isNum = /^\d+([.,]\d+)?\s*(°C|%|cm|m|kg|g|km|menit|detik|jam|Rp)?$/i.test(c) || (idx === 0 && /^\d+$/.test(c));
          tableHtml += `<td style="border: 1px solid #475569; padding: ${cellPad}; text-align: ${isNum ? 'center' : 'left'}; vertical-align: middle;">${escapeHtml(c)}</td>`;
        });
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table></div>`;
      resultBlocks.push(tableHtml);
    }
    tableLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (isPossibleTableRow(trimmed)) {
      tableLines.push(trimmed);
    } else {
      flushTable();
      if (trimmed.length > 0) {
        resultBlocks.push(`<div style="line-height:1.45; margin-bottom:4px;">${escapeHtml(line)}</div>`);
      }
    }
  }
  flushTable();

  return resultBlocks.join('');
}

// Helper: cek seluruh canvas HTML apakah ada Aksara Sunda
function hasSundaneseInCanvas(canvasEl) {
  return containsSundaneseScript(canvasEl?.textContent || '');
}

export function initKisi() {
  const form = document.getElementById('asesmen-form');
  if (!form) return;

  populateAiModelSelect('select[name="aiProvider"]');

  // Check incoming Smart Content Bridge data from RPP
  try {
    const rawBridge = sessionStorage.getItem('kkg_bridge_data');
    if (rawBridge) {
      const bridge = JSON.parse(rawBridge);
      if (bridge.target === 'kisi' && bridge.topik) {
        sessionStorage.removeItem('kkg_bridge_data');

        const setVal = (name, val) => {
          const el = form.querySelector(`[name="${name}"]`);
          if (el && val) el.value = val;
        };

        if (bridge.mataPelajaran) {
          const selectMapel = form.querySelector('select[name="mataPelajaran"]');
          if (selectMapel) {
            const opts = Array.from(selectMapel.options);
            const matched = opts.find(o => 
              o.value.toLowerCase().includes(bridge.mataPelajaran.toLowerCase()) || 
              bridge.mataPelajaran.toLowerCase().includes(o.value.toLowerCase())
            );
            if (matched) selectMapel.value = matched.value;
          }
        }

        if (bridge.jenjangKelas) {
          const selectKelas = form.querySelector('select[name="jenjangKelas"]');
          if (selectKelas) {
            const num = bridge.jenjangKelas.match(/\d+/);
            if (num) {
              const matched = Array.from(selectKelas.options).find(o => o.value.includes(num[0]));
              if (matched) selectKelas.value = matched.value;
            }
          }
        }

        if (bridge.semester) {
          const selectSmt = form.querySelector('select[name="semester"]');
          if (selectSmt) {
            const isGanjil = bridge.semester.toLowerCase().includes('ganjil') || bridge.semester === '1';
            selectSmt.value = isGanjil ? 'Ganjil' : 'Genap';
          }
        }

        if (bridge.topik) {
          setVal('topik', bridge.topik);
        }

        if (bridge.capaian) {
          setVal('capaianPembelajaran', bridge.capaian);
        }

        const topikEl = form.querySelector('[name="topik"]');
        if (topikEl) topikEl.focus();

        showToast(`✨ Materi dari RPP (${bridge.topik}) berhasil disinkronkan ke Asesmen & Soal!`, 'success');
      }
    }
  } catch (_) {}

  // Counter buttons
  document.querySelectorAll('.asesmen-counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const dir = parseInt(btn.dataset.dir);
      const input = document.querySelector(`input[name="${field}"]`);
      if (!input) return;
      let val = parseInt(input.value) + dir;
      val = Math.max(parseInt(input.min) || 0, Math.min(parseInt(input.max) || 50, val));
      input.value = val;
    });
  });

  // Listener Muat CP Resmi BSKAP No. 046 Tahun 2025
  document.getElementById('btn-auto-cp')?.addEventListener('click', async () => {
    const mapel = form.querySelector('select[name="mataPelajaran"]')?.value;
    const kelas = form.querySelector('select[name="jenjangKelas"]')?.value;

    if (!mapel || !kelas) {
      showToast('Pilih Mata Pelajaran dan Jenjang Kelas terlebih dahulu!', 'warning');
      return;
    }

    const btn = document.getElementById('btn-auto-cp');
    const oldHtml = btn.innerHTML;
    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Memuat...';
      const resp = await api(`/kisi/cp-reference?mataPelajaran=${encodeURIComponent(mapel)}&jenjangKelas=${encodeURIComponent(kelas)}`);
      const cpVal = resp?.data?.cp;
      if (cpVal) {
        const cpInput = document.getElementById('input-cp-text');
        if (cpInput) {
          cpInput.value = cpVal;
          cpInput.focus();
        }
        showToast(`CP resmi ${resp.data.fase} (BSKAP No. 046/2025) berhasil dimuat!`, 'success');
      } else {
        showToast('Rumusan CP resmi belum tersedia untuk kombinasi ini. AI akan memformulasikannya otomatis.', 'info');
      }
    } catch (e) {
      console.error('Failed to load CP reference:', e);
      showToast('Gagal memuat referensi CP: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  });

  // Synchronize AI Streaming Mode toggle preference
  const toggleStreamEl = document.getElementById('toggle-kisi-stream');
  if (toggleStreamEl) {
    const isStreamOn = localStorage.getItem('kkg_ai_streaming_mode') !== 'false';
    toggleStreamEl.checked = isStreamOn;
    toggleStreamEl.addEventListener('change', () => {
      localStorage.setItem('kkg_ai_streaming_mode', toggleStreamEl.checked ? 'true' : 'false');
      showToast(toggleStreamEl.checked ? '📡 Mode Streaming AI Aktif: Proses berpikir AI akan terpantau realtime.' : 'Mode Streaming AI Dinonaktifkan.', 'info');
    });
  }

  // Synchronize Stimulus Gambar toggle preference
  const toggleGambarEl = document.getElementById('toggle-kisi-gambar');
  if (toggleGambarEl) {
    const isGambarOn = localStorage.getItem('kkg_kisi_use_gambar') !== 'false';
    toggleGambarEl.checked = isGambarOn;
    toggleGambarEl.addEventListener('change', () => {
      localStorage.setItem('kkg_kisi_use_gambar', toggleGambarEl.checked ? 'true' : 'false');
      showToast(toggleGambarEl.checked ? '🖼️ Stimulus Gambar & Diagram diaktifkan untuk materi yang relevan.' : '📝 Mode Teks Penuh diaktifkan: Soal akan menggunakan stimulus teks/wacana tanpa gambar.', 'info');
    });
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const toggleGambarInput = document.getElementById('toggle-kisi-gambar');
    data.useGambar = toggleGambarInput ? toggleGambarInput.checked : (localStorage.getItem('kkg_kisi_use_gambar') !== 'false');

    if (!data.topik || !data.topik.trim()) {
      showToast('Harap masukkan Topik/Materi terlebih dahulu.', 'error');
      return;
    }

    const isStreaming = localStorage.getItem('kkg_ai_streaming_mode') !== 'false';

    if (isStreaming) {
      const monitor = openAiLiveMonitor({
        title: 'Asesmen Neural Architect',
        subtitle: `Menyusun soal ${data.mataPelajaran || ''} (${data.jenjangKelas || 'SD'}) - "${data.topik}"`,
        modelName: data.aiProvider || 'AI Engine',
        steps: [
          { id: 1, label: 'CP 2025', icon: 'fa-book-open' },
          { id: 2, label: 'Naskah PG', icon: 'fa-list-ol' },
          { id: 3, label: 'Isian & Uraian', icon: 'fa-pen-fancy' },
          { id: 4, label: 'Matriks Kisi', icon: 'fa-table-cells' },
          { id: 5, label: 'Finalisasi', icon: 'fa-wand-magic-sparkles' }
        ]
      });

      let finalResultData = null;

      try {
        await streamPost('/kisi/generate-stream', data, (event, payload) => {
          if (event === 'step') {
            monitor.updateStep(payload.step, payload.title, payload.message, payload.percent);
          } else if (event === 'token') {
            monitor.appendToken(payload.text);
          } else if (event === 'done') {
            finalResultData = payload.data;
          } else if (event === 'error') {
            const msg = (typeof payload === 'object' && payload !== null)
              ? (payload.message || payload.error || JSON.stringify(payload))
              : String(payload);
            throw new Error(msg || 'Gagal generate stream');
          }
        });

        if (finalResultData) {
          monitor.complete(() => {
            renderResult(finalResultData, data);
            const modelInfo = finalResultData?._meta?.model ? ` (${finalResultData._meta.model})` : '';

            saveDocArchive({
              module: 'kisi',
              title: `${data.mataPelajaran || 'Asesmen'} - ${data.topik || 'Topik'} (${data.jenjangKelas || 'SD'})`,
              subtitle: `${data.jenisUjian || 'Ulangan'} | ${data.semester || 'Smt 1'}`,
              inputData: data,
              content: finalResultData
            });

            // Auto-update badge Bank Soal Kolaboratif seketika
            loadBankSoalCountBadge();

            showToast(`Soal berhasil digenerate dan otomatis diarsipkan!${modelInfo}`, 'success');
          });
        } else {
          monitor.close();
          showToast('Gagal memuat hasil dari streaming AI.', 'error');
        }
      } catch (err) {
        console.error('Streaming Asesmen error:', err);
        monitor.close();
        showToast('Error Streaming: ' + err.message, 'error');
      }
    } else {
      // Non-streaming fallback with Smart Dynamic Loader
      showLoading('AI sedang membuat soal...', 'Menyusun naskah & kisi-kisi terstandar BSKAP 046/2025');

      try {
        const result = await api('/kisi/generate', {
          method: 'POST',
          body: data,
          timeout: 300000 // 5 menit untuk AI generation agar tidak timeout
        });

        if (result.success) {
          renderResult(result.data, data);
          const modelInfo = result.data?._meta?.model ? ` (${result.data._meta.model})` : '';

          // Auto-archive document
          saveDocArchive({
            module: 'kisi',
            title: `${data.mataPelajaran || 'Asesmen'} - ${data.topik || 'Topik'} (${data.jenjangKelas || 'SD'})`,
            subtitle: `${data.jenisUjian || 'Ulangan'} | ${data.semester || 'Smt 1'}`,
            inputData: data,
            content: result.data
          });

          // Auto-update badge Bank Soal Kolaboratif seketika
          loadBankSoalCountBadge();

          showToast(`Soal berhasil digenerate dan otomatis diarsipkan!${modelInfo}`, 'success');
        } else {
          showToast(result.error?.message || 'Gagal generate', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Error: ' + err.message, 'error');
      } finally {
        hideLoading();
      }
    }
  });

  // Archive Drawer Handler
  const handleOpenKisiArchive = () => {
    openArchiveDrawer({
      module: 'kisi',
      moduleName: 'Asesmen & Soal',
      onSelect: (item) => {
        renderResult(item.content, item.inputData);
        showToast(`Membuka riwayat: ${item.title}`, 'info');
      },
      onDownloadDocx: async (item) => {
        showToast('Menyiapkan file DOCX...', 'info');
        try {
          const origin = window.location.origin;
          const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;
          const blob = await generateAsesmenDocx(item.content, item.inputData, kopSuratUrl);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = `${item.inputData?.jenisUjian || 'Asesmen'}_${item.inputData?.jenjangKelas || ''}_${item.inputData?.mataPelajaran || 'Soal'}`
            .replace(/\s+/g, '_').replace(/_{2,}/g, '_');
          a.download = `${fileName}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('File .docx berhasil diunduh!', 'success');
        } catch (e) {
          showToast('Gagal mengunduh: ' + e.message, 'error');
        }
      }
    });
  };

  document.getElementById('btn-kisi-archive')?.addEventListener('click', handleOpenKisiArchive);
  document.getElementById('btn-kisi-history')?.addEventListener('click', handleOpenKisiArchive);

  // Bank Soal Kolaboratif Handler
  document.getElementById('btn-bank-soal')?.addEventListener('click', () => {
    openBankSoalDrawer();
    loadBankSoalCountBadge();
  });

  // Load bank soal count badge
  loadBankSoalCountBadge();

  // Back button — reset field konten agar bersih untuk asesmen berikutnya
  document.getElementById('btn-back-form')?.addEventListener('click', () => {
    document.getElementById('asesmen-form-view').classList.remove('hidden');
    document.getElementById('asesmen-result-view').classList.add('hidden');

    // Pastikan badge count Bank Soal Kolaboratif selalu ter-update seketika tanpa reload F5
    loadBankSoalCountBadge();

    const form = document.getElementById('asesmen-form');
    if (!form) return;

    // Reset field KONTEN (bersihkan untuk asesmen baru)
    const setVal = (name, val) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.value = val;
    };
    setVal('mataPelajaran', '');
    setVal('topik', '');
    setVal('capaianPembelajaran', '');

    // Reset jumlah soal ke default
    setVal('jumlahPG', '10');
    setVal('jumlahIsian', '5');
    setVal('jumlahUraian', '2');

    // Reset pilihan ke default
    setVal('isianType', 'Standard');
    setVal('hotsRatio', '30:40:30');
    setVal('jenisUjian', 'Ulangan Harian');
    // Hitung default kelas dari profil user
    const defaultKelas = `Kelas ${detectUserDefaultKelas(state.user)}`;
    setVal('jenjangKelas', defaultKelas);
    setVal('semester', 'Ganjil');

    // Ensure AI provider dropdown is populated and never becomes blank
    const providerSelect = form.querySelector('select[name="aiProvider"]');
    if (providerSelect) {
      populateAiModelSelect(providerSelect, providerSelect.value);
    }

    // Scroll ke atas form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Print
  document.getElementById('btn-print')?.addEventListener('click', () => window.print());

  // View Switcher Tabs (Naskah Soal, Matriks Kisi-Kisi, Kunci & Rubrik, Paket Lengkap)
  const applyTabSelection = (tabKey) => {
    _currentActiveTab = tabKey;
    const tabBtns = document.querySelectorAll('.kisi-tab-btn');
    tabBtns.forEach(btn => {
      const isTarget = btn.dataset.tab === tabKey;
      if (isTarget) {
        btn.classList.add('active', 'bg-white', 'dark:bg-slate-700', 'text-cyan-700', 'dark:text-cyan-300', 'shadow-sm');
        btn.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('active', 'bg-white', 'dark:bg-slate-700', 'text-cyan-700', 'dark:text-cyan-300', 'shadow-sm');
        btn.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    });

    const canvas = document.getElementById('asesmen-canvas');
    if (canvas) {
      canvas.classList.remove('view-tab-soal', 'view-tab-kisi', 'view-tab-kunci', 'view-tab-all');
      canvas.classList.add(`view-tab-${tabKey}`);
    }
  };

  document.querySelectorAll('.kisi-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTabSelection(btn.dataset.tab);
    });
  });

  // Toggle Edit Mode in Result View
  let _editModeActive = true;
  document.getElementById('btn-toggle-edit-mode')?.addEventListener('click', () => {
    _editModeActive = !_editModeActive;
    const canvas = document.getElementById('asesmen-canvas');
    const statusText = document.getElementById('edit-mode-status');
    if (_editModeActive) {
      canvas?.classList.remove('preview-only');
      if (statusText) {
        statusText.textContent = 'Aktif';
        statusText.className = 'font-bold text-emerald-600';
      }
      showToast('Mode Edit Aktif: Tombol edit muncul pada soal.', 'info');
    } else {
      canvas?.classList.add('preview-only');
      if (statusText) {
        statusText.textContent = 'Nonaktif';
        statusText.className = 'font-bold text-slate-500';
      }
      showToast('Mode Pratinjau Bersih: Tombol edit disembunyikan.', 'info');
    }
  });

  // Download .docx (ASLI - menggunakan docx.js)
  document.getElementById('btn-download-doc')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-doc');
    const fd  = _lastFormData || {};
    const data = _lastGeneratedData || {};

    if (!data.pg && !data.isian && !data.uraian) {
      showToast('Belum ada data soal untuk diunduh.', 'error');
      return;
    }

    try {
      // Nonaktifkan tombol saat proses
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyiapkan .docx...'; }

      const origin = window.location.origin;
      const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;

      const blob = await generateAsesmenDocx(data, fd, kopSuratUrl);

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      const fileName = `${fd.jenisUjian || 'Asesmen'}_${fd.jenjangKelas || ''}_${fd.mataPelajaran || 'Soal'}`
        .replace(/\s+/g, '_').replace(/_{2,}/g, '_');
      a.download = `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('File .docx berhasil diunduh!', 'success');
} catch (err) {
      console.error('DOCX generation error:', err);
      showToast('Gagal membuat file .docx: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download mr-2"></i>Unduh .docx'; }
    }
  });
}

function renderResult(data, formData) {
  // Simpan formData dan raw data ke module scope untuk download handler
  _lastFormData = formData;
  _lastGeneratedData = data;

  // Pastikan setiap butir soal memiliki metadata kisi-kisi terstandarisasi (CP, Materi, Indikator, Level L1/L2/L3, Bentuk)
  ensureClientKisiMetadata(data, formData);

  const isianType = data.isian?.type || formData.isianType || 'Standard';

  // Show result view, hide form
  document.getElementById('asesmen-form-view').classList.add('hidden');
  document.getElementById('asesmen-result-view').classList.remove('hidden');

  const canvas = document.getElementById('asesmen-canvas');

  const origin = window.location.origin;
  const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;
  const activeTA = escapeHtml(getActiveTahunAjaran());
  const jenisUjianTitle = formData.jenisUjian === 'STS' ? 'SUMATIF TENGAH SEMESTER' :
                          formData.jenisUjian === 'SAS' ? 'SUMATIF AKHIR SEMESTER' :
                          formData.jenisUjian === 'ASAT' ? 'ASESMEN SUMATIF AKHIR TAHUN' :
                          (formData.jenisUjian || 'ASESMEN PEMBELAJARAN');

  // Lembar Pengesahan Template
  const renderPengesahanHTML = () => `
    <table class="layout-table" style="width:100%; margin-top:40px; text-align:center; font-size:10.5pt; page-break-inside:avoid; break-inside:avoid;">
      <tr>
        <td style="width:50%; vertical-align:bottom;">
          <p style="margin:0 0 4px 0;">Mengetahui,</p>
          <p style="margin:0 0 4px 0;">Kepala Sekolah</p>
          <br><br><br><br>
          <p style="text-decoration:underline; font-weight:bold; margin:0 0 2px 0;">${escapeHtml(formData.namaKepalaSekolah || '..............................')}</p>
          <p style="margin:0;">NIP. ${escapeHtml(formData.nipKepalaSekolah || '..............................')}</p>
        </td>
        <td style="width:50%; vertical-align:bottom;">
          <p style="margin:0 0 4px 0;">&nbsp;</p>
          <p style="margin:0 0 4px 0;">Guru Pengampu</p>
          <br><br><br><br>
          <p style="text-decoration:underline; font-weight:bold; margin:0 0 2px 0;">${escapeHtml(formData.namaGuru || '..............................')}</p>
          <p style="margin:0;">NIP. ${escapeHtml(formData.nipGuru || '..............................')}</p>
        </td>
      </tr>
    </table>
  `;

  // Helper render badge level kognitif resmi
  const renderLevelBadge = (level) => {
    const l = String(level || 'L1').toUpperCase();
    if (l.includes('3')) return `<span class="badge-level-l3">L3</span>`;
    if (l.includes('2')) return `<span class="badge-level-l2">L2</span>`;
    return `<span class="badge-level-l1">L1</span>`;
  };

  // -------------------------------------------------------------
  // 1. SECTION: NASKAH SOAL SISWA
  // -------------------------------------------------------------
  let htmlSoal = `<div id="section-soal-view" class="asesmen-view-section">`;
  htmlSoal += `
      <div style="text-align:center; margin-bottom: 20px;">
        <img src="${kopSuratUrl}" style="width:100%; height:auto; object-fit:contain;" alt="Kop Surat" crossorigin="anonymous">
      </div>
      <div style="text-align:center; margin-bottom:15px; text-transform:uppercase;">
        <h4 style="text-decoration:underline; font-weight:bold; font-size:12pt; margin-bottom:2px;">
          ${jenisUjianTitle}
        </h4>
        <p style="font-weight:bold; font-size:11pt; margin:0">TAHUN PELAJARAN ${activeTA}</p>
      </div>
      <table class="main-table" style="margin-bottom:20px; font-size:10.5pt">
        <tr>
          <td style="width:15%">Mata Pelajaran</td>
          <td style="width:30%">: ${escapeHtml(formData.mataPelajaran || '-')}</td>
          <td style="width:15%">Nama Murid</td>
          <td style="width:40%">: ............................................................</td>
        </tr>
        <tr>
          <td>Kelas / Smt</td>
          <td>: ${escapeHtml(formData.jenjangKelas || '-')} / ${escapeHtml(formData.semester || '-')}</td>
          <td>Hari / Tgl</td>
          <td>: .................. / .......................</td>
        </tr>
      </table>
    `;

  // PG Section
  if (data.pg && data.pg.length > 0) {
    htmlSoal += `
      <div class="section-title">
        <h4>I. PILIHAN GANDA</h4>
        <p>Berilah tanda silang (X) pada huruf A, B, C, atau D pada jawaban yang paling benar!</p>
      </div>
    `;

    data.pg.forEach(q => {
      const opts = q.opsi || {};
      const allShort = Object.values(opts).every(v => (v || '').length < 20);
      const anyLong = Object.values(opts).some(v => (v || '').length > 55);
      const colClass = allShort ? 'cols-4' : anyLong ? 'cols-1' : 'cols-2';

      let optionsHTML = '';
      if (allShort) {
        optionsHTML = `
          <table class="layout-table soal-options-table">
            <tr>
              <td style="width:25%; padding: 2px 8px 3px 0;">A. ${opts.A || '-'}</td>
              <td style="width:25%; padding: 2px 8px 3px 0;">B. ${opts.B || '-'}</td>
              <td style="width:25%; padding: 2px 8px 3px 0;">C. ${opts.C || '-'}</td>
              <td style="width:25%; padding: 2px 0 3px 0;">D. ${opts.D || '-'}</td>
            </tr>
          </table>`;
      } else if (colClass === 'cols-2') {
        optionsHTML = `
          <table class="layout-table soal-options-table">
            <tr>
              <td style="width:50%; padding: 2px 14px 4px 0;">A. ${opts.A || '-'}</td>
              <td style="width:50%; padding: 2px 0 4px 0;">C. ${opts.C || '-'}</td>
            </tr>
            <tr>
              <td style="width:50%; padding: 2px 14px 3px 0;">B. ${opts.B || '-'}</td>
              <td style="width:50%; padding: 2px 0 3px 0;">D. ${opts.D || '-'}</td>
            </tr>
          </table>`;
      } else {
        optionsHTML = `
          <table class="layout-table soal-options-table">
            <tr><td style="padding: 2px 0 3px 0;">A. ${opts.A || '-'}</td></tr>
            <tr><td style="padding: 2px 0 3px 0;">B. ${opts.B || '-'}</td></tr>
            <tr><td style="padding: 2px 0 3px 0;">C. ${opts.C || '-'}</td></tr>
            <tr><td style="padding: 2px 0 3px 0;">D. ${opts.D || '-'}</td></tr>
          </table>`;
      }

      const pgIdx = data.pg.indexOf(q);
      const actionsHTML = `<div class="soal-actions print:hidden">
        <button type="button" class="btn-edit-soal" data-type="pg" data-index="${pgIdx}" title="Edit Soal No. ${q.no}"><i class="fas fa-pencil-alt"></i> Edit</button>
        <button type="button" class="btn-delete-soal" data-type="pg" data-index="${pgIdx}" title="Hapus Soal No. ${q.no}"><i class="fas fa-trash-alt"></i></button>
      </div>`;

      if (q.gambar && q.gambar.url) {
        htmlSoal += `
          <div class="soal-item-wrapper">
            ${actionsHTML}
            <table class="layout-table soal-item-row" style="width:100%;">
              <tr>
                <td style="width:26px; font-weight:bold; vertical-align:top; padding:1px 0; line-height:1.45;">${q.no}.</td>
                <td style="vertical-align:top; padding:1px 0;">
                  <div class="soal-text">${formatSoalText(q.soal)}</div>
                  <div style="margin: 6px 0 8px 0; text-align:left;">
                    <div class="soal-image-container relative group inline-block" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px; background:#fff;">
                      <img src="${q.gambar.url}" style="max-width:240px; max-height:160px; width:auto; height:auto; object-fit:contain; display:block; border-radius:4px;" alt="${escapeHtml(q.gambar.title || 'Gambar Ilustrasi')}" onerror="this.onerror=null; this.closest('.soal-image-container')?.classList.add('image-load-failed');">
                      ${q.gambar.credit ? `
                        <div class="image-credit-badge print:hidden text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                          <i class="${q.gambar.type === 'svg' ? 'fas fa-bezier-curve text-sky-600' : 'fas fa-camera text-emerald-600'}"></i>
                          <span>${escapeHtml(q.gambar.credit)}</span>
                        </div>
                      ` : ''}
                      <div class="image-hover-actions absolute top-1.5 right-1.5 flex items-center gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" class="btn-change-soal-image bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold shadow cursor-pointer" title="Ganti gambar ini (upload / link URL)" data-type="pg" data-qindex="${pgIdx}">
                          <i class="fas fa-camera"></i> Ganti
                        </button>
                        <button type="button" class="btn-remove-soal-image bg-rose-600 hover:bg-rose-700 text-white w-6 h-6 rounded flex items-center justify-center text-[10px] shadow cursor-pointer" title="Hapus gambar dari butir soal ini" data-type="pg" data-qindex="${pgIdx}">
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </div>
                      <div class="image-failed-alert hidden print:hidden items-center justify-between gap-3 p-2 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs mt-1">
                        <span class="flex items-center gap-1.5 font-medium"><i class="fas fa-exclamation-triangle text-amber-600"></i> Gambar tidak dapat dimuat</span>
                        <div class="flex items-center gap-1.5">
                          <button type="button" class="btn-change-soal-image px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow cursor-pointer" data-type="pg" data-qindex="${pgIdx}"><i class="fas fa-camera mr-1"></i>Ganti</button>
                          <button type="button" class="btn-remove-soal-image px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow cursor-pointer" data-type="pg" data-qindex="${pgIdx}"><i class="fas fa-trash-alt mr-1"></i>Hapus</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  ${optionsHTML}
                </td>
              </tr>
            </table>
          </div>
        `;
      } else {
        htmlSoal += `
          <div class="soal-item-wrapper">
            ${actionsHTML}
            <table class="layout-table soal-item-row" style="width:100%;">
              <tr>
                <td style="width:26px; font-weight:bold; vertical-align:top; padding:1px 0; line-height:1.45;">${q.no}.</td>
                <td style="vertical-align:top; padding:1px 0;">
                  <div class="soal-text">${formatSoalText(q.soal)}</div>
                  ${optionsHTML}
                </td>
              </tr>
            </table>
          </div>
        `;
      }
    });
  }

  // Isian Section
  if (data.isian && data.isian.data && data.isian.data.length > 0) {
    const isianType = data.isian.type || formData.isianType || 'Standard';
    let isianTitle = 'II. ISIAN SINGKAT';
    let isianDesc = 'Isilah titik-titik di bawah ini dengan jawaban yang tepat!';

    if (isianType === 'Crossword') {
      isianTitle = 'II. TEKA-TEKI SILANG';
      isianDesc = 'Isilah jawaban teka-teki silang berikut secara Mendatar atau Menurun sesuai petunjuk!';
    } else if (isianType === 'Menjodohkan') {
      isianTitle = 'II. MENJODOHKAN';
      isianDesc = 'Pasangkanlah pernyataan di sebelah kiri dengan jawaban yang tepat di sebelah kanan!';
    }

    htmlSoal += `
      <div class="section-title">
        <h4>${isianTitle}</h4>
        <p>${isianDesc}</p>
      </div>
    `;

    if (isianType === 'Menjodohkan') {
      const rightCol = [...data.isian.data].map(q => q.kunci).sort(() => Math.random() - 0.5);
      htmlSoal += `<table class="layout-table soal-item-row" style="margin-bottom:14px; width:100%">`;
      data.isian.data.forEach((q, i) => {
        const optionLetter = String.fromCharCode(65 + i); // A, B, C...
        htmlSoal += `
          <tr>
            <td style="width:26px; font-weight:bold; vertical-align:top; padding:4px 0;">${q.no}.</td>
            <td style="width:40%; padding:4px 10px 4px 0; text-align:justify; vertical-align:top;">${formatSoalText(q.soal)}</td>
            <td style="width:25%; text-align:center; vertical-align:top; padding:4px 0;">....................</td>
            <td style="width:5%; font-weight:bold; text-align:right; vertical-align:top; padding:4px 4px 4px 0;">${optionLetter}.</td>
            <td style="width:30%; padding:4px 0 4px 10px; vertical-align:top;">${rightCol[i]}</td>
          </tr>
        `;
      });
      htmlSoal += `</table>`;
    } else if (isianType === 'Crossword' && data.isian.crossword) {
      const cw = data.isian.crossword;
      if (cw.success && cw.grid) {
        htmlSoal += `
          <div class="my-5 p-4 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-500/30 shadow-lg print:hidden">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 text-lg">
                <i class="fas fa-gamepad"></i>
              </div>
              <div>
                <h4 class="font-bold text-sm text-white font-sans">Mode Game TTS Interaktif Kelas</h4>
                <p class="text-xs text-purple-200/80 font-sans">Mainkan teka-teki silang ini langsung di proyektor kelas bersama siswa!</p>
              </div>
            </div>
            <button id="btn-launch-tts-game" type="button" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 cursor-pointer font-sans">
              <i class="fas fa-play"></i> Mainkan di Kelas
            </button>
          </div>
        `;

        htmlSoal += `<div style="margin: 20px 0;">`;
        htmlSoal += `<table style="border-collapse:collapse; display:block; margin:0 auto; table-layout:fixed; width:auto;">`;
        for (let r = 0; r < cw.grid.length; r++) {
          htmlSoal += `<tr>`;
          for (let c = 0; c < cw.grid[r].length; c++) {
            const char = cw.grid[r][c];

            // Check if cell needs a number
            let num = '';
            const p = cw.placements.find(pl => pl.row === r && pl.col === c);
            if (p) {
              num = `<span style="font-size:7pt; font-weight:bold; position:relative; top:-6px; left:1px">${p.number}</span>`;
            }

            if (char !== ' ') {
              htmlSoal += `<td style="width:28px; height:28px; border:1px solid black; background:white; text-align:left; vertical-align:top; border-collapse:collapse; padding:0;">${num}</td>`;
            } else {
              htmlSoal += `<td style="width:28px; height:28px; border:none; border-collapse:collapse; padding:0;"></td>`;
            }
          }
          htmlSoal += `</tr>`;
        }
        htmlSoal += `</table></div>`;

        // Render Mendatar & Menurun Clues list
        const mendatar = [];
        const menurun = [];
        cw.placements.forEach(p => {
          let qData = data.isian.data[p.originalIndex];
          if (qData) {
            const stmt = `${p.number}. ${qData.soal.replace(/^(Mendatar:|Menurun:)\s*/i, '').trim()}`;
            if (p.direction === 'H') mendatar.push({ num: p.number, text: stmt });
            else menurun.push({ num: p.number, text: stmt });
          }
        });

        mendatar.sort((a, b) => a.num - b.num);
        menurun.sort((a, b) => a.num - b.num);

        htmlSoal += `<table class="layout-table" style="width:100%; margin-top:20px;">
                  <tr>
                    <td style="width:50%; padding-right:15px; vertical-align:top;">
                      <h4 style="margin-bottom:8px; font-weight:bold; text-decoration:underline;">MENDATAR</h4>
                      ${mendatar.map(t => `<div style="margin-bottom:6px; text-align:justify">${t.text}</div>`).join('')}
                    </td>
                    <td style="width:50%; padding-left:15px; vertical-align:top;">
                      <h4 style="margin-bottom:8px; font-weight:bold; text-decoration:underline;">MENURUN</h4>
                      ${menurun.map(t => `<div style="margin-bottom:6px; text-align:justify">${t.text}</div>`).join('')}
                    </td>
                  </tr>
                </table>`;
      }
    } else {
      data.isian.data.forEach((q, isianIdx) => {
        const isianActionsHTML = `<div class="soal-actions print:hidden">
          <button type="button" class="btn-edit-soal" data-type="isian" data-index="${isianIdx}" title="Edit Soal No. ${q.no}"><i class="fas fa-pencil-alt"></i> Edit</button>
          <button type="button" class="btn-delete-soal" data-type="isian" data-index="${isianIdx}" title="Hapus Soal No. ${q.no}"><i class="fas fa-trash-alt"></i></button>
        </div>`;
        htmlSoal += `
          <div class="soal-item-wrapper">
            ${isianActionsHTML}
            <table class="layout-table soal-item-row" style="width:100%;">
              <tr>
                <td style="width:26px; font-weight:bold; vertical-align:top; padding:1px 0; line-height:1.45;">${q.no}.</td>
                <td style="vertical-align:top; padding:1px 0;">
                  <div class="soal-text">${formatSoalText(q.soal)}</div>
                </td>
              </tr>
            </table>
          </div>
        `;
      });
    }
  }

  // Uraian Section
  if (data.uraian && data.uraian.length > 0) {
    htmlSoal += `
      <div class="section-title">
        <h4>III. URAIAN</h4>
        <p>Jawablah pertanyaan di bawah ini dengan jelas dan tepat!</p>
      </div>
    `;

    data.uraian.forEach((q, uraianIdx) => {
      const uraianActionsHTML = `<div class="soal-actions print:hidden">
        <button type="button" class="btn-edit-soal" data-type="uraian" data-index="${uraianIdx}" title="Edit Soal No. ${q.no}"><i class="fas fa-pencil-alt"></i> Edit</button>
        <button type="button" class="btn-delete-soal" data-type="uraian" data-index="${uraianIdx}" title="Hapus Soal No. ${q.no}"><i class="fas fa-trash-alt"></i></button>
      </div>`;
      htmlSoal += `
        <div class="soal-item-wrapper" style="margin-bottom:16px;">
          ${uraianActionsHTML}
          <table class="layout-table soal-item-row" style="width:100%;">
            <tr>
              <td style="width:26px; font-weight:bold; vertical-align:top; padding:1px 0; line-height:1.45;">${q.no}.</td>
              <td style="vertical-align:top; padding:1px 0;">
                <div class="soal-text" style="margin-bottom:14px;">${formatSoalText(q.soal)}</div>
              </td>
            </tr>
          </table>
        </div>
      `;
    });
  }

  htmlSoal += `</div>`; // End of #section-soal-view

  // -------------------------------------------------------------
  // 2. SECTION: KUNCI JAWABAN & PEDOMAN PENSKORAN
  // -------------------------------------------------------------
  let htmlKunci = `<div id="section-kunci-view" class="asesmen-view-section kunci-page-break">`;
  htmlKunci += `<h4 style="text-align:center; text-decoration:underline; font-weight:bold; font-size:12pt; margin-bottom:3px;">KUNCI JAWABAN & PEDOMAN PENSKORAN</h4>`;
  htmlKunci += `<p style="text-align:center; font-weight:bold; font-size:10.5pt; margin-bottom:20px;">${escapeHtml(formData.mataPelajaran || '-')} - ${escapeHtml(formData.jenjangKelas || '-')} / ${escapeHtml(formData.semester || '-')}</p>`;

  if (data.pg && data.pg.length > 0) {
    htmlKunci += `<h4>I. KUNCI JAWABAN PILIHAN GANDA</h4>`;
    htmlKunci += `<table class="layout-table" style="margin-bottom:15px; width:auto;"><tr>`;
    const rows = Math.ceil(data.pg.length / 5);
    for (let c = 0; c < 5; c++) {
      htmlKunci += `<td style="width:80px">`;
      for (let r = 0; r < rows; r++) {
        const idx = (r * 5) + c;
        if (data.pg[idx]) {
          htmlKunci += `<div style="margin-bottom:2px"><b>${data.pg[idx].no}.</b> &nbsp;${data.pg[idx].kunci}</div>`;
        }
      }
      htmlKunci += `</td>`;
    }
    htmlKunci += `</tr></table>`;
  }

  if (data.isian && data.isian.data && data.isian.data.length > 0) {
    const kunciIsianType = data.isian.type || formData.isianType || 'Standard';
    const kunciIsianTitle = kunciIsianType === 'Crossword' ? 'II. KUNCI JAWABAN TEKA-TEKI SILANG' : 'II. KUNCI JAWABAN ISIAN SINGKAT';
    htmlKunci += `<h4>${kunciIsianTitle}</h4>`;
    htmlKunci += `<table class="main-table" style="margin-bottom:15px;">`;
    htmlKunci += `<tr style="background:#f0f0f0"><th>No</th><th>Kunci Jawaban</th></tr>`;
    const sortedIsianKunci = [...data.isian.data].sort((a, b) => (a.no || 0) - (b.no || 0));
    sortedIsianKunci.forEach(q => {
      htmlKunci += `<tr><td style="text-align:center">${q.no}</td><td>${q.kunci}</td></tr>`;
    });
    htmlKunci += `</table>`;
  }

  if (data.uraian && data.uraian.length > 0) {
    htmlKunci += `<h4>III. PEDOMAN PENSKORAN URAIAN</h4>`;
    htmlKunci += `<table class="main-table" style="margin-bottom:25px;">`;
    htmlKunci += `<tr style="background:#f0f0f0"><th style="width:5%">No</th><th style="width:50%">Kriteria Jawaban</th><th style="width:15%">Skor Maksimal</th></tr>`;
    data.uraian.forEach(q => {
      let rubrikHtml = '';
      if (q.rubrik_skor && typeof q.rubrik_skor === 'object') {
        rubrikHtml = Object.entries(q.rubrik_skor).map(([k, v]) => `- ${k}: ${v}`).join('<br>');
      }
      htmlKunci += `<tr>
                <td style="text-align:center">${q.no}</td>
                <td><b>Jawaban:</b><br>${q.kunci}<br><br><b>Rubrik:</b><br>${rubrikHtml || '-'}</td>
                <td style="text-align:center; vertical-align:middle; font-weight:bold;">TBD</td>
               </tr>`;
    });
    htmlKunci += `</table>`;
  }

  htmlKunci += renderPengesahanHTML();
  htmlKunci += `</div>`; // End of #section-kunci-view

  // -------------------------------------------------------------
  // 3. SECTION: MATRIKS KISI-KISI PENULISAN SOAL (8 KOLOM RESMI)
  // -------------------------------------------------------------
  const allItems = [
    ...(data.pg || []),
    ...(data.isian?.data || []),
    ...(data.uraian || [])
  ];
  // Urutkan berdasarkan nomor soal
  allItems.sort((a, b) => (a.no || 0) - (b.no || 0));

  const countL1 = allItems.filter(q => q.level === 'L1').length;
  const countL2 = allItems.filter(q => q.level === 'L2').length;
  const countL3 = allItems.filter(q => q.level === 'L3').length;
  const totalItems = allItems.length || 1;
  const pctL1 = Math.round((countL1 / totalItems) * 100);
  const pctL2 = Math.round((countL2 / totalItems) * 100);
  const pctL3 = Math.round((countL3 / totalItems) * 100);

  let htmlKisi = `<div id="section-kisi-view" class="asesmen-view-section kisi-page-break">`;
  htmlKisi += `
      <div style="text-align:center; margin-bottom: 18px;">
        <img src="${kopSuratUrl}" style="width:100%; height:auto; object-fit:contain;" alt="Kop Surat" crossorigin="anonymous">
      </div>
      <div style="text-align:center; margin-bottom:15px; text-transform:uppercase;">
        <h4 style="text-decoration:underline; font-weight:bold; font-size:12pt; margin-bottom:2px;">
          KISI-KISI PENULISAN SOAL ${jenisUjianTitle}
        </h4>
        <p style="font-weight:bold; font-size:11pt; margin:0">TAHUN PELAJARAN ${activeTA}</p>
      </div>

      <table class="main-table" style="margin-bottom:14px; font-size:10pt;">
        <tr>
          <td style="width:18%;">Satuan Pendidikan</td>
          <td style="width:32%;">: ${escapeHtml(formData.namaSekolah || state.user?.sekolah_nama || state.user?.sekolah || 'SD')}</td>
          <td style="width:18%;">Alokasi Waktu</td>
          <td style="width:32%;">: 90 Menit</td>
        </tr>
        <tr>
          <td>Mata Pelajaran</td>
          <td>: ${escapeHtml(formData.mataPelajaran || '-')}</td>
          <td>Jumlah Soal</td>
          <td>: ${totalItems} Butir</td>
        </tr>
        <tr>
          <td>Kelas / Semester</td>
          <td>: ${escapeHtml(formData.jenjangKelas || '-')} / ${escapeHtml(formData.semester || '-')}</td>
          <td>Penyusun</td>
          <td>: ${escapeHtml(formData.namaGuru || state.user?.nama || 'Guru Pengampu')}</td>
        </tr>
      </table>

      <!-- Ringkasan Distribusi Level Kognitif -->
      <div class="print:hidden" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:6px 12px; margin-bottom:12px; font-size:9.5pt;">
        <div>
          <b>Distribusi Level Kognitif:</b>
          <span style="color:#047857; margin-left:6px;"><i class="fas fa-circle text-[8px] mr-1"></i><b>L1 (Pemahaman):</b> ${countL1} (${pctL1}%)</span> &nbsp;|&nbsp;
          <span style="color:#b45309;"><i class="fas fa-circle text-[8px] mr-1"></i><b>L2 (Aplikasi):</b> ${countL2} (${pctL2}%)</span> &nbsp;|&nbsp;
          <span style="color:#6d28d9;"><i class="fas fa-circle text-[8px] mr-1"></i><b>L3 (Penalaran):</b> ${countL3} (${pctL3}%)</span>
        </div>
        <div><b>Total:</b> ${totalItems} Soal</div>
      </div>

      <!-- Tabel Matriks 8 Kolom Standar Dinas Pendidikan -->
      <table class="main-table" style="width:100%; border-collapse:collapse; font-size:9pt; line-height:1.35; border:1.5px solid #334155; margin-bottom:20px;">
        <thead style="background:#f1f5f9; text-align:center;">
          <tr style="border-bottom:1.5px solid #334155;">
            <th style="border:1px solid #475569; padding:6px 4px; width:4%;">No</th>
            <th style="border:1px solid #475569; padding:6px 8px; width:22%;">Capaian Pembelajaran (CP)</th>
            <th style="border:1px solid #475569; padding:6px 8px; width:15%;">Materi Pokok</th>
            <th style="border:1px solid #475569; padding:6px 8px; width:26%;">Indikator Soal</th>
            <th style="border:1px solid #475569; padding:6px 4px; width:7%;">Level</th>
            <th style="border:1px solid #475569; padding:6px 4px; width:9%;">Bentuk</th>
            <th style="border:1px solid #475569; padding:6px 4px; width:5%;">No.</th>
            <th style="border:1px solid #475569; padding:6px 6px; width:12%;">Kunci</th>
          </tr>
        </thead>
        <tbody>
          ${allItems.map((item, idx) => `
            <tr style="border-bottom:1px solid #cbd5e1; page-break-inside:avoid; break-inside:avoid;">
              <td style="border:1px solid #475569; padding:5px 4px; text-align:center; font-weight:600;">${idx + 1}</td>
              <td style="border:1px solid #475569; padding:5px 8px; text-align:justify;">${escapeHtml(item.cp || '-')}</td>
              <td style="border:1px solid #475569; padding:5px 8px;">${escapeHtml(item.materi || '-')}</td>
              <td style="border:1px solid #475569; padding:5px 8px; text-align:justify;">${escapeHtml(item.indikator || '-')}</td>
              <td style="border:1px solid #475569; padding:5px 4px; text-align:center;">${renderLevelBadge(item.level)}</td>
              <td style="border:1px solid #475569; padding:5px 4px; text-align:center; font-size:8.5pt;">${escapeHtml(item.bentuk || 'PG')}</td>
              <td style="border:1px solid #475569; padding:5px 4px; text-align:center; font-weight:bold;">${item.no}</td>
              <td style="border:1px solid #475569; padding:5px 6px; text-align:center; font-weight:600;">${escapeHtml(item.kunci || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${renderPengesahanHTML()}
    </div>
  `;

  canvas.innerHTML = htmlSoal + htmlKunci + htmlKisi;
  window.scrollTo(0, 0);

  // Apply active tab filtering to canvas
  const canvasEl = document.getElementById('asesmen-canvas');
  if (canvasEl) {
    canvasEl.classList.remove('view-tab-soal', 'view-tab-kisi', 'view-tab-kunci', 'view-tab-all');
    canvasEl.classList.add(`view-tab-${_currentActiveTab || 'soal'}`);
  }

  // Attach quick remove image listener
  canvas.querySelectorAll('.btn-remove-soal-image').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type || 'pg';
      const qIdx = parseInt(btn.dataset.qindex, 10);
      let targetQ;
      if (type === 'pg') targetQ = data.pg?.[qIdx];
      else if (type === 'isian') targetQ = data.isian?.data?.[qIdx];
      else if (type === 'uraian') targetQ = data.uraian?.[qIdx];

      if (targetQ) {
        delete targetQ.gambar;
        renderResult(data, formData);
        showToast(`Gambar pada nomor ${targetQ.no} berhasil dihapus.`, 'info');
      }
    });
  });

  // Attach quick change image listener
  canvas.querySelectorAll('.btn-change-soal-image').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type || 'pg';
      const qIdx = parseInt(btn.dataset.qindex, 10);
      openChangeImageModal(type, qIdx, data, formData);
    });
  });

  // Attach edit soal listener
  canvas.querySelectorAll('.btn-edit-soal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const index = parseInt(btn.dataset.index, 10);
      openSoalEditor(type, index, data, formData);
    });
  });

  // Attach delete soal listener
  canvas.querySelectorAll('.btn-delete-soal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const index = parseInt(btn.dataset.index, 10);
      deleteSoal(type, index, data, formData);
    });
  });

  // Attach interactive crossword game player listener
  if (isianType === 'Crossword' && data.isian?.crossword?.success) {
    document.getElementById('btn-launch-tts-game')?.addEventListener('click', () => {
      openInteractiveCrosswordGame(data.isian.crossword, data, formData);
    });
  }
}

// ============================================================
// INLINE SOAL EDITOR MODAL
// ============================================================
function openSoalEditor(type, index, data, formData) {
  const existing = document.querySelector('.soal-editor-overlay');
  if (existing) existing.remove();

  let q;
  if (type === 'pg') q = data.pg?.[index];
  else if (type === 'isian') q = data.isian?.data?.[index];
  else if (type === 'uraian') q = data.uraian?.[index];
  if (!q) return;

  const isPG = type === 'pg';
  const isUraian = type === 'uraian';
  const typeLabel = isPG ? 'Pilihan Ganda' : type === 'isian' ? 'Isian' : 'Uraian';

  let opsiFieldsHTML = '';
  if (isPG) {
    const opts = q.opsi || {};
    opsiFieldsHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 12px;">
        <div><label>Opsi A</label><input type="text" id="edit-opsi-a" value="${escapeHtml(opts.A || '')}"></div>
        <div><label>Opsi B</label><input type="text" id="edit-opsi-b" value="${escapeHtml(opts.B || '')}"></div>
        <div><label>Opsi C</label><input type="text" id="edit-opsi-c" value="${escapeHtml(opts.C || '')}"></div>
        <div><label>Opsi D</label><input type="text" id="edit-opsi-d" value="${escapeHtml(opts.D || '')}"></div>
      </div>
      <label>Kunci Jawaban</label>
      <select id="edit-kunci">
        <option value="A" ${q.kunci === 'A' ? 'selected' : ''}>A</option>
        <option value="B" ${q.kunci === 'B' ? 'selected' : ''}>B</option>
        <option value="C" ${q.kunci === 'C' ? 'selected' : ''}>C</option>
        <option value="D" ${q.kunci === 'D' ? 'selected' : ''}>D</option>
      </select>
    `;
  } else {
    opsiFieldsHTML = `
      <label>Kunci Jawaban</label>
      <textarea id="edit-kunci" rows="2">${escapeHtml(q.kunci || '')}</textarea>
    `;
  }

  let rubrikHTML = '';
  if (isUraian && q.rubrik_skor && typeof q.rubrik_skor === 'object') {
    rubrikHTML = `
      <label>Rubrik Penskoran</label>
      <textarea id="edit-rubrik" rows="3">${escapeHtml(Object.entries(q.rubrik_skor).map(([k, v]) => `${k}: ${v}`).join('\n'))}</textarea>
    `;
  }

  // Gambar Section
  let currentGambarUrl = q.gambar?.url || '';
  const gambarSectionHTML = `
    <div style="margin-bottom:14px; padding:12px; border:1.5px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <label style="margin:0; font-size:12px; font-weight:700; color:#334155; display:flex; align-items:center; gap:6px;">
          <i class="fas fa-image text-blue-600"></i> Gambar Ilustrasi Soal
        </label>
        <span id="editor-img-status" class="text-xs font-semibold ${currentGambarUrl ? 'text-emerald-600' : 'text-slate-400'}">
          ${currentGambarUrl ? '✓ Ada Gambar' : 'Tanpa Gambar'}
        </span>
      </div>

      <div id="editor-image-preview-box" style="margin-bottom:10px; ${currentGambarUrl ? 'display:flex;' : 'display:none;'} align-items:center; gap:12px; background:#fff; padding:8px; border-radius:8px; border:1px solid #e2e8f0;">
        <img id="editor-img-thumb" src="${escapeHtml(currentGambarUrl)}" style="max-width:140px; max-height:85px; width:auto; height:auto; object-fit:contain; border-radius:6px; background:#f1f5f9; padding:2px;" alt="Pratinjau">
        <div style="flex:1;">
          <p class="text-[11px] text-slate-500 m-0 mb-1">Gambar aktif untuk soal ini.</p>
          <button type="button" id="btn-editor-remove-img" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1">
            <i class="fas fa-trash-alt"></i> Hapus Gambar
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <label style="font-size:11px; text-transform:none; margin-bottom:3px; color:#64748b;"><i class="fas fa-upload text-indigo-500 mr-1"></i> Upload dari Komputer:</label>
          <input type="file" id="editor-file-upload" accept="image/*" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] cursor-pointer">
        </div>
        <div>
          <label style="font-size:11px; text-transform:none; margin-bottom:3px; color:#64748b;"><i class="fas fa-link text-emerald-500 mr-1"></i> Tempel Link / URL Internet:</label>
          <div style="display:flex; gap:4px;">
            <input type="text" id="editor-url-input" placeholder="https://..." value="${escapeHtml(currentGambarUrl.startsWith('data:') ? '' : currentGambarUrl)}" style="font-size:11px; padding:6px 8px; margin-bottom:0;" class="flex-1">
            <button type="button" id="btn-editor-apply-url" class="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold cursor-pointer">Pasang</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'soal-editor-overlay';
  overlay.innerHTML = `
    <div class="soal-editor-modal" style="max-width: 660px;">
      <h3><i class="fas fa-pencil-alt" style="color:#2563eb"></i> Edit Soal & Kisi-Kisi ${typeLabel} No. ${q.no}</h3>
      
      <!-- Kisi-kisi metadata fields -->
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:12px; margin-bottom:14px;">
        <h4 style="font-size:11px; font-weight:800; color:#334155; margin:0 0 8px 0; text-transform:uppercase; letter-spacing:0.5px;">
          <i class="fas fa-th-list text-teal-600 mr-1"></i> Data Kisi-Kisi Soal (Standar Puspendik)
        </h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
          <div>
            <label style="font-size:10.5px;">Materi Pokok</label>
            <input type="text" id="edit-materi" value="${escapeHtml(q.materi || '')}" style="margin-bottom:0; font-size:12px;">
          </div>
          <div>
            <label style="font-size:10.5px;">Level Kognitif</label>
            <select id="edit-level" style="margin-bottom:0; font-size:12px;">
              <option value="L1" ${q.level === 'L1' ? 'selected' : ''}>L1 - Pengetahuan & Pemahaman</option>
              <option value="L2" ${q.level === 'L2' ? 'selected' : ''}>L2 - Aplikasi / Penerapan</option>
              <option value="L3" ${q.level === 'L3' ? 'selected' : ''}>L3 - Penalaran / HOTS</option>
            </select>
          </div>
        </div>
        <div style="margin-bottom:8px;">
          <label style="font-size:10.5px;">Capaian Pembelajaran (CP)</label>
          <textarea id="edit-cp" rows="2" style="margin-bottom:0; font-size:12px; min-height:55px;">${escapeHtml(q.cp || '')}</textarea>
        </div>
        <div>
          <label style="font-size:10.5px;">Indikator Soal</label>
          <textarea id="edit-indikator" rows="2" style="margin-bottom:0; font-size:12px; min-height:55px;">${escapeHtml(q.indikator || '')}</textarea>
        </div>
      </div>

      <label>Teks Soal</label>
      <textarea id="edit-soal-text" rows="3">${escapeHtml(cleanPromptDebris(q.soal || ''))}</textarea>
      ${gambarSectionHTML}
      ${opsiFieldsHTML}
      ${rubrikHTML}
      <div class="editor-actions">
        <button type="button" class="btn-editor-cancel">Batal</button>
        <button type="button" class="btn-editor-save"><i class="fas fa-check mr-1"></i> Simpan Perubahan</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Focus textarea
  setTimeout(() => overlay.querySelector('#edit-soal-text')?.focus(), 100);

  // Gambar state & event bindings in modal editor
  let modalSelectedImageUrl = currentGambarUrl;
  const imgPreviewBox = overlay.querySelector('#editor-image-preview-box');
  const imgThumb = overlay.querySelector('#editor-img-thumb');
  const imgStatus = overlay.querySelector('#editor-img-status');
  const fileUpload = overlay.querySelector('#editor-file-upload');
  const urlInput = overlay.querySelector('#editor-url-input');

  const updateModalImagePreview = (url) => {
    modalSelectedImageUrl = url;
    if (url) {
      imgThumb.src = url;
      imgPreviewBox.style.display = 'flex';
      imgStatus.textContent = '✓ Ada Gambar';
      imgStatus.className = 'text-xs font-semibold text-emerald-600';
    } else {
      imgThumb.src = '';
      imgPreviewBox.style.display = 'none';
      imgStatus.textContent = 'Tanpa Gambar';
      imgStatus.className = 'text-xs font-semibold text-slate-400';
    }
  };

  fileUpload?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file maksimal 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (re) => {
        updateModalImagePreview(re.target.result);
        if (urlInput) urlInput.value = '';
        showToast('Gambar lokal berhasil dipilih.', 'info');
      };
      reader.readAsDataURL(file);
    }
  });

  overlay.querySelector('#btn-editor-apply-url')?.addEventListener('click', () => {
    const url = urlInput?.value.trim();
    if (!url) { showToast('Masukkan link URL gambar.', 'error'); return; }
    updateModalImagePreview(url);
    if (fileUpload) fileUpload.value = '';
    showToast('Link gambar dipasang.', 'info');
  });

  overlay.querySelector('#btn-editor-remove-img')?.addEventListener('click', () => {
    updateModalImagePreview('');
    if (urlInput) urlInput.value = '';
    if (fileUpload) fileUpload.value = '';
    showToast('Gambar dilepas dari soal ini.', 'info');
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Close on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);

  // Cancel
  overlay.querySelector('.btn-editor-cancel').addEventListener('click', () => overlay.remove());

  // Save
  overlay.querySelector('.btn-editor-save').addEventListener('click', () => {
    const newSoal = overlay.querySelector('#edit-soal-text').value.trim();
    if (!newSoal) { showToast('Teks soal tidak boleh kosong.', 'error'); return; }

    q.soal = cleanPromptDebris(newSoal);

    // Update kisi-kisi attributes
    const newCP = overlay.querySelector('#edit-cp')?.value.trim();
    const newMateri = overlay.querySelector('#edit-materi')?.value.trim();
    const newIndikator = overlay.querySelector('#edit-indikator')?.value.trim();
    const newLevel = overlay.querySelector('#edit-level')?.value;

    if (newCP) q.cp = newCP;
    if (newMateri) q.materi = newMateri;
    if (newIndikator) q.indikator = newIndikator;
    if (newLevel) q.level = newLevel;

    // Update gambar
    if (modalSelectedImageUrl) {
      q.gambar = {
        url: modalSelectedImageUrl,
        deskripsi: q.gambar?.deskripsi || 'Gambar Ilustrasi'
      };
    } else {
      delete q.gambar;
    }

    if (isPG) {
      q.opsi = {
        A: overlay.querySelector('#edit-opsi-a').value.trim(),
        B: overlay.querySelector('#edit-opsi-b').value.trim(),
        C: overlay.querySelector('#edit-opsi-c').value.trim(),
        D: overlay.querySelector('#edit-opsi-d').value.trim(),
      };
      q.kunci = overlay.querySelector('#edit-kunci').value;
    } else {
      q.kunci = overlay.querySelector('#edit-kunci').value.trim();
    }

    if (isUraian && overlay.querySelector('#edit-rubrik')) {
      const rubrikText = overlay.querySelector('#edit-rubrik').value.trim();
      if (rubrikText) {
        q.rubrik_skor = {};
        rubrikText.split('\n').forEach(line => {
          const [k, ...rest] = line.split(':');
          if (k && rest.length) q.rubrik_skor[k.trim()] = rest.join(':').trim();
        });
      }
    }

    overlay.remove();
    document.removeEventListener('keydown', escHandler);
    renderResult(data, formData);
    showToast(`Soal & Kisi-Kisi ${typeLabel} No. ${q.no} berhasil diperbarui.`, 'success');
  });
}

// ============================================================
// DEDICATED QUICK CHANGE IMAGE MODAL (Upload, Link URL, & SVG Visual Engine)
// ============================================================
function openChangeImageModal(type, qIdx, data, formData) {
  const existing = document.querySelector('.soal-image-modal-overlay');
  if (existing) existing.remove();

  let q;
  if (type === 'pg') q = data.pg?.[qIdx];
  else if (type === 'isian') q = data.isian?.data?.[qIdx];
  else if (type === 'uraian') q = data.uraian?.[qIdx];
  if (!q) return;

  let selectedImageUrl = q.gambar?.url || '';
  let selectedSvg = q.gambar?.svg || '';
  let selectedTitle = q.gambar?.title || '';

  const overlay = document.createElement('div');
  overlay.className = 'soal-editor-overlay soal-image-modal-overlay';
  overlay.innerHTML = `
    <div class="soal-editor-modal" style="max-width: 540px;">
      <h3><i class="fas fa-image" style="color:#2563eb"></i> Kelola Gambar / Stimulus Soal No. ${q.no}</h3>
      
      <div style="text-align:center; margin-bottom:16px; background:#f8fafc; padding:12px; border-radius:10px; border:1px dashed #cbd5e1;">
        <label style="margin-bottom:8px; display:block; font-size:11px; font-weight:600; color:#64748b;">Pratinjau Stimulus Visual:</label>
        <div style="display:flex; justify-content:center; align-items:center; min-height:120px;">
          <img id="img-change-preview" src="${selectedImageUrl || ''}" style="max-width:240px; max-height:160px; width:auto; height:auto; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#fff; ${selectedImageUrl ? '' : 'display:none;'}" alt="Pratinjau">
          <p id="img-change-empty" style="color:#94a3b8; font-size:12px; margin:0; ${selectedImageUrl ? 'display:none;' : ''}">Belum ada gambar/diagram yang dipilih</p>
        </div>
      </div>

      <!-- Option 3: Diagram SVG Vektor -->
      <div style="margin-bottom:14px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:10px;">
        <label style="font-size:11.5px; font-weight:700; color:#0369a1; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <i class="fas fa-bezier-curve text-sky-600"></i> Pilih dari 41 Diagram Vektor SVG (Visual Engine)
        </label>
        <div style="display:flex; gap:6px;">
          <select id="modal-svg-select" class="flex-1 text-xs bg-white border border-sky-300 rounded-lg p-2 cursor-pointer" style="margin-bottom:0;">
            <option value="">-- Memuat Katalog 41 Diagram SVG... --</option>
          </select>
          <button type="button" id="modal-btn-apply-svg" class="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap inline-flex items-center gap-1 shadow-sm">
            <i class="fas fa-magic"></i> Pasang
          </button>
        </div>
      </div>

      <!-- Option 1: Upload File -->
      <div style="margin-bottom:12px;">
        <label style="font-size:11px; font-weight:600; color:#475569;"><i class="fas fa-upload mr-1 text-indigo-500"></i> Atau Upload dari Komputer / Laptop:</label>
        <input type="file" id="modal-file-input" accept="image/*" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs cursor-pointer">
      </div>

      <!-- Option 2: URL Link -->
      <div style="margin-bottom:16px;">
        <label style="font-size:11px; font-weight:600; color:#475569;"><i class="fas fa-link mr-1 text-emerald-500"></i> Atau Tempel Link Gambar dari Internet:</label>
        <div style="display:flex; gap:6px;">
          <input type="text" id="modal-url-input" placeholder="https://..." value="${selectedImageUrl.startsWith('data:') ? '' : selectedImageUrl}" style="margin-bottom:0;" class="flex-1 text-xs">
          <button type="button" id="modal-btn-apply-url" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap">Cek Link</button>
        </div>
      </div>

      <div class="editor-actions" style="justify-content:space-between; align-items:center;">
        <button type="button" id="modal-btn-remove-this-img" class="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer">
          <i class="fas fa-trash-alt mr-1"></i> Hapus Gambar
        </button>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-editor-cancel">Batal</button>
          <button type="button" id="modal-btn-save-image" class="btn-editor-save"><i class="fas fa-check mr-1"></i> Terapkan Stimulus</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const previewImg = overlay.querySelector('#img-change-preview');
  const emptyText = overlay.querySelector('#img-change-empty');
  const fileInput = overlay.querySelector('#modal-file-input');
  const urlInput = overlay.querySelector('#modal-url-input');
  const svgSelect = overlay.querySelector('#modal-svg-select');

  // Load SVG catalog from API
  api('/kisi/visual-catalog').then(res => {
    if (res?.data && Array.isArray(res.data)) {
      const categories = {};
      res.data.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
      });
      let html = '<option value="">-- Pilih Template Diagram SVG (41 Pilihan) --</option>';
      for (const [cat, items] of Object.entries(categories)) {
        html += `<optgroup label="${cat}">`;
        items.forEach(it => {
          html += `<option value="${it.id}">${escapeHtml(it.name)} - ${escapeHtml(it.description)}</option>`;
        });
        html += `</optgroup>`;
      }
      svgSelect.innerHTML = html;
    }
  }).catch(() => {
    svgSelect.innerHTML = '<option value="">Gagal memuat katalog SVG</option>';
  });

  const updatePreview = (url) => {
    selectedImageUrl = url;
    if (url) {
      previewImg.src = url;
      previewImg.style.display = 'block';
      emptyText.style.display = 'none';
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
      emptyText.style.display = 'block';
    }
  };

  // SVG apply
  overlay.querySelector('#modal-btn-apply-svg').addEventListener('click', async () => {
    const type = svgSelect.value;
    if (!type) {
      showToast('Pilih salah satu template diagram SVG terlebih dahulu.', 'error');
      return;
    }
    try {
      showToast('Merender diagram SVG...', 'info');
      const res = await api('/kisi/visual-render', {
        method: 'POST',
        body: { type }
      });
      if (res?.data?.dataUri) {
        selectedImageUrl = res.data.dataUri;
        selectedSvg = res.data.svg;
        selectedTitle = res.data.title;
        updatePreview(selectedImageUrl);
        urlInput.value = '';
        fileInput.value = '';
        showToast(`Diagram ${res.data.title} berhasil dipasang.`, 'success');
      }
    } catch (err) {
      showToast('Gagal merender diagram: ' + err.message, 'error');
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file gambar maksimal 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (re) => {
        selectedSvg = '';
        selectedTitle = file.name;
        updatePreview(re.target.result);
        urlInput.value = '';
        showToast('Gambar dari komputer berhasil dipilih.', 'info');
      };
      reader.readAsDataURL(file);
    }
  });

  // URL apply
  overlay.querySelector('#modal-btn-apply-url').addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
      showToast('Masukkan link gambar yang valid.', 'error');
      return;
    }
    selectedSvg = '';
    selectedTitle = 'Gambar Internet';
    updatePreview(url);
    fileInput.value = '';
    showToast('Link gambar berhasil dimuat.', 'info');
  });

  // Remove image
  overlay.querySelector('#modal-btn-remove-this-img').addEventListener('click', () => {
    selectedSvg = '';
    selectedTitle = '';
    updatePreview('');
    urlInput.value = '';
    fileInput.value = '';
    showToast('Gambar dilepas dari pratinjau.', 'info');
  });

  // Cancel
  overlay.querySelector('.btn-editor-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Escape
  const escImgHandler = (e) => {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escImgHandler); }
  };
  document.addEventListener('keydown', escImgHandler);

  // Save
  overlay.querySelector('#modal-btn-save-image').addEventListener('click', () => {
    if (selectedImageUrl) {
      q.gambar = {
        url: selectedImageUrl,
        svg: selectedSvg || undefined,
        type: selectedSvg ? 'svg' : (selectedImageUrl.includes('image/svg+xml') ? 'svg' : 'photo'),
        title: selectedTitle || q.gambar?.title || 'Gambar Ilustrasi',
        credit: selectedSvg ? 'Examplate Visual Engine' : (q.gambar?.credit || 'Upload Manual'),
        deskripsi: q.gambar?.deskripsi || selectedTitle || 'Gambar Ilustrasi'
      };
    } else {
      delete q.gambar;
    }
    overlay.remove();
    document.removeEventListener('keydown', escImgHandler);
    renderResult(data, formData);
    showToast(selectedImageUrl ? `Stimulus pada soal nomor ${q.no} berhasil diperbarui.` : `Gambar pada nomor ${q.no} berhasil dihapus.`, 'success');
  });
}

// ============================================================
// DELETE SOAL WITH AUTO-RENUMBER
// ============================================================
function deleteSoal(type, index, data, formData) {
  let arr;
  let typeLabel;
  if (type === 'pg') { arr = data.pg; typeLabel = 'PG'; }
  else if (type === 'isian') { arr = data.isian?.data; typeLabel = 'Isian'; }
  else if (type === 'uraian') { arr = data.uraian; typeLabel = 'Uraian'; }
  if (!arr || !arr[index]) return;

  const qNo = arr[index].no;

  // Minimum check: at least 1 question must remain per active section
  if (arr.length <= 1) {
    showToast(`Tidak dapat menghapus — minimal harus ada 1 soal ${typeLabel}.`, 'error');
    return;
  }

  // Remove
  arr.splice(index, 1);

  // Renumber all questions
  let runNo = 1;
  if (data.pg) data.pg.forEach((q, i) => { q.no = runNo++; });
  if (data.isian?.data) data.isian.data.forEach(q => { q.no = runNo++; });
  if (data.uraian) data.uraian.forEach(q => { q.no = runNo++; });

  renderResult(data, formData);
  showToast(`Soal ${typeLabel} No. ${qNo} berhasil dihapus. Nomor soal diperbarui otomatis.`, 'info');
}

/**
 * Interactive Crossword Player Modal for Classroom Gaming (3-Column Layout)
 */
function openInteractiveCrosswordGame(cw, data, formData) {
  const existing = document.getElementById('interactive-tts-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'interactive-tts-modal';
  modal.className = 'fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in text-slate-100';

  const rows = cw.grid.length;
  const cols = cw.grid[0].length;

  const mendatar = [];
  const menurun = [];
  cw.placements.forEach(p => {
    let qData = data.isian?.data ? data.isian.data[p.originalIndex] : null;
    const soalRaw = qData ? qData.soal : p.word;
    const cleanSoal = soalRaw.replace(/^(Mendatar:|Menurun:)\s*/i, '').trim();
    const item = { num: p.number, soal: cleanSoal, word: p.word, row: p.row, col: p.col, dir: p.direction };
    if (p.direction === 'H') mendatar.push(item);
    else menurun.push(item);
  });

  mendatar.sort((a, b) => a.num - b.num);
  menurun.sort((a, b) => a.num - b.num);

  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-7xl 2xl:max-w-[1550px] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
      
      <!-- Game Header Bar -->
      <div class="px-6 py-3.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-base font-black shadow-md">
            <i class="fas fa-gamepad"></i>
          </div>
          <div>
            <h3 class="font-extrabold text-base text-white font-display">${escapeHtml(formData.topik || 'Teka-Teki Silang Pembelajaran')}</h3>
            <p class="text-xs text-amber-300/90">${escapeHtml(formData.mataPelajaran || 'Mata Pelajaran')} • ${escapeHtml(formData.jenjangKelas || 'SD')}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div class="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
            <i class="fas fa-stopwatch text-slate-400"></i> <span id="tts-game-timer">00:00</span>
          </div>
          <button id="btn-tts-check" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow transition-all flex items-center gap-1.5 cursor-pointer">
            <i class="fas fa-check-circle"></i> Cek Jawaban
          </button>
          <button id="btn-tts-hint" class="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Buka 1 Huruf">
            <i class="fas fa-lightbulb"></i> Bantuan
          </button>
          <button id="btn-tts-reset" class="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer" title="Kosongkan Kotak">
            <i class="fas fa-undo"></i>
          </button>
          <button id="btn-tts-close" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Game Body: 3 Bagian (Kotak TTS Kiri Paling Besar, Mendatar Tengah, Menurun Kanan) -->
      <div class="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5 min-h-0">
        
        <!-- 1. KIRI: Kotak Grid TTS (Paling Besar & Ideal, lg:col-span-6) -->
        <div class="lg:col-span-6 flex flex-col items-center justify-between p-4 bg-slate-950/60 rounded-2xl sm:rounded-3xl border border-slate-800 h-full overflow-hidden">
          <div class="flex-1 w-full flex items-center justify-center overflow-auto p-2" id="tts-interactive-grid-container"></div>
          <div class="mt-2 pt-2 border-t border-slate-800/80 w-full text-center text-[11px] text-slate-400 shrink-0">
            <span class="inline-block mr-2.5"><kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[9px]">A-Z</kbd> Ketik</span>
            <span class="inline-block mr-2.5"><kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[9px]">Backspace</kbd> Hapus</span>
            <span class="inline-block"><kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[9px]">Panah</kbd> Geser</span>
          </div>
        </div>

        <!-- 2. TENGAH: Soal Mendatar (lg:col-span-3) -->
        <div class="lg:col-span-3 flex flex-col p-4 rounded-2xl sm:rounded-3xl bg-slate-800/70 border border-slate-700/80 h-full overflow-hidden shadow-inner">
          <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-700/80 shrink-0">
            <h4 class="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <i class="fas fa-arrows-alt-h text-sm"></i> Mendatar
            </h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              ${mendatar.length} Soal
            </span>
          </div>
          <div class="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
            ${mendatar.map(item => `
              <div class="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-cyan-950/40 border border-slate-700/60 hover:border-cyan-500/50 transition-all cursor-pointer clue-item group" data-num="${item.num}" data-row="${item.row}" data-col="${item.col}">
                <div class="flex items-baseline justify-between mb-1">
                  <span class="font-extrabold text-xs text-cyan-400 group-hover:text-cyan-300 font-mono">${item.num}.</span>
                  <span class="text-[9px] text-slate-400 font-semibold px-1.5 py-0.5 bg-slate-800/80 rounded border border-slate-700/60">${item.word.length} huruf</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">${escapeHtml(item.soal)}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3. KANAN: Soal Menurun (lg:col-span-3) -->
        <div class="lg:col-span-3 flex flex-col p-4 rounded-2xl sm:rounded-3xl bg-slate-800/70 border border-slate-700/80 h-full overflow-hidden shadow-inner">
          <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-700/80 shrink-0">
            <h4 class="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <i class="fas fa-arrows-alt-v text-sm"></i> Menurun
            </h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-500/30">
              ${menurun.length} Soal
            </span>
          </div>
          <div class="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
            ${menurun.map(item => `
              <div class="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-purple-950/40 border border-slate-700/60 hover:border-purple-500/50 transition-all cursor-pointer clue-item group" data-num="${item.num}" data-row="${item.row}" data-col="${item.col}">
                <div class="flex items-baseline justify-between mb-1">
                  <span class="font-extrabold text-xs text-purple-400 group-hover:text-purple-300 font-mono">${item.num}.</span>
                  <span class="text-[9px] text-slate-400 font-semibold px-1.5 py-0.5 bg-slate-800/80 rounded border border-slate-700/60">${item.word.length} huruf</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">${escapeHtml(item.soal)}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Render Grid Inputs
  const gridContainer = document.getElementById('tts-interactive-grid-container');
  let tableHtml = `<table style="border-collapse: separate; border-spacing: 2px;">`;
  for (let r = 0; r < rows; r++) {
    tableHtml += `<tr>`;
    for (let c = 0; c < cols; c++) {
      const char = cw.grid[r][c];
      if (char !== ' ') {
        const p = cw.placements.find(pl => pl.row === r && pl.col === c);
        const numLabel = p ? `<span class="absolute top-0.5 left-1 text-[8px] font-bold text-slate-400 pointer-events-none">${p.number}</span>` : '';
        tableHtml += `
          <td class="relative w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 border border-slate-600/80 rounded-lg p-0 text-center">
            ${numLabel}
            <input type="text" maxlength="1" data-row="${r}" data-col="${c}" data-correct="${char}" class="tts-cell w-full h-full text-center uppercase font-bold text-sm sm:text-base text-white bg-transparent outline-none focus:bg-indigo-600/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-lg caret-transparent cursor-pointer transition-colors" />
          </td>
        `;
      } else {
        tableHtml += `<td class="w-8 h-8 sm:w-9 sm:h-9"></td>`;
      }
    }
    tableHtml += `</tr>`;
  }
  tableHtml += `</table>`;
  gridContainer.innerHTML = tableHtml;

  // Stopwatch Timer
  let seconds = 0;
  const timerEl = document.getElementById('tts-game-timer');
  const timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);

  // Cell Navigation Logic
  const inputs = Array.from(modal.querySelectorAll('.tts-cell'));
  inputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
      e.target.value = val;
      if (val) {
        // Move to next cell
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        const nextHorizontal = inputs.find(i => parseInt(i.dataset.row) === r && parseInt(i.dataset.col) === c + 1);
        const nextVertical = inputs.find(i => parseInt(i.dataset.row) === r + 1 && parseInt(i.dataset.col) === c);
        const next = nextHorizontal || nextVertical;
        if (next) next.focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);

      if (e.key === 'Backspace' && !input.value) {
        const prevH = inputs.find(i => parseInt(i.dataset.row) === r && parseInt(i.dataset.col) === c - 1);
        const prevV = inputs.find(i => parseInt(i.dataset.row) === r - 1 && parseInt(i.dataset.col) === c);
        const prev = prevH || prevV;
        if (prev) {
          prev.focus();
          prev.value = '';
        }
      } else if (e.key === 'ArrowRight') {
        const target = inputs.find(i => parseInt(i.dataset.row) === r && parseInt(i.dataset.col) === c + 1);
        if (target) target.focus();
      } else if (e.key === 'ArrowLeft') {
        const target = inputs.find(i => parseInt(i.dataset.row) === r && parseInt(i.dataset.col) === c - 1);
        if (target) target.focus();
      } else if (e.key === 'ArrowDown') {
        const target = inputs.find(i => parseInt(i.dataset.row) === r + 1 && parseInt(i.dataset.col) === c);
        if (target) target.focus();
      } else if (e.key === 'ArrowUp') {
        const target = inputs.find(i => parseInt(i.dataset.row) === r - 1 && parseInt(i.dataset.col) === c);
        if (target) target.focus();
      }
    });
  });

  // Clue item click: Focus first cell of word
  modal.querySelectorAll('.clue-item').forEach(item => {
    item.addEventListener('click', () => {
      const row = parseInt(item.dataset.row);
      const col = parseInt(item.dataset.col);
      const targetInput = inputs.find(i => parseInt(i.dataset.row) === row && parseInt(i.dataset.col) === col);
      if (targetInput) targetInput.focus();
    });
  });

  // Button Check Answers
  document.getElementById('btn-tts-check')?.addEventListener('click', () => {
    let correctCount = 0;
    let filledCount = 0;
    inputs.forEach(input => {
      const userVal = input.value.trim().toUpperCase();
      const correctVal = input.dataset.correct;
      input.classList.remove('bg-emerald-600/40', 'border-emerald-500', 'bg-rose-600/40', 'border-rose-500');

      if (userVal) {
        filledCount++;
        if (userVal === correctVal) {
          input.classList.add('bg-emerald-600/40', 'border-emerald-500');
          correctCount++;
        } else {
          input.classList.add('bg-rose-600/40', 'border-rose-500');
        }
      }
    });

    if (filledCount === inputs.length && correctCount === inputs.length) {
      clearInterval(timerInterval);
      showToast('🎉 LUAR BIASA! Seluruh Teka-Teki Silang Berhasil Terpecahkan dengan Sempurna!', 'success');
    } else {
      showToast(`${correctCount} dari ${inputs.length} huruf benar. Terus semangat!`, 'info');
    }
  });

  // Button Hint (Reveal 1 random letter)
  document.getElementById('btn-tts-hint')?.addEventListener('click', () => {
    const unrevealed = inputs.filter(i => i.value.trim().toUpperCase() !== i.dataset.correct);
    if (unrevealed.length > 0) {
      const randomCell = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      randomCell.value = randomCell.dataset.correct;
      randomCell.classList.add('bg-amber-500/30', 'border-amber-400', 'text-amber-300');
      showToast('💡 1 Huruf berhasil dibuka!', 'info');
    } else {
      showToast('Semua kotak sudah terisi dengan benar!', 'success');
    }
  });

  // Button Reset
  document.getElementById('btn-tts-reset')?.addEventListener('click', () => {
    inputs.forEach(input => {
      input.value = '';
      input.className = 'tts-cell w-full h-full text-center uppercase font-bold text-sm sm:text-base text-white bg-transparent outline-none focus:bg-indigo-600/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-lg caret-transparent cursor-pointer transition-colors';
    });
  });

  // Button Close
  document.getElementById('btn-tts-close')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    modal.remove();
  });
}

// ============================================
// Bank Soal Kolaboratif — Full Slide-Over Drawer
// ============================================

async function loadBankSoalCountBadge() {
  try {
    const res = await api('/banksoal/stats');
    if (res.success && res.data) {
      const badge = document.getElementById('bank-soal-count-badge');
      if (badge) {
        const total = Number(res.data.total_soal) || 0;
        if (total > 0) {
          badge.textContent = total;
          badge.classList.remove('hidden');
          // Animasi halus agar pengguna melihat pertambahan secara interaktif
          badge.classList.add('scale-110');
          setTimeout(() => badge.classList.remove('scale-110'), 300);
        } else {
          badge.textContent = '0';
          badge.classList.add('hidden');
        }
      }
      const subtitle = document.getElementById('bs-header-subtitle');
      if (subtitle) {
        subtitle.textContent = `${res.data.total_soal || 0} paket soal · ${res.data.my_soal || 0} milik Anda`;
      }
    }
  } catch (_) { /* ignore */ }
}

function escBs(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatBsDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return `Hari ini, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function renderStars(rating, size = 'text-xs') {
  const full = Math.floor(rating || 0);
  const half = (rating || 0) - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  let h = '';
  for (let i = 0; i < full; i++) h += `<i class="fas fa-star text-amber-400 ${size}"></i>`;
  if (half) h += `<i class="fas fa-star-half-alt text-amber-400 ${size}"></i>`;
  for (let i = 0; i < empty; i++) h += `<i class="far fa-star text-slate-300 ${size}"></i>`;
  return h;
}

// Global reference for refreshing active modal in-place
let activeBankSoalRefresh = null;

async function applyBankSoalPackage(id) {
  try {
    const res = await api(`/banksoal/${id}`);
    if (!res.success || !res.data) {
      showToast('Gagal memuat paket soal', 'error');
      return;
    }
    const soal = res.data;
    try {
      await api(`/banksoal/${id}/use`, { method: 'POST' });
    } catch (_) {}

    const formData = {
      mataPelajaran: soal.mata_pelajaran,
      topik: soal.topik,
      jenjangKelas: soal.jenjang_kelas,
      semester: soal.semester || '',
      jenisUjian: soal.jenis_ujian || '',
      namaSekolah: state.user?.sekolah_nama || state.user?.sekolah || '',
      namaGuru: state.user?.nama || soal.user_nama,
      nipGuru: state.user?.nip || '',
      namaKepalaSekolah: state.user?.kepala_sekolah || '',
      nipKepalaSekolah: state.user?.nip_kepala_sekolah || '',
      isianType: soal.isian_type || 'Standard',
    };

    // Close modals
    document.getElementById('banksoal-modal-root')?.remove();
    document.getElementById('banksoal-drawer-root')?.remove();
    document.getElementById('banksoal-detail-modal')?.remove();

    // Render into result view
    renderResult(soal.content, formData);
    showToast(`Paket soal "${soal.topik}" berhasil dimuat! Siap dicetak atau diekspor ke Word.`, 'success');
  } catch (err) {
    showToast('Gagal menerapkan paket soal: ' + (err.message || 'Error'), 'error');
  }
}

async function openBankSoalDrawer(initialFilters = {}) {
  // Remove any stale modals
  const existing = document.getElementById('banksoal-modal-root') || document.getElementById('banksoal-drawer-root');
  if (existing) existing.remove();

  // Active filter state
  const filters = {
    mapel: initialFilters.mapel || '',
    kelas: initialFilters.kelas || '',
    topik: initialFilters.topik || '',
    sort: initialFilters.sort || 'newest',
    mine: initialFilters.mine || '',
    page: initialFilters.page || 1,
  };

  // Fetch initial stats for select options and header counters
  let stats = { total_soal: 0, my_soal: 0, per_mapel: [], per_kelas: [] };
  try {
    const statsRes = await api('/banksoal/stats');
    if (statsRes.success && statsRes.data) {
      stats = statsRes.data;
      const badge = document.getElementById('bank-soal-count-badge');
      if (badge) {
        const total = Number(stats.total_soal) || 0;
        if (total > 0) {
          badge.textContent = total;
          badge.classList.remove('hidden');
        } else {
          badge.textContent = '0';
          badge.classList.add('hidden');
        }
      }
    }
  } catch (_) {}

  const mapelOptions = (stats.per_mapel || []).map(m => 
    `<option value="${escBs(m.mata_pelajaran)}" ${filters.mapel === m.mata_pelajaran ? 'selected' : ''}>${escBs(m.mata_pelajaran)} (${m.count})</option>`
  ).join('');

  const kelasOptions = [1,2,3,4,5,6].map(k => {
    const kStr = `Kelas ${k}`;
    return `<option value="${kStr}" ${filters.kelas === kStr ? 'selected' : ''}>Kelas ${k}</option>`;
  }).join('');

  const root = document.createElement('div');
  root.id = 'banksoal-modal-root';
  root.className = 'fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fade-in';

  root.innerHTML = `
    <div class="fixed inset-0 bg-black/65 backdrop-blur-md" id="bs-modal-backdrop"></div>
    <div class="bg-white dark:bg-slate-900 w-full max-w-5xl xl:max-w-6xl h-[92vh] max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 relative z-10 flex flex-col overflow-hidden animate-scale-up">

      <!-- Header -->
      <div class="px-6 py-4 sm:px-8 sm:py-4.5 bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-violet-800/40 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shadow-inner">
            <i class="fas fa-database text-lg"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-base sm:text-lg text-white font-display">Bank Soal Kolaboratif</h3>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30">KKG Gugus 3</span>
            </div>
            <p class="text-xs text-violet-200/80" id="bs-header-subtitle">${stats.total_soal} paket soal · ${stats.my_soal} milik Anda</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button id="bs-refresh-btn" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer" title="Segarkan data">
            <i class="fas fa-rotate text-xs"></i>
          </button>
          <button id="bs-modal-close" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer" title="Tutup">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Filters & Sorting Toolbar -->
      <div class="p-4 sm:px-6 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5 shrink-0">
        <!-- Row 1: Search & Dropdowns -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <!-- Search Topik -->
          <div class="sm:col-span-6 relative">
            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" id="bs-filter-topik" value="${escBs(filters.topik)}" placeholder="Cari topik atau materi asesmen..." class="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all">
            <button id="bs-clear-topik" type="button" class="${filters.topik ? '' : 'hidden'} absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Filter Mapel -->
          <div class="sm:col-span-3">
            <select id="bs-filter-mapel" class="w-full text-xs py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer">
              <option value="">Semua Mapel</option>
              ${mapelOptions}
            </select>
          </div>

          <!-- Filter Kelas -->
          <div class="sm:col-span-2">
            <select id="bs-filter-kelas" class="w-full text-xs py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer">
              <option value="">Semua Kelas</option>
              ${kelasOptions}
            </select>
          </div>

          <!-- Soal Saya Toggle -->
          <div class="sm:col-span-1 flex items-center justify-end">
            <label class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:bg-violet-50/50 transition-colors whitespace-nowrap" title="Tampilkan hanya soal yang saya buat">
              <input type="checkbox" id="bs-filter-mine" ${filters.mine ? 'checked' : ''} class="rounded accent-violet-600 cursor-pointer">
              <span class="hidden xl:inline">Soal Saya</span>
              <i class="fas fa-user-check text-[11px] text-violet-600 xl:hidden"></i>
            </label>
          </div>
        </div>

        <!-- Row 2: Sort Tabs & Counter -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div class="flex items-center gap-1.5" id="bs-sort-group">
            <button class="bs-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filters.sort === 'newest' ? 'bg-violet-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50'}" data-sort="newest">
              <i class="fas fa-clock mr-1 text-[11px]"></i>Terbaru
            </button>
            <button class="bs-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filters.sort === 'popular' ? 'bg-violet-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50'}" data-sort="popular">
              <i class="fas fa-fire mr-1 text-[11px]"></i>Populer
            </button>
            <button class="bs-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filters.sort === 'rating' ? 'bg-violet-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50'}" data-sort="rating">
              <i class="fas fa-star mr-1 text-[11px]"></i>Rating Tertinggi
            </button>
          </div>

          <!-- Counter & Reset Filters -->
          <div class="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span id="bs-result-counter" class="font-medium">Memuat...</span>
            <button id="bs-reset-filters-btn" type="button" class="hidden text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1">
              <i class="fas fa-rotate-left text-[10px]"></i> Reset Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Scrollable 2-Column Cards Area -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-900/40" id="bs-cards-container">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="bs-cards-grid">
          <!-- Dynamic cards injected here -->
        </div>
      </div>

      <!-- Pagination Footer -->
      <div id="bs-pagination-container" class="p-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between shrink-0">
        <!-- Pagination controls injected here -->
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Close handlers
  const closeModal = () => {
    root.remove();
    activeBankSoalRefresh = null;
    loadBankSoalCountBadge();
  };
  document.getElementById('bs-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('bs-modal-backdrop')?.addEventListener('click', closeModal);

  // Core function: Load Data In-Place without destroying the modal or resetting inputs!
  let currentFetchId = 0;
  async function loadBankSoalData() {
    const fetchId = ++currentFetchId;
    const grid = document.getElementById('bs-cards-grid');
    const paginationContainer = document.getElementById('bs-pagination-container');
    const counterEl = document.getElementById('bs-result-counter');
    const resetBtn = document.getElementById('bs-reset-filters-btn');
    const clearTopikBtn = document.getElementById('bs-clear-topik');

    if (!grid) return;

    // Toggle clear search button
    if (clearTopikBtn) {
      if (filters.topik) clearTopikBtn.classList.remove('hidden');
      else clearTopikBtn.classList.add('hidden');
    }

    // Toggle reset filter button
    const hasActiveFilters = Boolean(filters.topik || filters.mapel || filters.kelas || filters.mine || filters.sort !== 'newest');
    if (resetBtn) {
      if (hasActiveFilters) resetBtn.classList.remove('hidden');
      else resetBtn.classList.add('hidden');
    }

    // Show smooth skeleton cards while loading
    grid.innerHTML = Array(4).fill(0).map(() => `
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 animate-pulse space-y-3">
        <div class="flex items-center justify-between">
          <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div class="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div class="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div class="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
          <div class="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div class="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    `).join('');

    let url = `/banksoal?page=${filters.page}&limit=10&sort=${filters.sort}`;
    if (filters.mapel) url += `&mapel=${encodeURIComponent(filters.mapel)}`;
    if (filters.kelas) url += `&kelas=${encodeURIComponent(filters.kelas)}`;
    if (filters.topik) url += `&topik=${encodeURIComponent(filters.topik)}`;
    if (filters.mine) url += `&mine=1`;

    try {
      const res = await api(url);
      if (fetchId !== currentFetchId) return; // Discard stale responses

      const items = res.success && res.data ? (res.data.items || []) : [];
      const pagination = res.success && res.data ? (res.data.pagination || { page: 1, totalPages: 1, total: 0 }) : { page: 1, totalPages: 1, total: 0 };

      // Update counter
      if (counterEl) {
        counterEl.textContent = `Menampilkan ${items.length} dari ${pagination.total} paket soal`;
      }

      if (items.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div class="w-16 h-16 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-500 mb-3 text-2xl shadow-inner">
              <i class="fas fa-search"></i>
            </div>
            <h4 class="font-bold text-slate-700 dark:text-slate-200 text-sm">Tidak Ada Paket Soal yang Cocok</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-sm">Coba ubah kata kunci pencarian, pilih jenjang kelas lain, atau tekan tombol reset filter.</p>
            ${hasActiveFilters ? `
              <button onclick="document.getElementById('bs-reset-filters-btn')?.click()" class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 border border-violet-200 dark:border-violet-700 transition-colors">
                <i class="fas fa-rotate-left mr-1.5"></i>Reset Semua Filter
              </button>
            ` : ''}
          </div>
        `;
      } else {
        grid.innerHTML = items.map(item => {
          const isMine = (item.user_id === state.user?.id) || (state.user?.role === 'admin');
          return `
            <div class="banksoal-card bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600 transition-all flex flex-col justify-between group" data-id="${item.id}">
              <div>
                <!-- Top Badges & Quick Actions -->
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                      ${escBs(item.mata_pelajaran)}
                    </span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                      ${escBs(item.jenjang_kelas)}
                    </span>
                    ${item.jenis_ujian ? `<span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${escBs(item.jenis_ujian)}</span>` : ''}
                    ${isMine ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70"><i class="fas fa-check mr-1"></i>Milik Anda</span>` : ''}
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    ${isMine ? `
                      <button type="button" class="bs-quick-delete-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer" data-id="${item.id}" data-topik="${escBs(item.topik)}" title="Hapus paket soal ini dari Bank Soal">
                        <i class="fas fa-trash-alt text-xs"></i>
                      </button>
                    ` : ''}
                    <div class="text-right">
                      <div class="flex items-center gap-0.5">${renderStars(item.avg_rating, 'text-[10px]')}</div>
                      <p class="text-[10px] text-slate-400">${item.total_reviews || 0} review</p>
                    </div>
                  </div>
                </div>

                <!-- Topik / Judul -->
                <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-violet-600 transition-colors cursor-pointer bs-card-title-btn" data-id="${item.id}">
                  ${escBs(item.topik)}
                </h4>

                <!-- Penulis & Metadata -->
                <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span class="truncate max-w-[180px]"><i class="fas fa-user-circle text-slate-400 mr-1"></i>${escBs(item.user_nama)}</span>
                  <span class="text-slate-300 dark:text-slate-600">·</span>
                  <span class="text-[11px]">${formatBsDate(item.created_at)}</span>
                </div>
              </div>

              <!-- Breakdown & Direct Action Buttons -->
              <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-auto space-y-2.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg">
                    ${item.jumlah_pg || 0} PG · ${item.jumlah_isian || 0} Isian · ${item.jumlah_uraian || 0} Uraian
                  </span>
                  <span class="text-violet-600 dark:text-violet-400 text-xs font-semibold flex items-center gap-1">
                    <i class="fas fa-download text-[10px]"></i> ${item.use_count || 0}x digunakan
                  </span>
                </div>

                <div class="flex items-center gap-2 pt-0.5">
                  <button type="button" class="bs-preview-btn flex-1 py-1.5 px-3 rounded-xl border border-violet-200 dark:border-violet-700/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer" data-id="${item.id}">
                    <i class="fas fa-eye text-[11px]"></i> Lihat Soal
                  </button>
                  <button type="button" class="bs-direct-use-btn flex-1 py-1.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer" data-id="${item.id}">
                    <i class="fas fa-download text-[11px]"></i> Gunakan
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      // Render pagination
      if (paginationContainer) {
        if (pagination.totalPages > 1) {
          paginationContainer.innerHTML = `
            <span class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Halaman <strong>${pagination.page}</strong> dari <strong>${pagination.totalPages}</strong> (${pagination.total} soal)
            </span>
            <div class="flex items-center gap-2">
              <button class="bs-page-btn px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1" data-page="${pagination.page - 1}" ${pagination.page <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left text-[10px]"></i> Sebelumnya
              </button>
              <button class="bs-page-btn px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1" data-page="${pagination.page + 1}" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>
                Selanjutnya <i class="fas fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          `;
        } else {
          paginationContainer.innerHTML = `
            <span class="text-[11px] sm:text-xs text-slate-400">Menampilkan seluruh ${pagination.total} paket soal</span>
            <span class="text-[10px] text-slate-400">KKG Gugus 3 Wanayasa</span>
          `;
        }
      }

      // Attach card button listeners
      grid.querySelectorAll('.bs-preview-btn, .bs-card-title-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          openBankSoalDetail(id);
        });
      });

      grid.querySelectorAll('.bs-direct-use-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          applyBankSoalPackage(id);
        });
      });

      grid.querySelectorAll('.bs-quick-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const topikName = btn.dataset.topik || 'paket ini';
          if (!confirm(`Hapus paket soal "${topikName}" dari Bank Soal? Tindakan ini tidak dapat dibatalkan.`)) return;

          try {
            const delRes = await api(`/banksoal/${id}`, { method: 'DELETE' });
            if (delRes.success) {
              showToast(`Paket soal "${topikName}" berhasil dihapus.`, 'info');
              loadBankSoalCountBadge();
              loadBankSoalData();
            } else {
              showToast(delRes.message || 'Gagal menghapus soal', 'error');
            }
          } catch (err) {
            showToast('Gagal menghapus soal: ' + (err.message || 'Error'), 'error');
          }
        });
      });

      paginationContainer?.querySelectorAll('.bs-page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filters.page = parseInt(btn.dataset.page, 10);
          loadBankSoalData();
          document.getElementById('bs-cards-container')?.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

    } catch (err) {
      if (fetchId !== currentFetchId) return;
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-rose-500 bg-rose-50/50 rounded-2xl border border-rose-200 p-6">
          <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p class="font-bold text-sm">Gagal memuat Bank Soal</p>
          <p class="text-xs text-rose-600/80 mt-1">${escBs(err.message || 'Terjadi kesalahan jaringan')}</p>
          <button onclick="activeBankSoalRefresh?.()" class="mt-3 px-4 py-1.5 bg-white border border-rose-300 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-50">
            Coba Lagi
          </button>
        </div>
      `;
    }
  }

  activeBankSoalRefresh = loadBankSoalData;

  // Search filter with live debounce (300ms)
  let debounceTimer = null;
  const topikInput = document.getElementById('bs-filter-topik');
  topikInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filters.topik = topikInput.value.trim();
      filters.page = 1;
      loadBankSoalData();
    }, 300);
  });

  document.getElementById('bs-clear-topik')?.addEventListener('click', () => {
    if (topikInput) topikInput.value = '';
    filters.topik = '';
    filters.page = 1;
    loadBankSoalData();
    topikInput?.focus();
  });

  // Mapel select
  document.getElementById('bs-filter-mapel')?.addEventListener('change', (e) => {
    filters.mapel = e.target.value;
    filters.page = 1;
    loadBankSoalData();
  });

  // Kelas select
  document.getElementById('bs-filter-kelas')?.addEventListener('change', (e) => {
    filters.kelas = e.target.value;
    filters.page = 1;
    loadBankSoalData();
  });

  // Mine checkbox
  document.getElementById('bs-filter-mine')?.addEventListener('change', (e) => {
    filters.mine = e.target.checked ? '1' : '';
    filters.page = 1;
    loadBankSoalData();
  });

  // Sort buttons
  root.querySelectorAll('.bs-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.bs-sort-btn').forEach(b => {
        b.className = 'bs-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50';
      });
      btn.className = 'bs-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-violet-600 text-white shadow-xs';
      filters.sort = btn.dataset.sort;
      filters.page = 1;
      loadBankSoalData();
    });
  });

  // Reset all filters
  document.getElementById('bs-reset-filters-btn')?.addEventListener('click', () => {
    if (topikInput) topikInput.value = '';
    const mapelEl = document.getElementById('bs-filter-mapel');
    if (mapelEl) mapelEl.value = '';
    const kelasEl = document.getElementById('bs-filter-kelas');
    if (kelasEl) kelasEl.value = '';
    const mineEl = document.getElementById('bs-filter-mine');
    if (mineEl) mineEl.checked = false;

    // Reset sort to newest
    root.querySelectorAll('.bs-sort-btn').forEach(b => {
      if (b.dataset.sort === 'newest') {
        b.className = 'bs-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-violet-600 text-white shadow-xs';
      } else {
        b.className = 'bs-sort-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50';
      }
    });

    filters.topik = '';
    filters.mapel = '';
    filters.kelas = '';
    filters.mine = '';
    filters.sort = 'newest';
    filters.page = 1;

    loadBankSoalData();
  });

  // Refresh button
  document.getElementById('bs-refresh-btn')?.addEventListener('click', () => {
    loadBankSoalData();
  });

  // Initial load
  loadBankSoalData();
}

async function openBankSoalDetail(id) {
  const existing = document.getElementById('banksoal-detail-modal');
  if (existing) existing.remove();

  let soal = null;
  try {
    const res = await api(`/banksoal/${id}`);
    if (res.success) soal = res.data;
  } catch (e) {
    showToast('Gagal memuat detail soal: ' + e.message, 'error');
    return;
  }
  if (!soal) { showToast('Soal tidak ditemukan', 'error'); return; }

  const content = soal.content || {};
  const pgCount = Array.isArray(content.pg) ? content.pg.length : 0;
  const isianCount = content.isian?.data ? content.isian.data.length : 0;
  const uraianCount = Array.isArray(content.uraian) ? content.uraian.length : 0;
  const totalSoal = pgCount + isianCount + uraianCount;

  const modal = document.createElement('div');
  modal.id = 'banksoal-detail-modal';
  modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in';

  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="bs-detail-backdrop"></div>
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 border border-slate-200/70">
      <!-- Header -->
      <div class="px-8 py-6 border-b border-slate-200/70 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 flex justify-between items-start sticky top-0 z-10">
        <div class="flex-1 min-w-0 pr-4">
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">${escBs(soal.mata_pelajaran)}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">${escBs(soal.jenjang_kelas)}</span>
            ${soal.jenis_ujian ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">${escBs(soal.jenis_ujian)}</span>` : ''}
          </div>
          <h3 class="font-display text-lg font-bold text-slate-900 dark:text-white">${escBs(soal.topik)}</h3>
          <p class="text-xs text-slate-500 mt-1">Dibuat oleh <strong>${escBs(soal.user_nama)}</strong> · ${escBs(soal.sekolah || '')} · ${formatBsDate(soal.created_at)}</p>
        </div>
        <button id="bs-detail-close" class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm shrink-0 cursor-pointer">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="p-8 space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-2xl border border-violet-200/50 text-center">
            <div class="text-lg font-extrabold text-violet-700 font-mono">${totalSoal}</div>
            <div class="text-[10px] text-violet-600 font-semibold uppercase tracking-wider">Total Soal</div>
          </div>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-200/50 text-center">
            <div class="text-lg font-extrabold text-emerald-700 font-mono">${pgCount}</div>
            <div class="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Pilihan Ganda</div>
          </div>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-200/50 text-center">
            <div class="text-lg font-extrabold text-amber-700 font-mono">${isianCount}</div>
            <div class="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Isian (${escBs(soal.isian_type || 'Standard')})</div>
          </div>
          <div class="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-2xl border border-rose-200/50 text-center">
            <div class="text-lg font-extrabold text-rose-700 font-mono">${uraianCount}</div>
            <div class="text-[10px] text-rose-600 font-semibold uppercase tracking-wider">Uraian</div>
          </div>
        </div>

        <!-- Rating & Usage -->
        <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">${renderStars(soal.avg_rating)}</div>
            <span class="text-sm font-bold text-slate-700">${(soal.avg_rating || 0).toFixed(1)}</span>
            <span class="text-xs text-slate-400">(${soal.total_reviews} review)</span>
          </div>
          <span class="text-xs text-violet-600 font-semibold"><i class="fas fa-download mr-1"></i>Digunakan ${soal.use_count || 0}x</span>
        </div>

        <!-- Preview: Sample PG -->
        ${pgCount > 0 ? `
          <details class="rounded-2xl border border-slate-200 bg-white dark:bg-slate-800/50 overflow-hidden" open>
            <summary class="px-5 py-3 text-sm font-bold text-slate-800 dark:text-white cursor-pointer select-none bg-slate-50 dark:bg-slate-800 border-b border-slate-100">
              <i class="fas fa-list-ol mr-2 text-violet-500"></i>Preview Soal Pilihan Ganda (${pgCount} soal)
            </summary>
            <div class="p-5 space-y-4 text-sm text-slate-700 dark:text-slate-300 max-h-64 overflow-y-auto">
              ${(content.pg || []).slice(0, 5).map((q, i) => `
                <div class="pb-3 ${i < 4 ? 'border-b border-slate-100' : ''}">
                  <p class="font-semibold text-xs text-slate-800 dark:text-white">${q.no || i+1}. ${escBs(q.soal)}</p>
                  ${q.opsi ? `<div class="mt-1.5 ml-4 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                    ${Object.entries(q.opsi).map(([k,v]) => `<p class="${k === q.kunci ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}">${k}. ${escBs(v)} ${k === q.kunci ? '✓' : ''}</p>`).join('')}
                  </div>` : ''}
                  ${q.level ? `<span class="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${q.level === 'HOTS' ? 'bg-rose-100 text-rose-700' : q.level === 'MOTS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">${q.level}</span>` : ''}
                </div>
              `).join('')}
              ${pgCount > 5 ? `<p class="text-xs text-slate-400 italic text-center">...dan ${pgCount - 5} soal PG lainnya</p>` : ''}
            </div>
          </details>
        ` : ''}

        <!-- Preview: Sample Uraian -->
        ${uraianCount > 0 ? `
          <details class="rounded-2xl border border-slate-200 bg-white dark:bg-slate-800/50 overflow-hidden">
            <summary class="px-5 py-3 text-sm font-bold text-slate-800 dark:text-white cursor-pointer select-none bg-slate-50 dark:bg-slate-800 border-b border-slate-100">
              <i class="fas fa-pen-fancy mr-2 text-rose-500"></i>Preview Soal Uraian (${uraianCount} soal)
            </summary>
            <div class="p-5 space-y-4 text-sm text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto">
              ${(content.uraian || []).map((q, i) => `
                <div class="pb-3 ${i < uraianCount - 1 ? 'border-b border-slate-100' : ''}">
                  <p class="font-semibold text-xs text-slate-800 dark:text-white">${q.no || i+1}. ${escBs(q.soal)}</p>
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}

        <!-- Reviews Section -->
        ${(soal.reviews || []).length > 0 ? `
          <div class="space-y-3">
            <h4 class="font-bold text-sm text-slate-800 dark:text-white"><i class="fas fa-comments mr-2 text-amber-500"></i>Ulasan dari Guru Lain</h4>
            ${soal.reviews.map(r => `
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-xs text-slate-700 dark:text-slate-300">${escBs(r.reviewer_nama || 'Guru')}</span>
                  <div class="flex items-center gap-1">${renderStars(r.rating, 'text-[10px]')}</div>
                </div>
                ${r.komentar ? `<p class="text-xs text-slate-500">${escBs(r.komentar)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/70">
          <div class="flex gap-2">
            <button id="bs-use-btn" class="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer">
              <i class="fas fa-download"></i> Gunakan Soal Ini
            </button>
            ${!soal.is_mine ? `
              <button id="bs-rate-btn" class="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full font-semibold text-xs border border-amber-200 transition-all flex items-center gap-2 cursor-pointer">
                <i class="fas fa-star"></i> ${soal.my_review ? 'Edit Rating' : 'Beri Rating'}
              </button>
            ` : `
              <button id="bs-delete-btn" class="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full font-semibold text-xs border border-rose-200 transition-all flex items-center gap-2 cursor-pointer">
                <i class="fas fa-trash-alt"></i> Hapus dari Bank
              </button>
            `}
          </div>
          <button id="bs-detail-close-bottom" class="px-5 py-2.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close
  const closeDetail = () => modal.remove();
  document.getElementById('bs-detail-close')?.addEventListener('click', closeDetail);
  document.getElementById('bs-detail-close-bottom')?.addEventListener('click', closeDetail);
  document.getElementById('bs-detail-backdrop')?.addEventListener('click', closeDetail);

  // Use Soal
  document.getElementById('bs-use-btn')?.addEventListener('click', async () => {
    await applyBankSoalPackage(id);
  });

  // Delete own soal
  document.getElementById('bs-delete-btn')?.addEventListener('click', async () => {
    if (!confirm('Yakin ingin menghapus soal ini dari Bank Soal?')) return;
    try {
      await api(`/banksoal/${id}`, { method: 'DELETE' });
      showToast('Soal berhasil dihapus dari Bank Soal.', 'info');
      closeDetail();
      loadBankSoalCountBadge();
      activeBankSoalRefresh?.();
    } catch (e) {
      showToast('Gagal menghapus: ' + e.message, 'error');
    }
  });

  // Rate / Review
  document.getElementById('bs-rate-btn')?.addEventListener('click', () => {
    openBankSoalRatingModal(id, soal.my_review);
  });
}

function openBankSoalRatingModal(soalId, existingReview) {
  const existing = document.getElementById('banksoal-rating-modal');
  if (existing) existing.remove();

  const currentRating = existingReview?.rating || 0;
  const currentComment = existingReview?.komentar || '';

  const modal = document.createElement('div');
  modal.id = 'banksoal-rating-modal';
  modal.className = 'fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-fade-in';

  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" id="bs-rating-backdrop"></div>
    <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-8 border border-slate-200/70">
      <h3 class="font-display text-lg font-bold text-slate-900 dark:text-white text-center mb-6">
        <i class="fas fa-star text-amber-400 mr-2"></i>Beri Rating
      </h3>

      <div class="flex justify-center gap-2 mb-6" id="bs-star-selector">
        ${[1,2,3,4,5].map(n => `
          <button type="button" class="bs-star-btn text-3xl transition-transform hover:scale-110 cursor-pointer ${n <= currentRating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}" data-star="${n}">
            <i class="fas fa-star"></i>
          </button>
        `).join('')}
      </div>

      <input type="hidden" id="bs-rating-value" value="${currentRating}">

      <textarea id="bs-rating-comment" rows="3" placeholder="Komentar (opsional)..." class="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none">${escBs(currentComment)}</textarea>

      <div class="flex gap-3 mt-6">
        <button id="bs-rating-cancel" class="flex-1 px-4 py-2.5 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
          Batal
        </button>
        <button id="bs-rating-submit" class="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold text-sm shadow-md transition-all cursor-pointer">
          <i class="fas fa-paper-plane mr-1"></i> Kirim Rating
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Star selection
  let selectedRating = currentRating;
  modal.querySelectorAll('.bs-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.star);
      document.getElementById('bs-rating-value').value = selectedRating;
      modal.querySelectorAll('.bs-star-btn').forEach((s, i) => {
        s.className = `bs-star-btn text-3xl transition-transform hover:scale-110 cursor-pointer ${i < selectedRating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`;
      });
    });
  });

  // Close
  const closeRating = () => modal.remove();
  document.getElementById('bs-rating-cancel')?.addEventListener('click', closeRating);
  document.getElementById('bs-rating-backdrop')?.addEventListener('click', closeRating);

  // Submit
  document.getElementById('bs-rating-submit')?.addEventListener('click', async () => {
    const rating = parseInt(document.getElementById('bs-rating-value')?.value);
    const komentar = document.getElementById('bs-rating-comment')?.value || '';

    if (!rating || rating < 1 || rating > 5) {
      showToast('Silakan pilih rating 1–5 bintang.', 'error');
      return;
    }

    try {
      await api(`/banksoal/${soalId}/review`, {
        method: 'POST',
        body: { rating, komentar }
      });
      showToast('Rating berhasil dikirim! Terima kasih.', 'success');
      closeRating();

      // Refresh detail modal
      const detailModal = document.getElementById('banksoal-detail-modal');
      if (detailModal) { detailModal.remove(); await openBankSoalDetail(soalId); }
    } catch (e) {
      showToast('Gagal mengirim rating: ' + e.message, 'error');
    }
  });
}
