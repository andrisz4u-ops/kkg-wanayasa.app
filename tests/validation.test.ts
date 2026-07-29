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
