import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { state } from '../public/static/js/state.js';

const { apiMock, preflightMock, docxMock, toastMock, streamMock, monitorMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  preflightMock: vi.fn(),
  docxMock: vi.fn(),
  toastMock: vi.fn(),
  streamMock: vi.fn(),
  monitorMock: vi.fn(),
}));

vi.mock('../public/static/js/api.js', () => ({ api: apiMock, getCsrfToken: () => null }));
vi.mock('../public/static/js/asesmen-docx.js', () => ({
  prepareAssessmentExportImages: preflightMock,
  generateAsesmenDocx: docxMock,
  preloadAsesmenImages: vi.fn(),
}));
vi.mock('../public/static/js/utils.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../public/static/js/utils.js')>();
  return { ...actual, showToast: toastMock, showLoading: vi.fn(), hideLoading: vi.fn(), populateAiModelSelect: vi.fn(), streamPost: streamMock, openAiLiveMonitor: monitorMock };
});

import { renderKisi, initKisi } from '../public/static/js/pages/kisi.js';

const generated = () => ({
  pg: [
    { no: 1, soal: 'Pertanyaan satu', opsi: { A: 'a', B: 'b', C: 'c', D: 'd' }, kunci: 'A', gambar: { assetId: 'asset-1', url: '/api/banksoal/42/assets/asset-1', mime: 'image/png', type: 'photo', credit: 'Buku', params: { keep: true } } },
    { no: 2, soal: 'Pertanyaan dua', opsi: { A: 'a', B: 'b', C: 'c', D: 'd' }, kunci: 'B' },
  ],
  isian: { type: 'Standard', data: [{ no: 3, soal: 'Isian satu', kunci: 'jawab' }, { no: 4, soal: 'Isian dua', kunci: 'jawab' }] },
  uraian: [{ no: 5, soal: 'Uraian satu', kunci: 'jawab', rubrik_skor: { lengkap: 2 } }],
  _persistence: { packageId: 42, revision: 1, saveStatus: 'saved', imageWarnings: [] },
});
let nextPackageId = 42;

