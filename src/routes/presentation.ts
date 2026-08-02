import { Hono } from 'hono';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';
import {
    presentationGenerateSchema,
    presentationResponseSchema,
    type PresentationSlide,
    validate,
} from '../lib/validation';
import { UnsplashService } from '../services/unsplash';

type Bindings = {
    DB: D1Database;
    MISTRAL_API_KEY?: string;
    Z_AI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    GROQ_API_KEY?: string;
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

// Generate Slide Content
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
        } = validatedPayload.data;

        const count = slideCount;
        const minImageCount = getMinImageCount(count);

        const ai = new AIService(c.env);
        // Inject keys from DB/Env
        const settingsResult: any = await c.env.DB.prepare(
            "SELECT key, value FROM settings WHERE key IN ('mistral_api_key', 'z_ai_api_key', 'gemini_api_key', 'groq_api_key', 'vertex_api_key')"
        ).all();
        const settings: any = {};
        settingsResult.results?.forEach((row: any) => settings[row.key] = row.value);

        const mistralKey = settings.mistral_api_key || c.env.MISTRAL_API_KEY;
        const zAiKey = settings.z_ai_api_key || c.env.Z_AI_API_KEY;
        const geminiKey = settings.gemini_api_key || c.env.GEMINI_API_KEY;
        const groqKey = settings.groq_api_key || c.env.GROQ_API_KEY;
        const vertexKey = settings.vertex_api_key || c.env.VERTEX_API_KEY;

        if (mistralKey) ai.addKey('mistral', mistralKey);
        if (zAiKey) ai.addKey('z_ai', zAiKey);
        if (geminiKey) ai.addKey('gemini', geminiKey);
        if (groqKey) ai.addKey('groq', groqKey);
        if (vertexKey) ai.addKey('vertex', vertexKey);
        const unsplash = new UnsplashService(c.env);

        if (!unsplash.isConfigured()) {
            return Errors.configError(c, 'UNSPLASH_ACCESS_KEY belum dikonfigurasi. Slide generator membutuhkan gambar relevan.');
        }

        const prompt = `
Kamu adalah seorang Ahli Kurikulum Pendidikan Indonesia (Kurikulum Merdeka), sekaligus Desainer Presentasi Profesional.
Tugasmu: merancang presentasi pembelajaran berkualitas tinggi yang edukatif, lengkap, dan menarik secara visual.

════════════════════════════════════════
LANGKAH 1: ANALISIS KONTEKS (Berpikir dulu sebelum menulis)
════════════════════════════════════════

Sebelum menulis JSON, pikirkan secara mendalam:

A. ANALISIS AUDIENS:
   - Mata Pelajaran: ${mataPelajaran}
   - Topik: ${topik}
   - Kelas / Semester: ${jenjangKelas} / ${semester}
   - Alokasi Waktu: ${alokasiWaktu}
   - Model Ajar: ${strategi}
   ${capaianPembelajaran ? `- Capaian Pembelajaran: ${capaianPembelajaran}` : ''}
   ${profilSosial ? `- Dimensi Profil Pancasila: ${profilSosial}` : ''}

   Pertanyaan bantu:
   - Apa level kognitif (Taksonomi Bloom) yang sesuai untuk kelas ini?
   - Konsep inti apa saja yang WAJIB dikuasai murid setelah pembelajaran ini?
   - Miskonsepsi umum apa yang mungkin dimiliki murid tentang topik ini?
   - Contoh konkret dari kehidupan sehari-hari apa yang bisa digunakan?
   - Fakta mengejutkan / "Tahukah Kamu?" apa yang relevan dan bisa memancing curiosity?

B. PERENCANAAN ALUR PRESENTASI:
   Total slide yang harus dihasilkan: Tepat ${count} slide.
   Rancang alur sebagai berikut:
   
   1. **Slide 1 — Cover Materi**: Judul besar yang menggugah rasa ingin tahu + subtitle kontekstual. Layout: 'title'. Harus membuat murid langsung tertarik.
   2. **Slide 2 — Tujuan & Apersepsi**: Gabungkan Tujuan Pembelajaran (apa yang akan dicapai) dan Apersepsi (pertanyaan pemantik / pengalaman sehari-hari). Layout: 'twoColumn' atau 'content'. ISI HARUS PADAT, TIDAK BOLEH KOSONG.
   3. **Slide 3 s/d ${count - 1} — Materi Inti**: Setiap slide membahas satu sub-topik secara mendalam. Setiap slide materi WAJIB berisi:
      - Minimal 4–6 poin konten substantif (bukan kalimat kosong atau terlalu umum)
      - 1 poin "Tahukah Kamu?" atau "Fakta Menarik" yang relevan dan mencengangkan
      - Speaker notes yang kaya untuk panduan guru (teknik penyampaian, contoh tambahan, pertanyaan interaktif)
   4. **Slide Terakhir — Rangkuman/Penutup**: Ringkasan poin kunci + pesan motivasi. Layout: 'summary' atau 'thankyou'.

C. STANDAR KUALITAS KONTEN:
   - Materi harus AKURAT secara ilmiah/akademik
   - Bahasa Indonesia baku, akademik, namun tetap mudah dipahami murid
   - Setiap poin harus informatif — DILARANG menulis poin generik seperti "Materi ini penting" tanpa penjelasan spesifik
   - Gunakan contoh konkret, angka, atau perbandingan yang memudahkan pemahaman
   - Variasi layout antar slide agar tidak monoton (gunakan: content, twoColumn, imageText, activity, quote)

════════════════════════════════════════
LANGKAH 2: TULIS OUTPUT JSON
════════════════════════════════════════

Setelah berpikir matang di Langkah 1, LANGSUNG tulis output JSON berikut (tanpa menuliskan proses berpikirmu):

{
   "title": "Judul Presentasi yang Menarik",
   "subtitle": "Subjudul kontekstual",
   "slides": [
      {
         "layout": "title | content | twoColumn | activity | quote | summary | thankyou | imageText",
         "title": "Judul Slide (Singkat, Maks 8 Kata)",
         "content": ["Poin substantif 1", "Poin substantif 2", "Poin substantif 3", "Poin substantif 4", "Tahukah Kamu? Fakta menarik..."],
         "leftTitle": "Judul Kolom Kiri",
         "leftContent": ["Poin kiri 1", "Poin kiri 2"],
         "rightTitle": "Judul Kolom Kanan",
         "rightContent": ["Poin kanan 1", "Poin kanan 2"],
         "instruction": "Instruksi aktivitas untuk murid",
         "time": "Durasi aktivitas",
         "quote": "Kutipan bermakna",
         "author": "Sumber kutipan",
         "imageQuery": "english keyword for unsplash photo search",
         "imageAlt": "Deskripsi gambar edukatif",
         "speakerNotes": "Panduan penyampaian untuk guru: teknik mengajar, pertanyaan interaktif, contoh tambahan, cara mengecek pemahaman murid."
      }
   ]
}

════════════════════════════════════════
ATURAN KETAT:
════════════════════════════════════════
1. Output HANYA berisi JSON valid. JANGAN tulis teks pengantar, analisis, atau komentar di luar JSON.
2. Jumlah slide HARUS TEPAT ${count}.
3. Setiap slide content/imageText/summary WAJIB memiliki minimal 4 item dalam array "content".
4. Setiap slide materi (slide 3 s/d ${count - 1}) WAJIB menyertakan 1 poin "Tahukah Kamu?" atau "Fakta Menarik" di akhir array content.
5. Speaker notes harus berisi panduan mengajar yang kaya dan praktis (bukan ringkasan konten slide).
6. imageQuery WAJIB ditulis dalam bahasa Inggris agar pencarian gambar optimal di Unsplash. Minimal ${minImageCount} slide harus memiliki imageQuery.
7. Gunakan variasi layout (jangan semua 'content') agar presentasi tidak monoton.
8. Setiap poin harus informatif dan spesifik — DILARANG menulis poin kosong/generik.
        `;

        const result = await ai.generateJSON(prompt, aiProvider || 'mistral');
        const validatedResult = validate(presentationResponseSchema, result);
        if (!validatedResult.success) {
            console.error('AI Output Validation Failed:', JSON.stringify(result, null, 2));
            return Errors.validation(c, 'Output AI tidak sesuai schema presentasi', validatedResult.errors);
        }

        const presentationData = validatedResult.data;
        if (presentationData.slides.length !== count) {
            return Errors.validation(c, `Jumlah slide harus tepat ${count} `, [{
                field: 'slides',
                message: `AI menghasilkan ${presentationData.slides.length} slide`,
            }]);
        }

        const slides: PresentationSlide[] = presentationData.slides.map((slide) => ({
            ...slide,
            speakerNotes: sanitizeSpeakerNotes(slide.speakerNotes),
        }));

        const imageCandidates = getImageCandidateIndexes(slides);
        const selectedIndexes = imageCandidates.slice(0, Math.min(minImageCount, imageCandidates.length));

        if (selectedIndexes.length < minImageCount) {
            return Errors.validation(c, 'Slide non-gambar terlalu sedikit untuk memenuhi kebijakan visual', [{
                field: 'slides',
                message: `Minimal ${minImageCount} slide gambar dibutuhkan`,
            }]);
        }

        for (const index of selectedIndexes) {
            const slide = slides[index];
            const query = buildImageQuery(slide, topik, mataPelajaran);
            const imagePayload = await unsplash.searchImage(query, slide.imageAlt || slide.title);

            if (!imagePayload) {
                continue;
            }

            slide.image = imagePayload;
            slide.imageQuery = query;
            slide.imageAlt = imagePayload.alt;
            if (slide.layout === 'content' || slide.layout === 'summary') {
                slide.layout = 'imageText';
            }
        }

        const attachedImages = slides.filter((slide) => slide.image).length;
        if (attachedImages < minImageCount) {
            console.warn(`Unsplash returned 0 or too few images(${attachedImages} / ${minImageCount}) for these queries.Proceeding without images to avoid crashing.`);
        }

        const finalResult = {
            title: presentationData.title,
            subtitle: presentationData.subtitle,
            slides,
            meta: {
                slideCount: count,
                minImageCount,
                attachedImages,
                imagePolicy: 'minimum_30_percent',
            },
        };

        return successResponse(c, finalResult);

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Gagal menghasilkan presentasi';
        return Errors.internal(c, message);
    }
});

export default presentation;
