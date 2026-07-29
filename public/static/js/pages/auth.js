// Auth Page Module - Login & Register
import { state } from '../state.js';
import { api, validators, validateForm, showFormErrors, clearFormErrors } from '../api.js';
import { showToast, escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

/**
 * Render Login/Register page
 */
export function renderLogin() {
  return `
    <div class="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-[var(--color-bg-primary)]">
      <div class="absolute inset-0 overflow-hidden pointer-events-none fade-in">
        <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#c5a059]/5 rounded-full blur-[100px] opacity-70"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#111111]/5 rounded-full blur-[100px] opacity-70"></div>
      </div>

      <div class="max-w-md w-full relative z-10 animate-slide-up">
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white border border-[var(--color-border-subtle)] rounded-3xl mb-6 shadow-sm mx-auto">
            <i class="fas fa-graduation-cap text-3xl text-[#111111]"></i>
          </div>
          <h1 id="kkg-name" class="font-display text-4xl font-semibold text-[var(--color-text-primary)] tracking-tighter mb-2">Portal Digital KKG</h1>
          <p id="kkg-address-subtitle" class="text-[var(--color-text-tertiary)] font-light tracking-wide uppercase text-xs">Gugus 3 Kecamatan Wanayasa</p>
        </div>

        <div class="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 border border-[var(--color-border-subtle)] relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-[#f8f9fa] rounded-bl-full pointer-events-none opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div class="flex p-1.5 mb-8 bg-[#f8f9fa] rounded-2xl border border-[var(--color-border-subtle)] relative z-10">
            <button 
              id="tab-login" 
              onclick="switchAuthTab('login')"
              class="flex-1 py-3 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all duration-300 text-[#111111] bg-white shadow-sm border border-[var(--color-border-subtle)]"
            >
              <i class="fas fa-sign-in-alt flex items-center justify-center mx-auto mb-1 text-[16px] pt-1"></i> Masuk
            </button>
            <button 
              id="tab-register" 
              onclick="switchAuthTab('register')"
              class="flex-1 py-3 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all duration-300 text-[var(--color-text-tertiary)] hover:text-[#111111] hover:bg-white/50 border border-transparent hover:border-[var(--color-border-subtle)]"
            >
              <i class="fas fa-user-plus flex items-center justify-center mx-auto mb-1 text-[16px] pt-1"></i> Daftar
            </button>
          </div>

          <form id="login-form" onsubmit="handleLogin(event)" class="animate-fade-in space-y-5 relative z-10">
            <div>
              <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-2 ml-1">Email</label>
              <div class="relative group/input">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
                  <i class="fas fa-envelope"></i>
                </span>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="nama@email.com"
                  class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-2 ml-1">Password</label>
              <div class="relative group/input">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
                  <i class="fas fa-lock"></i>
                </span>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Masukkan password"
                  class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              id="login-btn"
              class="w-full mt-6 py-4 bg-[#111111] text-white rounded-full font-medium text-sm shadow-[var(--shadow-elevated)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center justify-center group/btn"
            >
              <span class="btn-text group-hover/btn:tracking-widest transition-all uppercase tracking-wider text-xs font-semibold">Masuk Aplikasi</span>
              <span class="btn-loading hidden">
                <i class="fas fa-circle-notch fa-spin mr-2"></i>Memproses...
              </span>
            </button>
            
            <div class="text-center pt-4">
              <a href="javascript:void(0)" onclick="navigate('reset-password')" class="text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[#111111] transition-colors border-b border-transparent hover:border-[#111111] pb-0.5">
                Lupa Password?
              </a>
            </div>
          </form>

          <form id="register-form" class="hidden animate-fade-in space-y-4 relative z-10" onsubmit="handleRegister(event)">
            <div>
              <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">Nama Lengkap <span class="text-red-500">*</span></label>
              <div class="relative group/input">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
                  <i class="fas fa-user"></i>
                </span>
                <input 
                  type="text" 
                  name="nama" 
                  placeholder="Nama lengkap Anda"
                  class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">Email <span class="text-red-500">*</span></label>
              <div class="relative group/input">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
                  <i class="fas fa-envelope"></i>
                </span>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="nama@email.com"
                  class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">Password <span class="text-red-500">*</span></label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Min. 8 kar"
                  class="input-field bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                  required
                />
              </div>
              <div>
                <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">Konfirmasi <span class="text-red-500">*</span></label>
                <input 
                  type="password" 
                  name="confirm_password" 
                  placeholder="Ulangi"
                  class="input-field bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">NIP</label>
                <input 
                  type="text" 
                  name="nip" 
                  placeholder="NIP (ops)"
                  class="input-field bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                />
              </div>
              <div>
                <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">No. HP</label>
                <input 
                  type="tel" 
                  name="no_hp" 
                  placeholder="08xxx (ops)"
                  class="input-field bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                />
              </div>
            </div>

            <div>
              <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">Asal Sekolah</label>
              <div class="relative group/input">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
                  <i class="fas fa-school"></i>
                </span>
                <select 
                  name="sekolah" 
                  id="register-sekolah-select"
                  class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] appearance-none"
                >
                  <option value="" class="text-[var(--color-text-secondary)] bg-white">-- Pilih Sekolah --</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
                  <i class="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              id="register-btn"
              class="w-full mt-8 py-4 bg-[#111111] text-white rounded-full font-medium text-sm shadow-[var(--shadow-elevated)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center justify-center group/btn"
            >
              <span class="btn-text group-hover/btn:tracking-widest transition-all uppercase tracking-wider text-xs font-semibold">Daftar Sekarang</span>
              <span class="btn-loading hidden">
                <i class="fas fa-circle-notch fa-spin mr-2"></i>Memproses...
              </span>
            </button>
          </form>
        </div>

        <div class="text-center mt-10">
          <button onclick="navigate('home')" class="text-[var(--color-text-tertiary)] hover:text-[#111111] transition-colors text-xs font-medium uppercase tracking-wide flex items-center justify-center mx-auto gap-3 group">
            <i class="fas fa-arrow-left group-hover:-translate-x-2 transition-transform"></i> Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  `;
}


/**
 * Initialize Auth Page (Load public settings)
 */
export async function initAuth() {
  try {
    const res = await api('/settings/public');
    const settings = res.data;

    if (settings) {
      const nameEl = document.getElementById('kkg-name');
      const addressEl = document.getElementById('kkg-address-subtitle');

      if (nameEl && settings.nama_kkg) {
        nameEl.textContent = `Portal Digital ${settings.nama_kkg}`;
      }

      if (addressEl) {
        let address = '';
        if (settings.kecamatan) address += `Kecamatan ${settings.kecamatan}`;
        if (settings.kabupaten) address += `, Kabupaten ${settings.kabupaten}`;

        // Use full address if available or fallback to built parts
        addressEl.textContent = settings.alamat_sekretariat || address || 'Gugus 3 Kecamatan Wanayasa';
      }
    }
  } catch (e) {
    console.error('Failed to load public settings:', e);
  }
}

/**
 * Switch between login and register tabs
 */
window.switchAuthTab = function (tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (!loginForm || !registerForm) return;

  clearFormErrors('login-form');
  clearFormErrors('register-form');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');

    loginForm.classList.add('animate-slide-up');

    tabLogin.classList.remove('text-cream-400', 'hover:text-cream-200', 'hover:bg-coffee-700/50');
    tabLogin.classList.add('text-cream-100', 'bg-gradient-to-r', 'from-terracotta-500', 'to-sunset-500', 'shadow-lg', 'shadow-terracotta-500/20');

    tabRegister.classList.add('text-cream-400', 'hover:text-cream-200', 'hover:bg-coffee-700/50');
    tabRegister.classList.remove('text-cream-100', 'bg-gradient-to-r', 'from-terracotta-500', 'to-sunset-500', 'shadow-lg', 'shadow-terracotta-500/20');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');

    registerForm.classList.add('animate-slide-up');

    tabLogin.classList.add('text-cream-400', 'hover:text-cream-200', 'hover:bg-coffee-700/50');
    tabLogin.classList.remove('text-cream-100', 'bg-gradient-to-r', 'from-terracotta-500', 'to-sunset-500', 'shadow-lg', 'shadow-terracotta-500/20');

    tabRegister.classList.remove('text-cream-400', 'hover:text-cream-200', 'hover:bg-coffee-700/50');
    tabRegister.classList.add('text-cream-100', 'bg-gradient-to-r', 'from-terracotta-500', 'to-sunset-500', 'shadow-lg', 'shadow-terracotta-500/20');

    const sekolahSelect = document.getElementById('register-sekolah-select');
    if (sekolahSelect && sekolahSelect.options.length <= 1) {
      loadSekolahForRegister(sekolahSelect);
    }
  }
};

