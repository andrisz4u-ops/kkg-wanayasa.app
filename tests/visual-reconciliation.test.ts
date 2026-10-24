// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { detectStimulusFromSoalText, reconcileStimulusWithSoalText } from '../src/lib/visuals/detector';
import { normalizeAssetUrls } from '../src/lib/assessment-packages';

describe('visual parameter reconciliation', () => {
  it('replaces an AI sample measurement with the number written in the question', () => {
    const aiSpec = { type: 'segitiga_sama_sisi', params: { s: 15, unit: 'cm' } };
    const soal = 'Perhatikan gambar segitiga sama sisi berikut! Jika panjang salah satu sisinya adalah 10 cm, keliling segitiga tersebut adalah ... cm.';
    expect(reconcileStimulusWithSoalText(aiSpec as any, soal, 'Matematika')).toMatchObject({ type: 'segitiga_sama_sisi', params: { s: 10 } });
  });

  it('keeps AI parameters that already agree with the question', () => {
    const aiSpec = { type: 'segitiga_sama_sisi', params: { s: 10, unit: 'cm' } };
    const soal = 'Segitiga sama sisi dengan sisi 10 cm. Kelilingnya ...';
    expect(reconcileStimulusWithSoalText(aiSpec as any, soal, 'Matematika')).toMatchObject({ params: { s: 10 } });
  });

  it('does not force a different diagram type onto the AI choice', () => {
    const aiSpec = { type: 'persegi_panjang', params: { p: 6, l: 6 } };
    const soal = 'Sebuah persegi memiliki sisi 9 cm. Kelilingnya ...';
    expect(reconcileStimulusWithSoalText(aiSpec as any, soal, 'Matematika')).toBe(aiSpec);
  });

  it('leaves detection untouched when no visual exists', () => {
    expect(reconcileStimulusWithSoalText(null, 'Soal biasa tanpa gambar.', 'Matematika')).toBeNull();
    expect(detectStimulusFromSoalText('Soal biasa tanpa gambar.', 'Matematika')).toBeNull();
  });
});

describe('legacy presigned image URLs', () => {
  const presigned = 'https://ewr2.vultrobjects.com/inference-uploads-prod/images/abc.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600&X-Amz-Signature=deadbeef';

  it('marks an expiring presigned URL unavailable instead of serving a dead link', () => {
    const { content, warnings } = normalizeAssetUrls({ pg: [{ no: 8, soal: 'Perhatikan gambar bola berikut!', gambar: { url: presigned, credit: 'Vultr Serverless (z-image-turbo)', type: 'ai' } }] }, 8);
    expect(content.pg[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'expired_or_missing' });
    expect(content.pg[0].gambar).not.toHaveProperty('url');
    expect(warnings.join(' ')).toContain('Butir 8');
  });

  it('keeps owned asset URLs untouched', () => {
    const assetId = '123e4567-e89b-42d3-a456-426614174001';
    const { content } = normalizeAssetUrls({ pg: [{ no: 1, gambar: { assetId, url: presigned, mime: 'image/png' } }] }, 42);
    expect(content.pg[0].gambar.url).toBe(`/api/banksoal/42/assets/${assetId}`);
    expect(content.pg[0].gambar.imageUnavailable).toBeUndefined();
  });

  it('never serves an unowned external photo link', () => {
    const { content } = normalizeAssetUrls({ pg: [{ no: 2, gambar: { url: 'https://upload.wikimedia.org/a.png', credit: 'Wikimedia' } }] }, 7);
    expect(content.pg[0].gambar.imageUnavailable).toBe(true);
    expect(content.pg[0].gambar.url).toBeUndefined();
  });
});
