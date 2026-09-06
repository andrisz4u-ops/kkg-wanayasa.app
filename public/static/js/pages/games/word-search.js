/**
 * word-search.js — Game 6: Cari Kata Raksasa (Word Search Duel - Split Screen)
 * Balapan mencari kata tersembunyi berjenjang (Fase A/B/C) dengan tap-start-end multi-touch dan mode jeda guru.
 */

import { sfx, launchConfetti } from './audio.js';
import { WORD_SETS_BY_FASE } from './questions-bank.js';

let selectedFase = 'fase-b';
let currentSetIdx = 0;
let isPaused = false;

let teamData = {
  red: { foundWords: new Set(), selectedStart: null },
  blue: { foundWords: new Set(), selectedStart: null }
};

function getCurrentSet() {
  const sets = WORD_SETS_BY_FASE[selectedFase] || WORD_SETS_BY_FASE['fase-b'];
  return sets[currentSetIdx % sets.length];
}

export function renderWordSearch() {
  const currentSet = getCurrentSet();

  return `
    <div class="flex flex-col w-full h-full bg-slate-950 text-white select-none overflow-hidden relative">
      
      <!-- TOP CONTROLS -->
      <div class="bg-slate-900/90 backdrop-blur-md px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-20">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            🔍 Cari Kata Raksasa
          </span>
          <select id="ws-fase-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
            <option value="fase-a">Fase A (Kelas 1–2 SD)</option>
            <option value="fase-b" selected>Fase B (Kelas 3–4 SD)</option>
            <option value="fase-c">Fase C (Kelas 5–6 SD)</option>
          </select>
          <select id="ws-paket-select" class="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700 font-semibold cursor-pointer">
            <option value="0" selected>Paket 1</option>
            <option value="1">Paket 2</option>
            <option value="2">Paket 3</option>
            <option value="3">Paket 4</option>
            <option value="4">Paket 5</option>
          </select>
          <span id="ws-topic-title" class="text-xs font-extrabold text-amber-300">
            ${currentSet.topic}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-xs font-bold text-rose-400">
            🔴 Merah: <span id="ws-red-count">0</span> / <span class="ws-total-words">${currentSet.words.length}</span>
          </div>
          <div class="text-xs font-bold text-blue-400">
            🔵 Biru: <span id="ws-blue-count">0</span> / <span class="ws-total-words">${currentSet.words.length}</span>
          </div>
          <button id="btn-ws-pause" class="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer">
            <i class="fas fa-pause mr-1"></i> Jeda
          </button>
          <button id="btn-ws-reset" class="px-3 py-1 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer">
            <i class="fas fa-rotate-right mr-1"></i> Reset
          </button>
        </div>
      </div>

      <!-- MAIN SPLIT SCREEN: TWO WORD SEARCH GRIDS -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 relative">
        
        <!-- TIM MERAH (KIRI) -->
        <div class="bg-rose-950/20 flex flex-col p-4 relative" id="ws-red-zone">
          <!-- Render grid and word list -->
        </div>

        <!-- TIM BIRU (KANAN) -->
        <div class="bg-blue-950/20 flex flex-col p-4 relative" id="ws-blue-zone">
          <!-- Render grid and word list -->
        </div>

      </div>

      <!-- TEACHER PAUSE OVERLAY -->
      <div id="ws-pause-overlay" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center hidden animate-fade-in">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mb-4">
          ⏸️
        </div>
        <h3 class="text-2xl font-black font-display text-white mb-2">Mode Diskusi Guru Aktif</h3>
        <p class="text-sm text-slate-300 max-w-md mb-6">
          Permainan cari kata dijeda. Guru dapat memberikan petunjuk arti kosakata kepada siswa.
        </p>
        <button id="btn-ws-resume" class="btn btn-primary px-6 py-3 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
          <i class="fas fa-play mr-2"></i> Lanjutkan Permainan
        </button>
      </div>

      <!-- WINNER MODAL -->
      <div id="ws-winner-modal" class="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden animate-fade-in">
        <div class="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div class="text-6xl" id="ws-winner-icon">🏆 🔴</div>
          <h3 id="ws-winner-title" class="text-3xl font-black font-display text-white">
            TIM MERAH JUARA CARI KATA!
          </h3>
          <p class="text-sm text-slate-300">
            Hebat sekali! Berhasil menemukan seluruh kata tersembunyi lebih cepat!
          </p>
          <div class="flex items-center justify-center gap-3">
            <button id="btn-ws-play-again" class="btn btn-primary px-5 py-2.5 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
              <i class="fas fa-rotate-right mr-2"></i> Main Lagi
            </button>
            <button id="btn-ws-copy-summary" class="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
              <i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

function renderSide(team) {
  const container = document.getElementById(`ws-${team}-zone`);
  if (!container) return;

  const currentSet = getCurrentSet();
  const isRed = team === 'red';

  container.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isRed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}">
        ${isRed ? '🔴 Tim Merah' : '🔵 Tim Biru'}
      </span>
      <span class="text-[11px] text-slate-400">Sentuh huruf awal, lalu sentuh huruf akhir kata</span>
    </div>

    <!-- Word List Badges (Area Jangkauan Sentuh Aman) -->
    <div class="flex flex-wrap gap-1.5 mb-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
      ${currentSet.words.map(w => {
        const isFound = teamData[team].foundWords.has(w);
        return `
          <span class="px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all ${
            isFound 
              ? 'bg-emerald-500/30 text-emerald-300 line-through border border-emerald-500/50' 
              : isRed 
                ? 'bg-rose-900/40 text-rose-200 border border-rose-500/30' 
                : 'bg-blue-900/40 text-blue-200 border border-blue-500/30'
          }">
            ${isFound ? '✓ ' : ''}${w}
          </span>
        `;
      }).join('')}
    </div>

    <!-- 8x8 Grid -->
    <div class="flex-1 flex items-center justify-center p-1">
      <div class="grid grid-cols-8 gap-1.5 sm:gap-2 w-full max-w-[min(65vh,520px)] aspect-square bg-slate-900 p-3 rounded-3xl border-2 ${isRed ? 'border-rose-500/40' : 'border-blue-500/40'} shadow-2xl">
        ${currentSet.grid.map((row, r) => row.map((char, c) => {
          let isPartFound = false;
          currentSet.words.forEach(w => {
            if (teamData[team].foundWords.has(w)) {
              const sol = currentSet.solutions[w];
              if (sol && isInsideRange(r, c, sol.r1, sol.c1, sol.r2, sol.c2)) {
                isPartFound = true;
              }
            }
          });

          const isStartSelected = teamData[team].selectedStart && teamData[team].selectedStart.r === r && teamData[team].selectedStart.c === c;

          return `
            <button
              type="button"
              data-team="${team}"
              data-r="${r}"
              data-c="${c}"
              class="ws-cell-${team} aspect-square rounded-2xl font-black text-lg sm:text-xl xl:text-2xl flex items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${
                isPartFound 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md' 
                  : isStartSelected 
                    ? 'ring-4 ring-amber-400 bg-amber-500 text-slate-950 font-black scale-105' 
                    : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700 hover:text-white'
              }"
              style="touch-action: manipulation;"
            >
              ${char}
            </button>
          `;
        }).join('')).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll(`.ws-cell-${team}`).forEach(cellBtn => {
    cellBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (isPaused) return;
      const r = parseInt(cellBtn.getAttribute('data-r'), 10);
      const c = parseInt(cellBtn.getAttribute('data-c'), 10);
      handleCellClick(team, r, c);
    });
  });
}

function isInsideRange(r, c, r1, c1, r2, c2) {
  if (r1 === r2 && r === r1 && c >= Math.min(c1, c2) && c <= Math.max(c1, c2)) return true;
  if (c1 === c2 && c === c1 && r >= Math.min(r1, r2) && r <= Math.max(r1, r2)) return true;
  return false;
}

function handleCellClick(team, r, c) {
  const currentSet = getCurrentSet();
  const state = teamData[team];

  if (!state.selectedStart) {
    sfx.playClick();
    state.selectedStart = { r, c };
    renderSide(team);
  } else {
    const start = state.selectedStart;
    const end = { r, c };
    state.selectedStart = null;

    let matchedWord = null;

    currentSet.words.forEach(w => {
      if (!state.foundWords.has(w)) {
        const sol = currentSet.solutions[w];
        if (sol) {
          const matchForward = (sol.r1 === start.r && sol.c1 === start.c && sol.r2 === end.r && sol.c2 === end.c);
          const matchReverse = (sol.r1 === end.r && sol.c1 === end.c && sol.r2 === start.r && sol.c2 === start.c);
          if (matchForward || matchReverse) {
            matchedWord = w;
          }
        }
      }
    });

    if (matchedWord) {
      sfx.playCorrect();
      state.foundWords.add(matchedWord);
      updateScoreUI();
      renderSide(team);

      if (state.foundWords.size === currentSet.words.length) {
        endGame(team);
      }
    } else {
      sfx.playWrong();
      renderSide(team);
    }
  }
}

function updateScoreUI() {
  const redEl = document.getElementById('ws-red-count');
  const blueEl = document.getElementById('ws-blue-count');
  if (redEl) redEl.textContent = teamData.red.foundWords.size;
  if (blueEl) blueEl.textContent = teamData.blue.foundWords.size;
}

function endGame(winnerTeam) {
  sfx.playVictory();
  launchConfetti();

  const isRed = winnerTeam === 'red';
  const modal = document.getElementById('ws-winner-modal');
  const icon = document.getElementById('ws-winner-icon');
  const title = document.getElementById('ws-winner-title');

  if (icon) icon.textContent = isRed ? '🏆 🔴' : '🏆 🔵';
  if (title) {
    title.textContent = isRed ? 'TIM MERAH JUARA CARI KATA!' : 'TIM BIRU JUARA CARI KATA!';
    title.className = `text-3xl font-black font-display ${isRed ? 'text-rose-500' : 'text-blue-500'}`;
  }
  if (modal) modal.classList.remove('hidden');
}

export function initWordSearch() {
  teamData.red.foundWords = new Set();
  teamData.red.selectedStart = null;
  teamData.blue.foundWords = new Set();
  teamData.blue.selectedStart = null;
  isPaused = false;

  const currentSet = getCurrentSet();
  const topicTitle = document.getElementById('ws-topic-title');
  if (topicTitle) topicTitle.textContent = `Materi: ${currentSet.topic}`;

  document.querySelectorAll('.ws-total-words').forEach(el => el.textContent = currentSet.words.length);
  updateScoreUI();

  renderSide('red');
  renderSide('blue');

  const faseSelect = document.getElementById('ws-fase-select');
  if (faseSelect) {
    faseSelect.value = selectedFase;
    faseSelect.addEventListener('change', (e) => {
      selectedFase = e.target.value;
      currentSetIdx = 0;
      initWordSearch();
    });
  }

  const paketSelect = document.getElementById('ws-paket-select');
  if (paketSelect) {
    paketSelect.value = String(currentSetIdx);
    paketSelect.addEventListener('change', (e) => {
      currentSetIdx = parseInt(e.target.value, 10);
      initWordSearch();
    });
  }

  const resetBtn = document.getElementById('btn-ws-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', initWordSearch);
  }

  const pauseBtn = document.getElementById('btn-ws-pause');
  const pauseOverlay = document.getElementById('ws-pause-overlay');
  const resumeBtn = document.getElementById('btn-ws-resume');

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

  const againBtn = document.getElementById('btn-ws-play-again');
  if (againBtn) {
    againBtn.addEventListener('click', () => {
      const modal = document.getElementById('ws-winner-modal');
      if (modal) modal.classList.add('hidden');
      initWordSearch();
    });
  }

  const copyBtn = document.getElementById('btn-ws-copy-summary');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const winner = teamData.red.foundWords.size >= teamData.blue.foundWords.size ? 'Tim Merah' : 'Tim Biru';
      const text = `🏆 Rekap Cari Kata Raksasa (KKG Wanayasa)\nJuara: ${winner}\nJenjang: ${selectedFase.toUpperCase()}\nMateri: ${currentSet.topic}`;
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '<i class="fas fa-check text-emerald-400 mr-1.5"></i> Tersalin!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap';
      }, 2000);
    });
  }
}
