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
import { sanitizeText, generateKopSuratDocx, createSignatureTable, getKaldikTitimangsa } from './helpers';
import type { AnalisisCpDocxInput } from './analisis-cp';
import { getOfficialCPElements, getFaseFromKelas } from '../cp-data';
import { getAlokasiWaktuResmi } from '../alokasi-waktu';

export interface AtpElemenItem {
  kode_tp: string;
  tp: string;
  materi_pokok?: string;
  alokasi_waktu?: string;
}

export interface AtpElemenGroup {
  no: number;
  elemen: string;
  cp: string;
  lingkup_materi: string[];
  items: AtpElemenItem[];
  total_jp: number;
}

/**
 * Helper untuk mengekstrak angka JP dari string (misal "5 JP" -> 5)
 */
function parseJpNum(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const match = String(val || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Kelompokkan data analisis semester & bab ke dalam Elemen-Elemen Resmi BSKAP
 */
export function groupAnalysisDataByElements(data: AnalisisCpDocxInput): AtpElemenGroup[] {
  const metadata = data.metadata || ({} as any);
  const mataPelajaran = metadata.mata_pelajaran || '';
  const jenjangKelas = metadata.kelas || '5';
  const fase = metadata.fase ? (metadata.fase.startsWith('Fase') ? metadata.fase : `Fase ${metadata.fase}`) : (getFaseFromKelas(jenjangKelas) || 'Fase C');

  const officialElementsMap = getOfficialCPElements(mataPelajaran, jenjangKelas) || {};
  const elementNames = Object.keys(officialElementsMap);

  // Kumpulkan semua items dari seluruh bab dan semester
  const allItems: Array<{
    item: any;
    babTitle: string;
    babNo: number;
    babCp: string;
  }> = [];

  (data.semesters || []).forEach(sem => {
    (sem.babs || []).forEach(bab => {
      (bab.items || []).forEach(item => {
        allItems.push({
          item,
          babTitle: bab.bab || '',
          babNo: bab.no || 1,
          babCp: bab.cp || ''
        });
      });
    });
  });

  // Jika tidak ditemukan elemen resmi di database, buat fallback berdasarkan bab yang ada
  if (elementNames.length === 0) {
    const groups: AtpElemenGroup[] = [];
    (data.semesters || []).forEach(sem => {
      (sem.babs || []).forEach((bab, bIdx) => {
        let babJp = 0;
        const tpItems: AtpElemenItem[] = (bab.items || []).map((it, itIdx) => {
          babJp += parseJpNum(it.alokasi_waktu);
          return {
            kode_tp: it.kode_tp || `${metadata.kelas || '5'}.${bab.no || bIdx + 1}.${itIdx + 1}`,
            tp: it.tp,
            materi_pokok: it.materi_pokok,
            alokasi_waktu: it.alokasi_waktu
          };
        });

        groups.push({
          no: groups.length + 1,
          elemen: bab.bab,
          cp: bab.cp || 'Memahami konsep esensial dan menerapkannya dalam kehidupan sehari-hari.',
          lingkup_materi: bab.materi_list || [bab.bab],
          items: tpItems,
          total_jp: babJp
        });
      });
    });
    return groups;
  }

  // Siapkan kontainer untuk setiap elemen resmi
  const elementBuckets: Record<string, {
    items: AtpElemenItem[];
    materiSet: Set<string>;
    totalJp: number;
  }> = {};

  elementNames.forEach(name => {
    elementBuckets[name] = {
      items: [],
      materiSet: new Set(),
      totalJp: 0
    };
  });

  // Keyword weights per elemen untuk scoring
  const getElementScore = (elemName: string, text: string, babCpText: string, babTitleText: string): number => {
    const t = text.toLowerCase();
    const elemLower = elemName.toLowerCase();
    const cleanElem = elemLower.split('(')[0].trim();
    let score = 0;

    // Prioritas utama: jika ada tag kurung siku [Nama Elemen] pada babCp atau babTitle
    // contoh: "[Aljabar] Mengenali..." atau "[Bilangan]"
    const tag = `[${cleanElem}`;
    if (babCpText.toLowerCase().includes(tag) || babTitleText.toLowerCase().includes(tag)) {
      score += 100;
    }

    // Jika judul bab secara eksplisit menyebut elemen
    if (babTitleText.toLowerCase().includes(cleanElem)) {
      score += 30;
    }

    // Cek kata kunci spesifik
    if (cleanElem.includes('bilangan')) {
      if (t.includes('bukan bilangan')) {
        // Abaikan atau kurangi poin jika konteksnya negasi "bukan bilangan"
      } else if (t.includes('bilangan cacah') || t.includes('nilai tempat') || t.includes('membaca dan menulis bilangan') || t.includes('pecahan') || t.includes('desimal') || t.includes('operasi hitung') || t.includes('kpk') || t.includes('fpb') || t.includes('uang')) {
        score += 25;
      } else if (t.includes('bilangan')) {
        score += 10;
      }
    }

    if (cleanElem.includes('aljabar')) {
      if (t.includes('aljabar') || t.includes('pola') || t.includes('kalimat matematika') || t.includes('simbol') || t.includes('rasio') || t.includes('proporsi') || t.includes('variabel')) {
        score += 25;
      }
    }

    if (cleanElem.includes('pengukuran')) {
      if (t.includes('pengukuran') || t.includes('mengukur') || t.includes('panjang') || t.includes('berat') || t.includes('luas') || t.includes('volume') || t.includes('durasi') || t.includes('sudut') || t.includes('keliling')) {
        score += 25;
      }
    }

    if (cleanElem.includes('geometri')) {
      if (t.includes('bangun datar') || t.includes('bangun ruang') || t.includes('geometri') || t.includes('kubus') || t.includes('balok') || t.includes('segitiga') || t.includes('lingkaran') || t.includes('spasial')) {
        score += 25;
      }
    }

    if (cleanElem.includes('analisis data') || cleanElem.includes('peluang')) {
      if (t.includes('analisis data') || t.includes('diagram') || t.includes('tabel data') || t.includes('piktogram') || t.includes('turus') || t.includes('grafik') || t.includes('peluang')) {
        score += 25;
      }
    }

    // Bahasa Indonesia
    if (cleanElem.includes('menyimak')) {
      if (t.includes('simak') || t.includes('dengar') || t.includes('aural') || t.includes('audio')) score += 25;
    }
    if (cleanElem.includes('membaca') || cleanElem.includes('memirsa')) {
      if (t.includes('baca') || t.includes('memirsa') || t.includes('teks visual') || t.includes('kosakata')) score += 25;
    }
    if (cleanElem.includes('berbicara') || cleanElem.includes('mempresentasikan')) {
      if (t.includes('bicara') || t.includes('presentasi') || t.includes('lisan') || t.includes('tanya') || t.includes('diskusi')) score += 25;
    }
    if (cleanElem.includes('menulis')) {
      if (t.includes('tulis') || t.includes('karangan') || t.includes('kalimat') || t.includes('paragraf') || t.includes('ejaan')) score += 25;
    }

    // Pendidikan Pancasila
    if (cleanElem.includes('pancasila')) {
      if (t.includes('pancasila') || t.includes('sila') || t.includes('garuda') || t.includes('lambang')) score += 25;
    }
    if (cleanElem.includes('uud') || cleanElem.includes('1945') || cleanElem.includes('norma')) {
      if (t.includes('norma') || t.includes('aturan') || t.includes('hak') || t.includes('kewajiban') || t.includes('musyawarah')) score += 25;
    }
    if (cleanElem.includes('bhinneka')) {
      if (t.includes('bhinneka') || t.includes('keberagaman') || t.includes('budaya') || t.includes('suku') || t.includes('identitas')) score += 25;
    }
    if (cleanElem.includes('nkri') || cleanElem.includes('kesatuan')) {
      if (t.includes('nkri') || t.includes('kesatuan') || t.includes('wilayah') || t.includes('gotong royong')) score += 25;
    }

    // IPAS
    if (cleanElem.includes('pemahaman ipas')) {
      if (!t.includes('keterampilan proses') && (t.includes('organ') || t.includes('ekosistem') || t.includes('cahaya') || t.includes('bunyi') || t.includes('geografis') || t.includes('ekonomi') || t.includes('sejarah') || t.includes('siklus air'))) score += 25;
    }
    if (cleanElem.includes('keterampilan proses')) {
      if (t.includes('keterampilan proses') || t.includes('mengamati') || t.includes('menyelidiki') || t.includes('percobaan') || t.includes('eksperimen') || t.includes('laporan penyelidikan')) score += 25;
    }

    return score;
  };

  // Petakan setiap TP item ke elemen dengan skor tertinggi
  allItems.forEach(({ item, babTitle, babNo, babCp }) => {
    const contextText = `${babTitle} ${babCp} ${item.materi_pokok || ''} ${item.tp || ''} ${item.atp || ''}`;
    let bestElem = elementNames[0];
    let maxScore = -1;

    elementNames.forEach(elemName => {
      const score = getElementScore(elemName, contextText, babCp, babTitle);
      if (score > maxScore) {
        maxScore = score;
        bestElem = elemName;
      }
    });

    // Jika skor 0 atau seri, distribusikan merata berdasarkan babNo
    if (maxScore <= 0) {
      const fallbackIdx = (babNo - 1) % elementNames.length;
      bestElem = elementNames[fallbackIdx];
    }

    const jp = parseJpNum(item.alokasi_waktu);
    elementBuckets[bestElem].totalJp += jp;
    if (item.materi_pokok) {
      elementBuckets[bestElem].materiSet.add(item.materi_pokok.trim());
    }

    elementBuckets[bestElem].items.push({
      kode_tp: item.kode_tp,
      tp: item.tp,
      materi_pokok: item.materi_pokok,
      alokasi_waktu: item.alokasi_waktu
    });
  });

  // Bentuk array AtpElemenGroup final
  const resultGroups: AtpElemenGroup[] = [];
  const kelasNum = jenjangKelas.match(/\d+/)?.[0] || '1';

  elementNames.forEach((elemName, eIdx) => {
    const bucket = elementBuckets[elemName];
    const cpText = officialElementsMap[elemName] || '';

    // Format kode TP yang elegan: Kelas.Elemen.NoUrut (misal 1.1.1, 1.1.2) sesuai foto referensi
    const formattedItems: AtpElemenItem[] = bucket.items.map((it, itIdx) => {
      // Jika kode TP asli sudah sesuai pola kelas.nomor, pertahankan atau format ulang secara rapi
      const cleanKode = it.kode_tp && it.kode_tp.startsWith(`${kelasNum}.`)
        ? it.kode_tp
        : `${kelasNum}.${eIdx + 1}.${itIdx + 1}`;

      return {
        kode_tp: cleanKode,
        tp: it.tp,
        materi_pokok: it.materi_pokok,
        alokasi_waktu: it.alokasi_waktu
      };
    });

    resultGroups.push({
      no: eIdx + 1,
      elemen: elemName,
      cp: cpText,
      lingkup_materi: Array.from(bucket.materiSet),
      items: formattedItems,
      total_jp: bucket.totalJp
    });
  });

  return resultGroups;
}

/**
 * Generate Dokumen Word (.docx) Alur Tujuan Pembelajaran (ATP) Model Elemen CP
 */
export async function generateAtpElemenDocxBuffer(data: AnalisisCpDocxInput): Promise<Buffer> {
  const metadata = data.metadata || ({} as any);
  const kopSuratContent = await generateKopSuratDocx(metadata.kop_surat_url, true);
  const groups = groupAnalysisDataByElements(data);

  const jenjangKelas = metadata.kelas || '5';
  const faseStr = metadata.fase ? (metadata.fase.startsWith('Fase') ? metadata.fase : `Fase ${metadata.fase}`) : (getFaseFromKelas(jenjangKelas) || 'Fase C');
  const faseCode = faseStr.replace('Fase ', '').trim();

  // Document Title
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 140 },
    children: [
      new TextRun({
        text: 'ALUR TUJUAN PEMBELAJARAN',
        bold: true,
        size: 26, // 13pt
        font: 'Times New Roman'
      })
    ]
  });

  // Metadata Table (Identitas Dokumen persis seperti pada foto referensi)
  const metaRows = [
    ['SATUAN PENDIDIKAN', `: ${metadata.satuan_pendidikan || '-'}`],
    ['MATA PELAJARAN', `: ${metadata.mata_pelajaran || '-'}`],
    ['FASE', `: ${faseCode}`],
    ['KELAS', `: ${jenjangKelas}`],
    ['TAHUN AJARAN', `: ${metadata.tahun_pembelajaran || '2026/2027'}`],
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
    rows: metaRows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { after: 30 },
                children: [new TextRun({ text: label, bold: true, size: 20, font: 'Times New Roman' })]
              })
            ]
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { after: 30 },
                children: [new TextRun({ text: value, bold: true, size: 20, font: 'Times New Roman' })]
              })
            ]
          }),
        ]
      })
    )
  });

  // Kalimat pengantar resmi (sesuai foto referensi)
  const introParagraph = new Paragraph({
    spacing: { before: 140, after: 120 },
    children: [
      new TextRun({
        text: `Pada akhir ${faseStr}, murid memiliki kemampuan sebagai berikut:`,
        size: 20,
        font: 'Times New Roman',
        italics: true
      })
    ]
  });

  // Header Tabel 6 Kolom
  const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const cellBorders = {
    top: tableBorder,
    bottom: tableBorder,
    left: tableBorder,
    right: tableBorder,
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'NO.', bold: true, size: 19, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 13, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ELEMEN', bold: true, size: 19, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 27, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'CAPAIAN PEMBELAJARAN', bold: true, size: 19, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'LINGKUP MATERI', bold: true, size: 19, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TUJUAN PEMBELAJARAN', bold: true, size: 19, font: 'Times New Roman' })]
          })
        ]
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ALOKASI WAKTU', bold: true, size: 19, font: 'Times New Roman' })]
          })
        ]
      })
    ]
  });

  const tableRows: TableRow[] = [headerRow];
  let grandTotalJp = 0;

  groups.forEach(group => {
    grandTotalJp += group.total_jp;

    // Lingkup Materi paragraphs
    const materiParagraphs: Paragraph[] = (group.lingkup_materi && group.lingkup_materi.length > 0)
      ? group.lingkup_materi.map(m => new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `• ${sanitizeText(m)}`, size: 18, font: 'Times New Roman' })
          ]
        }))
      : [new Paragraph({
          spacing: { after: 30 },
          children: [new TextRun({ text: '-', size: 18, font: 'Times New Roman' })]
        })];

    // TP paragraphs dengan format kode tebal + teks justified persis foto referensi
    const tpParagraphs: Paragraph[] = (group.items && group.items.length > 0)
      ? group.items.map(it => new Paragraph({
          spacing: { after: 50 },
          alignment: AlignmentType.JUSTIFY,
          children: [
            new TextRun({ text: `${it.kode_tp}  `, bold: true, size: 18, font: 'Times New Roman' }),
            new TextRun({ text: sanitizeText(it.tp), size: 18, font: 'Times New Roman' })
          ]
        }))
      : [new Paragraph({
          spacing: { after: 30 },
          children: [new TextRun({ text: 'Mencapai tujuan pembelajaran elemen ini.', size: 18, font: 'Times New Roman' })]
        })];

    const row = new TableRow({
      children: [
        // No
        new TableCell({
          width: { size: 4, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 30 },
              children: [new TextRun({ text: String(group.no), bold: true, size: 19, font: 'Times New Roman' })]
            })
          ]
        }),
        // Elemen
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              spacing: { after: 30 },
              children: [new TextRun({ text: sanitizeText(group.elemen), bold: true, size: 19, font: 'Times New Roman' })]
            })
          ]
        }),
        // Capaian Pembelajaran
        new TableCell({
          width: { size: 27, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.JUSTIFY,
              spacing: { after: 30 },
              children: [new TextRun({ text: sanitizeText(group.cp), size: 18, font: 'Times New Roman' })]
            })
          ]
        }),
        // Lingkup Materi
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: materiParagraphs
        }),
        // Tujuan Pembelajaran
        new TableCell({
          width: { size: 33, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: tpParagraphs
        }),
        // Alokasi Waktu
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 30 },
              children: [
                new TextRun({
                  text: group.total_jp > 0 ? `${group.total_jp} JP` : '-',
                  bold: true,
                  size: 19,
                  font: 'Times New Roman'
                })
              ]
            })
          ]
        })
      ]
    });

    tableRows.push(row);
  });

  // Total JP Row
  const totalRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: 'TOTAL ALOKASI WAKTU 1 TAHUN AJARAN:',
                bold: true,
                size: 19,
                font: 'Times New Roman'
              })
            ]
          })
        ]
      }),
      new TableCell({
        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: `${grandTotalJp} JP`,
                bold: true,
                size: 20,
                font: 'Times New Roman'
              })
            ]
          })
        ]
      })
    ]
  });

  tableRows.push(totalRow);

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });

  // Signature Table
  const tahunAjaran = metadata.tahun_pembelajaran || '2026/2027';
  const titimangsa = getKaldikTitimangsa(tahunAjaran, 1);
  const signatureTable = createSignatureTable(
    metadata.kepala_sekolah || '-',
    metadata.nip_kepala_sekolah || '-',
    metadata.guru || '-',
    metadata.nip_guru || '-',
    titimangsa
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            orientation: PageOrientation.LANDSCAPE,
            size: {
              width: 16838, // A4 Landscape
              height: 11906,
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
          introParagraph,
          mainTable,
          new Paragraph({ spacing: { after: 140 } }),
          signatureTable
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
