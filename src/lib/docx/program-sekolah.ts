import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
  VerticalAlign,
  ShadingType,
  PageOrientation,
} from 'docx';
import { sanitizeText, cleanMarkdownSymbols } from './helpers';

export interface ProgramSekolahData {
  metadata: {
    template_id: string;
    judul_program: string;
    subjudul?: string;
    nama_sekolah: string;
    tahun_ajaran: string;
    jenjang?: string;
    fase_kelas?: string;
    penyusun: string;
    nip_penyusun?: string;
    jabatan_penyusun?: string;
    kepala_sekolah?: string;
    nip_kepala_sekolah?: string;
    komite_sekolah?: string;
    pengawas?: string;
    nip_pengawas?: string;
    tanggal_pengesahan?: string;
    kota?: string;
    opsi_pengesahan?: 'internal' | 'lengkap';
  };
  bab_1_pendahuluan: {
    latar_belakang: string | string[];
    dasar_hukum: string[];
    tujuan: string[];
    sasaran: string | string[];
    manfaat: string[];
  };
  bab_2_kajian_konseptual: {
    judul_bab?: string;
    sub_bab?: Array<{ judul: string; isi: string | string[] }>;
    isi?: string | string[];
  };
  bab_3_rencana_program: {
    kegiatan: Array<{
      nama: string;
      deskripsi?: string;
      tujuan?: string;
      waktu?: string;
      sasaran?: string;
      pic?: string;
      anggaran?: string;
    }>;
    tim_pelaksana: Array<{
      no?: number;
      jabatan: string;
      nama: string;
      tugas: string;
    }>;
    action_plan: Array<{
      no?: number;
      kegiatan: string;
      bulan: number[]; // 1..12 or months Jul..Jun
      pic: string;
    }>;
    sarana_anggaran?: string | string[];
    tabel_anggaran?: Array<{
      no?: number;
      uraian: string;
      volume: string;
      satuan: string;
      total: string;
      sumber: string;
    }>;
  };
  bab_4_monitoring_evaluasi: {
    mekanisme: string | string[];
    indikator: string[];
    evaluasi: string | string[];
    tindak_lanjut: string | string[];
  };
  bab_5_penutup: {
    kesimpulan: string | string[];
    saran: string[];
  };
  lampiran?: {
    sk_tim?: {
      nomor_sk?: string;
      tentang?: string;
      isi?: string | string[];
    };
    instrumen_jurnal?: {
      judul?: string;
      deskripsi?: string;
      tipe?: '7kaih' | 'kokurikuler' | 'hbg' | 'umum';
      headers?: string[];
      rows?: any[];
    };
    catatan_tambahan?: string;
  };
}

// Styling Constants (Standar Kedinasan A4 Portrait)
const FONT_NAME = 'Times New Roman';
const SIZE_COVER_TAG = 40; // 20pt
const SIZE_TITLE = 32; // 16pt
const SIZE_SUBTITLE = 26; // 13pt
const SIZE_BAB_HEADER = 28; // 14pt
const SIZE_SUB_HEADER = 24; // 12pt bold
const SIZE_BODY = 24; // 12pt
const SIZE_TABLE = 20; // 10pt
const LINE_SPACING = 360; // 1.5 baris (240 twips = 1.0, 360 = 1.5)

// Standard Table Borders
const borderLight = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
};

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val)
    .split(/\n\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Helper: Justified Paragraph with 1.5 line spacing and first line indent (1.27 cm = 720 twips)
function createBodyParagraph(text: string, indent: boolean = true): Paragraph {
  const clean = cleanMarkdownSymbols(text);
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: indent ? { firstLine: 720 } : undefined,
    spacing: { before: 80, after: 120, line: LINE_SPACING },
    children: [
      new TextRun({
        text: clean,
        font: FONT_NAME,
        size: SIZE_BODY,
      }),
    ],
  });
}

// Helper: Numbered / Bullet list item with hanging indent
function createListItem(numberPrefix: string, text: string): Paragraph {
  const clean = cleanMarkdownSymbols(text);
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 720, hanging: 360 },
    spacing: { before: 60, after: 80, line: LINE_SPACING },
    children: [
      new TextRun({
        text: numberPrefix + ' ',
        bold: true,
        font: FONT_NAME,
        size: SIZE_BODY,
      }),
      new TextRun({
        text: clean,
        font: FONT_NAME,
        size: SIZE_BODY,
      }),
    ],
  });
}

// Helper: BAB Heading (Centered, Bold, Uppercase)
function createBabHeader(babRoman: string, babTitle: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: `BAB ${babRoman}`,
          bold: true,
          font: FONT_NAME,
          size: SIZE_BAB_HEADER,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [
        new TextRun({
          text: babTitle.toUpperCase(),
          bold: true,
          font: FONT_NAME,
          size: SIZE_BAB_HEADER,
        }),
      ],
    }),
  ];
}

// Helper: Sub-heading (A. Latar Belakang, etc.)
function createSubHeader(code: string, title: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: `${code}. ${title}`,
        bold: true,
        font: FONT_NAME,
        size: SIZE_SUB_HEADER,
      }),
    ],
  });
}

// Helper: Page Break
function createPageBreak(): Paragraph {
  return new Paragraph({
    children: [],
    pageBreakBefore: true,
  });
}

