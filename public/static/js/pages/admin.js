
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast, formatDate, formatDateTime, skeletonTable, debounce } from '../utils.js';

// Initialize admin data
let dashboardRefreshInterval = null;
let dashboardPeriodDays = 30;
let dashboardTrendPeriod = 'weekly';
let dashboardActivityDays = 7;
let adminTableDensity = localStorage.getItem('admin_table_density') || 'comfortable';
let slaPendingThreshold = Number(localStorage.getItem('sla_pending_threshold') || 10);
let adminPanelMode = (state.user?.role === 'operator')
  ? 'operator'
  : (localStorage.getItem('admin_panel_mode') === 'operator' ? 'operator' : 'admin');
const pendingApprovalState = {
  items: [],
  selectedIds: new Set(),
};
const usersSelectionState = {
  selectedIds: new Set(),
};
const sekolahSelectionState = {
  selectedIds: new Set(),
};
let undoActionState = null;
let approvalShortcutBound = false;
let activeAdminModalId = null;
let previousFocusedElement = null;

function isOperatorMode() {
  return state.user?.role === 'operator' || adminPanelMode === 'operator';
}

function getDateNDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getTableSpacing() {
  return adminTableDensity === 'compact'
    ? { td: 'px-4 py-2.5 text-xs', row: 'text-xs' }
    : { td: 'px-6 py-4 text-sm', row: 'text-sm' };
}

function setControlButtonState(activeId, ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === activeId) {
      el.classList.add('bg-primary-600', 'text-slate-900', 'border-primary-600');
      el.classList.remove('bg-slate-50 backdrop-blur-xl', 'text-slate-600', 'border-slate-200/70');
    } else {
      el.classList.remove('bg-primary-600', 'text-slate-900', 'border-primary-600');
      el.classList.add('bg-slate-50 backdrop-blur-xl', 'text-slate-600', 'border-slate-200/70');
    }
  });
}

function syncDashboardControlState() {
  setControlButtonState(`dash-period-${dashboardPeriodDays}`, ['dash-period-7', 'dash-period-30', 'dash-period-90']);

  const trendSelect = document.getElementById('dashboard-trend-select');
  if (trendSelect) trendSelect.value = dashboardTrendPeriod;

  const activitySelect = document.getElementById('dashboard-activity-select');
  if (activitySelect) activitySelect.value = String(dashboardActivityDays);

  const slaInput = document.getElementById('sla-threshold-input');
  if (slaInput) slaInput.value = String(slaPendingThreshold);
}

function moduleToast(moduleName, message, type = 'info') {
  showToast(`[${moduleName}] ${message}`, type);
}

function openAdminModal(modalId, focusSelector = 'input, select, textarea, button') {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  previousFocusedElement = document.activeElement;
  activeAdminModalId = modalId;
  modal.classList.remove('hidden');
  const target = modal.querySelector(focusSelector);
  if (target) setTimeout(() => target.focus(), 0);
}

function closeAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  if (activeAdminModalId === modalId) activeAdminModalId = null;
  if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
    setTimeout(() => previousFocusedElement.focus(), 0);
  }
}

function initModalAccessibility() {
  if (window.__adminModalA11yBound) return;
  window.__adminModalA11yBound = true;

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeAdminModalId) {
      event.preventDefault();
      closeAdminModal(activeAdminModalId);
    }
  });
}

window.closeAdminModal = closeAdminModal;

function showUndoActionBar(label, onConfirm, onUndo, timeoutMs = 5000) {
  if (undoActionState?.timer) {
    clearTimeout(undoActionState.timer);
    undoActionState = null;
  }

  const existing = document.getElementById('admin-undo-bar');
  if (existing) existing.remove();

  const bar = document.createElement('div');
  bar.id = 'admin-undo-bar';
  bar.className = 'fixed bottom-5 right-5 z-[9999] bg-slate-900 text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3';
  bar.innerHTML = `
    <i class="fas fa-rotate-left"></i>
    <span class="text-sm">${escapeHtml(label)}</span>
    <button id="admin-undo-btn" class="text-xs px-3 py-1.5 rounded-lg bg-white/15 hover:bg-slate-800/60/25">Batalkan</button>
    <span id="admin-undo-countdown" class="text-xs opacity-80">5</span>
  `;
  document.body.appendChild(bar);

  const countdownEl = bar.querySelector('#admin-undo-countdown');
  let secondsLeft = Math.ceil(timeoutMs / 1000);
  const interval = setInterval(() => {
    secondsLeft -= 1;
    if (countdownEl) countdownEl.textContent = String(Math.max(secondsLeft, 0));
  }, 1000);

  const cleanup = () => {
    clearInterval(interval);
    if (bar.parentElement) bar.remove();
    undoActionState = null;
  };

  const timer = setTimeout(async () => {
    cleanup();
    await onConfirm();
  }, timeoutMs);

  undoActionState = { timer, cleanup };

  const undoBtn = bar.querySelector('#admin-undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      clearTimeout(timer);
      cleanup();
      if (onUndo) onUndo();
    });
  }
}

