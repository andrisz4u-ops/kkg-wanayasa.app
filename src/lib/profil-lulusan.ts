/**
 * 8 Dimensi Profil Lulusan & Alur Perkembangan Kompetensi
 * Berdasarkan:
 * 1. Keputusan Kepala BSKAP Kemendikdasmen No. 058/H/KR/2025 (25 September 2025)
 * 2. Permendikdasmen No. 13 Tahun 2025 (Perubahan atas Permendikbudristek No. 12/2024 Pasal 17)
 * 
 * Menggantikan Projek Penguatan Profil Pelajar Pancasila (P5) lama (6 dimensi)
 * menjadi 8 Dimensi Profil Lulusan dengan 3 Tahapan Perkembangan:
 * - Berkembang : Menuju standar (memerlukan bimbingan)
 * - Cakap      : Standar kelulusan (SKL terpenuhi secara konsisten)
 * - Mahir      : Melampaui standar (inisiatif mandiri, reflektif, teladan)
 */

export type TahapPerkembangan = 'Berkembang' | 'Cakap' | 'Mahir';

export type JenjangPendidikan = 'PAUD' | 'SD' | 'SMP' | 'SMA' | 'SMK';

export interface IndikatorTahap {
  berkembang: string;
  cakap: string;
  mahir: string;
}

export interface SubdimensiProfilLulusan {
  id: string;
  nomor: number;
  nama: string;
  deskripsi?: string;
  indikator: {
    [key in JenjangPendidikan]?: IndikatorTahap;
  };
}

export interface DimensiProfilLulusan {
  id: string;
  nomor: number;
  nama: string;
  singkat: string;
  deskripsi: string;
  ikon: string; // Lucide / Bootstrap icon name
  warnaBadge: string; // Tailwind color classes
  subdimensi: SubdimensiProfilLulusan[];
}

