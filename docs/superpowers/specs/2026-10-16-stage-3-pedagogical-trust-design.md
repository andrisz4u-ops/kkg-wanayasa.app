# Tahap 3 — Jejak sumber dan tinjauan pedagogis

## Otorisasi dan batas

Pengguna telah mengotorisasi pelaksanaan bertahap setelah tahap sebelumnya lolos verifikasi. Tahap 2 selesai: 796 tes dalam 61 berkas, build, dan pemeriksaan rahasia lulus. Perubahan lama pengguna dipertahankan. Tidak ada commit, deployment, perubahan rahasia, migrasi produksi, layanan berbayar baru, atau penghapusan data historis dalam pekerjaan ini.

Tahap ini meningkatkan keterlacakan dan kejujuran status, bukan menjamin kebenaran materi. Tidak ada koreksi massal teks CP, atribusi sumber rekaan, penilaian otomatis sebagai persetujuan guru, maupun pencocokan dokumen historis berdasarkan kemiripan judul/waktu.

## 1. Provenance kurikulum

- Migrasi aditif `0038_curriculum_source_provenance.sql` menyimpan snapshot append-only sumber CP/elemen: mata pelajaran, fase, asal, label regulasi yang memang tersedia, locator opsional, hash SHA-256 kanonis, dan waktu pencatatan.
- Identitas snapshot mencakup seluruh fakta provenance yang disimpan, termasuk asal komponen, label regulasi, dan locator; hash isi terpisah boleh digunakan untuk membandingkan teks. Keduanya bukan bukti resmi atau benar. Data lama dan fallback statis berstatus belum ditinjau; tidak diisi reviewer/citation yang tidak diketahui.
- Resolver pendamping mengembalikan teks, elemen, asal aktual, identitas versi/hash, dan status sumber; helper string lama tetap kompatibel. Snapshot tidak boleh memadukan teks D1 dengan elemen statis tanpa menyebutkan asal masing-masing.
- Sumber input pengguna diberi asal `user-input`, bukan metadata sumber resmi. Teks CP yang benar-benar masuk prompt harus cocok dengan snapshot. Penyimpanan provenance gagal harus menghasilkan status eksplisit tidak tercatat atau kegagalan sebelum provider, bukan metadata versi palsu.
- CP analysis, RPP, dan asesmen membawa metadata `_provenance.curriculum` dari server. Hasil serta history JSON mempertahankannya; versi baru tidak ditempelkan ke hasil lama. Hubungan lintas dokumen hanya dicatat jika identitas dokumen sumber dipilih eksplisit dan aksesnya sah.
- Teks CP/elemen lama tidak diubah. Snapshot versi lama tidak diperbarui ketika katalog CP berubah.

## 2. Tinjauan guru atas dokumen privat

- Migrasi `0039_document_teacher_reviews.sql` menyediakan catatan tindakan eksplisit append-only, terikat pemilik, module/document ID, revisi persisten, dan hash kanonis judul+payload yang dihitung server.
- Endpoint owner-only di bawah `/api/document-drafts/:module/:documentId/review` menerima revisi yang diharapkan, status `reviewed` atau `rejected`, dan ID tindakan stabil untuk retry. Status tanpa tindakan adalah `needs-review`.
- Tinjauan berarti pengguna menyatakan sudah meninjau versi tersebut, bukan sertifikasi kebenaran. Aktor berasal dari sesi; klien tidak dapat memasok identitas reviewer atau hash tepercaya. Tidak ada pemberian akses dokumen privat kepada admin/operator.
- Insert bersyarat atas revisi aktif mencegah persetujuan versi yang berubah selama request. Retry tindakan identik idempoten; penggunaan ulang ID dengan isi berbeda ditolak. Perubahan status merupakan tindakan baru, bukan penulisan ulang histori.
- Respons dokumen aktif hanya menampilkan tinjauan yang cocok revisi/hash aktif. Edit menjadikan status aktif kembali `needs-review`, tanpa menghapus histori lama. GET daftar draf tetap metadata-only, tanpa membaca seluruh payload.
- UI pertama pada slide yang sudah memiliki sinkronisasi server: flush snapshot dan tunggu sinkronisasi sebelum tindakan; offline, konflik, pergantian akun, atau perubahan versi tidak boleh memberi label ditinjau. Salinan lokal tetap aman.

## 3. Bank soal privat dan moderasi

