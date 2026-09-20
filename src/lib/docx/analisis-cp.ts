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
  const kopSuratContent = await generateKopSuratDocx(metadata.kop_surat_url, true);

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
    { text: 'Elemen / Capaian Pembelajaran', width: 22 },
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
        atp: 'Murid mempelajari materi ini melalui kegiatan terpadu.'
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

          // Elemen / Capaian Pembelajaran
          const cpRaw = sanitizeText(bab.cp || '');
          let cpParagraphs: Paragraph[] = [];

          // Parse blocks matching [ElementName] Content (supports dual-elements e.g. [Pemahaman IPAS] and [Keterampilan Proses])
          const blockRegex = /\[([^\]]+)\]\s*([\s\S]*?)(?=(?:\[[^\]]+\]|$))/g;
          const matches = [...cpRaw.matchAll(blockRegex)];

          if (matches.length > 0) {
            matches.forEach((m, mIdx) => {
              const elName = m[1].replace(/^Elemen\s*:\s*/i, '').trim();
              const content = m[2].trim();

              cpParagraphs.push(new Paragraph({
                spacing: { before: mIdx === 0 ? 40 : 80, after: 30 },
                children: [
                  new TextRun({ text: `[Elemen: ${elName}]`, bold: true, size: 18, font: 'Times New Roman' })
                ]
              }));

              content.split('\n').forEach(pText => {
                if (pText.trim()) {
                  cpParagraphs.push(new Paragraph({
                    spacing: { before: 20, after: 30 },
                    children: [new TextRun({ text: pText.trim(), size: 18, font: 'Times New Roman' })]
                  }));
                }
              });
            });
          } else {
            const colonMatch = cpRaw.match(/^(Elemen\s*[^:\n]+|[^:\n]{3,35}):\s*(.*)$/is);
            if (colonMatch && !colonMatch[1].includes('http')) {
              const elName = colonMatch[1].replace(/^Elemen\s*:\s*/i, '').trim();
              const rest = colonMatch[2].trim();
              cpParagraphs.push(new Paragraph({
                spacing: { before: 40, after: 30 },
                children: [
                  new TextRun({ text: `[Elemen: ${elName}]`, bold: true, size: 18, font: 'Times New Roman' })
                ]
              }));
              rest.split('\n').forEach(pText => {
                if (pText.trim()) {
                  cpParagraphs.push(new Paragraph({
                    spacing: { before: 20, after: 30 },
                    children: [new TextRun({ text: pText.trim(), size: 18, font: 'Times New Roman' })]
                  }));
                }
              });
            } else {
              cpRaw.split('\n').forEach(pText => {
                if (pText.trim()) {
                  cpParagraphs.push(new Paragraph({
                    spacing: { before: 40, after: 40 },
                    children: [new TextRun({ text: pText.trim(), size: 18, font: 'Times New Roman' })]
                  }));
                }
              });
            }
          }

          cells.push(new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            rowSpan: rowSpanCount,
            verticalAlign: VerticalAlign.TOP,
            children: cpParagraphs
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

  const signatureTable = createSignatureTable({
    kepalaSekolah: metadata.kepala_sekolah,
    nipKepalaSekolah: metadata.nip_kepala_sekolah,
    guru: metadata.guru,
    nipGuru: metadata.nip_guru,
    titimangsa: getKaldikTitimangsa(metadata.tahun_pembelajaran, 1),
    jabatanGuru: 'Guru Mata Pelajaran / Kelas'
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 11906, // docx library internally swaps width & height when orientation is LANDSCAPE so w:w="16838" and w:h="11906"
              height: 16838,
            },
            margin: {
              top: 720,
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
