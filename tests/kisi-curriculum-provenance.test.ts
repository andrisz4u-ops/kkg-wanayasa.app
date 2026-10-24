// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';

const ai = vi.hoisted(() => ({ calls: [] as Array<{ prompt: string; provider?: string }>, result: undefined as any }));
vi.mock('../src/lib/auth', async original => ({ ...await original<any>(), getCurrentUser: vi.fn() }));
vi.mock('../src/lib/telemetry', () => ({ recordAIGeneration: vi.fn() }));
vi.mock('../src/services/ai', () => ({ AIService: class {
    async loadProviders() {}
    async generateJSON(prompt: string, provider?: string) {
        ai.calls.push({ prompt, provider });
        return /AI Verifikator|verifikasi|audit/i.test(prompt) ? { verifications: [] } : structuredClone(ai.result);
    }
    async generateJSONStream(prompt: string, provider: string, onToken: (token: string) => void) {
        ai.calls.push({ prompt, provider }); onToken('{"pg":'); return structuredClone(ai.result);
    }
    setAbortSignal() {}
} }));

import kisi, { saveAssessmentTelemetryAndBankSoal } from '../src/routes/kisi';
import { getCurrentUser } from '../src/lib/auth';

let db: SqliteD1;
let app: Hono;
const cpString = 'Murid mengidentifikasi hubungan antara makhluk hidup dan lingkungannya.';
const assessment = {
    topik: 'Ekosistem sekitar', mataPelajaran: 'IPAS', jenjangKelas: 'Kelas 5', semester: 'Semester 1',
    jenisUjian: 'Sumatif', jumlahPG: 1, jumlahIsian: 0, jumlahUraian: 0,
    useGambar: false, aiProvider: 'test', isPublic: true,
};

function setupDatabase(seedLegacy?: (database: SqliteD1) => void) {
    const value = new SqliteD1();
    value.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, nama TEXT, sekolah TEXT, role TEXT);
        INSERT INTO users(id, nama, sekolah, role) VALUES (1, 'Guru Provenance', 'SD Uji', 'guru');`);
    for (const migration of ['0029_ai_generation_jobs.sql', '0032_ai_admission.sql', '0018_bank_soal.sql', '0038_curriculum_source_provenance.sql']) value.sqlite.exec(readFileSync(`migrations/${migration}`, 'utf8'));
    seedLegacy?.(value);
    for (const migration of ['0040_bank_soal_moderation.sql', '0041_assessment_image_assets.sql', '0042_assessment_package_revisions.sql', '0043_assessment_generation_requests.sql']) value.sqlite.exec(readFileSync(`migrations/${migration}`, 'utf8'));
    value.sqlite.exec(`CREATE TABLE capaian_pembelajaran (
        id INTEGER PRIMARY KEY, mata_pelajaran TEXT NOT NULL, fase TEXT NOT NULL, teks_cp TEXT NOT NULL,
        elemen_json TEXT NOT NULL, regulasi TEXT, UNIQUE(mata_pelajaran, fase)
    );`);
    return value;
}

function seedD1CP() {
    db.sqlite.prepare(`INSERT INTO capaian_pembelajaran(mata_pelajaran, fase, teks_cp, elemen_json, regulasi)
        VALUES (?, ?, ?, ?, ?)`).run('IPAS', 'Fase C', cpString, JSON.stringify({ 'Pemahaman IPAS': 'Elemen sample' }), 'Stored D1 label');
}

const request = (route: string, body: any = assessment) => app.request(`/kisi/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-session', 'X-AI-Job-Id': `kisi-provenance-${route}-001` },
    body: JSON.stringify(body),
}, { DB: db });

beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto);
    ai.calls = [];
    ai.result = { pg: [{ no: 1, cp: 'CP item', materi: 'Ekosistem', indikator: 'Disajikan konteks, murid menentukan hubungan.', level: 'L1', bentuk: 'Pilihan Ganda', soal: 'Apa hubungan dalam ekosistem?', opsi: { A: 'A', B: 'B', C: 'C', D: 'D' }, kunci: 'A' }] };
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'guru', nama: 'Guru Provenance', sekolah: 'SD Uji' } as any);
    db = setupDatabase();
    app = new Hono().route('/kisi', kisi);
});
afterEach(() => { db.close(); vi.unstubAllGlobals(); });

