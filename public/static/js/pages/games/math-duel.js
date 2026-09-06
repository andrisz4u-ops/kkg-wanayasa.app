/**
 * math-duel.js — Game 2: Si Jago Berhitung (Split-Screen Math Battle)
 * Mendukung 4 Operasi: Penjumlahan, Pengurangan, Perkalian, dan Campuran (+, −, ×, ÷)
 * dengan 3 Tingkat Kesulitan (Mudah, Sedang, Hebat).
 * Dioptimalkan untuk multi-touch simultan di layar sentuh besar IFP / Smart Board.
 */

import { sfx, launchConfetti } from './audio.js';

let gameState = {
  active: false,
  isPaused: false,
  operation: 'mul', // 'add' | 'sub' | 'mul' | 'mix'
  difficulty: 'sedang', // 'mudah' | 'sedang' | 'hebat'
  targetScore: 10,
  red: {
    score: 0,
    streak: 0,
    currentQuestion: null,
    options: [],
    lastTapTime: 0
  },
  blue: {
    score: 0,
    streak: 0,
    currentQuestion: null,
    options: [],
    lastTapTime: 0
  }
};

const OP_CONFIG = {
  add: { name: 'Penjumlahan', symbol: '+', icon: '➕' },
  sub: { name: 'Pengurangan', symbol: '−', icon: '➖' },
  mul: { name: 'Perkalian', symbol: '×', icon: '✖️' },
  mix: { name: 'Campuran', symbol: '🔀', icon: '🔀' }
};

const DIFF_CONFIG = {
  mudah: { name: 'Mudah', badge: 'bg-emerald-500/20 text-emerald-300' },
  sedang: { name: 'Sedang', badge: 'bg-amber-500/20 text-amber-300' },
  hebat: { name: 'Hebat', badge: 'bg-rose-500/20 text-rose-300' }
};

function generateQuestion(op, diff) {
  let activeOp = op;
  if (op === 'mix') {
    const ops = ['add', 'sub', 'mul', 'div'];
    activeOp = ops[Math.floor(Math.random() * ops.length)];
  }

  let a = 1, b = 1, symbol = '+', correct = 2;

  if (activeOp === 'add') {
    symbol = '+';
    if (diff === 'mudah') {
      a = Math.floor(Math.random() * 9) + 1; // 1-9
      b = Math.floor(Math.random() * 9) + 1; // 1-9
    } else if (diff === 'sedang') {
      a = Math.floor(Math.random() * 25) + 10; // 10-34
      b = Math.floor(Math.random() * 20) + 5;  // 5-24
    } else {
      a = Math.floor(Math.random() * 50) + 25; // 25-74
      b = Math.floor(Math.random() * 50) + 15; // 15-64
    }
    correct = a + b;
  } else if (activeOp === 'sub') {
    symbol = '−';
    let minDiff = 1, maxDiff = 9, minB = 1, maxB = 9;
    if (diff === 'sedang') {
      minDiff = 5; maxDiff = 25; minB = 5; maxB = 25;
    } else if (diff === 'hebat') {
      minDiff = 15; maxDiff = 60; minB = 15; maxB = 50;
    }
    const resultDiff = Math.floor(Math.random() * (maxDiff - minDiff + 1)) + minDiff;
    b = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
    a = b + resultDiff; // dipastikan a > b dan hasil positif!
    correct = resultDiff;
  } else if (activeOp === 'mul') {
    symbol = '×';
    if (diff === 'mudah') {
      a = Math.floor(Math.random() * 5) + 1; // 1-5
      b = Math.floor(Math.random() * 5) + 1; // 1-5
    } else if (diff === 'sedang') {
      a = Math.floor(Math.random() * 9) + 2; // 2-10
      b = Math.floor(Math.random() * 9) + 2; // 2-10
    } else {
      a = Math.floor(Math.random() * 9) + 4; // 4-12
      b = Math.floor(Math.random() * 9) + 4; // 4-12
    }
    correct = a * b;
  } else if (activeOp === 'div') {
    symbol = '÷';
    let maxDivisor = 5, maxQuotient = 5;
    if (diff === 'sedang') {
      maxDivisor = 9; maxQuotient = 9;
    } else if (diff === 'hebat') {
      maxDivisor = 12; maxQuotient = 12;
    }
    b = Math.floor(Math.random() * (maxDivisor - 2 + 1)) + 2; // pembagi 2..max
    correct = Math.floor(Math.random() * (maxQuotient - 2 + 1)) + 2; // hasil bulat bersih!
    a = b * correct; // bilangan yang dibagi
  }

  // Generate 3 distractors cerdas
  const options = new Set([correct]);
  let tries = 0;
  while (options.size < 4 && tries < 30) {
    tries++;
    const deltas = [-1, 1, -2, 2, -3, 3, -10, 10, -5, 5];
    const delta = deltas[Math.floor(Math.random() * deltas.length)];
    const wrong = correct + delta;
    if (wrong >= 0 && wrong !== correct) {
      options.add(wrong);
    }
  }

  // Fallback jika belum 4 opsi
  let fallback = 1;
  while (options.size < 4) {
    if (!options.has(correct + fallback)) options.add(correct + fallback);
    fallback++;
  }

  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);
  return { a, b, symbol, correct, options: shuffled };
}

