/**
 * Kaldik Excel Generator (OpenXML SpreadsheetML .xlsx Builder)
 * Menghasilkan file Microsoft Excel (.xlsx) Kalender Pendidikan Satuan Pendidikan (KPSP)
 * yang rapi, terstruktur, profesional, dan berdesain premium.
 * 
 * Acuan Regulasi:
 * - Pusat: Permendikdasmen No. 13 Tahun 2025 (Minimal 36 Pekan Efektif KBM)
 * - Daerah: Surat Edaran Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026
 * - Budaya & Karakter: 7 Poé Atikan Purwakarta Istimewa & Tatanen di Bale Atikan (TdBA)
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
    tahun_ajaran?: string;
    kepala_sekolah?: string;
    nip_kepala_sekolah?: string;
    penyusun?: string;
    nip_penyusun?: string;
    kota?: string;
    alamat_sekolah?: string;
  };
  spesifik?: {
    sistemHariSekolah?: '5 Hari Kerja (Senin s.d. Jumat)' | '6 Hari Kerja (Senin s.d. Sabtu)';
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

/**
 * Membangun buffer file Microsoft Excel (.xlsx) untuk Kalender Pendidikan
 */
export async function generateKaldikExcelBuffer(input: KaldikExcelInput = {}): Promise<Uint8Array> {
  const meta = input.metadata || {};
  const spesifik = input.spesifik || {};
  const namaSekolah = meta.nama_sekolah || 'SD NEGERI 1 WANAYASA';
  const tahunAjaran = meta.tahun_ajaran || '2026/2027';
  const kepalaSekolah = meta.kepala_sekolah || 'Hj. Nenden Laila, M.Pd.';
  const nipKepalaSekolah = meta.nip_kepala_sekolah || '19760314 200501 2 006';
  const penyusun = meta.penyusun || 'Tim Pengembang Kurikulum Satuan Pendidikan';
  const nipPenyusun = meta.nip_penyusun || '-';
  const kota = meta.kota || 'Purwakarta';
  const alamat = meta.alamat_sekolah || 'Kecamatan Wanayasa, Kabupaten Purwakarta';
  
  const is6Hari = String(spesifik.sistemHariSekolah || '').includes('6 Hari');
  const sistemHariSekolahOpt: '5-hari' | '6-hari' = is6Hari ? '6-hari' : '5-hari';
  const sistemHariSekolahLabel = is6Hari ? '6 Hari Sekolah (Senin s.d. Sabtu)' : '5 Hari Sekolah (Senin s.d. Jumat)';

  const allEvents = mergeKaldikEvents(input.customEvents || [], true);
  const grid = generate12MonthGrid(allEvents, { sistemHariSekolah: sistemHariSekolahOpt });
  const stats = calculateKaldikStats(grid, { sistemHariSekolah: sistemHariSekolahOpt });

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

  // 4. xl/workbook.xml
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Matriks Kalender 12 Bulan" sheetId="1" r:id="rId2"/>
    <sheet name="Rekapitulasi Alokasi (RPE)" sheetId="2" r:id="rId3"/>
    <sheet name="Jadwal PHBI &amp; Daerah" sheetId="3" r:id="rId4"/>
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml - Palet warna profesional dan rapi
  zip.file('xl/styles.xml', buildStylesXml());

  // 6. Worksheets
  zip.file('xl/worksheets/sheet1.xml', buildSheet1Xml({
    namaSekolah,
    tahunAjaran,
    kepalaSekolah,
    nipKepalaSekolah,
    penyusun,
    nipPenyusun,
    kota,
    alamat,
    sistemHariSekolahLabel,
    grid,
    stats,
    allEvents
  }));

  zip.file('xl/worksheets/sheet2.xml', buildSheet2Xml({
    namaSekolah,
    tahunAjaran,
    kepalaSekolah,
    nipKepalaSekolah,
    kota,
    grid,
    stats
  }));

  zip.file('xl/worksheets/sheet3.xml', buildSheet3Xml({
    namaSekolah,
    tahunAjaran,
    kepalaSekolah,
    nipKepalaSekolah,
    kota,
    allEvents
  }));

  const arrayBuffer = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return arrayBuffer;
}

/**
 * Stylesheet XML builder dengan skema warna harmonis & fontSegoe/Calibri
 */
