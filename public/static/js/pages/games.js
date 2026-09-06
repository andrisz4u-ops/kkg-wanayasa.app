/**
 * games.js — Pusat Game Edukasi Interaktif (Game Hub)
 * Mengakomodasi 6 permainan edukatif ramah sentuhan besar IFP / Smart Board.
 */

import { sfx } from './games/audio.js';
import { renderTts, initTts } from './tts.js';
import { renderMathDuel, initMathDuel } from './games/math-duel.js';
import { renderSnakeLadder, initSnakeLadder } from './games/snake-ladder.js';
import { renderPuzzleRace, initPuzzleRace } from './games/puzzle-race.js';
import { renderTugOfWar, initTugOfWar } from './games/tug-of-war.js';
import { renderWordSearch, initWordSearch } from './games/word-search.js';
import { renderPinisiDuel, initPinisiDuel } from './games/pinisi-duel.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';

let activeGameId = 'hub'; // 'hub' | 'tts' | 'math' | 'snake' | 'puzzle' | 'tug' | 'word' | 'pinisi'
let activeCatalogFilter = 'all'; // 'all' | 'fase-a' | 'fase-b' | 'fase-c'

const GAME_CATALOG = [
  {
    id: 'tts',
    title: 'Teka-Teki Silang (TTS)',
    subtitle: 'LKPD Cetak & Mode Interaktif Kelas',
    desc: 'Generator otomatis teka-teki silang berbasis kurikulum dengan bantuan AI atau kata kustom untuk pengayaan materi ajar.',
    icon: 'fa-puzzle-piece',
    color: 'purple',
    gradient: 'from-purple-600 to-indigo-700',
    border: 'border-purple-500/30',
    badges: ['AI Generator', 'Cetak LKPD', 'Layar Sentuh'],
    fases: ['fase-a', 'fase-b', 'fase-c'],
    faseLabel: 'Fase A, B, C',
    mode: 'Papan Bersama'
  },
  {
    id: 'math',
    title: 'Si Jago Berhitung',
    subtitle: 'Duel Hitung Cepat (+, −, ×, ÷)',
    desc: 'Adu cepat berhitung untuk kelas rendah hingga atas. Pilihan operasi Penjumlahan, Pengurangan, Perkalian, dan Campuran dengan balapan mobil real-time.',
    icon: 'fa-calculator',
    color: 'rose',
    gradient: 'from-rose-600 to-red-700',
    border: 'border-rose-500/30',
    badges: ['Split Screen', '+ − × ÷', 'Multi-Touch'],
    fases: ['fase-a', 'fase-b', 'fase-c'],
    faseLabel: 'Fase A, B, C',
    mode: 'Duel Tim (Kiri vs Kanan)'
  },
  {
    id: 'snake',
    title: 'Ular Tangga Kelas',
    subtitle: 'Smart Board Edition (Papan Bersama 1-100)',
    desc: 'Papan ular tangga 100 kotak dengan dadu digital raksasa, visual rel tangga & tubuh ular, serta kartu soal tantangan saat mendarat.',
    icon: 'fa-dice',
    color: 'emerald',
    gradient: 'from-teal-600 to-emerald-700',
    border: 'border-teal-500/30',
    badges: ['Papan Bersama', 'Dadu Raksasa', 'Kartu Soal'],
    fases: ['fase-a', 'fase-b', 'fase-c'],
    faseLabel: 'Fase A, B, C',
    mode: 'Papan Bersama (2-4 Tim)'
  },
  {
    id: 'puzzle',
    title: 'Peta Buta & Puzzle Anatomi',
    subtitle: 'Split-Screen Balap Susun Bentuk',
    desc: 'Balapan menyusun potongan pulau Indonesia atau organ vital tubuh manusia ke siluet yang tepat dengan sistem snap-in interaktif.',
    icon: 'fa-shapes',
    color: 'cyan',
    gradient: 'from-cyan-600 to-blue-700',
    border: 'border-cyan-500/30',
    badges: ['Split Screen', 'Geografi & IPAS', 'Multi-Touch'],
    fases: ['fase-a', 'fase-b', 'fase-c'],
    faseLabel: 'Fase A, B, C',
    mode: 'Balapan (Kiri vs Kanan)'
  },
  {
    id: 'tug',
    title: 'Tarik Tambang Cerdas Cermat',
    subtitle: 'Split-Screen Duel Tarik Tali',
    desc: 'Kubu Merah dan Kubu Biru bersaing menjawab pertanyaan cerdas cermat. Jawaban benar menarik tali tambang melintasi garis batas lawan.',
    icon: 'fa-people-pulling',
    color: 'amber',
    gradient: 'from-amber-600 to-orange-700',
    border: 'border-amber-500/30',
    badges: ['Split Screen', 'Animasi Tali Fisik', 'Multi-Mapel'],
    fases: ['fase-a', 'fase-b', 'fase-c'],
    faseLabel: 'Fase A, B, C',
    mode: 'Duel Tim (Kiri vs Kanan)'
  },
  {
    id: 'word',
    title: 'Cari Kata Raksasa',
    subtitle: 'Word Search Duel di Layar Lebar',
    desc: 'Dua kotak grid huruf besar di kiri dan kanan. Murid balapan menyentuh huruf awal dan akhir untuk menemukan kata sains & kurikulum.',
    icon: 'fa-magnifying-glass',
    color: 'violet',
    gradient: 'from-violet-600 to-fuchsia-700',
    border: 'border-violet-500/30',
    badges: ['Split Screen', 'Kosakata Tematik', 'Grid 7x7/8x8'],
    fases: ['fase-a', 'fase-b', 'fase-c'],
    faseLabel: 'Fase A, B, C',
    mode: 'Balapan (Kiri vs Kanan)'
  },
  {
    id: 'pinisi',
    title: 'Duel Pinisi Kata',
    subtitle: 'Balap Literasi Kalimat Rumpang',
    desc: 'Lomba membaca dan melengkapi kalimat rumpang Bahasa Indonesia di layar sentuh IFP. Balapan kapal pinisi Nusantara dengan 45 paket soal berjenjang.',
    icon: 'fa-ship',
    color: 'sky',
    gradient: 'from-sky-600 to-blue-700',
    border: 'border-sky-500/30',
    badges: ['Split Screen', 'Literasi Rumpang', '45 Paket Soal'],
    fases: ['fase-a', 'fase-b', 'fase-c'],
    faseLabel: 'Fase A, B, C',
    mode: 'Duel Tim (Kiri vs Kanan)'
  }
];

