/**
 * E-Sertifikat KKG Gugus 3 Wanayasa — Standar PMM Kemendikdasmen RI
 * Engine pembuat berkas sertifikat resmi (Direct PDF, HD PNG, & Print Dialog)
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
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;
      setTimeout(() => resolve(null), 2500);
    });
  }

  // RENDER LEMBAR 1: SERTIFIKAT UTAMA (CANVAS 2376 x 1680 ~ A4 200 DPI)
  async function createPage1Canvas(cert) {
    const canvas = document.createElement('canvas');
    canvas.width = 2376;
    canvas.height = 1680;
    const ctx = canvas.getContext('2d');
    const tt = getSigners(cert);
    const dateFormatted = formatDateId(cert.tanggal_kegiatan);
    const W = canvas.width;
    const H = canvas.height;

    // 1. Background Radial Ivory
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W / 1.4);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.65, '#fffdf8');
    bgGrad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Ornate Double Gold Borders
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(56, 56, W - 112, H - 112);

    // Corner Ornaments
    const drawCorner = (x, y, dx, dy) => {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y + dy * 36);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * 36, y);
      ctx.stroke();
    };
    drawCorner(48, 48, 1, 1);
    drawCorner(W - 48, 48, -1, 1);
    drawCorner(48, H - 48, 1, -1);
    drawCorner(W - 48, H - 48, -1, -1);

    // 3. Kop Header
    ctx.textAlign = 'center';

    // Ribbon Icon Decoration
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText('★ ★ ★', W / 2, 115);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('PEMERINTAH KABUPATEN PURWAKARTA • DINAS PENDIDIKAN', W / 2, 155);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 40px "Segoe UI", Arial, sans-serif';
    ctx.fillText('KELOMPOK KERJA GURU (KKG) GUGUS 3 WANAYASA', W / 2, 205);

    ctx.fillStyle = '#64748b';
    ctx.font = '20px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Sekretariat: SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta', W / 2, 240);

    // Divider Line
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 400, 260);
    ctx.lineTo(W / 2 + 400, 260);
    ctx.stroke();

    // 4. Nomor Sertifikat & Title
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`Nomor: ${cert.nomor_sertifikat}`, W / 2, 305);

    ctx.fillStyle = '#92400e';
    ctx.font = '900 76px "Segoe UI", Arial, sans-serif';
    ctx.fillText('SERTIFIKAT', W / 2, 395);

    // 5. Penerima
    ctx.fillStyle = '#64748b';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText('Diberikan kepada:', W / 2, 455);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 52px "Segoe UI", Arial, sans-serif';
    const recipientName = (cert.nama_peserta || 'PESERTA').toUpperCase();
    ctx.fillText(recipientName, W / 2, 530);

    // Garis Bawah Nama
    const textWidth = ctx.measureText(recipientName).width;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W / 2 - textWidth / 2 - 20, 546);
    ctx.lineTo(W / 2 + textWidth / 2 + 20, 546);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`NIP. ${cert.nip_peserta || '-'}`, W / 2, 585);

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.fillText(cert.unit_kerja || 'SDN Gugus 3 Wanayasa', W / 2, 625);

    // 6. Narasi Partisipasi
    ctx.fillStyle = '#334155';
    ctx.font = '26px "Segoe UI", sans-serif';
    ctx.fillText(`Atas partisipasi aktifnya sebagai ${cert.peran || 'Peserta Aktif'} dalam Kegiatan Pelatihan Guru Berkelanjutan:`, W / 2, 695);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`"${cert.nama_kegiatan}"`, W / 2, 755);

    ctx.fillStyle = '#475569';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText(`Dengan alokasi waktu setara ${cert.alokasi_jp || 4} Jam Pelajaran (JP) pada tanggal ${dateFormatted}.`, W / 2, 805);

    // 7. Divider Bawah
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 850);
    ctx.lineTo(W - 120, 850);
    ctx.stroke();

    // 8. Tanda Tangan & QR Code
    const qrImg = await loadQrImage(cert.uuid);

    // Sisi Kiri: Pengawas Pembina Korwil V
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillText('Mengetahui,', 140, 895);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText(tt.jabatan_pengawas || 'Pengawas Pembina Korwil V', 140, 930);

    // Badge Digital Seal
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(140, 955, 300, 36);
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.strokeRect(140, 955, 300, 36);
    ctx.fillStyle = '#047857';
    ctx.font = 'italic 18px "Segoe UI", sans-serif';
    ctx.fillText('✓ Ditandatangani Secara Digital', 152, 980);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(tt.pengawas_pembina || 'DIDIN SAMSUDIN, S.Pd.,M.Pd', 140, 1055);
    const pWidth = ctx.measureText(tt.pengawas_pembina || 'DIDIN SAMSUDIN, S.Pd.,M.Pd').width;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(140, 1062);
    ctx.lineTo(140 + pWidth, 1062);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`NIP. ${tt.nip_pengawas || '198208182009021004'}`, 140, 1092);

    // Tengah: QR Code Verifikasi PMM
    ctx.textAlign = 'center';
    const qrBoxX = W / 2 - 75;
    const qrBoxY = 890;
    if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX, qrBoxY, 150, 150);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrBoxX, qrBoxY, 150, 150);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(qrBoxX, qrBoxY, 150, 150);
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 40px "Segoe UI", sans-serif';
      ctx.fillText('QR', W / 2, qrBoxY + 85);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('KODE VERIFIKASI PMM:', W / 2, qrBoxY + 180);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${cert.uuid.substring(0, 13)}...`, W / 2, qrBoxY + 205);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('✓ Dokumen Terverifikasi Sah', W / 2, qrBoxY + 228);

    // Sisi Kanan: Ketua KKG Gugus 3
    ctx.textAlign = 'right';
    const rightX = W - 140;
    ctx.fillStyle = '#475569';
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillText(`Wanayasa, ${dateFormatted}`, rightX, 895);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText(tt.jabatan_ketua || 'Ketua KKG Gugus 3', rightX, 930);

    // Badge Digital Seal
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(rightX - 300, 955, 300, 36);
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX - 300, 955, 300, 36);
    ctx.fillStyle = '#047857';
    ctx.font = 'italic 18px "Segoe UI", sans-serif';
    ctx.fillText('✓ Ditandatangani Secara Digital', rightX - 288, 980);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd', rightX, 1055);
    const kWidth = ctx.measureText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd').width;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rightX - kWidth, 1062);
    ctx.lineTo(rightX, 1062);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`NIP. ${tt.nip_ketua || '197009212005011007'}`, rightX, 1092);

    return canvas;
  }

  // RENDER LEMBAR 2: STRUKTUR MATERI & ALOKASI WAKTU 4 JP
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

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText('LAMPIRAN E-SERTIFIKAT KEGIATAN KKG', W / 2, 120);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 38px "Segoe UI", sans-serif';
    ctx.fillText('STRUKTUR PROGRAM & MATERI PELATIHAN (4 JP)', W / 2, 175);

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`Nomor Sertifikat: ${cert.nomor_sertifikat}`, W / 2, 215);

    // Garis Pembatas
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 240);
    ctx.lineTo(W - 120, 240);
    ctx.stroke();

    // Rincian Peserta
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillText(`Nama Peserta   : ${cert.nama_peserta}`, 140, 290);
    ctx.fillText(`NIP Peserta    : ${cert.nip_peserta || '-'}`, 140, 325);
    ctx.fillText(`Unit Kerja     : ${cert.unit_kerja || 'SDN Gugus 3 Wanayasa'}`, 140, 360);
    ctx.fillText(`Tema Kegiatan  : ${cert.nama_kegiatan}`, 140, 395);

    // Tabel Materi
    const tblX = 140;
    const tblY = 440;
    const tblW = W - 280;
    const colNo = 80;
    const colTime = 220;
    const colMat = tblW - colNo - colTime;

    // Header Tabel
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(tblX, tblY, tblW, 55);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(tblX, tblY, tblW, 55);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No', tblX + colNo / 2, tblY + 36);
    ctx.textAlign = 'left';
    ctx.fillText('Materi / Pokok Bahasan', tblX + colNo + 24, tblY + 36);
    ctx.textAlign = 'center';
    ctx.fillText('Alokasi Waktu', tblX + colNo + colMat + colTime / 2, tblY + 36);

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
        sub: 'Implementasi di Kelas/Sekolah & Berbagi Praktik Baik di Komunitas Belajar',
        time: '1 JP'
      }
    ];

    let curY = tblY + 55;
    rows.forEach((r, idx) => {
      const rowH = 85;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(tblX, curY, tblW, rowH);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(tblX, curY, tblW, rowH);

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText(r.no, tblX + colNo / 2, curY + 48);

      ctx.textAlign = 'left';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText(r.title, tblX + colNo + 24, curY + 36);
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(r.sub, tblX + colNo + 24, curY + 66);

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText(r.time, tblX + colNo + colMat + colTime / 2, curY + 48);

      curY += rowH;
    });

    // Baris Total
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(tblX, curY, tblW, 55);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(tblX, curY, tblW, 55);

    ctx.fillStyle = '#065f46';
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText('TOTAL ALOKASI WAKTU :', tblX + colNo + colMat - 20, curY + 36);

    ctx.textAlign = 'center';
    ctx.fillText('4 JP', tblX + colNo + colMat + colTime / 2, curY + 36);

    // Pengesahan Lembar 2 (Ketua KKG)
    const signY = curY + 110;
    const rightX = W - 160;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillText(`Wanayasa, ${dateFormatted}`, rightX, signY);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText(tt.jabatan_ketua || 'Ketua KKG Gugus 3', rightX, signY + 35);

    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(rightX - 300, signY + 60, 300, 36);
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX - 300, signY + 60, 300, 36);
    ctx.fillStyle = '#047857';
    ctx.font = 'italic 18px "Segoe UI", sans-serif';
    ctx.fillText('✓ Disahkan Secara Digital', rightX - 288, signY + 85);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd', rightX, signY + 160);
    const kWidth = ctx.measureText(tt.ketua_kkg || 'MAMAN RUKMAN, S.Pd').width;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rightX - kWidth, signY + 167);
    ctx.lineTo(rightX, signY + 167);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`NIP. ${tt.nip_ketua || '197009212005011007'}`, rightX, signY + 197);

    return canvas;
  }

  // 1. UNDUH DIRECT PDF A4 LANDSCAPE (1-CLICK DOWNLOAD KE KOMPUTER/HP)
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

      // Halaman 1
      const img1 = canvas1.toDataURL('image/jpeg', 0.95);
      doc.addImage(img1, 'JPEG', 0, 0, 297, 210);

      // Halaman 2: Lampiran Struktur Materi 4 JP
      doc.addPage('a4', 'landscape');
      const img2 = canvas2.toDataURL('image/jpeg', 0.95);
      doc.addImage(img2, 'JPEG', 0, 0, 297, 210);

      const filename = `Sertifikat_${sanitizeFilename(cert.nama_peserta)}_${sanitizeFilename(cert.nama_kegiatan)}.pdf`;
      doc.save(filename);

      if (typeof window.showToast === 'function') {
        window.showToast('E-Sertifikat PDF berhasil disimpan ke folder Download!', 'success');
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

  // 2. UNDUH DIRECT IMAGE HD (PNG)
  window.downloadCertificatePNG = async function (cert) {
    if (!cert) return;
    const btn = document.getElementById('btn-download-cert-png');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Menyimpan...';
      btn.disabled = true;
    }

    try {
      if (typeof window.showToast === 'function') {
        window.showToast('Menyiapkan gambar sertifikat HD...', 'info');
      }

      const canvas = await createPage1Canvas(cert);
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Gagal menghasilkan blob gambar');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sertifikat_${sanitizeFilename(cert.nama_peserta)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        if (typeof window.showToast === 'function') {
          window.showToast('Gambar sertifikat PNG berhasil disimpan!', 'success');
        }
      }, 'image/png');
    } catch (e) {
      console.error('Download PNG error:', e);
      alert('Gagal menyimpan gambar: ' + (e.message || 'Terjadi kesalahan sistem'));
    } finally {
      if (btn) {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    }
  };

})();
