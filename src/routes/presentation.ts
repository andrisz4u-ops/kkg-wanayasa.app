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
import { getCookie, getCurrentUser } from '../lib/auth';
import { recordAIGeneration } from '../lib/telemetry';
import { type AppBindings } from '../types/env';

const presentation = new Hono<{ Bindings: AppBindings }>();

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
    await ai.loadProviders(c.env.DB);
    return ai;
}

function resolveProviderSlug(provider?: string): string {
    const slugMap: Record<string, string> = {
        vertex: 'vertex-proxy',
        gemini: 'gemini-flash',
        bedrock: 'bedrock-claude',
        mistral: 'mistral-large',
        z_ai: 'glm4-flash'
    };
    return (provider && slugMap[provider]) || provider || 'gemini-flash';
}

function normalizeRawOutline(raw: any, topik: string): { title: string; subtitle?: string; outline: any[] } {
    let title = topik;
    let subtitle: string | undefined = undefined;
    let rawList: any[] = [];

    if (Array.isArray(raw)) {
        rawList = raw;
    } else if (raw && typeof raw === 'object') {
        title = raw.title || raw.judul || topik;
        subtitle = raw.subtitle || raw.subjudul;
        rawList = Array.isArray(raw.outline) ? raw.outline : (Array.isArray(raw.slides) ? raw.slides : []);
    }

    const outline = rawList.map((item: any, idx: number) => {
        if (!item || typeof item !== 'object') {
            return {
                index: idx + 1,
                title: String(item || `Slide ${idx + 1}`),
                layout: 'content',
                focus: 'Fokus materi pembelajaran'
            };
        }
        return {
            index: Number(item.index) || (idx + 1),
            title: String(item.title || item.judul || `Slide ${idx + 1}`),
            layout: String(item.layout || 'content'),
            focus: String(item.focus || item.fokus || item.desc || 'Fokus materi utama'),
            visualConcept: item.visualConcept ? String(item.visualConcept) : undefined
        };
    });

    return { title, subtitle, outline };
}

function stripMarkdownBold(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
}

function extractSafeText(val: any, fallback: string = ''): string {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return stripMarkdownBold(val.trim());
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
        if (val.text) return extractSafeText(val.text);
        if (val.title && val.desc) return `${extractSafeText(val.title)}: ${extractSafeText(val.desc)}`;
        if (val.title && val.text) return `${extractSafeText(val.title)}: ${extractSafeText(val.text)}`;
        if (val.point) return extractSafeText(val.point);
        if (val.desc) return extractSafeText(val.desc);
        if (val.title) return extractSafeText(val.title);
        if (val.name) return extractSafeText(val.name);
        try {
            return stripMarkdownBold(JSON.stringify(val));
        } catch {
            return fallback;
        }
    }
    return String(val);
}

