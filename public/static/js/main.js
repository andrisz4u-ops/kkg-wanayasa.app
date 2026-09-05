
// Main Entry Point - KKG Portal Digital
import { state } from './state.js';
import { initRouter, navigate } from './router.js';
import { api } from './api.js';
import { showToast, showLoading, hideLoading, confirm, avatar, escapeHtml } from './utils.js';

// Components
import { renderNavbar, renderFooter, toggleMobileMenu } from './components.js';

// Theme & Accessibility
import { initTheme, toggleTheme, renderThemeToggle } from './theme.js';
import { initA11y, announce, renderSkipLinks } from './a11y.js';
import { fetchUnreadCount, renderNotificationBell } from './notifications.js';

// Pages
// Pages are now loaded dynamically

// Global exports for inline HTML onclick handlers
window.navigate = navigate;
window.toggleMobileMenu = toggleMobileMenu;
window.showToast = showToast;
window.confirm = confirm;
window.toggleTheme = toggleTheme;
window.state = state; // Expose state for inline onclick handlers

// User Profile Dropdown Menu Handlers
window.toggleUserDropdown = function(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('user-dropdown-menu');
  const arrow = document.getElementById('user-dropdown-arrow');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (arrow) arrow.classList.add('rotate-180');
  } else {
    menu.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180');
  }
};

window.closeUserDropdown = function() {
  const menu = document.getElementById('user-dropdown-menu');
  const arrow = document.getElementById('user-dropdown-arrow');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180');
  }
};

if (!window.__userDropdownListenerAttached) {
  window.__userDropdownListenerAttached = true;
  document.addEventListener('click', (e) => {
    const container = document.getElementById('user-profile-menu-container');
    if (container && !container.contains(e.target)) {
      window.closeUserDropdown();
    }
  });
}

// Mobile AI Bottom Sheet Modal Handlers
window.toggleMobileAiSheet = function() {
  const sheet = document.getElementById('mobile-ai-action-sheet');
  if (!sheet) return;
  sheet.classList.toggle('hidden');
};

window.closeMobileAiSheet = function() {
  const sheet = document.getElementById('mobile-ai-action-sheet');
  if (sheet) sheet.classList.add('hidden');
};

// Register Service Worker for PWA (Progressive Web App)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Versi baru tersedia.');
            }
          });
        }
      });
    }).catch((err) => {
      console.warn('[PWA] SW register error:', err);
    });
  });
}

// Handle PWA BeforeInstallPrompt (A2HS)
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  window.showPwaInstallBanner?.();
});

