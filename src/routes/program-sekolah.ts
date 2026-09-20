import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
import { generateProgramDocxBuffer, generateProgramLampiranOnlyDocxBuffer, type ProgramSekolahData } from '../lib/docx/program-sekolah';
import {
  mergeKaldikEvents,
  generate12MonthGrid,
  calculateKaldikStats,
  OFFICIAL_KALDIK_EVENTS_2026_2027,
  type KaldikEventItem,
} from '../lib/kaldik-calendar-engine';
import { replacePesertaDidik } from './analisis-cp';
import { type AppBindings } from '../types/env';

const programSekolah = new Hono<{ Bindings: AppBindings }>();

const ADMIN_PANEL_ROLES = ['super_admin', 'admin', 'operator'] as const;

// Middleware: Khusus Administrator & Operator (Halaman Program Sekolah dibatasi)
programSekolah.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const sessionId = getCookie(c.req.header('Cookie'), 'session') || bearerToken;
  const user: any = await getCurrentUser(c.env?.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c, 'Silakan login terlebih dahulu sebagai administrator atau operator');
  }

  if (!ADMIN_PANEL_ROLES.includes(user.role)) {
    return Errors.forbidden(c, 'Fitur Program Sekolah saat ini hanya dapat diakses oleh administrator dan operator');
  }

  c.set('user' as any, user);
  c.set('sessionId' as any, sessionId);
  await next();
});

// ============================================
// Database Regulasi Resmi Per Jenis Program
// ============================================
export const regulasiProgramDatabase: Record<string, string[]> = {
  'kokurikuler-p5': [
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan atas PP No. 57 Tahun 2021 tentang Standar Nasional Pendidikan',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum pada PAUD, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah',
    'Permendikdasmen Nomor 13 Tahun 2025 tentang Perubahan atas Permendikbudristek No. 12 Tahun 2024 (Pasal 17 Kokurikuler)',
    'Keputusan Kepala BSKAP Kemendikdasmen Nomor 058/H/KR/2025 tentang Alur Perkembangan Kompetensi (8 Dimensi Profil Lulusan)',
    'Pedoman Operasional Kokurikuler Penguatan Profil Lulusan Kemendikdasmen RI',
  ],
  '7kaih': [
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Presiden Republik Indonesia Nomor 87 Tahun 2017 tentang Penguatan Pendidikan Karakter (PPK)',
    'Asta Cita ke-4 Kabinet Merah Putih 2024-2029 tentang Memperkuat Pembangunan SDM, Sains, Teknologi, dan Pendidikan',
    'Surat Edaran Kementerian Pendidikan Dasar dan Menengah RI tentang 8 Karakter Utama dan 7 Kebiasaan Anak Indonesia Hebat (7 KAIH)',
    'Peraturan Bupati Purwakarta Nomor 69 Tahun 2015 tentang Pendidikan Berkarakter (7 Poé Atikan Purwakarta Istimewa)',
    'Peraturan Bupati Purwakarta Nomor 103 Tahun 2021 tentang Tatanen di Bale Atikan (TdBA)',
    'Permendikbudristek Nomor 46 Tahun 2023 tentang Pencegahan dan Penanganan Kekerasan di Lingkungan Satuan Pendidikan (PPKSP)',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum Merdeka',
  ],
  'hari-belajar-guru': [
    'Undang-Undang Republik Indonesia Nomor 14 Tahun 2005 tentang Guru dan Dosen',
    'Peraturan Pemerintah Nomor 74 Tahun 2008 tentang Guru sebagaimana diubah dengan PP Nomor 19 Tahun 2017',
    'Permendikbudristek Nomor 26 Tahun 2022 tentang Pendidikan Guru Penggerak',
    'Peraturan Direktur Jenderal Guru dan Tenaga Kependidikan Nomor 2626/B/HK.04.01/2023 tentang Model Kompetensi Guru',
    'Surat Edaran Dirjen GTK Kemendikbudristek tentang Optimalisasi Komunitas Belajar Ramah Guru di Satuan Pendidikan',
    'Permendikdasmen Nomor 13 Tahun 2025 tentang Kurikulum Satuan Pendidikan',
  ],
  'literasi': [
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Undang-Undang Republik Indonesia Nomor 43 Tahun 2007 tentang Perpustakaan',
    'Permendikbud Nomor 23 Tahun 2015 tentang Penumbuhan Budi Pekerti (Gerakan Literasi Sekolah)',
    'Perpres Nomor 63 Tahun 2019 tentang Penggunaan Bahasa Indonesia',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum pada Satuan Pendidikan',
    'Panduan Gerakan Literasi Sekolah (GLS) di Sekolah Dasar Kemendikbudristek',
  ],
  'uks': [
    'Undang-Undang Republik Indonesia Nomor 17 Tahun 2023 tentang Kesehatan',
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Bersama 4 Menteri (Mendikbud, Menkes, Menag, Mendagri) Nomor 6/X/PB/2014 tentang Pembinaan dan Pengembangan UKS/M',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum Satuan Pendidikan',
    'Instruksi Presiden Nomor 1 Tahun 2017 tentang Gerakan Masyarakat Hidup Sehat (GERMAS)',
  ],
  'adiwiyata': [
    'Undang-Undang Republik Indonesia Nomor 32 Tahun 2009 tentang Perlindungan dan Pengelolaan Lingkungan Hidup',
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Menteri LHK Nomor P.52/MENLHK/SETJEN/KUM.1/9/2019 tentang Gerakan Peduli dan Berbudaya Lingkungan Hidup di Sekolah (PBLHS)',
    'Peraturan Menteri LHK Nomor P.53/MENLHK/SETJEN/KUM.1/9/2019 tentang Penghargaan Adiwiyata',
    'Peraturan Bupati Purwakarta Nomor 103 Tahun 2021 tentang Tatanen di Bale Atikan (TdBA)',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum Satuan Pendidikan',
  ],
  'keagamaan': [
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Pemerintah Nomor 55 Tahun 2007 tentang Pendidikan Agama dan Pendidikan Keagamaan',
    'Perpres Nomor 87 Tahun 2017 tentang Penguatan Pendidikan Karakter (PPK)',
    'Permendikbud Nomor 23 Tahun 2015 tentang Penumbuhan Budi Pekerti',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum Satuan Pendidikan',
  ],
  'kalender-sekolah': [
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan atas PP No. 57 Tahun 2021 tentang Standar Nasional Pendidikan',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum pada PAUD, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah',
    'Permendikdasmen Nomor 13 Tahun 2025 tentang Pedoman Kurikulum dan Alokasi Waktu Belajar (Standar Minimal 36 Pekan Efektif/Tahun)',
    'Keputusan Bersama Menag, Menaker, dan MenPAN-RB (SKB 3 Menteri) tentang Hari Libur Nasional dan Cuti Bersama',
    'Surat Edaran Kepala Dinas Pendidikan Kabupaten Purwakarta Nomor 400.3.5/2367-Dikdas/2026 tentang Pedoman Penyusunan Kalender Pendidikan Tahun Ajaran 2026/2027',
    'Peraturan Bupati Purwakarta Nomor 69 Tahun 2015 tentang Pendidikan Berkarakter (7 Poé Atikan Purwakarta Istimewa)',
    'Peraturan Bupati Purwakarta Nomor 103 Tahun 2021 tentang Tatanen di Bale Atikan (TdBA)',
  ],
  'kustom': [
    'Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Standar Nasional Pendidikan',
    'Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum Satuan Pendidikan',
    'Permendikdasmen Nomor 13 Tahun 2025 tentang Pedoman Kurikulum',
  ],
};