function buildTemplateSpecificLampiran(templateId: string, meta: any, tahun: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  if (templateId === 'kokurikuler-p5' || templateId === 'kokurikuler-profil-lulusan') {
    // Lampiran 2: Rubrik 8 Dimensi Profil Lulusan
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: RUBRIK ASESMEN AUTENTIK 8 DIMENSI PROFIL LULUSAN (SK BSKAP NO. 058/H/KR/2025)',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Format rubrik asesmen autentik 3 tahapan perkembangan berikut digunakan oleh pendidik/fasilitator untuk memetakan capaian dimensi dan subdimensi Profil Lulusan murid sepanjang kegiatan kokurikuler:'
      )
    );

    const rubrikHeader = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dimensi & Subdimensi Sasaran', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Berkembang (Menuju Standar)', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cakap (Standar Kelulusan / SKL)', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mahir (Melampaui Standar)', bold: true, font: FONT_NAME, size: 14 })] })] }),
      ],
    });

    const rubrikData = [
      {
        no: 1,
        dimensi: 'Keimanan & Ketakwaan (Hubungan dengan Alam)',
        berkembang: 'Menunjukkan pemahaman tentang pentingnya menjaga kebersihan lingkungan dengan bimbingan.',
        cakap: 'Membiasakan menjaga kebersihan lingkungan dan kelestarian alam secara konsisten dan mandiri.',
        mahir: 'Menjadi contoh bagi teman dalam kepedulian lingkungan serta berinisiatif menjaga kelestarian alam.',
      },
      {
        no: 2,
        dimensi: 'Kewargaan (Kewargaan Lokal & Nasional)',
        berkembang: 'Mengenal aturan dan norma sosial yang berlaku di lingkungan keluarga, sekolah, dan masyarakat.',
        cakap: 'Menaati aturan sosial dan berperilaku sesuai norma kebangsaan secara konsisten.',
        mahir: 'Menaati aturan serta mengajak teman sebaya mematuhi tata tertib dan bangga beridentitas Indonesia.',
      },
      {
        no: 3,
        dimensi: 'Penalaran Kritis (Penyelesaian Masalah)',
        berkembang: 'Menyelesaikan masalah sederhana dan menghasilkan solusi namun masih kurang tepat.',
        cakap: 'Menyelesaikan masalah sederhana dan menghasilkan solusi yang tepat sesuai konteks kegiatan.',
        mahir: 'Mengidentifikasi masalah, menghasilkan solusi inovatif yang tepat, serta merefleksikan prosesnya.',
      },
      {
        no: 4,
        dimensi: 'Kreativitas (Gagasan Baru & Karya)',
        berkembang: 'Membuat tindakan atau karya sederhana yang kreatif dengan meniru contoh fasilitator.',
        cakap: 'Membuat karya sederhana yang kreatif dengan memadukan berbagai ide sesuai minatnya.',
        mahir: 'Membuat karya inovatif berdampak nyata serta mampu mengapresiasi dan mengkritisi karya secara konstruktif.',
      },
      {
        no: 5,
        dimensi: 'Kolaborasi (Kerja Sama & Berbagi)',
        berkembang: 'Mulai bekerja sama dengan teman sebaya dalam kelompok dengan bimbingan dan arahan guru.',
        cakap: 'Bekerjasama dengan teman, membagi tugas secara adil, dan bertanggung jawab atas hasil tim.',
        mahir: 'Membangun koordinasi tim yang efektif, menjaga kekompakan, dan mendorong tercapainya tujuan kelompok.',
      },
      {
        no: 6,
        dimensi: 'Kemandirian (Bertanggung Jawab)',
        berkembang: 'Melakukan upaya mencapai target tugas kokurikuler sesuai arahan yang diberikan guru.',
        cakap: 'Menetapkan target kerja mandiri dan berusaha menuntaskan tugas kelompok tepat waktu.',
        mahir: 'Menetapkan tujuan belajar mandiri, tuntas mengerjakannya, dan bertanggung jawab penuh atas hasilnya.',
      },
      {
        no: 7,
        dimensi: 'Kesehatan (Pola Hidup Bersih & Lingkungan)',
        berkembang: 'Mengenal kebiasaan hidup bersih dan pentingnya menjaga kebersihan tempat kegiatan.',
        cakap: 'Membiasakan hidup bersih dan berperan aktif memilah sampah di area kegiatan sekolah.',
        mahir: 'Menjadi teladan hidup sehat, menginisiasi kebersihan lingkungan, dan menjaga kebugaran tim.',
      },
      {
        no: 8,
        dimensi: 'Komunikasi (Menyimak & Berbicara)',
        berkembang: 'Menyimak instruksi kegiatan dan menyampaikan pendapat sederhana namun belum terstruktur.',
        cakap: 'Menyampaikan gagasan kelompok dengan lafal jelas, runtut, santun, dan menanggapi pertanyaan secara tepat.',
        mahir: 'Mempresentasikan hasil karya secara percaya diri, persuasif, komunikatif, dan memfasilitasi diskusi tim.',
      },
    ];

    const rubrikRows = rubrikData.map(r => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(r.no), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: r.dimensi, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: r.berkembang, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: r.cakap, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: r.mahir, font: FONT_NAME, size: 14 })] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [rubrikHeader, ...rubrikRows] })
    );

    // Lampiran 3: Lembar Refleksi Diri Kokurikuler
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: LEMBAR REFLEKSI DIRI MURID (KOKURIKULER PROFIL LULUSAN)',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Lembar refleksi ini diisi oleh setiap murid pada akhir gelaran aksi kegiatan kokurikuler untuk mengevaluasi pemahaman bermakna dan kontribusi belajarnya:'
      )
    );

    const refHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 54, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pernyataan Refleksi Siswa', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sangat Setuju', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Setuju', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ragu-ragu', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tidak Setuju', bold: true, font: FONT_NAME, size: 14 })] })] }),
      ],
    });

    const refQuestions = [
      '1. Saya memahami tujuan dan kebermanfaatan tema projek ini bagi diri dan lingkungan.',
      '2. Saya aktif terlibat dan membagi tugas secara adil bersama teman satu kelompok.',
      '3. Saya berani mengemukakan ide dan mendengarkan masukan dari anggota kelompok lain.',
      '4. Saya bangga dengan produk/aksi nyata yang dihasilkan oleh kelompok saya.',
      '5. Saya bertekad melanjutkan kebiasaan positif yang dipelajari selama projek di kehidupan sehari-hari.',
    ];

    const refRows = refQuestions.map((q, idx) => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 54, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: q, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [refHeaders, ...refRows] })
    );

  } else if (templateId === '7kaih') {
    // Lampiran 2: Jurnal 7 KAIH & 7 Poé Atikan Purwakarta
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: JURNAL MINGGUAN 7 KEBIASAAN ANAK INDONESIA HEBAT (7 KAIH) & 7 POÉ ATIKAN',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Format instrumen berikut memadukan 7 Kebiasaan Anak Indonesia Hebat dengan kearifan lokal 7 Poé Atikan Purwakarta Istimewa sebagai sarana kendali habituasi harian murid:'
      )
    );

    const jurnalHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Fokus Pembiasaan (7 KAIH & 7 Poé Atikan)', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sen\nAjeg', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sel\nMapag', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Rab\nManeuh', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kam\nNyanding', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Jum\nNyucikeun', bold: true, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Catatan & Paraf Guru', bold: true, font: FONT_NAME, size: 14 })] })] }),
      ],
    });

    const kaihRows = [
      '1. Bangun Pagi Mandiri & Ibadah Subuh (Jumat Nyucikeun Diri)',
      '2. Berbakti pada Orang Tua & Budaya 5S (Senin Ajeg Nusantara)',
      '3. Berolahraga Ceria, Makan Sehat & Bawa Tumbler (Selasa Mapag Buana)',
      '4. Gemar Membaca Buku / Literasi 15 Menit (Rabu Maneuh di Sunda)',
      '5. Rajin Belajar & Menjaga Kerapihan Diri (Kamis Nyanding Wawangi)',
      '6. Peduli Lingkungan & Memilah Sampah Kelas (TdBA Karakter)',
      '7. Istirahat Tepat Waktu & Kumpul Keluarga (Betah di Imah)',
    ];

    const kaihTableRows = kaihRows.map((kb, idx) => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: kb, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Paraf: .........', font: FONT_NAME, size: 14 })] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [jurnalHeaders, ...kaihTableRows] }),
      new Paragraph({
        spacing: { before: 120, after: 180 },
        children: [
          new TextRun({
            text: 'Petunjuk: Berikan tanda centang (✓) pada hari anak mempraktikkan kebiasaan secara mandiri. Paraf orang tua dibubuhkan setiap akhir pekan.',
            italic: true,
            font: FONT_NAME,
            size: 16,
            color: '64748B',
          }),
        ],
      })
    );

    // Lampiran 3: Lembar Observasi Supervisi
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: LEMBAR OBSERVASI DAN MONITORING SUPERVISI PEMBIASAAN SISWA',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Digunakan dalam supervisi berkala oleh Wali Kelas, Kepala Sekolah, dan Pengawas Pembina untuk mengevaluasi habituasi positif:'
      )
    );

    const supHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Aspek Observasi Karakter', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Fakta & Catatan Pelaksanaan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Rencana Tindak Lanjut & Apresiasi', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const supAspects = [
      '1. Ketertiban & Pembiasaan 5S di Gerbang Sekolah',
      '2. Konsistensi Pengisian Jurnal 7 KAIH Mandiri',
      '3. Keterlibatan & Validasi Orang Tua Setiap Akhir Pekan',
      '4. Pengurangan Konflik & Penumbuhan Empati Antar Siswa',
    ];

    const supRows = supAspects.map(aspek => new TableRow({
      children: [
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: aspek, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [supHeaders, ...supRows] })
    );

  } else if (templateId === 'hari-belajar-guru') {
    // Lampiran 2: Jurnal Refleksi Kombel
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: JURNAL REFLEKSI KOMUNITAS BELAJAR (KOMBEL) GURU',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Instrumen siklus inkuiri Komunitas Belajar guru dalam mendiagnosis kebutuhan belajar murid, berbagi praktik baik, dan evaluasi pengajaran:'
      )
    );

    const kombelHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tahapan Siklus Kombel', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Fokus Topik Pembelajaran', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Temuan Masalah & Solusi Disepakati', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PIC / RTL', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const kombelData = [
      { no: 1, siklus: 'Siklus 1: Rencanakan (Plan)', topik: 'Diferensiasi Pembelajaran & Asesmen Awal', solusi: 'Siswa memiliki rentang kesiapan beragam; guru menyiapkan scaffolding materi bertingkat.', pic: 'Tim Guru Fase' },
      { no: 2, siklus: 'Siklus 2: Terapkan (Do)', topik: 'Pemanfaatan Media Visual Interaktif & AI', solusi: 'Meningkatkan antusiasme dan pemahaman konsep sains/matematika secara konkret.', pic: 'Guru Penggerak' },
      { no: 3, siklus: 'Siklus 3: Evaluasi (Check)', topik: 'Analisis Hasil Formatif & Penilaian Karakter', solusi: 'Mendeteksi miskonsepsi dasar membaca pemahaman dan numerasi soal cerita.', pic: 'Semua Guru' },
      { no: 4, siklus: 'Siklus 4: Refleksi (Act)', topik: 'Penyusunan Praktik Baik & Modifikasi Modul', solusi: 'Menyusun bank soal reflektif dan modul ajar yang lebih ramah gaya belajar anak.', pic: 'Koord. Kurikulum' },
    ];

    const kombelRows = kombelData.map(k => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(k.no), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: k.siklus, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: k.topik, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: k.solusi, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: k.pic, font: FONT_NAME, size: 14 })] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [kombelHeaders, ...kombelRows] })
    );

    // Lampiran 3: Daftar Hadir & Notula
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: FORMAT DAFTAR HADIR DAN NOTULA SESI HARI BELAJAR GURU (HBG)',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Format daftar hadir pertemuan rutin komunitas belajar pendidik sebagai dokumen bukti fisik keterlaksanaan program:'
      )
    );

    const hadirHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hari / Tanggal', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nama Pendidik / NIP', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Jabatan / Kelas', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tanda Tangan', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const sampleHadir = [1, 2, 3, 4, 5];
    const hadirRows = sampleHadir.map(n => new TableRow({
      children: [
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(n), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [hadirHeaders, ...hadirRows] })
    );

  } else if (templateId === 'literasi') {
    // Lampiran 2: Jurnal Membaca Siswa
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: JURNAL MEMBACA HARIAN SISWA (POHON GEULIS LITERASI)',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Kartu kendali membaca 15 menit sebelum pelajaran dimulai dan pemanfaatan pojok baca kelas:'
      )
    );

    const litHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hari / Tanggal', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Judul Buku & Pengarang', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hal. Dibaca', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nilai Moral / Budi Pekerti', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Paraf Guru', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const litSampleRows = [1, 2, 3, 4, 5].map(idx => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [litHeaders, ...litSampleRows] })
    );

    // Lampiran 3: Rubrik Asesmen Literasi
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: RUBRIK ASESMEN KEMAMPUAN RESENSI & PRESENTASI BACAAN SISWA',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Format penilaian saat kegiatan berbagi intisari buku cerita di hadapan rekan sekelas / festival literasi:'
      )
    );

    const rubLitHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Aspek Keterampilan Literasi', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Kriteria Sangat Baik (SB)', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Kriteria Berkembang (B)', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Catatan & Rekomendasi Guru', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const rubLitRowsData = [
      { aspek: '1. Kelancaran & Keberanian Bercerita', sb: 'Menyampaikan alur cerita secara runtut, ekspresif, dan percaya diri tinggi.', b: 'Menceritakan garis besar cerita dengan bimbingan dan arahan sesekali.' },
      { aspek: '2. Pemahaman Isi & Watak Tokoh', sb: 'Menganalisis konflik utama serta watak tokoh secara tepat dan mendalam.', b: 'Menyebutkan nama-nama tokoh dan alur sederhana secara umum.' },
      { aspek: '3. Penerapan Pesan Budi Pekerti', sb: 'Mampu menghubungkan hikmah bacaan ke dalam teladan perilaku sehari-hari.', b: 'Menyebutkan pesan moral cerita namun belum mengaitkannya ke diri sendiri.' },
    ];

    const rubLitRows = rubLitRowsData.map(r => new TableRow({
      children: [
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: r.aspek, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: r.sb, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: r.b, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [rubLitHeaders, ...rubLitRows] })
    );

  } else if (templateId === 'uks') {
    // Lampiran 2: Skrining UKS
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: FORMAT SKRINING KESEHATAN BERKALA MURID',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Format rekam pemeriksaan kesehatan fisik sederhana murid berkala bekerja sama dengan Puskesmas:'
      )
    );

    const uksHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nama Murid', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TB (cm) / BB (kg)', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Status Gizi', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kesehatan Gigi & Mata', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Catatan / Rujukan', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const uksSampleRows = [1, 2, 3, 4, 5].map(n => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(n), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [uksHeaders, ...uksSampleRows] })
    );

    // Lampiran 3: Kontrol Kantin & Sanitasi
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: LEMBAR INSPEKSI KESEHATAN LINGKUNGAN & KANTIN SEHAT SEKOLAH',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Instrumen audit berkala higienitas lingkungan sekolah, sanitasi jamban, dan makanan kantin:'
      )
    );

    const sanitasiHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Komponen Lingkungan Sehat', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Standar Kelayakan UKS', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Hasil Temuan Lapangan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const sanRowsData = [
      { komp: '1. Sarana Cuci Tangan Pakai Sabun (CTPS)', std: 'Air bersih mengalir lancar, sabun cuci tangan selalu tersedia di depan tiap ruang kelas.' },
      { komp: '2. Sanitasi Jamban / Kamar Mandi Siswa', std: 'Kering, bersih, tidak berbau, tersedia air bersih cukup, terpisah siswa laki-laki dan perempuan.' },
      { komp: '3. Higienitas Makanan Kantin Sekolah', std: 'Makanan tertutup rapat, bergizi seimbang, bebas bahan pengawet/pewarna sintetis berbahaya.' },
      { komp: '4. Pengelolaan Wadah Sampah Tertutup', std: 'Tersedia tempat sampah pilah tertutup dan dilakukan pengosongan berkala setiap hari.' },
    ];

    const sanRows = sanRowsData.map(s => new TableRow({
      children: [
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: s.komp, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: s.std, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [sanitasiHeaders, ...sanRows] })
    );

  } else if (templateId === 'adiwiyata') {
    // Lampiran 2: Monitoring PBLHS & TdBA
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: LEMBAR MONITORING AKSI PBLHS & TATANEN DI BALE ATIKAN (TdBA)',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Instrumen pemantauan aksi peduli lingkungan hidup, budidaya kebun organik, dan konservasi alam berbasis kearifan lokal:'
      )
    );

    const adwHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Area Aksi Lingkungan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 36, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Indikator Keterlaksanaan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kondisi Lapangan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'RTL Perawatan', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const adwRowsData = [
      { no: 1, area: 'Kebun Sekolah & TdBA Organik', ind: 'Penanaman sayur organik, toga, pemupukan kompos mandiri, dan edukasi ketahanan pangan.' },
      { no: 2, area: 'Reduksi Sampah Plastik Sekali Pakai', ind: 'Budaya membawa wadah bekal dan tumbler minum sendiri (Zero Waste School).' },
      { no: 3, area: 'Pemilahan Sampah 3R', ind: 'Ketersediaan dan pemilahan tempat sampah organik, anorganik, dan residu terawat baik.' },
      { no: 4, area: 'Konservasi Energi & Air', ind: 'Pemanfaatan ventilasi alami, mematikan kran air setelah digunakan, dan sumur resapan/biopori.' },
    ];

    const adwRows = adwRowsData.map(a => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(a.no), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: a.area, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 36, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: a.ind, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [adwHeaders, ...adwRows] })
    );

    // Lampiran 3: Inventarisasi Sampah
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: FORMULIR INVENTARISASI REDUKSI TIMBULAN SAMPAH SEKOLAH',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Pencatatan estimasi reduksi timbulan sampah satuan pendidikan melalui aksi pemilahan dan daur ulang:'
      )
    );

    const sampahHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Kategori Sampah Sekolah', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Estimasi Vol / Pekan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Metode Pengolahan / Reduksi', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Penanggung Jawab', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const sampahData = [
      { kat: '1. Daun & Ranting Kering', vol: '± 15 Kg', met: 'Diolah menjadi pupuk kompos organik kebun TdBA', pic: 'Pokja Kompos & TdBA' },
      { kat: '2. Kertas & Kardus Bekas', vol: '± 5 Kg', met: 'Dikumpulkan di Bank Sampah untuk didaur ulang', pic: 'Pokja Bank Sampah' },
      { kat: '3. Botol Plastik & Kemasan', vol: '± 2 Kg', met: 'Diminimalisir lewat himbauan bekal ramah lingkungan', pic: 'Seluruh Pendidik' },
    ];

    const sampahRows = sampahData.map(s => new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: s.kat, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.vol, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: s.met, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: s.pic, font: FONT_NAME, size: 14 })] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [sampahHeaders, ...sampahRows] })
    );

  } else if (templateId === 'keagamaan') {
    // Lampiran 2: Buku Mutaba'ah Ibadah Harian
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: "LAMPIRAN 2: BUKU KENDALI IBADAH HARIAN SISWA (MUTABA'AH YAUMIYAH)",
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Instrumen pemantauan ibadah wajib, sholat dhuha, tadarus Al-Qur’an / surat pendek, dan amal sholeh harian murid:'
      )
    );

    const relHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hari / Tanggal', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sholat Fardhu 5 Waktu', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sholat Dhuha', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tadarus / Hafalan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Paraf Ortu', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const relSampleRows = [1, 2, 3, 4, 5].map(idx => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sub / Dzu / Ash / Mag / Isy', font: FONT_NAME, size: 14, color: '94A3B8' })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '○', font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [relHeaders, ...relSampleRows] })
    );

    // Lampiran 3: Evaluasi Akhlak Mulia
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: LEMBAR EVALUASI PEMBIASAAN AKHLAK MULIA & PERILAKU SOSIAL',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Format pemantauan budi pekerti, kejujuran, dan kesantunan anak dalam pergaulan di sekolah:'
      )
    );

    const akhlakHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Indikator Akhlak Mulia', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Bentuk Perilaku Nyata yang Diamati', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Catatan Guru Pembimbing', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const akhlakData = [
      { ind: '1. Adab & Kesantunan Bertutur Kata', bentuk: 'Membiasakan kata tolong, maaf, terima kasih, dan permisi saat berinteraksi.' },
      { ind: '2. Kejujuran & Sportivitas', bentuk: 'Berani berkata jujur saat berbuat salah dan tidak menyontek saat asesmen berlangsung.' },
      { ind: '3. Kepedulian Sosial & Kedermawanan', bentuk: 'Rutin menyisihkan infaq Jumat serta memiliki kepekaan membantu teman yang kesulitan.' },
    ];

    const akhlakRows = akhlakData.map(a => new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: a.ind, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: a.bentuk, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [akhlakHeaders, ...akhlakRows] })
    );

  } else if (templateId === 'kalender-sekolah') {
    // Lampiran 2: Matriks Rincian Pekan Efektif (RPE) Resmi Disdik Purwakarta
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: MATRIKS RINCIAN PEKAN EFEKTIF (RPE) RESMI TAHUN AJARAN 2026/2027',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Rekapitulasi pekan kalender, pekan efektif KBM, dan pekan tidak efektif mengacu pada Surat Edaran Kadisdik Purwakarta No. 400.3.5/2367-Dikdas/2026 (Aturan minimal 3 hari efektif KBM per pekan):'
      )
    );

    const rpeHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Bulan / Semester', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Total Pekan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pekan Efektif', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tidak Efektif', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Keterangan Agenda Utama', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const rpeRowsData = [
      // SEMESTER 1
      { no: '1', bulan: 'Juli 2026', total: '5', kbm: '2', non: '3', ket: 'MPLS Ramah Anak & Libur TP Lalu' },
      { no: '2', bulan: 'Agustus 2026', total: '5', kbm: '4', non: '1', ket: 'HUT RI ke-81 & Maulid Nabi SAW' },
      { no: '3', bulan: 'September 2026', total: '5', kbm: '4', non: '1', ket: 'Sumatif Tengah Semester (STS) 1' },
      { no: '4', bulan: 'Oktober 2026', total: '5', kbm: '4', non: '1', ket: 'Hari Sumpah Pemuda & Cadangan' },
      { no: '5', bulan: 'November 2026', total: '5', kbm: '4', non: '1', ket: 'Hari Guru Nasional & Mulai SAS 1' },
      { no: '6', bulan: 'Desember 2026', total: '5', kbm: '0', non: '5', ket: 'SAS 1, Rapor & Libur Semester 1' },
      { no: 'Σ1', bulan: 'SEMESTER 1 (GANJIL)', total: '30', kbm: '18', non: '12', ket: '18 Pekan Efektif KBM Terpilih' },
      // SEMESTER 2
      { no: '7', bulan: 'Januari 2027', total: '5', kbm: '3', non: '2', ket: 'Lanjutan Libur & Masuk 11 Jan' },
      { no: '8', bulan: 'Februari 2027', total: '5', kbm: '3', non: '2', ket: 'Rajaban, Libur Ramadhan & Masantren' },
      { no: '9', bulan: 'Maret 2027', total: '5', kbm: '3', non: '2', ket: 'Masantren di Sakola & Libur Idul Fitri' },
      { no: '10', bulan: 'April 2027', total: '5', kbm: '4', non: '1', ket: 'KBM Efektif Penuh & Hari Kartini' },
      { no: '11', bulan: 'Mei 2027', total: '5', kbm: '5', non: '0', ket: 'KBM / PSAJ Khusus Kelas 6' },
      { no: '12', bulan: 'Juni 2027', total: '5', kbm: '0', non: '5', ket: 'ASAT Kenaikan Kelas, Rapor, Libur TP' },
      { no: 'Σ2', bulan: 'SEMESTER 2 (GENAP)', total: '30', kbm: '18', non: '12', ket: '18 Pekan Efektif KBM (16 Kls 6)' },
      { no: 'TOTAL', bulan: 'TAHUN AJARAN 2026/2027', total: '60', kbm: '36', non: '24', ket: 'Standar Min. 36 Pekan BSKAP/Pusat' },
    ];

    const rpeRows = rpeRowsData.map(r => {
      const isSubtotal = r.no.startsWith('Σ') || r.no === 'TOTAL';
      const bgColor = r.no === 'TOTAL' ? 'E0E7FF' : (isSubtotal ? 'F1F5F9' : undefined);
      return new TableRow({
        children: [
          new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.no, bold: isSubtotal, font: FONT_NAME, size: 16 })] })] }),
          new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ children: [new TextRun({ text: r.bulan, bold: isSubtotal, font: FONT_NAME, size: 16 })] })] }),
          new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.total, bold: isSubtotal, font: FONT_NAME, size: 16 })] })] }),
          new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.kbm, bold: isSubtotal, color: isSubtotal ? '4338CA' : undefined, font: FONT_NAME, size: 16 })] })] }),
          new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.non, bold: isSubtotal, font: FONT_NAME, size: 16 })] })] }),
          new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ children: [new TextRun({ text: r.ket, bold: isSubtotal, font: FONT_NAME, size: 14 })] })] }),
        ],
      });
    });

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [rpeHeaders, ...rpeRows] })
    );

    // Lampiran 3: Agenda Kegiatan Keagamaan (PHBI) & Karakter Purwakarta
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: DAFTAR PERINGATAN HARI BESAR ISLAM (PHBI) & KEGIATAN KARAKTER PURWAKARTA',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Jadwal pelaksanaan kegiatan keagamaan, peringatan hari besar Islam, dan pembiasaan budaya kearifan lokal satuan pendidikan:'
      )
    );

    const phbiHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hari / Tanggal', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nama Kegiatan / Peringatan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kategori Agenda', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Penanggung Jawab', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const phbiData = [
      { no: 1, tgl: '20 Juli 2026', nama: 'Peringatan Hari Jadi Purwakarta (HJP ke-195) & 7 Poé Atikan', kat: 'Kearifan Lokal', pic: 'Koord. 7 Poé Atikan' },
      { no: 2, tgl: '14 Agustus 2026', nama: 'Peringatan Hari Pramuka Nasional ke-65', kat: 'Karakter/Pramuka', pic: 'Pembina Pramuka' },
      { no: 3, tgl: '17 Agustus 2026', nama: 'HUT Kemerdekaan Republik Indonesia ke-81', kat: 'Nasional', pic: 'Panitia HUT RI' },
      { no: 4, tgl: '25 Agustus 2026', nama: 'Peringatan Maulid Nabi Muhammad SAW 1448 H (PHBI)', kat: 'Keagamaan (PHBI)', pic: 'Guru PAI & DKM' },
      { no: 5, tgl: '18 September 2026', nama: 'Peringatan Hari Bambu Sedunia (World Bamboo Day - TdBA)', kat: 'Kearifan Lokal TdBA', pic: 'Pokja TdBA' },
      { no: 6, tgl: '25 November 2026', nama: 'Hari Guru Nasional (HGN) & HUT PGRI ke-81', kat: 'Kegiatan Sekolah', pic: 'Tim Kombel Guru' },
      { no: 7, tgl: '5 Februari 2027', nama: 'Peringatan Isra Mi\'raj Nabi Muhammad SAW / Rajaban 1448 H', kat: 'Keagamaan (PHBI)', pic: 'Guru PAI & DKM' },
      { no: 8, tgl: '11 Feb - 5 Mar 2027', nama: 'Program Pembiasaan Karakter "Masantren di Sakola" Ramadhan', kat: 'Keagamaan/Karakter', pic: 'Tim Masantren Ramadhan' },
      { no: 9, tgl: '17 Mei 2027', nama: 'Hari Raya Idul Adha 1448 H & Latihan Ibadah Qurban', kat: 'Keagamaan (PHBI)', pic: 'Guru PAI & Komite' },
      { no: 10, tgl: '21 - 25 Juni 2027', nama: 'Pentas Seni / Gelar Karya Profil Lulusan & Pembagian Rapor', kat: 'Kokurikuler & Rapor', pic: 'Wali Kelas & Tim P5' },
    ];

    const phbiRows = phbiData.map(p => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(p.no), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: p.tgl, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: p.nama, bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.kat, font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: p.pic, font: FONT_NAME, size: 14 })] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [phbiHeaders, ...phbiRows] })
    );

  } else {
    // Kustom / Generic
    // Lampiran 2: Monitoring Keterlaksanaan
    elements.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 2: INSTRUMEN MONITORING KETERLAKSANAAN PROGRAM SEKOLAH',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Format kendali verifikasi keterlaksanaan tahapan program kerja di lingkungan satuan pendidikan:'
      )
    );

    const kustomHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Uraian Aksi Program', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sasaran Peserta', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Keterlaksanaan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Bukti Fisik / Dokumentasi', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const kustomSampleRows = [1, 2, 3, 4].map(idx => new TableRow({
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx), font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `Kegiatan Program ${idx}`, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Siswa & Guru', font: FONT_NAME, size: 14 })] })] }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ya / Tidak', font: FONT_NAME, size: 14, color: '94A3B8' })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [kustomHeaders, ...kustomSampleRows] })
    );

    // Lampiran 3: Evaluasi Target
    elements.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'LAMPIRAN 3: LEMBAR EVALUASI CAPAIAN INDIKATOR KEBERHASILAN PROGRAM',
            bold: true,
            font: FONT_NAME,
            size: SIZE_SUB_HEADER,
          }),
        ],
      }),
      createBodyParagraph(
        'Matriks evaluasi berkala untuk mengukur pencapaian target mutu dan perumusan tindak lanjut:'
      )
    );

    const evHeaders = new TableRow({
      children: [
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Indikator Keberhasilan Program', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Target Capaian', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Realisasi Lapangan', bold: true, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Rekomendasi Keberlanjutan', bold: true, font: FONT_NAME, size: 16 })] })] }),
      ],
    });

    const evRowsData = [
      '1. Partisipasi Aktif Sasaran Program (Minimal 90%)',
      '2. Ketersediaan Sarana Pendukung dan Dokumentasi',
      '3. Peningkatan Nilai Iklim Karakter Rapor Pendidikan',
    ];

    const evRows = evRowsData.map(ev => new TableRow({
      children: [
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ev, font: FONT_NAME, size: 16 })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
      ],
    }));

    elements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderLight, rows: [evHeaders, ...evRows] })
    );
  }

  return elements;
}

