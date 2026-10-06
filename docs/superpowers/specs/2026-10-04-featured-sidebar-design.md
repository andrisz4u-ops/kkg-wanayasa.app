# Sidebar fitur unggulan

Tanggal: 4 Oktober 2026.

Pengguna menetapkan isi sidebar per peran dan meminta daftar lebih lega, tanpa perlu menggulir pada layar kerja laptop.

## Susunan

Guru: Beranda, Analisis CP, RPP, Asesmen, Slide, Game Edukasi.

Admin, Operator dan Super admin: daftar Guru, dilanjutkan Program dan Panel Kontrol.

Program membuka `program-sekolah`; Panel Kontrol membuka `admin`. Daftar mengambil tujuan dari konfigurasi navigasi yang lolos izin pengguna, lalu mengurutkannya sesuai permintaan. Tujuan yang tidak tersedia tidak ditambahkan.

## Komposisi

- Satu kelompok Fitur unggulan mengurangi pengulangan judul kategori.
- Label RPP, Asesmen, Slide dan Program dibuat ringkas agar mudah dipindai, termasuk dalam rail.
- Daftar pendek menggantikan kolom pencarian sidebar sehingga ruang vertikal tersedia untuk tujuan utama.
- Jarak antarbutir 6 px, atau 4 px pada layar pendek, menjaga pemisahan tujuan tanpa memperpanjang daftar.
- Logo dan rail memakai skala lebih rapat pada tinggi layar hingga 760 px. Semua tombol tetap memiliki tinggi minimal 44 px.
- Warna hutan, penanda aktif mint, efek interaksi dan fokus keyboard mengikuti Studio Hijau Organik, ENERGY 3 / RHYTHM 3 / MOTION 2.

Header dan drawer ponsel menyediakan navigasi lengkap sesuai izin. Preferensi rail tersimpan per akun. Navigasi memakai tombol dengan nama yang jelas dan penanda halaman aktif hanya ketika tujuan tersebut memang ada di sidebar.

## Verifikasi

Tes memastikan urutan dan label per peran, izin, navigasi lengkap header/drawer, tujuan yang tidak tersedia, penanda aktif, preferensi rail dan perilaku menu keyboard. Browser memeriksa menu tanpa gulir pada 1366 x 768 dan 1280 x 650, tema terang/gelap, mode lebar/ringkas, klik delapan tujuan, akses Forum dari header dan drawer ponsel 390 px.
