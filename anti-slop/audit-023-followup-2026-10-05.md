# Tindak lanjut audit 023: tahap A, kemudian B+C

Tanggal: 5 Oktober 2026.

Persetujuan: “Ya lakukan perbaikan A dulu lalu B dan C sebagai satu paket”. Tahap A diselesaikan dan diuji sebelum implementasi B+C.

Status: **selesai untuk cakupan A dan B+C**. Catatan awal dan nomor temuannya berada di [audit 023](audit-023-2026-10-05.md). Roadmap lanjutan D tetap dicatat dalam audit awal.

## 1. Tahap A: akses, data, dependensi, dan penomoran

| Temuan | Perbaikan | Bukti |
|---|---|---|
| 1. Akses AI Slide/TTS | Middleware sesi dijalankan sebelum handler generasi. Telemetri memakai pengguna yang terautentikasi. | Kelima endpoint anonim menghasilkan 401; pengguna terautentikasi mencapai validasi input. |
| 2. Kontak guru dan data presensi | Detail guru anonim memakai proyeksi publik. Endpoint yang memuat identitas peserta dan rekap presensi memerlukan sesi. | Kontak anonim tidak berisi email/NIP/telepon; kontak anggota tetap tersedia. Tiga jalur pembacaan presensi anonim menghasilkan 401. |
| 3. Rekap periode | Pembilang dan penyebut memakai kumpulan kegiatan yang sama. JSON dan CSV memakai query bersama, dengan validasi tanggal dan pengutipan CSV. | Contoh September + Oktober, filter hanya Oktober: 1 hadir / 1 kegiatan = 100%, bukan 200%. Guru tanpa kehadiran tetap muncul. |
| 4. Dependensi produksi | Paket terdampak diperbarui dalam rentang kompatibel; pin `ws` Mistral memakai override terbatas. | `npm audit --omit=dev`: **0 vulnerabilities**. Angka ini khusus dependensi produksi. |
| 5. CORS | Pencocokan origin tepat untuk same-origin dan konfigurasi `CORS_ORIGINS`; pengecualian pengembangan dibatasi loopback-ke-loopback. | Origin dengan nama domain menyesatkan, path, `null`, atau localhost terhadap produksi ditolak. |
| 16. Nomor surat | Counter atomik dan registry reservasi; pasangan SPT/SPPD dialokasikan dalam transaksi. Penyimpanan surat dan penandaan nomor terbit dilakukan bersama. | 12 reservasi bersamaan menghasilkan nomor berbeda. Konflik manual mengembalikan kegagalan, reservasi pasangan di-rollback, nomor terbit tidak digunakan ulang setelah dokumen dihapus. |

Migrasi `0028_atomic_surat_numbering.sql` telah diterapkan pada D1 **lokal**. Backfill mempertahankan arsip historis, termasuk duplikasi lama, dan melindungi nomor berikutnya melalui registry.

## 2. Paket B: proses streaming yang lebih andal

