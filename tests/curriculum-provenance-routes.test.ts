import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { Hono } from 'hono';
import { SqliteD1 } from './helpers/sqlite-d1';

const aiState = vi.hoisted(() => ({ calls: [] as Array<{ prompt: string; provider?: string }> }));
vi.mock('../src/lib/auth', async original => ({ ...await original<any>(), getCurrentUser: vi.fn() }));
vi.mock('../src/lib/telemetry', () => ({ recordAIGeneration: vi.fn() }));
vi.mock('../src/lib/cp-validator', async original => ({
  ...await original<any>(),
  runCpQualityGate: async (data: any) => ({ data, audit: { summary: { overall_quality_score: 80, grade_label: 'Draf', passed_count: 1, repaired_count: 0 } } }),
}));
vi.mock('../src/services/ai', () => ({ AIService: class {
  async loadProviders() {}
  async generateJSON(prompt: string, provider?: string) { aiState.calls.push({ prompt, provider }); return prompt.includes('ANALISIS CP, TP, DAN ATP') ? cpResult : rppResult; }
  async generateJSONStream(prompt: string, provider: string, token: (text: string) => void) {
    aiState.calls.push({ prompt, provider }); token('{"draft":'); return prompt.includes('ANALISIS CP, TP, DAN ATP') ? cpResult : rppResult;
  }
  setAbortSignal() {}
} }));

import { getCurrentUser } from '../src/lib/auth';
import analisisCpRoutes from '../src/routes/analisis-cp';
import rppRoutes from '../src/routes/rpp';

const cpString = 'CP katalog: Murid menjelaskan hubungan antarkomponen ekosistem.';
const elementMap = { 'Pemahaman IPAS': 'Elemen katalog pemahaman.', 'Keterampilan Proses': 'Elemen katalog proses.' };
const cpResult = {
  metadata: { mata_pelajaran: 'IPAS', fase: 'C', kelas: '5', tahun_pembelajaran: '2026/2027' },
  semesters: [{ semester: 1, semester_label: 'SEMESTER 1', babs: [{
    no: 1, bab: 'Bab 1: Ekosistem', cp: 'Draf CP', items: [{ kode_tp: '5.1', materi_pokok: 'Ekosistem', tp: 'Murid mampu menjelaskan hubungan ekosistem.', atp: 'Murid mengamati ekosistem.', alokasi_waktu: '2 JP' }],
  }] }],
};
const rppResult = { desain: { capaian: 'Draf CP' }, pertemuan: [] };

