
import { avatar } from '../components.js';
import { navigate } from '../router.js';
import { state } from '../state.js';
import { escapeHtml } from '../utils.js';

export function renderAdminLayout(content, activePage = 'dashboard') {
  const user = state.user;
  const adminPanelMode = user?.role === 'operator'
    ? 'operator'
    : (localStorage.getItem('admin_panel_mode') === 'operator' ? 'operator' : 'admin');
  const nowLabel = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (!user || !['super_admin', 'admin', 'operator'].includes(user.role)) {
    return `
      <div class="fade-in max-w-4xl mx-auto py-16 px-4 text-center">
        <div class="bg-[var(--color-bg-elevated)] border border-red-200 dark:border-red-900/50 rounded-3xl p-10 max-w-lg mx-auto shadow-xl">
          <i class="fas fa-lock text-5xl text-red-500 mb-6 block"></i>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)] mb-3">Akses Ditolak</h2>
          <p class="text-[var(--color-text-secondary)] mb-6">Halaman ini hanya dapat diakses oleh admin atau operator.</p>
          <button onclick="navigate('home')" class="btn btn-primary">Kembali ke Beranda</button>
        </div>
      </div>`;
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', section: 'Overview' },

    { id: 'surat', label: 'Generator Surat', icon: 'fa-envelope-open-text', section: 'Aplikasi' },
    { id: 'proker', label: 'Program Kerja', icon: 'fa-tasks', section: 'Aplikasi' },
    { id: 'laporan', label: 'Laporan KKG', icon: 'fa-file-contract', section: 'Aplikasi' },

    { id: 'users', label: 'Manajemen User', icon: 'fa-users-cog', section: 'Data Master' },
    { id: 'sekolah', label: 'Data Sekolah', icon: 'fa-school', section: 'Data Master' },

    { id: 'ai-providers', label: 'AI Provider', icon: 'fa-robot', section: 'System' },
    { id: 'logs', label: 'Audit Logs', icon: 'fa-history', section: 'System' },
    { id: 'templates', label: 'Template Surat', icon: 'fa-file-alt', section: 'System' },
    { id: 'profil', label: 'Organisasi', icon: 'fa-building', section: 'System' },
  ];

  const visibleItems = adminPanelMode === 'operator'
    ? sidebarItems.filter(item => !['logs', 'templates', 'profil', 'ai-providers'].includes(item.id))
    : sidebarItems;

  /* Group items by section */

  /* Group items by section */
  const groups = visibleItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  /* Sidebar HTML Generator */
  const renderSidebar = () => {
    return Object.entries(groups).map(([section, items]) => `
      <div class="mb-3.5">
        <h3 class="px-3 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">${section}</h3>
        <div class="space-y-0.5">
          ${items.map(item => `
            <button 
              id="tab-${item.id}"
              onclick="${['surat', 'proker', 'laporan'].includes(item.id)
                ? `navigate('${item.id}')`
                : `window.handleAdminTabClick && window.handleAdminTabClick('${item.id}')`}"
              class="w-full text-left px-3 py-2 rounded-xl flex items-center transition-all duration-200 group relative focus:outline-none ${activePage === item.id
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              }"
            >
              <span class="w-6 h-6 flex items-center justify-center rounded-lg mr-2.5 transition-colors shrink-0 ${activePage === item.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'}">
                  <i class="fas ${item.icon} text-xs"></i>
              </span>
              <span class="text-xs tracking-tight truncate flex-1">${item.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  };

  return `
    <div class="relative flex min-h-screen bg-[#f8fafc] text-slate-800 overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-indigo-400/15 blur-3xl"></div>
        <div class="absolute top-24 -left-24 h-80 w-80 rounded-full bg-purple-400/15 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.15)_1px,transparent_0)] [background-size:28px_28px]"></div>
      </div>
      <!-- Admin Sidebar -->
      <aside class="hidden md:flex flex-col w-64 bg-white/80 border-r border-slate-200/70 z-20 backdrop-blur-xl h-screen shrink-0">
        <div class="h-16 px-5 flex items-center border-b border-slate-200/60 shrink-0">
            <button onclick="navigate('home')" class="flex items-center gap-3 text-slate-800 hover:text-indigo-600 transition-colors group">
                <span class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs shrink-0">
                  <i class="fas fa-arrow-left text-xs group-hover:-translate-x-0.5 transition-transform"></i>
                </span>
                <div class="text-left">
                  <span class="block font-bold tracking-tight text-xs text-slate-800 group-hover:text-indigo-600">Portal Utama</span>
                  <span class="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Keluar Admin</span>
                </div>
            </button>
        </div>

        <div class="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
            ${renderSidebar()}
        </div>

        <div class="p-3 border-t border-slate-200/60 shrink-0 bg-slate-50/50">
             <div class="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200/70 bg-white shadow-2xs">
                 ${avatar(user.nama, 'sm', user.foto_url)}
                 <div class="overflow-hidden min-w-0 flex-1">
                    <p class="text-xs font-bold tracking-tight text-slate-800 truncate">${escapeHtml(user.nama)}</p>
                    <p class="text-[9.5px] font-medium text-indigo-600 capitalize truncate">${user.role === 'super_admin' ? 'Super Admin' : (user.role === 'operator' ? 'Operator' : 'Administrator')}</p>
                 </div>
             </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-transparent z-10">
        <header class="hidden md:flex items-center justify-between h-24 px-10 border-b border-slate-200/60 bg-white/60 backdrop-blur-xl">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-indigo-600 font-bold mb-1">Control Center</p>
            <h1 class="text-2xl font-display font-semibold tracking-tighter text-slate-800">Manajemen Portal</h1>
          </div>
        <div class="flex items-center gap-4">
            <div class="inline-flex items-center rounded-2xl border border-white/60 p-1 bg-white/40 shadow-sm ${user.role === 'operator' ? 'hidden' : ''}">
              <button onclick="setAdminPanelMode('admin')" class="px-4 py-2 text-xs font-medium rounded-xl transition-all ${adminPanelMode === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white'}">Admin</button>
              <button onclick="setAdminPanelMode('operator')" class="px-4 py-2 text-xs font-medium rounded-xl transition-all ${adminPanelMode === 'operator' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white'}">Operator</button>
            </div>
            <button onclick="switchAdminTab('users')" class="px-5 py-2.5 text-sm font-medium rounded-2xl border border-slate-200 hover:bg-white text-slate-800 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">
              <i class="fas fa-users mr-2 text-slate-500"></i>Pengguna
            </button>
            <button onclick="switchAdminTab('profil')" class="px-5 py-2.5 text-sm font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 transition-all shadow-[0_8px_30px_rgba(14,165,233,0.35)] hover:shadow-[0_10px_34px_rgba(14,165,233,0.45)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${adminPanelMode === 'operator' ? 'hidden' : ''}">
              <i class="fas fa-sliders mr-2"></i>Pengaturan
            </button>
          </div>
        </header>

        <!-- Mobile Header -->
        <header class="md:hidden glass sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl z-40">
              <button onclick="navigate('home')" class="text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 rounded-lg px-2 py-1"><i class="fas fa-arrow-left mr-2"></i></button>
              <span class="font-display font-semibold tracking-tight text-lg text-slate-800">Admin Panel</span>
              <button onclick="document.getElementById('admin-mobile-menu').classList.remove('hidden')" class="text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 rounded-lg px-2 py-1"><i class="fas fa-bars text-xl"></i></button>
        </header>

        <main class="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8 relative">
           <div class="max-w-7xl mx-auto animate-fade-in">
              ${content}
           </div>
        </main>
      </div>

       <!-- Mobile Admin Menu Overlay -->
        <div id="admin-mobile-menu" class="hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden animate-fade-in" onclick="this.classList.add('hidden')">
          <div class="bg-slate-50 w-72 h-full shadow-2xl p-6 flex flex-col transform transition-transform animate-slide-in-left border-r border-white/60" onclick="event.stopPropagation()">
            <div class="flex justify-between items-center mb-8 border-b border-white/60 pb-4">
              <span class="text-xl font-bold text-slate-800">Admin Menu</span>
              <button onclick="document.getElementById('admin-mobile-menu').classList.add('hidden')" class="p-2 bg-slate-800 rounded-full text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"><i class="fas fa-times"></i></button>
            </div>
            <nav class="flex-1 overflow-y-auto">
              ${renderSidebar()}
            </nav>
          </div>
        </div>

    </div>
  `;
}
