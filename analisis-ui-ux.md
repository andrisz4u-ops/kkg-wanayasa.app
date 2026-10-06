# Analisis UI/UX RuangKKG

Tanggal: 3 Oktober 2026. Objek: working tree proyek MY KKG dan aplikasi lokal yang diperiksa saat audit. Rekomendasi kemudian diterapkan sebagian/besar; status AFTER, batas verifikasi, dan tindak lanjut pemilik dicatat di [audit-012](<C:/Users/Andris PC/Music/MyGPT/MY KKG/anti-slop/audit-012-2026-10-03.md>).

## Kesimpulan

Perbaikan paling bernilai adalah menyatukan kerangka aplikasi, hierarki informasi, dan pola interaksi. Identitas hijau pada beranda sudah memberi arah yang jelas, tetapi pengguna kemudian bertemu halaman bergaya studio AI, formulir dokumen, dan konsol administrasi dengan aturan yang berbeda. Menambah dekorasi akan memberi manfaat lebih kecil dibanding membuat pekerjaan guru lebih mudah ditemukan dan diselesaikan.

Saya merekomendasikan **ruang kerja dokumen bertema hijau**: navigasi tetap, formulir terkelompok, judul ringkas, satu tindakan utama yang jelas, dan kanvas hasil dokumen yang terisolasi. Elegan berarti tampilan tenang dengan hierarki kuat; kesan futuristik datang dari interaksi yang responsif dan konsisten.

Bagian ini merekam temuan awal sebelum implementasi. Jangan membaca daftar temuan sebagai status terbaru; gunakan status AFTER pada audit 012.

## Dasar pemeriksaan dan batas bukti

- Penelusuran peta graphify yang tersedia, kemudian pemeriksaan sumber terbaru. Peta tersebut dibuat sebelum perubahan UI terakhir sehingga bukan satu-satunya dasar temuan.
- Pemeriksaan langsung dengan akun demo guru dan admin. Total 36 sampel DOM dari 30 tampilan/subtampilan tersimpan dalam bukti pengukuran.
- Pemeriksaan formulir RPP, Analisis CP, dan slide pada desktop, ponsel 390 × 844, dan tablet 768 × 1024. Desktop awal memiliki lebar 1754 CSS px.
- Navigasi, membuka dan menutup formulir/dialog, perpindahan subpanel, dan pergantian mode TTS diperiksa. Dialog kalender diuji dengan Escape.
- Sumber login/pendaftaran, reset password, halaman legal, renderer hasil, dan modul permainan diperiksa. Alur reset dengan token, akun operator/super admin, seluruh keadaan error, dan permainan pada perangkat IFP belum diuji langsung.
- Audit tidak menjalankan pembuatan AI baru, ekspor dokumen, pengiriman formulir perubahan data, pembayaran, atau penghapusan data. Kualitas hasil AI dan kesetaraan file hasil belum diuji ulang pada audit ini.
- Tidak ada error pada log konsol yang tersedia ketika pemeriksaan terakhir dilakukan. Ini bukan jaminan bahwa semua jalur aplikasi bebas error.
- Core Web Vitals, kontras seluruh pasangan warna, zoom 400%, dan seluruh alur pembaca layar belum diukur. Saran terkait hal-hal tersebut adalah target verifikasi berikutnya.

## Yang sudah menjadi fondasi baik

1. Sidebar ruang kerja tetap tersedia pada RPP dan CP, memiliki pencarian, penanda halaman aktif, shortcut `/`, dan pilihan ringkas per akun. Pembatasan menu guru terlihat dalam pemeriksaan sebelumnya dan tetap sesuai pada audit ini.
2. Navigasi ponsel memakai drawer berlabel dan lima tujuan utama. RPP, CP, dan slide dapat dibuka melalui drawer.
3. RPP, CP, dan slide tidak memperlihatkan luapan halaman atau kontrol melewati tepi viewport pada sampel 390 dan 768 px. Ini hasil sampel, bukan penilaian seluruh komponen pada semua ukuran.
4. Halaman CP sudah memiliki kelompok Identitas, Sumber Buku, dan Review Bab. RPP dan asesmen juga memiliki pengelompokan yang dapat disempurnakan tanpa mengganti generator.
5. Modul halaman dimuat sesuai kebutuhan. Batas permukaan output juga sudah dikenali oleh lapisan desain fitur. Kedua fondasi ini perlu dipertahankan.
6. Beranda sudah memprioritaskan RPP dan CP, menggunakan data akun, dan menjelaskan bahwa dokumen terakhir berasal dari penyimpanan akun pada perangkat ini.