window.showPwaInstallBanner = function() {
  const existing = document.getElementById('pwa-install-banner');
  if (existing || !deferredPrompt) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9999] bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/30 flex items-center justify-between gap-3 animate-slide-up print-hidden';
  banner.innerHTML = `
    <div class="flex items-center gap-3">
      <img src="/favicon.png" class="w-10 h-10 rounded-xl border border-teal-400/40 shadow-sm" alt="KKG App">
      <div>
        <h4 class="font-bold text-xs text-white">Pasang Aplikasi KKG</h4>
        <p class="text-[10px] text-teal-200/80">Akses cepat & hemat kuota di layar utama</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="btn-pwa-install" class="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow transition-all cursor-pointer">
        Install
      </button>
      <button id="btn-pwa-dismiss" class="text-slate-400 hover:text-white p-1 text-xs cursor-pointer">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Terima kasih telah memasang aplikasi KKG Portal!', 'success');
      }
      deferredPrompt = null;
      banner.remove();
    }
  });

  document.getElementById('btn-pwa-dismiss')?.addEventListener('click', () => {
    banner.remove();
  });
};

// Global handler for admin sidebar tab clicks
window.handleAdminTabClick = function (tabId) {
  if (state.currentPage === 'admin') {
    // If already on admin page, switch tab directly
    if (window.switchAdminTab) {
      window.switchAdminTab(tabId);
    } else {
      // Admin module not loaded yet, store for later
      state.currentAdminTab = tabId;
    }
  } else {
    // Navigate to admin page with specific tab
    state.currentAdminTab = tabId;
    navigate('admin');
  }
};

// Initialize database (first-time setup)
window.initDb = async function () {
  if (!await confirm('Ini akan menginisialisasi database. Lanjutkan?')) return;

  showLoading('Menginisialisasi database...');
  try {
    const res = await api('/init-db');
    showToast(res.message || 'Database berhasil diinisialisasi!', 'success');
    // Refresh the page to reload user data
    window.location.reload();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
};

// Page registry
// Page registry with Dynamic Imports
// Tambahkan cache-bust khusus untuk modul yang pernah error agar tidak cache lama
const PAGE_MODULE_VERSION = window.__APP_VERSION__ || 'dev';
const _failedModules = new Set();
const loadPageModule = async (pageName) => {
  // Jika modul pernah gagal dimuat, tambahkan timestamp untuk bypass cache browser
  const bust = _failedModules.has(pageName) ? `&t=${Date.now()}` : '';
  try {
    const mod = await import(`./pages/${pageName}.js?v=${encodeURIComponent(PAGE_MODULE_VERSION)}${bust}`);
    _failedModules.delete(pageName);
    return mod;
  } catch (err) {
    _failedModules.add(pageName);
    throw err;
  }
};

const pages = {
  home: async () => (await loadPageModule('home')).renderHome(),
  login: async () => (await loadPageModule('auth')).renderLogin(),
  profile: async () => (await loadPageModule('profile')).renderProfile(),
  surat: async () => (await loadPageModule('surat')).renderSurat(),
  proker: async () => (await loadPageModule('proker')).renderProker(),
  absensi: async () => (await loadPageModule('absensi')).renderAbsensi(),
  materi: async () => (await loadPageModule('materi')).renderMateri(),
  guru: async () => (await loadPageModule('guru')).renderGuru(),
  forum: async () => (await loadPageModule('forum')).renderForum(),
  pengumuman: async () => (await loadPageModule('pengumuman')).renderPengumuman(),
  admin: async () => (await loadPageModule('admin')).renderAdmin(),
  kalender: async () => (await loadPageModule('kalender')).renderKalender(),
  'reset-password': async () => (await loadPageModule('reset-password')).renderResetPassword(),
  laporan: async () => (await loadPageModule('laporan')).renderLaporan(),
  notifications: async () => (await loadPageModule('notifications')).renderNotifications(),
  rpp: async () => (await loadPageModule('rpp')).renderRpp(),
  kisi: async () => (await loadPageModule('kisi')).renderKisi(),
  slide: async () => (await loadPageModule('slide')).renderSlide(),
  tts: async () => (await loadPageModule('tts')).renderTts(),
};

// Pages that have their own full layout (no main wrapper)
const customLayoutPages = ['admin', 'surat', 'proker', 'laporan'];

// Protected pages (require authentication)
const protectedPages = ['surat', 'proker', 'absensi', 'profile', 'notifications'];
const adminPages = ['admin'];

// Accordion state tracking for sidebar categories — persisted to localStorage
(function() {
  try {
    const saved = localStorage.getItem('kkg_nav_section_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        window.__navSectionState = parsed;
      } else {
        window.__navSectionState = {};
      }
    } else {
      window.__navSectionState = {};
    }
  } catch(_) {
    window.__navSectionState = {};
  }
})();

window.toggleNavSection = function(sectionId) {
  if (!window.__navSectionState || typeof window.__navSectionState !== 'object') {
    window.__navSectionState = {};
  }
  const isCurrentlyOpen = window.__navSectionState[sectionId] !== false;
  window.__navSectionState[sectionId] = !isCurrentlyOpen;
  
  // Persist to localStorage
  try { 
    localStorage.setItem('kkg_nav_section_state', JSON.stringify(window.__navSectionState)); 
  } catch(_) {}

  // Toggle all matching sections (supports both desktop sidebar & mobile drawer)
  document.querySelectorAll(`.nav-section-content-${sectionId}`).forEach(el => {
    if (window.__navSectionState[sectionId]) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Update aria-expanded on toggle buttons
  document.querySelectorAll(`.nav-section-toggle-${sectionId}`).forEach(btn => {
    btn.setAttribute('aria-expanded', String(window.__navSectionState[sectionId]));
  });

  // Rotate chevron icon smoothly
  document.querySelectorAll(`.nav-section-chevron-${sectionId}`).forEach(el => {
    if (window.__navSectionState[sectionId]) {
      el.classList.add('rotate-180');
    } else {
      el.classList.remove('rotate-180');
    }
  });
};

// Navigation Structure - Collapsible Accordion Architecture
const navSections = [
  {
    id: 'ruang-kerja',
    title: 'Ruang Kerja',
    icon: 'fa-briefcase',
    defaultOpen: true,
    items: [
      { page: 'home', label: 'Beranda', icon: 'fa-home', public: true },
      { page: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn', public: true },
      { page: 'kalender', label: 'Kalender & Agenda', icon: 'fa-calendar-alt', public: true },
    ]
  },
  {
    id: 'asisten-ai',
    title: 'Asisten AI',
    icon: 'fa-wand-magic-sparkles',
    isAI: true,
    badgeText: '4 Modul',
    defaultOpen: true,
    items: [
      { page: 'rpp', label: 'Buat RPP (AI)', icon: 'fa-magic', public: true, ai: true },
      { page: 'kisi', label: 'Buat Asesmen', icon: 'fa-list-check', public: true, ai: true },
      { page: 'slide', label: 'Slide Presentasi', icon: 'fa-file-powerpoint', public: true, ai: true },
      { page: 'tts', label: 'Teka-Teki Silang', icon: 'fa-puzzle-piece', public: true, ai: true },
    ]
  },
  {
    id: 'komunitas',
    title: 'Kegiatan & Komunitas',
    icon: 'fa-users',
    defaultOpen: true,
    items: [
      { page: 'materi', label: 'Bank Materi Ajar', icon: 'fa-book-open', public: true },
      { page: 'absensi', label: 'Presensi Kegiatan', icon: 'fa-clipboard-check', auth: true },
      { page: 'forum', label: 'Forum Diskusi', icon: 'fa-comments', public: true },
      { page: 'guru', label: 'Direktori Guru', icon: 'fa-users', public: true },
    ]
  },
  {
    id: 'administrasi',
    title: 'Administrasi',
    icon: 'fa-shield-halved',
    admin: true,
    defaultOpen: true,
    items: [
      { page: 'surat', label: 'Generator Surat', icon: 'fa-envelope-open-text', admin: true },
      { page: 'proker', label: 'Program Kerja', icon: 'fa-tasks', admin: true },
      { page: 'laporan', label: 'Laporan KKG', icon: 'fa-file-contract', admin: true },
      { page: 'admin', label: 'Panel Kontrol', icon: 'fa-cog', admin: true },
    ]
  }
];

// Flat navLinks export for legacy compatibility if referenced
const navLinks = navSections.flatMap(s => s.items.map(it => ({ ...it, section: s.title })));

function renderNavLinks(activePage) {
  const isLoggedIn = !!state.user;
  const isAdminPanelUser = ['super_admin', 'admin', 'operator'].includes(state.user?.role || '');

  return navSections.filter(section => {
    if (section.admin && !isAdminPanelUser) return false;
    return true;
  }).map((section) => {
    // Initialize section state if not yet set by user or storage
    if (window.__navSectionState[section.id] === undefined) {
      const hasActiveChild = section.items.some(it => it.page === activePage);
      window.__navSectionState[section.id] = hasActiveChild || section.defaultOpen;
    }

    const isExpanded = !!window.__navSectionState[section.id];

    const visibleItems = section.items.filter(item => {
      if (item.public) return true;
      if (item.auth && isLoggedIn) return true;
      if (item.admin && isAdminPanelUser) return true;
      return false;
    });

    if (visibleItems.length === 0) return '';

    return `
      <div class="mb-3.5">
        <!-- Section Header Toggle Button -->
        <button 
          type="button"
          onclick="window.toggleNavSection('${section.id}')"
          class="nav-section-toggle-${section.id} w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors group cursor-pointer select-none rounded-xl hover:bg-slate-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-1"
          title="Klik untuk buka/tutup kategori ${section.title}"
          aria-expanded="${isExpanded}"
          aria-controls="nav-section-${section.id}"
        >
          <div class="flex items-center gap-2 min-w-0">
            <i class="fas ${section.icon} text-xs ${section.isAI ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}"></i>
            <span class="${section.isAI ? 'text-teal-700 font-black' : 'text-slate-500 font-bold'} truncate">${section.title}</span>
            ${section.badgeText ? `
              <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 border border-teal-500/20">${section.badgeText}</span>
            ` : ''}
          </div>
          <i class="nav-section-chevron-${section.id} fas fa-chevron-down text-[10px] text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}"></i>
        </button>

        <!-- Section Items (Proportional, comfortable sizing) -->
        <div id="nav-section-${section.id}" class="nav-section-content-${section.id} space-y-1.5 pt-1.5 ${isExpanded ? '' : 'hidden'}" role="group" aria-label="${section.title}">
          ${visibleItems.map(item => {
            const isActive = activePage === item.page;
            const isAI = item.ai;
            return `
              <button 
                onclick="navigate('${item.page}'); if(window.innerWidth < 768) document.getElementById('mobile-menu')?.classList.add('hidden');"
                ${isActive ? 'aria-current="page"' : ''}
                class="nav-item-btn w-full text-left px-3.5 py-2.5 sm:py-3 rounded-2xl flex items-center transition-all duration-200 group relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-1 ${isActive
                  ? (isAI
                      ? 'nav-item-active bg-teal-500/15 text-teal-900 font-bold border border-teal-500/30 shadow-xs'
                      : 'nav-item-active bg-teal-500/10 text-teal-900 font-bold border border-teal-500/25 shadow-xs')
                  : (isAI
                      ? 'text-slate-700 hover:text-teal-700 hover:bg-teal-50/80 font-semibold'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100/80 font-medium')
                }"
              >
                <span class="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 transition-all ${isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : (isAI 
                      ? 'bg-teal-500/10 text-teal-600 group-hover:bg-teal-500/20 group-hover:scale-105' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:scale-105')
                }">
                  <i class="fas ${item.icon} text-base"></i>
                </span>
                <span class="text-[13.5px] sm:text-[14px] tracking-tight truncate flex-1 leading-snug">${item.label}</span>
                ${isAI ? '<span class="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 border border-teal-500/20 ml-auto shrink-0">AI</span>' : ''}
                ${item.page === 'pengumuman' ? '<span class="w-2 h-2 bg-amber-500 rounded-full ml-auto shrink-0 animate-pulse"></span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Mobile Bottom Navigation Bar (App Bar Bawah untuk HP)
function renderMobileBottomNav(activePage) {
  const isLoggedIn = !!state.user;
  const isAIActive = ['rpp', 'kisi', 'slide', 'tts'].includes(activePage);

  return `
    <!-- Mobile Bottom Navigation Bar (Fixed Ergonomic Thumb Bar) -->
    <nav 
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none"
      aria-label="Navigasi Bawah Mobile"
    >
      <!-- 1. Beranda -->
      <button 
        onclick="navigate('home')" 
        class="flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-90 cursor-pointer ${activePage === 'home' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'}"
      >
        <div class="relative flex items-center justify-center w-6 h-6">
          <i class="fas fa-home text-lg"></i>
          ${activePage === 'home' ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full"></span>' : ''}
        </div>
        <span class="text-[10px] mt-1 tracking-tight leading-none">Beranda</span>
      </button>

      <!-- 2. Presensi / Kegiatan -->
      <button 
        onclick="${isLoggedIn ? `navigate('absensi')` : `navigate('login')`}" 
        class="flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-90 cursor-pointer ${activePage === 'absensi' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'}"
      >
        <div class="relative flex items-center justify-center w-6 h-6">
          <i class="fas fa-qrcode text-lg"></i>
          ${activePage === 'absensi' ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full"></span>' : ''}
        </div>
        <span class="text-[10px] mt-1 tracking-tight leading-none">Presensi</span>
      </button>

      <!-- 3. Elevated Floating Action: Asisten AI Hub -->
      <div class="flex-1 flex flex-col items-center justify-center relative -top-3.5">
        <button 
          id="btn-mobile-ai-sheet"
          onclick="window.toggleMobileAiSheet()" 
          class="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/35 border-4 border-[#f8fdfd] active:scale-90 transition-transform duration-200 cursor-pointer group relative ${isAIActive ? 'ring-2 ring-teal-500 ring-offset-2' : ''}"
          title="Buka Asisten AI Pendidik"
          aria-label="Asisten AI Pendidik"
        >
          <i class="fas fa-wand-magic-sparkles text-lg group-hover:rotate-12 transition-transform duration-300"></i>
          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
        </button>
        <span class="text-[9.5px] font-extrabold text-teal-700 tracking-tight leading-none mt-0.5">Asisten AI</span>
      </div>

      <!-- 4. Bank Materi -->
      <button 
        onclick="navigate('materi')" 
        class="flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-90 cursor-pointer ${activePage === 'materi' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'}"
      >
        <div class="relative flex items-center justify-center w-6 h-6">
          <i class="fas fa-book-open text-lg"></i>
          ${activePage === 'materi' ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full"></span>' : ''}
        </div>
        <span class="text-[10px] mt-1 tracking-tight leading-none">Materi</span>
      </button>

      <!-- 5. Profil / Akun -->
      <button 
        onclick="${isLoggedIn ? `navigate('profile')` : `navigate('login')`}" 
        class="flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-90 cursor-pointer ${activePage === 'profile' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'}"
      >
        <div class="relative flex items-center justify-center w-6 h-6">
          ${isLoggedIn && state.user?.foto_url ? `
            <img src="${state.user.foto_url}" class="w-5 h-5 rounded-full object-cover border ${activePage === 'profile' ? 'border-teal-600' : 'border-slate-300'}" alt="Foto">
          ` : `
            <i class="fas fa-user-circle text-lg"></i>
          `}
          ${activePage === 'profile' ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full"></span>' : ''}
        </div>
        <span class="text-[10px] mt-1 tracking-tight leading-none">${isLoggedIn ? 'Profil' : 'Masuk'}</span>
      </button>
    </nav>
  `;
}

// Mobile AI Bottom Sheet (Lembar Aksi Cepat 4 Modul AI di HP)
function renderMobileAiSheet(activePage) {
  return `
    <!-- Mobile AI Action Sheet Modal Overlay -->
    <div 
      id="mobile-ai-action-sheet" 
      class="hidden md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onclick="window.closeMobileAiSheet()"
    >
      <div 
        class="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-slide-up border-t border-slate-200/80 max-h-[85vh] overflow-y-auto"
        onclick="event.stopPropagation()"
      >
        <!-- Pull Handle -->
        <div class="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-4"></div>

        <!-- Header -->
        <div class="flex items-center justify-between mb-4 px-1">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-700 flex items-center justify-center text-sm">
              <i class="fas fa-wand-magic-sparkles"></i>
            </span>
            <div>
              <h3 class="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">Asisten AI Pendidik</h3>
              <p class="text-[10.5px] text-slate-400 font-medium leading-tight">Pilih modul otomatisasi Kurikulum Merdeka</p>
            </div>
          </div>
          <button 
            onclick="window.closeMobileAiSheet()" 
            class="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <!-- 4 AI Generator Cards Grid -->
        <div class="grid grid-cols-2 gap-2.5 mb-4">
          <!-- 1. RPP & Modul Ajar -->
          <button 
            onclick="window.closeMobileAiSheet(); navigate('rpp');" 
            class="text-left p-3.5 rounded-2xl border transition-all active:scale-95 cursor-pointer ${activePage === 'rpp' ? 'bg-teal-50/90 border-teal-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 hover:bg-teal-50/40 hover:border-teal-300'}"
          >
            <div class="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-700 flex items-center justify-center text-sm mb-2.5 shadow-2xs">
              <i class="fas fa-magic"></i>
            </div>
            <span class="block text-xs font-bold text-slate-900 leading-tight mb-0.5">Buat RPP</span>
            <span class="block text-[10px] text-slate-500 font-normal leading-snug">Modul Ajar Berdiferensiasi</span>
          </button>

          <!-- 2. Asesmen & Kisi-Kisi -->
          <button 
            onclick="window.closeMobileAiSheet(); navigate('kisi');" 
            class="text-left p-3.5 rounded-2xl border transition-all active:scale-95 cursor-pointer ${activePage === 'kisi' ? 'bg-emerald-50/90 border-emerald-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 hover:bg-emerald-50/40 hover:border-emerald-300'}"
          >
            <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center text-sm mb-2.5 shadow-2xs">
              <i class="fas fa-list-check"></i>
            </div>
            <span class="block text-xs font-bold text-slate-900 leading-tight mb-0.5">Buat Asesmen</span>
            <span class="block text-[10px] text-slate-500 font-normal leading-snug">Soal HOTS & Kisi-Kisi</span>
          </button>

          <!-- 3. Slide Studio -->
          <button 
            onclick="window.closeMobileAiSheet(); navigate('slide');" 
            class="text-left p-3.5 rounded-2xl border transition-all active:scale-95 cursor-pointer ${activePage === 'slide' ? 'bg-sky-50/90 border-sky-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 hover:bg-sky-50/40 hover:border-sky-300'}"
          >
            <div class="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center text-sm mb-2.5 shadow-2xs">
              <i class="fas fa-file-powerpoint"></i>
            </div>
            <span class="block text-xs font-bold text-slate-900 leading-tight mb-0.5">Slide Presentasi</span>
            <span class="block text-[10px] text-slate-500 font-normal leading-snug">Slide Mengajar Interaktif</span>
          </button>

          <!-- 4. TTS Edukatif -->
          <button 
            onclick="window.closeMobileAiSheet(); navigate('tts');" 
            class="text-left p-3.5 rounded-2xl border transition-all active:scale-95 cursor-pointer ${activePage === 'tts' ? 'bg-purple-50/90 border-purple-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 hover:bg-purple-50/40 hover:border-purple-300'}"
          >
            <div class="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-700 flex items-center justify-center text-sm mb-2.5 shadow-2xs">
              <i class="fas fa-puzzle-piece"></i>
            </div>
            <span class="block text-xs font-bold text-slate-900 leading-tight mb-0.5">Teka-Teki Silang</span>
            <span class="block text-[10px] text-slate-500 font-normal leading-snug">Game & LKPD Cetak Siswa</span>
          </button>
        </div>

        <!-- Quick Close Button -->
        <button 
          onclick="window.closeMobileAiSheet()" 
          class="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  `;
}

// Main Render Function
async function render() {
  window.renderApp = render;
  const app = document.getElementById('app');
  if (!app) return;

  let content = '';
  const page = state.currentPage;

  try {
    // Check authentication for protected pages
    if (protectedPages.includes(page) && !state.user) {
      showToast('Silakan login terlebih dahulu', 'warning');
      // announce disabled
      navigate('login');
      return;
    }

    // Check admin panel role for admin pages
    if (adminPages.includes(page) && !['super_admin', 'admin', 'operator'].includes(state.user?.role || '')) {
      showToast('Halaman ini hanya untuk admin atau operator', 'error');
      // announce disabled
      navigate('home');
      return;
    }

    // Get page renderer
    const pageRenderer = pages[page] || pages.home;

    // Show loading before chunk load ONLY if it's a page change or first time
    const isFirstRun = !app.dataset.rendered;
    const isPageChange = app.dataset.currentPage !== page;

    if (isFirstRun || isPageChange) {
      showLoading('Memuat halaman...');
    }

    // Render page (may be async)
    content = await pageRenderer();

    hideLoading();

    // Mark as rendered
    app.dataset.rendered = 'true';
    app.dataset.currentPage = page;

    // Announce page change to screen readers
    const pageTitles = {
      home: 'Beranda',
      login: 'Halaman Login',
      profile: 'Profil Saya',
      surat: 'Generator Surat',
      proker: 'Program Kerja',
      absensi: 'Absensi',
      materi: 'Materi Pembelajaran',
      guru: 'Direktori Guru',
      forum: 'Forum Diskusi',
      pengumuman: 'Pengumuman',
      admin: 'Panel Admin',
      'reset-password': 'Reset Password',
      laporan: 'Laporan Kegiatan',
      notifications: 'Pusat Notifikasi',
      rpp: 'RPM Generator',
      kisi: 'Asesmen',
      slide: 'Slide Generator',
      tts: 'Teka-Teki Silang'
    };
    // announce disabled

    // Initialize page-specific logic
    if (page === 'reset-password') {
      const { initResetPassword } = await loadPageModule('reset-password');
      setTimeout(() => initResetPassword(), 100);
    }
    if (page === 'kalender') {
      const { initKalender } = await loadPageModule('kalender');
      if (initKalender) setTimeout(() => initKalender(), 100);
    }
    if (page === 'rpp') {
      const { initRpp } = await loadPageModule('rpp');
      setTimeout(() => initRpp(), 100);
    }
    if (page === 'kisi') {
      const { initKisi } = await loadPageModule('kisi');
      setTimeout(() => initKisi(), 100);
    }
    if (page === 'slide') {
      const { initSlide } = await loadPageModule('slide');
      setTimeout(() => initSlide(), 100);
    }
    if (page === 'tts') {
      const { initTts } = await loadPageModule('tts');
      setTimeout(() => initTts(), 100);
    }
    if (page === 'notifications') {
      const { initNotifications } = await loadPageModule('notifications');
      setTimeout(() => initNotifications(), 100);
    }

  } catch (e) {
    console.error('Render error:', e);
    hideLoading(); // Pastikan loading overlay hilang saat error
    content = `
      <div class="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-4 text-center animate-fade-in">
        <div class="relative mb-8">
          <div class="w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center z-10 relative">
             <i class="fas fa-exclamation-triangle text-5xl text-red-500"></i>
          </div>
          <div class="absolute top-0 left-0 w-full h-full bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        
        <h2 class="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-3">Terjadi Kesalahan</h2>
        <p class="text-[var(--color-text-secondary)] mb-8 max-w-md leading-relaxed">
          Maaf, kami tidak dapat memuat halaman yang Anda minta. <br>
          <span class="text-xs font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded mt-2 inline-block shadow-sm">${e.message || 'Unknown Error'}</span>
        </p>
        
        <div class="flex gap-4">
          <button onclick="window.location.reload()" class="btn bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-[var(--color-text-primary)] hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
            <i class="fas fa-sync-alt mr-2"></i>Muat Ulang
          </button>
          <button onclick="navigate('home')" class="btn btn-primary">
            <i class="fas fa-home mr-2"></i>Ke Beranda
          </button>
        </div>
      </div>
    `;
  }

  // Build final HTML
  const isAuthPage = page === 'login' || page === 'reset-password';
  const isCustomLayout = customLayoutPages.includes(page);

  const pageMetadata = {
    home: { title: state.user && !state.showPublicLanding ? 'Ruang Kerja Pendidik' : 'Beranda Utama', icon: 'fa-home', category: 'Dasbor' },
    rpp: { title: 'AI RPP & Modul Ajar Generator', icon: 'fa-magic', category: 'Asisten AI' },
    kisi: { title: 'Asesmen & Kisi-Kisi HOTS/AKM', icon: 'fa-list-check', category: 'Asisten AI' },
    slide: { title: 'Slide Studio AI Presentasi', icon: 'fa-file-powerpoint', category: 'Asisten AI' },
    tts: { title: 'Teka-Teki Silang Edukatif', icon: 'fa-puzzle-piece', category: 'Asisten AI' },
    absensi: { title: 'Presensi & Absensi Kegiatan', icon: 'fa-clipboard-check', category: 'Kegiatan' },
    materi: { title: 'Bank Materi & Modul Ajar', icon: 'fa-book-open', category: 'Akademik' },
    guru: { title: 'Direktori Pendidik Gugus 3', icon: 'fa-users', category: 'Komunitas' },
    forum: { title: 'Forum Kolaborasi Guru', icon: 'fa-comments', category: 'Komunitas' },
    pengumuman: { title: 'Papan Pengumuman Resmi', icon: 'fa-bullhorn', category: 'Warta' },
    kalender: { title: 'Kalender Kegiatan KKG', icon: 'fa-calendar-alt', category: 'Agenda' },
    profile: { title: 'Profil & Data Pendidik', icon: 'fa-user-cog', category: 'Akun' },
    notifications: { title: 'Pusat Notifikasi', icon: 'fa-bell', category: 'Akun' },
    admin: { title: 'Control Center Admin', icon: 'fa-cog', category: 'Administrasi' },
    surat: { title: 'Generator Surat Dinas KKG', icon: 'fa-envelope-open-text', category: 'Administrasi' },
    proker: { title: 'Program Kerja KKG', icon: 'fa-tasks', category: 'Administrasi' },
    laporan: { title: 'Laporan Kegiatan KKG', icon: 'fa-file-contract', category: 'Administrasi' },
    'reset-password': { title: 'Atur Ulang Password', icon: 'fa-key', category: 'Akun' },
    login: { title: 'Masuk Portal', icon: 'fa-sign-in-alt', category: 'Autentikasi' },
  };
  const currentMeta = pageMetadata[page] || { title: 'Portal KKG Gugus 3', icon: 'fa-graduation-cap', category: 'Aplikasi' };

  if (isAuthPage || isCustomLayout) {
    // Auth pages and Admin pages handle their own full layout
    app.innerHTML = content;
  } else {
    // Main layout
    app.innerHTML = `
      <div class="flex h-screen bg-[#f8fdfd] transition-colors duration-500 overflow-hidden selection:bg-teal-500/30">
        <!-- Organic BG Blobs -->
        <div class="fixed top-0 right-0 w-[60%] h-[80%] bg-teal-500/10 -z-10 rounded-bl-[100px] opacity-60 blur-3xl pointer-events-none"></div>
        <div class="fixed -bottom-20 -left-20 w-[40%] h-[60%] bg-teal-500/5 -z-10 rounded-tr-[100px] blur-3xl pointer-events-none"></div>

        <!-- Sidebar (Desktop) -->
        <aside class="hidden md:flex flex-col w-[275px] lg:w-[285px] bg-white border-r border-slate-200/80 z-[100] shadow-sm shrink-0 h-screen">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
             <div class="w-10 h-10 flex items-center justify-center transition-transform duration-300 hover:scale-105 shrink-0">
                <img 
                  src="/static/img/logo-kkg.png?v=${window.__APP_VERSION__}" 
                  alt="Logo KKG" 
                  class="w-full h-full object-contain drop-shadow-xs"
                >
             </div>
             <div class="min-w-0">
                <h1 class="text-[13px] font-black text-teal-600 uppercase tracking-tight leading-tight">KKG Gugus 3</h1>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-tight">Wanayasa</span>
             </div>
          </div>

          <nav class="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-1 flex flex-col justify-between">
            <div id="sidebar-nav-links" class="space-y-1">
              ${renderNavLinks(page)}
            </div>

            <!-- Proportional Bottom Quality Card (Fills empty space harmoniously) -->
            <div class="mt-4 px-0.5 pb-1">
              ${state.user ? `
                <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50/20 border border-slate-200/80 shadow-2xs">
                  <div class="flex items-center gap-2.5 mb-2">
                    <span class="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xs shadow-2xs shrink-0">
                      <i class="fas fa-school"></i>
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="text-[11.5px] font-extrabold text-slate-800 leading-tight truncate">${escapeHtml(state.user?.sekolah || 'Gugus 3 Wanayasa')}</p>
                      <p class="text-[9.5px] text-teal-600 font-bold leading-tight">Pendidik Terdaftar</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-[10.5px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                    <span class="font-medium">T.A 2025/2026</span>
                    <span class="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Aktif
                    </span>
                  </div>
                </div>
              ` : `
                <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50/20 border border-slate-200/80 shadow-2xs">
                  <div class="flex items-center gap-2.5 mb-1.5">
                    <span class="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xs shadow-2xs shrink-0">
                      <i class="fas fa-award"></i>
                    </span>
                    <div>
                      <p class="text-[11.5px] font-extrabold text-slate-800 leading-tight">Kurikulum Merdeka</p>
                      <p class="text-[9.5px] text-teal-600 font-bold leading-tight">Standar BSKAP 2025</p>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed font-normal mb-2.5">Platform resmi KKG Gugus 3 Kecamatan Wanayasa.</p>
                  <button 
                    onclick="window.openShowcaseModal ? window.openShowcaseModal('rpp') : navigate('home')" 
                    class="w-full py-2 px-3 rounded-xl bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200/80 hover:border-teal-200 text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i class="fas fa-sparkles text-teal-600 text-xs"></i>
                    <span>Lihat Simulasi AI</span>
                  </button>
                </div>
              `}
            </div>
          </nav>

          <div class="p-3.5 px-4 border-t border-slate-100/80 shrink-0 bg-slate-50/50">
            ${state.user ? `
              <div class="flex items-center justify-between px-1 text-slate-400">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
                  <span class="text-xs font-bold text-slate-600 tracking-tight">${escapeHtml(state.tenant?.nama || 'KKG Gugus 3')}</span>
                </div>
                <span class="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">v2.6</span>
              </div>
            ` : `
              <button onclick="navigate('login')" class="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-teal-600 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                <i class="fas fa-sign-in-alt text-xs"></i>
                <span>Masuk Akun</span>
              </button>
            `}
          </div>
        </aside>

        <!-- Mobile Header & Main Content -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <!-- Desktop Top Navigation Header -->
          <header class="hidden md:flex items-center justify-between h-20 px-8 lg:px-10 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 z-30 shrink-0 shadow-2xs">
            <!-- Left: Breadcrumb / Active Page context -->
            <div class="flex items-center gap-3.5">
              <span class="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20 flex items-center justify-center text-sm shadow-2xs">
                <i class="fas ${currentMeta.icon}"></i>
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">${currentMeta.category}</span>
                  <span class="text-slate-300">•</span>
                  <span class="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">KKG Gugus 3 Wanayasa</span>
                </div>
                <h2 class="text-base font-black text-slate-900 tracking-tight leading-tight">${currentMeta.title}</h2>
              </div>
            </div>

            <!-- Right: Context chips & User Profile Quick Actions -->
            <div class="flex items-center gap-4">
              <!-- Date Chip -->
              <div class="hidden xl:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/90 text-slate-600 text-xs font-semibold border border-slate-200/60">
                <i class="far fa-calendar-alt text-teal-600"></i>
                <span>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>

              <!-- AI Assistant Status Chip -->
              <div class="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/90 text-teal-800 text-xs font-bold border border-teal-200/60 shadow-2xs">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>AI Perangkat Ajar</span>
              </div>

              <!-- Notifications Bell -->
              ${state.user ? `
                <div class="p-1 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-teal-400/50 transition-colors">
                  ${renderNotificationBell()}
                </div>
              ` : ''}

              <!-- User Profile Chip with Dropdown -->
              ${state.user ? `
                <div class="relative" id="user-profile-menu-container">
                  <button 
                    id="user-profile-btn"
                    onclick="window.toggleUserDropdown && window.toggleUserDropdown(event)" 
                    class="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500/40 hover:shadow-md transition-all cursor-pointer group shadow-2xs focus:outline-none"
                    title="Menu Akun & Profil Pendidik"
                  >
                    ${avatar(state.user.nama, 'sm', state.user.foto_url)}
                    <div class="hidden sm:block text-left min-w-0">
                      <p class="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition-colors leading-tight truncate max-w-[130px]">${escapeHtml(state.user.nama)}</p>
                      <p class="text-[9.5px] text-slate-400 font-semibold capitalize leading-tight">${escapeHtml(state.user.role === 'super_admin' ? 'Super Admin' : (state.user.role === 'admin' ? 'Administrator' : (state.user.role === 'operator' ? 'Operator' : 'Pendidik')))}</p>
                    </div>
                    <i id="user-dropdown-arrow" class="fas fa-chevron-down text-[9px] text-slate-400 group-hover:text-teal-600 transition-transform duration-200"></i>
                  </button>

                  <!-- Popover Dropdown Menu -->
                  <div 
                    id="user-dropdown-menu" 
                    class="hidden absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 animate-fade-in divide-y divide-slate-100"
                  >
                    <!-- User Header -->
                    <div class="px-4 py-2.5">
                      <div class="flex items-center gap-3">
                        ${avatar(state.user.nama, 'md', state.user.foto_url)}
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-bold text-slate-900 truncate leading-snug">${escapeHtml(state.user.nama)}</p>
                          <p class="text-[10.5px] text-slate-400 truncate leading-tight">${escapeHtml(state.user.email || 'Pendidik KKG')}</p>
                          <span class="inline-block mt-1 text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/80">${escapeHtml(state.user.role === 'super_admin' ? 'Super Admin' : (state.user.role === 'admin' ? 'Administrator' : (state.user.role === 'operator' ? 'Operator' : 'Pendidik')))}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Navigation Items -->
                    <div class="p-1.5 space-y-0.5">
                      <button 
                        onclick="window.closeUserDropdown(); navigate('profile');" 
                        class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span class="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><i class="fas fa-id-card text-xs"></i></span>
                        <div class="flex-1 min-w-0">
                          <span class="block text-xs font-bold text-slate-800">Profil & Data Pendidik</span>
                          <span class="block text-[10px] text-slate-400 font-normal truncate">Identitas, NIP & Unit Sekolah</span>
                        </div>
                      </button>

                      ${['super_admin', 'admin', 'operator'].includes(state.user?.role || '') ? `
                        <button 
                          onclick="window.closeUserDropdown(); navigate('admin');" 
                          class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <span class="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><i class="fas fa-cog text-xs"></i></span>
                          <div class="flex-1 min-w-0">
                            <span class="block text-xs font-bold text-slate-800">Panel Kontrol Admin</span>
                            <span class="block text-[10px] text-slate-400 font-normal truncate">Kelola guru, sekolah & log</span>
                          </div>
                        </button>
                      ` : ''}
                    </div>

                    <!-- Logout -->
                    <div class="pt-1 px-1.5">
                      <button 
                        onclick="window.closeUserDropdown(); logout();" 
                        class="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span class="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0"><i class="fas fa-sign-out-alt text-xs"></i></span>
                        <span>Keluar Aplikasi</span>
                      </button>
                    </div>
                  </div>
                </div>
              ` : `
                <button onclick="navigate('login')" class="px-5 py-2.5 bg-slate-900 hover:bg-teal-600 text-white rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer">
                  <i class="fas fa-sign-in-alt text-xs"></i>
                  <span>Masuk</span>
                </button>
              `}
            </div>
          </header>

          <!-- Mobile Top App Bar -->
          <header class="md:hidden sticky top-0 left-0 right-0 z-30 px-4 py-2.5 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between shadow-2xs pt-[max(0.6rem,env(safe-area-inset-top))]">
             <div class="flex items-center gap-2.5 cursor-pointer" onclick="navigate('home')">
                <div class="w-8 h-8 flex items-center justify-center shrink-0">
                   <img src="/static/img/logo-kkg.png?v=${window.__APP_VERSION__}" class="w-full h-full object-contain drop-shadow-2xs" alt="Logo">
                </div>
                <div>
                   <h1 class="text-xs font-black text-teal-600 uppercase tracking-tight leading-none">KKG Gugus 3</h1>
                   <span class="text-[9px] font-bold text-slate-400 leading-none block truncate max-w-[140px] mt-0.5">${currentMeta.title}</span>
                </div>
             </div>
             <div class="flex items-center gap-2">
                ${state.user ? `
                  <div class="p-1 rounded-xl bg-slate-50 border border-slate-200/60">
                    ${renderNotificationBell()}
                  </div>
                ` : ''}
                <button 
                  onclick="document.getElementById('mobile-menu').classList.remove('hidden')" 
                  class="w-9 h-9 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  title="Buka Menu Lengkap"
                  aria-label="Menu Lengkap"
                >
                  <i class="fas fa-bars text-sm"></i>
                </button>
             </div>
          </header>

          <!-- Main Content Area -->
          <main class="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth flex flex-col relative bg-[#f8fdfd]" id="main-content">
            <!-- Background Decoration -->
            <div class="absolute top-0 right-0 w-[60%] h-[500px] bg-gradient-to-bl from-[rgba(38,148,148,0.04)] to-transparent rounded-bl-[100px] pointer-events-none z-0"></div>
            
            <div class="${page === 'home' && (!state.user || state.showPublicLanding) ? 'w-full animate-fade-in flex-1 z-10 relative pb-28 md:pb-8' : 'max-w-7xl mx-auto w-full px-3.5 py-4 sm:px-6 sm:py-6 md:p-10 pb-28 md:pb-8 animate-fade-in flex-1 z-10 relative'}">
              ${content}
            </div>
          </main>

          <!-- Mobile Bottom Navigation Bar -->
          ${renderMobileBottomNav(page)}

          <!-- Mobile AI Action Sheet Modal -->
          ${renderMobileAiSheet(page)}
        </div>

        <!-- Mobile Menu Overlay -->
        <div id="mobile-menu" class="hidden fixed inset-0 z-50 md:hidden animate-fade-in">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onclick="document.getElementById('mobile-menu').classList.add('hidden')"></div>
          <div class="relative bg-white w-[80%] max-w-[300px] h-full shadow-2xl p-8 flex flex-col animate-slide-in-left" onclick="event.stopPropagation()">
            <div class="flex justify-between items-center mb-12">
              <div class="flex items-center gap-3">
                 <div class="w-12 h-12 flex items-center justify-center">
                    <img src="/static/img/logo-kkg.png?v=${window.__APP_VERSION__}" class="w-full h-full object-contain">
                 </div>
                 <h1 class="text-sm font-black text-teal-500 uppercase tracking-tighter">KKG Gugus 3</h1>
              </div>
              <button onclick="document.getElementById('mobile-menu').classList.add('hidden')" class="p-2 text-slate-400 hover:text-slate-600 transition-colors"><i class="fas fa-times text-xl"></i></button>
            </div>
            <nav id="mobile-nav-links" class="flex-1 overflow-y-auto custom-scrollbar">
              ${renderNavLinks(page)}
            </nav>
            <div class="pt-6 mt-8">
                ${state.user ? `
                  <div class="flex items-center gap-3 mb-4 p-3 bg-[var(--color-bg-tertiary)] rounded-2xl">
                      ${avatar(state.user.nama, 'sm', state.user.foto_url)}
                      <div class="min-w-0">
                          <p class="text-sm font-bold text-[var(--color-text-primary)] truncate">${escapeHtml(state.user.nama)}</p>
                      </div>
                  </div>
                  <button onclick="logout()" class="btn w-full bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold">
                    <i class="fas fa-sign-out-alt w-5 mr-2"></i> Keluar
                  </button>
                ` : `
                  <button onclick="navigate('login')" class="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-teal-500 transition-all">
                    <i class="fas fa-sign-in-alt"></i> MASUK AKUN
                  </button>
                `}
            </div>
          </div>
        </div>
      </div>
    `;
  }


  // Scroll to top on page change
  window.scrollTo(0, 0);

  // Initialize Auth page
  if (page === 'login') {
    // Use timeout to ensure DOM is ready
    setTimeout(async () => {
      const { initAuth } = await import('./pages/auth.js');
      initAuth();
    }, 50);
  }
}

// Initialize Router with Render function
initRouter(render);

// Register Service Worker for PWA
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Force update check on every page load
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Never use browser cache for SW file itself
      });
      console.log('✅ Service Worker registered:', registration.scope);

      // Check for updates immediately
      registration.update().catch(() => { });

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - tell it to activate immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            console.log('🔄 New Service Worker version installed, activating...');
          }
        });
      });

      // Listen for controller change (new SW took over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Only auto-reload if the app is still in the early initialization phase
        // to avoid interrupting user activity later
        const isFreshBoot = !document.getElementById('app').dataset.rendered;
        if (isFreshBoot && !window._swReloaded) {
          console.log('🔄 New Service Worker active during boot, refreshing...');
          window._swReloaded = true;
          window.location.reload();
        } else {
          console.log('✅ New Service Worker active in background');
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_UPDATED') {
          console.log(`✅ Service Worker updated to ${event.data.version}`);
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// Utility: Clear all caches (accessible from console: clearAllCaches())
window.clearAllCaches = async function () {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: 'CLEAR_CACHE' });
  }
  // Also clear browser Cache Storage directly
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
  }
  console.log('🗑️ All caches cleared. Reloading...');
  showToast('Cache dibersihkan! Halaman akan dimuat ulang...', 'success');
  setTimeout(() => window.location.reload(), 1000);
};

