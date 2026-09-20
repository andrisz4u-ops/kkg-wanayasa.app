/**
 * cp-document-data.ts
 * Standar Data Dokumen Capaian Pembelajaran (CP) Kurikulum Merdeka
 * Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025 & BSKAP No. 032/H/KR/2024
 */

import { getOfficialCPElements, getFaseFromKelas, matchSubjectKey, cpData } from './cp-data';

export interface ElemenDeskripsi {
  elemen: string;
  deskripsi: string;
}

export interface CapaianElemenItem {
  no: number;
  elemen: string;
  cp: string;
}

export interface CpDocumentData {
  mata_pelajaran: string;
  fase: string;
  kelas: string;
  regulasi: string;
  rasional: string;
  tujuan: string[];
  karakteristik: string;
  elemen_deskripsi: ElemenDeskripsi[];
  capaian_umum: string;
  capaian_elemen: CapaianElemenItem[];
}

interface SubjectMetaDef {
  regulasi: string;
  rasional: string;
  tujuan: string[];
  karakteristik: string;
  elemenDeskripsi: Record<string, string>;
  capaianUmum: Record<string, string>;
}

const SUBJECT_CP_METADATA: Record<string, SubjectMetaDef> = {
  "Pendidikan Pancasila": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "Pendidikan Pancasila merupakan muatan pembelajaran strategis untuk menanamkan nilai-nilai luhur falsafah dasar negara, membina moralitas, konstitusionalisme, semangat kebangsaan, dan kebinekaan global bagi murid. Mata pelajaran ini berorientasi pada pembentukan karakter warga negara yang beriman, bertakwa kepada Tuhan Yang Maha Esa, berakhlak mulia, bergotong royong, mandiri, bernalar kritis, dan berjiwa patriotik.",
    tujuan: [
      "Menginternalisasi dan mengamalkan nilai-nilai Pancasila dalam kehidupan berkeluarga, bermasyarakat, berbangsa, dan bernegara.",
      "Menumbuhkan kesadaran hukum dan kepatuhan terhadap norma, hak, dan kewajiban konstitusional warga negara berdasarkan UUD 1945.",
      "Mengembangkan sikap toleransi, inklusivitas, dan penghargaan terhadap keragaman suku, agama, ras, dan antargolongan dalam bingkai Bhinneka Tunggal Ika.",
      "Memperkokoh komitmen kebangsaan, rasa cinta tanah air, dan partisipasi aktif dalam menjaga keutuhan Negara Kesatuan Republik Indonesia."
    ],
    karakteristik: "Pendidikan Pancasila berorientasi pada pengamalan nilai nyata dan pembiasaan keteladanan (habituasi), mengedepankan pendekatan kontekstual dan reflektif melalui 4 (empat) pilar elemen esensial kebangsaan.",
    elemenDeskripsi: {
      "Pancasila": "Membahas sejarah kelahiran, makna simbol, sila-sila, nilai-nilai dasar, dan pengamalan Pancasila sebagai pandangan hidup bangsa serta dasar negara.",
      "UUD Negara Republik Indonesia Tahun 1945": "Membahas norma, aturan hidup bermasyarakat, hak dan kewajiban asasi warga negara, serta musyawarah mufakat dalam kehidupan sehari-hari.",
      "Bhinneka Tunggal Ika": "Membahas identitas diri, apresiasi keragaman budaya, kearifan lokal, sikap saling menghargai, dan toleransi sosial.",
      "Negara Kesatuan Republik Indonesia": "Membahas wilayah tempat tinggal, sekolah, daerah kabupaten/provinsi, gotong royong, persatuan, dan wujud bela negara."
    },
    capaianUmum: {
      "Fase A": "Pada akhir Fase A, murid mengenal bendera negara, lambang Garuda Pancasila, simbol dan sila Pancasila di keluarga; mengenal dan mematuhi aturan di rumah dan sekolah; menghargai identitas diri dan teman; serta bekerja sama menjaga lingkungan sekitar.",
      "Fase B": "Pada akhir Fase B, murid memahami makna sila-sila Pancasila dan penerapannya; mengidentifikasi serta melaksanakan aturan, hak, dan kewajiban di sekolah dan masyarakat; membedakan dan menghargai keragaman budaya dan suku; serta bekerja sama menjaga keutuhan lingkungan sekitar.",
      "Fase C": "Pada akhir Fase C, murid memahami kronologi sejarah kelahiran Pancasila dan meneladani perumusnya; mengimplementasikan norma, hak, dan kewajiban serta musyawarah mufakat; melestarikan keberagaman budaya nasional; serta menunjukkan perilaku gotong royong menjaga keutuhan NKRI."
    }
  },

  "Bahasa Indonesia": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "Bahasa Indonesia adalah wahana utama untuk mengembangkan kecakapan berpikir kritis, bernalar kreatif, berkomunikasi santun, dan menumbuhkan kecintaan terhadap karya sastra serta identitas kebangsaan. Pembelajaran bahasa membekali murid dengan literasi multi-moda yang relevan untuk mengakses ilmu pengetahuan dan berkontribusi positif di masyarakat.",
    tujuan: [
      "Menumbuhkan kemahiran berbahasa Indonesia lisan dan tulis secara tepat, santun, efektif, dan percaya diri dalam berbagai konteks sosial.",
      "Meningkatkan kemampuan literasi membaca, memirsa, dan bernalar analitis terhadap berbagai teks informatif dan sastra.",
      "Mengembangkan keterampilan menulis secara kreatif, terstruktur, dan mematuhi kaidah kebahasaan yang baik.",
      "Menghargai dan membudayakan karya sastra Indonesia sebagai warisan luhur nilai estetika dan kemanusiaan."
    ],
    karakteristik: "Pembelajaran Bahasa Indonesia berbasis teks multimodal yang integratif, mencakup 4 (empat) elemen reseptif dan produktif yang berkesinambungan.",
    elemenDeskripsi: {
      "Menyimak": "Kemampuan memahami, memaknai, menginterpretasi, dan menganalisis informasi dan pesan dari teks aural (teks lisan yang dibacakan/didengarkan).",
      "Membaca dan Memirsa": "Kemampuan melafalkan, memahami kosa kata baru, menemukan ide pokok dan pendukung, serta menganalisis teks tertulis dan visual multimodal.",
      "Berbicara dan Mempresentasikan": "Kemampuan menyampaikan gagasan, pendapat, perasaan, dan tanggapan secara lisan dengan artikulasi, intonasi, dan gestur santun.",
      "Menulis": "Kemampuan mengekspresikan gagasan, fakta, dan imajinasi ke dalam bentuk teks tulis dengan ejaan, tanda baca, dan struktur kalimat yang tepat."
    },
    capaianUmum: {
      "Fase A": "Pada akhir Fase A, murid memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar; memahami instruksi dan teks aural sederhana; membaca kata-kata sederhana dengan fasih; merespons pembicaraan secara santun; serta menulis permulaan dengan tulisan yang rapi dan benar.",
      "Fase B": "Pada akhir Fase B, murid memiliki kemampuan berbahasa untuk memahami ide pokok teks aural dan visual multimodal; menyajikan pendapat dengan intonasi dan pilihan kata santun; serta menulis teks narasi dan deskripsi sederhana dengan kosakata beragam dan ejaan yang tepat.",
      "Fase C": "Pada akhir Fase C, murid memiliki kemampuan berbahasa untuk menganalisis teks sastra dan nonsastra aural/visual; mempresentasikan ide secara efektif; serta menulis berbagai jenis teks narasi, eksposisi, dan kreatif dengan kalimat kompleks dan kosakata konotatif/denotatif."
    }
  },

  "Matematika": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "Matematika merupakan ilmu universal yang mendasari perkembangan sains, teknologi, dan kecakapan bernalar logis, sistematis, kritis, dan analitis. Melalui pembelajaran matematika, murid dibimbing membangun kepekaan numerik (number sense), pemecahan masalah (problem solving), dan penalaran matematis yang konkret hingga abstrak dalam kehidupan sehari-hari.",
    tujuan: [
      "Memahami konsep matematis, operasi hitung, dan hubungan antar-konsep secara mendalam dan fleksibel.",
      "Menggunakan penalaran matematis pada pola, representasi data, dan hubungan spasial untuk menyusun argumen logis.",
      "Menyelesaikan masalah kontekstual nyata melalui permodelan matematis yang tepat dan efisien.",
      "Menumbuhkan sikap pantang menyerah, teliti, apresiatif, dan percaya diri terhadap kegunaan matematika."
    ],
    karakteristik: "Pembelajaran Matematika disajikan secara hierarkis dan spiral melalui peragaan konkret, semi-konkret (gambar), hingga simbolis abstrak yang mencakup 5 (lima) elemen utama.",
    elemenDeskripsi: {
      "Bilangan": "Membahas konsep dan intuisi bilangan cacah, pecahan, desimal, operasi hitung penjumlahan, pengurangan, perkalian, pembagian, serta KPK dan FPB.",
      "Aljabar": "Membahas pola gambar/objek, kalimat matematika, persamaan sederhana, rasio, proporsi, dan penalaran aljabar pemecahan masalah.",
      "Pengukuran": "Membahas satuan baku dan tidak baku untuk panjang, berat, luas, volume, durasi waktu, serta besar sudut.",
      "Geometri": "Membahas karakteristik bangun datar, bangun ruang, visualisasi spasial, komposisi, dekomposisi, serta sistem posisi berpetak.",
      "Analisis Data dan Peluang": "Membahas pengumpulan, pengorganisasian, penyajian data (tabel, diagram batang, piktogram), interpretasi data, dan peluang percobaan sederhana."
    },
    capaianUmum: {
      "Fase A": "Pada akhir Fase A, murid memiliki intuisi bilangan cacah sampai 100, melakukan operasi tambah/kurang benda konkret sampai 20; mengenal pola bukan bilangan; membandingkan panjang, berat, dan durasi waktu; mengenal bangun datar dan bangun ruang; serta menyajikan data menggunakan turus dan piktogram.",
      "Fase B": "Pada akhir Fase B, murid menguasai bilangan cacah sampai 10.000, operasi hitung dasar, pecahan senilai dan desimal; menemukan nilai yang belum diketahui dalam pola; mengukur panjang, berat, luas, dan volume dengan satuan baku; mendeskripsikan sifat bangun datar; serta menginterpretasi diagram batang.",
      "Fase C": "Pada akhir Fase C, murid menguasai bilangan cacah sampai 1.000.000, pecahan campuran, perbandingan dan rasio; bernalar proporsional; menghitung keliling dan luas bangun datar serta sudut; mengonstruksi bangun ruang dan visualisasi spasial; serta menganalisis diagram batang, tabel frekuensi, dan peluang sederhana."
    }
  },

  "Ilmu Pengetahuan Alam dan Sosial (IPAS)": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "IPAS merupakan integrasi holistik antara sains kealaman dan ilmu sosial yang dirancang untuk merawat rasa ingin tahu alami murid tentang dirinya, lingkungan fisik, ekosistem, sejarah peradaban, serta interaksi sosial-ekonomi. Pembelajaran IPAS melatih murid menjadi penyelidik cilik yang berwawasan ilmiah, peka terhadap kelestarian lingkungan, dan bangga akan warisan budaya nusantara.",
    tujuan: [
      "Menumbuhkan rasa ingin tahu, kecintaan terhadap alam, dan kepedulian sosial terhadap dinamika lingkungan tempat tinggal.",
      "Memahami konsep esensial kealaman dan kemasyarakatan serta interaksi dinamis antara manusia dan ekosistem.",
      "Mengembangkan keterampilan proses sains (inkuiri ilmiah): mengamati, memprediksi, merencanakan penyelidikan, menganalisis data, dan mengomunikasikan temuan.",
      "Menumbuhkan kesadaran mitigasi bencana, pelestarian sumber daya alam, kearifan lokal, dan tanggung jawab sosial."
    ],
    karakteristik: "Pembelajaran IPAS menggabungkan dua elemen yang saling menopang: pemahaman konsep esensial dan keterampilan proses berbasis penyelidikan langsung (hands-on inquiry).",
    elemenDeskripsi: {
      "Pemahaman IPAS": "Mencakup pemahaman konsep tentang anatomi dan kesehatan organ tubuh, ekosistem, energi, gelombang bunyi/cahaya, sistem tata surya, letak geografis, sejarah pahlawan, keanekaragaman budaya, dan kegiatan ekonomi.",
      "Keterampilan Proses": "Mencakup kemampuan penyelidikan ilmiah yang meliputi: Mengamati; Mempertanyakan dan Memprediksi; Merencanakan dan Melakukan Penyelidikan; Memproses, Menganalisis Data dan Informasi; Mengevaluasi dan Refleksi; serta Mengomunikasikan Hasil."
    },
    capaianUmum: {
      "Fase B": "Pada akhir Fase B, murid mampu menjelaskan pancaindra, siklus hidup makhluk hidup, wujud zat, sumber energi dan gaya; mengenali letak kabupaten/provinsi dengan peta; mengidentifikasi sejarah dan keragaman budaya lokal; menjelaskan pengelolaan keuangan sederhana; serta menerapkan keterampilan proses inkuiri terpandu.",
      "Fase C": "Pada akhir Fase C, murid mampu merefleksikan sistem organ tubuh dan masa pubertas, hubungan ekosistem, gelombang bunyi dan cahaya, tata surya, siklus air dan energi alternatif; menjelaskan letak geografis Indonesia; meninjau sejarah perjuangan pahlawan; memahami kearifan lokal dan ekonomi masyarakat; serta melakukan penyelidikan sains mandiri yang sistematis."
    }
  },

  "Pendidikan Agama dan Budi Pekerti": {
    regulasi: "Keputusan Dirjen Pendidikan Islam / Kepka BKPDM No. 020 Tahun 2026",
    rasional: "Pendidikan Agama dan Budi Pekerti membimbing murid memperkokoh keimanan dan ketakwaan kepada Allah Swt., berakhlak mulia (akhlakul karimah) kepada sesama dan alam ciptaan, serta menumbuhkan sikap moderasi beragama dalam kebinekaan bangsa.",
    tujuan: [
      "Membaca, menulis, menghafal, dan memahami pesan pokok Al-Qur'an dan hadis Nabi saw.",
      "Meyakini rukun iman dan meneladani sifat-sifat mulia Allah Swt. dan para rasul.",
      "Membiasakan akhlak terpuji terhadap Allah Swt., diri sendiri, sesama manusia, dan alam semesta.",
      "Memahami dan mempraktikkan tata cara ibadah fardu dan sunah secara tertib dan benar."
    ],
    karakteristik: "Pembelajaran agama mengintegrasikan pemahaman teologis, pembiasaan ibadah praktis, dan keteladanan moral melalui 5 (lima) elemen pokok keagamaan.",
    elemenDeskripsi: {
      "Al-Qur’an Hadis": "Kemampuan membaca ayat-ayat Al-Qur'an dan hadis dengan tajwid yang baik, menulis, menghafal, serta memahami kandungan maknanya.",
      "Akidah": "Pemahaman dan keyakinan teguh terhadap rukun iman, asmaulhusna, dan dimensi keimanan islam.",
      "Akhlak": "Penerapan adab dan akhlakul karimah kepada Allah, sesama manusia, orang tua, guru, dan pelestarian lingkungan.",
      "Fikih": "Ketentuan hukum ibadah: bersuci (thaharah), salat fardu/sunah, puasa, zakat, infak, dan sedekah.",
      "Sejarah Peradaban Islam": "Kisah keteladanan para nabi, rasul, sahabat, dan khulafaurasyidin sebagai inspirasi hidup."
    },
    capaianUmum: {
      "Fase A": "Pada akhir Fase A, murid mengenal huruf hijaiah bersambung, menghafal surah pendek, meyakini rukun iman, membiasakan akhlak mulia, mempraktikkan tata cara bersuci dan salat fardu, serta meneladani kisah nabi.",
      "Fase B": "Pada akhir Fase B, murid fasih membaca Al-Qur'an dan hadis tentang silaturahmi, meyakini kitab suci dan rasul, menerapkan akhlak terpuji kepada orang tua dan guru, melaksanakan salat jumat/sunah, serta memahami masa kerasulan Nabi di Makkah.",
      "Fase C": "Pada akhir Fase C, murid memahami surah pilihan, meyakini hari akhir dan qada/qadar, mengamalkan akhlak terpuji dan toleransi, mempraktikkan puasa, zakat, dan sedekah, serta menjelaskan dakwah Nabi periode Madinah dan khulafaurasyidin."
    }
  },

  "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "PJOK merupakan sarana esensial untuk membentuk kebiasaan beraktivitas jasmani secara teratur, meningkatkan kebugaran jasmani, menumbuhkan sportivitas, serta mengembangkan pemahaman komprehensif tentang pola hidup bersih dan sehat sepanjang hayat.",
    tujuan: [
      "Mengembangkan keterampilan gerak dasar fundamental hingga variasi dan kombinasi gerak terstruktur.",
      "Meningkatkan derajat kebugaran jasmani dan ketahanan motorik murid.",
      "Menanamkan nilai sportivitas, disiplin, kerja sama, respek, dan fair play.",
      "Membiasakan pola hidup sehat, konsumsi gizi seimbang, dan keselamatan diri."
    ],
    karakteristik: "Pembelajaran PJOK memadukan aktivitas fisik langsung, permainan edukatif, dan literasi kesehatan melalui 4 (empat) elemen kompetensi.",
    elemenDeskripsi: {
      "Keterampilan Gerak": "Penguasaan gerak lokomotor, nonlokomotor, manipulatif, senam, gerak berirama, dan aktivitas air.",
      "Pengetahuan Gerak": "Pemahaman konsep, prinsip, dan mekanika gerak untuk efisiensi dan keamanan aktivitas jasmani.",
      "Pemanfaatan Gerak": "Penerapan aktivitas fisik untuk memelihara kebugaran jasmani, postur tubuh, dan pola hidup sehat.",
      "Pengembangan Karakter dan Nilai-nilai Gerak": "Internalisasi nilai tanggung jawab personal dan sosial, kepemimpinan, dan etika berolahraga."
    },
    capaianUmum: {
      "Fase A": "Pada akhir Fase A, murid mempraktikkan gerak fundamental dalam situasi bermain, mematuhi aturan sederhana, memilih makanan bergizi, dan mengenali situasi aman untuk beraktivitas.",
      "Fase B": "Pada akhir Fase B, murid memperhalus variasi dan kombinasi gerak dasar, menyesuaikan strategi gerak permainan, berpartisipasi aktif dalam tim, serta mempraktikkan P3K sederhana.",
      "Fase C": "Pada akhir Fase C, murid menguasai pola gerak kompleks, memodifikasi aturan untuk permainan fair play, mengaitkan aktivitas jasmani dengan pencegahan penyakit sedenter, serta mengelola kebugaran diri."
    }
  },

  "Bahasa Inggris": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "Bahasa Inggris di sekolah dasar membekali murid dengan rasa percaya diri, keterampilan interaksi verbal dasar, dan wawasan antarbudaya dalam bahasa komunikasi global melalui aktivitas yang menyenangkan, kontekstual, dan bermakna.",
    tujuan: [
      "Menumbuhkan minat dan keberanian berkomunikasi dalam Bahasa Inggris pada ranah kehidupan sehari-hari.",
      "Mengembangkan kecakapan reseptif (menyimak, membaca) dan produktif (berbicara, menulis) secara terpadu.",
      "Membangun pemahaman kosakata dasar dan struktur kalimat fungsional sederhana."
    ],
    karakteristik: "Pembelajaran Bahasa Inggris di SD berpusat pada pemerolehan bahasa secara alami melalui lagu, cerita, permainan, dan media visual interaktif.",
    elemenDeskripsi: {
      "Menyimak – Berbicara (Listening – Speaking)": "Kemampuan memahami tuturan lisan guru/rekan dan merespons secara verbal/non-verbal dalam percakapan sehari-hari.",
      "Membaca – Memirsa (Reading – Viewing)": "Kemampuan membaca dan memahami teks tertulis bergambar atau visual multimodal pendek.",
      "Menulis – Mempresentasikan (Writing – Presenting)": "Kemampuan menulis kata atau kalimat pendek terpandu dan menyampaikan ide secara lisan."
    },
    capaianUmum: {
      "Fase B": "Pada akhir Fase B, murid dapat memahami dan merespons teks lisan sederhana tentang diri dan lingkungan, membaca teks bergambar pendek, serta menulis kalimat sederhana sesuai konteks.",
      "Fase C": "Pada akhir Fase C, murid dapat memahami alur informasi teks lisan secara runtut, merespons percakapan topik sehari-hari dengan kalimat sederhana yang percaya diri, membaca beragam teks pendek, serta menuliskan ide dan pengalamannya secara mandiri."
    }
  },

  "Seni Rupa": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "Seni Rupa merupakan wadah pengembangan sensibilitas visual, imajinasi kreatif, keterampilan motorik halus, serta apresiasi nilai keindahan karya seni dan alam sekitar untuk memperkaya kesejahteraan emosional murid.",
    tujuan: [
      "Mengembangkan kepekaan mengamati unsur-unsur rupa dan prinsip estetika di lingkungan sekitar.",
      "Mengekspresikan ide, perasaan, dan imajinasi melalui ragam media dan teknik seni rupa.",
      "Mengapresiasi karya seni diri sendiri dan teman dengan sikap saling menghargai.",
      "Menghasilkan karya seni yang mencerminkan rasa syukur dan kepedulian terhadap lingkungan."
    ],
    karakteristik: "Pembelajaran Seni Rupa berpusat pada eksplorasi bahan, visual thinking, dan siklus kreasi artistik yang mencakup 5 (lima) elemen.",
    elemenDeskripsi: {
      "Mengalami (Experiencing)": "Mengamati, mengidentifikasi, dan merasakan unsur rupa (garis, bidang, warna, tekstur) pada objek visual.",
      "Merefleksikan (Reflecting)": "Menghargai dan mengevaluasi karya seni rupa diri dan teman menggunakan kosakata seni yang sesuai.",
      "Berpikir dan Bekerja Artistik": "Mengenali dan menguji coba variasi alat, bahan, dan teknik berkarya seni secara aman dan kreatif.",
      "Menciptakan (Making/Creating)": "Membuat karya seni rupa dua atau tiga dimensi berdasarkan pengalaman nyata dan imajinasi.",
      "Berdampak (Impacting)": "Menghasilkan karya yang memberikan kepuasan batin bagi murid dan menyampaikan pesan positif."
    },
    capaianUmum: {
      "Fase A": "Pada akhir Fase A, murid mengenali unsur rupa di sekitar, mengapresiasi karyanya, mencoba alat gambar, dan membuat karya 2D/3D sederhana.",
      "Fase B": "Pada akhir Fase B, murid mengidentifikasi unsur dan prinsip desain rupa, merefleksikan karya dengan kosakata seni, menguji coba variasi bahan, dan menciptakan karya kreatif.",
      "Fase C": "Pada akhir Fase C, murid menjelaskan unsur rupa dan prinsip desain secara analitis, bereksperimen dengan teknik rupa tingkat lanjut, serta menciptakan karya yang berdampak sosial/ekologis."
    }
  },

  "Koding dan Kecerdasan Artifisial": {
    regulasi: "Keputusan Kepala BSKAP Kemendikbudristek No. 046 Tahun 2025",
    rasional: "Koding dan Kecerdasan Artifisial (KA) membekali generasi muda dengan kompetensi berpikir komputasional, pemecahan masalah algoritmis, literasi kecerdasan artifisial, dan kesadaran etika digital di era revolusi industri 4.0 dan Society 5.0.",
    tujuan: [
      "Mengembangkan pola pikir komputasional (dekomposisi, pengenalan pola, abstraksi, dan algoritma) dalam menyelesaikan masalah.",
      "Memahami konsep dasar sistem komputasi, perangkat digital, dan pemanfaatan internet secara aman dan bertanggung jawab.",
      "Memahami prinsip kerja dan pemanfaatan teknologi Kecerdasan Artifisial (KA) untuk kesejahteraan manusia.",
      "Menumbuhkan etika digital, empati, perlindungan data pribadi, dan integritas berkarya di ruang siber."
    ],
    karakteristik: "Pembelajaran disajikan dengan metode unplugged (tanpa gawai) dan plugged (berbantuan aplikasi visual koding) yang berfokus pada logika dan nalar kritis.",
    elemenDeskripsi: {
      "Berpikir Komputasional": "Penerapan pemecahan masalah secara terstruktur melalui dekomposisi persoalan, pengenalan pola, abstraksi, dan penulisan algoritma logis.",
      "Literasi Digital": "Pemahaman sistem digital, pemanfaatan internet sehat, keamanan informasi pribadi, dan etika komunikasi siber.",
      "Literasi dan Etika Kecerdasan Artifisial": "Pemahaman konsep KA, perbedaan kecerdasan manusia dan mesin, etika pemanfaatan KA, dan dampak sosialnya.",
      "Pemanfaatan dan Pengembangan Kecerdasan Artifisial": "Simulasi cara kerja KA dalam mengenali pola data konkret, klasifikasi objek, dan evaluasi hasil prediksi cerdas."
    },
    capaianUmum: {
      "Fase C": "Pada akhir Fase C, murid mampu merumuskan langkah pemecahan masalah secara logis terstruktur; mengoperasikan aplikasi digital dan mengamankan data pribadi; memahami etika dasar pemanfaatan AI; serta menyimulasikan cara kerja model AI sederhana dalam mengenali pola data kehidupan nyata."
    }
  },

  "B.Sunda": {
    regulasi: "Peraturan Gubernur Jawa Barat / Kurikulum Muatan Lokal",
    rasional: "Pangajaran Basa jeung Sastra Sunda miboga fungsi pikeun ngaraksa, ngariksa, tur ngamumulé ajén-inajén budaya luhur Sunda, ngaronjatkeun kamampuh komunikasi santun maké tatakrama basa, sarta ngajembaran wawasan kearifan lokal urang Sunda.",
    tujuan: [
      "Mampuh komunikasi dina basa Sunda kalawan bener, merenah, tur sopan luyu jeung undak-usuk basa.",
      "Mikareueus jeung mikanyaah kana basa, sastra, jeung aksara Sunda minangka warisan budaya karuhun.",
      "Ngagali ajén kearifan lokal tina dongéng, pupuh, jeung kasenian Sunda pikeun ngawangun karakter murid nu nyunda."
    ],
    karakteristik: "Pangajaran basa Sunda museur kana kaparigelan ngagunakeun basa dina kahirupan sapopoé ngaliwatan 4 (opat) aspék kaparigelan basa.",
    elemenDeskripsi: {
      "Ngaregepkeun": "Kaparigelan mikaharti jeung nyurahan eusi omongan, dongéng, guguritan, atawa warta anu kadéngé.",
      "Maca jeung Miarsa": "Kaparigelan maca téks kalayan lafal jeung lentong anu merenah sarta mikaharti pesenna.",
      "Nyarita jeung Midangkeun": "Kaparigelan ngedalkeun pamikiran jeung rasa sacara lisan maké tatakrama basa (loma jeung lemes).",
      "Nulis": "Kaparigelan nuliskeun kecap, kalimah, jeung karangan dina aksara Latén atawa aksara Sunda kalawan bener."
    },
    capaianUmum: {
      "Fase A": "Dina ahir Fase A, murid mampuh ngaregepkeun jeung ngaréspons caritaan basajan ngeunaan diri jeung kulawarga, maca kecap basajan kalawan lancar, sarta nuliskeun aksara jeung kecap kalawan rapih.",
      "Fase B": "Dina ahir Fase B, murid mampuh nyurahan eusi dongéng jeung carita, cumarita ngagunakeun tatakrama basa Sunda anu luyu, sarta nyusun karangan dheskripsi pondok dumasar pangalaman pribadi.",
      "Fase C": "Dina ahir Fase C, murid mampuh nganalisis téks aural basa Sunda (warta, pupuh), nepikeun biantara atawa pamadegan kalayan tartib tur sopan, sarta nulis rupa-rupa karangan narasi atawa éksposisi kalayan merenah."
    }
  },

  "Tatanen di Bale Atikan": {
    regulasi: "Peraturan Bupati Purwakarta No. 69 Tahun 2021 tentang Pendidikan Berkarakter Tatanen di Bale Atikan (TdBA)",
    rasional: "Tatanen di Bale Atikan (TdBA) adalah gerakan pendidikan transformatif berbasis kearifan lokal Purwakarta yang mengintegrasikan budidaya pertanian alami (permakultur), ekoliterasi, konservasi lingkungan hidup berkelanjutan, pola hidup sehat, dan penumbuhan kecakapan hidup (life skills) murid demi terwujudnya keharmonisan hidup dengan alam.",
    tujuan: [
      "Mengembangkan kesadaran ekoliterasi dan hidup berkelanjutan melalui pemahaman jenis sampah, efisiensi energi, dan pelestarian alam.",
      "Membekali keterampilan permakultur dan ketahanan pangan melalui budidaya tanaman selaras alam dan pemanfaatan pekarangan.",
      "Membiasakan pola hidup sehat, menjaga kebersihan diri dan lingkungan, serta mengonsumsi pangan bergizi seimbang hasil tanam sendiri.",
      "Menumbuhkan kecakapan hidup (life skills), komunikasi, berpikir kritis, kreativitas, jiwa wirausaha, dan pengamalan nilai kearifan lokal Sunda (leuweung hejo, rakyat ngejo)."
    ],
    karakteristik: "Pembelajaran berbasis aksi nyata di kebun sekolah dan lingkungan sekitar yang mengintegrasikan empat elemen utama: Hidup Berkelanjutan, Permakultur, Pola Hidup Sehat, dan Kecakapan Hidup (Life Skills).",
    elemenDeskripsi: {
      "Hidup Berkelanjutan": "Memahami jenis sampah, pengelolaan sampah bijak, efisiensi energi, dan pelestarian lingkungan.",
      "Permakultur": "Sistem pertanian selaras dengan alam, pemanfaatan wadah/barang bekas, media tanam, pembuatan kompos, dan budidaya tanaman.",
      "Pola Hidup Sehat": "Menjaga kebersihan diri, kesehatan fisik, dan konsumsi pangan bergizi seimbang dari hasil tanam sendiri.",
      "Kecakapan Hidup (Life Skills)": "Keterampilan sosial, komunikasi, berpikir kritis, pemecahan masalah, kecakapan ekologi, kreativitas, dan jiwa wirausaha."
    },
    capaianUmum: {
      "Fase A": "Pada akhir Fase A, murid mampu mengenal dan memahami jenis sampah serta pengaruhnya bagi kehidupan, terlibat dalam pengelolaan sampah sederhana dan pemanfaatan benda alam (kompos/infused water), mengenal bagian tanaman dan menanam sederhana di sekolah, serta membiasakan peduli kebersihan dan pola hidup sehat.",
      "Fase B": "Pada akhir Fase B, murid mampu menjelaskan dan mempraktikkan pengelolaan sampah terstruktur (kurangi, pilah, olah), mengidentifikasi tanaman pangan lokal, memanfaatkan energi alam untuk pascapanen sederhana, memahami teknik dasar budidaya tanaman, serta membangun kesadaran pola hidup sehat selaras alam.",
      "Fase C": "Pada akhir Fase C, murid memahami pentingnya menjaga keseimbangan ekosistem dan menganalisis dampak aktivitas manusia, mempraktikkan budidaya tanaman mandiri (semai hingga panen), mengolah sampah organik untuk pangan sehat, membiasakan konsumsi pangan bergizi, serta mengembangkan kepedulian sosial dan kearifan lokal Sunda (leuweung hejo, rakyat ngejo)."
    }
  },

  "AKPK": {
    regulasi: "Peraturan Daerah / Kebijakan Atikan Karakter Purwakarta",
    rasional: "Atikan Karakter Purwakarta (AKPK) mangrupakeun pondasi ngawangun jati diri generasi emas nu mibanda karakter luhur dumasar kana ajén Pancasila jeung kearifan kabudayaan Sunda ngaliwatan pola pembiasaan Tujuh Poe Atikan Istimewa.",
    tujuan: [
      "Ngukuhkeun karakter mulia murid dumasar kana nilai-nilai kearifan budaya Sunda jeung falsafah Pancasila.",
      "Ngadidik kabiasaan hirup disiplin, mandiri, tanggung jawab, welas asih, jeung produktif ngaliwatan Tujuh Poe Atikan.",
      "Ngajaga kasaimbangan spiritual, intelektual, émosional, jeung fisik murid sacara holistik."
    ],
    karakteristik: "Pembelajaran reflektif terintegrasi dalam pembiasaan harian 7 Poe Atikan (Senen Ajeg Nusantara, Salasa Mapag Buana, Rebo Maneh, Kemis Nyanding Rasa, Jumaah Nyucikeun Diri, Saptu-Minggu Betah di Imah).",
    elemenDeskripsi: {
      "Ajeg Nusantara": "Ngemban karakter cinta tanah air, wawasan kabangsaan, jeung ngamalkeun nilai-nilai luhur Pancasila.",
      "Mapag Buana": "Nyiapkeun diri nyanghareupan kamajuan dunya kalawan wawasan global, literasi, jeung téknologi.",
      "Maneh": "Miboga kamandirian, mikawanoh potensi diri, kasadaran emosi, jeung pamikiran kritis.",
      "Nyanding Rasa": "Miboga rasa empati, welas asih, gotong royong, apresiasi seni budaya, jeung toleransi.",
      "Nyucikeun Diri": "Ngaronjatkeun kataqwaan ka Gusti, kaberesihan hate, ucapan jujur, jeung ibadah harian.",
      "Betah di Imah & Reureuh": "Ngukuhkeun tatali asih jeung kulawarga, bakti ka kolot, sarta istirahat anu seimbang."
    },
    capaianUmum: {
      "Fase A": "Murid némbongkeun rasa reueus ka tanah air, mikawanoh kabiasaan hadé diri sorangan, nyaah ka babaturan, hormat ka guru/kolot, sarta getol ibadah.",
      "Fase B": "Murid ngamalkeun wawasan diajar aktif, literasi dasar, gotong royong dina rupa-rupa kabudayaan, disiplin ibadah, jeung komunikasi harmonis di kulawarga.",
      "Fase C": "Murid miboga wawasan nusantara kuat, literasi digital tanggung jawab, kepemimpinan diri berintegritas, filantropi sosial, jeung ketahanan mental tangguh."
    }
  }
};

