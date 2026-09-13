/**
 * science-biology.ts
 * Biology, Ecology, Animal & Plant Life Cycles SVG Visual Stimulus Renderers (22 Templates)
 */

import { escapeXml } from './types';

/** Render Rantai Makanan Sederhana dengan Tanda X */
export function renderRantaiMakananSvg(params: { pointer?: string; label?: string; organisme?: string[] }): string {
  const labelChar = params.label || 'X';
  const pointer = (params.pointer || 'konsumen1').toLowerCase();
  const organisme = params.organisme?.length ? params.organisme : ['Rumput', 'Belalang', 'Katak', 'Ular', 'Elang'];

  let targetIdx = 1;
  if (pointer.includes('produsen') || pointer.includes('tumbuhan')) targetIdx = 0;
  else if (pointer.includes('konsumen1') || pointer.includes('herbivora')) targetIdx = 1;
  else if (pointer.includes('konsumen2') || pointer.includes('karnivora')) targetIdx = 2;
  else if (pointer.includes('konsumen3') || pointer.includes('puncak')) targetIdx = 3;
  else if (pointer.includes('pengurai') || pointer.includes('dekomposer')) targetIdx = 4;

  const boxW = 55;
  const gap = 12;
  const startX = 15;
  const centerY = 90;
  const colors = ['#86efac', '#fef08a', '#fecdd3', '#fda4af', '#e2e8f0'];
  const roles = ['Produsen', 'Konsumen I', 'Konsumen II', 'Konsumen III', 'Pengurai'];

  let boxesSvg = '';
  let arrowsSvg = '';

  organisme.forEach((name, idx) => {
    if (idx >= 5) return;
    const x = startX + idx * (boxW + gap);
    const fill = colors[idx % colors.length];
    const stroke = idx === targetIdx ? '#e11d48' : '#475569';
    const sw = idx === targetIdx ? 3 : 1.5;

    boxesSvg += `
      <rect x="${x}" y="${centerY - 20}" width="${boxW}" height="40" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      <text x="${x + boxW / 2}" y="${centerY + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">${escapeXml(name)}</text>
      <text x="${x + boxW / 2}" y="${centerY + 34}" text-anchor="middle" font-size="8" fill="#64748b">(${roles[idx] || ''})</text>
    `;

    if (idx < organisme.length - 1 && idx < 4) {
      const ax = x + boxW + 2;
      arrowsSvg += `
        <line x1="${ax}" y1="${centerY}" x2="${ax + gap - 4}" y2="${centerY}" stroke="#047857" stroke-width="2"/>
        <polygon points="${ax + gap - 2},${centerY} ${ax + gap - 8},${centerY - 4} ${ax + gap - 8},${centerY + 4}" fill="#047857"/>
      `;
    }
  });

  // Target marker
  const targetX = startX + targetIdx * (boxW + gap) + boxW / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" width="360" height="180" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="180" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Rantai Makanan</text>

  ${arrowsSvg}
  ${boxesSvg}

  <!-- Target Huruf X -->
  <circle cx="${targetX}" cy="${centerY - 42}" r="14" fill="#e11d48"/>
  <text x="${targetX}" y="${centerY - 37}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  <line x1="${targetX}" y1="${centerY - 28}" x2="${targetX}" y2="${centerY - 22}" stroke="#e11d48" stroke-width="2"/>

  <text x="180" y="160" text-anchor="middle" font-size="11" fill="#64748b">Organisme bertanda huruf "${escapeXml(labelChar)}" berperan sebagai...</text>
</svg>`;
}

/** Render Metamorfosis Sempurna Kupu-Kupu dengan Tanda X */
export function renderMetamorfosisSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'kepompong').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 260, y: 140, name: 'Kepompong (Pupa)' };
  if (pointer.includes('telur')) target = { x: 160, y: 55, name: 'Telur' };
  else if (pointer.includes('ulat') || pointer.includes('larva')) target = { x: 75, y: 135, name: 'Ulat (Larva)' };
  else if (pointer.includes('kupu')) target = { x: 160, y: 200, name: 'Kupu-Kupu Dewasa' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 250" width="340" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="mArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#047857" />
    </marker>
  </defs>

  <text x="170" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Daur Hidup / Metamorfosis Kupu-Kupu</text>

  <path d="M 190,50 Q 250,75 255,115" fill="none" stroke="#047857" stroke-width="2" marker-end="url(#mArr)"/>
  <path d="M 255,160 Q 240,200 195,205" fill="none" stroke="#047857" stroke-width="2" marker-end="url(#mArr)"/>
  <path d="M 125,205 Q 75,185 75,155" fill="none" stroke="#047857" stroke-width="2" marker-end="url(#mArr)"/>
  <path d="M 85,110 Q 105,65 135,50" fill="none" stroke="#047857" stroke-width="2" marker-end="url(#mArr)"/>

  <!-- 1. Telur di atas Daun (Atas) -->
  <ellipse cx="160" cy="50" rx="22" ry="12" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <circle cx="155" cy="50" r="3" fill="#fef08a" stroke="#ca8a04"/>
  <circle cx="162" cy="49" r="3" fill="#fef08a" stroke="#ca8a04"/>
  <text x="160" y="74" text-anchor="middle" font-size="10" font-weight="bold" fill="#334155">1. Telur</text>

  <!-- 2. Ulat (Kiri) -->
  <ellipse cx="75" cy="130" rx="18" ry="10" fill="#a3e635" stroke="#4d7c0f" stroke-width="1.5"/>
  <text x="75" y="152" text-anchor="middle" font-size="10" font-weight="bold" fill="#334155">2. Ulat (Larva)</text>

  <!-- 3. Kepompong (Kanan) -->
  <path d="M 260,115 C 270,125 270,140 260,150 C 250,140 250,125 260,115 Z" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <text x="260" y="165" text-anchor="middle" font-size="10" font-weight="bold" fill="#334155">3. Kepompong</text>

  <!-- 4. Kupu-kupu (Bawah) -->
  <path d="M 155,200 C 140,185 130,205 145,215 M 165,200 C 180,185 190,205 175,215" fill="#f472b6" stroke="#db2777" stroke-width="1.5"/>
  <text x="160" y="228" text-anchor="middle" font-size="10" font-weight="bold" fill="#334155">4. Kupu-Kupu</text>

  <!-- Target Huruf X -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="15" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${target.x}" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="170" y="244" text-anchor="middle" font-size="11" fill="#64748b">Tahapan yang ditunjuk oleh huruf "${escapeXml(labelChar)}"</text>
</svg>`;
}