export function isIfpFullscreen() {
  return document.body.classList.contains('is-ifp-fullscreen') || !!document.fullscreenElement;
}

export function toggleIfpFullscreen() {
  sfx.playClick();
  if (!isIfpFullscreen()) {
    enterIfpFullscreen();
  } else {
    exitIfpFullscreen();
  }
}

export function enterIfpFullscreen() {
  document.body.classList.add('is-ifp-fullscreen');
  const stage = document.getElementById('ifp-game-stage') || document.documentElement;
  if (!document.fullscreenElement) {
    if (stage.requestFullscreen) {
      stage.requestFullscreen().catch(() => {});
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }
  updateFsButtons(true);
}

export function exitIfpFullscreen() {
  document.body.classList.remove('is-ifp-fullscreen');
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  updateFsButtons(false);
}

function updateFsButtons(isFs) {
  document.querySelectorAll('.fs-btn-label').forEach(el => {
    el.textContent = isFs ? 'Keluar Fullscreen' : 'Layar Penuh IFP';
  });
  document.querySelectorAll('.fs-btn-icon').forEach(el => {
    el.className = `fas ${isFs ? 'fa-compress' : 'fa-expand'} fs-btn-icon`;
  });
  const badge = document.getElementById('ifp-mode-badge');
  if (badge) {
    badge.textContent = isFs ? 'Mode Layar Penuh IFP' : 'Mode Tersemat';
  }
}

// Global listener for Esc key or native fullscreen exit
if (!window.__ifpFsListenerAttached) {
  window.__ifpFsListenerAttached = true;
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    if (!isFs) {
      document.body.classList.remove('is-ifp-fullscreen');
    } else {
      document.body.classList.add('is-ifp-fullscreen');
    }
    updateFsButtons(isFs || document.body.classList.contains('is-ifp-fullscreen'));
  });
}

