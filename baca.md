# PANDUAN ARSITEKTUR & FONDASI SISTEM RUANG KKG DIGITAL
> **Dokumen Panduan Teknis & Fondasi Konfigurasi Sistem ("1 untuk Semua")**  
> Dibuat untuk memudahkan AI, pengembang, dan operator memahami seluruh arsitektur, basis data, integrasi multi-tenant, serta aturan bisnis proyek tanpa membuang banyak waktu penelusuran (*token & time efficient*).

---

## 1. Filosofi Inti: "1 untuk Semua" (Single Codebase Multi-Tenant Fleet)

Proyek ini dibangun di atas prinsip **Satu Basis Kode untuk Seluruh Gugus/Kecamatan** (*Single Codebase Multi-Tenant Fleet Architecture*).
- **Satu Sumber Kode (*Source of Truth*):** Seluruh perbaikan logika bisnis, antarmuka (UI/UX), mesin pembuat dokumen Word (`.docx`), integrasi kecerdasan buatan (AI), dan manajemen kurikulum hanya ditulis satu kali di repositori ini.
- **Isolasi Database & Tenant:** Setiap gugus atau kecamatan memiliki instalasi mandiri di Cloudflare Pages dengan database Cloudflare D1 dan R2 Bucket yang terpisah secara fisik. Perubahan data di satu gugus tidak akan mencemari gugus lainnya.
- **Otomatisasi Deployment Fleet:** Sekali kode diperbaiki di repositori ini, skrip fleet (`scripts/fleet-deploy.mjs`) akan membangun bundle sekali (`npm run build`) dan mendistribusikannya ke seluruh situs gugus secara otomatis.

---

## 2. Peta Topologi Cluster & Hubungan Antar Web KKG

Setiap gugus/kecamatan didaftarkan dalam file konfigurasi JSON di folder `installations/<slug>.json`:

| Cluster / Gugus | Domain / URL Utama | Pages Project Name | Database D1 Name | Karakteristik Khusus |
| :--- | :--- | :--- | :--- | :--- |
| **KKG Gugus 3 Wanayasa** | `https://ruangkkg.my.id` | `kkg-wanayasa` (Primary) | `kkg-wanayasa-db` | Gugus utama Wanayasa, sekretariat SDN 2 Nangerang, profil Purwakarta |
| **KKG Kiarapedes (Gugus 1)** | `https://genthara.com` / `kkg-kiarapedes.pages.dev` | `kkg-kiarapedes` | `kkg-kiarapedes-db` | Gugus Kiarapedes, sekretariat SDN 1 Pusakamulya |
| **KKG Gugus 2 Kiarapedes** | `kkg-gugus2krp.pages.dev` | `kkg-gugus-2-kiarapedes` | `kkg-gugus-2-kiarapedes-db` | Klaster pecahan Kiarapedes |
| **KKG Gugus 1 Wanayasa** | `kkg-gugus1wny.pages.dev` | `kkg-gugus-1-wanayasa` | `kkg-gugus-1-wanayasa-db` | Klaster Gugus 1 Wanayasa |
| **KKG Gugus 2 Wanayasa** | `kkg-gugus2wny.pages.dev` | `kkg-gugus-2-wanayasa` | `kkg-gugus-2-wanayasa-db` | Klaster Gugus 2 Wanayasa |

### Mekanisme Personalisasi Organisasi Per Cluster
Setiap cluster memiliki tabel `settings` yang memuat identitas dinamis:
- `nama_kkg`, `gugus`, `kecamatan`, `kabupaten`, `provinsi`
- `alamat_sekretariat`, `email_kkg`, `nama_ketua`
- `theme_color` (misal `emerald`, `indigo`, `burgundy`)
- `region_profile` (misal `purwakarta` untuk muatan lokal TdBA)
- Logo KKG & Favicon dinamis

---

## 3. Arsitektur Database (Cloudflare D1 & SQLite)

Sistem menggunakan **Cloudflare D1** (berbasis SQLite terdistribusi di edge) di production, dan **Miniflare SQLite** di pengembangan lokal.

### A. Lokasi Database Lokal vs Remote
- **Remote (Cloudflare Edge):** Dikelola via binding `c.env.DB`.
- **Lokal (Dev Server Vite):** Disimpan di `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`.

