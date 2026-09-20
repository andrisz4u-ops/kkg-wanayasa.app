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

  // Keyword weights per elemen untuk scoring yang presisi
  const getElementScore = (elemName: string, itemText: string, babCpText: string, babTitleText: string): number => {
    const t = itemText.toLowerCase();
    const cpLower = (babCpText || '').toLowerCase();
    const titleLower = (babTitleText || '').toLowerCase();
    const elemLower = elemName.toLowerCase();
    const cleanElem = elemLower.split('(')[0].trim();
    let score = 0;

    // 1. Prioritas utama: Tag kurung siku [Nama Elemen] pada babCp atau babTitle
    // Mendukung alias tag umum resmi
    const tags: string[] = [`[${cleanElem}`];
    if (cleanElem.includes('analisis data') || cleanElem.includes('peluang')) {
      tags.push('[analisis data', '[data dan diagram', '[data dan peluang', '[data]', '[peluang]');
    } else if (cleanElem.includes('pengukuran')) {
      tags.push('[pengukuran', '[mengukur');
    } else if (cleanElem.includes('geometri')) {
      tags.push('[geometri', '[bangun datar', '[bangun ruang');
    } else if (cleanElem.includes('aljabar')) {
      tags.push('[aljabar', '[pola bilangan', '[rasio', '[proporsi');
    } else if (cleanElem.includes('bilangan')) {
      tags.push('[bilangan', '[bilangan cacah', '[pecahan');
    }

    const hasTagMatch = tags.some(tag => cpLower.includes(tag) || titleLower.includes(tag));
    if (hasTagMatch) {
      score += 100;
    }

    // 2. Jika judul bab secara eksplisit menyebut elemen atau aliasnya
    if (titleLower.includes(cleanElem)) {
      score += 35;
    } else if (cleanElem.includes('analisis data') || cleanElem.includes('peluang')) {
      if (/\b(data|diagram|piktogram|turus|grafik|peluang|frekuensi)\b/i.test(titleLower.replace(/datar/g, ''))) score += 35;
    } else if (cleanElem.includes('pengukuran')) {
      if (/\b(pengukuran|mengukur|keliling|luas|sudut|panjang|berat|volume|durasi|waktu)\b/i.test(titleLower)) score += 35;
    } else if (cleanElem.includes('geometri')) {
      if (/\b(geometri|bangun ruang|bangun datar|spasial|kubus|balok|prisma|tabung|simetri)\b/i.test(titleLower)) score += 35;
    } else if (cleanElem.includes('aljabar')) {
      if (/\b(aljabar|rasio|proporsi|skala|variabel)\b/i.test(titleLower)) score += 35;
    } else if (cleanElem.includes('bilangan')) {
      if (/\b(bilangan|cacah|kpk|fpb|pecahan|desimal)\b/i.test(titleLower)) score += 35;
    }

    // 3. Cek kata kunci spesifik pada judul bab & konten TP/materi (itemText)
    const combinedContent = `${titleLower} ${t}`;

    if (cleanElem.includes('analisis data') || cleanElem.includes('peluang')) {
      const withoutDatar = combinedContent.replace(/datar/g, '');
      if (withoutDatar.includes('analisis data') || withoutDatar.includes('diagram') || withoutDatar.includes('tabel data') || withoutDatar.includes('tabel frekuensi') || withoutDatar.includes('piktogram') || withoutDatar.includes('turus') || withoutDatar.includes('grafik') || withoutDatar.includes('peluang') || withoutDatar.includes('mengumpulkan data') || withoutDatar.includes('pengumpulan data') || withoutDatar.includes('penyajian data') || /\bdata\b/i.test(withoutDatar)) {
        score += 30;
      }
    }

    if (cleanElem.includes('geometri')) {
      if (combinedContent.includes('bangun datar') || combinedContent.includes('bangun ruang') || combinedContent.includes('geometri') || combinedContent.includes('kubus') || combinedContent.includes('balok') || combinedContent.includes('segitiga') || combinedContent.includes('lingkaran') || combinedContent.includes('spasial') || combinedContent.includes('simetri lipat') || combinedContent.includes('simetri putar') || combinedContent.includes('jaring-jaring')) {
        score += 25;
      }
    }

    if (cleanElem.includes('pengukuran')) {
      if (combinedContent.includes('pengukuran') || combinedContent.includes('mengukur') || combinedContent.includes('panjang') || combinedContent.includes('berat') || combinedContent.includes('luas') || combinedContent.includes('volume') || combinedContent.includes('durasi') || combinedContent.includes('sudut') || combinedContent.includes('keliling') || combinedContent.includes('busur derajat')) {
        score += 25;
      }
    }

    if (cleanElem.includes('aljabar')) {
      if (combinedContent.includes('aljabar') || combinedContent.includes('pola bilangan') || combinedContent.includes('kalimat matematika') || combinedContent.includes('simbol') || combinedContent.includes('rasio') || combinedContent.includes('proporsi') || combinedContent.includes('variabel') || combinedContent.includes('skala')) {
        score += 25;
      }
    }

    if (cleanElem.includes('bilangan')) {
      if (combinedContent.includes('bukan bilangan')) {
        // Abaikan jika negasi
      } else if (combinedContent.includes('bilangan cacah') || combinedContent.includes('nilai tempat') || combinedContent.includes('membaca dan menulis bilangan') || combinedContent.includes('pecahan') || combinedContent.includes('desimal') || combinedContent.includes('operasi hitung') || combinedContent.includes('kpk') || combinedContent.includes('fpb') || combinedContent.includes('faktor prima') || combinedContent.includes('uang')) {
        score += 25;
      } else if (combinedContent.includes('bilangan')) {
        score += 10;
      }
    }

    // Bahasa Indonesia
    if (cleanElem.includes('menyimak')) {
      if (combinedContent.includes('simak') || combinedContent.includes('dengar') || combinedContent.includes('aural') || combinedContent.includes('audio')) score += 25;
    }
    if (cleanElem.includes('membaca') || cleanElem.includes('memirsa')) {
      if (combinedContent.includes('baca') || combinedContent.includes('memirsa') || combinedContent.includes('teks visual') || combinedContent.includes('kosakata')) score += 25;
    }
    if (cleanElem.includes('berbicara') || cleanElem.includes('mempresentasikan')) {
      if (combinedContent.includes('bicara') || combinedContent.includes('presentasi') || combinedContent.includes('lisan') || combinedContent.includes('tanya') || combinedContent.includes('diskusi')) score += 25;
    }
    if (cleanElem.includes('menulis')) {
      if (combinedContent.includes('tulis') || combinedContent.includes('karangan') || combinedContent.includes('kalimat') || combinedContent.includes('paragraf') || combinedContent.includes('ejaan')) score += 25;
    }

    // Pendidikan Pancasila
    if (cleanElem.includes('pancasila')) {
      if (combinedContent.includes('pancasila') || combinedContent.includes('sila') || combinedContent.includes('garuda') || combinedContent.includes('lambang')) score += 25;
    }
    if (cleanElem.includes('uud') || cleanElem.includes('1945') || cleanElem.includes('norma')) {
      if (combinedContent.includes('norma') || combinedContent.includes('aturan') || combinedContent.includes('hak') || combinedContent.includes('kewajiban') || combinedContent.includes('musyawarah')) score += 25;
    }
    if (cleanElem.includes('bhinneka')) {
      if (combinedContent.includes('bhinneka') || combinedContent.includes('keberagaman') || combinedContent.includes('budaya') || combinedContent.includes('suku') || combinedContent.includes('identitas')) score += 25;
    }
    if (cleanElem.includes('nkri') || cleanElem.includes('kesatuan')) {
      if (combinedContent.includes('nkri') || combinedContent.includes('kesatuan') || combinedContent.includes('wilayah') || combinedContent.includes('gotong royong')) score += 25;
    }

    // IPAS
    if (cleanElem.includes('pemahaman ipas')) {
      if (!combinedContent.includes('keterampilan proses') && (combinedContent.includes('organ') || combinedContent.includes('ekosistem') || combinedContent.includes('cahaya') || combinedContent.includes('bunyi') || combinedContent.includes('geografis') || combinedContent.includes('ekonomi') || combinedContent.includes('sejarah') || combinedContent.includes('siklus air'))) score += 25;
    }
    if (cleanElem.includes('keterampilan proses')) {
      if (combinedContent.includes('keterampilan proses') || combinedContent.includes('mengamati') || combinedContent.includes('menyelidiki') || combinedContent.includes('percobaan') || combinedContent.includes('eksperimen') || combinedContent.includes('laporan penyelidikan')) score += 25;
    }

    return score;
  };

  // Petakan setiap TP item ke elemen dengan skor tertinggi
  allItems.forEach(({ item, babTitle, babNo, babCp }) => {
    const itemContent = `${item.materi_pokok || ''} ${item.tp || ''} ${item.atp || ''}`;
    let bestElem = elementNames[0];
    let maxScore = -1;

    elementNames.forEach(elemName => {
      const score = getElementScore(elemName, itemContent, babCp, babTitle);
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

    const isAljabarKelas5 = group.elemen.toLowerCase().includes('aljabar') && (jenjangKelas === '5' || jenjangKelas.includes('5'));

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
          children: [
            new TextRun({
              text: isAljabarKelas5 ? '• (Diprogramkan di Kelas 6)' : '-',
              size: 18,
              font: 'Times New Roman',
              italics: isAljabarKelas5
            })
          ]
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
          alignment: AlignmentType.JUSTIFY,
          children: [
            new TextRun({
              text: isAljabarKelas5
                ? 'Kompetensi Elemen Aljabar Fase C (Rasio & Proporsi) diprogramkan pada pembelajaran Kelas 6 sesuai struktur kurikulum resmi BSKAP.'
                : 'Mencapai tujuan pembelajaran elemen ini.',
              size: 18,
              font: 'Times New Roman',
              italics: isAljabarKelas5
            })
          ]
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
