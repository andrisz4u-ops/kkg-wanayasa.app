
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, formatDateTime, escapeHtml, showToast } from '../utils.js';

export async function renderAbsensi() {
  let kegiatan = [];
  try { const res = await api('/absensi/kegiatan'); kegiatan = res.data || []; } catch (e) { }

  return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-calendar-check text-purple-500 mr-2"></i>Absensi Digital</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Kelola kehadiran kegiatan KKG</p>
      </div>
      <div class="flex gap-2">
        ${state.user ? `<button onclick="showQRScanner()" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"><i class="fas fa-qrcode mr-1"></i>Scan QR</button>` : ''}
        <button onclick="showRekapAbsensi()" class="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800"><i class="fas fa-chart-bar mr-1"></i>Rekap</button>
        ${state.user?.role === 'admin' ? `<button onclick="showAddKegiatan()" class="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600"><i class="fas fa-plus mr-1"></i>Kegiatan Baru</button>` : ''}
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

    <div class="space-y-4">
      ${kegiatan.length > 0 ? kegiatan.map(k => `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-500 transition">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1">
              <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">${escapeHtml(k.nama_kegiatan)}</h3>
              <div class="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span><i class="fas fa-calendar mr-1 text-purple-400"></i>${formatDate(k.tanggal)}</span>
                <span><i class="fas fa-clock mr-1 text-blue-400"></i>${escapeHtml(k.waktu_mulai || '')} - ${escapeHtml(k.waktu_selesai || '')}</span>
                <span><i class="fas fa-map-marker-alt mr-1 text-red-400"></i>${escapeHtml(k.tempat || '-')}</span>
              </div>
              ${k.deskripsi ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${escapeHtml(k.deskripsi)}</p>` : ''}
            </div>
            <div class="flex flex-wrap gap-2">
              ${state.user?.role === 'admin' ? `
                <button onclick="showRollingQRCode(${k.id})" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-2xs" title="Rolling Dynamic QR Anti-Titip Presensi"><i class="fas fa-satellite-dish mr-1"></i>Rolling QR</button>
                <button onclick="issueCertificates(${k.id})" class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition shadow-2xs" title="Terbitkan E-Sertifikat PMM"><i class="fas fa-stamp mr-1"></i>Terbitkan Sertifikat</button>
              ` : ''}
              ${state.user ? `
                <button onclick="checkinAbsensi(${k.id})" class="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition shadow-2xs"><i class="fas fa-check mr-1"></i>Check-in</button>
                <button onclick="viewMyCertificate(${k.id})" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-2xs" title="Lihat & Cetak E-Sertifikat PMM"><i class="fas fa-award mr-1"></i>E-Sertifikat</button>
              ` : ''}
              <button onclick="viewAbsensi(${k.id}, '${escapeHtml(k.nama_kegiatan)}')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium dark:text-gray-200 transition"><i class="fas fa-list mr-1"></i>Daftar Hadir</button>
            </div>
          </div>
        </div>
      `).join('') : '<div class="text-center py-12 text-gray-400 dark:text-gray-500"><i class="fas fa-calendar-times text-4xl mb-4 block"></i>Belum ada data kegiatan.</div>'}
    </div>

    <div id="absensi-detail" class="hidden mt-8"></div>
  </div>`;
}

// Global functions
window.showAddKegiatan = function () {
  const container = document.getElementById('add-kegiatan-modal');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-purple-200 mb-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-plus-circle text-purple-500 mr-2"></i>Tambah Kegiatan Baru</h3>
      <form onsubmit="addKegiatan(event)" class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2"><input type="text" name="nama_kegiatan" required placeholder="Nama Kegiatan" class="w-full px-4 py-3 border rounded-xl"></div>
        <input type="date" name="tanggal" required class="px-4 py-3 border rounded-xl">
        <input type="text" name="tempat" placeholder="Tempat" class="px-4 py-3 border rounded-xl">
        <input type="text" name="waktu_mulai" placeholder="Waktu Mulai (09:00)" class="px-4 py-3 border rounded-xl">
        <input type="text" name="waktu_selesai" placeholder="Waktu Selesai (12:00)" class="px-4 py-3 border rounded-xl">
        <div class="md:col-span-2"><textarea name="deskripsi" placeholder="Deskripsi (opsional)" rows="2" class="w-full px-4 py-3 border rounded-xl"></textarea></div>
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" class="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">Simpan</button>
          <button type="button" onclick="document.getElementById('add-kegiatan-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
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
        nama_kegiatan: form.nama_kegiatan.value, tanggal: form.tanggal.value,
        waktu_mulai: form.waktu_mulai.value, waktu_selesai: form.waktu_selesai.value,
        tempat: form.tempat.value, deskripsi: form.deskripsi.value,
      }
    });
    showToast('Kegiatan berhasil ditambahkan!');
    window.location.reload(); // Simple reload to refresh list or re-render (since render is expensive to call from here without import)
    // Actually, calling render() would be better, but we don't have it here. 
    // We can use navigate('absensi') to trigger re-render?
    // navigate('absensi'); // But we need to import navigate?
    // Let's assume user will refresh or we add a way to refresh.
  } catch (e) { showToast(e.message, 'error'); }
}

