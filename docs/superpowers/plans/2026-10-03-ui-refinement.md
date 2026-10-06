# Penerapan audit UI/UX RuangKKG

Persetujuan: pengguna meminta “Terapkan” setelah menerima analisis-ui-ux.md.

Arah: ruang kerja dokumen hijau, navigasi atas dan sidebar tetap. Komponen tenang, header fitur ringkas, pengaturan sekunder dapat dibuka. Gunakan stack Hono/Vite/JavaScript yang ada.

1. Simpan baseline hash sumber generator, renderer, ekspor, arsip, dan backend sebelum perubahan.
2. Jadikan kerangka admin sebagai navigasi konteks di dalam workspace bersama, dengan daftar subpanel dan pembatasan operator yang tetap.
3. Tambahkan label eksplisit dan nama kontrol pada UI, serta bantuan validasi yang membuka bagian tertutup tanpa mengubah aturan validasi.
4. Kelompokkan identitas/pengaturan AI RPP, asesmen dan CP. Detail materi bab dapat dibuka tanpa menghapus atau mengganti kontrol. FormData dan event listener tetap.
5. Satukan warna, tipografi UI, ukuran sentuh, header fitur, tabel, daftar, dialog dan keadaan kosong. Gaya baru hanya berlaku pada layar dan elemen UI yang berada di luar permukaan hasil.
6. Perbaiki fokus, Escape dan pemulihan fokus dialog kalender. Rapikan feedback loading tanpa mengarang kemajuan.
7. Verifikasi tes kontrak output/FormData, navigasi per peran, dialog, build, serta browser guru/admin dan ukuran ponsel/tablet.
8. Jalankan antislop AFTER dan dokumentasikan bukti serta batas pemeriksaan.

Pengembangan tambahan seperti pin menu, autosave baru, pencarian lintas arsip, dan retry request baru tidak termasuk pekerjaan tampilan ini. Klaim publik yang belum terverifikasi dikurangi tanpa membuat testimoni baru. Pengujian AI baru tidak diperlukan untuk membuktikan batas sumber yang tidak berubah; ekspor runtime tetap dicatat bila tidak dilakukan.

## Status akhir

- Berhasil: `npm run build` dengan konfigurasi standar, termasuk CSS dan Vite, serta pemeriksaan whitespace.
- Berhasil: 117 sumber yang dilindungi tetap sama dengan baseline. Templat landing publik (`src/templates/layout.ts`) dikecualikan dari hash karena merupakan presentasi UI; generator, renderer, eksportir, arsip, API, dan server tetap dipantau.
- Berhasil: 152 tes di 10 berkas setelah revisi terakhir, termasuk empat tes regresi temuan browser.
- Berhasil pada cakupan tercatat: Worker lokal berjalan di luar sandbox, kesehatan database HTTP 200; akun guru/admin, halaman fitur, delapan subpanel admin, ponsel dan tablet diperiksa. Empat kekurangan diperbaiki: struktur workspace admin, nama tombol CP pada ponsel, keyboard kartu template, dan label checkbox admin.
- Laporan lengkap, batas pemeriksaan dan screenshot dicatat di `verifikasi-penerapan.md`. Generasi AI berbayar dan unduhan keluaran baru di browser belum dilakukan.
- Audit AFTER dan temuan yang masih memerlukan bukti pemilik dicatat di `anti-slop/audit-012-2026-10-03.md`.