async function expectResultHasMatchingPromptSnapshot(response: Response, route: string, expectedCP: string, expectedSource: string, expectedCPOrigin: string = expectedSource) {
    expect(response.status).toBe(200);
    const bodyText = route === 'generate-stream' ? await response.text() : '';
    const payload = route === 'generate-stream'
        ? JSON.parse(bodyText.match(/event: done\ndata: (.+)/)![1]).data
        : (await response.json() as any).data;
    const generationCall = ai.calls.find(call => call.prompt.includes('CP (Capaian Pembelajaran):'));
    expect(generationCall).toBeDefined();
    expect(generationCall!.prompt).toContain(`"${expectedCP}"`);
    expect(generationCall!.prompt).toContain('belum ditinjau');
    expect(generationCall!.prompt).not.toContain('rujukan resmi');
    if (expectedCPOrigin === 'user-input') expect(generationCall!.prompt).toContain('masukan guru');
    if (expectedSource === 'static') expect(generationCall!.prompt).toContain('fallback katalog statis aplikasi');
    if (expectedSource === 'd1') expect(generationCall!.prompt).toContain('label tersimpan: Stored D1 label');
    const metadata = payload._provenance.curriculum;
    expect(metadata).toMatchObject({ source: expectedSource, status: 'recorded', reviewed: false });
    const snapshot: any = db.sqlite.prepare('SELECT canonical_content_json FROM curriculum_source_snapshots WHERE digest = ?').get(metadata.digest);
    const content = JSON.parse(snapshot.canonical_content_json);
    expect(content.components.cp.text).toBe(expectedCP);
    expect(content.components.cp.origin).toBe(expectedCPOrigin);
    expect(generationCall!.prompt).toContain(content.components.cp.text);
    if (content.components.elements) expect(generationCall!.prompt).toContain(content.components.elements.text);
    const saved: any = db.sqlite.prepare('SELECT content FROM bank_soal ORDER BY id DESC LIMIT 1').get();
    expect(JSON.parse(saved.content)._provenance.curriculum.digest).toBe(metadata.digest);
}

describe('assessment curriculum provenance', () => {
    it('snapshots exact teacher-supplied CP used in a non-streaming provider prompt and saved result', async () => {
        await expectResultHasMatchingPromptSnapshot(await request('generate', { ...assessment, capaianPembelajaran: cpString }), 'generate', cpString, 'mixed', 'user-input');
    });

    it('snapshots exact static CP used in streaming provider prompt and final SSE data', async () => {
        await expectResultHasMatchingPromptSnapshot(await request('generate-stream'), 'generate-stream', (await import('../src/lib/cp-data')).getOfficialCP('IPAS', 'Kelas 5')!, 'static');
    });

    it('snapshots exact D1 CP used in non-streaming prompt and records its source', async () => {
        seedD1CP();
        await expectResultHasMatchingPromptSnapshot(await request('generate'), 'generate', cpString, 'd1');
    });

    it('auto-saves new bank rows with explicit private moderation fields and leaves legacy visibility unchanged', async () => {
        db.close();
        db = setupDatabase(database => {
            database.sqlite.prepare(`INSERT INTO bank_soal(user_id,user_nama,sekolah,mata_pelajaran,topik,jenjang_kelas,content,is_public)
                VALUES (1,'Legacy','SD Lama','IPAS','Old','Kelas 5','{}',1);`).run();
        });
        app = new Hono().route('/kisi', kisi);
        const legacyBefore: any = db.sqlite.prepare('SELECT is_public, moderation_status, legacy_compat, is_hidden FROM bank_soal WHERE id = 1').get();
        await saveAssessmentTelemetryAndBankSoal(db as any, { id: 1, nama: 'Guru', sekolah: 'SD Uji' }, assessment, { pg: [], isian: null, uraian: [] }, 'test');
        const legacyAfter: any = db.sqlite.prepare('SELECT is_public, moderation_status, legacy_compat, is_hidden FROM bank_soal WHERE id = 1').get();
        const created: any = db.sqlite.prepare('SELECT is_public, moderation_status, legacy_compat, is_hidden FROM bank_soal WHERE id = 2').get();
        expect(legacyAfter).toEqual(legacyBefore);
        expect(created).toEqual({ is_public: 0, moderation_status: 'private', legacy_compat: 0, is_hidden: 0 });
    });
});
