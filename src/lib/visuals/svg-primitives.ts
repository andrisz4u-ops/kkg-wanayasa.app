/**
 * svg-primitives.ts
 * Enterprise Reusable SVG Primitives and Builders for Examplate Visual Stimulus Engine
 * 
 * Provides consistent accessibility, visual hierarchy, banners, target badges,
 * dimension lines, ground shadows, and defs across all templates.
 */

import { escapeXml } from './types';

export interface SvgCanvasOptions {
  width: number;
  height: number;
  title?: string;
  desc?: string;
  defs?: string;
  content: string;
  bgFill?: string;
  bgStroke?: string;
  bgStrokeWidth?: number;
  rx?: number;
  ariaId?: string;
  style?: string;
}

/**
 * Generate standard root <svg> wrapper with accessibility tags, defs, background card, and inner content
 */
export function svgCanvas(options: SvgCanvasOptions): string {
  const {
    width,
    height,
    title,
    desc,
    defs,
    content,
    bgFill = '#ffffff',
    bgStroke = '#cbd5e1',
    bgStrokeWidth = 1.5,
    rx = 8,
    ariaId,
    style = "background:#ffffff; font-family:'Segoe UI',Arial,sans-serif;"
  } = options;

  const idPrefix = ariaId ? escapeXml(ariaId) : `stimulus-${Math.floor(Math.random() * 100000)}`;
  const ariaAttr = title || desc ? ` role="img" aria-labelledby="${idPrefix}-title ${idPrefix}-desc"` : ' role="img"';

  const titleTag = title ? `  <title id="${idPrefix}-title">${escapeXml(title)}</title>\n` : '';
  const descTag = desc ? `  <desc id="${idPrefix}-desc">${escapeXml(desc)}</desc>\n` : '';
  const defsTag = defs ? `  <defs>\n${defs}\n  </defs>\n` : '';

  const cardRect = (bgFill !== 'none' || bgStroke !== 'none')
    ? `  <rect width="${width}" height="${height}" fill="${bgFill}" stroke="${bgStroke}" stroke-width="${bgStrokeWidth}" rx="${rx}"/>\n`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"${ariaAttr} style="${style}">
${titleTag}${descTag}${defsTag}${cardRect}${content}
</svg>`;
}

export interface SvgHeaderOptions {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  cx?: number;
  startY?: number;
}

/**
 * Generate consistent header banner with optional category pill badge and subtitle
 */
export function svgHeader(options: SvgHeaderOptions): string {
  const {
    title,
    subtitle,
    badge,
    badgeBg = '#e0f2fe',
    badgeColor = '#0369a1',
    cx = 190,
    startY = 14
  } = options;

  let y = startY;
  const parts: string[] = [];

  if (badge) {
    const badgeW = Math.max(120, badge.length * 7.5 + 24);
    parts.push(`  <rect x="${cx - badgeW / 2}" y="${y}" width="${badgeW}" height="18" rx="9" fill="${badgeBg}"/>`);
    parts.push(`  <text x="${cx}" y="${y + 12}" text-anchor="middle" font-size="9" font-weight="bold" fill="${badgeColor}" letter-spacing="0.4">${escapeXml(badge)}</text>`);
    y += 24;
  }

  parts.push(`  <text x="${cx}" y="${y + 10}" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#0f172a">${escapeXml(title)}</text>`);
  y += 15;

  if (subtitle) {
    parts.push(`  <text x="${cx}" y="${y + 9}" text-anchor="middle" font-size="9" font-weight="500" fill="#64748b">${escapeXml(subtitle)}</text>`);
  }

  return parts.join('\n');
}

/**
 * Generate standard Examplate target badge [X]
 */
export function svgTargetBadge(
  cx: number,
  cy: number,
  label = 'X',
  r = 11,
  filterId?: string
): string {
  const filterAttr = filterId ? ` filter="url(#${filterId})"` : '';
  const fontSize = r >= 12 ? 11 : r >= 10 ? 10 : 9;
  return `  <g class="target-badge"${filterAttr}>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
    <text x="${cx}" y="${cy + fontSize * 0.38}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="#ffffff">[${escapeXml(label)}]</text>
  </g>`;
}

/**
 * Generate bottom pedagogical interactive question prompt banner
 */
export function svgBottomPrompt(
  text: string,
  width = 380,
  y = 200,
  paddingX = 20,
  boxHeight = 24
): string {
  const boxW = Math.max(160, width - paddingX * 2);
  const boxX = paddingX;
  const cx = width / 2;
  return `  <!-- Bottom Interactive Question Prompt -->
  <rect x="${boxX}" y="${y - boxHeight * 0.6}" width="${boxW}" height="${boxHeight}" rx="6" fill="#0f172a" fill-opacity="0.92"/>
  <text x="${cx}" y="${y}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#f8fafc">${escapeXml(text)}</text>`;
}

/**
 * Generate precision technical dimension line with arrow or end ticks
 */
export function svgDimensionLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  orientation: 'h' | 'v' = 'h',
  color = '#0284c7',
  tickLen = 4
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  let ticks = '';
  let textTag = '';

  if (orientation === 'h') {
    ticks = `
    <line x1="${x1}" y1="${y1 - tickLen}" x2="${x1}" y2="${y1 + tickLen}" stroke="${color}" stroke-width="1.5"/>
    <line x1="${x2}" y1="${y2 - tickLen}" x2="${x2}" y2="${y2 + tickLen}" stroke="${color}" stroke-width="1.5"/>`;
    textTag = `<text x="${mx}" y="${my - 4}" text-anchor="middle" font-size="9" font-weight="bold" fill="${color}">${escapeXml(label)}</text>`;
  } else {
    ticks = `
    <line x1="${x1 - tickLen}" y1="${y1}" x2="${x1 + tickLen}" y2="${y1}" stroke="${color}" stroke-width="1.5"/>
    <line x1="${x2 - tickLen}" y1="${y2}" x2="${x2 + tickLen}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>`;
    textTag = `<text x="${mx + 6}" y="${my + 3.5}" font-size="9" font-weight="bold" fill="${color}">${escapeXml(label)}</text>`;
  }

  return `  <g class="dimension-line">
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.4" stroke-dasharray="3,2"/>${ticks}
    ${textTag}
  </g>`;
}

/**
 * Generate soft ground contact shadow ellipse
 */
export function svgGroundShadow(
  cx: number,
  cy: number,
  rx: number,
  ry = 10,
  fillId = 'cmnGroundShadow'
): string {
  return `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${fillId})"/>`;
}

/**
 * Generate reusable definitions for enterprise-grade visuals (shadows, gradients, arrows)
 */
export function svgCommonDefs(prefix = 'cmn'): string {
  return `    <!-- Enterprise Filter Shadows -->
    <filter id="${prefix}DropShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/>
    </filter>
    <filter id="${prefix}GlowTarget" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#e11d48" flood-opacity="0.4"/>
    </filter>

    <!-- Radial Floor Shadow -->
    <radialGradient id="${prefix}GroundShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.16"/>
      <stop offset="65%" stop-color="#0f172a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>

    <!-- Shared Metallic & Depth Gradients -->
    <linearGradient id="${prefix}CardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="${prefix}BlueShine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="50%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#7dd3fc"/>
    </linearGradient>
    <linearGradient id="${prefix}AmberWarm" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="${prefix}GreenFresh" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>

    <!-- Arrow Marker -->
    <marker id="${prefix}Arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
    </marker>`;
}
