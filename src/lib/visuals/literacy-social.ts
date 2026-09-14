/**
 * literacy-social.ts
 * Visual Stimulus SVG Renderers for Language, Civics/Pancasila, Sports (PJOK), Arts (SBdP), English, and Robotics/Coding
 */

import { escapeXml } from './types';

/**
 * 1. Render Rambu Lalu Lintas (Traffic & Safety Signs)
 * Kategori: Larangan (Merah), Perintah (Biru), Peringatan (Kuning), Petunjuk (Hijau/Biru)
 */
export function renderRambuLaluLintasSvg(params: {
  kategori?: 'larangan' | 'perintah' | 'peringatan' | 'petunjuk';
  jenis?: string; // 'stop', 'dilarang_parkir', 'wajib_belok_kiri', 'tikungan_tajam', 'penyeberangan', 'rumah_sakit'
  label?: string;
}): string {
  const kategori = (params.kategori || 'larangan').toLowerCase();
  const jenis = (params.jenis || (kategori === 'peringatan' ? 'tikungan_tajam' : kategori === 'perintah' ? 'wajib_belok_kiri' : kategori === 'petunjuk' ? 'rumah_sakit' : 'dilarang_parkir')).toLowerCase();
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 115;

  let signGraphic = '';
  let deskripsiRambu = 'Rambu Lalu Lintas';

  if (kategori === 'peringatan' || jenis.includes('tikungan') || jenis.includes('penyeberangan')) {
    deskripsiRambu = 'Rambu Peringatan (Kuning)';
    // Belah Ketupat Kuning
    signGraphic = `
      <polygon points="${cx},${cy - 70} ${cx + 70},${cy} ${cx},${cy + 70} ${cx - 70},${cy}" fill="#f59e0b" stroke="#0f172a" stroke-width="4"/>
      <polygon points="${cx},${cy - 64} ${cx + 64},${cy} ${cx},${cy + 64} ${cx - 64},${cy}" fill="#fbbf24" stroke="#0f172a" stroke-width="1"/>
      ${jenis.includes('penyeberangan') ? `
        <!-- Ikon Pejalan Kaki Menyeberang -->
        <circle cx="${cx}" cy="${cy - 26}" r="7" fill="#0f172a"/>
        <path d="M ${cx - 10},${cy + 15} L ${cx},${cy - 12} L ${cx + 12},${cy + 12} L ${cx + 6},${cy + 28}" fill="none" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round"/>
        <line x1="${cx - 30}" y1="${cy + 30}" x2="${cx + 30}" y2="${cy + 30}" stroke="#0f172a" stroke-width="3.5"/>
      ` : `
        <!-- Ikon Tikungan Tajam ke Kanan -->
        <path d="M ${cx - 15},${cy + 35} L ${cx - 15},${cy - 5} Q ${cx - 15},${cy - 30} ${cx + 15},${cy - 30}" fill="none" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
        <polygon points="${cx + 10},${cy - 42} ${cx + 28},${cy - 30} ${cx + 10},${cy - 18}" fill="#0f172a"/>
      `}
    `;
  } else if (kategori === 'perintah' || jenis.includes('wajib')) {
    deskripsiRambu = 'Rambu Perintah (Biru)';
    // Lingkaran Biru
    signGraphic = `
      <circle cx="${cx}" cy="${cy}" r="66" fill="#0284c7" stroke="#0f172a" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="61" fill="none" stroke="#ffffff" stroke-width="2.5"/>
      <!-- Panah Wajib Belok Kiri Putih -->
      <path d="M ${cx + 25},${cy + 25} L ${cx + 25},${cy - 5} Q ${cx + 25},${cy - 22} ${cx - 5},${cy - 22} L ${cx - 12},${cy - 22}" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
      <polygon points="${cx - 6},${cy - 34} ${cx - 26},${cy - 22} ${cx - 6},${cy - 10}" fill="#ffffff"/>
    `;
  } else if (kategori === 'petunjuk' || jenis.includes('rumah_sakit')) {
    deskripsiRambu = 'Rambu Petunjuk (Hijau/Biru)';
    // Persegi Biru
    signGraphic = `
      <rect x="${cx - 55}" y="${cy - 55}" width="110" height="110" rx="12" fill="#0284c7" stroke="#0f172a" stroke-width="3"/>
      <rect x="${cx - 49}" y="${cy - 49}" width="98" height="98" rx="8" fill="none" stroke="#ffffff" stroke-width="2"/>
      <rect x="${cx - 36}" y="${cy - 36}" width="72" height="72" rx="6" fill="#ffffff"/>
      <!-- Palang Merah Rumah Sakit -->
      <rect x="${cx - 8}" y="${cy - 24}" width="16" height="48" rx="2" fill="#ef4444"/>
      <rect x="${cx - 24}" y="${cy - 8}" width="48" height="16" rx="2" fill="#ef4444"/>
    `;
  } else {
    // Default: Rambu Larangan (Lingkaran Merah)
    deskripsiRambu = 'Rambu Larangan (Merah)';
    signGraphic = `
      <circle cx="${cx}" cy="${cy}" r="66" fill="#ffffff" stroke="#dc2626" stroke-width="8"/>
      ${jenis === 'stop' ? `
        <polygon points="${cx - 24},${cy - 58} ${cx + 24},${cy - 58} ${cx + 58},${cy - 24} ${cx + 58},${cy + 24} ${cx + 24},${cy + 58} ${cx - 24},${cy + 58} ${cx - 58},${cy + 24} ${cx - 58},${cy - 24}" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="24" font-weight="900" fill="#ffffff">STOP</text>
      ` : `
        <!-- Huruf P dicoret (Dilarang Parkir) -->
        <text x="${cx - 2}" y="${cy + 18}" text-anchor="middle" font-size="48" font-weight="900" fill="#0f172a">P</text>
        <line x1="${cx - 44}" y1="${cy - 44}" x2="${cx + 44}" y2="${cy + 44}" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
      `}
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="380" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="190" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">${deskripsiRambu}</text>

  <!-- Tiang Rambu Penyangga -->
  <rect x="${cx - 4}" y="${cy + 60}" width="8" height="110" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
  <rect x="${cx - 30}" y="226" width="60" height="10" rx="3" fill="#334155"/>

  <!-- Badan Simbol Rambu Vektor -->
  ${signGraphic}

  <!-- Callout Target X -->
  <g transform="translate(295, 95)">
    <rect width="60" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="30" y="34.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="190" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Arti dari rambu lalu lintas yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 2. Render Bagan Piring Makanku / Gizi Seimbang (PJOK & Kesehatan)
 */
export function renderPiringGiziSeimbangSvg(params: {
  pointer?: 'makanan_pokok' | 'sayuran' | 'lauk_pauk' | 'buah';
  label?: string;
}): string {
  const pointer = params.pointer || 'makanan_pokok';
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 135;
  const r = 90;

  // 4 Juring Piring Makanku:
  // Setengah Kiri (180 derajat): Makanan Pokok (2/3 dari setengah = 120°) & Buah-buahan (1/3 dari setengah = 60°)
  // Setengah Kanan (180 derajat): Sayuran (2/3 dari setengah = 120°) & Lauk-Pauk (1/3 dari setengah = 60°)
  const isTargetPokok = pointer === 'makanan_pokok';
  const isTargetSayur = pointer === 'sayuran';
  const isTargetLauk = pointer === 'lauk_pauk';
  const isTargetBuah = pointer === 'buah';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 280" width="450" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <!-- Border & Judul -->
  <rect width="450" height="280" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="225" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pedoman Gizi Seimbang: Piring Makanku</text>

  <!-- Piring Luar & Bibir Piring -->
  <circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>

  <!-- Sektor 1: Makanan Pokok (Kiri Bawah, Karbohidrat - Oranye) -->
  <path d="M ${cx},${cy} L ${cx - r},${cy} A ${r},${r} 0 0,0 ${cx + r * Math.cos(2.094)},${cy + r * Math.sin(2.094)} Z" fill="#fed7aa" stroke="#ffffff" stroke-width="2.5"/>
  ${isTargetPokok ? `
    <circle cx="${cx - 45}" cy="${cy + 38}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${cx - 45}" y="${cy + 42.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="${cx - 45}" y="${cy + 34}" text-anchor="middle" font-size="10" font-weight="bold" fill="#c2410c">Makanan</text>
    <text x="${cx - 45}" y="${cy + 46}" text-anchor="middle" font-size="10" font-weight="bold" fill="#c2410c">Pokok</text>
  `}

  <!-- Sektor 2: Sayuran (Kanan Bawah - Hijau) -->
  <path d="M ${cx},${cy} L ${cx + r * Math.cos(1.047)},${cy + r * Math.sin(1.047)} A ${r},${r} 0 0,0 ${cx + r},${cy} Z" fill="#bbf7d0" stroke="#ffffff" stroke-width="2.5"/>
  ${isTargetSayur ? `
    <circle cx="${cx + 45}" cy="${cy + 38}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${cx + 45}" y="${cy + 42.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="${cx + 45}" y="${cy + 40}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#15803d">Sayuran</text>
  `}

  <!-- Sektor 3: Buah-buahan (Kiri Atas - Merah/Kuning) -->
  <path d="M ${cx},${cy} L ${cx - r * Math.cos(1.047)},${cy - r * Math.sin(1.047)} A ${r},${r} 0 0,0 ${cx - r},${cy} Z" fill="#fef08a" stroke="#ffffff" stroke-width="2.5"/>
  ${isTargetBuah ? `
    <circle cx="${cx - 45}" cy="${cy - 35}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${cx - 45}" y="${cy - 30.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="${cx - 45}" y="${cy - 32}" text-anchor="middle" font-size="10" font-weight="bold" fill="#a16207">Buah</text>
  `}

  <!-- Sektor 4: Lauk-Pauk (Kanan Atas, Protein - Merah/Cokelat) -->
  <path d="M ${cx},${cy} L ${cx + r},${cy} A ${r},${r} 0 0,0 ${cx + r * Math.cos(1.047)},${cy - r * Math.sin(1.047)} Z" fill="#fecaca" stroke="#ffffff" stroke-width="2.5"/>
  ${isTargetLauk ? `
    <circle cx="${cx + 45}" cy="${cy - 35}" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${cx + 45}" y="${cy - 30.5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  ` : `
    <text x="${cx + 45}" y="${cy - 38}" text-anchor="middle" font-size="10" font-weight="bold" fill="#b91c1c">Lauk</text>
    <text x="${cx + 45}" y="${cy - 26}" text-anchor="middle" font-size="10" font-weight="bold" fill="#b91c1c">Pauk</text>
  `}

  <!-- Gelas Air Putih di Kanan Atas -->
  <g transform="translate(325, 60)">
    <rect x="0" y="8" width="28" height="40" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
    <rect x="2" y="18" width="24" height="28" fill="#38bdf8" fill-opacity="0.6"/>
    <text x="14" y="58" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">Air Putih</text>
  </g>

  <!-- Legenda Kandungan Zat di Sisi Kanan -->
  <g transform="translate(305, 140)">
    <rect width="130" height="90" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="65" y="18" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0f172a">Zat Gizi Piring</text>
    <circle cx="15" cy="32" r="5" fill="#fed7aa"/>
    <text x="26" y="36" font-size="9.5" fill="#334155">Karbohidrat (2/3)</text>
    <circle cx="15" cy="48" r="5" fill="#bbf7d0"/>
    <text x="26" y="52" font-size="9.5" fill="#334155">Sayuran (2/3)</text>
    <circle cx="15" cy="64" r="5" fill="#fecaca"/>
    <text x="26" y="68" font-size="9.5" fill="#334155">Lauk Protein (1/3)</text>
    <circle cx="15" cy="80" r="5" fill="#fef08a"/>
    <text x="26" y="84" font-size="9.5" fill="#334155">Buah Vitamin (1/3)</text>
  </g>

  <text x="225" y="265" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bagian piring makan gizi seimbang yang ditunjuk huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 3. Render Denah Lapangan Olahraga (Sepak Bola, Voli, Bulu Tangkis, Kasti)
 */
export function renderLapanganOlahragaSvg(params: {
  olahraga?: 'sepak_bola' | 'voli' | 'bulu_tangkis' | 'kasti';
  pointer?: string;
  label?: string;
}): string {
  const c = (params.olahraga || 'sepak_bola').toLowerCase();
  const labelChar = params.label || 'X';

  const w = 420;
  const h = 260;

  if (c === 'voli') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
    <rect width="${w}" height="${h}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
    <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Denah Lapangan Bola Voli (18 m x 9 m)</text>

    <!-- Lapangan Oranye Kayu / Biru -->
    <rect x="50" y="50" width="320" height="150" fill="#ffedd5" stroke="#ea580c" stroke-width="2.5"/>

    <!-- Net Tengah Lapangan -->
    <line x1="210" y1="44" x2="210" y2="206" stroke="#0f172a" stroke-width="3.5"/>
    <text x="210" y="40" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">NET</text>

    <!-- Garis Serang 3 Meter (Kiri & Kanan) -->
    <line x1="155" y1="50" x2="155" y2="200" stroke="#ea580c" stroke-width="2" stroke-dasharray="4,3"/>
    <line x1="265" y1="50" x2="265" y2="200" stroke="#ea580c" stroke-width="2" stroke-dasharray="4,3"/>

    <!-- Callout Garis Serang -->
    <g transform="translate(155, 125)">
      <circle cx="0" cy="0" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
      <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
    </g>

    <text x="100" y="190" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Area Belakang</text>
    <text x="182" y="190" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Depan</text>
    <text x="238" y="190" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Depan</text>
    <text x="320" y="190" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Area Belakang</text>

    <text x="210" y="242" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Garis batas lapangan yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
  </svg>`;
  }

  // Default: Sepak Bola
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="${w}" height="${h}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Denah Garis Lapangan Sepak Bola</text>

  <!-- Rumput Hijau -->
  <rect x="40" y="45" width="340" height="165" rx="4" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/>

  <!-- Garis Tepi Putih -->
  <rect x="48" y="52" width="324" height="151" fill="none" stroke="#ffffff" stroke-width="2"/>

  <!-- Garis Tengah & Lingkaran Tengah -->
  <line x1="210" y1="52" x2="210" y2="203" stroke="#ffffff" stroke-width="2"/>
  <circle cx="210" cy="127" r="32" fill="none" stroke="#ffffff" stroke-width="2"/>
  <circle cx="210" cy="127" r="3" fill="#ffffff"/>

  <!-- Kotak Penalti Kiri -->
  <rect x="48" y="85" width="55" height="84" fill="none" stroke="#ffffff" stroke-width="2"/>
  <rect x="48" y="104" width="22" height="46" fill="none" stroke="#ffffff" stroke-width="2"/>
  <circle cx="85" cy="127" r="2.5" fill="#ffffff"/>

  <!-- Kotak Penalti Kanan -->
  <rect x="317" y="85" width="55" height="84" fill="none" stroke="#ffffff" stroke-width="2"/>
  <rect x="350" y="104" width="22" height="46" fill="none" stroke="#ffffff" stroke-width="2"/>
  <circle cx="335" cy="127" r="2.5" fill="#ffffff"/>

  <!-- Target Badge X di Kotak Penalti Kiri -->
  <g transform="translate(75, 127)">
    <circle cx="0" cy="0" r="13" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="210" y="242" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Area lapangan sepak bola yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 4. Render Prepositions of Place (Bahasa Inggris: in, on, under, beside, behind, in front of, between)
 */
export function renderPrepositionPlaceSvg(params: {
  posisi?: 'in' | 'on' | 'under' | 'beside' | 'behind' | 'in_front_of' | 'between';
  label?: string;
}): string {
  const pos = (params.posisi || 'on').toLowerCase();
  const labelChar = params.label || 'X';

  const cx = 175;
  const cy = 135;

  let graphic = '';
  if (pos === 'in') {
    // Bola di dalam kotak transparan / terbuka
    graphic = `
      <rect x="${cx - 40}" y="${cy - 30}" width="80" height="70" rx="4" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy + 5}" r="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    `;
  } else if (pos === 'under') {
    // Meja dan bola di bawah
    graphic = `
      <rect x="${cx - 50}" y="${cy - 30}" width="100" height="14" rx="3" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
      <rect x="${cx - 45}" y="${cy - 16}" width="8" height="50" fill="#64748b"/>
      <rect x="${cx + 37}" y="${cy - 16}" width="8" height="50" fill="#64748b"/>
      <!-- Bola di lantai bawah meja -->
      <circle cx="${cx}" cy="${cy + 20}" r="16" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    `;
  } else if (pos === 'between') {
    // Dua kotak dan bola di tengah
    graphic = `
      <rect x="${cx - 75}" y="${cy - 25}" width="45" height="50" rx="4" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
      <text x="${cx - 52}" y="${cy + 5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Box A</text>
      <rect x="${cx + 30}" y="${cy - 25}" width="45" height="50" rx="4" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
      <text x="${cx + 52}" y="${cy + 5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Box B</text>
      <!-- Bola di tengah -->
      <circle cx="${cx}" cy="${cy}" r="18" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    `;
  } else {
    // Default: ON (Bola di atas kotak)
    graphic = `
      <rect x="${cx - 45}" y="${cy}" width="90" height="55" rx="4" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
      <text x="${cx}" y="${cy + 32}" text-anchor="middle" font-size="11" font-weight="bold" fill="#9a3412">The Box</text>
      <!-- Bola di atas -->
      <circle cx="${cx}" cy="${cy - 20}" r="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Preposition of Place: Where is the ball?</text>

  <!-- Objek Visual Spasial -->
  ${graphic}

  <!-- Callout Target Huruf -->
  <g transform="translate(305, 100)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="200" y="234" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">Complete the sentence: "The ball is [ ${escapeXml(labelChar)} ] the box."</text>
</svg>`;
}

/**
 * 5. Render Garis Paranada & Not Balok (SBdP Seni Musik)
 */
export function renderTanggaNadaSvg(params: {
  nadaTarget?: string; // 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'
  label?: string;
}): string {
  const nada = (params.nadaTarget || 'G').toUpperCase();
  const labelChar = params.label || 'X';

  const startY = 70;
  const lineGap = 16;
  const staffLines = [0, 1, 2, 3, 4].map(i => {
    const y = startY + i * lineGap;
    return `<line x1="40" y1="${y}" x2="380" y2="${y}" stroke="#0f172a" stroke-width="1.8"/>`;
  }).join('');

  // Nada C4..C5 koordinat Y pada garis paranada:
  // Garis 5 (atas) = F5 (y=70)
  // Garis 4 = D5 (y=86)
  // Garis 3 = B4 (y=102)
  // Garis 2 = G4 (y=118)
  // Garis 1 (bawah) = E4 (y=134)
  // Nada D4 = Spasi bawah (y=142)
  // Nada C4 = Garis bantu bawah (y=150)
  let notY = 118; // Default G4
  if (nada === 'C') notY = 150;
  else if (nada === 'D') notY = 142;
  else if (nada === 'E') notY = 134;
  else if (nada === 'F') notY = 126;
  else if (nada === 'G') notY = 118;
  else if (nada === 'A') notY = 110;
  else if (nada === 'B') notY = 102;
  else if (nada === 'C2' || nada === 'C5') notY = 94;

  const notX = 230;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" width="420" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="250" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Seni Musik: Garis Paranada &amp; Tangga Nada Diatonis</text>

  <!-- 5 Garis Paranada -->
  ${staffLines}

  <!-- Garis Birama Penutup Kanan -->
  <line x1="375" y1="70" x2="375" y2="134" stroke="#0f172a" stroke-width="2"/>
  <line x1="380" y1="70" x2="380" y2="134" stroke="#0f172a" stroke-width="3.5"/>

  <!-- Kunci G (Treble Clef) Vektor Elegan -->
  <text x="55" y="132" font-size="64" font-family="'Segoe UI Symbol', Arial, sans-serif" fill="#0f172a">𝄞</text>

  <!-- Garis Bantu Nada Rendah jika C4 -->
  ${notY >= 148 ? `<line x1="${notX - 16}" y1="150" x2="${notX + 16}" y2="150" stroke="#0f172a" stroke-width="2"/>` : ''}

  <!-- Kepala Not Balok Terisi & Tangkai -->
  <ellipse cx="${notX}" cy="${notY}" rx="9" ry="7" transform="rotate(-25 ${notX} ${notY})" fill="#0284c7" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="${notX + 7}" y1="${notY - 2}" x2="${notX + 7}" y2="${notY - 40}" stroke="#0f172a" stroke-width="2.5"/>

  <!-- Target Badge X -->
  <g transform="translate(${notX + 35}, ${notY - 20})">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Nomor Garis di Sisi Kiri -->
  <text x="32" y="74" text-anchor="end" font-size="9" fill="#94a3b8">Garis 5</text>
  <text x="32" y="138" text-anchor="end" font-size="9" fill="#94a3b8">Garis 1</text>

  <text x="210" y="234" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Nama nada diatonis yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 6. Render Lingkaran Warna (Color Wheel - SBdP Seni Rupa)
 */
export function renderLingkaranWarnaSvg(params: {
  pointer?: 'sekunder' | 'primer' | 'oranye' | 'hijau' | 'ungu';
  label?: string;
}): string {
  const labelChar = params.label || 'X';
  const pointer = params.pointer || 'sekunder';

  const cx = 175;
  const cy = 135;
  const r = 85;

  // 6 Juring Warna Primer & Sekunder:
  // Merah, Oranye, Kuning, Hijau, Biru, Ungu
  const colors = [
    { name: 'Merah', fill: '#ef4444', type: 'primer' },
    { name: 'Oranye', fill: '#f97316', type: 'sekunder' },
    { name: 'Kuning', fill: '#eab308', type: 'primer' },
    { name: 'Hijau', fill: '#22c55e', type: 'sekunder' },
    { name: 'Biru', fill: '#3b82f6', type: 'primer' },
    { name: 'Ungu', fill: '#a855f7', type: 'sekunder' }
  ];

  let slices = '';
  for (let i = 0; i < 6; i++) {
    const startAngle = (i * Math.PI) / 3 - Math.PI / 2;
    const endAngle = ((i + 1) * Math.PI) / 3 - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    slices += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z" fill="${colors[i].fill}" stroke="#ffffff" stroke-width="2.5"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 260" width="430" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="430" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="215" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Teori Warna: Lingkaran Warna Primer &amp; Sekunder</text>

  <!-- Roda 6 Warna -->
  <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
  <g>${slices}</g>
  <circle cx="${cx}" cy="${cy}" r="24" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
  <text x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Warna</text>

  <!-- Target Badge X di Sektor Oranye (Perpaduan Merah + Kuning) -->
  <g transform="translate(225, 80)">
    <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    <text x="0" y="4.5" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <!-- Legenda Sisi Kanan -->
  <g transform="translate(295, 60)">
    <rect width="115" height="135" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="57.5" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Kategori Warna</text>

    <text x="14" y="42" font-size="10" font-weight="bold" fill="#dc2626">Warna Primer:</text>
    <text x="14" y="56" font-size="9.5" fill="#475569">• Merah, Kuning, Biru</text>

    <text x="14" y="80" font-size="10" font-weight="bold" fill="#7c3aed">Warna Sekunder:</text>
    <text x="14" y="94" font-size="9.5" fill="#475569">• Campuran 2 primer</text>
    <text x="14" y="108" font-size="9" fill="#475569">M + K = Oranye</text>
    <text x="14" y="120" font-size="9" fill="#475569">B + K = Hijau</text>
  </g>

  <text x="215" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Warna sekunder hasil percampuran yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 7. Render Struktur Pemerintahan Daerah (Pendidikan Pancasila / PKn)
 */
export function renderStrukturPemdaSvg(params: {
  targetLevel?: 'provinsi' | 'kabupaten' | 'kecamatan' | 'kelurahan' | 'rw' | 'rt';
  label?: string;
}): string {
  const target = params.targetLevel || 'kecamatan';
  const labelChar = params.label || 'X';

  const levels = [
    { id: 'provinsi', nama: 'Provinsi', pimpinan: 'Gubernur' },
    { id: 'kabupaten', nama: 'Kabupaten / Kota', pimpinan: 'Bupati / Walikota' },
    { id: 'kecamatan', nama: 'Kecamatan', pimpinan: 'Camat' },
    { id: 'kelurahan', nama: 'Kelurahan / Desa', pimpinan: 'Lurah / Kades' },
    { id: 'rw', nama: 'Rukun Warga (RW)', pimpinan: 'Ketua RW' },
    { id: 'rt', nama: 'Rukun Tetangga (RT)', pimpinan: 'Ketua RT' }
  ];

  const startY = 48;
  const boxH = 26;
  const gap = 8;
  const boxW = 260;
  const cx = 200;

  let boxes = '';
  levels.forEach((lvl, idx) => {
    const y = startY + idx * (boxH + gap);
    const isTarget = lvl.id === target;

    boxes += `
      <!-- Kotak Tingkat ${idx + 1} -->
      <rect x="${cx - boxW / 2}" y="${y}" width="${boxW}" height="${boxH}" rx="5" fill="${isTarget ? '#fff1f2' : '#f8fafc'}" stroke="${isTarget ? '#e11d48' : '#64748b'}" stroke-width="${isTarget ? '2' : '1.2'}"/>
      ${isTarget ? `
        <circle cx="${cx}" cy="${y + boxH / 2}" r="11" fill="#e11d48"/>
        <text x="${cx}" y="${y + boxH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
      ` : `
        <text x="${cx - boxW / 2 + 12}" y="${y + 17}" font-size="10.5" font-weight="bold" fill="#0f172a">${escapeXml(lvl.nama)}</text>
        <text x="${cx + boxW / 2 - 12}" y="${y + 17}" text-anchor="end" font-size="10" font-weight="600" fill="#0284c7">Dipimpin: ${escapeXml(lvl.pimpinan)}</text>
      `}
      ${idx < levels.length - 1 ? `
        <!-- Garis Alir Turun -->
        <line x1="${cx}" y1="${y + boxH}" x2="${cx}" y2="${y + boxH + gap}" stroke="#94a3b8" stroke-width="1.8"/>
      ` : ''}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="400" height="280" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="280" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="200" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Struktur Hirarki Pemerintahan Daerah</text>

  ${boxes}

  <text x="200" y="268" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tingkat wilayah / pemimpin yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/**
 * 8. Render Grid Maze Navigasi Robot (Koding & Berpikir Komputasional SD)
 */
export function renderGridMazeKodingSvg(params: {
  gridSize?: number; // 4x4
  perintah?: string[]; // e.g. ['maju', 'maju', 'kanan', 'maju']
  label?: string;
}): string {
  const n = 4;
  const cellSize = 38;
  const startX = 60;
  const startY = 55;
  const labelChar = params.label || 'X';

  // Rintangan batu di (1,1) dan (2,2)
  const obstacles = ['1,1', '2,2'];
  const targetGoal = '3,2'; // Bintang finish di baris 2 kolom 3

  let gridCells = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const key = `${c},${r}`;
      const isObstacle = obstacles.includes(key);
      const isGoal = key === targetGoal;
      const isStart = c === 0 && r === 3; // Robot start kiri bawah

      gridCells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${isStart ? '#eff6ff' : isObstacle ? '#f1f5f9' : isGoal ? '#fef3c7' : '#ffffff'}" stroke="#cbd5e1" stroke-width="1.2"/>`;

      if (isStart) {
        // Robot
        gridCells += `
          <rect x="${x + 8}" y="${y + 8}" width="22" height="22" rx="4" fill="#0284c7" stroke="#0f172a" stroke-width="1.2"/>
          <circle cx="${x + 14}" cy="${y + 16}" r="2" fill="#ffffff"/>
          <circle cx="${x + 24}" cy="${y + 16}" r="2" fill="#ffffff"/>
          <text x="${x + 19}" y="${y + 36}" text-anchor="middle" font-size="7" font-weight="bold" fill="#0369a1">START</text>
        `;
      } else if (isObstacle) {
        // Batu rintangan
        gridCells += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="12" fill="#64748b" stroke="#334155" stroke-width="1.5"/>`;
      } else if (isGoal) {
        // Bintang finish
        gridCells += `
          <polygon points="${x + 19},${y + 8} ${x + 23},${y + 15} ${x + 30},${y + 16} ${x + 25},${y + 21} ${x + 26},${y + 29} ${x + 19},${y + 25} ${x + 12},${y + 29} ${x + 13},${y + 21} ${x + 8},${y + 16} ${x + 15},${y + 15}" fill="#f59e0b" stroke="#b45309" stroke-width="1"/>
          <text x="${x + 19}" y="${y + 36}" text-anchor="middle" font-size="7" font-weight="bold" fill="#b45309">GOAL</text>
        `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Koding SD: Navigasi Algoritma Grid Labirin</text>

  <!-- Matriks Labirin 4x4 -->
  <g>${gridCells}</g>
  <rect x="${startX}" y="${startY}" width="${n * cellSize}" height="${n * cellSize}" fill="none" stroke="#0f172a" stroke-width="2"/>

  <!-- Kartu Kode Perintah di Sisi Kanan -->
  <g transform="translate(245, 55)">
    <rect width="145" height="152" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="72.5" y="20" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0f172a">Blok Perintah Robot</text>

    <!-- Kartu 1 -->
    <rect x="12" y="32" width="121" height="22" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="1"/>
    <text x="72.5" y="47" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#047857">1. Maju 2 Langkah (▲▲)</text>

    <!-- Kartu 2 -->
    <rect x="12" y="60" width="121" height="22" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="1"/>
    <text x="72.5" y="75" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#047857">2. Putar Kanan 90° (►)</text>

    <!-- Kartu 3: Target X -->
    <rect x="12" y="88" width="121" height="24" rx="4" fill="#fff1f2" stroke="#e11d48" stroke-width="1.5"/>
    <text x="72.5" y="104" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#e11d48">3. [ ${escapeXml(labelChar)} ]</text>

    <text x="72.5" y="132" text-anchor="middle" font-size="8.5" fill="#64748b">Hindari batu (●) ke GOAL</text>
  </g>

  <text x="210" y="246" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Urutan perintah yang tepat untuk kartu nomor 3 (${escapeXml(labelChar)}) adalah ...</text>
</svg>`;
}

/** 24. Render Simbol Standar Kartografi (Peta) */
export function renderSimbolKartografiSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'gunung_aktif').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Gunung Aktif, 1: Gunung Mati, 2: Sungai, 3: Danau, 4: Bandara, 5: Rel Kereta
  if (pointer.includes('mati') || pointer.includes('tidak aktif')) activeIdx = 1;
  else if (pointer.includes('sungai') || pointer.includes('aliran')) activeIdx = 2;
  else if (pointer.includes('danau') || pointer.includes('telaga') || pointer.includes('rawa')) activeIdx = 3;
  else if (pointer.includes('bandara') || pointer.includes('pesawat') || pointer.includes('udara')) activeIdx = 4;
  else if (pointer.includes('kereta') || pointer.includes('rel')) activeIdx = 5;

  const cells = [
    { x: 15, y: 44, title: 'Gunung Berapi Aktif' },
    { x: 148, y: 44, title: 'Gunung Tidak Aktif' },
    { x: 281, y: 44, title: 'Aliran Sungai' },
    { x: 15, y: 144, title: 'Danau / Waduk' },
    { x: 148, y: 144, title: 'Bandar Udara' },
    { x: 281, y: 144, title: 'Rel Kereta Api' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" width="420" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Simbol-Simbol Standar Pada Peta (Kartografi)</text>

  <!-- Kotak 1: Gunung Aktif (Segitiga Merah & Kepulan Asap) -->
  <rect x="15" y="44" width="124" height="88" rx="6" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <!-- Asap Erupsi -->
  <path d="M 75,52 Q 72,45 77,41 Q 82,45 78,52 Z" fill="#f97316" fill-opacity="0.8"/>
  <ellipse cx="76" cy="54" rx="6" ry="3.5" fill="#f59e0b" fill-opacity="0.85"/>
  <!-- Badan Gunung -->
  <polygon points="76,57 53,94 99,94" fill="#ef4444" stroke="#991b1b" stroke-width="1.6"/>
  <text x="77" y="115" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Gunung Aktif</text>

  <!-- Kotak 2: Gunung Tidak Aktif (Segitiga Hitam Berpuncak Salju) -->
  <rect x="148" y="44" width="124" height="88" rx="6" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <polygon points="210,57 187,94 233,94" fill="#1e293b" stroke="#0f172a" stroke-width="1.6"/>
  <polygon points="210,57 203,70 210,67 217,70" fill="#ffffff" fill-opacity="0.6"/>
  <text x="210" y="115" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Gunung Mati</text>

  <!-- Kotak 3: Sungai (Alur Air Berkelok Ganda) -->
  <rect x="281" y="44" width="124" height="88" rx="6" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <path d="M 296,92 C 316,68 332,96 352,72 C 366,56 384,82 396,68" fill="none" stroke="#0284c7" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M 296,92 C 316,68 332,96 352,72 C 366,56 384,82 396,68" fill="none" stroke="#bae6fd" stroke-width="1.8" stroke-linecap="round"/>
  <text x="343" y="115" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Aliran Sungai</text>

  <!-- Kotak 4: Danau (Genangan Air Bertekstur) -->
  <rect x="15" y="144" width="124" height="88" rx="6" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <path d="M 54,174 C 52,160 72,156 87,162 C 104,168 108,186 94,190 C 77,194 57,188 54,174 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="1.8"/>
  <path d="M 68,174 Q 77,171 87,174" fill="none" stroke="#0284c7" stroke-width="1.2"/>
  <text x="77" y="215" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Danau / Rawa</text>

  <!-- Kotak 5: Bandar Udara (Siluet Pesawat ICAO) -->
  <rect x="148" y="144" width="124" height="88" rx="6" fill="#f8fafc" stroke="${activeIdx === 4 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 4 ? 2 : 1}"/>
  <path d="M 210,154 L 212,168 L 227,178 L 227,182 L 212,178 L 212,188 L 217,192 L 217,195 L 210,193 L 203,195 L 203,192 L 208,188 L 208,178 L 193,182 L 193,178 L 208,168 Z" fill="#0f172a"/>
  <text x="210" y="215" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Bandar Udara</text>

  <!-- Kotak 6: Rel Kereta Api (Jalur Rel Bertali Bantalan) -->
  <rect x="281" y="144" width="124" height="88" rx="6" fill="#f8fafc" stroke="${activeIdx === 5 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 5 ? 2 : 1}"/>
  <line x1="298" y1="171" x2="388" y2="171" stroke="#0f172a" stroke-width="1.8"/>
  <line x1="298" y1="181" x2="388" y2="181" stroke="#0f172a" stroke-width="1.8"/>
  <line x1="298" y1="176" x2="388" y2="176" stroke="#0f172a" stroke-width="10" stroke-dasharray="2.5 7"/>
  <text x="343" y="215" text-anchor="middle" font-size="9" font-weight="bold" fill="#334155">Rel Kereta Api</text>

  <!-- Target Badge X -->
  <circle cx="${cells[activeIdx].x + 109}" cy="${cells[activeIdx].y + 13}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cells[activeIdx].x + 109}" y="${cells[activeIdx].y + 17}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="210" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Arti simbol peta pada kotak "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 25. Render Garis Lintang dan Bujur (Globe) */
export function renderGarisLintangBujurSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'khatulistiwa').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 150, y: 132, name: 'Khatulistiwa (0°)' };
  if (pointer.includes('greenwich') || pointer.includes('bujur 0')) target = { x: 150, y: 78, name: 'Meridian Greenwich (0°)' };
  else if (pointer.includes('kutub utara')) target = { x: 150, y: 56, name: 'Kutub Utara (90° LU)' };
  else if (pointer.includes('kutub selatan')) target = { x: 150, y: 208, name: 'Kutub Selatan (90° LS)' };
  else if (pointer.includes('balik utara') || pointer.includes('cancer')) target = { x: 150, y: 104, name: 'Garis Balik Utara (23.5° LU)' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="400" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="200" y="24" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Garis Lintang (Paralel) &amp; Garis Bujur (Meridian)</text>

  <!-- Globe Bola Dunia 3D -->
  <!-- Penyangga Busur Meridian Tembaga -->
  <path d="M 132,222 L 168,222 L 160,214 L 140,214 Z" fill="#78350f"/>
  <circle cx="150" cy="212" r="3.5" fill="#d97706"/>
  <circle cx="150" cy="132" r="76" fill="none" stroke="#d97706" stroke-width="3" stroke-dasharray="240 240" transform="rotate(-30 150 132)"/>

  <!-- Bola Globe Biru Laut -->
  <circle cx="150" cy="132" r="72" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>

  <!-- Garis Lintang Khatulistiwa (0 Derajat) - Tebal Merah -->
  <line x1="78" y1="132" x2="222" y2="132" stroke="#ef4444" stroke-width="2.5"/>

  <!-- Garis Lintang Paralel Lainnya -->
  <ellipse cx="150" cy="104" rx="66" ry="9" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,2"/>
  <ellipse cx="150" cy="160" rx="66" ry="9" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,2"/>

  <!-- Garis Bujur Meridian Greenwich (0 Derajat) - Vertikal Biru -->
  <line x1="150" y1="60" x2="150" y2="204" stroke="#0284c7" stroke-width="2.5"/>

  <!-- Garis Bujur Melengkung Lainnya -->
  <ellipse cx="150" cy="132" rx="38" ry="72" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,2"/>

  <!-- Kutub Titik -->
  <circle cx="150" cy="60" r="3.5" fill="#0f172a"/>
  <circle cx="150" cy="204" r="3.5" fill="#0f172a"/>

  <!-- Legenda Kanan (Anti-Overlap) -->
  <g>
    <rect x="245" y="48" width="142" height="22" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
    <text x="316" y="63" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Kutub Utara (90° LU)</text>
  </g>
  <g>
    <rect x="245" y="82" width="142" height="22" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1"/>
    <text x="316" y="97" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">Meridian Greenwich (0°)</text>
  </g>
  <g>
    <rect x="245" y="116" width="142" height="22" rx="4" fill="#ffffff" stroke="#ef4444" stroke-width="1"/>
    <text x="316" y="131" text-anchor="middle" font-size="9" font-weight="bold" fill="#b91c1c">Khatulistiwa (Ekuator 0°)</text>
  </g>
  <g>
    <rect x="245" y="150" width="142" height="22" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="1"/>
    <text x="316" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#b45309">Garis Balik (23.5° LU/LS)</text>
  </g>
  <g>
    <rect x="245" y="184" width="142" height="22" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
    <text x="316" y="199" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Kutub Selatan (90° LS)</text>
  </g>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="${target.y + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Garis imajiner bumi yang ditunjuk oleh tanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 26. Render Ragam Rumah Adat Tradisional Nusantara */
export function renderRumahAdatNusantaraSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'gadang').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Rumah Gadang, 1: Joglo, 2: Tongkonan, 3: Honai
  if (pointer.includes('joglo') || pointer.includes('jawa')) activeIdx = 1;
  else if (pointer.includes('tongkonan') || pointer.includes('toraja') || pointer.includes('sulawesi')) activeIdx = 2;
  else if (pointer.includes('honai') || pointer.includes('papua')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, nama: 'Rumah Gadang', daerah: 'Sumatra Barat (Minangkabau)' },
    { x: 205, y: 42, nama: 'Rumah Joglo', daerah: 'Jawa Tengah / D.I. Yogyakarta' },
    { x: 15, y: 145, nama: 'Rumah Tongkonan', daerah: 'Sulawesi Selatan (Toraja)' },
    { x: 205, y: 145, nama: 'Rumah Honai', daerah: 'Papua Pegunungan' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Rumah Adat Tradisional Nusantara</text>

  <!-- Panel 1: Rumah Gadang -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="25" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Rumah Gadang` : 'Rumah Gadang'}</text>
  <!-- Ilustrasi Atap Gonjong Lengkung Runcing -->
  <path d="M 28,82 Q 55,100 75,70 Q 95,100 122,82 L 115,115 L 35,115 Z" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <text x="130" y="85" font-size="8.5" font-weight="bold" fill="#9a3412">Atap Gonjong</text>
  <text x="130" y="98" font-size="8" fill="#64748b">Sumatra Barat</text>

  <!-- Panel 2: Rumah Joglo -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="215" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Rumah Joglo` : 'Rumah Joglo'}</text>
  <!-- Ilustrasi Atap Tajug Joglo -->
  <polygon points="255,70 275,70 295,95 235,95" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <rect x="242" y="95" width="46" height="20" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
  <text x="305" y="85" font-size="8.5" font-weight="bold" fill="#9a3412">Atap Tajug</text>
  <text x="305" y="98" font-size="8" fill="#64748b">Jawa Tengah</text>

  <!-- Panel 3: Rumah Tongkonan -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="25" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Rumah Tongkonan` : 'Rumah Tongkonan'}</text>
  <!-- Ilustrasi Atap Perahu Menjulang -->
  <path d="M 28,172 Q 75,200 122,172 L 105,215 L 45,215 Z" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <text x="130" y="188" font-size="8.5" font-weight="bold" fill="#9a3412">Bentuk Perahu</text>
  <text x="130" y="201" font-size="8" fill="#64748b">Tana Toraja</text>

  <!-- Panel 4: Rumah Honai -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="215" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Rumah Honai` : 'Rumah Honai'}</text>
  <!-- Ilustrasi Kubah Jerami Honai -->
  <path d="M 240,215 L 240,195 Q 265,165 290,195 L 290,215 Z" fill="#e2e8f0" stroke="#78350f" stroke-width="1.5"/>
  <ellipse cx="265" cy="182" rx="28" ry="16" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2"/>
  <text x="305" y="188" font-size="8.5" font-weight="bold" fill="#9a3412">Kubah Rumbia</text>
  <text x="305" y="201" font-size="8" fill="#64748b">Papua</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Asal daerah rumah adat pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 27. Render Alat Musik Tradisional Nusantara */
export function renderAlatMusikTradisionalSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'angklung').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Angklung (Digoyang), 1: Sasando (Dipetik), 2: Tifa (Dipukul), 3: Kolintang (Dipukul)
  if (pointer.includes('sasando') || pointer.includes('petik') || pointer.includes('ntt')) activeIdx = 1;
  else if (pointer.includes('tifa') || pointer.includes('gendang') || pointer.includes('papua')) activeIdx = 2;
  else if (pointer.includes('kolintang') || pointer.includes('minahasa') || pointer.includes('bilah')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, nama: 'Angklung', cara: 'Digoyang (Getar)', asal: 'Jawa Barat' },
    { x: 205, y: 42, title: 'Sasando', cara: 'Dipetik (Dawai)', asal: 'NTT (Pulau Rote)' },
    { x: 15, y: 145, title: 'Tifa', cara: 'Dipukul (Membran)', asal: 'Maluku &amp; Papua' },
    { x: 205, y: 145, title: 'Kolintang', cara: 'Dipukul (Bilah Kayu)', asal: 'Sulawesi Utara' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Alat Musik Tradisional &amp; Cara Memainkannya</text>

  <!-- Panel 1: Angklung -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="25" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Angklung` : 'Angklung'}</text>
  <!-- Ilustrasi Tabung Bambu Angklung -->
  <rect x="40" y="70" width="8" height="42" rx="2" fill="#fed7aa" stroke="#c2410c" stroke-width="1.2"/>
  <rect x="52" y="76" width="8" height="36" rx="2" fill="#fed7aa" stroke="#c2410c" stroke-width="1.2"/>
  <line x1="32" y1="112" x2="68" y2="112" stroke="#78350f" stroke-width="2.5"/>
  <text x="80" y="85" font-size="9" font-weight="bold" fill="#15803d">Cara: Digoyang</text>
  <text x="80" y="100" font-size="8.5" fill="#64748b">Bahan: Bambu</text>

  <!-- Panel 2: Sasando -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="215" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Sasando` : 'Sasando'}</text>
  <!-- Ilustrasi Wadah Daun Lontar Sasando -->
  <path d="M 235,115 C 220,75 270,75 255,115 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2"/>
  <line x1="245" y1="72" x2="245" y2="115" stroke="#78350f" stroke-width="2"/>
  <text x="275" y="85" font-size="9" font-weight="bold" fill="#0284c7">Cara: Dipetik</text>
  <text x="275" y="100" font-size="8.5" fill="#64748b">Daun Lontar &amp; Dawai</text>

  <!-- Panel 3: Tifa -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="25" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Tifa` : 'Tifa'}</text>
  <!-- Ilustrasi Gendang Tifa -->
  <path d="M 40,175 Q 48,195 40,215 L 60,215 Q 52,195 60,175 Z" fill="#fed7aa" stroke="#78350f" stroke-width="1.2"/>
  <ellipse cx="50" cy="175" rx="10" ry="4" fill="#f1f5f9" stroke="#78350f" stroke-width="1"/>
  <text x="80" y="188" font-size="9" font-weight="bold" fill="#b45309">Cara: Dipukul</text>
  <text x="80" y="203" font-size="8.5" fill="#64748b">Kulit Hewan / Kayu</text>

  <!-- Panel 4: Kolintang -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="215" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Kolintang` : 'Kolintang'}</text>
  <!-- Ilustrasi Bilah Kayu Berderet -->
  <rect x="228" y="175" width="6" height="35" rx="1" fill="#a16207"/>
  <rect x="236" y="178" width="6" height="32" rx="1" fill="#a16207"/>
  <rect x="244" y="181" width="6" height="29" rx="1" fill="#a16207"/>
  <rect x="252" y="184" width="6" height="26" rx="1" fill="#a16207"/>
  <text x="275" y="188" font-size="9" font-weight="bold" fill="#b45309">Cara: Dipukul</text>
  <text x="275" y="203" font-size="8.5" fill="#64748b">Bilah Kayu Khusus</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Cara memainkan alat musik pada huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 28. Render Trias Politika (Pembagian Kekuasaan Negara) */
export function renderTriasPolitikaSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'legislatif').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Legislatif, 1: Eksekutif, 2: Yudikatif
  if (pointer.includes('eksekutif') || pointer.includes('presiden')) activeIdx = 1;
  else if (pointer.includes('yudikatif') || pointer.includes('mahkamah') || pointer.includes('kehakiman')) activeIdx = 2;

  const cols = [
    { x: 15, nama: 'Legislatif', fungsi: 'Membuat Undang-Undang', lembaga: 'DPR / DPD / MPR' },
    { x: 145, nama: 'Eksekutif', fungsi: 'Menjalankan Undang-Undang', lembaga: 'Presiden &amp; Wapres' },
    { x: 275, nama: 'Yudikatif', fungsi: 'Mengadili Pelanggaran UU', lembaga: 'MA / MK / KY' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410 250" width="410" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="205" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Sistem Pembagian Kekuasaan Negara (Trias Politika)</text>

  <!-- Kolom 1: Legislatif -->
  <rect x="15" y="45" width="120" height="168" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2.2 : 1.2}"/>
  <rect x="25" y="55" width="100" height="24" rx="4" fill="#e0f2fe"/>
  <text x="75" y="71" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Legislatif` : 'Legislatif'}</text>
  <text x="75" y="105" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Fungsi:</text>
  <text x="75" y="120" text-anchor="middle" font-size="8.5" fill="#475569">Membuat Undang-</text>
  <text x="75" y="133" text-anchor="middle" font-size="8.5" fill="#475569">Undang (Aturan)</text>
  <line x1="30" y1="145" x2="120" y2="145" stroke="#cbd5e1" stroke-width="1"/>
  <text x="75" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Lembaga:</text>
  <text x="75" y="180" text-anchor="middle" font-size="9" font-weight="bold" fill="#0284c7">DPR / DPD / MPR</text>

  <!-- Kolom 2: Eksekutif -->
  <rect x="145" y="45" width="120" height="168" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2.2 : 1.2}"/>
  <rect x="155" y="55" width="100" height="24" rx="4" fill="#fef3c7"/>
  <text x="205" y="71" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#b45309">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Eksekutif` : 'Eksekutif'}</text>
  <text x="205" y="105" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Fungsi:</text>
  <text x="205" y="120" text-anchor="middle" font-size="8.5" fill="#475569">Melaksanakan</text>
  <text x="205" y="133" text-anchor="middle" font-size="8.5" fill="#475569">Pemerintahan</text>
  <line x1="160" y1="145" x2="250" y2="145" stroke="#cbd5e1" stroke-width="1"/>
  <text x="205" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Lembaga:</text>
  <text x="205" y="180" text-anchor="middle" font-size="9" font-weight="bold" fill="#d97706">Presiden &amp; Wapres</text>

  <!-- Kolom 3: Yudikatif -->
  <rect x="275" y="45" width="120" height="168" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2.2 : 1.2}"/>
  <rect x="285" y="55" width="100" height="24" rx="4" fill="#dcfce7"/>
  <text x="335" y="71" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#15803d">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Yudikatif` : 'Yudikatif'}</text>
  <text x="335" y="105" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Fungsi:</text>
  <text x="335" y="120" text-anchor="middle" font-size="8.5" fill="#475569">Mengadili &amp; Jaga</text>
  <text x="335" y="133" text-anchor="middle" font-size="8.5" fill="#475569">Hukum Keadilan</text>
  <line x1="290" y1="145" x2="380" y2="145" stroke="#cbd5e1" stroke-width="1"/>
  <text x="335" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Lembaga:</text>
  <text x="335" y="180" text-anchor="middle" font-size="9" font-weight="bold" fill="#16a34a">MA / MK / KY</text>

  <!-- Target Badge X -->
  <circle cx="${cols[activeIdx].x + 110}" cy="52" r="10.5" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cols[activeIdx].x + 110}" y="56" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="205" y="238" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Tugas dan fungsi lembaga negara pada kolom "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 29. Render Alur Kegiatan Ekonomi */
export function renderAlurKegiatanEkonomiSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'distribusi').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 1; // 0: Produksi, 1: Distribusi, 2: Konsumsi
  if (pointer.includes('produksi') || pointer.includes('pabrik') || pointer.includes('petani')) activeIdx = 0;
  else if (pointer.includes('konsumsi') || pointer.includes('pembeli') || pointer.includes('makan')) activeIdx = 2;

  const cards = [
    { x: 15, title: 'Produksi', pelaku: 'Produsen', desc: 'Menghasilkan Barang' },
    { x: 145, title: 'Distribusi', pelaku: 'Distributor', desc: 'Menyalurkan Barang' },
    { x: 275, title: 'Konsumsi', pelaku: 'Konsumen', desc: 'Menggunakan Barang' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410 250" width="410" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="econArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>

  <text x="205" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Alur Kegiatan Ekonomi Masyarakat</text>

  <!-- Panah Penghubung Antartahap -->
  <line x1="135" y1="115" x2="145" y2="115" stroke="#0284c7" stroke-width="2.5" marker-end="url(#econArr)"/>
  <line x1="265" y1="115" x2="275" y2="115" stroke="#0284c7" stroke-width="2.5" marker-end="url(#econArr)"/>

  <!-- Tahap 1: Produksi -->
  <rect x="15" y="45" width="118" height="150" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2.2 : 1.2}"/>
  <text x="74" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Produksi` : '1. Produksi'}</text>
  <!-- Ilustrasi Pabrik / Pengrajin -->
  <path d="M 45,115 L 45,88 L 65,98 L 65,88 L 85,98 L 85,115 Z" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
  <line x1="55" y1="88" x2="55" y2="78" stroke="#475569" stroke-width="2"/>
  <text x="74" y="140" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Pelaku: Produsen</text>
  <text x="74" y="155" text-anchor="middle" font-size="8" fill="#64748b">Menghasilkan barang</text>
  <text x="74" y="168" text-anchor="middle" font-size="8" fill="#64748b">atau jasa</text>

  <!-- Tahap 2: Distribusi -->
  <rect x="145" y="45" width="118" height="150" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2.2 : 1.2}"/>
  <text x="204" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Distribusi` : '2. Distribusi'}</text>
  <!-- Ilustrasi Truk Pengangkut Barang -->
  <rect x="175" y="90" width="35" height="20" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
  <path d="M 210,98 L 225,98 L 225,110 L 210,110 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
  <circle cx="185" cy="112" r="4.5" fill="#1e293b"/>
  <circle cx="218" cy="112" r="4.5" fill="#1e293b"/>
  <text x="204" y="140" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Pelaku: Distributor</text>
  <text x="204" y="155" text-anchor="middle" font-size="8" fill="#64748b">Menyalurkan barang</text>
  <text x="204" y="168" text-anchor="middle" font-size="8" fill="#64748b">ke pedagang / pasar</text>

  <!-- Tahap 3: Konsumsi -->
  <rect x="275" y="45" width="118" height="150" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2.2 : 1.2}"/>
  <text x="334" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Konsumsi` : '3. Konsumsi'}</text>
  <!-- Ilustrasi Keranjang Belanja -->
  <path d="M 315,92 L 322,112 L 348,112 L 355,92 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>
  <circle cx="326" cy="116" r="3" fill="#1e293b"/>
  <circle cx="344" cy="116" r="3" fill="#1e293b"/>
  <text x="334" y="140" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Pelaku: Konsumen</text>
  <text x="334" y="155" text-anchor="middle" font-size="8" fill="#64748b">Menggunakan atau</text>
  <text x="334" y="168" text-anchor="middle" font-size="8" fill="#64748b">menghabiskan nilai</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 105}" cy="52" r="10.5" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 105}" y="56" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="205" y="235" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Tahapan kegiatan ekonomi pada kotak "${escapeXml(labelChar)}" disebut ...</text>
</svg>`;
}

