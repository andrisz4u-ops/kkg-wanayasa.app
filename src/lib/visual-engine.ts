/**
 * visual-engine.ts
 * Examplate Visual Stimulus Engine untuk Portal Pendidikan A4EDU / KKG Wanayasa
 *
 * Facade utama yang mengonsolidasikan dan mendistribusikan 200 stimulus visual SVG vektor
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
  renderSegiEnamBeraturanSvg,
  renderSudutBerpelurusBerpenyikuSvg,
  renderGarisSejajarTransversalSvg,
  renderTeoremaPythagorasSvg,
  renderJuringBusurLingkaranSvg,
  renderSudutLuarSegitigaSvg,
  renderJaringKerucutSvg,
  renderJaringTabungSvg,
  renderLuasPermukaanGabunganSvg
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
  renderKartuPeluangSvg,
  renderSegitigaPascalSvg,
  renderSkalaTermometerKomparasiSvg,
  renderDiagramBatangDaunSvg,
  renderDiagramBoxPlotSvg,
  renderPohonPeluangSvg,
  renderKodingBlokPercabanganSvg,
  renderKodingBlokPerulanganSvg,
  renderDiagramAlurLogikaGerbangSvg,
  renderKodingVariabelOperatorSvg,
  renderGarisBilanganBulatOperasiSvg,
  renderPecahanDesimalPersenSenilaiSvg,
  renderJamDigitalKomparasiSvg,
  renderDiagramSankeyEnergiSvg,
  renderSkalaPetaBatangSvg
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
  renderPancaindraSvg,
  renderRangkaManusiaSvg,
  renderSendiGerakSvg,
  renderMetamorfosisKatakSvg,
  renderMetamorfosisNyamukSvg,
  renderParuhBurungSvg,
  renderKakiBurungSvg,
  renderSimbiosisSvg,
  renderJaringMakananSawahSvg,
  renderAdaptasiTumbuhanSvg,
  renderPernapasanHewanSvg,
  renderPerkembangbiakanTumbuhanSvg,
  renderSelHewanTumbuhanSvg,
  renderFaseBulanSvg,
  renderLapisanBumiSvg,
  renderLapisanTanahSvg,
  renderBateraiBuahSvg,
  renderOptikPeriskopSvg,
  renderKacaPembesarLupSvg,
  renderPemuaianBimetalSvg,
  renderGelombangBunyiSvg,
  renderPerubahanEnergiSvg,
  renderZonaWaktuIndonesiaSvg,
  renderSiklusBatuanSvg,
  renderRantaiMakananLautSvg,
  renderRantaiMakananHutanSvg,
  renderDaurHidupKupuDetailSvg,
  renderDaurHidupBelalangSvg,
  renderDaurHidupKecoaSvg,
  renderBagianAkarTumbuhanSvg,
  renderBagianBatangDikotilMonokotilSvg,
  renderBagianDaunAnatomiSvg,
  renderAlatEkskresiGinjalSvg,
  renderPiramidaMakananEkologiSvg,
  renderIndraPengecapLidahSvg,
  renderIndraPembauHidungSvg,
  renderMacamMacamGayaSvg,
  renderPesawatSederhanaBidangMiringSvg,
  renderPesawatSederhanaRodaBerporosSvg,
  renderPembangkitListrikPltaSvg,
  renderPanelSuryaPltsSvg,
  renderEnergiAnginPltbSvg,
  renderTermosAirPanasSvg,
  renderPerpindahanPanasKonduksiKonveksiRadiasiSvg,
  renderGerakSemuMatahariSvg,
  renderMusimDanRevolusiBumiSvg,
  renderSiklusKarbonOksigenSvg
} from './visuals/science';

import {
  renderRambuLaluLintasSvg,
  renderPiringGiziSeimbangSvg,
  renderLapanganOlahragaSvg,
  renderPrepositionPlaceSvg,
  renderTanggaNadaSvg,
  renderLingkaranWarnaSvg,
  renderStrukturPemdaSvg,
  renderGridMazeKodingSvg,
  renderSimbolKartografiSvg,
  renderGarisLintangBujurSvg,
  renderRumahAdatNusantaraSvg,
  renderAlatMusikTradisionalSvg,
  renderTriasPolitikaSvg,
  renderAlurKegiatanEkonomiSvg,
  renderNormaMasyarakatSvg,
  renderRambuBahayaLabSvg,
  renderPiramidaAktivitasFisikSvg,
  renderLapanganAtletikSvg,
  renderDiagramMindmapParagrafSvg,
  renderGarisWallaceWeberSvg,
  renderCandiDanPeninggalanSejarahSvg,
  renderMotifBatikNusantaraSvg,
  renderSenjataTradisionalNusantaraSvg,
  renderTarianDaerahNusantaraSvg,
  renderPiramidaPendudukSvg,
  renderStrukturFabelAlurCeritaSvg,
  renderJenisParagrafInduktifDeduktifSvg,
  renderUnsurIklanMediaCetakSvg,
  renderPohonKeluargaGenealogiSvg,
  renderKoperasiSekolahSvg
} from './visuals/literacy-social';

// Export all submodules to ensure 100% backward compatibility
export * from './visuals';

export type VisualRendererFn = (params: any) => string;
export type VisualTitleResolver = string | ((params: any) => string);

export interface VisualRendererRegistration {
  render: VisualRendererFn;
  defaultTitle: VisualTitleResolver;
}

/**
 * Registry O(1) pemetaan tipe stimulus ke fungsi renderer SVG dan default title
 * Mendukung 200 template resmi dan seluruh alias kompatibilitas (total 436 tipe).
 */
