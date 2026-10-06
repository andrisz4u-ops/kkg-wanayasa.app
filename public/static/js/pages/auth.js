// Auth Page Module - Login & Register
import { state } from '../state.js';
import { api, validators, validateForm, showFormErrors, clearFormErrors } from '../api.js';
import { showToast, escapeHtml } from '../utils.js';
import { navigate } from '../router.js';
import { fetchUnreadCount } from '../notifications.js';

// Base 9 Schools of KKG Gugus 3 Wanayasa (Always guaranteed in dropdown)
const BASE_KKG_SCHOOLS = [
  { id: 1, nama: 'SDN 2 Nangerang' },
  { id: 2, nama: 'SDN 1 Nangerang' },
  { id: 3, nama: 'SDN Nagrog' },
  { id: 4, nama: 'SDN Raharja' },
  { id: 5, nama: 'SDN 1 Cibuntu' },
  { id: 6, nama: 'SDN 2 Cibuntu' },
  { id: 7, nama: 'SDN Sumurugul' },
  { id: 8, nama: 'SDN Sakambang' },
  { id: 9, nama: 'SDIT Al-Qalam' }
];

let allKnownSchools = [...BASE_KKG_SCHOOLS];

function canonicalSchoolKey(name) {
  if (!name) return '';
  let s = name.toLowerCase().trim();
  s = s.replace(/[\.\,\-\_\/\\]/g, ' ').replace(/\s+/g, ' ');
  s = s.replace(/\bsd\s+negeri\b/g, 'sdn');
  s = s.replace(/\bsd\s+negri\b/g, 'sdn');
  s = s.replace(/\bsd\s+n\b/g, 'sdn');
  s = s.replace(/\bsdn\b/g, 'sdn');
  s = s.replace(/\bsmp\s+negeri\b/g, 'smpn');
  s = s.replace(/\bsmp\s+negri\b/g, 'smpn');
  s = s.replace(/\bsmp\s+n\b/g, 'smpn');
  s = s.replace(/\bsmpn\b/g, 'smpn');
  s = s.replace(/\bsma\s+negeri\b/g, 'sman');
  s = s.replace(/\bsma\s+negri\b/g, 'sman');
  s = s.replace(/\bsma\s+n\b/g, 'sman');
  s = s.replace(/\bsman\b/g, 'sman');
  s = s.replace(/\bsmk\s+negeri\b/g, 'smkn');
  s = s.replace(/\bsmk\s+negri\b/g, 'smkn');
  s = s.replace(/\bsmk\s+n\b/g, 'smkn');
  s = s.replace(/\bsmkn\b/g, 'smkn');
  s = s.replace(/\bsd\s+it\b/g, 'sdit');
  s = s.replace(/\bsmp\s+it\b/g, 'smpit');
  s = s.replace(/\bsma\s+it\b/g, 'smait');
  s = s.replace(/\b0+(\d+)\b/g, '$1');
  return s.trim();
}

function formatStandardSchoolName(name) {
  if (!name) return '';
  let s = name.trim();
  s = s.replace(/^sd\s+negeri\s+/i, 'SDN ');
  s = s.replace(/^sd\s+negri\s+/i, 'SDN ');
  s = s.replace(/^sd\s+n\s+/i, 'SDN ');
  s = s.replace(/^sdn\s+/i, 'SDN ');
  s = s.replace(/^smp\s+negeri\s+/i, 'SMPN ');
  s = s.replace(/^smp\s+negri\s+/i, 'SMPN ');
  s = s.replace(/^smp\s+n\s+/i, 'SMPN ');
  s = s.replace(/^smpn\s+/i, 'SMPN ');
  s = s.replace(/^sma\s+negeri\s+/i, 'SMAN ');
  s = s.replace(/^sma\s+negri\s+/i, 'SMAN ');
  s = s.replace(/^sma\s+n\s+/i, 'SMAN ');
  s = s.replace(/^sman\s+/i, 'SMAN ');
  s = s.replace(/^smk\s+negeri\s+/i, 'SMKN ');
  s = s.replace(/^smk\s+negri\s+/i, 'SMKN ');
  s = s.replace(/^smk\s+n\s+/i, 'SMKN ');
  s = s.replace(/^smkn\s+/i, 'SMKN ');
  s = s.replace(/^sdit\s+/i, 'SDIT ');
  s = s.replace(/^sd\s+it\s+/i, 'SDIT ');
  s = s.replace(/^smpit\s+/i, 'SMPIT ');
  s = s.replace(/^smp\s+it\s+/i, 'SMPIT ');
  s = s.replace(/^smait\s+/i, 'SMAIT ');
  s = s.replace(/^sma\s+it\s+/i, 'SMAIT ');
  s = s.replace(/^([a-zA-Z]+)\s+0+(\d+)\b/i, '$1 $2');
  const parts = s.split(/\s+/);
  if (parts.length > 1) {
    const prefix = parts[0].toUpperCase();
    const rest = parts.slice(1).map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return `${prefix} ${rest}`;
  }
  return s;
}