window.checkinAbsensi = async function (kegiatanId) {
  // Show status selection modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
      <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 text-center"><i class="fas fa-calendar-check text-purple-500 mr-2"></i>Status Kehadiran</h3>
      <div class="space-y-3 mb-4">
        <button onclick="submitCheckin(${kegiatanId}, 'hadir')" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition">
          <i class="fas fa-check mr-2"></i>Hadir
        </button>
        <button onclick="submitCheckin(${kegiatanId}, 'izin')" class="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition">
          <i class="fas fa-file-alt mr-2"></i>Izin
        </button>
        <button onclick="submitCheckin(${kegiatanId}, 'sakit')" class="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition">
          <i class="fas fa-medkit mr-2"></i>Sakit
        </button>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Keterangan (opsional)</label>
        <input type="text" id="checkin-keterangan" placeholder="Alasan izin/sakit..." class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
      </div>
      <button onclick="this.closest('.fixed').remove()" class="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600">Batal</button>
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
    showToast(status === 'hadir' ? 'Check-in berhasil!' : `Status ${status} berhasil dicatat!`);
    // Close modal
    document.querySelector('.fixed.inset-0')?.remove();
  } catch (e) { showToast(e.message, 'error'); }
}

window.viewAbsensi = async function (kegiatanId, nama) {
  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/absensi`);
    const container = document.getElementById('absensi-detail');
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 border">
        <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-list text-purple-500 mr-2"></i>Daftar Hadir: ${escapeHtml(nama)}</h3>
        ${res.data.length > 0 ? `
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50"><th class="px-4 py-3 text-left">No</th><th class="px-4 py-3 text-left">Nama</th><th class="px-4 py-3 text-left">NIP</th><th class="px-4 py-3 text-left">Sekolah</th><th class="px-4 py-3 text-left">Waktu Check-in</th></tr></thead>
              <tbody>${res.data.map((a, i) => `<tr class="border-t"><td class="px-4 py-3">${i + 1}</td><td class="px-4 py-3 font-medium">${escapeHtml(a.nama)}</td><td class="px-4 py-3">${escapeHtml(a.nip || '-')}</td><td class="px-4 py-3">${escapeHtml(a.sekolah || '-')}</td><td class="px-4 py-3">${formatDateTime(a.waktu_checkin)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p class="mt-4 text-sm text-gray-500">Total hadir: <strong>${res.data.length}</strong> orang</p>
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
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded-full"></span>Hadir</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-500 rounded-full"></span>Izin</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-orange-500 rounded-full"></span>Sakit</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500 rounded-full"></span>Alpha</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700">
                <th class="px-4 py-3 text-left">Nama</th>
                <th class="px-4 py-3 text-left">Sekolah</th>
                <th class="px-3 py-3 text-center text-green-600"><i class="fas fa-check"></i></th>
                <th class="px-3 py-3 text-center text-yellow-600"><i class="fas fa-file-alt"></i></th>
                <th class="px-3 py-3 text-center text-orange-600"><i class="fas fa-medkit"></i></th>
                <th class="px-3 py-3 text-center text-red-600"><i class="fas fa-times"></i></th>
                <th class="px-4 py-3 text-center">Total</th>
                <th class="px-4 py-3 text-center">%</th>
              </tr>
            </thead>
            <tbody>${(res.data || []).map(r => {
      const persen = r.total_kegiatan > 0 ? Math.round((r.total_hadir || 0) / r.total_kegiatan * 100) : 0;
      return `<tr class="border-t dark:border-gray-700">
                <td class="px-4 py-3 font-medium dark:text-gray-200">${escapeHtml(r.nama)}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">${escapeHtml(r.sekolah || '-')}</td>
                <td class="px-3 py-3 text-center text-green-600 font-bold">${r.total_hadir || 0}</td>
                <td class="px-3 py-3 text-center text-yellow-600">${r.total_izin || 0}</td>
                <td class="px-3 py-3 text-center text-orange-600">${r.total_sakit || 0}</td>
                <td class="px-3 py-3 text-center text-red-600">${r.total_alpha || 0}</td>
                <td class="px-4 py-3 text-center dark:text-gray-300">${r.total_kegiatan}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-1 rounded-full text-xs font-bold ${persen >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : persen >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}">${persen}%</span>
                </td>
              </tr>`;
    }).join('')}</tbody>
          </table>
        </div>
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

// Export rekap to CSV
window.exportRekapCSV = function () {
  window.open('/api/absensi/rekap/export?format=csv', '_blank');
  showToast('Mengunduh rekap absensi...');
}

// ============================================
// QR Code Functions
// ============================================

// Show QR code for a kegiatan (admin only)
window.showQRCode = async function (kegiatanId) {
  const modal = document.getElementById('qr-display-modal');
  const content = document.getElementById('qr-display-content');

  modal.classList.remove('hidden');
  content.innerHTML = `
        <div class="flex justify-center py-8">
            <div class="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
    `;

  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/qr?expiry=120`);
    const data = res.data;

    content.innerHTML = `
            <div class="mb-4">
                <h4 class="font-bold text-lg text-gray-800 dark:text-gray-100">${escapeHtml(data.nama_kegiatan)}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">${formatDate(data.tanggal)}</p>
            </div>
            <div class="bg-white p-4 rounded-xl inline-block mb-4">
                <img src="${data.qr_image}" alt="QR Code" class="w-64 h-64 mx-auto">
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <p><i class="fas fa-clock mr-1"></i>Berlaku: ${data.expires_in_minutes} menit</p>
                <p class="text-xs mt-1">Kadaluarsa: ${new Date(data.expires_at).toLocaleString('id-ID')}</p>
            </div>
            <div class="flex gap-2 justify-center">
                <button onclick="refreshQRCode(${kegiatanId})" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                    <i class="fas fa-sync-alt mr-1"></i>Refresh
                </button>
                <button onclick="copyQRData('${data.qr_data}')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium dark:text-gray-200">
                    <i class="fas fa-copy mr-1"></i>Copy Data
                </button>
            </div>
        `;
  } catch (e) {
    content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-300">${e.message || 'Gagal generate QR code'}</p>
            </div>
        `;
  }
}

window.refreshQRCode = function (kegiatanId) {
  showQRCode(kegiatanId);
}

window.copyQRData = function (qrData) {
  navigator.clipboard.writeText(qrData).then(() => {
    showToast('QR data disalin ke clipboard', 'success');
  }).catch(() => {
    showToast('Gagal menyalin', 'error');
  });
}

window.closeQRDisplay = function () {
  if (window._rollingQRInterval) {
    clearInterval(window._rollingQRInterval);
    window._rollingQRInterval = null;
  }
  document.getElementById('qr-display-modal').classList.add('hidden');
}

// ============================================
// Rolling Dynamic QR Code (Anti-Titip Presensi)
// ============================================

window.showRollingQRCode = async function (kegiatanId) {
  const modal = document.getElementById('qr-display-modal');
  const content = document.getElementById('qr-display-content');

  modal.classList.remove('hidden');

  if (window._rollingQRInterval) {
    clearInterval(window._rollingQRInterval);
    window._rollingQRInterval = null;
  }

  content.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8">
      <div class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
      <p class="text-sm font-semibold text-slate-500">Menghasilkan Rolling Dynamic QR Code...</p>
    </div>
  `;

  let remaining = 30;

  async function fetchRollingToken() {
    try {
      const res = await api(`/absensi/kegiatan/${kegiatanId}/rolling-qr`);
      const data = res.data;
      remaining = data.seconds_remaining || 30;

      content.innerHTML = `
        <div class="mb-3 text-center">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Rolling Dynamic QR (Anti-Titip Presensi)
          </div>
          <h4 class="font-black text-xl text-gray-900 dark:text-gray-100">${escapeHtml(data.nama_kegiatan)}</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${formatDate(data.tanggal)} • ${escapeHtml(data.tempat || 'Ruang KKG')}</p>
        </div>

        <div class="bg-white p-4 rounded-2xl shadow-md border border-indigo-100 inline-block mb-3 relative">
          <img src="${data.qr_image}" alt="Rolling QR Code" class="w-72 h-72 mx-auto">
        </div>

        <!-- PROGRESS BAR & COUNTDOWN -->
        <div class="max-w-xs mx-auto mb-4 text-center">
          <div class="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
            <span>Berganti otomatis:</span>
            <span id="rolling-countdown-text" class="text-indigo-600 dark:text-indigo-400 font-mono font-black">${remaining} detik</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div id="rolling-progress-bar" class="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-1000" style="width: ${(remaining / 30) * 100}%"></div>
          </div>
          <p class="text-[11px] text-gray-400 mt-2 leading-tight">
            <i class="fas fa-shield-alt text-indigo-500 mr-1"></i>QR Code ini memiliki masa berlaku 30 detik. Foto dari luar ruangan tidak akan dapat dipakai check-in.
          </p>
        </div>

        <div class="flex gap-2 justify-center">
          <button onclick="fetchRollingToken()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
            <i class="fas fa-sync-alt mr-1"></i>Refresh Sekarang
          </button>
          <button onclick="copyQRData('${data.qr_data}')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition">
            <i class="fas fa-copy mr-1"></i>Copy Token
          </button>
          <button onclick="closeQRDisplay()" class="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold">
            Tutup
          </button>
        </div>
      `;
    } catch (e) {
      content.innerHTML = `
        <div class="text-center py-6">
          <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-2"></i>
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">${escapeHtml(e.message || 'Gagal memuat Rolling QR')}</p>
        </div>
      `;
    }
  }

  window.fetchRollingToken = fetchRollingToken;
  await fetchRollingToken();

  window._rollingQRInterval = setInterval(() => {
    remaining--;
    const txt = document.getElementById('rolling-countdown-text');
    const bar = document.getElementById('rolling-progress-bar');
    if (txt) txt.textContent = `${Math.max(0, remaining)} detik`;
    if (bar) bar.style.width = `${Math.max(0, (remaining / 30) * 100)}%`;

    if (remaining <= 0) {
      fetchRollingToken();
    }
  }, 1000);
}

// ============================================
// E-Sertifikat PMM Generator & Viewer
// ============================================

window.issueCertificates = async function (kegiatanId) {
  if (!confirm('Terbitkan E-Sertifikat resmi KKG (4 JP) ber-QR Code untuk seluruh peserta yang berstatus HADIR?')) {
    return;
  }

  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/issue-certificates`, { method: 'POST' });
    showToast(res.message || `Berhasil menerbitkan ${res.data?.total_issued || 0} E-Sertifikat!`, 'success');
  } catch (e) {
    showToast(e.message || 'Gagal menerbitkan E-Sertifikat', 'error');
  }
}

window.viewMyCertificate = async function (kegiatanId) {
  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/my-certificate`);
    if (!res.data) {
      showToast('E-Sertifikat belum diterbitkan atau Anda belum tercatat hadir.', 'warning');
      return;
    }

    const cert = res.data;
    showCertificateModal(cert);
  } catch (e) {
    showToast(e.message || 'E-Sertifikat belum tersedia. Pastikan Anda sudah check-in dan admin telah menerbitkan sertifikat.', 'warning');
  }
}

