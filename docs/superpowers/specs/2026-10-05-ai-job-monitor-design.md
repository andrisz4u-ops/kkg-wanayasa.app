# Pekerjaan AI dan monitor penyusunan draf

## Persetujuan dan arah

Pengguna menyetujui tahap A terlebih dahulu, dilanjutkan B+C sebagai satu paket berdasarkan audit 023. Tampilan mengikuti Studio Hijau Organik: ENERGY 3 / RHYTHM 3 / MOTION 2, kepala panel hijau hutan, isi terang atau gelap sesuai tema, Georgia untuk judul, dan kontrol sans yang terbaca.

## Kontrak pekerjaan

- Satu pekerjaan AI aktif per akun. Identitas pekerjaan dan sidik masukan mengikat permintaan, pengguna, dan operasi.
- Permintaan identik yang sudah selesai dapat membaca hasil tersimpan tanpa generasi ulang. Masukan berbeda dengan identitas yang sama ditolak.
- Lease diperbarui selama aliran aktif; hasil disimpan paling lama sehari untuk deduplikasi, bukan sebagai pengganti arsip dokumen.
- Abort pengguna atau putusnya koneksi diteruskan ke penyedia AI. Retry penyedia mereset catatan aliran dan tidak dilakukan setelah abort.
- Hasil yang tidak lengkap memakai status parsial serta daftar bagian yang perlu ditinjau. Tidak ada retry POST generasi tersembunyi pada klien.

## Tampilan dan interaksi

Monitor menunjukkan nama pekerjaan, tahap yang benar-benar dijalankan, waktu berlalu, status koneksi, dan pengingat peninjauan guru. Tahap berasal dari konfigurasi pekerjaan, termasuk enam tahap Asesmen. Tidak ada persentase berdasarkan tebakan, estimasi token per potongan, atau klaim validasi regulasi generik.

Catatan JSON/model tersedia di disclosure Detail teknis, tidak memenuhi tampilan utama. Log dibatasi ukurannya dan dirender per frame saat dibutuhkan. Sembunyikan mempertahankan pekerjaan serta tombol untuk membuka status. Batalkan meng-abort transport. Hasil selesai menunggu Tinjau hasil, sehingga pekerjaan lain tidak menimpa hasil yang belum ditinjau.

Dialog menggunakan nama aksesibel, fokus awal, Tab yang terisolasi, Escape untuk menyembunyikan, dan pemulihan fokus. Monitor mempunyai token warna sendiri dan dikecualikan dari dekorator halaman agar warna serta aliran teks tidak memicu penataan ulang seluruh form. Arsip dokumen menggunakan pengelolaan dialog yang sama.

## Alasan desain

- Panel terang/gelap dengan kontras tinggi membuat proses dapat dibaca guru tanpa tampilan terminal sebagai fokus.
- Hijau hutan menghubungkan monitor dengan ruang kerja; warna status menunjukkan keadaan nyata.
- Detail teknis yang tertutup menjaga fokus pada tahap dan tindakan, sambil tetap menyediakan informasi diagnostik.
- Pemisahan Sembunyikan dan Batalkan menjelaskan apakah proses tetap berjalan.
- Peninjauan eksplisit melindungi hasil dari pergantian pekerjaan dan menegaskan tanggung jawab guru memeriksa draf.
- Pembaruan DOM terbatasi dan idempoten menghilangkan loop dekorasi saat idle dan saat token masuk.

## Verifikasi

Tes mencakup SSE CRLF/UTF-8/EOF, CSRF refresh, abort pembacaan, status parsial, ownership dialog, deduplikasi lintas operasi, replay hasil, pembatalan penyedia, reset fallback, akses anonim, rekap CSV, dan nomor surat konkuren. Browser memeriksa desktop/ponsel, kedua tema, keyboard, hide/cancel/review, dan batas keluaran dokumen.
