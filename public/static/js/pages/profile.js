import { api } from '../api.js';
import { state } from '../state.js';
import { showToast, escapeHtml } from '../utils.js';

export async function renderProfile() {
  let profile = {};
  let sekolahList = [];

  try {
    const [profileRes, sekolahRes] = await Promise.all([
      api('/profile'),
      api('/sekolah')
    ]);
    profile = profileRes.data;
    sekolahList = sekolahRes.data || [];
  } catch (e) {
    showToast('Gagal memuat profil: ' + e.message, 'error');
    // Fallback to state user if API fails
    profile = state.user || {};
  }

  const roleLabel = profile.role === 'admin' 
    ? 'Administrator KKG' 
    : (profile.role === 'operator' ? 'Operator Gugus' : 'Pendidik Anggota KKG');
  const roleBadgeStyle = profile.role === 'admin' 
    ? 'bg-purple-100 text-purple-700 border-purple-200' 
    : (profile.role === 'operator' ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-teal-50 text-teal-700 border-teal-200');
  const roleIcon = profile.role === 'admin' ? 'fa-shield-halved' : (profile.role === 'operator' ? 'fa-user-shield' : 'fa-chalkboard-user');

  return `
    <div class="max-w-5xl mx-auto py-6 px-2 sm:px-4 space-y-8 animate-fade-in">
        
        <!-- Header Title Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 text-[11px] font-extrabold uppercase tracking-widest mb-1.5 border border-teal-500/20">
                <i class="fas fa-id-badge text-[10px]"></i>
                Manajemen Akun & Identitas
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                Profil Pendidik
              </h1>
            </div>
            <span class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-600 self-start sm:self-auto">
              <i class="fas fa-check-circle text-emerald-500"></i> Akun Terverifikasi
            </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Column: Teacher Identity Card -->
            <div class="lg:col-span-4 space-y-6">
                <div class="bg-white rounded-[32px] shadow-sm border border-slate-200/90 overflow-hidden relative">
                    <!-- Cover Header -->
                    <div class="h-28 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 relative">
                      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0)] [background-size:16px_16px]"></div>
                    </div>

                    <div class="p-6 pt-0 text-center relative">
                        <!-- Avatar Photo with upload trigger -->
                        <div class="relative w-28 h-28 mx-auto -mt-14 mb-4 group">
                            <img src="${profile.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nama)}&background=269494&color=fff&size=128`}" 
                                 alt="Foto Profil" 
                                 class="w-full h-full object-cover rounded-full border-4 border-white shadow-lg bg-slate-100 group-hover:brightness-95 transition-all">
                            <label class="absolute bottom-0 right-0 bg-teal-600 text-white w-9 h-9 rounded-full cursor-pointer hover:bg-teal-700 shadow-md transition-all hover:scale-110 flex items-center justify-center border-2 border-white" title="Ubah Foto">
                                <i class="fas fa-camera text-xs"></i>
                                <input type="file" accept="image/*" class="hidden" onchange="uploadProfilePhoto(this)">
                            </label>
                        </div>
                        
                        <h2 class="font-extrabold text-xl text-slate-900 tracking-tight leading-snug">${escapeHtml(profile.nama)}</h2>
                        <p class="text-slate-500 text-xs mt-1 mb-4 truncate">${escapeHtml(profile.email)}</p>
                        
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${roleBadgeStyle} mb-6">
                            <i class="fas ${roleIcon} text-[11px]"></i>
                            <span>${roleLabel}</span>
                        </div>

                        <div class="border-t border-slate-100 pt-5 text-left space-y-3.5 text-xs">
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 font-medium">Sekolah Induk</span>
                                <span class="font-bold text-slate-800 text-right truncate max-w-[170px]">${escapeHtml(profile.sekolah || 'Gugus 3')}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 font-medium">Jabatan / Mapel</span>
                                <span class="font-bold text-slate-800 text-right truncate max-w-[170px]">${escapeHtml(profile.mata_pelajaran || 'Guru Kelas')}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 font-medium">NIP</span>
                                <span class="font-bold text-slate-800">${escapeHtml(profile.nip || '-')}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 font-medium">Bergabung Sejak</span>
                                <span class="font-bold text-slate-700">${profile.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info Hint Card -->
                <div class="p-5 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-900 text-xs leading-relaxed">
                  <div class="flex items-start gap-3">
                    <i class="fas fa-info-circle text-teal-600 text-base shrink-0 mt-0.5"></i>
                    <p>
                      Pastikan <strong>Nama Lengkap</strong>, <strong>NIP</strong>, dan <strong>Sekolah Induk</strong> sudah benar karena data ini dicantumkan otomatis pada kop surat dan modul RPP cetak.
                    </p>
                  </div>
                </div>
            </div>

            <!-- Right Column: Edit Forms -->
            <div class="lg:col-span-8 space-y-8">
                
                <!-- Biodata Form -->
                <div class="bg-white rounded-[32px] shadow-sm border border-slate-200/90 p-6 sm:p-8">
                    <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                      <div class="flex items-center gap-3">
                        <span class="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center text-base font-bold">
                          <i class="fas fa-id-card"></i>
                        </span>
                        <div>
                          <h3 class="font-extrabold text-lg text-slate-900 tracking-tight">Data Pribadi & Kepegawaian</h3>
                          <p class="text-xs text-slate-400">Perbarui identitas dan data kedinasan Anda</p>
                        </div>
                      </div>
                    </div>
                    
                    <form onsubmit="updateProfile(event)" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Lengkap & Gelar</label>
                                <input type="text" name="nama" value="${escapeHtml(profile.nama || '')}" required
                                       class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">NIP</label>
                                <input type="text" name="nip" value="${escapeHtml(profile.nip || '')}" placeholder="198XXXXXXXXXXXXXXX"
                                       class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">NIK</label>
                                <input type="text" name="nik" value="${escapeHtml(profile.nik || '')}" placeholder="32XXXXXXXXXXXXXX"
                                       class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">No. HP / WhatsApp</label>
                                <input type="tel" name="no_hp" value="${escapeHtml(profile.no_hp || '')}" placeholder="08XXXXXXXXXX"
                                       class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Alamat Domisili</label>
                                <input type="text" name="alamat" value="${escapeHtml(profile.alamat || '')}" placeholder="Alamat tempat tinggal lengkap"
                                       class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                            </div>
                        </div>

                        <div class="pt-4 border-t border-slate-100">
                          <h4 class="text-xs font-extrabold text-teal-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i class="fas fa-school text-teal-600"></i> Unit Tugas & Sekolah
                          </h4>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sekolah Induk</label>
                                  <select name="sekolah" class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white text-sm font-medium text-slate-800">
                                      <option value="">-- Pilih Sekolah --</option>
                                      ${sekolahList.map(s => `
                                          <option value="${escapeHtml(s.nama)}" ${profile.sekolah === s.nama ? 'selected' : ''}>${escapeHtml(s.nama)}</option>
                                      `).join('')}
                                      <option value="Lainnya" ${profile.sekolah === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                                  </select>
                              </div>
                              <div>
                                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mata Pelajaran / Jabatan</label>
                                  <select name="mata_pelajaran_select" onchange="toggleMapelInput(this)" class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white text-sm font-medium text-slate-800 mb-2">
                                      <option value="">-- Pilih Jabatan --</option>
                                      ${['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].map(jabatan => `
                                          <option value="${jabatan}" ${profile.mata_pelajaran === jabatan ? 'selected' : ''}>${jabatan}</option>
                                      `).join('')}
                                      <option value="Lainnya" ${!['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].includes(profile.mata_pelajaran) && profile.mata_pelajaran ? 'selected' : ''}>Lainnya</option>
                                  </select>
                                  <input type="text" name="mata_pelajaran_custom" id="mapel-custom-input" 
                                         value="${!['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].includes(profile.mata_pelajaran) ? (profile.mata_pelajaran || '') : ''}" 
                                         placeholder="Tuliskan jabatan lainnya..."
                                         class="${!['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].includes(profile.mata_pelajaran) && profile.mata_pelajaran ? '' : 'hidden'} w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                              </div>
                          </div>
                        </div>

                        <div class="flex justify-end pt-4">
                            <button type="submit" class="px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5">
                                <i class="fas fa-save"></i>
                                <span>Simpan Perubahan</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Password Form -->
                <div class="bg-white rounded-[32px] shadow-sm border border-slate-200/90 p-6 sm:p-8">
                    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                      <span class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-base font-bold">
                        <i class="fas fa-key"></i>
                      </span>
                      <div>
                        <h3 class="font-extrabold text-lg text-slate-900 tracking-tight">Ganti Password Akun</h3>
                        <p class="text-xs text-slate-400">Jaga keamanan akun Anda dengan kata sandi yang kuat</p>
                      </div>
                    </div>
                    
                    <form onsubmit="changePassword(event)" class="space-y-5">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password Saat Ini</label>
                            <input type="password" name="current_password" required placeholder="Masukkan kata sandi lama"
                                   class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password Baru</label>
                                <input type="password" name="new_password" required minlength="8" placeholder="Minimal 8 karakter"
                                       class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Konfirmasi Password Baru</label>
                                <input type="password" name="confirm_password" required minlength="8" placeholder="Ulangi kata sandi baru"
                                       class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800">
                            </div>
                        </div>

                        <div class="flex justify-end pt-2">
                            <button type="submit" class="px-7 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5">
                                <i class="fas fa-lock text-xs"></i>
                                <span>Perbarui Password</span>
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </div>
  `;
}

// Global functions for event handlers
window.toggleMapelInput = function (select) {
  const customInput = document.getElementById('mapel-custom-input');
  if (select.value === 'Lainnya') {
    customInput.classList.remove('hidden');
    customInput.focus();
  } else {
    customInput.classList.add('hidden');
  }
};

window.updateProfile = async function (e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Menyimpan...';

  // Determine Mata Pelajaran Value
  let mapelValue = form.mata_pelajaran_select.value;
  if (mapelValue === 'Lainnya' || (!mapelValue && form.mata_pelajaran_custom?.value)) {
    mapelValue = form.mata_pelajaran_custom?.value || '';
  }

  const formData = new FormData();
  formData.append('nama', form.nama.value);
  formData.append('nip', form.nip.value);
  formData.append('nik', form.nik.value);
  formData.append('no_hp', form.no_hp.value);
  formData.append('alamat', form.alamat.value);
  formData.append('sekolah', form.sekolah.value);
  formData.append('mata_pelajaran', mapelValue);

  // Check if there is a pending photo upload
  const fileInput = document.querySelector('input[type="file"][onchange="uploadProfilePhoto(this)"]');
  if (fileInput && fileInput.files.length > 0) {
    formData.append('foto', fileInput.files[0]);
  }

  try {
    const headers = {};
    const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
    if (csrfMatch) headers['X-CSRF-Token'] = csrfMatch[1];

    const response = await fetch('/api/guru/profile', {
      method: 'PUT',
      headers: headers,
      body: formData
    });

    const res = await response.json();

    if (!res.success) {
      const errorMsg = res.error?.message || res.message || 'Gagal update profil';
      throw new Error(errorMsg);
    }

    state.user = { ...state.user, ...res.data };
    showToast('Profil berhasil diperbarui!', 'success');

    setTimeout(() => {
      if (window.renderApp) window.renderApp();
      else window.location.reload();
    }, 800);

  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
};

window.uploadProfilePhoto = function (input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = input.closest('.relative').querySelector('img');
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
    showToast('Foto dipilih. Klik "Simpan Perubahan" untuk menyimpan.', 'info');
  }
};

window.changePassword = async function (e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;

  if (form.new_password.value !== form.confirm_password.value) {
    showToast('Konfirmasi password tidak cocok', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Memproses...';

  try {
    await api('/profile/password', {
      method: 'PUT',
      body: {
        current_password: form.current_password.value,
        new_password: form.new_password.value,
        confirm_password: form.confirm_password.value
      }
    });

    showToast('Password berhasil diubah! Silakan login ulang.', 'success');
    form.reset();

    setTimeout(() => {
      api('/auth/logout', { method: 'POST' }).finally(() => {
        window.location.href = '/login';
      });
    }, 1500);

  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
};
