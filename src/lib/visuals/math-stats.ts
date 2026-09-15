/**
 * math-stats.ts
 * Fractions, Measurement, and Statistical Chart SVG Renderers
 */

import {
  escapeXml,
  MistarParams,
  BusurDerajatParams,
  DiagramAlurLogikaGerbangParams,
  KodingVariabelOperatorParams,
  GarisBilanganBulatOperasiParams,
  PecahanDesimalPersenSenilaiParams,
  JamDigitalKomparasiParams,
  DiagramSankeyEnergiParams,
  SkalaPetaBatangParams
} from './types';

/** Render Pecahan Lingkaran dengan n bagian, k bagian diarsir (Mendukung Pecahan Campuran) */
export function renderPecahanLingkaranSvg(params: { pembagi?: number; diarsir?: number; utuh?: number; caption?: string }): string {
  const n = Math.max(2, Math.min(16, params.pembagi || 4));
  const k = Math.max(0, Math.min(n, params.diarsir != null ? params.diarsir : 3));
  const utuh = Math.max(0, Math.min(3, params.utuh || 0));

  if (utuh > 0) {
    const totalCircles = utuh + 1;
    const r = 55;
    const cy = 90;
    const spacing = 135;
    const w = totalCircles * spacing + 40;
    const h = 210;

    let circlesSvg = '';
    for (let c = 0; c < utuh; c++) {
      const cx = 80 + c * spacing;
      let fullSlices = '';
      for (let i = 0; i < n; i++) {
        const startAngle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const endAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        fullSlices += `<path d="M ${cx},${cy} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="#38bdf8" stroke="#0f172a" stroke-width="1.8"/>`;
      }
      circlesSvg += `
        <!-- Ground Shadow -->
        <ellipse cx="${cx}" cy="${cy + r + 4}" rx="${(r * 0.92).toFixed(1)}" ry="8" fill="#0f172a" fill-opacity="0.08"/>
        <g>${fullSlices}</g>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0f172a" stroke-width="2.2"/>
        <!-- Pivot Pin -->
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0f172a"/>
        <circle cx="${cx - 1}" cy="${cy - 1}" r="1" fill="#ffffff"/>
        <!-- Badge -->
        <rect x="${cx - 46}" y="${cy + r + 10}" width="92" height="20" rx="10" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1"/>
        <text x="${cx}" y="${cy + r + 24}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">1 Bagian Utuh</text>
      `;
    }

    const cxFrac = 80 + utuh * spacing;
    let fracSlices = '';
    for (let i = 0; i < n; i++) {
      const startAngle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const endAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;
      const x1 = cxFrac + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cxFrac + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const isShaded = i < k;
      const fill = isShaded ? '#38bdf8' : '#ffffff';
      fracSlices += `<path d="M ${cxFrac},${cy} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${fill}" stroke="#0f172a" stroke-width="1.8"/>`;
    }
    circlesSvg += `
      <!-- Ground Shadow -->
      <ellipse cx="${cxFrac}" cy="${cy + r + 4}" rx="${(r * 0.92).toFixed(1)}" ry="8" fill="#0f172a" fill-opacity="0.08"/>
      <g>${fracSlices}</g>
      <circle cx="${cxFrac}" cy="${cy}" r="${r}" fill="none" stroke="#0f172a" stroke-width="2.2"/>
      <!-- Pivot Pin -->
      <circle cx="${cxFrac}" cy="${cy}" r="3.5" fill="#0f172a"/>
      <circle cx="${cxFrac - 1}" cy="${cy - 1}" r="1" fill="#ffffff"/>
      <!-- Badge -->
      <rect x="${cxFrac - 38}" y="${cy + r + 10}" width="76" height="20" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
      <text x="${cxFrac}" y="${cy + r + 24}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#64748b">Pecahan</text>
    `;

    // Zero-spoiler: default caption netral tanpa membocorkan nilai pecahan
    const caption = params.caption !== undefined ? params.caption : 'Daerah yang Diarsir';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="${w}" height="${h}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <rect x="15" y="8" width="160" height="18" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.8"/>
  <text x="95" y="21" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Model Pecahan Campuran</text>
  ${circlesSvg}
  ${caption ? `<text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
  }

  // Zero-spoiler: default caption netral tanpa membocorkan nilai pecahan k/n
  const caption = params.caption !== undefined ? params.caption : 'Daerah yang Diarsir';
  const cx = 160;
  const cy = 112;
  const r = 80;

  let slices = '';
  for (let i = 0; i < n; i++) {
    const startAngle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const endAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const isShaded = i < k;
    const fill = isShaded ? '#38bdf8' : '#ffffff';

    slices += `<path d="M ${cx},${cy} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${fill}" stroke="#0f172a" stroke-width="2"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="320" height="240" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <!-- Drop Shadow Base -->
  <ellipse cx="${cx}" cy="${cy + r + 6}" rx="${(r * 0.9).toFixed(1)}" ry="10" fill="#0f172a" fill-opacity="0.08"/>
  <!-- Slices -->
  <g>${slices}</g>
  <!-- Outer Perimeter Circle -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0f172a" stroke-width="2.2"/>
  <!-- Pivot Hub -->
  <circle cx="${cx}" cy="${cy}" r="4.5" fill="#0f172a"/>
  <circle cx="${cx - 1.2}" cy="${cy - 1.2}" r="1.5" fill="#ffffff"/>
  ${caption ? `<text x="160" y="222" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
}

/** Render Pecahan Persegi Panjang Kotak-Kotak (Grid) */
export function renderPecahanPersegiSvg(params: { totalKotak?: number; diarsir?: number; kolom?: number; baris?: number; caption?: string }): string {
  // Smart grid calculation: find best cols×rows from total
  let total = params.totalKotak || 8;
  let cols = params.kolom || 0;
  let rows = params.baris || 0;

  // Auto-calculate best grid layout if not explicitly specified
  if (!cols && !rows) {
    // Find factor pair closest to square root for balanced visual
    const sqrt = Math.sqrt(total);
    let bestCols = total;
    let bestRows = 1;
    let bestDiff = total;
    for (let c = Math.ceil(sqrt); c <= Math.min(total, 12); c++) {
      if (total % c === 0) {
        const r = total / c;
        const diff = Math.abs(c - r);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestCols = c;
          bestRows = r;
        }
      }
    }
    // Ensure cols >= rows for horizontal layout
    cols = Math.max(bestCols, bestRows);
    rows = Math.min(bestCols, bestRows);
  } else {
    cols = cols || 4;
    rows = rows || 2;
    total = params.totalKotak || (cols * rows);
  }

  const shaded = Math.min(total, params.diarsir || 3);
  // Zero-spoiler: default caption netral tanpa membocorkan nilai pecahan
  const caption = params.caption !== undefined ? params.caption : 'Daerah yang Diarsir';

  // Tentukan geometri kotak yang proporsional
  const isStrip = rows === 1;
  const totalW = 260;
  const boxW = Math.min(totalW / cols, isStrip ? 56 : 70);
  const startX = (320 - (cols * boxW)) / 2;
  const boxH = isStrip ? 52 : Math.min(130 / rows, 60);
  const startY = isStrip ? 75 : ((180 - (rows * boxH)) / 2) + 20;

  let boxes = '';
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      count++;
      if (count > total) break;
      const isShaded = count <= shaded;
      const x = startX + c * boxW;
      const y = startY + r * boxH;
      if (isShaded) {
        boxes += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="#7dd3fc" stroke="#0f172a" stroke-width="2"/>`;
        boxes += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="url(#diagonalHatch)" stroke="#0f172a" stroke-width="2"/>`;
      } else {
        boxes += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#0369a1" stroke-width="2.2" />
    </pattern>
  </defs>
  <g>${boxes}</g>
  ${caption ? `<text x="160" y="${isStrip ? startY + boxH + 40 : 205}" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
}

/** Render Diagram Batang (Bar Chart) */
export function renderDiagramBatangSvg(params: { judul?: string; labels?: string[]; data?: number[]; yLabel?: string }): string {
  const judul = params.judul || 'Diagram Batang Frekuensi Data';
  const labels = params.labels?.length ? params.labels : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const data = params.data?.length ? params.data : [25, 40, 30, 45, 35];
  const yLabel = params.yLabel || 'Jumlah';

  const maxVal = Math.max(...data, 10);
  let ceilMax = 10;
  let steps = 4;
  if (maxVal <= 10) { ceilMax = 10; steps = 5; }
  else if (maxVal <= 20) { ceilMax = 20; steps = 4; }
  else if (maxVal <= 50) { ceilMax = Math.ceil(maxVal / 10) * 10; steps = 5; }
  else if (maxVal <= 100) { ceilMax = Math.ceil(maxVal / 20) * 20; steps = 4; }
  else { ceilMax = Math.ceil(maxVal / 50) * 50; steps = 5; }

  const chartX = 55;
  const chartY = 46;
  const chartW = 270;
  const chartH = 136;

  let gridSvg = '';
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((ceilMax / steps) * i);
    const y = chartY + chartH - (i / steps) * chartH;
    gridSvg += `
      <line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${i === 0 ? '#0f172a' : '#e2e8f0'}" stroke-width="${i === 0 ? 2 : 1}" ${i > 0 ? 'stroke-dasharray="3,3"' : ''}/>
      <line x1="${chartX - 3}" y1="${y}" x2="${chartX}" y2="${y}" stroke="#0f172a" stroke-width="1.5"/>
      <text x="${chartX - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b">${val}</text>
    `;
  }

  let barsSvg = '';
  const barCount = data.length;
  const slotW = chartW / barCount;
  const barW = Math.min(36, Math.max(14, slotW * 0.65));

  data.forEach((val, idx) => {
    const bH = (val / ceilMax) * chartH;
    const bX = chartX + idx * slotW + (slotW - barW) / 2;
    const bY = chartY + chartH - bH;
    const lbl = labels[idx] || `${idx + 1}`;
    const isNearTop = (bY - 5) < 38;
    const valY = isNearTop ? bY + 12 : bY - 5;
    const valColor = isNearTop ? '#ffffff' : '#0369a1';

    barsSvg += `
      <rect x="${(bX + 2).toFixed(1)}" y="${(bY + 2).toFixed(1)}" width="${barW.toFixed(1)}" height="${bH.toFixed(1)}" rx="3" fill="#0f172a" fill-opacity="0.07"/>
      <rect x="${bX.toFixed(1)}" y="${bY.toFixed(1)}" width="${barW.toFixed(1)}" height="${bH.toFixed(1)}" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
      <line x1="${(bX + 2).toFixed(1)}" y1="${(bY + 1.5).toFixed(1)}" x2="${(bX + barW - 2).toFixed(1)}" y2="${(bY + 1.5).toFixed(1)}" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.5"/>
      <text x="${(bX + barW / 2).toFixed(1)}" y="${valY.toFixed(1)}" text-anchor="middle" font-size="10" font-weight="bold" fill="${valColor}">${val}</text>
      <text x="${(bX + barW / 2).toFixed(1)}" y="${chartY + chartH + 16}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#334155">${escapeXml(lbl)}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="360" height="240" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="180" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(judul)}</text>
  <text x="16" y="${chartY + chartH / 2}" text-anchor="middle" transform="rotate(-90, 16, ${chartY + chartH / 2})" font-size="10" font-weight="bold" fill="#64748b">${escapeXml(yLabel)}</text>
  ${gridSvg}
  ${barsSvg}
</svg>`;
}

/** Render Diagram Garis (Line Chart) */
export function renderDiagramGarisSvg(params: { judul?: string; labels?: string[]; data?: number[]; yLabel?: string }): string {
  const judul = params.judul || 'Diagram Garis Perubahan Data';
  const labels = params.labels?.length ? params.labels : ['06.00', '09.00', '12.00', '15.00', '18.00'];
  const data = params.data?.length ? params.data : [24, 28, 33, 31, 27];
  const yLabel = params.yLabel || 'Suhu (°C)';

  const minVal = Math.floor(Math.min(...data) / 5) * 5;
  const maxVal = Math.ceil(Math.max(...data) / 5) * 5;
  const range = maxVal - minVal || 10;

  const chartX = 55;
  const chartY = 45;
  const chartW = 270;
  const chartH = 140;

  let gridSvg = '';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = minVal + Math.round((range / steps) * i);
    const y = chartY + chartH - (i / steps) * chartH;
    gridSvg += `
      <line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${i === 0 ? '#0f172a' : '#e2e8f0'}" stroke-width="${i === 0 ? 2 : 1}"/>
      <text x="${chartX - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b">${val}</text>
    `;
  }

  const stepX = chartW / (data.length - 1 || 1);
  const points: { x: number; y: number; val: number; lbl: string }[] = [];

  data.forEach((val, idx) => {
    const x = chartX + idx * stepX;
    const y = chartY + chartH - ((val - minVal) / range) * chartH;
    points.push({ x, y, val, lbl: labels[idx] || `${idx + 1}` });
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  let dotsSvg = '';
  points.forEach(p => {
    dotsSvg += `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="10" font-weight="bold" fill="#e11d48">${p.val}</text>
      <text x="${p.x}" y="${chartY + chartH + 16}" text-anchor="middle" font-size="10.5" fill="#334155">${escapeXml(p.lbl)}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="180" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(judul)}</text>
  <text x="18" y="${chartY + chartH / 2}" text-anchor="middle" transform="rotate(-90, 18, ${chartY + chartH / 2})" font-size="10" font-weight="bold" fill="#64748b">${escapeXml(yLabel)}</text>
  ${gridSvg}
  <polyline points="${polylineStr}" fill="none" stroke="#e11d48" stroke-width="2.5"/>
  ${dotsSvg}
</svg>`;
}

/** Render Jam Analog (Telling Time) */
export function renderJamAnalogSvg(params: { jam?: number; menit?: number; caption?: string }): string {
  const jam = params.jam != null ? params.jam : 7;
  const menit = params.menit != null ? params.menit : 30;
  // Zero-spoiler: default caption netral, tidak mencetak jawaban jam/menit
  const caption = params.caption !== undefined ? params.caption : 'Jam Dinding Analog';

  const cx = 150;
  const cy = 110;
  const r = 80;

  const hourAngle = (((jam % 12) + menit / 60) * 30 - 90) * (Math.PI / 180);
  const hourLen = 45;
  const hX = cx + hourLen * Math.cos(hourAngle);
  const hY = cy + hourLen * Math.sin(hourAngle);

  const minAngle = (menit * 6 - 90) * (Math.PI / 180);
  const minLen = 65;
  const mX = cx + minLen * Math.cos(minAngle);
  const mY = cy + minLen * Math.sin(minAngle);

  let numerals = '';
  for (let h = 1; h <= 12; h++) {
    const a = (h * 30 - 90) * (Math.PI / 180);
    const numR = r - 16;
    const nx = cx + numR * Math.cos(a);
    const ny = cy + numR * Math.sin(a);
    numerals += `<text x="${nx}" y="${ny + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#334155">${h}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 230" width="300" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#cbd5e1" stroke-width="1"/>

  ${numerals}

  <line x1="${cx}" y1="${cy}" x2="${hX}" y2="${hY}" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${mX}" y2="${mY}" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="5" fill="#e11d48"/>

  ${caption ? `<text x="${cx}" y="215" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
}

/** Render Garis Bilangan (Number Line) */
export function renderGarisBilanganSvg(params: { min?: number; max?: number; titik?: Array<{ x: number; label: string }> }): string {
  const min = params.min != null ? params.min : -5;
  const max = params.max != null ? params.max : 5;
  const count = max - min;
  const points = params.titik || [];

  const startX = 35;
  const endX = 315;
  const lineY = 80;
  const step = (endX - startX) / count;

  let ticksSvg = '';
  for (let val = min; val <= max; val++) {
    const x = startX + (val - min) * step;
    const isZero = val === 0;
    ticksSvg += `
      <line x1="${x}" y1="${lineY - 7}" x2="${x}" y2="${lineY + 7}" stroke="#0f172a" stroke-width="${isZero ? 2 : 1.2}"/>
      <text x="${x}" y="${lineY + 22}" text-anchor="middle" font-size="11" font-weight="${isZero ? 'bold' : 'normal'}" fill="${isZero ? '#0f172a' : '#475569'}">${val}</text>
    `;
  }

  let markedPointsSvg = '';
  points.forEach(pt => {
    if (pt.x >= min && pt.x <= max) {
      const px = startX + (pt.x - min) * step;
      markedPointsSvg += `
        <circle cx="${px}" cy="${lineY}" r="5" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="${px}" y="${lineY - 14}" text-anchor="middle" font-size="13" font-weight="bold" fill="#e11d48">${escapeXml(pt.label)}</text>
      `;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 140" width="350" height="140" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="175" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Garis Bilangan</text>
  
  <line x1="20" y1="${lineY}" x2="330" y2="${lineY}" stroke="#0f172a" stroke-width="2"/>
  <polygon points="15,${lineY} 25,${lineY - 4} 25,${lineY + 4}" fill="#0f172a"/>
  <polygon points="335,${lineY} 325,${lineY - 4} 325,${lineY + 4}" fill="#0f172a"/>

  ${ticksSvg}
  ${markedPointsSvg}
</svg>`;
}

/** Render Diagram Venn dua himpunan dengan irisan */
export function renderDiagramVennSvg(params: { judul?: string; labelA?: string; labelB?: string; aSaja?: number; irisan?: number; bSaja?: number }): string {
  const judul = params.judul || 'Diagram Venn';
  const labelA = params.labelA || 'Himpunan A';
  const labelB = params.labelB || 'Himpunan B';
  const aSaja = params.aSaja ?? 10;
  const irisan = params.irisan ?? 5;
  const bSaja = params.bSaja ?? 8;

  const w = 380;
  const h = 260;
  const r = 85;
  const cax = 150;
  const cbx = 230;
  const cy = 125;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Judul -->
  <text x="${w / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">${escapeXml(judul)}</text>

  <!-- Kotak semesta -->
  <rect x="20" y="32" width="${w - 40}" height="${h - 60}" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" rx="6"/>
  <text x="35" y="50" font-size="11" font-weight="bold" fill="#64748b">S</text>

  <!-- Lingkaran A -->
  <circle cx="${cax}" cy="${cy}" r="${r}" fill="#bfdbfe" fill-opacity="0.6" stroke="#2563eb" stroke-width="2"/>
  <text x="${cax - 40}" y="${cy - r - 8}" font-size="12" font-weight="bold" fill="#2563eb">${escapeXml(labelA)}</text>

  <!-- Lingkaran B -->
  <circle cx="${cbx}" cy="${cy}" r="${r}" fill="#fecaca" fill-opacity="0.6" stroke="#dc2626" stroke-width="2"/>
  <text x="${cbx + 10}" y="${cy - r - 8}" font-size="12" font-weight="bold" fill="#dc2626">${escapeXml(labelB)}</text>

  <!-- Angka di area A saja -->
  <text x="${cax - 35}" y="${cy + 5}" text-anchor="middle" font-size="20" font-weight="bold" fill="#1e40af">${aSaja}</text>

  <!-- Angka di irisan -->
  <text x="${(cax + cbx) / 2}" y="${cy + 5}" text-anchor="middle" font-size="20" font-weight="bold" fill="#7c3aed">${irisan}</text>

  <!-- Angka di area B saja -->
  <text x="${cbx + 35}" y="${cy + 5}" text-anchor="middle" font-size="20" font-weight="bold" fill="#b91c1c">${bSaja}</text>

  <text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-size="11" fill="#64748b">${escapeXml(judul)}</text>
</svg>`;
}

/** Render Pictogram / Diagram Gambar dengan ikon berulang */
export function renderPictogramSvg(params: { judul?: string; labels?: string[]; data?: number[]; ikon?: string; nilaiIkon?: number; showValues?: boolean }): string {
  const judul = params.judul || 'Diagram Gambar';
  const labels = params.labels?.length ? params.labels : ['Apel', 'Jeruk', 'Mangga'];
  const data = params.data?.length ? params.data : [4, 3, 5];
  const ikon = params.ikon || '●';
  const nilaiIkon = params.nilaiIkon || 1;

  const rowH = 36;
  const labelW = 90;
  const iconW = 22;
  const maxVal = Math.max(...data);
  const w = Math.max(320, labelW + maxVal * iconW + 60);
  const h = labels.length * rowH + 90;

  let rows = '';
  const rowColors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
  labels.forEach((lbl, i) => {
    const ry = 55 + i * rowH;
    const val = data[i] || 0;
    const color = rowColors[i % rowColors.length];

    // Label
    rows += `<text x="${labelW - 5}" y="${ry + 14}" text-anchor="end" font-size="12" font-weight="600" fill="#334155">${escapeXml(lbl)}</text>`;
    // Separator line
    rows += `<line x1="${labelW}" y1="${ry - 2}" x2="${labelW}" y2="${ry + rowH - 8}" stroke="#cbd5e1" stroke-width="1"/>`;

    // Icons
    for (let j = 0; j < val; j++) {
      rows += `<text x="${labelW + 10 + j * iconW}" y="${ry + 16}" font-size="16" fill="${color}">${ikon}</text>`;
    }
    // Value hanya jika diminta eksplisit (Zero-spoiler: default jangan bocorkan hasil kali)
    if (params.showValues) {
      rows += `<text x="${labelW + 10 + val * iconW + 5}" y="${ry + 14}" font-size="11" fill="#64748b">(${val * nilaiIkon})</text>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="${w / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">${escapeXml(judul)}</text>
  <text x="${w / 2}" y="42" text-anchor="middle" font-size="10" fill="#64748b">Keterangan: ${ikon} = ${nilaiIkon}</text>
  ${rows}
  <text x="${w / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#64748b">Pictogram / Diagram Gambar</text>
</svg>`;
}

/** Render Diagram Lingkaran (Pie Chart) dengan data dan persentase */
export function renderDiagramLingkaranSvg(params: { judul?: string; labels?: string[]; data?: number[]; showPercent?: boolean }): string {
  const judul = params.judul || 'Diagram Lingkaran Data';
  const labels = params.labels?.length ? params.labels : ['Merah', 'Biru', 'Hijau', 'Kuning'];
  const data = params.data?.length ? params.data : [35, 25, 20, 20];
  const showPercent = params.showPercent !== false;

  const total = data.reduce((s, v) => s + v, 0) || 1;
  const cx = 150;
  const cy = 115;
  const r = 80;
  const colors = ['#0284c7', '#e11d48', '#047857', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

  let slicesSvg = '';
  let legendSvg = '';
  let startAngle = -Math.PI / 2;

  data.forEach((val, idx) => {
    const pct = (val / total) * 100;
    const sweep = (val / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const color = colors[idx % colors.length];
    const lbl = labels[idx] || `Item ${idx + 1}`;

    if (data.length === 1 || sweep >= 2 * Math.PI - 0.001) {
      slicesSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;
    } else {
      slicesSvg += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;
    }

    // Label di tengah slice
    const midAngle = startAngle + sweep / 2;
    const labelR = r * 0.6;
    const lx = data.length === 1 ? cx : (cx + labelR * Math.cos(midAngle));
    const ly = data.length === 1 ? cy : (cy + labelR * Math.sin(midAngle));
    if (showPercent && pct >= 5) {
      slicesSvg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">${Math.round(pct)}%</text>`;
    }

    // Legend
    const legendY = 30 + idx * 18;
    legendSvg += `
      <rect x="260" y="${legendY - 8}" width="12" height="12" fill="${color}" rx="2"/>
      <text x="278" y="${legendY + 2}" font-size="10" fill="#334155">${escapeXml(lbl)}</text>
    `;

    startAngle = endAngle;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="150" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(judul)}</text>
  ${slicesSvg}
  ${legendSvg}
</svg>`;
}

export function renderMistarSvg(params: MistarParams): string {
  const start = Math.max(0, Math.min(10, Number(params.start ?? 3.0)));
  const end = Math.max(start + 0.5, Math.min(12, Number(params.end ?? 8.5)));
  const objectType = (params.objectType || 'pensil').toLowerCase();
  const label = params.label || 'Panjang = ... cm';

  const rulerX = 40;
  const rulerY = 100;
  const maxCm = 10;
  const pxPerCm = 40;
  const rulerWidth = maxCm * pxPerCm;

  let ticks = '';
  for (let i = 0; i <= maxCm * 10; i++) {
    const x = rulerX + i * 4;
    if (i % 10 === 0) {
      const cmVal = i / 10;
      ticks += `
        <line x1="${x}" y1="${rulerY}" x2="${x}" y2="${rulerY + 20}" stroke="#0f172a" stroke-width="1.5"/>
        <text x="${x}" y="${rulerY + 34}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${cmVal}</text>
      `;
    } else if (i % 5 === 0) {
      ticks += `<line x1="${x}" y1="${rulerY}" x2="${x}" y2="${rulerY + 14}" stroke="#334155" stroke-width="1.2"/>`;
    } else {
      ticks += `<line x1="${x}" y1="${rulerY}" x2="${x}" y2="${rulerY + 8}" stroke="#64748b" stroke-width="0.8"/>`;
    }
  }

  const objStartX = rulerX + start * pxPerCm;
  const objEndX = rulerX + end * pxPerCm;
  const objWidth = objEndX - objStartX;
  const objY = 62;
  const objHeight = 22;

  let objectSvg = '';
  if (objectType === 'paku') {
    objectSvg = `
      <rect x="${objStartX}" y="${objY - 3}" width="4" height="${objHeight + 6}" fill="#475569" rx="1"/>
      <rect x="${objStartX + 4}" y="${objY + 6}" width="${objWidth - 14}" height="10" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
      <polygon points="${objEndX - 10},${objY + 6} ${objEndX},${objY + 11} ${objEndX - 10},${objY + 16}" fill="#64748b"/>
    `;
  } else if (objectType === 'penghapus') {
    objectSvg = `
      <rect x="${objStartX}" y="${objY}" width="${objWidth * 0.5}" height="${objHeight}" fill="#3b82f6" rx="3"/>
      <rect x="${objStartX + objWidth * 0.5}" y="${objY}" width="${objWidth * 0.5}" height="${objHeight}" fill="#ef4444" rx="3"/>
      <text x="${objStartX + objWidth / 2}" y="${objY + 15}" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">ERASER</text>
    `;
  } else {
    // Pensil (Default)
    const eraserW = Math.min(18, objWidth * 0.15);
    const ferruleW = Math.min(10, objWidth * 0.1);
    const tipW = Math.min(22, objWidth * 0.2);
    const bodyW = objWidth - eraserW - ferruleW - tipW;

    objectSvg = `
      <rect x="${objStartX}" y="${objY}" width="${eraserW}" height="${objHeight}" fill="#fb7185" rx="3"/>
      <rect x="${objStartX + eraserW}" y="${objY}" width="${ferruleW}" height="${objHeight}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
      <rect x="${objStartX + eraserW + ferruleW}" y="${objY}" width="${bodyW}" height="${objHeight}" fill="#f59e0b"/>
      <line x1="${objStartX + eraserW + ferruleW}" y1="${objY + 7}" x2="${objStartX + eraserW + ferruleW + bodyW}" y2="${objY + 7}" stroke="#d97706" stroke-width="1.2"/>
      <line x1="${objStartX + eraserW + ferruleW}" y1="${objY + 15}" x2="${objStartX + eraserW + ferruleW + bodyW}" y2="${objY + 15}" stroke="#b45309" stroke-width="1.2"/>
      <polygon points="${objEndX - tipW},${objY} ${objEndX},${objY + objHeight / 2} ${objEndX - tipW},${objY + objHeight}" fill="#fde68a" stroke="#d97706" stroke-width="0.8"/>
      <polygon points="${objEndX - 7},${objY + 7} ${objEndX},${objY + objHeight / 2} ${objEndX - 7},${objY + 15}" fill="#0f172a"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrMistar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <rect width="480" height="200" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Panjang dengan Mistar</text>

  <line x1="${objStartX}" y1="42" x2="${objEndX}" y2="42" stroke="#e11d48" stroke-width="2" marker-start="url(#arrMistar)" marker-end="url(#arrMistar)"/>
  <rect x="${(objStartX + objEndX) / 2 - 50}" y="31" width="100" height="20" rx="4" fill="#e11d48"/>
  <text x="${(objStartX + objEndX) / 2}" y="45" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">${escapeXml(label)}</text>

  <line x1="${objStartX}" y1="52" x2="${objStartX}" y2="${rulerY}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>
  <line x1="${objEndX}" y1="52" x2="${objEndX}" y2="${rulerY}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>

  ${objectSvg}

  <rect x="${rulerX - 5}" y="${rulerY}" width="${rulerWidth + 10}" height="65" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" rx="3" opacity="0.85"/>
  <text x="${rulerX + rulerWidth - 10}" y="${rulerY + 54}" text-anchor="end" font-size="12" font-weight="bold" fill="#78350f">cm</text>
  ${ticks}

  <text x="240" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Tentukan panjang benda berdasarkan skala pada mistar!</text>
</svg>`;
}

export function renderBusurDerajatSvg(params: BusurDerajatParams): string {
  const deg = Math.max(10, Math.min(170, Number(params.derajat ?? 60)));
  const labelChar = params.label || 'X';

  const cx = 240;
  const cy = 195;
  const R = 145;
  const rHole = 18;

  let ticks = '';
  for (let a = 0; a <= 180; a += 1) {
    const rad = (a * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    if (a % 10 === 0) {
      const x1 = cx - R * cos;
      const y1 = cy - R * sin;
      const x2 = cx - (R - 14) * cos;
      const y2 = cy - (R - 14) * sin;
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="1.2"/>`;

      const xText = cx - (R - 24) * cos;
      const yText = cy - (R - 24) * sin + 3.5;
      const val = 180 - a;
      const numLabel = (val === 0 || val === 90 || val === 180) ? `${val}°` : `${val}`;
      ticks += `<text x="${xText}" y="${yText}" text-anchor="middle" font-size="7" font-weight="600" fill="#0f172a">${numLabel}</text>`;
    } else if (a % 5 === 0) {
      const x1 = cx - R * cos;
      const y1 = cy - R * sin;
      const x2 = cx - (R - 9) * cos;
      const y2 = cy - (R - 9) * sin;
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="1"/>`;
    } else {
      const x1 = cx - R * cos;
      const y1 = cy - R * sin;
      const x2 = cx - (R - 5) * cos;
      const y2 = cy - (R - 5) * sin;
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="0.7"/>`;
    }
  }

  const baseRayX = cx + R + 25;
  const targetRad = (deg * Math.PI) / 180;
  const rayLen = R + 22;
  const rayEndX = cx + rayLen * Math.cos(targetRad);
  const rayEndY = cy - rayLen * Math.sin(targetRad);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrBusur" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
    </marker>
  </defs>

  <rect width="480" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Sudut Busur Derajat</text>

  <path d="M ${cx - R},${cy} A ${R} ${R} 0 0,1 ${cx + R},${cy} Z" fill="#fef3c7" fill-opacity="0.6" stroke="#d97706" stroke-width="1.5"/>
  <path d="M ${cx - rHole},${cy} A ${rHole} ${rHole} 0 0,1 ${cx + rHole},${cy} Z" fill="#ffffff" stroke="#d97706" stroke-width="1"/>

  ${ticks}

  <line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="${cx}" y1="${cy - 10}" x2="${cx}" y2="${cy + 5}" stroke="#0f172a" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="3" fill="#dc2626"/>

  <line x1="${cx}" y1="${cy}" x2="${baseRayX}" y2="${cy}" stroke="#dc2626" stroke-width="3" marker-end="url(#arrBusur)"/>
  <line x1="${cx}" y1="${cy}" x2="${rayEndX}" y2="${rayEndY}" stroke="#dc2626" stroke-width="3" marker-end="url(#arrBusur)"/>

  <path d="M ${cx + 40},${cy} A 40 40 0 0,0 ${cx + 40 * Math.cos(targetRad)},${cy - 40 * Math.sin(targetRad)}" fill="none" stroke="#dc2626" stroke-width="2"/>
  <circle cx="${cx + 25 * Math.cos(targetRad / 2)}" cy="${cy - 25 * Math.sin(targetRad / 2)}" r="10" fill="#e11d48"/>
  <text x="${cx + 25 * Math.cos(targetRad / 2)}" y="${cy - 25 * Math.sin(targetRad / 2) + 3.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="240" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tentukan besar sudut yang ditunjukkan oleh busur derajat!</text>
</svg>`;
}

/**
 * 1. Render Timbangan Neraca 2 Lengan (Pengukuran Massa & Keseimbangan Aljabar)
 */
export function renderTimbanganNeracaSvg(params: {
  kiri?: { nama?: string; berat?: string | number };
  kanan?: { nama?: string; berat?: string | number; anakTimbangan?: (string | number)[] };
  status?: 'seimbang' | 'miring_kiri' | 'miring_kanan';
  pointer?: 'kiri' | 'kanan';
  label?: string;
}): string {
  const status = params.status || 'seimbang';
  const labelChar = params.label || 'X';
  const pointer = params.pointer || 'kiri';

  // Sudut kemiringan lengan neraca
  let angle = 0;
  if (status === 'miring_kiri') angle = -7;
  else if (status === 'miring_kanan') angle = 7;

  const kiriBerat = params.kiri?.berat ?? '[X]';
  const anakTimbangan = params.kanan?.anakTimbangan || ['500 g', '250 g'];

  // Titik tumpu tengah
  const cx = 220;
  const cy = 95;
  const armHalfLen = 130;

  // Koordinat gantungan piringan (dengan rotasi kemiringan lengan)
  const rad = (angle * Math.PI) / 180;
  const leftHangX = cx - armHalfLen * Math.cos(rad);
  const leftHangY = cy - armHalfLen * Math.sin(rad);
  const rightHangX = cx + armHalfLen * Math.cos(rad);
  const rightHangY = cy + armHalfLen * Math.sin(rad);

  // Posisi piringan (panjang tali 65px vertikal ke bawah)
  const ropeLen = 65;
  const leftPanX = leftHangX;
  const leftPanY = leftHangY + ropeLen;
  const rightPanX = rightHangX;
  const rightPanY = rightHangY + ropeLen;
  const panW = 86;

  // Anak timbangan grafik
  let weightsSvg = '';
  anakTimbangan.forEach((w, idx) => {
    const wx = rightPanX - 35 + idx * 36;
    const wy = rightPanY - 26;
    weightsSvg += `
      <rect x="${wx}" y="${wy}" width="32" height="26" rx="3" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
      <circle cx="${wx + 16}" cy="${wy - 3}" r="4" fill="#d97706"/>
      <text x="${wx + 16}" y="${wy + 17}" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">${escapeXml(String(w))}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 260" width="440" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="440" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="220" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Massa: Neraca Dua Lengan</text>

  <!-- Landasan & Tiang Penyangga Tengah -->
  <rect x="150" y="222" width="140" height="14" rx="3" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="214" y="95" width="12" height="127" fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Dial Jarum Keseimbangan di Tengah -->
  <circle cx="${cx}" cy="${cy + 28}" r="16" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
  <line x1="${cx}" y1="${cy + 14}" x2="${cx}" y2="${cy + 18}" stroke="#dc2626" stroke-width="1.5"/>
  <!-- Jarum indikator menunjuk sesuai rotasi -->
  <line x1="${cx}" y1="${cy + 28}" x2="${cx - 11 * Math.sin(rad)}" y2="${cy + 28 - 11 * Math.cos(rad)}" stroke="#dc2626" stroke-width="2"/>

  <!-- Titik Tumpu Segitiga Pusat -->
  <polygon points="${cx},${cy - 6} ${cx - 10},${cy + 10} ${cx + 10},${cy + 10}" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>

  <!-- Batang Lengan Neraca (Horizontal Berotasi) -->
  <g transform="rotate(${angle} ${cx} ${cy})">
    <rect x="${cx - armHalfLen}" y="${cy - 4}" width="${armHalfLen * 2}" height="8" rx="3" fill="#334155" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="${cx - armHalfLen}" cy="${cy}" r="4" fill="#0f172a"/>
    <circle cx="${cx + armHalfLen}" cy="${cy}" r="4" fill="#0f172a"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="#0284c7"/>
  </g>

  <!-- PIRINGAN KIRI (Benda Beban) -->
  <!-- Tali Gantungan Kiri -->
  <line x1="${leftHangX}" y1="${leftHangY}" x2="${leftPanX - panW / 2 + 5}" y2="${leftPanY}" stroke="#64748b" stroke-width="1.5"/>
  <line x1="${leftHangX}" y1="${leftHangY}" x2="${leftPanX + panW / 2 - 5}" y2="${leftPanY}" stroke="#64748b" stroke-width="1.5"/>
  <!-- Piringan Datar Kiri -->
  <path d="M ${leftPanX - panW / 2},${leftPanY} Q ${leftPanX},${leftPanY + 12} ${leftPanX + panW / 2},${leftPanY} Z" fill="#94a3b8" stroke="#334155" stroke-width="1.5"/>

  <!-- Beban Benda Kiri (Balok Kubus Berlabel) -->
  <rect x="${leftPanX - 22}" y="${leftPanY - 42}" width="44" height="40" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  ${pointer === 'kiri' ? `
    <!-- Target Badge X Kontras Tinggi -->
    <circle cx="${leftPanX}" cy="${leftPanY - 22}" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="${leftPanX}" y="${leftPanY - 17.5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="${leftPanX}" y="${leftPanY - 17}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">${escapeXml(String(kiriBerat))}</text>
  `}
  <text x="${leftPanX}" y="${leftPanY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">Benda ${escapeXml(labelChar)}</text>

  <!-- PIRINGAN KANAN (Anak Timbangan) -->
  <!-- Tali Gantungan Kanan -->
  <line x1="${rightHangX}" y1="${rightHangY}" x2="${rightPanX - panW / 2 + 5}" y2="${rightPanY}" stroke="#64748b" stroke-width="1.5"/>
  <line x1="${rightHangX}" y1="${rightHangY}" x2="${rightPanX + panW / 2 - 5}" y2="${rightPanY}" stroke="#64748b" stroke-width="1.5"/>
  <!-- Piringan Datar Kanan -->
  <path d="M ${rightPanX - panW / 2},${rightPanY} Q ${rightPanX},${rightPanY + 12} ${rightPanX + panW / 2},${rightPanY} Z" fill="#94a3b8" stroke="#334155" stroke-width="1.5"/>

  <!-- Beban Anak Timbangan Kanan -->
  ${weightsSvg}
  <text x="${rightPanX}" y="${rightPanY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">Anak Timbangan</text>

  <!-- Keterangan Status / Soal -->
  <text x="220" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tentukan massa benda yang ditunjuk oleh huruf "${escapeXml(labelChar)}" agar neraca ${escapeXml(status.replace('_', ' '))}!</text>
</svg>`;
}

/**
 * 2. Render 8 Arah Mata Angin & Denah Spasial Berpetak
 */
export function renderMataAnginSvg(params: {
  mode?: 'kompas' | 'denah';
  targetArah?: string;
  label?: string;
}): string {
  const mode = params.mode || 'kompas';
  const labelChar = params.label || 'X';

  if (mode === 'denah') {
    // Mode Denah Grid Spasial: Menentukan arah perjalanan / posisi lokasi
    const places = [
      { name: 'Masjid', x: 75, y: 70, fill: '#ecfdf5', stroke: '#10b981', color: '#065f46' },
      { name: 'Taman Kota', x: 195, y: 70, fill: '#f0fdf4', stroke: '#22c55e', color: '#15803d' },
      { name: 'SD Wanayasa', x: 315, y: 70, fill: '#eff6ff', stroke: '#3b82f6', color: '#1d4ed8' },
      { name: 'Pasar', x: 75, y: 155, fill: '#fef3c7', stroke: '#f59e0b', color: '#b45309' },
      { name: 'Alun-Alun', x: 195, y: 155, fill: '#e0f2fe', stroke: '#0284c7', color: '#0369a1', isCenter: true },
      { name: 'Puskesmas', x: 315, y: 155, fill: '#fee2e2', stroke: '#ef4444', color: '#b91c1c' },
      { name: 'Rumah Siti', x: 75, y: 235, fill: '#faf5ff', stroke: '#a855f7', color: '#6b21a8' },
      { name: 'Pos Ronda', x: 195, y: 235, fill: '#f1f5f9', stroke: '#64748b', color: '#334155' },
      { name: 'Bank Unit', x: 315, y: 235, fill: '#fdf4ff', stroke: '#d946ef', color: '#86198f' },
    ];

    const cardsSvg = places.map(p => `
      <rect x="${p.x - 52}" y="${p.y - 24}" width="104" height="48" rx="8" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.isCenter ? '2.5' : '1.5'}"/>
      <text x="${p.x}" y="${p.y + 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="${p.color}">${escapeXml(p.name)}</text>
    `).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 295" width="500" height="295" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
    <!-- Border & Judul -->
    <rect width="500" height="295" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
    <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Denah Wilayah & Arah Mata Angin</text>

    <!-- Jalan Penghubung Antar Lokasi -->
    <line x1="75" y1="70" x2="315" y2="70" stroke="#cbd5e1" stroke-width="4"/>
    <line x1="75" y1="155" x2="315" y2="155" stroke="#cbd5e1" stroke-width="4"/>
    <line x1="75" y1="235" x2="315" y2="235" stroke="#cbd5e1" stroke-width="4"/>
    <line x1="75" y1="70" x2="75" y2="235" stroke="#cbd5e1" stroke-width="4"/>
    <line x1="195" y1="70" x2="195" y2="235" stroke="#cbd5e1" stroke-width="4"/>
    <line x1="315" y1="70" x2="315" y2="235" stroke="#cbd5e1" stroke-width="4"/>

    <!-- Kartu Lokasi -->
    ${cardsSvg}

    <!-- Kompas Mata Angin Sudut Kanan -->
    <g transform="translate(435, 95)">
      <circle cx="0" cy="0" r="42" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- Jarum Utama U-S -->
      <polygon points="0,-36 -7,0 0,-4" fill="#ef4444"/>
      <polygon points="0,-36 7,0 0,-4" fill="#dc2626"/>
      <polygon points="0,36 -7,0 0,4" fill="#64748b"/>
      <polygon points="0,36 7,0 0,4" fill="#475569"/>
      <!-- Jarum T-B -->
      <polygon points="36,0 0,-7 4,0" fill="#64748b"/>
      <polygon points="36,0 0,7 4,0" fill="#475569"/>
      <polygon points="-36,0 0,-7 -4,0" fill="#64748b"/>
      <polygon points="-36,0 0,7 -4,0" fill="#475569"/>
      <!-- Label U, T, S, B -->
      <text x="0" y="-40" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">U</text>
      <text x="47" y="4" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">T</text>
      <text x="0" y="50" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">S</text>
      <text x="-47" y="4" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">B</text>
      <circle cx="0" cy="0" r="3" fill="#0f172a"/>
    </g>

    <text x="200" y="280" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Gunakan arah mata angin untuk menentukan letak dan posisi antar lokasi!</text>
  </svg>`;
  }

  // Mode Kompas Murni 8 Arah
  const cx = 200;
  const cy = 135;
  const rMain = 80;
  const rSub = 58;

  const targetArah = (params.targetArah || '').toUpperCase();

  const points = [
    { code: 'U', name: 'Utara', angle: -90, isMain: true, color: '#dc2626' },
    { code: 'TL', name: 'Timur Laut', angle: -45, isMain: false, color: '#475569' },
    { code: 'T', name: 'Timur', angle: 0, isMain: true, color: '#0f172a' },
    { code: 'TG', name: 'Tenggara', angle: 45, isMain: false, color: '#475569' },
    { code: 'S', name: 'Selatan', angle: 90, isMain: true, color: '#0f172a' },
    { code: 'BD', name: 'Barat Daya', angle: 135, isMain: false, color: '#475569' },
    { code: 'B', name: 'Barat', angle: 180, isMain: true, color: '#0f172a' },
    { code: 'BL', name: 'Barat Laut', angle: 225, isMain: false, color: '#475569' }
  ];

  let needlesSvg = '';
  let labelsSvg = '';

  points.forEach(p => {
    const radA = (p.angle * Math.PI) / 180;
    const len = p.isMain ? rMain : rSub;
    const px = cx + len * Math.cos(radA);
    const py = cy + len * Math.sin(radA);

    // Bintang mata angin
    const radL = ((p.angle - 22.5) * Math.PI) / 180;
    const radR = ((p.angle + 22.5) * Math.PI) / 180;
    const baseR = 18;
    const lx = cx + baseR * Math.cos(radL);
    const ly = cy + baseR * Math.sin(radL);
    const rx = cx + baseR * Math.cos(radR);
    const ry = cy + baseR * Math.sin(radR);

    needlesSvg += `
      <polygon points="${px},${py} ${lx},${ly} ${cx},${cy}" fill="${p.code === 'U' ? '#ef4444' : '#64748b'}"/>
      <polygon points="${px},${py} ${rx},${ry} ${cx},${cy}" fill="${p.code === 'U' ? '#dc2626' : '#334155'}"/>
    `;

    // Posisi teks callout (diberi jarak bebas tabrakan dari ujung bintang)
    const textDist = p.isMain ? rMain + 24 : rSub + 26;
    const tx = cx + textDist * Math.cos(radA);
    const ty = cy + textDist * Math.sin(radA) + 4;

    const isTarget = targetArah === p.code;

    if (isTarget) {
      labelsSvg += `
        <circle cx="${tx}" cy="${ty - 4}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
        <text x="${tx}" y="${ty}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    } else {
      labelsSvg += `
        <g>
          <rect x="${tx - 15}" y="${ty - 14}" width="30" height="18" rx="3" fill="#ffffff" fill-opacity="0.9"/>
          <text x="${tx}" y="${ty}" text-anchor="middle" font-size="${p.isMain ? '12' : '10.5'}" font-weight="bold" fill="${p.color}">${p.code}</text>
        </g>
      `;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 270" width="400" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="400" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Delapan Arah Mata Angin</text>

  <!-- Lingkaran Kompas Penyangga -->
  <circle cx="${cx}" cy="${cy}" r="92" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>

  <!-- Sayap Bintang Jarum -->
  ${needlesSvg}

  <!-- Poros Tengah -->
  <circle cx="${cx}" cy="${cy}" r="8" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>

  <!-- Label 8 Arah Mata Angin Bebas Overlap -->
  ${labelsSvg}

  <text x="200" y="258" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan arah mata angin yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

/**
 * 3. Render Tabel Turus & Frekuensi Data (Tally Chart)
 */
export function renderTabelTurusSvg(params: {
  judul?: string;
  kategoriLabel?: string;
  data?: Array<{ label: string; count: number; targetField?: 'turus' | 'frekuensi' }>;
  targetIndex?: number;
  label?: string;
}): string {
  const judul = params.judul || 'Tabel Frekuensi Data dan Turus';
  const kategoriLabel = params.kategoriLabel || 'Jenis Olahraga';
  const labelChar = params.label || 'X';

  const items = params.data?.length ? params.data : [
    { label: 'Sepak Bola', count: 12 },
    { label: 'Bulu Tangkis', count: 8 },
    { label: 'Bola Voli', count: 6, targetField: 'frekuensi' },
    { label: 'Renang', count: 9 }
  ];

  const rowHeight = 36;
  const startX = 30;
  const startY = 50;
  const colNoW = 40;
  const colCatW = 130;
  const colTurusW = 140;
  const colFreqW = 70;
  const tableW = colNoW + colCatW + colTurusW + colFreqW; // 380
  const tableH = (items.length + 1) * rowHeight;
  const svgH = tableH + 85;

  // Header
  let tableSvg = `
    <!-- Header Tabel -->
    <rect x="${startX}" y="${startY}" width="${tableW}" height="${rowHeight}" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="${startX + colNoW / 2}" y="${startY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">No</text>
    <text x="${startX + colNoW + colCatW / 2}" y="${startY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${escapeXml(kategoriLabel)}</text>
    <text x="${startX + colNoW + colCatW + colTurusW / 2}" y="${startY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Turus (Tally)</text>
    <text x="${startX + colNoW + colCatW + colTurusW + colFreqW / 2}" y="${startY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Frekuensi</text>

    <!-- Garis Pemisah Kolom Header -->
    <line x1="${startX + colNoW}" y1="${startY}" x2="${startX + colNoW}" y2="${startY + tableH}" stroke="#94a3b8" stroke-width="1"/>
    <line x1="${startX + colNoW + colCatW}" y1="${startY}" x2="${startX + colNoW + colCatW}" y2="${startY + tableH}" stroke="#94a3b8" stroke-width="1"/>
    <line x1="${startX + colNoW + colCatW + colTurusW}" y1="${startY}" x2="${startX + colNoW + colCatW + colTurusW}" y2="${startY + tableH}" stroke="#94a3b8" stroke-width="1"/>
  `;

  // Baris-baris Data
  items.forEach((item, idx) => {
    const ry = startY + (idx + 1) * rowHeight;
    const isEven = idx % 2 === 1;
    const rowBg = isEven ? '#f8fafc' : '#ffffff';

    const isTargetFreq = item.targetField === 'frekuensi';
    const isTargetTurus = item.targetField === 'turus';

    // Gambar simbol Turus (Grup 5 garis)
    let turusGraphic = '';
    if (isTargetTurus) {
      turusGraphic = `
        <circle cx="${startX + colNoW + colCatW + colTurusW / 2}" cy="${ry + 18}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
        <text x="${startX + colNoW + colCatW + colTurusW / 2}" y="${ry + 22.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    } else {
      const fullFives = Math.floor(item.count / 5);
      const remainder = item.count % 5;
      const groupSpacing = 28;
      let startTurusX = startX + colNoW + colCatW + 15;

      for (let g = 0; g < fullFives; g++) {
        const gx = startTurusX + g * groupSpacing;
        // 4 garis vertikal
        for (let l = 0; l < 4; l++) {
          turusGraphic += `<line x1="${gx + l * 4}" y1="${ry + 8}" x2="${gx + l * 4}" y2="${ry + 26}" stroke="#0284c7" stroke-width="2"/>`;
        }
        // 1 garis miring penutup kelipatan 5
        turusGraphic += `<line x1="${gx - 2}" y1="${ry + 24}" x2="${gx + 15}" y2="${ry + 10}" stroke="#0284c7" stroke-width="2"/>`;
      }

      // Sisa 1..4 garis vertikal
      const remX = startTurusX + fullFives * groupSpacing;
      for (let r = 0; r < remainder; r++) {
        turusGraphic += `<line x1="${remX + r * 5}" y1="${ry + 8}" x2="${remX + r * 5}" y2="${ry + 26}" stroke="#0284c7" stroke-width="2"/>`;
      }
    }

    tableSvg += `
      <rect x="${startX}" y="${ry}" width="${tableW}" height="${rowHeight}" fill="${rowBg}" stroke="#cbd5e1" stroke-width="1"/>
      <text x="${startX + colNoW / 2}" y="${ry + 22}" text-anchor="middle" font-size="11" fill="#475569">${idx + 1}</text>
      <text x="${startX + colNoW + 10}" y="${ry + 22}" text-anchor="start" font-size="11" font-weight="600" fill="#1e293b">${escapeXml(item.label)}</text>
      ${turusGraphic}
      ${isTargetFreq ? `
        <circle cx="${startX + colNoW + colCatW + colTurusW + colFreqW / 2}" cy="${ry + 18}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
        <text x="${startX + colNoW + colCatW + colTurusW + colFreqW / 2}" y="${ry + 22.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      ` : `
        <text x="${startX + colNoW + colCatW + colTurusW + colFreqW / 2}" y="${ry + 22}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${item.count}</text>
      `}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 ${svgH}" width="440" height="${svgH}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="440" height="${svgH}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="220" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">${escapeXml(judul)}</text>

  <!-- Tabel Keseluruhan -->
  ${tableSvg}
  <rect x="${startX}" y="${startY}" width="${tableW}" height="${tableH}" fill="none" stroke="#64748b" stroke-width="1.5" rx="2"/>

  <text x="220" y="${svgH - 14}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Lengkapilah nilai yang ditunjuk oleh huruf "${escapeXml(labelChar)}"! </text>
</svg>`;
}

/**
 * 4. Render Roda Putar Peluang (Spinner Peluang)
 */
export function renderSpinnerPeluangSvg(params: {
  bagian?: number;
  labels?: string[];
  warna?: string[];
  jarumKe?: number;
  label?: string;
}): string {
  const n = Math.max(3, Math.min(10, params.bagian || 6));
  const labelChar = params.label || 'X';
  const jarumKe = params.jarumKe != null ? params.jarumKe : 0;

  const defaultColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  const colors = params.warna?.length ? params.warna : defaultColors;

  const labels = params.labels?.length ? params.labels : ['1', '2', '3', '4', '5', '6', '7', '8'].slice(0, n);

  const cx = 175;
  const cy = 135;
  const r = 92;

  let slicesSvg = '';
  let slicePillsSvg = '';

  for (let i = 0; i < n; i++) {
    const startAngle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const endAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const c = colors[i % colors.length];
    slicesSvg += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z" fill="${c}" stroke="#0f172a" stroke-width="2"/>`;

    // Posisi teks polar di tengah juring
    const midAngle = startAngle + Math.PI / n;
    const textR = r * 0.62;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);

    // Pill badge pelindung agar teks tidak pernah bertabrakan dengan warna juring
    slicePillsSvg += `
      <circle cx="${tx}" cy="${ty}" r="11" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"/>
      <text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0f172a">${escapeXml(labels[i])}</text>
    `;
  }

  // Sudut jarum penunjuk
  const needleAngle = (jarumKe * 2 * Math.PI) / n - Math.PI / 2 + Math.PI / n;
  const needleLen = r + 12;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  // Legenda warna di sisi kanan
  let legendSvg = '';
  for (let i = 0; i < Math.min(n, 6); i++) {
    const ly = 60 + i * 22;
    legendSvg += `
      <rect x="300" y="${ly}" width="14" height="14" rx="3" fill="${colors[i % colors.length]}" stroke="#334155" stroke-width="1"/>
      <text x="322" y="${ly + 11}" font-size="10" font-weight="600" fill="#334155">Bagian ${escapeXml(labels[i])}</text>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrSpinner" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a" />
    </marker>
  </defs>

  <!-- Border & Judul -->
  <rect width="420" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Peluang: Roda Putar (Spinner ${n} Juring)</text>

  <!-- Roda Spinner -->
  <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#f1f5f9" stroke="#0f172a" stroke-width="3"/>
  <g>${slicesSvg}</g>
  <g>${slicePillsSvg}</g>

  <!-- Jarum Penunjuk di Tengah -->
  <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#0f172a" stroke-width="3.5" marker-end="url(#arrSpinner)"/>
  <circle cx="${cx}" cy="${cy}" r="7" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>

  <!-- Legenda Sisi Kanan -->
  <text x="340" y="48" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Legenda</text>
  <rect x="290" y="34" width="105" height="150" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
  ${legendSvg}

  <text x="210" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Berapa peluang jarum berhenti pada bagian tertentu?</text>
</svg>`;
}

/**
 * 5. Render Barisan Pola Geometri / Gambar (Pola Bilangan Bergambar)
 */
export function renderPolaGambarSvg(params: {
  bentuk?: 'lingkaran' | 'bintang' | 'kotak';
  counts?: number[]; // default: [1, 3, 5, 7]
  targetSuku?: number; // default: 4
  label?: string;
}): string {
  const counts = params.counts?.length ? params.counts : [1, 3, 5, 7];
  const targetSuku = params.targetSuku != null ? params.targetSuku : 4;
  const labelChar = params.label || 'X';

  const boxW = 86;
  const boxH = 95;
  const startY = 60;
  const gap = 16;
  const startX = (450 - (4 * boxW + 3 * gap)) / 2;

  let boxesSvg = '';

  for (let s = 1; s <= 4; s++) {
    const bx = startX + (s - 1) * (boxW + gap);
    const count = counts[s - 1] ?? (2 * s - 1);
    const isTarget = s === targetSuku;

    let itemsSvg = '';
    if (isTarget) {
      itemsSvg = `
        <circle cx="${bx + boxW / 2}" cy="${startY + boxH / 2}" r="16" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
        <text x="${bx + boxW / 2}" y="${startY + boxH / 2 + 5.5}" text-anchor="middle" font-size="15" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    } else {
      // Tata titik dalam pola kisi rapi di dalam kotak
      const dotR = 6;
      if (count === 1) {
        itemsSvg = `<circle cx="${bx + boxW / 2}" cy="${startY + boxH / 2}" r="${dotR}" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>`;
      } else {
        const cols = Math.min(count, 4);
        const rows = Math.ceil(count / cols);
        const cellW = (boxW - 20) / cols;
        const cellH = (boxH - 24) / rows;
        let drawn = 0;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (drawn >= count) break;
            const dx = bx + 14 + c * cellW + cellW / 2;
            const dy = startY + 14 + r * cellH + cellH / 2;
            itemsSvg += `<circle cx="${dx}" cy="${dy}" r="${dotR}" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>`;
            drawn++;
          }
        }
      }
    }

    boxesSvg += `
      <!-- Kotak Suku ${s} -->
      <rect x="${bx}" y="${startY}" width="${boxW}" height="${boxH}" rx="8" fill="${isTarget ? '#fff1f2' : '#f8fafc'}" stroke="${isTarget ? '#f43f5e' : '#94a3b8'}" stroke-width="${isTarget ? '2' : '1.5'}" ${isTarget ? 'stroke-dasharray="4,3"' : ''}/>
      ${itemsSvg}
      <!-- Label Suku di Bawah Kotak -->
      <rect x="${bx + 12}" y="${startY + boxH + 10}" width="${boxW - 24}" height="20" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <text x="${bx + boxW / 2}" y="${startY + boxH + 24}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#334155">Pola ${s}</text>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 220" width="450" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="450" height="220" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="225" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Barisan Pola Gambar Geometri</text>

  <!-- 4 Kotak Suku Pola -->
  ${boxesSvg}

  <text x="225" y="206" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Berapakah jumlah objek pada Pola ${targetSuku} yang ditunjuk oleh huruf "${escapeXml(labelChar)}"?</text>
</svg>`;
}

/**
 * 6. Render Flowchart Algoritma & Berpikir Komputasional (Informatika & Koding SD)
 */
export function renderFlowchartSvg(params: {
  tipe?: 'ganjil_genap' | 'lampu_lalu_lintas';
  pointer?: 'kondisi' | 'output_ya' | 'output_tidak' | 'proses';
  label?: string;
}): string {
  const labelChar = params.label || 'X';
  const pointer = params.pointer || 'kondisi';

  const cx = 200;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 310" width="440" height="310" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrFlow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a" />
    </marker>
  </defs>

  <!-- Border & Judul -->
  <rect width="440" height="310" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="220" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Alir Algoritma (Flowchart)</text>

  <!-- Node 1: Mulai (Oval / Terminator) -->
  <rect x="150" y="38" width="100" height="30" rx="15" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <text x="200" y="58" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Mulai</text>

  <!-- Panah ke Input -->
  <line x1="200" y1="68" x2="200" y2="92" stroke="#0f172a" stroke-width="2" marker-end="url(#arrFlow)"/>

  <!-- Node 2: Input N (Jajar Genjang) -->
  <polygon points="135,124 150,94 265,94 250,124" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="200" y="113" text-anchor="middle" font-size="11" font-weight="bold" fill="#78350f">Input Nilai N</text>

  <!-- Panah ke Keputusan -->
  <line x1="200" y1="124" x2="200" y2="148" stroke="#0f172a" stroke-width="2" marker-end="url(#arrFlow)"/>

  <!-- Node 3: Keputusan (Belah Ketupat / Decision) -->
  <polygon points="200,150 275,178 200,206 125,178" fill="#faf5ff" stroke="#7c3aed" stroke-width="2"/>
  ${pointer === 'kondisi' ? `
    <circle cx="200" cy="178" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="200" y="182.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="200" y="175" text-anchor="middle" font-size="10" font-weight="bold" fill="#5b21b6">N mod 2 = 0 ?</text>
    <text x="200" y="188" text-anchor="middle" font-size="9" fill="#7c3aed">(Habis dibagi 2)</text>
  `}

  <!-- Cabang YA (Kanan) -->
  <line x1="275" y1="178" x2="330" y2="178" stroke="#0f172a" stroke-width="2"/>
  <line x1="330" y1="178" x2="330" y2="215" stroke="#0f172a" stroke-width="2" marker-end="url(#arrFlow)"/>
  <!-- Label YA Pill -->
  <rect x="282" y="162" width="28" height="16" rx="3" fill="#ecfdf5" stroke="#10b981" stroke-width="1"/>
  <text x="296" y="174" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#047857">Ya</text>

  <!-- Output YA: Genap -->
  <polygon points="280,246 295,218 380,218 365,246" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
  ${pointer === 'output_ya' ? `
    <circle cx="330" cy="232" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="330" y="236.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="330" y="236" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#065f46">Cetak Genap</text>
  `}

  <!-- Cabang TIDAK (Bawah) -->
  <line x1="200" y1="206" x2="200" y2="225" stroke="#0f172a" stroke-width="2"/>
  <line x1="200" y1="225" x2="110" y2="225" stroke="#0f172a" stroke-width="2"/>
  <line x1="110" y1="225" x2="110" y2="238" stroke="#0f172a" stroke-width="2" marker-end="url(#arrFlow)"/>
  <!-- Label TIDAK Pill -->
  <rect x="145" y="217" width="36" height="16" rx="3" fill="#fef2f2" stroke="#ef4444" stroke-width="1"/>
  <text x="163" y="229" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b91c1c">Tidak</text>

  <!-- Output TIDAK: Ganjil -->
  <polygon points="60,266 75,238 160,238 145,266" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/>
  ${pointer === 'output_tidak' ? `
    <circle cx="110" cy="252" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="110" y="256.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="110" y="256" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#991b1b">Cetak Ganjil</text>
  `}

  <!-- Garis Alir ke Selesai -->
  <line x1="110" y1="266" x2="110" y2="280" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="110" y1="280" x2="160" y2="280" stroke="#0f172a" stroke-width="1.5" marker-end="url(#arrFlow)"/>

  <line x1="330" y1="246" x2="330" y2="280" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="330" y1="280" x2="240" y2="280" stroke="#0f172a" stroke-width="1.5" marker-end="url(#arrFlow)"/>

  <!-- Node 4: Selesai (Oval / Terminator) -->
  <rect x="160" y="266" width="80" height="28" rx="14" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <text x="200" y="284" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">Selesai</text>

  <text x="220" y="303" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Langkah algoritma yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 7. Render Termometer Skala Celsius (°C)
 */
export function renderTermometerSvg(params: {
  suhu?: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
}): string {
  const min = params.min != null ? params.min : -10;
  const max = params.max != null ? params.max : 50;
  const rawSuhu = params.suhu != null ? params.suhu : 35;
  const suhu = Math.max(min, Math.min(max, rawSuhu));
  const unit = params.unit || '°C';
  const labelChar = params.label || 'X';

  const cx = 175;
  const tubeTopY = 48;
  const tubeH = 155;
  const tubeBottomY = tubeTopY + tubeH; // 203
  const bulbCy = tubeBottomY + 16; // 219

  // Hitung ketinggian kolom cairan merah
  const ratio = (suhu - min) / (max - min || 1);
  const liquidTopY = tubeBottomY - ratio * (tubeH - 10);

  // Garis-garis skala termometer presisi
  let scaleTicks = '';
  const range = max - min;
  for (let val = min; val <= max; val += 1) {
    const tickRatio = (val - min) / range;
    const ty = tubeBottomY - tickRatio * (tubeH - 10);
    const isMajor = val % 10 === 0;
    const isMedium = val % 5 === 0;

    if (isMajor) {
      scaleTicks += `
        <line x1="${cx - 17}" y1="${ty.toFixed(1)}" x2="${cx - 6}" y2="${ty.toFixed(1)}" stroke="#0f172a" stroke-width="1.6"/>
        <text x="${cx - 21}" y="${(ty + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" font-weight="bold" fill="#1e293b">${val}</text>
      `;
    } else if (isMedium) {
      scaleTicks += `<line x1="${cx - 13}" y1="${ty.toFixed(1)}" x2="${cx - 6}" y2="${ty.toFixed(1)}" stroke="#475569" stroke-width="1.2"/>`;
    } else {
      scaleTicks += `<line x1="${cx - 10}" y1="${ty.toFixed(1)}" x2="${cx - 6}" y2="${ty.toFixed(1)}" stroke="#94a3b8" stroke-width="0.8"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 270" width="380" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Papan Dudukan Kayu / Akrilik -->
    <linearGradient id="plaqueGradTermo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="50%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>

    <!-- Gradien Tabung Kaca Borosilikat -->
    <linearGradient id="glassTubeGradTermo" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.8"/>
      <stop offset="25%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#f8fafc" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Gradien Kolom Cairan Termometrik (Alkohol Merah / Raksa) -->
    <linearGradient id="liquidGradTermo" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b91c1c"/>
      <stop offset="40%" stop-color="#ef4444"/>
      <stop offset="80%" stop-color="#f87171"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>

    <!-- Gradien Bola Reservoir 3D -->
    <radialGradient id="bulbRadTermo" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fca5a5"/>
      <stop offset="25%" stop-color="#ef4444"/>
      <stop offset="75%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </radialGradient>

    <!-- Gradien Klem Logam Penjepit Tabung -->
    <linearGradient id="bracketGradTermo" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <!-- Drop Shadow Badge -->
    <filter id="badgeShdwTermo" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Border Luar -->
  <rect x="2" y="2" width="376" height="266" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="190" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Suhu: Termometer Laboratorium Skala ${escapeXml(unit)}</text>

  <!-- Papan Dudukan Kayu / Akrilik Instrumen -->
  <rect x="95" y="32" width="160" height="206" rx="10" fill="url(#plaqueGradTermo)" stroke="#cbd5e1" stroke-width="1.5"/>
  <!-- Sekrup Penjepit Papan di 4 Sudut -->
  <circle cx="106" cy="42" r="3" fill="#94a3b8" stroke="#64748b" stroke-width="0.8"/>
  <circle cx="244" cy="42" r="3" fill="#94a3b8" stroke="#64748b" stroke-width="0.8"/>
  <circle cx="106" cy="228" r="3" fill="#94a3b8" stroke="#64748b" stroke-width="0.8"/>
  <circle cx="244" cy="228" r="3" fill="#94a3b8" stroke="#64748b" stroke-width="0.8"/>

  <!-- Alur Kapiler Tabung Kaca Belakang -->
  <rect x="${cx - 6}" y="${tubeTopY}" width="12" height="${tubeH}" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Kolom Cairan Merah Alkohol Termometrik -->
  <rect x="${cx - 3.5}" y="${liquidTopY.toFixed(1)}" width="7" height="${(tubeBottomY - liquidTopY + 12).toFixed(1)}" fill="url(#liquidGradTermo)"/>

  <!-- Meniskus Cairan di Permukaan Atas -->
  <ellipse cx="${cx}" cy="${liquidTopY.toFixed(1)}" rx="3.5" ry="1.5" fill="#fca5a5"/>

  <!-- Tabung Kaca Borosilikat Depan (Efek Transparan Berbayang) -->
  <rect x="${cx - 6}" y="${tubeTopY}" width="12" height="${tubeH}" rx="6" fill="url(#glassTubeGradTermo)" stroke="#94a3b8" stroke-width="1.4"/>
  <!-- Refleksi Kilau Kaca Sepanjang Pipa -->
  <line x1="${cx - 3}" y1="${tubeTopY + 5}" x2="${cx - 3}" y2="${tubeBottomY}" stroke="#ffffff" stroke-width="1.2" opacity="0.75"/>

  <!-- Klem Logam Penjepit Tabung Atas & Bawah -->
  <rect x="${cx - 9}" y="${tubeTopY + 8}" width="18" height="5" rx="1" fill="url(#bracketGradTermo)" stroke="#334155" stroke-width="0.8"/>
  <rect x="${cx - 9}" y="${tubeBottomY - 8}" width="18" height="5" rx="1" fill="url(#bracketGradTermo)" stroke="#334155" stroke-width="0.8"/>

  <!-- Bola Reservoir Kaca Bawah (Bulb) -->
  <circle cx="${cx}" cy="${bulbCy}" r="18" fill="url(#bulbRadTermo)" stroke="#94a3b8" stroke-width="2"/>
  <!-- Kilap Spesular Bola Kaca 3D -->
  <ellipse cx="${cx - 5}" cy="${bulbCy - 5}" rx="5" ry="3.5" transform="rotate(-30 ${cx - 5} ${bulbCy - 5})" fill="#ffffff" opacity="0.75"/>

  <!-- Skala Angka & Ticks -->
  ${scaleTicks}
  <text x="${cx - 21}" y="${tubeTopY - 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#dc2626">${escapeXml(unit)}</text>

  <!-- Penunjuk Panah & Garis Pandu Meniskus Target [X] -->
  <polygon points="${cx + 8},${liquidTopY.toFixed(1)} ${cx + 15},${(liquidTopY - 3.5).toFixed(1)} ${cx + 15},${(liquidTopY + 3.5).toFixed(1)}" fill="#dc2626"/>
  <line x1="${cx + 15}" y1="${liquidTopY.toFixed(1)}" x2="${cx + 40}" y2="${liquidTopY.toFixed(1)}" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="3,2"/>
  <g transform="translate(${cx + 54}, ${liquidTopY.toFixed(1)})" filter="url(#badgeShdwTermo)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2.2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Prompt Pertanyaan Pedagogis Bawah -->
  <text x="190" y="255" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Suhu yang ditunjukkan oleh penunjuk "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 8. Render Gelas Ukur Volume Cairan & Selisih Volume Benda (ml)
 */
export function renderGelasUkurSvg(params: {
  mode?: 'tunggal' | 'batu';
  v1?: number; // e.g. 50 ml
  v2?: number; // e.g. 75 ml
  max?: number;
  label?: string;
}): string {
  const mode = params.mode || 'batu';
  const v1 = Math.max(10, Math.min(90, params.v1 ?? 50));
  const v2 = Math.max(v1 + 5, Math.min(100, params.v2 ?? 75));
  const maxV = params.max || 100;
  const labelChar = params.label || 'X';

  const drawCylinder = (cx: number, cy: number, volume: number, hasStone: boolean, title: string) => {
    const w = 70;
    const h = 150;
    const topY = cy - h / 2;
    const bottomY = cy + h / 2;

    const fillRatio = volume / maxV;
    const waterH = fillRatio * (h - 20);
    const waterTopY = bottomY - waterH;

    // Garis mililiter di sisi kanan silinder
    let ticks = '';
    for (let ml = 10; ml <= maxV; ml += 10) {
      const ty = bottomY - (ml / maxV) * (h - 20);
      const isMajor = ml % 20 === 0;
      ticks += `
        <line x1="${cx + w / 2 - (isMajor ? 10 : 6)}" y1="${ty}" x2="${cx + w / 2}" y2="${ty}" stroke="#334155" stroke-width="1.2"/>
        ${isMajor ? `<text x="${cx + w / 2 + 6}" y="${ty + 3.5}" font-size="9" font-weight="bold" fill="#475569">${ml}</text>` : ''}
      `;
    }

    return `
      <!-- Kaki Bejana -->
      <path d="M ${cx - 45},${bottomY + 12} L ${cx + 45},${bottomY + 12} L ${cx + 35},${bottomY} L ${cx - 35},${bottomY} Z" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>

      <!-- Badan Silinder Kaca -->
      <rect x="${cx - w / 2}" y="${topY}" width="${w}" height="${h}" rx="4" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
      <!-- Bibir Atas Menuang -->
      <path d="M ${cx - w / 2 - 4},${topY + 3} L ${cx - w / 2},${topY + 8} L ${cx - w / 2},${topY} Z" fill="#334155"/>

      <!-- Air Biru di Dalam -->
      <rect x="${cx - w / 2 + 2}" y="${waterTopY}" width="${w - 4}" height="${bottomY - waterTopY}" fill="#38bdf8" fill-opacity="0.65"/>
      <ellipse cx="${cx}" cy="${waterTopY}" rx="${w / 2 - 2}" ry="4" fill="#0284c7" fill-opacity="0.8"/>

      <!-- Objek Batu / Benda (jika ada) -->
      ${hasStone ? `
        <polygon points="${cx - 16},${bottomY - 6} ${cx - 10},${bottomY - 26} ${cx + 12},${bottomY - 28} ${cx + 18},${bottomY - 12} ${cx + 6},${bottomY - 4}" fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>
        <text x="${cx}" y="${bottomY - 12}" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">Batu</text>
      ` : ''}

      <!-- Skala Ukur -->
      ${ticks}
      <text x="${cx + w / 2 + 6}" y="${topY + 10}" font-size="9.5" font-weight="bold" fill="#0284c7">ml</text>

      <!-- Label Bawah Bejana -->
      <text x="${cx}" y="${bottomY + 28}" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">${escapeXml(title)}</text>
      <text x="${cx}" y="${bottomY + 42}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#0284c7">V = ${volume} ml</text>
    `;
  };

  if (mode === 'tunggal') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270" width="360" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
    <rect width="360" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
    <text x="180" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Volume Zat Cair (Gelas Ukur)</text>
    ${drawCylinder(160, 125, v1, false, 'Gelas Ukur')}
    <text x="180" y="252" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Volume zat cair yang terukur adalah ${v1} ml</text>
  </svg>`;
  }

  // Mode Batu: Dua gelas ukur V1 dan V2 untuk mengukur volume batu (Archimedes)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 285" width="460" height="285" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="460" height="285" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Volume Benda Tak Beraturan (Batu)</text>

  <!-- Gelas 1: Air Saja (V1) -->
  ${drawCylinder(125, 120, v1, false, 'Gelas A (Air Saja)')}

  <!-- Tanda Panah Transformasi ke Gelas 2 -->
  <g transform="translate(230, 115)">
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#0f172a" stroke-width="2.5"/>
    <polygon points="12,-5 22,0 12,5" fill="#0f172a"/>
    <text x="0" y="-10" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#64748b">+ Batu</text>
  </g>

  <!-- Gelas 2: Air + Batu (V2) -->
  ${drawCylinder(335, 120, v2, true, 'Gelas B (Air + Batu)')}

  <!-- Callout Target X -->
  <g transform="translate(230, 155)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="230" y="270" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Volume batu yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 9. Render Pohon Faktor & Faktorisasi Prima (KPK & FPB)
 */
export function renderPohonFaktorSvg(params: {
  bilangan?: number; // default 24
  targetNode?: 'akar' | 'prima1' | 'prima2' | 'prima3' | 'komposit1' | 'komposit2';
  label?: string;
}): string {
  const bil = params.bilangan || 24;
  const labelChar = params.label || 'X';
  const targetNode = params.targetNode || 'prima3';

  // Struktur pohon faktor untuk 24: 24 -> (2, 12) -> 12 -> (2, 6) -> 6 -> (2, 3)
  // Atau jika 36: 36 -> (2, 18) -> 18 -> (2, 9) -> 9 -> (3, 3)
  const is36 = bil === 36;
  const nRoot = bil;
  const p1 = 2;
  const c1 = is36 ? 18 : 12;
  const p2 = 2;
  const c2 = is36 ? 9 : 6;
  const p3 = is36 ? 3 : 2;
  const p4 = 3;

  // Koordinat Node
  const root = { x: 200, y: 48, val: nRoot };
  const nodeP1 = { x: 130, y: 105, val: p1, isPrime: true };
  const nodeC1 = { x: 270, y: 105, val: c1, isPrime: false };
  const nodeP2 = { x: 220, y: 165, val: p2, isPrime: true };
  const nodeC2 = { x: 320, y: 165, val: c2, isPrime: false };
  const nodeP3 = { x: 280, y: 225, val: p3, isPrime: true };
  const nodeP4 = { x: 360, y: 225, val: p4, isPrime: true };

  const drawNode = (n: { x: number; y: number; val: number; isPrime?: boolean }, isTarget: boolean) => {
    if (isTarget) {
      return `
        <circle cx="${n.x}" cy="${n.y}" r="17" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
        <text x="${n.x}" y="${n.y + 5.5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }

    if (n.isPrime) {
      // Bilangan prima dalam lingkaran hijau
      return `
        <circle cx="${n.x}" cy="${n.y}" r="16" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
        <text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">${n.val}</text>
      `;
    }

    // Bilangan komposit dalam kotak biru lembut
    return `
      <rect x="${n.x - 18}" y="${n.y - 15}" width="36" height="30" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
      <text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">${n.val}</text>
    `;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 280" width="420" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="420" height="280" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pohon Faktor &amp; Faktorisasi Prima</text>

  <!-- Garis-garis Cabang Penghubung -->
  <line x1="${root.x}" y1="${root.y + 12}" x2="${nodeP1.x}" y2="${nodeP1.y - 12}" stroke="#64748b" stroke-width="2"/>
  <line x1="${root.x}" y1="${root.y + 12}" x2="${nodeC1.x}" y2="${nodeC1.y - 12}" stroke="#64748b" stroke-width="2"/>

  <line x1="${nodeC1.x}" y1="${nodeC1.y + 12}" x2="${nodeP2.x}" y2="${nodeP2.y - 12}" stroke="#64748b" stroke-width="2"/>
  <line x1="${nodeC1.x}" y1="${nodeC1.y + 12}" x2="${nodeC2.x}" y2="${nodeC2.y - 12}" stroke="#64748b" stroke-width="2"/>

  <line x1="${nodeC2.x}" y1="${nodeC2.y + 12}" x2="${nodeP3.x}" y2="${nodeP3.y - 12}" stroke="#64748b" stroke-width="2"/>
  <line x1="${nodeC2.x}" y1="${nodeC2.y + 12}" x2="${nodeP4.x}" y2="${nodeP4.y - 12}" stroke="#64748b" stroke-width="2"/>

  <!-- Node Pohon -->
  ${drawNode(root, targetNode === 'akar')}
  ${drawNode(nodeP1, targetNode === 'prima1')}
  ${drawNode(nodeC1, targetNode === 'komposit1')}
  ${drawNode(nodeP2, targetNode === 'prima2')}
  ${drawNode(nodeC2, targetNode === 'komposit2')}
  ${drawNode(nodeP3, targetNode === 'prima3')}
  ${drawNode(nodeP4, false)}

  <!-- Legenda Sisi Kiri -->
  <g transform="translate(25, 170)">
    <circle cx="10" cy="10" r="8" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text x="24" y="14" font-size="10" font-weight="600" fill="#15803d">Faktor Prima</text>
    <rect x="2" y="26" width="16" height="14" rx="3" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="24" y="38" font-size="10" font-weight="600" fill="#1e40af">Komposit</text>
  </g>

  <text x="210" y="262" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tentukan nilai pada pohon faktor yang ditunjuk huruf "${escapeXml(labelChar)}"! </text>
</svg>`;
}

/**
 * 10. Render Grid Matriks 100 Pecahan Desimal & Persen (10x10)
 */
export function renderGridMatriks100Svg(params: {
  diarsir?: number; // e.g. 47 (0.47 / 47%)
  label?: string;
  caption?: string;
}): string {
  const diarsir = Math.max(0, Math.min(100, params.diarsir != null ? params.diarsir : 35));
  const labelChar = params.label || 'X';

  const startX = 65;
  const startY = 48;
  const cellSize = 16;
  const gridW = 10 * cellSize;

  let cellsSvg = '';
  let count = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      count++;
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const isShaded = count <= diarsir;

      cellsSvg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${isShaded ? '#38bdf8' : '#ffffff'}" stroke="#94a3b8" stroke-width="0.8"/>`;
      if (isShaded) {
        cellsSvg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="url(#patGrid100)" stroke="#0284c7" stroke-width="0.8"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" width="420" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <pattern id="patGrid100" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#0369a1" stroke-width="1.5"/>
    </pattern>
  </defs>

  <!-- Border & Judul -->
  <rect width="420" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Visualisasi Nilai Desimal &amp; Persen (Grid 100)</text>

  <!-- Matriks 100 Kotak -->
  <g>${cellsSvg}</g>
  <rect x="${startX}" y="${startY}" width="${gridW}" height="${gridW}" fill="none" stroke="#0f172a" stroke-width="2"/>

  <!-- Info Sisi Kanan -->
  <g transform="translate(255, 75)">
    <rect width="130" height="100" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="65" y="24" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Keterangan Grid</text>
    <text x="15" y="46" font-size="10" fill="#475569">Total Kotak: 100</text>
    <text x="15" y="66" font-size="10" fill="#475569">Kotak Diarsir: ${diarsir}</text>
    <rect x="15" y="74" width="100" height="18" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1"/>
    <text x="65" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Nilai = [ ${escapeXml(labelChar)} ]</text>
  </g>

  <text x="210" y="234" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tentukan nilai desimal atau persen yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

/**
 * =========================================================================
 * BATCH 1: NUMBERS, PLACE VALUE & VISUAL ALGEBRA (9 Renderers)
 * =========================================================================
 */

/** 1. Blok Dienes (Base-10 Blocks: Ribuan, Ratusan, Puluhan, Satuan) */
export function renderBlokDienesSvg(params: { ribuan?: number; ratusan?: number; puluhan?: number; satuan?: number; label?: string }): string {
  const rib = Math.max(0, Math.min(3, params.ribuan !== undefined ? params.ribuan : 1));
  const rat = Math.max(0, Math.min(5, params.ratusan !== undefined ? params.ratusan : 2));
  const pul = Math.max(0, Math.min(6, params.puluhan !== undefined ? params.puluhan : 4));
  const sat = Math.max(0, Math.min(8, params.satuan !== undefined ? params.satuan : 5));
  const labelChar = params.label || 'X';

  // Ribuan block (Isometric Cube representation)
  let ribSvg = '';
  for (let i = 0; i < rib; i++) {
    const ox = 30 + i * 16;
    const oy = 135 - i * 14;
    ribSvg += `
      <g>
        <!-- Front -->
        <rect x="${ox}" y="${oy}" width="42" height="42" fill="#0284c7" stroke="#0f172a" stroke-width="1.2"/>
        <line x1="${ox + 14}" y1="${oy}" x2="${ox + 14}" y2="${oy + 42}" stroke="#0369a1" stroke-dasharray="2,2"/>
        <line x1="${ox + 28}" y1="${oy}" x2="${ox + 28}" y2="${oy + 42}" stroke="#0369a1" stroke-dasharray="2,2"/>
        <line x1="${ox}" y1="${oy + 14}" x2="${ox + 42}" y2="${oy + 14}" stroke="#0369a1" stroke-dasharray="2,2"/>
        <line x1="${ox}" y1="${oy + 28}" x2="${ox + 42}" y2="${oy + 28}" stroke="#0369a1" stroke-dasharray="2,2"/>
        <!-- Top -->
        <polygon points="${ox},${oy} ${ox + 14},${oy - 12} ${ox + 56},${oy - 12} ${ox + 42},${oy}" fill="#38bdf8" stroke="#0f172a" stroke-width="1.2"/>
        <!-- Side -->
        <polygon points="${ox + 42},${oy} ${ox + 56},${oy - 12} ${ox + 56},${oy + 30} ${ox + 42},${oy + 42}" fill="#0369a1" stroke="#0f172a" stroke-width="1.2"/>
      </g>
    `;
  }

  // Ratusan flat slab (10x10 slab)
  let ratSvg = '';
  for (let i = 0; i < rat; i++) {
    const ox = 150 + (i % 2) * 44;
    const oy = 95 + Math.floor(i / 2) * 44;
    ratSvg += `
      <g>
        <polygon points="${ox},${oy + 32} ${ox + 32},${oy + 32} ${ox + 42},${oy + 22} ${ox + 10},${oy + 22}" fill="#38bdf8" stroke="#0f172a" stroke-width="1"/>
        <rect x="${ox}" y="${oy + 32}" width="32" height="6" fill="#0284c7" stroke="#0f172a" stroke-width="1"/>
        <polygon points="${ox + 32},${oy + 32} ${ox + 42},${oy + 22} ${ox + 42},${oy + 28} ${ox + 32},${oy + 38}" fill="#0369a1" stroke="#0f172a" stroke-width="1"/>
      </g>
    `;
  }

  // Puluhan rods (1x10 bar)
  let pulSvg = '';
  for (let i = 0; i < pul; i++) {
    const rx = 270 + i * 14;
    const ry = 95;
    pulSvg += `
      <g>
        <rect x="${rx}" y="${ry}" width="9" height="65" fill="#38bdf8" stroke="#0f172a" stroke-width="1"/>
        <!-- Ticks on rod -->
        <line x1="${rx}" y1="${ry + 13}" x2="${rx + 9}" y2="${ry + 13}" stroke="#0284c7"/>
        <line x1="${rx}" y1="${ry + 26}" x2="${rx + 9}" y2="${ry + 26}" stroke="#0284c7"/>
        <line x1="${rx}" y1="${ry + 39}" x2="${rx + 9}" y2="${ry + 39}" stroke="#0284c7"/>
        <line x1="${rx}" y1="${ry + 52}" x2="${rx + 9}" y2="${ry + 52}" stroke="#0284c7"/>
      </g>
    `;
  }

  // Satuan units (1x1 cube)
  let satSvg = '';
  for (let i = 0; i < sat; i++) {
    const sx = 390 + (i % 3) * 25;
    const sy = 98 + Math.floor(i / 3) * 25;
    satSvg += `
      <g>
        <rect x="${sx}" y="${sy}" width="14" height="14" fill="#38bdf8" stroke="#0f172a" stroke-width="1"/>
        <polygon points="${sx},${sy} ${sx + 5},${sy - 4} ${sx + 19},${sy - 4} ${sx + 14},${sy}" fill="#7dd3fc" stroke="#0f172a" stroke-width="0.8"/>
        <polygon points="${sx + 14},${sy} ${sx + 19},${sy - 4} ${sx + 19},${sy + 10} ${sx + 14},${sy + 14}" fill="#0284c7" stroke="#0f172a" stroke-width="0.8"/>
      </g>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 270" width="500" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="500" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="250" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Visualisasi Nilai Tempat (Blok Dienes)</text>

  <!-- 4 Kolom Kategori -->
  <line x1="130" y1="36" x2="130" y2="205" stroke="#e2e8f0" stroke-width="1.5"/>
  <line x1="255" y1="36" x2="255" y2="205" stroke="#e2e8f0" stroke-width="1.5"/>
  <line x1="375" y1="36" x2="375" y2="205" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Header Kolom -->
  <text x="70" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Ribuan</text>
  <text x="70" y="66" text-anchor="middle" font-size="9" fill="#64748b">(1.000)</text>

  <text x="192" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Ratusan</text>
  <text x="192" y="66" text-anchor="middle" font-size="9" fill="#64748b">(100)</text>

  <text x="315" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Puluhan</text>
  <text x="315" y="66" text-anchor="middle" font-size="9" fill="#64748b">(10)</text>

  <text x="435" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Satuan</text>
  <text x="435" y="66" text-anchor="middle" font-size="9" fill="#64748b">(1)</text>

  <!-- Blok Items -->
  <g>${ribSvg}</g>
  <g>${ratSvg}</g>
  <g>${pulSvg}</g>
  <g>${satSvg}</g>

  <!-- Jumlah Keterangan di Bawah Blok -->
  <text x="70" y="195" text-anchor="middle" font-size="10" font-weight="600" fill="#0369a1">${rib} Kubus</text>
  <text x="192" y="195" text-anchor="middle" font-size="10" font-weight="600" fill="#0369a1">${rat} Lembar</text>
  <text x="315" y="195" text-anchor="middle" font-size="10" font-weight="600" fill="#0369a1">${pul} Batang</text>
  <text x="435" y="195" text-anchor="middle" font-size="10" font-weight="600" fill="#0369a1">${sat} Satuan</text>

  <!-- Target Badge Bawah (Zero Spoiler) -->
  <rect x="130" y="222" width="240" height="32" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
  <text x="250" y="243" text-anchor="middle" font-size="12" font-weight="bold" fill="#0369a1">Nilai Bilangan = [ ${escapeXml(labelChar)} ]</text>
</svg>`;
}

/** 2. Sempoa / Abakus (Soroban 4 Tiang: Ribuan, Ratusan, Puluhan, Satuan) */
export function renderSempoaAbakusSvg(params: { nilai?: number | string; label?: string }): string {
  const rawVal = params.nilai !== undefined ? String(params.nilai).padStart(4, '0') : '3527';
  const digits = rawVal.slice(-4).split('').map(d => parseInt(d, 10) || 0);

  const colX = [105, 195, 285, 375];
  const colLabels = ['Ribuan', 'Ratusan', 'Puluhan', 'Satuan'];

  let rodsSvg = '';
  for (let c = 0; c < 4; c++) {
    const x = colX[c];
    const d = digits[c];
    const hasUpper = d >= 5;
    const lowerCount = d % 5;

    // Rod vertical line
    rodsSvg += `<line x1="${x}" y1="50" x2="${x}" y2="195" stroke="#94a3b8" stroke-width="3"/>`;

    // Upper deck bead (Soroban upper deck y=50..90, beam at y=95)
    // If active (d >= 5), bead is down against beam (cy=82). If inactive, up against frame (cy=60).
    const upperY = hasUpper ? 82 : 60;
    rodsSvg += `<ellipse cx="${x}" cy="${upperY}" rx="18" ry="7" fill="${hasUpper ? '#0284c7' : '#94a3b8'}" stroke="#0f172a" stroke-width="1.2"/>`;

    // Lower deck beads (4 beads, y=100..195)
    // Active beads pushed UP against beam (y=108, 124, 140, 156)
    // Inactive beads pushed DOWN toward frame (y=182, 166, 150, 134)
    for (let b = 0; b < 4; b++) {
      const isActive = b < lowerCount;
      const beadY = isActive ? (108 + b * 15) : (182 - (3 - b) * 15);
      rodsSvg += `<ellipse cx="${x}" cy="${beadY}" rx="18" ry="7" fill="${isActive ? '#38bdf8' : '#cbd5e1'}" stroke="#0f172a" stroke-width="1.2"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 265" width="480" height="265" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="265" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Membaca Nilai Bilangan pada Sempoa (Abakus)</text>

  <!-- Wooden Abacus Frame -->
  <rect x="55" y="42" width="370" height="160" rx="6" fill="#f8fafc" stroke="#78350f" stroke-width="5"/>
  <!-- Beam (Pemisah Atas & Bawah) -->
  <rect x="55" y="93" width="370" height="9" fill="#b45309" stroke="#78350f" stroke-width="1"/>
  <!-- Unit reckoning dots on beam -->
  <circle cx="285" cy="97" r="2.5" fill="#ffffff"/>

  <!-- Tiang dan Manik -->
  <g>${rodsSvg}</g>

  <!-- Label Tiang Nilai Tempat -->
  <text x="105" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Ribuan</text>
  <text x="195" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Ratusan</text>
  <text x="285" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Puluhan</text>
  <text x="375" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Satuan</text>

  <!-- Prompt Bawah Zero Spoiler -->
  <text x="240" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tentukan nilai bilangan cacah yang ditunjukkan oleh sempoa di atas!</text>
</svg>`;
}

/** 3. Tabel Nilai Tempat Bilangan */
export function renderTabelNilaiTempatSvg(params: { angka?: string | number; label?: string }): string {
  const labelChar = params.label || 'X';
  const cols = [
    { title: 'Ratus Ribuan', val: '4', sub: '(100.000)' },
    { title: 'Puluh Ribuan', val: '7', sub: '(10.000)' },
    { title: 'Ribuan', val: '2', sub: '(1.000)' },
    { title: 'Ratusan', val: `[ ${labelChar} ]`, sub: '(100)', highlight: true },
    { title: 'Puluhan', val: '8', sub: '(10)' },
    { title: 'Satuan', val: '5', sub: '(1)' }
  ];

  const startX = 20;
  const colW = 73;
  let cellsSvg = '';

  cols.forEach((col, idx) => {
    const cx = startX + idx * colW;
    const isHigh = !!col.highlight;
    cellsSvg += `
      <g>
        <!-- Header Cell -->
        <rect x="${cx}" y="48" width="${colW}" height="42" fill="${isHigh ? '#e0f2fe' : '#f1f5f9'}" stroke="#cbd5e1" stroke-width="1"/>
        <text x="${cx + colW / 2}" y="65" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">${escapeXml(col.title)}</text>
        <text x="${cx + colW / 2}" y="80" text-anchor="middle" font-size="8" fill="#64748b">${escapeXml(col.sub)}</text>
        <!-- Value Cell -->
        <rect x="${cx}" y="90" width="${colW}" height="55" fill="${isHigh ? '#f0fdf4' : '#ffffff'}" stroke="#cbd5e1" stroke-width="1"/>
        <text x="${cx + colW / 2}" y="125" text-anchor="middle" font-size="${isHigh ? '13' : '18'}" font-weight="bold" fill="${isHigh ? '#0284c7' : '#0f172a'}">${escapeXml(col.val)}</text>
      </g>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 230" width="480" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="230" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Tabel Analisis Nilai Tempat Bilangan</text>

  <!-- Grid Cells -->
  <g>${cellsSvg}</g>
  <rect x="${startX}" y="48" width="${colW * cols.length}" height="97" fill="none" stroke="#64748b" stroke-width="1.5"/>

  <!-- Keterangan & Soal di Bawah (Zero Overlap) -->
  <rect x="70" y="162" width="340" height="30" rx="6" fill="#f8fafc" stroke="#0284c7" stroke-width="1.2"/>
  <text x="240" y="182" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Angka pada posisi [ ${escapeXml(labelChar)} ] mempunyai nilai tempat ...</text>
  <text x="240" y="214" text-anchor="middle" font-size="10" fill="#64748b">Perhatikan letak kolom ratusan pada tabel di atas!</text>
</svg>`;
}

/** 4. Garis Bilangan Pecahan (Fraction Number Line) */
export function renderGarisBilanganPecahanSvg(params: { penyebut?: number; target?: number; label?: string }): string {
  const n = Math.max(2, Math.min(8, params.penyebut || 4));
  const target = Math.max(1, Math.min(n - 1, params.target || 3));
  const labelChar = params.label || 'X';

  const startX = 50;
  const endX = 430;
  const lineY = 100;
  const step = (endX - startX) / n;

  let ticksSvg = '';
  for (let i = 0; i <= n; i++) {
    const tx = startX + i * step;
    ticksSvg += `<line x1="${tx}" y1="${lineY - 8}" x2="${tx}" y2="${lineY + 8}" stroke="#0f172a" stroke-width="2"/>`;

    if (i === 0) {
      ticksSvg += `<text x="${tx}" y="${lineY + 28}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">0</text>`;
    } else if (i === n) {
      ticksSvg += `<text x="${tx}" y="${lineY + 28}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">1</text>`;
    } else if (i === target) {
      // Spoiler-free target pointer
      ticksSvg += `
        <!-- Pointer Arrow -->
        <polygon points="${tx},${lineY - 10} ${tx - 6},${lineY - 22} ${tx + 6},${lineY - 22}" fill="#0284c7"/>
        <!-- Target Badge -->
        <rect x="${tx - 18}" y="${lineY - 48}" width="36" height="24" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
        <text x="${tx}" y="${lineY - 32}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">[ ${escapeXml(labelChar)} ]</text>
      `;
    } else {
      ticksSvg += `<text x="${tx}" y="${lineY + 28}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${i}/${n}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="200" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="25" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Garis Bilangan Pecahan</text>

  <!-- Sumbu Utama Garis Bilangan -->
  <line x1="${startX - 15}" y1="${lineY}" x2="${endX + 15}" y2="${lineY}" stroke="#0f172a" stroke-width="2.5"/>
  <polygon points="${endX + 22},${lineY} ${endX + 12},${lineY - 5} ${endX + 12},${lineY + 5}" fill="#0f172a"/>
  <polygon points="${startX - 22},${lineY} ${startX - 12},${lineY - 5} ${startX - 12},${lineY + 5}" fill="#0f172a"/>

  <!-- Ticks & Fractions -->
  <g>${ticksSvg}</g>

  <!-- Prompt Zero Spoiler -->
  <text x="240" y="175" text-anchor="middle" font-size="11" font-weight="600" fill="#0369a1">Tentukan pecahan yang tepat untuk menggantikan huruf [ ${escapeXml(labelChar)} ]!</text>
</svg>`;
}

/** 5. Garis Bilangan Desimal (Decimal Number Line) */
export function renderGarisBilanganDesimalSvg(params: { min?: number; max?: number; target?: number; label?: string }): string {
  const min = params.min !== undefined ? params.min : 1.0;
  const max = params.max !== undefined ? params.max : 2.0;
  const target = params.target !== undefined ? params.target : 1.7;
  const labelChar = params.label || 'X';

  const startX = 50;
  const endX = 430;
  const lineY = 105;
  const totalSub = 10;
  const step = (endX - startX) / totalSub;

  let ticksSvg = '';
  for (let i = 0; i <= totalSub; i++) {
    const tx = startX + i * step;
    const val = Number((min + (i * (max - min)) / totalSub).toFixed(1));
    const isMajor = i % 2 === 0;

    ticksSvg += `<line x1="${tx}" y1="${lineY - (isMajor ? 8 : 4)}" x2="${tx}" y2="${lineY + (isMajor ? 8 : 4)}" stroke="#0f172a" stroke-width="${isMajor ? 2 : 1}"/>`;

    if (Math.abs(val - target) < 0.01) {
      ticksSvg += `
        <!-- Pointer Arrow -->
        <polygon points="${tx},${lineY - 10} ${tx - 6},${lineY - 22} ${tx + 6},${lineY - 22}" fill="#d97706"/>
        <!-- Target Badge -->
        <rect x="${tx - 18}" y="${lineY - 48}" width="36" height="24" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="${tx}" y="${lineY - 32}" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">[ ${escapeXml(labelChar)} ]</text>
      `;
    } else if (isMajor) {
      const valStr = String(val).replace('.', ',');
      ticksSvg += `<text x="${tx}" y="${lineY + 28}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${valStr}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="200" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="25" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Garis Bilangan Desimal (Ketelitian Persepuluhan)</text>

  <!-- Sumbu Utama -->
  <line x1="${startX - 15}" y1="${lineY}" x2="${endX + 15}" y2="${lineY}" stroke="#0f172a" stroke-width="2.5"/>
  <polygon points="${endX + 22},${lineY} ${endX + 12},${lineY - 5} ${endX + 12},${lineY + 5}" fill="#0f172a"/>
  <polygon points="${startX - 22},${lineY} ${startX - 12},${lineY - 5} ${startX - 12},${lineY + 5}" fill="#0f172a"/>

  <!-- Ticks -->
  <g>${ticksSvg}</g>

  <!-- Prompt Zero Spoiler -->
  <text x="240" y="175" text-anchor="middle" font-size="11" font-weight="600" fill="#b45309">Berapakah nilai desimal pada titik bertanda huruf [ ${escapeXml(labelChar)} ]?</text>
</svg>`;
}

/** 6. Perkalian Kisi / Napier Lattice (2 Digit x 2 Digit) */
export function renderPerkalianLatticeSvg(params: { num1?: number; num2?: number; label?: string }): string {
  const d1 = [3, 4];
  const d2 = [2, 5];
  const labelChar = params.label || 'X';

  const gridX = 140;
  const gridY = 65;
  const cellSize = 65;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 270" width="460" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="460" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Metode Perkalian Kisi (Lattice Multiplication)</text>

  <!-- Digit Pengali Atas (num1: 3, 4) -->
  <text x="${gridX + cellSize * 0.5}" y="52" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">${d1[0]}</text>
  <text x="${gridX + cellSize * 1.5}" y="52" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">${d1[1]}</text>

  <!-- Digit Pengali Kanan (num2: 2, 5) -->
  <text x="${gridX + cellSize * 2 + 18}" y="${gridY + cellSize * 0.5 + 6}" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">${d2[0]}</text>
  <text x="${gridX + cellSize * 2 + 18}" y="${gridY + cellSize * 1.5 + 6}" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">${d2[1]}</text>

  <!-- Grid Outer & Inner Box -->
  <rect x="${gridX}" y="${gridY}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
  <line x1="${gridX + cellSize}" y1="${gridY}" x2="${gridX + cellSize}" y2="${gridY + cellSize * 2}" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="${gridX}" y1="${gridY + cellSize}" x2="${gridX + cellSize * 2}" y2="${gridY + cellSize}" stroke="#0f172a" stroke-width="1.5"/>

  <!-- Diagonals across cells -->
  <!-- Cell (0,0): 3 x 2 = 06 -->
  <line x1="${gridX + cellSize}" y1="${gridY}" x2="${gridX}" y2="${gridY + cellSize}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${gridX + 18}" y="${gridY + 24}" font-size="12" font-weight="bold" fill="#475569">0</text>
  <text x="${gridX + 44}" y="${gridY + 52}" font-size="12" font-weight="bold" fill="#475569">6</text>

  <!-- Cell (1,0): 4 x 2 = 08 -->
  <line x1="${gridX + cellSize * 2}" y1="${gridY}" x2="${gridX + cellSize}" y2="${gridY + cellSize}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${gridX + cellSize + 18}" y="${gridY + 24}" font-size="12" font-weight="bold" fill="#475569">0</text>
  <text x="${gridX + cellSize + 44}" y="${gridY + 52}" font-size="12" font-weight="bold" fill="#475569">8</text>

  <!-- Cell (0,1): 3 x 5 = 15 -->
  <line x1="${gridX + cellSize}" y1="${gridY + cellSize}" x2="${gridX}" y2="${gridY + cellSize * 2}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${gridX + 18}" y="${gridY + cellSize + 24}" font-size="12" font-weight="bold" fill="#475569">1</text>
  <text x="${gridX + 44}" y="${gridY + cellSize + 52}" font-size="12" font-weight="bold" fill="#475569">5</text>

  <!-- Cell (1,1): 4 x 5 = 20 (Target [X] on ones or tens) -->
  <line x1="${gridX + cellSize * 2}" y1="${gridY + cellSize}" x2="${gridX + cellSize}" y2="${gridY + cellSize * 2}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${gridX + cellSize + 18}" y="${gridY + cellSize + 24}" font-size="12" font-weight="bold" fill="#475569">2</text>
  <rect x="${gridX + cellSize + 32}" y="${gridY + cellSize + 36}" width="26" height="20" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1"/>
  <text x="${gridX + cellSize + 45}" y="${gridY + cellSize + 51}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">[${escapeXml(labelChar)}]</text>

  <!-- Extended diagonal sum guides -->
  <line x1="${gridX}" y1="${gridY + cellSize * 2}" x2="${gridX - 25}" y2="${gridY + cellSize * 2 + 25}" stroke="#94a3b8" stroke-dasharray="3,3"/>
  <line x1="${gridX + cellSize}" y1="${gridY + cellSize * 2}" x2="${gridX + cellSize - 25}" y2="${gridY + cellSize * 2 + 25}" stroke="#94a3b8" stroke-dasharray="3,3"/>

  <!-- Prompt Bottom Zero Spoiler -->
  <text x="230" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#0369a1">Tentukan angka satuan yang tepat untuk menggantikan simbol [ ${escapeXml(labelChar)} ]!</text>
</svg>`;
}

/** 7. Pola Barisan Ubin Geometris (Tile Pattern Sequence) */
export function renderPolaUbinSvg(params: { pola?: number[]; label?: string }): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 220" width="500" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="500" height="220" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="250" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pola Bilangan Geometris (Barisan Ubin)</text>

  <!-- Pola 1 (1 Ubin) -->
  <rect x="52" y="90" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <text x="63" y="152" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Pola 1</text>
  <text x="63" y="170" text-anchor="middle" font-size="10" fill="#64748b">(1 Ubin)</text>

  <!-- Pola 2 (3 Ubin) -->
  <rect x="160" y="90" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <rect x="182" y="90" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <rect x="160" y="68" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <text x="182" y="152" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Pola 2</text>
  <text x="182" y="170" text-anchor="middle" font-size="10" fill="#64748b">(3 Ubin)</text>

  <!-- Pola 3 (5 Ubin) -->
  <rect x="275" y="90" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <rect x="297" y="90" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <rect x="319" y="90" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <rect x="275" y="68" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <rect x="275" y="46" width="22" height="22" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" rx="2"/>
  <text x="302" y="152" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Pola 3</text>
  <text x="302" y="170" text-anchor="middle" font-size="10" fill="#64748b">(5 Ubin)</text>

  <!-- Pola 4 (Target [X]) -->
  <rect x="390" y="55" width="70" height="65" fill="#f8fafc" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,4" rx="6"/>
  <text x="425" y="92" text-anchor="middle" font-size="14" font-weight="bold" fill="#0284c7">[ ${escapeXml(labelChar)} ]</text>
  <text x="425" y="152" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Pola 4</text>
  <text x="425" y="170" text-anchor="middle" font-size="10" fill="#0284c7">( ... Ubin? )</text>

  <!-- Prompt Zero Spoiler -->
  <text x="250" y="202" text-anchor="middle" font-size="11" font-weight="600" fill="#334155">Berapa banyak ubin penyusun yang dibutuhkan untuk membentuk Pola ke-4?</text>
</svg>`;
}

/** 8. Pita Pecahan Ekivalen (Fraction Strips) */
export function renderPitaPecahanSvg(params: { label?: string }): string {
  const startX = 40;
  const stripW = 400;
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 255" width="480" height="255" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="255" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pita Pecahan Senilai (Fraction Strips)</text>

  <!-- Strip 1 Utuh -->
  <rect x="${startX}" y="45" width="${stripW}" height="26" fill="#bfdbfe" stroke="#1e40af" stroke-width="1.5" rx="3"/>
  <line x1="${startX + 2}" y1="47" x2="${startX + stripW - 2}" y2="47" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.2"/>
  <text x="${startX + stripW / 2}" y="62" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e3a8a">1 Bagian Utuh (1/1)</text>

  <!-- Strip 1/2 -->
  <rect x="${startX}" y="77" width="${stripW / 2}" height="26" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" rx="2"/>
  <line x1="${startX + 2}" y1="79" x2="${startX + stripW / 2 - 2}" y2="79" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.2"/>
  <text x="${startX + stripW / 4}" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">1/2</text>
  <rect x="${startX + stripW / 2}" y="77" width="${stripW / 2}" height="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" rx="2"/>
  <text x="${startX + (3 * stripW) / 4}" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">1/2</text>

  <!-- Strip 1/4 -->
  <rect x="${startX}" y="109" width="${stripW / 4}" height="26" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" rx="2"/>
  <line x1="${startX + 2}" y1="111" x2="${startX + stripW / 4 - 2}" y2="111" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.2"/>
  <text x="${startX + stripW / 8}" y="126" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">1/4</text>
  <rect x="${startX + stripW / 4}" y="109" width="${stripW / 4}" height="26" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" rx="2"/>
  <line x1="${startX + stripW / 4 + 2}" y1="111" x2="${startX + stripW / 2 - 2}" y2="111" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.2"/>
  <text x="${startX + (3 * stripW) / 8}" y="126" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">1/4</text>
  <rect x="${startX + stripW / 2}" y="109" width="${stripW / 4}" height="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" rx="2"/>
  <text x="${startX + (5 * stripW) / 8}" y="126" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">1/4</text>
  <rect x="${startX + (3 * stripW) / 4}" y="109" width="${stripW / 4}" height="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" rx="2"/>
  <text x="${startX + (7 * stripW) / 8}" y="126" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">1/4</text>

  <!-- Strip 1/8 -->
  <rect x="${startX}" y="141" width="${stripW / 8}" height="26" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2" rx="2"/>
  <line x1="${startX + 2}" y1="143" x2="${startX + stripW / 8 - 2}" y2="143" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
  <text x="${startX + stripW / 16}" y="158" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">1/8</text>
  <rect x="${startX + stripW / 8}" y="141" width="${stripW / 8}" height="26" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2" rx="2"/>
  <line x1="${startX + stripW / 8 + 2}" y1="143" x2="${startX + stripW / 4 - 2}" y2="143" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
  <text x="${startX + (3 * stripW) / 16}" y="158" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">1/8</text>
  <rect x="${startX + (2 * stripW) / 8}" y="141" width="${stripW / 8}" height="26" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2" rx="2"/>
  <line x1="${startX + (2 * stripW) / 8 + 2}" y1="143" x2="${startX + (3 * stripW) / 8 - 2}" y2="143" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
  <text x="${startX + (5 * stripW) / 16}" y="158" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">1/8</text>
  <rect x="${startX + (3 * stripW) / 8}" y="141" width="${stripW / 8}" height="26" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2" rx="2"/>
  <line x1="${startX + (3 * stripW) / 8 + 2}" y1="143" x2="${startX + stripW / 2 - 2}" y2="143" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
  <text x="${startX + (7 * stripW) / 16}" y="158" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">1/8</text>
  <!-- Rest 1/8 white -->
  <rect x="${startX + stripW / 2}" y="141" width="${stripW / 2}" height="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" rx="2"/>
  <text x="${startX + (3 * stripW) / 4}" y="158" text-anchor="middle" font-size="10" fill="#64748b">4/8 Lainnya</text>

  <!-- Garis Pedoman Vertikal (Alignment Line) -->
  <line x1="${startX + stripW / 2}" y1="38" x2="${startX + stripW / 2}" y2="175" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4"/>
  <polygon points="${startX + stripW / 2},42 ${startX + stripW / 2 - 4},36 ${startX + stripW / 2 + 4},36" fill="#ef4444"/>

  <!-- Prompt Zero Spoiler -->
  <rect x="80" y="186" width="320" height="30" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>
  <text x="240" y="205" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Pecahan Senilai: 1/2 = 2/4 = [ ${escapeXml(labelChar)} ] / 8</text>
  <text x="240" y="238" text-anchor="middle" font-size="10.5" fill="#64748b">Berdasarkan garis pembanding merah, berapa pembilang yang tepat?</text>
</svg>`;
}

/** 9. Uang Rupiah (Kombinasi Uang Kertas & Logam) */
export function renderMatriksNilaiUangSvg(params: { label?: string }): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 270" width="500" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="500" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="250" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Kombinasi Pecahan Uang Rupiah</text>

  <!-- Lembar Rp50.000 (Biru) -->
  <g transform="translate(35, 45)">
    <rect width="125" height="65" rx="4" fill="#38bdf8" stroke="#0369a1" stroke-width="1.5"/>
    <rect x="5" y="5" width="115" height="55" rx="2" fill="none" stroke="#0284c7" stroke-dasharray="2,2"/>
    <text x="12" y="24" font-size="11" font-weight="bold" fill="#0c4a6e">50000</text>
    <text x="62" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">INDONESIA</text>
    <text x="115" y="56" text-anchor="end" font-size="9" font-weight="bold" fill="#0c4a6e">Rp50.000</text>
  </g>

  <!-- Lembar Rp20.000 (Hijau) -->
  <g transform="translate(185, 45)">
    <rect width="125" height="65" rx="4" fill="#86efac" stroke="#15803d" stroke-width="1.5"/>
    <rect x="5" y="5" width="115" height="55" rx="2" fill="none" stroke="#16a34a" stroke-dasharray="2,2"/>
    <text x="12" y="24" font-size="11" font-weight="bold" fill="#14532d">20000</text>
    <text x="62" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="#15803d">INDONESIA</text>
    <text x="115" y="56" text-anchor="end" font-size="9" font-weight="bold" fill="#14532d">Rp20.000</text>
  </g>

  <!-- Lembar Rp10.000 (Ungu) -->
  <g transform="translate(335, 45)">
    <rect width="125" height="65" rx="4" fill="#d8b4fe" stroke="#7e22ce" stroke-width="1.5"/>
    <rect x="5" y="5" width="115" height="55" rx="2" fill="none" stroke="#9333ea" stroke-dasharray="2,2"/>
    <text x="12" y="24" font-size="11" font-weight="bold" fill="#581c87">10000</text>
    <text x="62" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="#7e22ce">INDONESIA</text>
    <text x="115" y="56" text-anchor="end" font-size="9" font-weight="bold" fill="#581c87">Rp10.000</text>
  </g>

  <!-- Koin Rp1.000 (Logam Kuningan / Perak) -->
  <g transform="translate(130, 155)">
    <circle cx="28" cy="28" r="26" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
    <circle cx="28" cy="28" r="18" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
    <text x="28" y="32" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">1000</text>
    <text x="28" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="#64748b">1 Koin Rp1.000</text>
  </g>

  <!-- 2 Koin Rp500 (Logam Aluminium Perak) -->
  <g transform="translate(270, 155)">
    <circle cx="22" cy="28" r="22" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>
    <text x="22" y="32" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">500</text>

    <circle cx="68" cy="28" r="22" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>
    <text x="68" y="32" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">500</text>

    <text x="45" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="#64748b">2 Koin Rp500</text>
  </g>

  <!-- Prompt Zero Spoiler -->
  <rect x="130" y="235" width="240" height="26" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.2"/>
  <text x="250" y="252" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">Total Nilai Seluruh Uang = [ ${escapeXml(labelChar)} ]</text>
</svg>`;
}

/**
 * =========================================================================
 * BATCH 1: COMPARATIVE STATISTICS & PROBABILITY (8 Renderers)
 * =========================================================================
 */

/** 10. Diagram Batang Ganda (Double Bar Chart) */
export function renderDiagramBatangGandaSvg(params: { label?: string }): string {
  const cats = ['Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const data1 = [24, 28, 20, 32]; // Seri 1 (Laki-laki)
  const data2 = [26, 22, 25, 30]; // Seri 2 (Perempuan)
  const maxVal = 35;

  const startX = 65;
  const baseY = 200;
  const chartH = 140;
  const colSpacing = 95;

  let barsSvg = '';
  for (let i = 0; i < 4; i++) {
    const cx = startX + i * colSpacing;
    const h1 = (data1[i] / maxVal) * chartH;
    const h2 = (data2[i] / maxVal) * chartH;

    // Bar 1 (Laki-laki)
    barsSvg += `<rect x="${cx}" y="${baseY - h1}" width="24" height="${h1}" fill="#0284c7" rx="2"/>`;
    barsSvg += `<text x="${cx + 12}" y="${baseY - h1 - 5}" text-anchor="middle" font-size="9" font-weight="bold" fill="#0284c7">${data1[i]}</text>`;

    // Bar 2 (Perempuan)
    barsSvg += `<rect x="${cx + 28}" y="${baseY - h2}" width="24" height="${h2}" fill="#f59e0b" rx="2"/>`;
    barsSvg += `<text x="${cx + 40}" y="${baseY - h2 - 5}" text-anchor="middle" font-size="9" font-weight="bold" fill="#d97706">${data2[i]}</text>`;

    // Category Label below
    barsSvg += `<text x="${cx + 26}" y="${baseY + 18}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">${cats[i]}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="180" y="24" font-size="13" font-weight="bold" fill="#0f172a">Diagram Batang Ganda: Jumlah Siswa</text>

  <!-- Legend (Top Right) -->
  <g transform="translate(320, 12)">
    <rect width="12" height="12" fill="#0284c7" rx="2"/>
    <text x="18" y="10" font-size="10" font-weight="600" fill="#334155">Laki-laki</text>
    <rect x="75" y="0" width="12" height="12" fill="#f59e0b" rx="2"/>
    <text x="93" y="10" font-size="10" font-weight="600" fill="#334155">Perempuan</text>
  </g>

  <!-- Grid Lines & Y-Ticks -->
  <line x1="45" y1="60" x2="450" y2="60" stroke="#f1f5f9" stroke-width="1"/>
  <text x="38" y="64" text-anchor="end" font-size="9" fill="#94a3b8">35</text>
  <line x1="45" y1="100" x2="450" y2="100" stroke="#f1f5f9" stroke-width="1"/>
  <text x="38" y="104" text-anchor="end" font-size="9" fill="#94a3b8">25</text>
  <line x1="45" y1="140" x2="450" y2="140" stroke="#f1f5f9" stroke-width="1"/>
  <text x="38" y="144" text-anchor="end" font-size="9" fill="#94a3b8">15</text>
  <line x1="45" y1="180" x2="450" y2="180" stroke="#f1f5f9" stroke-width="1"/>
  <text x="38" y="184" text-anchor="end" font-size="9" fill="#94a3b8">5</text>

  <!-- Axes -->
  <line x1="45" y1="50" x2="45" y2="${baseY}" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="45" y1="${baseY}" x2="450" y2="${baseY}" stroke="#0f172a" stroke-width="1.5"/>

  <!-- Bars & Categories -->
  <g>${barsSvg}</g>

  <!-- Bottom Prompt (Zero Spoiler) -->
  <text x="240" y="250" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Berapakah selisih total siswa laki-laki dan perempuan pada kelas 4 dan kelas 6?</text>
</svg>`;
}

/** 11. Diagram Garis Ganda (Double Line Graph) */
export function renderDiagramGarisGandaSvg(params: { label?: string }): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'];
  const s1 = [15, 25, 20, 35, 30]; // 2023
  const s2 = [10, 18, 28, 24, 38]; // 2024
  const maxVal = 40;

  const startX = 65;
  const baseY = 195;
  const chartH = 135;
  const colSpacing = 85;

  let pts1: Array<{ x: number; y: number }> = [];
  let pts2: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < 5; i++) {
    const x = startX + i * colSpacing;
    const y1 = baseY - (s1[i] / maxVal) * chartH;
    const y2 = baseY - (s2[i] / maxVal) * chartH;
    pts1.push({ x, y: y1 });
    pts2.push({ x, y: y2 });
  }

  const poly1 = pts1.map(p => `${p.x},${p.y}`).join(' ');
  const poly2 = pts2.map(p => `${p.x},${p.y}`).join(' ');

  let markersSvg = '';
  for (let i = 0; i < 5; i++) {
    // Seri 1 circle
    markersSvg += `<circle cx="${pts1[i].x}" cy="${pts1[i].y}" r="4" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>`;
    // Seri 2 rect
    markersSvg += `<rect x="${pts2[i].x - 3.5}" y="${pts2[i].y - 3.5}" width="7" height="7" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>`;
    // Month label
    markersSvg += `<text x="${pts1[i].x}" y="${baseY + 18}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">${months[i]}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="180" y="24" font-size="13" font-weight="bold" fill="#0f172a">Diagram Garis Ganda: Tren Penjualan</text>

  <!-- Legend (Top Right) -->
  <g transform="translate(320, 12)">
    <circle cx="6" cy="6" r="4" fill="#0284c7"/>
    <text x="16" y="10" font-size="10" font-weight="600" fill="#334155">Tahun 2023</text>
    <rect x="75" y="2" width="7" height="7" fill="#f59e0b"/>
    <text x="88" y="10" font-size="10" font-weight="600" fill="#334155">Tahun 2024</text>
  </g>

  <!-- Grid Lines -->
  <line x1="45" y1="60" x2="440" y2="60" stroke="#f1f5f9" stroke-width="1"/>
  <text x="38" y="64" text-anchor="end" font-size="9" fill="#94a3b8">40</text>
  <line x1="45" y1="105" x2="440" y2="105" stroke="#f1f5f9" stroke-width="1"/>
  <text x="38" y="109" text-anchor="end" font-size="9" fill="#94a3b8">25</text>
  <line x1="45" y1="150" x2="440" y2="150" stroke="#f1f5f9" stroke-width="1"/>
  <text x="38" y="154" text-anchor="end" font-size="9" fill="#94a3b8">10</text>

  <!-- Axes -->
  <line x1="45" y1="50" x2="45" y2="${baseY}" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="45" y1="${baseY}" x2="440" y2="${baseY}" stroke="#0f172a" stroke-width="1.5"/>

  <!-- Lines -->
  <polyline points="${poly1}" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <polyline points="${poly2}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5,3"/>

  <!-- Markers & Labels -->
  <g>${markersSvg}</g>

  <!-- Prompt Zero Spoiler -->
  <text x="240" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Pada bulan apakah terjadi kenaikan penjualan tertinggi untuk Tahun 2024?</text>
</svg>`;
}

/** 12. Diagram Titik Frekuensi (Dot Plot) */
export function renderDotPlotSvg(params: { label?: string }): string {
  const vals = [5, 6, 7, 8, 9, 10];
  const freqs = [2, 4, 6, 5, 3, 1]; // Frekuensi tumpukan titik

  const startX = 70;
  const baseY = 175;
  const colSpacing = 65;

  let dotsSvg = '';
  for (let i = 0; i < vals.length; i++) {
    const x = startX + i * colSpacing;
    const f = freqs[i];

    // Axis tick
    dotsSvg += `<line x1="${x}" y1="${baseY - 4}" x2="${x}" y2="${baseY + 6}" stroke="#0f172a" stroke-width="2"/>`;
    dotsSvg += `<text x="${x}" y="${baseY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${vals[i]}</text>`;

    // Stack of dots
    for (let d = 0; d < f; d++) {
      const cy = baseY - 12 - d * 16;
      dotsSvg += `<circle cx="${x}" cy="${cy}" r="6.5" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240" width="480" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="240" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Titik (Dot Plot Frekuensi Nilai Ulangan)</text>

  <!-- Number line baseline -->
  <line x1="45" y1="${baseY}" x2="435" y2="${baseY}" stroke="#0f172a" stroke-width="2"/>
  <polygon points="442,${baseY} 434,${baseY - 4} 434,${baseY + 4}" fill="#0f172a"/>

  <!-- Dots & Ticks -->
  <g>${dotsSvg}</g>

  <!-- Keterangan & Prompt Zero Spoiler -->
  <text x="240" y="222" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Setiap titik (●) mewakili 1 orang siswa. Berapa banyak siswa yang mendapat nilai di atas 7?</text>
</svg>`;
}

/** 13. Diagram Lingkaran Derajat (Pie Chart in Degrees) */
export function renderDiagramLingkaranDerajatSvg(params: { label?: string }): string {
  const labelChar = params.label || 'X';
  const data = [
    { nama: 'Sepak Bola', deg: 120, col: '#0284c7' },
    { nama: 'Bulu Tangkis', deg: 90, col: '#10b981' },
    { nama: 'Renang', deg: 60, col: '#8b5cf6' },
    { nama: 'Basket', deg: 90, col: '#f59e0b', isTarget: true }
  ];

  const cx = 135;
  const cy = 130;
  const r = 78;

  let currentAngle = -Math.PI / 2;
  let slicesSvg = '';

  data.forEach(item => {
    const angleRad = (item.deg * Math.PI) / 180;
    const nextAngle = currentAngle + angleRad;

    const x1 = cx + r * Math.cos(currentAngle);
    const y1 = cy + r * Math.sin(currentAngle);
    const x2 = cx + r * Math.cos(nextAngle);
    const y2 = cy + r * Math.sin(nextAngle);

    const largeArc = item.deg > 180 ? 1 : 0;
    slicesSvg += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${item.col}" stroke="#ffffff" stroke-width="2"/>`;

    // Angle label position inside slice
    const midAngle = currentAngle + angleRad / 2;
    const lx = cx + r * 0.62 * Math.cos(midAngle);
    const ly = cy + r * 0.62 * Math.sin(midAngle);

    const degText = item.isTarget ? `[ ${labelChar} ]°` : `${item.deg}°`;
    slicesSvg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">${escapeXml(degText)}</text>`;

    currentAngle = nextAngle;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 250" width="460" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="460" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Lingkaran: Minat Olahraga (Total 360°)</text>

  <!-- Pie Slices -->
  <g>${slicesSvg}</g>
  <circle cx="${cx}" cy="${cy}" r="3" fill="#ffffff"/>

  <!-- Legend Box on Right -->
  <g transform="translate(245, 60)">
    <rect width="190" height="135" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="15" y="22" font-size="11" font-weight="bold" fill="#0f172a">Keterangan Cabang</text>

    <rect x="15" y="36" width="12" height="12" fill="#0284c7" rx="2"/>
    <text x="35" y="46" font-size="10" fill="#334155">Sepak Bola: 120°</text>

    <rect x="15" y="58" width="12" height="12" fill="#10b981" rx="2"/>
    <text x="35" y="68" font-size="10" fill="#334155">Bulu Tangkis: 90°</text>

    <rect x="15" y="80" width="12" height="12" fill="#8b5cf6" rx="2"/>
    <text x="35" y="90" font-size="10" fill="#334155">Renang: 60°</text>

    <rect x="15" y="102" width="12" height="12" fill="#f59e0b" rx="2"/>
    <text x="35" y="112" font-size="10" font-weight="bold" fill="#d97706">Basket: [ ${escapeXml(labelChar)} ]°</text>
  </g>

  <!-- Prompt Zero Spoiler -->
  <text x="230" y="232" text-anchor="middle" font-size="11" font-weight="600" fill="#0369a1">Berapakah besar sudut juring untuk cabang Basket [ ${escapeXml(labelChar)} ]?</text>
</svg>`;
}

/** 14. Tabel Kontingensi Frekuensi Dua Arah (Contingency Table) */
export function renderTabelKontingensiSvg(params: { label?: string }): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 250" width="480" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Tabel Kontingensi: Data Ekskul Siswa</text>

  <!-- Table Outer Grid -->
  <g transform="translate(30, 45)">
    <!-- Header Row -->
    <rect x="0" y="0" width="420" height="32" fill="#e0f2fe" stroke="#0284c7" stroke-width="1"/>
    <text x="60" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Jenis Kelamin</text>
    <text x="175" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Pramuka</text>
    <text x="275" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">PMR</text>
    <text x="375" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Jumlah</text>

    <!-- Row 1: Laki-laki -->
    <rect x="0" y="32" width="420" height="32" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="60" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="#0f172a">Laki-laki</text>
    <text x="175" y="52" text-anchor="middle" font-size="11" fill="#334155">18</text>
    <text x="275" y="52" text-anchor="middle" font-size="11" fill="#334155">12</text>
    <text x="375" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">30</text>

    <!-- Row 2: Perempuan (Contains Target [X] at PMR) -->
    <rect x="0" y="64" width="420" height="32" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="60" y="84" text-anchor="middle" font-size="10" font-weight="600" fill="#0f172a">Perempuan</text>
    <text x="175" y="84" text-anchor="middle" font-size="11" fill="#334155">14</text>
    <!-- Target Badge -->
    <rect x="255" y="69" width="40" height="22" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
    <text x="275" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">[ ${escapeXml(labelChar)} ]</text>
    <text x="375" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">34</text>

    <!-- Row 3: Total -->
    <rect x="0" y="96" width="420" height="32" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <text x="60" y="116" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Total</text>
    <text x="175" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">32</text>
    <text x="275" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">32</text>
    <text x="375" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">64</text>

    <!-- Vertical Column Dividers -->
    <line x1="120" y1="0" x2="120" y2="128" stroke="#cbd5e1" stroke-width="1"/>
    <line x1="230" y1="0" x2="230" y2="128" stroke="#cbd5e1" stroke-width="1"/>
    <line x1="330" y1="0" x2="330" y2="128" stroke="#cbd5e1" stroke-width="1"/>
  </g>

  <!-- Prompt Zero Spoiler -->
  <text x="240" y="222" text-anchor="middle" font-size="11" font-weight="600" fill="#b45309">Berapakah banyak siswa perempuan yang mengikuti PMR pada sel bertanda [ ${escapeXml(labelChar)} ]?</text>
</svg>`;
}

/** 15. Diagram Batang Mendatar (Horizontal Bar Chart) */
export function renderDiagramBatangHorizontalSvg(params: { label?: string }): string {
  const cats = ['Singkong', 'Kedelai', 'Jagung', 'Padi'];
  const vals = [25, 40, 60, 85];
  const maxVal = 100;

  const startY = 55;
  const barH = 22;
  const rowSpacing = 38;
  const startX = 95;
  const maxBarW = 310;

  let barsSvg = '';
  for (let i = 0; i < 4; i++) {
    const y = startY + i * rowSpacing;
    const w = (vals[i] / maxVal) * maxBarW;

    // Category Label
    barsSvg += `<text x="${startX - 12}" y="${y + 15}" text-anchor="end" font-size="11" font-weight="bold" fill="#0f172a">${cats[i]}</text>`;
    // Bar
    barsSvg += `<rect x="${startX}" y="${y}" width="${w}" height="${barH}" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2" rx="3"/>`;
    // Value Label
    barsSvg += `<text x="${startX + w + 8}" y="${y + 15}" font-size="11" font-weight="bold" fill="#0369a1">${vals[i]} Ton</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 250" width="480" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="480" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Batang Mendatar: Hasil Panen Desa (Ton)</text>

  <!-- Vertical Gridlines -->
  <line x1="${startX}" y1="45" x2="${startX}" y2="200" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="${startX + maxBarW * 0.25}" y1="45" x2="${startX + maxBarW * 0.25}" y2="200" stroke="#f1f5f9" stroke-width="1"/>
  <text x="${startX + maxBarW * 0.25}" y="214" text-anchor="middle" font-size="9" fill="#94a3b8">25</text>
  <line x1="${startX + maxBarW * 0.5}" y1="45" x2="${startX + maxBarW * 0.5}" y2="200" stroke="#f1f5f9" stroke-width="1"/>
  <text x="${startX + maxBarW * 0.5}" y="214" text-anchor="middle" font-size="9" fill="#94a3b8">50</text>
  <line x1="${startX + maxBarW * 0.75}" y1="45" x2="${startX + maxBarW * 0.75}" y2="200" stroke="#f1f5f9" stroke-width="1"/>
  <text x="${startX + maxBarW * 0.75}" y="214" text-anchor="middle" font-size="9" fill="#94a3b8">75</text>
  <line x1="${startX + maxBarW}" y1="45" x2="${startX + maxBarW}" y2="200" stroke="#f1f5f9" stroke-width="1"/>
  <text x="${startX + maxBarW}" y="214" text-anchor="middle" font-size="9" fill="#94a3b8">100</text>

  <!-- Horizontal Bars & Labels -->
  <g>${barsSvg}</g>

  <!-- Prompt Zero Spoiler -->
  <text x="240" y="238" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Berapa ton selisih hasil panen antara komoditas Padi dan Jagung?</text>
</svg>`;
}

/** 16. Papan Galton Peluang / Quincunx (Binomial Probability Board) */
export function renderPapanGaltonPeluangSvg(params: { label?: string }): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 285" width="460" height="285" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="460" height="285" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Papan Galton (Percobaan Peluang Jalur Acak)</text>

  <!-- Funnel Corong Atas -->
  <polygon points="215,36 245,36 235,52 225,52" fill="#0284c7"/>
  <!-- Dropping Ball -->
  <circle cx="230" cy="46" r="4.5" fill="#ef4444"/>

  <!-- Triangular Grid of Pegs (Pins) -->
  <!-- Row 1: 1 pin -->
  <circle cx="230" cy="68" r="3" fill="#0f172a"/>
  <!-- Row 2: 2 pins -->
  <circle cx="210" cy="92" r="3" fill="#0f172a"/>
  <circle cx="250" cy="92" r="3" fill="#0f172a"/>
  <!-- Row 3: 3 pins -->
  <circle cx="190" cy="116" r="3" fill="#0f172a"/>
  <circle cx="230" cy="116" r="3" fill="#0f172a"/>
  <circle cx="270" cy="116" r="3" fill="#0f172a"/>
  <!-- Row 4: 4 pins -->
  <circle cx="170" cy="140" r="3" fill="#0f172a"/>
  <circle cx="210" cy="140" r="3" fill="#0f172a"/>
  <circle cx="250" cy="140" r="3" fill="#0f172a"/>
  <circle cx="290" cy="140" r="3" fill="#0f172a"/>
  <!-- Row 5: 5 pins -->
  <circle cx="150" cy="164" r="3" fill="#0f172a"/>
  <circle cx="190" cy="164" r="3" fill="#0f172a"/>
  <circle cx="230" cy="164" r="3" fill="#0f172a"/>
  <circle cx="270" cy="164" r="3" fill="#0f172a"/>
  <circle cx="310" cy="164" r="3" fill="#0f172a"/>

  <!-- Sample bouncing path (Red dashed) -->
  <polyline points="230,52 230,68 250,92 230,116 250,140 230,164 230,185" fill="none" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="3,2"/>

  <!-- Bottom Bins / Slots (y=180..235) -->
  <g transform="translate(110, 185)">
    <!-- Bin dividers -->
    <line x1="0" y1="0" x2="240" y2="0" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="0" y2="45" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="48" y1="0" x2="48" y2="45" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="96" y1="0" x2="96" y2="45" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="144" y1="0" x2="144" y2="45" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="192" y1="0" x2="192" y2="45" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="240" y1="0" x2="240" y2="45" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="0" y1="45" x2="240" y2="45" stroke="#0f172a" stroke-width="1.5"/>

    <!-- Bin Labels -->
    <text x="24" y="26" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">A</text>
    <text x="72" y="26" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">B</text>
    <rect x="106" y="8" width="28" height="28" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.2"/>
    <text x="120" y="26" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">[${escapeXml(labelChar)}]</text>
    <text x="168" y="26" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">D</text>
    <text x="216" y="26" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">E</text>
  </g>

  <!-- Prompt Zero Spoiler -->
  <text x="230" y="262" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Kotak penampung manakah yang memiliki kemungkinan paling besar menerima bola?</text>
</svg>`;
}

/** 17. Kartu Angka Ruang Sampel Peluang (Probability Cards) */
export function renderKartuPeluangSvg(params: { label?: string }): string {
  const labelChar = params.label || 'X';
  const cards = [
    { num: 1, col: '#38bdf8' },
    { num: 2, col: '#fb7185' },
    { num: 3, col: '#38bdf8' },
    { num: 4, col: '#fb7185' },
    { num: 5, col: '#38bdf8' },
    { num: 6, col: '#fb7185' },
    { num: 7, col: '#38bdf8' },
    { num: 8, col: '#fb7185' }
  ];

  const startX = 22;
  const cardW = 46;
  const cardH = 68;
  const spacing = 58;

  let cardsSvg = '';
  cards.forEach((c, idx) => {
    const x = startX + idx * spacing;
    const y = 60;
    cardsSvg += `
      <g>
        <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="${x + 4}" y="${y + 4}" width="${cardW - 8}" height="${cardH - 8}" rx="4" fill="${c.col}" fill-opacity="0.15" stroke="${c.col}" stroke-width="1"/>
        <text x="${x + cardW / 2}" y="${y + 42}" text-anchor="middle" font-size="20" font-weight="bold" fill="#0f172a">${c.num}</text>
      </g>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 245" width="500" height="245" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="500" height="245" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="250" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Ruang Sampel Kartu Peluang (Bilangan 1 sampai 8)</text>
  <text x="250" y="44" text-anchor="middle" font-size="10" fill="#64748b">Sebuah kartu diambil secara acak dari 8 kartu bernomor di bawah:</text>

  <!-- 8 Cards Grid -->
  <g>${cardsSvg}</g>

  <!-- Prompt Zero Spoiler -->
  <rect x="70" y="152" width="360" height="30" rx="6" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>
  <text x="250" y="172" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Peluang terambil kartu bertuliskan bilangan prima = [ ${escapeXml(labelChar)} ]</text>
  <text x="250" y="215" text-anchor="middle" font-size="10" fill="#64748b">Hitung perbandingan banyak kejadian yang diharapkan dengan total ruang sampel!</text>
</svg>`;
}

/** 39. Render Segitiga Bilangan Pascal */
export function renderSegitigaPascalSvg(params: { baris?: number; rumpang?: number; label?: string }): string {
  const labelChar = params.label || 'X';

  // Baris 1 sampai 6 Segitiga Pascal
  const rows = [
    [1],
    [1, 1],
    [1, 2, 1],
    [1, 3, 3, 1],
    [1, 4, 6, 4, 1],
    [1, 5, 10, 10, 5, 1]
  ];

  const cy0 = 50;
  const dy = 32;
  const cx0 = 200;
  const dx = 32;

  let rowsSvg = '';
  rows.forEach((r, rIdx) => {
    const y = cy0 + rIdx * dy;
    const startX = cx0 - ((r.length - 1) * dx) / 2;

    r.forEach((val, cIdx) => {
      const x = startX + cIdx * dx;
      const isTarget = rIdx === 4 && cIdx === 2; // Angka 6 di Baris 5 dibuat rumpang

      if (isTarget) {
        rowsSvg += `
          <circle cx="${x}" cy="${y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
          <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
        `;
      } else {
        rowsSvg += `
          <circle cx="${x}" cy="${y}" r="12" fill="#f8fafc" stroke="#0284c7" stroke-width="1.2"/>
          <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">${val}</text>
        `;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pola Bilangan Segitiga Pascal (Baris 1–6)</text>

  <!-- Node Segitiga Pascal -->
  <g>${rowsSvg}</g>

  <text x="200" y="246" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bilangan yang tepat untuk menggantikan huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 40. Render Perbandingan Skala Termometer (C, R, F, K) */
export function renderSkalaTermometerKomparasiSvg(params: { suhuC?: number; pointer?: string; label?: string }): string {
  const suhuC = params.suhuC != null ? params.suhuC : 50;
  const pointer = (params.pointer || 'fahrenheit').toLowerCase();
  const labelChar = params.label || 'X';

  const suhuR = Math.round(suhuC * 0.8);
  const suhuF = Math.round(suhuC * 1.8 + 32);
  const suhuK = Math.round(suhuC + 273);

  let activeIdx = 2; // 0: C, 1: R, 2: F, 3: K
  if (pointer.includes('celcius') || pointer.includes('celsius')) activeIdx = 0;
  else if (pointer.includes('reamur')) activeIdx = 1;
  else if (pointer.includes('kelvin')) activeIdx = 3;

  const scales = [
    { x: 55, name: 'Celsius (°C)', min: '0°', max: '100°', val: `${suhuC}°C`, rasio: '5' },
    { x: 145, name: 'Reamur (°R)', min: '0°', max: '80°', val: `${suhuR}°R`, rasio: '4' },
    { x: 235, name: 'Fahrenheit (°F)', min: '32°', max: '212°', val: `${suhuF}°F`, rasio: '9' },
    { x: 325, name: 'Kelvin (K)', min: '273', max: '373', val: `${suhuK} K`, rasio: '5' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Perbandingan 4 Skala Termometer (C : R : F : K)</text>

  <!-- 4 Kolom Termometer -->
  ${scales.map((s, idx) => `
    <g>
      <!-- Judul Skala -->
      <text x="${s.x + 10}" y="45" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">${s.name}</text>
      <!-- Tabung Termometer -->
      <rect x="${s.x + 4}" y="55" width="12" height="115" rx="6" fill="#f1f5f9" stroke="#64748b" stroke-width="1.2"/>
      <!-- Cairan Merah Proporsional 50% -->
      <rect x="${s.x + 6}" y="112" width="8" height="58" rx="4" fill="#ef4444"/>
      <circle cx="${s.x + 10}" cy="170" r="10" fill="#ef4444"/>
      <!-- Titik Didih & Titik Beku -->
      <text x="${s.x - 8}" y="65" font-size="8" fill="#64748b">${s.max}</text>
      <line x1="${s.x - 2}" y1="62" x2="${s.x + 4}" y2="62" stroke="#64748b" stroke-width="1"/>
      <text x="${s.x - 8}" y="165" font-size="8" fill="#64748b">${s.min}</text>
      <line x1="${s.x - 2}" y1="162" x2="${s.x + 4}" y2="162" stroke="#64748b" stroke-width="1"/>
      <!-- Angka Suhu -->
      ${idx === activeIdx ? `
        <circle cx="${s.x + 10}" cy="112" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
        <text x="${s.x + 10}" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      ` : `
        <text x="${s.x + 22}" y="115" font-size="9" font-weight="bold" fill="#0f172a">${s.val}</text>
      `}
      <text x="${s.x + 10}" y="200" text-anchor="middle" font-size="8.5" fill="#475569">Rasio: ${s.rasio}</text>
    </g>
  `).join('')}

  <!-- Garis Sejajar Suhu Pengukuran -->
  <line x1="45" y1="112" x2="355" y2="112" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 2"/>

  <text x="200" y="246" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Nilai suhu pada skala termometer bertanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 41. Render Diagram Batang dan Daun (Stem-and-Leaf Plot) */
export function renderDiagramBatangDaunSvg(params: { label?: string }): string {
  const labelChar = params.label || 'X';

  const rows = [
    { stem: '4', leaves: ['5', '8'] },
    { stem: '5', leaves: ['2', '5', '7'] },
    { stem: '6', leaves: ['0', '3', '4', '8'] },
    { stem: '7', leaves: ['1', '5', `[${labelChar}]`] },
    { stem: '8', leaves: ['2', '6'] },
    { stem: '9', leaves: ['0'] }
  ];

  const y0 = 65;
  const dy = 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 255" width="380" height="255" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="255" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Batang dan Daun (Stem-and-Leaf Plot)</text>
  <text x="190" y="42" text-anchor="middle" font-size="9.5" fill="#64748b">Data Nilai Asesmen Matematika Kelas VI</text>

  <!-- Header Tabel Batang vs Daun -->
  <rect x="50" y="52" width="280" height="155" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
  <text x="95" y="70" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">Batang (Puluhan)</text>
  <text x="235" y="70" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">Daun (Satuan)</text>
  <line x1="50" y1="76" x2="330" y2="76" stroke="#cbd5e1" stroke-width="1.2"/>
  <line x1="140" y1="52" x2="140" y2="207" stroke="#0284c7" stroke-width="2"/>

  <!-- Baris Data -->
  ${rows.map((r, idx) => `
    <text x="95" y="${95 + idx * 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${r.stem}</text>
    <text x="160" y="${95 + idx * 18}" font-size="11" font-weight="600" fill="${r.leaves.includes(`[${labelChar}]`) ? '#e11d48' : '#334155'}">${r.leaves.join('   ')}</text>
  `).join('')}

  <!-- Keterangan Pembacaan Kunci (Legend) -->
  <rect x="50" y="214" width="280" height="22" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
  <text x="190" y="229" text-anchor="middle" font-size="9" font-weight="600" fill="#1e40af">Kunci Pembacaan: 4 | 5 artinya nilai 45</text>

  <text x="190" y="247" text-anchor="middle" font-size="9.5" font-weight="600" fill="#475569">Jika nilai peserta didik tersebut adalah 78, angka pada [${escapeXml(labelChar)}] adalah ...</text>
</svg>`;
}

/** 42. Render Diagram Kotak Garis (Box-and-Whisker Plot) */
export function renderDiagramBoxPlotSvg(params: { min?: number; q1?: number; q2?: number; q3?: number; max?: number; pointer?: string; label?: string }): string {
  const minVal = params.min || 20;
  const q1Val = params.q1 || 35;
  const q2Val = params.q2 || 50; // Median
  const q3Val = params.q3 || 70;
  const maxVal = params.max || 85;
  const pointer = (params.pointer || 'q2').toLowerCase();
  const labelChar = params.label || 'X';

  // Skala horizontal: 0 di x=50, 100 di x=330 (panjang 280px, faktor 2.8)
  const toX = (val: number) => 50 + val * 2.8;

  const xMin = toX(minVal);
  const xQ1 = toX(q1Val);
  const xQ2 = toX(q2Val);
  const xQ3 = toX(q3Val);
  const xMax = toX(maxVal);

  const boxY = 85;
  const boxH = 50;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 250" width="380" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Kotak Garis (Box-and-Whisker Plot)</text>
  <text x="190" y="42" text-anchor="middle" font-size="9.5" fill="#64748b">Statistik Lima Serangkai (Min, Q1, Q2/Median, Q3, Max)</text>

  <!-- Garis Whisker Kiri (Min ke Q1) -->
  <line x1="${xMin}" y1="${boxY + boxH / 2}" x2="${xQ1}" y2="${boxY + boxH / 2}" stroke="#0f172a" stroke-width="2"/>
  <line x1="${xMin}" y1="${boxY + 10}" x2="${xMin}" y2="${boxY + boxH - 10}" stroke="#0f172a" stroke-width="2"/>

  <!-- Kotak Interkuartil (Q1 ke Q3) -->
  <rect x="${xQ1}" y="${boxY}" width="${xQ3 - xQ1}" height="${boxH}" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>

  <!-- Garis Median Q2 di Dalam Kotak -->
  <line x1="${xQ2}" y1="${boxY}" x2="${xQ2}" y2="${boxY + boxH}" stroke="#e11d48" stroke-width="3"/>

  <!-- Garis Whisker Kanan (Q3 ke Max) -->
  <line x1="${xQ3}" y1="${boxY + boxH / 2}" x2="${xMax}" y2="${boxY + boxH / 2}" stroke="#0f172a" stroke-width="2"/>
  <line x1="${xMax}" y1="${boxY + 10}" x2="${xMax}" y2="${boxY + boxH - 10}" stroke="#0f172a" stroke-width="2"/>

  <!-- Label Parameter 5 Serangkai -->
  <text x="${xMin}" y="${boxY - 8}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#475569">Min (${minVal})</text>
  <text x="${xQ1}" y="${boxY - 8}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Q1 (${q1Val})</text>
  <text x="${xQ2}" y="${boxY - 8}" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">Q2 / Median</text>
  <text x="${xQ3}" y="${boxY - 8}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Q3 (${q3Val})</text>
  <text x="${xMax}" y="${boxY - 8}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#475569">Max (${maxVal})</text>

  <!-- Garis Bilangan Sumbu Horizontal Bawah -->
  <line x1="50" y1="175" x2="330" y2="175" stroke="#64748b" stroke-width="1.5"/>
  ${[0, 20, 40, 60, 80, 100].map(v => `
    <line x1="${toX(v)}" y1="172" x2="${toX(v)}" y2="178" stroke="#64748b" stroke-width="1.5"/>
    <text x="${toX(v)}" y="192" text-anchor="middle" font-size="8.5" fill="#64748b">${v}</text>
  `).join('')}

  <!-- Target Badge X pada Titik Median Q2 -->
  <circle cx="${xQ2}" cy="${boxY + boxH / 2}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${xQ2}" y="${boxY + boxH / 2 + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="235" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Nilai kuartil tengah (median) pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 43. Render Diagram Pohon Peluang (Probability Tree) */
export function renderPohonPeluangSvg(params: { label?: string }): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Pohon Peluang: Pelemparan 2 Koin</text>

  <!-- Kolom Label -->
  <text x="50" y="45" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#64748b">Mulai</text>
  <text x="140" y="45" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0284c7">Koin 1</text>
  <text x="240" y="45" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0284c7">Koin 2</text>
  <text x="330" y="45" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#15803d">Hasil (Titik Sampel)</text>

  <!-- Titik Awal Mulai -->
  <circle cx="50" cy="135" r="7" fill="#0f172a"/>

  <!-- Cabang Level 1: Koin 1 (Angka & Gambar) -->
  <line x1="50" y1="135" x2="140" y2="90" stroke="#0284c7" stroke-width="2"/>
  <text x="85" y="105" font-size="8.5" fill="#64748b">½</text>
  <circle cx="140" cy="90" r="13" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
  <text x="140" y="94" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">A</text>

  <line x1="50" y1="135" x2="140" y2="180" stroke="#0284c7" stroke-width="2"/>
  <text x="85" y="165" font-size="8.5" fill="#64748b">½</text>
  <circle cx="140" cy="180" r="13" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
  <text x="140" y="184" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">G</text>

  <!-- Cabang Level 2: Koin 2 dari A -->
  <line x1="140" y1="90" x2="240" y2="65" stroke="#0284c7" stroke-width="1.8"/>
  <circle cx="240" cy="65" r="11" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.2"/>
  <text x="240" y="69" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">A</text>

  <line x1="140" y1="90" x2="240" y2="115" stroke="#0284c7" stroke-width="1.8"/>
  <circle cx="240" cy="115" r="11" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.2"/>
  <text x="240" y="119" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">G</text>

  <!-- Cabang Level 2: Koin 2 dari G -->
  <line x1="140" y1="180" x2="240" y2="155" stroke="#0284c7" stroke-width="1.8"/>
  <circle cx="240" cy="155" r="11" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.2"/>
  <text x="240" y="159" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">A</text>

  <line x1="140" y1="180" x2="240" y2="205" stroke="#0284c7" stroke-width="1.8"/>
  <circle cx="240" cy="205" r="11" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.2"/>
  <text x="240" y="209" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">G</text>

  <!-- Titik Sampel Hasil Akhir -->
  <text x="330" y="69" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">(A, A)</text>
  <!-- Target X pada hasil kedua (A, G) -->
  <circle cx="330" cy="115" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="330" y="119.5" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  <text x="330" y="159" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">(G, A)</text>
  <text x="330" y="209" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">(G, G)</text>

  <text x="200" y="246" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Hasil titik sampel pada tanda "${escapeXml(labelChar)}" adalah pasangan ...</text>
</svg>`;
}

/** 44. Render Koding Scratch: Blok Percabangan (If - Else) */
export function renderKodingBlokPercabanganSvg(params: { kondisi?: string; label?: string }): string {
  const kondisi = params.kondisi || 'nilai > 75';
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Koding Scratch: Blok Logika Percabangan (If-Else)</text>

  <!-- Scratch C-Block Background Oranye (#f59e0b) -->
  <g transform="translate(45, 45)">
    <!-- Header Block Jika -->
    <path d="M 0,0 L 40,0 L 46,6 L 58,6 L 64,0 L 280,0 L 280,32 L 60,32 L 60,68 L 280,68 L 280,95 L 60,95 L 60,132 L 280,132 L 280,158 L 0,158 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>

    <text x="20" y="22" font-size="11.5" font-weight="bold" fill="#ffffff">jika</text>
    <!-- Boolean Hexagon Operator Hijau -->
    <polygon points="50,11 60,22 170,22 180,11 170,0 60,0" transform="translate(0, 5)" fill="#59c059" stroke="#389438" stroke-width="1.2"/>
    <text x="115" y="22" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">&lt; ${escapeXml(kondisi)} &gt;</text>
    <text x="195" y="22" font-size="11.5" font-weight="bold" fill="#ffffff">maka</text>

    <!-- Nested Block Then (Katakan Selamat) Ungu -->
    <rect x="68" y="38" width="195" height="24" rx="4" fill="#9966ff" stroke="#7744dd" stroke-width="1.2"/>
    <text x="165" y="54" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">katakan [Hebat, Lulus!] selama (2) dtk</text>

    <!-- Pembatas Else -->
    <text x="20" y="86" font-size="11.5" font-weight="bold" fill="#ffffff">jika tidak</text>

    <!-- Target Block Else (Rumpang X) Merah -->
    <rect x="68" y="102" width="195" height="24" rx="4" fill="#fee2e2" stroke="#e11d48" stroke-width="1.8"/>
    <text x="165" y="118" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e11d48">[ ${escapeXml(labelChar)} ]</text>
  </g>

  <text x="190" y="244" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Perintah yang tepat untuk blok kode [${escapeXml(labelChar)}] jika kondisi tidak terpenuhi adalah ...</text>
</svg>`;
}

/** 45. Render Koding Scratch: Blok Perulangan (Loop / Repeat) */
export function renderKodingBlokPerulanganSvg(params: { loopCount?: number; label?: string }): string {
  const loopCount = params.loopCount || 4;
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Koding Scratch: Blok Perulangan (Loop Geometri)</text>

  <!-- Scratch Repeat Block Oranye (#ffab19) -->
  <g transform="translate(45, 50)">
    <!-- Body Repeat Loop -->
    <path d="M 0,0 L 40,0 L 46,6 L 58,6 L 64,0 L 200,0 L 200,32 L 50,32 L 50,110 L 200,110 L 200,135 L 0,135 Z" fill="#ffab19" stroke="#cf8500" stroke-width="1.5"/>

    <text x="15" y="22" font-size="11.5" font-weight="bold" fill="#ffffff">ulangi</text>
    <!-- Lingkaran Input Putih Jumlah Loop -->
    <circle cx="75" cy="16" r="10" fill="#ffffff" stroke="#cf8500" stroke-width="1"/>
    <text x="75" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${loopCount}</text>
    <text x="95" y="22" font-size="11.5" font-weight="bold" fill="#ffffff">kali</text>

    <!-- Perintah 1: Maju 100 Langkah (Biru Motion) -->
    <rect x="58" y="38" width="180" height="26" rx="4" fill="#4c97ff" stroke="#2870d4" stroke-width="1.2"/>
    <text x="148" y="55" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#ffffff">gerak (100) langkah</text>

    <!-- Perintah 2: Putar Kanan 90 Derajat (Biru Motion) -->
    <rect x="58" y="72" width="180" height="26" rx="4" fill="#4c97ff" stroke="#2870d4" stroke-width="1.2"/>
    <text x="148" y="89" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#ffffff">putar ↻ (90) derajat</text>
  </g>

  <!-- Target Badge X di Sisi Kanan -->
  <g transform="translate(315, 115)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
    <text x="0" y="26" text-anchor="middle" font-size="9" font-weight="bold" fill="#e11d48">Bentuk Bangun</text>
  </g>

  <text x="190" y="244" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bentuk bangun datar yang terbentuk oleh algoritma "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// =========================================================================
// BATCH 3: MATEMATIKA LANJUT, LOGIKA, PENGUKURAN & KODING (7 TEMPLATES)
// =========================================================================

// 39. Gerbang Logika Komputasional (Logic Gates AND, OR, NOT)
export function renderDiagramAlurLogikaGerbangSvg(params: DiagramAlurLogikaGerbangParams): string {
  const gerbang = String(params.gerbang || 'AND').toUpperCase();
  const a = params.inputA ?? 1;
  const b = params.inputB ?? 0;
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 200" width="380" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Gerbang Logika Komputasional: Gerbang ${escapeXml(gerbang)}</text>

  <!-- Input A -->
  <line x1="60" y1="80" x2="140" y2="80" stroke="#0284c7" stroke-width="2.5"/>
  <text x="50" y="84" text-anchor="end" font-size="9.5" font-weight="bold" fill="#0284c7">A = ${a}</text>

  <!-- Input B -->
  <line x1="60" y1="120" x2="140" y2="120" stroke="#0284c7" stroke-width="2.5"/>
  <text x="50" y="124" text-anchor="end" font-size="9.5" font-weight="bold" fill="#0284c7">B = ${b}</text>

  <!-- Simbol Gerbang AND / OR -->
  ${gerbang === 'OR' ? `
    <path d="M 140 65 Q 165 100 140 135 Q 190 135 225 100 Q 190 65 140 65 Z" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>
    <text x="175" y="104" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">OR</text>
  ` : gerbang === 'NOT' ? `
    <polygon points="140,70 200,100 140,130" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <circle cx="206" cy="100" r="6" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <text x="165" y="104" text-anchor="middle" font-size="9" font-weight="bold" fill="#991b1b">NOT</text>
  ` : `
    <path d="M 140 65 L 175 65 A 35 35 0 0 1 175 135 L 140 135 Z" fill="#dcfce7" stroke="#15803d" stroke-width="2"/>
    <text x="170" y="104" text-anchor="middle" font-size="10" font-weight="bold" fill="#166534">AND</text>
  `}

  <!-- Output Line -->
  <line x1="${gerbang === 'NOT' ? 212 : 210}" y1="100" x2="280" y2="100" stroke="#e11d48" stroke-width="2.5"/>

  <!-- Target Badge X -->
  <circle cx="295" cy="100" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="295" y="104" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="175" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Nilai output biner (0 atau 1) pada huruf "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 40. Koding Scratch: Variabel & Operator Logika
export function renderKodingVariabelOperatorSvg(params: KodingVariabelOperatorParams): string {
  const varName = params.varName || 'skor';
  const op = params.op || '+';
  const nilai = params.nilai || 10;
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 200" width="380" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Koding Scratch: Blok Variabel &amp; Operator</text>

  <!-- Blok Hijau Operator Matematika -->
  <g transform="translate(60, 65)">
    <rect x="0" y="0" width="260" height="46" rx="23" fill="#59c059" stroke="#389438" stroke-width="2"/>
    <!-- Slot Kiri: Variabel Oranye -->
    <rect x="18" y="8" width="85" height="30" rx="15" fill="#ff8c1a" stroke="#db6e00" stroke-width="1.5"/>
    <text x="60" y="27" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">(${escapeXml(varName)})</text>

    <!-- Simbol Operator -->
    <text x="130" y="29" text-anchor="middle" font-size="16" font-weight="bold" fill="#ffffff">${escapeXml(op)}</text>

    <!-- Slot Kanan: Angka Putih -->
    <rect x="155" y="8" width="85" height="30" rx="15" fill="#ffffff" stroke="#389438" stroke-width="1.5"/>
    <text x="197" y="27" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${nilai}</text>
  </g>

  <!-- Target Badge -->
  <circle cx="335" cy="88" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="335" y="92" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="165" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Jika nilai awal (${escapeXml(varName)}) = 50, maka hasil blok kode di atas adalah ...</text>
</svg>`;
}

// 41. Operasi Hitung pada Garis Bilangan Bulat
export function renderGarisBilanganBulatOperasiSvg(params: GarisBilanganBulatOperasiParams): string {
  const a = params.a ?? 3;
  const b = params.b ?? -5;
  const labelChar = params.label || 'X';

  const originX = 190;
  const scale = 20;

  const posA = originX + a * scale;
  const posAkhir = originX + (a + b) * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="jumpArr1" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
    <marker id="jumpArr2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
    </marker>
  </defs>

  <rect width="400" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="200" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Operasi Penjumlahan Bilangan Bulat</text>

  <!-- Garis Bilangan Horizontal -->
  <line x1="30" y1="130" x2="370" y2="130" stroke="#0f172a" stroke-width="2"/>
  <!-- Titik-titik Skala -->
  ${[-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => {
    const x = originX + n * scale;
    return `
    <line x1="${x}" y1="125" x2="${x}" y2="135" stroke="#0f172a" stroke-width="1.5"/>
    <text x="${x}" y="148" text-anchor="middle" font-size="7.5" font-weight="${n === 0 ? 'bold' : 'normal'}" fill="${n === 0 ? '#0f172a' : '#64748b'}">${n}</text>`;
  }).join('')}

  <!-- Lompatan 1: Dari 0 ke A (Biru) -->
  <path d="M ${originX} 120 Q ${(originX + posA) / 2} 85 ${posA} 120" fill="none" stroke="#0284c7" stroke-width="2" marker-end="url(#jumpArr1)"/>
  <text x="${(originX + posA) / 2}" y="78" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">+${a}</text>

  <!-- Lompatan 2: Dari A sejauh B (Merah) -->
  <path d="M ${posA} 115 Q ${(posA + posAkhir) / 2} 55 ${posAkhir} 115" fill="none" stroke="#dc2626" stroke-width="2" marker-end="url(#jumpArr2)"/>
  <text x="${(posA + posAkhir) / 2}" y="48" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#dc2626">${b}</text>

  <!-- Target Badge di Posisi Akhir -->
  <circle cx="${posAkhir}" cy="130" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="${posAkhir}" y="134" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="200" y="184" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Hasil operasi hitung ${a} + (${b}) pada huruf "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 42. Ekuivalensi Pecahan, Desimal, dan Persen Senilai
export function renderPecahanDesimalPersenSenilaiSvg(params: PecahanDesimalPersenSenilaiParams): string {
  const pecahan = params.pecahan || '1/4';
  const desimal = params.desimal || '0.25';
  const persen = params.persen || '25%';
  const target = String(params.target || 'persen').toLowerCase();
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" width="360" height="210" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="360" height="210" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="180" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Ekuivalensi Pecahan, Desimal &amp; Persen Senilai</text>

  <!-- Lingkaran Pusat Hubungan Senilai -->
  <circle cx="180" cy="115" r="70" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3"/>
  <text x="180" y="119" text-anchor="middle" font-size="9" font-weight="bold" fill="#64748b">SENILAI</text>

  <!-- Kartu 1: Pecahan Biasa (Atas) -->
  <rect x="145" y="45" width="70" height="36" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="1.8"/>
  <text x="180" y="58" text-anchor="middle" font-size="7" fill="#1e40af">Pecahan</text>
  <text x="180" y="73" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">${target === 'pecahan' ? `[${escapeXml(labelChar)}]` : pecahan}</text>

  <!-- Kartu 2: Desimal (Kiri Bawah) -->
  <rect x="65" y="130" width="70" height="36" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="1.8"/>
  <text x="100" y="143" text-anchor="middle" font-size="7" fill="#166534">Desimal</text>
  <text x="100" y="158" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534">${target === 'desimal' ? `[${escapeXml(labelChar)}]` : desimal}</text>

  <!-- Kartu 3: Persen (Kanan Bawah) -->
  <rect x="225" y="130" width="70" height="36" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
  <text x="260" y="143" text-anchor="middle" font-size="7" fill="#92400e">Persen</text>
  <text x="260" y="158" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">${target === 'persen' ? `[${escapeXml(labelChar)}]` : persen}</text>

  <text x="180" y="196" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Nilai ekuivalen pada kotak bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 43. Komparasi Jam Digital (Selisih Waktu & Durasi)
export function renderJamDigitalKomparasiSvg(params: JamDigitalKomparasiParams): string {
  const jamAwal = params.jamAwal || '07:30';
  const jamAkhir = params.jamAkhir || '09:15';
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 200" width="380" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="timeArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <rect width="380" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Perhitungan Durasi / Selisih Waktu</text>

  <!-- Jam Awal (Kiri) -->
  <g transform="translate(60, 60)">
    <rect width="95" height="50" rx="6" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <text x="47.5" y="32" text-anchor="middle" font-size="18" font-family="'Courier New', monospace" font-weight="bold" fill="#38bdf8">${jamAwal}</text>
    <text x="47.5" y="65" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#475569">Waktu Mulai</text>
  </g>

  <!-- Panah Durasi ke Kanan -->
  <line x1="175" y1="85" x2="205" y2="85" stroke="#0284c7" stroke-width="2.5" marker-end="url(#timeArr)"/>

  <!-- Jam Akhir (Kanan) -->
  <g transform="translate(225, 60)">
    <rect width="95" height="50" rx="6" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <text x="47.5" y="32" text-anchor="middle" font-size="18" font-family="'Courier New', monospace" font-weight="bold" fill="#4ade80">${jamAkhir}</text>
    <text x="47.5" y="65" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#475569">Waktu Selesai</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="190" cy="85" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="190" y="89" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="165" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Lama waktu kegiatan dari ${jamAwal} sampai ${jamAkhir} adalah ...</text>
</svg>`;
}

// 44. Diagram Sankey Aliran Energi
export function renderDiagramSankeyEnergiSvg(params: DiagramSankeyEnergiParams): string {
  const masuk = params.masuk || 100;
  const berguna = params.berguna || 75;
  const terbuang = params.terbuang || 25;
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Diagram Sankey: Efisiensi Aliran Energi</text>

  <!-- Aliran Energi Masuk (Kiri) -->
  <path d="M 40 85 L 140 85 Q 180 85 220 70 L 300 70 L 300 110 L 220 110 Q 180 135 220 165 L 300 165 L 300 185 Q 160 185 140 145 L 40 145 Z" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>

  <!-- Teks Energi Masuk -->
  <text x="85" y="118" text-anchor="middle" font-size="9" font-weight="bold" fill="#1e40af">Energi Masuk</text>
  <text x="85" y="130" text-anchor="middle" font-size="8" fill="#1e40af">${masuk} Joule</text>

  <!-- Cabang Atas: Energi Berguna -->
  <text x="260" y="62" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#15803d">Energi Berguna (${berguna} J)</text>

  <!-- Cabang Bawah: Energi Terbuang Panas -->
  <text x="260" y="200" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#b91c1c">Kalor Terbuang (${terbuang} J)</text>

  <!-- Target Badge -->
  <circle cx="315" cy="90" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="315" y="94" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="214" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Efisiensi energi pada diagram di atas adalah ...</text>
</svg>`;
}

// 45. Skala Peta Batang (Skala Garis / Grafis)
export function renderSkalaPetaBatangSvg(params: SkalaPetaBatangParams): string {
  const kmPerCm = params.kmPerCm || 5;
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 190" width="380" height="190" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="190" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Skala Grafis / Garis pada Peta</text>

  <!-- Skala Batang Berselang-seling Hitam Putih -->
  <g transform="translate(60, 80)">
    <!-- Ruas 1 (Hitam) -->
    <rect x="0" y="0" width="65" height="14" fill="#0f172a" stroke="#0f172a"/>
    <!-- Ruas 2 (Putih) -->
    <rect x="65" y="0" width="65" height="14" fill="#ffffff" stroke="#0f172a"/>
    <!-- Ruas 3 (Hitam) -->
    <rect x="130" y="0" width="65" height="14" fill="#0f172a" stroke="#0f172a"/>
    <!-- Ruas 4 (Putih) -->
    <rect x="195" y="0" width="65" height="14" fill="#ffffff" stroke="#0f172a"/>

    <!-- Angka Skala KM di Atas -->
    <text x="0" y="-8" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">0</text>
    <text x="65" y="-8" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${kmPerCm}</text>
    <text x="130" y="-8" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${kmPerCm * 2}</text>
    <text x="195" y="-8" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${kmPerCm * 3}</text>
    <text x="260" y="-8" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${kmPerCm * 4} km</text>

    <!-- Angka Jarak CM di Bawah -->
    <text x="0" y="28" text-anchor="middle" font-size="8" fill="#64748b">0</text>
    <text x="65" y="28" text-anchor="middle" font-size="8" fill="#64748b">1 cm</text>
    <text x="130" y="28" text-anchor="middle" font-size="8" fill="#64748b">2 cm</text>
    <text x="195" y="28" text-anchor="middle" font-size="8" fill="#64748b">3 cm</text>
    <text x="260" y="28" text-anchor="middle" font-size="8" fill="#64748b">4 cm</text>
  </g>

  <!-- Target Badge -->
  <circle cx="345" cy="87" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="345" y="91" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="155" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Jarak sebenarnya di bumi jika pada peta berjarak 3 cm adalah ...</text>
</svg>`;
}



