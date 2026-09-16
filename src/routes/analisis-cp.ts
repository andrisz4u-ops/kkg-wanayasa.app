import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { getOfficialCP, getOfficialCPElements, cpElementsData, getDynamicCP, getDynamicCPElements, getFaseFromKelas } from '../lib/cp-data';
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
import { generateAnalisisCpDocxBuffer, type AnalisisCpDocxInput } from '../lib/docx/analisis-cp';
import { generateProtaDocxBuffer } from '../lib/docx/prota';
import { generatePromesDocxBuffer } from '../lib/docx/promes';
import { generateKktpDocxBuffer } from '../lib/docx/kktp';
import { getAlokasiWaktuResmi, balanceSemesterJpItems } from '../lib/alokasi-waktu';
import { type AppBindings } from '../types/env';

const analisisCp = new Hono<{ Bindings: AppBindings }>();

// Helper kalkulasi pembagian bab antar semester sesuai aturan pengguna:
// Jika genap (misal 10): 5 di Semester 1, 5 di Semester 2.
// Jika ganjil (misal 9): 5 di Semester 1, 4 di Semester 2 (karena Semester 2 lebih singkat).
export function distributeChaptersToSemesters(chapters: any[]): any[] {
  if (!Array.isArray(chapters) || chapters.length === 0) return [];
  const total = chapters.length;
  const sem1Count = Math.ceil(total / 2);

  return chapters.map((ch, idx) => ({
    ...ch,
    no: ch.no || idx + 1,
    semester: ch.semester ? Number(ch.semester) : (idx < sem1Count ? 1 : 2)
  }));
}

// Database Struktur BAB Standar Buku Teks Resmi Kurikulum Merdeka (Kemendikbudristek)
export const standardCurriculumDatabase: Record<string, Record<string, { judul: string; chapters: any[] }>> = {
  'bahasa indonesia': {
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
    }
  },
  'matematika': {
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
    }
  },
  'pendidikan pancasila': {
    '5': {
      judul: 'Buku Siswa Pendidikan Pancasila Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Pancasila dalam Kehidupanku', materi_pokok: ['Makna sila-sila Pancasila', 'Penerapan nilai Pancasila di rumah & sekolah', 'Gotong royong'], semester: 1 },
        { no: 2, bab: 'Bab 2: Norma dalam Kehidupanku', materi_pokok: ['Macam-macam norma (agama, kesusilaan, kesopanan, hukum)', 'Hak dan kewajiban anak'], semester: 1 },
        { no: 3, bab: 'Bab 3: Jati Diri dan Keberagaman Bangsa Indonesia', materi_pokok: ['Keragaman budaya nusantara', 'Sikap toleransi kebinekaan', 'Pelestarian budaya'], semester: 2 },
        { no: 4, bab: 'Bab 4: Negaraku Indonesia', materi_pokok: ['Wilayah NKRI', 'Persatuan dan kesatuan bangsa', 'Cinta tanah air'], semester: 2 }
      ]
    }
  },
  'pendidikan agama dan budi pekerti': {
    '5': {
      judul: 'Buku Siswa Pendidikan Agama Islam dan Budi Pekerti Kelas V (Kemendikbudristek)',
      chapters: [
        { no: 1, bab: 'Bab 1: Menyayangi Anak Yatim (QS. Al-Ma’un)', materi_pokok: ['Membaca & menghafal QS Al-Maun', 'Pesan pokok QS Al-Maun', 'Menyayangi anak yatim'], semester: 1 },
        { no: 2, bab: 'Bab 2: Lebih Dekat dengan Nama-Nama Allah', materi_pokok: ['Asmaul Husna Al-Qawiyyu', 'Asmaul Husna Al-Qayyum', 'Asmaul Husna Al-Muhyi & Al-Mumit'], semester: 1 },
        { no: 3, bab: 'Bab 3: Aku Anak Saleh Menghargai Keragaman', materi_pokok: ['Keragaman suku & agama manusia', 'Sikap toleransi & saling menghargai'], semester: 1 },
        { no: 4, bab: 'Bab 4: Hidup Lapang dengan Berbagi', materi_pokok: ['Makna zakat fitrah & mal', 'Infak, sedekah, dan hadiah'], semester: 1 },
        { no: 5, bab: 'Bab 5: Meneladani Perjuangan Rasulullah SAW', materi_pokok: ['Peristiwa Fathu Makkah', 'Haji Wada dan pesan terakhir Rasulullah'], semester: 2 },
        { no: 6, bab: 'Bab 6: Hidup Damai dalam Kebersamaan', materi_pokok: ['Mengenal kitab-kitab suci Allah', 'Taurat, Zabur, Injil, Al-Quran'], semester: 2 },
        { no: 7, bab: 'Bab 7: Ketika Hati Bersih dari Sifat Tercela', materi_pokok: ['Menghindari sifat dengki & sombong', 'Menumbuhkan sifat tawadhu'], semester: 2 },
        { no: 8, bab: 'Bab 8: Senangnya Berteman Tanpa Membeda-bedakan', materi_pokok: ['Hikmah persaudaraan (ukhuwah)', 'Menjaga kerukunan antarumat'], semester: 2 }
      ]
    }
  },
  'pendidikan jasmani, olahraga, dan kesehatan (pjok)': {
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
    }
  },
  'bahasa inggris': {
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
    }
  },
  'seni rupa': {
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
    }
  },
  'b.sunda': {
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
    }
  },
  'tatanen di bale atikan': {
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
    }
  },
  'akpk': {
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
    }
  }
};

