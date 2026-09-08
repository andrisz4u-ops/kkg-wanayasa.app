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
  renderDiagramLingkaranSvg,
  renderOrganPencernaanSvg,
  renderRantaiMakananSvg,
  generateVisualStimulus,
  detectStimulusFromSoalText
} from '../src/lib/visual-engine';

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
    it('should render fraction circles with shaded portions', () => {
      const svg = renderPecahanLingkaranSvg({ pembagi: 4, diarsir: 3 });
      expect(svg).toContain('<svg');
      expect(svg).toContain('3 dari 4 bagian diarsir');
      expect(svg).toContain('#38bdf8'); // warna arsiran
    });

    it('should render fraction grid with smart auto-calculation', () => {
      // Test 12 = 4x3 (balanced grid)
      const svg12 = renderPecahanPersegiSvg({ totalKotak: 12, diarsir: 7 });
      expect(svg12).toContain('7 dari 12 kotak diarsir');

      // Test 6 = 3x2
      const svg6 = renderPecahanPersegiSvg({ totalKotak: 6, diarsir: 4 });
      expect(svg6).toContain('4 dari 6 kotak diarsir');
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
    it('should render respiratory organ with dynamic pointer X', () => {
      const svg = renderOrganPernapasanSvg({ pointer: 'trakea', label: 'X' });
      expect(svg).toContain('Sistem Pernapasan Manusia');
      expect(svg).toContain('huruf "X"');
      expect(svg).toContain('marker-end="url(#arrow)"');
    });

    it('should render digestive organ with dynamic pointer X', () => {
      const svg = renderOrganPencernaanSvg({ pointer: 'lambung', label: 'X' });
      expect(svg).toContain('Sistem Pencernaan Manusia');
      expect(svg).toContain('huruf "X"');
      expect(svg).toContain('Lambung');
      expect(svg).toContain('Usus');
    });

    it('should render digestive organ pointing to different parts', () => {
      const mulut = renderOrganPencernaanSvg({ pointer: 'mulut', label: 'P' });
      expect(mulut).toContain('huruf "P"');

      const usus = renderOrganPencernaanSvg({ pointer: 'usus halus', label: 'Q' });
      expect(usus).toContain('huruf "Q"');
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
  });

  describe('Measurement & Time', () => {
    it('should render analog clock with accurate hands for given time', () => {
      const svg = renderJamAnalogSvg({ jam: 8, menit: 15 });
      expect(svg).toContain('Pukul 08.15');
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
        'diagram_lingkaran', 'organ_pencernaan', 'rantai_makanan'
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
      // Pencernaan
      const pencernaan = detectStimulusFromSoalText('Perhatikan gambar sistem pencernaan manusia! Organ yang ditunjuk huruf X adalah lambung.', 'IPAS');
      expect(pencernaan?.type).toBe('organ_pencernaan');
      expect(pencernaan?.params?.pointer).toBe('lambung');

      // Rantai Makanan
      const rantai = detectStimulusFromSoalText('Perhatikan rantai makanan berikut! Organisme yang berperan sebagai produsen adalah...', 'IPAS');
      expect(rantai?.type).toBe('rantai_makanan');
      expect(rantai?.params?.pointer).toBe('produsen');

      // Diagram Lingkaran (Pie Chart)
      const pie = detectStimulusFromSoalText('Perhatikan diagram lingkaran berikut yang menunjukkan data hobi siswa kelas 5!', 'Matematika');
      expect(pie?.type).toBe('diagram_lingkaran');
    });
  });
});
