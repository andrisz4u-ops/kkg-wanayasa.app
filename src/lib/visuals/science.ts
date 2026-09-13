/**
 * science.ts
 * Science, Biology, Physics, and Social Studies SVG Renderers
 */

import { escapeXml } from './types';

/** Render Organ Pernapasan Manusia dengan Panah Penunjuk Dinamis X */
export function renderOrganPernapasanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'trakea').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 170, y: 112, name: 'Trakea (Tenggorokan)' };
  if (pointer.includes('hidung') || pointer.includes('rongga')) target = { x: 170, y: 48, name: 'Rongga Hidung' };
  else if (pointer.includes('laring') || pointer.includes('faring') || pointer.includes('pangkal')) target = { x: 170, y: 82, name: 'Faring / Laring' };
  else if (pointer.includes('bronkus') || pointer.includes('cabang')) target = { x: 145, y: 142, name: 'Bronkus' };
  else if (pointer.includes('paru') || pointer.includes('alveolus') || pointer.includes('pulmo')) target = { x: 215, y: 165, name: 'Paru-paru / Alveolus' };
  else if (pointer.includes('diafragma') || pointer.includes('sekat')) target = { x: 170, y: 218, name: 'Diafragma' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 270" width="350" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="lungGradR" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fecdd3"/>
      <stop offset="100%" stop-color="#fda4af"/>
    </linearGradient>
    <linearGradient id="lungGradL" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fecdd3"/>
      <stop offset="100%" stop-color="#fda4af"/>
    </linearGradient>
    <linearGradient id="tracheaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="175" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Sistem Pernapasan Manusia</text>

  <!-- Siluet Garis Luar Kepala, Leher & Bahu Torso -->
  <path d="M 130,42 C 130,22 152,18 170,18 C 188,18 205,24 205,44 C 205,58 194,68 186,76 L 245,92 C 255,95 260,110 255,135 L 248,225 L 92,225 L 85,135 C 80,110 85,95 95,92 L 154,76 C 146,68 130,58 130,42 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.8"/>

  <!-- Rongga Hidung & Faring -->
  <path d="M 164,30 Q 170,24 176,30 Q 174,48 170,55" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="170" cy="48" rx="7" ry="5" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>

  <!-- Laring (Kotak Suara) -->
  <path d="M 163,68 L 177,68 L 179,84 L 161,84 Z" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5"/>
  <line x1="165" y1="76" x2="175" y2="76" stroke="#c2410c" stroke-width="1.5"/>

  <!-- Trakea dengan Cincin Tulang Rawan Berlapis -->
  <rect x="163" y="85" width="14" height="48" rx="2" fill="url(#tracheaGrad)" stroke="#ea580c" stroke-width="1.6"/>
  <line x1="163" y1="93" x2="177" y2="93" stroke="#c2410c" stroke-width="1.8"/>
  <line x1="163" y1="101" x2="177" y2="101" stroke="#c2410c" stroke-width="1.8"/>
  <line x1="163" y1="109" x2="177" y2="109" stroke="#c2410c" stroke-width="1.8"/>
  <line x1="163" y1="117" x2="177" y2="117" stroke="#c2410c" stroke-width="1.8"/>
  <line x1="163" y1="125" x2="177" y2="125" stroke="#c2410c" stroke-width="1.8"/>

  <!-- Percabangan Bronkus Kiri & Kanan (Bifurkasi Karina) -->
  <path d="M 170,133 Q 166,142 145,148 Q 135,152 126,160" fill="none" stroke="#c2410c" stroke-width="3" stroke-linecap="round"/>
  <path d="M 170,133 Q 174,142 195,148 Q 205,152 214,160" fill="none" stroke="#c2410c" stroke-width="3" stroke-linecap="round"/>
  <!-- Cabang Bronkiolus Kecil -->
  <path d="M 142,148 Q 138,162 136,175 M 145,148 Q 148,160 148,172" fill="none" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 198,148 Q 202,162 204,175 M 195,148 Q 192,160 192,172" fill="none" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Paru-paru Kanan (3 Lobus: Superior, Medius, Inferior) -->
  <path d="M 158,138 C 142,132 118,136 106,152 C 94,168 96,192 104,206 C 114,216 142,216 156,206 C 162,198 162,156 158,138 Z" fill="url(#lungGradR)" stroke="#e11d48" stroke-width="1.8"/>
  <!-- Garis Fissura Lobus Paru Kanan -->
  <path d="M 102,170 Q 130,172 158,166" fill="none" stroke="#be123c" stroke-width="1.2" stroke-dasharray="2,2"/>
  <path d="M 108,190 Q 132,188 156,186" fill="none" stroke="#be123c" stroke-width="1.2" stroke-dasharray="2,2"/>

  <!-- Paru-paru Kiri (2 Lobus dengan Lekuk Jantung / Cardiac Notch) -->
  <path d="M 182,138 C 198,132 222,136 234,152 C 246,168 244,192 236,206 C 226,216 198,216 186,204 C 180,195 186,176 180,165 C 176,154 178,144 182,138 Z" fill="url(#lungGradL)" stroke="#e11d48" stroke-width="1.8"/>
  <!-- Garis Fissura Lobus Paru Kiri -->
  <path d="M 184,172 Q 212,175 238,172" fill="none" stroke="#be123c" stroke-width="1.2" stroke-dasharray="2,2"/>

  <!-- Otot Diafragma Melengkung di Bawah Rongga Dada -->
  <path d="M 88,222 Q 170,205 252,222" fill="none" stroke="#047857" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 98,226 Q 170,212 242,226" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Panah Penunjuk Dinamis Leader Line Target X -->
  <g>
    <line x1="290" y1="${target.y}" x2="${target.x + 8}" y2="${target.y}" stroke="#e11d48" stroke-width="2.2" marker-end="url(#arrow)"/>
    <circle cx="298" cy="${target.y}" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="298" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="175" y="254" text-anchor="middle" font-size="11" fill="#64748b">Perhatikan bagian organ bertanda huruf "${escapeXml(labelChar)}"</text>
</svg>`;
}

/** Render Siklus Air dengan Panah Tahapan dan Tanda Huruf X */
export function renderSiklusAirSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'evaporasi').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 75, y: 155, name: 'Evaporasi' };
  if (pointer.includes('kondensasi') || pointer.includes('awan')) target = { x: 130, y: 65, name: 'Kondensasi' };
  else if (pointer.includes('presipitasi') || pointer.includes('hujan')) target = { x: 220, y: 95, name: 'Presipitasi (Hujan)' };
  else if (pointer.includes('infiltrasi') || pointer.includes('tanah')) target = { x: 260, y: 195, name: 'Infiltrasi / Penyerapan' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 250" width="350" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="arrRed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
    <marker id="arrBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <text x="175" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Bagan Siklus Air di Bumi</text>

  <!-- Matahari -->
  <circle cx="45" cy="55" r="18" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
  <line x1="45" y1="28" x2="45" y2="34" stroke="#f59e0b" stroke-width="2"/>
  <line x1="45" y1="76" x2="45" y2="82" stroke="#f59e0b" stroke-width="2"/>

  <!-- Lautan / Air -->
  <rect x="10" y="195" width="140" height="35" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" rx="3"/>
  <text x="75" y="217" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">Laut / Danau</text>

  <!-- Daratan / Gunung -->
  <polygon points="150,230 220,135 280,230" fill="#a3e635" stroke="#65a30d" stroke-width="1.5"/>
  <polygon points="250,230 300,155 340,230" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <text x="240" y="215" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Daratan</text>

  <!-- Panah Evaporasi -->
  <path d="M 60,185 Q 65,145 75,115" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrBlue)"/>
  <path d="M 85,185 Q 90,145 95,115" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrBlue)"/>

  <!-- Awan (Kondensasi) -->
  <path d="M 120,80 A 15,15 0 0,1 145,65 A 22,22 0 0,1 180,68 A 16,16 0 0,1 195,85 L 115,85 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
  <!-- Awan Hujan Tebal -->
  <path d="M 210,75 A 18,18 0 0,1 240,60 A 25,25 0 0,1 280,65 A 18,18 0 0,1 295,82 L 205,82 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

  <!-- Tetesan Hujan (Presipitasi) -->
  <line x1="225" y1="92" x2="220" y2="108" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,3"/>
  <line x1="245" y1="92" x2="240" y2="108" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,3"/>
  <line x1="265" y1="92" x2="260" y2="108" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,3"/>

  <!-- Aliran Air Tanah (Infiltrasi) -->
  <path d="M 235,180 Q 180,210 145,210" fill="none" stroke="#0284c7" stroke-width="2" marker-end="url(#arrBlue)"/>

  <!-- Target Huruf X -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="15" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${target.x}" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="175" y="244" text-anchor="middle" font-size="11" fill="#64748b">Tahapan yang ditunjuk oleh huruf "${escapeXml(labelChar)}"</text>
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

/** Render Organ Pencernaan Manusia dengan Siluet Torso Anatomis & Highlight Organ Dinamis X */
export function renderOrganPencernaanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'lambung').toLowerCase();
  const labelChar = params.label || 'X';

  // Tentukan organ target dan highlight state
  let target = { x: 185, y: 125, name: 'Lambung' };
  let isTarget = {
    mulut: false,
    kerongkongan: false,
    lambung: false,
    hati: false,
    ususHalus: false,
    ususBesar: false,
    anus: false
  };

  if (pointer.includes('mulut') || pointer.includes('gigi') || pointer.includes('lidah')) {
    target = { x: 170, y: 44, name: 'Rongga Mulut' };
    isTarget.mulut = true;
  } else if (pointer.includes('kerongkongan') || pointer.includes('esofagus')) {
    target = { x: 170, y: 76, name: 'Kerongkongan (Esofagus)' };
    isTarget.kerongkongan = true;
  } else if (pointer.includes('usus halus')) {
    target = { x: 170, y: 175, name: 'Usus Halus' };
    isTarget.ususHalus = true;
  } else if (pointer.includes('usus besar') || pointer.includes('kolon')) {
    target = { x: 215, y: 155, name: 'Usus Besar (Kolon)' };
    isTarget.ususBesar = true;
  } else if (pointer.includes('anus') || pointer.includes('rektum')) {
    target = { x: 170, y: 220, name: 'Anus / Rektum' };
    isTarget.anus = true;
  } else if (pointer.includes('hati') || pointer.includes('liver')) {
    target = { x: 135, y: 115, name: 'Hati' };
    isTarget.hati = true;
  } else {
    // Default Lambung
    isTarget.lambung = true;
  }

  // Warna adaptif: organ target di-highlight warna menyala
  const colMulut = isTarget.mulut ? '#e11d48' : '#fda4af';
  const swMulut = isTarget.mulut ? 2.5 : 1.5;

  const colEsofagus = isTarget.kerongkongan ? '#d97706' : '#fed7aa';
  const swEsofagus = isTarget.kerongkongan ? 2.8 : 1.6;

  const colLambung = isTarget.lambung ? '#e11d48' : '#fecdd3';
  const swLambung = isTarget.lambung ? 2.8 : 1.8;

  const colHati = isTarget.hati ? '#b45309' : '#d97706';
  const swHati = isTarget.hati ? 2.8 : 1.6;

  const colUsusHalus = isTarget.ususHalus ? '#ea580c' : '#fed7aa';
  const swUsusHalus = isTarget.ususHalus ? 3.5 : 2.2;

  const colUsusBesar = isTarget.ususBesar ? '#0284c7' : '#bae6fd';
  const swUsusBesar = isTarget.ususBesar ? 4 : 2.5;

  const colAnus = isTarget.anus ? '#e11d48' : '#475569';
  const swAnus = isTarget.anus ? 2.8 : 1.8;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270" width="360" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="torsoBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="stomachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${isTarget.lambung ? '#fb7185' : '#fed7aa'}"/>
      <stop offset="100%" stop-color="${isTarget.lambung ? '#e11d48' : '#fecdd3'}"/>
    </linearGradient>
    <linearGradient id="liverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${isTarget.hati ? '#ea580c' : '#b45309'}"/>
      <stop offset="100%" stop-color="${isTarget.hati ? '#c2410c' : '#92400e'}"/>
    </linearGradient>
    <marker id="arrPenc" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="180" y="20" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Sistem Pencernaan Manusia</text>

  <!-- Siluet Tubuh Torso Manusia (Konteks Posisi Anatomis) -->
  <path d="M 140,28 C 140,20 155,18 170,18 C 185,18 200,20 200,28 C 200,38 190,48 185,55 L 235,68 C 245,72 250,85 245,110 L 235,160 C 235,180 245,210 245,240 L 95,240 C 95,210 105,180 105,160 L 95,110 C 90,85 95,72 105,68 L 155,55 C 150,48 140,38 140,28 Z" fill="url(#torsoBg)" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- 1. Rongga Mulut & Kelenjar Ludah -->
  <ellipse cx="170" cy="44" rx="14" ry="8" fill="${colMulut}" stroke="#e11d48" stroke-width="${swMulut}"/>
  <path d="M 162,44 Q 170,48 178,44" fill="none" stroke="#be123c" stroke-width="1.2"/>
  <text x="135" y="47" font-size="9.5" text-anchor="end" font-weight="600" fill="#64748b">Mulut</text>

  <!-- 2. Kerongkongan (Esofagus) Tabung Berotot -->
  <path d="M 167,52 L 167,98 M 173,52 L 173,98" stroke="${colEsofagus}" stroke-width="${swEsofagus * 1.5}" stroke-linecap="round"/>
  <text x="135" y="78" font-size="9.5" text-anchor="end" font-weight="600" fill="#64748b">Kerongkongan</text>

  <!-- 3. Hati (Liver) dengan Lobus Kanan & Kiri -->
  <path d="M 112,96 C 102,98 96,112 104,126 C 112,138 138,136 154,124 L 154,98 Z" fill="url(#liverGrad)" stroke="#78350f" stroke-width="${swHati}"/>
  <!-- Kantung Empedu (Gallbladder Hijau) -->
  <path d="M 142,126 C 142,132 148,136 152,132 C 156,128 152,124 148,124 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
  <text x="96" y="115" font-size="9.5" text-anchor="end" font-weight="600" fill="#64748b">Hati</text>

  <!-- Pankreas (Kuning di Balik Lambung) -->
  <path d="M 152,134 Q 170,132 188,138 Q 172,142 152,136 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2"/>

  <!-- 4. Lambung (Ventriculus J-Shape Anatomis) -->
  <path d="M 166,96 C 156,96 150,110 158,128 C 164,142 182,148 196,140 C 206,132 208,114 198,102 C 188,92 174,96 166,96 Z" fill="url(#stomachGrad)" stroke="#be123c" stroke-width="${swLambung}"/>
  <text x="218" y="112" font-size="9.5" font-weight="600" fill="#64748b">Lambung</text>

  <!-- 6. Usus Besar (Kolon Membingkai dengan Lekukan Haustra) -->
  <!-- Kolon Asendens (Kanan Tubuh / Kiri Gambar) -->
  <path d="M 132,198 C 130,182 134,170 132,154 C 132,148 136,144 146,146" fill="none" stroke="${colUsusBesar}" stroke-width="${swUsusBesar}" stroke-linecap="round"/>
  <!-- Kolon Transversum (Mendatar) -->
  <path d="M 146,146 C 160,148 185,148 198,148" fill="none" stroke="${colUsusBesar}" stroke-width="${swUsusBesar}" stroke-linecap="round"/>
  <!-- Kolon Desendens & Sigmoid (Kiri Tubuh / Kanan Gambar ke Tengah) -->
  <path d="M 198,148 C 206,150 206,168 204,196 C 202,208 186,212 176,214 L 170,224" fill="none" stroke="${colUsusBesar}" stroke-width="${swUsusBesar}" stroke-linecap="round"/>
  <text x="222" y="165" font-size="9.5" font-weight="600" fill="#64748b">Usus Besar</text>

  <!-- 5. Usus Halus (Lipatan-lipatan Berkelok di Tengah) -->
  <path d="M 152,158 Q 168,154 182,158 Q 186,170 170,172 Q 152,174 154,186 Q 168,188 184,186 Q 182,198 168,200" fill="none" stroke="${colUsusHalus}" stroke-width="${swUsusHalus}" stroke-linecap="round"/>
  <text x="125" y="180" font-size="9.5" text-anchor="end" font-weight="600" fill="#64748b">Usus Halus</text>

  <!-- 7. Anus / Rektum -->
  <ellipse cx="170" cy="226" rx="5" ry="3.5" fill="${colAnus}" stroke="#1e293b" stroke-width="${swAnus}"/>
  <text x="145" y="230" font-size="9.5" text-anchor="end" font-weight="600" fill="#64748b">Anus</text>

  <!-- Panah Penunjuk Dinamis Leader Line Target X -->
  <g>
    <line x1="298" y1="${target.y}" x2="${target.x + 12}" y2="${target.y}" stroke="#e11d48" stroke-width="2.2" marker-end="url(#arrPenc)"/>
    <circle cx="308" cy="${target.y}" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="308" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="180" y="258" text-anchor="middle" font-size="11" fill="#64748b">Perhatikan bagian organ yang ditunjuk oleh huruf "${escapeXml(labelChar)}"</text>
</svg>`;
}

