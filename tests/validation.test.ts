/**
 * Validation Schema Tests
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
    validate,
    validateId,
    loginSchema,
    registerSchema,
    changePasswordSchema,
    generateSuratSchema,
    generateProkerSchema,
    createThreadSchema,
    createPengumumanSchema,
    updateRoleSchema,
    emailSchema,
    passwordSchema,
    dateSchema,
    presentationOutlineSchema,
    presentationOutlineResponseSchema,
    presentationGenerateSchema,
    presentationPatchSlideSchema,
    baseSlideSchema,
    createAiProviderSchema,
    updateAiProviderSchema,
} from '../src/lib/validation';

describe('Email Validation', () => {
    it('should accept valid email', () => {
        expect(emailSchema.safeParse('test@example.com').success).toBe(true);
        expect(emailSchema.safeParse('user.name@domain.co.id').success).toBe(true);
    });

    it('should reject invalid email', () => {
        expect(emailSchema.safeParse('invalid').success).toBe(false);
        expect(emailSchema.safeParse('test@').success).toBe(false);
        expect(emailSchema.safeParse('@domain.com').success).toBe(false);
        expect(emailSchema.safeParse('').success).toBe(false);
    });

    it('should reject too long email', () => {
        const longEmail = 'a'.repeat(250) + '@test.com';
        expect(emailSchema.safeParse(longEmail).success).toBe(false);
    });
});

describe('Password Validation', () => {
    it('should accept valid password', () => {
        expect(passwordSchema.safeParse('Password123').success).toBe(true);
        expect(passwordSchema.safeParse('abc12345').success).toBe(true);
        expect(passwordSchema.safeParse('12345abc').success).toBe(true);
    });

    it('should reject short password', () => {
        const result = passwordSchema.safeParse('Pass1');
        expect(result.success).toBe(false);
    });

    it('should reject password without letters', () => {
        const result = passwordSchema.safeParse('12345678');
        expect(result.success).toBe(false);
    });

    it('should reject password without numbers', () => {
        const result = passwordSchema.safeParse('PasswordOnly');
        expect(result.success).toBe(false);
    });
});

describe('Date Validation', () => {
    it('should accept valid date format', () => {
        expect(dateSchema.safeParse('2026-02-08').success).toBe(true);
        expect(dateSchema.safeParse('2025-12-31').success).toBe(true);
    });

    it('should reject invalid date format', () => {
        expect(dateSchema.safeParse('08-02-2026').success).toBe(false);
        expect(dateSchema.safeParse('2026/02/08').success).toBe(false);
        expect(dateSchema.safeParse('Feb 8, 2026').success).toBe(false);
    });
});

describe('Login Schema', () => {
    it('should accept valid login data', () => {
        const result = validate(loginSchema, {
            email: 'user@example.com',
            password: 'password123',
        });
        expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
        const result = validate(loginSchema, {
            password: 'password123',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors.some(e => e.field === 'email')).toBe(true);
        }
    });

    it('should reject missing password', () => {
        const result = validate(loginSchema, {
            email: 'user@example.com',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors.some(e => e.field === 'password')).toBe(true);
        }
    });
});

describe('Register Schema', () => {
    it('should accept valid registration data', () => {
        const result = validate(registerSchema, {
            nama: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
        });
        expect(result.success).toBe(true);
    });

    it('should accept registration with optional fields', () => {
        const result = validate(registerSchema, {
            nama: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
            nip: '123456789012345678',
            no_hp: '081234567890',
            sekolah: 'SDN 1 Test',
        });
        expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
        const result = validate(registerSchema, {
            nama: 'John Doe',
            email: 'john@example.com',
            password: 'weak',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors.some(e => e.field === 'password')).toBe(true);
        }
    });

    it('should reject invalid nama', () => {
        const result = validate(registerSchema, {
            nama: 'J',
            email: 'john@example.com',
            password: 'Password123',
        });
        expect(result.success).toBe(false);
    });
});

describe('Change Password Schema', () => {
    it('should accept valid password change', () => {
        const result = validate(changePasswordSchema, {
            current_password: 'OldPassword123',
            new_password: 'NewPassword456',
        });
        expect(result.success).toBe(true);
    });

    it('should reject weak new password', () => {
        const result = validate(changePasswordSchema, {
            current_password: 'OldPassword123',
            new_password: 'weak',
        });
        expect(result.success).toBe(false);
    });
});

describe('Generate Surat Schema', () => {
    it('should accept valid surat data', () => {
        const result = validate(generateSuratSchema, {
            jenis_kegiatan: 'Rapat Koordinasi',
            tanggal_kegiatan: '2026-02-15',
            waktu_kegiatan: '09:00 - 12:00',
            tempat_kegiatan: 'Ruang Rapat SDN 1',
            agenda: 'Pembahasan Program Kerja Tahun 2026',
        });
        expect(result.success).toBe(true);
    });

    it('should accept surat with optional peserta array', () => {
        const result = validate(generateSuratSchema, {
            jenis_kegiatan: 'Rapat Koordinasi',
            tanggal_kegiatan: '2026-02-15',
            waktu_kegiatan: '09:00 - 12:00',
            tempat_kegiatan: 'Ruang Rapat SDN 1',
            agenda: 'Pembahasan',
            peserta: ['Guru A', 'Guru B', 'Guru C'],
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
        const result = validate(generateSuratSchema, {
            jenis_kegiatan: 'Rapat Koordinasi',
            tanggal_kegiatan: '15-02-2026', // Wrong format
            waktu_kegiatan: '09:00 - 12:00',
            tempat_kegiatan: 'Ruang Rapat SDN 1',
            agenda: 'Pembahasan',
        });
        expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
        const result = validate(generateSuratSchema, {
            jenis_kegiatan: 'Rapat',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors.length).toBeGreaterThan(0);
        }
    });
});

describe('validateId Helper', () => {
    it('should accept valid numeric ID', () => {
        expect(validateId('1')).toEqual({ valid: true, id: 1 });
        expect(validateId('123')).toEqual({ valid: true, id: 123 });
        expect(validateId('999999')).toEqual({ valid: true, id: 999999 });
    });

    it('should coerce string numbers', () => {
        const result = validateId('42');
        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(typeof result.id).toBe('number');
            expect(result.id).toBe(42);
        }
    });

    it('should reject non-numeric strings', () => {
        expect(validateId('abc').valid).toBe(false);
        expect(validateId('').valid).toBe(false);
    });

    it('should reject negative numbers', () => {
        expect(validateId('-1').valid).toBe(false);
        expect(validateId('-100').valid).toBe(false);
    });

    it('should reject zero', () => {
        expect(validateId('0').valid).toBe(false);
    });
});

describe('Generate Proker Schema', () => {
    const validProker = {
        tahun_ajaran: '2025/2026',
        visi: 'Mewujudkan guru yang profesional dan berdaya saing',
        misi: 'Meningkatkan kompetensi guru melalui pelatihan berkelanjutan',
        kegiatan: [
            {
                nama_kegiatan: 'Workshop Kurikulum Merdeka',
                waktu_pelaksanaan: 'Januari 2025',
                penanggung_jawab: 'Ketua KKG',
                anggaran: 'Rp 5.000.000',
                indikator: '50 guru terlatih'
            }
        ]
    };

    it('should accept valid proker data', () => {
        const result = validate(generateProkerSchema, validProker);
        expect(result.success).toBe(true);
    });

    it('should reject invalid tahun ajaran format', () => {
        const result = validate(generateProkerSchema, {
            ...validProker,
            tahun_ajaran: '2025-2026'
        });
        expect(result.success).toBe(false);
    });

    it('should require at least one kegiatan', () => {
        const result = validate(generateProkerSchema, {
            ...validProker,
            kegiatan: []
        });
        expect(result.success).toBe(false);
    });

    it('should reject short visi', () => {
        const result = validate(generateProkerSchema, {
            ...validProker,
            visi: 'Pendek'
        });
        expect(result.success).toBe(false);
    });
});

describe('Create Thread Schema', () => {
    it('should accept valid thread data', () => {
        const result = validate(createThreadSchema, {
            judul: 'Diskusi tentang Kurikulum Merdeka',
            isi: 'Bagaimana pengalaman rekan-rekan dalam implementasi Kurikulum Merdeka?',
            kategori: 'kurikulum'
        });
        expect(result.success).toBe(true);
    });

    it('should reject short judul', () => {
        const result = validate(createThreadSchema, {
            judul: 'Test',
            isi: 'Isi thread yang valid dan cukup panjang'
        });
        expect(result.success).toBe(false);
    });

    it('should reject short isi', () => {
        const result = validate(createThreadSchema, {
            judul: 'Judul yang valid dan panjang',
            isi: 'Pendek'
        });
        expect(result.success).toBe(false);
    });
});

describe('Create Pengumuman Schema', () => {
    it('should accept valid pengumuman data', () => {
        const result = validate(createPengumumanSchema, {
            judul: 'Jadwal Rapat Bulanan',
            isi: 'Rapat akan dilaksanakan pada tanggal 15 Februari 2025 di SDN 1 Wanayasa.',
            kategori: 'jadwal',
            is_pinned: true
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid kategori', () => {
        const result = validate(createPengumumanSchema, {
            judul: 'Test Pengumuman',
            isi: 'Isi pengumuman yang valid dan cukup panjang',
            kategori: 'invalid'
        });
        expect(result.success).toBe(false);
    });
});

describe('Update Role Schema', () => {
    it('should accept valid roles', () => {
        expect(validate(updateRoleSchema, { role: 'admin' }).success).toBe(true);
        expect(validate(updateRoleSchema, { role: 'operator' }).success).toBe(true);
        expect(validate(updateRoleSchema, { role: 'user' }).success).toBe(true);
    });

    it('should reject invalid roles', () => {
        expect(validate(updateRoleSchema, { role: 'superadmin' }).success).toBe(false);
        expect(validate(updateRoleSchema, { role: 'guest' }).success).toBe(false);
    });
});

describe('Presentation Schemas & Layouts', () => {
    it('should validate presentation outline request', () => {
        const result = validate(presentationOutlineSchema, {
            mataPelajaran: 'IPAS',
            topik: 'Tata Surya',
            jenjangKelas: 'Kelas 6',
            semester: '1',
            alokasiWaktu: '2 x 35 Menit',
            strategi: 'Problem Based Learning',
            slideCount: 8,
        });
        expect(result.success).toBe(true);
    });

    it('should validate presentation outline response', () => {
        const result = validate(presentationOutlineResponseSchema, {
            title: 'Sistem Tata Surya Kita',
            subtitle: 'IPAS Kelas 6',
            outline: [
                { index: 1, title: 'Cover', layout: 'title', focus: 'Pengenalan' },
                { index: 2, title: 'Matahari', layout: 'content', focus: 'Pusat Tata Surya' },
                { index: 3, title: 'Planet Dalam', layout: 'twoColumn', focus: 'Merkurius - Mars' },
                { index: 4, title: 'Planet Luar', layout: 'twoColumn', focus: 'Yupiter - Neptunus' },
                { index: 5, title: 'Tahapan Terjadinya Siang Malam', layout: 'timeline', focus: 'Rotasi Bumi' },
                { index: 6, title: 'Fakta Menarik Planet', layout: 'stats', focus: 'Data & Angka' },
                { index: 7, title: 'Kuis Pemahaman', layout: 'quiz', focus: 'Evaluasi Pembelajaran' },
                { index: 8, title: 'Kesimpulan', layout: 'summary', focus: 'Rangkuman Materi' },
            ]
        });
        expect(result.success).toBe(true);
    });

    it('should validate slide layouts: timeline, stats, quiz', () => {
        const timelineSlide = validate(baseSlideSchema, {
            layout: 'timeline',
            title: 'Tahapan Rotasi Bumi',
            timeline: [
                { step: '1', title: 'Matahari Terbit', desc: 'Sisi bumi mulai menerima cahaya' },
                { step: '2', title: 'Tengah Hari', desc: 'Matahari berada di titik kulminasi' },
            ]
        });
        expect(timelineSlide.success).toBe(true);

        const statsSlide = validate(baseSlideSchema, {
            layout: 'stats',
            title: 'Fakta Tata Surya',
            stats: [
                { value: '8 Planet', label: 'Mengorbit Matahari' },
                { value: '71%', label: 'Permukaan Bumi Air' }
            ]
        });
        expect(statsSlide.success).toBe(true);

        const quizSlide = validate(baseSlideSchema, {
            layout: 'quiz',
            title: 'Kuis Planet',
            question: 'Planet apakah yang paling dekat dengan matahari?',
            quizOptions: ['A. Venus', 'B. Merkurius', 'C. Mars', 'D. Bumi'],
            quizAnswer: 'B',
            quizExplanation: 'Merkurius adalah planet terdekat.'
        });
        expect(quizSlide.success).toBe(true);
    });

    it('should validate single slide patch request', () => {
        const patchResult = validate(presentationPatchSlideSchema, {
            currentSlide: {
                layout: 'content',
                title: 'Materi Bumi',
                content: ['Bumi berputar pada porosnya', 'Revolusi memakan waktu 365 hari']
            },
            instruction: 'Ubah kalimat poin materi agar lebih ringkas',
            mataPelajaran: 'IPAS',
            topik: 'Bumi'
        });
        expect(patchResult.success).toBe(true);
    });
});

describe('AI Provider Schema Validation', () => {
    it('should accept valid AI provider creation payload', () => {
        const validPayload = {
            name: 'Google Gemini 2.0 Flash',
            slug: 'gemini-flash',
            api_type: 'openai_compat',
            base_url: 'https://generativelanguage.googleapis.com/v1beta/openai',
            model: 'gemini-2.0-flash',
            api_key: 'AIzaSyTestKey123',
            priority: 1,
            max_tokens: 8192,
            temperature: 0.7,
        };

        const result = createAiProviderSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
    });

    it('should reject invalid api_type', () => {
        const invalidPayload = {
            name: 'Test Provider',
            slug: 'test-provider',
            api_type: 'unsupported_type',
            base_url: 'https://api.test.com',
            model: 'test-model',
        };

        const result = createAiProviderSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
    });

    it('should reject invalid slug with spaces or uppercase', () => {
        const invalidSlug = {
            name: 'Test Provider',
            slug: 'Test Provider Slug',
            api_type: 'openai_compat',
            base_url: 'https://api.test.com',
            model: 'test-model',
        };

        const result = createAiProviderSchema.safeParse(invalidSlug);
        expect(result.success).toBe(false);
    });

    it('should accept valid partial update payload', () => {
        const updatePayload = {
            priority: 5,
            temperature: 0.2,
            model: 'gpt-4o-mini',
        };

        const result = updateAiProviderSchema.safeParse(updatePayload);
        expect(result.success).toBe(true);
    });
});
