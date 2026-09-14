/**
 * science-biology.ts
 * Biology, Ecology, Animal & Plant Life Cycles SVG Visual Stimulus Renderers (22 Templates)
 */

import { escapeXml } from './types';

/** Render Rantai Makanan & Aliran Energi Ekosistem (Enterprise Textbook Grade) */
export function renderRantaiMakananSvg(params: { pointer?: string; label?: string; organisme?: string[] }): string {
  const labelChar = params.label || 'X';
  const pointer = (params.pointer || 'konsumen1').toLowerCase();
  const organisme = params.organisme?.length ? params.organisme : ['Rumput', 'Belalang', 'Katak', 'Ular', 'Elang'];

  let targetIdx = 1;
  if (pointer.includes('produsen') || pointer.includes('tumbuhan') || pointer.includes('rumput') || pointer.includes('padi') || pointer.includes('fitoplankton')) targetIdx = 0;
  else if (pointer.includes('konsumen1') || pointer.includes('herbivora') || pointer.includes('belalang') || pointer.includes('tikus') || pointer.includes('udang')) targetIdx = 1;
  else if (pointer.includes('konsumen2') || pointer.includes('karnivora') || pointer.includes('katak') || pointer.includes('ayam') || pointer.includes('ikan')) targetIdx = 2;
  else if (pointer.includes('konsumen3') || pointer.includes('puncak') || pointer.includes('predator') || pointer.includes('ular') || pointer.includes('elang') || pointer.includes('hiu')) targetIdx = 3;
  else if (pointer.includes('pengurai') || pointer.includes('dekomposer') || pointer.includes('jamur') || pointer.includes('bakteri')) targetIdx = 4;

  const count = Math.min(organisme.length, 5);
  const cardW = 105;
  const cardH = 135;
  const gap = 24;
  const totalW = count * cardW + (count - 1) * gap;
  const startX = Math.round((700 - totalW) / 2);
  const centerY = 195;

  const trophicRoles = [
    { role: 'Produsen', trophic: 'Trofik I', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
    { role: 'Konsumen I', trophic: 'Trofik II', color: '#0284c7', bg: '#f0f9ff', border: '#7dd3fc' },
    { role: 'Konsumen II', trophic: 'Trofik III', color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
    { role: 'Konsumen III', trophic: 'Trofik IV', color: '#be123c', bg: '#fff1f2', border: '#fecdd3' },
    { role: 'Pengurai', trophic: 'Dekomposer', color: '#78350f', bg: '#fefce8', border: '#fef08a' }
  ];

  let cardsSvg = '';
  let flowSvg = '';

  for (let idx = 0; idx < count; idx++) {
    const x = startX + idx * (cardW + gap);
    const y = centerY - cardH / 2;
    const name = organisme[idx];
    const roleInfo = trophicRoles[idx] || trophicRoles[1];
    const isTarget = idx === targetIdx;

    cardsSvg += `
      <!-- Card Organisme ${idx + 1} -->
      <g filter="${isTarget ? 'url(#trophicGlow)' : 'url(#trophicShadow)'}">
        <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="12" fill="${isTarget ? '#ffffff' : roleInfo.bg}" stroke="${isTarget ? '#e11d48' : roleInfo.border}" stroke-width="${isTarget ? 3 : 1.5}"/>
        
        <!-- Header Pill Peran -->
        <rect x="${x + 8}" y="${y + 10}" width="${cardW - 16}" height="22" rx="6" fill="${roleInfo.color}"/>
        <text x="${x + cardW / 2}" y="${y + 24}" text-anchor="middle" font-size="10" font-weight="800" fill="#ffffff">${roleInfo.role}</text>
        
        <!-- Nama Organisme -->
        <rect x="${x + 6}" y="${y + 44}" width="${cardW - 12}" height="42" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
        <text x="${x + cardW / 2}" y="${y + 68}" text-anchor="middle" font-size="13" font-weight="900" fill="#0f172a">${escapeXml(name)}</text>
        
        <!-- Tingkat Trofik Footnote -->
        <rect x="${x + 12}" y="${y + 98}" width="${cardW - 24}" height="20" rx="4" fill="#f1f5f9"/>
        <text x="${x + cardW / 2}" y="${y + 112}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#64748b">${roleInfo.trophic}</text>
      </g>
    `;

    // Panah Aliran Energi Antar Trofik
    if (idx < count - 1) {
      const ax1 = x + cardW + 4;
      const ax2 = ax1 + gap - 8;
      const ay = centerY;
      flowSvg += `
        <g>
          <line x1="${ax1}" y1="${ay}" x2="${ax2}" y2="${ay}" stroke="#10b981" stroke-width="3.5" stroke-linecap="round"/>
          <polygon points="${ax2 + 4},${ay} ${ax2 - 4},${ay - 5} ${ax2 - 4},${ay + 5}" fill="#10b981"/>
          <!-- Label Energi -->
          <text x="${ax1 + (gap - 12) / 2}" y="${ay - 8}" text-anchor="middle" font-size="7.5" font-weight="800" fill="#059669">Energi</text>
        </g>
      `;
    }
  }

  // Posisi target X di atas kartu yang ditunjuk
  const targetX = startX + targetIdx * (cardW + gap) + cardW / 2;
  const targetY = centerY - cardH / 2 - 28;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 380" width="100%" height="100%" style="background:#f8fafc; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <defs>
    <!-- Filter Shadow & Glow -->
    <filter id="trophicGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#e11d48" flood-opacity="0.4"/>
    </filter>
    <filter id="trophicShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background Canvas Card -->
  <rect x="2" y="2" width="696" height="376" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

  <!-- Header Banner -->
  <rect x="2" y="2" width="696" height="46" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="24" y="14" width="6" height="22" rx="3" fill="#10b981"/>
  <text x="40" y="30" font-size="16" font-weight="800" fill="#0f172a" letter-spacing="0.3">Rantai Makanan &amp; Aliran Energi Ekosistem</text>
  <text x="405" y="30" font-size="12" font-weight="600" fill="#64748b">(Tingkat Trofik I s.d. Puncak)</text>

  <!-- Simbol Matahari Sumber Energi Utama di Kiri Atas -->
  <g transform="translate(48, 85)" opacity="0.85">
    <circle cx="0" cy="0" r="14" fill="#facc15" stroke="#eab308" stroke-width="2"/>
    <line x1="0" y1="-20" x2="0" y2="-16" stroke="#eab308" stroke-width="2"/>
    <line x1="0" y1="16" x2="0" y2="20" stroke="#eab308" stroke-width="2"/>
    <line x1="-20" y1="0" x2="-16" y2="0" stroke="#eab308" stroke-width="2"/>
    <line x1="16" y1="0" x2="20" y2="0" stroke="#eab308" stroke-width="2"/>
    <text x="0" y="26" text-anchor="middle" font-size="8.5" font-weight="700" fill="#ca8a04">Cahaya Surya</text>
  </g>

  <!-- Garis Alur Energi & Kartu Organisme -->
  ${flowSvg}
  ${cardsSvg}

  <!-- ==================== TARGET POINTER DINAMIS HURUF X ==================== -->
  <g id="target_pointer">
    <!-- Efek Beacon Berpendar -->
    <circle cx="${targetX}" cy="${targetY}" r="22" fill="#e11d48" opacity="0.18"/>
    <circle cx="${targetX}" cy="${targetY}" r="15" fill="#e11d48" opacity="0.3"/>
    
    <!-- Badge Target Huruf X -->
    <circle cx="${targetX}" cy="${targetY}" r="17" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#trophicGlow)"/>
    <text x="${targetX}" y="${targetY + 6}" text-anchor="middle" font-size="16" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
    
    <!-- Panah Penunjuk Vertikal ke Bawah Menuju Kartu -->
    <line x1="${targetX}" y1="${targetY + 17}" x2="${targetX}" y2="${targetY + 28}" stroke="#e11d48" stroke-width="3" stroke-linecap="round"/>
    <polygon points="${targetX},${targetY + 34} ${targetX - 4},${targetY + 26} ${targetX + 4},${targetY + 26}" fill="#e11d48"/>
  </g>

  <!-- Footer Banner Prompt Ujian -->
  <rect x="2" y="348" width="696" height="30" rx="6" fill="#f1f5f9"/>
  <text x="350" y="367" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">Organisme bertanda huruf "${escapeXml(labelChar)}" berperan sebagai...</text>
</svg>`;
}

/** Render Metamorfosis Sempurna Kupu-Kupu (Enterprise Textbook Grade) */
export function renderMetamorfosisSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'kepompong').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 535, y: 220, name: 'Kepompong (Pupa)' };
  let isTarget = {
    telur: false,
    ulat: false,
    kepompong: false,
    kupu: false
  };

  if (pointer.includes('telur')) {
    target = { x: 350, y: 110, name: 'Telur' };
    isTarget.telur = true;
  } else if (pointer.includes('ulat') || pointer.includes('larva')) {
    target = { x: 165, y: 220, name: 'Ulat (Larva)' };
    isTarget.ulat = true;
  } else if (pointer.includes('kupu') || pointer.includes('dewasa') || pointer.includes('imago')) {
    target = { x: 350, y: 335, name: 'Kupu-Kupu Dewasa (Imago)' };
    isTarget.kupu = true;
  } else {
    // Default Kepompong
    isTarget.kepompong = true;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" width="100%" height="100%" style="background:#f8fafc; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <defs>
    <!-- Gradien Siklus -->
    <linearGradient id="metaLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#86efac"/>
      <stop offset="60%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <linearGradient id="metaBranchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a16207"/>
      <stop offset="50%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>
    <linearGradient id="metaPupaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>
    <linearGradient id="metaWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="50%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>

    <!-- Filter Shadow & Glow -->
    <filter id="metaGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#e11d48" flood-opacity="0.4"/>
    </filter>
    <filter id="metaCardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>

    <marker id="mArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#047857" />
    </marker>
  </defs>

  <!-- Background Canvas Card -->
  <rect x="2" y="2" width="696" height="436" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

  <!-- Header Banner -->
  <rect x="2" y="2" width="696" height="46" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="24" y="14" width="6" height="22" rx="3" fill="#16a34a"/>
  <text x="40" y="30" font-size="16" font-weight="800" fill="#0f172a" letter-spacing="0.3">Daur Hidup / Metamorfosis Kupu-Kupu</text>
  <text x="360" y="30" font-size="12" font-weight="600" fill="#64748b">(Metamorfosis Sempurna / Holometabola)</text>

  <!-- Ranting Alami Melengkung di Tengah -->
  <path d="M 80,180 Q 220,130 350,150 Q 480,170 620,120" fill="none" stroke="url(#metaBranchGrad)" stroke-width="7" stroke-linecap="round"/>
  <path d="M 280,145 Q 310,120 330,85 M 480,170 Q 520,200 535,230" fill="none" stroke="url(#metaBranchGrad)" stroke-width="4.5" stroke-linecap="round"/>

  <!-- ==================== PANAH SIKLUS SIRKULAR ==================== -->
  <!-- 1 -> 2 (Telur ke Ulat / Kiri Bawah) -->
  <path d="M 270,95 C 200,95 160,135 150,165" fill="none" stroke="#047857" stroke-width="3" stroke-dasharray="6,3"/>
  <path d="M 152,158 L 150,168" marker-end="url(#mArr)"/>

  <!-- 2 -> 3 (Ulat ke Kepompong / Melintas Bawah ke Kanan) -->
  <path d="M 170,270 C 190,320 280,360 350,365 C 420,360 510,320 530,270" fill="none" stroke="#047857" stroke-width="3" stroke-dasharray="6,3"/>
  <path d="M 526,278 L 532,268" marker-end="url(#mArr)"/>

  <!-- 3 -> 4 (Kepompong ke Kupu-Kupu / Atas ke Bawah) -->
  <path d="M 550,170 C 560,130 500,95 430,95" fill="none" stroke="#047857" stroke-width="3" stroke-dasharray="6,3"/>
  <path d="M 440,95 L 428,95" marker-end="url(#mArr)"/>

  <!-- ==================== TAHAP 1: TELUR (ATAS) ==================== -->
  <g transform="translate(350, 95)" filter="url(#metaCardShadow)">
    <rect x="-85" y="-38" width="170" height="76" rx="10" fill="${isTarget.telur ? '#f0fdf4' : '#ffffff'}" stroke="${isTarget.telur ? '#16a34a' : '#cbd5e1'}" stroke-width="${isTarget.telur ? 2.5 : 1.2}"/>
    
    <!-- Daun Berembun -->
    <path d="M -60,12 Q -20,-28 40,-12 Q 60,18 10,22 Q -40,24 -60,12 Z" fill="url(#metaLeafGrad)" stroke="#15803d" stroke-width="1.5"/>
    <path d="M -50,10 Q 0,0 35,-8" fill="none" stroke="#bbf7d0" stroke-width="1.2"/>

    <!-- Butir-butir Telur Mutiara Bergaris Halus -->
    <ellipse cx="-15" cy="-2" rx="4.5" ry="5.5" fill="#fef9c3" stroke="#ca8a04" stroke-width="1"/>
    <ellipse cx="-5" cy="4" rx="4.5" ry="5.5" fill="#fef9c3" stroke="#ca8a04" stroke-width="1"/>
    <ellipse cx="6" cy="-1" rx="4.5" ry="5.5" fill="#fef9c3" stroke="#ca8a04" stroke-width="1"/>
    <ellipse cx="16" cy="3" rx="4.5" ry="5.5" fill="#fef9c3" stroke="#ca8a04" stroke-width="1"/>

    <!-- Label -->
    <rect x="-42" y="16" width="84" height="18" rx="4" fill="#15803d"/>
    <text x="0" y="29" text-anchor="middle" font-size="10" font-weight="800" fill="#ffffff">1. Telur</text>
  </g>

  <!-- ==================== TAHAP 2: ULAT / LARVA (KIRI) ==================== -->
  <g transform="translate(165, 215)" filter="url(#metaCardShadow)">
    <rect x="-85" y="-45" width="170" height="90" rx="10" fill="${isTarget.ulat ? '#f0fdf4' : '#ffffff'}" stroke="${isTarget.ulat ? '#16a34a' : '#cbd5e1'}" stroke-width="${isTarget.ulat ? 2.5 : 1.2}"/>

    <!-- Daun yang Dimakan Ulat (Bekas Gigitan) -->
    <path d="M -50,-15 Q -10,-35 45,-15 C 35,-5 42,10 25,12 C 10,14 15,28 -5,22 Z" fill="url(#metaLeafGrad)" stroke="#15803d" stroke-width="1.5"/>

    <!-- Tubuh Ulat Beruas-ruas Realistis -->
    <g transform="translate(-10, 5)">
      <circle cx="-28" cy="0" r="7" fill="#84cc16" stroke="#4d7c0f" stroke-width="1.2"/>
      <circle cx="-16" cy="-2" r="7.5" fill="#a3e635" stroke="#4d7c0f" stroke-width="1.2"/>
      <circle cx="-4" cy="-3" r="8" fill="#84cc16" stroke="#4d7c0f" stroke-width="1.2"/>
      <circle cx="9" cy="-2" r="8.5" fill="#a3e635" stroke="#4d7c0f" stroke-width="1.2"/>
      <circle cx="22" cy="0" r="8" fill="#84cc16" stroke="#4d7c0f" stroke-width="1.2"/>
      <circle cx="34" cy="3" r="7" fill="#65a30d" stroke="#365314" stroke-width="1.2"/> <!-- Kepala Ulat -->
      <!-- Mata & Ocelli Kepala -->
      <circle cx="37" cy="1" r="1.5" fill="#0f172a"/>
      <!-- Bintik-bintik Ruas Tubuh -->
      <circle cx="-16" cy="-2" r="1.5" fill="#0f172a"/>
      <circle cx="-4" cy="-3" r="1.5" fill="#0f172a"/>
      <circle cx="9" cy="-2" r="1.5" fill="#0f172a"/>
      <circle cx="22" cy="0" r="1.5" fill="#0f172a"/>
    </g>

    <!-- Label -->
    <rect x="-55" y="24" width="110" height="18" rx="4" fill="#4d7c0f"/>
    <text x="0" y="37" text-anchor="middle" font-size="10" font-weight="800" fill="#ffffff">2. Ulat (Larva)</text>
  </g>

  <!-- ==================== TAHAP 3: KEPOMPONG / PUPA (KANAN) ==================== -->
  <g transform="translate(535, 215)" filter="url(#metaCardShadow)">
    <rect x="-85" y="-45" width="170" height="90" rx="10" fill="${isTarget.kepompong ? '#fefce8' : '#ffffff'}" stroke="${isTarget.kepompong ? '#ca8a04' : '#cbd5e1'}" stroke-width="${isTarget.kepompong ? 2.5 : 1.2}"/>

    <!-- Ranting Gantung & Benang Sutra (Silk Girdle) -->
    <line x1="0" y1="-30" x2="0" y2="-12" stroke="#e2e8f0" stroke-width="2"/>
    
    <!-- Kepompong Bergelantungan Emas-Kehijauan -->
    <path d="M 0,-12 C 14,-6 18,12 10,24 C 5,30 0,36 0,36 C 0,36 -5,30 -10,24 C -18,12 -14,-6 0,-12 Z" fill="url(#metaPupaGrad)" stroke="#a16207" stroke-width="1.8"/>
    <!-- Alur Sayap di Balik Kulit Kepompong -->
    <path d="M -6,4 Q 0,14 6,4 M -8,12 Q 0,20 8,12" fill="none" stroke="#713f12" stroke-width="1.2"/>
    <circle cx="0" cy="-6" r="2" fill="#ca8a04"/>

    <!-- Label -->
    <rect x="-60" y="24" width="120" height="18" rx="4" fill="#a16207"/>
    <text x="0" y="37" text-anchor="middle" font-size="10" font-weight="800" fill="#ffffff">3. Kepompong (Pupa)</text>
  </g>

  <!-- ==================== TAHAP 4: KUPU-KUPU DEWASA / IMAGO (BAWAH) ==================== -->
  <g transform="translate(350, 335)" filter="url(#metaCardShadow)">
    <rect x="-105" y="-42" width="210" height="84" rx="10" fill="${isTarget.kupu ? '#fff7ed' : '#ffffff'}" stroke="${isTarget.kupu ? '#ea580c' : '#cbd5e1'}" stroke-width="${isTarget.kupu ? 2.5 : 1.2}"/>

    <!-- Sayap Kiri Atas & Bawah -->
    <path d="M -4,-6 C -25,-32 -55,-28 -60,-10 C -64,4 -52,14 -40,10 C -48,22 -35,32 -20,26 C -8,22 -4,12 -4,2 Z" fill="url(#metaWingGrad)" stroke="#7c2d12" stroke-width="1.5"/>
    <circle cx="-42" cy="-14" r="5" fill="#fef08a" stroke="#7c2d12" stroke-width="1"/>
    <circle cx="-32" cy="18" r="3" fill="#ffffff"/>

    <!-- Sayap Kanan Atas & Bawah (Simetris) -->
    <path d="M 4,-6 C 25,-32 55,-28 60,-10 C 64,4 52,14 40,10 C 48,22 35,32 20,26 C 8,22 4,12 4,2 Z" fill="url(#metaWingGrad)" stroke="#7c2d12" stroke-width="1.5"/>
    <circle cx="42" cy="-14" r="5" fill="#fef08a" stroke="#7c2d12" stroke-width="1"/>
    <circle cx="32" cy="18" r="3" fill="#ffffff"/>

    <!-- Tubuh Toraks & Abdomen Kupu-kupu -->
    <ellipse cx="0" cy="4" rx="3.5" ry="14" fill="#1e293b"/>
    <circle cx="0" cy="-10" r="3.5" fill="#0f172a"/>
    <!-- Antena Berkepala Club -->
    <path d="M -2,-13 Q -8,-24 -12,-22 M 2,-13 Q 8,-24 12,-22" fill="none" stroke="#0f172a" stroke-width="1.2"/>

    <!-- Label -->
    <rect x="-65" y="20" width="130" height="18" rx="4" fill="#c2410c"/>
    <text x="0" y="33" text-anchor="middle" font-size="10" font-weight="800" fill="#ffffff">4. Kupu-Kupu (Imago)</text>
  </g>

  <!-- ==================== TARGET POINTER DINAMIS HURUF X ==================== -->
  <g id="target_pointer">
    <!-- Efek Beacon Berpendar -->
    <circle cx="${target.x}" cy="${target.y}" r="26" fill="#e11d48" opacity="0.18"/>
    <circle cx="${target.x}" cy="${target.y}" r="18" fill="#e11d48" opacity="0.3"/>
    
    <!-- Badge Target Huruf X -->
    <circle cx="${target.x}" cy="${target.y}" r="17" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#metaGlow)"/>
    <text x="${target.x}" y="${target.y + 6}" text-anchor="middle" font-size="16" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Footer Banner Prompt Ujian -->
  <rect x="2" y="408" width="696" height="30" rx="6" fill="#f1f5f9"/>
  <text x="350" y="427" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">Tahapan yang ditunjuk oleh huruf "${escapeXml(labelChar)}" (${escapeXml(target.name)})</text>
</svg>`;
}

/** Render Bagian-Bagian Bunga Sempurna dengan Tanda X (Enterprise Textbook Grade) */
export function renderBagianBungaSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'putik').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 165, y: 64, name: 'Kepala Putik (Stigma)', side: 'right' };
  let isTarget = {
    putik: false,
    sari: false,
    mahkota: false,
    kelopak: false,
    biji: false,
    dasar: false
  };

  if (pointer.includes('sari') || pointer.includes('benang') || pointer.includes('anther')) {
    target = { x: 122, y: 78, name: 'Benang Sari (Stamen)', side: 'left' };
    isTarget.sari = true;
  } else if (pointer.includes('mahkota') || pointer.includes('petal') || pointer.includes('corolla')) {
    target = { x: 232, y: 104, name: 'Mahkota Bunga (Petal)', side: 'right' };
    isTarget.mahkota = true;
  } else if (pointer.includes('kelopak') || pointer.includes('sepal') || pointer.includes('calyx')) {
    target = { x: 120, y: 168, name: 'Kelopak Bunga (Sepal)', side: 'left' };
    isTarget.kelopak = true;
  } else if (pointer.includes('biji') || pointer.includes('bakal') || pointer.includes('ovulum') || pointer.includes('ovarium')) {
    target = { x: 165, y: 148, name: 'Bakal Biji (Ovula)', side: 'right' };
    isTarget.biji = true;
  } else {
    // Default Putik
    isTarget.putik = true;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 255" width="340" height="255" style="background:#ffffff; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; border-radius:8px;">
  <defs>
    <!-- Gradien Mahkota Bunga Mawar / Kembang Sepatu -->
    <linearGradient id="petalGradL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbcfe8"/>
      <stop offset="60%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
    <linearGradient id="petalGradR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbcfe8"/>
      <stop offset="60%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>

    <!-- Filter Glow -->
    <filter id="flowerGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.4"/>
    </filter>

    <marker id="bArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <!-- Judul Bagan -->
  <text x="170" y="20" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Penampang Bagian-Bagian Bunga</text>

  <!-- Tangkai Bunga (Pedicel) & Dasar Bunga (Receptacle) -->
  <path d="M 162,176 L 162,224 Q 165,228 168,224 L 168,176 Z" fill="#15803d" stroke="#166534" stroke-width="1.5"/>
  <ellipse cx="165" cy="174" rx="24" ry="10" fill="#22c55e" stroke="#15803d" stroke-width="1.8"/>

  <!-- Kelopak Bunga (Sepal) Kiri & Kanan -->
  <path d="M 144,172 C 112,174 104,188 128,180 C 136,176 142,172 144,172 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.8"/>
  <path d="M 186,172 C 218,174 226,188 202,180 C 194,176 188,172 186,172 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.8"/>

  <!-- Mahkota Bunga (Petal) Belakang / Samping -->
  <path d="M 148,160 C 95,130 85,65 130,85 C 150,95 156,135 152,156 Z" fill="url(#petalGradL)" stroke="#be185d" stroke-width="1.8"/>
  <path d="M 182,160 C 235,130 245,65 200,85 C 180,95 174,135 178,156 Z" fill="url(#petalGradR)" stroke="#be185d" stroke-width="1.8"/>
  <path d="M 152,145 C 140,85 190,85 178,145 Z" fill="#f472b6" fill-opacity="0.7" stroke="#db2777" stroke-width="1.5"/>

  <!-- Urat Halus Mahkota Bunga -->
  <path d="M 125,125 Q 115,100 120,85 M 205,125 Q 215,100 210,85" fill="none" stroke="#be185d" stroke-width="1" stroke-dasharray="2,2"/>

  <!-- Bakal Buah (Ovarium) di Pusat Dasar Bunga -->
  <ellipse cx="165" cy="148" rx="20" ry="24" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/>
  <!-- Bakal Biji (Ovula) di Dalam Ovarium -->
  <circle cx="160" cy="143" r="4.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
  <circle cx="170" cy="143" r="4.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
  <circle cx="165" cy="153" r="4.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>

  <!-- Tangkai Putik (Style) Menjulang ke Atas -->
  <line x1="165" y1="126" x2="165" y2="68" stroke="#15803d" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Kepala Putik (Stigma 3 Lobus Perekat) -->
  <ellipse cx="165" cy="64" rx="9" ry="6" fill="#16a34a" stroke="#14532d" stroke-width="2"/>
  <circle cx="161" cy="62" r="3" fill="#86efac"/>
  <circle cx="169" cy="62" r="3" fill="#86efac"/>

  <!-- Benang Sari (Stamen) Kiri: Tangkai Sari + Kepala Sari -->
  <path d="M 154,136 Q 124,110 122,82" fill="none" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="122" cy="78" rx="6" ry="4" transform="rotate(-20 122 78)" fill="#facc15" stroke="#a16207" stroke-width="1.5"/>
  <circle cx="122" cy="78" r="1.5" fill="#78350f"/>

  <!-- Benang Sari (Stamen) Kanan: Tangkai Sari + Kepala Sari -->
  <path d="M 176,136 Q 206,110 208,82" fill="none" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="208" cy="78" rx="6" ry="4" transform="rotate(20 208 78)" fill="#facc15" stroke="#a16207" stroke-width="1.5"/>
  <circle cx="208" cy="78" r="1.5" fill="#78350f"/>

  <!-- Panah Penunjuk Dinamis Leader Line Target X -->
  <g>
    <line x1="285" y1="${target.y}" x2="${target.x + 8}" y2="${target.y}" stroke="#e11d48" stroke-width="2.2" marker-end="url(#bArr)"/>
    <circle cx="294" cy="${target.y}" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#flowerGlow)"/>
    <text x="294" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="170" y="246" text-anchor="middle" font-size="11" fill="#64748b">Bagian bunga bertanda huruf "${escapeXml(labelChar)}"</text>
</svg>`;
}

/** 3. Render Metamorfosis Katak */
export function renderMetamorfosisKatakSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'berudu').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 1; // 0: Telur, 1: Berudu, 2: Berudu Berkaki, 3: Katak Muda, 4: Katak Dewasa
  if (pointer.includes('telur')) activeIdx = 0;
  else if (pointer.includes('kaki') || pointer.includes('berudu 4')) activeIdx = 2;
  else if (pointer.includes('muda') || pointer.includes('ekor') || pointer.includes('berekor')) activeIdx = 3;
  else if (pointer.includes('dewasa') || pointer.includes('katak besar')) activeIdx = 4;

  const stages = [
    { x: 45, y: 110, name: '1. Telur', r: 24 },
    { x: 125, y: 65, name: '2. Berudu', r: 24 },
    { x: 220, y: 65, name: '3. Berudu Kaki', r: 24 },
    { x: 315, y: 110, name: '4. Katak Muda', r: 24 },
    { x: 180, y: 180, name: '5. Katak Dewasa', r: 26 }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="frogArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Daur Hidup (Metamorfosis Sempurna) Katak</text>

  <!-- Panah Siklus Melingkar -->
  <path d="M 68,96 Q 88,72 102,68" fill="none" stroke="#0284c7" stroke-width="1.8" marker-end="url(#frogArr)"/>
  <path d="M 152,65 L 192,65" fill="none" stroke="#0284c7" stroke-width="1.8" marker-end="url(#frogArr)"/>
  <path d="M 248,70 Q 280,80 295,98" fill="none" stroke="#0284c7" stroke-width="1.8" marker-end="url(#frogArr)"/>
  <path d="M 305,135 Q 275,175 220,180" fill="none" stroke="#0284c7" stroke-width="1.8" marker-end="url(#frogArr)"/>
  <path d="M 145,180 Q 75,175 52,136" fill="none" stroke="#0284c7" stroke-width="1.8" marker-end="url(#frogArr)"/>

  <!-- Tahap 1: Telur Katak -->
  <g>
    <circle cx="45" cy="105" r="22" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
    <circle cx="40" cy="100" r="4" fill="#15803d"/>
    <circle cx="50" cy="102" r="4" fill="#15803d"/>
    <circle cx="44" cy="112" r="4" fill="#15803d"/>
    <text x="45" y="140" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">1. Telur</text>
  </g>

  <!-- Tahap 2: Berudu (Kecebong) -->
  <g>
    <ellipse cx="120" cy="65" rx="14" ry="9" fill="#94a3b8" stroke="#475569" stroke-width="1.2"/>
    <path d="M 132,65 Q 148,60 152,67 Q 146,74 132,65" fill="#cbd5e1" stroke="#475569" stroke-width="1"/>
    <circle cx="114" cy="63" r="1.5" fill="#0f172a"/>
    <text x="125" y="90" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#334155">2. Berudu</text>
  </g>

  <!-- Tahap 3: Berudu Berkaki -->
  <g>
    <ellipse cx="220" cy="65" rx="14" ry="9" fill="#86efac" stroke="#16a34a" stroke-width="1.2"/>
    <path d="M 232,65 Q 248,60 252,67 Q 246,74 232,65" fill="#bbf7d0" stroke="#16a34a" stroke-width="1"/>
    <!-- Kaki kecil -->
    <path d="M 216,73 L 210,81 M 224,73 L 230,81" stroke="#15803d" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="214" cy="63" r="1.5" fill="#0f172a"/>
    <text x="220" y="96" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">3. Berudu Berkaki</text>
  </g>

  <!-- Tahap 4: Katak Muda (Berekor) -->
  <g>
    <ellipse cx="315" cy="105" rx="16" ry="12" fill="#4ade80" stroke="#15803d" stroke-width="1.4"/>
    <path d="M 328,105 Q 345,103 348,108 Q 342,112 328,105" fill="#86efac" stroke="#15803d" stroke-width="1"/>
    <circle cx="310" cy="100" r="2" fill="#0f172a"/>
    <path d="M 304,115 L 298,124 M 322,115 L 328,124" stroke="#15803d" stroke-width="2" stroke-linecap="round"/>
    <text x="315" y="140" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">4. Katak Muda</text>
  </g>

  <!-- Tahap 5: Katak Dewasa -->
  <g>
    <ellipse cx="180" cy="180" rx="24" ry="17" fill="#22c55e" stroke="#15803d" stroke-width="1.8"/>
    <!-- Kepala & Mata -->
    <circle cx="170" cy="168" r="4.5" fill="#86efac" stroke="#15803d" stroke-width="1"/>
    <circle cx="170" cy="168" r="2" fill="#0f172a"/>
    <circle cx="190" cy="168" r="4.5" fill="#86efac" stroke="#15803d" stroke-width="1"/>
    <circle cx="190" cy="168" r="2" fill="#0f172a"/>
    <!-- Kaki Belakang Kuat -->
    <path d="M 160,185 Q 145,175 142,192 Q 146,198 155,195" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 200,185 Q 215,175 218,192 Q 214,198 205,195" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>
    <text x="180" y="215" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">5. Katak Dewasa</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${stages[activeIdx].x}" cy="${stages[activeIdx].y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${stages[activeIdx].x}" y="${stages[activeIdx].y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tahapan metamorfosis katak pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 4. Render Metamorfosis Nyamuk */
export function renderMetamorfosisNyamukSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'jentik').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 1; // 0: Telur, 1: Jentik, 2: Pupa, 3: Nyamuk Dewasa
  if (pointer.includes('telur')) activeIdx = 0;
  else if (pointer.includes('pupa') || pointer.includes('koma')) activeIdx = 2;
  else if (pointer.includes('dewasa') || pointer.includes('imago') || pointer.includes('terbang')) activeIdx = 3;

  const positions = [
    { x: 75, y: 78, name: 'Telur Rakit' },
    { x: 155, y: 155, name: 'Jentik (Larva)' },
    { x: 260, y: 150, name: 'Pupa (Kepompong)' },
    { x: 335, y: 78, name: 'Nyamuk Dewasa' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
  </defs>

  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Daur Hidup (Metamorfosis) Nyamuk</text>

  <!-- Permukaan Air & Kolam -->
  <rect x="20" y="105" width="360" height="115" rx="6" fill="url(#waterGrad)" stroke="#7dd3fc" stroke-width="1.2"/>
  <path d="M 20,105 Q 110,100 200,105 T 380,105" fill="none" stroke="#0284c7" stroke-width="2"/>
  <text x="50" y="122" font-size="9" font-weight="bold" fill="#0369a1">Permukaan Air</text>

  <!-- 1. Telur di atas air -->
  <g>
    <rect x="55" y="98" width="38" height="7" rx="2" fill="#78350f" stroke="#451a03" stroke-width="0.8"/>
    <line x1="62" y1="98" x2="62" y2="105" stroke="#451a03" stroke-width="0.8"/>
    <line x1="70" y1="98" x2="70" y2="105" stroke="#451a03" stroke-width="0.8"/>
    <line x1="78" y1="98" x2="78" y2="105" stroke="#451a03" stroke-width="0.8"/>
    <line x1="85" y1="98" x2="85" y2="105" stroke="#451a03" stroke-width="0.8"/>
    <text x="74" y="85" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#78350f">1. Telur</text>
  </g>

  <!-- 2. Jentik (Larva) menggantung di air -->
  <g>
    <path d="M 155,106 L 155,116 L 148,150 L 140,165" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round"/>
    <circle cx="140" cy="166" r="4.5" fill="#475569"/>
    <!-- Sifon napas ke permukaan air -->
    <line x1="155" y1="106" x2="160" y2="120" stroke="#0284c7" stroke-width="2"/>
    <text x="155" y="190" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#334155">2. Jentik (Larva)</text>
  </g>

  <!-- 3. Pupa bentuk koma -->
  <g>
    <ellipse cx="260" cy="132" rx="10" ry="12" fill="#475569"/>
    <path d="M 264,142 Q 256,155 248,150" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
    <line x1="255" y1="122" x2="258" y2="106" stroke="#0284c7" stroke-width="1.8"/>
    <text x="260" y="190" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#334155">3. Pupa</text>
  </g>

  <!-- 4. Nyamuk Dewasa (Imago) terbang di udara -->
  <g>
    <!-- Tubuh nyamuk -->
    <line x1="330" y1="80" x2="350" y2="72" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="328" cy="81" r="3.5" fill="#0f172a"/>
    <!-- Jarum probosis -->
    <line x1="325" y1="83" x2="315" y2="88" stroke="#e11d48" stroke-width="1.2"/>
    <!-- Sayap -->
    <ellipse cx="338" cy="65" rx="14" ry="5" transform="rotate(-30 338 65)" fill="#e2e8f0" fill-opacity="0.8" stroke="#64748b" stroke-width="1"/>
    <!-- Kaki ramping -->
    <path d="M 334,80 L 328,95 L 320,102 M 342,78 L 348,95 L 358,102" fill="none" stroke="#334155" stroke-width="1.2"/>
    <text x="335" y="52" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0f172a">4. Nyamuk Dewasa</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${positions[activeIdx].x}" cy="${positions[activeIdx].y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${positions[activeIdx].x}" y="${positions[activeIdx].y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tahapan daur hidup nyamuk pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 5. Render Bentuk Adaptasi Paruh Burung */
export function renderParuhBurungSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'elang').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Elang, 1: Pipit, 2: Kolibri, 3: Bebek
  if (pointer.includes('pipit') || pointer.includes('biji')) activeIdx = 1;
  else if (pointer.includes('kolibri') || pointer.includes('nektar')) activeIdx = 2;
  else if (pointer.includes('bebek') || pointer.includes('lumpur') || pointer.includes('sudu')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, title: 'Paruh Tajam Bengkok', makanan: 'Daging (Karnivor)', hewan: 'Elang / Rajawali' },
    { x: 205, y: 42, title: 'Paruh Pendek Tebal', makanan: 'Biji-bijian (Granivor)', hewan: 'Burung Pipit' },
    { x: 15, y: 145, title: 'Paruh Panjang Ramping', makanan: 'Nektar Bunga', hewan: 'Kolibri' },
    { x: 205, y: 145, title: 'Paruh Lebar Pipih (Sudu)', makanan: 'Ikan/Cacing Lumpur', hewan: 'Bebek / Itik' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Bentuk Adaptasi Paruh Burung Terhadap Makanan</text>

  <!-- Panel 1: Paruh Elang -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="25" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Paruh Pencabik` : 'Paruh Tajam Bengkok'}</text>
  <!-- Ilustrasi Paruh Elang -->
  <path d="M 28,95 Q 52,70 65,95 Q 70,110 58,110 Q 52,118 42,108 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.2"/>
  <path d="M 62,92 Q 78,92 82,108 Q 72,112 62,100 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
  <circle cx="52" cy="88" r="2.5" fill="#0f172a"/>
  <text x="92" y="85" font-size="9" font-weight="bold" fill="#334155">Pencabik Daging</text>
  <text x="92" y="100" font-size="8.5" fill="#64748b">Contoh: Elang</text>

  <!-- Panel 2: Paruh Pipit -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="215" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Paruh Pemecah Biji` : 'Paruh Pendek Tebal'}</text>
  <!-- Ilustrasi Paruh Pipit -->
  <circle cx="245" cy="95" r="16" fill="#cbd5e1" stroke="#64748b" stroke-width="1.2"/>
  <path d="M 258,90 L 278,95 L 258,102 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
  <circle cx="245" cy="90" r="2.5" fill="#0f172a"/>
  <text x="284" y="85" font-size="9" font-weight="bold" fill="#334155">Pemecah Biji</text>
  <text x="284" y="100" font-size="8.5" fill="#64748b">Contoh: Pipit</text>

  <!-- Panel 3: Paruh Kolibri -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="25" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Paruh Penghisap Nektar` : 'Paruh Ramping Panjang'}</text>
  <!-- Ilustrasi Kolibri -->
  <circle cx="45" cy="195" r="14" fill="#a7f3d0" stroke="#059669" stroke-width="1.2"/>
  <path d="M 58,193 L 95,196 L 58,198 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.2"/>
  <circle cx="46" cy="190" r="2.5" fill="#0f172a"/>
  <text x="100" y="188" font-size="9" font-weight="bold" fill="#334155">Penghisap Nektar</text>
  <text x="100" y="203" font-size="8.5" fill="#64748b">Contoh: Kolibri</text>

  <!-- Panel 4: Paruh Bebek -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="215" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Paruh Penyaring Lumpur` : 'Paruh Sudu Lebar'}</text>
  <!-- Ilustrasi Bebek -->
  <ellipse cx="242" cy="195" rx="15" ry="14" fill="#fed7aa" stroke="#ea580c" stroke-width="1.2"/>
  <path d="M 254,190 C 275,190 282,196 280,202 C 275,206 254,204 254,190 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
  <circle cx="240" cy="190" r="2.5" fill="#0f172a"/>
  <text x="286" y="188" font-size="9" font-weight="bold" fill="#334155">Penyaring Makanan</text>
  <text x="286" y="203" font-size="8.5" fill="#64748b">Contoh: Bebek</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Fungsi paruh burung pada tanda "${escapeXml(labelChar)}" adalah untuk ...</text>
</svg>`;
}