// App Initialization
async function init() {
  const updateStatus = (msg) => {
    const el = document.getElementById('loading-status');
    if (el) el.textContent = msg;
    console.log(msg);
  };

  const isAbortError = (err) => err && (err.name === 'AbortError' || err.code === 'TIMEOUT');

  const fetchWithTimeout = async (url, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { credentials: 'include', signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  updateStatus('🚀 Initializing KKG Portal...');

  // Initialize Theme, Accessibility, and PWA
  initTheme();
  initA11y();
  registerServiceWorker();

  // Parse initial URL
  const path = window.location.pathname.slice(1);
  const validPages = Object.keys(pages);

  if (path && validPages.includes(path)) {
    state.currentPage = path;
  } else {
    state.currentPage = 'home';
  }

  updateStatus('Syncing session and settings...');

  const sessionPromise = api('/auth/me', { timeout: 4000 })
    .then((res) => {
      if (res.success && res.data?.user) {
        state.user = res.data.user;
        console.log('✅ User session restored:', state.user.nama);
        fetchUnreadCount();
      }
    })
    .catch(() => {
      console.log('ℹ️ No active session');
    });

  const settingsPromise = api('/settings/public', { timeout: 4000 })
    .then((resSettings) => {
      if (resSettings.success && resSettings.data) {
        state.settings = { ...state.settings, ...resSettings.data };
        console.log('✅ Settings loaded');
      }
    })
    .catch(() => {
      console.warn('⚠️ Settings load failed');
    });

  const tenantPromise = api('/tenants/current', { timeout: 4000 })
    .then((resTenant) => {
      if (resTenant.success && resTenant.data) {
        state.tenant = resTenant.data;
        console.log('✅ Tenant loaded:', state.tenant.nama);
      }
    })
    .catch(() => {
      console.warn('ℹ️ Tenant fallback active');
    });

  const csrfPromise = (async () => {
    const csrfCookie = document.cookie.split(';').find(c => c.trim().startsWith('csrf_token='));
    if (csrfCookie) return;
    try {
      await fetchWithTimeout('/api/auth/csrf-token', 3000);
      console.log('✅ CSRF token initialized');
    } catch (e) { }
  })();

  // Wait for all critical background data before first render
  // This prevents the "3x spinner" flicker
  updateStatus('Memuat konten...');
  await Promise.allSettled([sessionPromise, settingsPromise, tenantPromise, csrfPromise]);

  // Finally, render once with all data ready
  await render();

  // Background tasks after first render
  if (state.user) {
    setInterval(() => fetchUnreadCount(), 60000);
  }

  document.addEventListener('notifications-updated', () => {
    const sidebarNav = document.getElementById('sidebar-nav-links') || document.querySelector('aside nav .space-y-1');
    if (sidebarNav) sidebarNav.innerHTML = renderNavLinks(state.currentPage);

    const mobileNav = document.getElementById('mobile-nav-links') || document.querySelector('#mobile-menu nav');
    if (mobileNav) mobileNav.innerHTML = renderNavLinks(state.currentPage);
  });

  console.log('✅ KKG Portal initialized');
}



// Logout handler
window.logout = async function () {
  if (!confirm('Apakah Anda yakin ingin keluar?')) return;

  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout server error:', e);
  }

  state.user = null;
  showToast('Logout berhasil', 'success');

  // Clear any local storage
  if (localStorage.getItem('user')) {
    localStorage.removeItem('user');
  }

  // Redirect
  navigate('home');
};

// Poll notifications every 30s
setInterval(() => {
  if (typeof state !== 'undefined' && state.user) fetchUnreadCount();
}, 30000);

// Start the app
init().catch(e => {
  console.error(e);
  const el = document.getElementById('loading-status');
  if (el) {
    el.textContent = 'Error: ' + e.message;
    el.classList.add('text-red-500');
  }
});

