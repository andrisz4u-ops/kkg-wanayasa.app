import { describe, expect, it, vi } from 'vitest';
import { buildStimulusSignature, enrichAndNormalizePG, resolveQuestionVisualStimulus } from '../src/routes/kisi';
import { runAssessmentQualityGate } from '../src/lib/assessment-validator';
import { normalizeAssessmentImages } from '../src/lib/assessment-image-durability';
import { normalizeAssetUrls, preparePackageContent } from '../src/lib/assessment-packages';
import { generateVisualStimulus, getVisualCatalog } from '../src/lib/visual-engine';
import { sanitizeAssessmentSvg } from '../src/lib/assessment-package-svg';

const evaporationQuestion = () => ({
  no: 1,
  soal: 'Air laut, air sungai, dan air danau mengalami pemanasan oleh sinar matahari sehingga berubah menjadi uap air yang naik ke atmosfer. Peristiwa dalam siklus air tersebut disebut ....',
  opsi: { A: 'presipitasi', B: 'evaporasi', C: 'kondensasi', D: 'infiltrasi' },
  kunci: 'B', level: 'L1',
});

describe('assessment image lifecycle contracts', () => {
  it('distinguishes circuit switch states without depending on parameter insertion order', () => {
    const closed = { type: 'rangkaian_listrik', params: { s1: true, s2: false, label: 'X' } };
    const reordered = { type: 'rangkaian_listrik', params: { label: 'X', s2: false, s1: true } };
    const opened = { type: 'rangkaian_listrik', params: { s1: false, s2: false, label: 'X' } };
    expect(buildStimulusSignature(closed)).toBe(buildStimulusSignature(reordered));
    expect(buildStimulusSignature(closed)).not.toBe(buildStimulusSignature(opened));
  });
  it('retains the detected water-cycle specification through audit, durability, save and reload', async () => {
    const question: any = evaporationQuestion();
    await resolveQuestionVisualStimulus(question, 'IPAS', 'Siklus air', null, new Set(), new Set(), new Set());
    expect(question.visual_stimulus).toMatchObject({ type: 'siklus_air', params: { pointer: 'evaporasi', label: 'X' } });
    const originalSvg = sanitizeAssessmentSvg(question.gambar.svg);
    const ai = { generateJSON: vi.fn(async () => ({ verifications: [{
      index: 0, no: 1, verdict: 'PASS', quality_score: 95,
      key_verified: true, kaidah_puspendik: true, hots_valid: true, distraktor_homogen: true,
    }] })) };
    const data: any = { pg: [question] };
    await runAssessmentQualityGate(ai as any, data, { mataPelajaran: 'IPAS', topik: 'Siklus air', jenjangKelas: 'Kelas 5' });
    const durable = await normalizeAssessmentImages({} as D1Database, 1, data);
    expect(durable.warnings).toEqual([]);
    expect(sanitizeAssessmentSvg(durable.content.pg[0].gambar.svg)).toBe(originalSvg);
    const prepared = preparePackageContent(durable.content);
    const reloaded = normalizeAssetUrls(JSON.parse(prepared.json), 217);
    expect(reloaded.warnings).toEqual([]);
    expect(reloaded.content.pg[0].gambar.svg).toBe(originalSvg);
    expect(reloaded.content.pg[0].gambar.imageUnavailable).toBeUndefined();
  });

  it('persists the reconciled parameters, not stale AI parameters that would redraw the wrong figure', async () => {
    const question: any = {
      no: 2, soal: 'Perhatikan gambar persegi panjang dengan panjang 12 cm dan lebar 8 cm. Kelilingnya adalah ...',
      visual_stimulus: { type: 'persegi_panjang', params: { p: 15, l: 10 } },
    };
    await resolveQuestionVisualStimulus(question, 'Matematika', 'Keliling bangun datar', null);
    const renderedSvg = sanitizeAssessmentSvg(question.gambar.svg);
    expect(question.visual_stimulus.params).toMatchObject({ p: 12, l: 8 });
    const durable = await normalizeAssessmentImages({} as D1Database, 1, { pg: [question] });
    expect(durable.warnings).toEqual([]);
    expect(sanitizeAssessmentSvg(durable.content.pg[0].gambar.svg)).toBe(renderedSvg);
    expect(preparePackageContent(durable.content).content.pg[0].gambar.svg).toBe(renderedSvg);
  });

  it('clears stale unavailable state when a structured diagram is rebuilt successfully', async () => {
    const question: any = { ...evaporationQuestion(), imageUnavailable: true,
      gambar: { imageUnavailable: true, imageUnavailableReason: 'untrusted_svg' } };
    await resolveQuestionVisualStimulus(question, 'IPAS', 'Siklus air', null);
    expect(question.imageUnavailable).toBeUndefined();
    expect(question.gambar.imageUnavailable).toBeUndefined();
    expect(question.visual_stimulus).toMatchObject({ type: 'siklus_air' });
    const result = await normalizeAssessmentImages({} as D1Database, 1, { pg: [question] });
    expect(result.warnings).toEqual([]);
  });

  it('does not turn an intentionally disabled optional diagram into a broken image or regenerate it later', async () => {
    const questions = [
      { no: 1, soal: 'Berapa hasil 2 + 3?', visual_stimulus: { type: 'none', params: {} } },
      { no: 2, soal: 'Sebuah lingkaran berjari-jari 14 cm. Hitung kelilingnya.',
        visual_stimulus: { type: 'lingkaran', params: { r: 14 } } },
    ];
    const pg = await enrichAndNormalizePG(questions, { mataPelajaran: 'Matematika', topik: 'Hitungan',
      isGambarEnabled: false, unsplash: null, exactImageCount: 0 });
    const normalized = await normalizeAssessmentImages({} as D1Database, 1, { pg });
    expect(normalized.warnings).toEqual([]);
    for (const question of normalized.content.pg) {
      expect(question.gambar).toBeUndefined();
      expect(question.visual_stimulus).toBeUndefined();
    }
  });

  it('does not recreate an unselected optional diagram during persistence', async () => {
    const pg = await enrichAndNormalizePG([
      { no: 1, soal: 'Perhatikan gambar lingkaran berikut! Luasnya adalah ...',
        visual_stimulus: { type: 'lingkaran', params: { r: 14 } } },
      { no: 2, soal: 'Sebuah balok memiliki panjang 12 cm, lebar 8 cm dan tinggi 6 cm. Hitung volumenya.',
        visual_stimulus: { type: 'balok', params: { p: 12, l: 8, t: 6 } } },
    ], { mataPelajaran: 'Matematika', topik: 'Geometri', isGambarEnabled: true, unsplash: null, exactImageCount: 1 });
    const normalized = await normalizeAssessmentImages({} as D1Database, 1, { pg });
    expect(normalized.content.pg[0].gambar?.type).toBe('svg');
    expect(normalized.content.pg[1].gambar).toBeUndefined();
    expect(normalized.content.pg[1].visual_stimulus).toBeUndefined();
    expect(normalized.warnings).toEqual([]);
  });

  it('retains a genuine required-image failure rather than hiding it when generation is disabled', async () => {
    const pg = await enrichAndNormalizePG([{ no: 1, soal: 'Perhatikan gambar berikut! Tentukan bagian X.',
      imageRequired: true, visual_stimulus: { type: 'balok', params: {} } }], {
      mataPelajaran: 'IPAS', topik: 'Organ', isGambarEnabled: false, unsplash: null, exactImageCount: 0,
    });
    const normalized = await normalizeAssessmentImages({} as D1Database, 1, { pg });
    expect(normalized.content.pg[0].visual_stimulus).toBeUndefined();
    expect(normalized.content.pg[0].gambar).toMatchObject({ imageUnavailable: true, imageUnavailableReason: 'image_generation_disabled' });
    expect(normalized.warnings).toEqual([{ questionNo: 1, reason: 'image_generation_disabled' }]);
  });

  it('keeps all catalog renderers usable after repeated durable normalization and package reload', async () => {
    const failures: string[] = [];
    for (const item of getVisualCatalog()) {
      for (const params of [item.sampleParams, {}]) {
        try {
          const spec = { type: item.id, params };
          const rendered = generateVisualStimulus(spec);
          expect(rendered?.svg).toBeTruthy();
          const input = { pg: [{ no: 1, soal: 'Stimulus diagram.', visual_stimulus: spec,
            gambar: { type: 'svg', svg: rendered!.svg, url: rendered!.dataUri } }] };
          const first = await normalizeAssessmentImages({} as D1Database, 1, input);
          const second = await normalizeAssessmentImages({} as D1Database, 1, first.content);
          expect(first.warnings).toEqual([]);
          expect(second.warnings).toEqual([]);
          const prepared = preparePackageContent(second.content);
          const reloaded = normalizeAssetUrls(JSON.parse(prepared.json), 1);
          expect(reloaded.warnings).toEqual([]);
          expect(reloaded.content.pg[0].gambar.svg).toBe(sanitizeAssessmentSvg(second.content.pg[0].gambar.svg));
        } catch (error) {
          failures.push(`${item.id} (${Object.keys(params).length ? 'sample' : 'empty'}): ${(error as Error).message}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