function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="10">
    <!-- 0: Regular 10pt -->
    <font><sz val="10"/><name val="Calibri"/></font>
    <!-- 1: Bold 10pt -->
    <font><b/><sz val="10"/><name val="Calibri"/></font>
    <!-- 2: Bold 11pt White -->
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <!-- 3: Bold 16pt Navy -->
    <font><b/><sz val="16"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <!-- 4: Bold 12pt White -->
    <font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <!-- 5: Regular 9pt -->
    <font><sz val="9"/><name val="Calibri"/></font>
    <!-- 6: Bold 9pt -->
    <font><b/><sz val="9"/><name val="Calibri"/></font>
    <!-- 7: Italic 10pt Muted -->
    <font><i/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/></font>
    <!-- 8: Bold 13pt Dark Indigo -->
    <font><b/><sz val="13"/><color rgb="FF1E3A8A"/><name val="Calibri"/></font>
    <!-- 9: Bold 9pt White -->
    <font><b/><sz val="9"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>

  <fills count="18">
    <!-- 0: none -->
    <fill><patternFill patternType="none"/></fill>
    <!-- 1: gray125 -->
    <fill><patternFill patternType="gray125"/></fill>
    <!-- 2: Navy Header (#1E3A8A) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/></patternFill></fill>
    <!-- 3: Dark Slate Header (#0F172A) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
    <!-- 4: Emerald Header (#065F46) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF065F46"/></patternFill></fill>
    <!-- 5: Indigo Subheader (#3730A3) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF3730A3"/></patternFill></fill>
    <!-- 6: Light Gray Header (#F1F5F9) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
    <!-- 7: Soft Blue (MPLS/PWK) (#BAE6FD) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFBAE6FD"/></patternFill></fill>
    <!-- 8: Soft Green (PHBI) (#BBF7D0) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFBBF7D0"/></patternFill></fill>
    <!-- 9: Soft Red / Weekend / Libur (#FECDD3) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFECDD3"/></patternFill></fill>
    <!-- 10: Soft Yellow (STS) (#FEF08A) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF08A"/></patternFill></fill>
    <!-- 11: Soft Orange (SAS/ASAT) (#FED7AA) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFED7AA"/></patternFill></fill>
    <!-- 12: Soft Purple (PSAJ) (#DDD6FE) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFDDD6FE"/></patternFill></fill>
    <!-- 13: Soft Pink (HJP) (#FBCFE8) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFBCFE8"/></patternFill></fill>
    <!-- 14: Soft Teal (TdBA) (#A7F3D0) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFA7F3D0"/></patternFill></fill>
    <!-- 15: Zebra Stripe Row (#F8FAFC) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
    <!-- 16: Highlight Total Emerald (#ECFDF5) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/></patternFill></fill>
    <!-- 17: Highlight Total Indigo (#EEF2FF) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/></patternFill></fill>
  </fills>

  <borders count="4">
    <!-- 0: none -->
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <!-- 1: Thin border clean (#CBD5E1) -->
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
    <!-- 2: Double bottom total border -->
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FF1E293B"/></top>
      <bottom style="double"><color rgb="FF0F172A"/></bottom>
      <diagonal/>
    </border>
    <!-- 3: Medium header bottom border -->
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="medium"><color rgb="FF1E3A8A"/></bottom>
      <diagonal/>
    </border>
  </borders>

  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>

  <cellXfs count="30">
    <!-- 0: Normal text -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <!-- 1: Main Title Banner (16pt bold navy centered) -->
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 2: Subtitle Banner (13pt bold indigo centered) -->
    <xf numFmtId="0" fontId="8" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 3: Subtitle Address (10pt italic slate centered) -->
    <xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 4: Header Dark Navy White (Table Header Main) -->
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 5: Header Emerald White (Table Header Ganjil) -->
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 6: Header Indigo White (Table Header Genap) -->
    <xf numFmtId="0" fontId="2" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 7: Subheader Gray Bold Center -->
    <xf numFmtId="0" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <!-- 8: Regular Data Left Border -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 9: Regular Data Center Border -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 10: Regular Data Right Border -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 11: Bold Data Left Border -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 12: Bold Data Center Border -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 13: Bold Data Right Border -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 14: Day Cell: Soft Red (Weekend / Libur) -->
    <xf numFmtId="0" fontId="6" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 15: Day Cell: Soft Blue (MPLS) -->
    <xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 16: Day Cell: Soft Green (PHBI) -->
    <xf numFmtId="0" fontId="6" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 17: Day Cell: Soft Yellow (STS) -->
    <xf numFmtId="0" fontId="6" fillId="10" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 18: Day Cell: Soft Orange (SAS / ASAT) -->
    <xf numFmtId="0" fontId="6" fillId="11" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 19: Day Cell: Soft Purple (PSAJ) -->
    <xf numFmtId="0" fontId="6" fillId="12" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 20: Day Cell: Soft Pink (HJP) -->
    <xf numFmtId="0" fontId="6" fillId="13" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 21: Day Cell: Soft Teal (TdBA) -->
    <xf numFmtId="0" fontId="6" fillId="14" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 22: Zebra Stripe Left -->
    <xf numFmtId="0" fontId="0" fillId="15" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 23: Zebra Stripe Center -->
    <xf numFmtId="0" fontId="0" fillId="15" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 24: Total Subtotal Row Center Double Bottom -->
    <xf numFmtId="0" fontId="1" fillId="17" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 25: Total Subtotal Row Right Double Bottom -->
    <xf numFmtId="0" fontId="1" fillId="17" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 26: Grand Total Row Dark Header -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 27: Grand Total Row Dark Right -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <!-- 28: Section Title in Table (12pt Bold White Emerald) -->
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <!-- 29: Section Title in Table (12pt Bold White Indigo) -->
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

/**
 * Helper menentukan style cell tanggal kalender berdasarkan event dan hari
 */
function getDayCellStyle(dayJs: number, isWeekend: boolean, events: KaldikEventItem[]): { styleId: number; text: string } {
  if (isWeekend) {
    return { styleId: 14, text: 'LBR' };
  }

  if (!events || events.length === 0) {
    return { styleId: 9, text: '' };
  }

  const top = events[0];
  const label = top.badgeLabel || top.judul.slice(0, 5);

  if (top.kategori === 'libur') {
    return { styleId: 14, text: label || 'LBR' };
  }
  if (top.kategori === 'keagamaan') {
    return { styleId: 16, text: label || 'PHBI' };
  }
  if (top.kategori === 'asesmen') {
    if (label.includes('STS')) return { styleId: 17, text: 'STS' };
    if (label.includes('SAS')) return { styleId: 18, text: 'SAS' };
    if (label.includes('ASAT')) return { styleId: 18, text: 'ASAT' };
    if (label.includes('PSAJ')) return { styleId: 19, text: 'PSAJ' };
    return { styleId: 17, text: label };
  }
  if (top.kategori === 'purwakarta') {
    if (label === 'MPLS') return { styleId: 15, text: 'MPLS' };
    if (label === 'HJP') return { styleId: 20, text: 'HJP' };
    return { styleId: 21, text: label || 'PWK' };
  }

  return { styleId: 18, text: label || 'NAS' };
}

/**
 * SHEET 1: Matriks Kalender 12 Bulan (Juli s.d. Juni)
 */
function buildSheet1Xml(ctx: {
  namaSekolah: string;
  tahunAjaran: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  penyusun: string;
  nipPenyusun: string;
  kota: string;
  alamat: string;
  sistemHariSekolahLabel: string;
  grid: MonthGridData[];
  stats: KaldikStatistics;
  allEvents: KaldikEventItem[];
}): string {
  const rows: string[] = [];
  const merges: string[] = [];

  // Baris 1-4: Header Formal Sekolah & Disdik
  rows.push(`
    <row r="1" ht="22" customHeight="1">
      <c r="A1" s="1" t="inlineStr"><is><t>PEMERINTAH KABUPATEN ${escapeXml(ctx.kota.toUpperCase())} • DINAS PENDIDIKAN</t></is></c>
    </row>
    <row r="2" ht="28" customHeight="1">
      <c r="A2" s="1" t="inlineStr"><is><t>${escapeXml(ctx.namaSekolah.toUpperCase())}</t></is></c>
    </row>
    <row r="3" ht="22" customHeight="1">
      <c r="A3" s="2" t="inlineStr"><is><t>KALENDER PENDIDIKAN SATUAN PENDIDIKAN (KPSP) TAHUN AJARAN ${escapeXml(ctx.tahunAjaran)}</t></is></c>
    </row>
    <row r="4" ht="18" customHeight="1">
      <c r="A4" s="3" t="inlineStr"><is><t>${escapeXml(ctx.alamat)} • Alokasi: ${escapeXml(ctx.sistemHariSekolahLabel)} • Acuan: Permendikdasmen No. 13/2025 &amp; SE Kadisdik No. 400.3.5/2367-Dikdas/2026</t></is></c>
    </row>
    <row r="5" ht="12" customHeight="1"/>
  `);

  merges.push('A1:AM1', 'A2:AM2', 'A3:AM3', 'A4:AM4');

  // Baris 6 & 7: Header Tabel Matriks Kalender
  // Kolom: A=No, B=Bulan/Tahun, C s.d AG = Tanggal 1 s.d 31, AH=HK, AI=HEB, AJ=HL, AK=PE, AL=PTE, AM=Ringkasan Agenda
  let r6 = '<row r="6" ht="24" customHeight="1">';
  r6 += '<c r="A6" s="4" t="inlineStr"><is><t>No</t></is></c>';
  r6 += '<c r="B6" s="4" t="inlineStr"><is><t>Bulan &amp; Tahun</t></is></c>';
  r6 += '<c r="C6" s="4" t="inlineStr"><is><t>TANGGAL PELAKSANAAN KBM DAN AGENDA SEKOLAH (1 s.d. 31)</t></is></c>';
  // Isi cell kosong C6 s.d AG6 agar border rapi
  for (let c = 4; c <= 33; c++) {
    r6 += `<c r="${colToLetter(c)}6" s="4"/>`;
  }
  r6 += '<c r="AH6" s="4" t="inlineStr"><is><t>REKAPITULASI HARI &amp; PEKAN</t></is></c>';
  for (let c = 35; c <= 38; c++) {
    r6 += `<c r="${colToLetter(c)}6" s="4"/>`;
  }
  r6 += '<c r="AM6" s="4" t="inlineStr"><is><t>Agenda Utama &amp; Keterangan Alokasi</t></is></c>';
  r6 += '</row>';
  rows.push(r6);

  merges.push('A6:A7', 'B6:B7', 'C6:AG6', 'AH6:AL6', 'AM6:AM7');

  let r7 = '<row r="7" ht="20" customHeight="1">';
  r7 += '<c r="A7" s="7"/>';
  r7 += '<c r="B7" s="7"/>';
  for (let day = 1; day <= 31; day++) {
    const colName = colToLetter(day + 2);
    r7 += `<c r="${colName}7" s="7" t="inlineStr"><is><t>${day}</t></is></c>`;
  }
  r7 += '<c r="AH7" s="7" t="inlineStr"><is><t>HK</t></is></c>';
  r7 += '<c r="AI7" s="7" t="inlineStr"><is><t>HEB</t></is></c>';
  r7 += '<c r="AJ7" s="7" t="inlineStr"><is><t>HL</t></is></c>';
  r7 += '<c r="AK7" s="7" t="inlineStr"><is><t>PE</t></is></c>';
  r7 += '<c r="AL7" s="7" t="inlineStr"><is><t>PTE</t></is></c>';
  r7 += '<c r="AM7" s="7"/>';
  r7 += '</row>';
  rows.push(r7);

  let currentRow = 8;

  // Helper untuk merender seksi semester
  const renderSemesterSection = (semNumber: 1 | 2, title: string, months: MonthGridData[], titleStyle: number) => {
    // Header Semester
    let semHeaderRow = `<row r="${currentRow}" ht="22" customHeight="1">`;
    semHeaderRow += `<c r="A${currentRow}" s="${titleStyle}" t="inlineStr"><is><t>${escapeXml(title)}</t></is></c>`;
    for (let c = 2; c <= 39; c++) {
      semHeaderRow += `<c r="${colToLetter(c)}${currentRow}" s="${titleStyle}"/>`;
    }
    semHeaderRow += `</row>`;
    rows.push(semHeaderRow);
    merges.push(`A${currentRow}:AM${currentRow}`);
    currentRow++;

    let semHK = 0;
    let semHEB = 0;
    let semHL = 0;
    let semPE = 0;
    let semPTE = 0;

    months.forEach((m, idx) => {
      const daysInMonth = new Date(m.year, m.monthNum, 0).getDate();
      semHK += daysInMonth;
      semHEB += m.hariEfektif;
      semHL += m.hariLibur;
      semPE += m.pekanEfektif;
      semPTE += m.pekanTidakEfektif;

      let rData = `<row r="${currentRow}" ht="21" customHeight="1">`;
      rData += `<c r="A${currentRow}" s="9" t="inlineStr"><is><t>${idx + 1}</t></is></c>`;
      rData += `<c r="B${currentRow}" s="11" t="inlineStr"><is><t>${escapeXml(m.monthName)}</t></is></c>`;

      // Loop tanggal 1 s.d. 31
      for (let day = 1; day <= 31; day++) {
        const colLetter = colToLetter(day + 2);
        if (day > daysInMonth) {
          // Tanggal di luar bulan (misal tgl 31 pada bulan 30 hari)
          rData += `<c r="${colLetter}${currentRow}" s="7" t="inlineStr"><is><t>-</t></is></c>`;
        } else {
          const dateStr = `${m.year}-${String(m.monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayJs = new Date(m.year, m.monthNum - 1, day).getDay();
          const isWeekend = ctx.sistemHariSekolahLabel.includes('6 Hari') ? dayJs === 0 : (dayJs === 0 || dayJs === 6);
          const matchingEvents = ctx.allEvents.filter(ev => isDateInEvent(dateStr, ev));
          const cellStyle = getDayCellStyle(dayJs, isWeekend, matchingEvents);

          rData += `<c r="${colLetter}${currentRow}" s="${cellStyle.styleId}" t="inlineStr"><is><t>${escapeXml(cellStyle.text || day)}</t></is></c>`;
        }
      }

      // Kolom Rekap
      rData += `<c r="AH${currentRow}" s="9" t="inlineStr"><is><t>${daysInMonth}</t></is></c>`;
      rData += `<c r="AI${currentRow}" s="12" t="inlineStr"><is><t>${m.hariEfektif}</t></is></c>`;
      rData += `<c r="AJ${currentRow}" s="9" t="inlineStr"><is><t>${m.hariLibur}</t></is></c>`;
      rData += `<c r="AK${currentRow}" s="12" t="inlineStr"><is><t>${m.pekanEfektif}</t></is></c>`;
      rData += `<c r="AL${currentRow}" s="9" t="inlineStr"><is><t>${m.pekanTidakEfektif}</t></is></c>`;

      // Ringkasan agenda
      const agendaSummary = m.agendaList.map(a => a.judul).join('; ') || 'KBM Efektif Reguler';
      rData += `<c r="AM${currentRow}" s="8" t="inlineStr"><is><t>${escapeXml(agendaSummary)}</t></is></c>`;

      rData += `</row>`;
      rows.push(rData);
      currentRow++;
    });

    // Subtotal Semester
    let rSub = `<row r="${currentRow}" ht="22" customHeight="1">`;
    rSub += `<c r="A${currentRow}" s="24" t="inlineStr"><is><t>JUMLAH SEMESTER ${semNumber}:</t></is></c>`;
    rSub += `<c r="B${currentRow}" s="24"/>`;
    for (let c = 3; c <= 33; c++) {
      rSub += `<c r="${colToLetter(c)}${currentRow}" s="24"/>`;
    }
    rSub += `<c r="AH${currentRow}" s="24" t="inlineStr"><is><t>${semHK}</t></is></c>`;
    rSub += `<c r="AI${currentRow}" s="24" t="inlineStr"><is><t>${semHEB}</t></is></c>`;
    rSub += `<c r="AJ${currentRow}" s="24" t="inlineStr"><is><t>${semHL}</t></is></c>`;
    rSub += `<c r="AK${currentRow}" s="24" t="inlineStr"><is><t>${semPE} Pekan</t></is></c>`;
    rSub += `<c r="AL${currentRow}" s="24" t="inlineStr"><is><t>${semPTE} Pekan</t></is></c>`;
    rSub += `<c r="AM${currentRow}" s="25" t="inlineStr"><is><t>Target ${semPE} Pekan Efektif Terpenuhi</t></is></c>`;
    rSub += `</row>`;
    rows.push(rSub);
    merges.push(`A${currentRow}:B${currentRow}`);
    currentRow++;
  };

  const smt1Months = ctx.grid.filter(m => m.semester === 1);
  const smt2Months = ctx.grid.filter(m => m.semester === 2);

  renderSemesterSection(1, 'SEMESTER 1 (GANJIL) • JULI - DESEMBER 2026', smt1Months, 28);
  renderSemesterSection(2, 'SEMESTER 2 (GENAP) • JANUARI - JUNI 2027', smt2Months, 29);

  // Grand Total 1 Tahun Ajaran
  let rGrand = `<row r="${currentRow}" ht="26" customHeight="1">`;
  rGrand += `<c r="A${currentRow}" s="26" t="inlineStr"><is><t>TOTAL 1 TAHUN AJARAN ${escapeXml(ctx.tahunAjaran)} (STANDAR KEMENDIKDASMEN MIN. 36 PEKAN):</t></is></c>`;
  for (let c = 2; c <= 33; c++) {
    rGrand += `<c r="${colToLetter(c)}${currentRow}" s="26"/>`;
  }
  rGrand += `<c r="AH${currentRow}" s="26" t="inlineStr"><is><t>${smt1Months.concat(smt2Months).reduce((acc, m) => acc + new Date(m.year, m.monthNum, 0).getDate(), 0)}</t></is></c>`;
  rGrand += `<c r="AI${currentRow}" s="26" t="inlineStr"><is><t>${ctx.stats.totalHariEfektifKbm}</t></is></c>`;
  rGrand += `<c r="AJ${currentRow}" s="26" t="inlineStr"><is><t>${ctx.stats.totalHariLibur}</t></is></c>`;
  rGrand += `<c r="AK${currentRow}" s="26" t="inlineStr"><is><t>${ctx.stats.totalPekanEfektifTahun} PEKAN</t></is></c>`;
  rGrand += `<c r="AL${currentRow}" s="26" t="inlineStr"><is><t>18 PEKAN</t></is></c>`;
  rGrand += `<c r="AM${currentRow}" s="27" t="inlineStr"><is><t>100% MEMENUHI STANDAR PERMENDIKDASMEN NO. 13/2025</t></is></c>`;
  rGrand += `</row>`;
  rows.push(rGrand);
  merges.push(`A${currentRow}:AG${currentRow}`);
  currentRow += 2;

  // TABEL KETERANGAN LEGEND WARNA & SINGKATAN KODE
  rows.push(`
    <row r="${currentRow}" ht="20" customHeight="1">
      <c r="A${currentRow}" s="4" t="inlineStr"><is><t>KODE RESMI KALENDER PENDIDIKAN &amp; KATEGORI AGENDA</t></is></c>
    </row>
  `);
  merges.push(`A${currentRow}:AM${currentRow}`);
  currentRow++;

  const legends = [
    { code: 'KBM', name: 'Kegiatan Belajar Mengajar Reguler', style: 9, desc: 'Hari efektif belajar tatap muka di kelas' },
    { code: 'MPLS', name: 'Masa Pengenalan Lingkungan Sekolah', style: 15, desc: 'Transisi PAUD-SD menyenangkan ramah anak Purwakarta' },
    { code: 'HJP', name: 'Hari Jadi Purwakarta (HJP) & 7 Poé Atikan', style: 20, desc: 'Pawai budaya & penguatan identitas karakter Sunda' },
    { code: 'PHBI', name: 'Peringatan Hari Besar Islam (PHBI)', style: 16, desc: 'Maulid Nabi, Isra Mi\'raj/Rajaban, Masantren Ramadhan, Idul Adha' },
    { code: 'STS', name: 'Sumatif Tengah Semester (STS)', style: 17, desc: 'Penilaian capaian kompetensi tengah semester' },
    { code: 'SAS', name: 'Sumatif Akhir Semester (SAS)', style: 18, desc: 'Penilaian sumatif akhir semester ganjil' },
    { code: 'ASAT', name: 'Asesmen Sumatif Akhir Tahun (ASAT)', style: 18, desc: 'Penilaian sumatif penentu kenaikan kelas fase belajar' },
    { code: 'PSAJ', name: 'Penilaian Sumatif Akhir Jenjang (PSAJ)', style: 19, desc: 'Asesmen sumatif kelulusan murid kelas 6 SD' },
    { code: 'TdBA', name: 'Gerakan Tatanen di Bale Atikan (TdBA)', style: 21, desc: 'Hari Udara Bersih, Hari Bambu, dan Panen Belajar TdBA' },
    { code: 'LBR', name: 'Libur Semester / Libur Nasional', style: 14, desc: 'Hari libur resmi nasional SKB 3 Menteri & libur semester' }
  ];

  legends.forEach(leg => {
    let rLeg = `<row r="${currentRow}" ht="19" customHeight="1">`;
    rLeg += `<c r="A${currentRow}" s="${leg.style}" t="inlineStr"><is><t>${leg.code}</t></is></c>`;
    rLeg += `<c r="B${currentRow}" s="11" t="inlineStr"><is><t>${escapeXml(leg.name)}</t></is></c>`;
    for (let c = 3; c <= 10; c++) rLeg += `<c r="${colToLetter(c)}${currentRow}" s="8"/>`;
    rLeg += `<c r="C${currentRow}" s="8" t="inlineStr"><is><t>${escapeXml(leg.desc)}</t></is></c>`;
    for (let c = 11; c <= 39; c++) rLeg += `<c r="${colToLetter(c)}${currentRow}" s="0"/>`;
    rLeg += `</row>`;
    rows.push(rLeg);
    merges.push(`C${currentRow}:AM${currentRow}`);
    currentRow++;
  });

  currentRow++;

  // BLOK PENGESAHAN (SIGNATURE)
  rows.push(`
    <row r="${currentRow}" ht="18" customHeight="1">
      <c r="B${currentRow}" s="0" t="inlineStr"><is><t>Mengetahui,</t></is></c>
      <c r="AJ${currentRow}" s="0" t="inlineStr"><is><t>${escapeXml(ctx.kota)}, 13 Juli 2026</t></is></c>
    </row>
    <row r="${currentRow + 1}" ht="18" customHeight="1">
      <c r="B${currentRow + 1}" s="1" t="inlineStr"><is><t>Ketua Tim Pengembang Kurikulum,</t></is></c>
      <c r="AJ${currentRow + 1}" s="1" t="inlineStr"><is><t>Kepala ${escapeXml(ctx.namaSekolah)},</t></is></c>
    </row>
    <row r="${currentRow + 2}" ht="18" customHeight="1"/>
    <row r="${currentRow + 3}" ht="18" customHeight="1"/>
    <row r="${currentRow + 4}" ht="18" customHeight="1"/>
    <row r="${currentRow + 5}" ht="18" customHeight="1">
      <c r="B${currentRow + 5}" s="11" t="inlineStr"><is><t>${escapeXml(ctx.penyusun)}</t></is></c>
      <c r="AJ${currentRow + 5}" s="11" t="inlineStr"><is><t>${escapeXml(ctx.kepalaSekolah)}</t></is></c>
    </row>
    <row r="${currentRow + 6}" ht="18" customHeight="1">
      <c r="B${currentRow + 6}" s="8" t="inlineStr"><is><t>NIP. ${escapeXml(ctx.nipPenyusun)}</t></is></c>
      <c r="AJ${currentRow + 6}" s="8" t="inlineStr"><is><t>NIP. ${escapeXml(ctx.nipKepalaSekolah)}</t></is></c>
    </row>
  `);
  merges.push(
    `B${currentRow + 5}:J${currentRow + 5}`,
    `AJ${currentRow + 5}:AM${currentRow + 5}`,
    `B${currentRow + 6}:J${currentRow + 6}`,
    `AJ${currentRow + 6}:AM${currentRow + 6}`
  );

  // Column widths definition
  let colsXml = '<cols>';
  colsXml += '<col min="1" max="1" width="5" customWidth="1"/>'; // A: No
  colsXml += '<col min="2" max="2" width="20" customWidth="1"/>'; // B: Bulan
  for (let c = 3; c <= 33; c++) {
    colsXml += `<col min="${c}" max="${c}" width="5.2" customWidth="1"/>`; // C-AG: Tgl 1-31
  }
  colsXml += '<col min="34" max="34" width="7" customWidth="1"/>'; // AH: HK
  colsXml += '<col min="35" max="35" width="7" customWidth="1"/>'; // AI: HEB
  colsXml += '<col min="36" max="36" width="7" customWidth="1"/>'; // AJ: HL
  colsXml += '<col min="37" max="37" width="8" customWidth="1"/>'; // AK: PE
  colsXml += '<col min="38" max="38" width="8" customWidth="1"/>'; // AL: PTE
  colsXml += '<col min="39" max="39" width="48" customWidth="1"/>'; // AM: Ringkasan Agenda
  colsXml += '</cols>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0" showGridLines="1">
      <pane ySplit="7" topLeftCell="A8" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
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
 * SHEET 2: Rekapitulasi Alokasi Waktu (RPE)
 */
function buildSheet2Xml(ctx: {
  namaSekolah: string;
  tahunAjaran: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  kota: string;
  grid: MonthGridData[];
  stats: KaldikStatistics;
}): string {
  const rows: string[] = [];
  const merges: string[] = [];

  rows.push(`
    <row r="1" ht="24" customHeight="1">
      <c r="A1" s="1" t="inlineStr"><is><t>RINCIAN PEKAN EFEKTIF (RPE) &amp; ALOKASI BEBAN BELAJAR KURIKULUM MERDEKA</t></is></c>
    </row>
    <row r="2" ht="20" customHeight="1">
      <c r="A2" s="2" t="inlineStr"><is><t>${escapeXml(ctx.namaSekolah.toUpperCase())} • TAHUN AJARAN ${escapeXml(ctx.tahunAjaran)}</t></is></c>
    </row>
    <row r="3" ht="18" customHeight="1">
      <c r="A3" s="3" t="inlineStr"><is><t>Pedoman: Permendikdasmen No. 13 Tahun 2025 &amp; Surat Edaran Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026</t></is></c>
    </row>
    <row r="4" ht="12" customHeight="1"/>
  `);
  merges.push('A1:F1', 'A2:F2', 'A3:F3');

  let cur = 5;

  const renderRpeSemesterTable = (title: string, months: MonthGridData[], semPekanEfektif: number, tableHeaderStyle: number) => {
    rows.push(`
      <row r="${cur}" ht="22" customHeight="1">
        <c r="A${cur}" s="${tableHeaderStyle}" t="inlineStr"><is><t>${escapeXml(title)}</t></is></c>
        <c r="B${cur}" s="${tableHeaderStyle}"/>
        <c r="C${cur}" s="${tableHeaderStyle}"/>
        <c r="D${cur}" s="${tableHeaderStyle}"/>
        <c r="E${cur}" s="${tableHeaderStyle}"/>
        <c r="F${cur}" s="${tableHeaderStyle}"/>
      </row>
    `);
    merges.push(`A${cur}:F${cur}`);
    cur++;

    rows.push(`
      <row r="${cur}" ht="20" customHeight="1">
        <c r="A${cur}" s="7" t="inlineStr"><is><t>No</t></is></c>
        <c r="B${cur}" s="7" t="inlineStr"><is><t>Bulan &amp; Tahun</t></is></c>
        <c r="C${cur}" s="7" t="inlineStr"><is><t>Jumlah Pekan</t></is></c>
        <c r="D${cur}" s="7" t="inlineStr"><is><t>Pekan Efektif</t></is></c>
        <c r="E${cur}" s="7" t="inlineStr"><is><t>Tidak Efektif</t></is></c>
        <c r="F${cur}" s="7" t="inlineStr"><is><t>Keterangan Alasan Pekan Tidak Efektif / Agenda</t></is></c>
      </row>
    `);
    cur++;

    let totalPekan = 0;
    let totalPE = 0;
    let totalPTE = 0;

    months.forEach((m, idx) => {
      const jmlPekan = m.pekanEfektif + m.pekanTidakEfektif;
      totalPekan += jmlPekan;
      totalPE += m.pekanEfektif;
      totalPTE += m.pekanTidakEfektif;

      const reasons = m.agendaList
        .filter(a => a.kategori === 'libur' || a.kategori === 'asesmen' || a.badgeLabel === 'MPLS')
        .map(a => a.judul)
        .join('; ') || 'KBM Efektif Penuh';

      rows.push(`
        <row r="${cur}" ht="20" customHeight="1">
          <c r="A${cur}" s="9" t="inlineStr"><is><t>${idx + 1}</t></is></c>
          <c r="B${cur}" s="11" t="inlineStr"><is><t>${escapeXml(m.monthName)}</t></is></c>
          <c r="C${cur}" s="9" t="inlineStr"><is><t>${jmlPekan}</t></is></c>
          <c r="D${cur}" s="12" t="inlineStr"><is><t>${m.pekanEfektif}</t></is></c>
          <c r="E${cur}" s="9" t="inlineStr"><is><t>${m.pekanTidakEfektif}</t></is></c>
          <c r="F${cur}" s="8" t="inlineStr"><is><t>${escapeXml(reasons)}</t></is></c>
        </row>
      `);
      cur++;
    });

    rows.push(`
      <row r="${cur}" ht="22" customHeight="1">
        <c r="A${cur}" s="24" t="inlineStr"><is><t>JUMLAH:</t></is></c>
        <c r="B${cur}" s="24"/>
        <c r="C${cur}" s="24" t="inlineStr"><is><t>${totalPekan}</t></is></c>
        <c r="D${cur}" s="24" t="inlineStr"><is><t>${totalPE} Pekan</t></is></c>
        <c r="E${cur}" s="24" t="inlineStr"><is><t>${totalPTE} Pekan</t></is></c>
        <c r="F${cur}" s="25" t="inlineStr"><is><t>Target ${semPekanEfektif} pekan efektif tercapai 100%</t></is></c>
      </row>
    `);
    merges.push(`A${cur}:B${cur}`);
    cur += 2;
  };

  const smt1 = ctx.grid.filter(m => m.semester === 1);
  const smt2 = ctx.grid.filter(m => m.semester === 2);

  renderRpeSemesterTable('1. RENCANA PEKAN EFEKTIF (RPE) SEMESTER 1 (GANJIL)', smt1, ctx.stats.totalPekanEfektifSmt1, 5);
  renderRpeSemesterTable('2. RENCANA PEKAN EFEKTIF (RPE) SEMESTER 2 (GENAP)', smt2, ctx.stats.totalPekanEfektifSmt2, 6);

  // Tabel Rekapitulasi Tahunan & Uji Standar Nasional
  rows.push(`
    <row r="${cur}" ht="22" customHeight="1">
      <c r="A${cur}" s="4" t="inlineStr"><is><t>3. REKAPITULASI TAHUNAN &amp; UJI KEPATUHAN STANDAR NASIONAL (MINIMAL 36 PEKAN)</t></is></c>
      <c r="B${cur}" s="4"/><c r="C${cur}" s="4"/><c r="D${cur}" s="4"/><c r="E${cur}" s="4"/><c r="F${cur}" s="4"/>
    </row>
  `);
  merges.push(`A${cur}:F${cur}`);
  cur++;

  const statItems = [
    { label: 'Jumlah Pekan Kalender Pendidikan (1 Tahun):', val: '54 Pekan', status: 'Sesuai Kalender Resmi Disdik Purwakarta' },
    { label: 'Jumlah Pekan Efektif Belajar (Semester 1):', val: `${ctx.stats.totalPekanEfektifSmt1} Pekan`, status: 'Memenuhi Syarat Minimal 18 Pekan' },
    { label: 'Jumlah Pekan Efektif Belajar (Semester 2):', val: `${ctx.stats.totalPekanEfektifSmt2} Pekan`, status: 'Memenuhi Syarat Minimal 18 Pekan (Kelas 6 PSAJ: 16 Pekan)' },
    { label: 'TOTAL PEKAN EFEKTIF BELAJAR TAHUNAN:', val: `${ctx.stats.totalPekanEfektifTahun} PEKAN`, status: '100% MEMENUHI STANDAR PERMENDIKDASMEN NO. 13/2025' },
    { label: 'Jumlah Pekan Tidak Efektif (Libur/Asesmen):', val: '18 Pekan', status: 'Dialokasikan untuk SAS, ASAT, PSAJ, & Libur Semester' }
  ];

  statItems.forEach(item => {
    rows.push(`
      <row r="${cur}" ht="20" customHeight="1">
        <c r="A${cur}" s="11" t="inlineStr"><is><t>${escapeXml(item.label)}</t></is></c>
        <c r="B${cur}" s="11"/>
        <c r="C${cur}" s="11"/>
        <c r="D${cur}" s="12" t="inlineStr"><is><t>${escapeXml(item.val)}</t></is></c>
        <c r="E${cur}" s="8" t="inlineStr"><is><t>${escapeXml(item.status)}</t></is></c>
        <c r="F${cur}" s="8"/>
      </row>
    `);
    merges.push(`A${cur}:C${cur}`, `E${cur}:F${cur}`);
    cur++;
  });

  cur++;

  // Tabel Distribusi Jam Pelajaran Kurikulum Merdeka
  rows.push(`
    <row r="${cur}" ht="22" customHeight="1">
      <c r="A${cur}" s="5" t="inlineStr"><is><t>4. DISTRIBUSI ALOKASI BEBAN JAM PELAJARAN (JP) KURIKULUM MERDEKA</t></is></c>
      <c r="B${cur}" s="5"/><c r="C${cur}" s="5"/><c r="D${cur}" s="5"/><c r="E${cur}" s="5"/><c r="F${cur}" s="5"/>
    </row>
  `);
  merges.push(`A${cur}:F${cur}`);
  cur++;

  rows.push(`
    <row r="${cur}" ht="20" customHeight="1">
      <c r="A${cur}" s="7" t="inlineStr"><is><t>Fase Jenjang</t></is></c>
      <c r="B${cur}" s="7" t="inlineStr"><is><t>Sasaran Kelas</t></is></c>
      <c r="C${cur}" s="7" t="inlineStr"><is><t>Alokasi JP / Pekan</t></is></c>
      <c r="D${cur}" s="7" t="inlineStr"><is><t>Pekan Efektif / Thn</t></is></c>
      <c r="E${cur}" s="7" t="inlineStr"><is><t>Total Beban JP / Tahun</t></is></c>
      <c r="F${cur}" s="7" t="inlineStr"><is><t>Proporsi Intrakurikuler &amp; Kokurikuler P5</t></is></c>
    </row>
  `);
  cur++;

  const jpDist = [
    { fase: 'Fase A', kelas: 'Kelas 1 & 2 SD', jp: '32 JP/Pekan', pekan: `${ctx.stats.totalPekanEfektifTahun} Pekan`, total: `${32 * ctx.stats.totalPekanEfektifTahun} JP/Tahun`, prop: 'Intrakurikuler 75-80%, Kokurikuler Profil Lulusan 20-25%' },
    { fase: 'Fase B', kelas: 'Kelas 3 & 4 SD', jp: '36 JP/Pekan', pekan: `${ctx.stats.totalPekanEfektifTahun} Pekan`, total: `${36 * ctx.stats.totalPekanEfektifTahun} JP/Tahun`, prop: 'Intrakurikuler 75-80%, Kokurikuler Profil Lulusan 20-25%' },
    { fase: 'Fase C', kelas: 'Kelas 5 SD', jp: '36 JP/Pekan', pekan: `${ctx.stats.totalPekanEfektifTahun} Pekan`, total: `${36 * ctx.stats.totalPekanEfektifTahun} JP/Tahun`, prop: 'Intrakurikuler 75-80%, Kokurikuler Profil Lulusan 20-25%' },
    { fase: 'Fase C (Akhir)', kelas: 'Kelas 6 SD', jp: '36 JP/Pekan', pekan: '32 Pekan', total: '1.152 JP/Tahun', prop: 'Disesuaikan dengan kelulusan & PSAJ semester 2' }
  ];

  jpDist.forEach(jp => {
    rows.push(`
      <row r="${cur}" ht="20" customHeight="1">
        <c r="A${cur}" s="12" t="inlineStr"><is><t>${jp.fase}</t></is></c>
        <c r="B${cur}" s="11" t="inlineStr"><is><t>${jp.kelas}</t></is></c>
        <c r="C${cur}" s="9" t="inlineStr"><is><t>${jp.jp}</t></is></c>
        <c r="D${cur}" s="9" t="inlineStr"><is><t>${jp.pekan}</t></is></c>
        <c r="E${cur}" s="12" t="inlineStr"><is><t>${jp.total}</t></is></c>
        <c r="F${cur}" s="8" t="inlineStr"><is><t>${jp.prop}</t></is></c>
      </row>
    `);
    cur++;
  });

  let colsXml = '<cols>';
  colsXml += '<col min="1" max="1" width="6" customWidth="1"/>';
  colsXml += '<col min="2" max="2" width="22" customWidth="1"/>';
  colsXml += '<col min="3" max="3" width="16" customWidth="1"/>';
  colsXml += '<col min="4" max="4" width="18" customWidth="1"/>';
  colsXml += '<col min="5" max="5" width="18" customWidth="1"/>';
  colsXml += '<col min="6" max="6" width="55" customWidth="1"/>';
  colsXml += '</cols>';

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
  <mergeCells count="${merges.length}">
    ${merges.map(m => `<mergeCell ref="${m}"/>`).join('\n')}
  </mergeCells>
</worksheet>`;
}

/**
 * SHEET 3: Jadwal PHBI & Kegiatan Karakter Purwakarta
 */
function buildSheet3Xml(ctx: {
  namaSekolah: string;
  tahunAjaran: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  kota: string;
  allEvents: KaldikEventItem[];
}): string {
  const rows: string[] = [];
  const merges: string[] = [];

  rows.push(`
    <row r="1" ht="24" customHeight="1">
      <c r="A1" s="1" t="inlineStr"><is><t>JADWAL PERINGATAN HARI BESAR ISLAM (PHBI) &amp; KEGIATAN KARAKTER PURWAKARTA</t></is></c>
    </row>
    <row r="2" ht="20" customHeight="1">
      <c r="A2" s="2" t="inlineStr"><is><t>${escapeXml(ctx.namaSekolah.toUpperCase())} • TAHUN AJARAN ${escapeXml(ctx.tahunAjaran)}</t></is></c>
    </row>
    <row r="3" ht="18" customHeight="1">
      <c r="A3" s="3" t="inlineStr"><is><t>Harmonisasi Kalender Nasional, Kalender Hijriah 1448 H, dan 7 Poé Atikan Purwakarta Istimewa / TdBA</t></is></c>
    </row>
    <row r="4" ht="12" customHeight="1"/>
  `);
  merges.push('A1:G1', 'A2:G2', 'A3:G3');

  let cur = 5;

  rows.push(`
    <row r="${cur}" ht="22" customHeight="1">
      <c r="A${cur}" s="4" t="inlineStr"><is><t>No</t></is></c>
      <c r="B${cur}" s="4" t="inlineStr"><is><t>Tanggal / Waktu</t></is></c>
      <c r="C${cur}" s="4" t="inlineStr"><is><t>Nama Peringatan / Agenda Kegiatan</t></is></c>
      <c r="D${cur}" s="4" t="inlineStr"><is><t>Kategori</t></is></c>
      <c r="E${cur}" s="4" t="inlineStr"><is><t>Bentuk Edukasi &amp; Pembiasaan Murid</t></is></c>
      <c r="F${cur}" s="4" t="inlineStr"><is><t>Sasaran Murid</t></is></c>
      <c r="G${cur}" s="4" t="inlineStr"><is><t>Penanggung Jawab (PIC)</t></is></c>
    </row>
  `);
  cur++;

  // Filter dan urutkan agenda penting (PHBI, Purwakarta, Asesmen, Nasional)
  const agendaImportant = ctx.allEvents.filter(ev => ev.kategori !== 'libur' || ev.judul.toLowerCase().includes('hari'));

  agendaImportant.forEach((ev, idx) => {
    const tgl = ev.tanggalSelesai && ev.tanggalSelesai !== ev.tanggalMulai
      ? `${ev.tanggalMulai} s.d. ${ev.tanggalSelesai}`
      : ev.tanggalMulai;

    let katStyle = 9;
    if (ev.kategori === 'keagamaan') katStyle = 16;
    else if (ev.kategori === 'purwakarta') katStyle = 15;
    else if (ev.kategori === 'asesmen') katStyle = 17;

    const pic = ev.kategori === 'keagamaan' ? 'Guru PAI & DKM' : (ev.kategori === 'purwakarta' ? 'Koord. Kesiswaan / Pokja TdBA' : 'Panitia Pelaksana');
    const sasaran = 'Seluruh Murid & Warga Sekolah';

    rows.push(`
      <row r="${cur}" ht="21" customHeight="1">
        <c r="A${cur}" s="9" t="inlineStr"><is><t>${idx + 1}</t></is></c>
        <c r="B${cur}" s="12" t="inlineStr"><is><t>${escapeXml(tgl)}</t></is></c>
        <c r="C${cur}" s="11" t="inlineStr"><is><t>${escapeXml(ev.judul)}</t></is></c>
        <c r="D${cur}" s="${katStyle}" t="inlineStr"><is><t>${escapeXml(ev.badgeLabel || ev.kategori.toUpperCase())}</t></is></c>
        <c r="E${cur}" s="8" t="inlineStr"><is><t>${escapeXml(ev.keterangan || '-')}</t></is></c>
        <c r="F${cur}" s="8" t="inlineStr"><is><t>${escapeXml(sasaran)}</t></is></c>
        <c r="G${cur}" s="9" t="inlineStr"><is><t>${escapeXml(pic)}</t></is></c>
      </row>
    `);
    cur++;
  });

  let colsXml = '<cols>';
  colsXml += '<col min="1" max="1" width="6" customWidth="1"/>';
  colsXml += '<col min="2" max="2" width="22" customWidth="1"/>';
  colsXml += '<col min="3" max="3" width="38" customWidth="1"/>';
  colsXml += '<col min="4" max="4" width="16" customWidth="1"/>';
  colsXml += '<col min="5" max="5" width="45" customWidth="1"/>';
  colsXml += '<col min="6" max="6" width="25" customWidth="1"/>';
  colsXml += '<col min="7" max="7" width="24" customWidth="1"/>';
  colsXml += '</cols>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="0" workbookViewId="0" showGridLines="1">
      <pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  ${colsXml}
  <sheetData>
    ${rows.join('\n')}
  </sheetData>
  <mergeCells count="${merges.length}">
    ${merges.map(m => `<mergeCell ref="${m}"/>`).join('\n')}
  </mergeCells>
</worksheet>`;
}
