/**
 * snake-ladder.js — Game 3: Ular Tangga Kelas (Smart Board Edition - Opsi A: Papan Bersama)
 * Papan bersama 100 kotak dengan Jalur Visual SVG Ular & Tangga, Bank Soal Berjenjang Fase A/B/C, dan Dadu Raksasa.
 */

import { sfx, launchConfetti } from './audio.js';
import { getQuestionsByFilter } from './questions-bank.js';

// Konfigurasi Tangga & Ular
export const LADDERS = {
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  51: 67,
  72: 91,
  80: 99
};

export const SNAKES = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 36,
  93: 73,
  98: 79
};

// Kotak Soal Tantangan (16 Kotak Ideal Tersebar Merata & Tidak Berjejer)
export const CHALLENGE_TILES = [6, 12, 18, 25, 30, 38, 44, 49, 55, 58, 65, 68, 75, 82, 85, 95];

let selectedFase = 'fase-b'; // 'fase-a' | 'fase-b' | 'fase-c'
let selectedTingkat = 'sedang'; // 'mudah' | 'sedang' | 'hebat'
let selectedPaket = 'all'; // 'all' | '1' | '2' | '3' | '4' | '5'

let gameState = {
  teamCount: 2,
  teams: [
    { id: 'red', name: 'Tim Merah', color: '#ef4444', icon: '🔴', pos: 1 },
    { id: 'blue', name: 'Tim Biru', color: '#3b82f6', icon: '🔵', pos: 1 },
    { id: 'green', name: 'Tim Hijau', color: '#10b981', icon: '🟢', pos: 1 },
    { id: 'yellow', name: 'Tim Kuning', color: '#f59e0b', icon: '🟡', pos: 1 }
  ],
  currentTurn: 0,
  isRolling: false,
  isMoving: false,
  diceValue: 1,
  gameWon: false,
  isPaused: false,
  hasExtraRoll: false,
  bonusReason: ''
};

