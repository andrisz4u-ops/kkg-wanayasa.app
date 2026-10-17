# Aksen Warna per Fitur (2026-10-07, disetujui user)

## Keputusan
Setiap halaman generator memakai aksen warnanya sendiri, diperluas dari
warna ikon sidebar yang sudah ada:
- Buat RPP: hijau forest (#176b4b)
- Buat Asesmen: amber (#92400e)
- Analisis CP: teal (#0f766e)
- Slide: ungu (#7e22ce)
- Game: nila (#4338ca)

## Yang diwarnai
1. Kepala halaman: label eyebrow + bilah aksen gradasi.
2. Tombol utama (CTA) tiap generator: gradasi warna fiturnya.
3. Bar indikator progres: gradasi warna fiturnya.
4. Badge/lencana: latar pastel + teks tinta fiturnya.
5. 8 tag Profil Lulusan: 8 pasangan warna lembut berbeda;
   status aktif memakai warna penuh + teks putih.
6. Pintasan Beranda: cip ikon berwarna per tujuan (8 tujuan).

## Batasan
- Satu warna dominan per halaman + hijau dasar tetap (R-29,
  pengecualian tercatat seperti warna sidebar sebelumnya).
- Semua 28 pasangan teks/latar dicek >= 4.5:1 di
  tests/feature-accents.test.ts.
- Khusus @media screen; cetak/unduhan/kanvas tidak tersentuh.
- Mode gelap: eyebrow memakai varian terang; CTA dan cip
  tetap kontras karena permukaannya buram.
- Tanpa perubahan markup selain atribut data-tool pada
  pintasan Beranda; tanpa perubahan payload/output.