/** 30. Render Empat Macam Norma Masyarakat */
export function renderNormaMasyarakatSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'hukum').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 3; // 0: Norma Agama, 1: Norma Kesusilaan, 2: Norma Kesopanan, 3: Norma Hukum
  if (pointer.includes('agama')) activeIdx = 0;
  else if (pointer.includes('susila') || pointer.includes('hati nurani')) activeIdx = 1;
  else if (pointer.includes('sopan') || pointer.includes('adat') || pointer.includes('kebiasaan')) activeIdx = 2;

  const cards = [
    { x: 15, y: 42, title: 'Norma Agama', sumber: 'Wahyu Tuhan', sanksi: 'Dosa &amp; Akhirat' },
    { x: 205, y: 42, title: 'Norma Kesusilaan', sumber: 'Hati Nurani', sanksi: 'Penyesalan / Malu' },
    { x: 15, y: 145, title: 'Norma Kesopanan', sumber: 'Adat / Pergaulan', sanksi: 'Dicela / Dikucilkan' },
    { x: 205, y: 145, title: 'Norma Hukum', sumber: 'Negara / Pemerintah', sanksi: 'Tegas, Denda / Pidana' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Empat Norma Pengatur Kehidupan Bermasyarakat</text>

  <!-- Panel 1: Norma Agama -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <text x="25" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 0 ? `[${escapeXml(labelChar)}] Norma Agama` : 'Norma Agama'}</text>
  <text x="25" y="80" font-size="9" font-weight="bold" fill="#334155">Sumber: Wahyu Tuhan YME</text>
  <text x="25" y="96" font-size="8.5" fill="#64748b">Sifat: Mutlak &amp; Universal</text>
  <text x="25" y="112" font-size="8.5" fill="#dc2626">Sanksi: Dosa di akhirat</text>

  <!-- Panel 2: Norma Kesusilaan -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <text x="215" y="58" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 1 ? `[${escapeXml(labelChar)}] Kesusilaan` : 'Norma Kesusilaan'}</text>
  <text x="215" y="80" font-size="9" font-weight="bold" fill="#334155">Sumber: Hati Nurani Insan</text>
  <text x="215" y="96" font-size="8.5" fill="#64748b">Bisikan kebaikan batin</text>
  <text x="215" y="112" font-size="8.5" fill="#dc2626">Sanksi: Rasa bersalah / malu</text>

  <!-- Panel 3: Norma Kesopanan -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <text x="25" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 2 ? `[${escapeXml(labelChar)}] Kesopanan` : 'Norma Kesopanan'}</text>
  <text x="25" y="183" font-size="9" font-weight="bold" fill="#334155">Sumber: Adat Pergaulan</text>
  <text x="25" y="199" font-size="8.5" fill="#64748b">Tata krama antarsesama</text>
  <text x="25" y="215" font-size="8.5" fill="#dc2626">Sanksi: Dicela / dikucilkan</text>

  <!-- Panel 4: Norma Hukum -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <text x="215" y="161" font-size="10.5" font-weight="bold" fill="#0369a1">${activeIdx === 3 ? `[${escapeXml(labelChar)}] Norma Hukum` : 'Norma Hukum'}</text>
  <text x="215" y="183" font-size="9" font-weight="bold" fill="#334155">Sumber: Peraturan Resmi Negara</text>
  <text x="215" y="199" font-size="8.5" fill="#64748b">Undang-Undang tertulis</text>
  <text x="215" y="215" font-size="8.5" fill="#dc2626">Sanksi: Tegas, penjara / denda</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Karakteristik norma yang ditunjuk oleh huruf "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 31. Render Simbol Rambu Bahaya Laboratorium (K3 / GHS) */