| Temuan | Perbaikan | Bukti |
|---|---|---|
| 7. Pembatalan | Signal klien diteruskan ke transport, lifecycle SSE Hono, dan permintaan provider. Mode Program per BAB juga memakai SSE yang bisa dibatalkan. | Klik Batalkan mengubah signal menjadi aborted dan memanggil pembatalan reader. Tes server membuktikan abort mencapai provider dan ledger menjadi cancelled. |
| 8. Proses ganda dan tahap keenam | Guard tombol/client, job ID, ledger satu pekerjaan streaming aktif per akun, dan tahap monitor dinamis. | Klik Asesmen dua kali hanya menghasilkan satu POST; tahap keenam benar-benar aktif. Permintaan ledger yang bertabrakan menghasilkan 409. |
| 9. Callback lama | Monitor memiliki lifecycle sendiri dan menyimpan draf sampai ditinjau/dibuang. Callback review tidak bergantung pada ID modal global. | Penyelesaian monitor lama tidak menghapus monitor berikutnya. Review kembali ke halaman asal; kegagalan render mempertahankan draf untuk dicoba lagi. |
| 10. Metrik dan klaim | Tampilan memakai tahap yang selesai, waktu berjalan, dan jumlah karakter catatan. Persentase buatan serta klaim validasi BSKAP generik dihapus dari monitor. | Tahap 2 RPP menunjukkan 1 tahap selesai; hasil parsial tidak ditandai semua tahap selesai. Jumlah karakter tidak berubah menurut ukuran potongan stream. |
| 12. Protokol dan pengulangan | Parser menangani CRLF, field tanpa spasi, komentar, multiline, UTF-8 terpotong, dan EOF. Fallback provider mengirim reset catatan. | Tes parser dan provider fallback lulus. Klien tidak otomatis mengirim POST generasi baru ketika stream gagal. |
| 12. Hasil tersimpan saat koneksi terputus | Cache hasil job terikat pengguna, berlaku 24 jam; GET pemulihan hanya dilakukan untuk kehilangan penyelesaian yang relevan. | Uji browser kehilangan `done`: satu POST generasi dan satu GET hasil, tanpa POST kedua. Pengguna lain mendapat 404. Error server dan pembatalan tidak memicu pengulangan generasi. |
| 14. Hasil parsial | Asesmen dan Program menyampaikan bagian yang belum selesai. LPJ menandai bagian hilang dan menolak jawaban seluruhnya kosong. Peringatan arsip mengikuti keberhasilan penyimpanan. | Program: BAB I tersedia, BAB II dibatalkan; draf tetap bisa ditinjau dengan daftar BAB yang belum tersedia. |
| 14. Kejujuran saat review/ekspor | Notice parsial bertahan di halaman hasil; judul dan tombol unduh Program menjadi “Draf Program Parsial” dan “Unduh Draf Parsial”. | Notice berada di luar canvas. Tes membuktikan HTML canvas tidak berubah dan label kembali normal untuk hasil lengkap. |

`0029_ai_generation_jobs.sql` telah diterapkan pada D1 **lokal**. Ledger memakai lease/heartbeat, hash input kanonik, hasil terikat pengguna, dan pemeriksaan kepemilikan lease sebelum menyatakan selesai. Lease yang hilang tidak dapat menerbitkan keberhasilan palsu. Mode Program per BAB menggunakan job anak yang stabil untuk setiap bagian.

Guard akun juga membersihkan monitor ketika akun berubah; callback review tidak menampilkan draf milik akun sebelumnya. Input dan kontrak output dokumen tetap diperiksa melalui tes regresi yang sudah ada.

## 3. Paket C: monitor yang sesuai untuk guru

- Header hijau dan judul jelas mengikuti identitas RuangKKG; panel terang/gelap memakai token monitor sendiri.
- Tahap berbahasa kegiatan guru, bukan judul terminal. JSON mentah hanya muncul ketika **Detail teknis** dibuka.
- **Sembunyikan** mempertahankan proses dan menyediakan tombol status untuk membukanya kembali. **Batalkan** menghentikan permintaan.
- **Tinjau hasil** membuka halaman asal sebelum merender draf. Hasil belum ditinjau tidak tergantikan oleh generasi baru.
- Hasil parsial memiliki label dan peringatan berbeda. Kegagalan menampilkan hasil tetap menyimpan draf dalam lifecycle monitor.
- Monitor dan drawer arsip memakai helper dialog: focus trap, background inert, Escape, dan pemulihan fokus.
- Observer dekorasi UI mengecualikan monitor/teks streaming; penulisan kelas yang identik dihindari.

### Alasan keputusan visual