function nextQuestion(team) {
  const q = generateQuestion(gameState.operation, gameState.difficulty);
  gameState[team].currentQuestion = q;
  gameState[team].options = q.options;
  renderTeamBoard(team);
}

function handleAnswer(team, selectedValue, btnElement) {
  if (!gameState.active || gameState.isPaused) return;

  // Debounce 150ms untuk mencegah false double-tap sentuhan layar
  const now = Date.now();
  if (now - gameState[team].lastTapTime < 150) return;
  gameState[team].lastTapTime = now;

  const current = gameState[team].currentQuestion;
  if (!current) return;

  const isCorrect = selectedValue === current.correct;

  if (isCorrect) {
    sfx.playCorrect();
    gameState[team].score += 1;
    gameState[team].streak += 1;

    btnElement.classList.add('!bg-emerald-500', '!text-white', '!border-emerald-400', 'scale-95');

    updateScoreHeader();

    if (gameState[team].score >= gameState.targetScore) {
      endGame(team);
      return;
    }

    setTimeout(() => {
      nextQuestion(team);
    }, 180);
  } else {
    sfx.playWrong();
    gameState[team].streak = 0;

    btnElement.classList.add('!bg-rose-500', '!text-white', '!border-rose-400', 'animate-shake');
    setTimeout(() => {
      btnElement.classList.remove('!bg-rose-500', '!text-white', '!border-rose-400', 'animate-shake');
    }, 400);
  }
}

function updateScoreHeader() {
  const redScoreEl = document.getElementById('math-red-score');
  const blueScoreEl = document.getElementById('math-blue-score');
  const redCarEl = document.getElementById('math-red-car');
  const blueCarEl = document.getElementById('math-blue-car');

  if (redScoreEl) redScoreEl.textContent = gameState.red.score;
  if (blueScoreEl) blueScoreEl.textContent = gameState.blue.score;

  const redPct = Math.min(100, (gameState.red.score / gameState.targetScore) * 100);
  const bluePct = Math.min(100, (gameState.blue.score / gameState.targetScore) * 100);

  if (redCarEl) redCarEl.style.left = `calc(${redPct}% - ${redPct > 80 ? '32px' : '0px'})`;
  if (blueCarEl) blueCarEl.style.left = `calc(${bluePct}% - ${bluePct > 80 ? '32px' : '0px'})`;
}

