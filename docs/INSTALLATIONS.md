# Memasang RuangKKG untuk gugus lain

## Model operasional

Satu repository digunakan untuk beberapa **instalasi terpisah**. Masing-masing
gugus memiliki project Pages, database D1, bucket R2, domain, admin, dan secret
sendiri. Resource tersebut boleh berada dalam akun Cloudflare yang sama.

`settings` adalah sumber utama profil organisasi. API profil publik, metadata
organisasi, admin, halaman awal, dan dokumen membaca profil ini. Tabel `tenants`
lama hanya menyediakan fallback untuk kompatibilitas database Wanayasa.
Tidak ada cache profil global yang dibagikan antar-database.

ID internal `kkg-gugus-3-wanayasa` sengaja dipertahankan sebagai namespace skema
dan sesi di setiap database terpisah. ID ini **bukan nama organisasi** dan bukan
ID deployment. Identitas instalasi baru adalah `installation_slug`. Jangan
mengganti konstanta ID, mengedit migrasi lama, menambah organisasi pada database
Wanayasa, atau membuka header tenant lain untuk memasang gugus baru.

## 1. Siapkan profil dan resource

Salin `installations/gugus.example.json` menjadi profil gugus, misalnya
`installations/gugus-4.json`. Contoh berisi ID database dummy; ganti dengan ID D1
yang sebenarnya. File profil tidak boleh berisi password, token Cloudflare,
API key AI, atau key enkripsi. Profile sekolah berisi data publik saja.

Buat resource baru melalui dashboard/CLI Cloudflare:

```bash
npx wrangler d1 create kkg-gugus-4-db
npx wrangler r2 bucket create kkg-gugus-4-storage
npx wrangler pages project create kkg-gugus-4
```

Isi nama project, nama/ID D1, bucket, alamat web, profil pengurus, dan daftar sekolah
pada JSON. Pilih tepat satu sekolah sebagai sekretariat. Nama/NPSN duplikat
ditolak. Alat setup menolak nama resource dan ID database produksi Wanayasa.

```bash
npm ci
npm run installation -- --profile installations/gugus-4.json --action check
npm run installation -- --profile installations/gugus-4.json --action config
```

Konfigurasi hasil berada di `.installations/<slug>/wrangler.json` (diabaikan Git).
Binding aplikasi tetap bernama `DB`, `STORAGE`, dan `AI`; target resource berubah
sesuai profil. Path migrasi dan output build diselesaikan relatif ke konfigurasi
yang dihasilkan, sehingga tidak memakai migrasi/output folder gugus lain.

## 2. Migrasi dan bootstrap database baru

Gunakan database baru yang belum dihubungkan ke website publik. Perintah tanpa
`--remote` menargetkan lokal. Untuk database Cloudflare:

```bash
npm run installation -- --profile installations/gugus-4.json --action migrate --remote
```

Jangan jalankan `db:seed` atau impor backup Wanayasa. Migrasi historis memang
menanam sembilan sekolah Wanayasa; bootstrap menggantinya dengan daftar dari
profil **hanya pada database baru**. Admin demo tidak dibuat.

Password admin diterima lewat environment, tidak melalui JSON atau argumen CLI.
Contoh PowerShell (isi secara privat, jangan simpan nilai sebenarnya ke repository):

```powershell
$secret = Read-Host 'Password admin baru (minimal 12 karakter)' -AsSecureString
$env:KKG_INITIAL_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
try {
  npm run installation -- --profile installations/gugus-4.json --action bootstrap --remote
} finally {
  Remove-Item Env:KKG_INITIAL_ADMIN_PASSWORD
}
```

Bootstrap memeriksa database kosong, memvalidasi sekolah bawaan, memasang profil,
mengisi sekolah, dan membuat satu admin dengan hash PBKDF2 yang sama dengan
aplikasi. SQL sementara berisi hash, bukan password asli, dan dibersihkan setelah
proses selesai. Guard SQL menolak pengulangan pada database yang sudah terisi.
Tidak ada mekanisme rebranding/overwrite instalasi aktif pada alat ini.

Jika bootstrap terputus setelah sebagian statement diterapkan, jangan menghapus
guard atau memaksa pengulangan. Periksa hasil dan pulihkan database baru dari
titik sebelum bootstrap atau buat ulang resource kosong. Jangan memakai prosedur
ini untuk database yang sudah mempunyai pengguna. Bootstrap bukan klaim transaksi
lintas-statement/file Wrangler yang atomik.

## 3. Secret dan deployment

Simpan key di **project Pages baru**. Contoh:

```bash
npx wrangler pages secret put ENCRYPTION_KEY --project-name kkg-gugus-4
```

Gunakan material acak 32 byte atau lebih. Atur provider AI melalui panel admin,
serta secret opsional seperti Sentry sesuai kebutuhan. Email reset password
memerlukan provider, API key dan `email_from` yang sah milik instalasi tersebut;
aplikasi tidak memakai alamat pengirim Wanayasa sebagai fallback.

```bash
npm run installation -- --profile installations/gugus-4.json --action deploy --remote
```

Perintah deploy memeriksa `installation_slug` pada D1 target, menjalankan build
lengkap, lalu menerbitkan ke project dari profil dengan konfigurasi eksplisit.
Jangan memakai `npm run deploy:prod` untuk gugus baru: perintah tersebut tetap
ditujukan ke Wanayasa demi kompatibilitas operasional yang ada.

