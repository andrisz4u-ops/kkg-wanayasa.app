import { state } from '../state.js';
import { api } from '../api.js';
import { debounce, moduleToast, escapeHtml } from '../utils.js';

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
