/**
 * visual-engine.ts
 * Examplate Visual Stimulus Engine untuk Portal Pendidikan A4EDU / KKG Wanayasa
 *
 * Menghasilkan visual stimulus SVG vektor berstandar lembar ujian sekolah nasional:
 * 1. Geometri 3D & 2D (Balok, Kubus, Tabung, Kerucut, Bola, Sudut, Segitiga Siku)
 * 2. Pecahan (Pecahan Lingkaran terarsir, Pecahan Persegi Grid)
 * 3. Statistik / Data Chart (Diagram Batang, Diagram Garis, Diagram Lingkaran)
 * 4. Diagram IPAS / Sains Berlabel Dinamis (Organ Pernapasan, Pencernaan, Siklus Air, Metamorfosis, Bagian Bunga, Rantai Makanan)
 * 5. Pengukuran & Waktu (Jam Dinding Analog, Garis Bilangan)
 * 6. Parser Cerdas Pendeteksi Stimulus dari Teks Soal
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
export function renderSegitigaSikuSvg(params: { alas?: number; tinggi?: number; miring?: number; unit?: string }): string {
  const a = params.alas || 6;
  const t = params.tinggi || 8;
  const c = params.miring || 10;
  const unit = params.unit || 'cm';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 230" width="320" height="230" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <polygon points="70,40 70,170 230,170" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/>
  <rect x="70" y="154" width="16" height="16" fill="none" stroke="#0f172a" stroke-width="1.5"/>

  <text x="56" y="38" font-size="12" font-weight="bold" fill="#334155">A</text>
  <text x="54" y="184" font-size="12" font-weight="bold" fill="#334155">B</text>
  <text x="238" y="176" font-size="12" font-weight="bold" fill="#334155">C</text>

  <text x="48" y="110" text-anchor="end" font-size="12" font-weight="bold" fill="#0284c7">t = ${t} ${unit}</text>
  <text x="150" y="192" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">a = ${a} ${unit}</text>
  <text x="165" y="95" font-size="12" font-weight="bold" fill="#047857">c = ${c} ${unit}</text>

  <text x="160" y="220" text-anchor="middle" font-size="11" fill="#64748b">Segitiga Siku-Siku ABC (∠B = 90°)</text>
</svg>`;
}

/** Render Sudut dengan busur derajat */
export function renderSudutSvg(params: { derajat?: number; jenis?: string; label?: string }): string {
  const deg = params.derajat || 60;
  const label = params.label || `Sudut ${deg}°`;
  const rad = (deg * Math.PI) / 180;

  const len = 150;
  const cx = 80;
  const cy = 160;

  const x1 = cx + len;
  const y1 = cy;

  const x2 = cx + len * Math.cos(rad);
  const y2 = cy - len * Math.sin(rad);

  const arcR = 45;
  const arcX = cx + arcR * Math.cos(rad);
  const arcY = cy - arcR * Math.sin(rad);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#0f172a" stroke-width="2.5"/>
  <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="2.5"/>

  <path d="M ${cx + arcR},${cy} A ${arcR},${arcR} 0 0,0 ${arcX},${arcY}" fill="none" stroke="#e11d48" stroke-width="2"/>
  
  <circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>
  <text x="${cx - 16}" y="${cy + 16}" font-size="13" font-weight="bold" fill="#334155">B</text>
  <text x="${x1 + 10}" y="${y1 + 4}" font-size="13" font-weight="bold" fill="#334155">C</text>
  <text x="${x2 + 6}" y="${y2 - 6}" font-size="13" font-weight="bold" fill="#334155">A</text>

  <text x="${cx + arcR + 15}" y="${cy - arcR / 2}" font-size="13" font-weight="bold" fill="#e11d48">${deg}°</text>

  <text x="160" y="205" text-anchor="middle" font-size="11" fill="#64748b">${escapeXml(label)}</text>
</svg>`;
}

// =========================================================================
// 2. PECAHAN (MATEMATIKA)
// =========================================================================

/** Render Pecahan Lingkaran dengan n bagian, k bagian diarsir */
export function renderPecahanLingkaranSvg(params: { pembagi?: number; diarsir?: number; caption?: string }): string {
  const n = Math.max(2, Math.min(16, params.pembagi || 4));
  const k = Math.max(1, Math.min(n, params.diarsir || 3));
  const caption = params.caption || `Pecahan ${k}/${n}`;

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
  <text x="160" y="225" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">${escapeXml(caption)} (${k} dari ${n} bagian diarsir)</text>
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
  const caption = params.caption || `Pecahan ${shaded}/${total}`;

  const startX = 40;
  const startY = 40;
  const boxW = 240 / cols;
  const boxH = 120 / rows;

  let boxes = '';
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      count++;
      if (count > total) break;
      const isShaded = count <= shaded;
      const fill = isShaded ? '#38bdf8' : '#ffffff';
      boxes += `<rect x="${startX + c * boxW}" y="${startY + r * boxH}" width="${boxW}" height="${boxH}" fill="${fill}" stroke="#0f172a" stroke-width="2"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <g>${boxes}</g>
  <text x="160" y="200" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">${escapeXml(caption)} (${shaded} dari ${total} kotak diarsir)</text>
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

  let target = { x: 160, y: 110, name: 'Trakea (Tenggorokan)' };
  if (pointer.includes('hidung')) target = { x: 160, y: 48, name: 'Rongga Hidung' };
  else if (pointer.includes('laring') || pointer.includes('faring')) target = { x: 160, y: 80, name: 'Faring / Laring' };
  else if (pointer.includes('bronkus')) target = { x: 145, y: 138, name: 'Bronkus' };
  else if (pointer.includes('paru') || pointer.includes('alveolus')) target = { x: 205, y: 155, name: 'Paru-paru / Alveolus' };
  else if (pointer.includes('diafragma')) target = { x: 160, y: 200, name: 'Diafragma' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 260" width="340" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="170" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Sistem Pernapasan Manusia</text>

  <!-- Siluet Kepala & Leher -->
  <path d="M 120,40 C 120,25 150,25 170,25 C 190,25 200,35 200,50 C 200,60 190,70 180,80 L 180,95 L 140,95 L 140,80 Z" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="160" cy="48" r="7" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
  <rect x="154" y="70" width="12" height="22" rx="3" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>

  <!-- Trakea & Cincin Rawan -->
  <rect x="153" y="94" width="14" height="42" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
  <line x1="153" y1="102" x2="167" y2="102" stroke="#ea580c" stroke-width="1.5"/>
  <line x1="153" y1="110" x2="167" y2="110" stroke="#ea580c" stroke-width="1.5"/>
  <line x1="153" y1="118" x2="167" y2="118" stroke="#ea580c" stroke-width="1.5"/>
  <line x1="153" y1="126" x2="167" y2="126" stroke="#ea580c" stroke-width="1.5"/>

  <path d="M 160,136 L 135,148 M 160,136 L 185,148" stroke="#c2410c" stroke-width="3" stroke-linecap="round"/>

  <!-- Paru-paru Kiri & Kanan -->
  <path d="M 135,145 C 105,145 95,170 100,195 C 105,210 135,210 145,200 C 150,195 152,165 135,145 Z" fill="#fda4af" stroke="#e11d48" stroke-width="1.8"/>
  <path d="M 185,145 C 215,145 225,170 220,195 C 215,210 185,210 175,200 C 170,195 168,165 185,145 Z" fill="#fda4af" stroke="#e11d48" stroke-width="1.8"/>
  <path d="M 90,212 Q 160,200 230,212" fill="none" stroke="#047857" stroke-width="3"/>

  <!-- Panah Penunjuk Dinamis -->
  <g>
    <line x1="280" y1="${target.y}" x2="${target.x + 8}" y2="${target.y}" stroke="#e11d48" stroke-width="2" marker-end="url(#arrow)"/>
    <circle cx="288" cy="${target.y}" r="14" fill="#e11d48"/>
    <text x="288" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="170" y="245" text-anchor="middle" font-size="11" fill="#64748b">Perhatikan bagian bertanda huruf "${escapeXml(labelChar)}"</text>
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

  let target = { x: 160, y: 70, name: 'Kepala Putik' };
  if (pointer.includes('sari') || pointer.includes('benang')) target = { x: 120, y: 80, name: 'Benang Sari' };
  else if (pointer.includes('mahkota')) target = { x: 235, y: 100, name: 'Mahkota Bunga' };
  else if (pointer.includes('kelopak')) target = { x: 125, y: 165, name: 'Kelopak Bunga' };
  else if (pointer.includes('biji') || pointer.includes('bakal')) target = { x: 160, y: 145, name: 'Bakal Biji' };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 250" width="330" height="250" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <marker id="bArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="165" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Penampang Bagian-Bagian Bunga</text>

  <line x1="165" y1="180" x2="165" y2="225" stroke="#15803d" stroke-width="6"/>

  <ellipse cx="165" cy="155" rx="20" ry="25" fill="#bbf7d0" stroke="#16a34a" stroke-width="2"/>
  <circle cx="165" cy="150" r="6" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>

  <path d="M 145,160 C 115,165 110,180 135,175" fill="#86efac" stroke="#16a34a" stroke-width="2"/>
  <path d="M 185,160 C 215,165 220,180 195,175" fill="#86efac" stroke="#16a34a" stroke-width="2"/>

  <path d="M 145,150 C 90,130 90,80 130,95 C 145,100 150,130 150,140 Z" fill="#fda4af" stroke="#e11d48" stroke-width="2"/>
  <path d="M 185,150 C 240,130 240,80 200,95 C 185,100 180,130 180,140 Z" fill="#fda4af" stroke="#e11d48" stroke-width="2"/>

  <path d="M 155,140 Q 125,110 125,85" fill="none" stroke="#ca8a04" stroke-width="2"/>
  <ellipse cx="125" cy="83" rx="5" ry="4" fill="#facc15" stroke="#a16207" stroke-width="1.5"/>

  <path d="M 175,140 Q 205,110 205,85" fill="none" stroke="#ca8a04" stroke-width="2"/>
  <ellipse cx="205" cy="83" rx="5" ry="4" fill="#facc15" stroke="#a16207" stroke-width="1.5"/>

  <line x1="165" y1="135" x2="165" y2="70" stroke="#047857" stroke-width="3"/>
  <ellipse cx="165" cy="68" rx="8" ry="6" fill="#4ade80" stroke="#15803d" stroke-width="2"/>

  <!-- Target Huruf X -->
  <g>
    <circle cx="${target.x}" cy="${target.y}" r="15" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${target.x}" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="165" y="242" text-anchor="middle" font-size="11" fill="#64748b">Bagian bunga bertanda huruf "${escapeXml(labelChar)}"</text>
</svg>`;
}

// =========================================================================
// 5. PENGUKURAN & WAKTU (MATEMATIKA & BAHASA INGGRIS)
// =========================================================================

/** Render Jam Analog (Telling Time) */
export function renderJamAnalogSvg(params: { jam?: number; menit?: number; caption?: string }): string {
  const jam = params.jam != null ? params.jam : 7;
  const menit = params.menit != null ? params.menit : 30;
  const caption = params.caption || `Pukul ${String(jam).padStart(2, '0')}.${String(menit).padStart(2, '0')}`;

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

  <text x="${cx}" y="215" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(caption)}</text>
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
export function renderSegitigaSamaKakiSvg(params: { kaki?: number; alas?: number; unit?: string }): string {
  const kaki = params.kaki || 10;
  const alas = params.alas || 8;
  const unit = params.unit || 'cm';

  const base = 180;
  const h = Math.round(Math.sqrt(Math.pow(base * (kaki / alas) * 0.5, 2) - Math.pow(base / 2, 2)));
  const safeH = Math.max(100, Math.min(180, h));
  const cx = 180;
  const by = 210;
  const ax = cx - base / 2;
  const bx = cx + base / 2;
  const ty = by - safeH;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="360" height="260" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="sskGrad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
  </defs>

  <polygon points="${cx},${ty} ${ax},${by} ${bx},${by}" fill="url(#sskGrad)" stroke="#b45309" stroke-width="2.5"/>

  <!-- Titik sudut -->
  <circle cx="${cx}" cy="${ty}" r="3" fill="#b45309"/><text x="${cx}" y="${ty - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">A</text>
  <circle cx="${ax}" cy="${by}" r="3" fill="#b45309"/><text x="${ax - 10}" y="${by + 16}" font-size="12" font-weight="bold" fill="#b45309">B</text>
  <circle cx="${bx}" cy="${by}" r="3" fill="#b45309"/><text x="${bx + 5}" y="${by + 16}" font-size="12" font-weight="bold" fill="#b45309">C</text>

  <!-- Garis tinggi putus-putus -->
  <line x1="${cx}" y1="${ty}" x2="${cx}" y2="${by}" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="${cx}" cy="${by}" r="2.5" fill="#6b7280"/>
  <text x="${cx + 6}" y="${by - 4}" font-size="9" fill="#6b7280">T</text>
  <!-- Simbol siku-siku di kaki tinggi -->
  <polyline points="${cx + 10},${by} ${cx + 10},${by - 10} ${cx},${by - 10}" fill="none" stroke="#6b7280" stroke-width="1.2"/>

  <!-- Label kaki (sama panjang) -->
  <text x="${(cx + ax) / 2 - 18}" y="${(ty + by) / 2}" font-size="12" font-weight="bold" fill="#e11d48">${kaki} ${unit}</text>
  <text x="${(cx + bx) / 2 + 8}" y="${(ty + by) / 2}" font-size="12" font-weight="bold" fill="#e11d48">${kaki} ${unit}</text>

  <!-- Tanda strip kaki kongruen -->
  <line x1="${(cx + ax) / 2}" y1="${(ty + by) / 2 - 4}" x2="${(cx + ax) / 2 + 6}" y2="${(ty + by) / 2 + 4}" stroke="#b45309" stroke-width="2.5"/>
  <line x1="${(cx + ax) / 2 - 4}" y1="${(ty + by) / 2 - 2}" x2="${(cx + ax) / 2 + 2}" y2="${(ty + by) / 2 + 6}" stroke="#b45309" stroke-width="2.5"/>
  <line x1="${(cx + bx) / 2}" y1="${(ty + by) / 2 - 4}" x2="${(cx + bx) / 2 - 6}" y2="${(ty + by) / 2 + 4}" stroke="#b45309" stroke-width="2.5"/>
  <line x1="${(cx + bx) / 2 + 4}" y1="${(ty + by) / 2 - 2}" x2="${(cx + bx) / 2 - 2}" y2="${(ty + by) / 2 + 6}" stroke="#b45309" stroke-width="2.5"/>

  <!-- Label alas -->
  <text x="${cx}" y="${by + 16}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">${alas} ${unit}</text>

  <text x="180" y="252" text-anchor="middle" font-size="11" fill="#64748b">Segitiga Sama Kaki ABC</text>
</svg>`;
}

/** Render Jaring-jaring Kubus (bentuk salib/plus) */
export function renderJaringKubusSvg(params: { s?: number; unit?: string }): string {
  const s = params.s || 5;
  const unit = params.unit || 'cm';
  const cs = 60; // ukuran kotak visual
  const gap = 1;

  // Posisi salib: 1 atas, 4 tengah berjajar, 1 bawah
  const faces = [
    { x: cs + gap, y: 0, label: 'Atas' },           // atas
    { x: 0, y: cs + gap, label: 'Kiri' },             // kiri
    { x: cs + gap, y: cs + gap, label: 'Depan' },     // depan (tengah)
    { x: 2 * (cs + gap), y: cs + gap, label: 'Kanan' }, // kanan
    { x: 3 * (cs + gap), y: cs + gap, label: 'Belakang' }, // belakang
    { x: cs + gap, y: 2 * (cs + gap), label: 'Bawah' }, // bawah
  ];

  const colors = ['#dbeafe', '#fce7f3', '#d1fae5', '#fef3c7', '#e0e7ff', '#fecaca'];
  const w = 4 * (cs + gap) + 40;
  const h = 3 * (cs + gap) + 60;
  const ox = 20;
  const oy = 20;

  let rects = '';
  faces.forEach((f, i) => {
    rects += `<rect x="${ox + f.x}" y="${oy + f.y}" width="${cs}" height="${cs}" fill="${colors[i]}" stroke="#1e40af" stroke-width="2" rx="2"/>`;
    rects += `<text x="${ox + f.x + cs / 2}" y="${oy + f.y + cs / 2 + 4}" text-anchor="middle" font-size="9" fill="#475569">${f.label}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  ${rects}
  <text x="${ox + cs + gap + cs / 2}" y="${oy + 3 * (cs + gap) + 26}" text-anchor="middle" font-size="12" font-weight="bold" fill="#e11d48">s = ${s} ${unit}</text>
  <text x="${w / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#64748b">Jaring-jaring Kubus (sisi ${s} ${unit})</text>
</svg>`;
}

/** Render Jaring-jaring Balok (bentuk T terbuka) */
export function renderJaringBalokSvg(params: { p?: number; l?: number; t?: number; unit?: string }): string {
  const p = params.p || 6;
  const l = params.l || 4;
  const t = params.t || 3;
  const unit = params.unit || 'cm';

  // Skala visual agar pas di viewport
  const scale = 18;
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

  const w = 360;
  const h = 320;
  const cx = w / 2;
  const cy = h / 2 - 10;
  const gridStep = 28;

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
    // Value
    rows += `<text x="${labelW + 10 + val * iconW + 5}" y="${ry + 14}" font-size="11" fill="#64748b">(${val * nilaiIkon})</text>`;
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
  <text x="180" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">Simetri Lipat: ${escapeXml(labelBangun)}</text>
  ${shape}
  ${lines}
  <text x="180" y="240" text-anchor="middle" font-size="12" fill="#64748b">Jumlah garis simetri = <tspan font-weight="bold" fill="#e11d48">${garisText}</tspan></text>
  <text x="180" y="256" text-anchor="middle" font-size="10" fill="#94a3b8">--- garis simetri lipat (putus-putus)</text>
</svg>`;
}

/** Render Bangun Gabungan bentuk L atau T dengan dimensi per segmen */
export function renderBangunGabunganSvg(params: { bentuk?: string; segmen?: Array<{ p: number; l: number }>; unit?: string }): string {
  const bentuk = (params.bentuk || 'L').toUpperCase();
  const unit = params.unit || 'cm';
  const seg = params.segmen?.length ? params.segmen : [{ p: 10, l: 4 }, { p: 6, l: 4 }];

  const scale = 14;
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

    slicesSvg += `<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;

    // Label di tengah slice
    const midAngle = startAngle + sweep / 2;
    const labelR = r * 0.6;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
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
  const swMulut = isTarget.mulut ? 2.5 : 1.2;

  const colEsofagus = isTarget.kerongkongan ? '#d97706' : '#fed7aa';
  const swEsofagus = isTarget.kerongkongan ? 2.5 : 1.2;

  const colLambung = isTarget.lambung ? '#e11d48' : '#fecdd3';
  const swLambung = isTarget.lambung ? 2.5 : 1.5;

  const colHati = isTarget.hati ? '#15803d' : '#86efac';
  const swHati = isTarget.hati ? 2.5 : 1.2;

  const colUsusHalus = isTarget.ususHalus ? '#ea580c' : '#fed7aa';
  const swUsusHalus = isTarget.ususHalus ? 3.5 : 2;

  const colUsusBesar = isTarget.ususBesar ? '#0284c7' : '#bae6fd';
  const swUsusBesar = isTarget.ususBesar ? 4 : 2.5;

  const colAnus = isTarget.anus ? '#475569' : '#cbd5e1';
  const swAnus = isTarget.anus ? 2.5 : 1.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270" width="360" height="270" style="background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;">
  <defs>
    <linearGradient id="torsoBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <marker id="arrPenc" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
    </marker>
  </defs>

  <text x="180" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">Sistem Pencernaan Manusia</text>

  <!-- Siluet Tubuh Torso Manusia (Konteks Posisi Anatomis) -->
  <path d="M 140,28 C 140,20 155,18 170,18 C 185,18 200,20 200,28 C 200,38 190,48 185,55 L 235,68 C 245,72 250,85 245,110 L 235,160 C 235,180 245,210 245,240 L 95,240 C 95,210 105,180 105,160 L 95,110 C 90,85 95,72 105,68 L 155,55 C 150,48 140,38 140,28 Z" fill="url(#torsoBg)" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- 1. Mulut & Gigi/Lidah -->
  <ellipse cx="170" cy="44" rx="14" ry="8" fill="${colMulut}" stroke="#e11d48" stroke-width="${swMulut}"/>
  <text x="140" y="47" font-size="9" text-anchor="end" fill="#64748b">Mulut</text>

  <!-- 2. Kerongkongan (Esofagus) -->
  <path d="M 167,52 L 167,95 M 173,52 L 173,95" stroke="${colEsofagus}" stroke-width="${swEsofagus * 1.5}" stroke-linecap="round"/>
  <text x="140" y="76" font-size="9" text-anchor="end" fill="#64748b">Kerongkongan</text>

  <!-- 3. Hati (Liver - Kanan Tubuh / Kiri Gambar) -->
  <path d="M 125,95 C 115,95 105,110 115,125 C 125,135 145,135 155,120 L 155,100 Z" fill="${colHati}" stroke="#15803d" stroke-width="${swHati}"/>
  <!-- Kantung Empedu Kecil -->
  <ellipse cx="148" cy="126" rx="4" ry="5" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
  <text x="100" y="115" font-size="9" text-anchor="end" fill="#64748b">Hati</text>

  <!-- 4. Lambung (Kiri Tubuh / Kanan Gambar) -->
  <path d="M 165,95 C 150,95 155,125 165,140 C 175,150 195,145 200,135 C 205,125 200,105 185,100 Z" fill="${colLambung}" stroke="#e11d48" stroke-width="${swLambung}"/>
  <text x="215" y="112" font-size="9" fill="#64748b">Lambung</text>

  <!-- 5. Usus Halus (Lipatan-lipatan di Tengah) -->
  <path d="M 155,160 Q 170,155 185,160 Q 185,175 170,175 Q 155,175 155,190 Q 170,190 185,190" fill="none" stroke="${colUsusHalus}" stroke-width="${swUsusHalus}" stroke-linecap="round"/>
  <text x="135" y="180" font-size="9" text-anchor="end" fill="#64748b">Usus Halus</text>

  <!-- 6. Usus Besar (Kolon Membingkai Usus Halus) -->
  <path d="M 145,195 L 145,150 C 145,145 195,145 195,150 L 195,200 L 175,200 L 175,218" fill="none" stroke="${colUsusBesar}" stroke-width="${swUsusBesar}" stroke-linecap="round"/>
  <text x="220" y="165" font-size="9" fill="#64748b">Usus Besar</text>

  <!-- 7. Anus -->
  <circle cx="170" cy="225" r="4.5" fill="${colAnus}" stroke="#334155" stroke-width="${swAnus}"/>
  <text x="150" y="228" font-size="9" text-anchor="end" fill="#64748b">Anus</text>

  <!-- Panah Penunjuk Dinamis Leader Line Target X -->
  <g>
    <line x1="300" y1="${target.y}" x2="${target.x + 12}" y2="${target.y}" stroke="#e11d48" stroke-width="2.2" marker-end="url(#arrPenc)"/>
    <circle cx="310" cy="${target.y}" r="14" fill="#e11d48"/>
    <text x="310" y="${target.y + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(labelChar)}</text>
  </g>

  <text x="180" y="258" text-anchor="middle" font-size="10.5" fill="#64748b">Perhatikan bagian organ yang ditunjuk oleh huruf "${escapeXml(labelChar)}"</text>
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
  else if (type === 'pecahan_lingkaran' || type === 'pecahan_pie') {
    svg = renderPecahanLingkaranSvg(params);
    title = title || 'Visualisasi Pecahan Lingkaran';
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
  }
  // Pengukuran & Waktu
  else if (type === 'jam_analog' || type === 'jam' || type === 'clock') {
    svg = renderJamAnalogSvg(params);
    title = title || 'Jam Dinding Analog';
  } else if (type === 'garis_bilangan') {
    svg = renderGarisBilanganSvg(params);
    title = title || 'Garis Bilangan';
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
    const sMatch = text.match(/(?:rusuk|sisi)\D*(\d+)/i) || text.match(/s\s*=\s*(\d+)/i);
    const nums = text.match(/\b(\d+)\s*(?:cm|m)\b/g);
    const s = sMatch ? parseInt(sMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 5);
    return { type: 'jaring_kubus', params: { s, unit: 'cm' } };
  }

  // 0d. Jaring-jaring Balok
  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('balok')) {
    const pMatch = text.match(/panjang\D*(\d+)/i) || text.match(/p\s*=\s*(\d+)/i);
    const lMatch = text.match(/lebar\D*(\d+)/i) || text.match(/l\s*=\s*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i) || text.match(/t\s*=\s*(\d+)/i);
    const nums = text.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let p = pMatch ? parseInt(pMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 6);
    let l = lMatch ? parseInt(lMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 4);
    let t = tMatch ? parseInt(tMatch[1]) : (nums && nums.length >= 3 ? parseInt(nums[2]) : 3);
    return { type: 'jaring_balok', params: { p, l, t, unit: 'cm' } };
  }

  // 0e. Persegi Panjang
  if (text.includes('persegi panjang') || text.includes('persegipanjang')) {
    const pMatch = text.match(/panjang\D*(\d+)/i) || text.match(/p\s*=\s*(\d+)/i);
    const lMatch = text.match(/lebar\D*(\d+)/i) || text.match(/l\s*=\s*(\d+)/i);
    const nums = text.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let p = pMatch ? parseInt(pMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 12);
    let l = lMatch ? parseInt(lMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 8);
    return { type: 'persegi_panjang', params: { p, l, unit: 'cm' } };
  }

  // 0f. Segitiga Sama Sisi
  if (text.includes('segitiga sama sisi') || text.includes('segitiga samasisi')) {
    const sMatch = text.match(/sisi\D*(\d+)/i) || text.match(/s\s*=\s*(\d+)/i);
    const nums = text.match(/\b(\d+)\s*(?:cm|m)\b/g);
    const s = sMatch ? parseInt(sMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 10);
    return { type: 'segitiga_sama_sisi', params: { s, unit: 'cm' } };
  }

  // 0g. Segitiga Sama Kaki
  if (text.includes('segitiga sama kaki') || text.includes('segitiga samakaki')) {
    const kMatch = text.match(/kaki\D*(\d+)/i) || text.match(/sisi\s*sama\D*(\d+)/i);
    const aMatch = text.match(/alas\D*(\d+)/i) || text.match(/a\s*=\s*(\d+)/i);
    const nums = text.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let kaki = kMatch ? parseInt(kMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 10);
    let alas = aMatch ? parseInt(aMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 8);
    return { type: 'segitiga_sama_kaki', params: { kaki, alas, unit: 'cm' } };
  }

  // 0h. Segitiga Siku-siku
  if (text.includes('segitiga siku') || text.includes('segitiga sikusiku')) {
    const aMatch = text.match(/alas\D*(\d+)/i) || text.match(/a\s*=\s*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i) || text.match(/t\s*=\s*(\d+)/i);
    const mMatch = text.match(/miring\D*(\d+)/i) || text.match(/c\s*=\s*(\d+)/i);
    const nums = text.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let alas = aMatch ? parseInt(aMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 6);
    let tinggi = tMatch ? parseInt(tMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 8);
    let miring = mMatch ? parseInt(mMatch[1]) : (nums && nums.length >= 3 ? parseInt(nums[2]) : 10);
    return { type: 'segitiga_siku', params: { alas, tinggi, miring, unit: 'cm' } };
  }

  // 0i. Koordinat Kartesius
  if (text.includes('kartesius') || text.includes('koordinat') || (text.includes('titik') && /\([+-]?\d+\s*,\s*[+-]?\d+\)/.test(text))) {
    const pointMatches = [...text.matchAll(/([A-Za-z])\s*\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*\)/g)];
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
    const pMatch = text.match(/panjang\D*(\d+)/i) || text.match(/p\s*=\s*(\d+)/i);
    const lMatch = text.match(/lebar\D*(\d+)/i) || text.match(/l\s*=\s*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i) || text.match(/t\s*=\s*(\d+)/i);
    const nums = text.match(/\b(\d+)\s*(?:cm|m)\b/g);

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
    const sMatch = text.match(/(?:rusuk|sisi)\D*(\d+)/i) || text.match(/s\s*=\s*(\d+)/i);
    const s = sMatch ? parseInt(sMatch[1]) : 10;
    return { type: 'kubus', params: { s, unit: 'cm' } };
  }

  // 3. Tabung
  if (text.includes('tabung') && (text.includes('jari-jari') || text.includes('diameter') || text.includes('tinggi'))) {
    const rMatch = text.match(/jari-jari\D*(\d+)/i) || text.match(/r\s*=\s*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i) || text.match(/t\s*=\s*(\d+)/i);
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
    const rMatch = text.match(/jari-jari\D*(\d+)/i);
    const tMatch = text.match(/tinggi\D*(\d+)/i);
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

  // 13. Pecahan
  if (text.includes('pecahan') || text.includes('diarsir') || text.includes('arsiran')) {
    const fracMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (fracMatch) {
      const k = parseInt(fracMatch[1]);
      const n = parseInt(fracMatch[2]);
      if (n > 1 && n <= 12) {
        return { type: 'pecahan_lingkaran', params: { pembagi: n, diarsir: k } };
      }
    }
  }

  // 14. Sudut
  if (text.includes('sudut') && (text.includes('derajat') || text.includes('°') || text.includes('lancip') || text.includes('tumpul'))) {
    const degMatch = text.match(/(\d+)\s*(?:derajat|°)/i);
    const deg = degMatch ? parseInt(degMatch[1]) : 60;
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

  return null;
}