function setBusyButton(button, isBusy, busyLabel = 'Memproses...') {
  if (!button) return () => { };
  const previousHtml = button.innerHTML;
  const previousDisabled = button.disabled;
  if (isBusy) {
    button.disabled = true;
    button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${busyLabel}`;
  } else {
    button.disabled = previousDisabled;
    button.innerHTML = previousHtml;
  }
  return () => {
    button.disabled = previousDisabled;
    button.innerHTML = previousHtml;
  };
}

function initApprovalShortcuts() {
  if (approvalShortcutBound) return;
  approvalShortcutBound = true;

  window.addEventListener('keydown', (event) => {
    const key = (event.key || '').toLowerCase();
    const activeEl = document.activeElement;
    const isTyping = !!activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.isContentEditable
    );

    if (isTyping || state.currentAdminTab !== 'users' || pendingApprovalState.selectedIds.size === 0) {
      return;
    }

    if (key === 'a') {
      event.preventDefault();
      bulkApprovePendingUsers();
    }

    if (key === 'r') {
      event.preventDefault();
      bulkRejectPendingUsers();
    }
  });
}

window.validateUserForm = function (mode = 'add') {
  const modalId = mode === 'edit' ? 'edit-user-modal' : 'add-user-modal';
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const emailInput = modal.querySelector('input[name="email"]');
  const emailHint = document.getElementById(`${mode}-user-email-hint`);
  const emailOk = !emailInput || !emailInput.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
  if (emailHint) {
    emailHint.className = `text-xs mt-1 ${emailOk ? 'text-slate-500' : 'text-rose-600'}`;
    emailHint.textContent = emailOk ? 'Format email valid.' : 'Format email belum valid.';
  }

  if (mode === 'add') {
    const passwordInput = modal.querySelector('input[name="password"]');
    const passwordHint = document.getElementById('add-user-password-hint');
    const passOk = !passwordInput || !passwordInput.value || passwordInput.value.length >= 6;
    if (passwordHint) {
      passwordHint.className = `text-xs mt-1 ${passOk ? 'text-slate-500' : 'text-rose-600'}`;
      passwordHint.textContent = passOk ? 'Minimal 6 karakter.' : 'Password terlalu pendek.';
    }
  }
}

window.openRejectUserModal = function (userId, userName = '') {
  document.getElementById('reject-user-id').value = userId;
  document.getElementById('reject-user-reason').value = '';
  document.getElementById('reject-user-modal-subtitle').textContent = `Pengguna: ${userName || '-'}`;
  openAdminModal('reject-user-modal', '#reject-user-reason');
}

window.closeRejectUserModal = function () {
  closeAdminModal('reject-user-modal');
}

window.submitRejectUser = async function (e) {
  e.preventDefault();
  const userId = document.getElementById('reject-user-id').value;
  const reason = document.getElementById('reject-user-reason').value || '';
  closeRejectUserModal();

  showUndoActionBar(
    'Penolakan user dijadwalkan (5 detik).',
    async () => {
      try {
        await api(`/admin/users/${userId}/reject`, { method: 'POST', body: { reason } });
        moduleToast('Approval', 'Pengguna berhasil ditolak', 'success');
        await Promise.all([loadPendingApprovals(), loadAdminUsers(adminUsersPagination.page || 1), loadAdminDashboard(true)]);
      } catch (e2) {
        moduleToast('Approval', e2.message || 'Gagal menolak pengguna', 'error');
      }
    },
    () => moduleToast('Approval', 'Aksi penolakan dibatalkan', 'info')
  );
}

window.openResetPasswordModal = function (userId) {
  document.getElementById('reset-password-user-id').value = userId;
  document.getElementById('reset-password-input').value = '';
  openAdminModal('reset-password-modal', '#reset-password-input');
  validateResetPassword();
}

window.closeResetPasswordModal = function () {
  closeAdminModal('reset-password-modal');
}

window.validateResetPassword = function () {
  const input = document.getElementById('reset-password-input');
  const hint = document.getElementById('reset-password-hint');
  const submitBtn = document.getElementById('reset-password-submit');
  if (!input || !hint || !submitBtn) return;
  const ok = input.value.length >= 6;
  hint.className = `text-xs mt-1 ${ok || !input.value ? 'text-slate-500' : 'text-rose-600'}`;
  hint.textContent = ok || !input.value ? 'Password baru minimal 6 karakter.' : 'Password terlalu pendek.';
  submitBtn.disabled = !ok;
}

window.submitResetPassword = async function (e) {
  e.preventDefault();
  const userId = document.getElementById('reset-password-user-id').value;
  const newPw = document.getElementById('reset-password-input').value;
  if (!newPw || newPw.length < 6) return;
  try {
    await api(`/admin/users/${userId}/reset-password`, { method: 'POST', body: { new_password: newPw } });
    moduleToast('Users', 'Password berhasil direset', 'success');
    closeResetPasswordModal();
  } catch (e2) {
    moduleToast('Users', e2.message || 'Gagal reset password', 'error');
  }
}

window.setAdminPanelMode = function (mode) {
  if (state.user?.role === 'operator') {
    adminPanelMode = 'operator';
    localStorage.setItem('admin_panel_mode', 'operator');
    return;
  }

  adminPanelMode = mode === 'operator' ? 'operator' : 'admin';
  localStorage.setItem('admin_panel_mode', adminPanelMode);
  navigate('admin');
}

function applyAdminModeUI() {
  const adminOnlyEls = document.querySelectorAll('[data-admin-only="true"]');
  const operatorOnlyEls = document.querySelectorAll('[data-operator-only="true"]');

  adminOnlyEls.forEach((el) => {
    el.classList.toggle('hidden', isOperatorMode());
  });

  operatorOnlyEls.forEach((el) => {
    el.classList.toggle('hidden', !isOperatorMode());
  });

  const modeLabel = document.getElementById('dashboard-mode-label');
  if (modeLabel) {
    modeLabel.textContent = isOperatorMode() ? 'Mode Operator' : 'Mode Admin Utama';
  }
}

window.setAdminDensity = function (mode) {
  adminTableDensity = mode === 'compact' ? 'compact' : 'comfortable';
  localStorage.setItem('admin_table_density', adminTableDensity);

  const compactBtn = document.getElementById('density-compact-btn');
  const comfortBtn = document.getElementById('density-comfort-btn');

  if (compactBtn && comfortBtn) {
    if (adminTableDensity === 'compact') {
      compactBtn.classList.add('bg-primary-600', 'text-slate-900');
      compactBtn.classList.remove('bg-slate-50 backdrop-blur-xl', 'text-slate-600');
      comfortBtn.classList.remove('bg-primary-600', 'text-slate-900');
      comfortBtn.classList.add('bg-slate-50 backdrop-blur-xl', 'text-slate-600');
    } else {
      comfortBtn.classList.add('bg-primary-600', 'text-slate-900');
      comfortBtn.classList.remove('bg-slate-50 backdrop-blur-xl', 'text-slate-600');
      compactBtn.classList.remove('bg-primary-600', 'text-slate-900');
      compactBtn.classList.add('bg-slate-50 backdrop-blur-xl', 'text-slate-600');
    }
  }

  if (state.currentAdminTab === 'users') loadAdminUsers(adminUsersPagination.page || 1);
  if (state.currentAdminTab === 'sekolah') loadSekolah();
  if (state.currentAdminTab === 'logs') loadAuditLogs();
}

window.setDashboardPeriod = function (days) {
  dashboardPeriodDays = Number(days) || 30;
  dashboardTrendPeriod = dashboardPeriodDays <= 14 ? 'weekly' : 'monthly';
  syncDashboardControlState();
  loadAdminDashboard();
}

window.setDashboardActivityWindow = function (days) {
  dashboardActivityDays = Number(days) || 7;
  syncDashboardControlState();
  loadDashboardActivity();
}

window.setDashboardTrendPeriod = function (period) {
  dashboardTrendPeriod = period === 'monthly' ? 'monthly' : 'weekly';
  syncDashboardControlState();
  initDashboardCharts();
}

window.setSlaPendingThreshold = function () {
  const input = document.getElementById('sla-threshold-input');
  if (!input) return;
  const parsed = Number(input.value);
  slaPendingThreshold = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  localStorage.setItem('sla_pending_threshold', String(slaPendingThreshold));
  syncDashboardControlState();
  loadAdminDashboard(true);
  moduleToast('SLA', `Ambang pending disetel ke ${slaPendingThreshold}`, 'success');
}

window.initAdminData = async function () {
  initApprovalShortcuts();
  initModalAccessibility();

  // Sequential loading to avoid rate limiting (429 errors)
  // Load dashboard first
  try {
    await loadAdminDashboard();
  } catch (e) {
    console.error('Dashboard load error:', e);
  }

  // Small delay before loading settings
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!isOperatorMode()) {
    try {
      await loadAdminSettings();
    } catch (e) {
      console.error('Settings load error:', e);
    }
  }

  // Force hide all panels except dashboard to prevent content leakage
  const allPanels = ['panel-profil', 'panel-sekolah', 'panel-templates', 'panel-users', 'panel-logs'];
  allPanels.forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('hidden');
      panel.style.display = 'none';
    }
  });
  // Show only dashboard initially
  const dashboardPanel = document.getElementById('panel-dashboard');
  if (dashboardPanel) {
    dashboardPanel.classList.remove('hidden');
    dashboardPanel.style.display = 'block';
  }

  window.setAdminDensity(adminTableDensity);
  syncDashboardControlState();
  applyAdminModeUI();

  // Start auto-refresh if on dashboard tab
  startDashboardAutoRefresh();
}

// Auto-refresh dashboard every 30 seconds
function startDashboardAutoRefresh() {
  // Clear any existing interval
  if (dashboardRefreshInterval) {
    clearInterval(dashboardRefreshInterval);
  }

  // Only auto-refresh if dashboard panel is visible
  const dashboardPanel = document.getElementById('panel-dashboard');
  if (dashboardPanel && !dashboardPanel.classList.contains('hidden')) {
    dashboardRefreshInterval = setInterval(() => {
      // Silently refresh data without showing loading states
      refreshDashboardData();
    }, 30000); // 30 seconds
  }
}

// Stop auto-refresh
function stopDashboardAutoRefresh() {
  if (dashboardRefreshInterval) {
    clearInterval(dashboardRefreshInterval);
    dashboardRefreshInterval = null;
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

// Load Settings Data
async function loadAdminSettings() {
  try {
    const res = await api('/admin/settings');
    const s = res.data;

    setVal('profil-nama_kkg', s.nama_kkg);
    setVal('profil-tahun_ajaran', s.tahun_ajaran);
    setVal('profil-npsn_sekolah_induk', s.npsn_sekolah_induk);
    setVal('profil-nama_sekolah_induk', s.nama_sekolah_induk);
    setVal('profil-alamat_sekretariat', s.alamat_sekretariat);
    setVal('profil-kecamatan', s.kecamatan);
    setVal('profil-kabupaten', s.kabupaten);
    setVal('profil-provinsi', s.provinsi);
    setVal('profil-kode_pos', s.kode_pos);
    setVal('profil-email_kkg', s.email_kkg);
    setVal('profil-telepon_kkg', s.telepon_kkg);
    setVal('profil-website_kkg', s.website_kkg);
    setVal('profil-nama_ketua', s.nama_ketua);
    setVal('profil-nama_sekretaris', s.nama_sekretaris);
    setVal('profil-nama_bendahara', s.nama_bendahara);
    setVal('profil-struktur_organisasi', s.struktur_organisasi);
    setVal('profil-visi_misi', s.visi_misi);

    setVal('settings-mistral_api_key', s.mistral_api_key || '');
    setVal('settings-z_ai_api_key', s.z_ai_api_key || '');
    setVal('settings-gemini_api_key', s.gemini_api_key || '');
    setVal('settings-groq_api_key', s.groq_api_key || '');
    setVal('settings-vertex_api_key', s.vertex_api_key || '');
    setVal('settings-vertex_project_id', s.vertex_project_id || '');
    setVal('settings-supabase_url', s.supabase_url || '');
    setVal('settings-supabase_key', s.supabase_key || '');
    setVal('settings-supabase_bucket', s.supabase_bucket || '');

    const logoContainer = document.getElementById('logo-preview');
    if (logoContainer && s.logo_url) {
      logoContainer.innerHTML = `<img src="${s.logo_url}" alt="Logo KKG" class="w-full h-full object-contain">`;
    }

  } catch (e) { console.error('Failed to load settings:', e); }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function updateStatCard(id, val) {
  setMetricValue(id, val);
}

// Load Users Data
// State for Users Management with Pagination
let adminUsersPagination = {
  users: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  search: '',
  role: ''
};

// Load Users Data with Server-side Pagination
window.loadAdminUsers = async function (page = 1) {
  const container = document.querySelector('#panel-users-tbody');
  if (!container) return;

  // Show loading state
  container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-600"><i class="fas fa-spinner fa-spin mr-2"></i>Mengambil data pengguna...</td></tr>`;

  try {
    const searchInput = document.getElementById('user-search-input');
    const roleSelect = document.getElementById('user-role-filter');

    const search = searchInput ? searchInput.value : '';
    const role = roleSelect ? roleSelect.value : '';

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: adminUsersPagination.limit.toString()
    });

    if (search) queryParams.append('search', search);
    if (role) queryParams.append('role', role);

    const res = await api(`/admin/users?${queryParams.toString()}`);
    adminUsersPagination = {
      ...res.data.pagination,
      users: res.data.users,
      search,
      role
    };
    usersSelectionState.selectedIds.clear();
    const checkAllUsers = document.getElementById('users-check-all');
    if (checkAllUsers) checkAllUsers.checked = false;

    renderAdminUsersTable();
    renderUsersPagination();
  } catch (e) {
    usersSelectionState.selectedIds.clear();
    container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
      <i class="fas fa-exclamation-circle mr-2"></i>Gagal memuat user: ${escapeHtml(e.message)}
      <button onclick="loadAdminUsers(${page})" class="ml-2 underline hover:text-red-700">Coba lagi</button>
    </td></tr>`;
    updateUsersSelectionUI();
  }
}

// Filter Users (triggers reload with new filters)
window.filterAdminUsers = debounce(function () {
  loadAdminUsers(1); // Reset to page 1 when filtering
}, 500);

// Render Users Pagination Controls
function renderUsersPagination() {
  const container = document.getElementById('users-pagination');
  if (!container) return;

  const { page, totalPages, total } = adminUsersPagination;

  if (totalPages <= 1) {
    container.innerHTML = `<div class="text-sm text-slate-500">Total: ${total} user</div>`;
    return;
  }

  let pages = [];

  // Always show first page
  pages.push(1);

  // Show pages around current
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    if (i > pages[pages.length - 1] + 1) {
      pages.push('...');
    }
    pages.push(i);
  }

  // Always show last page
  if (totalPages > 1) {
    if (pages[pages.length - 1] < totalPages - 1) {
      pages.push('...');
    }
    if (pages[pages.length - 1] !== totalPages) {
      pages.push(totalPages);
    }
  }

  container.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="text-sm text-slate-500">
        Halaman ${page} dari ${totalPages} (Total: ${total} user)
      </div>
      <div class="flex gap-1">
        <button 
          onclick="loadAdminUsers(${page - 1})" 
          ${page <= 1 ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border border-slate-200/70 text-sm ${page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 backdrop-blur-xl'}"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        ${pages.map(p => {
    if (p === '...') {
      return `<span class="px-3 py-1 text-sm text-slate-500">...</span>`;
    }
    return `<button 
            onclick="loadAdminUsers(${p})"
            class="px-3 py-1 rounded-lg text-sm ${p === page ? 'bg-primary-500 text-slate-900' : 'border border-slate-200/70 hover:bg-slate-50 backdrop-blur-xl'}"
          >${p}</button>`;
  }).join('')}
        <button 
          onclick="loadAdminUsers(${page + 1})" 
          ${page >= totalPages ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border border-slate-200/70 text-sm ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 backdrop-blur-xl'}"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `;
}

