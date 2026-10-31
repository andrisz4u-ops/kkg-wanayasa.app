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
import { requireAIAdmission } from '../lib/ai-admission';
import { normalizeGeneratedDeck, normalizeSlide, normalizeVisual, deckIssues, slideIssues, isLearningObjectivesSlide, LAYOUTS } from '../../public/static/js/slides/lesson-model.js';
import { buildScene } from '../../public/static/js/slides/scene.js';
import { getTemplate } from '../../public/static/js/slides/templates.js';

const presentation = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();
presentation.use('*', requireSession);
export function resolveProviderSlug(provider?: string) {
    const aliases: Record<string, string> = { vertex: 'vertex-proxy', gemini: 'gemini-flash', bedrock: 'bedrock-claude', mistral: 'mistral-large', z_ai: 'glm4-flash' };
    return provider ? aliases[provider] || provider : undefined;
}
const brief = (input: any) => JSON.stringify({ topik: input.topik, mataPelajaran: input.mataPelajaran, jenjangKelas: input.jenjangKelas, semester: input.semester, alokasiWaktu: input.alokasiWaktu, capaianPembelajaran: input.capaianPembelajaran, strategi: input.strategi, instruksiGuru: input.extraInstructions, jumlahSlide: input.slideCount });
const rules = `Anda menyusun media ajar untuk guru SD Indonesia (Kelas 1-6). Berikan materi yang mendalam, bermakna, dan tuntas sesuai tingkat kelas. Hindari menyederhanakan materi hingga dangkal atau memotong penjelasan penting. Siswa harus memahami konsep secara utuh, dengan bahasa Indonesia yang jelas, komunikatif, dan satu gagasan terpadu per slide.
Pilih layout secara fleksibel dan adaptif dari: ${LAYOUTS.join(', ')}. Variasikan layout agar alur belajar hidup (pemantik, konsep mendalam, perbandingan/contoh konkret, aktivitas kelas, cek pemahaman, dan refleksi).
Langsung masuk ke topik dan materi. Jangan membuat slide khusus tujuan pembelajaran atau daftar learning objectives.
Field semua slide: layout, title, subtitle, content:string[], speakerNotes.
- Untuk gridCards: cards:[{title, desc, badge}] 2-4 kartu konsep berdampingan (sangat cocok untuk materi multikonsep: 3 wujud benda, 3 jenis simbiosis, 4 sila/pilar, 3 hukum Newton, 4 tahapan).
- Untuk twoColumn/comparison: leftTitle, leftContent (2-4 poin jelas), rightTitle, rightContent (2-4 poin jelas).
- Untuk timeline: timeline:[{title, desc}] 2-5 tahap kronologis/proses yang bermakna.
- Untuk stats: stats:[{value, label, desc}] 1-4 data angka yang valid dari materi.
- Untuk activity: instruction (instruksi kegiatan siswa yang konkret dan aplikatif), time, groupSize, materials.
- Untuk quiz: question (pertanyaan pemahaman bernalar), quizOptions (2-4 pilihan), quizAnswer (huruf A-D), quizExplanation (pembahasan mendidik untuk guru).
- Untuk flipcard: flipcards:[{front, back}] 1-4 kartu tanya-jawab ringkas.
- Untuk quote: quote dan author (hanya jika ada sumber/tokoh valid).
- Untuk thankyou: subtitle berisi pertanyaan refleksi penutup yang bermakna.
- Catatan guru (speakerNotes): panduan memandu kelas, pertanyaan pemantik diskusi, antisipasi miskonsepsi, dan alternatif pengayaan.

Sistem Visual & Fleksibilitas Gambar:
1. Evaluasi secara cerdas apakah slide memerlukan stimulus gambar atau murni teks/diagram.
2. Jika MEMBUTUHKAN gambar (topik konkret: sains, biologi, tata surya, pahlawan, sejarah, geografi, kebudayaan, seni), pada 1-3 slide layout 'imageText' atau 'content', sertakan:
   - imageQuery: 2-4 kata kunci bahasa Inggris spesifik (misal: "human digestive system", "solar system planets", "garuda pancasila", "angklung instrument", "plant photosynthesis").
   - imagePrompt: deskripsi gambar gaya buku teks 2D edukatif bersih, latar putih.
3. Jika TIDAK memerlukan gambar (konsep abstrak, rumus, diskusi filosofis, refleksi), biarkan tanpa imageQuery agar tata letak dan tipografi teks tampil lapang, elegan, dan terbaca jelas.
4. Diagram Terstruktur (SVG): gunakan visual objek data bila relevan:
   - {type:"fraction",numerator:3,denominator:4,label:"Tiga perempat"} (penyebut 2-12, pembilang <= penyebut);
   - {type:"numberLine",min:0,max:10,value:3,label:"Posisi bilangan"};
   - atau {type:"process"|"cycle"|"concept",nodes:[{label:"...",detail:"..."}]} sebanyak 2-5 label.
Jangan membuat URL gambar buatan di JSON. Semua jawaban kuis berada pada field quizAnswer/speakerNotes, jangan menuliskan kunci di teks siswa. Berikan JSON saja.`;
export function presentationPrompt(input: any) {
    const outline = input.customOutline?.filter((slide: any) => !isLearningObjectivesSlide(slide));
    const isMath = /matematika|pecahan|bilangan|sudut|bangun|luas|keliling|angka/i.test(`${input.mataPelajaran} ${input.topik}`);
    const isCycle = /siklus|daur|metamorfosis|rantai makanan|proses air/i.test(`${input.mataPelajaran} ${input.topik}`);
    const visualRequirement = isMath
        ? 'PERHATIAN KHUSUS MATEMATIKA: Anda WAJIB menyertakan diagram terstruktur {visual: {type: "fraction", numerator: 1, denominator: 2, label: "Setengah bagian"}} atau {type: "numberLine", min: 0, max: 10, value: 3, label: "Garis bilangan"}} pada minimal 1 slide konsep materi!'
        : isCycle
        ? 'PERHATIAN KHUSUS IPA/SAINS: Anda WAJIB menyertakan diagram {visual: {type: "cycle", nodes: [{label: "Tahap 1"}, {label: "Tahap 2"}, ...]}} pada minimal 1 slide konsep materi!'
        : '';
    return `${rules}\nBrief guru: ${brief(input)}\nTema: ${getTemplate(input.template).name}.\nMata Pelajaran: ${input.mataPelajaran}, Jenjang: ${input.jenjangKelas}.\n${visualRequirement}\n${input.usePhotos ? 'Pemberian visual adaptif: Evaluasi secara cerdas kebutuhan visual materi. Sertakan imageQuery (2-4 kata kunci Inggris konkret) dan imagePrompt pada 1-3 slide materi penting yang membutuhkan stimulus visual konkret. Pada slide konsep murni, definisi, perbandingan, atau refleksi, utamakan kedalaman materi dan tata letak yang lapang tanpa memaksakan gambar.' : 'Utamakan penjelasan mendalam dan diagram terstruktur; tidak perlu pencarian gambar.'}\n${outline?.length ? `Ikuti kerangka yang disetujui guru: ${JSON.stringify(outline)}.` : ''}\nBuat tepat ${input.slideCount} slide. Respons {title,subtitle,slides:[...]} dengan semua slide terisi, mendalam, dan bermakna.`;
}
const OUTLINE_TEXT_KEYS = ['text', 'title', 'content', 'value'] as const;
/** Extract plain text only from recognized AI wrapper shapes; leave unknown values untouched for Zod to reject. */
export function normalizeOutlineText(value: any, depth = 0): any {
    if (typeof value === 'string' || value == null || typeof value !== 'object' || Array.isArray(value) || depth >= 3) return value;
    for (const key of OUTLINE_TEXT_KEYS) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            const nested = value[key];
            if (typeof nested === 'string') return nested;
            if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
                const extracted = normalizeOutlineText(nested, depth + 1);
                if (typeof extracted === 'string') return extracted;
            }
        }
    }
    return value;
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
    deck.slides.forEach((slide: any) => {
        if (slide.image && !slide.image.source) delete slide.image;
        if (slide.layout === 'imageText' && !slide.visual && !slide.imageQuery) {
            slide.imageQuery = `${slide.title} ${input.topik}`.slice(0, 80);
        }
    });
    await step(3, 'Memeriksa kelengkapan materi dan bidang teks.');
    let issues = deckIssues(deck, input.slideCount, { allowCountMismatch: true });
    if (issues.length) {
        await reset?.();
        const repair = `${presentationPrompt(input)}\nLengkapi isi slide yang ditandai tanpa mengubah topik atau menghapus materi yang sudah tersedia. Masalah: ${issues.slice(0, 15).join(' ')}\nRespons: ${JSON.stringify(deck)}\nKembalikan keseluruhan deck yang sudah diperbaiki, tanpa slide tujuan pembelajaran.`;
        try {
            const repairedRaw = token ? await ai.generateJSONStream(repair, resolveProviderSlug(input.aiProvider), token) : await ai.generateJSON(repair, resolveProviderSlug(input.aiProvider));
            const repaired = normalizeGeneratedDeck(repairedRaw, input.topik);
            repaired.slides.forEach((slide: any) => {
                if (slide.image && !slide.image.source) delete slide.image;
                if (slide.layout === 'imageText' && !slide.visual && !slide.imageQuery) {
                    slide.imageQuery = `${slide.title} ${input.topik}`.slice(0, 80);
                }
            });
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
    const hasVisual = deck.slides.some((s: any) => s.visual);
    if (!hasVisual) {
        const isFraction = /pecahan|fraction/i.test(`${input.topik} ${input.mataPelajaran}`);
        if (isFraction) {
            const targetSlide = deck.slides.find((s: any) => !['title', 'thankyou', 'summary'].includes(s.layout));
            if (targetSlide) {
                targetSlide.visual = normalizeVisual({ type: 'fraction', numerator: 1, denominator: 2, label: 'Satu perdua (1/2)' });
            }
        }
    }
    deck.meta = { ...deck.meta, version: 2, slideCount: deck.slides.length, requestedSlideCount: input.slideCount, durationMs: Date.now() - started, attachedImages: 0, imagePolicy: 'diagram_terstruktur', provider: raw?._aiMeta?.provider };
    updateLayoutReview(deck, input);
    await step(4, deck.meta.quality?.partial ? 'Materi yang sudah tersedia disimpan sebagai draf sebagian. Lengkapi slide yang ditandai di editor.' : deck.meta.quality?.layoutWarnings?.length ? 'Draf materi tersedia. Beberapa bidang teks perlu dirapikan di editor sebelum diekspor.' : 'Menyiapkan slide dan catatan untuk ditinjau guru.');
    return deck;
}
presentation.post('/outline', requireAIAdmission, async c => {
    try {
        const parsed = validate(presentationOutlineSchema, await c.req.json());
        if (!parsed.success) return Errors.validation(c, 'Brief slide belum lengkap.', parsed.errors);
        const input = parsed.data, ai = await service(c);
        const raw: any = await ai.generateJSON(`${rules}\nBrief: ${brief(input)}\nBuat kerangka tepat ${input.slideCount} slide, bukan isi lengkap. JSON {title,subtitle,outline:[{index,title,layout,focus,visualConcept}]}. title, layout, focus, dan visualConcept harus berupa plain string, bukan objek; jangan membungkus teks dalam objek. Focus menyebut konsep/kegiatan yang benar-benar akan diajarkan.`, resolveProviderSlug(input.aiProvider));
        const root = raw?.presentation || raw?.data || raw;
        const outline = (Array.isArray(root) ? root : root?.outline || root?.slides || []).filter((item: any) => !isLearningObjectivesSlide(typeof item === 'string' ? { title: item } : item)).map((item: any, i: number) => {
            const title = normalizeOutlineText(typeof item === 'string' ? item : item.title ?? item.judul ?? '');
            const rawLayout = normalizeOutlineText(typeof item === 'string' ? undefined : item.layout);
            const focus = normalizeOutlineText(typeof item === 'string' ? item : item.focus ?? item.description ?? item.title ?? '');
            return { index: i + 1, title, layout: typeof rawLayout === 'object' && rawLayout !== null ? rawLayout : LAYOUTS.includes(rawLayout) ? rawLayout : 'content', focus, visualConcept: normalizeOutlineText(typeof item === 'string' ? undefined : item.visualConcept) };
        });
        const validated = validate(presentationOutlineResponseSchema, { title: normalizeOutlineText(root.title) ?? input.topik, subtitle: normalizeOutlineText(root.subtitle), outline });
        if (!validated.success) return Errors.validation(c, 'Kerangka belum sesuai struktur.', validated.errors);
        if (validated.data.outline.length !== input.slideCount || validated.data.outline.some((item: any) => !item.title || !item.focus)) return Errors.validation(c, 'Kerangka belum lengkap. Perjelas topik atau kurangi jumlah slide.');
        return successResponse(c, validated.data);
    } catch (error: any) { return generationError(c, error); }
});
presentation.post('/generate', requireAIAdmission, async c => {
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
presentation.post('/generate-stream', requireAIAdmission, async c => {
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
                const quality = deck.meta.quality;
                const warnings = [...(quality?.contentIssues || []), quality?.countWarning, ...(quality?.layoutWarnings || [])].filter(Boolean);
                await stream.writeSSE({ event: 'done', data: JSON.stringify({ success: true, partial: quality?.partial, warnings, data: deck }) });
            } catch (error: any) { if (!job.signal.aborted) await stream.writeSSE({ event: 'error', data: JSON.stringify({ message: error.message, code: error.code || ErrorCodes.AI_ERROR, status: error.code === 'AI_OUTPUT_INVALID' ? 422 : 500, details: error.details }) }); }
            finally { await job.dispose(); }
        });
    } catch (error: any) { return generationError(c, error); }
});
async function attachPhotos(c: any, deck: any, input: any) {
    if (!input.usePhotos) return;
    const unsplash = new UnsplashService(c.env);
    let candidates = deck.slides.filter((s: any) => (s.imageQuery || s.layout === 'imageText') && !s.visual).slice(0, 3);
    if (!candidates.length) {
        candidates = deck.slides.filter((s: any) => !['title', 'thankyou', 'summary'].includes(s.layout) && !s.visual).slice(0, 2);
    }
    for (let i = 0; i < candidates.length; i += 2) {
        await Promise.all(candidates.slice(i, i + 2).map(async (slide: any) => {
            const query = slide.imageQuery || slide.title || input.topik;
            const prompt = slide.imagePrompt || `${query}, educational textbook illustration for elementary school ${input.jenjangKelas || 'grade 5'}`;
            try {
                const image = await unsplash.searchImage(query, slide.title || query, input.mataPelajaran, prompt);
                if (image) {
                    slide.image = image;
                    deck.meta.attachedImages++;
                } else if (slide.layout === 'imageText' && !slide.visual) {
                    const isFraction = /pecahan|fraction|setengah|sepertiga|seperempat/i.test(`${slide.title} ${slide.content?.join(' ')}`);
                    const isCycle = /siklus|daur|metamorfosis|rantai makanan/i.test(`${slide.title} ${slide.content?.join(' ')}`);
                    if (isFraction) {
                        slide.visual = normalizeVisual({ type: 'fraction', numerator: 1, denominator: 2, label: 'Model visual pecahan' });
                    } else if (isCycle && slide.content?.length >= 2) {
                        slide.visual = normalizeVisual({ type: 'cycle', nodes: slide.content.slice(0, 4).map((label: string) => ({ label })) });
                    } else {
                        slide.layout = 'content';
                    }
                }
            } catch {
                deck.meta.photoWarning = 'Sebagian gambar/foto belum tersedia; materi dan diagram tetap dapat digunakan.';
                if (slide.layout === 'imageText' && !slide.visual) {
                    slide.layout = 'content';
                }
            }
        }));
    }
    deck.meta.imagePolicy = deck.meta.attachedImages > 0 ? 'visual_multimodal_aktif' : 'diagram_terstruktur';
}
async function telemetry(c: any, deck: any, input: any) {
    const user = c.get('user');
    await recordAIGeneration(c.env.DB, { user_id: user.id, user_nama: user.nama, sekolah: user.sekolah || '', feature_type: 'SLIDE', topik: input.topik, mata_pelajaran: input.mataPelajaran, jenjang_kelas: input.jenjangKelas, ai_provider: input.aiProvider, duration_ms: deck.meta.durationMs });
}
presentation.post('/patch-slide', requireAIAdmission, async c => {
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
