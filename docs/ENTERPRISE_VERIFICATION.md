# Verifikasi koreksi enterprise — 24 Oktober 2026

Rencana aktif: [ROADMAP_ENTERPRISE.md](ROADMAP_ENTERPRISE.md). Hasil di bawah adalah pengukuran lokal setelah instalasi bersih `npm ci`, bukan status deployment atau audit produksi live.

## Hasil pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `npm ci` | Lulus; TypeScript proyek 5.9.3, lockfile dipakai |
| `npm run typecheck` | Lulus |
| `npm run test:coverage` | 98 berkas lulus, 1 berkas integrasi dilewati; 1.117 tes lulus, 1 dilewati |
| `npm run test:integration` | Tes integrasi yang dilewati suite umum dijalankan terpisah dan lulus pada Miniflare D1 terisolasi |
| `npm run check:migrations` | 45 migrasi dari kosong dan upgrade sebelum 0028 lulus; baris historis dipertahankan; schema, foreign key dan integrity lulus |
| `npm run check:secrets:full` | Lulus untuk working tree; binary dilewati secara eksplisit; bukan scan riwayat Git |
| `npm audit --omit=dev` | Nol advisory pada dependency produksi |
| `npm run build` | Lulus; CSS diminifikasi ke dist tanpa menulis ulang CSS tracked |
| `npm run check:build-budget` | Lulus untuk Worker, graph import lokal statis dan CSS |
| `git diff --check` | Lulus; Git mengeluarkan peringatan konversi LF/CRLF, bukan galat whitespace |

Coverage berdasarkan konfigurasi saat pemeriksaan: statements 64,37%, branches 57,24%, functions 74,03%, lines 66,47%. Ini bukan cakupan seluruh JavaScript browser. Sebagai pembanding audit sebelum koreksi: lines 64,76%; crypto function coverage 0%. Kini `crypto.ts` lines 76,19%, `auth.ts` lines 86,36%, dan `env.ts` lines 100%.

Artefak final:

- Worker backend raw: 5.781.420 byte; budget 6.291.456.
- Initial local JS raw: 221.189 byte, 20 modul statis; budget 262.144.
- Stylesheet raw: 382.831 byte; budget 524.288.
- Browser initial graph tidak mencakup dynamic-import halaman, library CDN, font atau gambar. Jangan menyamakan angka ini dengan total transfer browser atau TTI.

## Perilaku yang diuji

- Transport browser + middleware CSRF yang sebenarnya untuk respons binary dan multipart, token hilang/tidak cocok, refresh paralel, retry maksimal sekali, dan tidak mengulangi POST karena jaringan.
- Unduhan RPP, ATP Elemen dan Program Sekolah melewati aplikasi utama; arsip Word dibuka dan isi XML diperiksa.
- Field `gugus` dan diagram visual slide dipertahankan; visual invalid ditolak.
- Konfigurasi runtime salah menghasilkan 503 aman sebelum query; binding layanan dipertahankan.
- Ciphertext tidak dikosongkan ketika dekripsi gagal; ciphertext tidak dikirim sebagai kredensial provider; pembaruan metadata tidak mengubah field provider yang tidak dikirim.
- Rollback mutasi settings, pengguna, password/sesi, CRUD provider dan toggle ketika audit gagal.
- Pencabutan sesi, role/active state terbaru dan kedaluwarsa ISO-8601 dibaca pada request berikutnya.
- Hash legacy di-upgrade saat login, password salah tidak memicu migrasi, dan reset password yang memenangkan CAS tidak ditimpa.
- Admission AI gagal secara tertutup ketika skema/penyimpanan kuota tidak tersedia; reservation asesmen ditutup dengan status penolakan.
- Scanner mencakup `.github`, untracked nonignored, serta byte index; kegagalan enumerasi Git tidak dianggap hasil bersih.

## Batas dan pekerjaan operasional

Audit dependency penuh masih mencatat 22 advisory toolchain (4 moderate, 14 high, 4 critical). Percobaan pembaruan otomatis berhenti pada konflik peer Workers types 4.x dengan Wrangler terbaru yang memerlukan 5.x. Tidak digunakan pemaksaan dependency. Pembaruan toolchain memerlukan pekerjaan kompatibilitas tersendiri; hasil nol audit produksi tidak berarti seluruh dependency aman.

Masih diperlukan bukti operator untuk konfigurasi secret live, migrasi key yang sudah dipakai, pemisahan staging/preview, backup/restore D1 dan object storage, smoke test browser serta alert yang benar-benar diterima. Aplikasi tetap tenant tunggal. Tahap 2–3 merupakan backlog bersyarat sesuai roadmap, bukan klaim sudah diterapkan seluruhnya.