## Temuan utama dan prioritas

P0 berarti perbaikan aksesibilitas dasar yang sebaiknya mendahului redesain besar. P1 berarti dampak besar pada konsistensi dan penyelesaian pekerjaan. P2 berarti penyempurnaan setelah fondasi stabil. Prioritas ini merupakan penilaian produk, bukan skor penelitian pengguna.

### 1. P0: label formulir belum terhubung dengan kontrol

Label visual sering berupa `<label>` tanpa `for`, sedangkan isian tidak dibungkus label dan tidak memiliki `aria-label` atau `aria-labelledby`. Pada sampel DOM:

| Tampilan | Isian terlihat | Tanpa asosiasi label/ARIA yang diperiksa |
|---|---:|---:|
| RPP desktop | 16 | 15 |
| Asesmen desktop | 19 | 17 |
| CP ponsel, setelah delapan bab tersedia | 28 | 28 |
| Profil guru | 11 | 11 |
| Organisasi admin | 27 | 27 |

Angka ini menghitung asosiasi eksplisit, bukan seluruh algoritma accessible name. Sebagian kontrol memiliki placeholder atau title yang dapat memberi nama dalam kondisi tertentu. Label permanen yang terhubung tetap lebih jelas bagi pengguna dan alat bantu.

**Saran:** beri ID stabil dan pasangan `label[for]`, gunakan `fieldset`/`legend` untuk pilihan terkait, hubungkan bantuan serta error melalui `aria-describedby`, dan beri label kontekstual untuk isian bab yang berulang. Pertahankan `name`, nilai, event handler, dan payload. Contoh sumber: [label RPP](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/pages/rpp.js:48>) dan [editor bab CP](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/pages/analisis-cp.js:1746>).

### 2. P0: modal kalender belum bekerja sebagai dialog keyboard

Ketika Tambah Event dibuka, fokus tetap pada tombol pemicu, tidak ada dialog terlihat dengan `role="dialog"`, dan Escape tidak menutup overlay. Batal tetap dapat menutupnya. Temuan ini diperiksa langsung dan cocok dengan [implementasi modal kalender](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/pages/kalender.js:65>).