/** Render Bagian-Bagian Bunga Sempurna dengan Tanda X */
export function renderBagianBungaSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'putik').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 165, y: 64, name: 'Kepala Putik' };
  if (pointer.includes('sari') || pointer.includes('benang') || pointer.includes('anther')) target = { x: 122, y: 78, name: 'Benang Sari' };
  else if (pointer.includes('mahkota') || pointer.includes('petal') || pointer.includes('corolla')) target = { x: 232, y: 104, name: 'Mahkota Bunga' };
  else if (pointer.includes('kelopak') || pointer.includes('sepal') || pointer.includes('calyx')) target = { x: 120, y: 168, name: 'Kelopak Bunga' };
  else if (pointer.includes('biji') || pointer.includes('bakal') || pointer.includes('ovulum') || pointer.includes('ovarium')) target = { x: 165, y: 148, name: 'Bakal Biji' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 255" width="340" height="255" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
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
    <marker id="bArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="170" y="20" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Penampang Bagian-Bagian Bunga</text>

  <!-- Tangkai Bunga (Pedicel) & Dasar Bunga (Receptacle) -->
  <path d="M 162,176 L 162,224 Q 165,228 168,224 L 168,176 Z" fill="#15803d" stroke="#166534" stroke-width="1.5"/>
  <ellipse cx="165" cy="174" rx="24" ry="10" fill="#22c55e" stroke="#15803d" stroke-width="1.8"/>

  <!-- Kelopak Bunga (Sepal) Kiri & Kanan -->
  <path d="M 144,172 C 112,174 104,188 128,180 C 136,176 142,172 144,172 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.8"/>
  <path d="M 186,172 C 218,174 226,188 202,180 C 194,176 188,172 186,172 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.8"/>

  <!-- Mahkota Bunga (Petal) Belakang / Tengah -->
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
    <circle cx="294" cy="${target.y}" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
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
    { x: 15, title: 'Mutualisme', simbol: '( + / + )', efek: 'Keduanya Untung', contoh: 'Lebah &amp; Bunga' },
    { x: 145, title: 'Komensalisme', simbol: '( + / 0 )', efek: 'Satu Untung, Satu Netral', contoh: 'Ikan Remora &amp; Hiu' },
    { x: 275, title: 'Parasitisme', simbol: '( + / - )', efek: 'Satu Untung, Satu Rugi', contoh: 'Benalu &amp; Pohon Inang' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410 250" width="410" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="205" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Pola Interaksi Simbiosis Makhluk Hidup</text>

  <!-- Kolom 1: Mutualisme -->
  <rect x="15" y="42" width="120" height="175" rx="8" fill="#f0fdf4" stroke="${activeIdx === 0 ? '#e11d48' : '#86efac'}" stroke-width="${activeIdx === 0 ? 2.2 : 1.2}"/>
  <text x="75" y="64" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Mutualisme` : 'Mutualisme'}</text>
  <rect x="35" y="74" width="80" height="26" rx="13" fill="#bbf7d0"/>
  <text x="75" y="91" text-anchor="middle" font-size="13" font-weight="bold" fill="#166534">+ / +</text>
  <text x="75" y="125" text-anchor="middle" font-size="9" font-weight="bold" fill="#14532d">Kedua pihak saling</text>
  <text x="75" y="138" text-anchor="middle" font-size="9" font-weight="bold" fill="#14532d">menguntungkan</text>
  <line x1="30" y1="150" x2="120" y2="150" stroke="#86efac" stroke-width="1"/>
  <text x="75" y="170" text-anchor="middle" font-size="8.5" fill="#475569">Contoh:</text>
  <text x="75" y="184" text-anchor="middle" font-size="9" font-weight="600" fill="#15803d">Lebah &amp; Bunga</text>
  <text x="75" y="198" text-anchor="middle" font-size="8" fill="#64748b">Kerbau &amp; Jalak</text>

  <!-- Kolom 2: Komensalisme -->
  <rect x="145" y="42" width="120" height="175" rx="8" fill="#f0f9ff" stroke="${activeIdx === 1 ? '#e11d48' : '#7dd3fc'}" stroke-width="${activeIdx === 1 ? 2.2 : 1.2}"/>
  <text x="205" y="64" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Komensalisme` : 'Komensalisme'}</text>
  <rect x="165" y="74" width="80" height="26" rx="13" fill="#bae6fd"/>
  <text x="205" y="91" text-anchor="middle" font-size="13" font-weight="bold" fill="#0284c7">+ / 0</text>
  <text x="205" y="125" text-anchor="middle" font-size="9" font-weight="bold" fill="#075985">Satu untung,</text>
  <text x="205" y="138" text-anchor="middle" font-size="9" font-weight="bold" fill="#075985">satu tidak dirugikan</text>
  <line x1="160" y1="150" x2="250" y2="150" stroke="#7dd3fc" stroke-width="1"/>
  <text x="205" y="170" text-anchor="middle" font-size="8.5" fill="#475569">Contoh:</text>
  <text x="205" y="184" text-anchor="middle" font-size="9" font-weight="600" fill="#0284c7">Hiu &amp; Ikan Remora</text>
  <text x="205" y="198" text-anchor="middle" font-size="8" fill="#64748b">Anggrek &amp; Pohon</text>

  <!-- Kolom 3: Parasitisme -->
  <rect x="275" y="42" width="120" height="175" rx="8" fill="#fff1f2" stroke="${activeIdx === 2 ? '#e11d48' : '#fda4af'}" stroke-width="${activeIdx === 2 ? 2.2 : 1.2}"/>
  <text x="335" y="64" text-anchor="middle" font-size="11" font-weight="bold" fill="#be123c">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Parasitisme` : 'Parasitisme'}</text>
  <rect x="295" y="74" width="80" height="26" rx="13" fill="#fecdd3"/>
  <text x="335" y="91" text-anchor="middle" font-size="13" font-weight="bold" fill="#e11d48">+ / -</text>
  <text x="335" y="125" text-anchor="middle" font-size="9" font-weight="bold" fill="#9f1239">Satu untung,</text>
  <text x="335" y="138" text-anchor="middle" font-size="9" font-weight="bold" fill="#9f1239">pihak lain dirugikan</text>
  <line x1="290" y1="150" x2="380" y2="150" stroke="#fda4af" stroke-width="1"/>
  <text x="335" y="170" text-anchor="middle" font-size="8.5" fill="#475569">Contoh:</text>
  <text x="335" y="184" text-anchor="middle" font-size="9" font-weight="600" fill="#be123c">Benalu &amp; Inang</text>
  <text x="335" y="198" text-anchor="middle" font-size="8" fill="#64748b">Kutu &amp; Kucing</text>

  <!-- Badge X -->
  <circle cx="${cols[activeIdx].x + 110}" cy="50" r="10.5" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cols[activeIdx].x + 110}" y="54" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="205" y="238" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bentuk interaksi pada kolom "${escapeXml(labelChar)}" adalah hubungan ...</text>
</svg>`;
}