// Render Users Table
function renderAdminUsersTable() {
  const container = document.querySelector('#panel-users-tbody');
  if (!container) return;
  const spacing = getTableSpacing();
  const canManageUsers = !isOperatorMode();

  const users = adminUsersPagination.users;

  if (users.length === 0) {
    usersSelectionState.selectedIds.clear();
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center">
          <div class="flex flex-col items-center justify-center text-slate-500">
            ${adminUsersPagination.total === 0
        ? `<i class="fas fa-users-slash text-4xl mb-3 opacity-50"></i><p>Belum ada data pengguna.</p>`
        : `<i class="fas fa-search text-4xl mb-3 opacity-50"></i><p>Tidak ditemukan user dengan kata kunci "${escapeHtml(adminUsersPagination.search)}"</p>`
      }
          </div>
        </td>
      </tr>`;
    updateUsersSelectionUI();
    return;
  }

  container.innerHTML = users.map(u => `
    <tr tabindex="0" class="border-t border-slate-200/70 odd:bg-slate-900/50 backdrop-blur-xl even:bg-slate-50 backdrop-blur-xl/35 hover:bg-slate-50 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors group ${spacing.row}">
      <td class="px-4 py-3 text-center"><input type="checkbox" onchange="toggleUserRowSelection('${u.id}', this.checked)"></td>
      <td class="${spacing.td}">
         <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-gray-800">
                ${u.nama.charAt(0).toUpperCase()}
            </div>
            <div>
                <p class="font-medium text-slate-900">${escapeHtml(u.nama)}</p>
                <p class="text-xs text-slate-500 group-hover:block hidden absolute bg-black text-slate-900 px-2 py-1 rounded -mt-8 shadow-lg z-50">ID: ${u.id}</p>
            </div>
         </div>
      </td>
      <td class="${spacing.td} text-slate-600 font-mono text-xs">${escapeHtml(u.email)}</td>
      <td class="${spacing.td} text-slate-600">
        ${u.sekolah ? `<span class="flex items-center gap-1.5"><i class="fas fa-building text-slate-500 text-xs"></i>${escapeHtml(u.sekolah)}</span>` : '<span class="text-slate-500 italic">-</span>'}
      </td>
      <td class="${spacing.td} text-center">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold border ${u.role === 'admin'
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
      : u.role === 'operator'
        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700'}">
            ${u.role === 'admin' ? '<i class="fas fa-crown text-[10px] mr-1"></i>' : ''}${u.role.toUpperCase()}
          </span>
      </td>
      <td class="${spacing.td} text-center">
        ${canManageUsers ? `
        <div class="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onclick='editUser(${JSON.stringify(u).replace(/'/g, "&#39;")})' class="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Edit User">
            <i class="fas fa-pen"></i>
          </button>
          <button onclick="resetUserPassword(${u.id})" class="p-2 rounded-lg text-amber-600 hover:bg-slate-100mber-50 dark:hover:bg-slate-100mber-900/30 transition-colors" title="Reset Password Default">
            <i class="fas fa-key"></i>
          </button>
          ${u.role !== 'admin' || u.id !== state.user?.id ? `
          <button onclick="deleteUser(${u.id})" class="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Hapus User">
            <i class="fas fa-trash-alt"></i>
          </button>` : ''}
        </div>
        ` : '<span class="text-xs text-slate-500">Operator mode</span>'}
      </td>
    </tr>
  `).join('');

  updateUsersSelectionUI();
}

function updateUsersSelectionUI() {
  const toolbar = document.getElementById('users-selection-toolbar');
  const countLabel = document.getElementById('users-selected-count');
  const selectedCount = usersSelectionState.selectedIds.size;
  if (toolbar) toolbar.classList.toggle('hidden', selectedCount === 0);
  if (countLabel) countLabel.textContent = `${selectedCount} pengguna terpilih`;
}

window.toggleUserRowSelection = function (id, checked) {
  if (checked) usersSelectionState.selectedIds.add(String(id));
  else usersSelectionState.selectedIds.delete(String(id));
  updateUsersSelectionUI();
}

window.toggleAllUserRows = function (checked) {
  const checkboxes = document.querySelectorAll('#panel-users-tbody input[type="checkbox"]');
  usersSelectionState.selectedIds.clear();
  checkboxes.forEach((cb, index) => {
    cb.checked = checked;
    const user = adminUsersPagination.users[index];
    if (checked && user) usersSelectionState.selectedIds.add(String(user.id));
  });
  updateUsersSelectionUI();
}

window.loadPendingApprovals = async function () {
  const tbody = document.getElementById('pending-users-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat antrean persetujuan...</td></tr>';

  try {
    const res = await api('/admin/users/pending');
    pendingApprovalState.items = res.data || [];
    pendingApprovalState.selectedIds.clear();
    const checkAllPending = document.getElementById('pending-check-all');
    if (checkAllPending) checkAllPending.checked = false;
    renderPendingApprovalsTable();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center">
      <div class="inline-flex flex-col items-center gap-2 text-rose-600">
        <i class="fas fa-triangle-exclamation text-lg"></i>
        <p class="text-sm">${escapeHtml(e.message || 'Gagal memuat approval queue')}</p>
        <button onclick="loadPendingApprovals()" class="text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100">Coba Lagi</button>
      </div>
    </td></tr>`;
    updatePendingSelectionUI();
  }
}

function renderPendingApprovalsTable() {
  const tbody = document.getElementById('pending-users-tbody');
  const selectAll = document.getElementById('pending-check-all');
  if (!tbody) return;

  const items = pendingApprovalState.items;
  if (selectAll) selectAll.checked = false;

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">Tidak ada pengguna menunggu persetujuan.</td></tr>';
    updatePendingSelectionUI();
    return;
  }

  tbody.innerHTML = items.map((u) => `
    <tr tabindex="0" class="border-b border-slate-200/70 odd:bg-slate-900/50 backdrop-blur-xl even:bg-slate-50 backdrop-blur-xl/35 hover:bg-slate-50 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-primary-400">
      <td class="px-4 py-3 text-center">
        <input type="checkbox" onchange="togglePendingUserSelection('${u.id}', this.checked)">
      </td>
      <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(u.nama || '-')}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(u.email || '-')}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(u.sekolah || '-')}</td>
      <td class="px-4 py-3">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="approvePendingUser('${u.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Setujui</button>
          <button onclick="rejectPendingUser('${u.id}', '${escapeHtml(u.nama || '')}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">Tolak</button>
        </div>
      </td>
    </tr>
  `).join('');

  updatePendingSelectionUI();
}

