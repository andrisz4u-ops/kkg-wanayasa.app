import { describe, it, expect } from 'vitest';
import { buildAssessmentPrompt } from '../src/routes/kisi';
import { buildRppPrompt, calculateTimeDistribution } from '../src/routes/rpp';
import { AIService, STREAM_INITIAL_TIMEOUT_MS, STREAM_IDLE_TIMEOUT_MS, STREAM_MAX_TOTAL_TIMEOUT_MS } from '../src/services/ai';

describe('AI Streaming Prompt & Pipeline Tests', () => {
    describe('buildAssessmentPrompt', () => {
        it('should build structured prompt for PG questions including BSKAP 046/2025 CP', () => {
            const prompt = buildAssessmentPrompt({
                type: 'pg',
                startNo: 1,
                count: 10,
                mataPelajaran: 'Pendidikan Pancasila',
                topik: 'Gotong Royong di Lingkungan Sekitar',
                jenjangKelas: 'Kelas 5',
                resolvedCP: 'Peserta didik memahami pentingnya gotong royong dalam keberagaman.',
                hotsRatio: '20:30:50',
                isGambarEnabled: true
            });

            expect(prompt).toContain('Pendidikan Pancasila');
            expect(prompt).toContain('Gotong Royong di Lingkungan Sekitar');
            expect(prompt).toContain('Peserta didik memahami pentingnya gotong royong dalam keberagaman.');
            expect(prompt).toContain('"pg": [');
            expect(prompt).toContain('"indikator":');
            expect(prompt).toContain('"level":');
        });

        it('should build structured prompt for Isian & Uraian with cognitive complexity', () => {
            const prompt = buildAssessmentPrompt({
                type: 'isian',
                startNo: 11,
                count: 5,
                totalPrevPG: 10,
                totalIsian: 5,
                totalUraian: 2,
                mataPelajaran: 'Matematika',
                topik: 'Pecahan Senilai',
                jenjangKelas: 'Kelas 4',
                resolvedCP: 'Peserta didik dapat membandingkan pecahan senilai.',
                isianType: 'Standard'
            });

            expect(prompt).toContain('"isian":');
            expect(prompt).toContain('"uraian":');
            expect(prompt).toContain('Pecahan Senilai');
        });
    });

    describe('calculateTimeDistribution & buildRppPrompt', () => {
        it('should calculate accurate time distributions for 2 x 35 minutes', () => {
            const result = calculateTimeDistribution('2 x 35 Menit');
            expect(result.totalMinutes).toBe(70);
            expect(result.breakdown.pendahuluan).toBe(5);
            expect(result.breakdown.mindful).toBe(15);
            expect(result.breakdown.meaningful).toBe(30);
            expect(result.timeDist.pen).toBe('5 Menit');
        });

        it('should build complete RPP Merdeka Deep Learning prompt referencing BSKAP 046/2025', () => {
            const { totalMinutes, timeDist } = calculateTimeDistribution('2 x 35 Menit');
            const prompt = buildRppPrompt(
                {
                    mataPelajaran: 'IPAS',
                    topik: 'Ekosistem Hutan Hujan Tropis',
                    jenjangKelas: 'Kelas 5',
                    semester: 'Ganjil',
                    strategi: 'Problem Based Learning (PBL)',
                    alokasiWaktu: '2 x 35 Menit',
                    namaGuru: 'Budi Santoso',
                    namaSekolah: 'SDN 1 Wanayasa'
                },
                'Menganalisis hubungan antarkomponen biotik dan abiotik dalam ekosistem.',
                timeDist,
                totalMinutes
            );

            expect(prompt).toContain('Ekosistem Hutan Hujan Tropis');
            expect(prompt).toContain('BSKAP No. 046 Tahun 2025');
            expect(prompt).toContain('Mindful');
            expect(prompt).toContain('Meaningful');
            expect(prompt).toContain('Joyful');
            expect(prompt).toContain('"tujuan_pertemuan"');
            expect(prompt).toContain('"pertemuan"');
        });
    });

    describe('AIService Stream and JSON extraction', () => {
        it('should extract valid JSON using parseAIJson helper', () => {
            const ai = new AIService({} as any);
            const rawOutput = '```json\n{"success": true, "message": "Test streaming successful"}\n```';
            const parsed = ai.parseAIJson(rawOutput);

            expect(parsed).toBeDefined();
            expect(parsed.success).toBe(true);
            expect(parsed.message).toBe('Test streaming successful');
        });

        it('should repair JSON trailing commas and unclosed brackets', () => {
            const ai = new AIService({} as any);
            const malformed = '{"title": "Asesmen Soal", "items": [{"id": 1, "text": "Soal 1"},';
            const parsed = ai.parseAIJson(malformed);

            expect(parsed).toBeDefined();
            expect(parsed.title).toBe('Asesmen Soal');
            expect(parsed.items.length).toBe(1);
        });
        it('should strip <think> blocks from reasoning models before parsing JSON', () => {
            const ai = new AIService({} as any);
            const reasoningOutput = '<think>\nAnalisis materi IPAS Kelas 5:\n1. Kita buat soal PG dengan format JSON { "pg": [...] }\n2. Pastikan HOTS.\n</think>\n```json\n{"pg": [{"no": 1, "soal": "Apa itu ekosistem?"}]}\n```';
            const parsed = ai.parseAIJson(reasoningOutput);

            expect(parsed).toBeDefined();
            expect(parsed.pg).toHaveLength(1);
            expect(parsed.pg[0].soal).toBe('Apa itu ekosistem?');
        });

        it('should configure resilient Sliding Idle Timeout parameters', () => {
            expect(STREAM_INITIAL_TIMEOUT_MS).toBe(30000); // 30s initial response fail-fast
            expect(STREAM_IDLE_TIMEOUT_MS).toBe(60000);    // 60s idle sliding per token
            expect(STREAM_MAX_TOTAL_TIMEOUT_MS).toBe(600000); // 10 minutes max ceiling
            expect(STREAM_MAX_TOTAL_TIMEOUT_MS).toBeGreaterThan(STREAM_IDLE_TIMEOUT_MS);
        });
    });
});

