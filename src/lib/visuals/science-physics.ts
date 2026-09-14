/**
 * science-physics.ts
 * Physics, Mechanics, Energy, Heat & Optics SVG Visual Stimulus Renderers (19 Templates)
 */

import { escapeXml } from './types';

export function renderRangkaianListrikSvg(params: any): string {
  const model = (params.model || 'campuran').toLowerCase();
  const pointer = String(params.pointer || 'L1').toUpperCase();
  const labelChar = params.label || 'X';

  // State Saklar:
  // S1: default tertutup (true), kecuali eksplisit false / 'terbuka' / 'open'
  const isS1Closed = params.s1 === false || params.s1 === 'terbuka' || params.s1 === 'open' ? false : true;
  // S2: default terbuka (false), kecuali eksplisit true / 'tertutup' / 'closed'
  const isS2Closed = params.s2 === true || params.s2 === 'tertutup' || params.s2 === 'closed' ? true : false;

  // Logika nyala lampu otomatis
  let l1Lit = false;
  let l2Lit = false;
  let l3Lit = false;

  if (model === 'seri') {
    l1Lit = isS1Closed;
    l2Lit = isS1Closed;
  } else if (model === 'paralel') {
    l1Lit = isS1Closed;
    l2Lit = isS2Closed;
  } else {
    // Campuran: Garis utama ada Baterai, Saklar S1, Lampu L1
    // Cabang Atas: Lampu L2
    // Cabang Bawah: Saklar S2, Lampu L3
    if (isS1Closed) {
      l1Lit = true;
      l2Lit = true;
      l3Lit = isS2Closed;
    } else {
      l1Lit = false;
      l2Lit = false;
      l3Lit = false;
    }
  }

  // Override manual jika ditentukan
  if (params.l1 != null) l1Lit = Boolean(params.l1);
  if (params.l2 != null) l2Lit = Boolean(params.l2);
  if (params.l3 != null) l3Lit = Boolean(params.l3);

  // Helper bulb
  const drawBulb = (cx: number, cy: number, name: string, isLit: boolean, targetId: string) => {
    const isTarget = pointer === targetId || pointer === name;
    const bulbFill = isLit ? 'url(#bulb_glass_lit)' : 'url(#bulb_glass_off)';
    const bulbStroke = isLit ? '#d97706' : '#64748b';
    const filColor = isLit ? '#b45309' : '#94a3b8';

    let rays = '';
    if (isLit) {
      const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      rays = rayAngles.map(deg => {
        const rad = (deg * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * 20;
        const y1 = cy + Math.sin(rad) * 20;
        const x2 = cx + Math.cos(rad) * 27;
        const y2 = cy + Math.sin(rad) * 27;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>`;
      }).join('');
    }

    let targetBadge = '';
    if (isTarget) {
      targetBadge = `
        <circle cx="${cx}" cy="${cy - 28}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#elec_shadow)"/>
        <text x="${cx}" y="${cy - 23.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }

    return `
      <g>
        ${isLit ? `<circle cx="${cx}" cy="${cy}" r="26" fill="#fef08a" fill-opacity="0.38"/>` : ''}
        ${rays}
        <!-- Glass Bulb Body -->
        <circle cx="${cx}" cy="${cy}" r="16" fill="${bulbFill}" stroke="${bulbStroke}" stroke-width="2"/>
        <!-- Tungsten Filament -->
        <path d="M ${cx - 6} ${cy + 8} L ${cx - 3} ${cy - 2} L ${cx} ${cy + 1} L ${cx + 3} ${cy - 2} L ${cx + 6} ${cy + 8}" stroke="${filColor}" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
        <!-- Brass Threaded Socket Base -->
        <rect x="${cx - 6}" y="${cy + 14}" width="12" height="6" fill="#94a3b8" stroke="#475569" stroke-width="1" rx="1"/>
        <line x1="${cx - 5}" y1="${cy + 17}" x2="${cx + 5}" y2="${cy + 17}" stroke="#cbd5e1" stroke-width="1"/>
        <!-- Labels -->
        <text x="${cx}" y="${cy + 33}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${name}</text>
        <rect x="${cx - 18}" y="${cy + 39}" width="36" height="15" rx="3" fill="${isLit ? '#dcfce7' : '#f1f5f9'}" stroke="${isLit ? '#86efac' : '#cbd5e1'}" stroke-width="1"/>
        <text x="${cx}" y="${cy + 50}" text-anchor="middle" font-size="9" font-weight="bold" fill="${isLit ? '#15803d' : '#64748b'}">${isLit ? 'Nyala' : 'Padam'}</text>
        ${targetBadge}
      </g>
    `;
  };

  // Helper switch
  const drawSwitch = (x1: number, y: number, x2: number, name: string, isClosed: boolean, targetId: string) => {
    const isTarget = pointer === targetId || pointer === name;
    const mx = (x1 + x2) / 2;
    const leverY2 = isClosed ? y : y - 16;
    const leverX2 = isClosed ? x2 : x1 + (x2 - x1) * 0.85;
    const leverColor = isClosed ? '#16a34a' : '#dc2626';

    let targetBadge = '';
    if (isTarget) {
      targetBadge = `
        <circle cx="${mx}" cy="${y - 34}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#elec_shadow)"/>
        <text x="${mx}" y="${y - 29.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }

    return `
      <g>
        <!-- Ceramic Switch Mounting Pad -->
        <rect x="${x1 - 6}" y="${y - 6}" width="${x2 - x1 + 12}" height="12" rx="3" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
        <circle cx="${x1}" cy="${y}" r="4" fill="#b45309" stroke="#78350f" stroke-width="1"/>
        <circle cx="${x2}" cy="${y}" r="4" fill="#b45309" stroke="#78350f" stroke-width="1"/>
        <!-- Copper Knife Lever Arm -->
        <line x1="${x1}" y1="${y}" x2="${leverX2}" y2="${leverY2}" stroke="${leverColor}" stroke-width="3" stroke-linecap="round"/>
        <!-- Switch Labels -->
        <text x="${mx}" y="${y - 14}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${name}</text>
        <rect x="${mx - 24}" y="${y + 10}" width="48" height="15" rx="3" fill="${isClosed ? '#dcfce7' : '#fee2e2'}" stroke="${isClosed ? '#86efac' : '#fca5a5'}" stroke-width="1"/>
        <text x="${mx}" y="${y + 21}" text-anchor="middle" font-size="9" font-weight="bold" fill="${isClosed ? '#15803d' : '#b91c1c'}">${isClosed ? 'Tertutup' : 'Terbuka'}</text>
        ${targetBadge}
      </g>
    `;
  };

  // Battery helper (3D Cylindrical Cell)
  const drawBattery = (cx: number, cy: number) => `
    <g>
      <!-- Battery Body Outer Frame -->
      <rect x="${cx - 13}" y="${cy - 25}" width="26" height="50" rx="4" fill="url(#elec_battery_body)" stroke="#1e293b" stroke-width="1.8"/>
      <!-- Top Positive Terminal Nub -->
      <rect x="${cx - 6}" y="${cy - 31}" width="12" height="6" rx="2" fill="#f59e0b" stroke="#b45309" stroke-width="1"/>
      <!-- Positive/Negative Metallic Accent Lines -->
      <line x1="${cx - 11}" y1="${cy - 5}" x2="${cx + 11}" y2="${cy - 5}" stroke="#475569" stroke-width="1.2"/>
      <!-- Pole Labels -->
      <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">+</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="15" font-weight="bold" fill="#38bdf8">−</text>
      <!-- Component Label -->
      <text x="${cx - 22}" y="${cy + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#334155">Baterai</text>
    </g>
  `;

  let circuitContent = '';
  let modelTitle = 'Rangkaian Listrik Campuran';

  if (model === 'seri') {
    modelTitle = 'Rangkaian Listrik Seri';
    circuitContent = `
      <!-- Main Circuit Loop Wires -->
      <path d="M 80,140 L 80,100 L 480,100 L 480,230 L 80,230 L 80,190" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${isS1Closed ? `
        <!-- Current Flow Arrows -->
        <path d="M 80,118 L 80,100 L 110,100" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="4,4"/>
        <path d="M 480,130 L 480,230 L 300,230" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="4,4"/>
      ` : ''}
      ${drawBattery(80, 165)}
      ${drawSwitch(140, 100, 190, 'S₁', isS1Closed, 'S1')}
      ${drawBulb(280, 100, 'L₁', l1Lit, 'L1')}
      ${drawBulb(390, 100, 'L₂', l2Lit, 'L2')}
    `;
  } else if (model === 'paralel') {
    modelTitle = 'Rangkaian Listrik Paralel';
    circuitContent = `
      <!-- Battery Supply Rail -->
      <path d="M 80,140 L 80,110 L 150,110" fill="none" stroke="#1e293b" stroke-width="3"/>
      <path d="M 80,190 L 80,245 L 450,245 L 450,110" fill="none" stroke="#1e293b" stroke-width="3"/>
      ${drawBattery(80, 165)}

      <!-- Parallel Node 1 (Input Split) -->
      <line x1="150" y1="110" x2="150" y2="210" stroke="#1e293b" stroke-width="3"/>
      <circle cx="150" cy="110" r="4" fill="#0f172a"/>
      <circle cx="150" cy="210" r="4" fill="#0f172a"/>

      <!-- Branch 1 (Top) -->
      <line x1="150" y1="110" x2="450" y2="110" stroke="#1e293b" stroke-width="3"/>
      ${drawSwitch(190, 110, 240, 'S₁', isS1Closed, 'S1')}
      ${drawBulb(330, 110, 'L₁', l1Lit, 'L1')}

      <!-- Branch 2 (Bottom) -->
      <line x1="150" y1="210" x2="450" y2="210" stroke="#1e293b" stroke-width="3"/>
      ${drawSwitch(190, 210, 240, 'S₂', isS2Closed, 'S2')}
      ${drawBulb(330, 210, 'L₂', l2Lit, 'L2')}

      <!-- Parallel Node 2 (Output Merge) -->
      <line x1="450" y1="110" x2="450" y2="245" stroke="#1e293b" stroke-width="3"/>
      <circle cx="450" cy="110" r="4" fill="#0f172a"/>
      <circle cx="450" cy="210" r="4" fill="#0f172a"/>
    `;
  } else {
    // Campuran
    modelTitle = 'Rangkaian Listrik Campuran';
    circuitContent = `
      <!-- Main Supply Line from Battery -->
      <path d="M 80,140 L 80,100 L 130,100" fill="none" stroke="#1e293b" stroke-width="3"/>
      <path d="M 80,190 L 80,240 L 485,240 L 485,100" fill="none" stroke="#1e293b" stroke-width="3"/>
      ${drawBattery(80, 165)}

      <!-- Main Line: S1 Switch & L1 Bulb -->
      ${drawSwitch(130, 100, 175, 'S₁', isS1Closed, 'S1')}
      <line x1="175" y1="100" x2="235" y2="100" stroke="#1e293b" stroke-width="3"/>
      ${drawBulb(235, 100, 'L₁', l1Lit, 'L1')}
      <line x1="251" y1="100" x2="295" y2="100" stroke="#1e293b" stroke-width="3"/>

      <!-- Split Node into Parallel Branches -->
      <circle cx="295" cy="100" r="4" fill="#0f172a"/>
      <path d="M 295,100 L 295,170 L 320,170" fill="none" stroke="#1e293b" stroke-width="3"/>

      <!-- Branch A (Top): L2 Bulb -->
      <line x1="295" y1="100" x2="485" y2="100" stroke="#1e293b" stroke-width="3"/>
      ${drawBulb(375, 100, 'L₂', l2Lit, 'L2')}

      <!-- Branch B (Bottom): S2 Switch & L3 Bulb -->
      <line x1="320" y1="170" x2="485" y2="170" stroke="#1e293b" stroke-width="3"/>
      ${drawSwitch(325, 170, 365, 'S₂', isS2Closed, 'S2')}
      ${drawBulb(425, 170, 'L₃', l3Lit, 'L3')}

      <!-- Merge Node -->
      <circle cx="485" cy="100" r="4" fill="#0f172a"/>
      <circle cx="485" cy="170" r="4" fill="#0f172a"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 320" width="560" height="320" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="elec_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="elec_card_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="elec_battery_body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="bulb_glass_lit" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#fde047"/>
    </radialGradient>
    <radialGradient id="bulb_glass_off" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </radialGradient>
  </defs>

  <!-- Frame Background -->
  <rect x="4" y="4" width="552" height="312" rx="10" fill="url(#elec_card_bg)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#elec_shadow)"/>

  <!-- Header Section -->
  <rect x="150" y="10" width="260" height="18" rx="9" fill="#e0f2fe"/>
  <text x="280" y="22" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1" letter-spacing="0.5">FISIKA &amp; KELISTRIKAN - SIRKUIT ARUS SEARAH</text>
  <text x="280" y="42" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">${modelTitle}</text>
  <text x="280" y="56" text-anchor="middle" font-size="9.5" font-weight="500" fill="#64748b">Analisis aliran arus listrik, status sakelar, dan kondisi nyala/padam lampu</text>

  <!-- Circuit Schematic Area -->
  ${circuitContent}

  <!-- Bottom Interactive Question Prompt Banner -->
  <rect x="60" y="286" width="440" height="24" rx="6" fill="#0f172a"/>
  <text x="280" y="302" text-anchor="middle" font-size="11" font-weight="600" fill="#f8fafc">Perhatikan komponen yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

export function renderPerubahanWujudSvg(params: any): string {
  const pointer = String(params.pointer || '1').toLowerCase();
  const labelChar = params.label || 'X';

  let activeNum = 1;
  if (pointer === '1' || (pointer.includes('cair') && !pointer.includes('padat')) || pointer.includes('mencair')) activeNum = 1;
  else if (pointer === '2' || pointer.includes('beku') || pointer.includes('membeku')) activeNum = 2;
  else if (pointer === '3' || pointer.includes('uap') || pointer.includes('menguap')) activeNum = 3;
  else if (pointer === '4' || pointer.includes('embun') || pointer.includes('mengembun')) activeNum = 4;
  else if (pointer === '5' || pointer.includes('sublim') || pointer.includes('menyublim')) activeNum = 5;
  else if (pointer === '6' || pointer.includes('kristal') || pointer.includes('deposisi')) activeNum = 6;
  else if (params.pointer && !isNaN(Number(params.pointer))) activeNum = Number(params.pointer);

  const drawArrowBadge = (x: number, y: number, num: number) => {
    const isActive = activeNum === num;
    if (isActive) {
      return `
        <circle cx="${x}" cy="${y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
        <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }
    return `
      <circle cx="${x}" cy="${y}" r="11" fill="#475569" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${num}</text>
    `;
  };

  const getArrowColor = (num: number) => activeNum === num ? '#e11d48' : '#64748b';
  const getArrowWidth = (num: number) => activeNum === num ? '3' : '2';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 280" width="440" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrWujudNormal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b" />
    </marker>
    <marker id="arrWujudActive" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <rect width="440" height="280" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="220" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Perubahan Wujud Zat</text>

  <!-- KOTAK WUJUD ZAT -->
  <!-- 1. CAIR (Atas Tengah) -->
  <g transform="translate(170, 42)">
    <rect width="100" height="46" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
    <text x="50" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#065f46">CAIR</text>
  </g>

  <!-- 2. PADAT (Kiri Bawah) -->
  <g transform="translate(35, 190)">
    <rect width="100" height="46" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text x="50" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e3a8a">PADAT</text>
  </g>

  <!-- 3. GAS (Kanan Bawah) -->
  <g transform="translate(305, 190)">
    <rect width="100" height="46" rx="8" fill="#faf5ff" stroke="#a855f7" stroke-width="2"/>
    <text x="50" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#6b21a8">GAS</text>
  </g>

  <!-- 6 PANAH PERUBAHAN WUJUD (ZERO-SPOILER) -->
  <!-- Panah 1: Padat -> Cair (Mencair) -->
  <path d="M 90,185 Q 115,115 170,80" fill="none" stroke="${getArrowColor(1)}" stroke-width="${getArrowWidth(1)}" marker-end="url(#${activeNum === 1 ? 'arrWujudActive' : 'arrWujudNormal'})"/>
  ${drawArrowBadge(118, 125, 1)}

  <!-- Panah 2: Cair -> Padat (Membeku) -->
  <path d="M 165,70 Q 75,100 70,185" fill="none" stroke="${getArrowColor(2)}" stroke-width="${getArrowWidth(2)}" marker-end="url(#${activeNum === 2 ? 'arrWujudActive' : 'arrWujudNormal'})"/>
  ${drawArrowBadge(150, 150, 2)}

  <!-- Panah 3: Cair -> Gas (Menguap) -->
  <path d="M 270,80 Q 325,115 350,185" fill="none" stroke="${getArrowColor(3)}" stroke-width="${getArrowWidth(3)}" marker-end="url(#${activeNum === 3 ? 'arrWujudActive' : 'arrWujudNormal'})"/>
  ${drawArrowBadge(322, 125, 3)}

  <!-- Panah 4: Gas -> Cair (Mengembun) -->
  <path d="M 370,185 Q 365,100 275,70" fill="none" stroke="${getArrowColor(4)}" stroke-width="${getArrowWidth(4)}" marker-end="url(#${activeNum === 4 ? 'arrWujudActive' : 'arrWujudNormal'})"/>
  ${drawArrowBadge(290, 150, 4)}

  <!-- Panah 5: Padat -> Gas (Menyublim) -->
  <path d="M 140,205 Q 220,185 300,205" fill="none" stroke="${getArrowColor(5)}" stroke-width="${getArrowWidth(5)}" marker-end="url(#${activeNum === 5 ? 'arrWujudActive' : 'arrWujudNormal'})"/>
  ${drawArrowBadge(220, 190, 5)}

  <!-- Panah 6: Gas -> Padat (Mengkristal) -->
  <path d="M 300,225 Q 220,245 140,225" fill="none" stroke="${getArrowColor(6)}" stroke-width="${getArrowWidth(6)}" marker-end="url(#${activeNum === 6 ? 'arrWujudActive' : 'arrWujudNormal'})"/>
  ${drawArrowBadge(220, 240, 6)}

  <!-- Keterangan Soal di Bawah -->
  <text x="220" y="270" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan proses perubahan wujud zat yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

export function renderMagnetSvg(params: any): string {
  const interaksi = (params.interaksi || 'tarik').toLowerCase();
  const labelChar = params.label || 'X';
  const pointer = String(params.pointer || 'kanan2').toLowerCase();

  const isTarik = interaksi === 'tarik';
  const m2Left = isTarik ? 'U' : 'S';
  const m2Right = isTarik ? 'S' : 'U';

  const m1X = 40;
  const m1Y = 96;
  const m2X = 370;
  const m2Y = 96;
  const mw = 150;
  const mh = 62;
  const halfW = mw / 2;

  const isTargetM1Kiri = pointer === 'kiri1' || pointer === 'm1kiri';
  const isTargetM1Kanan = pointer === 'kanan1' || pointer === 'm1kanan';
  const isTargetM2Kiri = pointer === 'kiri2' || pointer === 'm2kiri';
  const isTargetM2Right = pointer === 'kanan2' || pointer === 'x' || pointer === 'm2kanan' || (!isTargetM1Kiri && !isTargetM1Kanan && !isTargetM2Kiri);

  const drawPoleBadge = (bx: number, by: number) => `
    <circle cx="${bx}" cy="${by}" r="15" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#mag_shadow)"/>
    <text x="${bx}" y="${by + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" width="560" height="300" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="mag_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="mag_card_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="mag_red_u" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="40%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
    <linearGradient id="mag_blue_s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="40%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <marker id="arrMagR" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#1e293b" />
    </marker>
    <marker id="arrMagL" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#1e293b" />
    </marker>
    <marker id="arrFluxB" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 2 L 8 5 L 0 8 z" fill="#0284c7" />
    </marker>
  </defs>

  <!-- Outer Frame -->
  <rect x="4" y="4" width="552" height="292" rx="10" fill="url(#mag_card_bg)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#mag_shadow)"/>

  <!-- Header Section -->
  <rect x="150" y="10" width="260" height="18" rx="9" fill="#e0f2fe"/>
  <text x="280" y="22" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1" letter-spacing="0.5">FISIKA &amp; KEMAGNETAN - HUKUM KUTUB MAGNET</text>
  <text x="280" y="42" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Interaksi Gaya Magnet</text>
  <text x="280" y="56" text-anchor="middle" font-size="9.5" font-weight="500" fill="#64748b">Pola garis gaya magnet dan sifat interaksi kutub senama &amp; tak senama</text>

  <!-- MAGNET 1 (KIRI) -->
  <g>
    <!-- Kutub Utara (U) -->
    <rect x="${m1X}" y="${m1Y}" width="${halfW}" height="${mh}" rx="4" fill="url(#mag_red_u)" stroke="#991b1b" stroke-width="2"/>
    <rect x="${m1X + 3}" y="${m1Y + 3}" width="${halfW - 6}" height="6" rx="2" fill="#ffffff" fill-opacity="0.25"/>
    ${isTargetM1Kiri ? drawPoleBadge(m1X + halfW / 2, m1Y + mh / 2) : `
      <text x="${m1X + halfW / 2}" y="${m1Y + mh / 2 + 7}" text-anchor="middle" font-size="22" font-weight="bold" fill="#ffffff">U</text>
    `}

    <!-- Kutub Selatan (S) -->
    <rect x="${m1X + halfW}" y="${m1Y}" width="${halfW}" height="${mh}" rx="4" fill="url(#mag_blue_s)" stroke="#1e40af" stroke-width="2"/>
    <rect x="${m1X + halfW + 3}" y="${m1Y + 3}" width="${halfW - 6}" height="6" rx="2" fill="#ffffff" fill-opacity="0.25"/>
    ${isTargetM1Kanan ? drawPoleBadge(m1X + halfW * 1.5, m1Y + mh / 2) : `
      <text x="${m1X + halfW * 1.5}" y="${m1Y + mh / 2 + 7}" text-anchor="middle" font-size="22" font-weight="bold" fill="#ffffff">S</text>
    `}

    <!-- Divider notch -->
    <line x1="${m1X + halfW}" y1="${m1Y}" x2="${m1X + halfW}" y2="${m1Y + mh}" stroke="#0f172a" stroke-width="2"/>

    <!-- Label Magnet 1 -->
    <rect x="${m1X + halfW - 36}" y="${m1Y + mh + 10}" width="72" height="18" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <text x="${m1X + halfW}" y="${m1Y + mh + 23}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#334155">Magnet 1</text>
  </g>

  <!-- INTERAKSI GAYA & MEDAN MAGNET (TENGAH) -->
  <g>
    ${isTarik ? `
      <!-- Garis Gaya Magnetik Tarik-Menarik (Menyatu Antar Kutub) -->
      <path d="M 190,110 Q 280,85 370,110" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,4" marker-end="url(#arrFluxB)"/>
      <line x1="190" y1="127" x2="370" y2="127" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,4"/>
      <path d="M 190,144 Q 280,169 370,144" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="4,4" marker-end="url(#arrFluxB)"/>

      <!-- Vektor Gaya Tarik (Menuju Satu Sama Lain) -->
      <line x1="210" y1="127" x2="255" y2="127" stroke="#16a34a" stroke-width="3.5" marker-end="url(#arrMagR)"/>
      <line x1="350" y1="127" x2="305" y2="127" stroke="#16a34a" stroke-width="3.5" marker-end="url(#arrMagL)"/>

      <!-- Badge Status Interaksi -->
      <rect x="225" y="86" width="110" height="24" rx="12" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
      <text x="280" y="102" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Tarik-Menarik</text>
      <text x="280" y="160" text-anchor="middle" font-size="9" font-weight="600" fill="#64748b">Kutub Tidak Senama (U - S)</text>
    ` : `
      <!-- Garis Gaya Magnetik Tolak-Menolak (Membelok Menjauh) -->
      <path d="M 190,114 Q 240,114 240,78" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="4,4"/>
      <path d="M 190,140 Q 240,140 240,176" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="4,4"/>
      <path d="M 370,114 Q 320,114 320,78" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="4,4"/>
      <path d="M 370,140 Q 320,140 320,176" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="4,4"/>
      <!-- Titik Netral di Tengah -->
      <circle cx="280" cy="127" r="3" fill="#94a3b8"/>

      <!-- Vektor Gaya Tolak (Menjauh Satu Sama Lain) -->
      <line x1="250" y1="127" x2="205" y2="127" stroke="#dc2626" stroke-width="3.5" marker-end="url(#arrMagL)"/>
      <line x1="310" y1="127" x2="355" y2="127" stroke="#dc2626" stroke-width="3.5" marker-end="url(#arrMagR)"/>

      <!-- Badge Status Interaksi -->
      <rect x="225" y="86" width="110" height="24" rx="12" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
      <text x="280" y="102" text-anchor="middle" font-size="11" font-weight="bold" fill="#b91c1c">Tolak-Menolak</text>
      <text x="280" y="160" text-anchor="middle" font-size="9" font-weight="600" fill="#64748b">Kutub Senama (${m2Left} - ${m2Left})</text>
    `}
  </g>

  <!-- MAGNET 2 (KANAN) -->
  <g>
    <!-- Kutub Kiri Magnet 2 -->
    <rect x="${m2X}" y="${m2Y}" width="${halfW}" height="${mh}" rx="4" fill="${m2Left === 'U' ? 'url(#mag_red_u)' : 'url(#mag_blue_s)'}" stroke="${m2Left === 'U' ? '#991b1b' : '#1e40af'}" stroke-width="2"/>
    <rect x="${m2X + 3}" y="${m2Y + 3}" width="${halfW - 6}" height="6" rx="2" fill="#ffffff" fill-opacity="0.25"/>
    ${isTargetM2Kiri ? drawPoleBadge(m2X + halfW / 2, m2Y + mh / 2) : `
      <text x="${m2X + halfW / 2}" y="${m2Y + mh / 2 + 7}" text-anchor="middle" font-size="22" font-weight="bold" fill="#ffffff">${m2Left}</text>
    `}

    <!-- Kutub Kanan Magnet 2 -->
    <rect x="${m2X + halfW}" y="${m2Y}" width="${halfW}" height="${mh}" rx="4" fill="${m2Right === 'U' ? 'url(#mag_red_u)' : 'url(#mag_blue_s)'}" stroke="${m2Right === 'U' ? '#991b1b' : '#1e40af'}" stroke-width="2"/>
    <rect x="${m2X + halfW + 3}" y="${m2Y + 3}" width="${halfW - 6}" height="6" rx="2" fill="#ffffff" fill-opacity="0.25"/>
    ${isTargetM2Right ? drawPoleBadge(m2X + halfW * 1.5, m2Y + mh / 2) : `
      <text x="${m2X + halfW * 1.5}" y="${m2Y + mh / 2 + 7}" text-anchor="middle" font-size="22" font-weight="bold" fill="#ffffff">${m2Right}</text>
    `}

    <!-- Divider notch -->
    <line x1="${m2X + halfW}" y1="${m2Y}" x2="${m2X + halfW}" y2="${m2Y + mh}" stroke="#0f172a" stroke-width="2"/>

    <!-- Label Magnet 2 -->
    <rect x="${m2X + halfW - 36}" y="${m2Y + mh + 10}" width="72" height="18" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <text x="${m2X + halfW}" y="${m2Y + mh + 23}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#334155">Magnet 2</text>
  </g>

  <!-- Bottom Interactive Question Prompt Banner -->
  <rect x="60" y="260" width="440" height="24" rx="6" fill="#0f172a"/>
  <text x="280" y="276" text-anchor="middle" font-size="11" font-weight="600" fill="#f8fafc">Perhatikan kutub magnet yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!${isTargetM1Kiri || isTargetM1Kanan || isTargetM2Kiri || isTargetM2Right ? '' : ` [${escapeXml(labelChar)}]`}</text>
</svg>`;
}

export function renderSifatCahayaSvg(params: any): string {
  const peristiwa = (params.peristiwa || 'pembiasan').toLowerCase();
  const labelChar = params.label || 'X';

  if (peristiwa === 'pemantulan') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 250" width="460" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrCahaya" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#d97706" />
    </marker>
  </defs>

  <rect width="460" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Sifat Cahaya (Pemantulan)</text>

  <line x1="230" y1="40" x2="230" y2="180" stroke="#475569" stroke-width="1.8" stroke-dasharray="4,4"/>
  <text x="230" y="34" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#475569">Garis Normal</text>

  <rect x="50" y="180" width="360" height="8" fill="#94a3b8" rx="1"/>
  <g stroke="#cbd5e1" stroke-width="1.5">
    ${[70, 110, 150, 190, 230, 270, 310, 350, 390].map(x => `<line x1="${x}" y1="188" x2="${x - 10}" y2="200"/>`).join('')}
  </g>
  <text x="230" y="210" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Cermin Datar</text>

  <line x1="100" y1="65" x2="230" y2="180" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrCahaya)"/>
  <text x="120" y="105" font-size="11" font-weight="bold" fill="#b45309">Sinar Datang</text>

  <line x1="230" y1="180" x2="360" y2="65" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrCahaya)"/>
  <text x="310" y="105" font-size="11" font-weight="bold" fill="#b45309">Sinar Pantul</text>

  <path d="M 210,160 A 30 30 0 0 1 230,150" fill="none" stroke="#dc2626" stroke-width="1.5"/>
  <text x="215" y="152" font-size="12" font-weight="bold" fill="#dc2626">i</text>
  <path d="M 230,150 A 30 30 0 0 1 250,160" fill="none" stroke="#dc2626" stroke-width="1.5"/>
  <text x="240" y="152" font-size="12" font-weight="bold" fill="#dc2626">r</text>

  <circle cx="370" cy="55" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="370" y="59.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="230" y="238" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan sifat pemantulan cahaya yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 260" width="460" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrCahayaBias" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#d97706" />
    </marker>
  </defs>

  <rect width="460" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Diagram Sifat Cahaya (Pembiasan)</text>

  <rect x="20" y="130" width="420" height="95" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1" rx="2"/>
  <text x="40" y="160" font-size="11" font-weight="bold" fill="#0369a1">Medium 2: Air</text>
  <text x="40" y="100" font-size="11" font-weight="bold" fill="#475569">Medium 1: Udara</text>

  <line x1="20" y1="130" x2="440" y2="130" stroke="#0284c7" stroke-width="1.8"/>

  <line x1="230" y1="40" x2="230" y2="220" stroke="#475569" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="230" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Garis Normal</text>

  <line x1="110" y1="45" x2="230" y2="130" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrCahayaBias)"/>
  <text x="125" y="80" font-size="11" font-weight="bold" fill="#b45309">Sinar Datang</text>

  <line x1="230" y1="130" x2="295" y2="215" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrCahayaBias)"/>
  <text x="310" y="195" font-size="11" font-weight="bold" fill="#b45309">Sinar Bias</text>

  <path d="M 215,115 A 25 25 0 0 1 230,105" fill="none" stroke="#dc2626" stroke-width="1.5"/>
  <text x="220" y="112" font-size="11" font-weight="bold" fill="#dc2626">i</text>

  <path d="M 230,155 A 25 25 0 0 1 245,150" fill="none" stroke="#dc2626" stroke-width="1.5"/>
  <text x="235" y="166" font-size="11" font-weight="bold" fill="#dc2626">r</text>

  <g>
    <circle cx="340" cy="180" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="340" y="184.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
    <line x1="326" y1="182" x2="280" y2="190" stroke="#e11d48" stroke-width="1.8"/>
  </g>

  <text x="230" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan jalannya berkas cahaya yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

/**
 * Render Pesawat Sederhana (Tuas/Pengungkit & Katrol)
 * Menampilkan titik tumpu, beban, kuasa, serta variasi tuas jenis 1, 2, 3 atau katrol
 */
export function renderPesawatSederhanaSvg(params: {
  jenis?: 'tuas' | 'katrol';
  tipeTuas?: 1 | 2 | 3;
  tipeKatrol?: 'tetap' | 'bebas';
  beban?: number;
  pointer?: string;
  label?: string;
}): string {
  const jenis = (params.jenis || 'tuas').toLowerCase();
  const labelChar = params.label || 'X';
  const pointer = (params.pointer || 'tumpu').toLowerCase();

  if (jenis === 'katrol') {
    const tipeKatrol = params.tipeKatrol || 'tetap';
    const isTetap = tipeKatrol === 'tetap';

    let target = isTetap ? { x: 280, y: 130 } : { x: 280, y: 165 };
    const isTargetBeban = pointer.includes('beban');
    const isTargetKuasa = pointer.includes('kuasa') || pointer.includes('tali');

    if (isTargetBeban) {
      target = isTetap ? { x: 242, y: 236 } : { x: 280, y: 228 };
    } else if (isTargetKuasa) {
      target = isTetap ? { x: 356, y: 215 } : { x: 356, y: 125 };
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340" width="560" height="340" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
    <defs>
      <filter id="pulley_shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
      </filter>
      <linearGradient id="pulley_card_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <marker id="arrForce" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
      </marker>
      <marker id="arrForceUp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#dc2626" />
      </marker>
    </defs>

    <!-- Frame Background -->
    <rect x="4" y="4" width="552" height="332" rx="10" fill="url(#pulley_card_bg)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#pulley_shadow)"/>

    <!-- Header Section -->
    <rect x="150" y="10" width="260" height="18" rx="9" fill="#e0f2fe"/>
    <text x="280" y="22" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1" letter-spacing="0.5">FISIKA MEKANIKA - PESAWAT SEDERHANA</text>
    <text x="280" y="42" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Pesawat Sederhana: Katrol ${isTetap ? 'Tetap' : 'Bebas'}</text>
    <text x="280" y="58" text-anchor="middle" font-size="9.5" font-weight="500" fill="#64748b">Prinsip kerja katrol ${isTetap ? 'tetap (mengubah arah gaya kuasa, KM = 1)' : 'bebas (meringankan gaya angkat beban, KM = 2)'}</text>

    <!-- Langit-langit (Gantungan Tetap Berarsir) -->
    <rect x="180" y="72" width="200" height="14" fill="#475569" rx="2"/>
    <g stroke="#334155" stroke-width="1.5">
      ${[190, 210, 230, 250, 270, 290, 310, 330, 350, 370].map(hx => `<line x1="${hx}" y1="72" x2="${hx - 8}" y2="64"/>`).join('')}
    </g>

    ${isTetap ? `
      <!-- Gantungan Poros Katrol Tetap -->
      <line x1="280" y1="86" x2="280" y2="130" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>

      <!-- Roda Katrol Beralur -->
      <circle cx="280" cy="130" r="38" fill="#f1f5f9" stroke="#1e293b" stroke-width="3"/>
      <circle cx="280" cy="130" r="30" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="280" cy="130" r="7" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>

      <!-- Tali Kiri (ke Beban) -->
      <line x1="242" y1="130" x2="242" y2="210" stroke="#334155" stroke-width="3.5"/>
      <!-- Kait Gantungan Beban -->
      <path d="M 242,204 Q 236,212 242,212 Q 248,212 242,204" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
      <!-- Beban Kotak W (Besi Tempa) -->
      <rect x="218" y="212" width="48" height="42" rx="4" fill="#475569" stroke="#0f172a" stroke-width="2"/>
      ${!isTargetBeban ? `<text x="242" y="238" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">W</text>` : ''}
      <text x="242" y="272" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">Beban</text>

      <!-- Tali Kanan (Kuasa F ditarik ke bawah) -->
      <line x1="318" y1="130" x2="318" y2="195" stroke="#334155" stroke-width="3.5"/>
      <line x1="318" y1="195" x2="318" y2="245" stroke="#dc2626" stroke-width="3.5" marker-end="url(#arrForce)"/>
      <text x="336" y="235" font-size="12" font-weight="bold" fill="#dc2626">Kuasa (F)</text>
    ` : `
      <!-- Tali Tetap Tergantung di Langit-langit Kiri -->
      <line x1="242" y1="86" x2="242" y2="165" stroke="#334155" stroke-width="3.5"/>
      <circle cx="242" cy="86" r="4" fill="#0f172a"/>

      <!-- Roda Katrol Bebas Bergerak -->
      <circle cx="280" cy="165" r="38" fill="#f1f5f9" stroke="#1e293b" stroke-width="3"/>
      <circle cx="280" cy="165" r="30" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="280" cy="165" r="7" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>

      <!-- Gantungan Beban dari Poros Roda -->
      <line x1="280" y1="172" x2="280" y2="204" stroke="#1e293b" stroke-width="3"/>
      <rect x="256" y="204" width="48" height="42" rx="4" fill="#475569" stroke="#0f172a" stroke-width="2"/>
      ${!isTargetBeban ? `<text x="280" y="230" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">W</text>` : ''}
      <text x="280" y="264" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">Beban</text>

      <!-- Tali Kanan Ditarik ke Atas -->
      <line x1="318" y1="165" x2="318" y2="115" stroke="#dc2626" stroke-width="3.5" marker-end="url(#arrForceUp)"/>
      <text x="336" y="125" font-size="12" font-weight="bold" fill="#dc2626">Kuasa (F)</text>
    `}

    <!-- Target Badge X -->
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#pulley_shadow)"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

    <!-- Bottom Interactive Question Prompt Banner -->
    <rect x="60" y="294" width="440" height="24" rx="6" fill="#0f172a"/>
    <text x="280" y="310" text-anchor="middle" font-size="11" font-weight="600" fill="#f8fafc">Titik/bagian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
  </svg>`;
  }

  // Default: Tuas / Pengungkit
  const tipeTuas = params.tipeTuas || 1;
  // Tuas Jenis 1: Beban - Tumpu - Kuasa
  // Tuas Jenis 2: Tumpu - Beban - Kuasa
  // Tuas Jenis 3: Tumpu - Kuasa - Beban

  let tumpuX = 260;
  let bebanX = 130;
  let kuasaX = 420;
  let kuasaDir = 'down'; // panah ke bawah

  if (tipeTuas === 2) {
    tumpuX = 90;
    bebanX = 250;
    kuasaX = 440;
    kuasaDir = 'up';
  } else if (tipeTuas === 3) {
    tumpuX = 90;
    kuasaX = 250;
    bebanX = 420;
    kuasaDir = 'up';
  }

  const isTargetBeban = pointer.includes('beban');
  const isTargetKuasa = pointer.includes('kuasa');

  let target = { x: tumpuX, y: 205 };
  if (isTargetBeban) target = { x: bebanX, y: 145 };
  else if (isTargetKuasa) target = { x: kuasaX, y: 135 };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340" width="560" height="340" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="lever_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="lever_card_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="mech_beam_grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="mech_tumpu_grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <marker id="arrForceTuas" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
    </marker>
    <marker id="arrForceTuasUp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#dc2626" />
    </marker>
  </defs>

  <!-- Frame Background -->
  <rect x="4" y="4" width="552" height="332" rx="10" fill="url(#lever_card_bg)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#lever_shadow)"/>

  <!-- Header Section -->
  <rect x="150" y="10" width="260" height="18" rx="9" fill="#e0f2fe"/>
  <text x="280" y="22" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1" letter-spacing="0.5">FISIKA MEKANIKA - PESAWAT SEDERHANA</text>
  <text x="280" y="42" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Pesawat Sederhana: Tuas / Pengungkit (Jenis ${tipeTuas})</text>
  <text x="280" y="58" text-anchor="middle" font-size="9.5" font-weight="500" fill="#64748b">Analisis titik tumpu, lengan beban, lengan kuasa, dan keuntungan mekanis</text>

  <!-- Garis Landasan / Meja Percobaan -->
  <line x1="40" y1="230" x2="520" y2="230" stroke="#94a3b8" stroke-width="2.5"/>
  <g stroke="#cbd5e1" stroke-width="1.5">
    ${[60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460, 500].map(gx => `<line x1="${gx}" y1="230" x2="${gx - 10}" y2="242"/>`).join('')}
  </g>

  <!-- Batang Tuas Berskala Logam -->
  <rect x="50" y="165" width="460" height="15" rx="3" fill="url(#mech_beam_grad)" stroke="#1e293b" stroke-width="2"/>
  <g stroke="#94a3b8" stroke-width="1">
    ${[80, 110, 140, 170, 200, 230, 260, 290, 320, 350, 380, 410, 440, 470].map(tx => `<line x1="${tx}" y1="165" x2="${tx}" y2="171"/>`).join('')}
  </g>

  <!-- Titik Tumpu (Segitiga Prisma 3D) -->
  <polygon points="${tumpuX},180 ${tumpuX - 22},230 ${tumpuX + 22},230" fill="url(#mech_tumpu_grad)" stroke="#0f172a" stroke-width="2"/>
  <circle cx="${tumpuX}" cy="180" r="4.5" fill="#f59e0b"/>
  <text x="${tumpuX}" y="252" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Titik Tumpu</text>

  <!-- Beban (Kotak W Besi Tempa) -->
  <rect x="${bebanX - 24}" y="115" width="48" height="48" rx="4" fill="#64748b" stroke="#0f172a" stroke-width="2"/>
  ${!isTargetBeban ? `<text x="${bebanX}" y="145" text-anchor="middle" font-size="15" font-weight="bold" fill="#ffffff">W</text>` : ''}
  <text x="${bebanX}" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">Beban</text>

  <!-- Kuasa (Vektor Panah F) -->
  ${kuasaDir === 'down' ? `
    <line x1="${kuasaX}" y1="105" x2="${kuasaX}" y2="160" stroke="#dc2626" stroke-width="3.5" marker-end="url(#arrForceTuas)"/>
    <text x="${kuasaX}" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Kuasa (F)</text>
  ` : `
    <line x1="${kuasaX}" y1="180" x2="${kuasaX}" y2="115" stroke="#dc2626" stroke-width="3.5" marker-end="url(#arrForceTuasUp)"/>
    <text x="${kuasaX}" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Kuasa (F)</text>
  `}

  <!-- Target Badge X -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#lever_shadow)"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Bottom Interactive Question Prompt Banner -->
  <rect x="60" y="294" width="440" height="24" rx="6" fill="#0f172a"/>
  <text x="280" y="310" text-anchor="middle" font-size="11" font-weight="600" fill="#f8fafc">Bagian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 16. Render Percobaan Listrik Baterai Buah (Sel Volta) */
export function renderBateraiBuahSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'led').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 190, y: 65, name: 'Lampu LED' };
  if (pointer.includes('seng') || pointer.includes('zn') || pointer.includes('anode') || pointer.includes('negatif')) target = { x: 130, y: 135, name: 'Lempeng Seng (Zn)' };
  else if (pointer.includes('tembaga') || pointer.includes('cu') || pointer.includes('katode') || pointer.includes('positif')) target = { x: 250, y: 135, name: 'Lempeng Tembaga (Cu)' };
  else if (pointer.includes('jeruk') || pointer.includes('lemon') || pointer.includes('elektrolit')) target = { x: 190, y: 175, name: 'Elektrolit Buah Jeruk' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="190" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Percobaan Sel Volta (Baterai Buah Lemon)</text>

  <!-- Buah Lemon Segar -->
  <ellipse cx="190" cy="175" rx="85" ry="45" fill="#fef08a" stroke="#eab308" stroke-width="2.5"/>
  <ellipse cx="190" cy="175" rx="72" ry="36" fill="#fef9c3" stroke="#fde047" stroke-width="1.2"/>
  <text x="190" y="195" text-anchor="middle" font-size="9" font-weight="600" fill="#a16207">Elektrolit Asam Sitrat</text>

  <!-- Elektrode Kiri: Seng (Zn / Kutub -) -->
  <rect x="122" y="115" width="16" height="50" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
  <text x="130" y="105" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">Seng (Zn) [-]</text>

  <!-- Elektrode Kanan: Tembaga (Cu / Kutub +) -->
  <rect x="242" y="115" width="16" height="50" rx="2" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/>
  <text x="250" y="105" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#9a3412">Tembaga (Cu) [+]</text>

  <!-- Kabel Penghubung -->
  <path d="M 130,115 L 130,65 L 180,65" fill="none" stroke="#3b82f6" stroke-width="2"/>
  <path d="M 250,115 L 250,65 L 200,65" fill="none" stroke="#ef4444" stroke-width="2"/>

  <!-- Lampu LED Menyala -->
  <circle cx="190" cy="65" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
  <circle cx="190" cy="65" r="8" fill="#facc15"/>
  <path d="M 190,45 L 190,38 M 175,50 L 168,44 M 205,50 L 212,44" stroke="#eab308" stroke-width="1.5"/>
  <text x="190" y="90" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#854d0e">Lampu LED</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Komponen yang ditandai dengan huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 17. Render Prinsip Kerja Optik Periskop */
export function renderOptikPeriskopSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'cermin').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 200, y: 70, name: 'Cermin Datar Atas' };
  if (pointer.includes('bawah') || pointer.includes('cermin 2')) target = { x: 140, y: 190, name: 'Cermin Datar Bawah' };
  else if (pointer.includes('sudut') || pointer.includes('45')) target = { x: 215, y: 85, name: 'Sudut 45 Derajat' };
  else if (pointer.includes('mata') || pointer.includes('pengamat')) target = { x: 85, y: 190, name: 'Mata Pengamat' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="190" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Prinsip Kerja Optik Periskop Sederhana</text>

  <!-- Tabung Periskop Berbentuk Huruf Z -->
  <path d="M 280,50 L 180,50 L 180,170 L 120,170 L 120,210 L 220,210 L 220,90 L 280,90 Z" fill="#f1f5f9" stroke="#475569" stroke-width="2.5"/>

  <!-- Cermin Datar Atas (Miring 45 Derajat) -->
  <line x1="180" y1="50" x2="220" y2="90" stroke="#0284c7" stroke-width="4.5"/>
  <text x="235" y="65" font-size="8.5" font-weight="bold" fill="#0369a1">Cermin 45°</text>

  <!-- Cermin Datar Bawah (Miring 45 Derajat) -->
  <line x1="180" y1="170" x2="220" y2="210" stroke="#0284c7" stroke-width="4.5"/>
  <text x="230" y="195" font-size="8.5" font-weight="bold" fill="#0369a1">Cermin 45°</text>

  <!-- Berkas Sinar Cahaya Merah Terpantul -->
  <line x1="310" y1="70" x2="200" y2="70" stroke="#e11d48" stroke-width="2"/>
  <line x1="200" y1="70" x2="200" y2="190" stroke="#e11d48" stroke-width="2"/>
  <line x1="200" y1="190" x2="100" y2="190" stroke="#e11d48" stroke-width="2"/>

  <!-- Panah Arah Cahaya -->
  <polygon points="245,67 245,73 253,70" fill="#e11d48"/>
  <polygon points="197,130 203,130 200,138" fill="#e11d48"/>
  <polygon points="150,187 150,193 142,190" fill="#e11d48"/>

  <!-- Objek & Mata Pengamat -->
  <text x="325" y="74" font-size="9" font-weight="bold" fill="#0f172a">Benda</text>
  <text x="55" y="194" font-size="9" font-weight="bold" fill="#0f172a">Mata</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Komponen atau arah berkas pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 18. Render Pembentukan Bayangan Pada Lup (Kaca Pembesar) */
export function renderKacaPembesarLupSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'bayangan').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 105, y: 90, name: 'Bayangan Maya Tegak Diperbesar' };
  if (pointer.includes('benda') || pointer.includes('objek')) target = { x: 155, y: 125, name: 'Benda Asli' };
  else if (pointer.includes('lensa') || pointer.includes('cembung')) target = { x: 230, y: 140, name: 'Lensa Cembung' };
  else if (pointer.includes('fokus') || pointer.includes('titik f')) target = { x: 130, y: 152, name: 'Titik Fokus (F)' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Pembentukan Bayangan Pada Kaca Pembesar (Lup)</text>

  <!-- Garis Sumbu Utama -->
  <line x1="30" y1="150" x2="370" y2="150" stroke="#64748b" stroke-width="1.5"/>

  <!-- Lensa Cembung di Tengah -->
  <ellipse cx="230" cy="150" rx="10" ry="60" fill="#bae6fd" fill-opacity="0.6" stroke="#0284c7" stroke-width="2"/>

  <!-- Titik Fokus F dan 2F -->
  <circle cx="130" cy="150" r="3" fill="#0f172a"/>
  <text x="130" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">F</text>
  <circle cx="230" cy="150" r="3" fill="#0f172a"/>
  <text x="230" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">O</text>
  <circle cx="330" cy="150" r="3" fill="#0f172a"/>
  <text x="330" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">F</text>

  <!-- Benda Tegak Nyata (di antara O dan F) -->
  <line x1="165" y1="150" x2="165" y2="115" stroke="#16a34a" stroke-width="3"/>
  <polygon points="161,118 169,118 165,110" fill="#16a34a"/>
  <text x="165" y="105" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#15803d">Benda</text>

  <!-- Sinar Istimewa 1 (Sejajar -> Melalui Fokus) -->
  <line x1="165" y1="110" x2="230" y2="110" stroke="#f59e0b" stroke-width="1.8"/>
  <line x1="230" y1="110" x2="350" y2="160" stroke="#f59e0b" stroke-width="1.8"/>
  <!-- Perpanjangan Maya ke Belakang -->
  <line x1="230" y1="110" x2="105" y2="70" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 3"/>

  <!-- Sinar Istimewa 2 (Melalui Pusat Optik O) -->
  <line x1="165" y1="110" x2="350" y2="190" stroke="#0284c7" stroke-width="1.8"/>
  <line x1="165" y1="110" x2="105" y2="70" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3 3"/>

  <!-- Bayangan Maya Tegak Diperbesar -->
  <line x1="105" y1="150" x2="105" y2="70" stroke="#dc2626" stroke-width="3" stroke-dasharray="4 3"/>
  <polygon points="101,74 109,74 105,64" fill="#dc2626"/>
  <text x="105" y="58" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#b91c1c">Bayangan Maya</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Sifat bayangan atau titik pada tanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 19. Render Pemuaian Keping Bimetal */
export function renderPemuaianBimetalSvg(params: { kondisi?: string; label?: string }): string {
  const kondisi = (params.kondisi || 'panas').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 1; // 0: Normal, 1: Dipanaskan, 2: Didinginkan
  if (kondisi.includes('normal')) activeIdx = 0;
  else if (kondisi.includes('dingin')) activeIdx = 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Prinsip Pemuaian Keping Bimetal</text>

  <!-- Keterangan Koefisien Muai Panjang Logam -->
  <g>
    <rect x="50" y="38" width="14" height="8" fill="#f59e0b"/>
    <text x="70" y="46" font-size="8.5" fill="#334155">Logam A (Koefisien Muai Lebih Besar)</text>
    <rect x="230" y="38" width="14" height="8" fill="#64748b"/>
    <text x="250" y="46" font-size="8.5" fill="#334155">Logam B (Koefisien Muai Lebih Kecil)</text>
  </g>

  <!-- Keadaan 1: Suhu Normal (Lurus) -->
  <g>
    <rect x="20" y="65" width="115" height="150" rx="6" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
    <text x="77.5" y="82" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">1. Suhu Normal</text>
    <rect x="35" y="115" width="75" height="9" fill="#f59e0b"/>
    <rect x="35" y="124" width="75" height="9" fill="#64748b"/>
    <text x="77.5" y="160" text-anchor="middle" font-size="8.5" fill="#475569">Lurus Sejajar</text>
    <text x="77.5" y="174" text-anchor="middle" font-size="8" fill="#94a3b8">Panjang sama</text>
  </g>

  <!-- Keadaan 2: Dipanaskan (Membengkok ke Logam B) -->
  <g>
    <rect x="150" y="65" width="120" height="150" rx="6" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
    <text x="210" y="82" text-anchor="middle" font-size="10" font-weight="bold" fill="#ea580c">2. Dipanaskan (Api)</text>
    <!-- Kurva Bimetal Lengkung ke Bawah -->
    <path d="M 165,115 Q 210,145 255,130" fill="none" stroke="#f59e0b" stroke-width="8"/>
    <path d="M 165,123 Q 210,153 255,138" fill="none" stroke="#64748b" stroke-width="8"/>
    <text x="210" y="175" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#c2410c">Membengkok ke Logam B</text>
    <text x="210" y="190" text-anchor="middle" font-size="8" fill="#64748b">(Koefisien kecil)</text>
  </g>

  <!-- Keadaan 3: Didinginkan (Membengkok ke Logam A) -->
  <g>
    <rect x="285" y="65" width="120" height="150" rx="6" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
    <text x="345" y="82" text-anchor="middle" font-size="10" font-weight="bold" fill="#0284c7">3. Didinginkan (Es)</text>
    <!-- Kurva Bimetal Lengkung ke Atas -->
    <path d="M 300,135 Q 345,105 390,120" fill="none" stroke="#f59e0b" stroke-width="8"/>
    <path d="M 300,143 Q 345,113 390,128" fill="none" stroke="#64748b" stroke-width="8"/>
    <text x="345" y="175" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Membengkok ke Logam A</text>
    <text x="345" y="190" text-anchor="middle" font-size="8" fill="#64748b">(Koefisien besar)</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${[77.5, 210, 345][activeIdx]}" cy="65" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${[77.5, 210, 345][activeIdx]}" y="69" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Perilaku pemuaian bimetal pada kolom "${escapeXml(labelChar)}" menunjukkan ...</text>
</svg>`;
}

/** 20. Render Karakteristik Gelombang Bunyi (Longitudinal) */
export function renderGelombangBunyiSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'rapatan').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 175, y: 115, name: 'Zona Rapatan' };
  if (pointer.includes('renggang')) target = { x: 235, y: 115, name: 'Zona Renggangan' };
  else if (pointer.includes('panjang') || pointer.includes('lambda')) target = { x: 205, y: 65, name: 'Panjang Gelombang (λ)' };
  else if (pointer.includes('garputala') || pointer.includes('sumber')) target = { x: 60, y: 115, name: 'Garputala' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" width="420" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Karakteristik Gelombang Bunyi (Longitudinal)</text>

  <!-- Garputala Bergetar -->
  <path d="M 45,85 L 45,135 Q 45,145 55,145 L 65,145 Q 75,145 75,135 L 75,85" fill="none" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
  <line x1="60" y1="145" x2="60" y2="185" stroke="#475569" stroke-width="6" stroke-linecap="round"/>
  <!-- Garis Getar -->
  <path d="M 38,95 Q 40,110 38,125 M 82,95 Q 80,110 82,125" stroke="#94a3b8" stroke-width="1.5" fill="none"/>
  <text x="60" y="205" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">Garputala</text>

  <!-- Pola Partikel Medium Udara: Rapatan 1 -->
  <g stroke="#0284c7" stroke-width="2.5">
    <line x1="105" y1="95" x2="105" y2="145"/>
    <line x1="111" y1="95" x2="111" y2="145"/>
    <line x1="117" y1="95" x2="117" y2="145"/>
    <line x1="123" y1="95" x2="123" y2="145"/>
  </g>

  <!-- Renggangan 1 -->
  <g stroke="#94a3b8" stroke-width="1.5">
    <line x1="145" y1="95" x2="145" y2="145"/>
    <line x1="165" y1="95" x2="165" y2="145"/>
  </g>

  <!-- Rapatan 2 -->
  <g stroke="#0284c7" stroke-width="2.5">
    <line x1="195" y1="95" x2="195" y2="145"/>
    <line x1="201" y1="95" x2="201" y2="145"/>
    <line x1="207" y1="95" x2="207" y2="145"/>
    <line x1="213" y1="95" x2="213" y2="145"/>
  </g>

  <!-- Renggangan 2 -->
  <g stroke="#94a3b8" stroke-width="1.5">
    <line x1="235" y1="95" x2="235" y2="145"/>
    <line x1="255" y1="95" x2="255" y2="145"/>
  </g>

  <!-- Rapatan 3 -->
  <g stroke="#0284c7" stroke-width="2.5">
    <line x1="285" y1="95" x2="285" y2="145"/>
    <line x1="291" y1="95" x2="291" y2="145"/>
    <line x1="297" y1="95" x2="297" y2="145"/>
    <line x1="303" y1="95" x2="303" y2="145"/>
  </g>

  <!-- Bracket Panjang Gelombang λ (Dari Rapatan ke Rapatan Berikutnya) -->
  <line x1="114" y1="75" x2="204" y2="75" stroke="#e11d48" stroke-width="1.8"/>
  <line x1="114" y1="70" x2="114" y2="80" stroke="#e11d48" stroke-width="1.8"/>
  <line x1="204" y1="70" x2="204" y2="80" stroke="#e11d48" stroke-width="1.8"/>
  <text x="159" y="70" text-anchor="middle" font-size="9" font-weight="bold" fill="#e11d48">Panjang Gelombang (λ)</text>

  <!-- Label Bawah -->
  <text x="114" y="170" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Rapatan</text>
  <text x="155" y="170" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#64748b">Renggangan</text>
  <text x="204" y="170" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Rapatan</text>
  <text x="245" y="170" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#64748b">Renggangan</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="238" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bagian gelombang longitudinal pada huruf "${escapeXml(labelChar)}" disebut ...</text>
</svg>`;
}

/** 21. Render Macam-Macam Perubahan Bentuk Energi */
export function renderPerubahanEnergiSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'surya').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Panel Surya, 1: Kincir Air, 2: Setrika, 3: Kipas Angin
  if (pointer.includes('kincir') || pointer.includes('air') || pointer.includes('turbin')) activeIdx = 1;
  else if (pointer.includes('setrika') || pointer.includes('panas') || pointer.includes('kalor')) activeIdx = 2;
  else if (pointer.includes('kipas') || pointer.includes('angin') || pointer.includes('gerak')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, title: 'Panel Surya', asal: 'Energi Cahaya', hasil: 'Energi Listrik' },
    { x: 205, y: 42, title: 'Kincir Air / PLTA', asal: 'Energi Kinetik', hasil: 'Energi Listrik' },
    { x: 15, y: 145, title: 'Setrika Listrik', asal: 'Energi Listrik', hasil: 'Energi Panas (Kalor)' },
    { x: 205, y: 145, title: 'Kipas Angin', asal: 'Energi Listrik', hasil: 'Energi Gerak (Kinetik)' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Perubahan Bentuk Energi Pada Peralatan Sehari-hari</text>

  <!-- Panel 1: Surya -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="25" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Panel Surya` : 'Panel Surya'}</text>
  <!-- Ilustrasi Grid Panel Surya -->
  <rect x="30" y="70" width="40" height="30" rx="3" fill="#1e3a8a" stroke="#0284c7" stroke-width="1.2"/>
  <line x1="50" y1="70" x2="50" y2="100" stroke="#38bdf8" stroke-width="1"/>
  <line x1="30" y1="85" x2="70" y2="85" stroke="#38bdf8" stroke-width="1"/>
  <text x="82" y="82" font-size="9" font-weight="bold" fill="#d97706">Cahaya Matahari</text>
  <text x="82" y="96" font-size="9" font-weight="bold" fill="#0284c7">↓ Energi Listrik</text>

  <!-- Panel 2: Kincir Air -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="215" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Kincir Air` : 'Kincir Air (PLTA)'}</text>
  <!-- Ilustrasi Kincir -->
  <circle cx="240" cy="85" r="16" fill="#e2e8f0" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="224" y1="85" x2="256" y2="85" stroke="#0284c7" stroke-width="2"/>
  <line x1="240" y1="69" x2="240" y2="101" stroke="#0284c7" stroke-width="2"/>
  <text x="272" y="82" font-size="9" font-weight="bold" fill="#0284c7">Gerak (Kinetik)</text>
  <text x="272" y="96" font-size="9" font-weight="bold" fill="#0369a1">↓ Energi Listrik</text>

  <!-- Panel 3: Setrika -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="25" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Setrika Listrik` : 'Setrika Listrik'}</text>
  <!-- Ilustrasi Setrika -->
  <path d="M 30,205 L 65,205 Q 75,205 60,185 L 40,185 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.2"/>
  <text x="82" y="185" font-size="9" font-weight="bold" fill="#0284c7">Energi Listrik</text>
  <text x="82" y="199" font-size="9" font-weight="bold" fill="#dc2626">↓ Energi Kalor</text>

  <!-- Panel 4: Kipas Angin -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="215" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Kipas Angin` : 'Kipas Angin'}</text>
  <!-- Ilustrasi Kipas -->
  <circle cx="240" cy="188" r="16" fill="none" stroke="#64748b" stroke-width="1.2"/>
  <circle cx="240" cy="188" r="4" fill="#0284c7"/>
  <path d="M 240,188 L 240,174 M 240,188 L 252,196 M 240,188 L 228,196" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>
  <text x="272" y="185" font-size="9" font-weight="bold" fill="#0284c7">Energi Listrik</text>
  <text x="272" y="199" font-size="9" font-weight="bold" fill="#166534">↓ Energi Gerak</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Perubahan energi pada alat bertanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// =========================================================================
// BATCH 3: IPAS FISIKA, ENERGI TERBARUKAN & ASTRONOMI (11 TEMPLATES)
// =========================================================================

// 13. Macam-Macam Gaya Fisika
export function renderMacamMacamGayaSvg(params: any): string {
  const pointer = String(params.jenis || params.pointer || 'gesek').toLowerCase();
  const labelChar = params.label || 'X';

  const types = [
    { id: 'otot', name: 'Gaya Otot', sub: 'Kontraksi otot tubuh', cat: 'Gaya Sentuh', cx: 84, x: 18 },
    { id: 'gesek', name: 'Gaya Gesek', sub: 'Hambatan bidang sentuh', cat: 'Gaya Sentuh', cx: 228, x: 162 },
    { id: 'gravitasi', name: 'Gaya Gravitasi', sub: 'Tarik pusat bumi', cat: 'Gaya Tak Sentuh', cx: 372, x: 306 },
    { id: 'pegas', name: 'Gaya Pegas', sub: 'Elastisitas benda', cat: 'Gaya Sentuh', cx: 516, x: 450 }
  ];

  let target = types.find(t => pointer.includes(t.id)) || types[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" width="600" height="330" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="gaya_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.10"/>
    </filter>
    <linearGradient id="gaya_card_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="gaya_active_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>
    <marker id="arrGayaUp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#dc2626" />
    </marker>
    <marker id="arrGayaDown" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
    </marker>
    <marker id="arrGayaRight" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#16a34a" />
    </marker>
    <marker id="arrGayaLeft" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#dc2626" />
    </marker>
    <marker id="arrGayaBlueUp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#0284c7" />
    </marker>
  </defs>

  <!-- Outer Frame -->
  <rect x="4" y="4" width="592" height="322" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#gaya_shadow)"/>

  <!-- Header Section -->
  <rect x="170" y="10" width="260" height="18" rx="9" fill="#e0f2fe"/>
  <text x="300" y="22" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1" letter-spacing="0.5">FISIKA &amp; MEKANIKA - MACAM-MACAM GAYA</text>
  <text x="300" y="42" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Ragam Jenis Gaya dalam Kehidupan Sehari-hari</text>
  <text x="300" y="58" text-anchor="middle" font-size="9.5" font-weight="500" fill="#64748b">Karakteristik, arah vektor, dan penerapan gaya dalam aktivitas sehari-hari</text>

  <!-- 4 Illustrated Force Panels -->
  ${types.map(t => {
    const isTarget = t.id === target.id;
    const bgFill = isTarget ? 'url(#gaya_active_bg)' : 'url(#gaya_card_bg)';
    const strokeColor = isTarget ? '#e11d48' : '#cbd5e1';
    const strokeWidth = isTarget ? 2.5 : 1;

    return `
    <g>
      <!-- Card Container -->
      <rect x="${t.x}" y="74" width="132" height="206" rx="8" fill="${bgFill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="url(#gaya_shadow)"/>

      <!-- Illustrated Vector Area -->
      ${t.id === 'otot' ? `
        <!-- 1. Gaya Otot (Lengan Mengangkat Dumbel) -->
        <g>
          <!-- Palang Dumbel Logam -->
          <line x1="48" y1="125" x2="120" y2="125" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
          <!-- Piringan Beban Besi Kiri & Kanan -->
          <rect x="44" y="110" width="8" height="30" rx="2" fill="#0f172a"/>
          <rect x="116" y="110" width="8" height="30" rx="2" fill="#0f172a"/>
          <!-- Lengan Berotot -->
          <path d="M 80,130 L 76,160 L 92,160 L 88,130 Z" fill="#fed7aa" stroke="#c2410c" stroke-width="1.2"/>
          <ellipse cx="84" cy="125" rx="8" ry="6" fill="#fed7aa" stroke="#c2410c" stroke-width="1.2"/>
          <path d="M 76,160 Q 64,175 76,192 L 94,188 Q 102,172 92,160 Z" fill="#fca5a5" stroke="#dc2626" stroke-width="1.5"/>
          <!-- Vektor Gaya Angkat Otot Ke Atas -->
          <line x1="84" y1="115" x2="84" y2="88" stroke="#dc2626" stroke-width="3" marker-end="url(#arrGayaUp)"/>
          <rect x="94" y="90" width="30" height="15" rx="3" fill="#fee2e2"/>
          <text x="109" y="101" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">F_otot</text>
        </g>
      ` : ''}

      ${t.id === 'gesek' ? `
        <!-- 2. Gaya Gesek (Balok di Lantai Kasar + Inset) -->
        <g>
          <!-- Lantai Bertekstur -->
          <line x1="172" y1="168" x2="284" y2="168" stroke="#64748b" stroke-width="2.5"/>
          <g stroke="#94a3b8" stroke-width="1">
            ${[178, 192, 206, 220, 234, 248, 262, 276].map(lx => `<line x1="${lx}" y1="168" x2="${lx - 6}" y2="176"/>`).join('')}
          </g>
          <!-- Balok Kayu Bergerak ke Kanan -->
          <rect x="198" y="128" width="60" height="40" rx="3" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
          <line x1="205" y1="138" x2="251" y2="138" stroke="#fcd34d" stroke-width="1"/>
          <!-- Vektor Gaya Tarik ke Kanan -->
          <line x1="258" y1="148" x2="282" y2="148" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrGayaRight)"/>
          <!-- Vektor Gaya Gesek ke Kiri di Bidang Sentuh -->
          <line x1="228" y1="174" x2="188" y2="174" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrGayaLeft)"/>
          <text x="186" y="187" font-size="8.5" font-weight="bold" fill="#dc2626">f_gesek</text>
          <!-- Inset Mikroskopis Gerigi Permukaan -->
          <circle cx="254" cy="100" r="14" fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/>
          <path d="M 243,100 L 246,97 L 249,100 L 252,97 L 255,100 L 258,97 L 261,100 L 265,100" stroke="#c2410c" stroke-width="1.3" fill="none"/>
        </g>
      ` : ''}

      ${t.id === 'gravitasi' ? `
        <!-- 3. Gaya Gravitasi (Apel Jatuh Bebas) -->
        <g>
          <!-- Dahan Pohon -->
          <path d="M 314,92 Q 345,95 385,86" stroke="#78350f" stroke-width="4" stroke-linecap="round" fill="none"/>
          <ellipse cx="330" cy="88" rx="8" ry="4" fill="#22c55e"/>
          <ellipse cx="350" cy="86" rx="7" ry="3.5" fill="#16a34a"/>
          <!-- Buah Apel Merah Jatuh -->
          <circle cx="372" cy="130" r="11" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"/>
          <path d="M 372,119 Q 375,114 372,111" stroke="#78350f" stroke-width="1.5" fill="none"/>
          <ellipse cx="376" cy="114" rx="4" ry="2" fill="#22c55e"/>
          <!-- Lintasan Jatuh Putus-putus -->
          <line x1="372" y1="92" x2="372" y2="116" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3"/>
          <!-- Vektor Percepatan Gravitasi ke Bawah -->
          <line x1="372" y1="145" x2="372" y2="178" stroke="#dc2626" stroke-width="3" marker-end="url(#arrGayaDown)"/>
          <rect x="382" y="152" width="22" height="15" rx="3" fill="#fee2e2"/>
          <text x="393" y="163" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#dc2626">g</text>
          <!-- Permukaan Tanah Rumput -->
          <line x1="320" y1="190" x2="424" y2="190" stroke="#16a34a" stroke-width="2"/>
        </g>
      ` : ''}

      ${t.id === 'pegas' ? `
        <!-- 4. Gaya Pegas (Dinamometer Spiral) -->
        <g>
          <!-- Gantungan Atas -->
          <rect x="496" y="86" width="40" height="6" rx="1" fill="#475569"/>
          <!-- Tabung Dinamometer Berskala -->
          <rect x="506" y="92" width="20" height="66" rx="3" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
          <g stroke="#94a3b8" stroke-width="1">
            ${[98, 106, 114, 122, 130, 138, 146].map(sy => `<line x1="520" y1="${sy}" x2="524" y2="${sy}"/>`).join('')}
          </g>
          <!-- Pegas Spiral Baja -->
          <path d="M 516,96 L 512,102 L 520,108 L 512,114 L 520,120 L 512,126 L 520,132 L 516,138" fill="none" stroke="#0284c7" stroke-width="2"/>
          <!-- Beban Gantung Bawah -->
          <line x1="516" y1="158" x2="516" y2="168" stroke="#334155" stroke-width="2"/>
          <rect x="506" y="168" width="20" height="18" rx="2" fill="#64748b" stroke="#0f172a" stroke-width="1.2"/>
          <!-- Vektor Gaya Pemulih Pegas ke Atas -->
          <line x1="486" y1="148" x2="486" y2="110" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrGayaBlueUp)"/>
          <text x="486" y="104" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0284c7">F_pegas</text>
        </g>
      ` : ''}

      <!-- Separator Line -->
      <line x1="${t.x + 10}" y1="202" x2="${t.x + 122}" y2="202" stroke="#e2e8f0" stroke-width="1"/>

      <!-- Label / Target Badge Section -->
      ${isTarget ? `
        <circle cx="${t.cx}" cy="230" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#gaya_shadow)"/>
        <text x="${t.cx}" y="234.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
        <text x="${t.cx}" y="258" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#be123c">${t.cat}</text>
      ` : `
        <text x="${t.cx}" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${t.name}</text>
        <text x="${t.cx}" y="240" text-anchor="middle" font-size="8.5" font-weight="500" fill="#64748b">${t.sub}</text>
        <rect x="${t.cx - 36}" y="250" width="72" height="17" rx="3" fill="#e0f2fe"/>
        <text x="${t.cx}" y="262" text-anchor="middle" font-size="8" font-weight="600" fill="#0369a1">${t.cat}</text>
      `}
    </g>`;
  }).join('')}

  <!-- Bottom Interactive Question Prompt Banner -->
  <rect x="60" y="294" width="480" height="24" rx="6" fill="#0f172a"/>
  <text x="300" y="310" text-anchor="middle" font-size="11" font-weight="600" fill="#f8fafc">Contoh gaya pada gambar bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 14. Pesawat Sederhana Bidang Miring
export function renderPesawatSederhanaBidangMiringSvg(params: any): string {
  const h = params.h || 3;
  const s = params.s || 5;
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="forceArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
    </marker>
  </defs>

  <rect width="380" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Pesawat Sederhana: Bidang Miring</text>

  <!-- Segitiga Bidang Miring -->
  <polygon points="60,170 300,170 300,80" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
  <!-- Simbol Siku-siku -->
  <rect x="285" y="155" width="15" height="15" fill="none" stroke="#475569" stroke-width="1.2"/>

  <!-- Balok Beban di Atas Bidang Miring -->
  <g transform="translate(180, 125) rotate(-20.5)">
    <rect x="-18" y="-18" width="36" height="36" rx="3" fill="#fbbf24" stroke="#b45309" stroke-width="1.8"/>
    <text x="0" y="4" text-anchor="middle" font-size="9" font-weight="bold" fill="#78350f">W</text>
    <!-- Panah Kuasa F ke Atas -->
    <line x1="18" y1="0" x2="55" y2="0" stroke="#ef4444" stroke-width="2.5" marker-end="url(#forceArr)"/>
    <text x="68" y="4" font-size="9" font-weight="bold" fill="#b91c1c">F</text>
  </g>

  <!-- Keterangan Panjang Lintasan s -->
  <text x="170" y="85" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">s = ${s} m</text>
  <!-- Keterangan Tinggi h -->
  <text x="325" y="125" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">h = ${h} m</text>

  <!-- Target Badge -->
  <circle cx="180" cy="125" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="180" y="129" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="202" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Keuntungan mekanis bidang miring pada gambar di atas adalah ...</text>
</svg>`;
}

// 15. Pesawat Sederhana Roda Berporos
export function renderPesawatSederhanaRodaBerporosSvg(params: any): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="360" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="360" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="180" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Pesawat Sederhana: Roda Berporos</text>

  <!-- Roda Besar (Jari-jari R) -->
  <circle cx="180" cy="115" r="65" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
  <!-- Poros Kecil (Jari-jari r) -->
  <circle cx="180" cy="115" r="22" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
  <circle cx="180" cy="115" r="4" fill="#0f172a"/>

  <!-- Garis Jari-jari R dan r -->
  <line x1="180" y1="115" x2="245" y2="115" stroke="#0369a1" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="215" y="108" font-size="8.5" font-weight="bold" fill="#0369a1">R</text>

  <line x1="180" y1="115" x2="180" y2="137" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="185" y="132" font-size="8.5" font-weight="bold" fill="#c2410c">r</text>

  <!-- Target Badge -->
  <circle cx="180" cy="115" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="180" y="119" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="180" y="202" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Contoh penerapan alat dengan prinsip roda berporos adalah ...</text>
</svg>`;
}

// 16. Pembangkit Listrik Tenaga Air (PLTA)
export function renderPembangkitListrikPltaSvg(params: any): string {
  const pointer = String(params.pointer || params.komponen || 'turbin').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'waduk', name: 'Waduk / Bendungan', x: 70, y: 80 },
    { id: 'penstock', name: 'Pipa Pesat (Penstock)', x: 160, y: 120 },
    { id: 'turbin', name: 'Turbin Air', x: 240, y: 140 },
    { id: 'generator', name: 'Generator Listrik', x: 280, y: 85 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 220" width="420" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="420" height="220" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">Skema Pembangkit Listrik Tenaga Air (PLTA)</text>

  <!-- Waduk / Air -->
  <rect x="30" y="55" width="80" height="70" fill="#38bdf8" stroke="#0284c7" stroke-width="1.8" rx="4"/>
  <text x="70" y="95" text-anchor="middle" font-size="8" font-weight="bold" fill="#ffffff">Air Waduk</text>

  <!-- Bendungan Beton -->
  <polygon points="110,55 130,55 150,150 110,150" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

  <!-- Pipa Pesat -->
  <line x1="110" y1="110" x2="220" y2="150" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
  <line x1="110" y1="110" x2="220" y2="150" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>

  <!-- Turbin Air -->
  <circle cx="235" cy="155" r="16" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
  <text x="235" y="159" text-anchor="middle" font-size="10">⚙️</text>

  <!-- Generator -->
  <rect x="260" y="70" width="40" height="40" rx="4" fill="#a855f7" stroke="#7e22ce" stroke-width="1.8"/>
  <text x="280" y="94" text-anchor="middle" font-size="8" font-weight="bold" fill="#ffffff">GEN</text>

  <!-- Tiang Transmisi Listrik -->
  <line x1="300" y1="90" x2="350" y2="90" stroke="#e11d48" stroke-width="2"/>
  <text x="375" y="94" text-anchor="middle" font-size="10">🗼</text>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="210" y="202" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Perubahan energi yang terjadi pada komponen "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 17. Panel Surya (PLTS)
export function renderPanelSuryaPltsSvg(params: any): string {
  const pointer = String(params.pointer || params.komponen || 'panel').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'matahari', x: 60, y: 70 },
    { id: 'panel', x: 160, y: 110 },
    { id: 'inverter', x: 260, y: 110 },
    { id: 'rumah', x: 350, y: 110 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" width="420" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="420" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Alur Pembangkit Listrik Tenaga Surya (PLTS)</text>

  <!-- Matahari -->
  <circle cx="60" cy="70" r="20" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
  <text x="60" y="74" text-anchor="middle" font-size="12">☀️</text>

  <!-- Sinar Matahari Panah -->
  <line x1="85" y1="85" x2="130" y2="105" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,2"/>

  <!-- Panel Surya -->
  <polygon points="135,125 185,95 195,135 145,160" fill="#1e3a8a" stroke="#1d4ed8" stroke-width="1.8"/>
  <line x1="160" y1="110" x2="170" y2="148" stroke="#60a5fa" stroke-width="1"/>

  <!-- Kabel ke Inverter -->
  <line x1="195" y1="135" x2="235" y2="135" stroke="#0f172a" stroke-width="2"/>

  <!-- Inverter / Baterai -->
  <rect x="235" y="105" width="50" height="50" rx="4" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
  <text x="260" y="128" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#0f172a">INVERTER</text>
  <text x="260" y="140" text-anchor="middle" font-size="6.5" fill="#64748b">DC → AC</text>

  <!-- Kabel ke Rumah -->
  <line x1="285" y1="130" x2="320" y2="130" stroke="#0f172a" stroke-width="2"/>

  <!-- Rumah Beban Listrik -->
  <text x="350" y="130" text-anchor="middle" font-size="24">🏠</text>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="210" y="184" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Fungsi komponen yang ditunjuk oleh simbol "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 18. Energi Angin (PLTB)
export function renderEnergiAnginPltbSvg(params: any): string {
  const labelChar = params.label || 'X';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" width="340" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="340" height="220" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.5" rx="8"/>
  <text x="170" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0369a1">Kincir Angin Pembangkit Listrik (PLTB)</text>

  <!-- Tiang Menara Turbin -->
  <polygon points="166,170 174,170 171,85 169,85" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

  <!-- Nacelle (Kepala Turbin Generator) -->
  <rect x="162" y="78" width="18" height="12" rx="2" fill="#334155"/>

  <!-- 3 Bilah Kincir Angin -->
  <line x1="170" y1="84" x2="170" y2="35" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
  <line x1="170" y1="84" x2="128" y2="110" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
  <line x1="170" y1="84" x2="212" y2="110" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
  <circle cx="170" cy="84" r="5" fill="#0f172a"/>

  <!-- Angin (Garis Dinamis) -->
  <path d="M 60 70 Q 90 65 110 75" stroke="#38bdf8" stroke-width="2" fill="none" stroke-dasharray="4,2"/>
  <path d="M 50 90 Q 80 85 105 95" stroke="#38bdf8" stroke-width="2" fill="none" stroke-dasharray="4,2"/>

  <!-- Target Badge -->
  <circle cx="170" cy="84" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
  <text x="170" y="88" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="170" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Energi kinetik angin diubah menjadi energi listrik pada bagian "[${escapeXml(labelChar)}]" oleh ...</text>
</svg>`;
}

// 19. Termos Air Panas (Isolator Kalor)
export function renderTermosAirPanasSvg(params: any): string {
  const pointer = String(params.pointer || params.bagian || 'ruang_hampa').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'sumbat', name: 'Sumbat Gabus Isolator', x: 170, y: 55 },
    { id: 'kaca_perak', name: 'Dinding Kaca Berlapis Perak', x: 120, y: 110 },
    { id: 'ruang_hampa', name: 'Ruang Hampa Udara (Vakum)', x: 220, y: 125 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" width="340" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="340" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="170" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Penampang Termos Penahan Kalor</text>

  <!-- Sumbat Termos -->
  <rect x="155" y="45" width="30" height="20" rx="3" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>

  <!-- Dinding Luar Termos -->
  <rect x="135" y="65" width="70" height="105" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>

  <!-- Ruang Hampa Udara (Dinding Ganda) -->
  <rect x="143" y="70" width="54" height="95" rx="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>

  <!-- Dinding Kaca Perak Mengkilap di Dalam -->
  <rect x="150" y="75" width="40" height="85" rx="3" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
  <text x="170" y="120" text-anchor="middle" font-size="8" font-weight="bold" fill="#ffffff">Air Panas</text>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="170" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Fungsi bagian termos yang ditunjuk tanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 20. Perpindahan Panas (Konduksi, Konveksi, Radiasi)
export function renderPerpindahanPanasKonduksiKonveksiRadiasiSvg(params: any): string {
  const pointer = String(params.jenis || params.pointer || 'konveksi').toLowerCase();
  const labelChar = params.label || 'X';

  const types = [
    { id: 'konduksi', name: 'Konduksi (Gagang Logam)', x: 95, y: 90 },
    { id: 'konveksi', name: 'Konveksi (Air Mendidih)', x: 190, y: 85 },
    { id: 'radiasi', name: 'Radiasi (Pancaran Api)', x: 265, y: 155 }
  ];

  let target = types.find(t => pointer.includes(t.id)) || types[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="380" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="220" fill="#fff7ed" stroke="#fed7aa" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#9a3412">3 Cara Perpindahan Panas (Kalor)</text>

  <!-- Panci Masak di Atas Api -->
  <rect x="145" y="60" width="90" height="60" rx="4" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
  <!-- Gagang Logam Panci -->
  <rect x="80" y="70" width="65" height="12" rx="2" fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Air Berputar Mendidih (Arus Konveksi) -->
  <ellipse cx="190" cy="90" rx="28" ry="16" fill="#38bdf825" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="190" y="93" text-anchor="middle" font-size="8" font-weight="bold" fill="#0369a1">Air</text>

  <!-- Tungku Api Menyala -->
  <path d="M 165 155 Q 175 125 190 145 Q 205 125 215 155 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"/>
  <path d="M 175 155 Q 185 135 190 150 Q 195 135 205 155 Z" fill="#facc15"/>

  <!-- Garis Radiasi Panas Menyebar -->
  <line x1="225" y1="145" x2="250" y2="150" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3,2"/>
  <line x1="220" y1="160" x2="245" y2="168" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3,2"/>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Perpindahan panas pada bagian bertanda "[${escapeXml(labelChar)}]" berlangsung secara ...</text>
</svg>`;
}
