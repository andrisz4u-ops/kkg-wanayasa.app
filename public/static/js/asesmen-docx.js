/**
 * asesmen-docx.js
 * Generator file .docx ASLI untuk Asesmen Soal
 * Menggunakan docx@7.x (window.docx) yang di-load via CDN
 *
 * SOLUSI AKSARA SUNDA:
 *  - Fungsi splitBySundanese() memisahkan teks Latin vs Aksara Sunda
 *  - Setiap segmen mendapat TextRun dengan font berbeda:
 *      Latin      → Times New Roman
 *      Aksara Sunda → Noto Sans Sundanese
 *  - Ini adalah satu-satunya cara yang pasti bekerja di Word
 */

const FONT_LATIN  = 'Times New Roman';
const FONT_SUNDA  = 'Noto Sans Sundanese';

/** Konversi point ke twip (1pt = 20 twip) */
const PT = (n) => n * 20;
/** Konversi cm ke twip (1cm = 567.0 twip) */
const CM = (n) => Math.round(n * 567);

// ============================================================
// HELPER: split teks menjadi segmen {text, isSunda}
// ============================================================
function splitBySundanese(text) {
  if (!text) return [{ text: '', isSunda: false }];
  const segments = [];
  let last = 0;
  const re = /[\u1B80-\u1BBF\u1CC0-\u1CCF]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ text: text.slice(last, m.index), isSunda: false });
    }
    segments.push({ text: m[0], isSunda: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), isSunda: false });
  return segments.length ? segments : [{ text, isSunda: false }];
}

// ============================================================
// HELPER: buat array TextRun[] dari teks (mixed font otomatis)
// ============================================================
function makeRuns(text, opts = {}) {
  const { bold = false, italics = false, size = 22, underline } = opts;
  return splitBySundanese(String(text || '')).map(seg =>
    new window.docx.TextRun({
      text: seg.text,
      bold,
      italics,
      size,
      underline,
      font: seg.isSunda ? FONT_SUNDA : FONT_LATIN,
    })
  );
}

// ============================================================
// HELPER: buat Paragraph dengan teks sederhana
// ============================================================
function makePara(text, opts = {}) {
  const {
    bold = false, italics = false, size = 22, underline,
    align = window.docx.AlignmentType.LEFT,
    spaceBefore = 0, spaceAfter = 0,
    indent = {},
  } = opts;
  return new window.docx.Paragraph({
    alignment: align,
    spacing: { before: PT(spaceBefore), after: PT(spaceAfter) },
    indent,
    children: makeRuns(text, { bold, italics, size, underline }),
  });
}

// ============================================================
// HELPER: buat Paragraph dari children array
// ============================================================
function makeParaRaw(children, opts = {}) {
  const {
    align = window.docx.AlignmentType.LEFT,
    spaceBefore = 0, spaceAfter = 0,
    indent = {},
    tabStops,
  } = opts;
  const paraOpts = {
    alignment: align,
    spacing: { before: PT(spaceBefore), after: PT(spaceAfter) },
    indent,
    children: Array.isArray(children) ? children : [children],
  };
  if (tabStops) paraOpts.tabStops = tabStops;
  return new window.docx.Paragraph(paraOpts);
}

// ============================================================
// HELPER: border none (untuk layout table)
// ============================================================
const NO_BORDER = { style: window.docx.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER };
const LINE_BORDER = { style: window.docx.BorderStyle.SINGLE, size: 6, color: '000000' };
const LINE_BORDERS = { top: LINE_BORDER, bottom: LINE_BORDER, left: LINE_BORDER, right: LINE_BORDER, insideH: LINE_BORDER, insideV: LINE_BORDER };

// ============================================================
// HELPER: buat TableCell
// ============================================================
function makeCell(content, opts = {}) {
  const { width, borders = false, shading, vAlign } = opts;
  const bv = borders ? LINE_BORDER : NO_BORDER;
  const bAll = { top: bv, bottom: bv, left: bv, right: bv };
  const cellOpts = {
    children: Array.isArray(content) ? content : [content],
    borders: bAll,
    verticalAlign: vAlign || window.docx.VerticalAlign.TOP,
    margins: { top: PT(3), bottom: PT(3), left: PT(5), right: PT(5) }
  };
  if (width) cellOpts.width = width;
  if (shading) cellOpts.shading = shading;
  return new window.docx.TableCell(cellOpts);
}

