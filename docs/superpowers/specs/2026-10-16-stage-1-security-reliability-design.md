# Tahap 1 — Keamanan dan Keandalan

## Persetujuan dan batas pekerjaan

Pengguna menyetujui Tahap 1 terlebih dahulu setelah audit fitur dan penjelasan rancangan. Dokumen ini adalah batas implementasi, bukan persetujuan deploy. Pertahankan seluruh perubahan lokal yang sudah ada; jangan melakukan commit, deploy, migrasi produksi, atau perubahan secret produksi tanpa instruksi terpisah.

## Pendekatan

Gunakan hardening terarah pada arsitektur Hono/Cloudflare yang ada, bukan rewrite. Alternatif memperbaiki seluruh roadmap sekaligus memperbesar risiko regresi; alternatif menambah tes saja tidak menutup kelemahan akses. Implementasi dipisahkan menjadi jalur akses AI, penyimpanan berkas, integritas QR/absensi, kejujuran validator, dan regresi UI. Perubahan kontrak bersama diintegrasikan sebelum pengujian penuh.

## 1. Akses dan pembatasan AI

- Inventaris semua endpoint yang benar-benar memanggil layanan AI, termasuk jalur non-stream, streaming, ekstraksi, dan lampiran. Wajibkan sesi valid sebelum membaca payload mahal atau memanggil provider. Endpoint dokumen yang tidak memanggil AI bukan otomatis bagian pembatasan AI.
- Gunakan helper otorisasi yang ada; pertahankan pemeriksaan pemilik job dan pembatalan streaming.
- Tambahkan admission limit berbasis pengguna dengan batas konfigurabel dan respons 429 yang konsisten. Tidak ada pengecualian admin/operator untuk biaya AI. Batas harus diperiksa sebelum provider dipanggil.
- Pilih penyimpanan limiter bersama yang sesuai binding/schema proyek setelah pemeriksaan implementasi. Bila hanya limiter lokal yang dapat disediakan, dokumentasikan keterbatasannya dan jangan mengklaim kuota lintas instance atau billing-token yang akurat. Jangan menambah layanan eksternal berbayar.
- Hindari perubahan format respons sukses yang merusak klien. Tes membuktikan request anonim dan request ditolak limiter tidak memanggil provider.

## 2. Penyimpanan berkas

- Upload generik membutuhkan sesi, batas ukuran sebelum buffering bila tersedia, pemeriksaan ukuran aktual, serta allowlist tipe dan pemeriksaan signature untuk format yang didukung. Gunakan kembali aturan upload proyek jika sesuai; tolak format tidak didukung dengan pesan jelas.
- Gunakan identitas objek acak dan metadata pemilik, tenant, serta klasifikasi visibilitas. Metadata baru harus tersimpan sebelum objek dianggap dapat dikelola pengguna; kegagalan metadata memicu cleanup objek atau kegagalan eksplisit.
- Penghapusan memerlukan bukti kepemilikan; pengguna lain tidak boleh menghapus objek meski mengetahui key. Jangan memberi akses admin lintas pemilik secara implisit tanpa kebijakan yang sudah ada.
- Objek lama tanpa metadata tidak boleh diasumsikan milik peminta. Tolak penghapusan oleh pengguna biasa; jangan menghapus atau memigrasikan data lama otomatis.
- Jangan menutup aset publik yang memang dipakai materi/avatar/logo secara membabi buta. Objek yang diklasifikasikan privat memerlukan otorisasi baca dan tidak boleh diberi cache publik. Laporkan batas kompatibilitas objek legacy.
- Jika metadata memerlukan perubahan schema, tambahkan migrasi baru yang tidak menimpa migrasi pengguna, uji secara lokal bila tooling tersedia, dan jangan menjalankannya di produksi.

## 3. QR dan absensi terkunci

- Hapus signing secret tetap dari kode. Ambil secret dari konfigurasi lingkungan yang diketik; signing/verifikasi harus gagal secara aman ketika konfigurasi tidak tersedia.
- Jangan gunakan fallback ke kunci lama. Pergantian secret membuat QR lama tidak valid; dokumentasikan konfigurasi dan penerbitan ulang sebagai langkah operator, tanpa mengubah secret produksi.
- Semua jalur mutasi kehadiran harus menghormati kegiatan terkunci, termasuk perubahan hadir/izin/sakit. Lakukan pemeriksaan saat mutasi agar perubahan status kunci tidak dapat dilewati hanya dengan pemeriksaan awal.
- Pertahankan alur sertifikat/sign-off yang sudah ada dan format error yang dapat ditangani UI. Tes mencakup kunci hilang, token salah, token valid, dan kegiatan terkunci.

## 4. Kejujuran validasi AI

- Item yang hilang dari hasil verifier, parsing gagal, dan provider gagal tidak boleh berubah menjadi verified/pass atau skor tinggi default.
- Bedakan pemeriksaan deterministik, penilaian AI, dan kebutuhan review guru menggunakan kontrak yang kompatibel dengan konsumen saat ini.
- Perbaikan CP/soal tidak boleh otomatis menaikkan skor atau lulus tanpa pemeriksaan ulang yang relevan. Jangan mengklaim pemeriksaan AI menjamin kebenaran pedagogis.
- Uji respons verifier parsial/kosong/rusak dan jalur repair. Tampilkan status belum diperiksa secara jujur bila frontend saat ini menafsirkannya sebagai lulus; perubahan tampilan dimiliki jalur designer.

## 5. Error login dan loading kalender

- Respons kesalahan login tidak menyertakan stack trace/detail internal; log server tetap memungkinkan diagnosis dengan identitas request bila tersedia.
- Perbaiki regresi loading kalender tanpa melemahkan tes atau mengubah maksud visual yang sudah ada. Pertahankan state loading, error/retry, dan empty yang berbeda.

## Verifikasi dan kriteria selesai

- Pengguna anonim ditolak sebelum provider AI dipanggil; pembatasan penggunaan menghasilkan 429 dan tidak memanggil provider.
- Pengguna A tidak dapat menghapus berkas pengguna B. Upload tidak valid ditolak, dan akses baca privat tidak memakai cache publik.
- Absensi kegiatan terkunci tidak berubah. Signing tanpa konfigurasi tidak menghasilkan token valid.
- Hasil verifikasi tidak lengkap tidak tampil sebagai lulus; repair tidak mendapat skor tinggi otomatis.
- Login gagal internal tidak mengekspos stack; tes loading kalender kembali lulus.
- Jalankan tes terarah setiap jalur, lalu keseluruhan suite dan pemeriksaan secret. Baseline audit: 723/724 tes lulus, satu kegagalan kalender di tests/audit-recovery.test.ts:46. Jalankan build bila dependensi tersedia tanpa instalasi tak diminta; bedakan kegagalan lama dan baru dengan bukti.
- Tes mock bukan bukti integrasi Worker/D1/R2/provider produksi. Catat tes yang tidak dapat dijalankan, kebutuhan migrasi/secret, dan batas perlindungan yang masih ada.

## Di luar cakupan

Atomic certificate numbering, autosave server, state machine laporan, normalisasi sekolah, notification outbox, kurikulum resmi berversi, moderasi bank soal, redesign umum, dan aktivasi multitenant ditunda ke tahap berikutnya. Tidak ada klaim bahwa Tahap 1 menyelesaikan seluruh temuan audit.
