/**
 * verify.js — Halaman Verifikasi Publik Dokumen Resmi KKG & Sekolah
 * Terbuka untuk umum (tanpa login) untuk memeriksa keabsahan Surat Undangan,
 * Surat Perintah Tugas (SPT), dan SPPD ber-barcode resmi.
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, formatDate, formatDateTime } from '../utils.js';

export async function renderVerify(params = {}) {
  // Ambil ID dari params atau dari path URL window (/verify/surat/12 atau /verify/sertifikat/uuid atau /verify?id=12)
  let docId = params.id || state.pageParams?.id;
  const isSertifikatExplicit = (params.type === 'sertifikat') || (state.pageParams?.type === 'sertifikat') || window.location.pathname.includes('/verify/sertifikat');

  if (!docId) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart !== 'verify' && lastPart !== 'surat' && lastPart !== 'sertifikat') {
      docId = lastPart;
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      docId = urlParams.get('id') || urlParams.get('nomor') || urlParams.get('uuid');
    }
  }

  if (!docId) {
    return renderNotFound('Parameter identitas dokumen tidak ditemukan pada tautan verifikasi.');
  }

  // 1. Jika eksplisit sertifikat, panggil endpoint verifikasi sertifikat
  if (isSertifikatExplicit) {
    try {
      const sRes = await api(`/absensi/sertifikat/verify/${encodeURIComponent(docId)}`);
      if (sRes && sRes.success && sRes.data && sRes.data.valid) {
        return renderSertifikatVerification(sRes.data);
      } else {
        return renderNotFound(sRes?.data?.error || sRes?.error?.message || 'E-Sertifikat tidak terdaftar atau telah ditarik.');
      }
    } catch (err) {
      return renderNotFound(err.message || 'Gagal memverifikasi keabsahan E-Sertifikat.');
    }
  }

  // 2. Coba verifikasi surat dinas / SPPD terlebih dahulu
  let doc = null;
  let errorMsg = null;

  try {
    const res = await api(`/surat/verify/${encodeURIComponent(docId)}`);
    if (res && res.success && res.data) {
      doc = res.data;
    } else {
      // Coba fallback cek ke e-sertifikat jika UUID diberikan
      try {
        const sRes = await api(`/absensi/sertifikat/verify/${encodeURIComponent(docId)}`);
        if (sRes && sRes.success && sRes.data && sRes.data.valid) {
          return renderSertifikatVerification(sRes.data);
        }
      } catch (_) {}
      errorMsg = res?.error?.message || 'Dokumen tidak ditemukan dalam arsip resmi.';
    }
  } catch (err) {
    // Coba fallback cek ke e-sertifikat jika surat error
    try {
      const sRes = await api(`/absensi/sertifikat/verify/${encodeURIComponent(docId)}`);
      if (sRes && sRes.success && sRes.data && sRes.data.valid) {
        return renderSertifikatVerification(sRes.data);
      }
    } catch (_) {}
    errorMsg = err.message || 'Gagal terhubung ke pangkalan data verifikasi.';
  }

  if (errorMsg || !doc) {
    return renderNotFound(errorMsg || 'Dokumen ini tidak terdaftar atau telah dicabut.');
  }

  const isSppd = doc.tipe_surat === 'sppd' || (doc.jenis_kegiatan && doc.jenis_kegiatan.includes('SPPD'));
  const meta = doc.metadata || {};
  const daftarGuru = Array.isArray(doc.peserta) ? doc.peserta : [];
  const namaKkg = doc.lembaga_penerbit?.nama_kkg || 'Kelompok Kerja Guru (KKG) Gugus 3';
  const kec = doc.lembaga_penerbit?.kecamatan || 'Wanayasa';
  const kab = doc.lembaga_penerbit?.kabupaten || 'Purwakarta';

  return `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-3xl mx-auto">
        
        <!-- BACK TO PORTAL BUTTON -->
        <div class="mb-4 flex items-center justify-between no-print">
          <a href="/" class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors">
            <i class="fas fa-arrow-left"></i>
            <span>Kembali ke Portal KKG</span>
          </a>
          <button onclick="window.print()" class="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors cursor-pointer">
            <i class="fas fa-print"></i>
            <span>Cetak Bukti Verifikasi</span>
          </button>
        </div>

        <!-- MAIN VERIFICATION CARD -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-700 overflow-hidden">
          
          <!-- TOP OFFICIAL BANNER -->
          <div class="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -left-10 -top-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

            <div class="flex items-center justify-center gap-3 mb-3">
              <span class="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-200 text-lg shadow-inner">
                <i class="fas fa-shield-halved"></i>
              </span>
              <span class="text-xs font-extrabold uppercase tracking-widest text-teal-200">Sistem Informasi Verifikasi Dokumen Kedinasan</span>
            </div>

            <h1 class="text-xl sm:text-2xl font-black tracking-tight leading-tight uppercase">
              Pemerintah Kabupaten ${escapeHtml(kab)}
            </h1>
            <p class="text-sm font-semibold text-teal-100/90 tracking-wide uppercase mt-0.5">
              Dinas Pendidikan • ${escapeHtml(namaKkg)} Kec. ${escapeHtml(kec)}
            </p>
          </div>

          <!-- VERIFICATION STATUS BADGE -->
          <div class="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div class="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 shrink-0">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="flex-1">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Dokumen Sah & Terverifikasi
                </div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Arsip Resmi Terdaftar di Pangkalan Data KKG
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ID Arsip: <span class="font-mono font-bold text-slate-700 dark:text-slate-300">#DOC-${doc.id}</span> • Dicatat pada ${formatDateTime(doc.created_at)}
                </p>
              </div>
            </div>
          </div>

          <!-- DOCUMENT METADATA GRID -->
          <div class="p-6 sm:p-8 space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Nomor Surat -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  ${isSppd ? 'Nomor Surat Perintah Tugas (SPT)' : 'Nomor Surat Undangan'}
                </span>
                <span class="text-sm font-extrabold text-teal-800 dark:text-teal-300 font-mono break-all">
                  ${escapeHtml(doc.nomor_surat || '-')}
                </span>
              </div>

              <!-- Nomor SPPD (Jika Ada) -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  ${isSppd ? 'Nomor SPD / SPPD Lembar 1' : 'Kategori Surat'}
                </span>
                <span class="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono break-all">
                  ${escapeHtml(meta.nomor_sppd || doc.tipe_surat || 'Surat Undangan Resmi')}
                </span>
              </div>

              <!-- Agenda / Keperluan -->
              <div class="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Perihal / Agenda Kegiatan
                </span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed block">
                  ${escapeHtml(doc.agenda || doc.jenis_kegiatan || '-')}
                </span>
              </div>

              <!-- Waktu & Tempat -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Waktu Pelaksanaan
                </span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  <i class="fas fa-calendar-day text-teal-600 mr-1.5"></i>${formatDate(doc.tanggal_kegiatan)}
                </span>
                <span class="text-xs font-medium text-slate-500 dark:text-slate-400 block mt-1">
                  <i class="fas fa-clock text-teal-600 mr-1.5"></i>${escapeHtml(doc.waktu_kegiatan || '08.00 s.d Selesai')}
                </span>
              </div>

              <!-- Tempat / Lokasi -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Tempat Kegiatan
                </span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  <i class="fas fa-map-marker-alt text-rose-500 mr-1.5"></i>${escapeHtml(doc.tempat_kegiatan || '-')}
                </span>
              </div>

              <!-- Pejabat Penandatangan -->
              <div class="md:col-span-2 p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/60">
                <span class="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-1">
                  Pejabat Penandatangan / Penanggung Jawab
                </span>
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span class="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                      ${escapeHtml(meta.kepala_sekolah_asal || doc.penanggung_jawab || doc.lembaga_penerbit?.ketua || 'Ketua KKG')}
                    </span>
                    <span class="text-xs font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                      NIP. ${escapeHtml(meta.nip_kepala_sekolah_asal || doc.lembaga_penerbit?.nip_ketua || '-')}
                    </span>
                  </div>
                  <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                    <i class="fas fa-stamp text-xs"></i> Tanda Tangan Terotentikasi
                  </span>
                </div>
              </div>

            </div>

            <!-- DAFTAR GURU YANG DITUGASKAN (JIKA SPPD / PESERTA) -->
            ${daftarGuru.length > 0 ? `
              <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <i class="fas fa-users text-teal-600"></i>
                  <span>Daftar Guru / Personil yang Ditugaskan (${daftarGuru.length} Orang)</span>
                </h3>
                <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th class="py-2.5 px-3">No</th>
                        <th class="py-2.5 px-3">Nama Pegawai</th>
                        <th class="py-2.5 px-3">NIP</th>
                        <th class="py-2.5 px-3">Jabatan / Gol.</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                      ${daftarGuru.map((g, idx) => {
                        const nama = typeof g === 'object' ? g.nama : g;
                        const nip = typeof g === 'object' ? (g.nip || '-') : '-';
                        const jabatan = typeof g === 'object' ? (g.jabatan || g.pangkat || 'Guru Kelas') : 'Guru Peserta';
                        return `
                          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td class="py-2.5 px-3 text-slate-400 font-medium">${idx + 1}</td>
                            <td class="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">${escapeHtml(nama)}</td>
                            <td class="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">${escapeHtml(nip)}</td>
                            <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400">${escapeHtml(jabatan)}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            <!-- DIGITAL STAMP & SECURITY FOOTNOTE -->
            <div class="rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div class="flex items-center gap-3">
                ${doc.verifikasi?.qrcode ? `
                  <img src="${doc.verifikasi.qrcode}" alt="QR Verification" class="w-16 h-16 rounded-xl border border-white dark:border-slate-600 shadow-2xs bg-white shrink-0" />
                ` : ''}
                <div>
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Integritas Dokumen Terjamin
                  </span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                    Dokumen ini diproses dan diterbitkan secara digital oleh Portal KKG Gugus 3 Wanayasa, diakui sah untuk keperluan administrasi kedinasan.
                  </span>
                </div>
              </div>
              <div class="shrink-0 text-right">
                <span class="text-[10px] font-mono text-slate-400 block">Waktu Verifikasi:</span>
                <span class="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 block">
                  ${formatDateTime(new Date().toISOString())}
                </span>
              </div>
            </div>

          </div>

          <!-- FOOTER -->
          <div class="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400">
            © ${new Date().getFullYear()} ${escapeHtml(namaKkg)} • Kecamatan ${escapeHtml(kec)}, Kabupaten ${escapeHtml(kab)}
          </div>

        </div>

      </div>
    </div>
  `;
}

function renderNotFound(message) {
  return `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 flex items-center justify-center font-sans">
      <div class="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div class="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">
          <i class="fas fa-file-circle-xmark"></i>
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Verifikasi Tidak Ditemukan
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          ${escapeHtml(message)}
        </p>
        <a href="/" class="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors">
          <i class="fas fa-home"></i>
          <span>Kembali ke Beranda Utama</span>
        </a>
      </div>
    </div>
  `;
}

function renderSertifikatVerification(data) {
  const cert = data.sertifikat;
  const instansi = data.instansi || 'Pemerintah Kabupaten Purwakarta - Dinas Pendidikan';
  const org = data.organisasi || 'Kelompok Kerja Guru (KKG) Gugus 3 Wanayasa';
  const tt = cert.tanda_tangan || {};
  const currentUuid = cert.uuid || (window.location.pathname.split('/').pop() || '');
  window.__currentVerifyCert = { ...cert, uuid: currentUuid, tanda_tangan: tt };

  return `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-3xl mx-auto">

        <!-- HEADER NAVIGATION -->
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <a href="/" class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors">
            <i class="fas fa-arrow-left"></i>
            <span>Kembali ke Portal KKG</span>
          </a>
          <div class="flex flex-wrap items-center gap-2">
            <!-- 1. UNDUH PDF RESMI (2 HALAMAN LENGKAP) -->
            <button id="btn-download-cert-pdf" onclick="window.downloadCertificatePDF(window.__currentVerifyCert)" class="inline-flex items-center gap-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-sm transition-colors cursor-pointer" title="Unduh berkas PDF resmi (2 Halaman A4 Landscape) langsung ke HP/Komputer">
              <i class="fas fa-file-pdf text-red-200"></i>
              <span>Unduh PDF Resmi (2 Hal)</span>
            </button>

            <!-- 2. DROPDOWN PILIHAN UNDUH PNG -->
            <div class="relative inline-block text-left" id="verify-png-dropdown-wrapper">
              <button type="button" onclick="const m=document.getElementById('verify-png-menu-items'); m.classList.toggle('hidden');" class="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl shadow-sm transition-colors cursor-pointer" title="Pilihan unduh format gambar PNG HD">
                <i class="fas fa-image"></i>
                <span>Unduh PNG</span>
                <i class="fas fa-chevron-down text-[10px] ml-0.5"></i>
              </button>
              <div id="verify-png-menu-items" class="hidden absolute right-0 mt-2 w-64 rounded-2xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-black/10 dark:ring-white/10 z-50 py-1.5 focus:outline-none">
                <button onclick="document.getElementById('verify-png-menu-items').classList.add('hidden'); window.downloadBothCertificatePNG(window.__currentVerifyCert);" class="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700/60 font-bold flex items-center gap-2.5 cursor-pointer">
                  <i class="fas fa-images text-amber-500 text-sm"></i>
                  <div>
                    <span class="block text-slate-900 dark:text-white font-extrabold">Unduh Keduanya (Depan & Belakang)</span>
                    <span class="text-[10px] font-normal text-slate-500 dark:text-slate-400">2 File PNG HD sekaligus</span>
                  </div>
                </button>
                <div class="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                <button onclick="document.getElementById('verify-png-menu-items').classList.add('hidden'); window.downloadCertificatePNG(window.__currentVerifyCert, 'depan');" class="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-2.5 cursor-pointer">
                  <i class="fas fa-id-card text-emerald-600 text-sm"></i>
                  <div>
                    <span class="block text-slate-900 dark:text-white font-bold">Lembar Depan Saja</span>
                    <span class="text-[10px] font-normal text-slate-500 dark:text-slate-400">Piagam Penghargaan Utama</span>
                  </div>
                </button>
                <button onclick="document.getElementById('verify-png-menu-items').classList.add('hidden'); window.downloadCertificatePNG(window.__currentVerifyCert, 'belakang');" class="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-2.5 cursor-pointer">
                  <i class="fas fa-list-alt text-indigo-600 text-sm"></i>
                  <div>
                    <span class="block text-slate-900 dark:text-white font-bold">Lembar Belakang Saja</span>
                    <span class="text-[10px] font-normal text-slate-500 dark:text-slate-400">Struktur Materi & Alokasi 4 JP</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- 3. CETAK PRINTER -->
            <button onclick="window.printOfficialCertificate(window.__currentVerifyCert)" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer" title="Cetak langsung ke kertas fisik">
              <i class="fas fa-print"></i>
              <span>Cetak Kertas</span>
            </button>
          </div>
        </div>

        <!-- MAIN CERTIFICATE VERIFICATION CARD -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-emerald-200/80 dark:border-slate-700 overflow-hidden">

          <!-- GOLDEN EMERALD OFFICIAL HEADER -->
          <div class="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div class="absolute -right-8 -bottom-8 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -left-8 -top-8 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

            <div class="flex items-center justify-center gap-2.5 mb-2.5">
              <span class="w-10 h-10 rounded-2xl bg-amber-400/20 backdrop-blur-md flex items-center justify-center text-amber-300 text-lg border border-amber-300/30">
                <i class="fas fa-award"></i>
              </span>
              <span class="text-xs font-extrabold uppercase tracking-widest text-amber-300">Pangkalan Verifikasi E-Sertifikat Pelatihan KKG</span>
            </div>

            <h1 class="text-xl sm:text-2xl font-black tracking-tight leading-tight uppercase">
              ${escapeHtml(instansi)}
            </h1>
            <p class="text-sm font-semibold text-emerald-100/90 tracking-wide uppercase mt-1">
              ${escapeHtml(org)}
            </p>
          </div>

          <!-- VERIFIED BADGE -->
          <div class="p-6 sm:p-8 border-b border-emerald-100 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div class="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/25 shrink-0">
                <i class="fas fa-certificate"></i>
              </div>
              <div class="flex-1">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  E-Sertifikat Sah & Terverifikasi
                </div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Bukti Dukung Resmi Pengelolaan Kinerja Guru (PMM)
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nomor Registrasi: <span class="font-mono font-bold text-emerald-700 dark:text-emerald-300">${escapeHtml(cert.nomor_sertifikat)}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- METADATA GRID -->
          <div class="p-6 sm:p-8 space-y-6">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

              <!-- Nama Peserta -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nama Lengkap Penerima
                </span>
                <span class="text-base font-extrabold text-slate-900 dark:text-slate-100 block">
                  ${escapeHtml(cert.nama_peserta)}
                </span>
                <span class="text-xs font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                  NIP: ${escapeHtml(cert.nip_peserta || '-')}
                </span>
              </div>

              <!-- Unit Kerja -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Unit Kerja / Satuan Pendidikan
                </span>
                <span class="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 block">
                  ${escapeHtml(cert.unit_kerja || '-')}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Peran: <strong class="text-slate-700 dark:text-slate-200">${escapeHtml(cert.peran || 'Peserta Aktif')}</strong>
                </span>
              </div>

              <!-- Kegiatan & Materi -->
              <div class="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Materi Pokok / Agenda Pelatihan KKG
                </span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed block">
                  ${escapeHtml(cert.nama_kegiatan)}
                </span>
                ${cert.materi_pokok ? `
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    ${escapeHtml(cert.materi_pokok)}
                  </p>
                ` : ''}
              </div>

              <!-- Waktu & Durasi JP -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Alokasi Waktu Pelatihan
                </span>
                <span class="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 block">
                  <i class="fas fa-hourglass-half mr-1.5 text-amber-500"></i>${cert.alokasi_jp || 4} Jam Pelajaran (JP)
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                  Ekuivalen Pelatihan Komunitas Belajar KKG
                </span>
              </div>

              <!-- Tanggal Pelaksanaan -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Tanggal Pelaksanaan Kegiatan
                </span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  <i class="fas fa-calendar-check text-emerald-600 mr-1.5"></i>${formatDate(cert.tanggal_kegiatan)}
                </span>
                <span class="text-[11px] text-slate-400 block mt-1">
                  Diterbitkan: ${formatDateTime(cert.issued_at)}
                </span>
              </div>

              <!-- Pejabat Pengesah -->
              <div class="md:col-span-2 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60">
                <span class="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-2">
                  Pejabat Penandatangan & Pengesah
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">${escapeHtml(tt.jabatan_ketua || 'Ketua KKG Gugus 3')}</span>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-100 block mt-0.5">${escapeHtml(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd')}</span>
                    <span class="text-[11px] font-mono text-slate-500 block">NIP. ${escapeHtml(tt.nip_ketua || '197009212005011007')}</span>
                  </div>
                  <div class="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">${escapeHtml(tt.jabatan_pengawas || 'Pengawas Pembina Korwil V')}</span>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-100 block mt-0.5">${escapeHtml(tt.pengawas_pembina || 'DIDIN SAMSUDIN, S.Pd.,M.Pd')}</span>
                    <span class="text-[11px] font-mono text-slate-500 block">NIP. ${escapeHtml(tt.nip_pengawas || '198208182009021004')}</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- SECURITY FOOTER -->
            <div class="rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div class="flex items-center gap-3">
                <span class="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0">
                  <i class="fas fa-shield-alt"></i>
                </span>
                <div>
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Keaslian Dokumen Terjamin Secara Digital
                  </span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                    Data sertifikat tersinkronisasi langsung dengan pangkalan data presensi digital KKG Gugus 3 Wanayasa.
                  </span>
                </div>
              </div>
              <div class="shrink-0 text-right">
                <span class="text-[10px] font-mono text-slate-400 block">Status Bukti Dukung:</span>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <i class="fas fa-check-double text-xs"></i> Siap Diunggah ke PMM
                </span>
              </div>
            </div>

          </div>

          <!-- CARD FOOTER -->
          <div class="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400">
            © ${new Date().getFullYear()} ${escapeHtml(org)} • Dinas Pendidikan Kabupaten Purwakarta
          </div>

        </div>

      </div>
    </div>
  `;
}

if (typeof window.printOfficialCertificate !== 'function') {
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
}