// ============================================
// Prompt Builder untuk Program Sekolah
// ============================================
export function buildProgramPrompt(params: {
  template: string;
  identitas: {
    namaSekolah: string;
    tahunAjaran: string;
    jenjang: string;
    faseKelas?: string;
    penyusun: string;
    nipPenyusun?: string;
    jabatanPenyusun?: string;
    kepalaSekolah?: string;
    nipKepalaSekolah?: string;
    komiteSekolah?: string;
    pengawas?: string;
    kota?: string;
    opsiPengesahan?: 'internal' | 'lengkap';
  };
  spesifik: Record<string, any>;
}): string {
  const { template, identitas, spesifik } = params;
  const legalList = regulasiProgramDatabase[template] || regulasiProgramDatabase['kustom'];

  let fokusDeskripsi = '';
  if (template === 'kokurikuler-p5' || template === 'kokurikuler-profil-lulusan') {
    fokusDeskripsi = `Tema Kokurikuler: "${spesifik.tema || 'Gaya Hidup Berkelanjutan'}". Alokasi JP: ${spesifik.alokasiJp || '108 JP/Tahun'}. Fokus 8 Dimensi Profil Lulusan (SK BSKAP 058/H/KR/2025): ${Array.isArray(spesifik.dimensi) ? spesifik.dimensi.join(', ') : (spesifik.dimensi || 'Keimanan & Ketakwaan, Kewargaan, Penalaran Kritis, Kolaborasi')}. Model Pelaksanaan: ${spesifik.modelJadwal || 'Blok Terpusat / Reguler Mingguan'}. Menggunakan alur asesmen 3 tingkat perkembangan: Berkembang (menuju standar), Cakap (standar kelulusan SKL), dan Mahir (melampaui standar).`;
  } else if (template === '7kaih') {
    fokusDeskripsi = `Program 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) yang diharmonisasikan secara integratif dengan Kebijakan Karakter Purwakarta "7 Poé Atikan Purwakarta Istimewa" (Senin Ajeg Nusantara, Selasa Mapag Buana, Rabu Maneuh di Sunda, Kamis Nyanding Wawangi, Jumat Nyucikeun Diri, Sabtu-Minggu Betah di Imah) dan Program Tatanen di Bale Atikan (TdBA). 7 KAIH Nasional: 1. Bangun Pagi, 2. Beribadah, 3. Berolahraga/Makan Sehat, 4. Gemar Membaca, 5. Rajin Belajar, 6. Bermasyarakat/Gotong Royong, 7. Tidur Cepat. Fokus utama: ${spesifik.fokusKebiasaan || 'Pembiasaan harian terintegrasi dan Jurnal Karakter Siswa'}. Catatan tambahan: ${spesifik.catatan || 'Keterlibatan aktif orang tua dan pengawasan berkala oleh wali kelas'}.`;
  } else if (template === 'hari-belajar-guru') {
    fokusDeskripsi = `Program Hari Belajar Guru (HBG) & Komunitas Belajar (Kombel) Guru. Frekuensi: ${spesifik.frekuensi || '1x Setiap Pekan (Jumat Siang)'}. Fokus materi: ${spesifik.fokusMateri || 'Refleksi Pembelajaran, Pemanfaatan AI Edukasi, Asesmen Autentik, dan Modul Ajar Berdiferensiasi'}. Narasumber: ${spesifik.narasumber || 'Guru Penggerak, Rekan Sejawat, dan Pengawas Pembina'}.`;
  } else if (template === 'literasi') {
    fokusDeskripsi = `Program Gerakan Literasi Sekolah (GLS). Aktivitas Inti: 15 Menit Membaca Sebelum Pelajaran, Pojok Baca Kelas, Jurnal Membaca Siswa, dan Festival Literasi Sekolah. Fokus spesifik: ${spesifik.fokus || 'Peningkatan Skor Literasi Rapor Pendidikan dan Kecintaan Buku Anak'}.`;
  } else if (template === 'uks') {
    fokusDeskripsi = `Program UKS dan Sekolah Sehat (Trias UKS: Pendidikan Kesehatan, Pelayanan Kesehatan, Pembinaan Lingkungan Sekolah Sehat). Mitra: ${spesifik.mitra || 'Puskesmas setempat'}. Fokus: ${spesifik.fokus || 'Pemeriksaan berkala, kantin sehat, dan aksi sikat gigi/cuci tangan serentak'}.`;
  } else if (template === 'adiwiyata') {
    fokusDeskripsi = `Program Sekolah Adiwiyata / Lingkungan Hidup Berkelanjutan yang disinergikan dengan Program Tatanen di Bale Atikan (TdBA) khas Purwakarta. Fokus: Pengurangan Sampah Plastik Sekali Pakai, Budidaya Kebun Sekolah Organik / TdBA, Konservasi Air dan Energi, serta Integrasi Pembelajaran Lingkungan Hidup Holistik.`;
  } else if (template === 'keagamaan') {
    fokusDeskripsi = `Program Pembiasaan Keagamaan dan Akhlak Mulia. Fokus: Sholat Dhuha/Dzuhur Berjamaah, Tadarus Pagi / Hafalan Surat Pendek, Infaq Jumat, dan Peringatan Hari Besar Keagamaan.`;
  } else if (template === 'kalender-sekolah') {
    fokusDeskripsi = `Program Kalender Pendidikan Satuan Pendidikan (KPSP) mengacu pada Permendikdasmen No. 13 Tahun 2025 (Pusat) dan Surat Edaran Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026. Alokasi waktu: ${spesifik.sistemHariSekolah || '5 Hari Sekolah (Senin - Jumat)'}, target minimal 36 pekan efektif KBM (18 pekan Semester 1 + 18 pekan Semester 2). Penyesuaian agenda khusus keagamaan (PHBI): ${spesifik.agendaKeagamaan || 'Maulid Nabi Muhammad SAW, Rajaban (Isra Mi’raj), Pesantren Kilat/Masantren di Sakola Ramadhan 1448 H, Idul Fitri, dan Idul Adha'}. Penyesuaian agenda daerah Purwakarta: ${spesifik.agendaPurwakarta || 'Hari Jadi Purwakarta (HJP), Hari Bambu Sedunia TdBA, Hari Udara Bersih, dan Asesmen STS/SAS/ASAT/PSAJ'}. Kegiatan tambahan sekolah: ${spesifik.kegiatanKustomTambahan || 'Classmeeting Porseni, Gelar Karya Profil Lulusan / Pentas Seni Akhir Tahun'}.`;
  } else {
    fokusDeskripsi = `Program: "${spesifik.judulKustom || 'Program Inovasi Sekolah'}". Deskripsi singkat: ${spesifik.deskripsiKustom || 'Pengembangan mutu dan budaya positif di lingkungan sekolah'}. Tujuan utama: ${spesifik.tujuanKustom || 'Meningkatkan prestasi, karakter, dan iklim belajar murid'}.`;
  }

  return `Anda adalah Pakar Manajemen Pendidikan Nasional, Perencana Mutu Sekolah, dan Pengembang Kurikulum Berpengalaman dari Kemendikdasmen RI.
Tugas Anda adalah menyusun Dokumen Program Kerja Sekolah Resmi yang komprehensif, ilmiah, operasional, dan berbobot tinggi.

IDENTITAS PROGRAM:
- Jenis Dokumen: Program Kerja Sekolah Resmi Berstruktur BAB Ilmiah
- Nama Satuan Pendidikan: ${identitas.namaSekolah || 'SD Negeri Binaan'}
- Tahun Ajaran: ${identitas.tahunAjaran || '2025/2026'}
- Jenjang: ${identitas.jenjang || 'Sekolah Dasar (SD)'}
- Sasaran Fase/Kelas: ${identitas.faseKelas || 'Fase A, B, dan C (Kelas 1 - 6)'}
- Penyusun: ${identitas.penyusun || 'Tim Pengembang Kurikulum'} (${identitas.jabatanPenyusun || 'Koordinator Program'})
- Kepala Sekolah: ${identitas.kepalaSekolah || 'Kepala Satuan Pendidikan'}
- Fokus & Parameter Spesifik:
  ${fokusDeskripsi}

ATURAN FORMAL PENULISAN:
1. Gaya bahasa kedinasan, objektif, padat, analitis, dan ilmiah.
2. BAB I PENDAHULUAN:
   - Latar Belakang: Uraikan minimal 3-4 paragraf berbobot dengan alur Analisis Kesenjangan (Gap Analysis):
     * Paragraf 1 (Das Sollen): Standar Nasional Pendidikan, Permendikdasmen No. 13 Tahun 2025, Asta Cita ke-4 Kabinet Merah Putih 2024-2029, dan Visi Indonesia Emas 2045.
     * Paragraf 2 (Das Sein): Potret kondisi empiris sekolah, data Rapor Pendidikan (iklim keamanan, karakter, literasi-numerasi), dan tantangan perilaku nyata murid.
     * Paragraf 3 (Solusi Strategis): Mengapa program ini menjadi intervensi terencana, terukur, dan berdampak nyata bagi seluruh ekosistem belajar.
   - Dasar Hukum: Rujuk peraturan resmi berikut secara presisi dan terurut hierarkis:
${legalList.map(l => `     * ${l}`).join('\n')}
   - Tujuan Program: Minimal 4 butir berprinsip SMART berawalan kata kerja operasional (KKO) yang terukur.
   - Sasaran: Rinci sasaran murid per jenjang/fase, segenap pendidik, dan komite/orang tua.
   - Manfaat Program: Wajib dirinci dalam 4 pilar: (1) Bagi Murid, (2) Bagi Pendidik & Tenaga Kependidikan, (3) Bagi Satuan Pendidikan, dan (4) Bagi Orang Tua & Masyarakat.
3. BAB II KAJIAN KONSEPTUAL DAN LANDASAN TEORITIS:
   - Sesuaikan judul dan sub-bab dengan jenis program:
     * Jika Kokurikuler Profil Lulusan: Kajian Teori Experiential Learning David Kolb & Pendekatan Pembelajaran Mendalam (Deep Learning), 4 Prinsip Kokurikuler (Holistik, Kontekstual, Berpusat pada Murid, Eksploratif), serta Alur Perkembangan Kompetensi 8 Dimensi Profil Lulusan (SK BSKAP No. 058/H/KR/2025).
     * Jika 7KAIH: Teori Habituasi Ki Hajar Dewantara, Pembelajaran Sosial Albert Bandura (Modeling Perilaku), serta Harmonisasi Falsafah 7 Poé Atikan Purwakarta Istimewa dan TdBA.
     * Jika Hari Belajar Guru: Teori Komunitas Praktisi (Community of Practice Etienne Wenger), Andragogi Guru Malcolm Knowles, dan Siklus Inkuiri Kolaboratif (Refleksi, Rencana, Aksi, Evaluasi).
     * Jika Literasi: Balanced Literacy, Tiga Tahap Gerakan Literasi Sekolah (Pembiasaan, Pengembangan, Pembelajaran), dan Multiliterasi Abad 21.
     * Jika UKS: Paradigma Trias UKS dan Gerakan Sekolah Sehat (Sehat Bergizi, Fisik, Imunisasi, Jiwa, dan Lingkungan).
     * Jika Adiwiyata: Etika Lingkungan Hidup, Gerakan PBLHS, dan Integrasi TdBA Purwakarta.
     * Jika Keagamaan: Kecerdasan Spiritual (SQ), Pembudayaan Budi Pekerti Melalui Keteladanan, serta Moderasi Beragama dan Inklusivitas.
     * Jika Kustom: Manajemen Berbasis Sekolah (MBS) dan Siklus Perbaikan Berkelanjutan (PDCA).
4. BAB III RENCANA PROGRAM DAN STRATEGI PELAKSANAAN:
   - Kegiatan Aksi Nyata: Buat minimal 6-8 kegiatan konkret operasional. Setiap kegiatan memuat:
     * nama: Nama kegiatan yang menarik dan bermakna.
     * deskripsi: Uraian substansi kegiatan.
     * tahapan: Array 3 tahap (1. Pra-kegiatan/Persiapan, 2. Pelaksanaan Inti, 3. Output/Artefak Fisik).
     * tujuan: Sasaran capaian kegiatan.
     * waktu: Jadwal spesifik (contoh: Pekan ke-1 s.d ke-4 / Setiap Hari Jumat).
     * sasaran: Target peserta.
     * pic: Penanggung jawab pelaksana.
   - Tim Pelaksana: Struktur tim lengkap dengan pembagian tugas pokok yang tegas.
   - Action Plan 12 Bulan: Distribusi jadwal 12 bulan (Juli-Juni) yang membedakan kegiatan rutin bulanan dan tonggak evaluasi semester.
   - Dukungan Sarana & Anggaran: Uraikan sarana prasarana serta susun Tabel Rencana Anggaran Biaya (RAB) realistis dengan baris total akumulasi (total_anggaran) yang logis (Rp 1.500.000 s.d Rp 5.000.000).
5. BAB IV MONITORING, EVALUASI, DAN TINDAK LANJUT:
   - Mekanisme Pemantauan: Monitoring harian oleh wali kelas, supervisi bulanan kepala sekolah, dan evaluasi tim kurikulum.
   - Indikator: Rincikan minimal 3 tingkatan indikator keberhasilan yang terukur dan berprinsip SMART:
      (1) Indikator Proses (keterlaksanaan aksi >= 95%).
      (2) Indikator Output (kelengkapan jurnal dan artefak murid >= 85%).
      (3) Indikator Dampak / Outcome (peningkatan skor iklim keamanan & karakter Rapor Pendidikan).
   - Sistem Evaluasi & Refleksi Berkala.
   - Tindak Lanjut & Apresiasi: Bentuk apresiasi lencana/bintang kebaikan serta tindak lanjut dua arah (Peer Mentoring untuk siswa dan Coaching/Refleksi Kombel untuk pendidik).
6. BAB V PENUTUP:
   - Kesimpulan: Pakta Komitmen Mutu dan Keberlanjutan Satuan Pendidikan.
   - Saran & Rekomendasi: Langkah strategis bagi ekosistem tripusat pendidikan.

OUTPUT WAJIB: Keluarkan HANYA satu objek JSON valid tanpa markdown backticks (tanpa \`\`\`json) dan tanpa teks pengantar:
{
  "metadata": {
    "template_id": "${template}",
    "judul_program": "Nama Lengkap Program Kerja",
    "subjudul": "Subjudul Penjelas Program",
    "nama_sekolah": "${identitas.namaSekolah}",
    "tahun_ajaran": "${identitas.tahunAjaran}",
    "jenjang": "${identitas.jenjang}",
    "fase_jenjang": "${identitas.faseKelas || 'Fase A, B, dan C (Kelas 1 - 6)'}",
    "penyusun": "${identitas.penyusun}",
    "nip_penyusun": "${identitas.nipPenyusun || ''}",
    "jabatan_penyusun": "${identitas.jabatanPenyusun || 'Koordinator Program'}",
    "kepala_sekolah": "${identitas.kepalaSekolah || ''}",
    "nip_kepala_sekolah": "${identitas.nipKepalaSekolah || ''}",
    "komite_sekolah": "${identitas.komiteSekolah || 'Ketua Komite Sekolah'}",
    "pengawas": "${identitas.pengawas || 'Pengawas Pembina'}",
    "nip_pengawas": "",
    "kota": "${identitas.kota || 'Purwakarta'}",
    "tanggal_pengesahan": "Juli 2025"
  },
  "bab_1_pendahuluan": {
    "latar_belakang": [
      "Paragraf 1 (Das Sollen: Regulasi & Standar Nasional)...",
      "Paragraf 2 (Das Sein: Kondisi Riil Sekolah & Kebutuhan Murid)...",
      "Paragraf 3 (Solusi Terencana & Urgensi Program)..."
    ],
    "dasar_hukum": [
      "Peraturan 1...",
      "Peraturan 2...",
      "Peraturan 3..."
    ],
    "tujuan": [
      "Tujuan SMART 1...",
      "Tujuan SMART 2...",
      "Tujuan SMART 3..."
    ],
    "sasaran": [
      "Sasaran murid...",
      "Sasaran pendidik dan komite..."
    ],
    "manfaat": [
      "Bagi Murid: ...",
      "Bagi Pendidik & Tenaga Kependidikan: ...",
      "Bagi Satuan Pendidikan: ...",
      "Bagi Orang Tua & Masyarakat: ..."
    ]
  },
  "bab_2_kajian_konseptual": {
    "judul_bab": "KAJIAN KONSEPTUAL DAN LANDASAN TEORITIS",
    "sub_bab": [
      {
        "judul": "Sub Bab Landasan Teori Utama",
        "isi": ["Uraian kajian ilmiah 1...", "Uraian kajian ilmiah 2..."]
      },
      {
        "judul": "Sub Bab Harmonisasi Kebijakan & Prinsip Operasional",
        "isi": ["Uraian prinsip operasional..."]
      }
    ]
  },
  "bab_3_rencana_program": {
    "kegiatan": [
      {
        "nama": "Nama Kegiatan",
        "deskripsi": "Deskripsi rinci kegiatan",
        "tahapan": [
          "Tahap 1 (Pra-kegiatan): Sosialisasi dan persiapan sarana instrumen",
          "Tahap 2 (Pelaksanaan Inti): Aksi pembiasaan terpadu dan pendampingan",
          "Tahap 3 (Output / Artefak): Portofolio jurnal dan lembar observasi terisi"
        ],
        "tujuan": "Tujuan khusus kegiatan",
        "waktu": "Setiap Hari / Pekan ke-1 s.d 4",
        "sasaran": "Seluruh Siswa Fase A-C",
        "pic": "Wali Kelas & Guru Piket"
      }
    ],
    "tim_pelaksana": [
      {
        "no": 1,
        "jabatan": "Pengarah / Penanggung Jawab",
        "nama": "${identitas.kepalaSekolah || 'Kepala Sekolah'}",
        "tugas": "Memberikan arahan kebijakan umum, memfasilitasi kebutuhan sarana, dan mengesahkan program kerja."
      },
      {
        "no": 2,
        "jabatan": "Ketua Tim Pelaksana",
        "nama": "${identitas.penyusun || 'Koordinator Program'}",
        "tugas": "Memimpin koordinasi operasional, mengawasi jadwal pelaksanaan, dan menyusun laporan pertanggungjawaban."
      },
      {
        "no": 3,
        "jabatan": "Sekretaris & Pengelola Instrumen",
        "nama": "Guru Kelas / Tim Kurikulum",
        "tugas": "Menggandakan dan mendistribusikan instrumen penilaian, rekap data, dan menyusun notula evaluasi."
      },
      {
        "no": 4,
        "jabatan": "Koordinator Lapangan & Sarpras",
        "nama": "Guru PJOK / Staf Sarpras",
        "tugas": "Menyiapkan perlengkapan teknis, media visual, dan memantau ketertiban aksi di lapangan."
      }
    ],
    "action_plan": [
      {
        "no": 1,
        "kegiatan": "Sosialisasi Program dan Pembagian Jurnal Siswa",
        "bulan": [1, 2],
        "pic": "Ketua Tim"
      },
      {
        "no": 2,
        "kegiatan": "Pelaksanaan Pembiasaan Rutin Terpadu",
        "bulan": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        "pic": "Seluruh Guru"
      },
      {
        "no": 3,
        "kegiatan": "Monitoring Tengah Semester & Refleksi Berkala",
        "bulan": [3, 9],
        "pic": "Tim Monitoring"
      },
      {
        "no": 4,
        "kegiatan": "Evaluasi Semester & Penganugerahan Apresiasi Karakter",
        "bulan": [6, 12],
        "pic": "Ketua Tim & Komite"
      }
    ],
    "sarana_anggaran": [
      "Kebutuhan sarana mencakup modul pedoman operasional, buku kendali/jurnal harian siswa, media poster edukasi, dan perlengkapan penunjang sekolah.",
      "Pembiayaan didukung oleh Bantuan Operasional Satuan Pendidikan (BOSP) komponen pengembangan karakter/kokurikuler serta partisipasi gotong royong komite sekolah."
    ],
    "tabel_anggaran": [
      { "no": 1, "uraian": "Pengadaan Modul Pedoman & Juknis Operasional Program", "volume": "1", "satuan": "Paket", "total": "Rp 450.000", "sumber": "BOSP Reguler" },
      { "no": 2, "uraian": "Penggandaan Buku Jurnal Pembiasaan Siswa & Lembar Kontrol", "volume": "1", "satuan": "Paket/Siswa", "total": "Rp 850.000", "sumber": "BOSP Reguler" },
      { "no": 3, "uraian": "Banner Sosialisasi, Poster Karakter & Media Visual Sekolah", "volume": "4", "satuan": "Buah", "total": "Rp 400.000", "sumber": "BOSP Reguler" },
      { "no": 4, "uraian": "Sertifikat Apresiasi & Pengadaan Bintang Kebaikan Siswa", "volume": "2", "satuan": "Paket", "total": "Rp 350.000", "sumber": "BOSP / Swadaya" },
      { "no": 5, "uraian": "Dokumentasi, Pelaporan Akhir & Refleksi Semesteran", "volume": "1", "satuan": "Kegiatan", "total": "Rp 400.000", "sumber": "BOSP Reguler" }
    ],
    "total_anggaran": "Rp 2.450.000"
  },
  "bab_4_monitoring_evaluasi": {
    "mekanisme": [
      "Mekanisme monitoring dilaksanakan secara berlapis: pemantauan harian oleh wali kelas, supervisi klinis bulanan oleh Kepala Sekolah, dan rapat evaluasi tim kurikulum.",
      "Instrumen pemantauan menggunakan lembar observasi ketercapaian, rekapitulasi jurnal harian, dan dokumentasi portofolio perkembangan murid."
    ],
    "indikator": [
      "Indikator Proses: Keterlaksanaan seluruh agenda aksi kerja dan partisipasi aktif dewan guru mencapai minimal 95%.",
      "Indikator Output: Keterisian jurnal kendali siswa secara mandiri dan ditandatangani orang tua mencapai lebih dari 90% setiap pekan.",
      "Indikator Dampak (Outcome): Peningkatan skor karakter dan iklim keamanan pada Rapor Pendidikan sekolah serta terbentuknya budaya saling menghargai tanpa kekerasan."
    ],
    "evaluasi": [
      "Evaluasi formatif dilaksanakan setiap akhir bulan dalam forum Komunitas Belajar (Kombel) sekolah untuk mengidentifikasi kendala teknis dan menemukan solusi cepat.",
      "Evaluasi sumatif dilakukan pada akhir semester untuk mengukur ketercapaian target tahunan dan dasar penyusunan program kerja siklus berikutnya."
    ],
    "tindak_lanjut": [
      "Tindak Lanjut Murid: Penganugerahan pin/sertifikat Bintang Kebaikan bagi siswa teladan serta pendampingan personal ramah anak (peer mentoring) bagi siswa yang membutuhkan penguatan.",
      "Tindak Lanjut Pendidik: Sesi coaching klinis dan diseminasi praktik baik antar guru dalam forum Hari Belajar Guru guna menjaga konsistensi keteladanan."
    ]
  },
  "bab_5_penutup": {
    "kesimpulan": [
      "Dokumen Program Kerja ini merupakan komitmen kolektif satuan pendidikan dalam membangun ekosistem pembelajar yang berkarakter, unggul, dan berdaya saing sesuai tuntutan Kurikulum Merdeka.",
      "Keberhasilan dan keberlanjutan program bertumpu pada keteladanan pendidik (ing ngarso sung tulodo) serta sinergi erat Tripusat Pendidikan (sekolah, keluarga, dan masyarakat)."
    ],
    "saran": [
      "Dewan guru diharapkan senantiasa menjaga konsistensi keteladanan dan menjadikan setiap ruang kelas sebagai wahana penumbuhan budaya positif yang aman dan ramah anak.",
      "Orang tua murid diharapkan memberikan dukungan afektif dan waktu berkualitas dalam berdialog bersama anak saat memvalidasi jurnal pembiasaan di rumah.",
      "Pengawas pembina dan Dinas Pendidikan diharapkan terus memberikan supervisi konstruktif guna menjaga akuntabilitas dan mutu implementasi program di sekolah."
    ]
  }
}`;
}