- Migrasi `0040_bank_soal_moderation.sql` mempertahankan visibilitas dan isi seluruh data lama, memberi penanda kompatibilitas legacy, dan menambah status moderasi serta audit aktor/waktu.
- Soal baru privat secara default, termasuk auto-save generator. Berbagi adalah opt-in eksplisit; niat berbagi (`is_public`) tidak sama dengan persetujuan moderator. Opt-in baru berstatus pending dan belum tampil publik sampai disetujui admin.
- Akses komunitas selalu mensyaratkan `is_public = 1`, status approved atau kompatibilitas legacy, serta tidak disembunyikan. Penarikan atau pengajuan ulang eksplisit menghapus pengecualian legacy sehingga pengajuan ulang harus dimoderasi. Soal privat lama tetap privat. Pemilik tetap dapat membaca soal sendiri; role admin tidak otomatis dapat membaca soal privat orang lain.
- Moderator admin hanya melihat antrean yang sengaja diajukan untuk berbagi, serta dapat menyetujui atau menyembunyikan publikasi. Tidak memperluas hak operator. Persetujuan tidak mengubah soal privat menjadi publik.
- List, detail, stats, use, dan review menggunakan predicate visibilitas konsisten. ID soal privat/tersembunyi tidak dapat dipakai untuk menambah penggunaan atau review oleh pengguna lain.
- Kebijakan delete yang ada dipertahankan. Runtime schema initialization harus konsisten dengan migrasi, tidak mengubah seluruh data menjadi legacy setiap request.
- UI memberikan pilihan berbagi yang tidak tercentang default, status privat/menunggu/moderasi, dan antrean moderator dengan copy biasa, tanpa redesign.

## 4. Analitik mutu yang tidak menyesatkan

- Endpoint strict-admin baru menyajikan jumlah dokumen aktif `needs-review`, `reviewed`, dan `rejected`, beserta denominator dan cakupan modul.
- Agregat berdasarkan status aktif tiap dokumen, bukan jumlah klik tindakan atau jumlah generation. Tidak mengklaim ketepatan materi, keberhasilan pembelajaran, atau biaya dari data yang tidak tersedia.
- Tidak mengembalikan payload, nama guru, ID dokumen, maupun rincian privat. Breakdown modul dengan cohort kurang dari lima disembunyikan; total global tetap diberi cakupan yang jelas.
- Log generation dan token kumulatif lama tetap metrik penggunaan, bukan approval. Tidak ada tautan historis yang ditebak.

## Implementasi terpisah

1. Provenance: resolver/helper/migrasi 0038 dan generator CP/RPP/kisi, tes snapshot dan fallback. Penulis ini juga mengintegrasikan kontrak auto-save privat bank soal setelah helper moderasi siap, agar tidak ada dua penulis pada `kisi.ts`.
2. Teacher review: helper/route/migrasi 0039 serta endpoint analitik agregat tersendiri; registrasi index dibatasi import+route. Kontrak API ditulis untuk designer.
3. Bank soal: route/helper/migrasi 0040, runtime schema parity, tes otorisasi dan moderasi; tidak mengedit `kisi.ts` bersamaan dengan provenance.
4. Designer: integrasi UI setelah kontrak backend tersedia; menjaga visual dan draft offline yang sudah ada.

Setiap penulis memiliki tes fokus; integrasi dan verifikasi gabungan dimiliki pengelola. Review independen dipakai untuk race, batas privasi, dan provenance yang berpotensi menyesatkan.

## Verifikasi penerimaan

- Resolver membedakan D1, fallback, campuran, dan input pengguna; hash deterministik berubah saat isi berubah; sumber lama tetap utuh.
- Metadata hasil mengacu isi yang benar-benar dipakai, tersimpan dalam history, tanpa hubungan dokumen implisit atau klaim resmi baru.
- Review: anonymous/foreign-owner ditolak, hash dari server, stale revision/race ditolak, retry idempoten, edit membatalkan status aktif, histori tetap.
- Bank soal: default privat, pending tak terbaca komunitas, approved tetap memerlukan opt-in, legacy tetap kompatibel, akses/use/review konsisten, admin tidak mendapatkan akses privat tak sengaja.
- Analitik tidak memuat identitas atau isi dan tidak menghitung ulang satu dokumen sebagai banyak dokumen.
- Tes frontend meliputi flush sebelum review, offline, konflik, edit setelah review, pergantian akun, dan recovery lokal.
- Setelah seluruh writer selesai: suite lengkap, secrets check, diff check, dan build. Build membackup/memulihkan byte aset generated yang telah diedit pengguna. Pengujian lokal/mock/SQLite tidak diklaim sebagai validasi produksi atau kebenaran kurikulum.