export const VISUAL_RENDERER_REGISTRY: Record<string, VisualRendererRegistration> = {
  // balok
  'balok': { render: renderBalokSvg, defaultTitle: 'Diagram Bangun Ruang Balok' },
  // kubus
  'kubus': { render: renderKubusSvg, defaultTitle: 'Diagram Bangun Ruang Kubus' },
  // tabung
  'tabung': { render: renderTabungSvg, defaultTitle: 'Diagram Bangun Ruang Tabung' },
  // kerucut
  'kerucut': { render: renderKerucutSvg, defaultTitle: 'Diagram Bangun Ruang Kerucut' },
  // bola
  'bola': { render: renderBolaSvg, defaultTitle: 'Diagram Bangun Ruang Bola' },
  // prisma
  'prisma': { render: renderPrismaSvg, defaultTitle: 'Diagram Bangun Ruang Prisma Segitiga' },
  'prisma_segitiga': { render: renderPrismaSvg, defaultTitle: 'Diagram Bangun Ruang Prisma Segitiga' },
  // limas
  'limas': { render: renderLimasSvg, defaultTitle: 'Diagram Bangun Ruang Limas' },
  'limas_segiempat': { render: renderLimasSvg, defaultTitle: 'Diagram Bangun Ruang Limas' },
  // segitiga_siku
  'segitiga_siku': { render: renderSegitigaSikuSvg, defaultTitle: 'Diagram Segitiga Siku-Siku' },
  'segitiga': { render: renderSegitigaSikuSvg, defaultTitle: 'Diagram Segitiga Siku-Siku' },
  // sudut
  'sudut': { render: renderSudutSvg, defaultTitle: 'Pengukuran Sudut' },
  // lingkaran
  'lingkaran': { render: renderLingkaranSvg, defaultTitle: 'Diagram Lingkaran (Bangun Datar)' },
  // trapesium
  'trapesium': { render: renderTrapesiumSvg, defaultTitle: 'Diagram Trapesium' },
  // jajar_genjang
  'jajar_genjang': { render: renderJajarGenjangSvg, defaultTitle: 'Diagram Jajar Genjang' },
  'jajargenjang': { render: renderJajarGenjangSvg, defaultTitle: 'Diagram Jajar Genjang' },
  // belah_ketupat
  'belah_ketupat': { render: renderBelahKetupatSvg, defaultTitle: 'Diagram Belah Ketupat' },
  'belahketupat': { render: renderBelahKetupatSvg, defaultTitle: 'Diagram Belah Ketupat' },
  // layang_layang
  'layang_layang': { render: renderLayangLayangSvg, defaultTitle: 'Diagram Layang-Layang' },
  'layanglayang': { render: renderLayangLayangSvg, defaultTitle: 'Diagram Layang-Layang' },
  // persegi_panjang
  'persegi_panjang': { render: renderPersegiPanjangSvg, defaultTitle: 'Diagram Persegi Panjang' },
  'persegipanjang': { render: renderPersegiPanjangSvg, defaultTitle: 'Diagram Persegi Panjang' },
  // segitiga_sama_sisi
  'segitiga_sama_sisi': { render: renderSegitigaSamaSisiSvg, defaultTitle: 'Diagram Segitiga Sama Sisi' },
  'segitigasamasisi': { render: renderSegitigaSamaSisiSvg, defaultTitle: 'Diagram Segitiga Sama Sisi' },
  // segitiga_sama_kaki
  'segitiga_sama_kaki': { render: renderSegitigaSamaKakiSvg, defaultTitle: 'Diagram Segitiga Sama Kaki' },
  'segitigasamakaki': { render: renderSegitigaSamaKakiSvg, defaultTitle: 'Diagram Segitiga Sama Kaki' },
  // jaring_kubus
  'jaring_kubus': { render: renderJaringKubusSvg, defaultTitle: 'Jaring-jaring Kubus' },
  'jaring_jaring_kubus': { render: renderJaringKubusSvg, defaultTitle: 'Jaring-jaring Kubus' },
  'jaringjaringkubus': { render: renderJaringKubusSvg, defaultTitle: 'Jaring-jaring Kubus' },
  // jaring_balok
  'jaring_balok': { render: renderJaringBalokSvg, defaultTitle: 'Jaring-jaring Balok' },
  'jaring_jaring_balok': { render: renderJaringBalokSvg, defaultTitle: 'Jaring-jaring Balok' },
  'jaringjaringbalok': { render: renderJaringBalokSvg, defaultTitle: 'Jaring-jaring Balok' },
  // koordinat
  'koordinat': { render: renderKoordinatKartesiusSvg, defaultTitle: 'Bidang Koordinat Kartesius' },
  'koordinat_kartesius': { render: renderKoordinatKartesiusSvg, defaultTitle: 'Bidang Koordinat Kartesius' },
  'kartesius': { render: renderKoordinatKartesiusSvg, defaultTitle: 'Bidang Koordinat Kartesius' },
  // diagram_venn
  'diagram_venn': { render: renderDiagramVennSvg, defaultTitle: 'Diagram Venn' },
  'venn': { render: renderDiagramVennSvg, defaultTitle: 'Diagram Venn' },
  // pictogram
  'pictogram': { render: renderPictogramSvg, defaultTitle: 'Diagram Gambar (Pictogram)' },
  'piktogram': { render: renderPictogramSvg, defaultTitle: 'Diagram Gambar (Pictogram)' },
  'diagram_gambar': { render: renderPictogramSvg, defaultTitle: 'Diagram Gambar (Pictogram)' },
  // simetri_lipat
  'simetri_lipat': { render: renderSimetriLipatSvg, defaultTitle: 'Simetri Lipat Bangun Datar' },
  'simetri': { render: renderSimetriLipatSvg, defaultTitle: 'Simetri Lipat Bangun Datar' },
  // bangun_gabungan
  'bangun_gabungan': { render: renderBangunGabunganSvg, defaultTitle: 'Bangun Datar Gabungan' },
  'gabungan': { render: renderBangunGabunganSvg, defaultTitle: 'Bangun Datar Gabungan' },
  // pecahan_lingkaran
  'pecahan_lingkaran': { render: renderPecahanLingkaranSvg, defaultTitle: (p) => p?.utuh ? 'Visualisasi Pecahan Campuran' : 'Visualisasi Pecahan Lingkaran' },
  'pecahan_pie': { render: renderPecahanLingkaranSvg, defaultTitle: (p) => p?.utuh ? 'Visualisasi Pecahan Campuran' : 'Visualisasi Pecahan Lingkaran' },
  'pecahan_campuran': { render: renderPecahanLingkaranSvg, defaultTitle: (p) => p?.utuh ? 'Visualisasi Pecahan Campuran' : 'Visualisasi Pecahan Lingkaran' },
  // pecahan_persegi
  'pecahan_persegi': { render: renderPecahanPersegiSvg, defaultTitle: 'Visualisasi Pecahan Persegi' },
  'pecahan_grid': { render: renderPecahanPersegiSvg, defaultTitle: 'Visualisasi Pecahan Persegi' },
  // diagram_batang
  'diagram_batang': { render: renderDiagramBatangSvg, defaultTitle: 'Diagram Batang' },
  'bar_chart': { render: renderDiagramBatangSvg, defaultTitle: 'Diagram Batang' },
  // diagram_garis
  'diagram_garis': { render: renderDiagramGarisSvg, defaultTitle: 'Diagram Garis' },
  'line_chart': { render: renderDiagramGarisSvg, defaultTitle: 'Diagram Garis' },
  // diagram_lingkaran
  'diagram_lingkaran': { render: renderDiagramLingkaranSvg, defaultTitle: 'Diagram Lingkaran (Pie Chart)' },
  'pie_chart': { render: renderDiagramLingkaranSvg, defaultTitle: 'Diagram Lingkaran (Pie Chart)' },
  // organ_pernapasan
  'organ_pernapasan': { render: renderOrganPernapasanSvg, defaultTitle: 'Diagram Sistem Pernapasan Manusia' },
  'pernapasan': { render: renderOrganPernapasanSvg, defaultTitle: 'Diagram Sistem Pernapasan Manusia' },
  // alveolus
  'alveolus': { render: renderAlveolusSvg, defaultTitle: 'Penampang Alveolus & Pertukaran Gas' },
  // organ_pencernaan
  'organ_pencernaan': { render: renderOrganPencernaanSvg, defaultTitle: 'Diagram Sistem Pencernaan Manusia' },
  'pencernaan': { render: renderOrganPencernaanSvg, defaultTitle: 'Diagram Sistem Pencernaan Manusia' },
  // vili_usus
  'vili_usus': { render: renderViliUsusSvg, defaultTitle: 'Struktur Vili (Jonjot) Usus Halus' },
  'vili': { render: renderViliUsusSvg, defaultTitle: 'Struktur Vili (Jonjot) Usus Halus' },
  'jonjot_usus': { render: renderViliUsusSvg, defaultTitle: 'Struktur Vili (Jonjot) Usus Halus' },
  // struktur_gigi
  'struktur_gigi': { render: renderStrukturGigiSvg, defaultTitle: 'Jenis-Jenis Gigi Manusia & Fungsinya' },
  'gigi': { render: renderStrukturGigiSvg, defaultTitle: 'Jenis-Jenis Gigi Manusia & Fungsinya' },
  'jenis_gigi': { render: renderStrukturGigiSvg, defaultTitle: 'Jenis-Jenis Gigi Manusia & Fungsinya' },
  // lambung_detail
  'lambung_detail': { render: renderLambungDetailSvg, defaultTitle: 'Penampang Detail Organ Lambung' },
  'lambung': { render: renderLambungDetailSvg, defaultTitle: 'Penampang Detail Organ Lambung' },
  // rantai_makanan
  'rantai_makanan': { render: renderRantaiMakananSvg, defaultTitle: 'Rantai Makanan' },
  // siklus_air
  'siklus_air': { render: renderSiklusAirSvg, defaultTitle: 'Bagan Siklus Air' },
  // metamorfosis
  'metamorfosis': { render: renderMetamorfosisSvg, defaultTitle: 'Daur Hidup Metamorfosis' },
  'metamorfosis_kupu': { render: renderMetamorfosisSvg, defaultTitle: 'Daur Hidup Metamorfosis' },
  // bagian_bunga
  'bagian_bunga': { render: renderBagianBungaSvg, defaultTitle: 'Penampang Bagian Bunga' },
  'bunga': { render: renderBagianBungaSvg, defaultTitle: 'Penampang Bagian Bunga' },
  // peta_indonesia
  'peta_indonesia': { render: renderPetaIndonesiaSvg, defaultTitle: 'Peta Kepulauan Indonesia' },
  'peta': { render: renderPetaIndonesiaSvg, defaultTitle: 'Peta Kepulauan Indonesia' },
  'peta_nusantara': { render: renderPetaIndonesiaSvg, defaultTitle: 'Peta Kepulauan Indonesia' },
  // rangkaian_listrik
  'rangkaian_listrik': { render: renderRangkaianListrikSvg, defaultTitle: 'Diagram Rangkaian Listrik' },
  'listrik': { render: renderRangkaianListrikSvg, defaultTitle: 'Diagram Rangkaian Listrik' },
  'rangkaian': { render: renderRangkaianListrikSvg, defaultTitle: 'Diagram Rangkaian Listrik' },
  // perubahan_wujud
  'perubahan_wujud': { render: renderPerubahanWujudSvg, defaultTitle: 'Diagram Perubahan Wujud Zat' },
  'wujud_zat': { render: renderPerubahanWujudSvg, defaultTitle: 'Diagram Perubahan Wujud Zat' },
  'perubahan_wujud_zat': { render: renderPerubahanWujudSvg, defaultTitle: 'Diagram Perubahan Wujud Zat' },
  // tata_surya
  'tata_surya': { render: renderTataSuryaSvg, defaultTitle: 'Diagram Sistem Tata Surya' },
  'planet': { render: renderTataSuryaSvg, defaultTitle: 'Diagram Sistem Tata Surya' },
  'sistem_tata_surya': { render: renderTataSuryaSvg, defaultTitle: 'Diagram Sistem Tata Surya' },
  // perisai_pancasila
  'perisai_pancasila': { render: renderPerisaiPancasilaSvg, defaultTitle: 'Perisai Garuda Pancasila' },
  'pancasila': { render: renderPerisaiPancasilaSvg, defaultTitle: 'Perisai Garuda Pancasila' },
  'garuda_pancasila': { render: renderPerisaiPancasilaSvg, defaultTitle: 'Perisai Garuda Pancasila' },
  'lambang_pancasila': { render: renderPerisaiPancasilaSvg, defaultTitle: 'Perisai Garuda Pancasila' },
  // magnet
  'magnet': { render: renderMagnetSvg, defaultTitle: 'Interaksi Batang Magnet' },
  'gaya_magnet': { render: renderMagnetSvg, defaultTitle: 'Interaksi Batang Magnet' },
  'kutub_magnet': { render: renderMagnetSvg, defaultTitle: 'Interaksi Batang Magnet' },
  // sifat_cahaya
  'sifat_cahaya': { render: renderSifatCahayaSvg, defaultTitle: 'Diagram Sifat Cahaya' },
  'cahaya': { render: renderSifatCahayaSvg, defaultTitle: 'Diagram Sifat Cahaya' },
  'pembiasan': { render: renderSifatCahayaSvg, defaultTitle: 'Diagram Sifat Cahaya' },
  'pemantulan': { render: renderSifatCahayaSvg, defaultTitle: 'Diagram Sifat Cahaya' },
  // peredaran_darah
  'peredaran_darah': { render: renderPeredaranDarahSvg, defaultTitle: 'Skema Sistem Peredaran Darah Manusia' },
  'jantung': { render: renderPeredaranDarahSvg, defaultTitle: 'Skema Sistem Peredaran Darah Manusia' },
  'sirkulasi_darah': { render: renderPeredaranDarahSvg, defaultTitle: 'Skema Sistem Peredaran Darah Manusia' },
  // gerhana
  'gerhana': { render: renderGerhanaSvg, defaultTitle: 'Diagram Peristiwa Gerhana' },
  'gerhana_matahari': { render: renderGerhanaSvg, defaultTitle: 'Diagram Peristiwa Gerhana' },
  'gerhana_bulan': { render: renderGerhanaSvg, defaultTitle: 'Diagram Peristiwa Gerhana' },
  // pesawat_sederhana
  'pesawat_sederhana': { render: renderPesawatSederhanaSvg, defaultTitle: 'Diagram Pesawat Sederhana' },
  'tuas': { render: renderPesawatSederhanaSvg, defaultTitle: 'Diagram Pesawat Sederhana' },
  'katrol': { render: renderPesawatSederhanaSvg, defaultTitle: 'Diagram Pesawat Sederhana' },
  'pengungkit': { render: renderPesawatSederhanaSvg, defaultTitle: 'Diagram Pesawat Sederhana' },
  // pancaindra
  'pancaindra': { render: renderPancaindraSvg, defaultTitle: 'Diagram Organ Pancaindra' },
  'indra': { render: renderPancaindraSvg, defaultTitle: 'Diagram Organ Pancaindra' },
  'mata': { render: renderPancaindraSvg, defaultTitle: 'Diagram Organ Pancaindra' },
  'telinga': { render: renderPancaindraSvg, defaultTitle: 'Diagram Organ Pancaindra' },
  // jam_analog
  'jam_analog': { render: renderJamAnalogSvg, defaultTitle: 'Jam Dinding Analog' },
  'jam': { render: renderJamAnalogSvg, defaultTitle: 'Jam Dinding Analog' },
  'clock': { render: renderJamAnalogSvg, defaultTitle: 'Jam Dinding Analog' },
  // garis_bilangan
  'garis_bilangan': { render: renderGarisBilanganSvg, defaultTitle: 'Garis Bilangan' },
  // mistar
  'mistar': { render: renderMistarSvg, defaultTitle: 'Pengukuran Panjang Mistar' },
  'penggaris': { render: renderMistarSvg, defaultTitle: 'Pengukuran Panjang Mistar' },
  'pengukuran_panjang': { render: renderMistarSvg, defaultTitle: 'Pengukuran Panjang Mistar' },
  // busur_derajat
  'busur_derajat': { render: renderBusurDerajatSvg, defaultTitle: 'Pengukuran Sudut Busur Derajat' },
  'busur': { render: renderBusurDerajatSvg, defaultTitle: 'Pengukuran Sudut Busur Derajat' },
  'pengukuran_busur': { render: renderBusurDerajatSvg, defaultTitle: 'Pengukuran Sudut Busur Derajat' },
  // timbangan_neraca
  'timbangan_neraca': { render: renderTimbanganNeracaSvg, defaultTitle: 'Pengukuran Massa Neraca Dua Lengan' },
  'neraca': { render: renderTimbanganNeracaSvg, defaultTitle: 'Pengukuran Massa Neraca Dua Lengan' },
  'timbangan': { render: renderTimbanganNeracaSvg, defaultTitle: 'Pengukuran Massa Neraca Dua Lengan' },
  // mata_angin
  'mata_angin': { render: renderMataAnginSvg, defaultTitle: 'Diagram Arah Mata Angin & Denah' },
  'arah_mata_angin': { render: renderMataAnginSvg, defaultTitle: 'Diagram Arah Mata Angin & Denah' },
  'kompas': { render: renderMataAnginSvg, defaultTitle: 'Diagram Arah Mata Angin & Denah' },
  'denah': { render: renderMataAnginSvg, defaultTitle: 'Diagram Arah Mata Angin & Denah' },
  // tabel_turus
  'tabel_turus': { render: renderTabelTurusSvg, defaultTitle: 'Tabel Frekuensi Data & Turus' },
  'turus': { render: renderTabelTurusSvg, defaultTitle: 'Tabel Frekuensi Data & Turus' },
  'tally': { render: renderTabelTurusSvg, defaultTitle: 'Tabel Frekuensi Data & Turus' },
  // spinner_peluang
  'spinner_peluang': { render: renderSpinnerPeluangSvg, defaultTitle: 'Roda Putar Peluang (Spinner)' },
  'spinner': { render: renderSpinnerPeluangSvg, defaultTitle: 'Roda Putar Peluang (Spinner)' },
  'roda_putar': { render: renderSpinnerPeluangSvg, defaultTitle: 'Roda Putar Peluang (Spinner)' },
  // pola_gambar
  'pola_gambar': { render: renderPolaGambarSvg, defaultTitle: 'Barisan Pola Gambar Geometri' },
  'barisan_pola': { render: renderPolaGambarSvg, defaultTitle: 'Barisan Pola Gambar Geometri' },
  'pola_bilangan_gambar': { render: renderPolaGambarSvg, defaultTitle: 'Barisan Pola Gambar Geometri' },
  // flowchart
  'flowchart': { render: renderFlowchartSvg, defaultTitle: 'Diagram Alir Algoritma (Flowchart)' },
  'diagram_alir': { render: renderFlowchartSvg, defaultTitle: 'Diagram Alir Algoritma (Flowchart)' },
  'algoritma': { render: renderFlowchartSvg, defaultTitle: 'Diagram Alir Algoritma (Flowchart)' },
  // termometer
  'termometer': { render: renderTermometerSvg, defaultTitle: 'Pengukuran Suhu Termometer' },
  'suhu': { render: renderTermometerSvg, defaultTitle: 'Pengukuran Suhu Termometer' },
  'pengukuran_suhu': { render: renderTermometerSvg, defaultTitle: 'Pengukuran Suhu Termometer' },
  // gelas_ukur
  'gelas_ukur': { render: renderGelasUkurSvg, defaultTitle: 'Pengukuran Volume Zat Cair (Gelas Ukur)' },
  'volume_cairan': { render: renderGelasUkurSvg, defaultTitle: 'Pengukuran Volume Zat Cair (Gelas Ukur)' },
  'archimedes': { render: renderGelasUkurSvg, defaultTitle: 'Pengukuran Volume Zat Cair (Gelas Ukur)' },
  // pohon_faktor
  'pohon_faktor': { render: renderPohonFaktorSvg, defaultTitle: 'Pohon Faktor & Faktorisasi Prima' },
  'faktorisasi_prima': { render: renderPohonFaktorSvg, defaultTitle: 'Pohon Faktor & Faktorisasi Prima' },
  'kpk_fpb': { render: renderPohonFaktorSvg, defaultTitle: 'Pohon Faktor & Faktorisasi Prima' },
  // grid_matriks_100
  'grid_matriks_100': { render: renderGridMatriks100Svg, defaultTitle: 'Grid Matriks 100 Pecahan Desimal & Persen' },
  'grid_100': { render: renderGridMatriks100Svg, defaultTitle: 'Grid Matriks 100 Pecahan Desimal & Persen' },
  'pecahan_desimal_persen': { render: renderGridMatriks100Svg, defaultTitle: 'Grid Matriks 100 Pecahan Desimal & Persen' },
  // rambu_lalu_lintas
  'rambu_lalu_lintas': { render: renderRambuLaluLintasSvg, defaultTitle: 'Simbol Rambu Lalu Lintas' },
  'rambu': { render: renderRambuLaluLintasSvg, defaultTitle: 'Simbol Rambu Lalu Lintas' },
  'rambu_keselamatan': { render: renderRambuLaluLintasSvg, defaultTitle: 'Simbol Rambu Lalu Lintas' },
  // piring_gizi_seimbang
  'piring_gizi_seimbang': { render: renderPiringGiziSeimbangSvg, defaultTitle: 'Pedoman Gizi Seimbang: Piring Makanku' },
  'piring_makanku': { render: renderPiringGiziSeimbangSvg, defaultTitle: 'Pedoman Gizi Seimbang: Piring Makanku' },
  'gizi_seimbang': { render: renderPiringGiziSeimbangSvg, defaultTitle: 'Pedoman Gizi Seimbang: Piring Makanku' },
  'empat_sehat_lima_sempurna': { render: renderPiringGiziSeimbangSvg, defaultTitle: 'Pedoman Gizi Seimbang: Piring Makanku' },
  // lapangan_olahraga
  'lapangan_olahraga': { render: renderLapanganOlahragaSvg, defaultTitle: 'Denah Lapangan Olahraga' },
  'lapangan_bola': { render: renderLapanganOlahragaSvg, defaultTitle: 'Denah Lapangan Olahraga' },
  'lapangan_voli': { render: renderLapanganOlahragaSvg, defaultTitle: 'Denah Lapangan Olahraga' },
  'denah_lapangan': { render: renderLapanganOlahragaSvg, defaultTitle: 'Denah Lapangan Olahraga' },
  // preposition_place
  'preposition_place': { render: renderPrepositionPlaceSvg, defaultTitle: 'Prepositions of Place (Bahasa Inggris)' },
  'preposisi': { render: renderPrepositionPlaceSvg, defaultTitle: 'Prepositions of Place (Bahasa Inggris)' },
  'english_preposition': { render: renderPrepositionPlaceSvg, defaultTitle: 'Prepositions of Place (Bahasa Inggris)' },
  // tangga_nada
  'tangga_nada': { render: renderTanggaNadaSvg, defaultTitle: 'Garis Paranada & Tangga Nada Diatonis' },
  'paranada': { render: renderTanggaNadaSvg, defaultTitle: 'Garis Paranada & Tangga Nada Diatonis' },
  'not_balok': { render: renderTanggaNadaSvg, defaultTitle: 'Garis Paranada & Tangga Nada Diatonis' },
  'kunci_g': { render: renderTanggaNadaSvg, defaultTitle: 'Garis Paranada & Tangga Nada Diatonis' },
  // lingkaran_warna
  'lingkaran_warna': { render: renderLingkaranWarnaSvg, defaultTitle: 'Teori Warna: Lingkaran Warna' },
  'roda_warna': { render: renderLingkaranWarnaSvg, defaultTitle: 'Teori Warna: Lingkaran Warna' },
  'warna_primer_sekunder': { render: renderLingkaranWarnaSvg, defaultTitle: 'Teori Warna: Lingkaran Warna' },
  // struktur_pemda
  'struktur_pemda': { render: renderStrukturPemdaSvg, defaultTitle: 'Struktur Hirarki Pemerintahan Daerah' },
  'hirarki_pemda': { render: renderStrukturPemdaSvg, defaultTitle: 'Struktur Hirarki Pemerintahan Daerah' },
  'pemerintahan_daerah': { render: renderStrukturPemdaSvg, defaultTitle: 'Struktur Hirarki Pemerintahan Daerah' },
  // grid_maze_koding
  'grid_maze_koding': { render: renderGridMazeKodingSvg, defaultTitle: 'Koding SD: Navigasi Algoritma Grid Labirin' },
  'maze_koding': { render: renderGridMazeKodingSvg, defaultTitle: 'Koding SD: Navigasi Algoritma Grid Labirin' },
  'labirin_robot': { render: renderGridMazeKodingSvg, defaultTitle: 'Koding SD: Navigasi Algoritma Grid Labirin' },
  // stopwatch_analog
  'stopwatch_analog': { render: renderStopwatchAnalogSvg, defaultTitle: 'Stopwatch Analog Presisi' },
  'stopwatch': { render: renderStopwatchAnalogSvg, defaultTitle: 'Stopwatch Analog Presisi' },
  // jangka_sorong
  'jangka_sorong': { render: renderJangkaSorongSvg, defaultTitle: 'Jangka Sorong (Vernier Caliper)' },
  'vernier_caliper': { render: renderJangkaSorongSvg, defaultTitle: 'Jangka Sorong (Vernier Caliper)' },
  // neraca_pasar
  'neraca_pasar': { render: renderNeracaPasarSvg, defaultTitle: 'Neraca Pasar (Timbangan Bebek)' },
  'timbangan_bebek': { render: renderNeracaPasarSvg, defaultTitle: 'Neraca Pasar (Timbangan Bebek)' },
  // timbangan_digital
  'timbangan_digital': { render: renderTimbanganDigitalSvg, defaultTitle: 'Timbangan Digital Presisi' },
  // bejana_literan
  'bejana_literan': { render: renderBejanaLiteranSvg, defaultTitle: 'Bejana Literan Takaran Beras' },
  'literan_beras': { render: renderBejanaLiteranSvg, defaultTitle: 'Bejana Literan Takaran Beras' },
  // gelas_erlenmeyer
  'gelas_erlenmeyer': { render: renderGelasErlenmeyerSvg, defaultTitle: 'Labu / Gelas Erlenmeyer' },
  'erlenmeyer': { render: renderGelasErlenmeyerSvg, defaultTitle: 'Labu / Gelas Erlenmeyer' },
  // meteran_gulung
  'meteran_gulung': { render: renderMeteranGulungSvg, defaultTitle: 'Meteran Gulung Konstruksi' },
  'meteran_pita': { render: renderMeteranGulungSvg, defaultTitle: 'Meteran Gulung Konstruksi' },
  // dinamometer_pegas
  'dinamometer_pegas': { render: renderDinamometerPegasSvg, defaultTitle: 'Dinamometer (Neraca Pegas)' },
  'neraca_pegas': { render: renderDinamometerPegasSvg, defaultTitle: 'Dinamometer (Neraca Pegas)' },
  // tangga_satuan_panjang
  'tangga_satuan_panjang': { render: renderTanggaSatuanPanjangSvg, defaultTitle: 'Tangga Konversi Satuan Panjang' },
  'satuan_panjang': { render: renderTanggaSatuanPanjangSvg, defaultTitle: 'Tangga Konversi Satuan Panjang' },
  // tangga_satuan_massa
  'tangga_satuan_massa': { render: renderTanggaSatuanMassaSvg, defaultTitle: 'Tangga Konversi Satuan Massa' },
  'satuan_massa': { render: renderTanggaSatuanMassaSvg, defaultTitle: 'Tangga Konversi Satuan Massa' },
  'satuan_berat': { render: renderTanggaSatuanMassaSvg, defaultTitle: 'Tangga Konversi Satuan Massa' },
  // tangga_satuan_volume
  'tangga_satuan_volume': { render: renderTanggaSatuanVolumeSvg, defaultTitle: 'Tangga Konversi Satuan Volume' },
  'satuan_volume': { render: renderTanggaSatuanVolumeSvg, defaultTitle: 'Tangga Konversi Satuan Volume' },
  'satuan_liter': { render: renderTanggaSatuanVolumeSvg, defaultTitle: 'Tangga Konversi Satuan Volume' },
  // sudut_jarum_jam
  'sudut_jarum_jam': { render: renderSudutJarumJamSvg, defaultTitle: 'Sudut Jarum Jam' },
  'sudut_jam': { render: renderSudutJarumJamSvg, defaultTitle: 'Sudut Jarum Jam' },
  // jaring_limas_segiempat
  'jaring_limas_segiempat': { render: renderJaringLimasSegiempatSvg, defaultTitle: 'Jaring-Jaring Limas Segiempat' },
  'jaring_limas_persegi': { render: renderJaringLimasSegiempatSvg, defaultTitle: 'Jaring-Jaring Limas Segiempat' },
  // jaring_limas_segitiga
  'jaring_limas_segitiga': { render: renderJaringLimasSegitigaSvg, defaultTitle: 'Jaring-Jaring Limas Segitiga' },
  // jaring_prisma_segitiga
  'jaring_prisma_segitiga': { render: renderJaringPrismaSegitigaSvg, defaultTitle: 'Jaring-Jaring Prisma Segitiga' },
  // keliling_gabungan
  'keliling_gabungan': { render: renderKelilingGabunganSvg, defaultTitle: 'Keliling Bangun Datar Gabungan' },
  'bangun_gabungan_keliling': { render: renderKelilingGabunganSvg, defaultTitle: 'Keliling Bangun Datar Gabungan' },
  // lingkaran_tembereng
  'lingkaran_tembereng': { render: renderLingkaranTemberengSvg, defaultTitle: 'Tembereng dan Juring Lingkaran' },
  'tembereng_lingkaran': { render: renderLingkaranTemberengSvg, defaultTitle: 'Tembereng dan Juring Lingkaran' },
  // koordinat_poligon
  'koordinat_poligon': { render: renderKoordinatPoligonSvg, defaultTitle: 'Poligon pada Bidang Kartesius' },
  'poligon_kartesius': { render: renderKoordinatPoligonSvg, defaultTitle: 'Poligon pada Bidang Kartesius' },
  // transformasi_refleksi
  'transformasi_refleksi': { render: renderTransformasiRefleksiSvg, defaultTitle: 'Transformasi Geometri: Refleksi' },
  'refleksi_geometri': { render: renderTransformasiRefleksiSvg, defaultTitle: 'Transformasi Geometri: Refleksi' },
  // transformasi_translasi
  'transformasi_translasi': { render: renderTransformasiTranslasiSvg, defaultTitle: 'Transformasi Geometri: Translasi' },
  'translasi_geometri': { render: renderTransformasiTranslasiSvg, defaultTitle: 'Transformasi Geometri: Translasi' },
  // segi_enam_beraturan
  'segi_enam_beraturan': { render: renderSegiEnamBeraturanSvg, defaultTitle: 'Segi Enam Beraturan (Heksagon)' },
  'heksagon': { render: renderSegiEnamBeraturanSvg, defaultTitle: 'Segi Enam Beraturan (Heksagon)' },
  // blok_dienes
  'blok_dienes': { render: renderBlokDienesSvg, defaultTitle: 'Blok Dienes Nilai Tempat' },
  'base_ten_blocks': { render: renderBlokDienesSvg, defaultTitle: 'Blok Dienes Nilai Tempat' },
  // sempoa_abakus
  'sempoa_abakus': { render: renderSempoaAbakusSvg, defaultTitle: 'Sempoa / Abakus (Soroban)' },
  'soroban': { render: renderSempoaAbakusSvg, defaultTitle: 'Sempoa / Abakus (Soroban)' },
  'sempoa': { render: renderSempoaAbakusSvg, defaultTitle: 'Sempoa / Abakus (Soroban)' },
  // tabel_nilai_tempat
  'tabel_nilai_tempat': { render: renderTabelNilaiTempatSvg, defaultTitle: 'Tabel Analisis Nilai Tempat' },
  'nilai_tempat': { render: renderTabelNilaiTempatSvg, defaultTitle: 'Tabel Analisis Nilai Tempat' },
  // garis_bilangan_pecahan
  'garis_bilangan_pecahan': { render: renderGarisBilanganPecahanSvg, defaultTitle: 'Garis Bilangan Pecahan' },
  // garis_bilangan_desimal
  'garis_bilangan_desimal': { render: renderGarisBilanganDesimalSvg, defaultTitle: 'Garis Bilangan Desimal' },
  // perkalian_lattice
  'perkalian_lattice': { render: renderPerkalianLatticeSvg, defaultTitle: 'Perkalian Metode Kisi (Lattice)' },
  'metode_kisi': { render: renderPerkalianLatticeSvg, defaultTitle: 'Perkalian Metode Kisi (Lattice)' },
  'napier': { render: renderPerkalianLatticeSvg, defaultTitle: 'Perkalian Metode Kisi (Lattice)' },
  // pola_ubin
  'pola_ubin': { render: renderPolaUbinSvg, defaultTitle: 'Pola Barisan Ubin Geometris' },
  'barisan_ubin': { render: renderPolaUbinSvg, defaultTitle: 'Pola Barisan Ubin Geometris' },
  // pita_pecahan
  'pita_pecahan': { render: renderPitaPecahanSvg, defaultTitle: 'Pita Pecahan Senilai' },
  'pecahan_senilai_pita': { render: renderPitaPecahanSvg, defaultTitle: 'Pita Pecahan Senilai' },
  // matriks_nilai_uang
  'matriks_nilai_uang': { render: renderMatriksNilaiUangSvg, defaultTitle: 'Kombinasi Pecahan Uang Rupiah' },
  'uang_rupiah': { render: renderMatriksNilaiUangSvg, defaultTitle: 'Kombinasi Pecahan Uang Rupiah' },
  'uang_kertas_logam': { render: renderMatriksNilaiUangSvg, defaultTitle: 'Kombinasi Pecahan Uang Rupiah' },
  // diagram_batang_ganda
  'diagram_batang_ganda': { render: renderDiagramBatangGandaSvg, defaultTitle: 'Diagram Batang Ganda' },
  'batang_ganda': { render: renderDiagramBatangGandaSvg, defaultTitle: 'Diagram Batang Ganda' },
  // diagram_garis_ganda
  'diagram_garis_ganda': { render: renderDiagramGarisGandaSvg, defaultTitle: 'Diagram Garis Ganda' },
  'garis_ganda': { render: renderDiagramGarisGandaSvg, defaultTitle: 'Diagram Garis Ganda' },
  // dot_plot
  'dot_plot': { render: renderDotPlotSvg, defaultTitle: 'Diagram Titik (Dot Plot)' },
  'diagram_titik': { render: renderDotPlotSvg, defaultTitle: 'Diagram Titik (Dot Plot)' },
  // diagram_lingkaran_derajat
  'diagram_lingkaran_derajat': { render: renderDiagramLingkaranDerajatSvg, defaultTitle: 'Diagram Lingkaran Sudut Derajat' },
  'lingkaran_derajat': { render: renderDiagramLingkaranDerajatSvg, defaultTitle: 'Diagram Lingkaran Sudut Derajat' },
  // tabel_kontingensi
  'tabel_kontingensi': { render: renderTabelKontingensiSvg, defaultTitle: 'Tabel Kontingensi Dua Arah' },
  'frekuensi_dua_arah': { render: renderTabelKontingensiSvg, defaultTitle: 'Tabel Kontingensi Dua Arah' },
  // diagram_batang_horizontal
  'diagram_batang_horizontal': { render: renderDiagramBatangHorizontalSvg, defaultTitle: 'Diagram Batang Mendatar' },
  'batang_mendatar': { render: renderDiagramBatangHorizontalSvg, defaultTitle: 'Diagram Batang Mendatar' },
  // papan_galton_peluang
  'papan_galton_peluang': { render: renderPapanGaltonPeluangSvg, defaultTitle: 'Papan Galton Peluang Jalur Acak' },
  'quincunx': { render: renderPapanGaltonPeluangSvg, defaultTitle: 'Papan Galton Peluang Jalur Acak' },
  'papan_galton': { render: renderPapanGaltonPeluangSvg, defaultTitle: 'Papan Galton Peluang Jalur Acak' },
  // kartu_peluang
  'kartu_peluang': { render: renderKartuPeluangSvg, defaultTitle: 'Ruang Sampel Kartu Peluang' },
  'ruang_sampel_kartu': { render: renderKartuPeluangSvg, defaultTitle: 'Ruang Sampel Kartu Peluang' },
  // sudut_berpelurus_berpenyiku
  'sudut_berpelurus_berpenyiku': { render: renderSudutBerpelurusBerpenyikuSvg, defaultTitle: 'Sudut Berpelurus & Berpenyiku' },
  'sudut_berpelurus': { render: renderSudutBerpelurusBerpenyikuSvg, defaultTitle: 'Sudut Berpelurus & Berpenyiku' },
  'sudut_berpenyiku': { render: renderSudutBerpelurusBerpenyikuSvg, defaultTitle: 'Sudut Berpelurus & Berpenyiku' },
  // garis_sejajar_transversal
  'garis_sejajar_transversal': { render: renderGarisSejajarTransversalSvg, defaultTitle: 'Garis Sejajar Dipotong Transversal' },
  'sudut_garis_sejajar': { render: renderGarisSejajarTransversalSvg, defaultTitle: 'Garis Sejajar Dipotong Transversal' },
  // teorema_pythagoras
  'teorema_pythagoras': { render: renderTeoremaPythagorasSvg, defaultTitle: 'Pembuktian Grafis Teorema Pythagoras' },
  'pembuktian_pythagoras': { render: renderTeoremaPythagorasSvg, defaultTitle: 'Pembuktian Grafis Teorema Pythagoras' },
  // juring_busur_lingkaran
  'juring_busur_lingkaran': { render: renderJuringBusurLingkaranSvg, defaultTitle: 'Juring & Busur Lingkaran' },
  'juring_lingkaran': { render: renderJuringBusurLingkaranSvg, defaultTitle: 'Juring & Busur Lingkaran' },
  'busur_lingkaran': { render: renderJuringBusurLingkaranSvg, defaultTitle: 'Juring & Busur Lingkaran' },
  // segitiga_pascal
  'segitiga_pascal': { render: renderSegitigaPascalSvg, defaultTitle: 'Segitiga Bilangan Pascal' },
  'pola_pascal': { render: renderSegitigaPascalSvg, defaultTitle: 'Segitiga Bilangan Pascal' },
  // skala_termometer_komparasi
  'skala_termometer_komparasi': { render: renderSkalaTermometerKomparasiSvg, defaultTitle: 'Perbandingan 4 Skala Termometer' },
  'termometer_komparasi': { render: renderSkalaTermometerKomparasiSvg, defaultTitle: 'Perbandingan 4 Skala Termometer' },
  'konversi_termometer': { render: renderSkalaTermometerKomparasiSvg, defaultTitle: 'Perbandingan 4 Skala Termometer' },
  // diagram_batang_daun
  'diagram_batang_daun': { render: renderDiagramBatangDaunSvg, defaultTitle: 'Diagram Batang dan Daun' },
  'stem_leaf': { render: renderDiagramBatangDaunSvg, defaultTitle: 'Diagram Batang dan Daun' },
  // diagram_box_plot
  'diagram_box_plot': { render: renderDiagramBoxPlotSvg, defaultTitle: 'Diagram Kotak Garis (Box Plot)' },
  'box_plot': { render: renderDiagramBoxPlotSvg, defaultTitle: 'Diagram Kotak Garis (Box Plot)' },
  'kotak_garis': { render: renderDiagramBoxPlotSvg, defaultTitle: 'Diagram Kotak Garis (Box Plot)' },
  // pohon_peluang
  'pohon_peluang': { render: renderPohonPeluangSvg, defaultTitle: 'Diagram Pohon Peluang' },
  'diagram_pohon': { render: renderPohonPeluangSvg, defaultTitle: 'Diagram Pohon Peluang' },
  // koding_blok_percabangan
  'koding_blok_percabangan': { render: renderKodingBlokPercabanganSvg, defaultTitle: 'Koding Scratch: Blok Percabangan' },
  'scratch_percabangan': { render: renderKodingBlokPercabanganSvg, defaultTitle: 'Koding Scratch: Blok Percabangan' },
  'scratch_if_else': { render: renderKodingBlokPercabanganSvg, defaultTitle: 'Koding Scratch: Blok Percabangan' },
  // koding_blok_perulangan
  'koding_blok_perulangan': { render: renderKodingBlokPerulanganSvg, defaultTitle: 'Koding Scratch: Blok Perulangan' },
  'scratch_perulangan': { render: renderKodingBlokPerulanganSvg, defaultTitle: 'Koding Scratch: Blok Perulangan' },
  'scratch_loop': { render: renderKodingBlokPerulanganSvg, defaultTitle: 'Koding Scratch: Blok Perulangan' },
  // rangka_manusia
  'rangka_manusia': { render: renderRangkaManusiaSvg, defaultTitle: 'Sistem Rangka Manusia' },
  'sistem_rangka': { render: renderRangkaManusiaSvg, defaultTitle: 'Sistem Rangka Manusia' },
  'tulang_manusia': { render: renderRangkaManusiaSvg, defaultTitle: 'Sistem Rangka Manusia' },
  // sendi_gerak
  'sendi_gerak': { render: renderSendiGerakSvg, defaultTitle: 'Macam-Macam Sendi Gerak' },
  'macam_sendi': { render: renderSendiGerakSvg, defaultTitle: 'Macam-Macam Sendi Gerak' },
  'sendi_diartrosis': { render: renderSendiGerakSvg, defaultTitle: 'Macam-Macam Sendi Gerak' },
  // metamorfosis_katak
  'metamorfosis_katak': { render: renderMetamorfosisKatakSvg, defaultTitle: 'Daur Hidup Metamorfosis Katak' },
  'daur_hidup_katak': { render: renderMetamorfosisKatakSvg, defaultTitle: 'Daur Hidup Metamorfosis Katak' },
  // metamorfosis_nyamuk
  'metamorfosis_nyamuk': { render: renderMetamorfosisNyamukSvg, defaultTitle: 'Daur Hidup Metamorfosis Nyamuk' },
  'daur_hidup_nyamuk': { render: renderMetamorfosisNyamukSvg, defaultTitle: 'Daur Hidup Metamorfosis Nyamuk' },
  // paruh_burung
  'paruh_burung': { render: renderParuhBurungSvg, defaultTitle: 'Adaptasi Paruh Burung' },
  'adaptasi_paruh': { render: renderParuhBurungSvg, defaultTitle: 'Adaptasi Paruh Burung' },
  // kaki_burung
  'kaki_burung': { render: renderKakiBurungSvg, defaultTitle: 'Adaptasi Kaki & Cakar Burung' },
  'cakar_burung': { render: renderKakiBurungSvg, defaultTitle: 'Adaptasi Kaki & Cakar Burung' },
  'adaptasi_kaki': { render: renderKakiBurungSvg, defaultTitle: 'Adaptasi Kaki & Cakar Burung' },
  // simbiosis
  'simbiosis': { render: renderSimbiosisSvg, defaultTitle: 'Pola Interaksi Simbiosis' },
  'simbiosis_mutualisme': { render: renderSimbiosisSvg, defaultTitle: 'Pola Interaksi Simbiosis' },
  'pola_simbiosis': { render: renderSimbiosisSvg, defaultTitle: 'Pola Interaksi Simbiosis' },
  // jaring_makanan_sawah
  'jaring_makanan_sawah': { render: renderJaringMakananSawahSvg, defaultTitle: 'Jaring-Jaring Makanan Sawah' },
  'jaring_makanan': { render: renderJaringMakananSawahSvg, defaultTitle: 'Jaring-Jaring Makanan Sawah' },
  // adaptasi_tumbuhan
  'adaptasi_tumbuhan': { render: renderAdaptasiTumbuhanSvg, defaultTitle: 'Adaptasi Morfologi Tumbuhan' },
  'xerofit_hidrofit': { render: renderAdaptasiTumbuhanSvg, defaultTitle: 'Adaptasi Morfologi Tumbuhan' },
  // pernapasan_hewan
  'pernapasan_hewan': { render: renderPernapasanHewanSvg, defaultTitle: 'Alat Pernapasan Hewan' },
  'alat_napas_hewan': { render: renderPernapasanHewanSvg, defaultTitle: 'Alat Pernapasan Hewan' },
  // perkembangbiakan_tumbuhan
  'perkembangbiakan_tumbuhan': { render: renderPerkembangbiakanTumbuhanSvg, defaultTitle: 'Perkembangbiakan Vegetatif Tumbuhan' },
  'vegetatif_alami': { render: renderPerkembangbiakanTumbuhanSvg, defaultTitle: 'Perkembangbiakan Vegetatif Tumbuhan' },
  // sel_hewan_tumbuhan
  'sel_hewan_tumbuhan': { render: renderSelHewanTumbuhanSvg, defaultTitle: 'Sel Tumbuhan vs Sel Hewan' },
  'struktur_sel': { render: renderSelHewanTumbuhanSvg, defaultTitle: 'Sel Tumbuhan vs Sel Hewan' },
  // fase_bulan
  'fase_bulan': { render: renderFaseBulanSvg, defaultTitle: 'Fase-Fase Bulan' },
  'fase_fase_bulan': { render: renderFaseBulanSvg, defaultTitle: 'Fase-Fase Bulan' },
  // lapisan_bumi
  'lapisan_bumi': { render: renderLapisanBumiSvg, defaultTitle: 'Struktur Lapisan Bumi' },
  'struktur_bumi': { render: renderLapisanBumiSvg, defaultTitle: 'Struktur Lapisan Bumi' },
  // lapisan_tanah
  'lapisan_tanah': { render: renderLapisanTanahSvg, defaultTitle: 'Profil Lapisan Tanah' },
  'horizon_tanah': { render: renderLapisanTanahSvg, defaultTitle: 'Profil Lapisan Tanah' },
  // baterai_buah
  'baterai_buah': { render: renderBateraiBuahSvg, defaultTitle: 'Percobaan Baterai Buah (Sel Volta)' },
  'sel_volta_buah': { render: renderBateraiBuahSvg, defaultTitle: 'Percobaan Baterai Buah (Sel Volta)' },
  // optik_periskop
  'optik_periskop': { render: renderOptikPeriskopSvg, defaultTitle: 'Prinsip Kerja Optik Periskop' },
  'periskop': { render: renderOptikPeriskopSvg, defaultTitle: 'Prinsip Kerja Optik Periskop' },
  // kaca_pembesar_lup
  'kaca_pembesar_lup': { render: renderKacaPembesarLupSvg, defaultTitle: 'Pembentukan Bayangan Pada Lup' },
  'lup_bayangan': { render: renderKacaPembesarLupSvg, defaultTitle: 'Pembentukan Bayangan Pada Lup' },
  // pemuaian_bimetal
  'pemuaian_bimetal': { render: renderPemuaianBimetalSvg, defaultTitle: 'Prinsip Pemuaian Keping Bimetal' },
  'keping_bimetal': { render: renderPemuaianBimetalSvg, defaultTitle: 'Prinsip Pemuaian Keping Bimetal' },
  // gelombang_bunyi
  'gelombang_bunyi': { render: renderGelombangBunyiSvg, defaultTitle: 'Gelombang Bunyi Longitudinal' },
  'gelombang_longitudinal': { render: renderGelombangBunyiSvg, defaultTitle: 'Gelombang Bunyi Longitudinal' },
  // perubahan_energi
  'perubahan_energi': { render: renderPerubahanEnergiSvg, defaultTitle: 'Perubahan Bentuk Energi' },
  'konversi_energi': { render: renderPerubahanEnergiSvg, defaultTitle: 'Perubahan Bentuk Energi' },
  // zona_waktu_indonesia
  'zona_waktu_indonesia': { render: renderZonaWaktuIndonesiaSvg, defaultTitle: 'Pembagian Tiga Zona Waktu Indonesia' },
  'wib_wita_wit': { render: renderZonaWaktuIndonesiaSvg, defaultTitle: 'Pembagian Tiga Zona Waktu Indonesia' },
  // siklus_batuan
  'siklus_batuan': { render: renderSiklusBatuanSvg, defaultTitle: 'Siklus Pembentukan Batuan' },
  'pembentukan_batuan': { render: renderSiklusBatuanSvg, defaultTitle: 'Siklus Pembentukan Batuan' },
  // simbol_kartografi
  'simbol_kartografi': { render: renderSimbolKartografiSvg, defaultTitle: 'Simbol Standar Peta (Kartografi)' },
  'simbol_peta': { render: renderSimbolKartografiSvg, defaultTitle: 'Simbol Standar Peta (Kartografi)' },
  // garis_lintang_bujur
  'garis_lintang_bujur': { render: renderGarisLintangBujurSvg, defaultTitle: 'Garis Lintang & Garis Bujur' },
  'khatulistiwa_meridian': { render: renderGarisLintangBujurSvg, defaultTitle: 'Garis Lintang & Garis Bujur' },
  // rumah_adat_nusantara
  'rumah_adat_nusantara': { render: renderRumahAdatNusantaraSvg, defaultTitle: 'Rumah Adat Tradisional Nusantara' },
  'rumah_adat': { render: renderRumahAdatNusantaraSvg, defaultTitle: 'Rumah Adat Tradisional Nusantara' },
  // alat_musik_tradisional
  'alat_musik_tradisional': { render: renderAlatMusikTradisionalSvg, defaultTitle: 'Alat Musik Tradisional Nusantara' },
  'musik_nusantara': { render: renderAlatMusikTradisionalSvg, defaultTitle: 'Alat Musik Tradisional Nusantara' },
  // trias_politika
  'trias_politika': { render: renderTriasPolitikaSvg, defaultTitle: 'Sistem Trias Politika Indonesia' },
  'lembaga_negara': { render: renderTriasPolitikaSvg, defaultTitle: 'Sistem Trias Politika Indonesia' },
  // alur_kegiatan_ekonomi
  'alur_kegiatan_ekonomi': { render: renderAlurKegiatanEkonomiSvg, defaultTitle: 'Alur Kegiatan Ekonomi' },
  'kegiatan_ekonomi': { render: renderAlurKegiatanEkonomiSvg, defaultTitle: 'Alur Kegiatan Ekonomi' },
  // norma_masyarakat
  'norma_masyarakat': { render: renderNormaMasyarakatSvg, defaultTitle: 'Norma Kehidupan Bermasyarakat' },
  'macam_norma': { render: renderNormaMasyarakatSvg, defaultTitle: 'Norma Kehidupan Bermasyarakat' },
  // rambu_bahaya_lab
  'rambu_bahaya_lab': { render: renderRambuBahayaLabSvg, defaultTitle: 'Simbol Bahaya Laboratorium IPA (K3)' },
  'simbol_bahaya_k3': { render: renderRambuBahayaLabSvg, defaultTitle: 'Simbol Bahaya Laboratorium IPA (K3)' },
  // piramida_aktivitas_fisik
  'piramida_aktivitas_fisik': { render: renderPiramidaAktivitasFisikSvg, defaultTitle: 'Piramida Aktivitas Fisik Sehat (PJOK)' },
  'aktivitas_fisik_pjok': { render: renderPiramidaAktivitasFisikSvg, defaultTitle: 'Piramida Aktivitas Fisik Sehat (PJOK)' },
  // lapangan_atletik
  'lapangan_atletik': { render: renderLapanganAtletikSvg, defaultTitle: 'Denah Lapangan & Lintasan Atletik' },
  'lintasan_lari': { render: renderLapanganAtletikSvg, defaultTitle: 'Denah Lapangan & Lintasan Atletik' },
  // diagram_mindmap_paragraf
  'diagram_mindmap_paragraf': { render: renderDiagramMindmapParagrafSvg, defaultTitle: 'Peta Konsep Struktur Gagasan Paragraf' },
  'mindmap_ide_pokok': { render: renderDiagramMindmapParagrafSvg, defaultTitle: 'Peta Konsep Struktur Gagasan Paragraf' },
  // rantai_makanan_laut
  'rantai_makanan_laut': { render: renderRantaiMakananLautSvg, defaultTitle: 'Rantai Makanan Ekosistem Laut' },
  // rantai_makanan_hutan
  'rantai_makanan_hutan': { render: renderRantaiMakananHutanSvg, defaultTitle: 'Rantai Makanan Ekosistem Hutan' },
  // daur_hidup_kupu_detail
  'daur_hidup_kupu_detail': { render: renderDaurHidupKupuDetailSvg, defaultTitle: 'Daur Hidup Kupu-Kupu Lengkap' },
  // daur_hidup_belalang
  'daur_hidup_belalang': { render: renderDaurHidupBelalangSvg, defaultTitle: 'Daur Hidup Belalang' },
  // daur_hidup_kecoa
  'daur_hidup_kecoa': { render: renderDaurHidupKecoaSvg, defaultTitle: 'Daur Hidup Kecoa' },
  // bagian_akar_tumbuhan
  'bagian_akar_tumbuhan': { render: renderBagianAkarTumbuhanSvg, defaultTitle: 'Struktur Morfologi Akar Tumbuhan' },
  'akar_tumbuhan': { render: renderBagianAkarTumbuhanSvg, defaultTitle: 'Struktur Morfologi Akar Tumbuhan' },
  // bagian_batang_dikotil_monokotil
  'bagian_batang_dikotil_monokotil': { render: renderBagianBatangDikotilMonokotilSvg, defaultTitle: 'Penampang Batang Dikotil vs Monokotil' },
  'batang_dikotil_monokotil': { render: renderBagianBatangDikotilMonokotilSvg, defaultTitle: 'Penampang Batang Dikotil vs Monokotil' },
  // bagian_daun_anatomi
  'bagian_daun_anatomi': { render: renderBagianDaunAnatomiSvg, defaultTitle: 'Penampang Melintang Daun' },
  'anatomi_daun': { render: renderBagianDaunAnatomiSvg, defaultTitle: 'Penampang Melintang Daun' },
  // alat_ekskresi_ginjal
  'alat_ekskresi_ginjal': { render: renderAlatEkskresiGinjalSvg, defaultTitle: 'Struktur Anatomi Ginjal Manusia' },
  'ginjal_manusia': { render: renderAlatEkskresiGinjalSvg, defaultTitle: 'Struktur Anatomi Ginjal Manusia' },
  // piramida_makanan_ekologi
  'piramida_makanan_ekologi': { render: renderPiramidaMakananEkologiSvg, defaultTitle: 'Piramida Makanan & Tingkat Trofik' },
  'piramida_energi': { render: renderPiramidaMakananEkologiSvg, defaultTitle: 'Piramida Makanan & Tingkat Trofik' },
  // indra_pengecap_lidah
  'indra_pengecap_lidah': { render: renderIndraPengecapLidahSvg, defaultTitle: 'Peta Indra Pengecap Rasa Lidah' },
  'peta_rasa_lidah': { render: renderIndraPengecapLidahSvg, defaultTitle: 'Peta Indra Pengecap Rasa Lidah' },
  // indra_pembau_hidung
  'indra_pembau_hidung': { render: renderIndraPembauHidungSvg, defaultTitle: 'Anatomi Indra Pembau Hidung' },
  'organ_pembau': { render: renderIndraPembauHidungSvg, defaultTitle: 'Anatomi Indra Pembau Hidung' },
  // macam_macam_gaya
  'macam_macam_gaya': { render: renderMacamMacamGayaSvg, defaultTitle: 'Ragam Gaya dalam Kehidupan' },
  'gaya_fisika': { render: renderMacamMacamGayaSvg, defaultTitle: 'Ragam Gaya dalam Kehidupan' },
  // pesawat_sederhana_bidang_miring
  'pesawat_sederhana_bidang_miring': { render: renderPesawatSederhanaBidangMiringSvg, defaultTitle: 'Pesawat Sederhana Bidang Miring' },
  'bidang_miring': { render: renderPesawatSederhanaBidangMiringSvg, defaultTitle: 'Pesawat Sederhana Bidang Miring' },
  // pesawat_sederhana_roda_berporos
  'pesawat_sederhana_roda_berporos': { render: renderPesawatSederhanaRodaBerporosSvg, defaultTitle: 'Pesawat Sederhana Roda Berporos' },
  'roda_berporos': { render: renderPesawatSederhanaRodaBerporosSvg, defaultTitle: 'Pesawat Sederhana Roda Berporos' },
  // pembangkit_listrik_plta
  'pembangkit_listrik_plta': { render: renderPembangkitListrikPltaSvg, defaultTitle: 'Skema Pembangkit Listrik Tenaga Air (PLTA)' },
  'skema_plta': { render: renderPembangkitListrikPltaSvg, defaultTitle: 'Skema Pembangkit Listrik Tenaga Air (PLTA)' },
  // panel_surya_plts
  'panel_surya_plts': { render: renderPanelSuryaPltsSvg, defaultTitle: 'Skema Panel Surya PLTS' },
  'skema_plts': { render: renderPanelSuryaPltsSvg, defaultTitle: 'Skema Panel Surya PLTS' },
  // energi_angin_pltb
  'energi_angin_pltb': { render: renderEnergiAnginPltbSvg, defaultTitle: 'Pembangkit Listrik Tenaga Bayu/Angin (PLTB)' },
  'skema_pltb': { render: renderEnergiAnginPltbSvg, defaultTitle: 'Pembangkit Listrik Tenaga Bayu/Angin (PLTB)' },
  // termos_air_panas
  'termos_air_panas': { render: renderTermosAirPanasSvg, defaultTitle: 'Penampang Termos Penahan Kalor' },
  'termos_kalor': { render: renderTermosAirPanasSvg, defaultTitle: 'Penampang Termos Penahan Kalor' },
  // perpindahan_panas_konduksi_konveksi_radiasi
  'perpindahan_panas_konduksi_konveksi_radiasi': { render: renderPerpindahanPanasKonduksiKonveksiRadiasiSvg, defaultTitle: 'Konduksi, Konveksi, dan Radiasi Kalor' },
  'perpindahan_kalor': { render: renderPerpindahanPanasKonduksiKonveksiRadiasiSvg, defaultTitle: 'Konduksi, Konveksi, dan Radiasi Kalor' },
  // gerak_semu_matahari
  'gerak_semu_matahari': { render: renderGerakSemuMatahariSvg, defaultTitle: 'Gerak Semu Tahunan Matahari' },
  'gerak_semu_tahunan': { render: renderGerakSemuMatahariSvg, defaultTitle: 'Gerak Semu Tahunan Matahari' },
  // musim_dan_revolusi_bumi
  'musim_dan_revolusi_bumi': { render: renderMusimDanRevolusiBumiSvg, defaultTitle: 'Revolusi Bumi & Kemiringan Sumbu 23.5°' },
  'revolusi_bumi_musim': { render: renderMusimDanRevolusiBumiSvg, defaultTitle: 'Revolusi Bumi & Kemiringan Sumbu 23.5°' },
  // siklus_karbon_oksigen
  'siklus_karbon_oksigen': { render: renderSiklusKarbonOksigenSvg, defaultTitle: 'Daur Karbon Dioksida dan Oksigen' },
  'daur_oksigen_karbon': { render: renderSiklusKarbonOksigenSvg, defaultTitle: 'Daur Karbon Dioksida dan Oksigen' },
  // garis_wallace_weber
  'garis_wallace_weber': { render: renderGarisWallaceWeberSvg, defaultTitle: 'Garis Wallace & Garis Weber Persebaran Fauna' },
  'persebaran_fauna': { render: renderGarisWallaceWeberSvg, defaultTitle: 'Garis Wallace & Garis Weber Persebaran Fauna' },
  // candi_dan_peninggalan_sejarah
  'candi_dan_peninggalan_sejarah': { render: renderCandiDanPeninggalanSejarahSvg, defaultTitle: 'Arsitektur Candi Bersejarah Nusantara' },
  'candi_sejarah': { render: renderCandiDanPeninggalanSejarahSvg, defaultTitle: 'Arsitektur Candi Bersejarah Nusantara' },
  // motif_batik_nusantara
  'motif_batik_nusantara': { render: renderMotifBatikNusantaraSvg, defaultTitle: 'Motif Batik Nusantara' },
  'motif_batik': { render: renderMotifBatikNusantaraSvg, defaultTitle: 'Motif Batik Nusantara' },
  // senjata_tradisional_nusantara
  'senjata_tradisional_nusantara': { render: renderSenjataTradisionalNusantaraSvg, defaultTitle: 'Senjata Tradisional Khas Nusantara' },
  'senjata_tradisional': { render: renderSenjataTradisionalNusantaraSvg, defaultTitle: 'Senjata Tradisional Khas Nusantara' },
  // tarian_daerah_nusantara
  'tarian_daerah_nusantara': { render: renderTarianDaerahNusantaraSvg, defaultTitle: 'Tarian Tradisional Nusantara' },
  'tari_tradisional': { render: renderTarianDaerahNusantaraSvg, defaultTitle: 'Tarian Tradisional Nusantara' },
  // piramida_penduduk
  'piramida_penduduk': { render: renderPiramidaPendudukSvg, defaultTitle: 'Bentuk Piramida Penduduk Demografi' },
  'demografi_penduduk': { render: renderPiramidaPendudukSvg, defaultTitle: 'Bentuk Piramida Penduduk Demografi' },
  // struktur_fabel_alur_cerita
  'struktur_fabel_alur_cerita': { render: renderStrukturFabelAlurCeritaSvg, defaultTitle: 'Gunung Alur Cerita Narasi Fabel' },
  'alur_fabel': { render: renderStrukturFabelAlurCeritaSvg, defaultTitle: 'Gunung Alur Cerita Narasi Fabel' },
  // jenis_paragraf_induktif_deduktif
  'jenis_paragraf_induktif_deduktif': { render: renderJenisParagrafInduktifDeduktifSvg, defaultTitle: 'Struktur Paragraf Deduktif & Induktif' },
  'jenis_paragraf': { render: renderJenisParagrafInduktifDeduktifSvg, defaultTitle: 'Struktur Paragraf Deduktif & Induktif' },
  // unsur_iklan_media_cetak
  'unsur_iklan_media_cetak': { render: renderUnsurIklanMediaCetakSvg, defaultTitle: 'Anatomi Tata Letak Iklan Media Cetak' },
  'iklan_cetak': { render: renderUnsurIklanMediaCetakSvg, defaultTitle: 'Anatomi Tata Letak Iklan Media Cetak' },
  // pohon_keluarga_genealogi
  'pohon_keluarga_genealogi': { render: renderPohonKeluargaGenealogiSvg, defaultTitle: 'Bagan Silsilah Pohon Keluarga' },
  'pohon_keluarga': { render: renderPohonKeluargaGenealogiSvg, defaultTitle: 'Bagan Silsilah Pohon Keluarga' },
  // koperasi_sekolah
  'koperasi_sekolah': { render: renderKoperasiSekolahSvg, defaultTitle: 'Struktur Organisasi Koperasi Sekolah' },
  'struktur_koperasi': { render: renderKoperasiSekolahSvg, defaultTitle: 'Struktur Organisasi Koperasi Sekolah' },
  // sudut_luar_segitiga
  'sudut_luar_segitiga': { render: renderSudutLuarSegitigaSvg, defaultTitle: 'Teorema Sudut Luar Segitiga' },
  // jaring_kerucut
  'jaring_kerucut': { render: renderJaringKerucutSvg, defaultTitle: 'Jaring-jaring Kerucut' },
  // jaring_tabung
  'jaring_tabung': { render: renderJaringTabungSvg, defaultTitle: 'Jaring-jaring Tabung' },
  // luas_permukaan_gabungan
  'luas_permukaan_gabungan': { render: renderLuasPermukaanGabunganSvg, defaultTitle: 'Luas Permukaan Bangun Ruang Gabungan' },
  // diagram_alur_logika_gerbang
  'diagram_alur_logika_gerbang': { render: renderDiagramAlurLogikaGerbangSvg, defaultTitle: 'Gerbang Logika Komputasional' },
  'gerbang_logika': { render: renderDiagramAlurLogikaGerbangSvg, defaultTitle: 'Gerbang Logika Komputasional' },
  // koding_variabel_operator
  'koding_variabel_operator': { render: renderKodingVariabelOperatorSvg, defaultTitle: 'Koding Scratch: Blok Variabel & Operator' },
  // garis_bilangan_bulat_operasi
  'garis_bilangan_bulat_operasi': { render: renderGarisBilanganBulatOperasiSvg, defaultTitle: 'Operasi Hitung pada Garis Bilangan Bulat' },
  'operasi_bilangan_bulat': { render: renderGarisBilanganBulatOperasiSvg, defaultTitle: 'Operasi Hitung pada Garis Bilangan Bulat' },
  // pecahan_desimal_persen_senilai
  'pecahan_desimal_persen_senilai': { render: renderPecahanDesimalPersenSenilaiSvg, defaultTitle: 'Ekuivalensi Pecahan, Desimal, dan Persen' },
  'pecahan_senilai_tiga': { render: renderPecahanDesimalPersenSenilaiSvg, defaultTitle: 'Ekuivalensi Pecahan, Desimal, dan Persen' },
  // jam_digital_komparasi
  'jam_digital_komparasi': { render: renderJamDigitalKomparasiSvg, defaultTitle: 'Perhitungan Durasi Waktu Jam Digital' },
  'durasi_waktu': { render: renderJamDigitalKomparasiSvg, defaultTitle: 'Perhitungan Durasi Waktu Jam Digital' },
  // diagram_sankey_energi
  'diagram_sankey_energi': { render: renderDiagramSankeyEnergiSvg, defaultTitle: 'Diagram Sankey Aliran Energi' },
  'sankey_energi': { render: renderDiagramSankeyEnergiSvg, defaultTitle: 'Diagram Sankey Aliran Energi' },
  // skala_peta_batang
  'skala_peta_batang': { render: renderSkalaPetaBatangSvg, defaultTitle: 'Skala Garis / Batang pada Peta' },
  'skala_grafis': { render: renderSkalaPetaBatangSvg, defaultTitle: 'Skala Garis / Batang pada Peta' },
};

/**
 * Cek apakah sebuah tipe visual terdaftar di engine
 */
export function isKnownVisualType(type: string): boolean {
  if (!type) return false;
  return Object.prototype.hasOwnProperty.call(VISUAL_RENDERER_REGISTRY, type.toLowerCase());
}

/**
 * Dapatkan daftar semua tipe/alias visual yang terdaftar
 */
export function getRegisteredVisualTypes(): string[] {
  return Object.keys(VISUAL_RENDERER_REGISTRY);
}

/**
 * Dispatcher utama untuk menghasilkan SVG stimulus berdasarkan konfigurasi (O(1) Constant-Time Lookup)
 */
export function generateVisualStimulus(config: VisualStimulusConfig): GeneratedVisualResult | null {
  const type = (config.type || '').toLowerCase();
  const entry = VISUAL_RENDERER_REGISTRY[type];
  if (!entry) return null;

  const params = config.params || {};
  const svg = entry.render(params);
  if (!svg) return null;

  let title = config.caption;
  if (!title) {
    title = typeof entry.defaultTitle === 'function' ? entry.defaultTitle(params) : entry.defaultTitle;
  }

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
