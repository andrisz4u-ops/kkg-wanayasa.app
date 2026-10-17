import { describe, expect, it, vi } from 'vitest';
import { AssessmentPackageSync, canonicalAssessmentContent } from '../public/static/js/assessment-package-sync.js';

describe('assessment package sync client', () => {
  it('serializes rapid edits into owner CAS saves while stripping volatile persistence metadata', async () => {
    const calls: any[] = [];
    const request = vi.fn(async (path, options) => {
      calls.push({ path, options });
      if (options?.method === 'POST') return { data: { packageId: 51, revision: 1, saveStatus: 'saved' } };
      return { data: { packageId: 51, revision: 2, saveStatus: 'saved' } };
    });
    const sync = new AssessmentPackageSync({ request, debounceMs: 60000 });
    sync.setContext({ owner: '7', token: 'current', clientDocumentId: 'stable-id' });
    sync.edit({ pg: [{ no: 1, soal: 'old' }], _persistence: { packageId: 99, revision: 9 } }, { topik: 'Topik', mata_pelajaran: 'IPAS', jenjang_kelas: 'Kelas 5' });
    sync.edit({ pg: [{ no: 1, soal: 'new' }], _persistence: { packageId: 99, revision: 9 } }, { topik: 'Topik', mata_pelajaran: 'IPAS', jenjang_kelas: 'Kelas 5' });
    await sync.flush();
    expect(request).toHaveBeenCalledTimes(1);
    expect(calls[0].path).toBe('/banksoal');
    expect(calls[0].options.body).toMatchObject({ clientDocumentId: 'stable-id', topik: 'Topik', content: { pg: [{ no: 1, soal: 'new' }] } });
    expect(calls[0].options.body.content._persistence).toBeUndefined();
    expect(sync.context).toMatchObject({ packageId: 51, revision: 1, owner: '7' });

    sync.edit({ pg: [{ no: 1, soal: 'edited' }] }, { topik: 'Topik', mata_pelajaran: 'IPAS', jenjang_kelas: 'Kelas 5' });
    await sync.flush();
    expect(calls[1].path).toBe('/banksoal/51');
    expect(calls[1].options.body).toMatchObject({ baseRevision: 1, content: { pg: [{ no: 1, soal: 'edited' }] } });
    expect(sync.context!.revision).toBe(2);
    expect(sync.status).toBe('saved');
    expect(canonicalAssessmentContent({ pg: [], _persistence: { revision: 1 } })).toEqual({ pg: [] });
  });

  it('keeps local work on network failure and permits an explicit retry', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: { packageId: 11, revision: 1, saveStatus: 'saved' } });
    const sync = new AssessmentPackageSync({ request, debounceMs: 60000 });
    sync.setContext({ owner: 7, token: 'same' });
    sync.edit({ pg: [{ soal: 'local edit' }] }, { topik: 'T', mata_pelajaran: 'M', jenjang_kelas: 'Kelas 3' });
    await expect(sync.flush()).rejects.toThrow('offline');
    expect(sync.status).toBe('failed');
    expect((sync.snapshot!.content as any).pg[0].soal).toBe('local edit');
    await sync.retry();
    expect(sync.status).toBe('saved');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('surfaces a CAS conflict and never overwrites the active snapshot by automatic retry', async () => {
    const conflict = Object.assign(new Error('revision conflict'), { status: 409 });
    const request = vi.fn().mockRejectedValue(conflict);
    const onConflict = vi.fn();
    const sync = new AssessmentPackageSync({ request, onConflict, debounceMs: 60000 });
    sync.setContext({ packageId: 9, revision: 3, owner: 7, token: 'conflict' });
    sync.edit({ pg: [{ soal: 'preserved' }] }, {});
    await expect(sync.flush()).rejects.toThrow('revision conflict');
    expect(sync.status).toBe('conflict');
    expect((sync.snapshot!.content as any).pg[0].soal).toBe('preserved');
    await expect(sync.retry()).rejects.toThrow('revision conflict');
    expect(request).toHaveBeenCalledTimes(1);
    expect(onConflict).toHaveBeenCalledOnce();
  });

  it('ignores an old save response after active context changes', async () => {
    let resolveSave!: (value: any) => void;
    const request = vi.fn(() => new Promise(resolve => { resolveSave = resolve; }));
    const sync = new AssessmentPackageSync({ request, debounceMs: 60000 });
    sync.setContext({ packageId: 1, revision: 4, owner: 7, token: 'old' });
    sync.edit({ pg: [] }, {});
    const save = sync.flush();
    await Promise.resolve();
    sync.setContext({ packageId: 2, revision: 8, owner: 12, token: 'new' });
    resolveSave({ data: { packageId: 1, revision: 5, saveStatus: 'saved' } });
    expect(await save).toMatchObject({ stale: true });
    expect(sync.context).toMatchObject({ packageId: 2, revision: 8, owner: '12' });
  });

  it('ignores save completion after the authenticated owner changes', async () => {
    let owner: number | string = 7;
    let resolveSave!: (value: any) => void;
    const sync = new AssessmentPackageSync({
      ownerProvider: () => owner,
      request: vi.fn(() => new Promise(resolve => { resolveSave = resolve; })),
      debounceMs: 60000,
    });
    sync.setContext({ packageId: 4, revision: 2, owner, token: 'owner-bound' });
    sync.edit({ pg: [] });
    const save = sync.flush();
    await Promise.resolve();
    owner = 8;
    resolveSave({ data: { packageId: 4, revision: 3, saveStatus: 'saved' } });
    expect(await save).toMatchObject({ stale: true });
    expect(sync.context!.revision).toBe(2);
  });

  it('loads a fresh detailed package by its server ID rather than relying on a local archive', async () => {
    const request = vi.fn(async () => ({ data: { id: 23, user_id: 7, revision: 6, content: { pg: [{ soal: 'server source' }] }, _persistence: { packageId: 23, revision: 6, saveStatus: 'saved', imageWarnings: [] } } }));
    const sync = new AssessmentPackageSync({ request });
    sync.setContext({ packageId: 23, revision: 5, owner: 7, token: 'fresh-load' });
    const detail = await sync.loadServer();
    expect(request).toHaveBeenCalledWith('/banksoal/23');
    expect(detail).toMatchObject({ user_id: 7, revision: 6, content: { pg: [{ soal: 'server source' }] } });
  });

  it('uploads bounded raw raster bytes with an idempotency ID and MIME header', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true, data: { assetId: 'asset-1', url: '/api/assessment-assets/asset-1', mime: 'image/png' } }), { status: 201 }));
    const sync = new AssessmentPackageSync({ fetcher, csrfToken: () => 'csrf' });
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    const stableAssetId = 'e750e173-473d-4523-8a84-44826d78fa8e';
    const asset = await sync.uploadImage(blob, { assetId: stableAssetId, name: 'diagram.png' });
    expect(asset.assetId).toBe('asset-1');
    expect(fetcher).toHaveBeenCalledWith('/api/assessment-assets', expect.objectContaining({
      method: 'POST', credentials: 'include', body: blob,
      headers: { 'Content-Type': 'image/png', 'X-Asset-Id': stableAssetId, 'X-CSRF-Token': 'csrf' },
    }));
    await expect(sync.uploadImage(new Blob(['x'], { type: 'image/gif' }))).rejects.toThrow('Unggah PNG, JPEG, atau WebP');
    await expect(sync.uploadImage(new Blob([new Uint8Array(512 * 1024 + 1)], { type: 'image/png' }))).rejects.toThrow('512 KiB');
  });

  it('fetches only reviewed HTTPS image hosts without credentials or redirects and streams under the byte limit', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2]), { status: 200, headers: { 'Content-Type': 'image/jpeg' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { assetId: 'durable', url: '/api/assessment-assets/durable' } }), { status: 201 }));
    const sync = new AssessmentPackageSync({ fetcher, csrfToken: () => null });
    const id = 'e750e173-473d-4523-8a84-44826d78fa8e';
    await sync.uploadImageUrl('https://sewr2.vultrobjects.com/public/image.jpg', { assetId: id });
    expect(fetcher.mock.calls[0][1]).toMatchObject({ credentials: 'omit', redirect: 'error', mode: 'cors' });
    expect(fetcher.mock.calls[1][1]).toMatchObject({ credentials: 'include', headers: { 'X-Asset-Id': id, 'Content-Type': 'image/jpeg' } });
    await expect(sync.uploadImageUrl('https://attacker.example/image.jpg')).rejects.toThrow('tidak dapat disimpan permanen');
  });

  it('aborts a stalled source fetch at the total timeout and never uploads bytes afterward', async () => {
    let timeoutCallback!: () => void;
    const clearTimer = vi.fn();
    const fetcher = vi.fn((_url: string, options: any) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const sync = new AssessmentPackageSync({
      fetcher: fetcher as unknown as typeof fetch,
      setTimer: ((callback: () => void) => { timeoutCallback = callback; return 10 as unknown as ReturnType<typeof setTimeout>; }) as unknown as typeof setTimeout,
      clearTimer,
    });
    const operation = sync.uploadImageUrl('https://upload.wikimedia.org/image.png');
    timeoutCallback();
    await expect(operation).rejects.toThrow('tidak dapat diakses');
    expect(fetcher).toHaveBeenCalledOnce();
    expect(clearTimer).toHaveBeenCalledOnce();
  });

  it('cancels an oversized source stream before any asset upload', async () => {
    const canceled = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(512 * 1024 + 1)); },
      cancel: canceled,
    });
    const fetcher = vi.fn(async () => new Response(body, { status: 200, headers: { 'Content-Type': 'image/png' } }));
    const sync = new AssessmentPackageSync({ fetcher });
    await expect(sync.uploadImageUrl('https://upload.wikimedia.org/image.png')).rejects.toThrow('512 KiB');
    expect(fetcher).toHaveBeenCalledOnce();
    expect(canceled).toHaveBeenCalledOnce();
  });
});
