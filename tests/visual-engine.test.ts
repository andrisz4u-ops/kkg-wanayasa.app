import { describe, it, expect } from 'vitest';
import {
  renderBalokSvg,
  renderKubusSvg,
  renderTabungSvg,
  renderKerucutSvg,
  renderSegitigaSikuSvg,
  renderSudutSvg,
  renderPecahanLingkaranSvg,
  renderPecahanPersegiSvg,
  renderDiagramBatangSvg,
  renderDiagramGarisSvg,
  renderOrganPernapasanSvg,
  renderSiklusAirSvg,
  renderMetamorfosisSvg,
  renderBagianBungaSvg,
  renderJamAnalogSvg,
  renderGarisBilanganSvg,
  renderBolaSvg,
  renderPrismaSvg,
  renderLimasSvg,
  renderLingkaranSvg,
  renderTrapesiumSvg,
  renderJajarGenjangSvg,
  renderBelahKetupatSvg,
  renderLayangLayangSvg,
  renderPersegiPanjangSvg,
  renderSegitigaSamaSisiSvg,
  renderSegitigaSamaKakiSvg,
  renderJaringKubusSvg,
  renderJaringBalokSvg,
  renderKoordinatKartesiusSvg,
  renderDiagramVennSvg,
  renderPictogramSvg,
  renderSimetriLipatSvg,
  renderBangunGabunganSvg,
  renderDiagramLingkaranSvg,
  renderOrganPencernaanSvg,
  renderViliUsusSvg,
  renderStrukturGigiSvg,
  renderLambungDetailSvg,
  renderAlveolusSvg,
  renderRantaiMakananSvg,
  renderPetaIndonesiaSvg,
  renderRangkaianListrikSvg,
  renderPerubahanWujudSvg,
  renderMistarSvg,
  renderTataSuryaSvg,
  renderPerisaiPancasilaSvg,
  renderMagnetSvg,
  renderSifatCahayaSvg,
  renderBusurDerajatSvg,
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
  renderSudutLuarSegitigaSvg,
  renderJaringKerucutSvg,
  renderJaringTabungSvg,
  renderLuasPermukaanGabunganSvg,
  svgCanvas,
  svgHeader,
  svgTargetBadge,
  svgBottomPrompt,
  svgDimensionLine,
  svgGroundShadow,
  svgCommonDefs,
  generateVisualStimulus,
  detectStimulusFromSoalText,
  getVisualCatalog,
  VISUAL_RENDERER_REGISTRY,
  isKnownVisualType,
  getRegisteredVisualTypes,
  DETECTION_RULES
} from '../src/lib/visual-engine';
import { safeNum, minifySvg } from '../src/lib/visuals/types';
import { buildStimulusSignature } from '../src/routes/kisi';

