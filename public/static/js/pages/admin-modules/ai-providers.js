import { state } from '../../state.js';
import { api } from '../../api.js';
import { escapeHtml } from '../../utils.js';
import { openAdminModal, closeAdminModal, showUndoActionBar, setBusyButton } from './shared-state.js';

const moduleToast = (section, message, type = 'info') => window.showToast?.(message, type);

let editingProviderId = null;
let currentProviders = [];

// ============================================
// Load AI Providers
// ============================================

window.loadAdminAiProviders = async function loadAdminAiProviders() {
  const container = document.getElementById('ai-providers-list');
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-center justify-center py-12 text-slate-400">
      <i class="fas fa-spinner fa-spin text-2xl mr-3 text-indigo-600"></i> Memuat provider AI...
    </div>
  `;

  try {
    const res = await api('/admin/ai-providers');
    currentProviders = res.data || [];

    if (currentProviders.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-500 bg-white/50 rounded-2xl border border-dashed border-slate-200">
          <i class="fas fa-robot text-4xl opacity-20 mb-3 block"></i>
          <p class="font-medium">Belum ada provider AI yang terdaftar</p>
          <p class="text-xs text-slate-400 mt-1 mb-4">Tambahkan provider AI custom untuk digunakan pada generator surat, RPP, dan modul ajar.</p>
          <button onclick="showAddAiProviderModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all">
            <i class="fas fa-plus mr-1.5"></i> Tambah Provider
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${currentProviders.map((p, idx) => renderProviderCard(p, idx)).join('')}
      </div>
    `;
  } catch (e) {
    console.error('Failed to load AI providers:', e);
    container.innerHTML = `
      <div class="text-center py-8 text-rose-500 bg-rose-50/50 rounded-2xl border border-rose-200 p-6">
        <i class="fas fa-triangle-exclamation text-2xl mb-2 block"></i>
        <p class="font-medium text-sm">${escapeHtml(e.message || 'Gagal memuat daftar provider AI')}</p>
        <button onclick="loadAdminAiProviders()" class="mt-3 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs hover:bg-rose-50">
          Coba Lagi
        </button>
      </div>
    `;
  }
};

// ============================================
// Render Provider Card
// ============================================

