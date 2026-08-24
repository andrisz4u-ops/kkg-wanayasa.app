import { Hono } from 'hono';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import {
    presentationOutlineSchema,
    presentationOutlineResponseSchema,
    presentationGenerateSchema,
    presentationResponseSchema,
    presentationPatchSlideSchema,
    baseSlideSchema,
    type PresentationSlide,
    validate,
} from '../lib/validation';
import { UnsplashService } from '../services/unsplash';

type Bindings = {
    DB: D1Database;
    MISTRAL_API_KEY?: string;
    Z_AI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    BEDROCK_API_KEY?: string;
    BEDROCK_REGION?: string;
    VERTEX_API_KEY?: string;
    UNSPLASH_ACCESS_KEY?: string;
};

const presentation = new Hono<{ Bindings: Bindings }>();

const COT_PATTERN = /(chain\s*of\s*thought|let'?s\s+think|step\s*by\s*step|reasoning|analisis\s+internal|internal\s+analysis)/i;

function sanitizeSpeakerNotes(notes?: string | null): string | undefined {
    if (!notes) return undefined;
    const cleaned = notes
        .replace(COT_PATTERN, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    if (!cleaned) return undefined;
    return cleaned.slice(0, 1800);
}

function getMinImageCount(slideCount: number): number {
    return Math.max(1, Math.floor(slideCount * 0.3));
}

function buildImageQuery(slide: PresentationSlide, topik: string, mataPelajaran: string): string {
    if (slide.imageQuery) {
        return slide.imageQuery;
    }
    return `${topik} ${mataPelajaran} ${slide.title}`.trim();
}

function getImageCandidateIndexes(slides: PresentationSlide[]): number[] {
    const excludedLayouts = new Set(['title', 'thankyou', 'quote']);
    const prioritized: number[] = [];
    const fallback: number[] = [];

    slides.forEach((slide, index) => {
        if (excludedLayouts.has(slide.layout)) {
            return;
        }
        if (slide.layout === 'imageText' || slide.imageQuery) {
            prioritized.push(index);
        } else {
            fallback.push(index);
        }
    });

    return [...prioritized, ...fallback];
}

async function getAiService(c: any): Promise<AIService> {
    const ai = new AIService(c.env);
    try {
        const settingsResult: any = await c.env.DB.prepare(
            "SELECT key, value FROM settings WHERE key IN ('mistral_api_key', 'z_ai_api_key', 'gemini_api_key', 'bedrock_api_key', 'vertex_api_key')"
        ).all();
        const settings: any = {};
        settingsResult.results?.forEach((row: any) => settings[row.key] = row.value);

        const mistralKey = settings.mistral_api_key || c.env.MISTRAL_API_KEY;
        const zAiKey = settings.z_ai_api_key || c.env.Z_AI_API_KEY;
        const geminiKey = settings.gemini_api_key || c.env.GEMINI_API_KEY;
        const bedrockKey = settings.bedrock_api_key || c.env.BEDROCK_API_KEY;
        const vertexKey = settings.vertex_api_key || c.env.VERTEX_API_KEY;

        if (mistralKey) ai.addKey('mistral', mistralKey);
        if (zAiKey) ai.addKey('z_ai', zAiKey);
        if (geminiKey) ai.addKey('gemini', geminiKey);
        if (bedrockKey) ai.addKey('bedrock', bedrockKey);
        if (vertexKey) ai.addKey('vertex', vertexKey);
    } catch (e) {
        console.warn('Could not load DB settings for AI keys, using env:', e);
    }
    return ai;
}

// ═════════════════════════════════════════════════════════════════════════
// 1. OUTLINE PROPOSAL ENDPOINT (Phase 1 Generation)
// ═════════════════════════════════════════════════════════════════════════
presentation.post('/outline', async (c) => {
    try {
        const rawPayload = await c.req.json();
        const validatedPayload = validate(presentationOutlineSchema, rawPayload);
        if (!validatedPayload.success) {
            return Errors.validation(c, 'Payload proposal outline tidak valid', validatedPayload.errors);
        }

        const {
            mataPelajaran,
            topik,
            jenjangKelas,
            semester,
            alokasiWaktu,
            strategi,
            profilSosial,
            capaianPembelajaran,
            slideCount,
            aiProvider,
        } = validatedPayload.data;

        const ai = await getAiService(c);

        const prompt = `Rancang outline presentasi pembelajaran Kurikulum Merdeka TEPAT ${slideCount} slide.
MP: ${mataPelajaran} | Topik: ${topik} | Kelas: ${jenjangKelas} Sem ${semester} | Waktu: ${alokasiWaktu} | Strategi: ${strategi}${capaianPembelajaran ? ` | CP: ${capaianPembelajaran}` : ''}${profilSosial ? ` | Profil Pancasila: ${profilSosial}` : ''}

STRUKTUR (${slideCount} slide wajib):
- Slide 1: layout 'title' (Cover + pemantik)
- Slide 2: layout 'twoColumn' atau 'content' (Apersepsi / Tujuan)
- Slide 3-${slideCount - 2}: layout variatif (content/imageText/twoColumn/timeline/stats/comparison/flipcard)
- Slide ${slideCount - 1}: layout 'quiz' atau 'activity' (Interaktif)
- Slide ${slideCount}: layout 'summary' atau 'thankyou' (Penutup)

Balas HANYA JSON: {"title":"...","subtitle":"...","outline":[{"index":1,"title":"...","layout":"title|content|twoColumn|imageText|timeline|stats|comparison|quiz|flipcard|activity|quote|summary|thankyou","focus":"...","visualConcept":"..."}]}
`;

        const result = await ai.generateJSON(prompt, aiProvider || 'gemini');
        const validatedResult = validate(presentationOutlineResponseSchema, result);
        if (!validatedResult.success) {
            console.error('Outline Validation Failed:', JSON.stringify(result, null, 2));
            return Errors.validation(c, 'Output outline AI tidak valid', validatedResult.errors);
        }

        return successResponse(c, validatedResult.data);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Gagal merancang outline presentasi';
        return Errors.internal(c, message);
    }
});

// ═════════════════════════════════════════════════════════════════════════
// 2. FULL SLIDE GENERATION (Phase 2 Generation)
// ═════════════════════════════════════════════════════════════════════════
presentation.post('/generate', async (c) => {
    try {
        const rawPayload = await c.req.json();
        const validatedPayload = validate(presentationGenerateSchema, rawPayload);
        if (!validatedPayload.success) {
            return Errors.validation(c, 'Payload generate presentasi tidak valid', validatedPayload.errors);
        }

        const {
            mataPelajaran,
            topik,
            jenjangKelas,
            semester,
            alokasiWaktu,
            strategi,
            profilSosial,
            capaianPembelajaran,
            slideCount,
            aiProvider,
            customOutline,
        } = validatedPayload.data;

        const count = slideCount;
        const minImageCount = getMinImageCount(count);

        const ai = await getAiService(c);
        const unsplash = new UnsplashService(c.env);
        const hasUnsplash = unsplash.isConfigured();

        const outlineConstraint = customOutline && customOutline.length > 0
            ? `
IKUTI OUTLINE TEPAT YANG SUDAH DISETUJUI GURU BERIKUT:
${JSON.stringify(customOutline, null, 2)}
`
            : `
RANCANG VARIASI LAYOUT DINAMIS (WAJIB BERVARIASI, JANGAN SEMUA 'content'):
- Slide 1: 'title' (Cover menarik + subtitle pemantik)
- Slide 2: 'twoColumn' (Apersepsi & Tujuan Pembelajaran)
- Slide 3: 'content' atau 'imageText' (Konsep Inti 1)
- Slide 4: 'timeline' (Tahapan Alur / Kronologi / Proses Pembelajaran)
- Slide 5: 'stats' (Fakta Kunci, Angka Penting, atau 'Tahukah Kamu?')
- Slide 6: 'comparison' (Perbandingan Konsep A vs B)
- Slide 7: 'quiz' atau 'flipcard' (Kuis atau Kartu Konsep Interaktif)
- Slide 8 (atau terakhir): 'summary' atau 'thankyou' (Rangkuman & Apresiasi)
`;

        const prompt = `Kamu adalah Desainer Presentasi Kurikulum Merdeka Indonesia. Buat presentasi pembelajaran bermutu tinggi.

MATA PELAJARAN: ${mataPelajaran} | TOPIK: ${topik} | KELAS: ${jenjangKelas} SEM ${semester}
STRATEGI: ${strategi} | WAKTU: ${alokasiWaktu}${capaianPembelajaran ? ` | CP: ${capaianPembelajaran}` : ''}${profilSosial ? ` | PROFIL: ${profilSosial}` : ''}

${outlineConstraint}

ATURAN KONTEN (WAJIB DIIKUTI):
1. TEPAT ${count} slide dalam array "slides"
2. Setiap poin "content" wajib format "JudulPoin: Penjelasan berbobot" (bukan kalimat hambar)
3. Layout WAJIB beragam — jangan semua 'content'
4. layout 'timeline' → isi "timeline": [{"step":"1","title":"...","desc":"..."}] (3-4 steps)
5. layout 'stats' → isi "stats": [{"value":"71%","label":"...","desc":"..."}] (2-4 stats)
6. layout 'quiz' → isi "question","quizOptions":["A....","B....","C....","D...."],"quizAnswer","quizExplanation"
7. layout 'flipcard' → isi "flipcards": [{"front":"Istilah","back":"Penjelasan detail"}] (3-4 kartu)
8. layout 'twoColumn'/'comparison' → isi "leftTitle","leftContent":[],"rightTitle","rightContent":[]
9. "speakerNotes" WAJIB ada di setiap slide (catatan praktis guru, 1-2 kalimat)
10. "imageQuery" dalam bahasa Inggris untuk slide imageText

KEMBALIKAN HANYA JSON VALID:
{"title":"...","subtitle":"...","slides":[{"layout":"title|content|twoColumn|imageText|timeline|stats|comparison|quiz|flipcard|activity|quote|summary|thankyou","title":"...","subtitle":"...","content":["Poin: Penjelasan..."],"speakerNotes":"...","imageQuery":"..."}]}
`;

        const result = await ai.generateJSON(prompt, aiProvider || 'gemini');
        const validatedResult = validate(presentationResponseSchema, result);
        if (!validatedResult.success) {
            console.error('AI Output Validation Failed:', JSON.stringify(result, null, 2));
            return Errors.validation(c, 'Output AI tidak sesuai schema presentasi', validatedResult.errors);
        }

        const presentationData = validatedResult.data;
        const slides: PresentationSlide[] = presentationData.slides.map((slide) => ({
            ...slide,
            speakerNotes: sanitizeSpeakerNotes(slide.speakerNotes),
        }));

        let attachedImages = 0;

        // Graceful Unsplash integration
        if (hasUnsplash) {
            try {
                const imageCandidates = getImageCandidateIndexes(slides);
                const selectedIndexes = imageCandidates.slice(0, Math.min(minImageCount, imageCandidates.length));

                for (const index of selectedIndexes) {
                    const slide = slides[index];
                    const query = buildImageQuery(slide, topik, mataPelajaran);
                    const imagePayload = await unsplash.searchImage(query, slide.imageAlt || slide.title);

                    if (imagePayload) {
                        slide.image = imagePayload;
                        slide.imageQuery = query;
                        slide.imageAlt = imagePayload.alt;
                        if (slide.layout === 'content' || slide.layout === 'summary') {
                            slide.layout = 'imageText';
                        }
                        attachedImages++;
                    }
                }
            } catch (imgError) {
                console.warn('Unsplash image search non-blocking error:', imgError);
            }
        } else {
            console.info('Unsplash is not configured. Proceeding with vector and theme layouts.');
        }

        const finalResult = {
            title: presentationData.title,
            subtitle: presentationData.subtitle,
            slides,
            meta: {
                slideCount: slides.length,
                minImageCount,
                attachedImages,
                imagePolicy: hasUnsplash ? 'minimum_30_percent' : 'vector_fallback',
            },
        };

        return successResponse(c, finalResult);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Gagal menghasilkan presentasi';
        return Errors.internal(c, message);
    }
});

// ═════════════════════════════════════════════════════════════════════════
// 3. SINGLE SLIDE REVISION / PATCH (AI Patch Agent)
// ═════════════════════════════════════════════════════════════════════════
presentation.post('/patch-slide', async (c) => {
    try {
        const rawPayload = await c.req.json();
        const validatedPayload = validate(presentationPatchSlideSchema, rawPayload);
        if (!validatedPayload.success) {
            return Errors.validation(c, 'Payload patch slide tidak valid', validatedPayload.errors);
        }

        const {
            currentSlide,
            instruction,
            mataPelajaran = 'Umum',
            topik = 'Pembelajaran',
            jenjangKelas = 'SD',
            aiProvider,
        } = validatedPayload.data;

        const ai = await getAiService(c);

        const prompt = `
Kamu adalah Asisten Editor Presentasi Profesional.
Tugasmu: Merevisi SATU SLIDE PEMBELAJARAN berikut sesuai instruksi spesifik dari guru.

DATA KONTEKS:
- Mata Pelajaran: ${mataPelajaran}
- Topik: ${topik}
- Jenjang: ${jenjangKelas}

SLIDE SAAT INI:
${JSON.stringify(currentSlide, null, 2)}

INSTRUKSI REVISI DARI GURU:
"${instruction}"

ATURAN REVISI:
1. Perbaiki konten slide dengan tepat sesuai instruksi di atas.
2. Pertahankan atau ubah layout jika diinstruksikan.
3. Jaga kepadatan teks: judul maks 8 kata, per poin maks 15 kata.
4. Perbarui speakerNotes jika ada perubahan materi penting.

OUTPUT HANYA BERUPA JSON VALID UNTUK SATU SLIDE TERSEBUT:
{
  "layout": "title | content | twoColumn | imageText | timeline | stats | comparison | quiz | flipcard | activity | quote | summary | thankyou",
  "title": "Judul Slide",
  "subtitle": "Subjudul (opsional)",
  "content": ["Poin 1", "Poin 2", "Poin 3"],
  "leftTitle": "Kolom Kiri",
  "leftContent": ["Poin Kiri"],
  "rightTitle": "Kolom Kanan",
  "rightContent": ["Poin Kanan"],
  "timeline": [{ "step": "1", "title": "...", "desc": "..." }],
  "stats": [{ "value": "...", "label": "..." }],
  "question": "...",
  "quizOptions": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "quizAnswer": "A",
  "quizExplanation": "...",
  "flipcards": [{ "front": "Nama Konsep", "back": "Penjelasan detail" }],
  "instruction": "...",
  "time": "10 menit",
  "quote": "...",
  "author": "...",
  "speakerNotes": "Catatan guru yang diperbarui"
}
`;

        const result = await ai.generateJSON(prompt, aiProvider || 'mistral');
        const validatedResult = validate(baseSlideSchema, result);
        if (!validatedResult.success) {
            return Errors.validation(c, 'Output revisi slide AI tidak sesuai schema', validatedResult.errors);
        }

        const patchedSlide = {
            ...currentSlide,
            ...validatedResult.data,
            speakerNotes: sanitizeSpeakerNotes(validatedResult.data.speakerNotes || currentSlide.speakerNotes),
        };

        return successResponse(c, patchedSlide);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Gagal merevisi slide';
        return Errors.internal(c, message);
    }
});

export default presentation;
