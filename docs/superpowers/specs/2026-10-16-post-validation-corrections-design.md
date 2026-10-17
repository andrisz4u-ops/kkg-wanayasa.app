# Koreksi hasil validasi Tahap 1–4

## Persetujuan dan batas

Pengguna menyetujui rekomendasi koreksi pada laporan validasi dengan "Ya lakukan perbaikan". Ini perbaikan terarah, bukan perancangan ulang. Pertahankan semua perubahan kerja yang sudah ada. Jangan commit, deploy, menerapkan migrasi produksi, mengubah secret, memasang dependensi, atau membuat perubahan data destruktif. Dev server dan watcher yang sedang berjalan tetap dipertahankan.

## Perubahan

1. **Boot UI:** perbaiki escaping regex marker pada HTML hasil render. Marker harus terdeteksi di awal atau setelah cookie lain dengan whitespace. Marker hanya petunjuk UI, bukan autentikasi. Pertahankan landing publik, skeleton, dan desain. Tes harus mengeksekusi skrip dari hasil render template dan mencakup marker hilang, urutan cookie, serta false positive.
2. **Upload:** tetap batasi stream sebelum decoding, validasi tipe/signature, jumlah file, ownership dan visibility. Ganti parser multipart khusus yang salah mendeteksi boundary dengan parser platform pada body yang sudah dibatasi, atau parser framing yang benar bila platform tidak kompatibel. Pastikan data biner tersimpan identik, termasuk pola mirip boundary di dalam file, dan request malformed ditolak secara terkontrol.
3. **Validasi CP:** bedakan pemeriksaan struktur/heuristik, keselarasan yang belum dinilai, dan review AI/guru. Jangan menganggap keselarasan belum dinilai sebagai benar, atau memberi label standardisasi pedagogis penuh pada hasil heuristik. Jangan menambah biaya panggilan AI hanya untuk mempertahankan label lama. Pertahankan perhitungan struktur dan pemeriksaan ulang setelah repair; perbarui kontrak dan consumer yang diperlukan tanpa mengubah layout/desain. Tes materi/CP tidak terkait di luar detektor IPAS serta keberhasilan heuristik tanpa review.
4. **Kalender:** baca field kegiatan aktual di dalam INSERT SELECT batch reservasi, bukan binding snapshot dari SELECT sebelumnya. Tetap idempoten, hitung insert aktual, dan jangan menimpa event yang sudah ada atau edit manual. Tes interleaving perubahan kegiatan sebelum batch dan perlindungan event lama.
5. **Typecheck:** inventaris error lengkap lalu perbaiki tipe/kontrak yang benar. Jangan menyembunyikan masalah melalui ts-nocheck, broad any, mengeluarkan source/test yang sebelumnya diperiksa, atau menurunkan strictness. Bila perbaikan memerlukan perubahan perilaku/kontrak luas, laporkan sebelum memperluas scope.

### Integrasi Sentry yang ditemukan saat typecheck

Versi SDK yang terpasang tidak mengekspor fungsi `init` pada public entry point. Perbaikannya menggunakan API publik request wrapper pada middleware pertama Hono, dengan isolasi per request dan tanpa mengubah export aplikasi. Pertahankan sampling, nonaktifkan pengiriman PII, dan redact data sensitif pada event maupun transaksi. Request tanpa DSN tidak boleh menggunakan client request sebelumnya. Error tetap ditangkap satu kali oleh handler Hono; kegagalan inisialisasi tidak boleh menjalankan handler aplikasi dua kali. Tes menggunakan transport lokal/mocked, tanpa mengirim event atau mengaktifkan layanan berbayar. Ini koreksi kompatibilitas SDK, bukan perluasan telemetry produksi.

Deklarasi `.d.ts` modul browser harus mengikuti export dan kontrak implementasi yang ada. Deklarasi tersebut membantu pemeriksaan consumer TypeScript, bukan bukti bahwa seluruh implementasi JavaScript telah diperiksa ketat. Strictness dan cakupan source/test TypeScript tetap dipertahankan.

## Pembagian pekerjaan dan verifikasi

Lanes tulis terpisah: boot template oleh designer; upload route/test oleh fixer; kalender helper/test oleh fixer; validator CP/test oleh fixer setelah keputusan kontrak; typecheck diinventarisasi dulu dan diperbaiki pada file yang tidak sedang dimiliki lane lain. Orchestrator memiliki integrasi, copy review, dan browser validation; tiap specialist memiliki focused regression tests.

Jalankan focused tests per lane, independent review untuk parser/integritas/kejujuran validator, lalu full test suite, secrets check, diff check, dan typecheck. Build memakai salinan project sementara terisolasi tanpa secret agar tidak menulis aset yang sedang dipakai watcher. Uji kembali regex pada HTML aktual di browser, landing/login publik dan viewport mobile. Jangan menyamakan unit tests/build dengan validasi produksi atau audit aksesibilitas menyeluruh.

## Batas klaim Tahap 4

Koreksi ini tidak otomatis menyediakan rate limiter umum terdistribusi, akuntansi biaya provider, integrasi produksi Worker/D1/R2, maupun sertifikasi aksesibilitas. Cakupan tersebut tetap harus dinyatakan belum lengkap sampai diimplementasikan dan dibuktikan; jangan menandai roadmap awal seluruhnya selesai.

## Bukti verifikasi akhir — 16 Oktober 2026

- `npm test -- --run`: 75 file, 875 tes lolos. Termasuk regresi framing upload biner, sinkron kalender dengan interleaving, status struktur CP, skrip boot dari HTML hasil render, kontrak modul browser, dan isolasi Sentry dengan transport lokal berbeda. Sejumlah tes jalur kegagalan sengaja menghasilkan log error; fixture auth juga belum memiliki kolom `last_login_at`, sehingga jalur best-effort tersebut mencetak peringatan tanpa menggagalkan tes marker.
- `npx tsc --noEmit --pretty false`: lolos tanpa diagnostik. Strictness dan cakupan TypeScript tetap; deklarasi browser tidak berarti seluruh JavaScript telah diperiksa ketat.
- `npm run check:secrets` dan `git diff --check`: lolos; Git hanya memperingatkan konversi line ending LF/CRLF.
- Build produksi pada salinan terisolasi: `npm run build -- --configLoader runner`, exit 0, 573 modul. Hanya peringatan Browserslist usang. Aset CSS/vendor asli memiliki hash yang sama sebelum dan sesudah build; watcher dan port 5173 tidak dihentikan.
- Skrip marker pada HTML aktual telah diuji di browser untuk urutan cookie dan whitespace; landing/login serta viewport mobile diperiksa tanpa login pengguna. Smoke check akhir `/login` memberi HTTP 200 dan pola regex marker yang benar.
- Review independen menutup blocker parser/kalender dan isolasi client Sentry. Tidak ada pengiriman event Sentry nyata, penggunaan provider berbayar, perubahan secret, migrasi produksi, deployment, atau commit.

Hasil ini adalah verifikasi lokal dan source review pada cakupan koreksi, bukan jaminan seluruh roadmap Tahap 4 atau kesiapan produksi menyeluruh. Dashboard terautentikasi belum diuji secara visual dengan kredensial pengguna.
