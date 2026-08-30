import { describe, it, expect } from 'vitest';
import {
    presentationOutlineSchema,
    presentationGenerateSchema,
    presentationResponseSchema,
    baseSlideSchema,
    validate,
} from '../src/lib/validation';

describe('Presentation Schemas & Normalization Tests', () => {
    it('should validate presentation outline input with default fallbacks', () => {
        const payload = {
            topik: 'Tata Surya dan Planet',
        };
        const result = validate(presentationOutlineSchema, payload);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.mataPelajaran).toBe('IPAS');
            expect(result.data.alokasiWaktu).toBe('2 x 35 menit');
            expect(result.data.slideCount).toBe(8);
        }
    });

    it('should validate presentation generate input with partial data', () => {
        const payload = {
            topik: 'Ekosistem Hutan',
            mataPelajaran: 'IPA',
            slideCount: 6,
        };
        const result = validate(presentationGenerateSchema, payload);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.topik).toBe('Ekosistem Hutan');
            expect(result.data.semester).toBe('1');
        }
    });

    it('should successfully normalize polymorphic slide formats from various AI models', () => {
        const mistralOutput = {
            title: 'Pembelajaran Tata Surya',
            slides: [
                {
                    layout: 'title',
                    title: 'Tata Surya',
                    subtitle: 'Petualangan Angkasa',
                    content: ['Pemantik: Apakah ada kehidupan di Mars?'],
                    speakerNotes: 'Ajak siswa berdiskusi.',
                },
                {
                    layout: 'quiz',
                    title: 'Kuis Coba Tebak Planet',
                    // Mistral-style array of question objects
                    question: [
                        {
                            text: 'Planet terbesar di tata surya?',
                            quizOptions: ['A. Jupiter', 'B. Saturnus', 'C. Bumi', 'D. Mars'],
                            quizAnswer: 'A. Jupiter',
                            quizExplanation: 'Jupiter adalah planet terbesar.',
                        }
                    ],
                    speakerNotes: 'Beri umpan balik.',
                },
                {
                    layout: 'stats',
                    title: 'Fakta Angka',
                    stats: [
                        { value: 8, label: 'Planet Utama' },
                        { value: '1', label: 'Bintang Matahari' }
                    ]
                }
            ]
        };

        const result = validate(presentationResponseSchema, mistralOutput);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.slides.length).toBe(3);
            expect(result.data.slides[1].question).toBe('Planet terbesar di tata surya?');
            expect(result.data.slides[1].quizOptions).toEqual(['A. Jupiter', 'B. Saturnus', 'C. Bumi', 'D. Mars']);
            expect(result.data.slides[1].quizAnswer).toBe('A. Jupiter');
        }
    });
});
