// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { enrichAndNormalizePG, refillMissingPG, uniquePGQuestions } from '../src/routes/kisi';
import { runAssessmentQualityGate } from '../src/lib/assessment-validator';

const question = (n: number) => ({ no: n, soal: `Apa hasil percobaan nomor ${n}?`, opsi: { A: 'Satu', B: 'Dua', C: 'Tiga', D: 'Empat' }, kunci: 'A' });
const normalize = (items: any[]) => enrichAndNormalizePG(items, { mataPelajaran: 'IPAS', topik: 'Percobaan', isGambarEnabled: false, unsplash: null, exactImageCount: 0 });

describe('PG count and duplicate boundaries', () => {
    it('keeps ten distinct questions with a shared introduction longer than 100 characters', async () => {
        const intro = 'Bacalah hasil pengamatan percobaan tentang penguapan air berikut dengan teliti sebelum menjawab pertanyaan berdasarkan data yang disediakan. ';
        const items = Array.from({ length: 10 }, (_, i) => ({ ...question(i + 1), soal: `${intro}Apa kesimpulan untuk percobaan nomor ${i + 1}?` }));
        const result = await normalize(items);
        expect(result).toHaveLength(10);
        expect(result.map(item => item.no)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(uniquePGQuestions([...items, { ...items[0], soal: `  ${items[0].soal.toUpperCase()}  ` }])).toHaveLength(10);
    });

    it('fills only missing slots and quality-checks replacements before adopting them', async () => {
        const data: any = { pg: Array.from({ length: 8 }, (_, i) => question(i + 1)) };
        const generate = vi.fn()
            .mockResolvedValueOnce({ pg: [question(1), question(9), { ...question(10), opsi: { A: '', B: 'Dua', C: 'Tiga', D: 'Empat' } }] })
            .mockResolvedValueOnce({ pg: [question(10), question(11)] });
        const ai = { generateJSON: vi.fn(async () => ({ verifications: [] })) };
        const verify = vi.fn((draft: any) => runAssessmentQualityGate(ai as any, draft, { mataPelajaran: 'IPAS', topik: 'Percobaan', jenjangKelas: '5' }));
        await refillMissingPG(data, { requested: 10, generate, normalize, verify });
        expect(generate.mock.calls.map(call => call[0])).toEqual([2, 1]);
        expect(data.pg).toHaveLength(10);
        expect(new Set(data.pg.map((q: any) => q.soal)).size).toBe(10);
        expect(data.pg.map((q: any) => q.no)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(data.pg.every((q: any) => q.opsi.A && q.opsi.B && q.opsi.C && q.opsi.D)).toBe(true);
        expect(verify).toHaveBeenCalledTimes(2);
    });

    it('bounds retries when the provider keeps returning duplicates', async () => {
        const data = { pg: [question(1)] };
        const generate = vi.fn(async () => ({ pg: [question(1)] }));
        const verify = vi.fn();
        await refillMissingPG(data, { requested: 10, generate, normalize, verify });
        expect(generate).toHaveBeenCalledTimes(2);
        expect(data.pg).toHaveLength(1);
        expect(verify).not.toHaveBeenCalled();
    });

    it('preserves accepted content when a refill fails and respects cancellation', async () => {
        const data = { pg: [question(1)] };
        const verify = vi.fn();
        await refillMissingPG(data, { requested: 10, generate: async () => { throw new Error('fixture unavailable'); }, normalize, verify });
        expect(data.pg).toEqual([question(1)]);
        const controller = new AbortController();
        await expect(refillMissingPG(data, {
            requested: 10, signal: controller.signal, normalize, verify,
            generate: async () => { controller.abort(); return { pg: [question(2)] }; },
        })).rejects.toThrow();
        expect(data.pg).toHaveLength(1);
        expect(verify).not.toHaveBeenCalled();
    });
});
