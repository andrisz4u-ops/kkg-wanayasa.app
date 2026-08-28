
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast, formatDate, formatDateTime, skeletonTable, debounce } from '../utils.js';


import './admin-modules/shared-state.js';
import './admin-modules/ui.js';
import './admin-modules/dashboard.js';
import './admin-modules/settings.js';
import './admin-modules/users.js';
import './admin-modules/logs.js';
import './admin-modules/templates.js';
import './admin-modules/sekolah.js';
import './admin-modules/ai-providers.js';

export async function renderAdmin() {
  const { renderAdminLayout } = await import('../layouts/admin.js');

  if (!state.user || !['admin', 'operator'].includes(state.user.role)) {
    return renderAdminLayout('', 'access-denied');
  }

  // Trigger data loading
  setTimeout(() => {
    if (window.initAdminData) window.initAdminData();
    // Re-initialize specific tab data if needed
    const tab = state.currentAdminTab || 'dashboard';
    switchAdminTab(tab);
  }, 100);

  const innerContent = `
    <!--Dashboard Tab -->
      <div id="panel-dashboard" class="animate-fade-in space-y-6">
        <div class="rounded-3xl border border-slate-200/70 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 px-6 md:px-8 py-8 shadow-[0_12px_24px_rgba(99,102,241,0.12)] relative overflow-hidden">
          <!-- Subtle subtle geometric accents -->
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full pointer-events-none"></div>
          <div class="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-tr-full pointer-events-none"></div>

          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 relative z-10">
            <div>
              <span class="inline-block px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[10px] uppercase font-semibold tracking-widest text-indigo-600 mb-4">Dashboard Operasional</span>
              <h2 class="text-3xl md:text-4xl font-display font-semibold tracking-tighter mt-2">Selamat datang, ${escapeHtml(state.user?.nama?.split(' ')[0] || 'Admin')}</h2>
              <p class="text-slate-900/60 mt-3 max-w-2xl font-light leading-relaxed tracking-tight">Pantau kondisi platform, selesaikan tugas prioritas harian, dan lakukan aksi penting tanpa berpindah halaman.</p>
              <span id="dashboard-mode-label" class="inline-flex mt-4 px-2.5 py-1 rounded border border-white/20 bg-white/5 text-[10px] tracking-wide">Mode Admin Utama</span>
            </div>
            <div class="flex flex-wrap gap-3 text-xs">
              <button onclick="showAddUserModal()" class="px-5 py-3 rounded-2xl bg-white/95 backdrop-blur-xl text-slate-900 hover:bg-gray-100 transition-colors font-semibold tracking-tight shadow-sm shadow-slate-200/50 hover:shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 active:scale-95 duration-300">
                <i class="fas fa-user-plus mr-2"></i>User Baru
              </button>
              <button onclick="showAddSekolahModal()" class="px-5 py-3 rounded-2xl bg-white/10 hover:bg-slate-800/60/20 text-slate-900 border border-white/10 transition-colors font-medium tracking-tight hover:-translate-y-0.5 active:scale-95 duration-300">
                <i class="fas fa-school mr-2"></i>Data Sekolah
              </button>
              <button data-admin-only="true" onclick="switchAdminTab('profil')" class="px-5 py-3 rounded-2xl bg-white/10 hover:bg-slate-800/60/20 text-slate-900 border border-white/10 transition-colors font-medium tracking-tight hover:-translate-y-0.5 active:scale-95 duration-300">
                <i class="fas fa-building mr-2"></i>Profil KKG
              </button>
              <button data-admin-only="true" onclick="switchAdminTab('logs')" class="px-5 py-3 rounded-2xl bg-white/10 hover:bg-slate-800/60/20 text-slate-900 border border-white/10 transition-colors font-medium tracking-tight hover:-translate-y-0.5 active:scale-95 duration-300">
                <i class="fas fa-history mr-2"></i>Audit Log
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 group">
            <div class="flex items-center justify-between mb-4">
              <span class="w-12 h-12 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors duration-300"><i class="fas fa-chalkboard-teacher text-lg"></i></span>
              <span class="px-2.5 py-1 rounded-full border border-slate-200/70 bg-slate-100/50 backdrop-blur-md text-[10px] uppercase tracking-widest font-semibold text-slate-600">Anggota Aktif</span>
            </div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Guru</p>
            <h3 class="text-4xl font-display font-semibold tracking-tighter text-slate-900" id="total-guru">...</h3>
          </div>

          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 group">
            <div class="flex items-center justify-between mb-4">
              <span class="w-12 h-12 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors duration-300"><i class="fas fa-file-signature text-lg"></i></span>
              <span class="px-2.5 py-1 rounded-full border border-slate-200/70 bg-slate-100/50 backdrop-blur-md text-[10px] uppercase tracking-widest font-semibold text-slate-600">Dokumen</span>
            </div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Surat Dibuat</p>
            <h3 class="text-4xl font-display font-semibold tracking-tighter text-slate-900" id="total-surat">...</h3>
          </div>

          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 group">
            <div class="flex items-center justify-between mb-4">
              <span class="w-12 h-12 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors duration-300"><i class="fas fa-tasks text-lg"></i></span>
              <span class="px-2.5 py-1 rounded-full border border-slate-200/70 bg-slate-100/50 backdrop-blur-md text-[10px] uppercase tracking-widest font-semibold text-slate-600">Perencanaan</span>
            </div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Program Kerja</p>
            <h3 class="text-4xl font-display font-semibold tracking-tighter text-slate-900" id="total-proker">...</h3>
          </div>

          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 group">
            <div class="flex items-center justify-between mb-4">
              <span class="w-12 h-12 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors duration-300"><i class="fas fa-calendar-check text-lg"></i></span>
              <span class="px-2.5 py-1 rounded-full border border-slate-200/70 bg-slate-100/50 backdrop-blur-md text-[10px] uppercase tracking-widest font-semibold text-slate-600">Agenda</span>
            </div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Kegiatan</p>
            <h3 class="text-4xl font-display font-semibold tracking-tighter text-slate-900" id="total-kegiatan">...</h3>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="rounded-3xl border border-slate-200/70 bg-white/95 backdrop-blur-xl px-5 py-4 shadow-sm shadow-slate-200/50 hover:shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] transition-shadow">
            <p class="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">User Baru Bulan Ini</p>
            <p class="text-2xl font-display tracking-tight font-semibold text-slate-900" id="metric-new-users">0</p>
          </div>
          <div class="rounded-3xl border border-slate-200/70 bg-white/95 backdrop-blur-xl px-5 py-4 shadow-sm shadow-slate-200/50 hover:shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] transition-shadow">
            <p class="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">User Aktif Hari Ini</p>
            <p class="text-2xl font-display tracking-tight font-semibold text-slate-900" id="metric-active-users">0</p>
          </div>
          <div class="rounded-3xl border border-slate-200/70 bg-amber-50/80 backdrop-blur-md px-5 py-4 shadow-sm shadow-slate-200/50 hover:shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] transition-shadow">
            <p class="text-[10px] uppercase tracking-widest text-indigo-600 font-semibold mb-1">Menunggu Persetujuan</p>
            <p class="text-2xl font-display tracking-tight font-semibold text-indigo-600" id="metric-pending-users">0</p>
          </div>
          <div class="rounded-3xl border border-slate-200/70 bg-white/95 backdrop-blur-xl px-5 py-4 shadow-sm shadow-slate-200/50 hover:shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] transition-shadow">
            <p class="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Konten</p>
            <p class="text-2xl font-display tracking-tight font-semibold text-slate-900" id="metric-content-total">0</p>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-600 font-semibold uppercase tracking-widest text-[10px] mr-2">Periode Dashboard</span>
            <button id="dash-period-7" onclick="setDashboardPeriod(7)" class="px-4 py-2 rounded-full border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900 transition-colors font-medium">7 Hari</button>
            <button id="dash-period-30" onclick="setDashboardPeriod(30)" class="px-4 py-2 rounded-full border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900 transition-colors font-medium">30 Hari</button>
            <button id="dash-period-90" onclick="setDashboardPeriod(90)" class="px-4 py-2 rounded-full border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900 transition-colors font-medium">90 Hari</button>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-600 font-semibold uppercase tracking-widest text-[10px] mr-2">Kepadatan Tabel</span>
            <button id="density-comfort-btn" onclick="setAdminDensity('comfortable')" class="px-4 py-2 rounded-full border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 hover:text-slate-900 transition-colors font-medium">Nyaman</button>
            <button id="density-compact-btn" onclick="setAdminDensity('compact')" class="px-4 py-2 rounded-full border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 hover:text-slate-900 transition-colors font-medium">Ringkas</button>
          </div>
        </div>

        <div data-admin-only="true" class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <h3 class="font-display font-semibold text-slate-900 tracking-tight">SLA Operasional</h3>
            <div class="flex items-center gap-3">
              <label class="text-[10px] uppercase font-semibold text-slate-500 tracking-widest">Ambang pending</label>
              <input id="sla-threshold-input" type="number" min="1" class="w-20 px-3 py-1.5 rounded-xl border border-slate-200/70 bg-slate-100/50 backdrop-blur-md text-xs font-medium focus:ring-1 focus:ring-[#111111]" />
              <button onclick="setSlaPendingThreshold()" class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 hover:bg-black transition-colors">Terapkan</button>
            </div>
            <div id="sla-overview" class="flex flex-wrap gap-2"></div>
          </div>
        </div>

        <div class="grid xl:grid-cols-3 gap-6">
          <div class="xl:col-span-2 space-y-6">
            <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h3 class="font-display text-2xl font-semibold text-slate-900 tracking-tighter mb-1">Aksi Prioritas</h3>
                  <p class="text-sm text-slate-600 font-light tracking-tight">Tugas harian admin yang paling sering digunakan</p>
                </div>
                <button onclick="navigate('home')" class="text-sm text-slate-900 font-semibold flex items-center group">Buka Situs Publik <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i></button>
              </div>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onclick="navigate('surat')" class="text-left p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-100 hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] bg-slate-100/50 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 group hover:-translate-y-1">
                  <div class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center mb-4 group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors">
                    <i class="fas fa-magic text-sm"></i>
                  </div>
                  <p class="font-semibold text-slate-900 tracking-tight mb-1">Buat Surat</p>
                  <p class="text-xs text-slate-600 font-light leading-relaxed">Generator undangan & dokumen</p>
                </button>
                <button onclick="navigate('proker')" class="text-left p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-100 hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] bg-slate-100/50 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 group hover:-translate-y-1">
                  <div class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center mb-4 group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors">
                    <i class="fas fa-project-diagram text-sm"></i>
                  </div>
                  <p class="font-semibold text-slate-900 tracking-tight mb-1">Kelola Proker</p>
                  <p class="text-xs text-slate-600 font-light leading-relaxed">Perbarui status program</p>
                </button>
                <button onclick="switchAdminTab('users')" class="text-left p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-100 hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] bg-slate-100/50 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 group hover:-translate-y-1">
                  <div class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center mb-4 group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors">
                    <i class="fas fa-users-cog text-sm"></i>
                  </div>
                  <p class="font-semibold text-slate-900 tracking-tight mb-1">Manajemen User</p>
                  <p class="text-xs text-slate-600 font-light leading-relaxed">Atur role dan hak akses akun</p>
                </button>
                <button onclick="switchAdminTab('sekolah')" class="text-left p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-100 hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] bg-slate-100/50 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 group hover:-translate-y-1">
                  <div class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center mb-4 group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors">
                    <i class="fas fa-school text-sm"></i>
                  </div>
                  <p class="font-semibold text-slate-900 tracking-tight mb-1">Data Sekolah</p>
                  <p class="text-xs text-slate-600 font-light leading-relaxed">Master data sekolah anggota</p>
                </button>
                <button onclick="navigate('laporan')" class="text-left p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-100 hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] bg-slate-100/50 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 group hover:-translate-y-1">
                  <div class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center mb-4 group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors">
                    <i class="fas fa-file-contract text-sm"></i>
                  </div>
                  <p class="font-semibold text-slate-900 tracking-tight mb-1">Laporan KKG</p>
                  <p class="text-xs text-slate-600 font-light leading-relaxed">Rekap dan hasil dokumentasi</p>
                </button>
                <button data-admin-only="true" onclick="switchAdminTab('profil')" class="text-left p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-100 hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)] bg-slate-100/50 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 group hover:-translate-y-1">
                  <div class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center mb-4 group-hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 group-hover:text-slate-900 transition-colors">
                    <i class="fas fa-sliders-h text-sm"></i>
                  </div>
                  <p class="font-semibold text-slate-900 tracking-tight mb-1">Profil Organisasi</p>
                  <p class="text-xs text-slate-600 font-light leading-relaxed">Legalitas dan konfigurasi AI</p>
                </button>
              </div>
            </div>

            <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
              <div class="flex items-center justify-between mb-6">
                <h3 class="font-display text-xl font-semibold text-slate-900 tracking-tighter">To-Do Operasional Hari Ini</h3>
                <span class="px-3 py-1 rounded-full bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-[10px] uppercase font-semibold tracking-widest text-slate-900">Auto-generated</span>
              </div>
              <div id="dashboard-task-list" class="space-y-4">
                <div class="animate-pulse space-y-3">
                  <div class="h-14 bg-slate-100/50 backdrop-blur-md rounded-2xl w-full"></div>
                  <div class="h-14 bg-slate-100/50 backdrop-blur-md rounded-2xl w-full"></div>
                </div>
              </div>
            </div>

            <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h3 class="font-display text-xl font-semibold text-slate-900 tracking-tighter">Tren Aktivitas</h3>
                <div class="flex items-center gap-3 text-xs">
                  <select id="dashboard-trend-select" onchange="setDashboardTrendPeriod(this.value)" class="px-4 py-2 rounded-full border border-slate-200/70 bg-slate-100/50 backdrop-blur-md text-slate-900 font-medium focus:ring-1 focus:ring-[#111111] outline-none cursor-pointer">
                    <option value="weekly" selected>Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                  <span class="flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200/70 bg-white/95 backdrop-blur-xl text-[10px] uppercase tracking-widest font-semibold text-slate-500"><i class="fas fa-sync-alt animate-spin-slow"></i> 30s</span>
                </div>
              </div>
              <div class="h-[350px]"><canvas id="activity-chart"></canvas></div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
              <div class="flex items-center justify-between mb-6">
                <h3 class="font-display text-xl font-semibold text-slate-900 tracking-tighter">Persetujuan User</h3>
                <button onclick="switchAdminTab('users')" class="text-xs font-semibold text-slate-900 hover:underline">Kelola User</button>
              </div>
              <div id="pending-approval-list" class="space-y-4">
                <div class="animate-pulse space-y-3">
                  <div class="h-20 bg-slate-100/50 backdrop-blur-md rounded-2xl w-full"></div>
                  <div class="h-20 bg-slate-100/50 backdrop-blur-md rounded-2xl w-full"></div>
                </div>
              </div>
            </div>

            <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] flex-1">
              <div class="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                <h3 class="font-display text-xl font-semibold text-slate-900 tracking-tighter">Log Aktivitas</h3>
                <div class="flex items-center gap-3">
                  <select id="dashboard-activity-select" onchange="setDashboardActivityWindow(this.value)" class="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200/70 bg-slate-100/50 backdrop-blur-md text-slate-900 focus:ring-1 focus:ring-[#111111] outline-none cursor-pointer">
                    <option value="1">1 Hari</option>
                    <option value="7" selected>7 Hari</option>
                    <option value="30">30 Hari</option>
                  </select>
                  <button data-admin-only="true" onclick="switchAdminTab('logs')" class="w-8 h-8 rounded-full border border-slate-200/70 bg-white/95 backdrop-blur-xl hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 hover:text-slate-900 transition-colors flex items-center justify-center text-slate-600" title="Audit Log Lengkap"><i class="fas fa-external-link-alt text-[10px]"></i></button>
                </div>
              </div>
              <div id="dashboard-recent-logs" class="space-y-4">
                <div class="animate-pulse space-y-3">
                  <div class="h-16 bg-slate-100/50 backdrop-blur-md rounded-2xl w-full"></div>
                  <div class="h-16 bg-slate-100/50 backdrop-blur-md rounded-2xl w-full"></div>
                  <div class="h-16 bg-slate-100/50 backdrop-blur-md rounded-2xl w-full"></div>
                </div>
              </div>
            </div>

            <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
              <h3 class="font-display text-xl font-semibold text-slate-900 tracking-tighter mb-6">Distribusi Anggota</h3>
              <div class="h-64 relative"><canvas id="member-chart"></canvas></div>
            </div>
          </div>
        </div>
      </div>
    </div >

    <!-- ============================================
    PROFIL ORGANISASI TAB - HANYA DATA ORGANISASI
  KONTEN: Identitas, Alamat, Struktur, Kontak, AI Config
          TIDAK ADA: Users, Sekolah, Template, Logs
    ============================================ -->
    <div id="panel-profil" data-admin-only="true" class="hidden animate-fade-in space-y-8" data-tab-content="profil">
       <!-- Info Banner -->
       <div class="bg-slate-50 backdrop-blur-xl border border-slate-200/70 rounded-2xl p-5 flex gap-4 text-sm text-slate-600">
          <i class="fas fa-info-circle mt-0.5 text-slate-900"></i>
          <div>
            <p class="font-semibold text-slate-900 mb-1 tracking-tight">Fungsi Data Organisasi</p>
            <p class="font-light">Informasi ini digunakan secara otomatis untuk <strong>Kop Surat</strong>, <strong>Laporan</strong>, dan <strong>Identitas Website</strong>. Pastikan data selalu valid.</p>
          </div>
       </div>

      <!-- Logo & Header Section -->
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
        <h2 class="font-display text-2xl font-semibold text-slate-900 mb-8 flex items-center gap-4 tracking-tighter">
          <span class="w-10 h-10 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center text-sm shadow-sm shadow-slate-200/50"><i class="fas fa-image"></i></span>
          Identitas & Logo
        </h2>
        
        <div class="flex flex-col md:flex-row gap-8">
          <div class="flex-shrink-0 text-center">
            <div id="logo-preview" class="w-48 h-48 bg-slate-100/50 backdrop-blur-md rounded-3xl flex items-center justify-center border border-dashed border-slate-200/70 overflow-hidden mx-auto relative group transition-all hover:border-indigo-100">
                <span class="text-slate-500 text-sm font-medium tracking-tight group-hover:hidden">Pratinjau Logo</span>
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm items-center justify-center hidden group-hover:flex text-slate-900 font-medium text-xs tracking-widest uppercase">Ubah Logo</div>
            </div>
            <label class="mt-6 inline-block cursor-pointer w-full">
              <input type="file" id="logo-input" accept="image/*" class="hidden" onchange="uploadLogo(this)">
              <span class="px-5 py-2.5 bg-white/95 backdrop-blur-xl text-slate-900 border border-slate-200/70 rounded-full text-xs font-semibold tracking-wide uppercase hover:bg-slate-100/50 backdrop-blur-md transition-colors shadow-sm shadow-slate-200/50 flex items-center justify-center">
                <i class="fas fa-upload mr-2"></i>Upload
              </span>
            </label>
          </div>
          
          <div class="flex-1 grid gap-6">
            <div>
              <label class="label">Nama Organisasi (KKG)</label>
              <input type="text" id="profil-nama_kkg" class="input-field" placeholder="KKG Gugus 3 Kecamatan Wanayasa">
            </div>
            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="label">Tahun Ajaran Aktif</label>
                <input type="text" id="profil-tahun_ajaran" class="input-field" placeholder="2025/2026">
              </div>
              <div>
                <label class="label">NPSN Sekolah Induk</label>
                <input type="text" id="profil-npsn_sekolah_induk" class="input-field" placeholder="20231234">
              </div>
            </div>
            <div>
              <label class="label">Nama Sekolah Induk</label>
              <input type="text" id="profil-nama_sekolah_induk" class="input-field" placeholder="SDN 1 Wanayasa">
            </div>
          </div>
        </div>
      </div>

      <!-- Alamat Section -->
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
        <h2 class="font-display text-2xl font-semibold text-slate-900 mb-8 flex items-center gap-4 tracking-tighter">
          <span class="w-10 h-10 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center text-sm shadow-sm shadow-slate-200/50"><i class="fas fa-map-marker-alt"></i></span>
          Alamat Sekretariat
        </h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label class="label">Alamat Lengkap</label>
            <input type="text" id="profil-alamat_sekretariat" class="input-field" placeholder="Jl. Raya Wanayasa No. 1">
          </div>
          <div>
            <label class="label">Kecamatan</label>
            <input type="text" id="profil-kecamatan" class="input-field" placeholder="Wanayasa">
          </div>
          <div>
            <label class="label">Kabupaten/Kota</label>
            <input type="text" id="profil-kabupaten" class="input-field" placeholder="Purwakarta">
          </div>
          <div>
            <label class="label">Provinsi</label>
            <input type="text" id="profil-provinsi" class="input-field" placeholder="Jawa Barat">
          </div>
          <div>
            <label class="label">Kode Pos</label>
            <input type="text" id="profil-kode_pos" class="input-field" placeholder="41174">
          </div>
        </div>
      </div>

      <!-- Struktur & Kontak -->
      <div class="grid lg:grid-cols-2 gap-8">
          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
              <h2 class="font-display text-2xl font-semibold text-slate-900 mb-8 flex items-center gap-4 tracking-tighter">
                <span class="w-10 h-10 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center text-sm shadow-sm shadow-slate-200/50"><i class="fas fa-sitemap"></i></span>
                Struktur Inti
              </h2>
              <div class="space-y-4">
                  <div>
                      <label class="label">Ketua KKG</label>
                      <input type="text" id="profil-nama_ketua" class="input-field">
                  </div>
                  <div>
                      <label class="label">Sekretaris</label>
                      <input type="text" id="profil-nama_sekretaris" class="input-field">
                  </div>
                  <div>
                      <label class="label">Bendahara</label>
                      <input type="text" id="profil-nama_bendahara" class="input-field">
                  </div>
              </div>
          </div>
           <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
              <h2 class="font-display text-2xl font-semibold text-slate-900 mb-8 flex items-center gap-4 tracking-tighter">
                <span class="w-10 h-10 rounded-2xl bg-slate-100/50 backdrop-blur-md border border-slate-200/70 text-slate-900 flex items-center justify-center text-sm shadow-sm shadow-slate-200/50"><i class="fas fa-address-book"></i></span>
                Kontak Resmi
              </h2>
              <div class="space-y-4">
                  <div>
                      <label class="label">Email Organisasi</label>
                      <input type="email" id="profil-email_kkg" class="input-field">
                  </div>
                  <div>
                      <label class="label">Telepon / WhatsApp</label>
                      <input type="tel" id="profil-telepon_kkg" class="input-field">
                  </div>
                  <div>
                      <label class="label">Website Resmi</label>
                      <input type="url" id="profil-website_kkg" class="input-field">
                  </div>
              </div>
          </div>
      </div>
      
       <!-- Centralized AI Provider Banner & Storage -->
       <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-slate-100/50 backdrop-blur-md rounded-bl-full pointer-events-none opacity-50"></div>
          <h2 class="font-display text-2xl font-semibold text-slate-900 mb-8 flex items-center gap-4 tracking-tighter relative z-10">
             <span class="w-10 h-10 rounded-2xl bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-indigo-600 flex items-center justify-center text-sm shadow-sm shadow-slate-200/50"><i class="fas fa-robot"></i></span>
             Konfigurasi AI & Sistem
          </h2>
          <div class="space-y-6">
             <!-- AI Provider Migration Banner -->
             <div class="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start gap-4">
                   <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                      <i class="fas fa-microchip"></i>
                   </div>
                   <div>
                      <h4 class="text-base font-bold text-indigo-950">Pengelolaan AI Provider Multi-Vendor</h4>
                      <p class="text-xs text-indigo-700 mt-1 max-w-xl leading-relaxed">
                         Pengaturan model AI, Base URL custom (OpenAI-compatible, Anthropic, Bedrock, Gemini SDK), API Key, dan uji koneksi langsung kini dikelola di tab <strong>AI Provider</strong>.
                      </p>
                   </div>
                </div>
                <button type="button" onclick="switchAdminTab('ai-providers')" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-all shadow-sm flex items-center gap-2">
                   <span>Buka Kelola AI Provider</span> <i class="fas fa-arrow-right text-[10px]"></i>
                </button>
             </div>

             <div class="pt-4 border-t border-slate-200/50">
                <h3 class="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <i class="fas fa-database text-indigo-600"></i> Supabase Storage (File Upload)
                </h3>
                <div class="space-y-4">
                   <div>
                      <label class="label">Supabase URL</label>
                      <input type="text" id="settings-supabase_url" class="input-field font-mono" placeholder="https://xyz.supabase.co">
                   </div>
                   <div>
                      <label class="label">Supabase Service Key (Secret)</label>
                      <input type="password" id="settings-supabase_key" class="input-field font-mono" placeholder="eyJhbGciOiJIUzI1NiI...">
                   </div>
                   <div>
                      <label class="label">Supabase Bucket Name</label>
                      <input type="text" id="settings-supabase_bucket" class="input-field font-mono" placeholder="materi-kkg">
                   </div>
                </div>
                <p class="text-[10px] text-slate-500 mt-3">Konfigurasi ini digunakan untuk menyimpan file materi dan logo. Jika dikosongkan, sistem akan menggunakan nilai dari environment server.</p>
             </div>
             
              <div class="pt-8 border-t border-slate-200/70 mt-8 relative z-10">
                 <h3 class="font-bold text-slate-900 mb-5 text-xs uppercase tracking-widest">Zona Bahaya</h3>
                 <div class="flex flex-wrap gap-4">
                     <button type="button" onclick="clearAllCaches()" class="px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-white/95 backdrop-blur-xl border border-indigo-100 text-slate-900 hover:bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 hover:text-slate-900 transition-colors duration-300 shadow-sm shadow-slate-200/50 flex items-center">
                       <i class="fas fa-broom mr-2"></i>Clear Cache
                     </button>
                     <button type="button" onclick="initDb()" class="px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-slate-900 transition-colors duration-300 shadow-sm shadow-slate-200/50 flex items-center">
                       <i class="fas fa-database mr-2"></i>Reset Database
                     </button>
                 </div>
             </div>
          </div>
       </div>

       <div class="flex justify-end sticky bottom-6 z-20">
         <button onclick="saveProfilKKG()" class="px-8 py-3.5 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center">
           <i class="fas fa-save mr-2.5"></i>Simpan Konfigurasi
         </button>
       </div>
    </div>

    <!-- ============================================
    AI PROVIDERS TAB - PENGELOLAAN PROVIDER AI DINAMIS
    ============================================ -->
    <div id="panel-ai-providers" class="hidden animate-fade-in" data-tab-content="ai-providers">
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] min-h-[500px]">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 class="font-display text-2xl font-semibold text-slate-900 tracking-tighter mb-1 flex items-center gap-3">
              <span class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shadow-sm border border-indigo-100">
                <i class="fas fa-robot"></i>
              </span>
              Kelola AI Provider
            </h2>
            <p class="text-slate-600 font-light tracking-tight">Atur provider custom (OpenAI-compatible, Anthropic, Bedrock, Gemini SDK), kelola API Key, uji koneksi secara langsung, dan atur prioritas failover.</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="loadAdminAiProviders()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium text-xs transition-colors flex items-center gap-2">
              <i class="fas fa-rotate text-xs"></i> Refresh
            </button>
            <button onclick="showAddAiProviderModal()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm shadow-md transition-all flex items-center gap-2">
              <i class="fas fa-plus text-xs"></i> Tambah Provider
            </button>
          </div>
        </div>

        <!-- Presets bar -->
        <div class="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-indigo-900 font-medium shrink-0">
            <i class="fas fa-wand-magic-sparkles text-indigo-600"></i>
            <span>Quick-Add Preset:</span>
          </div>
          <div class="flex flex-wrap gap-2 text-xs">
            <button type="button" onclick="showAddAiProviderModal('gemini_flash')" class="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 font-medium rounded-lg border border-indigo-200/70 shadow-2xs transition-all">
              + Gemini 2.0 Flash
            </button>
            <button type="button" onclick="showAddAiProviderModal('openai_gpt4o')" class="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 font-medium rounded-lg border border-emerald-200/70 shadow-2xs transition-all">
              + OpenAI GPT-4o
            </button>
            <button type="button" onclick="showAddAiProviderModal('claude_anthropic')" class="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 font-medium rounded-lg border border-purple-200/70 shadow-2xs transition-all">
              + Claude Sonnet
            </button>
            <button type="button" onclick="showAddAiProviderModal('groq_llama')" class="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 font-medium rounded-lg border border-amber-200/70 shadow-2xs transition-all">
              + Groq LLaMA 3.3
            </button>
            <button type="button" onclick="showAddAiProviderModal('openrouter')" class="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 font-medium rounded-lg border border-sky-200/70 shadow-2xs transition-all">
              + OpenRouter
            </button>
            <button type="button" onclick="showAddAiProviderModal('ollama_local')" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200/70 shadow-2xs transition-all">
              + Ollama (Lokal)
            </button>
          </div>
        </div>

        <!-- Providers List Container -->
        <div id="ai-providers-list">
          <div class="text-center py-12 text-slate-400">
            <i class="fas fa-spinner fa-spin mr-2"></i> Memuat provider AI...
          </div>
        </div>
      </div>
    </div>

     <!-- ============================================
    SEKOLAH TAB - HANYA DATA SEKOLAH
          TIDAK ADA: Identitas, Alamat, Struktur, Template, Logs
    ============================================ -->
    <div id="panel-sekolah" class="hidden animate-fade-in" data-tab-content="sekolah">
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] min-h-[500px]">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 class="font-display text-2xl font-semibold text-slate-900 tracking-tighter mb-1">Data Sekolah</h2>
            <p class="text-slate-600 font-light tracking-tight">Kelola daftar sekolah anggota gugus</p>
          </div>
          <button onclick="showAddSekolahModal()" class="px-6 py-2.5 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center">
            <i class="fas fa-plus mr-2.5 opacity-80"></i>Tambah Sekolah
          </button>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-200/70">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-100/50 backdrop-blur-md border-b border-slate-200/70">
                <tr>
                  <th class="px-4 py-4 text-center"><input id="sekolah-check-all" type="checkbox" onchange="toggleAllSekolahRows(this.checked)"></th>
                  <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">No</th>
                  <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nama Sekolah</th>
                  <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Tipe</th>
                  <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Kepala Sekolah</th>
                  <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Guru</th>
                  <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="sekolah-table-body" class="divide-y divide-[var(--color-border-subtle)] bg-white/95 backdrop-blur-xl">
                <tr><td colspan="7" class="text-center py-12 text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat data sekolah...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div id="sekolah-selection-toolbar" class="hidden mt-3 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 flex items-center justify-between">
          <span id="sekolah-selected-count" class="text-xs font-semibold text-primary-700">0 sekolah terpilih</span>
          <span class="text-xs text-slate-500">Siap untuk bulk action tahap berikutnya</span>
        </div>
      </div>
    </div>
    
     <!-- ============================================
    USERS TAB - HANYA MANAJEMEN USER
          TIDAK ADA: Identitas, Alamat, Struktur, Template, Logs, AI Config
    ============================================ -->
    <div id="panel-users" class="hidden animate-fade-in" data-tab-content="users">
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] min-h-[500px]">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
             <h2 class="font-display text-2xl font-semibold text-slate-900 tracking-tighter mb-1">Manajemen Pengguna</h2>
             <p class="text-slate-600 font-light tracking-tight">Kelola akun dan hak akses pengguna portal</p>
          </div>
          <button data-admin-only="true" onclick="showAddUserModal()" class="px-6 py-2.5 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center">
            <i class="fas fa-user-plus mr-2.5 opacity-80"></i>Tambah User
          </button>
        </div>

        <div data-operator-only="true" class="hidden mb-6 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-800">
          <i class="fas fa-circle-info mr-2"></i>
          Anda menggunakan mode operator. Fokuskan pekerjaan pada persetujuan pengguna, data sekolah, dan operasional harian.
        </div>

        <div class="mb-6 rounded-2xl border border-slate-200/70 bg-slate-50 backdrop-blur-xl/50 p-4">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
            <div>
              <h3 class="font-semibold text-slate-900">Approval Queue</h3>
              <p class="text-xs text-slate-500">Persetujuan pendaftaran pengguna baru</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="bulk-approve-btn" onclick="bulkApprovePendingUsers()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-slate-900 hover:bg-emerald-700">Setujui Terpilih</button>
              <button id="bulk-reject-btn" onclick="bulkRejectPendingUsers()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-slate-900 hover:bg-rose-700">Tolak Terpilih</button>
              <button onclick="exportPendingApprovalsCsv()" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200/70 hover:bg-slate-900/50 backdrop-blur-xl">Export CSV</button>
              <button onclick="loadPendingApprovals()" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200/70 hover:bg-slate-900/50 backdrop-blur-xl">Muat Ulang</button>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 mb-2">Shortcut: tekan <kbd class="px-1.5 py-0.5 border rounded">A</kbd> untuk setujui dan <kbd class="px-1.5 py-0.5 border rounded">R</kbd> untuk tolak saat ada item terpilih.</p>
          <div class="mb-3">
            <input id="bulk-reject-reason" type="text" class="input-field text-xs" placeholder="Alasan penolakan massal (opsional)">
          </div>
          <div id="pending-selection-toolbar" class="hidden sticky top-20 z-10 mb-3 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 flex items-center justify-between">
            <span id="pending-selected-count" class="text-xs font-semibold text-primary-700">0 user terpilih</span>
            <div class="flex items-center gap-2">
              <button onclick="bulkApprovePendingUsers()" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-slate-900 hover:bg-emerald-700">Setujui</button>
              <button onclick="bulkRejectPendingUsers()" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-slate-900 hover:bg-rose-700">Tolak</button>
            </div>
          </div>
          <div class="overflow-x-auto rounded-xl border border-slate-200/70 bg-slate-900/50 backdrop-blur-xl">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-100/50 backdrop-blur-md border-b border-slate-200/70">
                <tr>
                  <th class="px-4 py-3 w-10 text-center"><input id="pending-check-all" type="checkbox" onchange="toggleAllPendingUsers(this.checked)"></th>
                  <th class="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nama</th>
                  <th class="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                  <th class="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Sekolah</th>
                  <th class="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="pending-users-tbody" class="bg-white/95 backdrop-blur-xl">
                <tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">Memuat antrean persetujuan...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Filter & Search -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="relative md:col-span-2">
                <input type="text" id="user-search-input" onkeyup="filterAdminUsers()" placeholder="Cari nama, email, atau sekolah..." class="w-full pl-10 pr-4 py-2 bg-slate-900/50 backdrop-blur-xl border border-slate-200/70 rounded-xl focus:ring-2 focus:ring-primary-500 transition-shadow">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="fas fa-search text-slate-500"></i>
                </div>
            </div>
            <div>
                <select id="user-role-filter" onchange="filterAdminUsers()" class="w-full px-4 py-2 bg-slate-900/50 backdrop-blur-xl border border-slate-200/70 rounded-xl focus:ring-2 focus:ring-primary-500 transition-shadow">
                    <option value="">Semua Role</option>
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                    <option value="user">User</option>
                </select>
            </div>
        </div>

         <div class="overflow-hidden rounded-xl border border-slate-200/70">
           <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-slate-100/50 backdrop-blur-md border-b border-slate-200/70">
                 <tr>
                   <th class="px-4 py-4 text-center"><input id="users-check-all" type="checkbox" onchange="toggleAllUserRows(this.checked)"></th>
                   <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nama Lengkap</th>
                   <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                   <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Sekolah Asal</th>
                   <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Peran</th>
                   <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody id="panel-users-tbody" class="divide-y divide-[var(--color-border-subtle)] bg-white/95 backdrop-blur-xl">
                  <!-- Content injected via JS loadAdminUsers -->
                </tbody>
              </table>
            </div>
          </div>
          <div id="users-selection-toolbar" class="hidden mt-3 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 flex items-center justify-between">
            <span id="users-selected-count" class="text-xs font-semibold text-primary-700">0 pengguna terpilih</span>
            <span class="text-xs text-slate-500">Siap untuk bulk action tahap berikutnya</span>
          </div>
         
         <!-- Pagination -->
         <div id="users-pagination" class="mt-4 pt-4 border-t border-slate-200/70">
           <!-- Injected via JS -->
         </div>
       </div>
     </div>

     <!-- ============================================
    TEMPLATES TAB - HANYA TEMPLATE SURAT
          TIDAK ADA: Identitas, Alamat, Struktur, Logs, Users, AI Config
    ============================================ -->
    <div id="panel-templates" data-admin-only="true" class="hidden animate-fade-in" data-tab-content="templates">
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] min-h-[500px]">
         <div class="flex justify-between items-center mb-8">
            <div>
              <h2 class="font-display text-2xl font-semibold text-slate-900 tracking-tighter mb-1">Template Surat</h2>
              <p class="text-slate-600 font-light tracking-tight">Kelola format surat resmi KKG</p>
            </div>
            <button onclick="showTemplateModal()" class="px-6 py-2.5 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center">
              <i class="fas fa-plus mr-2.5 opacity-80"></i>Buat Template
            </button>
         </div>
         
         <div class="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            <button onclick="filterTemplates('')" class="template-filter-btn px-4 py-2 rounded-lg text-sm font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 border border-primary-100 dark:border-primary-800">Semua</button>
            <button onclick="filterTemplates('undangan')" class="template-filter-btn px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 backdrop-blur-xl text-slate-600 transition-colors">Undangan</button>
            <button onclick="filterTemplates('tugas')" class="template-filter-btn px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 backdrop-blur-xl text-slate-600 transition-colors">Tugas</button>
         </div>

         <div id="templates-list" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Loaded via JS -->
         </div>
      </div>
    </div>

     <!-- ============================================
    LOGS TAB - HANYA AUDIT LOGS
          TIDAK ADA: Identitas, Alamat, Struktur, Template, Users, AI Config
    ============================================ -->
    <div id="panel-logs" data-admin-only="true" class="hidden animate-fade-in" data-tab-content="logs">
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] min-h-[500px]">
             <div class="flex justify-between items-center mb-8">
                <div>
                  <h2 class="font-display text-2xl font-semibold text-slate-900 tracking-tighter mb-1">Log Audit Sistem</h2>
                  <p class="text-slate-600 font-light tracking-tight">Riwayat aktivitas pengguna</p>
                </div>
                <div id="log-stats" class="text-xs font-semibold tracking-wider px-4 py-1.5 bg-slate-100/50 backdrop-blur-md border border-slate-200/70 rounded-full uppercase text-slate-900 shadow-sm shadow-slate-200/50"></div>
             </div>
             <div class="grid md:grid-cols-4 gap-4 mb-6">
                <div class="md:col-span-1">
                  <select id="log-filter-action" onchange="loadAuditLogs()" class="input-field text-sm"><option value="">Semua Aksi</option></select>
                </div>
                <div class="md:col-span-3">
                  <input type="text" id="log-filter-search" placeholder="Cari log..." class="input-field text-sm" onkeyup="debounceLogSearch()">
                </div>
             </div>
             
             <div class="overflow-hidden rounded-xl border border-slate-200/70">
                 <div class="overflow-x-auto">
                   <table class="w-full text-sm text-left">
                      <thead class="bg-slate-100/50 backdrop-blur-md border-b border-slate-200/70">
                          <tr>
                              <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Waktu</th>
                              <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">User</th>
                              <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                              <th class="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Detail</th>
                          </tr>
                      </thead>
                      <tbody id="audit-log-body" class="divide-y divide-[var(--color-border-subtle)] bg-white/95 backdrop-blur-xl"></tbody>
                   </table>
                 </div>
             </div>
             <div id="log-pagination" class="flex justify-end mt-4 gap-2"></div>
        </div>
    </div>

    <!-- Modals (Sekolah, User, Template) -->
    <!-- Add Sekolah Modal -->
    <div id="sekolah-modal" role="dialog" aria-modal="true" aria-labelledby="sekolah-modal-title" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeSekolahModal()"></div>
        <div class="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 animate-slide-up flex flex-col max-h-[90vh] border border-slate-200/70">
            <div class="px-8 py-6 border-b border-slate-200/70 flex justify-between items-center bg-slate-100/50 backdrop-blur-md">
                <h3 id="sekolah-modal-title" class="font-display text-xl font-semibold text-slate-900 tracking-tight">Tambah Sekolah</h3>
                <button type="button" onclick="closeSekolahModal()" class="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-indigo-100 transition-all shadow-sm shadow-slate-200/50"><i class="fas fa-times text-xs"></i></button>
            </div>
            <div class="overflow-y-auto p-6">
              <form id="sekolah-form" onsubmit="saveSekolah(event)" class="space-y-4">
                  <input type="hidden" name="id_sekolah">
                  <div>
                    <label class="label">Nama Sekolah <span class="text-red-500">*</span></label>
                    <input type="text" name="nama" placeholder="Contoh: SDN 1 Wanayasa" class="input-field" required>
                  </div>
                  
                  <div>
                    <label class="label">Alamat</label>
                    <textarea name="alamat" placeholder="Alamat lengkap sekolah..." class="input-field h-24 resize-none"></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="label">NPSN</label>
                        <input type="text" name="npsn" placeholder="Nomor NPSN" class="input-field">
                      </div>
                      <div>
                        <label class="label">Tipe</label>
                        <select name="tipe" class="input-field">
                          <option value="negeri">Negeri</option>
                          <option value="swasta">Swasta</option>
                        </select>
                      </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="label">Kepala Sekolah</label>
                        <input type="text" name="kepala_sekolah" class="input-field">
                      </div>
                      <div>
                        <label class="label">NIP Kepsek</label>
                        <input type="text" name="nip_kepala_sekolah" class="input-field">
                      </div>
                  </div>

                  <div>
                    <label class="label">Jumlah Guru</label>
                    <input type="number" name="jumlah_guru" class="input-field">
                  </div>

                  <div class="flex items-center gap-6 pt-2">
                      <label class="flex items-center gap-2 text-sm text-slate-900 cursor-pointer">
                        <input type="checkbox" name="is_sekretariat" class="accent-primary-500 w-4 h-4"> 
                        Sekretariat KKG
                      </label>
                      <label class="flex items-center gap-2 text-sm text-slate-900 cursor-pointer">
                        <input type="checkbox" name="is_sekolah_penggerak" class="accent-primary-500 w-4 h-4"> 
                        Sekolah Penggerak
                      </label>
                  </div>

                  <div class="pt-4 border-t border-slate-200/70 mt-4">
                    <label class="label">Kop Surat (Gambar PNG/JPG)</label>
                    <input type="hidden" name="kop_surat_url">
                    <div id="kop-surat-preview" class="mb-3 hidden">
                      <img id="kop-surat-img" src="" class="w-full h-auto rounded-lg border border-slate-200 shadow-sm" alt="Preview Kop Surat">
                      <button type="button" onclick="removeKopSurat()" class="mt-2 text-xs text-red-500 hover:text-red-700"><i class="fas fa-trash mr-1"></i>Hapus Kop Surat</button>
                    </div>
                    <label class="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div class="text-center">
                        <i class="fas fa-cloud-upload-alt text-slate-400 text-xl mb-1"></i>
                        <p class="text-xs text-slate-500">Klik untuk upload gambar kop surat</p>
                      </div>
                      <input type="file" name="kop_surat_file" accept="image/png,image/jpeg,image/webp" class="hidden" onchange="previewKopSurat(this)">
                    </label>
                  </div>
                  
                  <button id="sekolah-submit-btn" type="submit" class="w-full mt-6 px-6 py-3 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">Simpan Data Sekolah</button>
              </form>
            </div>
        </div>
    </div>
    
    <!-- Add User Modal -->
    <div id="add-user-modal" role="dialog" aria-modal="true" aria-labelledby="add-user-modal-title" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
         <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeAdminModal('add-user-modal')"></div>
         <div class="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 animate-slide-up border border-slate-200/70">
            <div class="px-8 py-6 border-b border-slate-200/70 bg-slate-100/50 backdrop-blur-md flex justify-between items-center">
                <h3 id="add-user-modal-title" class="font-display text-xl font-semibold text-slate-900 tracking-tight">Tambah User Baru</h3>
                <button type="button" onclick="closeAdminModal('add-user-modal')" class="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-indigo-100 transition-all shadow-sm shadow-slate-200/50"><i class="fas fa-times text-xs"></i></button>
            </div>
            <form onsubmit="saveNewUser(event)" class="p-6 space-y-4">
                <div>
                  <label class="label">Nama Lengkap <span class="text-red-500">*</span></label>
                  <input type="text" name="nama" class="input-field" required>
                </div>
                <div>
                  <label class="label">Email <span class="text-red-500">*</span></label>
                  <input type="email" name="email" class="input-field" required oninput="validateUserForm('add')">
                  <p id="add-user-email-hint" class="text-xs text-slate-500 mt-1">Gunakan email aktif (contoh: nama@domain.com).</p>
                </div>
                <div>
                  <label class="label">Password <span class="text-red-500">*</span></label>
                  <input type="password" name="password" class="input-field" required minlength="6" oninput="validateUserForm('add')">
                  <p id="add-user-password-hint" class="text-xs text-slate-500 mt-1">Minimal 6 karakter.</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="label">Role</label>
                      <select name="role" class="input-field"><option value="user">User</option><option value="operator">Operator</option><option value="admin">Admin</option></select>
                    </div>
                    <div>
                      <label class="label">Sekolah</label>
                      <select name="sekolah" class="input-field w-full">
                        <option value="">-- Memuat --</option>
                      </select>
                    </div>
                </div>
                <div class="flex justify-end gap-3 pt-6 border-t border-slate-200/70 mt-6">
                    <button type="button" onclick="closeAdminModal('add-user-modal')" class="px-5 py-2.5 rounded-full text-sm font-medium border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900 transition-colors">Batal</button>
                    <button id="add-user-submit" type="submit" class="px-5 py-2.5 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">Simpan User</button>
                </div>
            </form>
         </div>
    </div>

    <!-- Edit User Modal -->
    <div id="edit-user-modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-modal-title" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeAdminModal('edit-user-modal')"></div>
      <div class="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 animate-slide-up border border-slate-200/70">
        <div class="px-8 py-6 border-b border-slate-200/70 bg-slate-100/50 backdrop-blur-md flex justify-between items-center">
          <h3 id="edit-user-modal-title" class="font-display text-xl font-semibold text-slate-900 tracking-tight">Edit User</h3>
          <button type="button" onclick="closeAdminModal('edit-user-modal')" class="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-indigo-100 transition-all shadow-sm shadow-slate-200/50"><i class="fas fa-times text-xs"></i></button>
        </div>
        <form onsubmit="saveUser(event)" class="p-6 space-y-4">
          <input type="hidden" name="id">
            <div>
              <label class="label">Nama Lengkap</label>
              <input type="text" name="nama" class="input-field" required>
            </div>
            <div>
              <label class="label">Email</label>
              <input type="email" name="email" class="input-field" required oninput="validateUserForm('edit')">
              <p id="edit-user-email-hint" class="text-xs text-slate-500 mt-1">Format email valid wajib digunakan.</p>
            </div>
            <div>
              <label class="label">NIP</label>
              <input type="text" name="nip" class="input-field" placeholder="NIP Guru">
            </div>
            <div>
              <label class="label">Sekolah</label>
              <select name="sekolah" id="user-sekolah-select" class="input-field"><option value="">-- Pilih Sekolah --</option></select>
            </div>
            <div>
              <label class="label">Role</label>
              <select name="role" class="input-field"><option value="user">User</option><option value="operator">Operator</option><option value="admin">Admin</option></select>
            </div>
            <div class="flex justify-end gap-3 pt-6 border-t border-slate-200/70 mt-6">
              <button type="button" onclick="closeAdminModal('edit-user-modal')" class="px-5 py-2.5 rounded-full text-sm font-medium border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900 transition-colors">Batal</button>
              <button id="edit-user-submit" type="submit" class="px-5 py-2.5 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">Simpan Perubahan</button>
            </div>
        </form>
      </div>
    </div>

    <!-- Reject User Modal -->
    <div id="reject-user-modal" role="dialog" aria-modal="true" aria-labelledby="reject-user-modal-title" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeRejectUserModal()"></div>
      <div class="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 animate-slide-up border border-slate-200/70">
        <div class="px-8 py-6 border-b border-slate-200/70 bg-slate-100/50 backdrop-blur-md flex justify-between items-start">
          <div>
            <h3 id="reject-user-modal-title" class="font-display text-xl font-semibold text-slate-900 tracking-tight">Tolak Pendaftaran User</h3>
            <p id="reject-user-modal-subtitle" class="text-xs text-slate-500 mt-1.5"></p>
          </div>
          <button type="button" onclick="closeRejectUserModal()" class="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-indigo-100 transition-all shadow-sm shadow-slate-200/50 shrink-0"><i class="fas fa-times text-xs"></i></button>
        </div>
        <form onsubmit="submitRejectUser(event)" class="p-6 space-y-4">
          <input type="hidden" id="reject-user-id">
          <div>
            <label class="label">Alasan Penolakan</label>
            <textarea id="reject-user-reason" class="input-field h-24 resize-none" placeholder="Contoh: Data sekolah belum lengkap"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-6 border-t border-slate-200/70 mt-6">
            <button type="button" onclick="closeRejectUserModal()" class="px-5 py-2.5 rounded-full text-sm font-medium border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900 transition-colors">Batal</button>
            <button type="submit" class="px-5 py-2.5 bg-rose-600 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 hover:bg-rose-700">Tolak User</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div id="reset-password-modal" role="dialog" aria-modal="true" aria-labelledby="reset-password-modal-title" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeResetPasswordModal()"></div>
      <div class="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 animate-slide-up border border-slate-200/70">
        <div class="px-8 py-6 border-b border-slate-200/70 bg-slate-100/50 backdrop-blur-md flex justify-between items-start">
          <div>
            <h3 id="reset-password-modal-title" class="font-display text-xl font-semibold text-slate-900 tracking-tight">Reset Password User</h3>
            <p class="text-xs text-slate-500 mt-1.5">Password baru minimal 6 karakter.</p>
          </div>
          <button type="button" onclick="closeResetPasswordModal()" class="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-indigo-100 transition-all shadow-sm shadow-slate-200/50 shrink-0"><i class="fas fa-times text-xs"></i></button>
        </div>
        <form onsubmit="submitResetPassword(event)" class="p-6 space-y-4">
          <input type="hidden" id="reset-password-user-id">
            <div>
              <label class="label">Password Baru</label>
              <input id="reset-password-input" type="password" class="input-field" minlength="6" required oninput="validateResetPassword()">
                <p id="reset-password-hint" class="text-xs text-slate-500 mt-1">Masukkan password baru untuk pengguna.</p>
            </div>
            <div class="flex justify-end gap-3 pt-6 border-t border-slate-200/70 mt-6">
              <button type="button" onclick="closeResetPasswordModal()" class="px-5 py-2.5 rounded-full text-sm font-medium border border-slate-200/70 bg-white/95 backdrop-blur-xl text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900 transition-colors">Batal</button>
              <button id="reset-password-submit" type="submit" class="px-5 py-2.5 bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 rounded-full font-medium text-sm shadow-[0_12px_24px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">Simpan Password</button>
            </div>
        </form>
      </div>
    </div>

    <!-- Add / Edit AI Provider Modal -->
    <div id="ai-provider-modal" role="dialog" aria-modal="true" aria-labelledby="ai-provider-modal-title" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeAiProviderModal()"></div>
      <div class="bg-white/95 backdrop-blur-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 animate-slide-up border border-slate-200/70">
        <div class="px-8 py-6 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md flex justify-between items-center sticky top-0 bg-white/95 z-10">
          <div>
            <h3 id="ai-provider-modal-title" class="font-display text-xl font-semibold text-slate-900 tracking-tight">Tambah Provider AI</h3>
            <p class="text-xs text-slate-500 mt-1">Konfigurasi endpoint, model, dan autentikasi provider AI.</p>
          </div>
          <button type="button" onclick="closeAiProviderModal()" class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <form id="ai-provider-form" onsubmit="saveAiProvider(event)" class="p-8 space-y-5">
          <input type="hidden" id="ai-provider-id">

          <!-- Row 1: Name & Slug -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Nama Provider <span class="text-rose-500">*</span></label>
              <input type="text" id="aip-name" required placeholder="Contoh: Google Gemini Flash" class="input-field" oninput="onAiProviderNameChange()">
            </div>
            <div>
              <label class="label">Slug Identifier <span class="text-rose-500">*</span></label>
              <input type="text" id="aip-slug" required placeholder="gemini-flash" class="input-field font-mono" onfocus="onAiProviderSlugTouch()">
              <p class="text-[11px] text-slate-400 mt-1">Huruf kecil, angka, dan tanda hubung.</p>
            </div>
          </div>

          <!-- Row 2: API Type & Priority -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Tipe API <span class="text-rose-500">*</span></label>
              <select id="aip-api_type" class="input-field" onchange="onAiProviderTypeChange()">
                <option value="openai_compat">OpenAI Compatible (Standard)</option>
                <option value="anthropic">Anthropic Messages API</option>
                <option value="gemini_sdk">Google Generative AI SDK</option>
                <option value="bedrock">AWS Bedrock</option>
                <option value="custom_proxy">Custom HTTP Proxy</option>
              </select>
            </div>
            <div>
              <label class="label">Prioritas Failover (1 = Utama)</label>
              <input type="number" id="aip-priority" min="1" max="999" value="100" class="input-field">
              <p class="text-[11px] text-slate-400 mt-1">Urutan prioritas pemanggilan (angka kecil diprioritaskan).</p>
            </div>
          </div>

          <!-- Row 3: Base URL -->
          <div>
            <label class="label">Base URL <span class="text-rose-500">*</span></label>
            <input type="url" id="aip-base_url" required placeholder="https://api.openai.com/v1" class="input-field font-mono">
            <p class="text-[11px] text-slate-400 mt-1">Untuk OpenAI-compat, sistem otomatis menambahkan <code>/chat/completions</code>.</p>
          </div>

          <!-- Row 4: Model ID (with Auto-Fetch Models Button, Dropdown Picker & Chips) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="label mb-0">Model ID <span class="text-rose-500">*</span></label>
              <button type="button" id="btn-fetch-models" onclick="window.fetchAiProviderModels()" class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/60 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fas fa-satellite-dish text-[10px]"></i> <span>Tarik Daftar Model</span>
              </button>
            </div>
            
            <div class="space-y-2">
              <div class="relative">
                <input type="text" id="aip-model" required placeholder="Ketik atau pilih dari daftar model..." class="input-field font-mono" autocomplete="off">
              </div>

              <!-- Quick Model Select Dropdown (Visible after fetch) -->
              <div id="aip-model-select-wrapper" class="hidden">
                <div class="flex items-center gap-2">
                  <select id="aip-model-select" onchange="window.onAiModelSelectChange(this.value)" class="input-field font-mono text-xs text-indigo-900 bg-indigo-50/70 border-indigo-200 focus:border-indigo-500 py-2">
                    <option value="">-- Pilih Model dari Server --</option>
                  </select>
                </div>
              </div>

              <!-- Clickable Model Chips Container -->
              <div id="aip-model-chips" class="flex flex-wrap gap-1.5 pt-0.5"></div>
            </div>

            <p id="aip-models-feedback" class="text-[11px] text-slate-400 mt-1.5">
              💡 Klik <strong>"Tarik Daftar Model"</strong> untuk memuat seluruh model aktif langsung dari server provider.
            </p>
          </div>

          <!-- Row 5: API Key (Multi-Key Pool / Load Balancing Support) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="label mb-0">API Key (Multi-Key Pool / Bulk Paste)</label>
              <span id="aip-key-count-pill" class="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 hidden">
                0 Kunci
              </span>
            </div>
            <div class="relative">
              <textarea id="aip-api_key" rows="2" placeholder="sk-...&#10;(Bisa paste 1 key per baris untuk rotasi beban otomatis / Load Balancing)" class="input-field font-mono text-xs pr-8 resize-y"></textarea>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">
              💡 <strong>Tips Multi-Key:</strong> Masukkan 1 key per baris. Sistem otomatis melakukan rotasi beban (Round-Robin) dan auto-switch jika 1 key kena limit (429).
            </p>
          </div>

          <!-- Row 5: Max Tokens & Temperature -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Max Output Tokens</label>
              <input type="number" id="aip-max_tokens" min="256" max="131072" value="8192" class="input-field font-mono">
            </div>
            <div>
              <label class="label">Temperature (0.0 - 2.0)</label>
              <input type="number" id="aip-temperature" min="0" max="2" step="any" value="0.7" class="input-field font-mono">
            </div>
          </div>

          <!-- Advanced Accordion: Headers & Body -->
          <details class="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <summary class="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <i class="fas fa-sliders mr-1 text-slate-400"></i> Pengaturan Lanjutan (Extra Headers & Body JSON)
            </summary>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200/60">
              <div>
                <label class="label">Extra HTTP Headers (JSON)</label>
                <textarea id="aip-extra_headers" rows="3" class="input-field font-mono text-xs" placeholder="{}">{}</textarea>
              </div>
              <div>
                <label class="label">Extra Request Body (JSON)</label>
                <textarea id="aip-extra_body" rows="3" class="input-field font-mono text-xs" placeholder="{}">{}</textarea>
              </div>
            </div>
          </details>

          <!-- Modal Actions -->
          <div class="flex justify-end gap-3 pt-6 border-t border-slate-200/70 mt-6">
            <button type="button" onclick="closeAiProviderModal()" class="px-5 py-2.5 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button id="ai-provider-submit-btn" type="submit" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm shadow-md transition-all">
              <i class="fas fa-save mr-1.5"></i> Simpan Provider
            </button>
          </div>
        </form>
      </div>
    </div>

  `;
  return renderAdminLayout(innerContent, state.currentAdminTab || 'dashboard');
}

// Tab Switching
