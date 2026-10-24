import { beforeEach, describe, expect, it, vi } from 'vitest';

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

let selectOptionColumns: typeof import('../public/static/js/asesmen-docx.js').selectOptionColumns;
let assessmentImageDisplaySize: typeof import('../public/static/js/asesmen-docx.js').assessmentImageDisplaySize;
beforeEach(async () => {
  vi.resetModules();
  installDocxRuntime();
  ({ selectOptionColumns, assessmentImageDisplaySize } = await import('../public/static/js/asesmen-docx.js'));
});

const CM_TO_PX = 96 / 2.54;

describe('DOCX multiple-choice column layout', () => {
  it('keeps short options in four columns regardless of question imagery', () => {
    expect(selectOptionColumns({ A: '36 cm', B: '40 cm', C: '48 cm', D: '96 cm' })).toBe(4);
    expect(selectOptionColumns({ A: 'A', B: 'B', C: 'C', D: 'D' })).toBe(4);
  });

  it('drops to two columns and then one for longer options', () => {
    expect(selectOptionColumns({ A: '2/3, 3/4, 5/8', B: '5/8, 2/3, 3/4', C: '3/4, 5/8, 2/3', D: '5/8, 3/4, 2/3' })).toBe(2);
    expect(selectOptionColumns({
      A: 'sebuah pernyataan yang sangat panjang sekali',
      B: 'pilihan lainnya juga sangat panjang',
      C: 'opsi ketiga yang tidak singkat',
      D: 'opsi keempat yang panjang juga',
    })).toBe(1);
  });
});

describe('DOCX assessment image sizing', () => {
  it('preserves aspect ratio and caps display size at 7cm by 5cm', () => {
    const wide = assessmentImageDisplaySize({ width: 480, height: 340 });
    expect(wide.width).toBeCloseTo(7 * CM_TO_PX, 0);
    expect(wide.height).toBeCloseTo((7 * CM_TO_PX) * (340 / 480), 0);

    const tall = assessmentImageDisplaySize({ width: 300, height: 600 });
    expect(tall.height).toBeCloseTo(5 * CM_TO_PX, 0);
    expect(tall.width).toBeCloseTo((5 * CM_TO_PX) * (300 / 600), 0);

    const thin = assessmentImageDisplaySize({ width: 1000, height: 100 });
    expect(thin.width).toBeCloseTo(7 * CM_TO_PX, 0);
    expect(thin.height).toBeCloseTo((7 * CM_TO_PX) * (100 / 1000), 0);
  });

  it('falls back to the legacy size when dimensions are unknown', () => {
    expect(assessmentImageDisplaySize({})).toEqual({ width: 220, height: 145 });
    expect(assessmentImageDisplaySize({ width: 0, height: 100 })).toEqual({ width: 220, height: 145 });
  });
});
