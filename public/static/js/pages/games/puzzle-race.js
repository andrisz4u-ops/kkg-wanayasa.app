/**
 * puzzle-race.js — Game 4: Peta Buta & Puzzle Anatomi Raksasa (Split Screen Race)
 * Mode balapan Tim Kiri vs Tim Kanan menyusun pulau & organ tubuh dengan siluet visual geografis & anatomi realistis.
 */

import { sfx, launchConfetti } from './audio.js';

const PUZZLE_SETS = {
  peta: {
    title: 'Peta Kepulauan Indonesia',
    icon: '🗺️',
    slots: [
      { id: 'sumatera', name: 'Sumatera', targetClue: 'Pulau Barat Laut', icon: '🏝️', x: 14, y: 38, w: 90, h: 42, color: '#10b981' },
      { id: 'jawa', name: 'Jawa', targetClue: 'Pulau Selatan', icon: '🏛️', x: 30, y: 74, w: 85, h: 36, color: '#f59e0b' },
      { id: 'kalimantan', name: 'Kalimantan', targetClue: 'Pulau Tengah (Borneo)', icon: '🌳', x: 40, y: 34, w: 95, h: 46, color: '#06b6d4' },
      { id: 'sulawesi', name: 'Sulawesi', targetClue: 'Bentuk Huruf K', icon: '🐬', x: 60, y: 42, w: 80, h: 44, color: '#8b5cf6' },
      { id: 'nusatenggara', name: 'Bali & Nusra', targetClue: 'Kepulauan Tenggara', icon: '🏖️', x: 50, y: 78, w: 90, h: 36, color: '#ec4899' },
      { id: 'maluku', name: 'Kep. Maluku', targetClue: 'Kepulauan Rempah', icon: '⛵', x: 74, y: 38, w: 80, h: 38, color: '#14b8a6' },
      { id: 'papua', name: 'Papua', targetClue: 'Ujung Timur Nusantara', icon: '🦅', x: 88, y: 48, w: 90, h: 48, color: '#f43f5e' }
    ]
  },
  anatomi: {
    title: 'Anatomi Organ Tubuh Manusia',
    icon: '🫀',
    slots: [
      { id: 'otak', name: 'Otak (Berpikir)', targetClue: 'Rongga Kepala', icon: '🧠', x: 50, y: 15, w: 90, h: 38, color: '#ec4899' },
      { id: 'paruparu', name: 'Paru-paru (Napas)', targetClue: 'Rongga Dada', icon: '🫁', x: 50, y: 35, w: 95, h: 38, color: '#06b6d4' },
      { id: 'jantung', name: 'Jantung (Darah)', targetClue: 'Dada Sebelah Kiri', icon: '❤️', x: 44, y: 44, w: 85, h: 38, color: '#f43f5e' },
      { id: 'hati', name: 'Hati (Racun)', targetClue: 'Kanan Atas Perut', icon: '🟤', x: 58, y: 54, w: 85, h: 38, color: '#8b5cf6' },
      { id: 'lambung', name: 'Lambung (Cerna)', targetClue: 'Kiri Rongga Perut', icon: '🥣', x: 42, y: 58, w: 85, h: 38, color: '#f59e0b' },
      { id: 'usus', name: 'Usus (Nutrisi)', targetClue: 'Bawah Rongga Perut', icon: '🌀', x: 50, y: 76, w: 95, h: 40, color: '#10b981' }
    ]
  },
  tatasurya: {
    title: 'Tata Surya & Urutan Planet',
    icon: '🪐',
    slots: [
      { id: 'matahari', name: 'Matahari', targetClue: 'Pusat Tata Surya', icon: '☀️', x: 12, y: 50, w: 90, h: 40, color: '#f59e0b' },
      { id: 'merkurius', name: 'Merkurius', targetClue: 'Orbit 1 (Terdekat)', icon: '🪨', x: 26, y: 50, w: 85, h: 36, color: '#94a3b8' },
      { id: 'venus', name: 'Venus', targetClue: 'Orbit 2 (Bintang Fajar)', icon: '🟡', x: 38, y: 50, w: 85, h: 36, color: '#fbbf24' },
      { id: 'bumi', name: 'Bumi', targetClue: 'Orbit 3 (Planet Hidup)', icon: '🌍', x: 50, y: 50, w: 85, h: 36, color: '#06b6d4' },
      { id: 'mars', name: 'Mars', targetClue: 'Orbit 4 (Planet Merah)', icon: '🔴', x: 62, y: 50, w: 85, h: 36, color: '#ef4444' },
      { id: 'jupiter', name: 'Jupiter', targetClue: 'Orbit 5 (Planet Terbesar)', icon: '🪐', x: 74, y: 50, w: 90, h: 42, color: '#d97706' },
      { id: 'saturnus', name: 'Saturnus', targetClue: 'Orbit 6 (Cincin Indah)', icon: '💫', x: 88, y: 50, w: 90, h: 42, color: '#a855f7' }
    ]
  },
  pancasila: {
    title: 'Simbol 5 Sila Pancasila',
    icon: '🦅',
    slots: [
      { id: 'bintang', name: 'Sila 1: Bintang', targetClue: 'Perisai Tengah (Sila 1)', icon: '⭐', x: 50, y: 20, w: 95, h: 40, color: '#f59e0b' },
      { id: 'rantai', name: 'Sila 2: Rantai', targetClue: 'Kanan Bawah (Sila 2)', icon: '⛓️', x: 75, y: 48, w: 95, h: 40, color: '#eab308' },
      { id: 'beringin', name: 'Sila 3: Beringin', targetClue: 'Kiri Atas (Sila 3)', icon: '🌳', x: 25, y: 48, w: 95, h: 40, color: '#10b981' },
      { id: 'banteng', name: 'Sila 4: Banteng', targetClue: 'Kiri Bawah (Sila 4)', icon: '🐂', x: 25, y: 76, w: 95, h: 40, color: '#ef4444' },
      { id: 'padikapas', name: 'Sila 5: Padi Kapas', targetClue: 'Kanan Bawah (Sila 5)', icon: '🌾', x: 75, y: 76, w: 95, h: 40, color: '#06b6d4' }
    ]
  },
  daurair: {
    title: 'Daur Air & Siklus Hujan',
    icon: '🌧️',
    slots: [
      { id: 'matahari', name: '1. Matahari', targetClue: 'Tahap 1: Energi Panas', icon: '☀️', x: 18, y: 24, w: 90, h: 40, color: '#f59e0b' },
      { id: 'evaporasi', name: '2. Evaporasi', targetClue: 'Tahap 2: Penguapan Air', icon: '♨️', x: 34, y: 68, w: 90, h: 40, color: '#06b6d4' },
      { id: 'kondensasi', name: '3. Kondensasi', targetClue: 'Tahap 3: Pembentukan Awan', icon: '☁️', x: 50, y: 24, w: 90, h: 40, color: '#94a3b8' },
      { id: 'presipitasi', name: '4. Presipitasi', targetClue: 'Tahap 4: Hujan Turun', icon: '🌧️', x: 72, y: 42, w: 90, h: 40, color: '#3b82f6' },
      { id: 'infiltrasi', name: '5. Infiltrasi', targetClue: 'Tahap 5: Penyerapan Tanah', icon: '💧', x: 86, y: 75, w: 90, h: 40, color: '#10b981' }
    ]
  }
};