function renderTeamBoard(team) {
  const container = document.getElementById(`math-${team}-zone`);
  if (!container) return;

  const q = gameState[team].currentQuestion;
  if (!q) return;

  const isRed = team === 'red';

  container.innerHTML = `
    <div class="flex-1 flex flex-col items-center justify-between p-1 sm:p-2.5 h-full min-h-0 w-full overflow-hidden">
      
      <!-- Kartu Soal Raksasa (Proporsional & Auto-Fit Layar) -->
      <div class="text-center shrink-0 flex flex-col items-center justify-center pt-1 pb-1 sm:pb-2">
        <span class="inline-block px-3.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-1 ${isRed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}">
          ${isRed ? '🔴 Tim Merah' : '🔵 Tim Biru'} ${gameState[team].streak >= 3 ? '🔥 Kombo ' + gameState[team].streak + 'x' : ''}
        </span>
        <div class="font-black font-display tracking-tight text-white select-none drop-shadow-2xl leading-none py-1" style="font-size: clamp(2.8rem, 8.5vh, 6.2rem);">
          ${q.a} ${q.symbol} ${q.b}
        </div>
        <p class="text-xs sm:text-sm font-medium ${isRed ? 'text-rose-200/80' : 'text-blue-200/80'}">
          Sentuh jawaban yang benar secepat mungkin!
        </p>
      </div>

      <!-- 4 Tombol Pilihan Jawaban Multi-touch (Guaranteed Fit with grid-rows-2) -->
      <div class="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-3.5 w-full max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto flex-1 min-h-0 pb-2 touch-manipulation">
        ${q.options.map((opt) => `
          <button 
            type="button"
            data-team="${team}"
            data-val="${opt}"
            class="math-btn-${team} w-full h-full rounded-2xl sm:rounded-3xl font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl transition-all active:scale-95 border-3 sm:border-4 select-none cursor-pointer flex items-center justify-center shadow-xl active:shadow-inner ${
              isRed 
                ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/60 text-rose-100 hover:border-rose-400' 
                : 'bg-blue-950/80 hover:bg-blue-900 border-blue-500/60 text-blue-100 hover:border-blue-400'
            }"
            style="touch-action: manipulation;"
          >
            ${opt}
          </button>
        `).join('')}
      </div>

    </div>
  `;

  const buttons = container.querySelectorAll(`.math-btn-${team}`);
  buttons.forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const val = parseInt(btn.getAttribute('data-val'), 10);
      handleAnswer(team, val, btn);
    });
  });
}

function endGame(winnerTeam) {
  gameState.active = false;
  sfx.playVictory();
  launchConfetti();

  const modal = document.getElementById('math-winner-modal');
  const modalText = document.getElementById('math-winnerText');
  const isRed = winnerTeam === 'red';

  const opLabel = OP_CONFIG[gameState.operation]?.name || 'Berhitung';
  const diffLabel = DIFF_CONFIG[gameState.difficulty]?.name || 'Standar';

  if (modal && modalText) {
    modalText.innerHTML = `
      <div class="text-6xl mb-4">${isRed ? '🏆 🔴' : '🏆 🔵'}</div>
      <h3 class="text-3xl sm:text-4xl font-black font-display mb-2 ${isRed ? 'text-rose-500' : 'text-blue-500'}">
        ${isRed ? 'TIM MERAH MENANG!' : 'TIM BIRU MENANG!'}
      </h3>
      <p class="text-base text-slate-300 mb-2">
        Hebat sekali! Berhasil mencapai target <b>${gameState.targetScore} poin</b> lebih cepat.
      </p>
      <div class="text-xs text-slate-400 mb-6 flex items-center justify-center gap-2">
        <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold">${opLabel}</span>
        <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold">${diffLabel}</span>
      </div>
      <div class="flex items-center justify-center gap-3">
        <button id="btn-math-play-again" class="btn btn-primary px-5 py-2.5 text-sm font-bold rounded-2xl shadow-lg cursor-pointer">
          <i class="fas fa-rotate-right mr-1.5"></i> Main Lagi
        </button>
        <button id="btn-math-copy-summary" class="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
          <i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap
        </button>
      </div>
    `;
    modal.classList.remove('hidden');

    const btnAgain = document.getElementById('btn-math-play-again');
    if (btnAgain) {
      btnAgain.onclick = () => {
        modal.classList.add('hidden');
        startGame();
      };
    }

    const btnCopy = document.getElementById('btn-math-copy-summary');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const text = `🏆 Rekap Si Jago Berhitung IFP (KKG Wanayasa)\nJuara: ${isRed ? 'Tim Merah' : 'Tim Biru'}\nOperasi: ${opLabel}\nTingkat: ${diffLabel}\nTarget Skor: ${gameState.targetScore} Poin`;
        navigator.clipboard.writeText(text);
        btnCopy.innerHTML = '<i class="fas fa-check text-emerald-400 mr-1.5"></i> Tersalin!';
        setTimeout(() => {
          btnCopy.innerHTML = '<i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap';
        }, 2000);
      };
    }
  }
}

