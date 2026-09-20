/**
 * Kalender Pendidikan & Engine Kegiatan Sekolah (KPSP)
 * Acuan:
 * 1. Regulasi Pusat: Permendikdasmen No. 13 Tahun 2025, Permendikbudristek No. 12 Tahun 2024, SKB 3 Menteri
 * 2. Regulasi Disdik Purwakarta: Surat Edaran Kadisdik No. 400.3.5/2367-Dikdas/2026
 * 3. Muatan Lokal & Karakter: 7 Poé Atikan Purwakarta Istimewa (Perbup No. 69/2015) & TdBA (Perbup No. 103/2021)
 */

export interface KaldikEventItem {
  id?: string;
  tanggalMulai: string; // YYYY-MM-DD
  tanggalSelesai?: string; // YYYY-MM-DD (opsional jika 1 hari)
  judul: string;
  kategori: 'keagamaan' | 'purwakarta' | 'nasional' | 'asesmen' | 'libur' | 'sekolah';
  keterangan?: string;
  warnaHex?: string;
  badgeLabel?: string;
}

export interface DayCellData {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Minggu) s.d. 6 (Sabtu)
  isEffectiveKbm: boolean;
  status: 'KBM' | 'LBR' | 'PHBI' | 'PWK' | 'NAS' | 'STS' | 'SAS' | 'ASAT' | 'PSAJ' | 'MPLS' | 'RPT';
  events: KaldikEventItem[];
  colorHex: string;
}

export interface MonthGridData {
  monthIndex: number; // 0..11
  monthName: string; // "Juli 2026"
  year: number;
  monthNum: number; // 1..12
  semester: 1 | 2;
  weeks: (DayCellData | null)[][]; // 5 to 6 weeks, each 7 days (Senin s.d. Minggu)
  pekanEfektif: number;
  pekanTidakEfektif: number;
  hariEfektif: number;
  hariLibur: number;
  agendaList: KaldikEventItem[];
}

export interface KaldikStatistics {
  tahunAjaran: string;
  sistemHariSekolah: '5-hari' | '6-hari';
  totalPekanEfektifSmt1: number;
  totalPekanEfektifSmt2: number;
  totalPekanEfektifTahun: number;
  totalHariEfektifKbm: number;
  totalHariLibur: number;
  totalAgendaKeagamaan: number;
  totalAgendaSekolah: number;
  dasarHukumPusat: string[];
  dasarHukumPurwakarta: string[];
}

/**
 * Daftar Resmi Agenda Kalender Pendidikan Tahun Ajaran 2026/2027
 * Mengintegrasikan Hari Libur Nasional, Disdik Purwakarta, dan PHBI Keagamaan (Maulid Nabi, Rajaban, dll.)
 */
