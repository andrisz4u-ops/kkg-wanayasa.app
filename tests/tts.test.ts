import { describe, it, expect, vi } from 'vitest';
import app from '../src/index';

const mockEnv = {
    DB: {
        prepare: vi.fn(() => ({
            bind: vi.fn(() => ({
                all: vi.fn(async () => ({ results: [] })),
                first: vi.fn(async () => null),
                run: vi.fn(async () => ({ success: true }))
            })),
            all: vi.fn(async () => ({ results: [] })),
            first: vi.fn(async () => null),
            run: vi.fn(async () => ({ success: true }))
        }))
    },
    SENTRY_DSN: ''
};

describe('TTS (Teka-Teki Silang) Route Tests', () => {
    it('should reject generation when topik is missing', async () => {
        const res = await app.request('/api/tts/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mataPelajaran: 'IPAS',
                topik: ''
            })
        }, mockEnv as any);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error?.message).toContain('Topik / materi teka-teki silang wajib diisi');
    });

    it('should assemble a custom crossword grid from manual words', async () => {
        const customWords = [
            { word: 'FOTOSINTESIS', clue: 'Proses memasak makanan pada tumbuhan' },
            { word: 'KLOROFIL', clue: 'Zat hijau daun' },
            { word: 'OKSIGEN', clue: 'Gas yang dihasilkan fotosintesis' },
            { word: 'MATAHARI', clue: 'Sumber energi utama bumi' }
        ];

        const res = await app.request('/api/tts/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mataPelajaran: 'IPAS',
                jenjangKelas: 'Kelas 5',
                topik: 'Fotosintesis Tumbuhan',
                words: customWords
            })
        }, mockEnv as any);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.data?.topik).toBe('Fotosintesis Tumbuhan');
        expect(json.data?.words.length).toBe(4);
        expect(json.data?.crossword).toBeDefined();
        expect(json.data?.crossword.success).toBe(true);
        expect(json.data?.crossword.placements.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject custom crossword with less than 3 words', async () => {
        const res = await app.request('/api/tts/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topik: 'Tes',
                words: [{ word: 'AIR', clue: 'Benda cair' }]
            })
        }, mockEnv as any);

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.success).toBe(false);
    });
});
