/**
 * science-anatomy.ts
 * Human Anatomy & Organ Systems SVG Visual Stimulus Renderers (13 Templates)
 */

import {
  escapeXml,
  AlatEkskresiGinjalParams,
  IndraPengecapLidahParams,
  IndraPembauHidungParams
} from './types';

/** Render Organ Pernapasan Manusia dengan Siluet Torso Anatomis & Inset Alveolus (Enterprise Textbook Grade) */
export function renderOrganPernapasanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'trakea').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 310, y: 172, name: 'Trakea (Tenggorokan)', side: 'right' };
  let isTarget = {
    hidung: false,
    faring: false,
    trakea: false,
    bronkus: false,
    paru: false,
    alveolus: false,
    diafragma: false
  };

  if (pointer.includes('hidung') || pointer.includes('rongga')) {
    target = { x: 300, y: 78, name: 'Rongga Hidung', side: 'left' };
    isTarget.hidung = true;
  } else if (pointer.includes('laring') || pointer.includes('faring') || pointer.includes('pangkal')) {
    target = { x: 310, y: 122, name: 'Faring & Laring', side: 'left' };
    isTarget.faring = true;
  } else if (pointer.includes('bronkus') || pointer.includes('cabang')) {
    target = { x: 275, y: 220, name: 'Bronkus', side: 'left' };
    isTarget.bronkus = true;
  } else if (pointer.includes('alveolus')) {
    target = { x: 575, y: 225, name: 'Alveolus (Kantung Udara)', side: 'right' };
    isTarget.alveolus = true;
  } else if (pointer.includes('paru') || pointer.includes('pulmo') || pointer.includes('lobus')) {
    target = { x: 380, y: 255, name: 'Paru-Paru (Pulmo)', side: 'right' };
    isTarget.paru = true;
  } else if (pointer.includes('diafragma') || pointer.includes('sekat')) {
    target = { x: 310, y: 352, name: 'Diafragma (Sekat Rongga Dada)', side: 'left' };
    isTarget.diafragma = true;
  } else {
    // Default Trakea
    isTarget.trakea = true;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" width="100%" height="100%" style="background:#f8fafc; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <defs>
    <!-- Gradien Torso Tubuh -->
    <linearGradient id="respTorsoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>

    <!-- Gradien Paru-Paru -->
    <linearGradient id="lungGradR" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fecdd3"/>
      <stop offset="60%" stop-color="#fda4af"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
    <linearGradient id="lungGradL" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fecdd3"/>
      <stop offset="60%" stop-color="#fda4af"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>

    <!-- Gradien Trakea -->
    <linearGradient id="tracheaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>

    <!-- Filter Shadow & Glow -->
    <filter id="respGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
    <filter id="respCardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>

    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <!-- Background Canvas Card -->
  <rect x="2" y="2" width="696" height="436" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

  <!-- Header Banner -->
  <rect x="2" y="2" width="696" height="46" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="24" y="14" width="6" height="22" rx="3" fill="#0284c7"/>
  <text x="40" y="30" font-size="16" font-weight="800" fill="#0f172a" letter-spacing="0.3">Sistem Pernapasan Manusia</text>
  <text x="325" y="30" font-size="12" font-weight="600" fill="#64748b">(Saluran Pernapasan, Paru-Paru &amp; Inset Alveolus)</text>

  <!-- KONTUR SILUET KEPALA, LEHER & TORSO DADA -->
  <g opacity="0.95">
    <!-- Profil Kepala & Leher Manusia -->
    <path d="M 290,52 C 270,52 265,65 265,78 C 265,90 275,100 282,108 L 282,130 C 250,136 195,155 178,190 C 168,215 168,260 172,320 C 174,355 185,385 195,405 L 425,405 C 435,385 446,355 448,320 C 452,260 452,215 442,190 C 425,155 370,136 338,130 L 338,108 C 345,100 355,90 355,78 C 355,65 350,52 330,52 Z" fill="url(#respTorsoGrad)" stroke="#cbd5e1" stroke-width="1.8"/>
    <!-- Bayangan Klavikula & Tulang Dada (Sternum) -->
    <path d="M 220,154 Q 280,146 310,146 Q 340,146 400,154" fill="none" stroke="#e2e8f0" stroke-width="2"/>
    <line x1="310" y1="146" x2="310" y2="280" stroke="#f1f5f9" stroke-width="6" stroke-linecap="round"/>
    <!-- Lengkung Tulang Rusuk (Costa) -->
    <path d="M 210,195 Q 260,205 285,215 M 410,195 Q 360,205 335,215" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3,3"/>
    <path d="M 205,235 Q 260,245 285,255 M 415,235 Q 360,245 335,255" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3,3"/>
    <path d="M 205,275 Q 260,285 285,295 M 415,275 Q 360,285 335,295" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3,3"/>
  </g>

  <!-- 1. RONGGA HIDUNG (Nasal Cavity dengan Fosil Konka) -->
  <g id="organ_hidung">
    <ellipse cx="300" cy="76" rx="14" ry="9" fill="${isTarget.hidung ? '#fed7aa' : '#ffedd5'}" stroke="${isTarget.hidung ? '#ea580c' : '#fdba74'}" stroke-width="${isTarget.hidung ? 2.5 : 1.5}"/>
    <!-- Silia & Alur Udara Masuk -->
    <path d="M 292,76 Q 300,72 308,76" fill="none" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="294" cy="80" r="1.5" fill="#c2410c"/>
    <circle cx="306" cy="80" r="1.5" fill="#c2410c"/>
  </g>

  <!-- 2. FARING & LARING (Pangkal Tenggorokan & Kotak Suara) -->
  <g id="organ_laring">
    <rect x="303" y="106" width="14" height="24" rx="3" fill="#ffedd5" stroke="${isTarget.faring ? '#e11d48' : '#ea580c'}" stroke-width="${isTarget.faring ? 2.5 : 1.5}"/>
    <!-- Pita Suara / Epiglotis -->
    <line x1="305" y1="114" x2="315" y2="114" stroke="#c2410c" stroke-width="1.6"/>
    <line x1="305" y1="122" x2="315" y2="122" stroke="#c2410c" stroke-width="1.6"/>
  </g>

  <!-- 3. TRAKEA (BATANG TENGGOROKAN) DENGAN CINCIN TULANG RAWAN KARTILAGO -->
  <g id="organ_trakea">
    <rect x="302" y="132" width="16" height="68" rx="3" fill="url(#tracheaGrad)" stroke="${isTarget.trakea ? '#e11d48' : '#ea580c'}" stroke-width="${isTarget.trakea ? 2.5 : 1.8}"/>
    <!-- Cincin Tulang Rawan Berlapis (Cartilage Rings) -->
    <line x1="302" y1="140" x2="318" y2="140" stroke="#c2410c" stroke-width="1.8"/>
    <line x1="302" y1="148" x2="318" y2="148" stroke="#c2410c" stroke-width="1.8"/>
    <line x1="302" y1="156" x2="318" y2="156" stroke="#c2410c" stroke-width="1.8"/>
    <line x1="302" y1="164" x2="318" y2="164" stroke="#c2410c" stroke-width="1.8"/>
    <line x1="302" y1="172" x2="318" y2="172" stroke="#c2410c" stroke-width="1.8"/>
    <line x1="302" y1="180" x2="318" y2="180" stroke="#c2410c" stroke-width="1.8"/>
    <line x1="302" y1="188" x2="318" y2="188" stroke="#c2410c" stroke-width="1.8"/>
    <line x1="302" y1="196" x2="318" y2="196" stroke="#c2410c" stroke-width="1.8"/>
  </g>

  <!-- 4. PERCABANGAN BRONKUS & BRONKIOLUS POHON PERNAPASAN -->
  <g id="organ_bronkus">
    <!-- Karina & Bronkus Kanan (Lebih Pendek, Lebih Tegak) -->
    <path d="M 310,200 Q 302,210 274,222 Q 256,230 240,244" fill="none" stroke="#c2410c" stroke-width="${isTarget.bronkus ? 4.5 : 3.5}" stroke-linecap="round"/>
    <!-- Bronkus Kiri (Lebih Panjang, Mendatar Menghindari Jantung) -->
    <path d="M 310,200 Q 318,210 346,222 Q 364,230 380,244" fill="none" stroke="#c2410c" stroke-width="${isTarget.bronkus ? 4.5 : 3.5}" stroke-linecap="round"/>
    
    <!-- Percabangan Bronkiolus Sekunder & Tersier -->
    <!-- Sisi Kanan Tubuh / Kiri Gambar -->
    <path d="M 270,224 Q 258,245 252,270 M 274,222 Q 278,248 280,274 M 256,230 Q 236,252 232,276" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M 252,270 Q 242,290 238,310 M 280,274 Q 284,296 286,316" fill="none" stroke="#f97316" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Sisi Kiri Tubuh / Kanan Gambar -->
    <path d="M 350,224 Q 362,245 368,270 M 346,222 Q 342,248 340,274 M 364,230 Q 384,252 388,276" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M 368,270 Q 378,290 382,310 M 340,274 Q 336,296 334,316" fill="none" stroke="#f97316" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 5. PARU-PARU KANAN (3 LOBUS: SUPERIOR, MEDIUS, INFERIOR) -->
  <g id="organ_paru_r">
    <path d="M 292,204 C 265,195 220,200 200,225 C 180,250 182,295 195,322 C 212,338 260,338 285,320 C 295,308 296,235 292,204 Z" fill="url(#lungGradR)" stroke="${isTarget.paru ? '#991b1b' : '#e11d48'}" stroke-width="${isTarget.paru ? 3 : 2}" filter="${isTarget.paru ? 'url(#respGlow)' : 'none'}"/>
    <!-- Garis Fissura Horizontal & Oblique Paru Kanan -->
    <path d="M 190,260 Q 240,262 292,252" fill="none" stroke="#be123c" stroke-width="1.5" stroke-dasharray="3,2"/>
    <path d="M 198,290 Q 245,286 288,280" fill="none" stroke="#be123c" stroke-width="1.5" stroke-dasharray="3,2"/>
  </g>

  <!-- 6. PARU-PARU KIRI (2 LOBUS DENGAN LEKUKAN JANTUNG / CARDIAC NOTCH) -->
  <g id="organ_paru_kiri">
    <path d="M 328,204 C 355,195 400,200 420,225 C 440,250 438,295 425,322 C 408,338 360,338 335,320 C 322,305 330,272 322,252 C 316,234 322,215 328,204 Z" fill="url(#lungGradL)" stroke="${isTarget.paru ? '#991b1b' : '#e11d48'}" stroke-width="${isTarget.paru ? 3 : 2}" filter="${isTarget.paru ? 'url(#respGlow)' : 'none'}"/>
    <!-- Garis Fissura Oblique Paru Kiri -->
    <path d="M 334,260 Q 380,265 428,258" fill="none" stroke="#be123c" stroke-width="1.5" stroke-dasharray="3,2"/>
    <!-- Siluet Lekuk Jantung di Balik Paru Kiri -->
    <ellipse cx="320" cy="272" rx="14" ry="20" fill="#f43f5e" fill-opacity="0.25" stroke="#e11d48" stroke-width="1.2" stroke-dasharray="2,2"/>
  </g>

  <!-- 7. OTOT DIAFRAGMA (SEKAT RONGGA DADA & PERUT) -->
  <g id="organ_diafragma">
    <path d="M 174,348 Q 310,320 446,348" fill="none" stroke="#047857" stroke-width="${isTarget.diafragma ? 6 : 4.5}" stroke-linecap="round"/>
    <path d="M 185,354 Q 310,330 435,354" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- ==================== INSET DETAIL: ALVEOLUS (Pertukaran Gas) ==================== -->
  <g id="inset_alveolus" transform="translate(485, 120)">
    <!-- Kartu Latar Belakang Inset -->
    <rect x="0" y="0" width="195" height="185" rx="10" fill="#ffffff" stroke="${isTarget.alveolus ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.alveolus ? 2 : 1.2}" filter="url(#respCardShadow)"/>
    <rect x="0" y="0" width="195" height="26" rx="10" fill="#f1f5f9"/>
    <text x="97" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">Mikroskopis: Alveolus</text>

    <!-- Kantung Alveolus Bergerombol -->
    <g transform="translate(70, 85)">
      <!-- Saluran Masuk Udara (Duktus Alveolaris) -->
      <path d="M 0,-40 L 0,-20" stroke="#fdba74" stroke-width="8" stroke-linecap="round"/>
      
      <!-- Kantung-Kantung Alveolus Bersama Kapiler -->
      <circle cx="-16" cy="-10" r="14" fill="#fee2e2" stroke="#f43f5e" stroke-width="1.5"/>
      <circle cx="16" cy="-10" r="14" fill="#fee2e2" stroke="#f43f5e" stroke-width="1.5"/>
      <circle cx="-18" cy="14" r="15" fill="#fee2e2" stroke="#f43f5e" stroke-width="1.5"/>
      <circle cx="18" cy="14" r="15" fill="#fee2e2" stroke="#f43f5e" stroke-width="1.5"/>
      <circle cx="0" cy="24" r="16" fill="#fee2e2" stroke="#f43f5e" stroke-width="1.5"/>

      <!-- Jaring Anyaman Kapiler (Biru CO2 & Merah O2) -->
      <path d="M -30,-8 Q -8,-16 8,-4 Q 24,8 32,22" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M -24,8 Q 0,0 16,18 Q 24,28 10,38" fill="none" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round"/>

      <!-- Label Difusi Gas -->
      <text x="-48" y="-14" font-size="9" font-weight="700" fill="#0284c7">CO₂</text>
      <path d="M -42,-12 L -34,-12" stroke="#0284c7" stroke-width="1.2" marker-end="url(#arrow)"/>
      <text x="32" y="-14" font-size="9" font-weight="700" fill="#e11d48">O₂</text>
      <path d="M 32,-12 L 24,-12" stroke="#e11d48" stroke-width="1.2" marker-end="url(#arrow)"/>
    </g>

    <text x="97" y="168" text-anchor="middle" font-size="9.5" font-weight="600" fill="#64748b">Pertukaran Gas O₂ &amp; CO₂</text>
  </g>

  <!-- Garis Hubung dari Paru-paru ke Inset Alveolus -->
  <line x1="418" y1="280" x2="485" y2="230" stroke="#0284c7" stroke-width="1.2" stroke-dasharray="3,3"/>
  <circle cx="418" cy="280" r="3" fill="#0284c7"/>

  <!-- ==================== ANOTASI & LEADER LINES RESMI ==================== -->

  <!-- SISI KIRI (Left Cards): Hidung, Faring/Laring, Bronkus, Diafragma -->
  <!-- 1. RONGGA HIDUNG -->
  <g>
    <rect x="24" y="64" width="140" height="28" rx="6" fill="${isTarget.hidung ? '#fee2e2' : '#ffffff'}" stroke="${isTarget.hidung ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.hidung ? 2 : 1}" filter="url(#respCardShadow)"/>
    <text x="36" y="83" font-size="11.5" font-weight="700" fill="${isTarget.hidung ? '#991b1b' : '#334155'}">1. Rongga Hidung</text>
    <line x1="164" y1="78" x2="284" y2="76" stroke="${isTarget.hidung ? '#e11d48' : '#94a3b8'}" stroke-width="${isTarget.hidung ? 2 : 1.2}" stroke-dasharray="${isTarget.hidung ? 'none' : '3,2'}"/>
    <circle cx="284" cy="76" r="2.5" fill="${isTarget.hidung ? '#e11d48' : '#64748b'}"/>
  </g>

  <!-- 2. FARING & LARING -->
  <g>
    <rect x="24" y="108" width="140" height="28" rx="6" fill="${isTarget.faring ? '#ffedd5' : '#ffffff'}" stroke="${isTarget.faring ? '#f97316' : '#cbd5e1'}" stroke-width="${isTarget.faring ? 2 : 1}" filter="url(#respCardShadow)"/>
    <text x="36" y="127" font-size="11.5" font-weight="700" fill="${isTarget.faring ? '#c2410c' : '#334155'}">2. Faring &amp; Laring</text>
    <line x1="164" y1="122" x2="302" y2="120" stroke="${isTarget.faring ? '#ea580c' : '#94a3b8'}" stroke-width="${isTarget.faring ? 2 : 1.2}" stroke-dasharray="${isTarget.faring ? 'none' : '3,2'}"/>
    <circle cx="302" cy="120" r="2.5" fill="${isTarget.faring ? '#ea580c' : '#64748b'}"/>
  </g>

  <!-- 3. BRONKUS -->
  <g>
    <rect x="24" y="210" width="140" height="28" rx="6" fill="${isTarget.bronkus ? '#ffedd5' : '#ffffff'}" stroke="${isTarget.bronkus ? '#f97316' : '#cbd5e1'}" stroke-width="${isTarget.bronkus ? 2 : 1}" filter="url(#respCardShadow)"/>
    <text x="36" y="229" font-size="11.5" font-weight="700" fill="${isTarget.bronkus ? '#c2410c' : '#334155'}">4. Bronkus (Cabang)</text>
    <line x1="164" y1="224" x2="268" y2="224" stroke="${isTarget.bronkus ? '#ea580c' : '#94a3b8'}" stroke-width="${isTarget.bronkus ? 2 : 1.2}" stroke-dasharray="${isTarget.bronkus ? 'none' : '3,2'}"/>
    <circle cx="268" cy="224" r="2.5" fill="${isTarget.bronkus ? '#ea580c' : '#64748b'}"/>
  </g>

  <!-- 4. DIAFRAGMA -->
  <g>
    <rect x="24" y="340" width="140" height="28" rx="6" fill="${isTarget.diafragma ? '#dcfce7' : '#ffffff'}" stroke="${isTarget.diafragma ? '#10b981' : '#cbd5e1'}" stroke-width="${isTarget.diafragma ? 2 : 1}" filter="url(#respCardShadow)"/>
    <text x="36" y="359" font-size="11.5" font-weight="700" fill="${isTarget.diafragma ? '#047857' : '#334155'}">Diafragma</text>
    <line x1="164" y1="354" x2="245" y2="348" stroke="${isTarget.diafragma ? '#059669' : '#94a3b8'}" stroke-width="${isTarget.diafragma ? 2 : 1.2}" stroke-dasharray="${isTarget.diafragma ? 'none' : '3,2'}"/>
    <circle cx="245" cy="348" r="2.5" fill="${isTarget.diafragma ? '#059669' : '#64748b'}"/>
  </g>

  <!-- SISI KANAN (Right Cards): Trakea & Paru-Paru -->
  <!-- 5. TRAKEA -->
  <g>
    <rect x="520" y="64" width="156" height="28" rx="6" fill="${isTarget.trakea ? '#fee2e2' : '#ffffff'}" stroke="${isTarget.trakea ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.trakea ? 2 : 1}" filter="url(#respCardShadow)"/>
    <text x="532" y="83" font-size="11.5" font-weight="700" fill="${isTarget.trakea ? '#991b1b' : '#334155'}">3. Trakea (Tenggorokan)</text>
    <line x1="520" y1="78" x2="320" y2="162" stroke="${isTarget.trakea ? '#e11d48' : '#94a3b8'}" stroke-width="${isTarget.trakea ? 2 : 1.2}" stroke-dasharray="${isTarget.trakea ? 'none' : '3,2'}"/>
    <circle cx="320" cy="162" r="2.5" fill="${isTarget.trakea ? '#e11d48' : '#64748b'}"/>
  </g>

  <!-- 6. PARU-PARU -->
  <g>
    <rect x="520" y="325" width="156" height="28" rx="6" fill="${isTarget.paru ? '#fee2e2' : '#ffffff'}" stroke="${isTarget.paru ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.paru ? 2 : 1}" filter="url(#respCardShadow)"/>
    <text x="532" y="344" font-size="11.5" font-weight="700" fill="${isTarget.paru ? '#991b1b' : '#334155'}">5. Paru-paru (Pulmo)</text>
    <line x1="520" y1="339" x2="425" y2="305" stroke="${isTarget.paru ? '#e11d48' : '#94a3b8'}" stroke-width="${isTarget.paru ? 2 : 1.2}" stroke-dasharray="${isTarget.paru ? 'none' : '3,2'}"/>
    <circle cx="425" cy="305" r="2.5" fill="${isTarget.paru ? '#e11d48' : '#64748b'}"/>
  </g>

  <!-- ==================== TARGET POINTER DINAMIS HURUF X ==================== -->
  <g id="target_pointer">
    <!-- Efek Beacon Berpendar -->
    <circle cx="${target.x}" cy="${target.y}" r="22" fill="#e11d48" opacity="0.18"/>
    <circle cx="${target.x}" cy="${target.y}" r="14" fill="#e11d48" opacity="0.3"/>
    
    <!-- Panah Penunjuk Merah -->
    <line x1="${target.side === 'right' ? target.x + 45 : target.x - 45}" y1="${target.y}" x2="${target.side === 'right' ? target.x + 8 : target.x - 8}" y2="${target.y}" stroke="#e11d48" stroke-width="2.8" marker-end="url(#arrow)"/>
    
    <!-- Badge Target Huruf X -->
    <circle cx="${target.side === 'right' ? target.x + 64 : target.x - 64}" cy="${target.y}" r="17" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#respGlow)"/>
    <text x="${target.side === 'right' ? target.x + 64 : target.x - 64}" y="${target.y + 6}" text-anchor="middle" font-size="16" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Footer Banner Prompt Ujian -->
  <rect x="2" y="408" width="696" height="30" rx="6" fill="#f1f5f9"/>
  <text x="350" y="427" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">Perhatikan bagian organ bertanda huruf "${escapeXml(labelChar)}" (${escapeXml(target.name)})</text>
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

/** Render Organ Pencernaan Manusia dengan Siluet Torso Anatomis & Highlight Organ Dinamis X (Enterprise Textbook Grade) */
export function renderOrganPencernaanSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'lambung').toLowerCase();
  const labelChar = params.label || 'X';

  // Tentukan organ target dan highlight state
  let target = { x: 330, y: 195, name: 'Lambung', side: 'right', lx: 530, ly: 195 };
  let isTarget = {
    mulut: false,
    kerongkongan: false,
    lambung: false,
    hati: false,
    empedu: false,
    pankreas: false,
    ususHalus: false,
    ususBesar: false,
    anus: false
  };

  if (pointer.includes('mulut') || pointer.includes('gigi') || pointer.includes('lidah')) {
    target = { x: 325, y: 66, name: 'Rongga Mulut', side: 'right', lx: 530, ly: 66 };
    isTarget.mulut = true;
  } else if (pointer.includes('kerongkongan') || pointer.includes('esofagus')) {
    target = { x: 320, y: 125, name: 'Kerongkongan (Esofagus)', side: 'right', lx: 530, ly: 125 };
    isTarget.kerongkongan = true;
  } else if (pointer.includes('hati') || pointer.includes('liver')) {
    target = { x: 260, y: 180, name: 'Hati (Liver)', side: 'left', lx: 110, ly: 180 };
    isTarget.hati = true;
  } else if (pointer.includes('empedu')) {
    target = { x: 275, y: 205, name: 'Kantung Empedu', side: 'left', lx: 110, ly: 220 };
    isTarget.empedu = true;
  } else if (pointer.includes('pankreas')) {
    target = { x: 330, y: 225, name: 'Pankreas', side: 'right', lx: 530, ly: 235 };
    isTarget.pankreas = true;
  } else if (pointer.includes('usus halus') || pointer.includes('ileum') || pointer.includes('jejunum') || pointer.includes('duodenum')) {
    target = { x: 320, y: 295, name: 'Usus Halus', side: 'left', lx: 110, ly: 295 };
    isTarget.ususHalus = true;
  } else if (pointer.includes('usus besar') || pointer.includes('kolon') || pointer.includes('apendiks')) {
    target = { x: 385, y: 270, name: 'Usus Besar (Kolon)', side: 'right', lx: 530, ly: 270 };
    isTarget.ususBesar = true;
  } else if (pointer.includes('anus') || pointer.includes('rektum')) {
    target = { x: 320, y: 382, name: 'Anus / Rektum', side: 'right', lx: 530, ly: 382 };
    isTarget.anus = true;
  } else {
    // Default Lambung
    isTarget.lambung = true;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" width="100%" height="100%" style="background:#f8fafc; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <defs>
    <!-- Gradien Torso Tubuh -->
    <linearGradient id="pencTorsoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>

    <!-- Gradien Organ -->
    <linearGradient id="pencLiverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9a3412"/>
      <stop offset="60%" stop-color="#c2410c"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </linearGradient>
    <linearGradient id="pencStomachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="60%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <linearGradient id="pencColonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="pencSmallIntGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="60%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>

    <!-- Filter Shadow & Glow -->
    <filter id="pencGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>

    <marker id="arrPenc" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <!-- Background Canvas Card -->
  <rect x="2" y="2" width="696" height="436" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

  <!-- Header Banner -->
  <rect x="2" y="2" width="696" height="46" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="24" y="14" width="6" height="22" rx="3" fill="#e11d48"/>
  <text x="40" y="30" font-size="16" font-weight="800" fill="#0f172a" letter-spacing="0.3">Sistem Pencernaan Manusia</text>
  <text x="320" y="30" font-size="12" font-weight="600" fill="#64748b">(Sistem Organ &amp; Saluran Pencernaan Lengkap)</text>

  <!-- KONTUR SILUET TORSO MANUSIA (Anatomical Body Contour) -->
  <g opacity="0.95">
    <!-- Kepala & Leher Samping-Depan -->
    <path d="M 305,52 C 285,52 280,68 280,82 C 280,95 292,104 298,110 L 298,130 C 265,135 210,150 190,185 C 175,210 178,255 180,310 C 182,345 195,385 205,410 L 435,410 C 445,385 458,345 460,310 C 462,255 465,210 450,185 C 430,150 375,135 342,130 L 342,110 C 348,104 360,95 360,82 C 360,68 355,52 335,52 Z" fill="url(#pencTorsoGrad)" stroke="#cbd5e1" stroke-width="1.8"/>
    <!-- Bayangan Bahu & Klavikula -->
    <path d="M 230,152 Q 295,145 342,138 M 410,152 Q 345,145 298,138" fill="none" stroke="#e2e8f0" stroke-width="2"/>
    <!-- Garis Iga / Costa Halus -->
    <path d="M 220,195 Q 260,205 285,215 M 420,195 Q 380,205 355,215" fill="none" stroke="#e2e8f0" stroke-width="1.4" stroke-dasharray="3,3"/>
  </g>

  <!-- ORGAN 1: RONGGA MULUT & KELENJAR LUDAH -->
  <g id="organ_mulut">
    <!-- Kelenjar Ludah (Parotis & Submandibularis) -->
    <ellipse cx="342" cy="74" rx="7" ry="5" fill="#fbcfe8" stroke="#db2777" stroke-width="1.2"/>
    <ellipse cx="325" cy="85" rx="6" ry="4" fill="#fbcfe8" stroke="#db2777" stroke-width="1.2"/>
    <!-- Rongga Mulut & Lidah -->
    <ellipse cx="318" cy="68" rx="16" ry="10" fill="${isTarget.mulut ? '#f43f5e' : '#fda4af'}" stroke="${isTarget.mulut ? '#be123c' : '#e11d48'}" stroke-width="${isTarget.mulut ? 2.5 : 1.8}"/>
    <path d="M 310,68 Q 318,74 326,68" fill="none" stroke="#be123c" stroke-width="1.5"/>
    <path d="M 312,63 L 324,63" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- ORGAN 2: KERONGKONGAN / ESOFAGUS -->
  <g id="organ_esofagus">
    <path d="M 318,80 L 318,168 M 324,80 L 324,168" stroke="${isTarget.kerongkongan ? '#ea580c' : '#fdba74'}" stroke-width="${isTarget.kerongkongan ? 4 : 3}" stroke-linecap="round"/>
    <!-- Cincin Otot Peristaltik Halus -->
    <line x1="316" y1="95" x2="326" y2="95" stroke="#f97316" stroke-width="1.5"/>
    <line x1="316" y1="115" x2="326" y2="115" stroke="#f97316" stroke-width="1.5"/>
    <line x1="316" y1="135" x2="326" y2="135" stroke="#f97316" stroke-width="1.5"/>
    <line x1="316" y1="155" x2="326" y2="155" stroke="#f97316" stroke-width="1.5"/>
  </g>

  <!-- ORGAN 3: HATI (LIVER) & KANTUNG EMPEDU -->
  <g id="organ_hati">
    <!-- Hati Lobus Besar Kanan & Lobus Kiri -->
    <path d="M 235,160 C 215,165 205,185 215,208 C 225,225 260,222 295,202 L 295,162 Z" fill="url(#pencLiverGrad)" stroke="${isTarget.hati ? '#e11d48' : '#7c2d12'}" stroke-width="${isTarget.hati ? 3 : 1.8}" filter="${isTarget.hati ? 'url(#pencGlow)' : 'none'}"/>
    <path d="M 265,161 Q 262,185 272,212" fill="none" stroke="#7c2d12" stroke-width="1.2" stroke-dasharray="2,2"/>
    <!-- Kantung Empedu (Gallbladder) Hijau -->
    <path d="M 270,205 C 265,215 275,222 282,218 C 286,214 282,204 274,204 Z" fill="#22c55e" stroke="${isTarget.empedu ? '#e11d48' : '#15803d'}" stroke-width="${isTarget.empedu ? 2.5 : 1.5}"/>
    <!-- Saluran Empedu / Duktus Biliaris -->
    <path d="M 280,214 Q 295,218 304,226" fill="none" stroke="#15803d" stroke-width="1.8"/>
  </g>

  <!-- ORGAN 4: LAMBUNG (STOMACH / VENTRICULUS) -->
  <g id="organ_lambung">
    <!-- Bentuk J-Shape Anatomis dengan Rugae Lambung -->
    <path d="M 318,162 C 302,162 290,178 296,202 C 302,225 328,235 348,220 C 362,210 366,182 350,168 C 338,156 328,162 318,162 Z" fill="url(#pencStomachGrad)" stroke="${isTarget.lambung ? '#991b1b' : '#be123c'}" stroke-width="${isTarget.lambung ? 3.5 : 2}" filter="${isTarget.lambung ? 'url(#pencGlow)' : 'none'}"/>
    <!-- Tekstur Rugae / Lipatan Mukosa Dinding Lambung -->
    <path d="M 310,185 Q 318,198 335,188 M 312,202 Q 325,214 342,204" fill="none" stroke="#fda4af" stroke-width="1.5" stroke-linecap="round"/>
  </g>

  <!-- ORGAN 5: PANKREAS (Di Lekukan Duodenum di Balik Lambung) -->
  <g id="organ_pankreas">
    <path d="M 300,222 Q 330,218 356,226 Q 332,234 300,226 Z" fill="#fef08a" stroke="${isTarget.pankreas ? '#e11d48' : '#ca8a04'}" stroke-width="${isTarget.pankreas ? 2.5 : 1.5}"/>
    <!-- Bintik-bintik Lobulus Asinus Pankreas -->
    <circle cx="315" cy="223" r="1.2" fill="#a16207"/>
    <circle cx="328" cy="224" r="1.2" fill="#a16207"/>
    <circle cx="342" cy="226" r="1.2" fill="#a16207"/>
  </g>

  <!-- ORGAN 6: USUS BESAR (KOLON) DENGAN HAUSTRASI -->
  <g id="organ_kolon">
    <!-- Kolon Asendens (Kanan Tubuh / Sisi Kiri Gambar) -->
    <path d="M 252,320 C 248,300 248,270 252,242 C 254,232 265,228 278,230" fill="none" stroke="url(#pencColonGrad)" stroke-width="${isTarget.ususBesar ? 14 : 11}" stroke-linecap="round"/>
    <!-- Kolon Transversum (Mendatar Menyilang) -->
    <path d="M 278,230 C 310,234 350,234 378,230" fill="none" stroke="url(#pencColonGrad)" stroke-width="${isTarget.ususBesar ? 14 : 11}" stroke-linecap="round"/>
    <!-- Kolon Desendens & Sigmoid (Sisi Kanan Gambar Menuju Tengah Bawah) -->
    <path d="M 378,230 C 392,235 392,265 388,310 C 386,332 365,348 345,355 L 324,372" fill="none" stroke="url(#pencColonGrad)" stroke-width="${isTarget.ususBesar ? 14 : 11}" stroke-linecap="round"/>
    
    <!-- Garis Segmentasi Haustra Kolon -->
    <path d="M 246,260 L 258,260 M 246,285 L 258,285 M 310,224 L 310,236 M 345,224 L 345,236 M 384,260 L 396,260 M 384,285 L 396,285" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>

    <!-- Sekum & Apendiks / Usus Buntu (Cacing Kecil di Kiri Bawah Kolon) -->
    <ellipse cx="252" cy="330" rx="9" ry="8" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
    <path d="M 250,336 Q 242,346 248,354" fill="none" stroke="#0369a1" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- ORGAN 7: USUS HALUS (DUODENUM, JEJUNUM, ILEUM) -->
  <g id="organ_usus_halus">
    <!-- Lipatan Berkelok Padat di Pusat Perut -->
    <path d="M 275,255 Q 305,248 335,255 Q 365,262 335,270 Q 285,278 285,290 Q 345,286 360,298 Q 362,315 325,316 Q 280,318 290,332 Q 330,332 355,330" fill="none" stroke="url(#pencSmallIntGrad)" stroke-width="${isTarget.ususHalus ? 9 : 7}" stroke-linecap="round" stroke-linejoin="round" filter="${isTarget.ususHalus ? 'url(#pencGlow)' : 'none'}"/>
    <!-- Lapisan Tekstur Lipatan Usus Halus -->
    <path d="M 292,262 Q 320,258 350,264 M 295,292 Q 325,290 350,296 M 300,322 Q 325,320 345,324" fill="none" stroke="#fff7ed" stroke-width="1.5" opacity="0.6"/>
  </g>

  <!-- ORGAN 8: REKTUM & ANUS -->
  <g id="organ_anus">
    <path d="M 324,370 L 324,392" stroke="#475569" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="324" cy="396" rx="7" ry="4" fill="${isTarget.anus ? '#e11d48' : '#334155'}" stroke="#0f172a" stroke-width="${isTarget.anus ? 2.5 : 1.8}"/>
  </g>

  <!-- ==================== ANOTASI & LEADER LINES RESMI ==================== -->

  <!-- SISI KIRI (Left Cards): Hati, Kantung Empedu, Usus Halus -->
  <!-- 1. HATI -->
  <g>
    <rect x="24" y="166" width="130" height="28" rx="6" fill="${isTarget.hati ? '#fee2e2' : '#ffffff'}" stroke="${isTarget.hati ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.hati ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="36" y="185" font-size="11.5" font-weight="700" fill="${isTarget.hati ? '#991b1b' : '#334155'}">Hati (Liver)</text>
    <line x1="154" y1="180" x2="228" y2="180" stroke="${isTarget.hati ? '#e11d48' : '#94a3b8'}" stroke-width="${isTarget.hati ? 2 : 1.2}" stroke-dasharray="${isTarget.hati ? 'none' : '3,2'}"/>
    <circle cx="228" cy="180" r="2.5" fill="${isTarget.hati ? '#e11d48' : '#64748b'}"/>
  </g>

  <!-- 2. KANTUNG EMPEDU -->
  <g>
    <rect x="24" y="206" width="130" height="28" rx="6" fill="${isTarget.empedu ? '#dcfce7' : '#ffffff'}" stroke="${isTarget.empedu ? '#22c55e' : '#cbd5e1'}" stroke-width="${isTarget.empedu ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="36" y="225" font-size="11.5" font-weight="700" fill="${isTarget.empedu ? '#15803d' : '#334155'}">Kantung Empedu</text>
    <line x1="154" y1="220" x2="268" y2="216" stroke="${isTarget.empedu ? '#16a34a' : '#94a3b8'}" stroke-width="${isTarget.empedu ? 2 : 1.2}" stroke-dasharray="${isTarget.empedu ? 'none' : '3,2'}"/>
    <circle cx="268" cy="216" r="2.5" fill="${isTarget.empedu ? '#16a34a' : '#64748b'}"/>
  </g>

  <!-- 3. USUS HALUS -->
  <g>
    <rect x="24" y="282" width="130" height="28" rx="6" fill="${isTarget.ususHalus ? '#ffedd5' : '#ffffff'}" stroke="${isTarget.ususHalus ? '#f97316' : '#cbd5e1'}" stroke-width="${isTarget.ususHalus ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="36" y="301" font-size="11.5" font-weight="700" fill="${isTarget.ususHalus ? '#c2410c' : '#334155'}">Usus Halus</text>
    <line x1="154" y1="296" x2="280" y2="296" stroke="${isTarget.ususHalus ? '#ea580c' : '#94a3b8'}" stroke-width="${isTarget.ususHalus ? 2 : 1.2}" stroke-dasharray="${isTarget.ususHalus ? 'none' : '3,2'}"/>
    <circle cx="280" cy="296" r="2.5" fill="${isTarget.ususHalus ? '#ea580c' : '#64748b'}"/>
  </g>

  <!-- SISI KANAN (Right Cards): Mulut, Kerongkongan, Lambung, Pankreas, Usus Besar, Anus -->
  <!-- 4. RONGGA MULUT -->
  <g>
    <rect x="520" y="52" width="156" height="28" rx="6" fill="${isTarget.mulut ? '#fee2e2' : '#ffffff'}" stroke="${isTarget.mulut ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.mulut ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="532" y="71" font-size="11.5" font-weight="700" fill="${isTarget.mulut ? '#991b1b' : '#334155'}">1. Mulut &amp; Gigi</text>
    <line x1="520" y1="66" x2="336" y2="68" stroke="${isTarget.mulut ? '#e11d48' : '#94a3b8'}" stroke-width="${isTarget.mulut ? 2 : 1.2}" stroke-dasharray="${isTarget.mulut ? 'none' : '3,2'}"/>
    <circle cx="336" cy="68" r="2.5" fill="${isTarget.mulut ? '#e11d48' : '#64748b'}"/>
  </g>

  <!-- 5. KERONGKONGAN -->
  <g>
    <rect x="520" y="112" width="156" height="28" rx="6" fill="${isTarget.kerongkongan ? '#ffedd5' : '#ffffff'}" stroke="${isTarget.kerongkongan ? '#f97316' : '#cbd5e1'}" stroke-width="${isTarget.kerongkongan ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="532" y="131" font-size="11.5" font-weight="700" fill="${isTarget.kerongkongan ? '#c2410c' : '#334155'}">2. Kerongkongan</text>
    <line x1="520" y1="126" x2="330" y2="126" stroke="${isTarget.kerongkongan ? '#f97316' : '#94a3b8'}" stroke-width="${isTarget.kerongkongan ? 2 : 1.2}" stroke-dasharray="${isTarget.kerongkongan ? 'none' : '3,2'}"/>
    <circle cx="330" cy="126" r="2.5" fill="${isTarget.kerongkongan ? '#f97316' : '#64748b'}"/>
  </g>

  <!-- 6. LAMBUNG -->
  <g>
    <rect x="520" y="182" width="156" height="28" rx="6" fill="${isTarget.lambung ? '#fee2e2' : '#ffffff'}" stroke="${isTarget.lambung ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.lambung ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="532" y="201" font-size="11.5" font-weight="700" fill="${isTarget.lambung ? '#991b1b' : '#334155'}">3. Lambung</text>
    <line x1="520" y1="196" x2="362" y2="196" stroke="${isTarget.lambung ? '#e11d48' : '#94a3b8'}" stroke-width="${isTarget.lambung ? 2 : 1.2}" stroke-dasharray="${isTarget.lambung ? 'none' : '3,2'}"/>
    <circle cx="362" cy="196" r="2.5" fill="${isTarget.lambung ? '#e11d48' : '#64748b'}"/>
  </g>

  <!-- 7. PANKREAS -->
  <g>
    <rect x="520" y="222" width="156" height="28" rx="6" fill="${isTarget.pankreas ? '#fef9c3' : '#ffffff'}" stroke="${isTarget.pankreas ? '#eab308' : '#cbd5e1'}" stroke-width="${isTarget.pankreas ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="532" y="241" font-size="11.5" font-weight="700" fill="${isTarget.pankreas ? '#854d0e' : '#334155'}">Pankreas</text>
    <line x1="520" y1="236" x2="358" y2="228" stroke="${isTarget.pankreas ? '#ca8a04' : '#94a3b8'}" stroke-width="${isTarget.pankreas ? 2 : 1.2}" stroke-dasharray="${isTarget.pankreas ? 'none' : '3,2'}"/>
    <circle cx="358" cy="228" r="2.5" fill="${isTarget.pankreas ? '#ca8a04' : '#64748b'}"/>
  </g>

  <!-- 8. USUS BESAR -->
  <g>
    <rect x="520" y="262" width="156" height="28" rx="6" fill="${isTarget.ususBesar ? '#e0f2fe' : '#ffffff'}" stroke="${isTarget.ususBesar ? '#0284c7' : '#cbd5e1'}" stroke-width="${isTarget.ususBesar ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="532" y="281" font-size="11.5" font-weight="700" fill="${isTarget.ususBesar ? '#0369a1' : '#334155'}">4. Usus Besar (Kolon)</text>
    <line x1="520" y1="276" x2="394" y2="276" stroke="${isTarget.ususBesar ? '#0284c7' : '#94a3b8'}" stroke-width="${isTarget.ususBesar ? 2 : 1.2}" stroke-dasharray="${isTarget.ususBesar ? 'none' : '3,2'}"/>
    <circle cx="394" cy="276" r="2.5" fill="${isTarget.ususBesar ? '#0284c7' : '#64748b'}"/>
  </g>

  <!-- 9. ANUS -->
  <g>
    <rect x="520" y="368" width="156" height="28" rx="6" fill="${isTarget.anus ? '#fee2e2' : '#ffffff'}" stroke="${isTarget.anus ? '#ef4444' : '#cbd5e1'}" stroke-width="${isTarget.anus ? 2 : 1}" filter="url(#cardShadow)"/>
    <text x="532" y="387" font-size="11.5" font-weight="700" fill="${isTarget.anus ? '#991b1b' : '#334155'}">5. Anus / Rektum</text>
    <line x1="520" y1="382" x2="338" y2="394" stroke="${isTarget.anus ? '#e11d48' : '#94a3b8'}" stroke-width="${isTarget.anus ? 2 : 1.2}" stroke-dasharray="${isTarget.anus ? 'none' : '3,2'}"/>
    <circle cx="338" cy="394" r="2.5" fill="${isTarget.anus ? '#e11d48' : '#64748b'}"/>
  </g>

  <!-- ==================== TARGET POINTER DINAMIS HURUF X ==================== -->
  <g id="target_pointer">
    <!-- Efek Beacon Berpendar -->
    <circle cx="${target.x}" cy="${target.y}" r="22" fill="#e11d48" opacity="0.18"/>
    <circle cx="${target.x}" cy="${target.y}" r="14" fill="#e11d48" opacity="0.3"/>
    
    <!-- Panah Penunjuk Merah -->
    <line x1="${target.side === 'right' ? target.x + 45 : target.x - 45}" y1="${target.y}" x2="${target.side === 'right' ? target.x + 8 : target.x - 8}" y2="${target.y}" stroke="#e11d48" stroke-width="3" marker-end="url(#arrPenc)"/>
    
    <!-- Badge Target Huruf X -->
    <circle cx="${target.side === 'right' ? target.x + 64 : target.x - 64}" cy="${target.y}" r="17" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#pencGlow)"/>
    <text x="${target.side === 'right' ? target.x + 64 : target.x - 64}" y="${target.y + 6}" text-anchor="middle" font-size="16" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Footer Banner Prompt Ujian -->
  <rect x="2" y="408" width="696" height="30" rx="6" fill="#f1f5f9"/>
  <text x="350" y="427" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">Perhatikan bagian organ yang ditunjuk oleh huruf "${escapeXml(labelChar)}" (${escapeXml(target.name)})</text>
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 350" width="440" height="350" style="background:#f8fafc; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
  <defs>
    <!-- Gradien Kapiler Pulmonalis & Sistemik -->
    <linearGradient id="pulmoCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <linearGradient id="systemicCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="50%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Gradien Ruang Jantung -->
    <linearGradient id="corBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
    <linearGradient id="corRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fee2e2"/>
      <stop offset="100%" stop-color="#fecaca"/>
    </linearGradient>

    <!-- Marker Panah Aliran Darah -->
    <marker id="arrBloodBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
    </marker>
    <marker id="arrBloodRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>

    <!-- Filter Shadow & Glow -->
    <filter id="bloodGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Border Kartu Utama -->
  <rect x="2" y="2" width="436" height="346" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <rect x="2" y="2" width="436" height="30" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="12" y="8" width="4" height="18" rx="2" fill="#e11d48"/>
  <text x="22" y="21" font-size="12" font-weight="800" fill="#0f172a" letter-spacing="0.2">Skema Peredaran Darah Manusia</text>

  <!-- ==================== LOOP ATAS: PARU-PARU (PULMO) ==================== -->
  <rect x="140" y="36" width="160" height="38" rx="8" fill="${isTargetParu ? '#fee2e2' : '#fef2f2'}" stroke="${isTargetParu ? '#ef4444' : '#ef4444'}" stroke-width="${isTargetParu ? 2.5 : 1.8}"/>
  <!-- Jaring Kapiler Paru -->
  <path d="M 152,56 Q 185,46 220,56 Q 255,66 288,56" fill="none" stroke="url(#pulmoCapGrad)" stroke-width="2.5" stroke-linecap="round"/>

  ${isTargetParu ? `
    <circle cx="220" cy="55" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#bloodGlow)"/>
    <text x="220" y="60" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="220" y="52" text-anchor="middle" font-size="11" font-weight="800" fill="#991b1b">Paru-Paru (Pulmo)</text>
    <text x="220" y="65" text-anchor="middle" font-size="8.5" font-weight="600" fill="#ef4444">Pertukaran O₂ &amp; CO₂</text>
  `}

  <!-- Pembuluh Darah Loop Atas: -->
  <!-- Arteri Pulmonalis (Bilik Kanan ke Paru-paru - Biru / CO2) -->
  <path d="M 155,165 C 95,165 85,85 150,54" fill="none" stroke="#0284c7" stroke-width="3.2"/>
  <path d="M 112,110 L 112,104" marker-end="url(#arrBloodBlue)"/>

  <!-- Vena Pulmonalis (Paru-paru ke Serambi Kiri - Merah / O2) -->
  <path d="M 290,54 C 355,85 345,135 285,135" fill="none" stroke="#e11d48" stroke-width="3.2"/>
  <path d="M 328,95 L 328,101" marker-end="url(#arrBloodRed)"/>

  <!-- ==================== PUSAT: JANTUNG (COR) 4 RUANG ==================== -->
  <rect x="115" y="102" width="210" height="138" rx="14" fill="#f8fafc" stroke="#0f172a" stroke-width="2.5"/>
  <rect x="175" y="96" width="90" height="14" rx="3" fill="#0f172a"/>
  <text x="220" y="106" text-anchor="middle" font-size="9" font-weight="800" fill="#ffffff" letter-spacing="0.8">JANTUNG</text>

  <!-- Pembatas Septum Vertikal & Katup Horisontal -->
  <line x1="220" y1="110" x2="220" y2="240" stroke="#0f172a" stroke-width="2.5"/>
  <line x1="115" y1="171" x2="325" y2="171" stroke="#0f172a" stroke-width="2.5"/>

  <!-- 1. Serambi Kanan -->
  <rect x="120" y="110" width="95" height="56" rx="6" fill="url(#corBlueGrad)" stroke="${isTargetSerambiKanan ? '#e11d48' : '#0284c7'}" stroke-width="${isTargetSerambiKanan ? 2.5 : 1}"/>
  ${isTargetSerambiKanan ? `
    <circle cx="167" cy="138" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#bloodGlow)"/>
    <text x="167" y="143" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="167" y="134" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0369a1">Serambi Kanan</text>
    <text x="167" y="149" text-anchor="middle" font-size="8.5" font-weight="600" fill="#0284c7">(Kaya CO₂)</text>
  `}

  <!-- 2. Bilik Kanan -->
  <rect x="120" y="176" width="95" height="58" rx="6" fill="url(#corBlueGrad)" stroke="${isTargetBilikKanan ? '#e11d48' : '#0284c7'}" stroke-width="${isTargetBilikKanan ? 2.5 : 1}"/>
  ${isTargetBilikKanan ? `
    <circle cx="167" cy="205" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#bloodGlow)"/>
    <text x="167" y="210" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="167" y="201" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0369a1">Bilik Kanan</text>
    <text x="167" y="216" text-anchor="middle" font-size="8.5" font-weight="600" fill="#0284c7">(Kaya CO₂)</text>
  `}

  <!-- 3. Serambi Kiri -->
  <rect x="225" y="110" width="95" height="56" rx="6" fill="url(#corRedGrad)" stroke="${isTargetSerambiKiri ? '#e11d48' : '#e11d48'}" stroke-width="${isTargetSerambiKiri ? 2.5 : 1}"/>
  ${isTargetSerambiKiri ? `
    <circle cx="272" cy="138" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#bloodGlow)"/>
    <text x="272" y="143" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="272" y="134" text-anchor="middle" font-size="10.5" font-weight="800" fill="#991b1b">Serambi Kiri</text>
    <text x="272" y="149" text-anchor="middle" font-size="8.5" font-weight="600" fill="#e11d48">(Kaya O₂)</text>
  `}

  <!-- 4. Bilik Kiri -->
  <rect x="225" y="176" width="95" height="58" rx="6" fill="url(#corRedGrad)" stroke="${isTargetBilikKiri ? '#e11d48' : '#e11d48'}" stroke-width="${isTargetBilikKiri ? 2.5 : 1.5}"/>
  ${isTargetBilikKiri ? `
    <circle cx="272" cy="205" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#bloodGlow)"/>
    <text x="272" y="210" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="272" y="201" text-anchor="middle" font-size="10.5" font-weight="800" fill="#991b1b">Bilik Kiri</text>
    <text x="272" y="216" text-anchor="middle" font-size="8.5" font-weight="600" fill="#e11d48">(Kaya O₂)</text>
  `}

  <!-- Simbol Katup Jantung -->
  <path d="M 160,168 L 167,174 L 174,168" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M 265,168 L 272,174 L 279,168" fill="none" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round"/>

  <!-- ==================== LOOP BAWAH: SELURUH TUBUH (SISTEMIK) ==================== -->
  <!-- Aorta (Bilik Kiri ke Seluruh Tubuh - Merah / O2) -->
  <path d="M 285,234 C 365,245 355,290 290,295" fill="none" stroke="#e11d48" stroke-width="3.2"/>
  <path d="M 333,265 L 333,271" marker-end="url(#arrBloodRed)"/>

  <!-- Vena Cava (Seluruh Tubuh ke Serambi Kanan - Biru / CO2) -->
  <path d="M 150,295 C 85,290 80,150 155,135" fill="none" stroke="#0284c7" stroke-width="3.2"/>
  <path d="M 92,220 L 92,214" marker-end="url(#arrBloodBlue)"/>

  <!-- Seluruh Tubuh Bottom Card -->
  <rect x="140" y="278" width="160" height="38" rx="8" fill="${isTargetTubuh ? '#fee2e2' : '#f1f5f9'}" stroke="${isTargetTubuh ? '#ef4444' : '#475569'}" stroke-width="${isTargetTubuh ? 2.5 : 1.8}"/>
  <!-- Jaring Kapiler Tubuh -->
  <path d="M 152,298 Q 185,308 220,298 Q 255,288 288,298" fill="none" stroke="url(#systemicCapGrad)" stroke-width="2.5" stroke-linecap="round"/>

  ${isTargetTubuh ? `
    <circle cx="220" cy="297" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="url(#bloodGlow)"/>
    <text x="220" y="302" text-anchor="middle" font-size="13" font-weight="900" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="220" y="294" text-anchor="middle" font-size="11" font-weight="800" fill="#1e293b">Seluruh Tubuh</text>
    <text x="220" y="307" text-anchor="middle" font-size="8.5" font-weight="600" fill="#475569">Jaringan Tubuh (Sistemik)</text>
  `}

  <!-- ==================== CALLOUTS PEMBULUH DARAH UTAMA ==================== -->
  <!-- Arteri Pulmonalis (Kiri Atas) -->
  <g>
    <rect x="10" y="80" width="112" height="22" rx="5" fill="${isTargetArteriPulmonalis ? '#fee2e2' : '#ffffff'}" stroke="${isTargetArteriPulmonalis ? '#e11d48' : '#0284c7'}" stroke-width="${isTargetArteriPulmonalis ? 2 : 1.2}"/>
    <text x="66" y="95" text-anchor="middle" font-size="${isTargetArteriPulmonalis ? '11.5' : '9.5'}" font-weight="800" fill="${isTargetArteriPulmonalis ? '#991b1b' : '#0284c7'}">${isTargetArteriPulmonalis ? 'Arteri Pulm: [' + escapeXml(labelChar) + ']' : 'Arteri Pulmonalis'}</text>
  </g>

  <!-- Vena Pulmonalis (Kanan Atas) -->
  <g>
    <rect x="318" y="80" width="112" height="22" rx="5" fill="${isTargetVenaPulmonalis ? '#fee2e2' : '#ffffff'}" stroke="${isTargetVenaPulmonalis ? '#e11d48' : '#e11d48'}" stroke-width="${isTargetVenaPulmonalis ? 2 : 1.2}"/>
    <text x="374" y="95" text-anchor="middle" font-size="${isTargetVenaPulmonalis ? '11.5' : '9.5'}" font-weight="800" fill="${isTargetVenaPulmonalis ? '#991b1b' : '#e11d48'}">${isTargetVenaPulmonalis ? 'Vena Pulm: [' + escapeXml(labelChar) + ']' : 'Vena Pulmonalis'}</text>
  </g>

  <!-- Aorta (Kanan Bawah) -->
  <g>
    <rect x="325" y="240" width="90" height="22" rx="5" fill="${isTargetAorta ? '#fee2e2' : '#ffffff'}" stroke="#e11d48" stroke-width="${isTargetAorta ? 2 : 1.2}"/>
    <text x="370" y="255" text-anchor="middle" font-size="${isTargetAorta ? '11.5' : '9.5'}" font-weight="800" fill="${isTargetAorta ? '#991b1b' : '#e11d48'}">${isTargetAorta ? 'Aorta: [' + escapeXml(labelChar) + ']' : 'Aorta'}</text>
  </g>

  <!-- Vena Cava (Kiri Bawah) -->
  <g>
    <rect x="18" y="240" width="95" height="22" rx="5" fill="${isTargetVenaCava ? '#fee2e2' : '#ffffff'}" stroke="${isTargetVenaCava ? '#e11d48' : '#0284c7'}" stroke-width="${isTargetVenaCava ? 2 : 1.2}"/>
    <text x="65" y="255" text-anchor="middle" font-size="${isTargetVenaCava ? '11.5' : '9.5'}" font-weight="800" fill="${isTargetVenaCava ? '#991b1b' : '#0284c7'}">${isTargetVenaCava ? 'Vena Cava: [' + escapeXml(labelChar) + ']' : 'Vena Cava'}</text>
  </g>

  <!-- Footer Banner Prompt Ujian -->
  <rect x="2" y="324" width="436" height="24" rx="6" fill="#f1f5f9"/>
  <text x="220" y="340" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bagian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
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
    let target = { x: 196, y: 135, name: 'Gendang Telinga' };
    if (pointer.includes('koklea') || pointer.includes('siput')) target = { x: 302, y: 130, name: 'Koklea (Rumah Siput)' };
    else if (pointer.includes('saluran') || pointer.includes('liang')) target = { x: 130, y: 138, name: 'Liang Telinga' };
    else if (pointer.includes('daun')) target = { x: 55, y: 125, name: 'Daun Telinga' };
    else if (pointer.includes('tulang') || pointer.includes('martil') || pointer.includes('landasan') || pointer.includes('sanggurdi')) target = { x: 232, y: 122, name: 'Tulang Pendengaran' };
    else if (pointer.includes('eustachius')) target = { x: 268, y: 188, name: 'Saluran Eustachius' };

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 260" width="450" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="earPinnaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
    <linearGradient id="earCanalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#ffedd5"/>
    </linearGradient>
    <radialGradient id="tympanicGrad" cx="40%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#fecaca"/>
      <stop offset="80%" stop-color="#f87171"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </radialGradient>
    <linearGradient id="cochleaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5f3ff"/>
      <stop offset="50%" stop-color="#ddd6fe"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <filter id="glowEar" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Container -->
  <rect width="450" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Subtle Regional Zone Backdrops -->
  <rect x="8" y="32" width="145" height="184" rx="6" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1"/>
  <rect x="157" y="32" width="112" height="184" rx="6" fill="#fffbeb" stroke="#fef3c7" stroke-width="1" stroke-opacity="0.5"/>
  <rect x="273" y="32" width="169" height="184" rx="6" fill="#faf5ff" stroke="#f3e8ff" stroke-width="1" stroke-opacity="0.5"/>

  <!-- Title -->
  <text x="225" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Anatomi Bagian Indra Pendengaran (Telinga)</text>

  <!-- Daun Telinga (Aurikula / Pinna) -->
  <path d="M 62,65 C 22,76 18,175 52,198 C 66,206 76,192 70,174 C 64,152 46,142 50,110 C 54,82 74,70 62,65 Z" fill="url(#earPinnaGrad)" stroke="#c2410c" stroke-width="2"/>
  <!-- Helix & Antihelix anatomical grooves -->
  <path d="M 52,78 C 30,95 32,165 52,185" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M 58,102 C 48,118 48,150 58,162" fill="none" stroke="#f97316" stroke-width="1.4" stroke-linecap="round"/>
  <!-- Tragus -->
  <path d="M 66,128 C 62,134 62,142 67,146" fill="none" stroke="#c2410c" stroke-width="1.6"/>

  <!-- Liang Telinga (Saluran Telinga Luar / Meatus Akustikus Eksternus) -->
  <path d="M 68,124 Q 125,128 194,120 L 196,152 Q 125,148 69,152 Z" fill="url(#earCanalGrad)" stroke="#ea580c" stroke-width="1.5"/>
  <!-- Sound Waves traversing the canal -->
  <path d="M 85,130 Q 90,138 85,146 M 105,128 Q 110,138 105,148 M 125,126 Q 130,138 125,150" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>

  <!-- Gendang Telinga (Membran Timpani) -->
  <ellipse cx="196" cy="136" rx="4" ry="20" transform="rotate(12 196 136)" fill="url(#tympanicGrad)" stroke="#dc2626" stroke-width="2.2"/>

  <!-- Rongga Telinga Tengah (Kavum Timpani) -->
  <ellipse cx="232" cy="132" rx="30" ry="26" fill="#fef9c3" stroke="#d97706" stroke-width="1.4" stroke-dasharray="3 2"/>

  <!-- Tulang-Tulang Pendengaran (Ossicula Auditiva) -->
  <!-- 1. Malleus (Martil) connected to tympanum -->
  <line x1="196" y1="134" x2="216" y2="120" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
  <circle cx="216" cy="120" r="4.5" fill="#92400e"/>
  <!-- 2. Incus (Landasan) -->
  <line x1="216" y1="120" x2="234" y2="124" stroke="#78350f" stroke-width="2.8" stroke-linecap="round"/>
  <circle cx="234" cy="124" r="3.5" fill="#92400e"/>
  <!-- 3. Stapes (Sanggurdi) connecting to oval window -->
  <path d="M 234,124 L 248,118 L 248,132 Z" fill="#fef3c7" stroke="#78350f" stroke-width="2"/>
  <line x1="248" y1="125" x2="256" y2="125" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>

  <!-- Saluran Eustachius (Tubus Eustachius) ke Bawah-Kanan -->
  <path d="M 238,154 L 268,206 L 284,198 L 254,150 Z" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
  <path d="M 246,152 L 276,202" fill="none" stroke="#ef4444" stroke-width="1" stroke-dasharray="2 2"/>

  <!-- Telinga Dalam: Saluran Setengah Lingkaran (Kanalis Semisirkularis) -->
  <ellipse cx="290" cy="100" rx="14" ry="9" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
  <ellipse cx="278" cy="108" rx="9" ry="14" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
  <ellipse cx="302" cy="108" rx="8" ry="13" fill="none" stroke="#7c3aed" stroke-width="2.5"/>

  <!-- Koklea (Rumah Siput) -->
  <path d="M 276,128 C 276,114 316,110 320,128 C 324,144 288,152 284,136 C 282,122 308,122 308,132 C 308,138 296,140 295,134" fill="url(#cochleaGrad)" stroke="#6d28d9" stroke-width="2.6" stroke-linejoin="round"/>
  <circle cx="300" cy="132" r="6" fill="#a78bfa" stroke="#6d28d9" stroke-width="1.5"/>

  <!-- Saraf Pendengaran (Nervus Vestibulokohlearis) Keluar ke Kanan -->
  <path d="M 320,125 L 365,120 L 365,138 L 320,135 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <line x1="324" y1="127" x2="362" y2="124" stroke="#d97706" stroke-width="1" stroke-dasharray="2 2"/>
  <line x1="324" y1="133" x2="362" y2="132" stroke="#d97706" stroke-width="1" stroke-dasharray="2 2"/>

  <!-- Callout Labels Rapi & Terproteksi (Anti-Overlap) -->
  <!-- 1. Daun Telinga -->
  <g>
    <rect x="14" y="44" width="82" height="18" rx="4" fill="#ffffff" stroke="#c2410c" stroke-width="1.2"/>
    <text x="55" y="57" text-anchor="middle" font-size="9" font-weight="bold" fill="#c2410c">Daun Telinga</text>
    <path d="M 55,62 L 55,75" stroke="#c2410c" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 2. Liang Telinga -->
  <g>
    <rect x="85" y="196" width="76" height="18" rx="4" fill="#ffffff" stroke="#ea580c" stroke-width="1.2"/>
    <text x="123" y="209" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#ea580c">Liang Telinga</text>
    <line x1="123" y1="196" x2="123" y2="152" stroke="#ea580c" stroke-width="1" stroke-dasharray="2 2"/>
  </g>

  <!-- 3. Gendang Telinga -->
  <g>
    <rect x="135" y="78" width="94" height="18" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="1.2"/>
    <text x="182" y="91" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">Gendang Telinga</text>
    <path d="M 182,96 L 194,116" stroke="#dc2626" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 4. Koklea (Rumah Siput) -->
  <g>
    <rect x="252" y="52" width="124" height="18" rx="4" fill="#ffffff" stroke="#7c3aed" stroke-width="1.2"/>
    <text x="314" y="65" text-anchor="middle" font-size="9" font-weight="bold" fill="#7c3aed">Koklea (Rumah Siput)</text>
    <path d="M 314,70 L 302,112" stroke="#7c3aed" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 5. Saluran Eustachius -->
  <g>
    <rect x="236" y="214" width="108" height="18" rx="4" fill="#ffffff" stroke="#b91c1c" stroke-width="1.2"/>
    <text x="290" y="227" text-anchor="middle" font-size="9" font-weight="bold" fill="#b91c1c">Saluran Eustachius</text>
    <line x1="284" y1="214" x2="274" y2="192" stroke="#b91c1c" stroke-width="1" stroke-dasharray="2 2"/>
  </g>

  <!-- Dynamic Pointer Target Badge X / Y -->
  <circle cx="${target.x}" cy="${target.y}" r="17" fill="none" stroke="#e11d48" stroke-width="1.8" opacity="0.4"/>
  <circle cx="${target.x}" cy="${target.y}" r="12.5" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#glowEar)"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Pedagogical Question Prompt -->
  <text x="225" y="250" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bagian indra pendengaran yang ditunjuk huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
  }

  // Default: Bola Mata Manusia
  let target = { x: 136, y: 135, name: 'Kornea' };
  if (pointer.includes('pupil')) target = { x: 172, y: 135, name: 'Pupil' };
  else if (pointer.includes('lensa')) target = { x: 198, y: 135, name: 'Lensa' };
  else if (pointer.includes('retina')) target = { x: 298, y: 135, name: 'Retina' };
  else if (pointer.includes('saraf')) target = { x: 348, y: 135, name: 'Saraf Optik' };
  else if (pointer.includes('iris')) target = { x: 178, y: 104, name: 'Iris' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 260" width="450" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <radialGradient id="scleraGlobeGrad" cx="45%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="85%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </radialGradient>
    <linearGradient id="lensEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff"/>
      <stop offset="40%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="corneaGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="glowEye" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Container -->
  <rect width="450" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Title -->
  <text x="225" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Anatomi Penampang Bola Mata Manusia</text>

  <!-- Bola Mata Utama (Sklera - Lapisan Luar Putih) -->
  <circle cx="236" cy="135" r="76" fill="url(#scleraGlobeGrad)" stroke="#334155" stroke-width="2.5"/>

  <!-- Lapisan Koroid (Lapisan Tengah Berpembuluh Darah) -->
  <path d="M 236,62 A 73 73 0 0 1 307,135 A 73 73 0 0 1 236,208" fill="none" stroke="#be123c" stroke-width="4.5" opacity="0.4"/>

  <!-- Lapisan Retina (Kuning Emas / Oranye di Bagian Belakang Dalam) -->
  <path d="M 236,64 A 71 71 0 0 1 305,135 A 71 71 0 0 1 236,206" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
  <!-- Fovea Centralis (Bintik Kuning) -->
  <ellipse cx="304" cy="135" rx="2" ry="4.5" fill="#dc2626"/>

  <!-- Saraf Optik (Nervus Optikus - Keluar ke Kanan) -->
  <path d="M 305,124 L 366,118 L 366,152 L 305,146 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
  <!-- Arteri & Vena Sentralis Retina -->
  <line x1="306" y1="132" x2="366" y2="132" stroke="#ef4444" stroke-width="1.8"/>
  <line x1="306" y1="138" x2="366" y2="138" stroke="#2563eb" stroke-width="1.8"/>

  <!-- Humor Vitreus (Cairan Bening Pengisi Bola Mata) -->
  <path d="M 210,135 Q 260,115 300,135 Q 260,155 210,135" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3 3"/>

  <!-- Berkas Sinar Cahaya Refraksi (Optik Pedagogis) -->
  <path d="M 95,120 L 140,130 L 198,135 L 304,135" fill="none" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="2 2" opacity="0.75"/>
  <path d="M 95,150 L 140,140 L 198,135 L 304,135" fill="none" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="2 2" opacity="0.75"/>

  <!-- Tonjolan Kornea (Kubah Transparan Cembung Depan) -->
  <path d="M 180,76 C 122,94 122,176 180,194" fill="url(#corneaGlowGrad)" stroke="#0284c7" stroke-width="2.6"/>
  <!-- Kilau Spekular Kornea -->
  <path d="M 172,88 C 140,105 138,135 146,145" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>

  <!-- Bilik Depan Bola Mata (Camera Anterior) -->
  <ellipse cx="168" cy="135" rx="12" ry="38" fill="#e0f2fe" fill-opacity="0.3"/>

  <!-- Badan Silier (Ciliary Body) & Serabut Zonula -->
  <rect x="188" y="94" width="10" height="12" rx="2" fill="#92400e"/>
  <rect x="188" y="164" width="10" height="12" rx="2" fill="#92400e"/>
  <line x1="193" y1="106" x2="198" y2="114" stroke="#64748b" stroke-width="1.5"/>
  <line x1="193" y1="164" x2="198" y2="156" stroke="#64748b" stroke-width="1.5"/>

  <!-- Iris (Diafragma Berpigmen Atas & Bawah) -->
  <line x1="174" y1="86" x2="182" y2="118" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
  <line x1="174" y1="184" x2="182" y2="152" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
  <!-- Tekstur Iris -->
  <line x1="175" y1="92" x2="181" y2="116" stroke="#b45309" stroke-width="2"/>
  <line x1="175" y1="178" x2="181" y2="154" stroke="#b45309" stroke-width="2"/>

  <!-- Pupil (Celah Apertur Cahaya di Antara Iris) -->
  <line x1="182" y1="118" x2="182" y2="152" stroke="#0f172a" stroke-width="2.5" stroke-dasharray="2 2"/>

  <!-- Lensa Kristalin (Biconvex Transparan Berkualitas Tinggi) -->
  <ellipse cx="198" cy="135" rx="11" ry="26" fill="url(#lensEyeGrad)" stroke="#0284c7" stroke-width="2"/>
  <!-- Kilau Cembung Lensa -->
  <path d="M 194,120 Q 192,135 194,150" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>

  <!-- Callout Badges Rapi & Terproteksi (Anti-Overlap) -->
  <!-- 1. Kornea -->
  <g>
    <rect x="18" y="55" width="74" height="18" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.2"/>
    <text x="55" y="68" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">1. Kornea</text>
    <path d="M 92,64 L 140,112" stroke="#0284c7" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 2. Iris -->
  <g>
    <rect x="18" y="108" width="64" height="18" rx="4" fill="#ffffff" stroke="#78350f" stroke-width="1.2"/>
    <text x="50" y="121" text-anchor="middle" font-size="9" font-weight="bold" fill="#78350f">2. Iris</text>
    <line x1="82" y1="117" x2="175" y2="105" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 3. Lensa -->
  <g>
    <rect x="18" y="160" width="68" height="18" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.2"/>
    <text x="52" y="173" text-anchor="middle" font-size="9" font-weight="bold" fill="#0284c7">3. Lensa</text>
    <line x1="86" y1="169" x2="196" y2="148" stroke="#0284c7" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 4. Retina -->
  <g>
    <rect x="345" y="55" width="70" height="18" rx="4" fill="#ffffff" stroke="#f59e0b" stroke-width="1.2"/>
    <text x="380" y="68" text-anchor="middle" font-size="9" font-weight="bold" fill="#b45309">4. Retina</text>
    <path d="M 345,64 L 298,105" stroke="#f59e0b" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 5. Saraf Optik -->
  <g>
    <rect x="335" y="178" width="94" height="18" rx="4" fill="#ffffff" stroke="#ea580c" stroke-width="1.2"/>
    <text x="382" y="191" text-anchor="middle" font-size="9" font-weight="bold" fill="#c2410c">5. Saraf Optik</text>
    <path d="M 345,178 L 336,148" stroke="#ea580c" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- Dynamic Pointer Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="17" fill="none" stroke="#e11d48" stroke-width="1.8" opacity="0.4"/>
  <circle cx="${target.x}" cy="${target.y}" r="12.5" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#glowEye)"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Pedagogical Question Prompt -->
  <text x="225" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Bagian bola mata yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 1. Render Sistem Rangka Manusia */
export function renderRangkaManusiaSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'tengkorak').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 230, y: 55, name: 'Tulang Tengkorak' };
  if (pointer.includes('rusuk') || pointer.includes('dada') || pointer.includes('sternum')) target = { x: 230, y: 122, name: 'Tulang Rusuk' };
  else if (pointer.includes('belakang') || pointer.includes('punggung') || pointer.includes('vertebra') || pointer.includes('spine')) target = { x: 230, y: 156, name: 'Tulang Belakang' };
  else if (pointer.includes('lengan') || pointer.includes('humerus')) target = { x: 176, y: 128, name: 'Tulang Lengan Atas' };
  else if (pointer.includes('panggul') || pointer.includes('pinggul') || pointer.includes('pelvis')) target = { x: 230, y: 184, name: 'Tulang Panggul' };
  else if (pointer.includes('paha') || pointer.includes('femur')) target = { x: 204, y: 226, name: 'Tulang Paha' };
  else if (pointer.includes('kering') || pointer.includes('betis') || pointer.includes('tibia') || pointer.includes('fibula')) target = { x: 204, y: 270, name: 'Tulang Kering / Betis' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 320" width="460" height="320" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="boneStructureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="pelvisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <filter id="glowRangka" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Border Container -->
  <rect width="460" height="320" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Title Header -->
  <text x="230" y="20" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Sistem Rangka Tubuh Manusia</text>

  <!-- Siluet Rangka Anatomi Presisi Enterprise (Sumbu Simetris x=230) -->

  <!-- 1. TENGKORAK (Cranium & Mandible) -->
  <!-- Tempurung Kepala (Neurocranium) -->
  <path d="M 214,40 C 214,26 246,26 246,40 C 251,46 250,56 245,62 L 243,68 C 242,73 238,76 230,76 C 222,76 218,73 217,68 L 215,62 C 210,56 209,46 214,40 Z" fill="url(#boneStructureGrad)" stroke="#475569" stroke-width="1.8"/>
  <!-- Rongga Mata (Orbita) -->
  <ellipse cx="223" cy="48" rx="4.2" ry="4.8" fill="#334155"/>
  <ellipse cx="237" cy="48" rx="4.2" ry="4.8" fill="#334155"/>
  <!-- Rongga Hidung (Cavum Nasi) -->
  <path d="M 230,54 L 228,60 L 232,60 Z" fill="#475569"/>
  <!-- Tulang Rahang Bawah (Mandibula) -->
  <path d="M 221,68 Q 230,74 239,68" fill="none" stroke="#475569" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="225" y1="64" x2="235" y2="64" stroke="#64748b" stroke-width="1.2"/>

  <!-- 2. TULANG LEHER (Vertebra Cervicalis) -->
  <path d="M 228,76 L 232,76 M 227,80 L 233,80 M 227,84 L 233,84" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>

  <!-- 3. TULANG SELANGKA & PUNDAK (Clavicula & Scapula) -->
  <path d="M 194,88 Q 212,84 230,87 Q 248,84 266,88" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
  <!-- Scapula (Tulang Belikat) kiri & kanan -->
  <path d="M 198,92 L 188,108 L 204,104 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.4"/>
  <path d="M 262,92 L 272,108 L 256,104 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.4"/>

  <!-- 4. TULANG DADA & RUSUK (Sternum & Costa / Thorax) -->
  <!-- Tulang Dada (Sternum: Manubrium & Korpus) -->
  <rect x="228" y="88" width="4" height="38" rx="1.5" fill="#334155"/>
  <!-- Lengkung Tulang Rusuk (True & False Ribs) -->
  <path d="M 228,93 C 205,92 202,104 228,104 M 232,93 C 255,92 258,104 232,104" fill="none" stroke="#64748b" stroke-width="2"/>
  <path d="M 228,101 C 200,100 198,114 228,114 M 232,101 C 260,100 262,114 232,114" fill="none" stroke="#64748b" stroke-width="2"/>
  <path d="M 228,109 C 196,108 194,124 228,124 M 232,109 C 264,108 266,124 232,124" fill="none" stroke="#64748b" stroke-width="2"/>
  <path d="M 228,117 C 200,118 198,134 228,134 M 232,117 C 260,118 262,134 232,134" fill="none" stroke="#64748b" stroke-width="2"/>
  <path d="M 228,124 Q 210,138 226,141 M 232,124 Q 250,138 234,141" fill="none" stroke="#64748b" stroke-width="1.8"/>

  <!-- 5. TULANG BELAKANG (Columna Vertebralis) -->
  <line x1="230" y1="126" x2="230" y2="175" stroke="#334155" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Ruas-ruas vertebra lumbalis -->
  <path d="M 226,144 L 234,144 M 226,152 L 234,152 M 226,160 L 234,160 M 226,168 L 234,168" stroke="#94a3b8" stroke-width="1.5"/>

  <!-- 6. ANGGOTA GERAK ATAS (Lengan Kiri & Kanan) -->
  <!-- Lengan Atas (Humerus) -->
  <line x1="192" y1="90" x2="176" y2="128" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
  <line x1="268" y1="90" x2="284" y2="128" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
  <!-- Sendi Siku -->
  <circle cx="176" cy="129" r="3.2" fill="#94a3b8"/>
  <circle cx="284" cy="129" r="3.2" fill="#94a3b8"/>
  <!-- Lengan Bawah (Radius & Ulna) -->
  <line x1="175" y1="131" x2="162" y2="166" stroke="#64748b" stroke-width="2.6" stroke-linecap="round"/>
  <line x1="178" y1="131" x2="166" y2="166" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
  <line x1="285" y1="131" x2="298" y2="166" stroke="#64748b" stroke-width="2.6" stroke-linecap="round"/>
  <line x1="282" y1="131" x2="294" y2="166" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
  <!-- Tulang Pergelangan & Jari Tangan -->
  <path d="M 164,167 L 158,180 M 162,168 L 156,182 M 166,168 L 160,182" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 296,167 L 302,180 M 298,168 L 304,182 M 294,168 L 300,182" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>

  <!-- 7. GELANG PANGGUL (Pelvis) -->
  <path d="M 206,166 C 206,182 216,192 230,192 C 244,192 254,182 254,166 C 246,162 238,172 230,172 C 222,172 214,162 206,166 Z" fill="url(#pelvisGrad)" stroke="#334155" stroke-width="2"/>
  <ellipse cx="230" cy="180" rx="9" ry="6" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>

  <!-- 8. ANGGOTA GERAK BAWAH (Tungkai Kaki) -->
  <!-- Tulang Paha (Femur) -->
  <line x1="216" y1="188" x2="204" y2="234" stroke="#475569" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="244" y1="188" x2="256" y2="234" stroke="#475569" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Tempurung Lutut (Patella) -->
  <circle cx="204" cy="235" r="4.2" fill="#94a3b8" stroke="#475569" stroke-width="1.4"/>
  <circle cx="256" cy="235" r="4.2" fill="#94a3b8" stroke="#475569" stroke-width="1.4"/>
  <!-- Tulang Kering & Tulang Betis (Tibia & Fibula) -->
  <line x1="203" y1="239" x2="201" y2="278" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="208" y1="240" x2="207" y2="277" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
  <line x1="257" y1="239" x2="259" y2="278" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="252" y1="240" x2="253" y2="277" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
  <!-- Pergelangan & Telapak Kaki -->
  <path d="M 200,279 L 191,288 L 204,288 Z" fill="#e2e8f0" stroke="#475569" stroke-width="1.6"/>
  <path d="M 260,279 L 269,288 L 256,288 Z" fill="#e2e8f0" stroke="#475569" stroke-width="1.6"/>

  <!-- Callout Labels Kiri (Anti-Overlap) -->
  <!-- 1. Tengkorak -->
  <g>
    <rect x="14" y="44" width="86" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="57" y="57" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Tengkorak</text>
    <line x1="100" y1="53" x2="212" y2="52" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <!-- 2. Lengan Atas -->
  <g>
    <rect x="14" y="106" width="94" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="61" y="119" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Tulang Lengan Atas</text>
    <line x1="108" y1="115" x2="176" y2="120" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <!-- 3. Tulang Paha -->
  <g>
    <rect x="14" y="196" width="88" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="58" y="209" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Tulang Paha</text>
    <line x1="102" y1="205" x2="204" y2="218" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>

  <!-- Callout Labels Kanan (Anti-Overlap) -->
  <!-- 1. Tulang Rusuk -->
  <g>
    <rect x="350" y="96" width="94" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="397" y="109" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Tulang Rusuk</text>
    <line x1="350" y1="105" x2="258" y2="114" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <!-- 2. Tulang Belakang -->
  <g>
    <rect x="345" y="146" width="98" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="394" y="159" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Tulang Belakang</text>
    <line x1="345" y1="155" x2="234" y2="155" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <!-- 3. Tulang Panggul -->
  <g>
    <rect x="350" y="190" width="94" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="397" y="203" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Tulang Panggul</text>
    <line x1="350" y1="196" x2="254" y2="178" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>
  <!-- 4. Tulang Kering & Betis -->
  <g>
    <rect x="345" y="246" width="102" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="396" y="259" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">Kering &amp; Betis</text>
    <line x1="345" y1="255" x2="258" y2="258" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  </g>

  <!-- Dynamic Pointer Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="17" fill="none" stroke="#e11d48" stroke-width="1.8" opacity="0.4"/>
  <circle cx="${target.x}" cy="${target.y}" r="12.5" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#glowRangka)"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Pedagogical Question Prompt -->
  <text x="230" y="308" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian rangka yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
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
    { x: 15, y: 38, w: 240, h: 128 },
    { x: 265, y: 38, w: 240, h: 128 },
    { x: 15, y: 176, w: 240, h: 128 },
    { x: 265, y: 176, w: 240, h: 128 }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 330" width="520" height="330" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="jointBoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <filter id="glowSendi" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Container Border -->
  <rect width="520" height="330" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Title -->
  <text x="260" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Macam-Macam Sendi Gerak (Diartrosis)</text>

  <!-- Panel 1: Sendi Engsel (Top-Left) -->
  <rect x="15" y="38" width="240" height="128" rx="8" fill="${activeIdx === 0 ? '#fff1f2' : '#f8fafc'}" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="26" y="56" font-size="11" font-weight="bold" fill="${activeIdx === 0 ? '#be123c' : '#0369a1'}">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Sendi Engsel` : 'Sendi Engsel'}</text>
  
  <!-- Ilustrasi Anatomi Sendi Engsel (Humeroulnar joint) -->
  <!-- Tulang Atas (Humerus dengan Trochlea) -->
  <path d="M 40,70 L 60,70 L 60,86 C 60,96 40,96 40,86 Z" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <!-- Lapisan Tulang Rawan (Articular Cartilage) -->
  <path d="M 40,86 C 40,96 60,96 60,86" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <!-- Tulang Bawah (Ulna dengan Fossa Trochlearis) -->
  <path d="M 34,92 C 34,106 66,106 66,92 L 72,112 L 52,118 L 34,92 Z" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <!-- Poros / Pin Engsel -->
  <circle cx="50" cy="88" r="3.5" fill="#0284c7" stroke="#ffffff" stroke-width="1"/>
  <!-- Panah Gerak 1 Arah (Fleksi/Ekstensi) -->
  <path d="M 72,82 Q 86,96 76,112" fill="none" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round"/>
  <polygon points="73,112 79,114 78,106" fill="#e11d48"/>
  <!-- Keterangan -->
  <text x="110" y="80" font-size="9.5" font-weight="bold" fill="#334155">Gerak 1 Arah</text>
  <text x="110" y="96" font-size="8.5" fill="#64748b">Fleksi &amp; Ekstensi</text>
  <text x="110" y="112" font-size="8.5" font-weight="600" fill="#0284c7">Contoh: Siku &amp; Lutut</text>

  <!-- Panel 2: Sendi Peluru (Top-Right) -->
  <rect x="265" y="38" width="240" height="128" rx="8" fill="${activeIdx === 1 ? '#fff1f2' : '#f8fafc'}" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="276" y="56" font-size="11" font-weight="bold" fill="${activeIdx === 1 ? '#be123c' : '#0369a1'}">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Sendi Peluru` : 'Sendi Peluru'}</text>
  
  <!-- Ilustrasi Anatomi Sendi Peluru (Ball & Socket: Glenohumeral) -->
  <!-- Mangkok Sendi (Socket / Cavitas Glenoidalis) -->
  <path d="M 285,68 C 305,68 305,110 285,110 L 285,68 Z" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <path d="M 286,72 C 302,76 302,102 286,106" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <!-- Kepala Tulang Bulat (Ball / Caput) -->
  <circle cx="304" cy="89" r="13" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <line x1="317" y1="89" x2="340" y2="89" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
  <!-- Panah Gerak Segala Arah (Rotasi 3D) -->
  <ellipse cx="328" cy="89" rx="10" ry="18" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2"/>
  <polygon points="338,82 340,74 332,77" fill="#e11d48"/>
  <!-- Keterangan -->
  <text x="365" y="80" font-size="9.5" font-weight="bold" fill="#334155">Segala Arah</text>
  <text x="365" y="96" font-size="8.5" fill="#64748b">Bebas (Multiaxial)</text>
  <text x="365" y="112" font-size="8.5" font-weight="600" fill="#0284c7">Contoh: Bahu &amp; Panggul</text>

  <!-- Panel 3: Sendi Putar (Bottom-Left) -->
  <rect x="15" y="176" width="240" height="128" rx="8" fill="${activeIdx === 2 ? '#fff1f2' : '#f8fafc'}" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="26" y="194" font-size="11" font-weight="bold" fill="${activeIdx === 2 ? '#be123c' : '#0369a1'}">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Sendi Putar` : 'Sendi Putar'}</text>
  
  <!-- Ilustrasi Anatomi Sendi Putar (Atlantoaxial / Pivot) -->
  <!-- Cincin Tulang (Ring / Atlas) -->
  <ellipse cx="58" cy="226" rx="20" ry="10" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <!-- Poros Tulang Pusat (Dens Axis) -->
  <ellipse cx="58" cy="224" rx="7" ry="4" fill="#0284c7"/>
  <path d="M 51,224 L 51,250 C 51,254 65,254 65,250 L 65,224 Z" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <!-- Panah Gerak Berputar Melingkar -->
  <path d="M 40,228 A 20 8 0 1 0 76,228" fill="none" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round"/>
  <polygon points="76,228 80,221 72,224" fill="#e11d48"/>
  <!-- Keterangan -->
  <text x="110" y="218" font-size="9.5" font-weight="bold" fill="#334155">Gerak Berputar</text>
  <text x="110" y="234" font-size="8.5" fill="#64748b">Rotasi pada 1 Poros</text>
  <text x="110" y="250" font-size="8.5" font-weight="600" fill="#0284c7">Contoh: Leher &amp; Tengkorak</text>

  <!-- Panel 4: Sendi Pelana (Bottom-Right) -->
  <rect x="265" y="176" width="240" height="128" rx="8" fill="${activeIdx === 3 ? '#fff1f2' : '#f8fafc'}" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="276" y="194" font-size="11" font-weight="bold" fill="${activeIdx === 3 ? '#be123c' : '#0369a1'}">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Sendi Pelana` : 'Sendi Pelana'}</text>
  
  <!-- Ilustrasi Anatomi Sendi Pelana (Carpometacarpal Pollicis / Saddle) -->
  <!-- Permukaan Pelana Bawah (Concave-Convex) -->
  <path d="M 288,230 Q 306,218 324,230 L 324,250 Q 306,238 288,250 Z" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <!-- Permukaan Pelana Atas (Menunggang) -->
  <path d="M 294,226 Q 306,236 318,226 L 318,206 Q 306,216 294,206 Z" fill="url(#jointBoneGrad)" stroke="#475569" stroke-width="1.6"/>
  <circle cx="306" cy="226" r="3.5" fill="#0284c7"/>
  <!-- Panah Gerak 2 Arah Silang -->
  <path d="M 292,216 Q 306,210 320,216" fill="none" stroke="#e11d48" stroke-width="1.8"/>
  <path d="M 294,244 Q 306,248 318,244" fill="none" stroke="#e11d48" stroke-width="1.8"/>
  <polygon points="320,216 314,213 318,220" fill="#e11d48"/>
  <!-- Keterangan -->
  <text x="365" y="218" font-size="9.5" font-weight="bold" fill="#334155">Gerak 2 Arah</text>
  <text x="365" y="234" font-size="8.5" fill="#64748b">Biaxial (2 Bidang Sumbu)</text>
  <text x="365" y="250" font-size="8.5" font-weight="600" fill="#0284c7">Contoh: Pangkal Ibu Jari</text>

  <!-- Dynamic Target Badge [X] pada Panel Terpilih -->
  <circle cx="${cards[activeIdx].x + cards[activeIdx].w - 20}" cy="${cards[activeIdx].y + 18}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#glowSendi)"/>
  <text x="${cards[activeIdx].x + cards[activeIdx].w - 20}" y="${cards[activeIdx].y + 22.5}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <!-- Pedagogical Question Prompt -->
  <text x="260" y="320" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Jenis persendian yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// 9. Alat Ekskresi Ginjal Manusia