function updatePendingSelectionUI() {
  const toolbar = document.getElementById('pending-selection-toolbar');
  const countLabel = document.getElementById('pending-selected-count');
  const selectedCount = pendingApprovalState.selectedIds.size;
  if (toolbar) toolbar.classList.toggle('hidden', selectedCount === 0);
  if (countLabel) countLabel.textContent = `${selectedCount} user terpilih`;
}

window.togglePendingUserSelection = function (id, checked) {
  if (checked) pendingApprovalState.selectedIds.add(String(id));
  else pendingApprovalState.selectedIds.delete(String(id));
  updatePendingSelectionUI();
}

window.toggleAllPendingUsers = function (checked) {
  const checkboxes = document.querySelectorAll('#pending-users-tbody input[type="checkbox"]');
  pendingApprovalState.selectedIds.clear();

  checkboxes.forEach((cb, index) => {
    cb.checked = checked;
    const user = pendingApprovalState.items[index];
    if (checked && user) pendingApprovalState.selectedIds.add(String(user.id));
  });

  updatePendingSelectionUI();
}

window.bulkApprovePendingUsers = async function () {
  const ids = Array.from(pendingApprovalState.selectedIds)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!ids.length) {
    moduleToast('Approval', 'Pilih minimal satu pengguna untuk disetujui', 'warning');
    return;
  }

  const btn = document.getElementById('bulk-approve-btn');
  const restoreBtn = setBusyButton(btn, true, 'Menyetujui...');

  try {
    await api('/admin/users/bulk-approve', {
      method: 'POST',
      body: { user_ids: ids }
    });

    moduleToast('Approval', `${ids.length} pengguna berhasil diproses`, 'success');
    await Promise.all([loadPendingApprovals(), loadAdminUsers(1), loadAdminDashboard(true)]);
  } catch (e) {
    moduleToast('Approval', e.message || 'Gagal melakukan persetujuan massal', 'error');
  } finally {
    restoreBtn();
  }
}

window.bulkRejectPendingUsers = async function () {
  const ids = Array.from(pendingApprovalState.selectedIds)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!ids.length) {
    moduleToast('Approval', 'Pilih minimal satu pengguna untuk ditolak', 'warning');
    return;
  }

  const reasonInput = document.getElementById('bulk-reject-reason');
  const reason = reasonInput?.value?.trim() || '';

  showUndoActionBar(
    `${ids.length} penolakan user dijadwalkan (5 detik).`,
    async () => {
      const btn = document.getElementById('bulk-reject-btn');
      const restoreBtn = setBusyButton(btn, true, 'Menolak...');
      try {
        await Promise.all(ids.map((id) => api(`/admin/users/${id}/reject`, {
          method: 'POST',
          body: { reason }
        })));

        moduleToast('Approval', `${ids.length} pengguna berhasil ditolak`, 'success');
        if (reasonInput) reasonInput.value = '';
        await Promise.all([loadPendingApprovals(), loadAdminUsers(1), loadAdminDashboard(true)]);
      } catch (e) {
        moduleToast('Approval', e.message || 'Gagal melakukan penolakan massal', 'error');
      } finally {
        restoreBtn();
      }
    },
    () => moduleToast('Approval', 'Aksi penolakan massal dibatalkan', 'info')
  );
}

