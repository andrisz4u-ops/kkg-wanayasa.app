/**
 * detector.ts
 * Automatic visual stimulus detector using NLP heuristics on question stem text
 */

import { VisualStimulusConfig } from './types';

/**
 * Deteksi otomatis stimulus visual dari teks soal jika AI lupa menyertakan format visual_stimulus
 */
export function detectStimulusFromSoalText(soalText: string, mapel: string): VisualStimulusConfig | null {
  const text = (soalText || '').toLowerCase();
  // Pisahkan teks pertanyaan inti dari opsi pilihan ganda agar angka opsi (A. 26 cm, B. 28 cm) tidak disalahartikan sebagai ukuran bangun (kecuali simbol °C)
  const stemText = text.split(/(?<![°\w])\b[a-d]\s*[\.\)]/i)[0] || text;

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

  // 0b1. Keliling Gabungan
  if (text.includes('keliling gabungan') || (text.includes('keliling') && text.includes('bangun gabungan'))) {
    return { type: 'keliling_gabungan', params: { p: 14, l: 10 } };
  }

  // 0c1. Jaring-jaring Limas Segiempat
  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && (text.includes('segiempat') || text.includes('persegi'))) {
    return { type: 'jaring_limas_segiempat', params: { s: 8, t: 10 } };
  }

  // 0c2. Jaring-jaring Limas Segitiga
  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && text.includes('segitiga')) {
    return { type: 'jaring_limas_segitiga', params: { s: 8 } };
  }

  // 0c3. Jaring-jaring Prisma Segitiga
  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('prisma') && text.includes('segitiga')) {
    return { type: 'jaring_prisma_segitiga', params: { a: 6, t: 8, p: 12 } };
  }

  // 0c4. Tembereng & Juring Lingkaran
  if (text.includes('tembereng') || (text.includes('lingkaran') && text.includes('tali busur') && text.includes('juring'))) {
    return { type: 'lingkaran_tembereng', params: { r: 14, sudut: 90 } };
  }

  // 0c5. Segi Enam Beraturan (Heksagon)
  if (text.includes('segi enam beraturan') || text.includes('heksagon')) {
    return { type: 'segi_enam_beraturan', params: { s: 8 } };
  }

  // 0c6. Transformasi Geometri (Refleksi & Translasi)
  if (text.includes('refleksi') || text.includes('pencerminan') || text.includes('cermin')) {
    return { type: 'transformasi_refleksi', params: { sumbu: 'vertikal' } };
  }
  if (text.includes('translasi') || text.includes('pergeseran bangun')) {
    return { type: 'transformasi_translasi', params: { dx: 3, dy: 2 } };
  }

  // 0c7. Diagram Khusus (Batang Ganda, Garis Ganda, Dot Plot, Lingkaran Derajat, Batang Mendatar, Tabel Kontingensi)
  if (text.includes('lingkaran derajat') || (text.includes('diagram lingkaran') && (text.includes('derajat') || text.includes('360°') || text.includes('360 derajat')))) {
    return { type: 'diagram_lingkaran_derajat', params: { label: 'X' } };
  }
  if (text.includes('batang ganda') || (text.includes('diagram batang') && (text.includes('ganda') || text.includes('perbandingan') || text.includes('laki-laki dan perempuan')))) {
    return { type: 'diagram_batang_ganda', params: { label: 'X' } };
  }
  if (text.includes('garis ganda') || (text.includes('diagram garis') && (text.includes('ganda') || text.includes('dua tahun') || text.includes('2023 dan 2024')))) {
    return { type: 'diagram_garis_ganda', params: { label: 'X' } };
  }
  if (text.includes('dot plot') || text.includes('diagram titik') || text.includes('line plot')) {
    return { type: 'dot_plot', params: { label: 'X' } };
  }
  if (text.includes('batang mendatar') || text.includes('batang horizontal') || (text.includes('diagram batang') && text.includes('mendatar'))) {
    return { type: 'diagram_batang_horizontal', params: { label: 'X' } };
  }
  if (text.includes('tabel kontingensi') || text.includes('frekuensi dua arah') || (text.includes('kontingensi') && text.includes('tabel'))) {
    return { type: 'tabel_kontingensi', params: { label: 'X' } };
  }

  // 0c8. Aljabar & Bilangan Khusus
  if (text.includes('dienes') || text.includes('blok dienes') || text.includes('balok dienes') || text.includes('base ten blocks')) {
    return { type: 'blok_dienes', params: { ribuan: 1, ratusan: 2, puluhan: 4, satuan: 5 } };
  }
  if (text.includes('sempoa') || text.includes('abakus') || text.includes('soroban')) {
    return { type: 'sempoa_abakus', params: { nilai: '3527' } };
  }
  if (text.includes('tabel nilai tempat') || (text.includes('nilai tempat') && text.includes('tabel'))) {
    return { type: 'tabel_nilai_tempat', params: { angka: '47285' } };
  }
  if (text.includes('garis bilangan pecahan') || (text.includes('garis bilangan') && text.includes('pecahan'))) {
    return { type: 'garis_bilangan_pecahan', params: { penyebut: 4, target: 3 } };
  }
  if (text.includes('garis bilangan desimal') || (text.includes('garis bilangan') && (text.includes('desimal') || text.includes('koma')))) {
    return { type: 'garis_bilangan_desimal', params: { min: 1.0, max: 2.0, target: 1.7 } };
  }
  if (text.includes('perkalian lattice') || text.includes('metode kisi') || text.includes('tulang napier') || text.includes('perkalian kisi')) {
    return { type: 'perkalian_lattice', params: { num1: 34, num2: 25 } };
  }
  if (text.includes('pola ubin') || text.includes('barisan ubin') || (text.includes('ubin') && text.includes('pola ke-'))) {
    return { type: 'pola_ubin', params: { label: 'X' } };
  }
  if (text.includes('pita pecahan') || text.includes('fraction strips') || text.includes('batang pecahan')) {
    return { type: 'pita_pecahan', params: { label: 'X' } };
  }
  if (text.includes('uang rupiah') || (text.includes('uang') && (text.includes('kertas') || text.includes('logam') || text.includes('pecahan uang')))) {
    return { type: 'matriks_nilai_uang', params: { label: 'X' } };
  }

  // 0c9. Peluang Khusus (Papan Galton & Kartu Peluang)
  if (text.includes('papan galton') || text.includes('quincunx') || text.includes('galton board') || (text.includes('kelereng') && text.includes('pasak'))) {
    return { type: 'papan_galton_peluang', params: { label: 'X' } };
  }
  if (text.includes('kartu peluang') || (text.includes('kartu') && text.includes('peluang') && (text.includes('terambil') || text.includes('ruang sampel')))) {
    return { type: 'kartu_peluang', params: { label: 'X' } };
  }

  // 0c10. Instrumen Presisi & Tangga Satuan
  if (text.includes('stopwatch') || text.includes('stop watch')) {
    const sMatch = stemText.match(/(\d+)\s*(?:detik|sekon)/i);
    const mMatch = stemText.match(/(\d+)\s*menit/i);
    return { type: 'stopwatch_analog', params: { detik: sMatch ? parseInt(sMatch[1]) : 35, menit: mMatch ? parseInt(mMatch[1]) : 2 } };
  }
  if (text.includes('jangka sorong') || text.includes('vernier caliper')) {
    return { type: 'jangka_sorong', params: { utama: 2.3, nonius: 4 } };
  }
  if (text.includes('bejana literan') || text.includes('takaran beras') || text.includes('literan beras')) {
    return { type: 'bejana_literan', params: { kapasitas: 1, terisi: 0.75 } };
  }
  if (text.includes('gelas erlenmeyer') || text.includes('labu erlenmeyer') || text.includes('erlenmeyer')) {
    return { type: 'gelas_erlenmeyer', params: { volume: 150, max: 250 } };
  }
  if (text.includes('meteran gulung') || text.includes('meteran pita') || text.includes('meteran tukang')) {
    return { type: 'meteran_gulung', params: { panjang: 3.5, unit: 'm' } };
  }
  if (text.includes('tangga satuan panjang') || (text.includes('satuan panjang') && (text.includes('km') || text.includes('tangga')))) {
    return { type: 'tangga_satuan_panjang', params: { dari: 'm', ke: 'cm' } };
  }
  if (text.includes('tangga satuan massa') || text.includes('tangga satuan berat') || (text.includes('satuan massa') && text.includes('tangga'))) {
    return { type: 'tangga_satuan_massa', params: { dari: 'kg', ke: 'g' } };
  }
  if (text.includes('tangga satuan volume') || text.includes('satuan liter') || (text.includes('satuan volume') && text.includes('tangga'))) {
    return { type: 'tangga_satuan_volume', params: { dari: 'l', ke: 'ml' } };
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

  // 0i. Koordinat Poligon / Kartesius
  if (text.includes('poligon kartesius') || (text.includes('koordinat') && (text.includes('poligon') || text.includes('luas segitiga pada bidang')))) {
    return { type: 'koordinat_poligon', params: { titik: [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 3, y: 5 }] } };
  }

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
  if (!text.includes('meteran') && !text.includes('not balok') && text.includes('balok') && (text.includes('panjang') || text.includes('volume') || text.includes('rusuk') || text.includes('cm'))) {
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

  // 21. Jam Dinding / Waktu & Sudut Jarum Jam
  if (text.includes('sudut jarum jam') || (text.includes('jarum jam') && text.includes('sudut')) || (text.includes('sudut') && (text.includes('pukul') || text.includes('jam')))) {
    const jamMatch = stemText.match(/pukul\s*(\d{1,2})[.:](\d{2})/i) || stemText.match(/(\d{1,2})[.:](\d{2})/);
    const j = jamMatch ? parseInt(jamMatch[1]) : 3;
    const m = jamMatch ? parseInt(jamMatch[2]) : 0;
    return { type: 'sudut_jarum_jam', params: { jam: j, menit: m } };
  }

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

  // 22. Diagram Lingkaran (Pie Chart: Derajat / Persentase / Statistik)
  if (text.includes('lingkaran derajat') || (text.includes('diagram lingkaran') && (text.includes('derajat') || text.includes('360°') || text.includes('360 derajat')))) {
    return { type: 'diagram_lingkaran_derajat', params: { label: 'X' } };
  }

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

  // 31. IPAS: Peredaran Darah Manusia & Jantung
  if (text.includes('peredaran darah') || text.includes('sirkulasi darah') || (text.includes('jantung') && (text.includes('bilik') || text.includes('serambi') || text.includes('aorta') || text.includes('arteri') || text.includes('vena')))) {
    let pointer = 'bilik_kiri';
    if (stemText.includes('serambi kanan') || stemText.includes('atrium kanan')) pointer = 'serambi_kanan';
    else if (stemText.includes('bilik kanan') || stemText.includes('ventrikel kanan')) pointer = 'bilik_kanan';
    else if (stemText.includes('serambi kiri') || stemText.includes('atrium kiri')) pointer = 'serambi_kiri';
    else if (stemText.includes('bilik kiri') || stemText.includes('ventrikel kiri')) pointer = 'bilik_kiri';
    else if (stemText.includes('aorta')) pointer = 'aorta';
    else if (stemText.includes('vena cava') || stemText.includes('vena kava')) pointer = 'vena_cava';
    else if (stemText.includes('arteri pulmonalis')) pointer = 'arteri_pulmonalis';
    else if (stemText.includes('vena pulmonalis')) pointer = 'vena_pulmonalis';
    else if (stemText.includes('paru')) pointer = 'paru';
    return { type: 'peredaran_darah', params: { pointer, label: 'X' } };
  }

  // 32. IPAS: Gerhana Matahari & Gerhana Bulan
  if (text.includes('gerhana') || (text.includes('bayangan') && (text.includes('umbra') || text.includes('penumbra')))) {
    let jenis: 'matahari' | 'bulan' = 'matahari';
    if (text.includes('gerhana bulan') || (text.includes('bulan') && text.includes('bumi berada di antara'))) jenis = 'bulan';

    let pointer = 'umbra';
    if (stemText.includes('penumbra')) pointer = 'penumbra';
    else if (stemText.includes('bulan')) pointer = 'bulan';
    else if (stemText.includes('bumi')) pointer = 'bumi';
    return { type: 'gerhana', params: { jenis, pointer, label: 'X' } };
  }

  // 33. IPAS: Pesawat Sederhana (Tuas/Pengungkit & Katrol)
  if (text.includes('tuas') || text.includes('pengungkit') || text.includes('katrol') || (text.includes('titik tumpu') && text.includes('kuasa'))) {
    if (text.includes('katrol')) {
      const tipeKatrol = text.includes('bebas') || text.includes('bergerak') ? 'bebas' : 'tetap';
      let pointer = 'tumpu';
      if (stemText.includes('beban')) pointer = 'beban';
      else if (stemText.includes('kuasa') || stemText.includes('tali')) pointer = 'kuasa';
      return { type: 'pesawat_sederhana', params: { jenis: 'katrol', tipeKatrol, pointer, label: 'X' } };
    }

    let tipeTuas: 1 | 2 | 3 = 1;
    if (text.includes('jenis 2') || text.includes('jenis kedua') || text.includes('golongan 2') || text.includes('gerobak') || text.includes('pemecah kemiri')) tipeTuas = 2;
    else if (text.includes('jenis 3') || text.includes('jenis ketiga') || text.includes('golongan 3') || text.includes('pinset') || text.includes('sekop') || text.includes('stapler')) tipeTuas = 3;

    let pointer = 'tumpu';
    if (stemText.includes('beban') || stemText.includes('batu') || stemText.includes('berat')) pointer = 'beban';
    else if (stemText.includes('kuasa') || stemText.includes('tangan') || stemText.includes('gaya')) pointer = 'kuasa';
    return { type: 'pesawat_sederhana', params: { jenis: 'tuas', tipeTuas, pointer, label: 'X' } };
  }

  // 34. IPAS: Pancaindra (Anatomi Bola Mata & Telinga)
  if (text.includes('pancaindra') || text.includes('indra penglihatan') || text.includes('indra pendengaran') || (text.includes('mata') && (text.includes('kornea') || text.includes('retina') || text.includes('pupil') || text.includes('lensa mata'))) || (text.includes('telinga') && (text.includes('gendang') || text.includes('koklea') || text.includes('rumah siput') || text.includes('eustachius')))) {
    if (text.includes('telinga') || text.includes('pendengaran') || text.includes('koklea') || text.includes('siput')) {
      let pointer = 'gendang';
      if (stemText.includes('koklea') || stemText.includes('siput')) pointer = 'koklea';
      else if (stemText.includes('saluran') || stemText.includes('liang')) pointer = 'saluran';
      else if (stemText.includes('daun')) pointer = 'daun';
      else if (stemText.includes('eustachius')) pointer = 'eustachius';
      return { type: 'pancaindra', params: { organ: 'telinga', pointer, label: 'X' } };
    }

    let pointer = 'kornea';
    if (stemText.includes('pupil')) pointer = 'pupil';
    else if (stemText.includes('lensa')) pointer = 'lensa';
    else if (stemText.includes('retina')) pointer = 'retina';
    else if (stemText.includes('saraf')) pointer = 'saraf';
    else if (stemText.includes('iris')) pointer = 'iris';
    return { type: 'pancaindra', params: { organ: 'mata', pointer, label: 'X' } };
  }

  // 35. Matematika: Timbangan Neraca 2 Lengan & Neraca Khusus
  if (text.includes('neraca pasar') || text.includes('timbangan bebek')) {
    return { type: 'neraca_pasar', params: { bebanKg: 2, anakKg: 2 } };
  }

  if (text.includes('timbangan digital') || text.includes('neraca digital')) {
    const gMatch = stemText.match(/(\d+)\s*(?:gram|g\b)/i);
    return { type: 'timbangan_digital', params: { massa: gMatch ? parseInt(gMatch[1]) : 450, unit: 'g' } };
  }

  if (text.includes('neraca pegas') || text.includes('dinamometer')) {
    const nMatch = stemText.match(/(\d+)\s*(?:newton|n\b)/i);
    return { type: 'dinamometer_pegas', params: { newton: nMatch ? parseInt(nMatch[1]) : 5 } };
  }

  if (!text.includes('tangga satuan') && (text.includes('neraca') || (text.includes('timbangan') && (text.includes('lengan') || text.includes('anak timbangan') || text.includes('seimbang'))))) {
    let status: 'seimbang' | 'miring_kiri' | 'miring_kanan' = 'seimbang';
    if (text.includes('miring ke kiri') || text.includes('miring kiri') || text.includes('lebih berat ke kiri')) status = 'miring_kiri';
    else if (text.includes('miring ke kanan') || text.includes('miring kanan') || text.includes('lebih berat ke kanan')) status = 'miring_kanan';

    return { type: 'timbangan_neraca', params: { status, pointer: 'kiri', label: 'X' } };
  }

  // 36. Matematika/IPAS: Arah Mata Angin & Denah Spasial
  if (text.includes('mata angin') || text.includes('arah mata angin') || (text.includes('denah') && (text.includes('sebelah utara') || text.includes('sebelah timur') || text.includes('sebelah selatan') || text.includes('sebelah barat')))) {
    const mode = text.includes('denah') || text.includes('posisi') || text.includes('lokasi') ? 'denah' : 'kompas';
    let targetArah = 'TL';
    if (stemText.includes('timur laut')) targetArah = 'TL';
    else if (stemText.includes('tenggara')) targetArah = 'TG';
    else if (stemText.includes('barat daya')) targetArah = 'BD';
    else if (stemText.includes('barat laut')) targetArah = 'BL';
    else if (stemText.includes('utara')) targetArah = 'U';
    else if (stemText.includes('selatan')) targetArah = 'S';
    else if (stemText.includes('timur')) targetArah = 'T';
    else if (stemText.includes('barat')) targetArah = 'B';

    return { type: 'mata_angin', params: { mode, targetArah, label: 'X' } };
  }

  // 37. Matematika: Tabel Turus (Tally Chart) & Frekuensi
  if (text.includes('turus') || text.includes('tally') || (text.includes('tabel') && text.includes('frekuensi') && (text.includes('coret') || text.includes('garis')))) {
    return { type: 'tabel_turus', params: { targetField: 'frekuensi', label: 'X' } };
  }

  // 38. Matematika: Roda Putar Peluang (Spinner Peluang)
  if (text.includes('spinner') || text.includes('roda putar') || (text.includes('peluang') && (text.includes('memutar') || text.includes('jarum berhenti') || text.includes('juring')))) {
    let bagian = 6;
    if (text.includes('4 bagian') || text.includes('4 juring')) bagian = 4;
    else if (text.includes('8 bagian') || text.includes('8 juring')) bagian = 8;
    return { type: 'spinner_peluang', params: { bagian, jarumKe: 1, label: 'X' } };
  }

  // 39. Matematika: Pola Gambar / Barisan Pola Geometri
  if (text.includes('pola gambar') || text.includes('barisan pola') || (text.includes('pola') && (text.includes('banyaknya lingkaran') || text.includes('banyaknya titik') || text.includes('suku berikutnya') || text.includes('pola ke-4') || text.includes('pola ke-5')))) {
    return { type: 'pola_gambar', params: { counts: [1, 3, 5, 7], targetSuku: 4, label: 'X' } };
  }

  // 40. Informatika / Koding: Diagram Alir (Flowchart)
  if (text.includes('flowchart') || text.includes('diagram alir') || (text.includes('algoritma') && (text.includes('mulai') || text.includes('keputusan') || text.includes('simbol')))) {
    let pointer: 'kondisi' | 'output_ya' | 'output_tidak' = 'kondisi';
    if (stemText.includes('output') || stemText.includes('cetak')) pointer = 'output_ya';
    return { type: 'flowchart', params: { pointer, label: 'X' } };
  }

  // 41. Pengukuran: Termometer Suhu (°C)
  if (text.includes('termometer') || (text.includes('suhu') && (text.includes('celsius') || text.includes('raksa') || text.includes('titik didih') || text.includes('skala') || text.includes('°c')))) {
    const suhuMatch = stemText.match(/(-?\d+)\s*(?:°\s*c?|celsius|derajat)/i);
    const suhu = suhuMatch ? parseInt(suhuMatch[1]) : 35;
    return { type: 'termometer', params: { suhu, unit: '°C', label: 'X' } };
  }

  // 42. Pengukuran & IPAS: Gelas Ukur & Volume Archimedes
  if (text.includes('gelas ukur') || (text.includes('volume') && (text.includes('batu') || text.includes('archimedes') || text.includes('permukaan air naik') || text.includes('massa jenis air')))) {
    const v1Match = stemText.match(/(?:awal|v1|mula-mula)\D*(\d+)/i);
    const v2Match = stemText.match(/(?:akhir|v2|setelah)\D*(\d+)/i);
    const v1 = v1Match ? parseInt(v1Match[1]) : 50;
    const v2 = v2Match ? parseInt(v2Match[1]) : 75;
    return { type: 'gelas_ukur', params: { mode: 'batu', v1, v2, label: 'X' } };
  }

  // 43. Matematika: Pohon Faktor (KPK & FPB)
  if (text.includes('pohon faktor') || text.includes('faktorisasi prima') || ((text.includes('kpk') || text.includes('fpb')) && (text.includes('pohon') || text.includes('faktor')))) {
    const bilMatch = stemText.match(/(?:bilangan|angka)\D*(\d+)/i) || stemText.match(/\b(24|36|48|60|72)\b/);
    const bilangan = bilMatch ? parseInt(bilMatch[1]) : 24;
    let targetNode: 'akar' | 'prima1' | 'prima2' | 'prima3' | 'komposit1' | 'komposit2' = 'prima3';
    if (stemText.includes('akar') || stemText.includes('puncak')) targetNode = 'akar';
    else if (stemText.includes('komposit')) targetNode = 'komposit1';
    return { type: 'pohon_faktor', params: { bilangan, targetNode, label: 'X' } };
  }

  // 44. Matematika Pecahan: Grid 100 Desimal & Persen
  if (text.includes('grid 100') || text.includes('matriks 100') || ((text.includes('desimal') || text.includes('persen')) && (text.includes('petak') || text.includes('100 kotak') || text.includes('diarsir') || text.includes('persegi 10x10')))) {
    const arsiranMatch = stemText.match(/(\d+)\s*(?:persen|%|kotak|petak)/i) || stemText.match(/0[.,](\d+)/);
    const diarsir = arsiranMatch ? parseInt(arsiranMatch[1]) : 35;
    return { type: 'grid_matriks_100', params: { diarsir, label: 'X' } };
  }

  // 45. Bahasa & Sosial: Rambu Lalu Lintas
  if (text.includes('rambu') || text.includes('lalu lintas') || text.includes('dilarang parkir') || text.includes('wajib belok')) {
    let kategori: 'larangan' | 'perintah' | 'peringatan' | 'petunjuk' = 'larangan';
    let jenis = 'dilarang_parkir';

    if (text.includes('peringatan') || text.includes('tikungan') || text.includes('penyeberangan')) {
      kategori = 'peringatan';
      jenis = text.includes('penyeberangan') ? 'penyeberangan' : 'tikungan_tajam';
    } else if (text.includes('perintah') || text.includes('wajib')) {
      kategori = 'perintah';
      jenis = 'wajib_belok_kiri';
    } else if (text.includes('petunjuk') || text.includes('rumah sakit')) {
      kategori = 'petunjuk';
      jenis = 'rumah_sakit';
    } else if (text.includes('stop')) {
      jenis = 'stop';
    }

    return { type: 'rambu_lalu_lintas', params: { kategori, jenis, label: 'X' } };
  }

  // 46. PJOK & Kesehatan: Piring Makanku (Gizi Seimbang)
  if (text.includes('piring makanku') || text.includes('gizi seimbang') || text.includes('empat sehat lima sempurna') || (text.includes('makanan pokok') && text.includes('lauk') && text.includes('sayur'))) {
    let pointer: 'makanan_pokok' | 'sayuran' | 'lauk_pauk' | 'buah' = 'makanan_pokok';
    if (stemText.includes('sayur')) pointer = 'sayuran';
    else if (stemText.includes('lauk') || stemText.includes('protein')) pointer = 'lauk_pauk';
    else if (stemText.includes('buah') || stemText.includes('vitamin')) pointer = 'buah';
    return { type: 'piring_gizi_seimbang', params: { pointer, label: 'X' } };
  }

  // 47. PJOK & Olahraga: Denah Lapangan Olahraga
  if (text.includes('lapangan sepak bola') || text.includes('lapangan bola') || text.includes('lapangan voli') || (text.includes('lapangan') && (text.includes('kotak penalti') || text.includes('garis serang') || text.includes('net voli')))) {
    const olahraga = text.includes('voli') ? 'voli' : 'sepak_bola';
    return { type: 'lapangan_olahraga', params: { olahraga, label: 'X' } };
  }

  // 48. Bahasa Inggris: Prepositions of Place
  if (text.includes('preposition') || (text.includes('where is the') && (text.includes('ball') || text.includes('box'))) || (text.includes('the ball is') && (text.includes('in') || text.includes('on') || text.includes('under') || text.includes('between')))) {
    let posisi: 'in' | 'on' | 'under' | 'between' = 'on';
    if (stemText.includes('under') || stemText.includes('di bawah')) posisi = 'under';
    else if (stemText.includes('in ') || stemText.includes('di dalam')) posisi = 'in';
    else if (stemText.includes('between') || stemText.includes('di antara')) posisi = 'between';
    return { type: 'preposition_place', params: { posisi, label: 'X' } };
  }

  // 49. SBdP Seni Musik: Garis Paranada & Tangga Nada Diatonis
  if (text.includes('tangga nada') || text.includes('paranada') || text.includes('not balok') || text.includes('kunci g') || (text.includes('nada') && (text.includes('diatonis') || text.includes('solmisasi') || text.includes('do re mi')))) {
    let nadaTarget = 'G';
    const nadaMatch = stemText.match(/\b(C|D|E|F|G|A|B|C2)\b/i);
    if (nadaMatch) nadaTarget = nadaMatch[1].toUpperCase();
    return { type: 'tangga_nada', params: { nadaTarget, label: 'X' } };
  }

  // 50. SBdP Seni Rupa: Teori & Lingkaran Warna
  if (text.includes('lingkaran warna') || text.includes('roda warna') || text.includes('warna primer') || text.includes('warna sekunder') || (text.includes('campuran warna') && (text.includes('merah') || text.includes('kuning') || text.includes('biru')))) {
    let pointer: 'sekunder' | 'primer' | 'oranye' | 'hijau' | 'ungu' = 'sekunder';
    if (stemText.includes('primer')) pointer = 'primer';
    else if (stemText.includes('hijau')) pointer = 'hijau';
    else if (stemText.includes('ungu')) pointer = 'ungu';
    return { type: 'lingkaran_warna', params: { pointer, label: 'X' } };
  }

  // 51. Pendidikan Pancasila / PKn: Struktur Hirarki Pemda
  if (text.includes('pemerintahan daerah') || text.includes('hirarki pemda') || text.includes('struktur pemda') || (text.includes('kecamatan') && text.includes('kelurahan') && (text.includes('bupati') || text.includes('camat') || text.includes('lurah')))) {
    let targetLevel: 'provinsi' | 'kabupaten' | 'kecamatan' | 'kelurahan' | 'rw' | 'rt' = 'kecamatan';
    if (stemText.includes('provinsi') || stemText.includes('gubernur')) targetLevel = 'provinsi';
    else if (stemText.includes('kabupaten') || stemText.includes('bupati') || stemText.includes('walikota')) targetLevel = 'kabupaten';
    else if (stemText.includes('kelurahan') || stemText.includes('desa') || stemText.includes('lurah') || stemText.includes('kades')) targetLevel = 'kelurahan';
    else if (stemText.includes('rw') || stemText.includes('rukun warga')) targetLevel = 'rw';
    else if (stemText.includes('rt') || stemText.includes('rukun tetangga')) targetLevel = 'rt';
    return { type: 'struktur_pemda', params: { targetLevel, label: 'X' } };
  }

  // 52. Koding & Berpikir Komputasional: Grid Maze Robot
  if (text.includes('maze') || text.includes('labirin robot') || text.includes('grid robot') || (text.includes('koding') && (text.includes('robot') || text.includes('langkah') || text.includes('navigasi') || text.includes('arah jalan')))) {
    return { type: 'grid_maze_koding', params: { label: 'X' } };
  }

  // =========================================================================
  // BATCH 1: NLP HEURISTIC DETECTORS (38 TEMPLATES)
  // =========================================================================

  // 1. Instrumen Pengukuran & Tangga Satuan
  if (text.includes('stopwatch') || text.includes('stop watch')) {
    const sMatch = stemText.match(/(\d+)\s*(?:detik|sekon)/i);
    const mMatch = stemText.match(/(\d+)\s*menit/i);
    return { type: 'stopwatch_analog', params: { detik: sMatch ? parseInt(sMatch[1]) : 35, menit: mMatch ? parseInt(mMatch[1]) : 2 } };
  }

  if (text.includes('jangka sorong') || text.includes('vernier caliper')) {
    return { type: 'jangka_sorong', params: { utama: 2.3, nonius: 4 } };
  }

  if (text.includes('neraca pasar') || text.includes('timbangan bebek') || (text.includes('anak timbangan') && text.includes('pasar'))) {
    return { type: 'neraca_pasar', params: { bebanKg: 2, anakKg: 2 } };
  }

  if (text.includes('timbangan digital') || text.includes('neraca digital')) {
    const gMatch = stemText.match(/(\d+)\s*(?:gram|g\b)/i);
    return { type: 'timbangan_digital', params: { massa: gMatch ? parseInt(gMatch[1]) : 450, unit: 'g' } };
  }

  if (text.includes('bejana literan') || text.includes('takaran beras') || text.includes('literan beras')) {
    return { type: 'bejana_literan', params: { kapasitas: 1, terisi: 0.75 } };
  }

  if (text.includes('gelas erlenmeyer') || text.includes('labu erlenmeyer') || text.includes('erlenmeyer')) {
    return { type: 'gelas_erlenmeyer', params: { volume: 150, max: 250 } };
  }

  if (text.includes('meteran gulung') || text.includes('meteran pita') || text.includes('meteran tukang')) {
    return { type: 'meteran_gulung', params: { panjang: 3.5, unit: 'm' } };
  }

  if (text.includes('dinamometer') || text.includes('neraca pegas') || (text.includes('pegas') && text.includes('newton'))) {
    const nMatch = stemText.match(/(\d+)\s*(?:newton|n\b)/i);
    return { type: 'dinamometer_pegas', params: { newton: nMatch ? parseInt(nMatch[1]) : 5 } };
  }

  if (text.includes('tangga satuan panjang') || (text.includes('satuan panjang') && (text.includes('km') || text.includes('tangga')))) {
    return { type: 'tangga_satuan_panjang', params: { dari: 'm', ke: 'cm' } };
  }

  if (text.includes('tangga satuan massa') || text.includes('tangga satuan berat') || (text.includes('satuan massa') && text.includes('tangga'))) {
    return { type: 'tangga_satuan_massa', params: { dari: 'kg', ke: 'g' } };
  }

  if (text.includes('tangga satuan volume') || text.includes('satuan liter') || (text.includes('satuan volume') && text.includes('tangga'))) {
    return { type: 'tangga_satuan_volume', params: { dari: 'l', ke: 'ml' } };
  }

  // 2. Geometri Lanjut 2D & 3D
  if (text.includes('sudut jarum jam') || (text.includes('jarum jam') && text.includes('sudut')) || (text.includes('sudut') && text.includes('pukul '))) {
    const jamMatch = stemText.match(/pukul\s*(\d{1,2})[.:](\d{2})/i) || stemText.match(/(\d{1,2})[.:](\d{2})/);
    const j = jamMatch ? parseInt(jamMatch[1]) : 3;
    const m = jamMatch ? parseInt(jamMatch[2]) : 0;
    return { type: 'sudut_jarum_jam', params: { jam: j, menit: m } };
  }

  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && (text.includes('segiempat') || text.includes('persegi'))) {
    return { type: 'jaring_limas_segiempat', params: { s: 8, t: 10 } };
  }

  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && text.includes('segitiga')) {
    return { type: 'jaring_limas_segitiga', params: { s: 8 } };
  }

  if ((text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('prisma') && text.includes('segitiga')) {
    return { type: 'jaring_prisma_segitiga', params: { a: 6, t: 8, p: 12 } };
  }

  if (text.includes('keliling gabungan') || (text.includes('keliling') && text.includes('bangun gabungan'))) {
    return { type: 'keliling_gabungan', params: { p: 14, l: 10 } };
  }

  if (text.includes('tembereng') || (text.includes('lingkaran') && text.includes('tali busur') && text.includes('juring'))) {
    return { type: 'lingkaran_tembereng', params: { r: 14, sudut: 90 } };
  }

  if (text.includes('poligon kartesius') || (text.includes('koordinat') && (text.includes('poligon') || text.includes('luas segitiga pada bidang')))) {
    return { type: 'koordinat_poligon', params: { titik: [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 3, y: 5 }] } };
  }

  if (text.includes('refleksi') || text.includes('pencerminan') || text.includes('cermin')) {
    return { type: 'transformasi_refleksi', params: { sumbu: 'vertikal' } };
  }

  if (text.includes('translasi') || text.includes('pergeseran bangun')) {
    return { type: 'transformasi_translasi', params: { dx: 3, dy: 2 } };
  }

  if (text.includes('segi enam beraturan') || text.includes('heksagon')) {
    return { type: 'segi_enam_beraturan', params: { s: 8 } };
  }

  // 3. Bilangan, Nilai Tempat & Aljabar Visual
  if (text.includes('dienes') || text.includes('blok dienes') || text.includes('balok dienes') || text.includes('base ten blocks')) {
    return { type: 'blok_dienes', params: { ribuan: 1, ratusan: 2, puluhan: 4, satuan: 5 } };
  }

  if (text.includes('sempoa') || text.includes('abakus') || text.includes('soroban')) {
    return { type: 'sempoa_abakus', params: { nilai: '3527' } };
  }

  if (text.includes('tabel nilai tempat') || (text.includes('nilai tempat') && text.includes('tabel'))) {
    return { type: 'tabel_nilai_tempat', params: { angka: '47285' } };
  }

  if (text.includes('garis bilangan pecahan') || (text.includes('garis bilangan') && text.includes('pecahan'))) {
    return { type: 'garis_bilangan_pecahan', params: { penyebut: 4, target: 3 } };
  }

  if (text.includes('garis bilangan desimal') || (text.includes('garis bilangan') && (text.includes('desimal') || text.includes('koma')))) {
    return { type: 'garis_bilangan_desimal', params: { min: 1.0, max: 2.0, target: 1.7 } };
  }

  if (text.includes('perkalian lattice') || text.includes('metode kisi') || text.includes('tulang napier') || text.includes('perkalian kisi')) {
    return { type: 'perkalian_lattice', params: { num1: 34, num2: 25 } };
  }

  if (text.includes('pola ubin') || text.includes('barisan ubin') || (text.includes('ubin') && text.includes('pola ke-'))) {
    return { type: 'pola_ubin', params: { label: 'X' } };
  }

  if (text.includes('pita pecahan') || text.includes('fraction strips') || text.includes('batang pecahan')) {
    return { type: 'pita_pecahan', params: { label: 'X' } };
  }

  if (text.includes('uang rupiah') || (text.includes('uang') && (text.includes('kertas') || text.includes('logam') || text.includes('pecahan uang')))) {
    return { type: 'matriks_nilai_uang', params: { label: 'X' } };
  }

  // 4. Statistik Komparatif & Peluang
  if (text.includes('batang ganda') || (text.includes('diagram batang') && (text.includes('ganda') || text.includes('perbandingan') || text.includes('laki-laki dan perempuan')))) {
    return { type: 'diagram_batang_ganda', params: { label: 'X' } };
  }

  if (text.includes('garis ganda') || (text.includes('diagram garis') && (text.includes('ganda') || text.includes('dua tahun') || text.includes('2023 dan 2024')))) {
    return { type: 'diagram_garis_ganda', params: { label: 'X' } };
  }

  if (text.includes('dot plot') || text.includes('diagram titik') || text.includes('line plot')) {
    return { type: 'dot_plot', params: { label: 'X' } };
  }

  if (text.includes('lingkaran derajat') || (text.includes('diagram lingkaran') && (text.includes('derajat') || text.includes('360°') || text.includes('360 derajat')))) {
    return { type: 'diagram_lingkaran_derajat', params: { label: 'X' } };
  }

  if (text.includes('tabel kontingensi') || text.includes('frekuensi dua arah') || (text.includes('kontingensi') && text.includes('tabel'))) {
    return { type: 'tabel_kontingensi', params: { label: 'X' } };
  }

  if (text.includes('batang mendatar') || text.includes('batang horizontal') || (text.includes('diagram batang') && text.includes('mendatar'))) {
    return { type: 'diagram_batang_horizontal', params: { label: 'X' } };
  }

  if (text.includes('papan galton') || text.includes('quincunx') || text.includes('galton board') || (text.includes('kelereng') && text.includes('pasak'))) {
    return { type: 'papan_galton_peluang', params: { label: 'X' } };
  }

  if (text.includes('kartu peluang') || (text.includes('kartu') && text.includes('peluang') && (text.includes('terambil') || text.includes('ruang sampel')))) {
    return { type: 'kartu_peluang', params: { label: 'X' } };
  }

  return null;
}
