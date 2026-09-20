/**
 * Kaldik Excel Generator (OpenXML SpreadsheetML .xlsx Builder)
 * Menghasilkan file Microsoft Excel (.xlsx) Kalender Pendidikan Satuan Pendidikan (KPSP)
 * yang dimodelkan persis sesuai dengan "Kaldik Madrasah 2026-2027 Pendis.xlsx".
 * 
 * Terdiri dari 3 Worksheet Resmi:
 * 1. "Tanggal Penting" - Matriks ringkas tanggal-tanggal penting Semester Gasal & Semester Genap
 * 2. "Kalender Pendidikan" - Matriks landscape 12 bulan (4 bulan x 3 baris) dengan KOP surat sekolah & legend warna
 * 3. "Kaldik Portrait" - Format portrait 12 bulan dengan rincian HK (Hari Kalender), HE (Hari Efektif), agenda bulanan, dan jadwal semester
 * 
 * Dilengkapi dengan KOP Surat Resmi yang otomatis menyesuaikan dengan akun dan profil masing-masing sekolah.
 */

import JSZip from 'jszip';
import {
  generate12MonthGrid,
  calculateKaldikStats,
  mergeKaldikEvents,
  KaldikEventItem,
  MonthGridData,
  KaldikStatistics,
  MONTH_CONFIGS,
  isDateInEvent
} from './kaldik-calendar-engine';

export interface KaldikExcelInput {
  metadata?: {
    nama_sekolah?: string;
    npsn?: string;
    tahun_ajaran?: string;
    kepala_sekolah?: string;
    nip_kepala_sekolah?: string;
    penyusun?: string;
    nip_penyusun?: string;
    kabupaten?: string;
    kecamatan?: string;
    kota?: string;
    alamat_sekolah?: string;
    instansi?: string;
  };
  spesifik?: {
    sistemHariSekolah?: string;
    agendaKeagamaan?: string;
    agendaPurwakarta?: string;
    kegiatanKustomTambahan?: string;
  };
  customEvents?: KaldikEventItem[];
}