export function renderRambuBahayaLabSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'flammable').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Mudah Terbakar, 1: Korosif, 2: Toksik/Beracun, 3: Biohazard
  if (pointer.includes('korosif') || pointer.includes('asam')) activeIdx = 1;
  else if (pointer.includes('racun') || pointer.includes('toksik') || pointer.includes('tengkorak')) activeIdx = 2;
  else if (pointer.includes('biohazard') || pointer.includes('hayati') || pointer.includes('infeksi')) activeIdx = 3;

  const cards = [
    { x: 15, y: 42, title: 'Mudah Terbakar' },
    { x: 205, y: 42, title: 'Bahan Korosif' },
    { x: 15, y: 145, title: 'Beracun (Toksik)' },
    { x: 205, y: 145, title: 'Bahaya Hayati' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Simbol Peringatan Bahaya Laboratorium IPA (K3)</text>

  <!-- Panel 1: Flammable -->
  <rect x="15" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 0 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 0 ? 2 : 1}"/>
  <!-- Belah Ketupat Merah -->
  <polygon points="55,62 82,88 55,114 28,88" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <!-- Ikon Api -->
  <path d="M 55,72 Q 62,82 58,92 Q 54,102 55,105 Q 46,95 50,85 Z" fill="#ea580c"/>
  <text x="95" y="85" font-size="9" font-weight="bold" fill="#dc2626">Mudah Terbakar</text>
  <text x="95" y="100" font-size="8.5" fill="#64748b">(Flammable)</text>

  <!-- Panel 2: Corrosive -->
  <rect x="205" y="42" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 1 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 1 ? 2 : 1}"/>
  <!-- Belah Ketupat -->
  <polygon points="245,62 272,88 245,114 218,88" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <!-- Tabung reaksi menetes -->
  <line x1="235" y1="74" x2="248" y2="86" stroke="#0f172a" stroke-width="2.5"/>
  <circle cx="248" cy="94" r="2" fill="#0f172a"/>
  <line x1="238" y1="102" x2="258" y2="102" stroke="#0f172a" stroke-width="2"/>
  <text x="282" y="85" font-size="9" font-weight="bold" fill="#dc2626">Bahan Korosif</text>
  <text x="282" y="100" font-size="8.5" fill="#64748b">(Merusak kulit/logam)</text>

  <!-- Panel 3: Toxic -->
  <rect x="15" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 2 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 2 ? 2 : 1}"/>
  <!-- Belah Ketupat -->
  <polygon points="55,165 82,191 55,217 28,191" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <!-- Tengkorak & Tulang Silang -->
  <circle cx="55" cy="184" r="6" fill="#0f172a"/>
  <line x1="46" y1="198" x2="64" y2="198" stroke="#0f172a" stroke-width="2"/>
  <text x="95" y="188" font-size="9" font-weight="bold" fill="#dc2626">Beracun (Toksik)</text>
  <text x="95" y="203" font-size="8.5" fill="#64748b">(Dilarang terhirup/telan)</text>

  <!-- Panel 4: Biohazard -->
  <rect x="205" y="145" width="180" height="92" rx="8" fill="#f8fafc" stroke="${activeIdx === 3 ? '#e11d48' : '#cbd5e1'}" stroke-width="${activeIdx === 3 ? 2 : 1}"/>
  <!-- Belah Ketupat -->
  <polygon points="245,165 272,191 245,217 218,191" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <!-- Tiga Lingkaran Saling Silang -->
  <circle cx="245" cy="185" r="4.5" fill="none" stroke="#0f172a" stroke-width="1.8"/>
  <circle cx="240" cy="195" r="4.5" fill="none" stroke="#0f172a" stroke-width="1.8"/>
  <circle cx="250" cy="195" r="4.5" fill="none" stroke="#0f172a" stroke-width="1.8"/>
  <text x="282" y="188" font-size="9" font-weight="bold" fill="#dc2626">Bahaya Hayati</text>
  <text x="282" y="203" font-size="8.5" fill="#64748b">(Biohazard Infeksius)</text>

  <!-- Target Badge X -->
  <circle cx="${cards[activeIdx].x + 165}" cy="${cards[activeIdx].y + 14}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${cards[activeIdx].x + 165}" y="${cards[activeIdx].y + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="252" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Arti simbol bahaya laboratorium pada tanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