/**
 * Mengambil paket data lengkap dokumen Capaian Pembelajaran resmi
 */
export function getOfficialCpDocumentData(mataPelajaran: string, jenjangKelas: string): CpDocumentData {
  const fase = getFaseFromKelas(jenjangKelas) || 'Fase C';
  const subjects = Object.keys(SUBJECT_CP_METADATA);
  const matchedKey = matchSubjectKey(mataPelajaran, subjects) || 'Matematika';
  const meta = SUBJECT_CP_METADATA[matchedKey] || SUBJECT_CP_METADATA['Matematika'];

  // Ambil elemen CP spesifik
  const rawElements = getOfficialCPElements(mataPelajaran, jenjangKelas) || {};
  const elemenNames = Object.keys(rawElements);

  // Jika elemen tidak ditemukan di kamus statis, ambil dari meta.elemenDeskripsi
  const finalElemenNames = elemenNames.length > 0 ? elemenNames : Object.keys(meta.elemenDeskripsi);

  const capaianElemenList: CapaianElemenItem[] = finalElemenNames.map((name, idx) => ({
    no: idx + 1,
    elemen: name,
    cp: rawElements[name] || `Menunjukkan pemahaman esensial dan menerapkan kecakapan pada elemen ${name} sesuai tuntutan ${fase}.`
  }));

  const elemenDeskripsiList: ElemenDeskripsi[] = finalElemenNames.map(name => ({
    elemen: name,
    deskripsi: meta.elemenDeskripsi[name] || `Ruang lingkup kompetensi dan materi esensial pada bidang ${name}.`
  }));

  const capaianUmumText = meta.capaianUmum[fase] || 
    `Pada akhir ${fase}, murid menguasai kompetensi esensial dan nilai-nilai pembentuk karakter pada mata pelajaran ${mataPelajaran}.`;

  return {
    mata_pelajaran: mataPelajaran || matchedKey,
    fase,
    kelas: jenjangKelas || 'Kelas 5',
    regulasi: meta.regulasi,
    rasional: meta.rasional,
    tujuan: meta.tujuan,
    karakteristik: meta.karakteristik,
    elemen_deskripsi: elemenDeskripsiList,
    capaian_umum: capaianUmumText,
    capaian_elemen: capaianElemenList
  };
}
