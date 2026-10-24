import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getVisualCatalog, generateVisualStimulus } from '../src/lib/visual-engine';

const enumValues = new Proxy({}, { get: (_target, key) => String(key) });
class FakeNode {
  options: Record<string, unknown>;
  constructor(options: Record<string, unknown> = {}) { this.options = options; }
}

function installDocxRuntime() {
  Object.assign(window, {
    docx: {
      TextRun: FakeNode, Paragraph: FakeNode, Table: FakeNode, TableRow: FakeNode, TableCell: FakeNode,
      ImageRun: FakeNode, Document: FakeNode, Header: FakeNode, Footer: FakeNode, PageBreak: FakeNode,
      Packer: { toBlob: async () => new Blob(['docx']) },
      AlignmentType: enumValues, BorderStyle: enumValues, VerticalAlign: enumValues, WidthType: enumValues,
      TabStopType: enumValues, TabStopPosition: enumValues, PageNumber: enumValues,
      UnderlineType: enumValues, HeightRule: enumValues, TableLayoutType: enumValues,
    },
    state: { settings: {} },
  });
}

let sanitizeAssessmentSvg: (source: string, maxBytes: number) => string;
beforeEach(async () => {
  vi.resetModules();
  installDocxRuntime();
  ({ sanitizeAssessmentSvg } = await import('../public/static/js/asesmen-docx.js'));
});

describe('DOCX SVG sanitizer', () => {
  it('accepts every shipped visual template instead of rejecting the export', () => {
    const failures: string[] = [];
    for (const item of getVisualCatalog()) {
      const rendered = generateVisualStimulus({ type: item.id, params: item.sampleParams || {} });
      if (!rendered?.svg) continue;
      try {
        expect(sanitizeAssessmentSvg(rendered.svg, 1_572_864)).toContain('<svg');
      } catch (error) {
        failures.push(`${item.id}: ${(error as Error).message}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('still rejects active content and external references', () => {
    const base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
    expect(() => sanitizeAssessmentSvg(base, 1_572_864)).not.toThrow();
    expect(() => sanitizeAssessmentSvg(base.replace('<rect', '<script/><rect'), 1_572_864)).toThrow();
    expect(() => sanitizeAssessmentSvg(base.replace('width="10"', 'onclick="alert(1)"'), 1_572_864)).toThrow();
    expect(() => sanitizeAssessmentSvg(base.replace('width="10"', 'fill="url(https://evil.test/x.svg)"'), 1_572_864)).toThrow();
  });
});
