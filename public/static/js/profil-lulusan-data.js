/**
 * Client-Side Master Data: 8 Dimensi Profil Lulusan
 * Berdasarkan SK Kepala BSKAP No. 058/H/KR/2025 & Permendikdasmen No. 13/2025
 * Menggantikan Projek P5 (6 Dimensi)
 */

window.DIMENSI_PROFIL_LULUSAN = [
  {
    id: 'keimanan-ketakwaan',
    nomor: 1,
    nama: 'Keimanan dan Ketakwaan terhadap Tuhan YME',
    singkat: 'Keimanan & Ketakwaan',
    deskripsi: 'Keyakinan teguh, pengamalan ajaran agama, akhlak mulia, hubungan harmonis dengan Tuhan, sesama manusia, dan alam.',
    ikon: 'bi-heart-fill',
    warna: 'emerald',
    subdimensi: [
      'Hubungan dengan Tuhan Yang Maha Esa',
      'Hubungan dengan sesama Manusia',
      'Hubungan dengan Lingkungan Alam'
    ]
  },
  {
    id: 'kewargaan',
    nomor: 2,
    nama: 'Kewargaan',
    singkat: 'Kewargaan',
    deskripsi: 'Cinta tanah air, kepatuhan norma/hukum, wawasan kebangsaan dan global, serta pelestarian budaya.',
    ikon: 'bi-flag-fill',
    warna: 'rose',
    subdimensi: [
      'Kewargaan Lokal',
      'Kewargaan Nasional',
      'Kewargaan Global'
    ]
  },
  {
    id: 'penalaran-kritis',
    nomor: 3,
    nama: 'Penalaran Kritis',
    singkat: 'Penalaran Kritis',
    deskripsi: 'Berpikir logis, analitis, reflektif, memilah fakta/opini, pengambilan keputusan rasional, dan pemecahan masalah.',
    ikon: 'bi-lightbulb-fill',
    warna: 'blue',
    subdimensi: [
      'Penyampaian Argumentasi',
      'Pengambilan Keputusan',
      'Penyelesaian Masalah'
    ]
  },
  {
    id: 'kreativitas',
    nomor: 4,
    nama: 'Kreativitas',
    singkat: 'Kreativitas',
    deskripsi: 'Menghasilkan gagasan baru, orisinalitas ide, fleksibilitas berpikir alternatif, serta karya dan tindakan inovatif.',
    ikon: 'bi-palette-fill',
    warna: 'amber',
    subdimensi: [
      'Gagasan Baru',
      'Fleksibilitas Berpikir',
      'Karya'
    ]
  },
  {
    id: 'kolaborasi',
    nomor: 5,
    nama: 'Kolaborasi',
    singkat: 'Kolaborasi',
    deskripsi: 'Peduli sesama, kesediaan berbagi peran/sumber daya, kerja sama sinergis (gotong royong) dalam tim.',
    ikon: 'bi-people-fill',
    warna: 'indigo',
    subdimensi: [
      'Peduli',
      'Berbagi',
      'Kerja sama'
    ]
  },
  {
    id: 'kemandirian',
    nomor: 6,
    nama: 'Kemandirian',
    singkat: 'Kemandirian',
    deskripsi: 'Tanggung jawab atas belajar dan tindakan, regulasi diri, inisiatif kepemimpinan otonom, dan pengembangan potensi.',
    ikon: 'bi-compass-fill',
    warna: 'purple',
    subdimensi: [
      'Bertanggung Jawab',
      'Kepemimpinan',
      'Pengembangan Diri'
    ]
  },
  {
    id: 'kesehatan',
    nomor: 7,
    nama: 'Kesehatan',
    singkat: 'Kesehatan (Baru)',
    deskripsi: 'Pola hidup bersih dan sehat, kebugaran fisik, stabilitas kesehatan mental, dan sanitasi kesehatan lingkungan.',
    ikon: 'bi-activity',
    warna: 'teal',
    isNew: true,
    subdimensi: [
      'Hidup Bersih dan Sehat',
      'Kebugaran, Kesehatan Fisik, dan Kesehatan Mental',
      'Kesehatan Lingkungan'
    ]
  },
  {
    id: 'komunikasi',
    nomor: 8,
    nama: 'Komunikasi',
    singkat: 'Komunikasi (Baru)',
    deskripsi: 'Kemampuan menyerap dan menyampaikan ide secara santun, efektif, dan empatik melalui menyimak, berbicara, membaca, dan menulis.',
    ikon: 'bi-chat-dots-fill',
    warna: 'cyan',
    isNew: true,
    subdimensi: [
      'Mendengarkan / Menyimak',
      'Berbicara',
      'Membaca',
      'Menulis'
    ]
  }
];

window.TAHAP_PERKEMBANGAN_PROFIL = [
  { id: 'berkembang', label: 'Berkembang', desc: 'Menuju Standar (Masih memerlukan bimbingan guru)' },
  { id: 'cakap', label: 'Cakap', desc: 'Standar Kelulusan / SKL (Konsisten & Memenuhi Kriteria Standar)' },
  { id: 'mahir', label: 'Mahir', desc: 'Melampaui Standar (Inisiatif Mandiri, Reflektif & Menjadi Teladan)' }
];
