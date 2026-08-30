import { api } from '../api.js';
import { showToast, showLoading, hideLoading, escapeHtml, populateAiModelSelect } from '../utils.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';
import { saveDocArchive, openArchiveDrawer } from '../storage-archive.js';

// Slide Templates Collection with Category Tags
export const slideTemplates = {
  'minimalist-dark': {
    name: 'Dark Elegance',
    category: 'minimalist',
    description: 'Kontras gelap berkelas dengan teks putih & aksen cyan terang',
    colorScheme: { primary: '#38bdf8', secondary: '#818cf8', accent: '#38bdf8', background: '#0f172a', cardBg: '#1e293b', text: '#f8fafc', subtext: '#94a3b8' }
  },
  'educational-blue': {
    name: 'Modern Flow',
    category: 'corporate',
    description: 'Aksen biru cerah & bersih untuk materi sains dan umum',
    colorScheme: { primary: '#1d4ed8', secondary: '#2563eb', accent: '#3b82f6', background: '#f8fafc', cardBg: '#ffffff', text: '#0f172a', subtext: '#475569' }
  },
  'minimalist-light': {
    name: 'Neo Clean',
    category: 'minimalist',
    description: 'Desain sangat bersih dengan fokus maksimal pada kejelasan teks',
    colorScheme: { primary: '#0f172a', secondary: '#334155', accent: '#269494', background: '#ffffff', cardBg: '#f8fafc', text: '#0f172a', subtext: '#475569' }
  },
  'colorful-rainbow': {
    name: 'Vibrant Creative',
    category: 'bold',
    description: 'Warna-warni ceria & dinamis untuk siswa SD & SMP',
    colorScheme: { primary: '#e11d48', secondary: '#ea580c', accent: '#0284c7', background: '#fffbf5', cardBg: '#ffffff', text: '#1e293b', subtext: '#475569' }
  },
  'aurora-cosmic': {
    name: 'Aurora Borealis',
    category: 'super-premium',
    description: 'Gradien kosmik bercahaya neon mint yang memukau murid',
    colorScheme: { primary: '#00f5d4', secondary: '#38bdf8', accent: '#a78bfa', background: '#0a192f', cardBg: '#112240', text: '#f1f5f9', subtext: '#94a3b8' }
  },
  'sunset-warm': {
    name: 'Sunset Academia',
    category: 'super-premium',
    description: 'Gradien hangat senja yang nyaman, artistik, dan ramah mata',
    colorScheme: { primary: '#9f1239', secondary: '#c2410c', accent: '#f97316', background: '#fff8f0', cardBg: '#ffffff', text: '#27272a', subtext: '#52525b' }
  },
  'ocean-deep': {
    name: 'Ocean Deep',
    category: 'super-premium',
    description: 'Kedalaman samudra dengan nuansa biru laut yang segar',
    colorScheme: { primary: '#0369a1', secondary: '#0284c7', accent: '#0ea5e9', background: '#f0f9ff', cardBg: '#ffffff', text: '#0c4a6e', subtext: '#334155' }
  },
  'sakura-bloom': {
    name: 'Neon Sakura',
    category: 'super-premium',
    description: 'Sentuhan nuansa merah muda dan ungu modern yang estetik',
    colorScheme: { primary: '#86198f', secondary: '#a21caf', accent: '#db2777', background: '#fdf2f8', cardBg: '#ffffff', text: '#3b0764', subtext: '#701a75' }
  },
  'golden-luxury': {
    name: 'Golden Hour',
    category: 'super-premium',
    description: 'Nuansa emas bercahaya di atas kanvas gelap yang megah',
    colorScheme: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fde047', background: '#0f172a', cardBg: '#1e293b', text: '#fef3c7', subtext: '#cbd5e1' }
  }
};

// Slide Layout Types (13+ Modular Layouts incl. FlipCard from html-slides)
export const slideLayouts = [
  { id: 'title', name: 'Judul Cover', icon: 'fa-heading', description: 'Slide pembuka dengan judul besar dan pemantik' },
  { id: 'content', name: 'Materi Poin', icon: 'fa-list-ol', description: 'Daftar materi terstruktur dengan nomor' },
  { id: 'twoColumn', name: 'Dua Kolom', icon: 'fa-columns', description: 'Pembagian dua materi berdampingan' },
  { id: 'imageText', name: 'Gambar + Teks', icon: 'fa-image', description: 'Visualisasi foto edukasi dengan penjelasan' },
  { id: 'timeline', name: 'Alur / Kronologi', icon: 'fa-stream', description: 'Tahapan proses berurutan atau sejarah' },
  { id: 'stats', name: 'Fakta & Angka', icon: 'fa-chart-pie', description: 'Sorotan statistik / angka kunci' },
  { id: 'comparison', name: 'Perbandingan', icon: 'fa-balance-scale', description: 'Tabel konsep A vs konsep B' },
  { id: 'quiz', name: 'Kuis Interaktif', icon: 'fa-question-circle', description: 'Pertanyaan pilihan ganda untuk kelas' },
  { id: 'flipcard', name: 'Kartu Bolak-Balik', icon: 'fa-clone', description: 'Kartu interaktif diklik untuk balik — ideal untuk kuis & review' },
  { id: 'activity', name: 'Aktivitas Kelompok', icon: 'fa-tasks', description: 'Instruksi tugas dan kerja siswa' },
  { id: 'quote', name: 'Kutipan / Definisi', icon: 'fa-quote-left', description: 'Kutipan tokoh atau definisi kunci' },
  { id: 'summary', name: 'Rangkuman Materi', icon: 'fa-clipboard-check', description: 'Poin-poin kesimpulan akhir pelajaran' },
  { id: 'thankyou', name: 'Slide Penutup', icon: 'fa-award', description: 'Apresiasi dan salam penutup' }
];

export async function renderSlide() {
  if (!state.user) {
    return renderLockedFeature(
      'SlideGen AI Studio Profesional',
      'Buat presentasi pembelajaran premium dalam hitungan detik. Dilengkapi sistem outline terstruktur, live inline editing, presentasi layar penuh, dan ekspor PowerPoint (PPTX) resolusi tinggi.',
      [
        'Two-phase AI: Rancang Outline ➔ Generate Slide Lengkap',
        '12+ Template & Layout Edukatif Modular (Timeline, Kuis, Stats)',
        'Direct Inline Text Editing pada kanvas slide secara real-time',
        'AI Single-Slide Patching (Revisi slide tertentu tanpa reload)',
        'Mode Mengajar Fullscreen Presenter View di kelas',
        'Ekspor PowerPoint (.pptx) dengan Grid Safety Box bebas overflow'
      ]
    );
  }

  // Initialize Global View State
  window.slideGenState = {
    view: 'landing', // 'landing', 'outline', 'gallery', 'editor'
    prompt: '',
    template: 'minimalist-dark',
    outline: [],
    slides: [],
    currentIndex: 0,
    activeFilter: 'all',
    config: {
      topik: '',
      slideCount: 8,
      aiProvider: '',
      extraInstructions: ''
    }
  };

  return `
    <div id="slidegen-root" class="w-full flex flex-col font-body transition-colors duration-300 min-h-[calc(100vh-80px)] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div id="slidegen-container" class="w-full h-full flex flex-col flex-grow">
        ${renderLandingView()}
      </div>
      <!-- Modal Container -->
      <div id="sg-modal-container"></div>
      <!-- Fullscreen Presenter Container -->
      <div id="sg-fullscreen-container" class="hidden fixed inset-0 z-[9999] bg-black"></div>
    </div>
  `;
}

