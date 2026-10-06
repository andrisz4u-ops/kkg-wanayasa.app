# Kartu ringkas untuk tiga generator

## Arah yang disetujui

Form RPP, Asesmen, dan Analisis CP mengikuti tiga kartu sejajar pada desktop, dua kartu lalu kartu ketiga selebar baris pada tablet, dan satu kolom pada ponsel. Urutan membaca tetap sama di semua ukuran. Contoh yang diberikan pengguna menjadi acuan pengelompokan, sementara warna mengikuti hijau RuangKKG di `DESIGN.md` (ENERGY 3 / RHYTHM 3 / MOTION 1).

| Fitur | Kartu 1 | Kartu 2 | Kartu 3 | Tindakan utama |
| --- | --- | --- | --- | --- |
| RPP | Identitas | Kurikulum | Strategi | Di bawah deretan profil lulusan |
| Asesmen | Identitas | Kurikulum & Materi | Karakteristik | Di bawah ketiga kartu |
| Analisis CP | Identitas Dokumen | Sumber Buku Ajar | Review Struktur Bab | Di dalam kartu Review |

## Batas perubahan

Gunakan markup tiga kartu yang sudah ada. Lapisan `feature-forms.js` tidak lagi menutup identitas dan pilihan AI di balik disclosure; `feature-composition.js` tidak lagi merentangkan kartu pertama atau membungkus pratinjau CP. CSS pada `feature-composition.css` khusus ruang kerja di media layar menangani kisi responsif, bidang kartu, jarak, dan target sentuh. Data formulir, validasi, pendengar peristiwa, tombol asli, kanvas hasil, prompt AI, dan ekspor tidak berubah.

## Alasan keputusan

- **Tiga kartu:** tiap kelompok kerja bisa dipindai cepat tanpa membuka identitas tersembunyi.
- **Hijau hutan dan aksen hijau daun:** menjaga hubungan dengan identitas RuangKKG; aksen atas membedakan kartu yang memuat parameter inti atau tindakan utama.
- **Georgia hanya pada judul kartu:** selaras dengan suasana perangkat ajar, sementara kontrol tetap mudah dibaca dalam sans.
- **Jarak ringkas dan kartu datar:** menghemat tinggi formulir tanpa mengaburkan urutan bidang; ruang di bawah kartu mendahulukan tindakan utama.
- **Susunan khusus ponsel:** kolom identitas, pilihan mata pelajaran, dan target semester yang panjang diberi lebar penuh agar nilai pilihan tidak terpotong. Tombol angka tetap memiliki target 44 piksel.
- **Tanpa animasi baru atau aset baru:** fitur adalah ruang kerja formulir; gerak dan ilustrasi tidak membantu pengisian.

## Pemeriksaan penerimaan

Ketiga kartu harus tetap ada dan tersusun 3/2/1 pada lebar yang sesuai; tidak boleh ada gulir mendatar. Identitas, pilihan model AI, dan ringkasan CP tetap terlihat. Tombol CP tetap dalam kartu Review, dan pemasangan ulang penyempurnaan visual tidak menggandakan elemen. Nilai, opsi, syarat input, dan fungsi kontrol dipertahankan. Build, pengujian form, dan pemeriksaan browser pada mode terang/gelap menjadi bukti verifikasi.