export function renderSnakeLadder() {
  return `
    <div class="flex flex-col lg:flex-row w-full h-full bg-slate-950 text-white select-none overflow-hidden">
      
      <!-- LEFT: PAPAN ULAR TANGGA 100 KOTAK DENGAN SVG OVERLAY (Mengisi Tinggi Layar Penuh) -->
      <div class="flex-1 flex flex-col p-2 sm:p-4 overflow-hidden items-center justify-center bg-slate-900/50 relative">
        <div class="h-full max-h-[calc(100vh-76px)] aspect-square bg-slate-900 border-2 border-teal-500/40 rounded-3xl p-2 relative shadow-2xl overflow-hidden" id="snake-board-wrapper">
          
          <!-- GRID KOTAK 1-100 -->
          <div class="w-full h-full grid grid-cols-10 grid-rows-10 gap-1 sm:gap-1.5" id="snake-board-grid">
            <!-- Kotak digenerate dinamis -->
          </div>

          <!-- SVG VISUAL CONNECTOR (LINTASAN TANGGA & TUBUH ULAR) -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" id="snake-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradLadder" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#34d399" stop-opacity="0.95" />
              </linearGradient>
              <linearGradient id="gradSnake" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#fb7185" stop-opacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <!-- Jalur SVG digambar oleh drawSvgConnectors() -->
          </svg>

        </div>
      </div>

      <!-- RIGHT: PANEL KONTROL KELAS, DADU & STATUS TIM -->
      <div class="w-full lg:w-[380px] xl:w-[440px] 2xl:w-[500px] bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-6 flex flex-col justify-between z-20 shrink-0 h-full overflow-y-auto">
        
        <!-- Header Info & Filter Jenjang Kelas -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              🎲 Ular Tangga Edukasi
            </span>
            <div class="flex items-center gap-1">
              <label class="text-[11px] text-slate-400 font-bold">Tim:</label>
              <select id="snake-team-count-select" class="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-700 cursor-pointer">
                <option value="2" selected>2 Tim</option>
                <option value="3">3 Tim</option>
                <option value="4">4 Tim</option>
              </select>
            </div>
          </div>

          <!-- Selector Jenjang, Tingkat & Paket Soal -->
          <div class="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 mb-3 space-y-2">
            <div>
              <label class="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                Jenjang Kelas:
              </label>
              <select id="snake-fase-select" class="w-full bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
                <option value="fase-a">Fase A (Kelas 1–2 SD)</option>
                <option value="fase-b" selected>Fase B (Kelas 3–4 SD)</option>
                <option value="fase-c">Fase C (Kelas 5–6 SD)</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tingkat:
                </label>
                <select id="snake-tingkat-select" class="w-full bg-slate-900 text-slate-200 text-xs px-2 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
                  <option value="mudah">🟢 Mudah</option>
                  <option value="sedang" selected>🟡 Sedang</option>
                  <option value="hebat">🔴 Hebat</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Paket Soal:
                </label>
                <select id="snake-paket-select" class="w-full bg-slate-900 text-slate-200 text-xs px-2 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
                  <option value="all" selected>🎲 Acak Semua</option>
                  <option value="1">Paket 1</option>
                  <option value="2">Paket 2</option>
                  <option value="3">Paket 3</option>
                  <option value="4">Paket 4</option>
                  <option value="5">Paket 5</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Indikator Giliran -->
          <div class="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 mb-3 text-center">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giliran Melempar:</div>
            <div id="snake-current-turn-label" class="text-xl sm:text-2xl font-black font-display text-rose-400">
              🔴 Tim Merah
            </div>
          </div>

          <!-- Posisi Pion Tim -->
          <div class="space-y-1.5 mb-3">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Posisi Kotak Saat Ini:</div>
            <div id="snake-team-positions-list" class="space-y-1">
              <!-- Render posisi tim -->
            </div>
          </div>
        </div>

        <!-- DADU RAKSASA DIGITAL INTERAKTIF (ZONA JANGKAUAN SISWA) -->
        <div class="flex flex-col items-center justify-center my-auto py-2">
          <button 
            id="btn-snake-roll-dice"
            type="button"
            class="group w-32 h-32 sm:w-40 sm:h-40 xl:w-48 xl:h-48 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-90 border-4 border-amber-200/80 shadow-2xl flex flex-col items-center justify-center text-slate-900 transition-all cursor-pointer select-none"
            style="touch-action: manipulation;"
          >
            <div id="snake-dice-face" class="text-6xl sm:text-7xl xl:text-8xl font-black font-display tracking-tight drop-shadow">
              1
            </div>
            <span class="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-900/90 mt-1 group-hover:underline">
              Kocok Dadu!
            </span>
          </button>
          <p class="text-[11px] sm:text-xs text-slate-400 mt-2.5 text-center font-medium">
            Sentuh dadu untuk menjalankan pion
          </p>
        </div>

        <!-- Footer Control: Jeda & Reset -->
        <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button id="btn-snake-pause" class="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer">
            <i class="fas fa-pause mr-1"></i> Jeda Guru
          </button>
          <button id="btn-snake-reset" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer">
            <i class="fas fa-rotate-right mr-1"></i> Reset
          </button>
        </div>

      </div>

      <!-- KARTU TANTANGAN SOAL MODAL -->
      <div id="snake-challenge-modal" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4 hidden animate-fade-in">
        <div class="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 max-w-lg w-full text-center shadow-2xl space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-2xl mx-auto">
            ⭐
          </div>
          <div>
            <div class="flex items-center justify-center gap-2">
              <span id="snake-challenge-mapel-badge" class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                IPAS
              </span>
              <span class="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Tantangan Kotak Cerdas!
              </span>
            </div>
            <h3 id="snake-challenge-question" class="text-lg sm:text-xl font-bold text-white mt-2 leading-snug">
              Pertanyaan akan muncul di sini...
            </h3>
          </div>
          <div id="snake-challenge-options" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <!-- Pilihan jawaban -->
          </div>
          <p id="snake-challenge-feedback" class="text-xs font-bold hidden"></p>
        </div>
      </div>

      <!-- TEACHER PAUSE OVERLAY -->
      <div id="snake-pause-overlay" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center hidden animate-fade-in">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mb-4">
          ⏸️
        </div>
        <h3 class="text-2xl font-black font-display text-white mb-2">Mode Diskusi Guru Aktif</h3>
        <p class="text-sm text-slate-300 max-w-md mb-6">
          Permainan dijeda sementara untuk sesi tanya jawab atau penjelasan materi oleh guru.
        </p>
        <button id="btn-snake-resume" class="btn btn-primary px-6 py-3 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
          <i class="fas fa-play mr-2"></i> Lanjutkan Permainan
        </button>
      </div>

      <!-- WINNER MODAL -->
      <div id="snake-winner-modal" class="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden animate-fade-in">
        <div class="bg-slate-900 border-2 border-teal-500/80 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div class="text-6xl">🏆 🎉</div>
          <h3 id="snake-winner-title" class="text-3xl font-black font-display text-white">
            TIM MERAH JUARA!
          </h3>
          <p class="text-sm text-slate-300">
            Selamat! Berhasil mendarat di Kotak 100 dan menuntaskan petualangan Ular Tangga Edukasi!
          </p>
          <div class="flex items-center justify-center gap-3">
            <button id="btn-snake-play-again" class="btn btn-primary px-5 py-2.5 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
              <i class="fas fa-rotate-right mr-2"></i> Main Lagi
            </button>
            <button id="btn-snake-copy-summary" class="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
              <i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

function getTileCenterPercent(tileNumber) {
  // Tile 1 to 100 in zigzag
  const rowFromBottom = Math.floor((tileNumber - 1) / 10); // 0 to 9
  let colFromLeft;
  if (rowFromBottom % 2 === 0) {
    // Left to right
    colFromLeft = (tileNumber - 1) % 10;
  } else {
    // Right to left
    colFromLeft = 9 - ((tileNumber - 1) % 10);
  }

  const x = (colFromLeft + 0.5) * 10;
  const y = (9 - rowFromBottom + 0.5) * 10;
  return { x, y };
}

function drawSvgConnectors() {
  const svg = document.getElementById('snake-svg-overlay');
  if (!svg) return;

  // Clear existing lines except defs
  const defs = svg.querySelector('defs');
  svg.innerHTML = '';
  if (defs) svg.appendChild(defs);

  // 1. Draw Ladders (Tangga Hijau dengan anak tangga visual)
  Object.entries(LADDERS).forEach(([fromStr, toStr]) => {
    const from = parseInt(fromStr, 10);
    const to = parseInt(toStr, 10);
    const p1 = getTileCenterPercent(from);
    const p2 = getTileCenterPercent(to);

    // Garis utama tangga
    const ladderLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ladderLine.setAttribute('x1', p1.x);
    ladderLine.setAttribute('y1', p1.y);
    ladderLine.setAttribute('x2', p2.x);
    ladderLine.setAttribute('y2', p2.y);
    ladderLine.setAttribute('stroke', 'url(#gradLadder)');
    ladderLine.setAttribute('stroke-width', '1.8');
    ladderLine.setAttribute('stroke-linecap', 'round');
    ladderLine.setAttribute('stroke-dasharray', '2.5 1.5');
    ladderLine.setAttribute('filter', 'url(#glow)');
    ladderLine.setAttribute('opacity', '0.9');
    svg.appendChild(ladderLine);
  });

  // 2. Draw Snakes (Ular Merah/Oranye Melengkung)
  Object.entries(SNAKES).forEach(([fromStr, toStr]) => {
    const from = parseInt(fromStr, 10);
    const to = parseInt(toStr, 10);
    const pHead = getTileCenterPercent(from);
    const pTail = getTileCenterPercent(to);

    // Calculate curve control point
    const midX = (pHead.x + pTail.x) / 2 + (pHead.x > pTail.x ? 8 : -8);
    const midY = (pHead.y + pTail.y) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${pHead.x} ${pHead.y} Q ${midX} ${midY} ${pTail.x} ${pTail.y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'url(#gradSnake)');
    path.setAttribute('stroke-width', '2.2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.9');
    svg.appendChild(path);

    // Snake head marker
    const headCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    headCircle.setAttribute('cx', pHead.x);
    headCircle.setAttribute('cy', pHead.y);
    headCircle.setAttribute('r', '1.6');
    headCircle.setAttribute('fill', '#f43f5e');
    headCircle.setAttribute('stroke', '#ffffff');
    headCircle.setAttribute('stroke-width', '0.5');
    svg.appendChild(headCircle);
  });
}

function buildBoardGrid() {
  const grid = document.getElementById('snake-board-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const rows = [];
  for (let r = 10; r >= 1; r--) {
    const rowNumbers = [];
    for (let c = 1; c <= 10; c++) {
      if (r % 2 === 0) {
        rowNumbers.push(r * 10 - c + 1);
      } else {
        rowNumbers.push((r - 1) * 10 + c);
      }
    }
    rows.push(rowNumbers);
  }

  rows.forEach((row) => {
    row.forEach((num) => {
      const isLadderStart = LADDERS[num];
      const isSnakeStart = SNAKES[num];
      const isChallenge = CHALLENGE_TILES.includes(num);

      let specialBadge = '';
      let cellBg = 'bg-slate-800/80 border-slate-700/60';

      if (num === 100) {
        cellBg = 'bg-amber-500/30 border-amber-400';
        specialBadge = '<span class="text-xs font-bold text-amber-300">🏆</span>';
      } else if (isLadderStart) {
        cellBg = 'bg-emerald-950/60 border-emerald-500/50';
        specialBadge = `<span class="text-[9px] font-black text-emerald-300">▲${isLadderStart}</span>`;
      } else if (isSnakeStart) {
        cellBg = 'bg-rose-950/60 border-rose-500/50';
        specialBadge = `<span class="text-[9px] font-black text-rose-300">▼${isSnakeStart}</span>`;
      } else if (isChallenge) {
        cellBg = 'bg-cyan-950/60 border-cyan-500/50';
        specialBadge = '<span class="text-[9px] font-bold text-cyan-300">⭐</span>';
      }

      const cell = document.createElement('div');
      cell.id = `snake-tile-${num}`;
      cell.className = `rounded-xl border ${cellBg} flex flex-col justify-between p-1 relative transition-all duration-200 select-none`;
      cell.innerHTML = `
        <div class="flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>${num}</span>
          ${specialBadge}
        </div>
        <div id="snake-pawns-container-${num}" class="flex flex-wrap items-center justify-center gap-0.5 min-h-[16px] z-20">
        </div>
      `;
      grid.appendChild(cell);
    });
  });

  drawSvgConnectors();
  renderPawns();
}

function renderPawns() {
  for (let i = 1; i <= 100; i++) {
    const container = document.getElementById(`snake-pawns-container-${i}`);
    if (container) container.innerHTML = '';
  }

  const activeTeams = gameState.teams.slice(0, gameState.teamCount);
  activeTeams.forEach((t) => {
    const container = document.getElementById(`snake-pawns-container-${t.pos}`);
    if (container) {
      const p = document.createElement('div');
      p.className = 'w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black animate-bounce';
      p.style.backgroundColor = t.color;
      p.textContent = t.name.split(' ')[1]?.[0] || '●';
      container.appendChild(p);
    }
  });

  updateControlPanel();
}

function updateControlPanel() {
  const currentTeam = gameState.teams[gameState.currentTurn];
  const turnLabel = document.getElementById('snake-current-turn-label');
  const diceBtn = document.getElementById('btn-snake-roll-dice');
  const diceSubLabel = diceBtn ? diceBtn.querySelector('span') : null;

  if (turnLabel && currentTeam) {
    if (gameState.hasExtraRoll) {
      turnLabel.innerHTML = `
        <div class="flex items-center justify-center gap-1.5">
          <span>${currentTeam.icon}</span>
          <span>${currentTeam.name}</span>
        </div>
        <div class="mt-1.5 text-[11px] sm:text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40 inline-block shadow-sm animate-pulse">
          ⭐ ${gameState.bonusReason || 'Bonus Lempar Dadu Lagi!'}
        </div>
      `;
    } else {
      turnLabel.textContent = `${currentTeam.icon} ${currentTeam.name}`;
    }
    turnLabel.style.color = currentTeam.color;
  }

  if (diceSubLabel) {
    if (gameState.hasExtraRoll) {
      diceSubLabel.textContent = 'Kocok Lagi! (Bonus)';
      diceSubLabel.className = 'text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-950 bg-amber-300 px-2 py-0.5 rounded-md mt-1 animate-bounce';
    } else {
      diceSubLabel.textContent = 'Kocok Dadu!';
      diceSubLabel.className = 'text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-900/90 mt-1 group-hover:underline';
    }
  }

  const list = document.getElementById('snake-team-positions-list');
  if (list) {
    const activeTeams = gameState.teams.slice(0, gameState.teamCount);
    list.innerHTML = activeTeams.map((t, idx) => `
      <div class="flex items-center justify-between p-2 rounded-xl ${idx === gameState.currentTurn ? 'bg-slate-800 border border-slate-600' : 'bg-slate-800/40'}">
        <div class="flex items-center gap-2">
          <span>${t.icon}</span>
          <span class="text-xs font-bold text-slate-200">${t.name}</span>
        </div>
        <span class="text-xs font-black font-display px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700" style="color:${t.color};">
          Kotak ${t.pos}
        </span>
      </div>
    `).join('');
  }
}

async function rollDice() {
  if (gameState.isRolling || gameState.isMoving || gameState.gameWon || gameState.isPaused) return;
  gameState.isRolling = true;
  gameState.hasExtraRoll = false;
  gameState.bonusReason = '';
  sfx.playDice();

  const diceEl = document.getElementById('snake-dice-face');
  const btn = document.getElementById('btn-snake-roll-dice');

  if (btn) btn.classList.add('animate-spin');

  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 60));
    const randomVal = Math.floor(Math.random() * 6) + 1;
    if (diceEl) diceEl.textContent = randomVal;
  }

  if (btn) btn.classList.remove('animate-spin');

  const finalRoll = Math.floor(Math.random() * 6) + 1;
  gameState.diceValue = finalRoll;
  if (diceEl) diceEl.textContent = finalRoll;

  gameState.isRolling = false;
  await movePawn(finalRoll);
}

function handleGameWon(team) {
  gameState.gameWon = true;
  gameState.isMoving = false;
  gameState.hasExtraRoll = false;
  gameState.bonusReason = '';
  sfx.playVictory();
  launchConfetti();
  const modal = document.getElementById('snake-winner-modal');
  const title = document.getElementById('snake-winner-title');
  if (title) {
    title.textContent = `${team.name.toUpperCase()} JUARA!`;
    title.style.color = team.color;
  }
  if (modal) modal.classList.remove('hidden');
}

async function movePawn(steps) {
  gameState.isMoving = true;
  const team = gameState.teams[gameState.currentTurn];

  let targetPos = team.pos + steps;
  if (targetPos > 100) {
    targetPos = 100 - (targetPos - 100);
  }

  const stepDirection = targetPos >= team.pos ? 1 : -1;
  while (team.pos !== targetPos) {
    if (gameState.isPaused) {
      await new Promise(r => setTimeout(r, 500));
      continue;
    }
    team.pos += stepDirection;
    sfx.playClick();
    renderPawns();
    await new Promise(r => setTimeout(r, 200));
  }

  // Win Condition
  if (team.pos === 100) {
    handleGameWon(team);
    return;
  }

  let getsExtraRoll = false;

  // Check Ladder
  if (LADDERS[team.pos]) {
    sfx.playCorrect();
    await new Promise(r => setTimeout(r, 300));
    team.pos = LADDERS[team.pos];
    renderPawns();
    if (team.pos === 100) {
      handleGameWon(team);
      return;
    }
    getsExtraRoll = (gameState.diceValue === 6);
    if (getsExtraRoll) {
      gameState.hasExtraRoll = true;
      gameState.bonusReason = 'Dapat Angka 6! Bonus Kocok Lagi 🎲';
    }
  } 
  // Check Snake
  else if (SNAKES[team.pos]) {
    sfx.playWrong();
    await new Promise(r => setTimeout(r, 300));
    team.pos = SNAKES[team.pos];
    renderPawns();
    getsExtraRoll = (gameState.diceValue === 6);
    if (getsExtraRoll) {
      gameState.hasExtraRoll = true;
      gameState.bonusReason = 'Dapat Angka 6! Bonus Kocok Lagi 🎲';
    }
  }
  // Check Challenge Tile
  else if (CHALLENGE_TILES.includes(team.pos)) {
    const isCorrect = await showChallengeModal(team);
    if (isCorrect) {
      // 1 Langkah Gratis (Animasi visual pion melangkah maju 1 kotak)
      await new Promise(r => setTimeout(r, 200));
      team.pos = Math.min(100, team.pos + 1);
      sfx.playClick();
      renderPawns();
      await new Promise(r => setTimeout(r, 350));

      // Cek apakah langkah gratis mencapai garis finish (100)
      if (team.pos === 100) {
        handleGameWon(team);
        return;
      }

      // Cek apakah langkah bonus mendarat di kaki tangga
      if (LADDERS[team.pos]) {
        sfx.playCorrect();
        await new Promise(r => setTimeout(r, 300));
        team.pos = LADDERS[team.pos];
        renderPawns();
        await new Promise(r => setTimeout(r, 300));
        if (team.pos === 100) {
          handleGameWon(team);
          return;
        }
      }

      // Hak bonus lempar dadu lagi karena berhasil menjawab dengan benar
      getsExtraRoll = true;
      gameState.hasExtraRoll = true;
      gameState.bonusReason = 'Jawaban Benar! Bonus Lempar Lagi 🎲';
    } else {
      // Jawaban salah: tidak dapat langkah gratis, dan giliran beralih ke tim lawan
      getsExtraRoll = false;
      gameState.hasExtraRoll = false;
      gameState.bonusReason = '';
    }
  } else {
    // Kotak biasa: Lempar lagi jika dadu bernilai 6
    getsExtraRoll = (gameState.diceValue === 6);
    if (getsExtraRoll) {
      gameState.hasExtraRoll = true;
      gameState.bonusReason = 'Dapat Angka 6! Bonus Kocok Lagi 🎲';
    }
  }

  gameState.isMoving = false;

  // Ganti giliran jika tidak mendapat giliran ekstra
  if (!getsExtraRoll) {
    gameState.hasExtraRoll = false;
    gameState.bonusReason = '';
    gameState.currentTurn = (gameState.currentTurn + 1) % gameState.teamCount;
  }
  updateControlPanel();
}

function showChallengeModal(team) {
  return new Promise((resolve) => {
    const modal = document.getElementById('snake-challenge-modal');
    const qEl = document.getElementById('snake-challenge-question');
    const optsEl = document.getElementById('snake-challenge-options');
    const feedEl = document.getElementById('snake-challenge-feedback');
    const mapelBadge = document.getElementById('snake-challenge-mapel-badge');

    if (!modal || !qEl || !optsEl) {
      resolve(false);
      return;
    }

    const questions = getQuestionsByFilter(selectedFase, selectedTingkat, selectedPaket, 1);
    const item = questions[0] || { q: "7 + 8 = ...", a: "15", opts: ["14", "15", "16", "17"], mapel: "Matematika" };

    qEl.textContent = item.q;
    if (mapelBadge) mapelBadge.textContent = `${item.mapel || 'IPAS'} • ${selectedTingkat.toUpperCase()}`;
    if (feedEl) {
      feedEl.classList.add('hidden');
      feedEl.innerHTML = '';
    }

    optsEl.innerHTML = item.opts.map((opt) => `
      <button 
        type="button" 
        data-ans="${opt}"
        class="snake-opt-btn p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold text-slate-100 transition-all active:scale-95 cursor-pointer text-left"
        style="touch-action: manipulation;"
      >
        ${opt}
      </button>
    `).join('');

    modal.classList.remove('hidden');

    let hasAnswered = false;

    const handleAnswer = (btn) => {
      if (hasAnswered) return;
      hasAnswered = true;

      // Kunci semua tombol agar tidak terjadi klik ganda
      optsEl.querySelectorAll('.snake-opt-btn').forEach(b => {
        b.disabled = true;
        b.classList.add('cursor-not-allowed', 'opacity-85');
      });

      const selected = btn.getAttribute('data-ans');
      const isCorrect = selected === item.a;

      if (isCorrect) {
        sfx.playCorrect();
        btn.classList.remove('bg-slate-800', 'hover:bg-slate-700', 'border-slate-700');
        btn.classList.add('!bg-emerald-600', '!text-white', '!border-emerald-400', 'scale-[1.02]', 'shadow-lg');
        if (feedEl) {
          feedEl.innerHTML = '🎉 <span class="font-extrabold">Hebat, Jawaban Benar!</span><br><span class="text-xs font-medium text-emerald-200">Maju 1 langkah gratis & dapat giliran lempar dadu lagi!</span>';
          feedEl.className = 'text-xs sm:text-sm font-bold text-emerald-300 mt-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 block';
        }
        setTimeout(() => {
          modal.classList.add('hidden');
          resolve(true);
        }, 1200);
      } else {
        sfx.playWrong();
        btn.classList.remove('bg-slate-800', 'hover:bg-slate-700', 'border-slate-700');
        btn.classList.add('!bg-rose-600', '!text-white', '!border-rose-400', 'scale-[1.02]', 'shadow-lg');

        // Tampilkan kunci jawaban yang benar kepada siswa
        optsEl.querySelectorAll('.snake-opt-btn').forEach(b => {
          if (b.getAttribute('data-ans') === item.a) {
            b.classList.remove('bg-slate-800', 'border-slate-700');
            b.classList.add('!bg-emerald-700/80', '!text-white', '!border-emerald-400');
          }
        });

        if (feedEl) {
          feedEl.innerHTML = `❌ <span class="font-extrabold">Jawaban Belum Tepat!</span><br><span class="text-xs font-medium text-rose-200">Jawaban tepat: <b>${item.a}</b>. Giliran melempar dadu beralih ke lawan.</span>`;
          feedEl.className = 'text-xs sm:text-sm font-bold text-rose-300 mt-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 block';
        }
        setTimeout(() => {
          modal.classList.add('hidden');
          resolve(false);
        }, 1800);
      }
    };

    optsEl.querySelectorAll('.snake-opt-btn').forEach(btn => {
      const onSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAnswer(btn);
      };
      btn.addEventListener('pointerdown', onSelect);
      btn.addEventListener('click', onSelect);
    });
  });
}

export function initSnakeLadder() {
  buildBoardGrid();

  const rollBtn = document.getElementById('btn-snake-roll-dice');
  if (rollBtn) {
    let lastRollTime = 0;
    const handleRoll = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastRollTime < 400) return;
      lastRollTime = now;
      rollDice();
    };
    rollBtn.addEventListener('pointerdown', handleRoll);
    rollBtn.addEventListener('click', handleRoll);
  }

  const teamSelect = document.getElementById('snake-team-count-select');
  if (teamSelect) {
    teamSelect.addEventListener('change', (e) => {
      gameState.teamCount = parseInt(e.target.value, 10);
      resetGame();
    });
  }

  const faseSelect = document.getElementById('snake-fase-select');
  if (faseSelect) {
    faseSelect.value = selectedFase;
    faseSelect.addEventListener('change', (e) => {
      selectedFase = e.target.value;
      sfx.playClick();
    });
  }

  const tingkatSelect = document.getElementById('snake-tingkat-select');
  if (tingkatSelect) {
    tingkatSelect.value = selectedTingkat;
    tingkatSelect.addEventListener('change', (e) => {
      selectedTingkat = e.target.value;
      sfx.playClick();
    });
  }

  const paketSelect = document.getElementById('snake-paket-select');
  if (paketSelect) {
    paketSelect.value = selectedPaket;
    paketSelect.addEventListener('change', (e) => {
      selectedPaket = e.target.value;
      sfx.playClick();
    });
  }

  // Teacher Pause Toggle
  const pauseBtn = document.getElementById('btn-snake-pause');
  const pauseOverlay = document.getElementById('snake-pause-overlay');
  const resumeBtn = document.getElementById('btn-snake-resume');

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

  const resetBtn = document.getElementById('btn-snake-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetGame);
  }

  const againBtn = document.getElementById('btn-snake-play-again');
  if (againBtn) {
    againBtn.addEventListener('click', () => {
      const modal = document.getElementById('snake-winner-modal');
      if (modal) modal.classList.add('hidden');
      resetGame();
    });
  }

  const copyBtn = document.getElementById('btn-snake-copy-summary');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = `🏆 Rekap Ular Tangga Kelas (KKG Wanayasa)\nJuara: ${gameState.teams[gameState.currentTurn].name}\nJenjang: ${selectedFase.toUpperCase()}\nJumlah Tim: ${gameState.teamCount}`;
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '<i class="fas fa-check text-emerald-400 mr-1.5"></i> Tersalin!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap';
      }, 2000);
    });
  }
}

function resetGame() {
  gameState.teams.forEach(t => t.pos = 1);
  gameState.currentTurn = 0;
  gameState.gameWon = false;
  gameState.isMoving = false;
  gameState.isRolling = false;
  gameState.isPaused = false;
  gameState.hasExtraRoll = false;
  gameState.bonusReason = '';
  buildBoardGrid();
}
