
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

// Navigation Links Configuration
// Navigation Links Configuration (Reordered for Professional Layout)
const navLinks = [
  // MENU UTAMA
  { page: 'home', label: 'Beranda', icon: 'fa-home', public: true, section: 'Menu Utama' },
  { page: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn', public: true, section: 'Menu Utama' },
  { page: 'kalender', label: 'Kalender', icon: 'fa-calendar-alt', public: true, section: 'Menu Utama' },

  // AKADEMIK & PERANGKAT
  { page: 'materi', label: 'Materi & Bahan Ajar', icon: 'fa-book-open', public: true, section: 'Menu Utama' },
  { page: 'forum', label: 'Forum Diskusi', icon: 'fa-comments', public: true, section: 'Menu Utama' },
  { page: 'guru', label: 'Direktori Guru', icon: 'fa-users', public: true, section: 'Menu Utama' },

  // AI ASSISTANT
  { page: 'rpp', label: 'Buat RPP', icon: 'fa-magic', public: true, section: 'AI Assistant', ai: true },
  { page: 'slide', label: 'Buat Slide', icon: 'fa-file-powerpoint', public: true, section: 'AI Assistant', ai: true },
  { page: 'kisi', label: 'Buat Asesmen', icon: 'fa-list-check', public: true, section: 'AI Assistant', ai: true },
  { page: 'tts', label: 'Teka-Teki Silang', icon: 'fa-puzzle-piece', public: true, section: 'AI Assistant', ai: true },

  // KEGIATAN (Auth)
  { page: 'absensi', label: 'Absensi Kegiatan', icon: 'fa-clipboard-check', auth: true, section: 'Kegiatan' },

  // ADMINISTRASI (Admin Only)
  { page: 'admin', label: 'Panel Kontrol', icon: 'fa-cog', admin: true, section: 'Administrasi' },

  // AKUN SAYA
  { page: 'notifications', label: 'Notifikasi', icon: 'fa-bell', auth: true, section: 'Akun Saya' },
  { page: 'profile', label: 'Pengaturan Akun', icon: 'fa-user-cog', auth: true, section: 'Akun Saya' },
];

function renderNavLinks(activePage) {
  const isLoggedIn = !!state.user;
  const isAdminPanelUser = ['admin', 'operator'].includes(state.user?.role || '');
  let lastSection = null;

  return navLinks.filter(link => {
    if (link.public) return true;
    if (link.auth && isLoggedIn) return true;
    if (link.admin && isAdminPanelUser) return true;
    return false;
  }).map(link => {
    let sectionHtml = '';
    if (link.section !== lastSection) {
      lastSection = link.section;
      const isFirst = link.section === 'Menu Utama';
      const isAI = link.section === 'AI Assistant';
      sectionHtml = `<div class="px-2 ${isFirst ? 'mb-3' : 'mt-8 mb-3'} text-[10px] font-bold ${isAI ? 'text-teal-500' : 'text-[var(--color-text-tertiary)]'} uppercase tracking-widest">${link.section}</div>`;
    }

    const isActive = activePage === link.page;
    const isAI = link.ai;

    // AI items get a special style
    const buttonHtml = isAI ? `
      <button 
        onclick="navigate('${link.page}'); if(window.innerWidth < 768) document.getElementById('mobile-menu')?.classList.add('hidden');"
        class="w-full text-left px-4 py-4 rounded-3xl mb-3 flex items-center transition-all duration-500 ease-out group shadow-sm bg-gradient-to-r hover:scale-[1.02] hover:shadow-md hover:shadow-teal-500/20 animate-teal-glow ${isActive
        ? 'from-[rgba(38,148,148,0.15)] to-[rgba(38,148,148,0.05)] border border-[rgba(38,148,148,0.25)] text-teal-600 font-bold'
        : 'from-[rgba(38,148,148,0.05)] to-transparent border border-[rgba(38,148,148,0.1)] text-teal-600 hover:border-[rgba(38,148,148,0.25)] font-bold'
      }"
      >
        <div class="relative flex items-center justify-center mr-3 w-10 h-10 rounded-2xl bg-teal-500/10 group-hover:bg-teal-500/20 transition-all duration-300">
            <i class="fas ${link.icon} text-lg text-teal-600 group-hover:scale-110 transition-transform shadow-sm"></i>
        </div>
        <span class="text-[13px] tracking-wide relative z-10 font-black">${link.label}</span>
      </button>
    ` : `
      <button 
        onclick="navigate('${link.page}'); if(window.innerWidth < 768) document.getElementById('mobile-menu')?.classList.add('hidden');"
        class="w-full text-left px-4 py-3 rounded-2xl mb-1 flex items-center transition-all duration-300 group relative ${isActive
      ? 'text-teal-600 bg-[rgba(38,148,148,0.05)]'
      : 'text-slate-600 hover:text-teal-600 hover:bg-[rgba(38,148,148,0.05)]'
    }"
      >
        <span class="flex items-center justify-center mr-3 ${isActive
      ? 'text-teal-500'
      : 'opacity-50 group-hover:opacity-100 text-slate-400 group-hover:text-teal-500'
    } transition-opacity">
            <i class="fas ${link.icon} text-[15px]"></i>
        </span>
        <span class="${isActive ? 'font-bold' : 'font-semibold'} text-[13px]">${link.label}</span>
        ${(link.page === 'notifications' && state.unreadNotifications > 0) ? `
          <span class="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md shadow-red-500/30">
            ${state.unreadNotifications > 99 ? '99+' : state.unreadNotifications}
          </span>
        ` : (link.page === 'pengumuman' ? '<span class="absolute top-[18px] right-4 w-1.5 h-1.5 bg-red-500 rounded-full"></span>' : '')}
      </button>
    `;
    return sectionHtml + buttonHtml;
  }).join('');
}

// Main Render Function
async function render() {
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
    if (adminPages.includes(page) && !['admin', 'operator'].includes(state.user?.role || '')) {
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
        <aside class="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-100 z-[100] shadow-2xl shadow-teal-500/5">
          <div class="flex items-center gap-3 mb-10 p-6 pb-2">
             <div class="w-12 h-12 flex items-center justify-center transition-transform duration-500 hover:scale-105">
                <img 
                  src="/static/img/logo-kkg.png?v=${window.__APP_VERSION__}" 
                  alt="Logo KKG" 
                  class="w-full h-full object-contain drop-shadow-sm"
                >
             </div>
             <div>
                <h1 class="text-sm font-black text-teal-500 uppercase tracking-tighter leading-none">KKG Gugus 3</h1>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wanayasa</span>
             </div>
          </div>

          <nav class="flex-1 space-y-2 overflow-y-auto custom-scrollbar pb-6 pl-2 pr-4">
            ${renderNavLinks(page)}
          </nav>

          <div class="px-4 py-6 border-t border-slate-50">
            ${state.user ? `
              <div onclick="navigate('profile')" class="group relative bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] rounded-2xl p-4 mb-4 cursor-pointer hover:border-[rgba(38,148,148,0.2)] transition-all hover:shadow-ambient hover:-translate-y-0.5">
                  <div class="flex items-center gap-3">
                    ${avatar(state.user.nama, 'sm', state.user.foto_url)}
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-[var(--color-text-primary)] truncate group-hover:text-teal-500 transition-colors">${escapeHtml(state.user.nama)}</p>
                        <p class="text-xs text-[var(--color-text-tertiary)] font-medium truncate capitalize">${escapeHtml(state.user.role)}</p>
                    </div>
                  </div>
              </div>
              <button onclick="logout()" class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-300 group">
                <i class="fas fa-sign-out-alt w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"></i>
                <span>Keluar Aplikasi</span>
              </button>
            ` : `
              <button onclick="navigate('login')" class="w-full px-6 py-4 bg-slate-900 text-white rounded-[24px] font-bold text-sm hover:bg-teal-500 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3">
                <i class="fas fa-sign-in-alt"></i>
                <span>Login Akun</span>
              </button>
            `}
          </div>
        </aside>

        <!-- Mobile Header & Main Content -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <!-- Mobile Header -->
          <header class="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3">
            <div class="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-[24px] px-5 py-3 flex items-center justify-between">
               <div class="flex items-center gap-3">
                  <div class="w-10 h-10 flex items-center justify-center"><img src="/static/img/logo-kkg.png?v=${window.__APP_VERSION__}" class="w-full h-full object-contain"></div>
                  <h1 class="text-xs font-black text-teal-500 uppercase tracking-tighter">KKG Gugus 3</h1>
               </div>
               <div class="flex items-center gap-2">
                  ${state.user ? renderNotificationBell() : ''}
                  <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="p-2 text-slate-600 bg-slate-50 rounded-xl active:scale-95 transition-transform">
                    <i class="fas fa-bars text-lg"></i>
                  </button>
               </div>
            </div>
          </header>

          <!-- Main Content Area -->
          <main class="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth flex flex-col relative bg-[#f8fdfd]" id="main-content">
            <!-- Background Decoration -->
            <div class="absolute top-0 right-0 w-[60%] h-[500px] bg-gradient-to-bl from-[rgba(38,148,148,0.04)] to-transparent rounded-bl-[100px] pointer-events-none z-0"></div>
            
            <div class="${page === 'home' ? 'w-full animate-fade-in flex-1 z-10 relative pt-20 md:pt-0' : 'max-w-7xl mx-auto w-full p-6 md:p-10 pt-20 md:pt-10 animate-fade-in flex-1 z-10 relative'}">
              ${content}
            </div>
          </main>
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
            <nav class="flex-1 overflow-y-auto custom-scrollbar">
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
  await Promise.allSettled([sessionPromise, settingsPromise, csrfPromise]);

  // Finally, render once with all data ready
  await render();

  // Background tasks after first render
  if (state.user) {
    setInterval(() => fetchUnreadCount(), 60000);
  }

  document.addEventListener('notifications-updated', () => {
    const sidebarNav = document.querySelector('aside nav');
    if (sidebarNav) sidebarNav.innerHTML = renderNavLinks(state.currentPage);

    const mobileNav = document.querySelector('#mobile-menu nav');
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

