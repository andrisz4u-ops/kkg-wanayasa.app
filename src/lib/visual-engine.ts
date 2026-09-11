/**
 * visual-engine.ts
 * Examplate Visual Stimulus Engine untuk Portal Pendidikan A4EDU / KKG Wanayasa
 *
 * Menghasilkan 41 stimulus visual SVG vektor presisi berstandar lembar ujian nasional:
 * 1. Geometri 3D: Balok, Kubus, Tabung, Kerucut, Bola, Prisma, Limas, Jaring-jaring Kubus, Jaring-jaring Balok
 * 2. Geometri 2D: Persegi Panjang, Segitiga Siku, Segitiga Sama Sisi, Segitiga Sama Kaki, Lingkaran, Trapesium, Jajar Genjang, Belah Ketupat, Layang-layang, Sudut, Simetri Lipat, Bangun Gabungan L/T, Koordinat Kartesius
 * 3. Pecahan: Pecahan Lingkaran terarsir, Pecahan Persegi Grid terarsir
 * 4. Statistik & Data: Diagram Batang, Diagram Garis, Diagram Lingkaran (Pie), Diagram Venn, Pictogram (Diagram Gambar)
 * 5. Pengukuran: Jam Dinding Analog, Garis Bilangan
 * 6. IPAS / Sains: Sistem Pencernaan, Vili Usus Halus, Struktur Gigi, Lambung Detail, Sistem Pernapasan, Alveolus, Siklus Air, Metamorfosis, Bagian Bunga, Rantai Makanan
 * 7. Parser Cerdas Pendeteksi Stimulus Otomatis dari Teks Soal
 * 8. Katalog Template Terpadu untuk Integrasi API & UI
 */

export interface VisualStimulusConfig {
  category?: 'geometry' | 'fraction' | 'chart' | 'science' | 'measurement' | 'wikimedia';
  type: string;
  params?: Record<string, any>;
  caption?: string;
  keyword?: string;
}

export interface GeneratedVisualResult {
  svg: string;
  dataUri: string;
  width: number;
  height: number;
  title: string;
  credit: string;
  type: string;
}

// Helper: Escape XML/SVG string
function escapeXml(str: string | number): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper: Wrap SVG string to Data URI
export function svgToDataUri(svg: string): string {
  const cleaned = svg.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

// =========================================================================
// 1. GEOMETRI & BANGUN RUANG (MATEMATIKA)
// =========================================================================

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
    <linearGradient id="gradTop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="gradRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#edf2f7"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <linearGradient id="gradFront" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
  </defs>

  <!-- Rusuk Belakang (Garis Putus-Putus) -->
  <line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0 + dy}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + fw + dx}" y2="${y0 + dy}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + dx}" y2="${y0 - fh + dy}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Sisi Atas -->
  <polygon points="${x0},${y0 - fh} ${x0 + dx},${y0 - fh + dy} ${x0 + fw + dx},${y0 - fh + dy} ${x0 + fw},${y0 - fh}" fill="url(#gradTop)" stroke="#0f172a" stroke-width="2"/>

  <!-- Sisi Kanan -->
  <polygon points="${x0 + fw},${y0 - fh} ${x0 + fw + dx},${y0 - fh + dy} ${x0 + fw + dx},${y0 + dy} ${x0 + fw},${y0}" fill="url(#gradRight)" stroke="#0f172a" stroke-width="2"/>

  <!-- Sisi Depan -->
  <rect x="${x0}" y="${y0 - fh}" width="${fw}" height="${fh}" fill="url(#gradFront)" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik Sudut -->
  <text x="${x0 - 14}" y="${y0 + 14}" font-size="12" font-weight="bold" fill="#334155">A</text>
  <text x="${x0 + fw + 8}" y="${y0 + 14}" font-size="12" font-weight="bold" fill="#334155">B</text>
  <text x="${x0 + fw + dx + 8}" y="${y0 + dy + 6}" font-size="12" font-weight="bold" fill="#334155">C</text>
  <text x="${x0 + dx - 16}" y="${y0 + dy + 4}" font-size="12" font-weight="bold" fill="#94a3b8">D</text>

  <text x="${x0 - 14}" y="${y0 - fh - 6}" font-size="12" font-weight="bold" fill="#334155">E</text>
  <text x="${x0 + fw + 8}" y="${y0 - fh - 6}" font-size="12" font-weight="bold" fill="#334155">F</text>
  <text x="${x0 + fw + dx + 8}" y="${y0 - fh + dy - 4}" font-size="12" font-weight="bold" fill="#334155">G</text>
  <text x="${x0 + dx - 16}" y="${y0 - fh + dy - 6}" font-size="12" font-weight="bold" fill="#334155">H</text>

  <!-- Label Dimensi -->
  <line x1="${x0}" y1="${y0 + 20}" x2="${x0 + fw}" y2="${y0 + 20}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${x0 + fw / 2}" y="${y0 + 35}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">p = ${p} ${unit}</text>

  <line x1="${x0 - 15}" y1="${y0 - fh}" x2="${x0 - 15}" y2="${y0}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${x0 - 22}" y="${y0 - fh / 2 + 4}" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">t = ${t} ${unit}</text>

  <line x1="${x0 + fw + 15}" y1="${y0 + 8}" x2="${x0 + fw + dx + 12}" y2="${y0 + dy + 4}" stroke="#0284c7" stroke-width="1.5"/>
  <text x="${x0 + fw + dx / 2 + 25}" y="${y0 + dy / 2 + 18}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">l = ${l} ${unit}</text>

  <text x="180" y="240" text-anchor="middle" font-size="11" fill="#64748b">${escapeXml(label)}</text>
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
  <!-- Garis Belakang -->
  <line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0 + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + a + dx}" y2="${y0 + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="${x0 + dx}" y1="${y0 + dy}" x2="${x0 + dx}" y2="${y0 - a + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Sisi Atas -->
  <polygon points="${x0},${y0 - a} ${x0 + dx},${y0 - a + dy} ${x0 + a + dx},${y0 - a + dy} ${x0 + a},${y0 - a}" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>

  <!-- Sisi Kanan -->
  <polygon points="${x0 + a},${y0 - a} ${x0 + a + dx},${y0 - a + dy} ${x0 + a + dx},${y0 + dy} ${x0 + a},${y0}" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>

  <!-- Sisi Depan -->
  <rect x="${x0}" y="${y0 - a}" width="${a}" height="${a}" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik Sudut -->
  <text x="${x0 - 12}" y="${y0 + 14}" font-size="11" font-weight="bold" fill="#334155">A</text>
  <text x="${x0 + a + 6}" y="${y0 + 14}" font-size="11" font-weight="bold" fill="#334155">B</text>
  <text x="${x0 + a + dx + 6}" y="${y0 + dy + 4}" font-size="11" font-weight="bold" fill="#334155">C</text>
  <text x="${x0 - 12}" y="${y0 - a - 4}" font-size="11" font-weight="bold" fill="#334155">E</text>
  <text x="${x0 + a + 6}" y="${y0 - a - 4}" font-size="11" font-weight="bold" fill="#334155">F</text>
  <text x="${x0 + a + dx + 6}" y="${y0 - a + dy - 4}" font-size="11" font-weight="bold" fill="#334155">G</text>
  <text x="${x0 + dx - 12}" y="${y0 - a + dy - 4}" font-size="11" font-weight="bold" fill="#334155">H</text>

  <!-- Label Rusuk -->
  <text x="${x0 + a / 2}" y="${y0 + 22}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">s = ${s} ${unit}</text>
  <text x="${x0 - 20}" y="${y0 - a / 2 + 4}" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">s = ${s} ${unit}</text>

  <text x="170" y="225" text-anchor="middle" font-size="11" fill="#64748b">${escapeXml(label)}</text>
</svg>`;
}

/** Render Tabung 3D dengan jari-jari r dan tinggi t */
export function renderTabungSvg(params: { r?: number; t?: number; d?: number; unit?: string }): string {
  const r = params.r || (params.d ? params.d / 2 : 7);
  const t = params.t || 14;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" width="320" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <path d="M 80,60 L 80,180 A 80,25 0 0,0 240,180 L 240,60 Z" fill="#f8fafc" stroke="none"/>
  <path d="M 80,180 A 80,25 0 0,1 240,180" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <path d="M 80,180 A 80,25 0 0,0 240,180" fill="none" stroke="#0f172a" stroke-width="2"/>
  
  <line x1="80" y1="60" x2="80" y2="180" stroke="#0f172a" stroke-width="2"/>
  <line x1="240" y1="60" x2="240" y2="180" stroke="#0f172a" stroke-width="2"/>

  <ellipse cx="160" cy="60" rx="80" ry="25" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>

  <line x1="160" y1="60" x2="240" y2="60" stroke="#0284c7" stroke-width="2" stroke-dasharray="2,2"/>
  <circle cx="160" cy="60" r="3" fill="#0284c7"/>
  <text x="195" y="52" font-size="12" font-weight="bold" fill="#0284c7">r = ${r} ${unit}</text>

  <line x1="60" y1="60" x2="60" y2="180" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="55" y1="60" x2="65" y2="60" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="55" y1="180" x2="65" y2="180" stroke="#0284c7" stroke-width="1.5"/>
  <text x="50" y="125" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">t = ${t} ${unit}</text>

  <text x="160" y="230" text-anchor="middle" font-size="11" fill="#64748b">Tabung (r = ${r} ${unit}, t = ${t} ${unit})</text>
</svg>`;
}

