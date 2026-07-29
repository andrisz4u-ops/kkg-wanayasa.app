import { api } from '../api.js';
import { showToast, showLoading, hideLoading, escapeHtml } from '../utils.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';

// Slide Templates Collection
const slideTemplates = {
  educational: {
    name: 'Modern Edukasi',
    description: 'Desain bersih dengan warna cerah untuk anak-anak',
    colorSchemes: {
      blue: { primary: '1a5fb4', secondary: '3584e4', accent: '99c1f1', background: 'f6f8ff', text: '1e3a5f' },
      green: { primary: '26a269', secondary: '33d17a', accent: '8ff0a4', background: 'f0fff4', text: '1e4e3e' },
      purple: { primary: '613583', secondary: '9141ac', accent: 'dc8add', background: 'faf5ff', text: '3e1e5f' },
      royal: { primary: '1e3a5f', secondary: '2d5a87', accent: 'd4af37', background: 'f8f9fa', text: '1a1a2e' },
      emerald: { primary: '064e3b', secondary: '047857', accent: 'a7f3d0', background: 'f0fdf4', text: '064e3b' },
      rose: { primary: '9f1239', secondary: 'be123c', accent: 'fda4af', background: 'fff1f2', text: '881337' }
    }
  },
  minimalist: {
    name: 'Minimalis Profesional',
    description: 'Desain sederhana untuk presentasi formal',
    colorSchemes: {
      dark: { primary: '1a1a2e', secondary: '16213e', accent: '0f3460', background: 'e8e8e8', text: '1a1a2e' },
      light: { primary: '333333', secondary: '666666', accent: '999999', background: 'ffffff', text: '222222' }
    }
  },
  colorful: {
    name: 'Ceria & Interaktif',
    description: 'Warna-warni dan menyenangkan untuk pembelajaran aktif',
    colorSchemes: {
      rainbow: { primary: 'e74c3c', secondary: 'f39c12', accent: '3498db', background: 'fff5f5', text: '2c3e50' }
    }
  },
  // ═══ SUPER PREMIUM TEMPLATES ═══
  aurora: {
    name: 'Aurora Borealis',
    description: 'Gradien kosmik terinspirasi cahaya utara yang memukau',
    colorSchemes: {
      cosmic: { primary: '0d1b2a', secondary: '1b263b', accent: '00f5d4', background: '0a192f', text: 'e0fbfc' }
    }
  },
  sunset: {
    name: 'Sunset Academia',
    description: 'Gradient hangat senja untuk suasana belajar yang nyaman',
    colorSchemes: {
      warm: { primary: '6b2737', secondary: 'c2185b', accent: 'ff6f61', background: 'fff8f0', text: '3e2723' }
    }
  },
  ocean: {
    name: 'Ocean Deep',
    description: 'Kedalaman samudra dengan aksen bioluminescent',
    colorSchemes: {
      deep: { primary: '023e8a', secondary: '0077b6', accent: '00b4d8', background: 'caf0f8', text: '03045e' }
    }
  },
  sakura: {
    name: 'Neon Sakura',
    description: 'Perpaduan bunga sakura dengan sentuhan neon futuristik',
    colorSchemes: {
      bloom: { primary: '2d0036', secondary: '7b2d8e', accent: 'ff6ec7', background: 'fdf2f8', text: '3b0764' }
    }
  },
  golden: {
    name: 'Golden Hour',
    description: 'Kemewahan emas dengan kontras gelap yang elegan',
    colorSchemes: {
      luxury: { primary: '1a1a2e', secondary: '2d2d44', accent: 'f0c27f', background: 'fefdf5', text: '1a1a2e' }
    }
  }
};

// Slide Layout Types
const slideLayouts = [
  { id: 'title', name: 'Judul', icon: 'fa-heading', description: 'Slide pembuka dengan judul dan subtitle' },
  { id: 'content', name: 'Konten', icon: 'fa-list', description: 'Judul dengan poin-poin utama' },
  { id: 'twoColumn', name: 'Dua Kolom', icon: 'fa-columns', description: 'Dua kolom untuk perbandingan' },
  { id: 'imageText', name: 'Gambar + Teks', icon: 'fa-image', description: 'Gambar dengan penjelasan' },
  { id: 'quote', name: 'Kutipan', icon: 'fa-quote-left', description: 'Quote atau definisi penting' },
  { id: 'list', name: 'Daftar', icon: 'fa-list-ul', description: 'Daftar item dengan ikon' },
  { id: 'process', name: 'Proses', icon: 'fa-arrow-right', description: 'Langkah-langkah berurutan' },
  { id: 'comparison', name: 'Perbandingan', icon: 'fa-balance-scale', description: 'Perbandingan dua hal' },
  { id: 'summary', name: 'Rangkuman', icon: 'fa-clipboard-list', description: 'Poin-poin kunci akhir' },
  { id: 'activity', name: 'Aktivitas', icon: 'fa-tasks', description: 'Instruksi aktivitas siswa' },
  { id: 'question', name: 'Pertanyaan', icon: 'fa-question-circle', description: 'Pertanyaan diskusi atau kuis' },
  { id: 'thankyou', name: 'Penutup', icon: 'fa-hand-paper', description: 'Slide terima kasih' }
];

export async function renderSlide() {
  if (!state.user) {
    return renderLockedFeature(
      'SlideGen AI Profesional',
      'Buat presentasi pembelajaran premium dalam hitungan detik. Fitur ini dirancang khusus untuk menghasilkan media ajar visual yang elegan dan berbobot secara otomatis menggunakan AI.',
      [
        'Instant outlines, automated design, smart delivery',
        '12+ Template Premium (Minimalis, Bold & Corporate)',
        'Ekspor ke PowerPoint (PPTX) Resolusi Tinggi',
        'Materi disesuaikan dengan Kurikulum Merdeka',
        'Pratinjau Animasi dengan Glassmorphism Panel',
        'Catatan Pembicara Lengkap untuk Guru'
      ]
    );
  }

  // Initialize View State locally
  window.slideGenState = {
    view: 'landing', // 'landing', 'gallery', 'editor'
    prompt: '',
    template: 'minimalist-dark', // Default
    slides: [],
    currentIndex: 0,
    config: {
      mataPelajaran: '',
      topik: '',
      jenjangKelas: '',
      semester: '1',
      strategi: 'Problem Based Learning',
      alokasiWaktu: '2 x 35 Menit',
      slideCount: 10,
      aiProvider: 'mistral'
    }
  };

  return `
    <div id="slidegen-root" class="w-full flex flex-col font-body transition-colors duration-300 min-h-[calc(100vh-80px)] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div id="slidegen-container" class="w-full h-full flex flex-col flex-grow">
        ${renderLandingView()}
      </div>
      <!-- Modal Container -->
      <div id="sg-modal-container"></div>
    </div>
  `;
}

// ==========================================
// VIEW RENDERING FUNCTIONS
// ==========================================

function renderLandingView() {
  return `
    <main class="flex-grow flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden h-full">
      <!-- Background Graphic -->
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] -z-10 pointer-events-none opacity-5 dark:opacity-10">
        <svg height="600" viewBox="0 0 200 200" width="600" xmlns="http://www.w3.org/2000/svg">
          <path class="text-gray-900 dark:text-white" d="M40 40 L160 40 L40 160 L160 160" fill="none" stroke="currentColor" stroke-width="1"></path>
        </svg>
      </div>
      
      <div class="text-center mb-12 animate-fade-in-up">
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-4 text-gray-900 dark:text-white font-display">
          Hi, I'm SlideGen AI
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
          Interact with SlideGen to create stunning presentations and explore boundless creative layouts.
        </p>
      </div>

      <!-- Main Input Bar -->
      <div class="w-full max-w-3xl mb-12 animate-slide-up" style="animation-delay: 100ms;">
        <div class="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] p-1 transition-all duration-300 focus-within:ring-2 focus-within:ring-gray-200 dark:focus-within:ring-gray-700">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Chat: Instant outlines, automated design, smart delivery</span>
          </div>
          <div class="p-4">
            <textarea id="sg-main-prompt" class="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none h-24 text-gray-800 dark:text-gray-100" placeholder="Apa topik presentasi pembelajaran Anda hari ini? (Misal: Tata Surya, IPAS Kelas 6)"></textarea>
          </div>
          <div class="px-4 py-3 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" title="Upload Referensi">
                <i class="fas fa-paperclip"></i>
              </button>
              <button id="sg-btn-settings" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" title="Pengaturan AI">
                <i class="fas fa-sliders-h"></i>
              </button>
            </div>
            <div class="flex items-center space-x-3">
              <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex text-sm hidden sm:flex">
                <button class="px-3 py-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Outline</button>
                <button class="px-3 py-1 rounded bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white font-medium">Auto-Design</button>
              </div>
              <button id="sg-btn-next-gallery" class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-lg p-3 hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors flex items-center justify-center">
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Topics -->
      <div class="flex flex-wrap justify-center gap-3 mb-10 max-w-4xl px-4 animate-slide-up" style="animation-delay: 200ms;">
        <button class="sg-quick-btn px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium">Bumi & Antariksa (IPA)</button>
        <button class="sg-quick-btn px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium">Perubahan Sosial (IPS)</button>
        <button class="sg-quick-btn px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium">Pecahan & Desimal (Matematika)</button>
        <button class="sg-quick-btn px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium">Laporan Observasi (Bahasa)</button>
      </div>
    </main>
  `;
}

