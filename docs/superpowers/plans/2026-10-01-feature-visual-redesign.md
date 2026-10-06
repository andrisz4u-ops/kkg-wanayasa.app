# Redesain tampilan fitur RuangKKG

Permintaan: seluruh tampilan fitur dibuat lebih baik dan futuristik, tanpa mengubah prompt atau format hasil yang sudah baik.

## Batas implementasi

- Desain meneruskan teal, navy, dan bidang kerja terang dari dashboard yang sudah disetujui.
- Lapisan tampilan bersama mengubah penanda kelas visual saja. Modul generator dan server tidak diedit.
- Kanvas hasil, pratinjau slide dan presentasi, ilustrasi SVG, dan area permainan dilindungi dari penanda visual. Gaya baru berlaku untuk layar saja.
- Panel administrasi mengikuti identitas yang sama, dengan navigasi navy dan tombol tanpa dekorasi berlebihan.
- Tidak ada pemanggilan generator berbayar atau perubahan data pengguna untuk pemeriksaan tampilan.

## Langkah

- [x] Petakan formulir, hasil, dan file pengolah dokumen; simpan hash sumber sebelum perubahan.
- [x] Tambahkan desain bersama untuk formulir, judul, tombol, kartu, tabel, dan dialog.
- [x] Sesuaikan shell administrasi.
- [x] Periksa semua halaman dan dialog perwakilan di layar besar dan kecil. Area hasil diperiksa lewat pengujian batas DOM, bukan generasi AI berbayar.
- [x] Jalankan pemeriksaan batas perubahan, pengujian dokumen terkait, dan build.
- [x] Audit antislop setelah pengerjaan dan simpan bukti tampilan.

## Verifikasi

Build berhasil. Sebanyak 164 tes dalam 12 berkas lulus, termasuk RPP DOCX, asesmen, slide, analisis CP, program sekolah, Prota/Promes/KKTP, SPPD, TTS, game, arsip, dashboard, serta batas desain baru. Hash 154 berkas sumber server dan halaman fitur identik dengan sebelum tahap ini. Helper DOCX dan utilitas bersama juga tidak memiliki perubahan pada diff Git.

Pemeriksaan browser mencakup 21 rute fitur, delapan tab administrasi, dialog arsip RPP, galeri visual asesmen, pengaturan slide, penghitung RPP/soal, pilihan dimensi profil, dan menu administrasi dengan Escape serta pemulihan fokus. Lebar 375, 390, dan 768 piksel diperiksa untuk halaman perwakilan; seluruh 18 halaman area kerja diperiksa pada 390 piksel. Tabel panjang tetap dapat digulir di wadah tabelnya. Tidak ada perubahan sumber prompt, payload, renderer hasil, atau pengunduh.
