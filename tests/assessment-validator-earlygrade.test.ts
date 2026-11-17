import { describe, it, expect } from 'vitest';
import { runAssessmentQualityGate, validateQuestionHeuristics, isEarlyGradeAssessment } from '../src/lib/assessment-validator';

describe('Early Grade Assessment Validation (Kelas 1, 2, 3 / Fase A)', () => {
    it('detects early grade classes correctly', () => {
        expect(isEarlyGradeAssessment('Kelas 1')).toBe(true);
        expect(isEarlyGradeAssessment('Kelas 2')).toBe(true);
        expect(isEarlyGradeAssessment('Kelas 3')).toBe(true);
        expect(isEarlyGradeAssessment('Fase A')).toBe(true);
        expect(isEarlyGradeAssessment('Kelas 4')).toBe(false);
        expect(isEarlyGradeAssessment('Kelas 5')).toBe(false);
        expect(isEarlyGradeAssessment('Kelas 6')).toBe(false);
    });

    it('validates 3-option PG questions for Kelas 3 without dropping them', async () => {
        const item = {
            no: 1,
            soal: 'Hewan yang hidup di air adalah...',
            opsi: {
                A: 'Ikan mas',
                B: 'Ayam kampung',
                C: 'Kucing belang'
            },
            kunci: 'A',
            level: 'L1'
        };

        const heuristic = validateQuestionHeuristics(item, 'Kelas 3');
        expect(heuristic.isValid).toBe(true);
        expect(heuristic.healedItem.opsi.A).toBe('Ikan mas');
        expect(heuristic.healedItem.opsi.B).toBe('Ayam kampung');
        expect(heuristic.healedItem.opsi.C).toBe('Kucing belang');
        expect(heuristic.healedItem.opsi.D).toBeUndefined();

        // Test mock AI for Quality Gate
        const mockAi: any = {
            generateJSON: async () => ({
                verifications: [
                    {
                        index: 0,
                        verdict: 'PASS',
                        key_verified: true,
                        kaidah_puspendik: true,
                        hots_valid: true,
                        distraktor_homogen: true,
                        quality_score: 95
                    }
                ],
                summary: { overall_quality_score: 95 }
            })
        };

        const finalData = {
            pg: [item]
        };

        const result = await runAssessmentQualityGate(mockAi, finalData, {
            mataPelajaran: 'IPAS',
            topik: 'Hewan Air',
            jenjangKelas: 'Kelas 3'
        });

        // PG question MUST NOT be dropped!
        expect(result.finalData.pg.length).toBe(1);
        expect(result.finalData.pg[0].no).toBe(1);
        expect(result.finalData.pg[0].audit.status).toBe('verified');
        expect(result.finalData._qualityGateDropped).toBeUndefined();
    });
});