**Saran:** fokus masuk ke dialog, tab tetap di dalamnya, Escape menutup, fokus kembali ke pemicu, dan konten di belakang menjadi inert. Gunakan satu pola dialog bersama untuk modal lain. Form Topik Baru di forum berbeda: ia tampil inline, sehingga tidak perlu dipaksakan menjadi modal. Pola dialog mengacu pada [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### 3. P1: smart sidebar berhenti menjadi pola bersama pada administrasi

RPP/CP menggunakan workspace dengan pencarian dan mode ringkas. Surat, Program Kerja, LPJ, dan panel kontrol menggunakan kerangka admin tersendiri. Di sana pengguna bertemu daftar tujuan, header, ukuran teks, dan pola navigasi lain; kontrol pencarian/ringkas workspace tidak tersedia.

**Saran:** satu kerangka aplikasi untuk semua halaman setelah login. Bagian admin menjadi kelompok atau navigasi konteks dalam kerangka yang sama, dengan izin peran yang ada. Menu atas tetap tersedia sesuai preferensi pengguna, tetapi memiliki fungsi global; sidebar berisi tujuan pekerjaan. Konsistensi tersebut membantu pengguna menerapkan pola yang sudah dipelajari. Acuan: [NN/G, consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/). Sumber: [workspace](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/layouts/workspace.js:95>) dan [kerangka admin](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/layouts/admin.js:7>).

### 4. P1: pilihan sekunder bersaing dengan pekerjaan utama

RPP dan asesmen langsung memperlihatkan identitas, kurikulum, provider AI, streaming, dan banyak opsi tambahan. CP memiliki 28 isian pada sampel buku delapan bab; tinggi konten ponselnya sekitar 2579 px. Organisasi admin memuat 27 isian dan konten sekitar 3622 px pada desktop. Angka tinggi bergantung pada data dan viewport.

**Saran:** informasi dasar terbuka; identitas lengkap, parameter AI, dan pengaturan tambahan menggunakan bagian yang dapat diperluas. Pada CP, setiap bab dapat memiliki ringkasan dan detail. Semua kontrol tetap berada dalam form, dengan nilai serta default yang sama. Pilihan penting tidak boleh disembunyikan tanpa petunjuk. Pengaturan lanjutan dapat dipisahkan dari pilihan yang sering digunakan, sesuai prinsip [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

Saya memilih pengelompokan yang dapat diperluas sebagai langkah awal. Wizard wajib akan menambah klik dan membutuhkan pengelolaan state baru; manfaatnya perlu dibuktikan dahulu.

### 5. P1: identitas dan komponen memiliki beberapa aturan visual

`input.css` memuat lapisan fitur, monokrom, Paper Studio, beranda hijau, dan smart sidebar. Fitur memiliki token `--fw-*`, workspace memiliki `--wk-*`, sedangkan banyak halaman masih membawa utility dan gaya lokal. RPP memakai Orbitron pada judul, sementara halaman lain menggunakan aturan sans yang berbeda. Lapisan ini membantu perubahan bertahap, tetapi meningkatkan kemungkinan hasil yang tidak seragam.

**Saran:** satukan token semantik untuk permukaan, teks, garis, tindakan, dan fokus. Gunakan spesifikasi tombol, field, header, tab, tabel, dialog, drawer, dan empty state yang sama. Perbedaan tata letak tetap mengikuti isi: editor dokumen, daftar materi, kalender, dan permainan mempunyai kebutuhan berbeda.

### 6. P1: ukuran kontrol kecil belum konsisten

Banyak tombol pendukung pada desktop/tablet memiliki tinggi 40–42 px. Tombol tambah/kurang RPP dan asesmen memiliki lebar sekitar 36 px; tombol hapus bab CP sekitar 20 px pada sampel ponsel, walaupun tingginya 44 px. Beberapa tombol sudah memiliki title, sehingga temuan ini terutama ukuran dan kejelasan konteks.

**Saran:** target produk 44 × 44 CSS px untuk kontrol sentuh penting, termasuk hit area ikon, dengan jarak yang cukup. Tombol hapus bab dapat memakai nama kontekstual seperti “Hapus Bab 3”. Jangan menyimpulkan semua tombol 40 px melanggar WCAG: minimum AA WCAG 2.2 adalah 24 × 24 CSS px dengan pengecualian, termasuk aturan jarak. Acuan: [W3C Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### 7. P1: bahasa tampilan terlalu teknis dan berbeda antarfitur

Istilah seperti “AI NEURAL ENGINE”, “NEURAL QUESTION ARCHITECT”, nama provider beserta ID model panjang, dan nama studio yang berbeda membuat guru harus menafsirkan lapisan teknologi. Header slide juga memakai area pengantar besar sebelum form utama.

**Saran:** label utama memakai nama pekerjaan: “Buat RPP”, “Buat asesmen”, “Analisis CP”, dan “Buat slide”. Detail provider tetap tersedia dalam Pengaturan AI; nilai pilihan, provider aktif, dan default tidak berubah. Kurangi header fitur menjadi judul, satu kalimat bantuan, dan tindakan pendukung. Pada slide ponsel, letakkan pemilihan model di baris sendiri bila tetap ditampilkan agar nama panjang tidak mendominasi kartu.

### 8. P1: umpan balik perlu mengikuti konteks proses

Loading bersama menggunakan overlay penuh, penghitung waktu, dan tips pedagogis, termasuk saat memuat halaman. Penghitung menunjukkan waktu berlalu, bukan kemajuan nyata. Keadaan kosong bank materi juga menggunakan kalimat umum yang kurang membantu pengguna menentukan tindakan berikutnya.

**Saran:** loading halaman memakai indikator dalam area konten; proses AI memakai tahap yang benar-benar tersedia dari sistem. Hindari persentase atau estimasi waktu tanpa dasar. Error validasi muncul dekat isian dan dalam ringkasan yang mengarah ke kontrol terkait. Error layanan menawarkan retry sambil mempertahankan isian. Pola error form mengacu pada [GOV.UK Error Summary](https://design-system.service.gov.uk/components/error-summary/).

Perubahan retry, pembatalan pekerjaan, dan penyimpanan draft adalah perubahan perilaku. Ketiganya membutuhkan rancangan terpisah bila belum tersedia; tidak cukup dibuat menjadi tombol dekoratif.

### 9. P2: beberapa tampilan sulit dikembalikan ke konteks yang sama

Perpindahan subpanel admin mengubah `state.currentAdminTab` dan visibilitas panel. Subpanel bukan alamat berbeda pada pemeriksaan ini. Ini menyulitkan berbagi tautan ke Data Sekolah atau kembali ke subpanel tertentu setelah membuka ulang halaman.

**Saran:** subpanel dan filter penting dapat direpresentasikan dalam URL, tanpa data pribadi. Bedakan navigasi halaman dari tab dalam satu pekerjaan. Tab sungguhan memerlukan semantik dan interaksi keyboard yang sesuai [W3C APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Sumber: [switchAdminTab](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/pages/admin-modules/ui.js:394>).

### 10. P2: status penyimpanan dan riwayat perlu satu kosakata

Pengguna bertemu Riwayat Lokal, Riwayat Saya, Riwayat Slide, Riwayat LPJ, dan Dokumen Terakhir. Beranda sudah menjelaskan penyimpanan pada perangkat ini, tetapi arti penyimpanan lokal dibanding kolaboratif perlu sama jelasnya pada setiap fitur.

**Saran:** gunakan “Dokumen tersimpan” sebagai payung dan tampilkan asal penyimpanan secara jujur. Akses kolaboratif menjadi kelompok berbeda. Jangan menambahkan dokumen CP ke daftar beranda sebelum metadata dan adapter arsip yang sesuai tersedia. Backend arsip serta format hasil tetap menjadi sumber data.

### 11. P2: perlu profil kinerja sebelum memperluas dekorasi runtime

`feature-design.js` memeriksa elemen DOM, menambahkan kelas berdasarkan bentuk markup, dan mengamati mutasi seluruh body. Pengamatan ini bukan bukti bahwa aplikasi lambat. Namun halaman asesmen, slide, dan editor CP cukup besar sehingga dekorasi berulang layak diukur sebelum diperluas.

**Saran:** secara bertahap beri kelas desain eksplisit pada kontrol UI dalam renderer asal, batasi observer pada area dinamis yang perlu, dan pertahankan pemuatan modul sesuai halaman. Ukur target LCP ≤ 2,5 detik, INP ≤ 200 ms, dan CLS ≤ 0,1 pada persentil ke-75 trafik relevan. Ini target, bukan hasil aplikasi saat ini. Acuan: [web.dev Web Vitals](https://web.dev/articles/vitals).

### 12. Perlu bukti: klaim pada halaman publik

Footer memuat teks literal “Sistem Aktif (99.9%)” yang mengarah ke FAQ. Testimoni bernama juga ditulis langsung di template. Kode tersebut tidak membuktikan bahwa klaim atau testimoni palsu, tetapi tidak menyediakan bukti pengukuran uptime maupun asal testimoni dalam bagian yang diperiksa.

**Saran:** tampilkan status dari sumber nyata beserta periode pengukuran, atau hilangkan persentasenya. Pastikan testimoni memiliki sumber dan izin penggunaan. Periksa agar klaim kemampuan produk cocok dengan alur yang tersedia. Ini pemeriksaan kejelasan dan kepercayaan UI, bukan audit legal. Sumber: [testimoni](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/pages/home.js:626>) dan [klaim footer](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/pages/home.js:782>).

## Saran untuk setiap fitur

### Ruang kerja, perangkat ajar, dan komunitas

| Fitur | Yang perlu diperbaiki | Pola yang disarankan | Prioritas |
|---|---|---|---|
| Beranda setelah login | Sambutan cukup dominan; pintasan diulang pada beberapa lokasi; dokumen terakhir belum mewakili seluruh jenis arsip | Sambutan lebih ringkas, RPP/CP tetap terdepan, dokumen yang benar-benar tersedia dan agenda menjadi informasi kerja; akses pengelolaan mengikuti peran | P1 |
| Smart sidebar | Fungsi berbeda pada kerangka admin; label rail kecil; pencarian hanya menu | Satu sidebar bersama; kategori stabil; pencarian tetap berdasarkan izin; opsi pin manual 3–5 tujuan setelah fondasi stabil; jangan mengubah urutan otomatis saat pengguna bekerja | P1 |
| RPP | Label tidak terhubung; judul dan istilah teknis; identitas lengkap bersaing dengan topik | Header ringkas; Identitas, Materi, dan Strategi; identitas profil diringkas tetapi dapat dibuka; opsi lanjutan dapat diperluas; satu tombol Buat RPP | P0/P1 |
| Analisis CP | Form dan review delapan bab panjang, semua detail tampil sekaligus | Tahap orientasi Identitas → Sumber → Review → Hasil; ringkasan per bab, detail dapat dibuka, toolbar review dekat daftar; field dan aturan semester tetap | P0/P1 |
| Asesmen | Identitas panjang, distribusi soal dan level kognitif padat, beberapa tombol kecil | Ringkasan jumlah soal dari nilai sebenarnya; jumlah PG/isian/uraian terkelompok; level kognitif diberi bantuan singkat; bank soal dan galeri menjadi akses pendukung | P0/P1 |
| Slide | Header besar; dua tindakan outline/template hampir setara; model panjang mendominasi ponsel | Form topik sebagai fokus; urutan kerja Topik → Outline/Template → Editor jelas; parameter AI sekunder; toolbar editor tetap di luar konten slide | P1 |
| Game edukasi | Judul/instruksi IFP panjang; persiapan guru bercampur dengan ruang bermain | Katalog ringkas berdasarkan fase; kartu menyebut tujuan, materi, dan kebutuhan perangkat; persiapan guru terpisah dari mode bermain/fullscreen | P1 |
| TTS AI dan manual | Dua mode membutuhkan orientasi yang sama; kata/petunjuk berulang memerlukan label kontekstual | Mode sebagai kontrol pilihan jelas; pasangan Kata/Petunjuk bernama; tombol tambah/hapus mudah disentuh; toolbar cetak di luar kanvas | P0/P1 |
| Bank materi | Filter tidak memiliki label eksplisit; empty state umum | Label pencarian/jenis/jenjang; bedakan kosong pertama dengan filter tanpa hasil; metadata jenis, kelas, pemilik dan tanggal; upload mempertahankan konteks | P0/P1 |
| Presensi | Campuran istilah Absensi, Presensi, Check-in; daftar kegiatan lama dan baru setara | Gunakan kosakata konsisten; kegiatan yang relevan lebih dahulu; status kehadiran nyata; scan QR dan bantuan saat izin kamera gagal; konfirmasi hasil dekat kegiatan | P1 |
| Forum | Ringkasan diskusi berupa kartu div yang dapat diklik; form topik terbuka inline tanpa orientasi fokus | Judul menjadi tautan/tombol semantik; metadata ringkas; form diberi label dan fokus yang membantu; detail topik menggantikan daftar atau memiliki konteks kembali yang jelas | P0/P1 |
| Direktori guru | Pencarian tanpa label eksplisit; kartu besar memperpanjang halaman | Pencarian berlabel; kelompok sekolah/jabatan dari data nyata; pilihan tampilan ringkas untuk scan; detail kontak menjadi akses lanjutan sesuai izin | P0/P2 |
| Kalender & agenda | Modal belum aksesibel; tombol bulan sebelumnya/berikutnya berbasis ikon; grid bulan padat di ponsel | Dialog bersama; nama tombol jelas; agenda daftar sebagai opsi utama ponsel; bulan/minggu tetap tersedia; status tanggal aktif terbaca tanpa mengandalkan warna | P0/P1 |
| Pengumuman | Judul besar dan isi panjang membuat pemindaian lambat | Tanggal, kategori dan pin berfungsi sebagai metadata; ringkasan beberapa baris; detail terpisah; “disematkan” tidak bersaing dengan judul | P1 |
| Profil | Data pribadi dan password berada di halaman panjang; label tidak terhubung | Kelompok Data diri, Sekolah, dan Keamanan; penyimpanan mengikuti kelompok yang ada; data sensitif diringkas dalam mode baca; identitas yang dipakai generator tetap tersedia | P0/P1 |
| Notifikasi | Tombol massal dominan walau kosong; semua jenis pesan mengikuti satu pola | Bedakan aktivitas, dokumen, dan sistem dari tipe nyata; status baca jelas; tindakan menuju objek terkait bila tersedia; keadaan kosong lebih ringkas | P2 |

### Dokumen administrasi

| Fitur | Saran khusus | Batas yang dijaga | Prioritas |
|---|---|---|---|
| Program Sekolah | Pisahkan Jenis program, Identitas, dan Parameter khusus; ringkas identitas; jelaskan program terpilih sebelum form dinamis | Nilai default, jenis program, pengesahan, parameter, dan generator tidak berubah | P0/P1 |
| Generator Surat | Pilihan Undangan atau Paket Tugas/SPPD jelas di awal; identitas sekolah dan daftar guru terkelompok; ringkasan kelengkapan sebelum tindakan | Paket Surat Tugas, SPPD, visum, LHP serta aturan tanggal dan ekspor tetap | P0/P1 |
| Program Kerja KKG | Daftar kegiatan memakai baris editor yang ringkas; uraian panjang dibuka per kegiatan; kegiatan, waktu, penanggung jawab dan anggaran mudah dipindai | Tambah baris, nilai, perhitungan/format yang ada, serta payload tetap | P0/P1 |
| LPJ/Laporan KKG | Satu tombol utama dalam konteks yang jelas; tab Form/Pratinjau konsisten; unggahan foto punya status file; reset tidak berdekatan dengan aksi utama | Isi laporan, template resmi, foto yang dipakai, editor hasil dan unduhan tetap | P0/P1 |

### Seluruh subpanel kontrol

| Subpanel | Saran khusus | Prioritas |
|---|---|---|
| Dashboard admin | Panjang sampel sekitar 3035 px. Utamakan antrean yang membutuhkan tindakan; tren, distribusi, dan laporan menjadi detail. Ukuran angka dan warna mengikuti makna operasional nyata | P1 |
| Manajemen pengguna | Satukan pencarian, filter, dan jumlah hasil; tindakan massal muncul dalam konteks pilihan; peran/status/asal sekolah mudah dipindai; tindakan berisiko diberi label jelas | P0/P1 |
| Data sekolah | Daftar/tabel dengan pencarian berlabel dan kolom keputusan yang relevan; edit di panel konteks; jangan memaksa kartu besar untuk semua baris | P0/P1 |
| Kelola CP | Mapel dan fase sebagai orientasi; jelaskan sumber standar dan perubahan manual; reset semua ditempatkan terpisah dari tindakan rutin | P0/P1 |
| AI Provider | Status aktif, urutan/default, dan koneksi yang benar-benar diketahui terlihat ringkas; kredensial berada di form edit; jangan menampilkan status sehat tanpa hasil pemeriksaan | P1 |
| Audit log | Filter berlabel untuk waktu/jenis/peran yang tersedia; daftar ringkas dengan detail yang dapat dibuka; jangan menambahkan grafik tanpa pertanyaan operasional | P0/P2 |
| Template surat | Jenis, nama, dan status template mudah dipindai; pratinjau sebelum edit; placeholder template dijelaskan sebagai data yang akan diisi | P1 |
| Organisasi/pengaturan | Pisahkan Identitas, Tampilan, Kontak, Integrasi, dan Pemeliharaan. Zona Bahaya terpisah. Satu status perubahan jelas; form panjang tidak menjadi satu halaman wajib | P0/P1 |

Operator tetap membutuhkan menu dan izin terbatas yang ada. Pengurangan menu UI harus cocok dengan otorisasi server, bukan menjadi pengganti otorisasi. Tampilan operator/super admin pada audit ini ditinjau melalui sumber, belum melalui sesi akun tersendiri.

### Publik dan akun

| Tampilan | Saran | Bukti/lingkup |
|---|---|---|
| Halaman publik | Warna dan istilah selaras dengan aplikasi; CTA menuju alur yang jelas; tunjukkan hasil produk nyata; persentase uptime dan testimoni memiliki dasar | Browser + sumber |
| Masuk | Label eksplisit, satu tindakan utama, pesan error dekat form; bantuan password mudah ditemukan | Browser + sumber |
| Daftar | Informasi wajib dan opsional dibedakan; bantuan sekolah/jabatan jelas; keadaan persetujuan/aktivasi dijelaskan jika memang berlaku | Sumber |
| Reset password | Keadaan email terkirim, token tidak valid/kedaluwarsa, dan password selesai jelas; tombol kembali ke login konsisten | Sumber; tidak menjalankan reset |
| Privasi dan syarat layanan | Tata baca sederhana, tanggal versi, daftar isi/anchor untuk dokumen panjang, navigasi kembali jelas | Sumber; bukan validasi isi legal |

Untuk tujuh permainan, katalog, persiapan, dan area bermain perlu mempunyai peran berbeda. TTS berorientasi kata/petunjuk; hitung cepat dan tarik tambang berorientasi duel; puzzle berorientasi penempatan; ular tangga berorientasi papan; cari kata dan Pinisi berorientasi literasi. Pola tombol mulai, jeda, ulangi, keluar dan bantuan sebaiknya konsisten, sementara tampilan belajar tetap sesuai permainan. Kemampuan multi-touch dan keterbacaan pada jarak kelas memerlukan pengujian perangkat nyata.

## Arah visual yang direkomendasikan

Dasarnya adalah keputusan pengguna yang sudah dicatat dalam DESIGN.md: Paper Studio untuk ruang dokumen, identitas hijau untuk beranda, dan navigasi atas serta kiri.

| Keputusan | Usulan awal | Alasan |
|---|---|---|
| Warna | Hutan `#0b3529`, tindakan `#176b4b`, mint `#bef2c9`, kertas putih, latar `#f5f9f6`, teks `#17382b`, garis `#d8e7dc` | Melanjutkan identitas yang sudah dipilih. Rasio kontras setiap pasangan tetap harus diuji |
| Tipografi | Satu keluarga sans UI yang sudah tersedia; judul fitur 24–28 px, isi 14–16 px, bantuan 12–13 px; input ponsel 16 px | Guru banyak membaca dan mengisi form; judul tidak perlu mengalahkan pekerjaan utama |
| Bentuk | Radius kontrol 8 px, panel 12 px; bayangan terutama untuk overlay | Membentuk hierarki yang stabil tanpa membuat semua benda terlihat mengambang |
| Ruang | Skala 4/8/12/16/24/32 px; jarak kelompok lebih besar daripada jarak label/isian | Whitespace menjadi pemisah informasi, bukan area kosong pengantar |
| Header | Judul, satu kalimat bantuan, dan Riwayat/Pengaturan di area yang sama | Orientasi cepat tanpa hero besar di setiap fitur |
| Tindakan | Satu CTA primer per konteks; tindakan sekunder netral | Pengguna tahu tindakan berikutnya tanpa membaca semua tombol |
| Gerak | Respons fokus/hover dan transisi pendek sesuai keadaan; hormati reduced motion | Menjelaskan perubahan tanpa mengganggu pembacaan |

Usulan dial: beranda mengikuti ENERGY 3 / RHYTHM 3 / MOTION 1 yang sudah dipilih. Halaman kerja memakai ENERGY 2 / RHYTHM 3 / MOTION 1: form, daftar, editor, dan kalender memiliki komposisi berbeda karena pekerjaannya berbeda. Kanvas dokumen mengikuti format asal.

Sidebar tidak perlu mengembang otomatis saat hover atau menyusun ulang menu berdasarkan tebakan penggunaan. Pertahankan kontrol ringkas eksplisit dan urutan stabil. Pin dan pencarian dokumen lintas fitur merupakan pengembangan tambahan, bukan fungsi yang sudah tersedia sekarang.

## Pilihan pendekatan

1. **Direkomendasikan: satukan kerangka dan komponen, lalu kelompokkan form.** Dampak cepat pada seluruh fitur dan risiko lebih rendah terhadap output. Cocok dengan batas pengguna: prompt dan format hasil sudah baik.
2. **Wizard untuk fitur tertentu.** Membantu pengguna baru pada CP/Surat yang panjang, tetapi menambah klik, pengelolaan draft, validasi antarlangkah, serta pekerjaan verifikasi. Pilih setelah pengamatan menunjukkan pengelompokan biasa belum cukup.
3. **Bangun ulang frontend.** Biaya dan risiko paling besar; belum ada bukti bahwa migrasi framework diperlukan. Proyek sekarang menggunakan Hono, Vite, JavaScript modules, dan Tailwind, bukan React/Next.js. Perbaikan ini dapat dilakukan dalam stack yang ada.

## Urutan pelaksanaan yang paling masuk akal

### Tahap A: aksesibilitas dan fondasi

Label/ID, dialog kalender, nama kontrol ikon, target sentuh, fokus keyboard, serta satu spesifikasi komponen. Satukan kerangka navigasi admin dan workspace. Kriteria selesai: guru/admin mencapai fitur yang diizinkan, menu aktif jelas, dan dialog kalender dapat dibuka/ditutup hanya dengan keyboard.

### Tahap B: alur utama guru

RPP → CP → asesmen → slide. Gunakan header bersama, informasi dasar yang ringkas, pengaturan lanjutan yang dapat dibuka, dan toolbar hasil di luar kanvas. Pastikan perubahan tampilan tidak mengubah nilai form atau data keluaran.

### Tahap C: komunitas dan pekerjaan administrasi

Bank materi, presensi, agenda, forum, direktori, pengumuman, Surat, Program Kerja, LPJ, serta seluruh subpanel admin. Terapkan pola daftar/filter dan pengaturan yang sama, dengan komposisi sesuai kebutuhan tiap fitur.

### Tahap D: penyempurnaan berdasarkan pemakaian

Pin menu manual, tautan subpanel/filter, akses draft jika sudah ada, dan pencarian lintas dokumen bila datanya tersedia. Nilai manfaat lewat waktu menyelesaikan tugas, kesalahan form, langkah kembali, serta pengalaman guru menggunakan keyboard/ponsel. Tetapkan baseline dahulu; jangan menjanjikan persentase efisiensi tanpa pengukuran.

## Perlindungan wajib RPP dan Analisis CP

Perubahan tahap berikutnya harus menjaga kontrak berikut:

- Prompt, model/provider terpilih, default, payload, validasi, perhitungan, request API, event handler, penyimpanan, serta hak akses tetap menjadi acuan yang ada.
- RPP: kanvas utama dan lampiran, format Word, cetak, unduhan, serta pembukaan arsip dilindungi.
- CP: Data CP, Analisis CP-TP-ATP, ATP Elemen, Prota, Promes, RPE, KKTP, aturan semester/alokasi, renderer, downloaders, dan data dokumen dilindungi.
- UI layar berada di luar permukaan output. Hindari selector global yang mengubah font, ukuran, warna, tabel, margin, atau elemen cetak hasil.
- Pengelompokan form tidak menghapus, menonaktifkan, mengganti nama, mengubah nilai default, atau merender ulang kontrol dengan cara yang menghilangkan isian.
- Buat baseline sumber dan contoh keluaran deterministik sebelum implementasi. Bandingkan payload serta hasil cetak/Word dengan fixture yang sama setelah perubahan. Perbandingan byte AI yang dibuat ulang bukan jaminan karena keluaran model dapat bervariasi.
- Rekomendasi seperti autosave baru, retry baru, wizard, filter URL, dan command palette dicatat sebagai perubahan perilaku tersendiri yang membutuhkan verifikasi. Jangan memasukkannya diam-diam ke pekerjaan CSS.

Sumber pemisahan UI/output: [feature-design.js](<C:/Users/Andris PC/Music/MyGPT/MY KKG/public/static/js/feature-design.js:8>). Batas tersebut tetap perlu pemeriksaan visual dan regresi pada implementasi, karena gaya yang diwariskan dari parent juga dapat memengaruhi dokumen.

## Kriteria penerimaan redesain berikutnya

- Sampel lebar 320, 390, 768, 1024, dan desktop; zoom 200% serta pemeriksaan reflow setara 320 CSS px. Tabel/kanvas yang memang dua dimensi dapat memiliki area gulir tersendiri; form dan toolbar harus tetap bisa dibaca dan digunakan. Acuan: [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- Tab, Shift+Tab, Enter/Space dan Escape digunakan pada seluruh kontrol bersama. Fokus terlihat dan tidak tertutup header/footer.
- Label, pesan bantuan, error, status proses, dan semantik tab/dialog diperiksa dengan alat bantu; seluruh pasangan warna penting diperiksa kontrasnya.
- Keadaan kosong pertama, filter tanpa hasil, loading, gagal memuat, akses ditolak, dan berhasil dibedakan.
- Uji guru, operator, admin, dan super admin dengan akun yang sesuai; antarmuka dan server mempertahankan izin yang sama.
- Pemeriksaan output menggunakan fixture yang sama untuk RPP dan seluruh keluaran CP yang dilindungi.
- Ukur kinerja sebelum/sesudah; perluasan komponen tidak menurunkan respons interaksi atau stabilitas layout.

## Bukti audit

- [Pengukuran DOM, 36 sampel](<C:/Users/Andris PC/Music/MyGPT/MY KKG/docs/design/audit-ui-ux-2026-10-03/pengukuran-ui.json>)
- [Beranda guru](<C:/Users/Andris PC/Music/MyGPT/MY KKG/docs/design/audit-ui-ux-2026-10-03/beranda-guru.png>)
- [Slide di ponsel](<C:/Users/Andris PC/Music/MyGPT/MY KKG/docs/design/audit-ui-ux-2026-10-03/slide-ponsel.png>)
- [Kerangka Program Kerja admin](<C:/Users/Andris PC/Music/MyGPT/MY KKG/docs/design/audit-ui-ux-2026-10-03/proker-desktop.png>)
- [Modal kalender](<C:/Users/Andris PC/Music/MyGPT/MY KKG/docs/design/audit-ui-ux-2026-10-03/kalender-modal.png>)
- [Halaman publik](<C:/Users/Andris PC/Music/MyGPT/MY KKG/docs/design/audit-ui-ux-2026-10-03/publik-desktop.png>)
- [Audit antislop bernomor](<C:/Users/Andris PC/Music/MyGPT/MY KKG/anti-slop/audit-012-2026-10-03.md>)

## Pemeriksaan laporan

PASS, sumber temuan: angka berasal dari sampel DOM yang disimpan; perbedaan kerangka dan dialog dikonfirmasi pada aplikasi dan kode.

PASS, kejujuran lingkup: pemeriksaan browser dibedakan dari pemeriksaan sumber; performa, keluaran AI, ekspor, dan seluruh keadaan aksesibilitas tidak diklaim lulus.

PASS, arah: rekomendasi mengikuti identitas hijau dan ruang kerja dokumen; setiap keputusan visual utama memiliki alasan.

PASS, batas pekerjaan: laporan ini memisahkan observasi awal dari rekomendasi. Implementasi dan pemeriksaan terbaru diringkas di audit 012; browser, aksesibilitas lengkap, klaim testimoni, serta seluruh hasil ekspor tetap memiliki batas yang dinyatakan di sana.