describe('assessment package UI client integration', () => {
  let revision: number;
  let packageId: number;
  let content: any;
  let prepareFailure: any[];
  let forceConflict: boolean;
  let deferPut: boolean;
  let pendingPutResolve: ((value: any) => void) | null;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('kkg_ai_streaming_mode', 'false');
    state.user = { id: 7, role: 'user', nama: 'Guru', sekolah_nama: 'SD Uji', kelas: '5' } as any;
    vi.stubGlobal('confirm', () => true);
    revision = 1;
    content = generated();
    packageId = nextPackageId++;
    content._persistence.packageId = packageId;
    prepareFailure = [];
    forceConflict = false;
    deferPut = false;
    pendingPutResolve = null;
    apiMock.mockClear();
    preflightMock.mockClear();
    docxMock.mockClear();
    streamMock.mockClear();
    monitorMock.mockClear();
    preflightMock.mockImplementation(async () => ({ ready: prepareFailure.length === 0, images: new Map(), failures: prepareFailure }));
    docxMock.mockResolvedValue(new Blob(['docx']));
    monitorMock.mockReturnValue({
      id: 'mock-job', signal: new AbortController().signal,
      updateStep: vi.fn(), appendToken: vi.fn(), reset: vi.fn(), complete: (callback: () => void) => callback(), fail: vi.fn(),
    });
    streamMock.mockImplementation(async (_path, _data, onEvent) => onEvent('done', { data: structuredClone(content) }));
    apiMock.mockImplementation(async (path: string, options: any = {}) => {
      if (path === '/banksoal/stats') return { success: true, data: { total_soal: 2, my_soal: 1, per_mapel: [], per_kelas: [] } };
      if (path === '/kisi/generate') return { success: true, data: structuredClone(content) };
      if (path === '/kisi/regenerate-batch') return { success: true, data: { items: [{ no: 1, soal: 'Soal pengganti', opsi: { A: 'baru', B: 'b', C: 'c', D: 'd' }, kunci: 'A' }] } };
      if (path === `/banksoal/${packageId}` && !options.method) return { success: true, data: { id: packageId, user_id: state.user?.id, is_public: 0, content: structuredClone(content), _persistence: { packageId, revision, saveStatus: 'saved', imageWarnings: [] } } };
      if (path === `/banksoal/${packageId}` && options.method === 'PUT') {
        if (forceConflict) {
          forceConflict = false;
          throw Object.assign(new Error('Konflik revisi'), { status: 409 });
        }
        if (deferPut) return await new Promise(resolve => { pendingPutResolve = resolve; });
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        expect(body.baseRevision).toBe(revision);
        revision++;
        content = body.content;
        return { success: true, data: { packageId, revision, saveStatus: 'saved' } };
      }
      throw new Error(`Unexpected client call: ${options.method || 'GET'} ${path}`);
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
    state.user = null;
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('preserves live monitor/form and persists editor/delete mutations via the same revision path', async () => {
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    expect(document.getElementById('toggle-kisi-stream')).not.toBeNull();
    expect(document.querySelector('.fw-form-progress')).toBeNull();
    (form.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));
    const generation = apiMock.mock.calls.find(([path]) => path === '/kisi/generate')![1] as any;
    expect(generation.body.clientDocumentId).toMatch(/^[0-9a-f-]{36}$/i);

    document.querySelector<HTMLButtonElement>('.btn-edit-soal[data-index="0"]')!.click();
    document.querySelector<HTMLTextAreaElement>('#edit-soal-text')!.value = 'Pertanyaan satu diperbarui';
    document.querySelector<HTMLInputElement>('#edit-opsi-a')!.value = 'opsi baru';
    (document.querySelector('#edit-kunci') as unknown as HTMLSelectElement).value = 'C';
    document.querySelector<HTMLButtonElement>('.btn-editor-save')!.click();
    await vi.waitFor(() => expect(apiMock.mock.calls.some(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')).toBe(true));
    const firstPut = apiMock.mock.calls.find(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')![1] as any;
    const firstContent = firstPut.body.content;
    expect(firstContent.pg[0]).toMatchObject({ soal: 'Pertanyaan satu diperbarui', opsi: { A: 'opsi baru' }, kunci: 'C' });
    expect(firstContent.pg[0].gambar).toMatchObject({ assetId: 'asset-1', mime: 'image/png', credit: 'Buku', params: { keep: true } });

    document.querySelector<HTMLButtonElement>('.btn-delete-soal[data-type="pg"][data-index="1"]')!.click();
    await vi.waitFor(() => expect(apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')).toHaveLength(2));
    const secondPut = apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')[1][1] as any;
    expect(secondPut.body.content.pg).toHaveLength(1);
    expect(secondPut.body.content.isian.data).toHaveLength(2);

    const isianCheckbox = document.querySelector<HTMLInputElement>('.soal-batch-checkbox[data-type="isian"][data-index="0"]')!;
    isianCheckbox.checked = true;
    isianCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('btn-batch-delete')!.click();
    await vi.waitFor(() => expect(apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')).toHaveLength(3));
    expect(apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')[2][1].body.content.isian.data).toHaveLength(1);

    document.querySelector<HTMLButtonElement>('.btn-regenerate-soal[data-type="pg"]')!.click();
    document.querySelector<HTMLButtonElement>('#btn-submit-batch-regen')!.click();
    await vi.waitFor(() => expect(apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')).toHaveLength(4));
    expect(apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method === 'PUT')[3][1].body.content.pg[0].soal).toBe('Soal pengganti');
  });

  it('flushes before print/DOCX, blocks a missing image, and keeps an explicit on-page recovery warning', async () => {
    content.pg[0].gambar = { assetId: 'asset-1', url: '/api/banksoal/42/assets/asset-1', mime: 'image/png', title: 'Gambar wajib' };
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    (form.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));
    Object.defineProperty(window, 'print', { configurable: true, value: vi.fn() });
    const print = window.print;

    const requiredImage = document.querySelector<HTMLImageElement>('.soal-image-container img')!;
    Object.defineProperty(requiredImage, 'complete', { configurable: true, value: false });
    window.dispatchEvent(new Event('beforeprint'));
    expect(document.getElementById('kisi-print-warning')!.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('kisi-print-warning')!.textContent).toContain('Soal pg nomor 1');
    expect(requiredImage.closest('.soal-image-container')!.classList.contains('image-load-failed')).toBe(false);
    requiredImage.closest('.soal-image-container')!.classList.add('image-load-failed');

    prepareFailure = [{ section: 'pg', number: 1, category: 'load-failed' }];
    document.getElementById('btn-print')!.click();
    await vi.waitFor(() => expect(document.getElementById('kisi-print-warning')!.classList.contains('hidden')).toBe(false));
    expect(document.getElementById('kisi-print-warning')!.textContent).toContain('Soal pg nomor 1');
    expect(print).not.toHaveBeenCalled();
    expect(document.querySelector('.soal-image-container.image-load-failed')).not.toBeNull();
    expect(document.querySelector('.soal-image-container.image-load-failed')!.getAttribute('style')).not.toContain('display:none');

    prepareFailure = [];
    document.querySelector<HTMLButtonElement>('.btn-edit-soal[data-index="0"]')!.click();
    document.querySelector<HTMLTextAreaElement>('#edit-soal-text')!.value = 'Perubahan sebelum DOCX';
    document.querySelector<HTMLButtonElement>('.btn-editor-save')!.click();
    await vi.waitFor(() => expect(document.getElementById('kisi-save-state-label')!.dataset.saveStatus).toBe('unsaved'));
    document.querySelector<HTMLButtonElement>('#btn-download-doc')!.click();
    await vi.waitFor(() => expect(docxMock).toHaveBeenCalled());
    const prepAt = preflightMock.mock.invocationCallOrder.at(-1)!;
    const generateAt = docxMock.mock.invocationCallOrder.at(-1)!;
    expect(prepAt).toBeLessThan(generateAt);
    const saveAt = apiMock.mock.invocationCallOrder.find((_, index) => apiMock.mock.calls[index][0] === `/banksoal/${packageId}` && apiMock.mock.calls[index][1]?.method === 'PUT')!;
    expect(saveAt).toBeLessThan(prepAt);
  });

  it('passes one stable client document identity through the SSE generation attempt', async () => {
    localStorage.setItem('kkg_ai_streaming_mode', 'true');
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    (form.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));
    const payload = streamMock.mock.calls[0][1] as any;
    expect(payload.clientDocumentId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(streamMock).toHaveBeenCalledOnce();
  });

  it('restores an interrupted attempt without a request until clicked, then retries the same frozen identity and payload', async () => {
    const pending = { owner: '7', payload: { mataPelajaran: 'Matematika', topik: 'Bilangan', jenjangKelas: 'Kelas 5', clientDocumentId: '9af1a95e-18aa-4d0d-99b2-98b326f55c20' }, createdAt: Date.now() };
    sessionStorage.setItem('kkg_kisi_generation_pending_7', JSON.stringify(pending));
    document.body.innerHTML = await renderKisi();
    expect(document.getElementById('btn-recover-generation')).not.toBeNull();
    expect(apiMock).not.toHaveBeenCalledWith('/kisi/generate', expect.anything());
    initKisi();
    document.getElementById('btn-recover-generation')!.click();
    await vi.waitFor(() => expect(apiMock.mock.calls.some(([path]) => path === '/kisi/generate')).toBe(true));
    const retry = apiMock.mock.calls.find(([path]) => path === '/kisi/generate')![1] as any;
    expect(retry.body).toEqual(pending.payload);
    expect(retry.body.clientDocumentId).toBe(pending.payload.clientDocumentId);
    expect(retry.headers).toEqual({ 'X-Assessment-Replay-Only': '1' });
    await vi.waitFor(() => expect(sessionStorage.getItem('kkg_kisi_generation_pending_7')).toBeNull());
  });

  it('keeps a pending conflict record and does not silently allocate a new attempt', async () => {
    const pending = { owner: '7', payload: { topik: 'Belum selesai', clientDocumentId: '9af1a95e-18aa-4d0d-99b2-98b326f55c20' }, createdAt: Date.now() };
    sessionStorage.setItem('kkg_kisi_generation_pending_7', JSON.stringify(pending));
    apiMock.mockImplementation(async (path: string) => {
      if (path === '/banksoal/stats') return { success: true, data: { total_soal: 0, my_soal: 0, per_mapel: [], per_kelas: [] } };
      if (path === '/kisi/generate') return { success: false, error: { message: 'Proses sebelumnya masih berjalan.' } };
      throw new Error(`Unexpected client call: ${path}`);
    });
    document.body.innerHTML = await renderKisi();
    initKisi();
    document.getElementById('btn-recover-generation')!.click();
    await vi.waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.stringContaining('masih berjalan'), 'warning'));
    expect(JSON.parse(sessionStorage.getItem('kkg_kisi_generation_pending_7')!).payload.clientDocumentId).toBe(pending.payload.clientDocumentId);
    expect(apiMock.mock.calls.filter(([path]) => path === '/kisi/generate')).toHaveLength(1);
  });

  it('preserves an actual question edit made while replay-only recovery is pending', async () => {
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    (form.querySelector('[name="mataPelajaran"]') as unknown as { value: string }).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));

    const pending = { owner: '7', payload: { mataPelajaran: 'Matematika', topik: 'Sebelumnya', clientDocumentId: '9af1a95e-18aa-4d0d-99b2-98b326f55c20' }, createdAt: Date.now() };
    sessionStorage.setItem('kkg_kisi_generation_pending_7', JSON.stringify(pending));
    const recoveryButton = document.getElementById('btn-recover-generation')!;
    recoveryButton.classList.remove('hidden');
    let resolveReplay!: (result: any) => void;
    const revisionAtStart = revision;
    apiMock.mockImplementation(async (path: string, options: any = {}) => {
      if (path === '/banksoal/stats') return { success: true, data: { total_soal: 2, my_soal: 1, per_mapel: [], per_kelas: [] } };
      if (path === '/kisi/generate' && options.headers?.['X-Assessment-Replay-Only'] === '1') return await new Promise(resolve => { resolveReplay = resolve; });
      if (path === `/banksoal/${packageId}` && options.method === 'PUT') return { success: true, data: { packageId, revision: ++revision, saveStatus: 'saved' } };
      throw new Error(`Unexpected client call: ${options.method || 'GET'} ${path}`);
    });
    recoveryButton.click();
    await vi.waitFor(() => expect(resolveReplay).toBeTypeOf('function'));
    expect(apiMock.mock.calls.find(([path, options]) => path === '/kisi/generate' && options?.headers?.['X-Assessment-Replay-Only'] === '1')).toBeDefined();

    document.querySelector<HTMLButtonElement>('.btn-edit-soal[data-index="0"]')!.click();
    document.querySelector<HTMLTextAreaElement>('#edit-soal-text')!.value = 'Edit lokal harus bertahan';
    document.querySelector<HTMLButtonElement>('.btn-editor-save')!.click();
    await vi.waitFor(() => expect(document.querySelector('#asesmen-canvas .soal-text')!.textContent).toContain('Edit lokal harus bertahan'));
    expect(revision).toBe(revisionAtStart);

    resolveReplay({ success: true, data: { ...generated(), pg: [{ no: 1, soal: 'Hasil lama dari replay' }] } });
    await Promise.resolve();
    expect(document.querySelector('#asesmen-canvas .soal-text')!.textContent).toContain('Edit lokal harus bertahan');
    expect(document.querySelector('#asesmen-canvas .soal-text')!.textContent).not.toContain('Hasil lama dari replay');
    expect(JSON.parse(sessionStorage.getItem('kkg_kisi_generation_pending_7')!).payload.clientDocumentId).toBe(pending.payload.clientDocumentId);
    await vi.waitFor(() => expect(document.getElementById('kisi-save-state-label')!.dataset.saveStatus).toBe('saved'));
  });

  it('ignores a replay response after the authenticated owner changes', async () => {
    const pending = { owner: '7', payload: { topik: 'Aman', clientDocumentId: '9af1a95e-18aa-4d0d-99b2-98b326f55c20' }, createdAt: Date.now() };
    sessionStorage.setItem('kkg_kisi_generation_pending_7', JSON.stringify(pending));
    let finish!: (value: any) => void;
    apiMock.mockImplementation((path: string) => path === '/kisi/generate' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve({ success: true, data: { total_soal: 0, my_soal: 0, per_mapel: [], per_kelas: [] } }));
    document.body.innerHTML = await renderKisi();
    initKisi();
    document.getElementById('btn-recover-generation')!.click();
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    state.user = { id: 8, role: 'user' } as any;
    finish({ success: true, data: generated() });
    await Promise.resolve();
    expect(sessionStorage.getItem('kkg_kisi_generation_pending_7')).not.toBeNull();
    expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(true);
  });

  it('keeps recovery visible after uncertain normal-generation failure and sends replay-only header', async () => {
    localStorage.setItem('kkg_ai_streaming_mode', 'true');
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    (form.querySelector('[name="mataPelajaran"]') as unknown as { value: string }).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    streamMock.mockImplementation(async () => { throw new Error('connection lost'); });
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('btn-recover-generation')!.classList.contains('hidden')).toBe(false));
    expect(apiMock.mock.calls.some(([path]) => path === '/kisi/generate')).toBe(false);
  });

  it('aborts server reload when quota failure prevents the required local backup', async () => {
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    (form.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));

    document.querySelector<HTMLButtonElement>('.btn-edit-soal[data-index="0"]')!.click();
    document.querySelector<HTMLTextAreaElement>('#edit-soal-text')!.value = 'Perubahan lokal penting';
    forceConflict = true;
    document.querySelector<HTMLButtonElement>('.btn-editor-save')!.click();
    await vi.waitFor(() => expect(document.getElementById('kisi-save-state-label')!.dataset.saveStatus).toBe('conflict'));
    const originalSet = localStorage.setItem.bind(localStorage);
    const storageSpy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'kkg_archive_kisi_7') throw new DOMException('quota exceeded', 'QuotaExceededError');
      return originalSet(key, value);
    });

    document.getElementById('kisi-save-server')!.click();
    await vi.waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.stringContaining('Salinan lokal gagal disimpan'), 'error'));
    expect(apiMock.mock.calls.filter(([path, options]) => path === `/banksoal/${packageId}` && options?.method !== 'PUT')).toHaveLength(0);
    expect(document.querySelector('#asesmen-canvas .soal-text')!.textContent).toContain('Perubahan lokal penting');
    storageSpy.mockRestore();
    document.getElementById('kisi-save-server')!.click();
    await vi.waitFor(() => expect(apiMock.mock.calls.some(([path, options]) => path === `/banksoal/${packageId}` && !options?.method)).toBe(true));
  });

  it('blocks DOCX after account changes while the pre-export CAS flush is pending', async () => {
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    (form.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));
    document.querySelector<HTMLButtonElement>('.btn-edit-soal[data-index="0"]')!.click();
    document.querySelector<HTMLTextAreaElement>('#edit-soal-text')!.value = 'Belum tersimpan';
    deferPut = true;
    document.querySelector<HTMLButtonElement>('.btn-editor-save')!.click();
    document.querySelector<HTMLButtonElement>('#btn-download-doc')!.click();
    await vi.waitFor(() => expect(pendingPutResolve).toBeTypeOf('function'));
    state.user = { ...state.user!, id: 8 } as any;
    pendingPutResolve!({ success: true, data: { packageId, revision: 2, saveStatus: 'saved' } });
    await vi.waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.stringContaining('akun berubah'), 'error'));
    expect(preflightMock).not.toHaveBeenCalled();
    expect(docxMock).not.toHaveBeenCalled();
    state.user = { id: 7, role: 'user', nama: 'Guru', sekolah_nama: 'SD Uji', kelas: '5' } as any;
    document.getElementById('kisi-save-server')!.click();
    await vi.waitFor(() => expect(apiMock.mock.calls.some(([path, options]) => path === `/banksoal/${packageId}` && !options?.method)).toBe(true));
  });

  it('blocks DOCX when the owner changes during shared image preflight', async () => {
    document.body.innerHTML = await renderKisi();
    const form = document.getElementById('asesmen-form') as HTMLFormElement;
    (form.querySelector('[name="mataPelajaran"]') as unknown as HTMLSelectElement).value = 'Matematika';
    form.querySelector<HTMLTextAreaElement>('[name="topik"]')!.value = 'Pecahan';
    initKisi();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('asesmen-result-view')!.classList.contains('hidden')).toBe(false));
    let finishPreflight!: (value: any) => void;
    preflightMock.mockImplementation(() => new Promise(resolve => { finishPreflight = resolve; }));
    document.querySelector<HTMLButtonElement>('#btn-download-doc')!.click();
    await vi.waitFor(() => expect(finishPreflight).toBeTypeOf('function'));
    state.user = { ...state.user!, id: 9 } as any;
    finishPreflight({ ready: true, images: new Map(), failures: [] });
    await vi.waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.stringContaining('akun berubah'), 'error'));
    expect(docxMock).not.toHaveBeenCalled();
  });
});