// ============================================================
// HELPER: layout opsi PG menggunakan Paragraph + TabStops
// (BUKAN tabel — menghindari semua masalah nested table di Word)
// ============================================================
function makeOpsiParagraphs(opsi, colLayout, indentTwip = 0) {
  const o = opsi || {};
  const s = 22;
  const indentLeft = indentTwip || 0;
  const TabStopType = window.docx.TabStopType;

  if (colLayout === 4) {
    // Semua opsi 1 baris: A. xxx   B. xxx   C. xxx   D. xxx
    const tab1 = indentLeft + 2400;
    const tab2 = indentLeft + 4800;
    const tab3 = indentLeft + 7200;
    return [makeParaRaw([
      new window.docx.TextRun({ text: `A. `, size: s, font: FONT_LATIN }),
      ...makeRuns(o.A || '-', { size: s }),
      new window.docx.TextRun({ text: `\tB. `, size: s, font: FONT_LATIN }),
      ...makeRuns(o.B || '-', { size: s }),
      new window.docx.TextRun({ text: `\tC. `, size: s, font: FONT_LATIN }),
      ...makeRuns(o.C || '-', { size: s }),
      new window.docx.TextRun({ text: `\tD. `, size: s, font: FONT_LATIN }),
      ...makeRuns(o.D || '-', { size: s }),
    ], {
      spaceAfter: 2,
      indent: { left: indentLeft },
      tabStops: [
        { type: TabStopType.LEFT, position: tab1 },
        { type: TabStopType.LEFT, position: tab2 },
        { type: TabStopType.LEFT, position: tab3 },
      ],
    })];
  } else if (colLayout === 2) {
    // 2 baris: A + C, lalu B + D
    const tabMid = indentLeft + 4800;
    return [
      makeParaRaw([
        new window.docx.TextRun({ text: `A. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.A || '-', { size: s }),
        new window.docx.TextRun({ text: `\tC. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.C || '-', { size: s }),
      ], {
        spaceAfter: 0,
        indent: { left: indentLeft },
        tabStops: [{ type: TabStopType.LEFT, position: tabMid }],
      }),
      makeParaRaw([
        new window.docx.TextRun({ text: `B. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.B || '-', { size: s }),
        new window.docx.TextRun({ text: `\tD. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.D || '-', { size: s }),
      ], {
        spaceAfter: 2,
        indent: { left: indentLeft },
        tabStops: [{ type: TabStopType.LEFT, position: tabMid }],
      }),
    ];
  } else {
    // 1 kolom: setiap opsi baris sendiri
    return ['A','B','C','D'].map((k, i) => makeParaRaw([
      new window.docx.TextRun({ text: `${k}. `, size: s, font: FONT_LATIN }),
      ...makeRuns(o[k] || '-', { size: s }),
    ], {
      spaceAfter: i === 3 ? 2 : 0,
      indent: { left: indentLeft + CM(0.4) },
    }));
  }
}

// ============================================================
// HELPER: parse teks soal + markdown table menjadi Paragraphs & docx.Table
// ============================================================
function buildSoalDocxChildren(noText, soalText, indentOpts = {}) {
  const { AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, TextRun } = window.docx;
  const { left = CM(0.6), hanging = CM(0.6) } = indentOpts;
  const items = [];
  const lines = String(soalText || '').split('\n');

  let tableLines = [];
  let isFirstLine = true;

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const rows = tableLines
      .map(l => l.trim())
      .filter(l => l.startsWith('|'))
      .map(l => {
        const cells = l.split('|');
        return cells.slice(1, l.endsWith('|') ? cells.length - 1 : cells.length).map(c => c.trim());
      })
      .filter(row => row.length > 0 && !row.every(c => /^[-: ]+$/.test(c)));

    if (rows.length > 0) {
      const header = rows[0];
      const dataRows = rows.slice(1);
      const BORDER_BLACK = { style: BorderStyle.SINGLE, size: 4, color: '000000' };

      items.push(new Table({
        width: { size: 75, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.LEFT,
        margins: { left: left || CM(0.6) },
        borders: {
          top: BORDER_BLACK,
          bottom: BORDER_BLACK,
          left: BORDER_BLACK,
          right: BORDER_BLACK,
          insideHorizontal: BORDER_BLACK,
          insideVertical: BORDER_BLACK,
        },
        rows: [
          new TableRow({
            tableHeader: true,
            children: header.map(h => new TableCell({
              shading: { fill: 'F1F5F9' },
              margins: { top: PT(3), bottom: PT(3), left: PT(6), right: PT(6) },
              children: [makePara(h, { bold: true, size: 20, align: AlignmentType.CENTER })]
            }))
          }),
          ...dataRows.map(r => new TableRow({
            children: r.map((c, colIdx) => new TableCell({
              margins: { top: PT(3), bottom: PT(3), left: PT(6), right: PT(6) },
              children: [makePara(c, { size: 20, align: colIdx === 0 ? AlignmentType.CENTER : AlignmentType.LEFT })]
            }))
          }))
        ]
      }));
      items.push(makePara('', { spaceAfter: 4 }));
    }
    tableLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      tableLines.push(trimmed);
    } else {
      flushTable();
      if (trimmed.length > 0 || isFirstLine) {
        const runs = (isFirstLine && noText)
          ? [new TextRun({ text: `${noText} `, bold: true, size: 22, font: FONT_LATIN }), ...makeRuns(line, { size: 22 })]
          : [...makeRuns(line, { size: 22 })];
        
        items.push(makeParaRaw(runs, {
          align: AlignmentType.JUSTIFIED,
          spaceBefore: isFirstLine ? 4 : 0,
          spaceAfter: 0,
          indent: isFirstLine ? { left, hanging } : { left }
        }));
        isFirstLine = false;
      }
    }
  }
  flushTable();

  return items;
}

// ============================================================
// HELPER: Convert URL to Base64/Buffer 
// ============================================================
async function fetchSafeImageBuffer(url) {
  try {
    if (!url) throw new Error('Image URL is empty');

    // Handle Data URI (Base64) from Cloudflare Workers AI
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }

    // Handle HTTP / HTTPS URLs
    let fetchUrl = url;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('unsplash.com')) {
        parsed.searchParams.set('w', '400');
        parsed.searchParams.set('h', '300');
        parsed.searchParams.set('fit', 'crop');
        parsed.searchParams.set('fm', 'jpg');
        parsed.searchParams.set('cs', 'tinysrgb');
        fetchUrl = parsed.toString();
      }
    } catch (_) {}

    const resp = await fetch(fetchUrl);
    if (!resp.ok) throw new Error('Fetch not ok: ' + resp.status);
    return await resp.arrayBuffer();
  } catch (e) {
    throw e;
  }
}

