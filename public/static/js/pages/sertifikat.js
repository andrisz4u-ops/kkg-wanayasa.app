import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, formatDateTime, escapeHtml, showToast } from '../utils.js';
import { renderLoadFailure, renderEmptyState } from '../ui-load-state.js';

/**
 * Render Halaman Sertifikat KKG Guru (Portofolio)
 */
export async function renderSertifikat() {
  let sertifikatList = [];
  let loadFailed = false;

  try {
    const res = await api('/sertifikat/saya');
    sertifikatList = res.data || [];
  } catch (e) {
    loadFailed = true;
  }

  return `
  <div class="fade-in max-w-6xl mx-auto py-8 px-4 sm:px-6">
    <!-- Header Portofolio -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold mb-2 border border-amber-200 dark:border-amber-800">
          <i class="fas fa-certificate text-amber-500"></i>
          <span>Pengembangan Kompetensi Guru (PMM & E-Kinerja)</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
          <span class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center text-lg shadow-md shadow-amber-500/20">
            <i class="fas fa-award"></i>
          </span>
          Sertifikat & Portofolio KKG
        </h1>
        <p class="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl">
          Arsip bukti dukung resmi kegiatan KKG Gugus 3 Wanayasa bertanda tangan ganda Ketua KKG dan Pengawas Pembina. Sah digunakan untuk RHK Komunitas Belajar (4 Poin).
        </p>
      </div>

      <div class="flex items-center gap-2">
        <a href="/absensi" onclick="event.preventDefault(); window.navigate('absensi')" class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition flex items-center gap-2">
          <i class="fas fa-clipboard-check text-teal-500"></i>
          <span>Presensi Kegiatan</span>
        </a>
      </div>
    </div>

    <!-- Alert / Infobox Standar PMM -->
    <div class="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 shadow-sm">
      <div class="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 text-sm shadow-sm">
        <i class="fas fa-shield-check"></i>
      </div>
      <div class="text-xs sm:text-sm text-teal-950 dark:text-teal-200/90 leading-relaxed">
        <strong class="font-bold block mb-0.5 text-teal-900 dark:text-teal-100">Jaminan Keabsahan Kedinasan & Anti-Pemalsuan</strong>
        Setiap sertifikat diterbitkan dengan nomor register resmi dan QR token kriptografi yang dapat diverifikasi secara publik oleh Asesor PMM, Kepala Sekolah, atau Tim Penilai Angka Kredit.
      </div>
    </div>

    <!-- Kontainer List Sertifikat -->
    <div id="sertifikat-list-container">
      ${loadFailed ? renderLoadFailure('Gagal memuat sertifikat', 'sertifikat') : sertifikatList.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${sertifikatList.map(s => renderSertifikatCard(s)).join('')}
        </div>
      ` : renderEmptyState(
        'Belum ada sertifikat terbit',
        'Sertifikat akan terbit otomatis setelah Anda menghadiri kegiatan KKG, mengisi mikro-refleksi pembelajaran, serta disahkan oleh Pengawas Pembina dan Ketua KKG.'
      )}
    </div>

    <!-- Modal Pratinjau & Cetak Sertifikat -->
    <div id="modal-sertifikat-preview" class="hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div class="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[92vh]">
        <!-- Modal Toolbar -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-sm">
              <i class="fas fa-file-certificate"></i>
            </span>
            <div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">Pratinjau Dokumen Sertifikat Resmi</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Standar 2 Halaman (Piagam Depan + Struktur JP)</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.printSertifikat()" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-teal-600/20 flex items-center gap-2 transition">
              <i class="fas fa-print"></i>
              <span class="hidden sm:inline">Cetak / Simpan PDF</span>
            </button>
            <button onclick="window.closeSertifikatModal()" class="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Modal Body: Paper Canvas -->
        <div class="p-4 sm:p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div id="sertifikat-paper-content" class="w-full max-w-4xl space-y-8">
            <!-- Isi sertifikat dirender dinamis di sini -->
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

/**
 * Render Kartu Sertifikat di Dashboard
 */
