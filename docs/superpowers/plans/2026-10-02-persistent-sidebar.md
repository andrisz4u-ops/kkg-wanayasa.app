# Sidebar Paper Studio di seluruh halaman

Pengguna meminta sidebar tetap terlihat ketika membuka RPP dan fitur lain. Koreksi ini melanjutkan pilihan Paper Studio dengan menu atas serta navigasi kiri.

Sidebar desktop selebar 232 px berada di bawah menu atas, mempunyai gulir sendiri dan memakai tujuan menu yang sudah tersedia. Semua kelompok terbuka dan posisi gulir menampakkan halaman aktif. Pengguna biasa, operator, admin dan super admin tetap menerima tujuan sesuai izin yang sama. Panel kontrol admin memakai layout tersendiri dan sudah memiliki sidebar internal.

Konten halaman berada di kanan. Pada beranda desktop, panel alat lama disembunyikan agar tidak berulang; pada ponsel panel tersebut, drawer dan navigasi bawah dipertahankan. Sidebar desktop muncul mulai 1024 px. Mode cetak dan presentasi layar penuh menyembunyikan navigasi.

Prompt, payload, provider, penyimpanan dan renderer RPP/CP tetap dilindungi. Verifikasi mencakup izin menu, perpindahan fitur, reflow desktop/ponsel, hash sumber terlindungi, tes proyek dan build.

Verifikasi selesai: 573 tes dalam 36 berkas lulus; build berhasil; 172 sumber terlindungi tetap identik menurut SHA-256. Browser memperlihatkan sidebar pada RPP dan Analisis CP, 17 tujuan akun admin dan penanda aktif. Pada 375 px drawer bekerja tanpa overflow; pada 1024 px sidebar tampil tanpa overflow. Bukti visual disimpan di `docs/design/persistent-sidebar/hasil-rpp.png`. Pratinjau lokal berjalan di `http://127.0.0.1:5173/rpp`.
