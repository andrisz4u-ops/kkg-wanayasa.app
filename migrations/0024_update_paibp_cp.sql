-- Migration 0024: Update Capaian Pembelajaran PAIBP SD berdasarkan Salinan Kepka BKPDM No. 020 Tahun 2026
-- (Perubahan atas Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025)
-- Khusus memperbarui mata pelajaran Pendidikan Agama dan Budi Pekerti (PAIBP) untuk Fase A, B, dan C

-- 1. Fase A: Pendidikan Agama dan Budi Pekerti
INSERT INTO capaian_pembelajaran (mata_pelajaran, fase, teks_cp, elemen_json, regulasi)
VALUES (
  'Pendidikan Agama dan Budi Pekerti',
  'Fase A',
  '[Al-Qur’an Hadis]: Membaca dan membedakan huruf hijaiah berharakat, huruf hijaiah bersambung; menghafal Surah al-Fātiḥah, beberapa surah pendek Al-Qur’an, dan hadis tentang kebersihan. [Akidah]: Menjelaskan dan meyakini rukun iman, iman kepada Allah Swt., beberapa asmaulhusna, dan iman kepada malaikat. [Akhlak]: Menerapkan akhlak terhadap Allah Swt. dengan menyucikan dan memuji-Nya, dan akhlak terhadap diri sendiri. [Fikih]: Menerapkan rukun Islam, syahadatain, tata cara bersuci, salat fardu, zikir dan berdoa setelah salat. [Sejarah Peradaban Islam]: Menceritakan kisah keteladanan beberapa nabi dan rasul.',
  '{"Al-Qur’an Hadis":"Membaca dan membedakan huruf hijaiah berharakat, huruf hijaiah bersambung; menghafal Surah al-Fātiḥah, beberapa surah pendek Al-Qur’an, dan hadis tentang kebersihan.","Akidah":"Menjelaskan dan meyakini rukun iman, iman kepada Allah Swt., beberapa asmaulhusna, dan iman kepada malaikat.","Akhlak":"Menerapkan akhlak terhadap Allah Swt. dengan menyucikan dan memuji-Nya, dan akhlak terhadap diri sendiri.","Fikih":"Menerapkan rukun Islam, syahadatain, tata cara bersuci, salat fardu, zikir dan berdoa setelah salat.","Sejarah Peradaban Islam":"Menceritakan kisah keteladanan beberapa nabi dan rasul."}',
  'Kepka BKPDM No. 020 Tahun 2026'
)
ON CONFLICT(mata_pelajaran, fase) DO UPDATE SET
  teks_cp = excluded.teks_cp,
  elemen_json = excluded.elemen_json,
  regulasi = excluded.regulasi,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Fase B: Pendidikan Agama dan Budi Pekerti
INSERT INTO capaian_pembelajaran (mata_pelajaran, fase, teks_cp, elemen_json, regulasi)
VALUES (
  'Pendidikan Agama dan Budi Pekerti',
  'Fase B',
  '[Al-Qur’an Hadis]: Membaca, menulis, dan membedakan huruf hijaiah bersambung; menghafal dan menjelaskan beberapa surah pendek, hadis tentang kewajiban salat dan menjaga hubungan baik dengan sesama. [Akidah]: Menjelaskan dan meyakini sifat-sifat Allah Swt., iman kepada kitab-kitab Allah Swt., beberapa asmaulhusna, dan iman kepada rasul-rasul Allah Swt. [Akhlak]: Menerapkan akhlak terhadap Allah Swt. dengan berbaik sangka kepada-Nya, akhlak terhadap orang tua, keluarga, dan guru. [Fikih]: Menerapkan azan dan ikamah, salat jumat dan salat sunah; menjelaskan balig dan tanggung jawab yang menyertainya (taklīf). [Sejarah Peradaban Islam]: Menceritakan dan menjelaskan kisah Nabi Muhammad saw. sebelum dan sesudah menjadi rasul periode Makkah.',
  '{"Al-Qur’an Hadis":"Membaca, menulis, dan membedakan huruf hijaiah bersambung; menghafal dan menjelaskan beberapa surah pendek, hadis tentang kewajiban salat dan menjaga hubungan baik dengan sesama.","Akidah":"Menjelaskan dan meyakini sifat-sifat Allah Swt., iman kepada kitab-kitab Allah Swt., beberapa asmaulhusna, dan iman kepada rasul-rasul Allah Swt.","Akhlak":"Menerapkan akhlak terhadap Allah Swt. dengan berbaik sangka kepada-Nya, akhlak terhadap orang tua, keluarga, dan guru.","Fikih":"Menerapkan azan dan ikamah, salat jumat dan salat sunah; menjelaskan balig dan tanggung jawab yang menyertainya (taklīf).","Sejarah Peradaban Islam":"Menceritakan dan menjelaskan kisah Nabi Muhammad saw. sebelum dan sesudah menjadi rasul periode Makkah."}',
  'Kepka BKPDM No. 020 Tahun 2026'
)
ON CONFLICT(mata_pelajaran, fase) DO UPDATE SET
  teks_cp = excluded.teks_cp,
  elemen_json = excluded.elemen_json,
  regulasi = excluded.regulasi,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Fase C: Pendidikan Agama dan Budi Pekerti