| Keputusan | Alasan |
|---|---|
| Hijau hutan, panel putih/dark green | Menjaga identitas produk sekaligus kontras konten kerja. |
| Judul Georgia, isi sans-serif | Menyambungkan suara visual ruang kerja dan memudahkan pembacaan status. |
| Daftar tahap dinamis | Menunjukkan pekerjaan sebenarnya, termasuk enam tahap Asesmen. |
| Detail teknis tertutup | Guru melihat kemajuan tugas terlebih dahulu; diagnostik tetap tersedia saat dibutuhkan. |
| Review eksplisit dan notice parsial | Pengguna memutuskan kapan membaca hasil dan mengetahui bagian yang belum selesai. |
| Tidak ada typewriter/pulse berulang | Status tetap tenang; token tidak memicu dekorasi ulang seluruh halaman. |
| Namespace dan penanda UI milik monitor | Mencegah tema generik merusak kontras serta melindungi batas canvas dokumen. |

Arah keseluruhan mengikuti `DESIGN.md`, ENERGY 3 / RHYTHM 3 / MOTION 2. Monitor menggunakan perubahan status dan interaksi ringan, dengan penghormatan terhadap reduced motion.

## 4. Verifikasi

### Pemeriksaan otomatis

- **Tahap A:** 630 tes pada 40 berkas lulus, lalu build, audit produksi, dan migrasi lokal; baru setelah itu B+C dikerjakan.
- **Final A+B+C:** `npm test -- --reporter=dot`, **657 tes / 45 berkas lulus**.
- `npm run build`: lulus, Tailwind dan Vite selesai.
- `npm audit --omit=dev`: **0 vulnerabilities** pada pemeriksaan akhir.
- `git diff --check`: lulus; hanya pemberitahuan LF/CRLF lingkungan yang sudah ada.
- Daftar migrasi D1 lokal: **No migrations to apply**.

Regresi baru meliputi akses, privasi, CSV periode, reservasi nomor, parser SSE, CSRF ulang dengan job ID yang sama, abort, replay hasil, lease hilang, pergantian akun, review lintas halaman, bab Program, hasil parsial, dan batas canvas. Tes lama untuk dokumen, kualitas, SVG, ekspor, dan formulir juga tetap lulus.

### Click-through dan tampilan browser

Pengujian memakai akun contoh di memori dan stream sintetis dalam browser terisolasi. Permintaan tulis ke server/provider diblokir. Satu arsip RPP contoh dibuat hanya dalam profil browser pengujian. Ini menguji UI dan lifecycle, bukan penilaian pedagogis jawaban model produksi.

| Interaksi | Hasil |
|---|---|
| RPP desktop 1440 px, tema terang | Monitor baru tampil; detail teknis tertutup; nol overflow dan nol error aplikasi. |
| RPP ponsel 390 px, tema gelap | Dialog, tombol, dan tahap tetap terbaca; nol overflow. |
| Monitor enam tahap pada tablet 820 px | Panel berada pada x=30..790; enam tahap tersedia; nol overflow. |
| Sembunyikan, pindah halaman, buka kembali | Signal tetap aktif; tombol status tersambung kembali pada halaman baru. |
| Batalkan RPP | Signal aborted, reader dibatalkan satu kali, tidak ada generasi pengganti. |
| Asesmen: dua klik submit | Satu POST, tombol busy, tahap keenam aktif. |
| Asesmen parsial | “Selesai sebagian”, tombol “Tinjau draf parsial”, warning bagian hilang. |
| Tab, Shift+Tab, Escape | Fokus tetap dalam dialog; Escape menyembunyikan tanpa membatalkan; background kembali aktif. |
| RPP selesai, pindah ke Asesmen, review | Kembali ke RPP, canvas hasil muncul, monitor miliknya ditutup. |
| EOF sebelum `done`, hasil ada di cache | Satu GET pemulihan, satu POST total, hasil siap ditinjau. |
| Program per BAB: BAB I selesai, BAB II dibatalkan | Permintaan kedua aborted; BAB I tetap tersedia; notice, judul, dan tombol unduh jelas parsial. |
| Drawer Riwayat RPP | Role dialog, fokus masuk, background inert; Escape menutup dan fokus kembali ke Riwayat RPP. |

