import { describe, expect, it, vi } from 'vitest';
import {
    applyVerificationRepairs,
    buildAuditPrompt,
    runAssessmentQualityGate,
    validateQuestionHeuristics
} from '../src/lib/assessment-validator';
import { generateVisualStimulus } from '../src/lib/visual-engine';

const context = { mataPelajaran: 'Matematika', topik: 'Bangun datar', jenjangKelas: 'Kelas 5' };
const verified = {
    index: 0, verdict: 'PASS', quality_score: 96,
    key_verified: true, kaidah_puspendik: true, hots_valid: true, distraktor_homogen: true
};
const question = () => ({
    no: 1,
    soal: 'Perhatikan gambar berikut! Bagian X yang ditunjuk tanda panah pada komputer berfungsi sebagai ...',
    opsi: { A: 'Pemroses data', B: 'Penampil gambar', C: 'Penyimpan data', D: 'Papan ketik' },
    kunci: 'A'
});
const diagramQuestion = () => {
    const spec = { type: 'persegi_panjang', params: { p: 15, l: 10, unit: 'cm' } };
    const rendered = generateVisualStimulus(spec)!;
    return {
        ...question(),
        soal: 'Perhatikan gambar berikut! Persegi panjang memiliki panjang 15 cm dan lebar 10 cm. Kelilingnya adalah ...',
        opsi: { A: '50 cm', B: '40 cm', C: '30 cm', D: '20 cm' },
        visual_stimulus: spec,
        gambar: { type: 'svg', url: rendered.dataUri, svg: rendered.svg, title: rendered.title, credit: rendered.credit }
    };
};

