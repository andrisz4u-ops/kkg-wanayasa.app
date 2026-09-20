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
import { calculateRpe } from '../kaldik-purwakarta';

export interface SemesterCpItem {
  element: string;
  cp: string;
  raw: string;
  babIndices: number[];
}

/**
 * Ekstraksi blok-blok Elemen dari teks CP (mendukung multi-elemen seperti [Pemahaman IPAS] dan [Keterampilan Proses])
 */
export function parseCpElementBlocks(rawCp: string): { element: string; content: string }[] {
  if (!rawCp || typeof rawCp !== 'string') return [];
  const text = rawCp.trim();
  if (!text) return [];

  const bracketRegex = /\[([^\]]+)\]\s*([\s\S]*?)(?=(?:\[[^\]]+\]|$))/g;
  const matches = [...text.matchAll(bracketRegex)];

  if (matches.length > 0) {
    return matches.map(m => ({
      element: m[1].replace(/^Elemen\s*:\s*/i, '').trim(),
      content: m[2].trim()
    })).filter(b => b.element || b.content);
  }

  const colonMatch = text.match(/^(Elemen\s*[^:\n]+|[^:\n]{3,35}):\s*([\s\S]*)$/is);
  if (colonMatch && !colonMatch[1].includes('http') && !colonMatch[1].toLowerCase().includes('contoh')) {
    return [{
      element: colonMatch[1].replace(/^Elemen\s*:\s*/i, '').trim(),
      content: colonMatch[2].trim()
    }];
  }

  return [{
    element: '',
    content: text
  }];
}

/**
 * Ekstraksi seluruh Capaian Pembelajaran (CP) dan Elemen unik yang diajarkan pada semester tertentu
 */
export function extractSemesterCpItems(sem: { babs?: any[] }): SemesterCpItem[] {
  const babs = sem?.babs || [];
  const items: SemesterCpItem[] = [];

  babs.forEach((bab, babIdx) => {
    const rawCp = (bab?.cp || '').trim();
    if (!rawCp) return;

    const blocks = parseCpElementBlocks(rawCp);
    blocks.forEach(b => {
      let element = (b.element || '').replace(/^Elemen\s*:?\s*/i, '').trim();
      let cpText = (b.content || '').trim();

      if (!element && !cpText) return;
      if (!element) {
        const titleMatch = (bab.bab || '').match(/\[(.*?)\]/);
        if (titleMatch) {
          element = titleMatch[1].replace(/^Elemen\s*:\s*/i, '').trim();
        }
      }

      element = element.replace(/^Elemen\s*:?\s*/i, '').trim();

      // Deduplikasi berdasarkan nama elemen (jika ada) atau kemiripan teks CP
      const existingIndex = items.findIndex(it => {
        if (element && it.element) {
          return it.element.toUpperCase() === element.toUpperCase();
        }
        return it.cp.toLowerCase().replace(/\s+/g, ' ') === cpText.toLowerCase().replace(/\s+/g, ' ');
      });

      if (existingIndex >= 0) {
        if (!items[existingIndex].babIndices.includes(babIdx)) {
          items[existingIndex].babIndices.push(babIdx);
        }
        if (cpText.length > items[existingIndex].cp.length) {
          items[existingIndex].cp = cpText;
          items[existingIndex].raw = element ? `[${element}] ${cpText}` : rawCp;
        }
      } else {
        items.push({
          element,
          cp: cpText || rawCp,
          raw: element ? `[${element}] ${cpText}` : rawCp,
          babIndices: [babIdx]
        });
      }
    });
  });

  if (items.length === 0) {
    items.push({
      element: '',
      cp: 'Memahami konsep dasar dan menerapkan kompetensi esensial pembelajaran sesuai standar kurikulum merdeka.',
      raw: 'Memahami konsep dasar dan menerapkan kompetensi esensial pembelajaran sesuai standar kurikulum merdeka.',
      babIndices: [0]
    });
  }

  return items;
}

