/**
 * capaian-pembelajaran.ts
 * Generator Dokumen Word (.docx) Capaian Pembelajaran (CP) Resmi Kurikulum Merdeka
 * Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025 & BSKAP No. 032/H/KR/2024
 */

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
  HeadingLevel,
} from 'docx';
import { sanitizeText, generateKopSuratDocx, createSignatureTable, getKaldikTitimangsa } from './helpers';
import type { AnalisisCpDocxInput } from './analisis-cp';
import { getOfficialCpDocumentData } from '../cp-document-data';

export async function generateCapaianPembelajaranDocxBuffer(data: AnalisisCpDocxInput): Promise<Buffer> {
  const metadata = data.metadata || ({} as any);
  const mataPelajaran = metadata.mata_pelajaran || 'Matematika';
  const jenjangKelas = metadata.kelas || '5';

  const cpDoc = getOfficialCpDocumentData(mataPelajaran, jenjangKelas);
  const kopSuratContent = await generateKopSuratDocx(metadata.kop_surat_url, false);

  const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const cellBorders = {
    top: tableBorder,
    bottom: tableBorder,
    left: tableBorder,
    right: tableBorder,
  };

  // Judul Dokumen
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40 },
    children: [
      new TextRun({
        text: 'DOKUMEN CAPAIAN PEMBELAJARAN (CP)',
        bold: true,
        size: 26, // 13pt
        font: 'Times New Roman'
      })
    ]
  });

  const subTitleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 20, after: 120 },
    children: [
      new TextRun({
        text: `MATA PELAJARAN: ${mataPelajaran.toUpperCase()} - ${cpDoc.fase.toUpperCase()}`,
        bold: true,
        size: 22, // 11pt
        font: 'Times New Roman'
      })
    ]
  });

  // Tabel Identitas Dokumen
  const metaRows = [
    { label: 'Satuan Pendidikan', value: `: ${metadata.satuan_pendidikan || '-'}` },
    { label: 'Mata Pelajaran', value: `: ${mataPelajaran}` },
    { label: 'Fase / Kelas', value: `: ${cpDoc.fase} / Kelas ${jenjangKelas}` },
    { label: 'Tahun Ajaran', value: `: ${metadata.tahun_pembelajaran || '2025/2026'}` },
    { label: 'Dasar Regulasi', value: `: ${cpDoc.regulasi}` },
  ];

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: metaRows.map(({ label, value }) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { after: 30 },
                children: [new TextRun({ text: label, bold: true, size: 20, font: 'Times New Roman' })]
              })
            ]
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { after: 30 },
                children: [new TextRun({ text: value, size: 20, font: 'Times New Roman' })]
              })
            ]
          }),
        ]
      })
    )
  });

  // Section Header Helper
  const createSectionHeader = (title: string) => {
    return new Paragraph({
      spacing: { before: 180, after: 60 },
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 22, // 11pt
          font: 'Times New Roman'
        })
      ]
    });
  };

  // I. Rasional
  const rasionalHeading = createSectionHeader('I. RASIONAL MATA PELAJARAN');
  const rasionalPara = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 40, after: 100 },
    children: [
      new TextRun({
        text: sanitizeText(cpDoc.rasional),
        size: 21,
        font: 'Times New Roman'
      })
    ]
  });

  // II. Tujuan
  const tujuanHeading = createSectionHeader('II. TUJUAN BELAJAR MATA PELAJARAN');
  const tujuanParas = cpDoc.tujuan.map((tuj, idx) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 20, after: 40 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: `${idx + 1}. `,
          bold: true,
          size: 21,
          font: 'Times New Roman'
        }),
        new TextRun({
          text: sanitizeText(tuj),
          size: 21,
          font: 'Times New Roman'
        })
      ]
    });
  });

  // III. Karakteristik & Elemen
  const karakteristikHeading = createSectionHeader('III. KARAKTERISTIK MATA PELAJARAN');
  const karakteristikPara = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 40, after: 80 },
    children: [
      new TextRun({
        text: sanitizeText(cpDoc.karakteristik),
        size: 21,
        font: 'Times New Roman'
      })
    ]
  });

  // Tabel Deskripsi Elemen
  const elemenTableHeader = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ELEMEN', bold: true, size: 20, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'DESKRIPSI RUANG LINGKUP', bold: true, size: 20, font: 'Times New Roman' })]
          })
        ]
      })
    ]
  });

  const elemenTableRows = cpDoc.elemen_deskripsi.map(elem => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: elem.elemen, bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: sanitizeText(elem.deskripsi), size: 20, font: 'Times New Roman' })]
            })
          ]
        })
      ]
    });
  });

  const elemenTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [elemenTableHeader, ...elemenTableRows]
  });

  // IV. Capaian Pembelajaran Fase
  const cpHeading = createSectionHeader(`IV. CAPAIAN PEMBELAJARAN ${cpDoc.fase.toUpperCase()}`);

  const cpUmumSubheading = new Paragraph({
    spacing: { before: 60, after: 40 },
    children: [
      new TextRun({
        text: 'A. Capaian Pembelajaran Umum Akhir Fase',
        bold: true,
        size: 21,
        font: 'Times New Roman'
      })
    ]
  });

  const cpUmumPara = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 20, after: 100 },
    children: [
      new TextRun({
        text: sanitizeText(cpDoc.capaian_umum),
        size: 21,
        font: 'Times New Roman',
        italics: true
      })
    ]
  });

  const cpElemenSubheading = new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text: 'B. Capaian Pembelajaran Berdasarkan Elemen',
        bold: true,
        size: 21,
        font: 'Times New Roman'
      })
    ]
  });

  // Tabel Capaian Elemen (3 Kolom: No, Elemen, Capaian Pembelajaran)
  const cpTableHeader = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'NO.', bold: true, size: 20, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 26, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ELEMEN', bold: true, size: 20, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 68, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'CAPAIAN PEMBELAJARAN', bold: true, size: 20, font: 'Times New Roman' })]
          })
        ]
      })
    ]
  });

  const cpTableRows = cpDoc.capaian_elemen.map(item => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: String(item.no), size: 20, font: 'Times New Roman' })]
            })
          ]
        }),
        new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: item.elemen, bold: true, size: 20, font: 'Times New Roman' })]
            })
          ]
        }),
        new TableCell({
          width: { size: 68, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: sanitizeText(item.cp), size: 20, font: 'Times New Roman' })]
            })
          ]
        })
      ]
    });
  });

  const cpTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [cpTableHeader, ...cpTableRows]
  });

  // Tabel Tanda Tangan
  const signatureTable = createSignatureTable({
    kepalaSekolah: metadata.kepala_sekolah,
    nipKepalaSekolah: metadata.nip_kepala_sekolah,
    guru: metadata.guru,
    nipGuru: metadata.nip_guru,
    titimangsa: getKaldikTitimangsa(metadata.tahun_pembelajaran, 1),
    jabatanGuru: 'Guru Kelas / Mata Pelajaran'
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
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
          subTitleParagraph,
          metaTable,
          rasionalHeading,
          rasionalPara,
          tujuanHeading,
          ...tujuanParas,
          karakteristikHeading,
          karakteristikPara,
          new Paragraph({ spacing: { after: 60 } }),
          elemenTable,
          cpHeading,
          cpUmumSubheading,
          cpUmumPara,
          cpElemenSubheading,
          cpTable,
          new Paragraph({ spacing: { after: 160 } }),
          signatureTable
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
