import { state } from '../../state.js';
import { api } from '../../api.js';
import { debounce, escapeHtml } from '../../utils.js';
import {
  adminUsersPagination,
  pendingApprovalState,
  usersSelectionState,
  sekolahSelectionState,
  dashboardRefreshInterval, setDashboardRefreshInterval,
  dashboardPeriodDays, setDashboardPeriodDays,
  dashboardTrendPeriod, setDashboardTrendPeriod,
  dashboardActivityDays, setDashboardActivityDays,
  adminTableDensity, setAdminTableDensityValue,
  slaPendingThreshold, setSlaPendingThresholdValue,
  adminPanelMode, setAdminPanelModeValue,
  isOperatorMode,
  openAdminModal,
  closeAdminModal,
  getActiveAdminModalId,
  showUndoActionBar,
  setBusyButton,
} from './shared-state.js';

const moduleToast = (section, message, type = 'info') => window.showToast?.(message, type);

// ============================================
// Approval shortcut flag (ui.js-local)
// ============================================
let approvalShortcutBound = false;

// ============================================
// Table Spacing
// ============================================

window.getTableSpacing = function getTableSpacing() {
  return adminTableDensity === 'compact'
    ? { td: 'px-4 py-2.5 text-xs', row: 'text-xs' }
    : { td: 'px-6 py-4 text-sm', row: 'text-sm' };
}

// ============================================
// Dashboard Control Sync
// ============================================