window.exportPendingApprovalsCsv = function () {
  const rows = pendingApprovalState.items || [];
  if (!rows.length) {
    moduleToast('Approval', 'Tidak ada data pending untuk diekspor', 'warning');
    return;
  }

  const headers = ['id', 'nama', 'email', 'nip', 'sekolah', 'role', 'created_at'];
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => {
      const value = String(row[h] ?? '').replace(/"/g, '""');
      return `"${value}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `approval-queue-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  moduleToast('Approval', 'CSV approval queue berhasil diekspor', 'success');
}

window.approvePendingUser = async function (id) {
  try {
    await api(`/admin/users/${id}/approve`, { method: 'POST' });
    moduleToast('Approval', 'Pengguna berhasil disetujui', 'success');
    await Promise.all([loadPendingApprovals(), loadAdminUsers(adminUsersPagination.page || 1), loadAdminDashboard(true)]);
  } catch (e) {
    moduleToast('Approval', e.message || 'Gagal menyetujui pengguna', 'error');
  }
}

window.rejectPendingUser = async function (id, name = '') {
  openRejectUserModal(id, name);
}


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
      
      <!-- System Configuration (Merged from Settings) -->
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-slate-200/70 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] relative overflow-hidden">
         <div class="absolute top-0 right-0 w-64 h-64 bg-slate-100/50 backdrop-blur-md rounded-bl-full pointer-events-none opacity-50"></div>
         <h2 class="font-display text-2xl font-semibold text-slate-900 mb-8 flex items-center gap-4 tracking-tighter relative z-10">
            <span class="w-10 h-10 rounded-2xl bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-indigo-600 flex items-center justify-center text-sm shadow-sm shadow-slate-200/50"><i class="fas fa-robot"></i></span>
            Konfigurasi AI & Sistem
         </h2>
         <div class="space-y-6">
            <div>
               <label class="label">Mistral AI API Key</label>
               <div class="relative">
                 <input type="password" id="settings-mistral_api_key" class="input-field font-mono pr-10" placeholder="sk-...">
                 <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                   <i class="fas fa-key"></i>
                 </div>
               </div>
                <p class="text-xs text-slate-500 mt-1.5">Kunci API untuk fitur Generator Surat dan RPP Otomatis.</p>
             </div>
             <div>
                <label class="label">Gemini API Key <span class="text-xs font-normal text-emerald-600">(Rekomendasi — Gratis)</span></label>
                <div class="relative">
                  <input type="password" id="settings-gemini_api_key" class="input-field font-mono pr-10" placeholder="AIzaSy...">
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                    <i class="fas fa-gem text-xs opacity-50"></i>
                  </div>
                </div>
                <p class="text-xs text-slate-500 mt-1.5">Kunci API Google Gemini 2.0 Flash (<a href="https://aistudio.google.com/apikey" target="_blank" class="text-blue-600 hover:underline">Dapatkan gratis di sini</a>).</p>
             </div>
             <div>
                <label class="label">Groq API Key</label>
                <div class="relative">
                  <input type="password" id="settings-groq_api_key" class="input-field font-mono pr-10" placeholder="gsk_...">
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                    <i class="fas fa-bolt text-xs opacity-50"></i>
                  </div>
                </div>
                 <p class="text-xs text-slate-500 mt-1.5">Kunci API Groq untuk model LLaMA 3.3 (<a href="https://console.groq.com/keys" target="_blank" class="text-blue-600 hover:underline">Dapatkan di sini</a>).</p>
             </div>
             <div class="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                    <i class="fas fa-star text-white text-xs"></i>
                  </div>
                  <h4 class="text-sm font-bold text-blue-900">Vertex AI (Gemini 3 Flash Preview) — Pay-as-you-go</h4>
                  <span class="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full uppercase tracking-wide">Terbaru</span>
                </div>
                <p class="text-xs text-blue-700 mb-3">Gunakan Gemini 2.5 Flash terbaru via Vertex AI. Lebih cerdas dan powerful dari versi gratis. Butuh akun Google Cloud dengan billing aktif.</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Vertex AI API Key</label>
                    <div class="relative">
                      <input type="password" id="settings-vertex_api_key" class="input-field font-mono pr-10" placeholder="AIzaSy...">
                      <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                        <i class="fas fa-key text-xs opacity-50"></i>
                      </div>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">API Key dari <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-blue-600 hover:underline">Google Cloud Console</a>.</p>
                  </div>
                  <div>
                    <label class="label">Project ID (Opsional)</label>
                    <input type="text" id="settings-vertex_project_id" class="input-field font-mono" placeholder="my-project-123">
                    <p class="text-xs text-slate-500 mt-1">Google Cloud Project ID Anda (cek di <a href="https://console.cloud.google.com" target="_blank" class="text-blue-600 hover:underline">Cloud Console</a>).</p>
                  </div>
                </div>
             </div>
             <div>
               <label class="label">GLM-4 (Zhipu AI) API Key</label>
               <div class="relative">
                 <input type="password" id="settings-z_ai_api_key" class="input-field font-mono pr-10" placeholder="Enter GLM API key...">
                 <div class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                   <i class="fas fa-robot text-xs opacity-50"></i>
                 </div>
               </div>
               <p class="text-xs text-slate-500 mt-1.5">Kunci API untuk model GLM-4.7-Flash (Pilihan alternatif).</p>
            </div>

            <div class="pt-6 border-t border-slate-200/50">
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

            <div class="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
               <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                 <i class="fas fa-info-circle text-indigo-600"></i> Informasi Penggunaan Model AI
               </h4>
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed">
                  <div class="space-y-2">
                    <p class="font-semibold text-slate-700 uppercase tracking-wider">Fitur Utama</p>
                    <ul class="space-y-1 text-slate-600">
                       <li>• <strong>Surat Otomatis:</strong> Mistral Large / GLM</li>
                       <li>• <strong>Program Kerja:</strong> Mistral Large / GLM</li>
                       <li>• <strong>Laporan KKG:</strong> Mistral (Default)</li>
                    </ul>
                  </div>
                  <div class="space-y-2">
                    <p class="font-semibold text-slate-700 uppercase tracking-wider">Asisten Pembelajaran</p>
                    <ul class="space-y-1 text-slate-600">
                       <li>• <strong>RPP Deep Learning:</strong> GLM-4.7 (Default)</li>
                       <li>• <strong>Asesmen & Kisi:</strong> Mistral / GLM</li>
                       <li>• <strong>Slide Presentation:</strong> Mistral / GLM</li>
                    </ul>
                  </div>
               </div>
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

  `;
  return renderAdminLayout(innerContent, state.currentAdminTab || 'dashboard');
}

// Tab Switching
window.switchAdminTab = function (tab) {
  const tabs = ['dashboard', 'profil', 'sekolah', 'templates', 'users', 'logs'];
  const restrictedInOperator = ['profil', 'templates', 'logs'];

  if (isOperatorMode() && restrictedInOperator.includes(tab)) {
    tab = 'dashboard';
  }

  if (!tabs.includes(tab)) tab = 'dashboard';
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tab-${t}`);
    const panel = document.getElementById(`panel-${t}`);
    if (t === tab) {
      state.currentAdminTab = tab;

      if (tabBtn) {
        // Set outer button as active (black background, white text)
        tabBtn.className = "w-full text-left px-4 py-3 rounded-2xl flex items-center transition-all duration-300 group relative overflow-hidden bg-indigo-900/40 backdrop-blur-2xl border-indigo-500/20 text-slate-900 shadow-sm shadow-slate-200/50 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]";
        // Set inner span icon as active
        const iconSpan = tabBtn.querySelector('span:first-child');
        if (iconSpan) {
          iconSpan.className = "w-8 h-8 flex items-center justify-center rounded-xl mr-3 transition-colors duration-300 relative z-10 bg-white/20 text-slate-900";
        }
      }

      // Force show active panel
      if (panel) {
        panel.classList.remove('hidden');
        panel.style.display = 'block';
        panel.style.visibility = 'visible';
      }
    } else {
      if (tabBtn) {
        // Set outer button as inactive (transparent background, hover effects)
        tabBtn.className = "w-full text-left px-4 py-3 rounded-2xl flex items-center transition-all duration-300 group relative overflow-hidden text-slate-600 hover:bg-slate-100/50 backdrop-blur-md hover:text-slate-900";
        // Set inner span icon as inactive
        const iconSpan = tabBtn.querySelector('span:first-child');
        if (iconSpan) {
          iconSpan.className = "w-8 h-8 flex items-center justify-center rounded-xl mr-3 transition-colors duration-300 relative z-10 bg-white/95 backdrop-blur-xl border border-slate-200/70 shadow-sm shadow-slate-200/50 group-hover:border-[#e4e4e7] text-slate-500 group-hover:text-indigo-600";
        }
      }
      // Force hide inactive panels
      if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none';
        panel.style.visibility = 'hidden';
      }
    }
  });

  // Manage auto-refresh based on active tab
  if (tab === 'dashboard') {
    startDashboardAutoRefresh();
  } else {
    stopDashboardAutoRefresh();
  }

  if (tab === 'logs') { loadAuditLogsActions(); loadAuditLogs(); loadAuditStats(); }
  else if (tab === 'sekolah') loadSekolah();
  else if (tab === 'templates') loadTemplates();
  else if (tab === 'users') { loadAdminUsers(); loadPendingApprovals(); }
  else if (tab === 'dashboard') {
    loadAdminDashboard();
  }

  applyAdminModeUI();
}

// Global handler for sidebar tab clicks
window.handleAdminTabClick = function (tabId) {
  if (state.currentPage === 'admin') {
    switchAdminTab(tabId);
  } else {
    state.currentAdminTab = tabId;
    navigate('admin');
  }
};

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
// Logic Functions
// ============================================

