/**
 * pinisi-duel.js — Game 7: Duel Pinisi Kata (Adu Cepat Literasi Kalimat Rumpang)
 * Diadaptasi dan disempurnakan dari konsep Deni Ranoptri, M.Pd (Belajar ID Kalsel / papaninteraktif.com).
 * 
 * Keunggulan Arsitektur:
 * 1. 100% Native KKG Wanayasa (Instan, Bebas Iframe, 100% Offline-First).
 * 2. 45 Paket Soal Literasi Kurikulum Merdeka (Fase A, B, C x Mudah, Sedang, Hebat).
 * 3. Split-Screen Anti-Contek (opsi jawaban diacak independen di konsol merah & biru).
 * 4. Mode Jeda Guru (Teacher Discussion Mode) dengan pembahasan kalimat otomatis.
 * 5. Fitur Salin Rekap Nilai formatif 1-klik untuk guru.
 */

import { sfx, launchConfetti } from './audio.js';
import { getPinisiQuestions } from './pinisi-bank.js';

let gameState = {
  active: false,
  isPaused: false,
  fase: 'fase-a', // 'fase-a' | 'fase-b' | 'fase-c'
  difficulty: 'mudah', // 'mudah' | 'sedang' | 'hebat'
  paket: 'all', // 'all' | '1' | '2' | '3' | '4' | '5'
  targetScore: 1000,
  redScore: 0,
  blueScore: 0,
  questions: [],
  currentQIndex: 0,
  answerLocked: false,
  teamAttempted: { red: false, blue: false },
  advanceTimeout: null,
  wasWaitingToAdvance: false,
  lastTapTime: { red: 0, blue: 0 }
};

// SVG Ikon Kapal Pinisi Nusantara
const PINISI_SHIP_SVG = `
  <svg viewBox="0 0 400 200" class="w-10 h-6 sm:w-14 sm:h-9 filter drop-shadow-md">
    <path d="M50 150 Q200 120 350 150 L340 170 Q200 140 60 170 Z" fill="#8B4513" stroke="#654321" stroke-width="2"/>
    <line x1="200" y1="150" x2="200" y2="40" stroke="#654321" stroke-width="4"/>
    <line x1="120" y1="150" x2="120" y2="60" stroke="#654321" stroke-width="3"/>
    <line x1="280" y1="150" x2="280" y2="70" stroke="#654321" stroke-width="3"/>
    <path d="M160 45 Q200 35 240 45 L235 120 Q200 110 165 120 Z" fill="#FFE4B5" stroke="#DEB887" stroke-width="2"/>
    <path d="M90 65 Q120 55 150 65 L145 130 Q120 120 95 130 Z" fill="#F0E68C" stroke="#DAA520" stroke-width="2"/>
    <path d="M250 75 Q280 65 310 75 L305 135 Q280 125 255 135 Z" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/>
    <rect x="200" y="38" width="22" height="7" fill="#EF4444" rx="1"/>
    <rect x="200" y="45" width="22" height="7" fill="#FFFFFF" rx="1"/>
  </svg>
`;