window.showCertificateModal = function (cert) {
  let modal = document.getElementById('certificate-preview-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'certificate-preview-modal';
    document.body.appendChild(modal);
  }

  const verifyFullUrl = `${window.location.origin}/verify/sertifikat/${cert.uuid}`;
  const tt = cert.tanda_tangan || {
    ketua_kkg: 'MAMAN RUKMAN, S.Pd',
    nip_ketua: '197009212005011007',
    jabatan_ketua: 'Ketua KKG Gugus 3',
    pengawas_pembina: 'DIDIN SAMSUDIN, S.Pd.,M.Pd',
    nip_pengawas: '198208182009021004',
    jabatan_pengawas: 'Pengawas Pembina Korwil V'
  };

  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 my-8 border border-amber-200 dark:border-gray-700 relative">
      <button onclick="document.getElementById('certificate-preview-modal').remove()" class="absolute top-5 right-5 text-gray-400 hover:text-gray-600 no-print">
        <i class="fas fa-times text-xl"></i>
      </button>

      <!-- CERTIFICATE INNER (A4 PROPORTION) -->
      <div id="print-certificate-area" class="border-4 border-double border-amber-600/70 p-6 sm:p-8 rounded-2xl bg-radial from-amber-50/40 via-white to-amber-50/20 text-center relative">
        <div class="flex items-center justify-center gap-2 mb-2">
          <i class="fas fa-award text-amber-500 text-3xl"></i>
        </div>
        <h4 class="text-xs uppercase font-extrabold tracking-widest text-slate-500">Pemerintah Kabupaten Purwakarta • Dinas Pendidikan</h4>
        <h3 class="text-lg font-black tracking-tight text-slate-900 mt-0.5">KELOMPOK KERJA GURU (KKG) GUGUS 3 WANAYASA</h3>
        <p class="text-[11px] font-mono font-bold text-amber-800 mt-2">Nomor: ${escapeHtml(cert.nomor_sertifikat)}</p>

        <div class="my-4">
          <p class="text-xs text-slate-500">Diberikan kepada:</p>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-wide border-b-2 border-amber-500/40 pb-1 inline-block">${escapeHtml(cert.nama_peserta)}</h2>
          <p class="text-xs font-mono text-slate-600 mt-1">NIP. ${escapeHtml(cert.nip_peserta || '-')}</p>
          <p class="text-xs font-semibold text-emerald-800 mt-0.5">${escapeHtml(cert.unit_kerja || 'SDN Gugus 3 Wanayasa')}</p>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
          Atas partisipasi aktifnya sebagai <strong>${escapeHtml(cert.peran || 'Peserta Aktif')}</strong> dalam Kegiatan Pelatihan Guru Berkelanjutan:
        </p>
        <p class="text-sm font-bold text-slate-800 my-1">"${escapeHtml(cert.nama_kegiatan)}"</p>
        <p class="text-xs text-slate-500">Dengan alokasi waktu setara <strong>${cert.alokasi_jp || 4} Jam Pelajaran (JP)</strong> pada tanggal ${formatDate(cert.tanggal_kegiatan)}.</p>

        <!-- SIGNATURE & QR -->
        <div class="mt-8 pt-4 border-t border-amber-200/80">
          <div class="grid grid-cols-1 sm:grid-cols-3 items-end gap-4 text-xs">
            
            <!-- Pengawas Pembina Korwil V -->
            <div class="text-center sm:text-left order-2 sm:order-1">
              <span class="text-[11px] text-slate-500 block">Mengetahui,</span>
              <span class="text-xs font-bold text-slate-800 block mt-0.5">${escapeHtml(tt.jabatan_pengawas || 'Pengawas Pembina Korwil V')}</span>
              <div class="h-10 flex items-center justify-center sm:justify-start">
                <span class="text-[10px] italic text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">[Ditandatangani Digital]</span>
              </div>
              <span class="text-xs font-bold text-slate-900 block underline">${escapeHtml(tt.pengawas_pembina || 'DIDIN SAMSUDIN, S.Pd.,M.Pd')}</span>
              <span class="text-[10px] font-mono text-slate-600 block">NIP. ${escapeHtml(tt.nip_pengawas || '198208182009021004')}</span>
            </div>

            <!-- QR Verification Center -->
            <div class="flex flex-col items-center justify-center text-center order-1 sm:order-2 my-2 sm:my-0">
              <div id="cert-qr-box" class="w-16 h-16 bg-white p-1 rounded-xl border border-amber-300 shadow-2xs flex items-center justify-center">
                <i class="fas fa-qrcode text-3xl text-emerald-700"></i>
              </div>
              <span class="text-[9px] uppercase font-bold text-slate-400 mt-1 block">Kode Verifikasi PMM:</span>
              <span class="text-[10px] font-mono font-bold text-slate-700 block">${cert.uuid.substring(0, 13)}...</span>
              <span class="text-[9px] text-emerald-600 font-semibold block"><i class="fas fa-check-circle mr-0.5"></i>Dokumen Terverifikasi Sah</span>
            </div>

            <!-- Ketua KKG Gugus 3 -->
            <div class="text-center sm:text-right order-3">
              <span class="text-[11px] text-slate-500 block">Wanayasa, ${formatDate(cert.tanggal_kegiatan)}</span>
              <span class="text-xs font-bold text-slate-800 block mt-0.5">${escapeHtml(tt.jabatan_ketua || 'Ketua KKG Gugus 3')}</span>
              <div class="h-10 flex items-center justify-center sm:justify-end">
                <span class="text-[10px] italic text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">[Ditandatangani Digital]</span>
              </div>
              <span class="text-xs font-bold text-slate-900 block underline">${escapeHtml(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd')}</span>
              <span class="text-[10px] font-mono text-slate-600 block">NIP. ${escapeHtml(tt.nip_ketua || '197009212005011007')}</span>
            </div>

          </div>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="flex flex-wrap gap-3 justify-end mt-6 no-print">
        <button onclick="navigator.clipboard.writeText('${verifyFullUrl}'); showToast('Tautan verifikasi PMM disalin ke clipboard!', 'success');" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
          <i class="fas fa-link mr-1.5"></i>Salin Tautan PMM
        </button>
        <button onclick="window.open('/verify/sertifikat/${cert.uuid}', '_blank')" class="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition">
          <i class="fas fa-external-link-alt mr-1.5"></i>Buka Halaman Verifikasi
        </button>
        <button onclick="window.printOfficialCertificate(window.__currentCert)" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20">
          <i class="fas fa-print mr-1.5"></i>Cetak / Simpan PDF
        </button>
      </div>
    </div>
  `;
};

// Generator Cetak Resmi E-Sertifikat A4 Landscape (Bebas Gangguan Layout Web)
window.printOfficialCertificate = function (cert) {
  if (!cert) return;

  const tt = cert.tanda_tangan || {
    ketua_kkg: 'MAMAN RUKMAN, S.Pd',
    nip_ketua: '197009212005011007',
    jabatan_ketua: 'Ketua KKG Gugus 3',
    pengawas_pembina: 'DIDIN SAMSUDIN, S.Pd.,M.Pd',
    nip_pengawas: '198208182009021004',
    jabatan_pengawas: 'Pengawas Pembina Korwil V'
  };

  const origin = window.location.origin;
  const verifyFullUrl = `${origin}/verify/sertifikat/${cert.uuid}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verifyFullUrl)}`;

  const formatDateId = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  };

  const formattedDate = formatDateId(cert.tanggal_kegiatan);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak sertifikat.');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Sertifikat_${(cert.nama_peserta || 'Peserta').replace(/[^a-zA-Z0-9]/g, '_')}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .cert-container {
      width: 100%;
      height: 100%;
      min-height: 185mm;
      padding: 22px 34px;
      border: 5px double #b45309;
      border-radius: 14px;
      background: radial-gradient(circle at center, #ffffff 0%, #fffdf8 65%, #fef3c7 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .cert-corner-tl, .cert-corner-tr, .cert-corner-bl, .cert-corner-br {
      position: absolute;
      width: 28px;
      height: 28px;
      border-color: #d97706;
      border-style: solid;
      pointer-events: none;
    }
    .cert-corner-tl { top: 6px; left: 6px; border-width: 3px 0 0 3px; }
    .cert-corner-tr { top: 6px; right: 6px; border-width: 3px 3px 0 0; }
    .cert-corner-bl { bottom: 6px; left: 6px; border-width: 0 0 3px 3px; }
    .cert-corner-br { bottom: 6px; right: 6px; border-width: 0 3px 3px 0; }

    .kop-header {
      text-align: center;
      border-bottom: 2px solid #b45309;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .kop-gov {
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 2px;
      color: #64748b;
      text-transform: uppercase;
      margin: 0;
    }
    .kop-org {
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 2px 0 0 0;
    }
    .kop-sub {
      font-size: 8.5pt;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .cert-title-section {
      text-align: center;
      margin: 4px 0;
    }
    .cert-main-title {
      font-size: 26pt;
      font-weight: 900;
      letter-spacing: 4px;
      color: #92400e;
      margin: 0;
      text-transform: uppercase;
    }
    .cert-no {
      font-family: monospace;
      font-size: 10pt;
      font-weight: bold;
      color: #78350f;
      margin: 2px 0 0 0;
    }

    .recipient-section {
      text-align: center;
      margin: 6px 0;
    }
    .recipient-label {
      font-size: 10pt;
      color: #64748b;
      margin: 0;
    }
    .recipient-name {
      font-size: 20pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
      border-bottom: 2px solid #d97706;
      padding: 0 16px 2px 16px;
      margin: 3px 0 0 0;
    }
    .recipient-nip {
      font-family: monospace;
      font-size: 9.5pt;
      color: #475569;
      margin: 3px 0 0 0;
    }
    .recipient-unit {
      font-size: 10.5pt;
      font-weight: 700;
      color: #065f46;
      margin: 2px 0 0 0;
    }

    .narrative-section {
      text-align: center;
      max-width: 86%;
      margin: 6px auto;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #334155;
    }
    .narrative-activity {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      margin: 3px 0;
    }

    .signatures-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      margin-top: 8px;
    }
    .sig-col {
      width: 32%;
      font-size: 9pt;
    }
    .sig-left { text-align: left; }
    .sig-center {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sig-right { text-align: right; }
    .sig-role {
      font-weight: bold;
      color: #0f172a;
      margin-top: 2px;
    }
    .digital-seal {
      display: inline-block;
      font-size: 7.5pt;
      font-style: italic;
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 2px 6px;
      border-radius: 4px;
      margin: 5px 0;
    }
    .sig-person {
      font-weight: bold;
      text-decoration: underline;
      color: #0f172a;
      font-size: 9.5pt;
    }
    .sig-nip-num {
      font-family: monospace;
      font-size: 8.5pt;
      color: #475569;
    }
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .qr-image {
      width: 60px;
      height: 60px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 2px;
      background: #fff;
    }
    .qr-label {
      font-size: 7pt;
      font-weight: bold;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
    }
    .qr-uuid {
      font-family: monospace;
      font-size: 7.5pt;
      color: #334155;
      font-weight: bold;
    }
    .qr-valid {
      font-size: 7pt;
      color: #059669;
      font-weight: bold;
    }

    /* Page 2: Struktur Materi */
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .table-curriculum {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
    }
    .table-curriculum th, .table-curriculum td {
      border: 1px solid #94a3b8;
      padding: 7px 10px;
    }
    .table-curriculum th {
      background: #f1f5f9;
      font-weight: bold;
      text-align: left;
    }
  </style>
</head>
<body>
  <!-- LEMBAR 1: SERTIFIKAT UTAMA -->
  <div class="cert-container">
    <div class="cert-corner-tl"></div>
    <div class="cert-corner-tr"></div>
    <div class="cert-corner-bl"></div>
    <div class="cert-corner-br"></div>

    <div class="kop-header">
      <p class="kop-gov">Pemerintah Kabupaten Purwakarta • Dinas Pendidikan</p>
      <h2 class="kop-org">KELOMPOK KERJA GURU (KKG) GUGUS 3 WANAYASA</h2>
      <p class="kop-sub">Sekretariat: SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta</p>
    </div>

    <div class="cert-title-section">
      <h1 class="cert-main-title">SERTIFIKAT</h1>
      <p class="cert-no">Nomor: ${escapeHtml(cert.nomor_sertifikat)}</p>
    </div>

    <div class="recipient-section">
      <p class="recipient-label">Diberikan kepada:</p>
      <h2 class="recipient-name">${escapeHtml(cert.nama_peserta)}</h2>
      <p class="recipient-nip">NIP. ${escapeHtml(cert.nip_peserta || '-')}</p>
      <p class="recipient-unit">${escapeHtml(cert.unit_kerja || 'SDN Gugus 3 Wanayasa')}</p>
    </div>

    <div class="narrative-section">
      <p style="margin:0;">Atas partisipasi aktifnya sebagai <strong>${escapeHtml(cert.peran || 'Peserta Aktif')}</strong> dalam Kegiatan Pengembangan Keprofesian Berkelanjutan:</p>
      <p class="narrative-activity">"${escapeHtml(cert.nama_kegiatan)}"</p>
      <p style="margin:0;">Yang diselenggarakan oleh KKG Gugus 3 Wanayasa pada tanggal <strong>${formattedDate}</strong>, dengan alokasi waktu setara <strong>${cert.alokasi_jp || 4} Jam Pelajaran (JP)</strong>.</p>
    </div>

    <div class="signatures-section">
      <!-- Pengawas Pembina Korwil V -->
      <div class="sig-col sig-left">
        <div>Mengetahui,</div>
        <div class="sig-role">${escapeHtml(tt.jabatan_pengawas || 'Pengawas Pembina Korwil V')}</div>
        <div class="digital-seal">✓ Ditandatangani Secara Digital</div>
        <div class="sig-person">${escapeHtml(tt.pengawas_pembina || 'DIDIN SAMSUDIN, S.Pd.,M.Pd')}</div>
        <div class="sig-nip-num">NIP. ${escapeHtml(tt.nip_pengawas || '198208182009021004')}</div>
      </div>

      <!-- QR PMM Verification Center -->
      <div class="sig-col sig-center">
        <div class="qr-container">
          <img src="${qrImgUrl}" class="qr-image" alt="QR Code PMM" onerror="this.style.display='none'" />
          <div class="qr-label">Kode Verifikasi PMM:</div>
          <div class="qr-uuid">${cert.uuid.substring(0, 13)}...</div>
          <div class="qr-valid">✓ Dokumen Terdaftar & Sah</div>
        </div>
      </div>

      <!-- Ketua KKG Gugus 3 -->
      <div class="sig-col sig-right">
        <div>Wanayasa, ${formattedDate}</div>
        <div class="sig-role">${escapeHtml(tt.jabatan_ketua || 'Ketua KKG Gugus 3')}</div>
        <div class="digital-seal">✓ Ditandatangani Secara Digital</div>
        <div class="sig-person">${escapeHtml(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd')}</div>
        <div class="sig-nip-num">NIP. ${escapeHtml(tt.nip_ketua || '197009212005011007')}</div>
      </div>
    </div>
  </div>

  <!-- LEMBAR 2: STRUKTUR PROGRAM & ALOKASI WAKTU (STANDAR PMM) -->
  <div class="page-break"></div>
  <div class="cert-container" style="min-height: 185mm;">
    <div class="kop-header">
      <p class="kop-gov">Lampiran E-Sertifikat Pelatihan KKG</p>
      <h2 class="kop-org">STRUKTUR PROGRAM & MATERI KEGIATAN (4 JP)</h2>
      <p class="kop-sub">Nomor Sertifikat: ${escapeHtml(cert.nomor_sertifikat)}</p>
    </div>

    <div style="margin: 8px 0;">
      <table style="width: 100%; font-size: 9.5pt; line-height: 1.5; margin-bottom: 10px;">
        <tr><td style="width: 25%; font-weight: bold;">Nama Peserta</td><td style="width: 2%;">:</td><td>${escapeHtml(cert.nama_peserta)}</td></tr>
        <tr><td style="font-weight: bold;">NIP</td><td>:</td><td>${escapeHtml(cert.nip_peserta || '-')}</td></tr>
        <tr><td style="font-weight: bold;">Unit Kerja</td><td>:</td><td>${escapeHtml(cert.unit_kerja || 'SDN Gugus 3 Wanayasa')}</td></tr>
        <tr><td style="font-weight: bold;">Tema Pelatihan</td><td>:</td><td>${escapeHtml(cert.nama_kegiatan)}</td></tr>
      </table>

      <table class="table-curriculum">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">No</th>
            <th style="width: 72%;">Materi / Pokok Bahasan</th>
            <th style="width: 20%; text-align: center;">Alokasi Waktu</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1.</td>
            <td><strong>Penguatan Regulasi & Kebijakan Pendidikan Dasar:</strong><br><span style="font-size: 8.5pt; color: #475569;">Penyelarasan Standar Kurikulum Nasional & Karakter Budaya Purwakarta</span></td>
            <td style="text-align: center; font-weight: bold;">1 JP</td>
          </tr>
          <tr>
            <td style="text-align: center;">2.</td>
            <td><strong>Materi Inti & Pendalaman Praktis:</strong><br><span style="font-size: 8.5pt; color: #475569;">${escapeHtml(cert.materi_pokok || cert.nama_kegiatan)}</span></td>
            <td style="text-align: center; font-weight: bold;">2 JP</td>
          </tr>
          <tr>
            <td style="text-align: center;">3.</td>
            <td><strong>Refleksi Kolaboratif & Rencana Tindak Lanjut (RTL):</strong><br><span style="font-size: 8.5pt; color: #475569;">Implementasi di Kelas/Sekolah & Berbagi Praktik Baik di Komunitas Belajar</span></td>
            <td style="text-align: center; font-weight: bold;">1 JP</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="2" style="text-align: right; padding-right: 14px;">TOTAL ALOKASI WAKTU</td>
            <td style="text-align: center; color: #065f46;">4 JP</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="signatures-section" style="border: none;">
      <div class="sig-col sig-left"></div>
      <div class="sig-col sig-center"></div>
      <div class="sig-col sig-right">
        <div>Wanayasa, ${formattedDate}</div>
        <div class="sig-role">${escapeHtml(tt.jabatan_ketua || 'Ketua KKG Gugus 3')}</div>
        <div class="digital-seal">✓ Disahkan Secara Digital</div>
        <div class="sig-person">${escapeHtml(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd')}</div>
        <div class="sig-nip-num">NIP. ${escapeHtml(tt.nip_ketua || '197009212005011007')}</div>
      </div>
    </div>
  </div>

  <script>
    setTimeout(function() {
      window.focus();
      window.print();
    }, 450);
  </script>
</body>
</html>
  `);
  printWindow.document.close();
};