export const DIMENSI_PROFIL_LULUSAN: DimensiProfilLulusan[] = [
  {
    id: 'keimanan-ketakwaan',
    nomor: 1,
    nama: 'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa',
    singkat: 'Keimanan & Ketakwaan',
    deskripsi: 'Mengacu pada individu yang memiliki keyakinan teguh, mengamalkan ajaran agama/kepercayaan, berakhlak mulia, serta menjaga hubungan harmonis dengan Tuhan, sesama manusia, dan lingkungan alam.',
    ikon: 'heart-handshake',
    warnaBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    subdimensi: [
      {
        id: 'hubungan-tuhan',
        nomor: 1,
        nama: 'Hubungan dengan Tuhan Yang Maha Esa',
        indikator: {
          PAUD: {
            berkembang: 'Mengenal konsep ibadah dan doa sederhana sesuai agamanya dengan bimbingan penuh.',
            cakap: 'Mencontoh dan membiasakan perilaku sesuai perintah Tuhan secara sederhana (berdoa, bersyukur) dengan bimbingan orang dewasa.',
            mahir: 'Membiasakan diri beribadah dan berdoa secara konsisten dalam keseharian serta menjadi contoh bagi teman sebaya.'
          },
          SD: {
            berkembang: 'Mengenal ajaran Tuhan YME melalui cerita, doa, dan praktik ibadah sesuai agamanya serta mulai memahami nilai kebaikan dalam kehidupan nyata.',
            cakap: 'Membiasakan diri melaksanakan ajaran Tuhan YME dalam kehidupan nyata secara konsisten dengan bimbingan orang tua dan guru serta mampu mensyukurinya.',
            mahir: 'Melaksanakan ibadah secara mandiri sesuai ajaran Tuhan YME secara konsisten dalam kehidupan nyata serta menjadi contoh dalam beribadah dan bersikap religius.'
          },
          SMP: {
            berkembang: 'Memahami ajaran dan perintah Tuhan YME serta mulai mengaitkannya dengan pengalaman hidup sehari-hari namun belum konsisten.',
            cakap: 'Menghayati dan mengamalkan ajaran Tuhan YME dalam kehidupan sehari-hari secara konsisten dan penuh kesadaran.',
            mahir: 'Mengamalkan ajaran Tuhan YME secara konsisten, mampu merefleksikan nilai-nilai spiritual dalam pengambilan keputusan, dan menjadi teladan bagi sesama.'
          },
          SMA: {
            berkembang: 'Menghayati dan mengamalkan ajaran Tuhan YME dalam ranah pribadi dan sosial namun belum konsisten.',
            cakap: 'Menghayati dan mengamalkan ajaran Tuhan YME secara konsisten serta mampu menegakkannya dalam kehidupan masyarakat.',
            mahir: 'Menginternalisasi nilai-nilai keimanan dan ketakwaan secara mendalam, menjadi teladan moral spiritual, dan aktif berkontribusi bagi kemaslahatan umat.'
          },
          SMK: {
            berkembang: 'Menghayati dan mengamalkan ajaran Tuhan YME dalam kehidupan sosial dan lingkungan kerja namun belum konsisten.',
            cakap: 'Menghayati dan mengamalkan ajaran Tuhan YME secara konsisten serta mampu menegakkannya dalam kehidupan pribadi, sosial, dan dunia kerja.',
            mahir: 'Menghayati dan mengamalkan ajaran agama secara konsisten, menegakkan etika religius di dunia kerja, serta menjadi teladan bagi rekan kerja.'
          }
        }
      },
      {
        id: 'hubungan-sesama',
        nomor: 2,
        nama: 'Hubungan dengan sesama Manusia',
        indikator: {
          PAUD: {
            berkembang: 'Mengenal konsep perilaku baik dan buruk (berbagi, jujur) dengan pengawasan dan bimbingan orang dewasa.',
            cakap: 'Memahami konsep dasar akhlak mulia dalam kehidupan sehari-hari melalui sikap kasih sayang, kejujuran, dan berbagi dengan teman.',
            mahir: 'Menunjukkan perilaku akhlak mulia secara konsisten dalam berinteraksi dengan teman sebaya dan keluarga.'
          },
          SD: {
            berkembang: 'Mengenal dan mencoba bersikap jujur, adil, peduli, dan bertanggung jawab dengan bimbingan.',
            cakap: 'Membiasakan bersikap jujur, adil, peduli, dan bertanggung jawab dalam interaksi dalam kehidupan nyata.',
            mahir: 'Menunjukkan perilaku akhlak mulia melalui sikap kasih sayang, kejujuran, keadilan, dan tanggung jawab secara konsisten serta menjadi teladan bagi teman sebaya.'
          },
          SMP: {
            berkembang: 'Menunjukkan sikap peduli, adil, dan menghargai orang lain dengan bimbingan saat menghadapi perbedaan.',
            cakap: 'Membiasakan perilaku berakhlak mulia, menghargai martabat manusia, dan menjunjung tinggi kejujuran serta toleransi secara konsisten.',
            mahir: 'Menginternalisasi akhlak mulia, mampu menyelesaikan perselisihan secara damai, dan menjadi penggerak kebaikan di lingkungan sosial.'
          },
          SMA: {
            berkembang: 'Menunjukkan kedewasaan moral dan spiritual dalam menghargai perbedaan sosial, budaya, dan agama namun belum konsisten.',
            cakap: 'Menunjukkan integritas moral, bersikap adil, empatik, dan menjunjung tinggi keadilan sosial dalam interaksi bermasyarakat.',
            mahir: 'Menjadi teladan integritas moral dan etika sosial, memperjuangkan keadilan dan kemaslahatan bersama secara transformatif.'
          },
          SMK: {
            berkembang: 'Menunjukkan pemahaman nilai saling menghormati dan berintegritas dalam kehidupan pribadi dan lingkungan kerja.',
            cakap: 'Menunjukkan perilaku akhlak mulia yang mencerminkan kedewasaan moral, integritas profesional, dan tanggung jawab di dunia kerja.',
            mahir: 'Menginternalisasi nilai kasih sayang, integritas, dan kejujuran di dunia kerja serta memberikan kebermanfaatan nyata bagi rekan kerja dan masyarakat.'
          }
        }
      },
      {
        id: 'hubungan-lingkungan',
        nomor: 3,
        nama: 'Hubungan dengan Lingkungan Alam',
        indikator: {
          PAUD: {
            berkembang: 'Menunjukkan kesadaran pentingnya menjaga lingkungan alam dengan bimbingan guru.',
            cakap: 'Menjaga lingkungan alam sekitar dalam kehidupan sehari-hari (membuang sampah pada tempatnya, merawat tanaman).',
            mahir: 'Berinisiatif menjaga kebersihan dan kelestarian alam sekitar serta mengingatkan teman sebaya.'
          },
          SD: {
            berkembang: 'Menunjukkan pemahaman tentang pentingnya menjaga kebersihan lingkungan dan kelestarian alam dengan bimbingan.',
            cakap: 'Membiasakan menjaga kebersihan lingkungan dan kelestarian alam secara konsisten dan mandiri.',
            mahir: 'Menjadi contoh bagi teman dalam kepedulian lingkungan serta mampu menunjukkan inisiatif dalam menjaga kebersihan lingkungan dan kelestarian alam.'
          },
          SMP: {
            berkembang: 'Memahami isu lingkungan hidup dan berpartisipasi dalam aksi pelestarian lingkungan dengan bimbingan.',
            cakap: 'Berperan aktif dalam program pelestarian lingkungan hidup dan mempraktikkan gaya hidup ramah lingkungan secara konsisten.',
            mahir: 'Menginisiasi aksi nyata konservasi lingkungan di sekolah/komunitas serta mampu mengedukasi sesama murid mengenai keberlanjutan bumi.'
          },
          SMA: {
            berkembang: 'Menganalisis dampak aktivitas manusia terhadap lingkungan dan mengidentifikasi solusi pelestarian dengan bimbingan.',
            cakap: 'Mewujudkan tanggung jawab ekologis melalui perumusan dan implementasi solusi atas permasalahan lingkungan hidup di sekitarnya.',
            mahir: 'Memimpin gerakan keberlanjutan lingkungan, merancang inovasi ramah lingkungan, dan menjadi teladan kelestarian biosfer.'
          },
          SMK: {
            berkembang: 'Membangun kesadaran terhadap lingkungan dan mengidentifikasi solusi dari permasalahan lingkungan dan dunia kerja.',
            cakap: 'Mewujudkan tanggung jawab ekologis secara konsisten dengan merumuskan dan mengimplementasikan solusi ramah lingkungan di tempat kerja.',
            mahir: 'Menciptakan dan mengimplementasikan inovasi ramah lingkungan di industri, mengevaluasi dampaknya, dan menjadi teladan *green skills*.'
          }
        }
      }
    ]
  },
  {
    id: 'kewargaan',
    nomor: 2,
    nama: 'Kewargaan',
    singkat: 'Kewargaan',
    deskripsi: 'Mengacu pada individu yang bangga akan identitas dan budayanya, menghargai keberagaman, menjaga persatuan bangsa, menaati aturan hukum/sosial, serta menjaga harmoni antarbangsa.',
    ikon: 'flag',
    warnaBadge: 'bg-red-100 text-red-800 border-red-300',
    subdimensi: [
      {
        id: 'kewargaan-lokal',
        nomor: 1,
        nama: 'Kewargaan Lokal',
        indikator: {
          PAUD: {
            berkembang: 'Mengenal aturan sederhana yang berlaku di satuan pendidikan dan keluarga.',
            cakap: 'Mematuhi aturan yang berlaku di satuan pendidikan dan keluarga dengan bimbingan.',
            mahir: 'Mematuhi aturan yang berlaku di satuan pendidikan dan keluarga secara mandiri dan konsisten.'
          },
          SD: {
            berkembang: 'Mengenal aturan dan norma sosial yang berlaku di lingkungan keluarga, sekolah, dan masyarakat sekitar.',
            cakap: 'Menaati aturan dan norma sosial yang berlaku di lingkungan sekolah dan masyarakat secara konsisten.',
            mahir: 'Menaati aturan serta mengajak teman sebaya untuk mematuhi tata tertib dan norma sosial di lingkungan sekitar.'
          },
          SMP: {
            berkembang: 'Menunjukkan kesadaran atas aturan, norma, dan nilai kearifan lokal yang berlaku di masyarakatnya.',
            cakap: 'Menerapkan dan menghargai nilai kearifan lokal serta menaati hukum dan norma masyarakat secara konsisten.',
            mahir: 'Menjaga dan mempromosikan kearifan lokal serta menjadi penggerak ketertiban dan harmoni sosial di komunitasnya.'
          },
          SMA: {
            berkembang: 'Memahami dinamika sosial budaya lokal dan berpartisipasi dalam pemeliharaan ketertiban umum.',
            cakap: 'Berpartisipasi aktif dalam kegiatan sosial kemasyarakatan lokal dengan menjunjung tinggi nilai budaya daerah.',
            mahir: 'Memimpin inisiatif pemberdayaan masyarakat lokal dan melestarikan warisan budaya takbenda secara transformatif.'
          },
          SMK: {
            berkembang: 'Mengenal dan menaati etika sosial di masyarakat serta budaya kerja industri lokal.',
            cakap: 'Menerapkan budaya kerja yang selaras dengan nilai kearifan lokal dan kepatuhan hukum di lingkungan kerja.',
            mahir: 'Menjadi pelopor penerapan etika profesi dan norma sosial dalam dunia kerja dan industri di tingkat lokal.'
          }
        }
      },
      {
        id: 'kewargaan-nasional',
        nomor: 2,
        nama: 'Kewargaan Nasional',
        indikator: {
          PAUD: {
            berkembang: 'Mengenal bendera Merah Putih, lagu kebangsaan, dan simbol dasar negara dengan bimbingan.',
            cakap: 'Menunjukkan rasa hormat terhadap simbol-simbol negara dan teman dari latar belakang berbeda.',
            mahir: 'Bangga menyebutkan identitas sebagai anak Indonesia dan berteman rukun tanpa membeda-bedakan.'
          },
          SD: {
            berkembang: 'Menunjukkan kesadaran atas aturan, norma, dan nilai sosial budaya yang berlaku di lingkup nasional.',
            cakap: 'Berperilaku sesuai aturan, norma, dan nilai sosial budaya yang berlaku di lingkup nasional dengan bimbingan.',
            mahir: 'Berperilaku sesuai aturan, norma, dan nilai sosial budaya nasional secara mandiri dan bangga terhadap NKRI.'
          },
          SMP: {
            berkembang: 'Memiliki ketertarikan dalam menghargai keragaman masyarakat dan budaya nasional untuk menguatkan wawasan kebangsaan.',
            cakap: 'Menghargai keragaman suku, agama, ras, dan antargolongan serta menjaga persatuan bangsa secara aktif.',
            mahir: 'Mengadvokasi nilai-nilai kebangsaan, toleransi antarumat beragama, dan aktif mencegah perpecahan di lingkungan sekolah.'
          },
          SMA: {
            berkembang: 'Memahami hak dan kewajiban warga negara dalam sistem demokrasi Pancasila dan konstitusi.',
            cakap: 'Melaksanakan hak dan kewajiban sebagai warga negara secara bertanggung jawab serta berkomitmen menjaga keutuhan NKRI.',
            mahir: 'Menjadi teladan wawasan kebangsaan yang inklusif, kritis terhadap isu kebangsaan, dan berkontribusi nyata bagi kemajuan bangsa.'
          },
          SMK: {
            berkembang: 'Memahami kontribusi profesi kejuruan bagi pembangunan ekonomi dan ketahanan nasional.',
            cakap: 'Mendedikasikan kompetensi kejuruan untuk kemajuan bangsa dan menaati regulasi ketenagakerjaan nasional.',
            mahir: 'Menciptakan karya inovatif kejuruan yang berdampak strategis bagi kemandirian teknologi dan ekonomi nasional.'
          }
        }
      },
      {
        id: 'kewargaan-global',
        nomor: 3,
        nama: 'Kewargaan Global',
        indikator: {
          PAUD: {
            berkembang: 'Mengenali adanya negara lain di dunia melalui cerita atau gambar.',
            cakap: 'Mengenali keberadaan negara lain di dunia dan simbol-simbolnya dengan bimbingan.',
            mahir: 'Mengenali keberadaan negara lain di dunia serta menghargai perbedaan budaya secara santun.'
          },
          SD: {
            berkembang: 'Mengenali keberadaan negara lain di dunia dan simbol-simbolnya.',
            cakap: 'Mengenal aturan, norma, dan nilai sosial budaya yang berlaku di lingkup global untuk menguatkan wawasan kebangsaan.',
            mahir: 'Berperilaku sesuai norma global dan menghargai keberagamannya dengan tetap menjaga identitas diri dan budaya nasional.'
          },
          SMP: {
            berkembang: 'Memahami isu-isu global sederhana dan pengaruhnya terhadap kehidupan sehari-hari.',
            cakap: 'Menghargai keanekaragaman budaya dunia tanpa kehilangan identitas budaya bangsa Indonesia.',
            mahir: 'Menunjukkan keterbukaan terhadap peradaban global, berpikir kritis atas isu dunia, dan mempromosikan perdamaian.'
          },
          SMA: {
            berkembang: 'Menganalisis isu-isu global (keberlanjutan, perdamaian, teknologi) dan relevansinya bagi Indonesia.',
            cakap: 'Berpartisipasi dalam dialog lintas budaya global dengan tetap memegang teguh jati diri bangsa.',
            mahir: 'Menjadi warga dunia yang aktif, solutif terhadap isu kemanusiaan global, dan mempromosikan keunggulan Indonesia di kancah internasional.'
          },
          SMK: {
            berkembang: 'Mengenal standar dan kompetensi kerja yang berlaku di pasar global.',
            cakap: 'Mampu beradaptasi dengan standar profesionalisme global dan komunikasi lintas budaya di industri.',
            mahir: 'Mampu bersaing di pasar kerja internasional dengan etos kerja unggul dan integritas budaya bangsa.'
          }
        }
      }
    ]
  },
  {
    id: 'penalaran-kritis',
    nomor: 3,
    nama: 'Penalaran Kritis',
    singkat: 'Penalaran Kritis',
    deskripsi: 'Mengacu pada individu yang memiliki rasa ingin tahu tinggi, mampu berpikir logis, analitis, dan reflektif, memilah fakta dari opini, serta memecahkan masalah kompleks berbasis data.',
    ikon: 'brain',
    warnaBadge: 'bg-blue-100 text-blue-800 border-blue-300',
    subdimensi: [
      {
        id: 'penyampaian-argumentasi',
        nomor: 1,
        nama: 'Penyampaian Argumentasi',
        indikator: {
          PAUD: {
            berkembang: 'Menyampaikan pendapat sederhana mengenai hal yang disukai atau tidak disukai.',
            cakap: 'Menyampaikan pendapat singkat dengan alasan sederhana mengenai peristiwa nyata di sekitarnya.',
            mahir: 'Menyampaikan pendapat singkat secara runtut dengan alasan yang relevan dan dapat dipahami orang lain.'
          },
          SD: {
            berkembang: 'Menyampaikan argumen sederhana namun belum terstruktur atau belum didukung bukti.',
            cakap: 'Menyampaikan argumen sederhana secara runtut disertai alasan yang logis.',
            mahir: 'Menyampaikan argumen secara runtut, logis, didukung bukti relevan, dan mampu menghargai serta menanggapi argumen orang lain.'
          },
          SMP: {
            berkembang: 'Menyampaikan argumen logis secara runtut disertai alasan sederhana.',
            cakap: 'Menyampaikan argumen logis secara runtut disertai alasan yang kuat dan data pendukung.',
            mahir: 'Menyampaikan argumen yang logis secara runtut, didukung data dan bukti kuat yang relevan, dan mampu menyanggah secara santun.'
          },
          SMA: {
            berkembang: 'Menyusun argumen berdasarkan premis-premis logis namun masih terdapat bias penalaran.',
            cakap: 'Menyusun argumen ilmiah yang koheren, mengidentifikasi bias atau falasi berpikir, dan mempertahankan argumen dengan data valid.',
            mahir: 'Menyajikan analisis diskursif tingkat tinggi yang objektif, mengkritisi berbagai teori/perspektif, dan merumuskan sintesis konseptual.'
          },
          SMK: {
            berkembang: 'Menyampaikan alasan teknis dalam pemecahan tugas kejuruan sederhana.',
            cakap: 'Menyampaikan argumen teknis operasional yang logis sesuai spesifikasi dan standar mutu industri.',
            mahir: 'Menyampaikan telaah teknis kritis atas proses dan produk industri serta memberikan rekomendasi perbaikan berbasis data.'
          }
        }
      },
      {
        id: 'pengambilan-keputusan',
        nomor: 2,
        nama: 'Pengambilan Keputusan',
        indikator: {
          PAUD: {
            berkembang: 'Menentukan pilihan sederhana dengan meniru pilihan teman sebaya.',
            cakap: 'Menentukan pilihan berdasarkan preferensi diri dari beberapa alternatif yang disediakan.',
            mahir: 'Menentukan pilihan berdasarkan preferensi diri dengan alasan yang relevan dan bertanggung jawab atas pilihannya.'
          },
          SD: {
            berkembang: 'Mengambil keputusan namun belum logis dan belum berdasarkan informasi yang relevan.',
            cakap: 'Mengambil keputusan secara logis berdasarkan informasi yang relevan.',
            mahir: 'Mengambil keputusan secara logis dengan membandingkan beberapa sudut pandang dan mempertimbangkan dampaknya.'
          },
          SMP: {
            berkembang: 'Membuat keputusan dengan membandingkan beberapa alternatif informasi dengan bimbingan.',
            cakap: 'Membuat keputusan secara logis dengan membandingkan beberapa pendapat dan informasi yang relevan secara mandiri.',
            mahir: 'Mengambil keputusan berbasis risiko dan etika secara otonom serta mengevaluasi efektivitas keputusannya.'
          },
          SMA: {
            berkembang: 'Mengambil keputusan strategis dalam kelompok namun masih ragu menimbang konsekuensi jangka panjang.',
            cakap: 'Mengambil keputusan rasional yang mempertimbangkan etika, bukti empiris, dan dampak multidimensi.',
            mahir: 'Menunjukkan kepemimpinan dalam pengambilan keputusan di bawah kondisi ketidakpastian secara tepat dan etis.'
          },
          SMK: {
            berkembang: 'Menentukan langkah kerja operasional sesuai lembar petunjuk tugas.',
            cakap: 'Mengambil keputusan teknis dalam prosedur kerja dengan mempertimbangkan efisiensi dan keamanan kerja.',
            mahir: 'Mengambil keputusan pemecahan masalah mesin/sistem industri secara cepat, tepat, dan memitigasi kerugian operasional.'
          }
        }
      },
      {
        id: 'penyelesaian-masalah',
        nomor: 3,
        nama: 'Penyelesaian Masalah',
        indikator: {
          PAUD: {
            berkembang: 'Mencoba menyelesaikan tantangan atau hambatan bermain dengan bantuan orang dewasa.',
            cakap: 'Menyelesaikan tantangan atau masalah bermain sederhana secara mandiri.',
            mahir: 'Menyelesaikan tantangan bermain dengan cara kreatif dan mampu membantu teman yang mengalami kesulitan.'
          },
          SD: {
            berkembang: 'Menyelesaikan masalah sederhana dan menghasilkan solusi namun kurang tepat.',
            cakap: 'Menyelesaikan masalah sederhana dan menghasilkan solusi yang tepat sesuai konteks.',
            mahir: 'Menyelesaikan masalah sederhana, menghasilkan solusi kontekstual yang tepat, serta merefleksikan proses penyelesaiannya.'
          },
          SMP: {
            berkembang: 'Mengidentifikasi masalah dan menghasilkan solusi kontekstual namun belum optimal.',
            cakap: 'Menyelesaikan masalah sederhana dan menghasilkan solusi logis dan kontekstual yang tepat dengan bimbingan minimal.',
            mahir: 'Menyelesaikan masalah yang lebih kompleks dengan metode sistematis, menguji solusi alternatif, dan mengevaluasi efektivitasnya.'
          },
          SMA: {
            berkembang: 'Merumuskan solusi atas masalah konseptual atau sosial berbasis data sekunder.',
            cakap: 'Merumuskan solusi inovatif dan kontekstual atas permasalahan nyata dengan pendekatan saintifik interdisipliner.',
            mahir: 'Merancang intervensi sistemik untuk mengatasi persoalan masyarakat yang rumit dan melakukan uji coba validasi solusi.'
          },
          SMK: {
            berkembang: 'Menyelesaikan kendala teknis pada pekerjaan kejuruannya dengan bantuan instruktur.',
            cakap: 'Menyelesaikan kendala dan kerusakan (*troubleshooting*) dalam bidang kejuruannya sesuai prosedur standar kerja.',
            mahir: 'Menganalisis akar masalah (*root cause analysis*) kegagalan sistem kejuruan dan menciptakan metode preventif yang efisien.'
          }
        }
      }
    ]
  },
  {
    id: 'kreativitas',
    nomor: 4,
    nama: 'Kreativitas',
    singkat: 'Kreativitas',
    deskripsi: 'Mengacu pada individu yang mampu berperilaku produktif, menciptakan ide orisinal dan inovasi, berpikir fleksibel, serta merumuskan solusi unik bagi permasalahan di sekitarnya.',
    ikon: 'lightbulb',
    warnaBadge: 'bg-amber-100 text-amber-800 border-amber-300',
    subdimensi: [
      {
        id: 'gagasan-baru',
        nomor: 1,
        nama: 'Gagasan Baru',
        indikator: {
          PAUD: {
            berkembang: 'Menyampaikan gagasan imajinatif secara verbal atau nonverbal dengan bimbingan.',
            cakap: 'Menyampaikan gagasan imajinatif sederhana yang berbeda dari contoh guru.',
            mahir: 'Mengembangkan gagasan imajinatif baru secara spontan dan menghubungkan berbagai ide bermain.'
          },
          SD: {
            berkembang: 'Menyampaikan gagasan baru sederhana meskipun belum runtut atau masih meniru referensi.',
            cakap: 'Menyampaikan gagasan baru sederhana secara runtut, jelas, dan dapat diterapkan.',
            mahir: 'Menyampaikan gagasan baru yang orisinal, logis, relevan, serta menginspirasi rekan kelompoknya.'
          },
          SMP: {
            berkembang: 'Menyampaikan gagasan inovatif dari contoh atau referensi yang diberikan guru.',
            cakap: 'Mengembangkan gagasan inovatif orisinal untuk menyelesaikan masalah di lingkungan sekitarnya.',
            mahir: 'Mencetuskan ide-ide visioner yang mendobrak kebiasaan lama dan menawarkan perspektif baru yang aplikatif.'
          },
          SMA: {
            berkembang: 'Mengkombinasikan berbagai gagasan yang ada untuk menghasilkan konsep proyek baru.',
            cakap: 'Menghasilkan gagasan orisinal tingkat tinggi yang bernilai ekonomi, estetika, atau kebermanfaatan sosial.',
            mahir: 'Menghasilkan gagasan transformatif berbasis riset dan inovasi masa depan yang berdampak luas.'
          },
          SMK: {
            berkembang: 'Mengusulkan modifikasi desain atau fungsi produk kejuruan berdasarkan contoh.',
            cakap: 'Merancang gagasan inovasi produk atau jasa kejuruan yang memiliki nilai tambah pasar.',
            mahir: 'Menciptakan prototipe produk teknologi tepat guna atau model bisnis baru yang siap dikomersialkan.'
          }
        }
      },
      {
        id: 'fleksibilitas-berpikir',
        nomor: 2,
        nama: 'Fleksibilitas Berpikir',
        indikator: {
          PAUD: {
            berkembang: 'Meniru cara lain yang dicontohkan guru saat menghadapi kesulitan.',
            cakap: 'Menunjukkan proses berpikir fleksibel dalam menyelesaikan masalah bermain sehari-hari.',
            mahir: 'Menemukan cara alternatif bermain secara mandiri saat alat atau aturan berubah.'
          },
          SD: {
            berkembang: 'Menemukan solusi alternatif sederhana yang ditemui di lingkungan kelas dengan bantuan orang dewasa.',
            cakap: 'Menemukan solusi alternatif dengan mengadaptasi berbagai gagasan yang relevan.',
            mahir: 'Menemukan beberapa solusi alternatif yang bervariasi dan memberikan umpan balik atas pilihan solusinya.'
          },
          SMP: {
            berkembang: 'Menerima masukan untuk memodifikasi rencana kerja saat mengalami hambatan.',
            cakap: 'Menemukan beberapa alternatif jalan keluar dari perspektif yang berbeda secara lincah.',
            mahir: 'Mampu beradaptasi dengan cepat terhadap perubahan kondisi dan meredefinisi strategi secara kreatif.'
          },
          SMA: {
            berkembang: 'Mampu beralih dari satu kerangka berpikir ke kerangka berpikir lain dengan bimbingan.',
            cakap: 'Melihat suatu isu dari multi-sudut pandang dan menyusun strategi alternatif yang tangguh.',
            mahir: 'Menguasai pemikiran divergen-konvergen yang dinamis dan mampu mengubah kendala menjadi peluang inovasi.'
          },
          SMK: {
            berkembang: 'Mencoba teknik alternatif dalam pengerjaan bengkel sesuai arahan instruktur.',
            cakap: 'Mengadaptasi berbagai metode teknis untuk mengatasi keterbatasan alat/bahan baku di bengkel kerja.',
            mahir: 'Merekayasa ulang alur kerja kejuruan agar lebih efisien, hemat energi, dan adaptif terhadap teknologi baru.'
          }
        }
      },
      {
        id: 'karya',
        nomor: 3,
        nama: 'Karya',
        indikator: {
          PAUD: {
            berkembang: 'Menirukan bentuk karya seni atau tindakan sederhana berdasarkan perasaan.',
            cakap: 'Mengeksplorasi bentuk karya dan tindakan sederhana menggunakan motorik halus dan kasar.',
            mahir: 'Mengekspresikan karya kreatif orisinal (gambar, konstruksi balok, gerak) dengan percaya diri.'
          },
          SD: {
            berkembang: 'Membuat tindakan dan/atau karya sederhana yang kreatif sesuai minat dan kesukaannya.',
            cakap: 'Membuat tindakan dan/atau karya sederhana yang kreatif dengan berbagai ide yang terencana.',
            mahir: 'Membuat karya kreatif yang memadukan berbagai media serta mampu mengkritisi dan menyempurnakan karyanya.'
          },
          SMP: {
            berkembang: 'Menciptakan tindakan dan/atau karya kreatif serta dapat mengidentifikasi dampaknya.',
            cakap: 'Menciptakan karya kreatif yang kompleks dan bernilai estetis serta bermanfaat bagi lingkungan sekolah.',
            mahir: 'Menciptakan karya inovatif teruji yang dipublikasikan atau dipamerkan kepada khalayak umum.'
          },
          SMA: {
            berkembang: 'Menghasilkan karya seni, sastra, atau saintifik yang memenuhi kriteria standar estetika/metodologis.',
            cakap: 'Menghasilkan karya inovatif berdampak yang memadukan iptek, seni, dan nilai kemanusiaan.',
            mahir: 'Memproduksi karya transformatif berstandar profesional yang mendapatkan pengakuan atau hak kekayaan intelektual.'
          },
          SMK: {
            berkembang: 'Membuat produk atau jasa kejuruan standar dengan pengawasan pembimbing.',
            cakap: 'Menghasilkan produk/karya inovatif kejuruan yang presisi dan memenuhi standar kualitas industri.',
            mahir: 'Menghasilkan produk/jasa kejuruan unggulan yang kompetitif, bernilai jual tinggi, dan ramah lingkungan.'
          }
        }
      }
    ]
  },
  {
    id: 'kolaborasi',
    nomor: 5,
    nama: 'Kolaborasi',
    singkat: 'Kolaborasi',
    deskripsi: 'Mengacu pada individu yang membiasakan diri untuk peduli sesama, berbagi sumber daya dan gagasan, serta membangun kerja sama sinergis dengan berbagai kalangan (gotong royong).',
    ikon: 'users',
    warnaBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    subdimensi: [
      {
        id: 'peduli',
        nomor: 1,
        nama: 'Peduli',
        indikator: {
          PAUD: {
            berkembang: 'Mulai mengenali perilaku peduli orang lain pada kegiatan bermain melalui bimbingan.',
            cakap: 'Mengenali dan menunjukkan empati saat melihat teman sebaya bersedih atau terluka.',
            mahir: 'Menunjukkan kepedulian aktif kepada teman sebaya dan keluarga dalam berbagai situasi.'
          },
          SD: {
            berkembang: 'Mulai menunjukkan kepedulian pada teman sebaya dan anggota keluarga dengan bimbingan.',
            cakap: 'Menunjukkan kepedulian secara konsisten pada teman sebaya dan lingkungan sekolah.',
            mahir: 'Menunjukkan inisiatif kepedulian, tanggap membantu teman yang kesulitan tanpa diminta.'
          },
          SMP: {
            berkembang: 'Memperhatikan perasaan dan kebutuhan rekan dalam kelompok belajar.',
            cakap: 'Menunjukkan kepekaan sosial dan aktif berpartisipasi dalam aksi bakti sosial sekolah.',
            mahir: 'Menggerakkan kepedulian kolektif untuk merespons persoalan sosial di lingkungan masyarakat sekitar.'
          },
          SMA: {
            berkembang: 'Memahami isu keadilan sosial dan menunjukkan empati terhadap kelompok rentan.',
            cakap: 'Mengorganisir program kepedulian sosial kemanusiaan secara mandiri dan berkelanjutan.',
            mahir: 'Menjadi agen perubahan sosial yang memperjuangkan kesetaraan dan kepedulian kemanusiaan universal.'
          },
          SMK: {
            berkembang: 'Menunjukkan kepedulian terhadap keselamatan rekan kerja di bengkel.',
            cakap: 'Membangun iklim kerja yang saling menjaga, menghargai, dan mendukung antar sesama pekerja.',
            mahir: 'Membina solidaritas profesional yang kuat dan menjadi mentor bagi rekan kerja yang memerlukan pendampingan.'
          }
        }
      },
      {
        id: 'berbagi',
        nomor: 2,
        nama: 'Berbagi',
        indikator: {
          PAUD: {
            berkembang: 'Mulai mau meminjamkan mainan kepada teman dengan bujukan orang dewasa.',
            cakap: 'Membiasakan diri berbagi makanan atau mainan dengan teman sebaya secara sukarela.',
            mahir: 'Berbagi peran dan sarana bermain secara adil serta mengajak teman lain yang belum kebagian.'
          },
          SD: {
            berkembang: 'Mulai berbagi hal yang dianggap penting dan berharga kepada teman sebaya dengan arahan.',
            cakap: 'Berbagi peran, waktu, pengetahuan, dan sumber daya secara adil dalam kegiatan bersama.',
            mahir: 'Memiliki kerelaan berbagi secara tulus, mengapresiasi kontribusi orang lain, dan menginspirasi sesama.'
          },
          SMP: {
            berkembang: 'Bersedia membagikan materi pelajaran dan membagi tugas kelompok secara adil.',
            cakap: 'Aktif berbagi pengetahuan, keterampilan, dan peran demi keberhasilan pencapaian tujuan bersama.',
            mahir: 'Membangun budaya *knowledge sharing* yang terbuka, inklusif, dan saling memberdayakan.'
          },
          SMA: {
            berkembang: 'Berkontribusi aktif dalam pemanfaatan bersama sumber daya pengetahuan di komunitas.',
            cakap: 'Mendedikasikan waktu, keahlian, dan sumber daya untuk memberdayakan kelompok yang membutuhkan.',
            mahir: 'Menginisiasi platform kolaboratif untuk berbagi pengetahuan dan inovasi bagi kemaslahatan umum.'
          },
          SMK: {
            berkembang: 'Berbagi peralatan kerja secara bergantian dan merawatnya bersama.',
            cakap: 'Saling mentransfer keterampilan teknis dan praktik baik (*best practices*) dalam tim kerja industri.',
            mahir: 'Menciptakan jejaring kolaborasi transfer pengetahuan antara sekolah, industri, dan masyarakat.'
          }
        }
      },
      {
        id: 'kerja-sama',
        nomor: 3,
        nama: 'Kerja sama',
        indikator: {
          PAUD: {
            berkembang: 'Mulai mengenali perilaku kerja sama saat bermain bersama melalui bimbingan.',
            cakap: 'Mampu bermain bersama dalam kelompok kecil dan mengikuti giliran tugas sederhana.',
            mahir: 'Bekerjasama dengan teman sebaya secara harmonis untuk menyelesaikan permainan bersama.'
          },
          SD: {
            berkembang: 'Mulai bekerjasama dengan teman sebaya dalam kelompok dengan arahan guru.',
            cakap: 'Bekerjasama dengan teman sebaya, menjalankan tugas kelompok yang disepakati secara bertanggung jawab.',
            mahir: 'Membangun koordinasi tim yang efektif, menjaga kekompakan, dan mendorong tercapainya tujuan bersama.'
          },
          SMP: {
            berkembang: 'Menjalankan peran dalam kelompok kerja sesuai instruksi fasilitator.',
            cakap: 'Menyelaraskan tindakan diri dengan rekan tim, saling melengkapi peran, dan mencapai target tim.',
            mahir: 'Memimpin sinergi tim multi-karakter, mengelola dinamika kelompok, dan meraih prestasi kolektif.'
          },
          SMA: {
            berkembang: 'Bekerjasama dalam proyek lintas disiplin dengan pembagian peran yang terencana.',
            cakap: 'Membangun kemitraan strategis dengan berbagai pemangku kepentingan untuk keberhasilan proyek.',
            mahir: 'Membangun ekosistem kolaborasi yang kokoh lintas organisasi/komunitas tingkat nasional atau global.'
          },
          SMK: {
            berkembang: 'Bekerja dalam lini tim produksi kejuruan sesuai prosedur operasional standar.',
            cakap: 'Bekerjasama secara solid dalam tim kerja lintas divisi industri untuk menjamin mutu dan target produksi.',
            mahir: 'Mengoordinasikan proyek industri yang melibatkan berbagai spesialisasi kejuruan dengan produktivitas tinggi.'
          }
        }
      }
    ]
  },
  {
    id: 'kemandirian',
    nomor: 6,
    nama: 'Kemandirian',
    singkat: 'Kemandirian',
    deskripsi: 'Mengacu pada individu yang mampu bertanggung jawab atas proses dan hasil belajar, meregulasi diri, mengambil inisiatif kepemimpinan, dan terus mengembangkan potensinya secara otonom.',
    ikon: 'compass',
    warnaBadge: 'bg-purple-100 text-purple-800 border-purple-300',
    subdimensi: [
      {
        id: 'bertanggung-jawab',
        nomor: 1,
        nama: 'Bertanggung Jawab',
        indikator: {
          PAUD: {
            berkembang: 'Menyelesaikan tugas sederhana yang diberikan guru dengan bimbingan penuh.',
            cakap: 'Menyelesaikan tugas yang diberikan guru dengan bimbingan minimal dan merapikan alat belajarnya.',
            mahir: 'Menyelesaikan tugas belajarnya sampai tuntas secara mandiri dan bangga akan hasilnya.'
          },
          SD: {
            berkembang: 'Melakukan upaya mencapai tujuan pembelajaran sesuai arahan guru.',
            cakap: 'Berlatih menetapkan target pembelajaran untuk dirinya dan berusaha menyelesaikannya tepat waktu.',
            mahir: 'Menetapkan tujuan belajar mandiri, mencapainya secara tuntas, dan berani menanggung konsekuensi tindakannya.'
          },
          SMP: {
            berkembang: 'Menetapkan target belajar dan berusaha mencapainya dengan pemantauan berkala.',
            cakap: 'Mengelola waktu belajar secara disiplin dan menyelesaikan tugas-tugas akademik secara tuntas tanpa diawasi.',
            mahir: 'Menunjukkan akuntabilitas tinggi atas target hidupnya, melakukan evaluasi diri rutin, dan gigih memperbaiki kekurangan.'
          },
          SMA: {
            berkembang: 'Mengambil tanggung jawab atas keputusan akademik dan sosial yang diambilnya.',
            cakap: 'Meregulasi emosi, waktu, dan energi untuk menuntaskan proyek jangka panjang secara profesional.',
            mahir: 'Menunjukkan integritas pribadi paripurna, bertanggung jawab atas dampak sosial pilihannya secara dewasa.'
          },
          SMK: {
            berkembang: 'Menerapkan prosedur keselamatan dan tanggung jawab alat kerja dengan pengawasan.',
            cakap: 'Bertanggung jawab penuh atas kualitas hasil kerja kejuruan sesuai spesifikasi pemesan/industri.',
            mahir: 'Menjamin standar mutu tanpa cacat (*zero defect*) dan bertanggung jawab atas keselamatan kerja timnya.'
          }
        }
      },
      {
        id: 'kepemimpinan',
        nomor: 2,
        nama: 'Kepemimpinan',
        indikator: {
          PAUD: {
            berkembang: 'Menjalankan peran yang diberikan dalam konteks bermain sesuai arahan.',
            cakap: 'Menjalankan peran dalam konteks bermain bermakna dengan percaya diri.',
            mahir: 'Berinisiatif memandu teman dalam aktivitas bermain bersama secara antusias.'
          },
          SD: {
            berkembang: 'Menjalankan peran yang diberikan dalam pembelajaran sesuai instruksi.',
            cakap: 'Menjalankan peran dalam kelompok dengan arahan minimal dan mampu mengarahkan diri sendiri.',
            mahir: 'Berinisiatif memimpin kelompok, mengkoordinasikan tugas rekan tim, dan mengambil peran aktif secara otonom.'
          },
          SMP: {
            berkembang: 'Memotivasi diri sendiri dalam mencapai target yang ditetapkan pendidik.',
            cakap: 'Memimpin kelompok kerja kecil dengan adil, mendengarkan masukan anggota, dan mengambil inisiatif solutif.',
            mahir: 'Menampilkan kepemimpinan transformatif yang menginspirasi, memberdayakan rekan sebaya, dan menyelesaikan konflik tim.'
          },
          SMA: {
            berkembang: 'Menunjukkan kepemimpinan situasional dalam organisasi sekolah atau kepanitiaan.',
            cakap: 'Memimpin tim dengan visi yang jelas, mengorganisasi sumber daya efisien, dan menumbuhkan etos kerja unggul.',
            mahir: 'Melahirkan pemimpin-pemimpin baru, mendelegasikan tanggung jawab secara bijak, dan membawa tim mencapai prestasi puncak.'
          },
          SMK: {
            berkembang: 'Menjalankan peran sebagai ketua regu kerja praktek bengkel secara tertib.',
            cakap: 'Memimpin lini kerja bengkel/laboratorium dengan menegakkan SOP dan disiplin kerja tinggi.',
            mahir: 'Menunjukkan kepemimpinan supervisor industri yang handal, mampu mengelola krisis teknis, dan mengoptimalkan produktivitas.'
          }
        }
      },
      {
        id: 'pengembangan-diri',
        nomor: 3,
        nama: 'Pengembangan Diri',
        indikator: {
          PAUD: {
            berkembang: 'Mengikuti arahan atau mencontoh hal baru dari guru saat bermain.',
            cakap: 'Mencoba hal-hal baru dan berani belajar dari kesalahan saat bermain.',
            mahir: 'Menunjukkan antusiasme tinggi untuk terus belajar keterampilan baru secara mandiri.'
          },
          SD: {
            berkembang: 'Mengenal minat dan bakat sebagai potensi diri dengan bimbingan penuh.',
            cakap: 'Mengenal minat dan bakat serta mengeksplorasi kegiatan pengembangan diri dengan bimbingan.',
            mahir: 'Mengenali kelebihan dan kelemahan diri, bersemangat mencoba tantangan baru, dan merencanakan langkah perbaikan diri.'
          },
          SMP: {
            berkembang: 'Mengidentifikasi potensi diri dan memilih kegiatan ekstrakurikuler yang sesuai minatnya.',
            cakap: 'Menyusun rencana pengembangan diri jangka menengah dan berupaya melatih keterampilannya secara teratur.',
            mahir: 'Menguasai keterampilan metakognitif (belajar bagaimana cara belajar), gigih mengatasi *plateau* belajar, dan berprestasi.'
          },
          SMA: {
            berkembang: 'Mengeksplorasi pilihan jalur karir atau pendidikan tinggi sesuai bakat dan nilai pribadinya.',
            cakap: 'Merancang portofolio karir masa depan dan secara proaktif mengasah kompetensi abad ke-21.',
            mahir: 'Mengaktualisasikan potensi diri secara optimal, berdaya saing global, dan memiliki peta jalan hidup yang jelas.'
          },
          SMK: {
            berkembang: 'Mengikuti pelatihan sertifikasi kompetensi kejuruan dengan pendampingan guru.',
            cakap: 'Mengasah keahlian teknis secara mandiri agar sesuai dengan kebutuhan standar dunia industri (*link and match*).',
            mahir: 'Memperoleh sertifikasi keahlian profesional berstandar nasional/internasional dan siap berkarir/berwirausaha mandiri.'
          }
        }
      }
    ]
  },
  {
    id: 'kesehatan',
    nomor: 7,
    nama: 'Kesehatan',
    singkat: 'Kesehatan',
    deskripsi: 'Mengacu pada individu yang menjalankan pola hidup bersih dan sehat berdasarkan pemahaman tentang kebugaran fisik, stabilitas kesehatan mental, kelestarian lingkungan hidup, serta kepatuhan K3 di dunia kerja.',
    ikon: 'activity',
    warnaBadge: 'bg-teal-100 text-teal-800 border-teal-300',
    subdimensi: [
      {
        id: 'hidup-bersih-sehat',
        nomor: 1,
        nama: 'Hidup Bersih dan Sehat',
        indikator: {
          PAUD: {
            berkembang: 'Mengenal kebiasaan hidup bersih dan sehat (cuci tangan pakai sabun, sikat gigi) dengan pendampingan.',
            cakap: 'Membiasakan diri cuci tangan pakai sabun di air mengalir, menggosok gigi teratur, dan makan makanan bergizi.',
            mahir: 'Membiasakan hidup bersih dan sehat secara mandiri serta mengingatkan teman sebaya.'
          },
          SD: {
            berkembang: 'Mengenal dan mempraktikkan kebiasaan hidup bersih dan memilih makanan sehat dengan pengawasan.',
            cakap: 'Membiasakan diri berperilaku hidup bersih dan sehat secara konsisten serta mengonsumsi makanan bergizi seimbang.',
            mahir: 'Mempraktikkan pola hidup sehat secara mandiri dan mengajak teman sebaya untuk menjaga kebersihan dan kesehatan diri.'
          },
          SMP: {
            berkembang: 'Memahami prinsip gizi seimbang, sanitasi pribadi, dan bahaya zat adiktif dengan bimbingan.',
            cakap: 'Menerapkan pola hidup bersih dan sehat secara konsisten, memilih asupan nutrisi seimbang, dan menjauhi perilaku berisiko.',
            mahir: 'Menjadi teladan perilaku hidup bersih dan sehat (PHBS) di sekolah dan aktif mengedukasi pencegahan penyakit.'
          },
          SMA: {
            berkembang: 'Menganalisis hubungan antara pola makan, gaya hidup modern, dan kesehatan reproduksi/degeneratif.',
            cakap: 'Menjaga kesehatan reproduksi dan gaya hidup sehat secara disiplin serta bebas dari narkoba/rokok.',
            mahir: 'Mengadvokasi gaya hidup sehat holistik di kalangan remaja dan memelopori kampanye kesehatan publik.'
          },
          SMK: {
            berkembang: 'Mengenal standar higienitas dan kesehatan kerja sesuai bidang industrinya.',
            cakap: 'Menerapkan protokol higienitas, pola makan penunjang stamina kerja, dan perilaku hidup sehat di tempat kerja.',
            mahir: 'Mempromosikan budaya kesehatan kerja (*occupational health*) di industri untuk mencegah penyakit akibat kerja.'
          }
        }
      },
      {
        id: 'kebugaran-mental',
        nomor: 2,
        nama: 'Kebugaran, Kesehatan Fisik, dan Kesehatan Mental',
        indikator: {
          PAUD: {
            berkembang: 'Menikmati aktivitas bergerak/bermain fisik dan mulai mengenal emosi senang/sedih.',
            cakap: 'Menjaga kebugaran dengan berolahraga teratur saat bermain dan mampu mengungkapkan perasaan secara aman.',
            mahir: 'Memiliki kelincahan fisik yang prima dan mampu menenangkan diri saat merasa kecewa atau marah.'
          },
          SD: {
            berkembang: 'Mengenali pentingnya kebugaran dengan berolahraga, tidur teratur, dan mulai belajar mengendalikan emosi.',
            cakap: 'Menjaga kebugaran jasmani melalui olahraga teratur, istirahat seimbang, dan mengelola emosi secara positif.',
            mahir: 'Menjaga kebugaran fisik dan kestabilan mental secara konsisten, memiliki daya lenting (*resilience*), dan selalu berpikir positif.'
          },
          SMP: {
            berkembang: 'Mengenali gejala stres akademik dan berusaha mencari bantuan pendampingan yang tepat.',
            cakap: 'Mengelola stres secara konstruktif, memelihara kebugaran jasmani, dan menjaga hubungan sosial yang sehat.',
            mahir: 'Memiliki kecerdasan emosional yang matang, kebugaran kardiorespirasi unggul, dan mampu menjadi pendengar empatik bagi teman.'
          },
          SMA: {
            berkembang: 'Memahami pentingnya *mental health awareness* dan menyeimbangkan tuntutan belajar dengan relaksasi.',
            cakap: 'Menerapkan strategi koping adaptif terhadap tekanan hidup, menjaga stabilitas mental, dan menjaga stamina fisik puncak.',
            mahir: 'Menunjukkan kematangan emosi tinggi, resiliensi terhadap kegagalan, serta menjadi konselor sebaya (*peer counselor*) yang handal.'
          },
          SMK: {
            berkembang: 'Memelihara ketahanan fisik untuk tuntutan kerja praktik dan mengenali batas lelah tubuh.',
            cakap: 'Menjaga stamina fisik prima dan ketahanan mental saat menghadapi beban kerja tinggi di industri.',
            mahir: 'Memiliki ketahanan fisik-mental kerja tingkat tinggi (*industrial endurance*) dan mampu memotivasi tim kerja tetap solid.'
          }
        }
      },
      {
        id: 'kesehatan-lingkungan',
        nomor: 3,
        nama: 'Kesehatan Lingkungan',
        indikator: {
          PAUD: {
            berkembang: 'Mengenal kebiasaan membuang sampah pada tempatnya dengan contoh guru.',
            cakap: 'Ikut serta membersihkan tempat bermain dan merapikan ruangan kelas setelah berkegiatan.',
            mahir: 'Secara spontan memungut sampah yang berserakan dan bangga melihat lingkungan yang asri.'
          },
          SD: {
            berkembang: 'Mengenal pentingnya menjaga kebersihan kelas, sekolah, dan rumah dengan bimbingan.',
            cakap: 'Berperan aktif menjaga kebersihan lingkungan sekolah dan memilah sampah sesuai jenisnya.',
            mahir: 'Menginisiasi gerakan kebersihan lingkungan, merawat sanitasi sekolah, dan peduli terhadap kelestarian ekosistem.'
          },
          SMP: {
            berkembang: 'Memahami dampak polusi dan sanitasi buruk terhadap kesehatan masyarakat.',
            cakap: 'Mempraktikkan pengelolaan sampah (3R: Reduce, Reuse, Recycle) dan menjaga sanitasi lingkungan sekolah.',
            mahir: 'Mengembangkan proyek ramah lingkungan (komposting, biopori) dan memobilisasi warga sekolah menjaga lingkungan asri.'
          },
          SMA: {
            berkembang: 'Menganalisis permasalahan degradasi lingkungan dan resiko epidemiologis di perkotaan/pedesaan.',
            cakap: 'Melakukan aksi mitigasi kesehatan lingkungan dan advokasi sanitasi air bersih serta udara sehat.',
            mahir: 'Menciptakan inovasi teknologi tepat guna untuk sanitasi lingkungan dan memimpin gerakan *zero waste*.'
          },
          SMK: {
            berkembang: 'Membuang limbah bengkel praktik sesuai prosedur dasar penanganan limbah.',
            cakap: 'Mengelola limbah industri (B3 dan non-B3) secara ramah lingkungan sesuai regulasi AMDAL/lingkungan hidup.',
            mahir: 'Mengembangkan sistem pengolahan limbah industri sirkular dan memelopori sertifikasi industri hijau.'
          }
        }
      },
      {
        id: 'k3-dunia-kerja',
        nomor: 4,
        nama: 'Prinsip Keselamatan dan Kesehatan Kerja (K3) (Khusus SMK)',
        indikator: {
          SMK: {
            berkembang: 'Mampu menerapkan prinsip keselamatan dan kesehatan kerja (K3) di lingkungan sekolah dan bengkel namun belum konsisten.',
            cakap: 'Mampu menerapkan prinsip keselamatan dan kesehatan kerja (K3) dan APD di lingkungan sekolah dan dunia kerja secara konsisten.',
            mahir: 'Mampu menjadi teladan, menegakkan disiplin nol kecelakaan (*zero accident*), dan memotivasi rekan kerja dalam kepatuhan K3.'
          }
        }
      }
    ]
  },
  {
    id: 'komunikasi',
    nomor: 8,
    nama: 'Komunikasi',
    singkat: 'Komunikasi',
    deskripsi: 'Mengacu pada individu yang memiliki kemampuan menyerap dan menyampaikan pesan, ide, dan rasa empati secara efektif, santun, dan terstruktur melalui beragam saluran (lisan, teks, visual, digital).',
    ikon: 'message-square',
    warnaBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    subdimensi: [
      {
        id: 'mendengarkan-menyimak',
        nomor: 1,
        nama: 'Mendengarkan / Menyimak',
        indikator: {
          PAUD: {
            berkembang: 'Mendengarkan instruksi singkat guru dengan bimbingan dan kontak mata sederhana.',
            cakap: 'Mendengarkan secara aktif cerita lisan yang singkat dan memberikan reaksi/tanggapan sederhana.',
            mahir: 'Menyimak penuh perhatian, memahami isi pesan lisan, dan mampu menceritakan kembali secara runtut.'
          },
          SD: {
            berkembang: 'Menyimak secara aktif sejumlah teks lisan sederhana untuk mendapatkan informasi eksplisit.',
            cakap: 'Mendengarkan secara aktif teks lisan sederhana untuk mendapatkan informasi eksplisit dan implisit serta memberikan tanggapan relevan.',
            mahir: 'Mendengarkan secara aktif teks lisan, menangkap pesan tersirat secara kritis, dan memberikan respon empatik yang santun.'
          },
          SMP: {
            berkembang: 'Menyimak teks lisan untuk menangkap intisari gagasan pembicara.',
            cakap: 'Mendengarkan secara aktif berbagai teks lisan kompleks, mencatat poin kunci, dan mengajukan pertanyaan klarifikasi yang tepat.',
            mahir: 'Mendengarkan secara analitis dan empatik, mendeteksi nada emosi/tujuan tersembunyi penutur, serta menyimpulkan pesan secara komprehensif.'
          },
          SMA: {
            berkembang: 'Menyimak wacana lisan akademis atau debat publik dengan mencatat argumen utama.',
            cakap: 'Mengevaluasi keabsahan data, argumen, dan retorika penutur dalam wacana lisan formal secara kritis.',
            mahir: 'Menguasai keterampilan menyimak tingkat mahir (*active and reflective listening*) dalam negosiasi dan forum ilmiah internasional.'
          },
          SMK: {
            berkembang: 'Menyimak instruksi kerja teknis dan spesifikasi tugas dari atasan.',
            cakap: 'Mendengarkan instruksi teknis lisan di lingkungan kerja yang bising, mengonfirmasi pemahaman, dan mencatat prosedur krusial.',
            mahir: 'Menginterpretasikan instruksi teknis kompleks dan umpan balik pelanggan industri secara presisi tanpa kesalahan interpretasi.'
          }
        }
      },
      {
        id: 'berbicara',
        nomor: 2,
        nama: 'Berbicara',
        indikator: {
          PAUD: {
            berkembang: 'Menyampaikan keinginan atau cerita dengan kalimat sederhana namun belum runtut.',
            cakap: 'Menyampaikan ide dan perasaan secara lisan dengan kalimat yang jelas dan kosakata yang berkembang.',
            mahir: 'Berbicara lancar, percaya diri, menggunakan kalimat santun, dan mampu memimpin percakapan dengan teman.'
          },
          SD: {
            berkembang: 'Menyampaikan dan menanggapi informasi secara lisan namun belum runtut atau masih ragu-ragu.',
            cakap: 'Menyampaikan informasi secara lisan dengan lafal yang jelas, runtut, lancar, dan cukup efektif.',
            mahir: 'Menyampaikan, menggali, dan menanggapi informasi lisan secara benar, tepat, lancar, terstruktur, dan persuasif.'
          },
          SMP: {
            berkembang: 'Berbicara dalam diskusi kelompok dengan menggunakan bahasa Indonesia yang baik.',
            cakap: 'Menyampaikan presentasi lisan secara terstruktur, percaya diri, menggunakan intonasi tepat, dan menjawab pertanyaan dengan lugas.',
            mahir: 'Menguasai keterampilan retorika publik (*public speaking*), berpidato persuasif, dan memandu forum diskusi secara dinamis.'
          },
          SMA: {
            berkembang: 'Menyampaikan argumen dalam debat atau diskusi formal dengan mempertahankan etika berbahasa.',
            cakap: 'Berbicara secara artikulatif, diplomatis, dan persuasif di depan forum formal dengan penguasaan materi yang mendalam.',
            mahir: 'Menguasai seni diplomasi lisan, negosiasi tingkat tinggi, dan mampu mempengaruhi audiens secara konstruktif.'
          },
          SMK: {
            berkembang: 'Melaporkan kemajuan pekerjaan teknis kepada instruktur dengan istilah yang tepat.',
            cakap: 'Berkomunikasi secara profesional dengan rekan kerja dan klien industri menggunakan bahasa teknis baku.',
            mahir: 'Melakukan presentasi produk kejuruan (*pitching* bisnis) yang memikat calon investor dan melayani keluhan pelanggan secara solutif.'
          }
        }
      },
      {
        id: 'membaca',
        nomor: 3,
        nama: 'Membaca',
        indikator: {
          PAUD: {
            berkembang: 'Mengenal simbol huruf, membaca gambar, dan membalik halaman buku dengan bimbingan.',
            cakap: 'Menunjukkan minat membaca buku cerita bergambar dan mengenali kata-kata bermakna sederhana.',
            mahir: 'Membaca kata dan kalimat sederhana dengan lancar serta menceritakan kembali inti cerita gambar.'
          },
          SD: {
            berkembang: 'Membaca secara aktif sejumlah teks tertulis sederhana yang dipilih untuk mendapatkan informasi eksplisit.',
            cakap: 'Membaca aktif sejumlah teks tertulis sederhana untuk mendapatkan informasi eksplisit, implisit, dan memberi tanggapan.',
            mahir: 'Membaca aktif beragam teks tertulis, memahami pesan tersurat dan tersirat, serta memberikan tanggapan kritis dan terstruktur.'
          },
          SMP: {
            berkembang: 'Membaca teks informasional dan sastra untuk menemukan pokok pikiran paragraf.',
            cakap: 'Membaca memindai dan membaca intensif untuk menyintesis informasi dari berbagai sumber bacaan terpercaya.',
            mahir: 'Membaca kritis (*critical reading*), membedakan fakta dan opini, mendeteksi bias penulis, dan memetik hikmah mendalam.'
          },
          SMA: {
            berkembang: 'Membaca literatur ilmiah dan teks analitis dengan mengidentifikasi kerangka konseptualnya.',
            cakap: 'Menganalisis dan menyintesis artikel ilmiah, jurnal, dan karya sastra klasik secara mandiri dan komparatif.',
            mahir: 'Menguasai literasi wacana kritis tingkat lanjut, mengevaluasi validitas metodologi riset bacaan, dan menyusun telaah kepustakaan.'
          },
          SMK: {
            berkembang: 'Membaca diagram alur kerja (*flowchart*) dan buku manual kejuruan dasar.',
            cakap: 'Membaca dan menafsirkan *blueprint*, gambar teknik, skema kelistrikan, dan manual teknis industri secara tepat.',
            mahir: 'Menganalisis dokumen spesifikasi teknik internasional (*datasheet*) berbahasa asing dan mengaplikasikannya dalam pekerjaan.'
          }
        }
      },
      {
        id: 'menulis',
        nomor: 4,
        nama: 'Menulis',
        indikator: {
          PAUD: {
            berkembang: 'Menirukan coretan bermakna atau menjiplak huruf sederhana dengan bimbingan motorik.',
            cakap: 'Menulis nama diri dan kata-kata sederhana yang dikenalnya menggunakan huruf yang mudah dibaca.',
            mahir: 'Menulis kalimat sederhana untuk mengungkapkan ide atau pesan kartu ucapan secara kreatif.'
          },
          SD: {
            berkembang: 'Menyampaikan informasi secara tertulis melalui teks sederhana namun tata bahasa dan ejaan belum tepat.',
            cakap: 'Menyampaikan informasi secara tertulis melalui teks sederhana dengan kaidah ejaan yang tepat, lancar, dan terstruktur.',
            mahir: 'Menyampaikan informasi tertulis melalui berbagai jenis teks (naratif, deskriptif, eksplanasi) secara benar, lancar, dan menarik pembaca.'
          },
          SMP: {
            berkembang: 'Menulis paragraf terpadu dengan kohesi dan koherensi yang memadai.',
            cakap: 'Menulis teks fiksi dan nonfiksi yang terstruktur rapi, menggunakan kosakata variatif dan ejaan yang disempurnakan (EYD).',
            mahir: 'Menulis esai argumentatif dan karya sastra kreatif yang memiliki kedalaman pesan dan gaya bahasa personal yang kuat.'
          },
          SMA: {
            berkembang: 'Menulis karya tulis ilmiah sederhana dengan mengikuti pedoman penulisan akademis.',
            cakap: 'Menulis karya tulis ilmiah, artikel opini, atau laporan penelitian yang argumentatif, sistematis, dan bebas plagiarisme.',
            mahir: 'Menulis publikasi ilmiah atau karya tulis profesional yang siap diterbitkan di media massa atau prosiding ilmiah.'
          },
          SMK: {
            berkembang: 'Menulis laporan harian praktik kerja bengkel sesuai format standar.',
            cakap: 'Menyusun laporan teknis berkala, dokumen berita acara, dan dokumentasi pekerjaan kejuruan secara komprehensif.',
            mahir: 'Menyusun proposal proyek industri (*tender proposal*), dokumen SOP teknis, dan portofolio kejuruan berstandar korporat.'
          }
        }
      }
    ]
  }
];

