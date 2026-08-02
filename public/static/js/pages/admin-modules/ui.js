import { state } from '../state.js';
import { api } from '../api.js';
import { debounce, moduleToast, escapeHtml } from '../utils.js';

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