let db: SqliteD1;
let app: Hono;
function setupDB() {
  const value = new SqliteD1();
  value.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, nama TEXT, sekolah TEXT, role TEXT);
    INSERT INTO users VALUES (1, 'Guru Provenance', 'SD Uji', 'guru');`);
  for (const migration of ['0029_ai_generation_jobs.sql', '0032_ai_admission.sql', '0038_curriculum_source_provenance.sql']) {
    value.sqlite.exec(readFileSync(`migrations/${migration}`, 'utf8'));
  }
  value.sqlite.exec(`CREATE TABLE capaian_pembelajaran(
    id INTEGER PRIMARY KEY, mata_pelajaran TEXT NOT NULL, fase TEXT NOT NULL, teks_cp TEXT NOT NULL,
    elemen_json TEXT NOT NULL, regulasi TEXT, UNIQUE(mata_pelajaran, fase)
  );`);
  return value;
}
const request = (path: string, body: any, jobId = 'curriculum-provenance-job-1') => app.request(path, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-session', 'X-AI-Job-Id': jobId }, body: JSON.stringify(body),
}, { DB: db });
const cpInput = {
  namaSekolah: 'SD Uji', mataPelajaran: 'IPAS', jenjangKelas: 'Kelas 5', fase: 'C', tahunAjaran: '2026/2027',
  targetSemester: 'all', chapters: [{ no: 1, bab: 'Bab 1: Ekosistem', materi_pokok: ['Ekosistem'], semester: 1 }], aiProvider: 'test',
};
const rppInput = { namaSekolah: 'SD Uji', namaGuru: 'Guru Uji', mataPelajaran: 'IPAS', topik: 'Ekosistem', jenjangKelas: 'Kelas 5', alokasiWaktu: '2 x 35 menit', strategi: 'Diskusi', jumlahPertemuan: 1, aiProvider: 'test' };

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  aiState.calls = [];
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'guru', nama: 'Guru Provenance', sekolah: 'SD Uji' } as any);
  db = setupDB();
  app = new Hono().route('/cp', analisisCpRoutes).route('/rpp', rppRoutes);
});
afterEach(() => { db.close(); vi.unstubAllGlobals(); });

async function assertCPResultMatchesProviderPrompt(response: Response, route: 'generate' | 'generate-stream', expectedSource: string, expectedCP: string, expectedElements: any) {
  expect(response.status).toBe(200);
  const streamText = route === 'generate-stream' ? await response.text() : '';
  const payload = route === 'generate-stream'
    ? JSON.parse(streamText.match(/event: done\ndata: (.+)/)![1]).data
    : (await response.json() as any).data;
  const providerPrompt = aiState.calls.find(call => call.prompt.includes('CAPAIAN PEMBELAJARAN (CP; sumber:'))!.prompt;
  const provenance = payload._provenance.curriculum;
  expect(provenance).toMatchObject({ source: expectedSource, status: 'recorded', reviewed: false });
  const row: any = db.sqlite.prepare('SELECT canonical_content_json, source_origin, regulation_label, locator FROM curriculum_source_snapshots WHERE digest = ?').get(provenance.digest);
  const snapshot = JSON.parse(row.canonical_content_json);
  expect(snapshot.components.cp.text).toBe(expectedCP);
  expect(providerPrompt).toContain(snapshot.components.cp.text);
  expect(snapshot.components.elements.text).toBe(JSON.stringify(expectedElements, null, 2));
  expect(providerPrompt).toContain(snapshot.components.elements.text);
  expect(snapshot.components.ipas_guidance.origin).toBe('static');
  expect(providerPrompt).toContain(snapshot.components.ipas_guidance.text);
  expect(row.source_origin).toBe(expectedSource);
  return { providerPrompt, streamText };
}

describe('CP and RPP source provenance in actual generation prompts', () => {
  it('uses exact static CP/elements and records static IPAS prompt guidance on non-stream CP generation', async () => {
    const cpData = await import('../src/lib/cp-data');
    const result = await assertCPResultMatchesProviderPrompt(await request('/cp/generate', cpInput), 'generate', 'static', cpData.getOfficialCP('IPAS', 'Kelas 5')!, cpData.getOfficialCPElements('IPAS', 'Kelas 5')!);
    expect(result.providerPrompt).toContain('fallback katalog statis aplikasi yang belum ditinjau');
    expect(result.providerPrompt).not.toContain('CAPAIAN PEMBELAJARAN (CP) RESMI PEMERINTAH');
  });

  it('uses exact D1 CP/elements and returns their snapshot in SSE completion', async () => {
    db.sqlite.prepare(`INSERT INTO capaian_pembelajaran(mata_pelajaran,fase,teks_cp,elemen_json,regulasi)
      VALUES (?,?,?,?,?)`).run('IPAS', 'Fase C', cpString, JSON.stringify(elementMap), 'Stored catalog label');
    const result = await assertCPResultMatchesProviderPrompt(await request('/cp/generate-stream', cpInput, 'cp-source-stream-456'), 'generate-stream', 'mixed', cpString, elementMap);
    expect(result.providerPrompt).toContain('label tersimpan: Stored catalog label (bukan verifikasi)');
    expect(result.streamText).toContain('teks belum diverifikasi');
  });

  it('labels user-supplied RPP CP honestly in non-stream prompt and metadata', async () => {
    const userCP = 'Guru memasukkan CP ini secara langsung.';
    const response = await request('/rpp/generate', { ...rppInput, capaianPembelajaran: userCP });
    expect(response.status).toBe(200);
    const result: any = (await response.json() as any).data;
    const prompt = aiState.calls[0].prompt;
    expect(prompt).toContain(`masukan guru (belum ditinjau) sebagai konteks, tanpa menganggapnya telah diverifikasi: "${userCP}"`);
    expect(prompt).not.toContain('Capaian Pembelajaran resmi BSKAP');
    expect(result._provenance.curriculum).toMatchObject({ source: 'user-input', status: 'recorded', reviewed: false });
    const row: any = db.sqlite.prepare('SELECT canonical_content_json FROM curriculum_source_snapshots WHERE digest = ?').get(result._provenance.curriculum.digest);
    expect(JSON.parse(row.canonical_content_json).components.cp.text).toBe(userCP);
  });

  it('labels a D1 RPP source as unreviewed in the prompt and SSE progress, with only its stored label', async () => {
    db.sqlite.prepare(`INSERT INTO capaian_pembelajaran(mata_pelajaran,fase,teks_cp,elemen_json,regulasi)
      VALUES (?,?,?,?,?)`).run('IPAS', 'Fase C', cpString, JSON.stringify(elementMap), 'RPP stored label');
    const response = await request('/rpp/generate-stream', rppInput, 'rpp-source-stream-001');
    expect(response.status).toBe(200);
    const streamText = await response.text();
    const done = JSON.parse(streamText.match(/event: done\ndata: (.+)/)![1]);
    const prompt = aiState.calls.find(call => call.prompt.includes('RPP (Rencana Pelaksanaan Pembelajaran)'))!.prompt;
    expect(prompt).toContain('entri katalog D1 yang belum ditinjau; label tersimpan: RPP stored label (bukan verifikasi)');
    expect(prompt).not.toContain('BSKAP No. 046 Tahun 2025');
    expect(streamText).toContain('entri katalog D1 yang belum ditinjau (label tersimpan: RPP stored label)');
    expect(done.data._provenance.curriculum).toMatchObject({ source: 'd1', status: 'recorded', reviewed: false, regulationLabel: 'RPP stored label' });
  });
});