// ============================================
// Pembangun Prompt Per-Bab Spesifik (Hemat Token & Lebih Mendalam)
// ============================================
export function buildSectionPrompt(
  section: 'bab1' | 'bab2' | 'bab3' | 'bab4_5',
  params: {
    template: string;
    identitas: {
      namaSekolah: string;
      tahunAjaran: string;
      jenjang: string;
      faseKelas?: string;
      penyusun: string;
      nipPenyusun?: string;
      jabatanPenyusun?: string;
      kepalaSekolah?: string;
      nipKepalaSekolah?: string;
      komiteSekolah?: string;
      pengawas?: string;
      kota?: string;
    };
    spesifik: Record<string, any>;
    currentData?: any;
  }
): string {
  const { template, identitas, spesifik } = params;
  const legalList = regulasiProgramDatabase[template] || regulasiProgramDatabase['kustom'];

  let fokusDeskripsi = '';
  if (template === 'kokurikuler-p5' || template === 'kokurikuler-profil-lulusan') {
    fokusDeskripsi = `Tema Kokurikuler: "${spesifik.tema || 'Gaya Hidup Berkelanjutan'}". Alokasi JP: ${spesifik.alokasiJp || '108 JP/Tahun'}. Fokus 8 Dimensi Profil Lulusan (SK BSKAP 058/H/KR/2025): ${Array.isArray(spesifik.dimensi) ? spesifik.dimensi.join(', ') : (spesifik.dimensi || 'Keimanan & Ketakwaan, Kewargaan, Penalaran Kritis, Kolaborasi')}. Model: ${spesifik.modelJadwal || 'Model Blok Terpusat'}. Asesmen 3 Tingkat: Berkembang, Cakap, Mahir.`;
  } else if (template === '7kaih') {
    fokusDeskripsi = `Program 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) dan 7 Poe Atikan Purwakarta Istimewa. Fokus: ${spesifik.fokusKebiasaan || 'Pembiasaan Harian'}. Catatan: ${spesifik.catatan || 'Keterlibatan orang tua'}.`;
  } else if (template === 'hari-belajar-guru') {
    fokusDeskripsi = `Program Hari Belajar Guru (HBG) & Kombel. Frekuensi: ${spesifik.frekuensi || '1x Pekan'}. Materi: ${spesifik.fokusMateri || 'Refleksi Pembelajaran'}.`;
  } else if (template === 'literasi') {
    fokusDeskripsi = `Gerakan Literasi Sekolah (GLS). Fokus: ${spesifik.fokus || 'Pojok Baca & Membaca Senyap 15 Menit'}.`;
  } else if (template === 'uks') {
    fokusDeskripsi = `UKS dan Sekolah Sehat (Trias UKS). Mitra: ${spesifik.mitra || 'Puskesmas'}. Fokus: ${spesifik.fokus || 'Skrining berkala'}.`;
  } else if (template === 'adiwiyata') {
    fokusDeskripsi = `Adiwiyata & Lingkungan Hidup (PBLHS + TdBA Purwakarta). Target: ${spesifik.targetLevel || 'Kabupaten'}. Aksi: ${spesifik.aksiUtama || 'Bank Sampah & Kebun Sekolah'}.`;
  } else if (template === 'keagamaan') {
    fokusDeskripsi = `Pembiasaan Keagamaan & Budi Pekerti. Jadwal: ${spesifik.jadwalIbadah || 'Sholat Berjamaah & Tadarus'}.`;
  } else if (template === 'kalender-sekolah') {
    fokusDeskripsi = `Program Kalender Pendidikan Satuan Pendidikan (KPSP) berlandaskan Permendikdasmen No. 13 Tahun 2025 dan SE Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026. Target: 36 Pekan Efektif (18 Smt 1 + 18 Smt 2). Agenda PHBI: ${spesifik.agendaKeagamaan || 'Maulid Nabi, Rajaban, Masantren Ramadhan'}. Daerah: ${spesifik.agendaPurwakarta || 'Hari Jadi Purwakarta, TdBA'}.`;
  } else {
    fokusDeskripsi = `Program: ${spesifik.judulKustom || 'Inovasi Sekolah'}. Deskripsi: ${spesifik.deskripsiKustom || 'Pengembangan Mutu'}.`;
  }

  const baseHeader = `Anda adalah Pakar Manajemen Pendidikan Nasional dan Pengembang Kurikulum Kemendikdasmen RI.
Tugas Anda adalah menyusun salah satu bab spesifik dari Dokumen Program Kerja Sekolah Resmi secara sangat komprehensif, kaya narasi ilmiah, dan sangat operasional.

IDENTITAS PROGRAM:
- Nama Satuan Pendidikan: ${identitas.namaSekolah || 'SD Negeri Binaan'}
- Tahun Ajaran: ${identitas.tahunAjaran || '2025/2026'}
- Jenjang: ${identitas.jenjang || 'Sekolah Dasar (SD)'}
- Sasaran: ${identitas.faseKelas || 'Fase A, B, dan C (Kelas 1 - 6)'}
- Penyusun: ${identitas.penyusun || 'Tim Pengembang Kurikulum'}
- Kepala Sekolah: ${identitas.kepalaSekolah || 'Kepala Satuan Pendidikan'}
- Fokus & Parameter: ${fokusDeskripsi}
`;

  if (section === 'bab1') {
    return `${baseHeader}
BAGIAN YANG HARUS DISUSUN: BAB I PENDAHULUAN
Aturan Penulisan:
1. Latar Belakang: Buat minimal 3-4 paragraf ilmiah berbobot tinggi:
   - Paragraf 1 (Das Sollen): Standar Nasional Pendidikan, Permendikdasmen No. 13 Tahun 2025, Asta Cita ke-4 Kabinet Merah Putih, dan Visi Indonesia Emas 2045.
   - Paragraf 2 (Das Sein): Potret kondisi empiris sekolah, data Rapor Pendidikan (iklim keamanan, karakter, literasi-numerasi), dan tantangan perilaku nyata murid.
   - Paragraf 3 (Solusi Strategis): Urgensi dan rasionalisasi program kerja sebagai intervensi terukur.
2. Dasar Hukum: Rujuk peraturan resmi hierarkis:
${legalList.map(l => `   * ${l}`).join('\n')}
3. Tujuan Program: Minimal 4 butir berprinsip SMART dengan kata kerja operasional (KKO) terukur.
4. Sasaran: Rincikan sasaran murid per fase/kelas, pendidik, serta orang tua/komite.
5. Manfaat Program: Dirinci dalam 4 pilar: (1) Bagi Murid, (2) Bagi Pendidik & Tenaga Kependidikan, (3) Bagi Satuan Pendidikan, dan (4) Bagi Orang Tua & Masyarakat.

OUTPUT WAJIB: Keluarkan HANYA satu objek JSON valid tanpa markdown (tanpa \`\`\`json):
{
  "bab_1_pendahuluan": {
    "latar_belakang": ["Paragraf 1...", "Paragraf 2...", "Paragraf 3..."],
    "dasar_hukum": [
${legalList.map(l => `      "${l}"`).join(',\n')}
    ],
    "tujuan": ["Tujuan 1...", "Tujuan 2...", "Tujuan 3...", "Tujuan 4..."],
    "sasaran": ["Sasaran murid...", "Sasaran pendidik...", "Sasaran orang tua..."],
    "manfaat": [
      "Bagi Murid: ...",
      "Bagi Pendidik & Tenaga Kependidikan: ...",
      "Bagi Satuan Pendidikan: ...",
      "Bagi Orang Tua & Masyarakat: ..."
    ]
  }
}`;
  }

  if (section === 'bab2') {
    return `${baseHeader}
BAGIAN YANG HARUS DISUSUN: BAB II KAJIAN KONSEPTUAL DAN LANDASAN TEORITIS
Aturan Penulisan:
1. Susun kajian teori yang kuat, mendalam, dan kontekstual sesuai jenis program:
   - Jika Kokurikuler: Teori Experiential Learning David Kolb, Framework Pembelajaran Mendalam (Deep Learning), 4 Prinsip Kokurikuler, dan 8 Dimensi Profil Lulusan (SK BSKAP No. 058/H/KR/2025).
   - Jika 7KAIH: Teori Habituasi Ki Hajar Dewantara, Teori Belajar Sosial Albert Bandura (Modeling), Harmonisasi 7 Poe Atikan Purwakarta Istimewa.
   - Jika Hari Belajar Guru: Community of Practice Etienne Wenger, Andragogi Malcolm Knowles, Inkuiri Kolaboratif.
   - Jika Literasi: Balanced Literacy, 3 Tahap GLS (Pembiasaan, Pengembangan, Pembelajaran).
   - Jika UKS: Trias UKS, Gerakan Sekolah Sehat (5 Sehat).
   - Jika Adiwiyata: Etika Lingkungan Hidup, PBLHS, Integrasi TdBA Purwakarta.
   - Jika Keagamaan: Kecerdasan Spiritual, Keteladanan Akhlak Mulia, Moderasi Beragama.
2. Buat judul_bab dan minimal 2-3 sub_bab dengan ulasan ilmiah 2-3 paragraf mendalam per sub-bab.

OUTPUT WAJIB: Keluarkan HANYA satu objek JSON valid tanpa markdown (tanpa \`\`\`json):
{
  "bab_2_kajian_konseptual": {
    "judul_bab": "KAJIAN KONSEPTUAL DAN LANDASAN PENGUATAN...",
    "sub_bab": [
      {
        "judul": "A. Kajian Teori Pokok...",
        "isi": ["Paragraf ulasan 1...", "Paragraf ulasan 2..."]
      },
      {
        "judul": "B. Prinsip dan Dimensi Pelaksanaan...",
        "isi": ["Paragraf ulasan 1...", "Paragraf ulasan 2..."]
      },
      {
        "judul": "C. Pembudayaan Berkelanjutan...",
        "isi": ["Paragraf ulasan 1...", "Paragraf ulasan 2..."]
      }
    ]
  }
}`;
  }

  if (section === 'bab3') {
    return `${baseHeader}
BAGIAN YANG HARUS DISUSUN: BAB III RENCANA PROGRAM DAN STRATEGI PELAKSANAAN
Aturan Penulisan:
1. Rencana Kegiatan Aksi Nyata: Susun minimal 6-8 kegiatan konkret operasional. Setiap kegiatan memuat:
   - nama, deskripsi, tahapan (3 tahap: 1. Persiapan/Pra, 2. Pelaksanaan Inti, 3. Output/Artefak Fisik), tujuan, waktu, sasaran, pic.
2. Tim Pelaksana & Uraian Tugas: Susun struktur tim (Penanggung Jawab, Ketua Pelaksana, Sekretaris, Bendahara, Seksi Acara, Seksi Sarpras, Seksi Dokumentasi) beserta tugas pokok fungsinya.
3. Matriks Action Plan 12 Bulan (Juli-Juni) yang membedakan kegiatan mingguan/bulanan dan evaluasi semester.
4. Dukungan Sarana & Rencana Anggaran Biaya (RAB):
   - Uraikan sarana prasarana penunjang.
   - Susun tabel rincian_biaya realistis (5-7 pos pengeluaran BOS) dengan kolom total_anggaran terakumulasi logis (Rp 1.500.000 s.d Rp 5.000.000).

OUTPUT WAJIB: Keluarkan HANYA satu objek JSON valid tanpa markdown (tanpa \`\`\`json):
{
  "bab_3_rencana_program": {
    "kegiatan_utama": [
      {
        "nama": "Nama Kegiatan 1",
        "deskripsi": "Deskripsi operasional...",
        "tahapan": ["1. Persiapan: ...", "2. Pelaksanaan: ...", "3. Output: ..."],
        "tujuan": "Tujuan terukur...",
        "waktu": "Waktu spesifik...",
        "sasaran": "Sasaran peserta...",
        "pic": "Penanggung jawab..."
      }
    ],
    "tim_pelaksana": {
      "penanggung_jawab": "Kepala Sekolah",
      "ketua": "${identitas.penyusun || 'Koordinator Program'}",
      "sekretaris": "Nama Guru",
      "bendahara": "Nama Guru",
      "seksi_bidang": [
        { "bidang": "Seksi Acara & Fasilitator", "tugas": "Mengatur skenario kegiatan..." },
        { "bidang": "Seksi Logistik & Sarpras", "tugas": "Menyiapkan alat dan bahan..." },
        { "bidang": "Seksi Dokumentasi & Publikasi", "tugas": "Mendokumentasikan karya murid..." }
      ]
    },
    "jadwal_pelaksanaan": [
      { "bulan": "Juli", "minggu_ke": "Pekan 3-4", "kegiatan": "Sosialisasi & Pembentukan Tim", "pic": "Tim Pengembang" }
    ],
    "anggaran_dan_sarana": {
      "sarana_prasarana": ["Sarana 1...", "Sarana 2..."],
      "rincian_biaya": [
        { "pos_anggaran": "Pengadaan Bahan...", "volume": "1 Paket", "harga_satuan": "Rp 500.000", "total": "Rp 500.000", "sumber": "BOS Reguler" }
      ],
      "total_anggaran": "Rp 2.500.000"
    }
  }
}`;
  }

  // bab4_5
  return `${baseHeader}
BAGIAN YANG HARUS DISUSUN: BAB IV (MONITORING, EVALUASI & TINDAK LANJUT) DAN BAB V (PENUTUP)
Aturan Penulisan:
1. BAB IV MONITORING, EVALUASI, DAN TINDAK LANJUT:
   - Mekanisme Pemantauan: Monitoring harian oleh wali kelas, supervisi bulanan kepala sekolah, dan evaluasi tim kurikulum.
   - Indikator: Rincikan minimal 3 tingkatan indikator keberhasilan SMART:
     (1) Indikator Proses (keterlaksanaan aksi >= 95%).
     (2) Indikator Output (kelengkapan jurnal dan artefak murid >= 85%).
     (3) Indikator Dampak / Outcome (peningkatan iklim karakter/keamanan).
   - Evaluasi & Refleksi Berkala.
   - Tindak Lanjut & Apresiasi: Pemberian bintang kebaikan/apresiasi berkala dan bimbingan/refleksi kolektif.
2. BAB V PENUTUP:
   - Kesimpulan: Komitmen integritas pelaksanaan program di sekolah.
   - Saran & Rekomendasi: Rekomendasi konkret bagi Pendidik, Murid, Orang Tua, dan Dinas Pendidikan.

OUTPUT WAJIB: Keluarkan HANYA satu objek JSON valid tanpa markdown (tanpa \`\`\`json):
{
  "bab_4_monitoring": {
    "mekanisme": ["Pemantauan harian...", "Supervisi bulanan..."],
    "indikator_keberhasilan": [
      "Indikator Proses: Keterlaksanaan seluruh agenda aksi mencapai minimal 95%.",
      "Indikator Output: Kelengkapan instrumen jurnal refleksi murid mencapai minimal 90%.",
      "Indikator Dampak (Outcome): Peningkatan nilai karakter dan iklim sekolah..."
    ],
    "evaluasi_dan_refleksi": ["Refleksi tengah semester...", "Audit portofolio akhir tahun..."],
    "tindak_lanjut": ["Apresiasi piagam/lencana...", "Bimbingan terpadu..."]
  },
  "bab_5_penutup": {
    "kesimpulan": ["Kesimpulan komitmen 1...", "Kesimpulan kesinambungan 2..."],
    "saran": ["Bagi Pendidik: ...", "Bagi Orang Tua: ...", "Bagi Dinas Pendidikan: ..."]
  }
}`;
}

