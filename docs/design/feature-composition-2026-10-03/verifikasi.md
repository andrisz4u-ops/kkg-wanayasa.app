# Verifikasi rombakan komposisi fitur — 3 Oktober 2026

Rombakan ini melanjutkan tema Paper Studio hijau dengan perubahan struktur halaman sesuai fungsi. Perubahan berada pada lapisan presentasi, menggunakan kontrol formulir asli agar nilai, validasi, dan event listener tetap terjaga.

## Tata letak yang diterapkan

| Fitur | Komposisi |
| --- | --- |
| RPP | Identitas ringkas di atas, kurikulum utama dan strategi berdampingan |
| Asesmen | Identitas horizontal, materi utama dan karakteristik soal terpisah |
| Analisis CP | Identitas horizontal, sumber buku dan review bab berdampingan; CP resmi dapat dibuka; Buat Sekarang tetap di bawah sumber buku |
| Bank materi | Filter samping dan area koleksi |
| Forum | Daftar diskusi dan formulir topik berdampingan saat formulir dibuka |
| Direktori guru | Label kelompok di kiri dan kartu guru di kanan |
| Kalender | Toolbar dan bidang kalender lebih terstruktur |
| Presensi | Kartu kegiatan lebih ringkas dan panel rekap jelas |
| Pengumuman | Pengumuman pertama lebar penuh, berikutnya dua kolom |
| Game edukasi | Katalog dua kolom dan pengantar ringkas |
| Slide | Editor topik di kiri, contoh topik di kanan |
| Program sekolah | Pemilihan program dan parameter terpisah |
| Surat | Kegiatan dan isi surat dikelompokkan dalam dua bagian |
| Program kerja | Visi dan misi berdampingan; kegiatan lebar penuh |
| Laporan | Informasi dan model berdampingan; lampiran foto di bawah |
| Panel kontrol | Navigasi dan permukaan panel dipadatkan |
| Profil dan notifikasi | Proporsi kolom akun dan jarak item notifikasi diselaraskan |

## Bukti pemeriksaan

- 16 halaman fitur pada desktop dan ponsel 390 px: satu heading studio per halaman, tidak ada overflow horizontal dokumen. Pemeriksaan geometri ini tidak menggantikan pemeriksaan seluruh kondisi data.
- RPP, Analisis CP, Slide, dan Laporan pada tablet 1024 px: tidak ada overflow horizontal.
- Pemeriksaan visual langsung pada RPP, Asesmen, CP, Bank Materi, Forum, Slide, Program Sekolah, Surat, Laporan, Game, Pengumuman, dan Profil selama iterasi.
- Panel CP resmi dapat dibuka/ditutup tanpa overflow; label aksi tetap Buat Sekarang.
- Tombol tambah/kurangi pertemuan RPP tetap memperbarui jumlah; nilai dikembalikan ke awal.
- Contoh topik slide tetap mengisi prompt melalui handler asli; isian uji dibersihkan.
- 163 tes lulus pada 11 berkas: komposisi, formulir, navigasi, workspace guru, izin, arsip, RPP DOCX, CP, asesmen, Prota/Promes/KKTP.
- Pemeriksa batas UI: 117 berkas sumber terlindungi sama dengan baseline sebelum penyempurnaan UI.
- Build CSS dan Vite produksi berhasil; git diff --check berhasil.

## Audit antislop setelah penerapan

Sesuai pilihan pengguna, audit dilakukan setelah komposisi selesai. Struktur disesuaikan dengan kegiatan di setiap fitur, bukan menerapkan satu susunan kartu untuk semua halaman. Warna mengikuti DESIGN.md: hijau hutan, putih, dan mint. Header ringkas, ukuran judul dibatasi, kartu memakai batas tipis dengan radius terukur; tidak ditambahkan klaim manfaat atau statistik baru. Pengantar berulang pada game/slide dipadatkan. Konten hasil dokumen tidak diberi dekorator komposisi, dan CSS baru dibatasi pada media screen.

Perbaikan dari pemeriksaan: posisi jenis ujian Asesmen, proporsi header Slide, jarak panel Program Sekolah, lebar dropdown Surat, serta penempatan foto Laporan. Nilai formulir dan pilihan model tidak diubah.

## Batas verifikasi

Generasi AI langsung, unggahan PDF, penyimpanan data baru, serta ekspor baru melalui browser tidak dijalankan pada putaran ini. Tes dan kesamaan sumber membuktikan perlindungan kode/kontrak fixture, bukan kesamaan setiap respons provider AI. Pemeriksaan browser putaran ini menggunakan akun demo admin; cakupan guru tetap diperiksa lewat tes workspace dan izin. Data contoh dengan karakter literal \\n merupakan isi lama dan tidak disunting dalam rombakan ini.

Peringatan Browserslist usang dan opsi Vitest poolOptions yang deprecated tidak menggagalkan build/tes. Tidak ada commit, push, atau deploy.

## Preview

- rpp-desktop.png
- analisis-cp-desktop.png
- analisis-cp-mobile.png
- slide-desktop.png
