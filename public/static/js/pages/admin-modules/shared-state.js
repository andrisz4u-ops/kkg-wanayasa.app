/**
 * shared-state.js — Single Source of Truth for Admin Module Shared State
 * 
 * All admin sub-modules (ui.js, users.js, settings.js, sekolah.js, dashboard.js)
 * import mutable state and cross-cutting utilities from this file.
 * 
 * ES module bindings are live but read-only for importers, so mutable objects
 * are exported as object references (mutate properties, never reassign the binding).
 */

import { state } from '../../state.js';
import { escapeHtml } from '../../utils.js';

// ============================================
// Selection & Pagination State
// ============================================

export const adminUsersPagination = {
  users: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  search: '',
  role: ''
};

export const pendingApprovalState = {
  items: [],
  selectedIds: new Set(),
};

export const usersSelectionState = {
  selectedIds: new Set(),
};

export const sekolahSelectionState = {
  selectedIds: new Set(),
};

// ============================================
// Dashboard Configuration (mutable via setters)
// ============================================

export let dashboardRefreshInterval = null;
export let dashboardPeriodDays = 30;
export let dashboardTrendPeriod = 'weekly';
export let dashboardActivityDays = 7;
export let adminTableDensity = localStorage.getItem('admin_table_density') || 'comfortable';
export let slaPendingThreshold = Number(localStorage.getItem('sla_pending_threshold') || 10);
export let adminPanelMode = (state.user?.role === 'operator')
  ? 'operator'
  : (localStorage.getItem('admin_panel_mode') === 'operator' ? 'operator' : 'admin');

// Setters — needed because ES module imports are read-only bindings
export function setDashboardRefreshInterval(val) { dashboardRefreshInterval = val; }
export function setDashboardPeriodDays(val) { dashboardPeriodDays = val; }
export function setDashboardTrendPeriod(val) { dashboardTrendPeriod = val; }
export function setDashboardActivityDays(val) { dashboardActivityDays = val; }
export function setAdminTableDensityValue(val) { adminTableDensity = val; }
export function setSlaPendingThresholdValue(val) { slaPendingThreshold = val; }
export function setAdminPanelModeValue(val) { adminPanelMode = val; }

// ============================================
// Operator Mode Check
// ============================================

export function isOperatorMode() {
  return state.user?.role === 'operator' || adminPanelMode === 'operator';
}

// ============================================
// Modal Accessibility
// ============================================

let activeAdminModalId = null;
let previousFocusedElement = null;

export function openAdminModal(modalId, focusSelector = 'input, select, textarea, button') {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  previousFocusedElement = document.activeElement;
  activeAdminModalId = modalId;
  modal.classList.remove('hidden');
  const scrollContainer = modal.querySelector('.overflow-y-auto');
  if (scrollContainer) scrollContainer.scrollTop = 0;
  const target = modal.querySelector(focusSelector);
  if (target) {
    setTimeout(() => {
      target.focus({ preventScroll: true });
      if (scrollContainer) scrollContainer.scrollTop = 0;
    }, 0);
  }
}

export function closeAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  if (activeAdminModalId === modalId) activeAdminModalId = null;
  if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
    setTimeout(() => previousFocusedElement.focus(), 0);
  }
}

export function getActiveAdminModalId() { return activeAdminModalId; }

// ============================================
// Undo Action Bar
// ============================================

let undoActionState = null;

export function showUndoActionBar(label, onConfirm, onUndo, timeoutMs = 5000) {
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

// ============================================
// Busy Button Helper
// ============================================

export function setBusyButton(button, isBusy, busyLabel = 'Memproses...') {
  if (!button) return () => { };
  
  // Save original states on the button element if not already saved
  if (isBusy) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
      button.dataset.originalDisabled = button.disabled ? 'true' : 'false';
    }
    button.disabled = true;
    button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${busyLabel}`;
  } else {
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      button.disabled = button.dataset.originalDisabled === 'true';
      delete button.dataset.originalHtml;
      delete button.dataset.originalDisabled;
    } else {
      button.disabled = false;
    }
  }

  return () => {
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      button.disabled = button.dataset.originalDisabled === 'true';
      delete button.dataset.originalHtml;
      delete button.dataset.originalDisabled;
    } else {
      button.disabled = false;
    }
  };
}

// ============================================
// Date Utility
// ============================================

export function getDateNDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
