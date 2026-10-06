import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import presentation, { presentationPrompt, resolveProviderSlug } from '../src/routes/presentation';
import { getCurrentUser } from '../src/lib/auth';
import { exampleDeck } from '../public/static/js/slides/examples.js';
import { SqliteD1 } from './helpers/sqlite-d1';
const ai = vi.hoisted(() => ({ calls: [] as any[], result: undefined as any, signal: undefined as AbortSignal | undefined, run: undefined as any }));
vi.mock('../src/lib/auth', async original => ({ ...await original<any>(), getCurrentUser: vi.fn() }));
vi.mock('../src/lib/telemetry', () => ({ recordAIGeneration: vi.fn() }));
vi.mock('../src/services/ai', () => ({ AIService: class {
  async loadProviders() {}
  setAbortSignal(signal: AbortSignal) { ai.signal = signal; }
  async generateJSON(prompt: string, provider: string) { ai.calls.push({ prompt, provider }); return ai.run ? ai.run() : ai.result; }
  async generateJSONStream(prompt: string, provider: string, token: (text: string) => void) { ai.calls.push({ prompt, provider }); token('{"slides":'); return ai.run ? ai.run() : ai.result; }
} }));
let db: SqliteD1, app: Hono;
const input = { topik: 'Pecahan di kelas', mataPelajaran: 'Matematika', jenjangKelas: 'Kelas 3', tujuanPembelajaran: 'Membaca tiga perempat', extraInstructions: 'Gunakan kertas lipat', slideCount: 8, template: 'matematika-visual', aiProvider: 'api' };
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto); ai.calls = []; ai.result = exampleDeck(); ai.run = undefined;
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, role: 'user', nama: 'Guru uji' } as any);
  db = new SqliteD1(); db.sqlite.exec('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1);'); db.sqlite.exec(readFileSync('migrations/0029_ai_generation_jobs.sql', 'utf8'));
  app = new Hono().route('/presentation', presentation);
});
afterEach(() => { db.close(); vi.unstubAllGlobals(); });
const request = (route = 'generate', body = input) => app.request(`/presentation/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AI-Job-Id': 'slide-studio-job-123' }, body: JSON.stringify(body) }, { DB: db });
describe('Classroom presentation generation', () => {
  it('uses the displayed provider and complete teacher brief instead of forcing Gemini', async () => {
    const response = await request(); expect(response.status).toBe(200);
    expect(ai.calls[0].provider).toBe('api'); expect(ai.calls[0].prompt).toContain('Kelas 3'); expect(ai.calls[0].prompt).not.toContain('Membaca tiga perempat'); expect(ai.calls[0].prompt).toContain('Gunakan kertas lipat');
    expect(ai.calls[0].prompt).toContain('Jangan membuat slide khusus tujuan pembelajaran');
    expect(resolveProviderSlug()).toBeUndefined(); expect(resolveProviderSlug('vertex')).toBe('vertex-proxy');
    expect((await response.json() as any).data.meta.quality.needsTeacherReview).toBe(true);
  });
  it('requires authentication before any slide generation, including streaming', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await request()).status).toBe(401); expect((await request('generate-stream')).status).toBe(401); expect(ai.calls).toHaveLength(0);
  });
  it('repairs once and reports failure instead of manufacturing missing slides or answers', async () => {
    ai.result = { title: 'Draf belum lengkap', slides: [{ title: 'Latihan', layout: 'quiz' }] };
    const response = await request(); expect(response.status).toBe(422); expect(ai.calls).toHaveLength(2);
    const error = (await response.json() as any).error;
    expect(error).toMatchObject({ code: 'AI_OUTPUT_INVALID', message: expect.stringContaining('belum mengirim materi'), details: expect.any(Array) });
    expect(error.message).not.toContain('Periksa tujuan');
  });
  it('omits objectives slides without removing the actual lesson or rewriting a complete result', async () => {
    ai.result.slides.splice(1, 0, { layout: 'content', title: 'Tujuan Pembelajaran', content: [] });
    ai.result.slides[2].points = ai.result.slides[2].content; ai.result.slides[2].content = [];
    const response = await request(); expect(response.status).toBe(200); expect(ai.calls).toHaveLength(1);
    const deck = (await response.json() as any).data;
    expect(deck.slides).toHaveLength(8); expect(deck.slides.some((s: any) => s.title === 'Tujuan Pembelajaran')).toBe(false);
    expect(deck.slides[1].content).toEqual(ai.result.slides[2].points);
    expect(deck.meta.quality).toMatchObject({ partial: false, contentIssues: [], countWarning: '' });
  });
  it('keeps sixteen slides and two missing content sections as a cached, explicitly partial draft for a fifteen-slide request', async () => {
    for (let i = 8; i < 16; i++) ai.result.slides.splice(-1, 0, { layout: 'content', title: `Materi bentuk ${i}`, content: ['Lingkaran tidak mempunyai sudut.'] });
    ai.result.slides[1] = { layout: 'content', title: 'Mengenal bentuk', content: [] };
    ai.result.slides[5] = { layout: 'content', title: 'Keliling bentuk', content: [] };
    const body = { ...input, slideCount: 15 };
    const result = await (await request('generate-stream', body)).text();
    expect(result).toContain('event: done'); expect(result).not.toContain('event: error'); expect(ai.calls).toHaveLength(2);
    const done = JSON.parse(result.match(/event: done\ndata: (.+)/)![1]);
    expect(done.partial).toBe(true); expect(done.data.slides).toHaveLength(16);
    expect(done.data.meta.quality).toMatchObject({ partial: true, readyForExport: false, countWarning: expect.stringContaining('16 slide materi, dari target 15') });
    expect(done.data.meta.quality.contentIssues).toEqual(expect.arrayContaining([expect.stringContaining('Slide 2:'), expect.stringContaining('Slide 6:')]));
    expect(done.data.slides[1].content).toEqual([]); expect(done.data.slides[5].content).toEqual([]);
    expect(db.sqlite.prepare('SELECT state FROM ai_generation_jobs').get()).toMatchObject({ state: 'partial' });
    expect(await (await request('generate-stream', body)).text()).toContain('event: done'); expect(ai.calls).toHaveLength(2);
  });
  it('preserves a complete result with an extra material slide and reports its actual count without another provider request', async () => {
    ai.result.slides.splice(-1, 0, { layout: 'content', title: 'Contoh lingkaran', content: ['Tepi piring berbentuk lingkaran.'] });
    const response = await request(); expect(response.status).toBe(200); expect(ai.calls).toHaveLength(1);
    const deck = (await response.json() as any).data;
    expect(deck.slides).toHaveLength(9); expect(deck.meta.requestedSlideCount).toBe(8);
    expect(deck.meta.quality.partial).toBe(false); expect(deck.meta.quality.countWarning).toContain('9 slide materi, dari target 8');
  });
  it.each(['empty-repair', 'failed-repair'])('keeps useful original material when a repair is %s', async mode => {
    const original = structuredClone(ai.result);
    original.slides[1] = { layout: 'content', title: 'Mengenal pecahan', content: [] };
    let call = 0;
    ai.run = () => {
      if (++call === 1) return original;
      if (mode === 'failed-repair') throw new Error('Provider perbaikan tidak tersedia');
      return { slides: [] };
    };
    const response = await request(); expect(response.status).toBe(200); expect(ai.calls).toHaveLength(2);
    const deck = (await response.json() as any).data;
    expect(deck.slides).toHaveLength(8); expect(deck.slides[2].title).toBe(original.slides[2].title);
    expect(deck.meta.quality).toMatchObject({ partial: true, readyForExport: false });
    expect(deck.slides[1].content).toEqual([]);
  });
  it('delivers valid comparison material without asking the provider to rewrite a layout problem', async () => {
    ai.result.slides[2] = { layout: 'comparison', title: 'Mengenal bentuk dan keliling', leftTitle: 'Lingkaran', leftContent: ['Tidak memiliki sudut.', 'Kelilingnya disebut keliling lingkaran.', 'Semua titik tepi berjarak sama dari pusat.'], rightTitle: 'Persegi', rightContent: ['Memiliki empat sudut.', 'Keempat sisinya sama panjang.', 'Keliling adalah jumlah panjang semua sisi.'] };
    const response = await request('generate', { ...input, aspectRatio: '4:3' } as any);
    expect(response.status).toBe(200); expect(ai.calls).toHaveLength(1);
    const deck = (await response.json() as any).data;
    expect(deck.slides[2].leftContent[1]).toBe('Kelilingnya disebut keliling lingkaran.');
    expect(deck.meta.quality).toMatchObject({ readyForExport: true, layoutWarnings: [] });
  });
  it('retains a complete draft with layout warnings for review and cached recovery, without another AI call', async () => {
    ai.result.slides[4].quizExplanation = 'Penjelasan guru yang perlu diringkas. '.repeat(35);
    const result = await (await request('generate-stream')).text();
    expect(result).toContain('event: done'); expect(result).not.toContain('event: error'); expect(ai.calls).toHaveLength(1);
    const done = JSON.parse(result.match(/event: done\ndata: (.+)/)![1]);
    expect(done.data.slides[4].quizExplanation).toBe(ai.result.slides[4].quizExplanation.trim());
    expect(done.data.meta.quality.readyForExport).toBe(false);
    expect(done.data.meta.quality.layoutWarnings[0]).toContain('Slide 5');
    const stored = db.sqlite.prepare('SELECT state, result_json FROM ai_generation_jobs').get() as any;
    expect(stored.state).toBe('completed'); expect(JSON.parse(stored.result_json).data.meta.quality.readyForExport).toBe(false);
    expect(await (await request('generate-stream')).text()).toContain('event: done'); expect(ai.calls).toHaveLength(1);
  });
  it('caches a validated stream result and replays it without a second provider generation', async () => {
    const first = await (await request('generate-stream')).text(); expect(first).toContain('event: done');
    expect(first).toContain('struktur_dan_keterbacaan'); expect(await (await request('generate-stream')).text()).toContain('event: done'); expect(ai.calls).toHaveLength(1);
  });
  it('cancels the provider on stream disconnect and never emits an empty success', async () => {
    ai.run = () => new Promise((_resolve, reject) => ai.signal!.addEventListener('abort', () => reject(ai.signal!.reason), { once: true }));
    const reader = (await request('generate-stream')).body!.getReader(); await reader.read(); await reader.cancel();
    await vi.waitFor(() => expect(ai.signal?.aborted).toBe(true));
    await vi.waitFor(() => expect(db.sqlite.prepare('SELECT state FROM ai_generation_jobs').get()).toMatchObject({ state: 'cancelled' }));
  });
});
