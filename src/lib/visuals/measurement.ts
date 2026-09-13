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

  const cx = 190;
  const cy = 135;
  const r = 85;

  // Jarum detik utama
  const secAngle = (detik * 6 - 90) * (Math.PI / 180);
  const secLen = r - 12;
  const secX = cx + secLen * Math.cos(secAngle);
  const secY = cy + secLen * Math.sin(secAngle);

  // Sub-dial menit di bagian atas
  const subCx = cx;
  const subCy = cy - 32;
  const subR = 24;
  const minAngle = (menit * 12 - 90) * (Math.PI / 180);
  const minLen = subR - 5;
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 270" width="400" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="400" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Waktu: Stopwatch Analog</text>

  <!-- Tombol Stopwatch Atas -->
  <rect x="${cx - 9}" y="32" width="18" height="14" rx="2" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
  <rect x="${cx - 14}" y="26" width="28" height="8" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>

  <!-- Tombol Lap Kanan Atas -->
  <g transform="translate(${cx + 48}, 48) rotate(35)">
    <rect x="-6" y="-12" width="12" height="12" rx="2" fill="#64748b"/>
    <rect x="-9" y="-16" width="18" height="6" rx="2" fill="#e11d48"/>
  </g>

  <!-- Badan Luar & Casing -->
  <circle cx="${cx}" cy="${cy}" r="${r + 7}" fill="#f1f5f9" stroke="#334155" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

  <!-- Ticks & Skala -->
  ${ticksSvg}

  <!-- Sub-dial Menit -->
  <circle cx="${subCx}" cy="${subCy}" r="${subR}" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
  <line x1="${subCx}" y1="${subCy}" x2="${minX.toFixed(1)}" y2="${minY.toFixed(1)}" stroke="#0284c7" stroke-width="1.8"/>
  <circle cx="${subCx}" cy="${subCy}" r="2" fill="#0284c7"/>
  <text x="${subCx}" y="${subCy + 15}" text-anchor="middle" font-size="7" fill="#64748b">menit</text>

  <!-- Jarum Detik Utama -->
  <line x1="${cx}" y1="${cy}" x2="${secX.toFixed(1)}" y2="${secY.toFixed(1)}" stroke="#dc2626" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="#dc2626"/>

  <!-- Callout Target X -->
  <g transform="translate(325, 110)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
    <text x="0" y="26" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Waktu = ... s</text>
  </g>

  <text x="200" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Berapakah hasil pengukuran waktu yang ditunjukkan oleh jarum "${escapeXml(labelChar)}"?</text>
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

  const startX = 40;
  const startY = 80;
  const pxPerCm = 36;
  const noniusOffset = val * pxPerCm;

  // Skala utama: 0 s/d 7 cm
  let mainScaleTicks = '';
  for (let mm = 0; mm <= 70; mm++) {
    const x = startX + (mm / 10) * pxPerCm;
    const isCm = mm % 10 === 0;
    const isHalf = mm % 5 === 0;
    const tickH = isCm ? 18 : isHalf ? 12 : 7;
    mainScaleTicks += `<line x1="${x.toFixed(1)}" y1="${startY + 26}" x2="${x.toFixed(1)}" y2="${startY + 26 - tickH}" stroke="#0f172a" stroke-width="${isCm ? '1.5' : '0.9'}"/>`;
    if (isCm) {
      mainScaleTicks += `<text x="${x.toFixed(1)}" y="${startY + 5}" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">${mm / 10}</text>`;
    }
  }

  // Skala nonius: 0 s/d 10 (0.1 mm)
  const noniusX = startX + noniusOffset;
  let noniusTicks = '';
  for (let n = 0; n <= 10; n++) {
    const nx = noniusX + (n * 0.9 * pxPerCm) / 10;
    const isMajor = n % 5 === 0;
    const tickH = isMajor ? 14 : 8;
    noniusTicks += `<line x1="${nx.toFixed(1)}" y1="${startY + 32}" x2="${nx.toFixed(1)}" y2="${startY + 32 + tickH}" stroke="#0284c7" stroke-width="1.2"/>`;
    if (isMajor) {
      noniusTicks += `<text x="${nx.toFixed(1)}" y="${startY + 58}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0284c7">${n}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 260" width="440" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="440" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="220" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Panjang Presisi: Jangka Sorong (Vernier Caliper)</text>

  <!-- Batang Utama Jangka Sorong -->
  <rect x="${startX - 20}" y="${startY - 2}" width="380" height="30" fill="#f8fafc" stroke="#334155" stroke-width="1.8"/>
  <!-- Rahang Tetap Kiri Luar & Dalam -->
  <path d="M ${startX - 20},${startY - 2} L ${startX - 20},${startY + 90} L ${startX - 4},${startY + 90} L ${startX - 4},${startY + 28} L ${startX - 20},${startY + 28} Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.8"/>
  <path d="M ${startX - 20},${startY - 2} L ${startX - 20},${startY - 35} L ${startX - 6},${startY - 35} L ${startX - 6},${startY - 2} Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.8"/>

  <!-- Skala Utama -->
  ${mainScaleTicks}
  <text x="${startX + 270}" y="${startY + 17}" font-size="9.5" font-weight="bold" fill="#64748b">cm (0.1 cm)</text>

  <!-- Benda yang Diukur (Silinder / Kelereng) di antara rahang -->
  <rect x="${startX - 4}" y="${startY + 40}" width="${noniusOffset}" height="32" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>
  <text x="${startX - 4 + noniusOffset / 2}" y="${startY + 60}" text-anchor="middle" font-size="9" font-weight="bold" fill="#9a3412">Benda</text>

  <!-- Rahang Geser (Nonius) -->
  <rect x="${noniusX - 10}" y="${startY + 28}" width="78" height="42" fill="#eff6ff" stroke="#0284c7" stroke-width="1.8" rx="2"/>
  <path d="M ${noniusX},${startY + 28} L ${noniusX},${startY + 90} L ${noniusX + 14},${startY + 90} L ${noniusX + 14},${startY + 70} L ${noniusX},${startY + 70} Z" fill="#dbeafe" stroke="#0284c7" stroke-width="1.8"/>

  <!-- Skala Nonius -->
  ${noniusTicks}
  <text x="${noniusX + 50}" y="${startY + 56}" font-size="8" font-weight="bold" fill="#0284c7">0.01 cm</text>

  <!-- Callout Target X -->
  <g transform="translate(350, 150)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="220" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Hasil pengukuran jangka sorong yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ... cm</text>
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
  maxNewton?: number;
  label?: string;
}): string {
  const f = Math.max(0, Math.min(10, params.gayaNewton != null ? params.gayaNewton : 4));
  const labelChar = params.label || 'X';

  const cx = 175;
  const topY = 50;
  const tubeH = 140;
  const bottomY = topY + tubeH;

  // Posisi collar penunjuk turun sesuai gaya
  const stretchRatio = f / 10;
  const collarY = topY + 25 + stretchRatio * (tubeH - 50);

  // Skala Newton (kiri) & Gram (kanan)
  let ticks = '';
  for (let n = 0; n <= 10; n += 2) {
    const y = topY + 25 + (n / 10) * (tubeH - 50);
    ticks += `
      <line x1="${cx - 18}" y1="${y}" x2="${cx - 8}" y2="${y}" stroke="#0f172a" stroke-width="1.5"/>
      <text x="${cx - 22}" y="${y + 3.5}" text-anchor="end" font-size="8.5" font-weight="bold" fill="#0f172a">${n}</text>
      <line x1="${cx + 8}" y1="${y}" x2="${cx + 18}" y2="${y}" stroke="#0f172a" stroke-width="1.5"/>
      <text x="${cx + 22}" y="${y + 3.5}" text-anchor="start" font-size="8.5" font-weight="bold" fill="#0284c7">${n * 100}</text>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 270" width="380" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Gaya: Neraca Pegas (Dinamometer)</text>

  <!-- Cincin Gantung Atas -->
  <circle cx="${cx}" cy="${topY - 14}" r="10" fill="none" stroke="#64748b" stroke-width="3"/>

  <!-- Tabung Transparan Dinamometer -->
  <rect x="${cx - 16}" y="${topY}" width="32" height="${tubeH}" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="2"/>

  <!-- Pegas Spiral di Dalam Tabung -->
  <line x1="${cx}" y1="${topY + 6}" x2="${cx}" y2="${collarY}" stroke="#64748b" stroke-width="2" stroke-dasharray="3,3"/>

  <!-- Collar / Pembatas Penunjuk Merah -->
  <rect x="${cx - 14}" y="${collarY - 3}" width="28" height="6" rx="2" fill="#dc2626"/>

  <!-- Batang Penarik Bawah & Gantungan Pengait -->
  <line x1="${cx}" y1="${collarY + 3}" x2="${cx}" y2="${bottomY + 15}" stroke="#475569" stroke-width="2.5"/>
  <path d="M ${cx},${bottomY + 15} C ${cx - 12},${bottomY + 22} ${cx + 12},${bottomY + 30} ${cx},${bottomY + 38}" fill="none" stroke="#475569" stroke-width="2.5"/>

  <!-- Beban Gantung Bawah -->
  <rect x="${cx - 18}" y="${bottomY + 40}" width="36" height="20" rx="3" fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>
  <text x="${cx}" y="${bottomY + 54}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#ffffff">Beban</text>

  <!-- Label Satuan Skala -->
  <text x="${cx - 24}" y="${topY + 14}" text-anchor="end" font-size="9" font-weight="bold" fill="#0f172a">N</text>
  <text x="${cx + 24}" y="${topY + 14}" text-anchor="start" font-size="9" font-weight="bold" fill="#0284c7">g</text>

  ${ticks}

  <!-- Target Badge X -->
  <g transform="translate(285, 120)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="190" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Besar gaya tarikan pegas yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ... N</text>
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
