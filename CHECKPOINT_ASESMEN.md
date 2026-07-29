# Project Checkpoint: KKG Portal - Perbaikan Fondasi & Keamanan (22 Feb 2026)

Checkpoint ini mendokumentasikan serangkaian perbaikan krusial pada sistem administrasi sekolah, manajemen pengguna, dan keamanan aplikasi.

## 🚀 Status: Siap Deploy ✅

### 1. Perbaikan Autopopulate Identitas (RPP & Asesmen)
*   **Masalah**: Data Kepala Sekolah, NIP, dan Kop Surat sering kosong atau butuh reload berkali-kali.
*   **Solusi**: 
    - **Logic Auto-Repair**: Menambahkan logika di backend (`auth.ts`) yang secara otomatis mencari dan mengikat (`update`) data `sekolah_id` ke akun user berdasarkan nama sekolah saat user login atau reload halaman.
    - **Eager Loading**: Data detail sekolah (Kepala Sekolah, NIP KS, Kop Surat) kini dikirim langsung bersamaan dengan data user saat login. Fitur RPP/Asesmen kini langsung terisi secara instan tanpa reload.

### 2. Fitur Kop Surat Sekolah v2.0
*   **Masalah**: Upload ke Supabase lambat, sering error 500/timeout, dan file hilang.
*   **Solusi transisional & stabil**:
    - **Client-side Compression**: Gambar di-resize ke max 800px dan dikompres menjadi JPEG 70% di browser sebelum diupload. Mengurangi ukuran dari MB menjadi ~30-80 KB.
    - **Base64 Database Storage**: Gambar disimpan sebagai string base64 langsung di database D1. Menghilangkan ketergantungan pada Supabase/R2 dan memastikan gambar tidak pernah "pecah" atau hilang.
    - **Preview Real-time**: Menambahkan fungsi preview instan di modal edit sekolah.

### 3. Keamanan & Alur Pendaftaran (Anti-Spam)
*   **Approval Queue**: Pendaftaran publik kini tidak lagi otomatis aktif. User baru masuk ke antrean persetujuan (`is_approved = 0`).
*   **Login Protection**: User yang belum disetujui akan diblokir saat login dengan pesan: *"Silakan hubungi Sekretaris atau Ketua Gugus 3 Wanayasa"*.
*   **Rate Limiting Optimization**: Melonggarkan batas percobaan login menjadi **30 detik** (sebelumnya 15 menit) untuk kenyamanan user, namun tetap melindungi dari serangan brute-force.
*   **Fix Database Schema**: Memperbaiki nilai default `is_approved` di database untuk memastikan pendaftaran baru selalu dalam status "Pending".

### 4. Manajemen User & Sekolah (Admin Panel)
*   **Fix Edit User**: Menambahkan field **NIP** yang sebelumnya hilang pada form edit.
*   **Fix Dropdown Sekolah**: Memperbaiki bug HTML pada pilihan sekolah yang menyebabkan dropdown kosong saat pendaftaran atau edit data guru.
*   **Validasi Nama**: Menghapus regex yang terlalu ketat; sekarang nama guru bisa menggunakan gelar (S.Pd, dsb) dan angka.

---

## 🛠️ Langkah Sinkronisasi (Action Required)
1.  **GitHub Desktop**: Lakukan Commit & Push semua file yang berubah.
2.  **Database Migration**: Jalankan perintah berikut di production jika kolom belum ada:
    - `ALTER TABLE sekolah ADD COLUMN kop_surat_url TEXT;`
    - `ALTER TABLE sekolah ADD COLUMN nip_kepala_sekolah TEXT;`
    - `ALTER TABLE users ADD COLUMN sekolah_id INTEGER;`
3.  **Deploy**: Tunggu build Cloudflare Pages selesai.

**File Utama yang Dimodifikasi:**
- `public/static/js/pages/admin.js` (UI Admin & Kop Surat Logic)
- `public/static/js/pages/auth.js` (UI Auth & Messages)
- `src/routes/auth.ts` (Auto-Repair identities & Approval logic)
- `src/lib/ratelimit.ts` (Auth Window optimization)
- `src/lib/validation.ts` (Profile name & NIP Schema)

---
*Checkpoint dibuat pada 02:10 AM - Istirahat yang cukup, proyek dalam kondisi aman!* 🌙