export function renderGames(opts = {}) {
  if (!state.user) {
    return renderLockedFeature(
      'Pusat Game Edukasi Interaktif IFP',
      'Maaf, fitur Game Edukasi khusus untuk anggota guru terdaftar Gugus 3 Wanayasa. Silakan masuk / login akun pendidik Anda terlebih dahulu untuk mengakses katalog dan memainkan seluruh 7 game edukatif kelas.',
      [
        '7 Permainan Edukasi Kurikulum Merdeka (TTS, Berhitung, Ular Tangga, Pinisi, dll)',
        'Mode Layar Sentuh Besar IFP & Smart Board Interaktif Kelas',
        'Bank Soal Otomatis Sesuai Fase Belajar (Fase A, Fase B, Fase C)',
        'Pertandingan Duel Tim Seru Lengkap dengan Audio SFX & Animasi'
      ]
    );
  }

  if (opts && opts.tab) {
    activeGameId = opts.tab;
  }

  const isFs = isIfpFullscreen();

  // 1. HUB VIEW (Katalog Game Edukasi)
  if (activeGameId === 'hub') {
    return `
      <div class="w-full max-w-[1700px] mx-auto animate-fade-in select-none">
        
        <!-- TOP CATALOG TOOLBAR -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-lg shadow-md">
              <i class="fas fa-gamepad"></i>
            </div>
            <div>
              <h1 class="text-base sm:text-lg font-black font-display tracking-tight text-white flex items-center gap-2">
                Pusat Game Edukasi Interaktif
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-widest hidden sm:inline-block">
                  IFP Edition
                </span>
              </h1>
              <p class="text-[11px] text-slate-400">
                Koleksi permainan edukatif kelas untuk Layar Sentuh Besar & Smart Board (Multi-Touch 40pt)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Volume Control -->
            <button 
              id="btn-game-toggle-sfx" 
              class="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Atur Volume Suara Permainan"
            >
              <i class="fas ${sfx.getVolumeInfo().icon}"></i>
              <span class="hidden sm:inline">${sfx.getVolumeInfo().label}</span>
            </button>

            <!-- Fullscreen IFP Toggle Button -->
            <button 
              id="btn-game-toggle-fullscreen" 
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
              title="Aktifkan Layar Penuh untuk IFP / Smart Board"
            >
              <i class="fas ${isFs ? 'fa-compress' : 'fa-expand'} fs-btn-icon"></i>
              <span class="fs-btn-label">${isFs ? 'Keluar Fullscreen' : 'Layar Penuh IFP'}</span>
            </button>
          </div>
        </div>

        <!-- 6 Game Cards Grid -->
        ${renderCatalogHub()}

      </div>
    `;
  }

  // 2. ACTIVE GAME VIEW (Normal embedded view with IFP Fullscreen capability)
  const isTts = activeGameId === 'tts';

  return `
    <div id="ifp-game-stage" class="w-full ${isTts ? 'min-h-[700px] flex flex-col bg-slate-950 text-white rounded-3xl overflow-y-auto' : 'h-[calc(100vh-150px)] min-h-[640px] flex flex-col bg-slate-950 text-white rounded-3xl overflow-hidden'} border border-slate-800 shadow-2xl select-none relative transition-all duration-200">
      
      <!-- TOP SLIM IFP HEADER BAR (Compact 52px, 100% width) -->
      <header id="ifp-game-header" class="h-13 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        
        <div class="flex items-center gap-3">
          <button 
            id="btn-game-back-to-hub" 
            class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <i class="fas fa-arrow-left text-amber-400"></i> <span>Katalog Game</span>
          </button>
          
          <div class="flex items-center gap-2">
            <h2 class="text-sm sm:text-base font-black font-display text-white tracking-tight">
              ${getActiveGameTitle()}
            </h2>
            <span id="ifp-mode-badge" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-widest hidden md:inline-block">
              ${isFs ? 'Mode Layar Penuh IFP' : 'Mode Tersemat'}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Volume Control -->
          <button 
            id="btn-game-toggle-sfx" 
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Atur Volume Suara"
          >
            <i class="fas ${sfx.getVolumeInfo().icon}"></i>
            <span class="hidden sm:inline">${sfx.getVolumeInfo().label}</span>
          </button>

          <!-- Fullscreen Kiosk Mode Toggle -->
          <button 
            id="btn-game-toggle-fullscreen" 
            class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
            title="Mode Kiosk Layar Penuh"
          >
            <i class="fas ${isFs ? 'fa-compress' : 'fa-expand'} fs-btn-icon"></i>
            <span class="fs-btn-label">${isFs ? 'Keluar Fullscreen' : 'Layar Penuh IFP'}</span>
          </button>
        </div>

      </header>

      <!-- ACTIVE GAME BODY (Fills remaining height) -->
      <div class="flex-1 w-full ${isTts ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'} relative" id="game-active-container">
        ${renderActiveGameContent()}
      </div>

    </div>
  `;
}