Pemindaian axe-core pada monitor desktop terang, ponsel gelap, dan tablet enam tahap: **0 confirmed violations, 0 incomplete, 23 passes**. Monitor parsial Asesmen: **0 violations, 0 incomplete, 24 passes**. Notice parsial final: **0 violations, 0 incomplete, 7 passes**.

Pengukuran lokal terisolasi `getComputedStyle`: **0 panggilan selama 1 detik idle**, dan **0 panggilan untuk 100 chunk streaming** pada eksperimen yang dicatat. Baseline audit awal adalah 3.131/4.836 panggilan pada eksperimen sebelumnya. Ini merupakan bukti pemindaian dekorasi berulang dihilangkan dalam skenario tersebut, bukan benchmark FPS atau janji kecepatan produksi.

## 5. Bukti dan penerapan

- [Monitor RPP desktop](evidence/audit-023-followup/rpp-stream-desktop.png)
- [Monitor RPP ponsel gelap](evidence/audit-023-followup/rpp-stream-mobile-dark.png)
- [Program parsial saat ditinjau](evidence/audit-023-followup/program-partial-review.png)
- [Spesifikasi job dan monitor](../docs/superpowers/specs/2026-10-05-ai-job-monitor-design.md)

Kode baru menggunakan tabel dari migrasi 0028 dan 0029. Keduanya sudah diterapkan lokal. Pada deployment berikutnya, migrasi tersebut perlu diterapkan pada database target sebelum menjalankan backend baru. Penerapan database remote dan deployment produksi tidak dilakukan dalam sesi ini.

## 6. Delivery Gate antislop

### Hard Gate: PASS

- R-02/R-17/R-18/R-23/R-36/R-38 PASS: copy baru tidak memakai em dash; metrik tahap/karakter adalah data proses, tanpa klaim token, testimoni, atau aset baru yang direkayasa.
- R-03/R-25/R-34 PASS: viewport 390/820/1440, terang/gelap, tidak overflow; pemindaian monitor final nol pelanggaran kontras; target kontrol monitor minimum 44 px.
- R-24/R-26/R-27 PASS: tombol Hide/Cancel/Review/Discard berfungsi; running, failed, cancelled, completed, dan partial memiliki tampilan serta tindakan nyata.
- R-32 PASS: trap Tab, Escape, inert, dan fokus kembali diverifikasi untuk monitor dan arsip.
- R-33/R-35 PASS: perubahan ditulis pada sumber dengan apply_patch; build, 657 tes, dan click-through di atas dicatat.
- R-37 PASS: arah hijau RuangKKG dan spesifikasi yang disetujui digunakan.

### Purpose-Gate: PASS

R-01/R-06/R-12/R-14/R-19/R-31: alasan warna, tipografi, kedalaman panel, struktur tahap, dan gerakan tercatat pada tabel keputusan. Fokus berada pada status tugas dan tindakan review; tidak ada terminal/glow/animasi berulang sebagai dekorasi default.

### Liveliness: PASS

Identitas hijau hutan dan judul Georgia tetap jelas. Ritme header, ringkasan, tahap, detail opsional, dan footer berbeda menurut kebutuhan konten. Satu aksen utama mengarahkan perhatian pada status dan review, dengan ruang yang berfungsi sebagai pemisah.

### Craftsmanship dan Quality Locks: PASS

C-1..C-5 dan R-05/R-11/R-15/R-16/R-20/R-21/R-29/R-30/R-31: keputusan memiliki alasan, tindakan berfungsi, informasi parsial jujur, dua tema diuji, dan batas formulir/canvas dijaga. Bukti tidak mengklaim validasi model produksi yang tidak dilakukan.