function normalizeRawSlides(raw: any, topik: string, mataPelajaran: string): { title: string; subtitle?: string; slides: PresentationSlide[] } {
    let title = topik;
    let subtitle: string | undefined = undefined;
    let rawList: any[] = [];

    if (Array.isArray(raw)) {
        rawList = raw;
    } else if (raw && typeof raw === 'object') {
        title = raw.title || raw.judul || (raw.presentation && raw.presentation.title) || topik;
        subtitle = raw.subtitle || raw.subjudul || (raw.presentation && raw.presentation.subtitle);
        rawList = Array.isArray(raw.slides)
            ? raw.slides
            : (Array.isArray(raw.slide)
                ? raw.slide
                : (Array.isArray(raw.presentation?.slides)
                    ? raw.presentation.slides
                    : (Array.isArray(raw.data?.slides) ? raw.data.slides : [])));
    }

    const validLayouts = new Set([
        'title', 'content', 'twoColumn', 'imageText', 'timeline', 'stats',
        'comparison', 'quiz', 'flipcard', 'activity', 'quote', 'summary', 'thankyou'
    ]);

    const slides: PresentationSlide[] = rawList.map((item: any, index: number) => {
        if (!item || typeof item !== 'object') {
            return {
                layout: 'content',
                title: `Materi ${index + 1}`,
                content: [extractSafeText(item, 'Poin materi inti pembelajaran')],
                speakerNotes: 'Ajak siswa berdiskusi aktif mengenai poin ini.',
            };
        }

        const layout = validLayouts.has(item.layout) ? item.layout : 'content';
        const slideTitle = extractSafeText(item.title || item.judul, `Slide ${index + 1}`);
        const slideSubtitle = item.subtitle || item.subjudul ? extractSafeText(item.subtitle || item.subjudul) : undefined;

        // Content normalization (Zero [object Object])
        let content: string[] = [];
        if (Array.isArray(item.content)) {
            content = item.content
                .map((cItem: any) => extractSafeText(cItem))
                .filter((t: string) => t.length > 0);
        } else if (item.content) {
            content = [extractSafeText(item.content)];
        }

        // Two Column / Comparison normalization
        let leftTitle = extractSafeText(item.leftTitle || item.left_title, 'Konsep A');
        let leftContent: string[] = [];
        if (Array.isArray(item.leftContent || item.left_content)) {
            leftContent = (item.leftContent || item.left_content)
                .map((i: any) => extractSafeText(i))
                .filter((t: string) => t.length > 0);
        } else if (item.leftContent || item.left_content) {
            leftContent = [extractSafeText(item.leftContent || item.left_content)];
        }

        let rightTitle = extractSafeText(item.rightTitle || item.right_title, 'Konsep B');
        let rightContent: string[] = [];
        if (Array.isArray(item.rightContent || item.right_content)) {
            rightContent = (item.rightContent || item.right_content)
                .map((i: any) => extractSafeText(i))
                .filter((t: string) => t.length > 0);
        } else if (item.rightContent || item.right_content) {
            rightContent = [extractSafeText(item.rightContent || item.right_content)];
        }

        // Smart two-column split fallback if AI put everything in content
        if ((layout === 'twoColumn' || layout === 'comparison') && leftContent.length === 0 && rightContent.length === 0) {
            if (content.length >= 2) {
                const mid = Math.ceil(content.length / 2);
                leftContent = content.slice(0, mid);
                rightContent = content.slice(mid);
            } else if (content.length === 1) {
                leftContent = content;
                rightContent = [`Penjelasan lebih lanjut mengenai ${slideTitle}.`];
            }
            // If both still empty, leave undefined — frontend will show edit placeholder
        }

        // Timeline normalization (Anti-Empty)
        let timeline: Array<{ step?: string; title: string; desc: string }> | undefined = undefined;
        if (Array.isArray(item.timeline) && item.timeline.length > 0) {
            timeline = item.timeline.map((st: any, i: number) => {
                if (typeof st === 'string') {
                    return { step: String(i + 1), title: `Langkah ${i + 1}`, desc: extractSafeText(st) };
                }
                return {
                    step: extractSafeText(st.step, String(i + 1)),
                    title: extractSafeText(st.title || st.name, `Tahap ${i + 1}`),
                    desc: extractSafeText(st.desc || st.description || st.content || st.text, 'Penjelasan langkah pembelajaran.')
                };
            });
        } else if (layout === 'timeline') {
            // Synthesize steps from content if available
            if (content.length >= 2) {
                timeline = content.slice(0, 4).map((c, i) => ({
                    step: String(i + 1),
                    title: `Langkah ${i + 1}`,
                    desc: c
                }));
            } else {
                timeline = [
                    { step: '1', title: 'Pengenalan Konsep', desc: `Memahami konsep dasar tentang ${slideTitle}.` },
                    { step: '2', title: 'Eksplorasi Materi', desc: `Mengamati dan menganalisis materi ${topik} secara bertahap.` },
                    { step: '3', title: 'Pemahaman Mendalam', desc: `Menyimpulkan poin-poin kunci dan menghubungkan dengan kehidupan sehari-hari.` }
                ];
            }
        }

        // Stats normalization (Anti-Empty)
        let stats: Array<{ value: string; label: string; desc?: string }> | undefined = undefined;
        if (Array.isArray(item.stats) && item.stats.length > 0) {
            stats = item.stats.map((st: any, i: number) => {
                if (typeof st === 'string') {
                    return { value: '1/2 = 0,5', label: extractSafeText(st) };
                }
                return {
                    value: extractSafeText(st.value || st.angka || st.stat, '100%'),
                    label: extractSafeText(st.label || st.title || st.name, `Fakta Kunci ${i + 1}`),
                    desc: st.desc ? extractSafeText(st.desc) : undefined
                };
            });
        } else if (layout === 'stats') {
            // Generate topic-aware placeholder stats
            stats = [
                { value: '📌', label: 'Fakta Utama', desc: `Informasi kunci tentang ${slideTitle}` },
                { value: '💡', label: 'Tahukah Kamu?', desc: `Fakta menarik seputar ${topik}` },
                { value: '🎯', label: 'Poin Penting', desc: `Hal yang wajib diingat siswa` }
            ];
        }

        // Quiz normalization (Anti-Empty with 4 options guaranteed)
        let question: string | undefined = undefined;
        let quizOptions: string[] | undefined = undefined;
        let quizAnswer: string | undefined = undefined;
        let quizExplanation: string | undefined = undefined;

        if (Array.isArray(item.question) && item.question.length > 0) {
            const q0 = item.question[0];
            if (typeof q0 === 'object') {
                question = extractSafeText(q0.text || q0.question || q0.prompt || slideTitle);
                if (Array.isArray(q0.quizOptions || q0.options)) {
                    quizOptions = (q0.quizOptions || q0.options).map((o: any) => extractSafeText(o));
                }
                quizAnswer = q0.quizAnswer ? extractSafeText(q0.quizAnswer) : 'A';
                quizExplanation = q0.quizExplanation ? extractSafeText(q0.quizExplanation) : undefined;
            } else {
                question = extractSafeText(q0);
            }
        } else if (item.question) {
            question = extractSafeText(item.question);
        }

        if (!quizOptions && Array.isArray(item.quizOptions || item.options)) {
            quizOptions = (item.quizOptions || item.options).map((o: any) => extractSafeText(o));
        }
        if (!quizAnswer && (item.quizAnswer || item.answer)) {
            quizAnswer = extractSafeText(item.quizAnswer || item.answer);
        }
        if (!quizExplanation && (item.quizExplanation || item.explanation)) {
            quizExplanation = extractSafeText(item.quizExplanation || item.explanation);
        }

        if (layout === 'quiz') {
            question = question || `Pertanyaan kuis tentang ${slideTitle}`;
            if (!quizOptions || quizOptions.length < 2) {
                quizOptions = [
                    'A. Pilihan jawaban pertama',
                    'B. Pilihan jawaban kedua',
                    'C. Pilihan jawaban ketiga',
                    'D. Pilihan jawaban keempat'
                ];
                quizAnswer = quizAnswer || 'A';
                quizExplanation = quizExplanation || `Penjelasan jawaban yang benar berdasarkan materi ${topik}.`;
            }
        }

        // Flipcards normalization (Anti-Empty)
        let flipcards: Array<{ front: string; back: string }> | undefined = undefined;
        if (Array.isArray(item.flipcards) && item.flipcards.length > 0) {
            flipcards = item.flipcards.map((fc: any, i: number) => {
                if (typeof fc === 'string') {
                    return { front: `Konsep ${i + 1}`, back: extractSafeText(fc) };
                }
                return {
                    front: extractSafeText(fc.front || fc.term || fc.card || fc.question, `Konsep ${i + 1}`),
                    back: extractSafeText(fc.back || fc.definition || fc.answer || fc.explanation || fc.desc, 'Penjelasan konsep penting.')
                };
            });
        } else if (layout === 'flipcard') {
            flipcards = [
                { front: `Konsep 1: ${slideTitle}`, back: `Penjelasan konsep utama tentang ${topik}.` },
                { front: 'Konsep 2', back: 'Klik untuk menambahkan penjelasan.' },
                { front: 'Konsep 3', back: 'Klik untuk menambahkan penjelasan.' },
                { front: 'Konsep 4', back: 'Klik untuk menambahkan penjelasan.' }
            ];
        }

        const instruction = item.instruction ? extractSafeText(item.instruction) : undefined;
        const time = item.time ? extractSafeText(item.time) : undefined;
        const groupSize = item.groupSize ? extractSafeText(item.groupSize) : undefined;
        const materials = item.materials ? extractSafeText(item.materials) : undefined;
        const quote = item.quote ? extractSafeText(item.quote) : undefined;
        const author = item.author ? extractSafeText(item.author) : undefined;
        const imageQuery = item.imageQuery ? extractSafeText(item.imageQuery) : `${topik} ${mataPelajaran} ${slideTitle}`.trim();
        const imageAlt = item.imageAlt ? extractSafeText(item.imageAlt) : slideTitle;
        const speakerNotes = sanitizeSpeakerNotes(item.speakerNotes) || `Ajak siswa berinteraksi aktif dengan mengajukan pertanyaan pemantik mengenai ${slideTitle}.`;

        return {
            layout,
            title: slideTitle,
            subtitle: slideSubtitle,
            content: content.length > 0 ? content : (layout === 'content' ? [`Poin materi utama tentang ${slideTitle}.`] : undefined),
            leftTitle,
            leftContent: leftContent.length > 0 ? leftContent : undefined,
            rightTitle,
            rightContent: rightContent.length > 0 ? rightContent : undefined,
            instruction,
            time,
            groupSize,
            materials,
            quote,
            author,
            question,
            quizOptions,
            quizAnswer,
            quizExplanation,
            timeline,
            stats,
            flipcards,
            imageQuery,
            imageAlt,
            speakerNotes
        };
    });

    return { title, subtitle, slides };
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

        const prompt = `Kamu adalah Ahli Desain Media Visual Pembelajaran Interaktif Sekolah (Pedagogical Architect & Visual Designer).
Tugasmu: Rancang outline presentasi sebanyak TEPAT ${slideCount} slide yang MEMIKAT PERHATIAN VISUAL SISWA dan MEMUDAHKAN SISWA MEMAHAMI MATERI.

PROMPT / TOPIK PEMBELAJARAN DARI GURU:
"${topik}"
(Pahami mata pelajaran, jenjang kelas, materi pokok, dan sasaran usia siswa dari prompt di atas secara otomatis).

PRINSIP UTAMA KONTEN SLIDE SISWA (WAJIB DIIKUTI):
1. 🎯 FOKUS KEPADA SISWA: Konten slide adalah untuk ditampilkan di layar proyektor kepada murid di kelas. JANGAN masukkan istilah dokumen guru (seperti "Sintaks RPP", "Metode PBL", "Apersepsi Guru", "Indikator Capaian CP").
2. 👁️ PENDEKATAN KONKRET (KHUSUS MATEMATIKA / EKSAK):
   - Gunakan analogi visual nyata (Pizza, balok arsiran, garis bilangan).
   - Pastikan ada slide pengenalan konsep konkret, slide langkah kerja hitung bertahap (timeline), slide tabel ekuivalensi/perbandingan (twoColumn/stats), dan kuis evaluasi.
3. 🚀 KERAGAMAN LAYOUT: Susun urutan layout yang dinamis dan bervariasi (title, imageText, twoColumn, timeline, stats, comparison, activity, flipcard, quiz, summary).
4. 🔢 JUMLAH SLIDE: TEPAT ${slideCount} slide terisi berurutan dari index 1 sampai ${slideCount}.

Balas HANYA JSON: {"title":"Judul Singkat Menarik","subtitle":"Subjudul Materi","outline":[{"index":1,"title":"...","layout":"title|content|twoColumn|imageText|timeline|stats|comparison|quiz|flipcard|activity|quote|summary|thankyou","focus":"Fokus materi yang dipelajari murid...","visualConcept":"Konsep visual foto / ilustrasi yang cocok..."}]}
`;

        const result = await ai.generateJSON(prompt, resolveProviderSlug(aiProvider));
        const normalized = normalizeRawOutline(result, topik);
        const validatedResult = validate(presentationOutlineResponseSchema, normalized);

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
IKUTI OUTLINE TEPAT YANG SUDAH DISETUJUI BERIKUT (${customOutline.length} slide):
${JSON.stringify(customOutline, null, 2)}
`
            : `
RANCANG TEPAT ${count} SLIDE SECARA BERTAHAP DENGAN ALUR VISUAL YANG MEMIKAT SISWA:
- Slide 1: 'title' (Cover memukau + pertanyaan pemantik yang membuat murid penasaran)
- Slide 2: 'imageText' atau 'twoColumn' (Konsep pengantar visual yang menarik perhatian)
- Slide 3 s.d. ${count - 3}: Eksplorasi materi bertahap & mendalam (variasikan layout: 'content', 'imageText', 'twoColumn', 'timeline', 'stats', 'comparison', 'activity')
- Slide ${count - 2}: 'flipcard' atau 'activity' (Kartu konsep interaktif tebak-tebakan atau tantangan belajar siswa)
- Slide ${count - 1}: 'quiz' (Kuis seru pemantik evaluasi kelas dengan pilihan A-D dan pembahasan)
- Slide ${count}: 'summary' atau 'thankyou' (Rangkuman poin kunci yang mudah diingat & salam penguatan)
`;

        const prompt = `Kamu adalah Desainer Media Visual Pembelajaran Interaktif Sekolah Kelas Dunia (Multi-Agent Pedagogical & Visual Engine).
Tugasmu: Buat slide presentasi pembelajaran yang SANGAT MEMIKAT VISUAL, MUDAH DIPAHAMI MURID, dan INTERAKTIF sebanyak TEPAT ${count} slide.

PROMPT / TOPIK PEMBELAJARAN DARI GURU:
"${topik}"
(Pahami mata pelajaran, jenjang kelas, materi pokok, dan sasaran usia siswa dari prompt di atas secara otomatis).

${outlineConstraint}

PRINSIP KONTEN SLIDE VISUAL MURID (ATURAN KETAT):
1. 🎯 FOKUS 100% PADA PEMAHAMAN & PERHATIAN MURID:
   - Konten slide adalah materi yang dilihat langsung oleh murid di layar kelas.
   - JANGAN TULIS istilah metodologi/dokumen guru di slide siswa (seperti "Skenario PBL", "Fase Apersepsi", "Indikator Capaian", "Tujuan RPP").
   - Gunakan bahasa yang hidup, komunikatif, analogi sederhana, dan mudah dipahami siswa.

2. 📐 PEDAGOGIK KHUSUS MATEMATIKA / SAINS / MATERI EKSAK:
   - Jika materi Matematika (seperti Pecahan & Desimal):
     * Wajib gunakan model konkret (potongan pizza/kue, balok pecahan, garis bilangan).
     * Pada layout 'timeline': Tuliskan 3 langkah kerja hitung nyata berurutan dengan contoh angka jelas (misal cara mengubah 1/2 menjadi 0,5).
     * Pada layout 'twoColumn' / 'comparison': Sajikan perbandingan ekuivalen (Bentuk Pecahan Biasa vs Bentuk Desimal: 1/2 = 0,5 | 1/4 = 0,25 | 3/4 = 0,75).
     * Pada layout 'stats': Tampilkan pasangan angka penting (misal "1/2 = 0,5", "1/4 = 0,25", "3/4 = 0,75").

3. 👁️ DESAIN VISUAL & KEJELASAN INFORMASI:
   - Setiap poin pada "content" WAJIB ringkas, padat, dan diawali kata kunci tebal (Contoh: "🍕 **Analogi Pizza**: Satu loyang pizza dipotong menjadi dua bagian sama besar.").
   - Batasi maksimal 3-4 poin per slide agar tidak membosankan.
   - Layout WAJIB diisi LENGKAP tanpa ada yang kosong:
     * 'imageText' ➔ visualisasi konsep utama dengan kata kunci pencarian foto Inggris spesifik ("imageQuery").
     * 'timeline' ➔ 3-4 langkah berurutan ("timeline": [{"step": "1", "title": "...", "desc": "..."}]).
     * 'stats' ➔ 3 fakta unik berupa angka menonjol ("stats": [{"value": "1/2 = 0,5", "label": "Setengah", "desc": "..."}]).
     * 'twoColumn' ➔ perbandingan bermakna ("leftTitle", "leftContent": ["..."], "rightTitle", "rightContent": ["..."]).
     * 'flipcard' ➔ 4 kartu konsep bolak-balik interaktif ("flipcards": [{"front": "...", "back": "..."}]).
     * 'quiz' ➔ kuis interaktif kelas LENGKAP dengan 4 opsi ("question", "quizOptions": ["A. ...", "B. ...", "C. ...", "D. ..."], "quizAnswer": "A", "quizExplanation": "...").
     * 'activity' ➔ tantangan seru diskusi siswa ("instruction", "time": "15 Menit", "groupSize": "Kelompok 4 Siswa").

4. 🎙️ PANDUAN GURU HANYA DI "speakerNotes":
   - Masukkan petunjuk mengajar, pertanyaan pancingan guru ke siswa, dan panduan fasilitasi ke dalam "speakerNotes" (1-2 kalimat praktis untuk guru yang mengajar di depan kelas).

KEMBALIKAN HANYA DALAM FORMAT JSON VALID:
{
  "title": "${topik}",
  "subtitle": "Materi ${mataPelajaran} - ${jenjangKelas}",
  "slides": [
    {
      "layout": "title | content | twoColumn | imageText | timeline | stats | comparison | quiz | flipcard | activity | quote | summary | thankyou",
      "title": "Judul Slide yang Menarik",
      "subtitle": "Subjudul (opsional)",
      "content": ["🌟 **Poin Kunci**: Penjelasan singkat dan jelas."],
      "speakerNotes": "Catatan panduan guru saat menampilkan slide ini...",
      "imageQuery": "specific english search query for educational image"
    }
  ]
}
`;

        const result = await ai.generateJSON(prompt, resolveProviderSlug(aiProvider));
        const normalizedResult = normalizeRawSlides(result, topik, mataPelajaran);
        const validatedResult = validate(presentationResponseSchema, normalizedResult);

        if (!validatedResult.success) {
            console.error('AI Output Validation Failed:', JSON.stringify(result, null, 2));
            return Errors.validation(c, 'Output AI tidak sesuai schema presentasi', validatedResult.errors);
        }

        const presentationData = validatedResult.data;
        const slides: PresentationSlide[] = presentationData.slides;

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

        // Record usage telemetry for school & teacher analytics
        try {
            const sessionId = getCookie(c.req.header('Cookie'), 'session');
            const user = await getCurrentUser(c.env.DB, sessionId);
            await recordAIGeneration(c.env.DB, {
                user_id: user?.id || 1,
                user_nama: user?.nama || 'Guru',
                sekolah: user?.sekolah || 'SDN 2 Nangerang',
                feature_type: 'SLIDE',
                mata_pelajaran: mataPelajaran,
                topik: topik,
                jenjang_kelas: jenjangKelas,
                ai_provider: aiProvider,
            });
        } catch (_) {}

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

        const result = await ai.generateJSON(prompt, resolveProviderSlug(aiProvider));
        const patchedSlideData = result?.slide || result?.data || result;
        const validatedResult = validate(baseSlideSchema, patchedSlideData);
        if (!validatedResult.success) {
            console.error('Patch Slide Validation Failed:', JSON.stringify(result, null, 2));
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