/** 32. Render Piramida Aktivitas Fisik Sehat Anak SD */
export function renderPiramidaAktivitasFisikSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'dasar').toLowerCase();
  const labelChar = params.label || 'X';

  let activeIdx = 0; // 0: Tingkat 1 (Setiap Hari), 1: Tingkat 2 (3-5x seminggu), 2: Tingkat 3 (2-3x seminggu), 3: Puncak (Batasi)
  if (pointer.includes('aerobik') || pointer.includes('tingkat 2') || pointer.includes('olahraga')) activeIdx = 1;
  else if (pointer.includes('otot') || pointer.includes('tingkat 3') || pointer.includes('kelenturan')) activeIdx = 2;
  else if (pointer.includes('puncak') || pointer.includes('batasi') || pointer.includes('gadget') || pointer.includes('game')) activeIdx = 3;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410 260" width="410" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="205" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Piramida Aktivitas Fisik Sehat Anak SD (PJOK)</text>

  <!-- Puncak Piramida: Tingkat 4 (Batasi Sedentari) -->
  <polygon points="205,42 165,85 245,85" fill="#fee2e2" stroke="${activeIdx === 3 ? '#e11d48' : '#ef4444'}" stroke-width="${activeIdx === 3 ? 2.5 : 1.2}"/>
  <text x="205" y="70" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#991b1b">Batasi Sedentari</text>
  <text x="205" y="80" text-anchor="middle" font-size="7.5" fill="#7f1d1d">(Nonton TV &lt; 2 jam)</text>

  <!-- Tingkat 3: 2-3 Kali Seminggu (Kelenturan & Kekuatan) -->
  <polygon points="165,85 245,85 285,128 125,128" fill="#fef3c7" stroke="${activeIdx === 2 ? '#e11d48' : '#f59e0b'}" stroke-width="${activeIdx === 2 ? 2.5 : 1.2}"/>
  <text x="205" y="105" text-anchor="middle" font-size="9" font-weight="bold" fill="#92400e">2-3 Kali Seminggu</text>
  <text x="205" y="120" text-anchor="middle" font-size="8" fill="#78350f">Latihan Otot &amp; Kelenturan (Push-up, Senam)</text>

  <!-- Tingkat 2: 3-5 Kali Seminggu (Aerobik & Olahraga) -->
  <polygon points="125,128 285,128 325,172 85,172" fill="#e0f2fe" stroke="${activeIdx === 1 ? '#e11d48' : '#0284c7'}" stroke-width="${activeIdx === 1 ? 2.5 : 1.2}"/>
  <text x="205" y="148" text-anchor="middle" font-size="9" font-weight="bold" fill="#075985">3-5 Kali Seminggu</text>
  <text x="205" y="163" text-anchor="middle" font-size="8" fill="#0369a1">Olahraga Aerobik (Sepak Bola, Renang, Lari)</text>

  <!-- Dasar Piramida: Tingkat 1 (Setiap Hari) -->
  <polygon points="85,172 325,172 365,215 45,215" fill="#dcfce7" stroke="${activeIdx === 0 ? '#e11d48' : '#16a34a'}" stroke-width="${activeIdx === 0 ? 2.5 : 1.2}"/>
  <text x="205" y="192" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#166534">Setiap Hari (Aktivitas Fisik Rutin)</text>
  <text x="205" y="206" text-anchor="middle" font-size="8" fill="#14532d">Jalan Kaki, Bersepeda Santai, Naik Tangga, Bermain Aktif</text>

  <!-- Target Badge X -->
  <circle cx="${[205, 340, 300, 225][activeIdx]}" cy="${[195, 150, 105, 55][activeIdx]}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${[205, 340, 300, 225][activeIdx]}" y="${[199, 154, 109, 59][activeIdx]}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="205" y="246" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Tingkatan piramida aktivitas fisik pada tanda "${escapeXml(labelChar)}" sebaiknya dilakukan ...</text>
