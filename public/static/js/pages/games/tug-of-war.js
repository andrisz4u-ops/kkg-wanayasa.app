/**
 * tug-of-war.js — Game 5: Tarik Tambang Cerdas Cermat (Split Screen Duel)
 * Dilengkapi dengan Mode Ronde Sinkron (1 Soal Bersama), Bank Soal Fase A/B/C, dan Mode Jeda Guru.
 */

import { sfx, launchConfetti } from './audio.js';
import { getQuestionsByFilter } from './questions-bank.js';

let ropePosition = 0; // -100 (Red win) to +100 (Blue win)
let WIN_THRESHOLD = 80;
let isGameOver = false;
let isPaused = false;

let selectedFase = 'fase-b';
let selectedTingkat = 'sedang';
let selectedPaket = 'all';
let gameMode = 'sync'; // 'sync' (Ronde Serempak 1 Soal Bersama) | 'async' (Adu Cepat Bebas)

// Helper Badge Mapel dengan Warna & Ikon Tematik
function getMapelBadgeHtml(mapelName) {
  const MAPEL_CONFIG = {
    'Matematika': { icon: '📐', class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    'IPAS': { icon: '🌿', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    'B. Indonesia': { icon: '📖', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    'Pancasila': { icon: '🦅', class: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
  };
  const cfg = MAPEL_CONFIG[mapelName] || { icon: '⭐', class: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
  return `<span class="text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${cfg.class}"><span>${cfg.icon}</span> <span>${mapelName || 'Umum'}</span></span>`;
}

// Untuk Mode Sync: 1 Soal Bersama
let sharedQuestion = null;
let roundLocked = false;

// Untuk Mode Async: Soal terpisah
let currentQRed = null;
let currentQBlue = null;

function getRandomQuestion() {
  const questions = getQuestionsByFilter(selectedFase, selectedTingkat, selectedPaket, 1);
  const item = questions[0] || { q: "Fotosintesis tumbuhan menghasilkan...", a: "Oksigen", opts: ["Oksigen", "Karbondioksida", "Nitrogen", "Minyak"], mapel: "IPAS" };
  const shuffledOpts = [...item.opts].sort(() => Math.random() - 0.5);
  return { q: item.q, a: item.a, opts: shuffledOpts, mapel: item.mapel || 'IPAS' };
}

export function renderTugOfWar() {
  return `
    <div class="flex flex-col w-full h-full bg-slate-950 text-white select-none overflow-hidden relative">
      
      <!-- TOP HEADER: ANIMASI TALI TAMBANG & KONTROL MODE -->
      <div class="bg-slate-900/95 px-4 sm:px-6 py-2.5 border-b border-slate-800 relative overflow-hidden z-20">
        
        <div class="flex flex-wrap items-center justify-between text-xs font-bold gap-2 mb-2">
          <span class="text-rose-400 font-black uppercase tracking-wider flex items-center gap-1">
            🚩 Garis Menang Merah
          </span>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Jenjang Kelas Select -->
            <select id="tug-fase-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
              <option value="fase-a">Fase A (Kelas 1–2)</option>
              <option value="fase-b" selected>Fase B (Kelas 3–4)</option>
              <option value="fase-c">Fase C (Kelas 5–6)</option>
            </select>

            <!-- Tingkat Select -->
            <select id="tug-tingkat-select" class="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
              <option value="mudah">🟢 Mudah</option>
              <option value="sedang" selected>🟡 Sedang</option>
              <option value="hebat">🔴 Hebat</option>
            </select>

            <!-- Paket Select -->
            <select id="tug-paket-select" class="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
              <option value="all" selected>🎲 Acak Semua</option>
              <option value="1">Paket 1</option>
              <option value="2">Paket 2</option>
              <option value="3">Paket 3</option>
              <option value="4">Paket 4</option>
              <option value="5">Paket 5</option>
            </select>

            <!-- Mode Ronde Select -->
            <select id="tug-mode-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
              <option value="sync" selected>Mode Serempak</option>
              <option value="async">Mode Bebas</option>
            </select>

            <!-- Target Tarikan Menang -->
            <select id="tug-target-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer" title="Target Jarak Tarikan Menang">
              <option value="60">⚡ Cepat (60 Poin)</option>
              <option value="80" selected>⚖️ Standar (80 Poin)</option>
              <option value="100">🔥 Panjang (100 Poin)</option>
            </select>

            <button id="btn-tug-pause" class="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer">
              <i class="fas fa-pause mr-1"></i> Jeda
            </button>
          </div>

          <span class="text-blue-400 font-black uppercase tracking-wider flex items-center gap-1">
            Garis Menang Biru 🚩
          </span>
        </div>

        <!-- ROPE ARENA VISUAL -->
        <div class="relative h-16 sm:h-20 bg-slate-950 rounded-2xl border border-slate-800 flex items-center overflow-hidden shadow-inner">
          
          <!-- Garis Batas Kiri (Red Win Zone) -->
          <div class="absolute left-[12%] top-0 bottom-0 w-1 bg-rose-500 border-r border-rose-400 border-dashed z-10"></div>
          
          <!-- Garis Titik Tengah Netral -->
          <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 z-10"></div>

          <!-- Garis Batas Kanan (Blue Win Zone) -->
          <div class="absolute right-[12%] top-0 bottom-0 w-1 bg-blue-500 border-l border-blue-400 border-dashed z-10"></div>

          <!-- The Rope and Avatars Track -->
          <div id="tug-rope-track" class="absolute w-full flex items-center justify-center transition-transform duration-300 ease-out" style="transform: translateX(0%);">
            
            <!-- Tim Merah (Pullers) -->
            <div class="flex items-center gap-1 text-2xl sm:text-3xl select-none mr-2">
              <span>🔴</span>
              <span class="animate-pulse">🤼</span>
            </div>

            <!-- Tali Tambang Visual -->
            <div class="h-4 sm:h-5 w-64 sm:w-96 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-full border border-amber-900 shadow-inner relative flex items-center justify-center">
              <!-- Pita Bendera Merah Putih di Tengah Tali -->
              <div class="w-4 h-9 bg-gradient-to-b from-rose-500 to-white rounded-sm shadow-md border border-slate-900 animate-pulse"></div>
            </div>

            <!-- Tim Biru (Pullers) -->
            <div class="flex items-center gap-1 text-2xl sm:text-3xl select-none ml-2">
              <span class="animate-pulse">🤼</span>
              <span>🔵</span>
            </div>

          </div>

        </div>
      </div>

      <!-- MAIN SPLIT SCREEN: DUAL QUESTION BOARDS -->
      <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 relative overflow-hidden">
        
        <!-- TIM MERAH (KIRI) -->
        <div class="bg-rose-950/20 flex flex-col justify-center p-3 sm:p-5 relative overflow-y-auto h-full min-h-0" id="tug-red-zone">
          <!-- Render soal tim merah -->
        </div>

        <!-- TIM BIRU (KANAN) -->
        <div class="bg-blue-950/20 flex flex-col justify-center p-3 sm:p-5 relative overflow-y-auto h-full min-h-0" id="tug-blue-zone">
          <!-- Render soal tim biru -->
        </div>

      </div>

      <!-- TEACHER PAUSE OVERLAY -->
      <div id="tug-pause-overlay" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center hidden animate-fade-in">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mb-4">
          ⏸️
        </div>
        <h3 class="text-2xl font-black font-display text-white mb-2">Mode Diskusi Guru Aktif</h3>
        <p class="text-sm text-slate-300 max-w-md mb-6">
          Pertandingan tarik tambang dijeda. Guru dapat menjelaskan konsep soal yang sedang dibahas.
        </p>
        <button id="btn-tug-resume" class="btn btn-primary px-6 py-3 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
          <i class="fas fa-play mr-2"></i> Lanjutkan Pertandingan
        </button>
      </div>

      <!-- WINNER MODAL -->
      <div id="tug-winner-modal" class="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden animate-fade-in">
        <div class="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div class="text-6xl" id="tug-winner-icon">🏆 🔴</div>
          <h3 id="tug-winner-title" class="text-3xl font-black font-display text-white">
            TIM MERAH JUARA TARIK TAMBANG!
          </h3>
          <p class="text-sm text-slate-300">
            Kompak dan cepat! Berhasil menarik pita tambang melintasi garis kemenangan!
          </p>
          <div class="flex items-center justify-center gap-3">
            <button id="btn-tug-play-again" class="btn btn-primary px-5 py-2.5 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
              <i class="fas fa-rotate-right mr-2"></i> Main Lagi
            </button>
            <button id="btn-tug-copy-summary" class="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
              <i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

function updateRopeUI() {
  const track = document.getElementById('tug-rope-track');
  if (track) {
    // Translasi persentase responsif: ±38% menggerakkan pita tengah tepat ke garis batas kemenangan (12% & 88%)
    const pctShift = (ropePosition / WIN_THRESHOLD) * 38;
    track.style.transform = `translateX(${pctShift}%)`;
  }
}

function renderBoards() {
  if (gameMode === 'sync') {
    renderTeamQuestionSync('red');
    renderTeamQuestionSync('blue');
  } else {
    renderTeamQuestionAsync('red');
    renderTeamQuestionAsync('blue');
  }
}

// MODE SYNC: Render soal yang sama untuk kedua tim
function renderTeamQuestionSync(team) {
  const container = document.getElementById(`tug-${team}-zone`);
  if (!container || !sharedQuestion) return;

  const isRed = team === 'red';

  container.innerHTML = `
    <div class="w-full max-w-2xl xl:max-w-4xl mx-auto px-2 sm:px-6 space-y-3 sm:space-y-4 my-auto">
      <div class="flex items-center justify-between">
        <span class="px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider ${isRed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}">
          ${isRed ? '🔴 Tim Merah' : '🔵 Tim Biru'}
        </span>
        ${getMapelBadgeHtml(sharedQuestion.mapel)}
      </div>

      <!-- Kartu Soal Bersama -->
      <div class="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 ${isRed ? 'border-rose-500/40' : 'border-blue-500/40'} shadow-2xl">
        <p class="text-lg sm:text-xl xl:text-2xl font-bold text-white leading-relaxed">
          ${sharedQuestion.q}
        </p>
      </div>

      <!-- 4 Tombol Pilihan Jawaban (Fluid Fit) -->
      <div class="grid grid-cols-2 gap-2.5 sm:gap-4">
        ${sharedQuestion.opts.map(opt => `
          <button 
            type="button" 
            data-opt="${opt}"
            class="tug-btn-${team} p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl font-black text-base sm:text-xl xl:text-2xl border-2 sm:border-3 transition-all active:scale-95 text-left cursor-pointer flex items-center justify-between shadow-lg active:shadow-inner ${
              isRed 
                ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/50 text-rose-100 hover:border-rose-400' 
                : 'bg-blue-950/80 hover:bg-blue-900 border-blue-500/50 text-blue-100 hover:border-blue-400'
            }"
            style="touch-action: manipulation;"
          >
            <span>${opt}</span>
            <i class="fas fa-arrow-right text-xs opacity-40"></i>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll(`.tug-btn-${team}`).forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const choice = btn.getAttribute('data-opt');
      handleSyncAnswer(team, choice, btn);
    });
  });
}

function handleSyncAnswer(team, choice, btn) {
  if (isGameOver || isPaused || roundLocked || !sharedQuestion) return;
  const isRed = team === 'red';
  const isCorrect = choice === sharedQuestion.a;

  if (isCorrect) {
    roundLocked = true;
    sfx.playTug();
    sfx.playCorrect();
    btn.classList.add('!bg-emerald-500', '!text-white', '!border-emerald-400');

    // Tarik tali 24px ke arah pemenang ronde
    if (isRed) ropePosition -= 24;
    else ropePosition += 24;

    updateRopeUI();

    if (ropePosition <= -WIN_THRESHOLD) {
      endGame('red');
      return;
    } else if (ropePosition >= WIN_THRESHOLD) {
      endGame('blue');
      return;
    }

    setTimeout(() => {
      sharedQuestion = getRandomQuestion();
      roundLocked = false;
      renderBoards();
    }, 450);

  } else {
    sfx.playWrong();
    btn.classList.add('!bg-rose-500', '!text-white', 'animate-shake');

    // Penalti salah: tali bergeser sedikit ke lawan
    if (isRed) ropePosition = Math.min(WIN_THRESHOLD, ropePosition + 8);
    else ropePosition = Math.max(-WIN_THRESHOLD, ropePosition - 8);
    updateRopeUI();

    setTimeout(() => {
      btn.classList.remove('!bg-rose-500', '!text-white', 'animate-shake');
    }, 400);
  }
}

// MODE ASYNC: Render soal terpisah
function renderTeamQuestionAsync(team) {
  const container = document.getElementById(`tug-${team}-zone`);
  if (!container) return;

  const isRed = team === 'red';
  const qObj = isRed ? currentQRed : currentQBlue;
  if (!qObj) return;

  container.innerHTML = `
    <div class="w-full max-w-2xl xl:max-w-4xl mx-auto px-2 sm:px-6 space-y-3 sm:space-y-4 my-auto">
      <div class="flex items-center justify-between">
        <span class="px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider ${isRed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}">
          ${isRed ? '🔴 Tim Merah' : '🔵 Tim Biru'}
        </span>
        ${getMapelBadgeHtml(qObj.mapel)}
      </div>

      <div class="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 ${isRed ? 'border-rose-500/40' : 'border-blue-500/40'} shadow-2xl">
        <p class="text-lg sm:text-xl xl:text-2xl font-bold text-white leading-relaxed">
          ${qObj.q}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2.5 sm:gap-4">
        ${qObj.opts.map(opt => `
          <button 
            type="button" 
            data-opt="${opt}"
            class="tug-btn-${team} p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl font-black text-base sm:text-xl xl:text-2xl border-2 sm:border-3 transition-all active:scale-95 text-left cursor-pointer flex items-center justify-between shadow-lg active:shadow-inner ${
              isRed 
                ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/50 text-rose-100 hover:border-rose-400' 
                : 'bg-blue-950/80 hover:bg-blue-900 border-blue-500/50 text-blue-100 hover:border-blue-400'
            }"
            style="touch-action: manipulation;"
          >
            <span>${opt}</span>
            <i class="fas fa-arrow-right text-xs opacity-40"></i>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll(`.tug-btn-${team}`).forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const choice = btn.getAttribute('data-opt');
      handleAsyncAnswer(team, choice, btn);
    });
  });
}

function handleAsyncAnswer(team, choice, btn) {
  if (isGameOver || isPaused) return;
  const isRed = team === 'red';
  const qObj = isRed ? currentQRed : currentQBlue;
  if (!qObj) return;

  const isCorrect = choice === qObj.a;

  if (isCorrect) {
    sfx.playTug();
    sfx.playCorrect();
    btn.classList.add('!bg-emerald-500', '!text-white', '!border-emerald-400');

    if (isRed) ropePosition -= 20;
    else ropePosition += 20;

    updateRopeUI();

    if (ropePosition <= -WIN_THRESHOLD) {
      endGame('red');
      return;
    } else if (ropePosition >= WIN_THRESHOLD) {
      endGame('blue');
      return;
    }

    setTimeout(() => {
      if (isRed) currentQRed = getRandomQuestion();
      else currentQBlue = getRandomQuestion();
      renderTeamQuestionAsync(team);
    }, 250);

  } else {
    sfx.playWrong();
    btn.classList.add('!bg-rose-500', '!text-white', 'animate-shake');

    if (isRed) ropePosition = Math.min(WIN_THRESHOLD, ropePosition + 6);
    else ropePosition = Math.max(-WIN_THRESHOLD, ropePosition - 6);
    updateRopeUI();

    setTimeout(() => {
      btn.classList.remove('!bg-rose-500', '!text-white', 'animate-shake');
    }, 400);
  }
}

function endGame(winnerTeam) {
  isGameOver = true;
  sfx.playVictory();
  launchConfetti();

  const isRed = winnerTeam === 'red';
  const modal = document.getElementById('tug-winner-modal');
  const icon = document.getElementById('tug-winner-icon');
  const title = document.getElementById('tug-winner-title');

  if (icon) icon.textContent = isRed ? '🏆 🔴' : '🏆 🔵';
  if (title) {
    title.textContent = isRed ? 'TIM MERAH JUARA TARIK TAMBANG!' : 'TIM BIRU JUARA TARIK TAMBANG!';
    title.className = `text-3xl font-black font-display ${isRed ? 'text-rose-500' : 'text-blue-500'}`;
  }
  if (modal) modal.classList.remove('hidden');
}

export function initTugOfWar() {
  ropePosition = 0;
  isGameOver = false;
  isPaused = false;
  roundLocked = false;

  sharedQuestion = getRandomQuestion();
  currentQRed = getRandomQuestion();
  currentQBlue = getRandomQuestion();

  updateRopeUI();
  renderBoards();

  const faseSelect = document.getElementById('tug-fase-select');
  if (faseSelect) {
    faseSelect.value = selectedFase;
    faseSelect.addEventListener('change', (e) => {
      selectedFase = e.target.value;
      initTugOfWar();
    });
  }

  const tingkatSelect = document.getElementById('tug-tingkat-select');
  if (tingkatSelect) {
    tingkatSelect.value = selectedTingkat;
    tingkatSelect.addEventListener('change', (e) => {
      selectedTingkat = e.target.value;
      initTugOfWar();
    });
  }

  const paketSelect = document.getElementById('tug-paket-select');
  if (paketSelect) {
    paketSelect.value = selectedPaket;
    paketSelect.addEventListener('change', (e) => {
      selectedPaket = e.target.value;
      initTugOfWar();
    });
  }

  const modeSelect = document.getElementById('tug-mode-select');
  if (modeSelect) {
    modeSelect.value = gameMode;
    modeSelect.addEventListener('change', (e) => {
      gameMode = e.target.value;
      initTugOfWar();
    });
  }

  const targetSelect = document.getElementById('tug-target-select');
  if (targetSelect) {
    targetSelect.value = String(WIN_THRESHOLD);
    targetSelect.addEventListener('change', (e) => {
      WIN_THRESHOLD = parseInt(e.target.value, 10) || 80;
      updateRopeUI();
    });
  }

  const pauseBtn = document.getElementById('btn-tug-pause');
  const pauseOverlay = document.getElementById('tug-pause-overlay');
  const resumeBtn = document.getElementById('btn-tug-resume');

  if (pauseBtn && pauseOverlay) {
    pauseBtn.addEventListener('click', () => {
      isPaused = true;
      pauseOverlay.classList.remove('hidden');
      sfx.playClick();
    });
  }

  if (resumeBtn && pauseOverlay) {
    resumeBtn.addEventListener('click', () => {
      isPaused = false;
      pauseOverlay.classList.add('hidden');
      sfx.playClick();
    });
  }

  const againBtn = document.getElementById('btn-tug-play-again');
  if (againBtn) {
    againBtn.addEventListener('click', () => {
      const modal = document.getElementById('tug-winner-modal');
      if (modal) modal.classList.add('hidden');
      initTugOfWar();
    });
  }

  const copyBtn = document.getElementById('btn-tug-copy-summary');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const winner = ropePosition < 0 ? 'Tim Merah' : 'Tim Biru';
      const text = `🏆 Rekap Tarik Tambang Cerdas Cermat (KKG Wanayasa)\nJuara: ${winner}\nJenjang: ${selectedFase.toUpperCase()}\nMode: ${gameMode === 'sync' ? 'Ronde Serempak' : 'Adu Cepat'}`;
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '<i class="fas fa-check text-emerald-400 mr-1.5"></i> Tersalin!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap';
      }, 2000);
    });
  }
}