/** 8. Render Jaring-Jaring Makanan Ekosistem Sawah */
export function renderJaringMakananSawahSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'katak').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 130, y: 110, name: 'Katak' };
  if (pointer.includes('padi') || pointer.includes('produsen')) target = { x: 215, y: 225, name: 'Padi' };
  else if (pointer.includes('belalang')) target = { x: 85, y: 170, name: 'Belalang' };
  else if (pointer.includes('tikus')) target = { x: 215, y: 170, name: 'Tikus' };
  else if (pointer.includes('ulat')) target = { x: 335, y: 170, name: 'Ulat' };
  else if (pointer.includes('ayam') || pointer.includes('burung')) target = { x: 300, y: 110, name: 'Ayam' };
  else if (pointer.includes('ular')) target = { x: 160, y: 55, name: 'Ular Sawah' };
  else if (pointer.includes('elang') || pointer.includes('puncak')) target = { x: 280, y: 55, name: 'Burung Elang' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 275" width="430" height="275" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="foodArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <text x="215" y="20" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Jaring-Jaring Makanan Ekosistem Sawah</text>

  <!-- Panah Aliran Energi -->
  <!-- Dari Padi -->
  <line x1="190" y1="215" x2="105" y2="182" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>
  <line x1="215" y1="212" x2="215" y2="185" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>
  <line x1="240" y1="215" x2="315" y2="182" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>

  <!-- Dari Herbivora ke Karnivora Tingkat 2 -->
  <line x1="90" y1="155" x2="120" y2="125" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>
  <line x1="330" y1="155" x2="310" y2="125" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>
  <line x1="215" y1="155" x2="175" y2="70" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>

  <!-- Ke Predator Puncak -->
  <line x1="140" y1="95" x2="160" y2="70" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>
  <line x1="290" y1="95" x2="185" y2="65" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>
  <line x1="300" y1="95" x2="290" y2="70" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>
  <line x1="185" y1="55" x2="250" y2="55" stroke="#0284c7" stroke-width="1.5" marker-end="url(#foodArr)"/>

  <!-- Node Tingkat 4: Predator Puncak (Top) -->
  <rect x="120" y="45" width="75" height="24" rx="5" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5"/>
  <text x="157.5" y="61" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#991b1b">Ular</text>

  <rect x="255" y="45" width="75" height="24" rx="5" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5"/>
  <text x="292.5" y="61" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#991b1b">Elang</text>

  <!-- Node Tingkat 3: Konsumen II -->
  <rect x="95" y="100" width="75" height="24" rx="5" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="132.5" y="116" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#92400e">Katak</text>

  <rect x="260" y="100" width="75" height="24" rx="5" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="297.5" y="116" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#92400e">Ayam</text>

  <!-- Node Tingkat 2: Konsumen I (Herbivora) -->
  <rect x="50" y="160" width="75" height="24" rx="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
  <text x="87.5" y="176" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#075985">Belalang</text>

  <rect x="178" y="160" width="75" height="24" rx="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
  <text x="215.5" y="176" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#075985">Tikus</text>

  <rect x="298" y="160" width="75" height="24" rx="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
  <text x="335.5" y="176" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#075985">Ulat</text>

  <!-- Node Tingkat 1: Produsen (Bottom) -->
  <rect x="168" y="215" width="95" height="26" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="215.5" y="232" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#166534">Padi (Produsen)</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12.5" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="215" y="265" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Organisme yang ditandai dengan "${escapeXml(labelChar)}" menduduki peran ...</text>
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
    { x: 15, title: 'Kaktus (Xerofit)', ciri1: 'Daun berbentuk duri', ciri2: 'Batang tebal berdaging', ciri3: 'Akar panjang menyebar' },
    { x: 145, title: 'Teratai (Hidrofit)', ciri1: 'Daun bundar lebar & tipis', ciri2: 'Batang berongga udara', ciri3: 'Stomata di sisi atas' },
    { x: 275, title: 'Kantong Semar', ciri1: 'Daun membentuk kantung', ciri2: 'Cairan pencerna nektar', ciri3: 'Menjebak serangga (N)' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410 255" width="410" height="255" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="205" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Bentuk Adaptasi Morfologi Tumbuhan</text>

  <!-- Kolom 1: Kaktus -->
  <rect x="15" y="42" width="120" height="180" rx="8" fill="#fefce8" stroke="${activeIdx === 0 ? '#e11d48' : '#fef08a'}" stroke-width="${activeIdx === 0 ? 2.2 : 1.2}"/>
  <text x="75" y="60" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#854d0e">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Kaktus` : 'Kaktus (Xerofit)'}</text>
  <!-- Ilustrasi Kaktus -->
  <rect x="62" y="80" width="26" height="48" rx="12" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <path d="M 62,94 L 48,94 L 48,84 M 88,102 L 102,102 L 102,90" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/>
  <!-- Duri -->
  <line x1="68" y1="90" x2="65" y2="86" stroke="#166534" stroke-width="1.5"/>
  <line x1="82" y1="92" x2="85" y2="88" stroke="#166534" stroke-width="1.5"/>
  <line x1="72" y1="110" x2="68" y2="108" stroke="#166534" stroke-width="1.5"/>
  <text x="75" y="145" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#713f12">Habitat Kering</text>
  <text x="75" y="160" text-anchor="middle" font-size="8" fill="#475569">• Daun bentuk duri</text>
  <text x="75" y="174" text-anchor="middle" font-size="8" fill="#475569">• Batang tebal air</text>
  <text x="75" y="188" text-anchor="middle" font-size="8" fill="#475569">• Lapisan lilin</text>

  <!-- Kolom 2: Teratai -->
  <rect x="145" y="42" width="120" height="180" rx="8" fill="#f0fdf4" stroke="${activeIdx === 1 ? '#e11d48' : '#bbf7d0'}" stroke-width="${activeIdx === 1 ? 2.2 : 1.2}"/>
  <text x="205" y="60" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#166534">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Teratai` : 'Teratai (Hidrofit)'}</text>
  <!-- Ilustrasi Teratai -->
  <ellipse cx="205" cy="98" rx="35" ry="12" fill="#4ade80" stroke="#15803d" stroke-width="1.5"/>
  <path d="M 205,98 L 225,88" stroke="#f0fdf4" stroke-width="2"/>
  <circle cx="205" cy="90" r="8" fill="#f472b6" stroke="#db2777" stroke-width="1"/>
  <text x="205" y="145" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#14532d">Habitat Berair</text>
  <text x="205" y="160" text-anchor="middle" font-size="8" fill="#475569">• Daun lebar &amp; tipis</text>
  <text x="205" y="174" text-anchor="middle" font-size="8" fill="#475569">• Batang berongga</text>
  <text x="205" y="188" text-anchor="middle" font-size="8" fill="#475569">• Mengapung di air</text>

  <!-- Kolom 3: Kantong Semar -->
  <rect x="275" y="42" width="120" height="180" rx="8" fill="#fff7ed" stroke="${activeIdx === 2 ? '#e11d48' : '#fed7aa'}" stroke-width="${activeIdx === 2 ? 2.2 : 1.2}"/>
  <text x="335" y="60" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#c2410c">${activeIdx === 2 ? `[${escapeXml(labelChar)}] K. Semar` : 'Kantong Semar'}</text>
  <!-- Ilustrasi Kantung -->
  <path d="M 320,78 Q 315,100 322,120 Q 335,128 345,120 Q 352,100 348,78 Z" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/>
  <ellipse cx="334" cy="78" rx="14" ry="5" fill="#fdba74" stroke="#c2410c" stroke-width="1"/>
  <path d="M 334,73 Q 338,62 346,68" fill="none" stroke="#ea580c" stroke-width="2"/>
  <text x="335" y="145" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#7c2d12">Insektivora</text>
  <text x="335" y="160" text-anchor="middle" font-size="8" fill="#475569">• Daun jadi kantung</text>
  <text x="335" y="174" text-anchor="middle" font-size="8" fill="#475569">• Menjebak serangga</text>
  <text x="335" y="188" text-anchor="middle" font-size="8" fill="#475569">• Memperoleh nitrogen</text>

  <!-- Target Badge X -->
  <circle cx="${cols[activeIdx].x + 105}" cy="54" r="10.5" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cols[activeIdx].x + 105}" y="58" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="205" y="244" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Ciri adaptasi tumbuhan pada tanda "${escapeXml(labelChar)}" bertujuan untuk ...</text>
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
  else if (pointer.includes('umbi') || pointer.includes('kentang')) activeIdx = 1;
  else if (pointer.includes('geragih') || pointer.includes('stolon') || pointer.includes('stroberi')) activeIdx = 3;
  else if (pointer.includes('spora') || pointer.includes('paku') || pointer.includes('lumut')) activeIdx = 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" width="420" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Perkembangbiakan Vegetatif Alami Tumbuhan</text>

  <!-- 1. Tunas -->
  <rect x="10" y="45" width="75" height="155" rx="6" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="47.5" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Tunas</text>
  <!-- Ilustrasi Batang Utama & Tunas Kecil -->
  <rect x="36" y="85" width="16" height="55" rx="4" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <rect x="52" y="110" width="10" height="30" rx="3" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/>
  <text x="47.5" y="165" text-anchor="middle" font-size="8.5" font-weight="600" fill="#334155">Pisang</text>
  <text x="47.5" y="178" text-anchor="middle" font-size="8" fill="#64748b">Bambu</text>

  <!-- 2. Umbi Batang -->
  <rect x="90" y="45" width="75" height="155" rx="6" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="127.5" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Umbi Batang</text>
  <!-- Ilustrasi Kentang Bertunas -->
  <ellipse cx="127.5" cy="115" rx="20" ry="15" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <circle cx="120" cy="110" r="2" fill="#78350f"/>
  <path d="M 120,110 Q 115,102 118,98" stroke="#16a34a" stroke-width="1.5" fill="none"/>
  <circle cx="135" cy="118" r="2" fill="#78350f"/>
  <text x="127.5" y="165" text-anchor="middle" font-size="8.5" font-weight="600" fill="#334155">Kentang</text>
  <text x="127.5" y="178" text-anchor="middle" font-size="8" fill="#64748b">Ubi Jalar</text>

  <!-- 3. Rizoma (Akar Tinggal) -->
  <rect x="170" y="45" width="80" height="155" rx="6" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="210" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Rizoma</text>
  <!-- Ilustrasi Rimpang Jahe Bercabang -->
  <path d="M 185,120 Q 200,105 215,115 Q 225,100 235,118 Q 220,128 200,125 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="200" y1="112" x2="200" y2="98" stroke="#16a34a" stroke-width="2"/>
  <text x="210" y="165" text-anchor="middle" font-size="8.5" font-weight="600" fill="#334155">Jahe, Kunyit</text>
  <text x="210" y="178" text-anchor="middle" font-size="8" fill="#64748b">Lengkuas</text>

  <!-- 4. Geragih (Stolon) -->
  <rect x="255" y="45" width="75" height="155" rx="6" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="292.5" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Geragih</text>
  <!-- Ilustrasi Sulur Mendatar -->
  <path d="M 265,120 Q 292,105 320,120" fill="none" stroke="#16a34a" stroke-width="2.5"/>
  <circle cx="265" cy="120" r="4" fill="#22c55e"/>
  <circle cx="320" cy="120" r="4" fill="#22c55e"/>
  <text x="292.5" y="165" text-anchor="middle" font-size="8.5" font-weight="600" fill="#334155">Stroberi</text>
  <text x="292.5" y="178" text-anchor="middle" font-size="8" fill="#64748b">Pegagan</text>

  <!-- 5. Spora -->
  <rect x="335" y="45" width="75" height="155" rx="6" fill="#f8fafc" stroke="${activeIdx === 4 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 4 ? 2 : 1}"/>
  <text x="372.5" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Spora</text>
  <!-- Ilustrasi Kotak Spora (Sporangium) -->
  <circle cx="372.5" cy="105" r="10" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <line x1="372.5" y1="115" x2="372.5" y2="135" stroke="#16a34a" stroke-width="2"/>
  <circle cx="366" cy="100" r="1.5" fill="#78350f"/>
  <circle cx="376" cy="102" r="1.5" fill="#78350f"/>
  <text x="372.5" y="165" text-anchor="middle" font-size="8.5" font-weight="600" fill="#334155">Tumb. Paku</text>
  <text x="372.5" y="178" text-anchor="middle" font-size="8" fill="#64748b">Lumut</text>

  <!-- Target Badge X -->
  <circle cx="${[47.5, 127.5, 210, 292.5, 372.5][activeIdx]}" cy="45" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${[47.5, 127.5, 210, 292.5, 372.5][activeIdx]}" y="49" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="235" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Cara perkembangbiakan vegetatif pada kolom "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 12. Render Perbandingan Sel Hewan dan Sel Tumbuhan */
export function renderSelHewanTumbuhanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'kloroplas').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 95, y: 145, name: 'Kloroplas' };
  if (pointer.includes('dinding') || pointer.includes('selulosa')) target = { x: 50, y: 105, name: 'Dinding Sel' };
  else if (pointer.includes('vakuola')) target = { x: 125, y: 110, name: 'Vakuola Sentral' };
  else if (pointer.includes('nukleus') || pointer.includes('inti')) target = { x: 300, y: 120, name: 'Inti Sel (Nukleus)' };
  else if (pointer.includes('membran')) target = { x: 345, y: 95, name: 'Membran Sel' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="210" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Perbandingan Struktur Sel Tumbuhan vs Sel Hewan</text>

  <!-- Sisi Kiri: Sel Tumbuhan (Bentuk Kaku Bersudut) -->
  <g>
    <rect x="30" y="55" width="160" height="145" rx="14" fill="#f0fdf4" stroke="#15803d" stroke-width="4"/>
    <rect x="36" y="61" width="148" height="133" rx="10" fill="#dcfce7" stroke="#86efac" stroke-width="1.5"/>
    <!-- Vakuola Besar di Tengah -->
    <rect x="95" y="85" width="60" height="55" rx="12" fill="#bae6fd" fill-opacity="0.8" stroke="#0284c7" stroke-width="1.5"/>
    <text x="125" y="114" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Vakuola</text>
    <!-- Kloroplas Hijau -->
    <ellipse cx="65" cy="90" rx="12" ry="7" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
    <ellipse cx="65" cy="145" rx="12" ry="7" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
    <!-- Inti Sel Kecil di Sisi -->
    <circle cx="150" cy="155" r="14" fill="#fbcfe8" stroke="#db2777" stroke-width="1.5"/>
    <text x="110" y="218" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Sel Tumbuhan</text>
  </g>

  <!-- Sisi Kanan: Sel Hewan (Bentuk Bulat Fleksibel) -->
  <g>
    <ellipse cx="300" cy="125" rx="85" ry="68" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/>
    <!-- Inti Sel Besar di Tengah -->
    <circle cx="300" cy="125" r="22" fill="#fbcfe8" stroke="#db2777" stroke-width="2"/>
    <circle cx="300" cy="125" r="8" fill="#be185d"/>
    <text x="300" y="129" text-anchor="middle" font-size="8" font-weight="bold" fill="#ffffff">Nukleus</text>
    <!-- Mitokondria Oval -->
    <ellipse cx="250" cy="100" rx="11" ry="6" fill="#fed7aa" stroke="#ea580c" stroke-width="1"/>
    <ellipse cx="345" cy="145" rx="11" ry="6" fill="#fed7aa" stroke="#ea580c" stroke-width="1"/>
    <text x="300" y="218" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Sel Hewan</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Organel sel yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
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
