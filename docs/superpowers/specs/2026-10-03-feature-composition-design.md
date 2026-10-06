# Rombak komposisi fitur RuangKKG

Pengguna menegaskan bahwa perubahan warna/header belum memenuhi permintaan dan meminta redesain menyeluruh diselesaikan. Arah yang sudah dipilih tetap hijau elegan dengan sidebar persisten. Antislop diperiksa setelah implementasi.

## Komposisi

RPP: identitas ringkas selebar ruang kerja, kurikulum utama di kiri, strategi di kanan, pilihan profil lulusan dan tindakan akhir sebagai penutup.

Asesmen: konteks kelas di atas, materi dan karakteristik dua kolom; jumlah soal mendapat kontrol yang jelas dan tindakan akhir tersendiri.

CP: identitas horizontal, sumber buku dan review BAB berdampingan. Tombol Buat Sekarang tetap di bawah kartu sumber; daftar BAB tetap ringkas.

Bank materi: filter vertikal di kiri dan koleksi dokumen di kanan. Forum: daftar percakapan dan panel penyusunan topik ketika dibuka. Direktori: kelompok jabatan menjadi penanda kiri dan daftar guru di kanan.

Agenda: kalender lapang dengan toolbar terpisah. Presensi: daftar kegiatan dengan tindakan dalam satu baris. Pengumuman: papan informasi dengan artikel yang nyaman dibaca. Game: katalog pilihan kelas, tanpa mengubah arena permainan.

Slide: ruang penulisan topik dan kumpulan contoh di samping; outline tetap bisa ditinjau. Program sekolah: katalog jenis program di kiri, parameter di kanan. Surat: pelaksanaan dan kelengkapan dua bagian. Proker: visi/misi berpasangan, daftar program menjadi bidang utama. Laporan: informasi kegiatan, model dan dokumentasi mendapat bidang berbeda. Profil: identitas ringkas dan formulir akun. Notifikasi: kotak masuk. Panel kontrol: navigasi bagian dan area kerja administrasi.

## Batas implementasi

Pindahkan elemen asli tanpa kloning, pertahankan ID, name, event, validasi dan nilai. Jangan menyentuh prompt, payload, provider, format ekspor maupun subtree keluaran. Marker komposisi hanya pada UI yang tidak mengandung keluaran. Jangan membuat statistik atau thumbnail dokumen rekaan. Media cetak tidak memakai CSS tambahan.

## Verifikasi

Perbandingan FormData, kontrol asli/event, idempotensi dan subtree keluaran. Tes kontrak generator/ekspor dan hash baseline. Pemeriksaan visual desktop, tablet dan ponsel pada setiap kelompok fitur. Generasi AI berbayar tidak diperlukan untuk memverifikasi susunan UI.