export function startGame() {
  gameState.active = true;
  gameState.isPaused = false;
  gameState.red.score = 0;
  gameState.red.streak = 0;
  gameState.blue.score = 0;
  gameState.blue.streak = 0;

  const modal = document.getElementById('math-winner-modal');
  if (modal) modal.classList.add('hidden');

  updateScoreHeader();
  nextQuestion('red');
  nextQuestion('blue');
}

export function renderMathDuel() {
  return `
    <div class="flex flex-col w-full h-full bg-slate-950 text-white relative select-none overflow-hidden">
      
      <!-- TOP BAR: SCORE & SETTINGS (Compact & Ergonomic) -->
      <div class="bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
        
        <!-- Left: Tim Merah Score -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 font-bold text-base">
            🔴
          </div>
          <div>
            <div class="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Tim Merah</div>
            <div class="text-xl sm:text-2xl font-black font-display text-white leading-none"><span id="math-red-score">0</span> <span class="text-[11px] text-slate-500">/ ${gameState.targetScore}</span></div>
          </div>
        </div>

        <!-- Center: Race Tracker & Controls -->
        <div class="flex-1 mx-2 sm:mx-4 min-w-[280px]">
          <div class="flex flex-wrap items-center justify-between text-[10px] sm:text-xs font-bold text-slate-400 mb-1 px-1 gap-2">
            <span class="flex items-center gap-1">🏁 Start</span>
            <div class="flex items-center gap-1.5 sm:gap-2">
              
              <!-- Operasi Hitung Select -->
              <select id="math-op-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
                <option value="add">➕ Penjumlahan</option>
                <option value="sub">➖ Pengurangan</option>
                <option value="mul" selected>✖️ Perkalian</option>
                <option value="mix">🔀 Campuran (+,−,×,÷)</option>
              </select>

              <!-- Tingkat Kesulitan Select -->
              <select id="math-diff-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
                <option value="mudah">🟢 Mudah</option>
                <option value="sedang" selected>🟡 Sedang</option>
                <option value="hebat">🔴 Hebat</option>
              </select>

              <!-- Target Skor Select -->
              <select id="math-target-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-medium cursor-pointer">
                <option value="10" selected>Target 10</option>
                <option value="15">Target 15</option>
                <option value="20">Target 20</option>
              </select>

              <!-- Jeda Button -->
              <button id="btn-math-pause" class="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer">
                <i class="fas fa-pause mr-1"></i> Jeda
              </button>
            </div>
            <span class="flex items-center gap-1">🏆 Finis</span>
          </div>

          <!-- Dual Race Track Bars -->
          <div class="space-y-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <div class="h-4 sm:h-4.5 bg-rose-950/40 rounded-full relative overflow-hidden border border-rose-900/40">
              <div id="math-red-car" class="absolute top-0 bottom-0 left-0 transition-all duration-300 flex items-center justify-end px-1" style="width: 32px;">
                <span class="text-xs transform -scale-x-100">🏎️</span>
              </div>
            </div>
            <div class="h-4 sm:h-4.5 bg-blue-950/40 rounded-full relative overflow-hidden border border-blue-900/40">
              <div id="math-blue-car" class="absolute top-0 bottom-0 left-0 transition-all duration-300 flex items-center justify-end px-1" style="width: 32px;">
                <span class="text-xs transform -scale-x-100">🚙</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Tim Biru Score -->
        <div class="flex items-center gap-2.5">
          <div class="text-right">
            <div class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Tim Biru</div>
            <div class="text-xl sm:text-2xl font-black font-display text-white leading-none"><span id="math-blue-score">0</span> <span class="text-[11px] text-slate-500">/ ${gameState.targetScore}</span></div>
          </div>
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-base">
            🔵
          </div>
        </div>

      </div>

      <!-- MAIN SPLIT SCREEN BODY (Fit-to-Screen) -->
      <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 relative overflow-hidden">
        <div id="math-red-zone" class="bg-gradient-to-b from-rose-950/20 to-rose-950/50 flex flex-col relative p-1.5 sm:p-3 h-full min-h-0 overflow-hidden"></div>
        <div id="math-blue-zone" class="bg-gradient-to-b from-blue-950/20 to-blue-950/50 flex flex-col relative p-1.5 sm:p-3 h-full min-h-0 overflow-hidden"></div>

        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-300 font-black text-xs shadow-xl z-10">
          VS
        </div>
      </div>

      <!-- TEACHER PAUSE OVERLAY -->
      <div id="math-pause-overlay" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center hidden animate-fade-in">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mb-4">
          ⏸️
        </div>
        <h3 class="text-2xl font-black font-display text-white mb-2">Mode Diskusi Guru Aktif</h3>
        <p class="text-sm text-slate-300 max-w-md mb-6">
          Sesi berhitung dijeda sementara. Guru dapat menjelaskan cara konsep berhitung cepat kepada siswa.
        </p>
        <button id="btn-math-resume" class="btn btn-primary px-6 py-3 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
          <i class="fas fa-play mr-2"></i> Lanjutkan Duel
        </button>
      </div>

      <!-- WINNER MODAL OVERLAY -->
      <div id="math-winner-modal" class="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden animate-fade-in">
        <div class="bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl" id="math-winnerText">
        </div>
      </div>

    </div>
  `;
}

