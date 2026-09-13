/**
 * science-anatomy.ts
 * Human Anatomy & Organ Systems SVG Visual Stimulus Renderers (13 Templates)
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

/** 1. Render Sistem Rangka Manusia */
export function renderRangkaManusiaSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'tengkorak').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 190, y: 55, name: 'Tulang Tengkorak' };
  if (pointer.includes('rusuk') || pointer.includes('dada')) target = { x: 190, y: 110, name: 'Tulang Rusuk / Dada' };
  else if (pointer.includes('belakang') || pointer.includes('punggung') || pointer.includes('vertebra')) target = { x: 190, y: 140, name: 'Tulang Belakang' };
  else if (pointer.includes('lengan') || pointer.includes('humerus')) target = { x: 135, y: 118, name: 'Tulang Lengan Atas' };
  else if (pointer.includes('panggul') || pointer.includes('pinggul') || pointer.includes('pelvis')) target = { x: 190, y: 165, name: 'Tulang Panggul' };
  else if (pointer.includes('paha') || pointer.includes('femur')) target = { x: 168, y: 198, name: 'Tulang Paha' };
  else if (pointer.includes('kering') || pointer.includes('betis') || pointer.includes('tibia')) target = { x: 168, y: 236, name: 'Tulang Kering / Betis' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 280" width="380" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>

  <text x="190" y="20" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Sistem Rangka Tubuh Manusia</text>

  <!-- Siluet Rangka Anatomi Sederhana Bersih -->
  <!-- Tengkorak -->
  <ellipse cx="190" cy="55" rx="20" ry="22" fill="url(#boneGrad)" stroke="#64748b" stroke-width="1.8"/>
  <circle cx="183" cy="52" r="3.5" fill="#94a3b8"/>
  <circle cx="197" cy="52" r="3.5" fill="#94a3b8"/>
  <path d="M 183,67 Q 190,70 197,67" stroke="#64748b" stroke-width="1.5" fill="none"/>

  <!-- Leher & Tulang Belakang -->
  <line x1="190" y1="77" x2="190" y2="165" stroke="#475569" stroke-width="4.5" stroke-linecap="round"/>

  <!-- Bahu (Klavikula) -->
  <line x1="150" y1="90" x2="230" y2="90" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>

  <!-- Sangkar Rusuk -->
  <ellipse cx="190" cy="115" rx="28" ry="24" fill="none" stroke="#64748b" stroke-width="2"/>
  <path d="M 164,105 Q 190,112 216,105 M 162,115 Q 190,122 218,115 M 166,125 Q 190,132 214,125" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <line x1="190" y1="95" x2="190" y2="135" stroke="#334155" stroke-width="3"/>

  <!-- Lengan Kiri & Kanan -->
  <line x1="150" y1="90" x2="132" y2="128" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
  <line x1="132" y1="128" x2="120" y2="162" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="230" y1="90" x2="248" y2="128" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
  <line x1="248" y1="128" x2="260" y2="162" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Tulang Panggul -->
  <path d="M 168,160 Q 190,175 212,160 L 206,176 Q 190,182 174,176 Z" fill="url(#boneGrad)" stroke="#475569" stroke-width="2"/>

  <!-- Tungkai Kaki Kiri & Kanan -->
  <line x1="175" y1="176" x2="168" y2="215" stroke="#64748b" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="168" cy="216" r="3.5" fill="#94a3b8"/>
  <line x1="168" y1="218" x2="166" y2="250" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>

  <line x1="205" y1="176" x2="212" y2="215" stroke="#64748b" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="212" cy="216" r="3.5" fill="#94a3b8"/>
  <line x1="212" y1="218" x2="214" y2="250" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>

  <!-- Callout Labels Kiri (Anti-Overlap) -->
  <g>
    <rect x="14" y="45" width="86" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="57" y="58" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Tengkorak</text>
    <line x1="100" y1="54" x2="170" y2="55" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <g>
    <rect x="14" y="105" width="86" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="57" y="118" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Lengan Atas</text>
    <line x1="100" y1="114" x2="135" y2="118" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <g>
    <rect x="14" y="195" width="86" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="57" y="208" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Tulang Paha</text>
    <line x1="100" y1="204" x2="168" y2="200" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>

  <!-- Callout Labels Kanan (Anti-Overlap) -->
  <g>
    <rect x="280" y="105" width="86" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="323" y="118" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Tulang Rusuk</text>
    <line x1="280" y1="114" x2="218" y2="115" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <g>
    <rect x="280" y="155" width="86" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="323" y="168" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Tulang Panggul</text>
    <line x1="280" y1="164" x2="208" y2="168" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <g>
    <rect x="280" y="230" width="86" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="323" y="243" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Kering &amp; Betis</text>
    <line x1="280" y1="239" x2="214" y2="240" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="190" y="270" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian rangka yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 2. Render Macam-Macam Sendi Gerak (Diartrosis) */
export function renderSendiGerakSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'engsel').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Engsel, 1: Peluru, 2: Putar, 3: Pelana
  if (pointer.includes('peluru') || pointer.includes('bahu')) activeIdx = 1;
  else if (pointer.includes('putar') || pointer.includes('leher') || pointer.includes('atlas')) activeIdx = 2;
  else if (pointer.includes('pelana') || pointer.includes('ibu jari') || pointer.includes('jempol')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, title: 'Sendi Engsel', desc: 'Gerak 1 Arah (Siku & Lutut)' },
    { x: 205, y: 42, title: 'Sendi Peluru', desc: 'Segala Arah (Bahu & Gelang Panggul)' },
    { x: 15, y: 145, title: 'Sendi Putar', desc: 'Gerak Berputar (Leher & Tengkorak)' },
    { x: 205, y: 145, title: 'Sendi Pelana', desc: 'Gerak 2 Arah (Pangkal Ibu Jari)' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Macam-Macam Sendi Gerak (Diartrosis)</text>

  <!-- Panel 1: Sendi Engsel -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="26" y="58" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Sendi Engsel` : 'Sendi Engsel'}</text>
  <!-- Ilustrasi Engsel -->
  <rect x="35" y="70" width="22" height="42" rx="3" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="57" cy="91" r="5" fill="#0284c7"/>
  <path d="M 57,91 L 82,75" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
  <path d="M 80,72 Q 88,85 82,98" fill="none" stroke="#e11d48" stroke-width="1.8" marker-end="url(#arr)" stroke-dasharray="2 2"/>
  <text x="105" y="85" font-size="9" font-weight="600" fill="#475569">1 Arah</text>
  <text x="105" y="100" font-size="8.5" fill="#64748b">(Siku/Lutut)</text>

  <!-- Panel 2: Sendi Peluru -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="216" y="58" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Sendi Peluru` : 'Sendi Peluru'}</text>
  <!-- Ilustrasi Peluru -->
  <path d="M 235,70 C 255,70 255,108 235,108 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="248" cy="89" r="10" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="258" y1="89" x2="280" y2="89" stroke="#64748b" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M 270,77 A 14 14 0 1 1 270,101" fill="none" stroke="#e11d48" stroke-width="1.8"/>
  <text x="295" y="85" font-size="9" font-weight="600" fill="#475569">Segala Arah</text>
  <text x="295" y="100" font-size="8.5" fill="#64748b">(Bahu/Paha)</text>

  <!-- Panel 3: Sendi Putar -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="26" y="161" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Sendi Putar` : 'Sendi Putar'}</text>
  <!-- Ilustrasi Putar -->
  <ellipse cx="60" cy="185" rx="16" ry="8" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="60" cy="185" r="5" fill="#0284c7"/>
  <path d="M 60,185 L 60,215" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  <path d="M 45,188 A 18 10 0 1 0 75,188" fill="none" stroke="#e11d48" stroke-width="1.8"/>
  <text x="95" y="188" font-size="9" font-weight="600" fill="#475569">Memutar</text>
  <text x="95" y="203" font-size="8.5" fill="#64748b">(Tengkorak/Leher)</text>

  <!-- Panel 4: Sendi Pelana -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="216" y="161" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Sendi Pelana` : 'Sendi Pelana'}</text>
  <!-- Ilustrasi Pelana -->
  <path d="M 235,190 Q 250,175 265,190 L 265,210 Q 250,195 235,210 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="250" cy="188" r="4.5" fill="#0284c7"/>
  <path d="M 240,178 Q 250,172 260,178 M 240,220 Q 250,226 260,220" fill="none" stroke="#e11d48" stroke-width="1.6"/>
  <text x="285" y="188" font-size="9" font-weight="600" fill="#475569">2 Arah</text>
  <text x="285" y="203" font-size="8.5" fill="#64748b">(Pangkal Ibu Jari)</text>

  <!-- Badge X jika target aktif -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Jenis persendian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// 9. Alat Ekskresi Ginjal Manusia
