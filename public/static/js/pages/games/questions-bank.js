/**
 * questions-bank.js — Bank Soal Terstruktur Berjenjang (Kurikulum Merdeka)
 * Mendukung Fase A (Kelas 1–2), Fase B (Kelas 3–4), dan Fase C (Kelas 5–6)
 * Masing-masing memiliki 3 Tingkat (Mudah, Sedang, Hebat) dengan 5 Paket Soal Mandiri.
 * Digunakan oleh Ular Tangga, Tarik Tambang, Cari Kata, dan game edukasi lainnya.
 */

export const TIERED_QUESTION_BANK = {
  // ══════════════════════════════════════════════════════════════════════════
  // FASE A: KELAS 1–2 SD (Konkret, Visual, Pengenalan Diri & Alam Sekitar)
  // ══════════════════════════════════════════════════════════════════════════
  'fase-a': {
    'mudah': [
      // Paket 1: Benda & Hewan di Sekitar Kita
      [
        { q: "Hewan yang bersuara 'meong' dan berkaki empat adalah...", a: "Kucing", opts: ["Kucing", "Ayam", "Kambing", "Bebek"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 3 + 2?", a: "5", opts: ["4", "5", "6", "7"], mapel: "Matematika" },
        { q: "Mata kita berguna untuk...", a: "Melihat", opts: ["Melihat", "Mendengar", "Mencium", "Meraba"], mapel: "IPAS" },
        { q: "Benda yang kita pakai untuk menulis di buku adalah...", a: "Pensil", opts: ["Pensil", "Penggaris", "Penghapus", "Tas"], mapel: "B. Indonesia" },
        { q: "Warna bendera negara Indonesia adalah...", a: "Merah dan Putih", opts: ["Merah dan Putih", "Merah dan Biru", "Kuning dan Hijau", "Putih dan Hitam"], mapel: "Pancasila" },
        { q: "Berapakah hasil dari 6 - 2?", a: "4", opts: ["3", "4", "5", "6"], mapel: "Matematika" }
      ],
      // Paket 2: Angka Dasar & Buah-buahan
      [
        { q: "Buah yang kulitnya berwarna kuning dan disukai monyet adalah...", a: "Pisang", opts: ["Pisang", "Apel", "Semangka", "Jeruk"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 4 + 4?", a: "8", opts: ["6", "7", "8", "9"], mapel: "Matematika" },
        { q: "Telinga berguna untuk...", a: "Mendengar", opts: ["Mendengar", "Melihat", "Mengecap", "Berlari"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 10 - 5?", a: "5", opts: ["4", "5", "6", "7"], mapel: "Matematika" },
        { q: "Sebelum makan kita harus...", a: "Cuci Tangan", opts: ["Cuci Tangan", "Langsung Tidur", "Menangis", "Bermain Bola"], mapel: "Pancasila" },
        { q: "Hewan yang hidup di air dan berenang adalah...", a: "Ikan", opts: ["Ikan", "Burung", "Kucing", "Kelinci"], mapel: "IPAS" }
      ],
      // Paket 3: Keluarga & Rumah Kita
      [
        { q: "Ibu dari ayah atau ibu kita sebut...", a: "Nenek", opts: ["Nenek", "Kakek", "Tante", "Paman"], mapel: "B. Indonesia" },
        { q: "Berapakah hasil dari 5 + 3?", a: "8", opts: ["7", "8", "9", "10"], mapel: "Matematika" },
        { q: "Ruangan di rumah tempat memasak makanan adalah...", a: "Dapur", opts: ["Dapur", "Kamar Mandi", "Kamar Tidur", "Garasi"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 7 - 3?", a: "4", opts: ["3", "4", "5", "6"], mapel: "Matematika" },
        { q: "Simbol sila ke-1 Pancasila adalah...", a: "Bintang", opts: ["Bintang", "Rantai", "Pohon Beringin", "Kepala Banteng"], mapel: "Pancasila" },
        { q: "Hewan yang memiliki belalai panjang adalah...", a: "Gajah", opts: ["Gajah", "Jerapah", "Kuda", "Sapi"], mapel: "IPAS" }
      ],
      // Paket 4: Warna, Bentuk & Waktu Sederhana
      [
        { q: "Bentuk uang koin logam biasanya adalah...", a: "Lingkaran", opts: ["Lingkaran", "Segitiga", "Kotak", "Bintang"], mapel: "Matematika" },
        { q: "Matahari terbit di waktu...", a: "Pagi Hari", opts: ["Pagi Hari", "Siang Hari", "Malam Hari", "Sore Hari"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 2 + 7?", a: "9", opts: ["8", "9", "10", "11"], mapel: "Matematika" },
        { q: "Daun pohon yang sehat umumnya berwarna...", a: "Hijau", opts: ["Hijau", "Merah", "Biru", "Hitam"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 9 - 4?", a: "5", opts: ["4", "5", "6", "7"], mapel: "Matematika" },
        { q: "Sikap saat bertemu guru di sekolah adalah...", a: "Memberi Salam", opts: ["Memberi Salam", "Lari Menghindar", "Berteriak", "Diam Saja"], mapel: "Pancasila" }
      ],
      // Paket 5: Panca Indra & Kebersihan Tubuh
      [
        { q: "Bagian tubuh yang berguna untuk mencium bau wangi adalah...", a: "Hidung", opts: ["Hidung", "Telinga", "Lidah", "Mata"], mapel: "IPAS" },
        { q: "Menggosok gigi sebaiknya menggunakan...", a: "Sikat Gigi & Pasta Gigi", opts: ["Sikat Gigi & Pasta Gigi", "Sabun Mandi", "Sampo", "Minyak Goreng"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 6 + 3?", a: "9", opts: ["7", "8", "9", "10"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 8 - 5?", a: "3", opts: ["2", "3", "4", "5"], mapel: "Matematika" },
        { q: "Lidah kita berguna untuk...", a: "Mengecap Rasa", opts: ["Mengecap Rasa", "Melihat", "Mendengar", "Meraba"], mapel: "IPAS" },
        { q: "Sampah harus dibuang ke...", a: "Tempat Sampah", opts: ["Tempat Sampah", "Sungai", "Halaman Kelas", "Bawah Meja"], mapel: "Pancasila" }
      ]
    ],
    'sedang': [
      // Paket 1: Aturan Sekolah & Lingkungan
      [
        { q: "Berapakah hasil dari 12 + 6?", a: "18", opts: ["16", "17", "18", "19"], mapel: "Matematika" },
        { q: "Matahari terbit di sebelah...", a: "Timur", opts: ["Timur", "Barat", "Utara", "Selatan"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 15 - 7?", a: "8", opts: ["6", "7", "8", "9"], mapel: "Matematika" },
        { q: "Hewan yang menghasilkan telur dan berkokok adalah...", a: "Ayam", opts: ["Ayam", "Bebek", "Kambing", "Kelinci"], mapel: "IPAS" },
        { q: "Lambang sila ke-2 Pancasila adalah...", a: "Rantai Emas", opts: ["Rantai Emas", "Bintang", "Pohon Beringin", "Kepala Banteng"], mapel: "Pancasila" },
        { q: "Jika ada teman yang terjatuh, sikap kita adalah...", a: "Menolongnya", opts: ["Menolongnya", "Menertawakannya", "Membiarkannya", "Mengejeknya"], mapel: "Pancasila" }
      ],
      // Paket 2: Tumbuhan & Sumber Air
      [
        { q: "Bagian tumbuhan yang berada di dalam tanah adalah...", a: "Akar", opts: ["Akar", "Daun", "Bunga", "Buah"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 14 + 8?", a: "22", opts: ["20", "21", "22", "23"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 20 - 8?", a: "12", opts: ["10", "11", "12", "13"], mapel: "Matematika" },
        { q: "Air hujan berasal dari...", a: "Awan di Langit", opts: ["Awan di Langit", "Tanah", "Bawah Pohon", "Batu"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 2 × 5?", a: "10", opts: ["8", "10", "12", "15"], mapel: "Matematika" },
        { q: "Bhinneka Tunggal Ika ada pada cengkeraman kaki...", a: "Burung Garuda", opts: ["Burung Garuda", "Harimau", "Gajah", "Banteng"], mapel: "Pancasila" }
      ],
      // Paket 3: Waktu, Kalender & Pengukuran
      [
        { q: "Satu minggu terdiri dari berapa hari?", a: "7 Hari", opts: ["5 Hari", "6 Hari", "7 Hari", "8 Hari"], mapel: "Matematika" },
        { q: "Hari setelah hari Selasa adalah hari...", a: "Rabu", opts: ["Rabu", "Kamis", "Senin", "Jumat"], mapel: "B. Indonesia" },
        { q: "Berapakah hasil dari 9 + 8?", a: "17", opts: ["15", "16", "17", "18"], mapel: "Matematika" },
        { q: "Benda yang berbunyi saat waktu bangun tidur adalah...", a: "Jam Weker", opts: ["Jam Weker", "Kompor", "Kipas Angin", "Kulkas"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 18 - 9?", a: "9", opts: ["8", "9", "10", "11"], mapel: "Matematika" },
        { q: "Sila ke-3 Pancasila berbunyi...", a: "Persatuan Indonesia", opts: ["Persatuan Indonesia", "Ketuhanan Yang Maha Esa", "Kemanusiaan yang Adil", "Keadilan Sosial"], mapel: "Pancasila" }
      ],
      // Paket 4: Mengenal Pekerjaan & Profesi
      [
        { q: "Orang yang bertugas mengemudikan pesawat terbang adalah...", a: "Pilot", opts: ["Pilot", "Masinis", "Nahkoda", "Sopir"], mapel: "IPAS" },
        { q: "Orang yang bertugas memeriksa orang sakit adalah...", a: "Dokter", opts: ["Dokter", "Polisi", "Petani", "Guru"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 13 + 9?", a: "22", opts: ["21", "22", "23", "24"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 25 - 6?", a: "19", opts: ["17", "18", "19", "20"], mapel: "Matematika" },
        { q: "Simbol sila ke-3 Pancasila adalah...", a: "Pohon Beringin", opts: ["Pohon Beringin", "Bintang", "Rantai", "Padi dan Kapas"], mapel: "Pancasila" },
        { q: "Berapakah hasil dari 3 × 3?", a: "9", opts: ["6", "8", "9", "12"], mapel: "Matematika" }
      ],
      // Paket 5: Hewan dan Lingkungan Hidup
      [
        { q: "Hewan yang menghasilkan madu manis adalah...", a: "Lebah", opts: ["Lebah", "Kupu-kupu", "Semut", "Lalat"], mapel: "IPAS" },
        { q: "Katak bergerak dengan cara...", a: "Melompat", opts: ["Melompat", "Terbang", "Merayap", "Berenang saja"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 16 + 7?", a: "23", opts: ["21", "22", "23", "24"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 30 - 12?", a: "18", opts: ["16", "17", "18", "19"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 4 × 2?", a: "8", opts: ["6", "7", "8", "10"], mapel: "Matematika" },
        { q: "Dasar negara Indonesia dinamakan...", a: "Pancasila", opts: ["Pancasila", "UUD 1945", "Garuda", "Merah Putih"], mapel: "Pancasila" }
      ]
    ],
    'hebat': [
      // Paket 1: Soal Cerita & Logika Matematika
      [
        { q: "Budi punya 12 permen, lalu diberi 8 permen oleh Ibu. Berapa permen Budi sekarang?", a: "20", opts: ["18", "19", "20", "22"], mapel: "Matematika" },
        { q: "Siti memiliki 25 pensil, dipinjam teman 7 pensil. Berapa sisa pensil Siti?", a: "18", opts: ["16", "17", "18", "19"], mapel: "Matematika" },
        { q: "Perubahan uap air menjadi titik-titik air disebut...", a: "Mengembun", opts: ["Mengembun", "Mencair", "Membeku", "Menguap"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 5 × 4?", a: "20", opts: ["15", "18", "20", "24"], mapel: "Matematika" },
        { q: "Simbol sila ke-4 Pancasila adalah...", a: "Kepala Banteng", opts: ["Kepala Banteng", "Pohon Beringin", "Padi dan Kapas", "Bintang"], mapel: "Pancasila" },
        { q: "Hewan yang memakan rumput dan menghasilkan susu segar adalah...", a: "Sapi", opts: ["Sapi", "Harimau", "Kucing", "Serigala"], mapel: "IPAS" }
      ],
      // Paket 2: Waktu, Uang & Nilai Pecahan Sederhana
      [
        { q: "Jika sekarang jam 07.00, maka 3 jam kemudian adalah jam...", a: "10.00", opts: ["09.00", "10.00", "11.00", "12.00"], mapel: "Matematika" },
        { q: "Dua lembar uang dua ribuan bernilai sama dengan...", a: "Rp 4.000", opts: ["Rp 3.000", "Rp 4.000", "Rp 5.000", "Rp 2.000"], mapel: "Matematika" },
        { q: "Benda yang dapat ditarik oleh magnet adalah...", a: "Paku Besi", opts: ["Paku Besi", "Kertas", "Penghapus Karet", "Penggaris Plastik"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 4 × 5?", a: "20", opts: ["16", "20", "24", "25"], mapel: "Matematika" },
        { q: "Sila ke-5 Pancasila disimbolkan dengan...", a: "Padi dan Kapas", opts: ["Padi dan Kapas", "Bintang", "Rantai Emas", "Kepala Banteng"], mapel: "Pancasila" },
        { q: "Tumbuhan bernapas mengambil oksigen dan melepaskan...", a: "Karbondioksida", opts: ["Karbondioksida", "Air", "Cahaya", "Tanah"], mapel: "IPAS" }
      ],
      // Paket 3: Sains Alam & Lingkungan Nusantara
      [
        { q: "Planet tempat manusia dan makhluk hidup tinggal bernama...", a: "Bumi", opts: ["Bumi", "Mars", "Jupiter", "Bulan"], mapel: "IPAS" },
        { q: "Ibukota negara Indonesia yang berada di pulau Jawa adalah...", a: "Jakarta", opts: ["Jakarta", "Surabaya", "Bandung", "Medan"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 3 × 6?", a: "18", opts: ["15", "16", "18", "21"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 50 - 15?", a: "35", opts: ["30", "35", "40", "45"], mapel: "Matematika" },
        { q: "Lagu kebangsaan negara Indonesia adalah...", a: "Indonesia Raya", opts: ["Indonesia Raya", "Garuda Pancasila", "Hari Merdeka", "Bagimu Negeri"], mapel: "Pancasila" },
        { q: "Es batu yang diletakkan di tempat panas akan...", a: "Mencair", opts: ["Mencair", "Membeku", "Menguap", "Menyublim"], mapel: "IPAS" }
      ],
      // Paket 4: Pengukuran, Jam & Satuan
      [
        { q: "Satu jam terdiri dari berapa menit?", a: "60 Menit", opts: ["30 Menit", "50 Menit", "60 Menit", "100 Menit"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 28 + 14?", a: "42", opts: ["40", "41", "42", "44"], mapel: "Matematika" },
        { q: "Alat untuk mengukur panjang meja adalah...", a: "Meteran / Penggaris", opts: ["Meteran / Penggaris", "Timbangan", "Termometer", "Jam Tangan"], mapel: "Matematika" },
        { q: "Hewan yang bernapas dengan insang dan bertelur adalah...", a: "Ikan Mas", opts: ["Ikan Mas", "Lumba-lumba", "Paus", "Katak Dewasa"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 5 × 6?", a: "30", opts: ["25", "28", "30", "35"], mapel: "Matematika" },
        { q: "Keputusan bersama dalam musyawarah harus kita...", a: "Hormati dan Laksanakan", opts: ["Hormati dan Laksanakan", "Tolak", "Abaikan", "Ubah Sendiri"], mapel: "Pancasila" }
      ],
      // Paket 5: Bencana Alam & Kepedulian Sosial
      [
        { q: "Peristiwa alam berupa goncangan tanah bumi dinamakan...", a: "Gempa Bumi", opts: ["Gempa Bumi", "Banjir", "Angin Topan", "Tanah Longsor"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 45 - 18?", a: "27", opts: ["25", "27", "28", "30"], mapel: "Matematika" },
        { q: "Menanam pohon kembali di hutan yang gundul dinamakan...", a: "Reboisasi", opts: ["Reboisasi", "Erosi", "Abrasi", "Irigasi"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 4 × 7?", a: "28", opts: ["24", "26", "28", "32"], mapel: "Matematika" },
        { q: "Bintang pada lambang negara melambangkan sila ke...", a: "1 (Pertama)", opts: ["1 (Pertama)", "2 (Kedua)", "3 (Ketiga)", "4 (Keempat)"], mapel: "Pancasila" },
        { q: "Saling menghargai perbedaan agama di kelas sesuai dengan nilai...", a: "Toleransi", opts: ["Toleransi", "Egois", "Sombong", "Iri"], mapel: "Pancasila" }
      ]
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FASE B: KELAS 3–4 SD (Operasional, Alam Sekitar, Keragaman Budaya)
  // ══════════════════════════════════════════════════════════════════════════
  'fase-b': {
    'mudah': [
      // Paket 1: Wujud Zat & Ekosistem
      [
        { q: "Benda padat memiliki bentuk dan volume yang...", a: "Tetap", opts: ["Tetap", "Berubah-ubah", "Mengikuti wadah", "Hilang"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 15 × 4?", a: "60", opts: ["50", "55", "60", "65"], mapel: "Matematika" },
        { q: "Hewan pemakan tumbuhan disebut...", a: "Herbivora", opts: ["Herbivora", "Karnivora", "Omnivora", "Insektivora"], mapel: "IPAS" },
        { q: "Semboyan bangsa Indonesia adalah...", a: "Bhinneka Tunggal Ika", opts: ["Bhinneka Tunggal Ika", "Tut Wuri Handayani", "Pancasila Sakti", "Garuda Emas"], mapel: "Pancasila" },
        { q: "Berapakah hasil dari 120 ÷ 4?", a: "30", opts: ["25", "30", "35", "40"], mapel: "Matematika" },
        { q: "Zat cair jika dipindahkan ke botol bentuknya akan...", a: "Seperti Botol", opts: ["Seperti Botol", "Tetap Seperti Mangkuk", "Menjadi Gas", "Membeku"], mapel: "IPAS" }
      ],
      // Paket 2: Gaya & Gerak Sederhana
      [
        { q: "Tarikan atau dorongan pada suatu benda dinamakan...", a: "Gaya", opts: ["Gaya", "Energi", "Daya", "Usaha"], mapel: "IPAS" },
        { q: "Berapakah keliling persegi dengan panjang sisi 6 cm?", a: "24 cm", opts: ["18 cm", "24 cm", "30 cm", "36 cm"], mapel: "Matematika" },
        { q: "Magnet memiliki dua kutub, yaitu kutub...", a: "Utara dan Selatan", opts: ["Utara dan Selatan", "Barat dan Timur", "Atas dan Bawah", "Positif dan Netral"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 16 × 5?", a: "80", opts: ["70", "75", "80", "85"], mapel: "Matematika" },
        { q: "Kitab tempat asal semboyan Bhinneka Tunggal Ika adalah...", a: "Kitab Sutasoma", opts: ["Kitab Sutasoma", "Kitab Negarakertagama", "Kitab Ramayana", "Kitab Mahabarata"], mapel: "Pancasila" },
        { q: "Buah jatuh ke tanah karena adanya gaya...", a: "Gravitasi Bumi", opts: ["Gravitasi Bumi", "Magnet", "Gesek", "Pegas"], mapel: "IPAS" }
      ],
      // Paket 3: Arah Mata Angin & Peta
      [
        { q: "Jarum kompas selalu menunjuk ke arah...", a: "Utara dan Selatan", opts: ["Utara dan Selatan", "Barat dan Timur", "Timur Laut", "Tenggara"], mapel: "IPAS" },
        { q: "Berapakah luas persegi panjang dengan panjang 8 cm dan lebar 5 cm?", a: "40 cm²", opts: ["26 cm²", "35 cm²", "40 cm²", "45 cm²"], mapel: "Matematika" },
        { q: "Perubahan wujud cair menjadi padat dinamakan...", a: "Membeku", opts: ["Membeku", "Mencair", "Mengembun", "Menguap"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 250 ÷ 5?", a: "50", opts: ["40", "45", "50", "60"], mapel: "Matematika" },
        { q: "Pemimpin musyawarah di tingkat desa adalah...", a: "Kepala Desa", opts: ["Kepala Desa", "Camat", "Bupati", "Gubernur"], mapel: "Pancasila" },
        { q: "Hewan pemakan daging digolongkan sebagai...", a: "Karnivora", opts: ["Karnivora", "Herbivora", "Omnivora", "Insektivora"], mapel: "IPAS" }
      ],
      // Paket 4: Sila Pancasila & Keberagaman
      [
        { q: "Sila 'Kemanusiaan yang adil dan beradab' adalah sila ke...", a: "2", opts: ["1", "2", "3", "4"], mapel: "Pancasila" },
        { q: "Berapakah hasil dari 24 × 4?", a: "96", opts: ["84", "88", "96", "104"], mapel: "Matematika" },
        { q: "Bagian tumbuhan yang berfungsi menyerap air dari tanah adalah...", a: "Akar", opts: ["Akar", "Batang", "Daun", "Bunga"], mapel: "IPAS" },
        { q: "Berapakah keliling segitiga sama sisi yang sisinya 7 cm?", a: "21 cm", opts: ["14 cm", "21 cm", "28 cm", "49 cm"], mapel: "Matematika" },
        { q: "Rumah adat tongkonan berasal dari daerah...", a: "Toraja, Sulawesi Selatan", opts: ["Toraja, Sulawesi Selatan", "Sumatera Barat", "Papua", "Jawa Tengah"], mapel: "IPAS" },
        { q: "Alat musik angklung dimainkan dengan cara...", a: "Digoyangkan", opts: ["Digoyangkan", "Dipukul", "Ditiup", "Dipetik"], mapel: "Seni" }
      ],
      // Paket 5: Bagian Tubuh Tumbuhan & Sumber Energi
      [
        { q: "Tempat berlangsungnya fotosintesis pada tumbuhan adalah...", a: "Daun", opts: ["Daun", "Akar", "Batang", "Biji"], mapel: "IPAS" },
        { q: "Zat hijau pada daun tumbuhan dinamakan...", a: "Klorofil", opts: ["Klorofil", "Stomata", "Kloroplas", "Batang"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 18 × 5?", a: "90", opts: ["80", "85", "90", "95"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 360 ÷ 6?", a: "60", opts: ["50", "60", "70", "80"], mapel: "Matematika" },
        { q: "Sumber energi terbesar di bumi adalah...", a: "Matahari", opts: ["Matahari", "Batu Bara", "Minyak Bumi", "Listrik"], mapel: "IPAS" },
        { q: "Pohon beringin melambangkan persatuan bangsa pada sila ke...", a: "3", opts: ["2", "3", "4", "5"], mapel: "Pancasila" }
      ]
    ],
    'sedang': [
      // Paket 1: Fotosintesis & Siklus Hidup
      [
        { q: "Gas yang diserap tumbuhan saat fotosintesis di siang hari adalah...", a: "Karbondioksida (CO₂)", opts: ["Karbondioksida (CO₂)", "Oksigen (O₂)", "Nitrogen", "Hidrogen"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 35 × 6?", a: "210", opts: ["180", "200", "210", "225"], mapel: "Matematika" },
        { q: "Urutan daur hidup kupu-kupu yang benar adalah...", a: "Telur - Ulat - Kepompong - Kupu-kupu", opts: ["Telur - Ulat - Kepompong - Kupu-kupu", "Telur - Kepompong - Ulat - Kupu-kupu", "Ulat - Telur - Kupu-kupu - Kepompong", "Kupu-kupu - Kepompong - Ulat - Telur"], mapel: "IPAS" },
        { q: "Berapakah luas persegi yang memiliki sisi 9 cm?", a: "81 cm²", opts: ["36 cm²", "72 cm²", "81 cm²", "90 cm²"], mapel: "Matematika" },
        { q: "Hak seorang anak di lingkungan sekolah antara lain...", a: "Mendapatkan Pendidikan yang Layak", opts: ["Mendapatkan Pendidikan yang Layak", "Menentukan Jadwal Ujian", "Merusak Fasilitas Kelas", "Datang Terlambat"], mapel: "Pancasila" },
        { q: "Hewan pemakan segala (tumbuhan dan daging) disebut...", a: "Omnivora", opts: ["Omnivora", "Karnivora", "Herbivora", "Insektivora"], mapel: "IPAS" }
      ],
      // Paket 2: Keliling, Luas & Pecahan Dasar
      [
        { q: "Sebuah lapangan berbentuk persegi panjang dengan panjang 12 m dan lebar 8 m. Kelilingnya adalah...", a: "40 m", opts: ["32 m", "40 m", "48 m", "96 m"], mapel: "Matematika" },
        { q: "Pecahan 1/2 nilainya sama dengan...", a: "2/4", opts: ["2/3", "2/4", "3/5", "1/4"], mapel: "Matematika" },
        { q: "Energi yang dihasilkan oleh kipas angin yang berputar adalah...", a: "Energi Gerak", opts: ["Energi Gerak", "Energi Kimia", "Energi Panas", "Energi Cahaya"], mapel: "IPAS" },
        { q: "Kutub magnet yang senama (Utara dengan Utara) jika didekatkan akan...", a: "Tolak-menolak", opts: ["Tolak-menolak", "Tarik-menarik", "Menempel kuat", "Diam saja"], mapel: "IPAS" },
        { q: "Rumah adat Joglo merupakan rumah tradisional dari daerah...", a: "Jawa Tengah & Yogyakarta", opts: ["Jawa Tengah & Yogyakarta", "Sumatera Barat", "Bali", "Kalimantan Barat"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 420 ÷ 7?", a: "60", opts: ["50", "60", "70", "80"], mapel: "Matematika" }
      ],
      // Paket 3: Rantai Makanan & Siklus Alam
      [
        { q: "Pada rantai makanan, tumbuhan hijau bertindak sebagai...", a: "Produsen", opts: ["Produsen", "Konsumen I", "Konsumen II", "Pengurai"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 45 × 8?", a: "360", opts: ["320", "340", "360", "380"], mapel: "Matematika" },
        { q: "Bakteri dan cacing pada tanah bertindak sebagai...", a: "Pengurai (Dekomposer)", opts: ["Pengurai (Dekomposer)", "Produsen", "Konsumen Puncak", "Parasit"], mapel: "IPAS" },
        { q: "Berapakah keliling persegi panjang berukuran panjang 15 cm dan lebar 10 cm?", a: "50 cm", opts: ["45 cm", "50 cm", "60 cm", "150 cm"], mapel: "Matematika" },
        { q: "Sikap bermusyawarah untuk mufakat mencerminkan pengamalan sila ke...", a: "4", opts: ["2", "3", "4", "5"], mapel: "Pancasila" },
        { q: "Benda yang tidak tembus cahaya akan menghasilkan...", a: "Bayangan", opts: ["Bayangan", "Cahaya Baru", "Pelangi", "Listrik"], mapel: "IPAS" }
      ],
      // Paket 4: Keragaman Budaya & Seni Tradisional
      [
        { q: "Tari Saman yang terkenal berasal dari provinsi...", a: "Aceh", opts: ["Aceh", "Sumatera Barat", "Bali", "Papua"], mapel: "Seni" },
        { q: "Alat musik Sasando yang dipetik berasal dari...", a: "Nusa Tenggara Timur (NTT)", opts: ["Nusa Tenggara Timur (NTT)", "Sulawesi Utara", "Maluku", "Papua"], mapel: "Seni" },
        { q: "Berapakah hasil dari 28 × 7?", a: "196", opts: ["186", "194", "196", "204"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 560 ÷ 8?", a: "70", opts: ["60", "65", "70", "75"], mapel: "Matematika" },
        { q: "Pengikisan tanah oleh air laut di pantai dinamakan...", a: "Abrasi", opts: ["Abrasi", "Erosi", "Korosi", "Sedimentasi"], mapel: "IPAS" },
        { q: "Perilaku hemat energi di sekolah ditunjukkan dengan...", a: "Mematikan lampu saat kelas kosong", opts: ["Mematikan lampu saat kelas kosong", "Menyalakan AC seharian", "Mencoret-coret tembok", "Membiarkan keran bocor"], mapel: "Pancasila" }
      ],
      // Paket 5: Gaya Gesek & Listrik Sederhana
      [
        { q: "Permukaan ban kendaraan dibuat beralur kasar bertujuan untuk...", a: "Memperbesar gaya gesek agar tidak licin", opts: ["Memperbesar gaya gesek agar tidak licin", "Memperkecil gesekan", "Supaya mobil lebih kencang", "Supaya terlihat indah"], mapel: "IPAS" },
        { q: "Berapakah luas segitiga dengan alas 10 cm dan tinggi 6 cm?", a: "30 cm²", opts: ["20 cm²", "30 cm²", "45 cm²", "60 cm²"], mapel: "Matematika" },
        { q: "Bahan yang dapat menghantarkan panas dan listrik dengan baik disebut...", a: "Konduktor", opts: ["Konduktor", "Isolator", "Semikonduktor", "Adaptor"], mapel: "IPAS" },
        { q: "Karet dan kayu tergolong bahan...", a: "Isolator", opts: ["Isolator", "Konduktor", "Kolektor", "Radiator"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 640 ÷ 8?", a: "80", opts: ["70", "75", "80", "85"], mapel: "Matematika" },
        { q: "Kewajiban utama seorang murid di sekolah adalah...", a: "Belajar dengan sungguh-sungguh", opts: ["Belajar dengan sungguh-sungguh", "Membayar uang gedung", "Mengatur ruang guru", "Menentukan nilai rapor"], mapel: "Pancasila" }
      ]
    ],
    'hebat': [
      // Paket 1: Metamorfosis Sempurna vs Tidak Sempurna
      [
        { q: "Hewan berikut yang mengalami metamorfosis TIDAK sempurna adalah...", a: "Belalang & Kecoak", opts: ["Belalang & Kecoak", "Kupu-kupu & Lalat", "Nyamuk & Katak", "Kumbang & Lebah"], mapel: "IPAS" },
        { q: "Sebuah kolam renang panjangnya 20 m dan lebarnya 8 m. Berapakah luas kolam renang tersebut?", a: "160 m²", opts: ["140 m²", "150 m²", "160 m²", "180 m²"], mapel: "Matematika" },
        { q: "Pecahan 3/4 diubah ke bentuk persen (%) menjadi...", a: "75%", opts: ["50%", "60%", "75%", "80%"], mapel: "Matematika" },
        { q: "Peristiwa kapilaritas pada tumbuhan terjadi melalui pembuluh...", a: "Xilem", opts: ["Xilem", "Floem", "Kambium", "Stomata"], mapel: "IPAS" },
        { q: "Tokoh yang menjahit bendera pusaka Sang Saka Merah Putih adalah...", a: "Ibu Fatmawati", opts: ["Ibu Fatmawati", "R.A. Kartini", "Cut Nyak Dien", "Dewi Sartika"], mapel: "Pancasila" },
        { q: "Berapakah FPB dari bilangan 12 dan 18?", a: "6", opts: ["2", "3", "6", "12"], mapel: "Matematika" }
      ],
      // Paket 2: Pecahan, Sudut & Geometri
      [
        { q: "Sudut yang besarnya tepat 90 derajat dinamakan sudut...", a: "Siku-siku", opts: ["Siku-siku", "Lancip", "Tumpul", "Lurus"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 2,5 + 3,75?", a: "6,25", opts: ["5,25", "6,15", "6,25", "6,50"], mapel: "Matematika" },
        { q: "Gaya yang bekerja saat anak melompat di atas trampolin adalah gaya...", a: "Gaya Pegas", opts: ["Gaya Pegas", "Gaya Gesek", "Gaya Magnet", "Gaya Gravitasi"], mapel: "IPAS" },
        { q: "Cahaya putih matahari dapat diuraikan menjadi warna pelangi melalui peristiwa...", a: "Pembiasan / Dispersi Cahaya", opts: ["Pembiasan / Dispersi Cahaya", "Pemantulan Sempurna", "Penyerapan Cahaya", "Perambatan Lurus"], mapel: "IPAS" },
        { q: "Kerajaan Hindu tertua di Indonesia adalah Kerajaan...", a: "Kutai", opts: ["Kutai", "Tarumanegara", "Sriwijaya", "Majapahit"], mapel: "IPAS" },
        { q: "Berapakah KPK dari bilangan 6 dan 8?", a: "24", opts: ["16", "24", "32", "48"], mapel: "Matematika" }
      ],
      // Paket 3: Sejarah Kerajaan & Candi Nusantara
      [
        { q: "Candi Borobudur di Jawa Tengah merupakan candi bercorak agama...", a: "Buddha", opts: ["Buddha", "Hindu", "Islam", "Konghucu"], mapel: "IPAS" },
        { q: "Patih Kerajaan Majapahit yang terkenal dengan Sumpah Palapa adalah...", a: "Gajah Mada", opts: ["Gajah Mada", "Hayam Wuruk", "Raden Wijaya", "Kertanegara"], mapel: "IPAS" },
        { q: "Sebuah segitiga memiliki alas 14 cm dan tinggi 10 cm. Luasnya adalah...", a: "70 cm²", opts: ["60 cm²", "70 cm²", "140 cm²", "280 cm²"], mapel: "Matematika" },
        { q: "Peristiwa penguapan air di permukaan bumi akibat panas matahari dinamakan...", a: "Evaporasi", opts: ["Evaporasi", "Kondensasi", "Presipitasi", "Infiltrasi"], mapel: "IPAS" },
        { q: "Tenggang rasa dan tidak semena-mena kepada orang lain mencerminkan sila ke...", a: "2", opts: ["1", "2", "3", "5"], mapel: "Pancasila" },
        { q: "Berapakah hasil dari 75 × 12?", a: "900", opts: ["800", "850", "900", "950"], mapel: "Matematika" }
      ],
      // Paket 4: Energi Bunyi, Getaran & Pemantulan
      [
        { q: "Bunyi dapat merambat paling cepat melalui benda...", a: "Padat", opts: ["Padat", "Cair", "Gas", "Ruang Hampa Udara"], mapel: "IPAS" },
        { q: "Bunyi pantul yang terdengar bersamaan dengan bunyi asli dinamakan...", a: "Gaung / Kerdam", opts: ["Gaung / Kerdam", "Gema", "Nada", "Desah"], mapel: "IPAS" },
        { q: "Berapakah keliling lingkaran dengan diameter 14 cm? (π = 22/7)", a: "44 cm", opts: ["22 cm", "44 cm", "88 cm", "154 cm"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 3/5 + 1/5?", a: "4/5", opts: ["3/10", "4/10", "4/5", "1"], mapel: "Matematika" },
        { q: "Pelestarian hewan langka seperti Komodo di habitat aslinya dinamakan pelestarian...", a: "In-situ", opts: ["In-situ", "Ex-situ", "Cagar Buatan", "Suaka Tiruan"], mapel: "IPAS" },
        { q: "Musyawarah desa bertujuan untuk mencapai...", a: "Mufakat / Kesepakatan Bersama", opts: ["Mufakat / Kesepakatan Bersama", "Kemenangan Pihak Tertentu", "Perdebatan Panjang", "Hadiah Uang"], mapel: "Pancasila" }
      ],
      // Paket 5: Kelestarian Alam & Siklus Batuan
      [
        { q: "Lapisan udara yang menyelimuti bumi dinamakan...", a: "Atmosfer", opts: ["Atmosfer", "Litosfer", "Hidrosfer", "Biosfer"], mapel: "IPAS" },
        { q: "Sumber daya alam yang TIDAK dapat diperbarui adalah...", a: "Minyak Bumi & Batu Bara", opts: ["Minyak Bumi & Batu Bara", "Air & Angin", "Tumbuhan & Hewan", "Sinar Matahari"], mapel: "IPAS" },
        { q: "Berapakah volume balok dengan panjang 10 cm, lebar 5 cm, dan tinggi 4 cm?", a: "200 cm³", opts: ["150 cm³", "180 cm³", "200 cm³", "240 cm³"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 125 ÷ 5?", a: "25", opts: ["15", "20", "25", "30"], mapel: "Matematika" },
        { q: "Presiden pertama Republik Indonesia adalah...", a: "Ir. Soekarno", opts: ["Ir. Soekarno", "Drs. Moh. Hatta", "Jenderal Soedirman", "Ki Hajar Dewantara"], mapel: "Pancasila" },
        { q: "Bumi berputar pada porosnya dinamakan...", a: "Rotasi Bumi", opts: ["Rotasi Bumi", "Revolusi Bumi", "Gerhana Bumi", "Presesi"], mapel: "IPAS" }
      ]
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FASE C: KELAS 5–6 SD (Analisis, HOTS, Sains Sistemik, Kebangsaan)
  // ══════════════════════════════════════════════════════════════════════════
  'fase-c': {
    'mudah': [
      // Paket 1: Organ Tubuh & Sistem Pernapasan
      [
        { q: "Organ tubuh yang berfungsi menyerap oksigen dan membuang karbondioksida adalah...", a: "Paru-paru", opts: ["Paru-paru", "Jantung", "Hati", "Lambung"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 25% dari 200.000?", a: "50.000", opts: ["25.000", "40.000", "50.000", "75.000"], mapel: "Matematika" },
        { q: "Organ manusia yang berfungsi memompa darah ke seluruh tubuh adalah...", a: "Jantung", opts: ["Jantung", "Ginjal", "Usus", "Paru-paru"], mapel: "IPAS" },
        { q: "Berapakah luas persegi jika kelilingnya 36 cm?", a: "81 cm²", opts: ["36 cm²", "64 cm²", "81 cm²", "100 cm²"], mapel: "Matematika" },
        { q: "Teks proklamasi kemerdekaan Indonesia dibacakan pada tanggal...", a: "17 Agustus 1945", opts: ["17 Agustus 1945", "1 Juni 1945", "28 Oktober 1928", "20 Mei 1908"], mapel: "Pancasila" },
        { q: "Planet terdekat dari Matahari adalah...", a: "Merkurius", opts: ["Merkurius", "Venus", "Bumi", "Mars"], mapel: "IPAS" }
      ],
      // Paket 2: Operasi Hitung Campuran & Pecahan
      [
        { q: "Berapakah hasil dari 3/4 + 1/2?", a: "5/4 (1 1/4)", opts: ["4/6", "5/4 (1 1/4)", "1", "4/4"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 150 - 25 × 4?", a: "50", opts: ["50", "100", "500", "200"], mapel: "Matematika" },
        { q: "Organ pencernaan yang menghasilkan asam klorida (HCl) untuk membunuh kuman adalah...", a: "Lambung", opts: ["Lambung", "Mulut", "Usus Halus", "Kerongkongan"], mapel: "IPAS" },
        { q: "Penyerapan sari-sari makanan pada manusia berlangsung di...", a: "Usus Halus", opts: ["Usus Halus", "Lambung", "Usus Besar", "Kerongkongan"], mapel: "IPAS" },
        { q: "Hari Lahir Pancasila diperingati setiap tanggal...", a: "1 Juni", opts: ["1 Juni", "17 Agustus", "1 Oktober", "28 Oktober"], mapel: "Pancasila" },
        { q: "Alat pengukur derajat panas dingin suatu benda adalah...", a: "Termometer", opts: ["Termometer", "Barometer", "Higrometer", "Altimeter"], mapel: "IPAS" }
      ],
      // Paket 3: Tokoh Sejarah & Tokoh Nasional
      [
        { q: "Tokoh yang mengetik naskah proklamasi kemerdekaan adalah...", a: "Sayuti Melik", opts: ["Sayuti Melik", "Sukarni", "B.M. Diah", "Wikana"], mapel: "IPAS" },
        { q: "Wakil Presiden Indonesia yang pertama adalah...", a: "Drs. Mohammad Hatta", opts: ["Drs. Mohammad Hatta", "Adam Malik", "Hamengkubuwono IX", "Sutan Sjahrir"], mapel: "Pancasila" },
        { q: "Berapakah volume kubus dengan panjang rusuk 8 cm?", a: "512 cm³", opts: ["64 cm³", "256 cm³", "512 cm³", "1024 cm³"], mapel: "Matematika" },
        { q: "Berapakah KPK dari bilangan 15 dan 20?", a: "60", opts: ["30", "45", "60", "100"], mapel: "Matematika" },
        { q: "Perpindahan panas tanpa melalui zat perantara dinamakan...", a: "Radiasi", opts: ["Radiasi", "Konduksi", "Konveksi", "Evaporasi"], mapel: "IPAS" },
        { q: "Hubungan timbal balik antara makhluk hidup dengan lingkungannya disebut...", a: "Ekosistem", opts: ["Ekosistem", "Habitat", "Populasi", "Komunitas"], mapel: "IPAS" }
      ],
      // Paket 4: Tata Surya & Gravitasi
      [
        { q: "Planet terbesar dalam tata surya kita adalah...", a: "Jupiter", opts: ["Jupiter", "Saturnus", "Uranus", "Neptunus"], mapel: "IPAS" },
        { q: "Planet yang dijuluki sebagai 'Planet Merah' adalah...", a: "Mars", opts: ["Mars", "Venus", "Merkurius", "Jupiter"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 2,4 × 1,5?", a: "3,6", opts: ["3,2", "3,4", "3,6", "4,0"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 14² (14 × 14)?", a: "196", opts: ["166", "186", "196", "216"], mapel: "Matematika" },
        { q: "Organisasi persatuan negara-negara di kawasan Asia Tenggara adalah...", a: "ASEAN", opts: ["ASEAN", "PBB", "APEC", "NATO"], mapel: "IPAS" },
        { q: "Sikap cinta tanah air dan rela berkorban untuk bangsa dinamakan...", a: "Patriotisme", opts: ["Patriotisme", "Chauvinisme", "Individualisme", "Konsumerisme"], mapel: "Pancasila" }
      ],
      // Paket 5: Hak, Kewajiban & Demokrasi
      [
        { q: "Pemilihan umum di Indonesia diselenggarakan berasaskan Luber dan Jurdil. Kepanjangan Jurdil adalah...", a: "Jujur dan Adil", opts: ["Jujur dan Adil", "Jujur dan Disiplin", "Jelas dan Nyata", "Jujur dan Damai"], mapel: "Pancasila" },
        { q: "Lembaga negara pembuat undang-undang di Indonesia adalah...", a: "DPR bersama Presiden", opts: ["DPR bersama Presiden", "MA", "MK", "BPK"], mapel: "Pancasila" },
        { q: "Berapakah hasil dari √625?", a: "25", opts: ["15", "25", "35", "45"], mapel: "Matematika" },
        { q: "Sebuah mobil menempuh jarak 120 km dalam waktu 2 jam. Berapa kecepatan rata-ratanya?", a: "60 km/jam", opts: ["50 km/jam", "60 km/jam", "70 km/jam", "80 km/jam"], mapel: "Matematika" },
        { q: "Sendi yang dapat digerakkan ke segala arah adalah sendi...", a: "Sendi Peluru", opts: ["Sendi Peluru", "Sendi Engsel", "Sendi Putar", "Sendi Pelana"], mapel: "IPAS" },
        { q: "Zat pewarna merah pada darah dinamakan...", a: "Hemoglobin", opts: ["Hemoglobin", "Klorofil", "Melanin", "Plasma"], mapel: "IPAS" }
      ]
    ],
    'sedang': [
      // Paket 1: Peredaran Darah & Sistem Ekskresi
      [
        { q: "Peredaran darah yang mengalirkan darah dari jantung ke paru-paru lalu kembali ke jantung adalah...", a: "Peredaran Darah Kecil", opts: ["Peredaran Darah Kecil", "Peredaran Darah Besar", "Peredaran Darah Terbuka", "Peredaran Darah Limfa"], mapel: "IPAS" },
        { q: "Organ tubuh yang berfungsi menyaring darah dari zat sisa metabolisme adalah...", a: "Ginjal", opts: ["Ginjal", "Hati", "Paru-paru", "Kulit"], mapel: "IPAS" },
        { q: "Berapakah hasil dari 2 1/2 + 1 3/4?", a: "4 1/4", opts: ["3 4/6", "4 1/4", "4 1/2", "5 1/4"], mapel: "Matematika" },
        { q: "Skala pada peta 1 : 500.000. Jarak 2 cm pada peta mewakili jarak sebenarnya sejauh...", a: "10 km", opts: ["5 km", "10 km", "25 km", "50 km"], mapel: "Matematika" },
        { q: "Peristiwa perpindahan panas yang disertai perpindahan zat perantaranya (seperti merebus air) adalah...", a: "Konveksi", opts: ["Konveksi", "Konduksi", "Radiasi", "Evaporasi"], mapel: "IPAS" },
        { q: "Hari Sumpah Pemuda diperingati setiap tanggal...", a: "28 Oktober", opts: ["28 Oktober", "10 November", "20 Mei", "17 Agustus"], mapel: "Pancasila" }
      ],
      // Paket 2: Kecepatan, Debit & Skala
      [
        { q: "Sebuah kran mengalirkan air 60 liter dalam waktu 2 menit. Debit air kran tersebut adalah...", a: "30 liter/menit", opts: ["20 liter/menit", "30 liter/menit", "60 liter/menit", "120 liter/menit"], mapel: "Matematika" },
        { q: "Berapakah FPB dari 24, 36, dan 48?", a: "12", opts: ["6", "8", "12", "24"], mapel: "Matematika" },
        { q: "Sendi yang terdapat pada siku dan lutut manusia adalah sendi...", a: "Sendi Engsel", opts: ["Sendi Engsel", "Sendi Peluru", "Sendi Putar", "Sendi Geser"], mapel: "IPAS" },
        { q: "Tumbuhan kaktus menyesuaikan diri dengan lingkungan gurun kering melalui...", a: "Daun berbentuk duri & batang berdaging tebal", opts: ["Daun berbentuk duri & batang berdaging tebal", "Daun lebar tipis", "Akar sangat pendek", "Batang berongga udara"], mapel: "IPAS" },
        { q: "Negara kepulauan terbesar di Asia Tenggara adalah...", a: "Indonesia", opts: ["Indonesia", "Filipina", "Malaysia", "Singapura"], mapel: "IPAS" },
        { q: "Sikap mengutamakan musyawarah untuk mufakat merupakan cerminan sila...", a: "Ke-4 Pancasila", opts: ["Ke-2 Pancasila", "Ke-3 Pancasila", "Ke-4 Pancasila", "Ke-5 Pancasila"], mapel: "Pancasila" }
      ],
      // Paket 3: Rangkaian Listrik & Magnet
      [
        { q: "Rangkaian listrik yang disusun secara sejajar bercabang dinamakan...", a: "Rangkaian Paralel", opts: ["Rangkaian Paralel", "Rangkaian Seri", "Rangkaian Campuran", "Rangkaian Terbuka"], mapel: "IPAS" },
        { q: "Keuntungan rangkaian paralel yang dipasang di rumah adalah...", a: "Jika satu lampu padam, lampu lain tetap menyala", opts: ["Jika satu lampu padam, lampu lain tetap menyala", "Kabel yang digunakan jauh lebih sedikit", "Baterai cepat habis", "Arus listrik tidak stabil"], mapel: "IPAS" },
        { q: "Berapakah luas lingkaran dengan jari-jari 7 cm? (π = 22/7)", a: "154 cm²", opts: ["44 cm²", "88 cm²", "154 cm²", "308 cm²"], mapel: "Matematika" },
        { q: "Rata-rata (mean) dari data nilai: 7, 8, 8, 9, 8 adalah...", a: "8", opts: ["7,5", "8", "8,2", "8,5"], mapel: "Matematika" },
        { q: "Tokoh pencetus semboyan pendidikan 'Tut Wuri Handayani' adalah...", a: "Ki Hajar Dewantara", opts: ["Ki Hajar Dewantara", "R.A. Kartini", "K.H. Ahmad Dahlan", "Moh. Yamin"], mapel: "Pancasila" },
        { q: "Magnet buatan yang dibuat dengan melilitkan kawat berarus listrik dinamakan...", a: "Elektromagnet", opts: ["Elektromagnet", "Feromagnetik", "Paramagnetik", "Diamagnetik"], mapel: "IPAS" }
      ],
      // Paket 4: ASEAN & Perdagangan Internasional
      [
        { q: "Deklarasi pendirian organisasi ASEAN ditandatangani di kota...", a: "Bangkok, Thailand", opts: ["Bangkok, Thailand", "Jakarta, Indonesia", "Kuala Lumpur, Malaysia", "Manila, Filipina"], mapel: "IPAS" },
        { q: "Mata uang resmi negara Malaysia adalah...", a: "Ringgit", opts: ["Ringgit", "Baht", "Dolar", "Peso"], mapel: "IPAS" },
        { q: "Berapakah volume prisma segitiga dengan luas alas 24 cm² dan tinggi 10 cm?", a: "240 cm³", opts: ["120 cm³", "240 cm³", "360 cm³", "480 cm³"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 3,5 jam dikonversi ke menit?", a: "210 Menit", opts: ["180 Menit", "190 Menit", "210 Menit", "240 Menit"], mapel: "Matematika" },
        { q: "Kekuasaan kehakiman tertinggi di Indonesia dijalankan oleh...", a: "Mahkamah Agung (MA)", opts: ["Mahkamah Agung (MA)", "DPR", "Presiden", "BPK"], mapel: "Pancasila" },
        { q: "Hewan yang berkembang biak dengan cara bertelur dan melahirkan dinamakan...", a: "Ovovivipar", opts: ["Ovovivipar", "Ovipar", "Vivipar", "Fragmentasi"], mapel: "IPAS" }
      ],
      // Paket 5: Tata Surya & Gerhana
      [
        { q: "Peristiwa terhalangnya sinar matahari ke bulan oleh bayangan bumi dinamakan...", a: "Gerhana Bulan", opts: ["Gerhana Bulan", "Gerhana Matahari", "Rotasi Bumi", "Revolusi Bulan"], mapel: "IPAS" },
        { q: "Waktu yang dibutuhkan bumi untuk satu kali mengitari matahari adalah...", a: "365 1/4 Hari (1 Tahun)", opts: ["24 Jam", "30 Hari", "365 1/4 Hari (1 Tahun)", "100 Hari"], mapel: "IPAS" },
        { q: "Berapakah modus dari data nilai ulangan: 6, 7, 8, 8, 8, 9, 10?", a: "8", opts: ["7", "8", "9", "10"], mapel: "Matematika" },
        { q: "Sebuah tabung memiliki jari-jari 7 cm dan tinggi 10 cm. Volumenya adalah...", a: "1.540 cm³", opts: ["770 cm³", "1.540 cm³", "2.200 cm³", "3.080 cm³"], mapel: "Matematika" },
        { q: "Tari Pendet yang menyambut tamu berasal dari daerah...", a: "Bali", opts: ["Bali", "Lombok", "Jawa Timur", "Sulawesi Selatan"], mapel: "Seni" },
        { q: "Lagu 'Indonesia Raya' diciptakan oleh komponis nasional...", a: "W.R. Soepratman", opts: ["W.R. Soepratman", "Ismail Marzuki", "Kusbini", "C. Simanjuntak"], mapel: "Pancasila" }
      ]
    ],
    'hebat': [
      // Paket 1: Pubertas, Adaptasi & Reproduksi
      [
        { q: "Ciri perkembangan fisik primer pada remaja laki-laki yang menandai pubertas adalah...", a: "Mimpi basah (dihasilkannya sel sperma)", opts: ["Mimpi basah (dihasilkannya sel sperma)", "Tumbuhnya jakun", "Suara membesar", "Tumbuh kumis"], mapel: "IPAS" },
        { q: "Perkembangbiakan tumbuhan secara vegetatif buatan dengan mengupas kulit batang dinamakan...", a: "Mencangkok", opts: ["Mencangkok", "Menyetek", "Merunduk", "Menempel (Okulasi)"], mapel: "IPAS" },
        { q: "Nilai rata-rata 4 siswa adalah 80. Jika ditambah nilai 1 siswa baru menjadi 82, berapakah nilai siswa baru tersebut?", a: "90", opts: ["86", "88", "90", "92"], mapel: "Matematika" },
        { q: "Berapakah perbandingan senilai jika 5 kg beras harganya Rp 60.000, maka harga 8 kg beras adalah...", a: "Rp 96.000", opts: ["Rp 84.000", "Rp 90.000", "Rp 96.000", "Rp 100.000"], mapel: "Matematika" },
        { q: "Tokoh yang menyampaikan rumusan dasar negara pada tanggal 1 Juni 1945 adalah...", a: "Ir. Soekarno", opts: ["Ir. Soekarno", "Prof. Dr. Soepomo", "Mr. Mohammad Yamin", "K.H. Wahid Hasyim"], mapel: "Pancasila" },
        { q: "Planet yang memiliki cincin paling indah dan tampak jelas adalah...", a: "Saturnus", opts: ["Saturnus", "Jupiter", "Uranus", "Neptunus"], mapel: "IPAS" }
      ],
      // Paket 2: Statistika HOTS & Geometri Ruang
      [
        { q: "Data nilai matematika: 6, 7, 7, 8, 8, 9, 9, 10. Berapakah nilai tengahnya (Median)?", a: "8", opts: ["7,5", "8", "8,5", "9"], mapel: "Matematika" },
        { q: "Sebuah bak mandi berbentuk balok (panjang 1 m, lebar 0,8 m, tinggi 0,5 m). Volume airnya dalam liter adalah...", a: "400 Liter", opts: ["300 Liter", "400 Liter", "500 Liter", "800 Liter"], mapel: "Matematika" },
        { q: "Penyerbukan pada bunga yang serbuk sarinya jatuh ke kepala putik bunga lain yang sejenis dinamakan penyerbukan...", a: "Silang (Alogami)", opts: ["Silang (Alogami)", "Sendiri (Autogami)", "Tetangga (Geitonogami)", "Bastar (Hibridisasi)"], mapel: "IPAS" },
        { q: "Alat pemutus dan penyambung aliran listrik pada rangkaian disebut...", a: "Sakelar", opts: ["Sakelar", "Sekring", "Stopkontak", "Fitting"], mapel: "IPAS" },
        { q: "Kerjasama negara-negara ASEAN di bidang ekonomi contohnya adalah...", a: "Kawasan Perdagangan Bebas ASEAN (AFTA)", opts: ["Kawasan Perdagangan Bebas ASEAN (AFTA)", "Pesta Olahraga SEA Games", "Tukar menukar pelajar", "Bantuan bencana alam"], mapel: "IPAS" },
        { q: "UUD 1945 disahkan sebagai konstitusi negara Indonesia oleh PPKI pada tanggal...", a: "18 Agustus 1945", opts: ["17 Agustus 1945", "18 Agustus 1945", "19 Agustus 1945", "22 Agustus 1945"], mapel: "Pancasila" }
      ],
      // Paket 3: Listrik Dinamis & Sumber Energi Terbarukan
      [
        { q: "Pembangkit Listrik Tenaga Air (PLTA) memanfaatkan perubahan energi...", a: "Energi Potensial Air -> Energi Gerak Turbin -> Energi Listrik", opts: ["Energi Potensial Air -> Energi Gerak Turbin -> Energi Listrik", "Energi Kimia -> Energi Listrik", "Energi Panas -> Energi Gerak -> Energi Listrik", "Energi Cahaya -> Energi Kimia"], mapel: "IPAS" },
        { q: "Alat keselamatan yang berfungsi memutus arus listrik saat terjadi korsleting dinamakan...", a: "Sekring (Fuse)", opts: ["Sekring (Fuse)", "Sakelar", "Transformator", "Dinamo"], mapel: "IPAS" },
        { q: "Berapakah luas permukaan kubus jika panjang rusuknya 5 cm?", a: "150 cm²", opts: ["100 cm²", "125 cm²", "150 cm²", "175 cm²"], mapel: "Matematika" },
        { q: "Berapakah hasil dari 3/8 × 4/9?", a: "1/6", opts: ["1/6", "1/4", "7/17", "2/9"], mapel: "Matematika" },
        { q: "Peristiwa Rengasdengklok terjadi karena adanya perbedaan pendapat antara golongan muda dan tua mengenai...", a: "Waktu Proklamasi Kemerdekaan", opts: ["Waktu Proklamasi Kemerdekaan", "Isi Teks Undang-Undang", "Pemilihan Presiden", "Lokasi Pembacaan Teks"], mapel: "IPAS" },
        { q: "Efek rumah kaca yang berlebihan pada atmosfer bumi dapat menyebabkan...", a: "Pemanasan Global (Global Warming)", opts: ["Pemanasan Global (Global Warming)", "Zaman Es", "Tsunami", "Gempa Bumi"], mapel: "IPAS" }
      ],
      // Paket 4: Sejarah Diplomasi & Perjuangan Bangsa
      [
        { q: "Perjanjian diplomasi antara Indonesia dan Belanda di atas kapal perang milik Amerika Serikat adalah Perjanjian...", a: "Renville", opts: ["Renville", "Linggarjati", "Roem-Royen", "Konferensi Meja Bundar"], mapel: "IPAS" },
        { q: "Panglima Besar TNI yang memimpin perang gerilya dalam keadaan sakit paru-paru adalah...", a: "Jenderal Soedirman", opts: ["Jenderal Soedirman", "Jenderal Ahmad Yani", "Bung Tomo", "Gatot Soebroto"], mapel: "Pancasila" },
        { q: "Sebuah tabung memiliki diameter 14 cm dan tinggi 20 cm. Berapa volumenya? (π = 22/7)", a: "3.080 cm³", opts: ["1.540 cm³", "3.080 cm³", "6.160 cm³", "9.240 cm³"], mapel: "Matematika" },
        { q: "Hasil dari 3 1/3 ÷ 1 1/4 adalah...", a: "2 2/3", opts: ["2 1/4", "2 2/3", "3", "3 1/2"], mapel: "Matematika" },
        { q: "Organ pencernaan yang memproduksi empedu untuk mengemulsikan lemak adalah...", a: "Hati", opts: ["Hati", "Pankreas", "Lambung", "Ginjal"], mapel: "IPAS" },
        { q: "Lembaga negara yang berwenang menguji undang-undang terhadap UUD 1945 adalah...", a: "Mahkamah Konstitusi (MK)", opts: ["Mahkamah Konstitusi (MK)", "Mahkamah Agung", "Komisi Yudisial", "DPR"], mapel: "Pancasila" }
      ],
      // Paket 5: Pelestarian Lingkungan & Bioteknologi
      [
        { q: "Pemanfaatan mikroorganisme seperti ragi pada pembuatan tapai atau tempe dinamakan...", a: "Fermentasi", opts: ["Fermentasi", "Sterilisasi", "Pasteurisasi", "Kristalisasi"], mapel: "IPAS" },
        { q: "Lapisan ozon di atmosfer berfungsi untuk melindungi bumi dari bahaya...", a: "Radiasi sinar ultraviolet (UV) berlebih", opts: ["Radiasi sinar ultraviolet (UV) berlebih", "Hantaman asteroid", "Angin badai matahari", "Dinginnya luar angkasa"], mapel: "IPAS" },
        { q: "Sebuah limas persegi memiliki sisi alas 6 cm dan tinggi limas 10 cm. Volumenya adalah...", a: "120 cm³", opts: ["60 cm³", "120 cm³", "180 cm³", "360 cm³"], mapel: "Matematika" },
        { q: "Jika harga 3 buku tulis adalah Rp 12.000, berapa harga 7 buku tulis yang sama?", a: "Rp 28.000", opts: ["Rp 24.000", "Rp 26.000", "Rp 28.000", "Rp 32.000"], mapel: "Matematika" },
        { q: "Prinsip 3R dalam pengelolaan sampah terdiri dari...", a: "Reduce, Reuse, Recycle", opts: ["Reduce, Reuse, Recycle", "Repair, Replace, Return", "Remove, Rebuild, React", "Renew, Refill, Reform"], mapel: "IPAS" },
        { q: "Cita-cita luhur bangsa Indonesia termaktub secara jelas pada Pembukaan UUD 1945 alinea ke...", a: "4", opts: ["1", "2", "3", "4"], mapel: "Pancasila" }
      ]
    ]
  }
};

/**
 * Array datar untuk kompatibilitas mundur jika ada modul yang memanggil QUESTION_BANK['fase-a']
 */
export const QUESTION_BANK = {
  'fase-a': flattenFase('fase-a'),
  'fase-b': flattenFase('fase-b'),
  'fase-c': flattenFase('fase-c')
};

function flattenFase(fase) {
  const faseObj = TIERED_QUESTION_BANK[fase];
  if (!faseObj) return [];
  const list = [];
  ['mudah', 'sedang', 'hebat'].forEach(tingkat => {
    (faseObj[tingkat] || []).forEach(packet => {
      list.push(...packet);
    });
  });
  return list;
}

/**
 * Mengambil soal acak atau per paket dari jenjang dan tingkat yang dipilih.
 * @param {string} fase - 'fase-a' | 'fase-b' | 'fase-c'
 * @param {string} tingkat - 'mudah' | 'sedang' | 'hebat' | 'all'
 * @param {number|string} paket - 1..5 atau 'all'
 * @param {number} count - jumlah soal
 */
export function getQuestionsByFilter(fase = 'fase-b', tingkat = 'sedang', paket = 'all', count = 10) {
  const faseData = TIERED_QUESTION_BANK[fase] || TIERED_QUESTION_BANK['fase-b'];
  let pool = [];

  const targetTingkat = (tingkat === 'all' || !faseData[tingkat]) 
    ? ['mudah', 'sedang', 'hebat'] 
    : [tingkat];

  targetTingkat.forEach(t => {
    const packets = faseData[t] || [];
    if (paket === 'all' || paket === 0 || paket === '0') {
      packets.forEach(p => pool.push(...p));
    } else {
      const pIdx = Math.max(0, Math.min(packets.length - 1, parseInt(paket, 10) - 1));
      if (packets[pIdx]) {
        pool.push(...packets[pIdx]);
      }
    }
  });

  if (pool.length === 0) {
    pool = QUESTION_BANK[fase] || QUESTION_BANK['fase-b'];
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(item => ({
    q: item.q,
    a: item.a,
    opts: [...item.opts].sort(() => Math.random() - 0.5),
    mapel: item.mapel || 'IPAS'
  }));
}

export function getRandomQuestions(fase = 'fase-b', count = 10) {
  return getQuestionsByFilter(fase, 'sedang', 'all', count);
}

// ════════════════════════════════════════════════════════════════════════════
// 15 SET KATA UNIK BERJENJANG UNTUK CARI KATA RAKSASA (5 PAKET × 3 FASE)
export const WORD_SETS_BY_FASE = {
  "fase-a": [
    {
      "topic": "Paket 1: Benda di Sekitar (Kelas 1–2)",
      "gridSize": 7,
      "red": {
        "words": [
          "BUKU",
          "MEJA",
          "TAS",
          "BOLA"
        ],
        "grid": [
          [
            "B",
            "U",
            "K",
            "U",
            "M",
            "B",
            "S"
          ],
          [
            "T",
            "A",
            "S",
            "T",
            "E",
            "O",
            "N"
          ],
          [
            "I",
            "C",
            "I",
            "J",
            "J",
            "L",
            "O"
          ],
          [
            "U",
            "E",
            "R",
            "H",
            "A",
            "A",
            "E"
          ],
          [
            "S",
            "G",
            "T",
            "E",
            "E",
            "J",
            "N"
          ],
          [
            "H",
            "L",
            "B",
            "E",
            "I",
            "H",
            "F"
          ],
          [
            "O",
            "P",
            "U",
            "L",
            "L",
            "I",
            "L"
          ]
        ],
        "solutions": {
          "BUKU": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "MEJA": {
            "r1": 0,
            "c1": 4,
            "r2": 3,
            "c2": 4
          },
          "TAS": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 2
          },
          "BOLA": {
            "r1": 0,
            "c1": 5,
            "r2": 3,
            "c2": 5
          }
        }
      },
      "blue": {
        "words": [
          "PENA",
          "TOPI",
          "JAM",
          "PENSIL"
        ],
        "grid": [
          [
            "P",
            "E",
            "N",
            "A",
            "T",
            "P",
            "M"
          ],
          [
            "J",
            "A",
            "M",
            "R",
            "O",
            "E",
            "R"
          ],
          [
            "M",
            "B",
            "O",
            "L",
            "P",
            "N",
            "A"
          ],
          [
            "B",
            "U",
            "T",
            "P",
            "I",
            "S",
            "A"
          ],
          [
            "U",
            "O",
            "N",
            "Q",
            "L",
            "I",
            "R"
          ],
          [
            "O",
            "N",
            "Y",
            "A",
            "I",
            "L",
            "Q"
          ],
          [
            "N",
            "G",
            "G",
            "I",
            "S",
            "F",
            "A"
          ]
        ],
        "solutions": {
          "PENA": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "TOPI": {
            "r1": 0,
            "c1": 4,
            "r2": 3,
            "c2": 4
          },
          "JAM": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 2
          },
          "PENSIL": {
            "r1": 0,
            "c1": 5,
            "r2": 5,
            "c2": 5
          }
        }
      },
      "words": [
        "BUKU",
        "MEJA",
        "TAS",
        "BOLA"
      ],
      "grid": [
        [
          "B",
          "U",
          "K",
          "U",
          "M",
          "B",
          "S"
        ],
        [
          "T",
          "A",
          "S",
          "T",
          "E",
          "O",
          "N"
        ],
        [
          "I",
          "C",
          "I",
          "J",
          "J",
          "L",
          "O"
        ],
        [
          "U",
          "E",
          "R",
          "H",
          "A",
          "A",
          "E"
        ],
        [
          "S",
          "G",
          "T",
          "E",
          "E",
          "J",
          "N"
        ],
        [
          "H",
          "L",
          "B",
          "E",
          "I",
          "H",
          "F"
        ],
        [
          "O",
          "P",
          "U",
          "L",
          "L",
          "I",
          "L"
        ]
      ],
      "solutions": {
        "BUKU": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 3
        },
        "MEJA": {
          "r1": 0,
          "c1": 4,
          "r2": 3,
          "c2": 4
        },
        "TAS": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 2
        },
        "BOLA": {
          "r1": 0,
          "c1": 5,
          "r2": 3,
          "c2": 5
        }
      }
    },
    {
      "topic": "Paket 2: Anggota Tubuh (Kelas 1–2)",
      "gridSize": 7,
      "red": {
        "words": [
          "MATA",
          "KAKI",
          "PIPI",
          "GIGI"
        ],
        "grid": [
          [
            "M",
            "A",
            "T",
            "A",
            "K",
            "P",
            "D"
          ],
          [
            "G",
            "I",
            "G",
            "I",
            "A",
            "I",
            "V"
          ],
          [
            "E",
            "C",
            "E",
            "Q",
            "K",
            "P",
            "L"
          ],
          [
            "Q",
            "S",
            "N",
            "R",
            "I",
            "I",
            "W"
          ],
          [
            "U",
            "S",
            "N",
            "S",
            "E",
            "A",
            "R"
          ],
          [
            "M",
            "T",
            "A",
            "A",
            "H",
            "F",
            "E"
          ],
          [
            "A",
            "S",
            "M",
            "E",
            "Z",
            "F",
            "J"
          ]
        ],
        "solutions": {
          "MATA": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "KAKI": {
            "r1": 0,
            "c1": 4,
            "r2": 3,
            "c2": 4
          },
          "PIPI": {
            "r1": 0,
            "c1": 5,
            "r2": 3,
            "c2": 5
          },
          "GIGI": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 3
          }
        }
      },
      "blue": {
        "words": [
          "DADA",
          "LIDAH",
          "KUKU",
          "LEHER"
        ],
        "grid": [
          [
            "D",
            "A",
            "D",
            "A",
            "L",
            "L",
            "Y"
          ],
          [
            "K",
            "U",
            "K",
            "U",
            "I",
            "E",
            "T"
          ],
          [
            "H",
            "E",
            "D",
            "U",
            "D",
            "H",
            "N"
          ],
          [
            "A",
            "A",
            "E",
            "T",
            "A",
            "E",
            "E"
          ],
          [
            "S",
            "U",
            "T",
            "N",
            "H",
            "R",
            "O"
          ],
          [
            "G",
            "A",
            "N",
            "A",
            "N",
            "A",
            "M"
          ],
          [
            "N",
            "J",
            "A",
            "M",
            "E",
            "B",
            "S"
          ]
        ],
        "solutions": {
          "DADA": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "LIDAH": {
            "r1": 0,
            "c1": 4,
            "r2": 4,
            "c2": 4
          },
          "KUKU": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 3
          },
          "LEHER": {
            "r1": 0,
            "c1": 5,
            "r2": 4,
            "c2": 5
          }
        }
      },
      "words": [
        "MATA",
        "KAKI",
        "PIPI",
        "GIGI"
      ],
      "grid": [
        [
          "M",
          "A",
          "T",
          "A",
          "K",
          "P",
          "D"
        ],
        [
          "G",
          "I",
          "G",
          "I",
          "A",
          "I",
          "V"
        ],
        [
          "E",
          "C",
          "E",
          "Q",
          "K",
          "P",
          "L"
        ],
        [
          "Q",
          "S",
          "N",
          "R",
          "I",
          "I",
          "W"
        ],
        [
          "U",
          "S",
          "N",
          "S",
          "E",
          "A",
          "R"
        ],
        [
          "M",
          "T",
          "A",
          "A",
          "H",
          "F",
          "E"
        ],
        [
          "A",
          "S",
          "M",
          "E",
          "Z",
          "F",
          "J"
        ]
      ],
      "solutions": {
        "MATA": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 3
        },
        "KAKI": {
          "r1": 0,
          "c1": 4,
          "r2": 3,
          "c2": 4
        },
        "PIPI": {
          "r1": 0,
          "c1": 5,
          "r2": 3,
          "c2": 5
        },
        "GIGI": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 3
        }
      }
    },
    {
      "topic": "Paket 3: Hewan Peliharaan (Kelas 1–2)",
      "gridSize": 7,
      "red": {
        "words": [
          "AYAM",
          "IKAN",
          "KUDA",
          "SAPI"
        ],
        "grid": [
          [
            "A",
            "Y",
            "A",
            "M",
            "I",
            "K",
            "O"
          ],
          [
            "S",
            "A",
            "P",
            "I",
            "K",
            "U",
            "A"
          ],
          [
            "U",
            "V",
            "F",
            "Y",
            "A",
            "D",
            "N"
          ],
          [
            "R",
            "R",
            "W",
            "R",
            "N",
            "A",
            "L"
          ],
          [
            "N",
            "R",
            "R",
            "R",
            "C",
            "U",
            "Y"
          ],
          [
            "J",
            "G",
            "O",
            "W",
            "L",
            "C",
            "A"
          ],
          [
            "S",
            "Z",
            "H",
            "O",
            "L",
            "A",
            "K"
          ]
        ],
        "solutions": {
          "AYAM": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "IKAN": {
            "r1": 0,
            "c1": 4,
            "r2": 3,
            "c2": 4
          },
          "KUDA": {
            "r1": 0,
            "c1": 5,
            "r2": 3,
            "c2": 5
          },
          "SAPI": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 3
          }
        }
      },
      "blue": {
        "words": [
          "BEBEK",
          "KUCING",
          "KATAK",
          "BURUNG"
        ],
        "grid": [
          [
            "B",
            "E",
            "B",
            "E",
            "K",
            "I",
            "U"
          ],
          [
            "U",
            "Z",
            "Z",
            "E",
            "U",
            "C",
            "N"
          ],
          [
            "R",
            "A",
            "Y",
            "N",
            "C",
            "T",
            "S"
          ],
          [
            "U",
            "J",
            "T",
            "A",
            "I",
            "M",
            "N"
          ],
          [
            "N",
            "B",
            "F",
            "L",
            "N",
            "N",
            "A"
          ],
          [
            "G",
            "V",
            "O",
            "J",
            "G",
            "G",
            "T"
          ],
          [
            "K",
            "A",
            "T",
            "A",
            "K",
            "Q",
            "A"
          ]
        ],
        "solutions": {
          "BEBEK": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "KUCING": {
            "r1": 0,
            "c1": 4,
            "r2": 5,
            "c2": 4
          },
          "KATAK": {
            "r1": 6,
            "c1": 0,
            "r2": 6,
            "c2": 4
          },
          "BURUNG": {
            "r1": 0,
            "c1": 0,
            "r2": 5,
            "c2": 0
          }
        }
      },
      "words": [
        "AYAM",
        "IKAN",
        "KUDA",
        "SAPI"
      ],
      "grid": [
        [
          "A",
          "Y",
          "A",
          "M",
          "I",
          "K",
          "O"
        ],
        [
          "S",
          "A",
          "P",
          "I",
          "K",
          "U",
          "A"
        ],
        [
          "U",
          "V",
          "F",
          "Y",
          "A",
          "D",
          "N"
        ],
        [
          "R",
          "R",
          "W",
          "R",
          "N",
          "A",
          "L"
        ],
        [
          "N",
          "R",
          "R",
          "R",
          "C",
          "U",
          "Y"
        ],
        [
          "J",
          "G",
          "O",
          "W",
          "L",
          "C",
          "A"
        ],
        [
          "S",
          "Z",
          "H",
          "O",
          "L",
          "A",
          "K"
        ]
      ],
      "solutions": {
        "AYAM": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 3
        },
        "IKAN": {
          "r1": 0,
          "c1": 4,
          "r2": 3,
          "c2": 4
        },
        "KUDA": {
          "r1": 0,
          "c1": 5,
          "r2": 3,
          "c2": 5
        },
        "SAPI": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 3
        }
      }
    },
    {
      "topic": "Paket 4: Nama Buah Segar (Kelas 1–2)",
      "gridSize": 7,
      "red": {
        "words": [
          "APEL",
          "JERUK",
          "MELON",
          "SALAK"
        ],
        "grid": [
          [
            "A",
            "P",
            "E",
            "L",
            "J",
            "S",
            "A"
          ],
          [
            "A",
            "M",
            "O",
            "G",
            "E",
            "A",
            "E"
          ],
          [
            "N",
            "S",
            "O",
            "F",
            "R",
            "L",
            "R"
          ],
          [
            "A",
            "D",
            "R",
            "W",
            "U",
            "A",
            "R"
          ],
          [
            "B",
            "R",
            "E",
            "H",
            "K",
            "K",
            "S"
          ],
          [
            "M",
            "E",
            "L",
            "O",
            "N",
            "E",
            "T"
          ],
          [
            "N",
            "A",
            "Z",
            "N",
            "C",
            "E",
            "A"
          ]
        ],
        "solutions": {
          "APEL": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "JERUK": {
            "r1": 0,
            "c1": 4,
            "r2": 4,
            "c2": 4
          },
          "MELON": {
            "r1": 5,
            "c1": 0,
            "r2": 5,
            "c2": 4
          },
          "SALAK": {
            "r1": 0,
            "c1": 5,
            "r2": 4,
            "c2": 5
          }
        }
      },
      "blue": {
        "words": [
          "NANAS",
          "PISANG",
          "JAMBU",
          "MANGGA"
        ],
        "grid": [
          [
            "N",
            "A",
            "N",
            "A",
            "S",
            "P",
            "M"
          ],
          [
            "J",
            "A",
            "M",
            "B",
            "U",
            "I",
            "A"
          ],
          [
            "T",
            "Z",
            "O",
            "R",
            "G",
            "S",
            "N"
          ],
          [
            "K",
            "O",
            "B",
            "U",
            "W",
            "A",
            "G"
          ],
          [
            "T",
            "G",
            "A",
            "T",
            "E",
            "N",
            "G"
          ],
          [
            "L",
            "N",
            "Z",
            "N",
            "I",
            "G",
            "A"
          ],
          [
            "A",
            "Q",
            "T",
            "R",
            "G",
            "D",
            "N"
          ]
        ],
        "solutions": {
          "NANAS": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "PISANG": {
            "r1": 0,
            "c1": 5,
            "r2": 5,
            "c2": 5
          },
          "JAMBU": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 4
          },
          "MANGGA": {
            "r1": 0,
            "c1": 6,
            "r2": 5,
            "c2": 6
          }
        }
      },
      "words": [
        "APEL",
        "JERUK",
        "MELON",
        "SALAK"
      ],
      "grid": [
        [
          "A",
          "P",
          "E",
          "L",
          "J",
          "S",
          "A"
        ],
        [
          "A",
          "M",
          "O",
          "G",
          "E",
          "A",
          "E"
        ],
        [
          "N",
          "S",
          "O",
          "F",
          "R",
          "L",
          "R"
        ],
        [
          "A",
          "D",
          "R",
          "W",
          "U",
          "A",
          "R"
        ],
        [
          "B",
          "R",
          "E",
          "H",
          "K",
          "K",
          "S"
        ],
        [
          "M",
          "E",
          "L",
          "O",
          "N",
          "E",
          "T"
        ],
        [
          "N",
          "A",
          "Z",
          "N",
          "C",
          "E",
          "A"
        ]
      ],
      "solutions": {
        "APEL": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 3
        },
        "JERUK": {
          "r1": 0,
          "c1": 4,
          "r2": 4,
          "c2": 4
        },
        "MELON": {
          "r1": 5,
          "c1": 0,
          "r2": 5,
          "c2": 4
        },
        "SALAK": {
          "r1": 0,
          "c1": 5,
          "r2": 4,
          "c2": 5
        }
      }
    },
    {
      "topic": "Paket 5: Warna & Adab Baik (Kelas 1–2)",
      "gridSize": 7,
      "red": {
        "words": [
          "MERAH",
          "PUTIH",
          "HIJAU",
          "BIRU"
        ],
        "grid": [
          [
            "M",
            "E",
            "R",
            "A",
            "H",
            "P",
            "B"
          ],
          [
            "H",
            "I",
            "J",
            "A",
            "U",
            "U",
            "I"
          ],
          [
            "M",
            "E",
            "C",
            "I",
            "I",
            "T",
            "R"
          ],
          [
            "N",
            "O",
            "S",
            "N",
            "O",
            "I",
            "U"
          ],
          [
            "S",
            "N",
            "T",
            "R",
            "B",
            "H",
            "P"
          ],
          [
            "A",
            "N",
            "M",
            "F",
            "E",
            "S",
            "R"
          ],
          [
            "R",
            "W",
            "T",
            "F",
            "H",
            "A",
            "I"
          ]
        ],
        "solutions": {
          "MERAH": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "PUTIH": {
            "r1": 0,
            "c1": 5,
            "r2": 4,
            "c2": 5
          },
          "HIJAU": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 4
          },
          "BIRU": {
            "r1": 0,
            "c1": 6,
            "r2": 3,
            "c2": 6
          }
        }
      },
      "blue": {
        "words": [
          "KUNING",
          "BERSIH",
          "RAPI",
          "SOPAN"
        ],
        "grid": [
          [
            "K",
            "U",
            "N",
            "I",
            "N",
            "G",
            "B"
          ],
          [
            "R",
            "A",
            "P",
            "I",
            "S",
            "E",
            "E"
          ],
          [
            "A",
            "E",
            "K",
            "I",
            "O",
            "R",
            "R"
          ],
          [
            "Q",
            "C",
            "S",
            "F",
            "P",
            "T",
            "S"
          ],
          [
            "U",
            "R",
            "T",
            "I",
            "A",
            "J",
            "I"
          ],
          [
            "M",
            "T",
            "T",
            "G",
            "N",
            "L",
            "H"
          ],
          [
            "E",
            "R",
            "T",
            "E",
            "A",
            "G",
            "A"
          ]
        ],
        "solutions": {
          "KUNING": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 5
          },
          "BERSIH": {
            "r1": 0,
            "c1": 6,
            "r2": 5,
            "c2": 6
          },
          "RAPI": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 3
          },
          "SOPAN": {
            "r1": 1,
            "c1": 4,
            "r2": 5,
            "c2": 4
          }
        }
      },
      "words": [
        "MERAH",
        "PUTIH",
        "HIJAU",
        "BIRU"
      ],
      "grid": [
        [
          "M",
          "E",
          "R",
          "A",
          "H",
          "P",
          "B"
        ],
        [
          "H",
          "I",
          "J",
          "A",
          "U",
          "U",
          "I"
        ],
        [
          "M",
          "E",
          "C",
          "I",
          "I",
          "T",
          "R"
        ],
        [
          "N",
          "O",
          "S",
          "N",
          "O",
          "I",
          "U"
        ],
        [
          "S",
          "N",
          "T",
          "R",
          "B",
          "H",
          "P"
        ],
        [
          "A",
          "N",
          "M",
          "F",
          "E",
          "S",
          "R"
        ],
        [
          "R",
          "W",
          "T",
          "F",
          "H",
          "A",
          "I"
        ]
      ],
      "solutions": {
        "MERAH": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 4
        },
        "PUTIH": {
          "r1": 0,
          "c1": 5,
          "r2": 4,
          "c2": 5
        },
        "HIJAU": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 4
        },
        "BIRU": {
          "r1": 0,
          "c1": 6,
          "r2": 3,
          "c2": 6
        }
      }
    }
  ],
  "fase-b": [
    {
      "topic": "Paket 1: Ekosistem & Lingkungan (Kelas 3–4)",
      "gridSize": 8,
      "red": {
        "words": [
          "POHON",
          "TANAH",
          "HEWAN",
          "SUNGAI",
          "DANAU"
        ],
        "grid": [
          [
            "P",
            "O",
            "H",
            "O",
            "N",
            "T",
            "S",
            "W"
          ],
          [
            "H",
            "E",
            "W",
            "A",
            "N",
            "A",
            "U",
            "F"
          ],
          [
            "D",
            "A",
            "N",
            "A",
            "U",
            "N",
            "N",
            "S"
          ],
          [
            "A",
            "L",
            "T",
            "P",
            "T",
            "A",
            "G",
            "K"
          ],
          [
            "Z",
            "S",
            "C",
            "M",
            "Q",
            "H",
            "A",
            "G"
          ],
          [
            "O",
            "A",
            "I",
            "S",
            "E",
            "R",
            "I",
            "H"
          ],
          [
            "O",
            "T",
            "T",
            "R",
            "A",
            "N",
            "U",
            "S"
          ],
          [
            "Y",
            "N",
            "N",
            "L",
            "B",
            "P",
            "N",
            "A"
          ]
        ],
        "solutions": {
          "POHON": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "TANAH": {
            "r1": 0,
            "c1": 5,
            "r2": 4,
            "c2": 5
          },
          "HEWAN": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 4
          },
          "SUNGAI": {
            "r1": 0,
            "c1": 6,
            "r2": 5,
            "c2": 6
          },
          "DANAU": {
            "r1": 2,
            "c1": 0,
            "r2": 2,
            "c2": 4
          }
        }
      },
      "blue": {
        "words": [
          "UDARA",
          "RUMPUT",
          "HUTAN",
          "BATU",
          "MATAHARI"
        ],
        "grid": [
          [
            "U",
            "D",
            "A",
            "R",
            "A",
            "B",
            "Q",
            "D"
          ],
          [
            "V",
            "E",
            "H",
            "U",
            "T",
            "A",
            "N",
            "K"
          ],
          [
            "A",
            "R",
            "E",
            "M",
            "R",
            "T",
            "O",
            "U"
          ],
          [
            "J",
            "I",
            "S",
            "P",
            "O",
            "U",
            "I",
            "K"
          ],
          [
            "O",
            "A",
            "E",
            "U",
            "Y",
            "T",
            "O",
            "Y"
          ],
          [
            "A",
            "W",
            "A",
            "T",
            "E",
            "O",
            "Q",
            "R"
          ],
          [
            "M",
            "A",
            "T",
            "A",
            "H",
            "A",
            "R",
            "I"
          ],
          [
            "C",
            "F",
            "Z",
            "U",
            "E",
            "I",
            "E",
            "V"
          ]
        ],
        "solutions": {
          "UDARA": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "RUMPUT": {
            "r1": 0,
            "c1": 3,
            "r2": 5,
            "c2": 3
          },
          "HUTAN": {
            "r1": 1,
            "c1": 2,
            "r2": 1,
            "c2": 6
          },
          "BATU": {
            "r1": 0,
            "c1": 5,
            "r2": 3,
            "c2": 5
          },
          "MATAHARI": {
            "r1": 6,
            "c1": 0,
            "r2": 6,
            "c2": 7
          }
        }
      },
      "words": [
        "POHON",
        "TANAH",
        "HEWAN",
        "SUNGAI",
        "DANAU"
      ],
      "grid": [
        [
          "P",
          "O",
          "H",
          "O",
          "N",
          "T",
          "S",
          "W"
        ],
        [
          "H",
          "E",
          "W",
          "A",
          "N",
          "A",
          "U",
          "F"
        ],
        [
          "D",
          "A",
          "N",
          "A",
          "U",
          "N",
          "N",
          "S"
        ],
        [
          "A",
          "L",
          "T",
          "P",
          "T",
          "A",
          "G",
          "K"
        ],
        [
          "Z",
          "S",
          "C",
          "M",
          "Q",
          "H",
          "A",
          "G"
        ],
        [
          "O",
          "A",
          "I",
          "S",
          "E",
          "R",
          "I",
          "H"
        ],
        [
          "O",
          "T",
          "T",
          "R",
          "A",
          "N",
          "U",
          "S"
        ],
        [
          "Y",
          "N",
          "N",
          "L",
          "B",
          "P",
          "N",
          "A"
        ]
      ],
      "solutions": {
        "POHON": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 4
        },
        "TANAH": {
          "r1": 0,
          "c1": 5,
          "r2": 4,
          "c2": 5
        },
        "HEWAN": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 4
        },
        "SUNGAI": {
          "r1": 0,
          "c1": 6,
          "r2": 5,
          "c2": 6
        },
        "DANAU": {
          "r1": 2,
          "c1": 0,
          "r2": 2,
          "c2": 4
        }
      }
    },
    {
      "topic": "Paket 2: Wujud Zat & Benda (Kelas 3–4)",
      "gridSize": 8,
      "red": {
        "words": [
          "PADAT",
          "CAIR",
          "MENGUAP",
          "BEKU",
          "EMBUN"
        ],
        "grid": [
          [
            "P",
            "A",
            "D",
            "A",
            "T",
            "C",
            "H",
            "B"
          ],
          [
            "M",
            "E",
            "N",
            "G",
            "U",
            "A",
            "P",
            "E"
          ],
          [
            "E",
            "M",
            "B",
            "U",
            "N",
            "I",
            "I",
            "K"
          ],
          [
            "J",
            "U",
            "N",
            "A",
            "R",
            "R",
            "U",
            "U"
          ],
          [
            "H",
            "G",
            "S",
            "R",
            "C",
            "P",
            "M",
            "N"
          ],
          [
            "Z",
            "E",
            "A",
            "B",
            "E",
            "W",
            "N",
            "W"
          ],
          [
            "Q",
            "N",
            "S",
            "R",
            "R",
            "D",
            "J",
            "H"
          ],
          [
            "N",
            "F",
            "V",
            "G",
            "O",
            "T",
            "U",
            "W"
          ]
        ],
        "solutions": {
          "PADAT": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "CAIR": {
            "r1": 0,
            "c1": 5,
            "r2": 3,
            "c2": 5
          },
          "MENGUAP": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 6
          },
          "BEKU": {
            "r1": 0,
            "c1": 7,
            "r2": 3,
            "c2": 7
          },
          "EMBUN": {
            "r1": 2,
            "c1": 0,
            "r2": 2,
            "c2": 4
          }
        }
      },
      "blue": {
        "words": [
          "GAS",
          "MENCAIR",
          "SUBLIM",
          "UAP",
          "SUHU"
        ],
        "grid": [
          [
            "G",
            "A",
            "S",
            "M",
            "U",
            "B",
            "E",
            "N"
          ],
          [
            "W",
            "M",
            "F",
            "E",
            "A",
            "S",
            "E",
            "O"
          ],
          [
            "A",
            "U",
            "Z",
            "N",
            "P",
            "A",
            "S",
            "T"
          ],
          [
            "I",
            "I",
            "L",
            "C",
            "S",
            "U",
            "H",
            "U"
          ],
          [
            "H",
            "D",
            "J",
            "A",
            "I",
            "M",
            "A",
            "Y"
          ],
          [
            "S",
            "T",
            "J",
            "I",
            "L",
            "A",
            "E",
            "Y"
          ],
          [
            "G",
            "S",
            "P",
            "R",
            "U",
            "L",
            "A",
            "E"
          ],
          [
            "S",
            "U",
            "B",
            "L",
            "I",
            "M",
            "S",
            "I"
          ]
        ],
        "solutions": {
          "GAS": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 2
          },
          "MENCAIR": {
            "r1": 0,
            "c1": 3,
            "r2": 6,
            "c2": 3
          },
          "SUBLIM": {
            "r1": 7,
            "c1": 0,
            "r2": 7,
            "c2": 5
          },
          "UAP": {
            "r1": 0,
            "c1": 4,
            "r2": 2,
            "c2": 4
          },
          "SUHU": {
            "r1": 3,
            "c1": 4,
            "r2": 3,
            "c2": 7
          }
        }
      },
      "words": [
        "PADAT",
        "CAIR",
        "MENGUAP",
        "BEKU",
        "EMBUN"
      ],
      "grid": [
        [
          "P",
          "A",
          "D",
          "A",
          "T",
          "C",
          "H",
          "B"
        ],
        [
          "M",
          "E",
          "N",
          "G",
          "U",
          "A",
          "P",
          "E"
        ],
        [
          "E",
          "M",
          "B",
          "U",
          "N",
          "I",
          "I",
          "K"
        ],
        [
          "J",
          "U",
          "N",
          "A",
          "R",
          "R",
          "U",
          "U"
        ],
        [
          "H",
          "G",
          "S",
          "R",
          "C",
          "P",
          "M",
          "N"
        ],
        [
          "Z",
          "E",
          "A",
          "B",
          "E",
          "W",
          "N",
          "W"
        ],
        [
          "Q",
          "N",
          "S",
          "R",
          "R",
          "D",
          "J",
          "H"
        ],
        [
          "N",
          "F",
          "V",
          "G",
          "O",
          "T",
          "U",
          "W"
        ]
      ],
      "solutions": {
        "PADAT": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 4
        },
        "CAIR": {
          "r1": 0,
          "c1": 5,
          "r2": 3,
          "c2": 5
        },
        "MENGUAP": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 6
        },
        "BEKU": {
          "r1": 0,
          "c1": 7,
          "r2": 3,
          "c2": 7
        },
        "EMBUN": {
          "r1": 2,
          "c1": 0,
          "r2": 2,
          "c2": 4
        }
      }
    },
    {
      "topic": "Paket 3: Budaya Nusantara (Kelas 3–4)",
      "gridSize": 8,
      "red": {
        "words": [
          "BATIK",
          "JOGLO",
          "ANGKLUNG",
          "TARI",
          "SONGKET"
        ],
        "grid": [
          [
            "B",
            "A",
            "T",
            "I",
            "K",
            "J",
            "T",
            "L"
          ],
          [
            "A",
            "O",
            "A",
            "O",
            "H",
            "O",
            "S",
            "V"
          ],
          [
            "F",
            "Q",
            "R",
            "S",
            "E",
            "G",
            "T",
            "P"
          ],
          [
            "R",
            "N",
            "I",
            "W",
            "A",
            "L",
            "G",
            "A"
          ],
          [
            "Q",
            "M",
            "J",
            "A",
            "N",
            "O",
            "K",
            "N"
          ],
          [
            "A",
            "N",
            "G",
            "K",
            "L",
            "U",
            "N",
            "G"
          ],
          [
            "S",
            "O",
            "N",
            "G",
            "K",
            "E",
            "T",
            "V"
          ],
          [
            "N",
            "N",
            "W",
            "D",
            "N",
            "A",
            "R",
            "Z"
          ]
        ],
        "solutions": {
          "BATIK": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "JOGLO": {
            "r1": 0,
            "c1": 5,
            "r2": 4,
            "c2": 5
          },
          "ANGKLUNG": {
            "r1": 5,
            "c1": 0,
            "r2": 5,
            "c2": 7
          },
          "TARI": {
            "r1": 0,
            "c1": 2,
            "r2": 3,
            "c2": 2
          },
          "SONGKET": {
            "r1": 6,
            "c1": 0,
            "r2": 6,
            "c2": 6
          }
        }
      },
      "blue": {
        "words": [
          "GAMELAN",
          "KERIS",
          "KEBAYA",
          "REOG",
          "TENUN"
        ],
        "grid": [
          [
            "G",
            "A",
            "M",
            "E",
            "L",
            "A",
            "N",
            "K"
          ],
          [
            "K",
            "E",
            "B",
            "A",
            "Y",
            "A",
            "R",
            "E"
          ],
          [
            "T",
            "E",
            "N",
            "U",
            "N",
            "N",
            "E",
            "R"
          ],
          [
            "H",
            "D",
            "Q",
            "N",
            "N",
            "T",
            "O",
            "I"
          ],
          [
            "F",
            "N",
            "H",
            "U",
            "N",
            "R",
            "G",
            "S"
          ],
          [
            "S",
            "A",
            "G",
            "H",
            "G",
            "O",
            "A",
            "V"
          ],
          [
            "Z",
            "I",
            "D",
            "T",
            "P",
            "N",
            "O",
            "G"
          ],
          [
            "L",
            "R",
            "S",
            "G",
            "N",
            "K",
            "N",
            "N"
          ]
        ],
        "solutions": {
          "GAMELAN": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 6
          },
          "KERIS": {
            "r1": 0,
            "c1": 7,
            "r2": 4,
            "c2": 7
          },
          "KEBAYA": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 5
          },
          "REOG": {
            "r1": 1,
            "c1": 6,
            "r2": 4,
            "c2": 6
          },
          "TENUN": {
            "r1": 2,
            "c1": 0,
            "r2": 2,
            "c2": 4
          }
        }
      },
      "words": [
        "BATIK",
        "JOGLO",
        "ANGKLUNG",
        "TARI",
        "SONGKET"
      ],
      "grid": [
        [
          "B",
          "A",
          "T",
          "I",
          "K",
          "J",
          "T",
          "L"
        ],
        [
          "A",
          "O",
          "A",
          "O",
          "H",
          "O",
          "S",
          "V"
        ],
        [
          "F",
          "Q",
          "R",
          "S",
          "E",
          "G",
          "T",
          "P"
        ],
        [
          "R",
          "N",
          "I",
          "W",
          "A",
          "L",
          "G",
          "A"
        ],
        [
          "Q",
          "M",
          "J",
          "A",
          "N",
          "O",
          "K",
          "N"
        ],
        [
          "A",
          "N",
          "G",
          "K",
          "L",
          "U",
          "N",
          "G"
        ],
        [
          "S",
          "O",
          "N",
          "G",
          "K",
          "E",
          "T",
          "V"
        ],
        [
          "N",
          "N",
          "W",
          "D",
          "N",
          "A",
          "R",
          "Z"
        ]
      ],
      "solutions": {
        "BATIK": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 4
        },
        "JOGLO": {
          "r1": 0,
          "c1": 5,
          "r2": 4,
          "c2": 5
        },
        "ANGKLUNG": {
          "r1": 5,
          "c1": 0,
          "r2": 5,
          "c2": 7
        },
        "TARI": {
          "r1": 0,
          "c1": 2,
          "r2": 3,
          "c2": 2
        },
        "SONGKET": {
          "r1": 6,
          "c1": 0,
          "r2": 6,
          "c2": 6
        }
      }
    },
    {
      "topic": "Paket 4: Gaya & Energi (Kelas 3–4)",
      "gridSize": 8,
      "red": {
        "words": [
          "MAGNET",
          "PEGAS",
          "TARIK",
          "PANAS",
          "GERAK"
        ],
        "grid": [
          [
            "M",
            "A",
            "G",
            "N",
            "E",
            "T",
            "P",
            "P"
          ],
          [
            "T",
            "A",
            "R",
            "I",
            "K",
            "E",
            "E",
            "A"
          ],
          [
            "G",
            "E",
            "R",
            "A",
            "K",
            "N",
            "G",
            "N"
          ],
          [
            "R",
            "G",
            "P",
            "O",
            "T",
            "W",
            "A",
            "A"
          ],
          [
            "E",
            "A",
            "S",
            "T",
            "L",
            "O",
            "S",
            "S"
          ],
          [
            "V",
            "M",
            "U",
            "U",
            "N",
            "Z",
            "C",
            "A"
          ],
          [
            "G",
            "B",
            "K",
            "G",
            "F",
            "A",
            "I",
            "Y"
          ],
          [
            "J",
            "Z",
            "O",
            "U",
            "L",
            "P",
            "T",
            "G"
          ]
        ],
        "solutions": {
          "MAGNET": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 5
          },
          "PEGAS": {
            "r1": 0,
            "c1": 6,
            "r2": 4,
            "c2": 6
          },
          "TARIK": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 4
          },
          "PANAS": {
            "r1": 0,
            "c1": 7,
            "r2": 4,
            "c2": 7
          },
          "GERAK": {
            "r1": 2,
            "c1": 0,
            "r2": 2,
            "c2": 4
          }
        }
      },
      "blue": {
        "words": [
          "GESEK",
          "LISTRIK",
          "CAHAYA",
          "KINETIK",
          "DORONG"
        ],
        "grid": [
          [
            "G",
            "E",
            "S",
            "E",
            "K",
            "Z",
            "L",
            "K"
          ],
          [
            "C",
            "A",
            "H",
            "A",
            "Y",
            "A",
            "I",
            "I"
          ],
          [
            "D",
            "O",
            "R",
            "O",
            "N",
            "G",
            "S",
            "N"
          ],
          [
            "K",
            "T",
            "J",
            "P",
            "T",
            "U",
            "T",
            "E"
          ],
          [
            "G",
            "K",
            "R",
            "U",
            "A",
            "I",
            "R",
            "T"
          ],
          [
            "R",
            "E",
            "G",
            "G",
            "B",
            "U",
            "I",
            "I"
          ],
          [
            "A",
            "H",
            "N",
            "G",
            "F",
            "R",
            "K",
            "K"
          ],
          [
            "N",
            "G",
            "T",
            "C",
            "U",
            "E",
            "N",
            "H"
          ]
        ],
        "solutions": {
          "GESEK": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "LISTRIK": {
            "r1": 0,
            "c1": 6,
            "r2": 6,
            "c2": 6
          },
          "CAHAYA": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 5
          },
          "KINETIK": {
            "r1": 0,
            "c1": 7,
            "r2": 6,
            "c2": 7
          },
          "DORONG": {
            "r1": 2,
            "c1": 0,
            "r2": 2,
            "c2": 5
          }
        }
      },
      "words": [
        "MAGNET",
        "PEGAS",
        "TARIK",
        "PANAS",
        "GERAK"
      ],
      "grid": [
        [
          "M",
          "A",
          "G",
          "N",
          "E",
          "T",
          "P",
          "P"
        ],
        [
          "T",
          "A",
          "R",
          "I",
          "K",
          "E",
          "E",
          "A"
        ],
        [
          "G",
          "E",
          "R",
          "A",
          "K",
          "N",
          "G",
          "N"
        ],
        [
          "R",
          "G",
          "P",
          "O",
          "T",
          "W",
          "A",
          "A"
        ],
        [
          "E",
          "A",
          "S",
          "T",
          "L",
          "O",
          "S",
          "S"
        ],
        [
          "V",
          "M",
          "U",
          "U",
          "N",
          "Z",
          "C",
          "A"
        ],
        [
          "G",
          "B",
          "K",
          "G",
          "F",
          "A",
          "I",
          "Y"
        ],
        [
          "J",
          "Z",
          "O",
          "U",
          "L",
          "P",
          "T",
          "G"
        ]
      ],
      "solutions": {
        "MAGNET": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 5
        },
        "PEGAS": {
          "r1": 0,
          "c1": 6,
          "r2": 4,
          "c2": 6
        },
        "TARIK": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 4
        },
        "PANAS": {
          "r1": 0,
          "c1": 7,
          "r2": 4,
          "c2": 7
        },
        "GERAK": {
          "r1": 2,
          "c1": 0,
          "r2": 2,
          "c2": 4
        }
      }
    },
    {
      "topic": "Paket 5: Tumbuhan & Hijau Daun (Kelas 3–4)",
      "gridSize": 8,
      "red": {
        "words": [
          "AKAR",
          "BATANG",
          "DAUN",
          "KLOROFIL",
          "SERBUK"
        ],
        "grid": [
          [
            "A",
            "K",
            "A",
            "R",
            "B",
            "Q",
            "K",
            "P"
          ],
          [
            "D",
            "A",
            "U",
            "N",
            "A",
            "H",
            "L",
            "A"
          ],
          [
            "R",
            "V",
            "U",
            "Z",
            "T",
            "A",
            "O",
            "I"
          ],
          [
            "S",
            "H",
            "B",
            "O",
            "A",
            "A",
            "R",
            "L"
          ],
          [
            "U",
            "R",
            "T",
            "V",
            "N",
            "O",
            "O",
            "P"
          ],
          [
            "E",
            "E",
            "G",
            "E",
            "G",
            "A",
            "F",
            "F"
          ],
          [
            "S",
            "E",
            "R",
            "B",
            "U",
            "K",
            "I",
            "E"
          ],
          [
            "H",
            "V",
            "T",
            "O",
            "P",
            "F",
            "L",
            "G"
          ]
        ],
        "solutions": {
          "AKAR": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "BATANG": {
            "r1": 0,
            "c1": 4,
            "r2": 5,
            "c2": 4
          },
          "DAUN": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 3
          },
          "KLOROFIL": {
            "r1": 0,
            "c1": 6,
            "r2": 7,
            "c2": 6
          },
          "SERBUK": {
            "r1": 6,
            "c1": 0,
            "r2": 6,
            "c2": 5
          }
        }
      },
      "blue": {
        "words": [
          "BUNGA",
          "BUAH",
          "STOMATA",
          "XILEM",
          "FLOEM"
        ],
        "grid": [
          [
            "B",
            "U",
            "N",
            "G",
            "A",
            "J",
            "N",
            "K"
          ],
          [
            "U",
            "S",
            "T",
            "O",
            "M",
            "A",
            "T",
            "A"
          ],
          [
            "A",
            "X",
            "F",
            "L",
            "O",
            "E",
            "M",
            "C"
          ],
          [
            "H",
            "I",
            "R",
            "A",
            "V",
            "H",
            "I",
            "A"
          ],
          [
            "U",
            "L",
            "P",
            "A",
            "R",
            "I",
            "E",
            "E"
          ],
          [
            "Z",
            "E",
            "C",
            "Y",
            "T",
            "B",
            "E",
            "I"
          ],
          [
            "O",
            "M",
            "I",
            "A",
            "Z",
            "A",
            "E",
            "R"
          ],
          [
            "I",
            "I",
            "C",
            "A",
            "U",
            "S",
            "F",
            "B"
          ]
        ],
        "solutions": {
          "BUNGA": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "BUAH": {
            "r1": 0,
            "c1": 0,
            "r2": 3,
            "c2": 0
          },
          "STOMATA": {
            "r1": 1,
            "c1": 1,
            "r2": 1,
            "c2": 7
          },
          "XILEM": {
            "r1": 2,
            "c1": 1,
            "r2": 6,
            "c2": 1
          },
          "FLOEM": {
            "r1": 2,
            "c1": 2,
            "r2": 2,
            "c2": 6
          }
        }
      },
      "words": [
        "AKAR",
        "BATANG",
        "DAUN",
        "KLOROFIL",
        "SERBUK"
      ],
      "grid": [
        [
          "A",
          "K",
          "A",
          "R",
          "B",
          "Q",
          "K",
          "P"
        ],
        [
          "D",
          "A",
          "U",
          "N",
          "A",
          "H",
          "L",
          "A"
        ],
        [
          "R",
          "V",
          "U",
          "Z",
          "T",
          "A",
          "O",
          "I"
        ],
        [
          "S",
          "H",
          "B",
          "O",
          "A",
          "A",
          "R",
          "L"
        ],
        [
          "U",
          "R",
          "T",
          "V",
          "N",
          "O",
          "O",
          "P"
        ],
        [
          "E",
          "E",
          "G",
          "E",
          "G",
          "A",
          "F",
          "F"
        ],
        [
          "S",
          "E",
          "R",
          "B",
          "U",
          "K",
          "I",
          "E"
        ],
        [
          "H",
          "V",
          "T",
          "O",
          "P",
          "F",
          "L",
          "G"
        ]
      ],
      "solutions": {
        "AKAR": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 3
        },
        "BATANG": {
          "r1": 0,
          "c1": 4,
          "r2": 5,
          "c2": 4
        },
        "DAUN": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 3
        },
        "KLOROFIL": {
          "r1": 0,
          "c1": 6,
          "r2": 7,
          "c2": 6
        },
        "SERBUK": {
          "r1": 6,
          "c1": 0,
          "r2": 6,
          "c2": 5
        }
      }
    }
  ],
  "fase-c": [
    {
      "topic": "Paket 1: Organ Vital Tubuh (Kelas 5–6)",
      "gridSize": 8,
      "red": {
        "words": [
          "JANTUNG",
          "GINJAL",
          "LAMBUNG",
          "ARTERI",
          "TRAKEA"
        ],
        "grid": [
          [
            "J",
            "A",
            "N",
            "T",
            "U",
            "N",
            "G",
            "A"
          ],
          [
            "A",
            "S",
            "Z",
            "T",
            "T",
            "D",
            "I",
            "V"
          ],
          [
            "R",
            "L",
            "A",
            "M",
            "B",
            "U",
            "N",
            "G"
          ],
          [
            "T",
            "R",
            "A",
            "K",
            "E",
            "A",
            "J",
            "A"
          ],
          [
            "E",
            "A",
            "S",
            "T",
            "W",
            "S",
            "A",
            "N"
          ],
          [
            "R",
            "F",
            "J",
            "T",
            "N",
            "A",
            "L",
            "T"
          ],
          [
            "I",
            "A",
            "E",
            "A",
            "H",
            "E",
            "A",
            "S"
          ],
          [
            "K",
            "A",
            "R",
            "I",
            "O",
            "Q",
            "K",
            "A"
          ]
        ],
        "solutions": {
          "JANTUNG": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 6
          },
          "GINJAL": {
            "r1": 0,
            "c1": 6,
            "r2": 5,
            "c2": 6
          },
          "LAMBUNG": {
            "r1": 2,
            "c1": 1,
            "r2": 2,
            "c2": 7
          },
          "ARTERI": {
            "r1": 1,
            "c1": 0,
            "r2": 6,
            "c2": 0
          },
          "TRAKEA": {
            "r1": 3,
            "c1": 0,
            "r2": 3,
            "c2": 5
          }
        }
      },
      "blue": {
        "words": [
          "PARU",
          "HATI",
          "USUS",
          "AORTA",
          "PLASMA"
        ],
        "grid": [
          [
            "P",
            "A",
            "R",
            "U",
            "H",
            "A",
            "U",
            "O"
          ],
          [
            "U",
            "S",
            "U",
            "S",
            "A",
            "O",
            "A",
            "V"
          ],
          [
            "S",
            "I",
            "Y",
            "I",
            "T",
            "R",
            "F",
            "I"
          ],
          [
            "U",
            "E",
            "Q",
            "R",
            "I",
            "T",
            "N",
            "E"
          ],
          [
            "P",
            "L",
            "A",
            "S",
            "M",
            "A",
            "E",
            "T"
          ],
          [
            "J",
            "U",
            "G",
            "R",
            "A",
            "M",
            "L",
            "F"
          ],
          [
            "T",
            "C",
            "U",
            "O",
            "D",
            "E",
            "I",
            "Y"
          ],
          [
            "T",
            "N",
            "U",
            "A",
            "J",
            "I",
            "G",
            "N"
          ]
        ],
        "solutions": {
          "PARU": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "HATI": {
            "r1": 0,
            "c1": 4,
            "r2": 3,
            "c2": 4
          },
          "USUS": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 3
          },
          "AORTA": {
            "r1": 0,
            "c1": 5,
            "r2": 4,
            "c2": 5
          },
          "PLASMA": {
            "r1": 4,
            "c1": 0,
            "r2": 4,
            "c2": 5
          }
        }
      },
      "words": [
        "JANTUNG",
        "GINJAL",
        "LAMBUNG",
        "ARTERI",
        "TRAKEA"
      ],
      "grid": [
        [
          "J",
          "A",
          "N",
          "T",
          "U",
          "N",
          "G",
          "A"
        ],
        [
          "A",
          "S",
          "Z",
          "T",
          "T",
          "D",
          "I",
          "V"
        ],
        [
          "R",
          "L",
          "A",
          "M",
          "B",
          "U",
          "N",
          "G"
        ],
        [
          "T",
          "R",
          "A",
          "K",
          "E",
          "A",
          "J",
          "A"
        ],
        [
          "E",
          "A",
          "S",
          "T",
          "W",
          "S",
          "A",
          "N"
        ],
        [
          "R",
          "F",
          "J",
          "T",
          "N",
          "A",
          "L",
          "T"
        ],
        [
          "I",
          "A",
          "E",
          "A",
          "H",
          "E",
          "A",
          "S"
        ],
        [
          "K",
          "A",
          "R",
          "I",
          "O",
          "Q",
          "K",
          "A"
        ]
      ],
      "solutions": {
        "JANTUNG": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 6
        },
        "GINJAL": {
          "r1": 0,
          "c1": 6,
          "r2": 5,
          "c2": 6
        },
        "LAMBUNG": {
          "r1": 2,
          "c1": 1,
          "r2": 2,
          "c2": 7
        },
        "ARTERI": {
          "r1": 1,
          "c1": 0,
          "r2": 6,
          "c2": 0
        },
        "TRAKEA": {
          "r1": 3,
          "c1": 0,
          "r2": 3,
          "c2": 5
        }
      }
    },
    {
      "topic": "Paket 2: Tata Surya & Planet (Kelas 5–6)",
      "gridSize": 8,
      "red": {
        "words": [
          "BUMI",
          "JUPITER",
          "URANUS",
          "KOMET",
          "PLANET"
        ],
        "grid": [
          [
            "B",
            "U",
            "M",
            "I",
            "J",
            "N",
            "K",
            "T"
          ],
          [
            "U",
            "R",
            "A",
            "N",
            "U",
            "S",
            "O",
            "O"
          ],
          [
            "N",
            "U",
            "K",
            "W",
            "P",
            "A",
            "M",
            "Y"
          ],
          [
            "A",
            "T",
            "L",
            "J",
            "I",
            "N",
            "E",
            "L"
          ],
          [
            "I",
            "S",
            "I",
            "I",
            "T",
            "S",
            "T",
            "N"
          ],
          [
            "P",
            "L",
            "A",
            "N",
            "E",
            "T",
            "T",
            "A"
          ],
          [
            "L",
            "A",
            "W",
            "N",
            "R",
            "O",
            "W",
            "B"
          ],
          [
            "U",
            "J",
            "R",
            "E",
            "U",
            "P",
            "B",
            "O"
          ]
        ],
        "solutions": {
          "BUMI": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "JUPITER": {
            "r1": 0,
            "c1": 4,
            "r2": 6,
            "c2": 4
          },
          "URANUS": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 5
          },
          "KOMET": {
            "r1": 0,
            "c1": 6,
            "r2": 4,
            "c2": 6
          },
          "PLANET": {
            "r1": 5,
            "c1": 0,
            "r2": 5,
            "c2": 5
          }
        }
      },
      "blue": {
        "words": [
          "VENUS",
          "MARS",
          "SATURNUS",
          "NEPTUNUS",
          "BULAN"
        ],
        "grid": [
          [
            "V",
            "E",
            "N",
            "U",
            "S",
            "M",
            "N",
            "G"
          ],
          [
            "B",
            "U",
            "L",
            "A",
            "N",
            "A",
            "E",
            "R"
          ],
          [
            "R",
            "P",
            "T",
            "P",
            "A",
            "R",
            "P",
            "J"
          ],
          [
            "E",
            "S",
            "V",
            "S",
            "H",
            "S",
            "T",
            "Q"
          ],
          [
            "S",
            "A",
            "T",
            "U",
            "R",
            "N",
            "U",
            "S"
          ],
          [
            "S",
            "D",
            "D",
            "P",
            "Q",
            "T",
            "N",
            "S"
          ],
          [
            "F",
            "Z",
            "O",
            "H",
            "C",
            "N",
            "U",
            "H"
          ],
          [
            "Q",
            "A",
            "Q",
            "A",
            "J",
            "S",
            "S",
            "O"
          ]
        ],
        "solutions": {
          "VENUS": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "MARS": {
            "r1": 0,
            "c1": 5,
            "r2": 3,
            "c2": 5
          },
          "SATURNUS": {
            "r1": 4,
            "c1": 0,
            "r2": 4,
            "c2": 7
          },
          "NEPTUNUS": {
            "r1": 0,
            "c1": 6,
            "r2": 7,
            "c2": 6
          },
          "BULAN": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 4
          }
        }
      },
      "words": [
        "BUMI",
        "JUPITER",
        "URANUS",
        "KOMET",
        "PLANET"
      ],
      "grid": [
        [
          "B",
          "U",
          "M",
          "I",
          "J",
          "N",
          "K",
          "T"
        ],
        [
          "U",
          "R",
          "A",
          "N",
          "U",
          "S",
          "O",
          "O"
        ],
        [
          "N",
          "U",
          "K",
          "W",
          "P",
          "A",
          "M",
          "Y"
        ],
        [
          "A",
          "T",
          "L",
          "J",
          "I",
          "N",
          "E",
          "L"
        ],
        [
          "I",
          "S",
          "I",
          "I",
          "T",
          "S",
          "T",
          "N"
        ],
        [
          "P",
          "L",
          "A",
          "N",
          "E",
          "T",
          "T",
          "A"
        ],
        [
          "L",
          "A",
          "W",
          "N",
          "R",
          "O",
          "W",
          "B"
        ],
        [
          "U",
          "J",
          "R",
          "E",
          "U",
          "P",
          "B",
          "O"
        ]
      ],
      "solutions": {
        "BUMI": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 3
        },
        "JUPITER": {
          "r1": 0,
          "c1": 4,
          "r2": 6,
          "c2": 4
        },
        "URANUS": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 5
        },
        "KOMET": {
          "r1": 0,
          "c1": 6,
          "r2": 4,
          "c2": 6
        },
        "PLANET": {
          "r1": 5,
          "c1": 0,
          "r2": 5,
          "c2": 5
        }
      }
    },
    {
      "topic": "Paket 3: Kalor & Perpindahan Panas (Kelas 5–6)",
      "gridSize": 8,
      "red": {
        "words": [
          "KONDUKSI",
          "RADIASI",
          "ISOLATOR",
          "KALOR",
          "MEMUAI"
        ],
        "grid": [
          [
            "K",
            "O",
            "N",
            "D",
            "U",
            "K",
            "S",
            "I"
          ],
          [
            "R",
            "Z",
            "K",
            "W",
            "E",
            "G",
            "W",
            "S"
          ],
          [
            "A",
            "Z",
            "A",
            "A",
            "U",
            "K",
            "T",
            "A"
          ],
          [
            "D",
            "A",
            "L",
            "N",
            "Q",
            "H",
            "R",
            "E"
          ],
          [
            "I",
            "S",
            "O",
            "L",
            "A",
            "T",
            "O",
            "R"
          ],
          [
            "A",
            "P",
            "R",
            "Q",
            "A",
            "I",
            "V",
            "N"
          ],
          [
            "S",
            "M",
            "E",
            "M",
            "U",
            "A",
            "I",
            "Y"
          ],
          [
            "I",
            "T",
            "F",
            "T",
            "S",
            "M",
            "I",
            "E"
          ]
        ],
        "solutions": {
          "KONDUKSI": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 7
          },
          "RADIASI": {
            "r1": 1,
            "c1": 0,
            "r2": 7,
            "c2": 0
          },
          "ISOLATOR": {
            "r1": 4,
            "c1": 0,
            "r2": 4,
            "c2": 7
          },
          "KALOR": {
            "r1": 1,
            "c1": 2,
            "r2": 5,
            "c2": 2
          },
          "MEMUAI": {
            "r1": 6,
            "c1": 1,
            "r2": 6,
            "c2": 6
          }
        }
      },
      "blue": {
        "words": [
          "KONVEKSI",
          "LOGAM",
          "SUHU",
          "CELSIUS",
          "MENCAIR"
        ],
        "grid": [
          [
            "K",
            "O",
            "N",
            "V",
            "E",
            "K",
            "S",
            "I"
          ],
          [
            "L",
            "S",
            "U",
            "H",
            "U",
            "C",
            "R",
            "T"
          ],
          [
            "O",
            "I",
            "I",
            "V",
            "Y",
            "E",
            "A",
            "K"
          ],
          [
            "G",
            "B",
            "A",
            "V",
            "G",
            "L",
            "A",
            "P"
          ],
          [
            "A",
            "Z",
            "C",
            "B",
            "L",
            "S",
            "Y",
            "R"
          ],
          [
            "M",
            "E",
            "N",
            "C",
            "A",
            "I",
            "R",
            "E"
          ],
          [
            "U",
            "U",
            "R",
            "E",
            "A",
            "U",
            "G",
            "N"
          ],
          [
            "N",
            "I",
            "D",
            "U",
            "K",
            "S",
            "N",
            "I"
          ]
        ],
        "solutions": {
          "KONVEKSI": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 7
          },
          "LOGAM": {
            "r1": 1,
            "c1": 0,
            "r2": 5,
            "c2": 0
          },
          "SUHU": {
            "r1": 1,
            "c1": 1,
            "r2": 1,
            "c2": 4
          },
          "CELSIUS": {
            "r1": 1,
            "c1": 5,
            "r2": 7,
            "c2": 5
          },
          "MENCAIR": {
            "r1": 5,
            "c1": 0,
            "r2": 5,
            "c2": 6
          }
        }
      },
      "words": [
        "KONDUKSI",
        "RADIASI",
        "ISOLATOR",
        "KALOR",
        "MEMUAI"
      ],
      "grid": [
        [
          "K",
          "O",
          "N",
          "D",
          "U",
          "K",
          "S",
          "I"
        ],
        [
          "R",
          "Z",
          "K",
          "W",
          "E",
          "G",
          "W",
          "S"
        ],
        [
          "A",
          "Z",
          "A",
          "A",
          "U",
          "K",
          "T",
          "A"
        ],
        [
          "D",
          "A",
          "L",
          "N",
          "Q",
          "H",
          "R",
          "E"
        ],
        [
          "I",
          "S",
          "O",
          "L",
          "A",
          "T",
          "O",
          "R"
        ],
        [
          "A",
          "P",
          "R",
          "Q",
          "A",
          "I",
          "V",
          "N"
        ],
        [
          "S",
          "M",
          "E",
          "M",
          "U",
          "A",
          "I",
          "Y"
        ],
        [
          "I",
          "T",
          "F",
          "T",
          "S",
          "M",
          "I",
          "E"
        ]
      ],
      "solutions": {
        "KONDUKSI": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 7
        },
        "RADIASI": {
          "r1": 1,
          "c1": 0,
          "r2": 7,
          "c2": 0
        },
        "ISOLATOR": {
          "r1": 4,
          "c1": 0,
          "r2": 4,
          "c2": 7
        },
        "KALOR": {
          "r1": 1,
          "c1": 2,
          "r2": 5,
          "c2": 2
        },
        "MEMUAI": {
          "r1": 6,
          "c1": 1,
          "r2": 6,
          "c2": 6
        }
      }
    },
    {
      "topic": "Paket 4: Listrik & Magnet (Kelas 5–6)",
      "gridSize": 8,
      "red": {
        "words": [
          "PARALEL",
          "SAKELAR",
          "SEKRING",
          "VOLTASE",
          "INDUKSI"
        ],
        "grid": [
          [
            "P",
            "A",
            "R",
            "A",
            "L",
            "E",
            "L",
            "S"
          ],
          [
            "V",
            "I",
            "A",
            "V",
            "A",
            "Z",
            "A",
            "A"
          ],
          [
            "O",
            "A",
            "B",
            "S",
            "T",
            "T",
            "N",
            "K"
          ],
          [
            "L",
            "S",
            "N",
            "U",
            "G",
            "P",
            "A",
            "E"
          ],
          [
            "T",
            "V",
            "O",
            "M",
            "Y",
            "T",
            "R",
            "L"
          ],
          [
            "A",
            "U",
            "Q",
            "A",
            "A",
            "O",
            "V",
            "A"
          ],
          [
            "S",
            "E",
            "K",
            "R",
            "I",
            "N",
            "G",
            "R"
          ],
          [
            "E",
            "I",
            "N",
            "D",
            "U",
            "K",
            "S",
            "I"
          ]
        ],
        "solutions": {
          "PARALEL": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 6
          },
          "SAKELAR": {
            "r1": 0,
            "c1": 7,
            "r2": 6,
            "c2": 7
          },
          "SEKRING": {
            "r1": 6,
            "c1": 0,
            "r2": 6,
            "c2": 6
          },
          "VOLTASE": {
            "r1": 1,
            "c1": 0,
            "r2": 7,
            "c2": 0
          },
          "INDUKSI": {
            "r1": 7,
            "c1": 1,
            "r2": 7,
            "c2": 7
          }
        }
      },
      "blue": {
        "words": [
          "SERI",
          "DINAMO",
          "BATERAI",
          "KUTUB",
          "ARUS"
        ],
        "grid": [
          [
            "S",
            "E",
            "R",
            "I",
            "D",
            "K",
            "D",
            "V"
          ],
          [
            "A",
            "R",
            "U",
            "S",
            "I",
            "U",
            "A",
            "B"
          ],
          [
            "Z",
            "E",
            "A",
            "M",
            "N",
            "T",
            "A",
            "K"
          ],
          [
            "W",
            "U",
            "P",
            "O",
            "A",
            "U",
            "C",
            "A"
          ],
          [
            "A",
            "G",
            "E",
            "P",
            "M",
            "B",
            "R",
            "J"
          ],
          [
            "S",
            "T",
            "A",
            "U",
            "O",
            "A",
            "R",
            "I"
          ],
          [
            "B",
            "A",
            "T",
            "E",
            "R",
            "A",
            "I",
            "T"
          ],
          [
            "P",
            "P",
            "L",
            "H",
            "D",
            "N",
            "E",
            "G"
          ]
        ],
        "solutions": {
          "SERI": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 3
          },
          "DINAMO": {
            "r1": 0,
            "c1": 4,
            "r2": 5,
            "c2": 4
          },
          "BATERAI": {
            "r1": 6,
            "c1": 0,
            "r2": 6,
            "c2": 6
          },
          "KUTUB": {
            "r1": 0,
            "c1": 5,
            "r2": 4,
            "c2": 5
          },
          "ARUS": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 3
          }
        }
      },
      "words": [
        "PARALEL",
        "SAKELAR",
        "SEKRING",
        "VOLTASE",
        "INDUKSI"
      ],
      "grid": [
        [
          "P",
          "A",
          "R",
          "A",
          "L",
          "E",
          "L",
          "S"
        ],
        [
          "V",
          "I",
          "A",
          "V",
          "A",
          "Z",
          "A",
          "A"
        ],
        [
          "O",
          "A",
          "B",
          "S",
          "T",
          "T",
          "N",
          "K"
        ],
        [
          "L",
          "S",
          "N",
          "U",
          "G",
          "P",
          "A",
          "E"
        ],
        [
          "T",
          "V",
          "O",
          "M",
          "Y",
          "T",
          "R",
          "L"
        ],
        [
          "A",
          "U",
          "Q",
          "A",
          "A",
          "O",
          "V",
          "A"
        ],
        [
          "S",
          "E",
          "K",
          "R",
          "I",
          "N",
          "G",
          "R"
        ],
        [
          "E",
          "I",
          "N",
          "D",
          "U",
          "K",
          "S",
          "I"
        ]
      ],
      "solutions": {
        "PARALEL": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 6
        },
        "SAKELAR": {
          "r1": 0,
          "c1": 7,
          "r2": 6,
          "c2": 7
        },
        "SEKRING": {
          "r1": 6,
          "c1": 0,
          "r2": 6,
          "c2": 6
        },
        "VOLTASE": {
          "r1": 1,
          "c1": 0,
          "r2": 7,
          "c2": 0
        },
        "INDUKSI": {
          "r1": 7,
          "c1": 1,
          "r2": 7,
          "c2": 7
        }
      }
    },
    {
      "topic": "Paket 5: Sejarah Proklamasi (Kelas 5–6)",
      "gridSize": 8,
      "red": {
        "words": [
          "MERDEKA",
          "SOEKARNO",
          "BANGSA",
          "BENTENG",
          "GERILYA"
        ],
        "grid": [
          [
            "M",
            "E",
            "R",
            "D",
            "E",
            "K",
            "A",
            "S"
          ],
          [
            "B",
            "A",
            "N",
            "G",
            "S",
            "A",
            "U",
            "O"
          ],
          [
            "E",
            "B",
            "N",
            "S",
            "A",
            "G",
            "A",
            "E"
          ],
          [
            "N",
            "C",
            "R",
            "C",
            "T",
            "C",
            "I",
            "K"
          ],
          [
            "T",
            "G",
            "E",
            "R",
            "I",
            "L",
            "Y",
            "A"
          ],
          [
            "E",
            "N",
            "A",
            "F",
            "O",
            "U",
            "D",
            "R"
          ],
          [
            "N",
            "N",
            "Z",
            "N",
            "R",
            "T",
            "R",
            "N"
          ],
          [
            "G",
            "N",
            "S",
            "E",
            "K",
            "G",
            "H",
            "O"
          ]
        ],
        "solutions": {
          "MERDEKA": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 6
          },
          "SOEKARNO": {
            "r1": 0,
            "c1": 7,
            "r2": 7,
            "c2": 7
          },
          "BANGSA": {
            "r1": 1,
            "c1": 0,
            "r2": 1,
            "c2": 5
          },
          "BENTENG": {
            "r1": 1,
            "c1": 0,
            "r2": 7,
            "c2": 0
          },
          "GERILYA": {
            "r1": 4,
            "c1": 1,
            "r2": 4,
            "c2": 7
          }
        }
      },
      "blue": {
        "words": [
          "HATTA",
          "GARUDA",
          "SUMPAH",
          "PEMUDA",
          "DAULAT"
        ],
        "grid": [
          [
            "H",
            "A",
            "T",
            "T",
            "A",
            "G",
            "O",
            "P"
          ],
          [
            "A",
            "S",
            "U",
            "M",
            "P",
            "A",
            "H",
            "E"
          ],
          [
            "P",
            "U",
            "A",
            "M",
            "B",
            "R",
            "N",
            "M"
          ],
          [
            "Y",
            "T",
            "W",
            "J",
            "G",
            "U",
            "O",
            "U"
          ],
          [
            "H",
            "A",
            "A",
            "C",
            "M",
            "D",
            "N",
            "D"
          ],
          [
            "E",
            "D",
            "A",
            "U",
            "L",
            "A",
            "T",
            "A"
          ],
          [
            "A",
            "Q",
            "Y",
            "A",
            "S",
            "T",
            "V",
            "E"
          ],
          [
            "E",
            "C",
            "L",
            "N",
            "C",
            "Y",
            "E",
            "G"
          ]
        ],
        "solutions": {
          "HATTA": {
            "r1": 0,
            "c1": 0,
            "r2": 0,
            "c2": 4
          },
          "GARUDA": {
            "r1": 0,
            "c1": 5,
            "r2": 5,
            "c2": 5
          },
          "SUMPAH": {
            "r1": 1,
            "c1": 1,
            "r2": 1,
            "c2": 6
          },
          "PEMUDA": {
            "r1": 0,
            "c1": 7,
            "r2": 5,
            "c2": 7
          },
          "DAULAT": {
            "r1": 5,
            "c1": 1,
            "r2": 5,
            "c2": 6
          }
        }
      },
      "words": [
        "MERDEKA",
        "SOEKARNO",
        "BANGSA",
        "BENTENG",
        "GERILYA"
      ],
      "grid": [
        [
          "M",
          "E",
          "R",
          "D",
          "E",
          "K",
          "A",
          "S"
        ],
        [
          "B",
          "A",
          "N",
          "G",
          "S",
          "A",
          "U",
          "O"
        ],
        [
          "E",
          "B",
          "N",
          "S",
          "A",
          "G",
          "A",
          "E"
        ],
        [
          "N",
          "C",
          "R",
          "C",
          "T",
          "C",
          "I",
          "K"
        ],
        [
          "T",
          "G",
          "E",
          "R",
          "I",
          "L",
          "Y",
          "A"
        ],
        [
          "E",
          "N",
          "A",
          "F",
          "O",
          "U",
          "D",
          "R"
        ],
        [
          "N",
          "N",
          "Z",
          "N",
          "R",
          "T",
          "R",
          "N"
        ],
        [
          "G",
          "N",
          "S",
          "E",
          "K",
          "G",
          "H",
          "O"
        ]
      ],
      "solutions": {
        "MERDEKA": {
          "r1": 0,
          "c1": 0,
          "r2": 0,
          "c2": 6
        },
        "SOEKARNO": {
          "r1": 0,
          "c1": 7,
          "r2": 7,
          "c2": 7
        },
        "BANGSA": {
          "r1": 1,
          "c1": 0,
          "r2": 1,
          "c2": 5
        },
        "BENTENG": {
          "r1": 1,
          "c1": 0,
          "r2": 7,
          "c2": 0
        },
        "GERILYA": {
          "r1": 4,
          "c1": 1,
          "r2": 4,
          "c2": 7
        }
      }
    }
  ]
};