/** 6. Render Bentuk Adaptasi Kaki & Cakar Burung */
export function renderKakiBurungSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'cengkeram').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Pencengkeram (Elang), 1: Perenang (Bebek), 2: Pemanjat (Pelatuk), 3: Pengais (Ayam)
  if (pointer.includes('renang') || pointer.includes('selaput') || pointer.includes('bebek')) activeIdx = 1;
  else if (pointer.includes('panjat') || pointer.includes('pelatuk')) activeIdx = 2;
  else if (pointer.includes('kais') || pointer.includes('ayam')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, title: 'Kaki Pencengkeram', contoh: 'Elang' },
    { x: 205, y: 42, title: 'Kaki Berselaput (Perenang)', contoh: 'Bebek / Angsa' },
    { x: 15, y: 145, title: 'Kaki Pemanjat', contoh: 'Burung Pelatuk' },
    { x: 205, y: 145, title: 'Kaki Pengais', contoh: 'Ayam' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Bentuk Adaptasi Kaki dan Cakar Burung</text>

  <!-- Panel 1: Cakar Elang -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="25" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Pencengkeram` : 'Kaki Pencengkeram'}</text>
  <!-- Ilustrasi Cakar Tajam Melengkung -->
  <line x1="50" y1="72" x2="50" y2="92" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
  <path d="M 50,92 Q 40,108 30,105 M 50,92 Q 50,112 48,118 M 50,92 Q 62,110 70,108 M 50,92 Q 65,85 70,82" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
  <text x="86" y="85" font-size="9" font-weight="bold" fill="#334155">Cengkeram Mangsa</text>
  <text x="86" y="100" font-size="8.5" fill="#64748b">Cakar kukuh &amp; tajam</text>

  <!-- Panel 2: Kaki Berselaput Bebek -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="215" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Perenang` : 'Kaki Berselaput'}</text>
  <!-- Ilustrasi Selaput Renang -->
  <line x1="242" y1="72" x2="242" y2="92" stroke="#ea580c" stroke-width="4" stroke-linecap="round"/>
  <path d="M 226,115 L 242,92 L 258,115 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>
  <line x1="242" y1="92" x2="242" y2="118" stroke="#c2410c" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="242" y1="92" x2="226" y2="115" stroke="#c2410c" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="242" y1="92" x2="258" y2="115" stroke="#c2410c" stroke-width="2.5" stroke-linecap="round"/>
  <text x="274" y="85" font-size="9" font-weight="bold" fill="#334155">Berenang di Air</text>
  <text x="274" y="100" font-size="8.5" fill="#64748b">Selaput antar jari</text>

  <!-- Panel 3: Kaki Pemanjat (Pelatuk) -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="25" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Pemanjat` : 'Kaki Pemanjat'}</text>
  <!-- Ilustrasi 2 jari depan 2 jari belakang -->
  <line x1="50" y1="175" x2="50" y2="195" stroke="#78350f" stroke-width="3.5"/>
  <path d="M 50,195 L 40,185 M 50,195 L 42,175 M 50,195 L 60,205 M 50,195 L 65,215" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
  <text x="86" y="188" font-size="9" font-weight="bold" fill="#334155">Memanjat Pohon</text>
  <text x="86" y="203" font-size="8.5" fill="#64748b">2 Depan, 2 Belakang</text>

  <!-- Panel 4: Kaki Pengais (Ayam) -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="215" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Pengais` : 'Kaki Pengais'}</text>
  <!-- Ilustrasi Kaki Ayam & Taji -->
  <line x1="242" y1="175" x2="242" y2="200" stroke="#d97706" stroke-width="3.5"/>
  <path d="M 242,200 L 225,215 M 242,200 L 242,218 M 242,200 L 260,215 M 242,192 L 234,188" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round"/>
  <text x="274" y="188" font-size="9" font-weight="bold" fill="#334155">Mengais Makanan</text>
  <text x="274" y="203" font-size="8.5" fill="#64748b">3 Depan, 1 Belakang</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bentuk adaptasi kaki burung pada huruf "${escapeXml(labelChar)}" berguna untuk ...</text>
