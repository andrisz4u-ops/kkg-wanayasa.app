# Penyimpanan dan pemulihan gambar asesmen

## Hasil yang diharapkan

Paket baru menyimpan gambar raster yang didukung sebagai aset milik aplikasi, bukan mengandalkan tautan sementara penyedia AI. Referensi gambar pada paket dibaca melalui izin paket. Paket privat hanya dapat dibaca pemilik; paket yang dibagikan tetap mengikuti persetujuan dan kebijakan Bank Soal.

Perubahan soal disimpan ke server menggunakan revisi. Status gagal atau konflik berarti perubahan belum dipastikan tersimpan; jangan menganggap arsip lokal sebagai bukti tersimpan lintas perangkat. Simpan salinan lokal sebelum mengganti dokumen atau memuat versi server.

## Soal lama dengan gambar hilang

1. Jangan menghapus arsip, berkas DOCX/PDF, atau gambar asli dari perangkat tempat soal dibuat.
2. Pemulihan otomatis hanya dapat menyalin sumber lama yang masih dapat diakses dan diizinkan. Tautan kedaluwarsa saja tidak cukup untuk mendapatkan kembali berkas aslinya.
3. Jika berkas gambar asli tersedia, unggah kembali pada soal yang sesuai, simpan perubahan, lalu periksa paket dari sesi browser baru.
4. Jika hanya DOCX/PDF yang masih memuat gambar, ambil gambar dari berkas tersebut dan cocokkan kembali dengan stimulus, pertanyaan, serta kunci jawabannya. Jangan mengganti stimulus tanpa meninjau kesesuaian soal.
5. Bila gambar asli tidak tersedia, tandai soal untuk ditinjau atau susun ulang stimulus secara sengaja. Aplikasi tidak melakukan regenerasi AI otomatis untuk menutup kegagalan gambar.

## Saat koneksi terputus selama generasi

Gunakan **Ambil hasil proses sebelumnya** bila tersedia. Tindakan ini menggunakan identitas proses yang sama dan mode baca-hasil saja. Proses yang belum sampai ke server, masih berjalan, atau berakhir tanpa hasil tidak akan dimulai ulang secara otomatis oleh tindakan pemulihan. Membuat asesmen baru adalah tindakan terpisah dan dapat menggunakan kuota AI baru.

Catatan percobaan tersimpan per pengguna pada sesi browser, bukan sebagai cadangan permanen lintas perangkat. Jangan menghapus penyimpanan browser sebelum hasil yang diperlukan disimpan atau diunduh.

## Sebelum mencetak atau mengunduh

Tunggu penyimpanan selesai, selesaikan konflik revisi, dan periksa semua gambar yang diperlukan. Ekspor harus ditolak bila gambar hilang, tidak dapat didekode, tidak aman, atau melebihi batas; jangan mencetak soal bergambar dengan stimulus kosong. Peringatan cetak bukan pengganti peninjauan guru.

## Batas operasional

- PNG, JPEG, dan WebP: maksimum 512 KiB per aset; maksimal 8 referensi raster dan 4 MiB per paket.
- Kuota aset: maksimum 100 aset dan 32 MiB per pemilik. Penyimpanan memakai D1 yang sudah ada dan tetap menggunakan jatah layanan tersebut.
- SVG harus memenuhi subset mandiri yang diizinkan; skrip, sumber eksternal, dan konten aktif tidak diterima.
- Migrasi `0041`, `0042`, dan `0043` merupakan prasyarat. Startup lokal memeriksa skema tetapi tidak menerapkan migrasi otomatis. Cadangkan database sebelum migrasi; jangan mereset atau melakukan seed ulang untuk memperbaiki gambar.
- Jika kolom/tabel migrasi sudah dibuat oleh inisialisasi runtime tetapi belum ada di ledger migrasi, jangan menjalankan DDL tertunda secara membabi buta. Periksa kesetaraan lengkap kolom, indeks, dan relasinya pada salinan cadangan terlebih dahulu; pencatatan ledger tanpa mengulang DDL hanya boleh dilakukan setelah kesetaraan terbukti. Pemeriksaan lokal menemukan kondisi ini untuk `0042`; jangan menganggap semua lingkungan memiliki kondisi yang sama.
- Perubahan kode lokal bukan bukti situs online sudah diperbarui. Deployment, migrasi produksi, pengaturan penyimpanan, serta verifikasi pada domain online harus ditangani terpisah dengan izin yang sesuai.