Untuk pembaruan gugus baru: backup, review migrasi, jalankan `migrate` lalu `deploy`
dengan profil yang sama. Jalankan pengujian dan staging sesuai OPERATIONS_RUNBOOK.
Jangan menghubungkan project baru ke build GitHub otomatis yang masih memakai
`wrangler.jsonc` Wanayasa; gunakan alur CLI berprofil ini, atau pipeline CI yang
secara eksplisit memilih konfigurasi `.installations/<slug>/wrangler.json`.

## 4. Pengaturan setelah pemasangan

- Admin dapat mengganti nama organisasi, nama aplikasi, alamat web, nomor gugus,
  pengurus, logo, alamat sekretariat dan tema melalui profil yang sudah ada.
- Sekolah dikelola dari database/panel sekolah. Dropdown pendaftaran tidak lagi
  menyisipkan sembilan sekolah Wanayasa ketika API kosong atau gagal.
- Logo lokal yang diunggah ke R2 dapat dibaca langsung untuk kop surat dokumen
  PNG/JPEG. Instalasi baru tidak memakai logo KKG/Pemda Wanayasa bawaan. Logo
  eksternal tidak otomatis diunduh oleh generator dokumen; gunakan upload lokal.
- Profil disisipkan secara escaped ke HTML awal; nama dan domain PWA mengikuti
  `/api/settings/manifest`. Ikon PWA tetap ikon produk netral yang dibundel.
- Dokumen yang sudah tersimpan adalah riwayat; mengganti profil tidak otomatis
  mengganti isi dokumen lama.
- Template undangan baru memakai token `{{nama_kkg}}` yang dibaca dari profil
  terbaru saat pratinjau/pemakaian. Template kustom lama yang menulis nama gugus
  langsung di isi surat tetap perlu diedit oleh pengelola.

### Data belum lengkap dan kegagalan profil

- Header serta stempel sertifikat cetak membaca nama gugus, nomor gugus,
  kecamatan dan kabupaten dari profil instalasi, termasuk setelah navigasi SPA.
- Pratinjau kalender menandai identitas sekolah/pengesah yang belum diisi. Tidak
  ada penggantian otomatis dengan sekolah, NPSN, kepala sekolah atau NIP contoh.
  Isi tanda — secara eksplisit untuk data yang memang tidak berlaku.
- Ekspor kalender memerlukan nama sekolah yang dipilih. Data pengesah berasal
  dari payload/sekolah tersebut; kepala sekolah akun login hanya dipakai bila
  nama sekolahnya cocok, bukan untuk mengisi sekolah lain.
- Halaman beranda JavaScript, footer, kontak kebijakan dan template header
  provider AI mengikuti profil/domain instalasi. Kontak kosong ditampilkan sebagai
  belum dikonfigurasi, bukan diarahkan ke email layanan lain.
- Tanpa tabel profil, fallback hanya identitas netral `KKG`. Profil Wanayasa
  yang benar-benar tersimpan dalam database lama tetap dipakai. Gangguan query
  database diteruskan sebagai error layanan; tidak dianggap sebagai profil kosong.

## 5. Batas wilayah

`region_profile: "purwakarta"` hanya untuk Kabupaten Purwakarta. Template lokal
TdBA, AKPK, program sekolah dan kalender Purwakarta masih dipertahankan.

Untuk kabupaten lain pilih `"custom"`. Website umum, komunitas, surat, RPP dan
asesmen tetap dapat digunakan dengan identitas gugusnya. **Program Sekolah dan
ekspor Prota/Promes/RPE dibatasi** karena generator tersebut masih menanam kalender
dan regulasi Purwakarta. Respons API menjelaskan keterbatasan ini, bukan diam-diam
mencetak aturan daerah yang salah. Materi muatan lokal pada katalog juga tetap
berlabel Purwakarta; jangan memilihnya sebagai kurikulum daerah lain.

Pembuatan profil kalender, regulasi dan muatan lokal daerah lain memerlukan data
resmi serta pengembangan lanjutan; memilih `custom` bukan konversi otomatis semua
konten daerah. Jangan mengaktifkan profil Purwakarta hanya untuk melewati batas.

## 6. Pemeriksaan dua instalasi

Tes `tests/installation-profile.test.ts` memakai dua database terpisah untuk
memastikan nama tidak bocor antar-instalasi, profil admin/tenant konsisten,
bootstrap tidak menimpa database aktif, password kompatibel dengan login,
metadata HTML/PWA sesuai, dan dokumen tidak membawa nama Wanayasa.
Tes `tests/organization-output.test.ts` memeriksa renderer sertifikat cetak,
stempel, beranda SPA, halaman kebijakan/footer dan kalender dengan profil
Pasawahan serta Sukasari, termasuk saat identitas atau kontak belum lengkap.

Sebelum go-live, lakukan smoke test pada staging: login admin, pendaftaran dan
approval guru, daftar sekolah, unggah/baca berkas dari bucket yang tepat, surat,
sertifikat, reset password jika email diaktifkan, backup dan restore. Tes lokal
bukan bukti bahwa binding Cloudflare atau email produksi sudah dipasang benar.
