/**
 * catalog.ts
 * Unified catalog of all 200 visual stimulus SVG templates
 */

import { VisualCatalogItem } from './types';

/**
 * Katalog lengkap 200 template visual stimulus SVG untuk API dan UI selector
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
    { id: 'siklus_air', category: 'Sains / IPAS', name: 'Siklus Air / Hidrologi Lengkap', description: 'Daur air lengkap (Siklus Pendek, Sedang, Panjang, Evaporasi, Transpirasi, Kondensasi, Presipitasi/Salju, Infiltrasi, Runoff, Air Tanah)', sampleParams: { pointer: 'evaporasi', label: 'X' } },
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
    { id: 'flowchart', category: 'Koding & Komputasi', name: 'Diagram Alir (Flowchart)', description: 'Diagram alir algoritma sederhana (mulai, input, keputusan, cabang ya/tidak, output, selesai)', sampleParams: { pointer: 'kondisi', label: 'X' } },
    { id: 'perisai_pancasila', category: 'Geometri 2D', name: 'Perisai Garuda Pancasila', description: 'Perisai 5 ruang simbol sila Pancasila dengan penunjuk sila target X', sampleParams: { sila: 1, label: 'X' } },

    // Pengukuran Tambahan (Stage 3)
    { id: 'termometer', category: 'Pengukuran', name: 'Termometer Suhu (°C)', description: 'Termometer skala Celsius dengan kolom cairan raksa/alkohol dan target X', sampleParams: { suhu: 35, unit: '°C', label: 'X' } },
    { id: 'gelas_ukur', category: 'Pengukuran', name: 'Gelas Ukur & Volume Archimedes', description: 'Pengukuran volume cairan dan kenaikan volume akibat batu tak beraturan (Archimedes)', sampleParams: { mode: 'batu', v1: 50, v2: 75, label: 'X' } },
    { id: 'pohon_faktor', category: 'Matematika Bilangan', name: 'Pohon Faktor (KPK & FPB)', description: 'Bagan pohon percabangan faktorisasi prima dengan lingkaran prima dan persegi komposit berlabel X', sampleParams: { bilangan: 24, targetNode: 'prima3', label: 'X' } },
    { id: 'grid_matriks_100', category: 'Pecahan', name: 'Grid 100 Desimal & Persen', description: 'Matriks petak 10×10 (100 sel) terarsir representasi nilai pecahan desimal dan persen', sampleParams: { diarsir: 35, label: 'X' } },

    // Bahasa, PJOK, Seni, PKn, English, & Koding (Stage 4)
    { id: 'rambu_lalu_lintas', category: 'Bahasa', name: 'Rambu Lalu Lintas', description: 'Simbol rambu lalu lintas larangan (merah), perintah (biru), peringatan (kuning), atau petunjuk', sampleParams: { kategori: 'larangan', jenis: 'dilarang_parkir', label: 'X' } },
    { id: 'piring_gizi_seimbang', category: 'PJOK & Kesehatan', name: 'Piring Makanku (Gizi Seimbang)', description: 'Bagan piring makan bergizi seimbang 4 porsi (pokok, sayur, lauk, buah) dan air putih', sampleParams: { pointer: 'makanan_pokok', label: 'X' } },
    { id: 'lapangan_olahraga', category: 'PJOK & Kesehatan', name: 'Denah Lapangan Olahraga', description: 'Denah garis batas dan zona lapangan sepak bola atau bola voli berlabel target X', sampleParams: { olahraga: 'sepak_bola', label: 'X' } },
    { id: 'preposition_place', category: 'Bahasa', name: 'Prepositions of Place', description: 'Visualisasi spasial posisi benda (in, on, under, between) dalam Bahasa Inggris', sampleParams: { posisi: 'on', label: 'X' } },
    { id: 'tangga_nada', category: 'Seni & Budaya (SBdP)', name: 'Garis Paranada & Tangga Nada', description: '5 garis paranada, kunci G, dan not balok diatonis C4 sampai C5 berlabel target X', sampleParams: { nadaTarget: 'G', label: 'X' } },
    { id: 'lingkaran_warna', category: 'Seni & Budaya (SBdP)', name: 'Lingkaran Warna Primer & Sekunder', description: 'Roda 6 warna juring percampuran primer dan sekunder berlabel target warna X', sampleParams: { pointer: 'sekunder', label: 'X' } },
    { id: 'struktur_pemda', category: 'Pancasila & Kewarganegaraan', name: 'Struktur Hirarki Pemda', description: 'Bagan hirarki pemerintahan daerah bertingkat dari Provinsi hingga RT berlabel target X', sampleParams: { targetLevel: 'kecamatan', label: 'X' } },
    { id: 'grid_maze_koding', category: 'Koding & Komputasi', name: 'Grid Maze Robot Koding', description: 'Labirin grid petak 4×4 dengan rintangan batu, goal bintang, dan kartu blok perintah', sampleParams: { label: 'X' } },

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
    { id: 'kartu_peluang', category: 'Statistik', name: 'Ruang Sampel Kartu Peluang', description: 'Kumpulan kartu bernomor acak untuk perhitungan peluang kejadian n(A)/n(S)', sampleParams: { label: 'X' } },

    // 5. IPAS Biologi, Anatomi Tubuh & Ekosistem (12 Items)
    { id: 'rangka_manusia', category: 'Sains / IPAS', name: 'Sistem Rangka Manusia', description: 'Siluet anatomi tulang rangka manusia (tengkorak, rusuk, paha, lengan, panggul) dengan target [X]', sampleParams: { pointer: 'tengkorak', label: 'X' } },
    { id: 'sendi_gerak', category: 'Sains / IPAS', name: 'Macam-Macam Sendi Gerak', description: '4 panel jenis persendian gerak (engsel, peluru, putar, pelana) dan arah pergerakannya', sampleParams: { pointer: 'engsel', label: 'X' } },
    { id: 'metamorfosis_katak', category: 'Sains / IPAS', name: 'Metamorfosis Sempurna Katak', description: 'Daur hidup katak lengkap dari telur, berudu, berudu berkaki, katak berekor, hingga dewasa', sampleParams: { pointer: 'berudu', label: 'X' } },
    { id: 'metamorfosis_nyamuk', category: 'Sains / IPAS', name: 'Metamorfosis Sempurna Nyamuk', description: 'Daur hidup nyamuk di air dan udara (telur rakit, jentik/larva, pupa koma, nyamuk dewasa)', sampleParams: { pointer: 'jentik', label: 'X' } },
    { id: 'paruh_burung', category: 'Sains / IPAS', name: 'Bentuk Adaptasi Paruh Burung', description: '4 macam paruh burung (elang pemakan daging, pipit pemecah biji, kolibri nektar, bebek penyaring)', sampleParams: { pointer: 'elang', label: 'X' } },
    { id: 'kaki_burung', category: 'Sains / IPAS', name: 'Bentuk Adaptasi Kaki & Cakar Burung', description: '4 tipe adaptasi cakar (pencengkeram elang, selaput renang bebek, pemanjat pelatuk, pengais ayam)', sampleParams: { pointer: 'cengkeram', label: 'X' } },
    { id: 'simbiosis', category: 'Sains / IPAS', name: 'Pola Interaksi Simbiosis', description: '3 kolom interaksi simbiosis mutualisme (+/+), komensalisme (+/0), dan parasitisme (+/-)', sampleParams: { tipe: 'mutualisme', label: 'X' } },
    { id: 'jaring_makanan_sawah', category: 'Sains / IPAS', name: 'Jaring-Jaring Makanan Ekosistem Sawah', description: 'Jaring-jaring makanan multi-rantai sawah dengan produsen, konsumen I, II, dan predator puncak', sampleParams: { pointer: 'katak', label: 'X' } },
    { id: 'adaptasi_tumbuhan', category: 'Sains / IPAS', name: 'Bentuk Adaptasi Morfologi Tumbuhan', description: '3 adaptasi tumbuhan xerofit (kaktus), hidrofit (teratai), dan insektivora (kantong semar)', sampleParams: { pointer: 'kaktus', label: 'X' } },
    { id: 'pernapasan_hewan', category: 'Sains / IPAS', name: 'Alat Pernapasan Khusus Hewan', description: '4 macam alat napas (trakea serangga, insang ikan, kulit basah cacing, pundi udara burung)', sampleParams: { pointer: 'insang', label: 'X' } },
    { id: 'perkembangbiakan_tumbuhan', category: 'Sains / IPAS', name: 'Perkembangbiakan Vegetatif Tumbuhan', description: '5 metode perkembangbiakan vegetatif alami (tunas, umbi batang, rizoma, geragih, spora)', sampleParams: { pointer: 'rhizoma', label: 'X' } },
    { id: 'sel_hewan_tumbuhan', category: 'Sains / IPAS', name: 'Perbandingan Sel Hewan vs Tumbuhan', description: 'Diagram komparasi organel dinding sel, kloroplas, vakuola sentral, dan inti sel nukleus', sampleParams: { pointer: 'kloroplas', label: 'X' } },

    // 6. IPAS Fisika, Energi, Optik & Kebumian (11 Items)
    { id: 'fase_bulan', category: 'Sains / IPAS', name: 'Fase-Fase Bulan Mengelilingi Bumi', description: 'Orbit 8 fase bulan mengelilingi bumi relatif terhadap arah datangnya sinar matahari', sampleParams: { pointer: 'purnama', label: 'X' } },
    { id: 'lapisan_bumi', category: 'Sains / IPAS', name: 'Struktur Lapisan Bumi', description: 'Potongan irisan lapisan bumi (kerak bumi, mantel, inti luar cair, inti dalam padat)', sampleParams: { pointer: 'mantel', label: 'X' } },
    { id: 'lapisan_tanah', category: 'Sains / IPAS', name: 'Profil Lapisan (Horizon) Tanah', description: 'Profil vertikal tanah dari Horizon O (organik), A (topsoil), B (subsoil), C (regolit), R (bedrock)', sampleParams: { pointer: 'topsoil', label: 'X' } },
    { id: 'baterai_buah', category: 'Sains / IPAS', name: 'Percobaan Listrik Baterai Buah', description: 'Sel volta buah lemon dengan elektrode seng (Zn), tembaga (Cu), kabel, dan lampu LED', sampleParams: { pointer: 'led', label: 'X' } },
    { id: 'optik_periskop', category: 'Sains / IPAS', name: 'Prinsip Kerja Optik Periskop', description: 'Tabung periskop berbentuk Z dengan dua cermin datar miring 45° dan lintasan berkas sinar merah', sampleParams: { pointer: 'cermin', label: 'X' } },
    { id: 'kaca_pembesar_lup', category: 'Sains / IPAS', name: 'Pembentukan Bayangan Pada Lup', description: 'Diagram sinar pembentukan bayangan maya, tegak, diperbesar pada lensa cembung kaca pembesar', sampleParams: { pointer: 'bayangan', label: 'X' } },
    { id: 'pemuaian_bimetal', category: 'Sains / IPAS', name: 'Prinsip Pemuaian Keping Bimetal', description: 'Perilaku keping bimetal pada suhu normal, saat dipanaskan (api), dan saat didinginkan (es)', sampleParams: { kondisi: 'panas', label: 'X' } },
    { id: 'gelombang_bunyi', category: 'Sains / IPAS', name: 'Karakteristik Gelombang Bunyi', description: 'Gelombang longitudinal garputala dengan zona rapatan, renggangan, dan panjang gelombang λ', sampleParams: { pointer: 'rapatan', label: 'X' } },
    { id: 'perubahan_energi', category: 'Sains / IPAS', name: 'Perubahan Bentuk Energi Peralatan', description: '4 panel konversi energi (panel surya, turbin air PLTA, setrika listrik, dan kipas angin)', sampleParams: { pointer: 'surya', label: 'X' } },
    { id: 'zona_waktu_indonesia', category: 'Sains / IPAS', name: 'Pembagian Tiga Zona Waktu Indonesia', description: 'Peta wilayah dan jam komparasi tiga zona waktu Indonesia: WIB (UTC+7), WITA (UTC+8), WIT (UTC+9)', sampleParams: { zona: 'wita', label: 'X' } },
    { id: 'siklus_batuan', category: 'Sains / IPAS', name: 'Siklus Pembentukan Batuan Bumi', description: 'Diagram alir siklus batuan (magma pijar, batuan beku, sedimen, dan metamorf/malihan)', sampleParams: { pointer: 'beku', label: 'X' } },

    // 7. IPS, PKn, Budaya, PJOK & Literasi (11 Items)
    { id: 'simbol_kartografi', category: 'Literasi & Sosial', name: 'Simbol Standar Peta (Kartografi)', description: '6 simbol peta konvensional (gunung api aktif/mati, sungai, danau, bandara, rel kereta api)', sampleParams: { pointer: 'gunung_aktif', label: 'X' } },
    { id: 'garis_lintang_bujur', category: 'Literasi & Sosial', name: 'Garis Lintang & Garis Bujur (Globe)', description: 'Globe bola dunia dengan garis khatulistiwa (0°), kutub utara/selatan, dan meridian Greenwich', sampleParams: { pointer: 'khatulistiwa', label: 'X' } },
    { id: 'rumah_adat_nusantara', category: 'Literasi & Sosial', name: 'Rumah Adat Tradisional Nusantara', description: '4 ragam arsitektur rumah adat (Rumah Gadang, Joglo, Tongkonan, dan Honai) dengan ciri khas atap', sampleParams: { pointer: 'gadang', label: 'X' } },
    { id: 'alat_musik_tradisional', category: 'Literasi & Sosial', name: 'Alat Musik Tradisional & Cara Main', description: '4 instrumen musik daerah (Angklung digoyang, Sasando dipetik, Tifa dipukul, Kolintang)', sampleParams: { pointer: 'angklung', label: 'X' } },
    { id: 'trias_politika', category: 'Literasi & Sosial', name: 'Sistem Trias Politika Indonesia', description: '3 pilar kekuasaan negara: Lembaga Legislatif (DPR/DPD/MPR), Eksekutif (Presiden), Yudikatif (MA/MK)', sampleParams: { pointer: 'legislatif', label: 'X' } },
    { id: 'alur_kegiatan_ekonomi', category: 'Literasi & Sosial', name: 'Alur Kegiatan Ekonomi Masyarakat', description: 'Rantai siklus ekonomi dari tahap produksi (produsen), distribusi (distributor), dan konsumsi', sampleParams: { pointer: 'distribusi', label: 'X' } },
    { id: 'norma_masyarakat', category: 'Literasi & Sosial', name: 'Empat Norma Kehidupan Masyarakat', description: '4 macam norma sosial (norma agama, kesusilaan, kesopanan, dan hukum) beserta sumber dan sanksinya', sampleParams: { pointer: 'hukum', label: 'X' } },
    { id: 'rambu_bahaya_lab', category: 'Literasi & Sosial', name: 'Simbol Bahaya Laboratorium IPA (K3)', description: '4 simbol bahaya GHS (mudah terbakar/flammable, korosif, beracun/toksik, dan biohazard hayati)', sampleParams: { pointer: 'flammable', label: 'X' } },
    { id: 'piramida_aktivitas_fisik', category: 'Literasi & Sosial', name: 'Piramida Aktivitas Fisik Sehat Anak', description: 'Tingkatan piramida gerak jasmani anak SD dari aktivitas rutin harian hingga pembatasan sedentari', sampleParams: { pointer: 'dasar', label: 'X' } },
    { id: 'lapangan_atletik', category: 'Literasi & Sosial', name: 'Denah Lapangan & Lintasan Atletik', description: 'Denah track atletik 400m dengan lintasan lari oval, sektor tolak peluru, dan bak lompat jauh', sampleParams: { pointer: 'lari', label: 'X' } },
    { id: 'diagram_mindmap_paragraf', category: 'Literasi & Sosial', name: 'Peta Konsep Struktur Gagasan Paragraf', description: 'Mind map struktur paragraf dengan gagasan pokok (ide utama) di tengah dan 4 gagasan pendukung', sampleParams: { pointer: 'pokok', label: 'X' } },

    // 8. Geometri Lanjut, Aljabar & Koding Scratch (11 Items)
    { id: 'sudut_berpelurus_berpenyiku', category: 'Geometri 2D', name: 'Sudut Berpelurus & Berpenyiku', description: 'Hubungan antarsudut suplemen (180°) dan komplemen (90°) dengan persamaan aljabar variabel x', sampleParams: { tipe: 'pelurus', label: 'X' } },
    { id: 'garis_sejajar_transversal', category: 'Geometri 2D', name: 'Garis Sejajar Dipotong Transversal', description: 'Sudut sehadap, berseberangan dalam/luar, dan sepihak pada dua garis sejajar yang dipotong transversal', sampleParams: { pointer: 'sehadap', label: 'X' } },
    { id: 'teorema_pythagoras', category: 'Geometri 2D', name: 'Pembuktian Grafis Teorema Pythagoras', description: 'Visualisasi pembuktian rumus a² + b² = c² menggunakan grid petak bujur sangkar 3×3, 4×4, 5×5', sampleParams: { a: 3, b: 4, label: 'X' } },
    { id: 'juring_busur_lingkaran', category: 'Geometri 2D', name: 'Unsur Juring & Busur Lingkaran', description: 'Daerah juring berarsir dan lengkungan busur lingkaran AB dengan sudut pusat α dan jari-jari r', sampleParams: { r: 14, sudut: 60, unit: 'cm', label: 'X' } },
    { id: 'segitiga_pascal', category: 'Matematika Bilangan', name: 'Pola Bilangan Segitiga Pascal', description: 'Piramida baris 1 sampai 6 bilangan segitiga Pascal dengan sel rumpang target [X]', sampleParams: { label: 'X' } },
    { id: 'skala_termometer_komparasi', category: 'Pengukuran', name: 'Perbandingan 4 Skala Termometer', description: '4 termometer sejajar (Celsius, Reamur, Fahrenheit, Kelvin) dengan rasio 5 : 4 : 9 : 5 dan target [X]', sampleParams: { suhuC: 50, pointer: 'fahrenheit', label: 'X' } },
    { id: 'diagram_batang_daun', category: 'Statistik', name: 'Diagram Batang dan Daun (Stem-and-Leaf)', description: 'Tabel sebaran data kuantitatif dengan kolom puluhan (batang) dan satuan (daun) berlabel kunci', sampleParams: { label: 'X' } },
    { id: 'diagram_box_plot', category: 'Statistik', name: 'Diagram Kotak Garis (Box Plot)', description: 'Representasi 5 serangkai (minimum, Q1, median Q2, Q3, maksimum) dengan jangkauan interkuartil', sampleParams: { min: 20, q1: 35, q2: 50, q3: 70, max: 85, label: 'X' } },
    { id: 'pohon_peluang', category: 'Statistik', name: 'Diagram Pohon Peluang Koin', description: 'Bagan pohon probabilitas dua tahap pelemparan koin dengan titik sampel (AA, AG, GA, GG)', sampleParams: { label: 'X' } },
    { id: 'koding_blok_percabangan', category: 'Koding & Komputasi', name: 'Koding Scratch: Blok Percabangan', description: 'Visual blok C-block Scratch logika if-else (jika ... maka ... jika tidak ...) dengan target [X]', sampleParams: { kondisi: 'nilai > 75', label: 'X' } },
    { id: 'koding_blok_perulangan', category: 'Koding & Komputasi', name: 'Koding Scratch: Blok Perulangan (Loop)', description: 'Visual blok Scratch loop repeat (ulangi N kali) untuk menggambar bangun datar geometri beraturan', sampleParams: { loopCount: 4, label: 'X' } },

    // 9. Batch 3: IPAS Biologi Lanjut, Ekosistem & Anatomi (12 Items)
    { id: 'rantai_makanan_laut', category: 'Sains / IPAS', name: 'Rantai Makanan Ekosistem Laut', description: 'Rantai trofik ekosistem laut (fitoplankton, zooplankton, ikan kecil, ikan besar/predator puncak)', sampleParams: { pointer: 'ikan_kecil', label: 'X' } },
    { id: 'rantai_makanan_hutan', category: 'Sains / IPAS', name: 'Rantai Makanan Ekosistem Hutan', description: 'Rantai aliran energi tropis hutan (rumput/pohon, rusa/herbivora, harimau/karnivora, bakteri pengurai)', sampleParams: { pointer: 'harimau', label: 'X' } },
    { id: 'daur_hidup_kupu_detail', category: 'Sains / IPAS', name: 'Metamorfosis Kupu-Kupu (Detail Metamorfosis Sempurna)', description: 'Siklus hidup kupu-kupu komprehensif (telur, ulat/larva rakus, kepompong/krisalis pupa, imago cantik)', sampleParams: { pointer: 'pupa', label: 'X' } },
    { id: 'daur_hidup_belalang', category: 'Sains / IPAS', name: 'Metamorfosis Tidak Sempurna Belalang', description: 'Daur hidup hemimetabola belalang dari telur, nimfa tanpa sayap, nimfa bersayap kecil, imago dewasa', sampleParams: { pointer: 'nimfa', label: 'X' } },
    { id: 'daur_hidup_kecoa', category: 'Sains / IPAS', name: 'Metamorfosis Tidak Sempurna Kecoa', description: 'Daur hidup kecoa hemimetabola dari ooteka/kapsul telur, nimfa muda, nimfa instar lanjut, kecoa dewasa', sampleParams: { pointer: 'ooteka', label: 'X' } },
    { id: 'bagian_akar_tumbuhan', category: 'Sains / IPAS', name: 'Struktur Anatomi Akar Tumbuhan', description: 'Penampang longitudinal akar (rambut/bulu akar, tudung akar/kaliptra, zona diferensiasi & pemanjangan)', sampleParams: { pointer: 'tudung_akar', label: 'X' } },
    { id: 'bagian_batang_dikotil_monokotil', category: 'Sains / IPAS', name: 'Komparasi Batang Dikotil vs Monokotil', description: 'Irisan melintang berkas pengangkut xilem-floem teratur melingkar berkambium (dikotil) vs tersebar (monokotil)', sampleParams: { pointer: 'kambium', label: 'X' } },
    { id: 'bagian_daun_anatomi', category: 'Sains / IPAS', name: 'Struktur Jaringan Anatomi Daun', description: 'Lapisan penampang daun (kutikula, epidermis atas, jaringan tiang/palisade kloroplas, jaringan bunga karang, stomata)', sampleParams: { pointer: 'palisade', label: 'X' } },
    { id: 'alat_ekskresi_ginjal', category: 'Sains / IPAS', name: 'Anatomi Organ Ekskresi Ginjal', description: 'Irisan melintang ginjal manusia (korteks renalis, medula/piramida ginjal, pelvis renalis, dan ureter)', sampleParams: { pointer: 'korteks', label: 'X' } },
    { id: 'piramida_makanan_ekologi', category: 'Sains / IPAS', name: 'Piramida Makanan & Tingkat Trofik Ekologi', description: 'Tingkat trofik piramida biomassa/energi (Produsen dasar, Konsumen Primer I, Sekunder II, Tersier III)', sampleParams: { pointer: 'konsumen1', label: 'X' } },
    { id: 'indra_pengecap_lidah', category: 'Sains / IPAS', name: 'Peta Reseptor Papila Indra Pengecap Lidah', description: 'Zona kepekaan rasa papila lidah (manis di ujung, asin di tepi depan, asam di tepi samping, pahit di pangkal)', sampleParams: { pointer: 'pahit', label: 'X' } },
    { id: 'indra_pembau_hidung', category: 'Sains / IPAS', name: 'Struktur Organ Indra Pembau (Hidung)', description: 'Rongga hidung, epitel olfaktori penerima rangsang bau, silia sensori, dan serabut saraf pembau ke otak', sampleParams: { pointer: 'olfaktori', label: 'X' } },

    // 10. Batch 3: IPAS Fisika, Gaya, Energi Terbarukan & Astronomi (11 Items)
    { id: 'macam_macam_gaya', category: 'Sains / IPAS', name: 'Macam-Macam Pengaruh Gaya Fisika', description: '4 ilustrasi ragam gaya: gaya otot memanah, gaya pegas busur, gaya gesek rem ban, gaya gravitasi buah jatuh', sampleParams: { pointer: 'otot', label: 'X' } },
    { id: 'pesawat_sederhana_bidang_miring', category: 'Sains / IPAS', name: 'Prinsip Pesawat Sederhana Bidang Miring', description: 'Rampa miring panjang s dan ketinggian h dengan keuntungan mekanis KM = s/h', sampleParams: { pointer: 's', label: 'X' } },
    { id: 'pesawat_sederhana_roda_berporos', category: 'Sains / IPAS', name: 'Prinsip Roda Berporos & Gandar', description: 'Sistem gir roda berporos dengan perbandingan jari-jari roda R dan jari-jari gandar r (KM = R/r)', sampleParams: { pointer: 'roda', label: 'X' } },
    { id: 'pembangkit_listrik_plta', category: 'Sains / IPAS', name: 'Skema Pembangkit Listrik Tenaga Air (PLTA)', description: 'Diagram alir PLTA dari waduk/bendungan, pipa pesat penstock, turbin air, generator, dan transformator listrik', sampleParams: { pointer: 'turbin', label: 'X' } },
    { id: 'panel_surya_plts', category: 'Sains / IPAS', name: 'Skema Pembangkit Surya Fotovoltaik (PLTS)', description: 'Alur sel surya fotovoltaik PV menyerap foton, charge controller, inverter DC-to-AC, baterai, dan beban rumah', sampleParams: { pointer: 'inverter', label: 'X' } },
    { id: 'energi_angin_pltb', category: 'Sains / IPAS', name: 'Skema Turbin Angin Pembangkit Listrik (PLTB)', description: 'Komponen kincir angin raksasa (bilah sudu kincir, rotor hub, gearbox percepatan putar, generator, dan tiang)', sampleParams: { pointer: 'generator', label: 'X' } },
    { id: 'termos_air_panas', category: 'Sains / IPAS', name: 'Prinsip Kerja & Struktur Tabung Termos Air', description: 'Lapisan dinding kaca cermin pantul radiasi, ruang hampa udara isolator konveksi/konduksi, dan sumbat gabus', sampleParams: { pointer: 'vakum', label: 'X' } },
    { id: 'perpindahan_panas_konduksi_konveksi_radiasi', category: 'Sains / IPAS', name: 'Tiga Jalur Perpindahan Kalor Panas', description: 'Simulasi memasak air: konduksi gagang logam, konveksi arus fluida air bergolak, dan radiasi pancaran bara api', sampleParams: { pointer: 'konveksi', label: 'X' } },
    { id: 'gerak_semu_matahari', category: 'Sains / IPAS', name: 'Gerak Semu Harian & Tahunan Matahari', description: 'Lintasan tahunan matahari bergeser dari khatulistiwa (0°), garis balik utara (23,5° LU), dan selatan (23,5° LS)', sampleParams: { pointer: 'utara', label: 'X' } },
    { id: 'musim_dan_revolusi_bumi', category: 'Sains / IPAS', name: 'Empat Musim Akibat Kemiringan Sumbu & Revolusi Bumi', description: 'Orbit elips bumi miring 23,5° dengan posisi 21 Maret, 21 Juni (solstice), 23 September, dan 22 Desember', sampleParams: { pointer: 'juni', label: 'X' } },
    { id: 'siklus_karbon_oksigen', category: 'Sains / IPAS', name: 'Siklus Timbal Balik Karbon & Oksigen', description: 'Keseimbangan biosfer antara fotosintesis tumbuhan hijau (serap CO₂, lepas O₂) dan respirasi makhluk hidup', sampleParams: { pointer: 'fotosintesis', label: 'X' } },

    // 11. Batch 3: IPS, Sejarah, Budaya, Literasi & Seni (11 Items)
    { id: 'garis_wallace_weber', category: 'Literasi & Sosial', name: 'Garis Wallace dan Weber Persebaran Fauna Indonesia', description: 'Peta zona fauna Asiatis Barat, Peralihan/Wallacea tengah (anoa, komodo), dan Australis Timur (kasuari, cendrawasih)', sampleParams: { pointer: 'peralihan', label: 'X' } },
    { id: 'candi_dan_peninggalan_sejarah', category: 'Literasi & Sosial', name: 'Komparasi Candi Hindu vs Candi Buddha', description: 'Perbedaan arsitektur candi langsing berundak ratna/lingga (Hindu) vs tambun stupa bertingkat kamadhatu-arapadhatu (Buddha)', sampleParams: { pointer: 'stupa', label: 'X' } },
    { id: 'motif_batik_nusantara', category: 'Literasi & Sosial', name: 'Ragam Motif Batik Nusantara', description: '4 pola batik klasik Indonesia (Parang Rusak, Mega Mendung Cirebon, Kawung Mataram, dan Ceplok)', sampleParams: { pointer: 'megamendung', label: 'X' } },
    { id: 'senjata_tradisional_nusantara', category: 'Literasi & Sosial', name: 'Ragam Senjata Tradisional Nusantara', description: '4 senjata pusaka adat daerah (Keris Jawa bertaji luk, Rencong Aceh, Kujang Sunda, dan Mandau Dayak)', sampleParams: { pointer: 'keris', label: 'X' } },
    { id: 'tarian_daerah_nusantara', category: 'Literasi & Sosial', name: 'Ragam Tarian Tradisional Nusantara', description: '4 tarian daerah (Tari Saman Aceh serempak, Tari Piring Minang, Tari Pendet Bali sajen, Tari Jaipong Jawa Barat)', sampleParams: { pointer: 'saman', label: 'X' } },
    { id: 'piramida_penduduk', category: 'Literasi & Sosial', name: 'Diagram Piramida Penduduk (Demografi)', description: 'Komposisi piramida demografi ekspansif usia muda lebar vs usia tua mengerucut dengan sumbu pria & wanita', sampleParams: { pointer: 'muda', label: 'X' } },
    { id: 'struktur_fabel_alur_cerita', category: 'Literasi & Sosial', name: 'Struktur Teks Cerita Fabel / Narasi Alur', description: 'Bagan alur naratif fabel: Orientasi pengenalan, Komplikasi konflik puncak/klimaks, Resolusi penyelesaian, Koda amanat', sampleParams: { pointer: 'komplikasi', label: 'X' } },
    { id: 'jenis_paragraf_induktif_deduktif', category: 'Literasi & Sosial', name: 'Jenis Paragraf: Deduktif, Induktif, Campuran', description: 'Struktur penempatan ide pokok kalimat utama: di awal paragraf (deduktif), di akhir (induktif), atau diawal & diakhir', sampleParams: { pointer: 'deduktif', label: 'X' } },
    { id: 'unsur_iklan_media_cetak', category: 'Literasi & Sosial', name: 'Unsur-Unsur Efektif Iklan Media Cetak', description: 'Komponen poster iklan: headline judul persuasif, gambar ilustrasi visual memikat, keunggulan produk, call to action', sampleParams: { pointer: 'headline', label: 'X' } },
    { id: 'pohon_keluarga_genealogi', category: 'Literasi & Sosial', name: 'Diagram Pohon Silsilah Keluarga (Genealogi)', description: 'Silsilah garis keturunan tiga generasi (kakek/nenek, ayah/ibu & paman/bibi, anak & sepupu) dengan target [X]', sampleParams: { pointer: 'ayah', label: 'X' } },
    { id: 'koperasi_sekolah', category: 'Literasi & Sosial', name: 'Struktur Organisasi & Nilai Koperasi Sekolah', description: 'Bagan organisasi koperasi: Rapat Anggota, Pengurus, Pengawas, Bidang Toko & Simpan Pinjam, pembagian SHU', sampleParams: { pointer: 'pengurus', label: 'X' } },

    // 12. Batch 3: Geometri, Logika, Pengukuran & Koding (11 Items)
    { id: 'sudut_luar_segitiga', category: 'Geometri 2D', name: 'Teorema Sudut Luar Segitiga', description: 'Visualisasi sudut luar segitiga sama dengan jumlah dua sudut dalam yang tidak bersisian (d = a + b)', sampleParams: { a: 50, b: 60, label: 'X' } },
    { id: 'jaring_kerucut', category: 'Geometri 3D', name: 'Jaring-Jaring Kerucut Lengkap', description: 'Bentangan selimut juring kerucut dengan garis pelukis s dan lingkaran alas berjari-jari r', sampleParams: { r: 7, s: 20, label: 'X' } },
    { id: 'jaring_tabung', category: 'Geometri 3D', name: 'Jaring-Jaring Tabung (Silinder)', description: 'Bentangan dua lingkaran tutup/alas dan persegi panjang selimut tabung dengan panjang 2πr dan tinggi t', sampleParams: { r: 5, t: 12, label: 'X' } },
    { id: 'luas_permukaan_gabungan', category: 'Geometri 3D', name: 'Bangun Ruang Gabungan (Balok + Limas)', description: 'Bangun ruang majemuk rumah balok kubus beratap limas piramida dengan dimensi gabungan', sampleParams: { s: 8, tLimas: 6, label: 'X' } },
    { id: 'diagram_alur_logika_gerbang', category: 'Koding & Komputasi', name: 'Diagram Alur Logika (Flowchart & Gerbang)', description: 'Bagan alir logika standar (Start/Stop kapsul oval, Input/Output jajar genjang, Proses persegi, Keputusan belah ketupat)', sampleParams: { pointer: 'decision', label: 'X' } },
    { id: 'koding_variabel_operator', category: 'Koding & Komputasi', name: 'Koding Scratch: Blok Operator & Variabel', description: 'Visual balok Scratch operasi matematika (+, -, *, /) dan variabel nilai skor dengan target rumpang [X]', sampleParams: { label: 'X' } },
    { id: 'garis_bilangan_bulat_operasi', category: 'Matematika Bilangan', name: 'Operasi Penjumlahan Garis Bilangan Bulat', description: 'Representasi operasi penjumlahan dan pengurangan bilangan bulat positif dan negatif dengan panah berarah berurutan', sampleParams: { a: 3, b: -5, label: 'X' } },
    { id: 'pecahan_desimal_persen_senilai', category: 'Matematika Bilangan', name: 'Tiga Bentuk Nilai Senilai (Pecahan, Desimal, Persen)', description: 'Tabel visual representasi ekuivalen: pecahan biasa, desimal persepuluhan/perseratusan, dan persen %', sampleParams: { label: 'X' } },
    { id: 'jam_digital_komparasi', category: 'Pengukuran', name: 'Komparasi Jam Analog vs Jam Digital 24 Jam', description: 'Visual perbandingan jam jarum dinding dengan display LED digital format 12/24 jam', sampleParams: { jam: 14, menit: 45, label: 'X' } },
    { id: 'diagram_sankey_energi', category: 'Sains / IPAS', name: 'Diagram Alir Energi (Sankey Diagram)', description: 'Bagan aliran konservasi energi input masuk terbagi menjadi energi berguna output dan energi terbuang (kalor)', sampleParams: { input: 100, berguna: 25, terbuang: 75, label: 'X' } },
    { id: 'skala_peta_batang', category: 'Pengukuran', name: 'Pengukuran Skala Grafis Peta Batang', description: 'Skala batang grafis peta dengan segmen blok hitam-putih konversi jarak peta (cm) ke jarak sebenarnya (km)', sampleParams: { label: 'X' } }
  ];
}
