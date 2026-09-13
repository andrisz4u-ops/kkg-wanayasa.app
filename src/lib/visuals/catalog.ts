/**
 * catalog.ts
 * Unified catalog of all 47 visual stimulus SVG templates
 */

import { VisualCatalogItem } from './types';

/**
 * Katalog lengkap 50 template visual stimulus SVG untuk API dan UI selector
 */
export function getVisualCatalog(): VisualCatalogItem[] {
  return [
    // Geometri 3D
    { id: 'balok', category: 'Geometri 3D', name: 'Balok 3D', description: 'Balok isometrik dengan p, l, t dan rusuk putus-putus', sampleParams: { p: 12, l: 8, t: 6, unit: 'cm' } },
    { id: 'kubus', category: 'Geometri 3D', name: 'Kubus 3D', description: 'Kubus isometrik dengan panjang rusuk s', sampleParams: { s: 10, unit: 'cm' } },
    { id: 'tabung', category: 'Geometri 3D', name: 'Tabung 3D', description: 'Silinder tabung dengan jari-jari r dan tinggi t', sampleParams: { r: 7, t: 14, unit: 'cm' } },
    { id: 'kerucut', category: 'Geometri 3D', name: 'Kerucut 3D', description: 'Kerucut dengan jari-jari r, tinggi t, garis pelukis s', sampleParams: { r: 7, t: 12, s: 15, unit: 'cm' } },
    { id: 'bola', category: 'Geometri 3D', name: 'Bola 3D', description: 'Bola berarsir radial dengan jari-jari r', sampleParams: { r: 14, unit: 'cm' } },
    { id: 'prisma', category: 'Geometri 3D', name: 'Prisma Segitiga 3D', description: 'Prisma segitiga isometrik dengan alas, tinggi, panjang', sampleParams: { alas: 10, tinggiSegitiga: 8, panjang: 15, unit: 'cm' } },
    { id: 'limas', category: 'Geometri 3D', name: 'Limas Segiempat 3D', description: 'Limas piramida dengan alas persegi s dan tinggi t', sampleParams: { s: 10, t: 12, unit: 'cm' } },
    { id: 'jaring_kubus', category: 'Geometri 3D', name: 'Jaring-jaring Kubus', description: 'Pola jaring-jaring 6 muka kubus (variasi salib, tangga, atau pola T)', sampleParams: { s: 5, unit: 'cm', pola: 'salib' } },
    { id: 'jaring_balok', category: 'Geometri 3D', name: 'Jaring-jaring Balok', description: 'Pola unfolded balok p × l × t berlabel muka', sampleParams: { p: 6, l: 4, t: 3, unit: 'cm' } },

    // Geometri 2D
    { id: 'persegi_panjang', category: 'Geometri 2D', name: 'Persegi Panjang', description: 'Persegi panjang ABCD berdimensi p & l dan siku-siku', sampleParams: { p: 12, l: 8, unit: 'cm' } },
    { id: 'segitiga_sama_sisi', category: 'Geometri 2D', name: 'Segitiga Sama Sisi', description: 'Segitiga 3 sisi sama berlabel s dan sudut 60°', sampleParams: { s: 10, unit: 'cm' } },
    { id: 'segitiga_sama_kaki', category: 'Geometri 2D', name: 'Segitiga Sama Kaki', description: 'Segitiga dengan 2 kaki sama dan garis tinggi putus-putus', sampleParams: { kaki: 10, alas: 8, unit: 'cm' } },
    { id: 'segitiga_siku', category: 'Geometri 2D', name: 'Segitiga Siku-siku', description: 'Segitiga siku-siku berlabel alas, tinggi, sisi miring', sampleParams: { alas: 6, tinggi: 8, miring: 10, unit: 'cm' } },
    { id: 'lingkaran', category: 'Geometri 2D', name: 'Lingkaran (2D)', description: 'Bangun datar lingkaran dengan jari-jari r', sampleParams: { r: 14, unit: 'cm' } },
    { id: 'trapesium', category: 'Geometri 2D', name: 'Trapesium', description: 'Trapesium dengan sisi alas atas, alas bawah, dan tinggi', sampleParams: { atasAlas: 8, bawahAlas: 14, tinggi: 10, unit: 'cm' } },
    { id: 'jajar_genjang', category: 'Geometri 2D', name: 'Jajar Genjang', description: 'Jajar genjang dengan alas, tinggi, dan garis tinggi proyeksi', sampleParams: { alas: 15, tinggi: 10, unit: 'cm' } },
    { id: 'belah_ketupat', category: 'Geometri 2D', name: 'Belah Ketupat', description: 'Belah ketupat dengan diagonal d1 dan d2', sampleParams: { d1: 12, d2: 16, unit: 'cm' } },
    { id: 'layang_layang', category: 'Geometri 2D', name: 'Layang-layang', description: 'Layang-layang dengan persilangan diagonal d1 dan d2', sampleParams: { d1: 10, d2: 18, unit: 'cm' } },
    { id: 'sudut', category: 'Geometri 2D', name: 'Pengukuran Sudut', description: 'Sudut dengan busur derajat', sampleParams: { derajat: 60 } },
    { id: 'simetri_lipat', category: 'Geometri 2D', name: 'Simetri Lipat', description: 'Bangun datar dengan sumbu simetri lipat putus-putus', sampleParams: { bangun: 'persegi' } },
    { id: 'bangun_gabungan', category: 'Geometri 2D', name: 'Bangun Gabungan L / T', description: 'Bangun datar gabungan poligon bentuk L atau T', sampleParams: { bentuk: 'L', segmen: [{ p: 10, l: 4 }, { p: 6, l: 4 }], unit: 'cm' } },
    { id: 'koordinat', category: 'Geometri 2D', name: 'Koordinat Kartesius', description: 'Bidang kartesius 4 kuadran dengan titik berlabel', sampleParams: { titik: [{ x: 3, y: 4, label: 'P' }, { x: -2, y: 3, label: 'Q' }] } },

    // Pecahan
    { id: 'pecahan_lingkaran', category: 'Pecahan', name: 'Pecahan Lingkaran', description: 'Pecahan juring lingkaran terarsir (mendukung pecahan biasa & campuran)', sampleParams: { pembagi: 4, diarsir: 3, utuh: 0 } },
    { id: 'pecahan_persegi', category: 'Pecahan', name: 'Pecahan Persegi (Grid)', description: 'Matriks grid kotak terarsir proporsional', sampleParams: { kolom: 4, baris: 2, diarsir: 3 } },

    // Statistik
    { id: 'diagram_batang', category: 'Statistik', name: 'Diagram Batang', description: 'Diagram batang vertikal dengan label sumbu X & Y', sampleParams: { judul: 'Data Penjualan', labels: ['Senin', 'Selasa', 'Rabu'], data: [20, 35, 30] } },
    { id: 'diagram_garis', category: 'Statistik', name: 'Diagram Garis', description: 'Diagram garis tren dengan titik data berurutan', sampleParams: { judul: 'Suhu Udara', labels: ['06.00', '12.00', '18.00'], data: [24, 32, 28] } },
    { id: 'diagram_lingkaran', category: 'Statistik', name: 'Diagram Lingkaran (Pie)', description: 'Pie chart statistik dengan persentase dan legenda', sampleParams: { judul: 'Data Hobi', labels: ['Membaca', 'Olahraga', 'Musik'], data: [40, 35, 25] } },
    { id: 'diagram_venn', category: 'Statistik', name: 'Diagram Venn', description: 'Dua himpunan overlap dengan semesta S dan irisan', sampleParams: { judul: 'Hobi Siswa', labelA: 'Sepak Bola', labelB: 'Basket', aSaja: 12, irisan: 5, bSaja: 8 } },
    { id: 'pictogram', category: 'Statistik', name: 'Pictogram / Diagram Gambar', description: 'Tabel diagram gambar dengan baris ikon dan legenda', sampleParams: { judul: 'Data Penjualan Buah', labels: ['Apel', 'Jeruk', 'Mangga'], data: [4, 3, 5], ikon: '●', nilaiIkon: 2 } },

    // Pengukuran
    { id: 'jam_analog', category: 'Pengukuran', name: 'Jam Analog', description: 'Jam dinding analog dengan jarum jam dan menit presisi', sampleParams: { jam: 7, menit: 30 } },
    { id: 'garis_bilangan', category: 'Pengukuran', name: 'Garis Bilangan', description: 'Garis bilangan bulat berlabel titik P', sampleParams: { min: -5, max: 5, titik: [{ x: 2, label: 'P' }] } },
    { id: 'mistar', category: 'Pengukuran', name: 'Pengukuran Panjang Mistar', description: 'Penggaris berskala milimeter dengan benda offset berlabel panjang', sampleParams: { start: 3, end: 8.5, objectType: 'pensil', label: 'Panjang = ... cm' } },
    { id: 'busur_derajat', category: 'Pengukuran', name: 'Busur Derajat (Pengukuran Sudut)', description: 'Busur derajat transparan setengah lingkaran 0°-180° untuk membaca sudut', sampleParams: { derajat: 60, label: 'X' } },

    // Sains / IPAS
    { id: 'organ_pencernaan', category: 'Sains / IPAS', name: 'Sistem Pencernaan', description: 'Organ pencernaan makro manusia berlabel target X', sampleParams: { pointer: 'lambung', label: 'X' } },
    { id: 'vili_usus', category: 'Sains / IPAS', name: 'Vili Usus Halus', description: 'Struktur mikroskopis penyerapan sari makanan', sampleParams: { pointer: 'vili', label: 'X' } },
    { id: 'struktur_gigi', category: 'Sains / IPAS', name: 'Struktur & Jenis Gigi', description: 'Gigi seri, taring, dan geraham dengan fungsinya', sampleParams: { pointer: 'taring', label: 'X' } },
    { id: 'lambung_detail', category: 'Sains / IPAS', name: 'Lambung & Enzim Detail', description: 'Penampang dinding lambung, rugae, kardia, dan pilorus', sampleParams: { pointer: 'rugae', label: 'X' } },
    { id: 'organ_pernapasan', category: 'Sains / IPAS', name: 'Sistem Pernapasan', description: 'Organ pernapasan manusia berlabel target X', sampleParams: { pointer: 'trakea', label: 'X' } },
    { id: 'alveolus', category: 'Sains / IPAS', name: 'Alveolus & Pertukaran Gas', description: 'Penampang mikroskopis kapiler dan difusi O2/CO2', sampleParams: { pointer: 'alveolus', label: 'X' } },
    { id: 'siklus_air', category: 'Sains / IPAS', name: 'Siklus Air', description: 'Daur air (evaporasi, kondensasi, presipitasi, infiltrasi)', sampleParams: { pointer: 'evaporasi', label: 'X' } },
    { id: 'metamorfosis', category: 'Sains / IPAS', name: 'Metamorfosis Kupu-kupu', description: 'Daur hidup telur, ulat, kepompong, kupu-kupu berlabel X', sampleParams: { pointer: 'kepompong', label: 'X' } },
    { id: 'bagian_bunga', category: 'Sains / IPAS', name: 'Bagian Bunga', description: 'Penampang putik, benang sari, mahkota, kelopak berlabel X', sampleParams: { pointer: 'putik', label: 'X' } },
    { id: 'rantai_makanan', category: 'Sains / IPAS', name: 'Rantai Makanan', description: 'Alur produsen -> konsumen 1, 2, 3 -> pengurai berlabel X', sampleParams: { pointer: 'produsen', label: 'X' } },
    { id: 'peta_indonesia', category: 'Sains / IPAS', name: 'Peta Kepulauan Indonesia', description: 'Peta siluet kepulauan Indonesia berlabel pulau target X', sampleParams: { pointer: 'jawa', label: 'X' } },
    { id: 'rangkaian_listrik', category: 'Sains / IPAS', name: 'Rangkaian Listrik (Seri/Paralel)', description: 'Baterai, saklar, dan lampu rangkaian seri, paralel, atau campuran', sampleParams: { model: 'campuran', s1: true, s2: false, pointer: 'L1', label: 'X' } },
    { id: 'perubahan_wujud', category: 'Sains / IPAS', name: 'Perubahan Wujud Zat', description: 'Diagram segitiga wujud zat padat, cair, gas dengan 6 panah proses berlabel X', sampleParams: { pointer: '1', label: 'X' } },
    { id: 'tata_surya', category: 'Sains / IPAS', name: 'Sistem Tata Surya & Planet', description: 'Matahari dan 8 planet dalam orbit dengan penunjuk planet target X', sampleParams: { pointer: 'bumi', label: 'X' } },
    { id: 'magnet', category: 'Sains / IPAS', name: 'Kutub & Gaya Magnet', description: 'Dua batang magnet interaksi tarik-menarik / tolak-menolak berlabel target kutub X', sampleParams: { interaksi: 'tarik', pointer: 'kanan2', label: 'X' } },
    { id: 'sifat_cahaya', category: 'Sains / IPAS', name: 'Sifat Cahaya (Pembiasan & Pemantulan)', description: 'Diagram jalannya berkas cahaya pembiasan medium udara-air atau pemantulan cermin berlabel target X', sampleParams: { peristiwa: 'pembiasan', pointer: 'X', label: 'X' } },
    { id: 'peredaran_darah', category: 'Sains / IPAS', name: 'Peredaran Darah & Jantung', description: 'Skema peredaran darah besar & kecil serta anatomi 4 ruang jantung berlabel target X', sampleParams: { pointer: 'bilik_kiri', label: 'X' } },
    { id: 'gerhana', category: 'Sains / IPAS', name: 'Gerhana Matahari & Bulan', description: 'Posisi benda langit dan daerah bayangan umbra serta penumbra berlabel target X', sampleParams: { jenis: 'matahari', pointer: 'umbra', label: 'X' } },
    { id: 'pesawat_sederhana', category: 'Sains / IPAS', name: 'Pesawat Sederhana (Tuas & Katrol)', description: 'Tuas jenis 1, 2, 3 dan katrol tetap/bebas dengan titik tumpu, beban, kuasa', sampleParams: { jenis: 'tuas', tipeTuas: 1, pointer: 'tumpu', label: 'X' } },
    { id: 'pancaindra', category: 'Sains / IPAS', name: 'Pancaindra (Mata & Telinga)', description: 'Penampang anatomi bola mata dan telinga pendengaran berlabel target X', sampleParams: { organ: 'mata', pointer: 'kornea', label: 'X' } },
    { id: 'timbangan_neraca', category: 'Pengukuran', name: 'Neraca Dua Lengan (Timbangan)', description: 'Pengukuran massa dan keseimbangan aljabar beban vs anak timbangan berlabel target X', sampleParams: { status: 'seimbang', pointer: 'kiri', label: 'X' } },
    { id: 'mata_angin', category: 'Geometri 2D', name: 'Arah Mata Angin & Denah', description: 'Kompas 8 arah mata angin serta denah berpetak antar lokasi berlabel target X', sampleParams: { mode: 'kompas', targetArah: 'TL', label: 'X' } },
    { id: 'tabel_turus', category: 'Statistik', name: 'Tabel Turus (Tally Chart)', description: 'Tabel frekuensi data dengan garis turus kelompok 5 berlabel target X', sampleParams: { judul: 'Data Kegemaran Siswa', targetField: 'frekuensi', label: 'X' } },
    { id: 'spinner_peluang', category: 'Statistik', name: 'Roda Putar Peluang (Spinner)', description: 'Spinner lingkaran multi-juring berwarna dan berlabel nilai peluang', sampleParams: { bagian: 6, jarumKe: 1, label: 'X' } },
    { id: 'pola_gambar', category: 'Geometri 2D', name: 'Barisan Pola Gambar Geometri', description: 'Barisan pola titik/bintang 4 suku teratur dengan suku target X', sampleParams: { counts: [1, 3, 5, 7], targetSuku: 4, label: 'X' } },
    { id: 'flowchart', category: 'Koding & Algoritma', name: 'Diagram Alir (Flowchart)', description: 'Diagram alir algoritma sederhana (mulai, input, keputusan, cabang ya/tidak, output, selesai)', sampleParams: { pointer: 'kondisi', label: 'X' } },
    { id: 'perisai_pancasila', category: 'Geometri 2D', name: 'Perisai Garuda Pancasila', description: 'Perisai 5 ruang simbol sila Pancasila dengan penunjuk sila target X', sampleParams: { sila: 1, label: 'X' } },

    // Pengukuran Tambahan (Stage 3)
    { id: 'termometer', category: 'Pengukuran', name: 'Termometer Suhu (°C)', description: 'Termometer skala Celsius dengan kolom cairan raksa/alkohol dan target X', sampleParams: { suhu: 35, unit: '°C', label: 'X' } },
    { id: 'gelas_ukur', category: 'Pengukuran', name: 'Gelas Ukur & Volume Archimedes', description: 'Pengukuran volume cairan dan kenaikan volume akibat batu tak beraturan (Archimedes)', sampleParams: { mode: 'batu', v1: 50, v2: 75, label: 'X' } },
    { id: 'pohon_faktor', category: 'Matematika Bilangan', name: 'Pohon Faktor (KPK & FPB)', description: 'Bagan pohon percabangan faktorisasi prima dengan lingkaran prima dan persegi komposit berlabel X', sampleParams: { bilangan: 24, targetNode: 'prima3', label: 'X' } },
    { id: 'grid_matriks_100', category: 'Pecahan', name: 'Grid 100 Desimal & Persen', description: 'Matriks petak 10×10 (100 sel) terarsir representasi nilai pecahan desimal dan persen', sampleParams: { diarsir: 35, label: 'X' } },

    // Bahasa, PJOK, Seni, PKn, English, & Koding (Stage 4)
    { id: 'rambu_lalu_lintas', category: 'Bahasa & Sosial', name: 'Rambu Lalu Lintas', description: 'Simbol rambu lalu lintas larangan (merah), perintah (biru), peringatan (kuning), atau petunjuk', sampleParams: { kategori: 'larangan', jenis: 'dilarang_parkir', label: 'X' } },
    { id: 'piring_gizi_seimbang', category: 'PJOK & Kesehatan', name: 'Piring Makanku (Gizi Seimbang)', description: 'Bagan piring makan bergizi seimbang 4 porsi (pokok, sayur, lauk, buah) dan air putih', sampleParams: { pointer: 'makanan_pokok', label: 'X' } },
    { id: 'lapangan_olahraga', category: 'PJOK & Olahraga', name: 'Denah Lapangan Olahraga', description: 'Denah garis batas dan zona lapangan sepak bola atau bola voli berlabel target X', sampleParams: { olahraga: 'sepak_bola', label: 'X' } },
    { id: 'preposition_place', category: 'Bahasa Inggris', name: 'Prepositions of Place', description: 'Visualisasi spasial posisi benda (in, on, under, between) dalam Bahasa Inggris', sampleParams: { posisi: 'on', label: 'X' } },
    { id: 'tangga_nada', category: 'Seni & Budaya (SBdP)', name: 'Garis Paranada & Tangga Nada', description: '5 garis paranada, kunci G, dan not balok diatonis C4 sampai C5 berlabel target X', sampleParams: { nadaTarget: 'G', label: 'X' } },
    { id: 'lingkaran_warna', category: 'Seni & Budaya (SBdP)', name: 'Lingkaran Warna Primer & Sekunder', description: 'Roda 6 warna juring percampuran primer dan sekunder berlabel target warna X', sampleParams: { pointer: 'sekunder', label: 'X' } },
    { id: 'struktur_pemda', category: 'Pancasila & Kewarganegaraan', name: 'Struktur Hirarki Pemda', description: 'Bagan hirarki pemerintahan daerah bertingkat dari Provinsi hingga RT berlabel target X', sampleParams: { targetLevel: 'kecamatan', label: 'X' } },
    { id: 'grid_maze_koding', category: 'Koding & Algoritma', name: 'Grid Maze Robot Koding', description: 'Labirin grid petak 4×4 dengan rintangan batu, goal bintang, dan kartu blok perintah', sampleParams: { label: 'X' } },

    // =========================================================================
    // BATCH 1: EXPANDING TO 110 SVG TEMPLATES
    // =========================================================================

    // 1. Instrumen Presisi & Tangga Satuan (11 Items)
    { id: 'stopwatch_analog', category: 'Pengukuran', name: 'Stopwatch Analog', description: 'Stopwatch analog presisi dengan jarum detik dan menit untuk membaca waktu tempuh', sampleParams: { detik: 35, menit: 2 } },
    { id: 'jangka_sorong', category: 'Pengukuran', name: 'Jangka Sorong (Vernier Caliper)', description: 'Skala utama (cm) dan skala nonius (mm) untuk mengukur tebal atau diameter benda', sampleParams: { utama: 2.3, nonius: 4 } },
    { id: 'neraca_pasar', category: 'Pengukuran', name: 'Neraca Pasar (Timbangan Bebek)', description: 'Timbangan meja pasar tradisional dengan anak timbangan bandul logam', sampleParams: { bebanKg: 2, anakKg: 2 } },
    { id: 'timbangan_digital', category: 'Pengukuran', name: 'Timbangan Digital Presisi', description: 'Layar digital 7-segment untuk menimbang massa benda dengan satuan gram', sampleParams: { massa: 450, unit: 'g' } },
    { id: 'bejana_literan', category: 'Pengukuran', name: 'Bejana Literan Takaran Beras', description: 'Silinder takaran beras 1 liter dan 1/2 liter berbahan kaleng/logam', sampleParams: { kapasitas: 1, terisi: 0.75 } },
    { id: 'gelas_erlenmeyer', category: 'Pengukuran', name: 'Gelas Erlenmeyer', description: 'Labu Erlenmeyer laboratorium dengan garis skala volume cairan', sampleParams: { volume: 150, max: 250 } },
    { id: 'meteran_gulung', category: 'Pengukuran', name: 'Meteran Gulung / Pita', description: 'Pita meteran gulung pertukangan/bangunan dengan angka skala cm dan m', sampleParams: { panjang: 3.5, unit: 'm' } },
    { id: 'dinamometer_pegas', category: 'Pengukuran', name: 'Dinamometer (Neraca Pegas)', description: 'Tabung skala gaya pegas dalam satuan Newton (N) dengan beban tergantung', sampleParams: { newton: 5 } },
    { id: 'tangga_satuan_panjang', category: 'Pengukuran', name: 'Tangga Satuan Panjang', description: 'Tangga 7 anak tangga konversi satuan panjang (km, hm, dam, m, dm, cm, mm)', sampleParams: { dari: 'm', ke: 'cm' } },
    { id: 'tangga_satuan_massa', category: 'Pengukuran', name: 'Tangga Satuan Massa', description: 'Tangga 7 anak tangga konversi satuan massa (kg, hg/ons, dag, g, dg, cg, mg)', sampleParams: { dari: 'kg', ke: 'g' } },
    { id: 'tangga_satuan_volume', category: 'Pengukuran', name: 'Tangga Satuan Volume (Liter)', description: 'Tangga 7 anak tangga konversi volume (kl, hl, dal, l, dl, cl, ml)', sampleParams: { dari: 'l', ke: 'ml' } },

    // 2. Geometri Lanjut 2D & 3D (10 Items)
    { id: 'sudut_jarum_jam', category: 'Geometri 2D', name: 'Sudut Dua Jarum Jam', description: 'Besar sudut antara jarum jam dan jarum menit pada dial jam dinding', sampleParams: { jam: 3, menit: 0 } },
    { id: 'jaring_limas_segiempat', category: 'Geometri 3D', name: 'Jaring-jaring Limas Segiempat', description: 'Pola unfolded limas alas persegi dengan 4 segitiga tegak berlabel', sampleParams: { s: 8, t: 10 } },
    { id: 'jaring_limas_segitiga', category: 'Geometri 3D', name: 'Jaring-jaring Limas Segitiga', description: 'Pola unfolded tetrahedron limas dengan 4 bidang segitiga', sampleParams: { s: 8 } },
    { id: 'jaring_prisma_segitiga', category: 'Geometri 3D', name: 'Jaring-jaring Prisma Segitiga', description: 'Pola unfolded prisma segitiga (3 persegi panjang dan 2 segitiga)', sampleParams: { a: 6, t: 8, p: 12 } },
    { id: 'keliling_gabungan', category: 'Geometri 2D', name: 'Keliling Bangun Datar Gabungan', description: 'Bangun datar gabungan persegi panjang dan setengah lingkaran/segitiga', sampleParams: { p: 14, l: 10 } },
    { id: 'lingkaran_tembereng', category: 'Geometri 2D', name: 'Tembereng & Juring Lingkaran', description: 'Daerah tembereng diarsir yang dibatasi oleh tali busur dan busur lingkaran', sampleParams: { r: 14, sudut: 90 } },
    { id: 'koordinat_poligon', category: 'Geometri 2D', name: 'Poligon Koordinat Kartesius', description: 'Poligon segitiga atau segiempat yang dibentuk dari titik koordinat (x,y)', sampleParams: { titik: [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 3, y: 5 }] } },
    { id: 'transformasi_refleksi', category: 'Geometri 2D', name: 'Transformasi Geometri: Refleksi', description: 'Pencerminan bangun datar terhadap sumbu vertikal atau horizontal', sampleParams: { sumbu: 'vertikal' } },
    { id: 'transformasi_translasi', category: 'Geometri 2D', name: 'Transformasi Geometri: Translasi', description: 'Pergeseran bangun datar sejauh vektor translasi pada bidang berpetak', sampleParams: { dx: 3, dy: 2 } },
    { id: 'segi_enam_beraturan', category: 'Geometri 2D', name: 'Segi Enam Beraturan (Heksagon)', description: 'Poligon heksagon dengan 6 sisi sama panjang dan sudut dalam 120°', sampleParams: { s: 8 } },

    // 3. Bilangan, Nilai Tempat & Aljabar Visual (9 Items)
    { id: 'blok_dienes', category: 'Matematika Bilangan', name: 'Blok Dienes (Nilai Tempat)', description: 'Representasi blok kubus ribuan, lempeng ratusan, batang puluhan, dan kubus satuan', sampleParams: { ribuan: 1, ratusan: 2, puluhan: 4, satuan: 5 } },
    { id: 'sempoa_abakus', category: 'Matematika Bilangan', name: 'Sempoa / Abakus (Soroban)', description: 'Manik-manik sempoa Jepang 4 tiang nilai tempat (ribuan hingga satuan)', sampleParams: { nilai: '3527' } },
    { id: 'tabel_nilai_tempat', category: 'Matematika Bilangan', name: 'Tabel Analisis Nilai Tempat', description: 'Tabel kolom nilai tempat bilangan dari ratus ribuan hingga persepuluhan', sampleParams: { angka: '47285' } },
    { id: 'garis_bilangan_pecahan', category: 'Pecahan', name: 'Garis Bilangan Pecahan', description: 'Garis bilangan bersubdivisi pecahan dengan titik target [X]', sampleParams: { penyebut: 4, target: 3 } },
    { id: 'garis_bilangan_desimal', category: 'Pecahan', name: 'Garis Bilangan Desimal', description: 'Garis bilangan desimal dengan skala persepuluhan dan target [X]', sampleParams: { min: 1.0, max: 2.0, target: 1.7 } },
    { id: 'perkalian_lattice', category: 'Matematika Bilangan', name: 'Perkalian Metode Kisi (Lattice)', description: 'Metode perkalian kisi Napier 2×2 digit dengan garis diagonal sel puluhan/satuan', sampleParams: { num1: 34, num2: 25 } },
    { id: 'pola_ubin', category: 'Matematika Bilangan', name: 'Pola Barisan Ubin Geometris', description: 'Barisan visual ubin bertingkat Pola 1 hingga Pola 4 untuk aljabar urutan', sampleParams: { label: 'X' } },
    { id: 'pita_pecahan', category: 'Pecahan', name: 'Pita Pecahan Senilai (Fraction Strips)', description: 'Batang pecahan 1, 1/2, 1/4, 1/8 bertumpuk sejajar untuk mencari pecahan senilai', sampleParams: { label: 'X' } },
    { id: 'matriks_nilai_uang', category: 'Matematika Bilangan', name: 'Kombinasi Pecahan Uang Rupiah', description: 'Kumpulan uang kertas (Rp50.000, Rp20.000, Rp10.000) dan koin logam (Rp1.000, Rp500)', sampleParams: { label: 'X' } },

    // 4. Statistik Komparatif & Peluang (8 Items)
    { id: 'diagram_batang_ganda', category: 'Statistik', name: 'Diagram Batang Ganda', description: 'Perbandingan 2 kelompok data berdampingan per kategori dengan legenda', sampleParams: { label: 'X' } },
    { id: 'diagram_garis_ganda', category: 'Statistik', name: 'Diagram Garis Ganda', description: 'Perbandingan 2 tren garis perubahan data waktu dengan legenda', sampleParams: { label: 'X' } },
    { id: 'dot_plot', category: 'Statistik', name: 'Diagram Titik (Dot Plot)', description: 'Frekuensi sebaran data dengan tumpukan titik di atas garis bilangan', sampleParams: { label: 'X' } },
    { id: 'diagram_lingkaran_derajat', category: 'Statistik', name: 'Diagram Lingkaran Derajat (360°)', description: 'Pie chart dengan pembagian juring berbasis sudut derajat 360° dan target [X]', sampleParams: { label: 'X' } },
    { id: 'tabel_kontingensi', category: 'Statistik', name: 'Tabel Kontingensi Dua Arah', description: 'Tabel frekuensi data 2 variabel kategori dengan baris/kolom total dan sel target [X]', sampleParams: { label: 'X' } },
    { id: 'diagram_batang_horizontal', category: 'Statistik', name: 'Diagram Batang Mendatar', description: 'Diagram batang horizontal untuk perbandingan komoditas dengan garis skala', sampleParams: { label: 'X' } },
    { id: 'papan_galton_peluang', category: 'Statistik', name: 'Papan Galton Peluang Jalur Acak', description: 'Mesin Quincunx Galton dengan pasak segitiga dan kotak distribusi peluang di dasar', sampleParams: { label: 'X' } },
    { id: 'kartu_peluang', category: 'Statistik', name: 'Ruang Sampel Kartu Peluang', description: 'Kumpulan kartu bernomor acak untuk perhitungan peluang kejadian n(A)/n(S)', sampleParams: { label: 'X' } }
  ];
}