> [!IMPORTANT]
> **Peringatan Sinkronisasi Lokal vs Remote:**  
> Ketika menjalankan dev server lokal (`npm run dev`), sistem membaca database lokal di folder `.wrangler/`. Data guru, sekolah, dan kop surat yang diinput di situs *live production* **tidak otomatis berada di lokal**.  
> Untuk menyinkronkan data sekolah & kop surat dari remote ke lokal, jalankan:
> ```bash
> node scripts/sync-sekolah-to-local.js
> ```

### B. Tabel-Tabel Utama
1. `users`: Akun guru, admin, dan operator (`id`, `nama`, `email`, `password_hash`, `role`, `sekolah_id`, `is_approved`, `nip`).
2. `sekolah`: Master data sekolah anggota gugus (`id`, `nama`, `npsn`, `tipe`, `alamat`, `kepala_sekolah`, `nip_kepala_sekolah`, `jumlah_guru`, `kop_surat_url`).
3. `sessions`: Manajemen token & sesi autentikasi cookie.
4. `ai_providers`: Registry custom provider AI, model, API key terenkripsi, prioritas failover, dan batas token.
5. `ai_generation_logs`: Audit trail dan telemetri pemakaian AI untuk pemeringkatan sekolah.
6. `cp_master`: Master Capaian Pembelajaran Kurikulum Merdeka (BSKAP 046/2025 dan Mulok TdBA).
7. `settings`: Konfigurasi identitas organisasi dan parameter aplikasi per tenant.
8. `audit_logs`: Pencatatan aktivitas admin (hapus data, ubah role, reset sandi).

---

## 4. Manajemen Pengguna & Autentikasi

### A. Role & Hak Akses
- **`admin`**: Memiliki akses penuh ke panel kontrol (`/admin`), manajemen user, persetujuan guru baru, pengaturan AI provider, kurikulum master, dan penghapusan data.
- **`operator`**: Membantu administrasi operasional dan pelaporan tanpa akses destruktif ke provider AI / sistem inti.
- **`guru`**: Pengguna standar pendidik; dapat menggunakan semua modul kurikulum (Analisis CP, TP, ATP, Prota, Promes, RPP, Kisi-kisi/Asesmen, Bank Soal, Pembuat Slide, Game Edukasi).

### B. Alur Pendaftaran & Verifikasi
1. Guru mendaftar secara mandiri melalui form registrasi (`/login` tab Daftar).
2. Guru memilih nama sekolah dari daftar sekolah yang terdaftar di database cluster tersebut.
3. Sistem menjalankan fungsi `findMatchingSchool` di `src/lib/school-normalizer.ts` untuk mengaitkan akun dengan `sekolah_id` yang valid.
4. Akun baru berstatus `is_approved = 0` (menunggu persetujuan admin), kecuali cluster disetel otomatis menerima atau user dibuat langsung oleh admin.
5. Admin dapat menyetujui, menolak (`reject`), mengubah role, atau mereset password di panel Admin -> Pengguna.

---

## 5. Master Data Sekolah & Sistem Kop Surat

### A. Data Sekolah
Setiap sekolah di gugus memiliki atribut lengkap:
- `nama`: Nama resmi sekolah (misal: `SDN 2 Nangerang`).
- `npsn`: Nomor Pokok Sekolah Nasional (8 digit).
- `tipe`: `negeri` atau `swasta`.
- `alamat`: Alamat lengkap sekolah (digunakan di kop surat dan cover dokumen).
- `kepala_sekolah` & `nip_kepala_sekolah`: Penandatangan resmi dokumen administrasi guru.
- `is_sekretariat`: Menandai sekolah tempat sekretariat KKG berada.
- `kop_surat_url`: Gambar kop surat resmi sekolah.

### B. Penyimpanan & Optimasi Kop Surat
- Pengguna mengunggah gambar kop surat (PNG/JPG) di modal Edit Sekolah.
- Browser secara otomatis mengompresi gambar via HTML5 Canvas (resolusi lebar maksimum 800px, JPEG quality 0.70) menjadi string **Base64 Data URL** berukuran ringkas (~25 KB – 35 KB).
- String ini disimpan pada kolom `kop_surat_url` di tabel `sekolah`.
- Generator dokumen Word (`src/lib/docx/*.ts`) otomatis menyematkan gambar ini pada bagian *Header* dokumen Word resmi.