// QR Scanner 
let html5QrCode = null;

window.showQRScanner = async function () {
  const modal = document.getElementById('qr-scanner-modal');
  const reader = document.getElementById('qr-reader');
  const result = document.getElementById('qr-result');

  modal.classList.remove('hidden');
  result.classList.add('hidden');

  // Fallback to manual input (for camera use html5-qrcode library)
  reader.innerHTML = `
        <div class="p-6 text-center">
            <i class="fas fa-qrcode text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Masukkan kode QR dari admin:</p>
            <input type="text" id="manual-qr-input" placeholder="kkg-dyn:... atau kkg-absensi:..." class="w-full px-4 py-3 border rounded-xl mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm">
            <button onclick="submitManualQR()" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium">
                <i class="fas fa-check mr-2"></i>Submit
            </button>
        </div>
    `;
}

window.submitManualQR = async function () {
  const input = document.getElementById('manual-qr-input');
  const qrData = input?.value?.trim();

  if (!qrData) {
    showToast('Masukkan kode QR', 'warning');
    return;
  }

  await onQRScanSuccess(qrData);
}

async function onQRScanSuccess(qrData) {
  const result = document.getElementById('qr-result');
  result.classList.remove('hidden');
  result.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-300">Memverifikasi...</span>
        </div>
    `;

  try {
    const verifyRes = await api('/absensi/verify-qr', {
      method: 'POST',
      body: { qr_data: qrData }
    });

    if (!verifyRes.data?.valid) {
      result.innerHTML = `
                <div class="text-center text-red-600 dark:text-red-400">
                    <i class="fas fa-times-circle text-3xl mb-2"></i>
                    <p>${escapeHtml(verifyRes.data?.error || 'QR code tidak valid atau telah kadaluarsa')}</p>
                </div>
            `;
      return;
    }

    const kegiatan = verifyRes.data.kegiatan;
    const isRolling = verifyRes.data.is_rolling;

    result.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                ${isRolling ? `
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 uppercase mb-2">
                    <i class="fas fa-satellite-dish mr-1"></i>Verified Rolling Dynamic QR
                  </span>
                ` : ''}
                <h4 class="font-bold text-gray-800 dark:text-gray-100">${escapeHtml(kegiatan.nama_kegiatan)}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    ${formatDate(kegiatan.tanggal)} | ${escapeHtml(kegiatan.waktu_mulai || '')}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <i class="fas fa-map-marker-alt mr-1"></i>${escapeHtml(kegiatan.tempat || '-')}
                </p>
                <button onclick="confirmQRCheckin('${qrData}')" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold">
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

  let coords = null;
  try {
    if (navigator.geolocation) {
      coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 3000 }
        );
      });
    }
  } catch (_) {}

  try {
    const res = await api('/absensi/checkin/qr', {
      method: 'POST',
      body: {
        qr_data: qrData,
        latitude: coords?.latitude,
        longitude: coords?.longitude
      }
    });

    result.innerHTML = `
            <div class="text-center">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-3xl text-green-600 dark:text-green-400"></i>
                </div>
                <h4 class="font-bold text-gray-800 dark:text-gray-100 mb-2">Check-in Berhasil!</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${escapeHtml(res.data?.nama_kegiatan || 'Kegiatan')}</p>
                <button onclick="closeQRScanner()" class="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium dark:text-gray-200">
                    Tutup
                </button>
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