function findMatchingClientSchool(inputName) {
  if (!inputName) return null;
  const trimmed = inputName.trim();
  const exact = allKnownSchools.find(s => s.nama.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const inputKey = canonicalSchoolKey(trimmed);
  if (!inputKey) return null;
  return allKnownSchools.find(s => canonicalSchoolKey(s.nama) === inputKey) || null;
}

/**
 * Render Login/Register page
 */
export function renderLogin() {
  return `
    <div role="main" class="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-[var(--color-bg-primary)]">
      <div class="absolute inset-0 overflow-hidden pointer-events-none fade-in">
        <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#c5a059]/5 rounded-full blur-[100px] opacity-70"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#111111]/5 rounded-full blur-[100px] opacity-70"></div>
      </div>

      <div class="max-w-md w-full relative z-10 animate-slide-up">
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white border border-[var(--color-border-subtle)] rounded-3xl mb-6 shadow-sm mx-auto">
            <i class="fas fa-graduation-cap text-3xl text-[#111111]"></i>
          </div>
          <h1 id="kkg-name" class="font-display text-4xl font-semibold text-[var(--color-text-primary)] tracking-tighter mb-2">RuangKKG Digital</h1>
          <p id="kkg-address-subtitle" class="text-[var(--color-text-secondary)] font-medium text-xs">Portal Guru SD dan KKG</p>
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
              <label class="block text-[var(--color-text-secondary)] text-sm font-medium mb-1.5 ml-1">Asal Sekolah / Satuan Pendidikan <span class="text-red-500">*</span></label>
              <div class="relative group/input">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-text-tertiary)] group-focus-within/input:text-[#111111] transition-colors pointer-events-none">
                  <i class="fas fa-school"></i>
                </span>
                <select 
                  name="sekolah" 
                  id="register-sekolah-select"
                  onchange="window.handleSekolahSelectChange && window.handleSekolahSelectChange(this)"
                  class="input-field pl-11 bg-[#f8f9fa] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] appearance-none"
                  required
                >
                  <option value="" class="text-[var(--color-text-secondary)] bg-white">-- Pilih Asal Sekolah / Instansi --</option>
                  <optgroup id="optgroup-gugus-3" label="🏫 9 Sekolah Anggota KKG Gugus 3 Wanayasa">
                    <option value="SDN 2 Nangerang" class="font-medium text-slate-900 bg-white">SDN 2 Nangerang (Sekretariat KKG)</option>
                    <option value="SDN 1 Nangerang" class="font-medium text-slate-900 bg-white">SDN 1 Nangerang</option>
                    <option value="SDN Nagrog" class="font-medium text-slate-900 bg-white">SDN Nagrog</option>
                    <option value="SDN Raharja" class="font-medium text-slate-900 bg-white">SDN Raharja (Sekolah Penggerak)</option>
                    <option value="SDN 1 Cibuntu" class="font-medium text-slate-900 bg-white">SDN 1 Cibuntu</option>
                    <option value="SDN 2 Cibuntu" class="font-medium text-slate-900 bg-white">SDN 2 Cibuntu</option>
                    <option value="SDN Sumurugul" class="font-medium text-slate-900 bg-white">SDN Sumurugul</option>
                    <option value="SDN Sakambang" class="font-medium text-slate-900 bg-white">SDN Sakambang</option>
                    <option value="SDIT Al-Qalam" class="font-medium text-slate-900 bg-white">SDIT Al-Qalam</option>
                  </optgroup>
                  <optgroup id="optgroup-sekolah-lainnya" label="🌐 Sekolah Terdaftar Lainnya" class="hidden"></optgroup>
                  <option value="__other__" class="text-amber-800 font-bold bg-amber-50">✍️ Sekolah Lainnya (Tulis / Ketik Manual)...</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
                  <i class="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
              <div id="register-sekolah-manual-wrapper" class="mt-2.5 hidden animate-fade-in">
                <div class="relative group/custom-input">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 pointer-events-none">
                    <i class="fas fa-pen-nib text-xs"></i>
                  </span>
                  <input 
                    type="text" 
                    id="register-sekolah-manual"
                    name="sekolah_custom"
                    placeholder="Tulis nama sekolah (contoh: SDN 1 Menteng / SD Negeri 2 Nangerang)"
                    oninput="window.handleManualSekolahInput && window.handleManualSekolahInput(this.value)"
                    class="input-field pl-10 bg-amber-50/30 border-amber-200 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-sm"
                  />
                </div>
                <!-- Smart Duplicate Filter Feedback Box -->
                <div id="sekolah-suggestion-box" class="mt-2 hidden"></div>
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
        addressEl.textContent = settings.alamat_sekretariat || address || 'Portal Guru & KKG';
      }
    }

    const sekolahSelect = document.getElementById('register-sekolah-select');
    if (sekolahSelect) {
      loadSekolahForRegister(sekolahSelect);
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
    if (sekolahSelect) {
      loadSekolahForRegister(sekolahSelect);
    }
  }
};

window.handleSekolahSelectChange = function (select) {
  const manualWrapper = document.getElementById('register-sekolah-manual-wrapper');
  const manualInput = document.getElementById('register-sekolah-manual');
  const box = document.getElementById('sekolah-suggestion-box');
  if (manualWrapper) {
    if (select.value === '__other__') {
      manualWrapper.classList.remove('hidden');
      if (manualInput) {
        manualInput.focus();
        if (manualInput.value) {
          window.handleManualSekolahInput(manualInput.value);
        }
      }
    } else {
      manualWrapper.classList.add('hidden');
      if (box) {
        box.className = 'mt-2 hidden';
        box.innerHTML = '';
      }
    }
  }
};

window.handleManualSekolahInput = function (val) {
  const box = document.getElementById('sekolah-suggestion-box');
  if (!box) return;

  const trimmed = (val || '').trim();
  if (trimmed.length < 3) {
    box.className = 'mt-2 hidden';
    box.innerHTML = '';
    return;
  }

  const matched = findMatchingClientSchool(trimmed);
  if (matched) {
    box.className = 'mt-2 block animate-fade-in';
    box.innerHTML = `
      <div class="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 shadow-sm">
        <div class="flex items-start gap-2.5">
          <i class="fas fa-filter text-amber-600 text-sm mt-0.5"></i>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-950">Terdeteksi Sebagai Sekolah Terdaftar:</span>
              <span class="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-bold">Anti-Duplikasi</span>
            </div>
            <p class="mt-1 text-amber-800 text-[11px] leading-relaxed">
              Nama <em>"${escapeHtml(trimmed)}"</em> merujuk ke sekolah resmi <strong>"${escapeHtml(matched.nama)}"</strong>. Sistem otomatis menghubungkan agar tidak dobel/ganda di pangkalan data.
            </p>
            <button 
              type="button" 
              onclick="window.selectCanonicalSchool('${escapeHtml(matched.nama)}')" 
              class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <i class="fas fa-check"></i> Gunakan "${escapeHtml(matched.nama)}" Langsung
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    const formatted = formatStandardSchoolName(trimmed);
    box.className = 'mt-2 block animate-fade-in';
    box.innerHTML = `
      <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
        <i class="fas fa-check-circle text-emerald-600"></i>
        <span>Format standar tersimpan: <strong>${escapeHtml(formatted)}</strong></span>
      </div>
    `;
  }
};

