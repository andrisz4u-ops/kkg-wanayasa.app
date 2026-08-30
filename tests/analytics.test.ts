import { describe, it, expect, vi } from 'vitest';
import { recordAIGeneration } from '../src/lib/telemetry';

describe('AI Generation Telemetry & School Analytics', () => {
    it('should record AI generation event successfully without throwing', async () => {
        const mockRun = vi.fn().mockResolvedValue({ success: true });
        const mockBind = vi.fn().mockReturnValue({ run: mockRun });
        const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
        const mockDb = { prepare: mockPrepare } as unknown as D1Database;

        await recordAIGeneration(mockDb, {
            user_id: 1,
            user_nama: 'Andris Hadiansyah, S.Pd',
            sekolah: 'SDN 2 Nangerang',
            feature_type: 'RPP',
            mata_pelajaran: 'IPAS',
            topik: 'Ekosistem',
            jenjang_kelas: 'Kelas 5',
            ai_provider: 'mistral-medium-latest',
            duration_ms: 1200
        });

        expect(mockPrepare).toHaveBeenCalledTimes(1);
        expect(mockBind).toHaveBeenCalledWith(
            1,
            'Andris Hadiansyah, S.Pd',
            'SDN 2 Nangerang',
            'RPP',
            'IPAS',
            'Ekosistem',
            'Kelas 5',
            'mistral-medium-latest',
            1200
        );
        expect(mockRun).toHaveBeenCalledTimes(1);
    });

    it('should fail silently and never throw error if database fails', async () => {
        const mockPrepare = vi.fn().mockImplementation(() => {
            throw new Error('D1 Connection Timeout');
        });
        const mockDb = { prepare: mockPrepare } as unknown as D1Database;

        // Must not throw exception
        await expect(recordAIGeneration(mockDb, {
            feature_type: 'ASESMEN',
            sekolah: 'SDN Raharja'
        })).resolves.not.toThrow();
    });
});