// ============================================
// Validator & Repairer Output AI
// ============================================
export function validateAndRepairProgramResult(raw: any, input: any): ProgramSekolahData {
  let parsed: any = raw;
  if (typeof raw === 'string') {
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch (_) {
      parsed = {};
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    parsed = {};
  }

  const templateId = input.template || parsed.metadata?.template_id || 'kokurikuler-p5';
  const defLegal = regulasiProgramDatabase[templateId] || regulasiProgramDatabase['kustom'];

  const metadata = {
    template_id: templateId,
    judul_program: parsed.metadata?.judul_program || (templateId === 'kalender-sekolah' ? 'PROGRAM KALENDER PENDIDIKAN SATUAN PENDIDIKAN (KPSP)' : (input.spesifik?.judulKustom || 'PROGRAM KERJA PEMBIASAAN DAN BUDAYA POSITIF SEKOLAH')),
    subjudul: parsed.metadata?.subjudul || (templateId === 'kalender-sekolah' ? 'Pedoman Alokasi Waktu Efektif Belajar, Hari Libur, dan Matriks Agenda Tahunan Sekolah Berdasarkan Regulasi Nasional & Disdik Purwakarta' : 'Pedoman Operasional Penumbuhan Karakter dan Mutu Pendidikan'),
    nama_sekolah: input.identitas?.namaSekolah || parsed.metadata?.nama_sekolah || 'SD NEGERI KABUPATEN PURWAKARTA',
    tahun_ajaran: input.identitas?.tahunAjaran || parsed.metadata?.tahun_ajaran || '2025/2026',
    jenjang: input.identitas?.jenjang || parsed.metadata?.jenjang || 'Sekolah Dasar (SD)',
    fase_jenjang: parsed.metadata?.fase_jenjang || input.identitas?.faseKelas || 'Fase A, B, dan C (Kelas 1 - 6)',
    penyusun: input.identitas?.penyusun || parsed.metadata?.penyusun || 'Tim Pengembang Kurikulum',
    nip_penyusun: input.identitas?.nipPenyusun || parsed.metadata?.nip_penyusun || '',
    jabatan_penyusun: input.identitas?.jabatanPenyusun || parsed.metadata?.jabatan_penyusun || 'Koordinator Program',
    kepala_sekolah: input.identitas?.kepalaSekolah || parsed.metadata?.kepala_sekolah || 'Kepala Satuan Pendidikan',
    nip_kepala_sekolah: input.identitas?.nipKepalaSekolah || parsed.metadata?.nip_kepala_sekolah || '',
    komite_sekolah: input.identitas?.komiteSekolah || parsed.metadata?.komite_sekolah || 'Ketua Komite Sekolah',
    pengawas: input.identitas?.pengawas || parsed.metadata?.pengawas || 'Pengawas Pembina',
    nip_pengawas: input.identitas?.nipPengawas || parsed.metadata?.nip_pengawas || '',
    kota: input.identitas?.kota || parsed.metadata?.kota || 'Purwakarta',
    tanggal_pengesahan: parsed.metadata?.tanggal_pengesahan || 'Juli 2025',
    opsi_pengesahan: input.identitas?.opsiPengesahan || input.opsi_pengesahan || parsed.metadata?.opsi_pengesahan || 'lengkap',
  };

  const bab_1_pendahuluan = {
    latar_belakang: parsed.bab_1_pendahuluan?.latar_belakang || [
      'Pendidikan dasar memiliki peran fundamental dalam meletakkan fondasi karakter moral, integritas, dan kecakapan literasi-numerasi murid. Dalam konteks pembangunan nasional era Kabinet Merah Putih dan visi Indonesia Emas 2045, penguatan karakter menjadi pilar utama mencetak generasi yang cerdas sekaligus berakhlak mulia (Das Sollen).',
      'Data Rapor Pendidikan dan evaluasi empiris di lingkungan satuan pendidikan menunjukkan adanya tantangan nyata terkait konsistensi pembiasaan positif, penurunan durasi membaca mandiri, serta dinamika interaksi sosial murid yang memerlukan pengawalan intensif (Das Sein).',
      'Guna menjembatani kesenjangan tersebut, satuan pendidikan menyusun Dokumen Program Kerja ini sebagai kompas operasional terencana, terukur, dan berkelanjutan yang melibatkan seluruh ekosistem tripusat pendidikan.',
    ],
    dasar_hukum: Array.isArray(parsed.bab_1_pendahuluan?.dasar_hukum) && parsed.bab_1_pendahuluan.dasar_hukum.length > 0
      ? parsed.bab_1_pendahuluan.dasar_hukum
      : defLegal,
    tujuan: Array.isArray(parsed.bab_1_pendahuluan?.tujuan) && parsed.bab_1_pendahuluan.tujuan.length > 0
      ? parsed.bab_1_pendahuluan.tujuan
      : [
          'Menginternalisasikan nilai karakter profil pelajar berintegritas dalam rutinitas harian murid secara konsisten.',
          'Menciptakan iklim pembelajaran yang aman, inklusif, sehat, dan menyenangkan bebas dari segala bentuk kekerasan.',
          'Mengoptimalkan kolaborasi sinergis antara pendidik, orang tua murid, dan komite sekolah dalam pembiasaan positif.',
          'Menyediakan instrumen kerja dan pedoman monitoring terstandar bagi akuntabilitas kinerja satuan pendidikan.',
        ],
    sasaran: parsed.bab_1_pendahuluan?.sasaran || [
      'Sasaran program mencakup seluruh murid jenjang ' + metadata.jenjang + ' (' + metadata.fase_jenjang + '), segenap dewan guru dan tenaga kependidikan, serta perwakilan komite dan orang tua siswa.',
    ],
    manfaat: Array.isArray(parsed.bab_1_pendahuluan?.manfaat) && parsed.bab_1_pendahuluan.manfaat.length > 0
      ? parsed.bab_1_pendahuluan.manfaat
      : [
          'Bagi Murid: Membentuk kepribadian mandiri, disiplin beribadah, empati sosial, dan ketangguhan mental.',
          'Bagi Pendidik & Tenaga Kependidikan: Memudahkan pemantauan perkembangan sikap dan perilaku anak secara terstruktur dan objektif.',
          'Bagi Satuan Pendidikan: Meningkatkan skor iklim karakter dan iklim keamanan sekolah pada Rapor Pendidikan.',
          'Bagi Orang Tua & Masyarakat: Mempererat komunikasi dan kemitraan dalam mendampingi tumbuh kembang anak di rumah.',
        ],
  };

  // Koleksi Default Sub Bab Kajian Teoritis Spesifik Per Template
  const theoreticalFrameworks: Record<string, { judul_bab: string; sub_bab: Array<{ judul: string; isi: string[] }> }> = {
    'kokurikuler-p5': {
      judul_bab: 'KAJIAN KONSEPTUAL DAN LANDASAN PENGUATAN 8 DIMENSI PROFIL LULUSAN',
      sub_bab: [
        {
          judul: 'Teori Belajar Berbasis Pengalaman (Kolb\'s Experiential Learning) & Pembelajaran Mendalam (Deep Learning)',
          isi: [
            'Kegiatan kokurikuler penguatan profil lulusan berakar pada teori experiential learning David Kolb yang diselaraskan dengan kerangka kerja Pembelajaran Mendalam (Deep Learning). Pembelajaran dirancang bermakna (meaningful), menyenangkan (joyful), dan berpusat pada murid melalui siklus pengalaman nyata, observasi reflektif, konseptualisasi abstrak, dan eksperimen aktif.',
            'Melalui kegiatan kokurikuler, murid tidak hanya mengkaji konsep moral secara teoritis, melainkan terjun langsung mengidentifikasi tantangan lingkungan, berdialog, merancang solusi inovatif, dan merefleksikan dampaknya bagi masyarakat sesuai 8 Dimensi Profil Lulusan.',
          ],
        },
        {
          judul: 'Prinsip Kunci Pelaksanaan: Holistik, Kontekstual, Berpusat pada Murid, dan Eksploratif 3 Tingkat',
          isi: [
            'Permendikdasmen No. 13 Tahun 2025 dan SK BSKAP No. 058/H/KR/2025 menetapkan empat prinsip utama pelaksanaan kokurikuler:',
            '1. Holistik: Memandang tema kegiatan secara terpadu tanpa sekat-sekat mata pelajaran formal.',
            '2. Kontekstual: Mengangkat isu nyata yang terjadi di lingkungan sekitar satuan pendidikan.',
            '3. Berpusat pada Murid: Menempatkan murid sebagai subjek pembelajar aktif yang memiliki suara (voice), pilihan (choice), dan kepemilikan (ownership).',
            '4. Eksploratif & 3 Tahapan: Mengukur capaian kompetensi melalui 3 tahapan perkembangan (Berkembang, Cakap, Mahir) dengan tingkat Cakap sebagai Standar Kompetensi Lulusan (SKL).',
          ],
        },
      ],
    },
    '7kaih': {
      judul_bab: 'KAJIAN KONSEPTUAL DAN HARMONISASI BUDAYA KARAKTER',
      sub_bab: [
        {
          judul: 'Konsepsi Habituasi Ki Hajar Dewantara dan Teori Pemodelan Albert Bandura',
          isi: [
            'Menurut Ki Hajar Dewantara, pendidikan budi pekerti merupakan proses menumbuhkembangkan kebiasaan baik (habituasi) secara berulang hingga menyatu dalam jiwa anak. Habituasi menuntut keteladanan nyata (Ing Ngarso Sung Tulodo).',
            'Teori Pembelajaran Sosial Albert Bandura mempertegas bahwa anak belajar melalui observasi dan imitasi perilaku lingkungan sekitarnya. Konsistensi keteladanan guru dan orang tua menjadi penentu keberhasilan pembiasaan 7 Karakter Utama Anak Indonesia Hebat.',
          ],
        },
        {
          judul: 'Harmonisasi dengan Falsafah 7 Poé Atikan Purwakarta Istimewa & TdBA',
          isi: [
            'Program 7 KAIH disinergikan secara harmonis dengan kearifan lokal 7 Poé Atikan Purwakarta Istimewa:',
            'Siklus tematik harian: Senin Ajeg Nusantara (patriotisme), Selasa Mapag Buana (wawasan global), Rabu Maneuh di Sunda (adab dan bahasa daerah), Kamis Nyanding Wawangi (estetika dan empati), Jumat Nyucikeun Diri (spiritualitas), serta Sabtu-Minggu Betah di Imah (interaksi keluarga).',
            'Program Tatanen di Bale Atikan (TdBA) turut diintegrasikan guna memupuk karakter peduli lingkungan hidup melalui aksi nyata bercocok tanam organik dan menjaga kelestarian alam sekitar sekolah.',
          ],
        },
      ],
    },
    'hari-belajar-guru': {
      judul_bab: 'LANDASAN PENGEMBANGAN PROFESIONALISME GURU DAN KOMUNITAS BELAJAR',
      sub_bab: [
        {
          judul: 'Teori Komunitas Praktisi (Community of Practice) Etienne Wenger',
          isi: [
            'Peningkatan mutu pendidik paling efektif terjadi ketika guru belajar bersama dalam Komunitas Praktisi (Community of Practice). Guru saling berinteraksi secara rutin membahas isu nyata pembelajaran di kelas (domain), membangun relasi saling percaya (community), serta menghasilkan perangkat dan solusi bersama (practice).',
            'Prinsip Andragogi Malcolm Knowles melandasi pelaksanaan Hari Belajar Guru: pembelajaran orang dewasa bersifat mandiri, berbasis pengalaman nyata, berorientasi masalah praktis, dan didorong oleh motivasi intrinsik.',
          ],
        },
        {
          judul: 'Siklus Inkuiri Kolaboratif Berbasis Evaluasi Rapor Pendidikan',
          isi: [
            'Komunitas Belajar (Kombel) sekolah bergerak melalui 4 siklus inkuiri kolaboratif:',
            '1. Refleksi Bersama: Mengkaji data asesmen siswa dan capaian indikator Rapor Pendidikan.',
            '2. Perencanaan Solusi: Menyusun modul ajar berdiferensiasi dan instrumen asesmen yang tepat.',
            '3. Aksi Nyata & Observasi: Menerapkan inovasi pembelajaran di ruang kelas.',
            '4. Evaluasi & Replikasi: Mengidentifikasi dampak nyata bagi kemajuan belajar murid dan menyebarkan praktik baik.',
          ],
        },
      ],
    },
    'literasi': {
      judul_bab: 'KAJIAN PENGUATAN GERAKAN LITERASI DAN LINGKUNGAN KAYA TEKS',
      sub_bab: [
        {
          judul: 'Tiga Tahap Gerakan Literasi Sekolah (GLS): Pembiasaan, Pengembangan, Pembelajaran',
          isi: [
            'Gerakan Literasi Sekolah dilaksanakan secara bertahap dan berjenjang:',
            'Tahap 1 Pembiasaan: Menumbuhkan minat baca melalui kegiatan 15 menit membaca buku non-pelajaran sebelum jam belajar dimulai.',
            'Tahap 2 Pengembangan: Mengembangkan daya analisis dan pemahaman melalui respons bacaan seperti Pohon Geulis, jurnal baca, dan resensi lisan.',
            'Tahap 3 Pembelajaran: Memanfaatkan keterampilan literasi multimodal untuk menunjang seluruh mata pelajaran secara mendalam.',
          ],
        },
        {
          judul: 'Pendekatan Balanced Literacy dan Penataan Pojok Baca Ramah Anak',
          isi: [
            'Pendekatan literasi berimbang (Balanced Literacy) memadukan membaca nyaring (read aloud), membaca bersama (shared reading), dan membaca mandiri (independent reading).',
            'Penciptaan lingkungan kaya teks (print-rich environment) di setiap ruang kelas melalui pojok baca inovatif menstimulasi rasa ingin tahu dan membangun budaya gemar membaca sejak usia dini.',
          ],
        },
      ],
    },
    'uks': {
      judul_bab: 'LANDASAN TRIAS UKS DAN GERAKAN SEKOLAH SEHAT',
      sub_bab: [
        {
          judul: 'Paradigma Trias UKS: Pendidikan, Pelayanan, dan Lingkungan Sehat',
          isi: [
            'Usaha Kesehatan Sekolah (UKS) berpijak pada tiga pilar utama (Trias UKS):',
            '1. Pendidikan Kesehatan: Memberikan pengetahuan hidup bersih, gizi seimbang, dan kesehatan reproduksi dini.',
            '2. Pelayanan Kesehatan: Pemeriksaan berkala, imunisasi BIAS bersama Puskesmas, dan penanganan dini keluhan kesehatan murid.',
            '3. Pembinaan Lingkungan Sehat: Pemeliharaan sanitasi jamban, kantin sehat, dan kawasan sekolah bebas rokok serta jentik nyamuk.',
          ],
        },
        {
          judul: 'Integrasi 5 Sehat Gerakan Sekolah Sehat (GSS)',
          isi: [
            'Gerakan Sekolah Sehat mengintegrasikan lima pilar sehat: Sehat Bergizi (sarapan sehat dan konsumsi air putih), Sehat Fisik (senam bersama dan peregangan), Sehat Imunisasi (kelengkapan vaksinasi dasar), Sehat Jiwa (iklim bebas perundungan dan kenyamanan psikologis), serta Sehat Lingkungan (kebersihan drainase dan pemilahan sampah).',
          ],
        },
      ],
    },
    'adiwiyata': {
      judul_bab: 'KAJIAN PENDIDIKAN LINGKUNGAN HIDUP DAN GERAKAN PBLHS',
      sub_bab: [
        {
          judul: 'Etika Lingkungan Hidup dan Prinsip Gerakan PBLHS',
          isi: [
            'Pendidikan Adiwiyata berlandaskan pada etika lingkungan hidup (Deep Ecology), yang memandang bahwa manusia merupakan bagian tak terpisahkan dari ekosistem alam.',
            'Gerakan Peduli dan Berbudaya Lingkungan Hidup di Sekolah (PBLHS) menerapkan prinsip partisipatif dan berkelanjutan melalui integrasi kurikulum, pengelolaan sarana ramah lingkungan, dan kemitraan masyarakat.',
          ],
        },
        {
          judul: 'Ekonomi Sirkular Sekolah dan Integrasi TdBA Purwakarta',
          isi: [
            'Satuan pendidikan menerapkan prinsip 3R (Reduce, Reuse, Recycle) dan budidaya tanaman organik melalui program Tatanen di Bale Atikan (TdBA).',
            'Murid dilatih mengolah sampah organik menjadi kompos, merawat kebun sekolah, serta mengurangi timbulan sampah plastik sekali pakai secara berkelanjutan.',
          ],
        },
      ],
    },
    'keagamaan': {
      judul_bab: 'LANDASAN PEMBIASAAN KEAGAMAAN DAN AKHLAK MULIA',
      sub_bab: [
        {
          judul: 'Penanaman Nilai Religiusitas dan Kecerdasan Spiritual (SQ) Anak',
          isi: [
            'Kecerdasan spiritual (Spiritual Intelligence) membimbing anak memiliki kesadaran moral tertinggi, integritas batin, dan kepekaan nurani terhadap sesama makhluk ciptaan Tuhan.',
            'Pembiasaan ibadah rutin teratur (sholat dhuha/dzuhur berjamaah, tadarus Al-Qur\'an/doa pagi) melatih disiplin spiritual dan menumbuhkan ketenangan jiwa murid dalam mengikuti pembelajaran.',
          ],
        },
        {
          judul: 'Penguatan Adab Mulia dan Budaya Moderasi Beragama yang Toleran',
          isi: [
            'Pendidikan karakter religius di sekolah senantiasa menjunjung tinggi nilai akhlak mulia dan moderasi beragama.',
            'Satuan pendidikan memastikan seluruh murid dari berbagai latar belakang keyakinan mendapatkan hak bimbingan ibadah yang layak dengan menumbuhkan rasa saling menghormati dan kerukunan sejati.',
          ],
        },
      ],
    },
    'kalender-sekolah': {
      judul_bab: 'LANDASAN YURIDIS, KONSEPTUAL, DAN PENGELOLAAN WAKTU BELAJAR SATUAN PENDIDIKAN',
      sub_bab: [
        {
          judul: 'Prinsip Time on Task dan Efektivitas Waktu Pembelajaran Mendalam (Deep Learning)',
          isi: [
            'Waktu belajar merupakan modalitas fundamental dalam proses pendidikan. Teori efektivitas instruksional menegaskan bahwa alokasi waktu aktif belajar (Time on Task) yang optimal dan terlindungi dari interupsi berkorelasi langsung terhadap penguasaan kompetensi dan kedalaman pemahaman (Deep Learning) murid.',
            'Pengaturan kalender pendidikan satuan pendidikan dirancang untuk menjamin pemenuhan hak belajar murid sekurang-kurangnya 36 pekan efektif per tahun ajaran sesuai ketentuan Permendikdasmen Nomor 13 Tahun 2025.',
          ],
        },
        {
          judul: 'Harmonisasi Kalender Nasional, Kalender Hijriah (PHBI), dan Kearifan Lokal 7 Poé Atikan Purwakarta',
          isi: [
            'Penyusunan kalender pendidikan di satuan pendidikan memadukan tiga dimensi kalender secara sinergis: (1) Kalender Akademik Nasional berbasis hari efektif KBM dan asesmen sumatif, (2) Kalender Hijriah untuk peringatan hari besar keagamaan (Maulid Nabi Muhammad SAW, Rajaban/Isra Mi’raj, dan Masantren di Sakola selama bulan Ramadhan), serta (3) Kalender Budaya Karakter Purwakarta (7 Poé Atikan dan Tatanen di Bale Atikan).',
            'Sesuai Surat Edaran Kadisdik Purwakarta Nomor 400.3.5/2367-Dikdas/2026, pekan efektif dihitung dengan ketentuan minimal tiga hari efektif KBM dalam satu minggu, menghasilkan pembagian presisi 18 pekan efektif pada Semester 1 dan 18 pekan efektif pada Semester 2.',
          ],
        },
      ],
    },
    'kustom': {
      judul_bab: 'LANDASAN PENGEMBANGAN MUTU DAN INOVASI PENDIDIKAN SEKOLAH',
      sub_bab: [
        {
          judul: 'Manajemen Berbasis Sekolah (MBS) dan Siklus Mutu PDCA',
          isi: [
            'Program kerja sekolah dirancang menggunakan prinsip Manajemen Berbasis Sekolah (MBS) yang mandiri, transparan, dan akuntabel.',
            'Implementasi program mengikuti siklus perbaikan berkelanjutan Plan-Do-Check-Act (PDCA) guna memastikan setiap inisiatif perubahan memberikan dampak positif langsung terhadap prestasi dan karakter murid.',
          ],
        },
        {
          judul: 'Pemberdayaan Ekosistem Kolaboratif Satuan Pendidikan',
          isi: [
            'Mutu pendidikan merupakan hasil orkestrasi seluruh elemen sekolah: kepemimpinan instruksional kepala sekolah, dedikasi pendidik, partisipasi aktif orang tua, dan dukungan masyarakat luas.',
          ],
        },
      ],
    },
  };

  const selectedFramework = theoreticalFrameworks[templateId] || theoreticalFrameworks['kustom'];

  const bab_2_kajian_konseptual = {
    judul_bab: parsed.bab_2_kajian_konseptual?.judul_bab || selectedFramework.judul_bab,
    sub_bab: Array.isArray(parsed.bab_2_kajian_konseptual?.sub_bab) && parsed.bab_2_kajian_konseptual.sub_bab.length > 0
      ? parsed.bab_2_kajian_konseptual.sub_bab
      : selectedFramework.sub_bab,
    isi: parsed.bab_2_kajian_konseptual?.isi,
  };

  // Menghitung total akumulasi anggaran pada BAB III Sub D
  const defaultTabelAnggaran = [
    { no: 1, uraian: 'Pengadaan Modul Pedoman & Juknis Operasional Program', volume: '1', satuan: 'Paket', total: 'Rp 450.000', sumber: 'BOSP Reguler' },
    { no: 2, uraian: 'Penggandaan Buku Jurnal Pembiasaan Siswa & Lembar Kontrol', volume: '1', satuan: 'Paket/Siswa', total: 'Rp 850.000', sumber: 'BOSP Reguler' },
    { no: 3, uraian: 'Banner Sosialisasi, Poster Edukasi Karakter & Media Visual', volume: '4', satuan: 'Buah', total: 'Rp 400.000', sumber: 'BOSP Reguler' },
    { no: 4, uraian: 'Sertifikat Apresiasi & Pengadaan Bintang Kebaikan Siswa', volume: '2', satuan: 'Paket', total: 'Rp 350.000', sumber: 'BOSP / Swadaya' },
    { no: 5, uraian: 'Dokumentasi, Pelaporan Akhir & Refleksi Semesteran', volume: '1', satuan: 'Kegiatan', total: 'Rp 400.000', sumber: 'BOSP Reguler' },
  ];

  const rawTabel = Array.isArray(parsed.bab_3_rencana_program?.tabel_anggaran) && parsed.bab_3_rencana_program.tabel_anggaran.length > 0
    ? parsed.bab_3_rencana_program.tabel_anggaran
    : defaultTabelAnggaran;

  let totalNum = 0;
  const tabel_anggaran = rawTabel.map((item: any, idx: number) => {
    const rawTot = String(item.total || '');
    const num = parseInt(rawTot.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) totalNum += num;
    return {
      no: item.no || idx + 1,
      uraian: item.uraian || `Item Kebutuhan Program ${idx + 1}`,
      volume: String(item.volume || '1'),
      satuan: String(item.satuan || 'Paket'),
      total: rawTot.startsWith('Rp') ? rawTot : (num ? `Rp ${num.toLocaleString('id-ID')}` : '-'),
      sumber: item.sumber || 'BOSP Reguler',
    };
  });

  const total_anggaran = parsed.bab_3_rencana_program?.total_anggaran || (totalNum > 0 ? `Rp ${totalNum.toLocaleString('id-ID')}` : 'Rp 2.450.000');

  const defaultKalenderKegiatan = [
    {
      nama: 'Rapat Pleno Penyusunan Kalender Pendidikan Satuan Pendidikan (KPSP)',
      deskripsi: 'Musyawarah dewan guru, kepala sekolah, dan komite sekolah membedah kalender pendidikan Disdik Purwakarta 2026/2027 dan menetapkan pembagian 36 pekan efektif.',
      tahapan: [
        'Pra-Kegiatan: Menelaah SE Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026 dan SKB 3 Menteri.',
        'Pelaksanaan: Rapat pleno penyusunan jadwal efektif, matrikulasi semester 1 dan 2, serta penetapan tim.',
        'Output: Draf resmi SK Kepala Sekolah dan Matriks Kalender Pendidikan 12 Bulan.',
      ],
      tujuan: 'Menetapkan kepastian jadwal belajar mengajar dan perlindungan jam KBM murid.',
      waktu: 'Pekan ke-1 s.d ke-2 Juli 2026',
      sasaran: 'Seluruh Pendidik dan Tenaga Kependidikan',
      pic: 'Kepala Sekolah & Tim Pengembang Kurikulum',
    },
    {
      nama: 'Pelaksanaan Masa Pengenalan Lingkungan Sekolah (MPLS) Ramah Anak',
      deskripsi: 'Kegiatan pengenalan lingkungan belajar, sarana sekolah, dan pembiasaan budaya positif tanpa kekerasan bagi peserta didik baru.',
      tahapan: [
        'Pra-Kegiatan: Pembentukan panitia MPLS dan penyusunan panduan transisi ramah anak.',
        'Pelaksanaan: Apel pembukaan, pengenalan guru, tur sekolah, dan ice breaking edukatif.',
        'Output: Adaptasi murid baru yang ceria dan terpetakannya profil awal kesiapan belajar.',
      ],
      tujuan: 'Memfasilitasi masa transisi murid baru secara menyenangkan dan aman.',
      waktu: '13 - 17 Juli 2026',
      sasaran: 'Peserta Didik Baru Kelas 1 & Pindahan',
      pic: 'Ketua Panitia MPLS',
    },
    {
      nama: 'Peringatan Hari Jadi Purwakarta (HJP) & Penguatan 7 Poé Atikan',
      deskripsi: 'Pawai karnaval budaya Sunda, pameran kuliner tradisional, dan peneguhan komitmen pendidikan berkarakter khas Purwakarta.',
      tahapan: [
        'Pra-Kegiatan: Persiapan busana adat Sunda dan materi edukasi sejarah Purwakarta.',
        'Pelaksanaan: Upacara peringatan HJP, atraksi seni pencak silat, dan kaulinan barudak.',
        'Output: Peningkatan kebanggaan kearifan lokal dan dokumentasi portofolio budaya.',
      ],
      tujuan: 'Menanamkan rasa cinta tanah kelahiran dan penguatan karakter Rebo Maneuh di Sunda.',
      waktu: '20 Juli 2026',
      sasaran: 'Seluruh Ekosistem Sekolah',
      pic: 'Koordinator Muatan Lokal & 7 Poé Atikan',
    },
    {
      nama: 'Peringatan Hari Besar Islam (PHBI) Maulid Nabi Muhammad SAW 1448 H',
      deskripsi: 'Tabligh akbar keagamaan, perlombaan adzan, tahfidz juz 30, dai cilik, dan santunan anak yatim/piatu di lingkungan sekolah.',
      tahapan: [
        'Pra-Kegiatan: Pembentukan kepanitiaan PHBI dan seleksi peserta lomba kelas.',
        'Pelaksanaan: Tausiyah keteladanan akhlak Rasulullah SAW dan pentas seni islami murid.',
        'Output: Meningkatnya kecintaan murid pada Nabi SAW dan kepedulian sosial.',
      ],
      tujuan: 'Menginternalisasikan keteladanan akhlak mulia Nabi Muhammad SAW.',
      waktu: '25 Agustus 2026 (atau pekan terdekat)',
      sasaran: 'Seluruh Murid, Guru, dan Orang Tua',
      pic: 'Guru PAI & Seksi Keagamaan',
    },
    {
      nama: 'Pelaksanaan Sumatif Tengah Semester (STS) Ganjil & Genap Terjadwal',
      deskripsi: 'Penyelenggaraan penilaian capaian kompetensi formatif-sumatif tengah semester secara terstandar dan objektif.',
      tahapan: [
        'Pra-Kegiatan: Penyusunan kisi-kisi dan naskah asesmen bermutu oleh guru kelas/mapel.',
        'Pelaksanaan: Ujian tertulis dan praktik berbasis pemecahan masalah (Problem Solving).',
        'Output: Data nilai diagnostik untuk perencanaan remedial dan pengayaan belajar.',
      ],
      tujuan: 'Mengukur kemajuan belajar berkala dan melakukan perbaikan mutu pembelajaran.',
      waktu: 'September 2026 & Maret 2027',
      sasaran: 'Seluruh Peserta Didik Kelas 1 - 6',
      pic: 'Koordinator Tim Asesmen',
    },
    {
      nama: 'Peringatan Isra Mi\'raj Nabi Muhammad SAW / Rajaban (27 Rajab 1448 H)',
      deskripsi: 'Peringatan peristiwa Isra Mi\'raj dan penguatan rukun sholat 5 waktu serta pembiasaan sholat berjamaah di sekolah.',
      tahapan: [
        'Pra-Kegiatan: Pembagian kelompok mentoring sholat dan persiapan panggung gebyar Rajaban.',
        'Pelaksanaan: Praktik sholat khusyuk berjamaah, ceramah hikmah Isra Mi\'raj, dan istighotsah.',
        'Output: Peningkatan disiplin ibadah sholat dan buku mutaba\'ah yaumiyah terisi aktif.',
      ],
      tujuan: 'Memperkokoh tiang agama melalui pemahaman makna hakiki perintah sholat.',
      waktu: '5 Februari 2027 (27 Rajab 1448 H)',
      sasaran: 'Seluruh Murid Muslim dan Pendidik',
      pic: 'Guru PAI & Dewan Kemakmuran Mushola Sekolah',
    },
    {
      nama: 'Program Pembiasaan Karakter "Masantren di Sakola" Ramadhan 1448 H',
      deskripsi: 'Pendalaman agama Islam intensif selama bulan suci Ramadhan mengacu pada kebijakan khas Dinas Pendidikan Kabupaten Purwakarta.',
      tahapan: [
        'Pra-Kegiatan: Penyusunan silabus materi Masantren di Sakola Ramadhan.',
        'Pelaksanaan: Tadarus Al-Qur\'an pagi, sholat dhuha berjamaah, zakat fitrah, dan buka bersama.',
        'Output: Sertifikat khatam Al-Qur\'an dan dokumentasi amaliyah Ramadhan siswa.',
      ],
      tujuan: 'Mencetak generasi yang bertaqwa, gemar membaca Al-Qur\'an, dan berakhlak karimah.',
      waktu: '11 Februari - 5 Maret 2027',
      sasaran: 'Seluruh Murid Kelas 1 - 6',
      pic: 'Tim Khusus Masantren Ramadhan',
    },
    {
      nama: 'Pekan Penilaian Sumatif Akhir Jenjang (PSAJ) & ASAT Kenaikan Kelas',
      deskripsi: 'Penyelenggaraan asesmen akhir jenjang kelas 6 dan asesmen akhir tahun penentu kenaikan kelas fase A, B, dan C.',
      tahapan: [
        'Pra-Kegiatan: Verifikasi kelayakan peserta, percetakan naskah soal, dan simulasi asesmen.',
        'Pelaksanaan: Asesmen berbasis kertas dan komputer secara jujur dan tertib.',
        'Output: Rekapitulasi nilai akhir semester genap dan kelulusan siswa.',
      ],
      tujuan: 'Menilai capaian kompetensi lulusan secara menyeluruh dan akuntabel.',
      waktu: 'Mei 2027 (PSAJ) & Juni 2027 (ASAT)',
      sasaran: 'Kelas 6 (PSAJ) & Seluruh Kelas 1-5 (ASAT)',
      pic: 'Ketua Panitia Asesmen Akhir',
    },
    {
      nama: 'Gelar Karya Pentas Seni Profil Lulusan / P5 & Pembagian Rapor',
      deskripsi: 'Pameran panen hasil belajar kokurikuler, pementasan bakat seni, bazar kewirausahaan TdBA, serta penyerahan buku laporan hasil belajar.',
      tahapan: [
        'Pra-Kegiatan: Penataan stan pameran kelas dan persiapan panggung pertunjukan karya anak.',
        'Pelaksanaan: Pembukaan oleh Pengawas Pembina, parade karya siswa, dan pembagian rapor.',
        'Output: Publikasi portofolio karya murid dan buku rapor resmi terbagikan 100%.',
      ],
      tujuan: 'Memberikan apresiasi pencapaian belajar dan memupuk rasa percaya diri anak.',
      waktu: '21 - 25 Juni 2027',
      sasaran: 'Seluruh Murid, Komite, dan Orang Tua',
      pic: 'Tim Kokurikuler & Seluruh Wali Kelas',
    },
  ];

  const defaultKalenderTim = [
    {
      no: 1,
      jabatan: 'Penanggung Jawab & Pengarah',
      nama: metadata.kepala_sekolah || 'Kepala Sekolah',
      tugas: 'Menetapkan kebijakan umum kalender sekolah, menerbitkan SK Tim, dan melakukan supervisi kepatuhan waktu KBM.',
    },
    {
      no: 2,
      jabatan: 'Ketua Tim Pengembang Kalender Sekolah',
      nama: metadata.penyusun || 'Koordinator Program',
      tugas: 'Menyusun matrikulasi jadwal, mengkoordinasikan agenda semesteran, dan menyelaraskan agenda dinas.',
    },
    {
      no: 3,
      jabatan: 'Sekretaris & Pengelola Jadwal KBM',
      nama: 'Guru Kelas / Tim Kurikulum',
      tugas: 'Mendokumentasikan kalender, menyusun jadwal pelajaran reguler, dan merekapitulasi jurnal harian kelas.',
    },
    {
      no: 4,
      jabatan: 'Koordinator Peringatan Hari Besar Islam (PHBI)',
      nama: 'Guru PAI / DKM Sekolah',
      tugas: 'Menyelenggarakan kegiatan keagamaan (Maulid Nabi, Rajaban, Masantren Ramadhan, dan Idul Adha).',
    },
    {
      no: 5,
      jabatan: 'Koordinator Hari Besar Nasional & Karakter Purwakarta',
      nama: 'Guru Kelas / Tim 7 Poé Atikan & TdBA',
      tugas: 'Mengkoordinasikan peringatan HUT RI, Hari Jadi Purwakarta, Hari Guru, Hari Pramuka, dan kegiatan lingkungan hidup.',
    },
    {
      no: 6,
      jabatan: 'Koordinator Penilaian & Evaluasi (STS/SAS/ASAT)',
      nama: 'Ketua Panitia Asesmen',
      tugas: 'Menyiapkan administrasi pengujian, jadwal pengolahan nilai e-Rapor, dan pembagian buku rapor.',
    },
  ];

  const defaultKalenderActionPlan = [
    { no: 1, kegiatan: 'Rapat Pleno & Penetapan SK Kalender Pendidikan', bulan: [1], pic: 'Kepala Sekolah' },
    { no: 2, kegiatan: 'MPLS Ramah Anak & Peringatan Hari Jadi Purwakarta', bulan: [1], pic: 'Panitia MPLS' },
    { no: 3, kegiatan: 'Peringatan Hari Pramuka, HUT RI & PHBI Maulid Nabi', bulan: [2], pic: 'Koord. PHBI & Kesiswaan' },
    { no: 4, kegiatan: 'Hari Bambu TdBA & Asesmen Sumatif Tengah Semester (STS) 1', bulan: [3], pic: 'Tim Asesmen' },
    { no: 5, kegiatan: 'Hari Kesaktian Pancasila & Sumpah Pemuda', bulan: [4], pic: 'Koord. Nasional' },
    { no: 6, kegiatan: 'Hari Pahlawan, Hari Guru & Mulai SAS Ganjil', bulan: [5], pic: 'Panitia SAS' },
    { no: 7, kegiatan: 'SAS Ganjil, Classmeeting, Rapor Smt 1 & Libur Semester 1', bulan: [6], pic: 'Wali Kelas' },
    { no: 8, kegiatan: 'Awal KBM Semester Genap & Peringatan Rajaban (Isra Mi\'raj)', bulan: [7, 8], pic: 'Koord. PHBI' },
    { no: 9, kegiatan: 'Libur Awal Ramadhan & Kegiatan Masantren di Sakola Ramadhan', bulan: [8, 9], pic: 'Tim Masantren' },
    { no: 10, kegiatan: 'Libur Idul Fitri & Sumatif Tengah Semester (STS) Genap', bulan: [9], pic: 'Tim Asesmen' },
    { no: 11, kegiatan: 'Hari Kartini, Hardiknas & PSAJ Khusus Kelas 6', bulan: [10, 11], pic: 'Panitia PSAJ' },
    { no: 12, kegiatan: 'ASAT Kenaikan Kelas, Gelar Karya P5, Bagi Rapor Smt 2 & Libur TP', bulan: [12], pic: 'Seluruh Tim' },
  ];

  const bab_3_rencana_program = {
    kegiatan: Array.isArray(parsed.bab_3_rencana_program?.kegiatan) && parsed.bab_3_rencana_program.kegiatan.length > 0
      ? parsed.bab_3_rencana_program.kegiatan
      : (templateId === 'kalender-sekolah' ? defaultKalenderKegiatan : [
          {
            nama: 'Sosialisasi Program dan Pembekalan Jurnal Harian',
            deskripsi: 'Pertemuan pengenalan tujuan program kerja, pembagian format jurnal kebiasaan siswa, dan penjelasan peran orang tua.',
            tahapan: [
              'Pra-Kegiatan: Menyiapkan instrumen jurnal dan materi presentasi komite.',
              'Pelaksanaan: Sosialisasi tatap muka bersama seluruh orang tua dan dewan guru.',
              'Output: Tersosialisasikannya jadwal program dan tersalurkannya jurnal siswa 100%.',
            ],
            tujuan: 'Membangun kesepahaman visi antara sekolah dan keluarga.',
            waktu: 'Minggu ke-3 Juli 2025',
            sasaran: 'Seluruh orang tua dan guru',
            pic: 'Ketua Tim Program',
          },
          {
            nama: 'Penerapan Pembiasaan Rutin Harian di Sekolah',
            deskripsi: 'Kegiatan terpadu mulai dari penyambutan 5S di gerbang, apel pagi/literasi 15 menit, dan sholat berjamaah/doa bersama.',
            tahapan: [
              'Pra-Kegiatan: Pengkondisian guru piket dan absensi pagi.',
              'Pelaksanaan: Pelaksanaan apel, pembacaan buku senyap 15 menit, dan doa khidmat.',
              'Output: Keteraturan barisan siswa dan atmosfer sekolah yang tertib kondusif.',
            ],
            tujuan: 'Membiasakan anak datang tertib, beribadah tekun, dan cinta buku.',
            waktu: 'Setiap Hari Efektif Sekolah',
            sasaran: 'Seluruh siswa kelas 1-6',
            pic: 'Wali Kelas & Guru Piket',
          },
          {
            nama: 'Pojok Baca Inovatif & Tantangan Literasi Mingguan',
            deskripsi: 'Mengoptimalkan sudut baca di tiap ruang kelas dengan rotasi buku mingguan dan pohon geulis membaca.',
            tahapan: [
              'Pra-Kegiatan: Menata koleksi buku bergizi ramah anak di rak pojok baca kelas.',
              'Pelaksanaan: Membaca mandiri terarah dan menuliskan intisari bacaan pada daun pohon geulis.',
              'Output: Pajangan pohon geulis kelas yang rimbun dengan resume buku.',
            ],
            tujuan: 'Meningkatkan minat baca dan daya analisis siswa.',
            waktu: 'Setiap Jumat Pagi',
            sasaran: 'Siswa kelas 1-6',
            pic: 'Koordinator Literasi',
          },
          {
            nama: 'Sabtu Bersih dan Aksi Sayang Lingkungan (Adiwiyata & TdBA)',
            deskripsi: 'Gotong royong membersihkan kelas, memilah sampah organik/anorganik, dan merawat tanaman kebun sekolah.',
            tahapan: [
              'Pra-Kegiatan: Menyiapkan alat kebersihan dan kantong pemilahan sampah terpilah.',
              'Pelaksanaan: Kerja bakti serentak, pembuatan pupuk kompos, dan penyiraman kebun TdBA.',
              'Output: Lingkungan sekolah yang asri, bersih, dan bebas sampah plastik.',
            ],
            tujuan: 'Menumbuhkan kepedulian ekologis dan semangat gotong royong.',
            waktu: 'Setiap Hari Sabtu Pekan ke-2 dan ke-4',
            sasaran: 'Seluruh warga sekolah',
            pic: 'Koordinator Lingkungan Hidup',
          },
          {
            nama: 'Refleksi Tengah Semester dan Bintang Kebaikan',
            deskripsi: 'Penilaian ketercapaian jurnal harian serta penyematan lencana apresiasi bagi murid teladan.',
            tahapan: [
              'Pra-Kegiatan: Merekapitulasi poin ketercapaian jurnal harian siswa selama 3 bulan.',
              'Pelaksanaan: Penganugerahan pin Bintang Kebaikan saat upacara bendera hari Senin.',
              'Output: Sertifikat apresiasi karakter dan peningkatan motivasi intrinsik murid.',
            ],
            tujuan: 'Memberikan penguatan psikologis positif bagi anak.',
            waktu: 'Bulan Oktober dan Maret',
            sasaran: 'Murid berprestasi karakter',
            pic: 'Tim Monitoring & Wali Kelas',
          },
        ]),
    tim_pelaksana: Array.isArray(parsed.bab_3_rencana_program?.tim_pelaksana) && parsed.bab_3_rencana_program.tim_pelaksana.length > 0
      ? parsed.bab_3_rencana_program.tim_pelaksana
      : (templateId === 'kalender-sekolah' ? defaultKalenderTim : [
          {
            no: 1,
            jabatan: 'Penanggung Jawab / Pengarah',
            nama: metadata.kepala_sekolah || 'Kepala Sekolah',
            tugas: 'Menetapkan kebijakan umum, menyediakan sarana prasarana penunjang, dan melakukan supervisi mutu program.',
          },
          {
            no: 2,
            jabatan: 'Ketua Pelaksana Program',
            nama: metadata.penyusun || 'Koordinator Program',
            tugas: 'Mengkoordinasikan seluruh alur pelaksanaan aksi, memimpin rapat tim, dan menyusun laporan pertanggungjawaban.',
          },
          {
            no: 3,
            jabatan: 'Sekretaris & Pengelola Instrumen',
            nama: 'Guru Kelas / Tim Kurikulum',
            tugas: 'Menggandakan dan mengelola distribusi instrumen jurnal harian, lembar observasi, dan rekapitulasi data.',
          },
          {
            no: 4,
            jabatan: 'Koordinator Lapangan & Sarpras',
            nama: 'Guru PJOK / Staf Sarpras',
            tugas: 'Menyiapkan sarana teknis kegiatan harian, fasilitas pojok baca, dan ketertiban pembiasaan di lapangan.',
          },
          {
            no: 5,
            jabatan: 'Wali Kelas & Pendamping Siswa',
            nama: 'Seluruh Wali Kelas 1 - 6',
            tugas: 'Melakukan pemantauan langsung setiap pagi, memvalidasi jurnal anak, dan membina komunikasi aktif dengan orang tua.',
          },
        ]),
    action_plan: Array.isArray(parsed.bab_3_rencana_program?.action_plan) && parsed.bab_3_rencana_program.action_plan.length > 0
      ? parsed.bab_3_rencana_program.action_plan
      : (templateId === 'kalender-sekolah' ? defaultKalenderActionPlan : [
          { no: 1, kegiatan: 'Sosialisasi Program dan Pembagian Jurnal', bulan: [1, 2], pic: 'Ketua Tim' },
          { no: 2, kegiatan: 'Pelaksanaan Pembiasaan Rutin Harian', bulan: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], pic: 'Wali Kelas' },
          { no: 3, kegiatan: 'Aksi Bersih Lingkungan & Gotong Royong', bulan: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], pic: 'Koord. Sarpras' },
          { no: 4, kegiatan: 'Monitoring dan Refleksi Triwulan I', bulan: [3], pic: 'Kepala Sekolah' },
          { no: 5, kegiatan: 'Evaluasi Semester I & Gelar Apresiasi', bulan: [6], pic: 'Tim Program' },
          { no: 6, kegiatan: 'Monitoring dan Refleksi Triwulan II', bulan: [9], pic: 'Tim Monitoring' },
          { no: 7, kegiatan: 'Evaluasi Akhir Tahun & Diseminasi Praktik Baik', bulan: [12], pic: 'Ketua Tim & Komite' },
        ]),
    sarana_anggaran: parsed.bab_3_rencana_program?.sarana_anggaran || [
      'Dukungan sarana meliputi pengadaan buku jurnal pembiasaan siswa, banner dan poster edukasi karakter di setiap sudut kelas, perlengkapan sanitasi dan tempat sampah terpilah, serta koleksi buku bacaan bermutu.',
      'Anggaran pembiayaan bersumber dari dana Bantuan Operasional Satuan Pendidikan (BOSP) komponen pengembangan karakter dan kegiatan kokurikuler, serta dukungan swadaya komite sekolah sesuai ketentuan perundang-undangan.',
    ],
    tabel_anggaran,
    total_anggaran,
  };

  const bab_4_monitoring_evaluasi = {
    mekanisme: parsed.bab_4_monitoring_evaluasi?.mekanisme || [
      'Monitoring internal dilakukan setiap hari oleh wali kelas melalui verifikasi jurnal pembiasaan siswa dan pengamatan perilaku spontan di lingkungan sekolah.',
      'Supervisi klinis dilaksanakan oleh Kepala Sekolah dan Tim Pengembang Kurikulum minimal satu kali setiap bulan untuk mengidentifikasi kendala dan memberikan masukan konstruktif.',
    ],
    indikator: Array.isArray(parsed.bab_4_monitoring_evaluasi?.indikator) && parsed.bab_4_monitoring_evaluasi.indikator.length > 0
      ? parsed.bab_4_monitoring_evaluasi.indikator
      : [
          'Indikator Proses: Keterlaksanaan seluruh rangkaian kegiatan terencana mencapai minimal 95% dengan partisipasi aktif seluruh dewan guru.',
          'Indikator Output: Tingkat keterisian jurnal karakter harian murid dan validasi paraf orang tua mencapai minimal 90% setiap pekan.',
          'Indikator Dampak (Outcome): Peningkatan nilai iklim keamanan dan karakter pada Rapor Pendidikan sekolah serta nihilnya insiden perundungan atau kekerasan di sekolah.',
        ],
    evaluasi: parsed.bab_4_monitoring_evaluasi?.evaluasi || [
      'Evaluasi capaian program dilaksanakan secara berkala pada akhir setiap tengah semester dan akhir tahun ajaran.',
      'Hasil evaluasi dituangkan dalam laporan reflektif yang dibahas bersama Dewan Guru dan Komite Sekolah untuk penyempurnaan program kerja periode berikutnya.',
    ],
    tindak_lanjut: parsed.bab_4_monitoring_evaluasi?.tindak_lanjut || [
      'Tindak Lanjut Murid: Penganugerahan piagam penghargaan Bintang Kebaikan saat upacara bendera serta pendekatan konseling ramah anak (peer mentoring) bagi siswa yang membutuhkan pendampingan khusus.',
      'Tindak Lanjut Pendidik: Sesi coaching berkala di forum Komunitas Belajar (Kombel) sekolah untuk mendiseminasikan praktik baik dan menyelaraskan langkah pembiasaan kelas.',
    ],
  };

  const bab_5_penutup = {
    kesimpulan: parsed.bab_5_penutup?.kesimpulan || [
      'Dokumen Program Kerja ini merupakan wujud nyata ikhtiar dan pakta integritas satuan pendidikan dalam mewujudkan visi pendidikan holistik yang seimbang antara kecerdasan intelektual dan keluhuran moral budi pekerti.',
      'Konsistensi keteladanan pendidik (ing ngarso sung tulodo), pengawalan terencana oleh tim pengembang kurikulum, serta komunikasi erat dengan para orang tua menjadi kunci utama keberhasilan program ini.',
    ],
    saran: Array.isArray(parsed.bab_5_penutup?.saran) && parsed.bab_5_penutup.saran.length > 0
      ? parsed.bab_5_penutup.saran
      : [
          'Pendidik hendaknya senantiasa memperkuat keteladanan nyata di hadapan para murid dalam setiap kesempatan belajar.',
          'Orang tua diharapkan memberikan pendampingan yang hangat serta meluangkan waktu berdialog bersama anak saat memvalidasi jurnal pembiasaan di rumah.',
          'Pengawas pembina dan Dinas Pendidikan diharapkan terus memberikan supervisi dan bimbingan teknis guna optimalisasi mutu satuan pendidikan.',
        ],
  };

  let lampiran = parsed.lampiran || {};
  let kaldik_events: KaldikEventItem[] | undefined = undefined;
  let kaldik_grid: any = undefined;
  let kaldik_stats: any = undefined;

  if (templateId === 'kalender-sekolah') {
    const rawCustomEvents = input.spesifik?.kegiatanKustomList || parsed.kaldik_events || input.kaldik_events || [];
    kaldik_events = mergeKaldikEvents(rawCustomEvents, true);
    const sistemHariSekolah = input.spesifik?.sistemHariSekolah || '5-hari';
    kaldik_grid = generate12MonthGrid(kaldik_events, { sistemHariSekolah });
    kaldik_stats = calculateKaldikStats(kaldik_grid, { sistemHariSekolah });
    lampiran = {
      ...lampiran,
      kaldik_events,
      kaldik_grid,
      kaldik_stats,
    };
  }

  return replacePesertaDidik({
    metadata,
    bab_1_pendahuluan,
    bab_2_kajian_konseptual,
    bab_3_rencana_program,
    bab_4_monitoring_evaluasi,
    bab_5_penutup,
    lampiran,
    ...(kaldik_events ? { kaldik_events, kaldik_grid, kaldik_stats } : {}),
  });
}