describe('assessment audit image lifecycle contracts', () => {
    it('preserves provider AI raster figures with arrow and label wording', () => {
        const item = {
            ...question(),
            gambar: { type: 'ai', url: 'https://provider.invalid/intentional-fallback.png', credit: 'Vultr z-image-turbo' }
        };
        const result = validateQuestionHeuristics(item, context.jenjangKelas);
        expect(result.issues).toEqual([]);
        expect(result.healedItem.gambar).toEqual(item.gambar);
        expect(result.healedItem.soal).toBe(item.soal);
    });

    it('preserves an intentional AI fallback beside an identical SVG specification through audit', async () => {
        const spec = { type: 'perangkat_komputer', params: { pointer: 'cpu', label: 'X' } };
        const svg = generateVisualStimulus(spec)!;
        const items = [
            { ...question(), visual_stimulus: spec, gambar: { type: 'svg', url: svg.dataUri, svg: svg.svg } },
            { ...question(), no: 2, visual_stimulus: spec,
                gambar: { type: 'ai', url: 'https://provider.invalid/intentional-fallback.png', credit: 'Vultr z-image-turbo' } }
        ];
        const ai = { generateJSON: vi.fn().mockResolvedValue({ verifications: [verified, { ...verified, index: 1 }] }) };
        const result = await runAssessmentQualityGate(ai as any, { pg: items }, context);
        expect(result.finalData.pg.map((item: any) => item.gambar)).toEqual(items.map(item => item.gambar));
        expect(result.finalData.pg.every((item: any) => item.audit.status === 'verified')).toBe(true);
        expect(result.summary.repaired_count).toBe(0);
        expect(result.summary.passed_count).toBe(2);
    });

    it('still rejects actual blocklisted stock evidence when mislabeled as AI', () => {
        const item = { ...question(), gambar: { type: 'ai', url: 'https://images.unsplash.com/photo-1532094349884', credit: 'Andrey Sizov' } };
        const result = validateQuestionHeuristics(item, context.jenjangKelas);
        expect(result.issues.some(issue => issue.type === 'MISMATCHED_IMAGE')).toBe(true);
        expect(result.healedItem.gambar.type).toBe('svg');
        expect(result.healedItem.visual_stimulus.type).toBe('perangkat_komputer');
    });

    it.each([
        { p: 12, l: 8 },
        { p: 10, l: 15 }
    ])('redraws the exact SVG and specification when repaired geometry becomes $p by $l', ({ p, l }) => {
        const item = diagramQuestion();
        const repairedSoal = `Perhatikan gambar berikut! Persegi panjang memiliki panjang ${p} cm dan lebar ${l} cm. Kelilingnya adalah ...`;
        const result = applyVerificationRepairs([item], [{ ...verified, verdict: 'REPAIR', repaired_soal: repairedSoal }], context.jenjangKelas);
        const healed = result.healedItems[0];
        const expectedSpec = { type: 'persegi_panjang', params: { p, l, unit: 'cm' } };
        const expectedSvg = generateVisualStimulus(expectedSpec)!;
        expect(healed.visual_stimulus).toEqual(expectedSpec);
        expect(healed.gambar.svg).toBe(expectedSvg.svg);
        expect(healed.gambar.url).toBe(expectedSvg.dataUri);
        expect(healed.gambar.svg).not.toBe(item.gambar.svg);
        expect(healed.audit.status).toBe('repaired');
        expect(healed.audit.repaired_fields).toEqual(expect.arrayContaining(['soal', 'gambar', 'visual_stimulus']));
        expect(result.repairedCount).toBe(1);
        expect(item.visual_stimulus.params).toEqual({ p: 15, l: 10, unit: 'cm' });
    });

    it('flags a repaired stem that changes to an unrelated renderer instead of retaining the wrong SVG', () => {
        const item = diagramQuestion();
        const repairedSoal = 'Perhatikan gambar berikut! Bagian komputer yang ditunjuk tanda panah berfungsi sebagai ...';
        const healed = applyVerificationRepairs([item], [{ ...verified, verdict: 'REPAIR', repaired_soal: repairedSoal }], context.jenjangKelas).healedItems[0];
        expect(healed.soal).toBe(repairedSoal);
        expect(healed.visual_stimulus).toBeUndefined();
        expect(healed.gambar.svg).toBeUndefined();
        expect(healed.gambar.url).toBeUndefined();
        expect(healed.gambar.imageUnavailable).toBe(true);
        expect(healed.audit.status).toBe('flagged');
        expect(healed.audit.quality_score).toBe(0);
        expect(healed.audit.key_verified).toBe(false);
    });

    it('honors heuristic deletions when a verifier replaces the figure with a self-contained table', () => {
        const item = {
            ...diagramQuestion(), gambar_keyword: 'persegi panjang', gambar_prompt_en: 'Draw a rectangle',
            svg: '<svg>obsolete figure</svg>', imageRequired: true, visual_required: true, imageUnavailable: true
        };
        const repairedSoal = 'Perhatikan tabel berikut!\n| Hari | Buku |\n| --- | --- |\n| Senin | 15 |\n| Selasa | 10 |\nHari dengan jumlah buku terbanyak adalah ...';
        const healed = applyVerificationRepairs([item], [{ ...verified, verdict: 'REPAIR', repaired_soal: repairedSoal }], context.jenjangKelas).healedItems[0];
        expect(healed.soal).toBe(repairedSoal);
        for (const field of ['gambar', 'visual_stimulus', 'gambar_keyword', 'gambar_prompt_en', 'svg', 'imageUnavailable', 'visual_required']) {
            expect(healed).not.toHaveProperty(field);
            expect(healed.audit.repaired_fields).toContain(field);
        }
        expect(healed.imageRequired).not.toBe(true);
        expect(healed.audit.status).toBe('repaired');
        expect(item.gambar.svg).toBeTruthy();
        expect(item.visual_stimulus).toBeDefined();
    });

    it.each([
        { gambar: { imageUnavailable: true, imageUnavailableReason: 'required_image_missing' } },
        { imageUnavailable: true },
        { gambar: { desc: 'CPU dengan label X' } },
        { gambar: { type: 'ai', url: '   ' } },
        { visual_stimulus: { type: 'none' } },
        { visual_stimulus: { type: 'unknown_renderer' } },
        { visual_stimulus: { type: 'persegi_panjang', params: 'invalid' } },
        { gambar: { imageUnavailable: true, url: 'https://provider.invalid/stale.png' },
            visual_stimulus: { type: 'perangkat_komputer', params: {} } }
    ])('flags missing required figures without hiding the reference: %j', missing => {
        const item = { ...question(), ...missing };
        const validation = validateQuestionHeuristics(item, context.jenjangKelas);
        expect(validation.isValid).toBe(false);
        expect(validation.issues.some(issue => issue.type === 'ORPHAN_STIMULUS' && !issue.autoFixable)).toBe(true);
        expect(validation.healedItem.soal).toBe(item.soal);
        const { healedItems, repairedCount } = applyVerificationRepairs([item], [verified], context.jenjangKelas);
        expect(healedItems[0].soal).toBe(item.soal);
        expect(healedItems[0].audit.status).toBe('flagged');
        expect(healedItems[0].audit.quality_score).toBe(0);
        expect(healedItems[0].audit.key_verified).toBe(false);
        expect(repairedCount).toBe(0);
    });

    it('flags known unavailable images even without an introductory figure reference', () => {
        const item = { ...question(), soal: 'Komponen ini berfungsi sebagai ...', gambar: { imageUnavailable: true, imageUnavailableReason: 'image_generation_disabled' } };
        const healed = applyVerificationRepairs([item], [verified], context.jenjangKelas).healedItems[0];
        expect(healed.audit.status).toBe('flagged');
        expect(healed.soal).toBe(item.soal);
    });

    it('accepts a usable renderer specification when no rendered image has been attached yet', () => {
        const item = { ...question(), visual_stimulus: { type: 'perangkat_komputer', params: { pointer: 'cpu', label: 'X' } } };
        expect(validateQuestionHeuristics(item, context.jenjangKelas).issues).toEqual([]);
        expect(applyVerificationRepairs([item], [verified], context.jenjangKelas).healedItems[0].audit.status).toBe('verified');
    });

    it('reports unavailable markers and keyword-only requests truthfully to the verifier', () => {
        const prompt = buildAuditPrompt([
            { ...question(), gambar: { imageUnavailable: true, desc: 'CPU dengan label X' }, gambar_keyword: 'komputer' },
            { ...question(), no: 2, gambar_keyword: 'komputer' }
        ], context);
        const payload = JSON.parse(prompt.match(/DAFTAR BUTIR SOAL YANG DIAUDIT:\n([\s\S]*?)\n\nINSTRUKSI OUTPUT:/)![1]);
        expect(payload.every((item: any) => item.stimulus_visual_available === false)).toBe(true);
        expect(payload.every((item: any) => /tidak tersedia/i.test(item.stimulus_visual))).toBe(true);
        expect(prompt).not.toContain('Anggaplah gambar stimulus');
        expect(prompt).not.toContain('DILARANG KERAS menolak soal');
    });

    it('treats identical stem, options and key repairs as no-ops even with a REPAIR verdict', () => {
        const item = { ...question(), soal: 'Komponen utama pemroses data komputer adalah ...' };
        const { healedItems, repairedCount } = applyVerificationRepairs([item], [{
            ...verified, verdict: 'REPAIR', repaired_soal: ` ${item.soal} `,
            repaired_opsi: { D: item.opsi.D, B: item.opsi.B, A: item.opsi.A, C: item.opsi.C }, corrected_kunci: item.kunci
        }], context.jenjangKelas);
        expect(repairedCount).toBe(0);
        expect(healedItems[0].audit.status).toBe('verified');
        expect(healedItems[0].audit.repaired_fields).toBeUndefined();
    });

    it('counts an item changed by both heuristic cleanup and verifier repair only once', async () => {
        const item = { ...question(), soal: 'Komponen pemroses data komputer adalah ...', kunci: 'A. Pemroses data' };
        const ai = { generateJSON: vi.fn().mockResolvedValue({ verifications: [{ ...verified, verdict: 'REPAIR', repaired_soal: 'Perangkat utama untuk memproses data pada komputer adalah ...' }] }) };
        const result = await runAssessmentQualityGate(ai as any, { pg: [item] }, context);
        expect(result.summary.repaired_count).toBe(1);
        expect(result.finalData.pg[0].audit.status).toBe('repaired');
        expect(result.finalData.pg[0].audit.repaired_fields).toEqual(expect.arrayContaining(['soal', 'kunci']));
    });

    it('does not count a missing figure as a repair or accept a passing verifier row for it', async () => {
        const item = { ...question(), imageRequired: true, gambar: { imageUnavailable: true, imageUnavailableReason: 'duplicate_visual_rejected' } };
        const ai = { generateJSON: vi.fn().mockResolvedValue({ verifications: [verified] }) };
        const result = await runAssessmentQualityGate(ai as any, { pg: [item] }, context);
        expect(result.finalData.pg[0].soal).toBe(item.soal);
        expect(result.finalData.pg[0].audit.status).toBe('flagged');
        expect(result.summary).toMatchObject({ repaired_count: 0, passed_count: 0, flagged_count: 1, overall_quality_score: 0 });
    });
});
