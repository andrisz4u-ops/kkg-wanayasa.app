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

export interface VisualCatalogItem {
  id: string;
  category: 'Geometri 3D' | 'Geometri 2D' | 'Pecahan' | 'Statistik' | 'Pengukuran' | 'Sains / IPAS';
  name: string;
  description: string;
  sampleParams: Record<string, any>;
}

// Helper: Escape XML/SVG string
export function escapeXml(str: string | number): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper: Wrap SVG string to Data URI
export function svgToDataUri(svg: string): string {
  const cleaned = svg.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}