export function renderAlatEkskresiGinjalSvg(params: AlatEkskresiGinjalParams): string {
  const pointer = String(params.bagian || params.pointer || 'korteks').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'korteks', name: 'Korteks Ginjal (Penyaringan)', x: 175, y: 90 },
    { id: 'medula', name: 'Medula (Piramida Ginjal)', x: 205, y: 148 },
    { id: 'pelvis', name: 'Pelvis Renalis (Rongga Ginjal)', x: 265, y: 165 },
    { id: 'ureter', name: 'Saluran Ureter (Ke Kandung Kemih)', x: 288, y: 260 },
    { id: 'arteri', name: 'Arteri & Vena Renalis', x: 300, y: 135 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="kidneyOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#be123c"/>
      <stop offset="60%" stop-color="#9f1239"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
    <linearGradient id="cortexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <linearGradient id="pyramidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fda4af"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <linearGradient id="pelvisTubeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#fde047"/>
    </linearGradient>
    <filter id="glowKidney" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Container Border -->
  <rect width="540" height="340" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Title -->
  <text x="270" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Struktur Anatomi Organ Ekskresi Ginjal Manusia</text>

  <!-- Siluet Irisan Melintang Ginjal (Kiri-Tengah Kanvas) -->
  <!-- 1. Kapsul Fibrosa Luar Ginjal -->
  <path d="M 180,42 C 110,48 90,140 120,225 C 145,290 225,295 270,270 C 295,255 295,210 270,185 C 240,155 242,120 280,88 C 255,50 215,40 180,42 Z" fill="url(#kidneyOuterGrad)" stroke="#4c0519" stroke-width="3"/>

  <!-- 2. Korteks Renalis (Zona Luar Bergranula Tempat Badan Malpighi) -->
  <path d="M 182,50 C 120,56 102,142 128,218 C 150,278 220,282 258,260 C 275,248 268,212 250,192 C 228,168 228,118 268,94 C 246,62 212,50 182,50 Z" fill="url(#cortexGrad)" stroke="#be123c" stroke-width="1.5" opacity="0.9"/>
  <!-- Tekstur Stipple Bintik Nefron pada Korteks -->
  <path d="M 135,100 L 136,100 M 145,80 L 146,80 M 165,65 L 166,65 M 125,140 L 126,140 M 130,175 L 131,175 M 145,210 L 146,210 M 175,250 L 176,250 M 215,268 L 216,268" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

  <!-- 3. Medula Renalis (7 Piramida Ginjal / Pyramides Renales Bergaris Radial) -->
  <!-- Piramida 1 (Atas) -->
  <path d="M 175,68 L 205,80 L 188,102 Z" fill="url(#pyramidGrad)" stroke="#be123c" stroke-width="1.2"/>
  <line x1="190" y1="74" x2="188" y2="102" stroke="#e11d48" stroke-width="0.8" stroke-dasharray="1 1"/>
  <!-- Piramida 2 -->
  <path d="M 148,92 L 182,106 L 168,126 Z" fill="url(#pyramidGrad)" stroke="#be123c" stroke-width="1.2"/>
  <line x1="165" y1="99" x2="168" y2="126" stroke="#e11d48" stroke-width="0.8" stroke-dasharray="1 1"/>
  <!-- Piramida 3 (Tengah Atas) -->
  <path d="M 136,134 L 172,138 L 164,158 Z" fill="url(#pyramidGrad)" stroke="#be123c" stroke-width="1.2"/>
  <!-- Piramida 4 (Tengah Bawah) -->
  <path d="M 138,172 L 175,166 L 172,188 Z" fill="url(#pyramidGrad)" stroke="#be123c" stroke-width="1.2"/>
  <!-- Piramida 5 -->
  <path d="M 152,210 L 188,194 L 190,218 Z" fill="url(#pyramidGrad)" stroke="#be123c" stroke-width="1.2"/>
  <!-- Piramida 6 (Bawah) -->
  <path d="M 180,244 L 210,218 L 218,242 Z" fill="url(#pyramidGrad)" stroke="#be123c" stroke-width="1.2"/>
  <!-- Piramida 7 (Bawah Kanan) -->
  <path d="M 226,260 L 234,228 L 250,246 Z" fill="url(#pyramidGrad)" stroke="#be123c" stroke-width="1.2"/>

  <!-- Kolumna Bertini (Pilar Korteks Antar Piramida) -->
  <line x1="172" y1="88" x2="155" y2="98" stroke="#fda4af" stroke-width="1.5"/>
  <line x1="155" y1="130" x2="140" y2="135" stroke="#fda4af" stroke-width="1.5"/>

  <!-- 4. Kaliks Minor & Kaliks Mayor (Cawan Penampung Urin) -->
  <path d="M 188,102 Q 220,120 236,140 M 168,126 Q 210,135 236,145 M 164,158 Q 212,158 238,158 M 172,188 Q 215,178 242,172 M 190,218 Q 225,200 248,185 M 218,242 Q 236,218 250,192" fill="none" stroke="#fde047" stroke-width="2.5" stroke-linecap="round"/>

  <!-- 5. Pelvis Renalis (Rongga Corong Utama Ginjal) -->
  <path d="M 236,138 C 255,130 270,145 272,165 C 274,185 260,195 248,195 C 235,195 232,145 236,138 Z" fill="url(#pelvisTubeGrad)" stroke="#ca8a04" stroke-width="2"/>

  <!-- 6. Ureter (Saluran Penyalur Urin ke Kandung Kemih) -->
  <path d="M 262,185 Q 282,215 288,295 L 304,292 Q 298,218 274,180 Z" fill="url(#pelvisTubeGrad)" stroke="#ca8a04" stroke-width="2"/>
  <path d="M 276,195 Q 292,230 296,290" fill="none" stroke="#eab308" stroke-width="1.5" stroke-dasharray="3 2"/>

  <!-- 7. Arteri Renalis & Vena Renalis (Pembuluh Darah Hilum) -->
  <!-- Vena Renalis (Biru) -->
  <path d="M 260,156 Q 310,150 338,144 L 340,158 Q 308,164 262,170 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
  <!-- Arteri Renalis (Merah) -->
  <path d="M 258,138 Q 315,128 342,122 L 344,136 Q 312,142 260,150 Z" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>

  <!-- 8. Inset Nefron Mikroskopis (Pojok Kanan Atas) -->
  <g>
    <rect x="375" y="44" width="150" height="116" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="450" y="60" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Nefron (Unit Penyaring)</text>
    <!-- Glomerulus & Kapsula Bowman -->
    <circle cx="400" cy="80" r="10" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
    <circle cx="400" cy="80" r="5.5" fill="#ef4444"/>
    <text x="400" y="100" text-anchor="middle" font-size="7.5" font-weight="600" fill="#991b1b">Glomerulus</text>
    <!-- Tubulus Nefron & Lengkung Henle -->
    <path d="M 410,80 Q 430,72 445,82 Q 448,110 458,110 Q 468,110 470,82 L 495,82" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>
    <path d="M 495,74 L 495,130" stroke="#ca8a04" stroke-width="3" stroke-linecap="round"/>
    <text x="475" y="138" text-anchor="middle" font-size="7.5" fill="#64748b">Tubulus Kolektivus</text>
  </g>

  <!-- Callout Labels Kiri (Anti-Overlap) -->
  <!-- 1. Korteks Ginjal -->
  <g>
    <rect x="14" y="60" width="130" height="20" rx="4" fill="#ffffff" stroke="#e11d48" stroke-width="1.2"/>
    <text x="79" y="74" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#be123c">1. Korteks (Penyaringan)</text>
    <line x1="144" y1="70" x2="175" y2="88" stroke="#e11d48" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 2. Medula Ginjal -->
  <g>
    <rect x="14" y="125" width="130" height="20" rx="4" fill="#ffffff" stroke="#be123c" stroke-width="1.2"/>
    <text x="79" y="139" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#9f1239">2. Medula (Piramida)</text>
    <line x1="144" y1="135" x2="195" y2="148" stroke="#be123c" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 3. Kapsul Ginjal -->
  <g>
    <rect x="14" y="190" width="130" height="20" rx="4" fill="#ffffff" stroke="#4c0519" stroke-width="1.2"/>
    <text x="79" y="204" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#4c0519">3. Kapsul Fibrosa Luar</text>
    <line x1="144" y1="200" x2="130" y2="225" stroke="#4c0519" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- Callout Labels Kanan (Anti-Overlap) -->
  <!-- 4. Pelvis Renalis -->
  <g>
    <rect x="375" y="180" width="150" height="20" rx="4" fill="#ffffff" stroke="#ca8a04" stroke-width="1.2"/>
    <text x="450" y="194" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#854d0e">4. Pelvis Renalis (Rongga)</text>
    <line x1="375" y1="190" x2="274" y2="168" stroke="#ca8a04" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 5. Ureter -->
  <g>
    <rect x="375" y="238" width="150" height="20" rx="4" fill="#ffffff" stroke="#eab308" stroke-width="1.2"/>
    <text x="450" y="252" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#713f12">5. Saluran Ureter (Ke Kemih)</text>
    <line x1="375" y1="248" x2="295" y2="260" stroke="#eab308" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- Dynamic Target Badge [X] -->
  <circle cx="${target.x}" cy="${target.y}" r="17" fill="none" stroke="#e11d48" stroke-width="1.8" opacity="0.4"/>
  <circle cx="${target.x}" cy="${target.y}" r="12.5" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#glowKidney)"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <!-- Pedagogical Question Prompt -->
  <text x="270" y="322" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian ginjal yang bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 11. Indra Pengecap Lidah (Peta Rasa)
export function renderIndraPengecapLidahSvg(params: IndraPengecapLidahParams): string {
  const pointer = String(params.rasa || params.pointer || 'manis').toLowerCase();
  const labelChar = params.label || 'X';

  const regions = [
    { id: 'pahit', name: 'Pahit', x: 195, y: 88 },
    { id: 'asam', name: 'Asam', x: 130, y: 145 },
    { id: 'asin', name: 'Asin', x: 138, y: 205 },
    { id: 'manis', name: 'Manis', x: 195, y: 258 },
    { id: 'umami', name: 'Umami', x: 195, y: 165 }
  ];

  let target = regions.find(r => pointer.includes(r.id)) || regions[3];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <linearGradient id="tongueBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fecaca"/>
      <stop offset="60%" stop-color="#fca5a5"/>
      <stop offset="100%" stop-color="#f87171"/>
    </linearGradient>
    <filter id="glowTongue" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e11d48" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Container Border -->
  <rect width="540" height="340" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>

  <!-- Title -->
  <text x="270" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Peta Daerah Rasa &amp; Papila Indra Pengecap Lidah</text>

  <!-- Siluet Anatomi Lidah Manusia (Dorsum Linguae) -->
  <!-- Pangkal & Badan Lidah -->
  <path d="M 130,55 C 130,36 260,36 260,55 C 285,115 272,225 195,274 C 118,225 105,115 130,55 Z" fill="url(#tongueBodyGrad)" stroke="#e11d48" stroke-width="2.5"/>

  <!-- Sulkus Medianus (Lekukan Garis Tengah Lidah) -->
  <path d="M 195,60 L 195,245" stroke="#ef4444" stroke-width="1.6" stroke-dasharray="3 3"/>

  <!-- Sulkus Terminalis (Lekuk Berbentuk Huruf V pada Pangkal Lidah) -->
  <path d="M 145,74 Q 195,98 245,74" fill="none" stroke="#be123c" stroke-width="2.2"/>

  <!-- 1. ZONA PAHIT (Pangkal Belakang Lidah) -->
  <path d="M 148,72 Q 195,96 242,72 C 238,55 152,55 148,72 Z" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5" opacity="0.85"/>
  <!-- Papila Sirkumvalata (Bulatan Berjejer di Huruf V) -->
  <circle cx="160" cy="74" r="3" fill="#b91c1c"/>
  <circle cx="178" cy="81" r="3" fill="#b91c1c"/>
  <circle cx="195" cy="85" r="3.5" fill="#b91c1c"/>
  <circle cx="212" cy="81" r="3" fill="#b91c1c"/>
  <circle cx="230" cy="74" r="3" fill="#b91c1c"/>

  <!-- 2. ZONA ASAM (Tepi Samping Kiri & Kanan Belakang) -->
  <path d="M 124,106 C 118,140 128,168 145,178 C 152,168 148,126 142,106 Z" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5" opacity="0.9"/>
  <path d="M 266,106 C 272,140 262,168 245,178 C 238,168 242,126 248,106 Z" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5" opacity="0.9"/>

  <!-- 3. ZONA ASIN (Tepi Samping Kiri & Kanan Depan) -->
  <path d="M 132,175 C 142,212 165,242 178,252 C 172,238 156,205 146,175 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" opacity="0.9"/>
  <path d="M 258,175 C 248,212 225,242 212,252 C 218,238 234,205 244,175 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" opacity="0.9"/>

  <!-- 4. ZONA MANIS (Ujung Depan Lidah) -->
  <path d="M 166,242 C 180,268 210,268 224,242 C 205,248 185,248 166,242 Z" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" opacity="0.9"/>

  <!-- 5. ZONA UMAMI (Bagian Tengah Lidah - Gurih) -->
  <ellipse cx="195" cy="165" rx="28" ry="24" fill="#f3e8ff" stroke="#9333ea" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.85"/>
  <text x="195" y="169" text-anchor="middle" font-size="8.5" font-weight="600" fill="#7e22ce">Umami (Gurih)</text>

  <!-- Bintik Papila Fungiformis & Filiformis Tersebar -->
  <circle cx="170" cy="225" r="1.5" fill="#e11d48"/>
  <circle cx="220" cy="225" r="1.5" fill="#e11d48"/>
  <circle cx="185" cy="205" r="1.5" fill="#e11d48"/>
  <circle cx="205" cy="205" r="1.5" fill="#e11d48"/>

  <!-- Inset Penampang Kuncup Pengecap (Taste Bud) di Pojok Kanan -->
  <g>
    <rect x="365" y="52" width="160" height="155" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="445" y="70" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Kuncup Pengecap (Taste Bud)</text>
    <!-- Lapisan Epitel Papila -->
    <path d="M 380,84 C 410,84 415,96 445,96 C 475,96 480,84 510,84" fill="none" stroke="#f43f5e" stroke-width="2"/>
    <!-- Pori Pengecap (Taste Pore) -->
    <ellipse cx="445" cy="98" rx="5" ry="3" fill="#991b1b"/>
    <!-- Sel Reseptor Pengecap Berbentuk Bawang -->
    <path d="M 445,98 C 420,115 422,155 445,160 C 468,155 470,115 445,98 Z" fill="#fee2e2" stroke="#e11d48" stroke-width="1.5"/>
    <!-- Mikrovili / Rambut Pengecap Menjulur Keluar Pori -->
    <line x1="443" y1="98" x2="442" y2="92" stroke="#dc2626" stroke-width="1.2"/>
    <line x1="445" y1="98" x2="445" y2="90" stroke="#dc2626" stroke-width="1.2"/>
    <line x1="447" y1="98" x2="448" y2="92" stroke="#dc2626" stroke-width="1.2"/>
    <!-- Serabut Saraf Gustatori Keluar ke Bawah -->
    <path d="M 440,160 Q 436,180 430,192 M 450,160 Q 454,180 460,192" fill="none" stroke="#eab308" stroke-width="1.8"/>
    <text x="445" y="174" text-anchor="middle" font-size="7.5" fill="#64748b">Serabut Saraf Sensorik</text>
  </g>

  <!-- Callout Labels Kiri (Anti-Overlap) -->
  <!-- 1. Rasa Pahit -->
  <g>
    <rect x="14" y="65" width="105" height="20" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="1.2"/>
    <text x="66" y="79" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#b91c1c">Pahit (Pangkal)</text>
    <line x1="119" y1="75" x2="162" y2="82" stroke="#dc2626" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 2. Rasa Asam -->
  <g>
    <rect x="14" y="120" width="105" height="20" rx="4" fill="#ffffff" stroke="#ea580c" stroke-width="1.2"/>
    <text x="66" y="134" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#c2410c">Asam (Tepi Belakang)</text>
    <line x1="119" y1="130" x2="135" y2="140" stroke="#ea580c" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 3. Rasa Asin -->
  <g>
    <rect x="14" y="178" width="105" height="20" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.2"/>
    <text x="66" y="192" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0369a1">Asin (Tepi Depan)</text>
    <line x1="119" y1="188" x2="142" y2="200" stroke="#0284c7" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- 4. Rasa Manis -->
  <g>
    <rect x="14" y="235" width="105" height="20" rx="4" fill="#ffffff" stroke="#16a34a" stroke-width="1.2"/>
    <text x="66" y="249" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#15803d">Manis (Ujung Depan)</text>
    <line x1="119" y1="245" x2="176" y2="255" stroke="#16a34a" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- Dynamic Target Badge [X] -->
  <circle cx="${target.x}" cy="${target.y}" r="17" fill="none" stroke="#e11d48" stroke-width="1.8" opacity="0.4"/>
  <circle cx="${target.x}" cy="${target.y}" r="12.5" fill="#e11d48" stroke="#ffffff" stroke-width="2.5" filter="url(#glowTongue)"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <!-- Pedagogical Question Prompt -->
  <text x="270" y="322" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Sensasi rasa yang paling peka pada huruf "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 12. Indra Pembau Hidung (Anatomi Olfaktori)
export function renderIndraPembauHidungSvg(params: IndraPembauHidungParams): string {
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
