import { api } from '../api.js';
import { showToast, showLoading, hideLoading, escapeHtml, populateAiModelSelect } from '../utils.js';
import { state } from '../state.js';
import { generateTtsDocx } from '../tts-docx.js';
import { saveDocArchive, openArchiveDrawer } from '../storage-archive.js';

let _lastTtsData = null;
let _lastTtsFormData = {};

export function renderTts() {
  const userRole = state.user?.role_label || state.user?.role || '';
  let defaultKelas = 'Kelas 5';
  for (let k = 1; k <= 6; k++) {
    if ((state.user?.mata_pelajaran || '').includes(String(k)) || userRole.includes(String(k))) {
      defaultKelas = `Kelas ${k}`;
      break;
    }
  }

  return `
    <div class="max-w-6xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[var(--color-border-subtle)]">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <i class="fas fa-puzzle-piece"></i> TTS Studio & Game Edukasi 2.0
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] font-display tracking-tight">
            Teka-Teki Silang Pembelajaran
          </h1>
          <p class="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
            Rancang TTS Kurikulum Merdeka secara otomatis dengan AI atau susun kata kustom sendiri untuk LKPD cetak dan Game Interaktif di kelas.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-tts-archive" class="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
            <i class="fas fa-folder-open text-amber-500"></i> Riwayat TTS
          </button>
        </div>
      </div>

      <!-- FORM CONTAINER (FORM VIEW) -->
      <div id="tts-form-view" class="space-y-6">
        
        <!-- MODE SELECTOR TABS -->
        <div class="flex p-1.5 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] max-w-md">
          <button id="tab-tts-ai" class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm cursor-pointer">
            <i class="fas fa-wand-magic-sparkles text-purple-500"></i> Mode AI Generator
          </button>
          <button id="tab-tts-custom" class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer">
            <i class="fas fa-pen-to-square text-cyan-500"></i> Mode Kustom (Manual)
          </button>
        </div>

        <!-- 1. AI GENERATOR FORM -->
        <form id="tts-ai-form" class="space-y-6">
          <div class="bg-[var(--color-bg-elevated)] rounded-3xl p-6 sm:p-8 border border-[var(--color-border-subtle)] shadow-sm space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label class="label">Mata Pelajaran <span class="text-rose-500">*</span></label>
                <select name="mataPelajaran" class="input-field" required>
                  <option value="IPAS" selected>IPAS (Ilmu Pengetahuan Alam & Sosial)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  <option value="Seni Budaya">Seni Budaya</option>
                  <option value="Bahasa Sunda">Bahasa Sunda</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="PJOK">PJOK</option>
                  <option value="Pendidikan Agama Islam">Pendidikan Agama Islam</option>
                </select>
              </div>

              <div>
                <label class="label">Jenjang Kelas <span class="text-rose-500">*</span></label>
                <select name="jenjangKelas" class="input-field" required>
                  <option value="Kelas 1">Kelas 1 SD (Fase A)</option>
                  <option value="Kelas 2">Kelas 2 SD (Fase A)</option>
                  <option value="Kelas 3">Kelas 3 SD (Fase B)</option>
                  <option value="Kelas 4">Kelas 4 SD (Fase B)</option>
                  <option value="Kelas 5" ${defaultKelas === 'Kelas 5' ? 'selected' : ''}>Kelas 5 SD (Fase C)</option>
                  <option value="Kelas 6" ${defaultKelas === 'Kelas 6' ? 'selected' : ''}>Kelas 6 SD (Fase C)</option>
                </select>
              </div>

              <div>
                <label class="label">Jumlah Kata TTS</label>
                <select name="wordCount" class="input-field">
                  <option value="6">6 Kata (Singkat / Ice Breaking)</option>
                  <option value="8" selected>8 Kata (Standar Ideal)</option>
                  <option value="10">10 Kata (Sedang)</option>
                  <option value="12">12 Kata (Komprehensif)</option>
                  <option value="15">15 Kata (Ujian Akhir)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="label">Topik / Materi Pembelajaran <span class="text-rose-500">*</span></label>
              <textarea name="topik" class="input-field h-24" placeholder="Ketik topik atau materi yang ingin dijadikan TTS (Contoh: Sistem Tata Surya, Planet dan Benda Langit, atau Rantai Makanan & Ekosistem)" required></textarea>
              
              <!-- Quick Topics -->
              <div class="flex flex-wrap gap-2 mt-3 items-center">
                <span class="text-[11px] text-[var(--color-text-tertiary)] font-semibold">Inspirasi Topik:</span>
                <button type="button" class="quick-tts-btn px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 text-[11px] font-medium transition-colors cursor-pointer">Sistem Pencernaan Manusia</button>
                <button type="button" class="quick-tts-btn px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 text-[11px] font-medium transition-colors cursor-pointer">Bumi, Bulan & Tata Surya</button>
                <button type="button" class="quick-tts-btn px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 text-[11px] font-medium transition-colors cursor-pointer">Pahlawan & Kemerdekaan</button>
                <button type="button" class="quick-tts-btn px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 text-[11px] font-medium transition-colors cursor-pointer">Kearifan Lokal & Budaya</button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[var(--color-border-subtle)]">
              <div>
                <label class="label">Pilihan Model AI Engine</label>
                <select name="aiProvider" class="input-field"></select>
              </div>
              <div>
                <label class="label">Instruksi Khusus (Opsional)</label>
                <input type="text" name="instructions" class="input-field" placeholder="Contoh: Fokus pada nama-nama organ tubuh, bahasa sederhana">
              </div>
            </div>

            <!-- Submit Button -->
            <div class="text-center pt-4">
              <button type="submit" class="px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-3 cursor-pointer">
                <i class="fas fa-wand-magic-sparkles text-amber-300"></i> Buat Teka-Teki Silang Otomatis (AI)
              </button>
            </div>

          </div>
        </form>

        <!-- 2. CUSTOM MANUAL TTS FORM (Hidden by default) -->
        <form id="tts-custom-form" class="space-y-6 hidden">
          <div class="bg-[var(--color-bg-elevated)] rounded-3xl p-6 sm:p-8 border border-[var(--color-border-subtle)] shadow-sm space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label class="label">Mata Pelajaran</label>
                <input type="text" name="customMapel" class="input-field" value="Umum" placeholder="Contoh: IPAS">
              </div>
              <div>
                <label class="label">Jenjang Kelas</label>
                <input type="text" name="customKelas" class="input-field" value="Kelas 5" placeholder="Contoh: Kelas 5">
              </div>
              <div>
                <label class="label">Judul / Topik TTS</label>
                <input type="text" name="customTopik" class="input-field" placeholder="Contoh: Kuis Flora & Fauna" required>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="label mb-0">Daftar Kata Kunci & Petunjuk Soal (Minimal 3 Kata)</label>
                <button type="button" id="btn-add-word-row" class="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <i class="fas fa-plus"></i> Tambah Kata
                </button>
              </div>

              <div id="custom-words-list" class="space-y-3">
                <!-- Initial Rows -->
                <div class="word-row grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                  <div class="col-span-1 text-center font-bold text-xs text-slate-400">1</div>
                  <div class="col-span-4 sm:col-span-3">
                    <input type="text" placeholder="KATA (Huruf A-Z)" class="custom-word-input input-field uppercase font-bold text-xs" required pattern="[A-Za-z]+" title="Hanya huruf tanpa spasi">
                  </div>
                  <div class="col-span-6 sm:col-span-7">
                    <input type="text" placeholder="Petunjuk pertanyaan / definisi..." class="custom-clue-input input-field text-xs" required>
                  </div>
                  <div class="col-span-1 text-center">
                    <button type="button" class="btn-remove-row text-rose-500 hover:text-rose-700 p-1.5 cursor-pointer" title="Hapus baris"><i class="fas fa-trash-alt text-xs"></i></button>
                  </div>
                </div>

                <div class="word-row grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                  <div class="col-span-1 text-center font-bold text-xs text-slate-400">2</div>
                  <div class="col-span-4 sm:col-span-3">
                    <input type="text" placeholder="KATA" class="custom-word-input input-field uppercase font-bold text-xs" required pattern="[A-Za-z]+">
                  </div>
                  <div class="col-span-6 sm:col-span-7">
                    <input type="text" placeholder="Petunjuk pertanyaan..." class="custom-clue-input input-field text-xs" required>
                  </div>
                  <div class="col-span-1 text-center">
                    <button type="button" class="btn-remove-row text-rose-500 hover:text-rose-700 p-1.5 cursor-pointer"><i class="fas fa-trash-alt text-xs"></i></button>
                  </div>
                </div>

                <div class="word-row grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                  <div class="col-span-1 text-center font-bold text-xs text-slate-400">3</div>
                  <div class="col-span-4 sm:col-span-3">
                    <input type="text" placeholder="KATA" class="custom-word-input input-field uppercase font-bold text-xs" required pattern="[A-Za-z]+">
                  </div>
                  <div class="col-span-6 sm:col-span-7">
                    <input type="text" placeholder="Petunjuk pertanyaan..." class="custom-clue-input input-field text-xs" required>
                  </div>
                  <div class="col-span-1 text-center">
                    <button type="button" class="btn-remove-row text-rose-500 hover:text-rose-700 p-1.5 cursor-pointer"><i class="fas fa-trash-alt text-xs"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="text-center pt-4">
              <button type="submit" class="px-8 py-4 bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 hover:from-cyan-700 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-3 cursor-pointer">
                <i class="fas fa-puzzle-piece text-amber-300"></i> Rakit Kotak Teka-Teki Silang (Instan)
              </button>
            </div>

          </div>
        </form>

      </div>

      <!-- RESULT VIEW (Hidden by default) -->
      <div id="tts-result-view" class="hidden space-y-6">
        
        <!-- Result Toolbar -->
        <div class="flex items-center justify-between flex-wrap gap-3 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl sticky top-4 z-40 shadow-md">
          <button id="btn-tts-back-form" class="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors flex items-center gap-2 cursor-pointer">
            <i class="fas fa-arrow-left"></i> Kembali ke Form
          </button>
          
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button id="btn-play-projector" class="px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 shadow-md hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer">
              <i class="fas fa-gamepad"></i> <span>Mainkan di Kelas</span>
            </button>
            <button id="btn-download-tts-docx" class="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-2 cursor-pointer">
              <i class="fas fa-download"></i> <span>Unduh .docx</span>
            </button>
            <button id="btn-print-tts" class="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer">
              <i class="fas fa-print"></i> <span>Cetak / PDF</span>
            </button>
            <button id="btn-tts-result-archive" class="px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-purple-500/30 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer" title="Buka Riwayat">
              <i class="fas fa-folder-open text-amber-500"></i>
            </button>
          </div>
        </div>

        <!-- A4 Printable Canvas -->
        <div id="tts-canvas" class="max-w-[21cm] mx-auto bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm font-serif border border-slate-200 print:border-none print:shadow-none print:p-0">
          <!-- Content will be rendered here -->
        </div>

      </div>

    </div>
  `;
}

