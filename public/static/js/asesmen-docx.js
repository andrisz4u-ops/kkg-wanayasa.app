/**
 * asesmen-docx.js
 * Generator file .docx ASLI untuk Asesmen Soal
 * Menggunakan docx@7.x (window.docx) yang di-load via CDN
 *
 * SOLUSI AKSARA SUNDA:
 *  - Fungsi splitBySundanese() memisahkan teks Latin vs Aksara Sunda
 *  - Setiap segmen mendapat TextRun dengan font berbeda:
 *      Latin      â†’ Times New Roman
 *      Aksara Sunda â†’ Noto Sans Sundanese
 *  - Ini adalah satu-satunya cara yang pasti bekerja di Word
 */

import { getActiveTahunAjaran } from './utils.js';
import {
  ASSESSMENT_IMAGE_LIMITS,
  AssessmentImagePreflightError,
  collectExpectedAssessmentImages,
  preflightAssessmentImages,
  validatePreparedAssessmentImages,
} from './assessment-image-preflight.js';

const FONT_LATIN  = 'Times New Roman';
const FONT_SUNDA  = 'Noto Sans Sundanese';

/** Konversi point ke twip (1pt = 20 twip) */
const PT = (n) => n * 20;
/** Konversi cm ke twip (1cm = 567.0 twip) */
const CM = (n) => Math.round(n * 567);

// A4 21cm dikurangi margin kiri/kanan 1,27cm
const PAGE_TEXT_WIDTH = CM(18.4);
const QUESTION_INDENT = CM(0.6);
const IMAGE_CELL_TEXT_WIDTH = PAGE_TEXT_WIDTH - QUESTION_INDENT;
const IMAGE_MAX_WIDTH_CM = 7;
const IMAGE_MAX_HEIGHT_CM = 5;
const CM_TO_PX = 96 / 2.54;