// [Audit Log Functions]
window.loadAuditLogs = async function (page = 1) {
  const body = document.getElementById('audit-log-body');
  const pagination = document.getElementById('log-pagination');
  if (!body || !pagination) return;
  const spacing = getTableSpacing();

  body.innerHTML = skeletonTable(4, 5);

  try {
    const action = document.getElementById('log-filter-action')?.value || '';
    const search = document.getElementById('log-filter-search')?.value || '';
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      action,
      search,
    });

    const res = await api(`/admin/logs?${params.toString()}`);
    const logs = res.data?.logs || [];
    const pageInfo = res.data?.pagination;

    if (logs.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500">Tidak ada log data.</td></tr>';
      pagination.innerHTML = '';
      return;
    }

    body.innerHTML = logs.map(log => `
    <tr class="hover:bg-slate-50 backdrop-blur-xl transition-colors border-b border-slate-200/70 last:border-0 ${spacing.row}" >
        <td class="${spacing.td} text-slate-600 whitespace-nowrap font-mono">${formatDateTime(log.created_at)}</td>
        <td class="${spacing.td}">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs"><i class="fas fa-user"></i></div>
            <span class="font-medium text-slate-900">${escapeHtml(log.user_name || 'System')}</span>
          </div>
        </td>
        <td class="${spacing.td} text-center">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 uppercase tracking-wide">${escapeHtml(log.action)}</span>
        </td>
        <td class="${spacing.td} text-slate-600">
          <div class="truncate max-w-xs font-mono text-xs bg-slate-50 backdrop-blur-xl p-1 rounded border border-slate-200/70" title="${escapeHtml(JSON.stringify(log.details || {}))}">${escapeHtml(JSON.stringify(log.details || {})).substring(0, 80)}</div>
        </td>
      </tr >
    `).join('');

    const hasPrev = pageInfo?.hasPrevPage || page > 1;
    const hasNext = pageInfo?.hasNextPage || logs.length >= 10;
    pagination.innerHTML = `
    < button onclick = "loadAuditLogs(${page - 1})" ${hasPrev ? '' : 'disabled'} class="btn btn-sm btn-secondary" > <i class="fas fa-chevron-left"></i></button >
      <span class="text-sm self-center text-slate-600">Hal ${page}</span>
      <button onclick="loadAuditLogs(${page + 1})" ${hasNext ? '' : 'disabled'} class="btn btn-sm btn-secondary"><i class="fas fa-chevron-right"></i></button>
  `;
  } catch (e) {
    body.innerHTML = `<tr > <td colspan="4" class="text-center text-red-500 py-4">${escapeHtml(e.message || 'Gagal memuat log')}</td></tr> `;
  }
}

window.debounceLogSearch = debounce(function () {
  window.loadAuditLogs();
}, 500);

window.loadAuditLogsActions = async function () {
  try {
    const res = await api('/admin/logs/actions');
    const s = document.getElementById('log-filter-action');
    if (s && res.data) {
      s.innerHTML = '<option value="">Semua Aksi</option>' + res.data.map(a => `< option value = "${escapeHtml(a.value)}" > ${escapeHtml(a.label)}</option > `).join('');
    }
  } catch (e) { }
}

window.loadAuditStats = async function () {
  try {
    const res = await api('/admin/logs/stats');
    const container = document.getElementById('log-stats');
    if (container && res.data) {
      container.innerHTML = `
    < span > <i class="fas fa-list mr-1"></i>Total: ${res.data.total}</span >
      <span class="ml-2"><i class="fas fa-calendar-day mr-1"></i>Hari Ini: ${res.data.today}</span>
  `;
    }
  } catch (e) { }
}