export const OFFICIAL_KALDIK_EVENTS_2026_2027: KaldikEventItem[] = [
  // SEMESTER 1 (GANJIL)
  {
    tanggalMulai: '2026-07-01',
    tanggalSelesai: '2026-07-10',
    judul: 'Libur Akhir Tahun Ajaran 2025/2026',
    kategori: 'libur',
    keterangan: 'Libur kenaikan kelas dan persiapan tahun ajaran baru',
    warnaHex: '#CBD5E1',
    badgeLabel: 'Libur TP'
  },
  {
    tanggalMulai: '2026-07-13',
    tanggalSelesai: '2026-07-17',
    judul: 'Masa Pengenalan Lingkungan Sekolah (MPLS) Ramah Anak',
    kategori: 'purwakarta',
    keterangan: 'MPLS transisi PAUD-SD menyenangkan dan ramah anak Purwakarta',
    warnaHex: '#BAE6FD',
    badgeLabel: 'MPLS'
  },
  {
    tanggalMulai: '2026-07-20',
    tanggalSelesai: '2026-07-20',
    judul: 'Peringatan Hari Jadi Purwakarta (HJP ke-195 / Kabupaten ke-58)',
    kategori: 'purwakarta',
    keterangan: 'Pawai budaya & penguatan identitas karakter 7 Poé Atikan Purwakarta',
    warnaHex: '#F472B6',
    badgeLabel: 'HJP'
  },
  {
    tanggalMulai: '2026-08-14',
    tanggalSelesai: '2026-08-14',
    judul: 'Peringatan Hari Pramuka Nasional ke-65',
    kategori: 'nasional',
    keterangan: 'Upacara Pramuka dan apel besar kepanduan di sekolah',
    warnaHex: '#86EFAC',
    badgeLabel: 'Pramuka'
  },
  {
    tanggalMulai: '2026-08-17',
    tanggalSelesai: '2026-08-17',
    judul: 'HUT Proklamasi Kemerdekaan Republik Indonesia ke-81',
    kategori: 'nasional',
    keterangan: 'Upacara bendera dan lomba kemerdekaan siswa',
    warnaHex: '#FDA4AF',
    badgeLabel: 'HUT RI'
  },
  {
    tanggalMulai: '2026-08-25',
    tanggalSelesai: '2026-08-25',
    judul: 'Peringatan Maulid Nabi Muhammad SAW (12 Rabiul Awal 1448 H)',
    kategori: 'keagamaan',
    keterangan: 'Peringatan Hari Besar Islam (PHBI): Tabligh & lomba islami murid',
    warnaHex: '#6EE7B7',
    badgeLabel: 'Maulid'
  },
  {
    tanggalMulai: '2026-09-07',
    tanggalSelesai: '2026-09-07',
    judul: 'Peringatan Hari Udara Bersih Internasional (Gerakan TdBA)',
    kategori: 'purwakarta',
    keterangan: 'Aksi penanaman pohon dan pengurangan emisi di lingkungan sekolah',
    warnaHex: '#93C5FD',
    badgeLabel: 'Udara Bersih'
  },
  {
    tanggalMulai: '2026-09-18',
    tanggalSelesai: '2026-09-18',
    judul: 'Peringatan Hari Bambu Sedunia (World Bamboo Day - TdBA)',
    kategori: 'purwakarta',
    keterangan: 'Edukasi pemanfaatan bambu & kerajinan anyaman khas Sunda Purwakarta',
    warnaHex: '#6EE7B7',
    badgeLabel: 'Hari Bambu'
  },
  {
    tanggalMulai: '2026-09-21',
    tanggalSelesai: '2026-09-25',
    judul: 'Prakiraan Asesmen Sumatif Tengah Semester (STS) Ganjil',
    kategori: 'asesmen',
    keterangan: 'Penilaian capaian kompetensi tengah semester ganjil',
    warnaHex: '#FEF08A',
    badgeLabel: 'STS Ganjil'
  },
  {
    tanggalMulai: '2026-10-01',
    tanggalSelesai: '2026-10-01',
    judul: 'Peringatan Hari Kesaktian Pancasila',
    kategori: 'nasional',
    keterangan: 'Upacara penguatan Profil Lulusan & nilai-nilai Pancasila',
    warnaHex: '#FED7AA',
    badgeLabel: 'Pancasila'
  },
  {
    tanggalMulai: '2026-10-28',
    tanggalSelesai: '2026-10-28',
    judul: 'Peringatan Hari Sumpah Pemuda ke-98',
    kategori: 'nasional',
    keterangan: 'Apel pemuda dan penguatan literasi bahasa persatuan',
    warnaHex: '#FED7AA',
    badgeLabel: 'Sumpah Pemuda'
  },
  {
    tanggalMulai: '2026-11-10',
    tanggalSelesai: '2026-11-10',
    judul: 'Peringatan Hari Pahlawan Nasional',
    kategori: 'nasional',
    keterangan: 'Mengheningkan cipta dan keteladanan perjuangan pahlawan',
    warnaHex: '#FED7AA',
    badgeLabel: 'Pahlawan'
  },
  {
    tanggalMulai: '2026-11-25',
    tanggalSelesai: '2026-11-25',
    judul: 'Hari Guru Nasional (HGN) & HUT PGRI ke-81',
    kategori: 'sekolah',
    keterangan: 'Apresiasi pendidik dan refleksi Komunitas Belajar (Kombel)',
    warnaHex: '#C4B5FD',
    badgeLabel: 'Hari Guru'
  },
  {
    tanggalMulai: '2026-11-30',
    tanggalSelesai: '2026-12-11',
    judul: 'Penilaian Sumatif Akhir Semester (SAS) Ganjil',
    kategori: 'asesmen',
    keterangan: 'Asesmen sumatif akhir semester 1 seluruh tingkat kelas',
    warnaHex: '#E9D5FF',
    badgeLabel: 'SAS Ganjil'
  },
  {
    tanggalMulai: '2026-12-14',
    tanggalSelesai: '2026-12-18',
    judul: 'Pengolahan Nilai, Remedial & Pekan Olahraga/Classmeeting',
    kategori: 'sekolah',
    keterangan: 'Penyelesaian nilai e-Rapor dan perlombaan antarkelas siswa',
    warnaHex: '#CCFBF1',
    badgeLabel: 'Pengolahan/Porseni'
  },
  {
    tanggalMulai: '2026-12-21',
    tanggalSelesai: '2026-12-21',
    judul: 'Titimangsa Resmi Buku Rapor Semester 1',
    kategori: 'asesmen',
    keterangan: 'Tanggal resmi penetapan rapor semester ganjil Disdik Purwakarta',
    warnaHex: '#99F6E4',
    badgeLabel: 'Titimangsa Smt 1'
  },
  {
    tanggalMulai: '2026-12-22',
    tanggalSelesai: '2026-12-23',
    judul: 'Pembagian Buku Laporan Hasil Belajar (Rapor) Semester 1',
    kategori: 'sekolah',
    keterangan: 'Pertemuan orang tua murid dan konsultasi perkembangan anak',
    warnaHex: '#A7F3D0',
    badgeLabel: 'Bagi Rapor Smt 1'
  },
  {
    tanggalMulai: '2026-12-24',
    tanggalSelesai: '2026-12-25',
    judul: 'Hari Raya Natal & Cuti Bersama',
    kategori: 'keagamaan',
    keterangan: 'Hari Libur Nasional Keagamaan',
    warnaHex: '#FCA5A5',
    badgeLabel: 'Natal'
  },
  {
    tanggalMulai: '2026-12-28',
    tanggalSelesai: '2027-01-08',
    judul: 'Libur Akhir Semester 1 (Ganjil) TP 2026/2027',
    kategori: 'libur',
    keterangan: 'Libur semester ganjil bagi peserta didik',
    warnaHex: '#CBD5E1',
    badgeLabel: 'Libur Smt 1'
  },

  // SEMESTER 2 (GENAP)
  {
    tanggalMulai: '2027-01-01',
    tanggalSelesai: '2027-01-01',
    judul: 'Tahun Baru Masehi 2027',
    kategori: 'nasional',
    keterangan: 'Hari Libur Nasional',
    warnaHex: '#FCA5A5',
    badgeLabel: 'Tahun Baru'
  },
  {
    tanggalMulai: '2027-01-11',
    tanggalSelesai: '2027-01-11',
    judul: 'Hari Pertama Masuk KBM Semester 2 (Genap)',
    kategori: 'sekolah',
    keterangan: 'Awal kegiatan belajar mengajar semester genap',
    warnaHex: '#93C5FD',
    badgeLabel: 'Masuk Smt 2'
  },
  {
    tanggalMulai: '2027-02-05',
    tanggalSelesai: '2027-02-05',
    judul: 'Peringatan Isra Mi\'raj Nabi Muhammad SAW / Rajaban (27 Rajab 1448 H)',
    kategori: 'keagamaan',
    keterangan: 'Peringatan Hari Besar Islam: Penguatan nilai Sholat 5 Waktu & Akhlak',
    warnaHex: '#6EE7B7',
    badgeLabel: 'Rajaban'
  },
  {
    tanggalMulai: '2027-02-08',
    tanggalSelesai: '2027-02-10',
    judul: 'Prakiraan Libur Awal Ramadhan 1448 H',
    kategori: 'keagamaan',
    keterangan: 'Libur awal puasa Ramadhan sesuai Kaldik Disdik Purwakarta',
    warnaHex: '#CBD5E1',
    badgeLabel: 'Awal Ramadhan'
  },
  {
    tanggalMulai: '2027-02-11',
    tanggalSelesai: '2027-03-05',
    judul: 'Program Pembiasaan Karakter "Masantren di Sakola" Ramadhan 1448 H',
    kategori: 'keagamaan',
    keterangan: 'Pendalaman Al-Qur\'an, tadarus, infaq berkah, dan amaliyah Ramadhan',
    warnaHex: '#A7F3D0',
    badgeLabel: 'Masantren Ramadhan'
  },
  {
    tanggalMulai: '2027-03-08',
    tanggalSelesai: '2027-03-12',
    judul: 'Prakiraan Libur Hari Raya Idul Fitri 1448 H & Hari Suci Nyepi',
    kategori: 'keagamaan',
    keterangan: 'Hari Libur Nasional & Cuti Bersama Idul Fitri 1 Syawal 1448 H',
    warnaHex: '#FCA5A5',
    badgeLabel: 'Idul Fitri'
  },
  {
    tanggalMulai: '2027-03-22',
    tanggalSelesai: '2027-03-26',
    judul: 'Prakiraan Asesmen Sumatif Tengah Semester (STS) Genap',
    kategori: 'asesmen',
    keterangan: 'Penilaian capaian kompetensi tengah semester genap',
    warnaHex: '#FEF08A',
    badgeLabel: 'STS Genap'
  },
  {
    tanggalMulai: '2027-04-21',
    tanggalSelesai: '2027-04-21',
    judul: 'Peringatan Hari Kartini',
    kategori: 'nasional',
    keterangan: 'Parade busana nusantara dan apresiasi emansipasi pendidikan',
    warnaHex: '#FED7AA',
    badgeLabel: 'Kartini'
  },
  {
    tanggalMulai: '2027-05-01',
    tanggalSelesai: '2027-05-01',
    judul: 'Hari Buruh Internasional',
    kategori: 'nasional',
    keterangan: 'Hari Libur Nasional',
    warnaHex: '#FCA5A5',
    badgeLabel: 'Hari Buruh'
  },
  {
    tanggalMulai: '2027-05-02',
    tanggalSelesai: '2027-05-02',
    judul: 'Hari Pendidikan Nasional (Hardiknas)',
    kategori: 'nasional',
    keterangan: 'Upacara bendera & refleksi filosofi pendidikan Ki Hajar Dewantara',
    warnaHex: '#BAE6FD',
    badgeLabel: 'Hardiknas'
  },
  {
    tanggalMulai: '2027-05-06',
    tanggalSelesai: '2027-05-06',
    judul: 'Kenaikan Yesus Kristus',
    kategori: 'keagamaan',
    keterangan: 'Hari Libur Nasional',
    warnaHex: '#FCA5A5',
    badgeLabel: 'Kenaikan'
  },
  {
    tanggalMulai: '2027-05-10',
    tanggalSelesai: '2027-05-15',
    judul: 'Penilaian Sumatif Akhir Jenjang (PSAJ) Khusus Kelas 6 SD',
    kategori: 'asesmen',
    keterangan: 'Asesmen kelulusan satuan pendidikan jenjang akhir SD',
    warnaHex: '#E9D5FF',
    badgeLabel: 'PSAJ Kls 6'
  },
  {
    tanggalMulai: '2027-05-17',
    tanggalSelesai: '2027-05-17',
    judul: 'Hari Raya Idul Adha 1448 H (Qurban di Sekolah)',
    kategori: 'keagamaan',
    keterangan: 'Hari Libur Nasional & latihan ibadah qurban kepedulian sosial',
    warnaHex: '#6EE7B7',
    badgeLabel: 'Idul Adha'
  },
  {
    tanggalMulai: '2027-05-20',
    tanggalSelesai: '2027-05-20',
    judul: 'Hari Kebangkitan Nasional / Hari Raya Waisak',
    kategori: 'nasional',
    keterangan: 'Hari Libur Nasional',
    warnaHex: '#FCA5A5',
    badgeLabel: 'Waisak'
  },
  {
    tanggalMulai: '2027-06-01',
    tanggalSelesai: '2027-06-01',
    judul: 'Hari Lahir Pancasila',
    kategori: 'nasional',
    keterangan: 'Hari Libur Nasional',
    warnaHex: '#FCA5A5',
    badgeLabel: 'Pancasila'
  },
  {
    tanggalMulai: '2027-06-07',
    tanggalSelesai: '2027-06-18',
    judul: 'Penilaian Sumatif Akhir Tahun (ASAT) Kenaikan Kelas',
    kategori: 'asesmen',
    keterangan: 'Asesmen kenaikan kelas terstandar Fase A, B, dan C',
    warnaHex: '#E9D5FF',
    badgeLabel: 'ASAT'
  },
  {
    tanggalMulai: '2027-06-21',
    tanggalSelesai: '2027-06-23',
    judul: 'Pengolahan Nilai & Gelar Karya Pentas Seni Profil Lulusan / P5',
    kategori: 'sekolah',
    keterangan: 'Festival panen hasil karya siswa, pameran TdBA, dan unjuk kebolehan',
    warnaHex: '#CCFBF1',
    badgeLabel: 'Pentas Seni / P5'
  },
  {
    tanggalMulai: '2027-06-24',
    tanggalSelesai: '2027-06-24',
    judul: 'Titimangsa Resmi Buku Rapor Semester 2',
    kategori: 'asesmen',
    keterangan: 'Tanggal resmi penetapan rapor kenaikan kelas Disdik Purwakarta',
    warnaHex: '#99F6E4',
    badgeLabel: 'Titimangsa Smt 2'
  },
  {
    tanggalMulai: '2027-06-25',
    tanggalSelesai: '2027-06-25',
    judul: 'Pembagian Buku Laporan Hasil Belajar (Rapor) Kenaikan Kelas',
    kategori: 'sekolah',
    keterangan: 'Pemberian apresiasi prestasi siswa dan penyerahan buku rapor',
    warnaHex: '#A7F3D0',
    badgeLabel: 'Bagi Rapor Smt 2'
  },
  {
    tanggalMulai: '2027-06-28',
    tanggalSelesai: '2027-07-09',
    judul: 'Libur Akhir Tahun Ajaran 2026/2027',
    kategori: 'libur',
    keterangan: 'Libur akhir tahun ajaran / libur kenaikan kelas',
    warnaHex: '#CBD5E1',
    badgeLabel: 'Libur TP'
  }
];

