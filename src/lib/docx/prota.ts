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
import { getAlokasiWaktuResmi } from '../alokasi-waktu';

export async function generateProtaDocxBuffer(data: AnalisisCpDocxInput): Promise<Uint8Array> {
  const { metadata, semesters } = data;
  const kopSuratContent = await generateKopSuratDocx(metadata.kop_surat_url, true);



  // Document Title
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 80 },
    children: [
      new TextRun({
        text: 'PROGRAM TAHUNAN (PROTA)',
        bold: true,
        size: 26, // 13pt
        font: 'Times New Roman'
      })
    ]
  });

  const subtitleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [
      new TextRun({
        text: 'KURIKULUM MERDEKA',
        bold: true,
        size: 24, // 12pt
        font: 'Times New Roman'
      })
    ]
  });

  const faseKelasStr = metadata.fase_kelas || `Fase ${metadata.fase || 'C'}, Kelas ${metadata.kelas || '5'}`;

  // Metadata Table (Identitas Dokumen)
  const metaRows = [
    ['Mata Pelajaran', `: ${metadata.mata_pelajaran || '-'}`],
    ['Satuan Pendidikan', `: ${metadata.satuan_pendidikan || '-'}`],
    ['Nama Guru', `: ${metadata.guru || '-'}`],
    ['Tahun Pelajaran', `: ${metadata.tahun_pembelajaran || '-'}`],
    ['Fase / Kelas', `: ${faseKelasStr} / I (Ganjil) & II (Genap)`],
  ];

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
    rows: metaRows.map(([label, value]) =>
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

  // Table Column Widths (Total: 100% / Landscape A4 approx 14500 dxa)
  const COL_WIDTHS = [
    3200, // Bab (22%)
    5800, // Alur Tujuan Pembelajaran (40%)
    4000, // Materi (28%)
    1500, // Alokasi Waktu (10%)
  ];

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      createHeaderCell('Bab', COL_WIDTHS[0]),
      createHeaderCell('Alur Tujuan Pembelajaran', COL_WIDTHS[1]),
      createHeaderCell('Materi Pokok', COL_WIDTHS[2]),
      createHeaderCell('Alokasi Waktu', COL_WIDTHS[3]),
    ]
  });

  const tableRows: TableRow[] = [tableHeaderRow];
  let grandTotalJp = 0;

  for (const sem of semesters) {
    let semesterJp = 0;

    // Semester Section Divider
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, // Slate 200
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: `SEMESTER ${sem.semester} (${sem.semester === 1 ? 'GANJIL' : 'GENAP'})`,
                    bold: true,
                    size: 21,
                    font: 'Times New Roman'
                  })
                ]
              })
            ]
          })
        ]
      })
    );

    for (const b of sem.babs) {
      const items = b.items && b.items.length > 0 ? b.items : [
        { kode_tp: '', materi_pokok: b.materi_list?.[0] || '', tp: '', atp: '', alokasi_waktu: '2 JP' }
      ];

      items.forEach((item: any, idx: number) => {
        const isFirst = idx === 0;
        const rowSpan = isFirst ? items.length : 1;
        const rawJpStr = item.alokasi_waktu || item.jp || '2 JP';
        const jpNum = parseInt(String(rawJpStr).replace(/\D/g, '')) || 2;
        semesterJp += jpNum;

        const cells: TableCell[] = [];

        // 1. Bab Cell (Rowspan if multiple items)
        if (isFirst) {
          cells.push(
            new TableCell({
              width: { size: COL_WIDTHS[0], type: WidthType.DXA },
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

        // 2. Alur Tujuan Pembelajaran (ATP)
        cells.push(
          new TableCell({
            width: { size: COL_WIDTHS[1], type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: sanitizeText(item.atp || item.tp || '-'), size: 19, font: 'Times New Roman' })]
              })
            ]
          })
        );

        // 3. Materi Pokok
        cells.push(
          new TableCell({
            width: { size: COL_WIDTHS[2], type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: sanitizeText(item.materi_pokok || '-'), size: 19, font: 'Times New Roman' })]
              })
            ]
          })
        );

        // 4. Alokasi Waktu
        cells.push(
          new TableCell({
            width: { size: COL_WIDTHS[3], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: sanitizeText(rawJpStr), bold: true, size: 19, font: 'Times New Roman' })]
              })
            ]
          })
        );

        tableRows.push(new TableRow({ children: cells }));
      });
    }

    // Subtotal Row for Semester
    grandTotalJp += semesterJp;
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: `TOTAL JAM PELAJARAN SEMESTER ${sem.semester} :`,
                    bold: true,
                    size: 19,
                    font: 'Times New Roman'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: COL_WIDTHS[3], type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: `${semesterJp} JP`,
                    bold: true,
                    size: 20,
                    font: 'Times New Roman'
                  })
                ]
              })
            ]
          })
        ]
      })
    );
  }

  // Grand Total Row
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: 'TOTAL ALOKASI WAKTU 1 TAHUN AJARAN :',
                  bold: true,
                  size: 20,
                  font: 'Times New Roman'
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: COL_WIDTHS[3], type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: `${grandTotalJp} JP`,
                  bold: true,
                  size: 21,
                  font: 'Times New Roman'
                })
              ]
            })
          ]
        })
      ]
    })
  );

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

  const quota = getAlokasiWaktuResmi(metadata.mata_pelajaran || '', metadata.kelas || '5');
  const notesParagraphs = [
    new Paragraph({
      spacing: { before: 100, after: 30 },
      children: [
        new TextRun({ text: 'Keterangan Beban Belajar (Permendikdasmen No. 13 Tahun 2025):', bold: true, size: 18, font: 'Times New Roman' }),
      ]
    }),
    new Paragraph({
      spacing: { before: 10, after: 20 },
      children: [
        new TextRun({ text: `• Intrakurikuler: ${grandTotalJp} JP/tahun (${quota.jpPerMinggu} JP/minggu, ${quota.mingguPerTahun} pekan efektif)`, size: 18, font: 'Times New Roman' }),
      ]
    }),
    new Paragraph({
      spacing: { before: 10, after: 80 },
      children: [
        new TextRun({ text: `• Kokurikuler (Pembelajaran Kolaboratif Lintas Disiplin / 7 Kebiasaan Anak Indonesia Hebat): ${quota.kokurikulerPerTahun} JP/tahun`, size: 18, font: 'Times New Roman' }),
      ]
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 11906, // docx library swaps width & height when orientation is LANDSCAPE so w:w="16838" and w:h="11906"
              height: 16838,
            },
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            }
          }
        },
        children: [
          ...kopSuratContent,
          titleParagraph,
          subtitleParagraph,
          metaTable,
          new Paragraph({ spacing: { after: 120 } }),
          mainTable,
          ...notesParagraphs,
          new Paragraph({ spacing: { after: 140 } }),
          sigTable,
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

function createHeaderCell(text: string, widthDxa: number): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: sanitizeText(text),
            bold: true,
            size: 20, // 10pt
            font: 'Times New Roman'
          })
        ]
      })
    ]
  });
}
