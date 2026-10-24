# Roadmap enterprise RuangKKG — revisi 24 Oktober 2026

Dokumen ini menggantikan urutan Fase 0–3 pada audit percakapan sebelumnya. Desain dan perubahan mengikuti audit ulang yang disetujui pemilik proyek. Spesifikasi Stage 1–4 tanggal 16 Oktober adalah catatan historis, bukan daftar pekerjaan yang harus diterapkan ulang.

## Prinsip keputusan

- Pertahankan Hono, Pages, D1/R2, frontend modular, format dokumen dan tenant tunggal.
- Gunakan admission D1, batch atomik, idempotensi dan lazy loading yang sudah ada.
- Perubahan kecil dan kompatibel lebih diutamakan daripada penulisan ulang framework/DDD.
- Bedakan bukti tes lokal dari bukti operasional produksi. Pemeriksaan lokal tidak membuktikan rotasi secret, backup produksi, isolasi preview atau alert live.
- Migrasi SQL yang sudah dirilis bersifat append-only. Dua nama berbeda dengan awalan `0010` tidak perlu diganti nama.

## Urutan dan kriteria kelulusan

| Tahap | Pekerjaan | Bukti kelulusan |
| --- | --- | --- |
| 0.1-A | Transport bersama untuk JSON, multipart, ekspor binary; CSRF tanpa bypass tes; kontrak visual slide dan pengaturan | Request klien melewati middleware sebenarnya; token hilang/tidak cocok ditolak; dokumen binary tetap dapat dibaca; diagram dan `gugus` dipertahankan |
| 0.1-B | TypeScript lokal terkunci, tes backend Node/tes DOM terpisah, scanner dengan cakupan jelas, budget Worker dan browser terpisah | `npm ci`, typecheck, tes/coverage, scanner dan pemeriksaan build lulus; tes tidak mengubah aturan keamanan produksi |
| 0.1-C | Environment fail-safe, key wajib pada operasi enkripsi provider, kegagalan dekripsi bertipe, panduan migrasi key | Layanan inti tidak diblokir oleh key fitur opsional; operasi enkripsi tetap fail-closed; binding DB/R2/AI tetap ada; key lama tidak ditimpa saat gagal dibaca |
| 1-A | Admission AI fail-closed; sesi dibaca segar; upgrade hash legacy saat login; audit atomik untuk mutasi administratif sensitif | Tes autentikasi, revokasi, rollback audit, CAS upgrade password, dan kegagalan skema admission lulus |
| 1-B | Uji migrasi dari kosong dan upgrade; panduan staging terisolasi, backup/restore dan alert | Uji migrasi lokal lulus; operator mencatat hasil drill staging/restore/alert sebelum rilis produksi |
| 2 | Refactor modul berdasarkan profiling, dokumentasi kontrak API, optimasi aset/query | Perubahan terukur dengan kontrak fitur tetap lulus; bukan migrasi framework wajib |
| 3 | Kesiapan operasional dan perluasan sesuai kebutuhan organisasi | SLO per kelas operasi, pemilik insiden, retensi, budget AI dan drill restore; multitenant/SSO/queue hanya melalui desain kebutuhan tersendiri |

## Keputusan teknis

### Request dan CSRF

`api()` tetap mengembalikan envelope JSON. Tambahkan `apiFetch()` untuk mendapatkan Response termasuk blob dan streaming. Keduanya memakai transport request yang sama untuk header CSRF, credentials dan serialisasi JSON/FormData. Retry CSRF maksimal sekali per request; POST tidak diulang karena gangguan jaringan. Retry hanya ketika server menyatakan pemeriksaan CSRF gagal sebelum menjalankan handler. Refresh token dideduplikasi untuk request paralel. Request same-origin saja agar token tidak terkirim ke host lain.

Pengecualian CSRF hanya exact path pre-auth (login/register/forgot/reset). Logout, upload, maintenance, AI dan ekspor dilindungi. Cookie CSRF dapat dibaca JavaScript, memakai Path=/, SameSite=Lax dan Secure pada HTTPS. Tes backend berjalan di Node, tanpa cabang `VITEST` di middleware.

### Konfigurasi dan enkripsi

