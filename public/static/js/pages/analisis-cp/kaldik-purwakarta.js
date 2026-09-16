/**
 * Kalender Pendidikan Dinas Pendidikan Kabupaten Purwakarta
 * Tahun Ajaran 2026/2027
 * Sesuai Surat Edaran Kadisdik No. 400.3.5/2367-Dikdas/2026
 * 
 * Aturan Kanonikal Pekan Efektif:
 * "Sebuah minggu dikatakan sebagai minggu efektif jika dalam minggu tersebut
 * terdapat minimal tiga hari efektif yang digunakan untuk kegiatan proses belajar mengajar (KBM)."
 */

export const KALDIK_PURWAKARTA_2026_2027 = {
  dasarHukum: 'Surat Edaran Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026 tertanggal 26 Juni 2026',
  tahunAjaran: '2026/2027',

  // SEMESTER 1 (GANJIL: JULI - DESEMBER 2026)
  semester1: {
    semester: 1,
    semesterLabel: 'Semester 1 (Ganjil)',
    tahunAjaran: '2026/2027',
    bulanList: [
      { bulan: 'Juli 2026', totalPekan: 5, pekanEfektif: 2, pekanTidakEfektif: 3, keterangan: 'MPLS & Libur TP Lalu' },
      { bulan: 'Agustus 2026', totalPekan: 5, pekanEfektif: 4, pekanTidakEfektif: 1, keterangan: 'HUT RI & Maulid Nabi' },
      { bulan: 'September 2026', totalPekan: 5, pekanEfektif: 4, pekanTidakEfektif: 1, keterangan: 'Asesmen Formatif / STS' },
      { bulan: 'Oktober 2026', totalPekan: 5, pekanEfektif: 4, pekanTidakEfektif: 1, keterangan: 'Sumpah Pemuda' },
      { bulan: 'November 2026', totalPekan: 5, pekanEfektif: 4, pekanTidakEfektif: 1, keterangan: 'Hari Guru & Mulai SAS' },
      { bulan: 'Desember 2026', totalPekan: 5, pekanEfektif: 0, pekanTidakEfektif: 5, keterangan: 'SAS, Rapor, Libur Smt 1' },
    ],
    totalPekanKalender: 30,
    totalPekanEfektif: 18,
    totalPekanTidakEfektif: 12,
    agendaTidakEfektif: [
      { kegiatan: 'Libur Akhir Tahun Ajaran 2025/2026', tanggal: '1 - 10 Juli 2026', jumlahPekan: 2, keterangan: 'Libur Kenaikan Kelas TP Lalu' },
      { kegiatan: 'Masa Pengenalan Lingkungan Sekolah (MPLS)', tanggal: '13 - 17 Juli 2026', jumlahPekan: 1, keterangan: 'MPLS PAUD, SD, dan SMP' },
      { kegiatan: 'Sumatif Tengah Semester (STS) / Cadangan', tanggal: '28 - 30 September 2026', jumlahPekan: 1, keterangan: 'Penilaian Tengah Semester' },
      { kegiatan: 'Perkiraan Penilaian Sumatif Akhir Semester (SAS)', tanggal: '30 November - 11 Desember 2026', jumlahPekan: 2, keterangan: 'Asesmen Sumatif Akhir Semester 1' },
      { kegiatan: 'Pengolahan Nilai & Remedial / Classmeeting', tanggal: '14 - 18 Desember 2026', jumlahPekan: 1, keterangan: 'Perekapan Nilai & Persiapan Rapor' },
      { kegiatan: 'Pembagian Rapor Semester 1 & Libur Natal', tanggal: '21 - 25 Desember 2026', jumlahPekan: 1, keterangan: 'Titimangsa 21 Des, Bagi Rapor 22/23 Des' },
      { kegiatan: 'Libur Akhir Semester 1', tanggal: '28 Desember 2026 - 8 Januari 2027', jumlahPekan: 1, keterangan: 'Libur Semester Ganjil' },
      { kegiatan: 'Pekan Cadangan & Transisi Kalender', tanggal: 'Agustus, Oktober, November 2026', jumlahPekan: 3, keterangan: 'Pekan Penguatan Proyek/Cadangan' },
    ],
    activeKbmWeeks: [4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24],
    weekStatusMap: {
      1: { status: 'LBR', label: 'Libur Akhir TP', colorHex: 'CBD5E1', isKbm: false },
      2: { status: 'LBR', label: 'Libur Akhir TP', colorHex: 'CBD5E1', isKbm: false },
      3: { status: 'MPLS', label: 'MPLS', colorHex: 'BAE6FD', isKbm: false },
      4: { status: 'KBM', label: 'KBM 1', colorHex: 'E0E7FF', isKbm: true },
      5: { status: 'KBM', label: 'KBM 2', colorHex: 'E0E7FF', isKbm: true },
      6: { status: 'KBM', label: 'KBM 3', colorHex: 'E0E7FF', isKbm: true },
      7: { status: 'KBM', label: 'KBM 4', colorHex: 'E0E7FF', isKbm: true },
      8: { status: 'KBM', label: 'KBM 5', colorHex: 'E0E7FF', isKbm: true },
      9: { status: 'KBM', label: 'KBM 6', colorHex: 'E0E7FF', isKbm: true },
      10: { status: 'CDG', label: 'Cadangan', colorHex: 'F1F5F9', isKbm: false },
      11: { status: 'KBM', label: 'KBM 7', colorHex: 'E0E7FF', isKbm: true },
      12: { status: 'KBM', label: 'KBM 8', colorHex: 'E0E7FF', isKbm: true },
      13: { status: 'KBM', label: 'KBM 9', colorHex: 'E0E7FF', isKbm: true },
      14: { status: 'KBM', label: 'KBM 10', colorHex: 'E0E7FF', isKbm: true },
      15: { status: 'STS', label: 'STS', colorHex: 'FEF08A', isKbm: false },
      16: { status: 'KBM', label: 'KBM 11', colorHex: 'E0E7FF', isKbm: true },
      17: { status: 'KBM', label: 'KBM 12', colorHex: 'E0E7FF', isKbm: true },
      18: { status: 'KBM', label: 'KBM 13', colorHex: 'E0E7FF', isKbm: true },
      19: { status: 'KBM', label: 'KBM 14', colorHex: 'E0E7FF', isKbm: true },
      20: { status: 'CDG', label: 'Cadangan', colorHex: 'F1F5F9', isKbm: false },
      21: { status: 'KBM', label: 'KBM 15', colorHex: 'E0E7FF', isKbm: true },
      22: { status: 'KBM', label: 'KBM 16', colorHex: 'E0E7FF', isKbm: true },
      23: { status: 'KBM', label: 'KBM 17', colorHex: 'E0E7FF', isKbm: true },
      24: { status: 'KBM', label: 'KBM 18', colorHex: 'E0E7FF', isKbm: true },
      25: { status: 'SAS', label: 'Awal SAS', colorHex: 'E9D5FF', isKbm: false },
      26: { status: 'SAS', label: 'SAS', colorHex: 'E9D5FF', isKbm: false },
      27: { status: 'SAS', label: 'SAS', colorHex: 'E9D5FF', isKbm: false },
      28: { status: 'PENG', label: 'Pengolahan', colorHex: 'CCFBF1', isKbm: false },
      29: { status: 'RPT', label: 'Rapor', colorHex: '99F6E4', isKbm: false },
      30: { status: 'LBR', label: 'Libur Smt 1', colorHex: 'CBD5E1', isKbm: false },
    }
  },

  // SEMESTER 2 (GENAP: JANUARI - JUNI 2027)
  semester2: {
    semester: 2,
    semesterLabel: 'Semester 2 (Genap)',
    tahunAjaran: '2026/2027',
    bulanList: [
      { bulan: 'Januari 2027', totalPekan: 5, pekanEfektif: 3, pekanTidakEfektif: 2, keterangan: 'Libur Smt 1 & Masuk 11 Jan' },
      { bulan: 'Februari 2027', totalPekan: 5, pekanEfektif: 3, pekanTidakEfektif: 2, keterangan: 'Libur Awal Ramadhan & Masantren' },
      { bulan: 'Maret 2027', totalPekan: 5, pekanEfektif: 3, pekanTidakEfektif: 2, keterangan: 'Masantren & Libur Idul Fitri' },
      { bulan: 'April 2027', totalPekan: 5, pekanEfektif: 4, pekanTidakEfektif: 1, keterangan: 'KBM Penuh' },
      { bulan: 'Mei 2027', totalPekan: 5, pekanEfektif: 5, pekanTidakEfektif: 0, keterangan: 'KBM / PSAJ Kelas 6' },
      { bulan: 'Juni 2027', totalPekan: 5, pekanEfektif: 0, pekanTidakEfektif: 5, keterangan: 'ASAT, Rapor, Libur TP' },
    ],
    totalPekanKalender: 30,
    totalPekanEfektif: 18,
    totalPekanTidakEfektif: 12,
    agendaTidakEfektif: [
      { kegiatan: 'Lanjutan Libur Semester 1', tanggal: '1 - 8 Januari 2027', jumlahPekan: 1, keterangan: 'Libur Semester Ganjil TP 2026/2027' },
      { kegiatan: 'Prakiraan Libur Awal Ramadhan 1448 H', tanggal: '8 - 10 Februari 2027', jumlahPekan: 1, keterangan: 'Libur Keagamaan Awal Puasa' },
      { kegiatan: 'Prakiraan Libur Idul Fitri 1448 H & Nyepi', tanggal: '8 - 12 Maret 2027', jumlahPekan: 1, keterangan: 'Libur Hari Raya Idul Fitri & Nyepi' },
      { kegiatan: 'Perkiraan Penilaian Sumatif Akhir Tahun (ASAT)', tanggal: '7 - 18 Juni 2027', jumlahPekan: 2, keterangan: 'Asesmen Akhir Tahun / Kenaikan Kelas' },
      { kegiatan: 'Pengolahan Nilai & Pembagian Rapor Semester 2', tanggal: '21 - 25 Juni 2027', jumlahPekan: 1, keterangan: 'Titimangsa 24 Jun, Bagi Rapor 25 Jun' },
      { kegiatan: 'Libur Akhir Tahun Ajaran 2026/2027', tanggal: '28 Juni - 9 Juli 2027', jumlahPekan: 2, keterangan: 'Libur Kenaikan Kelas' },
      { kegiatan: 'Pekan Cadangan & Transisi Semester', tanggal: 'Januari, Februari, April 2027', jumlahPekan: 4, keterangan: 'Pekan Asesmen Sumatif / Cadangan' },
    ],
    activeKbmWeeks: [2, 3, 4, 6, 8, 9, 11, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 25],
    weekStatusMap: {
      1: { status: 'LBR', label: 'Libur Smt 1', colorHex: 'CBD5E1', isKbm: false },
      2: { status: 'KBM', label: 'KBM 1', colorHex: 'E0E7FF', isKbm: true },
      3: { status: 'KBM', label: 'KBM 2', colorHex: 'E0E7FF', isKbm: true },
      4: { status: 'KBM', label: 'KBM 3', colorHex: 'E0E7FF', isKbm: true },
      5: { status: 'CDG', label: 'Cadangan', colorHex: 'F1F5F9', isKbm: false },
      6: { status: 'KBM', label: 'KBM 4', colorHex: 'E0E7FF', isKbm: true },
      7: { status: 'LBR', label: 'Awal Ramadhan', colorHex: 'CBD5E1', isKbm: false },
      8: { status: 'KBM', label: 'KBM 5 (Masantren)', colorHex: 'BBF7D0', isKbm: true },
      9: { status: 'KBM', label: 'KBM 6 (Masantren)', colorHex: 'BBF7D0', isKbm: true },
      10: { status: 'CDG', label: 'Cadangan', colorHex: 'F1F5F9', isKbm: false },
      11: { status: 'KBM', label: 'KBM 7 (Masantren)', colorHex: 'BBF7D0', isKbm: true },
      12: { status: 'LBR', label: 'Idul Fitri', colorHex: 'CBD5E1', isKbm: false },
      13: { status: 'KBM', label: 'KBM 8', colorHex: 'E0E7FF', isKbm: true },
      14: { status: 'KBM', label: 'KBM 9', colorHex: 'E0E7FF', isKbm: true },
      15: { status: 'STS', label: 'STS', colorHex: 'FEF08A', isKbm: false },
      16: { status: 'KBM', label: 'KBM 10', colorHex: 'E0E7FF', isKbm: true },
      17: { status: 'KBM', label: 'KBM 11', colorHex: 'E0E7FF', isKbm: true },
      18: { status: 'KBM', label: 'KBM 12', colorHex: 'E0E7FF', isKbm: true },
      19: { status: 'KBM', label: 'KBM 13', colorHex: 'E0E7FF', isKbm: true },
      20: { status: 'CDG', label: 'Cadangan', colorHex: 'F1F5F9', isKbm: false },
      21: { status: 'KBM', label: 'KBM 14', colorHex: 'E0E7FF', isKbm: true },
      22: { status: 'KBM', label: 'KBM 15 (PSAJ Kls 6)', colorHex: 'E0E7FF', isKbm: true },
      23: { status: 'KBM', label: 'KBM 16 (PSAJ Kls 6)', colorHex: 'E0E7FF', isKbm: true },
      24: { status: 'KBM', label: 'KBM 17', colorHex: 'E0E7FF', isKbm: true },
      25: { status: 'KBM', label: 'KBM 18', colorHex: 'E0E7FF', isKbm: true },
      26: { status: 'ASAT', label: 'ASAT', colorHex: 'E9D5FF', isKbm: false },
      27: { status: 'ASAT', label: 'ASAT', colorHex: 'E9D5FF', isKbm: false },
      28: { status: 'RPT', label: 'Rapor', colorHex: '99F6E4', isKbm: false },
      29: { status: 'LBR', label: 'Libur Akhir TP', colorHex: 'CBD5E1', isKbm: false },
      30: { status: 'LBR', label: 'Libur Akhir TP', colorHex: 'CBD5E1', isKbm: false },
    }
  }
};