// ============================================================
// HELPER: split teks menjadi segmen {text, isSunda}
// ============================================================
function splitBySundanese(text) {
  if (!text) return [{ text: '', isSunda: false }];
  const segments = [];
  let last = 0;
  const re = /[\u1B80-\u1BBF\u1CC0-\u1CCF]+/g;
  let m;
  while (true) {
    m = re.exec(text);
    if (m === null) break;
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

export function selectOptionColumns(opsi) {
  const longest = Object.values(opsi || {})
    .reduce((max, value) => Math.max(max, String(value || '').length), 0);
  return longest <= 12 ? 4 : longest <= 30 ? 2 : 1;
}

export function assessmentImageDisplaySize(image) {
  const width = Number(image && image.width);
  const height = Number(image && image.height);
  if (!(width > 0) || !(height > 0)) return { width: 220, height: 145 };
  const maxWidthPx = IMAGE_MAX_WIDTH_CM * CM_TO_PX;
  const maxHeightPx = IMAGE_MAX_HEIGHT_CM * CM_TO_PX;
  const scale = Math.min(maxWidthPx / width, maxHeightPx / height, 2);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function makeAssessmentImageParagraph(image) {
  const size = assessmentImageDisplaySize(image);
  return new window.docx.Paragraph({
    alignment: window.docx.AlignmentType.CENTER,
    keepNext: true,
    spacing: { before: PT(3), after: PT(4) },
    children: [new window.docx.ImageRun({
      data: image.buffer,
      transformation: size,
      type: image.type,
    })],
  });
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
// (BUKAN tabel â€” menghindari semua masalah nested table di Word)
// ============================================================
function makeOpsiParagraphs(opsi, colLayout, indentTwip = 0, availableWidth = PAGE_TEXT_WIDTH, spaceAfterLast = 2) {
  const o = opsi || {};
  const s = 22;
  const indentLeft = indentTwip || 0;
  const TabStopType = window.docx.TabStopType;
  const usable = Math.max(CM(3), (availableWidth || PAGE_TEXT_WIDTH) - indentLeft);
  const columnWidth = Math.floor(usable / (colLayout || 1));
  const tabs = (count) => Array.from({ length: count }, (_, index) => ({
    type: TabStopType.LEFT,
    position: indentLeft + columnWidth * (index + 1),
  }));

  if (colLayout === 4) {
    // Semua opsi 1 baris: A. xxx   B. xxx   C. xxx   D. xxx
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
      spaceAfter: spaceAfterLast,
      indent: { left: indentLeft },
      tabStops: tabs(3),
    })];
  } else if (colLayout === 2) {
    // 2 baris: A + C, lalu B + D
    return [
      makeParaRaw([
        new window.docx.TextRun({ text: `A. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.A || '-', { size: s }),
        new window.docx.TextRun({ text: `\tC. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.C || '-', { size: s }),
      ], {
        spaceAfter: 0,
        indent: { left: indentLeft },
        tabStops: tabs(1),
      }),
      makeParaRaw([
        new window.docx.TextRun({ text: `B. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.B || '-', { size: s }),
        new window.docx.TextRun({ text: `\tD. `, size: s, font: FONT_LATIN }),
        ...makeRuns(o.D || '-', { size: s }),
      ], {
        spaceAfter: spaceAfterLast,
        indent: { left: indentLeft },
        tabStops: tabs(1),
      }),
    ];
  } else {
    // 1 kolom: setiap opsi baris sendiri
    return ['A','B','C','D'].map((k, i) => makeParaRaw([
      new window.docx.TextRun({ text: `${k}. `, size: s, font: FONT_LATIN }),
      ...makeRuns(o[k] || '-', { size: s }),
    ], {
      spaceAfter: i === 3 ? spaceAfterLast : 0,
      indent: { left: indentLeft + CM(0.4) },
    }));
  }
}

// Helper: bersihkan segala artefak sisa prompt, visual_stimulus, gambar_keyword dari naskah soal
function cleanPromptDebris(text) {
  if (!text) return '';
  let s = String(text);

  // 1. Hapus tag kurung siku prompt: [gambar: ...], [visual_stimulus: ...], [diagram: ...], dsb.
  s = s.replace(/\[(?:visual_stimulus|stimulus|visual|gambar|foto|diagram|ilustrasi|deskripsi|keterangan)[^\]]*\]\s*:?\s*/gi, '');
  s = s.replace(/\[[^\]]*\]\s*:?\s*/g, '');

  // 2. Hapus blok visual_stimulus { ... } (dengan balanced brace counting untuk mendukung nested object/array)
  let safetyCounter = 0;
  while (safetyCounter++ < 20) {
    const match = s.match(/visual_stimulus\s*:?\s*\{/i);
    if (!match || match.index === undefined) break;

    const startIdx = match.index;
    const braceStart = s.indexOf('{', startIdx);
    let depth = 0;
    let endIdx = -1;

    for (let i = braceStart; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      let pre = s.substring(0, startIdx);
      let post = s.substring(endIdx + 1);
      if (pre.endsWith('\n') && post.startsWith('\n')) {
        post = post.substring(1);
      }
      s = pre + post;
    } else {
      const newlineIdx = s.indexOf('\n', startIdx);
      if (newlineIdx !== -1) {
        s = s.substring(0, startIdx) + s.substring(newlineIdx);
      } else {
        s = s.substring(0, startIdx);
      }
      break;
    }
  }

  // 3. Hapus objek JSON stimulus mandiri yang bocor di naskah soal (misal {"type": "sudut", "params": {...}})
  safetyCounter = 0;
  while (safetyCounter++ < 20) {
    const match = s.match(/\{\s*"type"\s*:\s*"[a-zA-Z0-9_-]+"/i);
    if (!match || match.index === undefined) break;

    const startIdx = match.index;
    let depth = 0;
    let endIdx = -1;

    for (let i = startIdx; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      let pre = s.substring(0, startIdx);
      let post = s.substring(endIdx + 1);
      if (pre.endsWith('\n') && post.startsWith('\n')) {
        post = post.substring(1);
      }
      s = pre + post;
    } else {
      break;
    }
  }

  // 4. Bersihkan sisa-sisa keyword prompt baris tunggal
  s = s.replace(/^[ \t]*visual_stimulus\s*:?[^\n\r]*\r?\n?/gim, '');
  s = s.replace(/visual_stimulus\s*:[^\n\r]*/gi, '');
  s = s.replace(/^[ \t]*gambar_keyword\s*:?[^\n\r]*\r?\n?/gim, '');
  s = s.replace(/gambar_keyword\s*:[^\n\r]*/gi, '');
  s = s.replace(/^[ \t]*gambar_prompt_en\s*:?[^\n\r]*\r?\n?/gim, '');
  s = s.replace(/gambar_prompt_en\s*:[^\n\r]*/gi, '');

  // 5. Bersihkan titik dua yatim di awal baris akibat tag prompt yang terhapus (misal ": Karbon dioksida...")
  s = s.replace(/^[ \t]*:[ \t]*/gm, '');

  // 6. Bersihkan spasi horizontal berlebih dan baris kosong berlebih
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

  return s;
}

// Helper: normalisasi teks soal agar tabel (Markdown, tabel titik dua, maupun spasi tabular) terformat rapi
function normalizeSoalMarkdown(text) {
  if (!text) return '';
  let clean = cleanPromptDebris(text);

  // 1. Pisahkan baris-baris tabel yang tergabung dalam satu baris (| ... | | ... |)
  clean = clean.replace(/(?<=\|)\s{1,4}(?=\|)/g, '\n');

  const rawLines = clean.split(/\r?\n/);
  const normalizedLines = [];

  // 2. Pre-process baris tabel berpola titik dua (misal: 'Hari : Senin | Selasa | ...')
  for (let rawLine of rawLines) {
    let line = rawLine.trim();
    if (!line) continue;

    if (line.includes('|')) {
      const firstPipe = line.indexOf('|');
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1 && colonIdx < firstPipe) {
        line = line.replace(/\s*:\s*/, ' | ');
      }
      if (!line.startsWith('|')) line = '| ' + line;
      if (!line.endsWith('|')) line = line + ' |';
      normalizedLines.push(line);
    } else {
      normalizedLines.push(line);
    }
  }

  // 3. Pre-process baris tabel tanpa pipa yang dipisahkan oleh tab atau 2+ spasi (tabular)
  const outLines = [];
  let spaceTableCandidates = [];

  function flushSpaceCandidates() {
    if (spaceTableCandidates.length >= 2) {
      const colCounts = spaceTableCandidates.map(r => r.length);
      const firstCol = colCounts[0];
      const isConsistent = colCounts.every(c => c === firstCol && c >= 2);
      if (isConsistent) {
        outLines.push('| ' + spaceTableCandidates[0].join(' | ') + ' |');
        outLines.push('| ' + spaceTableCandidates[0].map(() => '---').join(' | ') + ' |');
        for (let k = 1; k < spaceTableCandidates.length; k++) {
          outLines.push('| ' + spaceTableCandidates[k].join(' | ') + ' |');
        }
        spaceTableCandidates = [];
        return;
      }
    }
    for (const raw of spaceTableCandidates) {
      outLines.push(raw.join('    '));
    }
    spaceTableCandidates = [];
  }

  for (let line of normalizedLines) {
    if (line.startsWith('|')) {
      flushSpaceCandidates();
      outLines.push(line);
      continue;
    }

    const cells = line.split(/\t|\s{2,}/).map(c => c.trim()).filter(Boolean);
    const isSentence = /[.?!]$/.test(line) || /^\d+\.\s/.test(line) || cells.length < 2 || line.length > 140;

    if (!isSentence && cells.length >= 2) {
      spaceTableCandidates.push(cells);
    } else {
      flushSpaceCandidates();
      outLines.push(line);
    }
  }
  flushSpaceCandidates();

  return outLines.join('\n');
}

// Helper: hitung lebar kolom secara cerdas & proporsional berdasarkan panjang teks isi tabel (seperti di Canvas web)
function computeColWidths(rows) {
  const colCount = Math.max(...rows.map(r => r.length));
  const maxLenPerCol = Array(colCount).fill(0);

  for (const r of rows) {
    for (let c = 0; c < colCount; c++) {
      const cellText = String(r[c] || '');
      if (cellText.length > maxLenPerCol[c]) {
        maxLenPerCol[c] = cellText.length;
      }
    }
  }

  // Bobot ideal per kolom dalam twips (1 pt = 20 twip, 1 cm = 567 twip)
  // Karakter rata-rata 130 twips + 600 twips padding, minimum 1200 twips (~2.1 cm)
  let idealWidths = maxLenPerCol.map(len => {
    return Math.max(len * 130 + 600, 1200);
  });

  let totalWidth = idealWidths.reduce((a, b) => a + b, 0);
  const MAX_TABLE_WIDTH = CM(16.0); // Maksimum lebar tabel pada kertas A4 (dalam margin)

  if (totalWidth > MAX_TABLE_WIDTH) {
    const scale = MAX_TABLE_WIDTH / totalWidth;
    idealWidths = idealWidths.map(w => Math.max(Math.round(w * scale), 800));
    totalWidth = idealWidths.reduce((a, b) => a + b, 0);
  }

  return { widths: idealWidths, totalWidth };
}

// ============================================================
// HELPER: parse teks soal + markdown table menjadi Paragraphs & docx.Table
// ============================================================
function buildSoalDocxChildren(noText, soalText, indentOpts = {}) {
  const { AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, TextRun } = window.docx;
  const { left = CM(0.6), hanging = CM(0.6) } = indentOpts;
  const items = [];
  const cleanSoal = normalizeSoalMarkdown(soalText);
  const lines = cleanSoal.split('\n');

  let tableLines = [];
  let isFirstLine = true;

  const isTableDivider = (line) => {
    const trimmed = line.trim();
    return /^[:\s\-|]+$/.test(trimmed) && trimmed.includes('-') && (trimmed.includes('|') || trimmed.includes('+'));
  };

  const isPossibleTableRow = (line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && (trimmed.includes('|') || isTableDivider(trimmed));
  };

  const parseTableRow = (line) => {
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.substring(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1);
    return trimmed.split('|').map(c => c.trim());
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const hasDivider = tableLines.some(l => isTableDivider(l));
    if (!hasDivider && tableLines.length < 2) {
      for (const rawLine of tableLines) {
        if (rawLine.trim().length > 0 || isFirstLine) {
          const runs = (isFirstLine && noText)
            ? [new TextRun({ text: `${noText} `, bold: true, size: 22, font: FONT_LATIN }), ...makeRuns(rawLine, { size: 22 })]
            : [...makeRuns(rawLine, { size: 22 })];
          items.push(makeParaRaw(runs, {
            align: AlignmentType.JUSTIFIED,
            spaceBefore: isFirstLine ? 4 : 2,
            spaceAfter: 2,
            indent: isFirstLine ? { left, hanging } : { left }
          }));
          isFirstLine = false;
        }
      }
      tableLines = [];
      return;
    }

    const rows = tableLines
      .filter(l => !isTableDivider(l))
      .map(parseTableRow)
      .filter(row => row.length > 0);

    if (rows.length > 0) {
      const header = rows[0];
      const dataRows = rows.slice(1);
      const BORDER_BLACK = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
      const tableIndent = (left !== undefined && left !== null) ? left : CM(0.6);
      const { widths, totalWidth } = computeColWidths(rows);
      const colCount = widths.length;
      const fontSize = colCount >= 6 ? 18 : 20;
      const cellPad = colCount >= 6 ? PT(4) : PT(6);

      items.push(new Table({
        width: { size: totalWidth, type: WidthType.DXA },
        columnWidths: widths,
        alignment: AlignmentType.LEFT,
        indent: tableIndent > 0 ? { size: tableIndent, type: WidthType.DXA } : undefined,
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
            children: header.map((h, colIdx) => new TableCell({
              width: { size: widths[colIdx] || widths[widths.length - 1], type: WidthType.DXA },
              shading: { fill: 'F1F5F9' },
              margins: { top: PT(4), bottom: PT(4), left: cellPad, right: cellPad },
              children: [makePara(h, { bold: true, size: fontSize, align: AlignmentType.CENTER })]
            }))
          }),
          ...dataRows.map(r => new TableRow({
            children: r.map((c, colIdx) => {
              const isNum = /^\d+([.,]\d+)?\s*(Â°C|%|cm|m|kg|g|km|menit|detik|jam|Rp)?$/i.test(c) || (colIdx === 0 && /^\d+$/.test(c));
              return new TableCell({
                width: { size: widths[colIdx] || widths[widths.length - 1], type: WidthType.DXA },
                margins: { top: PT(4), bottom: PT(4), left: cellPad, right: cellPad },
                children: [makePara(c, { size: fontSize, align: isNum ? AlignmentType.CENTER : AlignmentType.LEFT })]
              });
            })
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
    if (isPossibleTableRow(trimmed)) {
      tableLines.push(trimmed);
    } else {
      flushTable();
      if (trimmed.length > 0 || isFirstLine) {
        const runs = (isFirstLine && noText)
          ? [new TextRun({ text: `${noText} `, bold: true, size: 22, font: FONT_LATIN }), ...makeRuns(line, { size: 22 })]
          : [...makeRuns(line, { size: 22 })];
        
        items.push(makeParaRaw(runs, {
          align: AlignmentType.JUSTIFIED,
          spaceBefore: isFirstLine ? 4 : 2,
          spaceAfter: 2,
          indent: isFirstLine ? { left, hanging } : { left }
        }));
        isFirstLine = false;
      }
    }
  }
  flushTable();

  return items;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_ELEMENTS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'defs',
  'lineargradient', 'radialgradient', 'stop', 'title', 'desc', 'marker', 'clippath', 'pattern', 'filter',
  'fegaussianblur', 'fedropshadow', 'femerge', 'femergenode',
]);
const SVG_ATTRIBUTES = new Set([
  'xmlns', 'xmlns:xlink', 'viewbox', 'preserveaspectratio', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-opacity', 'opacity', 'transform', 'id', 'offset', 'stop-color', 'stop-opacity', 'gradientunits',
  'gradienttransform', 'spreadmethod', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'href', 'xlink:href',
  // Presentational & accessibility metadata emitted by the visual engine.
  'style', 'role', 'aria-labelledby', 'font-style', 'letter-spacing', 'stroke-miterlimit', 'dx', 'dy',
  'clip-path', 'filter', 'in', 'result', 'stddeviation', 'flood-color', 'flood-opacity',
  'marker-start', 'marker-end', 'markerwidth', 'markerheight', 'orient', 'refx', 'refy',
  'patternunits', 'patterntransform',
]);

function decodeSvgDataUri(value, maxBytes) {
  const comma = value.indexOf(',');
  if (comma < 0 || !/^data:image\/svg\+xml(?:;|,)/i.test(value)) throw new Error('Invalid SVG data URL');
  const header = value.slice(0, comma).toLowerCase();
  const payload = value.slice(comma + 1);
  if (payload.length > maxBytes * 4) throw new Error('SVG input exceeds size limit');
  let decoded;
  if (header.includes(';base64')) {
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    const decodedLength = payload.length % 4 === 0 ? (payload.length / 4) * 3 - padding : Number.POSITIVE_INFINITY;
    if (decodedLength < 0 || decodedLength > maxBytes || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) throw new Error('SVG input exceeds size limit');
    const binary = window.atob(payload);
    if (binary.length > maxBytes) throw new Error('SVG input exceeds size limit');
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } else {
    decoded = decodeURIComponent(payload);
    if (new TextEncoder().encode(decoded).byteLength > maxBytes) throw new Error('SVG input exceeds size limit');
  }
  return decoded;
}

export function sanitizeAssessmentSvg(source, maxBytes) {
  if (typeof source !== 'string' || source.length > maxBytes
    || /<!\s*(?:doctype|entity)\b/i.test(source)) throw new Error('SVG rejected');
  const parser = new DOMParser();
  const document = parser.parseFromString(source, 'image/svg+xml');
  if (document.doctype || document.querySelector('parsererror')) throw new Error('SVG rejected');
  const root = document.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg' || root.namespaceURI !== SVG_NS) throw new Error('SVG rejected');
  const elements = [...root.querySelectorAll('*'), root];
  const ids = new Map();
  for (const element of elements) {
    const tag = element.localName.toLowerCase();
    if (!SVG_ELEMENTS.has(tag) || element.namespaceURI !== SVG_NS) throw new Error('SVG rejected');
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      if (!SVG_ATTRIBUTES.has(name) || name.startsWith('on')) throw new Error('SVG rejected');
      if (name === 'xmlns' && value !== SVG_NS) throw new Error('SVG rejected');
      if (name === 'xmlns:xlink' && value !== 'http://www.w3.org/1999/xlink') throw new Error('SVG rejected');
      if (name === 'id') {
        if (!/^[A-Za-z_][\w.-]{0,127}$/.test(value) || ids.has(value)) throw new Error('SVG rejected');
        ids.set(value, tag);
      }
      if (name === 'href' || name === 'xlink:href') {
        if (tag !== 'lineargradient' && tag !== 'radialgradient') throw new Error('SVG rejected');
        if (!/^#[A-Za-z_][\w.-]{0,127}$/.test(value)) throw new Error('SVG rejected');
      }
      if (/url\s*\(/i.test(value) && !/^(?:url\(#[A-Za-z_][\w.-]{0,127}\))$/i.test(value)) throw new Error('SVG rejected');
      if (name !== 'xmlns' && name !== 'xmlns:xlink'
        && /(?:javascript:|https?:|data:|file:|expression\s*\(|@import)/i.test(value)) throw new Error('SVG rejected');
    }
  }
  const localPaintTargets = new Set(['lineargradient', 'radialgradient', 'pattern', 'clippath', 'filter', 'marker']);
  for (const element of elements) {
    for (const attr of [...element.attributes]) {
      const value = attr.value.trim();
      const localRef = value.match(/^url\(#([A-Za-z_][\w.-]{0,127})\)$/i);
      if (localRef && !localPaintTargets.has(ids.get(localRef[1]))) throw new Error('SVG rejected');
      if ((attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'xlink:href')
        && !['lineargradient', 'radialgradient'].includes(ids.get(value.slice(1)))) throw new Error('SVG rejected');
    }
  }
  const gradientReferences = new Map();
  for (const gradient of elements.filter(element => ['lineargradient', 'radialgradient'].includes(element.localName.toLowerCase()))) {
    const id = gradient.getAttribute('id');
    const href = gradient.getAttribute('href') || gradient.getAttribute('xlink:href');
    if (id && href) gradientReferences.set(id, href.slice(1));
  }
  for (const start of gradientReferences.keys()) {
    const visited = new Set();
    let current = start;
    while (gradientReferences.has(current)) {
      if (visited.has(current)) throw new Error('SVG rejected');
      visited.add(current);
      current = gradientReferences.get(current);
    }
  }
  const sanitized = new XMLSerializer().serializeToString(root);
  if (new TextEncoder().encode(sanitized).byteLength > maxBytes) throw new Error('SVG output exceeds size limit');
  return sanitized;
}

function fitRasterSize(sourceWidth, sourceHeight, maxWidth = 480, maxHeight = 340) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

function imageToPngDataUrl(source, sourceType, signal, maxBytes) {
  if (signal.aborted) return Promise.reject(new Error('image-operation-aborted'));
  const blob = new Blob([source], { type: sourceType });
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', onAbort);
      URL.revokeObjectURL(objectUrl);
    };
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(value);
    };
    const onAbort = () => finish(new Error('image-operation-aborted'));
    image.onload = () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight
          || image.naturalWidth * image.naturalHeight > ASSESSMENT_IMAGE_LIMITS.maxPixels) {
          throw new Error('svg-dimensions-invalid');
        }
        const { width, height } = fitRasterSize(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('canvas-unavailable');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
        if (!dataUrl.startsWith('data:image/png;base64,') || Math.ceil(base64.length / 4) * 3 > maxBytes + 3) {
          throw new Error('raster-output-too-large');
        }
        finish(null, dataUrl);
      } catch (error) { finish(error); }
    };
    image.onerror = () => finish(new Error('image-decode-failed'));
    signal.addEventListener('abort', onAbort, { once: true });
    image.src = objectUrl;
  });
}

async function svgToPngBuffer(svg, signal, maxBytes) {
  const sanitized = sanitizeAssessmentSvg(svg, maxBytes);
  const dataUrl = await imageToPngDataUrl(sanitized, 'image/svg+xml;charset=utf-8', signal, maxBytes);
  return dataUrlToImageBuffer(dataUrl, maxBytes);
}

function dataUrlToImageBuffer(dataUrl, maxBytes) {
  const comma = dataUrl.indexOf(',');
  if (comma < 0 || dataUrl.length > Math.ceil(maxBytes * 4 / 3) + 64) throw new Error('raster-output-too-large');
  const binary = window.atob(dataUrl.slice(comma + 1));
  if (binary.length === 0 || binary.length > maxBytes) throw new Error('raster-output-too-large');
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return bytes.buffer;
}

// ============================================================
// HELPER: Convert URL / SVG to Base64/Buffer (dengan Memory Cache)
// ============================================================
/**
 * Pre-fetch seluruh buffer gambar asesmen di latar belakang begitu soal selesai dibuat/ditampilkan.
 * Saat tombol 'Unduh .docx' ditekan, seluruh buffer sudah siap di RAM sehingga pembuatan berkas sangat instan (< 300ms).
 */
export function preloadAsesmenImages(data) {
  void preflightAssessmentImages(data, { loadImage: loadAssessmentImage }).then(result => {
    if (!result.ready) console.debug('Background assessment image preload skipped (image unavailable)');
  }).catch(() => console.debug('Background assessment image preload skipped (image unavailable)'));
}

async function withRasterDeadline(work, parentSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (parentSignal.aborted) controller.abort();
  else parentSignal.addEventListener('abort', abort, { once: true });
  let timer;
  const pending = Promise.resolve().then(() => work(controller.signal));
  pending.catch(() => {});
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('raster-timeout')); }, ASSESSMENT_IMAGE_LIMITS.decodeTimeoutMs);
  });
  try { return await Promise.race([pending, timeout]); }
  finally { clearTimeout(timer); parentSignal.removeEventListener('abort', abort); }
}

async function readBoundedResponse(response, signal, maxBytes) {
  if (!response.body) throw new Error('empty-response');
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  const cancelReader = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancelReader, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new Error('request-aborted');
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('image-too-large');
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener('abort', cancelReader);
    reader.releaseLock();
  }
  if (total === 0) throw new Error('empty-response');
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}

function decodeImageDataUrl(value, maxBytes) {
  const comma = value.indexOf(',');
  if (comma < 0) throw new Error('invalid-data-url');
  const header = value.slice(0, comma).toLowerCase();
  const payload = value.slice(comma + 1);
  const mime = header.match(/^data:(image\/(?:png|jpeg|jpg|webp|svg\+xml))(?:;|$)/)?.[1];
  if (!mime) throw new Error('unsupported-data-url');
  if (payload.length > maxBytes * 4) throw new Error('image-too-large');
  if (mime === 'image/svg+xml') return { mime, svg: decodeSvgDataUri(value, maxBytes) };
  const binary = header.includes(';base64')
    ? (() => {
        const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
        const decodedLength = payload.length % 4 === 0 ? (payload.length / 4) * 3 - padding : Number.POSITIVE_INFINITY;
        if (decodedLength < 0 || decodedLength > maxBytes || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) throw new Error('image-too-large');
        return window.atob(payload);
      })()
    : decodeURIComponent(payload);
  if (binary.length === 0 || binary.length > maxBytes) throw new Error('image-too-large');
  return { mime, buffer: Uint8Array.from(binary, char => char.charCodeAt(0)).buffer };
}

async function rasterizeWebpToPng(buffer, signal, maxBytes) {
  return withRasterDeadline(async innerSignal => {
    if (typeof createImageBitmap !== 'function') throw new Error('webp-decoder-unavailable');
    const bitmap = await createImageBitmap(new Blob([buffer], { type: 'image/webp' }));
    try {
      if (innerSignal.aborted || bitmap.width <= 0 || bitmap.height <= 0
        || bitmap.width * bitmap.height > ASSESSMENT_IMAGE_LIMITS.maxPixels) throw new Error('webp-dimensions-invalid');
      const { width, height } = fitRasterSize(bitmap.width, bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas-unavailable');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return dataUrlToImageBuffer(canvas.toDataURL('image/png'), maxBytes);
    } finally { bitmap.close(); }
  }, signal);
}

function hasWebpSignature(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 16 || bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46
    || bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) return false;
  const declaredLength = new DataView(buffer).getUint32(4, true) + 8;
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  return declaredLength <= bytes.length && declaredLength >= 16 && ['VP8 ', 'VP8L', 'VP8X'].includes(chunk);
}

async function loadAssessmentImage(image, _expectation, { signal, maxImageBytes }) {
  const url = image.url;
  let inlineSvg = typeof image.svg === 'string' && image.svg.trim().startsWith('<svg')
    ? image.svg
    : (typeof image.svg === 'string' && image.svg.startsWith('data:image/svg+xml') ? decodeSvgDataUri(image.svg, maxImageBytes) : undefined);
  let buffer;
  let mime = '';
  if (!url && !inlineSvg) throw new Error('missing-image-source');
  if (inlineSvg === undefined && url?.startsWith('data:')) {
    const decoded = decodeImageDataUrl(url, maxImageBytes);
    inlineSvg = decoded.svg;
    buffer = decoded.buffer;
    mime = decoded.mime;
  } else if (inlineSvg === undefined && url) {
    const parsed = new URL(url, window.location.href);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('unsupported-image-protocol');
    const response = await fetch(parsed.href, { credentials: 'same-origin', signal });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new Error('image-request-failed');
    }
    mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (mime === 'image/svg+xml' || parsed.pathname.toLowerCase().endsWith('.svg')) {
      const svgBytes = await readBoundedResponse(response, signal, maxImageBytes);
      inlineSvg = new TextDecoder('utf-8', { fatal: true }).decode(svgBytes);
    } else {
      buffer = await readBoundedResponse(response, signal, maxImageBytes);
    }
  }
  if (inlineSvg !== undefined) {
    const png = await withRasterDeadline(innerSignal => svgToPngBuffer(inlineSvg, innerSignal, maxImageBytes), signal);
    return { buffer: png, type: 'png' };
  }
  if (!buffer || buffer.byteLength === 0 || buffer.byteLength > maxImageBytes) throw new Error('invalid-image-size');
  if (mime === 'image/webp' || url?.toLowerCase().includes('image/webp')) {
    if (!hasWebpSignature(buffer)) throw new Error('invalid-webp-signature');
    return { buffer: await rasterizeWebpToPng(buffer, signal, maxImageBytes), type: 'png' };
  }
  if (mime === 'image/png' || (!mime && url?.toLowerCase().split(/[?#]/)[0].endsWith('.png'))) return { buffer, type: 'png' };
  if (mime === 'image/jpeg' || mime === 'image/jpg' || (!mime && /\.(?:jpe?g)(?:[?#]|$)/i.test(url || ''))) return { buffer, type: 'jpeg' };
  throw new Error('unsupported-image-format');
}

/**
 * Preflight all required assessment images using the same fetch and SVG rasterizer as DOCX generation.
 * @param {import('./assessment-image-preflight.js').AssessmentData | null | undefined} data
 * @returns {Promise<import('./assessment-image-preflight.js').AssessmentImagePreflightResult>}
 */
export function prepareAssessmentExportImages(data) {
  return preflightAssessmentImages(data, {
    loadImage: loadAssessmentImage,
  });
}

// ============================================================
// FUNGSI UTAMA: generateAsesmenDocx
// ============================================================
export async function generateAsesmenDocx(data, formData, kopSuratUrl, options = {}) {
  if (!window.docx) throw new Error('Library docx belum dimuat. Silakan refresh halaman.');
  const preparedImages = options.preparedImages || await prepareAssessmentExportImages(data);
  if (!preparedImages.ready) throw new AssessmentImagePreflightError(preparedImages.failures);
  if (!(preparedImages.images instanceof Map)) {
    throw new AssessmentImagePreflightError([{ section: 'pg', number: 0, category: 'invalid-image' }]);
  }
  const preparedFailures = await validatePreparedAssessmentImages(data, preparedImages);
  if (preparedFailures.length) throw new AssessmentImagePreflightError(preparedFailures);
  const assessmentImages = new Map([...preparedImages.images].map(([question, loaded]) => [
    question,
    { ...loaded, buffer: loaded.buffer.slice(0) },
  ]));

  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, VerticalAlign,
    PageBreak, ImageRun, Packer,
  } = window.docx;

  const children = [];

  // â”€â”€ KOP SURAT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let kopSuratBuf = null;
  let kopSuratType = 'png';
  if (kopSuratUrl) {
    try {
      const resp = await fetch(kopSuratUrl);
      if (!resp.ok) throw new Error('fetch failed');
      kopSuratBuf  = await resp.arrayBuffer();
      kopSuratType = kopSuratUrl.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: PT(6) },
        children: [new ImageRun({ data: kopSuratBuf, transformation: { width: 580, height: 95 }, type: kopSuratType })],
      }));
    } catch {
      // fallback teks
      children.push(makePara(formData.namaSekolah || 'SOAL ASESMEN', {
        bold: true, size: 28, align: AlignmentType.CENTER, spaceAfter: 4,
      }));
    }
  }

  // â”€â”€ JUDUL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const judulMap = { STS: 'SUMATIF TENGAH SEMESTER', SAS: 'SUMATIF AKHIR SEMESTER', ASAT: 'ASESMEN SUMATIF AKHIR TAHUN' };
  const judul = judulMap[formData.jenisUjian] || (formData.jenisUjian || 'PENILAIAN').toUpperCase();
  children.push(makePara(judul, { bold: true, size: 24, align: AlignmentType.CENTER, spaceBefore: 4, spaceAfter: 2 }));
  const activeTapel = (typeof getActiveTahunAjaran === 'function') ? getActiveTahunAjaran() : (window.state?.settings?.tahun_ajaran || '2026/2027');
  children.push(makePara(`TAHUN PELAJARAN ${activeTapel}`, { bold: true, size: 22, align: AlignmentType.CENTER, spaceAfter: 8 }));

  // â”€â”€ TABEL IDENTITAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ I. PILIHAN GANDA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (data.pg && data.pg.length > 0) {
    children.push(makePara('I. PILIHAN GANDA', { bold: true, size: 22, spaceBefore: 6, spaceAfter: 4 }));
    children.push(makePara('Berilah tanda silang (X) pada huruf A, B, C, atau D pada jawaban yang paling benar!',
      { italics: true, size: 19, spaceAfter: 6 }));

    // Pre-fetch dan rasterisasi seluruh gambar PG secara paralel agar ekspor Word sangat cepat (< 500ms)
    const pgImageBuffers = assessmentImages;

    for (const q of data.pg) {
      const opts = q.opsi || {};
      const colLayout = selectOptionColumns(opts);
      const imgData = pgImageBuffers.get(q);

      // Nomor soal + teks (hanging indent)
      const INDENT_LEFT    = QUESTION_INDENT;
      const HANGING        = QUESTION_INDENT;

      if (imgData) {
          const cell1 = new window.docx.TableCell({
             children: [makeParaRaw([new TextRun({ text: `${q.no}. `, bold: true, size: 22, font: FONT_LATIN })], { align: AlignmentType.LEFT })],
             borders: NO_BORDERS,
             width: { size: QUESTION_INDENT, type: window.docx.WidthType.DXA },
             margins: { top: 0, bottom: 0, left: 0, right: 0 },
             verticalAlign: window.docx.VerticalAlign.TOP
          });

          const cell2Children = [];
          cell2Children.push(...buildSoalDocxChildren('', q.soal, { left: 0, hanging: 0 }));
          cell2Children.push(makeAssessmentImageParagraph(imgData));
          cell2Children.push(...makeOpsiParagraphs(opts, colLayout, 0, IMAGE_CELL_TEXT_WIDTH, 12));

          const cell2 = new window.docx.TableCell({
             children: cell2Children,
             borders: NO_BORDERS,
             width: { size: IMAGE_CELL_TEXT_WIDTH, type: window.docx.WidthType.DXA },
             margins: { top: 0, bottom: 0, left: 0, right: 0 },
             verticalAlign: window.docx.VerticalAlign.TOP
          });

          children.push(new window.docx.Table({
             width: { size: PAGE_TEXT_WIDTH, type: window.docx.WidthType.DXA },
             borders: NO_BORDERS,
             rows: [new window.docx.TableRow({ children: [cell1, cell2] })]
          }));
      } else {
        children.push(...buildSoalDocxChildren(`${q.no}.`, q.soal, { left: INDENT_LEFT, hanging: HANGING }));
        children.push(...makeOpsiParagraphs(opts, colLayout, INDENT_LEFT, PAGE_TEXT_WIDTH, 12));
      }
    }
  }

  // â”€â”€ II. ISIAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            makeCell([
              makeParaRaw([new TextRun({ text: `${q.no}. `, bold: true, size: 22, font: FONT_LATIN }), ...makeRuns(q.soal, { size: 22 })]),
              ...(assessmentImages.has(q) ? [makeAssessmentImageParagraph(assessmentImages.get(q))] : []),
            ], { width: { size: 42, type: WidthType.PERCENTAGE } }),
            makeCell(makePara('..................', { size: 22, align: AlignmentType.CENTER }), { width: { size: 16, type: WidthType.PERCENTAGE } }),
            makeCell(makeParaRaw([new TextRun({ text: `${String.fromCharCode(65+i)}. `, bold: true, size: 22, font: FONT_LATIN }), ...makeRuns(rightCol[i] || '', { size: 22 })]), { width: { size: 42, type: WidthType.PERCENTAGE } }),
          ]})],
        }));
        children.push(makePara('', { spaceAfter: 2 }));
      });
    } else if (isianType === 'Crossword' && data.isian.crossword && data.isian.crossword.success && data.isian.crossword.grid) {
      // â”€â”€ CROSSWORD GRID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ CLUE LISTS: MENDATAR & MENURUN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const mendatar = [];
      const menurun = [];
      cw.placements.forEach(p => {
        const qData = data.isian.data[p.originalIndex];
        if (qData) {
          const clueText = qData.soal.replace(/^(Mendatar:|Menurun:)\s*/i, '').trim();
          const clue = { num: p.number, text: clueText, image: assessmentImages.get(qData) };
          if (p.direction === 'H') mendatar.push(clue);
          else menurun.push(clue);
        }
      });
      mendatar.sort((a, b) => a.num - b.num);
      menurun.sort((a, b) => a.num - b.num);

      // Build clue paragraphs for left (Mendatar) column
      const mendatarParas = [
        makePara('MENDATAR', { bold: true, size: 22, underline: { type: window.docx.UnderlineType.SINGLE }, spaceAfter: 4 }),
        ...mendatar.flatMap(t => [
          makeParaRaw([
            new TextRun({ text: `${t.num}. `, bold: true, size: 20, font: FONT_LATIN }),
            ...makeRuns(t.text, { size: 20 }),
          ], { align: AlignmentType.JUSTIFIED, spaceAfter: 3 }),
          ...(t.image ? [makeAssessmentImageParagraph(t.image)] : []),
        ]),
      ];

      // Build clue paragraphs for right (Menurun) column
      const menurunParas = [
        makePara('MENURUN', { bold: true, size: 22, underline: { type: window.docx.UnderlineType.SINGLE }, spaceAfter: 4 }),
        ...menurun.flatMap(t => [
          makeParaRaw([
            new TextRun({ text: `${t.num}. `, bold: true, size: 20, font: FONT_LATIN }),
            ...makeRuns(t.text, { size: 20 }),
          ], { align: AlignmentType.JUSTIFIED, spaceAfter: 3 }),
          ...(t.image ? [makeAssessmentImageParagraph(t.image)] : []),
        ]),
      ];

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [new TableRow({ children: [
          makeCell(mendatarParas, { width: { size: 50, type: WidthType.PERCENTAGE } }),
          makeCell(menurunParas, { width: { size: 50, type: WidthType.PERCENTAGE } }),
        ]})],
      }));
      const crosswordQuestions = new Set(cw.placements
        .map(placement => data.isian.data[placement.originalIndex])
        .filter(Boolean));
      for (const question of data.isian.data) {
        const image = assessmentImages.get(question);
        if (image && !crosswordQuestions.has(question)) children.push(makeAssessmentImageParagraph(image));
      }
    } else {
      for (const q of data.isian.data) {
        children.push(...buildSoalDocxChildren(`${q.no}.`, q.soal, { left: CM(0.6), hanging: CM(0.6) }));
        const image = assessmentImages.get(q);
        if (image) children.push(makeAssessmentImageParagraph(image));
      }
    }
  }

  // â”€â”€ III. URAIAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (data.uraian && data.uraian.length > 0) {
    children.push(makePara('III. URAIAN', { bold: true, size: 22, spaceBefore: 10, spaceAfter: 4 }));
    children.push(makePara('Jawablah pertanyaan di bawah ini dengan jelas dan tepat!', { italics: true, size: 19, spaceAfter: 6 }));
    for (const q of data.uraian) {
      children.push(...buildSoalDocxChildren(`${q.no}.`, q.soal, { left: CM(0.6), hanging: CM(0.6) }));
      const image = assessmentImages.get(q);
      if (image) children.push(makeAssessmentImageParagraph(image));
    }
  }

  // â”€â”€ LEMBAR PENGESAHAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ PAGE BREAK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // â”€â”€ KUNCI JAWABAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ LEMBAR PENGESAHAN KUNCI JAWABAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  children.push(makePara('', { spaceBefore: 20 }));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [new TableRow({ children: [
      makeCell([
        makePara('Mengetahui,', { size: 22, align: AlignmentType.CENTER }),
        makePara('Kepala Sekolah', { size: 22, align: AlignmentType.CENTER }),
        makePara('', { spaceAfter: 50 }),
        makeParaRaw(makeRuns(formData.namaKepalaSekolah || '..............................', { bold: true, size: 22 }), { align: AlignmentType.CENTER }),
        makePara(`NIP. ${formData.nipKepalaSekolah || '..............................'}`, { size: 22, align: AlignmentType.CENTER }),
      ]),
      makeCell([
        makePara('\u00a0', { size: 22, align: AlignmentType.CENTER }),
        makePara('Guru Pengampu', { size: 22, align: AlignmentType.CENTER }),
        makePara('', { spaceAfter: 50 }),
        makeParaRaw(makeRuns(formData.namaGuru || '..............................', { bold: true, size: 22 }), { align: AlignmentType.CENTER }),
        makePara(`NIP. ${formData.nipGuru || '..............................'}`, { size: 22, align: AlignmentType.CENTER }),
      ]),
    ]})],
  }));

  // â”€â”€ PAGE BREAK: KISI-KISI PENULISAN SOAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Kop Surat Kisi-Kisi
  if (kopSuratBuf) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: PT(6) },
      children: [new ImageRun({ data: kopSuratBuf, transformation: { width: 580, height: 95 }, type: kopSuratType })],
    }));
  } else if (formData.namaSekolah) {
    children.push(makePara(formData.namaSekolah, {
      bold: true, size: 24, align: AlignmentType.CENTER, spaceAfter: 4,
    }));
  }

  // Judul Kisi-Kisi
  children.push(makePara(`KISI-KISI PENULISAN SOAL ${judul}`, {
    bold: true, size: 24, align: AlignmentType.CENTER, spaceBefore: 4, spaceAfter: 2,
  }));
  children.push(makePara(`TAHUN PELAJARAN ${activeTapel} \u2014 KURIKULUM MERDEKA`, {
    bold: true, size: 20, align: AlignmentType.CENTER, spaceAfter: 8,
  }));

  // Matriks Data Soal (Semua butir PG, Isian, Uraian)
  const allItems = [
    ...(data.pg || []),
    ...(data.isian?.data || []),
    ...(data.uraian || []),
  ];
  allItems.sort((a, b) => (a.no || 0) - (b.no || 0));
  const totalItems = allItems.length;

  // Tabel Identitas Kisi-Kisi
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: LINE_BORDERS,
    rows: [
      new TableRow({ children: [
        makeCell(makePara('Satuan Pendidikan', { size: 19 }), { borders: true, width: { size: 18, type: WidthType.PERCENTAGE } }),
        makeCell(makePara(`: ${formData.namaSekolah || 'SD'}`, { size: 19 }), { borders: true, width: { size: 32, type: WidthType.PERCENTAGE } }),
        makeCell(makePara('Alokasi Waktu', { size: 19 }), { borders: true, width: { size: 18, type: WidthType.PERCENTAGE } }),
        makeCell(makePara(': 90 Menit', { size: 19 }), { borders: true, width: { size: 32, type: WidthType.PERCENTAGE } }),
      ]}),
      new TableRow({ children: [
        makeCell(makePara('Mata Pelajaran', { size: 19 }), { borders: true }),
        makeCell(makeParaRaw([new TextRun({ text: ': ', size: 19, font: FONT_LATIN }), ...makeRuns(formData.mataPelajaran || '', { size: 19 })]), { borders: true }),
        makeCell(makePara('Jumlah Soal', { size: 19 }), { borders: true }),
        makeCell(makePara(`: ${totalItems} Butir`, { size: 19 }), { borders: true }),
      ]}),
      new TableRow({ children: [
        makeCell(makePara('Kelas / Semester', { size: 19 }), { borders: true }),
        makeCell(makePara(`: ${formData.jenjangKelas || ''} / ${formData.semester || ''}`, { size: 19 }), { borders: true }),
        makeCell(makePara('Penyusun', { size: 19 }), { borders: true }),
        makeCell(makeParaRaw([new TextRun({ text: ': ', size: 19, font: FONT_LATIN }), ...makeRuns(formData.namaGuru || 'Guru Pengampu', { size: 19 })]), { borders: true }),
      ]}),
    ],
  }));
  children.push(makePara('', { spaceAfter: 8 }));

  // Tabel 8 Kolom Kisi-Kisi
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: LINE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell(makePara('No', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 4, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Capaian Pembelajaran (CP)', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 22, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Materi Pokok', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 15, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Indikator Soal', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 26, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Level', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 8, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Bentuk', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 9, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('No.Soal', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 6, type: WidthType.PERCENTAGE } }),
          makeCell(makePara('Kunci', { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true, shading: { fill: 'E8E8E8' }, width: { size: 10, type: WidthType.PERCENTAGE } }),
        ],
      }),
      ...allItems.map((item, idx) => {
        const lvl = String(item.level || 'L1').toUpperCase();
        return new TableRow({
          children: [
            makeCell(makePara(String(idx + 1), { size: 18, align: AlignmentType.CENTER }), { borders: true }),
            makeCell(makeParaRaw(makeRuns(item.cp || '-', { size: 18 })), { borders: true }),
            makeCell(makeParaRaw(makeRuns(item.materi || '-', { size: 18 })), { borders: true }),
            makeCell(makeParaRaw(makeRuns(item.indikator || '-', { size: 18 })), { borders: true }),
            makeCell(makePara(lvl, { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true }),
            makeCell(makePara(item.bentuk || 'PG', { size: 18, align: AlignmentType.CENTER }), { borders: true }),
            makeCell(makePara(String(item.no), { bold: true, size: 18, align: AlignmentType.CENTER }), { borders: true }),
            makeCell(makeParaRaw(makeRuns(item.kunci || '-', { bold: true, size: 18 }), { align: AlignmentType.CENTER }), { borders: true }),
          ],
        });
      }),
    ],
  }));

  // Lembar Pengesahan Kisi-Kisi
  children.push(makePara('', { spaceBefore: 20 }));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [new TableRow({ children: [
      makeCell([
        makePara('Mengetahui,', { size: 22, align: AlignmentType.CENTER }),
        makePara('Kepala Sekolah', { size: 22, align: AlignmentType.CENTER }),
        makePara('', { spaceAfter: 50 }),
        makeParaRaw(makeRuns(formData.namaKepalaSekolah || '..............................', { bold: true, size: 22 }), { align: AlignmentType.CENTER }),
        makePara(`NIP. ${formData.nipKepalaSekolah || '..............................'}`, { size: 22, align: AlignmentType.CENTER }),
      ]),
      makeCell([
        makePara('\u00a0', { size: 22, align: AlignmentType.CENTER }),
        makePara('Guru Pengampu', { size: 22, align: AlignmentType.CENTER }),
        makePara('', { spaceAfter: 50 }),
        makeParaRaw(makeRuns(formData.namaGuru || '..............................', { bold: true, size: 22 }), { align: AlignmentType.CENTER }),
        makePara(`NIP. ${formData.nipGuru || '..............................'}`, { size: 22, align: AlignmentType.CENTER }),
      ]),
    ]})],
  }));

  // â”€â”€ BUILD DOCUMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { Header, Footer, PageNumber, TabStopPosition, TabStopType } = window.docx;

  // Jenis ujian untuk header
  const jenisUjianMap = { STS: 'Sumatif Tengah Semester', SAS: 'Sumatif Akhir Semester', ASAT: 'Asesmen Sumatif Akhir Tahun' };
  const jenisUjianText = jenisUjianMap[formData.jenisUjian] || (formData.jenisUjian || 'Ulangan Harian');
  const headerText = `${jenisUjianText} - ${formData.mataPelajaran || ''} - ${formData.jenjangKelas || ''}`;

  // LINE SPACING 1.15 (1.15 Ã— 240 twip = 276 twip)
  const LINE_SPACING_115 = 276;

  const doc = new Document({
    creator: window.state?.settings?.nama_kkg || 'Portal Digital KKG',
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

  const finalImageFailures = await validatePreparedAssessmentImages(data, preparedImages, { decodeImage: false });
  if (finalImageFailures.length) throw new AssessmentImagePreflightError(finalImageFailures);
  return Packer.toBlob(doc);
}
