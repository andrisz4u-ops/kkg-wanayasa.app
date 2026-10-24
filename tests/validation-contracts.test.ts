import { describe, expect, it } from 'vitest';
import { presentationPatchSlideSchema, updateSettingsSchema } from '../src/lib/validation';

describe('request schema compatibility', () => {
  it('retains supported gugus while rejecting unexpected settings', () => {
    expect(updateSettingsSchema.parse({ nama_kkg: 'KKG Uji', gugus: '3' })).toMatchObject({ gugus: '3' });
    expect(updateSettingsSchema.safeParse({ gugus: '3', unexpected: true }).success).toBe(false);
  });

  it.each([
    { type: 'fraction', numerator: 1, denominator: 2, label: 'Setengah', min: null, max: null },
    { type: 'numberLine', min: 0, max: 10, value: 3 },
    { type: 'cycle', nodes: [{ label: 'Air' }, { label: 'Uap' }] },
  ])('preserves the editor diagram when patching a $type slide', visual => {
    const parsed = presentationPatchSlideSchema.parse({ currentSlide: { title: 'Materi', layout: 'imageText', visual }, instruction: 'Ringkas judul' });
    expect(parsed.currentSlide.visual).toMatchObject({ type: visual.type });
  });

  it('rejects an invalid visual instead of silently deleting the diagram', () => {
    expect(presentationPatchSlideSchema.safeParse({ currentSlide: { visual: { type: 'fraction', numerator: 4, denominator: 2 } }, instruction: 'Ringkas judul' }).success).toBe(false);
  });
});
