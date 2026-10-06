import { mountWorkspaceLayout, renderWorkspaceNavigation, renderWorkspaceBottomNav, renderWorkspaceTopNavigation, renderWorkspaceSidebarNavigation, revealWorkspaceSidebarActive } from './layouts/workspace.js';
import { mountFeatureDesign } from './feature-design.js';
import { openUiDialog, closeUiDialog } from './ui-dialog.js';

// Main Entry Point - KKG Portal Digital
import { state } from './state.js';
import { initRouter, navigate, readAdminPanelLocation } from './router.js';
import { api } from './api.js';
import { showToast, showLoading, hideLoading, confirm, avatar, escapeHtml } from './utils.js';

// Components
import { renderNavbar, renderFooter, toggleMobileMenu } from './components.js';

// Theme & Accessibility
import { initTheme, toggleTheme, renderThemeToggle } from './theme.js';
import { applyThemeColor } from './theme-color.js';
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
window.applyThemeColor = applyThemeColor;
window.state = state; // Expose state for inline onclick handlers

// User Profile Dropdown Menu Handlers
window.toggleUserDropdown = function(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('user-dropdown-menu');
  const arrow = document.getElementById('user-dropdown-arrow');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  document.getElementById('user-profile-btn')?.setAttribute('aria-expanded', String(isHidden));
  if (isHidden) {
    menu.classList.remove('hidden');
    if (arrow) arrow.classList.add('rotate-180');
  } else {
    menu.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180');
  }
};

window.closeUserDropdown = function() {
  document.getElementById('user-profile-btn')?.setAttribute('aria-expanded', 'false');
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

// Handle PWA BeforeInstallPrompt (A2HS) & Standalone Detection
let deferredPrompt = null;

window.isPwaStandalone = function() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true || 
         document.referrer.includes('android-app://');
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  document.getElementById('pwa-install-banner')?.remove();
  showToast('Terima kasih! Aplikasi KKG Portal berhasil dipasang di layar utama.', 'success');
});

window.promptPwaInstall = async function(returnFocus) {
  if (window.isPwaStandalone()) {
    showToast('Aplikasi sudah terpasang dan sedang berjalan dalam mode aplikasi penuh.', 'info');
    returnFocus?.focus();
    return;
  }

  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Memasang aplikasi KKG Portal ke layar utama...', 'success');
      }
      deferredPrompt = null;
      document.getElementById('pwa-install-banner')?.remove();
      returnFocus?.focus();
      return;
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
    }
  }

  // Fallback: show interactive step-by-step installation guide modal
  window.openPwaGuideModal(returnFocus);
};