function renderSertifikatCard(s) {
  return `
    <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-600/50 transition duration-300 flex flex-col justify-between group">
      <div>
        <div class="flex items-start justify-between gap-3 mb-3">
          <span class="px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-mono font-bold rounded-lg tracking-wider">
            ${escapeHtml(s.nomor_sertifikat)}
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <i class="fas fa-check-circle"></i> Sah Terverifikasi
          </span>
        </div>

        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
          ${escapeHtml(s.nama_kegiatan)}
        </h3>

        <div class="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-2">
            <i class="fas fa-calendar-day w-4 text-slate-400"></i>
            <span>${formatDate(s.tanggal)}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fas fa-clock w-4 text-slate-400"></i>
            <span>Beban Waktu: <strong>${s.alokasi_jp || 4} Jam Pelajaran (JP)</strong></span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fas fa-map-marker-alt w-4 text-slate-400"></i>
            <span>${escapeHtml(s.tempat || 'Gugus 3 Wanayasa')}</span>
          </div>
        </div>

        <!-- Tanda Tangan Ganda Badges -->
        <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-50 dark:bg-slate-700/40 p-2 rounded-xl">
            <span class="block text-slate-400 text-[10px] font-medium">Ketua KKG</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200 truncate block">${escapeHtml(s.ttd_ketua_nama || 'Pengurus KKG')}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-700/40 p-2 rounded-xl">
            <span class="block text-slate-400 text-[10px] font-medium">Pengawas Pembina</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200 truncate block">${escapeHtml(s.ttd_pengawas_nama || 'Pengawas SD')}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
        <button onclick="window.previewSertifikat('${escapeHtml(s.token_hash)}')" class="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2">
          <i class="fas fa-file-certificate"></i>
          <span>Lihat & Cetak</span>
        </button>
        <button onclick="window.copyVerifyLink('${escapeHtml(s.token_hash)}')" title="Salin Tautan Verifikasi Publik" class="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl text-xs transition">
          <i class="fas fa-share-alt"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Halaman Verifikasi Publik (Dipanggil saat Asesor/Pengguna membuka /verifikasi?token=...)
 */
export async function renderVerifikasi() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    return `
      <div class="max-w-xl mx-auto py-16 px-4 text-center">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-3xl mx-auto flex items-center justify-center text-2xl mb-4">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Token Verifikasi Tidak Ditemukan</h1>
        <p class="text-sm text-slate-500 mt-2">Silakan pindai ulang QR Code resmi yang tertera pada lembar sertifikat.</p>
        <a href="/" class="mt-6 inline-block px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm">Kembali ke Beranda</a>
      </div>
    `;
  }

  let verifyData = null;
  let isFailed = false;

  try {
    const res = await api(`/sertifikat/verify/${token}`);
    verifyData = res.data;
  } catch (e) {
    isFailed = true;
  }

  if (isFailed || !verifyData || !verifyData.valid) {
    return `
      <div class="max-w-xl mx-auto py-16 px-4 text-center animate-fade-in">
        <div class="w-20 h-20 bg-rose-100 dark:bg-rose-950/40 text-rose-600 border border-rose-300 dark:border-rose-800 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg shadow-rose-500/10">
          <i class="fas fa-times-circle"></i>
        </div>
        <h1 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Sertifikat Tidak Terverifikasi</h1>
        <p class="text-sm text-rose-600 dark:text-rose-400 font-medium mt-2">
          ${escapeHtml(verifyData?.message || 'Nomor registrasi atau token tanda tangan tidak ditemukan dalam database resmi KKG Gugus 3 Wanayasa.')}
        </p>
        <div class="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          Dokumen ini mungkin belum disahkan oleh Pengawas Pembina dan Ketua KKG, atau token telah dimodifikasi.
        </div>
        <a href="/" class="mt-6 inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition">Ke Beranda Portal</a>
      </div>
    `;
  }

  const cert = verifyData.sertifikat;

  return `
    <div class="fade-in max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <!-- Top Status Banner -->
        <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
          <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
            <i class="fas fa-shield-check"></i>
          </div>
          <span class="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold tracking-wider uppercase mb-1">
            Status: Asli & Terdaftar
          </span>
          <h2 class="text-xl font-extrabold">DOKUMEN RESMI TERVERIFIKASI</h2>
          <p class="text-xs text-white/80 mt-1">Sistem Registrasi Portofolio Digital KKG Gugus 3 Wanayasa</p>
        </div>

        <!-- Detail Verifikasi -->
        <div class="p-6 sm:p-8 space-y-6">
          <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 text-center">
            <span class="text-xs text-amber-700 dark:text-amber-400 font-medium block">Nomor Registrasi Sertifikat</span>
            <span class="font-mono font-bold text-base sm:text-lg text-amber-900 dark:text-amber-200 tracking-wider">
              ${escapeHtml(cert.nomor_sertifikat)}
            </span>
          </div>

          <!-- Peserta Info -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Identitas Peserta</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div class="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <span class="text-xs text-slate-400 block">Nama Lengkap</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(cert.nama_peserta)}</span>
              </div>
              <div class="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <span class="text-xs text-slate-400 block">NIP / NUPTK</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(cert.nip_peserta)}</span>
              </div>
              <div class="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <span class="text-xs text-slate-400 block">Unit Kerja / Pangkalan</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(cert.unit_kerja)}</span>
              </div>
            </div>
          </div>

          <!-- Kegiatan Info -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Kegiatan</h4>
            <div class="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl space-y-2 text-sm">
              <div>
                <span class="text-xs text-slate-400 block">Nama Kegiatan</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(cert.nama_kegiatan)}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-600/60 text-xs">
                <div>
                  <span class="text-slate-400 block">Tanggal Pelaksanaan</span>
                  <span class="font-semibold text-slate-700 dark:text-slate-200">${formatDate(cert.tanggal)}</span>
                </div>
                <div>
                  <span class="text-slate-400 block">Alokasi Waktu</span>
                  <span class="font-semibold text-slate-700 dark:text-slate-200">${cert.alokasi_jp} Jam Pelajaran (JP)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tanda Tangan Ganda Sah -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Otoritas Pengesahan (Dual Sign-Off)</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl">
                <div class="flex items-center gap-2 mb-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                  <i class="fas fa-signature"></i>
                  <span>Ketua KKG Gugus 3</span>
                </div>
                <div class="font-semibold text-slate-800 dark:text-slate-100">${escapeHtml(cert.disahkan_oleh.ketua_kkg.nama)}</div>
                <div class="text-[11px] text-slate-500">NIP: ${escapeHtml(cert.disahkan_oleh.ketua_kkg.nip)}</div>
                <div class="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <i class="fas fa-check-double mr-1"></i>TTD Digital Sah (${formatDateTime(cert.disahkan_oleh.ketua_kkg.waktu_ttd)})
                </div>
              </div>

              <div class="p-3.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/50 rounded-2xl">
                <div class="flex items-center gap-2 mb-1.5 text-teal-700 dark:text-teal-300 font-bold">
                  <i class="fas fa-stamp"></i>
                  <span>Pengawas SD Pembina</span>
                </div>
                <div class="font-semibold text-slate-800 dark:text-slate-100">${escapeHtml(cert.disahkan_oleh.pengawas_pembina.nama)}</div>
                <div class="text-[11px] text-slate-500">NIP: ${escapeHtml(cert.disahkan_oleh.pengawas_pembina.nip)}</div>
                <div class="mt-2 text-[10px] text-teal-600 dark:text-teal-400">
                  <i class="fas fa-check-double mr-1"></i>Pengesahan Sah (${formatDateTime(cert.disahkan_oleh.pengawas_pembina.waktu_ttd)})
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400">
          Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Global Actions & Modal Handlers
