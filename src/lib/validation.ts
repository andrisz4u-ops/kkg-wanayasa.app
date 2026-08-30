/**
 * Validation Schemas using Zod
 * Centralized input validation for all API endpoints
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

export const emailSchema = z
    .string()
    .email('Format email tidak valid')
    .max(255, 'Email terlalu panjang');

export const passwordSchema = z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(128, 'Password terlalu panjang')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka');

export const namaSchema = z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama terlalu panjang');

export const nipSchema = z
    .string()
    .regex(/^\d{18}$/, 'NIP harus 18 digit angka')
    .optional()
    .nullable();

export const phoneSchema = z
    .string()
    .regex(/^0\d{9,12}$/, 'Nomor HP tidak valid (contoh: 081234567890)')
    .optional()
    .nullable();

export const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (gunakan YYYY-MM-DD)');

export const timeSchema = z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Format waktu tidak valid (gunakan HH:MM)')
    .optional()
    .nullable();

export const idSchema = z.coerce
    .number()
    .int('ID harus berupa bilangan bulat')
    .positive('ID harus positif');

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password harus diisi'),
});

export const registerSchema = z.object({
    nama: namaSchema,
    email: emailSchema,
    password: passwordSchema,
    nip: z.string().max(18).optional().nullable(),
    no_hp: phoneSchema.or(z.literal('')).optional(),
    sekolah: z.string().max(100).optional().nullable(),
});

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'Password saat ini harus diisi'),
    new_password: passwordSchema,
});

// ============================================
// Surat Schemas
// ============================================

export const generateSuratSchema = z.object({
    jenis_kegiatan: z.string().min(1, 'Jenis kegiatan harus diisi').max(100),
    tanggal_kegiatan: dateSchema,
    waktu_kegiatan: z.string().min(1, 'Waktu kegiatan harus diisi').max(50),
    tempat_kegiatan: z.string().min(1, 'Tempat kegiatan harus diisi').max(200),
    agenda: z.string().min(1, 'Agenda harus diisi').max(2000),
    peserta: z.union([z.string(), z.array(z.string())]).optional().nullable(),
    penanggung_jawab: z.string().max(100).optional().nullable(),
    model: z.enum(['mistral', 'z_ai', 'gemini', 'bedrock', 'vertex']).optional().default('vertex'),
});

// ============================================
// Proker Schemas
// ============================================

export const kegiatanProkerSchema = z.object({
    nama_kegiatan: z.string().min(1, 'Nama kegiatan harus diisi').max(200),
    waktu_pelaksanaan: z.string().max(100).optional().nullable(),
    penanggung_jawab: z.string().max(100).optional().nullable(),
    anggaran: z.string().max(50).optional().nullable(),
    indikator: z.string().max(500).optional().nullable(),
});

export const generateProkerSchema = z.object({
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran tidak valid (contoh: 2025/2026)'),
    visi: z.string().min(10, 'Visi harus diisi minimal 10 karakter').max(1000),
    misi: z.string().min(10, 'Misi harus diisi minimal 10 karakter').max(2000),
    kegiatan: z.array(kegiatanProkerSchema).min(1, 'Minimal satu kegiatan harus diisi'),
    analisis_kebutuhan: z.string().max(3000).optional().nullable(),
});

// ============================================
// Kegiatan & Absensi Schemas
// ============================================

export const createKegiatanSchema = z.object({
    nama_kegiatan: z.string().min(1, 'Nama kegiatan harus diisi').max(200),
    tanggal: dateSchema,
    waktu_mulai: timeSchema,
    waktu_selesai: timeSchema,
    tempat: z.string().max(200).optional().nullable(),
    deskripsi: z.string().max(2000).optional().nullable(),
});

export const checkinSchema = z.object({
    kegiatan_id: idSchema,
    keterangan: z.string().max(500).optional().nullable(),
});

// ============================================
// Materi Schemas
// ============================================

export const createMateriSchema = z.object({
    judul: z.string().min(1, 'Judul harus diisi').max(200),
    deskripsi: z.string().max(2000).optional().nullable(),
    kategori: z.string().max(50).optional().nullable(),
    jenjang: z.enum(['SD', 'SMP', 'SMA']).optional().nullable(),
    jenis: z.enum(['RPP', 'Modul', 'Silabus', 'Media Ajar', 'Soal', 'Lainnya']).optional().nullable(),
    file_url: z.string().url('URL file tidak valid').optional().nullable(),
});

// ============================================
// Presentation Schemas
// ============================================

export const presentationOutlineItemSchema = z.object({
    index: z.coerce.number().int().optional().default(1),
    title: z.string().max(200).optional().default('Judul Slide'),
    layout: z.string().optional().default('content'),
    focus: z.string().max(500).optional().default('Fokus materi utama'),
    visualConcept: z.string().max(200).optional(),
});

export const presentationOutlineSchema = z.object({
    mataPelajaran: z.string().max(120).optional().default('IPAS'),
    topik: z.string().min(1, 'Topik harus diisi').max(2000),
    jenjangKelas: z.string().max(80).optional().default('Kelas 5'),
    semester: z.string().max(20).optional().default('1'),
    alokasiWaktu: z.string().max(100).optional().default('2 x 35 menit'),
    strategi: z.string().max(120).optional().default('Problem Based Learning'),
    profilSosial: z.string().max(160).optional().nullable(),
    capaianPembelajaran: z.string().max(1000).optional().nullable(),
    slideCount: z.coerce.number().int().min(3).max(30).default(8),
    aiProvider: z.string().optional(),
});

export const presentationOutlineResponseSchema = z.object({
    title: z.string().max(200).optional().default('Presentasi Pembelajaran'),
    subtitle: z.string().max(220).optional(),
    outline: z.array(presentationOutlineItemSchema).min(1).max(30),
});

export const presentationGenerateSchema = z.object({
    mataPelajaran: z.string().max(120).optional().default('IPAS'),
    topik: z.string().min(1, 'Topik harus diisi').max(2000),
    jenjangKelas: z.string().max(80).optional().default('Kelas 5'),
    semester: z.string().max(20).optional().default('1'),
    alokasiWaktu: z.string().max(100).optional().default('2 x 35 menit'),
    strategi: z.string().max(120).optional().default('Problem Based Learning'),
    profilSosial: z.string().max(160).optional().nullable(),
    capaianPembelajaran: z.string().max(1000).optional().nullable(),
    slideCount: z.coerce.number().int().min(3).max(30).default(8),
    aiProvider: z.string().optional(),
    template: z.string().max(80).optional(),
    customOutline: z.array(presentationOutlineItemSchema.passthrough()).optional(),
});

const speakerNotesSchema = z
    .string()
    .max(2500, 'Speaker notes terlalu panjang')
    .optional()
    .nullable();

export const presentationImageSchema = z.object({
    source: z.literal('unsplash'),
    url: z.string().url('URL gambar tidak valid'),
    alt: z.string().max(180).optional().default('Foto edukasi'),
    query: z.string().max(120).optional().default('pendidikan'),
    creditName: z.string().max(100).optional().default('Unsplash'),
    creditUrl: z.string().optional().default('https://unsplash.com'),
    unsplashId: z.string().max(80).optional().default('image'),
});

export const baseSlideSchema = z.object({
    layout: z.string().optional().default('content'),
    title: z.any().transform(v => String(v || 'Judul Slide')).optional().default('Judul Slide'),
    subtitle: z.any().transform(v => v ? String(v) : undefined).optional(),
    content: z.any().transform(v => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map(i => typeof i === 'string' ? i : (i.point || i.text || i.desc ? `${i.title ? i.title + ': ' : ''}${i.text || i.point || i.desc || ''}` : JSON.stringify(i)));
        return [String(v)];
    }).optional().default([]),
    leftTitle: z.any().transform(v => v ? String(v) : 'Ciri-ciri').optional().default('Ciri-ciri'),
    leftContent: z.any().transform(v => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map(i => typeof i === 'string' ? i : (i.point || i.text || JSON.stringify(i)));
        return [String(v)];
    }).optional().default([]),
    rightTitle: z.any().transform(v => v ? String(v) : 'Contoh').optional().default('Contoh'),
    rightContent: z.any().transform(v => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map(i => typeof i === 'string' ? i : (i.point || i.text || JSON.stringify(i)));
        return [String(v)];
    }).optional().default([]),
    instruction: z.any().transform(v => v ? String(v) : undefined).optional(),
    time: z.any().transform(v => v ? String(v) : undefined).optional(),
    groupSize: z.any().transform(v => v ? String(v) : undefined).optional(),
    materials: z.any().transform(v => v ? String(v) : undefined).optional(),
    quote: z.any().transform(v => v ? String(v) : undefined).optional(),
    author: z.any().transform(v => v ? String(v) : undefined).optional(),
    question: z.any().optional(),
    message: z.any().transform(v => v ? String(v) : undefined).optional(),
    teacher: z.any().transform(v => v ? String(v) : undefined).optional(),
    school: z.any().transform(v => v ? String(v) : undefined).optional(),
    icon: z.any().transform(v => v ? String(v) : undefined).optional(),
    timeline: z.array(z.any()).optional(),
    stats: z.array(z.any()).optional(),
    quizOptions: z.any().optional(),
    quizAnswer: z.any().optional(),
    quizExplanation: z.any().optional(),
    flipcards: z.array(z.any()).optional(),
    imageQuery: z.any().transform(v => v ? String(v) : undefined).optional(),
    imageAlt: z.any().transform(v => v ? String(v) : undefined).optional(),
    image: z.any().optional(),
    speakerNotes: z.any().transform(v => v ? String(v) : undefined).optional(),
}).passthrough().transform((slide: any) => {
    // If question is an array of objects (e.g. Mistral format)
    if (Array.isArray(slide.question) && slide.question.length > 0) {
        const q0 = slide.question[0];
        if (typeof q0 === 'object' && q0 !== null) {
            if (!slide.quizOptions && Array.isArray(q0.quizOptions)) {
                slide.quizOptions = q0.quizOptions.map((o: any) => typeof o === 'string' ? o : (o.text ? `${o.option || ''} ${o.text}`.trim() : JSON.stringify(o)));
            }
            if (!slide.quizAnswer && q0.quizAnswer) {
                slide.quizAnswer = String(q0.quizAnswer);
            }
            if (!slide.quizExplanation && q0.quizExplanation) {
                slide.quizExplanation = String(q0.quizExplanation);
            }
            slide.question = String(q0.text || q0.question || q0.prompt || slide.title || 'Pertanyaan Kuis');
        } else {
            slide.question = String(slide.question[0]);
        }
    } else if (slide.question && typeof slide.question === 'object') {
        const q = slide.question as any;
        if (!slide.quizOptions && Array.isArray(q.quizOptions)) {
            slide.quizOptions = q.quizOptions.map((o: any) => typeof o === 'string' ? o : (o.text ? `${o.option || ''} ${o.text}`.trim() : JSON.stringify(o)));
        }
        if (!slide.quizAnswer && q.quizAnswer) slide.quizAnswer = String(q.quizAnswer);
        if (!slide.quizExplanation && q.quizExplanation) slide.quizExplanation = String(q.quizExplanation);
        slide.question = String(q.text || q.question || slide.title || 'Pertanyaan Kuis');
    } else if (slide.question) {
        slide.question = String(slide.question);
    }

    if (Array.isArray(slide.quizOptions)) {
        slide.quizOptions = slide.quizOptions.map((o: any) => typeof o === 'string' ? o : (o.text ? `${o.option || ''} ${o.text}`.trim() : JSON.stringify(o)));
    } else if (slide.quizOptions) {
        slide.quizOptions = [String(slide.quizOptions)];
    }

    if (slide.quizAnswer) slide.quizAnswer = String(slide.quizAnswer);
    if (slide.quizExplanation) slide.quizExplanation = String(slide.quizExplanation);

    return slide;
});

export const presentationResponseSchema = z.object({
    title: z.any().transform(v => String(v || 'Presentasi Pembelajaran')).optional().default('Presentasi Pembelajaran'),
    subtitle: z.any().transform(v => v ? String(v) : undefined).optional(),
    slides: z.array(baseSlideSchema).min(1).max(50),
}).passthrough();

export const presentationPatchSlideSchema = z.object({
    currentSlide: baseSlideSchema,
    instruction: z.string().min(1, 'Instruksi revisi harus diisi').max(2000),
    mataPelajaran: z.string().max(120).optional(),
    topik: z.string().max(200).optional(),
    jenjangKelas: z.string().max(80).optional(),
    aiProvider: z.string().optional(),
});

export type PresentationOutlineInput = z.infer<typeof presentationOutlineSchema>;
export type PresentationOutlineItem = z.infer<typeof presentationOutlineItemSchema>;
export type PresentationOutlineOutput = z.infer<typeof presentationOutlineResponseSchema>;
export type PresentationGenerateInput = z.infer<typeof presentationGenerateSchema>;
export type PresentationSlide = z.infer<typeof baseSlideSchema>;
export type PresentationOutput = z.infer<typeof presentationResponseSchema>;
export type PresentationPatchSlideInput = z.infer<typeof presentationPatchSlideSchema>;

// ============================================
// Forum Schemas
// ============================================

export const createThreadSchema = z.object({
    judul: z.string().min(5, 'Judul minimal 5 karakter').max(200),
    isi: z.string().min(10, 'Isi minimal 10 karakter').max(10000),
    kategori: z.enum(['umum', 'best-practice', 'kurikulum', 'teknologi', 'tanya-jawab']).optional(),
});

export const createReplySchema = z.object({
    isi: z.string().min(2, 'Balasan minimal 2 karakter').max(5000),
});

// ============================================
// Pengumuman Schemas
// ============================================

export const createPengumumanSchema = z.object({
    judul: z.string().min(5, 'Judul minimal 5 karakter').max(200),
    isi: z.string().min(10, 'Isi minimal 10 karakter').max(10000),
    kategori: z.enum(['umum', 'jadwal', 'kegiatan', 'penting']).optional(),
    is_pinned: z.boolean().optional(),
});

// ============================================
// Profile Schemas
// ============================================

export const updateProfileSchema = z.object({
    nama: namaSchema,
    nip: z.string().max(18).optional().nullable(),
    sekolah: z.string().max(100).optional().nullable(),
    mata_pelajaran: z.string().max(100).optional().nullable(),
    no_hp: phoneSchema.or(z.literal('')).optional().nullable(),
    alamat: z.string().max(500).optional().nullable(),
});

// ============================================
// Admin Schemas
// ============================================

export const updateRoleSchema = z.object({
    role: z.enum(['admin', 'operator', 'user'], {
        message: 'Role harus admin, operator, atau user'
    }),
});

export const resetPasswordSchema = z.object({
    new_password: passwordSchema,
});

export const updateSettingsSchema = z.object({
    mistral_api_key: z.string().max(200).optional(),
    z_ai_api_key: z.string().max(200).optional(),
    gemini_api_key: z.string().max(200).optional(),
    bedrock_api_key: z.string().max(500).optional(),
    vertex_api_key: z.string().max(200).optional(),
    vertex_project_id: z.string().max(100).optional(),
    supabase_url: z.string().max(255).optional(),
    supabase_key: z.string().max(500).optional(),
    supabase_bucket: z.string().max(100).optional(),
    nama_ketua: z.string().max(100).optional(),
    tahun_ajaran: z.string().max(20).optional(),
    alamat_sekretariat: z.string().max(500).optional(),
});

// Extended admin schemas for better validation
export const createUserAdminSchema = z.object({
    nama: namaSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['admin', 'operator', 'user']).default('user'),
    sekolah: z.string().max(100).optional().nullable(),
    nip: z.string().max(20).optional().nullable(),
});

export const updateUserAdminSchema = z.object({
    nama: namaSchema.optional(),
    email: emailSchema.optional(),
    sekolah: z.string().max(100).optional().nullable(),
    role: z.enum(['admin', 'operator', 'user']).optional(),
    nip: z.string().max(30).optional().nullable(),
});

export const listUsersQuerySchema = z.object({
    search: z.string().max(100).optional(),
    role: z.enum(['admin', 'operator', 'user']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

export const auditLogsQuerySchema = z.object({
    user_id: z.coerce.number().positive().optional(),
    action: z.string().max(50).optional(),
    entity_type: z.string().max(50).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
});

export const bulkApproveSchema = z.object({
    user_ids: z.array(z.number().positive()).min(1).max(100),
});

export const cleanupLogsSchema = z.object({
    days_to_keep: z.number().int().min(7).max(365).default(90),
});

// ============================================
// Validation Helper
// ============================================

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; errors: { field: string; message: string }[] };

/**
 * Validate data against a Zod schema
 * Returns structured errors for API responses
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Zod v4 uses .issues instead of .errors
    const issues = result.error.issues || (result.error as any).errors || [];
    const errors = issues.map((err: any) => ({
        field: (err.path || []).join('.') || 'root',
        message: err.message,
    }));

    return { success: false, errors };
}

/**
 * Create validation middleware for Hono
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
    return async (c: any, next: () => Promise<void>) => {
        try {
            const body = await c.req.json();
            const result = validate(schema, body);

            if (!result.success) {
                return c.json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Data tidak valid',
                        details: result.errors,
                    }
                }, 400);
            }

            // Store validated data in context
            c.set('validatedBody', result.data);
            await next();
        } catch (e) {
            return c.json({
                success: false,
                error: {
                    code: 'INVALID_JSON',
                    message: 'Format JSON tidak valid',
                }
            }, 400);
        }
    };
}

/**
 * Validate URL parameter ID
 */
