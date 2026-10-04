/**
 * E-Sertifikat KKG Gugus 3 Wanayasa — Standar PMM Kemendikdasmen RI
 * Engine Pembuat Berkas Sertifikat Resmi (Direct PDF, HD PNG Depan/Belakang, & Print Dialog)
 * Tata Letak Proporsional Penuh A4 Landscape (Bebas Ruang Kosong Bawah)
 */

(function () {
  'use strict';

  // Helper lazy-loader jsPDF lokal tanpa CDN
  async function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) {
      return window.jspdf.jsPDF;
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/static/vendor/jspdf.umd.min.js';
      script.onload = () => {
        if (window.jspdf && window.jspdf.jsPDF) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(new Error('jsPDF tidak dapat dimuat'));
        }
      };
      script.onerror = () => reject(new Error('Gagal memuat pustaka jsPDF'));
      document.head.appendChild(script);
    });
  }

  function getSigners(cert) {
    return cert.tanda_tangan || {
      ketua_kkg: 'MAMAN RUKMAN, S.Pd',
      nip_ketua: '197009212005011007',
      jabatan_ketua: 'Ketua KKG Gugus 3',
      pengawas_pembina: 'DIDIN SAMSUDIN, S.Pd.,M.Pd',
      nip_pengawas: '198208182009021004',
      jabatan_pengawas: 'Pengawas Pembina Korwil V'
    };
  }

  function formatDateId(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  }

  function sanitizeFilename(name) {
    return (name || 'Peserta').replace(/[^a-zA-Z0-9_\-]/g, '_');
  }

  // Load QR Image safely
  function loadQrImage(uuid) {
    return new Promise((resolve) => {
      const origin = window.location.origin;
      const verifyUrl = `${origin}/verify/sertifikat/${uuid}`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(verifyUrl)}`;
      setTimeout(() => resolve(null), 2500);
    });
  }

  // =========================================================================
  // RENDER LEMBAR 1: SERTIFIKAT UTAMA (CANVAS 2376 x 1680 ~ A4 200 DPI)
  // Distribusi Vertikal Seimbang Penuh (Tanpa Ruang Kosong Bawah)
  // =========================================================================
  async function createPage1Canvas(cert) {
    const canvas = document.createElement('canvas');
    canvas.width = 2376;
    canvas.height = 1680;
    const ctx = canvas.getContext('2d');
    const tt = getSigners(cert);
    const dateFormatted = formatDateId(cert.tanggal_kegiatan);
    const W = canvas.width;
    const H = canvas.height;

    // 1. Background Radial Ivory Halus
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W / 1.3);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.68, '#fffdf7');
    bgGrad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Ornate Double Gold Borders (Margin 48px luar, 66px dalam)
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 8;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(66, 66, W - 132, H - 132);

    // Corner Ornaments
    const drawCorner = (x, y, dx, dy) => {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y + dy * 45);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * 45, y);
      ctx.stroke();

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(x + dx * 16, y + dy * 16, 4, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(56, 56, 1, 1);
    drawCorner(W - 56, 56, -1, 1);
    drawCorner(56, H - 56, 1, -1);
    drawCorner(W - 56, H - 56, -1, -1);

    // 3. Kop Header Resmi
    ctx.textAlign = 'center';

    // Bintang Penghargaan
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillText('★   ★   ★', W / 2, 130);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText('PEMERINTAH KABUPATEN PURWAKARTA • DINAS PENDIDIKAN', W / 2, 180);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 46px "Segoe UI", Arial, sans-serif';
    ctx.fillText('KELOMPOK KERJA GURU (KKG) GUGUS 3 WANAYASA', W / 2, 238);

    ctx.fillStyle = '#64748b';
    ctx.font = '22px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Sekretariat: SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta', W / 2, 280);

    // Divider Line Kop
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 450, 310);
    ctx.lineTo(W / 2 + 450, 310);
    ctx.stroke();

    // 4. Nomor Sertifikat
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`Nomor: ${cert.nomor_sertifikat}`, W / 2, 365);

    // 5. Judul Besar SERTIFIKAT
    ctx.fillStyle = '#92400e';
    ctx.font = '900 90px "Segoe UI", Arial, sans-serif';
    ctx.fillText('SERTIFIKAT', W / 2, 470);

    // 6. Penerima
    ctx.fillStyle = '#64748b';
    ctx.font = '26px "Segoe UI", sans-serif';
    ctx.fillText('Diberikan kepada:', W / 2, 545);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 60px "Segoe UI", Arial, sans-serif';
    const recipientName = (cert.nama_peserta || 'PESERTA').toUpperCase();
    ctx.fillText(recipientName, W / 2, 630);

    // Garis Bawah Emas Penerima
    const textWidth = ctx.measureText(recipientName).width;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W / 2 - textWidth / 2 - 25, 650);
    ctx.lineTo(W / 2 + textWidth / 2 + 25, 650);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`NIP. ${cert.nip_peserta || '-'}`, W / 2, 698);

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillText(cert.unit_kerja || 'SDN Gugus 3 Wanayasa', W / 2, 745);

    // 7. Narasi Partisipasi
    ctx.fillStyle = '#334155';
    ctx.font = '28px "Segoe UI", sans-serif';
    ctx.fillText(`Atas partisipasi aktifnya sebagai ${cert.peran || 'Peserta Aktif'} dalam Kegiatan Pelatihan Guru Berkelanjutan:`, W / 2, 825);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`"${cert.nama_kegiatan}"`, W / 2, 895);

    ctx.fillStyle = '#475569';
    ctx.font = '26px "Segoe UI", sans-serif';
    ctx.fillText(`Dengan alokasi waktu setara ${cert.alokasi_jp || 4} Jam Pelajaran (JP) pada tanggal ${dateFormatted}.`, W / 2, 955);

    // 8. Divider Pemisah Tanda Tangan
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 1030);
    ctx.lineTo(W - 140, 1030);
    ctx.stroke();

    // 9. Tanda Tangan & QR Code Verifikasi (Diposisikan Proporsional di Bawah)
    const qrImg = await loadQrImage(cert.uuid);

    // --- SISI KIRI: Pengawas Pembina Korwil V ---
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText('Mengetahui,', 140, 1100);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.fillText(tt.jabatan_pengawas || 'Pengawas Pembina Korwil V', 140, 1142);

    // Badge Digital Seal Kiri
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(140, 1175, 340, 42);
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.strokeRect(140, 1175, 340, 42);
    ctx.fillStyle = '#047857';
    ctx.font = 'italic 20px "Segoe UI", sans-serif';
    ctx.fillText('✓ Ditandatangani Secara Digital', 155, 1204);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillText(tt.pengawas_pembina || 'DIDIN SAMSUDIN, S.Pd.,M.Pd', 140, 1425);
    const pWidth = ctx.measureText(tt.pengawas_pembina || 'DIDIN SAMSUDIN, S.Pd.,M.Pd').width;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(140, 1435);
    ctx.lineTo(140 + pWidth, 1435);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`NIP. ${tt.nip_pengawas || '198208182009021004'}`, 140, 1475);

    // --- TENGAH: QR Code Verifikasi PMM ---
    ctx.textAlign = 'center';
    const qrSize = 190;
    const qrBoxX = W / 2 - qrSize / 2;
    const qrBoxY = 1090;

    if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrSize, qrSize);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrBoxX, qrBoxY, qrSize, qrSize);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(qrBoxX, qrBoxY, qrSize, qrSize);
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 44px "Segoe UI", sans-serif';
      ctx.fillText('QR CODE', W / 2, qrBoxY + 110);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText('KODE VERIFIKASI PMM:', W / 2, qrBoxY + 225);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`${cert.uuid.substring(0, 16)}...`, W / 2, qrBoxY + 258);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('✓ Dokumen Terverifikasi Sah', W / 2, qrBoxY + 290);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('Portal KKG Gugus 3 Wanayasa', W / 2, qrBoxY + 320);

    // --- SISI KANAN: Ketua KKG Gugus 3 ---
    ctx.textAlign = 'right';
    const rightX = W - 140;
    ctx.fillStyle = '#475569';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText(`Wanayasa, ${dateFormatted}`, rightX, 1100);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.fillText(tt.jabatan_ketua || 'Ketua KKG Gugus 3', rightX, 1142);

    // Badge Digital Seal Kanan
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(rightX - 340, 1175, 340, 42);
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX - 340, 1175, 340, 42);
    ctx.fillStyle = '#047857';
    ctx.font = 'italic 20px "Segoe UI", sans-serif';
    ctx.fillText('✓ Ditandatangani Secara Digital', rightX - 325, 1204);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd', rightX, 1425);
    const kWidth = ctx.measureText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd').width;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rightX - kWidth, 1435);
    ctx.lineTo(rightX, 1435);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`NIP. ${tt.nip_ketua || '197009212005011007'}`, rightX, 1475);

    return canvas;
  }

  // =========================================================================
  // RENDER LEMBAR 2: STRUKTUR PROGRAM & ALOKASI WAKTU 4 JP
  // Distribusi Vertikal Seimbang & Jelas (Standar PMM)
  // =========================================================================
  function createPage2Canvas(cert) {
    const canvas = document.createElement('canvas');
    canvas.width = 2376;
    canvas.height = 1680;
    const ctx = canvas.getContext('2d');
    const tt = getSigners(cert);
    const dateFormatted = formatDateId(cert.tanggal_kegiatan);
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(66, 66, W - 132, H - 132);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText('LAMPIRAN E-SERTIFIKAT KEGIATAN KKG GUGUS 3 WANAYASA', W / 2, 140);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 46px "Segoe UI", sans-serif';
    ctx.fillText('STRUKTUR PROGRAM & MATERI PELATIHAN (4 JP)', W / 2, 205);

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`Nomor Sertifikat: ${cert.nomor_sertifikat}`, W / 2, 255);

    // Garis Pembatas
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(140, 285);
    ctx.lineTo(W - 140, 285);
    ctx.stroke();

    // Box Identitas Peserta
    const boxX = 140;
    const boxY = 320;
    const boxW = W - 280;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(boxX, boxY, boxW, 200);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, 200);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(`Nama Peserta    : ${cert.nama_peserta}`, boxX + 32, boxY + 50);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`NIP Peserta     : ${cert.nip_peserta || '-'}`, boxX + 32, boxY + 95);

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(`Unit Kerja      : ${cert.unit_kerja || 'SDN Gugus 3 Wanayasa'}`, boxX + 32, boxY + 140);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(`Tema Kegiatan   : ${cert.nama_kegiatan}`, boxX + 32, boxY + 185);

    // Tabel Materi 4 JP
    const tblX = 140;
    const tblY = 560;
    const tblW = W - 280;
    const colNo = 100;
    const colTime = 260;
    const colMat = tblW - colNo - colTime;

    // Header Tabel
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(tblX, tblY, tblW, 70);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(tblX, tblY, tblW, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No', tblX + colNo / 2, tblY + 44);
    ctx.textAlign = 'left';
    ctx.fillText('Materi / Pokok Bahasan Kegiatan', tblX + colNo + 32, tblY + 44);
    ctx.textAlign = 'center';
    ctx.fillText('Alokasi Waktu', tblX + colNo + colMat + colTime / 2, tblY + 44);

    const rows = [
      {
        no: '1.',
        title: 'Penguatan Regulasi & Kebijakan Pendidikan Dasar:',
        sub: 'Penyelarasan Standar Kurikulum Nasional & Karakter Budaya Purwakarta',
        time: '1 JP'
      },
      {
        no: '2.',
        title: 'Materi Inti & Pendalaman Praktis:',
        sub: cert.materi_pokok || cert.nama_kegiatan,
        time: '2 JP'
      },
      {
        no: '3.',
        title: 'Refleksi Kolaboratif & Rencana Tindak Lanjut (RTL):',
        sub: 'Implementasi di Satuan Pendidikan & Berbagi Praktik Baik di Komunitas Belajar',
        time: '1 JP'
      }
    ];

    let curY = tblY + 70;
    rows.forEach((r, idx) => {
      const rowH = 135;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(tblX, curY, tblW, rowH);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(tblX, curY, tblW, rowH);

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.fillText(r.no, tblX + colNo / 2, curY + 75);

      ctx.textAlign = 'left';
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.fillText(r.title, tblX + colNo + 32, curY + 55);
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(r.sub, tblX + colNo + 32, curY + 95);

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.fillText(r.time, tblX + colNo + colMat + colTime / 2, curY + 75);

      curY += rowH;
    });

    // Baris Total Alokasi Waktu
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(tblX, curY, tblW, 70);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(tblX, curY, tblW, 70);

    ctx.fillStyle = '#065f46';
    ctx.textAlign = 'right';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText('TOTAL ALOKASI WAKTU :', tblX + colNo + colMat - 30, curY + 45);

    ctx.textAlign = 'center';
    ctx.font = '900 28px "Segoe UI", sans-serif';
    ctx.fillText('4 JP', tblX + colNo + colMat + colTime / 2, curY + 45);

    // Pengesahan Lembar 2 (Ketua KKG Gugus 3 di Kanan Bawah)
    const signY = 1180;
    const rightX = W - 140;

    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText(`Wanayasa, ${dateFormatted}`, rightX, signY);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.fillText(tt.jabatan_ketua || 'Ketua KKG Gugus 3', rightX, signY + 42);

    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(rightX - 340, signY + 75, 340, 42);
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX - 340, signY + 75, 340, 42);
    ctx.fillStyle = '#047857';
    ctx.font = 'italic 20px "Segoe UI", sans-serif';
    ctx.fillText('✓ Disahkan Secara Digital', rightX - 325, signY + 104);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd', rightX, signY + 230);
    const kWidth = ctx.measureText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd').width;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rightX - kWidth, signY + 240);
    ctx.lineTo(rightX, signY + 240);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`NIP. ${tt.nip_ketua || '197009212005011007'}`, rightX, signY + 278);

    return canvas;
  }

  // Helper trigger unduh file blob
  function triggerDownloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // =========================================================================
  // EXPORT 1: UNDUH DIRECT PDF A4 LANDSCAPE (2 HALAMAN LENGKAP)
  // =========================================================================
  window.downloadCertificatePDF = async function (cert) {
    if (!cert) return;
    const btn = document.getElementById('btn-download-cert-pdf');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Membuat PDF...';
      btn.disabled = true;
    }

    try {
      if (typeof window.showToast === 'function') {
        window.showToast('Sedang membuat berkas PDF E-Sertifikat...', 'info');
      }

      const jsPDFClass = await ensureJsPdf();
      const canvas1 = await createPage1Canvas(cert);
      const canvas2 = createPage2Canvas(cert);

      const doc = new jsPDFClass({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Halaman 1: Piagam Sertifikat Utama
      const img1 = canvas1.toDataURL('image/jpeg', 0.96);
      doc.addImage(img1, 'JPEG', 0, 0, 297, 210);

      // Halaman 2: Lampiran Struktur Materi 4 JP
      doc.addPage('a4', 'landscape');
      const img2 = canvas2.toDataURL('image/jpeg', 0.96);
      doc.addImage(img2, 'JPEG', 0, 0, 297, 210);

      const filename = `Sertifikat_${sanitizeFilename(cert.nama_peserta)}_${sanitizeFilename(cert.nama_kegiatan)}.pdf`;
      doc.save(filename);

      if (typeof window.showToast === 'function') {
        window.showToast('E-Sertifikat PDF 2 Halaman berhasil diunduh!', 'success');
      }
    } catch (e) {
      console.error('Download PDF error:', e);
      alert('Gagal membuat PDF: ' + (e.message || 'Terjadi kesalahan sistem'));
    } finally {
      if (btn) {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    }
  };

  // =========================================================================
  // EXPORT 2: UNDUH GAMBAR PNG HD (Bisa Depan Saja, Belakang Saja, atau Keduanya)
  // =========================================================================
  window.downloadCertificatePNG = async function (cert, side = 'depan') {
    if (!cert) return;
    try {
      const isBack = side === 'belakang';
      const label = isBack ? 'Belakang (Struktur Materi)' : 'Depan (Sertifikat)';
      if (typeof window.showToast === 'function') {
        window.showToast(`Menyiapkan gambar ${label}...`, 'info');
      }

      const canvas = isBack ? createPage2Canvas(cert) : await createPage1Canvas(cert);
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Gagal menghasilkan blob gambar');
        const suffix = isBack ? 'Belakang_Struktur_4JP' : 'Depan_Sertifikat';
        const filename = `Sertifikat_${suffix}_${sanitizeFilename(cert.nama_peserta)}.png`;
        triggerDownloadBlob(blob, filename);

        if (typeof window.showToast === 'function') {
          window.showToast(`Gambar ${label} berhasil diunduh!`, 'success');
        }
      }, 'image/png');
    } catch (e) {
      console.error('Download PNG error:', e);
      alert('Gagal menyimpan gambar: ' + (e.message || 'Terjadi kesalahan sistem'));
    }
  };

  // Unduh Sekaligus Kedua Halaman PNG (Depan & Belakang)
  window.downloadBothCertificatePNG = async function (cert) {
    if (!cert) return;
    if (typeof window.showToast === 'function') {
      window.showToast('Menyiapkan kedua gambar (Depan & Belakang)...', 'info');
    }

    await window.downloadCertificatePNG(cert, 'depan');
    setTimeout(async () => {
      await window.downloadCertificatePNG(cert, 'belakang');
    }, 600);
  };

  // Ekspor internal untuk keperluan pratinjau canvas presisi
  window.__createPage1Canvas = createPage1Canvas;
  window.__createPage2Canvas = createPage2Canvas;

  // =========================================================================
  // EXPORT 3: CETAK RESMI DIALOG PRINTER (IDENTIK 100% DENGAN HASIL PDF/PNG)
  // =========================================================================
  window.printOfficialCertificate = async function (cert) {
    if (!cert) return;
    try {
      if (typeof window.showToast === 'function') {
        window.showToast('Menyiapkan lembar cetak A4 landscape...', 'info');
      }

      const canvas1 = await createPage1Canvas(cert);
      const canvas2 = createPage2Canvas(cert);

      const img1 = canvas1.toDataURL('image/jpeg', 0.98);
      const img2 = canvas2.toDataURL('image/jpeg', 0.98);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak.');
        return;
      }

      printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Cetak_Sertifikat_${sanitizeFilename(cert.nama_peserta)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
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
    }
    .page {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      break-after: page;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  </style>
</head>
<body>
  <div class="page">
    <img src="${img1}" alt="Sertifikat Lembar 1 (Piagam)" />
  </div>
  <div class="page">
    <img src="${img2}" alt="Sertifikat Lembar 2 (Struktur Materi 4 JP)" />
  </div>
  <script>
    setTimeout(function() {
      window.focus();
      window.print();
    }, 400);
  </script>
</body>
</html>
      `);
      printWindow.document.close();
    } catch (e) {
      console.error('Print certificate error:', e);
      alert('Gagal menyiapkan cetak: ' + (e.message || 'Terjadi kesalahan sistem'));
    }
  };

})();