> [!CAUTION]
> **Aturan Wajib Rendering Frontend (`sekolah.js`):**  
> DILARANG menyuntikkan objek sekolah lengkap atau string Base64 langsung ke dalam atribut inline HTML, contoh yang salah:  
> `❌ <button onclick='editSekolah(${JSON.stringify(s)})'>`  
> Karakter petik tunggal pada nama (seperti `H.Ujang Ma'mun`) dan ukuran Base64 kop surat akan merusak DOM parsing browser.  
> **Gunakan pola aman dengan Map:**  
> `✔️ <button onclick="editSekolahById('${s.id}')">`

---

## 6. Provider AI & Mesin Failover Otomatis

Aplikasi mendukung berbagai penyedia kecerdasan buatan (*AI Providers*) yang dapat dikonfigurasi melalui Admin -> Provider AI:
1. **Google Gemini:** Gemini 2.0 Flash, Gemini 1.5 Flash/Pro.
2. **OpenAI / Compatible:** GPT-4o, GPT-4o-mini.
3. **Anthropic Claude:** Claude 3.5 Sonnet / Haiku.
4. **Groq:** LLaMA 3.3 70B Versatile (latensi ultra-rendah).
5. **OpenRouter:** Agregator multi-model.
6. **Ollama:** Provider lokal/on-premise.
7. **Vultr Serverless / Unsplash:** Pembuatan visual ilustrasi soal & slide presentasi.

### Logika Failover (Keandalan Tinggi)
- Provider memiliki kolom `priority` (angka terkecil = prioritas tertinggi) dan `is_active`.
- Mesin pemanggil AI (`src/services/ai.ts`) secara otomatis mencoba provider prioritas pertama.
- Jika terjadi *rate limit* (HTTP 429), saldo habis, atau timeout, sistem otomatis melakukan **fallback langsung ke provider aktif berikutnya** tanpa memutus pengalaman guru.
- Kunci API disimpan dalam bentuk terenkripsi menggunakan kunci enkripsi internal aplikasi (`ENCRYPTION_KEY`).

---

## 7. Peringkat Penggunaan AI per Sekolah (AI Leaderboard & Telemetry)

Setiap kali modul kecerdasan buatan digunakan oleh guru (RPP, Asesmen, Pembuat Slide, Analisis CP, Soal TTS/Crossword), sebuah rekaman audit dicatat di tabel `ai_generation_logs`:
- Kolom: `user_id`, `user_nama`, `sekolah`, `feature_type`, `mata_pelajaran`, `topik`, `duration_ms`, `created_at`.

### Endpoint Analitik Sekolah (`GET /api/admin/analytics/schools`)
Menghasilkan leaderboard dan statistik agregasi:
1. **Total Aktivitas Per Sekolah:** Jumlah kumulatif pembuatan dokumen AI per sekolah.
2. **Distribusi per Fitur:** Rincian RPP, Asesmen/Soal, dan Slide Presentasi.
3. **Guru Teraktif (*Top Teacher*):** Nama guru yang paling produktif memanfaatkan AI di masing-masing sekolah.
4. **Filter Waktu:** Dapat difilter berdasarkan bulan aktif atau sepanjang waktu (`all`).
5. Ditampilkan di Admin Dashboard untuk memantau adopsi digital sekolah anggota gugus.

---

## 8. Arsitektur Admin Mode (Modular SPA)

Panel admin (`/admin`) dibangun dengan arsitektur Single Page Application modular yang bersih di `public/static/js/pages/admin-modules/`:
- `dashboard.js`: Menampilkan metrik utama, grafik adopsi, dan leaderboard sekolah.
- `users.js`: Manajemen user, filter sekolah, status persetujuan, penetapan role.
- `sekolah.js`: Tabel sekolah, modal edit sekolah, kompresi kop surat, bulk selection.
- `cp.js`: Manajemen Capaian Pembelajaran, tambah/edit CP BSKAP 046/2025 & Mulok TdBA.
- `ai-providers.js`: Kelola endpoint, uji latensi API secara langsung, quick presets.
- `settings.js`: Konfigurasi profil organisasi gugus, sekretariat, dan tema visual.
- `logs.js`: Monitoring log aktivitas administratif dan jejak audit sensitif.
- `shared-state.js`: Manajemen modal global yang aksesibel dan undo action bar.

---

## 9. Mesin Kurikulum & Generator Dokumen Word (.docx)