// ==========================================
// 1. LANDING VIEW
// ==========================================
function renderLandingView() {
  const s = window.slideGenState;
  return `
    <main class="flex-grow flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden h-full">
      <!-- Background Graphic -->
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] -z-10 pointer-events-none opacity-5 dark:opacity-10">
        <svg height="600" viewBox="0 0 200 200" width="600" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
          <path d="M40 40 L160 40 L40 160 L160 160" fill="none" stroke="currentColor" stroke-width="1.5"></path>
        </svg>
      </div>
      
      <div class="text-center mb-10 animate-fade-in-up">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-teal-200 dark:border-teal-800">
          <i class="fas fa-sparkles text-teal-600 dark:text-teal-400"></i> SlideGen Studio 2.0
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white font-display">
          Rancang Slide Pembelajaran Interaktif
        </h1>
        <p class="text-base md:text-lg text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
          Ketik topik materi secara bebas di bawah ini. AI otomatis merancang slide kelas yang memukau, visual, dan mudah dipahami murid.
        </p>
      </div>

      <!-- Main Input Bar -->
      <div class="w-full max-w-3xl mb-8 animate-slide-up" style="animation-delay: 100ms;">
        <div class="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl p-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary">
          <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
            <span class="flex items-center gap-1.5 font-medium"><i class="fas fa-magic text-teal-600 dark:text-teal-400"></i> AI Studio Presentasi</span>
            <div class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg text-xs">
              <i class="fas fa-microchip text-teal-600 dark:text-teal-400 text-[11px]"></i>
              <label for="sg-landing-model-select" class="text-[11px] text-gray-500 font-medium">Model:</label>
              <select id="sg-landing-model-select" class="text-[11px] font-bold bg-transparent border-0 py-0 pl-1 pr-6 focus:ring-0 cursor-pointer text-teal-600 dark:text-teal-400">
                <option value="">Memuat model...</option>
              </select>
            </div>
          </div>
          <div class="p-3">
            <textarea id="sg-main-prompt" class="w-full bg-transparent border-none focus:ring-0 text-base md:text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none h-24 text-gray-800 dark:text-gray-100" placeholder="Apa topik presentasi Anda? (Contoh: Sistem Tata Surya & Planet, IPAS Kelas 6 SD)"></textarea>
          </div>
          <div class="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span class="text-gray-500 font-medium flex items-center gap-1.5"><i class="fas fa-layer-group text-primary"></i> Target Jumlah Slide:</span>
            <div class="flex flex-wrap items-center gap-1.5" id="sg-landing-count-pills">
              ${[6, 8, 10, 12, 15, 20].map(cnt => `
                <button type="button" class="sg-landing-count-btn px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${(s?.config?.slideCount || 8) === cnt ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}" data-count="${cnt}">
                  ${cnt} Slide ${cnt === 15 ? '⭐' : ''}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="px-3 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-50 dark:border-gray-800/50 pt-3">
            <div class="flex items-center space-x-2">
              <button id="sg-btn-settings" class="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex items-center gap-2 cursor-pointer" title="Pengaturan AI">
                <i class="fas fa-sliders-h"></i> <span class="text-xs">Parameter AI</span>
              </button>
              <button id="sg-btn-archive" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-sm flex items-center gap-2 cursor-pointer" title="Riwayat Slide">
                <i class="fas fa-folder-open text-amber-500"></i> <span class="text-xs font-semibold">Riwayat Slide</span>
              </button>
            </div>
            <div class="flex items-center space-x-2">
              <button id="sg-btn-outline-flow" class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 font-medium text-sm transition-all flex items-center justify-center gap-2">
                <i class="fas fa-list-ul"></i> Rancang Outline Dulu
              </button>
              <button id="sg-btn-instant-flow" class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md">
                <span>Pilih Template</span> <i class="fas fa-arrow-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Topics -->
      <div class="flex flex-wrap justify-center gap-2 mb-8 max-w-4xl px-4 animate-slide-up" style="animation-delay: 200ms;">
        <span class="text-xs text-gray-400 self-center mr-2">Topik Cepat:</span>
        <button class="sg-quick-btn px-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-all font-medium">Bumi & Tata Surya (IPAS Kelas 6)</button>
        <button class="sg-quick-btn px-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-all font-medium">Pecahan & Desimal (Matematika Kelas 5)</button>
        <button class="sg-quick-btn px-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-all font-medium">Kearifan Lokal & Budaya (IPAS Kelas 4)</button>
        <button class="sg-quick-btn px-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-all font-medium">Teks Narasi & Puisi (B. Indonesia)</button>
      </div>
    </main>
  `;
}

// ==========================================
// 2. OUTLINE REVIEW VIEW (Phase 1 Stage)
// ==========================================
function renderOutlineView() {
  const s = window.slideGenState;
  const outline = s.outline || [];

  return `
    <div class="flex flex-col flex-1 h-full overflow-hidden bg-background-light dark:bg-background-dark animate-fade-in">
      <!-- Top Navigation -->
      <header class="h-16 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <button onclick="window.slidgenGoTo('landing')" class="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-gray-900 dark:text-white text-base">Proposal Outline Presentasi</h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">${outline.length} Slide</span>
            </div>
            <p class="text-xs text-gray-500">Sesuaikan judul dan alur materi sebelum AI menghasilkan slide lengkap.</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button id="sg-btn-add-outline-slide" class="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 bg-white dark:bg-gray-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
            <i class="fas fa-plus text-teal-600 dark:text-teal-400"></i> Tambah Slide
          </button>
          <button id="sg-btn-outline-to-gallery" class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
            <span>Pilih Template & Desain</span> <i class="fas fa-arrow-right text-xs"></i>
          </button>
        </div>
      </header>

      <!-- Main Outline Items List -->
      <main class="flex-1 overflow-y-auto p-6 md:p-10">
        <div class="max-w-4xl mx-auto space-y-4 pb-20">
          <div class="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
            <div class="flex items-center gap-3">
              <i class="fas fa-info-circle text-primary text-lg"></i>
              <span>Anda dapat langsung mengetik untuk mengubah judul slide atau mengganti tipe tata letak (layout) di bawah.</span>
            </div>
            <button id="sg-btn-regenerate-outline" class="text-primary font-bold hover:underline shrink-0">
              <i class="fas fa-sync-alt mr-1"></i> Buat Ulang Outline
            </button>
          </div>

          <div id="sg-outline-list" class="space-y-3">
            ${outline.map((item, idx) => `
              <div class="sg-outline-card bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-4" data-index="${idx}">
                <div class="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center shrink-0 text-sm">
                  ${idx + 1}
                </div>
                
                <div class="flex-1 w-full space-y-2">
                  <div class="flex items-center gap-2">
                    <input type="text" value="${escapeHtml(item.title || '')}" class="sg-outline-title-input w-full bg-transparent font-semibold text-gray-900 dark:text-white text-sm border-b border-transparent focus:border-primary focus:outline-none py-0.5" placeholder="Judul slide..." data-index="${idx}">
                  </div>
                  <p class="text-xs text-gray-500 line-clamp-1">${escapeHtml(item.focus || '')}</p>
                </div>

                <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                  <select class="sg-outline-layout-select text-xs bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-2.5 py-1.5 font-medium text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-primary" data-index="${idx}">
                    ${slideLayouts.map(l => `<option value="${l.id}" ${item.layout === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
                  </select>

                  <button class="sg-outline-delete-btn text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors" title="Hapus slide ini" data-index="${idx}">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </main>
    </div>
  `;
}

// ==========================================
// 3. GALLERY VIEW (Template Selection & Config)
// ==========================================
function renderGalleryView() {
  const s = window.slideGenState;
  const activeFilter = s.activeFilter || 'all';

  return `
    <div class="flex flex-1 h-full overflow-hidden animate-fade-in">
      <!-- Sidebar Filters & Config -->
      <aside class="w-72 border-r border-border-light dark:border-border-dark p-6 overflow-y-auto hidden md:block bg-surface-light dark:bg-surface-dark shrink-0">
        <div class="mb-6 flex items-center gap-3 cursor-pointer group" onclick="window.slidgenGoTo(window.slideGenState.outline.length > 0 ? 'outline' : 'landing')">
          <i class="fas fa-arrow-left text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"></i>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Kembali</span>
        </div>
        
        <!-- Style Filter -->
        <div class="mb-8">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Gaya Template</h3>
          <div class="space-y-2">
            <button class="sg-style-filter-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${activeFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-filter="all">
              <span>Semua Style</span> <i class="fas fa-th-large text-[10px]"></i>
            </button>
            <button class="sg-style-filter-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${activeFilter === 'super-premium' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-filter="super-premium">
              <span>👑 Super Premium</span> <i class="fas fa-crown text-amber-400 text-[10px]"></i>
            </button>
            <button class="sg-style-filter-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${activeFilter === 'minimalist' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-filter="minimalist">
              <span>Minimalist Clean</span> <i class="fas fa-minus text-[10px]"></i>
            </button>
            <button class="sg-style-filter-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${activeFilter === 'bold' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-filter="bold">
              <span>Ceria & Bold (SD)</span> <i class="fas fa-palette text-[10px]"></i>
            </button>
            <button class="sg-style-filter-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${activeFilter === 'corporate' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-filter="corporate">
              <span>Formal & Eksak</span> <i class="fas fa-briefcase text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- AI Settings -->
        <div class="mb-8 border-t border-gray-100 dark:border-gray-800 pt-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pengaturan Slide</h3>
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs text-gray-500 font-medium">Model / Engine AI</label>
              <select id="sg-input-engine" class="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-gray-800 dark:text-gray-200 font-medium">
                <option value="">Memuat model AI...</option>
              </select>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="block text-xs text-gray-500 font-medium">Jumlah Slide: <strong id="sg-count-val" class="text-teal-600 dark:text-teal-400 font-bold">${s.config.slideCount || 8}</strong></label>
                <span class="text-[10px] text-gray-400 font-semibold">4 - 25 Slide</span>
              </div>
              <input type="range" id="sg-input-count" min="4" max="25" value="${s.config.slideCount || 8}" class="w-full accent-primary h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer">
              <div class="grid grid-cols-6 gap-1 pt-0.5" id="sg-sidebar-count-presets">
                ${[6, 8, 10, 12, 15, 20].map(cnt => `
                  <button type="button" class="sg-sidebar-count-btn py-1 rounded-md text-[10px] font-bold text-center transition-all ${(s.config.slideCount || 8) === cnt ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}" data-count="${cnt}">
                    ${cnt}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Gallery Cards -->
      <main class="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div class="max-w-6xl mx-auto mb-8 text-center">
          <h1 class="text-3xl md:text-4xl font-display font-bold mb-2 text-gray-900 dark:text-white">Pilih Tema & Template</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Topik: <strong id="sg-display-topic" class="text-gray-800 dark:text-gray-200">${escapeHtml(s.config.topik || s.prompt || 'Materi Pembelajaran')}</strong></p>
        </div>

        <!-- Template Grid -->
        <div id="sg-template-grid" class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
          ${Object.entries(slideTemplates).map(([id, tpl]) => {
            const isSelected = s.template === id;
            return `
              <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-2xl border ${isSelected ? 'border-primary ring-4 ring-primary/20' : 'border-border-light dark:border-border-dark'} hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer" data-id="${id}" data-category="${tpl.category}">
                <div class="aspect-[16/10] relative overflow-hidden flex flex-col p-6" style="background: ${tpl.colorScheme.background}; color: ${tpl.colorScheme.text};">
                  <div class="relative z-10 flex-1 flex flex-col justify-center items-center text-center transform transition-transform duration-500 group-hover:scale-105">
                    <div class="text-[10px] opacity-70 mb-2 uppercase tracking-widest font-sans font-bold" style="color: ${tpl.colorScheme.accent};">${tpl.name}</div>
                    <div class="w-3/4 h-5 rounded-md mb-2 shadow-sm" style="background: ${tpl.colorScheme.primary}; opacity: 0.85;"></div>
                    <div class="w-1/2 h-2 rounded" style="background: ${tpl.colorScheme.secondary}; opacity: 0.6;"></div>
                  </div>
                  ${tpl.category === 'super-premium' ? '<span class="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-gray-900 shadow-md flex items-center gap-1"><i class="fas fa-crown"></i> SUPER</span>' : ''}
                </div>
                <div class="p-4 bg-surface-light dark:bg-surface-dark flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 class="font-bold text-sm text-gray-900 dark:text-white">${tpl.name}</h3>
                    <p class="text-xs text-gray-500 line-clamp-1">${tpl.description}</p>
                  </div>
                  <div class="w-5 h-5 rounded-full border-2 ${isSelected ? 'border-primary bg-primary flex items-center justify-center text-white text-[10px]' : 'border-gray-300 dark:border-gray-600'} shrink-0">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Sticky Floating Generate Bar -->
        <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 lg:ml-36 z-40 max-w-xl w-full px-4 animate-slide-up">
          <div class="bg-white/95 dark:bg-card-dark/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs text-gray-700 dark:text-gray-300 font-medium px-2">
              Template: <strong id="sg-display-template" class="text-teal-600 dark:text-teal-400 font-bold">${slideTemplates[s.template]?.name || 'Pilih Template'}</strong>
              ${s.outline.length > 0 ? `<span class="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-[10px] font-bold">${s.outline.length} Bab Outline Terpasang</span>` : ''}
            </div>
            <button id="sg-btn-generate" class="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <i class="fas fa-magic"></i> Generate AI Slide
            </button>
          </div>
        </div>
      </main>
    </div>
  `;
}

// ==========================================
// 4. STUDIO EDITOR VIEW (Canvas & Tools)
// ==========================================
function renderEditorView() {
  const s = window.slideGenState;
  const currentSlide = s.slides[s.currentIndex] || {};
  const totalSlides = s.slides.length || 0;

  return `
    <div class="flex flex-1 h-full overflow-hidden flex-col bg-gray-100 dark:bg-[#0a0a0a] animate-fade-in relative">
      
      <!-- Top Studio Toolbar -->
      <header class="h-14 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 z-20 shrink-0">
        <div class="flex items-center space-x-3">
          <button onclick="window.slidgenGoTo('landing')" class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Kembali ke Beranda">
            <i class="fas fa-home"></i>
          </button>
          <div class="h-5 w-px bg-gray-300 dark:bg-gray-700"></div>
          
          <div class="flex items-center gap-2">
            <input type="text" id="sg-editor-title" value="${escapeHtml(s.config.topik || s.prompt || 'Presentasi Pembelajaran')}" class="font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none text-sm px-1 py-0.5 max-w-[180px] md:max-w-md truncate" title="Klik untuk mengedit judul presentasi">
            <button id="sg-btn-editor-archive" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer" title="Buka Riwayat Slide">
              <i class="fas fa-folder-open text-amber-500"></i> Riwayat
            </button>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hidden sm:inline-block">
              <i class="fas fa-check-circle mr-1"></i>Tersimpan Otomatis
            </span>
          </div>
        </div>
        
        <!-- Editor Action Buttons -->
        <div class="flex items-center space-x-2">
          <!-- Change Layout Dropdown -->
          <div class="relative inline-block text-left">
            <select id="sg-change-layout-select" class="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors focus:ring-1 focus:ring-primary">
              ${slideLayouts.map(l => `<option value="${l.id}" ${currentSlide.layout === l.id ? 'selected' : ''}>Layout: ${l.name}</option>`).join('')}
            </select>
          </div>

          <!-- Single Slide AI Patch -->
          <button id="sg-btn-patch-slide" class="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all flex items-center gap-1.5" title="Revisi Slide ini menggunakan AI">
            <i class="fas fa-wand-magic-sparkles"></i> <span class="hidden sm:inline">Revisi AI</span>
          </button>

          <!-- Present Fullscreen Mode -->
          <button id="sg-btn-fullscreen" class="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-all flex items-center gap-1.5" title="Mulai Presentasi Layar Penuh">
            <i class="fas fa-play"></i> <span class="hidden sm:inline">Mulai Tayang</span>
          </button>

          <!-- Export Dropdown -->
          <div class="relative" id="sg-export-dropdown-wrap">
            <button id="sg-btn-export-toggle" class="flex items-center px-4 py-1.5 text-xs font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow hover:opacity-90 transition-opacity gap-1.5">
              <i class="fas fa-download"></i> Export
              <i class="fas fa-chevron-down text-[10px]"></i>
            </button>
            <div id="sg-export-menu" class="hidden absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
              <button id="sg-btn-export" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600"><i class="fas fa-file-powerpoint"></i></span>
                <div class="text-left">
                  <div class="text-xs font-bold">PowerPoint (.pptx)</div>
                  <div class="text-[10px] text-gray-400">Untuk presentasi di MS Office</div>
                </div>
              </button>
              <div class="h-px bg-gray-100 dark:bg-gray-800 mx-4"></div>
              <button id="sg-btn-export-html" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><i class="fas fa-globe"></i></span>
                <div class="text-left">
                  <div class="text-xs font-bold">HTML Interaktif (.html)</div>
                  <div class="text-[10px] text-gray-400">Buka di browser, bagikan ke siswa</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden relative">
        <!-- Main Canvas Area -->
        <main class="flex-1 overflow-hidden flex flex-col relative">
          <!-- Slide Preview Container -->
          <div class="flex-1 overflow-auto flex justify-center items-center p-4 md:p-8 relative" id="sg-canvas-container">
            <!-- Background Grid Pattern -->
            <div class="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10" style="background-image: radial-gradient(#6B7280 1px, transparent 1px); background-size: 24px 24px;"></div>
            
            <!-- Prev & Next Float Nav -->
            <button id="sg-prev-slide" class="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:scale-110 transition-all z-10 shrink-0">
               <i class="fas fa-chevron-left"></i>
            </button>
            <button id="sg-next-slide" class="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:scale-110 transition-all z-10 shrink-0">
               <i class="fas fa-chevron-right"></i>
            </button>

            <!-- 16:9 Aspect Ratio Canvas -->
            <div class="w-full max-w-4xl aspect-[16/9] bg-white shadow-2xl rounded-2xl relative overflow-hidden ring-1 ring-black/5 dark:ring-white/10 flex flex-col transition-all duration-300" id="sg-slide-render-area">
               <!-- Slide Content Injected Dynamically -->
            </div>
            
            <!-- Floating Navigation Bottom Indicator -->
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-3">
              <span id="sg-slide-counter">Slide ${s.currentIndex + 1} / ${totalSlides}</span>
              <div class="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
              <span id="sg-slide-layout-name" class="uppercase text-primary font-bold text-[10px]">${currentSlide.layout || 'Content'}</span>
              <div class="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
              <span class="text-gray-400 text-[10px]"><i class="fas fa-pen mr-1"></i>Klik teks untuk edit</span>
            </div>
          </div>

          <!-- Bottom Panel: Thumbnails & Notes -->
          <div class="h-44 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark flex flex-col shrink-0 relative">
            <div class="flex-1 flex w-full h-full overflow-hidden">
                <!-- Thumbnails Scroll Area -->
                <div class="flex-1 overflow-x-auto overflow-y-hidden p-3 flex gap-3 items-center no-scrollbar" id="sg-thumbnails-container">
                    <!-- Thumbnails Injected Dynamically -->
                </div>
                <!-- Speaker Notes Panel -->
                <div class="w-80 md:w-96 border-l border-border-light dark:border-border-dark p-3 flex flex-col bg-gray-50/50 dark:bg-gray-900/30">
                    <div class="flex items-center justify-between mb-1.5">
                      <h4 class="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                        <i class="fas fa-comment-dots text-primary"></i> Catatan Pembicara (Guru)
                      </h4>
                      <span class="text-[10px] text-gray-400">Editable</span>
                    </div>
                    <textarea id="sg-speaker-notes-input" class="flex-1 w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed" placeholder="Catatan panduan mengajar guru...">${escapeHtml(currentSlide.speakerNotes || '')}</textarea>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;
}

// ==========================================
// 5. HIGH-FIDELITY SLIDE HTML RENDERER (12+ Layouts with Inline Editing)
// ==========================================
function generateSlideHTML(slide, index, colorScheme) {
  const layout = slide.layout || 'content';
  const title = escapeHtml(slide.title || 'Judul Slide');
  const subtitle = escapeHtml(slide.subtitle || '');
  let content = slide.content || [];
  if (content && !Array.isArray(content)) content = [String(content)];

  let leftContent = slide.leftContent || [];
  if (leftContent && !Array.isArray(leftContent)) leftContent = [String(leftContent)];

  let rightContent = slide.rightContent || [];
  if (rightContent && !Array.isArray(rightContent)) rightContent = [String(rightContent)];

  const hasImage = Boolean(slide.image?.url);
  const imageHtml = hasImage
    ? `
      <figure class="rounded-2xl overflow-hidden border border-black/10 shadow-lg bg-black/5 flex flex-col h-full">
        <img src="${escapeHtml(slide.image.url)}" alt="${escapeHtml(slide.image.alt || title)}" class="w-full h-56 object-cover" loading="lazy" referrerpolicy="no-referrer" />
        <figcaption class="px-3 py-1.5 text-[10px] truncate opacity-70" style="color: ${colorScheme.text}; background: ${colorScheme.background};">
          Foto: <a href="${escapeHtml(slide.image.creditUrl || '#')}" target="_blank" rel="noopener noreferrer" class="underline">${escapeHtml(slide.image.creditName || 'Unsplash')}</a>
        </figcaption>
      </figure>
    `
    : '';

  // Helpers for inline editable tags
  const editTitle = `<h1 contenteditable="true" data-field="title" class="sg-editable focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1 transition-all cursor-text" style="color: ${colorScheme.primary};">${title}</h1>`;
  const editSubtitle = `<p contenteditable="true" data-field="subtitle" class="sg-editable focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1 transition-all cursor-text text-xl opacity-80" style="color: ${colorScheme.text};">${subtitle || 'Klik untuk menambahkan subjudul'}</p>`;

  switch (layout) {
    case 'title': {
      // Check if dark theme for glow blobs (html-slides style)
      const isDarkTheme = colorScheme.background && colorScheme.background.startsWith('#0');
      const glowBlobs = isDarkTheme ? `
        <div style="position:absolute;top:-80px;left:-80px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, ${colorScheme.primary}55 0%, transparent 70%);pointer-events:none;"></div>
        <div style="position:absolute;bottom:-100px;right:-60px;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle, ${colorScheme.accent}40 0%, transparent 70%);pointer-events:none;"></div>
      ` : '';
      return `
        <div class="w-full h-full flex flex-col items-center justify-center text-center p-12 relative overflow-hidden" style="background: linear-gradient(135deg, ${colorScheme.background} 0%, ${colorScheme.cardBg} 100%); color: ${colorScheme.text};">
          ${glowBlobs}
          <div class="relative z-10 flex flex-col items-center">
            <div class="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl" style="background: linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary}); color: #ffffff;">
              <i class="fas fa-graduation-cap text-3xl"></i>
            </div>
            <h1 contenteditable="true" data-field="title" class="sg-editable text-4xl md:text-5xl font-black mb-4 max-w-2xl leading-tight focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-2" style="color: ${colorScheme.primary};">${title}</h1>
            ${editSubtitle}
            <div style="height:3px;width:160px;margin-top:20px;background:linear-gradient(90deg, ${colorScheme.primary}, ${colorScheme.accent}, ${colorScheme.secondary});border-radius:9999px;"></div>
          </div>
        </div>
      `;
    }

    case 'timeline':
      const steps = slide.timeline && Array.isArray(slide.timeline) && slide.timeline.length > 0
        ? slide.timeline
        : [
            { step: '1', title: 'Tahap Pertama', desc: 'Pengenalan konsep dasar materi.' },
            { step: '2', title: 'Tahap Kedua', desc: 'Eksplorasi dan diskusi materi mendalam.' },
            { step: '3', title: 'Tahap Ketiga', desc: 'Menyimpulkan pemahaman bersama.' }
          ];
      return `
        <div class="w-full h-full p-8 md:p-10 flex flex-col" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <div class="mb-6 border-b pb-3" style="border-color: ${colorScheme.accent}40;">
            <div class="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Alur Pembelajaran</div>
            <h2 contenteditable="true" data-field="title" class="sg-editable text-3xl font-bold focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${title}</h2>
          </div>
          <div class="grid grid-cols-${Math.min(steps.length, 4)} gap-4 flex-1 items-center">
            ${steps.map((st, i) => `
              <div class="p-5 rounded-2xl shadow-sm border flex flex-col h-full justify-between" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}30;">
                <div>
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white mb-3 shadow-md" style="background: ${colorScheme.primary};">
                    ${escapeHtml(st.step || String(i + 1))}
                  </div>
                  <h3 contenteditable="true" data-timeline-field="title" data-index="${i}" class="sg-editable font-bold text-base mb-2 focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${escapeHtml(st.title || '')}</h3>
                  <p contenteditable="true" data-timeline-field="desc" data-index="${i}" class="sg-editable text-xs opacity-80 leading-relaxed focus:outline-none rounded px-1" style="color: ${colorScheme.text};">${escapeHtml(st.desc || '')}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'stats':
      const statsList = slide.stats && Array.isArray(slide.stats) && slide.stats.length > 0
        ? slide.stats
        : [
            { value: '📌', label: 'Fakta Utama', desc: 'Informasi penting yang wajib diketahui' },
            { value: '💡', label: 'Tahukah Kamu?', desc: 'Fakta menarik seputar topik ini' },
            { value: '🎯', label: 'Poin Kunci', desc: 'Hal yang wajib diingat siswa' }
          ];
      return `
        <div class="w-full h-full p-8 md:p-10 flex flex-col justify-between" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <div class="mb-4">
            <div class="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Fakta & Data Kunci</div>
            <h2 contenteditable="true" data-field="title" class="sg-editable text-3xl font-bold focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${title}</h2>
          </div>
          <div class="grid grid-cols-${Math.min(statsList.length, 3)} gap-6 my-auto">
            ${statsList.map((st, i) => `
              <div class="p-6 rounded-3xl shadow-lg border text-center flex flex-col justify-center items-center" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}30;">
                <div contenteditable="true" data-stat-field="value" data-index="${i}" class="sg-editable text-4xl md:text-5xl font-black mb-2 focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${escapeHtml(st.value || '100%')}</div>
                <div contenteditable="true" data-stat-field="label" data-index="${i}" class="sg-editable font-bold text-sm mb-1 focus:outline-none rounded px-1" style="color: ${colorScheme.secondary};">${escapeHtml(st.label || '')}</div>
                <div contenteditable="true" data-stat-field="desc" data-index="${i}" class="sg-editable text-xs opacity-70 focus:outline-none rounded px-1" style="color: ${colorScheme.text};">${escapeHtml(st.desc || '')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'flipcard': {
      // html-slides-style: interactive flip cards for concept review & quiz
      const flipItems = (slide.flipcards && Array.isArray(slide.flipcards) && slide.flipcards.length > 0)
        ? slide.flipcards
        : [
            { front: 'Konsep 1', back: 'Klik untuk menambahkan penjelasan konsep pertama.' },
            { front: 'Konsep 2', back: 'Klik untuk menambahkan penjelasan konsep kedua.' },
            { front: 'Konsep 3', back: 'Klik untuk menambahkan penjelasan konsep ketiga.' },
            { front: 'Konsep 4', back: 'Klik untuk menambahkan penjelasan konsep keempat.' },
          ];
      const cols = Math.min(flipItems.length, 4);
      return `
        <style>.sg-flip-card{perspective:1000px;cursor:pointer;user-select:none}.sg-flip-inner{position:relative;width:100%;height:100%;transition:transform .5s cubic-bezier(.4,2,.6,1);transform-style:preserve-3d}.sg-flip-card.flipped .sg-flip-inner{transform:rotateY(180deg)}.sg-flip-front,.sg-flip-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}.sg-flip-back{transform:rotateY(180deg)}.sg-flip-hint{font-size:9px;opacity:.4;margin-top:8px;letter-spacing:.08em;text-transform:uppercase}</style>
        <div class="w-full h-full p-8 md:p-10 flex flex-col" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <div class="mb-5 pb-2 border-b flex justify-between items-center" style="border-color: ${colorScheme.accent}40;">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color: ${colorScheme.primary};">Kartu Konsep Interaktif</div>
              <h2 contenteditable="true" data-field="title" class="sg-editable text-2xl font-bold focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${title}</h2>
            </div>
            <span class="text-[10px] px-2.5 py-1 rounded-full font-bold" style="background: ${colorScheme.accent}20; color: ${colorScheme.primary};"><i class="fas fa-hand-pointer mr-1"></i>Klik Kartu</span>
          </div>
          <div class="grid gap-4 flex-1 items-center" style="grid-template-columns: repeat(${cols}, 1fr); min-height: 0;">
            ${flipItems.map((card, i) => `
              <div class="sg-flip-card" style="height: 100%;" onclick="this.classList.toggle('flipped')" title="Klik untuk balik kartu">
                <div class="sg-flip-inner">
                  <div class="sg-flip-front shadow-lg border" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.primary}50;">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm mb-3 shadow" style="background: ${colorScheme.primary};">${'ABCD'[i] || (i+1)}</div>
                    <p contenteditable="true" data-flipcard-field="front" data-index="${i}" class="sg-editable font-bold text-sm focus:outline-none rounded px-1" style="color: ${colorScheme.primary};" onclick="event.stopPropagation()">${escapeHtml(card.front || 'Klik untuk edit')}</p>
                    <div class="sg-flip-hint" style="color: ${colorScheme.text};">klik untuk balik ↩</div>
                  </div>
                  <div class="sg-flip-back shadow-xl" style="background: linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary}); color: #fff;">
                    <i class="fas fa-lightbulb text-2xl mb-3 opacity-60"></i>
                    <p contenteditable="true" data-flipcard-field="back" data-index="${i}" class="sg-editable text-xs leading-relaxed focus:outline-none rounded px-1" onclick="event.stopPropagation()">${escapeHtml(card.back || 'Penjelasan...')}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    case 'quiz':
      const quizOptions = slide.quizOptions && Array.isArray(slide.quizOptions)
        ? slide.quizOptions
        : ['A. Opsi Pilihan Pertama', 'B. Opsi Pilihan Kedua', 'C. Opsi Pilihan Ketiga', 'D. Opsi Pilihan Keempat'];
      return `
        <div class="w-full h-full p-8 md:p-10 flex flex-col justify-between" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <div>
            <div class="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
              <i class="fas fa-question-circle"></i> Kuis Pemantik Pembelajaran
            </div>
            <h2 contenteditable="true" data-field="question" class="sg-editable text-2xl font-bold mb-4 focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${escapeHtml(slide.question || title)}</h2>
          </div>
          <div class="grid grid-cols-2 gap-3 my-2">
            ${quizOptions.map((opt, i) => `
              <div class="p-4 rounded-2xl border shadow-sm flex items-center gap-3" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}30;">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0" style="background: ${colorScheme.secondary};">${String.fromCharCode(65 + i)}</span>
                <span contenteditable="true" data-quiz-option-index="${i}" class="sg-editable text-sm font-medium focus:outline-none rounded px-1 w-full" style="color: ${colorScheme.text};">${escapeHtml(opt)}</span>
              </div>
            `).join('')}
          </div>
          <div class="p-3 rounded-xl border flex items-center justify-between text-xs" style="background: ${colorScheme.accent}15; border-color: ${colorScheme.accent}40;">
            <span class="font-bold text-primary"><i class="fas fa-lightbulb mr-1"></i> Kunci Jawaban: <strong contenteditable="true" data-field="quizAnswer" class="sg-editable px-1">${escapeHtml(slide.quizAnswer || 'A')}</strong></span>
            <span contenteditable="true" data-field="quizExplanation" class="sg-editable opacity-80 truncate max-w-md px-1">${escapeHtml(slide.quizExplanation || 'Penjelasan kuis...')}</span>
          </div>
        </div>
      `;

    case 'twoColumn':
    case 'comparison':
      return `
        <div class="w-full h-full p-8 md:p-10 flex flex-col" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <h2 contenteditable="true" data-field="title" class="sg-editable text-3xl font-bold mb-6 pb-2 border-b focus:outline-none rounded px-1" style="color: ${colorScheme.primary}; border-color: ${colorScheme.accent}40;">${title}</h2>
          <div class="grid grid-cols-2 gap-6 flex-1">
            <div class="p-6 rounded-3xl shadow-sm border flex flex-col" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.primary}30;">
              <h3 contenteditable="true" data-field="leftTitle" class="sg-editable font-bold text-lg mb-4 flex items-center gap-2 focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">
                <i class="fas fa-arrow-circle-right text-xs"></i> ${escapeHtml(slide.leftTitle || 'Konsep A')}
              </h3>
              <ul class="space-y-3 flex-1">
                ${leftContent.map((item, i) => `
                  <li class="flex items-start gap-2 text-sm">
                    <span class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background: ${colorScheme.primary};"></span>
                    <span contenteditable="true" data-left-content-index="${i}" class="sg-editable focus:outline-none rounded px-1 w-full" style="color: ${colorScheme.text};">${escapeHtml(cleanSlideText(item))}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            <div class="p-6 rounded-3xl shadow-sm border flex flex-col" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.secondary}30;">
              <h3 contenteditable="true" data-field="rightTitle" class="sg-editable font-bold text-lg mb-4 flex items-center gap-2 focus:outline-none rounded px-1" style="color: ${colorScheme.secondary};">
                <i class="fas fa-arrow-circle-right text-xs"></i> ${escapeHtml(slide.rightTitle || 'Konsep B')}
              </h3>
              <ul class="space-y-3 flex-1">
                ${rightContent.map((item, i) => `
                  <li class="flex items-start gap-2 text-sm">
                    <span class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background: ${colorScheme.secondary};"></span>
                    <span contenteditable="true" data-right-content-index="${i}" class="sg-editable focus:outline-none rounded px-1 w-full" style="color: ${colorScheme.text};">${escapeHtml(cleanSlideText(item))}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;

    case 'imageText':
      return `
        <div class="w-full h-full p-8 md:p-10 flex flex-col" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <h2 contenteditable="true" data-field="title" class="sg-editable text-3xl font-bold mb-6 pb-2 border-b focus:outline-none rounded px-1" style="color: ${colorScheme.primary}; border-color: ${colorScheme.accent}40;">${title}</h2>
          <div class="grid grid-cols-5 gap-6 flex-1 items-center">
            <div class="col-span-3 space-y-3">
              ${content.map((item, i) => `
                <div class="p-3.5 rounded-2xl border shadow-sm flex items-start gap-3" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}30;">
                  <span class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0" style="background: ${colorScheme.secondary};">${i + 1}</span>
                  <span contenteditable="true" data-content-index="${i}" class="sg-editable text-sm font-medium focus:outline-none rounded px-1 w-full" style="color: ${colorScheme.text};">${escapeHtml(item)}</span>
                </div>
              `).join('')}
            </div>
            <div class="col-span-2 h-full flex items-center justify-center">
              ${imageHtml || `
                <div class="w-full h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center" style="border-color: ${colorScheme.accent};">
                  <i class="fas fa-image text-3xl mb-2 opacity-50"></i>
                  <span class="text-xs opacity-70">Ilustrasi Grafis Edukasi</span>
                </div>
              `}
            </div>
          </div>
        </div>
      `;

    case 'activity':
      return `
        <div class="w-full h-full p-8 md:p-10 flex flex-col justify-between" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <div>
            <div class="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
              <i class="fas fa-tasks"></i> Aktivitas Pembelajaran
            </div>
            <h2 contenteditable="true" data-field="title" class="sg-editable text-3xl font-bold mb-4 focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${title}</h2>
          </div>
          <div class="p-6 rounded-3xl border shadow-sm my-auto" style="background: ${colorScheme.cardBg}; border-left: 6px solid ${colorScheme.primary}; border-color: ${colorScheme.accent}30;">
            <p contenteditable="true" data-field="instruction" class="sg-editable text-base md:text-lg leading-relaxed focus:outline-none rounded px-1" style="color: ${colorScheme.text};">${escapeHtml(slide.instruction || 'Ayo diskusikan bersama kelompok!')}</p>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="p-3 rounded-2xl border text-center" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}20;">
              <div class="text-[10px] opacity-60 font-bold uppercase">Waktu</div>
              <div contenteditable="true" data-field="time" class="sg-editable font-bold text-sm" style="color: ${colorScheme.primary};">${escapeHtml(slide.time || '15 Menit')}</div>
            </div>
            <div class="p-3 rounded-2xl border text-center" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}20;">
              <div class="text-[10px] opacity-60 font-bold uppercase">Format</div>
              <div contenteditable="true" data-field="groupSize" class="sg-editable font-bold text-sm" style="color: ${colorScheme.primary};">${escapeHtml(slide.groupSize || 'Kelompok 4 Siswa')}</div>
            </div>
            <div class="p-3 rounded-2xl border text-center" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}20;">
              <div class="text-[10px] opacity-60 font-bold uppercase">Media</div>
              <div contenteditable="true" data-field="materials" class="sg-editable font-bold text-sm" style="color: ${colorScheme.primary};">${escapeHtml(slide.materials || 'LKPD & Alat Tulis')}</div>
            </div>
          </div>
        </div>
      `;

    case 'quote':
      return `
        <div class="w-full h-full p-12 flex flex-col items-center justify-center text-center" style="background: linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%); color: #ffffff;">
          <i class="fas fa-quote-left text-5xl opacity-40 mb-6"></i>
          <h2 contenteditable="true" data-field="quote" class="sg-editable text-3xl md:text-4xl font-bold leading-relaxed max-w-2xl mb-6 focus:outline-none rounded px-2">"${escapeHtml(slide.quote || title)}"</h2>
          <p contenteditable="true" data-field="author" class="sg-editable text-lg opacity-80 font-medium focus:outline-none rounded px-2">— ${escapeHtml(slide.author || 'Pepatah Pembelajaran')}</p>
        </div>
      `;

    case 'thankyou':
      return `
        <div class="w-full h-full p-12 flex flex-col items-center justify-center text-center" style="background: linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%); color: #ffffff;">
          <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6 shadow-lg">
            <i class="fas fa-heart text-3xl"></i>
          </div>
          <h1 contenteditable="true" data-field="title" class="sg-editable text-4xl font-black mb-4 focus:outline-none rounded px-2">Terima Kasih!</h1>
          <p contenteditable="true" data-field="message" class="sg-editable text-xl opacity-90 max-w-xl mb-8 focus:outline-none rounded px-2">${escapeHtml(slide.message || 'Semoga pembelajaran hari ini membawa inspirasi dan ilmu yang bermanfaat.')}</p>
          <div class="flex items-center gap-6 text-sm opacity-80">
            <span><i class="fas fa-user-tie mr-1.5"></i>${escapeHtml(slide.teacher || state.user?.nama || 'Guru Pengampu')}</span>
            <span><i class="fas fa-school mr-1.5"></i>${escapeHtml(slide.school || state.user?.sekolah || 'KKG Gugus 3 Wanayasa')}</span>
          </div>
        </div>
      `;

    case 'summary':
    case 'content':
    default:
      return `
        <div class="w-full h-full p-8 md:p-10 flex flex-col" style="background: ${colorScheme.background}; color: ${colorScheme.text};">
          <div class="mb-5 pb-2 border-b flex justify-between items-end" style="border-color: ${colorScheme.accent}40;">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Materi Ajar Inti</div>
              <h2 contenteditable="true" data-field="title" class="sg-editable text-3xl font-bold focus:outline-none rounded px-1" style="color: ${colorScheme.primary};">${title}</h2>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background: ${colorScheme.accent}20; color: ${colorScheme.primary};">${layout === 'summary' ? 'Rangkuman' : 'Poin Materi'}</span>
          </div>
          <div class="space-y-3 flex-1 justify-center flex flex-col">
            ${content.map((item, i) => formatContentBullet(item, i, colorScheme)).join('')}
          </div>
        </div>
      `;
  }
}

function cleanSlideText(raw) {
  if (raw === null || raw === undefined) return '';
  let str = typeof raw === 'object'
    ? (raw.text || raw.desc || raw.title || raw.point || raw.name || '')
    : String(raw);
  return str.replace(/\*\*(.*?)\*\*/g, '$1').trim();
}

function formatContentBullet(rawText, index, colorScheme) {
  let text = cleanSlideText(rawText);
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 40) {
    const lead = text.substring(0, colonIdx).trim();
    const body = text.substring(colonIdx + 1).trim();
    return `
      <div class="p-3.5 rounded-2xl border shadow-sm flex items-start gap-3 transition-all hover:translate-x-1" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}30;">
        <span class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm" style="background: ${colorScheme.primary};">${index + 1}</span>
        <div class="flex-1 text-sm font-medium leading-relaxed" style="color: ${colorScheme.text};">
          <span contenteditable="true" data-content-lead-index="${index}" class="sg-editable font-bold mr-1 px-1 rounded focus:ring-1 focus:ring-primary focus:outline-none" style="color: ${colorScheme.primary};">${escapeHtml(lead)}:</span>
          <span contenteditable="true" data-content-body-index="${index}" class="sg-editable px-1 rounded opacity-90 focus:ring-1 focus:ring-primary focus:outline-none">${escapeHtml(body)}</span>
        </div>
      </div>
    `;
  }
  return `
    <div class="p-3.5 rounded-2xl border shadow-sm flex items-start gap-3 transition-all hover:translate-x-1" style="background: ${colorScheme.cardBg}; border-color: ${colorScheme.accent}30;">
      <span class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm" style="background: ${colorScheme.primary};">${index + 1}</span>
      <span contenteditable="true" data-content-index="${index}" class="sg-editable text-sm font-medium focus:outline-none rounded px-1 w-full" style="color: ${colorScheme.text};">${escapeHtml(text)}</span>
    </div>
  `;
}

// ==========================================
// 6. EVENT BINDING & VIEW CONTROLLER
// ==========================================
export function initSlide() {
  window.initSlide = initSlide;

  window.slidgenGoTo = (viewName) => {
    if (window.slideGenState) {
      window.slideGenState.view = viewName;
      reRenderContainer();
    }
  };

  // Check incoming Smart Content Bridge data from RPP
  try {
    const rawBridge = sessionStorage.getItem('kkg_bridge_data');
    if (rawBridge) {
      const bridge = JSON.parse(rawBridge);
      if (bridge.target === 'slide' && bridge.topik) {
        sessionStorage.removeItem('kkg_bridge_data');
        if (window.slideGenState) {
          const fullPrompt = `${bridge.mataPelajaran ? bridge.mataPelajaran + ': ' : ''}${bridge.topik} (${bridge.jenjangKelas || 'SD'})`;
          window.slideGenState.prompt = fullPrompt;
          window.slideGenState.config.topik = bridge.topik;
          if (bridge.mataPelajaran) window.slideGenState.config.mataPelajaran = bridge.mataPelajaran;
          if (bridge.jenjangKelas) window.slideGenState.config.jenjangKelas = bridge.jenjangKelas;
          if (bridge.semester) window.slideGenState.config.semester = bridge.semester;
          if (bridge.strategi) window.slideGenState.config.strategi = bridge.strategi;

          const promptInput = document.getElementById('sg-main-prompt');
          if (promptInput) {
            promptInput.value = fullPrompt;
            promptInput.focus();
          }
          showToast(`✨ Materi dari RPP (${bridge.topik}) berhasil disinkronkan ke Slide Studio!`, 'success');
        }
      }
    }
  } catch (_) {}

  attachCurrentViewEvents();
}

function reRenderContainer() {
  const container = document.getElementById('slidegen-container');
  if (!container || !window.slideGenState) return;

  const view = window.slideGenState.view;
  if (view === 'landing') {
    container.innerHTML = renderLandingView();
  } else if (view === 'outline') {
    container.innerHTML = renderOutlineView();
  } else if (view === 'gallery') {
    container.innerHTML = renderGalleryView();
  } else if (view === 'editor') {
    container.innerHTML = renderEditorView();
  }

  attachCurrentViewEvents();
}

function attachCurrentViewEvents() {
  const s = window.slideGenState;
  if (!s) return;

  if (s.view === 'landing') {
    const promptInput = document.getElementById('sg-main-prompt');
    if (promptInput) {
      promptInput.value = s.prompt;
      promptInput.addEventListener('input', (e) => {
        s.prompt = e.target.value;
        s.config.topik = e.target.value;
      });
    }

    // Quick topics
    document.querySelectorAll('.sg-quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (promptInput) {
          promptInput.value = e.target.textContent;
          s.prompt = e.target.textContent;
          s.config.topik = e.target.textContent;
        }
      });
    });

    // Landing count pills
    document.querySelectorAll('.sg-landing-count-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const count = parseInt(e.currentTarget.dataset.count) || 8;
        s.config.slideCount = count;
        document.querySelectorAll('.sg-landing-count-btn').forEach(b => {
          b.className = 'sg-landing-count-btn px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
        });
        e.currentTarget.className = 'sg-landing-count-btn px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all bg-primary text-white shadow-sm ring-2 ring-primary/30';
        showToast(`Target slide diatur ke ${count} Slide`, 'info');
      });
    });

    // Option A: Outline Flow
    const btnOutline = document.getElementById('sg-btn-outline-flow');
    if (btnOutline) {
      btnOutline.addEventListener('click', async () => {
        if (!s.prompt.trim()) {
          showToast('Silakan ketik topik presentasi terlebih dahulu', 'error');
          return;
        }
        await generateOutline();
      });
    }

    // Option B: Instant Flow
    const btnInstant = document.getElementById('sg-btn-instant-flow');
    if (btnInstant) {
      btnInstant.addEventListener('click', () => {
        if (!s.prompt.trim()) {
          showToast('Silakan ketik topik presentasi terlebih dahulu', 'error');
          return;
        }
        s.config.topik = s.prompt;
        window.slidgenGoTo('gallery');
      });
    }

    // Landing model select
    const landingModelSelect = document.getElementById('sg-landing-model-select');
    if (landingModelSelect) {
      populateAiModelSelect(landingModelSelect, s.config.aiProvider);
      landingModelSelect.addEventListener('change', (e) => {
        s.config.aiProvider = e.target.value;
      });
    }

    // Settings Modal
    const settingsBtn = document.getElementById('sg-btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => showAISettingsModal());
    }

    // Archive Modal
    const archiveBtn = document.getElementById('sg-btn-archive');
    if (archiveBtn) {
      archiveBtn.addEventListener('click', () => openSlideArchiveDrawer());
    }
  }
  else if (s.view === 'outline') {
    // Title inputs sync
    document.querySelectorAll('.sg-outline-title-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (s.outline[idx]) s.outline[idx].title = e.target.value;
      });
    });

    // Layout select sync
    document.querySelectorAll('.sg-outline-layout-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (s.outline[idx]) s.outline[idx].layout = e.target.value;
      });
    });

    // Delete outline slide
    document.querySelectorAll('.sg-outline-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        if (s.outline.length <= 3) {
          showToast('Minimal outline memiliki 3 slide', 'warning');
          return;
        }
        s.outline.splice(idx, 1);
        reRenderContainer();
      });
    });

    // Add outline slide
    const btnAdd = document.getElementById('sg-btn-add-outline-slide');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        s.outline.push({
          index: s.outline.length + 1,
          title: `Sub-materi Baru ${s.outline.length + 1}`,
          layout: 'content',
          focus: 'Fokus materi baru'
        });
        reRenderContainer();
      });
    }

    // Regenerate outline
    const btnRegen = document.getElementById('sg-btn-regenerate-outline');
    if (btnRegen) {
      btnRegen.addEventListener('click', async () => {
        await generateOutline();
      });
    }

    // Next to Gallery
    const btnNext = document.getElementById('sg-btn-outline-to-gallery');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        s.config.slideCount = s.outline.length;
        window.slidgenGoTo('gallery');
      });
    }
  }
  else if (s.view === 'gallery') {
    // Style Filter Buttons
    document.querySelectorAll('.sg-style-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        s.activeFilter = filter;
        
        // Update active button state
        document.querySelectorAll('.sg-style-filter-btn').forEach(b => {
          b.className = 'sg-style-filter-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
        });
        e.currentTarget.className = 'sg-style-filter-btn w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between bg-primary text-white shadow-sm';

        // Filter cards
        document.querySelectorAll('.sg-template-card').forEach(card => {
          const cat = card.dataset.category;
          if (filter === 'all' || cat === filter) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });

    // Card Selection
    document.querySelectorAll('.sg-template-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        s.template = id;

        document.querySelectorAll('.sg-template-card').forEach(c => {
          c.classList.remove('border-primary', 'ring-4', 'ring-primary/20');
          c.classList.add('border-border-light', 'dark:border-border-dark');
          const radio = c.querySelector('.w-5.h-5');
          if (radio) {
            radio.className = 'w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0';
            radio.innerHTML = '';
          }
        });

        card.classList.remove('border-border-light', 'dark:border-border-dark');
        card.classList.add('border-primary', 'ring-4', 'ring-primary/20');
        const radio = card.querySelector('.w-5.h-5');
        if (radio) {
          radio.className = 'w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center text-white text-[10px] shrink-0';
          radio.innerHTML = '<i class="fas fa-check"></i>';
        }

        const displayTemplate = document.getElementById('sg-display-template');
        if (displayTemplate && slideTemplates[id]) {
          displayTemplate.textContent = slideTemplates[id].name;
        }
      });
    });

    // Config Inputs sync
    const countInput = document.getElementById('sg-input-count');
    const countVal = document.getElementById('sg-count-val');
    const engineInput = document.getElementById('sg-input-engine');

    if (engineInput) {
      populateAiModelSelect(engineInput, s.config.aiProvider);
      engineInput.addEventListener('change', e => s.config.aiProvider = e.target.value);
    }
    if (countInput && countVal) {
      countInput.addEventListener('input', e => {
        const count = parseInt(e.target.value);
        s.config.slideCount = count;
        countVal.textContent = count;
        document.querySelectorAll('.sg-sidebar-count-btn').forEach(b => {
          const bCount = parseInt(b.dataset.count);
          b.className = bCount === count
            ? 'sg-sidebar-count-btn py-1 rounded-md text-[10px] font-bold text-center transition-all bg-teal-600 text-white shadow-sm'
            : 'sg-sidebar-count-btn py-1 rounded-md text-[10px] font-bold text-center transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
        });
      });
    }

    document.querySelectorAll('.sg-sidebar-count-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const count = parseInt(e.currentTarget.dataset.count) || 8;
        s.config.slideCount = count;
        if (countInput) countInput.value = count;
        if (countVal) countVal.textContent = count;
        document.querySelectorAll('.sg-sidebar-count-btn').forEach(b => {
          b.className = 'sg-sidebar-count-btn py-1 rounded-md text-[10px] font-bold text-center transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
        });
        e.currentTarget.className = 'sg-sidebar-count-btn py-1 rounded-md text-[10px] font-bold text-center transition-all bg-teal-600 text-white shadow-sm';
      });
    });

    // Generate Full Presentation
    const btnGenerate = document.getElementById('sg-btn-generate');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', async () => {
        await generateFullSlides();
      });
    }
  }
  else if (s.view === 'editor') {
    updateEditorContent();

    // Editor Nav
    const prevBtn = document.getElementById('sg-prev-slide');
    const nextBtn = document.getElementById('sg-next-slide');
    const exportBtn = document.getElementById('sg-btn-export');
    const exportHtmlBtn = document.getElementById('sg-btn-export-html');
    const exportToggleBtn = document.getElementById('sg-btn-export-toggle');
    const exportMenu = document.getElementById('sg-export-menu');
    const fullscreenBtn = document.getElementById('sg-btn-fullscreen');
    const patchBtn = document.getElementById('sg-btn-patch-slide');
    const layoutSelect = document.getElementById('sg-change-layout-select');
    const notesInput = document.getElementById('sg-speaker-notes-input');
    const titleInput = document.getElementById('sg-editor-title');

    if (prevBtn) prevBtn.addEventListener('click', () => navigateEditor(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateEditor(1));
    if (exportBtn) exportBtn.addEventListener('click', () => { exportMenu?.classList.add('hidden'); exportToPPTX(); });
    if (exportHtmlBtn) exportHtmlBtn.addEventListener('click', () => { exportMenu?.classList.add('hidden'); exportToHTMLFile(); });
    if (exportToggleBtn && exportMenu) {
      exportToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', () => exportMenu.classList.add('hidden'));
    }
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreenPresentation);
    if (patchBtn) patchBtn.addEventListener('click', showPatchSlideModal);

    const editorArchiveBtn = document.getElementById('sg-btn-editor-archive');
    if (editorArchiveBtn) {
      editorArchiveBtn.addEventListener('click', () => openSlideArchiveDrawer());
    }

    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        s.config.topik = e.target.value;
      });
    }

    if (notesInput) {
      notesInput.addEventListener('input', (e) => {
        if (s.slides[s.currentIndex]) {
          s.slides[s.currentIndex].speakerNotes = e.target.value;
        }
      });
    }

    if (layoutSelect) {
      layoutSelect.addEventListener('change', (e) => {
        if (s.slides[s.currentIndex]) {
          s.slides[s.currentIndex].layout = e.target.value;
          updateEditorContent();
        }
      });
    }

    // Keyboard navigation (Arrow keys)
    const keyHandler = (e) => {
      if (window.slideGenState?.view === 'editor' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !document.activeElement.isContentEditable) {
        if (e.key === 'ArrowLeft') navigateEditor(-1);
        if (e.key === 'ArrowRight') navigateEditor(1);
        if (e.key === 'F5') { e.preventDefault(); toggleFullscreenPresentation(); }
      }
    };
    document.removeEventListener('keydown', window._sgKeyHandler);
    window._sgKeyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);
  }
}

function openSlideArchiveDrawer() {
  openArchiveDrawer({
    module: 'slide',
    moduleName: 'Slide Presentasi',
    onSelect: (item) => {
      if (window.slideGenState && item.content) {
        window.slideGenState.slides = item.content.slides || [];
        window.slideGenState.outline = item.content.outline || [];
        window.slideGenState.template = item.content.template || 'minimalist-dark';
        window.slideGenState.prompt = item.content.prompt || item.title || '';
        window.slideGenState.config = item.inputData || window.slideGenState.config;
        window.slideGenState.currentIndex = 0;
        window.slidgenGoTo('editor');
        showToast(`Membuka riwayat: ${item.title}`, 'info');
      }
    }
  });
}

// ==========================================
// 7. PRESENTATION GENERATION
// ==========================================

async function generateOutline() {
  const s = window.slideGenState;
  if (!s || !s.prompt.trim()) return;

  showLoading('AI sedang merancang outline presentasi...', 'Menyusun alur pedagogik Kurikulum Merdeka');

  try {
    const payload = {
      topik: s.config.topik || s.prompt || 'Materi Pembelajaran',
      slideCount: Math.max(3, Math.min(25, parseInt(s.config.slideCount) || 8)),
      aiProvider: s.config.aiProvider || undefined
    };

    const res = await api('/presentation/outline', {
      method: 'POST',
      body: payload,
      timeout: 120000
    });

    if (res.data && Array.isArray(res.data.outline)) {
      s.outline = res.data.outline;
      showToast('Outline berhasil dirancang! Silakan sesuaikan.', 'success');
      window.slidgenGoTo('outline');
    } else {
      throw new Error('Format outline tidak valid');
    }
  } catch (err) {
    console.error('Outline generation error:', err);
    showToast(err.message || 'Gagal merancang outline. Silakan coba lagi.', 'error');
  } finally {
    hideLoading();
  }
}

async function generateFullSlides() {
  const s = window.slideGenState;
  if (!s) return;

  showLoading('AI sedang merakit seluruh slide...', 'Memproses visual, tipografi & catatan pengajar');

  try {
    const payload = {
      topik: s.config.topik || s.prompt || 'Materi Pembelajaran',
      slideCount: Math.max(3, Math.min(25, parseInt(s.config.slideCount) || (s.outline?.length || 8))),
      template: s.template || 'minimalist-dark',
      aiProvider: s.config.aiProvider || undefined,
      customOutline: (s.outline && s.outline.length > 0) ? s.outline : undefined
    };

    const res = await api('/presentation/generate', {
      method: 'POST',
      body: payload,
      timeout: 180000
    });

    if (res.data && Array.isArray(res.data.slides)) {
      s.slides = res.data.slides;
      s.currentIndex = 0;

      // Auto-archive presentation deck
      saveDocArchive({
        module: 'slide',
        title: s.config.topik || s.prompt || 'Slide Presentasi',
        subtitle: `${s.slides.length} Slide | ${s.config.jenjangKelas || 'SD'}`,
        inputData: s.config,
        content: {
          slides: s.slides,
          outline: s.outline,
          template: s.template,
          prompt: s.prompt
        }
      });

      showToast('Presentasi berhasil dibuat dan otomatis diarsipkan!', 'success');
      window.slidgenGoTo('editor');
    } else {
      throw new Error('Format output slide AI tidak valid');
    }
  } catch (err) {
    console.error('Slide generation error:', err);
    showToast(err.message || 'Gagal generate slide. Silakan coba lagi.', 'error');
  } finally {
    hideLoading();
  }
}

// ==========================================
// 8. STUDIO EDITOR CONTROLS & INLINE EDIT SYNC
// ==========================================

function navigateEditor(dir) {
  const s = window.slideGenState;
  if (!s || !s.slides.length) return;

  const nextIdx = s.currentIndex + dir;
  if (nextIdx >= 0 && nextIdx < s.slides.length) {
    s.currentIndex = nextIdx;
    updateEditorContent();
  }
}

function goToEditorSlide(idx) {
  const s = window.slideGenState;
  if (!s || !s.slides.length) return;

  if (idx >= 0 && idx < s.slides.length) {
    s.currentIndex = idx;
    updateEditorContent();
  }
}

function updateEditorContent() {
  const s = window.slideGenState;
  if (!s || !s.slides.length) return;

  const currentSlide = s.slides[s.currentIndex] || {};
  const tpl = slideTemplates[s.template] || slideTemplates['minimalist-dark'];
  const colorScheme = tpl.colorScheme;

  // Render Canvas
  const renderArea = document.getElementById('sg-slide-render-area');
  if (renderArea) {
    renderArea.innerHTML = generateSlideHTML(currentSlide, s.currentIndex, colorScheme);
    attachInlineEditListeners(renderArea, currentSlide);
  }

  // Update layout selector
  const layoutSelect = document.getElementById('sg-change-layout-select');
  if (layoutSelect) layoutSelect.value = currentSlide.layout || 'content';

  // Update counters
  const counterEl = document.getElementById('sg-slide-counter');
  const layoutNameEl = document.getElementById('sg-slide-layout-name');
  if (counterEl) counterEl.textContent = `Slide ${s.currentIndex + 1} / ${s.slides.length}`;
  if (layoutNameEl) layoutNameEl.textContent = currentSlide.layout || 'Content';

  // Update Notes Textarea
  const notesInput = document.getElementById('sg-speaker-notes-input');
  if (notesInput) notesInput.value = currentSlide.speakerNotes || '';

  // Render Thumbnails
  const thumbsContainer = document.getElementById('sg-thumbnails-container');
  if (thumbsContainer) {
    thumbsContainer.innerHTML = s.slides.map((slide, i) => {
      const isActive = i === s.currentIndex;
      return `
        <div class="sg-thumbnail-item flex-shrink-0 w-36 aspect-[16/9] rounded-xl overflow-hidden cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary shadow-lg scale-105' : 'border border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'}" data-index="${i}">
           <div class="w-full h-full p-2 flex flex-col pointer-events-none" style="background: ${colorScheme.background}; color: ${colorScheme.text}; font-size: 7px;">
               <div class="font-bold truncate mb-0.5 flex items-center gap-1" style="color: ${colorScheme.primary};">
                 <span>${i + 1}. ${escapeHtml(slide.title || 'Slide')}</span>
                 ${slide.image?.url ? '<i class="fas fa-image text-[6px]"></i>' : ''}
               </div>
               <div class="text-[6px] opacity-70 line-clamp-2">${escapeHtml(slide.content?.[0] || slide.subtitle || slide.instruction || '')}</div>
           </div>
        </div>
      `;
    }).join('');

    thumbsContainer.querySelectorAll('.sg-thumbnail-item').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        goToEditorSlide(idx);
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });
  }
}

// Attach live auto-sync to all contenteditable elements
function attachInlineEditListeners(container, slide) {
  container.querySelectorAll('[contenteditable="true"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const field = e.target.dataset.field;
      const contentIdx = e.target.dataset.contentIndex;
      const leftIdx = e.target.dataset.leftContentIndex;
      const rightIdx = e.target.dataset.rightContentIndex;
      const timelineField = e.target.dataset.timelineField;
      const timelineIdx = e.target.dataset.index;
      const statField = e.target.dataset.statField;
      const statIdx = e.target.dataset.index;
      const quizOptIdx = e.target.dataset.quizOptionIndex;

      if (field) {
        slide[field] = e.target.innerText;
      } else if (e.target.dataset.contentLeadIndex !== undefined) {
        const idx = parseInt(e.target.dataset.contentLeadIndex);
        const lead = e.target.innerText.replace(/:$/, '').trim();
        const bodyEl = e.target.parentElement.querySelector('[data-content-body-index]');
        const body = bodyEl ? bodyEl.innerText.trim() : '';
        if (!Array.isArray(slide.content)) slide.content = [];
        slide.content[idx] = `${lead}: ${body}`;
      } else if (e.target.dataset.contentBodyIndex !== undefined) {
        const idx = parseInt(e.target.dataset.contentBodyIndex);
        const body = e.target.innerText.trim();
        const leadEl = e.target.parentElement.querySelector('[data-content-lead-index]');
        const lead = leadEl ? leadEl.innerText.replace(/:$/, '').trim() : '';
        if (!Array.isArray(slide.content)) slide.content = [];
        slide.content[idx] = `${lead}: ${body}`;
      } else if (contentIdx !== undefined) {
        if (!Array.isArray(slide.content)) slide.content = [];
        slide.content[parseInt(contentIdx)] = e.target.innerText;
      } else if (leftIdx !== undefined) {
        if (!Array.isArray(slide.leftContent)) slide.leftContent = [];
        slide.leftContent[parseInt(leftIdx)] = e.target.innerText;
      } else if (rightIdx !== undefined) {
        if (!Array.isArray(slide.rightContent)) slide.rightContent = [];
        slide.rightContent[parseInt(rightIdx)] = e.target.innerText;
      } else if (timelineField && timelineIdx !== undefined) {
        if (!slide.timeline) slide.timeline = [];
        if (!slide.timeline[parseInt(timelineIdx)]) slide.timeline[parseInt(timelineIdx)] = {};
        slide.timeline[parseInt(timelineIdx)][timelineField] = e.target.innerText;
      } else if (statField && statIdx !== undefined) {
        if (!slide.stats) slide.stats = [];
        if (!slide.stats[parseInt(statIdx)]) slide.stats[parseInt(statIdx)] = {};
        slide.stats[parseInt(statIdx)][statField] = e.target.innerText;
      } else if (quizOptIdx !== undefined) {
        if (!Array.isArray(slide.quizOptions)) slide.quizOptions = [];
        slide.quizOptions[parseInt(quizOptIdx)] = e.target.innerText;
      } else if (e.target.dataset.flipcardField !== undefined) {
        const fIdx = parseInt(e.target.dataset.index);
        const fField = e.target.dataset.flipcardField;
        if (!Array.isArray(slide.flipcards)) slide.flipcards = [];
        if (!slide.flipcards[fIdx]) slide.flipcards[fIdx] = {};
        slide.flipcards[fIdx][fField] = e.target.innerText;
      }
    });
  });
}

// ==========================================
// 9. AI SINGLE SLIDE REVISION (AI Patch Modal)
// ==========================================
function showPatchSlideModal() {
  const modalContainer = document.getElementById('sg-modal-container');
  if (!modalContainer) return;

  const s = window.slideGenState;
  const currentSlide = s.slides[s.currentIndex] || {};

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl max-w-lg w-full animate-slide-up border border-border-light dark:border-border-dark space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <i class="fas fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white text-base">Revisi Slide ${s.currentIndex + 1} dengan AI</h3>
              <p class="text-xs text-gray-500">Berikan instruksi revisi spesifik untuk slide ini.</p>
            </div>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>

        <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs space-y-1">
          <div class="text-gray-400 font-semibold uppercase text-[10px]">Slide Saat Ini:</div>
          <div class="font-bold text-gray-800 dark:text-gray-200">${escapeHtml(currentSlide.title || 'Judul Slide')}</div>
          <div class="text-gray-500">Layout: ${currentSlide.layout || 'content'}</div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Instruksi Revisi:</label>
          <textarea id="sg-patch-instruction" class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-24" placeholder="Contoh: 'Buat poin materi lebih ringkas untuk siswa SD', atau 'Ubah layout menjadi kuis interaktif dengan 4 pilihan'"></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            Batal
          </button>
          <button id="sg-btn-submit-patch" class="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <i class="fas fa-sparkles"></i> Jalankan Revisi AI
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sg-btn-submit-patch').onclick = async () => {
    const instruction = document.getElementById('sg-patch-instruction').value.trim();
    if (!instruction) {
      showToast('Silakan ketik instruksi revisi', 'warning');
      return;
    }

    modalContainer.querySelector('.fixed')?.remove();
    showLoading(`AI sedang merevisi Slide ${s.currentIndex + 1}...`);

    try {
      const res = await api('/presentation/patch-slide', {
        method: 'POST',
        body: {
          currentSlide,
          instruction,
          mataPelajaran: s.config.mataPelajaran,
          topik: s.config.topik,
          jenjangKelas: s.config.jenjangKelas,
          aiProvider: s.config.aiProvider
        }
      });

      if (res.data) {
        s.slides[s.currentIndex] = res.data;
        updateEditorContent();
        showToast(`Slide ${s.currentIndex + 1} berhasil diperbarui!`, 'success');
      }
    } catch (e) {
      console.error('Patch slide error:', e);
      showToast(e.message || 'Gagal merevisi slide', 'error');
    } finally {
      hideLoading();
    }
  };
}

// ==========================================
// 10. FULLSCREEN PRESENTER VIEW (Classroom Mode)
// ==========================================
function toggleFullscreenPresentation() {
  const fsContainer = document.getElementById('sg-fullscreen-container');
  if (!fsContainer) return;

  const s = window.slideGenState;
  if (!s || !s.slides.length) return;

  fsContainer.classList.remove('hidden');

  const tpl = slideTemplates[s.template] || slideTemplates['minimalist-dark'];
  const colorScheme = tpl.colorScheme;

  function renderFsSlide() {
    const currentSlide = s.slides[s.currentIndex];
    fsContainer.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center relative p-6 select-none">
        <!-- Top Floating Controls -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-md px-5 py-2 rounded-full text-white text-xs flex items-center gap-4 border border-white/10 z-50">
          <span class="font-bold text-primary">${s.currentIndex + 1} / ${s.slides.length}</span>
          <div class="w-px h-3 bg-white/20"></div>
          <span class="text-gray-300">${escapeHtml(s.config.topik || 'Presentasi')}</span>
          <div class="w-px h-3 bg-white/20"></div>
          <button id="sg-fs-close" class="text-gray-400 hover:text-white transition-colors" title="Keluar (Esc)"><i class="fas fa-times"></i></button>
        </div>

        <!-- 16:9 Stage Screen -->
        <div class="w-full max-w-6xl aspect-[16/9] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 flex flex-col">
          ${generateSlideHTML(currentSlide, s.currentIndex, colorScheme)}
        </div>

        <!-- Bottom Floating Navigator -->
        <div class="absolute bottom-6 flex items-center gap-4 z-50">
          <button id="sg-fs-prev" class="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur flex items-center justify-center transition-all ${s.currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button id="sg-fs-next" class="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur flex items-center justify-center transition-all ${s.currentIndex === s.slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;

    document.getElementById('sg-fs-close').onclick = closeFullscreen;
    document.getElementById('sg-fs-prev').onclick = () => { if (s.currentIndex > 0) { s.currentIndex--; renderFsSlide(); } };
    document.getElementById('sg-fs-next').onclick = () => { if (s.currentIndex < s.slides.length - 1) { s.currentIndex++; renderFsSlide(); } };
  }

  function closeFullscreen() {
    fsContainer.classList.add('hidden');
    fsContainer.innerHTML = '';
    document.removeEventListener('keydown', fsKeyHandler);
    updateEditorContent();
  }

  const fsKeyHandler = (e) => {
    if (e.key === 'Escape') closeFullscreen();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (s.currentIndex > 0) { s.currentIndex--; renderFsSlide(); } }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { if (s.currentIndex < s.slides.length - 1) { s.currentIndex++; renderFsSlide(); } }
  };

  document.addEventListener('keydown', fsKeyHandler);
  renderFsSlide();
}

// ==========================================
// 11. HIGH-FIDELITY PPTX EXPORT ENGINE
// ==========================================
async function exportToPPTX() {
  const s = window.slideGenState;
  if (!s || !s.slides.length) {
    showToast('Tidak ada slide untuk diexport', 'error');
    return;
  }

  showLoading('Mengexport presentasi ke PowerPoint (.pptx)...');

  try {
    if (!window.PptxGenJS) {
      await loadScript('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
    }

    const pptx = new window.PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = s.slides[0]?.title || s.config.topik || 'Presentasi Pembelajaran';
    pptx.author = state.user?.nama || 'Guru Pengampu';
    pptx.company = state.user?.sekolah || 'KKG Gugus 3 Wanayasa';

    const tpl = slideTemplates[s.template] || slideTemplates['minimalist-dark'];
    const colorScheme = tpl.colorScheme;
    const cleanPrimary = colorScheme.primary.replace('#', '');
    const cleanSecondary = colorScheme.secondary.replace('#', '');
    const cleanBg = colorScheme.background.replace('#', '');
    const cleanCardBg = colorScheme.cardBg.replace('#', '');
    const cleanText = colorScheme.text.replace('#', '');

    const imageCache = new Map();

    async function imageUrlToDataUri(url) {
      if (!url) return null;
      if (imageCache.has(url)) return imageCache.get(url);

      const promise = fetch(url)
        .then(res => { if (!res.ok) throw new Error('Fetch image error'); return res.blob(); })
        .then(blob => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }))
        .catch(() => null);

      imageCache.set(url, promise);
      return promise;
    }

    const baseAutoFit = { autoFit: true, breakLine: true };

    for (let i = 0; i < s.slides.length; i++) {
      const slide = s.slides[i];
      const pptSlide = pptx.addSlide();
      const layout = slide.layout || 'content';

      // Background
      if (layout === 'title' || layout === 'thankyou' || layout === 'quote') {
        pptSlide.background = { color: cleanPrimary };
      } else {
        pptSlide.background = { color: cleanBg };
      }

      // Title & Header (Grid Safety Box)
      if (layout !== 'title' && layout !== 'thankyou' && layout !== 'quote') {
        pptSlide.addText(slide.title || 'Materi Pembelajaran', {
          x: 0.8, y: 0.5, w: 11.5, h: 0.8,
          fontSize: 28, bold: true, color: cleanPrimary, ...baseAutoFit
        });
        // Footer Stamp
        pptSlide.addText(`${s.config.mataPelajaran || 'Materi'} · ${state.user?.sekolah || 'KKG Wanayasa'} | Hal. ${i + 1}`, {
          x: 0.8, y: 6.9, w: 11.5, h: 0.3,
          fontSize: 10, color: '888888', align: 'right'
        });
      }

      // Layout specific content mapping
      switch (layout) {
        case 'title':
          pptSlide.addText(slide.title || s.config.topik || 'Presentasi', {
            x: 1.0, y: 2.2, w: 11.3, h: 2.0,
            fontSize: 44, bold: true, color: 'FFFFFF', align: 'center', ...baseAutoFit
          });
          pptSlide.addText(slide.subtitle || `${s.config.mataPelajaran || ''} · ${s.config.jenjangKelas || ''}`, {
            x: 1.5, y: 4.3, w: 10.3, h: 1.0,
            fontSize: 20, color: 'E2E8F0', align: 'center', ...baseAutoFit
          });
          break;

        case 'twoColumn':
        case 'comparison':
          // Left Card Container
          pptSlide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.5, w: 5.5, h: 5.0, fill: { color: cleanCardBg }, line: { color: cleanPrimary, width: 1 } });
          pptSlide.addText(slide.leftTitle || 'Konsep A', { x: 1.1, y: 1.8, w: 4.9, h: 0.6, fontSize: 20, bold: true, color: cleanPrimary });
          if (slide.leftContent && Array.isArray(slide.leftContent)) {
            const leftItems = slide.leftContent.map(t => ({ text: t, options: { bullet: true, color: cleanText, fontSize: 16 } }));
            pptSlide.addText(leftItems, { x: 1.1, y: 2.5, w: 4.9, h: 3.8, ...baseAutoFit });
          }

          // Right Card Container
          pptSlide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 1.5, w: 5.5, h: 5.0, fill: { color: cleanCardBg }, line: { color: cleanSecondary, width: 1 } });
          pptSlide.addText(slide.rightTitle || 'Konsep B', { x: 7.1, y: 1.8, w: 4.9, h: 0.6, fontSize: 20, bold: true, color: cleanSecondary });
          if (slide.rightContent && Array.isArray(slide.rightContent)) {
            const rightItems = slide.rightContent.map(t => ({ text: t, options: { bullet: true, color: cleanText, fontSize: 16 } }));
            pptSlide.addText(rightItems, { x: 7.1, y: 2.5, w: 4.9, h: 3.8, ...baseAutoFit });
          }
          break;

        case 'timeline':
          const steps = slide.timeline || [];
          const stepW = Math.min(3.5, 11.5 / Math.max(1, steps.length));
          steps.forEach((st, sIdx) => {
            const startX = 0.8 + (sIdx * (stepW + 0.3));
            pptSlide.addShape(pptx.ShapeType.roundRect, { x: startX, y: 1.8, w: stepW, h: 4.6, fill: { color: cleanCardBg }, line: { color: cleanPrimary, width: 1 } });
            pptSlide.addText(st.step || `Tahap ${sIdx + 1}`, { x: startX + 0.2, y: 2.0, w: stepW - 0.4, h: 0.5, fontSize: 16, bold: true, color: cleanPrimary });
            pptSlide.addText(st.title || '', { x: startX + 0.2, y: 2.6, w: stepW - 0.4, h: 0.8, fontSize: 14, bold: true, color: cleanText, ...baseAutoFit });
            pptSlide.addText(st.desc || '', { x: startX + 0.2, y: 3.5, w: stepW - 0.4, h: 2.6, fontSize: 12, color: cleanText, ...baseAutoFit });
          });
          break;

        case 'stats':
          const stats = slide.stats || [];
          const statW = Math.min(3.6, 11.5 / Math.max(1, stats.length));
          stats.forEach((st, sIdx) => {
            const startX = 0.8 + (sIdx * (statW + 0.4));
            pptSlide.addShape(pptx.ShapeType.roundRect, { x: startX, y: 2.0, w: statW, h: 4.2, fill: { color: cleanCardBg }, line: { color: cleanPrimary, width: 1 } });
            pptSlide.addText(st.value || '100%', { x: startX + 0.2, y: 2.4, w: statW - 0.4, h: 1.2, fontSize: 36, bold: true, color: cleanPrimary, align: 'center' });
            pptSlide.addText(st.label || '', { x: startX + 0.2, y: 3.7, w: statW - 0.4, h: 0.6, fontSize: 16, bold: true, color: cleanSecondary, align: 'center' });
            pptSlide.addText(st.desc || '', { x: startX + 0.2, y: 4.4, w: statW - 0.4, h: 1.5, fontSize: 12, color: cleanText, align: 'center', ...baseAutoFit });
          });
          break;

        case 'quiz':
          pptSlide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.5, w: 11.5, h: 1.2, fill: { color: cleanCardBg }, line: { color: cleanPrimary, width: 1 } });
          pptSlide.addText(slide.question || slide.title || 'Pertanyaan Kuis:', { x: 1.0, y: 1.6, w: 11.1, h: 1.0, fontSize: 18, bold: true, color: cleanPrimary, ...baseAutoFit });

          const opts = slide.quizOptions || [];
          opts.forEach((opt, oIdx) => {
            const col = oIdx % 2;
            const row = Math.floor(oIdx / 2);
            const ox = col === 0 ? 0.8 : 6.8;
            const oy = 3.0 + (row * 1.5);
            pptSlide.addShape(pptx.ShapeType.roundRect, { x: ox, y: oy, w: 5.5, h: 1.2, fill: { color: cleanCardBg }, line: { color: cleanSecondary, width: 1 } });
            pptSlide.addText(opt, { x: ox + 0.3, y: oy + 0.2, w: 4.9, h: 0.8, fontSize: 14, color: cleanText, ...baseAutoFit });
          });
          break;

        case 'imageText':
          if (slide.content && Array.isArray(slide.content)) {
            const contentItems = slide.content.map(t => ({ text: t, options: { bullet: true, color: cleanText, fontSize: 16 } }));
            pptSlide.addText(contentItems, { x: 0.8, y: 1.6, w: 6.0, h: 4.8, ...baseAutoFit });
          }
          if (slide.image?.url) {
            const imgData = await imageUrlToDataUri(slide.image.url);
            pptSlide.addImage({ data: imgData || slide.image.url, x: 7.2, y: 1.6, w: 5.1, h: 3.8 });
            pptSlide.addText(`Foto: ${slide.image.creditName || 'Unsplash'} via Unsplash`, { x: 7.2, y: 5.5, w: 5.1, h: 0.3, fontSize: 9, color: '888888' });
          }
          break;

        case 'quote':
          pptSlide.addText(`"${slide.quote || slide.title || ''}"`, {
            x: 1.5, y: 2.2, w: 10.3, h: 2.5,
            fontSize: 32, italic: true, bold: true, color: 'FFFFFF', align: 'center', ...baseAutoFit
          });
          pptSlide.addText(`— ${slide.author || 'Tokoh'}`, {
            x: 1.5, y: 4.8, w: 10.3, h: 0.8,
            fontSize: 20, color: 'E2E8F0', align: 'center'
          });
          break;

        case 'thankyou':
          pptSlide.addText('🙏 Terima Kasih!', {
            x: 1.5, y: 2.2, w: 10.3, h: 1.5,
            fontSize: 44, bold: true, color: 'FFFFFF', align: 'center'
          });
          pptSlide.addText(slide.message || 'Semoga bermanfaat!', {
            x: 1.5, y: 3.8, w: 10.3, h: 1.2,
            fontSize: 20, color: 'E2E8F0', align: 'center', ...baseAutoFit
          });
          break;

        case 'summary':
        case 'content':
        default:
          if (slide.content && Array.isArray(slide.content)) {
            const bulletItems = slide.content.map(t => ({ text: t, options: { bullet: true, color: cleanText, fontSize: 18 } }));
            pptSlide.addText(bulletItems, { x: 0.8, y: 1.6, w: 11.5, h: 4.8, ...baseAutoFit });
          }
      }

      // Speaker Notes
      if (slide.speakerNotes) {
        pptSlide.addNotes(slide.speakerNotes);
      }
    }

    const filename = `${(s.config.topik || s.prompt || 'presentasi').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pptx`;
    await pptx.writeFile({ fileName: filename });
    showToast('PowerPoint (.pptx) berhasil didownload!', 'success');
  } catch (err) {
    console.error('PPTX export error:', err);
    showToast('Gagal mengeksport PowerPoint (.pptx)', 'error');
  } finally {
    hideLoading();
  }
}

// ==========================================
// 11. EXPORT TO STANDALONE INTERACTIVE HTML
// (Inspired by bluedusk/html-slides: zero-dependency, browser-native)
// ==========================================
async function exportToHTMLFile() {
  const s = window.slideGenState;
  if (!s || !s.slides || s.slides.length === 0) {
    showToast('Belum ada slide untuk diekspor.', 'error');
    return;
  }
  showLoading('Menyiapkan file HTML interaktif...');
  try {
    const tpl = slideTemplates[s.template] || slideTemplates['minimalist-dark'];
    const cs = tpl.colorScheme;
    const title = s.config.topik || s.prompt || 'Presentasi Pembelajaran';

    // Build inline slide HTML for each slide
    const slidesHtml = s.slides.map((slide, idx) => {
      const isActive = idx === 0 ? 'active' : '';
      const layout = slide.layout || 'content';
      const t = escapeHtml(cleanSlideText(slide.title || 'Judul Slide'));
      const sub = escapeHtml(cleanSlideText(slide.subtitle || ''));
      let content = Array.isArray(slide.content) ? slide.content.map(c => cleanSlideText(c)).filter(Boolean) : [];
      const notes = escapeHtml(cleanSlideText(slide.speakerNotes || ''));

      let inner = '';
      if (layout === 'title') {
        const isDark = cs.background && cs.background.startsWith('#0');
        const glow = isDark ? `<div class="glow-blob gb1"></div><div class="glow-blob gb2"></div>` : '';
        inner = `${glow}<div class="title-inner"><div class="title-icon"><i class="fas fa-graduation-cap"></i></div>
<h1 class="slide-h1">${t}</h1><p class="slide-sub">${sub || 'Kurikulum Merdeka'}</p>
<div class="rainbow-bar"></div></div>`;
      } else if (layout === 'quote') {
        inner = `<div class="quote-wrap"><i class="fas fa-quote-left quote-icon"></i>
<blockquote class="slide-quote">"${escapeHtml(cleanSlideText(slide.quote || t))}"</blockquote>
<cite class="quote-author">— ${escapeHtml(cleanSlideText(slide.author || 'Sumber Inspirasi'))}</cite></div>`;
      } else if (layout === 'stats') {
        let stats = Array.isArray(slide.stats) && slide.stats.length > 0 ? slide.stats : [
          { value: '📌', label: 'Fakta Utama', desc: 'Informasi penting yang wajib diketahui' },
          { value: '💡', label: 'Tahukah Kamu?', desc: 'Fakta menarik seputar topik ini' },
          { value: '🎯', label: 'Poin Kunci', desc: 'Hal yang wajib diingat siswa' }
        ];
        inner = `<div class="slide-header"><div class="slide-tag">Fakta &amp; Data Kunci</div><h2 class="slide-h2">${t}</h2></div>
<div class="stats-grid">
${stats.map(st => `<div class="stat-card"><div class="stat-val">${escapeHtml(cleanSlideText(st.value||'100%'))}</div><div class="stat-label">${escapeHtml(cleanSlideText(st.label||'Fakta'))}</div><div class="stat-desc">${escapeHtml(cleanSlideText(st.desc||''))}</div></div>`).join('')}
</div>`;
      } else if (layout === 'timeline') {
        let steps = Array.isArray(slide.timeline) && slide.timeline.length > 0 ? slide.timeline : [
          { step: '1', title: 'Tahap Pertama', desc: 'Pengenalan konsep dasar materi.' },
          { step: '2', title: 'Tahap Kedua', desc: 'Eksplorasi dan diskusi materi mendalam.' },
          { step: '3', title: 'Tahap Ketiga', desc: 'Menyimpulkan pemahaman bersama.' }
        ];
        inner = `<div class="slide-header"><div class="slide-tag">Alur &amp; Langkah Pembelajaran</div><h2 class="slide-h2">${t}</h2></div>
<div class="timeline-grid">
${steps.map((st,i) => `<div class="tl-card"><div class="tl-num">${escapeHtml(cleanSlideText(st.step||String(i+1)))}</div><div class="tl-title">${escapeHtml(cleanSlideText(st.title||'Langkah'))}</div><div class="tl-desc">${escapeHtml(cleanSlideText(st.desc||''))}</div></div>`).join('')}
</div>`;
      } else if (layout === 'quiz') {
        let opts = Array.isArray(slide.quizOptions) && slide.quizOptions.length >= 2 ? slide.quizOptions : [
          'A. Pilihan jawaban pertama',
          'B. Pilihan jawaban kedua',
          'C. Pilihan jawaban ketiga',
          'D. Pilihan jawaban keempat'
        ];
        const qTitle = escapeHtml(cleanSlideText(slide.question || t));
        const qAns = escapeHtml(cleanSlideText(slide.quizAnswer || 'A'));
        const qExp = escapeHtml(cleanSlideText(slide.quizExplanation || 'Penjelasan jawaban yang benar.'));
        inner = `<div class="slide-header"><div class="slide-tag"><i class="fas fa-question-circle"></i> Kuis Pemantik</div><h2 class="slide-h2">${qTitle}</h2></div>
<div class="quiz-grid">
${opts.map((o,i) => `<div class="quiz-opt"><span class="quiz-letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(cleanSlideText(o))}</span></div>`).join('')}
</div>
<div class="quiz-key"><i class="fas fa-lightbulb"></i> Jawaban: <strong>${qAns}</strong> &mdash; ${qExp}</div>`;
      } else if (layout === 'flipcard') {
        let cards = Array.isArray(slide.flipcards) && slide.flipcards.length > 0 ? slide.flipcards : [
          { front: 'Konsep 1', back: 'Penjelasan konsep pertama.' },
          { front: 'Konsep 2', back: 'Penjelasan konsep kedua.' },
          { front: 'Konsep 3', back: 'Penjelasan konsep ketiga.' },
          { front: 'Konsep 4', back: 'Penjelasan konsep keempat.' }
        ];
        inner = `<div class="slide-header"><div class="slide-tag">Kartu Interaktif</div><h2 class="slide-h2">${t}</h2></div>
<div class="flip-grid" style="grid-template-columns:repeat(${Math.min(cards.length||4,4)},1fr)">
${cards.map((c,i) => `<div class="flip-card" onclick="this.classList.toggle('flipped')"><div class="flip-inner"><div class="flip-front"><span class="flip-letter">${'ABCD'[i]||i+1}</span><p class="flip-ft">${escapeHtml(cleanSlideText(c.front||'Konsep'))}</p><div class="flip-hint">klik untuk balik ↩</div></div><div class="flip-back"><i class="fas fa-lightbulb flip-icon"></i><p class="flip-bk">${escapeHtml(cleanSlideText(c.back||'Penjelasan'))}</p></div></div></div>`).join('')}
</div>`;
      } else if (layout === 'twoColumn' || layout === 'comparison') {
        let lc = Array.isArray(slide.leftContent) ? slide.leftContent.map(c => cleanSlideText(c)).filter(Boolean) : [];
        let rc = Array.isArray(slide.rightContent) ? slide.rightContent.map(c => cleanSlideText(c)).filter(Boolean) : [];
        if (lc.length === 0 && rc.length === 0) {
          if (content.length >= 2) {
            const mid = Math.ceil(content.length / 2);
            lc = content.slice(0, mid);
            rc = content.slice(mid);
          } else {
            lc = ['Klik untuk menambahkan konten kolom kiri.'];
            rc = ['Klik untuk menambahkan konten kolom kanan.'];
          }
        }
        inner = `<h2 class="slide-h2" style="margin-bottom:24px">${t}</h2>
<div class="two-col">
<div class="col-card col-left"><h3 class="col-title">${escapeHtml(cleanSlideText(slide.leftTitle||'Konsep A'))}</h3>${lc.map(i=>`<div class="col-item">${escapeHtml(i)}</div>`).join('')}</div>
<div class="col-card col-right"><h3 class="col-title">${escapeHtml(cleanSlideText(slide.rightTitle||'Konsep B'))}</h3>${rc.map(i=>`<div class="col-item">${escapeHtml(i)}</div>`).join('')}</div>
</div>`;
      } else if (layout === 'thankyou') {
        inner = `<div class="ty-wrap"><div class="ty-icon"><i class="fas fa-heart"></i></div>
<h1 class="ty-h1">Terima Kasih!</h1>
<p class="ty-msg">${escapeHtml(cleanSlideText(slide.message||'Semoga pembelajaran hari ini membawa manfaat.'))}</p></div>`;
      } else {
        // content / summary / activity / imageText / default
        if (content.length === 0) {
          content = ['Memahami materi utama secara mendalam dan terstruktur.'];
        }
        inner = `<div class="slide-header"><div class="slide-tag">${layout === 'summary' ? 'Rangkuman' : 'Materi Ajar'}</div><h2 class="slide-h2">${t}</h2></div>
<div class="content-list">
${content.map((item,i) => {
  const ci = item.indexOf(':');
  if (ci > 0 && ci < 40) {
    const lead = escapeHtml(item.substring(0, ci).trim());
    const body = escapeHtml(item.substring(ci+1).trim());
    return `<div class="content-card"><span class="content-num">${i+1}</span><div><span class="content-lead">${lead}:</span> <span class="content-body">${body}</span></div></div>`;
  }
  return `<div class="content-card"><span class="content-num">${i+1}</span><span class="content-body">${escapeHtml(item)}</span></div>`;
}).join('')}
</div>`;
      }

      const notesJson = JSON.stringify({ title: slide.title || '', script: notes, notes: [] });
      return `<div class="slide ${isActive}" data-slide="${idx}">\n${inner}\n<script type="application/json" class="slide-notes">${notesJson}<\/script>\n</div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="KKG SlideGen Studio 2.0 (html-slides compatible)">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Inter',sans-serif;background:#111}
.deck{width:100%;height:100vh;height:100dvh;position:relative}
.slide{display:none;width:100%;height:100vh;height:100dvh;overflow:hidden;position:relative;flex-direction:column;padding:clamp(24px,4vh,48px) clamp(24px,4vw,60px);background:${cs.background};color:${cs.text}}
.slide.active{display:flex}
.slide-header{margin-bottom:clamp(12px,2vh,24px)}
.slide-tag{font-size:clamp(9px,.7vw,11px);font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:${cs.primary};margin-bottom:6px}
.slide-h1{font-size:clamp(24px,4vw,52px);font-weight:900;color:${cs.primary};line-height:1.1;margin-bottom:12px}
.slide-h2{font-size:clamp(18px,2.4vw,36px);font-weight:800;color:${cs.primary};line-height:1.2}
.slide-sub{font-size:clamp(13px,1.2vw,20px);color:${cs.text};opacity:.8;margin-top:8px}
.rainbow-bar{height:3px;width:160px;margin-top:20px;background:linear-gradient(90deg,${cs.primary},${cs.accent},${cs.secondary});border-radius:9999px}
.title-inner{display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;z-index:10}
.title-icon{width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,${cs.primary},${cs.secondary});color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:20px;box-shadow:0 8px 32px ${cs.primary}60}
.glow-blob{position:absolute;border-radius:50%;pointer-events:none}
.gb1{top:-80px;left:-80px;width:300px;height:300px;background:radial-gradient(circle,${cs.primary}55 0%,transparent 70%)}
.gb2{bottom:-100px;right:-60px;width:360px;height:360px;background:radial-gradient(circle,${cs.accent}40 0%,transparent 70%)}
/* Content */
.content-list{display:flex;flex-direction:column;gap:10px;flex:1;justify-content:center}
.content-card{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;background:${cs.cardBg};border:1px solid ${cs.accent}30;border-radius:16px;font-size:clamp(11px,.9vw,15px)}
.content-num{min-width:28px;height:28px;border-radius:10px;background:${cs.primary};color:#fff;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center}
.content-lead{font-weight:700;color:${cs.primary}}
.content-body{color:${cs.text};opacity:.9}
/* Stats */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;flex:1;align-items:center}
.stat-card{padding:24px;background:${cs.cardBg};border:1px solid ${cs.accent}30;border-radius:24px;text-align:center}
.stat-val{font-size:clamp(28px,3.5vw,48px);font-weight:900;color:${cs.primary};margin-bottom:6px}
.stat-label{font-weight:700;font-size:14px;color:${cs.secondary};margin-bottom:4px}
.stat-desc{font-size:11px;opacity:.7;color:${cs.text}}
/* Timeline */
.timeline-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;flex:1;align-items:center}
.tl-card{padding:20px;background:${cs.cardBg};border:1px solid ${cs.accent}30;border-radius:20px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.tl-num{width:36px;height:36px;border-radius:12px;background:${cs.primary};color:#fff;font-weight:900;font-size:14px;display:flex;align-items:center;justify-content:center;margin-bottom:4px}
.tl-title{font-weight:700;font-size:13px;color:${cs.primary}}
.tl-desc{font-size:11px;opacity:.75;color:${cs.text};line-height:1.5}
/* Quiz */
.quiz-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
.quiz-opt{display:flex;align-items:center;gap:10px;padding:14px;background:${cs.cardBg};border:1px solid ${cs.accent}30;border-radius:16px;font-size:13px;color:${cs.text}}
.quiz-letter{width:30px;height:30px;border-radius:10px;background:${cs.secondary};color:#fff;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.quiz-key{font-size:11px;padding:10px 14px;background:${cs.accent}15;border:1px solid ${cs.accent}40;border-radius:12px;color:${cs.text}}
/* Flip Cards */
.flip-grid{display:grid;gap:14px;flex:1;min-height:0}
.flip-card{perspective:1000px;cursor:pointer;user-select:none}
.flip-inner{position:relative;width:100%;height:100%;transition:transform .55s cubic-bezier(.4,2,.6,1);transform-style:preserve-3d}
.flip-card.flipped .flip-inner{transform:rotateY(180deg)}
.flip-front,.flip-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}
.flip-front{background:${cs.cardBg};border:1.5px solid ${cs.primary}50}
.flip-back{transform:rotateY(180deg);background:linear-gradient(135deg,${cs.primary},${cs.secondary});color:#fff}
.flip-letter{width:36px;height:36px;border-radius:12px;background:${cs.primary};color:#fff;font-weight:900;font-size:14px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.flip-ft{font-weight:700;font-size:13px;color:${cs.primary}}
.flip-hint{font-size:9px;opacity:.4;margin-top:8px;letter-spacing:.1em;text-transform:uppercase;color:${cs.text}}
.flip-icon{font-size:24px;opacity:.6;margin-bottom:10px}
.flip-bk{font-size:12px;line-height:1.6;opacity:.95}
/* Two Column */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1}
.col-card{padding:20px;border-radius:24px;display:flex;flex-direction:column;gap:10px}
.col-left{background:${cs.cardBg};border:1.5px solid ${cs.primary}30}
.col-right{background:${cs.cardBg};border:1.5px solid ${cs.secondary}30}
.col-title{font-weight:800;font-size:15px;color:${cs.primary};margin-bottom:8px}
.col-item{font-size:12px;color:${cs.text};opacity:.85;padding-left:10px;border-left:3px solid ${cs.primary}40;margin-bottom:4px}
/* Quote */
.quote-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;padding:20px}
.quote-icon{font-size:clamp(32px,4vw,56px);opacity:.25;color:${cs.primary};margin-bottom:16px}
.slide-quote{font-size:clamp(16px,2.2vw,30px);font-weight:800;font-style:italic;color:${cs.primary};line-height:1.5;max-width:700px;margin-bottom:16px}
.quote-author{font-size:14px;opacity:.7;color:${cs.text}}
/* Thankyou */
.ty-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;background:linear-gradient(135deg,${cs.primary},${cs.secondary})}
.ty-icon{width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:30px;color:#fff;margin-bottom:20px}
.ty-h1{font-size:clamp(28px,4vw,52px);font-weight:900;color:#fff;margin-bottom:12px}
.ty-msg{font-size:clamp(13px,1.2vw,20px);color:rgba(255,255,255,.85);max-width:520px}
/* Nav */
.nav-bar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);backdrop-filter:blur(12px);border-radius:9999px;padding:8px 20px;display:flex;align-items:center;gap:16px;z-index:100}
.nav-btn{background:none;border:none;color:#fff;font-size:16px;cursor:pointer;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .2s}
.nav-btn:hover{background:rgba(255,255,255,.15)}
.nav-count{font-size:12px;color:rgba(255,255,255,.7);font-weight:600;min-width:60px;text-align:center}
.nav-layout{font-size:10px;color:${cs.primary};font-weight:700;text-transform:uppercase}
</style>
</head>
<body>
<div class="deck" id="deck">
${slidesHtml}
</div>
<div class="nav-bar">
  <button class="nav-btn" onclick="prev()" title="Sebelumnya (←)"><i class="fas fa-chevron-left"></i></button>
  <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
    <div class="nav-count" id="nav-count">1 / ${s.slides.length}</div>
    <div class="nav-layout" id="nav-layout">${s.slides[0]?.layout || 'title'}</div>
  </div>
  <button class="nav-btn" onclick="next()" title="Berikutnya (→)"><i class="fas fa-chevron-right"></i></button>
</div>
<script>
var current=0;var total=${s.slides.length};
function goTo(n){var slides=document.querySelectorAll('.slide');slides[current].classList.remove('active');current=Math.max(0,Math.min(n,total-1));slides[current].classList.add('active');document.getElementById('nav-count').textContent=(current+1)+' / '+total;document.getElementById('nav-layout').textContent=slides[current].dataset.slide!==undefined?(slides[current].getAttribute('data-layout')||'slide'):'';var notes=slides[current].querySelector('.slide-notes');if(notes){try{var d=JSON.parse(notes.textContent);if(d.script)console.log('[Slide '+(current+1)+'] '+d.script);}catch(e){}}}
function next(){goTo(current+1);}function prev(){goTo(current-1);}
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' ')next();if(e.key==='ArrowLeft')prev();if(e.key==='Escape')document.exitFullscreen&&document.exitFullscreen();if(e.key==='f'||e.key==='F')document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();});
// Set data-layout attributes
document.querySelectorAll('.slide').forEach(function(sl,i){sl.setAttribute('data-layout','${s.slides.map(sl=>sl.layout||'content').join("','")}' .split(',')[i]||'slide');});
<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title).replace(/[^a-zA-Z0-9]/g, '_')}_interaktif.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('🌐 HTML Interaktif berhasil didownload! Buka di browser, bagikan ke siswa.', 'success');
  } catch (err) {
    console.error('HTML export error:', err);
    showToast('Gagal mengekspor HTML Interaktif', 'error');
  } finally {
    hideLoading();
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function showAISettingsModal() {
  const modalContainer = document.getElementById('sg-modal-container');
  if (!modalContainer) return;

  const s = window.slideGenState;
  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-in">
        <div class="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <i class="fas fa-sliders-h text-lg"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white text-base">Parameter Model AI</h3>
              <p class="text-xs text-gray-500">Pilih engine AI aktif dan preferensi target slide</p>
            </div>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>

        <div class="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <!-- AI Model Provider Select -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <i class="fas fa-microchip text-teal-600 dark:text-teal-400"></i> Model / Engine AI
            </label>
            <select id="sg-modal-ai-provider" class="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-primary text-gray-800 dark:text-gray-200">
              <option value="">Memuat model AI...</option>
            </select>
            <p class="text-[11px] text-gray-400">Model aktif disinkronkan langsung dari Admin Panel (Prioritas & Kuota)</p>
          </div>

          <!-- Slide Count -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Target Jumlah Slide</label>
              <span id="sg-modal-count-display" class="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg">${s.config.slideCount || 8} Slide</span>
            </div>
            <input type="range" id="sg-modal-count" min="4" max="25" value="${s.config.slideCount || 8}" class="w-full accent-primary h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer">
            <div class="flex flex-wrap gap-1.5 pt-0.5" id="sg-modal-count-presets">
              ${[6, 8, 10, 12, 15, 20].map(cnt => `
                <button type="button" class="sg-modal-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${(s.config.slideCount || 8) === cnt ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}" data-count="${cnt}">
                  ${cnt} Slide ${cnt === 15 ? '⭐ Lengkap' : ''}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Extra Instructions / Tone -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <i class="fas fa-wand-magic-sparkles text-teal-600 dark:text-teal-400"></i> Catatan Gaya / Preferensi Khusus (Opsional)
            </label>
            <textarea id="sg-modal-extra-notes" rows="2" placeholder="Contoh: Gunakan bahasa ramah anak, perbanyak analogi visual dan kuis seru..." class="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-gray-800 dark:text-gray-200 resize-none">${escapeHtml(s.config.extraInstructions || '')}</textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-border-light dark:border-border-dark">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            Batal
          </button>
          <button id="sg-save-ai-settings" class="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-xs flex items-center gap-1.5 cursor-pointer">
            <i class="fas fa-check"></i> Simpan Parameter
          </button>
        </div>
      </div>
    </div>
  `;

  // Populate AI model select from active API
  const aiSelect = modalContainer.querySelector('#sg-modal-ai-provider');
  if (aiSelect) {
    populateAiModelSelect(aiSelect, s.config.aiProvider);
  }

  const countRange = modalContainer.querySelector('#sg-modal-count');
  const countDisp = modalContainer.querySelector('#sg-modal-count-display');
  if (countRange && countDisp) {
    countRange.addEventListener('input', e => {
      const val = parseInt(e.target.value);
      countDisp.textContent = `${val} Slide`;
      modalContainer.querySelectorAll('.sg-modal-preset-btn').forEach(b => {
        const bCount = parseInt(b.dataset.count);
        b.className = bCount === val
          ? 'sg-modal-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-teal-600 text-white shadow-sm ring-1 ring-teal-600'
          : 'sg-modal-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
      });
    });
  }

  modalContainer.querySelectorAll('.sg-modal-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cnt = parseInt(e.currentTarget.dataset.count) || 8;
      if (countRange) countRange.value = cnt;
      if (countDisp) countDisp.textContent = `${cnt} Slide`;
      modalContainer.querySelectorAll('.sg-modal-preset-btn').forEach(b => {
        b.className = 'sg-modal-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
      });
      e.currentTarget.className = 'sg-modal-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-teal-600 text-white shadow-sm ring-1 ring-teal-600';
    });
  });

  document.getElementById('sg-save-ai-settings').onclick = () => {
    if (aiSelect) s.config.aiProvider = aiSelect.value;
    const count = parseInt(countRange?.value) || 8;
    const extra = modalContainer.querySelector('#sg-modal-extra-notes')?.value.trim();

    s.config.slideCount = count;
    s.config.extraInstructions = extra;

    const landingSelect = document.getElementById('sg-landing-model-select');
    if (landingSelect && aiSelect) {
      landingSelect.value = aiSelect.value;
    }

    showToast('Parameter AI berhasil disimpan!', 'success');
    modalContainer.querySelector('.fixed')?.remove();
  };
}
