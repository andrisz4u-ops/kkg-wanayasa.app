// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { detectStimulusFromSoalText } from '../src/lib/visuals/detector';
import { renderSegiEnamBeraturanSvg } from '../src/lib/visuals/geometry';

describe('polygon stimulus detection', () => {
  it.each([
    'Perhatikan gambar segienam beraturan berikut! Jika panjang setiap sisi adalah 7 cm, keliling segienam tersebut adalah ... cm.',
    'Perhatikan gambar segi enam beraturan berikut! Jika panjang setiap sisi adalah 7 cm.',
    'Perhatikan gambar segi-enam beraturan berikut! Jika panjang setiap sisi adalah 7 cm.',
    'Perhatikan gambar heksagon berikut! Jika panjang setiap sisi adalah 7 cm.',
  ])('detects a hexagon regardless of spacing: %s', soal => {
    expect(detectStimulusFromSoalText(soal, 'Matematika')).toMatchObject({
      type: 'segi_enam_beraturan',
      params: { sisi: 7, unit: 'cm' },
    });
  });

  it('falls back to the sample side length when the stem has no measurement', () => {
    expect(detectStimulusFromSoalText('Perhatikan gambar segienam beraturan berikut!', 'Matematika'))
      .toMatchObject({ type: 'segi_enam_beraturan', params: { sisi: 8 } });
  });

  it('does not rewrite segitiga or segiempat wording', () => {
    expect(detectStimulusFromSoalText('Perhatikan gambar segitiga sama sisi berikut! Jika panjang salah satu sisinya adalah 10 cm, kelilingnya ...', 'Matematika'))
      .toMatchObject({ type: 'segitiga_sama_sisi', params: { s: 10 } });
    expect(detectStimulusFromSoalText('Sebuah segiempat memiliki sisi 4 cm.', 'Matematika')).toBeNull();
  });

  it('renders the side length supplied by the question, not a template default', () => {
    const stimulus = detectStimulusFromSoalText('Perhatikan gambar segienam beraturan berikut! Jika panjang setiap sisi adalah 7 cm.', 'Matematika');
    expect(stimulus).not.toBeNull();
    const svg = renderSegiEnamBeraturanSvg(stimulus!.params as any);
    expect(svg).toContain('s = 7 cm');
    expect(svg).not.toContain('s = 8 cm');
  });
});