export function renderPinisiDuel() {
  return `
    <div class="flex flex-col w-full h-full bg-slate-950 text-white select-none overflow-hidden relative font-sans">
      
      <!-- 1. TOP HEADER & CONTROL TOOLBAR -->
      <div class="bg-slate-900/95 px-3 sm:px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 z-20">
        
        <!-- Left: Game Title Badge -->
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm shadow-md">
            ⛵
          </span>
          <div>
            <h2 class="text-xs sm:text-sm font-black font-display text-white tracking-tight flex items-center gap-1.5">
              Duel Pinisi Kata
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-widest hidden sm:inline-block">
                Literasi Rumpang
              </span>
            </h2>
          </div>
        </div>

        <!-- Center: Filter Dropdowns (Jenjang, Tingkat, Paket, Target) -->
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          
          <!-- Jenjang / Fase Select -->
          <select id="pinisi-fase-select" class="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
            <option value="fase-a" ${gameState.fase === 'fase-a' ? 'selected' : ''}>Fase A (Kelas 1–2)</option>
            <option value="fase-b" ${gameState.fase === 'fase-b' ? 'selected' : ''}>Fase B (Kelas 3–4)</option>
            <option value="fase-c" ${gameState.fase === 'fase-c' ? 'selected' : ''}>Fase C (Kelas 5–6)</option>
          </select>

          <!-- Tingkat Kesulitan Select -->
          <select id="pinisi-tingkat-select" class="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
            <option value="mudah" ${gameState.difficulty === 'mudah' ? 'selected' : ''}>🟢 Mudah</option>
            <option value="sedang" ${gameState.difficulty === 'sedang' ? 'selected' : ''}>🟡 Sedang</option>
            <option value="hebat" ${gameState.difficulty === 'hebat' ? 'selected' : ''}>🔴 Hebat</option>
          </select>

          <!-- Paket Soal Select (1–5) -->
          <select id="pinisi-paket-select" class="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
            <option value="all" ${gameState.paket === 'all' ? 'selected' : ''}>🎲 Acak Semua</option>
            <option value="1" ${gameState.paket === '1' ? 'selected' : ''}>Paket 1</option>
            <option value="2" ${gameState.paket === '2' ? 'selected' : ''}>Paket 2</option>
            <option value="3" ${gameState.paket === '3' ? 'selected' : ''}>Paket 3</option>
            <option value="4" ${gameState.paket === '4' ? 'selected' : ''}>Paket 4</option>
            <option value="5" ${gameState.paket === '5' ? 'selected' : ''}>Paket 5</option>
          </select>

          <!-- Target Skor Select -->
          <select id="pinisi-target-select" class="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
            <option value="750" ${gameState.targetScore === 750 ? 'selected' : ''}>🎯 750 Poin</option>
            <option value="1000" ${gameState.targetScore === 1000 ? 'selected' : ''}>🎯 1.000 Poin</option>
            <option value="1500" ${gameState.targetScore === 1500 ? 'selected' : ''}>🎯 1.500 Poin</option>
          </select>

          <!-- Teacher Pause Mode Button -->
          <button 
            id="btn-pinisi-pause" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Jeda dan Bahas Bersama Guru"
          >
            <i class="fas fa-pause"></i> <span class="hidden sm:inline">Jeda Guru</span>
          </button>

          <!-- Reset / Restart Button -->
          <button 
            id="btn-pinisi-restart" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            title="Ulangi Pertandingan"
          >
            <i class="fas fa-rotate-right"></i>
          </button>
        </div>

      </div>

      <!-- 2. OCEAN ARENA: DUAL PINISI RACE TRACK -->
      <div class="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-b from-slate-900 to-sky-950/80 border-b border-sky-900/30 shrink-0 relative overflow-hidden">
        
        <!-- Ocean Background Waves Effect -->
        <div class="absolute inset-0 opacity-15 pointer-events-none overflow-hidden select-none">
          <div class="w-[200%] h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-sky-600 to-transparent animate-pulse"></div>
        </div>

        <div class="max-w-6xl mx-auto space-y-2 relative z-10">
          
          <!-- Track 1: Jalur Tim Merah -->
          <div class="flex items-center gap-3">
            <div class="w-24 sm:w-28 flex items-center justify-between font-black text-xs shrink-0 text-rose-400">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                TIM MERAH
              </span>
              <span id="pinisi-score-red" class="bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30 text-rose-200">
                0
              </span>
            </div>

            <!-- Track Bar Merah -->
            <div class="flex-1 h-8 sm:h-9 bg-slate-950/80 rounded-2xl border border-rose-500/30 relative overflow-hidden shadow-inner p-1">
              <!-- Water Trail -->
              <div 
                id="pinisi-trail-red" 
                class="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-rose-600/30 via-rose-500/40 to-rose-400/50 rounded-2xl transition-all duration-500 ease-out"
                style="width: 0%;"
              ></div>
              <!-- Finish Line Flag -->
              <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70 z-10">🏁</div>
              <!-- Red Ship -->
              <div 
                id="pinisi-ship-red" 
                class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out z-20 flex items-center"
                style="left: 4%;"
              >
                ${PINISI_SHIP_SVG}
              </div>
            </div>
          </div>

          <!-- Track 2: Jalur Tim Biru -->
          <div class="flex items-center gap-3">
            <div class="w-24 sm:w-28 flex items-center justify-between font-black text-xs shrink-0 text-blue-400">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                TIM BIRU
              </span>
              <span id="pinisi-score-blue" class="bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 text-blue-200">
                0
              </span>
            </div>

            <!-- Track Bar Biru -->
            <div class="flex-1 h-8 sm:h-9 bg-slate-950/80 rounded-2xl border border-blue-500/30 relative overflow-hidden shadow-inner p-1">
              <!-- Water Trail -->
              <div 
                id="pinisi-trail-blue" 
                class="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600/30 via-blue-500/40 to-blue-400/50 rounded-2xl transition-all duration-500 ease-out"
                style="width: 0%;"
              ></div>
              <!-- Finish Line Flag -->
              <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70 z-10">🏁</div>
              <!-- Blue Ship -->
              <div 
                id="pinisi-ship-blue" 
                class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out z-20 flex items-center"
                style="left: 4%;"
              >
                ${PINISI_SHIP_SVG}
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- 3. CENTRAL CLOZE SENTENCE BOARD (Tengah) -->
      <div class="shrink-0 px-4 sm:px-8 py-2 sm:py-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-center min-h-[85px] sm:min-h-[110px] max-h-[165px] overflow-y-auto">
        <div class="max-w-4xl text-center px-4 py-0.5">
          <div class="text-[10px] sm:text-xs font-bold text-sky-400 tracking-widest uppercase mb-1">
            Lengkapilah Kalimat Rumpang Berikut:
          </div>
          <div 
            id="pinisi-question-text" 
            class="font-black text-white leading-relaxed tracking-tight"
            style="font-size: clamp(1.15rem, 3.2vh, 2.2rem);"
          >
            Memuat kalimat petualangan...
          </div>
        </div>
      </div>

      <!-- 4. SPLIT-SCREEN TOUCH CONSOLES: TIM MERAH (Kiri) vs TIM BIRU (Kanan) -->
      <div class="flex-1 w-full flex flex-row min-h-0 divide-x divide-slate-800">
        
        <!-- Red Team Console (Left 50%) -->
        <div id="pinisi-console-red" class="w-1/2 flex flex-col p-3 sm:p-5 bg-gradient-to-b from-rose-950/20 to-transparent transition-all duration-300 relative min-h-0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs sm:text-sm font-black text-rose-400 tracking-wider flex items-center gap-1.5 uppercase">
              🔴 KONSOL TIM MERAH
            </span>
            <span class="text-[10px] text-slate-400 font-semibold">Pilih Jawaban</span>
          </div>

          <!-- 2x2 Grid of Touch Choice Buttons -->
          <div id="pinisi-choices-red" class="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 flex-1 min-h-0">
            <!-- Buttons dynamically populated -->
          </div>
        </div>

        <!-- Blue Team Console (Right 50%) -->
        <div id="pinisi-console-blue" class="w-1/2 flex flex-col p-3 sm:p-5 bg-gradient-to-b from-blue-950/20 to-transparent transition-all duration-300 relative min-h-0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs sm:text-sm font-black text-blue-400 tracking-wider flex items-center gap-1.5 uppercase">
              🔵 KONSOL TIM BIRU
            </span>
            <span class="text-[10px] text-slate-400 font-semibold">Pilih Jawaban</span>
          </div>

          <!-- 2x2 Grid of Touch Choice Buttons -->
          <div id="pinisi-choices-blue" class="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 flex-1 min-h-0">
            <!-- Buttons dynamically populated -->
          </div>
        </div>

      </div>

      <!-- 5. TEACHER DISCUSSION MODAL (JEDA GURU) -->
      <div id="pinisi-pause-modal" class="hidden absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-center shadow-2xl animate-scale-up space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-2xl flex items-center justify-center mx-auto shadow-lg">
            ⏸️
          </div>

          <h3 class="text-xl sm:text-2xl font-black text-white font-display">
            Mode Jeda & Pembahasan Guru
          </h3>

          <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kalimat Lengkap:
            </div>
            <div id="pinisi-pause-sentence" class="text-base sm:text-lg font-bold text-slate-100">
              -
            </div>
            <div class="text-[11px] font-bold text-amber-400 uppercase tracking-wider pt-2">
              Penjelasan / Pembahasan:
            </div>
            <p id="pinisi-pause-explanation" class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              -
            </p>
          </div>

          <button 
            id="btn-pinisi-resume" 
            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            ▶️ Lanjutkan Permainan
          </button>
        </div>
      </div>

      <!-- 6. WINNER MODAL CELEBRATION -->
      <div id="pinisi-winner-modal" class="hidden absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center shadow-2xl animate-scale-up space-y-5">
          <div class="text-6xl animate-bounce">
            🏆
          </div>

          <div>
            <h3 id="pinisi-winner-title" class="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              TIM MERAH MENANG!
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Kapal Pinisi berhasil menuntaskan rute pelayaran lebih cepat!
            </p>
          </div>

          <!-- Final Scores Card -->
          <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-around">
            <div class="text-center">
              <div class="text-xs font-bold text-rose-400">🔴 TIM MERAH</div>
              <div id="pinisi-final-red" class="text-2xl font-black text-white mt-1">0</div>
            </div>
            <div class="text-lg font-black text-slate-600">VS</div>
            <div class="text-center">
              <div class="text-xs font-bold text-blue-400">🔵 TIM BIRU</div>
              <div id="pinisi-final-blue" class="text-2xl font-black text-white mt-1">0</div>
            </div>
          </div>

          <!-- Action Buttons: Copy Recap & Play Again -->
          <div class="space-y-2">
            <button 
              id="btn-pinisi-copy-recap" 
              class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 font-bold text-xs border border-sky-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <i class="fas fa-copy"></i> <span>Salin Rekap Nilai Pertandingan</span>
            </button>

            <button 
              id="btn-pinisi-play-again" 
              class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              🔄 Mainkan Ronde Baru
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function initPinisiDuel() {
  setupEventListeners();
  startNewRound();
}

function setupEventListeners() {
  // Jenjang Change
  const faseSelect = document.getElementById('pinisi-fase-select');
  if (faseSelect) {
    faseSelect.addEventListener('change', (e) => {
      gameState.fase = e.target.value;
      sfx.playClick();
      startNewRound();
    });
  }

  // Tingkat Change
  const tingkatSelect = document.getElementById('pinisi-tingkat-select');
  if (tingkatSelect) {
    tingkatSelect.addEventListener('change', (e) => {
      gameState.difficulty = e.target.value;
      sfx.playClick();
      startNewRound();
    });
  }

  // Paket Change
  const paketSelect = document.getElementById('pinisi-paket-select');
  if (paketSelect) {
    paketSelect.addEventListener('change', (e) => {
      gameState.paket = e.target.value;
      sfx.playClick();
      startNewRound();
    });
  }

  // Target Score Change
  const targetSelect = document.getElementById('pinisi-target-select');
  if (targetSelect) {
    targetSelect.addEventListener('change', (e) => {
      gameState.targetScore = parseInt(e.target.value) || 1000;
      sfx.playClick();
      updateShipPositions();
    });
  }

  // Teacher Pause Toggle
  const pauseBtn = document.getElementById('btn-pinisi-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      toggleTeacherPause();
    });
  }

  // Resume Button in Pause Modal
  const resumeBtn = document.getElementById('btn-pinisi-resume');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      toggleTeacherPause(false);
    });
  }

  // Restart Button
  const restartBtn = document.getElementById('btn-pinisi-restart');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      sfx.playClick();
      startNewRound();
    });
  }

  // Play Again Button in Winner Modal
  const playAgainBtn = document.getElementById('btn-pinisi-play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      document.getElementById('pinisi-winner-modal')?.classList.add('hidden');
      sfx.playClick();
      startNewRound();
    });
  }

  // Copy Recap Button
  const copyRecapBtn = document.getElementById('btn-pinisi-copy-recap');
  if (copyRecapBtn) {
    copyRecapBtn.addEventListener('click', () => {
      copyMatchRecap();
    });
  }
}

function startNewRound() {
  if (gameState.advanceTimeout) {
    clearTimeout(gameState.advanceTimeout);
    gameState.advanceTimeout = null;
  }

  gameState.active = true;
  gameState.isPaused = false;
  gameState.wasWaitingToAdvance = false;
  gameState.redScore = 0;
  gameState.blueScore = 0;
  gameState.currentQIndex = 0;
  gameState.answerLocked = false;
  gameState.teamAttempted = { red: false, blue: false };

  // Sembunyikan modal jika masih terbuka
  document.getElementById('pinisi-pause-modal')?.classList.add('hidden');
  document.getElementById('pinisi-winner-modal')?.classList.add('hidden');

  // Ambil soal baru
  gameState.questions = getPinisiQuestions(gameState.fase, gameState.difficulty, gameState.paket, 15);
  
  updateScoresUI();
  updateShipPositions();
  loadCurrentQuestion();
}

function loadCurrentQuestion() {
  if (!gameState.active || gameState.isPaused) return;

  if (gameState.currentQIndex >= gameState.questions.length) {
    // Soal habis, muat kumpulan baru
    gameState.questions = getPinisiQuestions(gameState.fase, gameState.difficulty, gameState.paket, 15);
    gameState.currentQIndex = 0;
  }

  const q = gameState.questions[gameState.currentQIndex];
  if (!q) return;

  gameState.answerLocked = false;
  gameState.teamAttempted = { red: false, blue: false };

  // Reset ring konsol
  document.getElementById('pinisi-console-red')?.classList.remove('ring-4', 'ring-emerald-500/60', 'ring-rose-500/60');
  document.getElementById('pinisi-console-blue')?.classList.remove('ring-4', 'ring-emerald-500/60', 'ring-rose-500/60');

  // Render question text with stylized amber underline
  const qEl = document.getElementById('pinisi-question-text');
  if (qEl) {
    const formatted = q.q.replace(
      '_____', 
      `<span class="text-amber-400 underline decoration-wavy decoration-2 font-black mx-1.5">______</span>`
    );
    qEl.innerHTML = formatted;
  }

  // Populate choices independently for Red and Blue (Anti-Contek)
  renderTeamChoices('red', q);
  renderTeamChoices('blue', q);
}

function renderTeamChoices(team, q) {
  const container = document.getElementById(`pinisi-choices-${team}`);
  if (!container) return;

  // Acak opsi secara independen untuk kubu ini
  const shuffledOpts = [...q.opts].sort(() => Math.random() - 0.5);

  const teamBorder = team === 'red' 
    ? 'border-rose-500/40 hover:border-rose-400 text-rose-100' 
    : 'border-blue-500/40 hover:border-blue-400 text-blue-100';
  const teamBg = 'bg-slate-900/90';

  container.innerHTML = shuffledOpts.map(opt => `
    <button 
      type="button"
      data-option="${encodeURIComponent(opt)}"
      class="pinisi-btn-${team} w-full h-full rounded-2xl ${teamBg} border-2 ${teamBorder} font-extrabold flex items-center justify-center p-2 sm:p-4 text-center active:scale-95 transition-all shadow-md cursor-pointer select-none touch-manipulation break-words hyphens-auto"
      style="font-size: clamp(0.95rem, 2.3vh, 1.75rem);"
    >
      ${opt}
    </button>
  `).join('');

  // Pasang pointerdown & click listener dengan proteksi debounce per tim (multi-touch & mouse safe)
  container.querySelectorAll(`.pinisi-btn-${team}`).forEach(btn => {
    const triggerAnswer = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - (gameState.lastTapTime[team] || 0) < 150) return; // Debounce per team
      gameState.lastTapTime[team] = now;

      const selectedOpt = decodeURIComponent(btn.getAttribute('data-option') || '');
      handleTeamAnswer(team, selectedOpt, btn);
    };

    btn.addEventListener('pointerdown', triggerAnswer);
    btn.addEventListener('click', triggerAnswer);
  });
}

function handleTeamAnswer(team, selectedOpt, btnElement) {
  if (!gameState.active || gameState.isPaused || gameState.answerLocked) return;
  if (gameState.teamAttempted[team]) return; // Tim ini sudah mencoba soal ini

  gameState.teamAttempted[team] = true;

  const currentQ = gameState.questions[gameState.currentQIndex];
  if (!currentQ) return;

  const isCorrect = (selectedOpt.trim().toLowerCase() === currentQ.a.trim().toLowerCase());
  const consoleEl = document.getElementById(`pinisi-console-${team}`);
  const otherTeam = team === 'red' ? 'blue' : 'red';

  if (isCorrect) {
    // 1. JAWABAN BENAR (+125 Poin): Kunci ronde dan beri poin pada pemenang
    gameState.answerLocked = true;
    try { sfx.playCorrect(); } catch (_) {}

    // Isi langsung titik-titik kalimat rumpang di papan tengah dengan kata yang benar (highlight hijau)
    const qEl = document.getElementById('pinisi-question-text');
    if (qEl) {
      qEl.innerHTML = currentQ.q.replace(
        '_____', 
        `<span class="text-emerald-400 font-black px-2.5 py-0.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 shadow-sm mx-1 underline decoration-2 inline-block">${currentQ.a}</span>`
      );
    }

    // Kunci tombol kedua kubu
    document.querySelectorAll('.pinisi-btn-red, .pinisi-btn-blue').forEach(b => {
      b.style.pointerEvents = 'none';
      b.classList.add('opacity-60');
    });

    btnElement.classList.remove('opacity-60', 'bg-slate-900/90', 'border-rose-500/40', 'border-blue-500/40');
    btnElement.classList.add('bg-emerald-600', 'border-emerald-400', 'text-white', 'shadow-emerald-500/50', 'shadow-lg');

    if (team === 'red') {
      gameState.redScore += 125;
    } else {
      gameState.blueScore += 125;
    }

    if (consoleEl) {
      consoleEl.classList.add('ring-4', 'ring-emerald-500/60');
    }

    updateScoresUI();
    updateShipPositions();

    const hasWon = checkWinCondition();
    if (hasWon) return;

    // Lanjut ke soal berikutnya setelah jeda 1.2 detik
    gameState.advanceTimeout = setTimeout(() => {
      advanceToNextQuestion();
    }, 1200);

  } else {
    // 2. JAWABAN SALAH (-50 Poin): Kunci HANYA tim yang salah, beri kesempatan tim lawan
    try { sfx.playWrong(); } catch (_) {}
    btnElement.classList.add('!bg-rose-600', '!border-rose-400', '!text-white', 'animate-shake');

    if (team === 'red') {
      gameState.redScore = Math.max(0, gameState.redScore - 50);
    } else {
      gameState.blueScore = Math.max(0, gameState.blueScore - 50);
    }

    // Kunci semua tombol tim yang salah untuk soal ini
    document.querySelectorAll(`.pinisi-btn-${team}`).forEach(b => {
      b.style.pointerEvents = 'none';
      b.classList.add('opacity-50');
    });

    if (consoleEl) {
      consoleEl.classList.add('ring-4', 'ring-rose-500/60');
      setTimeout(() => {
        consoleEl.classList.remove('ring-4', 'ring-rose-500/60');
      }, 800);
    }

    updateScoresUI();
    updateShipPositions();

    // Periksa apakah tim lawan sudah mencoba juga
    const otherAttempted = gameState.teamAttempted[otherTeam];

    if (otherAttempted) {
      // Kedua tim telah salah! Kunci ronde, tunjukkan jawaban benar di kedua kubu
      gameState.answerLocked = true;

      // Perlihatkan jawaban benar di kalimat rumpang tengah (highlight amber)
      const qEl = document.getElementById('pinisi-question-text');
      if (qEl) {
        qEl.innerHTML = currentQ.q.replace(
          '_____', 
          `<span class="text-amber-400 font-black px-2.5 py-0.5 rounded-xl bg-amber-500/20 border border-amber-500/40 shadow-sm mx-1 underline decoration-2 inline-block">${currentQ.a}</span>`
        );
      }

      ['red', 'blue'].forEach(t => {
        const targetConsole = document.getElementById(`pinisi-choices-${t}`);
        if (targetConsole) {
          targetConsole.querySelectorAll('button').forEach(b => {
            const val = decodeURIComponent(b.getAttribute('data-option') || '');
            if (val.trim().toLowerCase() === currentQ.a.trim().toLowerCase()) {
              b.classList.remove('opacity-50', 'opacity-60', 'border-slate-700/80', 'border-rose-500/40', 'border-blue-500/40');
              b.classList.add('border-2', 'border-emerald-400', 'bg-emerald-950/80', 'text-emerald-200');
            }
          });
        }
      });

      // Lanjut ke soal berikutnya setelah 1.5 detik
      gameState.advanceTimeout = setTimeout(() => {
        advanceToNextQuestion();
      }, 1500);
    }
    // Jika tim lawan belum mencoba, biarkan konsol tim lawan tetap aktif!
  }
}

function advanceToNextQuestion() {
  document.getElementById('pinisi-console-red')?.classList.remove('ring-4', 'ring-emerald-500/60', 'ring-rose-500/60');
  document.getElementById('pinisi-console-blue')?.classList.remove('ring-4', 'ring-emerald-500/60', 'ring-rose-500/60');

  document.querySelectorAll('.pinisi-btn-red, .pinisi-btn-blue').forEach(b => {
    b.style.pointerEvents = 'auto';
    b.classList.remove('opacity-50', 'opacity-60');
  });

  gameState.currentQIndex++;
  loadCurrentQuestion();
}

function updateScoresUI() {
  const redScoreEl = document.getElementById('pinisi-score-red');
  const blueScoreEl = document.getElementById('pinisi-score-blue');
  if (redScoreEl) redScoreEl.textContent = gameState.redScore;
  if (blueScoreEl) blueScoreEl.textContent = gameState.blueScore;
}

function updateShipPositions() {
  const target = Math.max(500, gameState.targetScore);
  const redPct = Math.min(100, Math.round((gameState.redScore / target) * 100));
  const bluePct = Math.min(100, Math.round((gameState.blueScore / target) * 100));

  // Posisi kapal minimum 4% (agar tidak terpotong di tepi kiri) dan maksimal 92% (garis finish)
  const redPos = 4 + (redPct * 0.88);
  const bluePos = 4 + (bluePct * 0.88);

  const shipRed = document.getElementById('pinisi-ship-red');
  const shipBlue = document.getElementById('pinisi-ship-blue');
  const trailRed = document.getElementById('pinisi-trail-red');
  const trailBlue = document.getElementById('pinisi-trail-blue');

  if (shipRed) shipRed.style.left = `${redPos}%`;
  if (shipBlue) shipBlue.style.left = `${bluePos}%`;
  if (trailRed) trailRed.style.width = `${redPct}%`;
  if (trailBlue) trailBlue.style.width = `${bluePct}%`;
}

function checkWinCondition() {
  const target = gameState.targetScore;
  if (gameState.redScore >= target || gameState.blueScore >= target) {
    gameState.active = false;
    
    let winner = 'red';
    if (gameState.blueScore > gameState.redScore) winner = 'blue';
    else if (gameState.blueScore === gameState.redScore) winner = 'tie';

    setTimeout(() => {
      showWinnerModal(winner);
    }, 600);
    return true;
  }
  return false;
}

function showWinnerModal(winner) {
  try { sfx.playVictory(); } catch (_) {}
  launchConfetti();

  const modal = document.getElementById('pinisi-winner-modal');
  const title = document.getElementById('pinisi-winner-title');
  const finalRed = document.getElementById('pinisi-final-red');
  const finalBlue = document.getElementById('pinisi-final-blue');

  if (finalRed) finalRed.textContent = gameState.redScore;
  if (finalBlue) finalBlue.textContent = gameState.blueScore;

  if (title) {
    if (winner === 'red') {
      title.textContent = '🏆 TIM MERAH MENANG! 🏆';
      title.className = 'text-2xl sm:text-3xl font-black font-display tracking-tight text-rose-400';
    } else if (winner === 'blue') {
      title.textContent = '🏆 TIM BIRU MENANG! 🏆';
      title.className = 'text-2xl sm:text-3xl font-black font-display tracking-tight text-blue-400';
    } else {
      title.textContent = '🤝 HASIL SERI! 🤝';
      title.className = 'text-2xl sm:text-3xl font-black font-display tracking-tight text-amber-400';
    }
  }

  if (modal) modal.classList.remove('hidden');
}

function toggleTeacherPause(forceState) {
  gameState.isPaused = (typeof forceState === 'boolean') ? forceState : !gameState.isPaused;
  sfx.playClick();

  const modal = document.getElementById('pinisi-pause-modal');
  const pauseBtn = document.getElementById('btn-pinisi-pause');

  if (gameState.isPaused) {
    // Batalkan advanceTimeout jika sedang aktif agar soal tidak berpindah di latar belakang!
    if (gameState.advanceTimeout) {
      clearTimeout(gameState.advanceTimeout);
      gameState.advanceTimeout = null;
      gameState.wasWaitingToAdvance = true;
    } else {
      gameState.wasWaitingToAdvance = false;
    }

    // Tampilkan kalimat lengkap dan penjelasan di modal jeda
    const currentQ = gameState.questions[gameState.currentQIndex];
    if (currentQ) {
      const sentenceEl = document.getElementById('pinisi-pause-sentence');
      const expEl = document.getElementById('pinisi-pause-explanation');
      if (sentenceEl) {
        sentenceEl.innerHTML = currentQ.q.replace(
          '_____', 
          `<span class="text-emerald-400 underline decoration-2 font-black">${currentQ.a}</span>`
        );
      }
      if (expEl) {
        expEl.textContent = currentQ.exp || 'Tidak ada catatan tambahan untuk kalimat ini.';
      }
    }
    if (modal) modal.classList.remove('hidden');
    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-play"></i> <span class="hidden sm:inline">Lanjut</span>';
      pauseBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer';
    }
  } else {
    if (modal) modal.classList.add('hidden');
    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i> <span class="hidden sm:inline">Jeda Guru</span>';
      pauseBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer';
    }
    if (gameState.wasWaitingToAdvance) {
      gameState.wasWaitingToAdvance = false;
      gameState.advanceTimeout = setTimeout(() => {
        advanceToNextQuestion();
      }, 600);
    }
  }
}

function copyMatchRecap() {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const faseNames = {
    'fase-a': 'Fase A (Kelas 1–2 SD)',
    'fase-b': 'Fase B (Kelas 3–4 SD)',
    'fase-c': 'Fase C (Kelas 5–6 SD)'
  };

  const diffNames = {
    'mudah': 'Mudah',
    'sedang': 'Sedang',
    'hebat': 'Hebat'
  };

  const winnerStr = gameState.redScore > gameState.blueScore 
    ? 'Tim Merah (🔴)' 
    : (gameState.blueScore > gameState.redScore ? 'Tim Biru (🔵)' : 'Seri (🤝)');

  const text = `🏆 REKAP NILAI: DUEL PINISI KATA (LITERASI RUMPANG)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Tanggal: ${dateStr}
🎓 Jenjang: ${faseNames[gameState.fase] || gameState.fase}
📊 Tingkat: ${diffNames[gameState.difficulty] || gameState.difficulty}
📦 Paket Soal: ${gameState.paket === 'all' ? 'Acak Semua Paket' : 'Paket ' + gameState.paket}
🎯 Target Skor: ${gameState.targetScore} Poin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Skor Tim Merah: ${gameState.redScore} Poin
🔵 Skor Tim Biru: ${gameState.blueScore} Poin
🥇 Pemenang: ${winnerStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pusat Game Edukasi KKG Gugus 3 Wanayasa`;

  navigator.clipboard.writeText(text).then(() => {
    try { sfx.playCorrect(); } catch (_) {}
    const btn = document.getElementById('btn-pinisi-copy-recap');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-check text-emerald-400"></i> <span class="text-emerald-300">Rekap Berhasil Disalin ke Clipboard!</span>';
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-copy"></i> <span>Salin Rekap Nilai Pertandingan</span>';
      }, 2500);
    }
  }).catch(() => {
    alert('Gagal menyalin rekap. Silakan salin secara manual.');
  });
}
