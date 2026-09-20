// Client-side validation & auto-repair untuk hasil output Analisis CP
// public/static/js/pages/analisis-cp/validator.js
import { getAlokasiWaktuResmi, balanceSemesterJpItems } from './alokasi-waktu.js';

export function replacePesertaDidik(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    return data
      .replace(/lembar\s+kerja\s+peserta\s+didik\s*\((?:lkpd|lkm)\)/gi, 'Lembar Kerja Murid (LKM)')
      .replace(/lembar\s+kerja\s+peserta\s+didik/gi, 'Lembar Kerja Murid')
      .replace(/peserta\s+didik/gi, (match) => {
        if (match === 'PESERTA DIDIK') return 'MURID';
        if (match === 'peserta didik') return 'murid';
        return 'Murid';
      });
  }
  if (Array.isArray(data)) {
    return data.map(item => replacePesertaDidik(item));
  }
  if (typeof data === 'object') {
    const res = {};
    for (const key of Object.keys(data)) {
      res[key] = replacePesertaDidik(data[key]);
    }
    return res;
  }
  return data;
}

// Helper: Perbaikan dan Pengayaan Elemen IPAS (Pemahaman IPAS + Keterampilan Proses)
export function repairAndEnrichIpasBabCp(bab, fase = 'C') {
  let cpText = (bab?.cp || '').trim();
  const babTitle = (bab?.bab || '').toLowerCase();
  const allMateri = (Array.isArray(bab?.materi_list) ? bab.materi_list.join(' ') : '') + ' ' + (Array.isArray(bab?.items) ? bab.items.map(i => (i.materi_pokok || '') + ' ' + (i.tp || '') + ' ' + (i.atp || '')).join(' ') : '');
  const combinedContext = (babTitle + ' ' + allMateri).toLowerCase();

  // 1. Tentukan kalimat Pemahaman IPAS yang akurat berdasarkan materi bab (urutan spesifik per-bab presisi)
  let pemahamanContent = '';

  if ((combinedContext.includes('geografis') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || combinedContext.includes('daratan') || combinedContext.includes('lautan') || combinedContext.includes('maritim') || combinedContext.includes('agraris') || combinedContext.includes('khatulistiwa') || (combinedContext.includes('peta') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || combinedContext.includes('letak indonesia')) {
    pemahamanContent = 'Menjelaskan letak dan kondisi geografis negara Indonesia dengan menggunakan peta konvensional/digital.';
  } else if (combinedContext.includes('ekonomi') || combinedContext.includes('kebutuhan') || combinedContext.includes('pasar') || combinedContext.includes('jual beli') || (/\buang\b/.test(combinedContext) && !combinedContext.includes('perjuangan') && !combinedContext.includes('berjuang') && !combinedContext.includes('peluang') && !combinedContext.includes('terbuang')) || combinedContext.includes('keuangan') || combinedContext.includes('konsumsi') || combinedContext.includes('produksi') || combinedContext.includes('distribusi') || combinedContext.includes('pelaku ekonomi') || combinedContext.includes('majulah daerahku')) {
    pemahamanContent = 'Menerapkan kegiatan ekonomi masyarakat di lingkungan sekitar dan menjelaskan pengelolaan keuangan/kebutuhan hidup secara bijak.';
  } else if (combinedContext.includes('ekosistem') || combinedContext.includes('rantai makanan') || combinedContext.includes('jaring') || combinedContext.includes('biotik') || combinedContext.includes('abiotik') || combinedContext.includes('harmoni dalam ekosistem') || combinedContext.includes('harmoni') || combinedContext.includes('habitat') || combinedContext.includes('populasi')) {
    pemahamanContent = 'Menganalisis hubungan antar komponen biotik dan abiotik, serta pengaruhnya terhadap ekosistem.';
  } else if (combinedContext.includes('siklus air') || combinedContext.includes('air sumber') || combinedContext.includes('air bersih') || combinedContext.includes('daur air') || combinedContext.includes('hidrologi') || combinedContext.includes('penghematan energi') || combinedContext.includes('energi alternatif') || (/\bair\b/.test(combinedContext) && !combinedContext.includes('tanah air') && !combinedContext.includes('mata pencaharian') && !combinedContext.includes('cair'))) {
    pemahamanContent = 'Menghasilkan upaya penghematan energi, serta pemanfaatan sumber energi alternatif dari sumber daya yang ada di sekitarnya sebagai upaya mitigasi perubahan iklim, serta memahami siklus air dan kaitannya dengan upaya menjaga ketersediaan air.';
  } else if (combinedContext.includes('sejarah') || combinedContext.includes('pahlawan') || combinedContext.includes('perjuangan') || combinedContext.includes('penjajahan') || combinedContext.includes('kemerdekaan') || combinedContext.includes('masa lalu') || combinedContext.includes('warisan budaya') || combinedContext.includes('kearifan') || combinedContext.includes('kebhinekaan')) {
    pemahamanContent = 'Meninjau sejarah perjuangan para pahlawan di lingkungan sekitar tempat tinggalnya dan menemukan keragaman budaya nasional dalam konteks kebinekaan.';
  } else if (combinedContext.includes('puber') || combinedContext.includes('perubahan pada diriku') || combinedContext.includes('privasi') || (/\borgan\b/.test(combinedContext) && !combinedContext.includes('organisasi')) || combinedContext.includes('pernapasan') || combinedContext.includes('pencernaan') || combinedContext.includes('darah') || combinedContext.includes('tubuh manusia') || combinedContext.includes('tulang') || combinedContext.includes('otot') || combinedContext.includes('kesehatan diri') || combinedContext.includes('sehat tubuh')) {
    pemahamanContent = 'Merefleksikan sistem organ tubuh manusia yang dikaitkan dengan cara menjaga kesehatan tubuhnya (masa puber).';
  } else if (combinedContext.includes('cahaya') || combinedContext.includes('penglihatan') || combinedContext.includes('bayangan') || combinedContext.includes('cermin') || combinedContext.includes('lensa') || combinedContext.includes('warna') || combinedContext.includes('dispersi') || combinedContext.includes('indra penglihatan') || (/\bmata\b/.test(combinedContext) && !combinedContext.includes('pencaharian') && !combinedContext.includes('uang') && !combinedContext.includes('matahari') && !combinedContext.includes('angin'))) {
    pemahamanContent = 'Menjelaskan fenomena gelombang cahaya dalam kehidupan sehari-hari melalui penyelidikan sederhana.';
  } else if (combinedContext.includes('bunyi') || combinedContext.includes('pendengaran') || combinedContext.includes('telinga') || combinedContext.includes('getaran') || combinedContext.includes('akustik') || combinedContext.includes('suara') || combinedContext.includes('merambat bunyi')) {
    pemahamanContent = 'Menjelaskan fenomena gelombang bunyi dalam kehidupan sehari-hari melalui penyelidikan sederhana.';
  } else if (combinedContext.includes('tata surya') || combinedContext.includes('planet') || combinedContext.includes('rotasi') || combinedContext.includes('revolusi') || combinedContext.includes('bumi') || combinedContext.includes('bulan') || combinedContext.includes('matahari')) {
    pemahamanContent = 'Menjelaskan sistem tata surya, serta kaitannya dengan rotasi dan revolusi bumi.';
  } else if (combinedContext.includes('budaya') || combinedContext.includes('kearifan') || combinedContext.includes('adat') || combinedContext.includes('tradisi')) {
    pemahamanContent = 'Menemukan keragaman budaya nasional dalam konteks kebhinekaan berdasarkan pemahaman terhadap nilai-nilai kearifan lokal yang berlaku di wilayah tempat tinggal.';
  } else if (combinedContext.includes('pancaindra') || combinedContext.includes('indra')) {
    pemahamanContent = 'Menjelaskan bentuk dan fungsi pancaindra dalam kehidupan sehari-hari.';
  } else if (combinedContext.includes('gaya') || combinedContext.includes('gerak') || combinedContext.includes('magnet')) {
    pemahamanContent = 'Membedakan jenis gaya dan pengaruhnya terhadap arah, gerak, dan bentuk benda.';
  } else if (combinedContext.includes('wujud zat') || combinedContext.includes('perubahan wujud') || combinedContext.includes('padat') || combinedContext.includes('cair') || combinedContext.includes('gas')) {
    pemahamanContent = 'Menyimpulkan proses perubahan wujud zat dalam kehidupan sehari-hari.';
  }

  // 2. Tentukan Keterampilan Proses yang relevan dengan aktivitas bab
  let prosesContent = '';
  if ((combinedContext.includes('peta') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || (combinedContext.includes('geografis') && !combinedContext.includes('sejarah') && !combinedContext.includes('pahlawan')) || combinedContext.includes('daratan') || combinedContext.includes('lautan') || (combinedContext.includes('indonesia') && (combinedContext.includes('maritim') || combinedContext.includes('agraris') || combinedContext.includes('letak') || combinedContext.includes('kondisi')))) {
    prosesContent = 'Mengamati fenomena geografis pada peta konvensional/digital, mengidentifikasi pola wilayah daratan/lautan, memproses data tabel informasi, dan mengomunikasikan hasil analisis.';
  } else if (combinedContext.includes('sejarah') || combinedContext.includes('pahlawan') || combinedContext.includes('warisan') || combinedContext.includes('budaya') || combinedContext.includes('perjuangan')) {
    prosesContent = 'Mengamati peninggalan sejarah dan kearifan lokal, menggali informasi dari narasumber/literatur, menyusun garis waktu peristiwa (timeline), serta mengomunikasikan nilai-nilai perjuangan.';
  } else if (combinedContext.includes('ekonomi') || combinedContext.includes('kebutuhan') || combinedContext.includes('pasar') || combinedContext.includes('jual beli') || (/\buang\b/.test(combinedContext) && !combinedContext.includes('perjuangan') && !combinedContext.includes('berjuang') && !combinedContext.includes('peluang') && !combinedContext.includes('terbuang')) || combinedContext.includes('keuangan')) {
    prosesContent = 'Melakukan observasi dan wawancara sederhana aktivitas ekonomi di lingkungan sekitar, mengolah data kebutuhan dan keinginan, serta merefleksikan pengelolaan keuangan secara bijak.';
  } else if (combinedContext.includes('ekosistem') || combinedContext.includes('rantai makanan') || combinedContext.includes('harmoni')) {
    prosesContent = 'Mengamati interaksi antar komponen ekosistem di lingkungan sekitar, mempertanyakan dan memprediksi dampak perubahan rantai makanan, serta menyajikan hasil penyelidikan.';
  } else if (combinedContext.includes('siklus air') || combinedContext.includes('daur air') || (/\bair\b/.test(combinedContext) && !combinedContext.includes('tanah air')) || combinedContext.includes('energi')) {
    prosesContent = 'Merencanakan dan melakukan penyelidikan siklus air/energi menggunakan model percobaan sederhana, mencatat data observasi, dan mengomunikasikan kampanye pelestarian.';
  } else if (combinedContext.includes('cahaya') || combinedContext.includes('bayangan') || combinedContext.includes('lensa') || combinedContext.includes('cermin')) {
    prosesContent = 'Merencanakan dan melakukan penyelidikan sifat-sifat cahaya dan pembentukan bayangan menggunakan alat bantu sederhana, membandingkan data pengamatan dengan prediksi, serta mengevaluasi hasil percobaan.';
  } else if (combinedContext.includes('bunyi') || combinedContext.includes('suara') || combinedContext.includes('getaran') || combinedContext.includes('akustik')) {
    prosesContent = 'Merencanakan dan melakukan penyelidikan ilmiah perambatan dan peredaman bunyi menggunakan alat sederhana, membandingkan data pengamatan dengan prediksi, serta mengomunikasikan hasil penyelidikan.';
  } else if (combinedContext.includes('organ') || combinedContext.includes('tubuh') || combinedContext.includes('puber') || combinedContext.includes('diriku') || combinedContext.includes('pancaindra')) {
    prosesContent = 'Mengamati model/diagram struktur organ tubuh dan perubahan fisik secara cermat, mencatat karakteristik fungsi organ, serta mengomunikasikan panduan pola hidup sehat dan privasi diri.';
  } else {
    prosesContent = 'Menerapkan keterampilan proses sains: mengamati fenomena, membuat prediksi, merencanakan penyelidikan sederhana, mengolah data, dan mengomunikasikan hasil secara lisan maupun tertulis.';
  }

  // Cek apakah cpText yang ada sudah punya [Pemahaman IPAS] dan [Keterampilan Proses]
  const hasPemahaman = /\[(Elemen\s*:\s*)?Pemahaman\s*IPAS\]/i.test(cpText) || /^Pemahaman\s*IPAS\s*:/i.test(cpText);
  const hasProses = /\[(Elemen\s*:\s*)?Keterampilan\s*Proses\]/i.test(cpText) || /Keterampilan\s*Proses\s*:/i.test(cpText);

  let existingPemahaman = '';
  if (hasPemahaman) {
    const match = cpText.match(/\[(?:Elemen\s*:\s*)?Pemahaman\s*IPAS\]\s*([\s\S]*?)(?=\[(?:Elemen\s*:\s*)?Keterampilan\s*Proses\]|$)/i);
    if (match && match[1].trim()) {
      existingPemahaman = match[1].trim();
    } else {
      const colonMatch = cpText.match(/^Pemahaman\s*IPAS\s*:/i);
      if (colonMatch) {
        existingPemahaman = cpText.replace(/^Pemahaman\s*IPAS\s*:/i, '').trim();
      }
    }
  }

  // Deteksi ketidaksesuaian topik (topic mismatch) pada existingPemahaman
  const isMismatched = (() => {
    if (!existingPemahaman || !pemahamanContent) return false;
    const lower = existingPemahaman.toLowerCase();

    if ((combinedContext.includes('ekonomi') || combinedContext.includes('kebutuhan') || combinedContext.includes('pasar') || (/\buang\b/.test(combinedContext) && !combinedContext.includes('perjuangan') && !combinedContext.includes('berjuang'))) &&
        (lower.includes('geografis') || lower.includes('daratan') || lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('penghematan energi') || lower.includes('sejarah'))) {
      return true;
    }
    if ((combinedContext.includes('ekosistem') || combinedContext.includes('rantai makanan') || combinedContext.includes('harmoni')) &&
        (lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('penghematan energi') || lower.includes('sejarah'))) {
      return true;
    }
    if ((combinedContext.includes('air') || combinedContext.includes('siklus')) &&
        (lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('organ tubuh') || lower.includes('sejarah'))) {
      return true;
    }
    if ((combinedContext.includes('sejarah') || combinedContext.includes('pahlawan') || combinedContext.includes('warisan') || combinedContext.includes('perjuangan')) &&
        (lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('organ tubuh') || lower.includes('siklus air'))) {
      return true;
    }
    if ((combinedContext.includes('puber') || combinedContext.includes('organ') || combinedContext.includes('diriku')) &&
        (lower.includes('bunyi') || lower.includes('cahaya') || lower.includes('geografis') || lower.includes('ekonomi') || lower.includes('sejarah'))) {
      return true;
    }
    if (combinedContext.includes('cahaya') &&
        ((lower.includes('bunyi') && !lower.includes('cahaya')) || lower.includes('geografis') || lower.includes('sejarah') || lower.includes('ekonomi'))) {
      return true;
    }
    if (combinedContext.includes('bunyi') &&
        ((lower.includes('cahaya') && !lower.includes('bunyi')) || lower.includes('geografis') || lower.includes('sejarah') || lower.includes('ekonomi'))) {
      return true;
    }
    if ((combinedContext.includes('peta') || combinedContext.includes('geografis') || combinedContext.includes('indonesia berada')) &&
        (lower.includes('bunyi') || lower.includes('ekonomi') || lower.includes('organ') || lower.includes('penghematan energi') || lower.includes('sejarah'))) {
      return true;
    }
    if (lower.startsWith('mengamati fenomena') && !lower.includes('menjelaskan') && !lower.includes('menganalisis') && !lower.includes('menerapkan') && !lower.includes('meninjau') && !lower.includes('merefleksikan')) {
      return true;
    }
    return false;
  })();

  let finalPemahaman = '';
  if (!hasPemahaman || isMismatched || !existingPemahaman) {
    finalPemahaman = pemahamanContent || 'Memahami konsep esensial sains dan lingkungan dalam kehidupan sehari-hari.';
  } else {
    finalPemahaman = existingPemahaman;
  }

  let finalProses = '';
  if (hasProses) {
    const matchProses = cpText.match(/\[(?:Elemen\s*:\s*)?Keterampilan\s*Proses\]\s*([\s\S]*?)$/i);
    const existingProses = (matchProses && matchProses[1].trim()) ? matchProses[1].trim() : '';
    const prosesLower = existingProses.toLowerCase();

    const isProsesMismatched = 
      ((combinedContext.includes('ekonomi') || combinedContext.includes('ekosistem') || combinedContext.includes('sejarah') || combinedContext.includes('bunyi') || combinedContext.includes('puber')) && prosesLower.includes('geografis pada peta')) ||
      ((combinedContext.includes('sejarah') || combinedContext.includes('puber') || combinedContext.includes('cahaya') || combinedContext.includes('ekonomi')) && prosesLower.includes('fenomena bunyi'));

    if (!existingProses || isProsesMismatched) {
      finalProses = prosesContent;
    } else {
      finalProses = existingProses;
    }
  } else {
    finalProses = prosesContent;
  }

  return `[Pemahaman IPAS]\n${finalPemahaman}\n\n[Keterampilan Proses]\n${finalProses}`;
}

// Helper: Perbaikan dan Pemetaan Elemen Resmi Matematika (BSKAP 046/2025)
export function repairAndEnrichMatematikaBabCp(bab, fase = 'C') {
  let cpText = (bab?.cp || '').trim();
  const babTitle = (bab?.bab || '').toLowerCase();
  const allMateri = (Array.isArray(bab?.materi_list) ? bab.materi_list.join(' ') : '') + ' ' + (Array.isArray(bab?.items) ? bab.items.map(i => (i.materi_pokok || '') + ' ' + (i.tp || '') + ' ' + (i.atp || '')).join(' ') : '');
  const combinedContext = (babTitle + ' ' + allMateri).toLowerCase();

  const officialMatematika = {
    'Fase A': {
      'Bilangan': 'Memiliki pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 100; membaca, menulis, menentukan nilai tempat, membandingkan, dan mengurutkan bilangan cacah sampai 100.',
      'Aljabar': 'Menemukan pola gambar atau objek sederhana dan pola bilangan membesar dan mengecil yang melibatkan penjumlahan dan pengurangan pada bilangan cacah sampai 20.',
      'Pengukuran': 'Mengukur, membandingkan, dan mengurutkan panjang dan berat benda menggunakan satuan tidak baku serta mengukur dan mengestimasi durasi waktu.',
      'Geometri': 'Mengenal berbagai bangun datar (segitiga, segiempat, segi banyak, lingkaran) dan bangun ruang (balok, kubus, kerucut, dan bola).',
      'Analisis Data dan Peluang': 'Mengurutkan, menyortir, mengelompokkan, membandingkan, dan menyajikan data dari banyak benda dengan menggunakan turus dan piktogram paling banyak 4 kategori.'
    },
    'Fase B': {
      'Bilangan': 'Memiliki pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 10.000; membaca, menulis, membandingkan, dan mengurutkan bilangan; menentukan nilai tempat; operasi penjumlahan dan pengurangan sampai 1.000, perkalian dan pembagian sampai 100; mengenal pecahan dan desimal.',
      'Aljabar': 'Menemukan nilai yang tidak diketahui dalam kalimat matematika yang melibatkan penjumlahan dan pengurangan pada bilangan cacah sampai 100; mengidentifikasi pola bilangan.',
      'Pengukuran': 'Mengukur panjang dan berat benda menggunakan satuan baku; serta mengukur dan mengestimasi luas dan volume menggunakan satuan baku/tidak baku.',
      'Geometri': 'Mendeskripsikan ciri berbagai bentuk bangun datar; menyusun (komposisi) dan mengurai (dekomposisi) berbagai bangun datar.',
      'Analisis Data dan Peluang': 'Mengurutkan, membandingkan, menyajikan, menganalisis dan menginterpretasi data dalam bentuk tabel, diagram gambar, piktogram, dan diagram batang (skala satu satuan).'
    },
    'Fase C': {
      'Bilangan': 'Menunjukkan pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 1.000.000; membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, melakukan komposisi dan dekomposisi bilangan; menyelesaikan masalah KPK dan FPB; serta memahami pecahan dan desimal.',
      'Aljabar': 'Menemukan nilai yang belum diketahui dalam kalimat matematika yang melibatkan penjumlahan, pengurangan, perkalian, dan pembagian pada bilangan cacah sampai 1000; bernalar secara proporsional dengan rasio satuan dan proporsi.',
      'Pengukuran': 'Menentukan keliling dan luas berbagai bentuk bangun datar (segitiga, segiempat, dan segi banyak) serta gabungannya; menghitung durasi waktu dan mengukur besar sudut.',
      'Geometri': 'Mengkonstruksi dan mengurai bangun ruang (kubus, balok, dan gabungannya) dan mengenali visualisasi spasial; membandingkan karakteristik antar bangun datar dan antar bangun ruang; serta menentukan lokasi pada sistem berpetak.',
      'Analisis Data dan Peluang': 'Mengurutkan, membandingkan, menyajikan, dan menganalisis data banyak benda dan data hasil pengukuran dalam bentuk gambar, piktogram, diagram batang, dan tabel frekuensi untuk mendapatkan informasi; menentukan kejadian dengan kemungkinan yang lebih besar atau lebih kecil dalam suatu percobaan acak.'
    }
  };

  const faseKey = fase ? (fase.startsWith('Fase') ? fase : `Fase ${fase}`) : 'Fase C';
  const curFaseMap = officialMatematika[faseKey] || officialMatematika['Fase C'];

  let targetElem = 'Bilangan';

  const contextWithoutDatar = combinedContext.replace(/datar/g, '');
  if (/\b(data|diagram|piktogram|turus|grafik|peluang|frekuensi)\b/i.test(contextWithoutDatar) || combinedContext.includes('pengumpulan data') || combinedContext.includes('penyajian data') || combinedContext.includes('analisis data') || combinedContext.includes('tabel data') || combinedContext.includes('tabel frekuensi')) {
    targetElem = 'Analisis Data dan Peluang';
  } else if (combinedContext.includes('bangun ruang') || combinedContext.includes('simetri lipat') || combinedContext.includes('simetri putar') || combinedContext.includes('visualisasi spasial') || combinedContext.includes('sistem berpetak') || (combinedContext.includes('bangun datar') && !combinedContext.includes('keliling') && !combinedContext.includes('luas'))) {
    targetElem = 'Geometri';
  } else if (combinedContext.includes('keliling') || combinedContext.includes('luas') || combinedContext.includes('sudut') || combinedContext.includes('pengukuran') || combinedContext.includes('mengukur') || combinedContext.includes('busur') || combinedContext.includes('durasi') || combinedContext.includes('panjang') || combinedContext.includes('berat') || combinedContext.includes('volume')) {
    targetElem = 'Pengukuran';
  } else if (combinedContext.includes('aljabar') || combinedContext.includes('rasio') || combinedContext.includes('proporsi') || combinedContext.includes('skala') || combinedContext.includes('pola bilangan') || combinedContext.includes('kalimat matematika') || combinedContext.includes('variabel')) {
    targetElem = 'Aljabar';
  } else {
    targetElem = 'Bilangan';
  }

  const officialCpElemText = curFaseMap[targetElem] || '';

  // Cek apakah cpText yang ada sudah cocok dengan tag targetElem
  const hasTargetTag = cpText.toLowerCase().includes(`[${targetElem.toLowerCase()}`);
  if (!hasTargetTag) {
    if (officialCpElemText) {
      return `[${targetElem}]\n${officialCpElemText}`;
    }
    const cleanOldCp = cpText.replace(/^\[.*?\]\s*:?\s*/i, '').trim();
    return `[${targetElem}]\n${cleanOldCp || 'Memahami dan menguasai materi pada elemen ini.'}`;
  }

  return cpText;
}

/**
 * Validasi dan perbaikan otomatis data Analisis CP sebelum rendering atau penyimpanan
 * @param {object} rawData - Data mentah hasil generate AI atau dari cache/DB
 * @param {Array} inputChapters - Daftar bab yang dimasukkan pengguna
 * @param {object} formMeta - Data form/identitas sekolah
 * @returns {object} Data terstruktur yang sudah tervalidasi dan diperbaiki
 */
export function validateAndRepairAnalysisData(rawData, inputChapters = [], formMeta = {}) {
  const data = (rawData && typeof rawData === 'object') ? JSON.parse(JSON.stringify(rawData)) : {};

  // 1. Normalisasi Metadata
  data.metadata = data.metadata || {};
  data.metadata.satuan_pendidikan = data.metadata.satuan_pendidikan || formMeta.namaSekolah || 'SDN';
  data.metadata.mata_pelajaran = data.metadata.mata_pelajaran || formMeta.mataPelajaran || '';
  data.metadata.fase = data.metadata.fase || formMeta.fase || 'Fase C';

  const rawKelas = String(data.metadata.kelas || formMeta.jenjangKelas || '5');
  const kelasNum = rawKelas.replace(/\D/g, '') || '5';
  data.metadata.kelas = kelasNum;
  data.metadata.fase_kelas = data.metadata.fase_kelas || `${data.metadata.fase}/${kelasNum}`;
  data.metadata.tahun_pembelajaran = data.metadata.tahun_pembelajaran || formMeta.tahunAjaran || '2025/2026';

  // Cek apakah mata pelajaran adalah IPAS atau Matematika
  const mapelStr = (data.metadata.mata_pelajaran || formMeta.mataPelajaran || formMeta.mata_pelajaran || '').toLowerCase();
  const isIpasSubject = mapelStr.includes('ipas') || mapelStr.includes('ilmu pengetahuan alam') || mapelStr.includes('sains');
  const isMatematikaSubject = mapelStr.includes('matematika');

  // 2. Normalisasi Semesters
  if (!Array.isArray(data.semesters) || data.semesters.length === 0) {
    if (Array.isArray(data.babs) && data.babs.length > 0) {
      data.semesters = [
        {
          semester: 1,
          semester_label: 'SEMESTER 1',
          babs: data.babs.filter(b => b.semester !== 2)
        },
        {
          semester: 2,
          semester_label: 'SEMESTER 2',
          babs: data.babs.filter(b => b.semester === 2)
        }
      ];
    } else {
      data.semesters = [
        { semester: 1, semester_label: 'SEMESTER 1', babs: [] },
        { semester: 2, semester_label: 'SEMESTER 2', babs: [] }
      ];
    }
  }

  // Jika pengguna menargetkan 1 semester saja (Semester 1 atau 2), satukan bab ke semester tersebut
  const targetSemParam = String(formMeta.targetSemester || formMeta.bookCoverage || '');
  if (targetSemParam === '1' || targetSemParam === '2') {
    const keepSem = Number(targetSemParam);
    let activeSem = data.semesters.find(s => s.semester === keepSem);
    if (!activeSem) {
      activeSem = { semester: keepSem, semester_label: `SEMESTER ${keepSem}`, babs: [] };
    }
    for (const s of data.semesters) {
      if (s.semester !== keepSem && Array.isArray(s.babs)) {
        for (const b of s.babs) {
          b.semester = keepSem;
          if (!activeSem.babs.some(existing => existing.no === b.no)) {
            activeSem.babs.push(b);
          }
        }
      }
    }
    data.semesters = [activeSem];
  }

  // 3. Verifikasi Kelengkapan Bab Sesuai Input
  if (Array.isArray(inputChapters) && inputChapters.length > 0) {
    const existingBabNos = new Set();
    for (const sem of data.semesters) {
      if (Array.isArray(sem.babs)) {
        for (const b of sem.babs) {
          if (typeof b.no === 'number') existingBabNos.add(b.no);
        }
      }
    }

    // Jika ada bab dari input yang terlewat oleh AI, sisipkan otomatis
    for (const ch of inputChapters) {
      if (!existingBabNos.has(ch.no)) {
        const targetSem = (targetSemParam === '1' || targetSemParam === '2')
          ? Number(targetSemParam)
          : (ch.semester === 2 ? 2 : 1);
        let semObj = data.semesters.find(s => s.semester === targetSem);
        if (!semObj) {
          semObj = { semester: targetSem, semester_label: `SEMESTER ${targetSem}`, babs: [] };
          data.semesters.push(semObj);
        }
        if (!Array.isArray(semObj.babs)) semObj.babs = [];

        const materiList = Array.isArray(ch.materi_pokok) && ch.materi_pokok.length > 0
          ? ch.materi_pokok
          : [ch.bab || `Topik ${ch.no}`];

        semObj.babs.push({
          no: ch.no,
          bab: ch.bab || `Bab ${ch.no}`,
          cp: formMeta.baseCP || 'Murid memahami dan menerapkan kompetensi dasar sesuai kurikulum.',
          materi_list: materiList,
          items: materiList.map((m) => ({
            kode_tp: '',
            materi_pokok: m,
            tp: `Murid mampu memahami dan menguasai materi ${m}.`,
            atp: `Mempelajari konsep dasar ${m}, mendiskusikannya secara kelompok, dan mengerjakan asesmen formatif.`,
            alokasi_waktu: '4 JP'
          }))
        });
        existingBabNos.add(ch.no);
      }
    }
  }

  // 4. Pastikan Urutan Semester & Penomoran Kode TP Sekuensial Global (5.1, 5.2, 5.3, ...)
  data.semesters.sort((a, b) => (a.semester || 1) - (b.semester || 1));

  let globalTpCounter = 1;
  for (const sem of data.semesters) {
    if (!sem.semester_label) {
      sem.semester_label = `SEMESTER ${sem.semester || 1}`;
    }
    if (!Array.isArray(sem.babs)) sem.babs = [];
    sem.babs.sort((a, b) => (a.no || 0) - (b.no || 0));

    for (const bab of sem.babs) {
      // Auto-Repair & Enrich IPAS & Matematika Elements
      if (isIpasSubject) {
        bab.cp = repairAndEnrichIpasBabCp(bab, data.metadata?.fase || formMeta.fase || 'C');
      } else if (isMatematikaSubject) {
        bab.cp = repairAndEnrichMatematikaBabCp(bab, data.metadata?.fase || formMeta.fase || 'C');
      }

      // Pastikan prefix elemen terpasang pada bab.cp jika bab memiliki penanda elemen [Elemen]
      if (bab.bab && (!bab.cp || !bab.cp.includes('['))) {
        const matchEl = bab.bab.match(/\[(.*?)\]/);
        if (matchEl) {
          bab.cp = bab.cp ? `[${matchEl[1]}] ${bab.cp}` : `[${matchEl[1]}] Capaian Pembelajaran standar kurikulum resmi.`;
        }
      }

      if (!Array.isArray(bab.items) || bab.items.length === 0) {
        bab.items = [
          {
            kode_tp: `${kelasNum}.${globalTpCounter++}`,
            materi_pokok: bab.bab || 'Materi Pokok',
            tp: `Murid mampu memahami konsep ${bab.bab || 'materi ini'}.`,
            atp: `Eksplorasi konsep, diskusi terbimbing, dan penerapan kompetensi.`,
            alokasi_waktu: '4 JP'
          }
        ];
      } else {
        for (const item of bab.items) {
          // Selalu tegakkan kode_tp sekuensial kedinasan tanpa reset antar bab
          item.kode_tp = `${kelasNum}.${globalTpCounter++}`;

          // Format alokasi waktu standar (misal "4 JP")
          if (!item.alokasi_waktu || typeof item.alokasi_waktu !== 'string') {
            item.alokasi_waktu = '4 JP';
          } else {
            const jpMatch = item.alokasi_waktu.match(/\d+/);
            const jpNum = jpMatch ? parseInt(jpMatch[0], 10) : 4;
            item.alokasi_waktu = `${jpNum} JP`;
          }

          if (!item.materi_pokok) item.materi_pokok = bab.bab || 'Materi Pokok';
          if (!item.tp) item.tp = `Murid mampu memahami konsep ${item.materi_pokok}.`;
          if (!item.atp) item.atp = `Aktivitas pembelajaran dan latihan kompetensi terkait ${item.materi_pokok}.`;
        }
      }
    }
  }

  // 5. Terapkan Standar Alokasi Waktu & Auto-Balance Intrakurikuler (Permendikdasmen No. 13 Tahun 2025)
  const finalMapel = data.metadata?.mata_pelajaran || formMeta.mataPelajaran || formMeta.mata_pelajaran || '';
  const finalKelas = data.metadata?.kelas || formMeta.kelas || formMeta.jenjangKelas || kelasNum;
  const quota = getAlokasiWaktuResmi(finalMapel, finalKelas);
  if (data.metadata) {
    data.metadata.alokasi_waktu_standar = {
      dasar_hukum: quota.dasarHukum,
      intrakurikuler_per_tahun: quota.intrakurikulerPerTahun,
      kokurikuler_per_tahun: quota.kokurikulerPerTahun,
      total_per_tahun: quota.totalPerTahun,
      jp_per_minggu: quota.jpPerMinggu,
      target_semester_jp: quota.intrakurikulerPerSemester,
      minggu_per_semester: quota.mingguPerSemester,
      minggu_per_tahun: quota.mingguPerTahun
    };
  }

  for (const sem of data.semesters) {
    balanceSemesterJpItems(sem.babs, quota.intrakurikulerPerSemester, quota.jpPerMinggu);
  }

  return replacePesertaDidik(data);
}