/**
 * Daftar Bulan Resmi Kalender Pendidikan Sekolah (Juli s.d. Juni)
 */
export const MONTH_CONFIGS = [
  { monthNum: 7, year: 2026, name: 'Juli 2026', semester: 1 as const },
  { monthNum: 8, year: 2026, name: 'Agustus 2026', semester: 1 as const },
  { monthNum: 9, year: 2026, name: 'September 2026', semester: 1 as const },
  { monthNum: 10, year: 2026, name: 'Oktober 2026', semester: 1 as const },
  { monthNum: 11, year: 2026, name: 'November 2026', semester: 1 as const },
  { monthNum: 12, year: 2026, name: 'Desember 2026', semester: 1 as const },
  { monthNum: 1, year: 2027, name: 'Januari 2027', semester: 2 as const },
  { monthNum: 2, year: 2027, name: 'Februari 2027', semester: 2 as const },
  { monthNum: 3, year: 2027, name: 'Maret 2027', semester: 2 as const },
  { monthNum: 4, year: 2027, name: 'April 2027', semester: 2 as const },
  { monthNum: 5, year: 2027, name: 'Mei 2027', semester: 2 as const },
  { monthNum: 6, year: 2027, name: 'Juni 2027', semester: 2 as const },
];

/**
 * Menggabungkan agenda bawaan resmi dengan agenda kustom yang ditambahkan sekolah
 */