export function validateId(idParam: string): { valid: true; id: number } | { valid: false; message: string } {
    const result = idSchema.safeParse(idParam);
    if (result.success) {
        return { valid: true, id: result.data };
    }
    return { valid: false, message: 'ID tidak valid' };
}

// ============================================
// AI Provider Schemas
// ============================================

export const aiProviderApiTypes = ['openai_compat', 'anthropic', 'gemini_sdk', 'bedrock', 'custom_proxy'] as const;

export const createAiProviderSchema = z.object({
    name: z.string().min(1, 'Nama provider wajib diisi').max(100, 'Nama terlalu panjang'),
    slug: z.string().min(1, 'Slug wajib diisi').max(50, 'Slug terlalu panjang')
        .regex(/^[a-z0-9][a-z0-9-]*$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung'),
    api_type: z.enum(aiProviderApiTypes, { message: 'Tipe API tidak valid' }),
    base_url: z.string().min(1, 'Base URL wajib diisi').max(500, 'URL terlalu panjang'),
    model: z.string().min(1, 'Model wajib diisi').max(200, 'Nama model terlalu panjang'),
    api_key: z.string().max(10000, 'API key terlalu panjang').optional().default(''),
    priority: z.coerce.number().int().min(1).max(999).optional().default(100),
    is_active: z.coerce.number().int().min(0).max(1).optional().default(1),
    max_tokens: z.coerce.number().int().min(1).max(131072).optional().default(8192),
    temperature: z.coerce.number().min(0).max(2).optional().default(0.7),
    extra_headers: z.string().max(2000).optional().default('{}'),
    extra_body: z.string().max(2000).optional().default('{}'),
});

export const updateAiProviderSchema = createAiProviderSchema.partial();