// Helper Utilities

export function getDimensiProfilLulusanList(): DimensiProfilLulusan[] {
  return DIMENSI_PROFIL_LULUSAN;
}

export function getDimensiById(id: string): DimensiProfilLulusan | undefined {
  return DIMENSI_PROFIL_LULUSAN.find(d => d.id === id || d.nomor === Number(id));
}

export function getSubdimensiList(dimensiId: string): SubdimensiProfilLulusan[] {
  const dim = getDimensiById(dimensiId);
  return dim ? dim.subdimensi : [];
}

export function getIndikatorByJenjang(
  dimensiId: string,
  subdimensiId: string,
  jenjang: JenjangPendidikan = 'SD'
): IndikatorTahap | undefined {
  const dim = getDimensiById(dimensiId);
  if (!dim) return undefined;
  const sub = dim.subdimensi.find(s => s.id === subdimensiId || s.nomor === Number(subdimensiId));
  if (!sub) return undefined;
  return sub.indikator[jenjang];
}

/**
 * Format string daftar 8 dimensi untuk prompt AI
 */
export function buildPromptProfilLulusanContext(jenjang: JenjangPendidikan = 'SD'): string {
  let out = `STANDAR 8 DIMENSI PROFIL LULUSAN (SK BSKAP No. 058/H/KR/2025 & Permendikdasmen No. 13/2025):\n`;
  out += `Perhatian: Nomenklatur "Projek P5" resmi digantikan dengan "Profil Lulusan (8 Dimensi)" dengan 3 tahapan perkembangan: Berkembang, Cakap (Standar Kelulusan/SKL), dan Mahir (Melampaui Standar).\n\n`;

  DIMENSI_PROFIL_LULUSAN.forEach(d => {
    out += `${d.nomor}. Dimensi ${d.nama}:\n`;
    out += `   Fokus: ${d.deskripsi}\n`;
    out += `   Subdimensi: ${d.subdimensi.map(s => s.nama).join(', ')}\n`;
  });

  return out;
}