</svg>`;
}

/** 33. Render Denah Lapangan dan Lintasan Atletik Standar */
export function renderLapanganAtletikSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'lari').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 200, y: 55, name: 'Lintasan Lari 400 Meter' };
  if (pointer.includes('peluru') || pointer.includes('tolak')) target = { x: 120, y: 135, name: 'Sektor Tolak Peluru' };
  else if (pointer.includes('lompat') || pointer.includes('pasir') || pointer.includes('jauh')) target = { x: 280, y: 135, name: 'Bak Pasir Lompat Jauh' };
  else if (pointer.includes('rumput') || pointer.includes('tengah')) target = { x: 200, y: 135, name: 'Lapangan Rumput Tengah' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="200" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Denah Lapangan &amp; Lintasan Atletik Standar</text>

  <!-- Lintasan Lari Luar Oval Merah Bata -->
  <rect x="35" y="45" width="330" height="150" rx="75" fill="#f87171" stroke="#dc2626" stroke-width="2"/>

  <!-- Garis Jalur Lari Putus-Putus -->
  <rect x="50" y="60" width="300" height="120" rx="60" fill="none" stroke="#fee2e2" stroke-width="1.2" stroke-dasharray="4 3"/>

  <!-- Lapangan Rumput Bagian Dalam Hijau -->
  <rect x="65" y="75" width="270" height="90" rx="45" fill="#86efac" stroke="#16a34a" stroke-width="2"/>

  <!-- Sektor Tolak Peluru Kiri -->
  <path d="M 120,135 L 90,115 A 35 35 0 0 1 90,155 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2"/>
  <circle cx="120" cy="135" r="4.5" fill="#78350f"/>
  <text x="110" y="105" text-anchor="middle" font-size="8" font-weight="bold" fill="#78350f">Tolak Peluru</text>

  <!-- Bak Pasir Lompat Jauh Kanan -->
  <rect x="250" y="128" width="55" height="16" rx="2" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
  <line x1="240" y1="136" x2="250" y2="136" stroke="#dc2626" stroke-width="2"/>
  <text x="277.5" y="120" text-anchor="middle" font-size="8" font-weight="bold" fill="#92400e">Bak Lompat Jauh</text>

  <!-- Garis Start / Finish -->
  <line x1="150" y1="45" x2="150" y2="75" stroke="#ffffff" stroke-width="2.5"/>
  <text x="150" y="40" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#dc2626">FINISH</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="200" y="248" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Area atletik yang ditunjuk oleh huruf "${escapeXml(labelChar)}" digunakan untuk cabang ...</text>
</svg>`;
}

