import { state } from '../../state.js';
import { api } from '../../api.js';
import { debounce, escapeHtml, formatDate, formatDateTime, formatRelativeTime } from '../../utils.js';
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
window.startDashboardAutoRefresh = function startDashboardAutoRefresh() {
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
window.stopDashboardAutoRefresh = function stopDashboardAutoRefresh() {
  if (dashboardRefreshInterval) {
    clearInterval(dashboardRefreshInterval);
    setDashboardRefreshInterval(null);
  }
}

// Silent refresh (no loading indicators)
async function refreshDashboardData() {
  try {
    await window.loadAdminDashboard(true);
    // Update recent activity
    await window.loadDashboardActivity();
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
window.loadAdminDashboard = async function loadAdminDashboard(isSilent = false) {
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

    // Load activity
    await new Promise(resolve => setTimeout(resolve, 100));
    await window.loadDashboardActivity();

    // Load School AI Usage Analytics Leaderboard
    await new Promise(resolve => setTimeout(resolve, 100));
    await window.loadSchoolAiAnalytics();

    // Initialize charts if panel is visible
    if (!isSilent && !document.getElementById('panel-dashboard').classList.contains('hidden')) {
      setTimeout(() => window.initDashboardCharts(), 100);
    }

  } catch (e) {
    console.error('Failed to load dashboard:', e);
  }
}

window.loadDashboardActivity = async function loadDashboardActivity() {
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
  return formatRelativeTime(dateStr);
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
// SCHOOL AI ANALYTICS LEADERBOARD
// ============================================

window.loadSchoolAiAnalytics = async function loadSchoolAiAnalytics(month = '') {
  const tbody = document.getElementById('school-leaderboard-tbody');
  const podiumContainer = document.getElementById('school-podium-container');
  const monthSelect = document.getElementById('school-analytics-month');

  if (!tbody) return;

  try {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await api(`/admin/analytics/schools${query}`);
    const data = res?.data;

    if (!data) return;

    // Populate month dropdown if empty or needed
    if (monthSelect && data.available_months && (monthSelect.options.length <= 1 || !month)) {
      const currentSelected = month || data.selected_month;
      monthSelect.innerHTML = data.available_months.map(m => {
        const [y, mo] = m.split('-');
        const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const label = `${monthNames[parseInt(mo, 10)] || mo} ${y}`;
        return `<option value="${m}" ${m === currentSelected ? 'selected' : ''}>${label}</option>`;
      }).join('') + `<option value="all" ${currentSelected === 'all' ? 'selected' : ''}>Semua Periode (All-Time)</option>`;
    }

    // Update Summary counters
    const summary = data.summary || {};
    setMetricValue('school-stat-total', summary.total_generations || 0);
    setMetricValue('school-stat-rpp', summary.total_rpp || 0);
    setMetricValue('school-stat-asesmen', summary.total_asesmen || 0);
    setMetricValue('school-stat-slide', summary.total_slide || 0);

    const list = data.leaderboard || [];

    // Render Podium for Top 3 (if any active schools exist)
    const activeSchools = list.filter(s => s.total_all > 0);
    if (podiumContainer) {
      if (activeSchools.length === 0) {
        podiumContainer.innerHTML = `
          <div class="col-span-full py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <i class="fas fa-chart-line text-lg"></i>
            </div>
            <p class="text-sm font-semibold text-slate-700">Belum Ada Aktivitas AI di Periode Ini</p>
            <p class="text-xs text-slate-500 mt-1">Data akan otomatis muncul saat guru men-generate RPP, Asesmen, atau Slide.</p>
          </div>
        `;
      } else {
        const top3 = activeSchools.slice(0, 3);
        const medals = [
          { rank: 1, label: 'Juara 1', icon: '🥇', bg: 'from-amber-500/10 via-amber-500/5 to-transparent', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
          { rank: 2, label: 'Juara 2', icon: '🥈', bg: 'from-slate-400/10 via-slate-400/5 to-transparent', border: 'border-slate-300', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
          { rank: 3, label: 'Juara 3', icon: '🥉', bg: 'from-amber-700/10 via-amber-700/5 to-transparent', border: 'border-amber-600/30', badge: 'bg-amber-50 text-amber-900 border-amber-200' },
        ];

        podiumContainer.innerHTML = top3.map((sch, i) => {
          const m = medals[i];
          const teacherInfo = sch.top_teacher ? `<span class="text-slate-500 font-normal">Guru teraktif:</span> <strong class="text-slate-800">${escapeHtml(sch.top_teacher.nama)}</strong> (${sch.top_teacher.count}x)` : 'Belum ada guru aktif';
          return `
            <div class="p-5 rounded-2xl border ${m.border} bg-gradient-to-b ${m.bg} relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">${m.icon}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${m.badge}">${m.label}</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base tracking-tight truncate" title="${escapeHtml(sch.nama)}">${escapeHtml(sch.nama)}</h4>
              <div class="flex items-baseline gap-2 mt-2 mb-3">
                <span class="text-3xl font-extrabold text-indigo-600 font-display">${sch.total_all}</span>
                <span class="text-xs text-slate-500 font-medium">total dokumen</span>
              </div>
              <div class="grid grid-cols-3 gap-1 py-2 px-3 rounded-xl bg-white/80 border border-slate-200/60 text-center text-[11px] mb-3">
                <div><span class="text-slate-400 block text-[9px] uppercase">RPP</span><strong class="text-slate-800">${sch.total_rpp}</strong></div>
                <div><span class="text-slate-400 block text-[9px] uppercase">Soal</span><strong class="text-slate-800">${sch.total_asesmen}</strong></div>
                <div><span class="text-slate-400 block text-[9px] uppercase">Slide</span><strong class="text-slate-800">${sch.total_slide}</strong></div>
              </div>
              <p class="text-[11px] text-slate-600 truncate">${teacherInfo}</p>
            </div>
          `;
        }).join('');
      }
    }

    // Render Full Table
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-400">Tidak ada data sekolah terdaftar.</td></tr>`;
      return;
    }

    const maxTotal = Math.max(1, ...list.map(s => s.total_all));

    tbody.innerHTML = list.map((s, idx) => {
      let rankBadge = `<span class="w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-600">${idx + 1}</span>`;
      if (idx === 0 && s.total_all > 0) rankBadge = `<span class="w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs bg-amber-100 text-amber-700 border border-amber-300">🥇</span>`;
      else if (idx === 1 && s.total_all > 0) rankBadge = `<span class="w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs bg-slate-200 text-slate-700 border border-slate-300">🥈</span>`;
      else if (idx === 2 && s.total_all > 0) rankBadge = `<span class="w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs bg-amber-50 text-amber-900 border border-amber-600/40">🥉</span>`;

      const pct = Math.round((s.total_all / maxTotal) * 100);
      let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Sangat Aktif</span>';
      if (s.total_all === 0) {
        statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">🔴 Belum Aktif</span>';
      } else if (s.total_all < 5) {
        statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">🟡 Cukup Aktif</span>';
      } else if (s.total_all < 15) {
        statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">🔵 Aktif</span>';
      }

      const teacherText = s.top_teacher 
        ? `<div class="font-medium text-slate-800">${escapeHtml(s.top_teacher.nama)}</div><div class="text-[10px] text-slate-400">${s.top_teacher.count} dokumen</div>`
        : `<span class="text-slate-400 italic">-</span>`;

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-4 py-3 text-center">${rankBadge}</td>
          <td class="px-4 py-3">
            <div class="font-semibold text-slate-900">${escapeHtml(s.nama)}</div>
            <div class="text-[10px] text-slate-400">NPSN: ${escapeHtml(s.npsn || '-')} ${s.is_sekolah_penggerak ? '• <span class="text-indigo-600 font-medium">Sekolah Penggerak</span>' : ''}</div>
          </td>
          <td class="px-3 py-3 text-center font-semibold text-emerald-700">${s.total_rpp}</td>
          <td class="px-3 py-3 text-center font-semibold text-sky-700">${s.total_asesmen}</td>
          <td class="px-3 py-3 text-center font-semibold text-amber-700">${s.total_slide}</td>
          <td class="px-4 py-3 text-center">
            <div class="font-bold text-slate-900 text-sm">${s.total_all}</div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${pct}%"></div>
            </div>
          </td>
          <td class="px-4 py-3">${teacherText}</td>
          <td class="px-4 py-3 text-center">${statusBadge}</td>
        </tr>
      `;
    }).join('');

    _lastSchoolAnalyticsData = data;

  } catch (e) {
    console.error('Failed to load school AI analytics:', e);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-rose-500">Gagal memuat analitik sekolah.</td></tr>`;
  }
};

let _lastSchoolAnalyticsData = null;

window.refreshSchoolAiAnalytics = function() {
  const monthSelect = document.getElementById('school-analytics-month');
  const month = monthSelect ? monthSelect.value : '';
  window.loadSchoolAiAnalytics(month);
};

window.exportLeaderboardCsv = function() {
  if (!_lastSchoolAnalyticsData || !_lastSchoolAnalyticsData.leaderboard) {
    showToast('Data analitik belum siap. Silakan segarkan halaman.', 'error');
    return;
  }

  const data = _lastSchoolAnalyticsData;
  const list = data.leaderboard || [];
  const monthLabel = data.selected_month === 'all' ? 'Semua Periode' : data.selected_month;

  let csv = '\uFEFF'; // UTF-8 BOM for Excel
  csv += `"LAPORAN REKAPITULASI PEMANFAATAN AI SEKOLAH - KKG WANAYASA"\n`;
  csv += `"Periode: ${monthLabel}"\n`;
  csv += `"Dicetak Pada: ${new Date().toLocaleString('id-ID')}"\n\n`;

  csv += `"Peringkat","Nama Sekolah","NPSN","Status Penggerak","Total RPP","Total Asesmen & TTS","Total Slide","Total Dokumen AI","Guru Paling Aktif","Jumlah Dokumen Guru","Tingkat Keaktifan"\n`;

  list.forEach((s, i) => {
    let statusText = 'Sangat Aktif';
    if (s.total_all === 0) statusText = 'Belum Aktif';
    else if (s.total_all < 5) statusText = 'Cukup Aktif';
    else if (s.total_all < 15) statusText = 'Aktif';

    const teacherName = s.top_teacher?.nama ? `"${s.top_teacher.nama.replace(/"/g, '""')}"` : `"-"`;
    const teacherCount = s.top_teacher?.count || 0;

    csv += `"${i + 1}","${s.nama.replace(/"/g, '""')}","${s.npsn || '-'}","${s.is_sekolah_penggerak ? 'Ya' : 'Bukan'}","${s.total_rpp}","${s.total_asesmen}","${s.total_slide}","${s.total_all}",${teacherName},"${teacherCount}","${statusText}"\n`;
  });

  const summary = data.summary || {};
  csv += `\n"TOTAL KESELURUHAN GUGUS","","","","${summary.total_rpp || 0}","${summary.total_asesmen || 0}","${summary.total_slide || 0}","${summary.total_generations || 0}","","",""\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekapitulasi_AI_Sekolah_${String(monthLabel).replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📊 Laporan Excel/CSV berhasil diunduh!', 'success');
};

window.printLeaderboardReport = function() {
  if (!_lastSchoolAnalyticsData || !_lastSchoolAnalyticsData.leaderboard) {
    showToast('Data analitik belum siap untuk dicetak.', 'error');
    return;
  }

  const data = _lastSchoolAnalyticsData;
  const list = data.leaderboard || [];
  const monthSelect = document.getElementById('school-analytics-month');
  const monthText = monthSelect ? monthSelect.options[monthSelect.selectedIndex]?.text : (data.selected_month || 'Periode Berjalan');
  const summary = data.summary || {};

  const existing = document.getElementById('print-leaderboard-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'print-leaderboard-modal';
  modal.className = 'fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in';

  modal.innerHTML = `
    <div class="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:border-none">
      
      <!-- Modal Action Bar (Hidden on print) -->
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 print:hidden">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <i class="fas fa-file-invoice"></i>
          </div>
          <div>
            <h3 class="font-bold text-base text-slate-900 font-display">Pratinjau Cetak Laporan Resmi</h3>
            <p class="text-xs text-slate-500">Format resmi untuk Pengawas Pembina & Disdik</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button id="btn-do-print-report" class="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow flex items-center gap-2 cursor-pointer">
            <i class="fas fa-print"></i> Cetak / Simpan PDF
          </button>
          <button id="btn-close-print-report" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm cursor-pointer">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Official Printable Document Body -->
      <div class="p-4 sm:p-8 bg-white border border-slate-200 print:border-none print:p-0 rounded-2xl font-serif text-slate-900" id="official-report-canvas">
        
        <!-- Header / Kop -->
        <div class="text-center pb-4 mb-6 border-b-2 border-double border-slate-900">
          <h2 class="text-base sm:text-lg font-bold uppercase tracking-wider mb-0.5">KELOMPOK KERJA GURU (KKG) KECAMATAN WANAYASA</h2>
          <h3 class="text-sm sm:text-base font-bold uppercase text-slate-800 mb-1">PUSAT PENGEMBANGAN PROFESI GURU &amp; TRANSFORMASI DIGITAL</h3>
          <p class="text-xs text-slate-600 italic">Kecamatan Wanayasa, Kabupaten Purwakarta, Jawa Barat</p>
        </div>

        <!-- Title -->
        <div class="text-center mb-6">
          <h4 class="text-sm sm:text-base font-bold uppercase underline mb-1">LAPORAN REKAPITULASI PEMANFAATAN TEKNOLOGI AI PEMBELAJARAN</h4>
          <p class="text-xs font-sans text-slate-600">Periode Evaluasi: <strong>${escapeHtml(monthText)}</strong></p>
        </div>

        <!-- Ringkasan Gugus -->
        <div class="grid grid-cols-4 gap-2 mb-6 text-center font-sans text-xs border border-slate-300 rounded-xl p-3 bg-slate-50/50">
          <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Total RPP</span><strong class="text-sm font-extrabold text-slate-900">${summary.total_rpp || 0}</strong></div>
          <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Total Asesmen/TTS</span><strong class="text-sm font-extrabold text-slate-900">${summary.total_asesmen || 0}</strong></div>
          <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Total Slide</span><strong class="text-sm font-extrabold text-slate-900">${summary.total_slide || 0}</strong></div>
          <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Akumulasi Dokumen</span><strong class="text-sm font-extrabold text-indigo-700">${summary.total_generations || 0}</strong></div>
        </div>

        <!-- Table -->
        <table class="w-full text-left text-xs border-collapse border border-slate-900 font-sans mb-8">
          <thead>
            <tr class="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-center">
              <th class="border border-slate-900 p-2 w-10">No</th>
              <th class="border border-slate-900 p-2 text-left">Nama Satuan Pendidikan</th>
              <th class="border border-slate-900 p-2 w-16">RPP</th>
              <th class="border border-slate-900 p-2 w-16">Soal</th>
              <th class="border border-slate-900 p-2 w-16">Slide</th>
              <th class="border border-slate-900 p-2 w-16 font-extrabold">Total</th>
              <th class="border border-slate-900 p-2 text-left">Pendidik Paling Aktif</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((s, i) => `
              <tr class="border-b border-slate-400">
                <td class="border border-slate-900 p-2 text-center">${i + 1}</td>
                <td class="border border-slate-900 p-2 font-semibold">${escapeHtml(s.nama)}</td>
                <td class="border border-slate-900 p-2 text-center">${s.total_rpp}</td>
                <td class="border border-slate-900 p-2 text-center">${s.total_asesmen}</td>
                <td class="border border-slate-900 p-2 text-center">${s.total_slide}</td>
                <td class="border border-slate-900 p-2 text-center font-bold text-slate-900">${s.total_all}</td>
                <td class="border border-slate-900 p-2 text-xs">${s.top_teacher?.nama ? `${escapeHtml(s.top_teacher.nama)} (${s.top_teacher.count}x)` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Signature Section -->
        <div class="grid grid-cols-2 gap-8 text-center text-xs font-sans pt-6 border-t border-slate-200">
          <div>
            <p class="mb-1 text-slate-500">Mengetahui,</p>
            <p class="font-bold text-slate-900 mb-16">Pengawas Pembina SD Wanayasa</p>
            <p class="font-bold underline text-slate-900">.....................................................</p>
            <p class="text-slate-500">NIP. .............................................</p>
          </div>
          <div>
            <p class="mb-1 text-slate-500">Wanayasa, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p class="font-bold text-slate-900 mb-16">Ketua KKG Kecamatan Wanayasa</p>
            <p class="font-bold underline text-slate-900">.....................................................</p>
            <p class="text-slate-500">NIP. .............................................</p>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btn-close-print-report')?.addEventListener('click', () => modal.remove());
  document.getElementById('btn-do-print-report')?.addEventListener('click', () => {
    window.print();
  });
};