// -------------------------------------------------------------

window.previewSertifikat = async function (tokenHash) {
  try {
    const res = await api(`/sertifikat/detail/${tokenHash}`);
    const data = res.data;
    if (!data) throw new Error('Data sertifikat tidak dapat dimuat');

    let modal = document.getElementById('modal-sertifikat-preview');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-sertifikat-preview';
      modal.className = 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in';
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[92vh]">
          <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-sm">
                <i class="fas fa-file-certificate"></i>
              </span>
              <div>
                <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">Pratinjau Dokumen Sertifikat Resmi</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Standar 2 Halaman (Piagam Depan + Struktur JP)</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.printSertifikat()" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-teal-600/20 flex items-center gap-2 transition">
                <i class="fas fa-print"></i>
                <span class="hidden sm:inline">Cetak / Simpan PDF</span>
              </button>
              <button onclick="window.closeSertifikatModal()" class="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="p-4 sm:p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center">
            <div id="sertifikat-paper-content" class="w-full max-w-4xl space-y-8"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const container = document.getElementById('sertifikat-paper-content');
    if (container) {
      container.innerHTML = buildSertifikatPaperHTML(data);
    }

    modal.classList.remove('hidden');
  } catch (e) {
    showToast(e.message || 'Gagal memuat pratinjau sertifikat', 'error');
  }
};

