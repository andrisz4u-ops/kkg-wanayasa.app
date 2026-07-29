/**
 * Reset Password Page
 */

import { api } from '../api.js';
import { showToast, getQueryParams } from '../utils.js';
import { navigate } from '../router.js';

export function renderResetPassword() {
  const params = getQueryParams();
  const token = params.token || '';

  return `
  <div class="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-[var(--color-bg-primary)]">
      <div class="absolute inset-0 overflow-hidden pointer-events-none fade-in">
        <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#c5a059]/5 rounded-full blur-[100px] opacity-70"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#111111]/5 rounded-full blur-[100px] opacity-70"></div>
      </div>

    <div class="max-w-md w-full relative z-10 animate-slide-up">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-white border border-[var(--color-border-subtle)] rounded-3xl mb-6 shadow-sm mx-auto">
          <i class="fas fa-key text-3xl text-[#111111]"></i>
        </div>
        <h1 class="font-display text-4xl font-semibold text-[var(--color-text-primary)] tracking-tighter mb-2">Reset Password</h1>
        <p class="text-[var(--color-text-tertiary)] font-light tracking-wide uppercase text-xs">Masukkan password baru Anda</p>
      </div>

      <div class="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 border border-[var(--color-border-subtle)] relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#f8f9fa] rounded-bl-full pointer-events-none opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
        
        <div id="reset-form-container" class="relative z-10">
          ${token ? renderResetForm(token) : renderRequestForm()}
        </div>
      </div>

      <div class="text-center mt-10">
        <button onclick="navigate('login')" class="text-[var(--color-text-tertiary)] hover:text-[#111111] transition-colors text-xs font-medium uppercase tracking-wide flex items-center justify-center mx-auto gap-3 group">
          <i class="fas fa-arrow-left group-hover:-translate-x-2 transition-transform"></i> Kembali ke Login
        </button>
      </div>
    </div>
  </div>
  `;
}

function renderRequestForm() {
  return `
    <form id="forgot-password-form" onsubmit="handleForgotPassword(event)" class="space-y-5">
      <div>
        <label for="email" class="block text-[var(--color-text-secondary)] text-sm font-medium mb-2 ml-1">Email</label>
        <div class="relative group/input">
          <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
            <i class="fas fa-envelope"></i>
          </span>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            autocomplete="email"
            placeholder="nama@email.com"
            class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          >
        </div>
      </div>

      <button 
        type="submit" 
        id="forgot-btn"
        class="w-full mt-8 py-4 bg-[#111111] text-white rounded-full font-medium text-sm shadow-[var(--shadow-elevated)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center justify-center group/btn"
      >
        <span class="btn-text group-hover/btn:tracking-widest transition-all uppercase tracking-wider text-xs font-semibold"><i class="fas fa-paper-plane mr-2"></i> Kirim Link Reset</span>
      </button>
    </form>

    <div id="success-message" class="hidden text-center animate-fade-in">
      <div class="w-20 h-20 bg-[#f8f9fa] border border-[#10b981]/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <i class="fas fa-check text-4xl text-[#10b981]"></i>
      </div>
      <h3 class="font-display text-2xl font-semibold text-[var(--color-text-primary)] mb-2 tracking-tight">Email Terkirim!</h3>
      <p class="text-[var(--color-text-secondary)] font-light tracking-tight mb-8">
        Jika email terdaftar, Anda akan menerima link untuk reset password.
        Silakan cek inbox dan folder spam Anda.
      </p>
      <button 
        onclick="navigate('login')" 
        class="px-8 py-3 bg-[#111111] text-white rounded-full font-medium text-sm hover:-translate-y-1 hover:shadow-lg transition-all"
      >
        Kembali ke Login
      </button>
    </div>
  `;
}

