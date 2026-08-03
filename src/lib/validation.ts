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

export const presentationGenerateSchema = z.object({
    mataPelajaran: z.string().min(2, 'Mata pelajaran harus diisi').max(120),
    topik: z.string().min(3, 'Topik harus diisi').max(200),
    jenjangKelas: z.string().min(1, 'Jenjang kelas harus diisi').max(80),
    semester: z.string().min(1, 'Semester harus diisi').max(20),
    alokasiWaktu: z.string().min(1, 'Alokasi waktu harus diisi').max(100),
    strategi: z.string().min(2, 'Strategi pembelajaran harus diisi').max(120),
    profilSosial: z.string().max(160).optional().nullable(),
    capaianPembelajaran: z.string().max(1000).optional().nullable(),
    slideCount: z.coerce.number().int().min(5).max(20).default(10),
    aiProvider: z.enum(['mistral', 'gemini', 'bedrock', 'z_ai', 'vertex']).optional(),
    template: z.string().max(80).optional(),
});

const speakerNotesSchema = z
    .string()
    .max(2500, 'Speaker notes terlalu panjang')
    .optional()
    .nullable();

export const presentationImageSchema = z.object({
    source: z.literal('unsplash'),
    url: z.string().url('URL gambar tidak valid'),
    alt: z.string().min(5).max(180),
    query: z.string().min(2).max(120),
    creditName: z.string().min(2).max(100),
    creditUrl: z.string().url('URL kredit gambar tidak valid'),
    unsplashId: z.string().min(3).max(80),
});

const baseSlideSchema = z.object({
    layout: z.enum(['title', 'content', 'twoColumn', 'activity', 'quote', 'summary', 'thankyou', 'imageText']),
    title: z.string().min(1).max(250).optional().default('Judul Slide'),
    subtitle: z.string().max(250).optional(),
    content: z.array(z.string().min(1).max(500)).max(12).optional(),
    leftTitle: z.string().max(120).optional().default('Ciri-ciri'),
    leftContent: z.array(z.string().min(1).max(500)).max(12).optional(),
    rightTitle: z.string().max(120).optional().default('Contoh'),
    rightContent: z.array(z.string().min(1).max(500)).max(12).optional(),
    instruction: z.string().max(800).optional().default('Ayo diskusikan!'),
    time: z.string().max(80).optional(),
    quote: z.string().max(800).optional().default('Semangat belajar!'),
    author: z.string().max(180).optional(),
    question: z.string().max(500).optional(),
    message: z.string().max(500).optional(),
    teacher: z.string().max(180).optional(),
    school: z.string().max(250).optional(),
    imageQuery: z.string().min(2).max(120).optional(),
    imageAlt: z.string().min(5).max(180).optional(),
    image: presentationImageSchema.optional(),
    speakerNotes: speakerNotesSchema,
}).superRefine((slide, ctx) => {
    if ((slide.layout === 'content' || slide.layout === 'summary') && (!slide.content || slide.content.length === 0)) {
        ctx.addIssue({ code: 'custom', path: ['content'], message: 'Layout content/summary wajib memiliki content' });
    }
    if (slide.layout === 'twoColumn') {
        if (!slide.leftTitle || !slide.rightTitle) {
            ctx.addIssue({ code: 'custom', path: ['leftTitle'], message: 'Layout twoColumn wajib memiliki leftTitle dan rightTitle' });
        }
        if (!slide.leftContent || !slide.rightContent) {
            ctx.addIssue({ code: 'custom', path: ['leftContent'], message: 'Layout twoColumn wajib memiliki leftContent dan rightContent' });
        }
    }
    if (slide.layout === 'activity' && !slide.instruction) {
        ctx.addIssue({ code: 'custom', path: ['instruction'], message: 'Layout activity wajib memiliki instruction' });
    }
    if (slide.layout === 'quote' && !slide.quote) {
        ctx.addIssue({ code: 'custom', path: ['quote'], message: 'Layout quote wajib memiliki quote' });
    }
    if (slide.layout === 'imageText' && (!slide.content || slide.content.length === 0)) {
        ctx.addIssue({ code: 'custom', path: ['content'], message: 'Layout imageText wajib memiliki content' });
    }
});

export const presentationResponseSchema = z.object({
    title: z.string().min(3).max(140),
    subtitle: z.string().max(220).optional(),
    slides: z.array(baseSlideSchema).min(5).max(20),
});

export type PresentationGenerateInput = z.infer<typeof presentationGenerateSchema>;
export type PresentationSlide = z.infer<typeof baseSlideSchema>;
export type PresentationOutput = z.infer<typeof presentationResponseSchema>;

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