</svg>`;
}

/** 7. Render Pola Interaksi Simbiosis */
export function renderSimbiosisSvg(params: { tipe?: string; label?: string }): string {
  const tipe = (params.tipe || 'mutualisme').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Mutualisme, 1: Komensalisme, 2: Parasitisme
  if (tipe.includes('komen')) activeIdx = 1;
  else if (tipe.includes('parasit')) activeIdx = 2;

  const cols = [
    { x: 15, w: 190, h: 300, title: 'Mutualisme', simbol: '( + / + )' },
    { x: 215, w: 190, h: 300, title: 'Komensalisme', simbol: '( + / 0 )' },
    { x: 415, w: 190, h: 300, title: 'Parasitisme', simbol: '( + / - )' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 370" width="620" height="370" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="mutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>
    <linearGradient id="komGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="parGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>
    <filter id="glowSimbiosis" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Container Frame -->
  <rect width="620" height="370" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Main Title -->
  <text x="310" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pola Interaksi Simbiosis Makhluk Hidup dalam Ekosistem</text>

  <!-- ==================== KOLOM 1: MUTUALISME (+ / +) ==================== -->
  <rect x="15" y="44" width="190" height="282" rx="8" fill="url(#mutGrad)" stroke="${activeIdx === 0 ? '#e11d48' : '#86efac'}" stroke-width="${activeIdx === 0 ? 2.5 : 1.2}"/>
  <text x="110" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="${activeIdx === 0 ? '#be123c' : '#15803d'}">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Mutualisme` : 'Mutualisme'}</text>
  
  <!-- Pill Rumus Simbiosis -->
  <rect x="65" y="80" width="90" height="24" rx="12" fill="#86efac"/>
  <text x="110" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="#14532d">+ / +</text>
  <text x="110" y="120" text-anchor="middle" font-size="9" font-weight="bold" fill="#15803d">Saling Menguntungkan</text>

  <!-- Ilustrasi Vektor Detail: Lebah Madu & Bunga Mekar -->
  <g id="simb_lebah_bunga">
    <!-- Mahkota Bunga (Kuning-Merah) -->
    <circle cx="110" cy="180" r="16" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="88" cy="180" r="13" fill="#fda4af" stroke="#e11d48" stroke-width="1.2"/>
    <circle cx="132" cy="180" r="13" fill="#fda4af" stroke="#e11d48" stroke-width="1.2"/>
    <circle cx="110" cy="158" r="13" fill="#fda4af" stroke="#e11d48" stroke-width="1.2"/>
    <circle cx="110" cy="202" r="13" fill="#fda4af" stroke="#e11d48" stroke-width="1.2"/>
    <!-- Pusat Bunga & Serbuk Sari -->
    <circle cx="110" cy="180" r="9" fill="#eab308"/>
    <!-- Lebah Madu Menghisap Nektar -->
    <ellipse cx="85" cy="150" rx="14" ry="9" transform="rotate(-25 85 150)" fill="#fbbf24" stroke="#78350f" stroke-width="1.5"/>
    <!-- Garis Garis Hitam Lebah -->
    <line x1="82" y1="143" x2="82" y2="157" stroke="#451a03" stroke-width="2"/>
    <line x1="88" y1="143" x2="88" y2="157" stroke="#451a03" stroke-width="2"/>
    <!-- Sayap Transparan Lebah -->
    <ellipse cx="85" cy="138" rx="10" ry="5" transform="rotate(15 85 138)" fill="#e0f2fe" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1"/>
    <!-- Panah Aliran Timbal Balik -->
    <path d="M 68,168 Q 80,185 96,182" fill="none" stroke="#16a34a" stroke-width="1.5"/>
  </g>

  <!-- Keterangan Contoh -->
  <line x1="30" y1="228" x2="190" y2="228" stroke="#86efac" stroke-width="1"/>
  <text x="110" y="246" text-anchor="middle" font-size="9" font-weight="bold" fill="#14532d">Contoh Simbiosis:</text>
  <text x="110" y="262" text-anchor="middle" font-size="9.5" font-weight="600" fill="#166534">Lebah &amp; Bunga</text>
  <text x="110" y="278" text-anchor="middle" font-size="8.5" fill="#475569">Kerbau &amp; Burung Jalak</text>
  <text x="110" y="294" text-anchor="middle" font-size="8.5" fill="#475569">Ikan Badut &amp; Anemon</text>

  <!-- ==================== KOLOM 2: KOMENSALISME (+ / 0) ==================== -->
  <rect x="215" y="44" width="190" height="282" rx="8" fill="url(#komGrad)" stroke="${activeIdx === 1 ? '#e11d48' : '#7dd3fc'}" stroke-width="${activeIdx === 1 ? 2.5 : 1.2}"/>
  <text x="310" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="${activeIdx === 1 ? '#be123c' : '#0369a1'}">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Komensalisme` : 'Komensalisme'}</text>
  
  <!-- Pill Rumus Simbiosis -->
  <rect x="265" y="80" width="90" height="24" rx="12" fill="#7dd3fc"/>
  <text x="310" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="#0c4a6e">+ / 0</text>
  <text x="310" y="120" text-anchor="middle" font-size="9" font-weight="bold" fill="#0284c7">Satu Untung, Satu Netral</text>

  <!-- Ilustrasi Vektor Detail: Ikan Hiu & Ikan Remora -->
  <g id="simb_hiu_remora">
    <!-- Tubuh Ikan Hiu -->
    <path d="M 235,170 C 260,150 330,148 375,166 C 360,178 315,188 265,180 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.8"/>
    <!-- Sirip Punggung Hiu -->
    <path d="M 288,154 L 302,135 L 314,152 Z" fill="#64748b" stroke="#334155" stroke-width="1.4"/>
    <!-- Ekor Hiu -->
    <path d="M 375,166 L 392,152 L 386,170 L 394,182 Z" fill="#64748b" stroke="#334155" stroke-width="1.4"/>
    <!-- Mata & Insang Hiu -->
    <circle cx="250" cy="168" r="2.5" fill="#0f172a"/>
    <path d="M 268,165 Q 266,175 272,178" stroke="#475569" stroke-width="1.2" fill="none"/>
    
    <!-- Ikan Remora Kecil di Bawah Hiu -->
    <path d="M 270,192 C 285,186 315,186 332,192 C 315,198 285,198 270,192 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2"/>
    <!-- Bantalan Penghisap Remora -->
    <ellipse cx="282" cy="189" rx="6" ry="2" fill="#bae6fd" stroke="#0369a1" stroke-width="0.8"/>
    <!-- Ekor Remora -->
    <polygon points="332,192 340,187 340,197" fill="#0284c7"/>
  </g>

  <!-- Keterangan Contoh -->
  <line x1="230" y1="228" x2="390" y2="228" stroke="#7dd3fc" stroke-width="1"/>
  <text x="310" y="246" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">Contoh Simbiosis:</text>
  <text x="310" y="262" text-anchor="middle" font-size="9.5" font-weight="600" fill="#0284c7">Hiu &amp; Ikan Remora</text>
  <text x="310" y="278" text-anchor="middle" font-size="8.5" fill="#475569">Anggrek &amp; Pohon Inang</text>
  <text x="310" y="294" text-anchor="middle" font-size="8.5" fill="#475569">Sirih &amp; Pohon Kelor</text>

  <!-- ==================== KOLOM 3: PARASITISME (+ / -) ==================== -->
  <rect x="415" y="44" width="190" height="282" rx="8" fill="url(#parGrad)" stroke="${activeIdx === 2 ? '#e11d48' : '#fda4af'}" stroke-width="${activeIdx === 2 ? 2.5 : 1.2}"/>
  <text x="510" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="${activeIdx === 2 ? '#be123c' : '#e11d48'}">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Parasitisme` : 'Parasitisme'}</text>
  
  <!-- Pill Rumus Simbiosis -->
  <rect x="465" y="80" width="90" height="24" rx="12" fill="#fda4af"/>
  <text x="510" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="#881337">+ / -</text>
  <text x="510" y="120" text-anchor="middle" font-size="9" font-weight="bold" fill="#be123c">Satu Untung, Satu Rugi</text>

  <!-- Ilustrasi Vektor Detail: Benalu Menghisap Batang Pohon Inang -->
  <g id="simb_benalu_host">
    <!-- Dahan Pohon Inang (Cokelat Berkayu) -->
    <path d="M 430,188 Q 510,184 590,192 L 590,206 Q 510,198 430,202 Z" fill="#b45309" stroke="#78350f" stroke-width="1.8"/>
    <!-- Batang & Daun Benalu Parasit (Tumbuh Menembus Dahan) -->
    <path d="M 485,186 Q 470,165 475,145 M 505,185 Q 525,160 520,140" stroke="#15803d" stroke-width="2.5" fill="none"/>
    <!-- Daun-daun Benalu -->
    <ellipse cx="468" cy="142" rx="10" ry="5" transform="rotate(-30 468 142)" fill="#4ade80" stroke="#16a34a" stroke-width="1"/>
    <ellipse cx="482" cy="155" rx="9" ry="5" transform="rotate(20 482 155)" fill="#4ade80" stroke="#16a34a" stroke-width="1"/>
    <ellipse cx="522" cy="138" rx="10" ry="5" transform="rotate(25 522 138)" fill="#4ade80" stroke="#16a34a" stroke-width="1"/>
    <!-- Akar Hisap (Haustorium) Menembus Kambium Inang -->
    <path d="M 485,186 L 485,198 M 500,186 L 502,198" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="485" cy="198" r="2.5" fill="#b91c1c"/>
    <circle cx="502" cy="198" r="2.5" fill="#b91c1c"/>
  </g>

  <!-- Keterangan Contoh -->
  <line x1="430" y1="228" x2="590" y2="228" stroke="#fda4af" stroke-width="1"/>
  <text x="510" y="246" text-anchor="middle" font-size="9" font-weight="bold" fill="#be123c">Contoh Simbiosis:</text>
  <text x="510" y="262" text-anchor="middle" font-size="9.5" font-weight="600" fill="#dc2626">Benalu &amp; Inang</text>
  <text x="510" y="278" text-anchor="middle" font-size="8.5" fill="#475569">Tali Putri &amp; Pagar</text>
  <text x="510" y="294" text-anchor="middle" font-size="8.5" fill="#475569">Kutu &amp; Hewan Inang</text>

  <!-- Dynamic Target Badge [X] pada Kolom Terpilih -->
  <circle cx="${cols[activeIdx].x + cols[activeIdx].w - 18}" cy="56" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2.2" filter="url(#glowSimbiosis)"/>
  <text x="${cols[activeIdx].x + cols[activeIdx].w - 18}" y="60.5" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Pedagogical Question Prompt -->
  <text x="310" y="352" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bentuk interaksi pada kolom "${escapeXml(labelChar)}" adalah hubungan ...</text>
</svg>`;
}

/** 8. Render Jaring-Jaring Makanan Ekosistem Sawah (Enterprise Textbook Grade) */
export function renderJaringMakananSawahSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'katak').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 235, y: 195, name: 'Katak (Konsumen II)' };
  if (pointer.includes('padi') || pointer.includes('produsen')) target = { x: 350, y: 355, name: 'Padi (Produsen)' };
  else if (pointer.includes('belalang')) target = { x: 175, y: 275, name: 'Belalang (Konsumen I)' };
  else if (pointer.includes('tikus')) target = { x: 350, y: 275, name: 'Tikus (Konsumen I)' };
  else if (pointer.includes('ulat')) target = { x: 525, y: 275, name: 'Ulat (Konsumen I)' };
  else if (pointer.includes('ayam') || pointer.includes('burung')) target = { x: 465, y: 195, name: 'Ayam (Konsumen II)' };
  else if (pointer.includes('ular')) target = { x: 250, y: 105, name: 'Ular Sawah (Konsumen III)' };
  else if (pointer.includes('elang') || pointer.includes('puncak')) target = { x: 450, y: 105, name: 'Burung Elang (Predator Puncak)' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" width="100%" height="100%" style="background:#f8fafc; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <defs>
    <!-- Gradien Tingkat Trofik -->
    <linearGradient id="webApexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fee2e2"/>
      <stop offset="100%" stop-color="#fecaca"/>
    </linearGradient>
    <linearGradient id="webCons2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="webCons1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
    <linearGradient id="webProdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dcfce7"/>
      <stop offset="100%" stop-color="#bbf7d0"/>
    </linearGradient>

    <!-- Marker Panah Aliran Energi -->
    <marker id="foodArr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
    </marker>
    <marker id="foodArrApex" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>

    <!-- Filter Shadow & Glow -->
    <filter id="webGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#e11d48" flood-opacity="0.4"/>
    </filter>
    <filter id="webCardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background Canvas Card -->
  <rect x="2" y="2" width="696" height="436" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

  <!-- Header Banner -->
  <rect x="2" y="2" width="696" height="46" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="24" y="14" width="6" height="22" rx="3" fill="#0284c7"/>
  <text x="40" y="30" font-size="16" font-weight="800" fill="#0f172a" letter-spacing="0.3">Jaring-Jaring Makanan Ekosistem Sawah</text>
  <text x="390" y="30" font-size="12" font-weight="600" fill="#64748b">(Interkoneksi Rantai Makanan &amp; Aliran Energi)</text>

  <!-- Kolom Panduan Tingkat Trofik di Sisi Kiri -->
  <g transform="translate(18, 70)" opacity="0.85">
    <rect x="0" y="22" width="80" height="28" rx="5" fill="#fee2e2" stroke="#ef4444" stroke-width="1"/>
    <text x="40" y="39" text-anchor="middle" font-size="8.5" font-weight="800" fill="#991b1b">Trofik IV</text>
    
    <rect x="0" y="112" width="80" height="28" rx="5" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/>
    <text x="40" y="129" text-anchor="middle" font-size="8.5" font-weight="800" fill="#92400e">Trofik III</text>
    
    <rect x="0" y="192" width="80" height="28" rx="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1"/>
    <text x="40" y="209" text-anchor="middle" font-size="8.5" font-weight="800" fill="#075985">Trofik II</text>
    
    <rect x="0" y="272" width="80" height="28" rx="5" fill="#dcfce7" stroke="#16a34a" stroke-width="1"/>
    <text x="40" y="289" text-anchor="middle" font-size="8.5" font-weight="800" fill="#166534">Trofik I</text>
  </g>

  <!-- ==================== GARIS PANAH JARING-JARING MAKANAN ==================== -->
  <!-- 1. Dari Padi ke Herbivora (Belalang, Tikus, Ulat) -->
  <path d="M 310,340 C 250,320 205,305 185,295" fill="none" stroke="#059669" stroke-width="2.2" marker-end="url(#foodArr)"/>
  <path d="M 350,336 L 350,296" fill="none" stroke="#059669" stroke-width="2.2" marker-end="url(#foodArr)"/>
  <path d="M 390,340 C 450,320 495,305 515,295" fill="none" stroke="#059669" stroke-width="2.2" marker-end="url(#foodArr)"/>

  <!-- 2. Dari Herbivora ke Konsumen II (Katak, Ayam) -->
  <!-- Belalang -> Katak -->
  <path d="M 190,256 C 205,240 215,225 225,214" fill="none" stroke="#0284c7" stroke-width="2.2" marker-end="url(#foodArr)"/>
  <!-- Belalang -> Ayam -->
  <path d="M 230,265 C 320,240 390,225 435,208" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,2" marker-end="url(#foodArr)"/>
  <!-- Tikus -> Ular (Langsung ke Puncak) -->
  <path d="M 335,256 C 310,210 280,165 260,126" fill="none" stroke="#0284c7" stroke-width="2.2" marker-end="url(#foodArr)"/>
  <!-- Ulat -> Katak -->
  <path d="M 470,265 C 380,240 310,225 265,208" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,2" marker-end="url(#foodArr)"/>
  <!-- Ulat -> Ayam -->
  <path d="M 510,256 C 495,240 485,225 475,214" fill="none" stroke="#0284c7" stroke-width="2.2" marker-end="url(#foodArr)"/>

  <!-- 3. Dari Konsumen II ke Predator Puncak (Ular, Elang) -->
  <!-- Katak -> Ular -->
  <path d="M 238,176 L 246,126" fill="none" stroke="#ea580c" stroke-width="2.2" marker-end="url(#foodArr)"/>
  <!-- Ayam -> Ular -->
  <path d="M 425,188 C 360,170 305,145 272,125" fill="none" stroke="#ea580c" stroke-width="2" marker-end="url(#foodArr)"/>
  <!-- Ayam -> Elang -->
  <path d="M 462,176 L 454,126" fill="none" stroke="#ea580c" stroke-width="2.2" marker-end="url(#foodArr)"/>
  <!-- Ular -> Elang -->
  <path d="M 305,105 L 392,105" fill="none" stroke="#e11d48" stroke-width="2.5" marker-end="url(#foodArrApex)"/>

  <!-- ==================== KARTU ORGANISME TINGKAT TROFIK ==================== -->

  <!-- TINGKAT 4: PREDATOR PUNCAK (Top Level) -->
  <!-- 1. ULAR SAWAH -->
  <g transform="translate(250, 105)" filter="url(#webCardShadow)">
    <rect x="-55" y="-20" width="110" height="40" rx="8" fill="url(#webApexGrad)" stroke="#ef4444" stroke-width="1.8"/>
    <text x="0" y="-3" text-anchor="middle" font-size="12" font-weight="900" fill="#991b1b">Ular</text>
    <text x="0" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#b91c1c">(Konsumen III)</text>
  </g>

  <!-- 2. BURUNG ELANG -->
  <g transform="translate(450, 105)" filter="url(#webCardShadow)">
    <rect x="-55" y="-20" width="110" height="40" rx="8" fill="url(#webApexGrad)" stroke="#ef4444" stroke-width="1.8"/>
    <text x="0" y="-3" text-anchor="middle" font-size="12" font-weight="900" fill="#991b1b">Elang</text>
    <text x="0" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#b91c1c">(Predator Puncak)</text>
  </g>

  <!-- TINGKAT 3: KONSUMEN II (Karnivora / Omnivora) -->
  <!-- 3. KATAK -->
  <g transform="translate(235, 195)" filter="url(#webCardShadow)">
    <rect x="-55" y="-20" width="110" height="40" rx="8" fill="url(#webCons2Grad)" stroke="#f59e0b" stroke-width="1.8"/>
    <text x="0" y="-3" text-anchor="middle" font-size="12" font-weight="900" fill="#92400e">Katak</text>
    <text x="0" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#b45309">(Konsumen II / Karnivora)</text>
  </g>

  <!-- 4. AYAM -->
  <g transform="translate(465, 195)" filter="url(#webCardShadow)">
    <rect x="-55" y="-20" width="110" height="40" rx="8" fill="url(#webCons2Grad)" stroke="#f59e0b" stroke-width="1.8"/>
    <text x="0" y="-3" text-anchor="middle" font-size="12" font-weight="900" fill="#92400e">Ayam</text>
    <text x="0" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#b45309">(Konsumen II / Omnivora)</text>
  </g>

  <!-- TINGKAT 2: KONSUMEN I (Herbivora) -->
  <!-- 5. BELALANG -->
  <g transform="translate(175, 275)" filter="url(#webCardShadow)">
    <rect x="-55" y="-20" width="110" height="40" rx="8" fill="url(#webCons1Grad)" stroke="#0284c7" stroke-width="1.8"/>
    <text x="0" y="-3" text-anchor="middle" font-size="12" font-weight="900" fill="#075985">Belalang</text>
    <text x="0" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#0369a1">(Konsumen I / Herbivora)</text>
  </g>

  <!-- 6. TIKUS -->
  <g transform="translate(350, 275)" filter="url(#webCardShadow)">
    <rect x="-55" y="-20" width="110" height="40" rx="8" fill="url(#webCons1Grad)" stroke="#0284c7" stroke-width="1.8"/>
    <text x="0" y="-3" text-anchor="middle" font-size="12" font-weight="900" fill="#075985">Tikus</text>
    <text x="0" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#0369a1">(Konsumen I / Hama Padi)</text>
  </g>

  <!-- 7. ULAT -->
  <g transform="translate(525, 275)" filter="url(#webCardShadow)">
    <rect x="-55" y="-20" width="110" height="40" rx="8" fill="url(#webCons1Grad)" stroke="#0284c7" stroke-width="1.8"/>
    <text x="0" y="-3" text-anchor="middle" font-size="12" font-weight="900" fill="#075985">Ulat</text>
    <text x="0" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#0369a1">(Konsumen I / Herbivora)</text>
  </g>

  <!-- TINGKAT 1: PRODUSEN (Dasar Jaring Makanan) -->
  <!-- 8. PADI -->
  <g transform="translate(350, 355)" filter="url(#webCardShadow)">
    <rect x="-85" y="-22" width="170" height="44" rx="10" fill="url(#webProdGrad)" stroke="#16a34a" stroke-width="2.5"/>
    <text x="0" y="-3" text-anchor="middle" font-size="13" font-weight="900" fill="#14532d">Padi (Produsen)</text>
    <text x="0" y="13" text-anchor="middle" font-size="8.5" font-weight="700" fill="#15803d">Autotrof (Penghasil Makanan Utama)</text>
  </g>

  <!-- ==================== TARGET POINTER DINAMIS HURUF X ==================== -->
  <g id="target_pointer">
    <!-- Efek Beacon Berpendar -->
    <circle cx="${target.x}" cy="${target.y}" r="26" fill="#e11d48" opacity="0.18"/>
    <circle cx="${target.x}" cy="${target.y}" r="18" fill="#e11d48" opacity="0.3"/>
    
    <!-- Badge Target Huruf X -->
    <circle cx="${target.x}" cy="${target.y}" r="17" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#webGlow)"/>
    <text x="${target.x}" y="${target.y + 6}" text-anchor="middle" font-size="16" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Footer Banner Prompt Ujian -->
  <rect x="2" y="408" width="696" height="30" rx="6" fill="#f1f5f9"/>
  <text x="350" y="427" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">Organisme yang ditandai dengan "${escapeXml(labelChar)}" menduduki peran ... (${escapeXml(target.name)})</text>
</svg>`;
}