window.openPwaGuideModal = function(returnFocus) {
  const existingModal = document.getElementById('pwa-guide-modal');
  if (existingModal) closeUiDialog(existingModal);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  const modal = document.createElement('div');
  modal.id = 'pwa-guide-modal';
  modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-scale-up relative max-h-[85dvh] overflow-y-auto">
      <button type="button" id="pwa-guide-close" aria-label="Tutup panduan pemasangan" class="absolute top-3 right-3 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white min-w-[44px] min-h-[44px] text-sm cursor-pointer">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>

      <div class="flex items-center gap-3 mb-5">
        <img src="/static/icons/icon-96x96.png" class="w-12 h-12 rounded-2xl shadow-md border border-teal-500/20" alt="Logo KKG">
        <div>
          <h2 id="pwa-guide-title" class="text-base font-black text-slate-900 dark:text-white pr-8">Pasang Aplikasi KKG</h2>
          <p class="text-xs text-teal-600 dark:text-teal-400 font-bold">${escapeHtml(state.settings?.nama_kkg || 'Portal Digital KKG')}</p>
        </div>
      </div>

      <div class="space-y-3.5 mb-6 text-xs text-slate-600 dark:text-slate-300">
        ${isIOS ? `
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-200/50">
            <span class="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
            <p>Buka halaman ini di browser <strong>Safari</strong> pada iPhone/iPad Anda.</p>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-200/50">
            <span class="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
            <p>Ketuk tombol <strong>Bagikan (Share)</strong> <i class="fas fa-arrow-up-from-bracket text-teal-600 mx-1"></i> di bilah bawah browser.</p>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-200/50">
            <span class="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
            <p>Gulir ke bawah, lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</p>
          </div>
        ` : `
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-200/50">
            <span class="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
            <p>Ketuk ikon menu titik tiga (<strong class="text-teal-600 font-bold">⋮</strong>) di pojok kanan atas browser <strong>Google Chrome</strong>.</p>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-200/50">
            <span class="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
            <p>Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</p>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/60 dark:bg-slate-800/60 border border-teal-200/50">
            <span class="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
            <p>Konfirmasi pemasangan untuk menambahkan pintasan KKG ke layar utama.</p>
          </div>
        `}
      </div>

      <div class="flex items-center gap-2">
        <button type="button" id="pwa-guide-done" class="w-full min-h-[44px] py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer">
          Tutup Panduan
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeGuide = () => closeUiDialog(modal);
  modal.querySelector('#pwa-guide-close').addEventListener('click', closeGuide);
  modal.querySelector('#pwa-guide-done').addEventListener('click', closeGuide);
  modal.addEventListener('click', event => { if (event.target === modal) closeGuide(); });
  openUiDialog(modal, { labelledBy: 'pwa-guide-title', initialFocus: '#pwa-guide-close', returnFocus, onClose: () => modal.remove() });
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
  sertifikat: async () => (await loadPageModule('sertifikat')).renderSertifikat(),
  verifikasi: async () => (await loadPageModule('sertifikat')).renderVerifikasi(),
  materi: async () => (await loadPageModule('materi')).renderMateri(),
  guru: async () => (await loadPageModule('guru')).renderGuru(),
  forum: async () => (await loadPageModule('forum')).renderForum(),
  pengumuman: async () => (await loadPageModule('pengumuman')).renderPengumuman(),
  admin: async () => (await loadPageModule('admin')).renderAdmin(),
  kalender: async () => (await loadPageModule('kalender')).renderKalender(),
  'reset-password': async () => (await loadPageModule('reset-password')).renderResetPassword(),
  laporan: async () => (await loadPageModule('laporan')).renderLaporan(),
  notifications: async () => (await loadPageModule('notifications')).renderNotifications(),
  'analisis-cp': async () => (await loadPageModule('analisis-cp')).renderAnalisisCp(),
  'program-sekolah': async () => (await loadPageModule('program-sekolah')).renderProgramSekolah(),
  rpp: async () => (await loadPageModule('rpp')).renderRpp(),
  kisi: async () => (await loadPageModule('kisi')).renderKisi(),
  slide: async () => (await loadPageModule('slide')).renderSlide(),
  tts: async () => (await loadPageModule('games')).renderGames({ tab: 'tts' }),
  games: async () => (await loadPageModule('games')).renderGames(),
  'privacy-policy': async () => (await loadPageModule('legal')).renderPrivacyPolicy(),
  privacy: async () => (await loadPageModule('legal')).renderPrivacyPolicy(),
  terms: async () => (await loadPageModule('legal')).renderTermsOfService(),
  'terms-of-service': async () => (await loadPageModule('legal')).renderTermsOfService(),
};

// Pages that have their own full layout (no main wrapper)
const customLayoutPages = ['privacy-policy', 'privacy', 'terms', 'terms-of-service', 'verifikasi'];

