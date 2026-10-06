# Studio Kelas Hidup

Disetujui pengguna pada 5 Oktober 2026 setelah peninjauan fitur Slide.

## Hasil yang dituju

Guru SD menyusun presentasi yang terbaca dari proyektor, mempunyai satu gagasan per slide, contoh konkret, aktivitas dan pemeriksaan pemahaman. Empat keluarga desain mempunyai komposisi dan tipografi sendiri: Kelas Ceria, Jelajah IPAS, Matematika Visual dan Cerita & Budaya. Galeri menggunakan contoh slide yang benar-benar dirender.

## Kontrak

- Brief kelas 1 sampai 6, mata pelajaran, topik, tujuan, jumlah slide, format layar dan instruksi tambahan dikirim ke AI.
- Pilihan model yang terlihat selalu menjadi pilihan yang dikirim. Tanpa pilihan eksplisit, backend mengikuti prioritas provider aktif, bukan memaksa Gemini.
- Normalisasi menerima arsip lama tetapi tidak membuat angka, jawaban atau materi pengganti yang tampak nyata.
- Pemeriksaan struktur menolak output kosong, kuis tanpa jawaban sah, diagram pecahan tidak valid, teks berlebih dan jumlah slide yang tidak sesuai. Catatan guru terpisah dari tampilan siswa.
- Satu scene berkoordinat dipakai oleh pratinjau, presenter, PPTX dan HTML. Teks dan bentuk PPTX dapat diedit; jawaban kuis masuk catatan guru. Ekspor tidak mengubah data slide.
- Edit isi melalui panel berlabel, pengurutan, perubahan layout, catatan dan revisi AI tetap tersedia. Draf lokal disimpan per akun dengan status penyimpanan yang benar, dan arsip lama dapat dibuka.
- Pembatalan, identitas pekerjaan dan peninjauan hasil mengikuti monitor AI yang sudah diuji pada tahap B+C.

## Alasan desain

Warna template membedakan pendekatan materi; komposisi, bukan label premium, menunjukkan perbedaannya. Font sistem yang tersedia pada komputer sekolah menjaga ekspor dapat dipakai. Kanvas 16:9 atau 4:3 memakai skala tetap dan safe area; browser mengecilkan keseluruhan kanvas, bukan mengecilkan font satu per satu. Diagram deterministik mendukung isi yang diberikan, tanpa bergantung pada foto eksternal. Jawaban dibuka atas tindakan guru agar siswa mempunyai waktu berpikir.

Ruang kerja mengikuti Organic Studio ENERGY 3 / RHYTHM 3 / MOTION 2. Slide siswa memakai motion 1 dengan pengungkapan yang dipicu guru dan dukungan reduced motion. Persetujuan ini mencakup perubahan output, prompt dan ekspor Slide; kontrak fitur lain tetap berlaku.

## Verifikasi

Uji normalisasi/quality gate, provider yang dikirim, arsip lama, pemisahan jawaban dan catatan, safe geometry, ekspor tanpa mutasi, round-trip draf dan endpoint dengan provider mock. Periksa deck Matematika, IPAS dan Bahasa Indonesia pada desktop/ponsel, kedua tema, keyboard, presenter, PPTX dan HTML offline. Pemeriksaan otomatis bukan jaminan kebenaran materi; guru tetap meninjau isi sebelum mengajar.