export function mergeKaldikEvents(
  customEvents: KaldikEventItem[] = [],
  includeDefaults: boolean = true
): KaldikEventItem[] {
  const base = includeDefaults ? [...OFFICIAL_KALDIK_EVENTS_2026_2027] : [];
  if (!Array.isArray(customEvents) || customEvents.length === 0) return base;

  // Gabungkan dan urutkan berdasarkan tanggal mulai
  const merged = [...base, ...customEvents];
  merged.sort((a, b) => a.tanggalMulai.localeCompare(b.tanggalMulai));
  return merged;
}

/**
 * Helper untuk mengecek apakah suatu tanggal berada dalam rentang event
 */
export function isDateInEvent(dateStr: string, ev: KaldikEventItem): boolean {
  const start = ev.tanggalMulai;
  const end = ev.tanggalSelesai || ev.tanggalMulai;
  return dateStr >= start && dateStr <= end;
}

/**
 * Membangun matriks kalender 12 bulan (Juli s.d. Juni) dengan penentuan status hari,
 * jam efektif, dan alokasi pekan efektif sesuai Surat Edaran Disdik Purwakarta.
 */
export function generate12MonthGrid(
  events: KaldikEventItem[] = OFFICIAL_KALDIK_EVENTS_2026_2027,
  options: { sistemHariSekolah?: '5-hari' | '6-hari' } = {}
): MonthGridData[] {
  const is5Hari = options.sistemHariSekolah !== '6-hari';

  return MONTH_CONFIGS.map((cfg, mIdx) => {
    const daysInMonth = new Date(cfg.year, cfg.monthNum, 0).getDate();
    const weeks: (DayCellData | null)[][] = [];
    let currentWeek: (DayCellData | null)[] = [];

    // Hari pertama dalam bulan (0: Minggu, 1: Senin, ..., 6: Sabtu)
    const firstDayJs = new Date(cfg.year, cfg.monthNum - 1, 1).getDay();
    // Konversi ke format Senin (0) s.d. Minggu (6)
    const firstDayIndex = (firstDayJs + 6) % 7;

    // Isi cell kosong sebelum tanggal 1
    for (let i = 0; i < firstDayIndex; i++) {
      currentWeek.push(null);
    }

    let hariEfektifCount = 0;
    let hariLiburCount = 0;
    const monthAgendaList: KaldikEventItem[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayJs = new Date(cfg.year, cfg.monthNum - 1, day).getDay();
      const dateStr = `${cfg.year}-${String(cfg.monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Deteksi hari Minggu (selalu libur) atau Sabtu (libur jika 5 hari sekolah)
      const isWeekend = is5Hari ? (dayJs === 0 || dayJs === 6) : (dayJs === 0);

      // Cari agenda yang aktif pada tanggal ini
      const matchingEvents = events.filter(ev => isDateInEvent(dateStr, ev));
      matchingEvents.forEach(ev => {
        if (!monthAgendaList.some(ma => ma.judul === ev.judul)) {
          monthAgendaList.push(ev);
        }
      });

      // Tentukan status dan warna
      let status: DayCellData['status'] = 'KBM';
      let colorHex = '#F8FAFC'; // Default KBM
      let isEffectiveKbm = !isWeekend;

      if (isWeekend) {
        status = 'LBR';
        colorHex = '#E2E8F0';
        isEffectiveKbm = false;
        hariLiburCount++;
      } else if (matchingEvents.length > 0) {
        const topEvent = matchingEvents[0];
        if (topEvent.kategori === 'libur') {
          status = 'LBR';
          colorHex = topEvent.warnaHex || '#CBD5E1';
          isEffectiveKbm = false;
          hariLiburCount++;
        } else if (topEvent.kategori === 'keagamaan') {
          // Jika libur hari besar keagamaan nasional
          if (topEvent.judul.toLowerCase().includes('hari raya') || topEvent.judul.toLowerCase().includes('libur')) {
            status = 'PHBI';
            colorHex = '#FCA5A5';
            isEffectiveKbm = false;
            hariLiburCount++;
          } else {
            // Peringatan keagamaan di sekolah (tetap hari efektif berkarakter)
            status = 'PHBI';
            colorHex = topEvent.warnaHex || '#BBF7D0';
            isEffectiveKbm = true;
            hariEfektifCount++;
          }
        } else if (topEvent.kategori === 'asesmen') {
          if (topEvent.badgeLabel?.includes('STS')) status = 'STS';
          else if (topEvent.badgeLabel?.includes('SAS')) status = 'SAS';
          else if (topEvent.badgeLabel?.includes('ASAT')) status = 'ASAT';
          else if (topEvent.badgeLabel?.includes('PSAJ')) status = 'PSAJ';
          else status = 'STS';
          colorHex = topEvent.warnaHex || '#FEF08A';
          isEffectiveKbm = false; // Pekan asesmen dipisahkan dari KBM reguler
        } else if (topEvent.kategori === 'purwakarta') {
          status = topEvent.badgeLabel === 'MPLS' ? 'MPLS' : 'PWK';
          colorHex = topEvent.warnaHex || '#BAE6FD';
          isEffectiveKbm = topEvent.badgeLabel !== 'MPLS';
          if (isEffectiveKbm) hariEfektifCount++;
        } else {
          status = 'NAS';
          colorHex = topEvent.warnaHex || '#FED7AA';
          if (!topEvent.judul.toLowerCase().includes('libur')) {
            isEffectiveKbm = true;
            hariEfektifCount++;
          } else {
            isEffectiveKbm = false;
            hariLiburCount++;
          }
        }
      } else {
        hariEfektifCount++;
      }

      currentWeek.push({
        dayNumber: day,
        dateStr,
        dayOfWeek: dayJs,
        isEffectiveKbm,
        status,
        events: matchingEvents,
        colorHex
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    // Hitung pekan efektif berdasarkan aturan Disdik Purwakarta:
    // Minimal 3 hari KBM efektif dalam satu pekan kalender
    let pekanEfektif = 0;
    weeks.forEach(w => {
      const kbmDaysInWeek = w.filter(c => c && c.isEffectiveKbm).length;
      if (kbmDaysInWeek >= 3) {
        pekanEfektif++;
      }
    });

    const totalWeeksInMonth = weeks.length;
    const pekanTidakEfektif = Math.max(0, totalWeeksInMonth - pekanEfektif);

    return {
      monthIndex: mIdx,
      monthName: cfg.name,
      year: cfg.year,
      monthNum: cfg.monthNum,
      semester: cfg.semester,
      weeks,
      pekanEfektif,
      pekanTidakEfektif,
      hariEfektif: hariEfektifCount,
      hariLibur: hariLiburCount,
      agendaList: monthAgendaList
    };
  });
}

/**
 * Menghitung rekapitulasi statistik Kalender Pendidikan Satuan Pendidikan
 */
export function calculateKaldikStats(
  gridData: MonthGridData[],
  options: { sistemHariSekolah?: '5-hari' | '6-hari' } = {}
): KaldikStatistics {
  const sistemHariSekolah = options.sistemHariSekolah || '5-hari';

  let totalHariEfektifKbm = 0;
  let totalHariLibur = 0;
  let totalPekanEfektifSmt1 = 0;
  let totalPekanEfektifSmt2 = 0;

  const allAgendaTitles = new Set<string>();
  let totalAgendaKeagamaan = 0;
  let totalAgendaSekolah = 0;

  gridData.forEach(m => {
    totalHariEfektifKbm += m.hariEfektif;
    totalHariLibur += m.hariLibur;

    if (m.semester === 1) {
      totalPekanEfektifSmt1 += m.pekanEfektif;
    } else {
      totalPekanEfektifSmt2 += m.pekanEfektif;
    }

    m.agendaList.forEach(a => {
      if (!allAgendaTitles.has(a.judul)) {
        allAgendaTitles.add(a.judul);
        if (a.kategori === 'keagamaan') totalAgendaKeagamaan++;
        else totalAgendaSekolah++;
      }
    });
  });

  return {
    tahunAjaran: '2026/2027',
    sistemHariSekolah,
    totalPekanEfektifSmt1,
    totalPekanEfektifSmt2,
    totalPekanEfektifTahun: totalPekanEfektifSmt1 + totalPekanEfektifSmt2,
    totalHariEfektifKbm,
    totalHariLibur,
    totalAgendaKeagamaan,
    totalAgendaSekolah,
    dasarHukumPusat: [
      'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
      'Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Standar Nasional Pendidikan',
      'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum Satuan Pendidikan',
      'Permendikdasmen Nomor 13 Tahun 2025 tentang Pedoman Kurikulum dan Alokasi Waktu Belajar (Minimal 36 Pekan Efektif/Tahun)',
      'Keputusan Bersama Menag, Menaker, dan MenPAN-RB (SKB 3 Menteri) tentang Hari Libur Nasional dan Cuti Bersama'
    ],
    dasarHukumPurwakarta: [
      'Surat Edaran Kepala Dinas Pendidikan Kabupaten Purwakarta Nomor 400.3.5/2367-Dikdas/2026 tentang Pedoman Penyusunan Kalender Pendidikan',
      'Peraturan Bupati Purwakarta Nomor 69 Tahun 2015 tentang Pendidikan Berkarakter (7 Poé Atikan Purwakarta Istimewa)',
      'Peraturan Bupati Purwakarta Nomor 103 Tahun 2021 tentang Tatanen di Bale Atikan (TdBA)'
    ]
  };
}