function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colToLetter(col: number): string {
  let temp = 0;
  let letter = '';
  let c = col;
  while (c > 0) {
    temp = (c - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    c = Math.floor((c - temp - 1) / 26);
  }
  return letter;
}

interface EventRule {
  start: string;
  end: string;
  title: string;
  shortTitle: string;
  styleId: number;
  category: string;
}

// Aturan kalender resmi 2026/2027 sesuai SE Kadisdik Purwakarta & Kaldik Pendis
const EVENT_RULES: EventRule[] = [
  // Semester Gasal
  { start: '2026-07-01', end: '2026-07-10', title: 'Libur Akhir Tahun Ajaran 2025/2026', shortTitle: 'Libur TP', styleId: 13, category: 'libur' },
  { start: '2026-07-13', end: '2026-07-13', title: 'Awal Masuk Tahun Ajaran 2026/2027', shortTitle: 'Awal TP', styleId: 15, category: 'sekolah' },
  { start: '2026-07-13', end: '2026-07-17', title: 'Pengenalan Lingkungan Sekolah (MPLS) Ramah Anak', shortTitle: 'MPLS', styleId: 10, category: 'purwakarta' },
  { start: '2026-07-20', end: '2026-07-20', title: 'Peringatan Hari Jadi Purwakarta (HJP ke-195)', shortTitle: 'HJP', styleId: 17, category: 'purwakarta' },
  { start: '2026-08-14', end: '2026-08-14', title: 'Peringatan Hari Pramuka ke-65', shortTitle: 'Pramuka', styleId: 18, category: 'nasional' },
  { start: '2026-08-17', end: '2026-08-17', title: 'HUT Proklamasi Kemerdekaan RI ke-81', shortTitle: 'HUT RI', styleId: 16, category: 'nasional' },
  { start: '2026-08-25', end: '2026-08-25', title: 'Peringatan Maulid Nabi Muhammad saw. (12 Rabiul Awal 1448 H)', shortTitle: 'Maulid', styleId: 16, category: 'keagamaan' },
  { start: '2026-09-07', end: '2026-09-07', title: 'Hari Udara Bersih Internasional (Gerakan TdBA)', shortTitle: 'Udara Bersih', styleId: 18, category: 'purwakarta' },
  { start: '2026-09-18', end: '2026-09-18', title: 'Hari Bambu Sedunia (TdBA Purwakarta)', shortTitle: 'Hari Bambu', styleId: 18, category: 'purwakarta' },
  { start: '2026-09-21', end: '2026-09-25', title: 'Rentang Asesmen Sumatif Tengah Semester (STS) Gasal', shortTitle: 'STS', styleId: 11, category: 'asesmen' },
  { start: '2026-10-01', end: '2026-10-01', title: 'Hari Kesaktian Pancasila', shortTitle: 'Pancasila', styleId: 18, category: 'nasional' },
  { start: '2026-10-28', end: '2026-10-28', title: 'Peringatan Hari Sumpah Pemuda', shortTitle: 'Sumpah Pemuda', styleId: 18, category: 'nasional' },
  { start: '2026-11-10', end: '2026-11-10', title: 'Peringatan Hari Pahlawan Nasional', shortTitle: 'Hari Pahlawan', styleId: 18, category: 'nasional' },
  { start: '2026-11-23', end: '2026-12-05', title: 'Rentang Asesmen Sumatif Akhir Semester (SAS / ASAS) Gasal', shortTitle: 'ASAS', styleId: 11, category: 'asesmen' },
  { start: '2026-11-25', end: '2026-11-25', title: 'Hari Guru Nasional (HGN) & HUT PGRI ke-81', shortTitle: 'HGN', styleId: 18, category: 'nasional' },
  { start: '2026-12-18', end: '2026-12-19', title: 'Penyerahan Laporan Hasil Belajar (Rapor) Semester Gasal', shortTitle: 'Rapor', styleId: 12, category: 'sekolah' },
  { start: '2026-12-21', end: '2027-01-02', title: 'Libur Semester Gasal', shortTitle: 'Libur Smt', styleId: 13, category: 'libur' },
  { start: '2026-12-25', end: '2026-12-25', title: 'Hari Raya Natal', shortTitle: 'Natal', styleId: 16, category: 'keagamaan' },

  // Semester Genap
  { start: '2027-01-01', end: '2027-01-01', title: 'Tahun Baru 2027 Masehi', shortTitle: 'Tahun Baru', styleId: 16, category: 'nasional' },
  { start: '2027-01-04', end: '2027-01-04', title: 'Awal Masuk KBM Semester Genap TP 2026/2027', shortTitle: 'Masuk Smt 2', styleId: 15, category: 'sekolah' },
  { start: '2027-02-05', end: '2027-02-05', title: 'Peringatan Isra Mi\'raj Nabi Muhammad saw. (27 Rajab 1448 H)', shortTitle: 'Isra Mi\'raj', styleId: 16, category: 'keagamaan' },
  { start: '2027-02-06', end: '2027-02-06', title: 'Tahun Baru Imlek 2578 Kongzili', shortTitle: 'Imlek', styleId: 16, category: 'nasional' },
  { start: '2027-02-08', end: '2027-02-10', title: 'Libur Awal Ramadhan 1448 H', shortTitle: 'Awal Ramadhan', styleId: 14, category: 'keagamaan' },
  { start: '2027-02-11', end: '2027-03-05', title: 'Masantren di Sakola Ramadhan 1448 H', shortTitle: 'Masantren', styleId: 18, category: 'keagamaan' },
  { start: '2027-03-06', end: '2027-03-13', title: 'Libur Seputar Hari Raya Idulfitri 1448 H', shortTitle: 'Libur Idul Fitri', styleId: 14, category: 'keagamaan' },
  { start: '2027-03-09', end: '2027-03-09', title: 'Hari Suci Nyepi (Tahun Baru Saka 1949)', shortTitle: 'Nyepi', styleId: 16, category: 'nasional' },
  { start: '2027-03-10', end: '2027-03-11', title: 'Hari Raya Idulfitri 1448 H', shortTitle: 'Idul Fitri', styleId: 16, category: 'keagamaan' },
  { start: '2027-03-22', end: '2027-03-26', title: 'Rentang Asesmen Sumatif Tengah Semester (STS) Genap', shortTitle: 'STS', styleId: 11, category: 'asesmen' },
  { start: '2027-03-26', end: '2027-03-26', title: 'Wafat Yesus Kristus', shortTitle: 'Wafat Isa', styleId: 16, category: 'nasional' },
  { start: '2027-04-21', end: '2027-04-21', title: 'Peringatan Hari Kartini', shortTitle: 'Kartini', styleId: 17, category: 'nasional' },
  { start: '2027-04-22', end: '2027-04-22', title: 'Hari Bumi Sedunia (Aksi TdBA Purwakarta)', shortTitle: 'Hari Bumi', styleId: 18, category: 'purwakarta' },
  { start: '2027-05-01', end: '2027-05-01', title: 'Hari Buruh Internasional', shortTitle: 'Hari Buruh', styleId: 16, category: 'nasional' },
  { start: '2027-05-02', end: '2027-05-02', title: 'Hari Pendidikan Nasional (Hardiknas)', shortTitle: 'Hardiknas', styleId: 18, category: 'nasional' },
  { start: '2027-05-10', end: '2027-05-14', title: 'Rentang Asesmen Akhir Jenjang (PSAJ) Kelas 6', shortTitle: 'PSAJ', styleId: 15, category: 'asesmen' },
  { start: '2027-05-16', end: '2027-05-16', title: 'Hari Raya Idul Adha 1448 H', shortTitle: 'Idul Adha', styleId: 16, category: 'keagamaan' },
  { start: '2027-05-20', end: '2027-05-20', title: 'Hari Kebangkitan Nasional (Harkitnas)', shortTitle: 'Harkitnas', styleId: 18, category: 'nasional' },
  { start: '2027-05-24', end: '2027-06-05', title: 'Rentang Asesmen Sumatif Akhir Tahun (ASAT / ASAS Genap)', shortTitle: 'ASAT', styleId: 11, category: 'asesmen' },
  { start: '2027-06-01', end: '2027-06-01', title: 'Hari Lahir Pancasila', shortTitle: 'Lahir Pancasila', styleId: 16, category: 'nasional' },
  { start: '2027-06-16', end: '2027-06-16', title: 'Tahun Baru Islam 1 Muharram 1449 H', shortTitle: '1 Muharram', styleId: 16, category: 'keagamaan' },
  { start: '2027-06-18', end: '2027-06-19', title: 'Penyerahan Laporan Hasil Belajar (Rapor) Semester Genap', shortTitle: 'Rapor', styleId: 12, category: 'sekolah' },
  { start: '2027-06-21', end: '2027-07-10', title: 'Libur Akhir Tahun Ajaran 2026/2027', shortTitle: 'Libur Akhir TP', styleId: 13, category: 'libur' },
];

function findEventForDate(dateStr: string): EventRule | null {
  for (const ev of EVENT_RULES) {
    if (dateStr >= ev.start && dateStr <= ev.end) {
      return ev;
    }
  }
  return null;
}

/**
 * Membangun buffer file Microsoft Excel (.xlsx) untuk Kalender Pendidikan
 * dengan 3 worksheet dan KOP surat otomatis sesuai akun masing-masing sekolah.
 */
export async function generateKaldikExcelBuffer(input: KaldikExcelInput = {}): Promise<Uint8Array> {
  const meta = input.metadata || {};
  const namaSekolah = meta.nama_sekolah || 'SD NEGERI 1 WANAYASA';
  const npsn = meta.npsn || '';
  const tahunAjaran = meta.tahun_ajaran || '2026/2027';
  const kepalaSekolah = meta.kepala_sekolah || 'Hj. Nenden Laila, M.Pd.';
  const nipKepalaSekolah = meta.nip_kepala_sekolah || '19760314 200501 2 006';
  const penyusun = meta.penyusun || 'Tim Pengembang Kurikulum';
  const nipPenyusun = meta.nip_penyusun || '-';
  const kabupaten = meta.kabupaten || meta.kota || 'Purwakarta';
  const kecamatan = meta.kecamatan || 'Wanayasa';
  const alamat = meta.alamat_sekolah || `Kecamatan ${kecamatan}, Kabupaten ${kabupaten}`;
  const instansi = meta.instansi || 'DINAS PENDIDIKAN';

  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
</Relationships>`
  );

  // 4. xl/workbook.xml - 3 Lembar Kerja persis Kaldik Madrasah Pendis
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Tanggal Penting" sheetId="1" r:id="rId2"/>
    <sheet name="Kalender Pendidikan" sheetId="2" r:id="rId3"/>
    <sheet name="Kaldik Portrait" sheetId="3" r:id="rId4"/>
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml
  zip.file('xl/styles.xml', buildPendisStylesXml());

  // 6. Worksheets
  const ctx = {
    namaSekolah,
    npsn,
    tahunAjaran,
    kepalaSekolah,
    nipKepalaSekolah,
    penyusun,
    nipPenyusun,
    kabupaten,
    kecamatan,
    alamat,
    instansi
  };

  zip.file('xl/worksheets/sheet1.xml', buildTanggalPentingSheetXml(ctx));
  zip.file('xl/worksheets/sheet2.xml', buildKalenderLandscapeSheetXml(ctx));
  zip.file('xl/worksheets/sheet3.xml', buildKaldikPortraitSheetXml(ctx));

  const arrayBuffer = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return arrayBuffer;
}

/**
 * Stylesheet XML builder persis dengan skema warna file acuan Pendis
 */
function buildPendisStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="15">
    <!-- 0: Calibri 10pt normal -->
    <font><sz val="10"/><name val="Calibri"/></font>
    <!-- 1: Calibri 10pt bold -->
    <font><b/><sz val="10"/><name val="Calibri"/></font>
    <!-- 2: Calibri 11pt normal -->
    <font><sz val="11"/><name val="Calibri"/></font>
    <!-- 3: Calibri 11pt bold -->
    <font><b/><sz val="11"/><name val="Calibri"/></font>
    <!-- 4: Calibri 10pt bold Yellow (FFFFFF00) -->
    <font><b/><sz val="10"/><color rgb="FFFFFF00"/><name val="Calibri"/></font>
    <!-- 5: Calibri 10pt bold White (FFFFFFFF) -->
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <!-- 6: Calibri 9pt bold Red (FFFF0000) -->
    <font><b/><sz val="9"/><color rgb="FFFF0000"/><name val="Calibri"/></font>
    <!-- 7: Calibri 10pt normal Red (FFFF0000) -->
    <font><sz val="10"/><color rgb="FFFF0000"/><name val="Calibri"/></font>
    <!-- 8: Calibri 8pt bold -->
    <font><b/><sz val="8"/><name val="Calibri"/></font>
    <!-- 9: Calibri 8pt normal -->
    <font><sz val="8"/><name val="Calibri"/></font>
    <!-- 10: Calibri 13pt bold Navy/Black -->
    <font><b/><sz val="13"/><color rgb="FF002060"/><name val="Calibri"/></font>
    <!-- 11: Calibri 15pt bold Navy/Black -->
    <font><b/><sz val="15"/><color rgb="FF002060"/><name val="Calibri"/></font>
    <!-- 12: Calibri 9pt italic Slate -->
    <font><i/><sz val="9"/><color rgb="FF475569"/><name val="Calibri"/></font>
    <!-- 13: Calibri 9pt bold -->
    <font><b/><sz val="9"/><name val="Calibri"/></font>
    <!-- 14: Calibri 9pt normal -->
    <font><sz val="9"/><name val="Calibri"/></font>
  </fonts>

  <fills count="20">
    <!-- 0: none -->
    <fill><patternFill patternType="none"/></fill>
    <!-- 1: gray125 -->
    <fill><patternFill patternType="gray125"/></fill>
    <!-- 2: Hijau Tua Pendis Header (#006600) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF006600"/></patternFill></fill>
    <!-- 3: Soft Gray Header (#F2F2F2) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/></patternFill></fill>
    <!-- 4: MPLS Sky Blue (#00B0F0) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF00B0F0"/></patternFill></fill>
    <!-- 5: SAS / ASAS Bright Green (#00CC00) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF00CC00"/></patternFill></fill>
    <!-- 6: Rapor Yellow (#FFFF00) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill>
    <!-- 7: Libur Semester Pink/Magenta (#FF66FF) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFF66FF"/></patternFill></fill>
    <!-- 8: Libur Idul Fitri Orange (#FFC000) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFC000"/></patternFill></fill>
    <!-- 9: Ujian/PSAJ Light Green (#92D050) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF92D050"/></patternFill></fill>
    <!-- 10: Libur Nasional/Keagamaan Red (#FF0000) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFF0000"/></patternFill></fill>
    <!-- 11: Hari Jadi Purwakarta Soft Pink (#F472B6) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF472B6"/></patternFill></fill>
    <!-- 12: TdBA Soft Teal (#A7F3D0) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFA7F3D0"/></patternFill></fill>
    <!-- 13: Light Gray Box (#E2E8F0) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
    <!-- 14: Soft Emerald Total (#E8F5E9) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8F5E9"/></patternFill></fill>
  </fills>

  <borders count="4">
    <!-- 0: none -->
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <!-- 1: Thin border (#CBD5E1 / #D9D9D9) -->
    <border>
      <left style="thin"><color rgb="FFD9D9D9"/></left>
      <right style="thin"><color rgb="FFD9D9D9"/></right>
      <top style="thin"><color rgb="FFD9D9D9"/></top>
      <bottom style="thin"><color rgb="FFD9D9D9"/></bottom>
      <diagonal/>
    </border>
    <!-- 2: Thin border with dark header -->
    <border>
      <left style="thin"><color rgb="FFBFBFBF"/></left>
      <right style="thin"><color rgb="FFBFBFBF"/></right>
      <top style="thin"><color rgb="FFBFBFBF"/></top>
      <bottom style="medium"><color rgb="FF006600"/></bottom>
      <diagonal/>
    </border>
    <!-- 3: Thick double bottom border untuk Kop Surat -->
    <border>
      <left/><right/><top/>
      <bottom style="double"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
  </borders>

  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>

  <cellXfs count="30">
    <!-- 0: Normal text -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <!-- 1: Kop Title 15pt Bold Centered -->
    <xf numFmtId="0" fontId="11" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 2: Kop Instansi 11pt Bold Centered -->
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 3: Kop Alamat 9pt Italic Centered -->
    <xf numFmtId="0" fontId="12" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 4: Kop Separator Thick Double Bottom Border -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="3" xfId="0" applyBorder="1"/>
    <!-- 5: Month Header Hijau Tua (#006600) with Yellow Bold Centered -->
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 6: Day Name Header Aha (Red Bold Centered) -->
    <xf numFmtId="0" fontId="6" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 7: Day Name Header Sen..Sab (Bold Centered) -->
    <xf numFmtId="0" fontId="13" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 8: Date Cell Normal Weekday (Centered, Border 1) -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 9: Date Cell Sunday (Red font, Centered, Border 1) -->
    <xf numFmtId="0" fontId="7" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 10: Event Cell: MPLS Sky Blue (#00B0F0) -->
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 11: Event Cell: SAS / ASAS Bright Green (#00CC00) -->
    <xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 12: Event Cell: Rapor Yellow (#FFFF00) -->
    <xf numFmtId="0" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 13: Event Cell: Libur Semester Pink (#FF66FF) -->
    <xf numFmtId="0" fontId="1" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 14: Event Cell: Libur Idul Fitri Orange (#FFC000) -->
    <xf numFmtId="0" fontId="1" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 15: Event Cell: PSAJ / Awal Masuk Light Green (#92D050) -->
    <xf numFmtId="0" fontId="1" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 16: Event Cell: Libur Nasional Red (#FF0000, White font) -->
    <xf numFmtId="0" fontId="5" fillId="10" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 17: Event Cell: HJP Soft Pink (#F472B6) -->
    <xf numFmtId="0" fontId="1" fillId="11" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 18: Event Cell: TdBA Soft Teal (#A7F3D0) -->
    <xf numFmtId="0" fontId="1" fillId="12" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 19: Table Header Gray Bold Left/Center -->
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 20: Table Content Left (Border 1) -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 21: Table Content Center (Border 1) -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 22: Table Content Bold Left (Border 1) -->
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 23: Table Content Bold Center (Border 1) -->
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 24: HK / HE Label 8pt Bold Left -->
    <xf numFmtId="0" fontId="8" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 25: HK / HE Value 8pt Bold Center -->
    <xf numFmtId="0" fontId="8" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 26: Section Header Hijau Tua White (Left, Border 1) -->
    <xf numFmtId="0" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 27: Legend Text 8pt Normal Left -->
    <xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 28: Signature Name 10pt Bold Underline -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 29: Signature Title / NIP 9pt Centered -->
    <xf numFmtId="0" fontId="14" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

interface SheetContext {
  namaSekolah: string;
  npsn: string;
  tahunAjaran: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  penyusun: string;
  nipPenyusun: string;
  kabupaten: string;
  kecamatan: string;
  alamat: string;
  instansi: string;
}

/**
 * SHEET 1: Tanggal Penting (Persis layout sheet 1 di file acuan)
 */
function buildTanggalPentingSheetXml(ctx: SheetContext): string {
  const rows: string[] = [];

  rows.push(`
    <row r="1" ht="24" customHeight="1">
      <c r="B1" s="3" t="inlineStr"><is><t>Tanggal-tanggal Penting dalam Kalender Pendidikan Satuan Pendidikan ${escapeXml(ctx.tahunAjaran)}</t></is></c>
    </row>
    <row r="2" ht="18" customHeight="1">
      <c r="B2" s="12" t="inlineStr"><is><t>${escapeXml(ctx.namaSekolah.toUpperCase())} • ${escapeXml(ctx.instansi.toUpperCase())} KABUPATEN ${escapeXml(ctx.kabupaten.toUpperCase())}</t></is></c>
    </row>
    <row r="3" ht="22" customHeight="1">
      <c r="B3" s="3" t="inlineStr"><is><t>Semester Gasal</t></is></c>
    </row>
    <row r="4" ht="22" customHeight="1">
      <c r="B4" s="19" t="inlineStr"><is><t>Tanggal</t></is></c>
      <c r="C4" s="19" t="inlineStr"><is><t>Keterangan</t></is></c>
    </row>
  `);

  const gasalEvents = [
    { tgl: '13 Juli 2026', desc: 'Awal Masuk Tahun Ajaran 2026/2027' },
    { tgl: '13 – 18 Juli 2026', desc: 'Rentang Waktu Pengenalan Lingkungan Sekolah (MPLS) Ramah Anak' },
    { tgl: '20 Juli 2026', desc: 'Peringatan Hari Jadi Purwakarta (HJP ke-195 / Kabupaten ke-58)' },
    { tgl: '14 Agustus 2026', desc: 'Peringatan Hari Pramuka Nasional ke-65' },
    { tgl: '17 Agustus 2026', desc: 'HUT Proklamasi Kemerdekaan RI ke-81' },
    { tgl: '25 Agustus 2026', desc: 'Maulid Nabi Muhammad saw. (12 Rabiul Awal 1448 H)' },
    { tgl: '7 September 2026', desc: 'Hari Udara Bersih Internasional (Aksi TdBA Purwakarta)' },
    { tgl: '18 September 2026', desc: 'Hari Bambu Sedunia (World Bamboo Day - Gerakan TdBA)' },
    { tgl: '21 – 25 September 2026', desc: 'Rentang Asesmen Sumatif Tengah Semester (STS) Gasal' },
    { tgl: '1 Oktober 2026', desc: 'Peringatan Hari Kesaktian Pancasila' },
    { tgl: '28 Oktober 2026', desc: 'Peringatan Hari Sumpah Pemuda' },
    { tgl: '10 November 2026', desc: 'Peringatan Hari Pahlawan Nasional' },
    { tgl: '23 November – 05 Desember 2026', desc: 'Rentang Asesmen Sumatif Akhir Semester (SAS / ASAS) Gasal' },
    { tgl: '25 November 2026', desc: 'Hari Guru Nasional (HGN) dan HUT PGRI ke-81' },
    { tgl: '18 atau 19 Desember 2026', desc: 'Penyerahan Laporan Hasil Belajar (Rapor) Semester Gasal' },
    { tgl: '25 Desember 2026', desc: 'Hari Raya Natal' },
    { tgl: '21 Desember 2026 – 02 Januari 2027', desc: 'Libur Semester Gasal' },
  ];

  let cur = 5;
  gasalEvents.forEach(ev => {
    rows.push(`
      <row r="${cur}" ht="20" customHeight="1">
        <c r="B${cur}" s="20" t="inlineStr"><is><t>${escapeXml(ev.tgl)}</t></is></c>
        <c r="C${cur}" s="20" t="inlineStr"><is><t>${escapeXml(ev.desc)}</t></is></c>
      </row>
    `);
    cur++;
  });

  // Spacer
  cur++;

  rows.push(`
    <row r="${cur}" ht="22" customHeight="1">
      <c r="B${cur}" s="3" t="inlineStr"><is><t>Semester Genap</t></is></c>
    </row>
  `);
  cur++;

  rows.push(`
    <row r="${cur}" ht="22" customHeight="1">
      <c r="B${cur}" s="19" t="inlineStr"><is><t>Tanggal</t></is></c>
      <c r="C${cur}" s="19" t="inlineStr"><is><t>Keterangan</t></is></c>
    </row>
  `);
  cur++;

  const genapEvents = [
    { tgl: '1 Januari 2027', desc: 'Tahun Baru 2027 Masehi' },
    { tgl: '4 Januari 2027', desc: 'Awal Masuk KBM Semester Genap Tahun Ajaran 2026/2027' },
    { tgl: '5 Februari 2027', desc: 'Peringatan Isra Mi\'raj Nabi Muhammad saw. (27 Rajab 1448 H)' },
    { tgl: '6 Februari 2027', desc: 'Tahun Baru Imlek 2578 Kongzili' },
    { tgl: '8 – 10 Februari 2027', desc: 'Libur Awal Ramadhan 1448 H' },
    { tgl: '11 – 28 Februari 2027', desc: 'Masantren di Sakola Ramadhan 1448 H' },
    { tgl: '1 – 5 Maret 2027', desc: 'Lanjutan Masantren di Sakola Ramadhan 1448 H' },
    { tgl: '6 – 13 Maret 2027', desc: 'Libur seputar Hari Raya Idulfitri 1448 H' },
    { tgl: '9 Maret 2027', desc: 'Hari Suci Nyepi (Tahun Baru Saka 1949)' },
    { tgl: '10 – 11 Maret 2027', desc: 'Hari Raya Idulfitri 1448 H' },
    { tgl: '22 – 26 Maret 2027', desc: 'Rentang Asesmen Sumatif Tengah Semester (STS) Genap' },
    { tgl: '26 Maret 2027', desc: 'Wafat Yesus Kristus' },
    { tgl: '21 April 2027', desc: 'Peringatan Hari Kartini' },
    { tgl: '22 April 2027', desc: 'Hari Bumi Sedunia (Aksi Konservasi Lingkungan TdBA Purwakarta)' },
    { tgl: '1 Mei 2027', desc: 'Hari Buruh Internasional' },
    { tgl: '2 Mei 2027', desc: 'Hari Pendidikan Nasional (Hardiknas)' },
    { tgl: '10 – 14 Mei 2027', desc: 'Rentang Asesmen Akhir Jenjang (PSAJ) Kelas 6' },
    { tgl: '16 Mei 2027', desc: 'Hari Raya Idul Adha 1448 H (10 Dzulhijjah 1448 H)' },
    { tgl: '20 Mei 2027', desc: 'Hari Kebangkitan Nasional (Harkitnas)' },
    { tgl: '24 Mei – 5 Juni 2027', desc: 'Rentang Asesmen Sumatif Akhir Tahun (ASAT / ASAS Genap)' },
    { tgl: '1 Juni 2027', desc: 'Hari Lahir Pancasila' },
    { tgl: '16 Juni 2027', desc: 'Tahun Baru Islam 1 Muharram 1449 H' },
    { tgl: '18 atau 19 Juni 2027', desc: 'Penyerahan Laporan Hasil Belajar (Rapor) Semester Genap' },
    { tgl: '21 Juni – 10 Juli 2027', desc: 'Libur Akhir Tahun Ajaran 2026/2027' },
  ];

  genapEvents.forEach(ev => {
    rows.push(`
      <row r="${cur}" ht="20" customHeight="1">
        <c r="B${cur}" s="20" t="inlineStr"><is><t>${escapeXml(ev.tgl)}</t></is></c>
        <c r="C${cur}" s="20" t="inlineStr"><is><t>${escapeXml(ev.desc)}</t></is></c>
      </row>
    `);
    cur++;
  });

  const colsXml = `
    <cols>
      <col min="1" max="1" width="3" customWidth="1"/>
      <col min="2" max="2" width="35" customWidth="1"/>
      <col min="3" max="3" width="75" customWidth="1"/>
      <col min="4" max="4" width="10" customWidth="1"/>
    </cols>
  `;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="0" workbookViewId="0" showGridLines="1"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  ${colsXml}
  <sheetData>
    ${rows.join('\n')}
  </sheetData>
</worksheet>`;
}

/**
 * SHEET 2: Kalender Pendidikan (Landscape 4 Bulan x 3 Baris persis Kaldik Pendis)
 */
function buildKalenderLandscapeSheetXml(ctx: SheetContext): string {
  const rows: string[] = [];
  const merges: string[] = [];

  // Baris 1-5: KOP SURAT RESMI MASING-MASING AKUN SEKOLAH
  rows.push(`
    <row r="1" ht="18" customHeight="1">
      <c r="C1" s="2" t="inlineStr"><is><t>PEMERINTAH KABUPATEN ${escapeXml(ctx.kabupaten.toUpperCase())} • ${escapeXml(ctx.instansi.toUpperCase())}</t></is></c>
      <c r="U1" s="12" t="inlineStr"><is><t>Surat Edaran Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026</t></is></c>
    </row>
    <row r="2" ht="24" customHeight="1">
      <c r="C2" s="1" t="inlineStr"><is><t>${escapeXml(ctx.namaSekolah.toUpperCase())}</t></is></c>
      <c r="U2" s="12" t="inlineStr"><is><t>Permendikdasmen No. 13 Tahun 2025 (Min. 36 Pekan Efektif KBM)</t></is></c>
    </row>
    <row r="3" ht="16" customHeight="1">
      <c r="C3" s="3" t="inlineStr"><is><t>${escapeXml(ctx.alamat)}${ctx.npsn ? ' • NPSN: ' + escapeXml(ctx.npsn) : ''}</t></is></c>
    </row>
    <row r="4" ht="22" customHeight="1">
      <c r="C4" s="3" t="inlineStr"><is><t>PEDOMAN KALENDER PENDIDIKAN SATUAN PENDIDIKAN TAHUN AJARAN ${escapeXml(ctx.tahunAjaran)}</t></is></c>
    </row>
    <row r="5" ht="10" customHeight="1"/>
  `);

  merges.push('C1:T1', 'U1:AG1', 'C2:T2', 'U2:AG2', 'C3:AG3', 'C4:AG4');

  // Definisi 12 Bulan (4 bulan per baris)
  const monthRows = [
    // Baris 1: Juli, Agustus, September, Oktober 2026
    {
      startRow: 6,
      months: [
        { name: 'JULI 2026', year: 2026, month: 7, startCol: 3 },      // C..I
        { name: 'AGUSTUS 2026', year: 2026, month: 8, startCol: 11 },   // K..Q
        { name: 'SEPTEMBER 2026', year: 2026, month: 9, startCol: 19 }, // S..Y
        { name: 'OKTOBER 2026', year: 2026, month: 10, startCol: 27 }   // AA..AG
      ]
    },
    // Baris 2: November, Desember 2026, Januari, Februari 2027
    {
      startRow: 16,
      months: [
        { name: 'NOVEMBER 2026', year: 2026, month: 11, startCol: 3 },
        { name: 'DESEMBER 2026', year: 2026, month: 12, startCol: 11 },
        { name: 'JANUARI 2027', year: 2027, month: 1, startCol: 19 },
        { name: 'FEBRUARI 2027', year: 2027, month: 2, startCol: 27 }
      ]
    },
    // Baris 3: Maret, April, Mei, Juni 2027
    {
      startRow: 26,
      months: [
        { name: 'MARET 2027', year: 2027, month: 3, startCol: 3 },
        { name: 'APRIL 2027', year: 2027, month: 4, startCol: 11 },
        { name: 'MEI 2027', year: 2027, month: 5, startCol: 19 },
        { name: 'JUNI 2027', year: 2027, month: 6, startCol: 27 }
      ]
    }
  ];

  // Render masing-masing baris bulan
  monthRows.forEach(mrow => {
    const sRow = mrow.startRow;

    // 1. Month Titles (Row sRow)
    let rTitle = `<row r="${sRow}" ht="20" customHeight="1">`;
    mrow.months.forEach(m => {
      const cLetterStart = colToLetter(m.startCol);
      const cLetterEnd = colToLetter(m.startCol + 6);
      rTitle += `<c r="${cLetterStart}${sRow}" s="5" t="inlineStr"><is><t>${m.name}</t></is></c>`;
      for (let c = m.startCol + 1; c <= m.startCol + 6; c++) {
        rTitle += `<c r="${colToLetter(c)}${sRow}" s="5"/>`;
      }
      merges.push(`${cLetterStart}${sRow}:${cLetterEnd}${sRow}`);
    });
    rTitle += `</row>`;
    rows.push(rTitle);

    // 2. Day Headers Aha..Sab (Row sRow + 1)
    const dayNames = ['Aha', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    let rDays = `<row r="${sRow + 1}" ht="18" customHeight="1">`;
    mrow.months.forEach(m => {
      dayNames.forEach((dName, dIdx) => {
        const cLetter = colToLetter(m.startCol + dIdx);
        const style = dIdx === 0 ? 6 : 7; // Aha red font, others normal
        rDays += `<c r="${cLetter}${sRow + 1}" s="${style}" t="inlineStr"><is><t>${dName}</t></is></c>`;
      });
    });
    rDays += `</row>`;
    rows.push(rDays);

    // 3. Grid Tanggal 6 Baris (Row sRow + 2 s.d. sRow + 7)
    for (let w = 0; w < 6; w++) {
      const curR = sRow + 2 + w;
      let rWeek = `<row r="${curR}" ht="18" customHeight="1">`;

      mrow.months.forEach(m => {
        const daysInMonth = new Date(m.year, m.month, 0).getDate();
        const firstDow = new Date(m.year, m.month - 1, 1).getDay(); // 0=Aha, 1=Sen, ...

        for (let dow = 0; dow < 7; dow++) {
          const colLetter = colToLetter(m.startCol + dow);
          const cellIndex = w * 7 + dow;
          const dayNum = cellIndex - firstDow + 1;

          if (dayNum >= 1 && dayNum <= daysInMonth) {
            const dateStr = `${m.year}-${String(m.month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const ev = findEventForDate(dateStr);
            let style = dow === 0 ? 9 : 8; // Sunday red or normal weekday

            if (ev) {
              style = ev.styleId;
            }

            rWeek += `<c r="${colLetter}${curR}" s="${style}"><v>${dayNum}</v></c>`;
          } else {
            rWeek += `<c r="${colLetter}${curR}" s="8"/>`;
          }
        }
      });

      rWeek += `</row>`;
      rows.push(rWeek);
    }
  });

  // Baris 35: Spacing
  rows.push('<row r="35" ht="12" customHeight="1"/>');

  // Baris 36-44: KETERANGAN LEGEND PERSIS KALDIK PENDIS & TANDA TANGAN RESMI
  rows.push(`
    <row r="36" ht="20" customHeight="1">
      <c r="C36" s="26" t="inlineStr"><is><t>KETERANGAN WARNA AGENDA &amp; KEGIATAN</t></is></c>
      <c r="D36" s="26"/><c r="E36" s="26"/><c r="F36" s="26"/><c r="G36" s="26"/><c r="H36" s="26"/><c r="I36" s="26"/>
      <c r="U36" s="0" t="inlineStr"><is><t>${escapeXml(ctx.kabupaten)}, 13 Juli 2026</t></is></c>
    </row>
  `);
  merges.push('C36:I36');

  const legendItems = [
    { fillStyle: 10, text: 'Pengenalan Lingkungan Sekolah (MPLS) Ramah Anak Purwakarta' },
    { fillStyle: 11, text: 'Asesmen Sumatif Akhir Semester (SAS / ASAS) & STS' },
    { fillStyle: 12, text: 'Penyerahan Laporan Hasil Belajar (Rapor) Siswa' },
    { fillStyle: 13, text: 'Libur Semester Gasal dan Genap' },
    { fillStyle: 14, text: 'Libur Seputar Hari Raya Idul Fitri 1448 H' },
    { fillStyle: 15, text: 'Rentang Ujian Akhir Jenjang (PSAJ) & KBM Efektif Khusus' },
    { fillStyle: 16, text: 'Hari Libur Nasional / Keagamaan Resmi' },
    { fillStyle: 17, text: 'Peringatan Hari Jadi Purwakarta & Kegiatan Karakter TdBA' },
  ];

  legendItems.forEach((leg, idx) => {
    const lRow = 37 + idx;
    let rLeg = `<row r="${lRow}" ht="18" customHeight="1">`;
    rLeg += `<c r="C${lRow}" s="${leg.fillStyle}"/>`;
    rLeg += `<c r="D${lRow}" s="${leg.fillStyle}"/>`;
    rLeg += `<c r="E${lRow}" s="27" t="inlineStr"><is><t>${escapeXml(leg.text)}</t></is></c>`;
    for (let c = 6; c <= 18; c++) rLeg += `<c r="${colToLetter(c)}${lRow}" s="0"/>`;
    merges.push(`C${lRow}:D${lRow}`, `E${lRow}:R${lRow}`);

    // Tanda Tangan di sebelah kanan legend
    if (idx === 0) {
      rLeg += `<c r="U${lRow}" s="1" t="inlineStr"><is><t>Mengetahui,</t></is></c>`;
      rLeg += `<c r="AA${lRow}" s="1" t="inlineStr"><is><t>Kepala Sekolah,</t></is></c>`;
    } else if (idx === 1) {
      rLeg += `<c r="U${lRow}" s="1" t="inlineStr"><is><t>Ketua Tim Pengembang Kurikulum,</t></is></c>`;
      rLeg += `<c r="AA${lRow}" s="1" t="inlineStr"><is><t>${escapeXml(ctx.namaSekolah)},</t></is></c>`;
    } else if (idx === 5) {
      rLeg += `<c r="U${lRow}" s="28" t="inlineStr"><is><t>${escapeXml(ctx.penyusun)}</t></is></c>`;
      rLeg += `<c r="AA${lRow}" s="28" t="inlineStr"><is><t>${escapeXml(ctx.kepalaSekolah)}</t></is></c>`;
    } else if (idx === 6) {
      rLeg += `<c r="U${lRow}" s="29" t="inlineStr"><is><t>NIP. ${escapeXml(ctx.nipPenyusun)}</t></is></c>`;
      rLeg += `<c r="AA${lRow}" s="29" t="inlineStr"><is><t>NIP. ${escapeXml(ctx.nipKepalaSekolah)}</t></is></c>`;
    }

    rLeg += `</row>`;
    rows.push(rLeg);
  });

  merges.push(
    'U37:X37', 'AA37:AE37',
    'U38:X38', 'AA38:AE38',
    'U42:X42', 'AA42:AE42',
    'U43:X43', 'AA43:AE43'
  );

  // Column widths definition (Persis Kaldik Pendis: 7 cols per month, spacer cols width 3.14)
  let colsXml = '<cols>';
  colsXml += '<col min="1" max="2" width="2" customWidth="1"/>'; // A..B
  for (let m = 0; m < 4; m++) {
    const sCol = 3 + m * 8;
    colsXml += `<col min="${sCol}" max="${sCol + 6}" width="5.3" customWidth="1"/>`; // 7 days
    if (m < 3) {
      colsXml += `<col min="${sCol + 7}" max="${sCol + 7}" width="3.2" customWidth="1"/>`; // Spacer
    }
  }
  colsXml += '</cols>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0" showGridLines="1">
      <pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  ${colsXml}
  <sheetData>
    ${rows.join('\n')}
  </sheetData>
  <mergeCells count="${merges.length}">
    ${merges.map(m => `<mergeCell ref="${m}"/>`).join('\n')}
  </mergeCells>
</worksheet>`;
}

/**
 * SHEET 3: Kaldik Portrait (Format Portrait 12 Bulan dengan HK, HE & Agenda Bulanan)
 */
function buildKaldikPortraitSheetXml(ctx: SheetContext): string {
  const rows: string[] = [];
  const merges: string[] = [];

  // Baris 1-7: KOP SURAT RESMI
  rows.push(`
    <row r="1" ht="18" customHeight="1">
      <c r="A1" s="2" t="inlineStr"><is><t>PEMERINTAH KABUPATEN ${escapeXml(ctx.kabupaten.toUpperCase())} • ${escapeXml(ctx.instansi.toUpperCase())}</t></is></c>
      <c r="AA1" s="12" t="inlineStr"><is><t>SE Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026</t></is></c>
    </row>
    <row r="2" ht="24" customHeight="1">
      <c r="A2" s="1" t="inlineStr"><is><t>${escapeXml(ctx.namaSekolah.toUpperCase())}</t></is></c>
      <c r="AA2" s="12" t="inlineStr"><is><t>Permendikdasmen No. 13 Tahun 2025 (Min. 36 Pekan KBM)</t></is></c>
    </row>
    <row r="3" ht="16" customHeight="1">
      <c r="A3" s="3" t="inlineStr"><is><t>${escapeXml(ctx.alamat)}${ctx.npsn ? ' • NPSN: ' + escapeXml(ctx.npsn) : ''}</t></is></c>
    </row>
    <row r="4" ht="8" customHeight="1"/>
    <row r="5" ht="22" customHeight="1">
      <c r="A5" s="3" t="inlineStr"><is><t>KALENDER PENDIDIKAN SATUAN PENDIDIKAN TAHUN AJARAN ${escapeXml(ctx.tahunAjaran)}</t></is></c>
    </row>
    <row r="6" ht="8" customHeight="1"/>
    <row r="7" ht="22" customHeight="1">
      <c r="A7" s="26" t="inlineStr"><is><t>SEMESTER GASAL (GANJIL)</t></is></c>
      <c r="B7" s="26"/><c r="C7" s="26"/><c r="D7" s="26"/><c r="E7" s="26"/><c r="F7" s="26"/><c r="G7" s="26"/>
    </row>
  `);

  merges.push('A1:O1', 'AA1:AE1', 'A2:O2', 'AA2:AE2', 'A3:O3', 'A5:O5', 'A7:G7');

  // Pasangan 6 Bulan (Kiri: Ganjil & Genap)
  const monthPairs = [
    {
      sRow: 9,
      m1: { name: 'JULI 2026', year: 2026, month: 7, startCol: 1, hk: 31, he: 13 },
      m2: { name: 'AGUSTUS 2026', year: 2026, month: 8, startCol: 9, hk: 31, he: 26 },
      agendas1: [
        { tgl: '13', desc: 'Awal Masuk Tahun Ajaran 2026/2027' },
        { tgl: '13 - 17', desc: 'Pengenalan Lingkungan Sekolah (MPLS) Ramah Anak' },
        { tgl: '20', desc: 'Peringatan Hari Jadi Purwakarta (HJP ke-195)' }
      ],
      agendas2: [
        { tgl: '14', desc: 'Peringatan Hari Pramuka ke-65' },
        { tgl: '17', desc: 'HUT Proklamasi Kemerdekaan RI ke-81' },
        { tgl: '25', desc: 'Peringatan Maulid Nabi Muhammad saw. 1448 H' }
      ]
    },
    {
      sRow: 23,
      m1: { name: 'SEPTEMBER 2026', year: 2026, month: 9, startCol: 1, hk: 30, he: 25 },
      m2: { name: 'OKTOBER 2026', year: 2026, month: 10, startCol: 9, hk: 31, he: 27 },
      agendas1: [
        { tgl: '7', desc: 'Hari Udara Bersih Internasional (Aksi TdBA)' },
        { tgl: '18', desc: 'Hari Bambu Sedunia (World Bamboo Day TdBA)' },
        { tgl: '21 - 25', desc: 'Rentang Asesmen Sumatif Tengah Semester (STS) Gasal' }
      ],
      agendas2: [
        { tgl: '1', desc: 'Peringatan Hari Kesaktian Pancasila' },
        { tgl: '28', desc: 'Peringatan Hari Sumpah Pemuda' }
      ]
    },
    {
      sRow: 41,
      m1: { name: 'NOVEMBER 2026', year: 2026, month: 11, startCol: 1, hk: 30, he: 26 },
      m2: { name: 'DESEMBER 2026', year: 2026, month: 12, startCol: 9, hk: 31, he: 12 },
      agendas1: [
        { tgl: '10', desc: 'Peringatan Hari Pahlawan Nasional' },
        { tgl: '23 - 30', desc: 'Rentang Asesmen Sumatif Akhir Semester (SAS / ASAS) Gasal' },
        { tgl: '25', desc: 'Hari Guru Nasional (HGN) & HUT PGRI ke-81' }
      ],
      agendas2: [
        { tgl: '1 - 5', desc: 'Lanjutan Asesmen Sumatif Akhir Semester Gasal' },
        { tgl: '18 - 19', desc: 'Penyerahan Laporan Hasil Belajar (Rapor) Semester Gasal' },
        { tgl: '21 - 31', desc: 'Libur Semester Gasal & Natal (25 Des)' }
      ]
    },
    {
      sRow: 59,
      m1: { name: 'JANUARI 2027', year: 2027, month: 1, startCol: 1, hk: 31, he: 20 },
      m2: { name: 'FEBRUARI 2027', year: 2027, month: 2, startCol: 9, hk: 28, he: 18 },
      agendas1: [
        { tgl: '1', desc: 'Tahun Baru 2027 Masehi' },
        { tgl: '4', desc: 'Awal Masuk KBM Semester Genap 2026/2027' }
      ],
      agendas2: [
        { tgl: '5', desc: 'Peringatan Isra Mi\'raj Nabi Muhammad saw. 1448 H' },
        { tgl: '6', desc: 'Tahun Baru Imlek 2578 Kongzili' },
        { tgl: '8 - 10', desc: 'Libur Awal Ramadhan 1448 H' },
        { tgl: '11 - 28', desc: 'Masantren di Sakola Ramadhan 1448 H' }
      ]
    },
    {
      sRow: 73,
      m1: { name: 'MARET 2027', year: 2027, month: 3, startCol: 1, hk: 31, he: 18 },
      m2: { name: 'APRIL 2027', year: 2027, month: 4, startCol: 9, hk: 30, he: 25 },
      agendas1: [
        { tgl: '1 - 5', desc: 'Lanjutan Masantren Ramadhan 1448 H' },
        { tgl: '6 - 13', desc: 'Libur Seputar Hari Raya Idulfitri 1448 H' },
        { tgl: '9', desc: 'Hari Suci Nyepi (Tahun Baru Saka 1949)' },
        { tgl: '10 - 11', desc: 'Hari Raya Idulfitri 1448 H' },
        { tgl: '22 - 26', desc: 'Rentang Asesmen Sumatif Tengah Semester (STS) Genap' }
      ],
      agendas2: [
        { tgl: '21', desc: 'Peringatan Hari Kartini' },
        { tgl: '22', desc: 'Hari Bumi Sedunia (Gerakan Peduli TdBA)' }
      ]
    },
    {
      sRow: 87,
      m1: { name: 'MEI 2027', year: 2027, month: 5, startCol: 1, hk: 31, he: 21 },
      m2: { name: 'JUNI 2027', year: 2027, month: 6, startCol: 9, hk: 30, he: 14 },
      agendas1: [
        { tgl: '1', desc: 'Hari Buruh Internasional' },
        { tgl: '2', desc: 'Hari Pendidikan Nasional (Hardiknas)' },
        { tgl: '10 - 14', desc: 'Rentang Asesmen Akhir Jenjang (PSAJ) Kelas 6' },
        { tgl: '16', desc: 'Hari Raya Idul Adha 1448 H' },
        { tgl: '24 - 31', desc: 'Rentang Asesmen Sumatif Akhir Tahun (ASAT / ASAS Genap)' }
      ],
      agendas2: [
        { tgl: '1', desc: 'Hari Lahir Pancasila' },
        { tgl: '1 - 5', desc: 'Lanjutan Rentang ASAT / ASAS Genap' },
        { tgl: '16', desc: 'Tahun Baru Islam 1 Muharram 1449 H' },
        { tgl: '18 - 19', desc: 'Penyerahan Laporan Hasil Belajar (Rapor) Semester Genap' },
        { tgl: '21 - 30', desc: 'Libur Akhir Tahun Ajaran 2026/2027' }
      ]
    }
  ];

  // Render Kolom Kanan: Tabel Semester Genap Persis Kaldik Pendis
  rows.push(`
    <row r="9" ht="22" customHeight="1">
      <c r="AA9" s="26" t="inlineStr"><is><t>SEMESTER GENAP</t></is></c>
      <c r="AB9" s="26"/><c r="AC9" s="26"/><c r="AD9" s="26"/><c r="AE9" s="26"/>
    </row>
    <row r="10" ht="20" customHeight="1">
      <c r="AA10" s="19" t="inlineStr"><is><t>TANGGAL</t></is></c>
      <c r="AB10" s="19"/><c r="AC10" s="19"/>
      <c r="AD10" s="19" t="inlineStr"><is><t>KETERANGAN</t></is></c>
      <c r="AE10" s="19"/>
    </row>
  `);
  merges.push('AA9:AE9', 'AA10:AC10', 'AD10:AE10');

  const genapDates = [
    { tgl: '1 Januari 2027', desc: 'Tahun Baru Masehi' },
    { tgl: '4 Januari 2027', desc: 'Awal masuk semester genap TP 2026/2027' },
    { tgl: '5 Februari 2027', desc: 'Isra Mikraj Nabi Muhammad SAW' },
    { tgl: '6 Februari 2027', desc: 'Tahun Baru Imlek 2578' },
    { tgl: '8 - 10 Feb 2027', desc: 'Libur awal Ramadhan 1448 H' },
    { tgl: '11 Feb - 5 Mar 2027', desc: 'Masantren di Sakola Ramadhan 1448 H' },
    { tgl: '6 - 13 Maret 2027', desc: 'Libur seputar Hari Raya Idulfitri 1448 H' },
    { tgl: '9 Maret 2027', desc: 'Hari Suci Nyepi (Tahun Baru Saka 1949)' },
    { tgl: '10 - 11 Maret 2027', desc: 'Hari Raya Idulfitri 1448 H' },
    { tgl: '22 - 26 Maret 2027', desc: 'Rentang Asesmen Sumatif Tengah Semester (STS) Genap' },
    { tgl: '26 Maret 2027', desc: 'Wafat Yesus Kristus' },
    { tgl: '21 April 2027', desc: 'Hari Kartini' },
    { tgl: '22 April 2027', desc: 'Hari Bumi Sedunia (Aksi TdBA Purwakarta)' },
    { tgl: '1 Mei 2027', desc: 'Hari Buruh Internasional' },
    { tgl: '2 Mei 2027', desc: 'Hari Pendidikan Nasional' },
    { tgl: '10 - 14 Mei 2027', desc: 'Rentang pelaksanaan Asesmen Akhir Jenjang (PSAJ) Kelas 6' },
    { tgl: '16 Mei 2027', desc: 'Hari Raya Idul Adha 1448 H' },
    { tgl: '20 Mei 2027', desc: 'Hari Kebangkitan Nasional' },
    { tgl: '24 Mei - 5 Juni 2027', desc: 'Rentang pelaksanaan Asesmen Sumatif Akhir Tahun (ASAT)' },
    { tgl: '1 Juni 2027', desc: 'Hari Lahir Pancasila' },
    { tgl: '16 Juni 2027', desc: 'Tahun Baru Islam 1 Muharram 1449 H' },
    { tgl: '18 atau 19 Juni 2027', desc: 'Penyerahan rapor murid Semester Genap' },
    { tgl: '21 Juni - 10 Juli 2027', desc: 'Awal libur akhir tahun ajaran 2026/2027' },
    { tgl: '12 Juli 2027', desc: 'Awal tahun ajaran baru 2027/2028' }
  ];

  genapDates.forEach((gd, gIdx) => {
    const gRow = 11 + gIdx;
    rows.push(`
      <row r="${gRow}" ht="19" customHeight="1">
        <c r="AA${gRow}" s="21" t="inlineStr"><is><t>${escapeXml(gd.tgl)}</t></is></c>
        <c r="AB${gRow}" s="21"/><c r="AC${gRow}" s="21"/>
        <c r="AD${gRow}" s="20" t="inlineStr"><is><t>${escapeXml(gd.desc)}</t></is></c>
        <c r="AE${gRow}" s="20"/>
      </row>
    `);
    merges.push(`AA${gRow}:AC${gRow}`, `AD${gRow}:AE${gRow}`);
  });

  // Render Pasangan Bulan
  monthPairs.forEach(pair => {
    const sRow = pair.sRow;

    // 1. Headers (Row sRow)
    let rTitle = `<row r="${sRow}" ht="20" customHeight="1">`;
    rTitle += `<c r="A${sRow}" s="5" t="inlineStr"><is><t>${pair.m1.name}</t></is></c>`;
    for (let c = 2; c <= 7; c++) rTitle += `<c r="${colToLetter(c)}${sRow}" s="5"/>`;
    merges.push(`A${sRow}:G${sRow}`);

    rTitle += `<c r="I${sRow}" s="5" t="inlineStr"><is><t>${pair.m2.name}</t></is></c>`;
    for (let c = 10; c <= 15; c++) rTitle += `<c r="${colToLetter(c)}${sRow}" s="5"/>`;
    merges.push(`I${sRow}:O${sRow}`);
    rTitle += `</row>`;
    rows.push(rTitle);

    // 2. Days Aha..Sab (Row sRow + 1)
    const dayNames = ['Aha', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    let rDays = `<row r="${sRow + 1}" ht="18" customHeight="1">`;
    dayNames.forEach((dName, dIdx) => {
      const colLetter = colToLetter(1 + dIdx);
      rDays += `<c r="${colLetter}${sRow + 1}" s="${dIdx === 0 ? 6 : 7}" t="inlineStr"><is><t>${dName}</t></is></c>`;
    });
    dayNames.forEach((dName, dIdx) => {
      const colLetter = colToLetter(9 + dIdx);
      rDays += `<c r="${colLetter}${sRow + 1}" s="${dIdx === 0 ? 6 : 7}" t="inlineStr"><is><t>${dName}</t></is></c>`;
    });
    rDays += `</row>`;
    rows.push(rDays);

    // 3. Grid Tanggal 6 Baris (Row sRow + 2 s.d. sRow + 7)
    for (let w = 0; w < 6; w++) {
      const curR = sRow + 2 + w;
      let rWeek = `<row r="${curR}" ht="18" customHeight="1">`;

      [pair.m1, pair.m2].forEach(m => {
        const daysInMonth = new Date(m.year, m.month, 0).getDate();
        const firstDow = new Date(m.year, m.month - 1, 1).getDay();

        for (let dow = 0; dow < 7; dow++) {
          const colLetter = colToLetter(m.startCol + dow);
          const cellIndex = w * 7 + dow;
          const dayNum = cellIndex - firstDow + 1;

          if (dayNum >= 1 && dayNum <= daysInMonth) {
            const dateStr = `${m.year}-${String(m.month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const ev = findEventForDate(dateStr);
            let style = dow === 0 ? 9 : 8;
            if (ev) style = ev.styleId;
            rWeek += `<c r="${colLetter}${curR}" s="${style}"><v>${dayNum}</v></c>`;
          } else {
            rWeek += `<c r="${colLetter}${curR}" s="8"/>`;
          }
        }
      });

      rWeek += `</row>`;
      rows.push(rWeek);
    }

    // 4. Baris Rekap HK & HE (Row sRow + 8)
    const hkRow = sRow + 8;
    rows.push(`
      <row r="${hkRow}" ht="18" customHeight="1">
        <c r="A${hkRow}" s="24" t="inlineStr"><is><t>HK : ${pair.m1.hk}</t></is></c>
        <c r="B${hkRow}" s="24"/>
        <c r="C${hkRow}" s="24"/><c r="D${hkRow}" s="24"/><c r="E${hkRow}" s="24"/>
        <c r="F${hkRow}" s="25" t="inlineStr"><is><t>HE : ${pair.m1.he}</t></is></c>
        <c r="G${hkRow}" s="25"/>
        <c r="I${hkRow}" s="24" t="inlineStr"><is><t>HK : ${pair.m2.hk}</t></is></c>
        <c r="J${hkRow}" s="24"/>
        <c r="K${hkRow}" s="24"/><c r="L${hkRow}" s="24"/><c r="M${hkRow}" s="24"/>
        <c r="N${hkRow}" s="25" t="inlineStr"><is><t>HE : ${pair.m2.he}</t></is></c>
        <c r="O${hkRow}" s="25"/>
      </row>
    `);
    merges.push(
      `A${hkRow}:B${hkRow}`, `F${hkRow}:G${hkRow}`,
      `I${hkRow}:J${hkRow}`, `N${hkRow}:O${hkRow}`
    );

    // 5. Baris Agenda di Bawah Bulan (Rows sRow + 9 s.d. sRow + 11)
    for (let agIdx = 0; agIdx < 3; agIdx++) {
      const aRow = sRow + 9 + agIdx;
      const ag1 = pair.agendas1[agIdx];
      const ag2 = pair.agendas2[agIdx];

      let rAg = `<row r="${aRow}" ht="16" customHeight="1">`;
      if (ag1) {
        rAg += `<c r="A${aRow}" s="25" t="inlineStr"><is><t>${escapeXml(ag1.tgl)}</t></is></c>`;
        rAg += `<c r="B${aRow}" s="20" t="inlineStr"><is><t>${escapeXml(ag1.desc)}</t></is></c>`;
        for (let c = 3; c <= 7; c++) rAg += `<c r="${colToLetter(c)}${aRow}" s="20"/>`;
        merges.push(`B${aRow}:G${aRow}`);
      }
      if (ag2) {
        rAg += `<c r="I${aRow}" s="25" t="inlineStr"><is><t>${escapeXml(ag2.tgl)}</t></is></c>`;
        rAg += `<c r="J${aRow}" s="20" t="inlineStr"><is><t>${escapeXml(ag2.desc)}</t></is></c>`;
        for (let c = 11; c <= 15; c++) rAg += `<c r="${colToLetter(c)}${aRow}" s="20"/>`;
        merges.push(`J${aRow}:O${aRow}`);
      }
      rAg += `</row>`;
      rows.push(rAg);
    }
  });

  // Tanda Tangan di bagian paling bawah
  const signRow = 104;
  rows.push(`
    <row r="${signRow}" ht="18" customHeight="1">
      <c r="B${signRow}" s="1" t="inlineStr"><is><t>Mengetahui,</t></is></c>
      <c r="J${signRow}" s="1" t="inlineStr"><is><t>${escapeXml(ctx.kabupaten)}, 13 Juli 2026</t></is></c>
    </row>
    <row r="${signRow + 1}" ht="18" customHeight="1">
      <c r="B${signRow + 1}" s="1" t="inlineStr"><is><t>Ketua Tim Pengembang Kurikulum,</t></is></c>
      <c r="J${signRow + 1}" s="1" t="inlineStr"><is><t>Kepala ${escapeXml(ctx.namaSekolah)},</t></is></c>
    </row>
    <row r="${signRow + 5}" ht="18" customHeight="1">
      <c r="B${signRow + 5}" s="28" t="inlineStr"><is><t>${escapeXml(ctx.penyusun)}</t></is></c>
      <c r="J${signRow + 5}" s="28" t="inlineStr"><is><t>${escapeXml(ctx.kepalaSekolah)}</t></is></c>
    </row>
    <row r="${signRow + 6}" ht="18" customHeight="1">
      <c r="B${signRow + 6}" s="29" t="inlineStr"><is><t>NIP. ${escapeXml(ctx.nipPenyusun)}</t></is></c>
      <c r="J${signRow + 6}" s="29" t="inlineStr"><is><t>NIP. ${escapeXml(ctx.nipKepalaSekolah)}</t></is></c>
    </row>
  `);

  merges.push(
    `B${signRow}:E${signRow}`, `J${signRow}:N${signRow}`,
    `B${signRow + 1}:E${signRow + 1}`, `J${signRow + 1}:N${signRow + 1}`,
    `B${signRow + 5}:E${signRow + 5}`, `J${signRow + 5}:N${signRow + 5}`,
    `B${signRow + 6}:E${signRow + 6}`, `J${signRow + 6}:N${signRow + 6}`
  );

  let colsXml = '<cols>';
  colsXml += '<col min="1" max="7" width="5.8" customWidth="1"/>'; // A..G
  colsXml += '<col min="8" max="8" width="3.2" customWidth="1"/>'; // H Spacer
  colsXml += '<col min="9" max="15" width="5.8" customWidth="1"/>'; // I..O
  colsXml += '<col min="16" max="26" width="2.5" customWidth="1"/>'; // P..Z Spacers
  colsXml += '<col min="27" max="29" width="7" customWidth="1"/>'; // AA..AC Tanggal
  colsXml += '<col min="30" max="31" width="35" customWidth="1"/>'; // AD..AE Keterangan
  colsXml += '</cols>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="0" workbookViewId="0" showGridLines="1"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  ${colsXml}
  <sheetData>
    ${rows.join('\n')}
  </sheetData>
  <mergeCells count="${merges.length}">
    ${merges.map(m => `<mergeCell ref="${m}"/>`).join('\n')}
  </mergeCells>
</worksheet>`;
}
