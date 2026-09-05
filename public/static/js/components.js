// Reusable UI Components
import { state } from './state.js';
import { escapeHtml, avatar, badge } from './utils.js';
import { renderNotificationBell } from './notifications.js';

export { avatar, badge };

/**
 * Render navigation bar
 */
export function renderNavbar() {
  const isLoggedIn = !!state.user;
  const isAdminPanelUser = ['super_admin', 'admin', 'operator'].includes(state.user?.role || '');

  const navLinks = [
    { page: 'home', label: 'Beranda', icon: 'fa-home', public: true },
    { page: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn', public: true },
    { page: 'surat', label: 'Generator Surat', icon: 'fa-file-alt', admin: true },
    { page: 'proker', label: 'Program Kerja', icon: 'fa-tasks', admin: true },
    { page: 'laporan', label: 'Laporan KKG', icon: 'fa-file-contract', admin: true },
    { page: 'absensi', label: 'Absensi', icon: 'fa-clipboard-check', auth: true },
    { page: 'kalender', label: 'Kalender', icon: 'fa-calendar-alt', public: true },
    { page: 'materi', label: 'Materi', icon: 'fa-book-open', public: true },
    { page: 'guru', label: 'Direktori Guru', icon: 'fa-users', public: true },
    { page: 'forum', label: 'Forum', icon: 'fa-comments', public: true },
    { page: 'admin', label: 'Panel Kontrol', icon: 'fa-cog', admin: true },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (link.public) return true;
    if (link.auth && isLoggedIn) return true;
    if (link.admin && isAdminPanelUser) return true;
    return false;
  });

  return `
    <nav class="glass sticky top-0 z-50 border-b border-[var(--color-border-subtle)]">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <a href="#" onclick="navigate('home'); return false;" class="flex items-center space-x-3 group">
            <div class="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-terracotta-500 to-sunset-500 rounded-xl text-white shadow-lg shadow-terracotta-500/25 group-hover:shadow-xl group-hover:shadow-terracotta-500/30 transition-all">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="hidden sm:block">
              <div class="font-display font-bold text-[var(--color-text-primary)]">Portal KKG</div>
              <div class="text-[var(--color-text-tertiary)] text-xs">Gugus 3 Wanayasa</div>
            </div>
          </a>

          <div class="hidden lg:flex items-center space-x-1">
            ${filteredLinks.map(link => `
              <button 
                onclick="navigate('${link.page}')"
                class="px-3 py-2 rounded-xl text-sm font-medium transition-all ${state.currentPage === link.page
      ? 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400'
      : 'text-[var(--color-text-secondary)] hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 hover:text-terracotta-600 dark:hover:text-terracotta-400'
    }"
              >
                <i class="fas ${link.icon} mr-1.5 text-xs opacity-70"></i>
                ${link.label}
              </button>
            `).join('')}
          </div>

          <div class="flex items-center space-x-3">
            ${isLoggedIn ? renderNotificationBell() : ''}
            
            ${isLoggedIn ? `
              <div class="relative group">
                <button class="flex items-center space-x-2 p-1 pr-3 rounded-full hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 transition-colors border border-transparent hover:border-terracotta-200 dark:hover:border-terracotta-800">
                  ${avatar(state.user.nama, 'sm', state.user.foto_url)}
                  <span class="hidden sm:block text-[var(--color-text-secondary)] text-sm font-medium max-w-[120px] truncate">
                    ${escapeHtml(state.user.nama)}
                  </span>
                  <i class="fas fa-chevron-down text-[var(--color-text-tertiary)] text-xs"></i>
                </button>
                <div class="absolute right-0 top-full mt-2 w-56 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-2xl shadow-[var(--shadow-elevated)] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 z-50">
                  <div class="px-4 py-3 border-b border-[var(--color-border-subtle)]">
                    <p class="text-sm font-bold text-[var(--color-text-primary)] truncate">${escapeHtml(state.user.nama)}</p>
                    <p class="text-xs text-[var(--color-text-tertiary)] truncate">${escapeHtml(state.user.email)}</p>
                    ${isAdminPanelUser ? `<span class="inline-block mt-1.5 px-2 py-0.5 bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-700 dark:text-terracotta-300 text-[10px] font-bold uppercase tracking-wider rounded-full">${state.user?.role === 'operator' ? 'Operator' : 'Administrator'}</span>` : ''}
                  </div>
                  <button onclick="navigate('profile')" class="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 hover:text-terracotta-600 flex items-center gap-2">
                    <i class="fas fa-user w-4"></i>Profil Saya
                  </button>
                  <button onclick="logout()" class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                    <i class="fas fa-sign-out-alt w-4"></i>Keluar
                  </button>
                </div>
              </div>
            ` : `
              <button onclick="navigate('login')" class="btn btn-primary text-sm px-5 py-2.5">
                <i class="fas fa-sign-in-alt mr-2"></i>Masuk
              </button>
            `}
            
            <button onclick="toggleTheme()" class="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 transition-colors" aria-label="Toggle dark mode">
              <i class="fas fa-moon dark:hidden"></i>
              <i class="fas fa-sun text-sunset-400 hidden dark:inline"></i>
            </button>
            
            <button onclick="toggleMobileMenu()" class="lg:hidden p-2 rounded-xl text-[var(--color-text-tertiary)] hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 transition-colors">
              <i class="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>

        <div id="mobile-menu" class="lg:hidden hidden pb-4 border-t border-[var(--color-border-subtle)] mt-2 pt-2 animate-fade-in">
          <div class="space-y-1">
            ${filteredLinks.map(link => `
              <button 
                onclick="navigate('${link.page}'); toggleMobileMenu();"
                class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${state.currentPage === link.page
        ? 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400'
        : 'text-[var(--color-text-secondary)] hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20'
      }"
              >
                <i class="fas ${link.icon} mr-3 w-5 text-center"></i>
                ${link.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Toggle mobile menu visibility
 */
export function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

/**
 * Render footer
 */
export function renderFooter() {
  return `
    <footer class="bg-white border-t border-slate-100 mt-auto">
      <div class="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-12">
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <i class="fas fa-graduation-cap text-sm"></i>
              </div>
              <div>
                <div class="font-display font-extrabold text-slate-900 tracking-tight">KKG Gugus 3 Wanayasa</div>
                <div class="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Kecamatan Wanayasa</div>
              </div>
            </div>
            <p class="text-slate-500 text-sm leading-relaxed max-w-md">
              Platform kolaborasi digital untuk memfasilitasi koordinasi, pengembangan kompetensi, dan sinergi antar guru untuk kemajuan pendidikan Indonesia.
            </p>
          </div>

          <div class="md:text-right">
            <ul class="space-y-3 text-sm text-slate-500">
              <li class="flex md:justify-end items-start gap-3">
                <span>${escapeHtml(state.settings?.alamat_sekretariat || 'Kp.Peuntas Rt 08/03 Ds.Nangerang, Kec. Wanayasa, Kab. Purwakarta')}</span>
                <i class="fas fa-map-marker-alt mt-1 text-teal-500"></i>
              </li>
              <li class="flex md:justify-end items-center gap-3">
                <span>${escapeHtml(state.settings?.email || 'admin@kkg-wanayasa.id')}</span>
                <i class="fas fa-envelope text-teal-500"></i>
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-slate-100 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>&copy; ${new Date().getFullYear()} KKG Gugus 3 Wanayasa. All rights reserved.</p>
          <div class="flex items-center gap-1 mt-3 md:mt-0">
             <span>Dibuat dengan</span>
             <i class="fas fa-heart text-teal-500 animate-pulse text-[10px]"></i>
             <span>untuk Pendidikan Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Page header component
 */
export function pageHeader(title, subtitle = '', actions = '') {
  return `
    <div class="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] py-10 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-3xl font-display font-bold mb-2 text-[var(--color-text-primary)] tracking-tight">${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="text-[var(--color-text-tertiary)] text-lg">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          ${actions ? `<div class="mt-4 md:mt-0 flex gap-3">${actions}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Card component
 */
export function card(content, options = {}) {
  const { className = '', header = '', footer = '', hover = false } = options;
  return `
    <div class="card ${hover ? 'card-hover' : ''} ${className}">
      ${header ? `<div class="px-6 py-4 border-b border-[var(--color-border-subtle)] font-bold text-[var(--color-text-primary)]">${header}</div>` : ''}
      <div class="p-6 text-[var(--color-text-secondary)]">${content}</div>
      ${footer ? `<div class="px-6 py-4 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border-subtle)]">${footer}</div>` : ''}
    </div>
  `;
}

/**
 * Stat card component
 */
export function statCard(icon, label, value, color = 'terracotta') {
  return `
    <div class="card relative overflow-hidden group">
      <div class="flex items-center justify-between relative z-10">
        <div>
          <p class="text-[var(--color-text-tertiary)] font-medium text-sm">${escapeHtml(label)}</p>
          <p class="text-3xl font-display font-bold mt-1 text-[var(--color-text-primary)] tracking-tight">${escapeHtml(String(value))}</p>
        </div>
        <div class="w-14 h-14 bg-gradient-to-br from-terracotta-100 to-sunset-100 dark:from-terracotta-900/30 dark:to-sunset-900/30 rounded-2xl flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 group-hover:scale-110 transition-transform duration-300">
          <i class="fas ${icon} text-xl"></i>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tab component
 */
export function tabs(items, activeTab, onTabClick = 'setActiveTab') {
  return `
    <div class="flex space-x-1 bg-cream-200/50 dark:bg-coffee-800/50 rounded-2xl p-1.5">
      ${items.map(item => `
        <button 
          onclick="${onTabClick}('${item.id}')"
          class="flex-1 py-2.5 px-4 rounded-xl font-medium transition-all text-sm ${activeTab === item.id
      ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-[var(--shadow-soft)]'
      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
    }"
        >
          ${item.icon ? `<i class="fas ${item.icon} mr-2"></i>` : ''}
          ${escapeHtml(item.label)}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Search input component
 */
export function searchInput(placeholder = 'Cari...', onInput = 'handleSearch', value = '') {
  return `
    <div class="relative">
      <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)]">
        <i class="fas fa-search"></i>
      </span>
      <input 
        type="text" 
        placeholder="${escapeHtml(placeholder)}"
        value="${escapeHtml(value)}"
        oninput="${onInput}(this.value)"
        class="input-field pl-11"
      />
    </div>
  `;
}

/**
 * Button component
 */
export function button(label, options = {}) {
  const {
    type = 'primary',
    icon = '',
    size = 'md',
    onclick = '',
    disabled = false,
    loading = false,
    className = ''
  } = options;

  const typeClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return `
    <button 
      ${onclick ? `onclick="${onclick}"` : ''}
      ${disabled || loading ? 'disabled' : ''}
      class="btn ${sizeClasses[size]} ${typeClasses[type]} ${className}"
    >
      ${loading ? '<i class="fas fa-spinner fa-spin mr-2"></i>' : (icon ? `<i class="fas ${icon} mr-2"></i>` : '')}
      ${escapeHtml(label)}
    </button>
  `;
}

/**
 * Alert component
 */
export function alert(message, type = 'info', dismissible = false) {
  const types = {
    info: { bg: 'bg-ocean-50 dark:bg-ocean-900/20 border-ocean-200 dark:border-ocean-800', icon: 'fa-info-circle', text: 'text-ocean-700 dark:text-ocean-300' },
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: 'fa-check-circle', text: 'text-emerald-700 dark:text-emerald-300' },
    warning: { bg: 'bg-sunset-50 dark:bg-sunset-900/20 border-sunset-200 dark:border-sunset-800', icon: 'fa-exclamation-triangle', text: 'text-sunset-700 dark:text-sunset-300' },
    error: { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: 'fa-times-circle', text: 'text-red-700 dark:text-red-300' }
  };

  const style = types[type] || types.info;
  return `
    <div class="${style.bg} border ${style.text} rounded-2xl p-4 flex items-start space-x-3 text-sm">
      <i class="fas ${style.icon} mt-0.5 opacity-70"></i>
      <div class="flex-1">${escapeHtml(message)}</div>
      ${dismissible ? `<button onclick="this.parentElement.remove()" class="opacity-50 hover:opacity-100 transition-opacity"><i class="fas fa-times"></i></button>` : ''}
    </div>
  `;
}

/**
 * Render locked feature teaser for non-logged in users
 */
export function renderLockedFeature(title, description, features = []) {
  return `
    <div class="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div class="max-w-2xl card p-8 md:p-12">
        
        <div class="w-20 h-20 bg-gradient-to-br from-terracotta-100 to-sunset-100 dark:from-terracotta-900/30 dark:to-sunset-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <i class="fas fa-lock text-3xl text-terracotta-500"></i>
        </div>

        <h2 class="text-3xl font-serif font-bold text-[var(--color-text-primary)] mb-4">
          ${escapeHtml(title)}
        </h2>
        
        <p class="text-[var(--color-text-tertiary)] text-lg mb-8 leading-relaxed">
          ${escapeHtml(description)}
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button onclick="navigate('login')" class="btn btn-primary px-8 py-4">
            <i class="fas fa-sign-in-alt mr-2"></i> Masuk Sekarang
          </button>
        </div>
      </div>
    </div>
  `;
}
