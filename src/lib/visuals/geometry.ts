/**
 * geometry.ts
 * 2D & 3D Geometric Shape SVG Renderers
 */

import {
  escapeXml,
  safeNum,
  SudutLuarSegitigaParams,
  JaringKerucutParams,
  JaringTabungParams,
  LuasPermukaanGabunganParams,
  PerisaiPancasilaParams
} from './types';

/** Render Balok 3D Isometrik dengan dimensi p, l, t dan garis putus-putus rusuk belakang */
export function renderBalokSvg(params: { p?: number; l?: number; t?: number; unit?: string; label?: string }): string {
  const p = params.p || 12;
  const l = params.l || 8;
  const t = params.t || 6;
  const unit = params.unit || 'cm';
  const label = params.label || `Balok (${p} × ${l} × ${t} ${unit})`;

  const x0 = 50;
  const y0 = 170;
  const fw = 180; // lebar depan
  const fh = 100; // tinggi depan
  const dx = 70;  // pergeseran sumbu z
  const dy = -45;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="360" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Sisi Atas (Pencahayaan Lembut dari Atas) -->
    <linearGradient id="balokTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>

    <!-- Gradien Sisi Kanan (Bayangan Kedalaman 3D) -->
    <linearGradient id="balokRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="60%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>

    <!-- Gradien Sisi Depan (Wajah Utama Bersih) -->
    <linearGradient id="balokFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>

    <!-- Filter Bayangan Dasar Kontak Lantai -->
    <radialGradient id="balokFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Bayangan Kontak Lantai (Ground Shadow) -->
  <ellipse cx="${x0 + fw / 2 + dx / 2}" cy="${y0 + 12}" rx="${fw / 2 + 25}" ry="13" fill="url(#balokFloorShdw)"/>

  <!-- Rusuk Belakang Tak Tampak (Garis Putus-Putus Presisi) -->
  <line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0 + dy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + fw + dx}" y2="${y0 + dy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + dx}" y2="${y0 - fh + dy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>

  <!-- Sisi Atas Balok 3D -->
  <polygon points="${x0},${y0 - fh} ${x0 + dx},${y0 - fh + dy} ${x0 + fw + dx},${y0 - fh + dy} ${x0 + fw},${y0 - fh}" fill="url(#balokTopGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Sisi Kanan Balok 3D -->
  <polygon points="${x0 + fw},${y0 - fh} ${x0 + fw + dx},${y0 - fh + dy} ${x0 + fw + dx},${y0 + dy} ${x0 + fw},${y0}" fill="url(#balokRightGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Sisi Depan Balok 3D -->
  <rect x="${x0}" y="${y0 - fh}" width="${fw}" height="${fh}" fill="url(#balokFrontGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Titik Sudut Alas (A, B, C, D) -->
  <text x="${x0 - 14}" y="${y0 + 14}" font-size="12" font-weight="bold" fill="#1e293b">A</text>
  <text x="${x0 + fw + 8}" y="${y0 + 14}" font-size="12" font-weight="bold" fill="#1e293b">B</text>
  <text x="${x0 + fw + dx + 8}" y="${y0 + dy + 6}" font-size="12" font-weight="bold" fill="#1e293b">C</text>
  <text x="${x0 + dx - 16}" y="${y0 + dy + 4}" font-size="12" font-weight="bold" fill="#64748b">D</text>

  <!-- Titik Sudut Tutup (E, F, G, H) -->
  <text x="${x0 - 14}" y="${y0 - fh - 6}" font-size="12" font-weight="bold" fill="#1e293b">E</text>
  <text x="${x0 + fw + 8}" y="${y0 - fh - 6}" font-size="12" font-weight="bold" fill="#1e293b">F</text>
  <text x="${x0 + fw + dx + 8}" y="${y0 - fh + dy - 4}" font-size="12" font-weight="bold" fill="#1e293b">G</text>
  <text x="${x0 + dx - 16}" y="${y0 - fh + dy - 6}" font-size="12" font-weight="bold" fill="#64748b">H</text>

  <!-- Garis Dimensi Panjang (p) -->
  <line x1="${x0}" y1="${y0 + 20}" x2="${x0 + fw}" y2="${y0 + 20}" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="${x0}" y1="${y0 + 16}" x2="${x0}" y2="${y0 + 24}" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="${x0 + fw}" y1="${y0 + 16}" x2="${x0 + fw}" y2="${y0 + 24}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${x0 + fw / 2}" y="${y0 + 35}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">p = ${p} ${unit}</text>

  <!-- Garis Dimensi Tinggi (t) -->
  <line x1="${x0 - 15}" y1="${y0 - fh}" x2="${x0 - 15}" y2="${y0}" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="${x0 - 19}" y1="${y0 - fh}" x2="${x0 - 11}" y2="${y0 - fh}" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="${x0 - 19}" y1="${y0}" x2="${x0 - 11}" y2="${y0}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${x0 - 22}" y="${y0 - fh / 2 + 4}" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">t = ${t} ${unit}</text>

  <!-- Garis Dimensi Lebar (l) -->
  <line x1="${x0 + fw + 15}" y1="${y0 + 8}" x2="${x0 + fw + dx + 12}" y2="${y0 + dy + 4}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${x0 + fw + dx / 2 + 25}" y="${y0 + dy / 2 + 18}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">l = ${l} ${unit}</text>

  <!-- Judul / Keterangan Bangun -->
  <text x="180" y="240" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${escapeXml(label)}</text>
</svg>`;
}

/** Render Kubus 3D dengan panjang rusuk s */
export function renderKubusSvg(params: { s?: number; unit?: string; label?: string }): string {
  const s = params.s || 10;
  const unit = params.unit || 'cm';
  const label = params.label || `Kubus (s = ${s} ${unit})`;

  const x0 = 80;
  const y0 = 170;
  const a = 120;
  const dx = 55;
  const dy = -40;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 240" width="340" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien 3D Kubus -->
    <linearGradient id="kubusTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="kubusRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="60%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="kubusFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <radialGradient id="kubusFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Bayangan Kontak Lantai (Ground Shadow) -->
  <ellipse cx="${x0 + a / 2 + dx / 2}" cy="${y0 + 10}" rx="${a / 2 + 22}" ry="12" fill="url(#kubusFloorShdw)"/>

  <!-- Garis Rusuk Belakang Tak Tampak (Putus-Putus Presisi) -->
  <line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0 + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + a + dx}" y2="${y0 + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + dx}" y2="${y0 - a + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Sisi Atas Kubus -->
  <polygon points="${x0},${y0 - a} ${x0 + dx},${y0 - a + dy} ${x0 + a + dx},${y0 - a + dy} ${x0 + a},${y0 - a}" fill="url(#kubusTopGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Sisi Kanan Kubus -->
  <polygon points="${x0 + a},${y0 - a} ${x0 + a + dx},${y0 - a + dy} ${x0 + a + dx},${y0 + dy} ${x0 + a},${y0}" fill="url(#kubusRightGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Sisi Depan Kubus -->
  <rect x="${x0}" y="${y0 - a}" width="${a}" height="${a}" fill="url(#kubusFrontGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Titik Sudut Alas & Tutup -->
  <text x="${x0 - 12}" y="${y0 + 14}" font-size="11" font-weight="bold" fill="#1e293b">A</text>
  <text x="${x0 + a + 6}" y="${y0 + 14}" font-size="11" font-weight="bold" fill="#1e293b">B</text>
  <text x="${x0 + a + dx + 6}" y="${y0 + dy + 4}" font-size="11" font-weight="bold" fill="#1e293b">C</text>
  <text x="${x0 - 12}" y="${y0 - a - 4}" font-size="11" font-weight="bold" fill="#1e293b">E</text>
  <text x="${x0 + a + 6}" y="${y0 - a - 4}" font-size="11" font-weight="bold" fill="#1e293b">F</text>
  <text x="${x0 + a + dx + 6}" y="${y0 - a + dy - 4}" font-size="11" font-weight="bold" fill="#1e293b">G</text>
  <text x="${x0 + dx - 12}" y="${y0 - a + dy - 4}" font-size="11" font-weight="bold" fill="#64748b">H</text>

  <!-- Label Dimensi Rusuk (s) -->
  <line x1="${x0}" y1="${y0 + 16}" x2="${x0 + a}" y2="${y0 + 16}" stroke="#0284c7" stroke-width="1.4"/>
  <line x1="${x0}" y1="${y0 + 12}" x2="${x0}" y2="${y0 + 20}" stroke="#0284c7" stroke-width="1.4"/>
  <line x1="${x0 + a}" y1="${y0 + 12}" x2="${x0 + a}" y2="${y0 + 20}" stroke="#0284c7" stroke-width="1.4"/>
  <text x="${x0 + a / 2}" y="${y0 + 29}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">s = ${s} ${unit}</text>

  <line x1="${x0 - 14}" y1="${y0 - a}" x2="${x0 - 14}" y2="${y0}" stroke="#0284c7" stroke-width="1.4"/>
  <line x1="${x0 - 18}" y1="${y0 - a}" x2="${x0 - 10}" y2="${y0 - a}" stroke="#0284c7" stroke-width="1.4"/>
  <line x1="${x0 - 18}" y1="${y0}" x2="${x0 - 10}" y2="${y0}" stroke="#0284c7" stroke-width="1.4"/>
  <text x="${x0 - 20}" y="${y0 - a / 2 + 4}" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">s = ${s} ${unit}</text>

  <!-- Judul / Keterangan Bangun -->
  <text x="170" y="225" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${escapeXml(label)}</text>
</svg>`;
}

/** Render Tabung 3D dengan jari-jari r dan tinggi t */
export function renderTabungSvg(params: { r?: number; t?: number; d?: number; unit?: string }): string {
  const r = params.r || (params.d ? params.d / 2 : 7);
  const t = params.t || 14;
  const unit = params.unit || 'cm';

  const cx = 160;
  const topY = 60;
  const botY = 180;
  const rx = 80;
  const ry = 25;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" width="320" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Selimut Silinder 3D -->
    <linearGradient id="tabungBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="25%" stop-color="#ffffff"/>
      <stop offset="65%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>

    <!-- Gradien Tutup Atas Elips -->
    <linearGradient id="tabungTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>

    <!-- Bayangan Dasar Kontak Lantai -->
    <radialGradient id="tabungFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Bayangan Kontak Lantai (Ground Shadow) -->
  <ellipse cx="${cx}" cy="${botY + 6}" rx="${rx + 12}" ry="${ry + 4}" fill="url(#tabungFloorShdw)"/>

  <!-- Badan Selimut Tabung -->
  <path d="M ${cx - rx},${topY} L ${cx - rx},${botY} A ${rx},${ry} 0 0,0 ${cx + rx},${botY} L ${cx + rx},${topY} Z" fill="url(#tabungBodyGrad)" stroke="none"/>

  <!-- Garis Rusuk Lengkung Belakang Dasar (Putus-Putus) -->
  <path d="M ${cx - rx},${botY} A ${rx},${ry} 0 0,1 ${cx + rx},${botY}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Garis Rusuk Lengkung Depan Dasar (Tampak) -->
  <path d="M ${cx - rx},${botY} A ${rx},${ry} 0 0,0 ${cx + rx},${botY}" fill="none" stroke="#0f172a" stroke-width="2"/>
  
  <!-- Rusuk Tegak Kiri & Kanan -->
  <line x1="${cx - rx}" y1="${topY}" x2="${cx - rx}" y2="${botY}" stroke="#0f172a" stroke-width="2"/>
  <line x1="${cx + rx}" y1="${topY}" x2="${cx + rx}" y2="${botY}" stroke="#0f172a" stroke-width="2"/>

  <!-- Sumbu Simetri Putar Tengah -->
  <line x1="${cx}" y1="${topY}" x2="${cx}" y2="${botY}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="5,3"/>

  <!-- Tutup Atas Tabung (Elips 3D) -->
  <ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="url(#tabungTopGrad)" stroke="#0f172a" stroke-width="2"/>

  <!-- Garis Jari-Jari (r) pada Tutup Atas -->
  <line x1="${cx}" y1="${topY}" x2="${cx + rx}" y2="${topY}" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,2"/>
  <circle cx="${cx}" cy="${topY}" r="3" fill="#0284c7"/>
  <text x="${cx + rx / 2}" y="${topY - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">r = ${r} ${unit}</text>

  <!-- Garis Ukur Tinggi (t) di Sisi Kiri -->
  <line x1="${cx - rx - 20}" y1="${topY}" x2="${cx - rx - 20}" y2="${botY}" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="${cx - rx - 25}" y1="${topY}" x2="${cx - rx - 15}" y2="${topY}" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="${cx - rx - 25}" y1="${botY}" x2="${cx - rx - 15}" y2="${botY}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${cx - rx - 30}" y="${(topY + botY) / 2 + 4}" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">t = ${t} ${unit}</text>

  <!-- Judul / Keterangan Bangun -->
  <text x="${cx}" y="230" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">Tabung (r = ${r} ${unit}, t = ${t} ${unit})</text>
</svg>`;
}

/** Render Kerucut 3D dengan jari-jari r, tinggi t, garis pelukis s */
export function renderKerucutSvg(params: { r?: number; t?: number; s?: number; unit?: string }): string {
  const r = params.r || 7;
  const t = params.t || 12;
  const s = params.s || 15;
  const unit = params.unit || 'cm';

  const apexX = 160;
  const apexY = 40;
  const botY = 180;
  const rx = 80;
  const ry = 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" width="320" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Selimut Kerucut 3D -->
    <linearGradient id="kerucutMantleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="25%" stop-color="#ffffff"/>
      <stop offset="65%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>

    <!-- Bayangan Kontak Lantai (Ground Shadow) -->
    <radialGradient id="kerucutFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Bayangan Kontak Lantai (Ground Shadow) -->
  <ellipse cx="${apexX}" cy="${botY + 5}" rx="${rx + 12}" ry="${ry + 3}" fill="url(#kerucutFloorShdw)"/>

  <!-- Segitiga Badan Selimut Kerucut -->
  <polygon points="${apexX},${apexY} ${apexX - rx},${botY} ${apexX + rx},${botY}" fill="url(#kerucutMantleGrad)"/>

  <!-- Dasar Alas Lengkung Belakang (Putus-Putus) -->
  <path d="M ${apexX - rx},${botY} A ${rx},${ry} 0 0,1 ${apexX + rx},${botY}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Dasar Alas Lengkung Depan (Tampak) -->
  <path d="M ${apexX - rx},${botY} A ${rx},${ry} 0 0,0 ${apexX + rx},${botY}" fill="none" stroke="#0f172a" stroke-width="2"/>

  <!-- Garis Pelukis Kiri & Kanan (Garis Selimut Terluar) -->
  <line x1="${apexX}" y1="${apexY}" x2="${apexX - rx}" y2="${botY}" stroke="#0f172a" stroke-width="2"/>
  <line x1="${apexX}" y1="${apexY}" x2="${apexX + rx}" y2="${botY}" stroke="#0f172a" stroke-width="2"/>

  <!-- Garis Tinggi (t) dari Puncak ke Pusat Alas -->
  <line x1="${apexX}" y1="${apexY}" x2="${apexX}" y2="${botY}" stroke="#e11d48" stroke-width="1.6" stroke-dasharray="3,3"/>
  <circle cx="${apexX}" cy="${botY}" r="2.5" fill="#0f172a"/>

  <!-- Simbol Siku-Siku Pertemuan Tinggi & Jari-Jari -->
  <rect x="${apexX}" y="${botY - 9}" width="9" height="9" fill="none" stroke="#0f172a" stroke-width="1.2"/>

  <!-- Garis Jari-Jari (r) dari Pusat ke Rusuk Kanan -->
  <line x1="${apexX}" y1="${botY}" x2="${apexX + rx}" y2="${botY}" stroke="#0284c7" stroke-width="2"/>
  <circle cx="${apexX + rx}" cy="${botY}" r="2.5" fill="#0284c7"/>

  <!-- Label Anotasi Dimensi -->
  <text x="${apexX + rx / 2}" y="${botY + 16}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">r = ${r} ${unit}</text>
  <text x="${apexX - 6}" y="${(apexY + botY) / 2 + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#e11d48">t = ${t} ${unit}</text>
  <text x="${apexX + rx / 2 + 18}" y="${(apexY + botY) / 2 - 4}" font-size="11" font-weight="bold" fill="#334155">s = ${s} ${unit}</text>

  <!-- Titik Puncak T -->
  <text x="${apexX}" y="${apexY - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">T</text>

  <!-- Judul / Keterangan Bangun -->
  <text x="${apexX}" y="230" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">Kerucut (r = ${r} ${unit}, t = ${t} ${unit})</text>
</svg>`;
}

