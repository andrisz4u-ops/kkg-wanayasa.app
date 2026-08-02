import { state } from '../state.js';
import { api } from '../api.js';
import { debounce, moduleToast, escapeHtml } from '../utils.js';

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