window.selectCanonicalSchool = function (schoolName) {
  const select = document.getElementById('register-sekolah-select');
  const manualWrapper = document.getElementById('register-sekolah-manual-wrapper');
  const manualInput = document.getElementById('register-sekolah-manual');
  const box = document.getElementById('sekolah-suggestion-box');

  if (select) {
    let found = false;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === schoolName) {
        select.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      const newOpt = document.createElement('option');
      newOpt.value = schoolName;
      newOpt.textContent = schoolName;
      newOpt.className = 'text-slate-900 bg-white font-medium';
      newOpt.selected = true;
      select.insertBefore(newOpt, select.querySelector('option[value="__other__"]'));
    }
  }

  if (manualWrapper) manualWrapper.classList.add('hidden');
  if (manualInput) manualInput.value = '';
  if (box) {
    box.className = 'mt-2 hidden';
    box.innerHTML = '';
  }
  showToast(`Sekolah disinkronkan ke: ${schoolName}`, 'info');
};

async function loadSekolahForRegister(select) {
  if (!select) return;
  try {
    const res = await api('/sekolah');
    const apiSchools = res.data || [];

    if (apiSchools.length > 0) {
      const map = new Map();
      allKnownSchools.forEach(s => map.set(s.nama.toLowerCase(), s));
      apiSchools.forEach(s => map.set(s.nama.toLowerCase(), s));
      allKnownSchools = Array.from(map.values());

      const optgroupLainnya = document.getElementById('optgroup-sekolah-lainnya');
      if (optgroupLainnya) {
        const defaultNames = BASE_KKG_SCHOOLS.map(s => s.nama.toLowerCase());
        const extraSchools = apiSchools.filter(s => !defaultNames.includes(s.nama.toLowerCase()));

        if (extraSchools.length > 0) {
          optgroupLainnya.innerHTML = '';
          optgroupLainnya.classList.remove('hidden');
          extraSchools.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.nama;
            opt.textContent = s.nama;
            opt.className = 'text-slate-900 bg-white';
            optgroupLainnya.appendChild(opt);
          });
        }
      }
    }
  } catch (e) {
    console.warn('Load sekolah note:', e);
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
    try { fetchUnreadCount(); } catch (_) {}
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
    // Resolve custom sekolah if selected
    let finalSekolah = (data.sekolah || '').trim();
    if (finalSekolah === '__other__' || !finalSekolah) {
      finalSekolah = (data.sekolah_custom || '').trim();
    }

    if (finalSekolah) {
      // Normalize aliases (e.g. "SD Negeri 2 Nangerang" -> "SDN 2 Nangerang")
      const matched = findMatchingClientSchool(finalSekolah);
      if (matched) {
        finalSekolah = matched.nama;
      } else {
        finalSekolah = formatStandardSchoolName(finalSekolah);
      }
    }

    // Remove confirm_password and sekolah_custom before sending
    const { confirm_password, sekolah_custom, ...registerData } = data;
    registerData.sekolah = finalSekolah;

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
