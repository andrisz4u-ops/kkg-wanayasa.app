import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AIService } from '../services/ai';
import { UnsplashService } from '../services/unsplash';
import { successResponse, Errors, errorResponse, ErrorCodes } from '../lib/response';
import { requireSession } from '../lib/session-middleware';
import { createStreamJob } from '../lib/ai-stream-job';
import { recordAIGeneration } from '../lib/telemetry';
import { presentationOutlineSchema, presentationOutlineResponseSchema, presentationGenerateSchema, presentationPatchSlideSchema, validate } from '../lib/validation';
import { type AppBindings, type AppVariables } from '../types/env';
import { normalizeGeneratedDeck, normalizeSlide, deckIssues, slideIssues, isLearningObjectivesSlide, LAYOUTS } from '../../public/static/js/slides/lesson-model.js';
import { buildScene } from '../../public/static/js/slides/scene.js';
import { getTemplate } from '../../public/static/js/slides/templates.js';

const presentation = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();
presentation.use('*', requireSession);
export function resolveProviderSlug(provider?: string) {
    const aliases: Record<string, string> = { vertex: 'vertex-proxy', gemini: 'gemini-flash', bedrock: 'bedrock-claude', mistral: 'mistral-large', z_ai: 'glm4-flash' };
    return provider ? aliases[provider] || provider : undefined;
}
const brief = (input: any) => JSON.stringify({ topik: input.topik, mataPelajaran: input.mataPelajaran, jenjangKelas: input.jenjangKelas, semester: input.semester, alokasiWaktu: input.alokasiWaktu, capaianPembelajaran: input.capaianPembelajaran, strategi: input.strategi, instruksiGuru: input.extraInstructions, jumlahSlide: input.slideCount });
const rules = `Anda menyusun media ajar untuk guru SD Indonesia. Gunakan bahasa Indonesia yang sesuai kelas dan satu gagasan per slide. Judul maksimal 10 kata/85 karakter, subjudul maksimal 22 kata. Isi 2-4 poin pendek, masing-masing maksimal 18 kata/130 karakter. Jangan membuat statistik, nama narasumber, kutipan tokoh, jawaban atau fakta pengganti jika tidak diketahui. Jangan pakai emoji dekoratif atau markup HTML. Catatan guru berisi cara memandu kegiatan, pertanyaan lanjut, kemungkinan miskonsepsi dan pembahasan; bukan analisis internal model.
Alur pembelajaran: pemantik, konsep, contoh konkret, aktivitas, cek pemahaman, rangkuman/refleksi. Variasikan setidaknya 3 layout untuk 6 slide atau lebih. Pilih layout dari ${LAYOUTS.join(', ')}.
Langsung masuk ke topik dan materi. Jangan membuat slide khusus tujuan pembelajaran, daftar tujuan belajar atau learning objectives. Guru tidak perlu mengisi tujuan pembelajaran.
Field semua slide: layout,title,subtitle,content:string[],speakerNotes. Untuk twoColumn/comparison: leftTitle,leftContent (max 3),rightTitle,rightContent (max 3). Timeline: timeline:[{title,desc}] sebanyak 2-4 tahap; judul tahap max 6 kata dan desc max 18. Stats: stats:[{value,label,desc}] 1-3 angka yang benar-benar berasal dari materi, bukan statistik rekaan. Activity: instruction (max 42 kata),time,groupSize,materials. Quiz: question (max 28 kata),quizOptions (2-4 pilihan berbeda, max 12 kata/pilihan),quizAnswer (huruf A-D yang cocok),quizExplanation (penjelasan singkat yang benar). Flipcard: flipcards:[{front,back}] 1-4; front max8 kata/back max18. Quote: quote dan author hanya jika sumber diketahui. Thankyou: subtitle berisi pertanyaan refleksi bermakna.
Visual berupa objek data, jangan SVG mentah atau tautan gambar buatan. Pilihan visual: {type:"fraction",numerator:3,denominator:4,label:"Tiga perempat"} dengan penyebut2-12 dan pembilang0-penyebut; {type:"numberLine",min:0,max:10,value:3,label:"Posisi bilangan 3"}; atau {type:"process"|"cycle"|"concept",nodes:[{label:"...",detail:"..."}]} sebanyak2-4 label (max5 kata). Pakai diagram hanya jika terkait materi dan benar. ImageText harus mempunyai visual yang sesuai. Semua jawaban berada pada field jawaban/catatan guru, jangan menuliskan kunci di judul/subjudul/content siswa. Berikan JSON saja.`;
export function presentationPrompt(input: any) {
    const outline = input.customOutline?.filter((slide: any) => !isLearningObjectivesSlide(slide));
    return `${rules}\nBrief guru: ${brief(input)}\nTema: ${getTemplate(input.template).name}.\n${input.usePhotos ? 'Jika foto benda/tempat membantu pembelajaran, tambahkan imageQuery berupa 2-4 kata kunci bahasa Inggris pada maksimal 3 slide content tanpa visual. Jangan membuat URL; pencarian foto dilakukan sistem. Isi tetap lengkap jika foto tidak tersedia.' : 'Utamakan diagram terstruktur; tidak perlu pencarian foto.'}\n${outline?.length ? `Ikuti kerangka yang disetujui guru: ${JSON.stringify(outline)}.` : ''}\nBuat tepat ${input.slideCount} slide. Respons {title,subtitle,slides:[...]} dengan semua slide terisi, bukan contoh/skema kosong.`;
}
export function presentationQuality(deck: any, input: any) {
    return [...deckIssues(deck, input.slideCount), ...presentationLayoutIssues(deck, input)];
}
export function presentationLayoutIssues(deck: any, input: any) {
    return [...new Set(deck.slides.flatMap((slide: any, index: number) => [false, ...(['quiz', 'flipcard'].includes(slide.layout) ? [true] : [])].flatMap(reveal => buildScene(slide, input.template, { aspectRatio: input.aspectRatio, index, total: deck.slides.length, reveal }).warnings.map((message: string) => `Slide ${index + 1}: ${message}`))))];
}
function updateLayoutReview(deck: any, input: any) {
    const layoutWarnings = presentationLayoutIssues(deck, input);
    const contentIssues = deckIssues(deck, input.slideCount, { allowCountMismatch: true });
    const countWarning = deck.slides.length === input.slideCount ? '' : `AI menghasilkan ${deck.slides.length} slide materi, dari target ${input.slideCount}. Seluruh materi dipertahankan; sesuaikan jumlahnya di editor bila diperlukan.`;
    deck.meta.quality = { scope: 'struktur_dan_keterbacaan', needsTeacherReview: true, readyForExport: contentIssues.length === 0 && layoutWarnings.length === 0, partial: contentIssues.length > 0, contentIssues, countWarning, layoutWarnings };
}
function generationError(c: any, error: any) {
    return errorResponse(c, error.code || ErrorCodes.AI_ERROR, error.message, error.code === 'AI_OUTPUT_INVALID' ? 422 : 500, error.details);
}
async function service(c: any) { const ai = new AIService(c.env); await ai.loadProviders(c.env.DB); ai.setAbortSignal(c.req.raw.signal); return ai; }
const usableMaterialCount = (deck: any) => deck.slides.filter((slide: any) => !['title', 'thankyou'].includes(slide.layout) && slideIssues(slide).length === 0).length;
async function generate(ai: AIService, input: any, step: (index: number, message: string) => Promise<void>, token?: (text: string) => void, reset?: () => Promise<void>) {
    const started = Date.now();
    await step(1, 'Menyiapkan topik, kelas dan kerangka materi.');
    await step(2, 'Menyusun konsep, contoh dan kegiatan kelas.');
    let raw = token ? await ai.generateJSONStream(presentationPrompt(input), resolveProviderSlug(input.aiProvider), token) : await ai.generateJSON(presentationPrompt(input), resolveProviderSlug(input.aiProvider));
    let deck = normalizeGeneratedDeck(raw, input.topik);
    deck.slides.forEach((slide: any) => { delete slide.image; });
    await step(3, 'Memeriksa kelengkapan materi dan bidang teks.');
    let issues = deckIssues(deck, input.slideCount, { allowCountMismatch: true });
    if (issues.length) {
        await reset?.();
        const repair = `${presentationPrompt(input)}\nLengkapi isi slide yang ditandai tanpa mengubah topik atau menghapus materi yang sudah tersedia. Masalah: ${issues.slice(0, 15).join(' ')}\nRespons: ${JSON.stringify(deck)}\nKembalikan keseluruhan deck yang sudah diperbaiki, tanpa slide tujuan pembelajaran.`;
        try {
            const repairedRaw = token ? await ai.generateJSONStream(repair, resolveProviderSlug(input.aiProvider), token) : await ai.generateJSON(repair, resolveProviderSlug(input.aiProvider));
            const repaired = normalizeGeneratedDeck(repairedRaw, input.topik); repaired.slides.forEach((slide: any) => { delete slide.image; });
            const repairedIssues = deckIssues(repaired, input.slideCount, { allowCountMismatch: true });
            if (repairedIssues.length < issues.length && usableMaterialCount(repaired) >= usableMaterialCount(deck)) {
                raw = repairedRaw; deck = repaired; issues = repairedIssues;
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || !usableMaterialCount(deck)) throw error;
        }
    }
    const hasUsableMaterial = usableMaterialCount(deck) > 0;
    if (issues.length && !hasUsableMaterial) {
        const error: any = new Error(`AI belum mengirim materi yang dapat ditinjau: ${issues.slice(0, 4).join(' ')} Perjelas topik atau instruksi materi sebelum mencoba lagi.`);
        error.code = 'AI_OUTPUT_INVALID'; error.details = issues;
        throw error;
    }
    deck.meta = { ...deck.meta, version: 2, slideCount: deck.slides.length, requestedSlideCount: input.slideCount, durationMs: Date.now() - started, attachedImages: 0, imagePolicy: 'diagram_terstruktur', provider: raw?._aiMeta?.provider };
    updateLayoutReview(deck, input);
    await step(4, deck.meta.quality.partial ? 'Materi yang sudah tersedia disimpan sebagai draf sebagian. Lengkapi slide yang ditandai di editor.' : deck.meta.quality.layoutWarnings.length ? 'Draf materi tersedia. Beberapa bidang teks perlu dirapikan di editor sebelum diekspor.' : 'Menyiapkan slide dan catatan untuk ditinjau guru.');
    return deck;
}
presentation.post('/outline', async c => {
    try {
        const parsed = validate(presentationOutlineSchema, await c.req.json());
        if (!parsed.success) return Errors.validation(c, 'Brief slide belum lengkap.', parsed.errors);
        const input = parsed.data, ai = await service(c);
        const raw: any = await ai.generateJSON(`${rules}\nBrief: ${brief(input)}\nBuat kerangka tepat ${input.slideCount} slide, bukan isi lengkap. JSON {title,subtitle,outline:[{index,title,layout,focus,visualConcept}]}. Focus menyebut konsep/kegiatan yang benar-benar akan diajarkan.`, resolveProviderSlug(input.aiProvider));
        const root = raw?.presentation || raw?.data || raw;
        const outline = (Array.isArray(root) ? root : root?.outline || root?.slides || []).filter((item: any) => !isLearningObjectivesSlide(typeof item === 'string' ? { title: item } : item)).map((item: any, i: number) => ({ index: i + 1, title: typeof item === 'string' ? item : item.title || item.judul || '', layout: LAYOUTS.includes(item.layout) ? item.layout : 'content', focus: item.focus || item.description || (typeof item === 'string' ? item : item.title) || '', visualConcept: item.visualConcept }));
        if (outline.length !== input.slideCount || outline.some((item: any) => !item.title || !item.focus)) return Errors.validation(c, 'Kerangka belum lengkap. Perjelas topik atau kurangi jumlah slide.');
        const validated = validate(presentationOutlineResponseSchema, { title: root.title || input.topik, subtitle: root.subtitle, outline });
        return validated.success ? successResponse(c, validated.data) : Errors.validation(c, 'Kerangka belum sesuai struktur.', validated.errors);
    } catch (error: any) { return generationError(c, error); }
});
presentation.post('/generate', async c => {
    try {
        const parsed = validate(presentationGenerateSchema, await c.req.json());
        if (!parsed.success) return Errors.validation(c, 'Brief slide belum lengkap.', parsed.errors);
        const ai = await service(c), input = parsed.data;
        const deck = await generate(ai, input, async () => {});
        await attachPhotos(c, deck, input);
        updateLayoutReview(deck, input);
        await telemetry(c, deck, input); return successResponse(c, deck);
    } catch (error: any) { return generationError(c, error); }
});
presentation.post('/generate-stream', async c => {
    try {
        const body = await c.req.json(), parsed = validate(presentationGenerateSchema, body);
        if (!parsed.success) return Errors.validation(c, 'Brief slide belum lengkap.', parsed.errors);
        const ai = await service(c);
        const job = await createStreamJob(c, 'presentation', parsed.data);
        if (job.response) return job.response;
        return streamSSE(c, async rawStream => {
            const stream = job.attach(rawStream, ai);
            try {
                const deck = await generate(ai, parsed.data, async (step, message) => { await stream.writeSSE({ event: 'step', data: JSON.stringify({ step, totalSteps: 4, message }) }); }, text => { void stream.writeSSE({ event: 'token', data: JSON.stringify({ text }) }).catch(() => {}); }, async () => { await stream.writeSSE({ event: 'reset', data: JSON.stringify({ message: 'Memperbaiki draf berdasarkan pemeriksaan struktur.' }) }); });
                job.signal.throwIfAborted(); await attachPhotos(c, deck, parsed.data); job.signal.throwIfAborted(); updateLayoutReview(deck, parsed.data); await telemetry(c, deck, parsed.data);
                const warnings = [...deck.meta.quality.contentIssues, deck.meta.quality.countWarning, ...deck.meta.quality.layoutWarnings].filter(Boolean);
                await stream.writeSSE({ event: 'done', data: JSON.stringify({ success: true, partial: deck.meta.quality.partial, warnings, data: deck }) });
            } catch (error: any) { if (!job.signal.aborted) await stream.writeSSE({ event: 'error', data: JSON.stringify({ message: error.message, code: error.code || ErrorCodes.AI_ERROR, status: error.code === 'AI_OUTPUT_INVALID' ? 422 : 500, details: error.details }) }); }
            finally { await job.dispose(); }
        });
    } catch (error: any) { return generationError(c, error); }
});
async function attachPhotos(c: any, deck: any, input: any) {
    if (!input.usePhotos) return;
    const unsplash = new UnsplashService(c.env), candidates = deck.slides.filter((s: any) => s.imageQuery && !s.visual).slice(0, 3);
    for (let i = 0; i < candidates.length; i += 2) await Promise.all(candidates.slice(i, i + 2).map(async (slide: any) => {
        try { const image = await unsplash.searchImage(slide.imageQuery, slide.title); if (image) { slide.image = image; deck.meta.attachedImages++; } } catch { deck.meta.photoWarning = 'Sebagian foto belum tersedia; isi dan diagram tetap dapat digunakan.'; }
    }));
    deck.meta.imagePolicy = 'diagram_dengan_foto_opsional';
}
async function telemetry(c: any, deck: any, input: any) {
    const user = c.get('user');
    await recordAIGeneration(c.env.DB, { user_id: user.id, user_nama: user.nama, sekolah: user.sekolah || '', feature_type: 'SLIDE', topik: input.topik, mata_pelajaran: input.mataPelajaran, jenjang_kelas: input.jenjangKelas, ai_provider: input.aiProvider, duration_ms: deck.meta.durationMs });
}
presentation.post('/patch-slide', async c => {
    try {
        const parsed = validate(presentationPatchSlideSchema, await c.req.json());
        if (!parsed.success) return Errors.validation(c, 'Instruksi revisi belum lengkap.', parsed.errors);
        const input = parsed.data, ai = await service(c);
        const raw = await ai.generateJSON(`${rules}\nKonteks: ${JSON.stringify({ topik: input.topik, kelas: input.jenjangKelas, mapel: input.mataPelajaran })}\nSlide: ${JSON.stringify(input.currentSlide)}\nInstruksi guru: ${input.instruction}\nKembalikan satu objek slide lengkap.`, resolveProviderSlug(input.aiProvider));
        const slide = normalizeSlide(raw?.slide || raw?.data || raw), issues = slideIssues(slide);
        if (issues.length) return Errors.validation(c, 'Revisi perlu diperbaiki sebelum digunakan.', issues);
        return successResponse(c, slide);
    } catch (error: any) { return errorResponse(c, ErrorCodes.AI_ERROR, error.message, 500); }
});
export default presentation;
