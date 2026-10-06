# Tindak lanjut audit 020, 5 Oktober 2026

Pengguna menyetujui seluruh temuan dengan “Ya perbaiki langsung”. Dua belas temuan audit telah ditangani dan diperiksa ulang. Arah visual tetap Studio Hijau Organik, ENERGY 3 / RHYTHM 3 / MOTION 2.

## Hasil per temuan

| No. | Status | Perubahan dan bukti pemeriksaan |
| --- | --- | --- |
| 1 | Selesai | Tautan pemulihan akun memakai warna teks yang terbaca, tombol kirim Masuk/Daftar menjadi tindakan utama hijau, dan identitas diselaraskan menjadi Portal Guru SD dan KKG. Pemindaian penuh Masuk pada tema terang dan gelap tidak mengonfirmasi pelanggaran aksesibilitas. |
| 2 | Selesai | Warna bidang, metadata buku CP, status template, dan keadaan kosong memakai token semantik. Aturan lama dengan warna teal/green tetap telah ditangani pada komponen UI; pilihan sekunder Slide juga diperiksa setelah digulir ke layar. |
| 3 | Selesai | Label model dan instruksi generator disederhanakan. Slide menjelaskan jalur topik ke template serta pilihan meninjau kerangka. Nama pilihan model diperjelas tanpa mengganti nilai provider yang dikirim. |
| 4 | Selesai | Landmark Slide tidak lagi bersarang; Masuk mempunyai landmark main. Normalisasi heading hanya berlaku pada UI, mengabaikan bagian tersembunyi/tertutup dan mempertahankan isi dokumen hasil. Heading banner instalasi juga diperbaiki. |
| 5 | Selesai | Banner instalasi berada di atas navigasi ponsel, dan ruang kerja menyediakan ruang tambahan selama banner terlihat. Hit-testing pada pusat kelima tombol navigasi serta tombol Buat Slide mengenai kontrol yang benar. |
| 6 | Selesai | Tahap template Slide mempunyai tombol Kembali native yang menerima fokus, pengaturan yang dapat dibuka pada ponsel, pilihan template yang dapat dioperasikan dengan keyboard, dan action bar di dalam area konten. Jumlah slide tetap tersedia; enam tombolnya berukuran 96 × 44px pada pemeriksaan ponsel. |
| 7 | Selesai | Guru, Forum, Pengumuman, Kalender, dan Presensi membedakan respons kosong yang sukses dari kegagalan GET. Simulasi 503 menampilkan pesan gagal dan Coba Lagi; klik nyata pada Coba Lagi memuat ulang tiap halaman dan menghilangkan keadaan gagal setelah koneksi dipulihkan. |
| 8 | Selesai | Isi kartu, badge, pilihan model, Notifikasi, Profil, dan tile analitik admin mengikuti tema. Pemeriksaan gelap juga membuka bagian analitik dan menggulir kontrol ke layar, sehingga komponen di bawah lipatan turut diperiksa. |
| 9 | Selesai | Katalog visual Asesmen menggunakan dialog bernama, background inert, fokus awal, serta pengendalian Tab. Pratinjau memakai dialog bersarang: Escape pertama kembali ke katalog, Escape kedua kembali ke pemicu asli. Diuji dengan keyboard dan tes regresi. |
| 10 | Selesai | Filter bulan analitik mempunyai label yang terhubung. Region tabel dapat menerima fokus keyboard dan mempunyai nama aksesibel. Pemindaian analitik admin yang dibuka tidak mengonfirmasi pelanggaran. |
| 11 | Selesai | Target tombol volume, tindakan admin, dan pilihan jumlah slide diperbesar. Pemeriksaan 20 halaman utama pada ponsel tidak menemukan tombol terlihat dengan lebar/tinggi di bawah 44px. |
| 12 | Selesai | Data pengesahan opsional dapat dilipat di ponsel; sekolah, guru, kurikulum, dan kontrol utama tetap terlihat. Dashboard admin memisahkan rincian/grafik dalam disclosure dan menghapus sambutan berulang. Katalog Program lebih ringkas dan pilihan jenjang ditujukan pada SD. Aksi AI Laporan tidak berulang di bagian atas. Bahasa Game dan Surat diperjelas. |

## Verifikasi

