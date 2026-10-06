# Penempatan Profil Lulusan pada Buat RPP

## Tujuan

Pilihan delapan dimensi profil lulusan memakai ruang kosong di bawah dua kartu pendek, sehingga tombol Buat RPP tidak tertahan oleh tinggi kartu Strategi.

## Susunan yang disetujui

- Desktop (mulai 1280 px): Identitas dan Kurikulum berada di baris pertama, panel profil membentang di bawah keduanya, Strategi mengisi kolom ketiga sepanjang dua baris.
- Tablet (768 sampai 1279 px): Identitas dan Kurikulum berdampingan; Strategi dan panel profil mengikuti di bawahnya selebar dua kolom.
- Ponsel: tiga kartu dan panel profil bertumpuk sesuai urutan baca, dengan pilihan profil dalam dua kolom yang bisa membungkus teks.

## Batas perubahan

Panel profil menjadi anak form RPP untuk mengikuti grid yang sama. Delapan tombol tetap `type="button"`, tidak punya nama form, dan pilihan yang dikirim tetap berasal dari mekanisme `selectedDimensions` yang sudah ada. Field RPP, prompt, payload, keluaran, dan arsip tidak berubah. Gaya baru dibatasi pada media layar dan ruang kerja fitur.

## Alasan desain

- Grid tiga kolom memanfaatkan ruang vertikal di sebelah Strategi, bukan menambahkan panel penuh setelahnya.
- Hijau dan tipografi mengikuti `DESIGN.md`; pilihan profil dikelompokkan empat per baris di desktop dan dua per baris di ponsel agar mudah dipindai dan disentuh.
- Urutan DOM Identitas, Kurikulum, Strategi, lalu profil menjaga alur baca dan fokus keyboard pada ukuran tablet maupun ponsel.