/** Render Segitiga Siku-Siku dengan alas a, tinggi t, sisi miring c */
export function renderSegitigaSikuSvg(params: {
  alas?: number;
  tinggi?: number;
  miring?: number;
  unit?: string;
  showAlas?: boolean;
  showTinggi?: boolean;
  showMiring?: boolean;
}): string {
  const a = params.alas || 6;
  const t = params.tinggi || 8;
  const c = params.miring || Math.round(Math.sqrt(a * a + t * t) * 10) / 10;
  const unit = params.unit || 'cm';
  const showA = params.showAlas !== false;
  const showT = params.showTinggi !== false;
  const showC = params.showMiring !== false;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 230" width="320" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <polygon points="70,40 70,170 230,170" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>
  <rect x="70" y="154" width="16" height="16" fill="none" stroke="#0f172a" stroke-width="1.5"/>

  <text x="56" y="38" font-size="12" font-weight="bold" fill="#334155">A</text>
  <text x="54" y="184" font-size="12" font-weight="bold" fill="#334155">B</text>
  <text x="238" y="176" font-size="12" font-weight="bold" fill="#334155">C</text>

  ${showT ? `<text x="48" y="110" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">t = ${t} ${unit}</text>` : ''}
  ${showA ? `<text x="150" y="192" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">a = ${a} ${unit}</text>` : ''}
  ${showC ? `<text x="165" y="95" font-size="12" font-weight="bold" fill="#047857">c = ${c} ${unit}</text>` : ''}

  <text x="160" y="220" text-anchor="middle" font-size="11" fill="#64748b">Segitiga Siku-Siku ABC (∠B = 90°)</text>
</svg>`;
}

/** Render Sudut dengan busur derajat */
export function renderSudutSvg(params: { derajat?: number; jenis?: string; label?: string }): string {
  const deg = params.derajat || 60;
  const label = params.label || 'Sudut ABC';
  const rad = (deg * Math.PI) / 180;

  // Jika sudut tumpul (> 90°), geser titik sudut cx ke tengah agar kaki kiri tidak terpotong (x < 0)
  const isObtuse = deg > 90;
  const cx = isObtuse ? 170 : 80;
  const cy = 160;
  const len = isObtuse ? 120 : 140;

  const x1 = cx + len;
  const y1 = cy;

  const x2 = cx + len * Math.cos(rad);
  const y2 = cy - len * Math.sin(rad);

  const arcR = 40;
  const arcX = cx + arcR * Math.cos(rad);
  const arcY = cy - arcR * Math.sin(rad);
  const largeArc = deg > 180 ? 1 : 0;

  // Penempatan label derajat di tengah busur sudut
  const midRad = rad / 2;
  const textR = arcR + 20;
  const textX = cx + textR * Math.cos(midRad);
  const textY = cy - textR * Math.sin(midRad);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" width="340" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#0f172a" stroke-width="2.5"/>
  <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="2.5"/>

  <path d="M ${cx + arcR},${cy} A ${arcR},${arcR} 0 ${largeArc},0 ${arcX},${arcY}" fill="none" stroke="#e11d48" stroke-width="2"/>
  
  <circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>
  <text x="${cx - 16}" y="${cy + 16}" font-size="13" font-weight="bold" fill="#334155">B</text>
  <text x="${x1 + 10}" y="${y1 + 4}" font-size="13" font-weight="bold" fill="#334155">C</text>
  <text x="${x2 + (Math.cos(rad) >= 0 ? 8 : -18)}" y="${y2 + (Math.sin(rad) >= 0 ? -8 : 16)}" font-size="13" font-weight="bold" fill="#334155">A</text>

  <text x="${textX}" y="${textY + 4}" text-anchor="middle" font-size="13" font-weight="bold" fill="#e11d48">${deg}°</text>

  <text x="170" y="205" text-anchor="middle" font-size="11" fill="#64748b">${escapeXml(label)}</text>
</svg>`;
}

/** Render Bola 3D dengan jari-jari r */
export function renderBolaSvg(params: { r?: number; d?: number; unit?: string }): string {
  const r = params.r || (params.d ? params.d / 2 : 7);
  const unit = params.unit || 'cm';

  const cx = 160;
  const cy = 112;
  const rad = 78;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Volumetrik Bola 3D Spekular -->
    <radialGradient id="gradBola3D" cx="36%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#f1f5f9"/>
      <stop offset="65%" stop-color="#cbd5e1"/>
      <stop offset="90%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </radialGradient>

    <!-- Bayangan Kontak Permukaan Lantai -->
    <radialGradient id="bolaFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.18"/>
      <stop offset="65%" stop-color="#0f172a" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Bayangan Kontak Lantai (Ground Shadow) -->
  <ellipse cx="${cx}" cy="${cy + rad + 6}" rx="${rad - 6}" ry="12" fill="url(#bolaFloorShdw)"/>

  <!-- Badan Bola 3D -->
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#gradBola3D)" stroke="#0f172a" stroke-width="2"/>

  <!-- Garis Ekuator Belakang (Putus-Putus) -->
  <path d="M ${cx - rad},${cy} A ${rad},22 0 0,1 ${cx + rad},${cy}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Garis Ekuator Depan (Tampak) -->
  <path d="M ${cx - rad},${cy} A ${rad},22 0 0,0 ${cx + rad},${cy}" fill="none" stroke="#0f172a" stroke-width="1.6"/>

  <!-- Garis Meridian Vertikal Belakang (Putus-Putus) -->
  <path d="M ${cx},${cy - rad} A 22,${rad} 0 0,0 ${cx},${cy + rad}" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4,4"/>

  <!-- Garis Meridian Vertikal Depan (Tampak) -->
  <path d="M ${cx},${cy - rad} A 22,${rad} 0 0,1 ${cx},${cy + rad}" fill="none" stroke="#64748b" stroke-width="1.2"/>

  <!-- Titik Pusat O -->
  <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0f172a"/>
  <text x="${cx - 10}" y="${cy - 6}" font-size="11" font-weight="bold" fill="#334155">O</text>

  <!-- Garis Jari-Jari (r) dari Titik Pusat ke Tepi Kanan -->
  <line x1="${cx}" y1="${cy}" x2="${cx + rad}" y2="${cy}" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,2"/>
  <circle cx="${cx + rad}" cy="${cy}" r="2.5" fill="#0284c7"/>
  <text x="${cx + rad / 2}" y="${cy - 7}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">r = ${r} ${unit}</text>

  <!-- Judul / Keterangan Bangun -->
  <text x="${cx}" y="226" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">Bola (r = ${r} ${unit})</text>
</svg>`;
}

/** Render Prisma Segitiga 3D Isometrik */
export function renderPrismaSvg(params: { alas?: number; tinggiSegitiga?: number; panjang?: number; unit?: string }): string {
  const a = params.alas || 8;
  const tSeg = params.tinggiSegitiga || 6;
  const p = params.panjang || 12;
  const unit = params.unit || 'cm';

  // Titik-titik prisma segitiga (pandangan isometrik)
  // Segitiga depan: A(60,180), B(200,180), C(130,80)
  // Segitiga belakang: D(120,155), E(260,155), F(190,55)
  const dx = 60;
  const dy = -25;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="360" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Sisi Miring Atas -->
    <linearGradient id="prismaTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>

    <!-- Gradien Sisi Tegak Kanan -->
    <linearGradient id="prismaRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="60%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>

    <!-- Gradien Segitiga Depan -->
    <linearGradient id="prismaFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>

    <!-- Bayangan Kontak Lantai -->
    <radialGradient id="prismaFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Bayangan Kontak Lantai (Ground Shadow) -->
  <polygon points="56,182 196,182 ${200 + dx + 8},${180 + dy + 6} ${60 + dx + 4},${180 + dy + 6}" fill="url(#prismaFloorShdw)"/>

  <!-- Rusuk Belakang Tak Tampak (Putus-Putus Presisi) -->
  <line x1="60" y1="180" x2="${60 + dx}" y2="${180 + dy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
  <line x1="130" y1="80" x2="${130 + dx}" y2="${80 + dy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
  <line x1="${60 + dx}" y1="${180 + dy}" x2="${130 + dx}" y2="${80 + dy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>

  <!-- Sisi Miring Atas (Segitiga Depan ke Belakang) -->
  <polygon points="130,80 ${130 + dx},${80 + dy} ${200 + dx},${180 + dy} 200,180" fill="url(#prismaTopGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Sisi Tegak Kanan -->
  <polygon points="200,180 ${200 + dx},${180 + dy} ${130 + dx},${80 + dy} 130,80" fill="url(#prismaRightGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Segitiga Depan (Bidang Utama) -->
  <polygon points="60,180 200,180 130,80" fill="url(#prismaFrontGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

  <!-- Garis Tinggi Segitiga Depan (Putus-Putus Merah) -->
  <line x1="130" y1="80" x2="130" y2="180" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>
  <rect x="130" y="168" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1.2"/>

  <!-- Titik Sudut Segitiga Depan (A, B, C) -->
  <text x="46" y="192" font-size="11" font-weight="bold" fill="#1e293b">A</text>
  <text x="206" y="192" font-size="11" font-weight="bold" fill="#1e293b">B</text>
  <text x="120" y="74" font-size="11" font-weight="bold" fill="#1e293b">C</text>

  <!-- Titik Sudut Belakang (E, F) -->
  <text x="${200 + dx + 6}" y="${180 + dy + 4}" font-size="11" font-weight="bold" fill="#1e293b">E</text>
  <text x="${130 + dx + 6}" y="${80 + dy - 4}" font-size="11" font-weight="bold" fill="#1e293b">F</text>

  <!-- Label Dimensi Alas, Tinggi, dan Panjang Prisma -->
  <line x1="60" y1="190" x2="200" y2="190" stroke="#0284c7" stroke-width="1.4"/>
  <line x1="60" y1="186" x2="60" y2="194" stroke="#0284c7" stroke-width="1.4"/>
  <line x1="200" y1="186" x2="200" y2="194" stroke="#0284c7" stroke-width="1.4"/>
  <text x="130" y="204" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#0284c7">alas = ${a} ${unit}</text>

  <text x="122" y="135" text-anchor="end" font-size="11.5" font-weight="bold" fill="#e11d48">t = ${tSeg} ${unit}</text>
  <text x="${200 + dx / 2 + 14}" y="${180 + dy / 2 + 18}" font-size="11.5" font-weight="bold" fill="#047857">p = ${p} ${unit}</text>

  <!-- Judul / Keterangan Bangun -->
  <text x="180" y="240" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Prisma Segitiga (a=${a}, t=${tSeg}, p=${p} ${unit})</text>
</svg>`;
}

/** Render Limas Segiempat 3D dengan alas persegi s dan tinggi t */
export function renderLimasSvg(params: { s?: number; t?: number; unit?: string }): string {
  const s = params.s || 10;
  const t = params.t || 12;
  const unit = params.unit || 'cm';

  const apexX = 170;
  const apexY = 48;
  const baseOy = 175;
  const baseAy = 210;
  const baseBy = 240;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 250" width="340" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Segitiga Selimut Depan Kiri -->
    <linearGradient id="limasLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>

    <!-- Gradien Segitiga Selimut Depan Kanan -->
    <linearGradient id="limasRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="60%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>

    <!-- Bayangan Dasar Kontak Lantai -->
    <radialGradient id="limasFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Bayangan Kontak Lantai (Ground Shadow) -->
  <ellipse cx="170" cy="225" rx="85" ry="14" fill="url(#limasFloorShdw)"/>

  <!-- Rusuk Alas Belakang Tak Tampak (Putus-Putus Presisi) -->
  <line x1="170" y1="${baseOy}" x2="95" y2="${baseAy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
  <line x1="170" y1="${baseOy}" x2="245" y2="${baseAy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
  <line x1="${apexX}" y1="${apexY}" x2="170" y2="${baseOy}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>

  <!-- Sisi Segitiga Selimut Depan Kiri -->
  <polygon points="${apexX},${apexY} 95,${baseAy} 170,${baseBy}" fill="url(#limasLeftGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" fill-opacity="0.85"/>

  <!-- Sisi Segitiga Selimut Depan Kanan -->
  <polygon points="${apexX},${apexY} 245,${baseAy} 170,${baseBy}" fill="url(#limasRightGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" fill-opacity="0.85"/>

  <!-- Garis Tinggi (t) dari Puncak T ke Pusat Alas O (Merah Putus-Putus) -->
  <line x1="${apexX}" y1="${apexY}" x2="170" y2="${baseAy}" stroke="#e11d48" stroke-width="1.6" stroke-dasharray="3,3"/>
  <!-- Simbol Siku-Siku Pertemuan Tinggi & Alas -->
  <rect x="170" y="${baseAy - 10}" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1.2"/>

  <!-- Titik Puncak T & Titik Sudut Alas -->
  <circle cx="${apexX}" cy="${apexY}" r="2.5" fill="#0f172a"/>
  <text x="${apexX}" y="${apexY - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">T</text>
  <text x="82" y="${baseAy + 4}" font-size="11" font-weight="bold" fill="#1e293b">A</text>
  <text x="170" y="${baseBy + 15}" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">B</text>
  <text x="254" y="${baseAy + 4}" font-size="11" font-weight="bold" fill="#1e293b">C</text>
  <text x="170" y="${baseOy - 6}" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">D</text>
  <text x="156" y="${baseAy + 4}" font-size="11" font-weight="bold" fill="#64748b">O</text>

  <!-- Label Dimensi Tinggi (t) dan Rusuk Alas (s) -->
  <text x="178" y="132" font-size="11.5" font-weight="bold" fill="#e11d48">t = ${t} ${unit}</text>
  <text x="125" y="238" font-size="11.5" font-weight="bold" fill="#0284c7">s = ${s} ${unit}</text>
</svg>`;
}

/** Render Lingkaran dengan jari-jari r */
export function renderLingkaranSvg(params: { r?: number; d?: number; unit?: string }): string {
  const r = params.r || (params.d ? params.d / 2 : 7);
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 230" width="320" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <circle cx="160" cy="105" r="80" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik pusat -->
  <circle cx="160" cy="105" r="3" fill="#0f172a"/>
  <text x="148" y="100" font-size="11" font-weight="bold" fill="#334155">O</text>

  <!-- Jari-jari -->
  <line x1="160" y1="105" x2="240" y2="105" stroke="#0284c7" stroke-width="2"/>
  <text x="195" y="98" font-size="12" font-weight="bold" fill="#0284c7">r = ${r} ${unit}</text>

  <!-- Diameter (putus-putus) -->
  <line x1="80" y1="105" x2="240" y2="105" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="160" y="130" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">d = ${r * 2} ${unit}</text>

  <text x="160" y="215" text-anchor="middle" font-size="11" fill="#64748b">Lingkaran (r = ${r} ${unit})</text>
</svg>`;
}

/** Render Trapesium dengan alas atas a, alas bawah b, tinggi t */
export function renderTrapesiumSvg(params: { atasAlas?: number; bawahAlas?: number; tinggi?: number; unit?: string }): string {
  const a = params.atasAlas || 6;
  const b = params.bawahAlas || 12;
  const t = params.tinggi || 8;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <polygon points="110,50 210,50 260,170 60,170" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik sudut -->
  <text x="100" y="44" font-size="11" font-weight="bold" fill="#334155">A</text>
  <text x="216" y="44" font-size="11" font-weight="bold" fill="#334155">B</text>
  <text x="266" y="180" font-size="11" font-weight="bold" fill="#334155">C</text>
  <text x="46" y="180" font-size="11" font-weight="bold" fill="#334155">D</text>

  <!-- Garis tinggi (putus-putus) -->
  <line x1="110" y1="50" x2="110" y2="170" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>
  <rect x="110" y="156" width="12" height="12" fill="none" stroke="#0f172a" stroke-width="1"/>

  <!-- Label alas atas -->
  <line x1="110" y1="35" x2="210" y2="35" stroke="#0284c7" stroke-width="1.5"/>
  <text x="160" y="28" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">a = ${a} ${unit}</text>

  <!-- Label alas bawah -->
  <line x1="60" y1="185" x2="260" y2="185" stroke="#0284c7" stroke-width="1.5"/>
  <text x="160" y="200" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">b = ${b} ${unit}</text>

  <!-- Label tinggi -->
  <text x="96" y="115" text-anchor="end" font-size="11" font-weight="bold" fill="#e11d48">t = ${t} ${unit}</text>

  <text x="160" y="215" text-anchor="middle" font-size="11" fill="#64748b">Trapesium ABCD</text>
</svg>`;
}

/** Render Jajar Genjang dengan alas a dan tinggi t */
export function renderJajarGenjangSvg(params: { alas?: number; tinggi?: number; sisiMiring?: number; unit?: string }): string {
  const a = params.alas || 12;
  const t = params.tinggi || 8;
  const sm = params.sisiMiring || 9;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" width="340" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <polygon points="120,50 280,50 220,170 60,170" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik sudut -->
  <text x="112" y="42" font-size="11" font-weight="bold" fill="#334155">A</text>
  <text x="286" y="52" font-size="11" font-weight="bold" fill="#334155">B</text>
  <text x="226" y="182" font-size="11" font-weight="bold" fill="#334155">C</text>
  <text x="46" y="182" font-size="11" font-weight="bold" fill="#334155">D</text>

  <!-- Garis tinggi -->
  <line x1="120" y1="50" x2="120" y2="170" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>
  <rect x="120" y="156" width="12" height="12" fill="none" stroke="#0f172a" stroke-width="1"/>

  <!-- Label alas -->
  <line x1="60" y1="185" x2="220" y2="185" stroke="#0284c7" stroke-width="1.5"/>
  <text x="140" y="202" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">a = ${a} ${unit}</text>

  <!-- Label tinggi -->
  <text x="106" y="115" text-anchor="end" font-size="11" font-weight="bold" fill="#e11d48">t = ${t} ${unit}</text>

  <!-- Label sisi miring -->
  <text x="82" y="105" font-size="11" font-weight="bold" fill="#047857">s = ${sm} ${unit}</text>

  <text x="170" y="215" text-anchor="middle" font-size="11" fill="#64748b">Jajar Genjang ABCD</text>
</svg>`;
}

