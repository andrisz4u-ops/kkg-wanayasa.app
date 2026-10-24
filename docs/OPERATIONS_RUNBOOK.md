# Operasi dan rilis RuangKKG

Roadmap aktif: [ROADMAP_ENTERPRISE.md](ROADMAP_ENTERPRISE.md). Pemeriksaan otomatis di bawah memakai resource lokal. Catatan rilis produksi disimpan oleh operator pada sistem privat; jangan menyimpan backup, plaintext key, token atau data guru di dokumen repository.

## 1. Pemeriksaan yang dapat diulang

Gunakan Node.js 24 dan lockfile repository:

```bash
npm ci
npm run typecheck
npm run check:secrets:full
npm run check:migrations
npm run test:coverage
npm run test:integration
npm run build
npm run check:build-budget
npm audit --omit=dev
```

`check:migrations` menerapkan seluruh SQL asli pada database in-memory dan menguji upgrade dari skema sebelum migrasi 0028 dengan data pengguna/sesi. Pemeriksaan tersebut meliputi skema yang diperlukan aplikasi, foreign key dan integrity. `test:integration` memakai Miniflare D1 terisolasi, bukan database pengembangan yang sudah ada.

`check:secrets:full` memeriksa working tree, termasuk file untracked yang tidak diabaikan Git; `node scripts/check-secrets.mjs --staged` membaca byte index. Keduanya bukan pemindaian riwayat Git. Untuk insiden key lama, lakukan pemindaian riwayat menggunakan alat khusus dengan keluaran privat, lalu verifikasi pencabutan kredensial pada penyedia.

Build meminifikasi CSS langsung ke `dist` sehingga file CSS tracked tidak ditulis ulang oleh build produksi. Budget awal setelah audit: Worker raw 6 MiB, graph modul lokal statis dari main.js 256 KiB, stylesheet raw 512 KiB. Modul halaman dynamic-import dan library CDN tidak termasuk angka initial-local-JS; ukur network dan Web Vitals pada browser secara terpisah. Budget ini pengendali regresi proyek, bukan klaim batas platform Cloudflare.

## 2. Konfigurasi dan staging

- Lokal: salin `.env.example` ke `.dev.vars`, pilih `ENVIRONMENT=development`, jalankan migrasi lokal. Enkripsi provider tetap memerlukan key eksplisit di development.
- Runtime menganggap environment yang tidak diset sebagai production. Production/staging memerlukan ENCRYPTION_KEY atau SECRET_KEY minimal 16 karakter non-spasi. Untuk key baru gunakan material acak 32 byte atau lebih dari secret manager.
- Untuk deployment yang sudah memiliki ciphertext, gunakan key yang sesuai; ikuti bagian migrasi key sebelum menggantinya.
- Pilih project/environment Pages yang dimaksud saat menyimpan secret. Jalur CLI Pages: `npx wrangler pages secret put ENCRYPTION_KEY --project-name kkg-wanayasa`. Untuk preview/project staging, gunakan pengaturan secret pada environment/project yang bersangkutan; jangan mengasumsikan secret production diwariskan dengan benar.
- Preview harus memiliki database D1, bucket R2/Supabase dan key provider pengujian tersendiri. Periksa ID binding aktual di dashboard/config sebelum menjalankan perubahan data. Verifikasi itu belum dibuktikan oleh keberadaan `wrangler.jsonc`.
- Jalankan pemeriksaan migrasi kosong/upgrade, lalu migrasi pada staging. Lakukan smoke test login, logout, reset password, role, upload, ekspor, generasi dan pembatalan/recovery AI menggunakan data sintetis.

## 3. Key enkripsi dan kredensial provider

Bedakan key enkripsi aplikasi dari API key penyedia. Mengganti yang pertama membuat ciphertext lama tidak terbaca; mengganti API key penyedia tidak otomatis mengenkripsi ulang data lainnya.

Urutan migrasi key aplikasi:

