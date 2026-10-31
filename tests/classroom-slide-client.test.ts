import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
const mocks = vi.hoisted(() => ({ api: vi.fn(), stream: vi.fn(), providers: [{ slug: 'api', name: 'API kelas', configured: 1 }, { slug: 'gemini-flash', name: 'Gemini', configured: 0 }] }));
vi.mock('../public/static/js/api.js', async original => ({ ...await original<any>(), api: mocks.api }));
vi.mock('../public/static/js/ai-stream.js', async original => ({ ...await original<any>(), streamPost: mocks.stream }));
let studio: any, monitor: any, appState: any;
beforeEach(async () => {
  vi.resetModules(); vi.stubGlobal('crypto', webcrypto); localStorage.clear();
  document.body.innerHTML = '<div id="app"><main id="main-content" data-feature-page="slide"></main></div>';
  appState = (await import('../public/static/js/state.js')).state;
  appState.user = { id: 91, nama: 'Guru uji', role: 'user' }; appState.currentPage = 'slide';
  mocks.api.mockReset().mockImplementation(async (path: string, options?: any) => {
    if (path === '/ai-providers/active') return { success: true, data: mocks.providers };
    if (path === '/presentation/outline') return { success: true, data: { outline: [{ index: 1, title: 'Gagasan utama', layout: 'content', focus: 'Konsep inti', visualConcept: 'Contoh dekat dengan siswa' }] } };
    if (path.startsWith('/document-drafts?')) return { success: true, data: [] };
    if (options?.method === 'PUT' && path.startsWith('/document-drafts/presentation/')) return { success: true, data: { revision: Number(options.body.baseRevision) + 1 } };
    if (options?.method === 'POST' && path.includes('/checkpoints')) return { success: true, data: { revision: 1 } };
    return { success: true, data: {} };
  }); mocks.stream.mockReset();
  studio = await import('../public/static/js/pages/slide.js'); monitor = await import('../public/static/js/ai-live-monitor.js');
  document.querySelector('#main-content')!.innerHTML = studio.renderSlide(); studio.initSlide();
  await vi.waitFor(() => expect((document.querySelector('#sg-model-select') as unknown as HTMLSelectElement).value).toBe('api'));
});
afterEach(() => { document.querySelector<HTMLButtonElement>('#monitor-dismiss-btn')?.click(); vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.innerHTML = ''; });
async function submitBriefToTemplates(form = document.querySelector<HTMLFormElement>('#sg-brief-form')!) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(document.querySelector('#sg-generate')).not.toBeNull());
  expect(document.querySelector('#sg-outline-form')).toBeNull();
}
async function openExampleDeck(template = 'matematika-visual') {
  const rawDeck = (await import('../public/static/js/slides/examples.js')).exampleDeck(template);
  const deck = (await import('../public/static/js/slides/lesson-model.js')).normalizeDeck(rawDeck, rawDeck.title);
  const draft = (window as any).slideGenState;
  draft.deck = deck; draft.template = template; draft.config.topik = deck.title; draft.config.mataPelajaran = template === 'jelajah-ipas' ? 'IPAS' : 'Matematika'; draft.view = 'editor'; draft.index = 0; draft.reveal = false;
  document.querySelector('#main-content')!.innerHTML = studio.renderSlide(); studio.initSlide();
  document.querySelector<HTMLInputElement>('[data-field="title"]')!.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(document.querySelector('#sg-slide-render-area svg')).not.toBeNull());
}
describe('Teacher-facing Slide workflow', () => {
  it('saves an unfinished brief and keeps template selection independent of model status', async () => {
    const topic = document.querySelector<HTMLTextAreaElement>('[name="topik"]')!;
    topic.value = 'Siklus air di lingkungan sekolah'; topic.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => expect(JSON.parse(localStorage.getItem('kkg_slide_studio_v2_91')!).config.topik).toBe(topic.value));
    const brief = document.querySelector<HTMLFormElement>('#sg-brief-form')!;
    expect(brief.querySelectorAll('button[type="submit"]')).toHaveLength(1);
    expect(brief.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent).toContain('Buat slide');
    expect(brief.querySelector('#sg-outline')).toBeNull();
    expect(brief.querySelector('#sg-example')).toBeNull();
    expect(brief.querySelector('textarea[name="topik"]')!.getAttribute('rows')).toBe('4');
    expect(document.body.textContent).not.toContain('Lihat contoh hasil');
    const subjects = [...brief.querySelectorAll<HTMLOptionElement>('[name="mataPelajaran"] option')].map(option => option.value);
    expect(subjects).toEqual([
      'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika',
      'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      'Bahasa Inggris', 'Seni Rupa', 'Koding dan Kecerdasan Artifisial', 'B.Sunda', 'Tatanen di Bale Atikan', 'AKPK',
    ]);
    expect(subjects).not.toEqual(['IPAS', 'Matematika', 'Bahasa Indonesia', 'Pendidikan Pancasila', 'Bahasa Inggris', 'Seni Budaya', 'PJOK', 'Pendidikan Agama']);
    expect((brief.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value).toBe('Ilmu Pengetahuan Alam dan Sosial (IPAS)');
    brief.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(document.querySelector('#sg-generate')).not.toBeNull());
    expect(mocks.api).toHaveBeenCalledWith('/presentation/outline', expect.objectContaining({ method: 'POST' }));
    expect(document.querySelector('#sg-outline-form')).toBeNull();
    expect(document.querySelector('[data-template]')).not.toBeNull();
    expect((window as any).slideGenState.outline).toEqual([{ index: 1, title: 'Gagasan utama', layout: 'content', focus: 'Konsep inti', visualConcept: 'Contoh dekat dengan siswa' }]);
    await vi.waitFor(() => expect(document.querySelector('#sg-model-status')!.textContent).toContain('Model yang dipilih'));
    document.querySelector<HTMLButtonElement>('#sg-edit-outline')!.click();
    const focus = document.querySelector<HTMLInputElement>('[data-outline="0"] [name="focus"]')!;
    focus.value = 'Fokus yang disunting';
    document.querySelector<HTMLFormElement>('#sg-outline-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('#sg-generate')).not.toBeNull());
    expect((window as any).slideGenState.outline[0].focus).toBe('Fokus yang disunting');
    document.querySelector<HTMLButtonElement>('[data-template="jelajah-ipas"]')!.click();
    expect(document.querySelector('#sg-design-summary')!.textContent).toContain('Jelajah IPAS');
    expect(document.querySelector('#sg-model-status')!.textContent).toContain('Model yang dipilih');
    expect((document.querySelector('#sg-model-select') as unknown as HTMLSelectElement).value).toBe('api');
  });
  it('retains a stored canonical subject selection in the slide brief', async () => {
    (window as any).slideGenState.config.mataPelajaran = 'Matematika';
    document.querySelector('#main-content')!.innerHTML = studio.renderSlide(); studio.initSlide();
    expect((document.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value).toBe('Matematika');
  });
  it('allows selecting theme directly in brief and supports one-click direct slide generation', async () => {
    const brief = document.querySelector<HTMLFormElement>('#sg-brief-form')!;
    const themeChip = brief.querySelector<HTMLElement>('[data-brief-template="jelajah-ipas"]')!;
    expect(themeChip).not.toBeNull();
    themeChip.click();
    expect((window as any).slideGenState.template).toBe('jelajah-ipas');
    await vi.waitFor(() => expect((document.querySelector('#sg-model-select') as unknown as HTMLSelectElement).value).toBe('api'));

    const directBtn = document.querySelector<HTMLButtonElement>('#sg-direct-generate')!;
    expect(directBtn).not.toBeNull();
    expect(directBtn.textContent).toContain('Buat slide langsung jadi');

    const topic = document.querySelector<HTMLTextAreaElement>('[name="topik"]')!;
    topic.value = 'Rantai makanan ekosistem sawah';
    topic.dispatchEvent(new Event('input', { bubbles: true }));

    mocks.stream.mockImplementation(async (path: string, body: any, onEvent: any) => {
      onEvent('done', { data: { title: 'Rantai Makanan', slides: [{ layout: 'content', title: 'Komponen Ekosistem', content: ['Produsen', 'Konsumen'] }] } });
    });

    directBtn.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>('#monitor-review-btn')).not.toBeNull());
    await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.hidden).toBe(false));
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    await vi.waitFor(() => expect((window as any).slideGenState.view).toBe('editor'));
    expect(mocks.stream).toHaveBeenCalledWith('/presentation/generate-stream', expect.objectContaining({
      topik: 'Rantai makanan ekosistem sawah',
      template: 'jelajah-ipas',
    }), expect.any(Function), expect.any(Object));
  });
  it('keeps the brief and saved topic intact when outline creation fails', async () => {
    mocks.api.mockImplementation(async (path: string) => {
      if (path === '/ai-providers/active') return { success: true, data: mocks.providers };
      if (path === '/presentation/outline') throw new Error('Koneksi terputus');
      return { success: true, data: [] };
    });
    const form = document.querySelector<HTMLFormElement>('#sg-brief-form')!;
    const topic = form.querySelector<HTMLTextAreaElement>('[name="topik"]')!;
    topic.value = 'Siklus hujan di sekitar sekolah';
    form.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>('#monitor-error')!.hidden).toBe(false));
    expect(document.querySelector<HTMLTextAreaElement>('#sg-main-prompt')!.value).toBe(topic.value);
    expect(document.querySelector('#sg-brief-form')).not.toBeNull();
    expect(document.querySelector('#sg-outline-form')).toBeNull();
    expect(document.querySelector('#sg-generate')).toBeNull();
    await vi.waitFor(() => expect(JSON.parse(localStorage.getItem('kkg_slide_studio_v2_91')!).config.topik).toBe(topic.value));
  });
  it('sends the displayed model and complete brief even when the teacher never changes the model dropdown', async () => {
    const deck = (await import('../public/static/js/slides/examples.js')).exampleDeck();
    mocks.stream.mockImplementation(async (_url, _data, onEvent) => { onEvent('done', { data: deck }); });
    const form = document.querySelector<HTMLFormElement>('#sg-brief-form')!;
    (form.elements.namedItem('topik') as HTMLTextAreaElement).value = 'Pecahan dengan kertas lipat';
    (form.elements.namedItem('jenjangKelas') as unknown as HTMLSelectElement).value = 'Kelas 3';
    expect(form.elements.namedItem('tujuanPembelajaran')).toBeNull();
    expect(form.textContent).not.toContain('Tujuan belajar');
    (form.elements.namedItem('extraInstructions') as HTMLTextAreaElement).value = 'Tanpa alat digital';
    await submitBriefToTemplates(form);
    await vi.waitFor(() => expect((document.querySelector('#sg-model-select') as unknown as HTMLSelectElement).value).toBe('api'));
    document.querySelector<HTMLButtonElement>('[data-template="jelajah-ipas"]')!.click();
    document.querySelector<HTMLButtonElement>('#sg-generate')!.click(); document.querySelector<HTMLButtonElement>('#sg-generate')!.click();
    await vi.waitFor(() => expect(mocks.stream).toHaveBeenCalledTimes(1));
    expect(mocks.stream.mock.calls[0][1]).toMatchObject({ aiProvider: 'api', jenjangKelas: 'Kelas 3', extraInstructions: 'Tanpa alat digital' });
    expect(mocks.stream.mock.calls[0][1].template).toBe('jelajah-ipas');
    expect(mocks.stream.mock.calls[0][1].customOutline).toEqual([{ index: 1, title: 'Gagasan utama', layout: 'content', focus: 'Konsep inti', visualConcept: 'Contoh dekat dengan siswa' }]);
    expect(mocks.stream.mock.calls[0][1]).not.toHaveProperty('tujuanPembelajaran');
    expect(mocks.stream.mock.calls[0][3]).toMatchObject({ signal: expect.any(AbortSignal), jobId: expect.any(String) });
    await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.hidden).toBe(false));
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#sg-slide-render-area svg')).not.toBeNull());
    await vi.waitFor(() => expect(document.querySelector('.ss-save-status')!.textContent).toContain('Tersimpan di server'));
  });
  it('keeps a layout-warning draft editable and blocks export only until the marked text is fixed', async () => {
    const deck = (await import('../public/static/js/slides/examples.js')).exampleDeck();
    deck.slides[4].quizExplanation = 'Pembahasan yang perlu diringkas. '.repeat(35).trim();
    deck.meta = { quality: { readyForExport: false, layoutWarnings: ['Slide 5: pembahasan terlalu panjang untuk bidang teks.'] } } as any;
    mocks.stream.mockImplementation(async (_url, _data, onEvent) => { onEvent('done', { data: deck }); });
    const form = document.querySelector<HTMLFormElement>('#sg-brief-form')!;
    (form.elements.namedItem('topik') as HTMLTextAreaElement).value = 'Pecahan di kelas';
    await submitBriefToTemplates(form);
    await vi.waitFor(() => expect((document.querySelector('#sg-model-select') as unknown as HTMLSelectElement).value).toBe('api'));
    document.querySelector<HTMLButtonElement>('#sg-generate')!.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.hidden).toBe(false));
    expect(document.querySelector('#monitor-message')!.textContent).toContain('Rapikan bidang teks');
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#sg-quality')!.textContent).toContain('Slide 5'));
    const { exportScenes } = await import('../public/static/js/slides/export.js');
    expect(() => exportScenes((window as any).slideGenState.deck, 'matematika-visual', { aspectRatio: '16:9' })).toThrow('Perbaiki slide');
    document.querySelector<HTMLButtonElement>('[data-slide="4"]')!.click();
    const explanation = document.querySelector<HTMLTextAreaElement>('[data-field="quizExplanation"]')!;
    expect(explanation.value).toBe(deck.slides[4].quizExplanation);
    explanation.value = 'Tiga dari empat bagian sama besar diwarnai.'; explanation.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelector('#sg-quality')!.textContent).toContain('sudah diperiksa');
    expect(exportScenes((window as any).slideGenState.deck, 'matematika-visual', { aspectRatio: '16:9' })).toHaveLength(8);
    expect(mocks.stream).toHaveBeenCalledOnce();
  });
  it('offers an incomplete draft for review and preserves editable material instead of terminating the job', async () => {
    const deck = (await import('../public/static/js/slides/examples.js')).exampleDeck();
    deck.slides[1].layout = 'content'; deck.slides[1].content = []; deck.slides[1].visual = undefined;
    deck.meta = { requestedSlideCount: 8, quality: { partial: true, contentIssues: ['Slide 2: Tambahkan konsep inti yang akan dipelajari.'], layoutWarnings: [] } } as any;
    mocks.stream.mockImplementation(async (_url, _data, onEvent) => { onEvent('done', { partial: true, data: deck }); });
    const form = document.querySelector<HTMLFormElement>('#sg-brief-form')!;
    (form.elements.namedItem('topik') as HTMLTextAreaElement).value = 'Bentuk di sekitar kita';
    await submitBriefToTemplates(form);
    await vi.waitFor(() => expect((document.querySelector('#sg-model-select') as unknown as HTMLSelectElement).value).toBe('api'));
    document.querySelector<HTMLButtonElement>('#sg-generate')!.click();
    await vi.waitFor(() => expect(document.querySelector('#monitor-review-btn')!.textContent).toContain('parsial'));
    expect(document.querySelector('#monitor-message')!.textContent).toContain('Lengkapi slide');
    document.querySelector<HTMLButtonElement>('#monitor-review-btn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#sg-quality')!.textContent).toContain('Slide 2'));
    const { exportScenes } = await import('../public/static/js/slides/export.js');
    expect(() => exportScenes((window as any).slideGenState.deck, 'matematika-visual', { aspectRatio: '16:9' })).toThrow();
    document.querySelector<HTMLButtonElement>('[data-slide="1"]')!.click();
    const content = document.querySelector<HTMLTextAreaElement>('[data-field="content"]')!;
    content.value = 'Pecahan menyatakan bagian dari satu keseluruhan.'; content.dispatchEvent(new Event('input', { bubbles: true }));
    expect(exportScenes((window as any).slideGenState.deck, 'matematika-visual', { aspectRatio: '16:9' })).toHaveLength(8);
    expect(mocks.stream).toHaveBeenCalledOnce();
  });
  it('keeps sample quiz answers hidden, then reveals them only on teacher action and saves edits', async () => {
    await openExampleDeck();
    document.querySelector<HTMLButtonElement>('[data-slide="4"]')!.click();
    expect(document.querySelector('#sg-slide-render-area')!.textContent).not.toContain('Pembilang menunjukkan');
    document.querySelector<HTMLButtonElement>('#sg-reveal')!.click();
    expect(document.querySelector('#sg-slide-render-area')!.textContent).toContain('Pembilang menunjukkan');
    const title = document.querySelector<HTMLInputElement>('[data-field="title"]')!; title.value = 'Latihan pecahan'; title.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => expect(JSON.parse(localStorage.getItem('kkg_slide_studio_v2_91')!).deck.slides[4].title).toBe('Latihan pecahan'));
  });
  it('marks an unavailable model as unavailable and disables the single AI creation action', async () => {
    mocks.api.mockResolvedValue({ success: true, data: [{ slug: 'gemini', name: 'Gemini', configured: 0 }] });
    document.querySelector<HTMLButtonElement>('#sg-reload-model')!.click();
    await vi.waitFor(() => expect(document.querySelector('#sg-model-status')!.textContent).toContain('Belum ada model siap pakai'));
    expect(document.querySelector<HTMLButtonElement>('#sg-brief-form button[type="submit"]')!.disabled).toBe(true);
    expect(document.querySelector('#sg-outline')).toBeNull();
    expect(document.querySelector('#sg-example')).toBeNull();
  });
  it('does not restore a removed objectives field from an older saved brief', async () => {
    appState.user = { ...appState.user, id: 92 };
    localStorage.setItem('kkg_slide_studio_v2_92', JSON.stringify({ version: 2, config: { topik: 'Bentuk di rumah', tujuanPembelajaran: 'Tujuan lama', tujuan_pembelajaran: 'Tujuan lama lain' }, deck: { slides: [] } }));
    document.querySelector('#main-content')!.innerHTML = studio.renderSlide(); studio.initSlide();
    expect(document.querySelector('[name="tujuanPembelajaran"]')).toBeNull();
    expect((window as any).slideGenState.config).not.toHaveProperty('tujuanPembelajaran');
    expect((window as any).slideGenState.config).not.toHaveProperty('tujuan_pembelajaran');
    expect((window as any).slideGenState.config.topik).toBe('Bentuk di rumah');
  });
  it('round-trips a saved version through the real archive drawer and restores its original edited content', async () => {
    await openExampleDeck();
    const title = document.querySelector<HTMLInputElement>('[data-field="title"]')!;
    title.value = 'Versi untuk kelas tiga'; title.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('#sg-save-archive')!.click();
    title.value = 'Edit setelah arsip'; title.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('#sg-history')!.click();
    expect(document.querySelector('#kkg-archive-drawer-root')!.textContent).toContain('Riwayat Slide');
    expect(document.querySelectorAll('.btn-open-archive')).toHaveLength(1);
    document.querySelector<HTMLButtonElement>('.btn-open-archive')!.click();
    expect(document.querySelector<HTMLInputElement>('[data-field="title"]')!.value).toBe('Versi untuk kelas tiga');
    expect(document.querySelector('#kkg-archive-drawer-root')).toBeNull();
  });
  it('restores a server draft by listing metadata then fetching its owner-scoped detail payload', async () => {
    const detail = { module: 'presentation', document_id: 'remote-draft', title: 'Draf lintas perangkat', revision: 3, payload: { config: { topik: 'Kelas pecahan' }, deck: (await import('../public/static/js/slides/examples.js')).exampleDeck(), template: 'matematika-visual', outline: [], index: 0 } };
    mocks.api.mockImplementation(async (path: string, options?: any) => {
      if (path === '/ai-providers/active') return { success: true, data: mocks.providers };
      if (path.startsWith('/document-drafts?')) return { success: true, data: [{ document_id: detail.document_id, title: detail.title, revision: 3, server_updated_at: '2026-10-16' }] };
      if (path === `/document-drafts/presentation/${detail.document_id}`) return { success: true, data: detail };
      if (options?.method === 'PUT') return { success: true, data: { revision: Number(options.body.baseRevision) + 1 } };
      return { success: true, data: {} };
    });
    vi.stubGlobal('confirm', () => true);
    document.querySelector<HTMLButtonElement>('#sg-server-drafts')!.click();
    await vi.waitFor(() => expect(document.querySelector('.ss-server-draft')).not.toBeNull());
    document.querySelector<HTMLButtonElement>('.ss-server-draft')!.click();
    await vi.waitFor(() => expect((window as any).slideGenState.config.topik).toBe('Kelas pecahan'));
    expect(mocks.api).toHaveBeenCalledWith(`/document-drafts/presentation/${detail.document_id}`);
    expect(document.querySelector('#sg-slide-render-area svg')).not.toBeNull();
  });
  it('keeps offline edits locally and offers explicit conflict recovery without overwriting the remote draft', async () => {
    const writes: any[] = [];
    mocks.api.mockImplementation(async (path: string, options?: any) => {
      if (path === '/ai-providers/active') return { success: true, data: mocks.providers };
      if (options?.method === 'PUT' && path.startsWith('/document-drafts/presentation/')) {
        writes.push({ path, body: options.body });
        if (writes.length === 1) throw Object.assign(new Error('stale'), { status: 409, code: 'REVISION_CONFLICT' });
        return { success: true, data: { revision: 1 } };
      }
      return { success: true, data: [] };
    });
    await openExampleDeck();
    await vi.waitFor(() => expect(document.querySelector('#sg-conflict-actions')).not.toBeNull());
    const localKey = 'kkg_slide_studio_v2_91';
    expect(JSON.parse(localStorage.getItem(localKey)!).deck.slides.length).toBeGreaterThan(0);
    expect(writes).toHaveLength(1);
    document.querySelector<HTMLButtonElement>('#sg-save-local-copy')!.click();
    await vi.waitFor(() => expect(writes).toHaveLength(2));
    expect(writes[1].path).not.toBe(writes[0].path);
    expect(writes[1].body.baseRevision).toBe(0);
    expect(JSON.parse(localStorage.getItem(localKey)!).deck.slides.length).toBeGreaterThan(0);
  });
  it('retains an edited deck in the existing local draft when the server is offline', async () => {
    mocks.api.mockImplementation(async (path: string, options?: any) => {
      if (path === '/ai-providers/active') return { success: true, data: mocks.providers };
      if (options?.method === 'PUT') throw new Error('network unavailable');
      return { success: true, data: [] };
    });
    await openExampleDeck();
    await vi.waitFor(() => expect(document.querySelector('.ss-save-status')!.textContent).toContain('Offline'));
    const draft = JSON.parse(localStorage.getItem('kkg_slide_studio_v2_91')!);
    expect(draft.deck.slides.length).toBeGreaterThan(0);
    expect(draft.serverDocumentId).toBeTruthy();
    expect(Number.isFinite(draft.serverRevision)).toBe(true);
  });
  it('flushes an immediate editor change before saving its checkpoint revision', async () => {
    const writes: any[] = [];
    const checkpoints: any[] = [];
    mocks.api.mockImplementation(async (path: string, options?: any) => {
      if (path === '/ai-providers/active') return { success: true, data: mocks.providers };
      if (options?.method === 'PUT' && path.startsWith('/document-drafts/presentation/')) {
        writes.push(options.body);
        return { success: true, data: { revision: options.body.baseRevision + 1 } };
      }
      if (options?.method === 'POST' && path.includes('/checkpoints')) {
        checkpoints.push(options.body);
        return { success: true, data: { revision: options.body.baseRevision } };
      }
      return { success: true, data: [] };
    });
    await openExampleDeck();
    await vi.waitFor(() => expect(writes).toHaveLength(1));
    const title = document.querySelector<HTMLInputElement>('[data-field="title"]')!;
    title.value = 'Perubahan terakhir sebelum checkpoint';
    title.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('#sg-save-checkpoint')!.click();
    await vi.waitFor(() => expect(checkpoints).toHaveLength(1));
    expect(writes).toHaveLength(2);
    expect(writes[1].payload.deck.slides[0].title).toBe('Perubahan terakhir sebelum checkpoint');
    expect(checkpoints[0].baseRevision).toBe(writes[1].baseRevision + 1);
  });
  it('launches presenter mode with class activity timer, blackout toggle and keyboard controls', async () => {
    await openExampleDeck();
    const openBtn = document.querySelector<HTMLButtonElement>('#sg-open-presenter')!;
    expect(openBtn).not.toBeNull();
    openBtn.click();
    const presenter = document.querySelector<HTMLElement>('#sg-fullscreen-container')!;
    expect(presenter).not.toBeNull();
    expect(presenter.querySelector('#ss-timer-display')).not.toBeNull();
    expect(presenter.querySelector('#ss-blackout')).not.toBeNull();

    const blackoutBtn = presenter.querySelector<HTMLButtonElement>('#ss-blackout')!;
    blackoutBtn.click();
    expect(blackoutBtn.getAttribute('aria-pressed')).toBe('true');
    expect(presenter.querySelector<HTMLElement>('#ss-curtain')!.style.display).toBe('block');

    presenter.querySelector<HTMLElement>('#ss-curtain')!.click();
    expect(blackoutBtn.getAttribute('aria-pressed')).toBe('false');
    expect(presenter.querySelector<HTMLElement>('#ss-curtain')!.style.display).toBe('none');

    const timerDisplay = presenter.querySelector<HTMLElement>('#ss-timer-display')!;
    const add1mBtn = presenter.querySelector<HTMLButtonElement>('[data-add="60"]')!;
    add1mBtn.click();
    expect(timerDisplay.textContent).toBe('04:00');

    presenter.querySelector<HTMLButtonElement>('#ss-close')!.click();
    expect(document.querySelector('#sg-fullscreen-container')).toBeNull();
  });
});
