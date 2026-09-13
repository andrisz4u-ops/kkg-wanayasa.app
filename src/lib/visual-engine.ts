/**
 * visual-engine.ts
 * Examplate Visual Stimulus Engine untuk Portal Pendidikan A4EDU / KKG Wanayasa
 *
 * Facade utama yang mengonsolidasikan dan mendistribusikan 47 stimulus visual SVG vektor
 * presisi berstandar lembar asesmen nasional:
 * - Geometri 2D & 3D (src/lib/visuals/geometry.ts)
 * - Pecahan, Pengukuran, & Statistik (src/lib/visuals/math-stats.ts)
 * - IPAS & Sains (src/lib/visuals/science.ts)
 * - Parser NLP Heuristik (src/lib/visuals/detector.ts)
 * - Katalog Template (src/lib/visuals/catalog.ts)
 */

import {
  VisualStimulusConfig,
  GeneratedVisualResult,
  svgToDataUri
} from './visuals/types';

import {
  renderBalokSvg,
  renderKubusSvg,
  renderTabungSvg,
  renderKerucutSvg,
  renderBolaSvg,
  renderPrismaSvg,
  renderLimasSvg,
  renderSegitigaSikuSvg,
  renderSudutSvg,
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
  renderSimetriLipatSvg,
  renderBangunGabunganSvg,
  renderPerisaiPancasilaSvg,
  renderSudutJarumJamSvg,
  renderJaringLimasSegiempatSvg,
  renderJaringLimasSegitigaSvg,
  renderJaringPrismaSegitigaSvg,
  renderKelilingGabunganSvg,
  renderLingkaranTemberengSvg,
  renderKoordinatPoligonSvg,
  renderTransformasiRefleksiSvg,
  renderTransformasiTranslasiSvg,
  renderSegiEnamBeraturanSvg
} from './visuals/geometry';

import {
  renderPecahanLingkaranSvg,
  renderPecahanPersegiSvg,
  renderDiagramBatangSvg,
  renderDiagramGarisSvg,
  renderDiagramLingkaranSvg,
  renderDiagramVennSvg,
  renderPictogramSvg,
  renderJamAnalogSvg,
  renderGarisBilanganSvg,
  renderMistarSvg,
  renderBusurDerajatSvg,
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
  renderBlokDienesSvg,
  renderSempoaAbakusSvg,
  renderTabelNilaiTempatSvg,
  renderGarisBilanganPecahanSvg,
  renderGarisBilanganDesimalSvg,
  renderPerkalianLatticeSvg,
  renderPolaUbinSvg,
  renderPitaPecahanSvg,
  renderMatriksNilaiUangSvg,
  renderDiagramBatangGandaSvg,
  renderDiagramGarisGandaSvg,
  renderDotPlotSvg,
  renderDiagramLingkaranDerajatSvg,
  renderTabelKontingensiSvg,
  renderDiagramBatangHorizontalSvg,
  renderPapanGaltonPeluangSvg,
  renderKartuPeluangSvg
} from './visuals/math-stats';

import {
  renderStopwatchAnalogSvg,
  renderJangkaSorongSvg,
  renderNeracaPasarSvg,
  renderTimbanganDigitalSvg,
  renderBejanaLiteranSvg,
  renderGelasErlenmeyerSvg,
  renderMeteranGulungSvg,
  renderDinamometerPegasSvg,
  renderTanggaSatuanPanjangSvg,
  renderTanggaSatuanMassaSvg,
  renderTanggaSatuanVolumeSvg
} from './visuals/measurement';

import {
  renderOrganPernapasanSvg,
  renderAlveolusSvg,
  renderOrganPencernaanSvg,
  renderViliUsusSvg,
  renderStrukturGigiSvg,
  renderLambungDetailSvg,
  renderRantaiMakananSvg,
  renderSiklusAirSvg,
  renderMetamorfosisSvg,
  renderBagianBungaSvg,
  renderPetaIndonesiaSvg,
  renderRangkaianListrikSvg,
  renderPerubahanWujudSvg,
  renderTataSuryaSvg,
  renderMagnetSvg,
  renderSifatCahayaSvg,
  renderPeredaranDarahSvg,
  renderGerhanaSvg,
  renderPesawatSederhanaSvg,
  renderPancaindraSvg
} from './visuals/science';

