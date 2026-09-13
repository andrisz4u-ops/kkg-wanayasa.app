/**
 * detector.ts
 * Automatic visual stimulus detector using declarative NLP heuristic rules on question stem text.
 * Enterprise Architecture: Rule-based registry with declarative matching & extraction.
 */

import { VisualStimulusConfig } from './types';

export interface StimulusDetectionRule {
  id: string;
  match: (text: string, stemText: string, mapel: string) => boolean;
  extract: (text: string, stemText: string, mapel: string) => VisualStimulusConfig | null;
}

/**
 * Registry aturan NLP heuristik terurut untuk mendeteksi stimulus visual secara otomatis.
 */
export const DETECTION_RULES: StimulusDetectionRule[] = [
  // Rule 1: simetri_lipat
  {
    id: 'simetri_lipat',
    match: (text, stemText, mapel) => text.includes('simetri lipat') || text.includes('garis simetri') || text.includes('sumbu simetri'),
    extract: (text, stemText, mapel) => {
      let b = 'persegi';
    if (text.includes('panjang')) b = 'persegi_panjang';
    else if (text.includes('sama sisi') || text.includes('sama_sisi')) b = 'segitiga_sama_sisi';
    else if (text.includes('segitiga')) b = 'segitiga';
    else if (text.includes('lingkaran')) b = 'lingkaran';
    else if (text.includes('belah ketupat')) b = 'belah_ketupat';
    return { type: 'simetri_lipat', params: { bangun: b } };
    }
  },

  // Rule 2: bangun_gabungan
  {
    id: 'bangun_gabungan',
    match: (text, stemText, mapel) => text.includes('bangun gabungan') || text.includes('luas gabungan') || (text.includes('gabungan') && (text.includes('bentuk l') || text.includes('berbentuk l') || text.includes('bentuk t') || text.includes('berbentuk t'))),
    extract: (text, stemText, mapel) => {
      const bentuk = text.includes('bentuk t') || text.includes('berbentuk t') ? 'T' : 'L';
    return { type: 'bangun_gabungan', params: { bentuk } };
    }
  },

  // Rule 3: keliling_gabungan
  {
    id: 'keliling_gabungan',
    match: (text, stemText, mapel) => text.includes('keliling gabungan') || (text.includes('keliling') && text.includes('bangun gabungan')),
    extract: (text, stemText, mapel) => {
      return { type: 'keliling_gabungan', params: { p: 14, l: 10 } };
    }
  },

  // Rule 4: sudut_berpelurus_berpenyiku
  {
    id: 'sudut_berpelurus_berpenyiku',
    match: (text, stemText, mapel) => text.includes('berpelurus') || text.includes('berpenyiku') || text.includes('suplemen') || text.includes('komplemen') || (text.includes('sudut') && (text.includes('pelurus') || text.includes('penyiku'))),
    extract: (text, stemText, mapel) => {
      const jenis = (text.includes('penyiku') || text.includes('komplemen')) ? 'berpenyiku' : 'berpelurus';
    const numMatch = stemText.match(/(\d+)\s*(?:°|derajat)/i);
    const sudutDiketahui = numMatch ? parseInt(numMatch[1]) : (jenis === 'berpenyiku' ? 35 : 65);
    return { type: 'sudut_berpelurus_berpenyiku', params: { jenis, sudutDiketahui } };
    }
  },

  // Rule 5: garis_sejajar_transversal
  {
    id: 'garis_sejajar_transversal',
    match: (text, stemText, mapel) => text.includes('transversal') || (text.includes('garis sejajar') && (text.includes('potong') || text.includes('sudut'))) || text.includes('sehadap') || text.includes('berseberangan') || text.includes('sepihak'),
    extract: (text, stemText, mapel) => {
      let posisi: 'sehadap' | 'berseberangan_dalam' | 'sepihak_dalam' = 'sehadap';
    if (text.includes('berseberangan')) posisi = 'berseberangan_dalam';
    else if (text.includes('sepihak')) posisi = 'sepihak_dalam';
    return { type: 'garis_sejajar_transversal', params: { posisi } };
    }
  },

  // Rule 6: teorema_pythagoras
  {
    id: 'teorema_pythagoras',
    match: (text, stemText, mapel) => text.includes('pythagoras') || text.includes('pitagoras') || (text.includes('segitiga siku') && (text.includes('hipotenusa') || (text.includes('sisi miring') && (text.includes('kuadrat') || text.includes('rumus'))))),
    extract: (text, stemText, mapel) => {
      const nums = stemText.match(/\b(\d+)\s*(?:cm|m)?\b/g);
    const a = nums && nums.length >= 1 ? parseInt(nums[0]) : 6;
    const b = nums && nums.length >= 2 ? parseInt(nums[1]) : 8;
    return { type: 'teorema_pythagoras', params: { sisiA: a, sisiB: b, target: 'c' } };
    }
  },

  // Rule 7: juring_busur_lingkaran
  {
    id: 'juring_busur_lingkaran',
    match: (text, stemText, mapel) => text.includes('panjang busur') || text.includes('luas juring') || (text.includes('juring') && text.includes('busur')),
    extract: (text, stemText, mapel) => {
      const hitung = (text.includes('luas') || text.includes('luas juring')) ? 'luas_juring' : 'panjang_busur';
    const rMatch = stemText.match(/r\s*=\s*(\d+)/i) || stemText.match(/jari-jari\D*(\d+)/i);
    const degMatch = stemText.match(/(\d+)\s*(?:°|derajat)/i);
    return {
      type: 'juring_busur_lingkaran',
      params: {
        r: rMatch ? parseInt(rMatch[1]) : 14,
        sudut: degMatch ? parseInt(degMatch[1]) : 60,
        hitung
      }
    };
    }
  },

  // Rule 8: segitiga_pascal
  {
    id: 'segitiga_pascal',
    match: (text, stemText, mapel) => text.includes('pascal') || text.includes('segitiga pascal') || (text.includes('pola bilangan') && text.includes('pascal')),
    extract: (text, stemText, mapel) => {
      const barisMatch = stemText.match(/baris\s*(?:ke-?)?\s*(\d+)/i);
    return { type: 'segitiga_pascal', params: { baris: barisMatch ? parseInt(barisMatch[1]) : 5 } };
    }
  },

  // Rule 9: skala_termometer_komparasi
  {
    id: 'skala_termometer_komparasi',
    match: (text, stemText, mapel) => text.includes('komparasi termometer') || (text.includes('termometer') && (text.includes('reamur') || text.includes('fahrenheit') || text.includes('kelvin') || text.includes('konversi suhu') || text.includes('perbandingan skala'))),
    extract: (text, stemText, mapel) => {
      let target: 'reamur' | 'fahrenheit' | 'kelvin' = 'reamur';
    if (text.includes('fahrenheit')) target = 'fahrenheit';
    else if (text.includes('kelvin')) target = 'kelvin';
    const cMatch = stemText.match(/(-?\d+)\s*(?:°|derajat)?\s*c/i);
    return { type: 'skala_termometer_komparasi', params: { celsius: cMatch ? parseInt(cMatch[1]) : 40, target } };
    }
  },

  // Rule 10: diagram_batang_daun
  {
    id: 'diagram_batang_daun',
    match: (text, stemText, mapel) => text.includes('batang daun') || text.includes('batang-daun') || text.includes('stem and leaf') || text.includes('stem-and-leaf'),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_batang_daun', params: { label: 'X' } };
    }
  },

  // Rule 11: diagram_box_plot
  {
    id: 'diagram_box_plot',
    match: (text, stemText, mapel) => text.includes('box plot') || text.includes('boxplot') || text.includes('kotak garis') || text.includes('diagram kotak'),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_box_plot', params: { q1: 15, q2: 25, q3: 35, min: 10, max: 45 } };
    }
  },

  // Rule 12: pohon_peluang
  {
    id: 'pohon_peluang',
    match: (text, stemText, mapel) => text.includes('pohon peluang') || (text.includes('diagram pohon') && text.includes('peluang')) || (text.includes('ruang sampel') && text.includes('pohon')),
    extract: (text, stemText, mapel) => {
      const event = text.includes('dadu') ? 'dadu' : 'koin';
    return { type: 'pohon_peluang', params: { level: 2, event } };
    }
  },

  // Rule 13: koding_blok_percabangan
  {
    id: 'koding_blok_percabangan',
    match: (text, stemText, mapel) => (text.includes('scratch') && (text.includes('percabangan') || text.includes('jika') || text.includes('if then'))) || text.includes('koding blok percabangan') || (text.includes('blok') && text.includes('jika maka')),
    extract: (text, stemText, mapel) => {
      return { type: 'koding_blok_percabangan', params: { kondisi: 'skor > 75' } };
    }
  },

  // Rule 14: koding_blok_perulangan
  {
    id: 'koding_blok_perulangan',
    match: (text, stemText, mapel) => (text.includes('scratch') && (text.includes('perulangan') || text.includes('ulangi') || text.includes('repeat'))) || text.includes('koding blok perulangan') || (text.includes('blok') && text.includes('ulangi sebanyak')),
    extract: (text, stemText, mapel) => {
      const kaliMatch = stemText.match(/(\d+)\s*kali/i);
    return { type: 'koding_blok_perulangan', params: { kali: kaliMatch ? parseInt(kaliMatch[1]) : 4 } };
    }
  },

  // Rule 15: rangka_manusia
  {
    id: 'rangka_manusia',
    match: (text, stemText, mapel) => text.includes('rangka manusia') || text.includes('kerangka manusia') || text.includes('tulang rusuk') || text.includes('tulang tengkorak') || text.includes('tulang panggul') || text.includes('tulang paha') || text.includes('tulang belakang') || (text.includes('rangka') && (text.includes('tulang') || text.includes('tubuh'))),
    extract: (text, stemText, mapel) => {
      let bagian: 'tengkorak' | 'rusuk' | 'belakang' | 'panggul' | 'lengan' | 'tungkai' = 'rusuk';
    if (text.includes('tengkorak') || text.includes('kepala')) bagian = 'tengkorak';
    else if (text.includes('belakang') || text.includes('punggung')) bagian = 'belakang';
    else if (text.includes('panggul') || text.includes('pinggul')) bagian = 'panggul';
    else if (text.includes('lengan') || text.includes('tangan')) bagian = 'lengan';
    else if (text.includes('tungkai') || text.includes('kaki') || text.includes('paha')) bagian = 'tungkai';
    return { type: 'rangka_manusia', params: { bagian } };
    }
  },

  // Rule 16: sendi_gerak
  {
    id: 'sendi_gerak',
    match: (text, stemText, mapel) => text.includes('sendi') && (text.includes('peluru') || text.includes('engsel') || text.includes('putar') || text.includes('pelana') || text.includes('geser') || text.includes('gerak') || text.includes('diartrosis')),
    extract: (text, stemText, mapel) => {
      let jenis: 'engsel' | 'peluru' | 'putar' | 'pelana' | 'geser' = 'engsel';
    if (text.includes('peluru')) jenis = 'peluru';
    else if (text.includes('putar')) jenis = 'putar';
    else if (text.includes('pelana')) jenis = 'pelana';
    else if (text.includes('geser')) jenis = 'geser';
    return { type: 'sendi_gerak', params: { jenis } };
    }
  },

  // Rule 17: metamorfosis_katak
  {
    id: 'metamorfosis_katak',
    match: (text, stemText, mapel) => (text.includes('metamorfosis') || text.includes('daur hidup')) && (text.includes('katak') || text.includes('kodok') || text.includes('berudu') || text.includes('kecebong')),
    extract: (text, stemText, mapel) => {
      let tahap: 'telur' | 'berudu' | 'katak_berekor' | 'katak_dewasa' = 'berudu';
    if (text.includes('telur')) tahap = 'telur';
    else if (text.includes('katak berekor') || text.includes('berekor')) tahap = 'katak_berekor';
    else if (text.includes('dewasa')) tahap = 'katak_dewasa';
    return { type: 'metamorfosis_katak', params: { tahap } };
    }
  },

  // Rule 18: metamorfosis_nyamuk
  {
    id: 'metamorfosis_nyamuk',
    match: (text, stemText, mapel) => (text.includes('metamorfosis') || text.includes('daur hidup')) && (text.includes('nyamuk') || text.includes('jentik') || text.includes('tempayak') || text.includes('pupa nyamuk')),
    extract: (text, stemText, mapel) => {
      let tahap: 'telur' | 'jentik' | 'pupa' | 'nyamuk' = 'jentik';
    if (text.includes('telur')) tahap = 'telur';
    else if (text.includes('pupa')) tahap = 'pupa';
    else if (text.includes('nyamuk dewasa') || text.includes('imago')) tahap = 'nyamuk';
    return { type: 'metamorfosis_nyamuk', params: { tahap } };
    }
  },

  // Rule 19: paruh_burung
  {
    id: 'paruh_burung',
    match: (text, stemText, mapel) => text.includes('paruh burung') || (text.includes('paruh') && (text.includes('burung') || text.includes('unggas') || text.includes('makanan') || text.includes('adaptasi'))),
    extract: (text, stemText, mapel) => {
      let tipe: 'pemakan_biji' | 'pemakan_daging' | 'penghisap_madu' | 'pemakan_ikan' = 'pemakan_biji';
    if (text.includes('daging') || text.includes('elang') || text.includes('rajawali')) tipe = 'pemakan_daging';
    else if (text.includes('madu') || text.includes('kolibri') || text.includes('nektar')) tipe = 'penghisap_madu';
    else if (text.includes('ikan') || text.includes('bebek') || text.includes('pelikan')) tipe = 'pemakan_ikan';
    return { type: 'paruh_burung', params: { tipe } };
    }
  },

  // Rule 20: kaki_burung
  {
    id: 'kaki_burung',
    match: (text, stemText, mapel) => text.includes('kaki burung') || (text.includes('kaki') && text.includes('burung') && (text.includes('cengkeram') || text.includes('renang') || text.includes('panjat') || text.includes('tengger') || text.includes('selaput'))),
    extract: (text, stemText, mapel) => {
      let tipe: 'perenang' | 'pemanjat' | 'pencengkeram' | 'petengger' = 'pencengkeram';
    if (text.includes('renang') || text.includes('selaput') || text.includes('bebek')) tipe = 'perenang';
    else if (text.includes('panjat') || text.includes('pelatuk')) tipe = 'pemanjat';
    else if (text.includes('tengger') || text.includes('kutilang') || text.includes('pipit')) tipe = 'petengger';
    return { type: 'kaki_burung', params: { tipe } };
    }
  },

  // Rule 21: simbiosis
  {
    id: 'simbiosis',
    match: (text, stemText, mapel) => text.includes('simbiosis') || text.includes('mutualisme') || text.includes('komensalisme') || text.includes('parasitisme'),
    extract: (text, stemText, mapel) => {
      let tipe: 'mutualisme' | 'komensalisme' | 'parasitisme' = 'mutualisme';
    if (text.includes('komensalisme')) tipe = 'komensalisme';
    else if (text.includes('parasitisme') || text.includes('parasit')) tipe = 'parasitisme';
    return { type: 'simbiosis', params: { tipe } };
    }
  },

  // Rule 22: jaring_makanan_sawah
  {
    id: 'jaring_makanan_sawah',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('rantai')) && (text.includes('sawah') || (text.includes('belalang') && text.includes('katak') && text.includes('ular'))),
    extract: (text, stemText, mapel) => {
      let target: 'padi' | 'belalang' | 'katak' | 'ular' | 'elang' = 'katak';
    if (text.includes('padi')) target = 'padi';
    else if (text.includes('belalang')) target = 'belalang';
    else if (text.includes('ular')) target = 'ular';
    else if (text.includes('elang')) target = 'elang';
    return { type: 'jaring_makanan_sawah', params: { target } };
    }
  },

  // Rule 23: adaptasi_tumbuhan
  {
    id: 'adaptasi_tumbuhan',
    match: (text, stemText, mapel) => text.includes('adaptasi tumbuhan') || text.includes('xerofit') || text.includes('hidrofit') || text.includes('higrofit') || text.includes('kaktus') || text.includes('teratai') || text.includes('bakau') || text.includes('kantong semar'),
    extract: (text, stemText, mapel) => {
      let tipe: 'kaktus' | 'teratai' | 'bakau' | 'kantong_semar' = 'kaktus';
    if (text.includes('teratai') || text.includes('hidrofit')) tipe = 'teratai';
    else if (text.includes('bakau') || text.includes('mangrove')) tipe = 'bakau';
    else if (text.includes('kantong semar') || text.includes('insektivora')) tipe = 'kantong_semar';
    return { type: 'adaptasi_tumbuhan', params: { tipe } };
    }
  },

  // Rule 24: pernapasan_hewan
  {
    id: 'pernapasan_hewan',
    match: (text, stemText, mapel) => text.includes('pernapasan hewan') || text.includes('insang ikan') || text.includes('trakea serangga') || text.includes('pundi-pundi udara') || (text.includes('bernapas') && (text.includes('insang') || text.includes('trakea') || text.includes('kulit cacing'))),
    extract: (text, stemText, mapel) => {
      let hewan: 'ikan' | 'serangga' | 'cacing' | 'burung' = 'ikan';
    if (text.includes('serangga') || text.includes('belalang') || text.includes('trakea')) hewan = 'serangga';
    else if (text.includes('cacing') || text.includes('kulit')) hewan = 'cacing';
    else if (text.includes('burung') || text.includes('pundi')) hewan = 'burung';
    return { type: 'pernapasan_hewan', params: { hewan } };
    }
  },

  // Rule 25: perkembangbiakan_tumbuhan
  {
    id: 'perkembangbiakan_tumbuhan',
    match: (text, stemText, mapel) => text.includes('mencangkok') || text.includes('stek') || text.includes('okulasi') || text.includes('geragih') || text.includes('stolon') || text.includes('rhizoma') || text.includes('rimpang') || text.includes('vegetatif buatan') || text.includes('vegetatif alami'),
    extract: (text, stemText, mapel) => {
      let jenis: 'mencangkok' | 'stek' | 'okulasi' | 'tunas' | 'geragih' | 'rhizoma' = 'mencangkok';
    if (text.includes('stek')) jenis = 'stek';
    else if (text.includes('okulasi') || text.includes('tempel')) jenis = 'okulasi';
    else if (text.includes('geragih') || text.includes('stolon')) jenis = 'geragih';
    else if (text.includes('rhizoma') || text.includes('rimpang')) jenis = 'rhizoma';
    else if (text.includes('tunas')) jenis = 'tunas';
    return { type: 'perkembangbiakan_tumbuhan', params: { jenis } };
    }
  },

  // Rule 26: sel_hewan_tumbuhan
  {
    id: 'sel_hewan_tumbuhan',
    match: (text, stemText, mapel) => text.includes('sel hewan') || text.includes('sel tumbuhan') || text.includes('organel sel') || text.includes('kloroplas') || text.includes('dinding sel') || (text.includes('sel') && (text.includes('vakuola') || text.includes('mitokondria') || text.includes('nukleus'))),
    extract: (text, stemText, mapel) => {
      const jenis = text.includes('hewan') ? 'hewan' : 'tumbuhan';
    let organel: 'dinding_sel' | 'kloroplas' | 'vakuola' | 'nukleus' | 'mitokondria' = jenis === 'tumbuhan' ? 'kloroplas' : 'mitokondria';
    if (text.includes('dinding sel')) organel = 'dinding_sel';
    else if (text.includes('vakuola')) organel = 'vakuola';
    else if (text.includes('nukleus') || text.includes('inti sel')) organel = 'nukleus';
    return { type: 'sel_hewan_tumbuhan', params: { jenis, organel } };
    }
  },

  // Rule 27: fase_bulan
  {
    id: 'fase_bulan',
    match: (text, stemText, mapel) => text.includes('fase bulan') || text.includes('fase-fase bulan') || text.includes('bulan sabit') || text.includes('bulan purnama') || text.includes('bulan separuh') || text.includes('bulan baru') || text.includes('bulan cembung'),
    extract: (text, stemText, mapel) => {
      let fase: 'baru' | 'sabit' | 'separuh' | 'cembung' | 'purnama' = 'purnama';
    if (text.includes('sabit')) fase = 'sabit';
    else if (text.includes('separuh') || text.includes('kuartir')) fase = 'separuh';
    else if (text.includes('cembung')) fase = 'cembung';
    else if (text.includes('baru') || text.includes('mati')) fase = 'baru';
    return { type: 'fase_bulan', params: { fase } };
    }
  },

  // Rule 28: lapisan_bumi
  {
    id: 'lapisan_bumi',
    match: (text, stemText, mapel) => text.includes('lapisan bumi') || text.includes('struktur bumi') || text.includes('kerak bumi') || text.includes('mantel bumi') || text.includes('inti bumi') || text.includes('litosfer'),
    extract: (text, stemText, mapel) => {
      let lapisan: 'kerak' | 'mantel' | 'inti_luar' | 'inti_dalam' = 'kerak';
    if (text.includes('mantel') || text.includes('selubung')) lapisan = 'mantel';
    else if (text.includes('inti luar')) lapisan = 'inti_luar';
    else if (text.includes('inti dalam')) lapisan = 'inti_dalam';
    return { type: 'lapisan_bumi', params: { lapisan } };
    }
  },

  // Rule 29: lapisan_tanah
  {
    id: 'lapisan_tanah',
    match: (text, stemText, mapel) => text.includes('lapisan tanah') || text.includes('horizon tanah') || text.includes('profil tanah') || text.includes('topsoil') || text.includes('subsoil'),
    extract: (text, stemText, mapel) => {
      let horizon: 'O' | 'A' | 'B' | 'C' | 'R' = 'A';
    if (text.includes('horizon o') || text.includes('organik') || text.includes('humus')) horizon = 'O';
    else if (text.includes('horizon b') || text.includes('subsoil')) horizon = 'B';
    else if (text.includes('horizon c')) horizon = 'C';
    else if (text.includes('horizon r') || text.includes('batuan induk')) horizon = 'R';
    return { type: 'lapisan_tanah', params: { horizon } };
    }
  },

  // Rule 30: baterai_buah
  {
    id: 'baterai_buah',
    match: (text, stemText, mapel) => text.includes('baterai buah') || text.includes('sel volta buah') || ((text.includes('lemon') || text.includes('jeruk nipis') || text.includes('kentang')) && (text.includes('tegangan') || text.includes('elektroda') || text.includes('arus listrik') || text.includes('led'))),
    extract: (text, stemText, mapel) => {
      let buah: 'lemon' | 'kentang' | 'jeruk nipis' = 'lemon';
    if (text.includes('kentang')) buah = 'kentang';
    else if (text.includes('jeruk nipis') || text.includes('jeruk')) buah = 'jeruk nipis';
    return { type: 'baterai_buah', params: { buah } };
    }
  },

  // Rule 31: optik_periskop
  {
    id: 'optik_periskop',
    match: (text, stemText, mapel) => text.includes('periskop') || (text.includes('kapal selam') && (text.includes('cermin') || text.includes('pantulan'))),
    extract: (text, stemText, mapel) => {
      let fokus: 'cermin_atas' | 'cermin_bawah' | 'sinar_datang' | 'sinar_pantul' = 'cermin_atas';
    if (text.includes('bawah')) fokus = 'cermin_bawah';
    else if (text.includes('datang')) fokus = 'sinar_datang';
    else if (text.includes('pantul')) fokus = 'sinar_pantul';
    return { type: 'optik_periskop', params: { fokus } };
    }
  },

  // Rule 32: kaca_pembesar_lup
  {
    id: 'kaca_pembesar_lup',
    match: (text, stemText, mapel) => text.includes('lup') || text.includes('kaca pembesar') || (text.includes('pembesar') && text.includes('lensa cembung')),
    extract: (text, stemText, mapel) => {
      return { type: 'kaca_pembesar_lup', params: { perbesaran: 3 } };
    }
  },

  // Rule 33: pemuaian_bimetal
  {
    id: 'pemuaian_bimetal',
    match: (text, stemText, mapel) => text.includes('bimetal') || text.includes('keping bimetal') || (text.includes('pemuaian') && text.includes('logam') && (text.includes('melengkung') || text.includes('kuningan'))),
    extract: (text, stemText, mapel) => {
      const kondisi = text.includes('dingin') || text.includes('didinginkan') ? 'dingin' : 'panas';
    return { type: 'pemuaian_bimetal', params: { kondisi, logamAtas: 'kuningan', logamBawah: 'besi' } };
    }
  },

  // Rule 34: gelombang_bunyi
  {
    id: 'gelombang_bunyi',
    match: (text, stemText, mapel) => text.includes('gelombang bunyi') || text.includes('gelombang longitudinal') || text.includes('gelombang transversal') || text.includes('rapatan dan renggangan') || (text.includes('bunyi') && text.includes('gelombang')),
    extract: (text, stemText, mapel) => {
      const tipe = text.includes('transversal') ? 'transversal' : 'longitudinal';
    return { type: 'gelombang_bunyi', params: { tipe, label: 'X' } };
    }
  },

  // Rule 35: perubahan_energi
  {
    id: 'perubahan_energi',
    match: (text, stemText, mapel) => text.includes('perubahan energi') || text.includes('transformasi energi') || (text.includes('energi listrik') && (text.includes('menjadi panas') || text.includes('menjadi gerak') || text.includes('menjadi cahaya') || text.includes('menjadi bunyi'))),
    extract: (text, stemText, mapel) => {
      let bentukAkhir: 'panas' | 'cahaya' | 'gerak' | 'bunyi' = 'panas';
    if (text.includes('gerak') || text.includes('kipas') || text.includes('motor')) bentukAkhir = 'gerak';
    else if (text.includes('cahaya') || text.includes('lampu')) bentukAkhir = 'cahaya';
    else if (text.includes('bunyi') || text.includes('radio') || text.includes('bel')) bentukAkhir = 'bunyi';
    return { type: 'perubahan_energi', params: { bentukAwal: 'listrik', bentukAkhir } };
    }
  },

  // Rule 36: zona_waktu_indonesia
  {
    id: 'zona_waktu_indonesia',
    match: (text, stemText, mapel) => text.includes('zona waktu') || text.includes('pembagian waktu') || (text.includes('wib') && text.includes('wita')) || (text.includes('wita') && text.includes('wit')),
    extract: (text, stemText, mapel) => {
      let zonaTarget: 'WIB' | 'WITA' | 'WIT' = 'WITA';
    if (stemText.includes('wib')) zonaTarget = 'WIB';
    else if (stemText.includes('wit') && !stemText.includes('wita')) zonaTarget = 'WIT';
    return { type: 'zona_waktu_indonesia', params: { zonaTarget } };
    }
  },

  // Rule 37: siklus_batuan
  {
    id: 'siklus_batuan',
    match: (text, stemText, mapel) => text.includes('siklus batuan') || text.includes('daur batuan') || (text.includes('batuan beku') && text.includes('batuan sedimen') && text.includes('batuan metamorf')),
    extract: (text, stemText, mapel) => {
      let tahap: 'magma' | 'beku' | 'sedimen' | 'metamorf' = 'beku';
    if (text.includes('sedimen') || text.includes('endapan')) tahap = 'sedimen';
    else if (text.includes('metamorf') || text.includes('malihan')) tahap = 'metamorf';
    else if (text.includes('magma')) tahap = 'magma';
    return { type: 'siklus_batuan', params: { tahap } };
    }
  },

  // Rule 38: simbol_kartografi
  {
    id: 'simbol_kartografi',
    match: (text, stemText, mapel) => text.includes('simbol kartografi') || text.includes('simbol peta') || (text.includes('legenda peta') && text.includes('simbol')) || text.includes('kartografi'),
    extract: (text, stemText, mapel) => {
      let kategori: 'titik' | 'garis' | 'area' = 'titik';
    if (text.includes('garis') || text.includes('sungai') || text.includes('jalan')) kategori = 'garis';
    else if (text.includes('area') || text.includes('danau') || text.includes('rawa')) kategori = 'area';
    return { type: 'simbol_kartografi', params: { kategori } };
    }
  },

  // Rule 39: garis_lintang_bujur
  {
    id: 'garis_lintang_bujur',
    match: (text, stemText, mapel) => !text.includes('gerak semu') && (text.includes('garis lintang') || text.includes('garis bujur') || text.includes('khatulistiwa') || text.includes('ekuator') || text.includes('meridian') || text.includes('lintang utara') || text.includes('bujur timur')),
    extract: (text, stemText, mapel) => {
      let tipe: 'lintang' | 'bujur' | 'keduanya' = 'keduanya';
    if (text.includes('lintang') && !text.includes('bujur')) tipe = 'lintang';
    else if (text.includes('bujur') && !text.includes('lintang')) tipe = 'bujur';
    return { type: 'garis_lintang_bujur', params: { tipe } };
    }
  },

  // Rule 40: rumah_adat_nusantara
  {
    id: 'rumah_adat_nusantara',
    match: (text, stemText, mapel) => !text.includes('peta') && (text.includes('rumah adat') || text.includes('rumah gadang') || text.includes('rumah joglo') || text.includes('rumah tongkonan') || text.includes('rumah honai') || text.includes('rumah bolon')),
    extract: (text, stemText, mapel) => {
      let daerah: 'gadang' | 'joglo' | 'tongkonan' | 'honai' | 'bolon' = 'gadang';
    if (text.includes('joglo') || text.includes('jawa')) daerah = 'joglo';
    else if (text.includes('tongkonan') || text.includes('toraja')) daerah = 'tongkonan';
    else if (text.includes('honai') || text.includes('papua')) daerah = 'honai';
    else if (text.includes('bolon') || text.includes('batak')) daerah = 'bolon';
    return { type: 'rumah_adat_nusantara', params: { daerah } };
    }
  },

  // Rule 41: alat_musik_tradisional
  {
    id: 'alat_musik_tradisional',
    match: (text, stemText, mapel) => !text.includes('peta') && (text.includes('alat musik') || text.includes('angklung') || text.includes('gamelan') || text.includes('sasando') || text.includes('kolintang') || (text.includes('tifa') && text.includes('musik'))),
    extract: (text, stemText, mapel) => {
      let instrumen: 'angklung' | 'gamelan' | 'sasando' | 'kolintang' | 'tifa' = 'angklung';
    if (text.includes('gamelan')) instrumen = 'gamelan';
    else if (text.includes('sasando')) instrumen = 'sasando';
    else if (text.includes('kolintang')) instrumen = 'kolintang';
    else if (text.includes('tifa')) instrumen = 'tifa';
    return { type: 'alat_musik_tradisional', params: { instrumen } };
    }
  },

  // Rule 42: trias_politika
  {
    id: 'trias_politika',
    match: (text, stemText, mapel) => text.includes('trias politika') || (text.includes('legislatif') && text.includes('eksekutif')) || (text.includes('lembaga negara') && (text.includes('dpr') || text.includes('presiden') || text.includes('mahkamah agung'))),
    extract: (text, stemText, mapel) => {
      let cabang: 'legislatif' | 'eksekutif' | 'yudikatif' = 'legislatif';
    if (text.includes('eksekutif') || text.includes('presiden')) cabang = 'eksekutif';
    else if (text.includes('yudikatif') || text.includes('kehakiman') || text.includes('mahkamah agung')) cabang = 'yudikatif';
    return { type: 'trias_politika', params: { cabang } };
    }
  },

  // Rule 43: alur_kegiatan_ekonomi
  {
    id: 'alur_kegiatan_ekonomi',
    match: (text, stemText, mapel) => text.includes('kegiatan ekonomi') || text.includes('alur kegiatan ekonomi') || (text.includes('produksi') && text.includes('distribusi') && text.includes('konsumsi')),
    extract: (text, stemText, mapel) => {
      let fokus: 'produksi' | 'distribusi' | 'konsumsi' = 'produksi';
    if (text.includes('distribusi') || text.includes('penyaluran')) fokus = 'distribusi';
    else if (text.includes('konsumsi') || text.includes('pemakai')) fokus = 'konsumsi';
    return { type: 'alur_kegiatan_ekonomi', params: { fokus } };
    }
  },

  // Rule 44: norma_masyarakat
  {
    id: 'norma_masyarakat',
    match: (text, stemText, mapel) => text.includes('norma masyarakat') || (text.includes('norma') && (text.includes('kesopanan') || text.includes('kesusilaan') || text.includes('hukum') || text.includes('sanksi') || text.includes('adat'))),
    extract: (text, stemText, mapel) => {
      let jenisNorma: 'agama' | 'kesusilaan' | 'kesopanan' | 'hukum' = 'kesopanan';
    if (text.includes('kesusilaan') || text.includes('hati nurani')) jenisNorma = 'kesusilaan';
    else if (text.includes('hukum') || text.includes('polisi') || text.includes('pidana')) jenisNorma = 'hukum';
    else if (text.includes('agama') || text.includes('wahyu') || text.includes('tuhan')) jenisNorma = 'agama';
    return { type: 'norma_masyarakat', params: { jenisNorma } };
    }
  },

  // Rule 45: rambu_bahaya_lab
  {
    id: 'rambu_bahaya_lab',
    match: (text, stemText, mapel) => text.includes('simbol laboratorium') || text.includes('simbol bahaya lab') || text.includes('simbol bahan kimia') || text.includes('rambu lab') || (text.includes('simbol') && (text.includes('korosif') || text.includes('beracun') || text.includes('mudah terbakar') || text.includes('mudah meledak'))),
    extract: (text, stemText, mapel) => {
      let jenis: 'korosif' | 'mudah_terbakar' | 'beracun' | 'eksplosif' = 'korosif';
    if (text.includes('terbakar') || text.includes('flammable')) jenis = 'mudah_terbakar';
    else if (text.includes('beracun') || text.includes('toxic') || text.includes('tengkorak')) jenis = 'beracun';
    else if (text.includes('meledak') || text.includes('eksplosif')) jenis = 'eksplosif';
    return { type: 'rambu_bahaya_lab', params: { jenis } };
    }
  },

  // Rule 46: piramida_aktivitas_fisik
  {
    id: 'piramida_aktivitas_fisik',
    match: (text, stemText, mapel) => text.includes('piramida aktivitas fisik') || text.includes('piramida aktivitas') || text.includes('piramida kebugaran') || (text.includes('aktivitas fisik') && (text.includes('sedentari') || text.includes('aerobik') || text.includes('tingkatan'))),
    extract: (text, stemText, mapel) => {
      let tingkat: 'dasar' | 'aerobik' | 'fleksibilitas' | 'sedentari' = 'dasar';
    if (text.includes('aerobik')) tingkat = 'aerobik';
    else if (text.includes('fleksibilitas') || text.includes('kelenturan')) tingkat = 'fleksibilitas';
    else if (text.includes('sedentari') || text.includes('diam') || text.includes('puncak piramida')) tingkat = 'sedentari';
    return { type: 'piramida_aktivitas_fisik', params: { tingkat } };
    }
  },

  // Rule 47: lapangan_atletik
  {
    id: 'lapangan_atletik',
    match: (text, stemText, mapel) => text.includes('lapangan atletik') || text.includes('lintasan atletik') || text.includes('lintasan lari') || text.includes('bak lompat jauh') || text.includes('tolak peluru'),
    extract: (text, stemText, mapel) => {
      let nomor: 'lari' | 'lompat_jauh' | 'tolak_peluru' = 'lari';
    if (text.includes('lompat jauh')) nomor = 'lompat_jauh';
    else if (text.includes('tolak peluru')) nomor = 'tolak_peluru';
    return { type: 'lapangan_atletik', params: { nomor } };
    }
  },

  // Rule 48: diagram_mindmap_paragraf
  {
    id: 'diagram_mindmap_paragraf',
    match: (text, stemText, mapel) => text.includes('ide pokok') || text.includes('gagasan utama') || text.includes('mind map') || text.includes('mindmap') || text.includes('diagram ide pokok') || (text.includes('paragraf') && (text.includes('gagasan pendukung') || text.includes('pokok pikiran'))),
    extract: (text, stemText, mapel) => {
      let tipe: 'ide_pokok' | 'sebab_akibat' | 'kronologis' = 'ide_pokok';
    if (text.includes('sebab') || text.includes('akibat')) tipe = 'sebab_akibat';
    else if (text.includes('kronologis') || text.includes('urutan waktu')) tipe = 'kronologis';
    return { type: 'diagram_mindmap_paragraf', params: { tipe } };
    }
  },

  // Rule 49: rantai_makanan_laut
  {
    id: 'rantai_makanan_laut',
    match: (text, stemText, mapel) => text.includes('rantai makanan laut') || text.includes('jaring makanan laut') || text.includes('trofik laut') || (text.includes('rantai makanan') && (text.includes('fitoplankton') || text.includes('zooplankton') || text.includes('paus') || text.includes('hiu') || text.includes('plankton') || (text.includes('laut') && !text.includes('hutan') && !text.includes('sawah')))),
    extract: (text, stemText, mapel) => {
      let pointer: 'fitoplankton' | 'zooplankton' | 'ikan_kecil' | 'predator' = 'ikan_kecil';
    if (text.includes('fitoplankton')) pointer = 'fitoplankton';
    else if (text.includes('zooplankton')) pointer = 'zooplankton';
    else if (text.includes('predator') || text.includes('hiu') || text.includes('paus')) pointer = 'predator';
    return { type: 'rantai_makanan_laut', params: { pointer, label: 'X' } };
    }
  },

  // Rule 50: rantai_makanan_hutan
  {
    id: 'rantai_makanan_hutan',
    match: (text, stemText, mapel) => text.includes('rantai makanan hutan') || text.includes('jaring makanan hutan') || (text.includes('rantai makanan') && (text.includes('hutan') || text.includes('harimau') || text.includes('rusa') || text.includes('serigala') || text.includes('singa') || text.includes('pengurai'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'produsen' | 'herbivora' | 'karnivora' | 'pengurai' = 'karnivora';
    if (text.includes('produsen') || text.includes('pohon') || text.includes('rumput')) pointer = 'produsen';
    else if (text.includes('rusa') || text.includes('herbivora') || text.includes('kelinci')) pointer = 'herbivora';
    else if (text.includes('pengurai') || text.includes('bakteri') || text.includes('jamur')) pointer = 'pengurai';
    return { type: 'rantai_makanan_hutan', params: { pointer, label: 'X' } };
    }
  },

  // Rule 51: daur_hidup_kupu_detail
  {
    id: 'daur_hidup_kupu_detail',
    match: (text, stemText, mapel) => text.includes('krisalis') || text.includes('daur hidup kupu detail') || text.includes('daur hidup kupu-kupu detail') || text.includes('metamorfosis sempurna kupu') || (text.includes('kupu') && text.includes('kepompong') && text.includes('ulat')),
    extract: (text, stemText, mapel) => {
      let pointer: 'telur' | 'larva' | 'pupa' | 'imago' = 'pupa';
    if (text.includes('telur')) pointer = 'telur';
    else if (text.includes('ulat') || text.includes('larva')) pointer = 'larva';
    else if (text.includes('kupu') || text.includes('imago')) pointer = 'imago';
    return { type: 'daur_hidup_kupu_detail', params: { pointer, label: 'X' } };
    }
  },

  // Rule 52: daur_hidup_belalang
  {
    id: 'daur_hidup_belalang',
    match: (text, stemText, mapel) => text.includes('metamorfosis belalang') || text.includes('daur hidup belalang') || text.includes('siklus hidup belalang') || (text.includes('belalang') && (text.includes('nimfa') || text.includes('metamorfosis tidak sempurna'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'telur' | 'nimfa' | 'dewasa' = 'nimfa';
    if (text.includes('telur')) pointer = 'telur';
    else if (text.includes('dewasa') || text.includes('imago')) pointer = 'dewasa';
    return { type: 'daur_hidup_belalang', params: { pointer, label: 'X' } };
    }
  },

  // Rule 53: daur_hidup_kecoa
  {
    id: 'daur_hidup_kecoa',
    match: (text, stemText, mapel) => text.includes('metamorfosis kecoa') || text.includes('daur hidup kecoa') || text.includes('siklus hidup kecoa') || text.includes('ooteka') || (text.includes('kecoa') && (text.includes('nimfa') || text.includes('metamorfosis tidak sempurna'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'ooteka' | 'nimfa' | 'dewasa' = 'ooteka';
    if (text.includes('nimfa')) pointer = 'nimfa';
    else if (text.includes('dewasa') || text.includes('imago')) pointer = 'dewasa';
    return { type: 'daur_hidup_kecoa', params: { pointer, label: 'X' } };
    }
  },

  // Rule 54: bagian_akar_tumbuhan
  {
    id: 'bagian_akar_tumbuhan',
    match: (text, stemText, mapel) => text.includes('bagian akar') || text.includes('anatomi akar') || text.includes('struktur akar') || text.includes('tudung akar') || text.includes('kaliptra') || (text.includes('akar') && (text.includes('rambut akar') || text.includes('bulu akar') || text.includes('pemanjangan'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'rambut_akar' | 'tudung_akar' | 'elongasi' | 'diferensiasi' = 'tudung_akar';
    if (text.includes('rambut') || text.includes('bulu')) pointer = 'rambut_akar';
    else if (text.includes('elongasi') || text.includes('pemanjangan')) pointer = 'elongasi';
    else if (text.includes('diferensiasi')) pointer = 'diferensiasi';
    return { type: 'bagian_akar_tumbuhan', params: { pointer, label: 'X' } };
    }
  },

  // Rule 55: bagian_batang_dikotil_monokotil
  {
    id: 'bagian_batang_dikotil_monokotil',
    match: (text, stemText, mapel) => text.includes('batang dikotil') || text.includes('batang monokotil') || text.includes('irisan batang') || text.includes('penampang batang') || (text.includes('batang') && (text.includes('kambium') || (text.includes('xilem') && text.includes('floem')))),
    extract: (text, stemText, mapel) => {
      let pointer: 'kambium' | 'xilem' | 'floem' | 'korteks' = 'kambium';
    if (text.includes('xilem')) pointer = 'xilem';
    else if (text.includes('floem')) pointer = 'floem';
    else if (text.includes('korteks')) pointer = 'korteks';
    return { type: 'bagian_batang_dikotil_monokotil', params: { pointer, label: 'X' } };
    }
  },

  // Rule 56: bagian_daun_anatomi
  {
    id: 'bagian_daun_anatomi',
    match: (text, stemText, mapel) => text.includes('anatomi daun') || text.includes('struktur daun') || text.includes('jaringan palisade') || text.includes('jaringan tiang') || text.includes('bunga karang') || text.includes('stomata daun') || (text.includes('daun') && (text.includes('kutikula') || text.includes('mesofil') || text.includes('palisade'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'kutikula' | 'epidermis' | 'palisade' | 'spons' | 'stomata' = 'palisade';
    if (text.includes('stomata')) pointer = 'stomata';
    else if (text.includes('spons') || text.includes('bunga karang')) pointer = 'spons';
    else if (text.includes('kutikula')) pointer = 'kutikula';
    else if (text.includes('epidermis')) pointer = 'epidermis';
    return { type: 'bagian_daun_anatomi', params: { pointer, label: 'X' } };
    }
  },

  // Rule 57: alat_ekskresi_ginjal
  {
    id: 'alat_ekskresi_ginjal',
    match: (text, stemText, mapel) => text.includes('ginjal') && (text.includes('ekskresi') || text.includes('anatomi') || text.includes('bagian') || text.includes('korteks') || text.includes('medula') || text.includes('pelvis') || text.includes('ureter')),
    extract: (text, stemText, mapel) => {
      let pointer: 'korteks' | 'medula' | 'pelvis' | 'ureter' = 'korteks';
    if (text.includes('medula')) pointer = 'medula';
    else if (text.includes('pelvis')) pointer = 'pelvis';
    else if (text.includes('ureter')) pointer = 'ureter';
    return { type: 'alat_ekskresi_ginjal', params: { pointer, label: 'X' } };
    }
  },

  // Rule 58: piramida_makanan_ekologi
  {
    id: 'piramida_makanan_ekologi',
    match: (text, stemText, mapel) => text.includes('piramida makanan') || text.includes('tingkat trofik') || text.includes('piramida biomassa') || text.includes('piramida energi') || (text.includes('trofik') && (text.includes('produsen') || text.includes('konsumen primer'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'produsen' | 'konsumen1' | 'konsumen2' | 'konsumen3' = 'konsumen1';
    if (text.includes('produsen')) pointer = 'produsen';
    else if (text.includes('tersier') || text.includes('puncak') || text.includes('trofik 4')) pointer = 'konsumen3';
    else if (text.includes('sekunder') || text.includes('trofik 3')) pointer = 'konsumen2';
    return { type: 'piramida_makanan_ekologi', params: { pointer, label: 'X' } };
    }
  },

  // Rule 59: indra_pengecap_lidah
  {
    id: 'indra_pengecap_lidah',
    match: (text, stemText, mapel) => text.includes('indra pengecap') || text.includes('organ pengecap') || (text.includes('lidah') && (text.includes('papila') || text.includes('reseptor') || text.includes('rasa manis') || text.includes('rasa pahit') || text.includes('rasa asin') || text.includes('rasa asam'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'manis' | 'asin' | 'asam' | 'pahit' = 'pahit';
    if (text.includes('manis')) pointer = 'manis';
    else if (text.includes('asin')) pointer = 'asin';
    else if (text.includes('asam')) pointer = 'asam';
    return { type: 'indra_pengecap_lidah', params: { pointer, label: 'X' } };
    }
  },

  // Rule 60: indra_pembau_hidung
  {
    id: 'indra_pembau_hidung',
    match: (text, stemText, mapel) => text.includes('indra pembau') || text.includes('organ penciuman') || text.includes('indra penciuman') || text.includes('epitel olfaktori') || text.includes('saraf olfaktori') || (text.includes('hidung') && (text.includes('olfaktori') || text.includes('silia sensori') || text.includes('saraf pembau'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'rongga' | 'olfaktori' | 'silia' | 'saraf' = 'olfaktori';
    if (text.includes('rongga')) pointer = 'rongga';
    else if (text.includes('silia')) pointer = 'silia';
    else if (text.includes('saraf')) pointer = 'saraf';
    return { type: 'indra_pembau_hidung', params: { pointer, label: 'X' } };
    }
  },

  // Rule 61: macam_macam_gaya
  {
    id: 'macam_macam_gaya',
    match: (text, stemText, mapel) => text.includes('macam-macam gaya') || text.includes('macam gaya') || text.includes('ragam gaya') || (text.includes('gaya otot') && (text.includes('gaya pegas') || text.includes('gaya gesek') || text.includes('gaya gravitasi'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'otot' | 'pegas' | 'gesek' | 'gravitasi' = 'otot';
    if (text.includes('pegas')) pointer = 'pegas';
    else if (text.includes('gesek')) pointer = 'gesek';
    else if (text.includes('gravitasi')) pointer = 'gravitasi';
    return { type: 'macam_macam_gaya', params: { pointer, label: 'X' } };
    }
  },

  // Rule 62: pesawat_sederhana_bidang_miring
  {
    id: 'pesawat_sederhana_bidang_miring',
    match: (text, stemText, mapel) => text.includes('bidang miring') || text.includes('rampa miring') || (text.includes('pesawat sederhana') && text.includes('miring')),
    extract: (text, stemText, mapel) => {
      let pointer: 's' | 'h' | 'w' | 'f' = 's';
    if (text.includes('tinggi') || text.includes(' h ')) pointer = 'h';
    else if (text.includes('beban') || text.includes(' w ')) pointer = 'w';
    else if (text.includes('kuasa') || text.includes(' f ')) pointer = 'f';
    return { type: 'pesawat_sederhana_bidang_miring', params: { pointer, label: 'X' } };
    }
  },

  // Rule 63: pesawat_sederhana_roda_berporos
  {
    id: 'pesawat_sederhana_roda_berporos',
    match: (text, stemText, mapel) => text.includes('roda berporos') || text.includes('roda dan poros') || text.includes('roda bergandar') || (text.includes('pesawat sederhana') && (text.includes('poros') || text.includes('gir'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'roda' | 'poros' | 'gandar' | 'beban' = 'roda';
    if (text.includes('poros') || text.includes('gandar')) pointer = 'poros';
    else if (text.includes('beban') || text.includes('tali')) pointer = 'beban';
    return { type: 'pesawat_sederhana_roda_berporos', params: { pointer, label: 'X' } };
    }
  },

  // Rule 64: pembangkit_listrik_plta
  {
    id: 'pembangkit_listrik_plta',
    match: (text, stemText, mapel) => text.includes('plta') || text.includes('pembangkit listrik tenaga air') || (text.includes('turbin air') && (text.includes('waduk') || text.includes('generator') || text.includes('penstock'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'waduk' | 'penstock' | 'turbin' | 'generator' = 'turbin';
    if (text.includes('waduk') || text.includes('bendungan')) pointer = 'waduk';
    else if (text.includes('penstock') || text.includes('pipa pesat')) pointer = 'penstock';
    else if (text.includes('generator')) pointer = 'generator';
    return { type: 'pembangkit_listrik_plta', params: { pointer, label: 'X' } };
    }
  },

  // Rule 65: panel_surya_plts
  {
    id: 'panel_surya_plts',
    match: (text, stemText, mapel) => text.includes('plts') || text.includes('panel surya') || text.includes('pembangkit surya') || text.includes('fotovoltaik') || (text.includes('sel surya') && (text.includes('inverter') || text.includes('baterai'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'panel' | 'controller' | 'inverter' | 'baterai' = 'inverter';
    if (text.includes('panel') || text.includes('modul')) pointer = 'panel';
    else if (text.includes('controller')) pointer = 'controller';
    else if (text.includes('baterai') || text.includes('aki')) pointer = 'baterai';
    return { type: 'panel_surya_plts', params: { pointer, label: 'X' } };
    }
  },

  // Rule 66: energi_angin_pltb
  {
    id: 'energi_angin_pltb',
    match: (text, stemText, mapel) => text.includes('pltb') || text.includes('pembangkit listrik tenaga angin') || text.includes('turbin angin') || (text.includes('kincir angin') && (text.includes('generator') || text.includes('listrik') || text.includes('sudu'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'bilah' | 'hub' | 'gearbox' | 'generator' | 'tiang' = 'generator';
    if (text.includes('bilah') || text.includes('sudu') || text.includes('baling')) pointer = 'bilah';
    else if (text.includes('gearbox')) pointer = 'gearbox';
    else if (text.includes('tiang') || text.includes('menara')) pointer = 'tiang';
    return { type: 'energi_angin_pltb', params: { pointer, label: 'X' } };
    }
  },

  // Rule 67: termos_air_panas
  {
    id: 'termos_air_panas',
    match: (text, stemText, mapel) => text.includes('termos') || text.includes('termos air') || (text.includes('dinding termos') && (text.includes('vakum') || text.includes('hampa'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'sumbat' | 'dinding_dalam' | 'vakum' | 'dinding_luar' = 'vakum';
    if (text.includes('sumbat') || text.includes('tutup')) pointer = 'sumbat';
    else if (text.includes('kaca') || text.includes('cermin') || text.includes('dalam')) pointer = 'dinding_dalam';
    else if (text.includes('luar')) pointer = 'dinding_luar';
    return { type: 'termos_air_panas', params: { pointer, label: 'X' } };
    }
  },

  // Rule 68: perpindahan_panas_konduksi_konveksi_radiasi
  {
    id: 'perpindahan_panas_konduksi_konveksi_radiasi',
    match: (text, stemText, mapel) => text.includes('konduksi konveksi radiasi') || (text.includes('perpindahan kalor') && text.includes('konduksi') && text.includes('radiasi')) || (text.includes('perpindahan panas') && text.includes('konveksi')),
    extract: (text, stemText, mapel) => {
      let pointer: 'konduksi' | 'konveksi' | 'radiasi' = 'konveksi';
    if (text.includes('konduksi')) pointer = 'konduksi';
    else if (text.includes('radiasi')) pointer = 'radiasi';
    return { type: 'perpindahan_panas_konduksi_konveksi_radiasi', params: { pointer, label: 'X' } };
    }
  },

  // Rule 69: gerak_semu_matahari
  {
    id: 'gerak_semu_matahari',
    match: (text, stemText, mapel) => text.includes('gerak semu matahari') || text.includes('gerak semu harian') || text.includes('gerak semu tahunan') || (text.includes('lintasan matahari') && (text.includes('khatulistiwa') || text.includes('23,5'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'utara' | 'khatulistiwa' | 'selatan' = 'utara';
    if (text.includes('selatan')) pointer = 'selatan';
    else if (text.includes('khatulistiwa') || text.includes('ekuator')) pointer = 'khatulistiwa';
    return { type: 'gerak_semu_matahari', params: { pointer, label: 'X' } };
    }
  },

  // Rule 70: musim_dan_revolusi_bumi
  {
    id: 'musim_dan_revolusi_bumi',
    match: (text, stemText, mapel) => text.includes('empat musim') || (text.includes('musim') && text.includes('revolusi bumi')) || (text.includes('kemiringan sumbu bumi') && text.includes('musim')) || text.includes('solstice'),
    extract: (text, stemText, mapel) => {
      let pointer: 'maret' | 'juni' | 'september' | 'desember' = 'juni';
    if (text.includes('desember')) pointer = 'desember';
    else if (text.includes('maret')) pointer = 'maret';
    else if (text.includes('september')) pointer = 'september';
    return { type: 'musim_dan_revolusi_bumi', params: { pointer, label: 'X' } };
    }
  },

  // Rule 71: siklus_karbon_oksigen
  {
    id: 'siklus_karbon_oksigen',
    match: (text, stemText, mapel) => text.includes('siklus karbon') || text.includes('siklus oksigen') || text.includes('daur karbon') || (text.includes('karbon') && text.includes('fotosintesis') && text.includes('respirasi')),
    extract: (text, stemText, mapel) => {
      let pointer: 'fotosintesis' | 'respirasi' | 'pembusukan' | 'co2' = 'fotosintesis';
    if (text.includes('respirasi') || text.includes('pernapasan')) pointer = 'respirasi';
    else if (text.includes('pembusukan') || text.includes('dekomposisi')) pointer = 'pembusukan';
    else if (text.includes('co2') || text.includes('karbon dioksida')) pointer = 'co2';
    return { type: 'siklus_karbon_oksigen', params: { pointer, label: 'X' } };
    }
  },

  // Rule 72: garis_wallace_weber
  {
    id: 'garis_wallace_weber',
    match: (text, stemText, mapel) => text.includes('garis wallace') || text.includes('garis weber') || (text.includes('persebaran fauna') && (text.includes('asiatis') || text.includes('australis') || text.includes('peralihan'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'asiatis' | 'wallace' | 'peralihan' | 'weber' | 'australis' = 'peralihan';
    if (text.includes('asiatis')) pointer = 'asiatis';
    else if (text.includes('australis')) pointer = 'australis';
    else if (text.includes('weber')) pointer = 'weber';
    else if (text.includes('wallace')) pointer = 'wallace';
    return { type: 'garis_wallace_weber', params: { pointer, label: 'X' } };
    }
  },

  // Rule 73: candi_dan_peninggalan_sejarah
  {
    id: 'candi_dan_peninggalan_sejarah',
    match: (text, stemText, mapel) => text.includes('candi hindu') || text.includes('candi buddha') || (text.includes('candi') && (text.includes('stupa') || text.includes('ratna') || text.includes('prambanan') || text.includes('borobudur'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'hindu' | 'buddha' | 'stupa' | 'kaki' = 'stupa';
    if (text.includes('hindu') || text.includes('ratna') || text.includes('prambanan')) pointer = 'hindu';
    else if (text.includes('kaki') || text.includes('lapik') || text.includes('kamadhatu')) pointer = 'kaki';
    return { type: 'candi_dan_peninggalan_sejarah', params: { pointer, label: 'X' } };
    }
  },

  // Rule 74: motif_batik_nusantara
  {
    id: 'motif_batik_nusantara',
    match: (text, stemText, mapel) => text.includes('motif batik') || text.includes('corak batik') || text.includes('mega mendung') || text.includes('batik parang') || text.includes('batik kawung') || text.includes('batik ceplok'),
    extract: (text, stemText, mapel) => {
      let pointer: 'parang' | 'megamendung' | 'kawung' | 'ceplok' = 'megamendung';
    if (text.includes('parang')) pointer = 'parang';
    else if (text.includes('kawung')) pointer = 'kawung';
    else if (text.includes('ceplok')) pointer = 'ceplok';
    return { type: 'motif_batik_nusantara', params: { pointer, label: 'X' } };
    }
  },

  // Rule 75: senjata_tradisional_nusantara
  {
    id: 'senjata_tradisional_nusantara',
    match: (text, stemText, mapel) => text.includes('senjata tradisional') || text.includes('senjata adat') || (text.includes('senjata daerah') && (text.includes('keris') || text.includes('rencong') || text.includes('kujang') || text.includes('mandau'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'keris' | 'rencong' | 'kujang' | 'mandau' = 'keris';
    if (text.includes('rencong')) pointer = 'rencong';
    else if (text.includes('kujang')) pointer = 'kujang';
    else if (text.includes('mandau')) pointer = 'mandau';
    return { type: 'senjata_tradisional_nusantara', params: { pointer, label: 'X' } };
    }
  },

  // Rule 76: tarian_daerah_nusantara
  {
    id: 'tarian_daerah_nusantara',
    match: (text, stemText, mapel) => text.includes('tarian daerah') || text.includes('tari daerah') || (text.includes('tari') && (text.includes('saman') || text.includes('piring') || text.includes('pendet') || text.includes('jaipong'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'saman' | 'piring' | 'pendet' | 'jaipong' = 'saman';
    if (text.includes('piring')) pointer = 'piring';
    else if (text.includes('pendet')) pointer = 'pendet';
    else if (text.includes('jaipong')) pointer = 'jaipong';
    return { type: 'tarian_daerah_nusantara', params: { pointer, label: 'X' } };
    }
  },

  // Rule 77: piramida_penduduk
  {
    id: 'piramida_penduduk',
    match: (text, stemText, mapel) => text.includes('piramida penduduk') || (text.includes('demografi') && text.includes('penduduk')) || (text.includes('piramida') && text.includes('usia muda') && text.includes('usia tua')),
    extract: (text, stemText, mapel) => {
      let pointer: 'muda' | 'dewasa' | 'tua' = 'muda';
    if (text.includes('tua') || text.includes('lansia')) pointer = 'tua';
    else if (text.includes('dewasa') || text.includes('produktif')) pointer = 'dewasa';
    return { type: 'piramida_penduduk', params: { pointer, label: 'X' } };
    }
  },

  // Rule 78: struktur_fabel_alur_cerita
  {
    id: 'struktur_fabel_alur_cerita',
    match: (text, stemText, mapel) => text.includes('struktur fabel') || text.includes('struktur teks fabel') || text.includes('alur cerita fabel') || (text.includes('fabel') && (text.includes('orientasi') || text.includes('komplikasi') || text.includes('resolusi') || text.includes('koda'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'orientasi' | 'komplikasi' | 'resolusi' | 'koda' = 'komplikasi';
    if (text.includes('orientasi')) pointer = 'orientasi';
    else if (text.includes('resolusi')) pointer = 'resolusi';
    else if (text.includes('koda') || text.includes('amanat')) pointer = 'koda';
    return { type: 'struktur_fabel_alur_cerita', params: { pointer, label: 'X' } };
    }
  },

  // Rule 79: jenis_paragraf_induktif_deduktif
  {
    id: 'jenis_paragraf_induktif_deduktif',
    match: (text, stemText, mapel) => text.includes('paragraf deduktif') || text.includes('paragraf induktif') || text.includes('paragraf campuran') || (text.includes('jenis paragraf') && (text.includes('deduktif') || text.includes('induktif'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'deduktif' | 'induktif' | 'campuran' = 'deduktif';
    if (text.includes('induktif')) pointer = 'induktif';
    else if (text.includes('campuran')) pointer = 'campuran';
    return { type: 'jenis_paragraf_induktif_deduktif', params: { pointer, label: 'X' } };
    }
  },

  // Rule 80: unsur_iklan_media_cetak
  {
    id: 'unsur_iklan_media_cetak',
    match: (text, stemText, mapel) => text.includes('unsur iklan') || text.includes('iklan media cetak') || (text.includes('iklan') && (text.includes('headline') || text.includes('gambar iklan') || text.includes('kalimat persuasif iklan') || text.includes('call to action'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'headline' | 'gambar' | 'isi' | 'kontak' = 'headline';
    if (text.includes('gambar') || text.includes('visual')) pointer = 'gambar';
    else if (text.includes('isi') || text.includes('pesan')) pointer = 'isi';
    else if (text.includes('kontak') || text.includes('cta') || text.includes('nomor telepon')) pointer = 'kontak';
    return { type: 'unsur_iklan_media_cetak', params: { pointer, label: 'X' } };
    }
  },

  // Rule 81: pohon_keluarga_genealogi
  {
    id: 'pohon_keluarga_genealogi',
    match: (text, stemText, mapel) => text.includes('pohon keluarga') || text.includes('silsilah keluarga') || text.includes('diagram silsilah') || text.includes('genealogi'),
    extract: (text, stemText, mapel) => {
      let pointer: 'kakek' | 'nenek' | 'ayah' | 'ibu' | 'paman' | 'bibi' | 'anak' | 'sepupu' = 'ayah';
    if (text.includes('kakek')) pointer = 'kakek';
    else if (text.includes('nenek')) pointer = 'nenek';
    else if (text.includes('ibu')) pointer = 'ibu';
    else if (text.includes('paman')) pointer = 'paman';
    else if (text.includes('bibi')) pointer = 'bibi';
    else if (text.includes('anak') || text.includes('cucu')) pointer = 'anak';
    return { type: 'pohon_keluarga_genealogi', params: { pointer, label: 'X' } };
    }
  },

  // Rule 82: koperasi_sekolah
  {
    id: 'koperasi_sekolah',
    match: (text, stemText, mapel) => text.includes('koperasi sekolah') || (text.includes('koperasi') && (text.includes('rapat anggota') || text.includes('pengurus koperasi') || text.includes('shu koperasi') || text.includes('pengawas koperasi'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'anggota' | 'pengurus' | 'pengawas' | 'usaha' | 'shu' = 'pengurus';
    if (text.includes('anggota') || text.includes('rat')) pointer = 'anggota';
    else if (text.includes('pengawas')) pointer = 'pengawas';
    else if (text.includes('usaha') || text.includes('toko')) pointer = 'usaha';
    else if (text.includes('shu')) pointer = 'shu';
    return { type: 'koperasi_sekolah', params: { pointer, label: 'X' } };
    }
  },

  // Rule 83: sudut_luar_segitiga
  {
    id: 'sudut_luar_segitiga',
    match: (text, stemText, mapel) => text.includes('sudut luar segitiga') || text.includes('teorema sudut luar') || (text.includes('sudut luar') && text.includes('segitiga')),
    extract: (text, stemText, mapel) => {
      return { type: 'sudut_luar_segitiga', params: { a: 50, b: 60, label: 'X' } };
    }
  },

  // Rule 84: jaring_kerucut
  {
    id: 'jaring_kerucut',
    match: (text, stemText, mapel) => text.includes('jaring kerucut') || text.includes('jaring-jaring kerucut') || (text.includes('selimut kerucut') && text.includes('lingkaran alas')),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_kerucut', params: { r: 7, s: 20, label: 'X' } };
    }
  },

  // Rule 85: jaring_tabung
  {
    id: 'jaring_tabung',
    match: (text, stemText, mapel) => text.includes('jaring tabung') || text.includes('jaring-jaring tabung') || text.includes('jaring silinder') || (text.includes('selimut tabung') && text.includes('lingkaran')),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_tabung', params: { r: 5, t: 12, label: 'X' } };
    }
  },

  // Rule 86: luas_permukaan_gabungan
  {
    id: 'luas_permukaan_gabungan',
    match: (text, stemText, mapel) => text.includes('luas permukaan gabungan') || (text.includes('gabungan') && text.includes('balok') && text.includes('limas')) || (text.includes('bangun ruang gabungan') && text.includes('limas')),
    extract: (text, stemText, mapel) => {
      return { type: 'luas_permukaan_gabungan', params: { s: 8, tLimas: 6, label: 'X' } };
    }
  },

  // Rule 87: diagram_alur_logika_gerbang
  {
    id: 'diagram_alur_logika_gerbang',
    match: (text, stemText, mapel) => text.includes('diagram alur logika') || text.includes('alir logika') || text.includes('gerbang logika') || text.includes('terminator flowchart') || (text.includes('diagram alur') && (text.includes('gerbang') || text.includes('logika'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'start_stop' | 'input_output' | 'proses' | 'decision' = 'decision';
    if (text.includes('start') || text.includes('stop') || text.includes('mulai') || text.includes('selesai') || text.includes('terminator')) pointer = 'start_stop';
    else if (text.includes('input') || text.includes('output') || text.includes('jajar genjang')) pointer = 'input_output';
    else if (text.includes('proses') || text.includes('persegi')) pointer = 'proses';
    return { type: 'diagram_alur_logika_gerbang', params: { pointer, label: 'X' } };
    }
  },

  // Rule 88: koding_variabel_operator
  {
    id: 'koding_variabel_operator',
    match: (text, stemText, mapel) => (text.includes('scratch') && (text.includes('variabel') || text.includes('operator'))) || text.includes('koding variabel') || text.includes('blok operator'),
    extract: (text, stemText, mapel) => {
      return { type: 'koding_variabel_operator', params: { label: 'X' } };
    }
  },

  // Rule 89: garis_bilangan_bulat_operasi
  {
    id: 'garis_bilangan_bulat_operasi',
    match: (text, stemText, mapel) => (text.includes('garis bilangan') && (text.includes('penjumlahan') || text.includes('pengurangan') || text.includes('operasi'))) || (text.includes('panah') && text.includes('garis bilangan bulat')),
    extract: (text, stemText, mapel) => {
      return { type: 'garis_bilangan_bulat_operasi', params: { a: 3, b: -5, label: 'X' } };
    }
  },

  // Rule 90: pecahan_desimal_persen_senilai
  {
    id: 'pecahan_desimal_persen_senilai',
    match: (text, stemText, mapel) => text.includes('pecahan desimal persen') || (text.includes('pecahan senilai') && text.includes('persen')) || (text.includes('desimal') && text.includes('persen') && text.includes('pecahan biasa')),
    extract: (text, stemText, mapel) => {
      return { type: 'pecahan_desimal_persen_senilai', params: { label: 'X' } };
    }
  },

  // Rule 91: jam_digital_komparasi
  {
    id: 'jam_digital_komparasi',
    match: (text, stemText, mapel) => text.includes('jam digital') && (text.includes('jam analog') || text.includes('jarum jam') || text.includes('komparasi') || text.includes('perbandingan')),
    extract: (text, stemText, mapel) => {
      return { type: 'jam_digital_komparasi', params: { jam: 14, menit: 45, label: 'X' } };
    }
  },

  // Rule 92: diagram_sankey_energi
  {
    id: 'diagram_sankey_energi',
    match: (text, stemText, mapel) => text.includes('sankey') || text.includes('diagram alir energi') || (text.includes('energi berguna') && text.includes('energi terbuang')),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_sankey_energi', params: { input: 100, berguna: 25, terbuang: 75, label: 'X' } };
    }
  },

  // Rule 93: skala_peta_batang
  {
    id: 'skala_peta_batang',
    match: (text, stemText, mapel) => text.includes('skala batang') || text.includes('skala grafis') || text.includes('skala garis') || (text.includes('skala peta') && (text.includes('batang') || text.includes('grafis'))),
    extract: (text, stemText, mapel) => {
      return { type: 'skala_peta_batang', params: { label: 'X' } };
    }
  },

  // Rule 94: jaring_limas_segiempat
  {
    id: 'jaring_limas_segiempat',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && (text.includes('segiempat') || text.includes('persegi')),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_limas_segiempat', params: { s: 8, t: 10 } };
    }
  },

  // Rule 95: jaring_limas_segitiga
  {
    id: 'jaring_limas_segitiga',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && text.includes('segitiga'),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_limas_segitiga', params: { s: 8 } };
    }
  },

  // Rule 96: jaring_prisma_segitiga
  {
    id: 'jaring_prisma_segitiga',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('prisma') && text.includes('segitiga'),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_prisma_segitiga', params: { a: 6, t: 8, p: 12 } };
    }
  },

  // Rule 97: lingkaran_tembereng
  {
    id: 'lingkaran_tembereng',
    match: (text, stemText, mapel) => text.includes('tembereng') || (text.includes('lingkaran') && text.includes('tali busur') && text.includes('juring')),
    extract: (text, stemText, mapel) => {
      return { type: 'lingkaran_tembereng', params: { r: 14, sudut: 90 } };
    }
  },

  // Rule 98: segi_enam_beraturan
  {
    id: 'segi_enam_beraturan',
    match: (text, stemText, mapel) => text.includes('segi enam beraturan') || text.includes('heksagon'),
    extract: (text, stemText, mapel) => {
      return { type: 'segi_enam_beraturan', params: { s: 8 } };
    }
  },

  // Rule 99: transformasi_refleksi
  {
    id: 'transformasi_refleksi',
    match: (text, stemText, mapel) => text.includes('refleksi') || text.includes('pencerminan') || text.includes('cermin'),
    extract: (text, stemText, mapel) => {
      return { type: 'transformasi_refleksi', params: { sumbu: 'vertikal' } };
    }
  },

  // Rule 100: transformasi_translasi
  {
    id: 'transformasi_translasi',
    match: (text, stemText, mapel) => text.includes('translasi') || text.includes('pergeseran bangun'),
    extract: (text, stemText, mapel) => {
      return { type: 'transformasi_translasi', params: { dx: 3, dy: 2 } };
    }
  },

  // Rule 101: diagram_lingkaran_derajat
  {
    id: 'diagram_lingkaran_derajat',
    match: (text, stemText, mapel) => text.includes('lingkaran derajat') || (text.includes('diagram lingkaran') && (text.includes('derajat') || text.includes('360°') || text.includes('360 derajat'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_lingkaran_derajat', params: { label: 'X' } };
    }
  },

  // Rule 102: diagram_batang_ganda
  {
    id: 'diagram_batang_ganda',
    match: (text, stemText, mapel) => text.includes('batang ganda') || (text.includes('diagram batang') && (text.includes('ganda') || text.includes('perbandingan') || text.includes('laki-laki dan perempuan'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_batang_ganda', params: { label: 'X' } };
    }
  },

  // Rule 103: diagram_garis_ganda
  {
    id: 'diagram_garis_ganda',
    match: (text, stemText, mapel) => text.includes('garis ganda') || (text.includes('diagram garis') && (text.includes('ganda') || text.includes('dua tahun') || text.includes('2023 dan 2024'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_garis_ganda', params: { label: 'X' } };
    }
  },

  // Rule 104: dot_plot
  {
    id: 'dot_plot',
    match: (text, stemText, mapel) => text.includes('dot plot') || text.includes('diagram titik') || text.includes('line plot'),
    extract: (text, stemText, mapel) => {
      return { type: 'dot_plot', params: { label: 'X' } };
    }
  },

  // Rule 105: diagram_batang_horizontal
  {
    id: 'diagram_batang_horizontal',
    match: (text, stemText, mapel) => text.includes('batang mendatar') || text.includes('batang horizontal') || (text.includes('diagram batang') && text.includes('mendatar')),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_batang_horizontal', params: { label: 'X' } };
    }
  },

  // Rule 106: tabel_kontingensi
  {
    id: 'tabel_kontingensi',
    match: (text, stemText, mapel) => text.includes('tabel kontingensi') || text.includes('frekuensi dua arah') || (text.includes('kontingensi') && text.includes('tabel')),
    extract: (text, stemText, mapel) => {
      return { type: 'tabel_kontingensi', params: { label: 'X' } };
    }
  },

  // Rule 107: blok_dienes
  {
    id: 'blok_dienes',
    match: (text, stemText, mapel) => text.includes('dienes') || text.includes('blok dienes') || text.includes('balok dienes') || text.includes('base ten blocks'),
    extract: (text, stemText, mapel) => {
      return { type: 'blok_dienes', params: { ribuan: 1, ratusan: 2, puluhan: 4, satuan: 5 } };
    }
  },

  // Rule 108: sempoa_abakus
  {
    id: 'sempoa_abakus',
    match: (text, stemText, mapel) => text.includes('sempoa') || text.includes('abakus') || text.includes('soroban'),
    extract: (text, stemText, mapel) => {
      return { type: 'sempoa_abakus', params: { nilai: '3527' } };
    }
  },

  // Rule 109: tabel_nilai_tempat
  {
    id: 'tabel_nilai_tempat',
    match: (text, stemText, mapel) => text.includes('tabel nilai tempat') || (text.includes('nilai tempat') && text.includes('tabel')),
    extract: (text, stemText, mapel) => {
      return { type: 'tabel_nilai_tempat', params: { angka: '47285' } };
    }
  },

  // Rule 110: garis_bilangan_pecahan
  {
    id: 'garis_bilangan_pecahan',
    match: (text, stemText, mapel) => text.includes('garis bilangan pecahan') || (text.includes('garis bilangan') && text.includes('pecahan')),
    extract: (text, stemText, mapel) => {
      return { type: 'garis_bilangan_pecahan', params: { penyebut: 4, target: 3 } };
    }
  },

  // Rule 111: garis_bilangan_desimal
  {
    id: 'garis_bilangan_desimal',
    match: (text, stemText, mapel) => text.includes('garis bilangan desimal') || (text.includes('garis bilangan') && (text.includes('desimal') || text.includes('koma'))),
    extract: (text, stemText, mapel) => {
      return { type: 'garis_bilangan_desimal', params: { min: 1.0, max: 2.0, target: 1.7 } };
    }
  },

  // Rule 112: perkalian_lattice
  {
    id: 'perkalian_lattice',
    match: (text, stemText, mapel) => text.includes('perkalian lattice') || text.includes('metode kisi') || text.includes('tulang napier') || text.includes('perkalian kisi'),
    extract: (text, stemText, mapel) => {
      return { type: 'perkalian_lattice', params: { num1: 34, num2: 25 } };
    }
  },

  // Rule 113: pola_ubin
  {
    id: 'pola_ubin',
    match: (text, stemText, mapel) => text.includes('pola ubin') || text.includes('barisan ubin') || (text.includes('ubin') && text.includes('pola ke-')),
    extract: (text, stemText, mapel) => {
      return { type: 'pola_ubin', params: { label: 'X' } };
    }
  },

  // Rule 114: pita_pecahan
  {
    id: 'pita_pecahan',
    match: (text, stemText, mapel) => text.includes('pita pecahan') || text.includes('fraction strips') || text.includes('batang pecahan'),
    extract: (text, stemText, mapel) => {
      return { type: 'pita_pecahan', params: { label: 'X' } };
    }
  },

  // Rule 115: matriks_nilai_uang
  {
    id: 'matriks_nilai_uang',
    match: (text, stemText, mapel) => text.includes('uang rupiah') || (text.includes('uang') && (text.includes('kertas') || text.includes('logam') || text.includes('pecahan uang'))),
    extract: (text, stemText, mapel) => {
      return { type: 'matriks_nilai_uang', params: { label: 'X' } };
    }
  },

  // Rule 116: papan_galton_peluang
  {
    id: 'papan_galton_peluang',
    match: (text, stemText, mapel) => text.includes('papan galton') || text.includes('quincunx') || text.includes('galton board') || (text.includes('kelereng') && text.includes('pasak')),
    extract: (text, stemText, mapel) => {
      return { type: 'papan_galton_peluang', params: { label: 'X' } };
    }
  },

  // Rule 117: kartu_peluang
  {
    id: 'kartu_peluang',
    match: (text, stemText, mapel) => text.includes('kartu peluang') || (text.includes('kartu') && text.includes('peluang') && (text.includes('terambil') || text.includes('ruang sampel'))),
    extract: (text, stemText, mapel) => {
      return { type: 'kartu_peluang', params: { label: 'X' } };
    }
  },

  // Rule 118: stopwatch_analog
  {
    id: 'stopwatch_analog',
    match: (text, stemText, mapel) => text.includes('stopwatch') || text.includes('stop watch'),
    extract: (text, stemText, mapel) => {
      const sMatch = stemText.match(/(\d+)\s*(?:detik|sekon)/i);
    const mMatch = stemText.match(/(\d+)\s*menit/i);
    return { type: 'stopwatch_analog', params: { detik: sMatch ? parseInt(sMatch[1]) : 35, menit: mMatch ? parseInt(mMatch[1]) : 2 } };
    }
  },

  // Rule 119: jangka_sorong
  {
    id: 'jangka_sorong',
    match: (text, stemText, mapel) => text.includes('jangka sorong') || text.includes('vernier caliper'),
    extract: (text, stemText, mapel) => {
      return { type: 'jangka_sorong', params: { utama: 2.3, nonius: 4 } };
    }
  },

  // Rule 120: bejana_literan
  {
    id: 'bejana_literan',
    match: (text, stemText, mapel) => text.includes('bejana literan') || text.includes('takaran beras') || text.includes('literan beras'),
    extract: (text, stemText, mapel) => {
      return { type: 'bejana_literan', params: { kapasitas: 1, terisi: 0.75 } };
    }
  },

  // Rule 121: gelas_erlenmeyer
  {
    id: 'gelas_erlenmeyer',
    match: (text, stemText, mapel) => text.includes('gelas erlenmeyer') || text.includes('labu erlenmeyer') || text.includes('erlenmeyer'),
    extract: (text, stemText, mapel) => {
      return { type: 'gelas_erlenmeyer', params: { volume: 150, max: 250 } };
    }
  },

  // Rule 122: meteran_gulung
  {
    id: 'meteran_gulung',
    match: (text, stemText, mapel) => text.includes('meteran gulung') || text.includes('meteran pita') || text.includes('meteran tukang'),
    extract: (text, stemText, mapel) => {
      return { type: 'meteran_gulung', params: { panjang: 3.5, unit: 'm' } };
    }
  },

  // Rule 123: tangga_satuan_panjang
  {
    id: 'tangga_satuan_panjang',
    match: (text, stemText, mapel) => text.includes('tangga satuan panjang') || (text.includes('satuan panjang') && (text.includes('km') || text.includes('tangga'))),
    extract: (text, stemText, mapel) => {
      return { type: 'tangga_satuan_panjang', params: { dari: 'm', ke: 'cm' } };
    }
  },

  // Rule 124: tangga_satuan_massa
  {
    id: 'tangga_satuan_massa',
    match: (text, stemText, mapel) => text.includes('tangga satuan massa') || text.includes('tangga satuan berat') || (text.includes('satuan massa') && text.includes('tangga')),
    extract: (text, stemText, mapel) => {
      return { type: 'tangga_satuan_massa', params: { dari: 'kg', ke: 'g' } };
    }
  },

  // Rule 125: tangga_satuan_volume
  {
    id: 'tangga_satuan_volume',
    match: (text, stemText, mapel) => text.includes('tangga satuan volume') || text.includes('satuan liter') || (text.includes('satuan volume') && text.includes('tangga')),
    extract: (text, stemText, mapel) => {
      return { type: 'tangga_satuan_volume', params: { dari: 'l', ke: 'ml' } };
    }
  },

  // Rule 126: jaring_kubus
  {
    id: 'jaring_kubus',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('kubus'),
    extract: (text, stemText, mapel) => {
      const sMatch = stemText.match(/(?:rusuk|sisi)\D*(\d+)/i) || stemText.match(/s\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    const s = sMatch ? parseInt(sMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 5);
    let pola: 'salib' | 'tangga' | 't' = 'salib';
    if (text.includes('tangga') || text.includes('1-4-1')) pola = 'tangga';
    else if (text.includes('huruf t') || text.includes('pola t')) pola = 't';
    return { type: 'jaring_kubus', params: { s, unit: 'cm', pola } };
    }
  },

  // Rule 127: jaring_balok
  {
    id: 'jaring_balok',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('balok'),
    extract: (text, stemText, mapel) => {
      const pMatch = stemText.match(/panjang\D*(\d+)/i) || stemText.match(/p\s*=\s*(\d+)/i);
    const lMatch = stemText.match(/lebar\D*(\d+)/i) || stemText.match(/l\s*=\s*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i) || stemText.match(/t\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let p = pMatch ? parseInt(pMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 6);
    let l = lMatch ? parseInt(lMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 4);
    let t = tMatch ? parseInt(tMatch[1]) : (nums && nums.length >= 3 ? parseInt(nums[2]) : 3);
    return { type: 'jaring_balok', params: { p, l, t, unit: 'cm' } };
    }
  },

  // Rule 128: persegi_panjang
  {
    id: 'persegi_panjang',
    match: (text, stemText, mapel) => text.includes('persegi panjang') || text.includes('persegipanjang'),
    extract: (text, stemText, mapel) => {
      const pMatch = stemText.match(/panjang\D*(\d+)/i) || stemText.match(/p\s*=\s*(\d+)/i);
    const lMatch = stemText.match(/lebar\D*(\d+)/i) || stemText.match(/l\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let p = pMatch ? parseInt(pMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 12);
    let l = lMatch ? parseInt(lMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 8);
    return { type: 'persegi_panjang', params: { p, l, unit: 'cm' } };
    }
  },

  // Rule 129: segitiga_sama_sisi
  {
    id: 'segitiga_sama_sisi',
    match: (text, stemText, mapel) => text.includes('segitiga sama sisi') || text.includes('segitiga samasisi'),
    extract: (text, stemText, mapel) => {
      const sMatch = stemText.match(/sisi\D*(\d+)/i) || stemText.match(/s\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    const s = sMatch ? parseInt(sMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 10);
    return { type: 'segitiga_sama_sisi', params: { s, unit: 'cm' } };
    }
  },

  // Rule 130: segitiga_sama_kaki
  {
    id: 'segitiga_sama_kaki',
    match: (text, stemText, mapel) => text.includes('segitiga sama kaki') || text.includes('segitiga samakaki'),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 131: segitiga_siku
  {
    id: 'segitiga_siku',
    match: (text, stemText, mapel) => text.includes('segitiga siku') || text.includes('segitiga sikusiku'),
    extract: (text, stemText, mapel) => {
      const aMatch = stemText.match(/alas\D*(\d+)/i) || stemText.match(/a\s*=\s*(\d+)/i);
    const tMatch = stemText.match(/tinggi\D*(\d+)/i) || stemText.match(/t\s*=\s*(\d+)/i);
    const mMatch = stemText.match(/miring\D*(\d+)/i) || stemText.match(/c\s*=\s*(\d+)/i);
    const nums = stemText.match(/\b(\d+)\s*(?:cm|m)\b/g);
    let alas = aMatch ? parseInt(aMatch[1]) : (nums && nums.length >= 1 ? parseInt(nums[0]) : 6);
    let tinggi = tMatch ? parseInt(tMatch[1]) : (nums && nums.length >= 2 ? parseInt(nums[1]) : 8);
    let miring = mMatch ? parseInt(mMatch[1]) : (nums && nums.length >= 3 ? parseInt(nums[2]) : 10);
    return { type: 'segitiga_siku', params: { alas, tinggi, miring, unit: 'cm' } };
    }
  },

  // Rule 132: koordinat_poligon
  {
    id: 'koordinat_poligon',
    match: (text, stemText, mapel) => text.includes('poligon kartesius') || (text.includes('koordinat') && (text.includes('poligon') || text.includes('luas segitiga pada bidang'))),
    extract: (text, stemText, mapel) => {
      return { type: 'koordinat_poligon', params: { titik: [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 3, y: 5 }] } };
    }
  },

  // Rule 133: koordinat
  {
    id: 'koordinat',
    match: (text, stemText, mapel) => text.includes('kartesius') || text.includes('koordinat') || (text.includes('titik') && /\([+-]?\d+\s*,\s*[+-]?\d+\)/.test(text)),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 134: diagram_venn
  {
    id: 'diagram_venn',
    match: (text, stemText, mapel) => text.includes('diagram venn') || text.includes('diagram ven') || (text.includes('himpunan') && (text.includes('irisan') || text.includes('gabungan'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_venn', params: {} };
    }
  },

  // Rule 135: pictogram
  {
    id: 'pictogram',
    match: (text, stemText, mapel) => text.includes('pictogram') || text.includes('piktogram') || text.includes('diagram gambar'),
    extract: (text, stemText, mapel) => {
      return { type: 'pictogram', params: {} };
    }
  },

  // Rule 136: balok
  {
    id: 'balok',
    match: (text, stemText, mapel) => !text.includes('meteran') && !text.includes('not balok') && text.includes('balok') && (text.includes('panjang') || text.includes('volume') || text.includes('rusuk') || text.includes('cm')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 137: kubus
  {
    id: 'kubus',
    match: (text, stemText, mapel) => text.includes('kubus') && (text.includes('rusuk') || text.includes('sisi') || text.includes('volume') || text.includes('luas permukaan')),
    extract: (text, stemText, mapel) => {
      const sMatch = stemText.match(/(?:rusuk|sisi)\D*(\d+)/i) || stemText.match(/s\s*=\s*(\d+)/i);
    const s = sMatch ? parseInt(sMatch[1]) : 10;
    return { type: 'kubus', params: { s, unit: 'cm' } };
    }
  },

  // Rule 138: tabung
  {
    id: 'tabung',
    match: (text, stemText, mapel) => text.includes('tabung') && (text.includes('jari-jari') || text.includes('diameter') || text.includes('tinggi')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 139: kerucut
  {
    id: 'kerucut',
    match: (text, stemText, mapel) => text.includes('kerucut') && (text.includes('jari-jari') || text.includes('tinggi') || text.includes('pelukis')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 140: bola
  {
    id: 'bola',
    match: (text, stemText, mapel) => text.includes('bola') && (text.includes('jari-jari') || text.includes('diameter') || text.includes('volume') || text.includes('luas permukaan')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 141: prisma
  {
    id: 'prisma',
    match: (text, stemText, mapel) => text.includes('prisma') && (text.includes('segitiga') || text.includes('alas') || text.includes('volume') || text.includes('tinggi')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 142: limas
  {
    id: 'limas',
    match: (text, stemText, mapel) => text.includes('limas') && (text.includes('alas') || text.includes('sisi') || text.includes('volume') || text.includes('tinggi')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 143: lingkaran
  {
    id: 'lingkaran',
    match: (text, stemText, mapel) => text.includes('lingkaran') && !text.includes('diagram lingkaran') && (text.includes('jari-jari') || text.includes('diameter') || text.includes('keliling') || text.includes('luas')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 144: trapesium
  {
    id: 'trapesium',
    match: (text, stemText, mapel) => text.includes('trapesium') && (text.includes('alas') || text.includes('tinggi') || text.includes('luas') || text.includes('cm')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 145: jajar_genjang
  {
    id: 'jajar_genjang',
    match: (text, stemText, mapel) => (text.includes('jajar genjang') || text.includes('jajargenjang')) && (text.includes('alas') || text.includes('tinggi') || text.includes('luas')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 146: belah_ketupat
  {
    id: 'belah_ketupat',
    match: (text, stemText, mapel) => text.includes('belah ketupat') && (text.includes('diagonal') || text.includes('luas') || text.includes('cm')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 147: layang_layang
  {
    id: 'layang_layang',
    match: (text, stemText, mapel) => (text.includes('layang-layang') || text.includes('layang layang')) && (text.includes('diagonal') || text.includes('luas') || text.includes('cm')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 148: pecahan_lingkaran
  {
    id: 'pecahan_lingkaran',
    match: (text, stemText, mapel) => text.includes('pecahan') || text.includes('diarsir') || text.includes('arsiran'),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 149: busur_derajat
  {
    id: 'busur_derajat',
    match: (text, stemText, mapel) => text.includes('busur') || (text.includes('sudut') && (text.includes('derajat') || text.includes('°') || text.includes('lancip') || text.includes('tumpul'))),
    extract: (text, stemText, mapel) => {
      const degMatch = text.match(/(\d+)\s*(?:derajat|°)/i);
    const deg = degMatch ? parseInt(degMatch[1]) : 60;
    if (text.includes('busur derajat') || text.includes('busur')) {
      return { type: 'busur_derajat', params: { derajat: deg, label: 'X' } };
    }
    return { type: 'sudut', params: { derajat: deg } };
    }
  },

  // Rule 150: alveolus
  {
    id: 'alveolus',
    match: (text, stemText, mapel) => text.includes('alveolus') || (text.includes('pertukaran') && (text.includes('oksigen') || text.includes('o2') || text.includes('karbon dioksida') || text.includes('co2'))),
    extract: (text, stemText, mapel) => {
      let ptr = 'alveolus';
    if (text.includes('kapiler') || text.includes('darah')) ptr = 'kapiler';
    else if (text.includes('bronkiolus')) ptr = 'bronkiolus';
    return { type: 'alveolus', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 151: organ_pernapasan
  {
    id: 'organ_pernapasan',
    match: (text, stemText, mapel) => text.includes('pernapasan') || text.includes('paru-paru') || text.includes('trakea') || text.includes('bronkus'),
    extract: (text, stemText, mapel) => {
      let ptr = 'trakea';
    if (text.includes('hidung')) ptr = 'hidung';
    else if (text.includes('bronkus')) ptr = 'bronkus';
    else if (text.includes('paru')) ptr = 'paru';
    else if (text.includes('diafragma')) ptr = 'diafragma';
    return { type: 'organ_pernapasan', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 152: vili_usus
  {
    id: 'vili_usus',
    match: (text, stemText, mapel) => text.includes('vili') || text.includes('jonjot') || (text.includes('lipatan') && text.includes('penyerapan') && text.includes('usus')),
    extract: (text, stemText, mapel) => {
      let ptr = 'vili';
    if (text.includes('kapiler') || text.includes('darah')) ptr = 'kapiler';
    else if (text.includes('lakteal') || text.includes('limfa') || text.includes('lemak') || text.includes('kil')) ptr = 'lakteal';
    else if (text.includes('epitel') || text.includes('dinding')) ptr = 'epitel';
    return { type: 'vili_usus', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 153: struktur_gigi
  {
    id: 'struktur_gigi',
    match: (text, stemText, mapel) => text.includes('gigi') && (text.includes('seri') || text.includes('taring') || text.includes('geraham') || text.includes('memotong') || text.includes('merobek') || text.includes('mengunyah') || text.includes('rahang')),
    extract: (text, stemText, mapel) => {
      let ptr = 'seri';
    if (text.includes('taring') || text.includes('robek') || text.includes('koyak')) ptr = 'taring';
    else if (text.includes('geraham') || text.includes('kunyah') || text.includes('lumat')) ptr = 'geraham';
    return { type: 'struktur_gigi', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 154: lambung_detail
  {
    id: 'lambung_detail',
    match: (text, stemText, mapel) => (text.includes('lambung') && (text.includes('rugae') || text.includes('kardia') || text.includes('pilorus') || text.includes('pepsin') || text.includes('asam klorida') || text.includes('hcl') || text.includes('sfingter'))) || (text.includes('enzim') && text.includes('lambung')),
    extract: (text, stemText, mapel) => {
      let ptr = 'rugae';
    if (text.includes('kardia') || text.includes('esofagus') || text.includes('katup')) ptr = 'kardia';
    else if (text.includes('pilorus') || text.includes('duodenum')) ptr = 'pilorus';
    return { type: 'lambung_detail', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 155: organ_pencernaan
  {
    id: 'organ_pencernaan',
    match: (text, stemText, mapel) => text.includes('pencernaan') || /\blambung\b/.test(text) || text.includes('usus') || text.includes('kerongkongan') || text.includes('esofagus'),
    extract: (text, stemText, mapel) => {
      let ptr = 'lambung';
    if (/\bmulut\b/.test(text) && !text.includes('bermulut')) ptr = 'mulut';
    else if (text.includes('kerongkongan') || text.includes('esofagus')) ptr = 'kerongkongan';
    else if (text.includes('usus halus')) ptr = 'usus halus';
    else if (text.includes('usus besar')) ptr = 'usus besar';
    else if (/\banus\b/.test(text) || text.includes('rektum')) ptr = 'anus';
    else if (/\bhati\b/.test(text) && !/(?:per|mem|meng)hati/i.test(text)) ptr = 'hati';
    return { type: 'organ_pencernaan', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 156: rantai_makanan
  {
    id: 'rantai_makanan',
    match: (text, stemText, mapel) => text.includes('rantai makanan') || text.includes('jaring-jaring makanan') || (text.includes('produsen') && text.includes('konsumen')),
    extract: (text, stemText, mapel) => {
      let ptr = 'konsumen1';
    if (text.includes('produsen')) ptr = 'produsen';
    else if (text.includes('konsumen') && text.includes('puncak')) ptr = 'konsumen3';
    else if (text.includes('pengurai') || text.includes('dekomposer')) ptr = 'pengurai';
    return { type: 'rantai_makanan', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 157: siklus_air
  {
    id: 'siklus_air',
    match: (text, stemText, mapel) => text.includes('siklus air') || text.includes('daur air') || text.includes('evaporasi') || text.includes('kondensasi') || text.includes('presipitasi'),
    extract: (text, stemText, mapel) => {
      let ptr = 'evaporasi';
    if (text.includes('kondensasi')) ptr = 'kondensasi';
    else if (text.includes('presipitasi') || text.includes('hujan')) ptr = 'presipitasi';
    return { type: 'siklus_air', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 158: metamorfosis
  {
    id: 'metamorfosis',
    match: (text, stemText, mapel) => text.includes('metamorfosis') || text.includes('daur hidup kupu'),
    extract: (text, stemText, mapel) => {
      let ptr = 'kepompong';
    if (text.includes('larva') || text.includes('ulat')) ptr = 'ulat';
    else if (text.includes('telur')) ptr = 'telur';
    return { type: 'metamorfosis', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 159: bagian_bunga
  {
    id: 'bagian_bunga',
    match: (text, stemText, mapel) => text.includes('bunga') && (text.includes('putik') || text.includes('benang sari') || text.includes('kelopak') || text.includes('mahkota')),
    extract: (text, stemText, mapel) => {
      let ptr = 'putik';
    if (text.includes('benang sari') || text.includes('sari')) ptr = 'benang sari';
    else if (text.includes('mahkota')) ptr = 'mahkota';
    return { type: 'bagian_bunga', params: { pointer: ptr, label: 'X' } };
    }
  },

  // Rule 160: sudut_jarum_jam
  {
    id: 'sudut_jarum_jam',
    match: (text, stemText, mapel) => text.includes('sudut jarum jam') || (text.includes('jarum jam') && text.includes('sudut')) || (text.includes('sudut') && (text.includes('pukul') || text.includes('jam'))),
    extract: (text, stemText, mapel) => {
      const jamMatch = stemText.match(/pukul\s*(\d{1,2})[.:](\d{2})/i) || stemText.match(/(\d{1,2})[.:](\d{2})/);
    const j = jamMatch ? parseInt(jamMatch[1]) : 3;
    const m = jamMatch ? parseInt(jamMatch[2]) : 0;
    return { type: 'sudut_jarum_jam', params: { jam: j, menit: m } };
    }
  },

  // Rule 161: jam_analog
  {
    id: 'jam_analog',
    match: (text, stemText, mapel) => text.includes('jam') && (text.includes('pukul') || text.includes('menit') || text.includes('o\'clock') || text.includes('half past')),
    extract: (text, stemText, mapel) => {
      const timeMatch = text.match(/pukul\s*(\d{1,2})[.:](\d{2})/i) || text.match(/(\d{1,2})[.:](\d{2})/);
    if (timeMatch) {
      const jam = parseInt(timeMatch[1]);
      const menit = parseInt(timeMatch[2]);
      if (jam >= 1 && jam <= 12 && menit >= 0 && menit <= 59) {
        return { type: 'jam_analog', params: { jam, menit } };
      }
    }
    }
  },

  // Rule 162: diagram_lingkaran_derajat
  {
    id: 'diagram_lingkaran_derajat',
    match: (text, stemText, mapel) => text.includes('lingkaran derajat') || (text.includes('diagram lingkaran') && (text.includes('derajat') || text.includes('360°') || text.includes('360 derajat'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_lingkaran_derajat', params: { label: 'X' } };
    }
  },

  // Rule 163: diagram_lingkaran
  {
    id: 'diagram_lingkaran',
    match: (text, stemText, mapel) => text.includes('diagram lingkaran') || text.includes('pie chart') || (text.includes('persentase') && text.includes('diagram')),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_lingkaran', params: {} };
    }
  },

  // Rule 164: peta_indonesia
  {
    id: 'peta_indonesia',
    match: (text, stemText, mapel) => (text.includes('peta') || text.includes('pulau')) && (text.includes('indonesia') || text.includes('pulau') || text.includes('tinggal') || text.includes('geografis') || text.includes('nusantara') || text.includes('provinsi') || text.includes('endemik') || text.includes('rumah adat') || text.includes('zona waktu')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 165: rangkaian_listrik
  {
    id: 'rangkaian_listrik',
    match: (text, stemText, mapel) => text.includes('rangkaian listrik') || (text.includes('saklar') && text.includes('lampu')) || (text.includes('lampu') && (text.includes('menyala') || text.includes('padam')) && (text.includes('s1') || text.includes('s2') || text.includes('baterai'))),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 166: perubahan_wujud
  {
    id: 'perubahan_wujud',
    match: (text, stemText, mapel) => text.includes('perubahan wujud') || (text.includes('wujud zat') && (text.includes('padat') || text.includes('cair') || text.includes('gas'))),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 167: mistar
  {
    id: 'mistar',
    match: (text, stemText, mapel) => text.includes('mistar') || text.includes('penggaris') || ((text.includes('pensil') || text.includes('penghapus') || text.includes('paku')) && (text.includes('panjang') || text.includes('skala') || text.includes('cm')) && (text.includes('ukur') || text.includes('gambar'))),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 168: tata_surya
  {
    id: 'tata_surya',
    match: (text, stemText, mapel) => text.includes('tata surya') || (text.includes('planet') && (text.includes('matahari') || text.includes('orbit') || text.includes('cincin') || text.includes('terbesar') || text.includes('urutan') || text.includes('ketiga'))),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 169: perisai_pancasila
  {
    id: 'perisai_pancasila',
    match: (text, stemText, mapel) => text.includes('pancasila') || text.includes('perisai') || text.includes('lambang negara') || text.includes('burung garuda') || (text.includes('sila') && (text.includes('pertama') || text.includes('kedua') || text.includes('ketiga') || text.includes('keempat') || text.includes('kelima') || text.includes('ke-') || text.includes('bintang') || text.includes('rantai') || text.includes('beringin') || text.includes('banteng') || text.includes('padi'))),
    extract: (text, stemText, mapel) => {
      let sila = 1;
    if (stemText.includes('bintang') || stemText.includes('ketuhanan') || stemText.includes('pertama') || stemText.includes('ke-1') || stemText.includes('sila 1')) sila = 1;
    else if (stemText.includes('rantai') || stemText.includes('kemanusiaan') || stemText.includes('kedua') || stemText.includes('ke-2') || stemText.includes('sila 2')) sila = 2;
    else if (stemText.includes('beringin') || stemText.includes('persatuan') || stemText.includes('ketiga') || stemText.includes('ke-3') || stemText.includes('sila 3')) sila = 3;
    else if (stemText.includes('banteng') || stemText.includes('kerakyatan') || stemText.includes('keempat') || stemText.includes('ke-4') || stemText.includes('sila 4')) sila = 4;
    else if (stemText.includes('padi') || stemText.includes('kapas') || stemText.includes('keadilan') || stemText.includes('kelima') || stemText.includes('ke-5') || stemText.includes('sila 5')) sila = 5;

    return { type: 'perisai_pancasila', params: { sila, label: 'X' } };
    }
  },

  // Rule 170: magnet
  {
    id: 'magnet',
    match: (text, stemText, mapel) => text.includes('magnet') || (text.includes('kutub') && (text.includes('utara') || text.includes('selatan') || text.includes('tarik') || text.includes('tolak'))),
    extract: (text, stemText, mapel) => {
      let interaksi: 'tarik' | 'tolak' = 'tarik';
    if (text.includes('tolak') || text.includes('menolak')) interaksi = 'tolak';
    else if (text.includes('tarik') || text.includes('menarik')) interaksi = 'tarik';

    let pointer: 'kanan2' | 'kiri1' = 'kanan2';
    if (text.includes('kiri') || text.includes('pertama')) pointer = 'kiri1';

    return { type: 'magnet', params: { interaksi, pointer, label: 'X' } };
    }
  },

  // Rule 171: sifat_cahaya
  {
    id: 'sifat_cahaya',
    match: (text, stemText, mapel) => text.includes('cahaya') && (text.includes('pembiasan') || text.includes('bias') || text.includes('pemantulan') || text.includes('pantul') || text.includes('cermin') || text.includes('medium') || text.includes('sudut datang') || text.includes('sudut bias') || text.includes('sudut pantul')),
    extract: (text, stemText, mapel) => {
      let peristiwa: 'pembiasan' | 'pemantulan' = 'pembiasan';
    if (text.includes('pemantulan') || text.includes('pantul') || text.includes('cermin')) peristiwa = 'pemantulan';
    return { type: 'sifat_cahaya', params: { peristiwa, pointer: 'X', label: 'X' } };
    }
  },

  // Rule 172: peredaran_darah
  {
    id: 'peredaran_darah',
    match: (text, stemText, mapel) => text.includes('peredaran darah') || text.includes('sirkulasi darah') || (text.includes('jantung') && (text.includes('bilik') || text.includes('serambi') || text.includes('aorta') || text.includes('arteri') || text.includes('vena'))),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 173: gerhana
  {
    id: 'gerhana',
    match: (text, stemText, mapel) => text.includes('gerhana') || (text.includes('bayangan') && (text.includes('umbra') || text.includes('penumbra'))),
    extract: (text, stemText, mapel) => {
      let jenis: 'matahari' | 'bulan' = 'matahari';
    if (text.includes('gerhana bulan') || (text.includes('bulan') && text.includes('bumi berada di antara'))) jenis = 'bulan';

    let pointer = 'umbra';
    if (stemText.includes('penumbra')) pointer = 'penumbra';
    else if (stemText.includes('bulan')) pointer = 'bulan';
    else if (stemText.includes('bumi')) pointer = 'bumi';
    return { type: 'gerhana', params: { jenis, pointer, label: 'X' } };
    }
  },

  // Rule 174: pesawat_sederhana
  {
    id: 'pesawat_sederhana',
    match: (text, stemText, mapel) => text.includes('tuas') || text.includes('pengungkit') || text.includes('katrol') || (text.includes('titik tumpu') && text.includes('kuasa')),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 175: pancaindra
  {
    id: 'pancaindra',
    match: (text, stemText, mapel) => text.includes('pancaindra') || text.includes('indra penglihatan') || text.includes('indra pendengaran') || (text.includes('mata') && (text.includes('kornea') || text.includes('retina') || text.includes('pupil') || text.includes('lensa mata'))) || (text.includes('telinga') && (text.includes('gendang') || text.includes('koklea') || text.includes('rumah siput') || text.includes('eustachius'))),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 176: neraca_pasar
  {
    id: 'neraca_pasar',
    match: (text, stemText, mapel) => text.includes('neraca pasar') || text.includes('timbangan bebek'),
    extract: (text, stemText, mapel) => {
      return { type: 'neraca_pasar', params: { bebanKg: 2, anakKg: 2 } };
    }
  },

  // Rule 177: timbangan_digital
  {
    id: 'timbangan_digital',
    match: (text, stemText, mapel) => text.includes('timbangan digital') || text.includes('neraca digital'),
    extract: (text, stemText, mapel) => {
      const gMatch = stemText.match(/(\d+)\s*(?:gram|g\b)/i);
    return { type: 'timbangan_digital', params: { massa: gMatch ? parseInt(gMatch[1]) : 450, unit: 'g' } };
    }
  },

  // Rule 178: dinamometer_pegas
  {
    id: 'dinamometer_pegas',
    match: (text, stemText, mapel) => text.includes('neraca pegas') || text.includes('dinamometer'),
    extract: (text, stemText, mapel) => {
      const nMatch = stemText.match(/(\d+)\s*(?:newton|n\b)/i);
    return { type: 'dinamometer_pegas', params: { newton: nMatch ? parseInt(nMatch[1]) : 5 } };
    }
  },

  // Rule 179: timbangan_neraca
  {
    id: 'timbangan_neraca',
    match: (text, stemText, mapel) => !text.includes('tangga satuan') && (text.includes('neraca') || (text.includes('timbangan') && (text.includes('lengan') || text.includes('anak timbangan') || text.includes('seimbang')))),
    extract: (text, stemText, mapel) => {
      let status: 'seimbang' | 'miring_kiri' | 'miring_kanan' = 'seimbang';
    if (text.includes('miring ke kiri') || text.includes('miring kiri') || text.includes('lebih berat ke kiri')) status = 'miring_kiri';
    else if (text.includes('miring ke kanan') || text.includes('miring kanan') || text.includes('lebih berat ke kanan')) status = 'miring_kanan';

    return { type: 'timbangan_neraca', params: { status, pointer: 'kiri', label: 'X' } };
    }
  },

  // Rule 180: mata_angin
  {
    id: 'mata_angin',
    match: (text, stemText, mapel) => text.includes('mata angin') || text.includes('arah mata angin') || (text.includes('denah') && (text.includes('sebelah utara') || text.includes('sebelah timur') || text.includes('sebelah selatan') || text.includes('sebelah barat'))),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 181: tabel_turus
  {
    id: 'tabel_turus',
    match: (text, stemText, mapel) => text.includes('turus') || text.includes('tally') || (text.includes('tabel') && text.includes('frekuensi') && (text.includes('coret') || text.includes('garis'))),
    extract: (text, stemText, mapel) => {
      return { type: 'tabel_turus', params: { targetField: 'frekuensi', label: 'X' } };
    }
  },

  // Rule 182: spinner_peluang
  {
    id: 'spinner_peluang',
    match: (text, stemText, mapel) => text.includes('spinner') || text.includes('roda putar') || (text.includes('peluang') && (text.includes('memutar') || text.includes('jarum berhenti') || text.includes('juring'))),
    extract: (text, stemText, mapel) => {
      let bagian = 6;
    if (text.includes('4 bagian') || text.includes('4 juring')) bagian = 4;
    else if (text.includes('8 bagian') || text.includes('8 juring')) bagian = 8;
    return { type: 'spinner_peluang', params: { bagian, jarumKe: 1, label: 'X' } };
    }
  },

  // Rule 183: pola_gambar
  {
    id: 'pola_gambar',
    match: (text, stemText, mapel) => text.includes('pola gambar') || text.includes('barisan pola') || (text.includes('pola') && (text.includes('banyaknya lingkaran') || text.includes('banyaknya titik') || text.includes('suku berikutnya') || text.includes('pola ke-4') || text.includes('pola ke-5'))),
    extract: (text, stemText, mapel) => {
      return { type: 'pola_gambar', params: { counts: [1, 3, 5, 7], targetSuku: 4, label: 'X' } };
    }
  },

  // Rule 184: flowchart
  {
    id: 'flowchart',
    match: (text, stemText, mapel) => text.includes('flowchart') || text.includes('diagram alir') || (text.includes('algoritma') && (text.includes('mulai') || text.includes('keputusan') || text.includes('simbol'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'kondisi' | 'output_ya' | 'output_tidak' = 'kondisi';
    if (stemText.includes('output') || stemText.includes('cetak')) pointer = 'output_ya';
    return { type: 'flowchart', params: { pointer, label: 'X' } };
    }
  },

  // Rule 185: termometer
  {
    id: 'termometer',
    match: (text, stemText, mapel) => text.includes('termometer') || (text.includes('suhu') && (text.includes('celsius') || text.includes('raksa') || text.includes('titik didih') || text.includes('skala') || text.includes('°c'))),
    extract: (text, stemText, mapel) => {
      const suhuMatch = stemText.match(/(-?\d+)\s*(?:°\s*c?|celsius|derajat)/i);
    const suhu = suhuMatch ? parseInt(suhuMatch[1]) : 35;
    return { type: 'termometer', params: { suhu, unit: '°C', label: 'X' } };
    }
  },

  // Rule 186: gelas_ukur
  {
    id: 'gelas_ukur',
    match: (text, stemText, mapel) => text.includes('gelas ukur') || (text.includes('volume') && (text.includes('batu') || text.includes('archimedes') || text.includes('permukaan air naik') || text.includes('massa jenis air'))),
    extract: (text, stemText, mapel) => {
      const v1Match = stemText.match(/(?:awal|v1|mula-mula)\D*(\d+)/i);
    const v2Match = stemText.match(/(?:akhir|v2|setelah)\D*(\d+)/i);
    const v1 = v1Match ? parseInt(v1Match[1]) : 50;
    const v2 = v2Match ? parseInt(v2Match[1]) : 75;
    return { type: 'gelas_ukur', params: { mode: 'batu', v1, v2, label: 'X' } };
    }
  },

  // Rule 187: pohon_faktor
  {
    id: 'pohon_faktor',
    match: (text, stemText, mapel) => text.includes('pohon faktor') || text.includes('faktorisasi prima') || ((text.includes('kpk') || text.includes('fpb')) && (text.includes('pohon') || text.includes('faktor'))),
    extract: (text, stemText, mapel) => {
      const bilMatch = stemText.match(/(?:bilangan|angka)\D*(\d+)/i) || stemText.match(/\b(24|36|48|60|72)\b/);
    const bilangan = bilMatch ? parseInt(bilMatch[1]) : 24;
    let targetNode: 'akar' | 'prima1' | 'prima2' | 'prima3' | 'komposit1' | 'komposit2' = 'prima3';
    if (stemText.includes('akar') || stemText.includes('puncak')) targetNode = 'akar';
    else if (stemText.includes('komposit')) targetNode = 'komposit1';
    return { type: 'pohon_faktor', params: { bilangan, targetNode, label: 'X' } };
    }
  },

  // Rule 188: grid_matriks_100
  {
    id: 'grid_matriks_100',
    match: (text, stemText, mapel) => text.includes('grid 100') || text.includes('matriks 100') || ((text.includes('desimal') || text.includes('persen')) && (text.includes('petak') || text.includes('100 kotak') || text.includes('diarsir') || text.includes('persegi 10x10'))),
    extract: (text, stemText, mapel) => {
      const arsiranMatch = stemText.match(/(\d+)\s*(?:persen|%|kotak|petak)/i) || stemText.match(/0[.,](\d+)/);
    const diarsir = arsiranMatch ? parseInt(arsiranMatch[1]) : 35;
    return { type: 'grid_matriks_100', params: { diarsir, label: 'X' } };
    }
  },

  // Rule 189: rambu_lalu_lintas
  {
    id: 'rambu_lalu_lintas',
    match: (text, stemText, mapel) => text.includes('rambu') || text.includes('lalu lintas') || text.includes('dilarang parkir') || text.includes('wajib belok'),
    extract: (text, stemText, mapel) => {
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
  },

  // Rule 190: piring_gizi_seimbang
  {
    id: 'piring_gizi_seimbang',
    match: (text, stemText, mapel) => text.includes('piring makanku') || text.includes('gizi seimbang') || text.includes('empat sehat lima sempurna') || (text.includes('makanan pokok') && text.includes('lauk') && text.includes('sayur')),
    extract: (text, stemText, mapel) => {
      let pointer: 'makanan_pokok' | 'sayuran' | 'lauk_pauk' | 'buah' = 'makanan_pokok';
    if (stemText.includes('sayur')) pointer = 'sayuran';
    else if (stemText.includes('lauk') || stemText.includes('protein')) pointer = 'lauk_pauk';
    else if (stemText.includes('buah') || stemText.includes('vitamin')) pointer = 'buah';
    return { type: 'piring_gizi_seimbang', params: { pointer, label: 'X' } };
    }
  },

  // Rule 191: lapangan_olahraga
  {
    id: 'lapangan_olahraga',
    match: (text, stemText, mapel) => text.includes('lapangan sepak bola') || text.includes('lapangan bola') || text.includes('lapangan voli') || (text.includes('lapangan') && (text.includes('kotak penalti') || text.includes('garis serang') || text.includes('net voli'))),
    extract: (text, stemText, mapel) => {
      const olahraga = text.includes('voli') ? 'voli' : 'sepak_bola';
    return { type: 'lapangan_olahraga', params: { olahraga, label: 'X' } };
    }
  },

  // Rule 192: preposition_place
  {
    id: 'preposition_place',
    match: (text, stemText, mapel) => text.includes('preposition') || (text.includes('where is the') && (text.includes('ball') || text.includes('box'))) || (text.includes('the ball is') && (text.includes('in') || text.includes('on') || text.includes('under') || text.includes('between'))),
    extract: (text, stemText, mapel) => {
      let posisi: 'in' | 'on' | 'under' | 'between' = 'on';
    if (stemText.includes('under') || stemText.includes('di bawah')) posisi = 'under';
    else if (stemText.includes('in ') || stemText.includes('di dalam')) posisi = 'in';
    else if (stemText.includes('between') || stemText.includes('di antara')) posisi = 'between';
    return { type: 'preposition_place', params: { posisi, label: 'X' } };
    }
  },

  // Rule 193: tangga_nada
  {
    id: 'tangga_nada',
    match: (text, stemText, mapel) => text.includes('tangga nada') || text.includes('paranada') || text.includes('not balok') || text.includes('kunci g') || (text.includes('nada') && (text.includes('diatonis') || text.includes('solmisasi') || text.includes('do re mi'))),
    extract: (text, stemText, mapel) => {
      let nadaTarget = 'G';
    const nadaMatch = stemText.match(/\b(C|D|E|F|G|A|B|C2)\b/i);
    if (nadaMatch) nadaTarget = nadaMatch[1].toUpperCase();
    return { type: 'tangga_nada', params: { nadaTarget, label: 'X' } };
    }
  },

  // Rule 194: lingkaran_warna
  {
    id: 'lingkaran_warna',
    match: (text, stemText, mapel) => text.includes('lingkaran warna') || text.includes('roda warna') || text.includes('warna primer') || text.includes('warna sekunder') || (text.includes('campuran warna') && (text.includes('merah') || text.includes('kuning') || text.includes('biru'))),
    extract: (text, stemText, mapel) => {
      let pointer: 'sekunder' | 'primer' | 'oranye' | 'hijau' | 'ungu' = 'sekunder';
    if (stemText.includes('primer')) pointer = 'primer';
    else if (stemText.includes('hijau')) pointer = 'hijau';
    else if (stemText.includes('ungu')) pointer = 'ungu';
    return { type: 'lingkaran_warna', params: { pointer, label: 'X' } };
    }
  },

  // Rule 195: struktur_pemda
  {
    id: 'struktur_pemda',
    match: (text, stemText, mapel) => text.includes('pemerintahan daerah') || text.includes('hirarki pemda') || text.includes('struktur pemda') || (text.includes('kecamatan') && text.includes('kelurahan') && (text.includes('bupati') || text.includes('camat') || text.includes('lurah'))),
    extract: (text, stemText, mapel) => {
      let targetLevel: 'provinsi' | 'kabupaten' | 'kecamatan' | 'kelurahan' | 'rw' | 'rt' = 'kecamatan';
    if (stemText.includes('provinsi') || stemText.includes('gubernur')) targetLevel = 'provinsi';
    else if (stemText.includes('kabupaten') || stemText.includes('bupati') || stemText.includes('walikota')) targetLevel = 'kabupaten';
    else if (stemText.includes('kelurahan') || stemText.includes('desa') || stemText.includes('lurah') || stemText.includes('kades')) targetLevel = 'kelurahan';
    else if (stemText.includes('rw') || stemText.includes('rukun warga')) targetLevel = 'rw';
    else if (stemText.includes('rt') || stemText.includes('rukun tetangga')) targetLevel = 'rt';
    return { type: 'struktur_pemda', params: { targetLevel, label: 'X' } };
    }
  },

  // Rule 196: grid_maze_koding
  {
    id: 'grid_maze_koding',
    match: (text, stemText, mapel) => text.includes('maze') || text.includes('labirin robot') || text.includes('grid robot') || (text.includes('koding') && (text.includes('robot') || text.includes('langkah') || text.includes('navigasi') || text.includes('arah jalan'))),
    extract: (text, stemText, mapel) => {
      return { type: 'grid_maze_koding', params: { label: 'X' } };
    }
  },

  // Rule 197: stopwatch_analog
  {
    id: 'stopwatch_analog',
    match: (text, stemText, mapel) => text.includes('stopwatch') || text.includes('stop watch'),
    extract: (text, stemText, mapel) => {
      const sMatch = stemText.match(/(\d+)\s*(?:detik|sekon)/i);
    const mMatch = stemText.match(/(\d+)\s*menit/i);
    return { type: 'stopwatch_analog', params: { detik: sMatch ? parseInt(sMatch[1]) : 35, menit: mMatch ? parseInt(mMatch[1]) : 2 } };
    }
  },

  // Rule 198: jangka_sorong
  {
    id: 'jangka_sorong',
    match: (text, stemText, mapel) => text.includes('jangka sorong') || text.includes('vernier caliper'),
    extract: (text, stemText, mapel) => {
      return { type: 'jangka_sorong', params: { utama: 2.3, nonius: 4 } };
    }
  },

  // Rule 199: neraca_pasar
  {
    id: 'neraca_pasar',
    match: (text, stemText, mapel) => text.includes('neraca pasar') || text.includes('timbangan bebek') || (text.includes('anak timbangan') && text.includes('pasar')),
    extract: (text, stemText, mapel) => {
      return { type: 'neraca_pasar', params: { bebanKg: 2, anakKg: 2 } };
    }
  },

  // Rule 200: timbangan_digital
  {
    id: 'timbangan_digital',
    match: (text, stemText, mapel) => text.includes('timbangan digital') || text.includes('neraca digital'),
    extract: (text, stemText, mapel) => {
      const gMatch = stemText.match(/(\d+)\s*(?:gram|g\b)/i);
    return { type: 'timbangan_digital', params: { massa: gMatch ? parseInt(gMatch[1]) : 450, unit: 'g' } };
    }
  },

  // Rule 201: bejana_literan
  {
    id: 'bejana_literan',
    match: (text, stemText, mapel) => text.includes('bejana literan') || text.includes('takaran beras') || text.includes('literan beras'),
    extract: (text, stemText, mapel) => {
      return { type: 'bejana_literan', params: { kapasitas: 1, terisi: 0.75 } };
    }
  },

  // Rule 202: gelas_erlenmeyer
  {
    id: 'gelas_erlenmeyer',
    match: (text, stemText, mapel) => text.includes('gelas erlenmeyer') || text.includes('labu erlenmeyer') || text.includes('erlenmeyer'),
    extract: (text, stemText, mapel) => {
      return { type: 'gelas_erlenmeyer', params: { volume: 150, max: 250 } };
    }
  },

  // Rule 203: meteran_gulung
  {
    id: 'meteran_gulung',
    match: (text, stemText, mapel) => text.includes('meteran gulung') || text.includes('meteran pita') || text.includes('meteran tukang'),
    extract: (text, stemText, mapel) => {
      return { type: 'meteran_gulung', params: { panjang: 3.5, unit: 'm' } };
    }
  },

  // Rule 204: dinamometer_pegas
  {
    id: 'dinamometer_pegas',
    match: (text, stemText, mapel) => text.includes('dinamometer') || text.includes('neraca pegas') || (text.includes('pegas') && text.includes('newton')),
    extract: (text, stemText, mapel) => {
      const nMatch = stemText.match(/(\d+)\s*(?:newton|n\b)/i);
    return { type: 'dinamometer_pegas', params: { newton: nMatch ? parseInt(nMatch[1]) : 5 } };
    }
  },

  // Rule 205: tangga_satuan_panjang
  {
    id: 'tangga_satuan_panjang',
    match: (text, stemText, mapel) => text.includes('tangga satuan panjang') || (text.includes('satuan panjang') && (text.includes('km') || text.includes('tangga'))),
    extract: (text, stemText, mapel) => {
      return { type: 'tangga_satuan_panjang', params: { dari: 'm', ke: 'cm' } };
    }
  },

  // Rule 206: tangga_satuan_massa
  {
    id: 'tangga_satuan_massa',
    match: (text, stemText, mapel) => text.includes('tangga satuan massa') || text.includes('tangga satuan berat') || (text.includes('satuan massa') && text.includes('tangga')),
    extract: (text, stemText, mapel) => {
      return { type: 'tangga_satuan_massa', params: { dari: 'kg', ke: 'g' } };
    }
  },

  // Rule 207: tangga_satuan_volume
  {
    id: 'tangga_satuan_volume',
    match: (text, stemText, mapel) => text.includes('tangga satuan volume') || text.includes('satuan liter') || (text.includes('satuan volume') && text.includes('tangga')),
    extract: (text, stemText, mapel) => {
      return { type: 'tangga_satuan_volume', params: { dari: 'l', ke: 'ml' } };
    }
  },

  // Rule 208: sudut_jarum_jam
  {
    id: 'sudut_jarum_jam',
    match: (text, stemText, mapel) => text.includes('sudut jarum jam') || (text.includes('jarum jam') && text.includes('sudut')) || (text.includes('sudut') && text.includes('pukul ')),
    extract: (text, stemText, mapel) => {
      const jamMatch = stemText.match(/pukul\s*(\d{1,2})[.:](\d{2})/i) || stemText.match(/(\d{1,2})[.:](\d{2})/);
    const j = jamMatch ? parseInt(jamMatch[1]) : 3;
    const m = jamMatch ? parseInt(jamMatch[2]) : 0;
    return { type: 'sudut_jarum_jam', params: { jam: j, menit: m } };
    }
  },

  // Rule 209: jaring_limas_segiempat
  {
    id: 'jaring_limas_segiempat',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && (text.includes('segiempat') || text.includes('persegi')),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_limas_segiempat', params: { s: 8, t: 10 } };
    }
  },

  // Rule 210: jaring_limas_segitiga
  {
    id: 'jaring_limas_segitiga',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('limas') && text.includes('segitiga'),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_limas_segitiga', params: { s: 8 } };
    }
  },

  // Rule 211: jaring_prisma_segitiga
  {
    id: 'jaring_prisma_segitiga',
    match: (text, stemText, mapel) => (text.includes('jaring') || text.includes('jaring-jaring')) && text.includes('prisma') && text.includes('segitiga'),
    extract: (text, stemText, mapel) => {
      return { type: 'jaring_prisma_segitiga', params: { a: 6, t: 8, p: 12 } };
    }
  },

  // Rule 212: keliling_gabungan
  {
    id: 'keliling_gabungan',
    match: (text, stemText, mapel) => text.includes('keliling gabungan') || (text.includes('keliling') && text.includes('bangun gabungan')),
    extract: (text, stemText, mapel) => {
      return { type: 'keliling_gabungan', params: { p: 14, l: 10 } };
    }
  },

  // Rule 213: lingkaran_tembereng
  {
    id: 'lingkaran_tembereng',
    match: (text, stemText, mapel) => text.includes('tembereng') || (text.includes('lingkaran') && text.includes('tali busur') && text.includes('juring')),
    extract: (text, stemText, mapel) => {
      return { type: 'lingkaran_tembereng', params: { r: 14, sudut: 90 } };
    }
  },

  // Rule 214: koordinat_poligon
  {
    id: 'koordinat_poligon',
    match: (text, stemText, mapel) => text.includes('poligon kartesius') || (text.includes('koordinat') && (text.includes('poligon') || text.includes('luas segitiga pada bidang'))),
    extract: (text, stemText, mapel) => {
      return { type: 'koordinat_poligon', params: { titik: [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 3, y: 5 }] } };
    }
  },

  // Rule 215: transformasi_refleksi
  {
    id: 'transformasi_refleksi',
    match: (text, stemText, mapel) => text.includes('refleksi') || text.includes('pencerminan') || text.includes('cermin'),
    extract: (text, stemText, mapel) => {
      return { type: 'transformasi_refleksi', params: { sumbu: 'vertikal' } };
    }
  },

  // Rule 216: transformasi_translasi
  {
    id: 'transformasi_translasi',
    match: (text, stemText, mapel) => text.includes('translasi') || text.includes('pergeseran bangun'),
    extract: (text, stemText, mapel) => {
      return { type: 'transformasi_translasi', params: { dx: 3, dy: 2 } };
    }
  },

  // Rule 217: segi_enam_beraturan
  {
    id: 'segi_enam_beraturan',
    match: (text, stemText, mapel) => text.includes('segi enam beraturan') || text.includes('heksagon'),
    extract: (text, stemText, mapel) => {
      return { type: 'segi_enam_beraturan', params: { s: 8 } };
    }
  },

  // Rule 218: blok_dienes
  {
    id: 'blok_dienes',
    match: (text, stemText, mapel) => text.includes('dienes') || text.includes('blok dienes') || text.includes('balok dienes') || text.includes('base ten blocks'),
    extract: (text, stemText, mapel) => {
      return { type: 'blok_dienes', params: { ribuan: 1, ratusan: 2, puluhan: 4, satuan: 5 } };
    }
  },

  // Rule 219: sempoa_abakus
  {
    id: 'sempoa_abakus',
    match: (text, stemText, mapel) => text.includes('sempoa') || text.includes('abakus') || text.includes('soroban'),
    extract: (text, stemText, mapel) => {
      return { type: 'sempoa_abakus', params: { nilai: '3527' } };
    }
  },

  // Rule 220: tabel_nilai_tempat
  {
    id: 'tabel_nilai_tempat',
    match: (text, stemText, mapel) => text.includes('tabel nilai tempat') || (text.includes('nilai tempat') && text.includes('tabel')),
    extract: (text, stemText, mapel) => {
      return { type: 'tabel_nilai_tempat', params: { angka: '47285' } };
    }
  },

  // Rule 221: garis_bilangan_pecahan
  {
    id: 'garis_bilangan_pecahan',
    match: (text, stemText, mapel) => text.includes('garis bilangan pecahan') || (text.includes('garis bilangan') && text.includes('pecahan')),
    extract: (text, stemText, mapel) => {
      return { type: 'garis_bilangan_pecahan', params: { penyebut: 4, target: 3 } };
    }
  },

  // Rule 222: garis_bilangan_desimal
  {
    id: 'garis_bilangan_desimal',
    match: (text, stemText, mapel) => text.includes('garis bilangan desimal') || (text.includes('garis bilangan') && (text.includes('desimal') || text.includes('koma'))),
    extract: (text, stemText, mapel) => {
      return { type: 'garis_bilangan_desimal', params: { min: 1.0, max: 2.0, target: 1.7 } };
    }
  },

  // Rule 223: perkalian_lattice
  {
    id: 'perkalian_lattice',
    match: (text, stemText, mapel) => text.includes('perkalian lattice') || text.includes('metode kisi') || text.includes('tulang napier') || text.includes('perkalian kisi'),
    extract: (text, stemText, mapel) => {
      return { type: 'perkalian_lattice', params: { num1: 34, num2: 25 } };
    }
  },

  // Rule 224: pola_ubin
  {
    id: 'pola_ubin',
    match: (text, stemText, mapel) => text.includes('pola ubin') || text.includes('barisan ubin') || (text.includes('ubin') && text.includes('pola ke-')),
    extract: (text, stemText, mapel) => {
      return { type: 'pola_ubin', params: { label: 'X' } };
    }
  },

  // Rule 225: pita_pecahan
  {
    id: 'pita_pecahan',
    match: (text, stemText, mapel) => text.includes('pita pecahan') || text.includes('fraction strips') || text.includes('batang pecahan'),
    extract: (text, stemText, mapel) => {
      return { type: 'pita_pecahan', params: { label: 'X' } };
    }
  },

  // Rule 226: matriks_nilai_uang
  {
    id: 'matriks_nilai_uang',
    match: (text, stemText, mapel) => text.includes('uang rupiah') || (text.includes('uang') && (text.includes('kertas') || text.includes('logam') || text.includes('pecahan uang'))),
    extract: (text, stemText, mapel) => {
      return { type: 'matriks_nilai_uang', params: { label: 'X' } };
    }
  },

  // Rule 227: diagram_batang_ganda
  {
    id: 'diagram_batang_ganda',
    match: (text, stemText, mapel) => text.includes('batang ganda') || (text.includes('diagram batang') && (text.includes('ganda') || text.includes('perbandingan') || text.includes('laki-laki dan perempuan'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_batang_ganda', params: { label: 'X' } };
    }
  },

  // Rule 228: diagram_garis_ganda
  {
    id: 'diagram_garis_ganda',
    match: (text, stemText, mapel) => text.includes('garis ganda') || (text.includes('diagram garis') && (text.includes('ganda') || text.includes('dua tahun') || text.includes('2023 dan 2024'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_garis_ganda', params: { label: 'X' } };
    }
  },

  // Rule 229: dot_plot
  {
    id: 'dot_plot',
    match: (text, stemText, mapel) => text.includes('dot plot') || text.includes('diagram titik') || text.includes('line plot'),
    extract: (text, stemText, mapel) => {
      return { type: 'dot_plot', params: { label: 'X' } };
    }
  },

  // Rule 230: diagram_lingkaran_derajat
  {
    id: 'diagram_lingkaran_derajat',
    match: (text, stemText, mapel) => text.includes('lingkaran derajat') || (text.includes('diagram lingkaran') && (text.includes('derajat') || text.includes('360°') || text.includes('360 derajat'))),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_lingkaran_derajat', params: { label: 'X' } };
    }
  },

  // Rule 231: tabel_kontingensi
  {
    id: 'tabel_kontingensi',
    match: (text, stemText, mapel) => text.includes('tabel kontingensi') || text.includes('frekuensi dua arah') || (text.includes('kontingensi') && text.includes('tabel')),
    extract: (text, stemText, mapel) => {
      return { type: 'tabel_kontingensi', params: { label: 'X' } };
    }
  },

  // Rule 232: diagram_batang_horizontal
  {
    id: 'diagram_batang_horizontal',
    match: (text, stemText, mapel) => text.includes('batang mendatar') || text.includes('batang horizontal') || (text.includes('diagram batang') && text.includes('mendatar')),
    extract: (text, stemText, mapel) => {
      return { type: 'diagram_batang_horizontal', params: { label: 'X' } };
    }
  },

  // Rule 233: papan_galton_peluang
  {
    id: 'papan_galton_peluang',
    match: (text, stemText, mapel) => text.includes('papan galton') || text.includes('quincunx') || text.includes('galton board') || (text.includes('kelereng') && text.includes('pasak')),
    extract: (text, stemText, mapel) => {
      return { type: 'papan_galton_peluang', params: { label: 'X' } };
    }
  },

  // Rule 234: kartu_peluang
  {
    id: 'kartu_peluang',
    match: (text, stemText, mapel) => text.includes('kartu peluang') || (text.includes('kartu') && text.includes('peluang') && (text.includes('terambil') || text.includes('ruang sampel'))),
    extract: (text, stemText, mapel) => {
      return { type: 'kartu_peluang', params: { label: 'X' } };
    }
  },

  // Fallback Rules for 100% Catalog Coverage
  {
    id: 'diagram_batang',
    match: (text) => text.includes('diagram batang') || text.includes('grafik batang') || text.includes('bar chart'),
    extract: () => ({ type: 'diagram_batang', params: { judul: 'Data Siswa', labels: ['A', 'B', 'C'], data: [20, 35, 30] } })
  },
  {
    id: 'diagram_garis',
    match: (text) => text.includes('diagram garis') || text.includes('grafik garis') || text.includes('line chart'),
    extract: () => ({ type: 'diagram_garis', params: { judul: 'Tren Data', labels: ['1', '2', '3'], data: [24, 32, 28] } })
  },
  {
    id: 'pecahan_persegi',
    match: (text) => (text.includes('pecahan') && (text.includes('persegi') || text.includes('kotak') || text.includes('grid'))) || text.includes('arsiran persegi'),
    extract: () => ({ type: 'pecahan_persegi', params: { kolom: 4, baris: 2, diarsir: 3 } })
  },
  {
    id: 'garis_bilangan',
    match: (text) => text.includes('garis bilangan'),
    extract: () => ({ type: 'garis_bilangan', params: { min: -5, max: 5, titik: [{ x: 2, label: 'P' }] } })
  },
];

/**
 * Deteksi otomatis stimulus visual dari teks soal jika AI lupa menyertakan format visual_stimulus
 */
export function detectStimulusFromSoalText(soalText: string, mapel: string): VisualStimulusConfig | null {
  const text = (soalText || '').toLowerCase();
  // Pisahkan teks pertanyaan inti dari opsi pilihan ganda agar angka opsi (A. 26 cm, B. 28 cm) tidak disalahartikan sebagai ukuran bangun (kecuali simbol °C)
  const stemText = text.split(/(?<![°\w])\b[a-d]\s*[\.\)]/i)[0] || text;

  for (const rule of DETECTION_RULES) {
    try {
      if (rule.match(text, stemText, mapel)) {
        const result = rule.extract(text, stemText, mapel);
        if (result) return result;
      }
    } catch {
      // Fallback safe: jika ada syntax/regex error pada teks tak lazim, lewati ke aturan berikutnya
      continue;
    }
  }

  return null;
}
