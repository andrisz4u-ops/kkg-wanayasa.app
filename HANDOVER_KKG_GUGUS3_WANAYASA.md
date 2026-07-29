# Dokumen Serah-Terima Proyek

## Identitas Proyek
- Nama: Portal Digital KKG Gugus 3 Wanayasa
- Tipe: Web App (Cloudflare Pages + D1)
- Status: Siap operasional (dengan catatan keamanan di bagian Risiko)

## Ringkasan Pekerjaan yang Sudah Selesai
- Perombakan total UI Admin menjadi dashboard operasional.
- Penambahan mode role `operator` (UI + backend + database).
- Hardening authorization endpoint `/api/admin/*` (admin-only vs operator-access).
- Implementasi approval queue user (approve/reject/bulk approve) dan metrik operasional.
- Migrasi database remote berhasil diterapkan sampai `0011_operator_role_support.sql`.
- Build dan test lulus (`npm run build`, `npm run test`).

## Matrix Hak Akses Role
- `admin`
  - Akses penuh dashboard admin.
  - Kelola user penuh (create/update/delete/reset password).
  - Akses pengaturan sistem dan audit logs.
- `operator`
  - Akses dashboard operasional admin.
  - Approval user (pending/approve/reject/bulk approve).
  - Kelola data sekolah.
  - Tidak bisa akses pengaturan sensitif, audit logs penuh, dan user management sensitif.
- `user`
  - Akses fitur pengguna umum sesuai modul aplikasi.

## Endpoint Kritis (Kebijakan Akses)
- Operator diizinkan:
  - `GET /api/admin/dashboard`
  - `GET /api/admin/users`
  - `GET /api/admin/users/pending`
  - `POST /api/admin/users/:id/approve`
  - `POST /api/admin/users/:id/reject`
  - `POST /api/admin/users/bulk-approve`
  - `GET /api/admin/users/approval-stats`
- Operator ditolak (`403`):
  - `GET|PUT /api/admin/settings`
  - `POST /api/admin/settings/logo`
  - `GET /api/admin/logs*`
  - `POST /api/admin/logs/cleanup`
  - `POST /api/admin/users`
  - `PUT|DELETE /api/admin/users/:id`
  - `POST /api/admin/users/:id/reset-password`

## Risiko dan Tindak Lanjut Wajib
- `SUPABASE_KEY` masih pernah tersimpan di konfigurasi; wajib:
  - rotate key lama,
  - pindahkan ke secret environment,
  - jangan simpan key sensitif di file repo.
- Token Cloudflare yang pernah dipakai saat setup wajib di-rotate/revoke.
- Endpoint maintenance/bootstrap harus dibatasi/ditutup di production:
  - `/api/db-patch/fix-notifications`
  - `/api/init-db`

## SOP Operasional Harian (Admin/Operator)
- Login menggunakan akun sesuai role.
- Cek dashboard: pending approval, aktivitas terbaru, SLA operasional.
- Proses approval user sebelum jam operasional berakhir.
- Perbarui data sekolah bila ada perubahan.
- Admin utama melakukan review logs dan pengaturan sistem berkala.

## Checklist Go-Live / Serah-Terima
- [x] Migrasi remote `0001` s.d. `0011` berhasil.
- [x] Verifikasi role operator berjalan.
- [x] Build dan test lulus.
- [ ] Rotate seluruh token/key sensitif.
- [ ] Tutup endpoint maintenance dari publik.
- [ ] Dokumentasikan akun PIC dan prosedur reset darurat.

## Kontak Internal dan PIC
- PIC Teknis: (isi nama)
- PIC Operasional Admin: (isi nama)
- PIC Operator Harian: (isi nama)

## Catatan Penutup
Sistem siap digunakan untuk operasional KKG Gugus 3 Wanayasa dengan model delegasi peran `admin` dan `operator`. Fokus pasca-serah-terima adalah hardening keamanan kredensial dan disiplin SOP harian.