import {
  renderRambuLaluLintasSvg,
  renderPiringGiziSeimbangSvg,
  renderLapanganOlahragaSvg,
  renderPrepositionPlaceSvg,
  renderTanggaNadaSvg,
  renderLingkaranWarnaSvg,
  renderStrukturPemdaSvg,
  renderGridMazeKodingSvg
} from './visuals/literacy-social';

// Export all submodules to ensure 100% backward compatibility
export * from './visuals';

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
  } else if (type === 'peredaran_darah' || type === 'jantung' || type === 'sirkulasi_darah') {
    svg = renderPeredaranDarahSvg(params);
    title = title || 'Skema Sistem Peredaran Darah Manusia';
  } else if (type === 'gerhana' || type === 'gerhana_matahari' || type === 'gerhana_bulan') {
    svg = renderGerhanaSvg(params);
    title = title || 'Diagram Peristiwa Gerhana';
  } else if (type === 'pesawat_sederhana' || type === 'tuas' || type === 'katrol' || type === 'pengungkit') {
    svg = renderPesawatSederhanaSvg(params);
    title = title || 'Diagram Pesawat Sederhana';
  } else if (type === 'pancaindra' || type === 'indra' || type === 'mata' || type === 'telinga') {
    svg = renderPancaindraSvg(params);
    title = title || 'Diagram Organ Pancaindra';
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
  } else if (type === 'timbangan_neraca' || type === 'neraca' || type === 'timbangan') {
    svg = renderTimbanganNeracaSvg(params);
    title = title || 'Pengukuran Massa Neraca Dua Lengan';
  } else if (type === 'mata_angin' || type === 'arah_mata_angin' || type === 'kompas' || type === 'denah') {
    svg = renderMataAnginSvg(params);
    title = title || 'Diagram Arah Mata Angin & Denah';
  } else if (type === 'tabel_turus' || type === 'turus' || type === 'tally') {
    svg = renderTabelTurusSvg(params);
    title = title || 'Tabel Frekuensi Data & Turus';
  } else if (type === 'spinner_peluang' || type === 'spinner' || type === 'roda_putar') {
    svg = renderSpinnerPeluangSvg(params);
    title = title || 'Roda Putar Peluang (Spinner)';
  } else if (type === 'pola_gambar' || type === 'barisan_pola' || type === 'pola_bilangan_gambar') {
    svg = renderPolaGambarSvg(params);
    title = title || 'Barisan Pola Gambar Geometri';
  } else if (type === 'flowchart' || type === 'diagram_alir' || type === 'algoritma') {
    svg = renderFlowchartSvg(params);
    title = title || 'Diagram Alir Algoritma (Flowchart)';
  } else if (type === 'termometer' || type === 'suhu' || type === 'pengukuran_suhu') {
    svg = renderTermometerSvg(params);
    title = title || 'Pengukuran Suhu Termometer';
  } else if (type === 'gelas_ukur' || type === 'volume_cairan' || type === 'archimedes') {
    svg = renderGelasUkurSvg(params);
    title = title || 'Pengukuran Volume Zat Cair (Gelas Ukur)';
  } else if (type === 'pohon_faktor' || type === 'faktorisasi_prima' || type === 'kpk_fpb') {
    svg = renderPohonFaktorSvg(params);
    title = title || 'Pohon Faktor & Faktorisasi Prima';
  } else if (type === 'grid_matriks_100' || type === 'grid_100' || type === 'pecahan_desimal_persen') {
    svg = renderGridMatriks100Svg(params);
    title = title || 'Grid Matriks 100 Pecahan Desimal & Persen';
  } else if (type === 'rambu_lalu_lintas' || type === 'rambu' || type === 'rambu_keselamatan') {
    svg = renderRambuLaluLintasSvg(params);
    title = title || 'Simbol Rambu Lalu Lintas';
  } else if (type === 'piring_gizi_seimbang' || type === 'piring_makanku' || type === 'gizi_seimbang' || type === 'empat_sehat_lima_sempurna') {
    svg = renderPiringGiziSeimbangSvg(params);
    title = title || 'Pedoman Gizi Seimbang: Piring Makanku';
  } else if (type === 'lapangan_olahraga' || type === 'lapangan_bola' || type === 'lapangan_voli' || type === 'denah_lapangan') {
    svg = renderLapanganOlahragaSvg(params);
    title = title || 'Denah Lapangan Olahraga';
  } else if (type === 'preposition_place' || type === 'preposisi' || type === 'english_preposition') {
    svg = renderPrepositionPlaceSvg(params);
    title = title || 'Prepositions of Place (Bahasa Inggris)';
  } else if (type === 'tangga_nada' || type === 'paranada' || type === 'not_balok' || type === 'kunci_g') {
    svg = renderTanggaNadaSvg(params);
    title = title || 'Garis Paranada & Tangga Nada Diatonis';
  } else if (type === 'lingkaran_warna' || type === 'roda_warna' || type === 'warna_primer_sekunder') {
    svg = renderLingkaranWarnaSvg(params);
    title = title || 'Teori Warna: Lingkaran Warna';
  } else if (type === 'struktur_pemda' || type === 'hirarki_pemda' || type === 'pemerintahan_daerah') {
    svg = renderStrukturPemdaSvg(params);
    title = title || 'Struktur Hirarki Pemerintahan Daerah';
  } else if (type === 'grid_maze_koding' || type === 'maze_koding' || type === 'labirin_robot') {
    svg = renderGridMazeKodingSvg(params);
    title = title || 'Koding SD: Navigasi Algoritma Grid Labirin';
  } else if (type === 'stopwatch_analog' || type === 'stopwatch') {
    svg = renderStopwatchAnalogSvg(params);
    title = title || 'Stopwatch Analog Presisi';
  } else if (type === 'jangka_sorong' || type === 'vernier_caliper') {
    svg = renderJangkaSorongSvg(params);
    title = title || 'Jangka Sorong (Vernier Caliper)';
  } else if (type === 'neraca_pasar' || type === 'timbangan_bebek') {
    svg = renderNeracaPasarSvg(params);
    title = title || 'Neraca Pasar (Timbangan Bebek)';
  } else if (type === 'timbangan_digital') {
    svg = renderTimbanganDigitalSvg(params);
    title = title || 'Timbangan Digital Presisi';
  } else if (type === 'bejana_literan' || type === 'literan_beras') {
    svg = renderBejanaLiteranSvg(params);
    title = title || 'Bejana Literan Takaran Beras';
  } else if (type === 'gelas_erlenmeyer' || type === 'erlenmeyer') {
    svg = renderGelasErlenmeyerSvg(params);
    title = title || 'Labu / Gelas Erlenmeyer';
  } else if (type === 'meteran_gulung' || type === 'meteran_pita') {
    svg = renderMeteranGulungSvg(params);
    title = title || 'Meteran Gulung Konstruksi';
  } else if (type === 'dinamometer_pegas' || type === 'neraca_pegas') {
    svg = renderDinamometerPegasSvg(params);
    title = title || 'Dinamometer (Neraca Pegas)';
  } else if (type === 'tangga_satuan_panjang' || type === 'satuan_panjang') {
    svg = renderTanggaSatuanPanjangSvg(params);
    title = title || 'Tangga Konversi Satuan Panjang';
  } else if (type === 'tangga_satuan_massa' || type === 'satuan_massa' || type === 'satuan_berat') {
    svg = renderTanggaSatuanMassaSvg(params);
    title = title || 'Tangga Konversi Satuan Massa';
  } else if (type === 'tangga_satuan_volume' || type === 'satuan_volume' || type === 'satuan_liter') {
    svg = renderTanggaSatuanVolumeSvg(params);
    title = title || 'Tangga Konversi Satuan Volume';
  } else if (type === 'sudut_jarum_jam' || type === 'sudut_jam') {
    svg = renderSudutJarumJamSvg(params);
    title = title || 'Sudut Jarum Jam';
  } else if (type === 'jaring_limas_segiempat' || type === 'jaring_limas_persegi') {
    svg = renderJaringLimasSegiempatSvg(params);
    title = title || 'Jaring-Jaring Limas Segiempat';
  } else if (type === 'jaring_limas_segitiga') {
    svg = renderJaringLimasSegitigaSvg(params);
    title = title || 'Jaring-Jaring Limas Segitiga';
  } else if (type === 'jaring_prisma_segitiga') {
    svg = renderJaringPrismaSegitigaSvg(params);
    title = title || 'Jaring-Jaring Prisma Segitiga';
  } else if (type === 'keliling_gabungan' || type === 'bangun_gabungan_keliling') {
    svg = renderKelilingGabunganSvg(params);
    title = title || 'Keliling Bangun Datar Gabungan';
  } else if (type === 'lingkaran_tembereng' || type === 'tembereng_lingkaran') {
    svg = renderLingkaranTemberengSvg(params);
    title = title || 'Tembereng dan Juring Lingkaran';
  } else if (type === 'koordinat_poligon' || type === 'poligon_kartesius') {
    svg = renderKoordinatPoligonSvg(params);
    title = title || 'Poligon pada Bidang Kartesius';
  } else if (type === 'transformasi_refleksi' || type === 'refleksi_geometri') {
    svg = renderTransformasiRefleksiSvg(params);
    title = title || 'Transformasi Geometri: Refleksi';
  } else if (type === 'transformasi_translasi' || type === 'translasi_geometri') {
    svg = renderTransformasiTranslasiSvg(params);
    title = title || 'Transformasi Geometri: Translasi';
  } else if (type === 'segi_enam_beraturan' || type === 'heksagon') {
    svg = renderSegiEnamBeraturanSvg(params);
    title = title || 'Segi Enam Beraturan (Heksagon)';
  } else if (type === 'blok_dienes' || type === 'base_ten_blocks') {
    svg = renderBlokDienesSvg(params);
    title = title || 'Blok Dienes Nilai Tempat';
  } else if (type === 'sempoa_abakus' || type === 'soroban' || type === 'sempoa') {
    svg = renderSempoaAbakusSvg(params);
    title = title || 'Sempoa / Abakus (Soroban)';
  } else if (type === 'tabel_nilai_tempat' || type === 'nilai_tempat') {
    svg = renderTabelNilaiTempatSvg(params);
    title = title || 'Tabel Analisis Nilai Tempat';
  } else if (type === 'garis_bilangan_pecahan') {
    svg = renderGarisBilanganPecahanSvg(params);
    title = title || 'Garis Bilangan Pecahan';
  } else if (type === 'garis_bilangan_desimal') {
    svg = renderGarisBilanganDesimalSvg(params);
    title = title || 'Garis Bilangan Desimal';
  } else if (type === 'perkalian_lattice' || type === 'metode_kisi' || type === 'napier') {
    svg = renderPerkalianLatticeSvg(params);
    title = title || 'Perkalian Metode Kisi (Lattice)';
  } else if (type === 'pola_ubin' || type === 'barisan_ubin') {
    svg = renderPolaUbinSvg(params);
    title = title || 'Pola Barisan Ubin Geometris';
  } else if (type === 'pita_pecahan' || type === 'pecahan_senilai_pita') {
    svg = renderPitaPecahanSvg(params);
    title = title || 'Pita Pecahan Senilai';
  } else if (type === 'matriks_nilai_uang' || type === 'uang_rupiah' || type === 'uang_kertas_logam') {
    svg = renderMatriksNilaiUangSvg(params);
    title = title || 'Kombinasi Pecahan Uang Rupiah';
  } else if (type === 'diagram_batang_ganda' || type === 'batang_ganda') {
    svg = renderDiagramBatangGandaSvg(params);
    title = title || 'Diagram Batang Ganda';
  } else if (type === 'diagram_garis_ganda' || type === 'garis_ganda') {
    svg = renderDiagramGarisGandaSvg(params);
    title = title || 'Diagram Garis Ganda';
  } else if (type === 'dot_plot' || type === 'diagram_titik') {
    svg = renderDotPlotSvg(params);
    title = title || 'Diagram Titik (Dot Plot)';
  } else if (type === 'diagram_lingkaran_derajat' || type === 'lingkaran_derajat') {
    svg = renderDiagramLingkaranDerajatSvg(params);
    title = title || 'Diagram Lingkaran Sudut Derajat';
  } else if (type === 'tabel_kontingensi' || type === 'frekuensi_dua_arah') {
    svg = renderTabelKontingensiSvg(params);
    title = title || 'Tabel Kontingensi Dua Arah';
  } else if (type === 'diagram_batang_horizontal' || type === 'batang_mendatar') {
    svg = renderDiagramBatangHorizontalSvg(params);
    title = title || 'Diagram Batang Mendatar';
  } else if (type === 'papan_galton_peluang' || type === 'quincunx' || type === 'papan_galton') {
    svg = renderPapanGaltonPeluangSvg(params);
    title = title || 'Papan Galton Peluang Jalur Acak';
  } else if (type === 'kartu_peluang' || type === 'ruang_sampel_kartu') {
    svg = renderKartuPeluangSvg(params);
    title = title || 'Ruang Sampel Kartu Peluang';
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