window.closeSertifikatModal = function () {
  const modal = document.getElementById('modal-sertifikat-preview');
  if (modal) modal.classList.add('hidden');
};

window.printSertifikat = function () {
  window.print();
};

window.copyVerifyLink = function (tokenHash) {
  const url = `${window.location.origin}/verifikasi?token=${encodeURIComponent(tokenHash)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Tautan verifikasi publik berhasil disalin ke clipboard!', 'success');
  }).catch(() => {
    prompt('Salin tautan verifikasi:', url);
  });
};

/**
 * Generator HTML Cetak Kertas 2 Halaman
 */
function buildSertifikatPaperHTML(data) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.verify_url)}`;

  return `
    <style>
      @media print {
        body * { visibility: hidden !important; }
        #sertifikat-paper-content, #sertifikat-paper-content * { visibility: visible !important; }
        #sertifikat-paper-content {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .page-break {
          page-break-after: always !important;
          break-after: page !important;
        }
        .no-print { display: none !important; }
      }

      .certificate-page {
        width: 100%;
        background: #ffffff;
        color: #1e293b;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        border: 1px solid #cbd5e1;
        position: relative;
        box-sizing: border-box;
      }
    </style>

    <!-- ================= HALAMAN 1: PIAGAM PENGHARGAAN ================= -->
    <div class="certificate-page p-8 sm:p-12 rounded-2xl page-break relative overflow-hidden bg-[#fffdfa] border-8 border-double border-[#b4975a]">
      <!-- Ornamen Sudut Klasik -->
      <div class="absolute top-2 left-2 w-10 h-10 border-t-4 border-l-4 border-[#b4975a]"></div>
      <div class="absolute top-2 right-2 w-10 h-10 border-t-4 border-r-4 border-[#b4975a]"></div>
      <div class="absolute bottom-2 left-2 w-10 h-10 border-b-4 border-l-4 border-[#b4975a]"></div>
      <div class="absolute bottom-2 right-2 w-10 h-10 border-b-4 border-r-4 border-[#b4975a]"></div>

      <div class="text-center">
        <!-- Logo & Header Instansi -->
        <div class="flex items-center justify-center gap-4 mb-2">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shadow-sm">
            <svg viewBox="0 0 100 100" class="w-12 h-12 text-[#1e3a8a] fill-current">
              <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="none" stroke="#b4975a" stroke-width="4"/>
              <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="#1e3a8a" opacity="0.15"/>
              <circle cx="50" cy="50" r="15" fill="#b4975a"/>
            </svg>
          </div>
        </div>

        <h3 class="text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-600">
          PEMERINTAH KABUPATEN PURWAKARTA · DINAS PENDIDIKAN
        </h3>
        <h2 class="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-800">
          KELOMPOK KERJA GURU (KKG) GUGUS 3 KECAMATAN WANAYASA
        </h2>
        <p class="text-[11px] text-slate-500">
          Sekretariat: SDN 2 Nangerang, Kec. Wanayasa, Kab. Purwakarta · kkg-wanayasa.app
        </p>

        <!-- Garis Pemisah Emas -->
        <div class="w-full h-1 bg-gradient-to-r from-transparent via-[#b4975a] to-transparent my-4"></div>

        <!-- Judul Piagam -->
        <h1 class="text-3xl sm:text-4xl font-serif font-black tracking-widest text-[#0f172a] uppercase mt-2">
          SERTIFIKAT
        </h1>
        <p class="text-xs sm:text-sm font-mono text-slate-700 tracking-wider mt-1">
          Nomor: <strong>${escapeHtml(data.nomor_sertifikat)}</strong>
        </p>

        <p class="text-xs sm:text-sm text-slate-600 italic mt-6">
          Diberikan dengan hormat kepada:
        </p>

        <!-- Nama Guru -->
        <div class="my-3">
          <h2 class="text-2xl sm:text-3xl font-serif font-bold text-[#1e3a8a] underline decoration-[#b4975a] decoration-2 underline-offset-8">
            ${escapeHtml(data.nama_guru)}
          </h2>
          <p class="text-xs sm:text-sm text-slate-700 mt-2 font-medium">
            NIP/NUPTK: ${escapeHtml(data.nip_guru || '-')} · Unit Kerja: <strong>${escapeHtml(data.sekolah_guru || '-')}</strong>
          </p>
        </div>

        <p class="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed mt-4">
          Sebagai <strong>PESERTA AKTIF</strong> dalam kegiatan Workshop Pengembangan Keprofesian Berkelanjutan (PKB) dengan topik:
        </p>

        <!-- Nama Acara -->
        <div class="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl max-w-2xl mx-auto my-3">
          <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            "${escapeHtml(data.nama_kegiatan)}"
          </h3>
        </div>

        <p class="text-xs text-slate-600">
          Diselenggarakan pada tanggal <strong>${formatDate(data.tanggal)}</strong> bertempat di <strong>${escapeHtml(data.tempat || 'Gugus 3 Wanayasa')}</strong> dengan total beban belajar setara <strong>${data.alokasi_jp || 4} Jam Pelajaran (JP)</strong>.
        </p>

        <!-- Tanda Tangan Ganda Berdampingan -->
        <div class="grid grid-cols-2 gap-8 mt-8 sm:mt-12 text-center text-xs sm:text-sm">
          <!-- Kolom Ketua KKG -->
          <div class="flex flex-col items-center">
            <span class="text-slate-500">Wanayasa, ${formatDate(data.tanggal)}</span>
            <span class="font-bold text-slate-800 mt-0.5">Ketua KKG Gugus 3 Wanayasa</span>
            
            <!-- Area Tanda Tangan & Stempel -->
            <div class="relative h-20 w-44 flex items-center justify-center my-1">
              <!-- Stempel Digital Bundar -->
              <div class="absolute inset-0 border-2 border-dashed border-[#1e40af]/60 rounded-full flex flex-col items-center justify-center rotate-[-12deg] text-[9px] font-bold text-[#1e40af]/80 uppercase pointer-events-none p-1">
                <span>KKG GUGUS 3</span>
                <span class="text-[7px]">WANAYASA</span>
                <span class="text-[7px]">PURWAKARTA</span>
              </div>
              <span class="font-serif italic text-lg text-slate-700 tracking-wider">
                ${escapeHtml(data.ttd_ketua_nama || 'Ketua KKG')}
              </span>
            </div>

            <strong class="font-bold text-slate-900 border-b border-slate-800 pb-0.5">${escapeHtml(data.ttd_ketua_nama || 'Ketua KKG')}</strong>
            <span class="text-[11px] text-slate-600 mt-0.5">NIP. ${escapeHtml(data.ttd_ketua_nip || '-')}</span>
          </div>

          <!-- Kolom Pengawas Pembina -->
          <div class="flex flex-col items-center">
            <span class="text-slate-500">Mengetahui / Mengesahkan,</span>
            <span class="font-bold text-slate-800 mt-0.5">Pengawas SD Pembina Gugus 3</span>

            <!-- Area Tanda Tangan -->
            <div class="relative h-20 w-44 flex items-center justify-center my-1">
              <span class="font-serif italic text-lg text-[#1e3a8a] tracking-wider font-semibold">
                ${escapeHtml(data.ttd_pengawas_nama || 'Pengawas Pembina')}
              </span>
            </div>

            <strong class="font-bold text-slate-900 border-b border-slate-800 pb-0.5">${escapeHtml(data.ttd_pengawas_nama || 'Pengawas Pembina')}</strong>
            <span class="text-[11px] text-slate-600 mt-0.5">NIP. ${escapeHtml(data.ttd_pengawas_nip || '-')}</span>
          </div>
        </div>

        <!-- Footer Barcode & Otentikasi -->
        <div class="mt-8 pt-4 border-t border-[#b4975a]/40 flex items-center justify-between text-left">
          <div class="flex items-center gap-3">
            <img src="${qrUrl}" alt="QR Verifikasi" class="w-14 h-14 border border-slate-300 p-0.5 rounded bg-white shadow-sm">
            <div class="text-[10px] text-slate-500 leading-tight">
              <span class="font-bold text-slate-700 block">Verifikasi Keaslian Dokumen:</span>
              <span>Pindai QR code atau akses tautan resmi:</span><br>
              <span class="font-mono text-[#1e3a8a]">${escapeHtml(data.verify_url)}</span>
            </div>
          </div>
          <div class="text-right text-[10px] text-slate-400">
            <span>Security Hash:</span><br>
            <span class="font-mono text-slate-600">${escapeHtml(data.token_hash?.slice(0, 16))}...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= HALAMAN 2: STRUKTUR PROGRAM & ALOKASI WAKTU ================= -->
    <div class="certificate-page p-8 sm:p-12 rounded-2xl bg-white border border-slate-300 text-slate-800">
      <div class="text-center mb-6">
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700">LAMPIRAN STRUKTUR PROGRAM & ALOKASI WAKTU</h3>
        <p class="text-xs text-slate-500">Sertifikat Nomor: ${escapeHtml(data.nomor_sertifikat)}</p>
      </div>

      <!-- Identitas Singkat Peserta -->
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-xs sm:text-sm grid grid-cols-2 gap-2">
        <div><span class="text-slate-500">Nama Peserta:</span> <strong>${escapeHtml(data.nama_guru)}</strong></div>
        <div><span class="text-slate-500">NIP:</span> <strong>${escapeHtml(data.nip_guru || '-')}</strong></div>
        <div><span class="text-slate-500">Pangkalan:</span> <strong>${escapeHtml(data.sekolah_guru || '-')}</strong></div>
        <div><span class="text-slate-500">Kegiatan:</span> <strong>${escapeHtml(data.nama_kegiatan)}</strong></div>
      </div>

      <!-- Tabel Struktur Materi -->
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-xs sm:text-sm border-collapse border border-slate-300">
          <thead>
            <tr class="bg-slate-100 text-slate-800">
              <th class="border border-slate-300 px-3 py-2.5 text-center w-12">No</th>
              <th class="border border-slate-300 px-4 py-2.5 text-left">Materi Pokok / Pokok Bahasan</th>
              <th class="border border-slate-300 px-4 py-2.5 text-center w-28">Alokasi Waktu (JP)</th>
            </tr>
          </thead>
          <tbody>
            ${(data.materi_list || []).map((m, idx) => `
              <tr class="border border-slate-300">
                <td class="border border-slate-300 px-3 py-2.5 text-center">${idx + 1}</td>
                <td class="border border-slate-300 px-4 py-2.5">${escapeHtml(m.materi)}</td>
                <td class="border border-slate-300 px-4 py-2.5 text-center font-semibold">${m.jp} JP</td>
              </tr>
            `).join('')}
            <tr class="bg-slate-50 font-bold border border-slate-300">
              <td colspan="2" class="border border-slate-300 px-4 py-2.5 text-right uppercase">Total Beban Waktu</td>
              <td class="border border-slate-300 px-4 py-2.5 text-center text-[#1e3a8a]">${data.alokasi_jp || 4} JP</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Narasumber & Catatan Refleksi -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-8">
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <span class="font-bold text-slate-700 block mb-1">Narasumber / Fasilitator:</span>
          <span>${escapeHtml(data.narasumber || 'Pengawas Pembina & Tim Fasilitator KKG Gugus 3')}</span>
        </div>
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <span class="font-bold text-slate-700 block mb-1">Bentuk Evaluasi:</span>
          <span>Mikro-Refleksi Pembelajaran Berkelanjutan & RTL Mandiri Kelas</span>
        </div>
      </div>

      <!-- TTD Pengesahan Halaman 2 -->
      <div class="flex justify-end text-xs sm:text-sm">
        <div class="text-center w-64">
          <span class="text-slate-500">Wanayasa, ${formatDate(data.tanggal)}</span><br>
          <span class="font-bold text-slate-800">Pengawas SD Pembina Gugus 3</span>
          <div class="h-20 flex items-center justify-center">
            <span class="font-serif italic text-base text-[#1e3a8a] font-semibold">${escapeHtml(data.ttd_pengawas_nama || 'Pengawas Pembina')}</span>
          </div>
          <strong class="font-bold text-slate-900 border-b border-slate-800 pb-0.5">${escapeHtml(data.ttd_pengawas_nama || 'Pengawas Pembina')}</strong><br>
          <span class="text-[11px] text-slate-600">NIP. ${escapeHtml(data.ttd_pengawas_nip || '-')}</span>
        </div>
      </div>
    </div>
  `;
}
