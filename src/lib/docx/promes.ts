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
import type { AnalisisCpDocxInput } from './analisis-cp';
import { getAlokasiWaktuResmi } from '../alokasi-waktu';

export async function generatePromesDocxBuffer(data: AnalisisCpDocxInput, targetSemesterNum?: number): Promise<Uint8Array> {
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
      console.warn('Could not load KOP image in Promes DOCX:', e);
    }
  }

  // Filter semester if requested, or process all semesters
  const activeSemesters = targetSemesterNum
    ? semesters.filter(s => s.semester === targetSemesterNum)
    : semesters;

  const docSections: any[] = [];

  for (const sem of activeSemesters) {
    const isSem1 = sem.semester === 1;
    const months = isSem1
      ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

    // Title
    const titleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: 'PROGRAM SEMESTER (PROMES) DEEP LEARNING',
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
          text: `KURIKULUM MERDEKA - SEMESTER ${sem.semester} (${isSem1 ? 'GANJIL' : 'GENAP'})`,
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

    // Extract CP narrative from first bab if available
    const firstCp = sem.babs?.[0]?.cp || '';
    const cpSection: Paragraph[] = [];
    if (firstCp) {
      cpSection.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [new TextRun({ text: 'A. Capaian Pembelajaran (CP):', bold: true, size: 20, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: sanitizeText(firstCp), size: 19, font: 'Times New Roman' })]
        })
      );
    }

    // Column Widths: ATP (35%), Alokasi (8%), 30 weeks (57% / 30 = ~1.9% each)
    const WIDTH_ATP = 4800;
    const WIDTH_AW = 1100;
    const WIDTH_WEEK = 300; // 300 dxa * 30 = 9000 dxa

    // Header Row 1: ATP | Alokasi Waktu | Month 1 (colSpan 5) ... Month 6 (colSpan 5)
    const headerRow1Cells: TableCell[] = [
      new TableCell({
        rowSpan: 2,
        width: { size: WIDTH_ATP, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Alur dan Tujuan Pembelajaran', bold: true, size: 19, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        rowSpan: 2,
        width: { size: WIDTH_AW, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Alokasi Waktu', bold: true, size: 18, font: 'Times New Roman' })]
          })
        ]
      }),
    ];

    months.forEach(m => {
      headerRow1Cells.push(
        new TableCell({
          columnSpan: 5,
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: m, bold: true, size: 19, font: 'Times New Roman' })]
            })
          ]
        })
      );
    });

    // Header Row 2: Weeks 1..5 for each of the 6 months
    const headerRow2Cells: TableCell[] = [];
    for (let m = 0; m < 6; m++) {
      for (let w = 1; w <= 5; w++) {
        headerRow2Cells.push(
          new TableCell({
            width: { size: WIDTH_WEEK, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(w), bold: true, size: 16, font: 'Times New Roman' })]
              })
            ]
          })
        );
      }
    }

    const tableRows: TableRow[] = [
      new TableRow({ tableHeader: true, children: headerRow1Cells }),
      new TableRow({ tableHeader: true, children: headerRow2Cells }),
    ];

    const quota = getAlokasiWaktuResmi(metadata.mata_pelajaran || '', metadata.kelas || '5');
    const jpPerMinggu = quota.jpPerMinggu || 2;

    // Minggu Efektif KBM (18-20 pekan):
    // Masuk sekolah pertama 13 Juli 2026 (Minggu ke-3 Juli):
    const activeKbmWeeks = isSem1
      ? [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    // Kumpulkan seluruh item semester untuk alokasi waterfall presisi
    const allSemesterItems: { item: any; bab: any }[] = [];
    for (const b of sem.babs) {
      const items = b.items && b.items.length > 0 ? b.items : [
        { kode_tp: '', materi_pokok: '', tp: '', atp: b.bab, alokasi_waktu: `${jpPerMinggu} JP` }
      ];
      for (const it of items) {
        allSemesterItems.push({ item: it, bab: b });
      }
    }

    const itemWeekAllocations = new Map<number, Record<number, number>>();
    let kbmIdx = 0;
    let weekRemainingJp = jpPerMinggu;

    allSemesterItems.forEach((si, rowIdx) => {
      const rawJp = si.item.alokasi_waktu || si.item.jp || `${jpPerMinggu} JP`;
      let neededJp = parseInt(String(rawJp).replace(/\D/g, '')) || jpPerMinggu;

      while (neededJp > 0 && kbmIdx < activeKbmWeeks.length) {
        const currentWeek = activeKbmWeeks[kbmIdx];
        const canTake = Math.min(neededJp, weekRemainingJp);

        if (canTake > 0) {
          if (!itemWeekAllocations.has(rowIdx)) {
            itemWeekAllocations.set(rowIdx, {});
          }
          const rowAlloc = itemWeekAllocations.get(rowIdx)!;
          rowAlloc[currentWeek] = (rowAlloc[currentWeek] || 0) + canTake;

          neededJp -= canTake;
          weekRemainingJp -= canTake;
        }

        if (weekRemainingJp === 0) {
          kbmIdx++;
          weekRemainingJp = jpPerMinggu;
        }
      }
    });

    let globalItemIdx = 0;

    for (const b of sem.babs) {
      // Bab header spanning all 32 columns
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 32,
              shading: { type: ShadingType.CLEAR, fill: 'EEF2F6' },
              children: [
                new Paragraph({
                  spacing: { before: 50, after: 50 },
                  children: [new TextRun({ text: sanitizeText(b.bab), bold: true, size: 19, font: 'Times New Roman' })]
                })
              ]
            })
          ]
        })
      );

      const items = b.items && b.items.length > 0 ? b.items : [
        { kode_tp: '', materi_pokok: '', tp: '', atp: b.bab, alokasi_waktu: `${jpPerMinggu} JP` }
      ];

      items.forEach((item: any) => {
        const rawJp = item.alokasi_waktu || item.jp || `${jpPerMinggu} JP`;
        const rowCells: TableCell[] = [
          new TableCell({
            width: { size: WIDTH_ATP, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: sanitizeText(item.atp || item.tp || '-'), size: 18, font: 'Times New Roman' })]
              })
            ]
          }),
          new TableCell({
            width: { size: WIDTH_AW, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: sanitizeText(rawJp), size: 18, font: 'Times New Roman' })]
              })
            ]
          }),
        ];

        const rowAlloc = itemWeekAllocations.get(globalItemIdx) || {};
        globalItemIdx++;

        for (let w = 1; w <= 30; w++) {
          const allocJp = rowAlloc[w];
          rowCells.push(
            new TableCell({
              width: { size: WIDTH_WEEK, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              shading: allocJp ? { type: ShadingType.CLEAR, fill: 'E0E7FF' } : undefined,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: allocJp ? String(allocJp) : '',
                      bold: true,
                      size: 17,
                      font: 'Times New Roman'
                    })
                  ]
                })
              ]
            })
          );
        }

        tableRows.push(new TableRow({ children: rowCells }));
      });
    }

    // Agenda Rows
    const createAgendaRow = (title: string, checkFn: (w: number) => string | null, fillHex: string) => {
      const cells: TableCell[] = [
        new TableCell({
          columnSpan: 2,
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
          children: [
            new Paragraph({
              spacing: { before: 30, after: 30 },
              children: [new TextRun({ text: title, bold: true, size: 17, font: 'Times New Roman' })]
            })
          ]
        })
      ];
      for (let w = 1; w <= 30; w++) {
        const textVal = checkFn(w);
        cells.push(
          new TableCell({
            width: { size: WIDTH_WEEK, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            shading: textVal ? { type: ShadingType.CLEAR, fill: fillHex } : undefined,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: textVal || '',
                    bold: true,
                    size: 15,
                    font: 'Times New Roman'
                  })
                ]
              })
            ]
          })
        );
      }
      return new TableRow({ children: cells });
    };

    if (isSem1) {
      tableRows.push(createAgendaRow('Masa Pengenalan Lingkungan Sekolah (MPLS)', (w) => w === 3 ? 'MPLS' : null, 'BAE6FD'));
    }
    tableRows.push(createAgendaRow('Sumatif Tengah Semester (STS)', (w) => (w === 13 || w === 14) ? 'STS' : null, 'FEF08A'));
    tableRows.push(createAgendaRow('Sumatif Akhir Semester (SAS / ASAT)', (w) => (w === 26 || w === 27) ? 'SAS' : null, 'E9D5FF'));
    tableRows.push(createAgendaRow('Pengolahan Nilai & Pembagian Rapor', (w) => w === 28 ? 'RPT' : null, 'CCFBF1'));
    tableRows.push(createAgendaRow('Libur Akhir Semester', (w) => ((isSem1 && (w === 1 || w === 2)) || w >= 29) ? 'LBR' : null, 'CBD5E1'));

    const mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    });

    // Signature Block
    const sigTable = new Table({
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
                  spacing: { before: 200, after: 40 },
                  children: [new TextRun({ text: 'Mengetahui,', size: 20, font: 'Times New Roman' })]
                }),
                new Paragraph({
                  spacing: { after: 600 },
                  children: [new TextRun({ text: 'Kepala Sekolah', bold: true, size: 20, font: 'Times New Roman' })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: metadata.kepala_sekolah || '..........................................', bold: true, underline: {}, size: 20, font: 'Times New Roman' })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `NIP. ${metadata.nip_kepala_sekolah || '................................'}`, size: 19, font: 'Times New Roman' })]
                }),
              ]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 200, after: 40 },
                  children: [new TextRun({ text: `Purwakarta, ......................... 20..`, size: 20, font: 'Times New Roman' })]
                }),
                new Paragraph({
                  spacing: { after: 600 },
                  children: [new TextRun({ text: 'Guru Mata Pelajaran', bold: true, size: 20, font: 'Times New Roman' })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: metadata.guru || '..........................................', bold: true, underline: {}, size: 20, font: 'Times New Roman' })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `NIP. ${metadata.nip_guru || '................................'}`, size: 19, font: 'Times New Roman' })]
                }),
              ]
            }),
          ]
        })
      ]
    });

    const notesParagraphs = [
      new Paragraph({
        spacing: { before: 80, after: 20 },
        children: [
          new TextRun({ text: `Keterangan Alokasi Waktu (Permendikdasmen No. 13 Tahun 2025):`, bold: true, size: 17, font: 'Times New Roman' }),
        ]
      }),
      new Paragraph({
        spacing: { before: 10, after: 10 },
        children: [
          new TextRun({ text: `• Intrakurikuler Semester ${sem.semester}: ${quota.intrakurikulerPerSemester} JP (${quota.jpPerMinggu} JP/minggu, ${quota.mingguPerSemester} pekan efektif)`, size: 17, font: 'Times New Roman' }),
        ]
      }),
      new Paragraph({
        spacing: { before: 10, after: 60 },
        children: [
          new TextRun({ text: `• Alokasi Kokurikuler: ${quota.kokurikulerPerTahun} JP/tahun (Pembelajaran Kolaboratif Lintas Disiplin / 7 Kebiasaan Anak Indonesia Hebat)`, size: 17, font: 'Times New Roman' }),
        ]
      }),
    ];

    docSections.push({
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: 16838,
            height: 11906,
          },
          margin: { top: 900, bottom: 900, left: 900, right: 900 }
        }
      },
      children: [
        ...kopSuratContent,
        titleParagraph,
        subtitleParagraph,
        metaTable,
        ...cpSection,
        new Paragraph({ spacing: { after: 120 } }),
        mainTable,
        ...notesParagraphs,
        new Paragraph({ spacing: { after: 140 } }),
        sigTable,
      ]
    });
  }

  const doc = new Document({ sections: docSections });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
