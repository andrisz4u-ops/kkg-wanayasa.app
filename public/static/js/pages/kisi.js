import { api } from '../api.js';
import { showToast, showLoading, hideLoading, populateAiModelSelect } from '../utils.js';
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
            <i class="fas fa-folder-open text-amber-500"></i> Riwayat Soal Tersimpan
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
                    <option value="Kelas ${k}" ${
                      (state.user?.mata_pelajaran || '').includes(String(k)) || 
                      (state.user?.role_label || '').includes(String(k)) ||
                      (!state.user?.mata_pelajaran?.match(/[1-6]/) && k === 5) 
                      ? 'selected' : ''
                    }>Kelas ${k}</option>
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

            <label class="asesmen-label">CAPAIAN PEMBELAJARAN (OPSIONAL)</label>
            <textarea name="capaianPembelajaran" rows="3" placeholder="Pelajari CP untuk lebih terfokus..." class="asesmen-input asesmen-textarea"></textarea>
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

            <label class="asesmen-label">KOMPLEKSITAS AUTO</label>
            <select name="hotsRatio" class="asesmen-input">
              <option value="30:40:30">Balanced (30:40:30)</option>
              <option value="50:30:20">Easy (50:30:20)</option>
              <option value="20:30:50">Hard (20:30:50)</option>
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
        <div class="asesmen-result-toolbar">
          <button id="btn-back-form" class="px-5 py-2.5 rounded-full text-sm font-medium border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-secondary)] hover:bg-[#f8f9fa] hover:text-[#111111] transition-colors cursor-pointer"><i class="fas fa-arrow-left mr-2"></i>Kembali ke Form</button>
          <div class="flex gap-2 sm:gap-3 flex-wrap">
            <button id="btn-kisi-history" class="px-4 py-2.5 rounded-full text-sm font-medium border border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 transition-colors cursor-pointer"><i class="fas fa-folder-open mr-1.5 text-amber-500"></i>Riwayat</button>
            <button id="btn-download-doc" class="px-5 py-2.5 rounded-full text-sm font-medium border border-[#10b981]/20 bg-[#f8f9fa] text-[#10b981] hover:bg-[#10b981] hover:text-white transition-colors cursor-pointer"><i class="fas fa-download mr-2"></i>Unduh .docx</button>
            <button id="btn-print" class="px-5 py-2.5 bg-[#111111] text-white rounded-full font-medium text-sm shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-pointer"><i class="fas fa-print mr-2"></i>Cetak / PDF</button>
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
        max-width: 21cm; margin: 0 auto;
        background: white; color: black;
        padding: 1cm;
        font-family: 'Times New Roman', Times, serif;
        font-size: 11pt; line-height: 1.3;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        border-radius: 4px;
        min-height: 29.7cm;
      }
      .asesmen-a4 h4 { font-weight: bold; font-size: 11pt; margin-bottom: 10px; }
      .asesmen-a4 table { border-collapse: collapse; width: 100%; }
      .asesmen-a4 .q-block { margin-bottom: 12px; display: flex; gap: 8px; }
      .asesmen-a4 .q-num { font-weight: bold; min-width: 25px; }
      .asesmen-a4 .q-body { flex: 1; }
      .asesmen-a4 .q-options { display: grid; gap: 2px; margin-top: 4px; }
      .asesmen-a4 .q-options.cols-4 { grid-template-columns: repeat(4, 1fr); }
      .asesmen-a4 .q-options.cols-2 { grid-template-columns: repeat(2, 1fr); }
      .asesmen-a4 .q-options.cols-1 { grid-template-columns: 1fr; }

      @media print {
        #asesmen-form-view, .asesmen-result-toolbar, .sidebar, .app-header { display: none !important; }
        .asesmen-a4 { box-shadow: none; margin: 0; padding: 0; }
      }
    </style>
  `;
}

// Module-level: simpan formData dan raw data terakhir
let _lastFormData = {};
let _lastGeneratedData = {};

// Helper: deteksi apakah teks mengandung karakter Aksara Sunda (Unicode blok U+1B80–U+1BBF)
function containsSundaneseScript(text) {
  if (!text) return false;
  return /[\u1B80-\u1BBF\u1CC0-\u1CCF]/.test(text);
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

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    if (!data.topik || !data.topik.trim()) {
      showToast('Harap masukkan Topik/Materi terlebih dahulu.', 'error');
      return;
    }

    showLoading('AI sedang membuat soal...');

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

  // Back button — reset field konten agar bersih untuk asesmen berikutnya
  document.getElementById('btn-back-form')?.addEventListener('click', () => {
    document.getElementById('asesmen-form-view').classList.remove('hidden');
    document.getElementById('asesmen-result-view').classList.add('hidden');

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
    let defaultKelas = 'Kelas 5';
    for (let k = 1; k <= 6; k++) {
      if ((state.user?.mata_pelajaran || '').includes(String(k)) || (state.user?.role_label || '').includes(String(k))) {
        defaultKelas = `Kelas ${k}`;
        break;
      }
    }
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

  const isianType = data.isian?.type || formData.isianType || 'Standard';

  // Show result view, hide form
  document.getElementById('asesmen-form-view').classList.add('hidden');
  document.getElementById('asesmen-result-view').classList.remove('hidden');

  const canvas = document.getElementById('asesmen-canvas');
  let html = '';

  const origin = window.location.origin;

  // KOP Surat (Dinamis per Sekolah)
  const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;
  html += `
      <div style="text-align:center; margin-bottom: 20px;">
        <img src="${kopSuratUrl}" style="width:100%; height:auto; object-fit:contain;" alt="Kop Surat" crossorigin="anonymous">
      </div>
    `;

  html += `
      <div style="text-align:center; margin-bottom:15px; text-transform:uppercase;">
        <h4 style="text-decoration:underline; font-weight:bold; font-size:12pt; margin-bottom:2px;">
          ${formData.jenisUjian === 'STS' ? 'SUMATIF TENGAH SEMESTER' :
      formData.jenisUjian === 'SAS' ? 'SUMATIF AKHIR SEMESTER' :
        formData.jenisUjian === 'ASAT' ? 'ASESMEN SUMATIF AKHIR TAHUN' :
          formData.jenisUjian}
        </h4>
        <p style="font-weight:bold; font-size:11pt; margin:0">TAHUN PELAJARAN 2026/2027</p>
      </div>
    `;

  // Identity Table
  html += `
      <table class="main-table" style="margin-bottom:20px; font-size:10.5pt">
        <tr>
          <td style="width:15%">Mata Pelajaran</td>
          <td style="width:30%">: ${formData.mataPelajaran}</td>
          <td style="width:15%">Nama Murid</td>
          <td style="width:40%">: ............................................................</td>
        </tr>
        <tr>
          <td>Kelas / Smt</td>
          <td>: ${formData.jenjangKelas} / ${formData.semester}</td>
          <td>Hari / Tgl</td>
          <td>: .................. / .......................</td>
        </tr>
      </table>
    `;

  // PG Section
  if (data.pg && data.pg.length > 0) {
    html += `<h4>I. PILIHAN GANDA</h4>`;
    html += `<p style="font-size:9.5pt; font-style:italic; margin-bottom:10px">Berilah tanda silang (X) pada huruf A, B, C, atau D pada jawaban yang paling benar!</p>`;

    data.pg.forEach(q => {
      const opts = q.opsi || {};
      const allShort = Object.values(opts).every(v => (v || '').length < 20);
      const anyLong = Object.values(opts).some(v => (v || '').length > 55);
      const colClass = allShort ? 'cols-4' : anyLong ? 'cols-1' : 'cols-2';

      let optionsHTML = '';
      if (allShort) {
        optionsHTML = `
          <table class="layout-table" style="width:100%; margin-top:2px;">
            <tr>
              <td style="width:25%; padding:0 4px 1px 0;">A. ${opts.A || '-'}</td>
              <td style="width:25%; padding:0 4px 1px 0;">B. ${opts.B || '-'}</td>
              <td style="width:25%; padding:0 4px 1px 0;">C. ${opts.C || '-'}</td>
              <td style="width:25%; padding:0 0 6px 0;">D. ${opts.D || '-'}</td>
            </tr>
          </table>`;
      } else if (colClass === 'cols-2') {
        optionsHTML = `
          <table class="layout-table" style="width:100%; margin-top:2px;">
            <tr>
              <td style="width:50%; padding:0 4px 1px 0;">A. ${opts.A || '-'}</td>
              <td style="width:50%; padding:0 0 1px 0;">C. ${opts.C || '-'}</td>
            </tr>
            <tr>
              <td style="width:50%; padding:0 4px 6px 0;">B. ${opts.B || '-'}</td>
              <td style="width:50%; padding:0 0 6px 0;">D. ${opts.D || '-'}</td>
            </tr>
          </table>`;
      } else {
        optionsHTML = `
          <table class="layout-table" style="width:100%; margin-top:2px;">
            <tr><td style="padding:0 0 1px 0;">A. ${opts.A || '-'}</td></tr>
            <tr><td style="padding:0 0 1px 0;">B. ${opts.B || '-'}</td></tr>
            <tr><td style="padding:0 0 1px 0;">C. ${opts.C || '-'}</td></tr>
            <tr><td style="padding:0 0 6px 0;">D. ${opts.D || '-'}</td></tr>
          </table>`;
      }

      if (q.gambar && q.gambar.url) {
        // 2-column layout: thumbnail LEFT, soal+opsi RIGHT
        html += `
                <table class="layout-table" style="margin-bottom:4px; width:100%;">
                  <tr>
                    <td style="width:30px; font-weight:bold; vertical-align:top;">${q.no}.</td>
                    <td style="width:160px; vertical-align:top; padding-right:10px; text-align:center;">
                      <div style="width:150px; height:150px; overflow:hidden; display:inline-block;">
                        <img src="${q.gambar.url}" width="150" height="150"
                             style="width:150px; height:150px; object-fit:cover;"
                             crossorigin="anonymous" alt="Gambar Ilustrasi">
                      </div>
                    </td>
                    <td style="vertical-align:top;">
                      <div style="margin-bottom:4px; text-align:justify">${String(q.soal).replace(/\n/g, '<br>')}</div>
                      ${optionsHTML}
                    </td>
                  </tr>
                </table>
              `;
      } else {
        html += `
                <table class="layout-table" style="margin-bottom:4px; width:100%;">
                  <tr>
                    <td style="width:28px; font-weight:bold; vertical-align:top; white-space:nowrap;">${q.no}.</td>
                    <td style="vertical-align:top;">
                      <div style="margin-bottom:4px; text-align:justify">${String(q.soal).replace(/\n/g, '<br>')}</div>
                      ${optionsHTML}
                    </td>
                  </tr>
                </table>
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

    html += `<h4 style="margin-top:40px">${isianTitle}</h4>`;
    html += `<p style="font-size:9.5pt; font-style:italic; margin-bottom:10px">${isianDesc}</p>`;

    if (isianType === 'Menjodohkan') {
      const rightCol = [...data.isian.data].map(q => q.kunci).sort(() => Math.random() - 0.5);
      html += `<table class="layout-table" style="margin-bottom:12px; width:100%">`;
      data.isian.data.forEach((q, i) => {
        const optionLetter = String.fromCharCode(65 + i); // A, B, C...
        html += `
          <tr>
            <td style="width:25px; font-weight:bold;">${q.no}.</td>
            <td style="width:40%; padding-right:10px; text-align:justify;">${String(q.soal)}</td>
            <td style="width:25%; text-align:center;">....................</td>
            <td style="width:5%; font-weight:bold; text-align:right;">${optionLetter}.</td>
            <td style="width:30%; padding-left:10px;">${rightCol[i]}</td>
          </tr>
        `;
      });
      html += `</table>`;
    } else if (isianType === 'Crossword' && data.isian.crossword) {
      const cw = data.isian.crossword;
      if (cw.success && cw.grid) {
        html += `
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

        html += `<div style="margin: 20px 0;">`;
        html += `<table style="border-collapse:collapse; display:block; margin:0 auto; table-layout:fixed; width:auto;">`;
        for (let r = 0; r < cw.grid.length; r++) {
          html += `<tr>`;
          for (let c = 0; c < cw.grid[r].length; c++) {
            const char = cw.grid[r][c];

            // Check if cell needs a number
            let num = '';
            const p = cw.placements.find(pl => pl.row === r && pl.col === c);
            if (p) {
              num = `<span style="font-size:7pt; font-weight:bold; position:relative; top:-6px; left:1px">${p.number}</span>`;
            }

            if (char !== ' ') {
              html += `<td style="width:28px; height:28px; border:1px solid black; background:white; text-align:left; vertical-align:top; border-collapse:collapse; padding:0;">${num}</td>`;
            } else {
              html += `<td style="width:28px; height:28px; border:none; border-collapse:collapse; padding:0;"></td>`;
            }
          }
          html += `</tr>`;
        }
        html += `</table></div>`;

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

        html += `<table class="layout-table" style="width:100%; margin-top:20px;">
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
      data.isian.data.forEach(q => {
        html += `
                <table class="layout-table" style="margin-bottom:6px">
                  <tr>
                    <td style="width:25px; font-weight:bold;">${q.no}.</td>
                    <td><div style="text-align:justify; margin-bottom:8px;">${String(q.soal).replace(/\n/g, '<br>')}</div></td>
                  </tr>
                </table>
              `;
      });
    }
  }

  // Uraian Section
  if (data.uraian && data.uraian.length > 0) {
    html += `<h4 style="margin-top:40px">III. URAIAN</h4>`;
    html += `<p style="font-size:9.5pt; font-style:italic; margin-bottom:10px">Jawablah pertanyaan di bawah ini dengan jelas dan tepat!</p>`;

    data.uraian.forEach(q => {
      html += `
              <table class="layout-table" style="margin-bottom:8px">
                <tr>
                  <td style="width:25px; font-weight:bold;">${q.no}.</td>
                  <td><div style="text-align:justify; margin-bottom:20px;">${String(q.soal).replace(/\n/g, '<br>')}</div></td>
                </tr>
              </table>
            `;
    });
  }

  // Kunci Jawaban
  html += `<br clear="all" style="mso-special-character:line-break; page-break-before:always" />`;
  html += `<h4 style="text-align:center; text-decoration:underline;">KUNCI JAWABAN & PEDOMAN PENSKORAN</h4>`;
  html += `<p style="text-align:center; font-weight:bold; margin-bottom:20px;">${formData.mataPelajaran} - ${formData.jenjangKelas} / ${formData.semester}</p>`;

  if (data.pg && data.pg.length > 0) {
    html += `<h4>I. KUNCI JAWABAN PILIHAN GANDA</h4>`;
    html += `<table class="layout-table" style="margin-bottom:15px; width:auto;"><tr>`;
    const rows = Math.ceil(data.pg.length / 5);
    for (let c = 0; c < 5; c++) {
      html += `<td style="width:80px">`;
      for (let r = 0; r < rows; r++) {
        const idx = (r * 5) + c;
        if (data.pg[idx]) {
          html += `<div style="margin-bottom:2px"><b>${data.pg[idx].no}.</b> &nbsp;${data.pg[idx].kunci}</div>`;
        }
      }
      html += `</td>`;
    }
    html += `</tr></table>`;
  }

  if (data.isian && data.isian.data && data.isian.data.length > 0) {
    const kunciIsianType = data.isian.type || formData.isianType || 'Standard';
    const kunciIsianTitle = kunciIsianType === 'Crossword' ? 'II. KUNCI JAWABAN TEKA-TEKI SILANG' : 'II. KUNCI JAWABAN ISIAN SINGKAT';
    html += `<h4>${kunciIsianTitle}</h4>`;
    html += `<table class="main-table" style="margin-bottom:15px;">`;
    html += `<tr style="background:#f0f0f0"><th>No</th><th>Kunci Jawaban</th></tr>`;
    const sortedIsianKunci = [...data.isian.data].sort((a, b) => (a.no || 0) - (b.no || 0));
    sortedIsianKunci.forEach(q => {
      html += `<tr><td style="text-align:center">${q.no}</td><td>${q.kunci}</td></tr>`;
    });
    html += `</table>`;
  }

  if (data.uraian && data.uraian.length > 0) {
    html += `<h4>III. PEDOMAN PENSKORAN URAIAN</h4>`;
    html += `<table class="main-table" style="margin-bottom:25px;">`;
    html += `<tr style="background:#f0f0f0"><th style="width:5%">No</th><th style="width:50%">Kriteria Jawaban</th><th style="width:15%">Skor Maksimal</th></tr>`;
    data.uraian.forEach(q => {
      let rubrikHtml = '';
      if (q.rubrik_skor && typeof q.rubrik_skor === 'object') {
        rubrikHtml = Object.entries(q.rubrik_skor).map(([k, v]) => `- ${k}: ${v}`).join('<br>');
      }
      html += `<tr>
                <td style="text-align:center">${q.no}</td>
                <td><b>Jawaban:</b><br>${q.kunci}<br><br><b>Rubrik:</b><br>${rubrikHtml || '-'}</td>
                <td style="text-align:center; vertical-align:middle; font-weight:bold;">TBD</td>
               </tr>`;
    });
    html += `</table>`;
  }

  // Lembar Pengesahan
  html += `<table class="layout-table" style="width:100%; margin-top:50px; text-align:center;">
      <tr>
        <td style="width:50%; vertical-align:bottom;">
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <br><br><br><br>
          <p style="text-decoration:underline; font-weight:bold">${formData.namaKepalaSekolah || '..............................'}</p>
          <p>NIP. ${formData.nipKepalaSekolah || '..............................'}</p>
        </td>
        <td style="width:50%; vertical-align:bottom;">
          <p>&nbsp;</p>
          <p>Guru Pengampu</p>
          <br><br><br><br>
          <p style="text-decoration:underline; font-weight:bold">${formData.namaGuru || '..............................'}</p>
          <p>NIP. ${formData.nipGuru || '..............................'}</p>
        </td>
      </tr>
    </table>`;

  canvas.innerHTML = html;
  window.scrollTo(0, 0);

  // Attach interactive crossword game player listener
  if (isianType === 'Crossword' && data.isian?.crossword?.success) {
    document.getElementById('btn-launch-tts-game')?.addEventListener('click', () => {
      openInteractiveCrosswordGame(data.isian.crossword, data, formData);
    });
  }
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
