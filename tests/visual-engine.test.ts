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
  generateVisualStimulus,
  detectStimulusFromSoalText
} from '../src/lib/visual-engine';
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

    it('8. renderPictogramSvg should render pictogram with custom icons and legend', () => {
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
      expect(svg).toContain('(30)');
      expect(svg).toContain('(50)');
    });

    it('9. renderSimetriLipatSvg should render symmetry axes with dash lines', () => {
      const svgPersegi = renderSimetriLipatSvg({ bangun: 'persegi' });
      expect(svgPersegi).toContain('<svg');
      expect(svgPersegi).toContain('Persegi');
      expect(svgPersegi).toContain('Jumlah garis simetri = <tspan font-weight="bold" fill="#e11d48">4</tspan>');

      const svgLingkaran = renderSimetriLipatSvg({ bangun: 'lingkaran' });
      expect(svgLingkaran).toContain('∞ (tak terhingga)');
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
  });
});
