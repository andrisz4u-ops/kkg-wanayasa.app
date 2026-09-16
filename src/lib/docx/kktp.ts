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
import { sanitizeText, generateKopSuratDocx, createSignatureTable } from './helpers';
import type { AnalisisCpDocxInput } from './analisis-cp';

export async function generateKktpDocxBuffer(data: AnalisisCpDocxInput, targetSemesterNum?: number): Promise<Uint8Array> {
  const { metadata, semesters } = data;
  const kopSuratContent = await generateKopSuratDocx(metadata.kop_surat_url, true);



  const activeSemesters = targetSemesterNum
    ? semesters.filter(s => s.semester === targetSemesterNum)
    : semesters;

  const docSections: any[] = [];

  for (const sem of activeSemesters) {
    // Title
    const titleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: 'KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)',
          bold: true,
          size: 26,
          font: 'Times New Roman'
        })
      ]
    });

    const subtitleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: `KURIKULUM MERDEKA - SEMESTER ${sem.semester} (${sem.semester === 1 ? 'GANJIL' : 'GENAP'})`,
          bold: true,
          size: 23,
          font: 'Times New Roman'
        })
      ]
    });

    const faseKelasStr = metadata.fase_kelas || `Fase ${metadata.fase || 'C'}, Kelas ${metadata.kelas || '5'}`;

    // Metadata Table
    const metaTable = new Table({
      width: { size: 65, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        ['Mata Pelajaran', `: ${metadata.mata_pelajaran || '-'}`],
        ['Satuan Pendidikan', `: ${metadata.satuan_pendidikan || '-'}`],
        ['Nama Guru', `: ${metadata.guru || '-'}`],
        ['Tahun Pelajaran', `: ${metadata.tahun_pembelajaran || '-'}`],
        ['Fase / Kelas / Semester', `: ${faseKelasStr} / ${sem.semester === 1 ? 'I (Ganjil)' : 'II (Genap)'}`],
      ].map(([label, value]) =>
        new TableRow({
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
                  children: [new TextRun({ text: value, size: 20, font: 'Times New Roman' })]
                })
              ]
            }),
          ]
        })
      )
    });

    // Column Widths (A4 Landscape ~14800 dxa)
    const COL_WIDTH_BAB = 3600;  // 24%
    const COL_WIDTH_ATP = 5600;  // 38%
    const COL_WIDTH_SCALE = 1400; // 9.5% each x 4 = 38%

    // Header Row 0: Bab | Alur Tujuan Pembelajaran | Skala atau Interval Nilai (colSpan 4)
    const headerRow0 = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          rowSpan: 3,
          width: { size: COL_WIDTH_BAB, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Bab', bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        }),
        new TableCell({
          rowSpan: 3,
          width: { size: COL_WIDTH_ATP, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Alur Tujuan Pembelajaran', bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        }),
        new TableCell({
          columnSpan: 4,
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Skala atau Interval Nilai', bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        }),
      ]
    });

    // Header Row 1: 0 - 40% | 41 - 65% | 66 - 85% | 86 - 100%
    const intervals = ['0 – 40%', '41 – 65%', '66 – 85%', '86 – 100%'];
    const headerRow1 = new TableRow({
      tableHeader: true,
      children: intervals.map(iv =>
        new TableCell({
          width: { size: COL_WIDTH_SCALE, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: iv, bold: true, size: 19, font: 'Times New Roman' })]
            })
          ]
        })
      )
    });

    // Header Row 2: Action Descriptions
    const actionDescs = [
      'Belum mencapai, remedial di seluruh bagian',
      'Belum mencapai ketuntasan, remedial di bagian yang diperlukan',
      'Sudah mencapai ketuntasan, tidak perlu remedial',
      'Sudah mencapai ketuntasan, perlu pengayaan'
    ];
    const headerRow2 = new TableRow({
      tableHeader: true,
      children: actionDescs.map(desc =>
        new TableCell({
          width: { size: COL_WIDTH_SCALE, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: desc, italic: true, size: 16, font: 'Times New Roman' })]
            })
          ]
        })
      )
    });

    const tableRows: TableRow[] = [headerRow0, headerRow1, headerRow2];

    for (const b of sem.babs) {
      const items = b.items && b.items.length > 0 ? b.items : [
        { kode_tp: '', materi_pokok: '', tp: '', atp: b.bab }
      ];

      items.forEach((item: any, idx: number) => {
        const isFirst = idx === 0;
        const rowSpan = isFirst ? items.length : 1;
        const cells: TableCell[] = [];

        // 1. Bab Cell
        if (isFirst) {
          cells.push(
            new TableCell({
              width: { size: COL_WIDTH_BAB, type: WidthType.DXA },
              rowSpan: rowSpan > 1 ? rowSpan : undefined,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [new TextRun({ text: sanitizeText(b.bab), bold: true, size: 19, font: 'Times New Roman' })]
                })
              ]
            })
          );
        }

        // 2. Alur Tujuan Pembelajaran
        cells.push(
          new TableCell({
            width: { size: COL_WIDTH_ATP, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: sanitizeText(item.atp || item.tp || '-'), size: 19, font: 'Times New Roman' })]
              })
            ]
          })
        );

        // 3. 4 Interval Cells (empty for teacher's assessment marks)
        for (let i = 0; i < 4; i++) {
          cells.push(
            new TableCell({
              width: { size: COL_WIDTH_SCALE, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '', size: 19, font: 'Times New Roman' })]
                })
              ]
            })
          );
        }

        tableRows.push(new TableRow({ children: cells }));
      });
    }

    const mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    });

    // Signature Block
    const sigTable = createSignatureTable({
      kepalaSekolah: metadata.kepala_sekolah,
      nipKepalaSekolah: metadata.nip_kepala_sekolah,
      guru: metadata.guru,
      nipGuru: metadata.nip_guru,
      titimangsa: 'Purwakarta, ......................... 20..',
      jabatanGuru: 'Guru Mata Pelajaran'
    });

    docSections.push({
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: 11906, // docx library internally swaps width & height when orientation is LANDSCAPE so w:w="16838" and w:h="11906"
            height: 16838,
          },
          margin: { top: 720, bottom: 720, left: 720, right: 720 }
        }
      },
      children: [
        ...kopSuratContent,
        titleParagraph,
        subtitleParagraph,
        metaTable,
        new Paragraph({ spacing: { after: 120 } }),
        mainTable,
        new Paragraph({ spacing: { after: 160 } }),
        sigTable,
      ]
    });
  }

  const doc = new Document({ sections: docSections });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
