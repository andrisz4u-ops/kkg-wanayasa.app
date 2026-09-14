/**
 * science-earth-space.ts
 * Earth Science, Geography & Astronomy SVG Visual Stimulus Renderers (12 Templates)
 */

import { escapeXml } from './types';

/** 
 * Render Siklus Air / Hidrologi Lengkap Berdasarkan Diagram Standar Kurikulum Nasional
 * Mencakup: Siklus Pendek, Siklus Sedang, Siklus Panjang, Evaporasi, Transpirasi, Kondensasi,
 * Presipitasi (Hujan & Salju), Runoff (Limpasan), Infiltrasi, Air Tanah & Subsurface Outflow.
 */
export function renderSiklusAirSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || '').toLowerCase().trim();
  const labelChar = params.label || 'X';

  // Koordinat penanda target untuk soal asesmen HOTS
  let target: { x: number; y: number; name: string } | null = null;
  if (pointer.includes('evaporasi') || pointer.includes('menguap')) {
    target = { x: 595, y: 250, name: 'Evaporasi' };
  } else if (pointer.includes('transpirasi') || pointer.includes('tumbuhan') || pointer.includes('pohon')) {
    target = { x: 435, y: 215, name: 'Transpirasi' };
  } else if (pointer.includes('kondensasi') || pointer.includes('awan')) {
    target = { x: 205, y: 65, name: 'Kondensasi' };
  } else if (pointer.includes('presipitasi') || pointer.includes('hujan')) {
    target = { x: 380, y: 175, name: 'Presipitasi (Hujan)' };
  } else if (pointer.includes('salju') || pointer.includes('gletser') || pointer.includes('es')) {
    target = { x: 95, y: 145, name: 'Salju / Gletser' };
  } else if (pointer.includes('infiltrasi') || pointer.includes('peresapan') || pointer.includes('serap')) {
    target = { x: 55, y: 345, name: 'Infiltrasi' };
  } else if (pointer.includes('runoff') || pointer.includes('limpasan')) {
    target = { x: 505, y: 280, name: 'Limpasan Permukaan (Runoff)' };
  } else if (pointer.includes('air tanah') || pointer.includes('subsurface') || pointer.includes('groundwater')) {
    target = { x: 440, y: 365, name: 'Aliran Air Tanah (Subsurface Outflow)' };
  } else if (pointer.includes('pendek')) {
    target = { x: 650, y: 170, name: 'Siklus Pendek' };
  } else if (pointer.includes('sedang')) {
    target = { x: 335, y: 135, name: 'Siklus Sedang' };
  } else if (pointer.includes('panjang')) {
    target = { x: 80, y: 105, name: 'Siklus Panjang' };
  }

  // Generate 24 berkas sinar matahari radiasi
  const sunRays = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    const r1 = 36;
    const r2 = 48 + (i % 2 === 0 ? 8 : 4);
    const x1 = (535 + Math.cos(angle) * r1).toFixed(1);
    const y1 = (72 + Math.sin(angle) * r1).toFixed(1);
    const x2 = (535 + Math.cos(angle) * r2).toFixed(1);
    const y2 = (72 + Math.sin(angle) * r2).toFixed(1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>`;
  }).join('');

  // Tetesan hujan awan sedang
  const rainDropsSedang = [
    { x: 360, y: 170 }, { x: 375, y: 168 }, { x: 390, y: 172 }, { x: 405, y: 169 },
    { x: 365, y: 182 }, { x: 380, y: 180 }, { x: 395, y: 184 }, { x: 410, y: 181 },
    { x: 370, y: 194 }, { x: 385, y: 192 }, { x: 400, y: 196 }
  ].map(d => `<line x1="${d.x}" y1="${d.y}" x2="${d.x - 4}" y2="${d.y + 10}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="1.5,1.5"/>`).join('');

  // Tetesan hujan awan pendek di laut
  const rainDropsPendek = [
    { x: 625, y: 155 }, { x: 640, y: 153 }, { x: 655, y: 157 },
    { x: 630, y: 167 }, { x: 645, y: 165 }, { x: 660, y: 169 },
    { x: 635, y: 179 }, { x: 650, y: 177 }, { x: 665, y: 181 }
  ].map(d => `<line x1="${d.x}" y1="${d.y}" x2="${d.x - 3}" y2="${d.y + 10}" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="1.5,1.5"/>`).join('');

  // Tetesan salju awan panjang di gunung
  const snowDropsPanjang = [
    { x: 170, y: 125 }, { x: 190, y: 120 }, { x: 210, y: 125 },
    { x: 160, y: 138 }, { x: 180, y: 134 }, { x: 200, y: 138 }, { x: 220, y: 134 },
    { x: 170, y: 150 }, { x: 190, y: 147 }, { x: 210, y: 151 }
  ].map(d => `<circle cx="${d.x}" cy="${d.y}" r="2" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.8"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 440" width="720" height="440" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:10px;">
  <defs>
    <!-- Gradien Langit -->
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="45%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>

    <!-- Gradien Matahari -->
    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="40%" stop-color="#fef08a" />
      <stop offset="85%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </radialGradient>

    <!-- Gradien Danau -->
    <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Gradien Laut / Samudra -->
    <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="35%" stop-color="#0284c7" />
      <stop offset="75%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <!-- Gradien Pegunungan Belakang -->
    <linearGradient id="mountBack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>

    <!-- Gradien Pegunungan Depan -->
    <linearGradient id="mountFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>

    <!-- Gradien Perbukitan Hijau -->
    <linearGradient id="hillGrad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bef264" />
      <stop offset="50%" stop-color="#84cc16" />
      <stop offset="100%" stop-color="#4d7c0f" />
    </linearGradient>

    <linearGradient id="hillGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="60%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>

    <!-- Gradien Panah Merah Aliran -->
    <linearGradient id="arrowRed" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>

    <!-- Pola Batuan Vertikal (Infiltrasi / Aerasi) -->
    <pattern id="patRockCol" width="8" height="24" patternUnits="userSpaceOnUse">
      <rect width="8" height="24" fill="#e7e5e4"/>
      <line x1="4" y1="0" x2="4" y2="24" stroke="#a8a29e" stroke-width="1.2"/>
      <line x1="0" y1="12" x2="8" y2="12" stroke="#d6d3d1" stroke-width="0.8"/>
    </pattern>

    <!-- Pola Kerikil Akuifer Pasir -->
    <pattern id="patGravel" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#fef08a"/>
      <circle cx="5" cy="5" r="1.6" fill="#78716c"/>
      <circle cx="15" cy="7" r="2.2" fill="#a8a29e" stroke="#57534e" stroke-width="0.5"/>
      <circle cx="8" cy="14" r="1.8" fill="#78716c"/>
      <circle cx="16" cy="16" r="1.4" fill="#57534e"/>
      <circle cx="2" cy="17" r="1.0" fill="#a8a29e"/>
    </pattern>

    <!-- Filter Bayangan Halus -->
    <filter id="shadowBox" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Latar Belakang Kotak Bingkai -->
  <rect width="720" height="440" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- ==================== 1. LANGIT (ATMOSFER) ==================== -->
  <rect x="1" y="1" width="718" height="275" fill="url(#skyGrad)"/>

  <!-- Matahari Terik dengan 24 Berkas Sinar Radiasi -->
  <g>
    ${sunRays}
    <circle cx="535" cy="72" r="32" fill="url(#sunGrad)" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="535" cy="72" r="28" fill="#fef08a" opacity="0.4"/>
  </g>

  <!-- ==================== 2. PEGUNUNGAN & SALJU (KIRI) ==================== -->
  <!-- Gunung Belakang -->
  <polygon points="40,240 185,135 305,240" fill="url(#mountBack)"/>
  <!-- Gunung Depan (Puncak Salju Utama) -->
  <polygon points="0,240 75,155 175,240" fill="url(#mountFront)"/>
  <polygon points="120,240 215,160 310,240" fill="url(#mountFront)" opacity="0.9"/>

  <!-- Topi Salju Puncak Gunung (Gletser) -->
  <path d="M 185,135 L 205,155 Q 197,163 190,157 Q 182,166 175,158 Q 168,162 165,155 Z" fill="#ffffff" stroke="#e0f2fe" stroke-width="1"/>
  <path d="M 75,155 L 98,175 Q 90,183 82,177 Q 75,185 68,178 Q 60,182 52,175 Z" fill="#ffffff" stroke="#e0f2fe" stroke-width="1"/>

  <!-- Hutan Pinus di Lereng Pegunungan -->
  <g fill="#14532d">
    <polygon points="25,230 30,215 35,230"/>
    <polygon points="35,232 40,217 45,232"/>
    <polygon points="45,228 50,213 55,228"/>
    <polygon points="55,230 60,214 65,230"/>
    <polygon points="65,228 70,212 75,228"/>
    <polygon points="75,232 80,216 85,232"/>
    <polygon points="85,229 90,215 95,229"/>
    <polygon points="95,233 100,217 105,233"/>
  </g>

  <!-- ==================== 3. PERBUKITAN HIJAU, LEMBAH & SUNGAI ==================== -->
  <!-- Bukit Hijau Kiri Menuju Danau -->
  <path d="M 0,240 Q 60,230 115,245 L 115,280 L 0,280 Z" fill="url(#hillGrad1)"/>

  <!-- Bukit Tengah dan Lembah -->
  <path d="M 270,245 Q 340,215 410,225 Q 470,235 510,265 L 510,300 L 270,300 Z" fill="url(#hillGrad2)"/>
  <path d="M 330,245 Q 380,220 445,235 Q 480,245 505,280 L 505,300 L 330,300 Z" fill="url(#hillGrad1)" opacity="0.8"/>

  <!-- Sungai Mengalir dari Lembah Pegunungan ke Danau -->
  <path d="M 155,185 Q 165,198 148,212 Q 138,225 158,235 Q 170,242 180,248 L 192,250 Q 180,242 168,235 Q 148,225 158,212 Q 172,198 162,185 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2"/>

  <!-- Danau Air Tawar Luas -->
  <path d="M 105,248 Q 160,240 235,242 Q 295,244 335,249 L 335,286 Q 260,296 190,292 Q 140,290 105,282 Z" fill="url(#lakeGrad)" stroke="#0284c7" stroke-width="1.5"/>
  <!-- Riak Permukaan Danau -->
  <path d="M 130,256 Q 145,254 160,256 M 220,254 Q 240,252 260,254 M 180,270 Q 200,268 220,270" stroke="#bae6fd" stroke-width="1.2" fill="none"/>

  <!-- Perahu Layar Kecil di Danau -->
  <g transform="translate(155, 235)">
    <path d="M 0,11 L 18,11 L 14,16 L 4,16 Z" fill="#ffffff" stroke="#334155" stroke-width="1"/>
    <line x1="9" y1="11" x2="9" y2="1" stroke="#334155" stroke-width="1.2"/>
    <polygon points="9,1 17,9 9,9" fill="#f43f5e"/>
  </g>

  <!-- Ikan Kecil di Danau -->
  <g fill="#facc15" opacity="0.85">
    <ellipse cx="205" cy="272" rx="3.5" ry="2"/>
    <polygon points="208,272 212,270 212,274"/>
    <ellipse cx="275" cy="268" rx="3.5" ry="2"/>
    <polygon points="278,268 282,266 282,270"/>
  </g>

  <!-- Gugusan Hutan Pohon Rimbun di Bukit (Transpirasi) -->
  <g fill="#15803d" stroke="#14532d" stroke-width="0.8">
    <circle cx="380" cy="242" r="11"/>
    <circle cx="395" cy="238" r="14"/>
    <circle cx="410" cy="242" r="12"/>
    <circle cx="425" cy="236" r="15"/>
    <circle cx="440" cy="240" r="13"/>
    <circle cx="455" cy="244" r="11"/>
    <circle cx="405" cy="232" r="12" fill="#16a34a"/>
    <circle cx="420" cy="230" r="13" fill="#22c55e"/>
  </g>

  <!-- Lereng Tebing Bebatuan & Runoff Air Menuju Laut -->
  <path d="M 465,248 L 515,280 L 505,305 L 460,295 Z" fill="#94a3b8" stroke="#64748b" stroke-width="1"/>
  <!-- Aliran Air Berbusa Runoff di Lereng -->
  <path d="M 475,252 Q 490,268 510,285 Q 520,292 525,298" stroke="#38bdf8" stroke-width="3" fill="none" stroke-dasharray="4,2"/>
  <path d="M 482,256 Q 495,272 515,290" stroke="#ffffff" stroke-width="1.5" fill="none"/>

  <!-- Pantai Pasir Keemasan -->
  <path d="M 505,278 Q 522,292 538,300 L 535,320 L 500,320 Z" fill="#fde047" stroke="#eab308" stroke-width="0.8"/>

  <!-- ==================== 4. LAUT / SAMUDRA (KANAN) ==================== -->
  <path d="M 515,282 Q 545,280 620,280 L 719,280 L 719,365 L 515,365 Z" fill="url(#oceanGrad)"/>
  <!-- Ombak / Riak Buih Laut -->
  <path d="M 535,285 Q 550,282 565,285 M 590,284 Q 610,281 630,284 M 660,284 Q 685,281 710,284" stroke="#ffffff" stroke-width="1.8" fill="none"/>
  <!-- Kapal Kecil di Laut -->
  <g transform="translate(665, 275)">
    <path d="M 0,5 L 18,5 L 15,9 L 3,9 Z" fill="#ffffff" stroke="#0f172a" stroke-width="0.8"/>
    <polygon points="8,1 14,5 8,5" fill="#3b82f6"/>
  </g>
  <!-- Biota / Ikan Laut -->
  <g fill="#93c5fd" opacity="0.75">
    <ellipse cx="585" cy="315" rx="5" ry="2.5"/>
    <polygon points="580,315 575,312 575,318"/>
    <ellipse cx="645" cy="335" rx="6" ry="3"/>
    <polygon points="639,335 633,331 633,339"/>
  </g>

  <!-- ==================== 5. PENAMPANG GEOLOGIS BAWAH TANAH ==================== -->
  <!-- Lapisan 1: Tanah Humus / Topsoil Cokelat -->
  <path d="M 0,280 L 105,282 Q 190,292 335,286 L 515,282 L 515,302 L 335,306 Q 190,312 105,302 L 0,300 Z" fill="#78350f"/>

  <!-- Lapisan 2: Batuan Retak Bertiang Vertikal (Zona Infiltrasi) -->
  <path d="M 0,300 L 105,302 Q 190,312 335,306 L 515,302 L 515,350 L 335,355 Q 190,360 105,352 L 0,350 Z" fill="url(#patRockCol)" stroke="#a8a29e" stroke-width="1"/>

  <!-- Lapisan 3: Akuifer Pasir & Kerikil Permeabel -->
  <path d="M 0,350 L 105,352 Q 190,360 335,355 L 719,348 L 719,410 L 335,415 Q 190,420 105,415 L 0,412 Z" fill="url(#patGravel)" stroke="#d97706" stroke-width="1"/>

  <!-- Lapisan 4: Air Tanah Jenuh (Groundwater Aquifer Biru) -->
  <path d="M 0,395 L 140,395 Q 220,400 280,412 L 0,412 Z" fill="#0284c7" opacity="0.9"/>
  <path d="M 15,404 Q 40,401 65,404 M 85,404 Q 115,401 145,404" stroke="#7dd3fc" stroke-width="1.2" fill="none"/>

  <!-- Lapisan Dasar Batuan Kedap Air (Impermeable Bedrock) -->
  <rect x="0" y="415" width="719" height="24" fill="#475569" stroke="#334155" stroke-width="1"/>

  <!-- ==================== 6. PANAH PROSES ALIRAN HIDROLOGI (MERAH TEBAL) ==================== -->
  <!-- Panah 1: EVAPORASI (Dari Laut Naik ke Awan) -->
  <path d="M 608,272 Q 622,242 612,212" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
  <polygon points="612,206 604,218 620,218" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>

  <!-- Panah 2: TRANSPIRASI (Dari Pepohonan Naik ke Awan) -->
  <line x1="432" y1="262" x2="432" y2="198" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
  <polygon points="432,190 424,202 440,202" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>

  <!-- Panah 3: ADVEKSI HORIZONTAL (Uap Air Bergerak ke Darat / Pegunungan) -->
  <path d="M 500,105 Q 425,122 345,116" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
  <polygon points="336,115 348,107 348,123" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>

  <!-- Panah 4: PRESIPITASI CURAH HUJAN KE DANAU -->
  <path d="M 235,188 Q 235,215 228,242" fill="none" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>
  <polygon points="227,248 222,236 234,238" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>

  <!-- Panah 5: INFILTRASI (Air Meresap ke Dalam Tanah) -->
  <line x1="55" y1="315" x2="55" y2="370" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
  <polygon points="55,378 47,366 63,366" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>

  <!-- Panah 6: SUBSURFACE OUTFLOW (Aliran Air Tanah Menuju Laut) -->
  <path d="M 345,360 Q 430,368 515,362" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
  <polygon points="524,362 512,354 512,370" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>

  <!-- ==================== 7. AWAN & PRESIPITASI (3 SIKLUS LENGKAP) ==================== -->
  <!-- Awan 1: Pegunungan Tinggi (Kondensasi & Presipitasi Salju) -->
  <g filter="url(#shadowBox)">
    <!-- Gumpalan Awan Putih-Abu -->
    <path d="M 135,108 A 18,18 0 0,1 160,88 A 26,26 0 0,1 205,82 A 28,28 0 0,1 250,92 A 20,20 0 0,1 265,110 A 16,16 0 0,1 250,122 L 140,122 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <path d="M 148,110 A 14,14 0 0,1 170,95 A 22,22 0 0,1 210,95 A 16,16 0 0,1 235,115 L 148,115 Z" fill="#ffffff"/>
  </g>
  <!-- Curahan Salju -->
  <g>${snowDropsPanjang}</g>

  <!-- Awan 2: Daratan Tengah (Siklus Sedang) -->
  <g filter="url(#shadowBox)">
    <path d="M 335,142 A 16,16 0 0,1 355,126 A 22,22 0 0,1 395,122 A 24,24 0 0,1 430,132 A 16,16 0 0,1 440,148 L 330,148 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
    <path d="M 345,145 A 12,12 0 0,1 365,132 A 18,18 0 0,1 405,130 A 14,14 0 0,1 425,145 L 345,145 Z" fill="#f1f5f9"/>
  </g>
  <!-- Curahan Hujan Daratan -->
  <g>${rainDropsSedang}</g>

  <!-- Awan 3: Samudra Kanan (Siklus Pendek) -->
  <g filter="url(#shadowBox)">
    <path d="M 525,128 A 18,18 0 0,1 550,108 A 28,28 0 0,1 600,102 A 30,30 0 0,1 650,114 A 20,20 0 0,1 668,134 L 520,134 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <path d="M 540,130 A 14,14 0 0,1 565,115 A 22,22 0 0,1 615,112 A 18,18 0 0,1 645,130 L 540,130 Z" fill="#ffffff"/>
  </g>
  <!-- Curahan Hujan Laut -->
  <g>${rainDropsPendek}</g>

  <!-- ==================== 8. LABEL TEKS ILMIAH KURIKULUM LENGKAP ==================== -->
  <!-- Header Judul Diagram -->
  <rect x="200" y="8" width="320" height="22" rx="6" fill="#0f172a" opacity="0.85"/>
  <text x="360" y="23" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5">Bagan Siklus Air (Daur Hidrologi Lengkap)</text>

  <!-- Label Siklus Utama -->
  <!-- 1. Siklus Panjang (Kiri) -->
  <g>
    <text x="75" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Siklus</text>
    <text x="75" y="110" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Panjang</text>
    <text x="88" y="145" text-anchor="middle" font-size="10" font-weight="bold" fill="#0284c7">Salju</text>
  </g>

  <!-- 2. Kondensasi (Atas Awan Kiri) -->
  <text x="205" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Kondensasi</text>

  <!-- 3. Siklus Sedang (Tengah) -->
  <g>
    <text x="385" y="110" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Siklus</text>
    <text x="385" y="124" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Sedang</text>
  </g>

  <!-- 4. Transpirasi (Di Atas Hutan) -->
  <text x="435" y="185" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Transpirasi</text>

  <!-- 5. Siklus Pendek (Kanan) -->
  <g>
    <text x="660" y="162" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Siklus</text>
    <text x="660" y="176" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Pendek</text>
  </g>

  <!-- 6. Evaporasi (Di Atas Laut) -->
  <text x="610" y="240" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#0f172a">Evaporasi</text>

  <!-- 7. Danau & Sungai -->
  <text x="165" y="206" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">Sungai</text>
  <text x="215" y="278" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))">Danau</text>

  <!-- 8. Runoff / Limpasan -->
  <text x="508" y="274" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0f172a">Runoff</text>

  <!-- 9. Infiltrasi (Bawah Tanah Kiri) -->
  <rect x="18" y="326" width="68" height="17" rx="4" fill="#ffffff" opacity="0.9"/>
  <text x="52" y="339" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Infiltrasi</text>

  <!-- 10. Air Tanah & Subsurface Outflow -->
  <text x="85" y="408" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">Air tanah</text>
  <rect x="365" y="372" width="130" height="16" rx="4" fill="#ffffff" opacity="0.85"/>
  <text x="430" y="384" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Subsurface Outflow</text>

  <!-- ==================== 9. TARGET PIN [X] UNTUK ASESMEN HOTS ==================== -->
  ${target ? `
  <g filter="url(#shadowBox)">
    <circle cx="${target.x}" cy="${target.y}" r="16" fill="#e11d48" stroke="#ffffff" stroke-width="2.5"/>
    <text x="${target.x}" y="${target.y + 5.5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>
  <rect x="${Math.max(10, target.x - 120)}" y="415" width="240" height="21" rx="4" fill="#0f172a"/>
  <text x="${Math.max(130, target.x)}" y="430" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">Tahapan yang ditunjuk oleh huruf "${escapeXml(labelChar)}": ${escapeXml(target.name)}</text>
  ` : `
  <rect x="240" y="416" width="240" height="19" rx="4" fill="#0f172a" opacity="0.85"/>
  <text x="360" y="429" text-anchor="middle" font-size="9.5" font-weight="600" fill="#ffffff">Daur Hidrologi: Pendek, Sedang, &amp; Panjang</text>
  `}
</svg>`;
}

/** Render Peta Kepulauan Indonesia Vektor SVG Kartografis Asli Presisi Tinggi (Berdasarkan Kontur Resmi) */
export function renderPetaIndonesiaSvg(params: { pointer?: string; label?: string; highlight?: boolean }): string {
  const pointer = (params.pointer || 'jawa').toLowerCase().trim();
  const labelChar = params.label || 'X';
  const highlight = params.highlight !== false;

  // Data Jalur Vektor Visi Kartografis Akurat (7 Gugus Kepulauan Utama)
  const pathSumatra = "M 23.6,37.6 L 20.4,40.9 L 19.6,43.8 L 21.8,51.1 L 34.5,64.5 L 42.9,68.5 L 44.4,72.9 L 48.0,76.5 L 48.7,82.4 L 50.5,84.2 L 55.6,85.6 L 61.1,90.4 L 65.5,102.0 L 66.2,107.8 L 80.0,122.4 L 88.7,145.6 L 103.3,161.6 L 107.6,168.9 L 113.1,174.4 L 124.0,181.6 L 129.5,189.3 L 136.4,194.7 L 139.6,193.6 L 140.0,190.4 L 145.1,192.5 L 146.5,191.1 L 149.5,191.8 L 150.2,190.4 L 154.2,190.0 L 155.6,184.2 L 155.6,160.2 L 158.5,156.5 L 157.8,152.9 L 165.5,156.9 L 166.5,150.7 L 168.7,147.8 L 160.7,142.7 L 158.5,134.0 L 154.5,131.5 L 150.2,132.2 L 145.8,137.3 L 145.1,136.5 L 144.0,137.6 L 144.0,139.8 L 146.5,142.4 L 151.3,143.5 L 144.4,143.8 L 143.3,140.5 L 138.9,136.2 L 138.2,128.2 L 135.6,125.6 L 129.8,125.6 L 126.5,122.4 L 131.6,113.6 L 128.7,104.9 L 121.8,98.7 L 116.7,98.0 L 115.6,96.9 L 115.6,93.3 L 113.8,91.5 L 107.3,91.5 L 106.2,90.4 L 106.9,86.0 L 105.1,83.5 L 98.5,83.5 L 94.9,81.3 L 90.5,83.5 L 89.1,82.7 L 84.4,75.8 L 62.5,56.2 L 60.4,51.8 L 52.7,42.7 L 39.6,43.5 L 28.0,37.6 L 24.4,37.6 Z M 25.1,73.3 L 24.0,74.4 L 24.7,79.5 L 35.3,84.9 L 37.8,83.1 L 37.8,80.2 L 33.8,76.2 L 25.8,73.3 Z M 45.5,91.5 L 41.5,94.0 L 41.5,96.2 L 46.5,102.0 L 49.8,108.2 L 54.5,105.6 L 55.3,99.8 L 49.1,92.2 L 46.2,91.5 Z M 57.8,111.1 L 56.0,112.9 L 56.0,120.2 L 58.5,122.7 L 61.5,122.7 L 63.3,120.2 L 62.5,114.4 L 58.5,111.1 Z M 61.5,124.2 L 58.9,126.0 L 58.9,129.6 L 61.8,136.2 L 65.1,140.2 L 68.7,140.2 L 70.5,138.4 L 70.5,135.5 L 67.6,127.5 L 65.1,124.9 L 62.2,124.2 Z M 76.7,143.8 L 74.9,145.6 L 74.9,148.5 L 81.8,158.4 L 85.8,157.3 L 85.8,152.2 L 83.6,147.8 L 80.4,144.5 L 77.5,143.8 Z M 178.5,146.0 L 172.4,152.9 L 175.6,156.9 L 179.3,156.2 L 182.9,159.1 L 186.9,156.5 L 187.6,152.2 L 182.9,146.7 L 179.3,146.0 Z M 145.1,202.0 L 144.7,204.5 L 145.5,202.4 Z";
  const pathKalimantan = "M 291.3,53.6 L 285.5,55.8 L 282.9,59.1 L 281.5,69.3 L 274.9,76.5 L 273.5,83.1 L 268.0,92.9 L 255.6,94.4 L 248.4,91.5 L 242.5,91.5 L 239.6,92.9 L 234.5,98.7 L 222.2,98.7 L 217.8,100.2 L 208.0,90.4 L 206.5,86.0 L 204.7,84.9 L 198.5,90.4 L 192.0,101.3 L 193.5,107.8 L 197.8,112.2 L 197.8,114.4 L 194.9,117.3 L 194.9,118.7 L 197.8,122.4 L 199.3,129.6 L 201.1,131.5 L 207.3,131.1 L 208.0,134.0 L 205.8,137.6 L 209.5,142.7 L 209.5,150.7 L 211.3,153.3 L 219.3,156.2 L 225.1,156.2 L 229.5,154.7 L 230.5,161.6 L 232.4,164.2 L 237.5,160.5 L 242.5,162.0 L 249.8,158.4 L 252.0,158.4 L 256.4,162.7 L 264.4,162.0 L 266.2,164.5 L 266.2,167.5 L 268.7,170.7 L 273.1,170.7 L 283.3,165.6 L 284.7,165.6 L 289.1,170.0 L 291.3,170.0 L 293.1,168.2 L 293.8,163.8 L 292.4,154.4 L 296.7,145.6 L 294.5,136.9 L 299.3,134.4 L 309.1,124.5 L 309.1,113.6 L 311.3,107.1 L 314.5,103.8 L 324.0,105.3 L 326.2,104.5 L 328.7,101.3 L 328.7,99.8 L 324.7,95.8 L 315.6,89.6 L 317.1,82.4 L 311.3,71.5 L 314.9,63.5 L 314.2,59.1 L 305.1,54.4 L 292.0,53.6 Z";
  const pathJawa = "M 150.2,190.4 L 149.1,192.2 L 151.6,192.5 L 152.0,193.6 L 149.1,200.9 L 145.5,202.4 L 145.5,205.3 L 151.6,207.8 L 156.7,207.8 L 157.8,208.9 L 157.1,211.8 L 159.6,214.4 L 170.5,216.5 L 177.8,220.2 L 187.3,220.2 L 192.4,218.7 L 199.6,219.5 L 213.5,224.5 L 231.6,228.9 L 250.5,228.2 L 257.1,231.8 L 260.7,231.8 L 266.5,228.9 L 274.5,232.5 L 277.5,232.5 L 281.5,229.3 L 282.2,225.6 L 279.6,223.1 L 276.0,221.6 L 269.5,222.4 L 267.6,221.3 L 266.9,217.6 L 262.2,215.1 L 249.8,215.8 L 246.5,214.0 L 255.6,213.6 L 261.5,210.7 L 263.3,208.9 L 258.5,204.9 L 235.3,204.2 L 230.2,201.3 L 222.9,201.3 L 220.0,197.6 L 216.4,198.4 L 209.8,204.9 L 199.6,204.2 L 195.3,203.5 L 186.5,197.6 L 178.5,195.5 L 172.0,191.1 L 161.8,193.3 L 150.9,190.4 Z";
  const pathSulawesi = "M 406.9,87.1 L 396.7,97.3 L 392.4,99.5 L 382.2,100.2 L 369.8,98.7 L 363.3,97.3 L 356.7,93.6 L 352.4,93.6 L 347.3,100.2 L 343.6,99.5 L 340.7,100.9 L 336.7,105.6 L 334.5,119.5 L 330.2,128.9 L 330.2,136.9 L 327.3,140.5 L 327.3,144.9 L 322.2,155.1 L 322.2,160.2 L 326.9,163.5 L 330.5,162.7 L 332.4,165.3 L 331.6,176.9 L 327.3,187.1 L 328.0,190.0 L 332.7,192.5 L 345.8,191.1 L 346.9,190.0 L 347.6,188.5 L 346.2,184.9 L 344.7,170.4 L 347.6,165.3 L 347.6,160.9 L 345.5,153.6 L 348.7,151.8 L 352.4,151.8 L 349.8,163.1 L 352.4,166.4 L 358.5,170.4 L 357.8,178.4 L 360.7,181.3 L 358.5,184.2 L 358.5,187.1 L 361.8,190.4 L 364.0,190.4 L 366.5,184.9 L 365.8,180.5 L 370.5,175.1 L 370.2,179.1 L 368.0,183.5 L 368.0,190.0 L 372.7,193.3 L 380.0,191.1 L 382.5,187.8 L 381.1,181.3 L 383.3,173.3 L 383.3,166.7 L 381.5,164.9 L 374.2,164.9 L 372.4,163.1 L 371.6,155.8 L 362.2,139.8 L 369.1,136.5 L 375.6,130.0 L 376.7,130.4 L 375.3,131.8 L 375.3,136.2 L 376.4,137.3 L 381.5,135.8 L 385.8,138.7 L 388.4,132.5 L 386.5,130.0 L 381.8,128.2 L 383.6,127.8 L 386.2,123.8 L 382.9,120.5 L 379.3,120.5 L 374.2,122.7 L 370.5,122.7 L 366.9,124.9 L 358.9,124.9 L 353.8,131.5 L 350.9,131.5 L 344.7,124.5 L 342.5,119.5 L 342.5,115.8 L 346.5,110.4 L 353.8,108.9 L 367.6,109.6 L 380.0,111.8 L 397.5,111.1 L 400.7,108.5 L 404.4,102.0 L 410.9,94.7 L 410.9,91.8 L 407.6,87.1 Z M 399.6,133.6 L 396.7,135.1 L 394.2,139.1 L 396.7,143.1 L 409.8,141.6 L 412.7,143.1 L 417.8,148.9 L 420.4,147.8 L 419.6,143.5 L 423.3,141.3 L 424.7,139.1 L 424.4,137.3 L 413.5,136.5 L 400.4,133.6 Z";
  const pathPapua = "M 475.3,112.5 L 470.2,114.7 L 469.8,116.5 L 476.0,123.5 L 486.9,120.5 L 489.5,118.0 L 488.7,115.8 L 485.5,113.3 L 476.0,112.5 Z M 500.7,117.6 L 495.6,121.3 L 489.1,122.7 L 484.7,125.6 L 478.2,124.2 L 477.8,129.6 L 481.8,133.6 L 492.0,136.5 L 494.5,141.3 L 499.3,145.3 L 510.5,145.6 L 503.6,150.4 L 495.6,149.6 L 494.5,150.7 L 495.6,154.7 L 500.7,156.2 L 504.0,159.5 L 505.5,169.6 L 507.3,171.5 L 515.3,170.0 L 517.5,163.5 L 522.5,167.8 L 537.1,175.1 L 546.5,176.5 L 553.1,180.2 L 561.1,181.6 L 567.6,184.5 L 575.3,191.5 L 579.6,198.7 L 581.8,204.5 L 581.8,208.9 L 584.0,213.3 L 583.6,214.4 L 578.5,214.4 L 575.3,217.6 L 569.5,230.7 L 585.8,229.6 L 591.6,226.7 L 596.7,226.7 L 603.3,229.6 L 614.9,240.5 L 616.7,239.5 L 617.5,236.5 L 617.5,214.0 L 616.0,208.2 L 616.0,149.3 L 612.7,146.7 L 593.1,141.6 L 581.5,135.1 L 572.7,132.2 L 567.6,134.4 L 562.5,140.9 L 553.1,143.1 L 544.7,155.1 L 540.0,157.6 L 535.3,154.4 L 532.4,148.5 L 526.5,141.3 L 526.5,126.0 L 524.0,123.5 L 516.0,119.8 L 509.5,117.6 L 501.5,117.6 Z M 541.5,120.5 L 538.9,121.6 L 539.6,124.5 L 548.7,131.5 L 554.5,130.7 L 555.6,127.5 L 549.5,122.0 L 546.5,120.5 L 542.2,120.5 Z M 531.3,124.2 L 529.5,127.5 L 532.0,132.2 L 534.9,131.5 L 537.5,128.9 L 537.5,126.0 L 535.6,124.2 L 532.0,124.2 Z M 540.7,133.6 L 539.6,134.7 L 540.4,136.9 L 548.0,140.9 L 557.5,140.2 L 561.5,137.6 L 560.7,135.5 L 553.1,133.6 L 541.5,133.6 Z M 510.2,183.8 L 506.5,187.5 L 503.6,186.0 L 501.8,187.8 L 501.8,195.1 L 503.6,198.4 L 508.7,198.4 L 512.7,195.8 L 513.5,187.8 L 512.7,184.2 L 510.9,183.8 Z M 529.1,184.5 L 525.1,188.5 L 520.7,203.8 L 521.5,207.5 L 524.0,209.3 L 529.1,209.3 L 531.6,206.7 L 535.3,195.1 L 533.8,187.8 L 529.8,184.5 Z M 491.3,208.5 L 485.5,211.5 L 482.2,215.5 L 482.2,220.5 L 477.8,226.4 L 478.9,228.9 L 485.5,227.5 L 495.3,214.7 L 497.5,209.6 L 496.4,208.5 L 492.0,208.5 Z";
  const pathMaluku = "M 450.5,77.6 L 445.8,81.6 L 446.5,85.3 L 449.8,88.5 L 452.7,88.5 L 456.7,83.1 L 456.7,80.9 L 454.2,78.4 L 451.3,77.6 Z M 441.8,83.5 L 438.5,86.0 L 434.9,94.0 L 434.9,99.1 L 438.5,102.7 L 436.4,106.4 L 436.4,109.3 L 439.3,115.1 L 433.1,116.2 L 429.8,119.5 L 431.3,124.5 L 436.7,127.8 L 440.4,126.4 L 442.5,123.5 L 444.7,125.6 L 447.6,125.6 L 449.5,120.9 L 445.8,113.6 L 446.5,110.7 L 452.7,111.1 L 456.0,109.3 L 456.0,105.6 L 450.9,103.5 L 456.0,96.9 L 456.0,91.8 L 449.1,90.7 L 445.8,84.5 L 442.5,83.5 Z M 438.9,129.3 L 434.9,131.8 L 434.2,135.5 L 436.0,138.0 L 439.6,139.5 L 444.7,139.5 L 447.3,136.9 L 446.5,133.3 L 443.3,130.0 L 439.6,129.3 Z M 471.6,135.1 L 466.2,137.6 L 466.9,141.3 L 470.2,143.1 L 476.0,142.4 L 477.8,139.8 L 477.8,136.9 L 476.0,135.1 L 472.4,135.1 Z M 450.5,149.6 L 445.5,151.8 L 439.3,156.5 L 439.3,158.0 L 441.5,159.5 L 441.5,166.0 L 442.5,167.1 L 452.7,164.2 L 455.6,159.8 L 468.0,161.3 L 477.5,166.4 L 481.1,166.4 L 482.9,164.5 L 482.2,158.0 L 477.5,154.0 L 473.1,153.3 L 467.3,149.6 L 451.3,149.6 Z M 422.9,153.3 L 418.2,156.5 L 416.7,161.6 L 419.3,165.6 L 423.6,167.8 L 433.1,167.1 L 436.4,162.4 L 433.1,155.5 L 428.7,153.3 L 423.6,153.3 Z M 424.4,215.1 L 420.0,217.3 L 414.2,218.0 L 412.4,220.5 L 412.4,222.0 L 414.2,223.1 L 424.4,223.1 L 428.7,221.6 L 429.8,216.9 L 428.0,215.1 L 425.1,215.1 Z M 465.1,216.5 L 462.5,218.4 L 462.5,223.5 L 464.4,225.3 L 468.0,225.3 L 470.5,222.7 L 470.5,219.1 L 465.8,216.5 Z";
  const pathBaliNusra = "M 401.8,221.6 L 391.6,223.8 L 380.7,223.1 L 363.3,228.2 L 356.7,228.2 L 344.4,223.8 L 340.7,224.5 L 330.9,230.0 L 330.2,234.4 L 331.3,235.5 L 353.8,236.9 L 368.4,235.5 L 380.0,232.5 L 393.8,232.5 L 401.1,231.1 L 404.7,229.6 L 408.0,225.6 L 406.2,222.4 L 402.5,221.6 Z M 308.0,222.4 L 302.2,226.0 L 298.5,226.0 L 294.9,229.6 L 294.5,225.6 L 292.7,223.8 L 288.4,223.8 L 283.6,227.8 L 282.9,232.2 L 286.2,236.9 L 290.5,236.9 L 292.7,234.7 L 293.8,238.0 L 295.6,239.1 L 302.2,236.9 L 308.0,236.9 L 313.1,234.7 L 321.8,235.5 L 328.0,230.7 L 327.3,226.4 L 323.3,223.8 L 308.7,222.4 Z M 403.3,234.7 L 397.5,236.9 L 393.8,241.3 L 388.7,240.5 L 384.0,244.5 L 384.0,248.9 L 378.9,252.5 L 378.9,254.0 L 383.6,257.3 L 392.4,256.5 L 401.5,250.4 L 405.1,246.0 L 405.8,241.6 L 408.7,238.0 L 406.9,234.7 L 404.0,234.7 Z M 335.6,239.1 L 323.3,241.3 L 322.2,246.7 L 324.0,248.5 L 332.0,249.3 L 335.6,252.9 L 340.0,255.1 L 346.5,254.4 L 351.3,250.4 L 344.4,242.7 L 338.5,239.1 L 336.4,239.1 Z M 377.8,256.5 L 374.5,259.1 L 372.4,263.5 L 373.5,266.0 L 380.7,265.3 L 383.3,263.5 L 383.3,258.4 L 378.5,256.5 Z";

  // Koordinat target dan posisi badge penunjuk huruf [X]
  let target = { x: 213.2, y: 211.3, name: 'Pulau Jawa', badgeX: 213.2, badgeY: 246, dir: 'down' };
  let isTarget = {
    sumatra: false,
    jawa: false,
    kalimantan: false,
    sulawesi: false,
    papua: false,
    maluku: false,
    baliNusra: false
  };

  if (pointer.includes('sumat')) {
    target = { x: 96.5, y: 121.4, name: 'Pulau Sumatra', badgeX: 52, badgeY: 62, dir: 'up' };
    isTarget.sumatra = true;
  } else if (pointer.includes('kalim') || pointer.includes('borneo')) {
    target = { x: 258.6, y: 119.6, name: 'Pulau Kalimantan', badgeX: 258.6, badgeY: 52, dir: 'up' };
    isTarget.kalimantan = true;
  } else if (pointer.includes('sulaw') || pointer.includes('celebes')) {
    target = { x: 368.9, y: 143.4, name: 'Pulau Sulawesi', badgeX: 368.9, badgeY: 58, dir: 'up' };
    isTarget.sulawesi = true;
  } else if (pointer.includes('papua') || pointer.includes('irian')) {
    target = { x: 530.7, y: 164.6, name: 'Pulau Papua', badgeX: 530.7, badgeY: 68, dir: 'up' };
    isTarget.papua = true;
  } else if (pointer.includes('maluku') || pointer.includes('seram') || pointer.includes('halmahera') || pointer.includes('ambon')) {
    target = { x: 446.9, y: 145.3, name: 'Kepulauan Maluku', badgeX: 446.9, badgeY: 58, dir: 'up' };
    isTarget.maluku = true;
  } else if (pointer.includes('bali') || pointer.includes('nusa') || pointer.includes('lombok') || pointer.includes('flores') || pointer.includes('timor') || pointer.includes('ntb') || pointer.includes('ntt')) {
    target = { x: 351.9, y: 238.6, name: 'Kepulauan Nusa Tenggara & Bali', badgeX: 351.9, badgeY: 260, dir: 'down' };
    isTarget.baliNusra = true;
  } else {
    // Default: Pulau Jawa
    isTarget.jawa = true;
  }

  // Palet Warna: pulau sasaran di-highlight merah jika highlight aktif
  const colTargetFill = highlight ? '#e11d48' : '#10b981';
  const colTargetStroke = highlight ? '#9f1239' : '#047857';
  const swTarget = highlight ? 2.2 : 1.2;

  const colNormalFill = '#10b981';
  const colNormalStroke = '#047857';
  const swNormal = 1.2;

  const fillSumatra = isTarget.sumatra ? colTargetFill : colNormalFill;
  const strokeSumatra = isTarget.sumatra ? colTargetStroke : colNormalStroke;
  const swSumatra = isTarget.sumatra ? swTarget : swNormal;

  const fillJawa = isTarget.jawa ? colTargetFill : colNormalFill;
  const strokeJawa = isTarget.jawa ? colTargetStroke : colNormalStroke;
  const swJawa = isTarget.jawa ? swTarget : swNormal;

  const fillKalimantan = isTarget.kalimantan ? colTargetFill : colNormalFill;
  const strokeKalimantan = isTarget.kalimantan ? colTargetStroke : colNormalStroke;
  const swKalimantan = isTarget.kalimantan ? swTarget : swNormal;

  const fillSulawesi = isTarget.sulawesi ? colTargetFill : colNormalFill;
  const strokeSulawesi = isTarget.sulawesi ? colTargetStroke : colNormalStroke;
  const swSulawesi = isTarget.sulawesi ? swTarget : swNormal;

  const fillPapua = isTarget.papua ? colTargetFill : colNormalFill;
  const strokePapua = isTarget.papua ? colTargetStroke : colNormalStroke;
  const swPapua = isTarget.papua ? swTarget : swNormal;

  const fillMaluku = isTarget.maluku ? colTargetFill : colNormalFill;
  const strokeMaluku = isTarget.maluku ? colTargetStroke : colNormalStroke;
  const swMaluku = isTarget.maluku ? swTarget : swNormal;

  const fillBaliNusra = isTarget.baliNusra ? colTargetFill : colNormalFill;
  const strokeBaliNusra = isTarget.baliNusra ? colTargetStroke : colNormalStroke;
  const swBaliNusra = isTarget.baliNusra ? swTarget : swNormal;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280" width="640" height="280" style="background:#f0f9ff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <marker id="arrPeta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
    <filter id="shadowPeta" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0.8" dy="1.5" stdDeviation="1.2" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Latar Belakang Samudra & Grid Kartografis Koordinat Halus -->
  <rect width="640" height="280" fill="url(#oceanGrad)" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <line x1="20" y1="90" x2="620" y2="90" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="20" y1="160" x2="620" y2="160" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="20" y1="230" x2="620" y2="230" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="130" y1="35" x2="130" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="260" y1="35" x2="260" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="390" y1="35" x2="390" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>
  <line x1="520" y1="35" x2="520" y2="250" stroke="#bae6fd" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6"/>

  <!-- Judul Kartografi -->
  <text x="320" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Peta Kepulauan Indonesia</text>

  <!-- Kompas Mata Angin (Wind Rose) di Pojok Kanan Atas -->
  <g transform="translate(605, 38)">
    <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
    <polygon points="0,-12 3,-3 0,0 -3,-3" fill="#e11d48"/>
    <polygon points="0,12 3,3 0,0 -3,3" fill="#64748b"/>
    <polygon points="12,0 3,3 0,0 3,-3" fill="#64748b"/>
    <polygon points="-12,0 -3,3 0,0 -3,-3" fill="#64748b"/>
    <text x="0" y="-15" text-anchor="middle" font-size="9" font-weight="bold" fill="#e11d48">U</text>
  </g>

  <!-- Skala Batang Simbolis di Pojok Kiri Bawah -->
  <g transform="translate(24, 258)">
    <rect x="0" y="-5" width="28" height="4" fill="#0f172a"/>
    <rect x="28" y="-5" width="28" height="4" fill="#ffffff" stroke="#0f172a" stroke-width="0.8"/>
    <text x="0" y="6" font-size="7.5" fill="#475569" font-weight="600">0</text>
    <text x="48" y="6" font-size="7.5" fill="#475569" font-weight="600">500 km</text>
  </g>

  <!-- KEPULAUAN INDONESIA (VEKTOR KARTOGRAFIS ASLI PRESISI TINGGI) -->
  <g filter="url(#shadowPeta)">
    <!-- 1. Sumatra & Kepulauan Sekitarnya (Nias, Mentawai, Bangka, Belitung) -->
    <path d="${pathSumatra}" fill="${fillSumatra}" stroke="${strokeSumatra}" stroke-width="${swSumatra}" />

    <!-- 2. Kalimantan -->
    <path d="${pathKalimantan}" fill="${fillKalimantan}" stroke="${strokeKalimantan}" stroke-width="${swKalimantan}" />

    <!-- 3. Jawa & Madura -->
    <path d="${pathJawa}" fill="${fillJawa}" stroke="${strokeJawa}" stroke-width="${swJawa}" />

    <!-- 4. Bali & Nusa Tenggara (Lombok, Sumbawa, Flores, Sumba, Timor) -->
    <path d="${pathBaliNusra}" fill="${fillBaliNusra}" stroke="${strokeBaliNusra}" stroke-width="${swBaliNusra}" />

    <!-- 5. Sulawesi (4 Semenanjung K-Shape & Kepulauan Sekitarnya) -->
    <path d="${pathSulawesi}" fill="${fillSulawesi}" stroke="${strokeSulawesi}" stroke-width="${swSulawesi}" />

    <!-- 6. Maluku (Halmahera, Seram, Buru, Ambon, Kei, Aru) -->
    <path d="${pathMaluku}" fill="${fillMaluku}" stroke="${strokeMaluku}" stroke-width="${swMaluku}" />

    <!-- 7. Papua (Doberai Bird's Head, Biak, Yapen, Pulau Dolak) -->
    <path d="${pathPapua}" fill="${fillPapua}" stroke="${strokePapua}" stroke-width="${swPapua}" />
  </g>

  <!-- Garis Penunjuk & Badge Lingkaran Target Huruf X -->
  <g>
    <line x1="${target.badgeX}" y1="${target.badgeY}" x2="${target.x}" y2="${target.y}" stroke="#e11d48" stroke-width="2.5" marker-end="url(#arrPeta)"/>
    <circle cx="${target.badgeX}" cy="${target.badgeY}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${target.badgeX}" y="${target.badgeY + 4.5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Instruksi Soal Bawah (Zero-Spoiler) -->
  <text x="320" y="268" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan pulau yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

export function renderTataSuryaSvg(params: any): string {
  const pointer = String(params.pointer || '3').toLowerCase();
  const labelChar = params.label || 'X';

  const planets = [
    { id: 'merkurius', num: 1, name: 'Merkurius', x: 86, r: 5, fill: '#94a3b8', stroke: '#64748b' },
    { id: 'venus', num: 2, name: 'Venus', x: 126, r: 8, fill: '#f59e0b', stroke: '#d97706' },
    { id: 'bumi', num: 3, name: 'Bumi', x: 174, r: 8.5, fill: '#0284c7', stroke: '#0369a1', isBumi: true },
    { id: 'mars', num: 4, name: 'Mars', x: 220, r: 6.5, fill: '#ef4444', stroke: '#b91c1c', isMars: true },
    { id: 'yupiter', num: 5, name: 'Yupiter', x: 304, r: 20, fill: '#d97706', stroke: '#b45309', isJup: true },
    { id: 'saturnus', num: 6, name: 'Saturnus', x: 390, r: 15, fill: '#fde047', stroke: '#ca8a04', isSat: true },
    { id: 'uranus', num: 7, name: 'Uranus', x: 460, r: 11, fill: '#67e8f9', stroke: '#06b6d4', isUr: true },
    { id: 'neptunus', num: 8, name: 'Neptunus', x: 518, r: 10.5, fill: '#3b82f6', stroke: '#1d4ed8', isNep: true }
  ];

  let targetIndex = 2; // Default Bumi (ke-3)
  planets.forEach((p, idx) => {
    if (
      pointer === String(p.num) ||
      pointer === p.id ||
      pointer === p.name.toLowerCase() ||
      (pointer === 'jupiter' && p.id === 'yupiter')
    ) {
      targetIndex = idx;
    }
  });

  const cy = 138;

  const starDots = [
    [45, 35], [95, 220], [140, 48], [195, 235], [235, 42],
    [265, 215], [315, 38], [375, 230], [425, 52], [475, 220], [525, 38]
  ].map(([sx, sy]) => `<circle cx="${sx}" cy="${sy}" r="1" fill="#ffffff" opacity="0.75"/>`).join('');

  // Sabuk Asteroid (Antara Mars dan Yupiter)
  const asteroidDots = [
    [250, 55], [256, 85], [252, 115], [258, 140], [251, 165], [257, 195], [253, 225],
    [262, 70], [266, 100], [263, 130], [268, 155], [264, 180], [267, 210]
  ].map(([ax, ay]) => `<circle cx="${ax}" cy="${ay}" r="1.3" fill="#94a3b8" opacity="0.7"/>`).join('');

  const renderedPlanets = planets.map((p, idx) => {
    const isTarget = idx === targetIndex;
    let planetGraphic = '';

    if (p.isBumi) {
      // Bumi dengan benua hijau, samudra biru, atmosfer awan, dan Bulan kecil
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
        <!-- Benua Hijau -->
        <path d="M ${p.x - 4} ${cy - 3} Q ${p.x - 1} ${cy - 6} ${p.x + 2} ${cy - 3} Q ${p.x + 4} ${cy + 1} ${p.x} ${cy + 4} Z" fill="#22c55e" opacity="0.9"/>
        <path d="M ${p.x - 3} ${cy + 2} Q ${p.x - 1} ${cy + 5} ${p.x + 2} ${cy + 3} Z" fill="#22c55e" opacity="0.85"/>
        <!-- Awan Putih -->
        <path d="M ${p.x - 6} ${cy - 1} Q ${p.x} ${cy - 4} ${p.x + 6} ${cy - 2}" stroke="#ffffff" stroke-width="1.2" fill="none" opacity="0.6"/>
        <!-- Bulan Satelit -->
        <circle cx="${p.x + 13}" cy="${cy - 7}" r="2" fill="#e2e8f0"/>
      `;
    } else if (p.isMars) {
      // Mars dengan tudung es kutub putih
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="#ea580c" stroke="#c2410c" stroke-width="1.2"/>
        <!-- Kutub Es -->
        <ellipse cx="${p.x}" cy="${cy - p.r + 1.5}" rx="3" ry="1.2" fill="#ffffff" opacity="0.9"/>
      `;
    } else if (p.isJup) {
      // Yupiter dengan sabuk awan garis ochre dan Bintik Merah Raksasa
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="#d97706" stroke="#b45309" stroke-width="1.5"/>
        <line x1="${p.x - 19}" y1="${cy - 8}" x2="${p.x + 19}" y2="${cy - 8}" stroke="#fef3c7" stroke-width="2.2" opacity="0.65"/>
        <line x1="${p.x - 20}" y1="${cy - 2}" x2="${p.x + 20}" y2="${cy - 2}" stroke="#78350f" stroke-width="2.8" opacity="0.75"/>
        <line x1="${p.x - 20}" y1="${cy + 5}" x2="${p.x + 20}" y2="${cy + 5}" stroke="#9a3412" stroke-width="2" opacity="0.7"/>
        <line x1="${p.x - 18}" y1="${cy + 11}" x2="${p.x + 18}" y2="${cy + 11}" stroke="#fef3c7" stroke-width="2" opacity="0.65"/>
        <!-- Bintik Merah Raksasa (Great Red Spot) -->
        <ellipse cx="${p.x + 7}" cy="${cy + 5}" rx="4.5" ry="2.8" fill="#dc2626"/>
      `;
    } else if (p.isSat) {
      // Saturnus dengan cincin 3D miring dan pembagian Cassini
      planetGraphic = `
        <!-- Belakang Cincin -->
        <ellipse cx="${p.x}" cy="${cy}" rx="28" ry="7" transform="rotate(-18 ${p.x} ${cy})" fill="none" stroke="#fef08a" stroke-width="4.5" opacity="0.85"/>
        <ellipse cx="${p.x}" cy="${cy}" rx="28" ry="7" transform="rotate(-18 ${p.x} ${cy})" fill="none" stroke="#050814" stroke-width="0.8" opacity="0.9"/>
        <!-- Badan Planet -->
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="#fde047" stroke="#ca8a04" stroke-width="1.5"/>
        <line x1="${p.x - 14}" y1="${cy}" x2="${p.x + 14}" y2="${cy}" stroke="#ca8a04" stroke-width="1.8" opacity="0.6"/>
        <!-- Depan Cincin -->
        <path d="M ${p.x - 26} ${cy + 8} A 28 7 0 0 0 ${p.x + 26} ${cy - 9}" transform="rotate(-18 ${p.x} ${cy})" fill="none" stroke="#fef08a" stroke-width="4.5" opacity="0.95"/>
      `;
    } else if (p.isUr) {
      // Uranus dengan cincin tipis vertikal
      planetGraphic = `
        <ellipse cx="${p.x}" cy="${cy}" rx="3" ry="18" fill="none" stroke="#a5f3fc" stroke-width="1" opacity="0.7"/>
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="#67e8f9" stroke="#06b6d4" stroke-width="1.2"/>
      `;
    } else if (p.isNep) {
      // Neptunus biru laut pekat dengan pusaran badai
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.2"/>
        <path d="M ${p.x - 7} ${cy - 2} Q ${p.x} ${cy - 5} ${p.x + 7} ${cy - 1}" stroke="#93c5fd" stroke-width="1" fill="none" opacity="0.65"/>
      `;
    } else {
      planetGraphic = `<circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.2"/>`;
    }

    const numberText = `<text x="${p.x}" y="240" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">(${p.num})</text>`;

    let targetBadge = '';
    if (isTarget) {
      const badgeY = cy - p.r - 28;
      targetBadge = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r + 7}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3,2"/>
        <line x1="${p.x}" y1="${badgeY + 12}" x2="${p.x}" y2="${cy - p.r - 7}" stroke="#f43f5e" stroke-width="2" marker-end="url(#arrSurya)"/>
        <circle cx="${p.x}" cy="${badgeY}" r="12" fill="#f43f5e" stroke="#ffffff" stroke-width="2"/>
        <text x="${p.x}" y="${badgeY + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }

    return `
      <!-- Lintasan Orbit Planet -->
      <path d="M ${p.x},35 A ${p.x * 2} 400 0 0 1 ${p.x},235" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3"/>
      ${planetGraphic}
      ${numberText}
      ${targetBadge}
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 280" width="560" height="280" style="background:#050814; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <radialGradient id="sunGlowSurya" cx="15%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="25%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </radialGradient>
    <filter id="sunHaloSurya" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <marker id="arrSurya" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f43f5e" />
    </marker>
  </defs>

  <!-- Frame -->
  <rect x="2" y="2" width="556" height="276" rx="8" fill="#050814" stroke="#1e293b" stroke-width="1.5"/>
  <!-- Space Dust / Nebula Glow -->
  <ellipse cx="300" cy="140" rx="240" ry="90" fill="#1e1b4b" opacity="0.35"/>
  ${starDots}
  ${asteroidDots}

  <text x="280" y="24" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#f8fafc">Diagram Sistem Tata Surya</text>

  <!-- Matahari Raksasa Bersinar -->
  <circle cx="0" cy="${cy}" r="64" fill="url(#sunGlowSurya)" filter="url(#sunHaloSurya)"/>
  <!-- Solar Flare Prominences -->
  <path d="M 38 ${cy - 38} Q 56 ${cy - 48} 48 ${cy - 24}" fill="none" stroke="#f59e0b" stroke-width="2.5" opacity="0.85"/>
  <path d="M 44 ${cy + 30} Q 62 ${cy + 42} 50 ${cy + 18}" fill="none" stroke="#f59e0b" stroke-width="2.5" opacity="0.85"/>
  <text x="24" y="${cy + 4}" font-size="10.5" font-weight="bold" fill="#ffffff" opacity="0.95">Matahari</text>

  ${renderedPlanets}

  <!-- Caption Bawah -->
  <text x="280" y="264" text-anchor="middle" font-size="10.5" font-weight="600" fill="#94a3b8">Perhatikan planet yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

/**
 * Render Gerhana Matahari & Gerhana Bulan
 * Menampilkan posisi matahari, bulan, bumi, serta zona umbra dan penumbra
 */
export function renderGerhanaSvg(params: {
  jenis?: 'matahari' | 'bulan';
  pointer?: string;
  label?: string;
}): string {
  const jenis = (params.jenis || 'matahari').toLowerCase();
  const isMatahari = jenis === 'matahari';
  const pointer = (params.pointer || 'umbra').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 320, y: 130 };
  if (pointer.includes('penumbra') || pointer === '2') {
    target = { x: 320, y: 88 };
  } else if (pointer.includes('bulan')) {
    target = isMatahari ? { x: 230, y: 130 } : { x: 390, y: 130 };
  } else if (pointer.includes('bumi')) {
    target = isMatahari ? { x: 380, y: 130 } : { x: 240, y: 130 };
  }

  // Objek Tengah & Objek Kanan tergantung jenis gerhana
  const middleName = isMatahari ? 'Bulan' : 'Bumi';
  const rightName = isMatahari ? 'Bumi' : 'Bulan';
  const middleR = isMatahari ? 14 : 30;
  const rightR = isMatahari ? 30 : 14;
  const middleFill = isMatahari ? '#475569' : '#0284c7';
  const rightFill = isMatahari ? '#0284c7' : '#64748b';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <radialGradient id="sunGlowGerhana" cx="45%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="35%" stop-color="#fef08a"/>
      <stop offset="70%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </radialGradient>
    <linearGradient id="earthGradGerhana" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <filter id="badgeShdwGerhana" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.3"/>
    </filter>
  </defs>

  <rect width="480" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Skema Peristiwa Gerhana ${isMatahari ? 'Matahari' : 'Bulan'}</text>

  <!-- Kerucut Bayangan Penumbra (Abu-abu Terang) -->
  <polygon points="70,90 230,${130 + middleR} 440,${130 + rightR + 35} 440,${130 - rightR - 35} 230,${130 - middleR} 70,170" fill="#cbd5e1" fill-opacity="0.35"/>

  <!-- Kerucut Bayangan Umbra (Gelap / Pekat) -->
  <polygon points="70,90 230,${130 - middleR} 370,130 230,${130 + middleR} 70,170" fill="#334155" fill-opacity="0.55"/>
  ${!isMatahari ? `<polygon points="240,${130 - middleR} 440,${130 - 15} 440,${130 + 15} 240,${130 + middleR}" fill="#1e293b" fill-opacity="0.65"/>` : ''}

  <!-- Garis Berkas Cahaya Batas -->
  <line x1="70" y1="90" x2="440" y2="${130 + rightR + 35}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4"/>
  <line x1="70" y1="170" x2="440" y2="${130 - rightR - 35}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4"/>
  <line x1="70" y1="90" x2="370" y2="130" stroke="#d97706" stroke-width="1.2"/>
  <line x1="70" y1="170" x2="370" y2="130" stroke="#d97706" stroke-width="1.2"/>

  <!-- Matahari (Kiri) -->
  <circle cx="70" cy="130" r="40" fill="url(#sunGlowGerhana)" stroke="#b45309" stroke-width="2"/>
  <!-- Label Matahari -->
  <g>
    <rect x="35" y="45" width="70" height="20" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="1"/>
    <text x="70" y="59" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#b45309">Matahari</text>
  </g>

  <!-- Objek Tengah (Bulan pada Gerhana Matahari, Bumi pada Gerhana Bulan) -->
  <circle cx="230" cy="130" r="${middleR}" fill="${middleFill}" stroke="#0f172a" stroke-width="2"/>
  ${isMatahari ? `
    <!-- Detail Bulan Kawah -->
    <circle cx="226" cy="126" r="2.5" fill="#334155" opacity="0.6"/>
    <circle cx="233" cy="132" r="2" fill="#334155" opacity="0.6"/>
  ` : `
    <!-- Detail Benua Bumi -->
    <path d="M 222 122 Q 230 118 238 122 Q 242 130 236 138 Z" fill="#22c55e" opacity="0.8"/>
  `}
  <!-- Label Objek Tengah (Atas) -->
  <g>
    <rect x="${230 - 32}" y="42" width="64" height="20" rx="4" fill="#ffffff" stroke="#475569" stroke-width="1"/>
    <text x="230" y="56" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#1e293b">${middleName}</text>
  </g>

  <!-- Objek Kanan (Bumi pada Gerhana Matahari, Bulan pada Gerhana Bulan) -->
  <circle cx="380" cy="130" r="${rightR}" fill="${rightFill}" stroke="#0f172a" stroke-width="2"/>
  ${isMatahari ? `
    <!-- Detail Benua Bumi Kanan -->
    <path d="M 370 118 Q 382 112 392 118 Q 396 128 388 140 Z" fill="#22c55e" opacity="0.8"/>
    <!-- Area Gerhana Total di Permukaan Bumi -->
    <circle cx="350" cy="130" r="3.5" fill="#0f172a"/>
  ` : `
    <!-- Detail Bulan Kanan -->
    <circle cx="377" cy="127" r="2" fill="#475569" opacity="0.6"/>
  `}
  <!-- Label Objek Kanan (Bawah Objek) -->
  <g>
    <rect x="${380 - 32}" y="175" width="64" height="20" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1"/>
    <text x="380" y="189" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">${rightName}</text>
  </g>

  <!-- Callout Label Zona Bayangan -->
  <g>
    <rect x="275" y="210" width="75" height="20" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1"/>
    <text x="312.5" y="224" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#334155">1. Umbra</text>
  </g>
  <g>
    <rect x="300" y="42" width="85" height="20" rx="4" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
    <text x="342.5" y="56" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#64748b">2. Penumbra</text>
  </g>

  <!-- Target Badge X (Kontras Tinggi) -->
  <g filter="url(#badgeShdwGerhana)">
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Keterangan Bawah -->
  <text x="240" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Daerah bayangan yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 13. Render Fase-Fase Bulan Mengelilingi Bumi */
export function renderFaseBulanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'purnama').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 85, y: 140, name: 'Bulan Purnama' }; // Posisi 5 (kiri)
  if (pointer.includes('baru') || pointer.includes('mati')) target = { x: 305, y: 140, name: 'Bulan Baru' };
  else if (pointer.includes('kuartir 1') || pointer.includes('paruh awal') || pointer.includes('atas') || pointer.includes('kuartir i')) target = { x: 195, y: 50, name: 'Kuartir Pertama' };
  else if (pointer.includes('kuartir 3') || pointer.includes('paruh akhir') || pointer.includes('bawah') || pointer.includes('kuartir iii')) target = { x: 195, y: 230, name: 'Kuartir Ketiga' };
  else if (pointer.includes('sabit')) target = { x: 265, y: 76, name: 'Bulan Sabit' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 300" width="540" height="300" style="background:#070b19; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="badgeShdwFase" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.35"/>
    </filter>
    <marker id="arrSunRay" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#facc15" />
    </marker>
  </defs>

  <!-- Frame -->
  <rect x="2" y="2" width="536" height="296" rx="8" fill="#070b19" stroke="#1e293b" stroke-width="1.5"/>
  <text x="270" y="24" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#f8fafc">Fase-Fase Bulan Mengelilingi Bumi</text>

  <!-- Sinar Matahari Datang dari Kanan -->
  <g transform="translate(485, 140)">
    <line x1="25" y1="-60" x2="-25" y2="-60" stroke="#facc15" stroke-width="2" marker-end="url(#arrSunRay)"/>
    <line x1="25" y1="0" x2="-25" y2="0" stroke="#facc15" stroke-width="2.5" marker-end="url(#arrSunRay)"/>
    <line x1="25" y1="60" x2="-25" y2="60" stroke="#facc15" stroke-width="2" marker-end="url(#arrSunRay)"/>
    <text x="0" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill="#fde047">Sinar Matahari</text>
  </g>

  <!-- Garis Orbit Lingkaran -->
  <circle cx="195" cy="140" r="90" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Bumi di Pusat -->
  <circle cx="195" cy="140" r="22" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
  <!-- Belahan Bumi Siang / Malam -->
  <path d="M 195,118 A 22 22 0 0 1 195,162 Z" fill="#38bdf8" opacity="0.4"/>
  <path d="M 195,118 A 22 22 0 0 0 195,162 Z" fill="#0f172a" opacity="0.4"/>
  <!-- Benua Hijau -->
  <ellipse cx="191" cy="137" rx="9" ry="12" fill="#22c55e" opacity="0.85"/>
  <text x="195" y="144" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#ffffff">Bumi</text>

  <!-- 8 Posisi Bulan -->
  <!-- 1. Bulan Baru (Kanan, 0°) -->
  <g transform="translate(285, 140)">
    <circle cx="0" cy="0" r="13" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
    <text x="0" y="26" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#94a3b8">Bulan Baru</text>
  </g>

  <!-- 2. Sabit Awal (Kanan Atas, 45°) -->
  <g transform="translate(259, 76)">
    <circle cx="0" cy="0" r="11" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
    <!-- Lit right side -->
    <path d="M 0,-11 A 11 11 0 0 1 0,11 Z" fill="#fef08a"/>
    <path d="M 0,-11 A 11 11 0 0 0 0,11 Z" fill="#1e293b"/>
  </g>

  <!-- 3. Kuartir Pertama (Atas, 90°) -->
  <g transform="translate(195, 50)">
    <circle cx="0" cy="0" r="13" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
    <path d="M 0,-13 A 13 13 0 0 1 0,13 Z" fill="#fef08a"/>
    <path d="M 0,-13 A 13 13 0 0 0 0,13 Z" fill="#1e293b"/>
    <text x="0" y="-18" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#94a3b8">Kuartir I</text>
  </g>

  <!-- 4. Cembung Awal (Kiri Atas, 135°) -->
  <g transform="translate(131, 76)">
    <circle cx="0" cy="0" r="11" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
    <path d="M 0,-11 A 11 11 0 0 1 0,11 Z" fill="#fef08a"/>
    <path d="M 0,-11 A 11 11 0 0 0 0,11 Z" fill="#1e293b"/>
  </g>

  <!-- 5. Bulan Purnama (Kiri, 180°) -->
  <g transform="translate(105, 140)">
    <circle cx="0" cy="0" r="13" fill="#fef08a" stroke="#facc15" stroke-width="1.5"/>
    <text x="0" y="26" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#fde047">Purnama</text>
  </g>

  <!-- 6. Cembung Akhir (Kiri Bawah, 225°) -->
  <g transform="translate(131, 204)">
    <circle cx="0" cy="0" r="11" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
    <path d="M 0,-11 A 11 11 0 0 1 0,11 Z" fill="#fef08a"/>
    <path d="M 0,-11 A 11 11 0 0 0 0,11 Z" fill="#1e293b"/>
  </g>

  <!-- 7. Kuartir Ketiga (Bawah, 270°) -->
  <g transform="translate(195, 230)">
    <circle cx="0" cy="0" r="13" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
    <path d="M 0,-13 A 13 13 0 0 1 0,13 Z" fill="#fef08a"/>
    <path d="M 0,-13 A 13 13 0 0 0 0,13 Z" fill="#1e293b"/>
    <text x="0" y="26" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#94a3b8">Kuartir III</text>
  </g>

  <!-- 8. Sabit Akhir (Kanan Bawah, 315°) -->
  <g transform="translate(259, 204)">
    <circle cx="0" cy="0" r="11" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
    <path d="M 0,-11 A 11 11 0 0 1 0,11 Z" fill="#fef08a"/>
    <path d="M 0,-11 A 11 11 0 0 0 0,11 Z" fill="#1e293b"/>
  </g>

  <!-- Target Badge X -->
  <g transform="translate(${target.x}, ${target.y})" filter="url(#badgeShdwFase)">
    <circle cx="0" cy="0" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Caption Bawah -->
  <text x="270" y="282" text-anchor="middle" font-size="10.5" font-weight="600" fill="#cbd5e1">Fase bulan yang ditunjukkan oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 14. Render Struktur Lapisan Bumi */
export function renderLapisanBumiSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'mantel').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 235, y: 105, name: 'Mantel Bumi' };
  if (pointer.includes('kerak') || pointer.includes('crust')) target = { x: 255, y: 65, name: 'Kerak Bumi' };
  else if (pointer.includes('inti luar') || pointer.includes('outer')) target = { x: 205, y: 145, name: 'Inti Luar Cair' };
  else if (pointer.includes('inti dalam') || pointer.includes('inner')) target = { x: 175, y: 185, name: 'Inti Dalam Padat' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300" width="520" height="300" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <radialGradient id="innerCoreGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#facc15"/>
    </radialGradient>
    <radialGradient id="outerCoreGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </radialGradient>
    <radialGradient id="mantleGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="60%" stop-color="#c2410c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </radialGradient>
    <filter id="badgeShdwLapisan" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Frame -->
  <rect x="2" y="2" width="516" height="296" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="260" y="24" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Struktur Lapisan Bumi</text>

  <!-- Potongan Irisan Bumi Melingkar (Concentric Cross-Section) -->
  <g transform="translate(150, 205)">
    <!-- Mantel Bumi (Upper & Lower Mantle) -->
    <path d="M 0,0 L 135,-135 A 190 190 0 0 0 -135,-135 Z" fill="url(#mantleGrad)" stroke="#7c2d12" stroke-width="1.2"/>
    <!-- Inti Luar Cair (Outer Core) -->
    <path d="M 0,0 L 80,-80 A 113 113 0 0 0 -80,-80 Z" fill="url(#outerCoreGrad)" stroke="#c2410c" stroke-width="1"/>
    <!-- Inti Dalam Padat (Inner Core) -->
    <path d="M 0,0 L 40,-40 A 56 56 0 0 0 -40,-40 Z" fill="url(#innerCoreGrad)" stroke="#ca8a04" stroke-width="1"/>

    <!-- Kerak Bumi Tipis di Permukaan Luar -->
    <path d="M 135,-135 A 190 190 0 0 0 -135,-135" fill="none" stroke="#15803d" stroke-width="5"/>
    <path d="M 135,-135 A 190 190 0 0 0 -135,-135" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="16,8"/>
  </g>

  <!-- Label Lapisan Kanan (Anti-Overlap) -->
  <!-- 1. Kerak Bumi -->
  <g transform="translate(310, 48)">
    <rect x="0" y="0" width="185" height="26" rx="5" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.2"/>
    <text x="12" y="17" font-size="10" font-weight="bold" fill="#166534">1. Kerak Bumi (Crust)</text>
    <text x="145" y="17" font-size="8.5" fill="#15803d">0-70 km</text>
    <line x1="0" y1="13" x2="-70" y2="42" stroke="#16a34a" stroke-width="1.2"/>
  </g>

  <!-- 2. Mantel Bumi -->
  <g transform="translate(310, 88)">
    <rect x="0" y="0" width="185" height="26" rx="5" fill="#fff7ed" stroke="#ea580c" stroke-width="1.2"/>
    <text x="12" y="17" font-size="10" font-weight="bold" fill="#c2410c">2. Mantel Bumi (Mantle)</text>
    <text x="135" y="17" font-size="8.5" fill="#c2410c">2.900 km</text>
    <line x1="0" y1="13" x2="-80" y2="28" stroke="#ea580c" stroke-width="1.2"/>
  </g>

  <!-- 3. Inti Luar -->
  <g transform="translate(310, 128)">
    <rect x="0" y="0" width="185" height="26" rx="5" fill="#fffbeb" stroke="#d97706" stroke-width="1.2"/>
    <text x="12" y="17" font-size="10" font-weight="bold" fill="#b45309">3. Inti Luar (Outer Core)</text>
    <text x="135" y="17" font-size="8.5" fill="#b45309">5.150 km</text>
    <line x1="0" y1="13" x2="-105" y2="18" stroke="#d97706" stroke-width="1.2"/>
  </g>

  <!-- 4. Inti Dalam -->
  <g transform="translate(310, 168)">
    <rect x="0" y="0" width="185" height="26" rx="5" fill="#fefce8" stroke="#ca8a04" stroke-width="1.2"/>
    <text x="12" y="17" font-size="10" font-weight="bold" fill="#854d0e">4. Inti Dalam (Inner Core)</text>
    <text x="135" y="17" font-size="8.5" fill="#854d0e">6.371 km</text>
    <line x1="0" y1="13" x2="-135" y2="18" stroke="#ca8a04" stroke-width="1.2"/>
  </g>

  <!-- Target Badge X -->
  <g transform="translate(${target.x}, ${target.y})" filter="url(#badgeShdwLapisan)">
    <circle cx="0" cy="0" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Bottom Prompt -->
  <text x="260" y="278" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Lapisan bumi yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 15. Render Profil Lapisan Tanah (Horizon) */
export function renderLapisanTanahSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'topsoil').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 110, y: 88, name: 'Horizon A (Topsoil)' };
  if (pointer.includes('organik') || pointer.includes('humus') || pointer.includes('horizon o')) target = { x: 110, y: 55, name: 'Horizon O (Organik)' };
  else if (pointer.includes('subsoil') || pointer.includes('horizon b') || pointer.includes('lempung')) target = { x: 110, y: 125, name: 'Horizon B (Subsoil)' };
  else if (pointer.includes('regolit') || pointer.includes('lapuk') || pointer.includes('horizon c')) target = { x: 110, y: 168, name: 'Horizon C (Regolit)' };
  else if (pointer.includes('batuan dasar') || pointer.includes('bedrock') || pointer.includes('horizon r')) target = { x: 110, y: 205, name: 'Horizon R (Batuan Induk)' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="190" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Profil Lapisan (Horizon) Tanah</text>

  <!-- Kolom Profil Lapisan Tanah -->
  <g>
    <!-- Horizon O: Organik (Hitam/Cokelat Sangat Tua) -->
    <rect x="50" y="45" width="120" height="24" fill="#3f2e21" stroke="#271a10" stroke-width="1"/>
    <!-- Horizon A: Topsoil Subur (Cokelat Tua) -->
    <rect x="50" y="69" width="120" height="38" fill="#5c4033" stroke="#3f2e21" stroke-width="1"/>
    <!-- Horizon B: Subsoil Lempung (Kuning Cokelat) -->
    <rect x="50" y="107" width="120" height="42" fill="#a06535" stroke="#5c4033" stroke-width="1"/>
    <!-- Horizon C: Batuan Lapuk (Cokelat Abu Butiran) -->
    <rect x="50" y="149" width="120" height="40" fill="#c49a6c" stroke="#a06535" stroke-width="1"/>
    <!-- Horizon R: Batuan Induk Pejal (Abu-abu Keras) -->
    <rect x="50" y="189" width="120" height="35" rx="2" fill="#78716c" stroke="#57534e" stroke-width="1"/>
  </g>

  <!-- Label Sisi Kanan (Anti-Overlap) -->
  <g>
    <rect x="185" y="46" width="165" height="19" rx="4" fill="#ffffff" stroke="#3f2e21" stroke-width="1"/>
    <text x="267" y="59" text-anchor="middle" font-size="9" font-weight="bold" fill="#3f2e21">Horizon O (Seresah &amp; Humus)</text>
  </g>
  <g>
    <rect x="185" y="78" width="165" height="19" rx="4" fill="#ffffff" stroke="#5c4033" stroke-width="1"/>
    <text x="267" y="91" text-anchor="middle" font-size="9" font-weight="bold" fill="#5c4033">Horizon A (Topsoil Subur)</text>
  </g>
  <g>
    <rect x="185" y="118" width="165" height="19" rx="4" fill="#ffffff" stroke="#a06535" stroke-width="1"/>
    <text x="267" y="131" text-anchor="middle" font-size="9" font-weight="bold" fill="#a06535">Horizon B (Subsoil Lempung)</text>
  </g>
  <g>
    <rect x="185" y="158" width="165" height="19" rx="4" fill="#ffffff" stroke="#c49a6c" stroke-width="1"/>
    <text x="267" y="171" text-anchor="middle" font-size="9" font-weight="bold" fill="#a06535">Horizon C (Regolit / Batuan Lapuk)</text>
  </g>
  <g>
    <rect x="185" y="196" width="165" height="19" rx="4" fill="#ffffff" stroke="#78716c" stroke-width="1"/>
    <text x="267" y="209" text-anchor="middle" font-size="9" font-weight="bold" fill="#57534e">Horizon R (Batuan Induk Pejal)</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Lapisan tanah yang ditunjuk oleh tanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 22. Render Pembagian Zona Waktu Indonesia */
export function renderZonaWaktuIndonesiaSvg(params: { zona?: string; label?: string }): string {
  const zona = (params.zona || 'wita').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 1; // 0: WIB, 1: WITA, 2: WIT
  if (zona.includes('wib') || zona.includes('barat')) activeIdx = 0;
  else if (zona.includes('wit') && !zona.includes('wita') || zona.includes('timur')) activeIdx = 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Pembagian Tiga Zona Waktu di Indonesia</text>

  <!-- Peta Kepulauan Indonesia Sederhana & Batas Garis Bujur -->
  <rect x="15" y="45" width="390" height="90" rx="8" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2"/>
  <!-- Batas Wilayah Vertikal Garis Putus -->
  <line x1="145" y1="45" x2="145" y2="135" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4 3"/>
  <line x1="275" y1="45" x2="275" y2="135" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4 3"/>

  <!-- Ikon Jam Perbandingan Waktu -->
  <!-- Kolom WIB -->
  <g>
    <circle cx="80" cy="75" r="16" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
    <line x1="80" y1="75" x2="80" y2="64" stroke="#0f172a" stroke-width="2"/>
    <line x1="80" y1="75" x2="72" y2="82" stroke="#0f172a" stroke-width="1.6"/>
    <text x="80" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">07.00 WIB</text>
    <text x="80" y="122" text-anchor="middle" font-size="8" fill="#64748b">Meridian 105° BT</text>
  </g>

  <!-- Kolom WITA -->
  <g>
    <circle cx="210" cy="75" r="16" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
    <line x1="210" y1="75" x2="210" y2="64" stroke="#0f172a" stroke-width="2"/>
    <line x1="210" y1="75" x2="200" y2="75" stroke="#0f172a" stroke-width="1.6"/>
    <text x="210" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534">08.00 WITA</text>
    <text x="210" y="122" text-anchor="middle" font-size="8" fill="#64748b">Meridian 120° BT</text>
  </g>

  <!-- Kolom WIT -->
  <g>
    <circle cx="340" cy="75" r="16" fill="#ffffff" stroke="#d97706" stroke-width="2"/>
    <line x1="340" y1="75" x2="340" y2="64" stroke="#0f172a" stroke-width="2"/>
    <line x1="340" y1="75" x2="328" y2="75" stroke="#0f172a" stroke-width="1.6"/>
    <text x="340" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">09.00 WIT</text>
    <text x="340" y="122" text-anchor="middle" font-size="8" fill="#64748b">Meridian 135° BT</text>
  </g>

  <!-- Kartu Penjelasan Wilayah di Bawah -->
  <rect x="15" y="145" width="120" height="75" rx="6" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="75" y="162" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1">WIB (UTC+7)</text>
  <text x="75" y="180" text-anchor="middle" font-size="8" fill="#475569">Sumatra, Jawa,</text>
  <text x="75" y="194" text-anchor="middle" font-size="8" fill="#475569">Kalbar, Kalteng</text>

  <rect x="145" y="145" width="120" height="75" rx="6" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="205" y="162" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">WITA (UTC+8)</text>
  <text x="205" y="180" text-anchor="middle" font-size="8" fill="#475569">Sulawesi, Bali,</text>
  <text x="205" y="194" text-anchor="middle" font-size="8" fill="#475569">NTB, NTT, Kalsel</text>

  <rect x="275" y="145" width="120" height="75" rx="6" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="335" y="162" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b45309">WIT (UTC+9)</text>
  <text x="335" y="180" text-anchor="middle" font-size="8" fill="#475569">Kepulauan Maluku</text>
  <text x="335" y="194" text-anchor="middle" font-size="8" fill="#475569">&amp; Tanah Papua</text>

  <!-- Target Badge X -->
  <circle cx="${[75, 205, 335][activeIdx]}" cy="145" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${[75, 205, 335][activeIdx]}" y="149" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="246" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Zona waktu yang ditunjuk oleh huruf "${escapeXml(labelChar)}" berselisih ... jam dari WIB</text>
</svg>`;
}

/** 23. Render Siklus Pembentukan Batuan Bumi */
export function renderSiklusBatuanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'beku').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 95, y: 80, name: 'Batuan Beku' };
  if (pointer.includes('sedimen') || pointer.includes('endapan')) target = { x: 305, y: 80, name: 'Batuan Sedimen' };
  else if (pointer.includes('metamorf') || pointer.includes('malihan')) target = { x: 305, y: 190, name: 'Batuan Metamorf' };
  else if (pointer.includes('magma') || pointer.includes('cair pijar')) target = { x: 95, y: 190, name: 'Dapur Magma' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 270" width="420" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="rockArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Siklus Pembentukan Batuan Bumi</text>

  <!-- Panah Penghubung Siklus -->
  <!-- Magma -> Batuan Beku (Pendinginan) -->
  <line x1="95" y1="175" x2="95" y2="98" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>
  <!-- Batuan Beku -> Sedimen (Pelapukan & Erosi) -->
  <line x1="140" y1="80" x2="250" y2="80" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>
  <!-- Sedimen -> Metamorf (Suhu & Tekanan Tinggi) -->
  <line x1="305" y1="98" x2="305" y2="175" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>
  <!-- Metamorf -> Magma (Peleburan / Melting) -->
  <line x1="250" y1="190" x2="140" y2="190" stroke="#0284c7" stroke-width="1.8" marker-end="url(#rockArr)"/>

  <!-- Teks Proses pada Panah (Anti-Overlap) -->
  <text x="50" y="138" font-size="8" font-weight="600" fill="#0369a1">Pendinginan</text>
  <text x="195" y="72" text-anchor="middle" font-size="8" font-weight="600" fill="#0369a1">Pelapukan &amp; Pengendapan</text>
  <text x="355" y="138" font-size="8" font-weight="600" fill="#0369a1">Suhu &amp; Tekanan</text>
  <text x="195" y="204" text-anchor="middle" font-size="8" font-weight="600" fill="#0369a1">Peleburan (Melting)</text>

  <!-- Kotak 1: Magma (Kiri Bawah) -->
  <rect x="50" y="175" width="90" height="32" rx="6" fill="#fee2e2" stroke="#ef4444" stroke-width="1.8"/>
  <text x="95" y="195" text-anchor="middle" font-size="10" font-weight="bold" fill="#991b1b">Magma Pijar</text>

  <!-- Kotak 2: Batuan Beku (Kiri Atas) -->
  <rect x="50" y="65" width="90" height="32" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.8"/>
  <text x="95" y="85" text-anchor="middle" font-size="10" font-weight="bold" fill="#075985">Batuan Beku</text>

  <!-- Kotak 3: Batuan Sedimen (Kanan Atas) -->
  <rect x="260" y="65" width="90" height="32" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.8"/>
  <text x="305" y="85" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">Batuan Sedimen</text>

  <!-- Kotak 4: Batuan Metamorf (Kanan Bawah) -->
  <rect x="260" y="175" width="90" height="32" rx="6" fill="#f3e8ff" stroke="#a855f7" stroke-width="1.8"/>
  <text x="305" y="195" text-anchor="middle" font-size="10" font-weight="bold" fill="#6b21a8">Batuan Metamorf</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Tahap siklus batuan pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// 21. Gerak Semu Tahunan Matahari
export function renderGerakSemuMatahariSvg(params: any): string {
  const pointer = String(params.bulan || params.pointer || 'juni').toLowerCase();
  const labelChar = params.label || 'X';

  const points = [
    { id: 'juni', bulan: '21 Juni (23.5° LU)', x: 190, y: 60 },
    { id: 'september', bulan: '23 September (0°)', x: 260, y: 105 },
    { id: 'desember', bulan: '22 Desember (23.5° LS)', x: 190, y: 150 },
    { id: 'maret', bulan: '21 Maret (0° Khatulistiwa)', x: 120, y: 105 }
  ];

  let target = points.find(p => pointer.includes(p.id)) || points[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Peredaran Gerak Semu Tahunan Matahari</text>

  <!-- Garis Lintang Acuan -->
  <line x1="50" y1="60" x2="330" y2="60" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="340" y="63" font-size="7.5" font-weight="bold" fill="#b45309">23.5° LU</text>

  <line x1="50" y1="105" x2="330" y2="105" stroke="#10b981" stroke-width="1.5"/>
  <text x="340" y="108" font-size="7.5" font-weight="bold" fill="#047857">0° (Khatulistiwa)</text>

  <line x1="50" y1="150" x2="330" y2="150" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="340" y="153" font-size="7.5" font-weight="bold" fill="#b45309">23.5° LS</text>

  <!-- Lintasan Gelombang Sinus Gerak Semu Matahari -->
  <path d="M 120 105 Q 155 60 190 60 Q 225 60 260 105 Q 225 150 190 150 Q 155 150 120 105 Z" fill="none" stroke="#ef4444" stroke-width="2"/>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="198" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Posisi matahari pada simbol "[${escapeXml(labelChar)}]" terjadi pada bulan ...</text>
</svg>`;
}

// 22. Musim dan Revolusi Bumi (Kemiringan Sumbu 23.5°)
export function renderMusimDanRevolusiBumiSvg(params: any): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="400" height="220" style="background:#0f172a; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="400" height="220" fill="#0f172a" stroke="#334155" stroke-width="1.5" rx="8"/>
  <text x="200" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#f8fafc">Revolusi Bumi &amp; Kemiringan Sumbu 23.5°</text>

  <!-- Orbit Elips Putus-putus -->
  <ellipse cx="200" cy="115" rx="140" ry="55" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Matahari di Pusat -->
  <circle cx="200" cy="115" r="22" fill="#f59e0b" stroke="#fbbf24" stroke-width="3" filter="drop-shadow(0 0 10px #f59e0b)"/>
  <text x="200" y="119" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">Matahari</text>

  <!-- Posisi Bumi Juni (Kiri) - Miring ke Arah Matahari -->
  <g transform="translate(70, 115)">
    <line x1="-12" y1="-28" x2="12" y2="28" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="15" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
    <text x="0" y="32" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#94a3b8">21 Juni</text>
  </g>

  <!-- Posisi Bumi Desember (Kanan) - Miring Menjauhi Matahari -->
  <g transform="translate(330, 115)">
    <line x1="-12" y1="-28" x2="12" y2="28" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="15" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
    <text x="0" y="32" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#94a3b8">22 Des</text>
    <!-- Target Badge -->
    <circle cx="0" cy="0" r="10" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
    <text x="0" y="4" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  </g>

  <text x="200" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#94a3b8">Kondisi musim di belahan bumi utara pada posisi "[${escapeXml(labelChar)}]" adalah musim ...</text>
</svg>`;
}

// 23. Siklus Karbon dan Oksigen
export function renderSiklusKarbonOksigenSvg(params: any): string {
  const pointer = String(params.pointer || params.tahap || 'fotosintesis').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'fotosintesis', name: 'Fotosintesis (Menyerap CO2, Melepas O2)', x: 105, y: 100 },
    { id: 'respirasi', name: 'Respirasi Hewan (Menghirup O2, Melepas CO2)', x: 275, y: 100 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="coArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
    </marker>
    <marker id="ocArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <rect width="380" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Daur Karbon Dioksida (CO2) &amp; Oksigen (O2)</text>

  <!-- Tumbuhan Hijau (Kiri) -->
  <g transform="translate(70, 100)">
    <circle cx="0" cy="0" r="30" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text x="0" y="5" text-anchor="middle" font-size="16">🌳</text>
    <text x="0" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#166534">Tumbuhan</text>
  </g>

  <!-- Hewan / Sapi (Kanan) -->
  <g transform="translate(310, 100)">
    <circle cx="0" cy="0" r="30" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text x="0" y="5" text-anchor="middle" font-size="16">🐄</text>
    <text x="0" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#92400e">Hewan</text>
  </g>

  <!-- Panah Atas: Oksigen (O2) dari Tumbuhan ke Hewan -->
  <path d="M 105 75 Q 190 45 275 75" fill="none" stroke="#0284c7" stroke-width="2.2" marker-end="url(#ocArr)"/>
  <text x="190" y="55" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Oksigen (O2)</text>

  <!-- Panah Bawah: Karbon Dioksida (CO2) dari Hewan ke Tumbuhan -->
  <path d="M 275 125 Q 190 155 105 125" fill="none" stroke="#059669" stroke-width="2.2" marker-end="url(#coArr)"/>
  <text x="190" y="152" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#047857">Karbon Dioksida (CO2)</text>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Gas yang dilepaskan pada alur bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}