### A. Capaian Pembelajaran & Mulok Khusus Purwakarta (TdBA)
- **BSKAP No. 046 Tahun 2025:** Menjadi acuan standar seluruh mapel nasional Fase A hingga Fase C (SD).
- **Tatanen di Bale Atikan (TdBA):** Mapel muatan lokal khusus Kabupaten Purwakarta berbasis pertanian alami dan pembentukan karakter ekologis.
- **Elemen Resmi TdBA (Panca Niti):**
  1. *Niti Harti* (Memahami)
  2. *Niti Surti* (Merasakan/Menghayati)
  3. *Niti Bukti* (Membuktikan/Praktik Nyata)
  4. *Niti Bakti* (Mengabdi/Membaktikan Diri)
  5. *Sajati* (Menjadi Karakter Sejati)
  *(Catatan: Jangan mencampuradukkan TdBA dengan elemen Koding KA).*

### B. Generator Dokumen Word (`src/lib/docx/`)
Menghasilkan 7 ragam dokumen kurikulum siap cetak:
1. Analisis Capaian Pembelajaran & TP
2. Alur Tujuan Pembelajaran (ATP Elemen)
3. Program Tahunan (Prota)
4. Program Semester (Promes)
5. Rincian Pekan Efektif (RPE)
6. Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
7. Modul Ajar / RPP Berdiferensiasi

> [!TIP]
> **Aturan Ceklis Dokumen Word:**  
> Untuk tabel interval KKTP, simbol ceklis (`✓` / Unicode `\u2713`) **wajib** menggunakan font `Segoe UI Symbol` berukuran 13pt tebal (*emerald color*), bukan `Times New Roman`, agar Microsoft Word desktop tidak menggantinya menjadi simbol aneh/karakter Arab.

---

## 10. Peta Struktur Direktori Proyek

```text
├── .installations/        # Konfigurasi wrangler hasil build fleet (CI/CD)
├── installations/         # Profil JSON tiap cluster gugus (Wanayasa, Kiarapedes, dll)
├── migrations/            # File SQL skema D1 (0001 s.d. 0044)
├── public/                # Aset statis & SPA Client
│   └── static/
│       ├── css/           # Styling kustom
│       └── js/
│           ├── pages/     # Halaman aplikasi (admin.js, analisis-cp.js, kisi.js, dll)
│           │   └── admin-modules/ # Modul panel kontrol admin
│           ├── api.js     # HTTP client wrapper & CSRF handler
│           └── state.js   # Client-side state store
├── scripts/               # Utilitas deployment, sync, dan audit
│   ├── fleet-deploy.mjs   # Skrip deployment seluruh cluster Pages
│   ├── sync-sekolah-to-local.js # Sinkronisasi master sekolah remote ke lokal
│   └── sync-curriculum.mjs# Sinkronisasi master CP antar database
├── src/                   # Backend Hono.js (Cloudflare Workers/Pages)
│   ├── lib/               # Helper (auth, docx, crypto, normalizer, ratelimit)
│   ├── routes/            # Endpoint REST API (admin, auth, analisis-cp, sekolah, rpp)
│   ├── services/          # Layanan eksternal (ai.ts, unsplash.ts, docx)
│   └── index.tsx          # Entrypoint server Hono & SSR router
├── tests/                 # Rangkaian automated unit & integration tests (Vitest)
├── wrangler.jsonc         # Konfigurasi Cloudflare Pages project utama
└── package.json           # Dependensi & skrip NPM
```

---

## 11. Panduan Cepat Menjalankan & Memelihara Proyek

### 1. Menjalankan Server Lokal (Development)
```bash
npm run dev
```
Aplikasi berjalan pada: `http://localhost:5173`

### 2. Menjalankan Seluruh Rangkaian Uji Otomatis
```bash
npm test
```
*(Seluruh 1365+ skenario pengujian wajib lulus sebelum perubahan di-deploy).*

### 3. Menyinkronkan Data Sekolah Remote ke Lokal
Jika data sekolah di lokal kosong setelah clone baru:
```bash
node scripts/sync-sekolah-to-local.js
```

### 4. Deploy Pembaruan ke Seluruh Gugus (Fleet Deployment)
```bash
node scripts/fleet-deploy.mjs
```
Skrip ini akan otomatis melakukan build produksi, menerapkan migrasi D1 ke semua database gugus (jika ditambah flag `--migrate`), dan mem-push rilis baru ke seluruh proyek Cloudflare Pages armada KKG.