// ============================================================
// FUNGSI UTAMA: generateAsesmenDocx
// ============================================================
export async function generateAsesmenDocx(data, formData, kopSuratUrl) {
  if (!window.docx) throw new Error('Library docx belum dimuat. Silakan refresh halaman.');

  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, VerticalAlign,
    PageBreak, ImageRun, Packer,
  } = window.docx;

  const children = [];

  // ── KOP SURAT ──────────────────────────────────────────────
  if (kopSuratUrl) {
    try {
      const resp = await fetch(kopSuratUrl);
      if (!resp.ok) throw new Error('fetch failed');
      const buf  = await resp.arrayBuffer();
      const type = kopSuratUrl.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: PT(6) },
        children: [new ImageRun({ data: buf, transformation: { width: 580, height: 95 }, type })],
      }));
    } catch {
      // fallback teks
      children.push(makePara(formData.namaSekolah || 'SOAL ASESMEN', {
        bold: true, size: 28, align: AlignmentType.CENTER, spaceAfter: 4,
      }));
    }
  }

  // ── JUDUL ──────────────────────────────────────────────────
  const judulMap = { STS: 'SUMATIF TENGAH SEMESTER', SAS: 'SUMATIF AKHIR SEMESTER', ASAT: 'ASESMEN SUMATIF AKHIR TAHUN' };
  const judul = judulMap[formData.jenisUjian] || (formData.jenisUjian || 'PENILAIAN').toUpperCase();
  children.push(makePara(judul, { bold: true, size: 24, align: AlignmentType.CENTER, spaceBefore: 4, spaceAfter: 2 }));
  children.push(makePara('TAHUN PELAJARAN 2026/2027', { bold: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 8 }));

  // ── TABEL IDENTITAS ────────────────────────────────────────
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: LINE_BORDERS,
    rows: [
      new TableRow({ children: [
        makeCell(makePara('Mata Pelajaran', { size: 20 }), { borders: true, width: { size: 15, type: WidthType.PERCENTAGE } }),
        makeCell(makeParaRaw([new TextRun({ text: ': ', size: 20, font: FONT_LATIN }), ...makeRuns(formData.mataPelajaran || '', { size: 20 })]), { borders: true, width: { size: 30, type: WidthType.PERCENTAGE } }),
        makeCell(makePara('Nama Murid', { size: 20 }), { borders: true, width: { size: 15, type: WidthType.PERCENTAGE } }),
        makeCell(makePara(': .....................................................', { size: 20 }), { borders: true, width: { size: 40, type: WidthType.PERCENTAGE } }),
      ]}),
      new TableRow({ children: [
        makeCell(makePara('Kelas / Smt', { size: 20 }), { borders: true }),
        makeCell(makePara(`: ${formData.jenjangKelas || ''} / ${formData.semester || ''}`, { size: 20 }), { borders: true }),
        makeCell(makePara('Hari / Tgl', { size: 20 }), { borders: true }),
        makeCell(makePara(': .................. / .....................', { size: 20 }), { borders: true }),
      ]}),
    ],
  }));
  children.push(makePara('', { spaceAfter: 8 }));

  // ── I. PILIHAN GANDA ───────────────────────────────────────
  if (data.pg && data.pg.length > 0) {
    children.push(makePara('I. PILIHAN GANDA', { bold: true, size: 22, spaceBefore: 6, spaceAfter: 4 }));
    children.push(makePara('Berilah tanda silang (X) pada huruf A, B, C, atau D pada jawaban yang paling benar!',
      { italics: true, size: 19, spaceAfter: 6 }));

    for (const q of data.pg) {
      const opts = q.opsi || {};
      const vals = Object.values(opts);
      const allShort = vals.every(v => (v || '').length < 18);
      const anyLong  = vals.some(v  => (v || '').length > 35);
      let colLayout = allShort ? 4 : anyLong ? 1 : 2;
      // Jika ada gambar, paksa 1 kolom karena space terbatas
      if (q.gambar && q.gambar.url) colLayout = 1;

      // Nomor soal + teks (hanging indent)
      const INDENT_LEFT    = CM(0.6);
      const HANGING        = CM(0.6);

      if (q.gambar && q.gambar.url) {
        try {
          const buf = await fetchSafeImageBuffer(q.gambar.url);
          
          const cell1 = new window.docx.TableCell({
             children: [makeParaRaw([new TextRun({ text: `${q.no}. `, bold: true, size: 22, font: FONT_LATIN })], { align: AlignmentType.LEFT })],
             borders: NO_BORDERS,
             width: { size: 5, type: window.docx.WidthType.PERCENTAGE },
             margins: { top: 0, bottom: 0, left: 0, right: 0 },
             verticalAlign: window.docx.VerticalAlign.TOP
          });

          const cell2 = new window.docx.TableCell({
             children: [
                new Paragraph({
                   alignment: AlignmentType.LEFT,
                   spacing: { before: PT(4) },
                   children: [new ImageRun({ data: buf, transformation: { width: 160, height: 120 }, type: 'jpeg' })]
                })
             ],
             borders: NO_BORDERS,
             width: { size: 25, type: window.docx.WidthType.PERCENTAGE },
             margins: { top: 0, bottom: 0, left: 0, right: CM(0.2) },
             verticalAlign: window.docx.VerticalAlign.TOP
          });

          const cell3Children = [];
          cell3Children.push(...buildSoalDocxChildren('', q.soal, { left: 0, hanging: 0 }));
          cell3Children.push(...makeOpsiParagraphs(opts, colLayout, 0));

          const cell3 = new window.docx.TableCell({
             children: cell3Children,
             borders: NO_BORDERS,
             width: { size: 70, type: window.docx.WidthType.PERCENTAGE },
             margins: { top: 0, bottom: 0, left: CM(0.2), right: 0 },
             verticalAlign: window.docx.VerticalAlign.TOP
          });

          children.push(new window.docx.Table({
             width: { size: 100, type: window.docx.WidthType.PERCENTAGE },
             borders: NO_BORDERS,
             rows: [new window.docx.TableRow({ children: [cell1, cell2, cell3] })]
          }));
          children.push(makePara('', { spaceAfter: 8 }));
          
        } catch (e) {
          console.error("Gagal load gambar PG docx", e);
          const INDENT_LEFT = CM(0.6);
          children.push(...buildSoalDocxChildren(`${q.no}.`, q.soal, { left: INDENT_LEFT, hanging: HANGING }));
          children.push(...makeOpsiParagraphs(opts, colLayout, INDENT_LEFT));
        }
      } else {
        children.push(...buildSoalDocxChildren(`${q.no}.`, q.soal, { left: INDENT_LEFT, hanging: HANGING }));
        children.push(...makeOpsiParagraphs(opts, colLayout, INDENT_LEFT));
      }
    }
  }

  // ── II. ISIAN ──────────────────────────────────────────────
  if (data.isian && data.isian.data && data.isian.data.length > 0) {
    const isianType = data.isian.type || 'Standard';
    const isianTitles = {
      Standard:    ['II. ISIAN SINGKAT', 'Isilah titik-titik di bawah ini dengan jawaban yang tepat!'],
      Crossword:   ['II. TEKA-TEKI SILANG', 'Isilah jawaban teka-teki silang berikut secara Mendatar atau Menurun sesuai petunjuk!'],
      Menjodohkan: ['II. MENJODOHKAN', 'Pasangkanlah pernyataan berikut dengan jawaban yang tepat!'],
    };
    const [isianTitle, isianDesc] = isianTitles[isianType] || isianTitles.Standard;

    children.push(makePara(isianTitle, { bold: true, size: 22, spaceBefore: 10, spaceAfter: 4 }));
    children.push(makePara(isianDesc, { italics: true, size: 19, spaceAfter: 6 }));

    if (isianType === 'Menjodohkan') {
      const rightCol = [...data.isian.data].map(q => q.kunci).sort(() => Math.random() - 0.5);
      data.isian.data.forEach((q, i) => {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [new TableRow({ children: [
            makeCell(makeParaRaw([new TextRun({ text: `${q.no}. `, bold: true, size: 22, font: FONT_LATIN }), ...makeRuns(q.soal, { size: 22 })]), { width: { size: 42, type: WidthType.PERCENTAGE } }),
            makeCell(makePara('..................', { size: 22, align: AlignmentType.CENTER }), { width: { size: 16, type: WidthType.PERCENTAGE } }),
            makeCell(makeParaRaw([new TextRun({ text: `${String.fromCharCode(65+i)}. `, bold: true, size: 22, font: FONT_LATIN }), ...makeRuns(rightCol[i] || '', { size: 22 })]), { width: { size: 42, type: WidthType.PERCENTAGE } }),
          ]})],
        }));
        children.push(makePara('', { spaceAfter: 2 }));
      });
    } else if (isianType === 'Crossword' && data.isian.crossword && data.isian.crossword.success && data.isian.crossword.grid) {
      // ── CROSSWORD GRID ──────────────────────────────────────
      const cw = data.isian.crossword;
      const CELL_SIZE = CM(0.75); // ~0.75cm per cell
      const CW_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
      const CW_NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

      const gridRows = [];
      for (let r = 0; r < cw.grid.length; r++) {
        const rowCells = [];
        for (let c = 0; c < cw.grid[r].length; c++) {
          const char = cw.grid[r][c];
          const isLetterCell = char !== ' ';

          // Check if this cell has a placement number
          let cellNum = '';
          if (isLetterCell) {
            const p = cw.placements.find(pl => pl.row === r && pl.col === c);
            if (p && p.number != null) cellNum = String(p.number);
          }

          if (isLetterCell) {
            // Bordered cell with optional number label
            const cellChildren = [];
            if (cellNum) {
              cellChildren.push(new Paragraph({
                spacing: { before: 0, after: 0, line: 180 },
                children: [new TextRun({ text: cellNum, size: 12, bold: true, font: FONT_LATIN })],
              }));
            } else {
              cellChildren.push(new Paragraph({
                spacing: { before: 0, after: 0, line: 180 },
                children: [new TextRun({ text: ' ', size: 12, font: FONT_LATIN })],
              }));
            }
            rowCells.push(new TableCell({
              children: cellChildren,
              width: { size: CELL_SIZE, type: WidthType.DXA },
              borders: { top: CW_BORDER, bottom: CW_BORDER, left: CW_BORDER, right: CW_BORDER },
              margins: { top: PT(1), bottom: PT(0), left: PT(2), right: PT(1) },
              verticalAlign: VerticalAlign.TOP,
            }));
          } else {
            // Empty/invisible cell
            rowCells.push(new TableCell({
              children: [new Paragraph({
                spacing: { before: 0, after: 0, line: 180 },
                children: [new TextRun({ text: '', size: 12, font: FONT_LATIN })],
              })],
              width: { size: CELL_SIZE, type: WidthType.DXA },
              borders: { top: CW_NO_BORDER, bottom: CW_NO_BORDER, left: CW_NO_BORDER, right: CW_NO_BORDER },
              margins: { top: PT(1), bottom: PT(0), left: PT(2), right: PT(1) },
            }));
          }
        }
        gridRows.push(new TableRow({
          children: rowCells,
          height: { value: CELL_SIZE, rule: window.docx.HeightRule.EXACT },
        }));
      }

      // Build column widths array for the grid table
      const colCount = cw.grid[0] ? cw.grid[0].length : 0;
      const columnWidths = Array(colCount).fill(CELL_SIZE);

      children.push(new Table({
        rows: gridRows,
        width: { size: 0, type: WidthType.AUTO },
        columnWidths: columnWidths,
        layout: window.docx.TableLayoutType.FIXED,
        borders: { top: CW_NO_BORDER, bottom: CW_NO_BORDER, left: CW_NO_BORDER, right: CW_NO_BORDER, insideH: CW_NO_BORDER, insideV: CW_NO_BORDER },
      }));

      children.push(makePara('', { spaceAfter: 10 }));

      // ── CLUE LISTS: MENDATAR & MENURUN ────────────────────────
      const mendatar = [];
      const menurun = [];
      cw.placements.forEach(p => {
        const qData = data.isian.data[p.originalIndex];
        if (qData) {
          const clueText = qData.soal.replace(/^(Mendatar:|Menurun:)\s*/i, '').trim();
          if (p.direction === 'H') mendatar.push({ num: p.number, text: clueText });
          else menurun.push({ num: p.number, text: clueText });
        }
      });
      mendatar.sort((a, b) => a.num - b.num);
      menurun.sort((a, b) => a.num - b.num);

      // Build clue paragraphs for left (Mendatar) column
      const mendatarParas = [
        makePara('MENDATAR', { bold: true, size: 22, underline: { type: window.docx.UnderlineType.SINGLE }, spaceAfter: 4 }),
        ...mendatar.map(t => makeParaRaw([
          new TextRun({ text: `${t.num}. `, bold: true, size: 20, font: FONT_LATIN }),
          ...makeRuns(t.text, { size: 20 }),
        ], { align: AlignmentType.JUSTIFIED, spaceAfter: 3 })),
      ];

      // Build clue paragraphs for right (Menurun) column
      const menurunParas = [
        makePara('MENURUN', { bold: true, size: 22, underline: { type: window.docx.UnderlineType.SINGLE }, spaceAfter: 4 }),
        ...menurun.map(t => makeParaRaw([
          new TextRun({ text: `${t.num}. `, bold: true, size: 20, font: FONT_LATIN }),
          ...makeRuns(t.text, { size: 20 }),
        ], { align: AlignmentType.JUSTIFIED, spaceAfter: 3 })),
      ];

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [new TableRow({ children: [
          makeCell(mendatarParas, { width: { size: 50, type: WidthType.PERCENTAGE } }),
          makeCell(menurunParas, { width: { size: 50, type: WidthType.PERCENTAGE } }),
        ]})],
      }));
    } else {
      for (const q of data.isian.data) {
        children.push(...buildSoalDocxChildren(`${q.no}.`, q.soal, { left: CM(0.5), hanging: CM(0.5) }));
      }
    }
  }

  // ── III. URAIAN ────────────────────────────────────────────
  if (data.uraian && data.uraian.length > 0) {
    children.push(makePara('III. URAIAN', { bold: true, size: 22, spaceBefore: 10, spaceAfter: 4 }));
    children.push(makePara('Jawablah pertanyaan di bawah ini dengan jelas dan tepat!', { italics: true, size: 19, spaceAfter: 6 }));
    for (const q of data.uraian) {
      children.push(...buildSoalDocxChildren(`${q.no}.`, q.soal, { left: CM(0.5), hanging: CM(0.5) }));
    }
  }

  // ── LEMBAR PENGESAHAN ──────────────────────────────────────
  children.push(makePara('', { spaceBefore: 30 }));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [new TableRow({ children: [
      makeCell([
        makePara('Mengetahui,', { size: 22, align: AlignmentType.CENTER }),
        makePara('Kepala Sekolah', { size: 22, align: AlignmentType.CENTER }),
        makePara('', { spaceAfter: 60 }),
        makeParaRaw(makeRuns(formData.namaKepalaSekolah || '..............................', { bold: true, size: 22 }), { align: AlignmentType.CENTER }),
        makePara(`NIP. ${formData.nipKepalaSekolah || '..............................'}`, { size: 22, align: AlignmentType.CENTER }),
      ]),
      makeCell([
        makePara('\u00a0', { size: 22, align: AlignmentType.CENTER }),
        makePara('Guru Pengampu', { size: 22, align: AlignmentType.CENTER }),
        makePara('', { spaceAfter: 60 }),
        makeParaRaw(makeRuns(formData.namaGuru || '..............................', { bold: true, size: 22 }), { align: AlignmentType.CENTER }),
        makePara(`NIP. ${formData.nipGuru || '..............................'}`, { size: 22, align: AlignmentType.CENTER }),
      ]),
    ]})],
  }));

  // ── PAGE BREAK ─────────────────────────────────────────────
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── KUNCI JAWABAN ──────────────────────────────────────────
  children.push(makePara('KUNCI JAWABAN & PEDOMAN PENSKORAN', { bold: true, size: 24, align: AlignmentType.CENTER, spaceAfter: 2 }));
  children.push(makePara(`${formData.mataPelajaran || ''} \u2014 ${formData.jenjangKelas || ''} / ${formData.semester || ''}`,
    { bold: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 10 }));

  if (data.pg && data.pg.length > 0) {
    children.push(makePara('I. KUNCI PILIHAN GANDA', { bold: true, size: 22, spaceAfter: 4 }));
    const rows5 = Math.ceil(data.pg.length / 5);
    const pgCols = Array.from({ length: 5 }, (_, c) =>
      Array.from({ length: rows5 }, (_, r) => data.pg[r * 5 + c]).filter(Boolean)
    );
    children.push(new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [new TableRow({ children: pgCols.map(col =>
        makeCell(col.map(q => makeParaRaw([
          new TextRun({ text: `${q.no}.  `, bold: true, size: 20, font: FONT_LATIN }),
          new TextRun({ text: q.kunci, size: 20, font: FONT_LATIN }),
        ])))
      )})],
    }));
    children.push(makePara('', { spaceAfter: 6 }));
  }

  if (data.isian && data.isian.data && data.isian.data.length > 0) {
    const isianType = data.isian.type || 'Standard';
    const kunciIsianTitle = isianType === 'Crossword' ? 'II. KUNCI TEKA-TEKI SILANG' : 'II. KUNCI ISIAN';
    children.push(makePara(kunciIsianTitle, { bold: true, size: 22, spaceAfter: 4 }));
    // Sort by number for crossword (placement numbers may differ from data order)
    const sortedIsian = [...data.isian.data].sort((a, b) => (a.no || 0) - (b.no || 0));
    children.push(new Table({
      width: { size: 70, type: WidthType.PERCENTAGE },
      borders: LINE_BORDERS,
      rows: [
        new TableRow({ tableHeader: true, children: [
          makeCell(makePara('No', { bold: true, size: 20, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 15, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Kunci Jawaban', { bold: true, size: 20, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' } }),
        ]}),
        ...sortedIsian.map(q => new TableRow({ children: [
          makeCell(makePara(String(q.no), { size: 20, align: AlignmentType.CENTER }), { borders: true }),
          makeCell(makeParaRaw(makeRuns(q.kunci, { size: 20 })), { borders: true }),
        ]})),
      ],
    }));
    children.push(makePara('', { spaceAfter: 6 }));
  }

  if (data.uraian && data.uraian.length > 0) {
    children.push(makePara('III. PEDOMAN PENSKORAN URAIAN', { bold: true, size: 22, spaceAfter: 4 }));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: LINE_BORDERS,
      rows: [
        new TableRow({ tableHeader: true, children: [
          makeCell(makePara('No', { bold: true, size: 20, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 5, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Kriteria Jawaban', { bold: true, size: 20, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 75, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Skor Maks', { bold: true, size: 20, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 20, type: WidthType.PERCENTAGE } }),
        ]}),
        ...data.uraian.map(q => new TableRow({ children: [
          makeCell(makePara(String(q.no), { size: 20, align: AlignmentType.CENTER }), { borders: true }),
          makeCell([
            makeParaRaw([new TextRun({ text: 'Jawaban: ', bold: true, size: 20, font: FONT_LATIN }), ...makeRuns(q.kunci, { size: 20 })]),
            makePara(''),
            makePara('Rubrik:', { bold: true, size: 20 }),
            ...(q.rubrik_skor ? Object.entries(q.rubrik_skor).map(([k, v]) =>
              makeParaRaw([new TextRun({ text: `\u2013 ${k}: `, size: 19, font: FONT_LATIN }), ...makeRuns(String(v), { size: 19 })])
            ) : [makePara('\u2013', { size: 19 })]),
          ], { borders: true }),
          makeCell(makePara('TBD', { size: 20, bold: true, align: AlignmentType.CENTER }), { borders: true }),
        ]})),
      ],
    }));
  }

  // ── BUILD DOCUMENT ─────────────────────────────────────────
  const { Header, Footer, PageNumber, TabStopPosition, TabStopType } = window.docx;

  // Jenis ujian untuk header
  const jenisUjianMap = { STS: 'Sumatif Tengah Semester', SAS: 'Sumatif Akhir Semester', ASAT: 'Asesmen Sumatif Akhir Tahun' };
  const jenisUjianText = jenisUjianMap[formData.jenisUjian] || (formData.jenisUjian || 'Ulangan Harian');
  const headerText = `${jenisUjianText} - ${formData.mataPelajaran || ''} - ${formData.jenjangKelas || ''}`;

  // LINE SPACING 1.15 (1.15 × 240 twip = 276 twip)
  const LINE_SPACING_115 = 276;

  const doc = new Document({
    creator: 'KKG Gugus 3 Wanayasa',
    description: `Asesmen ${formData.mataPelajaran || ''} ${formData.jenjangKelas || ''}`,
    styles: {
      default: {
        document: {
          run: { font: FONT_LATIN, size: 22 },
          paragraph: {
            spacing: { line: LINE_SPACING_115 },
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    CM(1.27),
            bottom: CM(1.27),
            left:   CM(1.27),
            right:  CM(1.27),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: PT(4) },
              children: [
                new TextRun({ text: headerText, size: 16, italics: true, font: FONT_LATIN, color: '888888' }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Halaman ', size: 16, font: FONT_LATIN, color: '888888' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT_LATIN, color: '888888' }),
                new TextRun({ text: ' dari ', size: 16, font: FONT_LATIN, color: '888888' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: FONT_LATIN, color: '888888' }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}
