// Database Struktur BAB Standar Buku Teks Resmi Kurikulum Merdeka (Kemendikbudristek)
// Mencakup seluruh Mata Pelajaran dan seluruh Jenjang Kelas (1-6 SD)

export interface CurriculumChapter {
  no: number;
  bab: string;
  materi_pokok: string[];
  semester: 1 | 2;
}

export interface CurriculumPreset {
  judul: string;
  chapters: CurriculumChapter[];
}

export const standardCurriculumDatabase: Record<string, Record<string, CurriculumPreset>> = {
  'bahasa indonesia': {
    '1': {
      judul: 'Buku Siswa Bahasa Indonesia: Aku Bisa! Kelas I (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Bunyi Apa?', materi_pokok: ['Mengenal aneka bunyi', 'Pengenalan huruf B dan b', 'Suku kata awal'], semester: 1 },
        { no: 2, bab: 'Bab 2: Ayo Bermain!', materi_pokok: ['Gerakan tubuh saat bermain', 'Pengenalan huruf C dan c', 'Kata tanya apa dan siapa'], semester: 1 },
        { no: 3, bab: 'Bab 3: Awas Kuman!', materi_pokok: ['Menjaga kebersihan diri', 'Pengenalan huruf K dan k', 'Mencuci tangan yang benar'], semester: 1 },
        { no: 4, bab: 'Bab 4: Aku Bisa!', materi_pokok: ['Menirukan gerak hewan', 'Pengenalan huruf L dan l', 'Kalimat sederhana'], semester: 1 },
        { no: 5, bab: 'Bab 5: Teman Baru', materi_pokok: ['Berkenalan dengan teman', 'Pengenalan huruf M dan m', 'Sikap santun'], semester: 2 },
        { no: 6, bab: 'Bab 6: Berbeda Itu Tak Apa', materi_pokok: ['Menghargai perbedaan fisik', 'Pengenalan huruf G dan g', 'Keberagaman'], semester: 2 },
        { no: 7, bab: 'Bab 7: Aku Ingin', materi_pokok: ['Membedakan kebutuhan dan keinginan', 'Pengenalan huruf P dan p', 'Menyusun kata'], semester: 2 },
        { no: 8, bab: 'Bab 8: Di Sekitar Rumah', materi_pokok: ['Mengenali ruangan dan alamat rumah', 'Pengenalan huruf D dan d', 'Denah sederhana'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Siswa Bahasa Indonesia: Keluargaku Unik Kelas II (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Mengenal Perasaan', materi_pokok: ['Mengenali berbagai emosi', 'Teks puisi sederhana', 'Menyampaikan ungkapan perasaan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Menjaga Kesehatan', materi_pokok: ['Makanan sehat dan bergizi', 'Kalimat tanya', 'Kebiasaan hidup bersih'], semester: 1 },
        { no: 3, bab: 'Bab 3: Berhati-hati di Mana Saja', materi_pokok: ['Keselamatan di jalan dan rumah', 'Tanda seru dan larangan', 'Kata depan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Keluargaku Unik', materi_pokok: ['Silsilah keluarga', 'Kata sifat', 'Menulis cerita keluarga'], semester: 1 },
        { no: 5, bab: 'Bab 5: Berteman dalam Keragaman', materi_pokok: ['Sikap toleransi', 'Fabel dan cerita binatang', 'Menirukan intonasi tokoh'], semester: 2 },
        { no: 6, bab: 'Bab 6: Bijak Memakai Uang', materi_pokok: ['Literasi menabung', 'Teks prosedur sederhana', 'Nilai kebutuhan vs keinginan'], semester: 2 },
        { no: 7, bab: 'Bab 7: Sayang Lingkungan', materi_pokok: ['Sampah dan kebersihan', 'Sebab akibat sederhana', 'Memilah sampah'], semester: 2 },
        { no: 8, bab: 'Bab 8: Hobi yang Jadi Prestasi', materi_pokok: ['Menceritakan hobi', 'Kosa kata aktivitas', 'Teks narasi inspirasi'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Siswa Bahasa Indonesia: Kawan Seiring Kelas III (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Ayo, Main!', materi_pokok: ['Permainan tradisional', 'Kalimat ajakan dan larangan', 'Kosakata gerak'], semester: 1 },
        { no: 2, bab: 'Bab 2: Kawan Seiring', materi_pokok: ['Kerja sama dan persahabatan', 'Kalimat majemuk setara', 'Teks narasi sederhana'], semester: 1 },
        { no: 3, bab: 'Bab 3: Pengobar Semangat', materi_pokok: ['Teks biografi inspiratif', 'Ide pokok paragraf', 'Kosakata profesi'], semester: 1 },
        { no: 4, bab: 'Bab 4: Senyum di Sekitarku', materi_pokok: ['Denah dan mata angin', 'Teks deskripsi tempat', 'Menulis paragraf runtut'], semester: 1 },
        { no: 5, bab: 'Bab 5: Bola-Bola Cokelat', materi_pokok: ['Teks prosedur membuat makanan', 'Kosakata resep', 'Langkah-langkah kegiatan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Tersesat!', materi_pokok: ['Rambu petunjuk dan keselamatan', 'Cerita pengalaman pribadi', 'Kalimat tanya'], semester: 2 },
        { no: 7, bab: 'Bab 7: Aku dan Si Merah', materi_pokok: ['Mengamati alam sekitar', 'Puisi anak', 'Kata sifat dan perbandingan'], semester: 2 },
        { no: 8, bab: 'Bab 8: Sahabat dari Seberang', materi_pokok: ['Surat pribadi dan pesan singkat', 'Etika berkomunikasi', 'Teks cerita persahabatan'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa Bahasa Indonesia: Lihat Sekitar Kelas IV (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Sudah Besar', materi_pokok: ['Kalimat transitif & intransitif', 'Penggunaan KBBI', 'Teks Narasi'], semester: 1 },
        { no: 2, bab: 'Bab 2: Di Bawah Atap', materi_pokok: ['Kata homonim', 'Kalimat majemuk setara', 'Paragraf deskripsi'], semester: 1 },
        { no: 3, bab: 'Bab 3: Lihat Sekitar', materi_pokok: ['Rambu lalu lintas', 'Paragraf argumentasi', 'Menulis rute denah'], semester: 1 },
        { no: 4, bab: 'Bab 4: Meliuk dan Menerjang', materi_pokok: ['Ide pokok & ide pendukung', 'Wawancara sederhana', 'Kata bermakna ganda'], semester: 1 },
        { no: 5, bab: 'Bab 5: Bertukar atau Membayar', materi_pokok: ['Sejarah uang', 'Teks prosedur', 'Literasi menabung'], semester: 2 },
        { no: 6, bab: 'Bab 6: Satu Titik di Peta', materi_pokok: ['Keindahan alam nusantara', 'Puisi anak', 'Majas personifikasi'], semester: 2 },
        { no: 7, bab: 'Bab 7: Asal Usul', materi_pokok: ['Asal-usul nenek moyang', 'Kata penghubung (konjungsi)', 'Teks narasi sejarah'], semester: 2 },
        { no: 8, bab: 'Bab 8: Sehatlah Ragaku', materi_pokok: ['Teks informasi kesehatan', 'Fakta dan opini', 'Menulis paragraf rangkuman'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa Bahasa Indonesia: Bergerak Bersama Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Aku yang Unik', materi_pokok: ['Kata sifat', 'Sinonim dan Antonim', 'Makna awalan pe-', 'Kalimat majemuk setara', 'Teks Deskripsi'], semester: 1 },
        { no: 2, bab: 'Bab 2: Buku Jendela Dunia', materi_pokok: ['Bagian-bagian buku', 'Majas metafora & personifikasi', 'Kalimat langsung & tidak langsung', 'Teks Narasi'], semester: 1 },
        { no: 3, bab: 'Bab 3: Ekspresi Diri Melalui Hobi', materi_pokok: ['Surat pribadi', 'Menulis teks prosedur', 'Awalan me-', 'Kosakata hobi'], semester: 1 },
        { no: 4, bab: 'Bab 4: Belajar Berwirausaha', materi_pokok: ['Wawancara & laporan hasil wawancara', 'Kosakata keuangan', 'Ide berwirausaha', 'Idiom'], semester: 1 },
        { no: 5, bab: 'Bab 5: Menjadi Warga Dunia', materi_pokok: ['Singkatan dan akronim', 'Fakta dan opini', 'Surel / surat elektronik', 'Teks Eksplanasi'], semester: 2 },
        { no: 6, bab: 'Bab 6: Cinta Indonesia', materi_pokok: ['Huruf kapital & angka bilangan', 'Membaca brosur wisata', 'Teks Pengumuman', 'Menulis puisi'], semester: 2 },
        { no: 7, bab: 'Bab 7: Sayangi Bumi', materi_pokok: ['Kalimat perintah dan larangan', 'Membuat ringkasan', 'Teks Eksposisi', 'Poster lingkungan'], semester: 2 },
        { no: 8, bab: 'Bab 8: Bergerak Bersama', materi_pokok: ['Naskah pidato', 'Naskah drama sederhana', 'Teks Persuasi', 'Proyek akhir literasi'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa Bahasa Indonesia: Anak Indonesia Hebat Kelas VI (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Bangga Menjadi Anak Indonesia', materi_pokok: ['Surat resmi & dinas', 'Formulir pendaftaran', 'Teks formulir'], semester: 1 },
        { no: 2, bab: 'Bab 2: Musisi Indonesia di Pentas Dunia', materi_pokok: ['Wawancara mendalam', 'Kalimat efektif', 'Teks biografi'], semester: 1 },
        { no: 3, bab: 'Bab 3: Taman Nasional dan Situs Warisan Dunia', materi_pokok: ['Laporan hasil pengamatan', 'Grafik & infografik', 'Teks Eksplanasi'], semester: 1 },
        { no: 4, bab: 'Bab 4: Jeda untuk Iklim', materi_pokok: ['Teks argumentasi isu global', 'Debat & diskusi terarah', 'Kosakata iklim'], semester: 1 },
        { no: 5, bab: 'Bab 5: Anak-Anak yang Mengubah Dunia', materi_pokok: ['Pidato persuasif', 'Gagasan utama', 'Teks eksposisi'], semester: 2 },
        { no: 6, bab: 'Bab 6: Liburan Perpisahan Kelas Akhir', materi_pokok: ['Proposal kegiatan kelas', 'Surat undangan', 'Rincian anggaran'], semester: 2 },
        { no: 7, bab: 'Bab 7: Aku Bisa Berempati', materi_pokok: ['Cerita pendek (Cerpen)', 'Sudut pandang tokoh', 'Amanat cerita'], semester: 2 },
        { no: 8, bab: 'Bab 8: Aman Berinternet', materi_pokok: ['Literasi digital & privasi', 'Etika berkomunikasi daring', 'Esai singkat'], semester: 2 }
      ]
    }
  },
  'ipas': {
    '3': {
      judul: 'Buku Siswa Ilmu Pengetahuan Alam dan Sosial (IPAS) Kelas III (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Mari Kenali Hewan di Sekitar Kita', materi_pokok: ['Bentuk tubuh hewan', 'Fungsi anggota tubuh hewan', 'Hewan darat dan air'], semester: 1 },
        { no: 2, bab: 'Bab 2: Ayo, Mengenal Siklus pada Makhluk Hidup', materi_pokok: ['Metamorfosis serangga dan amfibi', 'Siklus hidup hewan peliharaan', 'Pertumbuhan makhluk hidup'], semester: 1 },
        { no: 3, bab: 'Bab 3: Hidup Bersama Alam', materi_pokok: ['Komponen biotik dan abiotik', 'Hubungan saling membutuhkan', 'Menjaga keseimbangan alam'], semester: 1 },
        { no: 4, bab: 'Bab 4: Berkenalan dengan Energi', materi_pokok: ['Sumber energi di sekitar kita', 'Bentuk-bentuk energi', 'Pemanfaatan energi sehari-hari'], semester: 1 },
        { no: 5, bab: 'Bab 5: Denah Rumah dan Lingkungan Sekitar', materi_pokok: ['Membaca simbol denah', 'Arah mata angin', 'Tata letak lingkungan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Tradisi Keluarga dan Masyarakat', materi_pokok: ['Norma dan adat kebiasaan', 'Perayaan tradisi lokal', 'Kearifan budaya'], semester: 2 },
        { no: 7, bab: 'Bab 7: Cerita dari Kampung Halaman', materi_pokok: ['Asal usul nama daerah', 'Tokoh kebanggaan daerah', 'Perubahan lingkungan dari masa ke masa'], semester: 2 },
        { no: 8, bab: 'Bab 8: Bentuk Negaraku Indonesia', materi_pokok: ['Pulau-pulau di Indonesia', 'Wilayah daratan dan perairan', 'Keberagaman suku nusantara'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa Ilmu Pengetahuan Alam dan Sosial (IPAS) Kelas IV (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Tumbuhan, Sumber Kehidupan di Bumi', materi_pokok: ['Bagian Tubuh Tumbuhan', 'Fotosintesis', 'Perkembangbiakan Tumbuhan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Wujud Zat dan Perubahannya', materi_pokok: ['Zat Padat, Cair, Gas', 'Perubahan Wujud Zat', 'Massa dan Volume'], semester: 1 },
        { no: 3, bab: 'Bab 3: Gaya di Sekitar Kita', materi_pokok: ['Gaya Otot & Gaya Gesek', 'Gaya Magnet & Gravitasi', 'Benda Bergerak & Diam'], semester: 1 },
        { no: 4, bab: 'Bab 4: Mengubah Bentuk Energi', materi_pokok: ['Bentuk-bentuk Energi', 'Perubahan Bentuk Energi', 'Energi Terbarukan'], semester: 1 },
        { no: 5, bab: 'Bab 5: Cerita Tentang Daerahku', materi_pokok: ['Sejarah Daerah Tempat Tinggal', 'Tokoh Daerah', 'Peninggalan Sejarah'], semester: 2 },
        { no: 6, bab: 'Bab 6: Indonesiaku Kaya Budaya', materi_pokok: ['Keragaman Suku & Budaya', 'Kearifan Lokal', 'Menghargai Perbedaan'], semester: 2 },
        { no: 7, bab: 'Bab 7: Bagaimana Mendapatkan Semua Keperluan Kita?', materi_pokok: ['Kebutuhan vs Keinginan', 'Jual Beli & Pasar', 'Nilai Uang'], semester: 2 },
        { no: 8, bab: 'Bab 8: Membangun Masyarakat yang Beradab', materi_pokok: ['Norma dan Adat Istiadat', 'Peraturan Tertulis & Tidak Tertulis', 'Tanggung Jawab Warga'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa Ilmu Pengetahuan Alam dan Sosial (IPAS) Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Melihat Karena Cahaya, Mendengar Karena Bunyi', materi_pokok: ['Sifat Cahaya', 'Indra Penglihatan (Mata)', 'Sifat Bunyi', 'Indra Pendengaran (Telinga)'], semester: 1 },
        { no: 2, bab: 'Bab 2: Harmoni dalam Ekosistem', materi_pokok: ['Rantai Makanan', 'Jaring-jaring Makanan', 'Piramida Makanan', 'Keseimbangan Ekosistem'], semester: 1 },
        { no: 3, bab: 'Bab 3: Magnet, Listrik, dan Teknologi untuk Kehidupan', materi_pokok: ['Sifat Magnet', 'Energi Listrik', 'Teknologi & Perubahan Energi'], semester: 1 },
        { no: 4, bab: 'Bab 4: Mari Berkenalan dengan Bumi Kita', materi_pokok: ['Relief Bumi (Litosfer/Hidrosfer)', 'Siklus Air', 'Lempeng & Bentuk Muka Bumi'], semester: 1 },
        { no: 5, bab: 'Bab 5: Bagaimana Kita Hidup dan Bertumbuh', materi_pokok: ['Sistem Pernapasan Manusia', 'Sistem Pencernaan Makanan', 'Pubertas & Pertumbuhan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Indonesiaku Kaya Raya', materi_pokok: ['Peta & Letak Geografis', 'Keanekaragaman Hayati', 'Sumber Daya Alam (SDA) Indonesia'], semester: 2 },
        { no: 7, bab: 'Bab 7: Daerahku Kebanggaanku', materi_pokok: ['Warisan Budaya Daerah', 'Kegiatan Ekonomi Masyarakat', 'Produk Unggulan Daerah'], semester: 2 },
        { no: 8, bab: 'Bab 8: Bumiku Sayang, Bumiku Malang', materi_pokok: ['Perubahan Lingkungan Bumi', 'Pencemaran Lingkungan & Sampah', 'Pelestarian Alam & Mitigasi Bencana'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa Ilmu Pengetahuan Alam dan Sosial (IPAS) Kelas VI (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Bagaimana Tubuh Kita Bergerak?', materi_pokok: ['Rangka, sendi, dan otot', 'Sistem saraf', 'Kelainan organ gerak'], semester: 1 },
        { no: 2, bab: 'Bab 2: Cerita tentang Indonesia Kita', materi_pokok: ['Sejarah perjuangan bangsa', 'Tokoh kemerdekaan', 'Makna proklamasi'], semester: 1 },
        { no: 3, bab: 'Bab 3: Pelesir Keliling Dunia', materi_pokok: ['Benua-benua di dunia', 'Geografi internasional', 'Karakteristik negara sahabat'], semester: 1 },
        { no: 4, bab: 'Bab 4: Indonesia dan Masyarakat Dunia', materi_pokok: ['Kerja sama internasional (ASEAN, PBB)', 'Globalisasi', 'Ekspor impor'], semester: 1 },
        { no: 5, bab: 'Bab 5: Menjelajahi Bumi dan Antariksa', materi_pokok: ['Sistem tata surya', 'Rotasi dan revolusi bumi', 'Gerhana matahari & bulan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Gawat! Benarkah Energi di Bumi Akan Habis?', materi_pokok: ['Krisis energi', 'Energi terbarukan (surya, angin, air)', 'Hemat energi'], semester: 2 },
        { no: 7, bab: 'Bab 7: Bumi Kita Terancam Bahaya', materi_pokok: ['Pemanasan global (global warming)', 'Efek rumah kaca', 'Aksi pelestarian bumi'], semester: 2 },
        { no: 8, bab: 'Bab 8: Proyek Akhir IPAS', materi_pokok: ['Rancangan penelitian sederhana', 'Eksperimen sains', 'Pameran karya ilmiah kelas'], semester: 2 }
      ]
    }
  },
  'matematika': {
    '1': {
      judul: 'Buku Siswa Matematika Kelas I (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Ayo Membilang sampai dengan 10', materi_pokok: ['Membilang banyak benda', 'Menghitung maju dan mundur', 'Membandingkan banyak benda'], semester: 1 },
        { no: 2, bab: 'Bab 2: Penjumlahan sampai dengan 10', materi_pokok: ['Konsep gabungan penjumlahan', 'Pasangan bilangan', 'Menyelesaikan soal cerita penjumlahan'], semester: 1 },
        { no: 3, bab: 'Bab 3: Pengurangan sampai dengan 10', materi_pokok: ['Konsep sisa pengurangan', 'Hubungan penjumlahan dan pengurangan', 'Soal cerita pengurangan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Mengenal Bentuk Bangun', materi_pokok: ['Bangun datar segitiga, segi empat, lingkaran', 'Bangun ruang kubus, balok, bola'], semester: 1 },
        { no: 5, bab: 'Bab 5: Ayo Membilang sampai dengan 20', materi_pokok: ['Membilang 11 sampai 20', 'Nilai tempat puluhan dan satuan', 'Urutan bilangan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Penjumlahan dan Pengurangan sampai dengan 20', materi_pokok: ['Penjumlahan bilangan belasan', 'Pengurangan bilangan belasan', 'Pola bilangan sederhana'], semester: 2 },
        { no: 7, bab: 'Bab 7: Mengukur Panjang Benda', materi_pokok: ['Membandingkan panjang langsung', 'Mengukur panjang dengan satuan tidak baku'], semester: 2 },
        { no: 8, bab: 'Bab 8: Mengenal Diagram', materi_pokok: ['Mengelompokkan data benda', 'Membaca piktogram sederhana'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Siswa Matematika Kelas II (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Bilangan 1 sampai dengan 100', materi_pokok: ['Membilang sampai 100', 'Nilai tempat puluhan & satuan', 'Membandingkan dua bilangan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Penjumlahan dan Pengurangan', materi_pokok: ['Penjumlahan bersusun dengan teknik menyimpan', 'Pengurangan bersusun dengan teknik meminjam'], semester: 1 },
        { no: 3, bab: 'Bab 3: Bentuk di Sekitar Kita', materi_pokok: ['Segi banyak dan lingkaran', 'Titik sudut, sisi, dan permukaan bangun', 'Pola bangun datar berulang'], semester: 1 },
        { no: 4, bab: 'Bab 4: Posisi Benda dan Pola Gambar', materi_pokok: ['Letak posisi (atas/bawah, kiri/kanan)', 'Pola gambar berulang'], semester: 1 },
        { no: 5, bab: 'Bab 5: Pecahan Sederhana', materi_pokok: ['Mengenal pecahan 1/2, 1/3, 1/4', 'Pecahan dari sekumpulan benda'], semester: 2 },
        { no: 6, bab: 'Bab 6: Pengukuran Panjang, Berat, dan Waktu', materi_pokok: ['Satuan baku meter dan sentimeter', 'Satuan baku kilogram dan gram', 'Membaca jam analog tepat dan setengah'], semester: 2 },
        { no: 7, bab: 'Bab 7: Operasi Perkalian dan Pembagian Dasar', materi_pokok: ['Konsep perkalian penjumlahan berulang', 'Konsep pembagian pengurangan berulang'], semester: 2 },
        { no: 8, bab: 'Bab 8: Data dan Diagram Gambar', materi_pokok: ['Tabel frekuensi sederhana', 'Diagram gambar (piktogram)'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Siswa Matematika Kelas III (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Bilangan Cacah sampai 1.000', materi_pokok: ['Membaca & menulis bilangan ribuan', 'Nilai tempat ratusan & ribuan', 'Membandingkan bilangan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Operasi Penjumlahan dan Pengurangan', materi_pokok: ['Penjumlahan bersusun dengan teknik menyimpan', 'Pengurangan bersusun dengan teknik meminjam', 'Soal cerita'], semester: 1 },
        { no: 3, bab: 'Bab 3: Perkalian dan Pembagian Bilangan', materi_pokok: ['Konsep perkalian penjumlahan berulang', 'Konsep pembagian pengurangan berulang', 'Tabel perkalian'], semester: 1 },
        { no: 4, bab: 'Bab 4: Pengukuran Panjang dan Berat', materi_pokok: ['Satuan baku meter dan sentimeter', 'Satuan baku kilogram dan gram', 'Alat ukur timbangan'], semester: 1 },
        { no: 5, bab: 'Bab 5: Pecahan Sederhana', materi_pokok: ['Mengenal pecahan 1/2, 1/3, 1/4', 'Pecahan pada garis bilangan', 'Membandingkan pecahan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Keliling dan Luas Bangun Datar', materi_pokok: ['Keliling bangun datar dengan satuan tidak baku', 'Luas bangun datar petak satuan', 'Persegi & persegi panjang'], semester: 2 },
        { no: 7, bab: 'Bab 7: Sudut dan Garis', materi_pokok: ['Jenis sudut (siku-siku, lancip, tumpul)', 'Garis sejajar dan berpotongan'], semester: 2 },
        { no: 8, bab: 'Bab 8: Penyajian Data Sederhana', materi_pokok: ['Tabel turus / tally', 'Piktogram dan diagram gambar', 'Membaca data diagram'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa Matematika Kelas IV (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Bilangan Cacah sampai 10.000', materi_pokok: ['Membaca & menulis bilangan ribuan', 'Nilai tempat ribuan', 'Operasi penjumlahan & pengurangan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Pecahan Senilai dan Desimal', materi_pokok: ['Pecahan senilai', 'Menyederhanakan pecahan', 'Pecahan desimal persepuluhan dan perseratusan'], semester: 1 },
        { no: 3, bab: 'Bab 3: Pola Gambar dan Pola Bilangan', materi_pokok: ['Pola gambar membesar dan mengecil', 'Pola bilangan lompat teratur'], semester: 1 },
        { no: 4, bab: 'Bab 4: Pengukuran Luas dan Volume', materi_pokok: ['Luas petak satuan', 'Volume kubus satuan', 'Satuan baku luas dan volume'], semester: 1 },
        { no: 5, bab: 'Bab 5: Bangun Datar dan Sudut', materi_pokok: ['Ciri-ciri segitiga dan segi empat', 'Komposisi dekomposisi bangun', 'Besar sudut'], semester: 2 },
        { no: 6, bab: 'Bab 6: Piktogram dan Diagram Batang', materi_pokok: ['Penyajian data piktogram', 'Diagram batang tegak dan mendatar', 'Menganalisis data'], semester: 2 },
        { no: 7, bab: 'Bab 7: Perkalian dan Pembagian Bersusun', materi_pokok: ['Perkalian ratusan dengan puluhan', 'Pembagian bersusun (porogapit)'], semester: 2 },
        { no: 8, bab: 'Bab 8: Faktor dan Kelipatan Bilangan', materi_pokok: ['Faktor persekutuan', 'Kelipatan persekutuan', 'Bilangan prima'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa Matematika Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Bilangan Cacah sampai 100.000', materi_pokok: ['Membaca & menulis bilangan', 'Nilai tempat', 'Operasi hitung penjumlahan & pengurangan'], semester: 1 },
        { no: 2, bab: 'Bab 2: KPK dan FPB', materi_pokok: ['Kelipatan dan faktor bilangan', 'Faktorisasi prima', 'Penerapan KPK dan FPB sehari-hari'], semester: 1 },
        { no: 3, bab: 'Bab 3: Bilangan Pecahan', materi_pokok: ['Pecahan senilai', 'Penjumlahan & pengurangan pecahan', 'Pecahan desimal'], semester: 1 },
        { no: 4, bab: 'Bab 4: Keliling Bangun Datar', materi_pokok: ['Keliling segitiga', 'Keliling segi empat', 'Penyelesaian masalah keliling'], semester: 1 },
        { no: 5, bab: 'Bab 5: Luas Daerah Bangun Datar', materi_pokok: ['Luas segitiga', 'Luas persegi & persegi panjang', 'Luas jajar genjang'], semester: 2 },
        { no: 6, bab: 'Bab 6: Sudut dan Pengukurannya', materi_pokok: ['Jenis-jenis sudut', 'Mengukur sudut dengan busur', 'Sudut pada bangun datar'], semester: 2 },
        { no: 7, bab: 'Bab 7: Membandingkan Ciri-Ciri Bangun Datar', materi_pokok: ['Sisi, rusuk, sudut', 'Simetri lipat & simetri putar'], semester: 2 },
        { no: 8, bab: 'Bab 8: Data dan Diagram', materi_pokok: ['Pengumpulan data', 'Tabel frekuensi', 'Diagram batang'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa Matematika Kelas VI (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Pecahan dan Desimal', materi_pokok: ['Perkalian pecahan', 'Pembagian pecahan', 'Operasi hitung desimal dan rasio'], semester: 1 },
        { no: 2, bab: 'Bab 2: Lingkaran', materi_pokok: ['Unsur-unsur lingkaran (jari-jari, diameter, busur)', 'Keliling lingkaran', 'Luas lingkaran'], semester: 1 },
        { no: 3, bab: 'Bab 3: Bangun Ruang', materi_pokok: ['Ciri prisma, tabung, limas, kerucut', 'Jaring-jaring bangun ruang', 'Luas permukaan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Volume Bangun Ruang', materi_pokok: ['Volume prisma segitiga', 'Volume tabung dan limas', 'Pemecahan masalah volume'], semester: 1 },
        { no: 5, bab: 'Bab 5: Rasio dan Skala', materi_pokok: ['Konsep rasio dua besaran', 'Skala pada peta dan denah', 'Perbandingan senilai dan berbalik nilai'], semester: 2 },
        { no: 6, bab: 'Bab 6: Data Statistik dan Mean, Median, Modus', materi_pokok: ['Menentukan nilai rata-rata (mean)', 'Nilai tengah (median)', 'Nilai yang sering muncul (modus)'], semester: 2 },
        { no: 7, bab: 'Bab 7: Penyajian Data Lingkaran dan Garis', materi_pokok: ['Membaca diagram lingkaran', 'Membuat diagram garis perkembangan data'], semester: 2 },
        { no: 8, bab: 'Bab 8: Peluang Sederhana', materi_pokok: ['Peluang kejadian saling lepas', 'Ruang sampel dadu dan koin', 'Prediksi kemungkinan'], semester: 2 }
      ]
    }
  },
  'pendidikan pancasila': {
    '1': {
      judul: 'Buku Siswa Pendidikan Pancasila Kelas I (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Aku Cinta Pancasila', materi_pokok: ['Mengenal simbol-simbol sila Pancasila', 'Lambang Garuda Pancasila', 'Penerapan sila di rumah'], semester: 1 },
        { no: 2, bab: 'Bab 2: Aku Anak yang Patuh Aturan', materi_pokok: ['Aturan di rumah dan sekolah', 'Tata tertib kelas', 'Disiplin dan tanggung jawab'], semester: 1 },
        { no: 3, bab: 'Bab 3: Ayo Mengenal Diri dan Teman', materi_pokok: ['Identitas diri', 'Keberagaman fisik dan hobi teman', 'Sikap saling menghormati'], semester: 2 },
        { no: 4, bab: 'Bab 4: Aku Cinta Lingkungan Sekitar', materi_pokok: ['Bagian rumah dan lingkungan sekolah', 'Gotong royong membersihkan kelas'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Siswa Pendidikan Pancasila Kelas II (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Mari Berperilaku Sesuai Nilai Pancasila', materi_pokok: ['Sila-sila Pancasila dalam keseharian', 'Sikap tolong-menolong dan gotong royong'], semester: 1 },
        { no: 2, bab: 'Bab 2: Menaati Aturan di Sekitarku', materi_pokok: ['Aturan bermain bersama teman', 'Musyawarah mufakat sederhana'], semester: 1 },
        { no: 3, bab: 'Bab 3: Kita Beragam Tetapi Tetap Satu', materi_pokok: ['Keberagaman suku dan agama', 'Sikap toleransi antarteman'], semester: 2 },
        { no: 4, bab: 'Bab 4: Menjaga Persatuan di Lingkungan Rumah dan Sekolah', materi_pokok: ['Kerja sama tetangga', 'Cinta tanah air nusantara'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Siswa Pendidikan Pancasila Kelas III (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Aku Anak Indonesia yang Berpancasila', materi_pokok: ['Makna lambang Garuda Pancasila', 'Nilai luhur sila Pancasila', 'Keteladanan tokoh'], semester: 1 },
        { no: 2, bab: 'Bab 2: Aku Patuh terhadap Aturan', materi_pokok: ['Norma dan tata tertib sekolah', 'Hak dan kewajiban anak di sekolah'], semester: 1 },
        { no: 3, bab: 'Bab 3: Berbeda Itu Indah', materi_pokok: ['Keragaman budaya nusantara', 'Sikap toleran kebinekaan'], semester: 2 },
        { no: 4, bab: 'Bab 4: Ayo Mengenal Lingkungan Tempat Tinggal', materi_pokok: ['Mengenal RT, RW, dan Desa', 'Persatuan dalam keragaman lingkungan'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa Pendidikan Pancasila Kelas IV (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Mengenal Lingkungan Sekitarku', materi_pokok: ['Struktur desa dan kecamatan', 'Musyawarah warga dan gotong royong'], semester: 1 },
        { no: 2, bab: 'Bab 2: Aku Anak Disiplin', materi_pokok: ['Norma sosial dan hukum tertulis', 'Hak dan kewajiban warga negara'], semester: 1 },
        { no: 3, bab: 'Bab 3: Membangun Jati Diri dalam Kebhinekaan', materi_pokok: ['Kekayaan budaya daerah nusantara', 'Bahasa daerah dan baju adat'], semester: 2 },
        { no: 4, bab: 'Bab 4: Negaraku Kesatuan Republik Indonesia', materi_pokok: ['Batas wilayah NKRI', 'Keutuhan bangsa dan cinta tanah air'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa Pendidikan Pancasila Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Pancasila dalam Kehidupanku', materi_pokok: ['Makna sila-sila Pancasila', 'Penerapan nilai Pancasila di rumah & sekolah', 'Gotong royong'], semester: 1 },
        { no: 2, bab: 'Bab 2: Norma dalam Kehidupanku', materi_pokok: ['Macam-macam norma (agama, kesusilaan, kesopanan, hukum)', 'Hak dan kewajiban anak'], semester: 1 },
        { no: 3, bab: 'Bab 3: Jati Diri dan Keberagaman Bangsa Indonesia', materi_pokok: ['Keragaman budaya nusantara', 'Sikap toleransi kebinekaan', 'Pelestarian budaya'], semester: 2 },
        { no: 4, bab: 'Bab 4: Negaraku Indonesia', materi_pokok: ['Wilayah NKRI', 'Persatuan dan kesatuan bangsa', 'Cinta tanah air'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa Pendidikan Pancasila Kelas VI (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Belajar Mengamalkan Pancasila', materi_pokok: ['Penerapan nilai Pancasila era digital', 'Kepemimpinan berkarakter Pancasila'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mengamalkan Norma dan Keadilan Sosial', materi_pokok: ['Penerapan norma hukum nasional', 'Hak asasi dan kewajiban warga negara'], semester: 1 },
        { no: 3, bab: 'Bab 3: Menghormati Keberagaman Budaya Nusantara', materi_pokok: ['Pelestarian kearifan lokal', 'Mencegah intoleransi sosial'], semester: 2 },
        { no: 4, bab: 'Bab 4: Menjaga Keutuhan NKRI', materi_pokok: ['Peran generasi muda menjaga NKRI', 'Wawasan kebangsaan dan diplomasi'], semester: 2 }
      ]
    }
  },
  'pendidikan agama dan budi pekerti': {
    '1': {
      judul: 'Buku Siswa PAI dan Budi Pekerti Kelas I (Kemendikbudristek • BSKAP 020/2026)',
      chapters: [
        { no: 1, bab: 'Bab 1: [Al-Qur’an Hadis] Aku Cinta Al-Qur\'an', materi_pokok: ['Huruf hijaiyah berharakat', 'QS Al-Fatihah dan Al-Ikhlas'], semester: 1 },
        { no: 2, bab: 'Bab 2: [Akidah] Mengenal Rukun Iman', materi_pokok: ['Iman kepada Allah SWT dan Rasul-Nya', 'Ciptaan Allah'], semester: 1 },
        { no: 3, bab: 'Bab 3: [Akhlak] Aku Suka Membaca Basmalah dan Hamdalah', materi_pokok: ['Adab berdoa', 'Kalimat tayibah sehari-hari'], semester: 1 },
        { no: 4, bab: 'Bab 4: [Fikih] Mengenal Rukun Islam dan Syahadatain', materi_pokok: ['Dua kalimat syahadat', 'Sholat 5 waktu'], semester: 1 },
        { no: 5, bab: 'Bab 5: [Sejarah Peradaban Islam] Mengenal Nabi dan Rasul Teladan', materi_pokok: ['Nabi Adam a.s.', 'Nabi Muhammad SAW panutan'], semester: 2 },
        { no: 6, bab: 'Bab 6: [Al-Qur’an Hadis] Al-Qur\'an Pedoman Hidupku', materi_pokok: ['QS Al-Kausar dan An-Nas', 'Menyayangi sesama ciptaan Allah'], semester: 2 },
        { no: 7, bab: 'Bab 7: [Akhlak] Kasih Sayang terhadap Sesama', materi_pokok: ['Sikap santun kepada orang tua', 'Hormat kepada guru'], semester: 2 },
        { no: 8, bab: 'Bab 8: [Fikih] Bersuci dan Berwudhu', materi_pokok: ['Tata cara wudhu yang benar', 'Hidup bersih dan rapi'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Siswa PAI dan Budi Pekerti Kelas II (Kemendikbudristek • BSKAP 020/2026)',
      chapters: [
        { no: 1, bab: 'Bab 1: [Al-Qur’an Hadis] Ayo Belajar Al-Qur\'an', materi_pokok: ['Hukum bacaan mad thabi\'i', 'QS An-Nas dan Al-Falaq'], semester: 1 },
        { no: 2, bab: 'Bab 2: [Akidah] Asmaul Husna Teladanku', materi_pokok: ['Al-Hafizh, Al-Wali', 'Al-\'Alim, Al-Khabir'], semester: 1 },
        { no: 3, bab: 'Bab 3: [Akhlak] Perilaku Terpuji dalam Keseharian', materi_pokok: ['Sikap jujur dan disiplin', 'Berterima kasih dan tolong-menolong'], semester: 1 },
        { no: 4, bab: 'Bab 4: [Fikih] Shalat Fardhu Berjamaah', materi_pokok: ['Bacaan shalat lengkap', 'Keutamaan shalat berjamaah di masjid'], semester: 1 },
        { no: 5, bab: 'Bab 5: [Sejarah Peradaban Islam] Kisah Keteladanan Nabi Nuh a.s.', materi_pokok: ['Kesabaran dalam dakwah', 'Ketaatan kepada perintah Allah'], semester: 2 },
        { no: 6, bab: 'Bab 6: [Al-Qur’an Hadis] Senang Membaca Al-Qur\'an', materi_pokok: ['QS Al-Kafirun dan Al-Ma\'un', 'Menghindari kemusyrikan'], semester: 2 },
        { no: 7, bab: 'Bab 7: [Akidah] Beriman kepada Malaikat Allah', materi_pokok: ['Nama dan tugas 10 Malaikat Allah', 'Pengawasan malaikat'], semester: 2 },
        { no: 8, bab: 'Bab 8: [Akhlak] Adab Makan, Minum, dan Tidur', materi_pokok: ['Doa sebelum dan sesudah makan', 'Sunnah Rasulullah sebelum tidur'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Siswa PAI dan Budi Pekerti Kelas III (Kemendikbudristek • BSKAP 020/2026)',
      chapters: [
        { no: 1, bab: 'Bab 1: [Al-Qur’an Hadis] Asyiknya Belajar Surah Pendek', materi_pokok: ['QS Al-Humazah', 'QS At-Takasur', 'Pesan moral surah'], semester: 1 },
        { no: 2, bab: 'Bab 2: [Akidah] Meyakini Kitab-Kitab Allah SWT', materi_pokok: ['Mengenal 4 kitab suci', 'Al-Qur\'an kitab penyempurna'], semester: 1 },
        { no: 3, bab: 'Bab 3: [Akhlak] Berperilaku Terpuji', materi_pokok: ['Sikap tawadhu dan ikhlas', 'Memohon pertolongan hanya pada Allah'], semester: 1 },
        { no: 4, bab: 'Bab 4: [Fikih] Kewajiban dan Hikmah Shalat', materi_pokok: ['Syarat sah dan rukun shalat', 'Hikmah shalat bagi kedisiplinan'], semester: 1 },
        { no: 5, bab: 'Bab 5: [Sejarah Peradaban Islam] Kisah Teladan Nabi Ibrahim dan Nabi Ismail', materi_pokok: ['Keikhlasan berkorban', 'Asal usul ibadah kurban'], semester: 2 },
        { no: 6, bab: 'Bab 6: [Al-Qur’an Hadis] Keindahan Surah Al-Qari\'ah dan Az-Zalzalah', materi_pokok: ['Tafsir surah hari kiamat', 'Mawas diri'], semester: 2 },
        { no: 7, bab: 'Bab 7: [Akidah] Asmaul Husna Al-Wahhab dan Al-Kabir', materi_pokok: ['Makna Allah Maha Pemberi', 'Kebesaran Allah SWT'], semester: 2 },
        { no: 8, bab: 'Bab 8: [Fikih] Puasa Ramadhan dan Amalan Sunnah', materi_pokok: ['Ketentuan puasa Ramadhan', 'Amalan shalat tarawih dan tadarus'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa PAI dan Budi Pekerti Kelas IV (Kemendikbudristek • BSKAP 020/2026)',
      chapters: [
        { no: 1, bab: 'Bab 1: [Al-Qur’an Hadis] Mari Belajar Surah Al-Hujurat Ayat 13', materi_pokok: ['Membaca dan menghafal QS Al-Hujurat 13', 'Keragaman bangsa manusia'], semester: 1 },
        { no: 2, bab: 'Bab 2: [Akidah] Teladan Asmaul Husna Mulia', materi_pokok: ['Al-Malik, Al-Aziz', 'Al-Quddus, As-Salam, Al-Mu\'min'], semester: 1 },
        { no: 3, bab: 'Bab 3: [Akhlak] Indahnya Saling Menghargai dalam Keragaman', materi_pokok: ['Toleransi beragama', 'Kerukunan hidup bermasyarakat'], semester: 1 },
        { no: 4, bab: 'Bab 4: [Fikih] Menyambut Usia Baligh', materi_pokok: ['Tanda baligh secara fiqih & biologi', 'Kewajiban mandi wajib'], semester: 1 },
        { no: 5, bab: 'Bab 5: [Sejarah Peradaban Islam] Kisah Hijrah Nabi Muhammad SAW ke Madinah', materi_pokok: ['Sebab-sebab hijrah', 'Membangun persaudaraan Muhajirin & Anshar'], semester: 2 },
        { no: 6, bab: 'Bab 6: [Al-Qur’an Hadis] Mari Belajar Surah At-Tin', materi_pokok: ['Tafsir QS At-Tin', 'Kemuliaan martabat manusia'], semester: 2 },
        { no: 7, bab: 'Bab 7: [Akidah] Beriman kepada Rasul-Rasul Allah', materi_pokok: ['Sifat wajib & mustahil rasul', 'Mukjizat rasul ulul azmi'], semester: 2 },
        { no: 8, bab: 'Bab 8: [Fikih] Shalat Jumat, Shalat Duha, dan Shalat Tahajud', materi_pokok: ['Ketentuan shalat Jumat', 'Keutamaan shalat sunnah duha & tahajud'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa Pendidikan Agama Islam dan Budi Pekerti Kelas V (Kemendikbudristek • BSKAP 020/2026)',
      chapters: [
        { no: 1, bab: 'Bab 1: [Al-Qur’an Hadis] Menyayangi Anak Yatim (QS. Al-Ma’un)', materi_pokok: ['Membaca & menghafal QS Al-Maun', 'Pesan pokok QS Al-Maun', 'Menyayangi anak yatim'], semester: 1 },
        { no: 2, bab: 'Bab 2: [Akidah] Lebih Dekat dengan Nama-Nama Allah', materi_pokok: ['Asmaul Husna Al-Qawiyyu', 'Asmaul Husna Al-Qayyum', 'Asmaul Husna Al-Muhyi & Al-Mumit'], semester: 1 },
        { no: 3, bab: 'Bab 3: [Akhlak] Aku Anak Saleh Menghargai Keragaman', materi_pokok: ['Keragaman suku & agama manusia', 'Sikap toleransi & saling menghargai'], semester: 1 },
        { no: 4, bab: 'Bab 4: [Fikih] Hidup Lapang dengan Berbagi', materi_pokok: ['Makna zakat fitrah & mal', 'Infak, sedekah, dan hadiah'], semester: 1 },
        { no: 5, bab: 'Bab 5: [Sejarah Peradaban Islam] Meneladani Perjuangan Rasulullah SAW', materi_pokok: ['Peristiwa Fathu Makkah', 'Haji Wada dan pesan terakhir Rasulullah'], semester: 2 },
        { no: 6, bab: 'Bab 6: [Akidah] Hidup Damai dalam Kebersamaan', materi_pokok: ['Mengenal kitab-kitab suci Allah', 'Taurat, Zabur, Injil, Al-Quran'], semester: 2 },
        { no: 7, bab: 'Bab 7: [Akhlak] Ketika Hati Bersih dari Sifat Tercela', materi_pokok: ['Menghindari sifat dengki & sombong', 'Menumbuhkan sifat tawadhu'], semester: 2 },
        { no: 8, bab: 'Bab 8: [Akhlak] Senangnya Berteman Tanpa Membeda-bedakan', materi_pokok: ['Hikmah persaudaraan (ukhuwah)', 'Menjaga kerukunan antarumat'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa PAI dan Budi Pekerti Kelas VI (Kemendikbudristek • BSKAP 020/2026)',
      chapters: [
        { no: 1, bab: 'Bab 1: [Al-Qur’an Hadis] Indahnya Kebersamaan dalam QS Al-Hujurat 10-12', materi_pokok: ['Persaudaraan mukmin', 'Larangan menggunjing (ghibah)'], semester: 1 },
        { no: 2, bab: 'Bab 2: [Akidah] Meyakini Hari Akhir (Kiamat)', materi_pokok: ['Kiamat sugra dan kubra', 'Hikmah beriman pada hari akhir'], semester: 1 },
        { no: 3, bab: 'Bab 3: [Akidah] Keteladanan Asmaul Husna As-Samad & Al-Muqtadir', materi_pokok: ['Asmaul Husna As-Samad', 'Al-Muqtadir, Al-Muqaddim, Al-Baqi'], semester: 1 },
        { no: 4, bab: 'Bab 4: [Fikih] Indahnya Berbagi Zakat, Infak, dan Sedekah', materi_pokok: ['Hukum dan mustahik zakat', 'Manajemen infak dan sedekah'], semester: 1 },
        { no: 5, bab: 'Bab 5: [Sejarah Peradaban Islam] Kisah Teladan Khulafaur Rasyidin', materi_pokok: ['Abu Bakar Ash-Shiddiq, Umar bin Khattab', 'Utsman bin Affan, Ali bin Abi Thalib'], semester: 2 },
        { no: 6, bab: 'Bab 6: [Al-Qur’an Hadis] Keagungan Surah Al-A\'la dan Al-Ghasyiyah', materi_pokok: ['Pesan tauhid QS Al-A\'la', 'Peringatan QS Al-Ghasyiyah'], semester: 2 },
        { no: 7, bab: 'Bab 7: [Akidah] Meyakini Qada dan Qadar Allah', materi_pokok: ['Takdir mubram dan muallaq', 'Ikhtiar dan tawakal'], semester: 2 },
        { no: 8, bab: 'Bab 8: [Akhlak] Peduli Lingkungan dan Menjaga Bumi', materi_pokok: ['Konservasi alam dalam Islam', 'Larangan berbuat kerusakan di bumi'], semester: 2 }
      ]
    }
  },
  'pendidikan jasmani, olahraga, dan kesehatan (pjok)': {
    '1': {
      judul: 'Buku Siswa PJOK Kelas I (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Gerak Dasar Lokomotor', materi_pokok: ['Jalan cepat dan santai', 'Lari ke berbagai arah', 'Lompat dan loncat'], semester: 1 },
        { no: 2, bab: 'Bab 2: Gerak Dasar Nonlokomotor', materi_pokok: ['Memutar badan dan lengan', 'Menekuk lutut dan membungkuk', 'Meliuk'], semester: 1 },
        { no: 3, bab: 'Bab 3: Gerak Dasar Manipulatif', materi_pokok: ['Melempar bola kecil', 'Menangkap bola dengan dua tangan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Gerak Dominan Senam Lantai', materi_pokok: ['Keseimbangan bertumpu pada satu kaki', 'Berguling aman di matras'], semester: 1 },
        { no: 5, bab: 'Bab 5: Gerak Berirama Sederhana', materi_pokok: ['Langkah kaki berirama', 'Gerak anggota tubuh mengikuti irama lagu'], semester: 2 },
        { no: 6, bab: 'Bab 6: Pengenalan Aktivitas Air', materi_pokok: ['Keselamatan diri di kolam renang dangkal', 'Bermain air menyenangkan'], semester: 2 },
        { no: 7, bab: 'Bab 7: Mengenal Bagian Tubuh dan Batas Pribadi', materi_pokok: ['Bagian tubuh yang boleh & tidak boleh disentuh orang lain', 'Menjaga aurat'], semester: 2 },
        { no: 8, bab: 'Bab 8: Menjaga Kebersihan Diri dan Pakaian', materi_pokok: ['Mencuci tangan dan menggosok gigi', 'Memakai pakaian bersih'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Siswa PJOK Kelas II (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Variasi Gerak Lokomotor', materi_pokok: ['Lari zig-zag melompati rintangan', 'Lompat ke depan dan samping'], semester: 1 },
        { no: 2, bab: 'Bab 2: Variasi Gerak Nonlokomotor', materi_pokok: ['Peregangan otot leher, pinggang, kaki', 'Gerak keseimbangan dinamis'], semester: 1 },
        { no: 3, bab: 'Bab 3: Variasi Gerak Manipulatif', materi_pokok: ['Menendang bola ke sasaran', 'Menggiring bola kaki sederhana'], semester: 1 },
        { no: 4, bab: 'Bab 4: Senam Ketangkasan Sederhana', materi_pokok: ['Bertumpu dan bergantung pada palang', 'Mendarat aman dari ketinggian'], semester: 1 },
        { no: 5, bab: 'Bab 5: Pola Gerak Berirama Ceria', materi_pokok: ['Gerak senam irama anak', 'Kombinasi ayunan tangan dan langkah kaki'], semester: 2 },
        { no: 6, bab: 'Bab 6: Pengenalan Renang Dasar', materi_pokok: ['Gerakan mengapung di permukaan air', 'Meluncur dengan papan pelampung'], semester: 2 },
        { no: 7, bab: 'Bab 7: Makanan Sehat dan Istirahat Cukup', materi_pokok: ['Pilihan jajanan sehat di sekolah', 'Pentingnya tidur teratur'], semester: 2 },
        { no: 8, bab: 'Bab 8: Menghindari Bahaya Cedera saat Bermain', materi_pokok: ['Pemanasan sebelum olahraga', 'Aturan bermain aman di lapangan'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Siswa PJOK Kelas III (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Kombinasi Gerak Permainan Bola Besar', materi_pokok: ['Passing sepak bola mini', 'Passing bawah bola voli mini'], semester: 1 },
        { no: 2, bab: 'Bab 2: Kombinasi Gerak Permainan Bola Kecil', materi_pokok: ['Permainan kasti mini', 'Melempar dan memukul bola bertarget'], semester: 1 },
        { no: 3, bab: 'Bab 3: Gerak Dasar Atletik', materi_pokok: ['Lari cepat 40 meter', 'Lompat jauh gaya jongkok mini'], semester: 1 },
        { no: 4, bab: 'Bab 4: Latihan Daya Tahan dan Kelincahan', materi_pokok: ['Lari bolak-balik (shuttle run)', 'Push up dan sit up sederhana'], semester: 1 },
        { no: 5, bab: 'Bab 5: Senam Lantai Guling Depan', materi_pokok: ['Sikap awalan jongkok guling depan', 'Sikap akhir berdiri stabil'], semester: 2 },
        { no: 6, bab: 'Bab 6: Senam Irama Langkah Berpasangan', materi_pokok: ['Kombinasi gerak tari berpasangan', 'Menyesuaikan tempo musik'], semester: 2 },
        { no: 7, bab: 'Bab 7: Gerak Dasar Renang Gaya Dada', materi_pokok: ['Gerakan kaki renang gaya dada', 'Gerakan lengan dan pengambilan napas'], semester: 2 },
        { no: 8, bab: 'Bab 8: Pencegahan Penyakit Menular', materi_pokok: ['Mencuci tangan pakai sabun', 'Mencegah demam berdarah dan influenza'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa PJOK Kelas IV (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Variasi dan Kombinasi Sepak Bola & Bola Voli', materi_pokok: ['Dribbling, shooting bola kaki', 'Servis bawah bola voli'], semester: 1 },
        { no: 2, bab: 'Bab 2: Permainan Bola Kecil Rounders & Kasti', materi_pokok: ['Menangkap bola lambung dan menyusur tanah', 'Aturan bermain rounders'], semester: 1 },
        { no: 3, bab: 'Bab 3: Atletik Jalan Cepat dan Lempar Roket', materi_pokok: ['Teknik start dan jalan cepat', 'Lempar turbo / roket dengan awalan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Seni Bela Diri Pencak Silat', materi_pokok: ['Kuda-kuda depan, tengah, samping', 'Pukulan lurus dan tangkisan atas'], semester: 1 },
        { no: 5, bab: 'Bab 5: Tes Kebugaran Jasmani Indonesia (TKJI)', materi_pokok: ['Uji lari cepat, baring duduk', 'Loncat tegak dan lari ketahanan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Senam Ketangkasan Sikap Lilin dan Kayang', materi_pokok: ['Sikap lilin dengan bantuan teman', 'Kayang aman di atas matras'], semester: 2 },
        { no: 7, bab: 'Bab 7: Renang Gaya Bebas', materi_pokok: ['Kicking renang gaya bebas', 'Rotasi lengan dan pernapasan samping'], semester: 2 },
        { no: 8, bab: 'Bab 8: Bahaya Merokok dan Minuman Keras', materi_pokok: ['Zat berbahaya dalam rokok', 'Menjaga pergaulan sehat dan pola hidup bugar'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa PJOK Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Pola Gerak Dasar Permainan Bola Besar', materi_pokok: ['Sepak bola mini', 'Bola voli mini', 'Kombinasi gerak lokomotor & manipulatif'], semester: 1 },
        { no: 2, bab: 'Bab 2: Pola Gerak Dasar Permainan Bola Kecil', materi_pokok: ['Permainan kasti', 'Lempar, tangkap, dan memukul bola', 'Aturan fair play'], semester: 1 },
        { no: 3, bab: 'Bab 3: Aktivitas Gerak Dasar Atletik', materi_pokok: ['Jalan cepat dan lari sprint', 'Lompat jauh gaya jongkok', 'Lempar turbo'], semester: 1 },
        { no: 4, bab: 'Bab 4: Aktivitas Seni Beladiri Pencak Silat', materi_pokok: ['Kuda-kuda dan pola langkah', 'Tangkisan dan pukulan dasar silat'], semester: 1 },
        { no: 5, bab: 'Bab 5: Latihan Kebugaran Jasmani', materi_pokok: ['Kekuatan dan daya tahan otot', 'Kelenturan tubuh', 'Daya tahan jantung paru'], semester: 2 },
        { no: 6, bab: 'Bab 6: Pola Gerak Dominan Senam Ketangkasan', materi_pokok: ['Guling ke depan & ke belakang', 'Sikap lilin dan kayang aman'], semester: 2 },
        { no: 7, bab: 'Bab 7: Aktivitas Gerak Berirama (Senam Irama)', materi_pokok: ['Variasi langkah kaki berirama', 'Ayunan lengan mengikuti tempo'], semester: 2 },
        { no: 8, bab: 'Bab 8: Pemeliharaan Kebersihan Alat Reproduksi & Hidup Sehat', materi_pokok: ['Menjaga kebersihan diri masa pubertas', 'Makanan sehat dan pencegahan penyakit'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa PJOK Kelas VI (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Taktik Permainan Bola Besar (Sepak Bola & Bola Basket)', materi_pokok: ['Pola penyerangan dan pertahanan', 'Passing dada dan pantul bola basket'], semester: 1 },
        { no: 2, bab: 'Bab 2: Keterampilan Bulu Tangkis dan Tenis Meja', materi_pokok: ['Pukulan servis forehand/backhand', 'Smash dan netting bulutangkis'], semester: 1 },
        { no: 3, bab: 'Bab 3: Atletik Lari Estafet dan Lompat Jauh', materi_pokok: ['Pergantian tongkat estafet visual/nonvisual', 'Lompat jauh gaya melenting'], semester: 1 },
        { no: 4, bab: 'Bab 4: Bela Diri Pencak Silat Jurus Baku', materi_pokok: ['Rangkaian jurus tunggal baku tangan kosong', 'Nilai sportivitas pesilat'], semester: 1 },
        { no: 5, bab: 'Bab 5: Program Kebugaran Kardiovaskular', materi_pokok: ['Menghitung denyut nadi istirahat & latihan', 'Sirkuit training kebugaran'], semester: 2 },
        { no: 6, bab: 'Bab 6: Senam Lantai Rangkaian Guling Lenting', materi_pokok: ['Kombinasi guling depan dan lenting', 'Lompat kangkang di atas peti'], semester: 2 },
        { no: 7, bab: 'Bab 7: Renang Gaya Punggung dan Water Safety', materi_pokok: ['Gerakan kaki renang gaya punggung', 'Teknik pertolongan sederhana di air'], semester: 2 },
        { no: 8, bab: 'Bab 8: Penanganan P3K dan Kesehatan Lingkungan', materi_pokok: ['Pertolongan pertama luka dan kram', 'Sanitasi lingkungan sekolah sehat'], semester: 2 }
      ]
    }
  },
  'bahasa inggris': {
    '1': {
      judul: 'Buku Siswa My Next Words Grade 1 (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Unit 1: How Are You?', materi_pokok: ['Greetings and introductions', 'Saying hello and goodbye'], semester: 1 },
        { no: 2, bab: 'Unit 2: Colors Around Me', materi_pokok: ['Identifying red, blue, yellow, green', 'Naming colorful objects'], semester: 1 },
        { no: 3, bab: 'Unit 3: Numbers 1 to 10', materi_pokok: ['Counting one to ten', 'How many toys?'], semester: 1 },
        { no: 4, bab: 'Unit 4: My Classroom Objects', materi_pokok: ['Book, pencil, bag, ruler, eraser', 'This is a...'], semester: 1 },
        { no: 5, bab: 'Unit 5: My Body Parts', materi_pokok: ['Head, eyes, ears, nose, mouth, hands', 'Touch your head'], semester: 2 },
        { no: 6, bab: 'Unit 6: My Lovely Family', materi_pokok: ['Father, mother, brother, sister', 'Family tree'], semester: 2 },
        { no: 7, bab: 'Unit 7: Animals at Home', materi_pokok: ['Cat, dog, bird, fish, rabbit', 'Pet characteristics'], semester: 2 },
        { no: 8, bab: 'Unit 8: Fresh Fruits', materi_pokok: ['Apple, banana, mango, orange', 'I like apples'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Siswa My Next Words Grade 2 (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Unit 1: Do You Like Apple?', materi_pokok: ['Expressing food likes and dislikes', 'Fruit and vegetables'], semester: 1 },
        { no: 2, bab: 'Unit 2: My Classroom Rules', materi_pokok: ['Commands: sit down, stand up, open book', 'Classroom actions'], semester: 1 },
        { no: 3, bab: 'Unit 3: Where Is My Bag?', materi_pokok: ['Prepositions: in, on, under', 'Finding classroom things'], semester: 1 },
        { no: 4, bab: 'Unit 4: Numbers 11 to 20', materi_pokok: ['Counting eleven to twenty', 'Addition of small objects'], semester: 1 },
        { no: 5, bab: 'Unit 5: Shapes and Sizes', materi_pokok: ['Circle, square, triangle, rectangle', 'Big and small'], semester: 2 },
        { no: 6, bab: 'Unit 6: My Clothes', materi_pokok: ['Shirt, pants, skirt, shoes, socks', 'I am wearing...'], semester: 2 },
        { no: 7, bab: 'Unit 7: Animals Around Us', materi_pokok: ['Cow, goat, horse, duck, chicken', 'Farm animal sounds'], semester: 2 },
        { no: 8, bab: 'Unit 8: Vehicles on the Road', materi_pokok: ['Car, bus, bicycle, motorcycle, train', 'Transportation'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Siswa My Next Words Grade 3 (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Unit 1: I Can Make Fried Rice', materi_pokok: ['Kitchen utensils and simple cooking verbs', 'Expressing ability'], semester: 1 },
        { no: 2, bab: 'Unit 2: I Like Swimming on Sunday', materi_pokok: ['Days of the week', 'Hobbies and sports activities'], semester: 1 },
        { no: 3, bab: 'Unit 3: She Has Long Hair', materi_pokok: ['Describing physical appearance', 'Adjectives of appearance'], semester: 1 },
        { no: 4, bab: 'Unit 4: What Are You Doing?', materi_pokok: ['Present continuous: reading, playing, eating', 'Classroom actions'], semester: 1 },
        { no: 5, bab: 'Unit 5: In My House', materi_pokok: ['Rooms of the house (living room, bedroom, kitchen)', 'Household items'], semester: 2 },
        { no: 6, bab: 'Unit 6: It Is Ten O\'clock', materi_pokok: ['Telling time on the hour and half hour', 'Daily school timetable'], semester: 2 },
        { no: 7, bab: 'Unit 7: Wild Animals at the Zoo', materi_pokok: ['Lion, elephant, tiger, monkey, snake', 'Describing wild animals'], semester: 2 },
        { no: 8, bab: 'Unit 8: Delicious Indonesian Food', materi_pokok: ['Bakso, sate, gado-gado, nasi goreng', 'Ordering food politely'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa My Next Words Grade 4 (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Unit 1: What Are You Doing in the Kitchen?', materi_pokok: ['Actions at home in present continuous', 'Cooking and cleaning verbs'], semester: 1 },
        { no: 2, bab: 'Unit 2: There Are 67 English Books', materi_pokok: ['Numbers 21 to 100', 'Counting objects in library and school'], semester: 1 },
        { no: 3, bab: 'Unit 3: My Living Room Is Clean', materi_pokok: ['Adjectives of house condition (clean, tidy, spacious)', 'Parts of furniture'], semester: 1 },
        { no: 4, bab: 'Unit 4: Cici Cooks in the Kitchen', materi_pokok: ['Simple present tense with he/she', 'Daily chores at home'], semester: 1 },
        { no: 5, bab: 'Unit 5: Where Is the School Canteen?', materi_pokok: ['School locations and directions (next to, opposite, beside)'], semester: 2 },
        { no: 6, bab: 'Unit 6: The Stove Is in the Kitchen', materi_pokok: ['Kitchen and bathroom appliances', 'Prepositions of place'], semester: 2 },
        { no: 7, bab: 'Unit 7: I Can Make a Paper Crane', materi_pokok: ['Modal verb: can / cannot', 'Handicraft instructions'], semester: 2 },
        { no: 8, bab: 'Unit 8: Be on Time!', materi_pokok: ['Telling time: a quarter past/to, half past', 'Daily timetable'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa English for Changes: My Next Words Grade 5 (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Unit 1: What a Delicious Mango!', materi_pokok: ['Taste words (sweet, sour, salty, bitter)', 'Expressing food taste'], semester: 1 },
        { no: 2, bab: 'Unit 2: I Want an Ice Cream Cone', materi_pokok: ['Quantifiers of food and drink (a bottle, a bar, a slice)', 'Ordering foods'], semester: 1 },
        { no: 3, bab: 'Unit 3: How Much Is It?', materi_pokok: ['Numbers 1,000 - 100,000', 'Asking price & Indonesian rupiah currency'], semester: 1 },
        { no: 4, bab: 'Unit 4: I Have a Stomachache', materi_pokok: ['Names of health problems & illness', 'Expressing body condition'], semester: 1 },
        { no: 5, bab: 'Unit 5: What A Nice Skirt!', materi_pokok: ['Names of clothes and accessories', 'Giving compliments'], semester: 2 },
        { no: 6, bab: 'Unit 6: Parts of Our Body That Work Together', materi_pokok: ['Body parts and their functions', 'Descriptive paragraph'], semester: 2 },
        { no: 7, bab: 'Unit 7: How Tall Are You?', materi_pokok: ['Comparative adjectives (-er, more)', 'Comparing people and animals'], semester: 2 },
        { no: 8, bab: 'Unit 8: The Giraffe Is the Tallest', materi_pokok: ['Superlative adjectives (-est, the most)', 'Animal characteristics'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa My Next Words Grade 6 (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Unit 1: I Visited Borobudur Temple Yesterday', materi_pokok: ['Simple past tense regular & irregular verbs', 'Holiday experiences'], semester: 1 },
        { no: 2, bab: 'Unit 2: We Were in the Library', materi_pokok: ['Past tense of to be: was / were', 'Past locations and activities'], semester: 1 },
        { no: 3, bab: 'Unit 3: Where Is the Post Office?', materi_pokok: ['Giving directions: turn left, turn right, go straight', 'Public places'], semester: 1 },
        { no: 4, bab: 'Unit 4: How Did You Feel?', materi_pokok: ['Expressing feelings (excited, nervous, proud, happy)'], semester: 1 },
        { no: 5, bab: 'Unit 5: What Will You Be in the Future?', materi_pokok: ['Future aspirations with will', 'Dream professions (doctor, pilot, scientist)'], semester: 2 },
        { no: 6, bab: 'Unit 6: Famous Heroes in Indonesia', materi_pokok: ['Biographies of national heroes in simple past', 'Historical events'], semester: 2 },
        { no: 7, bab: 'Unit 7: Save Our Earth!', materi_pokok: ['Environmental imperatives', 'Recycling and reducing waste'], semester: 2 },
        { no: 8, bab: 'Unit 8: Our Graduation Day', materi_pokok: ['School memories', 'Writing a simple farewell letter to teachers/friends'], semester: 2 }
      ]
    }
  },
  'seni rupa': {
    '1': {
      judul: 'Buku Siswa Seni Rupa Kelas I (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Mengenal Garis Lurus dan Lengkung', materi_pokok: ['Macam-macam garis di alam', 'Menggambar ekspresi dengan garis'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mengenal Bentuk Geometris Sederhana', materi_pokok: ['Bentuk lingkaran, segitiga, persegi', 'Menyusun bentuk menjadi gambar'], semester: 1 },
        { no: 3, bab: 'Bab 3: Eksplorasi Warna Primer', materi_pokok: ['Warna merah, kuning, biru', 'Mewarnai objek favorit'], semester: 1 },
        { no: 4, bab: 'Bab 4: Mengenal Tekstur Alami Sekitar', materi_pokok: ['Meraba daun, batu, kayu', 'Teknik menggosok tekstur koin dan daun'], semester: 1 },
        { no: 5, bab: 'Bab 5: Membuat Karya Kolase Kertas', materi_pokok: ['Merobek dan menempel kertas warna', 'Membentuk gambar buah dan bunga'], semester: 2 },
        { no: 6, bab: 'Bab 6: Membentuk Plastisin / Tanah Liat', materi_pokok: ['Memilin, memijat bahan lunak', 'Membuat miniatur hewan sederhana'], semester: 2 },
        { no: 7, bab: 'Bab 7: Merancang Kartu Ucapan Kreatif', materi_pokok: ['Menghias kartu dengan gambar', 'Apresiasi kepada keluarga'], semester: 2 },
        { no: 8, bab: 'Bab 8: Pameran Karya Seni Kelas', materi_pokok: ['Menata karya di dinding kelas', 'Menceritakan karya sendiri kepada teman'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Siswa Seni Rupa Kelas II (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Eksplorasi Warna Sekunder', materi_pokok: ['Pencampuran warna primer menjadi oranye, hijau, ungu'], semester: 1 },
        { no: 2, bab: 'Bab 2: Menggambar Pola Berulang', materi_pokok: ['Pola garis dan bidang teratur', 'Menghias pembungkus buku'], semester: 1 },
        { no: 3, bab: 'Bab 3: Menggambar Ekspresif Rumah dan Lingkungan', materi_pokok: ['Proporsi bangunan rumah', 'Pemandangan sekitar tempat tinggal'], semester: 1 },
        { no: 4, bab: 'Bab 4: Cetak Tinggi Sederhana dengan Bahan Alami', materi_pokok: ['Cetak cap pelepah pisang dan daun', 'Pola hias taplak meja kertas'], semester: 1 },
        { no: 5, bab: 'Bab 5: Membentuk Hewan dari Bahan Lunak', materi_pokok: ['Plastisin bentuk fauna laut dan darat', 'Detail tekstur sisik dan bulu'], semester: 2 },
        { no: 6, bab: 'Bab 6: Kolase Biji-Bijian Alami', materi_pokok: ['Memanfaatkan biji jagung, kacang hijau, beras', 'Pola mozaik hewan'], semester: 2 },
        { no: 7, bab: 'Bab 7: Membuat Boneka Jari dari Kain Perca', materi_pokok: ['Menggunting dan menempel kain perca', 'Karakter tokoh cerita anak'], semester: 2 },
        { no: 8, bab: 'Bab 8: Apresiasi dan Galeri Karya Seni Kelas', materi_pokok: ['Memberikan tanggapan positif karya teman', 'Refleksi karya seni'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Siswa Seni Rupa Kelas III (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Eksplorasi Garis dan Warna Kontras', materi_pokok: ['Warna kontras komplementer', 'Komposisi dinamis garis'], semester: 1 },
        { no: 2, bab: 'Bab 2: Tekstur Nyata dan Tekstur Semu', materi_pokok: ['Membedakan tekstur raba dan visual', 'Menggambar ilusi tekstur'], semester: 1 },
        { no: 3, bab: 'Bab 3: Menggambar Alam Bawah Laut Nusantara', materi_pokok: ['Keindahan terumbu karang dan ikan', 'Teknik gradasi krayon'], semester: 1 },
        { no: 4, bab: 'Bab 4: Mozaik Kertas Warna Bergradasi', materi_pokok: ['Teknik potongan geometris kertas', 'Komposisi warna gradasi'], semester: 1 },
        { no: 5, bab: 'Bab 5: Seni Meronce Manik dan Bahan Alam', materi_pokok: ['Pola ritme ronce gantungan', 'Penggunaan biji dan sedotan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Membuat Topeng Kertas Kreatif', materi_pokok: ['Mendesain karakter ekspresi wajah topeng', 'Teknik gunting dan lipat 3D'], semester: 2 },
        { no: 7, bab: 'Bab 7: Komposisi Keseimbangan Simetris dan Asimetris', materi_pokok: ['Keseimbangan visual karya dua dimensi', 'Harmoni bentuk'], semester: 2 },
        { no: 8, bab: 'Bab 8: Pameran Seni dan Apresiasi Karya Nusantara', materi_pokok: ['Kurasi karya kelompok', 'Mengenal ragam kriya daerah nusantara'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Siswa Seni Rupa Kelas IV (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Menggambar Proporsi Benda Sekitar', materi_pokok: ['Bentuk silindris dan kubistis', 'Ketepatan ukuran dan perbandingan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Prinsip Gelap Terang dan Bayangan', materi_pokok: ['Teknik arsir pensil', 'Arah jatuhnya cahaya dan bayangan benda'], semester: 1 },
        { no: 3, bab: 'Bab 3: Motif Hias Flora dan Fauna Nusantara', materi_pokok: ['Ragam hias batik tradisional', 'Stilisasi bentuk flora fauna'], semester: 1 },
        { no: 4, bab: 'Bab 4: Karya Seni Kolase dan Montase Foto', materi_pokok: ['Menggabungkan gambar majalah/foto', 'Narasi visual tematik lingkungan'], semester: 1 },
        { no: 5, bab: 'Bab 5: Seni Patung Kertas dan Kardus Bekas', materi_pokok: ['Konstruksi 3 dimensi dari kardus', 'Bentuk arsitektur miniatur'], semester: 2 },
        { no: 6, bab: 'Bab 6: Tipografi dan Desain Huruf Kreatif', materi_pokok: ['Membuat font huruf dekoratif', 'Hiasan kaligrafi dan lettering'], semester: 2 },
        { no: 7, bab: 'Bab 7: Merancang Poster Peduli Lingkungan', materi_pokok: ['Kombinasi slogan dan ilustrasi persuasif', 'Tata letak (layout) seimbang'], semester: 2 },
        { no: 8, bab: 'Bab 8: Mini Galeri Seni Sekolah', materi_pokok: ['Label identitas karya seni', 'Kritik seni santun dan apresiasi'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Siswa Seni Rupa Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Mengenal Unsur dan Prinsip Seni Rupa Sekitar Kita', materi_pokok: ['Garis, bidang, dan warna', 'Prinsip ritme dan pola berulang'], semester: 1 },
        { no: 2, bab: 'Bab 2: Menggambar Prinsip Ritme dan Pola Ragam Hias', materi_pokok: ['Motif hias nusantara', 'Pola simetris dan asimetris'], semester: 1 },
        { no: 3, bab: 'Bab 3: Mengenal Ikatan dan Simpul (Kriya)', materi_pokok: ['Teknik dasar simpul makrame', 'Membuat gantungan kunci atau gelang'], semester: 1 },
        { no: 4, bab: 'Bab 4: Membuat Karya Seni Anyaman', materi_pokok: ['Anyaman tunggal dan ganda', 'Eksplorasi bahan kertas atau bambu'], semester: 1 },
        { no: 5, bab: 'Bab 5: Mengenal Ragam Warna dan Proporsi Gambar', materi_pokok: ['Warna komplementer dan analogus', 'Teknik gradasi warna'], semester: 2 },
        { no: 6, bab: 'Bab 6: Membuat Karya Relief Sederhana', materi_pokok: ['Bahan plastisin atau bubur kertas', 'Karya bentuk timbul fauna/flora'], semester: 2 },
        { no: 7, bab: 'Bab 7: Mendesain Poster Edukasi Lingkungan', materi_pokok: ['Kombinasi gambar dan slogan', 'Tipografi kreatif yang komunikatif'], semester: 2 },
        { no: 8, bab: 'Bab 8: Merancang Pameran Mini Kelas', materi_pokok: ['Menata karya seni visual', 'Apresiasi dan refleksi karya teman'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa Seni Rupa Kelas VI (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Menggambar Perspektif Satu Titik Hilang', materi_pokok: ['Garis cakrawala (horizon)', 'Titik hilang dan kedalaman ruang visual'], semester: 1 },
        { no: 2, bab: 'Bab 2: Ragam Hias Geometris Nusantara', materi_pokok: ['Motif Toraja, Dayak, dan Kawung', 'Pewarnaan harmonis motif etnik'], semester: 1 },
        { no: 3, bab: 'Bab 3: Kriya Tekstil Celup Ikat (Jumputan)', materi_pokok: ['Teknik mengikat kelereng/karet pada kain', 'Pencelupan pewarna tekstil'], semester: 1 },
        { no: 4, bab: 'Bab 4: Seni Grafis Cetak Tinggi dengan Sablon Sederhana', materi_pokok: ['Membuat klise cetak karet/kayu', 'Mencetak berulang di media kertas/kain'], semester: 1 },
        { no: 5, bab: 'Bab 5: Mengolah Limbah Plastik Menjadi Karya Estetis', materi_pokok: ['Upcycling botol dan kantong plastik', 'Karya instalasi ramah lingkungan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Desain Kemasan Produk Lokal Kreatif', materi_pokok: ['Jaring-jaring wadah kemasan', 'Ilustrasi merk dan daya tarik visual'], semester: 2 },
        { no: 7, bab: 'Bab 7: Menggambar Ilustrasi Komik Edukasi', materi_pokok: ['Panel komik dan balon kata', 'Karakterisasi tokoh cerita edukatif'], semester: 2 },
        { no: 8, bab: 'Bab 8: Manajemen Pameran Seni Rupa Sekolah', materi_pokok: ['Panitia pameran, penataan tata cahaya', 'Buku tamu dan katalog pameran'], semester: 2 }
      ]
    }
  },
  'koding dan kecerdasan artifisial': {
    '5': {
      judul: 'Buku Siswa Koding dan Kecerdasan Artifisial Kelas V (Kurikulum Merdeka)',
      chapters: [
        { no: 1, bab: 'Bab 1: Berpikir Komputasional dalam Keseharian', materi_pokok: ['Dekomposisi masalah', 'Pengenalan pola', 'Abstraksi dan algoritma'], semester: 1 },
        { no: 2, bab: 'Bab 2: Pemrograman Visual Menggunakan Blok (Scratch)', materi_pokok: ['Antarmuka Scratch', 'Membuat sprite bergerak', 'Blok event dan loop'], semester: 1 },
        { no: 3, bab: 'Bab 3: Logika dan Percabangan Sederhana', materi_pokok: ['Kondisional if-then', 'Interaksi sprite dengan keyboard/mouse'], semester: 1 },
        { no: 4, bab: 'Bab 4: Literasi Komputer dan Perangkat Digital', materi_pokok: ['Perangkat keras (CPU, RAM, input/output)', 'Jaringan internet dan peramban web'], semester: 1 },
        { no: 5, bab: 'Bab 5: Mengenal Kecerdasan Artifisial (AI)', materi_pokok: ['Konsep mesin cerdas vs konvensional', 'Contoh AI dalam kehidupan nyata'], semester: 2 },
        { no: 6, bab: 'Bab 6: Bagaimana AI Belajar dari Data?', materi_pokok: ['Data latih (training data)', 'Pengenalan pola gambar dan suara'], semester: 2 },
        { no: 7, bab: 'Bab 7: Etika dan Keamanan Berteknologi AI', materi_pokok: ['Kejujuran akademik', 'Perlindungan privasi digital', 'Empati di dunia digital'], semester: 2 },
        { no: 8, bab: 'Bab 8: Proyek Mini Animasi / Game Cerdas', materi_pokok: ['Merancang ide game/animasi interaktif', 'Uji coba dan presentasi karya'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Siswa Koding dan Kecerdasan Artifisial Kelas VI (Kurikulum Merdeka)',
      chapters: [
        { no: 1, bab: 'Bab 1: Algoritma Pemecahan Masalah Kompleks', materi_pokok: ['Flowchart / diagram alir keputusan', 'Optimasi langkah komputasi'], semester: 1 },
        { no: 2, bab: 'Bab 2: Variabel dan Operator Logika Boolean', materi_pokok: ['Menyimpan skor game dengan variabel', 'Operator perbandingan dan logika AND/OR'], semester: 1 },
        { no: 3, bab: 'Bab 3: Pemrograman Proyek Game Interaktif Scratch', materi_pokok: ['Collision detection (tabrakan sprite)', 'Sound effects dan animasi game over'], semester: 1 },
        { no: 4, bab: 'Bab 4: Konsep Basis Data dan Pengolahan Informasi', materi_pokok: ['Tabel data sederhana', 'Penyaringan dan pencarian data digital'], semester: 1 },
        { no: 5, bab: 'Bab 5: Mengenal Model Machine Learning Sederhana', materi_pokok: ['Klasifikasi citra menggunakan Teachable Machine', 'Model deteksi suara'], semester: 2 },
        { no: 6, bab: 'Bab 6: Integrasi Model AI ke dalam Pemrograman Scratch', materi_pokok: ['Extension AI di Scratch', 'Game interaktif dengan webcam / sensor gerak'], semester: 2 },
        { no: 7, bab: 'Bab 7: Keamanan Siber dan Etika AI Generatif', materi_pokok: ['Mengenal hoax dan deepfake', 'Etika penggunaan prompt AI secara bertanggung jawab'], semester: 2 },
        { no: 8, bab: 'Bab 8: Proyek Solusi Digital untuk Lingkungan Sekolah', materi_pokok: ['Aplikasi smart classroom atau pemilah sampah digital', 'Gelar karya inovasi digital'], semester: 2 }
      ]
    }
  },
  'b.sunda': {
    '1': {
      judul: 'Buku Pangrumat Basa Sunda Pikeun Murid SD Kelas I (Disdik Jabar)',
      chapters: [
        { no: 1, bab: 'Bab 1: Diri Kuring', materi_pokok: ['Ngaran bagean awak dina basa Sunda', 'Kecap pangwilujeng', 'Sora basa Sunda'], semester: 1 },
        { no: 2, bab: 'Bab 2: Karesep Kuring', materi_pokok: ['Rupa-rupa karesep barudak', 'Maca gambar kecap'], semester: 1 },
        { no: 3, bab: 'Bab 3: Kagiatan Kuring', materi_pokok: ['Kagiatan sapopoe di imah jeung sakola', 'Tatakrama basajan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Kulawarga Kuring', materi_pokok: ['Sebutan pancakaki kulawarga (bapa, ema, lanceuk, adi)'], semester: 1 },
        { no: 5, bab: 'Bab 5: Pangalaman Kuring', materi_pokok: ['Pangalaman pikaresepeun', 'Kakawihan oray-orayan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Lingkungan Sabudeureun', materi_pokok: ['Ngaran tutuwuhan jeung sasatoan sabudeureun'], semester: 2 },
        { no: 7, bab: 'Bab 7: Benda, Sato, jeung Tutuwuhan', materi_pokok: ['Ngagolongkeun rupa-rupa barang jeung sora sasatoan'], semester: 2 },
        { no: 8, bab: 'Bab 8: Kajadian Alam', materi_pokok: ['Usum hujan jeung usum halodo', 'Kecap kaayaan'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Pangrumat Basa Sunda Pikeun Murid SD Kelas II (Disdik Jabar)',
      chapters: [
        { no: 1, bab: 'Bab 1: Hirup Rukun', materi_pokok: ['Hirup sauyunan jeung babaturan', 'Kakawihan Prang-pring'], semester: 1 },
        { no: 2, bab: 'Bab 2: Bermain di Lingkungan Kuring', materi_pokok: ['Kaulinan empet-empetan', 'Kecap barang jeung pagawéan'], semester: 1 },
        { no: 3, bab: 'Bab 3: Tugas Sapopoe', materi_pokok: ['Mantuan kolot di imah', 'Kalimah wawaran basajan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Miara Sato jeung Tutuwuhan', materi_pokok: ['Ngarawat ucing jeung pepelakan', 'Istilah anak sato'], semester: 1 },
        { no: 5, bab: 'Bab 5: Hirup Beresih tur Sehat', materi_pokok: ['Karesikan awak jeung pakarangan imah'], semester: 2 },
        { no: 6, bab: 'Bab 6: Cai, Bumi, jeung Panonpoe', materi_pokok: ['Mangpaat cai jeung panonpoe keur kahirupan'], semester: 2 },
        { no: 7, bab: 'Bab 7: Miara Kasalametan di Jalan', materi_pokok: ['Rambu kasalametan leumpang', 'Kalimah panyaram'], semester: 2 },
        { no: 8, bab: 'Bab 8: Kasenian Daerah', materi_pokok: ['Mengenal waditra kendang jeung suling Sunda'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Pangrumat Basa Sunda Pikeun Murid SD Kelas III (Disdik Jabar)',
      chapters: [
        { no: 1, bab: 'Bab 1: Miara Sasatoan jeung Tutuwuhan', materi_pokok: ['Teks pedaran ngingu lauk', 'Kandang sato jeung tutuwuhan hias'], semester: 1 },
        { no: 2, bab: 'Bab 2: Pangalaman Anu Matak Deungdeuleueun', materi_pokok: ['Nuliskeun pangalaman pikaseurieun atawa pikasediheun'], semester: 1 },
        { no: 3, bab: 'Bab 3: Usum-Usuman di Tatar Sunda', materi_pokok: ['Usum mamareng, dangdangrat, ngijih', 'Paribasa patali jeung usum'], semester: 1 },
        { no: 4, bab: 'Bab 4: Gotong Royong', materi_pokok: ['Kagiatan babarengan di lembur', 'Paguneman gotong royong'], semester: 1 },
        { no: 5, bab: 'Bab 5: Kaulinan Tradisional Barudak', materi_pokok: ['Paciwit-ciwit lutung, congklak, galah asin', 'Kawih kaulinan'], semester: 2 },
        { no: 6, bab: 'Bab 6: Karesikan Lingkungan Sakola', materi_pokok: ['Piket kelas jeung miara taman sakola'], semester: 2 },
        { no: 7, bab: 'Bab 7: Karajinan Tradisional Sunda', materi_pokok: ['Anyaman boboko, kipas awi', 'Alat-alat dapur Sunda'], semester: 2 },
        { no: 8, bab: 'Bab 8: Kasihatan Awak', materi_pokok: ['Kadaharan tradisional sehat (leueuteun jeung opieun)'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Pangrumat Basa Sunda Pikeun Murid SD Kelas IV (Disdik Jabar)',
      chapters: [
        { no: 1, bab: 'Bab 1: Endahna Kebersamaan', materi_pokok: ['Hirup sauyunan dina bédana suku jeung agama', 'Pupuh Pocung'], semester: 1 },
        { no: 2, bab: 'Bab 2: Hemat Energi', materi_pokok: ['Teks instruksi ngahémat listrik jeung cai', 'Kalimah parentah'], semester: 1 },
        { no: 3, bab: 'Bab 3: Peduli Ka Makhluk Hirup', materi_pokok: ['Ngalestarikeun sato langka di Jawa Barat', 'Wawancara patugas taman safari'], semester: 1 },
        { no: 4, bab: 'Bab 4: Rupa-Rupa Pagawéan (Profesi)', materi_pokok: ['Pagawéan patani, pamayang, panday beusi', 'Istilah pagawéan'], semester: 1 },
        { no: 5, bab: 'Bab 5: Ngahargaan Jasa Pahlawan Sunda', materi_pokok: ['Biografi Otto Iskandardinata, Dewi Sartika'], semester: 2 },
        { no: 6, bab: 'Bab 6: Cita-Cita Kuring', materi_pokok: ['Sajak Sunda ngeunaan cita-cita', 'Maca sajak kalawan intonasi merenah'], semester: 2 },
        { no: 7, bab: 'Bab 7: Kadaharan Khas Jawa Barat', materi_pokok: ['Peuyeum, surabi, comro, colenak', 'Cara nyieun kadaharan Sunda'], semester: 2 },
        { no: 8, bab: 'Bab 8: Daerah Wisata di Tatar Sunda', materi_pokok: ['Laporan lalampahan wisata alam Situ Panjalu/Tangkuban Parahu'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Pangrumat Basa Sunda Pikeun Murid SD Kelas V (Disdik Jabar)',
      chapters: [
        { no: 1, bab: 'Bab 1: Kaulinan Barudak', materi_pokok: ['Rupa-rupa kaulinan barudak lembur', 'Kakawihan barudak', 'Tatakrama basa Sunda'], semester: 1 },
        { no: 2, bab: 'Bab 2: Kajadian Alam', materi_pokok: ['Maca warta kajadian alam', 'Istilah kajadian alam (lini, tsunami, caah)', 'Kalimah barang'], semester: 1 },
        { no: 3, bab: 'Bab 3: Hirup Rukun jeung Tatangga', materi_pokok: ['Teks paguneman sapopoé', 'Undak-usuk basa loma jeung lemes', 'Kalimah paménta'], semester: 1 },
        { no: 4, bab: 'Bab 4: Miara Kaséhatan', materi_pokok: ['Poko pikiran carita kasehatan', 'Istilah kaséhatan jeung ubar tradisional', 'Kalimah wawaran'], semester: 1 },
        { no: 5, bab: 'Bab 5: Pangalaman Pribadi', materi_pokok: ['Nuliskeun pangalaman anu pikaresepeun', 'Kalimah pagawéan', 'Gaya basa ngupamakeun'], semester: 2 },
        { no: 6, bab: 'Bab 6: Cinta Lemah Cai', materi_pokok: ['Sajarah tempat jeung pahlawan Sunda', 'Nembangkeun pupuh Kinanti', 'Paribasa Sunda'], semester: 2 },
        { no: 7, bab: 'Bab 7: Wirausaha jeung Kasab', materi_pokok: ['Wawancara padagang lokal', 'Istilah perdagangan tradisional', 'Nulis laporan wawancara'], semester: 2 },
        { no: 8, bab: 'Bab 8: Kasenian Tradisional Sunda', materi_pokok: ['Waditra musik Sunda (angklung, degung)', 'Maca carita pondok Sunda', 'Nyusun rangkuman carita'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Pangrumat Basa Sunda Pikeun Murid SD Kelas VI (Disdik Jabar)',
      chapters: [
        { no: 1, bab: 'Bab 1: Kasalametan Hirup dina Parobahan Jaman', materi_pokok: ['Teks narasi pangaruh téknologi modern', 'Undak-usuk basa Sunda luhur'], semester: 1 },
        { no: 2, bab: 'Bab 2: Persatuan dina Bédana Pandangan', materi_pokok: ['Maca teks biografi tokoh Sunda nasional', 'Kalimah résiprok'], semester: 1 },
        { no: 3, bab: 'Bab 3: Tokoh Penemu jeung Inovator Sunda', materi_pokok: ['Karya téknologi putra daerah Jabar', 'Gagasan utama wacana'], semester: 1 },
        { no: 4, bab: 'Bab 4: Globalisasi jeung Budaya Sunda', materi_pokok: ['Mertahankeun jatidiri Sunda di era global', 'Debat basajan dina basa Sunda'], semester: 1 },
        { no: 5, bab: 'Bab 5: Wirausaha Mandiri Parahyangan', materi_pokok: ['Laporan kagiatan usaha karajinan kulit, awi, karamik'], semester: 2 },
        { no: 6, bab: 'Bab 6: Miara Lingkungan Alam Tatar Sunda', materi_pokok: ['Kritik sosial ngaliwatan carpon Sunda', 'Konservasi leuweung titipan'], semester: 2 },
        { no: 7, bab: 'Bab 7: Kasenian Pupuh Sinom jeung Asmarandana', materi_pokok: ['Guru lagu jeung guru wilangan', 'Nembangkeun pupuh sacara tartib'], semester: 2 },
        { no: 8, bab: 'Bab 8: Biantara Pamitan Sakola', materi_pokok: ['Naskah biantara (pidato) paturay tineung kelas 6', 'Praktek biantara hareupeun kelas'], semester: 2 }
      ]
    }
  },
  'tatanen di bale atikan': {
    '1': {
      judul: 'Buku Tatanen di Bale Atikan (TdBA) SD Kelas I (Disdik Purwakarta)',
      chapters: [
        { no: 1, bab: 'Bab 1: Mengenal Tanaman di Kebun Sekolah', materi_pokok: ['Mengenal bagian tanaman (akar, batang, daun)', 'Menyiram tanaman dengan riang'], semester: 1 },
        { no: 2, bab: 'Bab 2: Merawat Tanah yang Subur', materi_pokok: ['Merasakan tanah gembur', 'Menghilangkan kerikil dan gulma'], semester: 1 },
        { no: 3, bab: 'Bab 3: Menanam Biji Kacang dan Jagung', materi_pokok: ['Menyemai benih dalam pot sabut kelapa', 'Mengamati tunas pertama'], semester: 1 },
        { no: 4, bab: 'Bab 4: Hewan Sahabat Kebun', materi_pokok: ['Cacing tanah penyubur tanah', 'Kupu-kupu pembantu penyerbukan'], semester: 1 },
        { no: 5, bab: 'Bab 5: Tanaman Sayur Kesukaanku', materi_pokok: ['Mengenal sayur kangkung dan bayam', 'Manfaat makan sayur segar'], semester: 2 },
        { no: 6, bab: 'Bab 6: Air Sumber Kehidupan Tanaman', materi_pokok: ['Menghemat air untuk menyiram tanaman', 'Membuat botol siram daur ulang'], semester: 2 },
        { no: 7, bab: 'Bab 7: Panen Sayur Bersama Teman', materi_pokok: ['Memetik sayur kangkung bersama guru', 'Mencuci hasil panen'], semester: 2 },
        { no: 8, bab: 'Bab 8: Menikmati Sup Sayur Segar Kebun', materi_pokok: ['Makan bersama hasil kebun kelas', 'Bersyukur atas karunia alam'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Tatanen di Bale Atikan (TdBA) SD Kelas II (Disdik Purwakarta)',
      chapters: [
        { no: 1, bab: 'Bab 1: Niti Harti Mengenal Benih Unggul', materi_pokok: ['Membedakan benih sayur daun dan buah', 'Karakter peduli tanaman'], semester: 1 },
        { no: 2, bab: 'Bab 2: Membuat Media Tanam Organik', materi_pokok: ['Mencampur tanah humus, sekam bakar, dan pupuk kandang'], semester: 1 },
        { no: 3, bab: 'Bab 3: Menanam Sayuran Organik di Polybag', materi_pokok: ['Teknik menanam sawi dan pakcoy', 'Penyiraman pagi dan sore'], semester: 1 },
        { no: 4, bab: 'Bab 4: Memilah Sampah Daun Kering', materi_pokok: ['Mengumpulkan dedaunan kebun', 'Membuat tumpukan kompos sederhana'], semester: 1 },
        { no: 5, bab: 'Bab 5: Tanaman Obat Keluarga (TOGA) di Sekolah', materi_pokok: ['Mengenal jahe, kunyit, kencur, sereh', 'Khasiat tanaman herbal'], semester: 2 },
        { no: 6, bab: 'Bab 6: Mengendalikan Hama dengan Ramah Lingkungan', materi_pokok: ['Membersihkan ulat secara manual', 'Pengenalan pestisida nabati bawang'], semester: 2 },
        { no: 7, bab: 'Bab 7: Panen dan Menimbang Hasil Sayuran', materi_pokok: ['Teknik pemotongan daun pakcoy', 'Belajar menimbang panen'], semester: 2 },
        { no: 8, bab: 'Bab 8: Kreasi Salad Buah dan Sayur Sehat', materi_pokok: ['Menyajikan makanan sehat tanpa pengawet', 'Refleksi Niti Surti'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Tatanen di Bale Atikan (TdBA) SD Kelas III (Disdik Purwakarta)',
      chapters: [
        { no: 1, bab: 'Bab 1: Ekosistem Kebun Sekolah Alami', materi_pokok: ['Interaksi tanah, air, udara, dan mikroorganisme', 'Prinsip keselarasan alam'], semester: 1 },
        { no: 2, bab: 'Bab 2: Pembuatan Kompos Organik Cair (POC) Sederhana', materi_pokok: ['Fermentasi air cucian beras dan molase', 'Aplikasi POC pada tanaman'], semester: 1 },
        { no: 3, bab: 'Bab 3: Budidaya Tanaman Buah Sayur (Tomat & Terung)', materi_pokok: ['Pemindahan bibit semai ke bedengan', 'Pemasangan ajir bambu'], semester: 1 },
        { no: 4, bab: 'Bab 4: Konservasi Air Hujan untuk Kebun', materi_pokok: ['Membuat lubang biopori sederhana', 'Menampung air hujan alami'], semester: 1 },
        { no: 5, bab: 'Bab 5: Mengenal Tanaman Aromatik Pengusir Hama', materi_pokok: ['Bunga marigold, kemangi, mint', 'Sistem tanam pendamping (companion planting)'], semester: 2 },
        { no: 6, bab: 'Bab 6: Perawatan Rutin dan Pemangkasan Ranting', materi_pokok: ['Pruning daun kering', 'Menjaga aerasi tanah kebun'], semester: 2 },
        { no: 7, bab: 'Bab 7: Panen Raya Tomat dan Cabai Sekolah', materi_pokok: ['Kriteria kematangan buah tomat', 'Penyortiran grade kualitas hasil panen'], semester: 2 },
        { no: 8, bab: 'Bab 8: Pasar Cilik TdBA Sekolah', materi_pokok: ['Menjual hasil kebun ke warga sekolah', 'Edukasi wirausaha ramah lingkungan'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Tatanen di Bale Atikan (TdBA) SD Kelas IV (Disdik Purwakarta)',
      chapters: [
        { no: 1, bab: 'Bab 1: Niti Harti dan Niti Surti Permakultur', materi_pokok: ['Prinsip etika bumi permakultur', 'Zonasi kebun sekolah terencana'], semester: 1 },
        { no: 2, bab: 'Bab 2: Manajemen Limbah Kantin Organik', materi_pokok: ['Pengolahan sisa makanan kantin menjadi pupuk', 'Komposter takakura'], semester: 1 },
        { no: 3, bab: 'Bab 3: Budidaya Vertikultur Hemat Lahan', materi_pokok: ['Merakit pipa paralon dan botol bekas', 'Menanam selada dan seledri'], semester: 1 },
        { no: 4, bab: 'Bab 4: Budidaya Ikan dan Sayur (Akuaponik Mini)', materi_pokok: ['Hubungan simbiosis ikan lele/nila dengan kangkung', 'Siklus nutrisi air'], semester: 1 },
        { no: 5, bab: 'Bab 5: Pembuatan Pestisida Nabati Daun Mimba dan Pepaya', materi_pokok: ['Ekstraksi bahan alami pestisida', 'Penyemprotan aman tanpa racun kimia'], semester: 2 },
        { no: 6, bab: 'Bab 6: Konservasi Lahan Kritis Sekitar Sekolah', materi_pokok: ['Penanaman pohon peneduh lokal', 'Pencegahan erosi tanah'], semester: 2 },
        { no: 7, bab: 'Bab 7: Pascapanen dan Pengemasan Higienis', materi_pokok: ['Teknik wrapping ramah lingkungan dengan daun pisang', 'Pemberian label organik'], semester: 2 },
        { no: 8, bab: 'Bab 8: Festival Panen Raya dan Niti Bukti', materi_pokok: ['Pameran inovasi bercocok tanam siswa', 'Refleksi Niti Bukti kebun sekolah'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Pedoman Tatanen di Bale Atikan (TdBA) SD Kelas V (Disdik Purwakarta)',
      chapters: [
        { no: 1, bab: 'Bab 1: Filosofi Panca Niti TdBA', materi_pokok: ['Niti Harti, Surti, Bukti, Bakti, Sajati', 'Karakter peduli lingkungan sekolah'], semester: 1 },
        { no: 2, bab: 'Bab 2: Ekosistem Tanah dan Keanekaragaman Hayati', materi_pokok: ['Struktur tanah subur', 'Mikroorganisme tanah lokal', 'Konservasi air dan tanah'], semester: 1 },
        { no: 3, bab: 'Bab 3: Pengolahan Pupuk Kompos Alami', materi_pokok: ['Pemilahan sampah organik', 'Proses dekomposisi kompos daun', 'Pembuatan Pupuk Organik Cair (POC)'], semester: 1 },
        { no: 4, bab: 'Bab 4: Pembibitan dan Budidaya Tanaman Sayuran', materi_pokok: ['Penyemaian bibit kangkung/bayam/cabai', 'Media tanam organik', 'Pemeliharaan harian'], semester: 1 },
        { no: 5, bab: 'Bab 5: Sistem Pertanian Permakultur Sekolah', materi_pokok: ['Desain bedengan ramah lingkungan', 'Sistem tumpang sari tanaman pendamping'], semester: 2 },
        { no: 6, bab: 'Bab 6: Panen dan Pemanfaatan Hasil Kebun', materi_pokok: ['Teknik pemanenan sayuran yang benar', 'Pascapanen dan penimbangan hasil'], semester: 2 },
        { no: 7, bab: 'Bab 7: Kuliner Olahan Pangan Sehat Bergizi', materi_pokok: ['Memasak olahan hasil panen sayur', 'Kandungan nutrisi sayur organik bagi tubuh'], semester: 2 },
        { no: 8, bab: 'Bab 8: Gelar Karya TdBA dan Refleksi Sajati', materi_pokok: ['Bazaar mini produk panen sekolah', 'Pameran kreasi olahan', 'Refleksi Niti Sajati'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Tatanen di Bale Atikan (TdBA) SD Kelas VI (Disdik Purwakarta)',
      chapters: [
        { no: 1, bab: 'Bab 1: Integrasi Niti Bakti dan Niti Sajati Holistik', materi_pokok: ['Bakti menjaga alam kelestarian lingkungan', 'Kearifan lokal Sunda dalam pertanian'], semester: 1 },
        { no: 2, bab: 'Bab 2: Analisis Kualitas Tanah dan pH Lahan Pertanian', materi_pokok: ['Pengujian keasaman tanah sederhana', 'Pemberian kapur dolomit dan biochar'], semester: 1 },
        { no: 3, bab: 'Bab 3: Rancang Bangun Greenhouse Mini Mandiri', materi_pokok: ['Pengendalian suhu dan kelembaban', 'Sistem irigasi tetes (drip irrigation)'], semester: 1 },
        { no: 4, bab: 'Bab 4: Pertanian Terpadu (Integrated Farming System)', materi_pokok: ['Integrasi ternak kelinci/ayam, kolam ikan, dan kebun sayur'], semester: 1 },
        { no: 5, bab: 'Bab 5: Inovasi Produk Olahan Pangan Herbal Bernilai Tambah', materi_pokok: ['Pembuatan sirup jahe sereh', 'Keripik daun bayam organik higienis'], semester: 2 },
        { no: 6, bab: 'Bab 6: Mitigasi Perubahan Iklim Berbasis Sekolah Hijau', materi_pokok: ['Penghitungan serapan karbon pohon sekolah', 'Pola hidup zero waste'], semester: 2 },
        { no: 7, bab: 'Bab 7: Kewirausahaan Sosial Hasil Kebun (Agri-Preneurship)', materi_pokok: ['Analisis biaya produksi dan laba panen', 'Pemasaran produk ke orang tua siswa'], semester: 2 },
        { no: 8, bab: 'Bab 8: Warisan Kebun Sekolah Lestari untuk Adik Kelas', materi_pokok: ['Panduan perawatan kebun estafet', 'Deklarasi kelestarian lingkungan hidup'], semester: 2 }
      ]
    }
  },
  'akpk': {
    '1': {
      judul: 'Buku Asesmen Karakter Purwakarta (AKPK) Tujuh Poe Atikan Kelas I',
      chapters: [
        { no: 1, bab: 'Bab 1: Ajeg Nusantara - Cinta Benderaku', materi_pokok: ['Hormat bendera Merah Putih', 'Lagu kebangsaan Indonesia Raya'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mapag Buana - Rajin Belajar Membaca', materi_pokok: ['Semangat belajar literasi', 'Mengenal teknologi ramah anak'], semester: 1 },
        { no: 3, bab: 'Bab 3: Maneh - Percaya Diri di Depan Kelas', materi_pokok: ['Berani unjuk bakat', 'Merapikan peralatan sekolah sendiri'], semester: 1 },
        { no: 4, bab: 'Bab 4: Nyanding Rasa - Menyayangi Teman Sebangku', materi_pokok: ['Berbagi bekal dan pensil', 'Kata tolong, maaf, dan terima kasih'], semester: 1 },
        { no: 5, bab: 'Bab 5: Nyucikeun Diri - Berwudhu dan Menjaga Kebersihan', materi_pokok: ['Sholat bersama keluarga', 'Mencuci tangan dan menggosok gigi'], semester: 2 },
        { no: 6, bab: 'Bab 6: Betah di Imah - Sayang Ibu dan Ayah', materi_pokok: ['Membantu merapikan kasur', 'Bermain gembira di rumah'], semester: 2 },
        { no: 7, bab: 'Bab 7: Reureuh - Olahraga Pagi Bersama Keluarga', materi_pokok: ['Jalan santai hari Minggu', 'Istirahat dan tidur tepat waktu'], semester: 2 },
        { no: 8, bab: 'Bab 8: Pembiasaan 7 Poe Atikan Purwakarta Istimewa', materi_pokok: ['Jurnal harian karakter anak mandiri', 'Penilaian bintang karakter'], semester: 2 }
      ]
    },
    '2': {
      judul: 'Buku Asesmen Karakter Purwakarta (AKPK) Tujuh Poe Atikan Kelas II',
      chapters: [
        { no: 1, bab: 'Bab 1: Ajeg Nusantara - Bangga Bahasa Indonesia', materi_pokok: ['Menggunakan bahasa Indonesia yang baik', 'Mengenal pahlawan daerah'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mapag Buana - Tertarik Sains dan Alam', materi_pokok: ['Eksperimen alam sederhana', 'Membaca buku ensiklopedia anak'], semester: 1 },
        { no: 3, bab: 'Bab 3: Maneh - Disiplin Waktu Belajar', materi_pokok: ['Jadwal belajar harian', 'Menjaga kejujuran saat ujian'], semester: 1 },
        { no: 4, bab: 'Bab 4: Nyanding Rasa - Saling Membantu Teman Kesulitan', materi_pokok: ['Empati dan peduli sosial', 'Menjenguk teman sakit'], semester: 1 },
        { no: 5, bab: 'Bab 5: Nyucikeun Diri - Shadaqah Subuh dan Kebersihan', materi_pokok: ['Infaq Jumat di sekolah', 'Menjaga kebersihan toilet'], semester: 2 },
        { no: 6, bab: 'Bab 6: Betah di Imah - Membantu Orang Tua Memasak', materi_pokok: ['Menyiapkan makanan bersama keluarga', 'Adab makan santun'], semester: 2 },
        { no: 7, bab: 'Bab 7: Reureuh - Menikmati Suasana Alam Akhir Pekan', materi_pokok: ['Rekreasi sederhana', 'Bebas gawai / gadget di hari Minggu'], semester: 2 },
        { no: 8, bab: 'Bab 8: Refleksi Pengamalan Karakter Istimewa', materi_pokok: ['Portofolio pembiasaan', 'Sertifikat karakter teladan'], semester: 2 }
      ]
    },
    '3': {
      judul: 'Buku Asesmen Karakter Purwakarta (AKPK) Tujuh Poe Atikan Kelas III',
      chapters: [
        { no: 1, bab: 'Bab 1: Ajeg Nusantara - Mempelajari Lagu Wajib Nasional', materi_pokok: ['Makna lagu Garuda Pancasila dan Bagimu Negeri'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mapag Buana - Bijak Memakai Perangkat Digital', materi_pokok: ['Batas waktu layar (screen time)', 'Memilih tontonan edukatif'], semester: 1 },
        { no: 3, bab: 'Bab 3: Maneh - Mengembangkan Bakat Seni dan Olahraga', materi_pokok: ['Latihan rutin minat bakat', 'Ketekunan berlatih'], semester: 1 },
        { no: 4, bab: 'Bab 4: Nyanding Rasa - Pelestarian Seni Budaya Sunda', materi_pokok: ['Mengenal pakaian adat Sunda kampret dan kebaya'], semester: 1 },
        { no: 5, bab: 'Bab 5: Nyucikeun Diri - Tadarus dan Pembiasaan Ibadah', materi_pokok: ['Hafalan surah pendek harian', 'Menjaga wudhu'], semester: 2 },
        { no: 6, bab: 'Bab 6: Betah di Imah - Membuat Karya Kerajinan di Rumah', materi_pokok: ['Berkreasi bersama saudara', 'Mengurangi bermain di luar rumah larut'], semester: 2 },
        { no: 7, bab: 'Bab 7: Reureuh - Permainan Tradisional Bersama Keluarga', materi_pokok: ['Ulin congklak, dam-daman, bekel', 'Keceriaan keluarga'], semester: 2 },
        { no: 8, bab: 'Bab 8: Asesmen Karakter Diri Berkelanjutan', materi_pokok: ['Refleksi diri dan bimbingan guru kelas'], semester: 2 }
      ]
    },
    '4': {
      judul: 'Buku Asesmen Karakter Purwakarta (AKPK) Tujuh Poe Atikan Kelas IV',
      chapters: [
        { no: 1, bab: 'Bab 1: Ajeg Nusantara - Memaknai Sumpah Pemuda', materi_pokok: ['Sejarah persatuan pemuda bangsa', 'Gotong royong membersihkan monumen'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mapag Buana - Eksplorasi Sains Digital', materi_pokok: ['Literasi pencarian informasi ilmiah', 'Menghindari berita palsu'], semester: 1 },
        { no: 3, bab: 'Bab 3: Maneh - Sikap Mandiri dan Tanggung Jawab', materi_pokok: ['Mengelola uang saku harian', 'Menolak perilaku menyontek'], semester: 1 },
        { no: 4, bab: 'Bab 4: Nyanding Rasa - Solidaritas Kemanusiaan', materi_pokok: ['Aksi galang dana bencana', 'Menolong sesama tanpa pamrih'], semester: 1 },
        { no: 5, bab: 'Bab 5: Nyucikeun Diri - Integritas Moral dan Ibadah', materi_pokok: ['Puasa sunnah Senin Kamis', 'Menjaga lisan dari perkataan kotor'], semester: 2 },
        { no: 6, bab: 'Bab 6: Betah di Imah - Membangun Harmoni Keluarga', materi_pokok: ['Diskusi hangat keluarga malam hari', 'Membantu adik belajar'], semester: 2 },
        { no: 7, bab: 'Bab 7: Reureuh - Membaca Buku Sastra Anak', materi_pokok: ['Menikmati novel anak mendidik', 'Relaksasi pikiran bugar'], semester: 2 },
        { no: 8, bab: 'Bab 8: Portofolio Aksi Karakter Purwakarta', materi_pokok: ['Dokumentasi pembiasaan karakter di buku catatan'], semester: 2 }
      ]
    },
    '5': {
      judul: 'Buku Asesmen Karakter Purwakarta (AKPK) Tujuh Poe Atikan Kelas V',
      chapters: [
        { no: 1, bab: 'Bab 1: Ajeg Nusantara (Senin)', materi_pokok: ['Wawasan kebangsaan dan cinta tanah air', 'Upacara bendera & keteladanan pahlawan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mapag Buana (Selasa)', materi_pokok: ['Wawasan literasi global & teknologi', 'Kesiapan menghadapi era digital cerdas'], semester: 1 },
        { no: 3, bab: 'Bab 3: Maneh (Rabu)', materi_pokok: ['Mengenali potensi diri dan minat bakat', 'Membangun kemandirian belajar di kelas'], semester: 1 },
        { no: 4, bab: 'Bab 4: Nyanding Rasa (Kamis)', materi_pokok: ['Kepekaan rasa dan empati terhadap sesama', 'Pelestarian seni dan budaya kearifan lokal'], semester: 1 },
        { no: 5, bab: 'Bab 5: Nyucikeun Diri (Jumat)', materi_pokok: ['Spiritualitas dan ibadah pembiasaan', 'Kebersihan lahir batin dan sedekah'], semester: 2 },
        { no: 6, bab: 'Bab 6: Betah di Imah (Sabtu)', materi_pokok: ['Ketahanan keluarga & bakti pada orang tua', 'Membantu pekerjaan rumah secara sukarela'], semester: 2 },
        { no: 7, bab: 'Bab 7: Reureuh (Minggu)', materi_pokok: ['Manajemen waktu istirahat berkualitas', 'Olahraga santai dan relaksasi kebugaran'], semester: 2 },
        { no: 8, bab: 'Bab 8: Penerapan Karakter Holistik Purwakarta', materi_pokok: ['Aksi nyata budaya istimewa', 'Evaluasi mandiri pembiasaan 7 Poe Atikan'], semester: 2 }
      ]
    },
    '6': {
      judul: 'Buku Asesmen Karakter Purwakarta (AKPK) Tujuh Poe Atikan Kelas VI',
      chapters: [
        { no: 1, bab: 'Bab 1: Ajeg Nusantara - Bela Negara dan Nasionalisme Unggul', materi_pokok: ['Ketahanan ideologi Pancasila', 'Menjaga persatuan di tengah kebinekaan'], semester: 1 },
        { no: 2, bab: 'Bab 2: Mapag Buana - Keterampilan Abad 21', materi_pokok: ['Kecakapan berpikir kritis, kreatif, kolaboratif, komunikatif'], semester: 1 },
        { no: 3, bab: 'Bab 3: Maneh - Kepemimpinan Diri yang Berintegritas', materi_pokok: ['Menjadi teladan adik kelas', 'Manajemen target masa depan'], semester: 1 },
        { no: 4, bab: 'Bab 4: Nyanding Rasa - Pelestarian Warisan Budaya Purwakarta', materi_pokok: ['Apresiasi arsitektur suhunan Julang Ngapak, keramik Plered'], semester: 1 },
        { no: 5, bab: 'Bab 5: Nyucikeun Diri - Pemantapan Ibadah dan Tazkiyatun Nafs', materi_pokok: ['Istiqomah dalam ibadah harian', 'Menjauhi perundungan (bullying)'], semester: 2 },
        { no: 6, bab: 'Bab 6: Betah di Imah - Berbakti Penuh pada Ibu Bapak', materi_pokok: ['Doa tulus untuk orang tua', 'Komunikasi santun dalam keluarga'], semester: 2 },
        { no: 7, bab: 'Bab 7: Reureuh - Keseimbangan Jiwa dan Raga', materi_pokok: ['Mindfulness dan rasa syukur', 'Menjaga kesehatan jelang ujian akhir'], semester: 2 },
        { no: 8, bab: 'Bab 8: Mahkota Karakter Purwakarta Istimewa', materi_pokok: ['Kelulusan berkarakter unggul', 'Komitmen pengamalan karakter sepanjang hayat'], semester: 2 }
      ]
    }
  }
};
