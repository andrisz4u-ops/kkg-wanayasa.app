# RuangKKG Wanayasa

Ruang kerja digital KKG Gugus 3 Wanayasa untuk mengelola kegiatan komunitas dan menyusun perangkat ajar. Guru dapat menggunakan Analisis CP, RPP, asesmen, slide, dan game edukasi. Pengelola memiliki fitur program sekolah, presensi, sertifikat, surat, materi, forum, dan laporan.

## Teknologi

- Hono dan TypeScript pada Cloudflare Pages Functions
- Antarmuka JavaScript dengan Tailwind CSS
- Cloudflare D1 untuk data dan R2 untuk berkas
- Penyedia AI dikonfigurasi melalui panel administrator

## Menjalankan secara lokal

Gunakan Node.js 24. Salin `.env.example` ke `.dev.vars` dan pilih `ENVIRONMENT=development`. Simpan secret lokal di `.dev.vars`, bukan di Git. Operasi enkripsi kredensial provider memerlukan key eksplisit; jangan mengganti key yang sudah dipakai tanpa migrasi ciphertext. Halaman umum, autentikasi dan storage tetap berjalan tanpa key provider tersebut; health menandai fitur enkripsi belum siap.

```bash
npm ci
npm run db:migrate:local
npm run dev
```

`npm run db:seed` mengisi data contoh untuk pengembangan. Data itu mencakup akun demo dan tidak boleh digunakan di produksi. Arsip dokumen pada `public/static/js/storage-archive.js` saat ini disimpan di browser pengguna; riwayat tersebut belum tersinkron antarperangkat.

## Pemeriksaan sebelum rilis

```bash
npm run check:secrets:full
npm audit --omit=dev
npm run typecheck
npm run check:migrations
npm run test:coverage
npm run test:integration
npm run build
npm run check:build-budget
```

Pemeriksaan ini berjalan pada pull request melalui `.github/workflows/verify.yml`. TypeScript dikunci sebagai devDependency. Tes backend HTTP memakai environment Node, sedangkan tes UI memakai DOM. Pengujian integrasi D1 berjalan terisolasi; tidak memakai database produksi.

Roadmap aktif: [docs/ROADMAP_ENTERPRISE.md](docs/ROADMAP_ENTERPRISE.md). Prosedur staging, migrasi key, backup/restore, monitoring dan kriteria rilis: [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md).

## Database dan deploy

Migrasi berurutan berada di `migrations/`. Untuk database produksi yang terdaftar di `wrangler.jsonc`, tinjau migrasi dan siapkan cadangan sebelum menjalankan:

```bash
npx wrangler d1 migrations apply kkg-wanayasa-db --remote
npm run deploy:prod
```

Migrasi `0031_ai_generation_feature_accuracy.sql` memperluas kategori analitik AI. Catatan lama dipertahankan dan diberi status `legacy_uncertain`; catatan baru memakai kategori fitur sebenarnya. Jangan menafsirkan angka lama sebagai pengukuran yang sepenuhnya akurat.

Endpoint `POST /api/init-db` dan `POST /api/db-patch/fix-notifications` hanya tersedia ketika `ENVIRONMENT=development` dan meminta sesi administrator. Keduanya tidak tersedia di produksi. Inisialisasi produksi dilakukan melalui migrasi, bukan lewat URL aplikasi.

Sistem saat ini hanya menerima tenant utama `kkg-gugus-3-wanayasa`. Akun dan header tenant lain ditolak sampai semua kueri data dibatasi berdasarkan organisasi. Jangan membuka tenant tambahan hanya dengan membuat baris pada tabel `tenants`.

## Struktur utama

- `src/index.tsx`: aplikasi Hono dan pendaftaran rute
- `src/routes/`: API tiap fitur
- `src/lib/`: autentikasi, AI, penyimpanan, dan generator dokumen
- `public/static/js/`: antarmuka pengguna
- `migrations/`: perubahan skema D1
- `tests/`: pengujian Vitest
- `DESIGN.md`: arah desain produk

Prompt dan format keluaran RPP serta Analisis CP merupakan perilaku produk yang perlu dijaga saat memperbaiki antarmuka.
