/**
 * measurement.ts
 * Visual Stimulus SVG Renderers for Precision Measurement Instruments & Conversion Stairs
 * Standardized for Kurikulum Merdeka Elementary School Assessment (BSKAP 046/2025)
 */

import { escapeXml } from './types';

/**
 * 1. Render Stopwatch Analog (Dua Dial: Detik & Menit)
 */
export function renderStopwatchAnalogSvg(params: {
  detik?: number; // 0 - 60
  menit?: number; // 0 - 30
  label?: string;
}): string {
  const detik = Math.max(0, Math.min(60, params.detik != null ? params.detik : 24));
  const menit = Math.max(0, Math.min(30, params.menit != null ? params.menit : 3));
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 145;
  const r = 85;

  // Jarum detik utama
  const secAngle = (detik * 6 - 90) * (Math.PI / 180);
  const secLen = r - 12;
  const secX = cx + secLen * Math.cos(secAngle);
  const secY = cy + secLen * Math.sin(secAngle);

  // Sub-dial menit di bagian atas
  const subCx = cx;
  const subCy = cy - 30;
  const subR = 24;
  const minAngle = (menit * 12 - 90) * (Math.PI / 180);
  const minLen = subR - 6;
  const minX = subCx + minLen * Math.cos(minAngle);
  const minY = subCy + minLen * Math.sin(minAngle);

  // Ticks detik (kelipatan 5 berlabel angka)
  let ticksSvg = '';
  for (let s = 0; s < 60; s++) {
    const a = (s * 6 - 90) * (Math.PI / 180);
    const isMajor = s % 5 === 0;
    const tLen = isMajor ? 9 : 4;
    const x1 = cx + (r - 2) * Math.cos(a);
    const y1 = cy + (r - 2) * Math.sin(a);
    const x2 = cx + (r - 2 - tLen) * Math.cos(a);
    const y2 = cy + (r - 2 - tLen) * Math.sin(a);

    ticksSvg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0f172a" stroke-width="${isMajor ? '1.8' : '0.8'}"/>`;

    if (isMajor && s % 10 === 0) {
      const tx = cx + (r - 18) * Math.cos(a);
      const ty = cy + (r - 18) * Math.sin(a) + 3.5;
      ticksSvg += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">${s === 0 ? '60' : s}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 280" width="460" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="bezelGradStopwatch" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="40%" stop-color="#cbd5e1"/>
      <stop offset="70%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <filter id="badgeShdwWatch" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Frame & Judul -->
  <rect x="2" y="2" width="456" height="276" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="230" y="24" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Pengukuran Waktu: Stopwatch Analog</text>

  <!-- Tombol Stopwatch Atas (Start/Stop) -->
  <rect x="${cx - 9}" y="38" width="18" height="15" rx="2" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
  <rect x="${cx - 15}" y="32" width="30" height="8" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>

  <!-- Tombol Lap Kanan Atas -->
  <g transform="translate(${cx + 52}, 52) rotate(35)">
    <rect x="-6" y="-12" width="12" height="12" rx="2" fill="#64748b"/>
    <rect x="-9" y="-16" width="18" height="6" rx="2" fill="#e11d48"/>
  </g>

  <!-- Badan Luar & Casing Bezel Logam -->
  <circle cx="${cx}" cy="${cy}" r="${r + 9}" fill="url(#bezelGradStopwatch)" stroke="#334155" stroke-width="2.5"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

  <!-- Ticks & Skala -->
  ${ticksSvg}

  <!-- Sub-dial Menit -->
  <circle cx="${subCx}" cy="${subCy}" r="${subR}" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <line x1="${subCx}" y1="${subCy}" x2="${minX.toFixed(1)}" y2="${minY.toFixed(1)}" stroke="#0284c7" stroke-width="2"/>
  <circle cx="${subCx}" cy="${subCy}" r="2.5" fill="#0284c7"/>
  <text x="${subCx}" y="${subCy + 15}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#64748b">menit</text>

  <!-- Jarum Detik Utama Merah -->
  <!-- Ekor Jarum Counterweight -->
  <line x1="${cx}" y1="${cy}" x2="${cx - 14 * Math.cos(secAngle)}" y2="${cy - 14 * Math.sin(secAngle)}" stroke="#dc2626" stroke-width="2.5"/>
  <!-- Batang Jarum Menunjuk Detik -->
  <line x1="${cx}" y1="${cy}" x2="${secX.toFixed(1)}" y2="${secY.toFixed(1)}" stroke="#dc2626" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="#dc2626"/>

  <!-- Callout Target X & Kartu Bacaan (Kanan) -->
  <g transform="translate(355, 120)">
    <rect x="-55" y="-30" width="110" height="75" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <g filter="url(#badgeShdwWatch)">
      <circle cx="0" cy="-6" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
      <text x="0" y="-1.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
    </g>
    <text x="0" y="24" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Waktu = ... s</text>
    <text x="0" y="38" text-anchor="middle" font-size="8" fill="#64748b">(Menit + Detik)</text>
  </g>

  <!-- Bottom Prompt -->
  <text x="230" y="262" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Berapakah hasil pengukuran waktu yang ditunjukkan oleh jarum "${escapeXml(labelChar)}"?</text>
</svg>`;
}

/**
 * 2. Render Jangka Sorong (Vernier Caliper)
 */
export function renderJangkaSorongSvg(params: {
  nilaiCm?: number; // e.g. 2.35 cm
  label?: string;
}): string {
  const val = Math.max(0.5, Math.min(6.0, params.nilaiCm != null ? params.nilaiCm : 2.35));
  const labelChar = params.label || 'X';

  const startX = 45;
  const startY = 82;
  const pxPerCm = 40;
  const noniusOffset = val * pxPerCm;

  // Skala utama: 0 s/d 7 cm
  let mainScaleTicks = '';
  for (let mm = 0; mm <= 70; mm++) {
    const x = startX + (mm / 10) * pxPerCm;
    const isCm = mm % 10 === 0;
    const isHalf = mm % 5 === 0;
    const tickH = isCm ? 18 : isHalf ? 12 : 7;
    mainScaleTicks += `<line x1="${x.toFixed(1)}" y1="${startY + 28}" x2="${x.toFixed(1)}" y2="${startY + 28 - tickH}" stroke="#0f172a" stroke-width="${isCm ? '1.5' : '0.9'}"/>`;
    if (isCm) {
      mainScaleTicks += `<text x="${x.toFixed(1)}" y="${startY + 6}" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0f172a">${mm / 10}</text>`;
    }
  }

  // Skala nonius: 0 s/d 10 (0.1 mm)
  const noniusX = startX + noniusOffset;
  let noniusTicks = '';
  for (let n = 0; n <= 10; n++) {
    const nx = noniusX + (n * 0.9 * pxPerCm) / 10;
    const isMajor = n % 5 === 0;
    const tickH = isMajor ? 14 : 8;
    noniusTicks += `<line x1="${nx.toFixed(1)}" y1="${startY + 34}" x2="${nx.toFixed(1)}" y2="${startY + 34 + tickH}" stroke="#0284c7" stroke-width="1.2"/>`;
    if (isMajor) {
      noniusTicks += `<text x="${nx.toFixed(1)}" y="${startY + 60}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0284c7">${n}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 280" width="520" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="beamGradJangka" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <filter id="badgeShdwJangka" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Frame -->
  <rect x="2" y="2" width="516" height="276" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="260" y="24" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Pengukuran Panjang Presisi: Jangka Sorong (Vernier Caliper)</text>

  <!-- Batang Utama Jangka Sorong Logam -->
  <rect x="${startX - 22}" y="${startY}" width="430" height="32" fill="url(#beamGradJangka)" stroke="#334155" stroke-width="1.8"/>
  <!-- Rahang Tetap Kiri (Luar Bawah & Dalam Atas) -->
  <path d="M ${startX - 22},${startY} L ${startX - 22},${startY + 98} L ${startX - 4},${startY + 98} L ${startX - 4},${startY + 32} L ${startX - 22},${startY + 32} Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.8"/>
  <path d="M ${startX - 22},${startY} L ${startX - 22},${startY - 36} L ${startX - 6},${startY - 36} L ${startX - 6},${startY} Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.8"/>

  <!-- Skala Utama -->
  ${mainScaleTicks}
  <text x="${startX + 325}" y="${startY + 20}" font-size="9.5" font-weight="bold" fill="#64748b">cm (0.1 cm)</text>

  <!-- Benda yang Diukur (Silinder Logam Kuningan) di antara rahang -->
  <rect x="${startX - 4}" y="${startY + 44}" width="${noniusOffset}" height="36" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="${startX - 4 + noniusOffset / 2}" y="${startY + 66}" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#92400e">Benda</text>

  <!-- Rahang Geser (Nonius Carriage) -->
  <rect x="${noniusX - 10}" y="${startY + 30}" width="82" height="45" fill="#eff6ff" stroke="#0284c7" stroke-width="1.8" rx="2"/>
  <path d="M ${noniusX},${startY + 30} L ${noniusX},${startY + 98} L ${noniusX + 16},${startY + 98} L ${noniusX + 16},${startY + 75} L ${noniusX},${startY + 75} Z" fill="#dbeafe" stroke="#0284c7" stroke-width="1.8"/>

  <!-- Skala Nonius -->
  ${noniusTicks}
  <text x="${noniusX + 54}" y="${startY + 58}" font-size="8" font-weight="bold" fill="#0284c7">0.01 cm</text>

  <!-- Callout Target X -->
  <g transform="translate(435, 175)" filter="url(#badgeShdwJangka)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2.5"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Bottom Prompt -->
  <text x="260" y="262" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Hasil pengukuran jangka sorong yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ... cm</text>
</svg>`;
}

/**
 * 3. Render Neraca Pasar Bebek / Kodok (Traditional Kitchen Balance)
 */
export function renderNeracaPasarSvg(params: {
  anakTimbangan?: number[]; // e.g. [1000, 500] (1.5 kg)
  labelBenda?: string;
  label?: string;
}): string {
  const anak = params.anakTimbangan?.length ? params.anakTimbangan : [1000, 500];
  const labelChar = params.label || 'X';

  const cx = 200;
  const cy = 145;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 260" width="430" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="430" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="215" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Massa: Neraca Pasar Bebek Tradisional</text>

  <!-- Kaki / Landasan Besi Cor Neraca -->
  <path d="M 90,205 L 340,205 L 330,175 L 100,175 Z" fill="#475569" stroke="#1e293b" stroke-width="2"/>
  <rect x="185" y="140" width="30" height="35" rx="3" fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Balok Tuas Neraca Kuningan Seimbang -->
  <line x1="80" y1="${cy}" x2="320" y2="${cy}" stroke="#ca8a04" stroke-width="6" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="6" fill="#eab308" stroke="#713f12" stroke-width="2"/>

  <!-- Jarum Penunjuk Keseimbangan (Tengah) -->
  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 28}" stroke="#dc2626" stroke-width="2.5"/>
  <polygon points="${cx - 4},${cy - 28} ${cx + 4},${cy - 28} ${cx},${cy - 36}" fill="#dc2626"/>

  <!-- Piring Kiri (Wadah Beras / Buah / Target X) -->
  <path d="M 60,${cy - 5} L 120,${cy - 5} L 110,${cy + 16} L 70,${cy + 16} Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <!-- Kantong / Benda Target X -->
  <rect x="72" y="${cy - 38}" width="36" height="32" rx="4" fill="#fff1f2" stroke="#e11d48" stroke-width="2"/>
  <circle cx="90" cy="${cy - 22}" r="11" fill="#e11d48"/>
  <text x="90" y="${cy - 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  <text x="90" y="${cy + 28}" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#713f12">Benda</text>

  <!-- Piring Kanan (Anak Timbangan Logam) -->
  <path d="M 280,${cy - 5} L 340,${cy - 5} L 330,${cy + 16} L 290,${cy + 16} Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <!-- Anak Timbangan 1 (1 kg) -->
  <rect x="286" y="${cy - 32}" width="22" height="26" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.2"/>
  <text x="297" y="${cy - 16}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#ffffff">1 kg</text>
  <!-- Anak Timbangan 2 (500 g) -->
  <rect x="312" y="${cy - 24}" width="18" height="18" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.2"/>
  <text x="321" y="${cy - 12}" text-anchor="middle" font-size="7" font-weight="bold" fill="#ffffff">500g</text>
  <text x="310" y="${cy + 28}" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#713f12">Anak Batu</text>

  <text x="215" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Massa benda "${escapeXml(labelChar)}" agar posisi timbangan seimbang adalah ...</text>
</svg>`;
}

/**
 * 4. Render Timbangan Digital (Digital Kitchen/Bench Scale)
 */
export function renderTimbanganDigitalSvg(params: {
  massaGram?: number; // e.g. 750
  unit?: string;
  label?: string;
}): string {
  const massa = params.massaGram != null ? params.massaGram : 750;
  const unit = params.unit || 'g';
  const labelChar = params.label || 'X';

  const cx = 200;
  const cy = 150;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Massa: Timbangan Digital Meja</text>

  <!-- Piringan Timbang Atas Stainless Steel -->
  <ellipse cx="${cx}" cy="${cy - 40}" rx="90" ry="16" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
  <ellipse cx="${cx}" cy="${cy - 43}" rx="86" ry="13" fill="#f8fafc"/>

  <!-- Objek Benda di Atas Timbangan -->
  <rect x="${cx - 30}" y="${cy - 95}" width="60" height="50" rx="6" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
  <text x="${cx}" y="${cy - 68}" text-anchor="middle" font-size="11" font-weight="bold" fill="#9a3412">Benda</text>

  <!-- Badan Utama Timbangan -->
  <path d="M ${cx - 100},${cy - 35} L ${cx + 100},${cy - 35} L ${cx + 115},${cy + 45} L ${cx - 115},${cy + 45} Z" fill="#f1f5f9" stroke="#334155" stroke-width="2"/>
  <rect x="${cx - 115}" y="${cy + 45}" width="230" height="12" rx="3" fill="#cbd5e1" stroke="#334155" stroke-width="1.5"/>

  <!-- Layar LCD Digital Biru 7-Segmen -->
  <rect x="${cx - 55}" y="${cy - 12}" width="110" height="34" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.8"/>
  <text x="${cx + 15}" y="${cy + 13}" text-anchor="end" font-size="20" font-weight="bold" font-family="'Consolas', monospace" fill="#38bdf8">${massa}</text>
  <text x="${cx + 38}" y="${cy + 11}" font-size="12" font-weight="bold" fill="#38bdf8">${escapeXml(unit)}</text>

  <!-- Tombol Tare & Unit -->
  <rect x="${cx - 95}" y="${cy - 5}" width="30" height="20" rx="3" fill="#e2e8f0" stroke="#64748b"/>
  <text x="${cx - 80}" y="${cy + 9}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#334155">TARE</text>

  <rect x="${cx + 65}" y="${cy - 5}" width="30" height="20" rx="3" fill="#e2e8f0" stroke="#64748b"/>
  <text x="${cx + 80}" y="${cy + 9}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#334155">UNIT</text>

  <text x="200" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Massa benda pada layar timbangan digital adalah ... ${escapeXml(unit)}</text>
</svg>`;
}

/**
 * 5. Render Bejana Takaran Literan Beras Tradisional
 */
export function renderBejanaLiteranSvg(params: {
  kapasitas?: number; // 1 liter
  label?: string;
}): string {
  const cap = params.kapasitas || 1;
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 135;
  const w = 90;
  const h = 110;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Volume: Bejana Takaran Literan Beras</text>

  <!-- Gagang Bejana Sisi Kiri -->
  <path d="M ${cx - w / 2},${cy - 30} C ${cx - w / 2 - 30},${cy - 30} ${cx - w / 2 - 30},${cy + 30} ${cx - w / 2},${cy + 30}" fill="none" stroke="#475569" stroke-width="6" stroke-linecap="round"/>

  <!-- Silinder Logam Bejana -->
  <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="#f1f5f9" stroke="#334155" stroke-width="2"/>
  <ellipse cx="${cx}" cy="${cy + h / 2}" rx="${w / 2}" ry="8" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>

  <!-- Butiran Beras di Dalam -->
  <rect x="${cx - w / 2 + 2}" y="${cy - h / 2 + 10}" width="${w - 4}" height="${h - 10}" fill="#fef3c7"/>
  <ellipse cx="${cx}" cy="${cy - h / 2 + 10}" rx="${w / 2 - 2}" ry="8" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>

  <!-- Bibir Logam Atas -->
  <ellipse cx="${cx}" cy="${cy - h / 2}" rx="${w / 2}" ry="8" fill="none" stroke="#334155" stroke-width="2"/>

  <!-- Garis Batas Liter -->
  <line x1="${cx - w / 2}" y1="${cy - h / 2 + 10}" x2="${cx + w / 2}" y2="${cy - h / 2 + 10}" stroke="#b45309" stroke-width="1.8" stroke-dasharray="3,2"/>
  <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="14" font-weight="900" fill="#92400e">${cap} Liter</text>

  <!-- Target Badge X -->
  <g transform="translate(295, 120)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="190" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Kapasitas volume takaran beras yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 6. Render Gelas Erlenmeyer Laboratorium Berskala
 */
export function renderGelasErlenmeyerSvg(params: {
  volumeMl?: number; // 50, 100, 150, 200, 250
  maxMl?: number;
  label?: string;
}): string {
  const vol = Math.max(50, Math.min(250, params.volumeMl != null ? params.volumeMl : 150));
  const labelChar = params.label || 'X';

  const cx = 175;
  const topY = 55;
  const bottomY = 195;
  const neckW = 28;
  const baseW = 120;

  // Hitung tinggi cairan
  const fillRatio = (vol - 50) / 200;
  const waterTopY = bottomY - 20 - fillRatio * 85;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Volume: Labu Erlenmeyer Berskala (ml)</text>

  <!-- Cairan Kimia Berwarna di Dalam -->
  <path d="M ${cx - baseW / 2 + 10},${bottomY} L ${cx + baseW / 2 - 10},${bottomY} L ${cx + 25},${waterTopY} L ${cx - 25},${waterTopY} Z" fill="#a7f3d0" fill-opacity="0.8"/>
  <ellipse cx="${cx}" cy="${waterTopY}" rx="25" ry="4" fill="#059669" fill-opacity="0.6"/>

  <!-- Badan Kaca Erlenmeyer -->
  <path d="M ${cx - neckW / 2},${topY} L ${cx - neckW / 2},${topY + 30} L ${cx - baseW / 2},${bottomY} Q ${cx - baseW / 2},${bottomY + 10} ${cx - baseW / 2 + 15},${bottomY + 10} L ${cx + baseW / 2 - 15},${bottomY + 10} Q ${cx + baseW / 2},${bottomY + 10} ${cx + baseW / 2},${bottomY} L ${cx + neckW / 2},${topY + 30} L ${cx + neckW / 2},${topY} Z" fill="none" stroke="#0f172a" stroke-width="2.5"/>
  <ellipse cx="${cx}" cy="${topY}" rx="${neckW / 2 + 2}" ry="3" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>

  <!-- Garis Skala 50, 100, 150, 200, 250 ml -->
  <line x1="${cx - 12}" y1="175" x2="${cx + 8}" y2="175" stroke="#334155" stroke-width="1.5"/>
  <text x="${cx + 14}" y="178" font-size="8.5" font-weight="bold" fill="#334155">50</text>

  <line x1="${cx - 10}" y1="147" x2="${cx + 8}" y2="147" stroke="#334155" stroke-width="1.5"/>
  <text x="${cx + 14}" y="150" font-size="8.5" font-weight="bold" fill="#334155">100</text>

  <line x1="${cx - 8}" y1="119" x2="${cx + 8}" y2="119" stroke="#334155" stroke-width="1.5"/>
  <text x="${cx + 14}" y="122" font-size="8.5" font-weight="bold" fill="#334155">150</text>

  <line x1="${cx - 6}" y1="91" x2="${cx + 8}" y2="91" stroke="#334155" stroke-width="1.5"/>
  <text x="${cx + 14}" y="94" font-size="8.5" font-weight="bold" fill="#334155">200</text>

  <!-- Callout Target X -->
  <g transform="translate(295, 120)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="190" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Volume larutan zat cair pada labu Erlenmeyer adalah ... ml</text>
</svg>`;
}

/**
 * 7. Render Pita Meteran Gulung Tukang / Penjahit
 */
export function renderMeteranGulungSvg(params: {
  panjangCm?: number; // e.g. 45 cm
  label?: string;
}): string {
  const p = Math.max(10, Math.min(100, params.panjangCm != null ? params.panjangCm : 45));
  const labelChar = params.label || 'X';

  const startX = 65;
  const startY = 120;
  const tapeW = 230;

  // Garis-garis skala cm pada pita kuning
  let ticks = '';
  for (let c = 0; c <= 8; c++) {
    const x = startX + c * 26;
    const isMajor = c % 2 === 0;
    ticks += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + (isMajor ? 12 : 7)}" stroke="#0f172a" stroke-width="1.2"/>`;
    if (isMajor) {
      ticks += `<text x="${x}" y="${startY + 24}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${c * 5}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Panjang: Pita Meteran Gulung</text>

  <!-- Papan Kayu yang Sedang Diukur -->
  <rect x="${startX}" y="${startY - 40}" width="${tapeW}" height="32" rx="3" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <text x="${startX + tapeW / 2}" y="${startY - 20}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#9a3412">Papan Kayu</text>

  <!-- Kotak Casing Meteran Gulung (Kanan) -->
  <rect x="${startX + tapeW}" y="${startY - 25}" width="65" height="70" rx="12" fill="#eab308" stroke="#854d0e" stroke-width="2.5"/>
  <rect x="${startX + tapeW + 15}" y="${startY - 10}" width="35" height="40" rx="6" fill="#0f172a"/>
  <text x="${startX + tapeW + 32}" y="${startY + 15}" text-anchor="middle" font-size="9" font-weight="bold" fill="#facc15">5 M</text>
  <!-- Tombol Kunci Slider -->
  <rect x="${startX + tapeW - 6}" y="${startY - 15}" width="12" height="18" rx="2" fill="#dc2626"/>

  <!-- Pita Meteran Kuning Fleksibel Terentang -->
  <rect x="${startX}" y="${startY}" width="${tapeW}" height="30" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
  <!-- Kait Besi Ujung Kiri -->
  <path d="M ${startX},${startY - 2} L ${startX - 6},${startY - 2} L ${startX - 6},${startY + 38} L ${startX},${startY + 38} Z" fill="#64748b" stroke="#334155" stroke-width="1.5"/>

  ${ticks}

  <!-- Target Badge X -->
  <g transform="translate(190, 185)">
    <circle cx="0" cy="0" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="200" y="234" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Panjang kayu pada pita meteran yang ditunjuk huruf "${escapeXml(labelChar)}" adalah ... cm</text>
</svg>`;
}

/**
 * 8. Render Dinamometer / Neraca Pegas (Spring Scale Newton)
 */
export function renderDinamometerPegasSvg(params: {
  gayaNewton?: number; // e.g. 4 N
  newton?: number;
  maxNewton?: number;
  label?: string;
}): string {
  const rawNewton = params.newton != null ? params.newton : params.gayaNewton;
  const f = Math.max(0, Math.min(10, rawNewton != null ? rawNewton : 4));
  const labelChar = params.label || 'X';

  const cx = 150;
  const topY = 46;
  const tubeH = 146;
  const bottomY = topY + tubeH; // 192

  // Skala aktif: 0 s/d 10 N
  const scaleTopY = topY + 24; // 70
  const scaleBottomY = topY + 124; // 170
  const scaleLen = scaleBottomY - scaleTopY; // 100 px (10 px per N)

  // Posisi collar penunjuk turun sesuai gaya F
  const stretchRatio = f / 10;
  const collarY = scaleTopY + stretchRatio * scaleLen;

  // Pegas spiral berbayang 3D
  const springTopY = topY + 10;
  const springBottomY = collarY - 4;
  const springH = Math.max(16, springBottomY - springTopY);
  const numCoils = 9;
  const coilStep = springH / numCoils;

  let springPath = `M ${cx} ${springTopY}`;
  for (let i = 0; i < numCoils; i++) {
    const yMid1 = springTopY + (i + 0.25) * coilStep;
    const yPeak = springTopY + (i + 0.5) * coilStep;
    const yMid2 = springTopY + (i + 0.75) * coilStep;
    const yEnd = springTopY + (i + 1.0) * coilStep;
    springPath += ` C ${cx - 12} ${yMid1.toFixed(1)}, ${cx - 12} ${yPeak.toFixed(1)}, ${cx} ${yPeak.toFixed(1)}`;
    springPath += ` C ${cx + 12} ${yPeak.toFixed(1)}, ${cx + 12} ${yMid2.toFixed(1)}, ${cx} ${yEnd.toFixed(1)}`;
  }

  // Skala Newton (kiri) & Gram (kanan)
  let ticks = '';
  for (let n = 0; n <= 10; n++) {
    const y = scaleTopY + (n / 10) * scaleLen;
    const isMajor = n % 2 === 0;

    if (isMajor) {
      ticks += `
        <line x1="${cx - 18}" y1="${y.toFixed(1)}" x2="${cx - 7}" y2="${y.toFixed(1)}" stroke="#0f172a" stroke-width="1.6"/>
        <text x="${cx - 22}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="8.5" font-weight="bold" fill="#0f172a">${n}</text>
        <line x1="${cx + 7}" y1="${y.toFixed(1)}" x2="${cx + 18}" y2="${y.toFixed(1)}" stroke="#0284c7" stroke-width="1.6"/>
        <text x="${cx + 22}" y="${(y + 3.5).toFixed(1)}" text-anchor="start" font-size="8.5" font-weight="bold" fill="#0284c7">${n * 100}</text>
      `;
    } else {
      ticks += `
        <line x1="${cx - 13}" y1="${y.toFixed(1)}" x2="${cx - 7}" y2="${y.toFixed(1)}" stroke="#64748b" stroke-width="1"/>
        <line x1="${cx + 7}" y1="${y.toFixed(1)}" x2="${cx + 13}" y2="${y.toFixed(1)}" stroke="#38bdf8" stroke-width="1"/>
      `;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 280" width="420" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Tabung Akrilik Transparan -->
    <linearGradient id="acrylicTubeGradDina" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.8"/>
      <stop offset="15%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#f8fafc" stop-opacity="0.3"/>
      <stop offset="85%" stop-color="#e2e8f0" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Gradien Tutup Logam Aluminium -->
    <linearGradient id="metalCapGradDina" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="30%" stop-color="#94a3b8"/>
      <stop offset="70%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <!-- Gradien Collar Merah Indikator -->
    <linearGradient id="collarGradDina" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="50%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>

    <!-- Gradien Beban Kuningan / Logam -->
    <linearGradient id="brassWeightGradDina" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="70%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <!-- Drop Shadow Badge -->
    <filter id="badgeShdwDina" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Frame Luar -->
  <rect x="2" y="2" width="416" height="276" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="210" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Gaya: Dinamometer (Neraca Pegas)</text>

  <!-- Cincin Gantung Atas Stainless Steel -->
  <circle cx="${cx}" cy="${topY - 14}" r="11" fill="none" stroke="url(#metalCapGradDina)" stroke-width="3.5"/>
  <circle cx="${cx}" cy="${topY - 14}" r="11" fill="none" stroke="#0f172a" stroke-width="0.8" opacity="0.4"/>

  <!-- Tutup Logam Atas -->
  <rect x="${cx - 18}" y="${topY - 3}" width="36" height="8" rx="2" fill="url(#metalCapGradDina)" stroke="#334155" stroke-width="1"/>

  <!-- Batang Poros / Pegas Spiral Internal -->
  <!-- Poros Pandu Tengah Atas -->
  <line x1="${cx}" y1="${topY + 5}" x2="${cx}" y2="${springTopY}" stroke="#64748b" stroke-width="2.5"/>
  <!-- Lilitan Pegas Heliks Baja -->
  <path d="${springPath}" fill="none" stroke="#475569" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${springPath}" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>

  <!-- Tabung Silinder Akrilik Transparan -->
  <rect x="${cx - 17}" y="${topY + 5}" width="34" height="${tubeH - 10}" rx="4" fill="url(#acrylicTubeGradDina)" stroke="#64748b" stroke-width="1.5"/>
  <!-- Refleksi Kilap Tabung Kaca / Akrilik -->
  <line x1="${cx - 13}" y1="${topY + 8}" x2="${cx - 13}" y2="${bottomY - 8}" stroke="#ffffff" stroke-width="1.5" opacity="0.65"/>

  <!-- Tutup Logam Bawah -->
  <rect x="${cx - 18}" y="${bottomY - 5}" width="36" height="8" rx="2" fill="url(#metalCapGradDina)" stroke="#334155" stroke-width="1"/>

  <!-- Skala Angka & Ticks -->
  <text x="${cx - 22}" y="${scaleTopY - 9}" text-anchor="end" font-size="9" font-weight="bold" fill="#0f172a">N (Gaya)</text>
  <text x="${cx + 22}" y="${scaleTopY - 9}" text-anchor="start" font-size="9" font-weight="bold" fill="#0284c7">g (Massa)</text>
  ${ticks}

  <!-- Poros Penarik Bawah (Stainless Steel Rod) -->
  <line x1="${cx}" y1="${collarY + 3.5}" x2="${cx}" y2="${bottomY + 14}" stroke="#475569" stroke-width="2.8"/>

  <!-- Collar Merah Indikator Nilai Ukur -->
  <rect x="${cx - 16}" y="${collarY - 3.5}" width="32" height="7" rx="2" fill="url(#collarGradDina)" stroke="#991b1b" stroke-width="1"/>
  <!-- Penunjuk Panah Segitiga Kiri & Kanan pada Collar -->
  <polygon points="${cx - 16},${collarY} ${cx - 11},${collarY - 3} ${cx - 11},${collarY + 3}" fill="#ffffff"/>
  <polygon points="${cx + 16},${collarY} ${cx + 11},${collarY - 3} ${cx + 11},${collarY + 3}" fill="#ffffff"/>

  <!-- Pengait Bawah (Swivel Hook) -->
  <path d="M ${cx},${bottomY + 14} L ${cx},${bottomY + 22} C ${cx - 14},${bottomY + 24} ${cx - 14},${bottomY + 38} ${cx},${bottomY + 38} C ${cx + 12},${bottomY + 38} ${cx + 12},${bottomY + 28} ${cx + 7},${bottomY + 28}" fill="none" stroke="#334155" stroke-width="2.8" stroke-linecap="round"/>

  <!-- Beban Tergantung (Beban Uji Kuningan) -->
  <ellipse cx="${cx}" cy="${bottomY + 41}" rx="4" ry="2" fill="none" stroke="#b45309" stroke-width="1.8"/>
  <rect x="${cx - 18}" y="${bottomY + 43}" width="36" height="20" rx="3" fill="url(#brassWeightGradDina)" stroke="#b45309" stroke-width="1.4"/>
  <text x="${cx}" y="${bottomY + 56}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#78350f">Beban Uji</text>

  <!-- Garis Penunjuk Target Badge [X] -->
  <line x1="${cx + 17}" y1="${collarY}" x2="238" y2="${collarY}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="3,2"/>
  <g transform="translate(252, ${collarY.toFixed(1)})" filter="url(#badgeShdwDina)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2.2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Kartu Spesifikasi & Konversi Alat (Sisi Kanan Bebas Tabrakan) -->
  <g transform="translate(345, 118)">
    <rect x="-56" y="-50" width="112" height="100" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="0" y="-30" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Spesifikasi Alat</text>
    <line x1="-42" y1="-22" x2="42" y2="-22" stroke="#e2e8f0" stroke-width="1"/>
    <text x="0" y="-8" text-anchor="middle" font-size="9" fill="#475569">Kapasitas: 10 N</text>
    <text x="0" y="8" text-anchor="middle" font-size="9" fill="#475569">Ketelitian: 0.1 N</text>
    <rect x="-44" y="20" width="88" height="20" rx="4" fill="#eff6ff" stroke="#93c5fd" stroke-width="1"/>
    <text x="0" y="33.5" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#1d4ed8">1 N &#x2248; 100 gram</text>
  </g>

  <!-- Prompt Pertanyaan Pedagogis -->
  <text x="210" y="266" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Berapakah besar gaya tarikan yang ditunjukkan oleh penunjuk "${escapeXml(labelChar)}"?</text>
</svg>`;
}

/**
 * 9. Render Tangga Satuan Panjang (km, hm, dam, m, dm, cm, mm)
 */
export function renderTanggaSatuanPanjangSvg(params: {
  targetSatuan?: string; // 'm', 'cm', etc.
  label?: string;
}): string {
  const target = (params.targetSatuan || 'm').toLowerCase();
  const labelChar = params.label || 'X';

  const units = ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'];
  const startX = 40;
  const startY = 48;
  const stepW = 38;
  const stepH = 26;

  let stairsSvg = '';
  units.forEach((u, idx) => {
    const x = startX + idx * stepW;
    const y = startY + idx * stepH;
    const isTarget = u === target;

    stairsSvg += `
      <!-- Anak Tangga ${idx + 1} -->
      <rect x="${x}" y="${y}" width="${stepW}" height="${stepH}" fill="${isTarget ? '#fff1f2' : '#f8fafc'}" stroke="${isTarget ? '#e11d48' : '#64748b'}" stroke-width="${isTarget ? '2' : '1.2'}"/>
      ${isTarget ? `
        <circle cx="${x + stepW / 2}" cy="${y + stepH / 2}" r="11" fill="#e11d48"/>
        <text x="${x + stepW / 2}" y="${y + stepH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      ` : `
        <text x="${x + stepW / 2}" y="${y + stepH / 2 + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${u}</text>
      `}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 270" width="420" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Tangga Konversi Satuan Panjang (Metrik)</text>

  <!-- Anak Tangga 7 Tingkat -->
  ${stairsSvg}

  <!-- Aturan Konversi di Sisi Kanan -->
  <g transform="translate(315, 65)">
    <rect width="90" height="120" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="45" y="20" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0f172a">Aturan</text>

    <!-- Turun 1x = x10 -->
    <text x="45" y="44" text-anchor="middle" font-size="9" font-weight="bold" fill="#15803d">Turun 1 Tangga</text>
    <rect x="18" y="50" width="54" height="18" rx="3" fill="#dcfce7" stroke="#16a34a"/>
    <text x="45" y="63" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#15803d">× 10</text>

    <!-- Naik 1x = :10 -->
    <text x="45" y="88" text-anchor="middle" font-size="9" font-weight="bold" fill="#b91c1c">Naik 1 Tangga</text>
    <rect x="18" y="94" width="54" height="18" rx="3" fill="#fee2e2" stroke="#ef4444"/>
    <text x="45" y="107" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b91c1c">: 10</text>
  </g>

  <text x="210" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Satuan panjang pada anak tangga yang ditunjuk huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 10. Render Tangga Satuan Massa (kg, hg, dag, g, dg, cg, mg)
 */
export function renderTanggaSatuanMassaSvg(params: {
  targetSatuan?: string; // 'kg', 'g', 'ons', etc.
  label?: string;
}): string {
  const target = (params.targetSatuan || 'g').toLowerCase();
  const labelChar = params.label || 'X';

  const units = ['kg', 'hg (ons)', 'dag', 'g', 'dg', 'cg', 'mg'];
  const startX = 35;
  const startY = 48;
  const stepW = 40;
  const stepH = 26;

  let stairsSvg = '';
  units.forEach((u, idx) => {
    const x = startX + idx * stepW;
    const y = startY + idx * stepH;
    const isTarget = u.startsWith(target);

    stairsSvg += `
      <rect x="${x}" y="${y}" width="${stepW}" height="${stepH}" fill="${isTarget ? '#fff1f2' : '#f8fafc'}" stroke="${isTarget ? '#e11d48' : '#64748b'}" stroke-width="${isTarget ? '2' : '1.2'}"/>
      ${isTarget ? `
        <circle cx="${x + stepW / 2}" cy="${y + stepH / 2}" r="11" fill="#e11d48"/>
        <text x="${x + stepW / 2}" y="${y + stepH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      ` : `
        <text x="${x + stepW / 2}" y="${y + stepH / 2 + 4}" text-anchor="middle" font-size="${u.length > 3 ? '8.5' : '10.5'}" font-weight="bold" fill="#0f172a">${u}</text>
      `}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 270" width="420" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Tangga Konversi Satuan Massa (Berat)</text>

  <!-- Anak Tangga 7 Tingkat -->
  ${stairsSvg}

  <!-- Aturan Konversi di Sisi Kanan -->
  <g transform="translate(325, 65)">
    <rect width="82" height="120" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="41" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Aturan Berat</text>

    <text x="41" y="44" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#15803d">Turun 1 Tingkat</text>
    <rect x="16" y="50" width="50" height="18" rx="3" fill="#dcfce7" stroke="#16a34a"/>
    <text x="41" y="63" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#15803d">× 10</text>

    <text x="41" y="88" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#b91c1c">Naik 1 Tingkat</text>
    <rect x="16" y="94" width="50" height="18" rx="3" fill="#fee2e2" stroke="#ef4444"/>
    <text x="41" y="107" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b91c1c">: 10</text>
  </g>

  <text x="210" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Satuan massa pada anak tangga yang ditunjuk huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 11. Render Tangga Satuan Volume (kl, hl, dal, l, dl, cl, ml)
 */
export function renderTanggaSatuanVolumeSvg(params: {
  targetSatuan?: string; // 'l', 'ml', etc.
  label?: string;
}): string {
  const target = (params.targetSatuan || 'l').toLowerCase();
  const labelChar = params.label || 'X';

  const units = ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'];
  const startX = 35;
  const startY = 48;
  const stepW = 40;
  const stepH = 26;

  let stairsSvg = '';
  units.forEach((u, idx) => {
    const x = startX + idx * stepW;
    const y = startY + idx * stepH;
    const isTarget = u === target;

    stairsSvg += `
      <rect x="${x}" y="${y}" width="${stepW}" height="${stepH}" fill="${isTarget ? '#fff1f2' : '#f8fafc'}" stroke="${isTarget ? '#e11d48' : '#64748b'}" stroke-width="${isTarget ? '2' : '1.2'}"/>
      ${isTarget ? `
        <circle cx="${x + stepW / 2}" cy="${y + stepH / 2}" r="11" fill="#e11d48"/>
        <text x="${x + stepW / 2}" y="${y + stepH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      ` : `
        <text x="${x + stepW / 2}" y="${y + stepH / 2 + 4.5}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0f172a">${u}</text>
      `}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 270" width="420" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Tangga Konversi Satuan Volume (Liter)</text>

  <!-- Anak Tangga 7 Tingkat -->
  ${stairsSvg}

  <!-- Aturan Konversi di Sisi Kanan -->
  <g transform="translate(325, 65)">
    <rect width="82" height="120" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="41" y="20" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0f172a">Aturan Liter</text>

    <text x="41" y="44" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#15803d">Turun 1 Tingkat</text>
    <rect x="16" y="50" width="50" height="18" rx="3" fill="#dcfce7" stroke="#16a34a"/>
    <text x="41" y="63" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#15803d">× 10</text>

    <text x="41" y="88" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#b91c1c">Naik 1 Tingkat</text>
    <rect x="16" y="94" width="50" height="18" rx="3" fill="#fee2e2" stroke="#ef4444"/>
    <text x="41" y="107" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b91c1c">: 10</text>
  </g>

  <text x="210" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Satuan volume pada anak tangga yang ditunjuk huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}
