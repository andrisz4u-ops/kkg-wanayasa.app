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
  ImageRun,
  VerticalAlign,
  ShadingType,
  PageOrientation,
} from 'docx';
import { sanitizeText } from './helpers';

export interface AnalisisCpSubItem {
  kode_tp: string;
  materi_pokok: string;
  tp: string;
  atp: string;
}

export interface AnalisisCpBab {
  no: number;
  bab: string;
  cp: string;
  materi_list?: string[];
  items: AnalisisCpSubItem[];
}

export interface AnalisisCpSemester {
  semester: number;
  semester_label: string;
  babs: AnalisisCpBab[];
}

export interface AnalisisCpDocxInput {
  metadata: {
    satuan_pendidikan: string;
    mata_pelajaran: string;
    fase: string;
    kelas: string;
    fase_kelas?: string;
    tahun_pembelajaran: string;
    kepala_sekolah?: string;
    nip_kepala_sekolah?: string;
    guru?: string;
    nip_guru?: string;
    kop_surat_url?: string;
    sumber_buku?: string;
  };
  semesters: AnalisisCpSemester[];
}

export async function generateAnalisisCpDocxBuffer(data: AnalisisCpDocxInput): Promise<Uint8Array> {
  const { metadata, semesters } = data;
  const kopSuratContent: (Paragraph | Table)[] = [];

  if (metadata.kop_surat_url) {
    try {
      const resp = await fetch(metadata.kop_surat_url);
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        const arrBuf = await resp.arrayBuffer();
        if (arrBuf.byteLength > 100) {
          const isJpg = contentType.includes('jpeg') || contentType.includes('jpg') || metadata.kop_surat_url.includes('jpg');
          kopSuratContent.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new ImageRun({
                data: arrBuf,
                transformation: { width: 850, height: 130 },
                type: isJpg ? 'jpg' : 'png',
              })
            ]
          }));
          kopSuratContent.push(new Paragraph({
            spacing: { after: 140 },
            border: {
              bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000', space: 2 }
            }
          }));
        }
      }
    } catch (e) {
      console.warn('Could not load KOP image in Analisis CP DOCX:', e);
    }
  }

  // Document Title
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 160 },
    children: [
      new TextRun({
        text: 'ANALISIS CP, TP, DAN ATP',
        bold: true,
        size: 26, // 13pt
        font: 'Times New Roman'
      })
    ]
  });

  const faseKelasStr = metadata.fase_kelas || `${metadata.fase || 'C'}/${metadata.kelas || '5'}`;

  // Metadata Table (Identitas Dokumen)
  const metaRows = [
    ['SATUAN PENDIDIKAN', `: ${metadata.satuan_pendidikan || '-'}`],
    ['MATA PELAJARAN', `: ${metadata.mata_pelajaran || '-'}`],
    ['FASE/KELAS', `: ${faseKelasStr}`],
    ['TAHUN PEMBELAJARAN', `: ${metadata.tahun_pembelajaran || '-'}`],
  ];

  const metaTable = new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: metaRows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: label, bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: value, bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        })
      ]
    }))
  });

  // Main Analysis Table
  const borderRegular = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = {
    top: borderRegular,
    bottom: borderRegular,
    left: borderRegular,
    right: borderRegular,
    insideHorizontal: borderRegular,
    insideVertical: borderRegular,
  };

  // Table Column Header (7 columns, matching Contoh hasil Analisis CP)
  const headerCells = [
    { text: 'No', width: 4 },
    { text: 'BAB', width: 15 },
    { text: 'CP (Capaian Pembelajaran)', width: 22 },
    { text: 'Materi Pokok', width: 17 },
    { text: 'Kode TP', width: 7 },
    { text: 'TP (Tujuan Pembelajaran)', width: 17 },
    { text: 'ATP (Alur Tujuan Pembelajaran)', width: 18 },
  ].map(col => new TableCell({
    width: { size: col.width, type: WidthType.PERCENTAGE },
    shading: { fill: 'D9D2E9', type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: col.text, bold: true, size: 19, font: 'Times New Roman' })]
      })
    ]
  }));

  const tableRows: TableRow[] = [
    new TableRow({ children: headerCells, tableHeader: true })
  ];

  // Process Semesters and BABs
  semesters.forEach(sem => {
    // Semester Header Bar
    tableRows.push(new TableRow({
      children: [
        new TableCell({
          columnSpan: 7,
          shading: { fill: 'EAE6F3', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: sem.semester_label || `SEMESTER ${sem.semester}`, bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        })
      ]
    }));

    // BAB Rows
    sem.babs.forEach(bab => {
      const items = bab.items && bab.items.length > 0 ? bab.items : [{
        kode_tp: `${metadata.kelas || '5'}.${bab.no}`,
        materi_pokok: (bab.materi_list || []).join('\n') || bab.bab,
        tp: 'Menyelesaikan pembelajaran pada topik ini.',
        atp: 'Peserta didik mempelajari materi ini melalui kegiatan terpadu.'
      }];

      // Format Materi Pokok as numbered list if multiple
      const materiDisplay = (bab.materi_list && bab.materi_list.length > 0)
        ? bab.materi_list.map((m, idx) => m.match(/^\d+[\.\)]/) ? m : `${idx + 1}. ${m}`).join('\n')
        : (items[0]?.materi_pokok || '-');

      items.forEach((item, itemIdx) => {
        const isFirstItem = itemIdx === 0;
        const rowSpanCount = items.length;

        const cells: TableCell[] = [];

        if (isFirstItem) {
          // No
          cells.push(new TableCell({
            width: { size: 4, type: WidthType.PERCENTAGE },
            rowSpan: rowSpanCount,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: String(bab.no), size: 18, font: 'Times New Roman' })]
              })
            ]
          }));

          // BAB
          cells.push(new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            rowSpan: rowSpanCount,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: sanitizeText(bab.bab), bold: true, size: 18, font: 'Times New Roman' })]
              })
            ]
          }));

          // CP
          cells.push(new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            rowSpan: rowSpanCount,
            verticalAlign: VerticalAlign.TOP,
            children: sanitizeText(bab.cp).split('\n').map(pText => new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: pText, size: 18, font: 'Times New Roman' })]
            }))
          }));
        }

        // Materi Pokok (Per sub-item baris, selaras dengan Kode TP, TP, dan ATP)
        const itemMateri = item.materi_pokok || (bab.materi_list && bab.materi_list[itemIdx]) || '-';
        cells.push(new TableCell({
          width: { size: 17, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          children: sanitizeText(itemMateri).split('\n').map(mText => new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: mText, size: 18, font: 'Times New Roman' })]
          }))
        }));

        // Sub-Item Columns (Kode TP, TP, ATP)
        cells.push(new TableCell({
          width: { size: 7, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: sanitizeText(item.kode_tp), size: 18, font: 'Times New Roman' })]
            })
          ]
        }));

        cells.push(new TableCell({
          width: { size: 17, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: sanitizeText(item.tp), size: 18, font: 'Times New Roman' })]
            })
          ]
        }));

        cells.push(new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: sanitizeText(item.atp), size: 18, font: 'Times New Roman' })]
            })
          ]
        }));

        tableRows.push(new TableRow({ children: cells }));
      });
    });
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: tableRows
  });

  // Lembar Pengesahan / Tanda Tangan
  const ksName = metadata.kepala_sekolah || '...........................................';
  const ksNip = metadata.nip_kepala_sekolah ? `NIP. ${metadata.nip_kepala_sekolah}` : 'NIP. .....................................';
  const guruName = metadata.guru || '...........................................';
  const guruNip = metadata.nip_guru ? `NIP. ${metadata.nip_guru}` : 'NIP. .....................................';

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Mengetahui,\nKepala Sekolah', size: 20, font: 'Times New Roman' })
                ]
              }),
              new Paragraph({ text: '', spacing: { before: 700 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: ksName, bold: true, underline: {}, size: 20, font: 'Times New Roman' }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: ksNip, size: 18, font: 'Times New Roman' })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Guru Mata Pelajaran / Kelas,`, size: 20, font: 'Times New Roman' })
                ]
              }),
              new Paragraph({ text: '', spacing: { before: 700 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: guruName, bold: true, underline: {}, size: 20, font: 'Times New Roman' }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: guruNip, size: 18, font: 'Times New Roman' })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            orientation: PageOrientation.LANDSCAPE,
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            }
          }
        },
        children: [
          ...kopSuratContent,
          titleParagraph,
          metaTable,
          new Paragraph({ text: '', spacing: { after: 120 } }),
          mainTable,
          new Paragraph({ text: '', spacing: { before: 240, after: 120 } }),
          signatureTable
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