// Helper mendapatkan daftar bab standar kurikulum resmi jika ekstraksi PDF terpotong
export function getStandardCurriculumChapters(mataPelajaran: string, jenjangKelas: string) {
  const normMapel = (mataPelajaran || '').toLowerCase().trim();
  const kelasMatch = (jenjangKelas || '').match(/\d+/);
  const kelasKey = kelasMatch ? kelasMatch[0] : '5';

  let subjectKey = Object.keys(standardCurriculumDatabase).find(k => normMapel.includes(k) || k.includes(normMapel));
  if (!subjectKey) {
    if (normMapel.includes('indonesia')) subjectKey = 'bahasa indonesia';
    else if (normMapel.includes('ipas') || normMapel.includes('ipa') || normMapel.includes('ips') || normMapel.includes('ilmu pengetahuan alam')) subjectKey = 'ipas';
    else if (normMapel.includes('matematika')) subjectKey = 'matematika';
    else if (normMapel.includes('pancasila') || normMapel.includes('pkn')) subjectKey = 'pendidikan pancasila';
    else if (normMapel.includes('agama')) subjectKey = 'pendidikan agama dan budi pekerti';
    else if (normMapel.includes('pjok') || normMapel.includes('jasmani') || normMapel.includes('olahraga')) subjectKey = 'pendidikan jasmani, olahraga, dan kesehatan (pjok)';
    else if (normMapel.includes('inggris')) subjectKey = 'bahasa inggris';
    else if (normMapel.includes('seni') || normMapel.includes('rupa')) subjectKey = 'seni rupa';
    else if (normMapel.includes('koding') || normMapel.includes('artifisial')) subjectKey = 'koding dan kecerdasan artifisial';
    else if (normMapel.includes('sunda')) subjectKey = 'b.sunda';
    else if (normMapel.includes('tatanen') || normMapel.includes('tdba')) subjectKey = 'tatanen di bale atikan';
    else if (normMapel.includes('akpk')) subjectKey = 'akpk';
  }

  if (subjectKey && standardCurriculumDatabase[subjectKey]?.[kelasKey]) {
    return standardCurriculumDatabase[subjectKey][kelasKey];
  }

  // Fallback ke kelas 5 dari mapel tersebut jika ada
  if (subjectKey && standardCurriculumDatabase[subjectKey]?.['5']) {
    return standardCurriculumDatabase[subjectKey]['5'];
  }

  return null;
}

// Helper ekstraksi struktur Bab & Materi Pokok dari teks buku/daftar isi
export function buildStructurePrompt(rawText: string, mataPelajaran: string, jenjangKelas: string) {
  // Bersihkan teks: hilangkan deretan titik daftar isi (...), spasi berlebih, dan baris kosong beruntun
  const cleanedText = (rawText || '')
    .replace(/\.{3,}/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(\r?\n\s*){3,}/g, '\n\n')
    .slice(0, 16000);

  return `Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Dasar Kemendikbudristek RI.
Tugas Anda adalah membaca teks Daftar Isi buku teks pelajaran berikut, lalu mengekstrak SELURUH BAB dan Materi Pokok/sub-bab secara akurat, lengkap, dan tanpa ada bab yang tertinggal.

Mata Pelajaran: ${mataPelajaran || 'Umum'}
Jenjang/Kelas: ${jenjangKelas || 'SD'}

TEKS DAFTAR ISI BUKU:
"""
${cleanedText}
"""

ATURAN WAJIB & KRITIS (SANGAT PENTING):
1. WAJIB EKSTRAK SEMUA BAB:
   - Buku teks pelajaran SD untuk setahun penuh umumnya memiliki 6 sampai 10 BAB (Semester 1 dan Semester 2).
   - DILARANG KERAS HANYA MENGELUARKAN 1 BAB!
   - Periksa seluruh teks dari awal hingga akhir, dan temukan Bab 1, Bab 2, Bab 3, Bab 4, Bab 5, Bab 6, Bab 7, Bab 8, dst.
2. FORMAT JUDUL BAB:
   - Tuliskan nomor bab dan judul lengkapnya secara jelas, contoh: "Bab 1: Aku yang Unik", "Bab 2: Buku Jendela Dunia".
3. MATERI POKOK:
   - Tuliskan 2 sampai 4 submateri/topik pokok penting dalam setiap bab secara padat dan ringkas (contoh: ["Kata sifat", "Sinonim dan Antonim", "Makna awalan pe-", "Teks Deskripsi"]).
   - JANGAN membuat uraian penjelasan panjang agar respons tidak terpotong oleh limit token AI.
4. PEMBAGIAN SEMESTER OTOMATIS:
   - Jika jumlah bab total genap (misal 8 bab): Bagi rata (Bab 1-4 = Semester 1, Bab 5-8 = Semester 2).
   - Jika jumlah bab total ganjil (misal 9 bab): Semester 1 lebih banyak (Bab 1-5 = Semester 1, Bab 6-9 = Semester 2) karena waktu efektif semester 2 relatif singkat.
5. FORMAT OUTPUT JSON:
   Keluarkan HANYA JSON valid tanpa teks pembuka/penutup dan tanpa penalaran bertele-tele:
{
  "buku_judul": "Nama Buku Siswa / Penerbit yang Teridentifikasi",
  "total_babs": 8,
  "chapters": [
    {
      "no": 1,
      "bab": "Bab 1: Judul Bab Pertama",
      "materi_pokok": ["Topik 1", "Topik 2", "Topik 3"],
      "semester": 1
    },
    {
      "no": 2,
      "bab": "Bab 2: Judul Bab Kedua",
      "materi_pokok": ["Topik 1", "Topik 2"],
      "semester": 1
    },
    {
      "no": 3,
      "bab": "Bab 3: Judul Bab Ketiga",
      "materi_pokok": ["Topik 1", "Topik 2"],
      "semester": 1
    }
  ]
}`;
}

