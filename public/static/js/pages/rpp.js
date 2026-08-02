import { showToast, showLoading, hideLoading } from '../utils.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';

export async function renderRpp() {
  if (!state.user) {
    return renderLockedFeature(
      'Generator RPP Deep Learning',
      'Maaf, fitur ini khusus untuk anggota terdaftar. Silakan login untuk menyusun RPP Lengkap dalam hitungan detik menggunakan teknologi AI terbaru.',
      ['RPP Kurikulum Merdeka Otomatis', 'AI Deep Learning (Gemini, Mistral)', 'Ekspor ke Word & PDF', 'Tanpa Batas Penggunaan']
    );
  }

  return `
    <div class="animate-fade-in" id="rpp-page">
      <!-- FORM VIEW -->
      <div id="rpp-form-view">
        <!-- Header -->
        <div class="rpp-header">
          <div class="rpp-logo-mark">
            <i class="fas fa-layer-group"></i>
          </div>
          <div>
            <h1 class="rpp-title">RPP <span>MERDEKA</span></h1>
            <p class="rpp-subtitle"><i class="fas fa-sparkles"></i> DEEP LEARNING ARCHITECT A4EDU</p>
          </div>
        </div>

        <!-- 3-Column Form -->
        <form id="rpp-form" class="rpp-grid">

          <!-- Column 1: IDENTITAS -->
          <div class="rpp-card">
            <h3 class="rpp-card-title"><i class="fas fa-graduation-cap"></i> Identitas</h3>

            <div class="rpp-row">
              <div class="rpp-col">
                <label class="rpp-label">NAMA SEKOLAH</label>
                <input type="text" name="namaSekolah" value="${state.user?.sekolah_nama || state.user?.sekolah || ''}" class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">TAHUN AJARAN</label>
                <select name="tahunAjaran" class="rpp-input">
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027" selected>2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>
            </div>
            <div class="rpp-row">
              <div class="rpp-col">
                <label class="rpp-label">KEPALA SEKOLAH</label>
                <input type="text" name="namaKepalaSekolah" value="${state.user?.kepala_sekolah || ''}" class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">NIP KS</label>
                <input type="text" name="nipKepalaSekolah" value="${state.user?.nip_kepala_sekolah || ''}" class="rpp-input">
              </div>
            </div>

            <div class="rpp-row">
              <div class="rpp-col">
                <label class="rpp-label">NAMA GURU</label>
                <input type="text" name="namaGuru" value="${state.user?.nama || ''}" class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">NIP GURU</label>
                <input type="text" name="nipGuru" value="${state.user?.nip || ''}" class="rpp-input">
              </div>
            </div>
          </div>

          <!-- Column 2: KURIKULUM -->
          <div class="rpp-card">
            <h3 class="rpp-card-title"><i class="fas fa-book-open"></i> Kurikulum</h3>

            <div class="rpp-row">
              <div class="rpp-col">
                <label class="rpp-label">KELAS</label>
                <select name="jenjangKelas" class="rpp-input">
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
              <div class="rpp-col">
                <label class="rpp-label">SEMESTER</label>
                <select name="semester" class="rpp-input">
                  <option selected>Ganjil</option>
                  <option>Genap</option>
                </select>
              </div>
            </div>

            <label class="rpp-label">MATA PELAJARAN</label>
            <select name="mataPelajaran" class="rpp-input" required>
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

            <label class="rpp-label">TOPIK / MATERI POKOK</label>
            <input type="text" name="topik" placeholder="Topik utama..." class="rpp-input rpp-input-bold" required>

            <div class="rpp-row">
              <div class="rpp-col" style="flex:1.2">
                <label class="rpp-label">ALOKASI WAKTU</label>
                <input type="text" name="alokasiWaktu" value="2 x 35 Menit" class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">PERTEMUAN</label>
                <div class="rpp-counter">
                  <button type="button" id="btn-prt-minus" class="rpp-counter-btn">−</button>
                  <span id="prt-count" class="rpp-counter-val">1P</span>
                  <input type="hidden" name="jumlahPertemuan" value="1">
                  <button type="button" id="btn-prt-plus" class="rpp-counter-btn">+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 3: STRATEGI -->
          <div class="rpp-card">
            <h3 class="rpp-card-title"><i class="fas fa-crosshairs"></i> Strategi</h3>

            <label class="rpp-label">MODEL PEMBELAJARAN</label>
            <select name="strategi" class="rpp-input">
              <option>Problem Based Learning (PBL)</option>
              <option>Project Based Learning (PjBL)</option>
              <option>Discovery Learning</option>
              <option>Inquiry Learning</option>
            </select>

            <label class="rpp-label">LAMPIRKAN LKPD?</label>
            <select name="lampirkanLKPD" id="sel-lkpd" class="rpp-input rpp-input-highlight">
              <option value="Tidak">Tidak</option>
              <option value="Ya" selected>Ya (Otomatis)</option>
            </select>

            <label class="rpp-label">CAPAIAN PEMBELAJARAN (OPSIONAL)</label>
            <textarea name="capaianPembelajaran" rows="3" placeholder="Tulis CP di sini..." class="rpp-input rpp-textarea"></textarea>

            <label class="rpp-label">AI NEURAL ENGINE</label>
            <select name="aiProvider" class="rpp-input">
              <option value="vertex">⚡ Vertex AI</option>
              <option value="gemini">✨ Gemini 2.0 (Gratis)</option>
              <option value="mistral" selected>Mistral Medium</option>
              <option value="z_ai">GLM-4.7</option>
            </select>
          </div>
        </form>

        <!-- Dimensi Profil Pelajar Pancasila -->
        <div class="rpp-profil-bar">
          <span class="rpp-profil-label">DIMENSI PROFIL:</span>
          <div class="rpp-profil-tags" id="profil-tags">
            ${['Keimanan & Ketakwaan', 'Kewargaan', 'Penalaran Kritis', 'Kreativitas', 'Kolaborasi', 'Kemandirian', 'Kesehatan', 'Komunikasi']
      .map(d => `<button type="button" class="rpp-tag" data-dim="${d}">${d}</button>`).join('')}
          </div>
        </div>

        <!-- Generate Button -->
        <div class="rpp-action-center">
          <button type="button" id="btn-generate-rpp" class="rpp-generate-btn">
            <i class="fas fa-magic"></i> Generate RPP Sekarang
          </button>
        </div>
      </div>

        <div id="rpp-result-view" class="hidden">
        <div class="rpp-result-toolbar">
          <button id="btn-rpp-back" class="px-5 py-2.5 rounded-full text-sm font-medium border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-secondary)] hover:bg-[#f8f9fa] hover:text-[#111111] transition-colors"><i class="fas fa-arrow-left mr-2"></i>Kembali</button>
          <div class="flex gap-3">
            <button id="btn-rpp-doc" class="px-5 py-2.5 rounded-full text-sm font-medium border border-[#10b981]/20 bg-[#f8f9fa] text-[#10b981] hover:bg-[#10b981] hover:text-white transition-colors"><i class="fas fa-file-word mr-2"></i>Unduh .docx</button>

            <button id="btn-rpp-print" class="px-5 py-2.5 bg-[#111111] text-white rounded-full font-medium text-sm shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"><i class="fas fa-print mr-2"></i>Cetak / PDF</button>
          </div>
        </div>

        <div id="rpp-canvas" class="rpp-a4">
          <!-- Content rendered here -->
        </div>

        <!-- Lampiran Section (outside A4 canvas, printed separately) -->
        <div id="rpp-lampiran-section" class="mt-6">
          <div id="lampiran-btn-area" class="flex justify-center gap-4 mb-6 print-hidden">
            <button id="btn-generate-lampiran" class="px-8 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <i class="fas fa-plus mr-2"></i>Generate Lampiran Rubrik &amp; Penilaian
            </button>
          </div>
          <div id="lampiran-canvas" class="hidden">
            <!-- Lampiran content rendered here -->
          </div>
        </div>
      </div>
    </div>

    <style>
      /* ===== RPP Header ===== */
      .rpp-header {
        display: flex; align-items: center; justify-content: center;
        gap: 20px; margin-bottom: 32px; padding: 24px;
        background: linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b);
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.3);
      }
      .rpp-logo-mark {
        width: 64px; height: 64px;
        background: rgba(99,102,241,0.15);
        border: 1px solid rgba(99,102,241,0.4);
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; color: #a5b4fc;
        box-shadow: 0 0 30px rgba(99,102,241,0.25);
      }
      .rpp-title {
        font-size: clamp(1.5rem, 5vw, 2.5rem); font-weight: 900;
        letter-spacing: -1.5px; line-height: 1; margin: 0;
        font-family: 'Orbitron','Inter',sans-serif;
        background: linear-gradient(90deg, #e0e7ff, #a5b4fc);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      .rpp-subtitle {
        font-size: 0.8rem; font-weight: 800; margin-top: 6px;
        text-transform: uppercase; letter-spacing: 4px;
        color: #a5b4fc;
        display: flex; align-items: center; gap: 8px;
      }

      /* ===== Form Grid ===== */
      .rpp-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
      }
      @media (max-width: 1100px) { .rpp-grid { grid-template-columns: 1fr; } }

      .rpp-card {
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 16px;
        padding: 25px;
        display: flex; flex-direction: column; gap: 4px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      }
      .rpp-card-title {
        font-size: 1rem; font-weight: 900; text-transform: uppercase;
        letter-spacing: 1px; color: var(--color-text-primary);
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 8px;
      }
      .rpp-card-title i { color: #6366f1; font-size: 1.1rem; }
      .rpp-label {
        display: block; font-size: 10px; font-weight: 800;
        color: var(--color-text-secondary); text-transform: uppercase;
        letter-spacing: 1.2px; margin-top: 14px; margin-bottom: 5px;
      }
      .rpp-input {
        width: 100%; padding: 10px 14px;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-default);
        border-radius: 10px;
        color: var(--color-text-primary);
        font-size: 14px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .rpp-input:focus {
        border-color: #6366f1; outline: none;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
      }
      .rpp-input option { background: var(--color-bg-elevated); color: var(--color-text-primary); }
      .rpp-input::placeholder { color: var(--color-text-tertiary); }
      .rpp-input-bold { font-weight: 800; }
      .rpp-input-highlight { border: 2.5px solid #6366f1 !important; }
      .rpp-textarea { resize: vertical; min-height: 80px; font-family: inherit; }
      .rpp-row { display: flex; gap: 12px; }
      .rpp-col { flex: 1; }

      /* ===== Pertemuan Counter ===== */
      .rpp-counter {
        display: flex; align-items: center; justify-content: center;
        gap: 10px;
        background: var(--color-bg-tertiary);
        border: 1.5px solid var(--color-border-default);
        border-radius: 10px;
        padding: 0 10px; height: 42px;
      }
      .rpp-counter-btn {
        background: transparent; border: none;
        color: var(--color-text-primary);
        font-size: 18px; cursor: pointer; padding: 4px 8px;
        border-radius: 6px; transition: background 0.15s;
      }
      .rpp-counter-btn:hover { background: rgba(99,102,241,0.15); color: #6366f1; }
      .rpp-counter-val { font-weight: 800; font-size: 1rem; color: var(--color-text-primary); }

      /* ===== AI Engines ===== */
      .rpp-ai-engines {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        margin-top: 4px;
      }
      .rpp-engine-option {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 12px;
        border: 1.5px solid var(--color-border-default);
        background: var(--color-bg-tertiary);
        border-radius: 10px;
        font-weight: 700; font-size: 11px;
        letter-spacing: 0.8px; text-transform: uppercase;
        color: var(--color-text-secondary);
        cursor: pointer; transition: all 0.2s;
      }
      .rpp-engine-option:has(input:checked) {
        border-color: #6366f1;
        background: rgba(99,102,241,0.12);
        color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
      }
      .rpp-engine-option input[type="radio"] { accent-color: #6366f1; }
      .rpp-engine-highlight { grid-column: span 2; }

      /* ===== Dimensi Profil Bar ===== */
      .rpp-profil-bar {
        margin-top: 20px; padding: 16px 24px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 16px;
        display: flex; flex-wrap: wrap; gap: 8px;
        align-items: center; justify-content: center;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      }
      .rpp-profil-label {
        font-size: 0.8rem; font-weight: 900; color: var(--color-text-secondary);
        margin-right: 10px; text-transform: uppercase; letter-spacing: 2px;
      }
      .rpp-tag {
        padding: 6px 14px; font-size: 0.85rem; font-weight: 600;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-default);
        border-radius: 8px;
        color: var(--color-text-secondary);
        cursor: pointer; transition: all 0.2s;
      }
      .rpp-tag:hover {
        border-color: #6366f1;
        color: #6366f1;
      }
      .rpp-tag.active {
        background: rgba(99,102,241,0.12); color: #6366f1;
        border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        font-weight: 700;
      }

      /* ===== Generate Button ===== */
      .rpp-action-center { text-align: center; margin-top: 28px; }
      .rpp-generate-btn {
        padding: 14px 56px;
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        border: none; color: #fff;
        border-radius: 14px;
        font-weight: 800; font-size: 15px;
        letter-spacing: 1px; cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 8px 32px rgba(99,102,241,0.3);
      }
      .rpp-generate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(99,102,241,0.45);
      }
      .rpp-generate-btn:disabled {
        opacity: 0.5; cursor: not-allowed;
        transform: none;
      }

      /* ===== Result View ===== */
      .rpp-result-toolbar {
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 12px;
        padding: 16px 24px; margin-bottom: 24px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 12px;
        position: sticky; top: 16px; z-index: 50;
      }
      .rpp-a4 {
        max-width: 21cm; margin: 0 auto;
        background: white; color: black;
        padding: 1.27cm;
        font-family: 'Times New Roman', Times, serif;
        font-size: 11pt; line-height: 1.5;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        border-radius: 4px;
        min-height: 29.7cm;
      }
      .rpp-a4 h2 { text-transform: uppercase; margin: 10px 0; text-align: center; }
      .rpp-a4 h3, .rpp-a4 h4 { font-weight: bold; font-size: 11pt; margin: 10px 0; }
      .rpp-a4 table.main-table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
      .rpp-a4 table.main-table th, .rpp-a4 table.main-table td { border: 1px solid black; padding: 8px 12px; vertical-align: top; word-wrap: break-word; }
      .rpp-a4 table.no-border { border-collapse: collapse; width: 100%; border: none; }
      .rpp-a4 table.no-border th, .rpp-a4 table.no-border td { border: none; padding: 0; }
      .rpp-a4 .section-title {
        font-weight: bold; font-size: 11pt; text-transform: uppercase;
        margin-top: 16px; margin-bottom: 6px;
        text-decoration: underline;
      }

      @media print {
        #rpp-form-view, .rpp-result-toolbar, .sidebar, .app-header { display: none !important; }
        .rpp-a4 { box-shadow: none; margin: 0; padding: 0; }
      }
    </style>
  `;
}

