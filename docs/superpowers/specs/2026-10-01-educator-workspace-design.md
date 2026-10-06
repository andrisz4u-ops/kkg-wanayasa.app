# Redesain ruang kerja pendidik

Rancangan disetujui pengguna pada 1 Oktober 2026. Prioritas pertama adalah beranda setelah login untuk semua peran.

## Perilaku

- Semua pengguna memakai beranda dan shell yang sama. Menu pengelolaan tampil menurut peran yang sudah didukung aplikasi.
- Tindakan utama menuju generator RPP, asesmen, slide, dan presensi yang sudah ada.
- Riwayat RPP, asesmen, dan slide memakai arsip lokal yang sudah dipisahkan dengan ID pengguna. Membuka dokumen memulihkan hasil di modul asalnya.
- Agenda memakai tanggal kalender lokal, mengabaikan tanggal tidak valid dan kegiatan sebelum hari ini, lalu mengurutkan waktu secara naik.
- Pengumuman, forum, dan materi memakai endpoint aplikasi yang sudah tersedia. Kegagalan satu sumber tidak menghalangi akses generator atau sumber lain.
- Panel persetujuan akun mengambil data hanya untuk admin/super admin. Operator mendapat pintasan operasional tanpa permintaan data persetujuan.
- Data kosong menampilkan penjelasan dan tindakan yang berguna. Data gagal dimuat memberi status kesalahan dan tombol coba lagi, tidak ditampilkan sebagai angka nol.

## Struktur implementasi

- Pisahkan renderer beranda pengguna dari renderer beranda publik di `home.js`.
- Pisahkan shell ruang kerja ke `layouts/workspace.js`; routing dan pemeriksaan hak akses tetap di `main.js`.
- Tambahkan gaya workspace yang memiliki ruang nama tersendiri sehingga halaman publik tidak terpengaruh.
- Gunakan callback pemulihan arsip yang sudah ada pada RPP, asesmen, dan slide, dengan parameter navigasi untuk ID arsip.

## Validasi

- Uji agenda yang telah lewat, kegiatan hari ini, tanggal tidak valid, dan urutan kegiatan.
- Uji isolasi dokumen antar pengguna serta pembatasan pintasan menurut peran.
- Uji kegagalan parsial sumber data dan keadaan kosong.
- Periksa beranda, navigasi, dokumen, akun, dan tampilan ponsel di browser lokal.
- Periksa sintaks modul, build, dan pengujian arsip terkait.

## Referensi arah

Lihat `DESIGN.md` untuk warna, hierarki visual, komposisi, dan alasan tiap keputusan. Tidak ada gambar atau aset baru yang dibutuhkan.
