# Tahap 2 — Konsistensi Data dan Dokumen

## Otorisasi dan pendekatan

Pengguna mengizinkan kelanjutan tahap secara berurutan setelah verifikasi tahap sebelumnya, tanpa persetujuan rutin berulang. Tahap 1 telah lulus 748 tes serta build dan pemeriksaan secret. Dokumen ini membatasi Tahap 2; bukan izin deploy, migrasi produksi, perubahan secret, biaya baru, atau penghapusan data. Semua perubahan lokal pengguna dipertahankan; tidak ada commit tanpa permintaan.

Pilih perubahan aditif dan transaksi D1 pada arsitektur sekarang. Rewrite penyimpanan dan migrasi massal data lama tidak dipilih karena risiko kompatibilitas. Implementasi dibagi menurut kepemilikan file; pengujian integrasi penuh menjadi gerbang sebelum Tahap 3.

## 1. Penerbitan sertifikat

- Ganti COUNT+1 dengan alokasi atomik dan penerbitan idempoten untuk pasangan kegiatan/pengguna. Namespace penghitung mengikuti format nomor yang terlihat, bukan hanya kegiatan: format lama tidak menyertakan ID kegiatan.
- Pertahankan nomor sah yang sudah terbit. Placeholder DRAFT bukan nomor terbit dan dapat ditingkatkan melalui penerbit yang sama ketika syarat terpenuhi. Kegagalan parsial atau retry tidak boleh menggandakan sertifikat maupun nomor.
- Pertahankan syarat hadir, refleksi, dan dua tanda tangan yang digunakan alur download. Verifikasi publik tidak boleh menyatakan draft, dicabut, atau dokumen belum memenuhi syarat sebagai sertifikat siap pakai.
- Hasil tinjauan transaksi: gunakan penghitung global monotonik yang di-seed saat migrasi dari nomor historis, termasuk yang dicabut, agar penghapusan data kemudian tidak memakai ulang nomor. Penerbitan memakai batch atomik; refleksi memakai UPSERT dengan prasyarat hadir dalam write. Placeholder memakai token acak 128-bit penuh, dan readiness dibaca ulang dari keadaan tersimpan setelah penerbitan. Gunakan migrasi 0034; jangan memperbaiki nomor lama secara massal.

## 2. Status laporan dan izin dokumen

- Pertahankan status draft/final dan hak akses yang sekarang berlaku: admin/operator mempunyai cakupan yang telah diizinkan, pengguna lain hanya miliknya. Jangan menciptakan peran persetujuan baru.
- Validasi status secara eksplisit. Perubahan status memakai kondisi status sebelumnya sehingga penulisan bersamaan tidak diam-diam menimpa transisi. Pertahankan kompatibilitas payload lama dan jelaskan konflik dengan 409 bila kondisi tidak cocok.
- Pusatkan kebijakan laporan dalam helper kecil yang dipakai seluruh operasi laporan. Jangan menyeragamkan hak surat/proker/program-sekolah secara spekulatif; perbedaan kebijakan bukan alasan memberikan akses baru.

## 3. Draf privat dan versi server

- Tambahkan API draf privat terpisah dari history kolaboratif CP. Identitas pemilik berasal dari sesi, bukan body. Semua list/detail/save/versi owner-scoped.
- Simpan modul, identitas dokumen, judul, payload JSON, revisi, dan waktu server. Save memakai baseRevision dan conditional write; konflik menghasilkan 409 tanpa overwrite otomatis. Pembuatan memiliki identitas stabil agar retry tidak menggandakan dokumen.
- List hanya mengembalikan metadata; payload dimuat melalui detail. Retry checkpoint revisi yang sudah tersimpan tetap idempoten meskipun autosave telah bergerak ke revisi berikutnya.
- Batasi payload sebelum parsing sebesar 1 MiB, maksimal 50 draf per pengguna, dan maksimal 20 checkpoint per dokumen. Autosave memperbarui revisi aktif; checkpoint eksplisit menyimpan versi terpisah. Jangan menghapus data pengguna otomatis demi kuota; tolak penambahan ketika penuh.
- Migrasi 0035 bersifat aditif. Integrasi frontend dimulai dari presentasi: pertahankan draf lokal/offline, tampilkan status sinkronisasi dan konflik, serta sediakan pemulihan draf server tanpa mengubah desain editor. Modul lain tidak boleh diklaim sudah autosave server sampai benar-benar terintegrasi.
- Tutup detail history RPP lintas pemilik dan fallback user ID pada save; history bersama CP tidak diubah menjadi privat secara diam-diam.

## 4. Normalisasi sekolah/profil

- Kedua jalur profil JSON dan multipart menggunakan resolver sekolah yang sama. Satu kecocokan kanonik menghasilkan nama kanonik dan sekolah_id; input tidak cocok atau ambigu mempertahankan teks ternormalisasi dan mengosongkan ID, bukan meninggalkan relasi lama.
- Pertahankan kontrak respons, hak peran, dan teks sekolah legacy. Tidak ada merge, backfill destruktif, atau penghapusan sekolah otomatis.

## 5. Notifikasi tahan gagal

- Buat pengumuman dan outbox dalam satu batch atomik. Outbox unik per pengumuman; pengiriman per penerima memiliki kunci deduplikasi, mengecualikan penulis, dan berjalan dalam chunk terbatas.
- Retry berbasis request dengan cursor durable; kegagalan pengiriman tidak menghilangkan pengumuman yang sudah tersimpan. Tidak menambah cron atau layanan berbayar. Dokumentasikan bahwa pengiriman tertunda memerlukan request pemicu berikutnya.
- Migrasi 0036 tidak memutar ulang semua pengumuman historis. Pertahankan respons pembuatan yang kompatibel.

## 6. Sinkronisasi kalender idempoten

- Gunakan reservasi/pemetaan aditif unik per kegiatan untuk menghindari entri baru ganda pada sync bersamaan maupun jalur pembuatan manual yang menautkan kegiatan.
- Pertahankan seluruh duplikat legacy dan bidang yang diedit manual. Jangan membuat unique index langsung pada data legacy atau menghapus duplikat untuk meloloskan migrasi.
- Jumlah hasil sync menghitung insert yang benar-benar terjadi. Migrasi 0037 dan transaksi diuji dengan adapter SQLite yang ada; rancangan ditinjau sebelum implementasi.

## Verifikasi dan gerbang selesai

Setiap writer bertanggung jawab atas tes terarah dan batas editnya; integrasi akhir dimiliki orkestrator. Uji penomoran lintas kegiatan dan retry, transisi invalid/konflik, akses draf lintas pengguna, revisi bersamaan, batas payload/kuota, retry notifikasi tanpa duplikasi, normalisasi ambigu, serta sync kalender bersamaan tanpa mengubah data lama. Jalankan suite penuh, pemeriksaan secret, diff whitespace, dan build dengan backup/pemulihan aset generated yang sudah dirty. Tes lokal bukan bukti produksi. Catat migrasi yang belum diterapkan dan batas integrasi frontend sebelum melanjutkan Tahap 3.