let currentTheme = 'peta';
let isPaused = false;

let teamState = {
  red: { placed: new Set(), selectedPiece: null },
  blue: { placed: new Set(), selectedPiece: null }
};

export function renderPuzzleRace() {
  return `
    <div class="flex flex-col w-full h-full bg-slate-950 text-white select-none overflow-hidden relative">
      
      <!-- TOP CONTROLS -->
      <div class="bg-slate-900/90 backdrop-blur-md px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-20">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            🧩 Balap Susun Bentuk
          </span>
          <select id="puzzle-theme-select" class="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 font-semibold cursor-pointer">
            <option value="peta" selected>🗺️ Peta Buta Kepulauan Indonesia</option>
            <option value="anatomi">🫀 Anatomi Organ Tubuh Manusia</option>
            <option value="tatasurya">🪐 Tata Surya & Urutan Planet</option>
            <option value="pancasila">🦅 Simbol 5 Sila Pancasila</option>
            <option value="daurair">🌧️ Daur Air & Siklus Hujan</option>
          </select>
        </div>

        <div class="flex items-center gap-5">
          <div class="text-xs font-bold text-rose-400">
            🔴 Merah: <span id="puzzle-red-count">0</span> / <span class="puzzle-total-count">7</span>
          </div>
          <div class="text-xs font-bold text-blue-400">
            🔵 Biru: <span id="puzzle-blue-count">0</span> / <span class="puzzle-total-count">7</span>
          </div>
          <button id="btn-puzzle-pause" class="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer">
            <i class="fas fa-pause mr-1"></i> Jeda Guru
          </button>
          <button id="btn-puzzle-reset" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer">
            <i class="fas fa-rotate-right mr-1"></i> Reset
          </button>
        </div>
      </div>

      <!-- MAIN SPLIT SCREEN -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 relative">
        
        <!-- TIM MERAH (KIRI) -->
        <div class="bg-rose-950/20 flex flex-col p-4 relative" id="puzzle-red-side">
          <div class="flex items-center justify-between mb-2">
            <span class="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/30">
              🔴 Tim Merah
            </span>
            <span class="text-[11px] text-rose-300/70 font-medium">Sentuh potongan di bawah, lalu sentuh targetnya</span>
          </div>
          
          <!-- Board Target Canvas (dengan kontur outline) -->
          <div class="flex-1 relative bg-slate-900/80 rounded-2xl border-2 border-rose-500/30 overflow-hidden mb-3 min-h-[320px]" id="puzzle-canvas-red">
            <!-- Target slots dynamically rendered -->
          </div>

          <!-- Tray Potongan Puzzle (Ergonomis: di zona bawah layar terjangkau siswa) -->
          <div class="bg-slate-900/95 rounded-2xl p-2.5 border border-rose-500/20 flex flex-wrap gap-2 justify-center min-h-[75px]" id="puzzle-tray-red">
            <!-- Piece buttons -->
          </div>
        </div>

        <!-- TIM BIRU (KANAN) -->
        <div class="bg-blue-950/20 flex flex-col p-4 relative" id="puzzle-blue-side">
          <div class="flex items-center justify-between mb-2">
            <span class="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-500/30">
              🔵 Tim Biru
            </span>
            <span class="text-[11px] text-blue-300/70 font-medium">Sentuh potongan di bawah, lalu sentuh targetnya</span>
          </div>

          <!-- Board Target Canvas -->
          <div class="flex-1 relative bg-slate-900/80 rounded-2xl border-2 border-blue-500/30 overflow-hidden mb-3 min-h-[320px]" id="puzzle-canvas-blue">
            <!-- Target slots dynamically rendered -->
          </div>

          <!-- Tray Potongan Puzzle -->
          <div class="bg-slate-900/95 rounded-2xl p-2.5 border border-blue-500/20 flex flex-wrap gap-2 justify-center min-h-[75px]" id="puzzle-tray-blue">
            <!-- Piece buttons -->
          </div>
        </div>

      </div>

      <!-- TEACHER PAUSE OVERLAY -->
      <div id="puzzle-pause-overlay" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center hidden animate-fade-in">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mb-4">
          ⏸️
        </div>
        <h3 class="text-2xl font-black font-display text-white mb-2">Mode Diskusi Guru Aktif</h3>
        <p class="text-sm text-slate-300 max-w-md mb-6">
          Sesi susun puzzle dijeda. Guru dapat mengulas letak geografis atau fungsi organ tubuh kepada murid.
        </p>
        <button id="btn-puzzle-resume" class="btn btn-primary px-6 py-3 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
          <i class="fas fa-play mr-2"></i> Lanjutkan Permainan
        </button>
      </div>

      <!-- WINNER MODAL -->
      <div id="puzzle-winner-modal" class="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden animate-fade-in">
        <div class="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div class="text-6xl" id="puzzle-winner-icon">🏆 🔴</div>
          <h3 id="puzzle-winner-title" class="text-3xl font-black font-display text-white">
            TIM MERAH MENANG!
          </h3>
          <p class="text-sm text-slate-300">
            Luar biasa! Berhasil menuntaskan susunan puzzle dengan sangat cepat dan tepat!
          </p>
          <div class="flex items-center justify-center gap-3">
            <button id="btn-puzzle-play-again" class="btn btn-primary px-5 py-2.5 rounded-2xl font-bold text-sm shadow-xl cursor-pointer">
              <i class="fas fa-rotate-right mr-2"></i> Main Lagi
            </button>
            <button id="btn-puzzle-copy-summary" class="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
              <i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

function buildPuzzleBoards() {
  const theme = PUZZLE_SETS[currentTheme];
  if (!theme) return;

  teamState.red.placed = new Set();
  teamState.red.selectedPiece = null;
  teamState.blue.placed = new Set();
  teamState.blue.selectedPiece = null;
  isPaused = false;

  document.querySelectorAll('.puzzle-total-count').forEach(el => el.textContent = theme.slots.length);
  updateScore();

  renderSide('red');
  renderSide('blue');
}

function getSilhouetteSvg(themeKey) {
  if (themeKey === 'peta') {
    return `
      <!-- Siluet Garis Khatulistiwa & Wilayah Laut Nusantara -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="50" x2="100" y2="50" stroke="#38bdf8" stroke-width="0.6" stroke-dasharray="2 2"/>
        <text x="3" y="48" fill="#38bdf8" font-size="3" font-weight="bold">Khatulistiwa 0°</text>
        <circle cx="14" cy="38" r="12" fill="#065f46" opacity="0.3"/>
        <ellipse cx="30" cy="74" rx="14" ry="5" fill="#78350f" opacity="0.3"/>
        <circle cx="40" cy="34" r="14" fill="#0c4a6e" opacity="0.3"/>
        <circle cx="60" cy="42" r="11" fill="#4c1d95" opacity="0.3"/>
        <circle cx="88" cy="48" r="13" fill="#881337" opacity="0.3"/>
      </svg>
    `;
  } else if (themeKey === 'tatasurya') {
    return `
      <!-- Siluet Tata Surya & Garis Orbit Planet -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- Pusat Surya -->
        <circle cx="12" cy="50" r="16" fill="none" stroke="#f59e0b" stroke-width="0.8" stroke-dasharray="1 1"/>
        <circle cx="12" cy="50" r="7" fill="#f59e0b" opacity="0.2"/>
        <!-- Lintasan Orbit Planet -->
        <ellipse cx="12" cy="50" rx="14" ry="24" fill="none" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="2 2"/>
        <ellipse cx="12" cy="50" rx="26" ry="32" fill="none" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="2 2"/>
        <ellipse cx="12" cy="50" rx="38" ry="40" fill="none" stroke="#38bdf8" stroke-width="0.6" stroke-dasharray="2 2"/>
        <ellipse cx="12" cy="50" rx="50" ry="46" fill="none" stroke="#f87171" stroke-width="0.5" stroke-dasharray="2 2"/>
        <ellipse cx="12" cy="50" rx="62" ry="52" fill="none" stroke="#fbbf24" stroke-width="0.5" stroke-dasharray="2 2"/>
        <ellipse cx="12" cy="50" rx="76" ry="58" fill="none" stroke="#c084fc" stroke-width="0.5" stroke-dasharray="2 2"/>
      </svg>
    `;
  } else if (themeKey === 'pancasila') {
    return `
      <!-- Siluet Perisai Garuda Pancasila 5 Ruang -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <!-- Kontur Perisai Luar -->
        <path d="M 20 15 L 80 15 Q 85 55 50 90 Q 15 55 20 15 Z" fill="none" stroke="#eab308" stroke-width="1.2"/>
        <!-- Garis Khatulistiwa Perisai (Mendatar) -->
        <line x1="20" y1="52" x2="80" y2="52" stroke="#eab308" stroke-width="1.8"/>
        <!-- Garis Pembagi Vertikal -->
        <line x1="50" y1="15" x2="50" y2="85" stroke="#eab308" stroke-width="1"/>
        <!-- Ruang Sila 1 (Bintang Tengah) -->
        <rect x="42" y="15" width="16" height="15" fill="#eab308" opacity="0.1" rx="2"/>
      </svg>
    `;
  } else if (themeKey === 'daurair') {
    return `
      <!-- Siluet Siklus Daur Air / Hidrologi -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- Permukaan Air Laut / Danau -->
        <path d="M 0 75 Q 25 70 50 75 T 100 75 L 100 100 L 0 100 Z" fill="#0284c7" opacity="0.15"/>
        <!-- Daratan Bukit / Tanah -->
        <path d="M 60 75 Q 80 50 100 65 L 100 75 Z" fill="#059669" opacity="0.2"/>
        <!-- Panah Penguapan Naik -->
        <path d="M 34 62 L 34 45 M 31 49 L 34 44 L 37 49" stroke="#38bdf8" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Panah Presipitasi Hujan Turun -->
        <path d="M 72 48 L 72 65 M 69 61 L 72 66 L 75 61" stroke="#60a5fa" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Awan Kondensasi -->
        <ellipse cx="50" cy="24" rx="14" ry="7" fill="none" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="2 1"/>
      </svg>
    `;
  } else {
    // Anatomi Organ Tubuh Manusia
    return `
      <!-- Siluet Tubuh Manusia -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <!-- Kepala -->
        <circle cx="50" cy="15" r="10" fill="none" stroke="#94a3b8" stroke-width="1.2"/>
        <!-- Tubuh & Rongga Torso -->
        <path d="M 36 28 Q 50 24 64 28 L 62 82 Q 50 86 38 82 Z" fill="none" stroke="#94a3b8" stroke-width="1.2"/>
        <!-- Garis Tulang Rusuk -->
        <line x1="42" y1="40" x2="58" y2="40" stroke="#475569" stroke-width="0.8"/>
        <line x1="40" y1="50" x2="60" y2="50" stroke="#475569" stroke-width="0.8"/>
        <line x1="42" y1="60" x2="58" y2="60" stroke="#475569" stroke-width="0.8"/>
      </svg>
    `;
  }
}

function renderSide(team) {
  const theme = PUZZLE_SETS[currentTheme];
  const canvas = document.getElementById(`puzzle-canvas-${team}`);
  const tray = document.getElementById(`puzzle-tray-${team}`);
  if (!canvas || !tray) return;

  const isRed = team === 'red';

  // SVG silhouette illustration background
  const silhouetteSvg = getSilhouetteSvg(currentTheme);

  canvas.innerHTML = `
    ${silhouetteSvg}
    ${theme.slots.map(slot => {
      const isPlaced = teamState[team].placed.has(slot.id);
      return `
        <div 
          id="slot-${team}-${slot.id}"
          data-slot="${slot.id}"
          class="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl border-2 transition-all select-none cursor-pointer flex flex-col items-center justify-center ${
            isPlaced 
              ? 'border-emerald-400 bg-emerald-950/85 text-white scale-105 shadow-xl ring-2 ring-emerald-400/50' 
              : 'border-dashed border-slate-600/80 bg-slate-800/50 text-slate-300 hover:border-slate-400 hover:bg-slate-800/80'
          }"
          style="left: ${slot.x}%; top: ${slot.y}%; min-width: ${slot.w}px; touch-action: manipulation;"
        >
          <span class="text-xl sm:text-2xl">${isPlaced ? slot.icon : '🎯'}</span>
          ${isPlaced 
            ? `<span class="text-[11px] font-black tracking-tight mt-0.5">${slot.name}</span>` 
            : `<span class="text-[10px] font-bold text-slate-300 tracking-tight mt-0.5 text-center px-1">${slot.targetClue || 'Target'}</span>`
          }
          ${isPlaced ? '<span class="text-[9px] font-bold text-emerald-300">✓ Tepat</span>' : '<span class="text-[9px] text-slate-400">Sentuh Target</span>'}
        </div>
      `;
    }).join('')}
  `;

  // Render Piece Buttons in Tray
  tray.innerHTML = theme.slots.map(slot => {
    const isPlaced = teamState[team].placed.has(slot.id);
    if (isPlaced) return '';
    const isSelected = teamState[team].selectedPiece === slot.id;

    return `
      <button 
        type="button"
        id="piece-${team}-${slot.id}"
        data-piece="${slot.id}"
        class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-90 border select-none cursor-pointer flex items-center gap-1.5 shadow-md ${
          isSelected 
            ? 'ring-2 ring-amber-400 bg-amber-500 text-slate-950 border-amber-300 font-extrabold scale-105' 
            : isRed 
              ? 'bg-rose-900/60 hover:bg-rose-800/80 border-rose-500/50 text-rose-100' 
              : 'bg-blue-900/60 hover:bg-blue-800/80 border-blue-500/50 text-blue-100'
        }"
        style="touch-action: manipulation;"
      >
        <span class="text-base">${slot.icon}</span>
        <span>${slot.name}</span>
      </button>
    `;
  }).join('');

  tray.querySelectorAll('button[data-piece]').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (isPaused) return;
      const pieceId = btn.getAttribute('data-piece');
      sfx.playClick();
      teamState[team].selectedPiece = pieceId;
      renderSide(team);
    });
  });

  canvas.querySelectorAll('div[data-slot]').forEach(slotEl => {
    slotEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (isPaused) return;
      const slotId = slotEl.getAttribute('data-slot');
      const selected = teamState[team].selectedPiece;

      if (!selected) {
        sfx.playClick();
        return;
      }

      if (selected === slotId) {
        sfx.playCorrect();
        teamState[team].placed.add(slotId);
        teamState[team].selectedPiece = null;
        updateScore();
        renderSide(team);

        if (teamState[team].placed.size === theme.slots.length) {
          endGame(team);
        }
      } else {
        sfx.playWrong();
        slotEl.classList.add('!border-rose-500', 'animate-shake');
        setTimeout(() => {
          slotEl.classList.remove('!border-rose-500', 'animate-shake');
        }, 400);
      }
    });
  });
}

function updateScore() {
  const redEl = document.getElementById('puzzle-red-count');
  const blueEl = document.getElementById('puzzle-blue-count');
  if (redEl) redEl.textContent = teamState.red.placed.size;
  if (blueEl) blueEl.textContent = teamState.blue.placed.size;
}

function endGame(winnerTeam) {
  sfx.playVictory();
  launchConfetti();

  const isRed = winnerTeam === 'red';
  const modal = document.getElementById('puzzle-winner-modal');
  const icon = document.getElementById('puzzle-winner-icon');
  const title = document.getElementById('puzzle-winner-title');

  if (icon) icon.textContent = isRed ? '🏆 🔴' : '🏆 🔵';
  if (title) {
    title.textContent = isRed ? 'TIM MERAH MENANG!' : 'TIM BIRU MENANG!';
    title.className = `text-3xl font-black font-display ${isRed ? 'text-rose-500' : 'text-blue-500'}`;
  }
  if (modal) modal.classList.remove('hidden');
}

export function initPuzzleRace() {
  const themeSelect = document.getElementById('puzzle-theme-select');
  if (themeSelect) {
    themeSelect.value = currentTheme;
    themeSelect.addEventListener('change', (e) => {
      currentTheme = e.target.value;
      buildPuzzleBoards();
    });
  }

  const pauseBtn = document.getElementById('btn-puzzle-pause');
  const pauseOverlay = document.getElementById('puzzle-pause-overlay');
  const resumeBtn = document.getElementById('btn-puzzle-resume');

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

  const resetBtn = document.getElementById('btn-puzzle-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', buildPuzzleBoards);
  }

  const againBtn = document.getElementById('btn-puzzle-play-again');
  if (againBtn) {
    againBtn.addEventListener('click', () => {
      const modal = document.getElementById('puzzle-winner-modal');
      if (modal) modal.classList.add('hidden');
      buildPuzzleBoards();
    });
  }

  const copyBtn = document.getElementById('btn-puzzle-copy-summary');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const winner = teamState.red.placed.size >= teamState.blue.placed.size ? 'Tim Merah' : 'Tim Biru';
      const text = `🏆 Rekap Balap Puzzle & Peta (KKG Wanayasa)\nJuara: ${winner}\nTema: ${PUZZLE_SETS[currentTheme].title}\nJumlah Bagian: ${PUZZLE_SETS[currentTheme].slots.length}`;
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '<i class="fas fa-check text-emerald-400 mr-1.5"></i> Tersalin!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-clipboard-check mr-1.5"></i> Salin Rekap';
      }, 2000);
    });
  }

  buildPuzzleBoards();
}
