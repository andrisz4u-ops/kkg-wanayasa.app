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

  return `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-3xl mx-auto">

        <!-- HEADER NAVIGATION -->
        <div class="mb-4 flex items-center justify-between no-print">
          <a href="/" class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors">
            <i class="fas fa-arrow-left"></i>
            <span>Kembali ke Portal KKG</span>
          </a>
          <button onclick="window.print()" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer">
            <i class="fas fa-print"></i>
            <span>Cetak Bukti Verifikasi PMM</span>
          </button>
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