// Protected pages (require authentication)
const protectedPages = ['surat', 'proker', 'absensi', 'profile', 'notifications', 'sertifikat'];
const adminPages = ['admin', 'program-sekolah'];

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
    title: 'Perangkat ajar',
    icon: 'fa-book-open',
    isAI: true,
    badgeText: null,
    defaultOpen: true,
    items: [
      { page: 'analisis-cp', label: 'Analisis CP', icon: 'fa-book-bookmark', public: true, ai: true },
      { page: 'program-sekolah', label: 'Program Sekolah', icon: 'fa-file-lines', admin: true, ai: true, beta: true },
      { page: 'rpp', label: 'Buat RPP', icon: 'fa-file-lines', public: true, ai: true },
      { page: 'kisi', label: 'Buat Asesmen', icon: 'fa-list-check', public: true, ai: true },
      { page: 'slide', label: 'Slide Presentasi', icon: 'fa-file-powerpoint', public: true, ai: true },
      { page: 'games', label: 'Game Edukasi', icon: 'fa-gamepad', public: true, ai: true },
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
      { page: 'sertifikat', label: 'Sertifikat KKG', icon: 'fa-certificate', auth: true },
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

function renderNavLinks(activePage, surface = 'desktop') {
  return renderWorkspaceNavigation(navSections, activePage, window.__navSectionState, surface);
}

// Mobile Bottom Navigation Bar (App Bar Bawah untuk HP)
function renderMobileBottomNav(activePage) {
  return renderWorkspaceBottomNav(activePage);
}

// Mobile AI Bottom Sheet (Lembar Aksi Cepat 4 Modul AI di HP)
function renderMobileAiSheet(activePage) {
  const isAdminPanelUser = ['super_admin', 'admin', 'operator'].includes(state.user?.role || '');
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

        <!-- AI Generator Cards Grid -->
        <div class="grid grid-cols-2 gap-2.5 mb-4">
          <!-- 0. Analisis CP, TP, ATP -->
          <button 
            onclick="window.closeMobileAiSheet(); navigate('analisis-cp');" 
            class="text-left p-3.5 rounded-2xl border transition-all active:scale-95 cursor-pointer col-span-2 ${activePage === 'analisis-cp' ? 'bg-indigo-50/90 border-indigo-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 hover:bg-indigo-50/40 hover:border-indigo-300'}"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center text-sm shadow-2xs shrink-0">
                <i class="fas fa-book-bookmark"></i>
              </div>
              <div>
                <span class="block text-xs font-bold text-slate-900 leading-tight mb-0.5">Analisis CP, TP & ATP</span>
                <span class="block text-[10px] text-slate-500 font-normal leading-snug">Ekstrak Buku PDF ke CP/TP/ATP Resmi BSKAP</span>
              </div>
            </div>
          </button>

          <!-- 0b. Program Sekolah Universal (AI) (Khusus Admin/Operator) -->
          ${isAdminPanelUser ? `
          <button 
            onclick="window.closeMobileAiSheet(); navigate('program-sekolah');" 
            class="text-left p-3.5 rounded-2xl border transition-all active:scale-95 cursor-pointer col-span-2 ${activePage === 'program-sekolah' ? 'bg-indigo-50/90 border-indigo-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 hover:bg-indigo-50/40 hover:border-indigo-300'}"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center text-sm shadow-2xs shrink-0">
                <i class="fas fa-file-lines"></i>
              </div>
              <div>
                <span class="block text-xs font-bold text-slate-900 leading-tight mb-0.5">Program Sekolah (AI)</span>
                <span class="block text-[10px] text-slate-500 font-normal leading-snug">Kokurikuler Profil Lulusan, 7 KAIH, HBG, dll.</span>
              </div>
            </div>
          </button>
          ` : ''}

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

          <!-- 4. Game Edukasi & TTS -->
          <button 
            onclick="window.closeMobileAiSheet(); navigate('games');" 
            class="text-left p-3.5 rounded-2xl border transition-all active:scale-95 cursor-pointer ${['games', 'tts'].includes(activePage) ? 'bg-purple-50/90 border-purple-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 hover:bg-purple-50/40 hover:border-purple-300'}"
          >
            <div class="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-700 flex items-center justify-center text-sm mb-2.5 shadow-2xs">
              <i class="fas fa-gamepad"></i>
            </div>
            <span class="block text-xs font-bold text-slate-900 leading-tight mb-0.5">Game Edukasi</span>
            <span class="block text-[10px] text-slate-500 font-normal leading-snug">TTS & Game Sentuh IFP</span>
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
  closeUiDialog();
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
      showLoading('Memuat halaman...', '', { scope: 'page' });
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
      tts: 'Teka-Teki Silang',
      games: 'Game Edukasi'
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
    if (page === 'analisis-cp') {
      const { initAnalisisCp } = await loadPageModule('analisis-cp');
      if (initAnalisisCp) setTimeout(() => initAnalisisCp(), 100);
    }
    if (page === 'program-sekolah') {
      const { initProgramSekolah } = await loadPageModule('program-sekolah');
      if (initProgramSekolah) setTimeout(() => initProgramSekolah(), 100);
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
    if (page === 'tts' || page === 'games') {
      const { initGames } = await loadPageModule('games');
      setTimeout(() => initGames(), 100);
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

  const namaKkg = state.settings?.nama_kkg || state.tenant?.nama || 'Portal Digital KKG';
  const kecamatan = state.settings?.kecamatan || '';

  const pageMetadata = {
    home: { title: state.user && !state.showPublicLanding ? 'Ruang Kerja Pendidik' : `Beranda ${namaKkg}`, icon: 'fa-home', category: 'Utama' },
    'analisis-cp': { title: 'Analisis CP, TP & ATP (BSKAP 046/2025)', icon: 'fa-book-bookmark', category: 'Asisten AI' },
    'program-sekolah': { title: 'Program Kerja & Pembiasaan Sekolah (AI)', icon: 'fa-file-lines', category: 'Asisten AI' },
    rpp: { title: 'Buat RPP', icon: 'fa-wand-magic-sparkles', category: 'Perangkat ajar' },
    analisis: { title: 'Analisis CP & Capaian', icon: 'fa-chart-pie', category: 'Asisten AI' },
    kktp: { title: 'Kriteria Ketuntasan (KKTP)', icon: 'fa-bullseye', category: 'Asisten AI' },
    prota: { title: 'Program Tahunan (Prota)', icon: 'fa-calendar-alt', category: 'Asisten AI' },
    promes: { title: 'Program Semester (Promes)', icon: 'fa-calendar-check', category: 'Asisten AI' },
    atp: { title: 'Alur Tujuan Pembelajaran', icon: 'fa-project-diagram', category: 'Asisten AI' },
    kisi: { title: 'Buat Asesmen', icon: 'fa-list-check', category: 'Perangkat ajar' },
    lkpd: { title: 'Lembar Kerja Peserta Didik', icon: 'fa-file-signature', category: 'Asisten AI' },
    rubrik: { title: 'Rubrik Penilaian Berjenjang', icon: 'fa-tasks', category: 'Asisten AI' },
    slide: { title: 'Buat slide', icon: 'fa-file-powerpoint', category: 'Perangkat ajar' },
    games: { title: 'Pusat Game Edukasi Interaktif IFP', icon: 'fa-gamepad', category: 'Asisten AI' },
    tts: { title: 'Teka-Teki Silang Edukatif', icon: 'fa-puzzle-piece', category: 'Asisten AI' },
    absensi: { title: 'Presensi & Absensi Kegiatan', icon: 'fa-clipboard-check', category: 'Kegiatan' },
    materi: { title: 'Bank Materi & Modul Ajar', icon: 'fa-book-open', category: 'Akademik' },
    guru: { title: 'Direktori Pendidik', icon: 'fa-users', category: 'Komunitas' },
    forum: { title: 'Forum Kolaborasi Guru', icon: 'fa-comments', category: 'Komunitas' },
    pengumuman: { title: 'Papan Pengumuman Resmi', icon: 'fa-bullhorn', category: 'Warta' },
    kalender: { title: 'Kalender Kegiatan KKG', icon: 'fa-calendar-alt', category: 'Agenda' },
    profile: { title: 'Profil & Data Pendidik', icon: 'fa-user-cog', category: 'Akun' },
    notifications: { title: 'Pusat Notifikasi', icon: 'fa-bell', category: 'Akun' },
    admin: { title: 'Panel kontrol', icon: 'fa-cog', category: 'Administrasi' },
    surat: { title: 'Generator Surat Dinas KKG', icon: 'fa-envelope-open-text', category: 'Administrasi' },
    proker: { title: 'Program Kerja KKG', icon: 'fa-tasks', category: 'Administrasi' },
    laporan: { title: 'Laporan Kegiatan KKG', icon: 'fa-file-contract', category: 'Administrasi' },
    'reset-password': { title: 'Atur Ulang Password', icon: 'fa-key', category: 'Akun' },
    login: { title: 'Masuk Portal', icon: 'fa-sign-in-alt', category: 'Autentikasi' },
  };
  const currentMeta = pageMetadata[page] || { title: `Portal ${namaKkg}`, icon: 'fa-graduation-cap', category: 'Aplikasi' };

  const isPublicHome = page === 'home' && (!state.user || state.showPublicLanding);

  if (isPublicHome) {
    document.body.classList.add('rk-landing');
    document.title = 'RuangKKG | Asisten AI untuk Guru SD';
  } else {
    document.body.classList.remove('rk-landing');
    if (isCustomLayout) {
      document.title = `${currentMeta.title} — RuangKKG Digital`;
    } else if (isAuthPage) {
      document.title = `${currentMeta.title} — RuangKKG Digital`;
    } else {
      document.title = `${currentMeta.title} — ${namaKkg} | RuangKKG`;
    }
  }

  if (isAuthPage || isCustomLayout || isPublicHome) {
    // Auth pages, legal pages, and Public Landing Page handle their own full layout (NO SIDEBAR)
    app.innerHTML = content;
  } else {
    mountWorkspaceLayout(app, {
      content,
      page,
      meta: currentMeta,
      name: namaKkg,
      topNav: renderWorkspaceTopNavigation(navSections, page),
      sidebarNav: renderWorkspaceSidebarNavigation(navSections, page),
      mobileNav: renderNavLinks(page, 'mobile'),
      bottomNav: renderMobileBottomNav(page),
      aiSheet: renderMobileAiSheet(page),
      notificationBell: state.user ? renderNotificationBell() : ''
    });
  }

    revealWorkspaceSidebarActive();
    mountFeatureDesign(page, app);

  if (page === 'home' && state.user && !state.showPublicLanding) {
    const { initEducatorDashboard } = await loadPageModule('home');
    initEducatorDashboard();
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
  const initialTheme = state.settings?.theme_color || (typeof localStorage !== 'undefined' ? localStorage.getItem('kkg_theme_color') : null) || document.documentElement.getAttribute('data-color-theme') || 'teal';
  applyThemeColor(initialTheme);
  initA11y();
  registerServiceWorker();

  document.addEventListener('settings-updated', (e) => {
    if (e.detail?.theme_color) applyThemeColor(e.detail.theme_color, true);
  });

  // Parse initial URL
  const path = window.location.pathname.slice(1);
  const validPages = Object.keys(pages);

  if (path && validPages.includes(path)) {
    state.currentPage = path;
    if (path === 'admin') state.currentAdminTab = readAdminPanelLocation();
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
        if (state.settings.theme_color) {
          applyThemeColor(state.settings.theme_color, true);
        }
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

  const sekolahPromise = api('/sekolah', { timeout: 4000 })
    .then((resSekolah) => {
      if (resSekolah.success && Array.isArray(resSekolah.data)) {
        state.sekolahList = resSekolah.data;
        console.log(`✅ Loaded ${resSekolah.data.length} schools`);
      }
    })
    .catch(() => {
      console.warn('ℹ️ Schools fallback active');
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
  await Promise.allSettled([sessionPromise, settingsPromise, tenantPromise, sekolahPromise, csrfPromise]);

  // Set dynamic browser page title
  if (!state.user || state.currentPage === 'home') {
    document.title = 'RuangKKG | Asisten AI untuk Guru SD';
  } else {
    const activeOrgName = state.settings?.nama_kkg || state.tenant?.nama || 'Portal KKG';
    document.title = `Portal ${activeOrgName} | RuangKKG`;
  }

  // Bind router handler
  initRouter(render);

  // Finally, render once with all data ready
  await render();

  // Background tasks after first render
  if (state.user) {
    setInterval(() => fetchUnreadCount(), 60000);
  }

  document.addEventListener('notifications-updated', () => {
    const topNav = document.getElementById('workspace-top-navigation');
    if (topNav) {
      window.closeWorkspaceTopMenus();
      topNav.innerHTML = renderWorkspaceTopNavigation(navSections, state.currentPage);
    }
    const sidebarNav = document.getElementById('sidebar-nav-links') || document.querySelector('aside nav .space-y-1');
        if (sidebarNav) {
            sidebarNav.innerHTML = renderWorkspaceSidebarNavigation(navSections, state.currentPage);
            revealWorkspaceSidebarActive();
        }

    const mobileNav = document.getElementById('mobile-nav-links') || document.querySelector('#mobile-menu nav');
    if (mobileNav) mobileNav.innerHTML = renderNavLinks(state.currentPage, 'mobile');
  });

  document.addEventListener('settings-updated', (e) => {
    const newTa = e.detail?.tahun_ajaran || state.settings?.tahun_ajaran || '2026/2027';
    document.querySelectorAll('.current-tahun-ajaran-display').forEach(el => {
      el.textContent = `T.A ${newTa}`;
    });
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