// [Template Functions]
window.loadTemplates = async function () {
  const list = document.getElementById('templates-list');
  if (!list) return;

  try {
    const url = window.currentTemplateFilter
      ? `/templates?jenis=${window.currentTemplateFilter}&active=false`
      : '/templates?active=false';

    const res = await api(url);
    if (!res.data || res.data.length === 0) {
      list.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500 flex flex-col items-center"><i class="fas fa-folder-open text-4xl mb-4 opacity-20"></i><span>Belum ada template surat.</span></div>';
      return;
    }

    list.innerHTML = res.data.map(t => `
    <div class="group relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/70 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden flex flex-col">
        <div class="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="p-5 flex flex-col flex-1">
          <div class="flex justify-between items-start mb-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.jenis === 'undangan' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'} capitalize">
              ${escapeHtml(t.jenis || '-')}
            </span>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="editTemplate(${t.id})" class="p-1.5 rounded-lg hover:bg-slate-50 backdrop-blur-xl text-blue-500 transition-colors" title="Edit"><i class="fas fa-edit"></i></button>
              <button onclick="deleteTemplate(${t.id}, '${escapeHtml(t.nama)}')" class="p-1.5 rounded-lg hover:bg-slate-50 backdrop-blur-xl text-red-500 transition-colors" title="Hapus"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${escapeHtml(t.nama)}</h3>
          <p class="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">${escapeHtml(t.deskripsi || 'Tidak ada deskripsi')}</p>
          <div class="pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
            <span><i class="far fa-clock mr-1"></i>${formatDate(t.created_at)}</span>
                        <button onclick="previewTemplate(${t.id})" class="text-blue-500 hover:underline">Pratinjau</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<div class="col-span-full text-center text-red-500 py-4">${escapeHtml(e.message || 'Gagal memuat template')}</div>`;
  }
}

window.filterTemplates = function (type) {
  window.currentTemplateFilter = type;
  document.querySelectorAll('.template-filter-btn').forEach(btn => {
    const isMatch = (type === '' && btn.innerText === 'Semua') || btn.innerText.toLowerCase().includes(type);
    if (isMatch) {
      btn.classList.add('bg-primary-50', 'text-primary-600', 'border', 'border-primary-100');
      btn.classList.remove('text-slate-600');
    } else {
      btn.classList.remove('bg-primary-50', 'text-primary-600', 'border', 'border-primary-100');
      btn.classList.add('text-slate-600');
    }
  });
  loadTemplates();
}

// [User Functions] 
window.showAddUserModal = function () {
  const modal = document.getElementById('add-user-modal');
  openAdminModal('add-user-modal', 'input[name="nama"]');
  const select = modal.querySelector('select[name="sekolah"]');
  if (select) populateSekolahSelect(select);
  validateUserForm('add');
}

// Helper: Populate School Select
async function populateSekolahSelect(selectEl, selectedValue = '') {
  const fallbackSchools = [
    "SDN 2 Nangerang", "SDN 1 Nangerang", "SDN Nagrog", "SDN Raharja",
    "SDN 1 Cibuntu", "SDN 2 Cibuntu", "SDN Sumurugul", "SDN Sakambang", "SDIT Al-Qalam"
  ];

  try {
    const res = await api('/sekolah');
    const schools = (res.data && res.data.length > 0) ? res.data : fallbackSchools.map(n => ({ nama: n, tipe: n.includes('Al-Qalam') ? 'swasta' : 'negeri', is_sekretariat: n.includes('SDN 2 Nangerang') }));

    selectEl.innerHTML = '<option value="">-- Pilih Sekolah --</option>' +
      schools.map(s => {
        let label = escapeHtml(s.nama);
        if (s.is_sekretariat) label += ' (Sekretariat)';
        if (s.tipe === 'swasta') label += ' (Swasta)';
        return `<option value="${escapeHtml(s.nama)}" ${s.nama === selectedValue ? 'selected' : ''}>${label}</option>`;
      }).join('');
  } catch (e) {
    selectEl.innerHTML = '<option value="">-- Pilih Sekolah --</option>' +
      fallbackSchools.map(n => `<option value="${n}" ${n === selectedValue ? 'selected' : ''}>${n}</option>`).join('');
  }
}

window.saveNewUser = async function (e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('add-user-submit');

  const nama = form.nama?.value;
  const email = form.email?.value;
  const password = form.password?.value;

  // Basic validation
  if (!nama || !email || !password) {
    moduleToast('Users', 'Harap isi semua field wajib', 'warning');
    return;
  }

  const restoreBtn = setBusyButton(submitBtn, true, 'Menyimpan...');

  try {
    const sekolah = form.sekolah?.value || '';
    const role = form.role?.value || 'user';

    await api('/admin/users', {
      method: 'POST',
      body: { nama, email, password, role, sekolah }
    });

    moduleToast('Users', 'Pengguna berhasil dibuat', 'success');
    closeAdminModal('add-user-modal');
    form.reset();
    await Promise.all([loadAdminUsers(), loadPendingApprovals(), loadAdminDashboard(true)]);
  } catch (e) {
    console.error('Error in saveNewUser:', e);
    moduleToast('Users', e.message || 'Gagal membuat pengguna', 'error');
  } finally {
    restoreBtn();
  }
}

window.editUser = async function (user) {
  try {
    const modal = document.getElementById('edit-user-modal');
    openAdminModal('edit-user-modal', 'input[name="nama"]');
    const form = modal.querySelector('form');

    // Fill data
    if (form.id) form.id.value = user.id;
    if (form.nama) form.nama.value = user.nama || '';
    if (form.email) form.email.value = user.email || '';
    if (form.nip) form.nip.value = user.nip || '';
    if (form.role) form.role.value = user.role || 'user';

    // Load sekolah options
    const sekolahSelect = form.querySelector('select[name="sekolah"]');
    if (sekolahSelect) {
      await populateSekolahSelect(sekolahSelect, user.sekolah);
    }
    validateUserForm('edit');
  } catch (e) {
    console.error('Error opening edit user modal:', e);
    moduleToast('Users', 'Gagal memuat form edit pengguna', 'error');
  }
}

window.saveUser = async function (e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('edit-user-submit');
  const restoreBtn = setBusyButton(submitBtn, true, 'Menyimpan...');

  try {
    const id = form.id?.value;
    const nama = form.nama?.value;
    const email = form.email?.value;
    const nip = form.nip?.value || null;
    const sekolah = form.sekolah?.value;
    const role = form.role?.value;

    await api(`/admin/users/${id}`, {
      method: 'PUT',
      body: { nama, email, nip, sekolah, role }
    });

    moduleToast('Users', 'Pengguna berhasil diperbarui', 'success');
    closeAdminModal('edit-user-modal');
    await Promise.all([loadAdminUsers(), loadPendingApprovals(), loadAdminDashboard(true)]);
  } catch (e) {
    console.error('Error saving user:', e);
    moduleToast('Users', e.message || 'Gagal memperbarui pengguna', 'error');
  } finally {
    restoreBtn();
  }
}

window.deleteUser = async function (id) {
  if (!confirm('Hapus pengguna ini?')) return;
  try {
    await api(`/admin/users/${id}`, { method: 'DELETE' });
    moduleToast('Users', 'Pengguna berhasil dihapus', 'success');
    await Promise.all([loadAdminUsers(), loadPendingApprovals(), loadAdminDashboard(true)]);
  } catch (e) {
    moduleToast('Users', e.message || 'Gagal menghapus pengguna', 'error');
  }
}

window.resetUserPassword = async function (userId) {
  openResetPasswordModal(userId);
}


// [Sekolah Functions]
window.loadSekolah = async function () {
  const container = document.getElementById('sekolah-table-body');
  if (!container) return;
  const spacing = getTableSpacing();

  // Skeleton loader
  container.innerHTML = skeletonTable(6, 6);

  try {
    const res = await api('/sekolah');
    const sekolahList = res.data || [];
    sekolahSelectionState.selectedIds.clear();
    const checkAllSekolah = document.getElementById('sekolah-check-all');
    if (checkAllSekolah) checkAllSekolah.checked = false;
    if (sekolahList.length === 0) {
      sekolahSelectionState.selectedIds.clear();
      container.innerHTML = `<tr > <td colspan="7" class="text-center py-12 text-slate-500"><div class="flex flex-col items-center gap-3"><i class="fas fa-school text-4xl opacity-20"></i><span>Belum ada data sekolah</span><button onclick="showAddSekolahModal()" class="text-xs px-3 py-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-50 backdrop-blur-xl">Tambah Sekolah</button></div></td></tr> `;
      updateSekolahSelectionUI();
      return;
    }

    container.innerHTML = sekolahList.map((s, idx) => `
    <tr tabindex = "0" class="hover:bg-slate-50 backdrop-blur-xl odd:bg-slate-900/50 backdrop-blur-xl even:bg-slate-50 backdrop-blur-xl/35 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors border-b border-slate-200/70 last:border-0 group ${spacing.row}" >
              <td class="px-4 py-3 text-center"><input data-sekolah-id="${s.id}" type="checkbox" onchange="toggleSekolahRowSelection('${s.id}', this.checked)"></td>
              <td class="${spacing.td} text-slate-600">${idx + 1}</td>
              <td class="${spacing.td}">
                  <div class="flex flex-col">
                      <span class="font-bold text-slate-900 text-base group-hover:text-blue-500 transition-colors">${escapeHtml(s.nama)}</span>
                      ${s.is_sekretariat ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 w-fit mt-1"><i class="fas fa-star mr-1 text-[10px]"></i>Sekretariat</span>' : ''}
                  </div>
              </td>
              <td class="${spacing.td}">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.tipe === 'negeri' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-700'} capitalize">
                    ${s.tipe}
                  </span>
              </td>
              <td class="${spacing.td} text-slate-900">
                 ${s.kepala_sekolah ? `<div class="font-medium">${escapeHtml(s.kepala_sekolah)}</div>` : '<span class="text-slate-500 italic">Belum diset</span>'}
                 ${s.nip_kepala_sekolah ? `<div class="text-xs text-slate-500 font-mono mt-0.5">${escapeHtml(s.nip_kepala_sekolah)}</div>` : ''}
              </td>
              <td class="${spacing.td} text-center">
                <span class="font-mono text-sm bg-slate-50 backdrop-blur-xl px-2 py-1 rounded border border-slate-200/70">${s.jumlah_guru || '-'}</span>
              </td>
               <td class="${spacing.td} text-center">
                <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick='editSekolah(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors" title="Edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteSekolah(${s.id}, '${escapeHtml(s.nama || '')}')" class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                </div>
              </td >
            </tr >
    `).join('');

    updateSekolahSelectionUI();
  } catch (e) {
    sekolahSelectionState.selectedIds.clear();
    container.innerHTML = `<tr > <td colspan="7" class="text-center py-8"><div class="inline-flex flex-col items-center gap-2 text-rose-600"><i class="fas fa-triangle-exclamation"></i><span>${escapeHtml(e.message || 'Gagal memuat data sekolah')}</span><button onclick="loadSekolah()" class="text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100">Coba Lagi</button></div></td></tr> `;
    updateSekolahSelectionUI();
  }
}

function updateSekolahSelectionUI() {
  const toolbar = document.getElementById('sekolah-selection-toolbar');
  const countLabel = document.getElementById('sekolah-selected-count');
  const selectedCount = sekolahSelectionState.selectedIds.size;
  if (toolbar) toolbar.classList.toggle('hidden', selectedCount === 0);
  if (countLabel) countLabel.textContent = `${selectedCount} sekolah terpilih`;
}

window.toggleSekolahRowSelection = function (id, checked) {
  if (checked) sekolahSelectionState.selectedIds.add(String(id));
  else sekolahSelectionState.selectedIds.delete(String(id));
  updateSekolahSelectionUI();
}

window.toggleAllSekolahRows = function (checked) {
  const checkboxes = document.querySelectorAll('#sekolah-table-body input[type="checkbox"]');
  sekolahSelectionState.selectedIds.clear();
  checkboxes.forEach((cb) => {
    cb.checked = checked;
    const id = cb.getAttribute('data-sekolah-id');
    if (checked && id) sekolahSelectionState.selectedIds.add(String(id));
  });
  updateSekolahSelectionUI();
}

window.showAddSekolahModal = function () {
  openAdminModal('sekolah-modal', 'input[name="nama"]');
  const form = document.getElementById('sekolah-form');
  form.reset();
  form.id_sekolah.value = '';
  document.getElementById('sekolah-modal-title').textContent = 'Tambah Sekolah';
}

window.editSekolah = function (sekolah) {
  openAdminModal('sekolah-modal', 'input[name="nama"]');
  document.getElementById('sekolah-modal-title').textContent = 'Edit Sekolah';

  const form = document.getElementById('sekolah-form');
  form.id_sekolah.value = sekolah.id;
  form.nama.value = sekolah.nama || '';
  form.alamat.value = sekolah.alamat || '';
  form.npsn.value = sekolah.npsn || '';
  form.tipe.value = sekolah.tipe || 'negeri';
  form.kepala_sekolah.value = sekolah.kepala_sekolah || '';
  form.nip_kepala_sekolah.value = sekolah.nip_kepala_sekolah || '';
  form.kop_surat_url.value = sekolah.kop_surat_url || '';

  // Show kop surat preview if exists
  const preview = document.getElementById('kop-surat-preview');
  const img = document.getElementById('kop-surat-img');
  if (sekolah.kop_surat_url) {
    img.src = sekolah.kop_surat_url;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
  form.jumlah_guru.value = sekolah.jumlah_guru || '';
  form.is_sekretariat.checked = !!sekolah.is_sekretariat;
  form.is_sekolah_penggerak.checked = !!sekolah.is_sekolah_penggerak;
}

window.saveSekolah = async function (e) {
  e.preventDefault();
  const form = e.target;
  const id = form.id_sekolah.value;
  const submitBtn = document.getElementById('sekolah-submit-btn');
  const restoreBtn = setBusyButton(submitBtn, true, id ? 'Memperbarui...' : 'Menyimpan...');

  try {
    // Handle kop surat - compress and convert to base64 data URL
    let kopUrl = form.kop_surat_url.value || null;
    const fileInput = form.querySelector('input[name="kop_surat_file"]');
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
          moduleToast('Sekolah', 'Ukuran file kop surat maksimal 5MB', 'warning');
        } else {
          // Compress image using canvas
          kopUrl = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              let w = img.width, h = img.height;
              if (w > MAX_WIDTH) { h = Math.round(h * MAX_WIDTH / w); w = MAX_WIDTH; }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              console.log('[KOP SURAT] Compressed:', Math.round(dataUrl.length / 1024), 'KB');
              resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
          });
        }
      } catch (err) {
        console.error('[KOP SURAT] Compression failed:', err);
        moduleToast('Sekolah', 'Gagal memproses gambar kop surat', 'warning');
      }
    }

    // Collect data
    const data = {
      nama: form.nama.value,
      alamat: form.alamat.value,
      npsn: form.npsn.value,
      tipe: form.tipe.value,
      kepala_sekolah: form.kepala_sekolah.value,
      nip_kepala_sekolah: form.nip_kepala_sekolah.value,
      jumlah_guru: form.jumlah_guru.value,
      is_sekretariat: form.is_sekretariat.checked,
      is_sekolah_penggerak: form.is_sekolah_penggerak.checked,
      kop_surat_url: kopUrl
    };

    if (id) {
      await api(`/sekolah/${id}`, { method: 'PUT', body: data });
      moduleToast('Sekolah', 'Data sekolah berhasil diperbarui', 'success');
    } else {
      await api('/sekolah', { method: 'POST', body: data });
      moduleToast('Sekolah', 'Data sekolah berhasil ditambahkan', 'success');
    }
    document.getElementById('sekolah-modal').classList.add('hidden');
    closeAdminModal('sekolah-modal');
    loadSekolah();
  } catch (e) { moduleToast('Sekolah', e.message || 'Gagal menyimpan data sekolah', 'error'); }
  finally { restoreBtn(); }
}