function setControlButtonState(activeId, ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === activeId) {
      el.classList.add('bg-primary-600', 'text-slate-900', 'border-primary-600');
      el.classList.remove('bg-slate-50', 'backdrop-blur-xl', 'text-slate-600', 'border-slate-200/70');
    } else {
      el.classList.remove('bg-primary-600', 'text-slate-900', 'border-primary-600');
      el.classList.add('bg-slate-50', 'backdrop-blur-xl', 'text-slate-600', 'border-slate-200/70');
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

// ============================================
// Re-export closeAdminModal to window (for inline onclick handlers)
// ============================================

window.closeAdminModal = closeAdminModal;

// ============================================
// Modal Accessibility (Escape key)
// ============================================

function initModalAccessibility() {
  if (window.__adminModalA11yBound) return;
  window.__adminModalA11yBound = true;

  window.addEventListener('keydown', (event) => {
    const currentModalId = getActiveAdminModalId();
    if (event.key === 'Escape' && currentModalId) {
      event.preventDefault();
      closeAdminModal(currentModalId);
    }
  });
}

// ============================================
// Approval Keyboard Shortcuts
// ============================================

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

// ============================================
// User Form Validation
// ============================================

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

// ============================================
// Reject User Modal
// ============================================

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

// ============================================
// Reset Password Modal
// ============================================

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

// ============================================
// Admin Panel Mode
// ============================================

window.setAdminPanelMode = function (mode) {
  if (state.user?.role === 'operator') {
    setAdminPanelModeValue('operator');
    localStorage.setItem('admin_panel_mode', 'operator');
    return;
  }

  const newMode = mode === 'operator' ? 'operator' : 'admin';
  setAdminPanelModeValue(newMode);
  localStorage.setItem('admin_panel_mode', newMode);
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

// ============================================
// Table Density
// ============================================

window.setAdminDensity = function (mode) {
  const newDensity = mode === 'compact' ? 'compact' : 'comfortable';
  setAdminTableDensityValue(newDensity);
  localStorage.setItem('admin_table_density', newDensity);

  const compactBtn = document.getElementById('density-compact-btn');
  const comfortBtn = document.getElementById('density-comfort-btn');

  if (compactBtn && comfortBtn) {
    if (newDensity === 'compact') {
      compactBtn.classList.add('bg-primary-600', 'text-slate-900');
      compactBtn.classList.remove('bg-slate-50', 'backdrop-blur-xl', 'text-slate-600');
      comfortBtn.classList.remove('bg-primary-600', 'text-slate-900');
      comfortBtn.classList.add('bg-slate-50', 'backdrop-blur-xl', 'text-slate-600');
    } else {
      comfortBtn.classList.add('bg-primary-600', 'text-slate-900');
      comfortBtn.classList.remove('bg-slate-50', 'backdrop-blur-xl', 'text-slate-600');
      compactBtn.classList.remove('bg-primary-600', 'text-slate-900');
      compactBtn.classList.add('bg-slate-50', 'backdrop-blur-xl', 'text-slate-600');
    }
  }

  if (state.currentAdminTab === 'users' && window.loadAdminUsers) window.loadAdminUsers(adminUsersPagination.page || 1);
  if (state.currentAdminTab === 'sekolah' && window.loadSekolah) window.loadSekolah();
  if (state.currentAdminTab === 'logs' && window.loadAuditLogs) window.loadAuditLogs();
}

// ============================================
// Dashboard Period Controls
// ============================================

window.setDashboardPeriod = function (days) {
  setDashboardPeriodDays(Number(days) || 30);
  setDashboardTrendPeriod(dashboardPeriodDays <= 14 ? 'weekly' : 'monthly');
  syncDashboardControlState();
  if (window.loadAdminDashboard) window.loadAdminDashboard();
}

window.setDashboardActivityWindow = function (days) {
  setDashboardActivityDays(Number(days) || 7);
  syncDashboardControlState();
  if (window.loadDashboardActivity) window.loadDashboardActivity();
}

window.setDashboardTrendPeriod = function (period) {
  setDashboardTrendPeriod(period === 'monthly' ? 'monthly' : 'weekly');
  syncDashboardControlState();
  if (window.initDashboardCharts) window.initDashboardCharts();
}

window.setSlaPendingThreshold = function () {
  const input = document.getElementById('sla-threshold-input');
  if (!input) return;
  const parsed = Number(input.value);
  const newVal = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  setSlaPendingThresholdValue(newVal);
  localStorage.setItem('sla_pending_threshold', String(newVal));
  syncDashboardControlState();
  if (window.loadAdminDashboard) window.loadAdminDashboard(true);
  moduleToast('SLA', `Ambang pending disetel ke ${newVal}`, 'success');
}

// ============================================
// Init Admin Data
// ============================================

window.initAdminData = async function () {
  initApprovalShortcuts();
  initModalAccessibility();

  // Sequential loading to avoid rate limiting (429 errors)
  // Load dashboard first
  if (window.loadAdminDashboard) {
    try {
      await window.loadAdminDashboard();
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }

  // Small delay before loading settings
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!isOperatorMode() && window.loadAdminSettings) {
    try {
      await window.loadAdminSettings();
    } catch (e) {
      console.error('Settings load error:', e);
    }
  }

  // Sync panel visibility with the active tab (don't force-reset if user switched tab)
  const activeTab = state.currentAdminTab || 'dashboard';
  const allPanels = ['dashboard', 'profil', 'sekolah', 'templates', 'users', 'logs', 'ai-providers'];
  allPanels.forEach(tabName => {
    const panel = document.getElementById(`panel-${tabName}`);
    if (panel) {
      if (tabName === activeTab) {
        panel.classList.remove('hidden');
        panel.style.display = 'block';
        panel.style.visibility = 'visible';
      } else {
        panel.classList.add('hidden');
        panel.style.display = 'none';
      }
    }
  });

  window.setAdminDensity(adminTableDensity);
  syncDashboardControlState();
  applyAdminModeUI();

  // Start auto-refresh if on dashboard tab
  if (window.startDashboardAutoRefresh) {
    window.startDashboardAutoRefresh();
  }
}

// ============================================
// Tab Switching
// ============================================

window.switchAdminTab = function (tab) {
  const tabs = ['dashboard', 'profil', 'sekolah', 'templates', 'users', 'logs', 'ai-providers'];
  const restrictedInOperator = ['profil', 'templates', 'logs', 'ai-providers'];

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
        // Set outer button as active
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
        // Set outer button as inactive
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
    if (window.startDashboardAutoRefresh) window.startDashboardAutoRefresh();
  } else {
    if (window.stopDashboardAutoRefresh) window.stopDashboardAutoRefresh();
  }

  if (tab === 'logs') {
    if (window.loadAuditLogsActions) window.loadAuditLogsActions();
    if (window.loadAuditLogs) window.loadAuditLogs();
    if (window.loadAuditStats) window.loadAuditStats();
  }
  else if (tab === 'sekolah') {
    if (window.loadSekolah) window.loadSekolah();
  }
  else if (tab === 'templates') {
    if (window.loadTemplates) window.loadTemplates();
  }
  else if (tab === 'users') {
    if (window.loadAdminUsers) window.loadAdminUsers();
    if (window.loadPendingApprovals) window.loadPendingApprovals();
  }
  else if (tab === 'dashboard') {
    if (window.loadAdminDashboard) window.loadAdminDashboard();
  }
  else if (tab === 'ai-providers') {
    if (window.loadAdminAiProviders) window.loadAdminAiProviders();
  }

  applyAdminModeUI();
}

// Global handler for sidebar tab clicks
window.handleAdminTabClick = function (tabId) {
  if (state.currentPage === 'admin') {
    window.switchAdminTab(tabId);
  } else {
    state.currentAdminTab = tabId;
    navigate('admin');
  }
};