/** Render Belah Ketupat dengan diagonal d1 dan d2 */
export function renderBelahKetupatSvg(params: { d1?: number; d2?: number; sisi?: number; unit?: string }): string {
  const d1 = params.d1 || 12;
  const d2 = params.d2 || 16;
  const sisi = params.sisi || 10;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <polygon points="160,30 270,115 160,200 50,115" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik sudut -->
  <text x="160" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">A</text>
  <text x="280" y="118" font-size="11" font-weight="bold" fill="#334155">B</text>
  <text x="160" y="216" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">C</text>
  <text x="36" y="118" font-size="11" font-weight="bold" fill="#334155">D</text>

  <!-- Diagonal d1 (vertikal) -->
  <line x1="160" y1="30" x2="160" y2="200" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="170" y="118" font-size="11" font-weight="bold" fill="#e11d48">d₁ = ${d1} ${unit}</text>

  <!-- Diagonal d2 (horizontal) -->
  <line x1="50" y1="115" x2="270" y2="115" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="160" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">d₂ = ${d2} ${unit}</text>

  <!-- Simbol siku-siku -->
  <rect x="160" y="115" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1"/>

  <!-- Label sisi -->
  <text x="218" y="68" font-size="11" font-weight="bold" fill="#047857">s = ${sisi} ${unit}</text>

  <text x="160" y="235" text-anchor="middle" font-size="11" fill="#64748b">Belah Ketupat ABCD</text>
</svg>`;
}

/** Render Layang-layang dengan diagonal d1 dan d2 */
export function renderLayangLayangSvg(params: { d1?: number; d2?: number; unit?: string }): string {
  const d1 = params.d1 || 10;
  const d2 = params.d2 || 18;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" width="320" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Layang-layang: atas lebih pendek, bawah lebih panjang -->
  <polygon points="160,30 260,100 160,210 60,100" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik sudut -->
  <text x="160" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">A</text>
  <text x="268" y="104" font-size="11" font-weight="bold" fill="#334155">B</text>
  <text x="160" y="226" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">C</text>
  <text x="44" y="104" font-size="11" font-weight="bold" fill="#334155">D</text>

  <!-- Diagonal d1 (vertikal) -->
  <line x1="160" y1="30" x2="160" y2="210" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="170" y="125" font-size="11" font-weight="bold" fill="#e11d48">d₁ = ${d2} ${unit}</text>

  <!-- Diagonal d2 (horizontal) -->
  <line x1="60" y1="100" x2="260" y2="100" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="160" y="92" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">d₂ = ${d1} ${unit}</text>

  <!-- Titik potong -->
  <circle cx="160" cy="100" r="3" fill="#0f172a"/>
  <text x="168" y="96" font-size="10" font-weight="bold" fill="#64748b">O</text>

  <text x="160" y="244" text-anchor="middle" font-size="11" fill="#64748b">Layang-Layang ABCD</text>
</svg>`;
}

/** Render Persegi Panjang berlabel panjang & lebar dengan sudut siku-siku */
export function renderPersegiPanjangSvg(params: { p?: number; l?: number; unit?: string }): string {
  const p = params.p || 12;
  const l = params.l || 8;
  const unit = params.unit || 'cm';

  const rw = 220; // lebar visual
  const rh = 140; // tinggi visual
  const x0 = 60;
  const y0 = 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" width="360" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="ppGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <marker id="arrowL" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 10 0 L 0 5 L 10 10 z" fill="#e11d48"/>
    </marker>
    <marker id="arrowR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48"/>
    </marker>
  </defs>

  <!-- Persegi Panjang utama -->
  <rect x="${x0}" y="${y0}" width="${rw}" height="${rh}" fill="url(#ppGrad)" stroke="#1e40af" stroke-width="2.5" rx="2"/>

  <!-- Titik sudut -->
  <circle cx="${x0}" cy="${y0}" r="3" fill="#1e40af"/><text x="${x0 - 12}" y="${y0 - 6}" font-size="12" font-weight="bold" fill="#1e40af">A</text>
  <circle cx="${x0 + rw}" cy="${y0}" r="3" fill="#1e40af"/><text x="${x0 + rw + 5}" y="${y0 - 6}" font-size="12" font-weight="bold" fill="#1e40af">B</text>
  <circle cx="${x0 + rw}" cy="${y0 + rh}" r="3" fill="#1e40af"/><text x="${x0 + rw + 5}" y="${y0 + rh + 15}" font-size="12" font-weight="bold" fill="#1e40af">C</text>
  <circle cx="${x0}" cy="${y0 + rh}" r="3" fill="#1e40af"/><text x="${x0 - 12}" y="${y0 + rh + 15}" font-size="12" font-weight="bold" fill="#1e40af">D</text>

  <!-- Simbol siku-siku di sudut A -->
  <polyline points="${x0 + 14},${y0} ${x0 + 14},${y0 + 14} ${x0},${y0 + 14}" fill="none" stroke="#475569" stroke-width="1.5"/>

  <!-- Label panjang (atas) -->
  <line x1="${x0 + 10}" y1="${y0 - 15}" x2="${x0 + rw - 10}" y2="${y0 - 15}" stroke="#e11d48" stroke-width="1.5" marker-start="url(#arrowL)" marker-end="url(#arrowR)"/>
  <text x="${x0 + rw / 2}" y="${y0 - 20}" text-anchor="middle" font-size="13" font-weight="bold" fill="#e11d48">${p} ${unit}</text>

  <!-- Label lebar (kanan) -->
  <text x="${x0 + rw + 28}" y="${y0 + rh / 2 + 4}" text-anchor="middle" font-size="13" font-weight="bold" fill="#0284c7" transform="rotate(90,${x0 + rw + 28},${y0 + rh / 2})">${l} ${unit}</text>

  <text x="180" y="215" text-anchor="middle" font-size="12" fill="#64748b">Persegi Panjang ABCD</text>
</svg>`;
}

/** Render Segitiga Sama Sisi dengan 3 sisi sama dan sudut 60° */
export function renderSegitigaSamaSisiSvg(params: { s?: number; unit?: string }): string {
  const s = params.s || 10;
  const unit = params.unit || 'cm';

  const base = 200;
  const h = Math.round(base * 0.866); // √3/2
  const cx = 180;
  const by = 200;
  const ax = cx - base / 2;
  const bx = cx + base / 2;
  const ty = by - h;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="360" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="sssGrad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#d1fae5"/>
    </linearGradient>
  </defs>

  <polygon points="${cx},${ty} ${ax},${by} ${bx},${by}" fill="url(#sssGrad)" stroke="#047857" stroke-width="2.5"/>

  <!-- Titik sudut -->
  <circle cx="${cx}" cy="${ty}" r="3" fill="#047857"/><text x="${cx}" y="${ty - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">A</text>
  <circle cx="${ax}" cy="${by}" r="3" fill="#047857"/><text x="${ax - 10}" y="${by + 16}" font-size="12" font-weight="bold" fill="#047857">B</text>
  <circle cx="${bx}" cy="${by}" r="3" fill="#047857"/><text x="${bx + 5}" y="${by + 16}" font-size="12" font-weight="bold" fill="#047857">C</text>

  <!-- Label sisi (semua sama) -->
  <text x="${(cx + ax) / 2 - 18}" y="${(ty + by) / 2}" font-size="12" font-weight="bold" fill="#e11d48" transform="rotate(-60,${(cx + ax) / 2 - 18},${(ty + by) / 2})">${s} ${unit}</text>
  <text x="${cx}" y="${by + 16}" text-anchor="middle" font-size="12" font-weight="bold" fill="#e11d48">${s} ${unit}</text>
  <text x="${(cx + bx) / 2 + 18}" y="${(ty + by) / 2}" font-size="12" font-weight="bold" fill="#e11d48" transform="rotate(60,${(cx + bx) / 2 + 18},${(ty + by) / 2})">${s} ${unit}</text>

  <!-- Tanda sama panjang (strip) -->
  <line x1="${(cx + ax) / 2 - 2}" y1="${(ty + by) / 2 - 2}" x2="${(cx + ax) / 2 + 4}" y2="${(ty + by) / 2 + 4}" stroke="#047857" stroke-width="2"/>
  <line x1="${cx - 4}" y1="${by - 2}" x2="${cx + 4}" y2="${by - 2}" stroke="#047857" stroke-width="2"/>
  <line x1="${(cx + bx) / 2 - 2}" y1="${(ty + by) / 2 + 4}" x2="${(cx + bx) / 2 + 4}" y2="${(ty + by) / 2 - 2}" stroke="#047857" stroke-width="2"/>

  <!-- Sudut 60° -->
  <text x="${cx}" y="${ty + 24}" text-anchor="middle" font-size="10" fill="#475569">60°</text>
  <text x="${ax + 20}" y="${by - 6}" font-size="10" fill="#475569">60°</text>
  <text x="${bx - 28}" y="${by - 6}" font-size="10" fill="#475569">60°</text>

  <text x="180" y="240" text-anchor="middle" font-size="11" fill="#64748b">Segitiga Sama Sisi ABC (sisi = ${s} ${unit})</text>
</svg>`;
}

/** Render Segitiga Sama Kaki dengan 2 sisi sama dan garis tinggi putus-putus */
export function renderSegitigaSamaKakiSvg(params: {
  kaki?: number;
  alas?: number;
  tinggi?: number;
  unit?: string;
  showKaki?: boolean;
  showTinggi?: boolean;
  showAlas?: boolean;
}): string {
  const unit = params.unit || 'cm';
  const alasNum = typeof params.alas === 'number' ? params.alas : (Number(params.alas) || 12);
  let kakiNum = typeof params.kaki === 'number' ? params.kaki : (Number(params.kaki) || 0);
  let tinggiNum = typeof params.tinggi === 'number' ? params.tinggi : (Number(params.tinggi) || 0);

  const hadTinggi = tinggiNum > 0;
  const hadKaki = kakiNum > 0;

  // Hubungan Pythagoras pada segitiga sama kaki: kaki² = (alas/2)² + tinggi²
  const halfAlas = alasNum / 2;

  if (hadTinggi && !hadKaki) {
    // Hitung kaki dari tinggi dan alas
    kakiNum = Math.round(Math.sqrt(tinggiNum * tinggiNum + halfAlas * halfAlas) * 10) / 10;
  } else if (hadKaki && !hadTinggi) {
    // Hitung tinggi dari kaki dan alas jika kaki > alas/2
    if (kakiNum > halfAlas) {
      tinggiNum = Math.round(Math.sqrt(kakiNum * kakiNum - halfAlas * halfAlas) * 10) / 10;
    } else {
      // Degenerate/invalid input: pastikan kaki > alas/2 agar tidak menghasilkan NaN
      kakiNum = Math.round(alasNum * 0.8 * 10) / 10;
      tinggiNum = Math.round(Math.sqrt(Math.max(1, kakiNum * kakiNum - halfAlas * halfAlas)) * 10) / 10;
    }
  } else if (!hadKaki && !hadTinggi) {
    // Default fallback proporsional (triple 6-8-10 jika alas 12)
    kakiNum = Math.round(alasNum * 0.85 * 10) / 10;
    tinggiNum = Math.round(Math.sqrt(Math.max(1, kakiNum * kakiNum - halfAlas * halfAlas)) * 10) / 10;
  }

  // Hitung rasio proporsi tinggi visual terhadap alas visual
  const baseVisual = 180;
  const realRatio = (tinggiNum > 0 && alasNum > 0) ? (tinggiNum / alasNum) : 0.8;
  // Bounding box: tinggi visual antara 75px dan 140px agar selalu aman di canvas viewBox [0 0 360 260]
  const visualH = Math.round(Math.max(75, Math.min(140, baseVisual * realRatio)));

  const cx = 180;
  const by = 210;
  const ax = cx - baseVisual / 2; // 90
  const bx = cx + baseVisual / 2; // 270
  const ty = by - visualH; // Selalu di antara 70 dan 135

  const showKakiLabel = params.showKaki !== false;
  const showAlasLabel = params.showAlas !== false;
  const showTinggiLabel = params.showTinggi === true || hadTinggi;

  const leftMidX = (cx + ax) / 2;
  const rightMidX = (cx + bx) / 2;
  const legMidY = (ty + by) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="360" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="sskGrad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
  </defs>

  <!-- Badan Segitiga Sama Kaki -->
  <polygon points="${cx},${ty} ${ax},${by} ${bx},${by}" fill="url(#sskGrad)" stroke="#b45309" stroke-width="2.5"/>

  <!-- Titik sudut -->
  <circle cx="${cx}" cy="${ty}" r="3.5" fill="#b45309"/><text x="${cx}" y="${ty - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">A</text>
  <circle cx="${ax}" cy="${by}" r="3.5" fill="#b45309"/><text x="${ax - 10}" y="${by + 16}" font-size="12" font-weight="bold" fill="#b45309">B</text>
  <circle cx="${bx}" cy="${by}" r="3.5" fill="#b45309"/><text x="${bx + 5}" y="${by + 16}" font-size="12" font-weight="bold" fill="#b45309">C</text>

  <!-- Garis tinggi putus-putus -->
  <line x1="${cx}" y1="${ty}" x2="${cx}" y2="${by}" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="${cx}" cy="${by}" r="2.5" fill="#6b7280"/>
  <text x="${cx + 6}" y="${by - 4}" font-size="9" fill="#6b7280">T</text>
  <!-- Simbol siku-siku di kaki tinggi -->
  <polyline points="${cx + 10},${by} ${cx + 10},${by - 10} ${cx},${by - 10}" fill="none" stroke="#6b7280" stroke-width="1.2"/>

  <!-- Label tinggi jika diberikan / diminta -->
  ${showTinggiLabel ? `<text x="${cx - 8}" y="${legMidY}" text-anchor="end" font-size="11" font-weight="bold" fill="#6b7280">t = ${tinggiNum} ${unit}</text>` : ''}

  <!-- Label kaki (sama panjang) -->
  ${showKakiLabel ? `
  <text x="${leftMidX - 16}" y="${legMidY}" text-anchor="end" font-size="12" font-weight="bold" fill="#e11d48">${kakiNum} ${unit}</text>
  <text x="${rightMidX + 16}" y="${legMidY}" text-anchor="start" font-size="12" font-weight="bold" fill="#e11d48">${kakiNum} ${unit}</text>
  ` : ''}

  <!-- Tanda strip kaki kongruen -->
  <line x1="${leftMidX}" y1="${legMidY - 4}" x2="${leftMidX + 6}" y2="${legMidY + 4}" stroke="#b45309" stroke-width="2.5"/>
  <line x1="${leftMidX - 4}" y1="${legMidY - 2}" x2="${leftMidX + 2}" y2="${legMidY + 6}" stroke="#b45309" stroke-width="2.5"/>
  <line x1="${rightMidX}" y1="${legMidY - 4}" x2="${rightMidX - 6}" y2="${legMidY + 4}" stroke="#b45309" stroke-width="2.5"/>
  <line x1="${rightMidX + 4}" y1="${legMidY - 2}" x2="${rightMidX - 2}" y2="${legMidY + 6}" stroke="#b45309" stroke-width="2.5"/>

  <!-- Label alas -->
  ${showAlasLabel ? `<text x="${cx}" y="${by + 16}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">${alasNum} ${unit}</text>` : ''}

  <text x="180" y="252" text-anchor="middle" font-size="11" fill="#64748b">Segitiga Sama Kaki ABC</text>
</svg>`;
}

/** Render Jaring-jaring Kubus (Mendukung variasi pola salib, tangga 1-4-1, dan pola T) */
export function renderJaringKubusSvg(params: { s?: number; unit?: string; pola?: 'salib' | 'tangga' | 't' }): string {
  const s = params.s || 5;
  const unit = params.unit || 'cm';
  const pola = (params.pola || 'salib').toLowerCase();
  const cs = 55;
  const gap = 1;

  let faces: { x: number; y: number; label: string; num: number }[] = [];

  if (pola === 'tangga') {
    faces = [
      { x: cs + gap, y: 0, label: 'Atas', num: 1 },
      { x: 0, y: cs + gap, label: 'Kiri', num: 2 },
      { x: cs + gap, y: cs + gap, label: 'Depan', num: 3 },
      { x: 2 * (cs + gap), y: cs + gap, label: 'Kanan', num: 4 },
      { x: 3 * (cs + gap), y: cs + gap, label: 'Belakang', num: 5 },
      { x: 3 * (cs + gap), y: 2 * (cs + gap), label: 'Bawah', num: 6 },
    ];
  } else if (pola === 't') {
    faces = [
      { x: 0, y: 0, label: 'Kiri', num: 1 },
      { x: cs + gap, y: 0, label: 'Depan', num: 2 },
      { x: 2 * (cs + gap), y: 0, label: 'Kanan', num: 3 },
      { x: cs + gap, y: cs + gap, label: 'Bawah', num: 4 },
      { x: cs + gap, y: 2 * (cs + gap), label: 'Belakang', num: 5 },
      { x: cs + gap, y: 3 * (cs + gap), label: 'Atas', num: 6 },
    ];
  } else {
    faces = [
      { x: cs + gap, y: 0, label: 'Atas', num: 1 },
      { x: 0, y: cs + gap, label: 'Kiri', num: 2 },
      { x: cs + gap, y: cs + gap, label: 'Depan', num: 3 },
      { x: 2 * (cs + gap), y: cs + gap, label: 'Kanan', num: 4 },
      { x: 3 * (cs + gap), y: cs + gap, label: 'Belakang', num: 5 },
      { x: cs + gap, y: 2 * (cs + gap), label: 'Bawah', num: 6 },
    ];
  }

  const colors = [
    { bg: '#dbeafe', stroke: '#2563eb', text: '#1e40af' }, // Atas
    { bg: '#fce7f3', stroke: '#db2777', text: '#9d174d' }, // Kiri
    { bg: '#d1fae5', stroke: '#059669', text: '#065f46' }, // Depan
    { bg: '#fef3c7', stroke: '#d97706', text: '#92400e' }, // Kanan
    { bg: '#e0e7ff', stroke: '#4f46e5', text: '#3730a3' }, // Belakang
    { bg: '#ffedd5', stroke: '#ea580c', text: '#9a3412' }  // Bawah
  ];

  const maxCols = Math.max(...faces.map(f => f.x / (cs + gap))) + 1;
  const maxRows = Math.max(...faces.map(f => f.y / (cs + gap))) + 1;

  const w = maxCols * (cs + gap) + 40;
  const h = maxRows * (cs + gap) + 55;
  const ox = 20;
  const oy = 15;

  let rects = '';
  faces.forEach((f, i) => {
    const c = colors[i % colors.length];
    rects += `
      <!-- Muka ${f.num}: ${f.label} -->
      <rect x="${ox + f.x}" y="${oy + f.y}" width="${cs}" height="${cs}" fill="${c.bg}" stroke="${c.stroke}" stroke-width="2" rx="3"/>
      <!-- Garis Lipat Internal Putus-Putus -->
      <rect x="${ox + f.x + 3}" y="${oy + f.y + 3}" width="${cs - 6}" height="${cs - 6}" fill="none" stroke="${c.stroke}" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.6"/>
      <!-- Badge Nomor Muka -->
      <circle cx="${ox + f.x + cs / 2}" cy="${oy + f.y + cs / 2 - 6}" r="9" fill="#ffffff" stroke="${c.stroke}" stroke-width="1.2"/>
      <text x="${ox + f.x + cs / 2}" y="${oy + f.y + cs / 2 - 2.5}" text-anchor="middle" font-size="9.5" font-weight="bold" fill="${c.text}">${f.num}</text>
      <!-- Label Posisi Muka -->
      <text x="${ox + f.x + cs / 2}" y="${oy + f.y + cs / 2 + 13}" text-anchor="middle" font-size="8.5" font-weight="600" fill="${c.text}">${f.label}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="6" fill="#ffffff" stroke="#f1f5f9" stroke-width="1"/>
  ${rects}
  <text x="${w / 2}" y="${h - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Jaring-jaring Kubus Pola ${pola.toUpperCase()} (s = ${s} ${unit})</text>
</svg>`;
}

/** Render Jaring-jaring Balok (bentuk T terbuka) */
export function renderJaringBalokSvg(params: { p?: number; l?: number; t?: number; unit?: string }): string {
  const p = params.p || 6;
  const l = params.l || 4;
  const t = params.t || 3;
  const unit = params.unit || 'cm';

  // Skala visual adaptif agar pas di viewport
  const unitW = 2 * t + 2 * p;
  const unitH = 2 * t + l;
  const scale = Math.min(22, Math.max(6, Math.min(280 / Math.max(1, unitW), 170 / Math.max(1, unitH))));
  const ps = p * scale;
  const ls = l * scale;
  const ts = t * scale;

  const ox = 30;
  const oy = 22;

  // 3 Pasang Muka Kongruen:
  // Pasang 1: Depan & Belakang (p × l)
  // Pasang 2: Atas & Bawah (p × t)
  // Pasang 3: Kiri & Kanan (t × l)
  const faces = [
    { x: ts, y: 0, w: ps, h: ts, label: 'Atas', bg: '#fef3c7', stroke: '#d97706', text: '#92400e' },
    { x: 0, y: ts, w: ts, h: ls, label: 'Kiri', bg: '#d1fae5', stroke: '#059669', text: '#065f46' },
    { x: ts, y: ts, w: ps, h: ls, label: 'Depan', bg: '#dbeafe', stroke: '#2563eb', text: '#1e40af' },
    { x: ts + ps, y: ts, w: ts, h: ls, label: 'Kanan', bg: '#d1fae5', stroke: '#059669', text: '#065f46' },
    { x: ts + ps + ts, y: ts, w: ps, h: ls, label: 'Belakang', bg: '#dbeafe', stroke: '#2563eb', text: '#1e40af' },
    { x: ts, y: ts + ls, w: ps, h: ts, label: 'Bawah', bg: '#fef3c7', stroke: '#d97706', text: '#92400e' },
  ];

  let rects = '';
  faces.forEach(f => {
    rects += `
      <rect x="${ox + f.x}" y="${oy + f.y}" width="${f.w}" height="${f.h}" fill="${f.bg}" stroke="${f.stroke}" stroke-width="1.8" rx="2"/>
      <rect x="${ox + f.x + 2}" y="${oy + f.y + 2}" width="${f.w - 4}" height="${f.h - 4}" fill="none" stroke="${f.stroke}" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.5"/>
      <text x="${ox + f.x + f.w / 2}" y="${oy + f.y + f.h / 2 + 4}" text-anchor="middle" font-size="9.5" font-weight="bold" fill="${f.text}">${f.label}</text>
    `;
  });

  const totalW = 2 * ts + 2 * ps + ox * 2;
  const totalH = ts + ls + ts + oy * 2 + 30;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect x="2" y="2" width="${totalW - 4}" height="${totalH - 4}" rx="6" fill="#ffffff" stroke="#f1f5f9" stroke-width="1"/>
  ${rects}
  <!-- Label Dimensi Panjang (p), Lebar (l), dan Tinggi (t) -->
  <text x="${ox + ts + ps / 2}" y="${oy - 6}" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">p = ${p} ${unit}</text>
  <text x="${ox - 6}" y="${oy + ts + ls / 2 + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#0284c7">l = ${l} ${unit}</text>
  <text x="${ox + ts / 2}" y="${oy - 6}" text-anchor="middle" font-size="11" font-weight="bold" fill="#7c3aed">t = ${t} ${unit}</text>
  <text x="${totalW / 2}" y="${totalH - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">Jaring-jaring Balok (${p}×${l}×${t} ${unit})</text>
</svg>`;
}

