import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { recordAIGeneration } from '../src/lib/telemetry';
import { SqliteD1 } from './helpers/sqlite-d1';

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
            user_id: 2,
            feature_type: 'ASESMEN',
            sekolah: 'SDN Raharja'
        })).resolves.not.toThrow();
    });

    it('does not attribute an anonymous event to the default administrator', async () => {
        const prepare = vi.fn();
        await recordAIGeneration({ prepare } as unknown as D1Database, {
            feature_type: 'RPP',
            sekolah: 'SDN Raharja'
        });
        expect(prepare).not.toHaveBeenCalled();
    });

    it('migrates historical rows with an uncertainty marker and records each new feature accurately', async () => {
        const db = new SqliteD1();
        try {
            db.sqlite.exec('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users(id) VALUES(1);');
            db.sqlite.exec(readFileSync('migrations/0016_ai_generation_logs.sql', 'utf8'));
            db.sqlite.exec("INSERT INTO ai_generation_logs(user_id,user_nama,sekolah,feature_type,topik) VALUES(1,'Guru','SDN 1','RPP','[Analisis CP] Bab 1'),(1,'Guru','SDN 1','RPP','Topik RPP lama')");
            db.sqlite.exec(readFileSync('migrations/0031_ai_generation_feature_accuracy.sql', 'utf8'));

            const legacy = db.sqlite.prepare('SELECT feature_type, classification_quality FROM ai_generation_logs ORDER BY id').all();
            expect(legacy).toEqual([
                { feature_type: 'ANALISIS_CP', classification_quality: 'legacy_uncertain' },
                { feature_type: 'RPP', classification_quality: 'legacy_uncertain' }
            ]);

            for (const feature_type of ['ANALISIS_CP', 'TTS', 'PROGRAM_SEKOLAH', 'PROGRAM_SEKOLAH_SECTION'] as const) {
                await recordAIGeneration(db as unknown as D1Database, { user_id: 1, user_nama: 'Guru', sekolah: 'SDN 1', feature_type });
            }
            const recent = db.sqlite.prepare("SELECT feature_type, classification_quality FROM ai_generation_logs WHERE id > 2 ORDER BY id").all();
            expect(recent).toEqual([
                { feature_type: 'ANALISIS_CP', classification_quality: 'verified' },
                { feature_type: 'TTS', classification_quality: 'verified' },
                { feature_type: 'PROGRAM_SEKOLAH', classification_quality: 'verified' },
                { feature_type: 'PROGRAM_SEKOLAH_SECTION', classification_quality: 'verified' }
            ]);
        } finally {
            db.close();
        }
    });
});