/** Render Kerucut 3D dengan jari-jari r, tinggi t, garis pelukis s */
export function renderKerucutSvg(params: { r?: number; t?: number; s?: number; unit?: string }): string {
  const r = params.r || 7;
  const t = params.t || 12;
  const s = params.s || 15;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" width="320" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <polygon points="160,40 80,180 240,180" fill="#f8fafc"/>
  <path d="M 80,180 A 80,24 0 0,1 240,180" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <path d="M 80,180 A 80,24 0 0,0 240,180" fill="none" stroke="#0f172a" stroke-width="2"/>

  <line x1="160" y1="40" x2="80" y2="180" stroke="#0f172a" stroke-width="2"/>
  <line x1="160" y1="40" x2="240" y2="180" stroke="#0f172a" stroke-width="2"/>

  <line x1="160" y1="40" x2="160" y2="180" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>
  <circle cx="160" cy="180" r="3" fill="#0f172a"/>

  <line x1="160" y1="180" x2="240" y2="180" stroke="#0284c7" stroke-width="2"/>
  <text x="200" y="174" font-size="11" font-weight="bold" fill="#0284c7">r = ${r} ${unit}</text>

  <text x="154" y="115" text-anchor="end" font-size="11" font-weight="bold" fill="#e11d48">t = ${t} ${unit}</text>
  <text x="215" y="105" font-size="11" font-weight="bold" fill="#334155">s = ${s} ${unit}</text>

  <rect x="160" y="172" width="8" height="8" fill="none" stroke="#0f172a" stroke-width="1"/>
  <text x="160" y="230" text-anchor="middle" font-size="11" fill="#64748b">Kerucut (r = ${r} ${unit}, t = ${t} ${unit})</text>
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

// =========================================================================
// 2. PECAHAN (MATEMATIKA)
// =========================================================================

/** Render Pecahan Lingkaran dengan n bagian, k bagian diarsir (Mendukung Pecahan Campuran) */
export function renderPecahanLingkaranSvg(params: { pembagi?: number; diarsir?: number; utuh?: number; caption?: string }): string {
  const n = Math.max(2, Math.min(16, params.pembagi || 4));
  const k = Math.max(0, Math.min(n, params.diarsir != null ? params.diarsir : 3));
  const utuh = Math.max(0, Math.min(3, params.utuh || 0));

  if (utuh > 0) {
    const totalCircles = utuh + 1;
    const r = 55;
    const cy = 90;
    const spacing = 135;
    const w = totalCircles * spacing + 40;
    const h = 210;

    let circlesSvg = '';
    for (let c = 0; c < utuh; c++) {
      const cx = 80 + c * spacing;
      let fullSlices = '';
      for (let i = 0; i < n; i++) {
        const startAngle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const endAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        fullSlices += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z" fill="#38bdf8" stroke="#0f172a" stroke-width="1.8"/>`;
      }
      circlesSvg += `
        <g>${fullSlices}</g>
        <circle cx="${cx}" cy="${cy}" r="3" fill="#0f172a"/>
        <text x="${cx}" y="${cy + r + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">1 Bagian Utuh</text>
      `;
    }

    const cxFrac = 80 + utuh * spacing;
    let fracSlices = '';
    for (let i = 0; i < n; i++) {
      const startAngle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const endAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;
      const x1 = cxFrac + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cxFrac + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const isShaded = i < k;
      const fill = isShaded ? '#38bdf8' : '#ffffff';
      fracSlices += `<path d="M ${cxFrac},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z" fill="${fill}" stroke="#0f172a" stroke-width="1.8"/>`;
    }
    circlesSvg += `
      <g>${fracSlices}</g>
      <circle cx="${cxFrac}" cy="${cy}" r="3" fill="#0f172a"/>
    `;

    // Zero-spoiler: default caption netral tanpa membocorkan nilai pecahan
    const caption = params.caption !== undefined ? params.caption : 'Daerah yang Diarsir';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <rect width="${w}" height="${h}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="6"/>
  ${circlesSvg}
  ${caption ? `<text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
  }

  // Zero-spoiler: default caption netral tanpa membocorkan nilai pecahan k/n
  const caption = params.caption !== undefined ? params.caption : 'Daerah yang Diarsir';
  const cx = 160;
  const cy = 110;
  const r = 85;

  let slices = '';
  for (let i = 0; i < n; i++) {
    const startAngle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const endAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const isShaded = i < k;
    const fill = isShaded ? '#38bdf8' : '#ffffff';

    slices += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z" fill="${fill}" stroke="#0f172a" stroke-width="2"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <g>${slices}</g>
  <circle cx="${cx}" cy="${cy}" r="3" fill="#0f172a"/>
  ${caption ? `<text x="160" y="225" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
}

/** Render Pecahan Persegi Panjang Kotak-Kotak (Grid) */
export function renderPecahanPersegiSvg(params: { totalKotak?: number; diarsir?: number; kolom?: number; baris?: number; caption?: string }): string {
  // Smart grid calculation: find best cols×rows from total
  let total = params.totalKotak || 8;
  let cols = params.kolom || 0;
  let rows = params.baris || 0;

  // Auto-calculate best grid layout if not explicitly specified
  if (!cols && !rows) {
    // Find factor pair closest to square root for balanced visual
    const sqrt = Math.sqrt(total);
    let bestCols = total;
    let bestRows = 1;
    let bestDiff = total;
    for (let c = Math.ceil(sqrt); c <= Math.min(total, 12); c++) {
      if (total % c === 0) {
        const r = total / c;
        const diff = Math.abs(c - r);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestCols = c;
          bestRows = r;
        }
      }
    }
    // Ensure cols >= rows for horizontal layout
    cols = Math.max(bestCols, bestRows);
    rows = Math.min(bestCols, bestRows);
  } else {
    cols = cols || 4;
    rows = rows || 2;
    total = params.totalKotak || (cols * rows);
  }

  const shaded = Math.min(total, params.diarsir || 3);
  // Zero-spoiler: default caption netral tanpa membocorkan nilai pecahan
  const caption = params.caption !== undefined ? params.caption : 'Daerah yang Diarsir';

  // Tentukan geometri kotak yang proporsional
  const isStrip = rows === 1;
  const totalW = 260;
  const boxW = Math.min(totalW / cols, isStrip ? 56 : 70);
  const startX = (320 - (cols * boxW)) / 2;
  const boxH = isStrip ? 52 : Math.min(130 / rows, 60);
  const startY = isStrip ? 75 : ((180 - (rows * boxH)) / 2) + 20;

  let boxes = '';
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      count++;
      if (count > total) break;
      const isShaded = count <= shaded;
      const x = startX + c * boxW;
      const y = startY + r * boxH;
      if (isShaded) {
        boxes += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="#7dd3fc" stroke="#0f172a" stroke-width="2"/>`;
        boxes += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="url(#diagonalHatch)" stroke="#0f172a" stroke-width="2"/>`;
      } else {
        boxes += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#0369a1" stroke-width="2.2" />
    </pattern>
  </defs>
  <g>${boxes}</g>
  ${caption ? `<text x="160" y="${isStrip ? startY + boxH + 40 : 205}" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
}

// =========================================================================
// 3. STATISTIK & DATA CHART (MATEMATIKA & IPAS)
// =========================================================================

/** Render Diagram Batang (Bar Chart) */
export function renderDiagramBatangSvg(params: { judul?: string; labels?: string[]; data?: number[]; yLabel?: string }): string {
  const judul = params.judul || 'Diagram Batang Frekuensi Data';
  const labels = params.labels?.length ? params.labels : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const data = params.data?.length ? params.data : [25, 40, 30, 45, 35];
  const yLabel = params.yLabel || 'Jumlah';

  const maxVal = Math.max(...data, 10);
  const ceilMax = Math.ceil(maxVal / 10) * 10;

  const chartX = 55;
  const chartY = 45;
  const chartW = 270;
  const chartH = 140;

  let gridSvg = '';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((ceilMax / steps) * i);
    const y = chartY + chartH - (i / steps) * chartH;
    gridSvg += `
      <line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${i === 0 ? '#0f172a' : '#e2e8f0'}" stroke-width="${i === 0 ? 2 : 1}"/>
      <text x="${chartX - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b">${val}</text>
    `;
  }

  let barsSvg = '';
  const barCount = data.length;
  const slotW = chartW / barCount;
  const barW = Math.min(36, slotW * 0.65);

  data.forEach((val, idx) => {
    const bH = (val / ceilMax) * chartH;
    const bX = chartX + idx * slotW + (slotW - barW) / 2;
    const bY = chartY + chartH - bH;
    const lbl = labels[idx] || `${idx + 1}`;

    barsSvg += `
      <rect x="${bX}" y="${bY}" width="${barW}" height="${bH}" fill="#0284c7" rx="3" stroke="#0369a1" stroke-width="1.5"/>
      <text x="${bX + barW / 2}" y="${bY - 5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0369a1">${val}</text>
      <text x="${bX + barW / 2}" y="${chartY + chartH + 16}" text-anchor="middle" font-size="10.5" fill="#334155">${escapeXml(lbl)}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="180" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(judul)}</text>
  <text x="18" y="${chartY + chartH / 2}" text-anchor="middle" transform="rotate(-90, 18, ${chartY + chartH / 2})" font-size="10" font-weight="bold" fill="#64748b">${escapeXml(yLabel)}</text>
  ${gridSvg}
  ${barsSvg}
</svg>`;
}

/** Render Diagram Garis (Line Chart) */
export function renderDiagramGarisSvg(params: { judul?: string; labels?: string[]; data?: number[]; yLabel?: string }): string {
  const judul = params.judul || 'Diagram Garis Perubahan Data';
  const labels = params.labels?.length ? params.labels : ['06.00', '09.00', '12.00', '15.00', '18.00'];
  const data = params.data?.length ? params.data : [24, 28, 33, 31, 27];
  const yLabel = params.yLabel || 'Suhu (°C)';

  const minVal = Math.floor(Math.min(...data) / 5) * 5;
  const maxVal = Math.ceil(Math.max(...data) / 5) * 5;
  const range = maxVal - minVal || 10;

  const chartX = 55;
  const chartY = 45;
  const chartW = 270;
  const chartH = 140;

  let gridSvg = '';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = minVal + Math.round((range / steps) * i);
    const y = chartY + chartH - (i / steps) * chartH;
    gridSvg += `
      <line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${i === 0 ? '#0f172a' : '#e2e8f0'}" stroke-width="${i === 0 ? 2 : 1}"/>
      <text x="${chartX - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b">${val}</text>
    `;
  }

  const stepX = chartW / (data.length - 1 || 1);
  const points: { x: number; y: number; val: number; lbl: string }[] = [];

  data.forEach((val, idx) => {
    const x = chartX + idx * stepX;
    const y = chartY + chartH - ((val - minVal) / range) * chartH;
    points.push({ x, y, val, lbl: labels[idx] || `${idx + 1}` });
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  let dotsSvg = '';
  points.forEach(p => {
    dotsSvg += `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="10" font-weight="bold" fill="#e11d48">${p.val}</text>
      <text x="${p.x}" y="${chartY + chartH + 16}" text-anchor="middle" font-size="10.5" fill="#334155">${escapeXml(p.lbl)}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="180" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(judul)}</text>
  <text x="18" y="${chartY + chartH / 2}" text-anchor="middle" transform="rotate(-90, 18, ${chartY + chartH / 2})" font-size="10" font-weight="bold" fill="#64748b">${escapeXml(yLabel)}</text>
  ${gridSvg}
  <polyline points="${polylineStr}" fill="none" stroke="#e11d48" stroke-width="2.5"/>
  ${dotsSvg}
</svg>`;
}

// =========================================================================
// 4. DIAGRAM IPAS / SAINS BERLABEL DINAMIS (HURUF X / POINTER)
// =========================================================================

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

// =========================================================================
// 5. PENGUKURAN & WAKTU (MATEMATIKA & BAHASA INGGRIS)
// =========================================================================

/** Render Jam Analog (Telling Time) */
export function renderJamAnalogSvg(params: { jam?: number; menit?: number; caption?: string }): string {
  const jam = params.jam != null ? params.jam : 7;
  const menit = params.menit != null ? params.menit : 30;
  // Zero-spoiler: default caption netral, tidak mencetak jawaban jam/menit
  const caption = params.caption !== undefined ? params.caption : 'Jam Dinding Analog';

  const cx = 150;
  const cy = 110;
  const r = 80;

  const hourAngle = (((jam % 12) + menit / 60) * 30 - 90) * (Math.PI / 180);
  const hourLen = 45;
  const hX = cx + hourLen * Math.cos(hourAngle);
  const hY = cy + hourLen * Math.sin(hourAngle);

  const minAngle = (menit * 6 - 90) * (Math.PI / 180);
  const minLen = 65;
  const mX = cx + minLen * Math.cos(minAngle);
  const mY = cy + minLen * Math.sin(minAngle);

  let numerals = '';
  for (let h = 1; h <= 12; h++) {
    const a = (h * 30 - 90) * (Math.PI / 180);
    const numR = r - 16;
    const nx = cx + numR * Math.cos(a);
    const ny = cy + numR * Math.sin(a);
    numerals += `<text x="${nx}" y="${ny + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#334155">${h}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 230" width="300" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#cbd5e1" stroke-width="1"/>

  ${numerals}

  <line x1="${cx}" y1="${cy}" x2="${hX}" y2="${hY}" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${mX}" y2="${mY}" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="5" fill="#e11d48"/>

  ${caption ? `<text x="${cx}" y="215" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">${escapeXml(caption)}</text>` : ''}
</svg>`;
}

/** Render Garis Bilangan (Number Line) */
export function renderGarisBilanganSvg(params: { min?: number; max?: number; titik?: Array<{ x: number; label: string }> }): string {
  const min = params.min != null ? params.min : -5;
  const max = params.max != null ? params.max : 5;
  const count = max - min;
  const points = params.titik || [];

  const startX = 35;
  const endX = 315;
  const lineY = 80;
  const step = (endX - startX) / count;

  let ticksSvg = '';
  for (let val = min; val <= max; val++) {
    const x = startX + (val - min) * step;
    const isZero = val === 0;
    ticksSvg += `
      <line x1="${x}" y1="${lineY - 7}" x2="${x}" y2="${lineY + 7}" stroke="#0f172a" stroke-width="${isZero ? 2 : 1.2}"/>
      <text x="${x}" y="${lineY + 22}" text-anchor="middle" font-size="11" font-weight="${isZero ? 'bold' : 'normal'}" fill="${isZero ? '#0f172a' : '#475569'}">${val}</text>
    `;
  }

  let markedPointsSvg = '';
  points.forEach(pt => {
    if (pt.x >= min && pt.x <= max) {
      const px = startX + (pt.x - min) * step;
      markedPointsSvg += `
        <circle cx="${px}" cy="${lineY}" r="5" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>
        <text x="${px}" y="${lineY - 14}" text-anchor="middle" font-size="13" font-weight="bold" fill="#e11d48">${escapeXml(pt.label)}</text>
      `;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 140" width="350" height="140" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="175" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Garis Bilangan</text>
  
  <line x1="20" y1="${lineY}" x2="330" y2="${lineY}" stroke="#0f172a" stroke-width="2"/>
  <polygon points="15,${lineY} 25,${lineY - 4} 25,${lineY + 4}" fill="#0f172a"/>
  <polygon points="335,${lineY} 325,${lineY - 4} 325,${lineY + 4}" fill="#0f172a"/>

  ${ticksSvg}
  ${markedPointsSvg}
</svg>`;
}

// =========================================================================
// 6. BANGUN RUANG TAMBAHAN (BOLA, PRISMA, LIMAS)
// =========================================================================

/** Render Bola 3D dengan jari-jari r */
export function renderBolaSvg(params: { r?: number; d?: number; unit?: string }): string {
  const r = params.r || (params.d ? params.d / 2 : 7);
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <radialGradient id="gradBola" cx="40%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </radialGradient>
  </defs>

  <!-- Bola -->
  <circle cx="160" cy="115" r="80" fill="url(#gradBola)" stroke="#0f172a" stroke-width="2"/>

  <!-- Garis Ekuator (elips putus-putus) -->
  <ellipse cx="160" cy="115" rx="80" ry="22" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="5,4"/>

  <!-- Garis Meridian (vertikal, putus-putus) -->
  <ellipse cx="160" cy="115" rx="22" ry="80" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="4,4"/>

  <!-- Titik pusat -->
  <circle cx="160" cy="115" r="3" fill="#0f172a"/>
  <text x="168" y="112" font-size="11" font-weight="bold" fill="#334155">O</text>

  <!-- Garis jari-jari -->
  <line x1="160" y1="115" x2="240" y2="115" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="195" y="108" font-size="12" font-weight="bold" fill="#0284c7">r = ${r} ${unit}</text>

  <text x="160" y="225" text-anchor="middle" font-size="11" fill="#64748b">Bola (r = ${r} ${unit})</text>
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
  <!-- Rusuk belakang (putus-putus) -->
  <line x1="60" y1="180" x2="${60 + dx}" y2="${180 + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="130" y1="80" x2="${130 + dx}" y2="${80 + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="${60 + dx}" y1="${180 + dy}" x2="${130 + dx}" y2="${80 + dy}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Sisi atas (segitiga depan ke belakang) -->
  <polygon points="130,80 ${130 + dx},${80 + dy} ${200 + dx},${180 + dy} 200,180" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>

  <!-- Sisi kanan -->
  <polygon points="200,180 ${200 + dx},${180 + dy} ${130 + dx},${80 + dy} 130,80" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>

  <!-- Segitiga depan -->
  <polygon points="60,180 200,180 130,80" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

  <!-- Rusuk depan-belakang bawah kanan -->
  <line x1="200" y1="180" x2="${200 + dx}" y2="${180 + dy}" stroke="#0f172a" stroke-width="2"/>

  <!-- Simbol siku-siku -->
  <rect x="130" y="164" width="12" height="12" fill="none" stroke="#0f172a" stroke-width="1.2"/>

  <!-- Titik sudut -->
  <text x="46" y="192" font-size="11" font-weight="bold" fill="#334155">A</text>
  <text x="206" y="192" font-size="11" font-weight="bold" fill="#334155">B</text>
  <text x="120" y="74" font-size="11" font-weight="bold" fill="#334155">C</text>
  <text x="${200 + dx + 6}" y="${180 + dy + 4}" font-size="11" font-weight="bold" fill="#334155">E</text>
  <text x="${130 + dx + 6}" y="${80 + dy - 4}" font-size="11" font-weight="bold" fill="#334155">F</text>

  <!-- Label dimensi -->
  <text x="130" y="200" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">alas = ${a} ${unit}</text>
  <text x="112" y="135" text-anchor="end" font-size="11" font-weight="bold" fill="#e11d48">t = ${tSeg} ${unit}</text>
  <text x="${200 + dx / 2 + 12}" y="${180 + dy / 2 + 16}" font-size="11" font-weight="bold" fill="#047857">p = ${p} ${unit}</text>

  <text x="180" y="240" text-anchor="middle" font-size="11" fill="#64748b">Prisma Segitiga (a=${a}, t=${tSeg}, p=${p} ${unit})</text>
</svg>`;
}

/** Render Limas Segiempat 3D dengan alas persegi s dan tinggi t */
export function renderLimasSvg(params: { s?: number; t?: number; unit?: string }): string {
  const s = params.s || 10;
  const t = params.t || 12;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 250" width="340" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Alas (persegi dilihat isometrik) -->
  <polygon points="170,175 95,210 170,245 245,210" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>

  <!-- Rusuk belakang (putus-putus) -->
  <line x1="170" y1="175" x2="170" y2="50" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Sisi segitiga depan-kiri -->
  <polygon points="170,50 95,210 170,245" fill="#e2e8f0" stroke="#0f172a" stroke-width="2" fill-opacity="0.6"/>

  <!-- Sisi segitiga depan-kanan -->
  <polygon points="170,50 245,210 170,245" fill="#f1f5f9" stroke="#0f172a" stroke-width="2" fill-opacity="0.6"/>

  <!-- Sisi segitiga kiri-belakang -->
  <line x1="170" y1="50" x2="95" y2="210" stroke="#0f172a" stroke-width="2"/>
  <line x1="170" y1="50" x2="170" y2="175" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Sisi segitiga kanan-belakang -->
  <line x1="170" y1="50" x2="245" y2="210" stroke="#0f172a" stroke-width="2"/>

  <!-- Titik sudut -->
  <text x="170" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">T</text>
  <text x="156" y="172" font-size="11" font-weight="bold" fill="#94a3b8">O</text>
  <text x="80" y="218" font-size="11" font-weight="bold" fill="#334155">A</text>
  <text x="170" y="258" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">B</text>
  <text x="252" y="218" font-size="11" font-weight="bold" fill="#334155">C</text>
  <text x="170" y="180" text-anchor="middle" font-size="11" font-weight="bold" fill="#94a3b8">D</text>

  <!-- Garis tinggi (T ke O, putus-putus merah) -->
  <line x1="170" y1="50" x2="170" y2="210" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>
  <rect x="170" y="198" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1"/>

  <!-- Label dimensi -->
  <text x="178" y="135" font-size="11" font-weight="bold" fill="#e11d48">t = ${t} ${unit}</text>
  <text x="130" y="240" font-size="11" font-weight="bold" fill="#0284c7">s = ${s} ${unit}</text>

</svg>`;
}

// =========================================================================
// 7. BANGUN DATAR 2D (LINGKARAN, TRAPESIUM, JAJAR GENJANG, DLL)
// =========================================================================

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

// =========================================================================
// 7b. GEOMETRI MATEMATIKA TAMBAHAN (Persegi Panjang, Segitiga Variatif,
//     Jaring-jaring, Koordinat, Venn, Pictogram, Simetri, Bangun Gabungan)
// =========================================================================

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

  let faces: { x: number; y: number; label: string }[] = [];

  if (pola === 'tangga') {
    faces = [
      { x: cs + gap, y: 0, label: 'Atas' },
      { x: 0, y: cs + gap, label: 'Kiri' },
      { x: cs + gap, y: cs + gap, label: 'Depan' },
      { x: 2 * (cs + gap), y: cs + gap, label: 'Kanan' },
      { x: 3 * (cs + gap), y: cs + gap, label: 'Belakang' },
      { x: 3 * (cs + gap), y: 2 * (cs + gap), label: 'Bawah' },
    ];
  } else if (pola === 't') {
    faces = [
      { x: 0, y: 0, label: 'Kiri' },
      { x: cs + gap, y: 0, label: 'Depan' },
      { x: 2 * (cs + gap), y: 0, label: 'Kanan' },
      { x: cs + gap, y: cs + gap, label: 'Bawah' },
      { x: cs + gap, y: 2 * (cs + gap), label: 'Belakang' },
      { x: cs + gap, y: 3 * (cs + gap), label: 'Atas' },
    ];
  } else {
    faces = [
      { x: cs + gap, y: 0, label: 'Atas' },
      { x: 0, y: cs + gap, label: 'Kiri' },
      { x: cs + gap, y: cs + gap, label: 'Depan' },
      { x: 2 * (cs + gap), y: cs + gap, label: 'Kanan' },
      { x: 3 * (cs + gap), y: cs + gap, label: 'Belakang' },
      { x: cs + gap, y: 2 * (cs + gap), label: 'Bawah' },
    ];
  }

  const colors = ['#dbeafe', '#fce7f3', '#d1fae5', '#fef3c7', '#e0e7ff', '#fecaca'];
  const maxCols = Math.max(...faces.map(f => f.x / (cs + gap))) + 1;
  const maxRows = Math.max(...faces.map(f => f.y / (cs + gap))) + 1;

  const w = maxCols * (cs + gap) + 40;
  const h = maxRows * (cs + gap) + 55;
  const ox = 20;
  const oy = 15;

  let rects = '';
  faces.forEach((f, i) => {
    rects += `<rect x="${ox + f.x}" y="${oy + f.y}" width="${cs}" height="${cs}" fill="${colors[i]}" stroke="#1e40af" stroke-width="2" rx="2"/>`;
    rects += `<text x="${ox + f.x + cs / 2}" y="${oy + f.y + cs / 2 + 4}" text-anchor="middle" font-size="9" fill="#475569">${f.label}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  ${rects}
  <text x="${w / 2}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#64748b">Jaring-jaring Kubus Pola ${pola.toUpperCase()} (s = ${s} ${unit})</text>
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
  const oy = 20;
  const colors = ['#dbeafe', '#d1fae5', '#fef3c7', '#fce7f3', '#e0e7ff', '#fecaca'];

  // Layout T: atas (t×l), kiri (p×t), depan (p×l), kanan (p×t), bawah (t×l), belakang (p×l di bawah depan)
  const faces = [
    { x: ts, y: 0, w: ps, h: ts, label: 'Atas', color: colors[0] },
    { x: 0, y: ts, w: ts, h: ls, label: 'Kiri', color: colors[1] },
    { x: ts, y: ts, w: ps, h: ls, label: 'Depan', color: colors[2] },
    { x: ts + ps, y: ts, w: ts, h: ls, label: 'Kanan', color: colors[3] },
    { x: ts + ps + ts, y: ts, w: ps, h: ls, label: 'Belakang', color: colors[4] },
    { x: ts, y: ts + ls, w: ps, h: ts, label: 'Bawah', color: colors[5] },
  ];

  let rects = '';
  faces.forEach(f => {
    rects += `<rect x="${ox + f.x}" y="${oy + f.y}" width="${f.w}" height="${f.h}" fill="${f.color}" stroke="#1e40af" stroke-width="1.8" rx="1"/>`;
    rects += `<text x="${ox + f.x + f.w / 2}" y="${oy + f.y + f.h / 2 + 4}" text-anchor="middle" font-size="9" fill="#475569">${f.label}</text>`;
  });

  const totalW = 2 * ts + 2 * ps + ox * 2;
  const totalH = ts + ls + ts + oy * 2 + 30;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  ${rects}
  <!-- Label dimensi -->
  <text x="${ox + ts + ps / 2}" y="${oy - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">p = ${p} ${unit}</text>
  <text x="${ox - 5}" y="${oy + ts + ls / 2 + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#0284c7">l = ${l} ${unit}</text>
  <text x="${ox + ts / 2}" y="${oy - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#7c3aed">t = ${t} ${unit}</text>
  <text x="${totalW / 2}" y="${totalH - 6}" text-anchor="middle" font-size="11" fill="#64748b">Jaring-jaring Balok (${p}×${l}×${t} ${unit})</text>
</svg>`;
}

/** Render Bidang Koordinat Kartesius 4 kuadran dengan titik berlabel */
export function renderKoordinatKartesiusSvg(params: { titik?: Array<{ x: number; y: number; label: string }>; xRange?: number; yRange?: number }): string {
  const titik = params.titik?.length ? params.titik : [{ x: 3, y: 4, label: 'P' }, { x: -2, y: 3, label: 'Q' }];
  const xRange = params.xRange || 6;
  const yRange = params.yRange || 6;

  const maxRange = Math.max(xRange, yRange, 1);
  const gridStep = Math.min(28, Math.max(14, Math.floor(145 / maxRange)));
  const w = Math.max(360, (xRange * gridStep + 30) * 2);
  const h = Math.max(320, (yRange * gridStep + 35) * 2);
  const cx = w / 2;
  const cy = h / 2 - 10;

  // Grid lines
  let grid = '';
  for (let i = -xRange; i <= xRange; i++) {
    const gx = cx + i * gridStep;
    grid += `<line x1="${gx}" y1="${cy - yRange * gridStep}" x2="${gx}" y2="${cy + yRange * gridStep}" stroke="${i === 0 ? '#0f172a' : '#e2e8f0'}" stroke-width="${i === 0 ? 2 : 0.8}"/>`;
    if (i !== 0) grid += `<text x="${gx}" y="${cy + 14}" text-anchor="middle" font-size="9" fill="#64748b">${i}</text>`;
  }
  for (let j = -yRange; j <= yRange; j++) {
    const gy = cy - j * gridStep;
    grid += `<line x1="${cx - xRange * gridStep}" y1="${gy}" x2="${cx + xRange * gridStep}" y2="${gy}" stroke="${j === 0 ? '#0f172a' : '#e2e8f0'}" stroke-width="${j === 0 ? 2 : 0.8}"/>`;
    if (j !== 0) grid += `<text x="${cx - 12}" y="${gy + 4}" text-anchor="end" font-size="9" fill="#64748b">${j}</text>`;
  }

  // Axis labels
  grid += `<text x="${cx + xRange * gridStep + 8}" y="${cy + 4}" font-size="12" font-weight="bold" fill="#0f172a">X</text>`;
  grid += `<text x="${cx + 8}" y="${cy - yRange * gridStep - 4}" font-size="12" font-weight="bold" fill="#0f172a">Y</text>`;
  grid += `<text x="${cx - 10}" y="${cy + 14}" font-size="9" fill="#64748b">O</text>`;

  // Axis arrows
  grid += `<polygon points="${cx + xRange * gridStep + 4},${cy} ${cx + xRange * gridStep - 2},${cy - 4} ${cx + xRange * gridStep - 2},${cy + 4}" fill="#0f172a"/>`;
  grid += `<polygon points="${cx},${cy - yRange * gridStep - 4} ${cx - 4},${cy - yRange * gridStep + 2} ${cx + 4},${cy - yRange * gridStep + 2}" fill="#0f172a"/>`;

  // Plot points
  const pointColors = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed'];
  let points = '';
  titik.forEach((pt, i) => {
    const px = cx + pt.x * gridStep;
    const py = cy - pt.y * gridStep;
    const color = pointColors[i % pointColors.length];
    points += `<circle cx="${px}" cy="${py}" r="5" fill="${color}" stroke="white" stroke-width="1.5"/>`;
    points += `<text x="${px + 8}" y="${py - 6}" font-size="11" font-weight="bold" fill="${color}">${escapeXml(pt.label)}(${pt.x},${pt.y})</text>`;
    // Garis bantu putus-putus ke sumbu
    points += `<line x1="${px}" y1="${py}" x2="${px}" y2="${cy}" stroke="${color}" stroke-width="0.8" stroke-dasharray="3,3"/>`;
    points += `<line x1="${px}" y1="${py}" x2="${cx}" y2="${py}" stroke="${color}" stroke-width="0.8" stroke-dasharray="3,3"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  ${grid}
  ${points}
  <text x="${w / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#64748b">Bidang Koordinat Kartesius</text>
</svg>`;
}

/** Render Diagram Venn dua himpunan dengan irisan */
export function renderDiagramVennSvg(params: { judul?: string; labelA?: string; labelB?: string; aSaja?: number; irisan?: number; bSaja?: number }): string {
  const judul = params.judul || 'Diagram Venn';
  const labelA = params.labelA || 'Himpunan A';
  const labelB = params.labelB || 'Himpunan B';
  const aSaja = params.aSaja ?? 10;
  const irisan = params.irisan ?? 5;
  const bSaja = params.bSaja ?? 8;

  const w = 380;
  const h = 260;
  const r = 85;
  const cax = 150;
  const cbx = 230;
  const cy = 125;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Judul -->
  <text x="${w / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">${escapeXml(judul)}</text>

  <!-- Kotak semesta -->
  <rect x="20" y="32" width="${w - 40}" height="${h - 60}" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" rx="6"/>
  <text x="35" y="50" font-size="11" font-weight="bold" fill="#64748b">S</text>

  <!-- Lingkaran A -->
  <circle cx="${cax}" cy="${cy}" r="${r}" fill="#bfdbfe" fill-opacity="0.6" stroke="#2563eb" stroke-width="2"/>
  <text x="${cax - 40}" y="${cy - r - 8}" font-size="12" font-weight="bold" fill="#2563eb">${escapeXml(labelA)}</text>

  <!-- Lingkaran B -->
  <circle cx="${cbx}" cy="${cy}" r="${r}" fill="#fecaca" fill-opacity="0.6" stroke="#dc2626" stroke-width="2"/>
  <text x="${cbx + 10}" y="${cy - r - 8}" font-size="12" font-weight="bold" fill="#dc2626">${escapeXml(labelB)}</text>

  <!-- Angka di area A saja -->
  <text x="${cax - 35}" y="${cy + 5}" text-anchor="middle" font-size="20" font-weight="bold" fill="#1e40af">${aSaja}</text>

  <!-- Angka di irisan -->
  <text x="${(cax + cbx) / 2}" y="${cy + 5}" text-anchor="middle" font-size="20" font-weight="bold" fill="#7c3aed">${irisan}</text>

  <!-- Angka di area B saja -->
  <text x="${cbx + 35}" y="${cy + 5}" text-anchor="middle" font-size="20" font-weight="bold" fill="#b91c1c">${bSaja}</text>

  <text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-size="11" fill="#64748b">${escapeXml(judul)}</text>
</svg>`;
}

/** Render Pictogram / Diagram Gambar dengan ikon berulang */
export function renderPictogramSvg(params: { judul?: string; labels?: string[]; data?: number[]; ikon?: string; nilaiIkon?: number }): string {
  const judul = params.judul || 'Diagram Gambar';
  const labels = params.labels?.length ? params.labels : ['Apel', 'Jeruk', 'Mangga'];
  const data = params.data?.length ? params.data : [4, 3, 5];
  const ikon = params.ikon || '●';
  const nilaiIkon = params.nilaiIkon || 1;

  const rowH = 36;
  const labelW = 90;
  const iconW = 22;
  const maxVal = Math.max(...data);
  const w = Math.max(320, labelW + maxVal * iconW + 60);
  const h = labels.length * rowH + 90;

  let rows = '';
  const rowColors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
  labels.forEach((lbl, i) => {
    const ry = 55 + i * rowH;
    const val = data[i] || 0;
    const color = rowColors[i % rowColors.length];

    // Label
    rows += `<text x="${labelW - 5}" y="${ry + 14}" text-anchor="end" font-size="12" font-weight="600" fill="#334155">${escapeXml(lbl)}</text>`;
    // Separator line
    rows += `<line x1="${labelW}" y1="${ry - 2}" x2="${labelW}" y2="${ry + rowH - 8}" stroke="#cbd5e1" stroke-width="1"/>`;

    // Icons
    for (let j = 0; j < val; j++) {
      rows += `<text x="${labelW + 10 + j * iconW}" y="${ry + 16}" font-size="16" fill="${color}">${ikon}</text>`;
    }
    // Value hanya jika diminta eksplisit (Zero-spoiler: default jangan bocorkan hasil kali)
    if (params.showValues) {
      rows += `<text x="${labelW + 10 + val * iconW + 5}" y="${ry + 14}" font-size="11" fill="#64748b">(${val * nilaiIkon})</text>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="${w / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">${escapeXml(judul)}</text>
  <text x="${w / 2}" y="42" text-anchor="middle" font-size="10" fill="#64748b">Keterangan: ${ikon} = ${nilaiIkon}</text>
  ${rows}
  <text x="${w / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#64748b">Pictogram / Diagram Gambar</text>
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



/** Render Diagram Lingkaran (Pie Chart) dengan data dan persentase */
export function renderDiagramLingkaranSvg(params: { judul?: string; labels?: string[]; data?: number[]; showPercent?: boolean }): string {
  const judul = params.judul || 'Diagram Lingkaran Data';
  const labels = params.labels?.length ? params.labels : ['Merah', 'Biru', 'Hijau', 'Kuning'];
  const data = params.data?.length ? params.data : [35, 25, 20, 20];
  const showPercent = params.showPercent !== false;

  const total = data.reduce((s, v) => s + v, 0) || 1;
  const cx = 150;
  const cy = 115;
  const r = 80;
  const colors = ['#0284c7', '#e11d48', '#047857', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

  let slicesSvg = '';
  let legendSvg = '';
  let startAngle = -Math.PI / 2;

  data.forEach((val, idx) => {
    const pct = (val / total) * 100;
    const sweep = (val / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const color = colors[idx % colors.length];
    const lbl = labels[idx] || `Item ${idx + 1}`;

    if (data.length === 1 || sweep >= 2 * Math.PI - 0.001) {
      slicesSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;
    } else {
      slicesSvg += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;
    }

    // Label di tengah slice
    const midAngle = startAngle + sweep / 2;
    const labelR = r * 0.6;
    const lx = data.length === 1 ? cx : (cx + labelR * Math.cos(midAngle));
    const ly = data.length === 1 ? cy : (cy + labelR * Math.sin(midAngle));
    if (showPercent && pct >= 5) {
      slicesSvg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">${Math.round(pct)}%</text>`;
    }

    // Legend
    const legendY = 30 + idx * 18;
    legendSvg += `
      <rect x="260" y="${legendY - 8}" width="12" height="12" fill="${color}" rx="2"/>
      <text x="278" y="${legendY + 2}" font-size="10" fill="#334155">${escapeXml(lbl)}</text>
    `;

    startAngle = endAngle;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <text x="150" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(judul)}</text>
  ${slicesSvg}
  ${legendSvg}
</svg>`;
}

// =========================================================================
// 9. DIAGRAM IPAS/SAINS TAMBAHAN (ORGAN PENCERNAAN, SUB-DIAGRAM, ALVEOLUS, RANTAI MAKANAN)
// =========================================================================

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

export function renderMistarSvg(params: any): string {
  const start = Math.max(0, Math.min(10, Number(params.start ?? 3.0)));
  const end = Math.max(start + 0.5, Math.min(12, Number(params.end ?? 8.5)));
  const objectType = (params.objectType || 'pensil').toLowerCase();
  const label = params.label || 'Panjang = ... cm';

  const rulerX = 40;
  const rulerY = 100;
  const maxCm = 10;
  const pxPerCm = 40;
  const rulerWidth = maxCm * pxPerCm;

  let ticks = '';
  for (let i = 0; i <= maxCm * 10; i++) {
    const x = rulerX + i * 4;
    if (i % 10 === 0) {
      const cmVal = i / 10;
      ticks += `
        <line x1="${x}" y1="${rulerY}" x2="${x}" y2="${rulerY + 20}" stroke="#0f172a" stroke-width="1.5"/>
        <text x="${x}" y="${rulerY + 34}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">${cmVal}</text>
      `;
    } else if (i % 5 === 0) {
      ticks += `<line x1="${x}" y1="${rulerY}" x2="${x}" y2="${rulerY + 14}" stroke="#334155" stroke-width="1.2"/>`;
    } else {
      ticks += `<line x1="${x}" y1="${rulerY}" x2="${x}" y2="${rulerY + 8}" stroke="#64748b" stroke-width="0.8"/>`;
    }
  }

  const objStartX = rulerX + start * pxPerCm;
  const objEndX = rulerX + end * pxPerCm;
  const objWidth = objEndX - objStartX;
  const objY = 62;
  const objHeight = 22;

  let objectSvg = '';
  if (objectType === 'paku') {
    objectSvg = `
      <rect x="${objStartX}" y="${objY - 3}" width="4" height="${objHeight + 6}" fill="#475569" rx="1"/>
      <rect x="${objStartX + 4}" y="${objY + 6}" width="${objWidth - 14}" height="10" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
      <polygon points="${objEndX - 10},${objY + 6} ${objEndX},${objY + 11} ${objEndX - 10},${objY + 16}" fill="#64748b"/>
    `;
  } else if (objectType === 'penghapus') {
    objectSvg = `
      <rect x="${objStartX}" y="${objY}" width="${objWidth * 0.5}" height="${objHeight}" fill="#3b82f6" rx="3"/>
      <rect x="${objStartX + objWidth * 0.5}" y="${objY}" width="${objWidth * 0.5}" height="${objHeight}" fill="#ef4444" rx="3"/>
      <text x="${objStartX + objWidth / 2}" y="${objY + 15}" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">ERASER</text>
    `;
  } else {
    // Pensil (Default)
    const eraserW = Math.min(18, objWidth * 0.15);
    const ferruleW = Math.min(10, objWidth * 0.1);
    const tipW = Math.min(22, objWidth * 0.2);
    const bodyW = objWidth - eraserW - ferruleW - tipW;

    objectSvg = `
      <rect x="${objStartX}" y="${objY}" width="${eraserW}" height="${objHeight}" fill="#fb7185" rx="3"/>
      <rect x="${objStartX + eraserW}" y="${objY}" width="${ferruleW}" height="${objHeight}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8"/>
      <rect x="${objStartX + eraserW + ferruleW}" y="${objY}" width="${bodyW}" height="${objHeight}" fill="#f59e0b"/>
      <line x1="${objStartX + eraserW + ferruleW}" y1="${objY + 7}" x2="${objStartX + eraserW + ferruleW + bodyW}" y2="${objY + 7}" stroke="#d97706" stroke-width="1.2"/>
      <line x1="${objStartX + eraserW + ferruleW}" y1="${objY + 15}" x2="${objStartX + eraserW + ferruleW + bodyW}" y2="${objY + 15}" stroke="#b45309" stroke-width="1.2"/>
      <polygon points="${objEndX - tipW},${objY} ${objEndX},${objY + objHeight / 2} ${objEndX - tipW},${objY + objHeight}" fill="#fde68a" stroke="#d97706" stroke-width="0.8"/>
      <polygon points="${objEndX - 7},${objY + 7} ${objEndX},${objY + objHeight / 2} ${objEndX - 7},${objY + 15}" fill="#0f172a"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrMistar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#e11d48" />
    </marker>
  </defs>

  <rect width="480" height="200" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Panjang dengan Mistar</text>

  <line x1="${objStartX}" y1="42" x2="${objEndX}" y2="42" stroke="#e11d48" stroke-width="2" marker-start="url(#arrMistar)" marker-end="url(#arrMistar)"/>
  <rect x="${(objStartX + objEndX) / 2 - 50}" y="31" width="100" height="20" rx="4" fill="#e11d48"/>
  <text x="${(objStartX + objEndX) / 2}" y="45" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#ffffff">${escapeXml(label)}</text>

  <line x1="${objStartX}" y1="52" x2="${objStartX}" y2="${rulerY}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>
  <line x1="${objEndX}" y1="52" x2="${objEndX}" y2="${rulerY}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>

  ${objectSvg}

  <rect x="${rulerX - 5}" y="${rulerY}" width="${rulerWidth + 10}" height="65" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" rx="3" opacity="0.85"/>
  <text x="${rulerX + rulerWidth - 10}" y="${rulerY + 54}" text-anchor="end" font-size="12" font-weight="bold" fill="#78350f">cm</text>
  ${ticks}

  <text x="240" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Tentukan panjang benda berdasarkan skala pada mistar!</text>
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

export function renderPerisaiPancasilaSvg(params: any): string {
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

export function renderBusurDerajatSvg(params: any): string {
  const deg = Math.max(10, Math.min(170, Number(params.derajat ?? 60)));
  const labelChar = params.label || 'X';

  const cx = 240;
  const cy = 195;
  const R = 145;
  const rHole = 18;

  let ticks = '';
  for (let a = 0; a <= 180; a += 1) {
    const rad = (a * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    if (a % 10 === 0) {
      const x1 = cx - R * cos;
      const y1 = cy - R * sin;
      const x2 = cx - (R - 14) * cos;
      const y2 = cy - (R - 14) * sin;
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="1.2"/>`;

      const xText = cx - (R - 24) * cos;
      const yText = cy - (R - 24) * sin + 3.5;
      const val = 180 - a;
      const numLabel = (val === 0 || val === 90 || val === 180) ? `${val}°` : `${val}`;
      ticks += `<text x="${xText}" y="${yText}" text-anchor="middle" font-size="7" font-weight="600" fill="#0f172a">${numLabel}</text>`;
    } else if (a % 5 === 0) {
      const x1 = cx - R * cos;
      const y1 = cy - R * sin;
      const x2 = cx - (R - 9) * cos;
      const y2 = cy - (R - 9) * sin;
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="1"/>`;
    } else {
      const x1 = cx - R * cos;
      const y1 = cy - R * sin;
      const x2 = cx - (R - 5) * cos;
      const y2 = cy - (R - 5) * sin;
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="0.7"/>`;
    }
  }

  const baseRayX = cx + R + 25;
  const targetRad = (deg * Math.PI) / 180;
  const rayLen = R + 22;
  const rayEndX = cx + rayLen * Math.cos(targetRad);
  const rayEndY = cy - rayLen * Math.sin(targetRad);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; border-radius:8px;">
  <defs>
    <marker id="arrBusur" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
    </marker>
  </defs>

  <rect width="480" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
  <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Pengukuran Sudut Busur Derajat</text>

  <path d="M ${cx - R},${cy} A ${R} ${R} 0 0,1 ${cx + R},${cy} Z" fill="#fef3c7" fill-opacity="0.6" stroke="#d97706" stroke-width="1.5"/>
  <path d="M ${cx - rHole},${cy} A ${rHole} ${rHole} 0 0,1 ${cx + rHole},${cy} Z" fill="#ffffff" stroke="#d97706" stroke-width="1"/>

  ${ticks}

  <line x1="${cx - 10}" y1="${cy}" x2="${cx + 10}" y2="${cy}" stroke="#0f172a" stroke-width="1.5"/>
  <line x1="${cx}" y1="${cy - 10}" x2="${cx}" y2="${cy + 5}" stroke="#0f172a" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="3" fill="#dc2626"/>

  <line x1="${cx}" y1="${cy}" x2="${baseRayX}" y2="${cy}" stroke="#dc2626" stroke-width="3" marker-end="url(#arrBusur)"/>
  <line x1="${cx}" y1="${cy}" x2="${rayEndX}" y2="${rayEndY}" stroke="#dc2626" stroke-width="3" marker-end="url(#arrBusur)"/>

  <path d="M ${cx + 40},${cy} A 40 40 0 0,0 ${cx + 40 * Math.cos(targetRad)},${cy - 40 * Math.sin(targetRad)}" fill="none" stroke="#dc2626" stroke-width="2"/>
  <circle cx="${cx + 25 * Math.cos(targetRad / 2)}" cy="${cy - 25 * Math.sin(targetRad / 2)}" r="10" fill="#e11d48"/>
  <text x="${cx + 25 * Math.cos(targetRad / 2)}" y="${cy - 25 * Math.sin(targetRad / 2) + 3.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>

  <text x="240" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Tentukan besar sudut yang ditunjukkan oleh busur derajat!</text>
</svg>`;
}

// =========================================================================
// 10. DISPATCHER & PARSER CERDAS
// =========================================================================

/**
 * Dispatcher utama untuk menghasilkan SVG stimulus berdasarkan konfigurasi
 */
export function generateVisualStimulus(config: VisualStimulusConfig): GeneratedVisualResult | null {
  const type = (config.type || '').toLowerCase();
  const params = config.params || {};

  let svg = '';
  let title = config.caption || '';

  // Geometri 3D
  if (type === 'balok') {
    svg = renderBalokSvg(params);
    title = title || 'Diagram Bangun Ruang Balok';
  } else if (type === 'kubus') {
    svg = renderKubusSvg(params);
    title = title || 'Diagram Bangun Ruang Kubus';
  } else if (type === 'tabung') {
    svg = renderTabungSvg(params);
    title = title || 'Diagram Bangun Ruang Tabung';
  } else if (type === 'kerucut') {
    svg = renderKerucutSvg(params);
    title = title || 'Diagram Bangun Ruang Kerucut';
  } else if (type === 'bola') {
    svg = renderBolaSvg(params);
    title = title || 'Diagram Bangun Ruang Bola';
  } else if (type === 'prisma' || type === 'prisma_segitiga') {
    svg = renderPrismaSvg(params);
    title = title || 'Diagram Bangun Ruang Prisma Segitiga';
  } else if (type === 'limas' || type === 'limas_segiempat') {
    svg = renderLimasSvg(params);
    title = title || 'Diagram Bangun Ruang Limas';
  } else if (type === 'segitiga_siku' || type === 'segitiga') {
    svg = renderSegitigaSikuSvg(params);
    title = title || 'Diagram Segitiga Siku-Siku';
  } else if (type === 'sudut') {
    svg = renderSudutSvg(params);
    title = title || 'Pengukuran Sudut';
  }
  // Bangun Datar 2D
  else if (type === 'lingkaran') {
    svg = renderLingkaranSvg(params);
    title = title || 'Diagram Lingkaran (Bangun Datar)';
  } else if (type === 'trapesium') {
    svg = renderTrapesiumSvg(params);
    title = title || 'Diagram Trapesium';
  } else if (type === 'jajar_genjang' || type === 'jajargenjang') {
    svg = renderJajarGenjangSvg(params);
    title = title || 'Diagram Jajar Genjang';
  } else if (type === 'belah_ketupat' || type === 'belahketupat') {
    svg = renderBelahKetupatSvg(params);
    title = title || 'Diagram Belah Ketupat';
  } else if (type === 'layang_layang' || type === 'layanglayang') {
    svg = renderLayangLayangSvg(params);
    title = title || 'Diagram Layang-Layang';
  } else if (type === 'persegi_panjang' || type === 'persegipanjang') {
    svg = renderPersegiPanjangSvg(params);
    title = title || 'Diagram Persegi Panjang';
  } else if (type === 'segitiga_sama_sisi' || type === 'segitigasamasisi') {
    svg = renderSegitigaSamaSisiSvg(params);
    title = title || 'Diagram Segitiga Sama Sisi';
  } else if (type === 'segitiga_sama_kaki' || type === 'segitigasamakaki') {
    svg = renderSegitigaSamaKakiSvg(params);
    title = title || 'Diagram Segitiga Sama Kaki';
  } else if (type === 'jaring_kubus' || type === 'jaring_jaring_kubus' || type === 'jaringjaringkubus') {
    svg = renderJaringKubusSvg(params);
    title = title || 'Jaring-jaring Kubus';
  } else if (type === 'jaring_balok' || type === 'jaring_jaring_balok' || type === 'jaringjaringbalok') {
    svg = renderJaringBalokSvg(params);
    title = title || 'Jaring-jaring Balok';
  } else if (type === 'koordinat' || type === 'koordinat_kartesius' || type === 'kartesius') {
    svg = renderKoordinatKartesiusSvg(params);
    title = title || 'Bidang Koordinat Kartesius';
  } else if (type === 'diagram_venn' || type === 'venn') {
    svg = renderDiagramVennSvg(params);
    title = title || 'Diagram Venn';
  } else if (type === 'pictogram' || type === 'piktogram' || type === 'diagram_gambar') {
    svg = renderPictogramSvg(params);
    title = title || 'Diagram Gambar (Pictogram)';
  } else if (type === 'simetri_lipat' || type === 'simetri') {
    svg = renderSimetriLipatSvg(params);
    title = title || 'Simetri Lipat Bangun Datar';
  } else if (type === 'bangun_gabungan' || type === 'gabungan') {
    svg = renderBangunGabunganSvg(params);
    title = title || 'Bangun Datar Gabungan';
  }
  // Pecahan
  else if (type === 'pecahan_lingkaran' || type === 'pecahan_pie' || type === 'pecahan_campuran') {
    svg = renderPecahanLingkaranSvg(params);
    title = title || (params.utuh ? 'Visualisasi Pecahan Campuran' : 'Visualisasi Pecahan Lingkaran');
  } else if (type === 'pecahan_persegi' || type === 'pecahan_grid') {
    svg = renderPecahanPersegiSvg(params);
    title = title || 'Visualisasi Pecahan Persegi';
  }
  // Data Chart
  else if (type === 'diagram_batang' || type === 'bar_chart') {
    svg = renderDiagramBatangSvg(params);
    title = title || 'Diagram Batang';
  } else if (type === 'diagram_garis' || type === 'line_chart') {
    svg = renderDiagramGarisSvg(params);
    title = title || 'Diagram Garis';
  } else if (type === 'diagram_lingkaran' || type === 'pie_chart') {
    svg = renderDiagramLingkaranSvg(params);
    title = title || 'Diagram Lingkaran (Pie Chart)';
  }
  // IPAS & Sains
  else if (type === 'organ_pernapasan' || type === 'pernapasan') {
    svg = renderOrganPernapasanSvg(params);
    title = title || 'Diagram Sistem Pernapasan Manusia';
  } else if (type === 'alveolus') {
    svg = renderAlveolusSvg(params);
    title = title || 'Penampang Alveolus & Pertukaran Gas';
  } else if (type === 'organ_pencernaan' || type === 'pencernaan') {
    svg = renderOrganPencernaanSvg(params);
    title = title || 'Diagram Sistem Pencernaan Manusia';
  } else if (type === 'vili_usus' || type === 'vili' || type === 'jonjot_usus') {
    svg = renderViliUsusSvg(params);
    title = title || 'Struktur Vili (Jonjot) Usus Halus';
  } else if (type === 'struktur_gigi' || type === 'gigi' || type === 'jenis_gigi') {
    svg = renderStrukturGigiSvg(params);
    title = title || 'Jenis-Jenis Gigi Manusia & Fungsinya';
  } else if (type === 'lambung_detail' || type === 'lambung') {
    svg = renderLambungDetailSvg(params);
    title = title || 'Penampang Detail Organ Lambung';
  } else if (type === 'rantai_makanan') {
    svg = renderRantaiMakananSvg(params);
    title = title || 'Rantai Makanan';
  } else if (type === 'siklus_air') {
    svg = renderSiklusAirSvg(params);
    title = title || 'Bagan Siklus Air';
  } else if (type === 'metamorfosis' || type === 'metamorfosis_kupu') {
    svg = renderMetamorfosisSvg(params);
    title = title || 'Daur Hidup Metamorfosis';
  } else if (type === 'bagian_bunga' || type === 'bunga') {
    svg = renderBagianBungaSvg(params);
    title = title || 'Penampang Bagian Bunga';
  } else if (type === 'peta_indonesia' || type === 'peta' || type === 'peta_nusantara') {
    svg = renderPetaIndonesiaSvg(params);
    title = title || 'Peta Kepulauan Indonesia';
  } else if (type === 'rangkaian_listrik' || type === 'listrik' || type === 'rangkaian') {
    svg = renderRangkaianListrikSvg(params);
    title = title || 'Diagram Rangkaian Listrik';
  } else if (type === 'perubahan_wujud' || type === 'wujud_zat' || type === 'perubahan_wujud_zat') {
    svg = renderPerubahanWujudSvg(params);
    title = title || 'Diagram Perubahan Wujud Zat';
  } else if (type === 'tata_surya' || type === 'planet' || type === 'sistem_tata_surya') {
    svg = renderTataSuryaSvg(params);
    title = title || 'Diagram Sistem Tata Surya';
  } else if (type === 'perisai_pancasila' || type === 'pancasila' || type === 'garuda_pancasila' || type === 'lambang_pancasila') {
    svg = renderPerisaiPancasilaSvg(params);
    title = title || 'Perisai Garuda Pancasila';
  } else if (type === 'magnet' || type === 'gaya_magnet' || type === 'kutub_magnet') {
    svg = renderMagnetSvg(params);
    title = title || 'Interaksi Batang Magnet';
  } else if (type === 'sifat_cahaya' || type === 'cahaya' || type === 'pembiasan' || type === 'pemantulan') {
    svg = renderSifatCahayaSvg(params);
    title = title || 'Diagram Sifat Cahaya';
  }
  // Pengukuran & Waktu
  else if (type === 'jam_analog' || type === 'jam' || type === 'clock') {
    svg = renderJamAnalogSvg(params);
    title = title || 'Jam Dinding Analog';
  } else if (type === 'garis_bilangan') {
    svg = renderGarisBilanganSvg(params);
    title = title || 'Garis Bilangan';
  } else if (type === 'mistar' || type === 'penggaris' || type === 'pengukuran_panjang') {
    svg = renderMistarSvg(params);
    title = title || 'Pengukuran Panjang Mistar';
  } else if (type === 'busur_derajat' || type === 'busur' || type === 'pengukuran_busur') {
    svg = renderBusurDerajatSvg(params);
    title = title || 'Pengukuran Sudut Busur Derajat';
  }

  if (!svg) return null;

  // Parse viewBox untuk mendapatkan width/height dinamis (fix hardcoded dimensions)
  let width = 360;
  let height = 250;
  const vbMatch = svg.match(/viewBox=["'](\d+)\s+(\d+)\s+(\d+)\s+(\d+)["']/);
  if (vbMatch) {
    width = parseInt(vbMatch[3]);
    height = parseInt(vbMatch[4]);
  }

  return {
    svg,
    dataUri: svgToDataUri(svg),
    width,
    height,
    title,
    credit: 'Examplate Visual Engine',
    type: 'svg'
  };
}

/**
 * Deteksi otomatis stimulus visual dari teks soal jika AI lupa menyertakan format visual_stimulus
 */
export function detectStimulusFromSoalText(soalText: string, mapel: string): VisualStimulusConfig | null {
  const text = (soalText || '').toLowerCase();
  // Pisahkan teks pertanyaan inti dari opsi pilihan ganda agar angka opsi (A. 26 cm, B. 28 cm) tidak disalahartikan sebagai ukuran bangun
  const stemText = text.split(/\b[a-d]\s*[\.\)]/i)[0] || text;

  // 0a. Simetri Lipat (Prioritas tinggi karena soal menanyakan simetri pada bangun lain)
  if (text.includes('simetri lipat') || text.includes('garis simetri') || text.includes('sumbu simetri')) {
    let b = 'persegi';
    if (text.includes('panjang')) b = 'persegi_panjang';
    else if (text.includes('sama sisi') || text.includes('sama_sisi')) b = 'segitiga_sama_sisi';
    else if (text.includes('segitiga')) b = 'segitiga';
    else if (text.includes('lingkaran')) b = 'lingkaran';
    else if (text.includes('belah ketupat')) b = 'belah_ketupat';
    return { type: 'simetri_lipat', params: { bangun: b } };
  }

  // 0b. Bangun Gabungan (Bentuk L / T)
  if (text.includes('bangun gabungan') || text.includes('luas gabungan') || (text.includes('gabungan') && (text.includes('bentuk l') || text.includes('berbentuk l') || text.includes('bentuk t') || text.includes('berbentuk t')))) {
    const bentuk = text.includes('bentuk t') || text.includes('berbentuk t') ? 'T' : 'L';
    return { type: 'bangun_gabungan', params: { bentuk } };
  }

  // 0c. Jaring-jaring Kubus
  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('kubus')) {
    const sMatch = stemText.match(/(?:rusuk|sisi)\D*(\d+)/i) || stemText.match(/s\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    const s = sMatch ? parseInt(sMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 5);
    let pola: 'salib' | 'tangga' | 't' = 'salib';
    if (text.includes('tangga') || text.includes('1-4-1')) pola = 'tangga';
    else if (text.includes('huruf t') || text.includes('pola t')) pola = 't';
    return { type: 'jaring_kubus', params: { s, unit: 'cm', pola } };
  }

  // 0d. Jaring-jaring Balok
  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('balok')) {
    const pMatch = stemText.match(/panjang\D*(\d+)/i) || stemText.match(/p\s*=\s*(\d+)/i);
    const lMatch = stemText.match(/lebar\D*(\d+)/i) || stemText.match(/l\s*=\s*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i) || stemText.match(/t\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let p = pMatch ? parseInt(pMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 6);
    let l = lMatch ? parseInt(lMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 4);
    let t = tMatch ? parseInt(tMatch[1]) : (nums && nums.length >= 3 ? parseInt(nums[2]) : 3);
    return { type: 'jaring_balok', params: { p, l, t, unit: 'cm' } };
  }

  // 0e. Persegi Panjang
  if (text.includes('persegi panjang') || text.includes('persegipanjang')) {
    const pMatch = stemText.match(/panjang\D*(\d+)/i) || stemText.match(/p\s*=\s*(\d+)/i);
    const lMatch = stemText.match(/lebar\D*(\d+)/i) || stemText.match(/l\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let p = pMatch ? parseInt(pMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 12);
    let l = lMatch ? parseInt(lMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 8);
    return { type: 'persegi_panjang', params: { p, l, unit: 'cm' } };
  }

  // 0f. Segitiga Sama Sisi
  if (text.includes('segitiga sama sisi') || text.includes('segitiga samasisi')) {
    const sMatch = stemText.match(/sisi\D*(\d+)/i) || stemText.match(/s\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    const s = sMatch ? parseInt(sMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 10);
    return { type: 'segitiga_sama_sisi', params: { s, unit: 'cm' } };
  }

  // 0g. Segitiga Sama Kaki
  if (text.includes('segitiga sama kaki') || text.includes('segitiga samakaki')) {
    const kMatch = stemText.match(/kaki\D*(\d+)/i) || stemText.match(/sisi\s*(?:miring|sama)\D*(\d+)/i);
    const aMatch = stemText.match(/alas\D*(\d+)/i) || stemText.match(/a\s*=\s*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i) || stemText.match(/t\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);

    let alas = aMatch ? parseInt(aMatch[1]) : undefined;
    let kaki = kMatch ? parseInt(kMatch[1]) : undefined;
    let tinggi = tMatch ? parseInt(tMatch[1]) : undefined;

    if (!alas && nums && nums.length >= 2) {
      kaki = kaki ?? parseInt(nums[0]);
      alas = parseInt(nums[1]);
    } else if (!alas && nums && nums.length === 1) {
      alas = parseInt(nums[0]);
    }

    return {
      type: 'segitiga_sama_kaki',
      params: {
        kaki: kaki || (tinggi ? undefined : 10),
        alas: alas || 12,
        tinggi,
        unit: 'cm'
      }
    };
  }

  // 0h. Segitiga Siku-siku
  if (text.includes('segitiga siku') || text.includes('segitiga sikusiku')) {
    const aMatch = stemText.match(/alas\D*(\d+)/i) || stemText.match(/a\s*=\s*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i) || stemText.match(/t\s*=\s*(\d+)/i);
    const mMatch = stemText.match(/miring\D*(\d+)/i) || stemText.match(/c\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let alas = aMatch ? parseInt(aMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 6);
    let tinggi = tMatch ? parseInt(tMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 8);
    let miring = mMatch ? parseInt(mMatch[1]) : (nums && nums.length >= 3 ? parseInt(nums[2]) : 10);
    return { type: 'segitiga_siku', params: { alas, tinggi, miring, unit: 'cm' } };
  }

  // 0i. Koordinat Kartesius
  if (text.includes('kartesius') || text.includes('koordinat') || (text.includes('titik') && /\([+-]?\d+\s*,\s*[+-]?\d+\)/.test(text))) {
    const pointMatches = [...stemText.matchAll(/([A-Za-z])\s*\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*\)/g)];
    const titik = pointMatches.map(pm => ({
      label: pm[1].toUpperCase(),
      x: parseInt(pm[2]),
      y: parseInt(pm[3])
    }));
    return {
      type: 'koordinat',
      params: titik.length ? { titik } : { titik: [{ x: 3, y: 4, label: 'P' }, { x: -2, y: 3, label: 'Q' }] }
    };
  }

  // 0j. Diagram Venn
  if (text.includes('diagram venn') || text.includes('diagram ven') || (text.includes('himpunan') && (text.includes('irisan') || text.includes('gabungan')))) {
    return { type: 'diagram_venn', params: {} };
  }

  // 0k. Pictogram / Diagram Gambar
  if (text.includes('pictogram') || text.includes('piktogram') || text.includes('diagram gambar')) {
    return { type: 'pictogram', params: {} };
  }

  // 1. Balok
  if (text.includes('balok') && (text.includes('panjang') || text.includes('volume') || text.includes('rusuk') || text.includes('cm'))) {
    const pMatch = stemText.match(/panjang\D*(\d+)/i) || stemText.match(/p\s*=\s*(\d+)/i);
    const lMatch = stemText.match(/lebar\D*(\d+)/i) || stemText.match(/l\s*=\s*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i) || stemText.match(/t\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);

    let p = pMatch ? parseInt(pMatch[1]) : 12;
    let l = lMatch ? parseInt(lMatch[1]) : 8;
    let t = tMatch ? parseInt(tMatch[1]) : 6;

    if (!pMatch && nums && nums.length >= 3) {
      p = parseInt(nums[0]);
      l = parseInt(nums[1]);
      t = parseInt(nums[2]);
    }

    return { type: 'balok', params: { p, l, t, unit: 'cm' } };
  }

  // 2. Kubus
  if (text.includes('kubus') && (text.includes('rusuk') || text.includes('sisi') || text.includes('volume') || text.includes('luas permukaan'))) {
    const sMatch = stemText.match(/(?:rusuk|sisi)\D*(\d+)/i) || stemText.match(/s\s*=\s*(\d+)/i);
    const s = sMatch ? parseInt(sMatch[1]) : 10;
    return { type: 'kubus', params: { s, unit: 'cm' } };
  }

  // 3. Tabung
  if (text.includes('tabung') && (text.includes('jari-jari') || text.includes('diameter') || text.includes('tinggi'))) {
    const rMatch = stemText.match(/jari-jari\D*(\d+)/i) || stemText.match(/r\s*=\s*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i) || stemText.match(/t\s*=\s*(\d+)/i);
    return {
      type: 'tabung',
      params: {
        r: rMatch ? parseInt(rMatch[1]) : 7,
        t: tMatch ? parseInt(tMatch[1]) : 14,
        unit: 'cm'
      }
    };
  }

  // 4. Kerucut
  if (text.includes('kerucut') && (text.includes('jari-jari') || text.includes('tinggi') || text.includes('pelukis'))) {
    const rMatch = stemText.match(/jari-jari\D*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i);
    return {
      type: 'kerucut',
      params: {
        r: rMatch ? parseInt(rMatch[1]) : 7,
        t: tMatch ? parseInt(tMatch[1]) : 12,
        unit: 'cm'
      }
    };
  }

  // 5. Bola
  if (text.includes('bola') && (text.includes('jari-jari') || text.includes('diameter') || text.includes('volume') || text.includes('luas permukaan'))) {
    const rMatch = text.match(/jari-jari\D*(\d+)/i) || text.match(/r\s*=\s*(\d+)/i);
    const dMatch = text.match(/diameter\D*(\d+)/i) || text.match(/d\s*=\s*(\d+)/i);
    return {
      type: 'bola',
      params: {
        r: rMatch ? parseInt(rMatch[1]) : undefined,
        d: dMatch ? parseInt(dMatch[1]) : undefined,
        unit: 'cm'
      }
    };
  }

  // 6. Prisma Segitiga
  if (text.includes('prisma') && (text.includes('segitiga') || text.includes('alas') || text.includes('volume') || text.includes('tinggi'))) {
    const aMatch = text.match(/alas\D*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i);
    const pMatch = text.match(/panjang\D*(\d+)/i);
    return {
      type: 'prisma',
      params: {
        alas: aMatch ? parseInt(aMatch[1]) : 8,
        tinggiSegitiga: tMatch ? parseInt(tMatch[1]) : 6,
        panjang: pMatch ? parseInt(pMatch[1]) : 12,
        unit: 'cm'
      }
    };
  }

  // 7. Limas
  if (text.includes('limas') && (text.includes('alas') || text.includes('sisi') || text.includes('volume') || text.includes('tinggi'))) {
    const sMatch = text.match(/(?:alas|sisi)\D*(\d+)/i) || text.match(/s\s*=\s*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i);
    return {
      type: 'limas',
      params: {
        s: sMatch ? parseInt(sMatch[1]) : 10,
        t: tMatch ? parseInt(tMatch[1]) : 12,
        unit: 'cm'
      }
    };
  }

  // 8. Lingkaran (bangun datar)
  if (text.includes('lingkaran') && !text.includes('diagram lingkaran') && (text.includes('jari-jari') || text.includes('diameter') || text.includes('keliling') || text.includes('luas'))) {
    const rMatch = text.match(/jari-jari\D*(\d+)/i) || text.match(/r\s*=\s*(\d+)/i);
    const dMatch = text.match(/diameter\D*(\d+)/i) || text.match(/d\s*=\s*(\d+)/i);
    return {
      type: 'lingkaran',
      params: {
        r: rMatch ? parseInt(rMatch[1]) : undefined,
        d: dMatch ? parseInt(dMatch[1]) : undefined,
        unit: 'cm'
      }
    };
  }

  // 9. Trapesium
  if (text.includes('trapesium') && (text.includes('alas') || text.includes('tinggi') || text.includes('luas') || text.includes('cm'))) {
    const atasMatch = text.match(/(?:alas\s*atas|sisi\s*atas)\D*(\d+)/i);
    const bawahMatch = text.match(/(?:alas\s*bawah|sisi\s*bawah)\D*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i);
    const nums = text.match(/(\d+)\s*cm/g);
    return {
      type: 'trapesium',
      params: {
        atasAlas: atasMatch ? parseInt(atasMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[0]) : 6),
        bawahAlas: bawahMatch ? parseInt(bawahMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 12),
        tinggi: tMatch ? parseInt(tMatch[1]) : 8,
        unit: 'cm'
      }
    };
  }

  // 10. Jajar Genjang
  if ((text.includes('jajar genjang') || text.includes('jajargenjang')) && (text.includes('alas') || text.includes('tinggi') || text.includes('luas'))) {
    const aMatch = text.match(/alas\D*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i);
    return {
      type: 'jajar_genjang',
      params: {
        alas: aMatch ? parseInt(aMatch[1]) : 12,
        tinggi: tMatch ? parseInt(tMatch[1]) : 8,
        unit: 'cm'
      }
    };
  }

  // 11. Belah Ketupat
  if (text.includes('belah ketupat') && (text.includes('diagonal') || text.includes('luas') || text.includes('cm'))) {
    const d1Match = text.match(/diagonal\D*1?\D*(\d+)/i) || text.match(/d1\s*=\s*(\d+)/i);
    const d2Match = text.match(/diagonal\D*2\D*(\d+)/i) || text.match(/d2\s*=\s*(\d+)/i);
    const nums = text.match(/(\d+)\s*cm/g);
    return {
      type: 'belah_ketupat',
      params: {
        d1: d1Match ? parseInt(d1Match[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 12),
        d2: d2Match ? parseInt(d2Match[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 16),
        unit: 'cm'
      }
    };
  }

  // 12. Layang-layang
  if ((text.includes('layang-layang') || text.includes('layang layang')) && (text.includes('diagonal') || text.includes('luas') || text.includes('cm'))) {
    const d1Match = text.match(/diagonal\D*1?\D*(\d+)/i) || text.match(/d1\s*=\s*(\d+)/i);
    const d2Match = text.match(/diagonal\D*2\D*(\d+)/i) || text.match(/d2\s*=\s*(\d+)/i);
    return {
      type: 'layang_layang',
      params: {
        d1: d1Match ? parseInt(d1Match[1]) : 10,
        d2: d2Match ? parseInt(d2Match[1]) : 18,
        unit: 'cm'
      }
    };
  }

  // 13. Pecahan (Biasa & Campuran)
  if (text.includes('pecahan') || text.includes('diarsir') || text.includes('arsiran')) {
    const mixedMatch = text.match(/(\d+)\s+(\d+)\s*\/\s*(\d+)/);
    if (mixedMatch) {
      const u = parseInt(mixedMatch[1]);
      const k = parseInt(mixedMatch[2]);
      const n = parseInt(mixedMatch[3]);
      if (u >= 1 && u <= 3 && n > 1 && n <= 12) {
        return { type: 'pecahan_lingkaran', params: { pembagi: n, diarsir: k, utuh: u } };
      }
    }
    const fracMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (fracMatch) {
      const k = parseInt(fracMatch[1]);
      const n = parseInt(fracMatch[2]);
      if (n > 1 && n <= 12) {
        return { type: 'pecahan_lingkaran', params: { pembagi: n, diarsir: k } };
      }
    }
  }

  // 14. Sudut & Busur Derajat
  if (text.includes('busur') || (text.includes('sudut') && (text.includes('derajat') || text.includes('°') || text.includes('lancip') || text.includes('tumpul')))) {
    const degMatch = text.match(/(\d+)\s*(?:derajat|°)/i);
    const deg = degMatch ? parseInt(degMatch[1]) : 60;
    if (text.includes('busur derajat') || text.includes('busur')) {
      return { type: 'busur_derajat', params: { derajat: deg, label: 'X' } };
    }
    return { type: 'sudut', params: { derajat: deg } };
  }

  // 15. IPAS: Alveolus & Pertukaran Gas (Mikroskopis)
  if (text.includes('alveolus') || (text.includes('pertukaran') && (text.includes('oksigen') || text.includes('o2') || text.includes('karbon dioksida') || text.includes('co2')))) {
    let ptr = 'alveolus';
    if (text.includes('kapiler') || text.includes('darah')) ptr = 'kapiler';
    else if (text.includes('bronkiolus')) ptr = 'bronkiolus';
    return { type: 'alveolus', params: { pointer: ptr, label: 'X' } };
  }

  // 16. IPAS: Pernapasan Umum (Makro Torso)
  if (text.includes('pernapasan') || text.includes('paru-paru') || text.includes('trakea') || text.includes('bronkus')) {
    let ptr = 'trakea';
    if (text.includes('hidung')) ptr = 'hidung';
    else if (text.includes('bronkus')) ptr = 'bronkus';
    else if (text.includes('paru')) ptr = 'paru';
    else if (text.includes('diafragma')) ptr = 'diafragma';
    return { type: 'organ_pernapasan', params: { pointer: ptr, label: 'X' } };
  }

  // 17. IPAS: Vili Usus Halus (Jonjot Usus - Mikroskopis)
  if (text.includes('vili') || text.includes('jonjot') || (text.includes('lipatan') && text.includes('penyerapan') && text.includes('usus'))) {
    let ptr = 'vili';
    if (text.includes('kapiler') || text.includes('darah')) ptr = 'kapiler';
    else if (text.includes('lakteal') || text.includes('limfa') || text.includes('lemak') || text.includes('kil')) ptr = 'lakteal';
    else if (text.includes('epitel') || text.includes('dinding')) ptr = 'epitel';
    return { type: 'vili_usus', params: { pointer: ptr, label: 'X' } };
  }

  // 18. IPAS: Ragam Jenis Gigi & Fungsinya
  if (text.includes('gigi') && (text.includes('seri') || text.includes('taring') || text.includes('geraham') || text.includes('memotong') || text.includes('merobek') || text.includes('mengunyah') || text.includes('rahang'))) {
    let ptr = 'seri';
    if (text.includes('taring') || text.includes('robek') || text.includes('koyak')) ptr = 'taring';
    else if (text.includes('geraham') || text.includes('kunyah') || text.includes('lumat')) ptr = 'geraham';
    return { type: 'struktur_gigi', params: { pointer: ptr, label: 'X' } };
  }

  // 19. IPAS: Lambung Detail (Enzim, Rugae, Sfingter)
  if ((text.includes('lambung') && (text.includes('rugae') || text.includes('kardia') || text.includes('pilorus') || text.includes('pepsin') || text.includes('asam klorida') || text.includes('hcl') || text.includes('sfingter'))) || (text.includes('enzim') && text.includes('lambung'))) {
    let ptr = 'rugae';
    if (text.includes('kardia') || text.includes('esofagus') || text.includes('katup')) ptr = 'kardia';
    else if (text.includes('pilorus') || text.includes('duodenum')) ptr = 'pilorus';
    return { type: 'lambung_detail', params: { pointer: ptr, label: 'X' } };
  }

  // 20. IPAS: Pencernaan Umum (Makro Torso)
  if (text.includes('pencernaan') || /\blambung\b/.test(text) || text.includes('usus') || text.includes('kerongkongan') || text.includes('esofagus')) {
    let ptr = 'lambung';
    if (/\bmulut\b/.test(text) && !text.includes('bermulut')) ptr = 'mulut';
    else if (text.includes('kerongkongan') || text.includes('esofagus')) ptr = 'kerongkongan';
    else if (text.includes('usus halus')) ptr = 'usus halus';
    else if (text.includes('usus besar')) ptr = 'usus besar';
    else if (/\banus\b/.test(text) || text.includes('rektum')) ptr = 'anus';
    else if (/\bhati\b/.test(text) && !/(?:per|mem|meng)hati/i.test(text)) ptr = 'hati';
    return { type: 'organ_pencernaan', params: { pointer: ptr, label: 'X' } };
  }

  // 17. IPAS: Rantai Makanan
  if (text.includes('rantai makanan') || text.includes('jaring-jaring makanan') || (text.includes('produsen') && text.includes('konsumen'))) {
    let ptr = 'konsumen1';
    if (text.includes('produsen')) ptr = 'produsen';
    else if (text.includes('konsumen') && text.includes('puncak')) ptr = 'konsumen3';
    else if (text.includes('pengurai') || text.includes('dekomposer')) ptr = 'pengurai';
    return { type: 'rantai_makanan', params: { pointer: ptr, label: 'X' } };
  }

  // 18. IPAS: Siklus Air
  if (text.includes('siklus air') || text.includes('daur air') || text.includes('evaporasi') || text.includes('kondensasi') || text.includes('presipitasi')) {
    let ptr = 'evaporasi';
    if (text.includes('kondensasi')) ptr = 'kondensasi';
    else if (text.includes('presipitasi') || text.includes('hujan')) ptr = 'presipitasi';
    return { type: 'siklus_air', params: { pointer: ptr, label: 'X' } };
  }

  // 19. IPAS: Metamorfosis
  if (text.includes('metamorfosis') || text.includes('daur hidup kupu')) {
    let ptr = 'kepompong';
    if (text.includes('larva') || text.includes('ulat')) ptr = 'ulat';
    else if (text.includes('telur')) ptr = 'telur';
    return { type: 'metamorfosis', params: { pointer: ptr, label: 'X' } };
  }

  // 20. IPAS: Bunga
  if (text.includes('bunga') && (text.includes('putik') || text.includes('benang sari') || text.includes('kelopak') || text.includes('mahkota'))) {
    let ptr = 'putik';
    if (text.includes('benang sari') || text.includes('sari')) ptr = 'benang sari';
    else if (text.includes('mahkota')) ptr = 'mahkota';
    return { type: 'bagian_bunga', params: { pointer: ptr, label: 'X' } };
  }

  // 21. Jam Dinding / Waktu
  if (text.includes('jam') && (text.includes('pukul') || text.includes('menit') || text.includes('o\'clock') || text.includes('half past'))) {
    const timeMatch = text.match(/pukul\s*(\d{1,2})[.:](\d{2})/i) || text.match(/(\d{1,2})[.:](\d{2})/);
    if (timeMatch) {
      const jam = parseInt(timeMatch[1]);
      const menit = parseInt(timeMatch[2]);
      if (jam >= 1 && jam <= 12 && menit >= 0 && menit <= 59) {
        return { type: 'jam_analog', params: { jam, menit } };
      }
    }
  }

  // 22. Diagram Lingkaran (Pie Chart) — untuk statistik / data
  if (text.includes('diagram lingkaran') || text.includes('pie chart') || (text.includes('persentase') && text.includes('diagram'))) {
    return { type: 'diagram_lingkaran', params: {} };
  }

  // 23. Peta Indonesia (Tebak Pulau, Fauna/Flora Endemik, Rumah Adat, Bentang Alam, Rempah, Zona Waktu)
  if ((text.includes('peta') || text.includes('pulau')) && (text.includes('indonesia') || text.includes('pulau') || text.includes('tinggal') || text.includes('geografis') || text.includes('nusantara') || text.includes('provinsi') || text.includes('endemik') || text.includes('rumah adat') || text.includes('zona waktu'))) {
    let pointer = '';

    // 1. Petunjuk nama pulau eksplisit di pertanyaan
    if (stemText.includes('sumatra') || stemText.includes('sumatera')) pointer = 'sumatra';
    else if (stemText.includes('kalimantan') || stemText.includes('borneo')) pointer = 'kalimantan';
    else if (stemText.includes('sulawesi') || stemText.includes('celebes')) pointer = 'sulawesi';
    else if (stemText.includes('papua') || stemText.includes('irian')) pointer = 'papua';
    else if (stemText.includes('maluku') || stemText.includes('ambon') || stemText.includes('seram') || stemText.includes('halmahera')) pointer = 'maluku';
    else if (stemText.includes('bali') || stemText.includes('nusa tenggara') || stemText.includes('ntb') || stemText.includes('ntt') || stemText.includes('lombok') || stemText.includes('flores')) pointer = 'bali_nusra';
    else if (stemText.includes('jawa') || stemText.includes('tinggal')) pointer = 'jawa';

    // 2. Petunjuk fauna endemik, flora khas, budaya, rumah adat, dan bentang alam
    if (!pointer) {
      if (text.includes('komodo') || text.includes('cendana') || text.includes('sasak') || text.includes('rinjani') || text.includes('kelimutu') || text.includes('sumbawa') || text.includes('timor') || text.includes('tari kecak') || text.includes('tari pendet')) {
        pointer = 'bali_nusra';
      } else if (text.includes('cendrawasih') || text.includes('kasuari') || text.includes('honai') || text.includes('asmat') || text.includes('puncak jaya') || text.includes('jayawijaya') || text.includes('lorentz') || text.includes('raja ampat') || text.includes('buah merah')) {
        pointer = 'papua';
      } else if (text.includes('anoa') || text.includes('babirusa') || text.includes('maleo') || text.includes('tongkonan') || text.includes('toraja') || text.includes('poso') || text.includes('bunaken') || text.includes('wakatobi') || text.includes('hasanuddin') || text.includes('bugis')) {
        pointer = 'sulawesi';
      } else if (text.includes('orangutan') || text.includes('bekantan') || text.includes('kapuas') || text.includes('mahakam') || text.includes('dayak') || text.includes('tanjung puting') || text.includes('antasari') || text.includes('anggrek hitam')) {
        pointer = 'kalimantan';
      } else if (text.includes('toba') || text.includes('gadang') || text.includes('saman') || text.includes('rafflesia') || text.includes('arnoldii') || text.includes('bunga bangkai') || text.includes('musi') || text.includes('way kambas') || text.includes('harimau sumatra') || text.includes('gajah sumatra') || text.includes('minang') || text.includes('cut nyak')) {
        pointer = 'sumatra';
      } else if (text.includes('pattimura') || text.includes('cengkih') || text.includes('pala') || text.includes('rempah') || text.includes('banda') || text.includes('tifa') || text.includes('ternate') || text.includes('tidore')) {
        pointer = 'maluku';
      } else if (text.includes('badak') || text.includes('ujung kulon') || text.includes('bromo') || text.includes('merapi') || text.includes('joglo') || text.includes('jaipong') || text.includes('borobudur') || text.includes('prambanan')) {
        pointer = 'jawa';
      }
    }

    // 3. Deteksi opsi atau jawaban kunci (misal: "jawaban: sumatra", "kunci: A" di mana A = Kalimantan)
    if (!pointer) {
      const ansMatch = text.match(/(?:jawaban|kunci)\s*:?\s*([a-d]|sumatra|sumatera|kalimantan|sulawesi|papua|maluku|bali|jawa)/i);
      if (ansMatch) {
        const val = ansMatch[1].toLowerCase();
        if (val.includes('sumat')) pointer = 'sumatra';
        else if (val.includes('kalim')) pointer = 'kalimantan';
        else if (val.includes('sulaw')) pointer = 'sulawesi';
        else if (val.includes('papua')) pointer = 'papua';
        else if (val.includes('maluk')) pointer = 'maluku';
        else if (val.includes('bali') || val.includes('nusa')) pointer = 'bali_nusra';
        else if (val.includes('jawa')) pointer = 'jawa';
      }
    }

    // 4. Jika masih belum ada petunjuk spesifik, gunakan rotasi deterministik berbasis hash teks agar bervariasi
    if (!pointer) {
      const islandRotation = ['sumatra', 'kalimantan', 'sulawesi', 'papua', 'maluku', 'bali_nusra', 'jawa'];
      let hash = 0;
      for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
      pointer = islandRotation[hash % islandRotation.length];
    }

    return { type: 'peta_indonesia', params: { pointer, label: 'X' } };
  }

  // 24. Rangkaian Listrik (Seri / Paralel / Campuran / Saklar & Lampu)
  if (text.includes('rangkaian listrik') || (text.includes('saklar') && text.includes('lampu')) || (text.includes('lampu') && (text.includes('menyala') || text.includes('padam')) && (text.includes('s1') || text.includes('s2') || text.includes('baterai')))) {
    let model = 'campuran';
    if (text.includes('seri')) model = 'seri';
    else if (text.includes('paralel')) model = 'paralel';

    const s1 = !(text.includes('s1 dibuka') || text.includes('s1 terbuka'));
    const s2 = text.includes('s2 ditutup') || text.includes('s2 tertutup');

    let pointer = 'L1';
    if (stemText.includes('l2') || stemText.includes('lampu 2')) pointer = 'L2';
    else if (stemText.includes('l3') || stemText.includes('lampu 3')) pointer = 'L3';
    else if (stemText.includes('s1') || stemText.includes('saklar 1')) pointer = 'S1';
    else if (stemText.includes('s2') || stemText.includes('saklar 2')) pointer = 'S2';

    return { type: 'rangkaian_listrik', params: { model, s1, s2, pointer, label: 'X' } };
  }

  // 25. Perubahan Wujud Zat (Segitiga Padat-Cair-Gas)
  if (text.includes('perubahan wujud') || (text.includes('wujud zat') && (text.includes('padat') || text.includes('cair') || text.includes('gas')))) {
    let pointer = '1';
    if (stemText.includes('mencair') || stemText.includes('melebur')) pointer = '1';
    else if (stemText.includes('membeku')) pointer = '2';
    else if (stemText.includes('menguap')) pointer = '3';
    else if (stemText.includes('mengembun')) pointer = '4';
    else if (stemText.includes('menyublim')) pointer = '5';
    else if (stemText.includes('kristal') || stemText.includes('deposisi')) pointer = '6';
    else if (stemText.includes('nomor 2') || stemText.includes('panah 2')) pointer = '2';
    else if (stemText.includes('nomor 3') || stemText.includes('panah 3')) pointer = '3';
    else if (stemText.includes('nomor 4') || stemText.includes('panah 4')) pointer = '4';
    else if (stemText.includes('nomor 5') || stemText.includes('panah 5')) pointer = '5';
    else if (stemText.includes('nomor 6') || stemText.includes('panah 6')) pointer = '6';

    return { type: 'perubahan_wujud', params: { pointer, label: 'X' } };
  }

  // 26. Pengukuran Panjang Mistar / Penggaris
  if (text.includes('mistar') || text.includes('penggaris') || ((text.includes('pensil') || text.includes('penghapus') || text.includes('paku')) && (text.includes('panjang') || text.includes('skala') || text.includes('cm')) && (text.includes('ukur') || text.includes('gambar')))) {
    let objectType = 'pensil';
    if (text.includes('paku')) objectType = 'paku';
    else if (text.includes('penghapus')) objectType = 'penghapus';

    let start = 3.0;
    let end = 8.5;
    const startMatch = text.match(/(?:dari|pada|angka|skala)\s*([0-9]+(?:[\.,][0-9]+)?)\s*cm/);
    if (startMatch) start = parseFloat(startMatch[1].replace(',', '.'));
    const endMatch = text.match(/(?:sampai|hingga|ujung)\s*([0-9]+(?:[\.,][0-9]+)?)\s*cm/);
    if (endMatch) end = parseFloat(endMatch[1].replace(',', '.'));

    return { type: 'mistar', params: { start, end, objectType, label: 'Panjang = ... cm' } };
  }

  // 27. Tata Surya (Orbit & Karakteristik Planet)
  if (text.includes('tata surya') || (text.includes('planet') && (text.includes('matahari') || text.includes('orbit') || text.includes('cincin') || text.includes('terbesar') || text.includes('urutan') || text.includes('ketiga')))) {
    let pointer = 'bumi';
    if (stemText.includes('merkurius') || stemText.includes('pertama') || stemText.includes('terdekat')) pointer = 'merkurius';
    else if (stemText.includes('venus') || stemText.includes('kejora') || stemText.includes('kedua')) pointer = 'venus';
    else if (stemText.includes('mars') || stemText.includes('merah') || stemText.includes('keempat')) pointer = 'mars';
    else if (stemText.includes('yupiter') || stemText.includes('jupiter') || stemText.includes('terbesar') || stemText.includes('kelima')) pointer = 'yupiter';
    else if (stemText.includes('saturnus') || stemText.includes('cincin') || stemText.includes('keenam')) pointer = 'saturnus';
    else if (stemText.includes('uranus') || stemText.includes('ketujuh')) pointer = 'uranus';
    else if (stemText.includes('neptunus') || stemText.includes('terjauh') || stemText.includes('kedelapan')) pointer = 'neptunus';
    else if (stemText.includes('bumi') || stemText.includes('ketiga') || stemText.includes('kehidupan')) pointer = 'bumi';

    return { type: 'tata_surya', params: { pointer, label: 'X' } };
  }

  // 28. Perisai Garuda Pancasila (Simbol 5 Sila)
  if (text.includes('pancasila') || text.includes('perisai') || text.includes('lambang negara') || text.includes('burung garuda') || (text.includes('sila') && (text.includes('pertama') || text.includes('kedua') || text.includes('ketiga') || text.includes('keempat') || text.includes('kelima') || text.includes('ke-') || text.includes('bintang') || text.includes('rantai') || text.includes('beringin') || text.includes('banteng') || text.includes('padi')))) {
    let sila = 1;
    if (stemText.includes('bintang') || stemText.includes('ketuhanan') || stemText.includes('pertama') || stemText.includes('ke-1') || stemText.includes('sila 1')) sila = 1;
    else if (stemText.includes('rantai') || stemText.includes('kemanusiaan') || stemText.includes('kedua') || stemText.includes('ke-2') || stemText.includes('sila 2')) sila = 2;
    else if (stemText.includes('beringin') || stemText.includes('persatuan') || stemText.includes('ketiga') || stemText.includes('ke-3') || stemText.includes('sila 3')) sila = 3;
    else if (stemText.includes('banteng') || stemText.includes('kerakyatan') || stemText.includes('keempat') || stemText.includes('ke-4') || stemText.includes('sila 4')) sila = 4;
    else if (stemText.includes('padi') || stemText.includes('kapas') || stemText.includes('keadilan') || stemText.includes('kelima') || stemText.includes('ke-5') || stemText.includes('sila 5')) sila = 5;

    return { type: 'perisai_pancasila', params: { sila, label: 'X' } };
  }

  // 29. Kemagnetan (Kutub & Gaya Tarik/Tolak Magnet)
  if (text.includes('magnet') || (text.includes('kutub') && (text.includes('utara') || text.includes('selatan') || text.includes('tarik') || text.includes('tolak')))) {
    let interaksi: 'tarik' | 'tolak' = 'tarik';
    if (text.includes('tolak') || text.includes('menolak')) interaksi = 'tolak';
    else if (text.includes('tarik') || text.includes('menarik')) interaksi = 'tarik';

    let pointer: 'kanan2' | 'kiri1' = 'kanan2';
    if (text.includes('kiri') || text.includes('pertama')) pointer = 'kiri1';

    return { type: 'magnet', params: { interaksi, pointer, label: 'X' } };
  }

  // 30. Sifat Cahaya (Pembiasan & Pemantulan)
  if (text.includes('cahaya') && (text.includes('pembiasan') || text.includes('bias') || text.includes('pemantulan') || text.includes('pantul') || text.includes('cermin') || text.includes('medium') || text.includes('sudut datang') || text.includes('sudut bias') || text.includes('sudut pantul'))) {
    let peristiwa: 'pembiasan' | 'pemantulan' = 'pembiasan';
    if (text.includes('pemantulan') || text.includes('pantul') || text.includes('cermin')) peristiwa = 'pemantulan';
    return { type: 'sifat_cahaya', params: { peristiwa, pointer: 'X', label: 'X' } };
  }

  return null;
}

export interface VisualCatalogItem {
  id: string;
  category: 'Geometri 3D' | 'Geometri 2D' | 'Pecahan' | 'Statistik' | 'Pengukuran' | 'Sains / IPAS';
  name: string;
  description: string;
  sampleParams: Record<string, any>;
}

/**
 * Katalog lengkap 50 template visual stimulus SVG untuk API dan UI selector
 */
export function getVisualCatalog(): VisualCatalogItem[] {
  return [
    // Geometri 3D
    { id: 'balok', category: 'Geometri 3D', name: 'Balok 3D', description: 'Balok isometrik dengan p, l, t dan rusuk putus-putus', sampleParams: { p: 12, l: 8, t: 6, unit: 'cm' } },
    { id: 'kubus', category: 'Geometri 3D', name: 'Kubus 3D', description: 'Kubus isometrik dengan panjang rusuk s', sampleParams: { s: 10, unit: 'cm' } },
    { id: 'tabung', category: 'Geometri 3D', name: 'Tabung 3D', description: 'Silinder tabung dengan jari-jari r dan tinggi t', sampleParams: { r: 7, t: 14, unit: 'cm' } },
    { id: 'kerucut', category: 'Geometri 3D', name: 'Kerucut 3D', description: 'Kerucut dengan jari-jari r, tinggi t, garis pelukis s', sampleParams: { r: 7, t: 12, s: 15, unit: 'cm' } },
    { id: 'bola', category: 'Geometri 3D', name: 'Bola 3D', description: 'Bola berarsir radial dengan jari-jari r', sampleParams: { r: 14, unit: 'cm' } },
    { id: 'prisma', category: 'Geometri 3D', name: 'Prisma Segitiga 3D', description: 'Prisma segitiga isometrik dengan alas, tinggi, panjang', sampleParams: { alas: 10, tinggiSegitiga: 8, panjang: 15, unit: 'cm' } },
    { id: 'limas', category: 'Geometri 3D', name: 'Limas Segiempat 3D', description: 'Limas piramida dengan alas persegi s dan tinggi t', sampleParams: { s: 10, t: 12, unit: 'cm' } },
    { id: 'jaring_kubus', category: 'Geometri 3D', name: 'Jaring-jaring Kubus', description: 'Pola jaring-jaring 6 muka kubus (variasi salib, tangga, atau pola T)', sampleParams: { s: 5, unit: 'cm', pola: 'salib' } },
    { id: 'jaring_balok', category: 'Geometri 3D', name: 'Jaring-jaring Balok', description: 'Pola unfolded balok p × l × t berlabel muka', sampleParams: { p: 6, l: 4, t: 3, unit: 'cm' } },

    // Geometri 2D
    { id: 'persegi_panjang', category: 'Geometri 2D', name: 'Persegi Panjang', description: 'Persegi panjang ABCD berdimensi p & l dan siku-siku', sampleParams: { p: 12, l: 8, unit: 'cm' } },
    { id: 'segitiga_sama_sisi', category: 'Geometri 2D', name: 'Segitiga Sama Sisi', description: 'Segitiga 3 sisi sama berlabel s dan sudut 60°', sampleParams: { s: 10, unit: 'cm' } },
    { id: 'segitiga_sama_kaki', category: 'Geometri 2D', name: 'Segitiga Sama Kaki', description: 'Segitiga dengan 2 kaki sama dan garis tinggi putus-putus', sampleParams: { kaki: 10, alas: 8, unit: 'cm' } },
    { id: 'segitiga_siku', category: 'Geometri 2D', name: 'Segitiga Siku-siku', description: 'Segitiga siku-siku berlabel alas, tinggi, sisi miring', sampleParams: { alas: 6, tinggi: 8, miring: 10, unit: 'cm' } },
    { id: 'lingkaran', category: 'Geometri 2D', name: 'Lingkaran (2D)', description: 'Bangun datar lingkaran dengan jari-jari r', sampleParams: { r: 14, unit: 'cm' } },
    { id: 'trapesium', category: 'Geometri 2D', name: 'Trapesium', description: 'Trapesium dengan sisi alas atas, alas bawah, dan tinggi', sampleParams: { atasAlas: 8, bawahAlas: 14, tinggi: 10, unit: 'cm' } },
    { id: 'jajar_genjang', category: 'Geometri 2D', name: 'Jajar Genjang', description: 'Jajar genjang dengan alas, tinggi, dan garis tinggi proyeksi', sampleParams: { alas: 15, tinggi: 10, unit: 'cm' } },
    { id: 'belah_ketupat', category: 'Geometri 2D', name: 'Belah Ketupat', description: 'Belah ketupat dengan diagonal d1 dan d2', sampleParams: { d1: 12, d2: 16, unit: 'cm' } },
    { id: 'layang_layang', category: 'Geometri 2D', name: 'Layang-layang', description: 'Layang-layang dengan persilangan diagonal d1 dan d2', sampleParams: { d1: 10, d2: 18, unit: 'cm' } },
    { id: 'sudut', category: 'Geometri 2D', name: 'Pengukuran Sudut', description: 'Sudut dengan busur derajat', sampleParams: { derajat: 60 } },
    { id: 'simetri_lipat', category: 'Geometri 2D', name: 'Simetri Lipat', description: 'Bangun datar dengan sumbu simetri lipat putus-putus', sampleParams: { bangun: 'persegi' } },
    { id: 'bangun_gabungan', category: 'Geometri 2D', name: 'Bangun Gabungan L / T', description: 'Bangun datar gabungan poligon bentuk L atau T', sampleParams: { bentuk: 'L', segmen: [{ p: 10, l: 4 }, { p: 6, l: 4 }], unit: 'cm' } },
    { id: 'koordinat', category: 'Geometri 2D', name: 'Koordinat Kartesius', description: 'Bidang kartesius 4 kuadran dengan titik berlabel', sampleParams: { titik: [{ x: 3, y: 4, label: 'P' }, { x: -2, y: 3, label: 'Q' }] } },

    // Pecahan
    { id: 'pecahan_lingkaran', category: 'Pecahan', name: 'Pecahan Lingkaran', description: 'Pecahan juring lingkaran terarsir (mendukung pecahan biasa & campuran)', sampleParams: { pembagi: 4, diarsir: 3, utuh: 0 } },
    { id: 'pecahan_persegi', category: 'Pecahan', name: 'Pecahan Persegi (Grid)', description: 'Matriks grid kotak terarsir proporsional', sampleParams: { kolom: 4, baris: 2, diarsir: 3 } },

    // Statistik
    { id: 'diagram_batang', category: 'Statistik', name: 'Diagram Batang', description: 'Diagram batang vertikal dengan label sumbu X & Y', sampleParams: { judul: 'Data Penjualan', labels: ['Senin', 'Selasa', 'Rabu'], data: [20, 35, 30] } },
    { id: 'diagram_garis', category: 'Statistik', name: 'Diagram Garis', description: 'Diagram garis tren dengan titik data berurutan', sampleParams: { judul: 'Suhu Udara', labels: ['06.00', '12.00', '18.00'], data: [24, 32, 28] } },
    { id: 'diagram_lingkaran', category: 'Statistik', name: 'Diagram Lingkaran (Pie)', description: 'Pie chart statistik dengan persentase dan legenda', sampleParams: { judul: 'Data Hobi', labels: ['Membaca', 'Olahraga', 'Musik'], data: [40, 35, 25] } },
    { id: 'diagram_venn', category: 'Statistik', name: 'Diagram Venn', description: 'Dua himpunan overlap dengan semesta S dan irisan', sampleParams: { judul: 'Hobi Siswa', labelA: 'Sepak Bola', labelB: 'Basket', aSaja: 12, irisan: 5, bSaja: 8 } },
    { id: 'pictogram', category: 'Statistik', name: 'Pictogram / Diagram Gambar', description: 'Tabel diagram gambar dengan baris ikon dan legenda', sampleParams: { judul: 'Data Penjualan Buah', labels: ['Apel', 'Jeruk', 'Mangga'], data: [4, 3, 5], ikon: '●', nilaiIkon: 2 } },

    // Pengukuran
    { id: 'jam_analog', category: 'Pengukuran', name: 'Jam Analog', description: 'Jam dinding analog dengan jarum jam dan menit presisi', sampleParams: { jam: 7, menit: 30 } },
    { id: 'garis_bilangan', category: 'Pengukuran', name: 'Garis Bilangan', description: 'Garis bilangan bulat berlabel titik P', sampleParams: { min: -5, max: 5, titik: [{ x: 2, label: 'P' }] } },
    { id: 'mistar', category: 'Pengukuran', name: 'Pengukuran Panjang Mistar', description: 'Penggaris berskala milimeter dengan benda offset berlabel panjang', sampleParams: { start: 3, end: 8.5, objectType: 'pensil', label: 'Panjang = ... cm' } },
    { id: 'busur_derajat', category: 'Pengukuran', name: 'Busur Derajat (Pengukuran Sudut)', description: 'Busur derajat transparan setengah lingkaran 0°-180° untuk membaca sudut', sampleParams: { derajat: 60, label: 'X' } },

    // Sains / IPAS
    { id: 'organ_pencernaan', category: 'Sains / IPAS', name: 'Sistem Pencernaan', description: 'Organ pencernaan makro manusia berlabel target X', sampleParams: { pointer: 'lambung', label: 'X' } },
    { id: 'vili_usus', category: 'Sains / IPAS', name: 'Vili Usus Halus', description: 'Struktur mikroskopis penyerapan sari makanan', sampleParams: { pointer: 'vili', label: 'X' } },
    { id: 'struktur_gigi', category: 'Sains / IPAS', name: 'Struktur & Jenis Gigi', description: 'Gigi seri, taring, dan geraham dengan fungsinya', sampleParams: { pointer: 'taring', label: 'X' } },
    { id: 'lambung_detail', category: 'Sains / IPAS', name: 'Lambung & Enzim Detail', description: 'Penampang dinding lambung, rugae, kardia, dan pilorus', sampleParams: { pointer: 'rugae', label: 'X' } },
    { id: 'organ_pernapasan', category: 'Sains / IPAS', name: 'Sistem Pernapasan', description: 'Organ pernapasan manusia berlabel target X', sampleParams: { pointer: 'trakea', label: 'X' } },
    { id: 'alveolus', category: 'Sains / IPAS', name: 'Alveolus & Pertukaran Gas', description: 'Penampang mikroskopis kapiler dan difusi O2/CO2', sampleParams: { pointer: 'alveolus', label: 'X' } },
    { id: 'siklus_air', category: 'Sains / IPAS', name: 'Siklus Air', description: 'Daur air (evaporasi, kondensasi, presipitasi, infiltrasi)', sampleParams: { pointer: 'evaporasi', label: 'X' } },
    { id: 'metamorfosis', category: 'Sains / IPAS', name: 'Metamorfosis Kupu-kupu', description: 'Daur hidup telur, ulat, kepompong, kupu-kupu berlabel X', sampleParams: { pointer: 'kepompong', label: 'X' } },
    { id: 'bagian_bunga', category: 'Sains / IPAS', name: 'Bagian Bunga', description: 'Penampang putik, benang sari, mahkota, kelopak berlabel X', sampleParams: { pointer: 'putik', label: 'X' } },
    { id: 'rantai_makanan', category: 'Sains / IPAS', name: 'Rantai Makanan', description: 'Alur produsen -> konsumen 1, 2, 3 -> pengurai berlabel X', sampleParams: { pointer: 'produsen', label: 'X' } },
    { id: 'peta_indonesia', category: 'Sains / IPAS', name: 'Peta Kepulauan Indonesia', description: 'Peta siluet kepulauan Indonesia berlabel pulau target X', sampleParams: { pointer: 'jawa', label: 'X' } },
    { id: 'rangkaian_listrik', category: 'Sains / IPAS', name: 'Rangkaian Listrik (Seri/Paralel)', description: 'Baterai, saklar, dan lampu rangkaian seri, paralel, atau campuran', sampleParams: { model: 'campuran', s1: true, s2: false, pointer: 'L1', label: 'X' } },
    { id: 'perubahan_wujud', category: 'Sains / IPAS', name: 'Perubahan Wujud Zat', description: 'Diagram segitiga wujud zat padat, cair, gas dengan 6 panah proses berlabel X', sampleParams: { pointer: '1', label: 'X' } },
    { id: 'tata_surya', category: 'Sains / IPAS', name: 'Sistem Tata Surya & Planet', description: 'Matahari dan 8 planet dalam orbit dengan penunjuk planet target X', sampleParams: { pointer: 'bumi', label: 'X' } },
    { id: 'magnet', category: 'Sains / IPAS', name: 'Kutub & Gaya Magnet', description: 'Dua batang magnet interaksi tarik-menarik / tolak-menolak berlabel target kutub X', sampleParams: { interaksi: 'tarik', pointer: 'kanan2', label: 'X' } },
    { id: 'sifat_cahaya', category: 'Sains / IPAS', name: 'Sifat Cahaya (Pembiasan & Pemantulan)', description: 'Diagram jalannya berkas cahaya pembiasan medium udara-air atau pemantulan cermin berlabel target X', sampleParams: { peristiwa: 'pembiasan', pointer: 'X', label: 'X' } },
    { id: 'perisai_pancasila', category: 'Geometri 2D', name: 'Perisai Garuda Pancasila', description: 'Perisai 5 ruang simbol sila Pancasila dengan penunjuk sila target X', sampleParams: { sila: 1, label: 'X' } }
  ];
}