/** 9. Render Bentuk Adaptasi Tumbuhan */
export function renderAdaptasiTumbuhanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'kaktus').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Xerofit (Kaktus), 1: Hidrofit (Teratai), 2: Insektivora (Kantong Semar)
  if (pointer.includes('teratai') || pointer.includes('hidrofit') || pointer.includes('air')) activeIdx = 1;
  else if (pointer.includes('kantong') || pointer.includes('semar') || pointer.includes('serangga')) activeIdx = 2;

  const cols = [
    { x: 15, w: 190, h: 300, title: 'Kaktus (Xerofit)' },
    { x: 215, w: 190, h: 300, title: 'Teratai (Hidrofit)' },
    { x: 415, w: 190, h: 300, title: 'Kantong Semar' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 370" width="620" height="370" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="desertGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fefce8"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>
    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>
    <linearGradient id="jungleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <filter id="glowAdaptasi" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Container Frame -->
  <rect width="620" height="370" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Title Header -->
  <text x="310" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Bentuk Adaptasi Morfologi &amp; Fisiologi Tumbuhan</text>

  <!-- ==================== PANEL 1: KAKTUS (XEROFIT) ==================== -->
  <rect x="15" y="44" width="190" height="282" rx="8" fill="url(#desertGrad)" stroke="${activeIdx === 0 ? '#e11d48' : '#facc15'}" stroke-width="${activeIdx === 0 ? 2.5 : 1.2}"/>
  <text x="110" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="${activeIdx === 0 ? '#be123c' : '#854d0e'}">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Kaktus` : 'Kaktus (Xerofit)'}</text>
  
  <!-- Pill Habitat -->
  <rect x="55" y="78" width="110" height="22" rx="11" fill="#fef08a"/>
  <text x="110" y="93" text-anchor="middle" font-size="9" font-weight="bold" fill="#713f12">Habitat Kering / Gersang</text>

  <!-- Ilustrasi Vektor Kaktus Saguaro Gurun -->
  <g id="adapt_kaktus">
    <!-- Gundukan Pasir Gurun & Panas Mentari -->
    <ellipse cx="110" cy="205" rx="75" ry="12" fill="#fde047" opacity="0.6"/>
    <!-- Batang Utama Sukulen Hijau Berdaging -->
    <rect x="94" y="112" width="32" height="88" rx="16" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
    <!-- Alur Tulang Rusuk Batang Vertikal -->
    <line x1="102" y1="116" x2="102" y2="198" stroke="#16a34a" stroke-width="1.5"/>
    <line x1="110" y1="114" x2="110" y2="198" stroke="#16a34a" stroke-width="1.5"/>
    <line x1="118" y1="116" x2="118" y2="198" stroke="#16a34a" stroke-width="1.5"/>
    <!-- Cabang Kiri Melengkung ke Atas -->
    <path d="M 94,142 L 78,142 Q 72,142 72,135 L 72,125" fill="none" stroke="#22c55e" stroke-width="12" stroke-linecap="round"/>
    <path d="M 94,142 L 78,142 Q 72,142 72,135 L 72,125" fill="none" stroke="#15803d" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Cabang Kanan Melengkung ke Atas -->
    <path d="M 126,155 L 142,155 Q 148,155 148,148 L 148,136" fill="none" stroke="#22c55e" stroke-width="12" stroke-linecap="round"/>
    <path d="M 126,155 L 142,155 Q 148,155 148,148 L 148,136" fill="none" stroke="#15803d" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Duri-Duri Tajam Kaktus (Modifikasi Daun) -->
    <line x1="92" y1="126" x2="86" y2="122" stroke="#14532d" stroke-width="1.4"/>
    <line x1="128" y1="128" x2="134" y2="124" stroke="#14532d" stroke-width="1.4"/>
    <line x1="92" y1="168" x2="85" y2="168" stroke="#14532d" stroke-width="1.4"/>
    <line x1="128" y1="172" x2="135" y2="172" stroke="#14532d" stroke-width="1.4"/>
    <!-- Akar Panjang di Bawah Pasir -->
    <path d="M 110,200 L 110,222 M 105,204 L 88,218 M 115,204 L 132,218" stroke="#a16207" stroke-width="1.6" stroke-linecap="round"/>
  </g>

  <!-- Poin-Poin Ciri Adaptasi -->
  <line x1="30" y1="228" x2="190" y2="228" stroke="#facc15" stroke-width="1"/>
  <text x="110" y="246" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#854d0e">• Daun berbentuk duri</text>
  <text x="110" y="262" text-anchor="middle" font-size="8.5" fill="#475569">• Batang tebal berlapis lilin</text>
  <text x="110" y="278" text-anchor="middle" font-size="8.5" fill="#475569">• Menyimpan cadangan air</text>
  <text x="110" y="294" text-anchor="middle" font-size="8.5" fill="#475569">• Akar panjang menyebar</text>

  <!-- ==================== PANEL 2: TERATAI (HIDROFIT) ==================== -->
  <rect x="215" y="44" width="190" height="282" rx="8" fill="url(#waterGrad)" stroke="${activeIdx === 1 ? '#e11d48' : '#86efac'}" stroke-width="${activeIdx === 1 ? 2.5 : 1.2}"/>
  <text x="310" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="${activeIdx === 1 ? '#be123c' : '#15803d'}">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Teratai` : 'Teratai (Hidrofit)'}</text>
  
  <!-- Pill Habitat -->
  <rect x="255" y="78" width="110" height="22" rx="11" fill="#bbf7d0"/>
  <text x="310" y="93" text-anchor="middle" font-size="9" font-weight="bold" fill="#14532d">Habitat Air / Kolam</text>

  <!-- Ilustrasi Vektor Teratai Mekar Mengapung -->
  <g id="adapt_teratai">
    <!-- Riak Permukaan Air -->
    <path d="M 230,175 Q 260,170 290,175 Q 320,180 350,175 Q 375,170 390,175" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.7"/>
    <!-- Daun Bundar Lebar Mengapung (Lily Pad dengan Torehan V) -->
    <path d="M 310,170 C 270,170 252,150 270,136 C 290,122 340,122 355,136 C 368,148 350,170 310,170 Z" fill="#4ade80" stroke="#15803d" stroke-width="2"/>
    <!-- Celah Torehan Daun -->
    <path d="M 310,146 L 330,130" stroke="#15803d" stroke-width="1.8"/>
    <!-- Urat Daun Menyebar -->
    <path d="M 310,146 Q 285,142 278,138 M 310,146 Q 338,150 348,144 M 310,146 Q 302,160 300,166" stroke="#22c55e" stroke-width="1.2" fill="none"/>
    <!-- Bunga Teratai Merah Muda Mekar Indah -->
    <ellipse cx="310" cy="126" rx="8" ry="16" fill="#f472b6" stroke="#db2777" stroke-width="1.2"/>
    <ellipse cx="302" cy="128" rx="7" ry="14" transform="rotate(-20 302 128)" fill="#fbcfe8" stroke="#db2777" stroke-width="1"/>
    <ellipse cx="318" cy="128" rx="7" ry="14" transform="rotate(20 318 128)" fill="#fbcfe8" stroke="#db2777" stroke-width="1"/>
    <!-- Batang Berongga Menyelam ke Bawah Air -->
    <path d="M 310,170 Q 306,195 310,220" fill="none" stroke="#16a34a" stroke-width="4"/>
    <path d="M 310,170 Q 306,195 310,220" fill="none" stroke="#86efac" stroke-width="1.5" stroke-dasharray="2 2"/>
  </g>

  <!-- Poin-Poin Ciri Adaptasi -->
  <line x1="230" y1="228" x2="390" y2="228" stroke="#86efac" stroke-width="1"/>
  <text x="310" y="246" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#15803d">• Daun lebar &amp; tipis</text>
  <text x="310" y="262" text-anchor="middle" font-size="8.5" fill="#475569">• Stomata di permukaan atas</text>
  <text x="310" y="278" text-anchor="middle" font-size="8.5" fill="#475569">• Batang berongga udara</text>
  <text x="310" y="294" text-anchor="middle" font-size="8.5" fill="#475569">• Mempercepat penguapan</text>

  <!-- ==================== PANEL 3: KANTONG SEMAR (INSEKTIVORA) ==================== -->
  <rect x="415" y="44" width="190" height="282" rx="8" fill="url(#jungleGrad)" stroke="${activeIdx === 2 ? '#e11d48' : '#fb923c'}" stroke-width="${activeIdx === 2 ? 2.5 : 1.2}"/>
  <text x="510" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="${activeIdx === 2 ? '#be123c' : '#c2410c'}">${activeIdx === 2 ? `[${escapeXml(labelChar)}] K. Semar` : 'Kantong Semar'}</text>
  
  <!-- Pill Habitat -->
  <rect x="450" y="78" width="120" height="22" rx="11" fill="#fed7aa"/>
  <text x="510" y="93" text-anchor="middle" font-size="9" font-weight="bold" fill="#9a3412">Insektivora (Miskin Hara)</text>

  <!-- Ilustrasi Vektor Kantong Semar Nepenthes -->
  <g id="adapt_nepenthes">
    <!-- Sulur Daun Hijau Menggantung -->
    <path d="M 460,110 Q 480,105 495,125 Q 505,140 500,155" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Piala Kantong (Perangkap) -->
    <path d="M 488,155 C 480,185 488,212 505,214 C 522,212 530,185 522,155 Z" fill="#fb923c" stroke="#c2410c" stroke-width="2"/>
    <!-- Sayap Bersekat Vertikal pada Kantong -->
    <path d="M 500,165 Q 496,188 502,210 M 512,165 Q 516,188 510,210" fill="none" stroke="#ea580c" stroke-width="1.2"/>
    <!-- Bibir Licin Bernektar (Peristom) -->
    <ellipse cx="505" cy="155" rx="17" ry="5.5" fill="#ea580c" stroke="#9a3412" stroke-width="1.5"/>
    <ellipse cx="505" cy="155" rx="11" ry="3.5" fill="#431407"/>
    <!-- Tutup Kantong (Operkulum) Melindungi dari Air Hujan -->
    <path d="M 496,148 Q 505,135 522,142" fill="none" stroke="#c2410c" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="510" cy="140" rx="9" ry="3" transform="rotate(-15 510 140)" fill="#fdba74" stroke="#c2410c" stroke-width="1"/>
    <!-- Cairan Enzim Pencerna di Dasar Kantong -->
    <path d="M 494,195 Q 505,200 516,195 C 518,206 512,212 505,213 C 498,212 492,206 494,195 Z" fill="#38bdf8" fill-opacity="0.7"/>
    <!-- Serangga Terbang Terpikat Menuju Bibir Kantong -->
    <circle cx="538" cy="146" r="2.5" fill="#1e293b"/>
    <path d="M 536,144 Q 532,138 535,142 M 540,144 Q 544,138 541,142" stroke="#64748b" stroke-width="0.8" fill="none"/>
  </g>

  <!-- Poin-Poin Ciri Adaptasi -->
  <line x1="430" y1="228" x2="590" y2="228" stroke="#fb923c" stroke-width="1"/>
  <text x="510" y="246" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#c2410c">• Daun membentuk kantung</text>
  <text x="510" y="262" text-anchor="middle" font-size="8.5" fill="#475569">• Menghasilkan nektar manis</text>
  <text x="510" y="278" text-anchor="middle" font-size="8.5" fill="#475569">• Cairan asam pencerna</text>
  <text x="510" y="294" text-anchor="middle" font-size="8.5" fill="#475569">• Memperoleh Nitrogen (N)</text>

  <!-- Dynamic Target Badge [X] pada Kolom Terpilih -->
  <circle cx="${cols[activeIdx].x + cols[activeIdx].w - 18}" cy="56" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2.2" filter="url(#glowAdaptasi)"/>
  <text x="${cols[activeIdx].x + cols[activeIdx].w - 18}" y="60.5" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Pedagogical Question Prompt -->
  <text x="310" y="352" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Ciri adaptasi tumbuhan pada tanda "${escapeXml(labelChar)}" bertujuan untuk ...</text>
</svg>`;
}

/** 10. Render Alat Pernapasan Hewan */
export function renderPernapasanHewanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'insang').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 1; // 0: Trakea (Serangga), 1: Insang (Ikan), 2: Kulit Basah (Cacing), 3: Pundi Udara (Burung)
  if (pointer.includes('trakea') || pointer.includes('serangga') || pointer.includes('belalang') || pointer.includes('stigma')) activeIdx = 0;
  else if (pointer.includes('kulit') || pointer.includes('cacing')) activeIdx = 2;
  else if (pointer.includes('pundi') || pointer.includes('burung') || pointer.includes('terbang')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, title: 'Trakea &amp; Stigma', hewan: 'Serangga (Belalang)', organ: 'Pembuluh Trakea' },
    { x: 205, y: 42, title: 'Insang (Gills)', hewan: 'Ikan (Pisces)', organ: 'Lembaran Insang' },
    { x: 15, y: 145, title: 'Permukaan Kulit Basah', hewan: 'Cacing Tanah', organ: 'Kutikula Lembap' },
    { x: 205, y: 145, title: 'Pundi-Pundi Udara', hewan: 'Burung (Aves)', organ: 'Kantong Udara' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Macam-Macam Alat Pernapasan Pada Hewan</text>

  <!-- Panel 1: Trakea (Serangga) -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="25" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Trakea` : 'Trakea &amp; Stigma'}</text>
  <!-- Ilustrasi Tabung Trakea Cabang -->
  <line x1="45" y1="80" x2="85" y2="80" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
  <line x1="65" y1="80" x2="55" y2="105" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>
  <line x1="75" y1="80" x2="85" y2="105" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>
  <circle cx="45" cy="80" r="4" fill="#f59e0b"/>
  <text x="95" y="85" font-size="9" font-weight="bold" fill="#334155">Serangga</text>
  <text x="95" y="100" font-size="8.5" fill="#64748b">(Belalang/Kupu)</text>

  <!-- Panel 2: Insang (Ikan) -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="215" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Insang` : 'Insang (Gills)'}</text>
  <!-- Ilustrasi Lengkung & Lembaran Insang -->
  <path d="M 235,75 Q 252,90 235,112" fill="none" stroke="#991b1b" stroke-width="3" stroke-linecap="round"/>
  <path d="M 240,78 Q 258,90 240,108 M 245,82 Q 262,90 245,105" fill="none" stroke="#ef4444" stroke-width="2"/>
  <text x="275" y="85" font-size="9" font-weight="bold" fill="#334155">Ikan (Pisces)</text>
  <text x="275" y="100" font-size="8.5" fill="#64748b">O₂ terlarut air</text>

  <!-- Panel 3: Kulit Cacing -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="25" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Kulit Basah` : 'Kulit Lembap'}</text>
  <!-- Ilustrasi Cacing Lekuk -->
  <path d="M 32,192 Q 45,178 58,192 T 84,192" fill="none" stroke="#f472b6" stroke-width="7" stroke-linecap="round"/>
  <text x="95" y="188" font-size="9" font-weight="bold" fill="#334155">Cacing Tanah</text>
  <text x="95" y="203" font-size="8.5" fill="#64748b">Difusi kapiler kulit</text>

  <!-- Panel 4: Pundi Udara Burung -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="215" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Pundi Udara` : 'Pundi Udara'}</text>
  <!-- Ilustrasi Paru + Kantong Udara Burung -->
  <ellipse cx="242" cy="190" rx="10" ry="14" fill="#fca5a5" stroke="#dc2626" stroke-width="1.2"/>
  <circle cx="230" cy="180" r="7" fill="#bae6fd" stroke="#0284c7" stroke-width="1.2"/>
  <circle cx="255" cy="198" r="7" fill="#bae6fd" stroke="#0284c7" stroke-width="1.2"/>
  <text x="275" y="188" font-size="9" font-weight="bold" fill="#334155">Burung (Aves)</text>
  <text x="275" y="203" font-size="8.5" fill="#64748b">Bantu saat terbang</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Hewan pada kotak "${escapeXml(labelChar)}" bernapas menggunakan ...</text>
</svg>`;
}