// Store current RPP state for DOCX download
let currentRppFormData = null;
let currentRppContent = null;
let currentLampiran = null;

export function initRpp() {
  const form = document.getElementById('rpp-form');
  if (!form) return;

  const selectedDimensions = new Set();

  // Profil dimension tags
  document.querySelectorAll('.rpp-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const dim = tag.dataset.dim;
      if (selectedDimensions.has(dim)) {
        selectedDimensions.delete(dim);
        tag.classList.remove('active');
      } else {
        selectedDimensions.add(dim);
        tag.classList.add('active');
      }
    });
  });

  const prtCount = document.getElementById('prt-count');
  const prtInput = form.querySelector('input[name="jumlahPertemuan"]');
  const btnMinus = document.getElementById('btn-prt-minus');
  const btnPlus = document.getElementById('btn-prt-plus');
  
  if (btnMinus) {
    btnMinus.onclick = () => {
      let currentVal = parseInt(prtInput.value, 10) || 1;
      let p = Math.max(1, currentVal - 1);
      prtCount.textContent = p + 'P';
      prtInput.value = p;
    };
  }
  
  if (btnPlus) {
    btnPlus.onclick = () => {
      let currentVal = parseInt(prtInput.value, 10) || 1;
      let p = Math.min(10, currentVal + 1);
      prtCount.textContent = p + 'P';
      prtInput.value = p;
    };
  }

  // LKPD highlight
  const selLKPD = document.getElementById('sel-lkpd');
  if (selLKPD) {
    selLKPD.addEventListener('change', () => {
      selLKPD.classList.toggle('rpp-input-highlight', selLKPD.value === 'Ya');
    });
  }

  // Generate button
  document.getElementById('btn-generate-rpp')?.addEventListener('click', async () => {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.profilLulusan = Array.from(selectedDimensions);

    if (!data.mataPelajaran || !data.mataPelajaran.trim()) {
      showToast('Harap isi Mata Pelajaran.', 'error'); return;
    }
    if (!data.topik || !data.topik.trim()) {
      showToast('Harap isi Topik/Materi terlebih dahulu.', 'error'); return;
    }

    const btn = document.getElementById('btn-generate-rpp');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang Menyusun RPP...';
    showLoading('AI sedang menyusun RPP Deep Learning...', 'Proses ini membutuhkan 30-60 detik');

    try {
      const result = await api('/rpp/generate', {
        method: 'POST',
        body: data,
        timeout: 300000 // 5 menit untuk AI generation agar tidak timeout
      });

      if (result.success) {
        renderResult(result.data, data);
        showToast('RPP berhasil digenerate!', 'success');
      } else {
        showToast(result.error?.message || 'Gagal generate RPP', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error: ' + err.message, 'error');
    } finally {
      hideLoading();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-magic"></i> Generate RPP Sekarang';
    }
  });

  // Initialize Lampiran Button
  initLampiranBtn();

  document.getElementById('btn-rpp-back')?.addEventListener('click', () => {
    document.getElementById('rpp-form-view').classList.remove('hidden');
    document.getElementById('rpp-result-view').classList.add('hidden');
    
    // Clear the form fields
    const formEl = document.getElementById('rpp-form');
    if (formEl) formEl.reset();
    
    // Reset Dimensi Profil tags (class name: 'active', not 'rpp-tag-active')
    selectedDimensions.clear();
    document.querySelectorAll('.rpp-tag').forEach(tag => tag.classList.remove('active'));
    
    const prtCount = document.getElementById('prt-count');
    if (prtCount) prtCount.textContent = '1P';
    const numPrt = document.querySelector('input[name="jumlahPertemuan"]');
    if (numPrt) numPrt.value = '1';
    
    const selLKPD = document.getElementById('sel-lkpd');
    if (selLKPD) selLKPD.classList.remove('rpp-input-highlight');

    // Reset lampiran state when going back
    currentLampiran = null;
    const lampiranCanvas = document.getElementById('lampiran-canvas');
    if (lampiranCanvas) { lampiranCanvas.classList.add('hidden'); lampiranCanvas.innerHTML = ''; }
    const btnArea = document.getElementById('lampiran-btn-area');
    if (btnArea) {
      btnArea.innerHTML = `
        <button id="btn-generate-lampiran" class="px-8 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <i class="fas fa-plus mr-2"></i>Generate Lampiran Rubrik &amp; Penilaian
        </button>`;
      initLampiranBtn();
    }
  });

  // Print
  document.getElementById('btn-rpp-print')?.addEventListener('click', () => window.print());

  // Download DOCX - server-side proper DOCX generation
  document.getElementById('btn-rpp-doc')?.addEventListener('click', async () => {
    if (!currentRppFormData || !currentRppContent) {
      showToast('Tidak ada data RPP. Silakan generate terlebih dahulu.', 'error');
      return;
    }
    const btn = document.getElementById('btn-rpp-doc');
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyiapkan DOCX...';
    showToast('Menyiapkan dokumen DOCX...', 'info');

    try {
      const response = await fetch('/api/rpp/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: currentRppFormData,
          content: currentRppContent,
          lampiran: currentLampiran || null,
          kopSuratUrl: state.user?.kop_surat_url || null
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Gagal mengunduh DOCX');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const topik = currentRppFormData.topik || 'RPP';
      const mapel = currentRppFormData.mataPelajaran || 'Mapel';
      a.download = `RPP_${String(mapel).replace(/\s+/g, '_')}_${String(topik).replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('RPP berhasil diunduh sebagai DOCX!', 'success');
    } catch (err) {
      console.error('RPP DOCX Error:', err);
      showToast('Gagal download DOCX: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });
}

/* ========== Formatting Helpers ========== */
function formatText(text) {
  if (!text && text !== 0) return '-';
  if (typeof text === 'object') {
    if (Array.isArray(text)) {
      text = text.map(item => `- ${typeof item === 'object' ? JSON.stringify(item) : item}`).join('\n');
    } else {
      text = Object.entries(text).map(([k, v]) => `- **${k}**: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
    }
  }
  let safeText = String(text)
    .replace(/\\rightarrow/g, '→')
    .replace(/\$|\$/g, '')
    .replace(/\\\\/g, '')
    .replace(/([^\n])\s+-\s+/g, '$1\n- ')
    .replace(/([^\n])\s+-(?=[A-Z])/g, '$1\n- ');

  return safeText.split('\n').filter(l => l.trim()).map(line => {
    let t = line.trim();
    // Handle **bold** markers
    const parts = t.split('**');
    let html = parts.map((p, i) => i % 2 === 1 ? `<strong>${p}</strong>` : p).join('');

    if (t.startsWith('-')) {
      html = html.replace(/^-+\s*/, '').trim();
      return `<p style="margin: 0 0 4px 25px; text-indent:-15px; text-align:justify;">&#8226; &nbsp; ${html}</p>`;
    } else if (/^\d+\./.test(t)) {
      const match = t.match(/^(\d+\.)\s*/);
      const prefix = match ? match[1] : '';
      html = html.replace(/^\d+\.\s*/, '').trim();
      return `<p style="margin: 0 0 4px 25px; text-indent:-15px; text-align:justify;">${prefix} &nbsp; ${html}</p>`;
    }

    return `<p style="margin: 0 0 4px 0; text-align:justify;">${html}</p>`;
  }).join('');
}

/* ========== Render RPP Result ========== */
function renderResult(data, formData) {
  // Store for DOCX download
  currentRppContent = data;
  currentRppFormData = formData;

  document.getElementById('rpp-form-view').classList.add('hidden');
  document.getElementById('rpp-result-view').classList.remove('hidden');

  const canvas = document.getElementById('rpp-canvas');
  let h = '';

  // Kop Sekolah Resmi (Dinamis per Sekolah)
  const origin = window.location.origin;
  const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;
  h += `<div style="text-align:center; margin-bottom: 20px;">
          <img src="${kopSuratUrl}" style="width:100%; height:auto; object-fit:contain;" alt="Kop Surat" crossorigin="anonymous">
        </div>`;

  // Judul RPP
  h += `<div style="text-align:center; margin-top:20px;">`;
  h += `<h2 style="font-size:14pt; text-decoration:underline; font-weight:bold; margin-bottom:4px; text-transform:uppercase;">MODUL AJAR / RPP</h2>`;
  h += `<h3 style="font-size:12pt; font-weight:bold; margin-top:0;">KURIKULUM MERDEKA</h3>`;
  h += `</div>`;

  // Identity Table
  h += `<table class="main-table">
      <tr><td style="width:30%"><b>Satuan Pendidikan</b></td><td>: ${formData.namaSekolah || '-'}</td></tr>
      <tr><td><b>Nama Guru</b></td><td>: ${formData.namaGuru || '-'}</td></tr>
      <tr><td><b>Mata Pelajaran</b></td><td>: ${formData.mataPelajaran || '-'}</td></tr>
      <tr><td><b>Topik / Materi</b></td><td>: ${formData.topik || '-'}</td></tr>
      <tr><td><b>Kelas / Semester</b></td><td>: ${formData.jenjangKelas || '-'} / ${formData.semester || '-'}</td></tr>
      <tr><td><b>Alokasi Waktu</b></td><td>: ${formData.alokasiWaktu || '-'}</td></tr>
      <tr><td><b>Model Pembelajaran</b></td><td>: ${formData.strategi || '-'}</td></tr>
    </table>`;

  // A. Identifikasi
  const id = data.identifikasi || {};
  h += `<div class="section-title">A. IDENTIFIKASI MASALAH</div>`;
  h += `<table class="main-table">
      <tr><td style="width:30%"><b>Kesiapan Belajar</b></td><td>${formatText(id.kesiapan)}</td></tr>
      <tr><td><b>Karakteristik Murid</b></td><td>${formatText(id.karakteristik)}</td></tr>
      <tr><td><b>Kebutuhan Khusus</b></td><td>${formatText(id.kebutuhan)}</td></tr>
    </table>`;

  // B. Desain Pembelajaran
  const ds = data.desain || {};
  h += `<div class="section-title">B. DESAIN PEMBELAJARAN</div>`;
  h += `<table class="main-table">
      <tr><td style="width:30%"><b>Capaian Pembelajaran</b></td><td>${formatText(ds.capaian)}</td></tr>
      <tr><td><b>Metode & Strategi</b></td><td>${formatText(ds.metode_pembelajaran || ds.metode_relevan)}</td></tr>
    </table>`;

  // Sarana Prasarana
  const sp = ds.sarana_prasarana || {};
  if (sp.sumber_belajar || sp.media || sp.alat_peraga) {
    h += `<table class="main-table">
          <tr><td style="width:30%"><b>Sumber Belajar</b></td><td>${formatText(sp.sumber_belajar)}</td></tr>
          <tr><td><b>Media</b></td><td>${formatText(sp.media)}</td></tr>
          <tr><td><b>Alat Peraga</b></td><td>${formatText(sp.alat_peraga)}</td></tr>
        </table>`;
  }

  // Diferensiasi
  const dif = ds.diferensiasi || {};
  if (dif.visual || dif.auditori || dif.kinestetik) {
    h += `<table class="main-table">
          <tr><th colspan="2" style="text-align:center; background:#f3f4f6">Diferensiasi Pembelajaran</th></tr>
          <tr><td style="width:30%"><b>Visual</b></td><td>${formatText(dif.visual)}</td></tr>
          <tr><td><b>Auditori</b></td><td>${formatText(dif.auditori)}</td></tr>
          <tr><td><b>Kinestetik</b></td><td>${formatText(dif.kinestetik)}</td></tr>
        </table>`;
  }

  // C. Skenario Pembelajaran
  h += `<div class="section-title">C. SKENARIO PEMBELAJARAN</div>`;

  const pertemuan = data.pertemuan || [];
  pertemuan.forEach(p => {
    h += `<h4 style="text-decoration:underline; margin-top:16px">PERTEMUAN ${p.nomor}</h4>`;

    // Tujuan Pertemuan
    const tp = p.tujuan_pertemuan || p.tujuan || [];
    if (tp.length > 0) {
      h += `<div style="margin-bottom:8px"><b>Tujuan Pembelajaran:</b></div>`;
      h += `<ol style="margin:0 0 10px 20px">`;
      tp.forEach(t => { h += `<li style="text-align:justify">${t}</li>`; });
      h += `</ol>`;
    }

    // Kegiatan Table
    const k = p.kegiatan || {};
    const phases = [
      { key: 'pendahuluan', label: 'PENDAHULUAN', color: '#e0f2fe' },
      { key: 'mindful', label: 'MINDFUL (Berkesadaran)', color: '#fef3c7' },
      { key: 'meaningful', label: 'MEANINGFUL (Bermakna)', color: '#dcfce7' },
      { key: 'joyful', label: 'JOYFUL (Menggembirakan)', color: '#fce7f3' },
      { key: 'penutup', label: 'PENUTUP', color: '#f3e8ff' }
    ];

    h += `<table class="main-table">
          <tr style="background:#1e293b; color:white">
            <th style="width:25%; color:white">Fase</th>
            <th style="width:55%; color:white">Kegiatan</th>
            <th style="width:20%; color:white; text-align:center">Waktu</th>
          </tr>`;

    phases.forEach(ph => {
      const content = k[ph.key];
      if (content) {
        h += `<tr>
                  <td style="background:${ph.color}; font-weight:bold">${ph.label}</td>
                  <td>${formatText(content.isi)}</td>
                  <td style="text-align:center; font-weight:bold">${content.waktu || '-'}</td>
                </tr>`;
      }
    });
    h += `</table>`;

    // LKPD
    if (p.lkpd) {
      h += `<br clear="all" style="mso-special-character:line-break; page-break-before:always" />`;
      h += `<div style="margin-top:10px;">`;
      h += `<h4 style="text-decoration:underline; text-align:center; text-transform:uppercase; margin-bottom:20px;">LEMBAR KERJA PESERTA DIDIK (LKPD) - PERTEMUAN ${p.nomor}</h4>`;
      h += `<table class="main-table" style="margin-bottom:15px;">
              <tr>
                <td style="width:20%; font-weight:bold;">Nama Murid/Kelompok</td>
                <td style="width:30%;">: ................................</td>
                <td style="width:20%; font-weight:bold;">Kelas/Semester</td>
                <td style="width:30%;">: ${formData.jenjangKelas || '-'} / ${formData.semester || '-'}</td>
              </tr>
            </table>`;

      h += `<h4 style="margin:15px 0 5px 0;">A. Petunjuk, Identitas & Tujuan</h4>`;
      h += `<div style="padding-left:15px; margin-bottom:15px;">`;
      h += formatText(p.lkpd.identitas_petunjuk);
      h += formatText(p.lkpd.tujuan_siswa);
      h += `</div>`;

      h += `<h4 style="margin:15px 0 5px 0;">B. Masalah / Kasus</h4>`;
      h += `<div style="padding-left:15px; margin-bottom:15px; background-color:#f8f9fa; border:1px solid #ccc; padding:10px;">`;
      h += formatText(p.lkpd.masalah);
      h += `</div>`;

      h += `<h4 style="margin:15px 0 5px 0;">C. Aktivitas Murid</h4>`;
      h += `<div style="padding-left:15px; margin-bottom:15px;">`;
      h += formatText(p.lkpd.aktivitas);
      h += `</div>`;

      h += `<h4 style="margin:15px 0 5px 0;">D. Hasil Kerja</h4>`;
      h += `<div style="padding-left:15px; margin-bottom:15px; min-height:100px; border:1px dashed #000; padding:15px;">`;
      h += formatText(p.lkpd.hasil_kerja);
      h += `</div>`;

      h += `<h4 style="margin:15px 0 5px 0;">E. Soal Penilaian</h4>`;
      h += `<div style="padding-left:15px; margin-bottom:20px;">`;
      h += formatText(p.lkpd.penilaian);
      h += `</div>`;

      h += `</div>`;
    }
  });

  // D. Asesmen
  const asm = data.asesmen || {};
  if (asm.formatif || asm.sumatif) {
    h += `<div class="section-title">D. ASESMEN</div>`;
    h += `<table class="main-table">
          <tr><td style="width:30%"><b>Formatif</b></td><td>${formatText(asm.formatif)}</td></tr>
          <tr><td><b>Sumatif</b></td><td>${formatText(asm.sumatif)}</td></tr>
        </table>`;
  }

  // Tanda Tangan
  h += `<table class="no-border" style="width:100%; margin-top:50px;">
      <tr>
        <td style="width:50%; text-align:center; vertical-align:bottom;">
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <br><br><br><br>
          <p style="text-decoration:underline; font-weight:bold">${formData.namaKepalaSekolah || '..............................'}</p>
          <p>NIP. ${formData.nipKepalaSekolah || '..............................'}</p>
        </td>
        <td style="width:50%; text-align:center; vertical-align:bottom;">
          <p>&nbsp;</p>
          <p>Guru Pengampu</p>
          <br><br><br><br>
          <p style="text-decoration:underline; font-weight:bold">${formData.namaGuru || '..............................'}</p>
          <p>NIP. ${formData.nipGuru || '..............................'}</p>
        </td>
      </tr>
    </table>`;

  canvas.innerHTML = h;
  window.scrollTo(0, 0);
}

/* ========== Render Lampiran Rubrik & Penilaian ========== */
function renderLampiran(attachments) {
  const container = document.getElementById('lampiran-canvas');
  const btnArea = document.getElementById('lampiran-btn-area');
  if (!container) return;

  let h = '';
  h += `<div class="rpp-a4" style="margin-top: 0; page-break-before: always;">`;
  h += `<div style="text-align:center; margin-bottom: 32px; border-top: 3px double #1e293b; padding-top: 24px;">`;
  h += `<h3 style="font-size:14pt; font-weight:800; text-transform:uppercase; margin:0; text-decoration:underline;">LAMPIRAN ASESMEN &amp; RUBRIK PENILAIAN</h3>`;
  h += `</div>`;

  // 1. Rubrik Kognitif
  if (attachments.kognitif) {
    h += `<div style="margin-bottom:32px;">
      <h4 style="background:#f1f5f9; padding:8px; border-left:4px solid #3b82f6; margin-bottom:12px; font-weight:bold;">1. RUBRIK PENILAIAN KOGNITIF (Pengetahuan)</h4>
      <p style="margin-bottom:12px; font-style:italic;">${attachments.kognitif.deskripsi || ''}</p>
      <table class="main-table">
        <thead>
          <tr style="background:#e2e8f0;">
            <th style="text-align:center;">Kriteria / Indikator</th>
            <th style="text-align:center; width:18%">Sangat Baik (4)</th>
            <th style="text-align:center; width:18%">Baik (3)</th>
            <th style="text-align:center; width:18%">Cukup (2)</th>
            <th style="text-align:center; width:18%">Perlu Bimbingan (1)</th>
          </tr>
        </thead>
        <tbody>`;
    (attachments.kognitif.tabel || []).forEach(row => {
      h += `<tr>
        <td style="font-weight:bold;">${row.kriteria || '-'}</td>
        <td>${row.skor_4 || '-'}</td>
        <td>${row.skor_3 || '-'}</td>
        <td>${row.skor_2 || '-'}</td>
        <td>${row.skor_1 || '-'}</td>
      </tr>`;
    });
    h += `</tbody></table></div>`;
  }

  // 2. Rubrik Keterampilan
  if (attachments.keterampilan) {
    h += `<div style="margin-bottom:32px;">
      <h4 style="background:#f1f5f9; padding:8px; border-left:4px solid #10b981; margin-bottom:12px; font-weight:bold;">2. RUBRIK PENILAIAN KETERAMPILAN (Praktik/Kinerja)</h4>
      <p style="margin-bottom:12px; font-style:italic;">${attachments.keterampilan.deskripsi || ''}</p>
      <table class="main-table">
        <thead>
          <tr style="background:#e2e8f0;">
            <th style="text-align:center;">Aspek Keterampilan</th>
            <th style="text-align:center; width:18%">Sangat Mahir (4)</th>
            <th style="text-align:center; width:18%">Mahir (3)</th>
            <th style="text-align:center; width:18%">Cukup (2)</th>
            <th style="text-align:center; width:18%">Perlu Latihan (1)</th>
          </tr>
        </thead>
        <tbody>`;
    (attachments.keterampilan.tabel || []).forEach(row => {
      h += `<tr>
        <td style="font-weight:bold;">${row.aspek || '-'}</td>
        <td>${row.skor_4 || '-'}</td>
        <td>${row.skor_3 || '-'}</td>
        <td>${row.skor_2 || '-'}</td>
        <td>${row.skor_1 || '-'}</td>
      </tr>`;
    });
    h += `</tbody></table></div>`;
  }

  // 3. Jurnal Sikap
  if (attachments.sikap) {
    h += `<div style="margin-bottom:20px;">
      <h4 style="background:#f1f5f9; padding:8px; border-left:4px solid #f59e0b; margin-bottom:12px; font-weight:bold;">3. JURNAL PENILAIAN SIKAP (Profil Pelajar Pancasila)</h4>
      <p style="margin-bottom:8px; font-style:italic;">${attachments.sikap.deskripsi || ''}</p>
      <p style="margin-bottom:12px;"><strong>Catatan Guru:</strong> ${attachments.sikap.catatan || '-'}</p>
      <table class="main-table">
        <thead>
          <tr style="background:#e2e8f0;">
            <th style="text-align:center; width:40px">No</th>
            <th style="text-align:center;">Dimensi Sikap</th>
            <th style="text-align:center;">Indikator Perilaku yang Diamati</th>
            <th style="text-align:center; width:140px">Catatan Kejadian</th>
            <th style="text-align:center; width:100px">Tindak Lanjut</th>
          </tr>
        </thead>
        <tbody>`;
    (attachments.sikap.indikator || []).forEach((item, idx) => {
      h += `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-weight:bold;">${item}</td>
        <td>.....................................................................</td>
        <td></td>
        <td></td>
      </tr>`;
    });
    h += `</tbody></table></div>`;
  }

  h += `</div>`; // close rpp-a4

  container.innerHTML = h;
  container.classList.remove('hidden');

  // Update button area: show delete button
  if (btnArea) {
    btnArea.innerHTML = `
      <button id="btn-delete-lampiran" class="px-6 py-2.5 rounded-full text-sm font-medium border border-red-300 text-red-500 hover:bg-red-50 transition-colors print-hidden">
        <i class="fas fa-trash mr-2"></i>Hapus Lampiran
      </button>`;
    document.getElementById('btn-delete-lampiran')?.addEventListener('click', () => {
      currentLampiran = null;
      container.innerHTML = '';
      container.classList.add('hidden');
      btnArea.innerHTML = `
        <button id="btn-generate-lampiran" class="px-8 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <i class="fas fa-plus mr-2"></i>Generate Lampiran Rubrik &amp; Penilaian
        </button>`;
      // Re-attach listener
      initLampiranBtn();
    });
  }

  // Scroll to lampiran
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initLampiranBtn() {
  document.getElementById('btn-generate-lampiran')?.addEventListener('click', async () => {
    if (!currentRppFormData) {
      showToast('Generate RPP terlebih dahulu sebelum membuat lampiran.', 'error');
      return;
    }
    const btn = document.getElementById('btn-generate-lampiran');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Membuat Lampiran...';
    showLoading('AI sedang menyusun rubrik penilaian...', 'Proses ini membutuhkan 20-40 detik');
    try {
      const fd = new FormData(document.getElementById('rpp-form'));
      const aiProvider = fd.get('aiProvider') || 'mistral';
      const result = await api('/rpp/lampiran', {
        method: 'POST',
        body: { mataPelajaran: currentRppFormData.mataPelajaran, topik: currentRppFormData.topik, jenjangKelas: currentRppFormData.jenjangKelas, aiProvider },
        timeout: 120000
      });
      if (result.success && result.data) {
        currentLampiran = result.data;
        renderLampiran(result.data);
        showToast('Lampiran rubrik & penilaian berhasil dibuat!', 'success');
      } else {
        showToast(result.error?.message || 'Gagal membuat lampiran', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      hideLoading();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-plus mr-2"></i>Generate Lampiran Rubrik &amp; Penilaian';
    }
  });
}