INSERT INTO capaian_pembelajaran (mata_pelajaran, fase, teks_cp, elemen_json, regulasi)
VALUES (
  'Pendidikan Agama dan Budi Pekerti',
  'Fase C',
  '[Al-Qur’an Hadis]: Membaca, menulis, dan membedakan huruf hijaiah bersambung; menjelaskan beberapa surah pendek dan hadis tentang berbuat baik kepada orang tua, guru, dan teman. [Akidah]: Menjelaskan dan meyakini beberapa asmaulhusna, iman kepada hari akhir, iman kepada qadā’ dan qadar. [Akhlak]: Menerapkan akhlak terhadap Allah Swt. dengan berdoa dan bertawakal kepada-Nya, akhlak terhadap teman, tetangga, non-muslim, hewan, dan tumbuhan. [Fikih]: Menerapkan puasa wajib dan sunah, makanan minuman yang halal dan haram, zakat, infak, sedekah, dan wakaf. [Sejarah Peradaban Islam]: Menceritakan dan menjelaskan kisah Nabi Muhammad saw. periode Madinah dan khulafaurasyidin.',
  '{"Al-Qur’an Hadis":"Membaca, menulis, dan membedakan huruf hijaiah bersambung; menjelaskan beberapa surah pendek dan hadis tentang berbuat baik kepada orang tua, guru, dan teman.","Akidah":"Menjelaskan dan meyakini beberapa asmaulhusna, iman kepada hari akhir, iman kepada qadā’ dan qadar.","Akhlak":"Menerapkan akhlak terhadap Allah Swt. dengan berdoa dan bertawakal kepada-Nya, akhlak terhadap teman, tetangga, non-muslim, hewan, dan tumbuhan.","Fikih":"Menerapkan puasa wajib dan sunah, makanan minuman yang halal dan haram, zakat, infak, sedekah, dan wakaf.","Sejarah Peradaban Islam":"Menceritakan dan menjelaskan kisah Nabi Muhammad saw. periode Madinah dan khulafaurasyidin."}',
  'Kepka BKPDM No. 020 Tahun 2026'
)
ON CONFLICT(mata_pelajaran, fase) DO UPDATE SET
  teks_cp = excluded.teks_cp,
  elemen_json = excluded.elemen_json,
  regulasi = excluded.regulasi,
  updated_at = CURRENT_TIMESTAMP;

-- Alias: Pendidikan Agama Islam dan Budi Pekerti
INSERT INTO capaian_pembelajaran (mata_pelajaran, fase, teks_cp, elemen_json, regulasi)
SELECT 'Pendidikan Agama Islam dan Budi Pekerti', fase, teks_cp, elemen_json, regulasi
FROM capaian_pembelajaran
WHERE mata_pelajaran = 'Pendidikan Agama dan Budi Pekerti'
ON CONFLICT(mata_pelajaran, fase) DO UPDATE SET
  teks_cp = excluded.teks_cp,
  elemen_json = excluded.elemen_json,
  regulasi = excluded.regulasi,
  updated_at = CURRENT_TIMESTAMP;