// Helper pembuatan Prompt Analisis CP, TP, dan ATP
export function buildAnalisisCpPrompt(params: {
  namaSekolah: string;
  mataPelajaran: string;
  jenjangKelas: string;
  fase: string;
  tahunAjaran: string;
  chapters: any[];
  targetSemester: string;
  baseCP: string | null;
  elementsCP: any;
}) {
  const { namaSekolah, mataPelajaran, jenjangKelas, fase, tahunAjaran, chapters, targetSemester, baseCP, elementsCP } = params;

  const kelasNum = (jenjangKelas.match(/\d+/) || ['5'])[0];
  const filteredChapters = chapters.filter(ch => {
    if (targetSemester === '1') return ch.semester === 1;
    if (targetSemester === '2') return ch.semester === 2;
    return true; // 'all'
  });

  const quota = getAlokasiWaktuResmi(mataPelajaran, jenjangKelas);

  return `Anda adalah Pakar Analisis Kurikulum Merdeka Terverifikasi BSKAP Kemendikbudristek RI.
Tugas Anda adalah menyusun dokumen resmi:
\"ANALISIS CP, TP, DAN ATP\"
Standar Dokumen Mutu Pendidikan Sekolah Dasar Berbasis Buku Ajar.

STANDAR ALOKASI WAKTU RESMI (PERMENDIKDASMEN NO. 13 TAHUN 2025):
- Dasar Regulasi: Permendikdasmen RI No. 13 Tahun 2025 (Perubahan atas Permendikbudristek No. 12/2024)
- Mata Pelajaran: ${quota.namaResmi} (${jenjangKelas} / Fase ${quota.fase})
- Beban Intrakurikuler per Minggu: ${quota.jpPerMinggu} JP/minggu (1 JP = 35 menit)
- Target Intrakurikuler per Semester: ${quota.intrakurikulerPerSemester} JP (${quota.mingguPerSemester} pekan efektif)
- Target Intrakurikuler per Tahun: ${quota.intrakurikulerPerTahun} JP (${quota.mingguPerTahun} pekan efektif)
- Beban Kokurikuler (Lintas Disiplin / 7 Kebiasaan Anak Indonesia Hebat): ${quota.kokurikulerPerTahun} JP/tahun

IDENTITAS DOKUMEN:
- Satuan Pendidikan: ${namaSekolah || 'SDN'}
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas: ${fase}/${kelasNum} (${jenjangKelas})
- Tahun Pembelajaran: ${tahunAjaran || '2025/2026'}
- Target Analisis: ${targetSemester === '1' ? 'Semester 1 Saja' : targetSemester === '2' ? 'Semester 2 Saja' : 'Setahun Penuh (Semester 1 dan 2)'}

CAPAIAN PEMBELAJARAN (CP) RESMI PEMERINTAH (BSKAP No. 046 Tahun 2025):
${baseCP || 'Gunakan Capaian Pembelajaran standar resmi untuk mata pelajaran dan fase ini.'}

DETAIL ELEMEN CP RESMI:
${elementsCP ? JSON.stringify(elementsCP, null, 2) : 'Gunakan elemen kurikulum resmi yang sesuai.'}

DAFTAR BAB & MATERI POKOK BUKU TEKS YANG DIAJARKAN:
${JSON.stringify(filteredChapters, null, 2)}

PETUNJUK ANALISIS KEDINASAN (SANGAT KETAT):
1. [KOLOM BAB]: Tuliskan nama bab secara lengkap sesuai data buku di atas.
2. [KOLOM CP]: Pilih dan petakan kalimat Capaian Pembelajaran RESMI pemerintah di atas yang paling selaras menaungi materi bab ini. Awali dengan nama elemen resminya, contoh:
   \"Pemahaman IPAS: Menjelaskan fenomena gelombang bunyi dan cahaya dalam kehidupan sehari-hari.\"
   \"Pemahaman IPAS: Menganalisis hubungan antar komponen biotik dan abiotik, serta pengaruhnya terhadap ekosistem.\"
   DILARANG MENGARANG teks CP baru di luar substansi resmi pemerintah.
3. [KOLOM MATERI POKOK]: Rincikan 2 sampai 4 submateri/topik pokok penting dalam bab tersebut dengan nomor urut (contoh: \"1. Sifat Cahaya\", \"2. Indra Penglihatan (Mata)\", \"3. Sifat Bunyi\", \"4. Indra Pendengaran (Telinga)\").
4. [KOLOM KODE TP]: Wajib menggunakan format kelas.nomor_urut.
   Untuk ${jenjangKelas} (Kelas ${kelasNum}):
   Gunakan: ${kelasNum}.1, ${kelasNum}.2, ${kelasNum}.3, ${kelasNum}.4, ${kelasNum}.5, dst secara berurutan dan TIDAK BOLEH reset/mengulang dari 1 di tiap bab baru. Urutan nomor terus berlanjut hingga akhir semester/tahun!
5. [KOLOM TP (TUJUAN PEMBELAJARAN)]:
   Rumuskan Tujuan Pembelajaran yang operasional, jelas, terukur, dan berbasis kompetensi (Taksonomi Bloom/Anderson: Mendesain, Menjelaskan, Mengidentifikasi, Menganalisis, Menyajikan, dll).
   Contoh: \"Mendesain percobaan sederhana untuk membuktikan sifat cahaya dan menjelaskan hasilnya.\"
6. [KOLOM ATP (ALUR TUJUAN PEMBELAJARAN)]:
   Rumuskan langkah kegiatan/alur konkret yang dijalani peserta didik di kelas untuk mencapai TP tersebut.
   Contoh: \"Peserta didik melakukan percobaan menggunakan cermin, gelas berisi air, dan karton lubang untuk membuktikan sifat cahaya (merambat lurus, menembus benda bening, dipantulkan, dibiaskan).\"
7. [KOLOM ALOKASI WAKTU - PERMENDIKDASMEN 13/2025]:
   Cantumkan alokasi waktu Jam Pelajaran (JP) yang realistis per item/materi (contoh: \"2 JP\", \"3 JP\", \"4 JP\", atau \"5 JP\"). Total penjumlahan seluruh alokasi_waktu materi pada semester harus proporsional mendekati atau pas dengan kuota resmi intrakurikuler (${quota.intrakurikulerPerSemester} JP per semester).
8. [PENGELOMPOKKAN SEMESTER]:
   Kelompokkan bab-bab ke dalam \"SEMESTER 1\" dan \"SEMESTER 2\" sesuai nilai 'semester' pada masing-masing bab.

FORMAT OUTPUT:
Keluarkan HANYA JSON valid dengan struktur berikut:
{
  "metadata": {
    "satuan_pendidikan": "${namaSekolah || 'SDN'}",
    "mata_pelajaran": "${mataPelajaran}",
    "fase": "${fase}",
    "kelas": "${kelasNum}",
    "fase_kelas": "${fase}/${kelasNum}",
    "tahun_pembelajaran": "${tahunAjaran || '2025/2026'}"
  },
  "semesters": [
    {
      "semester": 1,
      "semester_label": "SEMESTER 1",
      "babs": [
        {
          "no": 1,
          "bab": "Judul Bab",
          "cp": "Elemen: Kalimat CP resmi pemerintah",
          "materi_list": ["1. Topik A", "2. Topik B"],
          "items": [
            {
              "kode_tp": "${kelasNum}.1",
              "materi_pokok": "1. Topik A",
              "tp": "Rumusan TP operasional",
              "atp": "Alur aktivitas pencapaian siswa di kelas",
              "alokasi_waktu": "2 JP"
            }
          ]
        }
      ]
    }
  ]
}`;
}

