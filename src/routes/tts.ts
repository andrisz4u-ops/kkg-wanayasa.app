import { Hono } from 'hono';
import { AIService } from '../services/ai';
import { generateCrossword } from '../lib/crossword';
import { successResponse, Errors } from '../lib/response';
import { recordAIGeneration } from '../lib/telemetry';
import type { AppBindings, AppVariables } from '../types/env';

const ttsRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

/**
 * AI Crossword Generator
 * POST /api/tts/generate
 */
ttsRoutes.post('/generate', async (c) => {
    try {
        const body = await c.req.json();
        const {
            mataPelajaran = 'Umum',
            topik = '',
            jenjangKelas = 'Kelas 5',
            wordCount = 8,
            aiProvider,
            instructions = ''
        } = body;

        if (!topik || !topik.trim()) {
            return Errors.badRequest(c, 'Topik / materi teka-teki silang wajib diisi.');
        }

        const count = Math.min(15, Math.max(5, parseInt(String(wordCount)) || 8));

        const prompt = `
            Bertindaklah sebagai Guru Ahli dan Pembuat Game Edukasi Kurikulum Merdeka.
            Buatkan daftar TEPAT ${count} kata kunci dan pertanyaan petunjuk Teka-Teki Silang (TTS) untuk:
            - Mata Pelajaran: ${mataPelajaran}
            - Jenjang Kelas: ${jenjangKelas}
            - Topik / Materi: ${topik}
            ${instructions ? `- Instruksi Tambahan: ${instructions}` : ''}

            ATURAN SANGAT PENTING:
            1. Setiap "word" HARUS berupa SATU KATA TUNGGAL dalam Bahasa Indonesia (HANYA huruf A-Z, TANPA spasi, TANPA tanda hubung atau angka).
            2. Panjang setiap kata antara 3 sampai 12 huruf.
            3. Pastikan kata-kata memiliki variasi huruf vokal dan konsonan agar mudah saling bersilangan (interlocking).
            4. Setiap "clue" adalah kalimat pertanyaan/definisi/petunjuk yang mendidik, jelas, dan sesuai tingkat pemahaman ${jenjangKelas}.
            5. Buat kata-kata yang saling terkait erat dengan materi topik "${topik}".

            OUTPUT WAJIB FORMAT JSON:
            {
                "words": [
                    { "word": "FOTOSINTESIS", "clue": "Proses pembuatan makanan pada tumbuhan hijau dengan bantuan cahaya matahari" },
                    { "word": "KLOROFIL", "clue": "Zat hijau daun yang berfungsi menyerap energi cahaya" }
                ]
            }
        `;

        const ai = new AIService(c.env);
        await ai.loadProviders(c.env.DB);

        const slugMap: Record<string, string> = {
            vertex: 'vertex-proxy',
            gemini: 'gemini-flash',
            bedrock: 'bedrock-claude',
            mistral: 'mistral-large',
        };
        const preferredSlug = aiProvider ? (slugMap[aiProvider] || aiProvider) : undefined;

        const parsedData = await ai.generateJSON(prompt, preferredSlug);

        const rawWords = Array.isArray(parsedData?.words) ? parsedData.words : [];
        if (rawWords.length === 0) {
            return Errors.internal(c, 'AI tidak menghasilkan daftar kata yang valid.');
        }

        // Clean and normalize words (A-Z only, uppercase)
        const cleanedWords = rawWords
            .map((item: any) => ({
                word: String(item.word || '').toUpperCase().replace(/[^A-Z]/g, ''),
                clue: String(item.clue || '').trim()
            }))
            .filter((item: any) => item.word.length >= 3 && item.clue.length > 0);

        if (cleanedWords.length < 3) {
            return Errors.internal(c, 'Kata kunci yang valid dari AI kurang dari batas minimal (3 kata).');
        }

        // Generate Crossword Grid
        const wordStrings = cleanedWords.map(w => w.word);
        const crossword = generateCrossword(wordStrings, 1);

        // Record telemetry (silent)
        try {
            const user = c.get('user');
            await recordAIGeneration(c.env.DB, 'tts', user);
        } catch (_) {}

        return successResponse(c, {
            mataPelajaran,
            topik,
            jenjangKelas,
            words: cleanedWords,
            crossword,
            _meta: parsedData?._ai_meta || {
                wordCount: cleanedWords.length
            }
        });
    } catch (err: any) {
        console.error('TTS Generation error:', err);
        return Errors.internal(c, err.message || 'Terjadi kesalahan saat membuat Teka-Teki Silang.');
    }
});

/**
 * Custom / Manual Crossword Grid Assembler
 * POST /api/tts/custom
 */
ttsRoutes.post('/custom', async (c) => {
    try {
        const body = await c.req.json();
        const {
            mataPelajaran = 'Umum',
            topik = 'Teka-Teki Silang Kustom',
            jenjangKelas = 'Semua Jenjang',
            words = []
        } = body;

        if (!Array.isArray(words) || words.length < 3) {
            return Errors.badRequest(c, 'Minimal masukkan 3 pasang kata dan petunjuk.');
        }

        const cleanedWords = words
            .map((item: any) => ({
                word: String(item.word || '').toUpperCase().replace(/[^A-Z]/g, ''),
                clue: String(item.clue || '').trim()
            }))
            .filter((item: any) => item.word.length >= 3 && item.clue.length > 0);

        if (cleanedWords.length < 3) {
            return Errors.badRequest(c, 'Setiap kata harus memiliki minimal 3 huruf (A-Z) dan petunjuk tidak boleh kosong.');
        }

        const wordStrings = cleanedWords.map(w => w.word);
        const crossword = generateCrossword(wordStrings, 1);

        return successResponse(c, {
            mataPelajaran,
            topik,
            jenjangKelas,
            words: cleanedWords,
            crossword
        });
    } catch (err: any) {
        console.error('Custom TTS error:', err);
        return Errors.internal(c, err.message || 'Gagal merakit kotak teka-teki silang.');
    }
});

export default ttsRoutes;