export function renderAlatEkskresiGinjalSvg(params: any): string {
  const pointer = String(params.bagian || params.pointer || 'korteks').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'korteks', name: 'Korteks Ginjal (Penyaringan)', x: 110, y: 70 },
    { id: 'medula', name: 'Medula (Piramida Ginjal)', x: 170, y: 105 },
    { id: 'pelvis', name: 'Pelvis Renalis (Rongga Ginjal)', x: 220, y: 115 },
    { id: 'ureter', name: 'Saluran Ureter (Ke Kandung Kemih)', x: 245, y: 175 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 230" width="380" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="230" fill="#fff1f2" stroke="#fecdd3" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#881337">Struktur Anatomi Ginjal Manusia</text>

  <!-- Bentuk Ginjal (Kacang Merah) -->
  <path d="M 130 45 C 70 65, 60 160, 130 185 C 180 195, 200 165, 185 140 C 170 115, 175 90, 195 70 C 180 50, 160 40, 130 45 Z" fill="#e11d48" stroke="#9f1239" stroke-width="2.5"/>

  <!-- Medula Piramida Segitiga di Dalam -->
  <polygon points="120,75 140,85 125,95" fill="#f43f5e" stroke="#be123c" stroke-width="1"/>
  <polygon points="115,105 135,115 118,125" fill="#f43f5e" stroke="#be123c" stroke-width="1"/>
  <polygon points="125,135 145,140 130,155" fill="#f43f5e" stroke="#be123c" stroke-width="1"/>

  <!-- Ureter Saluran Urine ke Bawah -->
  <path d="M 180 140 Q 195 165 210 200 Q 218 200 205 165 Q 192 135 185 130" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#0f172a" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="190" y="218" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Bagian ginjal yang bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 11. Indra Pengecap Lidah (Peta Rasa)
export function renderIndraPengecapLidahSvg(params: any): string {
  const pointer = String(params.rasa || params.pointer || 'manis').toLowerCase();
  const labelChar = params.label || 'X';

  const regions = [
    { id: 'pahit', name: 'Pahit', x: 170, y: 70 },
    { id: 'asam', name: 'Asam', x: 105, y: 110 },
    { id: 'asin', name: 'Asin', x: 115, y: 150 },
    { id: 'manis', name: 'Manis', x: 170, y: 175 }
  ];

  let target = regions.find(r => pointer.includes(r.id)) || regions[3];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 230" width="340" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="340" height="230" fill="#fff5f5" stroke="#fed7d7" stroke-width="1.5" rx="8"/>
  <text x="170" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#9b2c2c">Peta Daerah Rasa pada Lidah</text>

  <!-- Bentuk Lidah -->
  <path d="M 120 50 C 120 30, 220 30, 220 50 C 240 100, 230 180, 170 200 C 110 180, 100 100, 120 50 Z" fill="#feb2b2" stroke="#e53e3e" stroke-width="2.5"/>

  <!-- Garis Tengah Lidah -->
  <line x1="170" y1="55" x2="170" y2="165" stroke="#e53e3e" stroke-width="1.5" stroke-dasharray="3,3"/>

  <!-- Daerah Pahit (Pangkal Belakang) -->
  <ellipse cx="170" cy="65" rx="35" ry="12" fill="#9b2c2c25" stroke="#9b2c2c" stroke-width="1"/>

  <!-- Daerah Asam (Tepi Kiri & Kanan) -->
  <ellipse cx="125" cy="110" rx="14" ry="18" fill="#dd6b2025" stroke="#dd6b20" stroke-width="1"/>
  <ellipse cx="215" cy="110" rx="14" ry="18" fill="#dd6b2025" stroke="#dd6b20" stroke-width="1"/>

  <!-- Daerah Asin (Tepi Depan Kiri & Kanan) -->
  <ellipse cx="135" cy="150" rx="12" ry="14" fill="#3182ce25" stroke="#3182ce" stroke-width="1"/>
  <ellipse cx="205" cy="150" rx="12" ry="14" fill="#3182ce25" stroke="#3182ce" stroke-width="1"/>

  <!-- Daerah Manis (Ujung Depan Lidah) -->
  <ellipse cx="170" cy="180" rx="22" ry="12" fill="#38a16925" stroke="#38a169" stroke-width="1"/>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="170" y="220" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Sensasi rasa yang paling peka pada huruf "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 12. Indra Pembau Hidung (Anatomi Olfaktori)
export function renderIndraPembauHidungSvg(params: any): string {
  const pointer = String(params.bagian || params.pointer || 'saraf_olfaktori').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'rongga_hidung', name: 'Rongga Hidung', x: 130, y: 155 },
    { id: 'silia', name: 'Silia Reseptor Bau', x: 160, y: 110 },
    { id: 'saraf_olfaktori', name: 'Saraf Olfaktori (Ke Otak)', x: 175, y: 65 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" width="340" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="340" height="220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="170" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Anatomi Organ Pembau (Hidung)</text>

  <!-- Profil Hidung Samping -->
  <path d="M 60 50 L 90 120 L 70 170 Q 110 180 130 160 Q 180 180 240 170" fill="none" stroke="#475569" stroke-width="2.5"/>

  <!-- Rongga Hidung Interior -->
  <path d="M 90 120 Q 130 125 180 135 Q 180 85 140 85 Z" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5"/>

  <!-- Bulbus Olfaktori & Saraf Kuning -->
  <ellipse cx="160" cy="75" rx="28" ry="10" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8"/>
  <!-- Serabut Saraf ke Rongga Hidung -->
  <line x1="145" y1="85" x2="145" y2="105" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="160" y1="85" x2="160" y2="105" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="175" y1="85" x2="175" y2="105" stroke="#ca8a04" stroke-width="1.5"/>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="170" y="204" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Bagian indra pembau bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}