/** Render Penampang Mikroskopis Vili (Jonjot) Usus Halus dengan Penunjuk Dinamis X */
export function renderViliUsusSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'vili').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 190, y: 80, name: 'Vili Usus' };
  let desc = 'Struktur lipatan tonjolan bertanda huruf "' + escapeXml(labelChar) + '" berfungsi memperluas bidang penyerapan sari makanan.';

  if (pointer.includes('kapiler') || pointer.includes('darah')) {
    target = { x: 175, y: 110, name: 'Kapiler Darah' };
    desc = 'Pembuluh darah bertanda huruf "' + escapeXml(labelChar) + '" menyerap sari makanan berupa glukosa dan asam amino.';
  } else if (pointer.includes('lakteal') || pointer.includes('limfa') || pointer.includes('lemak') || pointer.includes('kil')) {
    target = { x: 190, y: 105, name: 'Pembuluh Lakteal (Kil)' };
    desc = 'Pembuluh limfa/lakteal bertanda huruf "' + escapeXml(labelChar) + '" berfungsi menyerap asam lemak dan gliserol.';
  } else if (pointer.includes('epitel') || pointer.includes('dinding')) {
    target = { x: 165, y: 70, name: 'Lapisan Epitel' };
    desc = 'Lapisan sel bertanda huruf "' + escapeXml(labelChar) + '" membatasi lumen usus dan menyerap nutrisi.';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 270" width="380" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="villiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="lactealGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <marker id="arrVili" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="190" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Struktur Mikroskopis Vili (Jonjot) Usus Halus</text>

  <!-- Molekul Sari Makanan di Rongga Lumen -->
  <g opacity="0.85">
    <circle cx="80" cy="38" r="3.5" fill="#38bdf8"/>
    <circle cx="120" cy="42" r="3" fill="#f43f5e"/>
    <circle cx="170" cy="35" r="4" fill="#eab308"/>
    <circle cx="210" cy="40" r="3" fill="#38bdf8"/>
    <circle cx="260" cy="36" r="3.5" fill="#f43f5e"/>
    <circle cx="300" cy="42" r="3" fill="#eab308"/>
    <text x="190" y="50" text-anchor="middle" font-size="9" fill="#94a3b8" font-style="italic">Lumen Usus (Rongga Berisi Sari-Sari Makanan)</text>
  </g>

  <!-- Dasar Jaringan Mukosa & Submukosa Usus -->
  <rect x="25" y="195" width="330" height="35" rx="4" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5"/>
  <text x="190" y="218" text-anchor="middle" font-size="10" font-weight="600" fill="#9a3412">Dinding Mukosa &amp; Jaringan Dasar Usus Halus</text>

  <!-- 3 Vili Berdampingan -->
  <!-- Vili Kiri -->
  <path d="M 50,195 C 50,110 65,70 85,70 C 105,70 120,110 120,195" fill="url(#villiGrad)" stroke="#f97316" stroke-width="1.5"/>
  <path d="M 85,95 L 85,195" stroke="#eab308" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M 75,95 C 70,120 70,160 75,195" stroke="#ef4444" stroke-width="1.8" fill="none"/>
  <path d="M 95,95 C 100,120 100,160 95,195" stroke="#3b82f6" stroke-width="1.8" fill="none"/>

  <!-- Vili Kanan -->
  <path d="M 260,195 C 260,110 275,70 295,70 C 315,70 330,110 330,195" fill="url(#villiGrad)" stroke="#f97316" stroke-width="1.5"/>
  <path d="M 295,95 L 295,195" stroke="#eab308" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M 285,95 C 280,120 280,160 285,195" stroke="#ef4444" stroke-width="1.8" fill="none"/>
  <path d="M 305,95 C 310,120 310,160 305,195" stroke="#3b82f6" stroke-width="1.8" fill="none"/>

  <!-- Vili Tengah (Fokus Utama / Penampang Transparan) -->
  <path d="M 145,195 C 145,100 165,55 190,55 C 215,55 235,100 235,195" fill="url(#villiGrad)" stroke="#ea580c" stroke-width="2.5"/>

  <!-- Sel Epitel Pelapis -->
  <path d="M 148,190 C 148,105 167,60 190,60 C 213,60 232,105 232,190" fill="none" stroke="#fdba74" stroke-width="1" stroke-dasharray="3,3"/>

  <!-- Pembuluh Lakteal (Kuning Emas) -->
  <path d="M 190,82 L 190,195" stroke="url(#lactealGrad)" stroke-width="8" stroke-linecap="round"/>
  <ellipse cx="190" cy="80" rx="4" ry="4" fill="#ca8a04"/>

  <!-- Anyaman Pembuluh Kapiler Darah -->
  <path d="M 176,82 C 168,115 168,155 174,195" stroke="#ef4444" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 204,82 C 212,115 212,155 206,195" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 176,82 C 182,72 198,72 204,82" stroke="#dc2626" stroke-width="2.5" fill="none"/>
  <line x1="172" y1="120" x2="208" y2="120" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="2,2"/>
  <line x1="171" y1="150" x2="209" y2="150" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="2,2"/>

  <!-- Panah Penunjuk Target X -->
  <g>
    <line x1="330" y1="${target.y}" x2="${target.x + 15}" y2="${target.y}" stroke="#e11d48" stroke-width="2" marker-end="url(#arrVili)"/>
    <circle cx="340" cy="${target.y}" r="14" fill="#e11d48"/>
    <text x="340" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Keterangan Komponen di Bawah -->
  <g font-size="9" fill="#475569">
    <circle cx="55" cy="242" r="4" fill="#f97316"/>
    <text x="64" y="245">Lipatan Vili</text>
    <circle cx="140" cy="242" r="4" fill="#ef4444"/>
    <text x="149" y="245">Kapiler Darah</text>
    <circle cx="235" cy="242" r="4" fill="#eab308"/>
    <text x="244" y="245">Lakteal (Limfa)</text>
  </g>

  <text x="190" y="262" text-anchor="middle" font-size="10.5" fill="#64748b">${desc}</text>
</svg>`;
}

/** Render Ragam Jenis Gigi Manusia & Fungsinya dengan Tanda X */
export function renderStrukturGigiSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'seri').toLowerCase();
  const labelChar = params.label || 'X';

  let targetIdx = 0; // 0 = seri, 1 = taring, 2 = geraham
  let targetX = 75;
  let targetY = 110;
  let desc = 'Gigi bertanda huruf "' + escapeXml(labelChar) + '" berfungsi memotong makanan.';

  if (pointer.includes('taring') || pointer.includes('canine') || pointer.includes('robek')) {
    targetIdx = 1;
    targetX = 180;
    targetY = 100;
    desc = 'Gigi bertanda huruf "' + escapeXml(labelChar) + '" berbentuk runcing untuk merobek dan mengoyak makanan.';
  } else if (pointer.includes('geraham') || pointer.includes('molar') || pointer.includes('kunyah') || pointer.includes('lumat')) {
    targetIdx = 2;
    targetX = 285;
    targetY = 110;
    desc = 'Gigi bertanda huruf "' + escapeXml(labelChar) + '" berpermukaan lebar untuk mengunyah dan melumatkan makanan.';
  }

  const highlight0 = targetIdx === 0 ? 'stroke="#e11d48" stroke-width="2.5"' : 'stroke="#64748b" stroke-width="1.5"';
  const highlight1 = targetIdx === 1 ? 'stroke="#e11d48" stroke-width="2.5"' : 'stroke="#64748b" stroke-width="1.5"';
  const highlight2 = targetIdx === 2 ? 'stroke="#e11d48" stroke-width="2.5"' : 'stroke="#64748b" stroke-width="1.5"';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="360" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="rootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <marker id="arrGigi" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="180" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Jenis-Jenis Gigi Manusia &amp; Fungsinya</text>

  <!-- Pita Gusi (Gingiva) Merah Muda di Bagian Bawah -->
  <rect x="20" y="150" width="320" height="40" rx="6" fill="#fbcfe8" stroke="#f43f5e" stroke-width="1.5"/>
  <text x="32" y="174" font-size="9" font-weight="bold" fill="#be123c">GUSI</text>

  <!-- 1. GIGI SERI (Incisor) -->
  <g>
    <path d="M 67,150 L 75,190 L 83,150 Z" fill="url(#rootGrad)" stroke="#d97706" stroke-width="1.2"/>
    <path d="M 60,150 L 62,80 C 62,75 88,75 88,80 L 90,150 Z" fill="url(#toothGrad)" ${highlight0}/>
    <line x1="64" y1="78" x2="86" y2="78" stroke="#94a3b8" stroke-width="2"/>
    <text x="75" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Gigi Seri</text>
    <text x="75" y="206" text-anchor="middle" font-size="8.5" fill="#475569">Fungsi: Memotong</text>
  </g>

  <!-- 2. GIGI TARING (Canine) -->
  <g>
    <path d="M 171,150 L 180,195 L 189,150 Z" fill="url(#rootGrad)" stroke="#d97706" stroke-width="1.2"/>
    <path d="M 166,150 L 168,90 L 180,68 L 192,90 L 194,150 Z" fill="url(#toothGrad)" ${highlight1}/>
    <circle cx="180" cy="68" r="2" fill="#e11d48"/>
    <text x="180" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Gigi Taring</text>
    <text x="180" y="206" text-anchor="middle" font-size="8.5" fill="#475569">Fungsi: Merobek</text>
  </g>

  <!-- 3. GIGI GERAHAM (Molar) -->
  <g>
    <path d="M 268,150 L 265,188 L 273,150 L 285,150 L 293,188 L 290,150 Z" fill="url(#rootGrad)" stroke="#d97706" stroke-width="1.2"/>
    <path d="M 262,150 L 264,88 C 265,78 272,78 275,82 C 278,78 285,78 288,82 C 291,78 297,78 298,88 L 300,150 Z" fill="url(#toothGrad)" ${highlight2}/>
    <path d="M 268,84 Q 281,88 294,84" stroke="#94a3b8" stroke-width="1.5" fill="none"/>
    <text x="281" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">Gigi Geraham</text>
    <text x="281" y="206" text-anchor="middle" font-size="8.5" fill="#475569">Fungsi: Mengunyah</text>
  </g>

  <!-- Panah Penunjuk Target X -->
  <g>
    <line x1="${targetX}" y1="36" x2="${targetX}" y2="${targetY - 20}" stroke="#e11d48" stroke-width="2" marker-end="url(#arrGigi)"/>
    <circle cx="${targetX}" cy="36" r="13" fill="#e11d48"/>
    <text x="${targetX}" y="41" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="180" y="235" text-anchor="middle" font-size="10.5" fill="#64748b">${desc}</text>
</svg>`;
}