/** Render Bidang Koordinat Kartesius 4 kuadran dengan titik berlabel */
export function renderKoordinatKartesiusSvg(params: { titik?: Array<{ x: number; y: number; label: string }>; xRange?: number; yRange?: number }): string {
  const titik = params.titik?.length ? params.titik : [{ x: 3, y: 4, label: 'P' }, { x: -2, y: 3, label: 'Q' }];
  const xRange = params.xRange || 6;
  const yRange = params.yRange || 6;

  const maxRange = Math.max(xRange, yRange, 1);
  const gridStep = Math.min(28, Math.max(14, Math.floor(145 / maxRange)));
  const w = Math.max(380, (xRange * gridStep + 35) * 2);
  const h = Math.max(340, (yRange * gridStep + 38) * 2);
  const cx = w / 2;
  const cy = h / 2 - 10;

  // Grid lines
  let grid = '';
  for (let i = -xRange; i <= xRange; i++) {
    const gx = cx + i * gridStep;
    const isAxis = i === 0;
    grid += `<line x1="${gx}" y1="${cy - yRange * gridStep}" x2="${gx}" y2="${cy + yRange * gridStep}" stroke="${isAxis ? '#0f172a' : '#e2e8f0'}" stroke-width="${isAxis ? 2 : 0.8}"/>`;
    if (!isAxis) {
      grid += `<line x1="${gx}" y1="${cy - 3}" x2="${gx}" y2="${cy + 3}" stroke="#0f172a" stroke-width="1.2"/>`;
      grid += `<text x="${gx}" y="${cy + 14}" text-anchor="middle" font-size="9" fill="#475569">${i}</text>`;
    }
  }
  for (let j = -yRange; j <= yRange; j++) {
    const gy = cy - j * gridStep;
    const isAxis = j === 0;
    grid += `<line x1="${cx - xRange * gridStep}" y1="${gy}" x2="${cx + xRange * gridStep}" y2="${gy}" stroke="${isAxis ? '#0f172a' : '#e2e8f0'}" stroke-width="${isAxis ? 2 : 0.8}"/>`;
    if (!isAxis) {
      grid += `<line x1="${cx - 3}" y1="${gy}" x2="${cx + 3}" y2="${gy}" stroke="#0f172a" stroke-width="1.2"/>`;
      grid += `<text x="${cx - 8}" y="${gy + 3.5}" text-anchor="end" font-size="9" fill="#475569">${j}</text>`;
    }
  }

  // Quadrant Labels (Subtle pedagogical watermark)
  const qPad = 12;
  const qRight = cx + xRange * gridStep - qPad;
  const qLeft = cx - xRange * gridStep + qPad;
  const qTop = cy - yRange * gridStep + 18;
  const qBottom = cy + yRange * gridStep - 10;

  const quadrants = `
    <text x="${qRight}" y="${qTop}" text-anchor="end" font-size="9.5" font-weight="bold" fill="#94a3b8" fill-opacity="0.45">Kuadran I (+,+)</text>
    <text x="${qLeft}" y="${qTop}" text-anchor="start" font-size="9.5" font-weight="bold" fill="#94a3b8" fill-opacity="0.45">Kuadran II (-,+)</text>
    <text x="${qLeft}" y="${qBottom}" text-anchor="start" font-size="9.5" font-weight="bold" fill="#94a3b8" fill-opacity="0.45">Kuadran III (-,-)</text>
    <text x="${qRight}" y="${qBottom}" text-anchor="end" font-size="9.5" font-weight="bold" fill="#94a3b8" fill-opacity="0.45">Kuadran IV (+,-)</text>
  `;

  // Axis Labels & Arrowheads
  const axisExt = 16;
  const axisExtras = `
    <!-- Axis arrows -->
    <polygon points="${cx + xRange * gridStep + axisExt},${cy} ${cx + xRange * gridStep + axisExt - 8},${cy - 4} ${cx + xRange * gridStep + axisExt - 8},${cy + 4}" fill="#0f172a"/>
    <polygon points="${cx},${cy - yRange * gridStep - axisExt} ${cx - 4},${cy - yRange * gridStep - axisExt + 8} ${cx + 4},${cy - yRange * gridStep - axisExt + 8}" fill="#0f172a"/>
    <!-- Axis Labels -->
    <text x="${cx + xRange * gridStep + axisExt + 8}" y="${cy + 4}" font-size="12" font-weight="bold" fill="#0f172a">X</text>
    <text x="${cx + 8}" y="${cy - yRange * gridStep - axisExt - 2}" font-size="12" font-weight="bold" fill="#0f172a">Y</text>
    <text x="${cx - 10}" y="${cy + 14}" font-size="9.5" font-weight="600" fill="#64748b">O</text>
  `;

  // Plot points
  const pointColors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed'];
  let points = '';
  titik.forEach((pt, i) => {
    const px = cx + pt.x * gridStep;
    const py = cy - pt.y * gridStep;
    const color = pointColors[i % pointColors.length];

    // Projection lines to X and Y axes
    points += `<line x1="${px}" y1="${py}" x2="${px}" y2="${cy}" stroke="${color}" stroke-width="1.2" stroke-dasharray="3,3"/>`;
    points += `<line x1="${px}" y1="${py}" x2="${cx}" y2="${py}" stroke="${color}" stroke-width="1.2" stroke-dasharray="3,3"/>`;

    // Axis projection ticks
    points += `<circle cx="${px}" cy="${cy}" r="2.5" fill="${color}"/>`;
    points += `<circle cx="${cx}" cy="${py}" r="2.5" fill="${color}"/>`;

    // Glowing point halo & core
    points += `<circle cx="${px}" cy="${py}" r="7" fill="${color}" fill-opacity="0.2"/>`;
    points += `<circle cx="${px}" cy="${py}" r="4.5" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>`;

    // Smart label positioning with background pill badge (clamped within canvas)
    const labelStr = `${pt.label}(${pt.x},${pt.y})`;
    const badgeW = Math.max(36, labelStr.length * 7 + 8);
    const badgeH = 18;
    const offsetX = pt.x >= 0 ? 8 : -(badgeW + 8);
    const offsetY = pt.y >= 0 ? -badgeH - 4 : 6;
    const badgeX = Math.max(6, Math.min(w - badgeW - 6, px + offsetX));
    const badgeY = Math.max(6, Math.min(h - badgeH - 24, py + offsetY));

    points += `
      <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="4" fill="#ffffff" stroke="${color}" stroke-width="1" stroke-opacity="0.8"/>
      <text x="${badgeX + badgeW / 2}" y="${badgeY + 12.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">${escapeXml(labelStr)}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="${w}" height="${h}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  ${quadrants}
  ${grid}
  ${axisExtras}
  ${points}
  <text x="${w / 2}" y="${h - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">Bidang Koordinat Kartesius</text>
</svg>`;
}

/** Render Simetri Lipat pada bangun datar */
export function renderSimetriLipatSvg(params: { bangun?: string; jumlahGaris?: number }): string {
  const bangun = (params.bangun || 'persegi').toLowerCase();
  const cx = 180;
  const cy = 120;

  let shape = '';
  let lines = '';
  let labelBangun = '';
  let garis = 0;

  if (bangun.includes('persegi') && !bangun.includes('panjang')) {
    const s = 100;
    shape = `<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" fill="#dbeafe" stroke="#1e40af" stroke-width="2.5" rx="2"/>`;
    // 4 garis simetri: vertikal, horizontal, 2 diagonal
    lines += `<line x1="${cx}" y1="${cy - s / 2 - 10}" x2="${cx}" y2="${cy + s / 2 + 10}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx - s / 2 - 10}" y1="${cy}" x2="${cx + s / 2 + 10}" y2="${cy}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx - s / 2 - 8}" y1="${cy - s / 2 - 8}" x2="${cx + s / 2 + 8}" y2="${cy + s / 2 + 8}" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx + s / 2 + 8}" y1="${cy - s / 2 - 8}" x2="${cx - s / 2 - 8}" y2="${cy + s / 2 + 8}" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    garis = 4;
    labelBangun = 'Persegi';
  } else if (bangun.includes('panjang')) {
    const pw = 140;
    const ph = 80;
    shape = `<rect x="${cx - pw / 2}" y="${cy - ph / 2}" width="${pw}" height="${ph}" fill="#d1fae5" stroke="#047857" stroke-width="2.5" rx="2"/>`;
    lines += `<line x1="${cx}" y1="${cy - ph / 2 - 10}" x2="${cx}" y2="${cy + ph / 2 + 10}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx - pw / 2 - 10}" y1="${cy}" x2="${cx + pw / 2 + 10}" y2="${cy}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    garis = 2;
    labelBangun = 'Persegi Panjang';
  } else if (bangun.includes('sama_sisi') || bangun.includes('sama sisi') || bangun.includes('segitiga')) {
    const s = 120;
    const hh = Math.round(s * 0.866);
    shape = `<polygon points="${cx},${cy - hh / 2} ${cx - s / 2},${cy + hh / 2} ${cx + s / 2},${cy + hh / 2}" fill="#fef3c7" stroke="#b45309" stroke-width="2.5"/>`;
    lines += `<line x1="${cx}" y1="${cy - hh / 2 - 10}" x2="${cx}" y2="${cy + hh / 2 + 10}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx - s / 2 - 5}" y1="${cy + hh / 2 + 3}" x2="${cx + s / 4 + 5}" y2="${cy - hh / 4 - 5}" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx + s / 2 + 5}" y1="${cy + hh / 2 + 3}" x2="${cx - s / 4 - 5}" y2="${cy - hh / 4 - 5}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    garis = 3;
    labelBangun = 'Segitiga Sama Sisi';
  } else if (bangun.includes('lingkaran')) {
    shape = `<circle cx="${cx}" cy="${cy}" r="60" fill="#fce7f3" stroke="#be185d" stroke-width="2.5"/>`;
    // Lingkaran punya ∞ simetri, gambar 4 contoh
    lines += `<line x1="${cx}" y1="${cy - 68}" x2="${cx}" y2="${cy + 68}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx - 68}" y1="${cy}" x2="${cx + 68}" y2="${cy}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx - 48}" y1="${cy - 48}" x2="${cx + 48}" y2="${cy + 48}" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx + 48}" y1="${cy - 48}" x2="${cx - 48}" y2="${cy + 48}" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="6,4"/>`;
    garis = -1; // tak terhingga
    labelBangun = 'Lingkaran';
  } else if (bangun.includes('belah_ketupat') || bangun.includes('belah ketupat')) {
    shape = `<polygon points="${cx},${cy - 60} ${cx + 45},${cy} ${cx},${cy + 60} ${cx - 45},${cy}" fill="#e0e7ff" stroke="#4338ca" stroke-width="2.5"/>`;
    lines += `<line x1="${cx}" y1="${cy - 68}" x2="${cx}" y2="${cy + 68}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    lines += `<line x1="${cx - 53}" y1="${cy}" x2="${cx + 53}" y2="${cy}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    garis = 2;
    labelBangun = 'Belah Ketupat';
  } else {
    // Default: persegi
    const s = 100;
    shape = `<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" fill="#dbeafe" stroke="#1e40af" stroke-width="2.5" rx="2"/>`;
    lines += `<line x1="${cx}" y1="${cy - s / 2 - 10}" x2="${cx}" y2="${cy + s / 2 + 10}" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="6,4"/>`;
    garis = params.jumlahGaris || 1;
    labelBangun = 'Bangun';
  }

  const garisText = garis === -1 ? '∞ (tak terhingga)' : String(garis);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="360" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="180" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">Sumbu Simetri Lipat</text>
  ${shape}
  ${lines}
  <text x="180" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Garis putus-putus menunjukkan sumbu simetri lipat</text>
</svg>`;
}

/** Render Bangun Gabungan bentuk L atau T dengan dimensi per segmen */
export function renderBangunGabunganSvg(params: { bentuk?: string; segmen?: Array<{ p: number; l: number }>; unit?: string }): string {
  const bentuk = (params.bentuk || 'L').toUpperCase();
  const unit = params.unit || 'cm';
  const seg = params.segmen?.length ? params.segmen : [{ p: 10, l: 4 }, { p: 6, l: 4 }];

  // Skala adaptif
  const maxDimW = Math.max(seg[0]?.p || 10, seg[1]?.p || 6, 1);
  const totalDimH = (seg[0]?.l || 4) + (seg[1]?.l || 4);
  const scale = Math.min(18, Math.max(6, Math.min(220 / maxDimW, 140 / Math.max(1, totalDimH))));
  const ox = 50;
  const oy = 30;

  if (bentuk === 'T') {
    const topW = (seg[0]?.p || 12) * scale;
    const topH = (seg[0]?.l || 3) * scale;
    const botW = (seg[1]?.p || 4) * scale;
    const botH = (seg[1]?.l || 6) * scale;
    const botX = ox + (topW - botW) / 2;

    const w = topW + ox * 2;
    const h = topH + botH + oy * 2 + 30;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ede9fe"/>
        <stop offset="100%" stop-color="#c4b5fd"/>
      </linearGradient>
    </defs>
    <!-- Top bar -->
    <rect x="${ox}" y="${oy}" width="${topW}" height="${topH}" fill="url(#bgGrad)" stroke="#5b21b6" stroke-width="2"/>
    <!-- Bottom bar (centered) -->
    <rect x="${botX}" y="${oy + topH}" width="${botW}" height="${botH}" fill="url(#bgGrad)" stroke="#5b21b6" stroke-width="2"/>

    <!-- Dimensi atas -->
    <text x="${ox + topW / 2}" y="${oy - 8}" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">${seg[0]?.p || 12} ${unit}</text>
    <text x="${ox - 6}" y="${oy + topH / 2 + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#0284c7">${seg[0]?.l || 3} ${unit}</text>
    <!-- Dimensi bawah -->
    <text x="${botX + botW + 6}" y="${oy + topH + botH / 2 + 4}" font-size="11" font-weight="bold" fill="#0284c7">${seg[1]?.l || 6} ${unit}</text>
    <text x="${botX + botW / 2}" y="${oy + topH + botH + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">${seg[1]?.p || 4} ${unit}</text>

    <text x="${w / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#64748b">Bangun Gabungan Bentuk T</text>
  </svg>`;
  }

  // Default: Bentuk L
  const topW = (seg[0]?.p || 10) * scale;
  const topH = (seg[0]?.l || 4) * scale;
  const botW = (seg[1]?.p || 6) * scale;
  const botH = (seg[1]?.l || 4) * scale;

  const totalW = topW + ox * 2;
  const totalH = topH + botH + oy * 2 + 30;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="bgGradL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#93c5fd"/>
    </linearGradient>
  </defs>
  <!-- Top (full width) -->
  <rect x="${ox}" y="${oy}" width="${topW}" height="${topH}" fill="url(#bgGradL)" stroke="#1e40af" stroke-width="2"/>
  <!-- Bottom (shorter, aligned left) -->
  <rect x="${ox}" y="${oy + topH}" width="${botW}" height="${botH}" fill="url(#bgGradL)" stroke="#1e40af" stroke-width="2"/>

  <!-- Dimensi -->
  <text x="${ox + topW / 2}" y="${oy - 8}" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">${seg[0]?.p || 10} ${unit}</text>
  <text x="${ox - 6}" y="${oy + topH / 2 + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#0284c7">${seg[0]?.l || 4} ${unit}</text>
  <text x="${ox + botW / 2}" y="${oy + topH + botH + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">${seg[1]?.p || 6} ${unit}</text>
  <text x="${ox + botW + 6}" y="${oy + topH + botH / 2 + 4}" font-size="11" font-weight="bold" fill="#0284c7">${seg[1]?.l || 4} ${unit}</text>

  <text x="${totalW / 2}" y="${totalH - 6}" text-anchor="middle" font-size="11" fill="#64748b">Bangun Gabungan Bentuk L</text>
</svg>`;
}

export function renderPerisaiPancasilaSvg(params: PerisaiPancasilaParams): string {
  const silaParam = String(params.sila || params.pointer || '1').toLowerCase();
  const labelChar = params.label || 'X';

  let targetSila = 1;
  if (silaParam === '1' || silaParam.includes('bintang') || silaParam.includes('ketuhanan')) targetSila = 1;
  else if (silaParam === '2' || silaParam.includes('rantai') || silaParam.includes('kemanusiaan')) targetSila = 2;
  else if (silaParam === '3' || silaParam.includes('beringin') || silaParam.includes('persatuan')) targetSila = 3;
  else if (silaParam === '4' || silaParam.includes('banteng') || silaParam.includes('kerakyatan')) targetSila = 4;
  else if (silaParam === '5' || silaParam.includes('padi') || silaParam.includes('kapas') || silaParam.includes('keadilan')) targetSila = 5;

  const targetCoords: Record<number, { x: number, y: number, bx: number, by: number }> = {
    1: { x: 190, y: 175, bx: 190, by: 120 },
    2: { x: 250, y: 245, bx: 320, by: 250 },
    3: { x: 250, y: 110, bx: 320, by: 105 },
    4: { x: 130, y: 110, bx: 60, by: 105 },
    5: { x: 130, y: 245, bx: 60, by: 250 }
  };

  const target = targetCoords[targetSila] || targetCoords[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 370" width="380" height="370" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <clipPath id="shieldOuterClip">
      <path d="M 70,35 L 310,35 Q 318,160 285,240 Q 240,310 190,335 Q 140,310 95,240 Q 62,160 70,35 Z"/>
    </clipPath>
    <marker id="arrPerisai" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <rect width="380" height="340" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Perisai Garuda Pancasila</text>

  <!-- KONTUR PERISAI DAN RUANG 4 BAGIAN -->
  <g clip-path="url(#shieldOuterClip)">
    <!-- Ruang Kiri Atas: Merah (Sila 4 - Banteng) -->
    <rect x="70" y="35" width="120" height="140" fill="#dc2626"/>
    <!-- Ruang Kanan Atas: Putih (Sila 3 - Beringin) -->
    <rect x="190" y="35" width="120" height="140" fill="#ffffff"/>
    <!-- Ruang Kiri Bawah: Putih (Sila 5 - Padi Kapas) -->
    <rect x="70" y="175" width="120" height="160" fill="#ffffff"/>
    <!-- Ruang Kanan Bawah: Merah (Sila 2 - Rantai) -->
    <rect x="190" y="175" width="120" height="160" fill="#dc2626"/>

    <!-- Garis Tebal Khatulistiwa di Tengah -->
    <rect x="70" y="170" width="240" height="10" fill="#0f172a"/>

    <!-- SIMBOL SILA 4: KEPALA BANTENG (Kiri Atas, x=130, y=110) -->
    <g transform="translate(130, 105)">
      <path d="M -22,-14 C -26,-28 -14,-32 0,-24 C 14,-32 26,-28 22,-14 C 15,-20 8,-20 0,-16 C -8,-20 -15,-20 -22,-14 Z" fill="#1e293b"/>
      <path d="M -16,-12 L 16,-12 L 12,12 L -12,12 Z" fill="#0f172a"/>
      <ellipse cx="-18" cy="-6" rx="6" ry="3" transform="rotate(-20 -18 -6)" fill="#1e293b"/>
      <ellipse cx="18" cy="-6" rx="6" ry="3" transform="rotate(20 18 -6)" fill="#1e293b"/>
      <rect x="-8" y="4" width="16" height="8" rx="3" fill="#cbd5e1"/>
      <circle cx="-3" cy="8" r="1.5" fill="#0f172a"/>
      <circle cx="3" cy="8" r="1.5" fill="#0f172a"/>
      <polygon points="-8,-4 -4,-2 -8,0" fill="#ffffff"/>
      <polygon points="8,-4 4,-2 8,0" fill="#ffffff"/>
    </g>

    <!-- SIMBOL SILA 3: POHON BERINGIN (Kanan Atas, x=250, y=110) -->
    <g transform="translate(250, 110)">
      <path d="M -6,18 L -3,0 L 3,0 L 6,18 L 2,18 L 0,6 L -2,18 Z" fill="#78350f"/>
      <line x1="-12" y1="4" x2="-10" y2="16" stroke="#92400e" stroke-width="1.5"/>
      <line x1="12" y1="4" x2="10" y2="16" stroke="#92400e" stroke-width="1.5"/>
      <circle cx="0" cy="-12" r="14" fill="#15803d"/>
      <circle cx="-14" cy="-4" r="11" fill="#16a34a"/>
      <circle cx="14" cy="-4" r="11" fill="#16a34a"/>
      <circle cx="-8" cy="4" r="9" fill="#15803d"/>
      <circle cx="8" cy="4" r="9" fill="#15803d"/>
    </g>

    <!-- SIMBOL SILA 5: PADI DAN KAPAS (Kiri Bawah, x=130, y=245) -->
    <g transform="translate(130, 245)">
      <path d="M -6,22 Q -12,4 -16,-16" fill="none" stroke="#ca8a04" stroke-width="1.8"/>
      <ellipse cx="-16" cy="-16" rx="2.5" ry="5" transform="rotate(-30 -16 -16)" fill="#eab308"/>
      <ellipse cx="-14" cy="-7" rx="2.5" ry="5" transform="rotate(-30 -14 -7)" fill="#eab308"/>
      <ellipse cx="-11" cy="2" rx="2.5" ry="5" transform="rotate(-30 -11 2)" fill="#eab308"/>
      <ellipse cx="-7" cy="11" rx="2.5" ry="5" transform="rotate(-30 -7 11)" fill="#eab308"/>
      <path d="M 4,22 Q 10,4 16,-16" fill="none" stroke="#16a34a" stroke-width="1.8"/>
      <circle cx="16" cy="-16" r="4.5" fill="#ffffff" stroke="#10b981" stroke-width="1"/>
      <circle cx="13" cy="-5" r="4.5" fill="#ffffff" stroke="#10b981" stroke-width="1"/>
      <circle cx="9" cy="6" r="4.5" fill="#ffffff" stroke="#10b981" stroke-width="1"/>
    </g>

    <!-- SIMBOL SILA 2: RANTAI EMAS (Kanan Bawah, x=250, y=245) -->
    <g transform="translate(250, 245)">
      <ellipse cx="0" cy="0" rx="19" ry="14" fill="none" stroke="#f59e0b" stroke-width="3.5"/>
      <circle cx="-16" cy="0" r="4" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
      <rect x="-4" y="-16" width="8" height="7" rx="1.5" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
      <circle cx="16" cy="0" r="4" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
      <rect x="-4" y="9" width="8" height="7" rx="1.5" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
    </g>

    <!-- RUANG TENGAH (SILA 1): PERISAI KECIL HITAM & BINTANG EMAS -->
    <g transform="translate(190, 175)">
      <path d="M -26,-26 L 26,-26 Q 28,5 18,18 Q 0,30 0,30 Q 0,30 -18,18 Q -28,5 -26,-26 Z" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5"/>
      <polygon points="0,-16 4.5,-5 16,-5 7,2 10.5,13 0,6 -10.5,13 -7,2 -16,-5 -4.5,-5" fill="#facc15" stroke="#eab308" stroke-width="0.8"/>
    </g>
  </g>

  <!-- BINGKAI EMAS PERISAI UTAMA -->
  <path d="M 70,35 L 310,35 Q 318,160 285,240 Q 240,310 190,335 Q 140,310 95,240 Q 62,160 70,35 Z" fill="none" stroke="#f59e0b" stroke-width="6"/>
  <path d="M 73,38 L 307,38 Q 314,160 282,238 Q 238,307 190,331 Q 142,307 98,238 Q 66,160 73,38 Z" fill="none" stroke="#b45309" stroke-width="1.5"/>

  <!-- PENUNJUK TARGET (ZERO-SPOILER DENGAN BADGE HURUF X) -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="26" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-dasharray="4,3"/>
    <line x1="${target.bx}" y1="${target.by}" x2="${target.x}" y2="${target.y}" stroke="#e11d48" stroke-width="2.5" marker-end="url(#arrPerisai)"/>
    <circle cx="${target.bx}" cy="${target.by}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${target.bx}" y="${target.by + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>
  <text x="190" y="358" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan lambang yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

/**
 * 24. Render Sudut Antara Jarum Jam Pendek dan Panjang
 */
export function renderSudutJarumJamSvg(params: {
  jam?: number; // e.g. 3, 2, 4
  menit?: number; // 0
  label?: string;
}): string {
  const j = params.jam != null ? params.jam : 3;
  const m = params.menit != null ? params.menit : 0;
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 135;
  const r = 82;

  // Sudut jarum jam (0 derajat pada angka 12 / vertikal atas)
  const hourAngleDeg = (j % 12) * 30 + m * 0.5;
  const minAngleDeg = m * 6;

  const hRad = (hourAngleDeg - 90) * (Math.PI / 180);
  const mRad = (minAngleDeg - 90) * (Math.PI / 180);

  const hLen = 46;
  const mLen = 66;

  const hx = cx + hLen * Math.cos(hRad);
  const hy = cy + hLen * Math.sin(hRad);
  const mx = cx + mLen * Math.cos(mRad);
  const my = cy + mLen * Math.sin(mRad);

  // 12 Tanda Jam (Ticks) di sekeliling dial
  let hourTicks = '';
  for (let hr = 1; hr <= 12; hr++) {
    const angle = (hr * 30 - 90) * (Math.PI / 180);
    const isCardinal = hr % 3 === 0;
    const tLen = isCardinal ? 8 : 4;
    const tx1 = cx + (r - 2) * Math.cos(angle);
    const ty1 = cy + (r - 2) * Math.sin(angle);
    const tx2 = cx + (r - 2 - tLen) * Math.cos(angle);
    const ty2 = cy + (r - 2 - tLen) * Math.sin(angle);
    hourTicks += `<line x1="${tx1.toFixed(1)}" y1="${ty1.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" stroke="${isCardinal ? '#0f172a' : '#64748b'}" stroke-width="${isCardinal ? '2' : '1.2'}"/>`;
  }

  // Busur sudut antara dua jarum
  const arcR = 28;
  const startRad = Math.min(hRad, mRad);
  const endRad = Math.max(hRad, mRad);
  const diffDeg = Math.abs(hourAngleDeg - minAngleDeg);
  const acuteDeg = diffDeg > 180 ? 360 - diffDeg : diffDeg;
  const isLargeArc = (endRad - startRad > Math.PI) ? 1 : 0;

  const ax1 = cx + arcR * Math.cos(startRad);
  const ay1 = cy + arcR * Math.sin(startRad);
  const ax2 = cx + arcR * Math.cos(endRad);
  const ay2 = cy + arcR * Math.sin(endRad);

  // Titik tengah busur untuk callout X
  const midRad = (startRad + endRad) / 2;
  const tx = cx + (arcR + 24) * Math.cos(midRad);
  const ty = cy + (arcR + 24) * Math.sin(midRad);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Bezel Jam Baja Tahan Karat -->
    <linearGradient id="clockBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="30%" stop-color="#94a3b8"/>
      <stop offset="70%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <!-- Gradien Sektor Sudut Merah Muda -->
    <linearGradient id="angleSectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fee2e2"/>
      <stop offset="100%" stop-color="#fecdd3"/>
    </linearGradient>

    <!-- Drop Shadow Badge -->
    <filter id="badgeShdwJam" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- Frame Luar -->
  <rect x="2" y="2" width="376" height="256" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="190" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Sudut: Sudut Terkecil Antara Dua Jarum Jam</text>

  <!-- Bezel Jam Baja Stainless Steel -->
  <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="url(#clockBezelGrad)" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Piringan Jam Putih (Dial Face) -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="#f1f5f9" stroke-width="1"/>

  <!-- Ticks Jam & Menit -->
  ${hourTicks}

  <!-- Angka Jam Kardinal Utama (12, 3, 6, 9) -->
  <text x="${cx}" y="${cy - r + 20}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">12</text>
  <text x="${cx + r - 16}" y="${cy + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">3</text>
  <text x="${cx}" y="${cy + r - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">6</text>
  <text x="${cx - r + 16}" y="${cy + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">9</text>

  <!-- Busur Juring Sudut Terarsir -->
  <path d="M ${cx},${cy} L ${ax1.toFixed(1)},${ay1.toFixed(1)} A ${arcR},${arcR} 0 ${isLargeArc},1 ${ax2.toFixed(1)},${ay2.toFixed(1)} Z" fill="url(#angleSectorGrad)" stroke="#e11d48" stroke-width="1.6"/>

  <!-- Jarum Jam Pendek (Hour Hand) -->
  <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Jarum Menit Panjang (Minute Hand) -->
  <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Poros Tengah Jarum -->
  <circle cx="${cx}" cy="${cy}" r="5" fill="#dc2626" stroke="#ffffff" stroke-width="1.5"/>

  <!-- Callout Target X -->
  <g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)})" filter="url(#badgeShdwJam)">
    <circle cx="0" cy="0" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Kartu Info Waktu di Sisi Kanan (Bebas Tabrakan) -->
  <g transform="translate(292, 110)">
    <rect x="-36" y="-24" width="72" height="48" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="0" y="-7" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#64748b">Pukul</text>
    <text x="0" y="14" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">${String(j).padStart(2, '0')}.${String(m).padStart(2, '0')}</text>
  </g>

  <!-- Prompt Pertanyaan Pedagogis -->
  <text x="190" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Besar sudut terkecil yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...°</text>
</svg>`;
}

