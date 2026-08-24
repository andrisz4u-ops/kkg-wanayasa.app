import { state } from '../../state.js';
import { api } from '../../api.js';
import { debounce, escapeHtml, formatDate } from '../../utils.js';
import {
  dashboardRefreshInterval, setDashboardRefreshInterval,
  dashboardPeriodDays,
  dashboardTrendPeriod,
  dashboardActivityDays,
  slaPendingThreshold,
  getDateNDaysAgo,
} from './shared-state.js';

const moduleToast = (section, message, type = 'info') => window.showToast?.(message, type);

// Auto-refresh dashboard every 30 seconds
function startDashboardAutoRefresh() {
  // Clear any existing interval
  if (dashboardRefreshInterval) {
    clearInterval(dashboardRefreshInterval);
  }

  // Only auto-refresh if dashboard panel is visible
  const dashboardPanel = document.getElementById('panel-dashboard');
  if (dashboardPanel && !dashboardPanel.classList.contains('hidden')) {
    setDashboardRefreshInterval(setInterval(() => {
      // Silently refresh data without showing loading states
      refreshDashboardData();
    }, 30000)); // 30 seconds
  }
}

// Stop auto-refresh
function stopDashboardAutoRefresh() {
  if (dashboardRefreshInterval) {
    clearInterval(dashboardRefreshInterval);
    setDashboardRefreshInterval(null);
  }
}

// Silent refresh (no loading indicators)
async function refreshDashboardData() {
  try {
    await loadAdminDashboard(true);
    // Update recent activity
    await loadDashboardActivity();
  } catch (e) {
    console.error('Silent dashboard refresh failed:', e);
    // Don't show error for auto-refresh
  }
}

function setMetricValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = String(value ?? 0);
  }
}

function updateDashboardMetrics(stats, approvalStats) {
  setMetricValue('total-guru', stats.total_guru || 0);
  setMetricValue('total-surat', stats.total_surat || 0);
  setMetricValue('total-proker', stats.total_proker || 0);
  setMetricValue('total-kegiatan', stats.total_kegiatan || 0);

  setMetricValue('metric-new-users', stats.analytics?.new_users_this_month || 0);
  setMetricValue('metric-active-users', stats.analytics?.active_users_today || 0);
  setMetricValue('metric-pending-users', approvalStats?.pending || 0);
  setMetricValue('metric-content-total', (stats.total_surat || 0) + (stats.total_proker || 0) + (stats.total_materi || 0));

  updateSlaOverview(stats, approvalStats);
}