/** 11. Render Perkembangbiakan Vegetatif Tumbuhan */
export function renderPerkembangbiakanTumbuhanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'rhizoma').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 2; // 0: Tunas, 1: Umbi Batang, 2: Rizoma, 3: Geragih, 4: Spora
  if (pointer.includes('tunas') || pointer.includes('pisang') || pointer.includes('bambu')) activeIdx = 0;
  else if (pointer.includes('umbi') || pointer.includes('kentang') || pointer.includes('ubi')) activeIdx = 1;
  else if (pointer.includes('geragih') || pointer.includes('stolon') || pointer.includes('stroberi') || pointer.includes('pegagan')) activeIdx = 3;
  else if (pointer.includes('spora') || pointer.includes('paku') || pointer.includes('lumut')) activeIdx = 4;
  else if (pointer.includes('rizoma') || pointer.includes('rhizoma') || pointer.includes('jahe') || pointer.includes('kunyit') || pointer.includes('lengkuas')) activeIdx = 2;

  const cards = [
    { x: 14, title: 'Tunas', ex1: 'Pisang', ex2: 'Bambu', mechanism: 'Anakan Pangkal', note: 'Ketiak Batang' },
    { x: 138, title: 'Umbi Batang', ex1: 'Kentang', ex2: 'Ubi Jalar', mechanism: 'Mata Tunas Umbi', note: 'Simpan Amilum' },
    { x: 262, title: 'Rizoma', ex1: 'Jahe, Kunyit', ex2: 'Lengkuas', mechanism: 'Buku Rimpang', note: 'Bawah Tanah' },
    { x: 386, title: 'Geragih', ex1: 'Stroberi', ex2: 'Pegagan', mechanism: 'Sulur Menjalar', note: 'Atas Permukaan' },
    { x: 510, title: 'Spora', ex1: 'Tumb. Paku', ex2: 'Lumut', mechanism: 'Kotak Sporangium', note: 'Butir Spora' }
  ];

  const activeCard = cards[activeIdx];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 370" width="640" height="370" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="veg_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/>
    </filter>
    <linearGradient id="veg_card_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="veg_active_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>
  </defs>

  <!-- Frame Background -->
  <rect x="4" y="4" width="632" height="362" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Header Section -->
  <rect x="180" y="10" width="280" height="18" rx="9" fill="#e0f2fe"/>
  <text x="320" y="22" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1" letter-spacing="0.5">BIOLOGI TUMBUHAN - VEGETATIF ALAMI</text>
  <text x="320" y="42" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Perkembangbiakan Vegetatif Alami Tumbuhan</text>
  <text x="320" y="58" text-anchor="middle" font-size="9.5" font-weight="500" fill="#64748b">Reproduksi aseksual alami tumbuhan menggunakan modifikasi organ vegetatif</text>

  <!-- 5 Botanical Specimen Panels -->
  ${cards.map((c, i) => {
    const isActive = i === activeIdx;
    const strokeColor = isActive ? '#e11d48' : '#cbd5e1';
    const strokeWidth = isActive ? 2.5 : 1;
    const bgFill = isActive ? 'url(#veg_active_bg)' : 'url(#veg_card_bg)';
    const headerFill = isActive ? '#e11d48' : '#0284c7';

    return `
    <g>
      <!-- Panel Card -->
      <rect x="${c.x}" y="74" width="114" height="246" rx="8" fill="${bgFill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="url(#veg_shadow)"/>

      <!-- Panel Header Badge -->
      <rect x="${c.x + 6}" y="82" width="102" height="22" rx="5" fill="${headerFill}"/>
      <text x="${c.x + 57}" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${c.title}</text>

      <!-- Botanical Illustration Container -->
      ${i === 0 ? `
        <!-- 1. Tunas (Pisang & Bambu) -->
        <g>
          <!-- Soil Line -->
          <line x1="${c.x + 6}" y1="182" x2="${c.x + 108}" y2="182" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2,2"/>
          <!-- Induk Batang Semu Pisang -->
          <path d="M ${c.x + 30},182 L ${c.x + 34},126 Q ${c.x + 40},116 ${c.x + 48},122 L ${c.x + 52},182 Z" fill="#86efac" stroke="#16a34a" stroke-width="1.8"/>
          <!-- Daun Induk Pisang -->
          <path d="M ${c.x + 36},126 Q ${c.x + 14},112 ${c.x + 10},122 Q ${c.x + 20},132 ${c.x + 36},128" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
          <path d="M ${c.x + 44},122 Q ${c.x + 54},102 ${c.x + 74},114 Q ${c.x + 64},128 ${c.x + 44},125" fill="#16a34a" stroke="#14532d" stroke-width="1.5"/>
          <path d="M ${c.x + 40},118 Q ${c.x + 40},98 ${c.x + 44},102 Q ${c.x + 45},114 ${c.x + 41},118" fill="#4ade80" stroke="#15803d" stroke-width="1.2"/>
          <!-- Anakan Tunas Baru dari Pangkal Batang -->
          <path d="M ${c.x + 58},182 Q ${c.x + 63},148 ${c.x + 69},150 Q ${c.x + 74},158 ${c.x + 71},182 Z" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.8"/>
          <path d="M ${c.x + 64},150 Q ${c.x + 76},138 ${c.x + 82},145 Q ${c.x + 72},154 ${c.x + 65},152" fill="#86efac" stroke="#16a34a" stroke-width="1.2"/>
          <path d="M ${c.x + 69},150 Q ${c.x + 68},136 ${c.x + 72},138 Q ${c.x + 73},146 ${c.x + 70},151" fill="#4ade80" stroke="#15803d" stroke-width="1.2"/>
          <!-- Akar Serabut Bawah Tanah -->
          <path d="M ${c.x + 34},182 Q ${c.x + 30},195 ${c.x + 24},206 M ${c.x + 44},182 Q ${c.x + 46},198 ${c.x + 48},210 M ${c.x + 62},182 Q ${c.x + 66},196 ${c.x + 72},208 M ${c.x + 54},182 Q ${c.x + 56},195 ${c.x + 58},205" stroke="#d97706" stroke-width="1.3" fill="none"/>
        </g>
      ` : ''}

      ${i === 1 ? `
        <!-- 2. Umbi Batang (Kentang Bertunas) -->
        <g>
          <!-- Soil Line -->
          <line x1="${c.x + 6}" y1="140" x2="${c.x + 108}" y2="140" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2,2"/>
          <!-- Batang Kecambah di Atas Tanah -->
          <path d="M ${c.x + 57},140 Q ${c.x + 54},122 ${c.x + 48},112 M ${c.x + 57},140 Q ${c.x + 62},125 ${c.x + 70},116" stroke="#16a34a" stroke-width="2" fill="none"/>
          <ellipse cx="${c.x + 45}" cy="110" rx="6" ry="3.5" transform="rotate(-20 ${c.x + 45} 110)" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
          <ellipse cx="${c.x + 73}" cy="114" rx="6" ry="3.5" transform="rotate(25 ${c.x + 73} 114)" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
          <!-- Umbi Kentang di Bawah Tanah -->
          <path d="M ${c.x + 28},172 C ${c.x + 22},154 ${c.x + 40},144 ${c.x + 62},146 C ${c.x + 86},148 ${c.x + 92},164 ${c.x + 89},180 C ${c.x + 86},196 ${c.x + 68},204 ${c.x + 48},200 C ${c.x + 30},196 ${c.x + 26},184 ${c.x + 28},172 Z" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
          <!-- Mata Tunas & Nodus -->
          <path d="M ${c.x + 42},160 Q ${c.x + 47},163 ${c.x + 44},166 M ${c.x + 72},165 Q ${c.x + 77},168 ${c.x + 74},172 M ${c.x + 54},185 Q ${c.x + 59},188 ${c.x + 56},191" stroke="#9a3412" stroke-width="1.6" fill="none"/>
          <circle cx="${c.x + 44}" cy="162" r="1.5" fill="#7c2d12"/>
          <circle cx="${c.x + 74}" cy="167" r="1.5" fill="#7c2d12"/>
          <circle cx="${c.x + 56}" cy="187" r="1.5" fill="#7c2d12"/>
          <!-- Akar Adventif Bawah Umbi -->
          <path d="M ${c.x + 40},198 Q ${c.x + 34},208 ${c.x + 30},216 M ${c.x + 57},201 Q ${c.x + 59},212 ${c.x + 63},218 M ${c.x + 77},193 Q ${c.x + 84},204 ${c.x + 87},214" stroke="#d97706" stroke-width="1.3" fill="none"/>
        </g>
      ` : ''}

      ${i === 2 ? `
        <!-- 3. Rizoma / Rimpang (Jahe Bercabang) -->
        <g>
          <!-- Soil Line -->
          <line x1="${c.x + 6}" y1="140" x2="${c.x + 108}" y2="140" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2,2"/>
          <!-- Tunas Tegak Menembus Tanah -->
          <path d="M ${c.x + 57},140 L ${c.x + 57},106" stroke="#16a34a" stroke-width="2.5" fill="none"/>
          <path d="M ${c.x + 57},130 Q ${c.x + 40},118 ${c.x + 34},124 Q ${c.x + 46},128 ${c.x + 57},130" fill="#22c55e" stroke="#15803d" stroke-width="1.3"/>
          <path d="M ${c.x + 57},118 Q ${c.x + 74},106 ${c.x + 80},112 Q ${c.x + 68},118 ${c.x + 57},120" fill="#22c55e" stroke="#15803d" stroke-width="1.3"/>
          <path d="M ${c.x + 57},106 Q ${c.x + 53},96 ${c.x + 57},94 Q ${c.x + 61},96 ${c.x + 57},106" fill="#4ade80" stroke="#15803d" stroke-width="1.2"/>
          <!-- Rimpang Jahe Horizontal Bawah Tanah -->
          <path d="M ${c.x + 14},170 Q ${c.x + 30},154 ${c.x + 54},162 Q ${c.x + 72},148 ${c.x + 93},165 Q ${c.x + 102},178 ${c.x + 88},188 Q ${c.x + 66},180 ${c.x + 48},192 Q ${c.x + 26},188 ${c.x + 14},170 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
          <!-- Garis Nodus Ruas Melintang -->
          <path d="M ${c.x + 30},162 Q ${c.x + 28},172 ${c.x + 32},180 M ${c.x + 48},165 Q ${c.x + 50},174 ${c.x + 53},185 M ${c.x + 70},160 Q ${c.x + 71},170 ${c.x + 74},182 M ${c.x + 84},168 Q ${c.x + 83},176 ${c.x + 86},184" stroke="#a16207" stroke-width="1.5" fill="none"/>
          <!-- Akar Rimpang Adventif -->
          <path d="M ${c.x + 23},182 Q ${c.x + 20},198 ${c.x + 16},212 M ${c.x + 53},188 Q ${c.x + 54},202 ${c.x + 56},216 M ${c.x + 80},185 Q ${c.x + 84},198 ${c.x + 88},212" stroke="#d97706" stroke-width="1.3" fill="none"/>
        </g>
      ` : ''}

      ${i === 3 ? `
        <!-- 4. Geragih / Stolon (Stroberi Menjalar) -->
        <g>
          <!-- Soil Line -->
          <line x1="${c.x + 6}" y1="176" x2="${c.x + 108}" y2="176" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2,2"/>
          <!-- Rumpun Induk Stroberi -->
          <path d="M ${c.x + 26},168 Q ${c.x + 10},150 ${c.x + 18},144 Q ${c.x + 28},154 ${c.x + 26},168" fill="#22c55e" stroke="#15803d" stroke-width="1.3"/>
          <path d="M ${c.x + 26},168 Q ${c.x + 26},142 ${c.x + 33},142 Q ${c.x + 32},154 ${c.x + 28},168" fill="#16a34a" stroke="#14532d" stroke-width="1.3"/>
          <path d="M ${c.x + 28},168 Q ${c.x + 40},148 ${c.x + 48},154 Q ${c.x + 38},162 ${c.x + 28},168" fill="#22c55e" stroke="#15803d" stroke-width="1.3"/>
          <path d="M ${c.x + 22},176 Q ${c.x + 18},192 ${c.x + 14},208 M ${c.x + 28},176 Q ${c.x + 30},194 ${c.x + 32},210" stroke="#d97706" stroke-width="1.3" fill="none"/>
          <!-- Sulur Stolon Melengkung Mendatar -->
          <path d="M ${c.x + 28},168 Q ${c.x + 56},144 ${c.x + 86},172" fill="none" stroke="#15803d" stroke-width="2.5"/>
          <!-- Anakan Baru di Nodus Ujung Stolon -->
          <path d="M ${c.x + 86},172 Q ${c.x + 76},156 ${c.x + 82},152 Q ${c.x + 88},160 ${c.x + 86},172" fill="#86efac" stroke="#16a34a" stroke-width="1.2"/>
          <path d="M ${c.x + 88},172 Q ${c.x + 98},158 ${c.x + 104},164 Q ${c.x + 94},170 ${c.x + 88},172" fill="#86efac" stroke="#16a34a" stroke-width="1.2"/>
          <path d="M ${c.x + 86},176 Q ${c.x + 84},192 ${c.x + 82},206 M ${c.x + 90},176 Q ${c.x + 92},194 ${c.x + 96},208" stroke="#d97706" stroke-width="1.3" fill="none"/>
          <!-- Buah Stroberi Kecil -->
          <circle cx="${c.x + 48}" cy="182" r="4.5" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
          <path d="M ${c.x + 48},177 L ${c.x + 48},174" stroke="#16a34a" stroke-width="1.2"/>
        </g>
      ` : ''}

      ${i === 4 ? `
        <!-- 5. Spora (Daun Paku Sporofil) -->
        <g>
          <!-- Tangkai Daun Paku (Rachis) -->
          <path d="M ${c.x + 26},215 Q ${c.x + 46},160 ${c.x + 54},106" fill="none" stroke="#15803d" stroke-width="2.5"/>
          <!-- Pinnae / Anak Daun Menyirip -->
          <path d="M ${c.x + 32},192 Q ${c.x + 16},182 ${c.x + 20},178 Q ${c.x + 30},184 ${c.x + 34},190" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
          <path d="M ${c.x + 36},186 Q ${c.x + 52},176 ${c.x + 54},182 Q ${c.x + 42},188 ${c.x + 38},188" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
          <path d="M ${c.x + 39},165 Q ${c.x + 23},155 ${c.x + 27},151 Q ${c.x + 37},157 ${c.x + 41},163" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
          <path d="M ${c.x + 43},159 Q ${c.x + 59},149 ${c.x + 61},155 Q ${c.x + 49},161 ${c.x + 45},161" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
          <path d="M ${c.x + 47},138 Q ${c.x + 33},130 ${c.x + 37},126 Q ${c.x + 45},132 ${c.x + 49},136" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
          <path d="M ${c.x + 50},132 Q ${c.x + 64},124 ${c.x + 66},130 Q ${c.x + 56},134 ${c.x + 52},134" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
          <!-- Bintik Sorus di Bawah Anak Daun -->
          <circle cx="${c.x + 24}" cy="182" r="2" fill="#b45309"/>
          <circle cx="${c.x + 46}" cy="180" r="2" fill="#b45309"/>
          <circle cx="${c.x + 31}" cy="155" r="2" fill="#b45309"/>
          <circle cx="${c.x + 53}" cy="153" r="2" fill="#b45309"/>
          <!-- Zoom Inset Kotak Sporangium -->
          <circle cx="${c.x + 84}" cy="132" r="16" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
          <path d="M ${c.x + 80},145 L ${c.x + 84},136" stroke="#b45309" stroke-width="1.5"/>
          <circle cx="${c.x + 85}" cy="132" r="5.5" fill="#fed7aa" stroke="#b45309" stroke-width="1.2"/>
          <path d="M ${c.x + 82},128 Q ${c.x + 87},124 ${c.x + 90},129" stroke="#78350f" stroke-width="1.5" fill="none"/>
          <circle cx="${c.x + 90}" cy="124" r="1" fill="#b45309"/>
          <circle cx="${c.x + 94}" cy="128" r="1" fill="#b45309"/>
          <circle cx="${c.x + 93}" cy="122" r="0.8" fill="#d97706"/>
          <circle cx="${c.x + 87}" cy="121" r="0.8" fill="#d97706"/>
        </g>
      ` : ''}

      <!-- Mechanism & Botanical Labels -->
      <rect x="${c.x + 6}" y="222" width="102" height="18" rx="4" fill="#f1f5f9"/>
      <text x="${c.x + 57}" y="234" text-anchor="middle" font-size="8.5" font-weight="600" fill="#334155">${c.mechanism}</text>

      <line x1="${c.x + 12}" y1="246" x2="${c.x + 102}" y2="246" stroke="#e2e8f0" stroke-width="1"/>

      <text x="${c.x + 57}" y="258" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0f172a">${c.ex1}</text>
      <text x="${c.x + 57}" y="274" text-anchor="middle" font-size="8.5" font-weight="500" fill="#64748b">${c.ex2}</text>

      <rect x="${c.x + 10}" y="286" width="94" height="18" rx="3" fill="#e0f2fe"/>
      <text x="${c.x + 57}" y="298" text-anchor="middle" font-size="7.8" font-weight="600" fill="#0369a1">${c.note}</text>
    </g>`;
  }).join('')}

  <!-- Target Badge X -->
  <circle cx="${activeCard.x + 57}" cy="72" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#veg_shadow)"/>
  <text x="${activeCard.x + 57}" y="76.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Bottom Interactive Question Prompt Banner -->
  <rect x="60" y="338" width="520" height="24" rx="6" fill="#0f172a"/>
  <text x="320" y="354" text-anchor="middle" font-size="11" font-weight="600" fill="#f8fafc">Cara perkembangbiakan vegetatif pada kolom "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 12. Render Perbandingan Sel Hewan dan Sel Tumbuhan */
export function renderSelHewanTumbuhanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'kloroplas').toLowerCase();
  const labelChar = params.label || 'X';

  let targetKey = 'kloroplas';
  let target = { x: 90, y: 135, organ: 'Kloroplas' };

  if (pointer.includes('dinding') || pointer.includes('selulosa')) {
    targetKey = 'dinding';
    target = { x: 42, y: 195, organ: 'Dinding Sel' };
  } else if (pointer.includes('vakuola')) {
    targetKey = 'vakuola';
    target = { x: 212, y: 192, organ: 'Vakuola Sentral' };
  } else if (pointer.includes('nukleus') || pointer.includes('inti')) {
    targetKey = 'nukleus';
    target = { x: 475, y: 195, organ: 'Inti Sel (Nukleus)' };
  } else if (pointer.includes('membran')) {
    targetKey = 'membran';
    target = { x: 580, y: 128, organ: 'Membran Sel' };
  } else if (pointer.includes('sentriol') || pointer.includes('sentrosom')) {
    targetKey = 'sentriol';
    target = { x: 405, y: 145, organ: 'Sentriol' };
  } else if (pointer.includes('mitokondria')) {
    targetKey = 'mitokondria';
    target = { x: 550, y: 245, organ: 'Mitokondria' };
  } else if (pointer.includes('lisosom')) {
    targetKey = 'lisosom';
    target = { x: 380, y: 240, organ: 'Lisosom' };
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 380" width="640" height="380" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <filter id="cell_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/>
    </filter>
    <linearGradient id="plant_cytoplasm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>
    <linearGradient id="animal_cytoplasm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>
  </defs>

  <!-- Frame Background -->
  <rect x="4" y="4" width="632" height="372" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Header Section -->
  <rect x="170" y="10" width="300" height="18" rx="9" fill="#e0f2fe"/>
  <text x="320" y="22" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1" letter-spacing="0.5">SITOLOGI - PERBANDINGAN STRUKTUR SEL</text>
  <text x="320" y="42" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f172a">Perbandingan Struktur Sel Tumbuhan vs Sel Hewan</text>
  <text x="320" y="58" text-anchor="middle" font-size="9.5" font-weight="500" fill="#64748b">Identifikasi organel sel eukariotik: organel khas tumbuhan dan hewan</text>

  <!-- Sisi Kiri: Sel Tumbuhan (Bentuk Bersudut Kaku & Dinding Sel) -->
  <g>
    <!-- Card Container -->
    <rect x="18" y="74" width="294" height="254" rx="10" fill="#fafffb" stroke="#bbf7d0" stroke-width="1.5" filter="url(#cell_shadow)"/>

    <!-- Label Panel Sel Tumbuhan -->
    <rect x="28" y="82" width="105" height="20" rx="4" fill="#15803d"/>
    <text x="80" y="96" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">Sel Tumbuhan</text>

    <!-- Dinding Selulosa Luar (Tebal & Kaku Bersudut) -->
    <polygon points="56,135 110,108 225,108 280,135 280,250 225,282 110,282 56,250" fill="url(#plant_cytoplasm)" stroke="#15803d" stroke-width="5"/>
    <!-- Membran Plasma Bagian Dalam -->
    <polygon points="59,137 112,111 223,111 277,137 277,248 223,279 112,279 59,248" fill="none" stroke="#22c55e" stroke-width="1.8"/>

    <!-- Vakuola Sentral Raksasa (Tonoplas & Cairan Getah) -->
    <path d="M 160,145 Q 220,135 258,160 Q 268,210 248,245 Q 188,260 152,230 Q 142,180 160,145 Z" fill="#bae6fd" fill-opacity="0.85" stroke="#0284c7" stroke-width="2"/>
    ${targetKey !== 'vakuola' ? `<text x="212" y="195" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Vakuola</text>` : ''}

    <!-- Kloroplas Hijau dengan Tilakoid Grana -->
    <!-- Kloroplas Atas -->
    <g transform="rotate(-25 90 135)">
      <ellipse cx="90" cy="135" rx="15" ry="9" fill="#16a34a" stroke="#14532d" stroke-width="1.5"/>
      <line x1="82" y1="132" x2="82" y2="138" stroke="#86efac" stroke-width="1.5"/>
      <line x1="90" y1="131" x2="90" y2="139" stroke="#86efac" stroke-width="1.5"/>
      <line x1="98" y1="132" x2="98" y2="138" stroke="#86efac" stroke-width="1.5"/>
    </g>
    ${targetKey !== 'kloroplas' ? `<text x="90" y="156" text-anchor="middle" font-size="8.5" font-weight="600" fill="#14532d">Kloroplas</text>` : ''}

    <!-- Kloroplas Bawah -->
    <g transform="rotate(15 82 242)">
      <ellipse cx="82" cy="242" rx="15" ry="9" fill="#16a34a" stroke="#14532d" stroke-width="1.5"/>
      <line x1="74" y1="239" x2="74" y2="245" stroke="#86efac" stroke-width="1.5"/>
      <line x1="82" y1="238" x2="82" y2="246" stroke="#86efac" stroke-width="1.5"/>
      <line x1="90" y1="239" x2="90" y2="245" stroke="#86efac" stroke-width="1.5"/>
    </g>

    <!-- Inti Sel / Nukleus di Tepi -->
    <circle cx="100" cy="202" r="18" fill="#fce7f3" stroke="#db2777" stroke-width="1.8"/>
    <circle cx="100" cy="202" r="6" fill="#9d174d"/>
    ${targetKey !== 'nukleus' ? `<text x="100" y="205" text-anchor="middle" font-size="7.8" font-weight="bold" fill="#ffffff">Nukleus</text>` : ''}

    <!-- Mitokondria Tumbuhan -->
    <g transform="rotate(20 215 122)">
      <ellipse cx="215" cy="122" rx="10" ry="5" fill="#fed7aa" stroke="#ea580c" stroke-width="1.2"/>
      <path d="M 210,122 Q 215,120 220,122" stroke="#c2410c" stroke-width="1" fill="none"/>
    </g>

    <!-- Callout Dinding Sel Kiri -->
    <line x1="42" y1="184" x2="56" y2="184" stroke="#15803d" stroke-width="1.5"/>
    ${targetKey !== 'dinding' ? `<text x="42" y="195" text-anchor="middle" font-size="8.5" font-weight="600" fill="#15803d">Dinding Sel</text>` : ''}

    <!-- Catatan Karakteristik Sel Tumbuhan -->
    <text x="165" y="312" text-anchor="middle" font-size="8.5" font-weight="600" fill="#15803d">Berdinding selulosa, berkloroplas &amp; vakuola besar</text>
  </g>

  <!-- Sisi Kanan: Sel Hewan (Bentuk Fleksibel Bulat & Membran) -->
  <g>
    <!-- Card Container -->
    <rect x="328" y="74" width="294" height="254" rx="10" fill="#fffbfa" stroke="#fca5a5" stroke-width="1.5" filter="url(#cell_shadow)"/>

    <!-- Label Panel Sel Hewan -->
    <rect x="338" y="82" width="95" height="20" rx="4" fill="#b91c1c"/>
    <text x="385" y="96" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">Sel Hewan</text>

    <!-- Membran Sel Fleksibel Bulat Amorf -->
    <path d="M 370,140 Q 420,105 480,110 Q 560,115 585,160 Q 605,220 575,260 Q 520,295 450,285 Q 380,275 355,225 Q 340,175 370,140 Z" fill="url(#animal_cytoplasm)" stroke="#ef4444" stroke-width="3"/>

    <!-- Nukleus Sentral Besar -->
    <circle cx="475" cy="195" r="28" fill="#fce7f3" stroke="#db2777" stroke-width="2"/>
    <circle cx="475" cy="195" r="10" fill="#831843"/>
    ${targetKey !== 'nukleus' ? `<text x="475" y="199" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">Nukleus</text>` : ''}

    <!-- Sentriol / Sentrosom (Khas Hewan) -->
    <g>
      <rect x="400" y="142" width="10" height="5" rx="1" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
      <rect x="402" y="137" width="5" height="10" rx="1" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
      ${targetKey !== 'sentriol' ? `<text x="405" y="130" text-anchor="middle" font-size="8.5" font-weight="600" fill="#b45309">Sentriol</text>` : ''}
    </g>

    <!-- Membran Sel Callout -->
    <line x1="565" y1="135" x2="580" y2="128" stroke="#dc2626" stroke-width="1.5"/>
    ${targetKey !== 'membran' ? `<text x="580" y="128" text-anchor="middle" font-size="8.5" font-weight="600" fill="#dc2626">Membran Sel</text>` : ''}

    <!-- Lisosom (Vesikel Pencerna Khas Hewan) -->
    <circle cx="380" cy="240" r="8.5" fill="#fca5a5" stroke="#dc2626" stroke-width="1.5"/>
    <circle cx="378" cy="238" r="2" fill="#b91c1c"/>
    <circle cx="383" cy="242" r="1.5" fill="#b91c1c"/>
    ${targetKey !== 'lisosom' ? `<text x="380" y="256" text-anchor="middle" font-size="8" font-weight="600" fill="#dc2626">Lisosom</text>` : ''}

    <!-- Mitokondria Hewan -->
    <g transform="rotate(-30 550 245)">
      <ellipse cx="550" cy="245" rx="14" ry="7" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>
      <path d="M 542,245 Q 550,241 558,245" stroke="#c2410c" stroke-width="1.2" fill="none"/>
    </g>
    ${targetKey !== 'mitokondria' ? `<text x="550" y="264" text-anchor="middle" font-size="8" font-weight="600" fill="#c2410c">Mitokondria</text>` : ''}

    <!-- Vakuola Kecil / Vesikel -->
    <circle cx="520" cy="265" r="5.5" fill="#bae6fd" stroke="#0284c7" stroke-width="1.2"/>

    <!-- Catatan Karakteristik Sel Hewan -->
    <text x="475" y="312" text-anchor="middle" font-size="8.5" font-weight="600" fill="#dc2626">Bentuk fleksibel, tanpa dinding sel/kloroplas, ada sentriol</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#cell_shadow)"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Bottom Interactive Question Prompt Banner -->
  <rect x="60" y="340" width="520" height="26" rx="6" fill="#0f172a"/>
  <text x="320" y="357" text-anchor="middle" font-size="11" font-weight="600" fill="#f8fafc">Organel sel yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// =========================================================================
// BATCH 3: IPAS BIOLOGI, ANATOMI & EKOSISTEM (12 TEMPLATES)
// =========================================================================

// 1. Rantai Makanan Laut
export function renderRantaiMakananLautSvg(params: any): string {
  const pointer = String(params.pointer || params.target || 'tuna').toLowerCase();
  const labelChar = params.label || 'X';

  const nodes = [
    { id: 'fitoplankton', label: 'Fitoplankton', role: 'Produsen', x: 60, y: 90, color: '#10b981', border: '#059669', bg: '#ecfdf5' },
    { id: 'zooplankton', label: 'Zooplankton', role: 'Konsumen I', x: 155, y: 90, color: '#0284c7', border: '#0369a1', bg: '#f0f9ff' },
    { id: 'ikan_kecil', label: 'Ikan Kecil', role: 'Konsumen II', x: 250, y: 90, color: '#6366f1', border: '#4f46e5', bg: '#eef2ff' },
    { id: 'tuna', label: 'Ikan Tuna', role: 'Konsumen III', x: 345, y: 90, color: '#d97706', border: '#b45309', bg: '#fffbeb' },
    { id: 'hiu', label: 'Ikan Hiu', role: 'Konsumen IV', x: 440, y: 90, color: '#dc2626', border: '#b91c1c', bg: '#fef2f2' }
  ];

  let targetNode = nodes.find(n => pointer.includes(n.id) || (pointer === 'hiu' && n.id === 'hiu')) || nodes[3];
  if (pointer.includes('produsen')) targetNode = nodes[0];
  else if (pointer.includes('konsumen 1') || pointer.includes('konsumen1')) targetNode = nodes[1];
  else if (pointer.includes('konsumen 2') || pointer.includes('konsumen2')) targetNode = nodes[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" width="500" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="seaArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <rect width="500" height="200" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" rx="8"/>
  <text x="250" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Rantai Makanan Ekosistem Laut</text>

  <!-- Panah rantai makanan -->
  <line x1="95" y1="90" x2="120" y2="90" stroke="#0284c7" stroke-width="2" marker-end="url(#seaArr)"/>
  <line x1="190" y1="90" x2="215" y2="90" stroke="#0284c7" stroke-width="2" marker-end="url(#seaArr)"/>
  <line x1="285" y1="90" x2="310" y2="90" stroke="#0284c7" stroke-width="2" marker-end="url(#seaArr)"/>
  <line x1="380" y1="90" x2="405" y2="90" stroke="#0284c7" stroke-width="2" marker-end="url(#seaArr)"/>

  ${nodes.map(n => {
    const isTarget = n.id === targetNode.id;
    return `
    <g transform="translate(${n.x - 36}, 55)">
      <rect width="72" height="70" rx="8" fill="${n.bg}" stroke="${n.border}" stroke-width="1.8"/>
      <circle cx="36" cy="24" r="14" fill="${n.color}15" stroke="${n.border}" stroke-width="1"/>
      <text x="36" y="27" text-anchor="middle" font-size="9" font-weight="bold" fill="${n.border}">${n.id === 'hiu' ? '🦈' : n.id === 'tuna' ? '🐟' : n.id === 'ikan_kecil' ? '🐠' : n.id === 'zooplankton' ? '🦐' : '🌿'}</text>
      ${isTarget ? `
        <circle cx="36" cy="48" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="36" y="52" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="36" y="47" text-anchor="middle" font-size="8" font-weight="bold" fill="#0f172a">${n.label}</text>
        <text x="36" y="59" text-anchor="middle" font-size="7" font-weight="600" fill="#64748b">${n.role}</text>
      `}
    </g>`;
  }).join('')}

  <text x="250" y="165" text-anchor="middle" font-size="10" font-weight="600" fill="#334155">Organisme pada kotak bertanda "[${escapeXml(labelChar)}]" menempati peran sebagai ...</text>
</svg>`;
}

// 2. Rantai Makanan Hutan
export function renderRantaiMakananHutanSvg(params: any): string {
  const pointer = String(params.pointer || params.target || 'harimau').toLowerCase();
  const labelChar = params.label || 'X';

  const nodes = [
    { id: 'rumput', label: 'Tumbuhan Hutan', role: 'Produsen', x: 65, icon: '🌲', bg: '#ecfdf5', border: '#059669' },
    { id: 'rusa', label: 'Rusa Hutan', role: 'Konsumen I', x: 175, icon: '🦌', bg: '#fef3c7', border: '#d97706' },
    { id: 'harimau', label: 'Harimau', role: 'Konsumen II', x: 285, icon: '🐅', bg: '#fef2f2', border: '#dc2626' },
    { id: 'jamur', label: 'Jamur Pengurai', role: 'Dekomposer', x: 395, icon: '🍄', bg: '#f3e8ff', border: '#9333ea' }
  ];

  let targetNode = nodes.find(n => pointer.includes(n.id)) || nodes[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 200" width="460" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="forArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
    </marker>
  </defs>

  <rect width="460" height="200" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" rx="8"/>
  <text x="230" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Rantai Makanan Ekosistem Hutan Tropis</text>

  <!-- Panah rantai makanan -->
  <line x1="108" y1="90" x2="132" y2="90" stroke="#16a34a" stroke-width="2" marker-end="url(#forArr)"/>
  <line x1="218" y1="90" x2="242" y2="90" stroke="#16a34a" stroke-width="2" marker-end="url(#forArr)"/>
  <line x1="328" y1="90" x2="352" y2="90" stroke="#16a34a" stroke-width="2" marker-end="url(#forArr)"/>

  ${nodes.map(n => {
    const isTarget = n.id === targetNode.id;
    return `
    <g transform="translate(${n.x - 42}, 55)">
      <rect width="84" height="70" rx="8" fill="${n.bg}" stroke="${n.border}" stroke-width="1.8"/>
      <circle cx="42" cy="24" r="14" fill="#ffffff" stroke="${n.border}" stroke-width="1"/>
      <text x="42" y="28" text-anchor="middle" font-size="10" font-weight="bold">${n.icon}</text>
      ${isTarget ? `
        <circle cx="42" cy="50" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="42" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="42" y="47" text-anchor="middle" font-size="8" font-weight="bold" fill="#0f172a">${n.label}</text>
        <text x="42" y="60" text-anchor="middle" font-size="7.5" font-weight="600" fill="#64748b">${n.role}</text>
      `}
    </g>`;
  }).join('')}

  <text x="230" y="165" text-anchor="middle" font-size="10" font-weight="600" fill="#334155">Peran organisme pada kotak bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 3. Daur Hidup Kupu-kupu Detail
export function renderDaurHidupKupuDetailSvg(params: any): string {
  const tahap = String(params.tahap || params.pointer || 'kepompong').toLowerCase();
  const labelChar = params.label || 'X';

  const stages = [
    { id: 'telur', label: '1. Telur', icon: '🥚', x: 75, y: 70 },
    { id: 'ulat', label: '2. Ulat (Larva)', icon: '🐛', x: 305, y: 70 },
    { id: 'kepompong', label: '3. Kepompong (Pupa)', icon: '🌱', x: 305, y: 175 },
    { id: 'kupu', label: '4. Kupu-Kupu (Imago)', icon: '🦋', x: 75, y: 175 }
  ];

  let target = stages.find(s => tahap.includes(s.id)) || stages[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="kupuArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
    </marker>
  </defs>

  <rect width="380" height="260" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#065f46">Metamorfosis Sempurna Kupu-Kupu</text>

  <!-- Panah siklus -->
  <line x1="130" y1="70" x2="245" y2="70" stroke="#059669" stroke-width="2" marker-end="url(#kupuArr)"/>
  <line x1="305" y1="102" x2="305" y2="142" stroke="#059669" stroke-width="2" marker-end="url(#kupuArr)"/>
  <line x1="250" y1="175" x2="135" y2="175" stroke="#059669" stroke-width="2" marker-end="url(#kupuArr)"/>
  <line x1="75" y1="142" x2="75" y2="102" stroke="#059669" stroke-width="2" marker-end="url(#kupuArr)"/>

  ${stages.map(s => {
    const isTarget = s.id === target.id;
    return `
    <g transform="translate(${s.x - 45}, ${s.y - 28})">
      <rect width="90" height="56" rx="8" fill="#ffffff" stroke="#10b981" stroke-width="1.6"/>
      <circle cx="22" cy="28" r="12" fill="#ecfdf5" stroke="#059669" stroke-width="1"/>
      <text x="22" y="32" text-anchor="middle" font-size="10">${s.icon}</text>
      ${isTarget ? `
        <circle cx="62" cy="28" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="62" y="32" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="60" y="25" text-anchor="middle" font-size="8" font-weight="bold" fill="#0f172a">${s.label.split(' ')[0]}</text>
        <text x="60" y="37" text-anchor="middle" font-size="7.5" font-weight="600" fill="#059669">${s.label.split(' ').slice(1).join(' ')}</text>
      `}
    </g>`;
  }).join('')}

  <text x="190" y="238" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Tahap metamorfosis pada simbol "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 4. Daur Hidup Belalang (Metamorfosis Tidak Sempurna)
export function renderDaurHidupBelalangSvg(params: any): string {
  const pointer = String(params.tahap || params.pointer || 'nimfa').toLowerCase();
  const labelChar = params.label || 'X';

  const stages = [
    { id: 'telur', label: '1. Telur', x: 60, icon: '🥚', desc: 'Dalam tanah' },
    { id: 'nimfa1', label: '2. Nimfa I', x: 160, icon: '🦗', desc: 'Tanpa sayap' },
    { id: 'nimfa2', label: '3. Nimfa II', x: 260, icon: '🦗', desc: 'Sayap kecil' },
    { id: 'imago', label: '4. Imago', x: 360, icon: '🦗', desc: 'Dewasa bersayap' }
  ];

  let target = stages.find(s => pointer.includes(s.id)) || stages[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="420" height="180" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="locArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#15803d" />
    </marker>
  </defs>

  <rect width="420" height="180" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">Metamorfosis Tidak Sempurna Belalang</text>

  <!-- Panah alur -->
  <line x1="98" y1="80" x2="122" y2="80" stroke="#15803d" stroke-width="2" marker-end="url(#locArr)"/>
  <line x1="198" y1="80" x2="222" y2="80" stroke="#15803d" stroke-width="2" marker-end="url(#locArr)"/>
  <line x1="298" y1="80" x2="322" y2="80" stroke="#15803d" stroke-width="2" marker-end="url(#locArr)"/>

  ${stages.map(s => {
    const isTarget = s.id === target.id;
    return `
    <g transform="translate(${s.x - 38}, 48)">
      <rect width="76" height="64" rx="8" fill="#ffffff" stroke="#22c55e" stroke-width="1.6"/>
      <circle cx="38" cy="20" r="12" fill="#dcfce7" stroke="#16a34a" stroke-width="1"/>
      <text x="38" y="24" text-anchor="middle" font-size="10">${s.icon}</text>
      ${isTarget ? `
        <circle cx="38" cy="46" r="10" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="38" y="50" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="38" y="44" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#0f172a">${s.label}</text>
        <text x="38" y="55" text-anchor="middle" font-size="6.5" font-weight="600" fill="#64748b">${s.desc}</text>
      `}
    </g>`;
  }).join('')}

  <text x="210" y="152" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Tahap perkembangan belalang pada huruf "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 5. Daur Hidup Kecoa (Metamorfosis Tidak Sempurna)
export function renderDaurHidupKecoaSvg(params: any): string {
  const pointer = String(params.tahap || params.pointer || 'ootheca').toLowerCase();
  const labelChar = params.label || 'X';

  const stages = [
    { id: 'ootheca', label: '1. Ootheca', desc: 'Kantung Telur', x: 60 },
    { id: 'nimfa_muda', label: '2. Nimfa Kecil', desc: 'Tanpa Sayap', x: 160 },
    { id: 'nimfa_tua', label: '3. Nimfa Besar', desc: 'Bakal Sayap', x: 260 },
    { id: 'dewasa', label: '4. Kecoa Dewasa', desc: 'Imago Bersayap', x: 360 }
  ];

  let target = stages.find(s => pointer.includes(s.id)) || stages[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="420" height="180" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="ckArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#b45309" />
    </marker>
  </defs>

  <rect width="420" height="180" fill="#fefce8" stroke="#fde047" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#854d0e">Daur Hidup Kecoa (Hemimetabola)</text>

  <!-- Panah alur -->
  <line x1="98" y1="80" x2="122" y2="80" stroke="#b45309" stroke-width="2" marker-end="url(#ckArr)"/>
  <line x1="198" y1="80" x2="222" y2="80" stroke="#b45309" stroke-width="2" marker-end="url(#ckArr)"/>
  <line x1="298" y1="80" x2="322" y2="80" stroke="#b45309" stroke-width="2" marker-end="url(#ckArr)"/>

  ${stages.map(s => {
    const isTarget = s.id === target.id;
    return `
    <g transform="translate(${s.x - 38}, 48)">
      <rect width="76" height="64" rx="8" fill="#ffffff" stroke="#ca8a04" stroke-width="1.6"/>
      <circle cx="38" cy="20" r="12" fill="#fef9c3" stroke="#a16207" stroke-width="1"/>
      <text x="38" y="24" text-anchor="middle" font-size="9" font-weight="bold" fill="#713f12">🪳</text>
      ${isTarget ? `
        <circle cx="38" cy="46" r="10" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="38" y="50" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="38" y="44" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#0f172a">${s.label}</text>
        <text x="38" y="55" text-anchor="middle" font-size="6.5" font-weight="600" fill="#64748b">${s.desc}</text>
      `}
    </g>`;
  }).join('')}

  <text x="210" y="152" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Bagian daur hidup kecoa pada kode "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 6. Bagian Akar Tumbuhan (Morfologi & Anatomi)
export function renderBagianAkarTumbuhanSvg(params: any): string {
  const pointer = String(params.bagian || params.pointer || 'rambut_akar').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'pangkal_akar', name: 'Leher / Pangkal Akar', x: 190, y: 50 },
    { id: 'rambut_akar', name: 'Rambut Akar (Penyerapan)', x: 90, y: 110 },
    { id: 'akar_cabang', name: 'Cabang Akar Lateral', x: 290, y: 110 },
    { id: 'kaliptra', name: 'Tudung Akar (Kaliptra)', x: 190, y: 190 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 240" width="380" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="240" fill="#fdfbf7" stroke="#e2d9cc" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#451a03">Struktur Morfologi Akar Tumbuhan</text>

  <!-- Batang utama & tanah -->
  <line x1="40" y1="45" x2="340" y2="45" stroke="#78350f" stroke-width="2" stroke-dasharray="4,3"/>
  <text x="50" y="40" font-size="8" font-weight="600" fill="#92400e">Permukaan Tanah</text>

  <!-- Akar Utama (Tunggang) -->
  <path d="M 180 45 Q 185 120 188 185 Q 190 200 192 185 Q 195 120 200 45 Z" fill="#d97706" stroke="#92400e" stroke-width="2"/>

  <!-- Tudung Akar -->
  <path d="M 186 185 Q 190 205 194 185 Z" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>

  <!-- Rambut Akar Kiri -->
  <path d="M 182 80 Q 150 85 130 90 M 183 95 Q 145 100 120 105 M 184 110 Q 150 115 125 120 M 185 125 Q 155 130 130 135" stroke="#b45309" stroke-width="1.5" fill="none"/>

  <!-- Cabang Akar Kanan -->
  <path d="M 198 85 Q 230 100 255 120 M 200 110 Q 235 125 250 145" stroke="#92400e" stroke-width="2.5" fill="none"/>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="222" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Bagian akar yang ditunjuk oleh simbol "[${escapeXml(labelChar)}]" berfungsi untuk ...</text>
</svg>`;
}

// 7. Penampang Batang Dikotil vs Monokotil
export function renderBagianBatangDikotilMonokotilSvg(params: any): string {
  const jenis = String(params.jenis || params.tipe || 'dikotil').toLowerCase();
  const labelChar = params.label || 'X';
  const isDikotil = jenis.includes('dikotil') && !jenis.includes('monokotil');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 220" width="440" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="440" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="220" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Irisan Melintang Batang Dikotil vs Monokotil</text>

  <!-- Batang Dikotil (Kiri) -->
  <g transform="translate(110, 110)">
    <circle cx="0" cy="0" r="60" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <!-- Cincin Kambium Melingkar Teratur -->
    <circle cx="0" cy="0" r="38" fill="none" stroke="#e11d48" stroke-width="1.8" stroke-dasharray="3,2"/>
    <!-- Berkas Pengangkut Melingkar -->
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
      const rad = (deg * Math.PI) / 180;
      const bx = Math.cos(rad) * 38;
      const by = Math.sin(rad) * 38;
      return `<circle cx="${bx}" cy="${by}" r="4" fill="#0284c7" stroke="#0369a1" stroke-width="1"/>`;
    }).join('')}
    <text x="0" y="76" text-anchor="middle" font-size="9" font-weight="bold" fill="#166534">Batang Dikotil</text>
    <text x="0" y="88" text-anchor="middle" font-size="7.5" fill="#64748b">(Kambium Teratur)</text>
    ${isDikotil ? `
      <circle cx="0" cy="0" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}
  </g>

  <!-- Batang Monokotil (Kanan) -->
  <g transform="translate(330, 110)">
    <circle cx="0" cy="0" r="60" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
    <!-- Berkas Pengangkut Tersebar Tidak Beraturan -->
    ${[
      { x: -18, y: -25 }, { x: 15, y: -30 }, { x: 30, y: -10 },
      { x: -30, y: 5 }, { x: -5, y: -5 }, { x: 22, y: 15 },
      { x: -20, y: 30 }, { x: 10, y: 35 }, { x: -35, y: -15 }
    ].map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#0284c7" stroke="#0369a1" stroke-width="1"/>`).join('')}
    <text x="0" y="76" text-anchor="middle" font-size="9" font-weight="bold" fill="#854d0e">Batang Monokotil</text>
    <text x="0" y="88" text-anchor="middle" font-size="7.5" fill="#64748b">(Berkas Tersebar)</text>
    ${!isDikotil ? `
      <circle cx="0" cy="0" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}
  </g>

  <text x="220" y="208" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">Ciri khas berkas pembuluh pada bangun bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 8. Bagian Daun (Anatomi Jaringan Fotosintesis)
export function renderBagianDaunAnatomiSvg(params: any): string {
  const pointer = String(params.pointer || params.jaringan || 'palisade').toLowerCase();
  const labelChar = params.label || 'X';

  const layers = [
    { id: 'epidermis_atas', name: 'Epidermis Atas', y: 50 },
    { id: 'palisade', name: 'Jaringan Tiang (Palisade)', y: 85 },
    { id: 'spons', name: 'Jaringan Bunga Karang (Spons)', y: 130 },
    { id: 'stomata', name: 'Stomata (Mulut Daun)', y: 170 }
  ];

  let target = layers.find(l => pointer.includes(l.id)) || layers[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 230" width="380" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="230" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#065f46">Penampang Melintang Daun</text>

  <!-- Lapisan Kutikula & Epidermis Atas -->
  <rect x="40" y="45" width="220" height="15" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>

  <!-- Lapisan Jaringan Palisade (Kolom Rapat) -->
  ${[45, 68, 91, 114, 137, 160, 183, 206, 229].map(x => `
    <rect x="${x}" y="63" width="20" height="42" rx="3" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
  `).join('')}

  <!-- Lapisan Jaringan Spons / Bunga Karang (Bulat Berongga) -->
  ${[
    { x: 55, y: 120 }, { x: 95, y: 125 }, { x: 145, y: 118 }, { x: 195, y: 126 }, { x: 235, y: 120 },
    { x: 75, y: 142 }, { x: 120, y: 140 }, { x: 170, y: 145 }, { x: 215, y: 142 }
  ].map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="11" fill="#86efac" stroke="#16a34a" stroke-width="1"/>
  `).join('')}

  <!-- Epidermis Bawah & Stomata -->
  <rect x="40" y="165" width="90" height="14" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>
  <!-- Celah Stomata -->
  <ellipse cx="145" cy="172" rx="12" ry="6" fill="#ffffff" stroke="#15803d" stroke-width="1.5"/>
  <rect x="160" y="165" width="100" height="14" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>

  <!-- Garis Petunjuk & Target Badge -->
  <line x1="265" y1="${target.y}" x2="305" y2="${target.y}" stroke="#e11d48" stroke-width="2"/>
  <circle cx="320" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="320" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="212" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Jaringan daun yang ditunjuk oleh simbol "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 10. Piramida Makanan Ekologi (Tingkat Trofik & Energi)