export async function generateProgramDocxBuffer(data: ProgramSekolahData): Promise<Uint8Array> {
  const meta = data.metadata || ({} as any);
  const kota = meta.kota || 'Purwakarta';
  const tahun = meta.tahun_ajaran ? meta.tahun_ajaran.split('/')[0] : '2025';

  const children: any[] = [];

  // =========================================================================
  // 1. COVER PAGE (SESUAI REQUEST USER: TANPA KOP SEKOLAH, CUKUP TULISAN "COVER" HURUF BESAR)
  // =========================================================================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
      children: [
        new TextRun({
          text: 'COVER',
          bold: true,
          font: FONT_NAME,
          size: SIZE_COVER_TAG,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 200 },
      children: [
        new TextRun({
          text: (meta.judul_program || 'DOKUMEN PROGRAM KERJA SEKOLAH').toUpperCase(),
          bold: true,
          font: FONT_NAME,
          size: SIZE_TITLE,
        }),
      ],
    })
  );

  if (meta.subjudul) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 400 },
        children: [
          new TextRun({
            text: meta.subjudul.toUpperCase(),
            font: FONT_NAME,
            size: SIZE_SUBTITLE,
            color: '334155',
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: `TAHUN AJARAN ${meta.tahun_ajaran || '2025/2026'}`,
          bold: true,
          font: FONT_NAME,
          size: SIZE_SUBTITLE,
        }),
      ],
    })
  );

  if (meta.fase_jenjang) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 400 },
        children: [
          new TextRun({
            text: `SASARAN: ${meta.fase_jenjang.toUpperCase()}`,
            font: FONT_NAME,
            size: SIZE_BODY,
            color: '475569',
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000, after: 120 },
      children: [
        new TextRun({
          text: 'Disusun Oleh:',
          font: FONT_NAME,
          size: SIZE_BODY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: meta.penyusun || 'Tim Pengembang Kurikulum',
          bold: true,
          font: FONT_NAME,
          size: SIZE_SUBTITLE,
        }),
      ],
    })
  );

  if (meta.nip_penyusun) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 600 },
        children: [
          new TextRun({
            text: `NIP. ${meta.nip_penyusun}`,
            font: FONT_NAME,
            size: SIZE_BODY,
          }),
        ],
      })
    );
  } else {
    children.push(new Paragraph({ spacing: { after: 600 }, children: [] }));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 80 },
      children: [
        new TextRun({
          text: (meta.nama_sekolah || 'SATUAN PENDIDIKAN DASAR').toUpperCase(),
          bold: true,
          font: FONT_NAME,
          size: SIZE_SUBTITLE,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 80 },
      children: [
        new TextRun({
          text: `DINAS PENDIDIKAN KABUPATEN ${kota.toUpperCase()}`,
          bold: true,
          font: FONT_NAME,
          size: SIZE_BODY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 0 },
      children: [
        new TextRun({
          text: `TAHUN ${tahun}`,
          bold: true,
          font: FONT_NAME,
          size: SIZE_BODY,
        }),
      ],
    })
  );

  // =========================================================================
  // 2. LEMBAR PENGESAHAN
  // =========================================================================
  children.push(createPageBreak());

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({
          text: 'LEMBAR PENGESAHAN',
          bold: true,
          font: FONT_NAME,
          size: SIZE_BAB_HEADER,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 260 },
      children: [
        new TextRun({
          text: (meta.judul_program || 'PROGRAM KERJA SEKOLAH').toUpperCase(),
          bold: true,
          font: FONT_NAME,
          size: SIZE_SUBTITLE,
        }),
      ],
    }),
    createBodyParagraph(
      `Dokumen ${meta.judul_program || 'Program Kerja'} ini telah disusun melalui koordinasi tim pengembang kurikulum dan pendidik, diperiksa, disetujui, dan disahkan untuk diberlakukan sebagai pedoman operasional pelaksanaan kegiatan pada Tahun Ajaran ${meta.tahun_ajaran || '2025/2026'} di ${meta.nama_sekolah || 'satuan pendidikan'}.`,
      false
    ),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: `Ditetapkan di: ${kota}\nPada tanggal: ${meta.tanggal_pengesahan || `Juli ${tahun}`}`,
          font: FONT_NAME,
          size: SIZE_BODY,
        }),
      ],
    })
  );

  // Signature Table (2 tanda tangan internal vs 4 tanda tangan dinas lengkap)
  const ksName = meta.kepala_sekolah || '...........................................';
  const ksNip = meta.nip_kepala_sekolah ? `NIP. ${meta.nip_kepala_sekolah}` : 'NIP. .....................................';
  const penName = meta.penyusun || '...........................................';
  const penNip = meta.nip_penyusun ? `NIP. ${meta.nip_penyusun}` : 'NIP. .....................................';
  const komiteName = meta.komite_sekolah || '...........................................';
  const pengawasName = meta.pengawas || '...........................................';
  const pengawasNip = meta.nip_pengawas ? `NIP. ${meta.nip_pengawas}` : 'NIP. .....................................';

  const ttdBorder = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  let ttdRows: TableRow[] = [];

  if (meta.opsi_pengesahan === 'internal') {
    // 2 Tanda Tangan: Penyusun (kiri) & Kepala Sekolah (kanan)
    ttdRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: `Penyusun / Koordinator,\n${meta.jabatan_penyusun || 'Guru / Tim Pengembang'}`,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: penName,
                    bold: true,
                    underline: {},
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: penNip,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: `Mengesahkan,\nKepala ${meta.nama_sekolah || 'Sekolah'}`,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ksName,
                    bold: true,
                    underline: {},
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ksNip,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];
  } else {
    // Format Dinas Lengkap: 4 Tanda Tangan (Komite, Penyusun, Pengawas, Kepala Sekolah)
    ttdRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: `Menyetujui,\nKetua Komite Sekolah`,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: komiteName,
                    bold: true,
                    underline: {},
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: `Penyusun / Koordinator,\n${meta.jabatan_penyusun || 'Guru / Tim Pengembang'}`,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: penName,
                    bold: true,
                    underline: {},
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: penNip,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 800 },
                children: [
                  new TextRun({
                    text: `Mengetahui,\nPengawas Pembina`,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: pengawasName,
                    bold: true,
                    underline: {},
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: pengawasNip,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 800 },
                children: [
                  new TextRun({
                    text: `Mengesahkan,\nKepala ${meta.nama_sekolah || 'Sekolah'}`,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ksName,
                    bold: true,
                    underline: {},
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ksNip,
                    font: FONT_NAME,
                    size: SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];
  }

  const ttdTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: ttdBorder,
    rows: ttdRows,
  });

  children.push(ttdTable);

  // =========================================================================
  // 3. KATA PENGANTAR
  // =========================================================================
  children.push(createPageBreak());

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: 'KATA PENGANTAR',
          bold: true,
          font: FONT_NAME,
          size: SIZE_BAB_HEADER,
        }),
      ],
    }),
    createBodyParagraph(
      `Puji dan syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas rahmat dan karunia-Nya, sehingga Dokumen ${meta.judul_program || 'Program Kerja'} Tahun Ajaran ${meta.tahun_ajaran || '2025/2026'} di ${meta.nama_sekolah || 'satuan pendidikan kami'} dapat diselesaikan dengan baik.`
    ),
    createBodyParagraph(
      `Program ini disusun sebagai pedoman terencana, terarah, dan sistematis dalam rangka mengimplementasikan kurikulum dan pembiasaan positif di lingkungan satuan pendidikan. Dokumen ini memuat landasan pemikiran, tujuan strategis, rencana aksi nyata, hingga mekanisme monitoring dan evaluasi terpadu.`
    ),
    createBodyParagraph(
      `Kami menyampaikan penghargaan dan terima kasih yang setinggi-tingginya kepada Kepala Sekolah, Dewan Guru, Tenaga Kependidikan, Komite Sekolah, serta Pengawas Pembina atas bimbingan, masukan, dan dedikasi yang diberikan dalam penyusunan program kerja ini.`
    ),
    createBodyParagraph(
      `Kami menyadari bahwa dokumen ini masih memiliki ruang penyempurnaan. Oleh karena itu, masukan konstruktif sangat kami harapkan guna efektivitas pelaksanaan program di lapangan. Semoga dokumen ini membawa kebermanfaatan nyata bagi kemajuan murid dan mutu pendidikan sekolah.`
    ),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 300, after: 600 },
      children: [
        new TextRun({
          text: `${kota}, Juli ${tahun}\n\nTim Penyusun`,
          font: FONT_NAME,
          size: SIZE_BODY,
        }),
      ],
    })
  );

  // =========================================================================
  // 4. DAFTAR ISI
  // =========================================================================
  children.push(createPageBreak());

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 240 },
      children: [
        new TextRun({
          text: 'DAFTAR ISI',
          bold: true,
          font: FONT_NAME,
          size: SIZE_BAB_HEADER,
        }),
      ],
    })
  );

  const daftarIsiItems = [
    { text: 'HALAMAN COVER', page: 'i' },
    { text: 'LEMBAR PENGESAHAN', page: 'ii' },
    { text: 'KATA PENGANTAR', page: 'iii' },
    { text: 'DAFTAR ISI', page: 'iv' },
    { text: 'BAB I PENDAHULUAN', page: '1', bold: true },
    { text: '    A. Latar Belakang', page: '1' },
    { text: '    B. Dasar Hukum', page: '2' },
    { text: '    C. Tujuan Program', page: '3' },
    { text: '    D. Sasaran dan Ruang Lingkup', page: '3' },
    { text: '    E. Manfaat Program', page: '4' },
    { text: 'BAB II KAJIAN KONSEPTUAL DAN LANDASAN TEORITIS', page: '5', bold: true },
    { text: 'BAB III RENCANA PROGRAM DAN STRATEGI PELAKSANAAN', page: '7', bold: true },
    { text: '    A. Rincian Kegiatan dan Aksi Nyata', page: '7' },
    { text: '    B. Struktur Organisasi dan Tim Pelaksana', page: '9' },
    { text: '    C. Matriks Rencana Aksi (Action Plan 12 Bulan)', page: '10' },
    { text: '    D. Dukungan Sarana, Prasarana, dan Anggaran', page: '11' },
    { text: 'BAB IV MONITORING, EVALUASI, DAN TINDAK LANJUT', page: '12', bold: true },
    { text: '    A. Mekanisme Pemantauan Program', page: '12' },
    { text: '    B. Indikator Ketercapaian', page: '13' },
    { text: '    C. Sistem Evaluasi dan Refleksi', page: '13' },
    { text: '    D. Tindak Lanjut dan Sistem Apresiasi', page: '14' },
    { text: 'BAB V PENUTUP', page: '15', bold: true },
    { text: '    A. Kesimpulan', page: '15' },
    { text: '    B. Saran dan Rekomendasi', page: '15' },
    { text: 'LAMPIRAN-LAMPIRAN', page: '16', bold: true },
    { text: '    Lampiran 1: Surat Keputusan (SK) Tim Pelaksana', page: '16' },
    { text: '    Lampiran 2: Matriks Rencana Aksi 12 Bulan Terinci', page: '17' },
    { text: '    Lampiran 3: Instrumen Evaluasi & Format Jurnal Siswa', page: '18' },
  ];

  daftarIsiItems.forEach(item => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 40, after: 40, line: 300 },
        children: [
          new TextRun({
            text: item.text,
            bold: !!item.bold,
            font: FONT_NAME,
            size: SIZE_BODY,
          }),
        ],
      })
    );
  });

  // =========================================================================
  // 5. BAB I PENDAHULUAN
  // =========================================================================
  children.push(createPageBreak());
  children.push(...createBabHeader('I', 'PENDAHULUAN'));

  const b1 = data.bab_1_pendahuluan || ({} as any);

  children.push(createSubHeader('A', 'Latar Belakang'));
  toArray(b1.latar_belakang).forEach(p => {
    children.push(createBodyParagraph(p));
  });

  children.push(createSubHeader('B', 'Dasar Hukum'));
  const dasarHukumList = Array.isArray(b1.dasar_hukum) ? b1.dasar_hukum : [];
  dasarHukumList.forEach((dh, idx) => {
    children.push(createListItem(`${idx + 1}.`, dh));
  });

  children.push(createSubHeader('C', 'Tujuan Program'));
  const tujuanList = Array.isArray(b1.tujuan) ? b1.tujuan : [];
  tujuanList.forEach((tj, idx) => {
    children.push(createListItem(`${idx + 1}.`, tj));
  });

  children.push(createSubHeader('D', 'Sasaran dan Ruang Lingkup'));
  toArray(b1.sasaran).forEach(ss => {
    children.push(createBodyParagraph(ss));
  });

  children.push(createSubHeader('E', 'Manfaat Program'));
  const manfaatList = Array.isArray(b1.manfaat) ? b1.manfaat : [];
  manfaatList.forEach((mf, idx) => {
    children.push(createListItem(`${idx + 1}.`, mf));
  });

  // =========================================================================
  // 6. BAB II KAJIAN KONSEPTUAL
  // =========================================================================
  children.push(createPageBreak());
  const b2 = data.bab_2_kajian_konseptual || ({} as any);
  const b2Title = b2.judul_bab || 'KAJIAN KONSEPTUAL DAN LANDASAN TEORITIS';
  children.push(...createBabHeader('II', b2Title));

  if (Array.isArray(b2.sub_bab) && b2.sub_bab.length > 0) {
    b2.sub_bab.forEach((sub, sIdx) => {
      const charCode = String.fromCharCode(65 + sIdx); // A, B, C...
      children.push(createSubHeader(charCode, sub.judul));
      toArray(sub.isi).forEach(p => {
        children.push(createBodyParagraph(p));
      });
    });
  } else {
    toArray(b2.isi).forEach(p => {
      children.push(createBodyParagraph(p));
    });
  }

  // =========================================================================
  // 7. BAB III RENCANA PROGRAM DAN MEKANISME PELAKSANAAN
  // =========================================================================
  children.push(createPageBreak());
  children.push(...createBabHeader('III', 'RENCANA PROGRAM DAN STRATEGI PELAKSANAAN'));

  const b3 = data.bab_3_rencana_program || ({} as any);

  children.push(createSubHeader('A', 'Rincian Kegiatan dan Aksi Nyata'));
  if (Array.isArray(b3.kegiatan) && b3.kegiatan.length > 0) {
    b3.kegiatan.forEach((kg, idx) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: `${idx + 1}. ${cleanMarkdownSymbols(kg.nama)}`,
              bold: true,
              font: FONT_NAME,
              size: SIZE_BODY,
            }),
          ],
        })
      );
      if (kg.deskripsi) children.push(createBodyParagraph(kg.deskripsi, true));
      if (Array.isArray(kg.tahapan) && kg.tahapan.length > 0) {
        kg.tahapan.forEach((th: string) => {
          children.push(createListItem('–', th));
        });
      }
      const details = [
        kg.tujuan ? `Tujuan: ${kg.tujuan}` : '',
        kg.waktu ? `Waktu Pelaksanaan: ${kg.waktu}` : '',
        kg.sasaran ? `Sasaran: ${kg.sasaran}` : '',
        kg.pic ? `Penanggung Jawab: ${kg.pic}` : '',
      ].filter(Boolean);
      details.forEach(d => children.push(createListItem('•', d)));
    });
  }

  children.push(createSubHeader('B', 'Struktur Organisasi dan Tim Pelaksana'));
  children.push(
    createBodyParagraph(
      'Guna menjamin kelancaran, akuntabilitas, dan kesinambungan program kerja, dibentuk tim pelaksana dengan pembagian tugas sebagai berikut:'
    )
  );

  const timList = Array.isArray(b3.tim_pelaksana) ? b3.tim_pelaksana : [];
  if (timList.length > 0) {
    const timHeaderRow = new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 27, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Jabatan dalam Tim', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nama / Pelaksana', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tugas Pokok & Tanggung Jawab', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
      ],
    });

    const timRows = timList.map((t, i) => new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(t.no || i + 1), font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 27, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: cleanMarkdownSymbols(t.jabatan), bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: cleanMarkdownSymbols(t.nama), font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: cleanMarkdownSymbols(t.tugas), font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
      ],
    }));

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borderLight,
        rows: [timHeaderRow, ...timRows],
      })
    );
  }

  children.push(createSubHeader('C', 'Matriks Rencana Aksi (Action Plan 12 Bulan)'));
  children.push(
    createBodyParagraph(
      'Matriks berikut merangkum jadwal distribusi implementasi program kerja sepanjang 12 bulan (Tahun Ajaran berjalan):'
    )
  );

  const actionList = Array.isArray(b3.action_plan) ? b3.action_plan : [];
  if (actionList.length > 0) {
    const monthHeaders = ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

    const actHeaderRow = new TableRow({
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: 16 })] })],
        }),
        new TableCell({
          width: { size: 34, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nama Kegiatan Program', bold: true, font: FONT_NAME, size: 16 })] })],
        }),
        ...monthHeaders.map(m => new TableCell({
          width: { size: 4, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: m, bold: true, font: FONT_NAME, size: 14 })] })],
        })),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PIC', bold: true, font: FONT_NAME, size: 16 })] })],
        }),
      ],
    });

    const actRows = actionList.map((a, i) => {
      const activeMonths = Array.isArray(a.bulan) ? a.bulan : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(a.no || i + 1), font: FONT_NAME, size: 16 })] })],
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: cleanMarkdownSymbols(a.kegiatan), font: FONT_NAME, size: 16 })] })],
          }),
          ...monthHeaders.map((_, mIdx) => {
            const isChecked = activeMonths.includes(mIdx + 1) || activeMonths.includes(mIdx + 7) || activeMonths.length === 12;
            return new TableCell({
              width: { size: 4, type: WidthType.PERCENTAGE },
              shading: isChecked ? { fill: 'E2E8F0', type: ShadingType.CLEAR } : undefined,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: isChecked ? '✓' : '', bold: true, font: FONT_NAME, size: 16 })],
                }),
              ],
            });
          }),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cleanMarkdownSymbols(a.pic || 'Tim'), font: FONT_NAME, size: 14 })] })],
          }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borderLight,
        rows: [actHeaderRow, ...actRows],
      })
    );
  }

  children.push(createSubHeader('D', 'Dukungan Sarana, Prasarana, dan Anggaran'));
  toArray(b3.sarana_anggaran).forEach(p => {
    children.push(createBodyParagraph(p));
  });

  // Tabel Anggaran / RAB Sederhana jika tersedia
  const anggaranList = Array.isArray(b3.tabel_anggaran) ? b3.tabel_anggaran : [];
  if (anggaranList.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: 'Tabel Estimasi Rencana Anggaran Biaya (RAB) Program:',
            bold: true,
            font: FONT_NAME,
            size: SIZE_BODY,
          }),
        ],
      })
    );

    const rabHeaderRow = new TableRow({
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Uraian Kebutuhan / Kegiatan', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Vol', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Satuan', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Estimasi Biaya', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sumber Dana', bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
        }),
      ],
    });

    let calculatedSum = 0;
    const rabRows = anggaranList.map((item, idx) => {
      if (item && item.total) {
        const n = parseInt(String(item.total).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(n)) calculatedSum += n;
      }
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.no || idx + 1), font: FONT_NAME, size: SIZE_TABLE })] })],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: cleanMarkdownSymbols(item.uraian), font: FONT_NAME, size: SIZE_TABLE })] })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.volume || '1'), font: FONT_NAME, size: SIZE_TABLE })] })],
          }),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.satuan || 'Paket'), font: FONT_NAME, size: SIZE_TABLE })] })],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(item.total || '-'), bold: true, font: FONT_NAME, size: SIZE_TABLE })] })],
          }),
          new TableCell({
            width: { size: 14, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.sumber || 'BOSP'), font: FONT_NAME, size: SIZE_TABLE })] })],
          }),
        ],
      });
    });

    const totalAnggaranDisplay = b3.total_anggaran || (calculatedSum > 0 ? `Rp ${calculatedSum.toLocaleString('id-ID')}` : '-');

    const rabTotalRow = new TableRow({
      children: [
        new TableCell({
          width: { size: 68, type: WidthType.PERCENTAGE },
          columnSpan: 4,
          shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'TOTAL ESTIMASI ANGGARAN:',
                  bold: true,
                  font: FONT_NAME,
                  size: SIZE_TABLE,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: totalAnggaranDisplay,
                  bold: true,
                  font: FONT_NAME,
                  size: SIZE_TABLE,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'BOSP / Swadaya',
                  font: FONT_NAME,
                  size: 14,
                }),
              ],
            }),
          ],
        }),
      ],
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borderLight,
        rows: [rabHeaderRow, ...rabRows, rabTotalRow],
      })
    );
  }

  // =========================================================================
  // 8. BAB IV MONITORING, EVALUASI, DAN TINDAK LANJUT
  // =========================================================================
  children.push(createPageBreak());
  children.push(...createBabHeader('IV', 'MONITORING, EVALUASI, DAN TINDAK LANJUT'));

  const b4 = data.bab_4_monitoring_evaluasi || ({} as any);

  children.push(createSubHeader('A', 'Mekanisme Pemantauan Program'));
  toArray(b4.mekanisme).forEach(p => {
    children.push(createBodyParagraph(p));
  });

  children.push(createSubHeader('B', 'Indikator Keberhasilan'));
  const indList = Array.isArray(b4.indikator) ? b4.indikator : [];
  indList.forEach((ind, idx) => {
    children.push(createListItem(`${idx + 1}.`, ind));
  });

  children.push(createSubHeader('C', 'Sistem Evaluasi dan Refleksi Berkala'));
  toArray(b4.evaluasi).forEach(p => {
    children.push(createBodyParagraph(p));
  });

  children.push(createSubHeader('D', 'Tindak Lanjut dan Sistem Apresiasi'));
  toArray(b4.tindak_lanjut).forEach(p => {
    children.push(createBodyParagraph(p));
  });

  // =========================================================================
  // 9. BAB V PENUTUP
  // =========================================================================
  children.push(createPageBreak());
  children.push(...createBabHeader('V', 'PENUTUP'));

  const b5 = data.bab_5_penutup || ({} as any);

  children.push(createSubHeader('A', 'Kesimpulan'));
  toArray(b5.kesimpulan).forEach(p => {
    children.push(createBodyParagraph(p));
  });

  children.push(createSubHeader('B', 'Saran dan Rekomendasi'));
  const saranList = Array.isArray(b5.saran) ? b5.saran : [];
  saranList.forEach((sr, idx) => {
    children.push(createListItem(`${idx + 1}.`, sr));
  });

  // =========================================================================
  // 10. LAMPIRAN-LAMPIRAN (SESUAI REQUEST USER: 1 DOCX YANG SAMA)
  // =========================================================================
  children.push(createPageBreak());
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: 'BAGIAN LAMPIRAN DOKUMEN',
          bold: true,
          font: FONT_NAME,
          size: SIZE_BAB_HEADER,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 300 },
      children: [
        new TextRun({
          text: 'INSTRUMEN OPERASIONAL, SK TIM, DAN JURNAL KEGIATAN',
          font: FONT_NAME,
          size: SIZE_SUBTITLE,
          color: '475569',
        }),
      ],
    })
  );

  // Lampiran 1: SK Tim Pelaksana (Universal)
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'LAMPIRAN 1: SURAT KEPUTUSAN (SK) TIM PELAKSANA PROGRAM',
          bold: true,
          font: FONT_NAME,
          size: SIZE_SUB_HEADER,
        }),
      ],
    }),
    createBodyParagraph(
      `SURAT KEPUTUSAN KEPALA ${meta.nama_sekolah || 'SEKOLAH'}\nNomor: 421.2/${tahun}/SK-PROG/01\nTENTANG\nPEMBENTUKAN TIM PELAKSANA ${(meta.judul_program || 'PROGRAM SEKOLAH').toUpperCase()}\nTAHUN AJARAN ${meta.tahun_ajaran || '2025/2026'}`
    ),
    createBodyParagraph(
      'Menimbang bahwa demi kelancaran, akuntabilitas, dan kesinambungan pelaksanaan program kerja di satuan pendidikan, maka dipandang perlu menetapkan susunan Tim Pelaksana melalui Keputusan Kepala Sekolah.'
    )
  );

  // Lampiran 2 & 3: Template-Specific Dynamic Attachments
  const dynamicLampiranElements = buildTemplateSpecificLampiran(meta.template_id || 'kokurikuler-p5', meta, tahun);
  children.push(...dynamicLampiranElements);

  // =========================================================================
  // Document Configuration: A4 Portrait, Standar Kedinasan (3-3-4-3 cm)
  // Margins in twips: 1 cm = 567 twips
  // Top: 3cm = 1701 twips
  // Bottom: 3cm = 1701 twips
  // Left: 4cm = 2268 twips
  // Right: 3cm = 1701 twips
  // =========================================================================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: 11906, // A4 Portrait width (210mm)
              height: 16838, // A4 Portrait height (297mm)
            },
            margin: {
              top: 1701,
              bottom: 1701,
              left: 2268,
              right: 1701,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

/**
 * Unduh Lembar Refleksi & Rubrik Saja (DOCX Terpisah untuk Murid & Fasilitator)
 * Berisi Lampiran 2 (Rubrik Asesmen) dan Lampiran 3 (Lembar Refleksi / Jurnal) siap cetak dan fotokopi.
 */
export async function generateProgramLampiranOnlyDocxBuffer(
  data: ProgramSekolahData
): Promise<Uint8Array> {
  const meta = data.metadata || ({} as any);
  const tahun = meta.tahun_ajaran ? meta.tahun_ajaran.split('/')[0] : '2025';
  const kota = meta.kota || 'Purwakarta';

  const children: (Paragraph | Table)[] = [];

  // Header Identitas Berkas Lampiran
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: sanitizeText((meta.nama_sekolah || 'SATUAN PENDIDIKAN').toUpperCase()),
          bold: true,
          font: FONT_NAME,
          size: SIZE_BAB_HEADER,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: 'INSTRUMEN ASESMEN AUTENTIK & LEMBAR REFLEKSI DIRI MURID',
          bold: true,
          font: FONT_NAME,
          size: SIZE_SUB_HEADER,
          color: '1E293B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: sanitizeText(`${meta.judul_program || 'Program Sekolah'} - Tahun Ajaran ${meta.tahun_ajaran || '2025/2026'}`),
          italics: true,
          font: FONT_NAME,
          size: SIZE_BODY,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 12,
          color: '94A3B8',
        },
      },
    })
  );

  // Lampiran 2 & 3: Template-Specific Dynamic Attachments
  const dynamicLampiranElements = buildTemplateSpecificLampiran(meta.template_id || 'kokurikuler-p5', meta, tahun);
  children.push(...dynamicLampiranElements);

  // Kolom Tanda Tangan & Paraf (3 Kolom: Orang Tua, Murid, Guru / Fasilitator)
  const ttdBorder = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  children.push(
    new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: `${kota}, .................................... ${tahun}`,
          font: FONT_NAME,
          size: SIZE_BODY,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: ttdBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Mengetahui,\nOrang Tua / Wali Murid', font: FONT_NAME, size: SIZE_BODY })],
                }),
                new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '( ........................................ )', font: FONT_NAME, size: SIZE_BODY })] }),
              ],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Murid yang Bersangkutan', font: FONT_NAME, size: SIZE_BODY })],
                }),
                new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '( ........................................ )', font: FONT_NAME, size: SIZE_BODY })] }),
              ],
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Guru / Fasilitator Pendamping', font: FONT_NAME, size: SIZE_BODY })],
                }),
                new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `( ${meta.penyusun || '........................................'} )`, bold: true, font: FONT_NAME, size: SIZE_BODY })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: meta.nip_penyusun ? `NIP. ${meta.nip_penyusun}` : '', font: FONT_NAME, size: SIZE_BODY })] }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 1701,
              bottom: 1701,
              left: 2268,
              right: 1701,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