async function loadSekolahForRegister(select) {
  try {
    const res = await api('/sekolah');
    const sekolahList = res.data || [];

    // Add options
    sekolahList.forEach(s => {
      const option = document.createElement('option');
      option.value = s.nama;
      option.textContent = s.nama;
      option.className = "text-slate-900 bg-white"; // Ensure text is visible on white background options
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Failed to load sekolah:', e);
  }
}

/**
 * Handle login form submission
 */
window.handleLogin = async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate
  const { valid, errors } = validateForm(data, {
    email: [
      (v) => validators.required(v, 'Email'),
      validators.email
    ],
    password: [
      (v) => validators.required(v, 'Password')
    ]
  });

  if (!valid) {
    showFormErrors(errors, 'login-form');
    return;
  }

  // Show loading state
  const btn = document.getElementById('login-btn');
  setButtonLoading(btn, true);

  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: data
    });

    state.user = response.data.user;
    showToast('Login berhasil! Selamat datang kembali.', 'success');
    navigate('home');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
};

/**
 * Handle register form submission
 */
window.handleRegister = async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate
  const { valid, errors } = validateForm(data, {
    nama: [
      (v) => validators.required(v, 'Nama'),
      (v) => validators.minLength(v, 2, 'Nama')
    ],
    email: [
      (v) => validators.required(v, 'Email'),
      validators.email
    ],
    password: [
      (v) => validators.required(v, 'Password'),
      validators.password
    ],
    confirm_password: [
      (v) => validators.required(v, 'Konfirmasi password'),
      (v) => validators.match(v, data.password, 'Password tidak cocok')
    ]
  });

  if (!valid) {
    showFormErrors(errors, 'register-form');
    return;
  }

  // Show loading state
  const btn = document.getElementById('register-btn');
  setButtonLoading(btn, true);

  try {
    // Remove confirm_password before sending
    const { confirm_password, ...registerData } = data;

    const response = await api('/auth/register', {
      method: 'POST',
      body: registerData
    });

    if (response.data?.requireApproval) {
      showToast(response.message || 'Registrasi berhasil! Mohon tunggu persetujuan Admin.', 'success');
      // Reset form and switch to login tab
      form.reset();
      switchAuthTab('login');
    } else {
      state.user = response.data.user;
      showToast('Registrasi berhasil! Selamat bergabung.', 'success');
      navigate('home');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
};

/**
 * Helper to toggle button loading state
 */
function setButtonLoading(btn, loading) {
  if (!btn) return;

  const textEl = btn.querySelector('.btn-text');
  const loadingEl = btn.querySelector('.btn-loading');

  if (loading) {
    btn.disabled = true;
    btn.classList.add('opacity-80', 'cursor-not-allowed');
    if (textEl) textEl.classList.add('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
  } else {
    btn.disabled = false;
    btn.classList.remove('opacity-80', 'cursor-not-allowed');
    if (textEl) textEl.classList.remove('hidden');
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

/**
 * Logout handler
 */
window.logout = async function () {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore errors, still log out client-side
  }

  state.user = null;
  showToast('Logout berhasil', 'success');
  navigate('home');
};
