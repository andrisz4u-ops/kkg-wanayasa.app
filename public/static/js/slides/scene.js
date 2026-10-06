import { getTemplate } from './templates.js';
import { normalizeSlide, answerIndex, teacherNotes } from './lesson-model.js';

export const escapeXml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const charWidth = (char, size) => size * (/[MW@%]/.test(char) ? .88 : /[il.,!:;' ]/.test(char) ? .3 : /[A-Z0-9]/.test(char) ? .64 : .54);
export function wrapText(value, width, size) {
  const lines = [];
  for (const paragraph of String(value || '').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if ([...candidate].reduce((n, c) => n + charWidth(c, size), 0) <= width) line = candidate;
      else {
        if (line) lines.push(line);
        line = '';
        for (const char of word) {
          if ([...line, char].reduce((n, c) => n + charWidth(c, size), 0) > width && line) { lines.push(line); line = ''; }
          line += char;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}
export function buildScene(input, templateId, { aspectRatio = '16:9', index = 0, total = 1, reveal = false } = {}) {
  const s = normalizeSlide(input), theme = getTemplate(templateId), c = theme.colors;
  const width = aspectRatio === '4:3' ? 960 : 1280, height = 720, margin = 56, right = width - margin;
  const nodes = [], warnings = [];
  const box = (x, y, w, h, fill = c.paper, radius = 18, stroke) => nodes.push({ kind: 'rect', x, y, w, h, fill, radius, stroke });
  const circle = (x, y, r, fill, stroke) => nodes.push({ kind: 'ellipse', x: x - r, y: y - r, w: r * 2, h: r * 2, fill, stroke });
  const line = (x, y, x2, y2, color = c.primary, thickness = 4) => nodes.push({ kind: 'line', x, y, x2, y2, color, thickness });
  const write = (value, x, y, w, h, size = 32, options = {}) => {
    if (!value) return;
    let fitted = size, lines = wrapText(value, w - 6, fitted);
    const minSize = options.minSize || Math.min(size, 26);
    while (lines.length * fitted * 1.23 > h && fitted > minSize) { fitted -= 1; lines = wrapText(value, w - 6, fitted); }
    if (lines.length * fitted * 1.23 > h) warnings.push(`Teks “${String(value).slice(0, 35)}” terlalu panjang untuk bidangnya.`);
    nodes.push({ kind: 'text', text: String(value), lines, x, y, w, h, size: fitted, font: options.heading ? theme.headingFont : theme.font, color: options.color || c.ink, bold: !!options.bold || !!options.heading, align: options.align || 'left', prop: options.prop });
  };
  const bulletList = (items, x, y, w, h, style = theme.body) => {
    if (!items.length) return;
    const gap = 12, padding = style === 'tiles' ? 12 : 6;
    const inset = style === 'editorial' ? 64 : style === 'tiles' ? 48 : 22;
    const textW = w - inset - (style === 'tiles' ? 16 : 8);
    const available = h - gap * (items.length - 1) - padding * 2 * items.length;
    let size = 34, heights;
    do {
      heights = items.map(value => wrapText(value, textW - 6, size).length * size * 1.23);
      if (heights.reduce((sum, value) => sum + value, 0) <= available || size === 26) break;
      size--;
    } while (size >= 26);
    const required = heights.reduce((sum, value) => sum + value, 0);
    const extra = Math.max(0, available - required) / items.length;
    const ratio = required > available ? Math.max(0, available) / required : 1;
    let yy = y;
    items.forEach((value, i) => {
      const textH = heights[i] * ratio + extra, rowH = textH + padding * 2;
      if (style === 'tiles') { box(x, yy, w, rowH, i % 2 ? c.paper : c.soft, 18); circle(x + 28, yy + rowH / 2, 8, c.primary); }
      else if (style === 'rail') { line(x + 4, yy + 6, x + 4, yy + rowH - 6, c.primary, 5); }
      else { write(String(i + 1).padStart(2, '0'), x, yy + padding, 52, textH, Math.min(size, 32), { color: c.primary, bold: true }); }
      write(value, x + inset, yy + padding + Math.max(0, (textH - heights[i]) / 2), textW, textH, size, { prop: `content-${i}` });
      yy += rowH + gap;
    });
  };
  box(0, 0, width, height, c.background, 0);
  box(margin, height - 44, width - margin * 2, 2, c.soft, 0);
  write(`${index + 1} / ${total}`, right - 100, height - 33, 100, 25, 18, { color: c.muted, align: 'right' });
  if (s.layout === 'title' || s.layout === 'thankyou') {
    const poster = theme.cover === 'poster', editorial = theme.cover === 'editorial', field = theme.cover === 'field';
    const titleW = width - margin * 2 - (poster ? 0 : 270);
    if (field) { box(0, 0, width, 550, c.primary, 0); circle(right - 110, 225, 108, c.secondary); circle(right - 65, 305, 55, c.soft); }
    else if (poster) { circle(width - 125, 120, 78, c.soft); circle(100, 580, 46, c.secondary); box(margin, 155, width - margin * 2, 340, c.paper, 28); }
    else if (editorial) { box(right - 220, 80, 220, 510, c.soft, 6); line(right - 190, 150, right - 30, 150, c.primary, 8); circle(right - 110, 330, 72, c.primary); }
    else { box(right - 245, 105, 245, 440, c.soft, 22); for (let i = 0; i < 4; i++) box(right - 207 + (i % 2) * 90, 235 + Math.floor(i / 2) * 90, 76, 76, i === 3 ? c.paper : c.primary, 10); }
    write(s.layout === 'thankyou' ? 'PIKIRKAN KEMBALI' : 'MARI BELAJAR', margin + (poster ? 30 : 0), 104, titleW, 38, 22, { color: field ? '#f7faf3' : c.primary, bold: true });
    write(s.title, margin + (poster ? 30 : 0), 190, poster ? width - margin * 2 - 60 : titleW, 195, 62, { heading: true, color: field ? '#ffffff' : c.ink, prop: 'title' });
    write(s.subtitle || s.message || s.content[0], margin + (poster ? 30 : 0), 420, poster ? width - margin * 2 - 60 : titleW, 110, 32, { color: field ? '#e6f4e9' : c.muted, prop: 'subtitle' });
    return { width, height, nodes, warnings, notes: teacherNotes(s) };
  }
  box(margin, 52, 64, 6, c.primary, 3);
  write(s.title, margin, 83, width - margin * 2, 112, 48, { heading: true, prop: 'title' });
  const top = 224, bodyH = 390, bodyW = width - margin * 2;
  const visual = (v, x, y, w, h) => {
    box(x, y, w, h, c.soft, 22);
    if (v.type === 'fraction' && v.denominator >= 2 && v.denominator <= 12 && v.numerator >= 0 && v.numerator <= v.denominator) {
      const gap = 8, cols = v.denominator <= 6 ? v.denominator : Math.ceil(v.denominator / 2), rows = v.denominator <= 6 ? 1 : 2;
      const cellW = (w - 48 - gap * (cols - 1)) / cols, cellH = Math.min(rows === 1 ? 105 : 76, h * .3 / rows);
      for (let i = 0; i < v.denominator; i++) box(x + 24 + (i % cols) * (cellW + gap), y + h * .32 + Math.floor(i / cols) * (cellH + gap), cellW, cellH, i < v.numerator ? c.primary : c.paper, 8, c.primary);
      write(`${v.numerator} / ${v.denominator}`, x + 24, y + h - 75, w - 48, 60, 48, { bold: true, align: 'center', color: c.primary });
      write(v.label, x + 24, y + 20, w - 48, 60, 28, { bold: true, align: 'center' });
    } else if (v.type === 'numberLine' && v.max > v.min) {
      line(x + 30, y + h / 2, x + w - 30, y + h / 2, c.primary, 5);
      for (let i = 0; i <= 4; i++) { const xx = x + 30 + (w - 60) * i / 4; line(xx, y + h / 2 - 10, xx, y + h / 2 + 10); write(String(Number((v.min + (v.max - v.min) * i / 4).toFixed(2))), xx - 32, y + h / 2 + 28, 64, 40, 24, { align: 'center' }); }
      circle(x + 30 + (w - 60) * (v.value - v.min) / (v.max - v.min), y + h / 2, 12, c.secondary);
      write(v.label, x + 24, y + 26, w - 48, 70, 30, { bold: true, align: 'center' });
    } else if (v.type === 'cycle' && v.nodes?.length >= 2) {
      const items = v.nodes, nodeW = (w - 88) / 2, nodeH = Math.min(112, (h - 96) / 2);
      const positions = [{ x: x + 24, y: y + 40 }, { x: x + w - nodeW - 24, y: y + 40 }, { x: x + w - nodeW - 24, y: y + h - nodeH - 32 }, { x: x + 24, y: y + h - nodeH - 32 }].slice(0, items.length);
      positions.forEach((p, i) => {
        const next = positions[(i + 1) % positions.length];
        const shift = items.length === 2 ? i === 0 ? -13 : 13 : 0;
        const a = { x: p.x + nodeW / 2, y: p.y + nodeH / 2 + shift }, b = { x: next.x + nodeW / 2, y: next.y + nodeH / 2 + shift };
        line(a.x, a.y, b.x, b.y, c.primary, 4);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        nodes.push({ kind: 'triangle', x: mx - 8, y: my - 8, w: 16, h: 16, fill: c.primary, rotation: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90 });
      });
      positions.forEach((p, i) => { box(p.x, p.y, nodeW, nodeH, c.paper, 14); write(items[i].label, p.x + 12, p.y + 18, nodeW - 24, nodeH - 28, 28, { bold: true, align: 'center' }); });
    } else {
      const items = v.nodes || [], hh = (h - 48) / Math.max(1, items.length);
      items.forEach((node, i) => {
        if (i) line(x + 46, y + 24 + (i - .5) * hh, x + 46, y + 24 + i * hh, c.primary, 3);
        circle(x + 46, y + 24 + i * hh + 21, 19, c.primary);
        write(String(i + 1), x + 29, y + 27 + i * hh, 34, 35, 24, { color: '#ffffff', bold: true, align: 'center' });
        write(node.label, x + 80, y + 24 + i * hh, w - 105, hh - 14, 30, { bold: true });
      });
      if (v.type === 'cycle' && items.length > 1) write('Kembali ke tahap awal', x + 24, y + h - 31, w - 48, 25, 18, { color: c.primary, align: 'right' });
    }
  };
  if (s.layout === 'quiz') {
    write(s.question, margin, top - 10, bodyW, 94, 36, { bold: true, prop: 'question' });
    const cols = s.visual ? 1 : 2, visualW = bodyW * .43, startX = s.visual ? margin + visualW + 28 : margin, ww = s.visual ? bodyW - visualW - 28 : (bodyW - 20) / cols;
    if (s.visual) visual(s.visual, margin, top + 106, visualW, 260);
    s.quizOptions.forEach((option, i) => {
      const xx = startX + (i % cols) * (ww + 20), yy = top + 110 + Math.floor(i / cols) * (s.visual ? 65 : 116);
      box(xx, yy, ww, s.visual ? 55 : 98, reveal && i === answerIndex(s) ? c.soft : c.paper, 16, c.primary);
      write(`${String.fromCharCode(65 + i)}. ${option.replace(/^[A-D][.\s:)\-]+/i, '')}`, xx + 24, yy + (s.visual ? 8 : 20), ww - 48, s.visual ? 45 : 70, 30, { prop: `quiz-option-${i}` });
    });
    if (reveal) write(`Jawaban: ${String.fromCharCode(65 + answerIndex(s))}. ${s.quizExplanation}`, margin, 603, bodyW, 66, 24, { color: c.primary, bold: true });
  } else if (['comparison', 'twoColumn'].includes(s.layout)) {
    const ww = (bodyW - 28) / 2;
    [[s.leftTitle, s.leftContent], [s.rightTitle, s.rightContent]].forEach(([title, content], i) => {
      const xx = margin + i * (ww + 28); box(xx, top, ww, bodyH, i ? c.paper : c.soft, 20);
      write(title, xx + 26, top + 20, ww - 52, 80, 36, { bold: true }); bulletList(content, xx + 22, top + 112, ww - 44, bodyH - 130, 'rail');
    });
  } else if (s.layout === 'timeline') {
    const ww = (bodyW - 24 * Math.max(0, s.timeline.length - 1)) / Math.max(1, s.timeline.length);
    s.timeline.forEach((row, i) => {
      const xx = margin + i * (ww + 24); if (i) line(xx - 24, top + 38, xx, top + 38, c.primary, 4);
      circle(xx + 36, top + 38, 32, c.primary); write(String(i + 1), xx + 8, top + 15, 56, 54, 32, { color: '#ffffff', bold: true, align: 'center' });
      write(row.title, xx, top + 106, ww, 105, 32, { bold: true }); write(row.desc, xx, top + 232, ww, 155, 28);
    });
  } else if (s.layout === 'stats') {
    const ww = bodyW / Math.max(1, s.stats.length);
    s.stats.forEach((row, i) => { const xx = margin + i * ww; write(row.value, xx + 12, top + 35, ww - 24, 120, 60, { bold: true, color: c.primary }); write(row.label, xx + 12, top + 177, ww - 24, 94, 32, { bold: true }); write(row.desc, xx + 12, top + 293, ww - 24, 92, 26); });
  } else if (s.layout === 'flipcard') {
    const ww = (bodyW - 22) / 2;
    s.flipcards.forEach((row, i) => { const xx = margin + (i % 2) * (ww + 22), yy = top + Math.floor(i / 2) * 194; box(xx, yy, ww, 176, i % 2 ? c.paper : c.soft); write(reveal ? row.back : row.front, xx + 28, yy + 36, ww - 56, 108, 34, { bold: !reveal }); });
  } else if (s.layout === 'activity') {
    box(margin, top, bodyW, bodyH, c.soft, 24); write(s.instruction, margin + 34, top + 38, bodyW - 68, 190, 40, { bold: true, prop: 'instruction' });
    write([s.time, s.groupSize, s.materials].filter(Boolean).join('  •  '), margin + 34, top + 270, bodyW - 68, 85, 28, { color: c.primary });
  } else if (s.layout === 'quote') {
    write(s.quote, margin + 20, top + 22, bodyW - 40, 240, 44, { heading: true, prop: 'quote' }); write(s.author, margin + 20, top + 302, bodyW - 40, 60, 28, { color: c.muted });
  } else if (s.visual || s.image) {
    const ww = bodyW * .47; bulletList(s.content, margin, top, bodyW - ww - 40, bodyH);
    if (s.visual) visual(s.visual, right - ww, top, ww, bodyH);
    else nodes.push({ kind: 'image', x: right - ww, y: top, w: ww, h: bodyH, url: s.image.url, alt: s.image.alt || s.title });
  } else bulletList(s.content, margin, top, bodyW, bodyH);
  return { width, height, nodes, warnings, notes: teacherNotes(s) };
}
export function sceneSvg(scene, label = 'Slide pembelajaran') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="${escapeXml(label)}" style="display:block;width:100%;height:auto">${scene.nodes.map(node => {
    if (node.kind === 'rect') return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="${node.radius || 0}" fill="${node.fill}"${node.stroke ? ` stroke="${node.stroke}" stroke-width="2"` : ''}/>`;
    if (node.kind === 'ellipse') return `<ellipse cx="${node.x + node.w / 2}" cy="${node.y + node.h / 2}" rx="${node.w / 2}" ry="${node.h / 2}" fill="${node.fill}"${node.stroke ? ` stroke="${node.stroke}"` : ''}/>`;
    if (node.kind === 'line') return `<line x1="${node.x}" y1="${node.y}" x2="${node.x2}" y2="${node.y2}" stroke="${node.color}" stroke-width="${node.thickness}"/>`;
    if (node.kind === 'image') return `<image href="${escapeXml(node.url)}" x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" preserveAspectRatio="xMidYMid slice"><title>${escapeXml(node.alt)}</title></image>`;
    if (node.kind === 'triangle') return `<polygon points="${node.x + node.w / 2},${node.y} ${node.x + node.w},${node.y + node.h} ${node.x},${node.y + node.h}" fill="${node.fill}" transform="rotate(${node.rotation} ${node.x + node.w / 2} ${node.y + node.h / 2})"/>`;
    const xx = node.align === 'center' ? node.x + node.w / 2 : node.align === 'right' ? node.x + node.w : node.x;
    return `<text fill="${node.color}" font-family="${escapeXml(node.font)}, ${node.font === 'Georgia' ? 'serif' : 'Arial, sans-serif'}" font-size="${node.size}" font-weight="${node.bold ? 700 : 400}" text-anchor="${node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start'}"${node.prop ? ` data-edit="${node.prop}"` : ''}>${node.lines.map((value, i) => `<tspan x="${xx}" y="${node.y + node.size + i * node.size * 1.23}">${escapeXml(value)}</tspan>`).join('')}</text>`;
  }).join('')}</svg>`;
}