export function initMathDuel() {
  const opSelect = document.getElementById('math-op-select');
  const diffSelect = document.getElementById('math-diff-select');
  const targetSelect = document.getElementById('math-target-select');

  if (opSelect) {
    opSelect.value = gameState.operation;
    opSelect.addEventListener('change', (e) => {
      gameState.operation = e.target.value;
      startGame();
    });
  }

  if (diffSelect) {
    diffSelect.value = gameState.difficulty;
    diffSelect.addEventListener('change', (e) => {
      gameState.difficulty = e.target.value;
      startGame();
    });
  }

  if (targetSelect) {
    targetSelect.value = String(gameState.targetScore);
    targetSelect.addEventListener('change', (e) => {
      gameState.targetScore = parseInt(e.target.value, 10);
      startGame();
    });
  }

  const pauseBtn = document.getElementById('btn-math-pause');
  const pauseOverlay = document.getElementById('math-pause-overlay');
  const resumeBtn = document.getElementById('btn-math-resume');

  if (pauseBtn && pauseOverlay) {
    pauseBtn.addEventListener('click', () => {
      gameState.isPaused = true;
      pauseOverlay.classList.remove('hidden');
      sfx.playClick();
    });
  }

  if (resumeBtn && pauseOverlay) {
    resumeBtn.addEventListener('click', () => {
      gameState.isPaused = false;
      pauseOverlay.classList.add('hidden');
      sfx.playClick();
    });
  }

  startGame();
}
