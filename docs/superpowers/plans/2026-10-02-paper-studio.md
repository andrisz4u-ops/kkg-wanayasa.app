# Pemasangan Paper Studio

Pengguna memilih preview 05 dan meminta pemasangan pada 2 Oktober 2026 dengan menu atas dan panel perangkat ajar di kiri. Persetujuan desain diberikan melalui permintaan tersebut.

## Susunan

1. Pertahankan tujuan menu atas dan izin tiap peran, lalu terapkan tampilan Paper Studio.
2. Ubah dashboard menjadi sambutan serif, panel perangkat ajar di kiri, daftar dokumen di kanan, agenda terdekat ringkas, pengumuman dan komunitas.
3. Pertahankan data akun, createdAt dan pemulihan arsip melalui Buka. Gunakan keadaan tanpa dokumen yang ringkas.
4. Sesuaikan panel alat pada tablet dan ponsel; pertahankan Menu dan navigasi bawah.

## Batas

Generator RPP dan tujuh dokumen Analisis CP, payload, prompt, provider AI, renderer, Word, cetak, unduhan, penyimpanan dan hak akses tidak berubah. Gaya baru hanya menyentuh dashboard dan navigasi, pada media layar. Contoh data preview tidak dimasukkan ke akun pengguna.

## Verifikasi

- Jalankan pengujian proyek dan build.
- Bandingkan hash 172 berkas sumber terlindungi.
- Periksa dashboard kosong dan berisi arsip fixture terpisah, pada ponsel, tablet dan desktop.
- Periksa akses fitur, menu atas dan mobile, serta pemulihan fokus.
- Bandingkan kanvas tujuh keluaran CP pada bingkai lama dan Paper Studio dengan data fixture yang sama.
- Lakukan audit antislop setelah pekerjaan sesuai preferensi pengguna; rekam bukti dan batas pengujian.

Status: pemasangan dan verifikasi selesai pada 2 Oktober 2026.

## Hasil

- Menu atas tersedia mulai 1024 px; panel alat berada di kiri pada desktop dan laptop. Pada tablet kecil dan ponsel, panel alat tersusun di atas dokumen.
- Nama dokumen mendapat ruang utama; tanggal 120 px dan aksi 100 px pada tabel desktop. Ponsel memindahkan tanggal dan Buka ke bawah judul.
- 573 tes pada 36 berkas lulus. Build produksi dan pemeriksaan diff berhasil. Tidak ada aset QA dalam dist.
- SHA-256 untuk 172 berkas terlindungi: 0 perubahan.
- Ketujuh kanvas CP memiliki HTML identik, hash gaya untuk 478 properti per elemen sama, dan ukuran elemen sama pada 1658 elemen.
- Dashboard kosong dan fixture empat arsip diperiksa di 320, 375, 768, 1024, 1280, 1440 dan 1920 px. Tidak ada overflow horizontal.
- Sembilan pintasan diperiksa di browser. Escape, pemulihan fokus, serta penahanan Tab pada drawer diperiksa.
- Laporan dan tangkapan layar berada di docs/design/paper-studio. Audit antislop berada di anti-slop/audit-008-2026-10-02.md.

Batas verifikasi: generator AI tidak dipanggil ulang dan tidak memakai kredit layanan. Perlindungan dibuktikan melalui sumber, tes yang tersedia dan perbandingan renderer dengan fixture yang sama. Perangkat sentuh fisik tidak diuji.