// 1. Ekstraksi Struktur Bab dari Teks Buku
analisisCp.post('/extract-structure', async (c) => {
  try {
    const body = await c.req.json();
    const { text, mataPelajaran, jenjangKelas, aiProvider } = body;

    if (!text || !String(text).trim()) {
      return Errors.badRequest(c, 'Teks daftar isi atau materi buku tidak boleh kosong');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const prompt = buildStructurePrompt(text, mataPelajaran, jenjangKelas);
    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;
    const result = await ai.generateJSON(prompt, preferredSlug);

    const standardData = getStandardCurriculumChapters(mataPelajaran, jenjangKelas);

    if (result && Array.isArray(result.chapters)) {
      // Jika AI hanya mengembalikan 1 atau 2 bab (misalnya karena terpotong limit token atau hanya membaca bab pertama)
      if (result.chapters.length <= 2 && standardData && Array.isArray(standardData.chapters)) {
        const firstExtracted = result.chapters[0]?.bab?.toLowerCase() || '';
        const stdFirst = standardData.chapters[0]?.bab?.toLowerCase() || '';
        
        // Jika bab pertama yang diekstrak cocok dengan bab pertama standar resmi (cth: "Aku yang Unik")
        // atau jika judul buku mengandung kata kunci mapel yang sesuai:
        const isMatchFirst = firstExtracted.includes('aku yang unik') || firstExtracted.includes('cahaya') || firstExtracted.includes('cacah') || firstExtracted.includes('pancasila');
        
        if (isMatchFirst || result.chapters.length === 1) {
          // Lengkapi dengan bab-bab standar resmi sehingga guru memperoleh struktur 8 Bab yang utuh
          result.chapters = standardData.chapters;
          result.is_enriched = true;
          if (!result.buku_judul) result.buku_judul = standardData.judul;
        }
      }

      result.chapters = distributeChaptersToSemesters(result.chapters);
    }

    // Selalu sertakan saran bab standar kurikulum jika tersedia
    if (standardData) {
      result.standard_preset = standardData;
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Extract Structure Error:', e);
    // Jika AI gagal total atau timeout, kembalikan bab standar resmi kurikulum
    const standardData = getStandardCurriculumChapters(c.req.query('mataPelajaran') || '', c.req.query('jenjangKelas') || '');
    if (standardData) {
      return successResponse(c, {
        buku_judul: standardData.judul,
        total_babs: standardData.chapters.length,
        chapters: distributeChaptersToSemesters(standardData.chapters),
        is_fallback: true
      });
    }
    return Errors.internal(c, e.message);
  }
});

// Endpoint mandiri untuk mengambil struktur BAB standar resmi Kemendikbudristek
analisisCp.get('/standard-chapters', async (c) => {
  const mapel = c.req.query('mataPelajaran') || 'IPAS';
  const kelas = c.req.query('jenjangKelas') || 'Kelas 5';
  const standardData = getStandardCurriculumChapters(mapel, kelas);

  if (!standardData) {
    return Errors.notFound(c, `Struktur bab standar untuk ${mapel} ${kelas} belum tersedia.`);
  }

  return successResponse(c, {
    buku_judul: standardData.judul,
    total_babs: standardData.chapters.length,
    chapters: distributeChaptersToSemesters(standardData.chapters)
  });
});

// Helper resolve CP
async function resolveOfficialCP(mataPelajaran: string, jenjangKelas: string, db?: any) {
  const official = db ? await getDynamicCP(db, mataPelajaran, jenjangKelas) : getOfficialCP(mataPelajaran, jenjangKelas);
  const elements = db ? await getDynamicCPElements(db, mataPelajaran, jenjangKelas) : null;
  const fase = getFaseFromKelas(jenjangKelas) || 'Fase C';
  const faseCode = fase.replace('Fase ', '').trim();

  let finalElements = elements;
  if (!finalElements) {
    const normalizedSubject = (mataPelajaran || '').toLowerCase().trim();
    const subjectKeys = Object.keys(cpElementsData);
    const matchedKey = subjectKeys.find(key => {
      const lk = key.toLowerCase();
      return normalizedSubject === lk ||
             normalizedSubject.includes(lk) || lk.includes(normalizedSubject) ||
             (lk.includes('agama') && normalizedSubject.includes('agama')) ||
             (lk.includes('pancasila') && normalizedSubject.includes('pancasila')) ||
             (lk.includes('ipas') && (normalizedSubject.includes('ipas') || normalizedSubject.includes('ilmu pengetahuan alam'))) ||
             (lk.includes('matematika') && normalizedSubject.includes('matematika')) ||
             (lk.includes('inggris') && normalizedSubject.includes('inggris')) ||
             (lk.includes('jasmani') && (normalizedSubject.includes('pjok') || normalizedSubject.includes('jasmani') || normalizedSubject.includes('olahraga'))) ||
             (lk.includes('seni') && (normalizedSubject.includes('seni') || normalizedSubject.includes('rupa'))) ||
             (lk.includes('koding') && normalizedSubject.includes('koding')) ||
             (lk.includes('sunda') && normalizedSubject.includes('sunda')) ||
             ((lk.includes('tatanen') || lk.includes('tdba')) && (normalizedSubject.includes('tatanen') || normalizedSubject.includes('tdba'))) ||
             (lk.includes('akpk') && normalizedSubject.includes('akpk'));
    });
    finalElements = matchedKey && cpElementsData[matchedKey]?.[fase] ? cpElementsData[matchedKey][fase] : null;
  }

  return { officialCP: official, elementsCP: finalElements, faseCode, fase };
}

// Helper: Validasi & Auto-Repair Output AI untuk Struktur Dokumen Kedinasan yang Presisi
export function validateAndRepairAnalysisResult(rawResult: any, inputChapters: any[], meta: any): any {
  const result = (rawResult && typeof rawResult === 'object') ? JSON.parse(JSON.stringify(rawResult)) : {};
  
  // 1. Metadata Normalization
  result.metadata = result.metadata || {};
  result.metadata.satuan_pendidikan = result.metadata.satuan_pendidikan || meta.namaSekolah || 'SDN';
  result.metadata.mata_pelajaran = result.metadata.mata_pelajaran || meta.mataPelajaran || '';
  result.metadata.fase = result.metadata.fase || meta.fase || 'Fase C';
  const rawKelas = String(result.metadata.kelas || meta.jenjangKelas || '5');
  const kelasNum = rawKelas.replace(/\D/g, '') || '5';
  result.metadata.kelas = kelasNum;
  result.metadata.fase_kelas = result.metadata.fase_kelas || `${result.metadata.fase}/${kelasNum}`;
  result.metadata.tahun_pembelajaran = result.metadata.tahun_pembelajaran || meta.tahunAjaran || '2025/2026';

  // 2. Semesters Structure Normalization
  if (!Array.isArray(result.semesters) || result.semesters.length === 0) {
    if (Array.isArray(result.babs) && result.babs.length > 0) {
      result.semesters = [
        {
          semester: 1,
          semester_label: 'SEMESTER 1',
          babs: result.babs.filter((b: any) => b.semester !== 2)
        },
        {
          semester: 2,
          semester_label: 'SEMESTER 2',
          babs: result.babs.filter((b: any) => b.semester === 2)
        }
      ];
    } else {
      result.semesters = [
        { semester: 1, semester_label: 'SEMESTER 1', babs: [] },
        { semester: 2, semester_label: 'SEMESTER 2', babs: [] }
      ];
    }
  }

  // 3. Verifikasi & Lengkapi Bab Berdasarkan Input Chapters
  if (Array.isArray(inputChapters) && inputChapters.length > 0) {
    const existingBabNos = new Set<number>();
    for (const sem of result.semesters) {
      if (Array.isArray(sem.babs)) {
        for (const b of sem.babs) {
          if (typeof b.no === 'number') existingBabNos.add(b.no);
        }
      }
    }

    // Jika ada bab dari input yang terlewat oleh AI, sisipkan otomatis agar tidak terpotong
    for (const ch of inputChapters) {
      if (!existingBabNos.has(ch.no)) {
        const targetSemNum = ch.semester === 2 ? 2 : 1;
        let semObj = result.semesters.find((s: any) => s.semester === targetSemNum);
        if (!semObj) {
          semObj = { semester: targetSemNum, semester_label: `SEMESTER ${targetSemNum}`, babs: [] };
          result.semesters.push(semObj);
        }
        if (!Array.isArray(semObj.babs)) semObj.babs = [];

        const materiList = Array.isArray(ch.materi_pokok) && ch.materi_pokok.length > 0
          ? ch.materi_pokok
          : [ch.bab || `Topik ${ch.no}`];

        semObj.babs.push({
          no: ch.no,
          bab: ch.bab || `Bab ${ch.no}`,
          cp: meta.baseCP || 'Peserta didik memahami dan menerapkan kompetensi dasar sesuai kurikulum.',
          materi_list: materiList,
          items: materiList.map((m: string) => ({
            kode_tp: '',
            materi_pokok: m,
            tp: `Peserta didik mampu memahami dan menguasai materi ${m}.`,
            atp: `Mempelajari konsep dasar ${m}, mendiskusikannya secara kelompok, dan mengerjakan asesmen formatif.`,
            alokasi_waktu: '4 JP'
          }))
        });
        existingBabNos.add(ch.no);
      }
    }
  }

  // 4. Pastikan Urutan Semester & Penomoran Kode TP Sekuensial Global (5.1, 5.2, 5.3, ...)
  result.semesters.sort((a: any, b: any) => (a.semester || 1) - (b.semester || 1));

  let globalTpCounter = 1;
  for (const sem of result.semesters) {
    if (!sem.semester_label) {
      sem.semester_label = `SEMESTER ${sem.semester || 1}`;
    }
    if (!Array.isArray(sem.babs)) sem.babs = [];
    sem.babs.sort((a: any, b: any) => (a.no || 0) - (b.no || 0));

    for (const bab of sem.babs) {
      if (!Array.isArray(bab.items) || bab.items.length === 0) {
        bab.items = [
          {
            kode_tp: `${kelasNum}.${globalTpCounter++}`,
            materi_pokok: bab.bab || 'Materi Pokok',
            tp: `Peserta didik mampu memahami dan menguasai konsep ${bab.bab || 'materi ini'}.`,
            atp: `Eksplorasi konsep, diskusi terbimbing, dan penerapan kompetensi.`,
            alokasi_waktu: '4 JP'
          }
        ];
      } else {
        for (const item of bab.items) {
          // Selalu tegakkan kode_tp sekuensial kedinasan tanpa reset antar bab
          item.kode_tp = `${kelasNum}.${globalTpCounter++}`;

          // Format alokasi waktu standar (misal "4 JP")
          if (!item.alokasi_waktu || typeof item.alokasi_waktu !== 'string') {
            item.alokasi_waktu = '4 JP';
          } else {
            const jpMatch = item.alokasi_waktu.match(/\d+/);
            const jpNum = jpMatch ? parseInt(jpMatch[0], 10) : 4;
            item.alokasi_waktu = `${jpNum} JP`;
          }

          if (!item.materi_pokok) item.materi_pokok = bab.bab || 'Materi Pokok';
          if (!item.tp) item.tp = `Peserta didik mampu memahami konsep ${item.materi_pokok}.`;
          if (!item.atp) item.atp = `Aktivitas pembelajaran dan latihan kompetensi terkait ${item.materi_pokok}.`;
        }
      }
    }
  }

  // 5. Terapkan Standar Alokasi Waktu & Auto-Balance Intrakurikuler (Permendikdasmen No. 13 Tahun 2025)
  const finalMapel = result.metadata?.mata_pelajaran || meta.mataPelajaran || meta.mata_pelajaran || '';
  const finalKelas = result.metadata?.kelas || meta.kelas || meta.jenjangKelas || kelasNum;
  const quota = getAlokasiWaktuResmi(finalMapel, finalKelas);
  if (result.metadata) {
    result.metadata.alokasi_waktu_standar = {
      dasar_hukum: quota.dasarHukum,
      intrakurikuler_per_tahun: quota.intrakurikulerPerTahun,
      kokurikuler_per_tahun: quota.kokurikulerPerTahun,
      total_per_tahun: quota.totalPerTahun,
      jp_per_minggu: quota.jpPerMinggu,
      target_semester_jp: quota.intrakurikulerPerSemester,
      minggu_per_semester: quota.mingguPerSemester,
      minggu_per_tahun: quota.mingguPerTahun
    };
  }

  for (const sem of result.semesters) {
    balanceSemesterJpItems(sem.babs, quota.intrakurikulerPerSemester, quota.jpPerMinggu);
  }

  return result;
}

// 2. Generate Analisis CP (Non-Streaming)
analisisCp.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const {
      namaSekolah, namaGuru, mataPelajaran, jenjangKelas,
      tahunAjaran, chapters, targetSemester, aiProvider
    } = body;

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return Errors.badRequest(c, 'Daftar BAB tidak boleh kosong');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const { officialCP, elementsCP, faseCode, fase } = await resolveOfficialCP(mataPelajaran, jenjangKelas, c.env.DB);
    const distributedChapters = distributeChaptersToSemesters(chapters);

    const prompt = buildAnalisisCpPrompt({
      namaSekolah,
      mataPelajaran,
      jenjangKelas,
      fase: faseCode,
      tahunAjaran,
      chapters: distributedChapters,
      targetSemester: targetSemester || 'all',
      baseCP: officialCP,
      elementsCP
    });

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;
    const rawResult = await ai.generateJSON(prompt, preferredSlug);
    const result = validateAndRepairAnalysisResult(rawResult, distributedChapters, {
      namaSekolah,
      namaGuru,
      mataPelajaran,
      jenjangKelas,
      fase: faseCode,
      tahunAjaran,
      baseCP: officialCP
    });

    // Telemetry log
    try {
      const sessionId = getCookie(c.req.header('Cookie'), 'session');
      const user = await getCurrentUser(c.env.DB, sessionId);
      await recordAIGeneration(c.env.DB, {
        user_id: user?.id || 1,
        user_nama: user?.nama || (namaGuru || 'Guru'),
        sekolah: user?.sekolah || (namaSekolah || 'SDN'),
        feature_type: 'ANALISIS_CP',
        mata_pelajaran: mataPelajaran,
        topik: `Analisis CP ${chapters.length} BAB`,
        jenjang_kelas: jenjangKelas,
        ai_provider: preferredSlug,
      });
    } catch (_) {}

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Analisis CP Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 3. Generate Analisis CP Stream (SSE Live Monitor)
analisisCp.post('/generate-stream', async (c) => {
  try {
    const body = await c.req.json();
    const {
      namaSekolah, namaGuru, mataPelajaran, jenjangKelas,
      tahunAjaran, chapters, targetSemester, aiProvider
    } = body;

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return Errors.badRequest(c, 'Daftar BAB tidak boleh kosong');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const { officialCP, elementsCP, faseCode, fase } = await resolveOfficialCP(mataPelajaran, jenjangKelas, c.env.DB);
    const distributedChapters = distributeChaptersToSemesters(chapters);

    const prompt = buildAnalisisCpPrompt({
      namaSekolah,
      mataPelajaran,
      jenjangKelas,
      fase: faseCode,
      tahunAjaran,
      chapters: distributedChapters,
      targetSemester: targetSemester || 'all',
      baseCP: officialCP,
      elementsCP
    });

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash'
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;

    c.header('X-Accel-Buffering', 'no');
    return streamSSE(c, async (stream) => {
      try {
        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 1,
            totalSteps: 4,
            title: 'Sinkronisasi CP BSKAP No. 046/2025',
            message: `Mengambil regulasi CP resmi untuk ${mataPelajaran} ${fase} (${jenjangKelas})...`,
            percent: 25
          })
        });

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 2,
            totalSteps: 4,
            title: 'Pemetaan Bab & Materi Pokok',
            message: `Menghubungkan ${distributedChapters.length} BAB buku teks dengan elemen CP...`,
            percent: 50
          })
        });

        const onToken = async (token: string) => {
          try {
            await stream.writeSSE({
              event: 'token',
              data: JSON.stringify({ text: token })
            });
          } catch (_) {}
        };

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 3,
            totalSteps: 4,
            title: 'Perumusan TP & ATP',
            message: `Menyusun kode TP berurutan dan alur aktivitas pembelajaran operasional...`,
            percent: 75
          })
        });

        const rawResult = await ai.generateJSONStream(prompt, preferredSlug, onToken);
        const result = validateAndRepairAnalysisResult(rawResult, distributedChapters, {
          namaSekolah,
          namaGuru,
          mataPelajaran,
          jenjangKelas,
          fase: faseCode,
          tahunAjaran,
          baseCP: officialCP
        });

        // Telemetry log
        try {
          const sessionId = getCookie(c.req.header('Cookie'), 'session');
          const user = await getCurrentUser(c.env.DB, sessionId);
          await recordAIGeneration(c.env.DB, {
            user_id: user?.id || 1,
            user_nama: user?.nama || (namaGuru || 'Guru'),
            sekolah: user?.sekolah || (namaSekolah || 'SDN'),
            feature_type: 'ANALISIS_CP',
            mata_pelajaran: mataPelajaran,
            topik: `Analisis CP ${chapters.length} BAB`,
            jenjang_kelas: jenjangKelas,
            ai_provider: preferredSlug,
          });
        } catch (_) {}

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 4,
            totalSteps: 4,
            title: 'Finalisasi Dokumen Analisis',
            message: 'Tabel Analisis CP, TP, dan ATP berhasil dirakit!',
            percent: 100
          })
        });

        await stream.writeSSE({
          event: 'done',
          data: JSON.stringify({
            success: true,
            data: result
          })
        });
      } catch (err: any) {
        console.error('Analisis CP Stream Error:', err);
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({
            message: err.message || 'Gagal menghasilkan Analisis CP secara streaming'
          })
        });
      }
    });
  } catch (e: any) {
    console.error('Analisis CP Route Stream Error:', e);
    return Errors.internal(c, e.message);
  }
});