function updateSlaOverview(stats, approvalStats) {
  const pending = Number(approvalStats?.pending || 0);
  const activeToday = Number(stats.analytics?.active_users_today || 0);
  const recentErrors = Number(stats.analytics?.error_logs_24h || 0);

  const badges = [];
  if (pending > slaPendingThreshold) badges.push({ tone: 'rose', text: `Persetujuan menumpuk (${pending})` });
  if (activeToday === 0) badges.push({ tone: 'amber', text: 'Tidak ada aktivitas pengguna hari ini' });
  if (recentErrors > 0) badges.push({ tone: 'rose', text: `Error 24 jam: ${recentErrors}` });
  if (badges.length === 0) badges.push({ tone: 'emerald', text: 'Operasional normal dan stabil' });

  const container = document.getElementById('sla-overview');
  if (!container) return;

  container.innerHTML = badges.map((b) => {
    const toneMap = {
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${toneMap[b.tone]}">${escapeHtml(b.text)}</span>`;
  }).join('');
}

// Load Dashboard Data - Sequential to avoid rate limiting
async function loadAdminDashboard(isSilent = false) {
  try {
    // Load main dashboard data first
    const res = await api(`/admin/dashboard?period=${dashboardPeriodDays}`);
    const stats = res.data;

    // Small delay before next request
    await new Promise(resolve => setTimeout(resolve, 200));

    // Load approval stats
    const approvalRes = await api('/admin/users/approval-stats');
    const approvalStats = approvalRes?.data || {};

    updateDashboardMetrics(stats, approvalStats);

    // Load widgets sequentially
    await loadPendingUsersWidget();
    await new Promise(resolve => setTimeout(resolve, 100));
    await loadDashboardTaskList(stats, approvalStats);

    // Load activity last
    await new Promise(resolve => setTimeout(resolve, 100));
    await loadDashboardActivity();

    // Initialize charts if panel is visible
    if (!isSilent && !document.getElementById('panel-dashboard').classList.contains('hidden')) {
      setTimeout(() => initDashboardCharts(), 100);
    }

  } catch (e) {
    console.error('Failed to load dashboard:', e);
  }
}

async function loadDashboardActivity() {
  const container = document.getElementById('dashboard-recent-logs');
  if (!container) return;

  try {
    const params = new URLSearchParams({
      page: '1',
      limit: '5',
      start_date: getDateNDaysAgo(dashboardActivityDays),
    });

    const res = await api(`/admin/logs?${params.toString()}`);
    const logs = res.data?.logs || [];

    if (logs.length === 0) {
      container.innerHTML = '<div class="text-sm text-slate-500 italic">Belum ada aktivitas.</div>';
      return;
    }

    container.innerHTML = logs.map(log => `
       <div class="flex gap-3 items-start p-3 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-slate-200/70 hover:border-blue-300 transition-colors">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center text-xs">
             <i class="fas ${getActionIcon(log.action)}"></i>
          </div>
          <div class="min-w-0 flex-1">
             <p class="text-sm font-medium text-slate-900 truncate">
               <span class="font-bold">${escapeHtml(log.user_name || 'System')}</span> 
               <span class="text-slate-500 font-normal">melakukan</span> 
               <span class="text-blue-600 dark:text-blue-400 font-medium">${escapeHtml(log.action)}</span>
             </p>
             <p class="text-xs text-slate-500 mt-0.5">${formatActivityTime(log.created_at)}</p>
          </div>
       </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load activity:', e);
    container.innerHTML = '<div class="text-xs text-red-500">Gagal memuat aktivitas.</div>';
  }
}

function getActionIcon(action) {
  action = action.toLowerCase();
  if (action.includes('login')) return 'fa-sign-in-alt';
  if (action.includes('create') || action.includes('add')) return 'fa-plus';
  if (action.includes('update') || action.includes('edit')) return 'fa-pen';
  if (action.includes('delete') || action.includes('remove')) return 'fa-trash';
  return 'fa-bolt';
}

function formatActivityTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  return formatDate(dateStr); // Util function
}

async function loadPendingUsersWidget() {
  const container = document.getElementById('pending-approval-list');
  if (!container) return;

  try {
    const res = await api('/admin/users/pending');
    const pendingUsers = (res.data || []).slice(0, 5);

    if (pendingUsers.length === 0) {
      container.innerHTML = '<div class="text-sm text-slate-500">Tidak ada user yang menunggu persetujuan.</div>';
      return;
    }

    container.innerHTML = pendingUsers.map((u) => `
      <div class="rounded-xl border border-slate-200/70 p-3 bg-slate-900/50 backdrop-blur-xl">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold text-slate-900 truncate">${escapeHtml(u.nama)}</p>
            <p class="text-xs text-slate-500 truncate">${escapeHtml(u.email)}</p>
            <p class="text-[11px] text-slate-500 mt-1">${escapeHtml(u.sekolah || 'Sekolah belum diisi')}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="approvePendingUserDashboard(${u.id})" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">Setujui</button>
            <button onclick="rejectPendingUserDashboard(${u.id}, '${escapeHtml(u.nama)}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200">Tolak</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<div class="text-sm text-red-500">Gagal memuat daftar persetujuan user.</div>';
  }
}

async function loadDashboardTaskList(stats, approvalStats) {
  const container = document.getElementById('dashboard-task-list');
  if (!container) return;

  const tasks = [];
  const pendingCount = Number(approvalStats?.pending || 0);
  if (pendingCount > 0) {
    tasks.push({
      tone: 'amber',
      text: `${pendingCount} pengguna menunggu persetujuan akun`,
      action: `<button onclick="switchAdminTab('users')" class="text-xs font-semibold text-amber-700 hover:underline">Tinjau</button>`
    });
  }

  if (Number(stats.analytics?.error_logs_24h || 0) > 0) {
    tasks.push({
      tone: 'rose',
      text: `Terdapat ${stats.analytics.error_logs_24h} error log dalam 24 jam`,
      action: `<button onclick="switchAdminTab('logs')" class="text-xs font-semibold text-rose-700 hover:underline">Cek Log</button>`
    });
  }

  try {
    const upcomingRes = await api('/dashboard/upcoming');
    const upcoming = (upcomingRes.data || []).slice(0, 2);
    upcoming.forEach((item) => {
      tasks.push({
        tone: 'blue',
        text: `Kegiatan "${escapeHtml(item.nama)}" berlangsung ${item.daysUntil <= 0 ? 'hari ini' : `${item.daysUntil} hari lagi`}`,
        action: `<button onclick="navigate('laporan')" class="text-xs font-semibold text-blue-700 hover:underline">Buka Laporan</button>`
      });
    });
  } catch (_) {
    // Skip upcoming tasks if endpoint fails
  }

  if (tasks.length === 0) {
    tasks.push({ tone: 'emerald', text: 'Tidak ada tugas kritis hari ini. Operasional berjalan baik.', action: '' });
  }

  const toneMap = {
    blue: 'border-blue-200 bg-blue-50/70 text-blue-900',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-900',
    rose: 'border-rose-200 bg-rose-50/70 text-rose-900',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
  };

  container.innerHTML = tasks.map((task) => `
    <div class="rounded-xl border p-3 ${toneMap[task.tone] || toneMap.blue}">
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm leading-relaxed">${task.text}</p>
        ${task.action || '<span class="text-xs font-medium opacity-70">OK</span>'}
      </div>
    </div>
  `).join('');
}

window.approvePendingUserDashboard = async function (userId) {
  await window.approvePendingUser(userId);
}

window.rejectPendingUserDashboard = async function (userId, userName = '') {
  await window.rejectPendingUser(userId, userName);
}


// ============================================
// Chart Functions
// ============================================

let activityChart = null;
let memberChart = null;

window.initDashboardCharts = async function () {
  try {
    const trendsRes = await api(`/dashboard/trends?period=${dashboardTrendPeriod}`);
    const trends = trendsRes.data;
    const memberRes = await api('/dashboard/members');
    const memberData = memberRes.data;

    // Activity Chart
    const activityCtx = document.getElementById('activity-chart');
    if (activityCtx && window.Chart) {
      if (activityChart) activityChart.destroy();
      const labels = trends.surat?.map(d => d.period) || [];

      activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['No Data'],
          datasets: [
            { label: 'Surat', data: trends.surat?.map(d => d.count) || [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true },
            { label: 'Absensi', data: trends.absensi?.map(d => d.count) || [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4, fill: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      });
    }

    // Member Chart
    const memberCtx = document.getElementById('member-chart');
    if (memberCtx && window.Chart) {
      if (memberChart) memberChart.destroy();
      memberChart = new Chart(memberCtx, {
        type: 'doughnut',
        data: {
          labels: memberData?.bySchool?.map(s => s.sekolah) || ['No Data'],
          datasets: [{
            data: memberData?.bySchool?.map(s => s.count) || [1],
            backgroundColor: ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 10 } } } } }
      });
    }
  } catch (e) {
    console.error('Failed to load charts:', e);
  }
}

// ============================================

