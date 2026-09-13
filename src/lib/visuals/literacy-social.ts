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
  <text x="210" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Seni Musik: Garis Paranada & Tangga Nada Diatonis</text>

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
  <text x="215" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Teori Warna: Lingkaran Warna Primer & Sekunder</text>

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
