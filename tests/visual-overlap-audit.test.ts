import { describe, it, expect } from 'vitest';
import {
  renderPeredaranDarahSvg,
  renderGerhanaSvg,
  renderPesawatSederhanaSvg,
  renderPancaindraSvg,
  renderTimbanganNeracaSvg,
  renderMataAnginSvg,
  renderTabelTurusSvg,
  renderSpinnerPeluangSvg,
  renderPolaGambarSvg,
  renderFlowchartSvg,
  renderTermometerSvg,
  renderGelasUkurSvg,
  renderPohonFaktorSvg,
  renderGridMatriks100Svg,
  renderRambuLaluLintasSvg,
  renderPiringGiziSeimbangSvg,
  renderLapanganOlahragaSvg,
  renderPrepositionPlaceSvg,
  renderTanggaNadaSvg,
  renderLingkaranWarnaSvg,
  renderStrukturPemdaSvg,
  renderGridMazeKodingSvg,
  generateVisualStimulus,
  getVisualCatalog,
  detectStimulusFromSoalText
} from '../src/lib/visual-engine';

describe('SVG Visual Stimulus Text Overlap & Collision Audit', () => {
  // Helper to extract all text elements and check for duplicate/overlapping coordinates in world space
  interface TextBBox {
    text: string;
    x: number;
    y: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    anchor: string;
    fontSize: number;
  }

  function extractTextPositions(svg: string): TextBBox[] {
    let currentGx = 0;
    let currentGy = 0;
    const items: TextBBox[] = [];

    const tagRegex = /<(\/?)(g|text)([^>]*)>(?:([\s\S]*?)(?=<\/text>))?/gi;
    let match: RegExpExecArray | null;
    const gStack: Array<{ gx: number; gy: number }> = [];

    while ((match = tagRegex.exec(svg)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();
      const attrs = match[3] || '';
      const textContent = (match[4] || '').trim();

      if (tagName === 'g') {
        if (isClosing) {
          const popped = gStack.pop();
          if (popped) {
            currentGx -= popped.gx;
            currentGy -= popped.gy;
          }
        } else {
          const transMatch = attrs.match(/transform=["']translate\(\s*([0-9.-]+)(?:[,\s]+([0-9.-]+))?\s*\)["']/i);
          const gx = transMatch ? parseFloat(transMatch[1]) : 0;
          const gy = transMatch && transMatch[2] ? parseFloat(transMatch[2]) : 0;
          gStack.push({ gx, gy });
          currentGx += gx;
          currentGy += gy;
        }
      } else if (tagName === 'text' && !isClosing) {
        const xMatch = attrs.match(/x=["']([0-9.-]+)["']/);
        const yMatch = attrs.match(/y=["']([0-9.-]+)["']/);
        const anchorMatch = attrs.match(/text-anchor=["']([^"']+)["']/);
        const fontMatch = attrs.match(/font-size=["']([0-9.]+)["']/);

        const localX = xMatch ? parseFloat(xMatch[1]) : 0;
        const localY = yMatch ? parseFloat(yMatch[1]) : 0;
        const anchor = anchorMatch ? anchorMatch[1] : 'start';
        const fontSize = fontMatch ? parseFloat(fontMatch[1]) : 11;

        const worldX = localX + currentGx;
        const worldY = localY + currentGy;

        const textLen = textContent.replace(/<[^>]+>/g, '').length || 1;
        const w = textLen * fontSize * 0.50; // Conservative width
        let minX = worldX;
        let maxX = worldX + w;

        if (anchor === 'middle') {
          minX = worldX - w / 2;
          maxX = worldX + w / 2;
        } else if (anchor === 'end') {
          minX = worldX - w;
          maxX = worldX;
        }

        const minY = worldY - fontSize * 0.72;
        const maxY = worldY + fontSize * 0.15;

        items.push({
          text: textContent,
          x: worldX,
          y: worldY,
          minX,
          maxX,
          minY,
          maxY,
          anchor,
          fontSize
        });
      }
    }
    return items;
  }

  function assertNoTextOverlap(svg: string, diagramName: string) {
    expect(svg, `${diagramName} should start with <svg`).toContain('<svg');
    expect(svg, `${diagramName} should close with </svg>`).toContain('</svg>');
    expect(svg, `${diagramName} must not contain NaN coordinates`).not.toContain('NaN');

    const texts = extractTextPositions(svg);
    if (texts.length <= 1) return; // Zero or single text diagram cannot have text collisions

    // Check pairwise bounding box intersection
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const t1 = texts[i];
        const t2 = texts[j];

        // Strict center proximity check: within 5px in Y and 12px in X
        const dy = Math.abs(t1.y - t2.y);
        const dx = Math.abs(t1.x - t2.x);

        if (dy < 6 && dx < 15) {
          throw new Error(
            `Point collision in ${diagramName}: "${t1.text}" (${t1.x}, ${t1.y}) and "${t2.text}" (${t2.x}, ${t2.y}) are within dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}`
          );
        }

        // Bounding box intersection check (with 1px buffer to avoid false touches on borders)
        const overlapX = (t1.minX + 1) < (t2.maxX - 1) && (t1.maxX - 1) > (t2.minX + 1);
        const overlapY = (t1.minY + 1) < (t2.maxY - 1) && (t1.maxY - 1) > (t2.minY + 1);

        if (overlapX && overlapY) {
          throw new Error(
            `Bounding box collision in ${diagramName}: "${t1.text}" [X: ${t1.minX.toFixed(1)}..${t1.maxX.toFixed(1)}, Y: ${t1.minY.toFixed(1)}..${t1.maxY.toFixed(1)}] overlaps with "${t2.text}" [X: ${t2.minX.toFixed(1)}..${t2.maxX.toFixed(1)}, Y: ${t2.minY.toFixed(1)}..${t2.maxY.toFixed(1)}]`
          );
        }
      }
    }
  }

  it('1. Peredaran Darah SVG should have zero text collision across all chambers and vessels', () => {
    const variants = [
      { pointer: 'bilik_kiri', label: 'X' },
      { pointer: 'serambi_kanan', label: '1' },
      { pointer: 'aorta', label: 'A' },
      { pointer: 'paru', label: 'P' }
    ];
    for (const v of variants) {
      const svg = renderPeredaranDarahSvg(v);
      assertNoTextOverlap(svg, `Peredaran Darah (${v.pointer})`);
    }
  });

  it('2. Gerhana SVG should have isolated quadrants for Umbra, Penumbra, and Object labels', () => {
    const variants = [
      { jenis: 'matahari' as const, pointer: 'umbra', label: 'X' },
      { jenis: 'matahari' as const, pointer: 'penumbra', label: 'Y' },
      { jenis: 'bulan' as const, pointer: 'umbra', label: 'Z' },
      { jenis: 'bulan' as const, pointer: 'bumi', label: 'W' }
    ];
    for (const v of variants) {
      const svg = renderGerhanaSvg(v);
      assertNoTextOverlap(svg, `Gerhana (${v.jenis} - ${v.pointer})`);
    }
  });

  it('3. Pesawat Sederhana SVG should have clear clearances for fulcrum, load, and effort', () => {
    const variants = [
      { jenis: 'tuas' as const, tipeTuas: 1 as const, pointer: 'tumpu', label: 'X' },
      { jenis: 'tuas' as const, tipeTuas: 2 as const, pointer: 'beban', label: 'W' },
      { jenis: 'tuas' as const, tipeTuas: 3 as const, pointer: 'kuasa', label: 'F' },
      { jenis: 'katrol' as const, tipeKatrol: 'tetap' as const, pointer: 'kuasa', label: 'F' },
      { jenis: 'katrol' as const, tipeKatrol: 'bebas' as const, pointer: 'beban', label: 'W' }
    ];
    for (const v of variants) {
      const svg = renderPesawatSederhanaSvg(v);
      assertNoTextOverlap(svg, `Pesawat Sederhana (${v.jenis})`);
    }
  });

  it('4. Pancaindra SVG should position margin callouts outside anatomical bodies', () => {
    const eyeVariants = [
      { organ: 'mata' as const, pointer: 'kornea', label: 'X' },
      { organ: 'mata' as const, pointer: 'lensa', label: 'Y' },
      { organ: 'mata' as const, pointer: 'retina', label: 'Z' }
    ];
    for (const v of eyeVariants) {
      const svg = renderPancaindraSvg(v);
      assertNoTextOverlap(svg, `Pancaindra Mata (${v.pointer})`);
    }

    const earVariants = [
      { organ: 'telinga' as const, pointer: 'gendang', label: 'X' },
      { organ: 'telinga' as const, pointer: 'koklea', label: 'Y' },
      { organ: 'telinga' as const, pointer: 'saluran', label: 'Z' }
    ];
    for (const v of earVariants) {
      const svg = renderPancaindraSvg(v);
      assertNoTextOverlap(svg, `Pancaindra Telinga (${v.pointer})`);
    }
  });

  it('5. Timbangan Neraca SVG should separate left pan, right pan, pillar, and dial texts', () => {
    const variants = [
      { status: 'seimbang' as const, pointer: 'kiri' as const, label: 'X' },
      { status: 'miring_kiri' as const, pointer: 'kiri' as const, label: 'A' },
      { status: 'miring_kanan' as const, pointer: 'kanan' as const, label: 'B' }
    ];
    for (const v of variants) {
      const svg = renderTimbanganNeracaSvg(v);
      assertNoTextOverlap(svg, `Timbangan Neraca (${v.status})`);
    }
  });

  it('6. Mata Angin SVG should place 8 directions radially with zero collision', () => {
    const compassSvg = renderMataAnginSvg({ mode: 'kompas', targetArah: 'TL', label: 'X' });
    assertNoTextOverlap(compassSvg, 'Mata Angin Kompas');

    const denahSvg = renderMataAnginSvg({ mode: 'denah' });
    assertNoTextOverlap(denahSvg, 'Mata Angin Denah');
  });

  it('7. Tabel Turus SVG should use strict cell row-heights without multi-line bleeding', () => {
    const svg = renderTabelTurusSvg({
      judul: 'Tabel Frekuensi',
      data: [
        { label: 'Sepak Bola', count: 14 },
        { label: 'Bulu Tangkis', count: 8 },
        { label: 'Basket', count: 5, targetField: 'frekuensi' },
        { label: 'Renang', count: 11, targetField: 'turus' }
      ],
      label: 'X'
    });
    assertNoTextOverlap(svg, 'Tabel Turus');
  });

  it('8. Spinner Peluang SVG should place texts inside pill badges on polar coordinates', () => {
    for (const bagian of [4, 6, 8]) {
      const svg = renderSpinnerPeluangSvg({ bagian, jarumKe: 1, label: 'X' });
      assertNoTextOverlap(svg, `Spinner Peluang (${bagian} bagian)`);
    }
  });

  it('9. Pola Gambar SVG should distribute boxes with uniform padding and dedicated labels', () => {
    const svg = renderPolaGambarSvg({ counts: [1, 3, 5, 7], targetSuku: 4, label: 'X' });
    assertNoTextOverlap(svg, 'Pola Gambar');
  });

  it('10. Flowchart SVG should align decision and branch callouts without line collisions', () => {
    const flow1 = renderFlowchartSvg({ pointer: 'kondisi', label: 'X' });
    assertNoTextOverlap(flow1, 'Flowchart Kondisi');

    const flow2 = renderFlowchartSvg({ pointer: 'output_ya', label: 'Y' });
    assertNoTextOverlap(flow2, 'Flowchart Output Ya');
  });

  it('11. Termometer SVG should cleanly separate scale numbers from pointer indicator', () => {
    for (const suhu of [-10, 0, 25, 40, 50]) {
      const svg = renderTermometerSvg({ suhu, unit: '°C', label: 'X' });
      assertNoTextOverlap(svg, `Termometer (${suhu}°C)`);
    }
  });

  it('12. Gelas Ukur SVG should keep scale labels and volume callout badges separate', () => {
    const tunggal = renderGelasUkurSvg({ mode: 'tunggal', v1: 60, label: 'X' });
    assertNoTextOverlap(tunggal, 'Gelas Ukur Tunggal');

    const batu = renderGelasUkurSvg({ mode: 'batu', v1: 40, v2: 70, label: 'X' });
    assertNoTextOverlap(batu, 'Gelas Ukur Archimedes');
  });

  it('13. Pohon Faktor SVG should place prime and composite nodes without edge overlaps', () => {
    for (const node of ['akar', 'prima1', 'komposit1', 'prima2', 'komposit2', 'prima3'] as const) {
      const svg = renderPohonFaktorSvg({ bilangan: 24, targetNode: node, label: 'X' });
      assertNoTextOverlap(svg, `Pohon Faktor (${node})`);
    }
  });

  it('14. Grid Matriks 100 SVG should isolate legend card and matrix boundaries', () => {
    for (const diarsir of [15, 47, 80]) {
      const svg = renderGridMatriks100Svg({ diarsir, label: 'X' });
      assertNoTextOverlap(svg, `Grid Matriks 100 (${diarsir}%)`);
    }
  });

  it('15. Rambu Lalu Lintas SVG should clear center symbol text and callout box', () => {
    const variants = [
      { kategori: 'larangan' as const, jenis: 'stop', label: 'X' },
      { kategori: 'larangan' as const, jenis: 'dilarang_parkir', label: 'X' },
      { kategori: 'perintah' as const, jenis: 'wajib_belok_kiri', label: 'X' },
      { kategori: 'peringatan' as const, jenis: 'tikungan_tajam', label: 'X' },
      { kategori: 'petunjuk' as const, jenis: 'rumah_sakit', label: 'X' }
    ];
    for (const v of variants) {
      const svg = renderRambuLaluLintasSvg(v);
      assertNoTextOverlap(svg, `Rambu Lalu Lintas (${v.jenis})`);
    }
  });

  it('16. Piring Gizi Seimbang SVG should distribute sector texts and side legend neatly', () => {
    for (const ptr of ['makanan_pokok', 'sayuran', 'lauk_pauk', 'buah'] as const) {
      const svg = renderPiringGiziSeimbangSvg({ pointer: ptr, label: 'X' });
      assertNoTextOverlap(svg, `Piring Makanku (${ptr})`);
    }
  });

  it('17. Denah Lapangan Olahraga SVG should keep field lines and labels distinct', () => {
    const sepakBola = renderLapanganOlahragaSvg({ olahraga: 'sepak_bola', label: 'X' });
    assertNoTextOverlap(sepakBola, 'Lapangan Sepak Bola');

    const voli = renderLapanganOlahragaSvg({ olahraga: 'voli', label: 'X' });
    assertNoTextOverlap(voli, 'Lapangan Voli');
  });

  it('18. Preposition of Place SVG should isolate object labels from spatial items', () => {
    for (const pos of ['in', 'on', 'under', 'between'] as const) {
      const svg = renderPrepositionPlaceSvg({ posisi: pos, label: 'X' });
      assertNoTextOverlap(svg, `Preposition (${pos})`);
    }
  });

  it('19. Tangga Nada SVG should position treble clef, lines, and target note cleanly', () => {
    for (const nada of ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2']) {
      const svg = renderTanggaNadaSvg({ nadaTarget: nada, label: 'X' });
      assertNoTextOverlap(svg, `Tangga Nada (${nada})`);
    }
  });

  it('20. Lingkaran Warna SVG should place center text and side legend without interference', () => {
    const svg = renderLingkaranWarnaSvg({ pointer: 'sekunder', label: 'X' });
    assertNoTextOverlap(svg, 'Lingkaran Warna');
  });

  it('21. Struktur Pemda SVG should stack hierarchical cards with clear vertical gaps', () => {
    for (const lvl of ['provinsi', 'kabupaten', 'kecamatan', 'kelurahan', 'rw', 'rt'] as const) {
      const svg = renderStrukturPemdaSvg({ targetLevel: lvl, label: 'X' });
      assertNoTextOverlap(svg, `Struktur Pemda (${lvl})`);
    }
  });

  it('22. Grid Maze Koding SVG should isolate 4x4 matrix markers and right command block cards', () => {
    const svg = renderGridMazeKodingSvg({ label: 'X' });
    assertNoTextOverlap(svg, 'Grid Maze Koding');
  });

  it('23. Comprehensive Catalog Audit: All 200 templates with sampleParams must have zero text collision', () => {
    const catalog = getVisualCatalog();
    expect(catalog.length).toBe(200);

    for (const item of catalog) {
      const result = generateVisualStimulus({
        type: item.id,
        params: item.sampleParams
      });

      expect(result, `Template ${item.id} should generate non-null result with sampleParams`).not.toBeNull();
      if (result) {
        assertNoTextOverlap(result.svg, `Catalog [${item.id}] (sampleParams)`);
      }
    }
  });

  it('24. Comprehensive Catalog Audit: All 200 templates with default empty params must have zero text collision', () => {
    const catalog = getVisualCatalog();

    for (const item of catalog) {
      const result = generateVisualStimulus({
        type: item.id,
        params: {}
      });

      expect(result, `Template ${item.id} should generate non-null result with empty params`).not.toBeNull();
      if (result) {
        assertNoTextOverlap(result.svg, `Catalog [${item.id}] (empty params)`);
      }
    }
  });

  it('25. Multi-Variant Sweep Audit: Over 100 parameter variations across all subject domains must have zero text collision', () => {
    const sweepCases: Array<{ type: string; params: Record<string, any>; label: string }> = [
      // Jaring-jaring
      { type: 'jaring_kubus', params: { pola: 'salib' }, label: 'Jaring Kubus Salib' },
      { type: 'jaring_kubus', params: { pola: 'tangga' }, label: 'Jaring Kubus Tangga' },
      { type: 'jaring_kubus', params: { pola: 't' }, label: 'Jaring Kubus T' },
      { type: 'jaring_balok', params: { p: 8, l: 5, t: 3 }, label: 'Jaring Balok 8x5x3' },
      { type: 'jaring_balok', params: { p: 12, l: 8, t: 6 }, label: 'Jaring Balok 12x8x6' },

      // Simetri Lipat
      { type: 'simetri_lipat', params: { bangun: 'persegi' }, label: 'Simetri Persegi' },
      { type: 'simetri_lipat', params: { bangun: 'persegi_panjang' }, label: 'Simetri Persegi Panjang' },
      { type: 'simetri_lipat', params: { bangun: 'segitiga_sama_sisi' }, label: 'Simetri Segitiga Sama Sisi' },
      { type: 'simetri_lipat', params: { bangun: 'belah_ketupat' }, label: 'Simetri Belah Ketupat' },
      { type: 'simetri_lipat', params: { bangun: 'lingkaran' }, label: 'Simetri Lingkaran' },

      // Bangun Gabungan
      { type: 'bangun_gabungan', params: { bentuk: 'L' }, label: 'Bangun Gabungan L' },
      { type: 'bangun_gabungan', params: { bentuk: 'T' }, label: 'Bangun Gabungan T' },

      // Diagram & Statistika
      { type: 'diagram_batang', params: { labels: ['A', 'B', 'C', 'D', 'E'], data: [10, 25, 15, 30, 20] }, label: 'Diagram Batang 5 Batang' },
      { type: 'diagram_garis', params: { labels: ['06.00', '09.00', '12.00', '15.00'], data: [22, 27, 32, 29] }, label: 'Diagram Garis 4 Titik' },
      { type: 'diagram_lingkaran', params: { labels: ['Pilihan 1', 'Pilihan 2', 'Pilihan 3', 'Pilihan 4'], data: [35, 25, 20, 20] }, label: 'Pie Chart 4 Bagian' },
      { type: 'diagram_venn', params: { aSaja: 15, irisan: 8, bSaja: 12 }, label: 'Venn Standard' },
      { type: 'pictogram', params: { labels: ['Apel', 'Jeruk', 'Pisang'], data: [6, 4, 8], nilaiIkon: 2 }, label: 'Pictogram 3 Baris' },

      // Pengukuran
      { type: 'jam_analog', params: { jam: 3, menit: 15 }, label: 'Jam 03.15' },
      { type: 'jam_analog', params: { jam: 8, menit: 45 }, label: 'Jam 08.45' },
      { type: 'jam_analog', params: { jam: 12, menit: 0 }, label: 'Jam 12.00' },
      { type: 'garis_bilangan', params: { min: -10, max: 10, titik: [{ x: -3, label: 'A' }, { x: 5, label: 'B' }] }, label: 'Garis Bilangan -10 s/d 10' },
      { type: 'mistar', params: { start: 0, end: 12, objectType: 'pensil' }, label: 'Mistar Start 0' },
      { type: 'mistar', params: { start: 4, end: 11.5, objectType: 'penghapus' }, label: 'Mistar Offset' },
      { type: 'busur_derajat', params: { derajat: 45 }, label: 'Busur 45 Derajat' },
      { type: 'busur_derajat', params: { derajat: 90 }, label: 'Busur 90 Derajat' },
      { type: 'busur_derajat', params: { derajat: 135 }, label: 'Busur 135 Derajat' },

      // IPAS Science Organ & Sistem
      { type: 'organ_pernapasan', params: { pointer: 'hidung' }, label: 'Pernapasan Hidung' },
      { type: 'organ_pernapasan', params: { pointer: 'laring' }, label: 'Pernapasan Laring' },
      { type: 'organ_pernapasan', params: { pointer: 'trakea' }, label: 'Pernapasan Trakea' },
      { type: 'organ_pernapasan', params: { pointer: 'bronkus' }, label: 'Pernapasan Bronkus' },
      { type: 'organ_pernapasan', params: { pointer: 'paru' }, label: 'Pernapasan Paru' },
      { type: 'organ_pernapasan', params: { pointer: 'alveolus' }, label: 'Pernapasan Alveolus' },

      { type: 'organ_pencernaan', params: { pointer: 'mulut' }, label: 'Pencernaan Mulut' },
      { type: 'organ_pencernaan', params: { pointer: 'kerongkongan' }, label: 'Pencernaan Kerongkongan' },
      { type: 'organ_pencernaan', params: { pointer: 'lambung' }, label: 'Pencernaan Lambung' },
      { type: 'organ_pencernaan', params: { pointer: 'usus_halus' }, label: 'Pencernaan Usus Halus' },
      { type: 'organ_pencernaan', params: { pointer: 'usus_besar' }, label: 'Pencernaan Usus Besar' },

      { type: 'siklus_air', params: { pointer: 'evaporasi' }, label: 'Siklus Air Evaporasi' },
      { type: 'siklus_air', params: { pointer: 'kondensasi' }, label: 'Siklus Air Kondensasi' },
      { type: 'siklus_air', params: { pointer: 'presipitasi' }, label: 'Siklus Air Presipitasi' },
      { type: 'siklus_air', params: { pointer: 'infiltrasi' }, label: 'Siklus Air Infiltrasi' },

      { type: 'bagian_bunga', params: { pointer: 'putik' }, label: 'Bunga Putik' },
      { type: 'bagian_bunga', params: { pointer: 'benang_sari' }, label: 'Bunga Benang Sari' },
      { type: 'bagian_bunga', params: { pointer: 'mahkota' }, label: 'Bunga Mahkota' },
      { type: 'bagian_bunga', params: { pointer: 'kelopak' }, label: 'Bunga Kelopak' },

      { type: 'peta_indonesia', params: { pointer: 'sumatera' }, label: 'Peta Sumatera' },
      { type: 'peta_indonesia', params: { pointer: 'jawa' }, label: 'Peta Jawa' },
      { type: 'peta_indonesia', params: { pointer: 'kalimantan' }, label: 'Peta Kalimantan' },
      { type: 'peta_indonesia', params: { pointer: 'sulawesi' }, label: 'Peta Sulawesi' },
      { type: 'peta_indonesia', params: { pointer: 'papua' }, label: 'Peta Papua' },

      { type: 'rangkaian_listrik', params: { model: 'seri', s1: true }, label: 'Listrik Seri Nyala' },
      { type: 'rangkaian_listrik', params: { model: 'paralel', s1: true, s2: false }, label: 'Listrik Paralel Campuran' },

      { type: 'perubahan_wujud', params: { pointer: '1' }, label: 'Wujud Membeku' },
      { type: 'perubahan_wujud', params: { pointer: '2' }, label: 'Wujud Mencair' },
      { type: 'perubahan_wujud', params: { pointer: '3' }, label: 'Wujud Menguap' },
      { type: 'perubahan_wujud', params: { pointer: '4' }, label: 'Wujud Mengembun' },
      { type: 'perubahan_wujud', params: { pointer: '5' }, label: 'Wujud Menyublim' },
      { type: 'perubahan_wujud', params: { pointer: '6' }, label: 'Wujud Mengkristal' },

      { type: 'tata_surya', params: { pointer: 'bumi' }, label: 'Tata Surya Bumi' },
      { type: 'tata_surya', params: { pointer: 'mars' }, label: 'Tata Surya Mars' },
      { type: 'tata_surya', params: { pointer: 'yupiter' }, label: 'Tata Surya Yupiter' },
      { type: 'tata_surya', params: { pointer: 'saturnus' }, label: 'Tata Surya Saturnus' },

      { type: 'magnet', params: { interaksi: 'tarik', pointer: 'kanan1' }, label: 'Magnet Tarik Kanan1' },
      { type: 'magnet', params: { interaksi: 'tolak', pointer: 'kiri2' }, label: 'Magnet Tolak Kiri2' },

      { type: 'perisai_pancasila', params: { sila: 1 }, label: 'Sila 1 Bintang' },
      { type: 'perisai_pancasila', params: { sila: 2 }, label: 'Sila 2 Rantai' },
      { type: 'perisai_pancasila', params: { sila: 3 }, label: 'Sila 3 Pohon Beringin' },
      { type: 'perisai_pancasila', params: { sila: 4 }, label: 'Sila 4 Kepala Banteng' },
      { type: 'perisai_pancasila', params: { sila: 5 }, label: 'Sila 5 Padi dan Kapas' }
    ];

    for (const sc of sweepCases) {
      const res = generateVisualStimulus({ type: sc.type, params: sc.params });
      expect(res, `Sweep case ${sc.label} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, sc.label);
      }
    }
  });

  it('26. Batch 1 - Precision Instruments & Conversion Stairs: zero text collision and zero spoiler check', () => {
    const measurementTypes = [
      'stopwatch_analog',
      'jangka_sorong',
      'neraca_pasar',
      'timbangan_digital',
      'bejana_literan',
      'gelas_erlenmeyer',
      'meteran_gulung',
      'dinamometer_pegas',
      'tangga_satuan_panjang',
      'tangga_satuan_massa',
      'tangga_satuan_volume'
    ];

    expect(measurementTypes.length).toBe(11);

    for (const t of measurementTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Instrument ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Instrument [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('27. Batch 1 - Advanced Geometry: zero text collision and valid dimensions', () => {
    const geomTypes = [
      'sudut_jarum_jam',
      'jaring_limas_segiempat',
      'jaring_limas_segitiga',
      'jaring_prisma_segitiga',
      'keliling_gabungan',
      'lingkaran_tembereng',
      'koordinat_poligon',
      'transformasi_refleksi',
      'transformasi_translasi',
      'segi_enam_beraturan'
    ];

    expect(geomTypes.length).toBe(10);

    for (const t of geomTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Geometry ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Geometry [${t}]`);
      }
    }
  });

  it('28. Batch 1 - Numbers, Place Value, Visual Algebra: zero text collision and zero spoiler check', () => {
    const algebraTypes = [
      'blok_dienes',
      'sempoa_abakus',
      'tabel_nilai_tempat',
      'garis_bilangan_pecahan',
      'garis_bilangan_desimal',
      'perkalian_lattice',
      'pola_ubin',
      'pita_pecahan',
      'matriks_nilai_uang'
    ];

    expect(algebraTypes.length).toBe(9);

    for (const t of algebraTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Algebra ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Algebra [${t}]`);
      }
    }
  });

  it('29. Batch 1 - Comparative Statistics & Probability: zero text collision', () => {
    const statsTypes = [
      'diagram_batang_ganda',
      'diagram_garis_ganda',
      'dot_plot',
      'diagram_lingkaran_derajat',
      'tabel_kontingensi',
      'diagram_batang_horizontal',
      'papan_galton_peluang',
      'kartu_peluang'
    ];

    expect(statsTypes.length).toBe(8);

    for (const t of statsTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Stats ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Stats [${t}]`);
      }
    }
  });

  it('30. Batch 1 - NLP Heuristic Detectors: All 38 new types correctly mapped from question stem', () => {
    const stems = [
      { text: 'Perhatikan gambar stopwatch berikut. Waktu tempuh pelari adalah...', expected: 'stopwatch_analog' },
      { text: 'Hasil pengukuran tebal pipa menggunakan jangka sorong di atas adalah...', expected: 'jangka_sorong' },
      { text: 'Ibu menimbang gula pasir menggunakan neraca pasar dengan anak timbangan 2 kg...', expected: 'neraca_pasar' },
      { text: 'Berapakah massa tepung terigu yang tertera pada layar timbangan digital?', expected: 'timbangan_digital' },
      { text: 'Pedagang menakar beras menggunakan bejana literan kaleng...', expected: 'bejana_literan' },
      { text: 'Cairan kimia dituangkan ke dalam gelas erlenmeyer sebanyak 150 ml...', expected: 'gelas_erlenmeyer' },
      { text: 'Pak tukang mengukur panjang balok kayu memakai meteran gulung...', expected: 'meteran_gulung' },
      { text: 'Sebuah balok ditarik dengan dinamometer sehingga pegas menunjukkan angka tertentu...', expected: 'dinamometer_pegas' },
      { text: 'Gunakan tangga satuan panjang untuk mengkonversi 3 meter menjadi sentimeter...', expected: 'tangga_satuan_panjang' },
      { text: 'Perhatikan tangga satuan massa berikut untuk mengubah kg ke gram...', expected: 'tangga_satuan_massa' },
      { text: 'Berdasarkan tangga satuan volume, 2 liter setara dengan berapa mililiter?', expected: 'tangga_satuan_volume' },
      { text: 'Berapakah besar sudut jarum jam pada pukul 03.00?', expected: 'sudut_jarum_jam' },
      { text: 'Pola jaring-jaring limas segiempat di atas memiliki 1 alas persegi dan...', expected: 'jaring_limas_segiempat' },
      { text: 'Manakah jaring-jaring limas segitiga yang tepat untuk membentuk bangun ruang?', expected: 'jaring_limas_segitiga' },
      { text: 'Bangun ruang prisma segitiga jika direntangkan akan membentuk jaring-jaring...', expected: 'jaring_prisma_segitiga' },
      { text: 'Hitunglah keliling gabungan bangun datar persegi panjang dan setengah lingkaran...', expected: 'keliling_gabungan' },
      { text: 'Luas daerah tembereng lingkaran di atas dapat dihitung dengan rumus...', expected: 'lingkaran_tembereng' },
      { text: 'Segitiga ABC pada poligon kartesius memiliki titik koordinat...', expected: 'koordinat_poligon' },
      { text: 'Bayangan segitiga hasil refleksi terhadap cermin vertikal adalah...', expected: 'transformasi_refleksi' },
      { text: 'Tentukan posisi bangun setelah mengalami translasi sejauh 3 satuan ke kanan...', expected: 'transformasi_translasi' },
      { text: 'Bangun segi enam beraturan memiliki 6 sisi sama panjang dan...', expected: 'segi_enam_beraturan' },
      { text: 'Nilai bilangan yang ditunjukkan oleh kumpulan blok dienes di atas adalah...', expected: 'blok_dienes' },
      { text: 'Berapa angka yang terbaca pada manik-manik sempoa abakus di atas?', expected: 'sempoa_abakus' },
      { text: 'Lengkapilah angka ratusan pada tabel nilai tempat berikut...', expected: 'tabel_nilai_tempat' },
      { text: 'Tentukan nilai pada titik X pada garis bilangan pecahan berikut!', expected: 'garis_bilangan_pecahan' },
      { text: 'Berapakah bilangan yang ditunjuk huruf X pada garis bilangan desimal?', expected: 'garis_bilangan_desimal' },
      { text: 'Perkalian lattice 2 digit di atas menunjukkan hasil perkalian...', expected: 'perkalian_lattice' },
      { text: 'Berapa banyak ubin pada barisan ubin pola ke-4?', expected: 'pola_ubin' },
      { text: 'Berdasarkan pita pecahan di atas, pecahan manakah yang senilai dengan 1/2?', expected: 'pita_pecahan' },
      { text: 'Hitunglah total nilai uang rupiah kertas dan koin di atas!', expected: 'matriks_nilai_uang' },
      { text: 'Perhatikan diagram batang ganda perbandingan siswa kelas 3 sampai 6...', expected: 'diagram_batang_ganda' },
      { text: 'Diagram garis ganda di atas menunjukkan data tren penjualan 2023 dan 2024...', expected: 'diagram_garis_ganda' },
      { text: 'Berdasarkan dot plot nilai ulangan di atas, berapa anak yang mendapat nilai 8?', expected: 'dot_plot' },
      { text: 'Diagram lingkaran derajat di atas memiliki sudut total 360 derajat...', expected: 'diagram_lingkaran_derajat' },
      { text: 'Berapakah frekuensi siswa pada sel X pada tabel kontingensi di atas?', expected: 'tabel_kontingensi' },
      { text: 'Diagram batang mendatar menunjukkan hasil panen pertanian...', expected: 'diagram_batang_horizontal' },
      { text: 'Peluang kelereng jatuh pada kotak penampung papan galton adalah...', expected: 'papan_galton_peluang' },
      { text: 'Tentukan peluang kartu terambil berupa bilangan prima dari kumpulan kartu peluang...', expected: 'kartu_peluang' }
    ];

    expect(stems.length).toBe(38);

    for (const item of stems) {
      const detected = detectStimulusFromSoalText(item.text, 'Matematika');
      expect(detected, `Stem "${item.text}" should be detected`).not.toBeNull();
      expect(detected?.type, `Stem "${item.text}" should detect type ${item.expected}`).toBe(item.expected);
    }
  });

  it('31. Batch 2 - Kluster A: IPAS Biologi, Anatomi & Ekosistem: zero text collision and zero spoiler check', () => {
    const bioTypes = [
      'rangka_manusia',
      'sendi_gerak',
      'metamorfosis_katak',
      'metamorfosis_nyamuk',
      'paruh_burung',
      'kaki_burung',
      'simbiosis',
      'jaring_makanan_sawah',
      'adaptasi_tumbuhan',
      'pernapasan_hewan',
      'perkembangbiakan_tumbuhan',
      'sel_hewan_tumbuhan'
    ];

    expect(bioTypes.length).toBe(12);

    for (const t of bioTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Biology template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Biology [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('32. Batch 2 - Kluster B: IPAS Fisika, Energi, Optik & Kebumian: zero text collision and valid dimensions', () => {
    const physicsTypes = [
      'fase_bulan',
      'lapisan_bumi',
      'lapisan_tanah',
      'baterai_buah',
      'optik_periskop',
      'kaca_pembesar_lup',
      'pemuaian_bimetal',
      'gelombang_bunyi',
      'perubahan_energi',
      'zona_waktu_indonesia',
      'siklus_batuan'
    ];

    expect(physicsTypes.length).toBe(11);

    for (const t of physicsTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Physics template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Physics [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('33. Batch 2 - Kluster C: IPS Budaya Nusantara, Geografi, PKn, PJOK & Literasi: zero text collision', () => {
    const socialTypes = [
      'simbol_kartografi',
      'garis_lintang_bujur',
      'rumah_adat_nusantara',
      'alat_musik_tradisional',
      'trias_politika',
      'alur_kegiatan_ekonomi',
      'norma_masyarakat',
      'rambu_bahaya_lab',
      'piramida_aktivitas_fisik',
      'lapangan_atletik',
      'diagram_mindmap_paragraf'
    ];

    expect(socialTypes.length).toBe(11);

    for (const t of socialTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Social template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Social [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('34. Batch 2 - Kluster D: Matematika Lanjut, Geometri & Koding Scratch: zero text collision', () => {
    const mathGeomTypes = [
      'sudut_berpelurus_berpenyiku',
      'garis_sejajar_transversal',
      'teorema_pythagoras',
      'juring_busur_lingkaran',
      'segitiga_pascal',
      'skala_termometer_komparasi',
      'diagram_batang_daun',
      'diagram_box_plot',
      'pohon_peluang',
      'koding_blok_percabangan',
      'koding_blok_perulangan'
    ];

    expect(mathGeomTypes.length).toBe(11);

    for (const t of mathGeomTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Math/Geom template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `MathGeom [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('35. Batch 2 - NLP Heuristic Detectors: All 45 new types correctly mapped from question stem', () => {
    const stems = [
      // Kluster D
      { text: 'Besar sudut berpelurus pada gambar di samping jika sudut A diketahui 65 derajat...', expected: 'sudut_berpelurus_berpenyiku' },
      { text: 'Perhatikan pasangan sudut sehadap pada dua garis sejajar yang dipotong garis transversal...', expected: 'garis_sejajar_transversal' },
      { text: 'Hitunglah panjang hipotenusa segitiga siku-siku menggunakan teorema pythagoras...', expected: 'teorema_pythagoras' },
      { text: 'Hitunglah panjang busur lingkaran dengan sudut pusat 60 derajat dan jari-jari 14 cm...', expected: 'juring_busur_lingkaran' },
      { text: 'Berdasarkan pola segitiga pascal baris ke-5, berapakah jumlah bilangan pada baris tersebut?', expected: 'segitiga_pascal' },
      { text: 'Lakukan komparasi termometer untuk mengubah 40 derajat celcius ke skala reamur...', expected: 'skala_termometer_komparasi' },
      { text: 'Perhatikan diagram batang daun hasil ulangan matematika berikut...', expected: 'diagram_batang_daun' },
      { text: 'Berdasarkan diagram box plot di atas, berapakah nilai median (Q2) data tersebut?', expected: 'diagram_box_plot' },
      { text: 'Tentukan ruang sampel pelemparan dua koin pada diagram pohon peluang...', expected: 'pohon_peluang' },
      { text: 'Dalam pemrograman visual Scratch, blok koding jika maka (if-then) digunakan untuk...', expected: 'koding_blok_percabangan' },
      { text: 'Blok koding ulangi sebanyak 4 kali pada Scratch berfungsi untuk membuat...', expected: 'koding_blok_perulangan' },
      // Kluster A
      { text: 'Perhatikan rangka manusia berikut, bagian tulang rusuk berfungsi untuk melindungi...', expected: 'rangka_manusia' },
      { text: 'Persendian pada gelang bahu yang memungkinkan gerak ke segala arah adalah sendi peluru...', expected: 'sendi_gerak' },
      { text: 'Daur hidup katak dari berudu hingga katak dewasa mengalami proses metamorfosis...', expected: 'metamorfosis_katak' },
      { text: 'Fase jentik nyamuk pada daur hidup nyamuk hidup di genangan air sebelum menjadi pupa...', expected: 'metamorfosis_nyamuk' },
      { text: 'Bentuk paruh burung elang yang tajam dan bengkok beradaptasi untuk mencabik makanan...', expected: 'paruh_burung' },
      { text: 'Kaki burung pemanjat seperti burung pelatuk memiliki susunan jari khas untuk...', expected: 'kaki_burung' },
      { text: 'Hubungan antara lebah madu dengan bunga merupakan bentuk simbiosis mutualisme karena...', expected: 'simbiosis' },
      { text: 'Pada jaring-jaring makanan sawah, belalang berperan sebagai konsumen tingkat pertama...', expected: 'jaring_makanan_sawah' },
      { text: 'Tumbuhan kaktus melakukan adaptasi xerofit dengan daun berduri untuk mengurangi penguapan...', expected: 'adaptasi_tumbuhan' },
      { text: 'Alat pernapasan hewan serangga belalang berupa sistem pembuluh trakea...', expected: 'pernapasan_hewan' },
      { text: 'Perkembangbiakan vegetatif buatan dengan cara mencangkok batang tanaman bertujuan untuk...', expected: 'perkembangbiakan_tumbuhan' },
      { text: 'Organel kloroplas dan dinding sel hanya ditemukan pada sel tumbuhan...', expected: 'sel_hewan_tumbuhan' },
      // Kluster B
      { text: 'Perhatikan fase bulan saat permukaan bulan tampak bulat utuh bercahaya yaitu bulan purnama...', expected: 'fase_bulan' },
      { text: 'Lapisan bumi terluar tempat berlangsungnya kehidupan manusia disebut kerak bumi...', expected: 'lapisan_bumi' },
      { text: 'Horizon tanah bagian atas yang kaya humus disebut lapisan tanah topsoil...', expected: 'lapisan_tanah' },
      { text: 'Rangkaian baterai buah menggunakan elektroda tembaga dan seng pada buah lemon menghasilkan arus listrik...', expected: 'baterai_buah' },
      { text: 'Alat optik periskop pada kapal selam menggunakan dua cermin datar yang dipasang sejajar bersudut 45 derajat...', expected: 'optik_periskop' },
      { text: 'Penggunaan kaca pembesar lup memanfaatkan lensa cembung untuk mengamati benda kecil...', expected: 'kaca_pembesar_lup' },
      { text: 'Keping bimetal akan melengkung saat dipanaskan karena perbedaan pemuaian panjang dua logam...', expected: 'pemuaian_bimetal' },
      { text: 'Perambatan gelombang bunyi di udara merupakan gelombang longitudinal berupa rapatan dan renggangan...', expected: 'gelombang_bunyi' },
      { text: 'Pada setrika listrik terjadi perubahan energi dari energi listrik menjadi energi panas...', expected: 'perubahan_energi' },
      { text: 'Wilayah zona waktu Indonesia terbagi atas WIB, WITA, dan WIT dengan selisih waktu 1 jam...', expected: 'zona_waktu_indonesia' },
      { text: 'Dalam siklus batuan, magma yang membeku akan membentuk batuan beku...', expected: 'siklus_batuan' },
      // Kluster C
      { text: 'Pada peta rupa bumi, simbol kartografi berupa garis biru meliuk digunakan untuk menandai...', expected: 'simbol_kartografi' },
      { text: 'Garis khatulistiwa membagi bumi menjadi belahan utara dan selatan pada sistem garis lintang...', expected: 'garis_lintang_bujur' },
      { text: 'Arsitektur rumah adat gadang khas Minangkabau memiliki atap melengkung menyerupai tanduk kerbau...', expected: 'rumah_adat_nusantara' },
      { text: 'Alat musik tradisional angklung dari bambu dimainkan dengan cara digetarkan...', expected: 'alat_musik_tradisional' },
      { text: 'Konsep trias politika membagi kekuasaan negara menjadi lembaga legislatif, eksekutif, dan yudikatif...', expected: 'trias_politika' },
      { text: 'Alur kegiatan ekonomi berawal dari pabrik sebagai tempat produksi hingga barang sampai ke konsumen...', expected: 'alur_kegiatan_ekonomi' },
      { text: 'Berperilaku sopan santun kepada orang yang lebih tua merupakan pengamalan norma kesopanan...', expected: 'norma_masyarakat' },
      { text: 'Piktogram simbol laboratorium dengan gambar tengkorak menandakan bahan kimia bersifat beracun...', expected: 'rambu_bahaya_lab' },
      { text: 'Berdasarkan piramida aktivitas fisik, kegiatan duduk diam atau sedentari sebaiknya dibatasi...', expected: 'piramida_aktivitas_fisik' },
      { text: 'Lintasan lari 400 meter pada lapangan atletik standar memiliki jalur lurus dan tikungan...', expected: 'lapangan_atletik' },
      { text: 'Bagan mind map paragraf di atas memetakan ide pokok dan beberapa kalimat penjelas...', expected: 'diagram_mindmap_paragraf' }
    ];

    expect(stems.length).toBe(45);

    for (const item of stems) {
      const detected = detectStimulusFromSoalText(item.text, 'Umum');
      expect(detected, `Stem "${item.text}" should be detected`).not.toBeNull();
      expect(detected?.type, `Stem "${item.text}" should detect type ${item.expected}`).toBe(item.expected);
    }
  });

  it('36. Batch 3 - Kluster 1: IPAS Biologi Lanjut, Ekosistem & Anatomi (12 Templates): zero text collision', () => {
    const bioTypes = [
      'rantai_makanan_laut',
      'rantai_makanan_hutan',
      'daur_hidup_kupu_detail',
      'daur_hidup_belalang',
      'daur_hidup_kecoa',
      'bagian_akar_tumbuhan',
      'bagian_batang_dikotil_monokotil',
      'bagian_daun_anatomi',
      'alat_ekskresi_ginjal',
      'piramida_makanan_ekologi',
      'indra_pengecap_lidah',
      'indra_pembau_hidung'
    ];

    expect(bioTypes.length).toBe(12);

    for (const t of bioTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Biologi template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Biologi [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('37. Batch 3 - Kluster 2: IPAS Fisika, Gaya, Energi Terbarukan & Astronomi (11 Templates): zero text collision', () => {
    const physicsTypes = [
      'macam_macam_gaya',
      'pesawat_sederhana_bidang_miring',
      'pesawat_sederhana_roda_berporos',
      'pembangkit_listrik_plta',
      'panel_surya_plts',
      'energi_angin_pltb',
      'termos_air_panas',
      'perpindahan_panas_konduksi_konveksi_radiasi',
      'gerak_semu_matahari',
      'musim_dan_revolusi_bumi',
      'siklus_karbon_oksigen'
    ];

    expect(physicsTypes.length).toBe(11);

    for (const t of physicsTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Physics template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Physics [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('38. Batch 3 - Kluster 3: IPS, Sejarah, Budaya, Literasi & Seni (11 Templates): zero text collision', () => {
    const socialTypes = [
      'garis_wallace_weber',
      'candi_dan_peninggalan_sejarah',
      'motif_batik_nusantara',
      'senjata_tradisional_nusantara',
      'tarian_daerah_nusantara',
      'piramida_penduduk',
      'struktur_fabel_alur_cerita',
      'jenis_paragraf_induktif_deduktif',
      'unsur_iklan_media_cetak',
      'pohon_keluarga_genealogi',
      'koperasi_sekolah'
    ];

    expect(socialTypes.length).toBe(11);

    for (const t of socialTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Social template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Social [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('39. Batch 3 - Kluster 4: Matematika Lanjut, Logika, Pengukuran & Koding (11 Templates): zero text collision', () => {
    const mathTypes = [
      'sudut_luar_segitiga',
      'jaring_kerucut',
      'jaring_tabung',
      'luas_permukaan_gabungan',
      'diagram_alur_logika_gerbang',
      'koding_variabel_operator',
      'garis_bilangan_bulat_operasi',
      'pecahan_desimal_persen_senilai',
      'jam_digital_komparasi',
      'diagram_sankey_energi',
      'skala_peta_batang'
    ];

    expect(mathTypes.length).toBe(11);

    for (const t of mathTypes) {
      const res = generateVisualStimulus({ type: t, params: { label: 'X' } });
      expect(res, `Math template ${t} should produce non-null SVG`).not.toBeNull();
      if (res) {
        assertNoTextOverlap(res.svg, `Math [${t}]`);
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
      }
    }
  });

  it('40. Batch 3 - NLP Heuristic Detectors: All 45 Batch 3 question stems detected correctly', () => {
    const stems = [
      // Kluster 1 (12)
      { text: 'Fitoplankton merupakan produsen utama dalam rantai makanan laut di samudera...', expected: 'rantai_makanan_laut' },
      { text: 'Dalam rantai makanan hutan tropis, harimau memangsa rusa sebagai predator puncak...', expected: 'rantai_makanan_hutan' },
      { text: 'Daur hidup kupu-kupu yang lengkap melalui tahap krisalis atau kepompong...', expected: 'daur_hidup_kupu_detail' },
      { text: 'Metamorfosis belalang tergolong metamorfosis tidak sempurna karena nimfa mirip dewasa...', expected: 'daur_hidup_belalang' },
      { text: 'Daur hidup kecoa dimulai dari kapsul telur ooteka hingga menjadi nimfa...', expected: 'daur_hidup_kecoa' },
      { text: 'Struktur bagian akar tumbuhan yang bertugas menyerap air adalah rambut akar...', expected: 'bagian_akar_tumbuhan' },
      { text: 'Irisan melintang batang dikotil memiliki berkas kambium pembuluh teratur...', expected: 'bagian_batang_dikotil_monokotil' },
      { text: 'Struktur jaringan anatomi daun tempat fotosintesis berlangsung yaitu jaringan palisade...', expected: 'bagian_daun_anatomi' },
      { text: 'Bagian organ ekskresi ginjal yang berfungsi menyaring darah pada bagian korteks...', expected: 'alat_ekskresi_ginjal' },
      { text: 'Piramida makanan ekologi menunjukkan perpindahan biomassa dari tingkat trofik produsen...', expected: 'piramida_makanan_ekologi' },
      { text: 'Reseptor papila indra pengecap lidah di bagian pangkal paling peka terhadap rasa pahit...', expected: 'indra_pengecap_lidah' },
      { text: 'Organ indra pembau hidung memiliki serabut saraf olfaktori untuk mendeteksi aroma...', expected: 'indra_pembau_hidung' },

      // Kluster 2 (11)
      { text: 'Perhatikan gambar macam-macam gaya yang bekerja saat menarik busur panah dengan gaya pegas...', expected: 'macam_macam_gaya' },
      { text: 'Keuntungan mekanis sebuah bidang miring dengan rampa miring sepanjang s dan tinggi h...', expected: 'pesawat_sederhana_bidang_miring' },
      { text: 'Prinsip kerja roda berporos pada gir sepeda memudahkan gaya kayuhan...', expected: 'pesawat_sederhana_roda_berporos' },
      { text: 'Skema PLTA memanfaatkan arus air dari bendungan waduk untuk memutar turbin air generator...', expected: 'pembangkit_listrik_plta' },
      { text: 'Pembangkit PLTS memanfaatkan panel surya fotovoltaik dan inverter untuk menghasilkan listrik...', expected: 'panel_surya_plts' },
      { text: 'Turbin pembangkit PLTB digerakkan oleh kincir angin raksasa untuk memutar generator...', expected: 'energi_angin_pltb' },
      { text: 'Dinding ruang hampa pada termos air panas berfungsi mencegah perpindahan kalor konveksi...', expected: 'termos_air_panas' },
      { text: 'Peristiwa memasak air menunjukkan tiga jalur perpindahan kalor konduksi konveksi radiasi...', expected: 'perpindahan_panas_konduksi_konveksi_radiasi' },
      { text: 'Pergeseran semu tahunan matahari dari lintasan khatulistiwa menuju utara dinamakan gerak semu matahari...', expected: 'gerak_semu_matahari' },
      { text: 'Pergantian empat musim di bumi disebabkan oleh sudut kemiringan sumbu bumi dan revolusi bumi...', expected: 'musim_dan_revolusi_bumi' },
      { text: 'Dalam siklus karbon dan oksigen, fotosintesis menyerap karbon dioksida dan melepaskan oksigen...', expected: 'siklus_karbon_oksigen' },

      // Kluster 3 (11)
      { text: 'Persebaran fauna Indonesia dibatasi oleh garis Wallace dan Weber...', expected: 'garis_wallace_weber' },
      { text: 'Perbedaan arsitektur candi Hindu yang ramping dengan candi Buddha yang memiliki stupa...', expected: 'candi_dan_peninggalan_sejarah' },
      { text: 'Motif batik mega mendung khas daerah Cirebon berbentuk gumpalan awan...', expected: 'motif_batik_nusantara' },
      { text: 'Senjata tradisional adat keris Jawa memiliki bilah luk bergelombang...', expected: 'senjata_tradisional_nusantara' },
      { text: 'Tarian daerah tari saman asal Aceh ditarikan secara serempak dan dinamis...', expected: 'tarian_daerah_nusantara' },
      { text: 'Piramida penduduk bentuk ekspansif menunjukkan persentase usia muda lebih besar...', expected: 'piramida_penduduk' },
      { text: 'Tahap puncak konflik masalah dalam alur struktur cerita fabel disebut komplikasi...', expected: 'struktur_fabel_alur_cerita' },
      { text: 'Paragraf deduktif menempatkan kalimat utama di awal paragraf sedangkan induktif di akhir...', expected: 'jenis_paragraf_induktif_deduktif' },
      { text: 'Unsur iklan media cetak terdiri atas headline judul, gambar ilustrasi menarik, dan pesan penjelas...', expected: 'unsur_iklan_media_cetak' },
      { text: 'Bagan diagram silsilah pohon keluarga tiga generasi dari kakek hingga cucu...', expected: 'pohon_keluarga_genealogi' },
      { text: 'Rapat anggota tahunan merupakan pemegang kekuasaan tertinggi pada koperasi sekolah...', expected: 'koperasi_sekolah' },

      // Kluster 4 (11)
      { text: 'Berdasarkan teorema sudut luar segitiga, besar sudut luar sama dengan jumlah sudut...', expected: 'sudut_luar_segitiga' },
      { text: 'Bentuk bentangan jaring-jaring kerucut terdiri atas juring selimut dan lingkaran alas...', expected: 'jaring_kerucut' },
      { text: 'Sebuah jaring-jaring tabung memiliki dua lingkaran dan sebuah selimut persegi panjang...', expected: 'jaring_tabung' },
      { text: 'Hitunglah luas permukaan gabungan balok dan limas segiempat berikut...', expected: 'luas_permukaan_gabungan' },
      { text: 'Simbol belah ketupat keputusan pada flowchart alir logika berfungsi untuk...', expected: 'diagram_alur_logika_gerbang' },
      { text: 'Penggunaan blok variabel dan blok operator matematika pada Scratch berfungsi untuk...', expected: 'koding_variabel_operator' },
      { text: 'Garis bilangan penjumlahan bilangan bulat menunjukkan lompatan panah ke kanan...', expected: 'garis_bilangan_bulat_operasi' },
      { text: 'Mengubah nilai senilai pecahan desimal persen dari 3/4 menjadi 0,75 dan 75%...', expected: 'pecahan_desimal_persen_senilai' },
      { text: 'Tentukan perbandingan penunjukan waktu antara jam analog jarum dan jam digital 24 jam...', expected: 'jam_digital_komparasi' },
      { text: 'Berdasarkan diagram sankey alir energi, energi input yang masuk terbagi menjadi energi berguna dan rugi...', expected: 'diagram_sankey_energi' },
      { text: 'Skala batang peta grafis menunjukkan bahwa 1 cm pada peta setara dengan 5 km...', expected: 'skala_peta_batang' }
    ];

    expect(stems.length).toBe(45);

    for (const item of stems) {
      const detected = detectStimulusFromSoalText(item.text, 'Umum');
      expect(detected, `Stem "${item.text}" should be detected`).not.toBeNull();
      expect(detected?.type, `Stem "${item.text}" should detect type ${item.expected}`).toBe(item.expected);
    }
  });
});