/**
 * Kalkulasi RPE Resmi Disdik Purwakarta
 */
export function calculateRpe(semesterNum, jpPerMinggu = 2, jenjangKelas = '5') {
  const isKelas6 = String(jenjangKelas).replace(/\D/g, '') === '6';
  const semInfo = semesterNum === 1
    ? KALDIK_PURWAKARTA_2026_2027.semester1
    : KALDIK_PURWAKARTA_2026_2027.semester2;

  const pekanEfektif = (semesterNum === 2 && isKelas6) ? 16 : semInfo.totalPekanEfektif;
  const pekanTidakEfektif = semInfo.totalPekanKalender - pekanEfektif;

  const totalJpTersedia = pekanEfektif * jpPerMinggu;
  const jpCadangan = Math.max(2, Math.round(totalJpTersedia * 0.1));
  const jpTatapMuka = totalJpTersedia - jpCadangan;

  return {
    semester: semesterNum,
    semesterLabel: semInfo.semesterLabel,
    tahunAjaran: semInfo.tahunAjaran,
    totalPekanKalender: semInfo.totalPekanKalender,
    pekanEfektif,
    pekanTidakEfektif,
    bulanList: semInfo.bulanList,
    agendaTidakEfektif: semInfo.agendaTidakEfektif,
    jpPerMinggu,
    totalJpTersedia,
    jpTatapMuka,
    jpCadangan,
    activeKbmWeeks: semInfo.activeKbmWeeks,
    weekStatusMap: semInfo.weekStatusMap
  };
}