function getActiveGameTitle() {
  const item = GAME_CATALOG.find(g => g.id === activeGameId);
  return item ? item.title : 'Game Edukasi';
}

function renderActiveGameContent() {
  if (activeGameId === 'hub') {
    return renderCatalogHub();
  } else if (activeGameId === 'tts') {
    return renderTts();
  } else if (activeGameId === 'math') {
    return renderMathDuel();
  } else if (activeGameId === 'snake') {
    return renderSnakeLadder();
  } else if (activeGameId === 'puzzle') {
    return renderPuzzleRace();
  } else if (activeGameId === 'tug') {
    return renderTugOfWar();
  } else if (activeGameId === 'word') {
    return renderWordSearch();
  } else if (activeGameId === 'pinisi') {
    return renderPinisiDuel();
  }
  return renderCatalogHub();
}

function renderCatalogHub() {
  const visibleGames = activeCatalogFilter === 'all'
    ? GAME_CATALOG
    : GAME_CATALOG.filter(g => (g.fases || []).includes(activeCatalogFilter));

  return `
    <div class="space-y-6 animate-fade-in">
      
      <!-- HERO BANNER -->
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 p-6 sm:p-10 shadow-2xl">
        <div class="relative z-10 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3 border border-teal-500/30">
            <i class="fas fa-chalkboard-user"></i> Pembelajaran Aktif & Interaktif
          </div>
          <h2 class="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
            Game Edukasi Layar Sentuh IFP / Smart Board
          </h2>
          <p class="text-sm sm:text-base text-teal-100/80 mt-2.5 leading-relaxed">
            Dirancang khusus untuk multi-touch simultan dan format split-screen duel antar kelompok di kelas. Ciptakan suasana belajar yang aktif, seru, dan kompetitif!
          </p>
        </div>

        <!-- Floating Abstract Background -->
        <div class="absolute -right-10 -bottom-10 opacity-20 text-[180px] pointer-events-none select-none">
          🎮
        </div>
      </div>

      <!-- FILTER BAR & KURIKULUM MERDEKA BADGE -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 rounded-2xl p-3 sm:p-4 border border-slate-800">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Jenjang:</span>
          <div class="flex items-center gap-1.5 flex-wrap" id="game-catalog-filter-chips">
            <button type="button" data-filter="all" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCatalogFilter === 'all' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
              Semua (${GAME_CATALOG.length})
            </button>
            <button type="button" data-filter="fase-a" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCatalogFilter === 'fase-a' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
              Fase A (Kls 1–2)
            </button>
            <button type="button" data-filter="fase-b" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCatalogFilter === 'fase-b' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
              Fase B (Kls 3–4)
            </button>
            <button type="button" data-filter="fase-c" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCatalogFilter === 'fase-c' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
              Fase C (Kls 5–6)
            </button>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20 shrink-0">
          <i class="fas fa-certificate text-teal-300"></i>
          <span>Standar BSKAP Kurikulum Merdeka 2025</span>
        </div>
      </div>

      <!-- 7 GAME CARDS GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${visibleGames.map((g) => `
          <div 
            class="group relative bg-[var(--color-bg-elevated)] rounded-3xl p-6 border ${g.border} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 overflow-hidden"
          >
            <!-- Background Glow on Hover -->
            <div class="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${g.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-25 transition-opacity"></div>

            <div>
              <!-- Top Badges & Mode -->
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-${g.color}-500/15 text-${g.color}-600 dark:text-${g.color}-400 border border-${g.color}-500/30">
                  <i class="fas ${g.icon}"></i> ${g.mode}
                </span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30">
                  ${g.faseLabel || 'Fase A, B, C'}
                </span>
              </div>

              <!-- Title & Subtitle -->
              <h3 class="text-xl font-extrabold text-[var(--color-text-primary)] font-display tracking-tight group-hover:text-${g.color}-500 transition-colors">
                ${g.title}
              </h3>
              <p class="text-xs font-semibold text-[var(--color-text-secondary)] mt-0.5 mb-3">
                ${g.subtitle}
              </p>

              <!-- Description -->
              <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                ${g.desc}
              </p>

              <!-- Feature Tags -->
              <div class="flex flex-wrap gap-1.5 mb-6">
                ${g.badges.map(b => `
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    ${b}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Action Button -->
            <button 
              type="button"
              data-game-id="${g.id}"
              class="btn-select-game w-full py-3 rounded-2xl bg-gradient-to-r ${g.gradient} hover:opacity-95 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <i class="fas fa-play text-xs"></i>
              <span>${g.id === 'tts' ? 'Buka Studio TTS' : 'Mulai Game di IFP'}</span>
            </button>
          </div>
        `).join('')}
      </div>

    </div>
  `;
}

export function initGames() {
  if (!state.user) return;
  setupToolbarEvents();

  if (activeGameId === 'hub') {
    setupHubEvents();
  } else if (activeGameId === 'tts') {
    initTts();
  } else if (activeGameId === 'math') {
    initMathDuel();
  } else if (activeGameId === 'snake') {
    initSnakeLadder();
  } else if (activeGameId === 'puzzle') {
    initPuzzleRace();
  } else if (activeGameId === 'tug') {
    initTugOfWar();
  } else if (activeGameId === 'word') {
    initWordSearch();
  } else if (activeGameId === 'pinisi') {
    initPinisiDuel();
  }
}

function setupToolbarEvents() {
  // Back to Portal (Home) Button
  const portalBtn = document.getElementById('btn-game-back-to-portal');
  if (portalBtn) {
    portalBtn.addEventListener('click', () => {
      sfx.playClick();
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      activeGameId = 'hub';
      if (window.navigate) {
        window.navigate('home');
      }
    });
  }

  // Back to Hub Button
  const backBtn = document.getElementById('btn-game-back-to-hub');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      sfx.playClick();
      exitIfpFullscreen();
      switchGame('hub');
    });
  }

  // SFX Multi-level Volume Cycle Button
  const sfxBtn = document.getElementById('btn-game-toggle-sfx');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      const info = sfx.cycleVolume();
      sfx.playClick();
      sfxBtn.innerHTML = `
        <i class="fas ${info.icon}"></i>
        <span class="hidden sm:inline">${info.label}</span>
      `;
    });
  }

  // Fullscreen IFP Toggle
  const fsBtn = document.getElementById('btn-game-toggle-fullscreen');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      toggleIfpFullscreen();
    });
  }
}

function setupHubEvents() {
  document.querySelectorAll('.btn-select-game').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-game-id');
      sfx.playClick();
      switchGame(id);
    });
  });

  document.querySelectorAll('#game-catalog-filter-chips button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCatalogFilter = btn.getAttribute('data-filter') || 'all';
      sfx.playClick();
      const stage = document.getElementById('page-content-wrapper') || document.getElementById('main-content');
      if (stage) {
        stage.innerHTML = renderGames();
        initGames();
      }
    });
  });
}

export function switchGame(gameId) {
  if (!state.user) {
    if (window.navigate) window.navigate('login');
    return;
  }
  activeGameId = gameId;

  if (gameId === 'hub') {
    exitIfpFullscreen();
  }

  const container = document.getElementById('page-content-wrapper') || document.getElementById('main-content');
  if (container) {
    container.innerHTML = renderGames();
    initGames();
    return;
  }

  if (window.renderApp) {
    window.renderApp();
  } else {
    window.location.reload();
  }
}
