/**
 * tts-docx.js — Generator DOCX Lembar Kerja Siswa (LKPD) Teka-Teki Silang
 * Menggunakan library docx.js (window.docx) yang dimuat via CDN di layout.ts
 */

export async function generateTtsDocx(data, formData, kopSuratUrl) {
  if (!window.docx) {
    throw new Error('Library docx.js belum dimuat. Pastikan koneksi internet aktif.');
  }

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, HeadingLevel, PageBreak,
    Header, Footer, PageNumber, NumberFormat, ImageRun, VerticalAlign
  } = window.docx;

  const PT = (pt) => Math.round(pt * 20);
  const CM = (cm) => Math.round(cm * 567);

  const FONT_LATIN = 'Times New Roman';
  const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 4, color: '000000' };

  const NO_BORDERS = {
    top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE,
    insideHorizontal: BORDER_NONE, insideVertical: BORDER_NONE
  };

  const makePara = (text, opts = {}) => {
    const {
      bold = false,
      italic = false,
      size = 22, // 11pt
      align = AlignmentType.LEFT,
      spaceBefore = 0,
      spaceAfter = 4,
      underline = false
    } = opts;

    return new Paragraph({
      alignment: align,
      spacing: { before: PT(spaceBefore), after: PT(spaceAfter), line: 240 },
      children: [
        new TextRun({
          text: String(text ?? ''),
          font: FONT_LATIN,
          size,
          bold,
          italic,
          underline: underline ? {} : undefined
        })
      ]
    });
  };

  const children = [];

  // 1. KOP SURAT
  if (kopSuratUrl) {
    try {
      const resp = await fetch(kopSuratUrl);
      if (resp.ok) {
        const imageBlob = await resp.arrayBuffer();
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: PT(12) },
          children: [
            new ImageRun({
              data: imageBlob,
              transformation: { width: 595, height: 95 }
            })
          ]
        }));
      }
    } catch (e) {
      console.warn('Gagal memuat gambar kop surat untuk DOCX:', e);
    }
  }

  // 2. JUDUL LKPD
  children.push(makePara('LEMBAR KERJA PESERTA DIDIK (LKPD)', {
    bold: true,
    size: 26, // 13pt
    align: AlignmentType.CENTER,
    spaceAfter: 2
  }));
  children.push(makePara(`TEKA-TEKI SILANG: ${(formData.topik || data.topik || 'PEMBELAJARAN').toUpperCase()}`, {
    bold: true,
    size: 24, // 12pt
    align: AlignmentType.CENTER,
    underline: true,
    spaceAfter: 12
  }));

  // 3. IDENTITAS SISWA & MAPEL (Tabel 2 Kolom)
  const metaRows = [
    [
      { label: 'Mata Pelajaran', val: formData.mataPelajaran || data.mataPelajaran || '-' },
      { label: 'Nama Peserta Didik', val: '............................................' }
    ],
    [
      { label: 'Kelas / Fase', val: formData.jenjangKelas || data.jenjangKelas || 'Kelas 5' },
      { label: 'Nomor Absen / Kelompok', val: '............................................' }
    ],
    [
      { label: 'Topik / Materi', val: formData.topik || data.topik || '-' },
      { label: 'Hari / Tanggal', val: '............................................' }
    ]
  ];

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: metaRows.map(row => new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: PT(1), after: PT(1) },
            children: [
              new TextRun({ text: `${row[0].label.padEnd(16, ' ')}: `, font: FONT_LATIN, size: 20, bold: true }),
              new TextRun({ text: row[0].val, font: FONT_LATIN, size: 20 })
            ]
          })]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          children: [new Paragraph({
            spacing: { before: PT(1), after: PT(1) },
            children: [
              new TextRun({ text: `${row[1].label.padEnd(20, ' ')}: `, font: FONT_LATIN, size: 20, bold: true }),
              new TextRun({ text: row[1].val, font: FONT_LATIN, size: 20 })
            ]
          })]
        })
      ]
    }))
  }));

  children.push(makePara('', { spaceAfter: 8 }));

  // 4. PETUNJUK PENGERJAAN
  children.push(makePara('Petunjuk Pengerjaan:', { bold: true, size: 22, spaceAfter: 2 }));
  children.push(makePara('1. Bacalah petunjuk pertanyaan Mendatar dan Menurun dengan seksama.', { size: 20, spaceAfter: 1 }));
  children.push(makePara('2. Isikan huruf pada kotak-kotak teka-teki silang sesuai dengan nomor pertanyaan.', { size: 20, spaceAfter: 1 }));
  children.push(makePara('3. Setiap satu kotak hanya boleh diisi oleh satu huruf kapital.', { size: 20, spaceAfter: 12 }));

  // 5. GRID KOTAK TEKA-TEKI SILANG
  const cw = data.crossword || {};
  if (cw.success && Array.isArray(cw.grid)) {
    const CELL_SIZE = CM(0.75); // 0.75 cm per cell
    const CW_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
    const CW_NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

    const gridRows = [];
    for (let r = 0; r < cw.grid.length; r++) {
      const rowCells = [];
      for (let c = 0; c < cw.grid[r].length; c++) {
        const char = cw.grid[r][c];
        const isLetterCell = char !== ' ';

        let cellNum = '';
        if (isLetterCell) {
          const p = cw.placements.find(pl => pl.row === r && pl.col === c);
          if (p && p.number != null) cellNum = String(p.number);
        }

        if (isLetterCell) {
          const cellChildren = [];
          if (cellNum) {
            cellChildren.push(new Paragraph({
              spacing: { before: 0, after: 0, line: 180 },
              children: [new TextRun({ text: cellNum, size: 13, bold: true, font: FONT_LATIN })]
            }));
          } else {
            cellChildren.push(new Paragraph({
              spacing: { before: 0, after: 0, line: 180 },
              children: [new TextRun({ text: ' ', size: 13, font: FONT_LATIN })]
            }));
          }
          rowCells.push(new TableCell({
            children: cellChildren,
            width: { size: CELL_SIZE, type: WidthType.DXA },
            borders: { top: CW_BORDER, bottom: CW_BORDER, left: CW_BORDER, right: CW_BORDER },
            margins: { top: PT(1), bottom: PT(0), left: PT(2), right: PT(1) },
            verticalAlign: VerticalAlign.TOP
          }));
        } else {
          rowCells.push(new TableCell({
            children: [new Paragraph({
              spacing: { before: 0, after: 0, line: 180 },
              children: [new TextRun({ text: '', size: 13, font: FONT_LATIN })]
            })],
            width: { size: CELL_SIZE, type: WidthType.DXA },
            borders: { top: CW_NO_BORDER, bottom: CW_NO_BORDER, left: CW_NO_BORDER, right: CW_NO_BORDER },
            margins: { top: PT(1), bottom: PT(0), left: PT(2), right: PT(1) }
          }));
        }
      }
      gridRows.push(new TableRow({ children: rowCells, cantSplit: true }));
    }

    children.push(new Table({
      rows: gridRows,
      alignment: AlignmentType.CENTER
    }));

    children.push(makePara('', { spaceAfter: 12 }));

    // 6. DAFTAR PETUNJUK MENDATAR & MENURUN
    const mendatar = [];
    const menurun = [];
    cw.placements.forEach(p => {
      const wObj = (data.words || [])[p.originalIndex] || {};
      const cleanClue = (wObj.clue || p.word).replace(/^(Mendatar:|Menurun:)\s*/i, '').trim();
      const item = { num: p.number, text: `${p.number}. ${cleanClue}` };
      if (p.direction === 'H') mendatar.push(item);
      else menurun.push(item);
    });

    mendatar.sort((a, b) => a.num - b.num);
    menurun.sort((a, b) => a.num - b.num);

    const leftColParas = [
      makePara('MENDATAR', { bold: true, size: 22, underline: true, spaceAfter: 4 }),
      ...mendatar.map(m => makePara(m.text, { size: 20, spaceAfter: 3 }))
    ];

    const rightColParas = [
      makePara('MENURUN', { bold: true, size: 22, underline: true, spaceAfter: 4 }),
      ...menurun.map(m => makePara(m.text, { size: 20, spaceAfter: 3 }))
    ];

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              margins: { right: PT(8) },
              children: leftColParas
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              margins: { left: PT(8) },
              children: rightColParas
            })
          ]
        })
      ]
    }));
  }

  // 7. LEMBAR KUNCI JAWABAN (PAGE BREAK TERPISAH)
  children.push(new Paragraph({ children: [new PageBreak()] }));

  children.push(makePara('KUNCI JAWABAN TEKA-TEKI SILANG', {
    bold: true,
    size: 26,
    align: AlignmentType.CENTER,
    underline: true,
    spaceAfter: 4
  }));
  children.push(makePara(`(Pegangan Guru) — ${formData.topik || data.topik || 'Topik'} (${formData.jenjangKelas || data.jenjangKelas || 'Kelas 5'})`, {
    italic: true,
    size: 20,
    align: AlignmentType.CENTER,
    spaceAfter: 16
  }));

  const allPlacements = [...(cw.placements || [])].sort((a, b) => a.number - b.number);
  const answerRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
          children: [makePara('No', { bold: true, size: 20, align: AlignmentType.CENTER })]
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
          children: [makePara('Posisi', { bold: true, size: 20, align: AlignmentType.CENTER })]
        }),
        new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
          children: [makePara('Kunci Kata', { bold: true, size: 20 })]
        }),
        new TableCell({
          width: { size: 46, type: WidthType.PERCENTAGE },
          borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
          children: [makePara('Petunjuk Soal', { bold: true, size: 20 })]
        })
      ]
    }),
    ...allPlacements.map(p => {
      const wObj = (data.words || [])[p.originalIndex] || {};
      const dirText = p.direction === 'H' ? 'Mendatar' : 'Menurun';
      return new TableRow({
        children: [
          new TableCell({
            borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
            children: [makePara(String(p.number), { size: 20, align: AlignmentType.CENTER })]
          }),
          new TableCell({
            borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
            children: [makePara(dirText, { size: 20, align: AlignmentType.CENTER })]
          }),
          new TableCell({
            borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
            children: [makePara(p.word, { bold: true, size: 20 })]
          }),
          new TableCell({
            borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
            children: [makePara((wObj.clue || p.word).replace(/^(Mendatar:|Menurun:)\s*/i, '').trim(), { size: 19 })]
          })
        ]
      });
    })
  ];

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: answerRows
  }));

  children.push(makePara('', { spaceAfter: 20 }));

  // 8. TANDA TANGAN
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: [
              makePara('Mengetahui,', { align: AlignmentType.CENTER, size: 20 }),
              makePara('Kepala Sekolah', { align: AlignmentType.CENTER, size: 20 }),
              makePara('', { spaceAfter: 36 }),
              makePara(formData.namaKepalaSekolah || '............................................', { bold: true, underline: true, align: AlignmentType.CENTER, size: 20 }),
              makePara(`NIP. ${formData.nipKepalaSekolah || '............................................'}`, { align: AlignmentType.CENTER, size: 20 })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: [
              makePara(`Wanayasa, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: AlignmentType.CENTER, size: 20 }),
              makePara('Guru Pengampu', { align: AlignmentType.CENTER, size: 20 }),
              makePara('', { spaceAfter: 36 }),
              makePara(formData.namaGuru || '............................................', { bold: true, underline: true, align: AlignmentType.CENTER, size: 20 }),
              makePara(`NIP. ${formData.nipGuru || '............................................'}`, { align: AlignmentType.CENTER, size: 20 })
            ]
          })
        ]
      })
    ]
  }));

  // Build Document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: CM(2), bottom: CM(2), left: CM(2.5), right: CM(2) }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Lembar Kerja Siswa (LKPD) TTS • KKG Wanayasa', font: FONT_LATIN, size: 16, italic: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Halaman ', font: FONT_LATIN, size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT_LATIN, size: 16 }),
              new TextRun({ text: ' dari ', font: FONT_LATIN, size: 16 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_LATIN, size: 16 })
            ]
          })]
        })
      },
      children
    }]
  });

  return await Packer.toBlob(doc);
}