window.previewKopSurat = function (input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById('kop-surat-preview');
      const img = document.getElementById('kop-surat-img');
      img.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(input.files[0]);
  }
}

window.removeKopSurat = function () {
  const form = document.getElementById('sekolah-form');
  form.kop_surat_url.value = '';
  const preview = document.getElementById('kop-surat-preview');
  preview.classList.add('hidden');
  const fileInput = form.querySelector('input[name="kop_surat_file"]');
  if (fileInput) fileInput.value = '';
}

window.closeSekolahModal = function () {
  closeAdminModal('sekolah-modal');
}

window.deleteSekolah = async function (id, nama = '') {
  if (!confirm('Hapus sekolah ini?')) return;

  showUndoActionBar(
    `Penghapusan sekolah ${nama || ''} dijadwalkan(5 detik).`,
    async () => {
      try {
        await api(`/sekolah/${id}`, { method: 'DELETE' });
        moduleToast('Sekolah', 'Data sekolah berhasil dihapus', 'success');
        loadSekolah();
      } catch (e) {
        moduleToast('Sekolah', e.message || 'Gagal menghapus data sekolah', 'error');
      }
    },
    () => moduleToast('Sekolah', 'Aksi penghapusan dibatalkan', 'info')
  );
}

window.saveSettings = async function (e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/admin/settings', {
      method: 'PUT',
      body: { mistral_api_key: form.mistral_api_key.value }
    });
    moduleToast('Sistem', 'Pengaturan berhasil disimpan', 'success');
  } catch (e) { moduleToast('Sistem', e.message || 'Gagal menyimpan pengaturan', 'error'); }
}

window.saveProfilKKG = async function () {
  try {
    const data = {
      nama_kkg: document.getElementById('profil-nama_kkg').value,
      tahun_ajaran: document.getElementById('profil-tahun_ajaran').value,
      npsn_sekolah_induk: document.getElementById('profil-npsn_sekolah_induk').value,
      nama_sekolah_induk: document.getElementById('profil-nama_sekolah_induk').value,
      alamat_sekretariat: document.getElementById('profil-alamat_sekretariat').value,
      kecamatan: document.getElementById('profil-kecamatan').value,
      kabupaten: document.getElementById('profil-kabupaten').value,
      provinsi: document.getElementById('profil-provinsi').value,
      kode_pos: document.getElementById('profil-kode_pos').value,
      nama_ketua: document.getElementById('profil-nama_ketua').value,
      nama_sekretaris: document.getElementById('profil-nama_sekretaris').value,
      nama_bendahara: document.getElementById('profil-nama_bendahara').value,
      email_kkg: document.getElementById('profil-email_kkg').value,
      telepon_kkg: document.getElementById('profil-telepon_kkg').value,
      website_kkg: document.getElementById('profil-website_kkg').value,
      struktur_organisasi: document.getElementById('profil-struktur_organisasi')?.value || '',
      visi_misi: document.getElementById('profil-visi_misi')?.value || '',
      mistral_api_key: document.getElementById('settings-mistral_api_key')?.value || '',
      z_ai_api_key: document.getElementById('settings-z_ai_api_key')?.value || '',
      gemini_api_key: document.getElementById('settings-gemini_api_key')?.value || '',
      groq_api_key: document.getElementById('settings-groq_api_key')?.value || '',
      vertex_api_key: document.getElementById('settings-vertex_api_key')?.value || '',
      vertex_project_id: document.getElementById('settings-vertex_project_id')?.value || '',
      supabase_url: document.getElementById('settings-supabase_url')?.value || '',
      supabase_key: document.getElementById('settings-supabase_key')?.value || '',
      supabase_bucket: document.getElementById('settings-supabase_bucket')?.value || '',
    };

    await api('/admin/settings', { method: 'PUT', body: data });
    moduleToast('Profil', 'Konfigurasi berhasil disimpan', 'success');
  } catch (e) { moduleToast('Profil', e.message || 'Gagal menyimpan konfigurasi', 'error'); }
}

window.uploadLogo = async function (input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      moduleToast('Profil', 'Ukuran file maksimal 2MB', 'error');
      input.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    const previewContainer = document.getElementById('logo-preview');
    const originalContent = previewContainer.innerHTML;
    previewContainer.innerHTML = '<div class="flex items-center justify-center h-full"><i class="fas fa-spinner fa-spin text-2xl text-[var(--color-primary)]"></i></div>';

    try {
      // Use fetch directly for FormData to let browser set Content-Type with boundary
      const headers = {};
      const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
      if (csrfMatch) headers['X-CSRF-Token'] = csrfMatch[1];

      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Gagal upload logo');

      // Update preview
      previewContainer.innerHTML = `< img src = "${data.data.logo_url}" alt = "Logo KKG" class="w-full h-full object-contain" > `;

      // Update state
      if (window.state && window.state.settings) {
        window.state.settings.logo_url = data.data.logo_url;
      }

      moduleToast('Profil', 'Logo berhasil diunggah', 'success');

      // Reload to update logo everywhere
      setTimeout(() => window.location.reload(), 1500);

    } catch (e) {
      console.error(e);
      moduleToast('Profil', e.message || 'Gagal mengunggah logo', 'error');
      previewContainer.innerHTML = originalContent;
      input.value = '';
    }
  }
}

// Global scope expose for inline onclicks
window.clearAllCaches = async function () {
  // call global from main.js if accessible or reimplement
  if (window.parent && window.parent.clearAllCaches) {
    window.parent.clearAllCaches();
  } else {
    moduleToast('Sistem', 'Proses pembersihan cache dimulai', 'info');
  }
}

// [Dashboard Stats] - Consolidated into loadAdminDashboard
// window.loadAdminStats removed to avoid redundancy
