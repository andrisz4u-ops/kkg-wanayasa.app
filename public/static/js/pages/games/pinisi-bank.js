/**
 * pinisi-bank.js — Bank Soal Literasi Kalimat Rumpang (Cloze Test)
 * Dirancang khusus untuk "Duel Pinisi Kata" Layar Sentuh IFP.
 * 
 * Struktur Berjenjang Kurikulum Merdeka:
 * - 3 Fase: Fase A (Kelas 1–2), Fase B (Kelas 3–4), Fase C (Kelas 5–6)
 * - 3 Tingkat Kesulitan: Mudah, Sedang, Hebat
 * - 5 Paket Soal Mandiri per Tingkat (Total 45 Paket, 270 Kalimat Rumpang)
 */

export const PINISI_QUESTION_BANK = {
  // ══════════════════════════════════════════════════════════════════════════
  // FASE A: KELAS 1–2 SD (Rimba Kata Pemula — Kosakata Dasar, Benda & Adab)
  // ══════════════════════════════════════════════════════════════════════════
  'fase-a': {
    'mudah': [
      // Paket 1: Benda & Tempat di Sekitar
      [
        { q: "Kapal Pinisi berlayar di _____ yang tenang.", a: "laut", opts: ["laut", "darat", "udara", "gunung"], exp: "Kapal Pinisi adalah perahu layar tradisional Nusantara yang berlayar mengarungi lautan." },
        { q: "Anak-anak bermain ceria di _____ sekolah.", a: "halaman", opts: ["halaman", "atap", "langit", "sungai"], exp: "Halaman sekolah adalah area terbuka yang aman untuk bermain bersama teman." },
        { q: "Ibu menanak nasi di _____ rumah.", a: "dapur", opts: ["dapur", "kamar", "garasi", "taman"], exp: "Dapur adalah ruangan khusus untuk memasak makanan dan minuman." },
        { q: "Burung terbang tinggi di _____ yang biru.", a: "langit", opts: ["langit", "tanah", "dalam air", "dalam gua"], exp: "Burung memiliki sayap untuk terbang di udara atau langit luas." },
        { q: "Ayah membaca _____ sambil minum teh hangat.", a: "koran", opts: ["koran", "sepatu", "piring", "bantal"], exp: "Koran memuat berita dan informasi harian yang dibaca di pagi hari." },
        { q: "Petani menanam bibit padi di _____ yang subur.", a: "sawah", opts: ["sawah", "mall", "kantor", "hotel"], exp: "Sawah adalah lahan basah tempat petani membudidayakan tanaman padi." }
      ],
      // Paket 2: Anggota Tubuh & Makanan Sehat
      [
        { q: "Adik minum segelas _____ hangat setiap pagi.", a: "susu", opts: ["susu", "pasir", "batu", "minyak"], exp: "Susu kaya kalsium yang menyehatkan tulang dan tubuh anak-anak." },
        { q: "Kita mengunyah makanan menggunakan _____ di mulut.", a: "gigi", opts: ["gigi", "mata", "telinga", "hidung"], exp: "Gigi berfungsi mengunyah dan menghaluskan makanan sebelum ditelan." },
        { q: "Kucing tidur pulas di atas _____ yang empuk.", a: "kasur", opts: ["kasur", "pagar", "jalan", "atap"], exp: "Kasur empuk memberikan kenyamanan tempat istirahat dan tidur." },
        { q: "Kita melihat indahnya pelangi menggunakan kedua _____.", a: "mata", opts: ["mata", "telinga", "lidah", "kaki"], exp: "Mata adalah indra penglihatan untuk mengamati benda dan warna." },
        { q: "Kelinci sangat suka makan sayur _____ yang renyah.", a: "wortel", opts: ["wortel", "daging", "batu", "garam"], exp: "Wortel berwarna oranye dan kaya vitamin A yang baik untuk mata." },
        { q: "Sebelum makan kita harus mencuci _____ dengan sabun.", a: "tangan", opts: ["tangan", "sepatu", "buku", "tas"], exp: "Mencuci tangan membunuh kuman penyebab sakit perut." }
      ],
      // Paket 3: Hewan Peliharaan & Alam Sekitar
      [
        { q: "Ikan berenang lincah di dalam _____ yang jernih.", a: "air", opts: ["air", "tanah", "asap", "api"], exp: "Ikan bernapas menggunakan insang dan hidup di habitat air." },
        { q: "Ayam jantan berkokok nyaring di _____ hari.", a: "pagi", opts: ["pagi", "tengah malam", "senja", "gelap"], exp: "Kokok ayam jantan menjadi penanda tibanya waktu fajar atau pagi." },
        { q: "Gajah memiliki hidung yang panjang disebut _____.", a: "belalai", opts: ["belalai", "tanduk", "sayap", "sirip"], exp: "Belalai gajah digunakan untuk mengambil makanan dan menyemprotkan air." },
        { q: "Bunga mawar tumbuh bermekaran di _____ rumah.", a: "taman", opts: ["taman", "lemari", "kamar mandi", "garasi"], exp: "Taman adalah tempat tanaman hias dan bunga tumbuh dengan indah." },
        { q: "Matahari bersinar terang memberikan rasa _____.", a: "hangat", opts: ["hangat", "beku", "dingin", "gelap"], exp: "Sinar matahari memancarkan energi panas dan cahaya alami." },
        { q: "Kakek duduk santai membaca di atas _____ goyang.", a: "kursi", opts: ["kursi", "pohon", "atap", "sepeda"], exp: "Kursi adalah tempat duduk berkaki untuk bersantai dan beristirahat." }
      ],
      // Paket 4: Perlengkapan Sekolah & Belajar
      [
        { q: "Siswa menulis catatan pelajaran menggunakan _____.", a: "pensil", opts: ["pensil", "sendok", "sisir", "garpu"], exp: "Pensil digunakan untuk menulis dan menggambar di atas kertas." },
        { q: "Murid-murid belajar dengan tertib di dalam ruang _____.", a: "kelas", opts: ["kelas", "pasar", "stasiun", "dapur"], exp: "Ruang kelas adalah tempat kegiatan belajar mengajar berlangsung." },
        { q: "Tulisan yang salah di buku dihapus menggunakan _____.", a: "penghapus", opts: ["penghapus", "penggaris", "gunting", "lem"], exp: "Penghapus karet menghilangkan bekas coretan pensil secara rapi." },
        { q: "Buku dan kotak pensil dimasukkan ke dalam _____ sekolah.", a: "tas", opts: ["tas", "sepatu", "piring", "topi"], exp: "Tas ransel memudahkan siswa membawa perlengkapan belajar." },
        { q: "Sebelum memulai pelajaran, ketua kelas memimpin doa bersama _____.", a: "guru", opts: ["guru", "pedagang", "sopir", "satpam"], exp: "Guru membimbing dan mendampingi siswa dalam proses belajar di kelas." },
        { q: "Kita mengukur garis lurus menggunakan alat bernama _____.", a: "penggaris", opts: ["penggaris", "batu", "sapu", "sisir"], exp: "Penggaris memiliki satuan centimeter untuk membuat garis lurus." }
      ],
      // Paket 5: Adab & Kegiatan Sehari-hari
      [
        { q: "Saat bertemu bapak atau ibu guru, kita mengucapkan _____.", a: "salam", opts: ["salam", "teriakan", "kemarahan", "keluhan"], exp: "Mengucapkan salam merupakan tanda hormat dan kesopanan siswa." },
        { q: "Sampah daun dan kertas dibuang ke dalam _____.", a: "tong sampah", opts: ["tong sampah", "sungai", "lantai", "kolam"], exp: "Membuang sampah pada tempatnya menjaga lingkungan tetap bersih." },
        { q: "Setiap malam kita beristirahat dengan cara _____ teratur.", a: "tidur", opts: ["tidur", "berlari", "berteriak", "berkelahi"], exp: "Tidur yang cukup memulihkan tenaga dan menjaga daya tahan tubuh." },
        { q: "Sepatu sekolah dipakai dengan rapi di kedua _____.", a: "kaki", opts: ["kaki", "tangan", "kepala", "leher"], exp: "Sepatu melindungi telapak kaki saat berjalan dan beraktivitas." },
        { q: "Kita mendengarkan nasihat orang tua dengan kedua _____.", a: "telinga", opts: ["telinga", "mata", "lutut", "hidung"], exp: "Telinga adalah indra pendengaran untuk menyimak suara dan nasihat." },
        { q: "Piring kotor setelah makan segera dicuci di bak _____.", a: "cucian", opts: ["cucian", "ranjang", "lemari", "jendela"], exp: "Mencuci piring sendiri melatih kemandirian dan kebersihan rumah." }
      ]
    ],
    'sedang': [
      // Paket 1: Lingkungan Sekitar & Profesi
      [
        { q: "Nelayan mendayung perahu mencari ikan di tengah _____.", a: "laut", opts: ["laut", "kolam", "sawah", "sungai kecil"], exp: "Nelayan menangkap ikan laut untuk dijual dan mencukupi gizi masyarakat." },
        { q: "Sopir bus mengemudikan kendaraannya di _____ raya.", a: "jalan", opts: ["jalan", "rel kereta", "awan", "atap rumah"], exp: "Bus melaju di jalan raya mengantarkan penumpang antar tujuan." },
        { q: "Pak Polisi bertugas dengan gagah mengatur arus _____.", a: "lalu lintas", opts: ["lalu lintas", "masak", "kebun", "pasar"], exp: "Polisi lalu lintas menjaga ketertiban dan keselamatan di jalan raya." },
        { q: "Pelajar mengenakan seragam putih merah saat upacara di _____.", a: "sekolah", opts: ["sekolah", "pantai", "bioskop", "pasar"], exp: "Seragam putih merah adalah identitas resmi siswa Sekolah Dasar (SD)." },
        { q: "Pesawat terbang mendarat dengan mulus di landasan _____.", a: "bandara", opts: ["bandara", "pelabuhan", "terminal", "halte"], exp: "Bandar udara (bandara) adalah pangkalan lepas landas dan mendaratnya pesawat." },
        { q: "Kapal layar pinisi bersandar dengan aman di dermaga _____.", a: "pelabuhan", opts: ["pelabuhan", "stasiun", "bandara", "terminal"], exp: "Pelabuhan laut adalah tempat berlabuh kapal feri dan perahu layar." }
      ],
      // Paket 2: Waktu & Cuaca
      [
        { q: "Saat musim hujan tiba, kita memakai _____ agar tidak basah.", a: "payung", opts: ["payung", "selimut", "kacamata", "kipas"], exp: "Payung atau jas hujan melindungi tubuh dari guyuran air hujan." },
        { q: "Bintang-bintang bersinar gemerlap di langit saat malam _____.", a: "hari", opts: ["hari", "siang", "pagi", "panas"], exp: "Bintang tampak jelas terlihat saat langit malam dalam keadaan cerah." },
        { q: "Udara pagi di daerah pegunungan terasa sangat _____ dan sejuk.", a: "segar", opts: ["segar", "panas", "kering", "gersang"], exp: "Pepohonan di pegunungan menghasilkan banyak oksigen segar." },
        { q: "Lampu teplok dinyalakan untuk menerangi ruangan yang _____.", a: "gelap", opts: ["gelap", "terang", "panas", "silau"], exp: "Cahaya lampu menghalau kegelapan di malam hari." },
        { q: "Bel tanda istirahat berbunyi pada pukul sepuluh _____.", a: "pagi", opts: ["pagi", "malam", "fajar", "subuh"], exp: "Pukul 10 pagi adalah waktu istirahat pertama siswa di sekolah." },
        { q: "Matahari terbenam perlahan di ufuk barat saat petang _____.", a: "tiba", opts: ["tiba", "hilang", "subuh", "siang"], exp: "Matahari terbenam menandakan pergantian waktu siang menjadi malam." }
      ],
      // Paket 3: Tumbuhan & Kebun Sekolah
      [
        { q: "Pohon kelapa yang tinggi tumbuh subur di tepi _____.", a: "pantai", opts: ["pantai", "kutub", "puncak gunung", "gua"], exp: "Pohon kelapa menyukai tanah berpasir dan iklim hangat daerah pantai." },
        { q: "Tanaman cabai di kebun disiram setiap hari agar tidak _____.", a: "layu", opts: ["layu", "tumbuh", "berbunga", "segar"], exp: "Kekurangan air menyebabkan daun tanaman layu dan akhirnya mati." },
        { q: "Akar pohon berguna untuk menyerap sari makanan dari dalam _____.", a: "tanah", opts: ["tanah", "awan", "batu", "udara"], exp: "Akar mencengkeram tanah serta menyerap air dan zat hara untuk tanaman." },
        { q: "Kupu-kupu hinggap di kelopak bunga untuk menghisap _____.", a: "madu", opts: ["madu", "tanah", "batu", "pasir"], exp: "Nektar atau madu bunga menjadi makanan manis bagi kupu-kupu dan lebah." },
        { q: "Rumput liar di halaman sekolah dicabut agar tampak _____.", a: "rapi", opts: ["rapi", "kotor", "rusak", "rusuh"], exp: "Halaman yang terawat bebas dari gulma terlihat asri dan sedap dipandang." },
        { q: "Pohon mangga berbuah lebat dengan rasa yang sangat _____.", a: "manis", opts: ["manis", "pahit", "asin", "pedas"], exp: "Buah mangga yang matang pohon rasanya manis dan kaya serat." }
      ],
      // Paket 4: Sikap Gotong Royong
      [
        { q: "Warga bekerja sama membersihkan selokan dengan cara gotong _____.", a: "royong", opts: ["royong", "sendiri", "ribut", "diam"], exp: "Gotong royong adalah ciri khas bangsa Indonesia dalam bekerja bersama." },
        { q: "Pekerjaan yang berat akan terasa lebih _____ jika dikerjakan bersama.", a: "ringan", opts: ["ringan", "sukar", "lama", "sulit"], exp: "Kebersamaan meringankan beban dan mempercepat selesainya tugas." },
        { q: "Murid yang piket bertugas menyapu lantai ruang _____.", a: "kelas", opts: ["kelas", "kepala desa", "kantor polisi", "pasar"], exp: "Regu piket menjaga kebersihan kelas agar belajar terasa nyaman." },
        { q: "Jika teman terjatuh saat bermain bola, kita harus segera _____.", a: "menolong", opts: ["menolong", "menertawakan", "meninggalkan", "mengejek"], exp: "Menolong teman yang kesusahan merupakan pengamalan sila kedua Pancasila." },
        { q: "Meminjamkan pensil kepada teman yang lupa membawa adalah perbuatan _____.", a: "terpuji", opts: ["terpuji", "buruk", "tercela", "curang"], exp: "Berbagi dan peduli kepada sesama teman merupakan akhlak mulia." },
        { q: "Dalam musyawarah pemilihan ketua kelas, kita menghargai _____ teman.", a: "pendapat", opts: ["pendapat", "kemarahan", "ejekan", "keributan"], exp: "Menghargai pendapat orang lain mencerminkan sikap demokratis." }
      ],
      // Paket 5: Cinta Tanah Air Sederhana
      [
        { q: "Lagu kebangsaan negara kita adalah Indonesia _____.", a: "Raya", opts: ["Raya", "Merdeka", "Jaya", "Pusaka"], exp: "Lagu Indonesia Raya diciptakan oleh Wage Rudolf Supratman." },
        { q: "Lambang negara Republik Indonesia adalah Burung _____.", a: "Garuda", opts: ["Garuda", "Rajawali", "Merpati", "Cendrawasih"], exp: "Burung Garuda melambangkan kebesaran dan kekuatan bangsa Indonesia." },
        { q: "Warna merah pada bendera sang saka merah putih melambangkan rasa _____.", a: "berani", opts: ["berani", "takut", "suci", "lemah"], exp: "Merah berarti berani membela kebenaran, putih melambangkan kesucian." },
        { q: "Sila pertama Pancasila dilambangkan dengan gambar _____ emas.", a: "bintang", opts: ["bintang", "rantai", "beringin", "padi"], exp: "Bintang emas bersudut lima melambangkan Ketuhanan Yang Maha Esa." },
        { q: "Meskipun berbeda suku dan agama, kita tetap hidup rukun dalam satu _____.", a: "bangsa", opts: ["bangsa", "musuh", "jarak", "perdebatan"], exp: "Bhinneka Tunggal Ika mengajarkan persatuan di tengah keberagaman." },
        { q: "Hari Kemerdekaan Indonesia diperingati setiap tanggal tujuh belas _____.", a: "Agustus", opts: ["Agustus", "Januari", "Desember", "Mei"], exp: "17 Agustus 1945 adalah hari proklamasi kemerdekaan bangsa Indonesia." }
      ]
    ],
    'hebat': [
      // Paket 1: Pemahaman Konsep Benda & Sifat
      [
        { q: "Air sirup yang dituangkan ke dalam mangkuk akan berubah bentuk menyerupai _____.", a: "mangkuk", opts: ["mangkuk", "gelas", "botol", "piring"], exp: "Benda cair memiliki sifat bentuk yang mengikuti wadah yang ditempatinya." },
        { q: "Balon karet ditiup membesar karena di dalamnya terisi oleh gas _____.", a: "udara", opts: ["udara", "air", "pasir", "batu"], exp: "Benda gas mengisi seluruh ruang dalam wadah tertutup seperti balon." },
        { q: "Minyak goreng dan bensin termasuk kelompok benda berwujud _____.", a: "cair", opts: ["cair", "padat", "gas", "keras"], exp: "Minyak dan bensin mengalir dari tempat tinggi ke tempat rendah." },
        { q: "Batu kali dan balok kayu termasuk kelompok benda berwujud _____.", a: "padat", opts: ["padat", "cair", "uap", "gas"], exp: "Benda padat memiliki bentuk dan volume yang tetap tidak berubah wadah." },
        { q: "Es batu yang diletakkan di tempat terbuka lama-kelamaan akan mencair menjadi _____.", a: "air", opts: ["air", "uap", "batu", "kayu"], exp: "Mencair adalah peristiwa perubahan wujud dari padat menjadi cair karena panas." },
        { q: "Uap panas yang keluar dari ceret air mendidih berwujud benda _____.", a: "gas", opts: ["gas", "padat", "cair", "beku"], exp: "Air yang dipanaskan hingga mendidih menguap menjadi wujud gas." }
      ],
      // Paket 2: Kosakata Bertingkat & Antonim/Sinonim
      [
        { q: "Lawan kata atau antonim dari kata 'rajin' adalah anak yang _____.", a: "malas", opts: ["malas", "pandai", "cepat", "giat"], exp: "Malas adalah kebalikan dari rajin yang tidak mau berusaha dengan tekun." },
        { q: "Gajah adalah hewan bertubuh besar, sedangkan semut bertubuh sangat _____.", a: "kecil", opts: ["kecil", "panjang", "lebar", "tinggi"], exp: "Besar dan kecil merupakan pasangan antonim ukuran tubuh hewan." },
        { q: "Air di kutub terasa sangat dingin, sedangkan air mendidih terasa sangat _____.", a: "panas", opts: ["panas", "sejuk", "hangat", "beku"], exp: "Dingin dan panas adalah lawan kata yang menggambarkan derajat suhu benda." },
        { q: "Persamaan kata atau sinonim dari kata 'gembira' adalah merasa senang dan _____.", a: "bahagia", opts: ["bahagia", "sedih", "marah", "takut"], exp: "Gembira, senang, dan bahagia memiliki makna emosi positif yang serupa." },
        { q: "Jalan berbatu terasa kasar, sedangkan kain sutra terasa sangat _____ saat diraba.", a: "halus", opts: ["halus", "tajam", "keras", "licin"], exp: "Halus adalah lawan dari kasar yang nyaman dirasakan oleh indra peraba." },
        { q: "Kura-kura berjalan lambat, sedangkan macan tutul berlari sangat _____.", a: "cepat", opts: ["cepat", "diam", "pelan", "santai"], exp: "Macan tutul dikenal sebagai predator yang memiliki kecepatan lari tinggi." }
      ],
      // Paket 3: Cerita & Logika Sebab Akibat
      [
        { q: "Budi terlambat masuk sekolah karena bangun kesiangan akibat tidur terlalu _____.", a: "larut malam", opts: ["larut malam", "sore", "siang", "pagi"], exp: "Tidur larut malam menyebabkan tubuh kelelahan dan sulit bangun pagi." },
        { q: "Siti rajin membaca buku perpustakaan sehingga ia menjadi murid yang serba _____.", a: "tahu", opts: ["tahu", "lupa", "bingung", "takut"], exp: "Buku adalah jendela ilmu yang menambah wawasan dan pengetahuan murid." },
        { q: "Tanaman bunga di pot mati kekeringan karena lupa disiram dengan air selama berhari-_____.", a: "hari", opts: ["hari", "bulan", "detik", "jam"], exp: "Air adalah kebutuhan vital bagi kelangsungan hidup semua makhluk hijau." },
        { q: "Roni terserang sakit gigi karena malas menggosok gigi setelah makan permen _____.", a: "manis", opts: ["manis", "pahit", "asam", "pedas"], exp: "Sisa gula permen pada gigi memicu berkembangnya kuman penyebab lubang gigi." },
        { q: "Lantai teras rumah menjadi sangat licin setelah disiram air bercampur busa _____.", a: "sabun", opts: ["sabun", "garam", "pasir", "batu"], exp: "Zat pelicin pada sabun mengurangi gaya gesek sehingga lantai licin membahayakan." },
        { q: "Doni gemar menabung sisa uang jajan di celengan untuk membeli perlengkapan _____.", a: "sekolah", opts: ["sekolah", "mercon", "sampah", "permen"], exp: "Hemat dan menabung sejak dini melatih perilaku bijak mengelola rezeki." }
      ],
      // Paket 4: Keselamatan Diri & Aturan
      [
        { q: "Saat menyeberang jalan raya yang ramai, kita sebaiknya melewati jalur zebra _____.", a: "cross", opts: ["cross", "walk", "lane", "road"], exp: "Zebra cross adalah marka jalan penyeberangan khusus pejalan kaki yang aman." },
        { q: "Pengendara sepeda motor wajib memakai helm pelindung di bagian _____.", a: "kepala", opts: ["kepala", "lutut", "siku", "dada"], exp: "Helm berstandar SNI melindungi tempurung kepala dari benturan saat kecelakaan." },
        { q: "Anak-anak dilarang bermain korek api di dekat minyak tanah karena mudah memicu _____.", a: "kebakaran", opts: ["kebakaran", "hujan", "banjir", "gempa"], exp: "Minyak tanah adalah bahan yang sangat mudah menyambar kobaran api." },
        { q: "Sebelum menyeberang jalan, kita harus menengok ke arah kanan dan _____.", a: "kiri", opts: ["kiri", "atas", "bawah", "belakang"], exp: "Memastikan kedua arah jalan aman adalah kewaspadaan dasar pejalan kaki." },
        { q: "Jika ada orang tak dikenal memberi permen dan mengajak pergi, kita harus tegas menolak dan meminta izin orang _____.", a: "tua", opts: ["tua", "jahat", "asing", "lewat"], exp: "Menjaga keselamatan diri dari orang mencurigakan wajib diterapkan setiap anak." },
        { q: "Obat-obatan harus diminum sesuai dengan aturan dan petunjuk dari dokter atau ibu _____.", a: "guru", opts: ["guru", "pedagang", "sopir", "tetangga"], exp: "Minum obat memerlukan pengawasan orang dewasa agar takarannya tepat." }
      ],
      // Paket 5: Simbol Budaya & Kebersamaan
      [
        { q: "Rumah adat khas Minangkabau yang beratap melengkung runcing seperti tanduk kerbau adalah Rumah _____.", a: "Gadang", opts: ["Gadang", "Tongkonan", "Joglo", "Honai"], exp: "Rumah Gadang adalah rumah tradisional suku Minangkabau di Sumatra Barat." },
        { q: "Alat musik petik tradisional yang terbuat dari bambu khas Jawa Barat adalah celempung dan kecapi, sedangkan yang digoyang adalah _____.", a: "angklung", opts: ["angklung", "gamelan", "gendang", "rebana"], exp: "Angklung terbuat dari bambu dan diakui UNESCO sebagai warisan budaya dunia." },
        { q: "Kain tradisional bermotif indah warisan leluhur bangsa Indonesia yang mendunia adalah kain _____.", a: "batik", opts: ["batik", "wol", "jeans", "nilon"], exp: "Batik ditulis atau dicap menggunakan lilin malam dengan pola sarat makna." },
        { q: "Tari Saman yang dilakukan dengan gerakan tangan kompak dan ritmis berasal dari Provinsi Daerah Istimewa _____.", a: "Aceh", opts: ["Aceh", "Bali", "Papua", "Jawa Timur"], exp: "Tari Saman dikenal dengan keharmonisan tepukan dada dan tangan para penarinya." },
        { q: "Makanan olahan kedelai khas Indonesia yang bergizi tinggi dan murah meriah adalah tahu dan _____.", a: "tempe", opts: ["tempe", "sosis", "kornet", "keju"], exp: "Tempe difermentasi dengan jamur Rhizopus dan kaya protein nabati." },
        { q: "Senjata tradisional khas Jawa yang memiliki lekukan bilah bergelombang indah disebut keris pusaka suku _____.", a: "Jawa", opts: ["Jawa", "Dayak", "Asmat", "Bugis"], exp: "Keris merupakan warisan seni tempa logam adiluhung dari Pulau Jawa." }
      ]
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FASE B: KELAS 3–4 SD (Samudera Makna — Kalimat Kontekstual, IPA & Budaya)
  // ══════════════════════════════════════════════════════════════════════════
  'fase-b': {
    'mudah': [
      // Paket 1: Profesi & Tempat Pelayanan
      [
        { q: "Dokter memeriksa dan mengobati pasien di dalam ruangan rumah _____.", a: "sakit", opts: ["sakit", "makan", "panggung", "ibadah"], exp: "Rumah sakit adalah pusat rujukan kesehatan dengan fasilitas medis lengkap." },
        { q: "Guru mengajar dan mendidik siswa dengan penuh kesabaran di ruang perpustakaan dan ruang _____.", a: "kelas", opts: ["kelas", "tunggu", "rapat", "bengkel"], exp: "Guru mendampingi tumbuh kembang dan pencapaian karakter peserta didik." },
        { q: "Koki meracik bumbu dan memasak hidangan lezat di restoran berbintang lima bersama staf _____.", a: "dapur", opts: ["dapur", "resepsionis", "keamanan", "parkir"], exp: "Koki atau chef bertanggung jawab atas kelezatan dan kebersihan sajian menu." },
        { q: "Masinis mengendalikan lokomotif agar melaju dengan aman di atas lintasan rel kereta _____.", a: "api", opts: ["api", "kuda", "gantung", "dorong"], exp: "Masinis bertanggung jawab mengantarkan ribuan penumpang kereta api." },
        { q: "Pilot menerbangkan burung besi berbadan besar menembus awan dengan kecepatan tinggi di jalur lalu lintas _____.", a: "udara", opts: ["udara", "laut", "darat", "sungai"], exp: "Pilot memiliki keahlian terbang dan navigasi pesawat komersial." },
        { q: "Arsitek merancang gambar denah bangunan gedung bertingkat dengan memperhitungkan kekuatan dan unsur keindahan atau _____.", a: "estetika", opts: ["estetika", "kecepatan", "keburukan", "kelemahan"], exp: "Estetika berarti keindahan bentuk dan keselarasan rancangan bangunan." }
      ],
      // Paket 2: Bagian Tumbuhan & Siklus Hidup
      [
        { q: "Tumbuhan hijau memasak makanannya sendiri melalui proses alami bernama _____.", a: "fotosintesis", opts: ["fotosintesis", "metamorfosis", "reboisasi", "adaptasi"], exp: "Fotosintesis menyerap karbon dioksida dan air dengan bantuan sinar matahari." },
        { q: "Zat hijau daun yang berfungsi menyerap cahaya matahari pada tumbuhan disebut klorofil atau zat _____.", a: "hijau daun", opts: ["hijau daun", "akar tunggang", "serat kayu", "getah pohon"], exp: "Klorofil terdapat pada kloroplas di daun untuk menangkap energi matahari." },
        { q: "Gas oksigen yang kita hirup untuk bernapas dihasilkan oleh tumbuhan dari proses pengolahan zat hijau daun di waktu _____.", a: "siang", opts: ["siang", "tengah malam", "gelap gulita", "hujan badai"], exp: "Fotosintesis menghasilkan gas oksigen (O2) saat ada paparan cahaya matahari." },
        { q: "Batang pohon jati kokoh berdiri dan mengalirkan air dari bagian akar menuju ke pucuk ranting dan helaian _____.", a: "daun", opts: ["daun", "tanah", "batu", "biji"], exp: "Batang memiliki pembuluh xilem dan floem untuk mendistribusikan nutrisi." },
        { q: "Kupu-kupu mengalami perubahan bentuk fisik sempurna yang berawal dari telur, ulat, kepompong, hingga menjadi hewan _____.", a: "dewasa", opts: ["dewasa", "kecil", "mati", "pupa"], exp: "Metamorfosis sempurna pada serangga terdiri dari empat tahap perubahan." },
        { q: "Biji mangga yang ditanam di tanah gembur akan bertunas mengeluarkan calon akar dan sepasang daun muda pertama yang disebut bakal _____.", a: "kecambah", opts: ["kecambah", "buah", "kayu", "ranting"], exp: "Perkecambahan adalah proses awal pertumbuhan biji menjadi bibit tanaman." }
      ],
      // Paket 3: Hewan & Rantai Makanan
      [
        { q: "Hewan pemakan rumput dan daun hijau seperti sapi, kambing, dan kerbau tergolong kelompok hewan _____.", a: "herbivora", opts: ["herbivora", "karnivora", "omnivora", "insektivora"], exp: "Herbivora memiliki susunan gigi geraham lebar untuk menggiling rumput." },
        { q: "Hewan pemakan daging seperti singa, harimau, dan serigala digolongkan ke dalam kelompok hewan buas berjenis _____.", a: "karnivora", opts: ["karnivora", "herbivora", "pemakan biji", "vegetarian"], exp: "Karnivora memiliki gigi taring tajam untuk mencabik mangsa buruannya." },
        { q: "Ayam dan bebek memakan biji jagung sekaligus cacing tanah sehingga tergolong hewan pemakan segala atau hewan _____.", a: "omnivora", opts: ["omnivora", "herbivora", "karnivora", "kanibal"], exp: "Omnivora dapat mencerna makanan dari sumber tumbuhan maupun hewan." },
        { q: "Dalam suatu rantai makanan di sawah, tanaman padi berperan sebagai penghasil makanan pertama yang disebut pihak _____.", a: "produsen", opts: ["produsen", "konsumen", "pengurai", "predator"], exp: "Produsen mampu membuat zat makanan sendiri melalui fotosintesis." },
        { q: "Belalang memakan daun padi, kemudian belalang dimangsa oleh katak. Dalam hal ini katak bertindak sebagai konsumen tingkat ke-_____.", a: "dua", opts: ["dua", "satu", "tiga", "akhir"], exp: "Katak memakan konsumen primer (belalang) sehingga menjadi konsumen sekunder." },
        { q: "Jamur dan bakteri tanah menguraikan bangkai hewan yang mati menjadi zat hara, sehingga mereka berperan sebagai jasad _____.", a: "pengurai", opts: ["pengurai", "pemangsa", "pemburu", "penghasil"], exp: "Pengurai (dekomposer) mengembalikan mineral penting ke dalam tanah." }
      ],
      // Paket 4: Energi & Perubahan Wujud
      [
        { q: "Peristiwa perubahan wujud zat cair menjadi zat gas saat air direbus mendidih disebut proses _____.", a: "penguapan", opts: ["penguapan", "pembekuan", "pencairan", "pengendapan"], exp: "Penguapan terjadi saat molekul air mendapatkan kalor dan lepas ke udara." },
        { q: "Titik-titik air di luar dinding gelas yang berisi es dingin terjadi karena proses perubahan gas menjadi cair atau peristiwa _____.", a: "mengembun", opts: ["mengembun", "membeku", "menyublim", "mengkristal"], exp: "Uap air di udara sekitar gelas melepaskan kalor lalu berubah wujud jadi cair." },
        { q: "Kapur barus di dalam lemari pakaian lama-kelamaan mengecil dan habis karena berubah langsung dari padat menjadi gas yang disebut _____.", a: "menyublim", opts: ["menyublim", "mencair", "menguap", "membeku"], exp: "Menyublim adalah perubahan wujud zat padat langsung menjadi gas." },
        { q: "Sumber energi panas dan cahaya terbesar bagi seluruh kehidupan di planet bumi kita adalah sang surya atau _____.", a: "matahari", opts: ["matahari", "bulan", "bintang kejora", "api unggun"], exp: "Matahari menyediakan energi utama yang menggerakkan siklus air dan cuaca." },
        { q: "Kipas angin mengubah energi listrik dari stopkontak menjadi energi gerak atau energi _____.", a: "kinetik", opts: ["kinetik", "panas", "kimia", "cahaya"], exp: "Energi kinetik adalah energi yang dimiliki benda karena gerakannya." },
        { q: "Setrika pakaian mengubah energi listrik menjadi energi panas untuk merapikan lipatan kain yang kusut secara cepat dan _____.", a: "mudah", opts: ["mudah", "dingin", "basah", "beku"], exp: "Elemen pemanas pada setrika mengonversi arus listrik menjadi kalor." }
      ],
      // Paket 5: Geografi & Peta Nusantara
      [
        { q: "Indonesia merupakan negara kepulauan terbesar di dunia yang terletak di antara dua benua yaitu Asia dan Benua _____.", a: "Australia", opts: ["Australia", "Eropa", "Afrika", "Amerika"], exp: "Letak geografis Indonesia diapit oleh Benua Asia dan Benua Australia." },
        { q: "Dua samudra luas yang mengelilingi kepulauan tanah air Indonesia adalah Samudra Pasifik dan Samudra _____.", a: "Hindia", opts: ["Hindia", "Atlantik", "Arktik", "Antartika"], exp: "Samudra Hindia terletak di sebelah barat dan selatan kepulauan Indonesia." },
        { q: "Garis khayal yang membagi bola bumi menjadi belahan utara dan selatan tepat melintasi Kota Pontianak dinamakan garis khatulistiwa atau garis _____.", a: "ekuator", opts: ["ekuator", "bujur", "meridian", "tengah"], exp: "Garis khatulistiwa menyebabkan Indonesia beriklim tropis sepanjang tahun." },
        { q: "Petunjuk arah mata angin pada gambar peta yang menunjuk ke arah atas selalu menandakan arah mata angin _____.", a: "utara", opts: ["utara", "selatan", "barat", "timur"], exp: "Standar kartografi internasional menetapkan arah atas peta sebagai utara." },
        { q: "Pulau paling padat penduduknya di Indonesia yang menjadi pusat pemerintahan adalah Pulau _____.", a: "Jawa", opts: ["Jawa", "Sumatra", "Kalimantan", "Sulawesi"], exp: "Pulau Jawa dihuni lebih dari setengah total jumlah penduduk Indonesia." },
        { q: "Selat yang memisahkan antara Pulau Jawa dan Pulau Sumatra dinamakan perairan Selat _____.", a: "Sunda", opts: ["Sunda", "Malaka", "Makassar", "Bali"], exp: "Selat Sunda menghubungkan Laut Jawa dengan perairan luas Samudra Hindia." }
      ]
    ],
    'sedang': [
      // Paket 1: Wawasan IPA Menengah
      [
        { q: "Magnet memiliki dua buah kutub medan magnetik, yaitu kutub utara dan kutub bagian _____.", a: "selatan", opts: ["selatan", "barat", "timur", "tengah"], exp: "Setiap batang magnet selalu memiliki sepasang kutub utara dan selatan." },
        { q: "Dua kutub magnet yang senama jika didekatkan akan saling menolak, sedangkan dua kutub berbeda akan saling tarik-_____.", a: "menarik", opts: ["menarik", "menolak", "menjauh", "menghindar"], exp: "Hukum magnet menyatakan kutub tak sejenis menghasilkan gaya tarik menarik." },
        { q: "Benda yang dapat ditarik dengan kuat oleh gaya magnet terbuat dari bahan logam besi atau logam _____.", a: "baja", opts: ["baja", "kayu", "karet", "plastik"], exp: "Benda feromagnetik seperti besi dan baja ditarik sangat kuat oleh magnet." },
        { q: "Buah kelapa jatuh dari tangkai pohon menuju ke tanah karena adanya pengaruh gaya tarik bumi atau gaya gravitasi yang berpusat di _____.", a: "bumi", opts: ["bumi", "awan", "matahari", "langit"], exp: "Gaya gravitasi menarik seluruh benda bermassa ke arah pusat bumi." },
        { q: "Gaya gesek antara tapak sepatu dengan permukaan jalan aspal yang kasar mencegah kita agar tidak tergelincir dan jatuh _____.", a: "terpeleset", opts: ["terpeleset", "melayang", "terbang", "berlari"], exp: "Kekasaran permukaan menimbulkan gaya gesek yang memberi cengkeraman pijakan." },
        { q: "Benda elastis seperti karet gelang dan pegas spiral akan kembali ke bentuk semula setelah ditarik karena memiliki gaya lenting atau gaya _____.", a: "pegas", opts: ["pegas", "gesek", "magnet", "listrik"], exp: "Gaya pegas timbul dari sifat kelenturan bahan yang meregang." }
      ],
      // Paket 2: Kosakata Ilmiah Kontekstual
      [
        { q: "Hewan mamalia menyusui anaknya dan berkembang biak dengan cara melahirkan atau istilah biologinya disebut _____.", a: "vivipar", opts: ["vivipar", "ovipar", "ovovivipar", "spora"], exp: "Vivipar adalah perkembangbiakan hewan dengan cara melahirkan anak." },
        { q: "Hewan unggas seperti burung unta, bebek, dan ayam berkembang biak dengan cara bertelur atau disebut hewan kelompok _____.", a: "ovipar", opts: ["ovipar", "vivipar", "mamalia", "karnivora"], exp: "Ovipar berasal dari kata ovum yang artinya menghasilkan telur." },
        { q: "Bunglon mengubah warna kulit tubuhnya menyerupai lingkungan sekitar untuk mengelabui musuh melalui teknik penyamaran yang dinamakan _____.", a: "mimikri", opts: ["mimikri", "autotomi", "hibernasi", "ekolokasi"], exp: "Mimikri adalah kemampuan adaptasi kamuflase warna kulit pada bunglon." },
        { q: "Cicak memutuskan ekornya secara spontan saat dikejar pemangsa untuk menyelamatkan diri, adaptasi ini dikenal dengan nama _____.", a: "autotomi", opts: ["autotomi", "mimikri", "hibernasi", "ekolasi"], exp: "Autotomi adalah pelepasan anggota tubuh untuk mengelabui perhatian predator." },
        { q: "Kelelawar dapat terbang di kegelapan malam tanpa menabrak dinding gua karena memanfaatkan pantulan gelombang suara atau sistem _____.", a: "ekolokasi", opts: ["ekolokasi", "autotomi", "mimikri", "aerodinamika"], exp: "Ekolokasi membaca pantulan gema suara untuk mendeteksi rintangan dan mangsa." },
        { q: "Hewan gurun pasir yang menyimpan cadangan makanan berupa lemak di bagian punuknya adalah _____.", a: "unta", opts: ["unta", "kuda", "sapi", "keledai"], exp: "Punuk unta berisi tumpukan lemak yang dapat diubah menjadi energi dan cairan." }
      ],
      // Paket 3: Kebudayaan & Adat Istiadat
      [
        { q: "Semboyan persatuan bangsa Indonesia yang bermakna berbeda-beda tetapi tetap satu jua adalah semboyan Bhinneka Tunggal _____.", a: "Ika", opts: ["Ika", "Karsa", "Karya", "Dharma"], exp: "Semboyan ini berasal dari Kitab Sutasoma karya Mpu Tantular era Majapahit." },
        { q: "Upacara pembakaran mayat tradisional umat Hindu di Pulau Dewata Bali dikenal di seluruh pelosok dunia dengan sebutan upacara _____.", a: "Ngaben", opts: ["Ngaben", "Kasada", "Sekaten", "Rambu Solo"], exp: "Ngaben adalah ritual kremasi sakral untuk menyucikan roh leluhur di Bali." },
        { q: "Perayaan Sekaten untuk memperingati hari kelahiran Nabi Muhammad SAW secara turun-temurun digelar oleh masyarakat di Keraton Surakarta dan Kesultanan _____.", a: "Yogyakarta", opts: ["Yogyakarta", "Cirebon", "Banten", "Banjarmasin"], exp: "Tradisi Sekaten dimeriahkan dengan gamelan pusaka Kyai Gunturmadu." },
        { q: "Senjata tradisional suku Dayak di Pulau Kalimantan yang memiliki ukiran khas sarat tuah magis disebut mandau pusaka suku _____.", a: "Dayak", opts: ["Dayak", "Asmat", "Bugis", "Minahasa"], exp: "Mandau adalah pusaka kehormatan yang melambangkan keberanian ksatria Dayak." },
        { q: "Alat musik petik khas suku Rote di Nusa Tenggara Timur yang terbuat dari wadah anyaman daun lontar bernama alat musik tradisional _____.", a: "sasando", opts: ["sasando", "kolintang", "tifa", "talempong"], exp: "Sasando menghasilkan denting dawai melodis yang merdu dan khas." },
        { q: "Tari Piring yang dibawakan penari dengan lincah mengayunkan dua piring porselen di kedua telapak tangannya berasal dari ranah Minangkabau di Provinsi Sumatra _____.", a: "Barat", opts: ["Barat", "Utara", "Selatan", "Tengah"], exp: "Tari Piring melambangkan rasa syukur para petani atas hasil panen melimpah." }
      ],
      // Paket 4: Bahasa Indonesia & Struktur Kalimat
      [
        { q: "Kalimat yang susunannya lengkap dan mudah dipahami sesuai tata kaidah bahasa Indonesia yang baik dinamakan kalimat _____.", a: "efektif", opts: ["efektif", "panjang", "majemuk", "rancu"], exp: "Kalimat efektif memiliki unsur gramatikal yang utuh, hemat, dan tidak ambigu." },
        { q: "Dalam struktur kalimat 'Ibu memasak rendang di dapur', kata 'memasak' menempati fungsi sintaksis sebagai unsur predikat atau kata _____.", a: "kerja", opts: ["kerja", "benda", "sifat", "keterangan"], exp: "Predikat (P) menerangkan tindakan atau perbuatan yang dilakukan oleh Subjek (S)." },
        { q: "Kata dasar 'tulis' jika mendapat awalan 'me-' dan akhiran '-kan' akan membentuk kata berimbuhan baru menjadi kata kerja _____.", a: "menuliskan", opts: ["menuliskan", "menulisi", "tertuliskan", "penulisan"], exp: "Imbuhan me-kan pada kata dasar konsonan 't' mengalami peluluhan bunyi." },
        { q: "Tanda baca yang digunakan pada akhir kalimat untuk menanyakan suatu hal adalah tanda _____.", a: "tanya (?)", opts: ["tanya (?)", "titik (.)", "seru (!)", "koma (,)"], exp: "Tanda tanya (?) menutup kalimat interogatif yang memerlukan tanggapan jawaban." },
        { q: "Kumpulan dari beberapa baris larik yang memiliki keterpaduan tema serta rima bunyi dinamakan bait _____.", a: "puisi", opts: ["puisi", "prosa", "naskah drama", "kamus"], exp: "Bait merupakan kesatuan larik berirama yang membangun pesan sebuah puisi." },
        { q: "Tokoh utama yang memiliki sifat baik hati, suka menolong, dan bijaksana dalam alur cerita fiksi dinamakan tokoh berkarakter _____.", a: "protagonis", opts: ["protagonis", "antagonis", "tritagonis", "figuran"], exp: "Protagonis adalah tokoh sentral yang memegang nilai-nilai kebaikan cerita." }
      ],
      // Paket 5: Kebugaran & Olahraga
      [
        { q: "Olahraga lari pagi secara teratur dapat menguatkan daya tahan jantung dan paru-paru tubuh _____.", a: "manusia", opts: ["manusia", "mesin", "robot", "tanah"], exp: "Latihan kardiovaskular memperlancar aliran darah dan pasokan oksigen tubuh." },
        { q: "Sebelum melakukan latihan olahraga berat, kita wajib melakukan gerakan peregangan dan pemanasan agar otot terhindar dari bahaya rasa _____.", a: "kram", opts: ["kram", "segar", "bugar", "nyenyak"], exp: "Pemanasan menaikkan suhu otot dan kelenturan sendi sebelum beraktivitas fisik." },
        { q: "Dalam permainan sepak bola, pemain yang bertugas khusus menjaga gawang agar tidak kemasukan bola oleh tendangan lawan adalah posisi penjaga gawang atau _____.", a: "kiper", opts: ["kiper", "penyerang", "gelandang", "wasit"], exp: "Kiper memiliki keistimewaan memegang bola menggunakan tangan di kotak penalti." },
        { q: "Perlengkapan wajib dalam olahraga bulu tangkis yang dipukul melintasi jaring net menggunakan raket senar disebut bola bulu angsa atau bola _____.", a: "kok", opts: ["kok", "kasti", "tenis", "voli"], exp: "Shuttlecock atau kok bulu tangkis didesain ringan agar melayang stabil di udara." },
        { q: "Sikap saling menghormati dan bermain jujur dalam setiap pertandingan olahraga dinamakan sikap sportivitas sesama _____.", a: "atlet", opts: ["atlet", "wasit", "penonton", "pelatih"], exp: "Sportivitas mengajarkan kebesaran jiwa untuk menerima hasil pertandingan secara ksatria." },
        { q: "Minum air putih yang cukup saat berolahraga mencegah tubuh kita kehilangan cairan penting atau mengalami kondisi kekurangan cairan tubuh yakni _____.", a: "dehidrasi", opts: ["dehidrasi", "obesitas", "anemia", "diabetes"], exp: "Dehidrasi menurunkan konsentrasi dan stamina fisik atlet saat bertanding." }
      ]
    ],
    'hebat': [
      // Paket 1: Penalaran Ilmiah & Fenomena Alam
      [
        { q: "Gerakan bumi berputar pada porosnya sendiri yang mengakibatkan pergantian siang dan malam di bumi dinamakan rotasi _____.", a: "planet", opts: ["planet", "satelit", "asteroid", "komet"], exp: "Rotasi bumi berlangsung selama kurang lebih 24 jam dalam satu putaran penuh." },
        { q: "Revolusi bumi mengelilingi matahari menyebabkan perbedaan musim di belahan bumi utara dan bumi belahan _____.", a: "selatan", opts: ["selatan", "tengah", "dalam", "atas"], exp: "Revolusi bumi memerlukan waktu 365 seperempat hari atau satu tahun masehi." },
        { q: "Bulan tidak memancarkan cahaya sendiri melainkan memantulkan sinar yang berasal dari _____.", a: "matahari", opts: ["matahari", "bumi", "bintang kejora", "kutub"], exp: "Bulan adalah satelit alami bumi yang menerima pantulan sinar matahari." },
        { q: "Cahaya matahari yang terhalang oleh posisi bulan di antara bumi dan matahari dinamakan gerhana sang _____.", a: "surya", opts: ["surya", "bulan", "bumi", "mars"], exp: "Gerhana matahari terjadi saat bayang-bayang umbra bulan jatuh ke bumi." },
        { q: "Gelombang laut raksasa yang menerjang pesisir pantai akibat gempa tektonik di dasar laut dinamakan _____.", a: "tsunami", opts: ["tsunami", "tornado", "topan", "lahar"], exp: "Pergeseran lempeng bawah laut secara vertikal memicu gelombang tsunami dahsyat." },
        { q: "Cairan batuan pijar sangat panas yang keluar mengalir dari kawah gunung berapi saat meletus dinamakan lelehan _____.", a: "lava", opts: ["lava", "es", "belerang dingin", "lumpur salju"], exp: "Magma yang telah mengalir keluar mencapai permukaan bumi disebut lava." }
      ],
      // Paket 2: Kosakata Tingkat Lanjut & Literasi
      [
        { q: "Orang yang bertugas meliput peristiwa, mewawancarai narasumber, dan menulis berita disebut wartawan atau _____.", a: "jurnalis", opts: ["jurnalis", "arsitek", "masinis", "jaksa"], exp: "Jurnalis menjunjung tinggi kode etik jurnalistik dan asas kebenaran berita." },
        { q: "Tindakan pelestarian hutan dan pencegahan kepunahan satwa langka agar keseimbangan alam tetap terjaga untuk generasi masa depan disebut tindakan perlindungan atau upaya _____.", a: "konservasi", opts: ["konservasi", "eksploitasi", "degradasi", "urbanisasi"], exp: "Konservasi bertujuan menjaga habitat alam dan keanekaragaman hayati." },
        { q: "Proses penanaman kembali lahan hutan yang gundul akibat penebangan liar agar tanah tidak longsor dan dapat menyimpan cadangan air hujan dinamakan program penghijauan atau gerakan _____.", a: "reboisasi", opts: ["reboisasi", "reklamasi", "erosi", "irigasi"], exp: "Reboisasi memulihkan fungsi ekologis hutan sebagai paru-paru dunia." },
        { q: "Peristiwa terkikisnya lapisan tanah subur oleh aliran air atau terpaan angin kencang di permukaan _____ disebut erosi.", a: "bumi", opts: ["bumi", "batu", "pohon", "udara"], exp: "Akar pepohonan berfungsi menahan tanah agar terhindar dari bahaya erosi." },
        { q: "Penanaman hutan bakau bertujuan untuk mencegah pengikisan daratan oleh hantaman ombak laut di kawasan garis _____.", a: "pantai", opts: ["pantai", "sungai", "danau", "rawa"], exp: "Hutan bakau menjadi benteng alami peredam energi gelombang pasang surut." },
        { q: "Perpindahan penduduk dari kawasan pedesaan menuju ke kota-kota besar untuk mencari pekerjaan dinamakan arus _____.", a: "urbanisasi", opts: ["urbanisasi", "transmigrasi", "imigrasi", "emigrasi"], exp: "Urbanisasi dipicu oleh daya tarik fasilitas dan lapangan kerja di perkotaan." }
      ],
      // Paket 3: Sejarah & Wawasan Kebangsaan
      [
        { q: "Teks naskah Proklamasi Kemerdekaan Indonesia diketik dengan rapi menggunakan mesin tik oleh seorang pemuda pejuang bernama Sayuti _____.", a: "Melik", opts: ["Melik", "Malik", "Soekarni", "Hatta"], exp: "Sayuti Melik menyempurnakan beberapa ejaan pada naskah proklamasi." },
        { q: "Bendera Pusaka Sang Saka Merah Putih yang dikibarkan saat proklamasi 17 Agustus 1945 dijahit dengan penuh kasih sayang oleh Ibu Negara Ibu _____.", a: "Fatmawati", opts: ["Fatmawati", "Kartini", "Dewi Sartika", "Cut Nyak Dien"], exp: "Ibu Fatmawati menjahit bendera pusaka dari bahan katun berkualitas." },
        { q: "Dua tokoh proklamator kemerdekaan Indonesia yang menandatangani naskah proklamasi atas nama bangsa Indonesia adalah Ir. Soekarno dan Drs. Mohammad _____.", a: "Hatta", opts: ["Hatta", "Yamin", "Soepomo", "Syahrir"], exp: "Bung Karno dan Bung Hatta dikenal sebagai Dwi Tunggal Proklamator kemerdekaan." },
        { q: "Ikrar persatuan bersejarah yang menyatakan satu nusa, satu bangsa, dan satu bahasa Indonesia dinamakan ikrar Sumpah _____.", a: "Pemuda", opts: ["Pemuda", "Palapa", "Rakyat", "Ksatria"], exp: "Sumpah Pemuda dicetuskan pada tanggal 28 Oktober 1928 di Jakarta." },
        { q: "Pahlawan wanita tangguh asal Jepara yang gigih memperjuangkan hak pendidikan dan kesetaraan bagi kaum perempuan Indonesia adalah Raden Ajeng _____.", a: "Kartini", opts: ["Kartini", "Dewi Sartika", "Christina Tiahahu", "Rasuna Said"], exp: "Kumpulan surat-surat R.A. Kartini dibukukan dengan judul Habis Gelap Terbitlah Terang." },
        { q: "Candi bercorak Buddha terbesar di dunia yang terletak di Magelang, Jawa Tengah adalah Candi _____.", a: "Borobudur", opts: ["Borobudur", "Prambanan", "Mendut", "Kalasan"], exp: "Candi Borobudur tersusun dari ribuan balok batu andesit dengan stupa agung." }
      ],
      // Paket 4: Ekosistem & Kelestarian Alam
      [
        { q: "Hubungan timbal balik yang saling menguntungkan antara dua makhluk hidup berbeda jenis seperti lebah dengan bunga tanaman dinamakan simbiosis mutualisme atau kerja sama yang saling memberi _____.", a: "manfaat", opts: ["manfaat", "kerugian", "racun", "penyakit"], exp: "Lebah mendapat nektar manis, sedangkan bunga terbantu dalam proses penyerbukan." },
        { q: "Hubungan antara benalu yang menempel pada pohon inang dan menyerap zat makanan hingga merugikan inang dinamakan contoh nyata dari hubungan simbiosis jenis _____.", a: "parasitisme", opts: ["parasitisme", "komensalisme", "mutualisme", "netralisme"], exp: "Parasit mengambil keuntungan sepihak dengan merugikan inang yang ditumpanginya." },
        { q: "Ikan remora yang berenang di dekat ikan hiu untuk mencari perlindungan tanpa merugikan maupun menguntungkan sang hiu adalah contoh bentuk hubungan simbiosis jenis _____.", a: "komensalisme", opts: ["komensalisme", "parasitisme", "mutualisme", "kanibalisme"], exp: "Komensalisme menguntungkan satu pihak tanpa memberi dampak rugi bagi pihak lain." },
        { q: "Hewan mamalia langka bercula satu yang dilindungi keberadaannya di kawasan Taman Nasional Ujung Kulon Banten adalah satwa langka badak cula _____.", a: "satu", opts: ["satu", "dua", "tiga", "banyak"], exp: "Badak Jawa bercula satu terancam punah dan dilindungi ketat oleh undang-undang." },
        { q: "Kawasan hutan lindung yang dimanfaatkan secara resmi untuk melindungi hewan dan tumbuhan langka beserta habitat aslinya dinamakan kawasan suaka margasatwa atau cagar _____.", a: "alam", opts: ["alam", "wisata", "budaya", "permainan"], exp: "Cagar alam menjaga ekosistem tetap perawan tanpa campur tangan eksploitasi manusia." },
        { q: "Orangutan Sumatra dan Orangutan Kalimantan yang populasinya kian menyusut membutuhkan perlindungan habitat hutan tropis agar terhindar dari ancaman kemusnahan total atau _____.", a: "kepunahan", opts: ["kepunahan", "perkembangbiakan", "kemakmuran", "kejayaan"], exp: "Perburuan dan perusakan hutan menjadi pemicu utama ancaman kepunahan satwa." }
      ],
      // Paket 5: Keterampilan Berbahasa & Sastra
      [
        { q: "Cerita fiksi yang mengisahkan kehidupan hewan-hewan yang dapat berbicara dan bertingkah laku seperti manusia disebut cerita _____.", a: "fabel", opts: ["fabel", "legenda", "mite", "sage"], exp: "Fabel menggunakan tokoh satwa untuk menyampaikan amanat moral bagi pembaca." },
        { q: "Pesan moral atau nasihat bijak yang ingin disampaikan penulis kepada pembaca melalui sebuah cerita disebut pesan _____.", a: "amanat", opts: ["amanat", "latar", "alur", "tokoh"], exp: "Amanat adalah nilai pendidikan budi pekerti yang dapat dipetik dari bacaan." },
        { q: "Bagian pembuka dalam alur cerita yang mengenalkan tokoh, latar waktu, dan suasana kepada pembaca disebut tahap _____.", a: "orientasi", opts: ["orientasi", "komplikasi", "resolusi", "koda"], exp: "Orientasi memberikan gambaran latar belakang sebelum munculnya masalah." },
        { q: "Bentuk puisi lama yang tiap baitnya terdiri atas 4 baris bersajak a-b-a-b dengan sampiran dan isi dinamakan bait _____.", a: "pantun", opts: ["pantun", "gurindam", "syair", "hikayat"], exp: "Pantun terdiri dari dua baris sampiran dan dua baris isi yang sarat makna." },
        { q: "Ungkapan 'rendah hati' mencerminkan sikap terpuji seseorang yang tidak sombong dan memiliki budi pekerti yang _____.", a: "mulia", opts: ["mulia", "buruk", "jahat", "kasar"], exp: "Rendah hati adalah lawan kata dari tinggi hati atau sombong." },
        { q: "Gaya bahasa kiasan yang membandingkan dua hal secara langsung tanpa kata penghubung dinamakan majas _____.", a: "metafora", opts: ["metafora", "hiperbola", "personifikasi", "ironi"], exp: "Majas perbandingan memperindah tulisan dan melatih imajinasi kognitif anak." }
      ]
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FASE C: KELAS 5–6 SD (Puncak Wawasan — Literasi Kritis, Sains & Wawasan)
  // ══════════════════════════════════════════════════════════════════════════
  'fase-c': {
    'mudah': [
      // Paket 1: Sistem Organ Manusia Dasar
      [
        { q: "Organ vital yang bertugas memompa darah beroksigen ke seluruh bagian tubuh manusia tanpa henti adalah _____.", a: "jantung", opts: ["jantung", "lambung", "hati", "ginjal"], exp: "Jantung memiliki empat ruangan (dua serambi dan dua bilik) untuk sirkulasi darah." },
        { q: "Tempat terjadinya pertukaran gas oksigen dan karbon dioksida pada gelembung alveolus terletak di organ sepasang _____.", a: "paru-paru", opts: ["paru-paru", "usus halus", "pankreas", "limpa"], exp: "Alveolus di dalam paru-paru dilapisi kapiler darah tipis penukar gas oksigen." },
        { q: "Organ pencernaan yang memproses makanan dengan bantuan cairan asam klorida (HCl) dan enzim pepsin adalah _____.", a: "lambung", opts: ["lambung", "empedu", "tenggorokan", "kerongkongan"], exp: "Asam lambung berfungsi membunuh kuman penyakit pada makanan yang masuk." },
        { q: "Sepasang organ ekskresi berbentuk seperti kacang merah yang menyaring zat sisa metabolisme menjadi urine adalah _____.", a: "ginjal", opts: ["ginjal", "jantung", "otak", "otot"], exp: "Ginjal menyaring racun urea dan kelebihan cairan untuk dibuang melalui urine." },
        { q: "Pigmen protein dalam sel darah merah yang bertugas mengikat oksigen untuk diedarkan ke seluruh tubuh disebut _____.", a: "hemoglobin", opts: ["hemoglobin", "klorofil", "insulin", "antibodi"], exp: "Hemoglobin mengikat gas oksigen di paru-paru dan melepaskannya ke jaringan tubuh." },
        { q: "Pembuluh darah berotot tebal yang bertugas membawa aliran darah bersih kaya oksigen keluar dari jantung adalah pembuluh _____.", a: "arteri", opts: ["arteri", "vena", "kapiler", "balik"], exp: "Arteri memiliki dinding elastis tebal untuk menahan tekanan tinggi pompa jantung." }
      ],
      // Paket 2: Tata Surya & Astronomi Pengantar
      [
        { q: "Pusat tata surya kita yang dikelilingi oleh delapan planet dan miliaran benda langit lainnya adalah bintang raksasa bernama sang _____.", a: "matahari", opts: ["matahari", "bumi", "jupiter", "saturnus"], exp: "Matahari memiliki gaya gravitasi sangat besar yang mengikat orbit planet-planet." },
        { q: "Planet terdekat dari matahari yang memiliki perbedaan suhu siang dan malam sangat ekstrem tanpa atmosfer adalah planet _____.", a: "merkurius", opts: ["merkurius", "venus", "mars", "bumi"], exp: "Merkurius berjarak paling dekat dengan matahari dan memiliki permukaan berkawah." },
        { q: "Planet kedua dari Matahari yang sering tampak bersinar terang saat fajar dan dijuluki sebagai 'Bintang Kejora' adalah planet _____.", a: "venus", opts: ["venus", "mars", "jupiter", "saturnus"], exp: "Venus dilapisi awan tebal gas karbon dioksida yang menimbulkan efek rumah kaca panas." },
        { q: "Planet keempat dari Matahari yang permukaannya kaya oksida besi berkarat sehingga dijuluki 'Planet Merah' adalah planet _____.", a: "mars", opts: ["mars", "jupiter", "uranus", "neptunus"], exp: "Mars memiliki gunung berapi tertinggi di tata surya bernama Olympus Mons." },
        { q: "Planet gas raksasa terbesar di tata surya yang memiliki ciri khas badai bintik merah besar adalah planet _____.", a: "jupiter", opts: ["jupiter", "saturnus", "bumi", "merkurius"], exp: "Massa Jupiter lebih besar daripada gabungan seluruh planet lainnya di tata surya." },
        { q: "Planet dalam tata surya yang paling terkenal dengan sistem cincin es dan debu batuan yang sangat indah adalah planet _____.", a: "saturnus", opts: ["saturnus", "jupiter", "neptunus", "mars"], exp: "Cincin Saturnus membentang ribuan kilometer namun memiliki ketebalan relatif tipis." }
      ],
      // Paket 3: Listrik & Kemagnetan Dasar
      [
        { q: "Rangkaian listrik yang komponen lampunya disusun secara berurutan tanpa adanya cabang kabel dinamakan rangkaian _____.", a: "seri", opts: ["seri", "paralel", "campuran", "induksi"], exp: "Pada rangkaian seri, jika satu lampu padam maka semua lampu lainnya ikut padam." },
        { q: "Rangkaian listrik di rumah tangga dipasang secara bercabang agar tiap lampu dapat dinyalakan mandiri dinamakan rangkaian _____.", a: "paralel", opts: ["paralel", "seri", "tertutup", "statis"], exp: "Rangkaian paralel membagi arus ke beberapa cabang jalur listrik terpisah." },
        { q: "Benda atau bahan yang dapat menghantarkan arus listrik dan panas dengan baik seperti tembaga dan besi disebut zat _____.", a: "konduktor", opts: ["konduktor", "isolator", "adaptor", "akumulator"], exp: "Konduktor memiliki elektron bebas yang mudah bergerak menghantarkan energi listrik." },
        { q: "Benda yang tidak dapat menghantarkan arus listrik seperti karet dan plastik sehingga aman sebagai pelindung kabel disebut _____.", a: "isolator", opts: ["isolator", "konduktor", "kolektor", "katalisator"], exp: "Isolator melindungi manusia dari bahaya sengatan aliran arus listrik berbahaya." },
        { q: "Komponen listrik yang berfungsi untuk menyambungkan atau memutuskan aliran arus pada rangkaian listrik adalah _____.", a: "sakelar", opts: ["sakelar", "sekring", "trafo", "generator"], exp: "Sakelar (switch) membuka dan menutup kontak rangkaian sirkuit elektronika." },
        { q: "Alat pengaman rangkaian listrik yang memutuskan arus secara otomatis saat terjadi korsleting melalui kawat yang melebur adalah _____.", a: "sekring", opts: ["sekring", "bohlam", "stopkontak", "colokan"], exp: "Sekring memiliki kawat tipis yang sengaja melebur jika dilewati arus berlebih." }
      ],
      // Paket 4: Sejarah & Perjuangan Bangsa
      [
        { q: "Peristiwa diculiknya Bung Karno dan Bung Hatta oleh para pemuda ke luar kota Jakarta untuk mendesak proklamasi dikenal dengan peristiwa _____.", a: "Rengasdengklok", opts: ["Rengasdengklok", "Surabaya", "Ambarawa", "Bandung"], exp: "Pemuda mendesak agar proklamasi kemerdekaan tidak menunggu izin dari pihak Jepang." },
        { q: "Pertempuran dahsyat di Surabaya melawan tentara Sekutu yang dipimpin Bung Tomo berkobar hebat dan diperingati setiap tanggal 10 _____.", a: "November", opts: ["November", "Oktober", "Desember", "Agustus"], exp: "Peristiwa 10 November 1945 di Surabaya kemudian diabadikan sebagai Hari Pahlawan nasional." },
        { q: "Peristiwa pembumihangusan kota oleh pejuang di Jawa Barat agar fasilitas vital tidak dikuasai Sekutu dikenal sebagai Bandung Lautan _____.", a: "Api", opts: ["Api", "Merah", "Bunga", "Juang"], exp: "Bandung Lautan Api melahirkan lagu perjuangan 'Halo-Halo Bandung'." },
        { q: "Perundingan antara Indonesia dan Belanda pada tahun 1948 yang diadakan di atas kapal perang milik Amerika Serikat dinamakan Perjanjian _____.", a: "Renville", opts: ["Renville", "Linggarjati", "Roem-Royen", "Hoge Veluwe"], exp: "Perjanjian Renville ditandatangani pada bulan Januari tahun 1948." },
        { q: "Panglima Besar TNI yang memimpin perang gerilya mempertahankan kemerdekaan sambil ditandu saat sedang sakit adalah Jenderal _____.", a: "Soedirman", opts: ["Soedirman", "Ahmad Yani", "Gatot Soebroto", "Urip Sumoharjo"], exp: "Jenderal Soedirman membuktikan kegigihan ksatria mempertahankan kedaulatan bangsa." },
        { q: "Organisasi pergerakan nasional modern pertama di Indonesia yang didirikan pada tanggal 20 Mei 1908 oleh pemuda STOVIA adalah Boedi _____.", a: "Oetomo", opts: ["Oetomo", "Kusumo", "Waluyo", "Rahardjo"], exp: "Kelahiran Boedi Oetomo tanggal 20 Mei kini diperingati sebagai Hari Kebangkitan Nasional." }
      ],
      // Paket 5: Keterampilan Berbahasa & Ejaan Baku
      [
        { q: "Kata yang penulisan dan pelafalannya telah sesuai dengan pedoman umum ejaan dan kaidah resmi KBBI disebut kata _____.", a: "baku", opts: ["baku", "gaul", "slang", "daerah"], exp: "Kata baku wajib digunakan dalam penulisan karya ilmiah dan pidato kenegaraan resmi." },
        { q: "Bentuk kata baku yang tepat untuk kegiatan mengendarai sepeda kayuh di jalan raya adalah kata kerja _____.", a: "bersepeda", opts: ["bersepeda", "gowean", "sepedaan", "ngonthel"], exp: "Imbuhan ber- melekat pada kata dasar sepeda membentuk kata kerja baku bersepeda." },
        { q: "Bentuk penulisan tidak baku dari kata izin yang sering keliru ditulis dengan huruf j dalam percakapan sehari-hari adalah _____.", a: "ijin", opts: ["ijin", "idzin", "icen", "isin"], exp: "Kata serapan bahasa Arab yang diserap ke bahasa Indonesia menggunakan fonem /z/ (izin)." },
        { q: "Karya tulis prosa yang disusun berdasarkan data, fakta nyata, dan informasi pengetahuan objektif dinamakan teks non-_____.", a: "fiksi", opts: ["fiksi", "faktual", "opini", "sastra"], exp: "Teks nonfiksi disusun berdasarkan riset data akurat, observasi lapangan, atau sejarah nyata." },
        { q: "Gagasan pokok atau intisari pembahasan dalam suatu alur paragraf biasanya tertuang di dalam kalimat _____.", a: "utama", opts: ["utama", "penjelas", "tambahan", "penutup"], exp: "Gagasan utama biasanya terletak di awal (deduktif) atau di akhir (induktif) paragraf." },
        { q: "Daftar rujukan sumber buku atau artikel yang dicantumkan pada bagian akhir sebuah karya ilmiah dinamakan daftar _____.", a: "pustaka", opts: ["pustaka", "isi", "hadir", "harga"], exp: "Daftar pustaka memberikan penghargaan hak cipta atas karya rujukan ilmiah penulis lain." }
      ]
    ],
    'sedang': [
      // Paket 1: Perpindahan Kalor & Termodinamika
      [
        { q: "Perpindahan panas melalui zat perantara tanpa disertai perpindahan partikel zatnya seperti sendok logam yang panas disebut _____.", a: "konduksi", opts: ["konduksi", "konveksi", "radiasi", "kondensasi"], exp: "Konduksi terjadi pada benda padat di mana energi getaran merambat antar partikel." },
        { q: "Perpindahan kalor yang disertai aliran zat perantaranya seperti gerakan air yang mendidih bergolak di dalam panci dinamakan arus _____.", a: "konveksi", opts: ["konveksi", "konduksi", "radiasi", "induksi"], exp: "Konveksi terjadi pada zat cair dan gas akibat adanya perbedaan massa jenis fluida panas." },
        { q: "Perpindahan panas tanpa melalui zat perantara sama sekali seperti pancaran kehangatan api unggun dinamakan pancaran kalor _____.", a: "radiasi", opts: ["radiasi", "konduksi", "konveksi", "evaporasi"], exp: "Radiasi kalor merambat dalam bentuk gelombang elektromagnetik melintasi ruang hampa." },
        { q: "Alat pengukur derajat panas dinginnya suatu benda secara akurat menggunakan zat cair raksa atau alkohol dalam kaca berskala adalah _____.", a: "termometer", opts: ["termometer", "barometer", "higrometer", "anemometer"], exp: "Termometer memanfaatkan sifat pemuaian volume zat cair saat menerima kalor." },
        { q: "Satuan standar pengukuran suhu yang paling banyak digunakan di Indonesia dengan simbol derajat C adalah skala _____.", a: "Celsius", opts: ["Celsius", "Fahrenheit", "Reaumur", "Kelvin"], exp: "Skala Celsius memiliki titik beku air 0 derajat dan titik didih air 100 derajat." },
        { q: "Peristiwa bertambahnya panjang, luas, atau volume suatu benda padat akibat kenaikan suhu saat dipanaskan disebut _____.", a: "pemuaian", opts: ["pemuaian", "penyusutan", "peleburan", "pengkristalan"], exp: "Pemasangan kabel listrik dibuat kendur untuk mengantisipasi penyusutan saat malam dingin." }
      ],
      // Paket 2: Geografi ASEAN & Kerja Sama Regional
      [
        { q: "Organisasi perhimpunan kerja sama antarnegara di kawasan Asia Tenggara yang didirikan pada 8 Agustus 1967 adalah _____.", a: "ASEAN", opts: ["ASEAN", "APEC", "UNESCO", "OPEC"], exp: "ASEAN didirikan melalui Deklarasi Bangkok oleh lima negara pemrakarsa utama." },
        { q: "Menteri Luar Negeri Indonesia yang mewakili Republik Indonesia menandatangani Deklarasi Bangkok 1967 adalah Adam _____.", a: "Malik", opts: ["Malik", "Yamin", "Hatta", "Soebandrio"], exp: "Adam Malik mewakili Indonesia bersama perwakilan Malaysia, Filipina, Singapura, dan Thailand." },
        { q: "Satu-satunya negara di Asia Tenggara yang tidak pernah dijajah oleh bangsa asing atau bangsa Eropa adalah _____.", a: "Thailand", opts: ["Thailand", "Malaysia", "Singapura", "Vietnam"], exp: "Nama Thailand memiliki arti Tanah Kebebasan (Muang Thai)." },
        { q: "Negara kepulauan tetangga di utara Indonesia yang beribu kota di Manila dan bermata uang Peso adalah _____.", a: "Filipina", opts: ["Filipina", "Brunei", "Kamboja", "Laos"], exp: "Filipina merupakan negara kepulauan dengan bahasa nasional Bahasa Tagalog." },
        { q: "Satu-satunya negara anggota ASEAN yang tidak memiliki wilayah laut karena terkurung oleh daratan negara lain adalah _____.", a: "Laos", opts: ["Laos", "Myanmar", "Vietnam", "Kamboja"], exp: "Laos dijuluki 'The Landlocked Country' di kawasan semenanjung Indochina." },
        { q: "Gedung Sekretariat Jenderal ASEAN berkedudukan permanen di kawasan Kebayoran Baru, kota _____.", a: "Jakarta", opts: ["Jakarta", "Bangkok", "Kuala Lumpur", "Manila"], exp: "Sekretariat ASEAN di Jakarta dipimpin oleh seorang Sekretaris Jenderal ASEAN." }
      ],
      // Paket 3: Adaptasi Fisiologi & Anatomi Tubuh
      [
        { q: "Daun kaktus bermodifikasi menjadi duri bertujuan untuk mengurangi laju penguapan air atau proses _____.", a: "transpirasi", opts: ["transpirasi", "respirasi", "absorpsi", "fiksasi"], exp: "Bentuk duri pada kaktus menekan laju kehilangan air di lingkungan tandus panas." },
        { q: "Tumbuhan teratai memiliki daun tipis dan lebar untuk mempercepat penguapan melalui pori-pori stomata di permukaan _____.", a: "daun", opts: ["daun", "bunga", "akar", "batang"], exp: "Daun teratai yang lebar menangkap sinar matahari maksimal dan membuang kelebihan cairan." },
        { q: "Tumbuhan bakau memiliki akar khusus yang menjulang ke atas permukaan lumpur pantai untuk menghirup oksigen langsung yang dinamakan akar napas tanaman _____.", a: "bakau", opts: ["bakau", "beringin", "kelapa", "anggrek"], exp: "Lumpur pantai miskin oksigen sehingga akar bakau menjulur ke udara untuk bernapas." },
        { q: "Enzim ptialin (amilase) yang dihasilkan oleh kelenjar ludah berfungsi memecah karbohidrat zat tepung menjadi maltosa di dalam rongga _____.", a: "mulut", opts: ["mulut", "lambung", "usus besar", "hati"], exp: "Pencernaan kimiawi karbohidrat telah dimulai sejak makanan dikunyah di mulut." },
        { q: "Penyerapan sari-sari makanan hasil pencernaan ke dalam aliran pembuluh darah berlangsung melalui jonjot vili pada dinding usus _____.", a: "halus", opts: ["halus", "besar", "buntu", "dua belas jari"], exp: "Vili usus halus memperluas bidang penyerapan nutrisi makanan ke seluruh tubuh." },
        { q: "Penyerapan kembali air sisa pencernaan dan pembusukan ampas makanan oleh bakteri Escherichia coli berlangsung di dalam usus _____.", a: "besar", opts: ["besar", "halus", "lambung", "kerongkongan"], exp: "Bakteri E. coli di usus besar membantu pembentukan vitamin K dan pembusukan feses." }
      ],
      // Paket 4: Gelombang, Bunyi & Optika
      [
        { q: "Bunyi dapat merambat melalui zat padat, cair, dan gas, namun gelombang bunyi sama sekali tidak dapat merambat di dalam ruang _____.", a: "hampa", opts: ["hampa", "terbuka", "gelap", "dingin"], exp: "Bunyi adalah gelombang mekanik yang mutlak memerlukan partikel medium untuk merambat." },
        { q: "Bunyi pantul yang terdengar jelas sesaat setelah bunyi asli selesai diucapkan saat berteriak di tebing curam dinamakan _____.", a: "gema", opts: ["gema", "gaung", "desah", "nada"], exp: "Gema terjadi karena dinding pemantul berjarak sangat jauh dari sumber bunyi asli." },
        { q: "Benda yang dapat meneruskan hampir seluruh berkas cahaya yang mengenainya seperti kaca jendela dinamakan kelompok benda _____.", a: "bening", opts: ["bening", "gelap", "buram", "hitam"], exp: "Benda bening mentransmisikan berkas cahaya tanpa mengalami hamburan yang berarti." },
        { q: "Pensil yang dimasukkan miring ke dalam gelas berisi air tampak patah karena terjadinya peristiwa pembiasan atau refraksi _____.", a: "cahaya", opts: ["cahaya", "bayangan", "cermin", "panas"], exp: "Pembiasan terjadi karena cahaya merambat melalui dua medium dengan kerapatan optik berbeda." },
        { q: "Cermin yang permukaannya melengkung ke dalam seperti bagian cekung sendok dan bersifat mengumpulkan cahaya adalah cermin _____.", a: "cekung", opts: ["cekung", "cembung", "datar", "ganda"], exp: "Cermin cekung (konkaf) bersifat konvergen dan digunakan pada lampu sorot mobil." },
        { q: "Cermin cembung menghasilkan bayangan tegak, maya, dan diperkecil sehingga sangat cocok dipasang sebagai cermin spion pada _____.", a: "kendaraan", opts: ["kendaraan", "pesawat", "kapal", "rumah"], exp: "Cermin cembung memberikan jangkauan sudut pandang lebih luas bagi pengemudi." }
      ],
      // Paket 5: Keterampilan Menulis & Berpikir Kritis
      [
        { q: "Paragraf yang gagasan utamanya terletak di awal paragraf lalu diikuti oleh kalimat-kalimat penjelas dinamakan paragraf _____.", a: "deduktif", opts: ["deduktif", "induktif", "campuran", "naratif"], exp: "Paragraf deduktif menyajikan gagasan umum di awal lalu diuraikan dengan rincian khusus." },
        { q: "Paragraf yang kalimat utamanya terletak di bagian akhir sebagai kesimpulan dari rincian-rincian penjelas dinamakan paragraf _____.", a: "induktif", opts: ["induktif", "deduktif", "deskriptif", "persuasif"], exp: "Paragraf induktif menyajikan uraian fakta khusus terlebih dahulu baru ditutup simpulan umum." },
        { q: "Teks yang bertujuan mengajak, membujuk, atau memengaruhi pembaca agar mengikuti imbauan yang disampaikan dinamakan teks _____.", a: "persuasi", opts: ["persuasi", "narasi", "eksposisi", "argumentasi"], exp: "Teks persuasi menggunakan kalimat ajakan, imbauan, dan bujukan logis yang menarik." },
        { q: "Teks yang menggambarkan objek atau suasana secara terperinci sehingga pembaca seolah-olah melihat dan merasakannya sendiri disebut teks _____.", a: "deskripsi", opts: ["deskripsi", "eksplikasi", "rekonstruksi", "argumentasi"], exp: "Teks deskripsi menonjolkan detail pancaindra untuk menghidupkan gambaran objek." },
        { q: "Pernyataan yang memuat informasi peristiwa yang benar-benar terjadi dan dapat dibuktikan kebenarannya dengan data akurat disebut _____.", a: "fakta", opts: ["fakta", "opini", "gosip", "dongeng"], exp: "Fakta bersifat objektif dan dapat diverifikasi kebenarannya melalui bukti empiris." },
        { q: "Pernyataan yang berisi tanggapan, pendapat, atau pandangan pribadi yang belum tentu disetujui semua orang dinamakan _____.", a: "opini", opts: ["opini", "fakta", "hukum", "dalil"], exp: "Opini bersifat subjektif dan dipengaruhi oleh perasaan atau sudut pandang pribadi." }
      ]
    ],
    'hebat': [
      // Paket 1: HOTS Sains & Teknologi Terbarukan
      [
        { q: "Energi dari sumber daya alam yang tidak akan pernah habis seperti matahari, angin, dan air dinamakan energi _____.", a: "terbarukan", opts: ["terbarukan", "fosil", "nuklir", "tambang"], exp: "Energi terbarukan tidak menghasilkan polusi gas emisi rumah kaca yang merusak iklim." },
        { q: "Bahan bakar fosil seperti minyak bumi dan batu bara jumlahnya terbatas di perut bumi sehingga tergolong sumber energi tak _____.", a: "terbarukan", opts: ["terbarukan", "habis", "bersih", "terbatas"], exp: "Pembentukan bahan bakar fosil membutuhkan waktu jutaan tahun dari sisa jasad purba." },
        { q: "Perangkat yang dipasang di atap rumah untuk mengubah radiasi sinar matahari menjadi energi listrik dinamakan panel _____.", a: "surya", opts: ["surya", "baterai", "turbin", "generator"], exp: "Panel surya semikonduktor silikon mengonversi foton cahaya menjadi elektron arus listrik." },
        { q: "Pembangkit listrik yang memanfaatkan aliran air deras untuk memutar turbin dan menggerakkan generator dinamakan _____.", a: "PLTA", opts: ["PLTA", "PLTU", "PLTD", "PLTN"], exp: "PLTA memanfaatkan energi potensial dan kinetik air untuk memproduksi listrik ramah lingkungan." },
        { q: "Pembangkit listrik ramah lingkungan yang memanfaatkan embusan angin kencang memutar kincir aerogenerator disingkat _____.", a: "PLTB", opts: ["PLTB", "PLTA", "PLTU", "PLTS"], exp: "Bayu berarti angin, PLTB mengonversi energi kinetik hembusan angin menjadi listrik." },
        { q: "Gas metana dari pengolahan kotoran ternak di dalam tabung digester yang dimanfaatkan sebagai bahan bakar ramah lingkungan disebut _____.", a: "biogas", opts: ["biogas", "bensin", "solar", "avtur"], exp: "Biogas dihasilkan dari proses fermentasi anaerobik materi kotoran organik ternak." }
      ],
      // Paket 2: Wawasan Global, Ekologi & Iklim
      [
        { q: "Fenomena kenaikan suhu rata-rata atmosfer bumi akibat penumpukan gas rumah kaca dinamakan pemanasan _____.", a: "global", opts: ["global", "lokal", "regional", "musiman"], exp: "Pemanasan global mencairkan gletser kutub dan menaikkan permukaan air laut dunia." },
        { q: "Gas-gas di atmosfer seperti karbon dioksida dan metana yang memerangkap panas matahari dinamakan gas rumah _____.", a: "kaca", opts: ["kaca", "atap", "batu", "besi"], exp: "Efek rumah kaca alami menjaga bumi hangat, namun emisi berlebih memicu krisis iklim." },
        { q: "Lapisan gas di stratosfer bumi yang berfungsi menyerap radiasi sinar ultraviolet berbahaya dari matahari adalah lapisan _____.", a: "ozon", opts: ["ozon", "oksigen", "nitrogen", "hidrogen"], exp: "Senyawa CFC dari pendingin ruangan dapat merusak ikatan molekul ozon di stratosfer." },
        { q: "Hujan yang memiliki tingkat keasaman tinggi akibat pencemaran gas belerang dan nitrogen dioksida dinamakan hujan _____.", a: "asam", opts: ["asam", "basa", "garam", "manis"], exp: "Hujan asam mencemari air danau, mematikan ikan, dan merusak kesuburan tanah hutan." },
        { q: "Prinsip pengolahan sampah 3R yang menganjurkan kita mengurangi penggunaan barang sekali pakai dinamakan prinsip _____.", a: "reduce", opts: ["reduce", "reuse", "recycle", "replace"], exp: "Reduce berarti membatasi konsumsi barang sekali pakai sejak awal sebelum jadi sampah." },
        { q: "Kegiatan mendaur ulang limbah barang bekas menjadi produk baru yang bernilai guna dinamakan prinsip _____.", a: "recycle", opts: ["recycle", "reuse", "reduce", "reboisasi"], exp: "Recycle memproses limbah menjadi bahan baku baru untuk menghemat sumber daya alam." }
      ],
      // Paket 3: Hak Asasi, Demokrasi & Tata Kelola
      [
        { q: "Hak dasar kodrati yang dimiliki setiap manusia sejak lahir sebagai anugerah Tuhan Yang Maha Esa disingkat _____.", a: "HAM", opts: ["HAM", "KPK", "DPR", "MPR"], exp: "HAM menjamin hak hidup, kebebasan, dan perlindungan martabat setiap insan manusia." },
        { q: "Sistem pemerintahan di mana kedaulatan tertinggi berada di tangan rakyat dinamakan sistem _____.", a: "demokrasi", opts: ["demokrasi", "monarki", "oligarki", "anarki"], exp: "Demokrasi menjunjung tinggi kebebasan berpendapat dan persamaan kedudukan di mata hukum." },
        { q: "Hukum dasar tertulis tertinggi dalam penyelenggaraan negara Republik Indonesia adalah UUD _____.", a: "1945", opts: ["1945", "1950", "1965", "1998"], exp: "UUD 1945 memuat dasar negara, tujuan nasional, dan jaminan hak-hak warga negara." },
        { q: "Lembaga peradilan tertinggi negara yang berwenang mengadili perkara pada tingkat kasasi adalah Mahkamah _____.", a: "Agung", opts: ["Agung", "Konstitusi", "Yudisial", "Rakyat"], exp: "Mahkamah Agung (MA) membawahi lingkungan peradilan umum, agama, militer, dan TUN." },
        { q: "Lembaga negara independen yang bertugas memberantas tindak pidana korupsi di Indonesia disingkat _____.", a: "KPK", opts: ["KPK", "BPK", "KPU", "DPR"], exp: "KPK dibentuk untuk memberantas tindak pidana korupsi secara profesional dan transparan." },
        { q: "Asas pelaksanaan pemilihan umum yang langsung, umum, bebas, rahasia, jujur, dan adil disingkat menjadi asas _____.", a: "Luberjurdil", opts: ["Luberjurdil", "Pancasila", "Bhinneka", "Reformasi"], exp: "Luberjurdil menjamin kejujuran dan netralitas pesta demokrasi pemilihan wakil rakyat." }
      ],
      // Paket 4: Pemikiran Logis, Literasi Kritis & Karakter
      [
        { q: "Sikap bijak menyaring informasi dan meneliti kebenaran data sebelum percaya dinamakan berpikir secara _____.", a: "kritis", opts: ["kritis", "pasif", "emosional", "ceroboh"], exp: "Berpikir kritis membentengi diri dari bahaya tipuan hoaks dan disinformasi digital." },
        { q: "Informasi bohong yang sengaja disebarkan untuk menimbulkan keresahan dan kepanikan warga disebut berita _____.", a: "hoaks", opts: ["hoaks", "fakta", "opini", "mitos"], exp: "Sebelum membagikan kabar, kita wajib memverifikasi keabsahan fakta ke narasumber resmi." },
        { q: "Kemampuan untuk menempatkan diri dan memahami perasaan atau penderitaan orang lain dinamakan rasa _____.", a: "empati", opts: ["empati", "simpati", "egois", "apatis"], exp: "Empati melahirkan tindakan nyata membantu dan membela orang yang membutuhkan pertolongan." },
        { q: "Kesesuaian antara perkataan dan perbuatan serta tidak berbohong mencerminkan sikap insan yang _____.", a: "jujur", opts: ["jujur", "curang", "khianat", "munafik"], exp: "Kejujuran adalah fondasi utama pembentukan karakter ksatria dan integritas moral bangsa." },
        { q: "Tindakan menyakiti, mengejek, atau mengucilkan teman secara berulang dikenal sebagai perundungan atau _____.", a: "bullying", opts: ["bullying", "sharing", "caring", "helping"], exp: "Sekolah ramah anak wajib bebas dari segala bentuk perundungan (bullying) fisik dan verbal." },
        { q: "Sikap teguh pendirian dan terus berusaha bangkit dari kegagalan mencerminkan semangat pantang _____.", a: "menyerah", opts: ["menyerah", "berkarya", "berpikir", "belajar"], exp: "Ketekunan dan daya juang pantang menyerah adalah kunci sukses sejati para juara." }
      ],
      // Paket 5: Keterampilan Menulis Ilmiah & Bahasa Baku Tingkat Mahir
      [
        { q: "Penulisan judul karya ilmiah diawali huruf kapital, kecuali kata tugas atau konjungsi seperti di, ke, dan, serta kata _____.", a: "atau", opts: ["atau", "Maka", "Serta", "Juga"], exp: "Konjungsi dan preposisi di tengah judul karya tulis ditulis menggunakan huruf kecil." },
        { q: "Kata baku bahasa Indonesia untuk menyebut orang yang merintis usaha bisnis mandiri dengan inovasi kreatif adalah pelaku _____.", a: "wirausaha", opts: ["wirausaha", "entreprener", "bisnisman", "pedagang"], exp: "Wirausaha berasal dari kata wira (pejuang/berani) dan usaha (daya upaya mandiri)." },
        { q: "Ringkasan padat yang memuat masalah, metode, dan kesimpulan akhir pada awal laporan karya ilmiah dinamakan _____.", a: "abstrak", opts: ["abstrak", "daftar isi", "glosarium", "lampiran"], exp: "Abstrak memudahkan pembaca memahami garis besar isi penelitian dalam 1-2 paragraf." },
        { q: "Daftar penjelasan istilah teknis atau kata-kata sulit yang disusun secara alfabetis di akhir buku pelajaran dinamakan _____.", a: "glosarium", opts: ["glosarium", "indeks", "katalog", "bibliografi"], exp: "Glosarium memuat definisi ringkas istilah-istilah khusus yang dipakai dalam buku teks." },
        { q: "Daftar kata penting yang disertai nomor halaman kemunculannya di dalam buku untuk memudahkan penelusuran dinamakan _____.", a: "indeks", opts: ["indeks", "glosarium", "daftar pustaka", "kata pengantar"], exp: "Indeks buku disusun menurut urutan abjad A-Z beserta nomor halaman rujukannya." },
        { q: "Bagian pembuka buku yang memuat ucapan syukur, terima kasih, serta harapan penulis dinamakan kata _____.", a: "pengantar", opts: ["pengantar", "penutup", "persembahan", "pengesahan"], exp: "Kata pengantar menjadi jembatan komunikasi pembuka antara penulis dengan para pembacanya." }
      ]
    ]
  }
};

/**
 * Mengambil paket soal berdasarkan filter Fase, Tingkat Kesulitan, dan Nomor Paket.
 * 
 * @param {string} fase - 'fase-a' | 'fase-b' | 'fase-c'
 * @param {string} tingkat - 'mudah' | 'sedang' | 'hebat'
 * @param {string|number} paket - 'all' | 1 | 2 | 3 | 4 | 5
 * @param {number} count - Jumlah soal maksimal yang ingin diambil (default 10)
 * @returns {Array} Daftar soal kalimat rumpang siap pakai
 */
export function getPinisiQuestions(fase = 'fase-a', tingkat = 'mudah', paket = 'all', count = 10) {
  const faseKey = PINISI_QUESTION_BANK[fase] ? fase : 'fase-a';
  const tingkatKey = PINISI_QUESTION_BANK[faseKey][tingkat] ? tingkat : 'mudah';
  const paketList = PINISI_QUESTION_BANK[faseKey][tingkatKey];

  let result = [];

  if (paket !== 'all' && !isNaN(parseInt(paket))) {
    const pIdx = Math.max(0, Math.min(4, parseInt(paket) - 1));
    result = [...(paketList[pIdx] || [])];
  } else {
    // Acak dari semua paket dalam tingkat ini
    paketList.forEach(pkg => {
      result.push(...pkg);
    });
  }

  // Acak urutan soal
  const shuffled = [...result].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
