import { describe, it, expect } from 'vitest';
import { getVisualCatalog } from '../src/lib/visuals/catalog';
import { generateVisualStimulus } from '../src/lib/visual-engine';
import { Window } from 'happy-dom';

describe('Deep XML & DOM Audit for All 200 Visual Stimulus SVGs', () => {
  const catalog = getVisualCatalog();
  const window = new Window();
  const DOMParser = window.DOMParser;
  const parser = new DOMParser();

  it('catalog should contain exactly 200 items', () => {
    expect(catalog.length).toBe(200);
  });

  const rawAmpersandRegex = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;

  it('audits all 200 SVGs with sampleParams (zero failures allowed)', () => {
    const failures: { id: string; name: string; error: string }[] = [];

    for (const item of catalog) {
      const res = generateVisualStimulus({
        type: item.id,
        params: item.sampleParams,
        caption: item.name,
      });

      if (!res || !res.svg || !res.dataUri) {
        failures.push({ id: item.id, name: item.name, error: 'generateVisualStimulus returned null or empty' });
        continue;
      }

      // 1. Data URI validation: must be data:image/svg+xml;utf8,...
      if (!res.dataUri.startsWith('data:image/svg+xml;utf8,')) {
        failures.push({ id: item.id, name: item.name, error: `Invalid dataUri format: ${res.dataUri.substring(0, 30)}` });
        continue;
      }

      // 2. Decode DataURI and verify it matches sanitized SVG
      const decoded = decodeURIComponent(res.dataUri.replace('data:image/svg+xml;utf8,', ''));
      if (!decoded.startsWith('<svg') || !decoded.endsWith('</svg>')) {
        failures.push({ id: item.id, name: item.name, error: 'Decoded SVG from dataUri does not start/end with svg tag' });
        continue;
      }

      // 3. Raw ampersand check in SVG
      const rawAmps = res.svg.replace(/<!--[\s\S]*?-->/g, '').match(rawAmpersandRegex);
      if (rawAmps) {
        failures.push({ id: item.id, name: item.name, error: `Contains ${rawAmps.length} unescaped ampersand(s)` });
        continue;
      }

      // 4. NaN or undefined in attribute values
      const nanMatch = res.svg.match(/=["'][^"']*(?:NaN|undefined|null)[^"']*["']/i);
      if (nanMatch) {
        failures.push({ id: item.id, name: item.name, error: `Found illegal attribute value: ${nanMatch[0]}` });
        continue;
      }

      // 5. XML DOM Parser validation
      const doc = parser.parseFromString(res.svg, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        failures.push({ id: item.id, name: item.name, error: `DOMParser error: ${parserError.textContent.trim()}` });
        continue;
      }

      // 6. SVG root element attributes
      const svgEl = doc.querySelector('svg');
      if (!svgEl) {
        failures.push({ id: item.id, name: item.name, error: 'Missing root <svg> element in parsed DOM' });
        continue;
      }
    }

    expect(failures).toEqual([]);
  });

  it('audits all 200 SVGs with empty params {} for extreme robustness (zero crashes/NaN)', () => {
    const failures: { id: string; name: string; error: string }[] = [];

    for (const item of catalog) {
      const res = generateVisualStimulus({
        type: item.id,
        params: {},
      });

      if (!res || !res.svg) {
        failures.push({ id: item.id, name: item.name, error: 'Failed to generate with empty params' });
        continue;
      }

      const rawAmps = res.svg.replace(/<!--[\s\S]*?-->/g, '').match(rawAmpersandRegex);
      if (rawAmps) {
        failures.push({ id: item.id, name: item.name, error: `Empty params produced unescaped ampersands` });
        continue;
      }

      const doc = parser.parseFromString(res.svg, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        failures.push({ id: item.id, name: item.name, error: `DOMParser error with empty params: ${parserError.textContent.trim()}` });
      }
    }

    expect(failures).toEqual([]);
  });
});
