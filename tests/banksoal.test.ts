import { describe, it, expect, vi } from 'vitest';
import banksoal from '../src/routes/banksoal';

const mockUser = {
    id: 1,
    nama: 'Guru Teladan',
    email: 'guru@sd.id',
    role: 'user',
    sekolah: 'SDN 1 Wanayasa'
};

const createMockDb = (authenticated = true) => {
    return {
        prepare: vi.fn((query: string) => {
            const runner = {
                all: vi.fn(async () => {
                    if (query.includes('FROM bank_soal bs') || query.includes('SELECT bs.id')) {
                        return {
                            results: [{
                                id: 1,
                                user_id: 1,
                                user_nama: 'Guru Teladan',
                                sekolah: 'SDN 1 Wanayasa',
                                mata_pelajaran: 'IPAS',
                                topik: 'Siklus Air',
                                jenjang_kelas: 'Kelas 5',
                                jumlah_pg: 10,
                                jumlah_isian: 5,
                                jumlah_uraian: 2,
                                avg_rating: 4.5,
                                total_reviews: 2,
                                use_count: 5,
                                is_public: 1,
                                created_at: new Date().toISOString()
                            }]
                        };
                    }
                    if (query.includes('mata_pelajaran') || query.includes('jenjang_kelas')) {
                        return { results: [{ mata_pelajaran: 'IPAS', count: 1, jenjang_kelas: 'Kelas 5' }] };
                    }
                    if (query.includes('bank_soal_reviews')) {
                        return { results: [] };
                    }
                    return { results: [] };
                }),
                first: vi.fn(async () => {
                    if (query.toLowerCase().includes('sessions')) {
                        return authenticated ? mockUser : null;
                    }
                    if (query.includes('COUNT(*) as total FROM bank_soal')) {
                        return { total: 1 };
                    }
                    if (query.includes('bank_soal WHERE id = ?') || query.includes('bank_soal bs WHERE id = ?')) {
                        return {
                            id: 1,
                            user_id: 2, // different user for testing reviews
                            user_nama: 'Guru Lain',
                            mata_pelajaran: 'IPAS',
                            topik: 'Siklus Air',
                            jenjang_kelas: 'Kelas 5',
                            content: JSON.stringify({ pg: [{ no: 1, soal: 'Apa itu kondensasi?' }] }),
                            is_public: 1,
                            avg_rating: 4.5,
                            total_reviews: 2,
                            use_count: 5
                        };
                    }
                    if (query.includes('SELECT 1 FROM bank_soal')) {
                        return { 1: 1 };
                    }
                    return null;
                }),
                run: vi.fn(async () => ({ success: true, meta: { last_row_id: 1 } }))
            };

            return {
                ...runner,
                bind: vi.fn((..._args: any[]) => runner)
            };
        }),
        batch: vi.fn(async () => [])
    };
};

describe('Bank Soal Kolaboratif Route Tests', () => {
    it('should reject unauthenticated requests to /', async () => {
        const res = await banksoal.request('/', {
            method: 'GET'
        }, { DB: createMockDb(false) } as any);

        expect(res.status).toBe(401);
    });

    it('should return list of bank soal items with pagination', async () => {
        const res = await banksoal.request('/?page=1&limit=12', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer test-session-token'
            }
        }, { DB: createMockDb(true) } as any);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.items).toBeDefined();
        expect(Array.isArray(data.data.items)).toBe(true);
        expect(data.data.pagination).toBeDefined();
    });

    it('should return stats for bank soal', async () => {
        const res = await banksoal.request('/stats', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer test-session-token'
            }
        }, { DB: createMockDb(true) } as any);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.total_soal).toBeDefined();
    });

    it('should reject review with invalid rating score', async () => {
        const res = await banksoal.request('/1/review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-session-token'
            },
            body: JSON.stringify({
                rating: 6,
                komentar: 'Terlalu bagus'
            })
        }, { DB: createMockDb(true) } as any);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error?.message).toContain('Rating harus antara 1 dan 5');
    });

    it('should track usage when a question is used', async () => {
        const res = await banksoal.request('/1/use', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-session-token'
            }
        }, { DB: createMockDb(true) } as any);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.tracked).toBe(true);
    });

    it('should allow submitting a valid review', async () => {
        const res = await banksoal.request('/1/review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-session-token'
            },
            body: JSON.stringify({
                rating: 5,
                komentar: 'Soal sangat bagus dan kontekstual!'
            })
        }, { DB: createMockDb(true) } as any);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.reviewed).toBe(true);
    });
});