function renderGalleryView() {
  return `
    <div class="flex flex-1 h-full overflow-hidden animate-fade-in">
      <!-- Sidebar Filters -->
      <aside class="w-64 border-r border-border-light dark:border-border-dark p-6 overflow-y-auto hidden md:block bg-surface-light dark:bg-surface-dark shrink-0">
        <div class="mb-6 flex items-center gap-3 cursor-pointer group" onclick="window.slidgenGoTo('landing')">
          <i class="fas fa-arrow-left text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"></i>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Kembali</span>
        </div>
        
        <div class="mb-8">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Style Setup</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="sg-style" value="all" checked class="rounded-full border-gray-300 text-gray-900 focus:ring-gray-900 bg-transparent">
              <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Semua Style</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="sg-style" value="minimalist" class="rounded-full border-gray-300 text-gray-900 focus:ring-gray-900 bg-transparent">
              <span class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Minimalist</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="sg-style" value="bold" class="rounded-full border-gray-300 text-gray-900 focus:ring-gray-900 bg-transparent">
              <span class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Bold & Vibrant</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="sg-style" value="corporate" class="rounded-full border-gray-300 text-gray-900 focus:ring-gray-900 bg-transparent">
              <span class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Corporate / Formal</span>
            </label>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pengaturan AI</h3>
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-xs text-gray-500">Mata Pelajaran</label>
              <input type="text" id="sg-input-mapel" value="IPA" class="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-700 py-1 focus:outline-none focus:border-gray-900 dark:focus:border-white">
            </div>
            <div class="space-y-2">
               <label class="block text-xs text-gray-500">Kelas / Semester</label>
               <input type="text" id="sg-input-kelas" value="Kelas 6 Smt 1" class="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-700 py-1 focus:outline-none focus:border-gray-900 dark:focus:border-white">
            </div>
            <div class="space-y-2">
              <label class="block text-xs text-gray-500">Jumlah Slide</label>
              <div class="flex items-center gap-3">
                <input type="range" id="sg-input-count" min="5" max="20" value="10" class="flex-1 accent-gray-900 dark:accent-white h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                <span id="sg-count-val" class="text-xs font-medium w-6 text-center">10</span>
              </div>
            </div>
            <div class="space-y-2 pt-2">
              <label class="block text-xs text-gray-500">AI Engine</label>
              <select id="sg-input-engine" class="w-full text-sm bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-700 rounded-md py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900">
                <option value="mistral">Mistral Large (Formal)</option>
                <option value="z_ai">GLM-4.7 Flash (Cepat)</option>
                <option value="gemini">Gemini 2 (Smart)</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Gallery Area -->
      <main class="flex-1 overflow-y-auto p-8 relative">
        <div class="max-w-6xl mx-auto mb-10">
          <div class="text-center mb-10">
            <h1 class="text-4xl font-display font-medium mb-3 text-gray-900 dark:text-white">Choose your canvas</h1>
            <p class="text-gray-500 dark:text-gray-400 font-light text-lg">Pilih template presentasi untuk topik: <strong id="sg-display-topic" class="text-gray-800 dark:text-gray-200 font-medium"></strong></p>
          </div>
        </div>

        <!-- Template Grid -->
        <div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
          
          <!-- Template 1: Dark Elegance -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 overflow-hidden cursor-pointer" data-id="minimalist-dark">
            <div class="aspect-[4/3] bg-gray-900 relative overflow-hidden flex flex-col p-6">
              <div class="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"></div>
              <div class="relative z-10 flex-1 flex flex-col justify-center items-center text-center transform transition-transform duration-500 group-hover:scale-105">
                <div class="text-white text-[10px] opacity-60 mb-3 uppercase tracking-[0.2em] font-sans">Presentasi Edukasi</div>
                <div class="w-3/4 h-6 bg-white/10 rounded mb-3 backdrop-blur-sm border border-white/5"></div>
                <div class="w-1/2 h-2 bg-white/20 rounded"></div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors duration-300 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Dark Elegance</h3>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">Premium</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">High contrast dark theme berkelas</p>
            </div>
          </div>

          <!-- Template 2: Flow Edukasi -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 overflow-hidden cursor-pointer" data-id="educational-blue">
            <div class="aspect-[4/3] bg-blue-50 relative overflow-hidden flex flex-col p-6">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/40 z-0"></div>
              <div class="relative z-10 flex-1 flex flex-col justify-center transform transition-transform duration-500 group-hover:scale-105">
                <div class="w-12 h-12 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-4 flex items-center justify-center"></div>
                <div class="w-4/5 h-8 bg-blue-900/10 dark:bg-white/10 rounded mb-3"></div>
                <div class="w-1/2 h-3 bg-blue-900/5 dark:bg-white/5 rounded"></div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-blue-600/5 transition-colors duration-300 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Modern Flow</h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">Populer</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Aksen biru cerah untuk materi eksak/formal</p>
            </div>
          </div>

          <!-- Template 3: Minimal Light -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden cursor-pointer" data-id="minimalist-light">
            <div class="aspect-[4/3] bg-white relative overflow-hidden p-6 flex flex-col justify-center">
              <div class="absolute inset-0 bg-[#fafafa] dark:bg-[#1a1a1a] z-0"></div>
              <div class="relative z-10 flex flex-col transform transition-transform duration-500 group-hover:scale-105 border-l-4 border-gray-800 dark:border-gray-300 pl-6 py-2">
                <div class="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div class="w-2/3 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div class="absolute right-6 bottom-6 w-16 h-16 rounded-full border border-gray-200 dark:border-gray-700"></div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-300 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Neo Clean</h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Desain sangat bersih fokus pada konten</p>
            </div>
          </div>
          
          <!-- Template 4: Vibrant Creative -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 overflow-hidden cursor-pointer" data-id="colorful-rainbow">
            <div class="aspect-[4/3] relative overflow-hidden p-6 flex flex-col justify-between">
              <div class="absolute inset-0 bg-orange-50 dark:bg-[#2a170e] z-0"></div>
              <div class="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-bl-full opacity-80 z-0"></div>
              <div class="absolute bottom-0 left-0 w-24 h-24 bg-rose-500 rounded-tr-full opacity-60 z-0"></div>
              <div class="relative z-10 mt-10">
                <div class="w-3/4 h-8 bg-white/60 dark:bg-black/20 backdrop-blur rounded mb-3 shadow-sm"></div>
                <div class="w-1/2 h-3 bg-white/40 dark:bg-black/20 backdrop-blur rounded"></div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-300 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Vibrant Creative</h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Warna warni untuk siswa SD / TK</p>
            </div>
          </div>

          <!-- ═══════════════════ SUPER PREMIUM SECTION ═══════════════════ -->
          <div class="col-span-1 sm:col-span-2 lg:col-span-3 mt-4 mb-2">
            <div class="flex items-center gap-3">
              <div class="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
              <span class="text-xs font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-amber-500 to-yellow-400 text-transparent bg-clip-text flex items-center gap-2">
                <i class="fas fa-crown text-amber-400"></i>
                Super Premium Collection
                <i class="fas fa-crown text-amber-400"></i>
              </span>
              <div class="h-px flex-1 bg-gradient-to-l from-transparent via-amber-400/60 to-transparent"></div>
            </div>
          </div>

          <!-- Template 5: Aurora Borealis -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-[0_8px_30px_rgba(0,245,212,0.2)] hover:border-teal-400/50 transition-all duration-500 overflow-hidden cursor-pointer" data-id="aurora-cosmic">
            <div class="aspect-[4/3] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-[#0d1b2a] via-[#1b263b] to-[#0a192f] z-0"></div>
              <!-- Aurora glow effects -->
              <div class="absolute top-0 left-1/4 w-48 h-24 bg-gradient-to-r from-teal-500/40 via-cyan-400/30 to-emerald-500/40 blur-2xl rounded-full transform -rotate-12 animate-pulse z-0"></div>
              <div class="absolute top-8 right-1/4 w-36 h-20 bg-gradient-to-r from-purple-500/30 via-pink-400/20 to-blue-500/30 blur-2xl rounded-full transform rotate-6 z-0" style="animation: pulse 3s ease-in-out infinite 1s;"></div>
              <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a192f] to-transparent z-0"></div>
              <!-- Stars -->
              <div class="absolute top-4 left-6 w-1 h-1 bg-white rounded-full opacity-60"></div>
              <div class="absolute top-8 right-12 w-1.5 h-1.5 bg-cyan-300 rounded-full opacity-50"></div>
              <div class="absolute top-16 left-1/3 w-1 h-1 bg-white rounded-full opacity-40"></div>
              <div class="relative z-10 flex-1 flex flex-col justify-end p-6 h-full">
                <div class="transform transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                  <div class="text-[10px] text-teal-300/80 uppercase tracking-[0.3em] mb-2 font-medium">✦ Super Premium</div>
                  <div class="w-3/4 h-7 bg-white/10 rounded-md mb-2 backdrop-blur-sm border border-white/5"></div>
                  <div class="w-1/2 h-2.5 bg-teal-400/20 rounded"></div>
                </div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-teal-500/5 transition-colors duration-500 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Aurora Borealis</h3>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 text-white uppercase tracking-wider shadow-md">✦ Super</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Gradien kosmik terinspirasi cahaya utara</p>
            </div>
          </div>

          <!-- Template 6: Sunset Academia -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-[0_8px_30px_rgba(255,111,97,0.2)] hover:border-rose-400/50 transition-all duration-500 overflow-hidden cursor-pointer" data-id="sunset-warm">
            <div class="aspect-[4/3] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-[#fff8f0] via-[#ffe8d6] to-[#ffd7ba] dark:from-[#2a1f1a] dark:via-[#3e2723] dark:to-[#4a1c1c] z-0"></div>
              <!-- Sunset circular glow -->
              <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-gradient-to-t from-orange-400/60 via-rose-400/40 to-transparent rounded-full blur-xl z-0"></div>
              <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-rose-900/20 to-transparent z-0"></div>
              <!-- Decorative horizon lines -->
              <div class="absolute bottom-12 left-6 right-6 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent"></div>
              <div class="relative z-10 flex-1 flex flex-col justify-center p-6 h-full items-start">
                <div class="transform transition-transform duration-500 group-hover:scale-105">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-rose-500/30 mb-4 flex items-center justify-center"><i class="fas fa-sun text-white text-xs"></i></div>
                  <div class="w-4/5 h-7 bg-rose-900/10 dark:bg-white/10 rounded-md mb-3"></div>
                  <div class="w-2/3 h-2.5 bg-rose-900/5 dark:bg-white/5 rounded"></div>
                </div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-rose-500/5 transition-colors duration-500 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Sunset Academia</h3>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white uppercase tracking-wider shadow-md">✦ Super</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Gradient hangat senja yang nyaman & berkesan</p>
            </div>
          </div>

          <!-- Template 7: Ocean Deep -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-[0_8px_30px_rgba(0,180,216,0.2)] hover:border-sky-400/50 transition-all duration-500 overflow-hidden cursor-pointer" data-id="ocean-deep">
            <div class="aspect-[4/3] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-b from-[#caf0f8] via-[#ade8f4] to-[#023e8a] dark:from-[#023e8a] dark:via-[#0077b6] dark:to-[#03045e] z-0"></div>
              <!-- Water surface light rays -->
              <div class="absolute top-0 left-1/4 w-3 h-32 bg-white/10 blur-sm transform -rotate-12 z-0"></div>
              <div class="absolute top-0 right-1/3 w-2 h-28 bg-white/10 blur-sm transform rotate-6 z-0"></div>
              <!-- Bioluminescent dots -->
              <div class="absolute bottom-8 left-8 w-2 h-2 bg-cyan-300 rounded-full opacity-60 animate-pulse"></div>
              <div class="absolute bottom-14 right-12 w-1.5 h-1.5 bg-sky-200 rounded-full opacity-50" style="animation: pulse 2s ease-in-out infinite 0.5s;"></div>
              <div class="absolute bottom-20 left-1/3 w-2.5 h-2.5 bg-teal-300 rounded-full opacity-40" style="animation: pulse 2.5s ease-in-out infinite 1s;"></div>
              <!-- Bubbles -->
              <div class="absolute bottom-4 left-1/4 w-3 h-3 rounded-full border border-white/20 z-0"></div>
              <div class="absolute bottom-8 right-1/4 w-2 h-2 rounded-full border border-white/15 z-0"></div>
              <div class="relative z-10 flex-1 flex flex-col justify-center items-center p-6 h-full text-center">
                <div class="transform transition-transform duration-500 group-hover:scale-105">
                  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-500/30 mb-4 flex items-center justify-center mx-auto"><i class="fas fa-water text-white text-lg"></i></div>
                  <div class="w-40 h-6 bg-blue-900/10 dark:bg-white/10 rounded-md mb-2 mx-auto"></div>
                  <div class="w-24 h-2 bg-blue-900/5 dark:bg-white/5 rounded mx-auto"></div>
                </div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-cyan-500/5 transition-colors duration-500 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Ocean Deep</h3>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white uppercase tracking-wider shadow-md">✦ Super</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Kedalaman samudra dengan aksen bioluminescent</p>
            </div>
          </div>

          <!-- Template 8: Neon Sakura -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-[0_8px_30px_rgba(255,110,199,0.2)] hover:border-pink-400/50 transition-all duration-500 overflow-hidden cursor-pointer" data-id="sakura-bloom">
            <div class="aspect-[4/3] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-[#fdf2f8] via-[#fce7f3] to-[#f5d0fe] dark:from-[#2d0036] dark:via-[#3b0764] dark:to-[#1a0025] z-0"></div>
              <!-- Neon glow streaks -->
              <div class="absolute top-6 right-0 w-32 h-1 bg-gradient-to-l from-pink-500/60 via-fuchsia-400/40 to-transparent blur-sm z-0"></div>
              <div class="absolute top-12 right-4 w-24 h-1 bg-gradient-to-l from-purple-500/40 via-pink-400/30 to-transparent blur-sm z-0"></div>
              <!-- Sakura petals -->
              <div class="absolute top-4 left-8 w-3 h-3 bg-pink-300/50 rounded-full transform rotate-45 scale-x-50 z-0"></div>
              <div class="absolute top-16 right-8 w-2.5 h-2.5 bg-rose-300/40 rounded-full transform -rotate-12 scale-x-50 z-0"></div>
              <div class="absolute bottom-12 left-12 w-2 h-2 bg-pink-400/30 rounded-full transform rotate-30 scale-x-50 z-0"></div>
              <!-- Branch silhouette -->
              <div class="absolute bottom-0 left-0 w-28 h-24 z-0 opacity-10">
                <div class="absolute bottom-0 left-4 w-1 h-20 bg-gray-800 dark:bg-white transform -rotate-12"></div>
                <div class="absolute bottom-12 left-6 w-1 h-12 bg-gray-800 dark:bg-white transform rotate-30"></div>
              </div>
              <div class="relative z-10 flex-1 flex flex-col justify-center p-6 h-full">
                <div class="transform transition-transform duration-500 group-hover:scale-105">
                  <div class="text-[10px] text-fuchsia-400/80 dark:text-pink-300/80 uppercase tracking-[0.2em] mb-3 font-medium">ネオン桜 • Neon Sakura</div>
                  <div class="w-3/4 h-7 bg-purple-900/8 dark:bg-white/10 rounded-md mb-2 border border-pink-200/30 dark:border-pink-500/20"></div>
                  <div class="w-1/2 h-2.5 bg-purple-900/5 dark:bg-white/5 rounded"></div>
                </div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-pink-500/5 transition-colors duration-500 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Neon Sakura</h3>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white uppercase tracking-wider shadow-md">✦ Super</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Bunga sakura dengan sentuhan neon futuristik</p>
            </div>
          </div>

          <!-- Template 9: Golden Hour -->
          <div class="sg-template-card group relative bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark hover:shadow-[0_8px_30px_rgba(240,194,127,0.25)] hover:border-amber-400/50 transition-all duration-500 overflow-hidden cursor-pointer" data-id="golden-luxury">
            <div class="aspect-[4/3] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#2d2d44] to-[#16213e] z-0"></div>
              <!-- Gold diagonal accent -->
              <div class="absolute -top-4 -right-4 w-40 h-40 bg-gradient-to-br from-amber-400/20 via-yellow-300/10 to-transparent blur-md z-0"></div>
              <!-- Gold border accent lines -->
              <div class="absolute top-4 left-4 right-4 h-px bg-gradient-to-r from-amber-500/40 via-yellow-300/60 to-amber-500/40"></div>
              <div class="absolute bottom-4 left-4 right-4 h-px bg-gradient-to-r from-amber-500/40 via-yellow-300/60 to-amber-500/40"></div>
              <div class="absolute top-4 left-4 w-px h-[calc(100%-32px)] bg-gradient-to-b from-amber-500/40 via-yellow-300/60 to-amber-500/40"></div>
              <div class="absolute top-4 right-4 w-px h-[calc(100%-32px)] bg-gradient-to-b from-amber-500/40 via-yellow-300/60 to-amber-500/40"></div>
              <!-- Corner ornaments -->
              <div class="absolute top-3 left-3 w-3 h-3 border-t border-l border-amber-400/60"></div>
              <div class="absolute top-3 right-3 w-3 h-3 border-t border-r border-amber-400/60"></div>
              <div class="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-amber-400/60"></div>
              <div class="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-amber-400/60"></div>
              <div class="relative z-10 flex-1 flex flex-col justify-center items-center p-6 h-full text-center">
                <div class="transform transition-transform duration-500 group-hover:scale-105">
                  <div class="text-[10px] text-amber-400/80 uppercase tracking-[0.4em] mb-3 font-medium">✦ LUXURY ✦</div>
                  <div class="w-48 h-7 bg-white/5 rounded-md mb-2 border border-amber-400/20"></div>
                  <div class="w-32 h-2.5 bg-amber-400/10 rounded mx-auto"></div>
                </div>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-amber-500/5 transition-colors duration-500 z-20"></div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Golden Hour</h3>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 uppercase tracking-wider shadow-md">✦ Super</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">Kemewahan emas dengan kontras gelap yang elegan</p>
            </div>
          </div>

        </div>

        <!-- Sticky Floating Button -->
        <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 lg:ml-32 z-40 max-w-xl w-full px-4 animate-slide-up">
          <div class="bg-white/90 dark:bg-card-dark/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-sm text-gray-600 dark:text-gray-300 font-medium px-2">
              Template: <span id="sg-display-template" class="font-bold text-gray-900 dark:text-white">Belum dipilih</span>
            </div>
            <button id="sg-btn-generate" class="w-full sm:w-auto px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center opacity-50 cursor-not-allowed" disabled>
              <i class="fas fa-magic mr-2"></i>Generate AI Slide
            </button>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderEditorView() {
  return `
    <div class="flex flex-1 h-full overflow-hidden flex-col bg-gray-100 dark:bg-[#0a0a0a] animate-fade-in relative">
      
      <!-- Top Toolbar Editor -->
      <header class="h-14 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 z-20 shrink-0">
        <div class="flex items-center space-x-4">
          <div class="flex items-center cursor-pointer group" onclick="window.slidgenGoTo('landing')">
            <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors mr-3">
              <i class="fas fa-home"></i>
            </div>
          </div>
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
          <div class="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px] md:max-w-md" id="sg-editor-title">
            AI Presentation
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Tersimpan</span>
        </div>
        
        <div class="flex items-center space-x-3">
          <button id="sg-btn-export" class="flex items-center px-4 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow hover:opacity-90 focus:outline-none transition-opacity">
            <i class="fas fa-download text-xs mr-2"></i>Export PPTX
          </button>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden relative">
        <!-- Center Canvas -->
        <main class="flex-1 overflow-hidden flex flex-col relative">
          <!-- Slide Preview Area -->
          <div class="flex-1 overflow-auto flex justify-center items-center p-4 md:p-8 bg-dots-pattern relative" id="sg-canvas-container">
            <!-- Dotted Background -->
            <div class="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10" style="background-image: radial-gradient(#6B7280 1px, transparent 1px); background-size: 24px 24px;"></div>
            
            <button id="sg-prev-slide" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all z-10 shrink-0">
               <i class="fas fa-chevron-left"></i>
            </button>
            <button id="sg-next-slide" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all z-10 shrink-0">
               <i class="fas fa-chevron-right"></i>
            </button>

            <!-- Slide Aspect Ratio Container -->
            <div class="w-full max-w-4xl aspect-[16/9] bg-white shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-black/5 dark:ring-white/10 flex flex-col transition-transform duration-300" id="sg-slide-render-area">
               <!-- Slide Content Generated Here -->
            </div>
            
            <!-- Floating Navigation Info -->
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <span id="sg-slide-counter">Slide 1 / 10</span>
              <div class="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
              <span id="sg-slide-layout-name" class="uppercase">Layout</span>
            </div>
          </div>

          <!-- Bottom Panel: Thumbnails & Notes -->
          <div class="h-48 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark flex flex-col shrink-0 relative transition-transform duration-300">
            <!-- Tabs -->
            <div class="flex border-b border-border-light dark:border-border-dark px-2">
               <button class="px-4 py-2 text-xs font-semibold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white">Thumbnails</button>
               <button class="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 border-b-2 border-transparent">Speaker Notes</button>
            </div>
            
            <div class="flex-1 flex w-full h-full overflow-hidden">
                <!-- Thumbnails Scroll Area -->
                <div class="flex-1 overflow-x-auto overflow-y-hidden p-3 flex gap-3 items-center no-scrollbar" id="sg-thumbnails-container">
                    <!-- Thumbnails generated here -->
                </div>
                <!-- Speaker Notes Panel -->
                <div class="w-96 border-l border-border-light dark:border-border-dark p-3 overflow-y-auto hidden sm:block bg-gray-50 dark:bg-gray-900/50">
                    <h4 class="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center"><i class="fas fa-comment-alt mr-1"></i> Catatan Pembicara</h4>
                    <p id="sg-speaker-notes-display" class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                      Catatan akan muncul di sini.
                    </p>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;
}


