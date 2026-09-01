import { state } from '../../state.js';
import { api } from '../../api.js';
import { debounce, escapeHtml, skeletonTable, parseDate, formatRelativeTime, formatDateTime } from '../../utils.js';
import {
  adminUsersPagination,
  pendingApprovalState,
  usersSelectionState,
  isOperatorMode,
  openAdminModal,
  closeAdminModal,
  showUndoActionBar,
  setBusyButton,
} from './shared-state.js';

const moduleToast = (section, message, type = 'info') => window.showToast?.(message, type);
const getTableSpacing = () => window.getTableSpacing?.() || { td: 'px-6 py-4 text-sm', row: 'text-sm' };

// Load Users Data with Server-side Pagination
window.loadAdminUsers = async function (page = 1) {
  const container = document.querySelector('#panel-users-tbody');
  if (!container) return;

  // Show loading state
  container.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-600"><i class="fas fa-spinner fa-spin mr-2"></i>Mengambil data pengguna...</td></tr>`;

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
    adminUsersPagination.users = res.data.users;
    Object.assign(adminUsersPagination, res.data.pagination, {
      users: res.data.users,
      search,
      role
    });
    usersSelectionState.selectedIds.clear();
    const checkAllUsers = document.getElementById('users-check-all');
    if (checkAllUsers) checkAllUsers.checked = false;

    renderAdminUsersTable();
    renderUsersPagination();
  } catch (e) {
    usersSelectionState.selectedIds.clear();
    container.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
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
        <td colspan="7" class="py-12 text-center">
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

  container.innerHTML = users.map(u => {
    const parsedLogin = parseDate(u.last_login_at);
    const isRecent = parsedLogin && (Date.now() - parsedLogin.getTime() < 48 * 3600 * 1000);
    const lastLoginHtml = u.last_login_at ? `
      <div class="flex items-center gap-2" title="Waktu Login: ${escapeHtml(formatDateTime(u.last_login_at))}">
        <span class="w-2 h-2 rounded-full shrink-0 ${isRecent ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-600'}"></span>
        <div>
          <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">${escapeHtml(formatRelativeTime(u.last_login_at))}</p>
          <p class="text-[10px] text-slate-400 font-mono">${escapeHtml(formatDateTime(u.last_login_at))}</p>
        </div>
      </div>
    ` : `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700">
        <i class="fas fa-clock-rotate-left text-[10px] opacity-60"></i> Belum login
      </span>
    `;

    return `
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
        <td class="${spacing.td}">
          ${lastLoginHtml}
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
    `;
  }).join('');

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