/** 34. Render Peta Konsep (Mind Map Struktur Paragraf) */
export function renderDiagramMindmapParagrafSvg(params: { pointer?: string; label?: string }): string {
  const pointer = (params.pointer || 'pokok').toLowerCase();
  const labelChar = params.label || 'X';

  let target = { x: 205, y: 125, name: 'Gagasan Pokok (Ide Utama)' };
  if (pointer.includes('pendukung 1') || pointer.includes('fakta')) target = { x: 80, y: 75, name: 'Gagasan Pendukung 1' };
  else if (pointer.includes('pendukung 2') || pointer.includes('contoh')) target = { x: 330, y: 75, name: 'Gagasan Pendukung 2' };
  else if (pointer.includes('pendukung 3') || pointer.includes('alasan')) target = { x: 80, y: 175, name: 'Gagasan Pendukung 3' };
  else if (pointer.includes('pendukung 4') || pointer.includes('kesimpulan')) target = { x: 330, y: 175, name: 'Gagasan Pendukung 4' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410 255" width="410" height="255" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="205" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">Peta Konsep (Mind Map): Struktur Gagasan Paragraf</text>

  <!-- Garis Cabang Melengkung dari Pusat -->
  <path d="M 205,125 Q 140,85 80,75" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <path d="M 205,125 Q 270,85 330,75" fill="none" stroke="#16a34a" stroke-width="2.5"/>
  <path d="M 205,125 Q 140,165 80,175" fill="none" stroke="#ea580c" stroke-width="2.5"/>
  <path d="M 205,125 Q 270,165 330,175" fill="none" stroke="#8b5cf6" stroke-width="2.5"/>

  <!-- Gelembung Cabang 1 (Kiri Atas) -->
  <rect x="25" y="55" width="110" height="40" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
  <text x="80" y="73" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">Gagasan Pendukung 1</text>
  <text x="80" y="87" text-anchor="middle" font-size="8" fill="#64748b">(Fakta Pendukung)</text>

  <!-- Gelembung Cabang 2 (Kanan Atas) -->
  <rect x="275" y="55" width="110" height="40" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
  <text x="330" y="73" text-anchor="middle" font-size="9" font-weight="bold" fill="#15803d">Gagasan Pendukung 2</text>
  <text x="330" y="87" text-anchor="middle" font-size="8" fill="#64748b">(Contoh Penjelas)</text>

  <!-- Gelembung Cabang 3 (Kiri Bawah) -->
  <rect x="25" y="155" width="110" height="40" rx="8" fill="#ffedd5" stroke="#ea580c" stroke-width="1.5"/>
  <text x="80" y="173" text-anchor="middle" font-size="9" font-weight="bold" fill="#c2410c">Gagasan Pendukung 3</text>
  <text x="80" y="187" text-anchor="middle" font-size="8" fill="#64748b">(Uraian Rinci)</text>

  <!-- Gelembung Cabang 4 (Kanan Bawah) -->
  <rect x="275" y="155" width="110" height="40" rx="8" fill="#f3e8ff" stroke="#8b5cf6" stroke-width="1.5"/>
  <text x="330" y="173" text-anchor="middle" font-size="9" font-weight="bold" fill="#6b21a8">Gagasan Pendukung 4</text>
  <text x="330" y="187" text-anchor="middle" font-size="8" fill="#64748b">(Simpulan / Penegas)</text>

  <!-- Node Pusat: Gagasan Pokok -->
  <rect x="145" y="105" width="120" height="42" rx="10" fill="#fef08a" stroke="#ca8a04" stroke-width="2.5"/>
  <text x="205" y="123" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#854d0e">GAGASAN POKOK</text>
  <text x="205" y="138" text-anchor="middle" font-size="8.5" font-weight="600" fill="#713f12">(Ide Utama Paragraf)</text>

  <!-- Target Badge X -->
  <circle cx="${target.x}" cy="${target.y}" r="12" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <text x="${target.x}" y="${target.y + 4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="205" y="244" text-anchor="middle" font-size="10.5" font-weight="600" fill="#475569">Kedudukan unsur teks pada lingkaran tanda "${escapeXml(labelChar)}" adalah ...</text>
</svg>`;
}

// =========================================================================
// BATCH 3: IPS, SEJARAH, BUDAYA, LITERASI & SENI (11 TEMPLATES)
// =========================================================================

// 24. Garis Wallace dan Weber (Persebaran Fauna Indonesia)
export function renderGarisWallaceWeberSvg(params: any): string {
  const pointer = String(params.zona || params.pointer || 'peralihan').toLowerCase();
  const labelChar = params.label || 'X';

  const zones = [
    { id: 'asiatis', name: 'Tipe Asiatis', x: 80, icon: '🐘', fauna: 'Gajah, Harimau', wilayah: 'Sumatra, Jawa, Kalimantan' },
    { id: 'peralihan', name: 'Tipe Peralihan', x: 210, icon: '🦬', fauna: 'Anoa, Komodo, Babi Rusa', wilayah: 'Sulawesi, Nusa Tenggara' },
    { id: 'australis', name: 'Tipe Australis', x: 340, icon: '🦜', fauna: 'Cendrawasih, Kasuari', wilayah: 'Papua, Maluku, Kep. Aru' }
  ];

  let target = zones.find(z => pointer.includes(z.id)) || zones[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 240" width="420" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="420" height="240" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Persebaran Fauna Indonesia: Garis Wallace &amp; Weber</text>

  <!-- 3 Wilayah / Zona Fauna -->
  <!-- Zona Asiatis -->
  <rect x="20" y="44" width="118" height="136" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <rect x="30" y="52" width="98" height="20" rx="10" fill="#dcfce7" stroke="#86efac" stroke-width="1"/>
  <text x="79" y="66" text-anchor="middle" font-size="9" font-weight="bold" fill="#166534">Tipe Asiatis</text>
  <text x="79" y="98" text-anchor="middle" font-size="22">🐘</text>
  <text x="79" y="122" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">Mamalia Besar</text>
  <text x="79" y="138" text-anchor="middle" font-size="7.5" fill="#64748b">Sumatra, Jawa, Bali,</text>
  <text x="79" y="150" text-anchor="middle" font-size="7.5" fill="#64748b">serta Kalimantan</text>

  <!-- Garis Wallace Merah -->
  <line x1="145" y1="40" x2="145" y2="185" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="5,3"/>
  <rect x="114" y="188" width="62" height="18" rx="4" fill="#fee2e2" stroke="#dc2626" stroke-width="1"/>
  <text x="145" y="201" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#b91c1c">G. Wallace</text>

  <!-- Zona Peralihan -->
  <rect x="151" y="44" width="118" height="136" rx="8" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
  <rect x="161" y="52" width="98" height="20" rx="10" fill="#fef3c7" stroke="#fde68a" stroke-width="1"/>
  <text x="210" y="66" text-anchor="middle" font-size="9" font-weight="bold" fill="#92400e">Tipe Peralihan</text>
  <text x="210" y="98" text-anchor="middle" font-size="22">🦬</text>
  <text x="210" y="122" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">Fauna Endemik</text>
  <text x="210" y="138" text-anchor="middle" font-size="7.5" fill="#64748b">Sulawesi, Nusa Tenggara,</text>
  <text x="210" y="150" text-anchor="middle" font-size="7.5" fill="#64748b">dan Maluku</text>

  <!-- Garis Weber Biru -->
  <line x1="275" y1="40" x2="275" y2="185" stroke="#2563eb" stroke-width="2.2" stroke-dasharray="5,3"/>
  <rect x="248" y="188" width="54" height="18" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1"/>
  <text x="275" y="201" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#1d4ed8">G. Weber</text>

  <!-- Zona Australis -->
  <rect x="282" y="44" width="118" height="136" rx="8" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
  <rect x="292" y="52" width="98" height="20" rx="10" fill="#e0f2fe" stroke="#bae6fd" stroke-width="1"/>
  <text x="341" y="66" text-anchor="middle" font-size="9" font-weight="bold" fill="#0369a1">Tipe Australis</text>
  <text x="341" y="98" text-anchor="middle" font-size="22">🦜</text>
  <text x="341" y="122" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">Burung &amp; Marsupial</text>
  <text x="341" y="138" text-anchor="middle" font-size="7.5" fill="#64748b">Papua, Kep. Aru,</text>
  <text x="341" y="150" text-anchor="middle" font-size="7.5" fill="#64748b">dan sekitarnya</text>

  <!-- Target Badge -->
  <circle cx="${target.x}" cy="98" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x}" y="102" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="210" y="226" text-anchor="middle" font-size="10" font-weight="600" fill="#334155">Contoh fauna endemik atau wilayah pada zona bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 25. Candi & Peninggalan Sejarah (Borobudur vs Prambanan)
export function renderCandiDanPeninggalanSejarahSvg(params: any): string {
  const jenis = String(params.jenis || params.candi || 'borobudur').toLowerCase();
  const labelChar = params.label || 'X';
  const isBorobudur = jenis.includes('borobudur') || jenis.includes('buddha');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 230" width="380" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="230" fill="#fafaf9" stroke="#d6d3d1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#292524">Arsitektur Candi Bersejarah Nusantara</text>

  <!-- Profil Candi Borobudur (Stupa Bertingkat Buddha - Kiri) -->
  <g transform="translate(100, 115)">
    <rect x="-65" y="45" width="130" height="15" fill="#78716c" rx="2"/>
    <rect x="-55" y="30" width="110" height="15" fill="#a8a29e" rx="2"/>
    <rect x="-45" y="15" width="90" height="15" fill="#78716c" rx="2"/>
    <!-- Teras Melingkar & Stupa Utama -->
    <ellipse cx="0" cy="15" rx="35" ry="10" fill="#a8a29e"/>
    <ellipse cx="0" cy="0" rx="20" ry="18" fill="#78716c"/>
    <rect x="-3" y="-22" width="6" height="12" fill="#57534e"/>
    <text x="0" y="75" text-anchor="middle" font-size="9" font-weight="bold" fill="#44403c">Candi Borobudur</text>
    <text x="0" y="87" text-anchor="middle" font-size="7.5" fill="#78716c">(Candi Buddha)</text>
    ${isBorobudur ? `
      <circle cx="0" cy="0" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}
  </g>

  <!-- Profil Candi Prambanan (Menara Meruncing Hindu - Kanan) -->
  <g transform="translate(280, 115)">
    <rect x="-45" y="45" width="90" height="15" fill="#78716c" rx="2"/>
    <!-- Menara Runcing Ramping -->
    <polygon points="-35,45 -18,10 -8,-25 0,-35 8,-25 18,10 35,45" fill="#a8a29e" stroke="#57534e" stroke-width="1.5"/>
    <!-- Hiasan Ratna / Puncak Meruncing -->
    <circle cx="0" cy="-37" r="4" fill="#57534e"/>
    <text x="0" y="75" text-anchor="middle" font-size="9" font-weight="bold" fill="#44403c">Candi Prambanan</text>
    <text x="0" y="87" text-anchor="middle" font-size="7.5" fill="#78716c">(Candi Hindu)</text>
    ${!isBorobudur ? `
      <circle cx="0" cy="0" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}
  </g>

  <text x="190" y="215" text-anchor="middle" font-size="9.5" font-weight="600" fill="#44403c">Candi pada simbol "[${escapeXml(labelChar)}]" dibangun pada masa kerajaan bercorak ...</text>
</svg>`;
}

// 26. Motif Batik Nusantara (Pola Geometris & Non-Geometris)
export function renderMotifBatikNusantaraSvg(params: any): string {
  const pointer = String(params.motif || params.pointer || 'parang').toLowerCase();
  const labelChar = params.label || 'X';

  const motifs = [
    { id: 'parang', name: 'Parang Rusak', daerah: 'Yogyakarta/Solo', x: 60, icon: '〰️' },
    { id: 'kawung', name: 'Kawung', daerah: 'Jawa Tengah', x: 160, icon: '💠' },
    { id: 'megamendung', name: 'Mega Mendung', daerah: 'Cirebon', x: 260, icon: '☁️' },
    { id: 'tambal', name: 'Tambal', daerah: 'Jawa', x: 360, icon: '🔲' }
  ];

  let target = motifs.find(m => pointer.includes(m.id)) || motifs[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="420" height="180" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="420" height="180" fill="#fdfbf7" stroke="#e7e5e4" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#451a03">Ragam Motif Batik Nusantara</text>

  ${motifs.map(m => {
    const isTarget = m.id === target.id;
    return `
    <g transform="translate(${m.x - 38}, 42)">
      <rect width="76" height="76" rx="8" fill="#ffffff" stroke="#b45309" stroke-width="1.6"/>
      <circle cx="38" cy="24" r="14" fill="#fef3c7" stroke="#d97706" stroke-width="1"/>
      <text x="38" y="28" text-anchor="middle" font-size="11">${m.icon}</text>
      ${isTarget ? `
        <circle cx="38" cy="54" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="38" y="58" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="38" y="52" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#78350f">${m.name}</text>
        <text x="38" y="63" text-anchor="middle" font-size="6.5" fill="#92400e">${m.daerah}</text>
      `}
    </g>`;
  }).join('')}

  <text x="210" y="155" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Nama dan makna motif batik pada gambar bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 27. Senjata Tradisional Nusantara
export function renderSenjataTradisionalNusantaraSvg(params: any): string {
  const pointer = String(params.senjata || params.pointer || 'kujang').toLowerCase();
  const labelChar = params.label || 'X';

  const weapons = [
    { id: 'keris', name: 'Keris (Jawa)', icon: '🗡️', x: 60 },
    { id: 'rencong', name: 'Rencong (Aceh)', icon: '🗡️', x: 160 },
    { id: 'mandau', name: 'Mandau (Dayak)', icon: '⚔️', x: 260 },
    { id: 'kujang', name: 'Kujang (Sunda)', icon: '🪓', x: 360 }
  ];

  let target = weapons.find(w => pointer.includes(w.id)) || weapons[3];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="420" height="180" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="420" height="180" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Senjata Tradisional Khas Daerah Nusantara</text>

  ${weapons.map(w => {
    const isTarget = w.id === target.id;
    return `
    <g transform="translate(${w.x - 38}, 42)">
      <rect width="76" height="76" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="1.6"/>
      <circle cx="38" cy="24" r="14" fill="#f1f5f9" stroke="#475569" stroke-width="1"/>
      <text x="38" y="28" text-anchor="middle" font-size="11">${w.icon}</text>
      ${isTarget ? `
        <circle cx="38" cy="54" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="38" y="58" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="38" y="52" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#1e293b">${w.name.split(' ')[0]}</text>
        <text x="38" y="63" text-anchor="middle" font-size="6.5" fill="#64748b">${w.name.split(' ')[1] || ''}</text>
      `}
    </g>`;
  }).join('')}

  <text x="210" y="155" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Senjata tradisional pada kotak bertanda "[${escapeXml(labelChar)}]" berasal dari daerah ...</text>
</svg>`;
}

// 28. Tarian Daerah Nusantara
export function renderTarianDaerahNusantaraSvg(params: any): string {
  const pointer = String(params.tari || params.pointer || 'pendet').toLowerCase();
  const labelChar = params.label || 'X';

  const dances = [
    { id: 'saman', name: 'Tari Saman (Aceh)', icon: '👥', x: 60 },
    { id: 'pendet', name: 'Tari Pendet (Bali)', icon: '🌺', x: 160 },
    { id: 'piring', name: 'Tari Piring (Minang)', icon: '🍽️', x: 260 },
    { id: 'jaipong', name: 'Tari Jaipong (Jabar)', icon: '💃', x: 360 }
  ];

  let target = dances.find(d => pointer.includes(d.id)) || dances[1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="420" height="180" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="420" height="180" fill="#fdf4ff" stroke="#f0abfc" stroke-width="1.5" rx="8"/>
  <text x="210" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#701a75">Ragam Tarian Tradisional Nusantara</text>

  ${dances.map(d => {
    const isTarget = d.id === target.id;
    return `
    <g transform="translate(${d.x - 38}, 42)">
      <rect width="76" height="76" rx="8" fill="#ffffff" stroke="#c026d3" stroke-width="1.6"/>
      <circle cx="38" cy="24" r="14" fill="#fae8ff" stroke="#a21caf" stroke-width="1"/>
      <text x="38" y="28" text-anchor="middle" font-size="11">${d.icon}</text>
      ${isTarget ? `
        <circle cx="38" cy="54" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="38" y="58" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
      ` : `
        <text x="38" y="52" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#701a75">${d.name.split(' ')[0]} ${d.name.split(' ')[1]}</text>
        <text x="38" y="63" text-anchor="middle" font-size="6.5" fill="#86198f">${d.name.split(' ')[2] || ''}</text>
      `}
    </g>`;
  }).join('')}

  <text x="210" y="155" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Ciri khas atau asal tari tradisional bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 29. Piramida Penduduk (Ekspansif, Stasioner, Konstruktif)
export function renderPiramidaPendudukSvg(params: any): string {
  const pointer = String(params.tipe || params.pointer || 'ekspansif').toLowerCase();
  const labelChar = params.label || 'X';

  const types = [
    { id: 'ekspansif', name: 'Piramida Ekspansif', desc: 'Muda > Tua (Segitiga)', x: 75, poly: '40,135 110,135 75,55' },
    { id: 'stasioner', name: 'Piramida Stasioner', desc: 'Muda = Tua (Granat)', x: 190, poly: '155,135 225,135 225,80 205,55 175,55 155,80' },
    { id: 'konstruktif', name: 'Piramida Konstruktif', desc: 'Tua > Muda (Batu Nisan)', x: 305, poly: '280,135 330,135 340,90 320,55 290,55 270,90' }
  ];

  let target = types.find(t => pointer.includes(t.id)) || types[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 200" width="380" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Bentuk Piramida Penduduk Demografi</text>

  ${types.map(t => {
    const isTarget = t.id === target.id;
    return `
    <polygon points="${t.poly}" fill="#93c5fd" stroke="#2563eb" stroke-width="1.8"/>
    <text x="${t.x}" y="152" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#1e293b">${t.name}</text>
    <text x="${t.x}" y="163" text-anchor="middle" font-size="6.5" fill="#64748b">${t.desc}</text>
    ${isTarget ? `
      <circle cx="${t.x}" cy="95" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${t.x}" y="99" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}`;
  }).join('')}

  <text x="190" y="186" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Karakteristik angka kelahiran pada piramida bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 30. Struktur Fabel & Alur Cerita (Freytag Pyramid)
export function renderStrukturFabelAlurCeritaSvg(params: any): string {
  const pointer = String(params.tahap || params.pointer || 'klimaks').toLowerCase();
  const labelChar = params.label || 'X';

  const stages = [
    { id: 'orientasi', name: '1. Orientasi', desc: 'Pengenalan Tokoh', x: 50, y: 140 },
    { id: 'komplikasi', name: '2. Komplikasi', desc: 'Muncul Masalah', x: 125, y: 95 },
    { id: 'klimaks', name: '3. Klimaks', desc: 'Puncak Ketegangan', x: 190, y: 55 },
    { id: 'resolusi', name: '4. Resolusi', desc: 'Penyelesaian', x: 255, y: 95 },
    { id: 'koda', name: '5. Koda', desc: 'Pesan Moral', x: 330, y: 140 }
  ];

  let target = stages.find(s => pointer.includes(s.id)) || stages[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 210" width="380" height="210" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="210" fill="#fdf4ff" stroke="#e879f9" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#701a75">Gunung Alur Cerita Narasi / Fabel</text>

  <!-- Garis Alur Gunung Segitiga -->
  <polyline points="50,140 125,95 190,55 255,95 330,140" fill="none" stroke="#a21caf" stroke-width="2.5"/>

  ${stages.map(s => {
    const isTarget = s.id === target.id;
    return `
    <circle cx="${s.x}" cy="${s.y}" r="6" fill="#fdf4ff" stroke="#701a75" stroke-width="2"/>
    <text x="${s.x}" y="${s.y + 16}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#4a044e">${s.name}</text>
    <text x="${s.x}" y="${s.y + 26}" text-anchor="middle" font-size="6.5" fill="#701a75">${s.desc}</text>
    ${isTarget ? `
      <circle cx="${s.x}" cy="${s.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${s.x}" y="${s.y + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}`;
  }).join('')}

  <text x="190" y="194" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Tahap alur cerita fiksi pada titik bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 31. Jenis Paragraf (Deduktif, Induktif, Campuran)
export function renderJenisParagrafInduktifDeduktifSvg(params: any): string {
  const pointer = String(params.jenis || params.pointer || 'deduktif').toLowerCase();
  const labelChar = params.label || 'X';

  const types = [
    { id: 'deduktif', name: 'Deduktif', desc: 'Ide Pokok di Awal', x: 75, top: true, bot: false },
    { id: 'induktif', name: 'Induktif', desc: 'Ide Pokok di Akhir', x: 190, top: false, bot: true },
    { id: 'campuran', name: 'Campuran', desc: 'Ide Pokok Awal &amp; Akhir', x: 305, top: true, bot: true }
  ];

  let target = types.find(t => pointer.includes(t.id)) || types[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 200" width="380" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Posisi Gagasan Pokok pada Paragraf</text>

  ${types.map(t => {
    const isTarget = t.id === target.id;
    const bx = t.x - 42;
    return `
    <rect x="${bx}" y="45" width="84" height="90" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Baris 1: Awal Paragraf -->
    <rect x="${bx + 8}" y="52" width="68" height="12" rx="2" fill="${t.top ? '#e11d48' : '#e2e8f0'}"/>
    <!-- Baris Kalimat Penjelas -->
    <rect x="${bx + 8}" y="69" width="68" height="8" rx="2" fill="#e2e8f0"/>
    <rect x="${bx + 8}" y="82" width="68" height="8" rx="2" fill="#e2e8f0"/>
    <rect x="${bx + 8}" y="95" width="68" height="8" rx="2" fill="#e2e8f0"/>
    <!-- Baris Akhir Paragraf -->
    <rect x="${bx + 8}" y="112" width="68" height="12" rx="2" fill="${t.bot ? '#e11d48' : '#e2e8f0'}"/>
    <text x="${t.x}" y="152" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${t.name}</text>
    <text x="${t.x}" y="163" text-anchor="middle" font-size="6.5" fill="#64748b">${t.desc}</text>
    ${isTarget ? `
      <circle cx="${t.x}" cy="88" r="11" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${t.x}" y="92" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}`;
  }).join('')}

  <text x="190" y="186" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Paragraf pada gambar bertanda "[${escapeXml(labelChar)}]" tergolong jenis ...</text>
</svg>`;
}

// 32. Unsur Iklan Media Cetak
export function renderUnsurIklanMediaCetakSvg(params: any): string {
  const pointer = String(params.bagian || params.pointer || 'headline').toLowerCase();
  const labelChar = params.label || 'X';

  const parts = [
    { id: 'headline', name: 'Headline / Judul Iklan', x: 190, y: 62 },
    { id: 'gambar', name: 'Gambar Produk Menarik', x: 190, y: 105 },
    { id: 'ajakan', name: 'Kalimat Persuasif', x: 190, y: 145 }
  ];

  let target = parts.find(p => pointer.includes(p.id)) || parts[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" width="340" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="340" height="220" fill="#fefce8" stroke="#fef08a" stroke-width="1.5" rx="8"/>
  <text x="170" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#854d0e">Anatomi Tata Letak Iklan Media Cetak</text>

  <!-- Bingkai Poster Iklan -->
  <rect x="70" y="42" width="200" height="135" rx="6" fill="#ffffff" stroke="#ca8a04" stroke-width="1.8"/>

  <!-- Headline Judul -->
  <rect x="80" y="50" width="180" height="22" rx="3" fill="#fde047" stroke="#eab308" stroke-width="1"/>
  <text x="170" y="65" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#713f12">HEMAT ENERGI UNTUK MASA DEPAN!</text>

  <!-- Gambar Produk Menengah -->
  <rect x="120" y="78" width="100" height="50" rx="4" fill="#fef9c3" stroke="#eab308" stroke-width="1"/>
  <text x="170" y="108" text-anchor="middle" font-size="18">💡</text>

  <!-- Kalimat Persuasif & Kontak -->
  <text x="170" y="142" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#0f172a">Matikan Lampu Saat Tidak Digunakan!</text>
  <text x="170" y="155" text-anchor="middle" font-size="6.5" fill="#64748b">Hubungi Layanan Informasi Listrik</text>

  <!-- Target Badge -->
  <circle cx="${target.x - 20}" cy="${target.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
  <text x="${target.x - 20}" y="${target.y + 4.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>

  <text x="170" y="200" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">Unsur iklan yang bertanda "[${escapeXml(labelChar)}]" berfungsi sebagai ...</text>
</svg>`;
}

// 33. Pohon Keluarga (Genealogi Silsilah)
export function renderPohonKeluargaGenealogiSvg(params: any): string {
  const pointer = String(params.posisi || params.pointer || 'ayah').toLowerCase();
  const labelChar = params.label || 'X';

  const members = [
    { id: 'kakek', name: 'Kakek', x: 130, y: 55 },
    { id: 'nenek', name: 'Nenek', x: 230, y: 55 },
    { id: 'ayah', name: 'Ayah', x: 110, y: 115 },
    { id: 'ibu', name: 'Ibu', x: 190, y: 115 },
    { id: 'anak', name: 'Anak (Saya)', x: 150, y: 170 }
  ];

  let target = members.find(m => pointer.includes(m.id)) || members[2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" width="360" height="210" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="360" height="210" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="180" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Bagan Silsilah Keluarga 3 Generasi</text>

  <!-- Garis Kekerabatan -->
  <line x1="130" y1="55" x2="230" y2="55" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="180" y1="55" x2="180" y2="85" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="110" y1="85" x2="180" y2="85" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="110" y1="85" x2="110" y2="100" stroke="#94a3b8" stroke-width="1.5"/>

  <!-- Garis Ayah - Ibu -->
  <line x1="110" y1="115" x2="190" y2="115" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="150" y1="115" x2="150" y2="155" stroke="#94a3b8" stroke-width="1.5"/>

  ${members.map(m => {
    const isTarget = m.id === target.id;
    return `
    <rect x="${m.x - 30}" y="${m.y - 14}" width="60" height="28" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
    <text x="${m.x}" y="${m.y + 3.5}" text-anchor="middle" font-size="8" font-weight="bold" fill="#0f172a">${m.name}</text>
    ${isTarget ? `
      <circle cx="${m.x}" cy="${m.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${m.x}" y="${m.y + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}`;
  }).join('')}

  <text x="180" y="196" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Kedudukan hubungan keluarga pada kode "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}

// 34. Koperasi Sekolah (Struktur Organisasi)
export function renderKoperasiSekolahSvg(params: any): string {
  const pointer = String(params.jabatan || params.pointer || 'rat').toLowerCase();
  const labelChar = params.label || 'X';

  const org = [
    { id: 'rat', name: 'Rapat Anggota Tahunan (RAT)', role: 'Kekuasaan Tertinggi', x: 190, y: 55 },
    { id: 'pengawas', name: 'Pengawas', role: 'Pengawasan', x: 110, y: 110 },
    { id: 'pengurus', name: 'Pengurus', role: 'Pelaksana Usaha', x: 270, y: 110 },
    { id: 'anggota', name: 'Anggota Koperasi (Siswa &amp; Guru)', role: 'Pemilik &amp; Pengguna', x: 190, y: 165 }
  ];

  let target = org.find(o => pointer.includes(o.id)) || org[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 210" width="380" height="210" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="380" height="210" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
  <text x="190" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Struktur Organisasi Koperasi Sekolah</text>

  <!-- Garis Alur Struktur -->
  <line x1="190" y1="70" x2="190" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="110" y1="90" x2="270" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="110" y1="90" x2="110" y2="98" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="270" y1="90" x2="270" y2="98" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="270" y1="125" x2="270" y2="145" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="190" y1="145" x2="270" y2="145" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="190" y1="145" x2="190" y2="152" stroke="#94a3b8" stroke-width="1.5"/>

  ${org.map(o => {
    const isTarget = o.id === target.id;
    const w = o.id === 'rat' ? 170 : o.id === 'anggota' ? 180 : 95;
    const bx = o.x - w / 2;
    return `
    <rect x="${bx}" y="${o.y - 14}" width="${w}" height="28" rx="6" fill="#ffffff" stroke="#16a34a" stroke-width="1.5"/>
    <text x="${o.x}" y="${o.y}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#15803d">${o.name}</text>
    <text x="${o.x}" y="${o.y + 9}" text-anchor="middle" font-size="6" fill="#64748b">${o.role}</text>
    ${isTarget ? `
      <circle cx="${o.x}" cy="${o.y}" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${o.x}" y="${o.y + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">[${escapeXml(labelChar)}]</text>
    ` : ''}`;
  }).join('')}

  <text x="190" y="196" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">Peran pemegang kekuasaan pada kotak bertanda "[${escapeXml(labelChar)}]" adalah ...</text>
</svg>`;
}


