import { describe, it, expect } from 'vitest';
import {
    presentationOutlineSchema,
    presentationGenerateSchema,
    presentationResponseSchema,
    baseSlideSchema,
    presentationImageSchema,
    validate,
} from '../src/lib/validation';
import { normalizeSlide, slideIssues } from '../public/static/js/slides/lesson-model.js';

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
    it('should validate presentationImageSchema with vultr-ai and data:image base64 sources', () => {
                const vultrImage = {
            source: 'vultr-ai',
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=',
            alt: 'Ilustrasi Sel Tumbuhan',
            query: 'plant cell',
            creditName: 'Vultr Serverless (Z-Image Turbo)',
            creditUrl: 'https://www.vultr.com',
            unsplashId: 'vultr_12345',
        };
        const parsed = presentationImageSchema.safeParse(vultrImage);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.source).toBe('vultr-ai');
            expect(parsed.data.url).toContain('data:image/png;base64,');
        }
    });

    it('should accept imageQuery on imageText layout without failing validation before image attachment', () => {
        const slide = normalizeSlide({
            layout: 'imageText',
            title: 'Anatomi Jantung Manusia',
            subtitle: 'Organ pemompa darah dalam tubuh',
            content: ['Jantung memiliki empat ruang.', 'Darah kaya oksigen dialirkan ke seluruh tubuh.'],
            imageQuery: 'human heart anatomy',
            imagePrompt: '2D clean vector diagram of human heart',
        });
        expect(slide.imageQuery).toBe('human heart anatomy');
        expect(slideIssues(slide)).toEqual([]);
    });

    it('should support deep, thorough pedagogical explanations without artificial word truncation issues', () => {
        const deepSlide = normalizeSlide({
            layout: 'content',
            title: 'Proses Fotosintesis pada Tumbuhan Hijau',
            subtitle: 'Bagaimana klorofil dan sinar matahari mengubah air serta karbon dioksida menjadi energi',
            content: [
                'Klorofil di daun menangkap energi foton dari sinar matahari untuk memecah molekul air menjadi hidrogen dan oksigen yang dilepaskan ke udara bebas.',
                'Karbon dioksida diserap dari atmosfer melalui stomata dan diolah dalam siklus Calvin untuk menghasilkan glukosa sebagai sumber energi utama tumbuhan.',
                'Hasil fotosintesis kemudian diedarkan ke seluruh jaringan floem untuk pertumbuhan daun, batang, pembentukan buah, dan cadangan makanan.',
            ],
            speakerNotes: 'Ajak siswa mengamati daun di luar kelas dan mendiskusikan peran penting stomata.',
        });
        expect(slideIssues(deepSlide)).toEqual([]);
    });
});