Environment yang tidak diisi dianggap production. Lokal memakai `.dev.vars` dengan `ENVIRONMENT=development`. ENCRYPTION_KEY atau SECRET_KEY yang valid diperlukan ketika membaca/menulis kredensial provider terenkripsi, bukan untuk seluruh situs. Kekurangannya menghasilkan readiness fitur `credential_encryption=false` pada health; halaman umum, login dan storage tetap tersedia. Nilai kosong opsional dinormalisasi; field hasil parsing digabungkan ke binding asli, bukan menggantikannya dengan skema string saja. Konfigurasi yang diisi tetapi tidak valid menghasilkan 503 generik; log hanya nama field yang salah, tanpa nilainya. Maintenance tetap tersembunyi di luar development.

Enkripsi AES-GCM dan format ciphertext lama dipertahankan. Tidak ada fallback key publik. Kegagalan dekripsi tidak sama dengan kredensial kosong: pembacaan/pembaruan provider harus gagal tanpa mengirim ciphertext ke provider atau menghapus key lama. Penggantian key enkripsi memerlukan backup dan re-enkripsi terkontrol; bukan penggantian secret acak pada deployment.

### Autentikasi dan audit

Cache otorisasi lintas-request dihapus agar sesi yang dicabut dan role terbaru terlihat pada request berikutnya. Hash SHA-256 legacy masih diterima selama transisi. Login berhasil meng-upgrade hash dengan compare-and-set terhadap hash yang diverifikasi; perubahan password konkuren tidak boleh diteruskan menjadi sesi baru menggunakan password lama.

Mutasi settings, CRUD pengguna administratif, reset password, CRUD provider dan toggle provider memakai D1 batch dengan audit. Reset password menyertakan pencabutan sesi dalam batch yang sama. Telemetry dan audit aktivitas nonkritis tetap best-effort; tidak ada penambahan log kredensial. Audit moderasi dan outbox yang sudah atomik dipertahankan. Perluasan ke persetujuan/reject/bulk pengguna dan domain lain dikerjakan per kontrak transaksi, bukan dengan mengubah seluruh audit best-effort menjadi fatal.

### Pengujian dan delivery

Budget awal diturunkan dari baseline terukur, bukan batas arbitrer seluruh `dist`. Worker backend diukur sendiri; browser entry diukur terpisah dari total aset. Coverage tidak diturunkan dari baseline tanpa tinjauan; tes perilaku keamanan lebih penting daripada persentase global. Integrasi Miniflare dan migrasi lokal menjadi pemeriksaan CI tersendiri.

## Batas penerapan operasional

Panduan deployment berada di `docs/OPERATIONS_RUNBOOK.md`. Status produksi hanya boleh dinyatakan selesai setelah operator memverifikasi resource preview terpisah, secret aktif yang tepat, backup D1/R2, pemulihan, health dan penerimaan alert. Status tersebut tidak disimpulkan dari kode atau tes lokal.

## Status penerapan dan pekerjaan berikutnya

- 0.1-A/B/C dan lingkup 1-A di atas: diterapkan, diperiksa melalui tes kontrak dan regresi lokal; hasil final tercatat pada `docs/ENTERPRISE_VERIFICATION.md`.
- 1-B: pemeriksaan migrasi kosong/upgrade serta integrasi D1 tersedia dan lulus lokal. Staging/restore/alert live masih memerlukan bukti operator, bukan ditandai selesai oleh tes.
- Dependency runtime: Zod dan Undici pada jalur produksi sudah diperbarui melalui lockfile; audit produksi menghasilkan nol advisory pada pemeriksaan ini.
- Dependency toolchain: audit penuh masih menemukan 22 advisory (4 moderate, 14 high, 4 critical). Pembaruan otomatis berhenti pada konflik peer Workers types 4.x dengan Wrangler terbaru yang memerlukan 5.x. Kerjakan pembaruan toolchain terkoordinasi dengan pengujian Vite/Pages, Sentry, Miniflare dan DOM; jangan gunakan `--force` atau `--legacy-peer-deps` untuk menganggap masalah selesai.
- 2–3: backlog bersyarat. Mulai dari profiling, kontrak API dan bukti operasional; migrasi framework, multitenant, queue atau layanan observability tambahan membutuhkan kebutuhan terukur.
