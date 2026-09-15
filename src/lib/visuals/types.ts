/**
 * types.ts
 * Type definitions and basic utilities for Examplate Visual Stimulus Engine
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

export type VisualCategory =
  | 'Geometri 2D'
  | 'Geometri 3D'
  | 'Pecahan'
  | 'Matematika Bilangan'
  | 'Statistik'
  | 'Pengukuran'
  | 'Sains / IPAS'
  | 'Literasi & Sosial'
  | 'Koding & Komputasi'
  | 'PJOK & Kesehatan'
  | 'Bahasa'
  | 'Seni & Budaya (SBdP)'
  | 'Pancasila & Kewarganegaraan';

export interface VisualCatalogItem {
  id: string;
  category: VisualCategory;
  name: string;
  description: string;
  sampleParams: Record<string, any>;
}

// =========================================================================
// ENTERPRISE TYPED PARAMETER INTERFACES
// =========================================================================

// Geometri 3D
export interface BalokParams { p?: number; l?: number; t?: number; unit?: string; label?: string; }
export interface KubusParams { s?: number; unit?: string; label?: string; }
export interface TabungParams { r?: number; t?: number; unit?: string; label?: string; }
export interface KerucutParams { r?: number; t?: number; s?: number; unit?: string; label?: string; }
export interface BolaParams { r?: number; unit?: string; label?: string; }
export interface PrismaParams { alas?: number; tinggiSegitiga?: number; panjang?: number; unit?: string; label?: string; }
export interface LimasParams { s?: number; t?: number; unit?: string; label?: string; }
export interface JaringKubusParams { s?: number; unit?: string; pola?: string; label?: string; }
export interface JaringBalokParams { p?: number; l?: number; t?: number; unit?: string; label?: string; }

// Geometri Batch 3
export interface SudutLuarSegitigaParams { sudutA?: number; sudutB?: number; label?: string; }
export interface JaringKerucutParams { r?: number; s?: number; label?: string; }
export interface JaringTabungParams { r?: number; t?: number; label?: string; }
export interface LuasPermukaanGabunganParams { p?: number; l?: number; t?: number; label?: string; }
export interface PerisaiPancasilaParams { sila?: number | string; pointer?: string; label?: string; }

// Geometri 2D
export interface PersegiPanjangParams { p?: number; l?: number; unit?: string; label?: string; }
export interface SegitigaSikuParams { alas?: number; tinggi?: number; miring?: number; unit?: string; label?: string; }
export interface LingkaranParams { r?: number; unit?: string; label?: string; }
export interface TrapesiumParams { atasAlas?: number; bawahAlas?: number; tinggi?: number; unit?: string; label?: string; }
export interface BelahKetupatParams { d1?: number; d2?: number; unit?: string; label?: string; }
export interface LayangLayangParams { d1?: number; d2?: number; unit?: string; label?: string; }

// Pecahan
export interface PecahanLingkaranParams { pembagi?: number; diarsir?: number; utuh?: number; label?: string; }
export interface PecahanPersegiParams { kolom?: number; baris?: number; diarsir?: number; label?: string; }

// Statistik
export interface DiagramBatangParams { judul?: string; labels?: string[]; data?: number[]; label?: string; }
export interface DiagramGarisParams { judul?: string; labels?: string[]; data?: number[]; label?: string; }
export interface DiagramLingkaranParams { judul?: string; labels?: string[]; data?: number[]; label?: string; }
export interface DiagramVennParams { judul?: string; labelA?: string; labelB?: string; aSaja?: number; irisan?: number; bSaja?: number; label?: string; }

// Pengukuran
export interface JamAnalogParams { jam?: number; menit?: number; label?: string; }
export interface MistarParams { start?: number; end?: number; objectType?: string; label?: string; }
export interface BusurDerajatParams { derajat?: number; label?: string; }

// Sains Fisika & Mekanika
export interface RangkaianListrikParams {
  tipe?: string;
  model?: string;
  pointer?: string;
  label?: string;
  s1?: boolean | string;
  s2?: boolean | string;
  saklar1?: boolean;
  saklar2?: boolean;
  l1?: boolean;
  l2?: boolean;
  l3?: boolean;
}
export interface PerubahanWujudParams { pointer?: string; label?: string; }
export interface MagnetParams { interaksi?: string; pointer?: string; label?: string; }
export interface SifatCahayaParams { peristiwa?: string; pointer?: string; label?: string; }
export interface MacamMacamGayaParams { jenis?: string; pointer?: string; label?: string; }
export interface PesawatSederhanaBidangMiringParams { h?: number; s?: number; label?: string; }
export interface PesawatSederhanaRodaBerporosParams { label?: string; }
export interface PembangkitListrikPltaParams { pointer?: string; komponen?: string; label?: string; }
export interface PanelSuryaPltsParams { pointer?: string; komponen?: string; label?: string; }
export interface EnergiAnginPltbParams { label?: string; }
export interface TermosAirPanasParams { pointer?: string; bagian?: string; label?: string; }
export interface PerpindahanPanasParams { jenis?: string; pointer?: string; label?: string; }

// Sains Antariksa & Bumi
export interface TataSuryaParams { pointer?: string; label?: string; }
export interface GerakSemuMatahariParams { bulan?: string; pointer?: string; label?: string; }
export interface MusimDanRevolusiBumiParams { label?: string; }
export interface SiklusKarbonOksigenParams { pointer?: string; tahap?: string; label?: string; }

// Sains Biologi & Ekosistem
export interface OrganTargetParams { pointer?: string; label?: string; }
export interface SiklusHidupParams { tahap?: string; label?: string; }
export interface RantaiMakananLautParams { pointer?: string; target?: string; label?: string; }
export interface RantaiMakananHutanParams { pointer?: string; target?: string; label?: string; }
export interface DaurHidupKupuDetailParams { tahap?: string; pointer?: string; label?: string; }
export interface DaurHidupBelalangParams { tahap?: string; pointer?: string; label?: string; }
export interface DaurHidupKecoaParams { tahap?: string; pointer?: string; label?: string; }
export interface BagianAkarTumbuhanParams { bagian?: string; pointer?: string; label?: string; }
export interface BagianBatangDikotilMonokotilParams { jenis?: string; tipe?: string; label?: string; }
export interface BagianDaunAnatomiParams { pointer?: string; jaringan?: string; label?: string; }
export interface PiramidaMakananEkologiParams { tingkat?: string; pointer?: string; label?: string; }

// Sains Anatomi
export interface AlatEkskresiGinjalParams { bagian?: string; pointer?: string; label?: string; }
export interface IndraPengecapLidahParams { rasa?: string; pointer?: string; label?: string; }
export interface IndraPembauHidungParams { bagian?: string; pointer?: string; label?: string; }

// Matematika Lanjut, Komputasi & Koding
export interface DiagramAlurLogikaGerbangParams { gerbang?: string; inputA?: number; inputB?: number; label?: string; }
export interface KodingVariabelOperatorParams { varName?: string; op?: string; nilai?: number; label?: string; }
export interface GarisBilanganBulatOperasiParams { a?: number; b?: number; label?: string; }
export interface PecahanDesimalPersenSenilaiParams { pecahan?: string; desimal?: string; persen?: string; target?: string; label?: string; }
export interface JamDigitalKomparasiParams { jamAwal?: string; jamAkhir?: string; label?: string; }
export interface DiagramSankeyEnergiParams { masuk?: number; berguna?: number; terbuang?: number; label?: string; }
export interface SkalaPetaBatangParams { kmPerCm?: number; label?: string; }

// Literasi & Sosial
export interface GarisWallaceWeberParams { zona?: string; pointer?: string; label?: string; }
export interface CandiDanPeninggalanSejarahParams { pointer?: string; jenis?: string; candi?: string; label?: string; }
export interface MotifBatikNusantaraParams { motif?: string; pointer?: string; label?: string; }
export interface SenjataTradisionalNusantaraParams { senjata?: string; pointer?: string; label?: string; }
export interface TarianDaerahNusantaraParams { tari?: string; pointer?: string; label?: string; }
export interface PiramidaPendudukParams { tipe?: string; pointer?: string; label?: string; }
export interface StrukturFabelAlurCeritaParams { tahap?: string; pointer?: string; label?: string; }
export interface JenisParagrafInduktifDeduktifParams { jenis?: string; pointer?: string; label?: string; }
export interface UnsurIklanMediaCetakParams { bagian?: string; pointer?: string; label?: string; }
export interface PohonKeluargaGenealogiParams { posisi?: string; pointer?: string; label?: string; }
export interface KoperasiSekolahParams { jabatan?: string; pointer?: string; label?: string; }

// =========================================================================
// SECURITY & DATA UTILITIES
// =========================================================================

/**
 * Validasi dan sanitasi numerik yang aman untuk mencegah injection atau NaN/undefined pada visual SVG
 */
export function safeNum(val: any, fallback: number, min = -999999, max = 999999): number {
  const n = Number(val);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Optimasi SVG output: menghapus komentar XML dan mengompres whitespace
 */
export function minifySvg(svg: string): string {
  if (!svg) return '';
  return svg
    .replace(/<!--[\s\S]*?-->/g, '') // remove XML comments
    .replace(/\r?\n\s*/g, ' ')      // collapse newlines
    .replace(/\s{2,}/g, ' ')        // collapse multiple spaces into single space
    .replace(/>\s+</g, '><')        // collapse inter-tag spacing safely
    .trim();
}

/**
 * Escape string untuk XML/SVG entity safety
 */
export function escapeXml(str: string | number): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitize raw ampersands in SVG XML string to ensure 100% valid XML rendering
 */
export function sanitizeSvgXml(svg: string): string {
  if (!svg) return svg;
  // Replace any '&' that is NOT part of a valid XML entity reference (&amp;, &lt;, &gt;, &quot;, &apos;, &#123;, &#x1F;)
  return svg.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

/**
 * Wrap SVG string to Data URI with XML sanitization
 */
export function svgToDataUri(svg: string): string {
  const sanitized = sanitizeSvgXml(svg);
  const cleaned = sanitized.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}