function getColorScheme(template) {
  const schemes = {
    'educational-blue': { primary: '#1a5fb4', secondary: '#3584e4', accent: '#99c1f1', background: '#f6f8ff', text: '#1e3a5f' },
    'educational-green': { primary: '#26a269', secondary: '#33d17a', accent: '#8ff0a4', background: '#f0fff4', text: '#1e4e3e' },
    'educational-purple': { primary: '#613583', secondary: '#9141ac', accent: '#dc8add', background: '#faf5ff', text: '#3e1e5f' },
    'educational-royal': { primary: '#1e3a5f', secondary: '#2d5a87', accent: '#d4af37', background: '#f8f9fa', text: '#1a1a2e' },
    'educational-emerald': { primary: '#064e3b', secondary: '#047857', accent: '#a7f3d0', background: '#f0fdf4', text: '#064e3b' },
    'educational-rose': { primary: '#9f1239', secondary: '#be123c', accent: '#fda4af', background: '#fff1f2', text: '#881337' },
    'minimalist-light': { primary: '#333333', secondary: '#666666', accent: '#999999', background: '#ffffff', text: '#222222' },
    'minimalist-dark': { primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', background: '#e8e8e8', text: '#1a1a2e' },
    'colorful-rainbow': { primary: '#e74c3c', secondary: '#f39c12', accent: '#3498db', background: '#fff5f5', text: '#2c3e50' },
    // Super Premium Templates
    'aurora-cosmic': { primary: '#0d1b2a', secondary: '#1b263b', accent: '#00f5d4', background: '#0a192f', text: '#e0fbfc' },
    'sunset-warm': { primary: '#6b2737', secondary: '#c2185b', accent: '#ff6f61', background: '#fff8f0', text: '#3e2723' },
    'ocean-deep': { primary: '#023e8a', secondary: '#0077b6', accent: '#00b4d8', background: '#caf0f8', text: '#03045e' },
    'sakura-bloom': { primary: '#2d0036', secondary: '#7b2d8e', accent: '#ff6ec7', background: '#fdf2f8', text: '#3b0764' },
    'golden-luxury': { primary: '#1a1a2e', secondary: '#2d2d44', accent: '#f0c27f', background: '#fefdf5', text: '#1a1a2e' }
  };
  return schemes[template] || schemes['educational-blue'];
}

// Generate slide preview HTML
function generateSlideHTML(slide, index, colorScheme) {
  const layout = slide.layout || 'content';
  const title = escapeHtml(slide.title || 'Judul Slide');
  let content = slide.content || [];
  if (content && !Array.isArray(content)) content = [String(content)];

  let leftContent = slide.leftContent || [];
  if (leftContent && !Array.isArray(leftContent)) leftContent = [String(leftContent)];

  let rightContent = slide.rightContent || [];
  if (rightContent && !Array.isArray(rightContent)) rightContent = [String(rightContent)];

  const speakerNotes = escapeHtml(slide.speakerNotes || '');
  const hasImage = Boolean(slide.image?.url);
  const imageHtml = hasImage
    ? `
      <figure class="rounded-2xl overflow-hidden border border-black/5 bg-white shadow-sm">
        <img src="${escapeHtml(slide.image.url)}" alt="${escapeHtml(slide.image.alt || title)}" class="w-full h-64 object-cover" loading="lazy" referrerpolicy="no-referrer" />
        <figcaption class="px-3 py-2 text-xs" style="color: ${colorScheme.text}; background: ${colorScheme.background};">
          Foto: <a href="${escapeHtml(slide.image.creditUrl || '#')}" target="_blank" rel="noopener noreferrer" class="underline">${escapeHtml(slide.image.creditName || 'Unsplash')}</a> via Unsplash
        </figcaption>
      </figure>
    `
    : '';

  const layouts = {
    title: `
      <div class="text-center w-full h-full flex flex-col items-center justify-center" style="background: linear-gradient(135deg, ${colorScheme.background} 0%, ${colorScheme.accent}40 100%);">
        <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style="background: linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary});">
          <i class="fas fa-book-open text-3xl text-white"></i>
        </div>
        <h1 class="text-5xl font-bold mb-4" style="color: ${colorScheme.primary};">${title}</h1>
        <p class="text-2xl opacity-80" style="color: ${colorScheme.text};">${escapeHtml(slide.subtitle || '')}</p>
      </div>
    `,
    content: `
      <div class="w-full h-full p-12" style="background: ${colorScheme.background};">
        <h2 class="text-4xl font-bold mb-8 pb-4" style="color: ${colorScheme.primary}; border-bottom: 4px solid ${colorScheme.accent};">${title}</h2>
        <div class="${hasImage ? 'grid grid-cols-5 gap-6 items-start' : ''}">
          <ul class="space-y-4 ${hasImage ? 'col-span-3' : ''}">
            ${content.map((item, i) => `
              <li class="flex items-start gap-4 text-xl" style="color: ${colorScheme.text};">
                <span class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shrink-0" style="background: ${colorScheme.secondary};">${i + 1}</span>
                <span>${escapeHtml(item)}</span>
              </li>
            `).join('')}
          </ul>
          ${hasImage ? `<div class="col-span-2">${imageHtml}</div>` : ''}
        </div>
      </div>
    `,
    imageText: `
      <div class="w-full h-full p-10" style="background: ${colorScheme.background};">
        <h2 class="text-4xl font-bold mb-6" style="color: ${colorScheme.primary};">${title}</h2>
        <div class="grid grid-cols-2 gap-8 h-[calc(100%-90px)] items-start">
          <div class="space-y-4">
            ${content.map((item, i) => `
              <div class="flex items-start gap-3 text-xl" style="color: ${colorScheme.text};">
                <span class="w-8 h-8 mt-0.5 rounded-full flex items-center justify-center text-white font-bold shrink-0" style="background: ${colorScheme.secondary};">${i + 1}</span>
                <span>${escapeHtml(item)}</span>
              </div>
            `).join('')}
          </div>
          <div>
            ${imageHtml || `<div class="rounded-2xl border-2 border-dashed h-72 flex items-center justify-center" style="border-color:${colorScheme.accent}; color:${colorScheme.text};">Gambar tidak tersedia</div>`}
          </div>
        </div>
      </div>
    `,
    twoColumn: `
      <div class="w-full h-full p-8" style="background: ${colorScheme.background};">
        <h2 class="text-3xl font-bold mb-6" style="color: ${colorScheme.primary};">${title}</h2>
        <div class="grid grid-cols-2 gap-8 h-[calc(100%-80px)]">
          <div class="p-6 rounded-2xl" style="background: ${colorScheme.accent}30;">
            <h3 class="text-xl font-bold mb-4" style="color: ${colorScheme.primary};">${escapeHtml(slide.leftTitle || 'Kolom 1')}</h3>
            <ul class="space-y-2">
              ${leftContent.map(item => `<li class="text-lg" style="color: ${colorScheme.text};">${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>
          <div class="p-6 rounded-2xl" style="background: ${colorScheme.secondary}20;">
            <h3 class="text-xl font-bold mb-4" style="color: ${colorScheme.secondary};">${escapeHtml(slide.rightTitle || 'Kolom 2')}</h3>
            <ul class="space-y-2">
              ${rightContent.map(item => `<li class="text-lg" style="color: ${colorScheme.text};">${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `,
    quote: `
      <div class="w-full h-full flex items-center justify-center p-12" style="background: linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%);">
        <div class="text-center max-w-3xl">
          <i class="fas fa-quote-left text-6xl text-white/30 mb-6"></i>
          <h2 class="text-4xl font-bold text-white mb-6 leading-relaxed">"${escapeHtml(slide.quote || '')}"</h2>
          <p class="text-xl text-white/80">— ${escapeHtml(slide.author || 'Pepatah')}</p>
        </div>
      </div>
    `,
    process: `
      <div class="w-full h-full p-10" style="background: ${colorScheme.background};">
        <h2 class="text-3xl font-bold mb-8" style="color: ${colorScheme.primary};">${title}</h2>
        <div class="flex items-center justify-between gap-4">
          ${content.map((item, i) => `
            <div class="flex-1 text-center">
              <div class="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3" style="background: linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary});">${i + 1}</div>
              <p class="text-lg font-medium" style="color: ${colorScheme.text};">${escapeHtml(item)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `,
    summary: `
      <div class="w-full h-full p-10" style="background: linear-gradient(135deg, ${colorScheme.background} 0%, ${colorScheme.accent}40 100%);">
        <h2 class="text-3xl font-bold mb-6 flex items-center gap-3" style="color: ${colorScheme.primary};">
          <i class="fas fa-clipboard-check"></i>${title}
        </h2>
        <div class="grid ${hasImage ? 'grid-cols-3' : 'grid-cols-2'} gap-4">
          ${content.map((item, i) => `
            <div class="flex items-center gap-3 p-4 rounded-xl bg-white shadow-sm">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style="background: ${colorScheme.secondary};">
                <i class="fas fa-check"></i>
              </div>
              <span class="text-lg" style="color: ${colorScheme.text};">${escapeHtml(item)}</span>
            </div>
          `).join('')}
          ${hasImage ? `<div class="col-span-1">${imageHtml}</div>` : ''}
        </div>
      </div>
    `,
    activity: `
      <div class="w-full h-full p-10" style="background: ${colorScheme.background};">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-xl flex items-center justify-center" style="background: ${colorScheme.secondary};">
            <i class="fas fa-tasks text-2xl text-white"></i>
          </div>
          <h2 class="text-3xl font-bold" style="color: ${colorScheme.primary};">${title}</h2>
        </div>
        <div class="p-6 rounded-2xl mb-6" style="background: ${colorScheme.accent}30; border-left: 4px solid ${colorScheme.secondary};">
          <p class="text-xl" style="color: ${colorScheme.text};">${escapeHtml(slide.instruction || '')}</p>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-white text-center">
            <i class="fas fa-clock text-2xl mb-2" style="color: ${colorScheme.primary};"></i>
            <p class="font-bold" style="color: ${colorScheme.text};">${slide.time || '10 menit'}</p>
          </div>
          <div class="p-4 rounded-xl bg-white text-center">
            <i class="fas fa-users text-2xl mb-2" style="color: ${colorScheme.primary};"></i>
            <p class="font-bold" style="color: ${colorScheme.text};">${slide.groupSize || 'Individual'}</p>
          </div>
          <div class="p-4 rounded-xl bg-white text-center">
            <i class="fas fa-tools text-2xl mb-2" style="color: ${colorScheme.primary};"></i>
            <p class="font-bold" style="color: ${colorScheme.text};">${slide.materials || 'Kertas & Pensil'}</p>
          </div>
        </div>
      </div>
    `,
    question: `
      <div class="w-full h-full flex items-center justify-center p-12" style="background: linear-gradient(135deg, ${colorScheme.primary}10 0%, ${colorScheme.secondary}20 100%);">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style="background: ${colorScheme.primary};">
            <i class="fas fa-question text-3xl text-white"></i>
          </div>
          <h2 class="text-4xl font-bold mb-6" style="color: ${colorScheme.primary};">${title}</h2>
          <div class="max-w-2xl mx-auto p-6 rounded-2xl bg-white shadow-lg">
            <p class="text-xl" style="color: ${colorScheme.text};">${escapeHtml(slide.question || '')}</p>
          </div>
          <p class="mt-6 text-lg opacity-70" style="color: ${colorScheme.text};">Diskusikan dengan teman sekelas!</p>
        </div>
      </div>
    `,
    thankyou: `
      <div class="w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%);">
        <div class="text-center text-white">
          <i class="fas fa-hands-helping text-6xl mb-6 opacity-90"></i>
          <h1 class="text-5xl font-bold mb-4">Terima Kasih!</h1>
          <p class="text-2xl opacity-90 mb-8">${escapeHtml(slide.message || 'Semoga pembelajaran hari ini berguna')}</p>
          <div class="flex items-center justify-center gap-6 text-lg">
            <span><i class="fas fa-user mr-2"></i>${escapeHtml(slide.teacher || 'Guru')}</span>
            <span><i class="fas fa-school mr-2"></i>${escapeHtml(slide.school || 'Sekolah')}</span>
          </div>
        </div>
      </div>
    `
  };

  return layouts[layout] || layouts.content;
}

// Initialize slide generation events  
export function initSlide() {
  window.initSlide = initSlide;

  // Expose navigation function globally so it can be called from inline onclick handlers
  window.slidgenGoTo = (viewName) => {
    if (window.slideGenState) {
      window.slideGenState.view = viewName;
      reRenderContainer();
    }
  };

  attachCurrentViewEvents();
}

// Helper to re-render the container when state changes
function reRenderContainer() {
  const container = document.getElementById('slidegen-container');
  if (!container || !window.slideGenState) return;

  const view = window.slideGenState.view;
  if (view === 'landing') {
    container.innerHTML = renderLandingView();
  } else if (view === 'gallery') {
    container.innerHTML = renderGalleryView();
  } else if (view === 'editor') {
    container.innerHTML = renderEditorView();
  }

  // Re-attach events for the new view
  attachCurrentViewEvents();
}

// Attach event listeners based on the current view
function attachCurrentViewEvents() {
  const state = window.slideGenState;
  if (!state) return;

  if (state.view === 'landing') {
    // Sync prompt state
    const promptInput = document.getElementById('sg-main-prompt');
    if (promptInput) {
      promptInput.value = state.prompt;
      promptInput.addEventListener('input', (e) => state.prompt = e.target.value);
    }

    // Quick topics
    document.querySelectorAll('.sg-quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (promptInput) {
          promptInput.value = e.target.textContent;
          state.prompt = e.target.textContent;
        }
      });
    });

    // Go to Gallery
    const nextBtn = document.getElementById('sg-btn-next-gallery');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (!state.prompt.trim()) {
          showToast('Silakan masukkan topik presentasi terlebih dahulu', 'error');
          return;
        }
        // Extract basic topic for display
        state.config.topik = state.prompt;
        window.slidgenGoTo('gallery');
      });
    }

    // AI Settings Modal
    const settingsBtn = document.getElementById('sg-btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        showAISettingsModal();
      });
    }
  }
  else if (state.view === 'gallery') {
    // Populate display topic
    const displayTopic = document.getElementById('sg-display-topic');
    if (displayTopic) displayTopic.textContent = state.config.topik || state.prompt;

    // Handle Template Selection
    const templateCards = document.querySelectorAll('.sg-template-card');
    const displayTemplate = document.getElementById('sg-display-template');
    const btnGenerate = document.getElementById('sg-btn-generate');

    // Pre-select if already in state
    if (state.template) {
      const activeCard = document.querySelector(`.sg-template-card[data-id="${state.template}"]`);
      if (activeCard) {
        activeCard.classList.add('ring-4', 'ring-primary-500', 'border-transparent');
        activeCard.querySelector('.absolute.inset-0.bg-black\\/0')?.classList.replace('bg-black/0', 'bg-primary-500/10');
      }
      if (displayTemplate) displayTemplate.textContent = state.template;
      if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    templateCards.forEach(card => {
      card.addEventListener('click', () => {
        // Clear previous selection
        templateCards.forEach(c => {
          c.classList.remove('ring-4', 'ring-primary-500', 'border-transparent');
          c.querySelector('.absolute.inset-0.bg-primary-500\\/10')?.classList.replace('bg-primary-500/10', 'bg-black/0');
        });

        // Mark new selection
        card.classList.add('ring-4', 'ring-primary-500', 'border-transparent');
        card.querySelector('.absolute.inset-0.bg-black\\/0')?.classList.replace('bg-black/0', 'bg-primary-500/10');

        state.template = card.dataset.id;

        if (displayTemplate) {
          const templateName = card.querySelector('h3')?.textContent || state.template;
          displayTemplate.textContent = templateName;
        }

        if (btnGenerate) {
          btnGenerate.disabled = false;
          btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
          btnGenerate.classList.add('animate-pulse-once'); // Provide feedback
        }
      });
    });

    // Form inputs sync
    const mapelInput = document.getElementById('sg-input-mapel');
    const kelasInput = document.getElementById('sg-input-kelas');
    const countInput = document.getElementById('sg-input-count');
    const countVal = document.getElementById('sg-count-val');
    const engineInput = document.getElementById('sg-input-engine');

    if (mapelInput) { mapelInput.value = state.config.mataPelajaran || 'Umum'; mapelInput.addEventListener('input', e => state.config.mataPelajaran = e.target.value); }
    if (kelasInput) { kelasInput.value = state.config.jenjangKelas || 'Umum'; kelasInput.addEventListener('input', e => state.config.jenjangKelas = e.target.value); }
    if (engineInput) { engineInput.value = state.config.aiProvider; engineInput.addEventListener('change', e => state.config.aiProvider = e.target.value); }
    if (countInput && countVal) {
      countInput.value = state.config.slideCount;
      countVal.textContent = state.config.slideCount;
      countInput.addEventListener('input', e => {
        state.config.slideCount = parseInt(e.target.value);
        countVal.textContent = state.config.slideCount;
      });
    }

    // Generate Action
    if (btnGenerate) {
      btnGenerate.addEventListener('click', async () => {
        if (!state.template) return;

        const payload = {
          mataPelajaran: state.config.mataPelajaran || 'Umum',
          topik: state.config.topik || state.prompt,
          jenjangKelas: state.config.jenjangKelas || 'Umum',
          semester: state.config.semester,
          strategi: state.config.strategi,
          alokasiWaktu: state.config.alokasiWaktu,
          capaianPembelajaran: `Topik utama: ${state.prompt}`, // Gunakan prompt awal sebagai konteks tambahan
          profilSosial: 'Bernalar Kritis & Mandiri',
          slideCount: state.config.slideCount,
          template: state.template,
          aiProvider: state.config.aiProvider
        };

        showLoading('SlideGen AI sedang merancang presentasi Anda...');

        try {
          const response = await api('/presentation/generate', {
            method: 'POST',
            body: payload,
            timeout: 180000 // 3 minutes for slower AI models like mistral-medium
          });
          if (response.data && Array.isArray(response.data.slides)) {
            state.slides = response.data.slides.map(slide => {
              if (slide.content && !Array.isArray(slide.content)) slide.content = [String(slide.content)];
              if (slide.leftContent && !Array.isArray(slide.leftContent)) slide.leftContent = [String(slide.leftContent)];
              if (slide.rightContent && !Array.isArray(slide.rightContent)) slide.rightContent = [String(slide.rightContent)];
              return slide;
            });
            state.currentIndex = 0;
            showToast('Presentasi berhasil dibuat!', 'success');
            window.slidgenGoTo('editor');
          } else {
            throw new Error('Respons AI tidak valid');
          }
        } catch (error) {
          console.error('Slide generation error:', error);
          showToast(error.message || 'Gagal generate slide. Silakan coba lagi.', 'error');
        } finally {
          hideLoading();
        }
      });
    }
  }
  else if (state.view === 'editor') {
    updateEditorContent();

    // Editor Navigation
    const prevBtn = document.getElementById('sg-prev-slide');
    const nextBtn = document.getElementById('sg-next-slide');
    const exportBtn = document.getElementById('sg-btn-export');

    if (prevBtn) prevBtn.addEventListener('click', () => navigateEditor(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateEditor(1));
    if (exportBtn) exportBtn.addEventListener('click', exportToPPTX);

    // Keyboard navigation
    const keyHandler = (e) => {
      // Hanya jika view sedang di editor dan tidak fokus pada input
      if (window.slideGenState?.view === 'editor' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowLeft') navigateEditor(-1);
        if (e.key === 'ArrowRight') navigateEditor(1);
      }
    };
    // Remove old listener if exists, add new
    document.removeEventListener('keydown', window._sgKeyHandler);
    window._sgKeyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);
  }
}

function navigateEditor(direction) {
  const state = window.slideGenState;
  if (!state || !state.slides.length) return;

  const newIndex = state.currentIndex + direction;
  if (newIndex >= 0 && newIndex < state.slides.length) {
    state.currentIndex = newIndex;
    updateEditorContent();
  }
}

function goToEditorSlide(index) {
  const state = window.slideGenState;
  if (!state || !state.slides.length) return;

  if (index >= 0 && index < state.slides.length) {
    state.currentIndex = index;
    updateEditorContent();
  }
}

function updateEditorContent() {
  const state = window.slideGenState;
  if (!state || !state.slides.length) return;

  const currentSlide = state.slides[state.currentIndex];
  const colorScheme = getColorScheme(state.template);

  // Update Title
  const titleEl = document.getElementById('sg-editor-title');
  if (titleEl) titleEl.textContent = state.config.topik || state.prompt || 'AI Presentation';

  // Render Main Content
  const renderArea = document.getElementById('sg-slide-render-area');
  if (renderArea) {
    renderArea.innerHTML = generateSlideHTML(currentSlide, state.currentIndex, colorScheme);
  }

  // Update Info
  const counterEl = document.getElementById('sg-slide-counter');
  const layoutEl = document.getElementById('sg-slide-layout-name');
  if (counterEl) counterEl.textContent = `Slide ${state.currentIndex + 1} / ${state.slides.length}`;
  if (layoutEl) layoutEl.textContent = currentSlide.layout || 'Content';

  // Update Notes
  const notesEl = document.getElementById('sg-speaker-notes-display');
  if (notesEl) {
    notesEl.textContent = currentSlide.speakerNotes || 'Tidak ada catatan untuk slide ini.';
  }

  // Render Thumbnails
  const thumbsContainer = document.getElementById('sg-thumbnails-container');
  if (thumbsContainer) {
    thumbsContainer.innerHTML = state.slides.map((slide, i) => {
      const isActive = i === state.currentIndex;
      return `
        <div class="sg-thumbnail-item flex-shrink-0 w-40 aspect-[16/9] rounded-md overflow-hidden cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary-500 shadow-md transform scale-105' : 'border border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100 hover:border-gray-400'}" data-index="${i}">
           <div class="w-full h-full p-2 flex flex-col pointer-events-none" style="background: ${colorScheme.background}; font-size: 8px;">
               <div class="font-bold truncate mb-1 flex items-center gap-1" style="color: ${colorScheme.primary};">
                 <span>${i + 1}. ${escapeHtml(slide.title || 'Slide')}</span>
                 ${slide.image?.url ? '<i class="fas fa-image"></i>' : ''}
               </div>
               <div class="text-[6px] line-clamp-2" style="color: ${colorScheme.text};">${escapeHtml(slide.content?.[0] || slide.subtitle || '')}</div>
           </div>
        </div>
      `;
    }).join('');

    // Attach click events to thumbs
    thumbsContainer.querySelectorAll('.sg-thumbnail-item').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        goToEditorSlide(idx);

        // Scroll thumbnail into view
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });
  }
}



async function exportToPPTX() {
  const state = window.slideGenState;
  if (!state || !state.slides.length) {
    showToast('Tidak ada slide untuk diexport', 'error');
    return;
  }

  showLoading('Mengexport ke PPTX...');

  try {
    // Load PptxGenJS
    if (!window.PptxGenJS) {
      await loadScript('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
    }

    const pptx = new window.PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = state.slides[0]?.title || 'Presentasi';
    pptx.author = 'Slide Generator AI';
    pptx.company = 'KKG App';

    const colorScheme = getColorScheme(state.template);
    const imageCache = new Map();

    async function imageUrlToDataUri(url) {
      if (!url) return null;
      if (imageCache.has(url)) return imageCache.get(url);

      const promise = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Gagal mengambil gambar');
          return res.blob();
        })
        .then((blob) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }))
        .catch(() => null);

      imageCache.set(url, promise);
      return promise;
    }

    async function addSlideImage(pptSlide, image, box) {
      if (!image?.url) return false;
      const dataUri = await imageUrlToDataUri(image.url);
      const source = dataUri || image.url;
      pptSlide.addImage({ path: source, ...box });

      if (image.creditName) {
        pptSlide.addText(`Foto: ${image.creditName} / Unsplash`, {
          x: box.x,
          y: box.y + box.h + 0.02,
          w: box.w,
          h: 0.2,
          fontSize: 9,
          color: colorScheme.text.replace('#', ''),
          align: 'left',
        });
      }
      return true;
    }

    for (const slide of state.slides) {
      const pptSlide = pptx.addSlide();

      // Background
      if (slide.layout === 'title' || slide.layout === 'thankyou' || slide.layout === 'quote') {
        pptSlide.background = { color: colorScheme.primary.replace('#', '') };
      } else {
        pptSlide.background = { color: colorScheme.background.replace('#', '') };
      }

      // Formatting variables for AutoFit
      const baseOptions = { autoFit: true, breakLine: true };
      const bulletOptions = { bullet: true, color: colorScheme.text.replace('#', ''), fontSize: 24, fontFace: 'Arial', ...baseOptions };

      // Content based on layout
      switch (slide.layout) {
        case 'title':
          pptSlide.addText(slide.title || 'Presentasi', {
            x: '10%', y: '30%', w: '80%', h: '25%',
            fontSize: 48, bold: true, color: 'FFFFFF', align: 'center', ...baseOptions
          });
          pptSlide.addText(slide.subtitle || slide.content || '', {
            x: '10%', y: '60%', w: '80%', h: '15%',
            fontSize: 24, color: 'EEEEEE', align: 'center', ...baseOptions
          });
          break;

        case 'content':
        case 'summary':
          pptSlide.addText(slide.title || 'Materi Pembelajaran', {
            x: '5%', y: '5%', w: '90%', h: '12%',
            fontSize: 36, bold: true, color: colorScheme.primary.replace('#', ''), valign: 'middle'
          });

          if (slide.content && Array.isArray(slide.content)) {
            const textObjects = slide.content.map(text => ({ text, options: bulletOptions }));
            const hasImage = Boolean(slide.image?.url);
            pptSlide.addText(textObjects, { x: '5%', y: '25%', w: hasImage ? '56%' : '90%', h: '65%', valign: 'top' });
            if (hasImage) {
              await addSlideImage(pptSlide, slide.image, { x: 7.1, y: 1.7, w: 5.8, h: 3.8 });
            }
          }
          break;

        case 'imageText':
          pptSlide.addText(slide.title || 'Materi Visual', {
            x: '5%', y: '5%', w: '90%', h: '12%',
            fontSize: 34, bold: true, color: colorScheme.primary.replace('#', ''), valign: 'middle'
          });
          if (slide.content && Array.isArray(slide.content)) {
            const imageTextObjects = slide.content.map(text => ({ text, options: { ...bulletOptions, fontSize: 20 } }));
            pptSlide.addText(imageTextObjects, { x: '5%', y: '24%', w: '44%', h: '64%', valign: 'top' });
          }
          await addSlideImage(pptSlide, slide.image, { x: 6.6, y: 1.8, w: 6.1, h: 3.9 });
          break;

        case 'twoColumn':
          pptSlide.addText(slide.title || 'Perbandingan / Dua Konsep', {
            x: '5%', y: '5%', w: '90%', h: '12%',
            fontSize: 36, bold: true, color: colorScheme.primary.replace('#', ''), valign: 'middle'
          });

          // Kiri
          pptSlide.addText(slide.leftTitle || 'Sisi Kiri', {
            x: '5%', y: '20%', w: '40%', h: '8%',
            fontSize: 24, bold: true, color: colorScheme.primary.replace('#', ''), valign: 'middle'
          });
          if (slide.leftContent && Array.isArray(slide.leftContent)) {
            const leftObjects = slide.leftContent.map(text => ({ text, options: { ...bulletOptions, fontSize: 20 } }));
            pptSlide.addText(leftObjects, { x: '5%', y: '30%', w: '42%', h: '60%', valign: 'top' });
          }

          // Kanan
          pptSlide.addText(slide.rightTitle || 'Sisi Kanan', {
            x: '50%', y: '20%', w: '45%', h: '8%',
            fontSize: 24, bold: true, color: colorScheme.secondary.replace('#', ''), valign: 'middle', align: 'right'
          });
          if (slide.rightContent && Array.isArray(slide.rightContent)) {
            const rightObjects = slide.rightContent.map(text => ({ text, options: { ...bulletOptions, fontSize: 20, align: 'right' } }));
            pptSlide.addText(rightObjects, { x: '50%', y: '30%', w: '45%', h: '60%', valign: 'top' });
          }
          break;

        case 'activity':
          pptSlide.addText(slide.title || 'Aktivitas Kelas', {
            x: '5%', y: '5%', w: '90%', h: '12%',
            fontSize: 36, bold: true, color: colorScheme.primary.replace('#', ''), valign: 'middle'
          });
          pptSlide.addText("Instruksi Tugas:", {
            x: '5%', y: '20%', w: '90%', h: '10%',
            fontSize: 24, bold: true, color: colorScheme.text.replace('#', '')
          });
          pptSlide.addText(slide.instruction || 'Diskusikan bersama kelompok.', {
            x: '5%', y: '30%', w: '90%', h: '40%',
            fontSize: 28, color: colorScheme.text.replace('#', ''), valign: 'top', ...baseOptions
          });
          if (slide.time) {
            pptSlide.addText(`Waktu: ${slide.time}`, { x: '5%', y: '80%', w: '90%', h: '10%', fontSize: 24, bold: true, color: 'FF0000' });
          }
          break;

        case 'quote':
          pptSlide.addText(`"${slide.quote || 'Pendidikan adalah senjata ampuh'}"`, {
            x: '10%', y: '30%', w: '80%', h: '30%',
            fontSize: 40, italic: true, bold: true, color: 'FFFFFF', align: 'center', ...baseOptions
          });
          pptSlide.addText(`— ${slide.author || 'Tokoh'}`, {
            x: '10%', y: '65%', w: '80%', h: '15%',
            fontSize: 24, color: 'EEEEEE', align: 'center', ...baseOptions
          });
          break;

        case 'thankyou':
          pptSlide.addText('🙏 Terima Kasih!', {
            x: 1, y: 2.5, w: '80%', h: 1,
            fontSize: 44, bold: true, color: 'FFFFFF', align: 'center'
          });
          pptSlide.addText(slide.message || '', {
            x: 1, y: 4, w: '80%', h: 0.6,
            fontSize: 20, color: 'FFFFFF', align: 'center'
          });
          break;

        default:
          pptSlide.addText(slide.title || '', {
            x: 0.5, y: 0.4, w: '90%', h: 0.8,
            fontSize: 32, bold: true, color: colorScheme.primary
          });
      }

      // Speaker notes
      if (slide.speakerNotes) {
        pptSlide.addNotes(slide.speakerNotes);
      }
    }

    const filename = `${state.slides[0]?.title || 'presentasi'}-${Date.now()}.pptx`;
    pptx.writeFile({ fileName: filename });

    showToast('PPTX berhasil didownload!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Gagal mengeksport PPTX', 'error');
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

  const state = window.slideGenState;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-2xl max-w-md w-full animate-slide-up border border-border-light dark:border-border-dark">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i class="fas fa-sliders-h"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Pengaturan AI</h3>
              <p class="text-xs text-gray-500">Konfigurasi AI Engine & Output</p>
            </div>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <div class="space-y-6">
          <div class="space-y-3">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih AI Engine</label>
            <div class="grid grid-cols-1 gap-3">
              <label class="flex items-center gap-4 p-4 rounded-2xl border ${state.config.aiProvider === 'vertex' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-light dark:border-border-dark'} hover:border-primary transition-all cursor-pointer group">
                <input type="radio" name="sg-modal-engine" value="vertex" ${state.config.aiProvider === 'vertex' ? 'checked' : ''} class="w-5 h-5 text-primary border-gray-300 focus:ring-primary">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="font-bold text-gray-900 dark:text-white">⚡ Gemini 3 Flash Preview</span>
                    <span class="text-[10px] uppercase tracking-wider font-bold text-blue-600">Vertex AI · Terbaru</span>
                  </div>
                  <p class="text-xs text-gray-500">Model terbaru & terpintar via Vertex AI. Butuh API key berbayar.</p>
                </div>
              </label>

              <label class="flex items-center gap-4 p-4 rounded-2xl border ${state.config.aiProvider === 'gemini' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-light dark:border-border-dark'} hover:border-primary transition-all cursor-pointer group">
                <input type="radio" name="sg-modal-engine" value="gemini" ${state.config.aiProvider === 'gemini' ? 'checked' : ''} class="w-5 h-5 text-primary border-gray-300 focus:ring-primary">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="font-bold text-gray-900 dark:text-white">✨ Gemini 2.0 Flash</span>
                    <span class="text-[10px] uppercase tracking-wider font-bold text-emerald-600">Gratis</span>
                  </div>
                  <p class="text-xs text-gray-500">Gratis, cerdas, dan berkualitas tinggi. Pilihan terbaik tanpa biaya.</p>
                </div>
              </label>

              <label class="flex items-center gap-4 p-4 rounded-2xl border ${state.config.aiProvider === 'mistral' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-light dark:border-border-dark'} hover:border-primary transition-all cursor-pointer group">
                <input type="radio" name="sg-modal-engine" value="mistral" ${state.config.aiProvider === 'mistral' ? 'checked' : ''} class="w-5 h-5 text-primary border-gray-300 focus:ring-primary">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="font-bold text-gray-900 dark:text-white">Mistral Large</span>
                    <span class="text-[10px] uppercase tracking-wider font-bold text-gray-400">Premium</span>
                  </div>
                  <p class="text-xs text-gray-500">Hasil lebih formal, detail, dan berbobot akademis.</p>
                </div>
              </label>

              <label class="flex items-center gap-4 p-4 rounded-2xl border ${state.config.aiProvider === 'groq' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-light dark:border-border-dark'} hover:border-primary transition-all cursor-pointer group">
                <input type="radio" name="sg-modal-engine" value="groq" ${state.config.aiProvider === 'groq' ? 'checked' : ''} class="w-5 h-5 text-primary border-gray-300 focus:ring-primary">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="font-bold text-gray-900 dark:text-white">Groq LLaMA 3.3</span>
                    <span class="text-[10px] uppercase tracking-wider font-bold text-orange-500">Super Cepat</span>
                  </div>
                  <p class="text-xs text-gray-500">Proses tercepat menggunakan model LLaMA 70B.</p>
                </div>
              </label>

              <label class="flex items-center gap-4 p-4 rounded-2xl border ${state.config.aiProvider === 'z_ai' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-light dark:border-border-dark'} hover:border-primary transition-all cursor-pointer group">
                <input type="radio" name="sg-modal-engine" value="z_ai" ${state.config.aiProvider === 'z_ai' ? 'checked' : ''} class="w-5 h-5 text-primary border-gray-300 focus:ring-primary">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="font-bold text-gray-900 dark:text-white">GLM-4.7 Flash</span>
                    <span class="text-[10px] uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400">Cepat</span>
                  </div>
                  <p class="text-xs text-gray-500">Proses kilat, kreatif, dan cerdas dalam merangkum.</p>
                </div>
              </label>
            </div>
          </div>

          <div class="pt-4">
            <button id="sg-save-settings" class="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Handle Radio Selection (Styling only)
  modalContainer.querySelectorAll('input[name="sg-modal-engine"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      modalContainer.querySelectorAll('label').forEach(l => l.className = 'flex items-center gap-4 p-4 rounded-2xl border border-border-light dark:border-border-dark hover:border-primary transition-all cursor-pointer group');
      const label = e.target.closest('label');
      label.className = 'flex items-center gap-4 p-4 rounded-2xl border border-primary bg-primary/5 ring-1 ring-primary hover:border-primary transition-all cursor-pointer group';
    });
  });

  // Handle Save
  document.getElementById('sg-save-settings').onclick = () => {
    const selected = modalContainer.querySelector('input[name="sg-modal-engine"]:checked').value;
    state.config.aiProvider = selected;
    showToast(`AI Engine berhasil diatur ke ${selected.toUpperCase()}`, 'success');
    modalContainer.querySelector('.fixed').remove();
  };
}