function renderResetForm(token) {
  return `
    <div id="token-checking" class="text-center py-8">
      <div class="animate-spin w-12 h-12 border-4 border-[#111111]/20 border-t-[#111111] rounded-full mx-auto mb-4"></div>
      <p class="text-[var(--color-text-secondary)] font-medium text-sm">Memverifikasi token...</p>
    </div>

    <form id="reset-password-form" class="hidden space-y-5" onsubmit="handleResetPassword(event)">
      <input type="hidden" name="token" value="${token}">
      
      <div>
        <label for="new_password" class="block text-[var(--color-text-secondary)] text-sm font-medium mb-2 ml-1">Password Baru</label>
        <div class="relative group/input">
          <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
            <i class="fas fa-lock"></i>
          </span>
          <input 
            type="password" 
            id="new_password" 
            name="new_password" 
            required 
            minlength="8"
            placeholder="Minimal 8 karakter"
            class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] pr-12"
          >
          <button 
            type="button" 
            onclick="togglePasswordVisibility('new_password')"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[#111111] transition-colors"
          >
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>

      <div>
        <label for="confirm_password" class="block text-[var(--color-text-secondary)] text-sm font-medium mb-2 ml-1">Konfirmasi Password</label>
        <div class="relative group/input">
          <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
            <i class="fas fa-lock"></i>
          </span>
          <input 
            type="password" 
            id="confirm_password" 
            name="confirm_password" 
            required 
            minlength="8"
            placeholder="Ulangi password baru"
            class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] pr-12"
          >
          <button 
            type="button" 
            onclick="togglePasswordVisibility('confirm_password')"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[#111111] transition-colors"
          >
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        id="reset-btn"
        class="w-full mt-8 py-4 bg-[#111111] text-white rounded-full font-medium text-sm shadow-[var(--shadow-elevated)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center justify-center group/btn"
      >
        <span class="btn-text group-hover/btn:tracking-widest transition-all uppercase tracking-wider text-xs font-semibold"><i class="fas fa-save mr-2"></i> Simpan Password Baru</span>
      </button>
    </form>

    <div id="invalid-token" class="hidden text-center animate-fade-in">
      <div class="w-20 h-20 bg-[#f8f9fa] border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <i class="fas fa-times text-4xl text-rose-500"></i>
      </div>
      <h3 class="font-display text-2xl font-semibold text-[var(--color-text-primary)] mb-2 tracking-tight">Token Tidak Valid</h3>
      <p class="text-[var(--color-text-secondary)] font-light tracking-tight mb-8">
        Link reset password tidak valid atau sudah kadaluarsa.
        Silakan minta link reset password baru.
      </p>
      <button 
        onclick="showRequestForm()" 
        class="px-8 py-3 bg-[#111111] text-white rounded-full font-medium text-sm hover:-translate-y-1 hover:shadow-lg transition-all"
      >
        Minta Link Baru
      </button>
    </div>

    <div id="reset-success" class="hidden text-center animate-fade-in">
      <div class="w-20 h-20 bg-[#f8f9fa] border border-[#10b981]/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <i class="fas fa-check text-4xl text-[#10b981]"></i>
      </div>
      <h3 class="font-display text-2xl font-semibold text-[var(--color-text-primary)] mb-2 tracking-tight">Password Berhasil Direset!</h3>
      <p class="text-[var(--color-text-secondary)] font-light tracking-tight mb-8">
        Silakan login dengan password baru Anda.
      </p>
      <button 
        onclick="navigate('login')" 
        class="px-8 py-3 bg-[#111111] text-white rounded-full font-medium text-sm hover:-translate-y-1 hover:shadow-lg transition-all flex items-center justify-center mx-auto"
      >
        <i class="fas fa-sign-in-alt mr-2"></i>Login Sekarang
      </button>
    </div>
  `;
}

// Initialize page
export function initResetPassword() {
  const params = getQueryParams();
  const token = params.token;

  if (token) {
    verifyToken(token);
  }
}

async function verifyToken(token) {
  try {
    const res = await api(`/auth/verify-reset-token/${token}`);

    document.getElementById('token-checking')?.classList.add('hidden');

    if (res.data?.valid) {
      document.getElementById('reset-password-form')?.classList.remove('hidden');
    } else {
      document.getElementById('invalid-token')?.classList.remove('hidden');
    }
  } catch (e) {
    document.getElementById('token-checking')?.classList.add('hidden');
    document.getElementById('invalid-token')?.classList.remove('hidden');
  }
}

// Global handlers
window.handleForgotPassword = async function (e) {
  e.preventDefault();

  const form = e.target;
  const btn = document.getElementById('forgot-btn');
  const email = form.email.value.trim();

  if (!email) {
    showToast('Masukkan email Anda', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Mengirim...';

  try {
    await api('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });

    // Show success message
    document.getElementById('forgot-password-form')?.classList.add('hidden');
    document.getElementById('success-message')?.classList.remove('hidden');
  } catch (e) {
    showToast(e.message || 'Gagal mengirim email', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Kirim Link Reset';
  }
}

window.handleResetPassword = async function (e) {
  e.preventDefault();

  const form = e.target;
  const btn = document.getElementById('reset-btn');
  const token = form.token.value;
  const newPassword = form.new_password.value;
  const confirmPassword = form.confirm_password.value;

  if (newPassword !== confirmPassword) {
    showToast('Password tidak cocok', 'warning');
    return;
  }

  if (newPassword.length < 8) {
    showToast('Password minimal 8 karakter', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Menyimpan...';

  try {
    await api('/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        new_password: newPassword
      }
    });

    // Show success message
    document.getElementById('reset-password-form')?.classList.add('hidden');
    document.getElementById('reset-success')?.classList.remove('hidden');
    showToast('Password berhasil direset!', 'success');
  } catch (e) {
    showToast(e.message || 'Gagal reset password', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save mr-2"></i>Simpan Password Baru';
  }
}

window.showRequestForm = function () {
  const container = document.getElementById('reset-form-container');
  if (container) {
    container.innerHTML = renderRequestForm();
  }
}

window.togglePasswordVisibility = function (inputId) {
  const input = document.getElementById(inputId);
  const icon = input?.nextElementSibling?.querySelector('i');

  if (input && icon) {
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}
