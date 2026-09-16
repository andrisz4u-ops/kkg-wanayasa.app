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
import { sanitizeText, generateKopSuratDocx, createSignatureTable, getKaldikTitimangsa } from './helpers';
import type { AnalisisCpDocxInput } from './analisis-cp';
import { getAlokasiWaktuResmi } from '../alokasi-waktu';
import { calculateRpe, KALDIK_PURWAKARTA_2026_2027 } from '../kaldik-purwakarta';

export async function generateRpeDocxBuffer(data: AnalisisCpDocxInput, targetSemesterNum?: number): Promise<Uint8Array> {
  const { metadata } = data;
  const kopSuratContent = await generateKopSuratDocx(metadata.kop_surat_url, false);



  const quota = getAlokasiWaktuResmi(metadata.mata_pelajaran || '', metadata.kelas || '5');
  const jpPerMinggu = quota.jpPerMinggu || 2;
  const jenjangKelas = metadata.kelas || '5';
  const faseKelasStr = metadata.fase_kelas || `Fase ${metadata.fase || 'C'}, Kelas ${metadata.kelas || '5'}`;

  const semestersToProcess = targetSemesterNum
    ? [targetSemesterNum]
    : [1, 2];

  const sections: any[] = [];

  for (const semNum of semestersToProcess) {
    const rpeData = calculateRpe(semNum, jpPerMinggu, jenjangKelas);
    const isSem1 = semNum === 1;

    // Document Title
    const titleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({
          text: 'RINCIAN PEKAN EFEKTIF (RPE)',
          bold: true,
          size: 26, // 13pt
          font: 'Times New Roman'
        })
      ]
    });

    const subtitleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: `TAHUN AJARAN ${rpeData.tahunAjaran} - SEMESTER ${semNum} (${isSem1 ? 'GANJIL' : 'GENAP'})`,
          bold: true,
          size: 22, // 11pt
          font: 'Times New Roman'
        })
      ]
    });

    const acuanParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `Acuan: ${KALDIK_PURWAKARTA_2026_2027.dasarHukum}`,
          italics: true,
          size: 18,
          font: 'Times New Roman',
          color: '475569'
        })
      ]
    });

    // Metadata Table
    const metaTable = new Table({
      width: { size: 90, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        ['Satuan Pendidikan', `: ${metadata.satuan_pendidikan || '-'}`],
        ['Mata Pelajaran', `: ${metadata.mata_pelajaran || '-'}`],
        ['Fase / Kelas', `: ${faseKelasStr}`],
        ['Tahun Pelajaran', `: ${metadata.tahun_pembelajaran || rpeData.tahunAjaran}`],
        ['Guru Pengampu', `: ${metadata.guru || '-'}`],
      ].map(([label, val]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { after: 30 },
                  children: [new TextRun({ text: label, bold: true, size: 20, font: 'Times New Roman' })]
                })
              ]
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { after: 30 },
                  children: [new TextRun({ text: val, size: 20, font: 'Times New Roman' })]
                })
              ]
            }),
          ]
        })
      )
    });

    // SECTION I: Perhitungan Pekan Kalender per Bulan
    const heading1 = new Paragraph({
      spacing: { before: 180, after: 60 },
      children: [
        new TextRun({
          text: 'I. Jumlah Pekan dalam Semester:',
          bold: true,
          size: 21,
          font: 'Times New Roman'
        })
      ]
    });

    const table1Rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('No', 800),
          createHeaderCell('Nama Bulan', 3000),
          createHeaderCell('Jumlah Pekan', 1600),
          createHeaderCell('Pekan Efektif', 1600),
          createHeaderCell('Tidak Efektif', 1600),
          createHeaderCell('Keterangan Agenda', 3000),
        ]
      })
    ];

    let sumTotalPekan = 0;
    let sumPekanEfektif = 0;
    let sumPekanTidakEfektif = 0;

    rpeData.bulanList.forEach((b, idx) => {
      sumTotalPekan += b.totalPekan;
      sumPekanEfektif += b.pekanEfektif;
      sumPekanTidakEfektif += b.pekanTidakEfektif;

      table1Rows.push(
        new TableRow({
          children: [
            createBodyCell(String(idx + 1), 800, AlignmentType.CENTER),
            createBodyCell(b.bulan, 3000),
            createBodyCell(String(b.totalPekan), 1600, AlignmentType.CENTER),
            createBodyCell(String(b.pekanEfektif), 1600, AlignmentType.CENTER, true),
            createBodyCell(String(b.pekanTidakEfektif), 1600, AlignmentType.CENTER),
            createBodyCell(b.keterangan || '-', 3000),
          ]
        })
      );
    });

    // Row Total
    table1Rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            width: { size: 3800, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 50, after: 50 },
                children: [new TextRun({ text: 'JUMLAH TOTAL', bold: true, size: 19, font: 'Times New Roman' })]
              })
            ]
          }),
          createBodyCell(String(sumTotalPekan), 1600, AlignmentType.CENTER, true, 'F1F5F9'),
          createBodyCell(String(sumPekanEfektif), 1600, AlignmentType.CENTER, true, 'DCFCE7'),
          createBodyCell(String(sumPekanTidakEfektif), 1600, AlignmentType.CENTER, true, 'FEE2E2'),
          createBodyCell('-', 3000, AlignmentType.CENTER, false, 'F1F5F9'),
        ]
      })
    );

    const table1 = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: table1Rows,
    });

    // SECTION II: Rincian Pekan Tidak Efektif
    const heading2 = new Paragraph({
      spacing: { before: 180, after: 60 },
      children: [
        new TextRun({
          text: 'II. Rincian Pekan Tidak Efektif (KBM < 3 Hari):',
          bold: true,
          size: 21,
          font: 'Times New Roman'
        })
      ]
    });

    const table2Rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('No', 800),
          createHeaderCell('Nama Kegiatan / Agenda Sekolah', 4000),
          createHeaderCell('Waktu Pelaksanaan', 3200),
          createHeaderCell('Jml Pekan', 1400),
          createHeaderCell('Keterangan', 2200),
        ]
      })
    ];

    let totalAgendaPekan = 0;
    rpeData.agendaTidakEfektif.forEach((ag, idx) => {
      totalAgendaPekan += ag.jumlahPekan;
      table2Rows.push(
        new TableRow({
          children: [
            createBodyCell(String(idx + 1), 800, AlignmentType.CENTER),
            createBodyCell(ag.kegiatan, 4000, AlignmentType.LEFT, true),
            createBodyCell(ag.tanggal, 3200),
            createBodyCell(`${ag.jumlahPekan} Pekan`, 1400, AlignmentType.CENTER),
            createBodyCell(ag.keterangan, 2200),
          ]
        })
      );
    });

    table2Rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            width: { size: 8000, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 50, after: 50 },
                children: [new TextRun({ text: 'TOTAL PEKAN TIDAK EFEKTIF', bold: true, size: 19, font: 'Times New Roman' })]
              })
            ]
          }),
          createBodyCell(`${totalAgendaPekan} Pekan`, 1400, AlignmentType.CENTER, true, 'FEE2E2'),
          createBodyCell('-', 2200, AlignmentType.CENTER, false, 'F1F5F9'),
        ]
      })
    );

    const table2 = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: table2Rows,
    });

    // SECTION III: Rekapitulasi Pekan Efektif
    const heading3 = new Paragraph({
      spacing: { before: 180, after: 60 },
      children: [
        new TextRun({
          text: 'III. Rekapitulasi Pekan Efektif Pembelajaran:',
          bold: true,
          size: 21,
          font: 'Times New Roman'
        })
      ]
    });

    const rekapParagraphs = [
      new Paragraph({
        spacing: { before: 40, after: 30 },
        children: [
          new TextRun({ text: `1. Jumlah Pekan Kalender Pendidikan : `, size: 20, font: 'Times New Roman' }),
          new TextRun({ text: `${rpeData.totalPekanKalender} Pekan`, bold: true, size: 20, font: 'Times New Roman' }),
        ]
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({ text: `2. Jumlah Pekan Tidak Efektif           : `, size: 20, font: 'Times New Roman' }),
          new TextRun({ text: `${rpeData.pekanTidakEfektif} Pekan`, bold: true, size: 20, font: 'Times New Roman' }),
        ]
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `3. Jumlah Pekan Efektif KBM (1 - 2)    : `, bold: true, size: 20, font: 'Times New Roman' }),
          new TextRun({ text: `${rpeData.pekanEfektif} PEKAN EFEKTIF`, bold: true, size: 21, font: 'Times New Roman', color: '15803D' }),
        ]
      }),
    ];

    // SECTION IV: Distribusi Alokasi Waktu Jam Pembelajaran
    const heading4 = new Paragraph({
      spacing: { before: 140, after: 60 },
      children: [
        new TextRun({
          text: 'IV. Distribusi Alokasi Waktu Jam Pelajaran (JP):',
          bold: true,
          size: 21,
          font: 'Times New Roman'
        })
      ]
    });

    const table4Rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('No', 800),
          createHeaderCell('Uraian Alokasi Waktu', 6400),
          createHeaderCell('Perhitungan', 2400),
          createHeaderCell('Jumlah JP', 2000),
        ]
      }),
      new TableRow({
        children: [
          createBodyCell('1', 800, AlignmentType.CENTER),
          createBodyCell('Jumlah Jam Pelajaran Efektif Tersedia (Intrakurikuler)', 6400, AlignmentType.LEFT, true),
          createBodyCell(`${rpeData.pekanEfektif} Pekan × ${rpeData.jpPerMinggu} JP`, 2400, AlignmentType.CENTER),
          createBodyCell(`${rpeData.totalJpTersedia} JP`, 2000, AlignmentType.CENTER, true, 'DCFCE7'),
        ]
      }),
      new TableRow({
        children: [
          createBodyCell('2', 800, AlignmentType.CENTER),
          createBodyCell('Alokasi Pembelajaran Tatap Muka (Materi Pokok & TP)', 6400),
          createBodyCell(`Sesuai Pemetaan Bab/TP`, 2400, AlignmentType.CENTER),
          createBodyCell(`${rpeData.jpTatapMuka} JP`, 2000, AlignmentType.CENTER, false),
        ]
      }),
      new TableRow({
        children: [
          createBodyCell('3', 800, AlignmentType.CENTER),
          createBodyCell('Alokasi Jam Cadangan (Asesmen Sumatif Lingkup Materi / Remedial / Pengayaan)', 6400),
          createBodyCell(`Cadangan ~10%`, 2400, AlignmentType.CENTER),
          createBodyCell(`${rpeData.jpCadangan} JP`, 2000, AlignmentType.CENTER, false),
        ]
      }),
    ];

    const table4 = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: table4Rows,
    });

    // Notes rule
    const noteRule = new Paragraph({
      spacing: { before: 120, after: 160 },
      children: [
        new TextRun({
          text: `* Catatan: Sesuai pedoman Dinas Pendidikan Kabupaten Purwakarta, minggu efektif adalah minggu yang memiliki minimal 3 hari KBM aktif. Alokasi waktu mengacu pada Permendikdasmen No. 13 Tahun 2025 (${rpeData.jpPerMinggu} JP/minggu).`,
          italics: true,
          size: 17,
          font: 'Times New Roman',
          color: '64748B'
        })
      ]
    });

    // Signature Block
    const titimangsaDate = getKaldikTitimangsa(metadata.tahun_pembelajaran || rpeData.tahunAjaran, isSem1 ? 1 : 2);
    const sigTable = createSignatureTable({
      kepalaSekolah: metadata.kepala_sekolah,
      nipKepalaSekolah: metadata.nip_kepala_sekolah,
      guru: metadata.guru,
      nipGuru: metadata.nip_guru,
      titimangsa: titimangsaDate,
      jabatanGuru: 'Guru Mata Pelajaran / Kelas'
    });

    sections.push({
      properties: {
        page: {
          size: {
            orientation: PageOrientation.PORTRAIT,
            width: 11906, // A4 Portrait width
            height: 16838, // A4 Portrait height
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
        acuanParagraph,
        metaTable,
        heading1,
        table1,
        heading2,
        table2,
        heading3,
        ...rekapParagraphs,
        heading4,
        table4,
        noteRule,
        sigTable
      ]
    });
  }

  const doc = new Document({ sections });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

function createHeaderCell(text: string, widthDxa: number): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: sanitizeText(text),
            bold: true,
            size: 19, // 9.5pt
            font: 'Times New Roman'
          })
        ]
      })
    ]
  });
}

function createBodyCell(
  text: string,
  widthDxa: number,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  isBold: boolean = false,
  fillHex?: string
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: fillHex ? { type: ShadingType.CLEAR, fill: fillHex } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: sanitizeText(text),
            bold: isBold,
            size: 18, // 9pt
            font: 'Times New Roman'
          })
        ]
      })
    ]
  });
}