// ============================================
// Self-healing: Database Table Schema
// ============================================
export async function ensureProgramSekolahTables(db: D1Database): Promise<void> {
  try {
    await db.prepare('SELECT 1 FROM program_sekolah_history LIMIT 1').first();
  } catch {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS program_sekolah_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_nama TEXT,
        nama_sekolah TEXT NOT NULL,
        template_id TEXT NOT NULL,
        judul_program TEXT NOT NULL,
        tahun_ajaran TEXT NOT NULL,
        penyusun TEXT,
        content_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_program_sekolah_user ON program_sekolah_history(user_id)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_program_sekolah_created ON program_sekolah_history(created_at DESC)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_program_sekolah_template ON program_sekolah_history(template_id)'),
    ]);
  }
}

// ============================================
// Endpoint 1: SSE Live Streaming Generation
// ============================================
programSekolah.post('/generate-stream', async (c) => {
  try {
    const body = await c.req.json();
    const { template, identitas, spesifik, aiProvider } = body;

    if (!template) {
      return Errors.badRequest(c, 'Template program kerja wajib dipilih');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const prompt = buildProgramPrompt({
      template,
      identitas: identitas || {},
      spesifik: spesifik || {},
    });

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash',
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
            title: 'Sinkronisasi Dasar Hukum & Konsep Program',
            message: `Menghubungkan regulasi resmi dan kebijakan kurikulum untuk program ${template}...`,
            percent: 25,
          }),
        });

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 2,
            totalSteps: 4,
            title: 'Penyusunan BAB I Pendahuluan & BAB II Kajian Ilmiah',
            message: 'Menyusun narasi latar belakang, tujuan SMART, kajian habituasi, dan landasan teoritis...',
            percent: 50,
          }),
        });

        const onToken = async (token: string) => {
          try {
            await stream.writeSSE({
              event: 'token',
              data: JSON.stringify({ text: token }),
            });
          } catch (_) {}
        };

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 3,
            totalSteps: 4,
            title: 'Merancang Rencana Aksi 12 Bulan & Monev',
            message: 'Menyusun aksi nyata, struktur tim pelaksana, matriks action plan, serta indikator keberhasilan...',
            percent: 75,
          }),
        });

        const rawResult = await ai.generateJSONStream(prompt, preferredSlug, onToken);
        const result = validateAndRepairProgramResult(rawResult, {
          template,
          identitas,
          spesifik,
        });

        // Telemetry logging
        try {
          const sessionId = getCookie(c.req.header('Cookie'), 'session');
          const user = await getCurrentUser(c.env.DB, sessionId);
          await recordAIGeneration(c.env.DB, {
            user_id: user?.id || 1,
            user_nama: user?.nama || (identitas?.penyusun || 'Guru'),
            sekolah: user?.sekolah || (identitas?.namaSekolah || 'SDN'),
            feature_type: 'PROGRAM_SEKOLAH',
            mata_pelajaran: template,
            topik: result.metadata.judul_program,
            jenjang_kelas: identitas?.jenjang || 'SD',
            ai_provider: preferredSlug,
          });
        } catch (_) {}

        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({
            step: 4,
            totalSteps: 4,
            title: 'Finalisasi Dokumen Program Sekolah',
            message: 'Dokumen program kerja berhasil dirakit lengkap dari Cover hingga Lampiran!',
            percent: 100,
          }),
        });

        await stream.writeSSE({
          event: 'done',
          data: JSON.stringify(result),
        });
      } catch (err: any) {
        console.error('SSE Program Sekolah Stream Error:', err);
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ message: err.message || 'Gagal menghasilkan dokumen program sekolah' }),
        });
      }
    });
  } catch (e: any) {
    console.error('Program Sekolah SSE Route Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 2: Fallback Direct JSON Generation
// ============================================
programSekolah.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { template, identitas, spesifik, aiProvider } = body;

    if (!template) {
      return Errors.badRequest(c, 'Template program kerja wajib dipilih');
    }

    const ai = new AIService(c.env);
    await ai.loadProviders(c.env.DB);

    const prompt = buildProgramPrompt({
      template,
      identitas: identitas || {},
      spesifik: spesifik || {},
    });

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash',
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;

    const rawResult = await ai.generateJSON(prompt, preferredSlug);
    const result = validateAndRepairProgramResult(rawResult, {
      template,
      identitas,
      spesifik,
    });

    // Telemetry log
    try {
      const sessionId = getCookie(c.req.header('Cookie'), 'session');
      const user = await getCurrentUser(c.env.DB, sessionId);
      await recordAIGeneration(c.env.DB, {
        user_id: user?.id || 1,
        user_nama: user?.nama || (identitas?.penyusun || 'Guru'),
        sekolah: user?.sekolah || (identitas?.namaSekolah || 'SDN'),
        feature_type: 'PROGRAM_SEKOLAH',
        mata_pelajaran: template,
        topik: result.metadata.judul_program,
        jenjang_kelas: identitas?.jenjang || 'SD',
        ai_provider: preferredSlug,
      });
    } catch (_) {}

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Program Sekolah Direct Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 2b: Generate Khusus Bab / Bagian Tertentu (Hemat Token & Lebih Mendalam)
// ============================================
programSekolah.post('/generate-section', async (c) => {
  try {
    const body = await c.req.json();
    const { template, identitas, spesifik, section, aiProvider, currentData } = body;

    if (!template) {
      return Errors.badRequest(c, 'Template program kerja wajib dipilih');
    }
    if (!section || !['bab1', 'bab2', 'bab3', 'bab4_5'].includes(section)) {
      return Errors.badRequest(c, 'Parameter section tidak valid (bab1, bab2, bab3, bab4_5)');
    }

    const ai = new AIService(c.env);
    const prompt = buildSectionPrompt(section, {
      template,
      identitas: identitas || {},
      spesifik: spesifik || {},
      currentData: currentData || {},
    });

    const slugMap: Record<string, string> = {
      vertex: 'vertex-proxy',
      gemini: 'gemini-flash',
      bedrock: 'bedrock-claude',
      mistral: 'mistral-large',
      z_ai: 'glm4-flash',
    };
    const preferredSlug = slugMap[aiProvider] || aiProvider;

    const rawResult = await ai.generateJSON(prompt, preferredSlug);
    const sanitizedResult = replacePesertaDidik(rawResult);

    // Merge section ke dalam currentData jika ada
    let merged = currentData ? { ...currentData } : {};

    if (section === 'bab1' && sanitizedResult.bab_1_pendahuluan) {
      merged.bab_1_pendahuluan = sanitizedResult.bab_1_pendahuluan;

    } else if (section === 'bab2' && sanitizedResult.bab_2_kajian_konseptual) {
      merged.bab_2_kajian_konseptual = sanitizedResult.bab_2_kajian_konseptual;

    } else if (section === 'bab3') {
      // Normalisasi: AI bab3 menggunakan schema berbeda dari renderer canonical
      // Ambil dari key manapun yang AI kembalikan (bab_3_rencana_program atau langsung dari root)
      const raw3 = sanitizedResult.bab_3_rencana_program || sanitizedResult;

      // A. Kegiatan: AI mungkin kembalikan key 'kegiatan_utama' atau 'kegiatan'
      const rawKegiatan = raw3?.kegiatan_utama || raw3?.kegiatan || [];

      // Normalkan format per kegiatan ke canonical (nama/deskripsi/tahapan/tujuan/waktu/sasaran/pic)
      const kegiatan = Array.isArray(rawKegiatan) ? rawKegiatan.map((k: any, i: number) => ({
        nama: k.nama || k.name || `Kegiatan ${i + 1}`,
        deskripsi: k.deskripsi || k.description || '',
        tahapan: Array.isArray(k.tahapan) ? k.tahapan
          : (k.langkah ? [k.langkah] : ['1. Persiapan', '2. Pelaksanaan', '3. Evaluasi']),
        tujuan: k.tujuan || k.tujuan_kegiatan || '',
        waktu: k.waktu || k.jadwal || '',
        sasaran: k.sasaran || '',
        pic: k.pic || k.penanggung_jawab || 'Tim Program',
        anggaran: k.anggaran || '',
      })) : [];

      // B. Tim Pelaksana: AI mungkin kembalikan object {penanggung_jawab, ketua, seksi_bidang} atau array flat
      const rawTim = raw3?.tim_pelaksana;
      let timPelaksana: any[] = [];
      if (Array.isArray(rawTim)) {
        // Sudah dalam format flat array → gunakan langsung
        timPelaksana = rawTim;
      } else if (rawTim && typeof rawTim === 'object') {
        // Format object → konversi ke flat array
        const rows: any[] = [];
        let no = 1;
        if (rawTim.penanggung_jawab) rows.push({ no: no++, jabatan: 'Penanggung Jawab / Pengarah', nama: rawTim.penanggung_jawab, tugas: 'Menetapkan kebijakan dan melakukan supervisi mutu program.' });
        if (rawTim.ketua) rows.push({ no: no++, jabatan: 'Ketua Pelaksana', nama: rawTim.ketua, tugas: 'Mengkoordinasikan pelaksanaan aksi dan menyusun laporan pertanggungjawaban.' });
        if (rawTim.sekretaris) rows.push({ no: no++, jabatan: 'Sekretaris', nama: rawTim.sekretaris, tugas: 'Mencatat notulen rapat, mengelola administrasi, dan mendokumentasikan program.' });
        if (rawTim.bendahara) rows.push({ no: no++, jabatan: 'Bendahara', nama: rawTim.bendahara, tugas: 'Mengelola anggaran BOSP, menyiapkan kuitansi, dan menyusun laporan keuangan.' });
        if (Array.isArray(rawTim.seksi_bidang)) {
          rawTim.seksi_bidang.forEach((s: any) => {
            rows.push({ no: no++, jabatan: s.bidang || 'Seksi', nama: '...', tugas: s.tugas || '' });
          });
        }
        timPelaksana = rows;
      }

      // C. Action Plan: AI mungkin pakai key 'jadwal_pelaksanaan' atau 'action_plan'
      const rawJadwal = raw3?.jadwal_pelaksanaan || raw3?.action_plan || [];
      const actionPlan = Array.isArray(rawJadwal) ? rawJadwal.map((j: any, i: number) => ({
        no: j.no || i + 1,
        kegiatan: j.kegiatan || j.nama || `Kegiatan ${i + 1}`,
        bulan: Array.isArray(j.bulan) ? j.bulan : (j.bulan_ke ? [j.bulan_ke] : [i + 1]),
        pic: j.pic || 'Tim Program',
      })) : [];

      // D. Sarana & Anggaran: AI pakai 'anggaran_dan_sarana.rincian_biaya', normalkan ke 'tabel_anggaran'
      const anggaranSarana = raw3?.anggaran_dan_sarana || {};
      const saranaTeks = anggaranSarana?.sarana_prasarana || raw3?.sarana_anggaran || [];
      const saranaText = Array.isArray(saranaTeks) ? saranaTeks : [String(saranaTeks)];

      const rawBiaya = anggaranSarana?.rincian_biaya || raw3?.tabel_anggaran || [];
      let totalNum = 0;
      const tabelAnggaran = Array.isArray(rawBiaya) ? rawBiaya.map((b: any, idx: number) => {
        const rawTot = String(b.total || b.total_biaya || '');
        const num = parseInt(rawTot.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) totalNum += num;
        return {
          no: b.no || idx + 1,
          uraian: b.uraian || b.pos_anggaran || b.nama || `Item ${idx + 1}`,
          volume: String(b.volume || '1'),
          satuan: String(b.satuan || 'Paket'),
          total: rawTot.startsWith('Rp') ? rawTot : (num ? `Rp ${num.toLocaleString('id-ID')}` : '-'),
          sumber: b.sumber || 'BOSP Reguler',
        };
      }) : [];

      const totalAnggaran = anggaranSarana?.total_anggaran || raw3?.total_anggaran
        || (totalNum > 0 ? `Rp ${totalNum.toLocaleString('id-ID')}` : 'Rp 2.450.000');

      // Rakit bab_3_rencana_program canonical dan merge
      const bab3Canonical: any = {};
      if (kegiatan.length > 0) bab3Canonical.kegiatan = kegiatan;
      if (timPelaksana.length > 0) bab3Canonical.tim_pelaksana = timPelaksana;
      if (actionPlan.length > 0) bab3Canonical.action_plan = actionPlan;
      if (saranaText.length > 0) bab3Canonical.sarana_anggaran = saranaText;
      if (tabelAnggaran.length > 0) bab3Canonical.tabel_anggaran = tabelAnggaran;
      bab3Canonical.total_anggaran = totalAnggaran;

      merged.bab_3_rencana_program = {
        ...(merged.bab_3_rencana_program || {}),
        ...bab3Canonical,
      };

    } else if (section === 'bab4_5') {
      // Normalisasi: AI bab4_5 mungkin menggunakan 'bab_4_monitoring' atau 'bab_4_monitoring_evaluasi'
      const raw4 = sanitizedResult.bab_4_monitoring_evaluasi || sanitizedResult.bab_4_monitoring || sanitizedResult;
      if (raw4 && typeof raw4 === 'object') {
        merged.bab_4_monitoring_evaluasi = {
          mekanisme: raw4.mekanisme || [],
          // Normalisasi key indikator: bisa 'indikator', 'indikator_keberhasilan', atau 'indikator_keberhasilan_smart'
          indikator: raw4.indikator || raw4.indikator_keberhasilan || raw4.indikator_keberhasilan_smart || [],
          evaluasi: raw4.evaluasi || raw4.evaluasi_dan_refleksi || [],
          tindak_lanjut: raw4.tindak_lanjut || [],
        };
      }
      const raw5 = sanitizedResult.bab_5_penutup;
      if (raw5 && typeof raw5 === 'object') {
        merged.bab_5_penutup = {
          kesimpulan: raw5.kesimpulan || [],
          saran: raw5.saran || [],
        };
      }
    }

    // Telemetry log
    try {
      const user = c.get('user' as any);
      await recordAIGeneration(c.env.DB, {
        user_id: user?.id || 1,
        user_nama: user?.nama || (identitas?.penyusun || 'Guru'),
        sekolah: user?.sekolah || (identitas?.namaSekolah || 'SDN'),
        feature_type: 'PROGRAM_SEKOLAH_SECTION',
        mata_pelajaran: `${template}_${section}`,
        topik: `Generate ${section} ${identitas?.namaSekolah || ''}`,
        jenjang_kelas: identitas?.jenjang || 'SD',
        ai_provider: preferredSlug,
      });
    } catch (_) {}

    return successResponse(c, {
      section,
      sectionData: sanitizedResult,
      mergedData: merged,
    });
  } catch (e: any) {
    console.error('Program Sekolah Section Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 3: Download DOCX Lengkap (BAB I-V + Lampiran dlm 1 File)
// ============================================
programSekolah.post('/docx', async (c) => {
  try {
    const body = await c.req.json();
    const data: ProgramSekolahData = body;

    if (!data || !data.metadata) {
      return Errors.badRequest(c, 'Data dokumen program sekolah tidak valid');
    }

    const buffer = await generateProgramDocxBuffer(data);

    const titleSafe = String(data.metadata.judul_program || 'Program_Sekolah')
      .replace(/[\\/?%*:|"<>]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 50);
    const filename = `${titleSafe}_${data.metadata.tahun_ajaran?.replace('/', '-') || '2025-2026'}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Program Sekolah DOCX Export Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 3b: Download Lembar Refleksi & Rubrik Saja (DOCX Terpisah Siap Cetak/Fotokopi)
// ============================================
programSekolah.post('/docx-lampiran', async (c) => {
  try {
    const body = await c.req.json();
    const data: ProgramSekolahData = body;

    if (!data || !data.metadata) {
      return Errors.badRequest(c, 'Data dokumen program sekolah tidak valid');
    }

    const buffer = await generateProgramLampiranOnlyDocxBuffer(data);

    const titleSafe = String(data.metadata.judul_program || 'Program_Sekolah')
      .replace(/[\\/?%*:|"<>]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 40);
    const filename = `${titleSafe}_Refleksi_dan_Rubrik_${data.metadata.tahun_ajaran?.replace('/', '-') || '2025-2026'}.docx`;

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', buffer.length.toString());

    return c.body(buffer as any);
  } catch (e: any) {
    console.error('Program Sekolah DOCX Lampiran Export Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 3c: Ambil Matriks & Agenda Kalender Pendidikan Resmi & Kustom
// ============================================
programSekolah.post('/kaldik-matrix', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const customEvents = body.customEvents || [];
    const sistemHariSekolah = body.sistemHariSekolah || '5-hari';
    const allEvents = mergeKaldikEvents(customEvents, true);
    const grid = generate12MonthGrid(allEvents, { sistemHariSekolah });
    const stats = calculateKaldikStats(grid, { sistemHariSekolah });
    return successResponse(c, { events: allEvents, grid, stats });
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 4: Simpan ke Arsip Database
// ============================================
programSekolah.post('/save', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureProgramSekolahTables(c.env.DB);

    const body = await c.req.json();
    const { data } = body;
    if (!data || !data.metadata) {
      return Errors.badRequest(c, 'Data program sekolah tidak valid');
    }

    const contentJson = JSON.stringify(data);
    const res = await c.env.DB.prepare(`
      INSERT INTO program_sekolah_history (
        user_id, user_nama, nama_sekolah, template_id, judul_program, tahun_ajaran, penyusun, content_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      user.nama || data.metadata.penyusun || 'Pendidik',
      data.metadata.nama_sekolah || user.sekolah || 'Sekolah',
      data.metadata.template_id || 'kokurikuler-p5',
      data.metadata.judul_program || 'Program Sekolah',
      data.metadata.tahun_ajaran || '2025/2026',
      data.metadata.penyusun || user.nama || 'Penyusun',
      contentJson
    ).run();

    return successResponse(c, { id: res.meta.last_row_id }, 'Dokumen Program Sekolah berhasil disimpan ke arsip');
  } catch (e: any) {
    console.error('Save Program Sekolah History Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 5: Riwayat Program Sekolah Pengguna
// ============================================
programSekolah.get('/history', async (c) => {
  try {
    const sessionId = (c.get('sessionId' as any) as string) || getCookie(c.req.header('Cookie'), 'session');
    const user: any = c.get('user' as any) || await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureProgramSekolahTables(c.env.DB);

    const results = await c.env.DB.prepare(`
      SELECT id, user_id, user_nama, nama_sekolah, template_id, judul_program, tahun_ajaran, penyusun, created_at
      FROM program_sekolah_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return successResponse(c, results.results || []);
  } catch (e: any) {
    console.error('List History Program Sekolah Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 6: Ambil Detail Dokumen Tersimpan
// ============================================
programSekolah.get('/:id', async (c) => {
  try {
    await ensureProgramSekolahTables(c.env.DB);
    const id = c.req.param('id');
    const result: any = await c.env.DB.prepare(`
      SELECT * FROM program_sekolah_history WHERE id = ?
    `).bind(id).first();

    if (!result) return Errors.notFound(c, 'Dokumen Program Sekolah tidak ditemukan');

    try {
      result.content = JSON.parse(result.content_json);
    } catch (_) {
      result.content = null;
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Get Program Sekolah Detail Error:', e);
    return Errors.internal(c, e.message);
  }
});

// ============================================
// Endpoint 7: Hapus Dokumen Riwayat
// ============================================
programSekolah.delete('/:id', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    if (!user) return Errors.unauthorized(c);

    await ensureProgramSekolahTables(c.env.DB);

    const id = c.req.param('id');
    const item: any = await c.env.DB.prepare(`
      SELECT user_id FROM program_sekolah_history WHERE id = ?
    `).bind(id).first();

    if (!item) return Errors.notFound(c, 'Dokumen tidak ditemukan');

    if (item.user_id !== user.id && user.role !== 'admin') {
      return Errors.forbidden(c, 'Hanya pembuat dokumen atau admin yang dapat menghapus dokumen ini');
    }

    await c.env.DB.prepare(`DELETE FROM program_sekolah_history WHERE id = ?`).bind(id).run();
    return successResponse(c, null, 'Dokumen Program Sekolah berhasil dihapus');
  } catch (e: any) {
    console.error('Delete Program Sekolah Error:', e);
    return Errors.internal(c, e.message);
  }
});

export default programSekolah;