export function renderPiramidaMakananEkologiSvg(params: any): string {
  const pointer = String(params.tingkat || params.pointer || 'produsen').toLowerCase();
  const labelChar = params.label || 'X';

  const tiers = [
    { id: 'tersier', label: 'Konsumen III / Puncak (10 J)', y: 45, h: 28, w: 90, color: '#f87171', border: '#dc2626' },
    { id: 'sekunder', label: 'Konsumen II (100 J)', y: 76, h: 30, w: 160, color: '#fbbf24', border: '#d97706' },
    { id: 'primer', label: 'Konsumen I (1.000 J)', y: 109, h: 32, w: 230, color: '#60a5fa', border: '#2563eb' },
    { id: 'produsen', label: 'Produsen / Tumbuhan (10.000 J)', y: 144, h: 34, w: 300, color: '#4ade80', border: '#16a34a' }
  ];

  let target = tiers.find(t => pointer.includes(t.id)) || tiers[3];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 230" width="380" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="230" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Piramida Energi Tingkat Trofik</text>

  ${tiers.map(t => {
    const isTarget = t.id === target.id;
    const x = 190 - t.w / 2;
    return `
    <rect x="${x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="4" fill="${t.color}30" stroke="${t.border}" stroke-width="1.8"/>
    ${isTarget ? `
      <circle cx="190" cy="${t.y + t.h / 2}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="190" y="${t.y + t.h / 2 + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : `
      <text x="190" y="${t.y + t.h / 2 + 3.5}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${t.label}</text>
    `}`;
  }).join('')}

  <text x="190" y="206" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Tingkatan trofik pada kotak bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}
