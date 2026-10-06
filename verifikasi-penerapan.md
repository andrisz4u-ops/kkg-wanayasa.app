# Verifikasi penerapan UI/UX

Tanggal: 3 Oktober 2026. Pemeriksaan dilakukan pada aplikasi lokal, setelah pengguna meminta aplikasi dijalankan dan hasil penerapan dianalisis ulang.

## Hasil

Aplikasi berjalan di http://127.0.0.1:5173/ dan endpoint kesehatan mengembalikan HTTP 200 dengan koneksi database sehat. Runtime Cloudflare dapat dijalankan di luar sandbox; hambatan Worker pada laporan sebelumnya sudah teratasi untuk sesi lokal ini.

Ada empat kekurangan yang ditemukan dan diperbaiki:

| Temuan | Dampak | Perbaikan dan bukti |
| --- | --- | --- |
| Markup konten admin dapat menutup wadah workspace saat dirangkai dalam satu string HTML | Navigasi bawah pindah ke samping; panel ponsel menyempit menjadi sekitar 121 px walaupun tidak ada overflow horizontal | Kerangka workspace dipasang terlebih dahulu, lalu konten dipasang dalam `#page-content-wrapper`. Pemeriksaan ulang menunjukkan navigasi bawah kembali menjadi anak `.wk-content`, dengan lebar konten sekitar 375 px pada viewport 390 px. Tes regresi memakai markup penutup berlebih. |
| Teks tombol Riwayat Saya pada CP disembunyikan di ponsel | Tombol hanya dikenali melalui ikon | Nama aksesibel mengambil teks lengkap tanpa ikon dan tetap tersedia ketika teks visual disembunyikan. |
| Kartu template Program Sekolah hanya mendengarkan klik | Tidak dapat dipilih dengan Enter/Space | Kartu memperoleh fokus keyboard, peran tombol dan status `aria-pressed`. Pemilihan template 7KAIH melalui Enter berhasil diperiksa di browser. |
| Checkbox baris admin memakai nama ID teknis | Sulit membedakan pengguna/sekolah saat memakai pembaca layar | Nama checkbox memakai konteks baris; pilihan massal dan filter periode memperoleh label bahasa Indonesia. Browser menunjukkan nama seperti “Pilih pengguna Siti Nurhaliza”. |

Perubahan dilakukan pada kerangka workspace dan peningkatan kontrol runtime. Sumber generator dan keluaran yang dipantau tidak diubah.

## Cakupan browser

| Area | Pemeriksaan yang dilakukan |
| --- | --- |
| Akun guru | Login demo, beranda, menu akun, profil, sidebar tetap tersedia pada halaman fitur |
| Perangkat ajar | RPP, Analisis CP, asesmen, slide, game; halaman terbuka dan label kontrol diperiksa |
| Komunitas | Materi, presensi, forum, direktori guru, kalender, pengumuman, dropdown dan halaman notifikasi |
| Kalender | Buka dialog tanpa menyimpan, fokus awal, latar menjadi inert, Escape menutup dan mengembalikan fokus |
| Akun admin | Login demo, Program Sekolah, surat, program kerja, LPJ, panel kontrol |
| Subpanel admin | Ringkasan, pengguna, sekolah, data CP, provider AI, log, template surat, organisasi; URL dan menu aktif ikut berpindah |
| Mode operator | Simulasi pada akun admin: menu konteks berkurang menjadi empat dan pindah ke ringkasan. Hak akses akun operator sendiri diperiksa lewat tes, bukan login browser |
| Ponsel 390 × 844 | RPP dan CP, perpindahan lewat drawer, panel admin beserta delapan subpanel; masalah struktur admin diperbaiki dan diperiksa ulang secara visual |
| Tablet 820 × 1180 | Ringkasan admin; tidak ditemukan overflow horizontal |
| Desktop 1754 px | Halaman guru dan administrasi yang disebut di atas |

Tidak adanya overflow saja tidak cukup untuk menyimpulkan tata letak benar: masalah admin ditemukan melalui screenshot dan pengukuran lebar wadah. Bukti DOM yang dicatat ada di `docs/design/verification-2026-10-03/dom-checks.json`; sebagian sampel awal mendahului perbaikan dan urutannya dipertahankan.

## Verifikasi teknis terakhir

- **152 tes lulus di 10 berkas**, termasuk empat tes baru untuk kekurangan di atas. Suite mencakup UI, navigasi, workspace guru, izin, arsip, RPP DOCX, Analisis CP, asesmen, Prota/Promes/KKTP.
- **117 berkas terlindungi sama dengan baseline** sebelum penyempurnaan UI, melalui `node scripts/verify-ui-boundaries.mjs`.
- Tes formulir membandingkan FormData, pilihan model, nilai bawaan, aturan validasi, kontrol asli dan event listener sebelum/sesudah peningkatan UI.
- **`npm run build` berhasil**, termasuk CSS dan bundle produksi Vite.
- **`git diff --check` berhasil**; Git hanya memberi pemberitahuan normalisasi LF/CRLF.

## Batas dan tindak lanjut

Generasi AI berbayar, upload PDF besar, penyimpanan data baru, serta unduhan baru DOCX/PPTX/XLSX di browser tidak dijalankan. Kesamaan sumber dan tes fixture melindungi kontrak keluaran, tetapi tidak membuktikan respons provider AI langsung atau setiap hasil dokumen nyata.

Pengujian pembaca layar secara penuh, seluruh kombinasi browser/perangkat, kondisi API gagal, serta dialog khusus setiap fitur masih belum menyeluruh. Editor keluaran surat/proker yang berada di batas dokumen tetap tidak disentuh oleh peningkatan label umum; aksesibilitas editor keluaran dapat ditinjau terpisah agar format hasil tetap aman.

Testimoni, janji keamanan, paket harga, dan klaim waktu pada landing publik tetap memerlukan bukti pemilik sebagaimana audit antislop. Pemeriksaan ini tidak memvalidasi klaim bisnis tersebut. Build juga memberi pemberitahuan Browserslist usang dan Vitest memberi deprecation `poolOptions`; keduanya tidak menggagalkan verifikasi.

Sesi browser dikembalikan ke akun guru dan ukuran layar semula. Server lokal tetap berjalan untuk peninjauan pengguna.

## Bukti visual

- `docs/design/verification-2026-10-03/guru-beranda.jpg`
- `docs/design/verification-2026-10-03/guru-rpp.jpg`
- `docs/design/verification-2026-10-03/guru-analisis-cp.jpg`
- `docs/design/verification-2026-10-03/guru-cp-mobile.jpg`
- `docs/design/verification-2026-10-03/guru-rpp-mobile.jpg`
- `docs/design/verification-2026-10-03/admin-program-sekolah.jpg`
- `docs/design/verification-2026-10-03/admin-panel.jpg`
- `docs/design/verification-2026-10-03/admin-users-mobile.jpg`
- `docs/design/verification-2026-10-03/admin-tablet.jpg`
