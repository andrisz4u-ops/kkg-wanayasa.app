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
export interface BalokParams { p?: number; l?: number; t?: number; unit?: string; }
export interface KubusParams { s?: number; unit?: string; }
export interface TabungParams { r?: number; t?: number; unit?: string; }
export interface KerucutParams { r?: number; t?: number; s?: number; unit?: string; }
export interface BolaParams { r?: number; unit?: string; }
export interface PrismaParams { alas?: number; tinggiSegitiga?: number; panjang?: number; unit?: string; }
export interface LimasParams { s?: number; t?: number; unit?: string; }
export interface JaringKubusParams { s?: number; unit?: string; pola?: string; }
export interface JaringBalokParams { p?: number; l?: number; t?: number; unit?: string; }

// Geometri 2D
export interface PersegiPanjangParams { p?: number; l?: number; unit?: string; }
export interface SegitigaSikuParams { alas?: number; tinggi?: number; miring?: number; unit?: string; }
export interface LingkaranParams { r?: number; unit?: string; }
export interface TrapesiumParams { atasAlas?: number; bawahAlas?: number; tinggi?: number; unit?: string; }
export interface BelahKetupatParams { d1?: number; d2?: number; unit?: string; }
export interface LayangLayangParams { d1?: number; d2?: number; unit?: string; }

// Pecahan
export interface PecahanLingkaranParams { pembagi?: number; diarsir?: number; utuh?: number; }
export interface PecahanPersegiParams { kolom?: number; baris?: number; diarsir?: number; }

// Statistik
export interface DiagramBatangParams { judul?: string; labels?: string[]; data?: number[]; }
export interface DiagramGarisParams { judul?: string; labels?: string[]; data?: number[]; }
export interface DiagramLingkaranParams { judul?: string; labels?: string[]; data?: number[]; }
export interface DiagramVennParams { judul?: string; labelA?: string; labelB?: string; aSaja?: number; irisan?: number; bSaja?: number; }

// Pengukuran
export interface JamAnalogParams { jam?: number; menit?: number; }
export interface MistarParams { start?: number; end?: number; objectType?: string; label?: string; }
export interface BusurDerajatParams { derajat?: number; label?: string; }

// Sains / Anatomi / Biologi / Fisika
export interface OrganTargetParams { pointer?: string; label?: string; }
export interface SiklusHidupParams { tahap?: string; label?: string; }
export interface RangkaianListrikParams { tipe?: string; saklar1?: boolean; saklar2?: boolean; }

// Helper: Escape XML/SVG string
export function escapeXml(str: string | number): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper: Sanitize raw ampersands in SVG XML string to ensure 100% valid XML rendering
export function sanitizeSvgXml(svg: string): string {
  if (!svg) return svg;
  // Replace any '&' that is NOT part of a valid XML entity reference (&amp;, &lt;, &gt;, &quot;, &apos;, &#123;, &#x1F;)
  return svg.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

// Helper: Wrap SVG string to Data URI
export function svgToDataUri(svg: string): string {
  const sanitized = sanitizeSvgXml(svg);
  const cleaned = sanitized.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