export function initTts() {
  const formAi = document.getElementById('tts-ai-form');
  const formCustom = document.getElementById('tts-custom-form');
  const tabAi = document.getElementById('tab-tts-ai');
  const tabCustom = document.getElementById('tab-tts-custom');

  // Populate AI Models Select
  const aiProviderSelect = formAi?.querySelector('select[name="aiProvider"]');
  if (aiProviderSelect) {
    populateAiModelSelect(aiProviderSelect);
  }

  // Switch Tabs
  tabAi?.addEventListener('click', () => {
    formAi?.classList.remove('hidden');
    formCustom?.classList.add('hidden');
    tabAi.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm cursor-pointer';
    tabCustom.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer';
  });

  tabCustom?.addEventListener('click', () => {
    formCustom?.classList.remove('hidden');
    formAi?.classList.add('hidden');
    tabCustom.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm cursor-pointer';
    tabAi.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer';
  });

  // Quick topics buttons
  document.querySelectorAll('.quick-tts-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textarea = formAi?.querySelector('textarea[name="topik"]');
      if (textarea) {
        textarea.value = btn.textContent.trim();
      }
    });
  });

  // Add word row for custom mode
  const wordsList = document.getElementById('custom-words-list');
  document.getElementById('btn-add-word-row')?.addEventListener('click', () => {
    if (!wordsList) return;
    const rowCount = wordsList.querySelectorAll('.word-row').length + 1;
    const row = document.createElement('div');
    row.className = 'word-row grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] animate-fade-in';
    row.innerHTML = `
      <div class="col-span-1 text-center font-bold text-xs text-slate-400">${rowCount}</div>
      <div class="col-span-4 sm:col-span-3">
        <input type="text" placeholder="KATA" class="custom-word-input input-field uppercase font-bold text-xs" required pattern="[A-Za-z]+">
      </div>
      <div class="col-span-6 sm:col-span-7">
        <input type="text" placeholder="Petunjuk pertanyaan..." class="custom-clue-input input-field text-xs" required>
      </div>
      <div class="col-span-1 text-center">
        <button type="button" class="btn-remove-row text-rose-500 hover:text-rose-700 p-1.5 cursor-pointer"><i class="fas fa-trash-alt text-xs"></i></button>
      </div>
    `;
    wordsList.appendChild(row);
    attachRemoveListener(row);
  });

  function attachRemoveListener(container) {
    container.querySelectorAll('.btn-remove-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rows = wordsList?.querySelectorAll('.word-row') || [];
        if (rows.length <= 3) {
          showToast('Minimal diperlukan 3 kata untuk teka-teki silang.', 'warning');
          return;
        }
        e.currentTarget.closest('.word-row')?.remove();
        // Re-index row numbers
        wordsList?.querySelectorAll('.word-row').forEach((r, idx) => {
          const numEl = r.querySelector('.col-span-1');
          if (numEl) numEl.textContent = String(idx + 1);
        });
      });
    });
  }
  if (wordsList) attachRemoveListener(wordsList);

  // Submit AI Form
  formAi?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formAi);
    const payload = Object.fromEntries(formData.entries());

    showLoading('AI sedang merancang Teka-Teki Silang...', 'Menyusun kata kunci edukatif & kisi-kisi silang');

    try {
      const res = await api('/tts/generate', {
        method: 'POST',
        body: payload,
        timeout: 180000
      });

      if (res.success && res.data) {
        renderTtsResult(res.data, payload);

        // Auto-archive
        saveDocArchive({
          module: 'tts',
          title: `${payload.mataPelajaran || 'TTS'} - ${payload.topik} (${payload.jenjangKelas})`,
          subtitle: `${res.data.words?.length || 8} Kata | AI Generator`,
          inputData: payload,
          content: res.data
        });

        showToast('Teka-Teki Silang berhasil dibuat dan diarsipkan!', 'success');
      } else {
        showToast(res.error?.message || 'Gagal membuat TTS.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  });

  // Submit Custom Form
  formCustom?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rows = wordsList?.querySelectorAll('.word-row') || [];
    const words = [];
    rows.forEach(r => {
      const wInput = r.querySelector('.custom-word-input');
      const cInput = r.querySelector('.custom-clue-input');
      const word = wInput ? wInput.value.trim() : '';
      const clue = cInput ? cInput.value.trim() : '';
      if (word && clue) {
        words.push({ word, clue });
      }
    });

    if (words.length < 3) {
      showToast('Minimal masukkan 3 pasang kata dan petunjuk yang lengkap.', 'warning');
      return;
    }

    const payload = {
      mataPelajaran: formCustom.querySelector('[name="customMapel"]')?.value || 'Umum',
      jenjangKelas: formCustom.querySelector('[name="customKelas"]')?.value || 'Kelas 5',
      topik: formCustom.querySelector('[name="customTopik"]')?.value || 'Teka-Teki Silang',
      words
    };

    showLoading('Sedang merakit kotak teka-teki silang...', 'Mengoptimalkan persilangan huruf');

    try {
      const res = await api('/tts/custom', {
        method: 'POST',
        body: payload,
        timeout: 60000
      });

      if (res.success && res.data) {
        renderTtsResult(res.data, payload);

        // Auto-archive
        saveDocArchive({
          module: 'tts',
          title: `${payload.mataPelajaran} - ${payload.topik} (${payload.jenjangKelas})`,
          subtitle: `${words.length} Kata | Mode Kustom`,
          inputData: payload,
          content: res.data
        });

        showToast('Kotak TTS berhasil dirakit dan diarsipkan!', 'success');
      } else {
        showToast(res.error?.message || 'Gagal merakit TTS.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  });

  // Back Button
  document.getElementById('btn-tts-back-form')?.addEventListener('click', () => {
    document.getElementById('tts-form-view')?.classList.remove('hidden');
    document.getElementById('tts-result-view')?.classList.add('hidden');
  });

  // Print Button
  document.getElementById('btn-print-tts')?.addEventListener('click', () => {
    window.print();
  });

  // Download DOCX Button
  document.getElementById('btn-download-tts-docx')?.addEventListener('click', async () => {
    if (!_lastTtsData) return;
    const btn = document.getElementById('btn-download-tts-docx');
    try {
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyiapkan DOCX...'; }
      
      const origin = window.location.origin;
      const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;
      const blob = await generateTtsDocx(_lastTtsData, _lastTtsFormData, kopSuratUrl);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `LKPD_TTS_${_lastTtsFormData.topik || 'Soal'}_${_lastTtsFormData.jenjangKelas || 'SD'}`.replace(/\s+/g, '_');
      a.download = `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File .docx LKPD TTS berhasil diunduh!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Gagal membuat DOCX: ' + e.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Unduh .docx'; }
    }
  });

  // Projector Game Mode Button
  document.getElementById('btn-play-projector')?.addEventListener('click', () => {
    if (_lastTtsData && _lastTtsData.crossword) {
      openTtsGameModal(_lastTtsData.crossword, _lastTtsData, _lastTtsFormData);
    }
  });

  // Archive Drawer Handler
  const handleOpenTtsArchive = () => {
    openArchiveDrawer({
      module: 'tts',
      moduleName: 'Teka-Teki Silang',
      onSelect: (item) => {
        renderTtsResult(item.content, item.inputData);
        showToast(`Membuka riwayat: ${item.title}`, 'info');
      },
      onDownloadDocx: async (item) => {
        showToast('Menyiapkan file DOCX...', 'info');
        try {
          const origin = window.location.origin;
          const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;
          const blob = await generateTtsDocx(item.content, item.inputData, kopSuratUrl);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = `LKPD_TTS_${item.inputData?.topik || 'Soal'}`.replace(/\s+/g, '_');
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

  document.getElementById('btn-tts-archive')?.addEventListener('click', handleOpenTtsArchive);
  document.getElementById('btn-tts-result-archive')?.addEventListener('click', handleOpenTtsArchive);
}

function renderTtsResult(data, formData) {
  _lastTtsData = data;
  _lastTtsFormData = formData;

  document.getElementById('tts-form-view')?.classList.add('hidden');
  document.getElementById('tts-result-view')?.classList.remove('hidden');

  const canvas = document.getElementById('tts-canvas');
  if (!canvas) return;

  const origin = window.location.origin;
  const kopSuratUrl = state.user?.kop_surat_url || `${origin}/static/kop_surat.png`;

  const cw = data.crossword || {};
  const mendatar = [];
  const menurun = [];
  if (cw.placements) {
    cw.placements.forEach(p => {
      const wObj = (data.words || [])[p.originalIndex] || {};
      const cleanClue = (wObj.clue || p.word).replace(/^(Mendatar:|Menurun:)\s*/i, '').trim();
      const item = { num: p.number, text: `${p.number}. ${cleanClue}`, word: p.word, len: p.word.length };
      if (p.direction === 'H') mendatar.push(item);
      else menurun.push(item);
    });
  }
  mendatar.sort((a, b) => a.num - b.num);
  menurun.sort((a, b) => a.num - b.num);

  let html = `
    <!-- KOP SURAT -->
    <div style="text-align:center; margin-bottom: 20px;">
      <img src="${kopSuratUrl}" style="width:100%; height:auto; object-fit:contain;" alt="Kop Surat" crossorigin="anonymous">
    </div>

    <!-- TITLE -->
    <div style="text-align:center; margin-bottom: 20px; text-transform:uppercase;">
      <h3 style="font-size:13pt; font-weight:bold; margin-bottom:2px; text-decoration:underline;">LEMBAR KERJA PESERTA DIDIK (LKPD)</h3>
      <h4 style="font-size:11pt; font-weight:bold; margin:0;">TEKA-TEKI SILANG: ${escapeHtml(formData.topik || data.topik || 'PEMBELAJARAN')}</h4>
    </div>

    <!-- IDENTITAS SISWA (Table) -->
    <table style="width:100%; font-size:10pt; margin-bottom:15px; border-collapse:collapse; font-family:'Times New Roman', serif;">
      <tr>
        <td style="width:50%; vertical-align:top;">
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="width:120px; font-weight:bold;">Mata Pelajaran</td><td>: ${escapeHtml(formData.mataPelajaran || data.mataPelajaran || '-')}</td></tr>
            <tr><td style="font-weight:bold;">Kelas / Fase</td><td>: ${escapeHtml(formData.jenjangKelas || data.jenjangKelas || 'Kelas 5')}</td></tr>
            <tr><td style="font-weight:bold;">Topik / Materi</td><td>: ${escapeHtml(formData.topik || data.topik || '-')}</td></tr>
          </table>
        </td>
        <td style="width:50%; vertical-align:top;">
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="width:140px; font-weight:bold;">Nama Peserta Didik</td><td>: ............................................</td></tr>
            <tr><td style="font-weight:bold;">No. Absen / Kelompok</td><td>: ............................................</td></tr>
            <tr><td style="font-weight:bold;">Hari / Tanggal</td><td>: ............................................</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="border-top:1px solid #000; margin-bottom:15px;"></div>

    <!-- PETUNJUK -->
    <div style="font-size:9.5pt; margin-bottom:15px; background:#f9f9f9; padding:8px 12px; border-radius:6px; border:1px solid #e0e0e0;">
      <b>Petunjuk:</b> Isikan huruf pada kotak-kotak teka-teki silang sesuai petunjuk Mendatar dan Menurun. Setiap satu kotak hanya diisi satu huruf kapital.
    </div>
  `;

  // GRID TABLE
  if (cw.success && Array.isArray(cw.grid)) {
    html += `<div style="margin: 20px 0; overflow-x:auto;">`;
    html += `<table style="border-collapse:collapse; margin:0 auto; table-layout:fixed; width:auto;">`;
    for (let r = 0; r < cw.grid.length; r++) {
      html += `<tr>`;
      for (let c = 0; c < cw.grid[r].length; c++) {
        const char = cw.grid[r][c];
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

    // CLUES TABLE 2 COLS
    html += `
      <table style="width:100%; margin-top:20px; font-size:10pt; font-family:'Times New Roman', serif; border-collapse:collapse;">
        <tr>
          <td style="width:50%; padding-right:15px; vertical-align:top;">
            <h4 style="margin-bottom:8px; font-weight:bold; text-decoration:underline; font-size:10.5pt;">MENDATAR</h4>
            ${mendatar.map(m => `<div style="margin-bottom:6px; text-align:justify;">${m.text}</div>`).join('')}
          </td>
          <td style="width:50%; padding-left:15px; vertical-align:top;">
            <h4 style="margin-bottom:8px; font-weight:bold; text-decoration:underline; font-size:10.5pt;">MENURUN</h4>
            ${menurun.map(m => `<div style="margin-bottom:6px; text-align:justify;">${m.text}</div>`).join('')}
          </td>
        </tr>
      </table>
    `;

    // KUNCI JAWABAN (Page Break)
    html += `
      <div style="page-break-before: always; margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px;"></div>
      <div style="text-align:center; margin-bottom:15px; text-transform:uppercase;">
        <h4 style="text-decoration:underline; font-weight:bold; font-size:11pt; margin-bottom:2px;">KUNCI JAWABAN TEKA-TEKI SILANG (PEGANGAN GURU)</h4>
        <p style="font-weight:bold; font-size:9pt; margin:0">${escapeHtml(formData.topik || data.topik || 'Topik')} - ${escapeHtml(formData.jenjangKelas || data.jenjangKelas || 'SD')}</p>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:9.5pt; font-family:'Times New Roman', serif; margin-bottom:25px;" border="1">
        <thead>
          <tr style="background:#f0f0f0; text-align:center;">
            <th style="padding:6px; width:40px;">No</th>
            <th style="padding:6px; width:80px;">Posisi</th>
            <th style="padding:6px; width:120px;">Kunci Kata</th>
            <th style="padding:6px; text-align:left;">Petunjuk Soal</th>
          </tr>
        </thead>
        <tbody>
          ${[...(cw.placements || [])].sort((a, b) => a.number - b.number).map(p => {
            const wObj = (data.words || [])[p.originalIndex] || {};
            return `
              <tr>
                <td style="text-align:center; padding:5px;">${p.number}</td>
                <td style="text-align:center; padding:5px;">${p.direction === 'H' ? 'Mendatar' : 'Menurun'}</td>
                <td style="padding:5px; font-weight:bold;">${p.word}</td>
                <td style="padding:5px;">${escapeHtml((wObj.clue || p.word).replace(/^(Mendatar:|Menurun:)\s*/i, '').trim())}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- LEMBAR PENGESAHAN -->
      <table style="width:100%; margin-top:40px; text-align:center; font-size:10pt; font-family:'Times New Roman', serif;">
        <tr>
          <td style="width:50%; vertical-align:bottom;">
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <br><br><br><br>
            <p style="text-decoration:underline; font-weight:bold">${escapeHtml(formData.namaKepalaSekolah || '..............................')}</p>
            <p>NIP. ${escapeHtml(formData.nipKepalaSekolah || '..............................')}</p>
          </td>
          <td style="width:50%; vertical-align:bottom;">
            <p>Wanayasa, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Guru Pengampu</p>
            <br><br><br><br>
            <p style="text-decoration:underline; font-weight:bold">${escapeHtml(formData.namaGuru || '..............................')}</p>
            <p>NIP. ${escapeHtml(formData.nipGuru || '..............................')}</p>
          </td>
        </tr>
      </table>
    `;
  }

  canvas.innerHTML = html;
  window.scrollTo(0, 0);
}

/**
 * Interactive Classroom Crossword Game Modal
 */
function openTtsGameModal(cw, data, formData) {
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
    const wObj = (data.words || [])[p.originalIndex] || {};
    const cleanSoal = (wObj.clue || p.word).replace(/^(Mendatar:|Menurun:)\s*/i, '').trim();
    const item = { num: p.number, soal: cleanSoal, word: p.word, row: p.row, col: p.col, dir: p.direction };
    if (p.direction === 'H') mendatar.push(item);
    else menurun.push(item);
  });

  mendatar.sort((a, b) => a.num - b.num);
  menurun.sort((a, b) => a.num - b.num);

  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-7xl 2xl:max-w-[1550px] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
      
      <!-- Header -->
      <div class="px-6 py-3.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-base font-black shadow-md">
            <i class="fas fa-gamepad"></i>
          </div>
          <div>
            <h3 class="font-extrabold text-base text-white font-display">${escapeHtml(formData.topik || data.topik || 'Teka-Teki Silang')}</h3>
            <p class="text-xs text-amber-300/90">${escapeHtml(formData.mataPelajaran || data.mataPelajaran || 'Mata Pelajaran')} • ${escapeHtml(formData.jenjangKelas || data.jenjangKelas || 'SD')}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div class="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
            <i class="fas fa-stopwatch text-slate-400"></i> <span id="tts-game-timer">00:00</span>
          </div>
          <button id="btn-tts-check" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow transition-all flex items-center gap-1.5 cursor-pointer">
            <i class="fas fa-check-circle"></i> Cek Jawaban
          </button>
          <button id="btn-tts-hint" class="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Buka 1 Huruf">
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

      <!-- Body: 3 Bagian (Kotak TTS Kiri Paling Besar, Mendatar Tengah, Menurun Kanan) -->
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
  if (gridContainer) gridContainer.innerHTML = tableHtml;

  // Stopwatch Timer
  let seconds = 0;
  const timerEl = document.getElementById('tts-game-timer');
  const timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);

  // Navigation Logic
  const inputs = Array.from(modal.querySelectorAll('.tts-cell'));
  inputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
      e.target.value = val;
      if (val) {
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

  // Button Check
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

  // Button Hint
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