// Helper resolusi kop surat URL
async function resolveKopUrl(c: any, explicitKopUrl?: string): Promise<string | null> {
  if (explicitKopUrl) return explicitKopUrl;
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (user?.sekolah) {
      const matched: any = await c.env.DB.prepare('SELECT kop_surat_url FROM sekolah WHERE nama = ? LIMIT 1').bind(user.sekolah).first();
      if (matched?.kop_surat_url) return matched.kop_surat_url;
    }
  } catch (_) {}
  return null;
}

// 4. Download DOCX Analisis CP
analisisCp.post('/docx', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const buffer = await generateAnalisisCpDocxBuffer(docxInput);

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const filename = `Analisis_CP_TP_ATP_${mapelSafe}_Kelas_${kelasSafe}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Analisis CP DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4b. Download DOCX Program Tahunan (PROTA)
analisisCp.post('/docx/prota', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const buffer = await generateProtaDocxBuffer(docxInput);

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const filename = `PROTA_${mapelSafe}_Kelas_${kelasSafe}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Prota DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4c. Download DOCX Program Semester (PROMES)
analisisCp.post('/docx/promes', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters, semester } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const targetSem = semester ? Number(semester) : undefined;
    const buffer = await generatePromesDocxBuffer(docxInput, targetSem);

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const semSuffix = targetSem ? `_Semester_${targetSem}` : '';
    const filename = `PROMES_${mapelSafe}_Kelas_${kelasSafe}${semSuffix}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Promes DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 4d. Download DOCX Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
analisisCp.post('/docx/kktp', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, semesters, semester } = body;

    if (!semesters || !Array.isArray(semesters)) {
      return Errors.badRequest(c, 'Data semesters wajib disertakan');
    }

    const kopUrl = await resolveKopUrl(c, metadata?.kop_surat_url);

    const docxInput: AnalisisCpDocxInput = {
      metadata: {
        ...metadata,
        kop_surat_url: kopUrl || null
      },
      semesters
    };

    const targetSem = semester ? Number(semester) : undefined;
    const buffer = await generateKktpDocxBuffer(docxInput, targetSem);

    const mapelSafe = String(metadata?.mata_pelajaran || 'Mapel').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const kelasSafe = String(metadata?.kelas || 'Kelas').replace(/[\\/?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const semSuffix = targetSem ? `_Semester_${targetSem}` : '';
    const filename = `KKTP_${mapelSafe}_Kelas_${kelasSafe}${semSuffix}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('KKTP DOCX Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 5. Simpan Hasil Analisis ke Database
analisisCp.post('/save', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c, 'Silakan login terlebih dahulu');

    const body = await c.req.json();
    const {
      namaSekolah, mataPelajaran, jenjangKelas, fase,
      tahunAjaran, sumberBuku, contentJson
    } = body;

    const result = await c.env.DB.prepare(`
      INSERT INTO analisis_cp_history (
        user_id, nama_sekolah, mata_pelajaran, jenjang_kelas,
        fase, tahun_ajaran, sumber_buku, content_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      user.id,
      namaSekolah || user.sekolah || 'SDN',
      mataPelajaran || '-',
      jenjangKelas || '-',
      fase || 'C',
      tahunAjaran || '2025/2026',
      sumberBuku || 'Buku Teks Guru/Siswa',
      typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson)
    ).run();

    return successResponse(c, { id: result.results[0]?.id }, 'Analisis CP berhasil disimpan');
  } catch (e: any) {
    console.error('Save Analisis CP Error:', e);
    return Errors.internal(c, e.message);
  }
});

// 6. Riwayat Tersimpan Pengguna
analisisCp.get('/history', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    const results = await c.env.DB.prepare(`
      SELECT id, nama_sekolah, mata_pelajaran, jenjang_kelas, fase, tahun_ajaran, sumber_buku, created_at
      FROM analisis_cp_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return successResponse(c, results.results || []);
  } catch (e: any) {
    console.error('List History Analisis CP Error:', e);
    return Errors.internal(c);
  }
});

// 7. Ambil Detail Dokumen Tersimpan
analisisCp.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result: any = await c.env.DB.prepare(`SELECT * FROM analisis_cp_history WHERE id = ?`).bind(id).first();
    if (!result) return Errors.notFound(c, 'Analisis CP tidak ditemukan');

    try {
      result.content = JSON.parse(result.content_json);
    } catch (_) {
      result.content = null;
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Get Analisis CP Error:', e);
    return Errors.internal(c);
  }
});

// 8. Hapus Riwayat
analisisCp.delete('/:id', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM analisis_cp_history WHERE id = ? AND user_id = ?`).bind(id, user.id).run();
    return successResponse(c, null, 'Riwayat Analisis CP berhasil dihapus');
  } catch (e: any) {
    console.error('Delete Analisis CP Error:', e);
    return Errors.internal(c);
  }
});

export default analisisCp;
