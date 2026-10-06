import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, formatDateTime, escapeHtml, showToast } from '../utils.js';
import { renderLoadFailure, renderEmptyState } from '../ui-load-state.js';

export async function renderAbsensi() {
  let kegiatan = [];
  let loadFailed = false;
  try { const res = await api('/absensi/kegiatan'); kegiatan = res.data || []; } catch (e) { loadFailed = true; }

  const isSigner = ['admin', 'pengawas', 'operator', 'super_admin'].includes(state.user?.role || '');

  return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <i class="fas fa-calendar-check text-purple-500"></i>
          <span>Presensi & Sertifikat Kegiatan</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Pencatatan kehadiran, mikro-refleksi pembelajaran, dan penerbitan sertifikat resmi bertanda tangan ganda Ketua KKG & Pengawas.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        ${state.user ? `<button onclick="showQRScanner()" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition flex items-center gap-1.5"><i class="fas fa-qrcode"></i><span>Scan QR</span></button>` : ''}
        <button onclick="showRekapAbsensi()" class="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition flex items-center gap-1.5"><i class="fas fa-chart-bar"></i><span>Rekap</span></button>
        <a href="/sertifikat" onclick="event.preventDefault(); window.navigate('sertifikat')" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 shadow-sm">
          <i class="fas fa-award"></i>
          <span>Sertifikat Saya</span>
        </a>
        ${state.user?.role === 'admin' ? `<button onclick="showAddKegiatan()" class="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition flex items-center gap-1.5"><i class="fas fa-plus"></i><span>Kegiatan Baru</span></button>` : ''}
      </div>
    </div>

    <!-- QR Scanner Modal -->
    <div id="qr-scanner-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-qrcode text-green-500 mr-2"></i>Scan QR Absensi</h3>
          <button onclick="closeQRScanner()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div id="qr-reader" class="mb-4 rounded-xl overflow-hidden"></div>
        <div id="qr-result" class="hidden p-4 bg-green-50 dark:bg-green-900/30 rounded-xl"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center">Arahkan kamera ke QR code yang ditampilkan admin</p>
      </div>
    </div>

    <!-- QR Display Modal -->
    <div id="qr-display-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-qrcode text-purple-500 mr-2"></i>QR Code Absensi</h3>
          <button onclick="closeQRDisplay()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div id="qr-display-content" class="text-center"></div>
      </div>
    </div>

    <div id="add-kegiatan-modal" class="hidden"></div>
    <div id="rekap-container" class="hidden mb-8"></div>

    <!-- List Kegiatan Presensi -->
    <div class="space-y-4">
      ${loadFailed ? renderLoadFailure('Kegiatan presensi belum dapat dimuat', 'absensi') : kegiatan.length > 0 ? kegiatan.map(k => `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-500 transition">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">${escapeHtml(k.nama_kegiatan)}</h3>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <i class="fas fa-clock mr-1"></i>${k.alokasi_jp || 4} JP
                </span>
                ${k.ttd_ketua_at ? `<span class="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><i class="fas fa-check mr-1"></i>TTD Ketua</span>` : ''}
                ${k.ttd_pengawas_at ? `<span class="text-[11px] px-2 py-0.5 rounded-full font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"><i class="fas fa-check-double mr-1"></i>Sah Pengawas</span>` : ''}
              </div>

              <div class="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span><i class="fas fa-calendar mr-1 text-purple-400"></i>${formatDate(k.tanggal)}</span>
                <span><i class="fas fa-clock mr-1 text-blue-400"></i>${escapeHtml(k.waktu_mulai || '')} - ${escapeHtml(k.waktu_selesai || '')}</span>
                <span><i class="fas fa-map-marker-alt mr-1 text-red-400"></i>${escapeHtml(k.tempat || '-')}</span>
                ${k.narasumber ? `<span><i class="fas fa-user-tie mr-1 text-emerald-400"></i>${escapeHtml(k.narasumber)}</span>` : ''}
              </div>

              ${k.deskripsi ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${escapeHtml(k.deskripsi)}</p>` : ''}
            </div>

            <div class="flex flex-wrap items-center gap-2">
              ${state.user?.role === 'admin' ? `<button onclick="showQRCode(${k.id})" class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition" title="Tampilkan QR Code Absensi"><i class="fas fa-qrcode mr-1"></i>QR</button>` : ''}
              ${state.user ? `<button onclick="checkinAbsensi(${k.id})" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5"><i class="fas fa-check"></i><span>Catat kehadiran</span></button>` : ''}
              ${state.user ? `<button onclick="openModalRefleksi(${k.id}, '${escapeHtml(k.nama_kegiatan)}')" class="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"><i class="fas fa-certificate"></i><span>Sertifikat</span></button>` : ''}
              ${isSigner ? `<button onclick="openModalSignKegiatan(${k.id}, '${escapeHtml(k.nama_kegiatan)}')" class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5"><i class="fas fa-stamp"></i><span>Pengesahan</span></button>` : ''}
              <button onclick="viewAbsensi(${k.id}, '${escapeHtml(k.nama_kegiatan)}')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium dark:text-gray-200 transition"><i class="fas fa-list mr-1"></i>Daftar Hadir</button>
            </div>
          </div>
        </div>
      `).join('') : renderEmptyState('Belum ada kegiatan presensi', 'Pengurus dapat menambahkan Kegiatan Baru. Setelah kegiatan tersedia, anggota dapat mencatat kehadiran atau memindai QR.')}
    </div>

    <!-- Container Detail Absensi -->
    <div id="absensi-detail" class="hidden mt-8"></div>

    <!-- Modal Mikro-Refleksi Pembelajaran & Sertifikat Peserta -->
    <div id="modal-refleksi-presensi" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div id="modal-refleksi-content" class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-700 my-auto">
        <!-- Render dinamis di openModalRefleksi -->
      </div>
    </div>

    <!-- Modal Pengesahan Tanda Tangan Ganda (Ketua KKG & Pengawas) -->
    <div id="modal-sign-kegiatan" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div id="modal-sign-content" class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-700 my-auto">
        <!-- Render dinamis di openModalSignKegiatan -->
      </div>
    </div>
  </div>`;
}

// -------------------------------------------------------------
// Tambah Kegiatan Baru (Admin)
// -------------------------------------------------------------
window.showAddKegiatan = function () {
  const container = document.getElementById('add-kegiatan-modal');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-purple-200 dark:border-purple-800 mb-6">
      <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <i class="fas fa-plus-circle text-purple-500"></i>
        <span>Tambah Kegiatan Baru</span>
      </h3>
      <form onsubmit="addKegiatan(event)" class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <input type="text" name="nama_kegiatan" required placeholder="Nama Kegiatan / Workshop KKG" class="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Tanggal Pelaksanaan</label>
          <input type="date" name="tanggal" required class="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Alokasi Waktu (JP)</label>
          <input type="number" name="alokasi_jp" value="4" min="1" max="64" required placeholder="4" class="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
        </div>
        <input type="text" name="tempat" placeholder="Tempat (e.g. SDN 2 Nangerang)" class="px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
        <input type="text" name="narasumber" placeholder="Narasumber / Fasilitator" class="px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
        <input type="text" name="waktu_mulai" placeholder="Waktu Mulai (09:00)" class="px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
        <input type="text" name="waktu_selesai" placeholder="Waktu Selesai (12:00)" class="px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
        <div class="md:col-span-2">
          <textarea name="deskripsi" placeholder="Deskripsi materi atau tujuan kegiatan (opsional)" rows="2" class="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"></textarea>
        </div>
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" class="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition shadow-sm">Simpan Kegiatan</button>
          <button type="button" onclick="document.getElementById('add-kegiatan-modal').classList.add('hidden')" class="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium dark:text-gray-300">Batal</button>
        </div>
      </form>
    </div>`;
}

window.addKegiatan = async function (e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/absensi/kegiatan', {
      method: 'POST', body: {
        nama_kegiatan: form.nama_kegiatan.value,
        tanggal: form.tanggal.value,
        alokasi_jp: form.alokasi_jp.value ? parseInt(form.alokasi_jp.value, 10) : 4,
        narasumber: form.narasumber?.value || '',
        waktu_mulai: form.waktu_mulai.value,
        waktu_selesai: form.waktu_selesai.value,
        tempat: form.tempat.value,
        deskripsi: form.deskripsi.value,
      }
    });
    showToast('Kegiatan berhasil ditambahkan!', 'success');
    window.location.reload();
  } catch (e) { showToast(e.message, 'error'); }
}

// -------------------------------------------------------------
// Check-in Presensi Kehadiran
// -------------------------------------------------------------
window.checkinAbsensi = async function (kegiatanId) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
      <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 text-center"><i class="fas fa-calendar-check text-purple-500 mr-2"></i>Pilih Status Kehadiran</h3>
      <div class="space-y-3 mb-4">
        <button onclick="submitCheckin(${kegiatanId}, 'hadir')" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
          <i class="fas fa-check"></i>Hadir di Tempat
        </button>
        <button onclick="submitCheckin(${kegiatanId}, 'izin')" class="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
          <i class="fas fa-file-alt"></i>Izin
        </button>
        <button onclick="submitCheckin(${kegiatanId}, 'sakit')" class="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
          <i class="fas fa-medkit"></i>Sakit
        </button>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Keterangan (opsional)</label>
        <input type="text" id="checkin-keterangan" placeholder="Catatan atau alasan..." class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm">
      </div>
      <button onclick="this.closest('.fixed').remove()" class="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium">Batal</button>
    </div>
  `;
  document.body.appendChild(modal);
}

window.submitCheckin = async function (kegiatanId, status) {
  const keterangan = document.getElementById('checkin-keterangan')?.value || '';
  try {
    await api('/absensi/checkin', {
      method: 'POST',
      body: { kegiatan_id: kegiatanId, status, keterangan }
    });
    document.querySelector('.fixed.inset-0')?.remove();
    showToast(status === 'hadir' ? 'Check-in berhasil! Mari lengkapi mikro-refleksi sertifikat.' : `Status ${status} dicatat!`, 'success');
    if (status === 'hadir') {
      window.openModalRefleksi(kegiatanId);
    }
  } catch (e) { showToast(e.message, 'error'); }
}

// -------------------------------------------------------------
// Modal Mikro-Refleksi Pembelajaran (Exit Ticket Peserta)
// -------------------------------------------------------------
window.openModalRefleksi = async function (kegiatanId, namaKegiatan = 'Kegiatan KKG') {
  const modal = document.getElementById('modal-refleksi-presensi');
  const content = document.getElementById('modal-refleksi-content');
  modal.classList.remove('hidden');

  content.innerHTML = `
    <div class="text-center py-8">
      <div class="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
      <p class="text-sm text-slate-500">Memeriksa status kehadiran & sertifikat...</p>
    </div>
  `;

  try {
    const res = await api(`/sertifikat/kegiatan/${kegiatanId}/status`);
    const data = res.data;
    const kegiatan = data.kegiatan;
    const cert = data.sertifikat;

    content.innerHTML = `
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-6">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-lg">
            <i class="fas fa-certificate"></i>
          </span>
          <div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">Mikro-Refleksi & Sertifikat</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">${escapeHtml(kegiatan.nama_kegiatan)}</p>
          </div>
        </div>
        <button onclick="document.getElementById('modal-refleksi-presensi').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center">
          <i class="fas fa-times text-lg"></i>
        </button>
      </div>

      <!-- Status Bar -->
      <div class="grid grid-cols-2 gap-3 mb-6 text-xs">
        <div class="p-3 rounded-2xl ${data.has_attended ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'}">
          <span class="block text-[11px] font-semibold opacity-75">Status Presensi</span>
          <strong class="font-bold flex items-center gap-1.5 mt-0.5">
            <i class="fas ${data.has_attended ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            ${data.has_attended ? 'Tercatat Hadir' : 'Belum Check-in Hadir'}
          </strong>
        </div>

        <div class="p-3 rounded-2xl ${data.is_fully_signed ? 'bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'}">
          <span class="block text-[11px] font-semibold opacity-75">Pengesahan Kedinasan</span>
          <strong class="font-bold flex items-center gap-1.5 mt-0.5">
            <i class="fas ${data.is_fully_signed ? 'fa-stamp' : 'fa-hourglass-half'}"></i>
            ${data.is_fully_signed ? 'Disahkan Pengawas & Ketua' : 'Menunggu Pengesahan'}
          </strong>
        </div>
      </div>

      ${data.can_download ? `
        <!-- Sertifikat Siap -->
        <div class="bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/20 dark:to-emerald-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 text-center mb-6">
          <div class="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto text-xl mb-2 shadow-md shadow-amber-500/20">
            <i class="fas fa-award"></i>
          </div>
          <h4 class="font-extrabold text-slate-800 dark:text-slate-100 text-base">Sertifikat Resmi Telah Diterbitkan!</h4>
          <p class="text-xs font-mono text-amber-800 dark:text-amber-300 font-bold mt-1">Nomor: ${escapeHtml(cert.nomor_sertifikat)}</p>
          <div class="flex flex-col sm:flex-row gap-2.5 mt-4 justify-center">
            <button onclick="document.getElementById('modal-refleksi-presensi').classList.add('hidden'); window.previewSertifikat('${escapeHtml(cert.token_hash)}')" class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2">
              <i class="fas fa-file-certificate"></i>
              <span>Buka & Cetak Sertifikat</span>
            </button>
            <button onclick="window.copyVerifyLink('${escapeHtml(cert.token_hash)}')" class="px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2">
              <i class="fas fa-link"></i>
              <span>Salin Link Verifikasi</span>
            </button>
          </div>
        </div>
      ` : ''}

      ${!data.has_attended ? `
        <div class="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl text-center text-xs text-slate-500 mb-4">
          Anda belum tercatat hadir pada kegiatan ini. Silakan catat kehadiran terlebih dahulu atau pindai QR Code di layar aula KKG.
        </div>
      ` : `
        <!-- Form Exit Ticket Mikro-Refleksi -->
        <form onsubmit="submitRefleksi(event, ${kegiatanId})" class="space-y-4">
          <div class="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
            <strong class="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Syarat Penerbitan Sertifikat:</strong>
            Isi 3 butir refleksi ringkas (Exit Ticket) di bawah ini sebagai bukti keterlibatan aktif dan pemahaman esensial Anda.
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              1. Konsep atau Praktik Baik Baru Apa yang Anda Dapatkan Hari Ini? <span class="text-rose-500">*</span>
            </label>
            <textarea name="refleksi_konsep" required rows="2" placeholder="Contoh: Memahami diferensiasi proses dan perumusan ATP berbasis asesmen awal..." class="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white text-xs leading-relaxed">${escapeHtml(cert?.refleksi_konsep || '')}</textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              2. Tantangan Nyata Apa yang Mungkin Dihadapi di Kelas Anda? <span class="text-rose-500">*</span>
            </label>
            <textarea name="refleksi_tantangan" required rows="2" placeholder="Contoh: Mengakomodasi keragaman murid dalam kelas besar dan pembagian waktu..." class="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white text-xs leading-relaxed">${escapeHtml(cert?.refleksi_tantangan || '')}</textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              3. Rencana Aksi Nyata Apa yang Akan Anda Terapkan Pekan Depan? <span class="text-rose-500">*</span>
            </label>
            <textarea name="refleksi_rencana_aksi" required rows="2" placeholder="Contoh: Melakukan diagnostik minat belajar murid dan menyusun modul ajar kelompok..." class="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white text-xs leading-relaxed">${escapeHtml(cert?.refleksi_rencana_aksi || '')}</textarea>
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('modal-refleksi-presensi').classList.add('hidden')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Tutup</button>
            <button type="submit" class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5">
              <i class="fas fa-save"></i>
              <span>Simpan Mikro-Refleksi</span>
            </button>
          </div>
        </form>
      `}
    `;
  } catch (e) {
    content.innerHTML = `
      <div class="text-center py-6 text-rose-500 text-sm">
        <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
        <p>${escapeHtml(e.message || 'Gagal memuat status kegiatan')}</p>
        <button onclick="document.getElementById('modal-refleksi-presensi').classList.add('hidden')" class="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-xs">Tutup</button>
      </div>
    `;
  }
};

window.submitRefleksi = async function (e, kegiatanId) {
  e.preventDefault();
  const form = e.target;
  try {
    const res = await api('/sertifikat/refleksi', {
      method: 'POST',
      body: {
        kegiatan_id: kegiatanId,
        refleksi_konsep: form.refleksi_konsep.value,
        refleksi_tantangan: form.refleksi_tantangan.value,
        refleksi_rencana_aksi: form.refleksi_rencana_aksi.value
      }
    });

    showToast(res.message || 'Mikro-refleksi berhasil disimpan!', 'success');
    window.openModalRefleksi(kegiatanId);
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan refleksi', 'error');
  }
};

// -------------------------------------------------------------
// Modal Pengesahan Digital Ganda (Ketua KKG & Pengawas Pembina)
// -------------------------------------------------------------
window.openModalSignKegiatan = async function (kegiatanId, namaKegiatan = 'Kegiatan KKG') {
  const modal = document.getElementById('modal-sign-kegiatan');
  const content = document.getElementById('modal-sign-content');
  modal.classList.remove('hidden');

  content.innerHTML = `
    <div class="text-center py-8">
      <div class="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
      <p class="text-sm text-slate-500">Memuat data pengesahan kegiatan...</p>
    </div>
  `;

  try {
    const res = await api(`/sertifikat/kegiatan/${kegiatanId}/status`);
    const k = res.data.kegiatan;
    const signers = res.data.default_signers || {};

    const defaultKetuaNama = k.ttd_ketua_nama || signers.ketua?.nama || state.settings?.nama_ketua || state.user?.nama || '';
    const defaultKetuaNip = k.ttd_ketua_nip || signers.ketua?.nip || state.settings?.nip_ketua || state.user?.nip || '';
    const defaultPengawasNama = k.ttd_pengawas_nama || signers.pengawas?.nama || state.settings?.pengawas_nama || '';
    const defaultPengawasNip = k.ttd_pengawas_nip || signers.pengawas?.nip || state.settings?.pengawas_nip || '';

    content.innerHTML = `
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-6">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center text-lg">
            <i class="fas fa-stamp"></i>
          </span>
          <div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">Pengesahan Tanda Tangan Ganda</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">${escapeHtml(k.nama_kegiatan)}</p>
          </div>
        </div>
        <button onclick="document.getElementById('modal-sign-kegiatan').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center">
          <i class="fas fa-times text-lg"></i>
        </button>
      </div>

      <div class="space-y-6">
        <!-- 1. Ketua KKG Card -->
        <div class="p-4 rounded-2xl border ${k.ttd_ketua_at ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</span>
              <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm">Ketua KKG Gugus 3 (Pelaksana)</h4>
            </div>
            ${k.ttd_ketua_at ? `<span class="text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full"><i class="fas fa-check mr-1"></i>Sudah TTD</span>` : `<span class="text-[11px] text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">Belum TTD</span>`}
          </div>

          ${k.ttd_ketua_at ? `
            <div class="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-0.5">
              <div>Penanda Tangan: <strong>${escapeHtml(k.ttd_ketua_nama)}</strong></div>
              <div>NIP: ${escapeHtml(k.ttd_ketua_nip || '-')}</div>
              <div class="text-[10px] text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${formatDateTime(k.ttd_ketua_at)} (Presensi Terkunci)</div>
            </div>
          ` : `
            <form onsubmit="submitSignKetua(event, ${kegiatanId})" class="mt-3 space-y-3">
              <div class="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Nama & NIP terisi otomatis dari Organisasi</span>
                <span class="text-[10px] text-teal-600 font-semibold"><i class="fas fa-magic mr-1"></i>Design by System</span>
              </div>
              <input type="text" name="ttd_nama" required placeholder="Nama Lengkap Ketua KKG & Gelar" value="${escapeHtml(defaultKetuaNama)}" class="w-full px-3 py-2 border rounded-xl text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white">
              <input type="text" name="ttd_nip" placeholder="NIP Ketua KKG" value="${escapeHtml(defaultKetuaNip)}" class="w-full px-3 py-2 border rounded-xl text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white">
              <button type="submit" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
                <i class="fas fa-lock mr-1"></i>Kunci Presensi & Bubuhkan TTD Ketua KKG
              </button>
            </form>
          `}
        </div>

        <!-- 2. Pengawas Pembina Card -->
        <div class="p-4 rounded-2xl border ${k.ttd_pengawas_at ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">2</span>
              <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm">Pengawas SD Pembina (Pengesahan)</h4>
            </div>
            ${k.ttd_pengawas_at ? `<span class="text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full"><i class="fas fa-check-double mr-1"></i>Sudah Sah</span>` : `<span class="text-[11px] text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">Belum Sah</span>`}
          </div>

          ${k.ttd_pengawas_at ? `
            <div class="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-0.5">
              <div>Pengawas Pembina: <strong>${escapeHtml(k.ttd_pengawas_nama)}</strong></div>
              <div>NIP: ${escapeHtml(k.ttd_pengawas_nip || '-')}</div>
              <div class="text-[10px] text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${formatDateTime(k.ttd_pengawas_at)}</div>
            </div>
          ` : `
            <form onsubmit="submitSignPengawas(event, ${kegiatanId})" class="mt-3 space-y-3">
              <div class="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Nama & NIP Pengawas terisi otomatis dari Organisasi</span>
                <span class="text-[10px] text-teal-600 font-semibold"><i class="fas fa-magic mr-1"></i>Design by System</span>
              </div>
              <input type="text" name="ttd_nama" required placeholder="Nama Lengkap Pengawas Pembina & Gelar" value="${escapeHtml(defaultPengawasNama)}" class="w-full px-3 py-2 border rounded-xl text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white">
              <input type="text" name="ttd_nip" placeholder="NIP Pengawas Pembina" value="${escapeHtml(defaultPengawasNip)}" class="w-full px-3 py-2 border rounded-xl text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white">
              <button type="submit" class="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
                <i class="fas fa-stamp mr-1"></i>Sahkan & Terbitkan Sertifikat Resmi
              </button>
            </form>
          `}
        </div>

        <button onclick="document.getElementById('modal-sign-kegiatan').classList.add('hidden')" class="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Tutup</button>
      </div>
    `;
  } catch (e) {
    content.innerHTML = `
      <div class="text-center py-6 text-rose-500 text-sm">
        <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
        <p>${escapeHtml(e.message || 'Gagal memuat panel pengesahan')}</p>
        <button onclick="document.getElementById('modal-sign-kegiatan').classList.add('hidden')" class="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-xs">Tutup</button>
      </div>
    `;
  }
};

window.submitSignKetua = async function (e, kegiatanId) {
  e.preventDefault();
  const form = e.target;
  try {
    const res = await api(`/sertifikat/kegiatan/${kegiatanId}/sign-ketua`, {
      method: 'POST',
      body: {
        ttd_nama: form.ttd_nama.value,
        ttd_nip: form.ttd_nip?.value || ''
      }
    });
    showToast(res.message || 'Tanda tangan Ketua KKG berhasil dibubuhkan!', 'success');
    window.openModalSignKegiatan(kegiatanId);
  } catch (err) {
    showToast(err.message || 'Gagal menandatangani kegiatan', 'error');
  }
};

window.submitSignPengawas = async function (e, kegiatanId) {
  e.preventDefault();
  const form = e.target;
  try {
    const res = await api(`/sertifikat/kegiatan/${kegiatanId}/sign-pengawas`, {
      method: 'POST',
      body: {
        ttd_nama: form.ttd_nama.value,
        ttd_nip: form.ttd_nip?.value || ''
      }
    });
    showToast(res.message || 'Sertifikat resmi berhasil disahkan oleh Pengawas!', 'success');
    window.openModalSignKegiatan(kegiatanId);
  } catch (err) {
    showToast(err.message || 'Gagal mengesahkan kegiatan', 'error');
  }
};

// -------------------------------------------------------------
// Legacy Functions (Daftar Hadir, Rekap, QR Code Scanner/Display)
// -------------------------------------------------------------
window.viewAbsensi = async function (kegiatanId, nama) {
  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/absensi`);
    const container = document.getElementById('absensi-detail');
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <i class="fas fa-list text-purple-500"></i>
          <span>Daftar Hadir: ${escapeHtml(nama)}</span>
        </h3>
        ${res.data.length > 0 ? `
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"><th class="px-4 py-3 text-left">No</th><th class="px-4 py-3 text-left">Nama</th><th class="px-4 py-3 text-left">NIP</th><th class="px-4 py-3 text-left">Sekolah</th><th class="px-4 py-3 text-left">Waktu Check-in</th></tr></thead>
              <tbody>${res.data.map((a, i) => `<tr class="border-t dark:border-gray-700 text-gray-700 dark:text-gray-200"><td class="px-4 py-3">${i + 1}</td><td class="px-4 py-3 font-medium">${escapeHtml(a.nama)}</td><td class="px-4 py-3">${escapeHtml(a.nip || '-')}</td><td class="px-4 py-3">${escapeHtml(a.sekolah || '-')}</td><td class="px-4 py-3">${formatDateTime(a.waktu_checkin)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Total hadir: <strong>${res.data.length}</strong> orang</p>
        ` : '<p class="text-gray-400 text-center py-6">Belum ada yang check-in.</p>'}
      </div>`;
    container.scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

window.showRekapAbsensi = async function () {
  try {
    const res = await api('/absensi/rekap');
    const container = document.getElementById('rekap-container');
    container.classList.toggle('hidden');
    if (container.classList.contains('hidden')) return;

    const isAdmin = state.user?.role === 'admin';

    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-chart-bar text-purple-500 mr-2"></i>Rekap Kehadiran</h3>
          ${isAdmin ? `
          <button onclick="exportRekapCSV()" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
            <i class="fas fa-download mr-1"></i>Export CSV
          </button>` : ''}
        </div>
        
        <!-- Status Legend -->
        <div class="flex flex-wrap gap-4 mb-4 text-sm">
          <span class="flex items-center gap-1 text-gray-600 dark:text-gray-300"><span class="w-3 h-3 bg-green-500 rounded-full"></span>Hadir</span>
          <span class="flex items-center gap-1 text-gray-600 dark:text-gray-300"><span class="w-3 h-3 bg-yellow-500 rounded-full"></span>Izin</span>
          <span class="flex items-center gap-1 text-gray-600 dark:text-gray-300"><span class="w-3 h-3 bg-orange-500 rounded-full"></span>Sakit</span>
          <span class="flex items-center gap-1 text-gray-600 dark:text-gray-300"><span class="w-3 h-3 bg-red-500 rounded-full"></span>Alpha</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <th class="px-4 py-3 text-left">Nama</th>
                <th class="px-4 py-3 text-left">Sekolah</th>
                <th class="px-3 py-3 text-center text-green-600"><i class="fas fa-check"></i></th>
                <th class="px-3 py-3 text-center text-yellow-600"><i class="fas fa-file-alt"></i></th>
                <th class="px-3 py-3 text-center text-orange-600"><i class="fas fa-medkit"></i></th>
                <th class="px-3 py-3 text-center text-red-600"><i class="fas fa-times"></i></th>
                <th class="px-4 py-3 text-center">Total</th>
                <th class="px-4 py-3 text-center">% Hadir</th>
              </tr>
            </thead>
            <tbody>
              ${res.data?.map(r => {
      const total = r.total_kegiatan || 0;
      const pct = total > 0 ? Math.round((r.hadir / total) * 100) : 0;
      return `
                  <tr class="border-t dark:border-gray-700 text-gray-700 dark:text-gray-200">
                    <td class="px-4 py-3 font-medium">${escapeHtml(r.nama)}</td>
                    <td class="px-4 py-3 text-gray-500 dark:text-gray-400">${escapeHtml(r.sekolah || '-')}</td>
                    <td class="px-3 py-3 text-center font-bold text-green-600">${r.hadir}</td>
                    <td class="px-3 py-3 text-center text-yellow-600">${r.izin}</td>
                    <td class="px-3 py-3 text-center text-orange-600">${r.sakit}</td>
                    <td class="px-3 py-3 text-center text-red-600">${r.total_alpha}</td>
                    <td class="px-4 py-3 text-center">${total}</td>
                    <td class="px-4 py-3 text-center font-bold ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}">${pct}%</td>
                  </tr>
                `;
    }).join('') || ''}
            </tbody>
          </table>
        </div>
      </div>`;
    container.scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

window.exportRekapCSV = function () {
  window.open('/api/absensi/rekap/export?format=csv', '_blank');
  showToast('Mengunduh rekap absensi...');
}

window.showQRCode = async function (kegiatanId) {
  const modal = document.getElementById('qr-display-modal');
  const content = document.getElementById('qr-display-content');
  modal.classList.remove('hidden');

  content.innerHTML = `
        <div class="py-8">
            <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-gray-500 dark:text-gray-400">Menghasilkan QR code...</p>
        </div>
    `;

  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/qr?expiry=120`);
    const data = res.data;

    content.innerHTML = `
            <div class="p-4 bg-white rounded-xl inline-block shadow-inner mb-4">
                <img src="${data.qr_image}" alt="QR Code" class="w-64 h-64 mx-auto">
            </div>
            <h4 class="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1">${escapeHtml(data.nama_kegiatan)}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">${formatDate(data.tanggal)}</p>
            <p class="text-xs text-amber-600 dark:text-amber-400 mb-4">
                <i class="fas fa-clock mr-1"></i>Berlaku selama ${data.expires_in_minutes} menit
            </p>
            <div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-left text-xs text-gray-500 dark:text-gray-400 font-mono break-all mb-4">
                ${data.qr_data}
            </div>
            <button onclick="navigator.clipboard.writeText('${data.qr_data}'); showToast('Kode QR disalin!');" class="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition">
                <i class="fas fa-copy mr-1"></i>Salin Kode QR
            </button>
        `;
  } catch (e) {
    content.innerHTML = `
            <div class="py-8 text-red-500">
                <i class="fas fa-exclamation-circle text-4xl mb-2"></i>
                <p>Gagal menghasilkan QR code</p>
                <p class="text-sm text-gray-500 mt-1">${escapeHtml(e.message)}</p>
            </div>
        `;
  }
}

window.closeQRDisplay = function () {
  document.getElementById('qr-display-modal').classList.add('hidden');
}

window.showQRScanner = function () {
  const modal = document.getElementById('qr-scanner-modal');
  const reader = document.getElementById('qr-reader');
  modal.classList.remove('hidden');

  reader.innerHTML = `
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Pindai QR code dari kamera atau masukkan kode secara manual:
            </p>
            <input type="text" id="manual-qr-input" placeholder="kkg-absensi:..." class="w-full px-4 py-3 border rounded-xl mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-mono">
            <button onclick="processManualQR()" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition">
                <i class="fas fa-check mr-2"></i>Check-in dengan Kode
            </button>
        </div>
    `;
}

window.processManualQR = async function () {
  const input = document.getElementById('manual-qr-input');
  const qrData = input?.value?.trim();

  if (!qrData) {
    showToast('Masukkan kode QR', 'error');
    return;
  }

  const result = document.getElementById('qr-result');
  result.classList.remove('hidden');
  result.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-300">Memverifikasi QR code...</span>
        </div>
    `;

  try {
    const verifyRes = await api('/absensi/verify-qr', {
      method: 'POST',
      body: { qr_data: qrData }
    });

    if (!verifyRes.data.valid) {
      result.innerHTML = `
                <div class="text-center text-red-600 dark:text-red-400">
                    <i class="fas fa-times-circle text-3xl mb-2"></i>
                    <p class="font-bold">${escapeHtml(verifyRes.data.error || 'QR code tidak valid')}</p>
                    ${verifyRes.data.expired ? '<p class="text-sm text-gray-500">QR code sudah kadaluarsa. Minta admin untuk generate QR baru.</p>' : ''}
                </div>
            `;
      return;
    }

    const kegiatan = verifyRes.data.kegiatan;
    result.innerHTML = `
            <div class="text-center">
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-calendar-check text-2xl text-green-600 dark:text-green-400"></i>
                </div>
                <h4 class="font-bold text-gray-800 dark:text-gray-100">${escapeHtml(kegiatan.nama_kegiatan)}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${formatDate(kegiatan.tanggal)}</p>
                <button onclick="confirmQRCheckin('${qrData}')" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition">
                    <i class="fas fa-check mr-2"></i>Konfirmasi Check-in
                </button>
            </div>
        `;
  } catch (e) {
    result.innerHTML = `
            <div class="text-center text-red-600 dark:text-red-400">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>${escapeHtml(e.message || 'Gagal memverifikasi QR code')}</p>
            </div>
        `;
  }
}

window.confirmQRCheckin = async function (qrData) {
  const result = document.getElementById('qr-result');

  result.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-300">Memproses check-in...</span>
        </div>
    `;

  try {
    const res = await api('/absensi/checkin/qr', {
      method: 'POST',
      body: { qr_data: qrData }
    });

    const kegiatanId = res.data?.kegiatan_id;

    result.innerHTML = `
            <div class="text-center">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-3xl text-green-600 dark:text-green-400"></i>
                </div>
                <h4 class="font-bold text-gray-800 dark:text-gray-100 mb-2">Check-in Berhasil!</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${escapeHtml(res.data?.nama_kegiatan || 'Kegiatan')}</p>
                <div class="flex gap-2">
                  <button onclick="closeQRScanner()" class="flex-1 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium text-xs dark:text-gray-200">
                      Tutup
                  </button>
                  ${kegiatanId ? `
                  <button onclick="closeQRScanner(); window.openModalRefleksi(${kegiatanId})" class="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs">
                      Isi Refleksi
                  </button>` : ''}
                </div>
            </div>
        `;

    showToast('Check-in berhasil!', 'success');
  } catch (e) {
    result.innerHTML = `
            <div class="text-center text-red-600 dark:text-red-400">
                <i class="fas fa-times-circle text-3xl mb-2"></i>
                <p>${escapeHtml(e.message || 'Gagal check-in')}</p>
                <button onclick="showQRScanner()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                    Coba Lagi
                </button>
            </div>
        `;
  }
}

window.closeQRScanner = function () {
  document.getElementById('qr-scanner-modal').classList.add('hidden');
  document.getElementById('qr-reader').innerHTML = '';
  document.getElementById('qr-result').classList.add('hidden');
}