/** Render Struktur Anatomi Lambung Detail & Enzim dengan Tanda X */
export function renderLambungDetailSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'rugae').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 180, y: 135, name: 'Dinding Lambung (Rugae)' };
  let desc = 'Bagian bertanda huruf "' + escapeXml(labelChar) + '" menghasilkan asam klorida (HCl) dan enzim pepsin.';

  if (pointer.includes('kardia') || pointer.includes('esofagus') || pointer.includes('atas') || pointer.includes('katup')) {
    target = { x: 148, y: 70, name: 'Sfingter Kardia' };
    desc = 'Bagian katup bertanda huruf "' + escapeXml(labelChar) + '" mencegah makanan dan asam lambung kembali ke kerongkongan.';
  } else if (pointer.includes('pilorus') || pointer.includes('duodenum') || pointer.includes('bawah') || pointer.includes('usus')) {
    target = { x: 235, y: 165, name: 'Sfingter Pilorus / Duodenum' };
    desc = 'Bagian bertanda huruf "' + escapeXml(labelChar) + '" mengatur jalannya makanan lumat (kimus) menuju usus 12 jari.';
  } else if (pointer.includes('fundus') || pointer.includes('kubah')) {
    target = { x: 215, y: 75, name: 'Fundus Lambung' };
    desc = 'Bagian kubah atas lambung bertanda huruf "' + escapeXml(labelChar) + '" menampung gas hasil pencernaan.';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="360" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="stomachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fee2e2"/>
      <stop offset="50%" stop-color="#fecdd3"/>
      <stop offset="100%" stop-color="#fda4af"/>
    </linearGradient>
    <marker id="arrStom" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="180" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Penampang Detail Organ Lambung Manusia</text>

  <!-- Kerongkongan (Esofagus) Masuk -->
  <path d="M 135,40 L 135,70 M 155,40 L 155,70" stroke="#f97316" stroke-width="4"/>
  <text x="110" y="55" font-size="9" fill="#64748b">Esofagus</text>

  <!-- Kontur Kantung Lambung J-Shape -->
  <path d="M 135,70 C 115,85 105,120 120,165 C 135,200 185,205 220,175 C 240,160 245,150 260,150 L 260,170 C 245,170 225,190 205,210 C 145,225 100,195 90,145 C 80,95 110,65 145,65 C 190,65 245,70 245,110 C 245,130 225,145 205,145 C 175,145 160,120 160,95 L 155,70" fill="url(#stomachGrad)" stroke="#e11d48" stroke-width="2.5"/>

  <!-- Lipatan Dinding Dalam (Rugae) -->
  <path d="M 125,125 C 135,135 140,160 135,175" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M 145,135 C 155,145 160,170 155,185" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M 165,145 C 175,155 185,175 180,190" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M 185,145 C 195,150 205,165 200,175" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" fill="none"/>

  <!-- Saluran Duodenum (Usus 12 Jari) Keluar -->
  <text x="270" y="155" font-size="9" fill="#64748b">Duodenum</text>

  <!-- Panah Penunjuk Target X -->
  <g>
    <line x1="300" y1="${target.y}" x2="${target.x + 12}" y2="${target.y}" stroke="#e11d48" stroke-width="2" marker-end="url(#arrStom)"/>
    <circle cx="310" cy="${target.y}" r="14" fill="#e11d48"/>
    <text x="310" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="180" y="238" text-anchor="middle" font-size="10.5" fill="#64748b">${desc}</text>
</svg>`;
}

/** Render Penampang Alveolus & Kapiler Pertukaran Gas dengan Tanda X */
export function renderAlveolusSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'alveolus').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 180, y: 120, name: 'Kantung Alveolus' };
  let desc = 'Kantung udara bertanda huruf "' + escapeXml(labelChar) + '" adalah tempat terjadinya pertukaran gas O2 dan CO2.';

  if (pointer.includes('kapiler') || pointer.includes('darah')) {
    target = { x: 235, y: 140, name: 'Kapiler Darah' };
    desc = 'Pembuluh darah kapiler bertanda huruf "' + escapeXml(labelChar) + '" mengikat oksigen dan melepaskan karbon dioksida.';
  } else if (pointer.includes('bronkiolus') || pointer.includes('saluran')) {
    target = { x: 90, y: 80, name: 'Bronkiolus' };
    desc = 'Saluran bronkiolus bertanda huruf "' + escapeXml(labelChar) + '" mengalirkan udara bersih masuk ke gugusan alveoli.';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="360" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="arrAlv" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
    <radialGradient id="alvRongga" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </radialGradient>
  </defs>

  <text x="180" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Penampang Alveolus &amp; Pertukaran Gas (O₂ &amp; CO₂)</text>

  <!-- Bronkiolus Cabang Saluran -->
  <path d="M 40,70 Q 75,75 110,95 L 105,115 Q 75,95 40,90 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
  <text x="60" y="65" font-size="9" fill="#9a3412">Bronkiolus</text>

  <!-- Gugusan Kantung Alveoli Belakang -->
  <circle cx="150" cy="100" r="28" fill="#ffedd5" stroke="#f97316" stroke-width="1.5"/>
  <circle cx="210" cy="95" r="26" fill="#ffedd5" stroke="#f97316" stroke-width="1.5"/>
  <circle cx="155" cy="155" r="27" fill="#ffedd5" stroke="#f97316" stroke-width="1.5"/>
  <circle cx="215" cy="150" r="28" fill="#ffedd5" stroke="#f97316" stroke-width="1.5"/>

  <!-- Kantung Alveolus Tengah Dibelah (Fokus Penampang) -->
  <circle cx="180" cy="125" r="32" fill="url(#alvRongga)" stroke="#ea580c" stroke-width="2.5"/>

  <!-- Anyaman Kapiler Darah (Biru = Kaya CO2, Merah = Kaya O2) -->
  <path d="M 125,120 Q 150,85 185,85" stroke="#3b82f6" stroke-width="3" fill="none"/>
  <path d="M 185,85 Q 225,85 240,120" stroke="#ef4444" stroke-width="3" fill="none"/>
  <path d="M 125,135 Q 150,165 185,165" stroke="#3b82f6" stroke-width="3" fill="none"/>
  <path d="M 185,165 Q 225,165 240,135" stroke="#ef4444" stroke-width="3" fill="none"/>

  <!-- Panah Difusi Gas di Dalam Alveolus -->
  <g font-size="9" font-weight="bold">
    <text x="165" y="118" fill="#15803d">O₂</text>
    <path d="M 175,115 L 195,105" stroke="#15803d" stroke-width="1.5" marker-end="url(#arrAlv)"/>
    <text x="185" y="140" fill="#dc2626">CO₂</text>
    <path d="M 195,145 L 175,135" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arrAlv)"/>
  </g>

  <!-- Panah Penunjuk Target X -->
  <g>
    <line x1="310" y1="${target.y}" x2="${target.x + 15}" y2="${target.y}" stroke="#e11d48" stroke-width="2" marker-end="url(#arrAlv)"/>
    <circle cx="320" cy="${target.y}" r="14" fill="#e11d48"/>
    <text x="320" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="180" y="238" text-anchor="middle" font-size="10.5" fill="#64748b">${desc}</text>
</svg>`;
}

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
    const bulbFill = isLit ? '#fef08a' : '#f1f5f9';
    const bulbStroke = isLit ? '#eab308' : '#64748b';
    const filColor = isLit ? '#ca8a04' : '#64748b';

    let rays = '';
    if (isLit) {
      const rayCoords = [
        [cx, cy - 20, cx, cy - 27],
        [cx + 14, cy - 14, cx + 19, cy - 19],
        [cx + 20, cy, cx + 27, cy],
        [cx + 14, cy + 14, cx + 19, cy + 19],
        [cx, cy + 20, cx, cy + 27],
        [cx - 14, cy + 14, cx - 19, cy + 19],
        [cx - 20, cy, cx - 27, cy],
        [cx - 14, cy - 14, cx - 19, cy - 19],
      ];
      rays = rayCoords.map(([x1, y1, x2, y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>`
      ).join('');
    }

    let targetBadge = '';
    if (isTarget) {
      targetBadge = `
        <circle cx="${cx}" cy="${cy - 28}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
        <text x="${cx}" y="${cy - 24}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }

    return `
      <g>
        ${rays}
        <circle cx="${cx}" cy="${cy}" r="14" fill="${bulbFill}" stroke="${bulbStroke}" stroke-width="2.5"/>
        <path d="M ${cx - 5} ${cy + 6} L ${cx - 3} ${cy - 4} L ${cx} ${cy - 1} L ${cx + 3} ${cy - 4} L ${cx + 5} ${cy + 6}" stroke="${filColor}" stroke-width="1.8" fill="none"/>
        <rect x="${cx - 5}" y="${cy + 13}" width="10" height="4" fill="#94a3b8" rx="1"/>
        <text x="${cx}" y="${cy + 27}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${name}</text>
        <text x="${cx}" y="${cy + 38}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${isLit ? '#16a34a' : '#64748b'}">${isLit ? 'Nyala' : 'Padam'}</text>
        ${targetBadge}
      </g>
    `;
  };

  // Helper switch
  const drawSwitch = (x1: number, y: number, x2: number, name: string, isClosed: boolean, targetId: string) => {
    const isTarget = pointer === targetId || pointer === name;
    const leverY2 = isClosed ? y : y - 14;
    const leverX2 = isClosed ? x2 : x1 + (x2 - x1) * 0.85;
    const leverColor = isClosed ? '#16a34a' : '#e11d48';

    let targetBadge = '';
    if (isTarget) {
      targetBadge = `
        <circle cx="${(x1 + x2) / 2}" cy="${y - 25}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
        <text x="${(x1 + x2) / 2}" y="${y - 21}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      `;
    }

    return `
      <g>
        <circle cx="${x1}" cy="${y}" r="3.5" fill="#0f172a"/>
        <circle cx="${x2}" cy="${y}" r="3.5" fill="#0f172a"/>
        <line x1="${x1}" y1="${y}" x2="${leverX2}" y2="${leverY2}" stroke="${leverColor}" stroke-width="2.8" stroke-linecap="round"/>
        <text x="${(x1 + x2) / 2}" y="${y - 12}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${name}</text>
        <rect x="${(x1 + x2) / 2 - 24}" y="${y + 6}" width="48" height="15" rx="3" fill="${isClosed ? '#dcfce7' : '#fee2e2'}"/>
        <text x="${(x1 + x2) / 2}" y="${y + 17}" text-anchor="middle" font-size="9" font-weight="bold" fill="${isClosed ? '#15803d' : '#b91c1c'}">${isClosed ? 'Tertutup' : 'Terbuka'}</text>
        ${targetBadge}
      </g>
    `;
  };

  // Battery helper
  const drawBattery = (cx: number, cy: number) => `
    <g>
      <line x1="${cx - 16}" y1="${cy - 12}" x2="${cx + 16}" y2="${cy - 12}" stroke="#0f172a" stroke-width="1.8"/>
      <line x1="${cx - 10}" y1="${cy - 4}" x2="${cx + 10}" y2="${cy - 4}" stroke="#0f172a" stroke-width="4"/>
      <line x1="${cx - 16}" y1="${cy + 4}" x2="${cx + 16}" y2="${cy + 4}" stroke="#0f172a" stroke-width="1.8"/>
      <line x1="${cx - 10}" y1="${cy + 12}" x2="${cx + 10}" y2="${cy + 12}" stroke="#0f172a" stroke-width="4"/>
      <text x="${cx + 22}" y="${cy - 9}" font-size="14" font-weight="bold" fill="#e11d48">+</text>
      <text x="${cx + 22}" y="${cy + 15}" font-size="16" font-weight="bold" fill="#0f172a">−</text>
      <text x="${cx - 24}" y="${cy + 4}" text-anchor="end" font-size="11" font-weight="600" fill="#475569">Baterai</text>
    </g>
  `;

  let circuitContent = '';
  let modelTitle = 'Rangkaian Listrik Campuran';

  if (model === 'seri') {
    modelTitle = 'Rangkaian Listrik Seri';
    circuitContent = `
      <path d="M 60,130 L 60,60 L 400,60 L 400,200 L 60,200 L 60,130" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${drawBattery(60, 130)}
      ${drawSwitch(130, 60, 180, 'S₁', isS1Closed, 'S1')}
      ${drawBulb(260, 60, 'L₁', l1Lit, 'L1')}
      ${drawBulb(350, 60, 'L₂', l2Lit, 'L2')}
    `;
  } else if (model === 'paralel') {
    modelTitle = 'Rangkaian Listrik Paralel';
    circuitContent = `
      <path d="M 60,130 L 60,80 L 150,80" fill="none" stroke="#1e293b" stroke-width="2.5"/>
      <path d="M 60,130 L 60,180 L 150,180" fill="none" stroke="#1e293b" stroke-width="2.5"/>
      <line x1="150" y1="80" x2="150" y2="180" stroke="#1e293b" stroke-width="2.5"/>
      <circle cx="150" cy="80" r="3.5" fill="#0f172a"/>
      <circle cx="150" cy="180" r="3.5" fill="#0f172a"/>
      ${drawBattery(60, 130)}

      <line x1="150" y1="80" x2="380" y2="80" stroke="#1e293b" stroke-width="2.5"/>
      ${drawSwitch(180, 80, 230, 'S₁', isS1Closed, 'S1')}
      ${drawBulb(300, 80, 'L₁', l1Lit, 'L1')}

      <line x1="150" y1="180" x2="380" y2="180" stroke="#1e293b" stroke-width="2.5"/>
      ${drawSwitch(180, 180, 230, 'S₂', isS2Closed, 'S2')}
      ${drawBulb(300, 180, 'L₂', l2Lit, 'L2')}

      <line x1="380" y1="80" x2="380" y2="180" stroke="#1e293b" stroke-width="2.5"/>
      <circle cx="380" cy="80" r="3.5" fill="#0f172a"/>
      <circle cx="380" cy="180" r="3.5" fill="#0f172a"/>
    `;
  } else {
    // Campuran
    circuitContent = `
      <path d="M 60,135 L 60,60 L 120,60" fill="none" stroke="#1e293b" stroke-width="2.5"/>
      <path d="M 60,135 L 60,210 L 390,210 L 390,135" fill="none" stroke="#1e293b" stroke-width="2.5"/>
      ${drawBattery(60, 135)}

      ${drawSwitch(120, 60, 170, 'S₁', isS1Closed, 'S1')}
      <line x1="170" y1="60" x2="220" y2="60" stroke="#1e293b" stroke-width="2.5"/>
      ${drawBulb(235, 60, 'L₁', l1Lit, 'L1')}
      <line x1="250" y1="60" x2="280" y2="60" stroke="#1e293b" stroke-width="2.5"/>

      <circle cx="280" cy="60" r="3.5" fill="#0f172a"/>
      <path d="M 280,60 L 280,135" fill="none" stroke="#1e293b" stroke-width="2.5"/>

      <line x1="280" y1="60" x2="390" y2="60" stroke="#1e293b" stroke-width="2.5"/>
      ${drawBulb(335, 60, 'L₂', l2Lit, 'L2')}

      <line x1="280" y1="135" x2="390" y2="135" stroke="#1e293b" stroke-width="2.5"/>
      ${drawSwitch(295, 135, 335, 'S₂', isS2Closed, 'S2')}
      ${drawBulb(365, 135, 'L₃', l3Lit, 'L3')}

      <circle cx="390" cy="60" r="3.5" fill="#0f172a"/>
      <circle cx="390" cy="135" r="3.5" fill="#0f172a"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 260" width="460" height="260" style="background:#f8fafc; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="460" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">${modelTitle}</text>
  ${circuitContent}
  <text x="230" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Perhatikan komponen yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
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

export function renderTataSuryaSvg(params: any): string {
  const pointer = String(params.pointer || '3').toLowerCase();
  const labelChar = params.label || 'X';

  const planets = [
    { id: 'merkurius', num: 1, name: 'Merkurius', x: 80, r: 4.5, fill: '#94a3b8', stroke: '#64748b' },
    { id: 'venus', num: 2, name: 'Venus', x: 115, r: 7.5, fill: '#fbbf24', stroke: '#d97706' },
    { id: 'bumi', num: 3, name: 'Bumi', x: 160, r: 8, fill: '#38bdf8', stroke: '#0284c7', isBumi: true },
    { id: 'mars', num: 4, name: 'Mars', x: 205, r: 6, fill: '#ef4444', stroke: '#b91c1c' },
    { id: 'yupiter', num: 5, name: 'Yupiter', x: 280, r: 18, fill: '#d97706', stroke: '#b45309', isJup: true },
    { id: 'saturnus', num: 6, name: 'Saturnus', x: 360, r: 13, fill: '#fde047', stroke: '#ca8a04', isSat: true },
    { id: 'uranus', num: 7, name: 'Uranus', x: 430, r: 10, fill: '#67e8f9', stroke: '#06b6d4' },
    { id: 'neptunus', num: 8, name: 'Neptunus', x: 485, r: 9.5, fill: '#3b82f6', stroke: '#1d4ed8' }
  ];

  let targetIndex = 2; // Default Bumi (ke-3)
  planets.forEach((p, idx) => {
    if (pointer === String(p.num) || pointer === p.id || pointer === p.name.toLowerCase() || (pointer === 'jupiter' && p.id === 'yupiter')) {
      targetIndex = idx;
    }
  });

  const cy = 135;

  const starDots = [
    [50, 40], [90, 230], [140, 50], [190, 240], [230, 45],
    [260, 220], [310, 35], [370, 235], [420, 55], [470, 225], [510, 40]
  ].map(([sx, sy]) => `<circle cx="${sx}" cy="${sy}" r="1" fill="#ffffff" opacity="0.7"/>`).join('');

  const asteroids = [
    [236, 60], [242, 90], [238, 120], [244, 150], [237, 180], [243, 210]
  ].map(([ax, ay]) => `<circle cx="${ax}" cy="${ay}" r="1.5" fill="#64748b" opacity="0.75"/>`).join('');

  const renderedPlanets = planets.map((p, idx) => {
    const isTarget = idx === targetIndex;
    let planetGraphic = '';

    if (p.isBumi) {
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>
        <circle cx="${p.x - 2}" cy="${cy - 2}" r="3" fill="#22c55e" opacity="0.8"/>
        <circle cx="${p.x + 3}" cy="${cy + 2}" r="2.5" fill="#22c55e" opacity="0.8"/>
      `;
    } else if (p.isJup) {
      planetGraphic = `
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>
        <line x1="${p.x - 17}" y1="${cy - 6}" x2="${p.x + 17}" y2="${cy - 6}" stroke="#fef3c7" stroke-width="2" opacity="0.6"/>
        <line x1="${p.x - 17}" y1="${cy}" x2="${p.x + 17}" y2="${cy}" stroke="#78350f" stroke-width="2.5" opacity="0.7"/>
        <line x1="${p.x - 16}" y1="${cy + 7}" x2="${p.x + 16}" y2="${cy + 7}" stroke="#fef3c7" stroke-width="2" opacity="0.6"/>
        <ellipse cx="${p.x + 6}" cy="${cy + 7}" rx="3.5" ry="2" fill="#dc2626"/>
      `;
    } else if (p.isSat) {
      planetGraphic = `
        <ellipse cx="${p.x}" cy="${cy}" rx="25" ry="6" transform="rotate(-18 ${p.x} ${cy})" fill="none" stroke="#fef08a" stroke-width="3.5" opacity="0.9"/>
        <circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>
        <path d="M ${p.x - 22},${cy + 7} A 25 6 0 0 0 ${p.x + 22},${cy - 7}" transform="rotate(-18 ${p.x} ${cy})" fill="none" stroke="#fef08a" stroke-width="3.5" opacity="0.9"/>
      `;
    } else {
      planetGraphic = `<circle cx="${p.x}" cy="${cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>`;
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
      <path d="M ${p.x},35 A ${p.x * 2} 400 0 0 1 ${p.x},235" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3"/>
      ${planetGraphic}
      ${numberText}
      ${targetBadge}
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 270" width="520" height="270" style="background:#090d1a; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <radialGradient id="sunGlow" cx="20%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </radialGradient>
    <marker id="arrSurya" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f43f5e" />
    </marker>
  </defs>

  <rect width="520" height="270" fill="#090d1a" stroke="#334155" stroke-width="1.5" rx="6"/>
  ${starDots}
  ${asteroids}

  <text x="260" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#f8fafc">Diagram Sistem Tata Surya</text>

  <circle cx="0" cy="${cy}" r="52" fill="url(#sunGlow)"/>
  <text x="22" y="${cy + 4}" font-size="10" font-weight="bold" fill="#ffffff" opacity="0.9">Matahari</text>

  ${renderedPlanets}

  <text x="260" y="260" text-anchor="middle" font-size="10.5" font-weight="600" fill="#94a3b8">Perhatikan planet yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
</svg>`;
}

export function renderMagnetSvg(params: any): string {
  const interaksi = (params.interaksi || 'tarik').toLowerCase();
  const labelChar = params.label || 'X';
  const pointer = String(params.pointer || 'kanan2').toLowerCase();

  const isTarik = interaksi === 'tarik';
  const m2Kiri = isTarik ? 'U' : 'S';
  const m2Kanan = isTarik ? 'S' : 'U';

  const m1X = 45;
  const m1Y = 75;
  const m2X = 300;
  const m2Y = 75;
  const mw = 135;
  const mh = 56;
  const halfW = mw / 2;

  const isTargetM1Kiri = pointer === 'kiri1' || pointer === 'm1kiri';
  const isTargetM1Kanan = pointer === 'kanan1' || pointer === 'm1kanan';
  const isTargetM2Kiri = pointer === 'kiri2' || pointer === 'm2kiri';
  const isTargetM2Kanan = pointer === 'kanan2' || pointer === 'x' || pointer === 'm2kanan' || (!isTargetM1Kiri && !isTargetM1Kanan && !isTargetM2Kiri);

  const drawPoleBadge = (bx: number, by: number) => `
    <circle cx="${bx}" cy="${by}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${bx}" y="${by + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 230" width="480" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrMagR" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a" />
    </marker>
  </defs>

  <rect width="480" height="230" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Interaksi Gaya Magnet</text>

  <!-- MAGNET 1 (KIRI) -->
  <g>
    <rect x="${m1X}" y="${m1Y}" width="${halfW}" height="${mh}" fill="#ef4444" stroke="#991b1b" stroke-width="1.5" rx="3"/>
    ${isTargetM1Kiri ? drawPoleBadge(m1X + halfW / 2, m1Y + mh / 2) : `
      <text x="${m1X + halfW / 2}" y="${m1Y + mh / 2 + 6}" text-anchor="middle" font-size="18" font-weight="bold" fill="#ffffff">U</text>
    `}
    <rect x="${m1X + halfW}" y="${m1Y}" width="${halfW}" height="${mh}" fill="#3b82f6" stroke="#1e40af" stroke-width="1.5" rx="3"/>
    ${isTargetM1Kanan ? drawPoleBadge(m1X + halfW * 1.5, m1Y + mh / 2) : `
      <text x="${m1X + halfW * 1.5}" y="${m1Y + mh / 2 + 6}" text-anchor="middle" font-size="18" font-weight="bold" fill="#ffffff">S</text>
    `}
    <text x="${m1X + halfW}" y="${m1Y + mh + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Magnet 1</text>
  </g>

  <!-- INTERAKSI GAYA (TENGAH) -->
  <g>
    ${isTarik ? `
      <line x1="200" y1="${m1Y + mh / 2 - 8}" x2="235" y2="${m1Y + mh / 2 - 8}" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrMagR)"/>
      <line x1="280" y1="${m1Y + mh / 2 - 8}" x2="245" y2="${m1Y + mh / 2 - 8}" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrMagR)"/>
      <rect x="200" y="${m1Y + mh / 2 + 6}" width="80" height="20" rx="4" fill="#dcfce7"/>
      <text x="240" y="${m1Y + mh / 2 + 20}" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Tarik-Menarik</text>
    ` : `
      <line x1="225" y1="${m1Y + mh / 2 - 8}" x2="195" y2="${m1Y + mh / 2 - 8}" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrMagR)"/>
      <line x1="255" y1="${m1Y + mh / 2 - 8}" x2="285" y2="${m1Y + mh / 2 - 8}" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrMagR)"/>
      <rect x="200" y="${m1Y + mh / 2 + 6}" width="80" height="20" rx="4" fill="#fee2e2"/>
      <text x="240" y="${m1Y + mh / 2 + 20}" text-anchor="middle" font-size="10" font-weight="bold" fill="#b91c1c">Tolak-Menolak</text>
    `}
  </g>

  <!-- MAGNET 2 (KANAN) -->
  <g>
    <rect x="${m2X}" y="${m2Y}" width="${halfW}" height="${mh}" fill="${m2Kiri === 'U' ? '#ef4444' : '#3b82f6'}" stroke="#1e293b" stroke-width="1.5" rx="3"/>
    ${isTargetM2Kiri ? drawPoleBadge(m2X + halfW / 2, m2Y + mh / 2) : `
      <text x="${m2X + halfW / 2}" y="${m2Y + mh / 2 + 6}" text-anchor="middle" font-size="18" font-weight="bold" fill="#ffffff">${m2Kiri}</text>
    `}

    <rect x="${m2X + halfW}" y="${m2Y}" width="${halfW}" height="${mh}" fill="${m2Kanan === 'U' ? '#ef4444' : '#3b82f6'}" stroke="#1e293b" stroke-width="1.5" rx="3"/>
    ${isTargetM2Kanan ? drawPoleBadge(m2X + halfW * 1.5, m2Y + mh / 2) : `
      <text x="${m2X + halfW * 1.5}" y="${m2Y + mh / 2 + 6}" text-anchor="middle" font-size="18" font-weight="bold" fill="#ffffff">${m2Kanan}</text>
    `}
    <text x="${m2X + halfW}" y="${m2Y + mh + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Magnet 2</text>
  </g>

  <text x="240" y="215" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Perhatikan kutub magnet yang ditunjuk oleh huruf "${escapeXml(labelChar)}"!</text>
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
 * Render Sistem Peredaran Darah Manusia & Jantung 4 Ruang
 * Mendukung sirkulasi darah besar (sistemik), kecil (pulmonalis), dan anatomi jantung
 */
export function renderPeredaranDarahSvg(params: {
  pointer?: string;
  label?: string;
  jenis?: 'lengkap' | 'besar' | 'kecil' | 'jantung';
}): string {
  const pointer = (params.pointer || 'bilik_kiri').toLowerCase();
  const labelChar = params.label || 'X';

  const isTargetSerambiKanan = pointer.includes('serambi_kanan') || pointer.includes('atrium_kanan') || pointer === '1';
  const isTargetBilikKanan = pointer.includes('bilik_kanan') || pointer.includes('ventrikel_kanan') || pointer === '2';
  const isTargetSerambiKiri = pointer.includes('serambi_kiri') || pointer.includes('atrium_kiri') || pointer === '3';
  const isTargetParu = pointer.includes('paru');
  const isTargetTubuh = pointer.includes('tubuh');
  const isTargetAorta = pointer.includes('aorta');
  const isTargetVenaCava = pointer.includes('vena_cava') || pointer.includes('vena kava');
  const isTargetArteriPulmonalis = pointer.includes('arteri_pulmonalis');
  const isTargetVenaPulmonalis = pointer.includes('vena_pulmonalis');
  const isTargetBilikKiri = pointer.includes('bilik_kiri') || pointer.includes('ventrikel_kiri') || pointer === '4' || (!isTargetSerambiKanan && !isTargetBilikKanan && !isTargetSerambiKiri && !isTargetParu && !isTargetTubuh && !isTargetAorta && !isTargetVenaCava && !isTargetArteriPulmonalis && !isTargetVenaPulmonalis);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 350" width="440" height="350" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrBloodBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
    </marker>
    <marker id="arrBloodRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <!-- Border & Judul -->
  <rect width="440" height="350" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="220" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Skema Peredaran Darah Manusia</text>

  <!-- Paru-paru (Pulmo) Top -->
  <rect x="150" y="36" width="140" height="36" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/>
  ${isTargetParu ? `
    <circle cx="220" cy="54" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="220" y="58.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="220" y="58" text-anchor="middle" font-size="12" font-weight="bold" fill="#991b1b">Paru-Paru (Pulmo)</text>
  `}

  <!-- Pembuluh Darah: Loop Atas (Peredaran Darah Kecil) -->
  <!-- Bilik Kanan ke Paru-paru (Arteri Pulmonalis - Biru / CO2) -->
  <path d="M 155,165 C 100,165 90,85 150,54" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="6,2"/>
  <path d="M 120,110 L 120,105" marker-end="url(#arrBloodBlue)"/>

  <!-- Paru-paru ke Serambi Kiri (Vena Pulmonalis - Merah / O2) -->
  <path d="M 290,54 C 350,85 340,135 285,135" fill="none" stroke="#e11d48" stroke-width="3"/>
  <path d="M 325,95 L 325,100" marker-end="url(#arrBloodRed)"/>

  <!-- Jantung Utama (Cor) 4 Ruang -->
  <rect x="115" y="105" width="210" height="135" rx="14" fill="#f8fafc" stroke="#0f172a" stroke-width="2.5"/>
  <text x="220" y="100" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">JANTUNG</text>

  <!-- Pembatas Ruang Jantung -->
  <line x1="220" y1="105" x2="220" y2="240" stroke="#0f172a" stroke-width="2"/>
  <line x1="115" y1="172" x2="325" y2="172" stroke="#0f172a" stroke-width="2"/>

  <!-- Ruang 1: Serambi Kanan -->
  <rect x="120" y="110" width="95" height="58" rx="6" fill="#e0f2fe" fill-opacity="0.8"/>
  ${isTargetSerambiKanan ? `
    <circle cx="167" cy="139" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="167" y="143.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="167" y="136" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Serambi Kanan</text>
    <text x="167" y="152" text-anchor="middle" font-size="9" fill="#0284c7">(Kaya CO₂)</text>
  `}

  <!-- Ruang 2: Bilik Kanan -->
  <rect x="120" y="176" width="95" height="58" rx="6" fill="#bae6fd" fill-opacity="0.8"/>
  ${isTargetBilikKanan ? `
    <circle cx="167" cy="205" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="167" y="209.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="167" y="202" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Bilik Kanan</text>
    <text x="167" y="218" text-anchor="middle" font-size="9" fill="#0284c7">(Kaya CO₂)</text>
  `}

  <!-- Ruang 3: Serambi Kiri -->
  <rect x="225" y="110" width="95" height="58" rx="6" fill="#fee2e2" fill-opacity="0.8"/>
  ${isTargetSerambiKiri ? `
    <circle cx="272" cy="139" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="272" y="143.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="272" y="136" text-anchor="middle" font-size="11" font-weight="bold" fill="#be123c">Serambi Kiri</text>
    <text x="272" y="152" text-anchor="middle" font-size="9" fill="#e11d48">(Kaya O₂)</text>
  `}

  <!-- Ruang 4: Bilik Kiri -->
  <rect x="225" y="176" width="95" height="58" rx="6" fill="#fecaca" fill-opacity="0.8"/>
  ${isTargetBilikKiri ? `
    <circle cx="272" cy="205" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="272" y="209.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="272" y="202" text-anchor="middle" font-size="11" font-weight="bold" fill="#be123c">Bilik Kiri</text>
    <text x="272" y="218" text-anchor="middle" font-size="9" fill="#e11d48">(Kaya O₂)</text>
  `}

  <!-- Pembuluh Darah: Loop Bawah (Peredaran Darah Besar) -->
  <!-- Bilik Kiri ke Seluruh Tubuh (Aorta - Merah / O2) -->
  <path d="M 285,234 C 360,245 350,290 290,295" fill="none" stroke="#e11d48" stroke-width="3"/>
  <path d="M 330,265 L 330,270" marker-end="url(#arrBloodRed)"/>

  <!-- Seluruh Tubuh ke Serambi Kanan (Vena Cava - Biru / CO2) -->
  <path d="M 150,295 C 90,290 85,150 155,135" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="6,2"/>
  <path d="M 97,220 L 97,215" marker-end="url(#arrBloodBlue)"/>

  <!-- Seluruh Tubuh (Sistemik) Bottom -->
  <rect x="140" y="278" width="160" height="36" rx="8" fill="#f1f5f9" stroke="#475569" stroke-width="2"/>
  ${isTargetTubuh ? `
    <circle cx="220" cy="296" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="220" y="300.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="220" y="300" text-anchor="middle" font-size="12" font-weight="bold" fill="#334155">Seluruh Tubuh</text>
  `}

  <!-- Label Pembuluh Darah dengan Background Pill (Anti-Overlap) -->
  <g>
    <rect x="12" y="80" width="105" height="20" rx="4" fill="${isTargetArteriPulmonalis ? '#e11d48' : '#ffffff'}" stroke="${isTargetArteriPulmonalis ? '#e11d48' : '#0284c7'}" stroke-width="1.5"/>
    <text x="64" y="94" text-anchor="middle" font-size="${isTargetArteriPulmonalis ? '12' : '9.5'}" font-weight="bold" fill="${isTargetArteriPulmonalis ? '#ffffff' : '#0284c7'}">${isTargetArteriPulmonalis ? escapeXml(labelChar) : 'Arteri Pulmonalis'}</text>
  </g>
  <g>
    <rect x="323" y="80" width="105" height="20" rx="4" fill="${isTargetVenaPulmonalis ? '#e11d48' : '#ffffff'}" stroke="${isTargetVenaPulmonalis ? '#e11d48' : '#e11d48'}" stroke-width="1.5"/>
    <text x="375" y="94" text-anchor="middle" font-size="${isTargetVenaPulmonalis ? '12' : '9.5'}" font-weight="bold" fill="${isTargetVenaPulmonalis ? '#ffffff' : '#e11d48'}">${isTargetVenaPulmonalis ? escapeXml(labelChar) : 'Vena Pulmonalis'}</text>
  </g>
  <g>
    <rect x="330" y="240" width="70" height="20" rx="4" fill="${isTargetAorta ? '#e11d48' : '#ffffff'}" stroke="#e11d48" stroke-width="1.5"/>
    <text x="365" y="254" text-anchor="middle" font-size="${isTargetAorta ? '12' : '9.5'}" font-weight="bold" fill="${isTargetAorta ? '#ffffff' : '#e11d48'}">${isTargetAorta ? escapeXml(labelChar) : 'Aorta'}</text>
  </g>
  <g>
    <rect x="25" y="240" width="85" height="20" rx="4" fill="${isTargetVenaCava ? '#e11d48' : '#ffffff'}" stroke="${isTargetVenaCava ? '#e11d48' : '#0284c7'}" stroke-width="1.5"/>
    <text x="67" y="254" text-anchor="middle" font-size="${isTargetVenaCava ? '12' : '9.5'}" font-weight="bold" fill="${isTargetVenaCava ? '#ffffff' : '#0284c7'}">${isTargetVenaCava ? escapeXml(labelChar) : 'Vena Cava'}</text>
  </g>

  <!-- Keterangan Soal -->
  <text x="220" y="338" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
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
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </radialGradient>
    <linearGradient id="earthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>

  <rect width="480" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Skema Peristiwa Gerhana ${isMatahari ? 'Matahari' : 'Bulan'}</text>

  <!-- Kerucut Bayangan Penumbra (Abu-abu Terang) -->
  <polygon points="70,90 230,${130 + middleR} 440,${130 + rightR + 35} 440,${130 - rightR - 35} 230,${130 - middleR} 70,170" fill="#cbd5e1" fill-opacity="0.35"/>

  <!-- Kerucut Bayangan Umbra (Gelap / Pekat) -->
  <polygon points="70,90 230,${130 - middleR} 370,130 230,${130 + middleR} 70,170" fill="#334155" fill-opacity="0.5"/>
  ${!isMatahari ? `<polygon points="240,${130 - middleR} 440,${130 - 15} 440,${130 + 15} 240,${130 + middleR}" fill="#1e293b" fill-opacity="0.6"/>` : ''}

  <!-- Garis Berkas Cahaya Batas -->
  <line x1="70" y1="90" x2="440" y2="${130 + rightR + 35}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4"/>
  <line x1="70" y1="170" x2="440" y2="${130 - rightR - 35}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4"/>
  <line x1="70" y1="90" x2="370" y2="130" stroke="#d97706" stroke-width="1.2"/>
  <line x1="70" y1="170" x2="370" y2="130" stroke="#d97706" stroke-width="1.2"/>

  <!-- Matahari (Kiri) -->
  <circle cx="70" cy="130" r="40" fill="url(#sunGlow)" stroke="#b45309" stroke-width="2"/>
  <!-- Label Matahari -->
  <g>
    <rect x="35" y="45" width="70" height="20" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="1"/>
    <text x="70" y="59" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#b45309">Matahari</text>
  </g>

  <!-- Objek Tengah (Bulan pada Gerhana Matahari, Bumi pada Gerhana Bulan) -->
  <circle cx="230" cy="130" r="${middleR}" fill="${middleFill}" stroke="#0f172a" stroke-width="2"/>
  <!-- Label Objek Tengah (Atas) -->
  <g>
    <rect x="${230 - 32}" y="42" width="64" height="20" rx="4" fill="#ffffff" stroke="#475569" stroke-width="1"/>
    <text x="230" y="56" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#1e293b">${middleName}</text>
  </g>

  <!-- Objek Kanan (Bumi pada Gerhana Matahari, Bulan pada Gerhana Bulan) -->
  <circle cx="380" cy="130" r="${rightR}" fill="${rightFill}" stroke="#0f172a" stroke-width="2"/>
  <!-- Label Objek Kanan (Bawah Objek) -->
  <g>
    <rect x="${380 - 32}" y="175" width="64" height="20" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1"/>
    <text x="380" y="189" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">${rightName}</text>
  </g>

  <!-- Callout Label Zona Bayangan (Zona Berbeda Tanpa Tabrakan) -->
  <g>
    <rect x="275" y="210" width="75" height="20" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1"/>
    <text x="312.5" y="224" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#334155">1. Umbra</text>
  </g>
  <g>
    <rect x="300" y="42" width="85" height="20" rx="4" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
    <text x="342.5" y="56" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#64748b">2. Penumbra</text>
  </g>

  <!-- Target Badge X (Kontras Tinggi) -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Keterangan Bawah -->
  <text x="240" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Daerah bayangan yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
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

    let target = isTetap ? { x: 210, y: 65 } : { x: 210, y: 140 };
    if (pointer.includes('beban')) target = { x: 210, y: 195 };
    else if (pointer.includes('kuasa') || pointer.includes('tali')) target = { x: 270, y: 130 };

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
    <defs>
      <marker id="arrForce" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
      </marker>
    </defs>
    <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
    <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pesawat Sederhana: Katrol ${isTetap ? 'Tetap' : 'Bebas'}</text>

    <!-- Langit-langit (Gantungan) -->
    <rect x="130" y="38" width="120" height="12" fill="#64748b" rx="2"/>
    <line x1="140" y1="38" x2="130" y2="28" stroke="#475569" stroke-width="1.5"/>
    <line x1="170" y1="38" x2="160" y2="28" stroke="#475569" stroke-width="1.5"/>
    <line x1="200" y1="38" x2="190" y2="28" stroke="#475569" stroke-width="1.5"/>
    <line x1="230" y1="38" x2="220" y2="28" stroke="#475569" stroke-width="1.5"/>

    ${isTetap ? `
      <!-- Gantungan poros katrol tetap -->
      <line x1="190" y1="50" x2="190" y2="85" stroke="#0f172a" stroke-width="3"/>
      <!-- Roda Katrol -->
      <circle cx="190" cy="85" r="30" fill="#f1f5f9" stroke="#0f172a" stroke-width="3"/>
      <circle cx="190" cy="85" r="5" fill="#0f172a"/>
      <!-- Tali Kiri (ke Beban) -->
      <line x1="160" y1="85" x2="160" y2="165" stroke="#334155" stroke-width="2.5"/>
      <!-- Beban Kotak W -->
      <rect x="138" y="165" width="44" height="40" rx="4" fill="#cbd5e1" stroke="#0f172a" stroke-width="2"/>
      <text x="160" y="189" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">W</text>
      <!-- Tali Kanan (Kuasa F) -->
      <line x1="220" y1="85" x2="220" y2="155" stroke="#334155" stroke-width="2.5"/>
      <line x1="220" y1="155" x2="220" y2="185" stroke="#dc2626" stroke-width="3" marker-end="url(#arrForce)"/>
      <text x="235" y="185" font-size="12" font-weight="bold" fill="#dc2626">F (Kuasa)</text>
    ` : `
      <!-- Tali Tetap Tergantung di Langit-langit -->
      <line x1="160" y1="50" x2="160" y2="125" stroke="#334155" stroke-width="2.5"/>
      <!-- Roda Katrol Bebas -->
      <circle cx="190" cy="125" r="30" fill="#f1f5f9" stroke="#0f172a" stroke-width="3"/>
      <circle cx="190" cy="125" r="5" fill="#0f172a"/>
      <!-- Gantungan Beban dari Poros Katrol -->
      <line x1="190" y1="130" x2="190" y2="165" stroke="#0f172a" stroke-width="3"/>
      <rect x="168" y="165" width="44" height="40" rx="4" fill="#cbd5e1" stroke="#0f172a" stroke-width="2"/>
      <text x="190" y="189" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">W</text>
      <!-- Tali Kanan Ditarik ke Atas -->
      <line x1="220" y1="125" x2="220" y2="70" stroke="#dc2626" stroke-width="3" marker-end="url(#arrForce)"/>
      <text x="235" y="75" font-size="12" font-weight="bold" fill="#dc2626">F (Kuasa)</text>
    `}

    <!-- Target Badge X -->
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

    <text x="190" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Titik/bagian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
  </svg>`;
  }

  // Default: Tuas / Pengungkit
  const tipeTuas = params.tipeTuas || 1;
  // Tuas Jenis 1: Beban - Tumpu - Kuasa
  // Tuas Jenis 2: Tumpu - Beban - Kuasa
  // Tuas Jenis 3: Tumpu - Kuasa - Beban

  let tumpuX = 190;
  let bebanX = 90;
  let kuasaX = 320;
  let kuasaDir = 'down'; // panah ke bawah

  if (tipeTuas === 2) {
    tumpuX = 70;
    bebanX = 180;
    kuasaX = 330;
    kuasaDir = 'up';
  } else if (tipeTuas === 3) {
    tumpuX = 70;
    kuasaX = 180;
    bebanX = 320;
    kuasaDir = 'up';
  }

  let target = { x: tumpuX, y: 155 };
  if (pointer.includes('beban')) target = { x: bebanX, y: 95 };
  else if (pointer.includes('kuasa')) target = { x: kuasaX, y: 95 };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" width="420" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrForceTuas" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
    </marker>
  </defs>

  <rect width="420" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pesawat Sederhana: Tuas / Pengungkit (Jenis ${tipeTuas})</text>

  <!-- Garis Tanah / Landasan -->
  <line x1="30" y1="180" x2="390" y2="180" stroke="#94a3b8" stroke-width="2"/>

  <!-- Batang Tuas Horizontal -->
  <rect x="50" y="132" width="320" height="12" rx="3" fill="#475569" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik Tumpu (Segitiga) -->
  <polygon points="${tumpuX},144 ${tumpuX - 18},180 ${tumpuX + 18},180" fill="#0284c7" stroke="#0f172a" stroke-width="2"/>
  <text x="${tumpuX}" y="200" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">Titik Tumpu</text>

  <!-- Beban (Kotak W) -->
  <rect x="${bebanX - 22}" y="92" width="44" height="40" rx="4" fill="#cbd5e1" stroke="#0f172a" stroke-width="2"/>
  <text x="${bebanX}" y="116" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">W</text>
  <text x="${bebanX}" y="82" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">Beban</text>

  <!-- Kuasa (Panah F) -->
  ${kuasaDir === 'down' ? `
    <line x1="${kuasaX}" y1="80" x2="${kuasaX}" y2="128" stroke="#dc2626" stroke-width="3" marker-end="url(#arrForceTuas)"/>
    <text x="${kuasaX}" y="72" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Kuasa (F)</text>
  ` : `
    <line x1="${kuasaX}" y1="144" x2="${kuasaX}" y2="92" stroke="#dc2626" stroke-width="3" marker-end="url(#arrForceTuas)"/>
    <text x="${kuasaX}" y="82" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Kuasa (F)</text>
  `}

  <!-- Target Badge X -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="210" y="236" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * Render Pancaindra (Anatomi Penampang Mata & Telinga Manusia)
 */
export function renderPancaindraSvg(params: {
  organ?: 'mata' | 'telinga';
  pointer?: string;
  label?: string;
}): string {
  const organ = (params.organ || 'mata').toLowerCase();
  const labelChar = params.label || 'X';
  const pointer = (params.pointer || 'kornea').toLowerCase();

  if (organ === 'telinga') {
    let target = { x: 195, y: 135, name: 'Gendang Telinga' };
    if (pointer.includes('koklea') || pointer.includes('siput')) target = { x: 280, y: 130 };
    else if (pointer.includes('saluran') || pointer.includes('liang')) target = { x: 125, y: 135 };
    else if (pointer.includes('daun')) target = { x: 55, y: 130 };
    else if (pointer.includes('tulang') || pointer.includes('martil')) target = { x: 230, y: 120 };
    else if (pointer.includes('eustachius')) target = { x: 275, y: 185 };

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 260" width="440" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
    <rect width="440" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
    <text x="220" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Anatomi Bagian Indra Pendengaran (Telinga)</text>

    <!-- Daun Telinga (Kiri Luar) -->
    <path d="M 60,70 C 20,80 20,180 55,200 C 65,205 75,190 70,175 C 65,150 45,140 50,110 C 55,80 75,70 60,70 Z" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>

    <!-- Saluran Telinga Luar (Liang Telinga) -->
    <path d="M 65,120 L 190,125 L 190,145 L 65,150 Z" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5"/>

    <!-- Gendang Telinga (Membran Timpani) -->
    <line x1="190" y1="115" x2="195" y2="155" stroke="#dc2626" stroke-width="3.5"/>

    <!-- Rongga Telinga Tengah & Tulang Pendengaran -->
    <ellipse cx="230" cy="130" rx="30" ry="25" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
    <circle cx="215" cy="125" r="5" fill="#78350f"/>
    <line x1="215" y1="125" x2="230" y2="120" stroke="#78350f" stroke-width="2.5"/>
    <circle cx="230" cy="120" r="4" fill="#78350f"/>
    <line x1="230" y1="120" x2="245" y2="128" stroke="#78350f" stroke-width="2.5"/>

    <!-- Telinga Dalam: Koklea (Rumah Siput) -->
    <path d="M 265,125 C 265,105 295,105 295,125 C 295,140 275,145 275,135 C 275,128 288,128 288,135" fill="none" stroke="#7c3aed" stroke-width="3"/>
    <circle cx="282" cy="132" r="14" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/>

    <!-- Saluran Eustachius (Bawah) -->
    <path d="M 240,150 L 275,200 L 290,195 L 255,148 Z" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>

    <!-- Callouts Label Rapi dengan Latar Belakang (Anti-Overlap) -->
    <g>
      <rect x="15" y="42" width="85" height="18" rx="4" fill="#ffffff" stroke="#c2410c" stroke-width="1"/>
      <text x="57.5" y="55" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#c2410c">Daun Telinga</text>
      <line x1="57" y1="60" x2="57" y2="72" stroke="#c2410c" stroke-width="1"/>
    </g>
    <g>
      <rect x="145" y="80" width="95" height="18" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="1"/>
      <text x="192.5" y="93" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#dc2626">Gendang Telinga</text>
      <line x1="192" y1="98" x2="192" y2="114" stroke="#dc2626" stroke-width="1"/>
    </g>
    <g>
      <rect x="250" y="70" width="115" height="18" rx="4" fill="#ffffff" stroke="#7c3aed" stroke-width="1"/>
      <text x="307.5" y="83" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#7c3aed">Koklea (Rumah Siput)</text>
      <line x1="290" y1="88" x2="282" y2="118" stroke="#7c3aed" stroke-width="1"/>
    </g>
    <g>
      <rect x="240" y="210" width="105" height="18" rx="4" fill="#ffffff" stroke="#b91c1c" stroke-width="1"/>
      <text x="292.5" y="223" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b91c1c">Saluran Eustachius</text>
    </g>

    <!-- Target Badge X -->
    <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

    <text x="220" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian indra pendengaran yang ditunjuk huruf "${escapeXml(labelChar)}" adalah ...</text>
  </svg>`;
  }

  // Default: Mata Manusia
  let target = { x: 135, y: 135, name: 'Kornea' };
  if (pointer.includes('pupil')) target = { x: 165, y: 135 };
  else if (pointer.includes('lensa')) target = { x: 195, y: 135 };
  else if (pointer.includes('retina')) target = { x: 295, y: 135 };
  else if (pointer.includes('saraf')) target = { x: 345, y: 135 };
  else if (pointer.includes('iris')) target = { x: 175, y: 105 };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 260" width="450" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <radialGradient id="lensGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </radialGradient>
  </defs>

  <rect width="450" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="225" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Anatomi Penampang Bola Mata Manusia</text>

  <!-- Bola Mata Utama (Sclera) -->
  <circle cx="235" cy="135" r="75" fill="#f8fafc" stroke="#0f172a" stroke-width="2.5"/>

  <!-- Lapisan Retina (Kuning Emas di Bagian Belakang Dalam) -->
  <path d="M 235,62 A 73 73 0 0 1 306,135 A 73 73 0 0 1 235,208" fill="none" stroke="#f59e0b" stroke-width="5"/>

  <!-- Saraf Optik (Kanan Keluar) -->
  <path d="M 306,125 L 360,120 L 360,150 L 306,145 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>

  <!-- Tonjolan Kornea (Kiri Luar) -->
  <path d="M 180,78 C 120,95 120,175 180,192" fill="#bae6fd" fill-opacity="0.4" stroke="#0284c7" stroke-width="2.5"/>

  <!-- Iris (Atas & Bawah) -->
  <line x1="175" y1="88" x2="182" y2="118" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
  <line x1="175" y1="182" x2="182" y2="152" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>

  <!-- Pupil (Celah Antara Iris) -->
  <line x1="182" y1="118" x2="182" y2="152" stroke="#0f172a" stroke-width="2" stroke-dasharray="2,2"/>

  <!-- Lensa Kristalin (Biconvex) -->
  <ellipse cx="195" cy="135" rx="10" ry="26" fill="url(#lensGrad)" stroke="#0284c7" stroke-width="2"/>

  <!-- Callouts Label Rapi dengan Latar Belakang (Anti-Overlap) -->
  <g>
    <rect x="25" y="60" width="65" height="18" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1"/>
    <text x="57.5" y="73" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0369a1">1. Kornea</text>
    <line x1="90" y1="69" x2="140" y2="115" stroke="#0284c7" stroke-width="1"/>
  </g>
  <g>
    <rect x="115" y="42" width="55" height="18" rx="4" fill="#ffffff" stroke="#78350f" stroke-width="1"/>
    <text x="142.5" y="55" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#78350f">2. Iris</text>
    <line x1="142" y1="60" x2="178" y2="100" stroke="#78350f" stroke-width="1"/>
  </g>
  <g>
    <rect x="185" y="42" width="60" height="18" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1"/>
    <text x="215" y="55" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#0284c7">3. Lensa</text>
    <line x1="210" y1="60" x2="198" y2="110" stroke="#0284c7" stroke-width="1"/>
  </g>
  <g>
    <rect x="315" y="42" width="60" height="18" rx="4" fill="#ffffff" stroke="#f59e0b" stroke-width="1"/>
    <text x="345" y="55" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#b45309">4. Retina</text>
    <line x1="330" y1="60" x2="295" y2="110" stroke="#f59e0b" stroke-width="1"/>
  </g>
  <g>
    <rect x="350" y="180" width="85" height="18" rx="4" fill="#ffffff" stroke="#ea580c" stroke-width="1"/>
    <text x="392.5" y="193" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#c2410c">5. Saraf Optik</text>
    <line x1="355" y1="180" x2="335" y2="148" stroke="#ea580c" stroke-width="1"/>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="225" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian bola mata yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}
