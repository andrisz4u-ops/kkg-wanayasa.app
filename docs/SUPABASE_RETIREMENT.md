# Pembersihan integrasi Supabase

## Audit produksi, 25 Oktober 2026

Database: `kkg-wanayasa-db`. Audit read-only selesai pada `2026-10-25T05:43:03.145Z`.
Seluruh 58 tabel yang memiliki kolom teks diperiksa, mencakup 333 kolom.
Pencarian substring `supabase` tidak mengembalikan isi data atau kredensial.

Hasil yang cocok:

| Tabel | Kolom | Baris cocok |
|---|---|---:|
| audit_logs | details | 11 |
| settings | key | 2 |

Tidak ditemukan kecocokan pada nilai pengaturan, URL materi, foto pengguna,
kop surat sekolah, identitas tenant, maupun kolom teks dokumen dan konten lainnya.
Tidak ada referensi berkas Supabase berbasis substring tersebut yang perlu
dimigrasikan dari database yang diperiksa. Audit logs dan dua nama pengaturan
historis dipertahankan; audit ini tidak mengubah data produksi.

## Perubahan aplikasi

- Upload, pembacaan, dan penghapusan berkas memakai R2.
- Fallback Supabase, dependency SDK, serta konfigurasi dan formulir lama dihapus.
- `/api/files/config` mendeteksi binding R2 dan didaftarkan sebelum rute wildcard.
- Label audit upload logo menggunakan `r2`.
- Login dan sesi tetap menggunakan D1.

Jalankan kembali audit tanpa menampilkan nilai dengan:

```bash
node scripts/audit-supabase-references.mjs --remote
```

Tanpa `--remote`, script memeriksa database lokal. Query hanya membaca data.
Jumlah kecocokan per kolom bukan jumlah unik berkas atau baris seluruh database.

## Batas audit dan penghentian layanan

Audit tidak memeriksa BLOB, isi bucket Supabase, arsip di browser, tautan dengan
custom domain tanpa kata `supabase`, atau pengguna layanan di luar aplikasi ini.
Project Supabase, bucket, secret Cloudflare, dan nilai konfigurasi lokal tidak
dihapus oleh perubahan kode ini. Tidak ada deployment otomatis.

Sebelum menutup project Supabase lama, inventarisasikan/arsipkan isi bucket dan
pastikan tidak ada pemakai eksternal atau tautan custom domain. Setelah rilis
R2-only dan smoke test produksi selesai, hapus variabel Supabase yang tersisa
dari environment Cloudflare serta `.dev.vars` secara privat. Simpan catatan audit
historis; pencabutan kredensial yang pernah terekspos tetap dilakukan di penyedia.

## Verifikasi perubahan

- `npm run typecheck`: lulus.
- Tes terarah `env-crypto-contract` dan `file-ownership`: 25 tes lulus.
- `npm run build`, `npm run check:build-budget`, `npm run check:secrets:full`:
  lulus.
- `npm run test:integration`: 1 tes lulus pada Miniflare D1 terisolasi. Tes ini
  memang dilewati pada `npm test` kecuali `KKG_RUN_D1_INTEGRATION=1` diaktifkan.
- `npm test`: 1.322 tes lulus, 1 dilewati, 1 gagal pada
  `tests/assessment-image-lifecycle.test.ts:107` (penanda kegagalan gambar wajib
  ketika generasi dinonaktifkan). Kegagalan direproduksi dengan menjalankan file
  tersebut tersendiri. Implementasi gambar asesmen tidak diubah dalam pekerjaan
  ini; belum dilakukan pembandingan terhadap checkout baseline.
- Hasil build belum di-deploy dan smoke test produksi belum dijalankan.