function renderProviderCard(p, idx) {
  const typeBadges = {
    openai_compat: { label: 'OpenAI Compatible', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    anthropic: { label: 'Anthropic Native', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    gemini_sdk: { label: 'Google Gemini SDK', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    bedrock: { label: 'AWS Bedrock', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    custom_proxy: { label: 'Custom HTTP Proxy', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const badge = typeBadges[p.api_type] || { label: p.api_type, color: 'bg-slate-100 text-slate-600 border-slate-200' };

  // Status check styling
  let statusBadge = '<span class="inline-flex items-center text-[10px] text-slate-400 font-medium"><span class="w-2 h-2 rounded-full bg-slate-300 mr-1.5"></span>Belum diuji</span>';
  if (p.last_check_ok === 1) {
    statusBadge = `<span class="inline-flex items-center text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="Terakhir diuji: ${p.last_check_at || '-'}"><span class="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>LIVE (${p.last_check_ms || 0}ms)</span>`;
  } else if (p.last_check_ok === -1) {
    statusBadge = `<span class="inline-flex items-center text-[10px] text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title="${escapeHtml(p.last_error || 'Gagal merespons')}"><span class="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>GAGAL (${p.last_check_ms || 0}ms)</span>`;
  }

  return `
    <div class="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border ${p.is_active ? 'border-slate-200/80 shadow-sm' : 'border-slate-200/40 opacity-60'} hover:shadow-md transition-all relative group" id="provider-card-${p.id}">
      <!-- Top header -->
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl ${p.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'} flex items-center justify-center font-bold text-xs border border-indigo-100/50">
            #${p.priority}
          </span>
          <div>
            <h4 class="font-display font-semibold text-slate-800 text-sm flex items-center gap-2">
              ${escapeHtml(p.name)}
              ${!p.is_active ? '<span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Nonaktif</span>' : ''}
            </h4>
            <p class="text-[11px] text-slate-400 font-mono">${escapeHtml(p.slug)}</p>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button onclick="toggleAiProviderActive(${p.id})" class="p-1.5 rounded-lg text-xs ${p.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'} transition-colors" title="${p.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}">
            <i class="fas ${p.is_active ? 'fa-toggle-on text-lg' : 'fa-toggle-off text-lg'}"></i>
          </button>
          <button onclick="showEditAiProviderModal(${p.id})" class="p-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors" title="Edit">
            <i class="fas fa-pen"></i>
          </button>
          <button onclick="deleteAiProvider(${p.id}, '${escapeHtml(p.name)}')" class="p-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 transition-colors" title="Hapus">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <!-- Badges & info -->
      <div class="flex flex-wrap items-center gap-1.5 mb-3">
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}">
          ${badge.label}
        </span>
        <span class="text-[10px] font-mono bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60 truncate max-w-[180px]" title="${escapeHtml(p.model)}">
          <i class="fas fa-cube text-[9px] mr-1 text-slate-400"></i>${escapeHtml(p.model)}
        </span>
        <span class="text-[10px] font-mono bg-indigo-50/70 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100/80" title="Total penggunaan token: ${p.total_tokens_used || 0}">
          <i class="fas fa-chart-simple text-[9px] mr-1 text-indigo-400"></i>${p.total_calls || 0}x · ${(p.total_tokens_used || 0) > 1000 ? ((p.total_tokens_used || 0) / 1000).toFixed(1) + 'k' : (p.total_tokens_used || 0)} tok
        </span>
        ${statusBadge}
      </div>

      <!-- Endpoint & detail -->
      <div class="bg-slate-50/70 rounded-xl p-2.5 text-[11px] font-mono text-slate-600 space-y-1 mb-3 border border-slate-100">
        <div class="truncate" title="${escapeHtml(p.base_url)}">
          <span class="text-slate-400 select-none">URL:</span> ${escapeHtml(p.base_url)}
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-500">
          <span>Key: <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200/50">${escapeHtml(p.api_key || '(dari env / kosong)')}</code></span>
          <span>Max: ${p.max_tokens || 8192} tok</span>
          <span>Temp: ${p.temperature ?? 0.7}</span>
        </div>
      </div>

      <!-- Bottom action: Check Live -->
      <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <span class="text-[11px] text-slate-400">
          ${p.last_check_at ? `Uji: ${new Date(p.last_check_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Belum pernah diuji'}
        </span>
        <button id="check-btn-${p.id}" onclick="checkAiProviderLive(${p.id})" class="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs">
          <i class="fas fa-bolt text-[10px]"></i> Check Live
        </button>
      </div>
    </div>
  `;
}

// ============================================
// Check Live
// ============================================

window.checkAiProviderLive = async function checkAiProviderLive(id) {
  const btn = document.getElementById(`check-btn-${id}`);
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Menguji...';
  }

  try {
    const res = await api(`/admin/ai-providers/${id}/check`, { method: 'POST' });
    const data = res.data || {};

    if (data.ok) {
      moduleToast('AI Provider', `Provider aktif! Latency: ${data.latency_ms}ms`, 'success');
    } else {
      moduleToast('AI Provider', `Gagal merespons: ${data.error || 'Unknown error'}`, 'error');
    }

    // Reload list to update status badge
    await window.loadAdminAiProviders();
  } catch (e) {
    moduleToast('AI Provider', e.message || 'Gagal melakukan check live', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
};

// ============================================
// Toggle Active
// ============================================

window.toggleAiProviderActive = async function toggleAiProviderActive(id) {
  try {
    const res = await api(`/admin/ai-providers/${id}/toggle`, { method: 'PUT' });
    moduleToast('AI Provider', res.message || 'Status provider diperbarui', 'success');
    await window.loadAdminAiProviders();
  } catch (e) {
    moduleToast('AI Provider', e.message || 'Gagal mengubah status provider', 'error');
  }
};

// ============================================
// Delete Provider
// ============================================

window.deleteAiProvider = function deleteAiProvider(id, name) {
  showUndoActionBar(
    `Hapus provider "${name}"?`,
    async () => {
      try {
        await api(`/admin/ai-providers/${id}`, { method: 'DELETE' });
        moduleToast('AI Provider', `Provider "${name}" berhasil dihapus`, 'success');
        await window.loadAdminAiProviders();
      } catch (e) {
        moduleToast('AI Provider', e.message || 'Gagal menghapus provider', 'error');
      }
    },
    () => moduleToast('AI Provider', 'Penghapusan dibatalkan', 'info'),
    5000
  );
};

// ============================================
// Modal: Add / Edit
// ============================================

window.showAddAiProviderModal = function showAddAiProviderModal(preset) {
  editingProviderId = null;
  document.getElementById('ai-provider-modal-title').textContent = 'Tambah Provider AI';
  document.getElementById('ai-provider-form').reset();
  document.getElementById('ai-provider-id').value = '';

  // Ensure submit button is cleanly reset
  const submitBtn = document.getElementById('ai-provider-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save mr-1.5"></i> Simpan Provider';
    delete submitBtn.dataset.originalHtml;
    delete submitBtn.dataset.originalDisabled;
  }

  // Defaults
  document.getElementById('aip-priority').value = '100';
  document.getElementById('aip-max_tokens').value = '8192';
  document.getElementById('aip-temperature').value = '0.7';
  document.getElementById('aip-extra_headers').value = '{}';
  document.getElementById('aip-extra_body').value = '{}';
  document.getElementById('aip-api_type').value = 'openai_compat';

  // Prevent accidental submit when typing in input and pressing Enter
  const form = document.getElementById('ai-provider-form');
  if (form && !form.dataset.enterBound) {
    form.dataset.enterBound = 'true';
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
        e.preventDefault();
      }
    });
  }

  if (preset) {
    window.applyAiPreset(preset);
  }

  openAdminModal('ai-provider-modal', '#aip-name');
};

window.showEditAiProviderModal = function showEditAiProviderModal(id) {
  const p = currentProviders.find(item => item.id === id);
  if (!p) return;

  editingProviderId = id;
  document.getElementById('ai-provider-modal-title').textContent = `Edit Provider: ${p.name}`;
  document.getElementById('ai-provider-id').value = p.id;

  // Ensure submit button is cleanly reset
  const submitBtn = document.getElementById('ai-provider-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save mr-1.5"></i> Simpan Perubahan';
    delete submitBtn.dataset.originalHtml;
    delete submitBtn.dataset.originalDisabled;
  }

  document.getElementById('aip-name').value = p.name || '';
  document.getElementById('aip-slug').value = p.slug || '';
  document.getElementById('aip-api_type').value = p.api_type || 'openai_compat';
  document.getElementById('aip-base_url').value = p.base_url || '';
  document.getElementById('aip-model').value = p.model || '';
  document.getElementById('aip-api_key').value = p.api_key || '';
  document.getElementById('aip-priority').value = p.priority ?? 100;
  document.getElementById('aip-max_tokens').value = p.max_tokens || 8192;
  document.getElementById('aip-temperature').value = p.temperature ?? 0.7;
  document.getElementById('aip-extra_headers').value = JSON.stringify(p.extra_headers || {}, null, 2);
  document.getElementById('aip-extra_body').value = JSON.stringify(p.extra_body || {}, null, 2);

  openAdminModal('ai-provider-modal', '#aip-name');
};

window.closeAiProviderModal = function closeAiProviderModal() {
  closeAdminModal('ai-provider-modal');
  editingProviderId = null;
};

// ============================================
// Presets
// ============================================

const PRESETS = {
  openai_gpt4o: {
    name: 'OpenAI GPT-4o',
    slug: 'openai-gpt4o',
    api_type: 'openai_compat',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    max_tokens: 8192,
  },
  gemini_flash: {
    name: 'Gemini 2.0 Flash',
    slug: 'gemini-flash',
    api_type: 'openai_compat',
    base_url: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    max_tokens: 8192,
  },
  claude_anthropic: {
    name: 'Claude Sonnet 4.6',
    slug: 'claude-anthropic',
    api_type: 'anthropic',
    base_url: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 8192,
  },
  groq_llama: {
    name: 'Groq LLaMA 3.3 70B',
    slug: 'groq-llama',
    api_type: 'openai_compat',
    base_url: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    max_tokens: 8192,
  },
  openrouter: {
    name: 'OpenRouter (Auto)',
    slug: 'openrouter',
    api_type: 'openai_compat',
    base_url: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o',
    max_tokens: 8192,
  },
  ollama_local: {
    name: 'Ollama (Lokal)',
    slug: 'ollama-local',
    api_type: 'openai_compat',
    base_url: 'http://localhost:11434/v1',
    model: 'llama3',
    max_tokens: 4096,
  },
};

window.applyAiPreset = function applyAiPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (!preset) return;

  document.getElementById('aip-name').value = preset.name;
  document.getElementById('aip-slug').value = preset.slug;
  document.getElementById('aip-api_type').value = preset.api_type;
  document.getElementById('aip-base_url').value = preset.base_url;
  document.getElementById('aip-model').value = preset.model;
  document.getElementById('aip-max_tokens').value = preset.max_tokens;
  moduleToast('Preset', `Preset ${preset.name} diterapkan! Masukkan API Key Anda.`, 'info');
};

// Auto slug generator from name
window.onAiProviderNameChange = function onAiProviderNameChange() {
  if (editingProviderId) return; // Don't auto-generate when editing
  const name = document.getElementById('aip-name').value;
  const slugInput = document.getElementById('aip-slug');
  if (name && (!slugInput.value || slugInput.dataset.touched !== 'true')) {
    slugInput.value = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

window.onAiProviderSlugTouch = function onAiProviderSlugTouch() {
  document.getElementById('aip-slug').dataset.touched = 'true';
};

// Auto-fill base URL default when API Type changes
window.onAiProviderTypeChange = function onAiProviderTypeChange() {
  const type = document.getElementById('aip-api_type').value;
  const urlInput = document.getElementById('aip-base_url');

  if (!urlInput.value || urlInput.value.includes('googleapis.com') || urlInput.value.includes('anthropic.com') || urlInput.value.includes('openai.com')) {
    if (type === 'openai_compat') urlInput.value = 'https://api.openai.com/v1';
    else if (type === 'anthropic') urlInput.value = 'https://api.anthropic.com';
    else if (type === 'gemini_sdk') urlInput.value = 'https://generativelanguage.googleapis.com';
    else if (type === 'bedrock') urlInput.value = 'https://bedrock-runtime.us-east-1.amazonaws.com';
  }
};

// ============================================
// Save Handler
// ============================================

window.saveAiProvider = async function saveAiProvider(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const submitBtn = document.getElementById('ai-provider-submit-btn');
  const restoreBtn = setBusyButton(submitBtn, true, 'Menyimpan...');

  try {
    const id = document.getElementById('ai-provider-id').value;
    const name = document.getElementById('aip-name').value.trim();
    const slug = document.getElementById('aip-slug').value.trim();
    const api_type = document.getElementById('aip-api_type').value;
    const base_url = document.getElementById('aip-base_url').value.trim();
    const model = document.getElementById('aip-model').value.trim();
    const api_key = document.getElementById('aip-api_key').value.trim();
    const priority = parseInt(document.getElementById('aip-priority').value) || 100;
    const max_tokens = parseInt(document.getElementById('aip-max_tokens').value) || 8192;

    // Handle comma or dot for temperature (e.g. "0,7" -> 0.7)
    const rawTemp = String(document.getElementById('aip-temperature').value).replace(',', '.');
    const parsedTemp = parseFloat(rawTemp);
    const temperature = isNaN(parsedTemp) ? 0.7 : parsedTemp;

    // Client-side quick validations
    if (!name) throw new Error('Nama Provider wajib diisi');
    if (!slug) throw new Error('Slug Identifier wajib diisi');
    if (!base_url) throw new Error('Base URL wajib diisi');
    if (!model) throw new Error('Model ID wajib diisi');

    let extra_headers = '{}';
    let extra_body = '{}';
    try {
      const h = document.getElementById('aip-extra_headers').value.trim() || '{}';
      JSON.parse(h);
      extra_headers = h;
    } catch {
      throw new Error('Extra Headers bukan format JSON yang valid');
    }

    try {
      const b = document.getElementById('aip-extra_body').value.trim() || '{}';
      JSON.parse(b);
      extra_body = b;
    } catch {
      throw new Error('Extra Body bukan format JSON yang valid');
    }

    const payload = {
      name, slug, api_type, base_url, model, api_key,
      priority, max_tokens, temperature, extra_headers, extra_body
    };

    if (id) {
      // Update
      await api(`/admin/ai-providers/${id}`, { method: 'PUT', body: payload });
      moduleToast('AI Provider', 'Provider berhasil diperbarui', 'success');
    } else {
      // Create
      await api('/admin/ai-providers', { method: 'POST', body: payload });
      moduleToast('AI Provider', 'Provider berhasil ditambahkan', 'success');
    }

    closeAiProviderModal();
    await window.loadAdminAiProviders();
  } catch (err) {
    console.error('Save AI Provider error:', err);
    moduleToast('AI Provider', err.message || 'Gagal menyimpan provider', 'error');
  } finally {
    restoreBtn();
  }
};