/**
 * 25. Render Jaring-jaring Limas Segiempat
 */
export function renderJaringLimasSegiempatSvg(params: {
  sisiAlas?: number;
  tinggiSegitiga?: number;
  label?: string;
}): string {
  const s = 60;
  const h = 55;
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 135;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 270" width="380" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Alas Persegi -->
    <linearGradient id="jaringLimasAlasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>

    <!-- Gradien Sisi Tegak Segitiga -->
    <linearGradient id="jaringLimasTriGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>

    <!-- Drop Shadow Badge -->
    <filter id="badgeShdwLimasNet" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- Frame Luar -->
  <rect x="2" y="2" width="376" height="266" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="190" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri 3D: Jaring-jaring Limas Segiempat</text>

  <!-- 4 Segitiga Selimut Mekar (Atas, Bawah, Kiri, Kanan) -->
  <polygon points="${cx - s / 2},${cy - s / 2} ${cx + s / 2},${cy - s / 2} ${cx},${cy - s / 2 - h}" fill="url(#jaringLimasTriGrad)" stroke="#d97706" stroke-width="1.8" stroke-linejoin="round"/>
  <polygon points="${cx - s / 2},${cy + s / 2} ${cx + s / 2},${cy + s / 2} ${cx},${cy + s / 2 + h}" fill="url(#jaringLimasTriGrad)" stroke="#d97706" stroke-width="1.8" stroke-linejoin="round"/>
  <polygon points="${cx - s / 2},${cy - s / 2} ${cx - s / 2},${cy + s / 2} ${cx - s / 2 - h},${cy}" fill="url(#jaringLimasTriGrad)" stroke="#d97706" stroke-width="1.8" stroke-linejoin="round"/>
  <polygon points="${cx + s / 2},${cy - s / 2} ${cx + s / 2},${cy + s / 2} ${cx + s / 2 + h},${cy}" fill="url(#jaringLimasTriGrad)" stroke="#d97706" stroke-width="1.8" stroke-linejoin="round"/>

  <!-- Garis Lipatan Putus-Putus pada Pertemuan Alas & Segitiga -->
  <line x1="${cx - s / 2}" y1="${cy - s / 2}" x2="${cx + s / 2}" y2="${cy - s / 2}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,3"/>
  <line x1="${cx - s / 2}" y1="${cy + s / 2}" x2="${cx + s / 2}" y2="${cy + s / 2}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,3"/>
  <line x1="${cx - s / 2}" y1="${cy - s / 2}" x2="${cx - s / 2}" y2="${cy + s / 2}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,3"/>
  <line x1="${cx + s / 2}" y1="${cy - s / 2}" x2="${cx + s / 2}" y2="${cy + s / 2}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,3"/>

  <!-- Alas Persegi Pusat -->
  <rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" fill="url(#jaringLimasAlasGrad)" stroke="#0284c7" stroke-width="2" rx="1"/>
  <text x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Alas</text>

  <!-- Garis Tinggi Segitiga Atas (Panduan Lipat) -->
  <line x1="${cx}" y1="${cy - s / 2}" x2="${cx}" y2="${cy - s / 2 - h}" stroke="#d97706" stroke-width="1" stroke-dasharray="3,2"/>

  <!-- Target Badge X pada Segitiga Sisi Tegak Atas -->
  <g transform="translate(${cx}, ${cy - s / 2 - h / 2 - 2})" filter="url(#badgeShdwLimasNet)">
    <circle cx="0" cy="0" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Kartu Spesifikasi Geometri di Kanan (Bebas Tabrakan) -->
  <g transform="translate(296, 100)">
    <rect x="-38" y="-35" width="76" height="70" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="0" y="-17" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Komposisi</text>
    <line x1="-28" y1="-9" x2="28" y2="-9" stroke="#e2e8f0" stroke-width="1"/>
    <text x="0" y="7" text-anchor="middle" font-size="9" fill="#475569">1 Alas Persegi</text>
    <text x="0" y="23" text-anchor="middle" font-size="9" fill="#475569">4 Sisi Segitiga</text>
  </g>

  <!-- Prompt Pertanyaan Pedagogis -->
  <text x="190" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian bangun sisi tegak yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 26. Render Jaring-jaring Limas Segitiga (Tetrahedron)
 */
export function renderJaringLimasSegitigaSvg(params: {
  label?: string;
}): string {
  const labelChar = params.label || 'X';
  const cx = 180;
  const cy = 135;
  const s = 65;
  const h = (s * Math.sqrt(3)) / 2; // ~56.3

  // Segitiga tengah menghadap ke atas
  const p1 = { x: cx, y: cy - (2 / 3) * h };
  const p2 = { x: cx - s / 2, y: cy + (1 / 3) * h };
  const p3 = { x: cx + s / 2, y: cy + (1 / 3) * h };

  // 3 Segitiga selubung terlipat keluar
  const topTip = { x: cx, y: cy - (2 / 3) * h - h };
  const leftTip = { x: cx - s, y: cy + (1 / 3) * h + h / 2 };
  const rightTip = { x: cx + s, y: cy + (1 / 3) * h + h / 2 };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 270" width="380" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="270" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri 3D: Jaring-jaring Limas Segitiga</text>

  <!-- Segitiga Alas Tengah -->
  <polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Alas</text>

  <!-- 3 Segitiga Selubung Terlipat Buka -->
  <polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${leftTip.x.toFixed(1)},${leftTip.y.toFixed(1)}" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
  <polygon points="${p1.x},${p1.y} ${p3.x},${p3.y} ${rightTip.x.toFixed(1)},${rightTip.y.toFixed(1)}" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
  <polygon points="${p2.x},${p2.y} ${p3.x},${p3.y} ${topTip.x.toFixed(1)},${(cy + (1 / 3) * h + h).toFixed(1)}" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>

  <!-- Target Badge X -->
  <circle cx="${cx}" cy="${(cy + (1 / 3) * h + h / 2).toFixed(1)}" r="11" fill="#e11d48"/>
  <text x="${cx}" y="${(cy + (1 / 3) * h + h / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Jaring-jaring bangun ruang yang ditunjukkan oleh gambar di atas adalah ...</text>
</svg>`;
}

/**
 * 27. Render Jaring-jaring Prisma Segitiga
 */
export function renderJaringPrismaSegitigaSvg(params: {
  label?: string;
}): string {
  const labelChar = params.label || 'X';

  const startX = 65;
  const startY = 100;
  const w = 70;
  const h = 60;
  const triH = 45;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 270" width="400" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <!-- Gradien Persegi Panjang Selubung -->
    <linearGradient id="prismaNetRectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>

    <!-- Gradien Alas Tengah -->
    <linearGradient id="prismaNetAlasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>

    <!-- Gradien Segitiga Penutup -->
    <linearGradient id="prismaNetTriGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>

    <!-- Drop Shadow Badge -->
    <filter id="badgeShdwPrismaNet" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- Frame Luar -->
  <rect x="2" y="2" width="396" height="266" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="200" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri 3D: Jaring-jaring Prisma Segitiga</text>

  <!-- 3 Persegi Panjang Selubung Berjejer -->
  <rect x="${startX}" y="${startY}" width="${w}" height="${h}" fill="url(#prismaNetRectGrad)" stroke="#334155" stroke-width="1.8" rx="2"/>
  <text x="${startX + w / 2}" y="${startY + h / 2 + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Sisi 1</text>

  <rect x="${startX + w}" y="${startY}" width="${w}" height="${h}" fill="url(#prismaNetAlasGrad)" stroke="#0284c7" stroke-width="2" rx="2"/>
  <text x="${startX + w + w / 2}" y="${startY + h / 2 + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Alas</text>

  <rect x="${startX + 2 * w}" y="${startY}" width="${w}" height="${h}" fill="url(#prismaNetRectGrad)" stroke="#334155" stroke-width="1.8" rx="2"/>
  <text x="${startX + 2 * w + w / 2}" y="${startY + h / 2 + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Sisi 2</text>

  <!-- Garis Lipatan Putus-Putus pada Sambungan Antar Persegi -->
  <line x1="${startX + w}" y1="${startY}" x2="${startX + w}" y2="${startY + h}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,3"/>
  <line x1="${startX + 2 * w}" y1="${startY}" x2="${startX + 2 * w}" y2="${startY + h}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,3"/>

  <!-- 2 Segitiga Penutup (Atas & Bawah pada persegi panjang tengah) -->
  <polygon points="${startX + w},${startY} ${startX + 2 * w},${startY} ${startX + w + w / 2},${startY - triH}" fill="url(#prismaNetTriGrad)" stroke="#d97706" stroke-width="1.8" stroke-linejoin="round"/>
  <polygon points="${startX + w},${startY + h} ${startX + 2 * w},${startY + h} ${startX + w + w / 2},${startY + h + triH}" fill="url(#prismaNetTriGrad)" stroke="#d97706" stroke-width="1.8" stroke-linejoin="round"/>

  <!-- Garis Lipatan Putus-Putus pada Segitiga -->
  <line x1="${startX + w}" y1="${startY}" x2="${startX + 2 * w}" y2="${startY}" stroke="#d97706" stroke-width="1.8" stroke-dasharray="4,3"/>
  <line x1="${startX + w}" y1="${startY + h}" x2="${startX + 2 * w}" y2="${startY + h}" stroke="#d97706" stroke-width="1.8" stroke-dasharray="4,3"/>

  <!-- Target Badge X pada Segitiga Penutup Atas -->
  <g transform="translate(${startX + w + w / 2}, ${startY - triH / 2 - 2})" filter="url(#badgeShdwPrismaNet)">
    <circle cx="0" cy="0" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Kartu Spesifikasi Bangun di Sisi Kanan (Bebas Tabrakan) -->
  <g transform="translate(332, 125)">
    <rect x="-42" y="-38" width="84" height="76" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="0" y="-20" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Komponen</text>
    <line x1="-32" y1="-12" x2="32" y2="-12" stroke="#e2e8f0" stroke-width="1"/>
    <text x="0" y="4" text-anchor="middle" font-size="9" fill="#475569">3 Persegi Pjg</text>
    <text x="0" y="20" text-anchor="middle" font-size="9" fill="#475569">2 Segitiga</text>
  </g>

  <!-- Prompt Pertanyaan Pedagogis Bawah -->
  <text x="200" y="254" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bentuk bangun datar yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 28. Render Keliling Bangun Datar Gabungan (Persegi Panjang + Setengah Lingkaran)
 */
export function renderKelilingGabunganSvg(params: {
  panjang?: number; // 20 cm
  lebar?: number; // 14 cm (diameter = 14, r = 7)
  unit?: string;
  label?: string;
}): string {
  const p = params.panjang || 20;
  const l = params.lebar || 14;
  const unit = params.unit || 'cm';
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 135;
  const rectW = 140;
  const rectH = 80;
  const r = rectH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri 2D: Keliling &amp; Luas Bangun Datar Gabungan</text>

  <!-- Bagian Persegi Panjang Kiri -->
  <path d="M ${cx - rectW / 2},${cy - rectH / 2} L ${cx + rectW / 2},${cy - rectH / 2} L ${cx + rectW / 2},${cy + rectH / 2} L ${cx - rectW / 2},${cy + rectH / 2} Z" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2"/>

  <!-- Garis Pemisah Putus-putus antara Persegi Panjang dan Setengah Lingkaran -->
  <line x1="${cx + rectW / 2}" y1="${cy - rectH / 2}" x2="${cx + rectW / 2}" y2="${cy + rectH / 2}" stroke="#64748b" stroke-width="1.8" stroke-dasharray="4,3"/>

  <!-- Setengah Lingkaran Kanan -->
  <path d="M ${cx + rectW / 2},${cy - rectH / 2} A ${r},${r} 0 0,1 ${cx + rectW / 2},${cy + rectH / 2} Z" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>

  <!-- Label Dimensi Panjang (Bawah) -->
  <line x1="${cx - rectW / 2}" y1="${cy + rectH / 2 + 18}" x2="${cx + rectW / 2}" y2="${cy + rectH / 2 + 18}" stroke="#475569" stroke-width="1.2"/>
  <text x="${cx}" y="${cy + rectH / 2 + 32}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">p = ${p} ${escapeXml(unit)}</text>

  <!-- Label Dimensi Lebar / Diameter (Kiri) -->
  <line x1="${cx - rectW / 2 - 18}" y1="${cy - rectH / 2}" x2="${cx - rectW / 2 - 18}" y2="${cy + rectH / 2}" stroke="#475569" stroke-width="1.2"/>
  <text x="${cx - rectW / 2 - 25}" y="${cy + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#0f172a">l = ${l} ${escapeXml(unit)}</text>

  <!-- Target Badge X pada setengah lingkaran -->
  <g transform="translate(${cx + rectW / 2 + r / 2}, ${cy})">
    <circle cx="0" cy="0" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="200" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Hitunglah keliling bangun gabungan di atas (${escapeXml(unit)})!</text>
</svg>`;
}

/**
 * 29. Render Unsur-unsur Lingkaran Lengkap (Tembereng, Juring, Tali Busur, Apotema)
 */
export function renderLingkaranTemberengSvg(params: {
  pointer?: 'juring' | 'tembereng' | 'tali_busur' | 'apotema' | 'busur';
  label?: string;
}): string {
  const pointer = params.pointer || 'tembereng';
  const labelChar = params.label || 'X';

  const cx = 170;
  const cy = 135;
  const r = 80;

  // Sudut tali busur A ke B (sudut 0 s.d. 90 derajat)
  const aX = cx + r * Math.cos(-Math.PI / 4);
  const aY = cy + r * Math.sin(-Math.PI / 4);
  const bX = cx + r * Math.cos(Math.PI / 4);
  const bY = cy + r * Math.sin(Math.PI / 4);

  // Titik tengah tali busur untuk apotema
  const midX = (aX + bX) / 2;
  const midY = (aY + bY) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri 2D: Unsur-unsur Lingkaran</text>

  <!-- Lingkaran Luar -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>

  <!-- Juring Lingkaran Kiri Atas (Kuning Muda) -->
  <path d="M ${cx},${cy} L ${cx},${cy - r} A ${r},${r} 0 0,0 ${cx - r},${cy} Z" fill="#fef9c3" stroke="#eab308" stroke-width="1.5"/>

  <!-- Tembereng Kanan (Daerah antara tali busur AB dan busur AB) -->
  <path d="M ${aX},${aY} A ${r},${r} 0 0,1 ${bX},${bY} Z" fill="#fecaca" stroke="#ef4444" stroke-width="2"/>

  <!-- Tali Busur AB -->
  <line x1="${aX}" y1="${aY}" x2="${bX}" y2="${bY}" stroke="#dc2626" stroke-width="2.5"/>

  <!-- Garis Jari-jari r ke A dan B -->
  <line x1="${cx}" y1="${cy}" x2="${aX}" y2="${aY}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,2"/>
  <line x1="${cx}" y1="${cy}" x2="${bX}" y2="${bY}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,2"/>

  <!-- Garis Apotema (Pusat ke Titik Tengah Tali Busur) -->
  <line x1="${cx}" y1="${cy}" x2="${midX}" y2="${midY}" stroke="#0284c7" stroke-width="2.5"/>
  <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0f172a"/>
  <text x="${cx - 8}" y="${cy + 14}" font-size="10" font-weight="bold" fill="#0f172a">O</text>

  <!-- Titik A dan B -->
  <text x="${aX + 8}" y="${aY}" font-size="10.5" font-weight="bold" fill="#0f172a">A</text>
  <text x="${bX + 8}" y="${bY + 6}" font-size="10.5" font-weight="bold" fill="#0f172a">B</text>

  <!-- Callout Target X -->
  <g transform="translate(${cx + r + 24}, ${cy})">
    <circle cx="0" cy="0" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Legenda Sisi Kanan -->
  <g transform="translate(305, 55)">
    <rect width="105" height="125" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="52.5" y="18" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0f172a">Unsur</text>
    <text x="10" y="40" font-size="9.5" fill="#334155">• Jari-jari (r)</text>
    <text x="10" y="58" font-size="9.5" fill="#334155">• Diameter (d)</text>
    <text x="10" y="76" font-size="9.5" fill="#334155">• Busur</text>
    <text x="10" y="94" font-size="9.5" fill="#334155">• Tali Busur</text>
    <text x="10" y="112" font-size="9.5" fill="#334155">• Apotema</text>
  </g>

  <text x="210" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Unsur lingkaran yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 30. Render Koordinat Poligon Bangun Datar (Bidang Kartesius Kuadran 1)
 */
export function renderKoordinatPoligonSvg(params: {
  bentuk?: 'segitiga' | 'trapesium' | 'jajar_genjang';
  label?: string;
}): string {
  const bentuk = params.bentuk || 'trapesium';
  const labelChar = params.label || 'X';

  const ox = 70;
  const oy = 200;
  const scale = 24;

  // Koordinat trapesium siku-siku: A(1,1), B(7,1), C(5,5), D(1,5)
  const pts = [
    { name: 'A', x: 1, y: 1 },
    { name: 'B', x: 7, y: 1 },
    { name: 'C', x: 5, y: 5 },
    { name: 'D', x: 1, y: 5 }
  ];

  let gridLines = '';
  for (let i = 0; i <= 8; i++) {
    const x = ox + i * scale;
    const y = oy - i * scale;
    gridLines += `<line x1="${x}" y1="${oy}" x2="${x}" y2="${oy - 8 * scale}" stroke="#e2e8f0" stroke-width="1"/>`;
    gridLines += `<line x1="${ox}" y1="${y}" x2="${ox + 8 * scale}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    gridLines += `<text x="${x}" y="${oy + 14}" text-anchor="middle" font-size="9" fill="#64748b">${i}</text>`;
    if (i > 0) {
      gridLines += `<text x="${ox - 8}" y="${y + 3}" text-anchor="end" font-size="9" fill="#64748b">${i}</text>`;
    }
  }

  const polyPoints = pts.map(p => `${ox + p.x * scale},${oy - p.y * scale}`).join(' ');

  let markers = '';
  pts.forEach(p => {
    const px = ox + p.x * scale;
    const py = oy - p.y * scale;
    const isTarget = p.name === 'C';

    markers += `
      <circle cx="${px}" cy="${py}" r="${isTarget ? '5' : '4'}" fill="${isTarget ? '#dc2626' : '#1d4ed8'}"/>
      <text x="${px + 8}" y="${py - 6}" font-size="10.5" font-weight="bold" fill="${isTarget ? '#dc2626' : '#0f172a'}">${p.name} (${p.x}, ${p.y})</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri &amp; Aljabar: Koordinat Titik Poligon</text>

  <!-- Garis Kisi Bidang Kartesius -->
  ${gridLines}

  <!-- Sumbu X & Sumbu Y -->
  <line x1="${ox}" y1="${oy}" x2="${ox + 8.5 * scale}" y2="${oy}" stroke="#0f172a" stroke-width="2"/>
  <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - 8.5 * scale}" stroke="#0f172a" stroke-width="2"/>
  <text x="${ox + 8.5 * scale + 6}" y="${oy + 4}" font-size="10" font-weight="bold" fill="#0f172a">X</text>
  <text x="${ox}" y="${oy - 8.5 * scale - 6}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Y</text>

  <!-- Poligon Bangun Datar -->
  <polygon points="${polyPoints}" fill="#bfdbfe" fill-opacity="0.6" stroke="#2563eb" stroke-width="2"/>

  <!-- Titik Sudut A, B, C, D -->
  ${markers}

  <!-- Callout Target X -->
  <g transform="translate(350, 110)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="210" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Koordinat titik C pada bangun trapesium di atas adalah ...</text>
</svg>`;
}

/**
 * 31. Render Transformasi Geometri: Refleksi (Pencerminan)
 */
export function renderTransformasiRefleksiSvg(params: {
  label?: string;
}): string {
  const labelChar = params.label || 'X';
  const cx = 200;

  // Segitiga asli di kiri
  const origPts = '110,90 160,150 110,150';
  // Bayangan cermin di kanan
  const reflPts = '290,90 240,150 290,150';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Transformasi Geometri: Pencerminan (Refleksi)</text>

  <!-- Garis Cermin Vertikal di Tengah -->
  <line x1="${cx}" y1="45" x2="${cx}" y2="205" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="${cx}" y="40" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#dc2626">Cermin</text>

  <!-- Bangun Asli (Kiri) -->
  <polygon points="${origPts}" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
  <text x="125" y="135" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#1e40af">Benda</text>

  <!-- Bangun Bayangan (Kanan) -->
  <polygon points="${reflPts}" fill="#fecaca" stroke="#dc2626" stroke-width="2" stroke-dasharray="4,2"/>
  <text x="275" y="135" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#991b1b">Bayangan</text>

  <!-- Garis Bantu Penghubung Titik Sehadap -->
  <line x1="110" y1="90" x2="290" y2="90" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="160" y1="150" x2="240" y2="150" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3"/>

  <!-- Callout Target X -->
  <g transform="translate(265, 80)">
    <circle cx="0" cy="0" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="200" y="234" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Sifat bayangan hasil pencerminan terhadap garis cermin adalah ...</text>
</svg>`;
}

/**
 * 32. Render Transformasi Geometri: Translasi (Pergeseran)
 */
export function renderTransformasiTranslasiSvg(params: {
  geserX?: number; // 4 satuan
  geserY?: number; // 2 satuan
  label?: string;
}): string {
  const dx = params.geserX != null ? params.geserX : 4;
  const dy = params.geserY != null ? params.geserY : 2;
  const labelChar = params.label || 'X';

  const ox = 80;
  const oy = 180;
  const s = 22;

  // Bangun awal: Persegi panjang di (1,1) ukuran 3x2
  const x1 = ox + 1 * s;
  const y1 = oy - 3 * s;
  const bw = 3 * s;
  const bh = 2 * s;

  // Bangun akhir: bergeser dx ke kanan, dy ke atas
  const x2 = ox + (1 + dx) * s;
  const y2 = oy - (3 + dy) * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrTrans" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <rect width="420" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Transformasi Geometri: Pergeseran (Translasi)</text>

  <!-- Kotak Awal A -->
  <rect x="${x1}" y="${y1}" width="${bw}" height="${bh}" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <text x="${x1 + bw / 2}" y="${y1 + bh / 2 + 4}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">Awal (A)</text>

  <!-- Kotak Akhir B -->
  <rect x="${x2}" y="${y2}" width="${bw}" height="${bh}" rx="3" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="${x2 + bw / 2}" y="${y2 + bh / 2 + 4}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#15803d">Akhir (A')</text>

  <!-- Panah Vektor Translasi dari Pusat A ke Pusat A' -->
  <line x1="${x1 + bw / 2}" y1="${y1 + bh / 2}" x2="${x2 + bw / 2}" y2="${y2 + bh / 2}" stroke="#e11d48" stroke-width="2.5" marker-end="url(#arrTrans)"/>

  <!-- Keterangan Translasi di Sisi Kanan -->
  <g transform="translate(305, 80)">
    <rect width="95" height="85" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="47.5" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Vektor Geser</text>
    <text x="14" y="42" font-size="9" fill="#334155">• Kanan: ${dx} petak</text>
    <text x="14" y="60" font-size="9" fill="#334155">• Atas: ${dy} petak</text>
    <rect x="14" y="68" width="67" height="14" rx="2" fill="#eff6ff"/>
    <text x="47.5" y="78" text-anchor="middle" font-size="8" font-weight="bold" fill="#1d4ed8">T = (${dx}, ${dy})</text>
  </g>

  <text x="210" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Besar pergeseran titik bangun dari posisi awal ke posisi akhir adalah ...</text>
</svg>`;
}

/**
 * 33. Render Segi Enam Beraturan (Regular Hexagon)
 */
export function renderSegiEnamBeraturanSvg(params: {
  sisi?: number; // e.g. 10 cm
  unit?: string;
  label?: string;
}): string {
  const s = params.sisi || 10;
  const unit = params.unit || 'cm';
  const labelChar = params.label || 'X';

  const cx = 190;
  const cy = 135;
  const r = 70;

  let pts = '';
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    pts += `${x.toFixed(1)},${y.toFixed(1)} `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri 2D: Segi Enam Beraturan (Heksagon)</text>

  <!-- Poligon Segi Enam -->
  <polygon points="${pts.trim()}" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/>

  <!-- Pusat Lingkaran Luar & Garis Diagonal Putus-putus -->
  <circle cx="${cx}" cy="${cy}" r="3" fill="#0f172a"/>
  <line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(-Math.PI / 6)).toFixed(1)}" y2="${(cy + r * Math.sin(-Math.PI / 6)).toFixed(1)}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="${cx + 25}" y="${cy - 8}" font-size="9.5" fill="#475569">r = ${s} ${escapeXml(unit)}</text>

  <!-- Label Sisi Bawah -->
  <text x="${cx}" y="${cy + r + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">s = ${s} ${escapeXml(unit)}</text>

  <!-- Sudut Dalam 120 Derajat -->
  <text x="${cx - r + 15}" y="${cy + 4}" font-size="9" font-weight="bold" fill="#0369a1">120°</text>

  <!-- Target Badge X -->
  <g transform="translate(305, 110)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="190" y="244" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Besar sudut atau keliling segi enam beraturan di atas adalah ...</text>
</svg>`;
}

/** 35. Render Sudut Berpelurus (Suplemen) dan Sudut Berpenyiku (Komplemen) */
export function renderSudutBerpelurusBerpenyikuSvg(params: { tipe?: 'pelurus' | 'penyiku'; sudutA?: number; label?: string }): string {
  const tipe = (params.tipe || 'pelurus').toLowerCase() as 'pelurus' | 'penyiku';
  const labelChar = params.label || 'X';

  if (tipe === 'penyiku') {
    // Sudut Berpenyiku (90 Derajat)
    const ox = 110;
    const oy = 180;
    const len = 110;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 250" width="380" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri: Sudut Berpenyiku (Komplemen = 90°)</text>

  <!-- Garis Siku Vertikal & Horizontal -->
  <line x1="${ox}" y1="${oy}" x2="${ox + len}" y2="${oy}" stroke="#0f172a" stroke-width="2.5"/>
  <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - len}" stroke="#0f172a" stroke-width="2.5"/>

  <!-- Tanda Siku-Siku (Kotak Kecil) -->
  <rect x="${ox}" y="${oy - 16}" width="16" height="16" fill="none" stroke="#64748b" stroke-width="1.5"/>

  <!-- Garis Sinar Pembagi Miring 40 Derajat -->
  <line x1="${ox}" y1="${oy}" x2="${ox + 80}" y2="${oy - 85}" stroke="#2563eb" stroke-width="2.5"/>

  <!-- Busur Sudut 1 & 2 -->
  <path d="M ${ox + 45},${oy} A 45 45 0 0 0 ${ox + 35},${oy - 37}" fill="none" stroke="#ef4444" stroke-width="1.8"/>
  <text x="${ox + 50}" y="${oy - 15}" font-size="11" font-weight="bold" fill="#dc2626">3x°</text>

  <path d="M ${ox + 30},${oy - 32} A 45 45 0 0 0 ${ox},${oy - 45}" fill="none" stroke="#0284c7" stroke-width="1.8"/>
  <text x="${ox + 18}" y="${oy - 55}" font-size="11" font-weight="bold" fill="#0369a1">2x°</text>

  <!-- Huruf Titik Sudut -->
  <text x="${ox - 15}" y="${oy + 15}" font-size="11" font-weight="bold" fill="#0f172a">O</text>
  <text x="${ox + len + 8}" y="${oy + 5}" font-size="11" font-weight="bold" fill="#0f172a">A</text>
  <text x="${ox + 85}" y="${oy - 88}" font-size="11" font-weight="bold" fill="#2563eb">B</text>
  <text x="${ox - 5}" y="${oy - len - 6}" font-size="11" font-weight="bold" fill="#0f172a">C</text>

  <!-- Target Badge X -->
  <g transform="translate(305, 105)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
    <text x="0" y="26" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#e11d48">Cari nilai x</text>
  </g>

  <text x="190" y="236" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Nilai x pada sudut berpenyiku di atas adalah ...</text>
</svg>`;
  }

  // Sudut Berpelurus (180 Derajat)
  const ox = 180;
  const oy = 160;
  const len = 120;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 250" width="380" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Geometri: Sudut Berpelurus (Suplemen = 180°)</text>

  <!-- Garis Lurus Horizontal 180 Derajat -->
  <line x1="${ox - len}" y1="${oy}" x2="${ox + len}" y2="${oy}" stroke="#0f172a" stroke-width="2.5"/>
  <circle cx="${ox}" cy="${oy}" r="3.5" fill="#0f172a"/>

  <!-- Garis Sinar Miring Pembagi Sudut -->
  <line x1="${ox}" y1="${oy}" x2="${ox - 55}" y2="${oy - 95}" stroke="#2563eb" stroke-width="2.5"/>

  <!-- Busur Sudut Kanan (Tumpul / Lancip) -->
  <path d="M ${ox + 45},${oy} A 45 45 0 0 0 ${ox - 24},${oy - 41}" fill="none" stroke="#0284c7" stroke-width="2"/>
  <text x="${ox + 15}" y="${oy - 22}" font-size="11" font-weight="bold" fill="#0369a1">(3x + 15)°</text>

  <!-- Busur Sudut Kiri -->
  <path d="M ${ox - 24},${oy - 41} A 45 45 0 0 0 ${ox - 45},${oy}" fill="none" stroke="#ef4444" stroke-width="2"/>
  <text x="${ox - 65}" y="${oy - 22}" font-size="11" font-weight="bold" fill="#dc2626">2x°</text>

  <!-- Label Titik Sudut -->
  <text x="${ox - len - 14}" y="${oy + 5}" font-size="11" font-weight="bold" fill="#0f172a">P</text>
  <text x="${ox}" y="${oy + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">O</text>
  <text x="${ox + len + 6}" y="${oy + 5}" font-size="11" font-weight="bold" fill="#0f172a">Q</text>
  <text x="${ox - 65}" y="${oy - 100}" font-size="11" font-weight="bold" fill="#2563eb">R</text>

  <!-- Target Badge X -->
  <g transform="translate(325, 75)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="190" y="236" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Besar sudut ∠ROQ pada gambar berpelurus di atas adalah ...</text>
</svg>`;
}

/** 36. Render Dua Garis Sejajar Dipotong Garis Transversal */
export function renderGarisSejajarTransversalSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'sehadap').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 195, y: 155, name: 'Sudut Sehadap' }; // Sudut 5 vs 1
  if (pointer.includes('berseberangan_dalam') || pointer.includes('dalam')) target = { x: 175, y: 145, name: 'Berseberangan Dalam' };
  else if (pointer.includes('berseberangan_luar') || pointer.includes('luar')) target = { x: 235, y: 180, name: 'Berseberangan Luar' };
  else if (pointer.includes('sepihak')) target = { x: 215, y: 165, name: 'Sudut Sepihak' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Dua Garis Sejajar Dipotong Garis Transversal</text>

  <!-- Garis Sejajar k (Atas) dan l (Bawah) -->
  <line x1="45" y1="95" x2="355" y2="95" stroke="#0284c7" stroke-width="2.5"/>
  <text x="365" y="99" font-size="12" font-weight="bold" fill="#0284c7">k</text>

  <line x1="45" y1="165" x2="355" y2="165" stroke="#0284c7" stroke-width="2.5"/>
  <text x="365" y="169" font-size="12" font-weight="bold" fill="#0284c7">l</text>

  <!-- Garis Transversal m Miring Memotong k dan l -->
  <line x1="115" y1="45" x2="265" y2="215" stroke="#0f172a" stroke-width="2.5"/>
  <text x="275" y="222" font-size="12" font-weight="bold" fill="#0f172a">m</text>

  <!-- Sudut Titik Atas A: (cx=159, cy=95) -->
  <text x="140" y="85" font-size="10" font-weight="bold" fill="#dc2626">∠1</text>
  <text x="175" y="85" font-size="10" font-weight="bold" fill="#2563eb">∠2 (75°)</text>
  <text x="138" y="115" font-size="10" font-weight="bold" fill="#475569">∠3</text>
  <text x="175" y="115" font-size="10" font-weight="bold" fill="#dc2626">∠4</text>

  <!-- Sudut Titik Bawah B: (cx=221, cy=165) -->
  <text x="202" y="155" font-size="10" font-weight="bold" fill="#dc2626">∠5</text>
  <text x="238" y="155" font-size="10" font-weight="bold" fill="#2563eb">∠6</text>
  <text x="200" y="185" font-size="10" font-weight="bold" fill="#475569">∠7</text>
  <text x="238" y="185" font-size="10" font-weight="bold" fill="#dc2626">∠8</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="244" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Jika ∠2 = 75°, besar sudut pada tanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 37. Render Pembuktian Grafis Teorema Pythagoras */
export function renderTeoremaPythagorasSvg(params: { a?: number; b?: number; label?: string }): string {
  const a = params.a || 3;
  const b = params.b || 4;
  const c = Math.round(Math.sqrt(a * a + b * b));
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pembuktian Grafis Teorema Pythagoras: a² + b² = c²</text>

  <!-- Segitiga Siku-Siku di Tengah -->
  <!-- Siku di (150, 150) -->
  <polygon points="150,150 230,150 150,90" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>
  <rect x="150" y="138" width="12" height="12" fill="none" stroke="#475569" stroke-width="1.2"/>

  <!-- Persegi Sisi a (Tinggi = 60px) di Kiri Segitiga -->
  <rect x="90" y="90" width="60" height="60" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
  <text x="120" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#b91c1c">a² = 3²</text>
  <text x="120" y="139" text-anchor="middle" font-size="9.5" fill="#dc2626">(9 petak)</text>

  <!-- Persegi Sisi b (Alas = 80px) di Bawah Segitiga -->
  <rect x="150" y="150" width="80" height="80" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
  <text x="190" y="195" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8">b² = 4²</text>
  <text x="190" y="209" text-anchor="middle" font-size="9.5" fill="#2563eb">(16 petak)</text>

  <!-- Persegi Hipotenusa c di Sisi Miring -->
  <!-- Transform rotasi mengikuti sisi miring -->
  <g transform="translate(150, 90) rotate(36.87)">
    <rect x="0" y="-100" width="100" height="100" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
    <text x="50" y="-55" text-anchor="middle" font-size="11" font-weight="bold" fill="#854d0e">c² = 5²</text>
    <text x="50" y="-40" text-anchor="middle" font-size="9.5" fill="#a16207">(25 petak)</text>
  </g>

  <!-- Target Badge X -->
  <g transform="translate(330, 125)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
    <text x="0" y="25" text-anchor="middle" font-size="9" font-weight="bold" fill="#e11d48">9 + 16 = c²</text>
  </g>

  <text x="200" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Berdasarkan grid petak di atas, panjang sisi miring (c) adalah ...</text>
</svg>`;
}

/** 38. Render Juring dan Busur Lingkaran */
export function renderJuringBusurLingkaranSvg(params: { r?: number; sudut?: number; unit?: string; label?: string }): string {
  const rVal = params.r || 14;
  const sudutVal = params.sudut || 60;
  const unit = params.unit || 'cm';
  const labelChar = params.label || 'X';

  const cx = 170;
  const cy = 135;
  const radPx = 80;

  // Koordinat ujung busur
  const radAngle = (sudutVal * Math.PI) / 180;
  const xEnd = (cx + radPx * Math.cos(-radAngle)).toFixed(1);
  const yEnd = (cy + radPx * Math.sin(-radAngle)).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Unsur Lingkaran: Luas Juring &amp; Panjang Busur</text>

  <!-- Lingkaran Luar Tipis -->
  <circle cx="${cx}" cy="${cy}" r="${radPx}" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3 3"/>

  <!-- Juring Lingkaran Berarsir Berwarna -->
  <path d="M ${cx},${cy} L ${cx + radPx},${cy} A ${radPx} ${radPx} 0 0 0 ${xEnd},${yEnd} Z" fill="#bae6fd" fill-opacity="0.8" stroke="#0284c7" stroke-width="2"/>

  <!-- Busur Tebal Berwarna Merah di Lengkungan AB -->
  <path d="M ${cx + radPx},${cy} A ${radPx} ${radPx} 0 0 0 ${xEnd},${yEnd}" fill="none" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round"/>

  <!-- Titik Pusat O, A, dan B -->
  <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0f172a"/>
  <text x="${cx - 12}" y="${cy + 14}" font-size="11" font-weight="bold" fill="#0f172a">O</text>
  <text x="${cx + radPx + 8}" y="${cy + 5}" font-size="11" font-weight="bold" fill="#0f172a">A</text>
  <text x="${parseFloat(xEnd) + 8}" y="${parseFloat(yEnd) - 4}" font-size="11" font-weight="bold" fill="#0f172a">B</text>

  <!-- Sudut Pusat Busur -->
  <text x="${cx + 32}" y="${cy - 12}" font-size="11" font-weight="bold" fill="#0369a1">${sudutVal}°</text>

  <!-- Jari-Jari (r) -->
  <text x="${cx + 35}" y="${cy + 18}" font-size="10" font-weight="600" fill="#475569">r = ${rVal} ${escapeXml(unit)}</text>

  <!-- Legenda Kanan (Anti-Overlap) -->
  <g>
    <rect x="270" y="65" width="95" height="24" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="1"/>
    <text x="317.5" y="81" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">Busur AB (Merah)</text>
  </g>
  <g>
    <rect x="270" y="100" width="95" height="24" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1"/>
    <text x="317.5" y="116" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">Juring OAB (Biru)</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="317.5" cy="155" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="317.5" y="159.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="244" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Panjang busur AB atau luas juring pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// =========================================================================
// BATCH 3: GEOMETRI LANJUT & BANGUN RUANG GABUNGAN (4 TEMPLATES)
// =========================================================================

// 35. Teorema Sudut Luar Segitiga
export function renderSudutLuarSegitigaSvg(params: SudutLuarSegitigaParams): string {
  const a = safeNum(params.sudutA, 50, 10, 170);
  const b = safeNum(params.sudutB, 60, 10, 170);
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="sudutDropShdw" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="sudutCardBg" x1="0%" y1="0%" x2="0%" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="triBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="50%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#7dd3fc"/>
    </linearGradient>
    <radialGradient id="triFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.16"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Frame Background -->
  <rect width="380" height="220" fill="url(#sudutCardBg)" stroke="#cbd5e1" stroke-width="1.5" rx="8" filter="url(#sudutDropShdw)"/>
  <text x="190" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Teorema Sudut Luar Segitiga</text>

  <!-- Ground Shadow Lantai -->
  <ellipse cx="195" cy="164" rx="135" ry="7" fill="url(#triFloorShdw)"/>

  <!-- Segitiga dengan Garis Perpanjangan Alas -->
  <polygon points="60,160 250,160 140,70" fill="url(#triBodyGrad)" stroke="#0284c7" stroke-width="2.2" stroke-linejoin="round"/>
  <!-- Perpanjangan Garis Alas ke Kanan -->
  <line x1="250" y1="160" x2="340" y2="160" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,3"/>

  <!-- Busur Sudut Dalam A -->
  <path d="M 125,82 A 18 18 0 0 0 152,80" fill="none" stroke="#0369a1" stroke-width="1.6"/>
  <text x="140" y="98" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">${a}°</text>

  <!-- Busur Sudut Dalam B -->
  <path d="M 85,160 A 24 24 0 0 0 75,145" fill="none" stroke="#0369a1" stroke-width="1.6"/>
  <text x="92" y="152" font-size="10" font-weight="bold" fill="#0369a1">${b}°</text>

  <!-- Busur Sudut Luar di Kanan (250, 160) -->
  <path d="M 280 160 A 30 30 0 0 0 230 143" fill="none" stroke="#e11d48" stroke-width="2.2"/>

  <!-- Target Badge Sudut Luar -->
  <g filter="url(#sudutDropShdw)">
    <circle cx="270" cy="135" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="270" y="139" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  </g>

  <!-- Bottom Interactive Question Prompt -->
  <rect x="25" y="188" width="330" height="22" rx="5" fill="#0f172a" fill-opacity="0.92"/>
  <text x="190" y="202.5" text-anchor="middle" font-size="9.5" font-weight="600" fill="#f8fafc">Besar sudut luar segitiga pada huruf "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 36. Jaring-jaring Kerucut (Bukaan Juring & Alas)
export function renderJaringKerucutSvg(params: JaringKerucutParams): string {
  const r = safeNum(params.r, 7, 1, 100);
  const s = safeNum(params.s, 25, 1, 100);
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" width="360" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="coneDropShdw" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="coneCardBg" x1="0%" y1="0%" x2="0%" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="coneJuringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="60%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
    <radialGradient id="coneBaseGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="60%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#bfdbfe"/>
    </radialGradient>
    <radialGradient id="coneFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.16"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Frame Background -->
  <rect width="360" height="230" fill="url(#coneCardBg)" stroke="#cbd5e1" stroke-width="1.5" rx="8" filter="url(#coneDropShdw)"/>
  <text x="180" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Jaring-jaring Kerucut</text>

  <!-- Ground Shadow under Base Circle -->
  <ellipse cx="180" cy="197" rx="34" ry="6" fill="url(#coneFloorShdw)"/>

  <!-- Juring Selimut Kerucut (Atas) -->
  <path d="M 180,45 L 260,125 A 115 115 0 0 1 100,125 Z" fill="url(#coneJuringGrad)" stroke="#ea580c" stroke-width="2" stroke-linejoin="round"/>
  <text x="180" y="94" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Selimut Kerucut</text>
  <text x="235" y="80" font-size="9.5" font-weight="bold" fill="#c2410c">s = ${s} cm</text>

  <!-- Lingkaran Alas (Bawah) -->
  <circle cx="180" cy="165" r="30" fill="url(#coneBaseGrad)" stroke="#2563eb" stroke-width="2"/>
  <line x1="180" y1="165" x2="210" y2="165" stroke="#1d4ed8" stroke-width="1.6" stroke-dasharray="3,2"/>
  <text x="180" y="159" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#1e40af">Alas</text>
  <text x="195" y="178" font-size="9.5" font-weight="bold" fill="#1d4ed8">r = ${r} cm</text>

  <!-- Target Badge -->
  <g filter="url(#coneDropShdw)">
    <circle cx="280" cy="165" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.8"/>
    <text x="280" y="169" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  </g>

  <!-- Bottom Interactive Question Prompt -->
  <rect x="20" y="202" width="320" height="22" rx="5" fill="#0f172a" fill-opacity="0.92"/>
  <text x="180" y="216.5" text-anchor="middle" font-size="9.5" font-weight="600" fill="#f8fafc">Luas juring selimut kerucut pada gambar di atas adalah ...</text>
</svg>`;
}

// 37. Jaring-jaring Tabung (Bukaan Selimut & 2 Lingkaran)
export function renderJaringTabungSvg(params: JaringTabungParams): string {
  const r = safeNum(params.r, 7, 1, 100);
  const t = safeNum(params.t, 10, 1, 100);
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 230" width="380" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="tubeDropShdw" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="tubeCardBg" x1="0%" y1="0%" x2="0%" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <radialGradient id="tubeLidGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="60%" stop-color="#dcfce7"/>
      <stop offset="100%" stop-color="#bbf7d0"/>
    </radialGradient>
    <linearGradient id="tubeBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="60%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <radialGradient id="tubeFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.16"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Frame Background -->
  <rect width="380" height="230" fill="url(#tubeCardBg)" stroke="#cbd5e1" stroke-width="1.5" rx="8" filter="url(#tubeDropShdw)"/>
  <text x="190" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Jaring-jaring Tabung (Silinder)</text>

  <!-- Lingkaran Tutup Atas -->
  <circle cx="190" cy="55" r="22" fill="url(#tubeLidGrad)" stroke="#16a34a" stroke-width="1.8"/>
  <text x="190" y="58.5" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">Tutup (r = ${r})</text>

  <!-- Persegi Panjang Selimut -->
  <rect x="70" y="78" width="240" height="65" fill="url(#tubeBodyGrad)" stroke="#d97706" stroke-width="1.8" rx="3"/>
  <text x="190" y="112" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">Selimut Tabung (Persegi Panjang)</text>
  <text x="190" y="127" text-anchor="middle" font-size="9.5" font-weight="500" fill="#b45309">Panjang = 2πr | Lebar = t = ${t} cm</text>

  <!-- Ground Shadow under Bottom Circle -->
  <ellipse cx="190" cy="190" rx="26" ry="5" fill="url(#tubeFloorShdw)"/>

  <!-- Lingkaran Alas Bawah -->
  <circle cx="190" cy="166" r="22" fill="url(#tubeLidGrad)" stroke="#16a34a" stroke-width="1.8"/>
  <text x="190" y="169.5" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">Alas (r = ${r})</text>

  <!-- Target Badge -->
  <g filter="url(#tubeDropShdw)">
    <circle cx="335" cy="110" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.8"/>
    <text x="335" y="114" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  </g>

  <!-- Bottom Interactive Question Prompt -->
  <rect x="25" y="198" width="330" height="22" rx="5" fill="#0f172a" fill-opacity="0.92"/>
  <text x="190" y="212.5" text-anchor="middle" font-size="9.5" font-weight="600" fill="#f8fafc">Panjang selimut tabung jika jari-jari r = ${r} cm adalah ...</text>
</svg>`;
}

// 38. Luas Permukaan Bangun Gabungan (Balok + Limas)
export function renderLuasPermukaanGabunganSvg(params: LuasPermukaanGabunganParams): string {
  const p = safeNum(params.p, 10, 1, 100);
  const l = safeNum(params.l, 8, 1, 100);
  const t = safeNum(params.t, 12, 1, 100);
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="gabunganDropShdw" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="gabunganCardBg" x1="0%" y1="0%" x2="0%" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="balokTopGradLP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#bfdbfe"/>
    </linearGradient>
    <linearGradient id="balokFrontGradLP" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bfdbfe"/>
      <stop offset="100%" stop-color="#93c5fd"/>
    </linearGradient>
    <linearGradient id="balokRightGradLP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="limasFrontGradLP" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="limasRightGradLP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdba74"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <radialGradient id="gabunganFloorShdw" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.16"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Frame Background -->
  <rect width="360" height="240" fill="url(#gabunganCardBg)" stroke="#cbd5e1" stroke-width="1.5" rx="8" filter="url(#gabunganDropShdw)"/>
  <text x="180" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Bangun Ruang Gabungan (Balok &amp; Limas)</text>

  <!-- Ground Shadow Lantai -->
  <ellipse cx="178" cy="194" rx="72" ry="10" fill="url(#gabunganFloorShdw)"/>

  <!-- Balok Bawah Isometrik -->
  <polygon points="120,130 200,130 230,110 150,110" fill="url(#balokTopGradLP)" stroke="#1d4ed8" stroke-width="1.8" stroke-linejoin="round"/>
  <polygon points="120,130 120,185 200,185 200,130" fill="url(#balokFrontGradLP)" stroke="#1d4ed8" stroke-width="1.8" stroke-linejoin="round"/>
  <polygon points="200,130 200,185 230,165 230,110" fill="url(#balokRightGradLP)" stroke="#1d4ed8" stroke-width="1.8" stroke-linejoin="round"/>

  <!-- Atap Limas Segiempat di Atas Balok -->
  <polygon points="120,130 200,130 175,60" fill="url(#limasFrontGradLP)" stroke="#ea580c" stroke-width="1.8" stroke-linejoin="round"/>
  <polygon points="200,130 230,110 175,60" fill="url(#limasRightGradLP)" stroke="#ea580c" stroke-width="1.8" stroke-linejoin="round"/>

  <!-- Dimensi -->
  <text x="160" y="198" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#1e40af">p = ${p} cm</text>
  <text x="225" y="180" font-size="9.5" font-weight="bold" fill="#1e40af">l = ${l} cm</text>
  <text x="95" y="155" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#1e40af">t = ${t} cm</text>

  <!-- Target Badge -->
  <g filter="url(#gabunganDropShdw)">
    <circle cx="175" cy="60" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.8"/>
    <text x="175" y="64" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  </g>

  <!-- Bottom Interactive Question Prompt -->
  <rect x="20" y="210" width="320" height="22" rx="5" fill="#0f172a" fill-opacity="0.92"/>
  <text x="180" y="224.5" text-anchor="middle" font-size="9.5" font-weight="600" fill="#f8fafc">Luas permukaan gabungan bangun ruang di atas adalah ...</text>
</svg>`;
}