1. Inventarisasikan penyimpanan kredensial (`ai_providers.api_key` dan konfigurasi legacy di settings), format ciphertext/plaintext, serta key yang dipakai. Jangan mencetak nilainya.
2. Ambil backup konsisten D1 dan simpan key lama melalui secret manager dengan akses terbatas. Tentukan release dan titik pemulihan.
3. Pada salinan staging privat, baca dengan key lama, enkripsi ulang dengan key baru menggunakan format AES-GCM aplikasi, lalu verifikasi seluruh baris dapat dibaca kembali dan jumlah baris cocok. Jangan melewati baris yang gagal.
4. Hentikan sementara perubahan provider ketika migrasi dijalankan. Terapkan perubahan ciphertext dan secret sebagai prosedur rilis terkoordinasi; jangan menambahkan kembali fallback key publik di kode.
5. Uji pembacaan provider, pembaruan field non-key, rekonsiliasi masked key dan inference sintetis dengan batas biaya kecil. Kegagalan dekripsi harus menghasilkan error dan mempertahankan ciphertext lama.
6. Bila verifikasi gagal, pulihkan pasangan data dan key yang cocok. Jangan memulihkan hanya salah satunya. Cabut kredensial penyedia yang pernah terekspos; dokumentasikan konfirmasinya dari penyedia.

Tidak ada migrasi key produksi otomatis pada aplikasi. Jika data pernah memakai fallback publik, perlakukan kredensial di dalamnya sebagai berpotensi terekspos dan rotasi juga pada penyedia setelah pemulihan terverifikasi.

## 4. Backup dan drill restore

- Catat recovery point D1 dan ambil export/backup menggunakan fasilitas D1 yang tersedia pada akun. Simpan export di storage privat terenkripsi, di luar Git dan public bucket.
- Backup file R2/Supabase beserta manifest key objek, digest, metadata kepemilikan dan referensi database. Byte gambar asesmen yang berada dalam D1 mengikuti backup D1; berkas yang berada pada object storage memerlukan backup tersendiri.
- Restore terlebih dahulu ke D1 dan bucket latihan terpisah. Pasang key enkripsi yang cocok dengan backup. Jangan mengarahkan aplikasi produksi ke resource latihan.
- Bandingkan jumlah baris penting, foreign key, digest file, kepemilikan akses dan hasil ekspor. Uji kredensial tidak terbaca dengan key salah tanpa mengubah data asli.
- Ukur durasi pemulihan aktual dan selisih recovery point. Gunakan hasil ini untuk menetapkan RTO/RPO yang realistis.
- Arsip `storage-archive.js` berada di browser. Backup D1 bukan backup riwayat lokal tersebut; pengguna perlu ekspor/penyimpanan tersendiri sampai fitur sinkronisasi memang dirancang.

Drill dinyatakan lulus hanya setelah operator merekam release, tanggal, resource sumber/tujuan, hasil verifikasi, durasi dan penanggung jawab. Hasil tes migrasi lokal bukan bukti restore produksi.

## 5. Monitoring dan respons insiden

- Pantau `/api/health` dari monitor eksternal. 503 CONFIGURATION_ERROR menunjukkan konfigurasi runtime belum siap; 503 ADMISSION_UNAVAILABLE menolak panggilan AI ketika kuota D1 tidak dapat diperiksa.
- Konfigurasikan Sentry dan tujuan log Cloudflare pada environment yang tepat. Error sampling 100% dan trace sampling 10% adalah baseline kode; verifikasi event benar-benar diterima dengan kejadian sintetis dan request ID.
- Ukur API baca biasa, login/ekspor, waktu token pertama AI, waktu selesai, tingkat keberhasilan generasi, error provider dan penggunaan biaya sebagai kelas operasi terpisah. Tetapkan target setelah baseline beban representatif tersedia.
- Tetapkan penerima alert dan prosedur pemulihan. Uji bahwa kegagalan konfigurasi, admission dan provider menghasilkan alert yang diterima, bukan hanya log.
- Untuk masalah key/provider, hentikan mutasi konfigurasi dan ikuti prosedur key. Untuk masalah migrasi, utamakan migrasi koreksi baru atau recovery point yang sudah diverifikasi, bukan rename file migrasi lama.

## 6. Kriteria rilis dan fase lanjutan

Rilis memerlukan seluruh gate lokal/CI lulus serta bukti staging terisolasi, backup yang dapat dipulihkan, konfigurasi secret sesuai, smoke test fitur, dan penerima alert aktif. Status dashboard, secret, restore dan alert live harus diverifikasi operator.

Multitenant tetap ditutup. Pembukaan tenant memerlukan desain skema, backfill, kepemilikan baca/tulis/join, uniqueness, berkas, cache/job dan tes lintas-tenant. Queue dipertimbangkan bila pekerjaan harus bertahan setelah browser terputus; consumer pada Pages memerlukan Worker terpisah. Pilihan framework, observability tambahan, SSO dan IaC didorong kebutuhan terukur, bukan checklist teknologi.