describe('Examplate Visual Stimulus Engine Tests', () => {
  describe('Geometric 3D & 2D SVG Renderers', () => {
    it('should render a valid 3D Balok SVG with exact dimensions', () => {
      const svg = renderBalokSvg({ p: 15, l: 10, t: 8, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('p = 15 cm');
      expect(svg).toContain('l = 10 cm');
      expect(svg).toContain('t = 8 cm');
      expect(svg).toContain('stroke-dasharray="4,4"'); // rusuk putus-putus
    });

    it('should render a valid 3D Kubus SVG with side s', () => {
      const svg = renderKubusSvg({ s: 12, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('s = 12 cm');
    });

    it('should render a valid Tabung and Kerucut SVG', () => {
      const tabung = renderTabungSvg({ r: 7, t: 20 });
      expect(tabung).toContain('r = 7 cm');
      expect(tabung).toContain('t = 20 cm');

      const kerucut = renderKerucutSvg({ r: 5, t: 12, s: 13 });
      expect(kerucut).toContain('r = 5 cm');
      expect(kerucut).toContain('t = 12 cm');
      expect(kerucut).toContain('s = 13 cm');
    });

    it('should render a right triangle and angle SVG', () => {
      const tri = renderSegitigaSikuSvg({ alas: 6, tinggi: 8, miring: 10 });
      expect(tri).toContain('a = 6 cm');
      expect(tri).toContain('t = 8 cm');
      expect(tri).toContain('c = 10 cm');

      const angle = renderSudutSvg({ derajat: 45 });
      expect(angle).toContain('45°');
    });
  });

  describe('New 3D Shapes (Bola, Prisma, Limas)', () => {
    it('should render Bola 3D with radius and gradient', () => {
      const svg = renderBolaSvg({ r: 14, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('r = 14 cm');
      expect(svg).toContain('radialGradient');
      expect(svg).toContain('Bola');
    });

    it('should render Bola from diameter', () => {
      const svg = renderBolaSvg({ d: 28 });
      expect(svg).toContain('r = 14 cm');
    });

    it('should render Prisma Segitiga 3D isometrik', () => {
      const svg = renderPrismaSvg({ alas: 10, tinggiSegitiga: 8, panjang: 15, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('alas = 10 cm');
      expect(svg).toContain('t = 8 cm');
      expect(svg).toContain('p = 15 cm');
      expect(svg).toContain('stroke-dasharray="4,4"');
    });

    it('should render Limas Segiempat 3D', () => {
      const svg = renderLimasSvg({ s: 8, t: 15, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('s = 8 cm');
      expect(svg).toContain('t = 15 cm');
      expect(svg).toContain('stroke-dasharray');
    });
  });

  describe('2D Shapes (Lingkaran, Trapesium, etc)', () => {
    it('should render Lingkaran with radius and diameter', () => {
      const svg = renderLingkaranSvg({ r: 10, unit: 'cm' });
      expect(svg).toContain('r = 10 cm');
      expect(svg).toContain('d = 20 cm');
    });

    it('should render Trapesium with two bases and height', () => {
      const svg = renderTrapesiumSvg({ atasAlas: 8, bawahAlas: 14, tinggi: 10, unit: 'cm' });
      expect(svg).toContain('a = 8 cm');
      expect(svg).toContain('b = 14 cm');
      expect(svg).toContain('t = 10 cm');
      expect(svg).toContain('Trapesium');
    });

    it('should render Jajar Genjang with base and height', () => {
      const svg = renderJajarGenjangSvg({ alas: 15, tinggi: 10, unit: 'cm' });
      expect(svg).toContain('a = 15 cm');
      expect(svg).toContain('t = 10 cm');
      expect(svg).toContain('Jajar Genjang');
    });

    it('should render Belah Ketupat with diagonals', () => {
      const svg = renderBelahKetupatSvg({ d1: 14, d2: 20, unit: 'cm' });
      expect(svg).toContain('14 cm');
      expect(svg).toContain('20 cm');
      expect(svg).toContain('Belah Ketupat');
    });

    it('should render Layang-Layang with diagonals', () => {
      const svg = renderLayangLayangSvg({ d1: 12, d2: 22, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('Layang-Layang');
    });
  });

  describe('Fractions & Charts', () => {
    it('should render fraction circles with shaded portions without answer spoilers', () => {
      const svg = renderPecahanLingkaranSvg({ pembagi: 4, diarsir: 3 });
      expect(svg).toContain('<svg');
      expect(svg).toContain('Daerah yang Diarsir');
      expect(svg).not.toContain('3 dari 4 bagian diarsir');
      expect(svg).toContain('#38bdf8'); // warna arsiran
    });

    it('should render fraction grid with smart auto-calculation without answer spoilers', () => {
      // Test 12 = 4x3 (balanced grid)
      const svg12 = renderPecahanPersegiSvg({ totalKotak: 12, diarsir: 7 });
      expect(svg12).toContain('Daerah yang Diarsir');
      expect(svg12).not.toContain('7 dari 12 kotak diarsir');
      expect(svg12).toContain('pattern id="diagonalHatch"');
      expect(svg12).toContain('fill="url(#diagonalHatch)"');

      // Test 6 = 3x2
      const svg6 = renderPecahanPersegiSvg({ totalKotak: 6, diarsir: 4 });
      expect(svg6).toContain('Daerah yang Diarsir');
      expect(svg6).not.toContain('4 dari 6 kotak diarsir');
    });

    it('should render prime numbers as a horizontal fraction strip with high-contrast diagonal hatch pattern without spoilers', () => {
      // Prime 5: 1 row of 5 columns (strip model)
      const svg5 = renderPecahanPersegiSvg({ totalKotak: 5, diarsir: 3 });
      expect(svg5).toContain('Daerah yang Diarsir');
      expect(svg5).not.toContain('3 dari 5 kotak diarsir');
      expect(svg5).toContain('pattern id="diagonalHatch"');
      expect(svg5).toContain('fill="url(#diagonalHatch)"');
      expect(svg5).toContain('<svg');

      // Prime 7: 1 row of 7 columns
      const svg7 = renderPecahanPersegiSvg({ totalKotak: 7, diarsir: 4 });
      expect(svg7).toContain('Daerah yang Diarsir');
      expect(svg7).not.toContain('4 dari 7 kotak diarsir');
      expect(svg7).toContain('pattern id="diagonalHatch"');
    });

    it('should render bar chart with axes and data bars', () => {
      const svg = renderDiagramBatangSvg({
        judul: 'Hasil Panen Padi',
        labels: ['Senin', 'Selasa', 'Rabu'],
        data: [20, 35, 25],
        yLabel: 'Kg'
      });
      expect(svg).toContain('Hasil Panen Padi');
      expect(svg).toContain('Senin');
      expect(svg).toContain('Selasa');
      expect(svg).toContain('35');
    });

    it('should render line chart with data points and polyline', () => {
      const svg = renderDiagramGarisSvg({
        judul: 'Suhu Harian',
        labels: ['06.00', '12.00', '18.00'],
        data: [24, 32, 28]
      });
      expect(svg).toContain('Suhu Harian');
      expect(svg).toContain('<polyline');
      expect(svg).toContain('32');
    });

    it('should render Pie Chart (Diagram Lingkaran) with legend', () => {
      const svg = renderDiagramLingkaranSvg({
        judul: 'Favorit Buah',
        labels: ['Apel', 'Jeruk', 'Mangga'],
        data: [40, 35, 25]
      });
      expect(svg).toContain('Favorit Buah');
      expect(svg).toContain('Apel');
      expect(svg).toContain('Jeruk');
      expect(svg).toContain('Mangga');
      expect(svg).toContain('%');
    });
  });

  describe('Science / IPAS Labeled Diagrams', () => {
    it('should render respiratory organ with realistic cartilage rings, lobes, and dynamic pointer X', () => {
      const svg = renderOrganPernapasanSvg({ pointer: 'trakea', label: 'X' });
      expect(svg).toContain('Sistem Pernapasan Manusia');
      expect(svg).toContain('huruf "X"');
      expect(svg).toContain('marker-end="url(#arrow)"');
      // Tracheal rings and lungs
      expect(svg).toContain('stroke="#c2410c" stroke-width="1.8"'); // Cincin tulang rawan trakea
      expect(svg).toContain('Diafragma');

      // Test pointing to bronkus and alveolus
      const bronkus = renderOrganPernapasanSvg({ pointer: 'bronkus', label: 'B' });
      expect(bronkus).toContain('huruf "B"');
      const pulmo = renderOrganPernapasanSvg({ pointer: 'paru', label: 'P' });
      expect(pulmo).toContain('huruf "P"');
    });

    it('should render digestive organ with realistic stomach, liver, pancreas, and haustrated colon', () => {
      const svg = renderOrganPencernaanSvg({ pointer: 'lambung', label: 'X' });
      expect(svg).toContain('Sistem Pencernaan Manusia');
      expect(svg).toContain('huruf "X"');
      expect(svg).toContain('Lambung');
      expect(svg).toContain('Usus');
      // Liver, gallbladder, and pancreas presence
      expect(svg).toContain('fill="#22c55e"'); // Kantung empedu
      expect(svg).toContain('fill="#fef08a"'); // Pankreas
    });

    it('should render flower diagram with stigma, style, ovary, ovules, and pointer X', () => {
      const svg = renderBagianBungaSvg({ pointer: 'putik', label: 'X' });
      expect(svg).toContain('Penampang Bagian-Bagian Bunga');
      expect(svg).toContain('huruf "X"');
      expect(svg).toContain('id="petalGradL"'); // Rose petal gradient
      expect(svg).toContain('circle cx="160" cy="143" r="4.5"'); // Bakal Biji (Ovula)
      expect(svg).toContain('ellipse cx="165" cy="64"'); // Kepala Putik (Stigma)
      expect(svg).toContain('ellipse cx="122" cy="78"'); // Benang Sari (Stamen)

      const biji = renderBagianBungaSvg({ pointer: 'biji', label: 'Z' });
      expect(biji).toContain('huruf "Z"');
      expect(biji).toContain('marker-end="url(#bArr)"');
    });

    it('should render digestive organ pointing to different parts', () => {
      const mulut = renderOrganPencernaanSvg({ pointer: 'mulut', label: 'P' });
      expect(mulut).toContain('huruf "P"');

      const usus = renderOrganPencernaanSvg({ pointer: 'usus halus', label: 'Q' });
      expect(usus).toContain('huruf "Q"');
    });

    it('should render microscopic villi (vili usus halus) with layers and pointer', () => {
      const vili = renderViliUsusSvg({ pointer: 'vili', label: 'X' });
      expect(vili).toContain('Struktur Mikroskopis Vili');
      expect(vili).toContain('huruf "X"');
      expect(vili).toContain('Kapiler Darah');
      expect(vili).toContain('Lakteal');

      const lakteal = renderViliUsusSvg({ pointer: 'lakteal', label: 'Y' });
      expect(lakteal).toContain('huruf "Y"');
      expect(lakteal).toContain('Pembuluh limfa/lakteal');
    });

    it('should render tooth types (struktur gigi) with roots, crowns, and functions', () => {
      const gigiSeri = renderStrukturGigiSvg({ pointer: 'seri', label: 'A' });
      expect(gigiSeri).toContain('Gigi Seri');
      expect(gigiSeri).toContain('Memotong');
      expect(gigiSeri).toContain('GUSI');

      const taring = renderStrukturGigiSvg({ pointer: 'taring', label: 'B' });
      expect(taring).toContain('Gigi Taring');
      expect(taring).toContain('Merobek');

      const geraham = renderStrukturGigiSvg({ pointer: 'geraham', label: 'C' });
      expect(geraham).toContain('Gigi Geraham');
      expect(geraham).toContain('Mengunyah');
    });

    it('should render detailed stomach anatomy with rugae and sphincters', () => {
      const stom = renderLambungDetailSvg({ pointer: 'rugae', label: 'X' });
      expect(stom).toContain('Penampang Detail Organ Lambung');
      expect(stom).toContain('pepsin');
      expect(stom).toContain('Duodenum');
      expect(stom).toContain('huruf "X"');
    });

    it('should render alveolus gas exchange diagram with O2 and CO2 diffusion', () => {
      const alv = renderAlveolusSvg({ pointer: 'alveolus', label: 'X' });
      expect(alv).toContain('Penampang Alveolus');
      expect(alv).toContain('O₂');
      expect(alv).toContain('CO₂');
      expect(alv).toContain('huruf "X"');
    });

    it('should render food chain with organism boxes', () => {
      const svg = renderRantaiMakananSvg({ pointer: 'konsumen1', label: 'X' });
      expect(svg).toContain('Rantai Makanan');
      expect(svg).toContain('Rumput');
      expect(svg).toContain('Belalang');
      expect(svg).toContain('huruf "X"');
    });

    it('should render food chain with custom organisms', () => {
      const svg = renderRantaiMakananSvg({
        pointer: 'produsen',
        label: 'Y',
        organisme: ['Fitoplankton', 'Udang', 'Ikan', 'Hiu']
      });
      expect(svg).toContain('Fitoplankton');
      expect(svg).toContain('Udang');
      expect(svg).toContain('huruf "Y"');
    });

    it('should render water cycle with dynamic pointer X', () => {
      const svg = renderSiklusAirSvg({ pointer: 'kondensasi', label: 'X' });
      expect(svg).toContain('Bagan Siklus Air');
      expect(svg).toContain('huruf "X"');
    });

    it('should render flower parts and metamorphosis with dynamic pointer', () => {
      const flower = renderBagianBungaSvg({ pointer: 'mahkota', label: 'X' });
      expect(flower).toContain('Bagian-Bagian Bunga');
      expect(flower).toContain('huruf "X"');

      const meta = renderMetamorfosisSvg({ pointer: 'kepompong', label: 'X' });
      expect(meta).toContain('Metamorfosis Kupu-Kupu');
      expect(meta).toContain('huruf "X"');
    });

    it('should render Indonesian map with vector archipelago and dynamic pointer X', () => {
      const jawa = renderPetaIndonesiaSvg({ pointer: 'jawa', label: 'X' });
      expect(jawa).toContain('Peta Kepulauan Indonesia');
      expect(jawa).toContain('huruf "X"');
      expect(jawa).toContain('arrPeta');
      expect(jawa).toContain('500 km'); // Skala

      const sumatra = renderPetaIndonesiaSvg({ pointer: 'sumatra', label: 'A' });
      expect(sumatra).toContain('huruf "A"');

      const kalimantan = renderPetaIndonesiaSvg({ pointer: 'kalimantan', label: 'B' });
      expect(kalimantan).toContain('huruf "B"');

      const sulawesi = renderPetaIndonesiaSvg({ pointer: 'sulawesi', label: 'C' });
      expect(sulawesi).toContain('huruf "C"');

      const papua = renderPetaIndonesiaSvg({ pointer: 'papua', label: 'D' });
      expect(papua).toContain('huruf "D"');
    });
  });

  describe('Measurement & Time', () => {
    it('should render analog clock with accurate hands for given time without spoiling time in default caption', () => {
      const svg = renderJamAnalogSvg({ jam: 8, menit: 15 });
      expect(svg).toContain('Jam Dinding Analog');
      expect(svg).not.toContain('Pukul 08.15');
      expect(svg).toContain('<circle');
      expect(svg).toContain('<line');
    });

    it('should render number line with positive and negative integers', () => {
      const svg = renderGarisBilanganSvg({
        min: -3,
        max: 3,
        titik: [{ x: 2, label: 'P' }]
      });
      expect(svg).toContain('Garis Bilangan');
      expect(svg).toContain('-3');
      expect(svg).toContain('3');
      expect(svg).toContain('P');
    });
  });

  describe('Dispatcher and Smart Detector', () => {
    it('should generate complete visual result payload using generateVisualStimulus', () => {
      const result = generateVisualStimulus({
        type: 'balok',
        params: { p: 20, l: 15, t: 10, unit: 'cm' }
      });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('svg');
      expect(result?.dataUri).toContain('data:image/svg+xml;utf8,');
      expect(result?.credit).toBe('Examplate Visual Engine');
      expect(result?.svg).toContain('p = 20 cm');
    });

    it('should return dynamic width/height from viewBox (not hardcoded)', () => {
      const bola = generateVisualStimulus({ type: 'bola', params: { r: 7 } });
      expect(bola).not.toBeNull();
      expect(bola?.width).toBe(320);
      expect(bola?.height).toBe(240);

      const balok = generateVisualStimulus({ type: 'balok', params: {} });
      expect(balok?.width).toBe(360);
      expect(balok?.height).toBe(250);

      const garis = generateVisualStimulus({ type: 'garis_bilangan', params: {} });
      expect(garis?.width).toBe(350);
      expect(garis?.height).toBe(140);
    });

    it('should dispatch all new renderer types', () => {
      const types = [
        'bola', 'prisma', 'limas', 'lingkaran', 'trapesium',
        'jajar_genjang', 'belah_ketupat', 'layang_layang',
        'diagram_lingkaran', 'organ_pencernaan', 'rantai_makanan',
        'peta_indonesia', 'rangkaian_listrik', 'perubahan_wujud',
        'mistar', 'tata_surya', 'perisai_pancasila'
      ];
      for (const type of types) {
        const result = generateVisualStimulus({ type, params: {} });
        expect(result, `dispatcher should handle type="${type}"`).not.toBeNull();
        expect(result?.svg).toContain('<svg');
      }
    });

    it('should automatically detect geometry parameters from question text', () => {
      const soal1 = 'Sebuah balok memiliki panjang 14 cm, lebar 9 cm, dan tinggi 5 cm. Hitunglah volume balok tersebut!';
      const detected1 = detectStimulusFromSoalText(soal1, 'Matematika');
      expect(detected1).not.toBeNull();
      expect(detected1?.type).toBe('balok');
      expect(detected1?.params?.p).toBe(14);
      expect(detected1?.params?.l).toBe(9);
      expect(detected1?.params?.t).toBe(5);

      const soal2 = 'Perhatikan gambar daur hidup kupu-kupu berikut! Tahapan yang ditunjuk oleh huruf X adalah...';
      const detected2 = detectStimulusFromSoalText(soal2, 'IPAS');
      expect(detected2).not.toBeNull();
      expect(detected2?.type).toBe('metamorfosis');
      expect(detected2?.params?.label).toBe('X');

      const soal3 = 'What time is it? Perhatikan jam dinding berikut yang menunjukkan pukul 09.30!';
      const detected3 = detectStimulusFromSoalText(soal3, 'Bahasa Inggris');
      expect(detected3).not.toBeNull();
      expect(detected3?.type).toBe('jam_analog');
      expect(detected3?.params?.jam).toBe(9);
      expect(detected3?.params?.menit).toBe(30);
    });

    it('should detect new shapes from question text', () => {
      // Bola
      const bola = detectStimulusFromSoalText('Sebuah bola memiliki jari-jari 21 cm. Hitunglah volume bola!', 'Matematika');
      expect(bola?.type).toBe('bola');
      expect(bola?.params?.r).toBe(21);

      // Prisma
      const prisma = detectStimulusFromSoalText('Prisma segitiga memiliki alas 10 cm dan tinggi 15 cm', 'Matematika');
      expect(prisma?.type).toBe('prisma');

      // Limas
      const limas = detectStimulusFromSoalText('Volume limas segiempat dengan sisi alas 12 cm dan tinggi 18 cm', 'Matematika');
      expect(limas?.type).toBe('limas');

      // Lingkaran
      const lingkaran = detectStimulusFromSoalText('Hitunglah keliling lingkaran dengan jari-jari 14 cm!', 'Matematika');
      expect(lingkaran?.type).toBe('lingkaran');
      expect(lingkaran?.params?.r).toBe(14);

      // Trapesium
      const trapesium = detectStimulusFromSoalText('Luas trapesium yang memiliki alas atas 6 cm, alas bawah 10 cm, dan tinggi 8 cm', 'Matematika');
      expect(trapesium?.type).toBe('trapesium');

      // Belah Ketupat
      const bk = detectStimulusFromSoalText('Luas belah ketupat dengan diagonal 12 cm dan 18 cm', 'Matematika');
      expect(bk?.type).toBe('belah_ketupat');

      // Layang-layang
      const ll = detectStimulusFromSoalText('Layang-layang memiliki diagonal 8 cm dan 12 cm. Hitunglah luasnya!', 'Matematika');
      expect(ll?.type).toBe('layang_layang');
    });

    it('should detect new IPAS diagrams from question text', () => {
      // Pencernaan Makro
      const pencernaan = detectStimulusFromSoalText('Perhatikan gambar sistem pencernaan manusia! Organ yang ditunjuk huruf X adalah lambung.', 'IPAS');
      expect(pencernaan?.type).toBe('organ_pencernaan');
      expect(pencernaan?.params?.pointer).toBe('lambung');

      // Vili Usus Halus (Kasus Soal No. 7 User!)
      const vili = detectStimulusFromSoalText('Perhatikan model struktur vili usus halus berikut ini! Dengan struktur lipatan-lipatan yang membentuk tonjolan seperti ini, apa manfaat utamanya bagi proses pencernaan?', 'IPAS');
      expect(vili?.type).toBe('vili_usus');
      expect(vili?.params?.pointer).toBe('vili');

      // Gigi
      const gigi = detectStimulusFromSoalText('Perhatikan gambar gigi berikut! Gigi yang berfungsi untuk merobek dan mengoyak makanan adalah...', 'IPAS');
      expect(gigi?.type).toBe('struktur_gigi');
      expect(gigi?.params?.pointer).toBe('taring');

      // Lambung Detail
      const lambungDetail = detectStimulusFromSoalText('Perhatikan penampang dinding lambung yang memiliki rugae dan menghasilkan enzim pepsin serta asam klorida!', 'IPAS');
      expect(lambungDetail?.type).toBe('lambung_detail');

      // Alveolus Mikroskopis
      const alveolus = detectStimulusFromSoalText('Perhatikan gambar alveolus berikut! Tempat terjadinya pertukaran gas oksigen dan karbondioksida ditunjukkan oleh...', 'IPAS');
      expect(alveolus?.type).toBe('alveolus');

      // Rantai Makanan
      const rantai = detectStimulusFromSoalText('Perhatikan rantai makanan berikut! Organisme yang berperan sebagai produsen adalah...', 'IPAS');
      expect(rantai?.type).toBe('rantai_makanan');
      expect(rantai?.params?.pointer).toBe('produsen');

      // Diagram Lingkaran (Pie Chart)
      const pie = detectStimulusFromSoalText('Perhatikan diagram lingkaran berikut yang menunjukkan data hobi siswa kelas 5!', 'Matematika');
      expect(pie?.type).toBe('diagram_lingkaran');

      // Peta Indonesia (Variasi Soal: Tebak Pulau, Fauna Endemik, Flora, Budaya, Rempah)
      const petaUser = detectStimulusFromSoalText('Perhatikan gambar peta Indonesia berikut! Di pulau manakah kita tinggal? A. Pulau Jawa B. Pulau Papua C. Pulau Kalimantan D. Pulau Sumatra', 'IPAS');
      expect(petaUser?.type).toBe('peta_indonesia');
      expect(petaUser?.params?.pointer).toBe('jawa');

      const petaPapua = detectStimulusFromSoalText('Perhatikan peta Indonesia berikut! Pulau Papua ditunjukkan oleh huruf...', 'IPAS');
      expect(petaPapua?.type).toBe('peta_indonesia');
      expect(petaPapua?.params?.pointer).toBe('papua');

      const petaKomodo = detectStimulusFromSoalText('Perhatikan gambar peta Indonesia berikut! Hewan langka Komodo hidup di pulau yang ditunjuk oleh tanda X, yaitu...', 'IPAS');
      expect(petaKomodo?.type).toBe('peta_indonesia');
      expect(petaKomodo?.params?.pointer).toBe('bali_nusra');

      const petaOrangutan = detectStimulusFromSoalText('Hewan bekantan dan orangutan merupakan fauna khas dari pulau yang ditunjuk tanda X pada peta Indonesia, yaitu...', 'IPAS');
      expect(petaOrangutan?.type).toBe('peta_indonesia');
      expect(petaOrangutan?.params?.pointer).toBe('kalimantan');

      const petaSulawesi = detectStimulusFromSoalText('Perhatikan peta Indonesia! Rumah adat Tongkonan suku Toraja dan hewan Anoa berasal dari pulau yang ditunjuk tanda X, yaitu...', 'IPAS');
      expect(petaSulawesi?.type).toBe('peta_indonesia');
      expect(petaSulawesi?.params?.pointer).toBe('sulawesi');

      const petaSumatra = detectStimulusFromSoalText('Bunga langka Rafflesia Arnoldii dan Danau Toba terletak di pulau yang ditunjuk oleh tanda X pada peta Indonesia, yaitu...', 'IPAS');
      expect(petaSumatra?.type).toBe('peta_indonesia');
      expect(petaSumatra?.params?.pointer).toBe('sumatra');

      const petaMaluku = detectStimulusFromSoalText('Perhatikan peta kepulauan Indonesia! Kepulauan penghasil rempah-rempah pala dan cengkih serta pahlawan Pattimura ditunjukkan oleh huruf X, yaitu...', 'IPAS');
      expect(petaMaluku?.type).toBe('peta_indonesia');
      expect(petaMaluku?.params?.pointer).toBe('maluku');

      // Rangkaian Listrik
      const listrik = detectStimulusFromSoalText('Perhatikan rangkaian listrik berikut! Jika saklar S1 dibuka dan S2 ditutup, lampu manakah yang menyala?', 'IPAS');
      expect(listrik?.type).toBe('rangkaian_listrik');
      expect(listrik?.params?.s1).toBe(false);
      expect(listrik?.params?.s2).toBe(true);

      // Perubahan Wujud Zat
      const wujud = detectStimulusFromSoalText('Perhatikan diagram perubahan wujud zat berikut! Perubahan wujud saat air membeku menjadi es ditunjukkan oleh nomor...', 'IPAS');
      expect(wujud?.type).toBe('perubahan_wujud');
      expect(wujud?.params?.pointer).toBe('2');

      // Mistar Pengukuran Panjang
      const mistar = detectStimulusFromSoalText('Perhatikan gambar pengukuran pensil dengan mistar berikut! Panjang pensil tersebut adalah...', 'Matematika');
      expect(mistar?.type).toBe('mistar');
      expect(mistar?.params?.objectType).toBe('pensil');

      // Tata Surya
      const planet = detectStimulusFromSoalText('Perhatikan gambar sistem tata surya berikut! Planet Mars ditunjukkan oleh huruf...', 'IPAS');
      expect(planet?.type).toBe('tata_surya');
      expect(planet?.params?.pointer).toBe('mars');

      // Perisai Pancasila
      const sila = detectStimulusFromSoalText('Perhatikan lambang burung Garuda Pancasila berikut! Simbol sila ketiga (persatuan Indonesia) adalah...', 'Pendidikan Pancasila');
      expect(sila?.type).toBe('perisai_pancasila');
      expect(sila?.params?.sila).toBe(3);
    });

    it('should detect all 10 expanded math topics from question text', () => {
      // 1. Persegi Panjang
      const pp = detectStimulusFromSoalText('Hitunglah luas persegi panjang dengan panjang 12 cm dan lebar 8 cm!', 'Matematika');
      expect(pp?.type).toBe('persegi_panjang');
      expect(pp?.params?.p).toBe(12);
      expect(pp?.params?.l).toBe(8);

      // 2. Segitiga Sama Sisi
      const sss = detectStimulusFromSoalText('Keliling segitiga sama sisi dengan sisi 9 cm adalah...', 'Matematika');
      expect(sss?.type).toBe('segitiga_sama_sisi');
      expect(sss?.params?.s).toBe(9);

      // 3. Segitiga Sama Kaki
      const ssk = detectStimulusFromSoalText('Segitiga sama kaki memiliki panjang kaki 10 cm dan alas 8 cm.', 'Matematika');
      expect(ssk?.type).toBe('segitiga_sama_kaki');
      expect(ssk?.params?.kaki).toBe(10);
      expect(ssk?.params?.alas).toBe(8);

      // 4. Segitiga Siku
      const siku = detectStimulusFromSoalText('Tentukan luas segitiga siku-siku dengan alas 6 cm dan tinggi 8 cm!', 'Matematika');
      expect(siku?.type).toBe('segitiga_siku');
      expect(siku?.params?.alas).toBe(6);
      expect(siku?.params?.tinggi).toBe(8);

      // 5. Jaring Kubus
      const jk = detectStimulusFromSoalText('Manakah jaring-jaring kubus dengan panjang rusuk 5 cm yang benar?', 'Matematika');
      expect(jk?.type).toBe('jaring_kubus');
      expect(jk?.params?.s).toBe(5);

      // 6. Jaring Balok
      const jb = detectStimulusFromSoalText('Jaring-jaring balok memiliki ukuran panjang 6 cm, lebar 4 cm, dan tinggi 3 cm.', 'Matematika');
      expect(jb?.type).toBe('jaring_balok');
      expect(jb?.params?.p).toBe(6);
      expect(jb?.params?.l).toBe(4);
      expect(jb?.params?.t).toBe(3);

      // 7. Koordinat Kartesius
      const koor = detectStimulusFromSoalText('Pada bidang koordinat kartesius, titik P(3, 4) dan Q(-2, 3) berada pada...', 'Matematika');
      expect(koor?.type).toBe('koordinat');
      expect(koor?.params?.titik).toEqual([
        { label: 'P', x: 3, y: 4 },
        { label: 'Q', x: -2, y: 3 }
      ]);

      // 8. Diagram Venn
      const venn = detectStimulusFromSoalText('Perhatikan diagram Venn mengenai siswa yang menyukai olahraga dan seni!', 'Matematika');
      expect(venn?.type).toBe('diagram_venn');

      // 9. Pictogram
      const picto = detectStimulusFromSoalText('Berdasarkan data pictogram / diagram gambar penjualan buah apel berikut...', 'Matematika');
      expect(picto?.type).toBe('pictogram');

      // 10. Simetri Lipat
      const sim = detectStimulusFromSoalText('Berapa banyak simetri lipat pada bangun persegi panjang berikut?', 'Matematika');
      expect(sim?.type).toBe('simetri_lipat');
      expect(sim?.params?.bangun).toBe('persegi_panjang');

      // 11. Bangun Gabungan
      const gab = detectStimulusFromSoalText('Hitunglah luas bangun gabungan berbentuk L berikut ini!', 'Matematika');
      expect(gab?.type).toBe('bangun_gabungan');
      expect(gab?.params?.bentuk).toBe('L');
    });
  });

  describe('10 Expanded Math SVG Renderers Direct Testing', () => {
    it('1. renderPersegiPanjangSvg should render rectangle with labels', () => {
      const svg = renderPersegiPanjangSvg({ p: 15, l: 10, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('15 cm');
      expect(svg).toContain('10 cm');
      expect(svg).toContain('Persegi Panjang ABCD');
    });

    it('2. renderSegitigaSamaSisiSvg should render equilateral triangle with 60° angles', () => {
      const svg = renderSegitigaSamaSisiSvg({ s: 12, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('12 cm');
      expect(svg).toContain('60°');
      expect(svg).toContain('Segitiga Sama Sisi ABC');
    });

    it('3. renderSegitigaSamaKakiSvg should render isosceles triangle with altitude line', () => {
      const svg = renderSegitigaSamaKakiSvg({ kaki: 13, alas: 10, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('13 cm');
      expect(svg).toContain('10 cm');
      expect(svg).toContain('stroke-dasharray="5,4"'); // altitude line
      expect(svg).toContain('Segitiga Sama Kaki ABC');
    });

    it('4. renderJaringKubusSvg should render cross unfolded cube net', () => {
      const svg = renderJaringKubusSvg({ s: 6, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('s = 6 cm');
      expect(svg).toContain('Atas');
      expect(svg).toContain('Depan');
      expect(svg).toContain('Bawah');
      expect(svg).toContain('Jaring-jaring Kubus');
    });

    it('5. renderJaringBalokSvg should render unfolded rectangular box net', () => {
      const svg = renderJaringBalokSvg({ p: 8, l: 5, t: 4, unit: 'cm' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('p = 8 cm');
      expect(svg).toContain('l = 5 cm');
      expect(svg).toContain('t = 4 cm');
      expect(svg).toContain('Jaring-jaring Balok');
    });

    it('6. renderKoordinatKartesiusSvg should render Cartesian grid with points', () => {
      const svg = renderKoordinatKartesiusSvg({
        titik: [
          { x: 2, y: 5, label: 'A' },
          { x: -3, y: -2, label: 'B' }
        ]
      });
      expect(svg).toContain('<svg');
      expect(svg).toContain('A(2,5)');
      expect(svg).toContain('B(-3,-2)');
      expect(svg).toContain('Bidang Koordinat Kartesius');
      expect(svg).toContain('stroke-dasharray="3,3"'); // projection lines
    });

    it('7. renderDiagramVennSvg should render 2 overlapping circles with universal set', () => {
      const svg = renderDiagramVennSvg({
        judul: 'Hobi Kelas 5',
        labelA: 'Sepak Bola',
        labelB: 'Basket',
        aSaja: 15,
        irisan: 6,
        bSaja: 9
      });
      expect(svg).toContain('<svg');
      expect(svg).toContain('Hobi Kelas 5');
      expect(svg).toContain('Sepak Bola');
      expect(svg).toContain('Basket');
      expect(svg).toContain('15');
      expect(svg).toContain('6');
      expect(svg).toContain('9');
      expect(svg).toContain('S'); // universal set symbol
    });

    it('8. renderPictogramSvg should render pictogram with custom icons and legend without value spoilers unless enabled', () => {
      const svg = renderPictogramSvg({
        judul: 'Hasil Panen Jeruk',
        labels: ['Senin', 'Selasa'],
        data: [3, 5],
        ikon: '🍊',
        nilaiIkon: 10
      });
      expect(svg).toContain('<svg');
      expect(svg).toContain('Hasil Panen Jeruk');
      expect(svg).toContain('Senin');
      expect(svg).toContain('Selasa');
      expect(svg).toContain('🍊');
      expect(svg).toContain('Keterangan: 🍊 = 10');
      // Zero-spoiler: numbers not shown by default
      expect(svg).not.toContain('(30)');
      expect(svg).not.toContain('(50)');

      // If showValues: true is explicitly passed, show them
      const svgWithValues = renderPictogramSvg({
        judul: 'Hasil Panen Jeruk',
        labels: ['Senin', 'Selasa'],
        data: [3, 5],
        ikon: '🍊',
        nilaiIkon: 10,
        showValues: true
      });
      expect(svgWithValues).toContain('(30)');
      expect(svgWithValues).toContain('(50)');
    });

    it('9. renderSimetriLipatSvg should render symmetry axes with dash lines without spoiling answer count', () => {
      const svgPersegi = renderSimetriLipatSvg({ bangun: 'persegi' });
      expect(svgPersegi).toContain('<svg');
      expect(svgPersegi).toContain('Sumbu Simetri Lipat');
      expect(svgPersegi).toContain('Garis putus-putus menunjukkan sumbu simetri lipat');
      expect(svgPersegi).not.toContain('Jumlah garis simetri =');

      const svgLingkaran = renderSimetriLipatSvg({ bangun: 'lingkaran' });
      expect(svgLingkaran).toContain('Garis putus-putus menunjukkan sumbu simetri lipat');
      expect(svgLingkaran).not.toContain('∞ (tak terhingga)');
    });

    it('10. renderBangunGabunganSvg should render L-shape and T-shape with dimensions', () => {
      const svgL = renderBangunGabunganSvg({ bentuk: 'L', unit: 'cm' });
      expect(svgL).toContain('<svg');
      expect(svgL).toContain('Bangun Gabungan Bentuk L');

      const svgT = renderBangunGabunganSvg({ bentuk: 'T', unit: 'cm' });
      expect(svgT).toContain('<svg');
      expect(svgT).toContain('Bangun Gabungan Bentuk T');
    });

    it('should dispatch all 10 expanded math types via generateVisualStimulus', () => {
      const newMathTypes = [
        { type: 'persegi_panjang', params: { p: 10, l: 5 } },
        { type: 'segitiga_sama_sisi', params: { s: 8 } },
        { type: 'segitiga_sama_kaki', params: { kaki: 10, alas: 6 } },
        { type: 'jaring_kubus', params: { s: 4 } },
        { type: 'jaring_balok', params: { p: 6, l: 3, t: 2 } },
        { type: 'koordinat', params: { titik: [{ x: 1, y: 1, label: 'A' }] } },
        { type: 'diagram_venn', params: { aSaja: 8, irisan: 3, bSaja: 5 } },
        { type: 'pictogram', params: { data: [2, 4] } },
        { type: 'simetri_lipat', params: { bangun: 'persegi_panjang' } },
        { type: 'bangun_gabungan', params: { bentuk: 'L' } },
      ];

      for (const item of newMathTypes) {
        const res = generateVisualStimulus(item);
        expect(res, `Dispatcher failed for type=${item.type}`).not.toBeNull();
        expect(res?.svg).toContain('<svg');
        expect(res?.dataUri).toContain('data:image/svg+xml');
        expect(res?.width).toBeGreaterThan(0);
        expect(res?.height).toBeGreaterThan(0);
      }
    });

    it('should generate distinct stimulus signatures for diversity guard', () => {
      const sig1 = buildStimulusSignature({ type: 'persegi_panjang', params: { p: 12, l: 8 } });
      const sig2 = buildStimulusSignature({ type: 'persegi_panjang', params: { p: 14, l: 10 } });
      expect(sig1).not.toBe(sig2);
      expect(sig1).toBe('persegi_panjang:p=12:l=8');

      const sigKaki = buildStimulusSignature({ type: 'segitiga_sama_kaki', params: { kaki: 10, alas: 6 } });
      expect(sigKaki).toBe('segitiga_sama_kaki:s=undefined:kaki=10:alas=6'.replace(':s=undefined', '')); // without undefined if not set
      expect(sigKaki).toContain('kaki=10');
      expect(sigKaki).toContain('alas=6');

      const sigVenn = buildStimulusSignature({ type: 'diagram_venn', params: { aSaja: 10, irisan: 5, bSaja: 8 } });
      expect(sigVenn).toContain('diagram_venn');
      expect(sigVenn).toContain('aSaja=10');
      expect(sigVenn).toContain('irisan=5');
      expect(sigVenn).toContain('bSaja=8');

      const sigKoor = buildStimulusSignature({
        type: 'koordinat',
        params: { titik: [{ label: 'P', x: 2, y: 3 }, { label: 'Q', x: -1, y: 4 }] }
      });
      expect(sigKoor).toBe('koordinat:titik=P:2,3;Q:-1,4');
    });

    it('should never produce NaN in renderSegitigaSamaKakiSvg even when kaki < alas (regression test)', () => {
      // Kasus foto user: alas = 12, opsi keliling 26, 28, 30, 32 -> kaki = 7, 8, 9, 10
      const testCases = [
        { kaki: 10, alas: 12 }, // kaki < alas
        { kaki: 8, alas: 12 },  // kaki < alas
        { kaki: 7, alas: 12 },  // kaki < alas
        { alas: 12, tinggi: 8 }, // hanya alas dan tinggi
        { kaki: 5, alas: 15 },  // degenerate input fallback
        { kaki: 13, alas: 10 }, // kaki > alas
      ];

      for (const tc of testCases) {
        const svg = renderSegitigaSamaKakiSvg(tc);
        expect(svg).not.toContain('NaN');
        expect(svg).toContain('<polygon');
        expect(svg).toContain('<circle cx="180"');
        expect(svg).toContain('>A</text>');
        expect(svg).toContain('>B</text>');
        expect(svg).toContain('>C</text>');
        expect(svg).toContain('Segitiga Sama Kaki ABC');
      }

      // Pastikan label tinggi muncul jika diberikan
      const svgTinggi = renderSegitigaSamaKakiSvg({ alas: 12, tinggi: 8 });
      expect(svgTinggi).toContain('t = 8 cm');
      expect(svgTinggi).toContain('10 cm'); // Pythagoras kaki 6-8-10
      expect(svgTinggi).not.toContain('NaN');
    });

    it('should render obtuse angles without clipping left edge in renderSudutSvg', () => {
      const svg135 = renderSudutSvg({ derajat: 135 });
      expect(svg135).toContain('<svg');
      expect(svg135).toContain('135°');
      expect(svg135).not.toContain('x="-'); // Pastikan tidak ada koordinat x negatif
      expect(svg135).not.toContain('NaN');

      const svg150 = renderSudutSvg({ derajat: 150 });
      expect(svg150).not.toContain('x="-');
      expect(svg150).toContain('150°');
    });

    it('should render full circle properly for 100% single slice in renderDiagramLingkaranSvg', () => {
      const svg = renderDiagramLingkaranSvg({ data: [100], labels: ['Total'] });
      expect(svg).toContain('<svg');
      expect(svg).toContain('<circle cx="150" cy="115" r="80"');
      expect(svg).toContain('100%');
      expect(svg).not.toContain('NaN');
    });

    it('should not extract numbers from multiple-choice options in detectStimulusFromSoalText', () => {
      const soalWithOptionNumbers = `Perhatikan gambar segitiga berikut!
Keliling segitiga sama kaki tersebut adalah ....
A. 26 cm
B. 28 cm
C. 30 cm
D. 32 cm`;
      const detected = detectStimulusFromSoalText(soalWithOptionNumbers, 'matematika');
      expect(detected).not.toBeNull();
      expect(detected?.type).toBe('segitiga_sama_kaki');
      // Pastikan bukan 26 atau 28 dari opsi pilihan ganda
      const svg = renderSegitigaSamaKakiSvg(detected?.params || {});
      expect(svg).not.toContain('NaN');
      expect(svg).toContain('Segitiga Sama Kaki ABC');
    });

    it('should render Rangkaian Listrik correctly with proper switch and bulb states', () => {
      // Seri
      const seri = renderRangkaianListrikSvg({ model: 'seri', s1: true });
      expect(seri).toContain('Rangkaian Listrik Seri');
      expect(seri).toContain('Baterai');
      expect(seri).toContain('Nyala');

      // Seri with open switch
      const seriOff = renderRangkaianListrikSvg({ model: 'seri', s1: false });
      expect(seriOff).toContain('Padam');
      expect(seriOff).toContain('Terbuka');

      // Paralel
      const paralel = renderRangkaianListrikSvg({ model: 'paralel', s1: true, s2: false });
      expect(paralel).toContain('Rangkaian Listrik Paralel');
      expect(paralel).toContain('Tertutup');
      expect(paralel).toContain('Terbuka');

      // Campuran with pointer
      const campuran = renderRangkaianListrikSvg({ model: 'campuran', s1: true, s2: false, pointer: 'L3', label: 'X' });
      expect(campuran).toContain('Rangkaian Listrik Campuran');
      expect(campuran).toContain('huruf "X"');
    });

    it('should render Perubahan Wujud Zat with 6 cycle arrows and zero spoilers', () => {
      const wujud = renderPerubahanWujudSvg({ pointer: '1', label: 'X' });
      expect(wujud).toContain('Diagram Perubahan Wujud Zat');
      expect(wujud).toContain('PADAT');
      expect(wujud).toContain('CAIR');
      expect(wujud).toContain('GAS');
      expect(wujud).toContain('huruf "X"');
      // Zero-spoiler check: The diagram should NOT display raw textual answer strings on the arrows
      expect(wujud).not.toContain('>Mencair<');
      expect(wujud).not.toContain('>Membeku<');

      // All 6 transitions should render valid numbers
      for (let i = 1; i <= 6; i++) {
        const svg = renderPerubahanWujudSvg({ pointer: String(i) });
        expect(svg).toContain('<svg');
        expect(svg).not.toContain('NaN');
      }
    });

    it('should render Mistar with millimeter precision, offset start, and zero spoilers', () => {
      const mistar = renderMistarSvg({ start: 3.0, end: 8.5, objectType: 'pensil', label: 'Panjang = ... cm' });
      expect(mistar).toContain('Pengukuran Panjang dengan Mistar');
      expect(mistar).toContain('cm');
      expect(mistar).toContain('Panjang = ... cm');
      // Zero spoiler: should NOT print the computed difference "5.5 cm"
      expect(mistar).not.toContain('5.5 cm');

      // Test different object types
      const paku = renderMistarSvg({ start: 1.0, end: 6.0, objectType: 'paku' });
      expect(paku).toContain('<polygon');
      const penghapus = renderMistarSvg({ start: 2.0, end: 5.0, objectType: 'penghapus' });
      expect(penghapus).toContain('ERASER');
    });

    it('should render Tata Surya with 8 planetary orbits and zero spoilers', () => {
      const surya = renderTataSuryaSvg({ pointer: 'saturnus', label: 'X' });
      expect(surya).toContain('Diagram Sistem Tata Surya');
      expect(surya).toContain('Matahari');
      expect(surya).toContain('huruf "X"');
      // Zero spoiler: Should NOT print "Saturnus" or "Bumi" directly next to the planets
      expect(surya).not.toContain('>Saturnus<');
      expect(surya).not.toContain('>Bumi<');

      // Verify orbital numbering (1) to (8) exists
      for (let i = 1; i <= 8; i++) {
        expect(surya).toContain(`(${i})`);
      }
    });

    it('should render Perisai Pancasila with 5 distinct sila symbols and zero spoilers', () => {
      for (let sila = 1; sila <= 5; sila++) {
        const svg = renderPerisaiPancasilaSvg({ sila, label: 'X' });
        expect(svg).toContain('Perisai Garuda Pancasila');
        expect(svg).toContain('huruf "X"');
        // Zero spoiler: Should NOT print the textual sila names
        expect(svg).not.toContain('Ketuhanan Yang Maha Esa');
        expect(svg).not.toContain('Persatuan Indonesia');
        expect(svg).not.toContain('Keadilan Sosial');
      }
    });

    it('should render Magnet SVG with tarik/tolak interactions and zero spoilers', () => {
      // Test tarik-menarik
      const svgTarik = renderMagnetSvg({ interaksi: 'tarik', pointer: 'kanan2', label: 'X' });
      expect(svgTarik).toContain('Interaksi Gaya Magnet');
      expect(svgTarik).toContain('Tarik-Menarik');
      expect(svgTarik).toContain('[X]');
      expect(svgTarik).toContain('huruf "X"');

      // Test tolak-menolak
      const svgTolak = renderMagnetSvg({ interaksi: 'tolak', pointer: 'kiri1', label: 'Y' });
      expect(svgTolak).toContain('Tolak-Menolak');
      expect(svgTolak).toContain('[Y]');
      expect(svgTolak).toContain('Magnet 1');
      expect(svgTolak).toContain('Magnet 2');
    });

    it('should render Sifat Cahaya SVG with pembiasan and pemantulan', () => {
      // Test Pembiasan
      const svgBias = renderSifatCahayaSvg({ peristiwa: 'pembiasan', pointer: 'X', label: 'X' });
      expect(svgBias).toContain('Diagram Sifat Cahaya (Pembiasan)');
      expect(svgBias).toContain('Medium 1: Udara');
      expect(svgBias).toContain('Medium 2: Air');
      expect(svgBias).toContain('Garis Normal');
      expect(svgBias).toContain('Sinar Datang');
      expect(svgBias).toContain('Sinar Bias');
      expect(svgBias).toContain('huruf "X"');

      // Test Pemantulan
      const svgPantul = renderSifatCahayaSvg({ peristiwa: 'pemantulan', pointer: 'X', label: 'X' });
      expect(svgPantul).toContain('Diagram Sifat Cahaya (Pemantulan)');
      expect(svgPantul).toContain('Cermin Datar');
      expect(svgPantul).toContain('Sinar Pantul');
    });

    it('should render Busur Derajat SVG with accurate scale and zero degree spoiler', () => {
      const svgBusur = renderBusurDerajatSvg({ derajat: 65, label: 'X' });
      expect(svgBusur).toContain('Pengukuran Sudut Busur Derajat');
      expect(svgBusur).toContain('0°');
      expect(svgBusur).toContain('90°');
      expect(svgBusur).toContain('180°');
      expect(svgBusur).toContain('arrBusur');
      // Zero-spoiler: target angle label is 'X', not literal degree value "65°"
      expect(svgBusur).toContain('>X<');
      expect(svgBusur).not.toContain('>65°<');
    });

    it('should render Pecahan Campuran (multi-lingkaran) properly without spoiler', () => {
      const svg = renderPecahanLingkaranSvg({ utuh: 2, pembagi: 4, diarsir: 3 });
      expect(svg).toContain('Daerah yang Diarsir');
      expect(svg).toContain('1 Bagian Utuh');
      expect(svg).not.toContain('3/4 Bagian');
      expect(svg).toContain('viewBox="0 0 445 210"');
    });

    it('should render Jaring-jaring Kubus with pola salib, tangga, and t', () => {
      const salib = renderJaringKubusSvg({ s: 6, unit: 'cm', pola: 'salib' });
      expect(salib).toContain('Pola SALIB');

      const tangga = renderJaringKubusSvg({ s: 6, unit: 'cm', pola: 'tangga' });
      expect(tangga).toContain('Pola TANGGA');

      const polaT = renderJaringKubusSvg({ s: 6, unit: 'cm', pola: 't' });
      expect(polaT).toContain('Pola T');
    });

    it('should detect new stimulus types from soal text', () => {
      // 1. Busur derajat
      const detBusur = detectStimulusFromSoalText('Perhatikan gambar busur derajat berikut! Besar sudut yang terukur adalah 60 derajat.', 'matematika');
      expect(detBusur?.type).toBe('busur_derajat');
      expect(detBusur?.params?.derajat).toBe(60);

      // 2. Magnet
      const detMagnet = detectStimulusFromSoalText('Dua buah kutub magnet saling tolak-menolak jika didekatkan...', 'ipas');
      expect(detMagnet?.type).toBe('magnet');
      expect(detMagnet?.params?.interaksi).toBe('tolak');

      // 3. Sifat Cahaya
      const detCahaya = detectStimulusFromSoalText('Perhatikan jalannya berkas cahaya pada peristiwa pembiasan berikut...', 'ipas');
      expect(detCahaya?.type).toBe('sifat_cahaya');
      expect(detCahaya?.params?.peristiwa).toBe('pembiasan');

      // 4. Pecahan Campuran
      const detCampuran = detectStimulusFromSoalText('Berapakah nilai pecahan campuran 2 3/4 yang diarsir pada gambar?', 'matematika');
      expect(detCampuran?.type).toBe('pecahan_lingkaran');
      expect(detCampuran?.params?.utuh).toBe(2);
      expect(detCampuran?.params?.diarsir).toBe(3);
      expect(detCampuran?.params?.pembagi).toBe(4);

      // 5. Jaring-jaring Kubus Pola Tangga
      const detTangga = detectStimulusFromSoalText('Gambar jaring-jaring kubus dengan pola tangga 1-4-1 di bawah ini...', 'matematika');
      expect(detTangga?.type).toBe('jaring_kubus');
      expect(detTangga?.params?.pola).toBe('tangga');

      // 6. Peredaran Darah
      const detDarah = detectStimulusFromSoalText('Perhatikan gambar sistem peredaran darah manusia berikut! Bagian bilik kiri jantung memompa darah kaya oksigen menuju aorta.', 'ipas');
      expect(detDarah?.type).toBe('peredaran_darah');
      expect(detDarah?.params?.pointer).toBe('bilik_kiri');

      // 7. Gerhana
      const detGerhana = detectStimulusFromSoalText('Perhatikan gambar peristiwa gerhana matahari berikut! Daerah bayangan inti yang gelap gulita (umbra) ditunjukkan oleh huruf X.', 'ipas');
      expect(detGerhana?.type).toBe('gerhana');
      expect(detGerhana?.params?.jenis).toBe('matahari');
      expect(detGerhana?.params?.pointer).toBe('umbra');

      // 8. Pesawat Sederhana (Tuas & Katrol)
      const detTuas = detectStimulusFromSoalText('Sebuah batu besar dipindahkan menggunakan alat tuas / pengungkit dengan titik tumpu berada di antara beban dan kuasa.', 'ipas');
      expect(detTuas?.type).toBe('pesawat_sederhana');
      expect(detTuas?.params?.jenis).toBe('tuas');

      const detKatrol = detectStimulusFromSoalText('Beban seberat 50 kg diangkat menggunakan katrol bebas yang bergerak bersama beban.', 'ipas');
      expect(detKatrol?.type).toBe('pesawat_sederhana');
      expect(detKatrol?.params?.jenis).toBe('katrol');
      expect(detKatrol?.params?.tipeKatrol).toBe('bebas');

      // 9. Pancaindra (Mata & Telinga)
      const detMata = detectStimulusFromSoalText('Perhatikan gambar penampang bola mata berikut! Bagian retina yang peka terhadap cahaya ditunjuk oleh huruf X.', 'ipas');
      expect(detMata?.type).toBe('pancaindra');
      expect(detMata?.params?.organ).toBe('mata');
      expect(detMata?.params?.pointer).toBe('retina');

      const detTelinga = detectStimulusFromSoalText('Bagian telinga indra pendengaran yang meneruskan getaran ke koklea (rumah siput) adalah...', 'ipas');
      expect(detTelinga?.type).toBe('pancaindra');
      expect(detTelinga?.params?.organ).toBe('telinga');
      expect(detTelinga?.params?.pointer).toBe('koklea');
    });

    it('should directly render and dispatch 4 new science diagrams without text overlaps', () => {
      // 1. Peredaran Darah
      const darah = renderPeredaranDarahSvg({ pointer: 'bilik_kiri', label: 'X' });
      expect(darah).toContain('Skema Peredaran Darah Manusia');
      expect(darah).toContain('Serambi Kanan');
      expect(darah).toContain('Bilik Kiri');
      expect(darah).toContain('Paru-Paru (Pulmo)');
      expect(darah).toContain('Seluruh Tubuh');
      expect(darah).toContain('Aorta');
      expect(darah).toContain('Vena Cava');
      expect(darah).toContain('huruf "X"');
      expect(darah).not.toContain('NaN');

      // 2. Gerhana Matahari & Bulan
      const gerhanaM = renderGerhanaSvg({ jenis: 'matahari', pointer: 'umbra', label: 'X' });
      expect(gerhanaM).toContain('Gerhana Matahari');
      expect(gerhanaM).toContain('Matahari');
      expect(gerhanaM).toContain('Bulan');
      expect(gerhanaM).toContain('Bumi');
      expect(gerhanaM).toContain('1. Umbra');
      expect(gerhanaM).toContain('2. Penumbra');
      expect(gerhanaM).toContain('huruf "X"');

      const gerhanaB = renderGerhanaSvg({ jenis: 'bulan', pointer: 'penumbra', label: 'Y' });
      expect(gerhanaB).toContain('Gerhana Bulan');
      expect(gerhanaB).toContain('huruf "Y"');

      // 3. Pesawat Sederhana (Tuas & Katrol)
      const tuas = renderPesawatSederhanaSvg({ jenis: 'tuas', tipeTuas: 1, pointer: 'tumpu', label: 'X' });
      expect(tuas).toContain('Pesawat Sederhana: Tuas / Pengungkit');
      expect(tuas).toContain('Titik Tumpu');
      expect(tuas).toContain('Beban');
      expect(tuas).toContain('Kuasa (F)');
      expect(tuas).toContain('huruf "X"');

      const katrol = renderPesawatSederhanaSvg({ jenis: 'katrol', tipeKatrol: 'tetap', pointer: 'kuasa', label: 'F' });
      expect(katrol).toContain('Katrol Tetap');
      expect(katrol).toContain('Kuasa');
      expect(katrol).toContain('huruf "F"');

      // 4. Pancaindra (Mata & Telinga)
      const mata = renderPancaindraSvg({ organ: 'mata', pointer: 'kornea', label: 'X' });
      expect(mata).toContain('Bola Mata Manusia');
      expect(mata).toContain('1. Kornea');
      expect(mata).toContain('2. Iris');
      expect(mata).toContain('3. Lensa');
      expect(mata).toContain('4. Retina');
      expect(mata).toContain('5. Saraf Optik');
      expect(mata).toContain('huruf "X"');

      const telinga = renderPancaindraSvg({ organ: 'telinga', pointer: 'koklea', label: 'Y' });
      expect(telinga).toContain('Indra Pendengaran (Telinga)');
      expect(telinga).toContain('Daun Telinga');
      expect(telinga).toContain('Gendang Telinga');
      expect(telinga).toContain('Koklea (Rumah Siput)');
      expect(telinga).toContain('Saluran Eustachius');
      expect(telinga).toContain('huruf "Y"');

      // Dispatcher check for all 4
      const d1 = generateVisualStimulus({ type: 'peredaran_darah', params: {} });
      expect(d1).not.toBeNull();
      expect(d1?.width).toBe(440);
      expect(d1?.height).toBe(350);

      const d2 = generateVisualStimulus({ type: 'gerhana', params: { jenis: 'matahari' } });
      expect(d2).not.toBeNull();
      expect(d2?.width).toBe(480);
      expect(d2?.height).toBe(260);

      const d3 = generateVisualStimulus({ type: 'pesawat_sederhana', params: { jenis: 'tuas' } });
      expect(d3).not.toBeNull();
      expect(d3?.width).toBe(560);
      expect(d3?.height).toBe(340);

      const d4 = generateVisualStimulus({ type: 'pancaindra', params: { organ: 'mata' } });
      expect(d4).not.toBeNull();
      expect(d4?.width).toBe(450);
      expect(d4?.height).toBe(260);
    });

    it('should directly render and dispatch 6 new Stage 2 math/coding diagrams without text overlaps', () => {
      // 1. Timbangan Neraca
      const neraca = renderTimbanganNeracaSvg({ status: 'seimbang', pointer: 'kiri', label: 'X' });
      expect(neraca).toContain('Pengukuran Massa: Neraca Dua Lengan');
      expect(neraca).toContain('Anak Timbangan');
      expect(neraca).toContain('Benda X');
      expect(neraca).toContain('huruf "X"');
      expect(neraca).not.toContain('NaN');

      const neracaMiring = renderTimbanganNeracaSvg({ status: 'miring_kiri', pointer: 'kiri' });
      expect(neracaMiring).toContain('miring kiri');

      // 2. Mata Angin (Kompas & Denah)
      const kompas = renderMataAnginSvg({ mode: 'kompas', targetArah: 'TL', label: 'X' });
      expect(kompas).toContain('Delapan Arah Mata Angin');
      expect(kompas).toContain('huruf "X"');
      expect(kompas).toContain('>U<');
      expect(kompas).toContain('>T<');
      expect(kompas).toContain('>S<');
      expect(kompas).toContain('>B<');

      const denah = renderMataAnginSvg({ mode: 'denah' });
      expect(denah).toContain('Denah Wilayah & Arah Mata Angin');
      expect(denah).toContain('SD Wanayasa');
      expect(denah).toContain('Masjid');
      expect(denah).toContain('Alun-Alun');
      expect(denah).toContain('Puskesmas');

      // 3. Tabel Turus
      const turus = renderTabelTurusSvg({
        judul: 'Data Kegemaran Siswa',
        kategoriLabel: 'Olahraga',
        data: [
          { label: 'Sepak Bola', count: 12 },
          { label: 'Renang', count: 7, targetField: 'frekuensi' }
        ],
        label: 'X'
      });
      expect(turus).toContain('Data Kegemaran Siswa');
      expect(turus).toContain('Turus (Tally)');
      expect(turus).toContain('Sepak Bola');
      expect(turus).toContain('Renang');
      expect(turus).toContain('huruf "X"');

      // 4. Spinner Peluang
      const spinner = renderSpinnerPeluangSvg({ bagian: 6, jarumKe: 2, label: 'X' });
      expect(spinner).toContain('Peluang: Roda Putar');
      expect(spinner).toContain('Spinner 6 Juring');
      expect(spinner).toContain('Legenda');
      expect(spinner).not.toContain('NaN');

      // 5. Pola Gambar
      const pola = renderPolaGambarSvg({ counts: [1, 3, 5, 7], targetSuku: 4, label: 'X' });
      expect(pola).toContain('Barisan Pola Gambar Geometri');
      expect(pola).toContain('Pola 1');
      expect(pola).toContain('Pola 2');
      expect(pola).toContain('Pola 3');
      expect(pola).toContain('Pola 4');
      expect(pola).toContain('huruf "X"');

      // 6. Flowchart (Diagram Alir)
      const flow = renderFlowchartSvg({ pointer: 'kondisi', label: 'X' });
      expect(flow).toContain('Diagram Alir Algoritma (Flowchart)');
      expect(flow).toContain('Mulai');
      expect(flow).toContain('Input Nilai N');
      expect(flow).toContain('Selesai');
      expect(flow).toContain('Ya');
      expect(flow).toContain('Tidak');
      expect(flow).toContain('huruf "X"');

      // Dispatcher check for all 6
      const dNeraca = generateVisualStimulus({ type: 'timbangan_neraca', params: {} });
      expect(dNeraca).not.toBeNull();
      expect(dNeraca?.width).toBe(440);
      expect(dNeraca?.height).toBe(260);

      const dMataAngin = generateVisualStimulus({ type: 'mata_angin', params: { mode: 'denah' } });
      expect(dMataAngin).not.toBeNull();
      expect(dMataAngin?.width).toBe(500);
      expect(dMataAngin?.height).toBe(295);

      const dTurus = generateVisualStimulus({ type: 'tabel_turus', params: {} });
      expect(dTurus).not.toBeNull();
      expect(dTurus?.width).toBe(440);

      const dSpinner = generateVisualStimulus({ type: 'spinner_peluang', params: {} });
      expect(dSpinner).not.toBeNull();
      expect(dSpinner?.width).toBe(420);
      expect(dSpinner?.height).toBe(260);

      const dPola = generateVisualStimulus({ type: 'pola_gambar', params: {} });
      expect(dPola).not.toBeNull();
      expect(dPola?.width).toBe(450);
      expect(dPola?.height).toBe(220);

      const dFlow = generateVisualStimulus({ type: 'flowchart', params: {} });
      expect(dFlow).not.toBeNull();
      expect(dFlow?.width).toBe(440);
      expect(dFlow?.height).toBe(310);
    });

    it('should detect Stage 2 stimulus types from soal text', () => {
      // 1. Timbangan Neraca
      const detNeraca = detectStimulusFromSoalText('Sebuah benda ditimbang menggunakan neraca dua lengan dengan anak timbangan 500 g dan 250 g sehingga posisinya seimbang.', 'matematika');
      expect(detNeraca?.type).toBe('timbangan_neraca');
      expect(detNeraca?.params?.status).toBe('seimbang');

      // 2. Mata Angin
      const detKompas = detectStimulusFromSoalText('Perhatikan gambar arah mata angin berikut! Arah yang berada di antara timur dan utara adalah timur laut.', 'matematika');
      expect(detKompas?.type).toBe('mata_angin');
      expect(detKompas?.params?.targetArah).toBe('TL');

      // 3. Tabel Turus
      const detTurus = detectStimulusFromSoalText('Perhatikan tabel frekuensi data dan turus tentang jenis olahraga kegemaran siswa berikut!', 'matematika');
      expect(detTurus?.type).toBe('tabel_turus');

      // 4. Spinner Peluang
      const detSpinner = detectStimulusFromSoalText('Sebuah roda putar (spinner) dengan 8 bagian berwarna diputar satu kali. Peluang jarum berhenti pada warna merah adalah...', 'matematika');
      expect(detSpinner?.type).toBe('spinner_peluang');
      expect(detSpinner?.params?.bagian).toBe(8);

      // 5. Pola Gambar
      const detPola = detectStimulusFromSoalText('Perhatikan barisan pola gambar berikut! Banyaknya lingkaran pada pola ke-4 adalah...', 'matematika');
      expect(detPola?.type).toBe('pola_gambar');
      expect(detPola?.params?.targetSuku).toBe(4);

      // 6. Flowchart
      const detFlow = detectStimulusFromSoalText('Perhatikan diagram alir (flowchart) algoritma menentukan bilangan ganjil atau genap berikut! Simbol belah ketupat menunjukkan...', 'koding');
      expect(detFlow?.type).toBe('flowchart');
    });

    it('should generate all 12 Stage 3 & 4 visual stimulus SVGs with correct dimensions', () => {
      const templates = [
        { type: 'termometer', w: 380, h: 270 },
        { type: 'gelas_ukur', w: 460, h: 285 },
        { type: 'pohon_faktor', w: 420, h: 280 },
        { type: 'grid_matriks_100', w: 420, h: 250 },
        { type: 'rambu_lalu_lintas', w: 380, h: 260 },
        { type: 'piring_gizi_seimbang', w: 450, h: 280 },
        { type: 'lapangan_olahraga', w: 420, h: 260 },
        { type: 'preposition_place', w: 400, h: 250 },
        { type: 'tangga_nada', w: 420, h: 250 },
        { type: 'lingkaran_warna', w: 430, h: 260 },
        { type: 'struktur_pemda', w: 400, h: 280 },
        { type: 'grid_maze_koding', w: 420, h: 260 }
      ];

      for (const t of templates) {
        const res = generateVisualStimulus({ type: t.type, params: {} });
        expect(res, `Failed for ${t.type}`).not.toBeNull();
        expect(res?.width).toBe(t.w);
        expect(res?.height).toBe(t.h);
        expect(res?.svg).toContain('<svg');
        expect(res?.svg).toContain('</svg>');
      }
    });

    it('should detect Stage 3 & 4 stimulus types from soal text accurately', () => {
      // 1. Termometer
      const dTermo = detectStimulusFromSoalText('Sebuah termometer laboratorium menunjukkan suhu zat cair sebesar 45 °C.', 'ipa');
      expect(dTermo?.type).toBe('termometer');
      expect(dTermo?.params?.suhu).toBe(45);

      // 2. Gelas Ukur
      const dGelas = detectStimulusFromSoalText('Sebuah batu dimasukkan ke dalam gelas ukur berisi air dengan volume awal 50 ml dan volume akhir 75 ml.', 'ipa');
      expect(dGelas?.type).toBe('gelas_ukur');
      expect(dGelas?.params?.v1).toBe(50);
      expect(dGelas?.params?.v2).toBe(75);

      // 3. Pohon Faktor
      const dPohon = detectStimulusFromSoalText('Buatlah pohon faktor untuk mencari faktorisasi prima dari bilangan 24!', 'matematika');
      expect(dPohon?.type).toBe('pohon_faktor');
      expect(dPohon?.params?.bilangan).toBe(24);

      // 4. Grid Matriks 100
      const dGrid100 = detectStimulusFromSoalText('Perhatikan gambar grid 100 petak berikut! Daerah yang diarsir menunjukkan nilai desimal 35 persen.', 'matematika');
      expect(dGrid100?.type).toBe('grid_matriks_100');

      // 5. Rambu Lalu Lintas
      const dRambu = detectStimulusFromSoalText('Perhatikan gambar rambu lalu lintas dilarang parkir berikut ini!', 'bahasa_indonesia');
      expect(dRambu?.type).toBe('rambu_lalu_lintas');

      // 6. Piring Gizi Seimbang
      const dPiring = detectStimulusFromSoalText('Perhatikan panduan pedoman gizi seimbang piring makanku berikut ini!', 'pjok');
      expect(dPiring?.type).toBe('piring_gizi_seimbang');

      // 7. Lapangan Olahraga
      const dLap = detectStimulusFromSoalText('Perhatikan denah lapangan sepak bola dan area kotak penalti berikut!', 'pjok');
      expect(dLap?.type).toBe('lapangan_olahraga');

      // 8. Preposition of Place
      const dPrep = detectStimulusFromSoalText('Look at the picture! Where is the ball? The ball is on the box.', 'bahasa_inggris');
      expect(dPrep?.type).toBe('preposition_place');

      // 9. Tangga Nada
      const dNada = detectStimulusFromSoalText('Perhatikan notasi not balok pada garis paranada kunci G berikut ini!', 'sbdp');
      expect(dNada?.type).toBe('tangga_nada');

      // 10. Lingkaran Warna
      const dWarna = detectStimulusFromSoalText('Berdasarkan teori lingkaran warna, percampuran warna primer merah dan kuning menghasilkan warna...', 'sbdp');
      expect(dWarna?.type).toBe('lingkaran_warna');

      // 11. Struktur Pemda
      const dPemda = detectStimulusFromSoalText('Dalam hirarki pemerintahan daerah, wilayah kecamatan dipimpin oleh seorang...', 'pancasila');
      expect(dPemda?.type).toBe('struktur_pemda');

      // 12. Grid Maze Koding
      const dMaze = detectStimulusFromSoalText('Bantulah robot menyelesaikan labirin maze koding dengan susunan blok perintah!', 'koding');
      expect(dMaze?.type).toBe('grid_maze_koding');
    });
  });

  describe('Enterprise Architecture & Registry Integrity Tests', () => {
    it('should register 100% of all 200 catalog templates into VISUAL_RENDERER_REGISTRY with zero gaps', () => {
      const catalog = getVisualCatalog();
      expect(catalog.length).toBe(200);

      const registeredTypes = getRegisteredVisualTypes();
      expect(registeredTypes.length).toBeGreaterThanOrEqual(200);

      for (const item of catalog) {
        expect(isKnownVisualType(item.id), `Template ID "${item.id}" must be registered in VISUAL_RENDERER_REGISTRY`).toBe(true);
        expect(VISUAL_RENDERER_REGISTRY[item.id], `Registry entry for "${item.id}" must be defined`).toBeDefined();
        expect(typeof VISUAL_RENDERER_REGISTRY[item.id].render, `Renderer for "${item.id}" must be a function`).toBe('function');
      }
    });

    it('should correctly handle isKnownVisualType for valid and invalid types', () => {
      expect(isKnownVisualType('balok')).toBe(true);
      expect(isKnownVisualType('BALOK')).toBe(true);
      expect(isKnownVisualType('rantai_makanan_laut')).toBe(true);
      expect(isKnownVisualType('non_existent_visual_type_xyz')).toBe(false);
      expect(isKnownVisualType('')).toBe(false);
    });

    it('should validate that all 200 catalog items use valid consolidated VisualCategory types', () => {
      const allowedCategories = new Set([
        'Geometri 2D',
        'Geometri 3D',
        'Pecahan',
        'Matematika Bilangan',
        'Statistik',
        'Pengukuran',
        'Sains / IPAS',
        'Literasi & Sosial',
        'Koding & Komputasi',
        'PJOK & Kesehatan',
        'Bahasa',
        'Seni & Budaya (SBdP)',
        'Pancasila & Kewarganegaraan'
      ]);

      const catalog = getVisualCatalog();
      const usedCategories = new Set(catalog.map(item => item.category));

      expect(usedCategories.size).toBe(13);
      for (const cat of usedCategories) {
        expect(allowedCategories.has(cat), `Category "${cat}" must be a member of consolidated VisualCategory union`).toBe(true);
      }
    });

    it('should contain a declarative DETECTION_RULES array with valid match & extract handlers', () => {
      expect(Array.isArray(DETECTION_RULES)).toBe(true);
      expect(DETECTION_RULES.length).toBeGreaterThanOrEqual(200);

      for (const rule of DETECTION_RULES) {
        expect(typeof rule.id).toBe('string');
        expect(typeof rule.match).toBe('function');
        expect(typeof rule.extract).toBe('function');
      }
    });

    it('should detect fallback catalog templates in detectStimulusFromSoalText', () => {
      const detBatang = detectStimulusFromSoalText('Perhatikan sajian diagram batang data penjualan buku berikut!', 'Matematika');
      expect(detBatang?.type).toBe('diagram_batang');

      const detGaris = detectStimulusFromSoalText('Perhatikan grafik diagram garis suhu badan pasien selama dirawat!', 'Matematika');
      expect(detGaris?.type).toBe('diagram_garis');

      const detPecahanPersegi = detectStimulusFromSoalText('Perhatikan arsiran persegi pada gambar berikut untuk menyatakan pecahan!', 'Matematika');
      expect(detPecahanPersegi?.type).toBe('pecahan_persegi');

      const detGarisBilangan = detectStimulusFromSoalText('Tentukan titik P pada garis bilangan berikut!', 'Matematika');
      expect(detGarisBilangan?.type).toBe('garis_bilangan');
    });
  });

  describe('Enterprise Visual Stimulus Improvements & Primitives', () => {
    describe('SVG Primitives Builder', () => {
      it('should generate valid svgCanvas with accessibility attributes', () => {
        const svg = svgCanvas({
          width: 400,
          height: 250,
          title: 'Uji Stimulus Geometri',
          desc: 'Diagram balok 3D untuk asesmen matematika',
          content: '<circle cx="200" cy="125" r="50" fill="#38bdf8"/>'
        });

        expect(svg).toContain('<svg');
        expect(svg).toContain('role="img"');
        expect(svg).toContain('aria-labelledby');
        expect(svg).toContain('<title id=');
        expect(svg).toContain('Uji Stimulus Geometri</title>');
        expect(svg).toContain('<desc id=');
        expect(svg).toContain('Diagram balok 3D untuk asesmen matematika</desc>');
        expect(svg).toContain('viewBox="0 0 400 250"');
        expect(svg).toContain('</svg>');
      });

      it('should generate header banner with category badge and subtitle', () => {
        const header = svgHeader({
          title: 'Hukum Newton II',
          subtitle: 'Analisis percepatan benda dan resultan gaya',
          badge: 'FISIKA & MEKANIKA',
          cx: 250
        });

        expect(header).toContain('FISIKA &amp; MEKANIKA');
        expect(header).toContain('Hukum Newton II');
        expect(header).toContain('Analisis percepatan benda');
      });

      it('should generate crisp target badge and bottom prompt', () => {
        const badge = svgTargetBadge(150, 80, 'A', 11);
        expect(badge).toContain('<circle cx="150" cy="80" r="11"');
        expect(badge).toContain('[A]');

        const prompt = svgBottomPrompt('Perhatikan arah panah gaya pada gambar di atas!', 400, 220);
        expect(prompt).toContain('Perhatikan arah panah gaya pada gambar di atas!');
        expect(prompt).toContain('rect');
      });

      it('should generate dimension lines, ground shadow, and enterprise defs', () => {
        const dim = svgDimensionLine(50, 100, 250, 100, 'p = 15 cm', 'h');
        expect(dim).toContain('p = 15 cm');
        expect(dim).toContain('dimension-line');

        const shadow = svgGroundShadow(200, 180, 80, 12, 'testShadow');
        expect(shadow).toContain('ellipse cx="200" cy="180" rx="80" ry="12" fill="url(#testShadow)"');

        const defs = svgCommonDefs('ent');
        expect(defs).toContain('id="entDropShadow"');
        expect(defs).toContain('id="entGroundShadow"');
        expect(defs).toContain('id="entCardBg"');
      });
    });

    describe('Runtime Number Validation (safeNum)', () => {
      it('should validate finite numbers and clamp between min and max', () => {
        expect(safeNum(25, 10)).toBe(25);
        expect(safeNum('42', 10)).toBe(42);
        expect(safeNum(5, 10, 10, 100)).toBe(10);
        expect(safeNum(150, 10, 10, 100)).toBe(100);
      });

      it('should prevent NaN, undefined, and non-numeric injection', () => {
        expect(safeNum(NaN, 50)).toBe(50);
        expect(safeNum(undefined, 50)).toBe(50);
        expect(safeNum(null, 50)).toBe(0); // Number(null) is 0, which is finite
        expect(safeNum('<script>', 50)).toBe(50);
        expect(safeNum('invalid', 20)).toBe(20);
        expect(safeNum(Infinity, 50)).toBe(50);
        expect(safeNum(-Infinity, 50)).toBe(50);
      });
    });

    describe('SVG Output Optimization (minifySvg)', () => {
      it('should remove XML comments and collapse excessive whitespace', () => {
        const raw = `
          <svg viewBox="0 0 100 100">
            <!-- This is an XML comment -->
            <rect x="10"    y="20"   width="30" height="40" />
            <!-- Another comment -->
          </svg>
        `;
        const minified = minifySvg(raw);
        expect(minified).not.toContain('<!--');
        expect(minified).not.toContain('This is an XML comment');
        expect(minified.startsWith('<svg')).toBe(true);
        expect(minified.endsWith('</svg>')).toBe(true);
        expect(minified).not.toMatch(/\s{2,}/);
      });
    });

    describe('Accessibility Injection in generateVisualStimulus', () => {
      it('should automatically inject <title>, <desc>, and role="img" when missing', () => {
        const result = generateVisualStimulus({
          type: 'sudut_luar_segitiga',
          params: { sudutA: 45, sudutB: 65, label: 'Z' },
          caption: 'Sudut Luar Segitiga Uji'
        });

        expect(result).not.toBeNull();
        expect(result?.svg).toContain('role="img"');
        expect(result?.svg).toContain('<title id="stimulus-title">Sudut Luar Segitiga Uji</title>');
        expect(result?.svg).toContain('<desc id="stimulus-desc">');
      });
    });

    describe('Upgraded Batch 3 Geometry Templates', () => {
      it('should render upgraded sudut_luar_segitiga with defs, gradient, and ground shadow', () => {
        const svg = renderSudutLuarSegitigaSvg({ sudutA: 55, sudutB: 65, label: 'K' });
        expect(svg).toContain('<defs>');
        expect(svg).toContain('linearGradient id="triBodyGrad"');
        expect(svg).toContain('radialGradient id="triFloorShdw"');
        expect(svg).toContain('fill="url(#triFloorShdw)"');
        expect(svg).toContain('55°');
        expect(svg).toContain('65°');
        expect(svg).toContain('[K]');
      });

      it('should render upgraded jaring_kerucut with defs, warm gradient, and ground shadow', () => {
        const svg = renderJaringKerucutSvg({ r: 9, s: 28, label: 'M' });
        expect(svg).toContain('<defs>');
        expect(svg).toContain('linearGradient id="coneJuringGrad"');
        expect(svg).toContain('radialGradient id="coneBaseGrad"');
        expect(svg).toContain('radialGradient id="coneFloorShdw"');
        expect(svg).toContain('r = 9 cm');
        expect(svg).toContain('s = 28 cm');
        expect(svg).toContain('[M]');
      });

      it('should render upgraded jaring_tabung with crisp typography >= 9.5px and shadows', () => {
        const svg = renderJaringTabungSvg({ r: 8, t: 15, label: 'P' });
        expect(svg).toContain('<defs>');
        expect(svg).toContain('radialGradient id="tubeLidGrad"');
        expect(svg).toContain('linearGradient id="tubeBodyGrad"');
        expect(svg).toContain('font-size="9.5"');
        expect(svg).not.toContain('font-size="7.5"');
        expect(svg).toContain('r = 8');
        expect(svg).toContain('t = 15 cm');
        expect(svg).toContain('[P]');
      });

      it('should render upgraded luas_permukaan_gabungan with isometric gradients and ground shadow', () => {
        const svg = renderLuasPermukaanGabunganSvg({ p: 14, l: 10, t: 16, label: 'G' });
        expect(svg).toContain('<defs>');
        expect(svg).toContain('linearGradient id="balokFrontGradLP"');
        expect(svg).toContain('linearGradient id="limasFrontGradLP"');
        expect(svg).toContain('radialGradient id="gabunganFloorShdw"');
        expect(svg).toContain('p = 14 cm');
        expect(svg).toContain('l = 10 cm');
        expect(svg).toContain('t = 16 cm');
        expect(svg).toContain('[G]');
      });
    });
  });
});