export async function generatePromesDocxBuffer(data: AnalisisCpDocxInput, targetSemesterNum?: number): Promise<Uint8Array> {
  const { metadata, semesters } = data;
  const kopSuratContent = await generateKopSuratDocx(metadata.kop_surat_url, true);



  // Filter semester if requested, or process all semesters with content
  const activeSemesters = targetSemesterNum
    ? semesters.filter(s => s.semester === targetSemesterNum)
    : semesters.filter(s => (s.babs || []).length > 0);

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

    // Extract CP items for all unique elements in this semester
    const cpItems = extractSemesterCpItems(sem);
    const cpSection: Paragraph[] = [];
    if (cpItems.length > 0) {
      cpSection.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: 'A. Capaian Pembelajaran (CP) Resmi:', bold: true, size: 20, font: 'Times New Roman' })]
        })
      );

      cpItems.forEach((item, idx) => {
        const isLast = idx === cpItems.length - 1;
        if (item.element) {
          cpSection.push(
            new Paragraph({
              spacing: { before: idx > 0 ? 80 : 20, after: 20 },
              children: [
                new TextRun({
                  text: `[ELEMEN: ${item.element.toUpperCase()}]`,
                  bold: true,
                  size: 19,
                  font: 'Times New Roman'
                })
              ]
            })
          );
        }
        cpSection.push(
          new Paragraph({
            spacing: { after: isLast ? 120 : 60 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: sanitizeText(item.cp),
                size: 19,
                font: 'Times New Roman'
              })
            ]
          })
        );
      });
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
      new TableRow({ tableHeader: true, cantSplit: true, children: headerRow1Cells }),
      new TableRow({ tableHeader: true, cantSplit: true, children: headerRow2Cells }),
    ];

    const quota = getAlokasiWaktuResmi(metadata.mata_pelajaran || '', metadata.kelas || '5');
    const jpPerMinggu = quota.jpPerMinggu || 2;

    const jenjangKelas = metadata.kelas || '5';
    const isKelas6 = String(jenjangKelas).replace(/\D/g, '') === '6';
    const rpeData = calculateRpe(sem.semester, jpPerMinggu, jenjangKelas);
    const activeKbmWeeks = rpeData.activeKbmWeeks;

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
          cantSplit: true,
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
          const weekStatus = rpeData.weekStatusMap[w];
          const isNonKbm = weekStatus && !weekStatus.isKbm;

          rowCells.push(
            new TableCell({
              width: { size: WIDTH_WEEK, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              shading: allocJp
                ? { type: ShadingType.CLEAR, fill: 'E0E7FF' }
                : (isNonKbm ? { type: ShadingType.CLEAR, fill: 'F8FAFC' } : undefined),
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

        tableRows.push(new TableRow({ cantSplit: true, children: rowCells }));
      });
    }

    // Agenda Rows Resmi Kaldik Disdik Purwakarta
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
                    size: 14,
                    font: 'Times New Roman'
                  })
                ]
              })
            ]
          })
        );
      }
      return new TableRow({ cantSplit: true, children: cells });
    };

    if (isSem1) {
      tableRows.push(createAgendaRow('Masa Pengenalan Lingkungan Sekolah (MPLS)', (w) => w === 3 ? 'MPLS' : null, 'BAE6FD'));
      tableRows.push(createAgendaRow('Sumatif Tengah Semester (STS)', (w) => w === 15 ? 'STS' : null, 'FEF08A'));
      tableRows.push(createAgendaRow('Perkiraan Penilaian Sumatif Akhir Semester (SAS)', (w) => (w === 25 || w === 26 || w === 27) ? 'SAS' : null, 'E9D5FF'));
      tableRows.push(createAgendaRow('Pengolahan Nilai & Remedial / Classmeeting', (w) => w === 28 ? 'PENG' : null, 'CCFBF1'));
      tableRows.push(createAgendaRow('Pembagian Rapor Semester 1', (w) => w === 29 ? 'RPT' : null, '99F6E4'));
      tableRows.push(createAgendaRow('Libur Akhir Tahun Ajaran Lalu / Libur Semester 1', (w) => (w === 1 || w === 2 || w === 30) ? 'LBR' : null, 'CBD5E1'));
    } else {
      tableRows.push(createAgendaRow('Libur Semester 1 (1 - 8 Jan 2027)', (w) => w === 1 ? 'LBR' : null, 'CBD5E1'));
      tableRows.push(createAgendaRow('Prakiraan Libur Awal Ramadhan 1448 H', (w) => w === 7 ? 'LBR' : null, 'CBD5E1'));
      tableRows.push(createAgendaRow('Kegiatan Masantren di Sakola (Purwakarta)', (w) => (w === 8 || w === 9 || w === 11) ? 'SAN' : null, 'BBF7D0'));
      tableRows.push(createAgendaRow('Prakiraan Libur Idul Fitri 1448 H & Nyepi', (w) => w === 12 ? 'LBR' : null, 'CBD5E1'));
      if (isKelas6) {
        tableRows.push(createAgendaRow('Penilaian Sumatif Akhir Jenjang (PSAJ Kelas 6)', (w) => (w === 22 || w === 23) ? 'PSAJ' : null, 'FED7AA'));
      }
      tableRows.push(createAgendaRow('Perkiraan Penilaian Sumatif Akhir Tahun (ASAT)', (w) => (w === 26 || w === 27) ? 'ASAT' : null, 'E9D5FF'));
      tableRows.push(createAgendaRow('Pengolahan Nilai & Pembagian Rapor Semester 2', (w) => w === 28 ? 'RPT' : null, '99F6E4'));
      tableRows.push(createAgendaRow('Libur Akhir Tahun Ajaran 2026/2027', (w) => (w === 29 || w === 30) ? 'LBR' : null, 'CBD5E1'));
    }

    const mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    });

    // Signature Block
    const titimangsa = getKaldikTitimangsa(metadata.tahun_pembelajaran, isSem1 ? 1 : 2);
    const sigTable = createSignatureTable({
      kepalaSekolah: metadata.kepala_sekolah,
      nipKepalaSekolah: metadata.nip_kepala_sekolah,
      guru: metadata.guru,
      nipGuru: metadata.nip_guru,
      titimangsa,
      jabatanGuru: 'Guru Mata Pelajaran'
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
            width: 11906, // Note: docx library swaps width & height when orientation is LANDSCAPE so w:w="16838" and w:h="11906"
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