- `npm run build`: PASS, termasuk Tailwind dan Vite.
- 65 tes dalam enam file: PASS (`audit-recovery`, `workspace-navigation`, `educator-workspace`, `feature-design`, `feature-composition`, `ui-refinement`).
- `git diff --check`: PASS. Peringatan konversi LF/CRLF yang sudah ada tidak menunjukkan kesalahan whitespace.
- Dua puluh halaman ruang kerja diperiksa pada ponsel 390 × 844, tema terang dan gelap; desktop 1440 × 1000; serta batas layout tablet 820px. Tidak ditemukan overflow horizontal, kontrol keluar batas, atau error JavaScript aplikasi baru pada skenario yang diperiksa.
- Pemindaian aksesibilitas per halaman dan pemeriksaan terarah memperbaiki pelanggaran yang ditemukan, termasuk katalog Game, badge Profil/Game, label template Slide, dan tile analitik admin. Hasil terakhir pada bagian yang diperiksa tidak mengonfirmasi pelanggaran. Ini bukan sertifikasi seluruh keadaan aplikasi.
- Axe menandai beberapa teks di atas gradien sebagai incomplete. Pemeriksaan manual konservatif: heading RPP minimal 7,75:1 dan teks pendamping 5,89:1; heading banner instalasi 15,63:1 dan teks pendamping 8,42:1 terhadap stop gradien paling terang. Hasil incomplete tidak dihitung sebagai PASS otomatis.
- Reduced motion: empat elemen masuk RPP memakai `animation-name: none`; transisi tersisa 0,00001 detik, secara praktis dinonaktifkan.
- Tes mempertahankan kontrol asli, opsi/nilai, FormData, listener, serta markup output yang dilindungi. Perubahan warna/heading dibatasi pada UI layar.

Halaman setelah login diperiksa dalam sesi terpisah dengan data contoh di memori. Permintaan tulis diblokir. Respons katalog/pratinjau contoh diberikan secara lokal untuk memeriksa dialog bersarang. Akurasi AI, penyimpanan, dan ekspor dokumen tidak menjadi hasil verifikasi ini.

## Catatan interaksi

| Interaksi | Hasil |
| --- | --- |
| Banner instalasi tetap terlihat | Kelima tombol navigasi dan Buat Slide dapat dijangkau; banner tidak mengenai pusat tombol. |
| Slide: topik ke template | Katalog tampil, fokus berada pada Kembali, pengaturan ponsel dapat dibuka, jumlah slide tetap tersedia. |
| Katalog Asesmen: Enter dan Tab | Katalog terbuka dan fokus tetap di dalamnya; halaman belakang inert. |
| Pratinjau visual dan Escape dua kali | Pratinjau kembali ke katalog, lalu katalog kembali ke pemicu; keadaan inert dipulihkan. |
| Coba Lagi pada lima halaman data | Memuat ulang halaman yang benar dan pulih setelah respons GET kembali sukses. |
| RPP data pengesahan | Disclosure tertutup pada ponsel; bidang asli dan nilai form dipertahankan. |
| Analitik admin | Disclosure dapat dibuka; filter bulan berlabel dan tabel fokusabel. |
| Masuk, tema terang/gelap | Tidak ada overflow; pemindaian penuh terakhir tidak mengonfirmasi pelanggaran. |

## Delivery Gate

- **Hard Gate PASS:** navigasi dan kontrol yang diperbaiki telah diuji; keadaan gagal jelas, target sentuh diperbesar, kontras diperiksa pada kedua tema, keyboard dialog dan label analitik diperbaiki. Tidak ada aset, statistik pemasaran, atau klaim baru yang dibuat.
- **Purpose-Gate PASS:** warna hijau menandai tindakan utama, token semantik memastikan keterbacaan lintas tema, disclosure mengurangi biaya pemindaian, dan ruang banner menjaga akses pekerjaan serta navigasi.
- **Liveliness PASS:** identitas hutan/mint dan tipografi ruang kerja dipertahankan; efek masuk terbatas dan penghormatan reduced motion diverifikasi.
- **Craftsmanship PASS:** build dan 65 tes lulus, layout beberapa ukuran serta tahap sekunder diuji, dan batas output/form dipertahankan.

Bukti gambar dan metode sesi uji: `evidence/audit-020-followup/`. Tidak ada commit.
