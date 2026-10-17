import { describe, expect, it, vi } from 'vitest';
import { createDraftSync } from '../public/static/js/slides/draft-sync.js';

describe('private slide draft sync', () => {
  it('retains local state as offline when server save fails', async () => {
    const api = vi.fn().mockRejectedValue(new Error('offline'));
    const statuses: string[] = [];
    const sync = createDraftSync(api, 'u1', () => 'u1', message => statuses.push(message));
    const local = { deck: { title: 'Local work', slides: [] } };
    expect(await sync.sync(local, 'Local work')).toBe(false);
    expect(local.deck.title).toBe('Local work');
    expect(statuses.at(-1)).toContain('Offline');
    expect(sync.revision).toBe(0);
  });

  it('stops after CAS conflict without a second write or silent overwrite', async () => {
    const api = vi.fn().mockRejectedValueOnce(Object.assign(new Error('stale'), { status: 409, code: 'REVISION_CONFLICT' }));
    const sync = createDraftSync(api, 'u1');
    sync.restoreIdentity('stable-doc', 4);
    expect(await sync.sync({ title: 'local' }, 'Local')).toBe(false);
    expect(sync.blocked).toBe(true);
    expect(await sync.sync({ title: 'later edit' }, 'Local')).toBe(false);
    expect(api).toHaveBeenCalledTimes(1);
    expect(api.mock.calls[0][1].body.baseRevision).toBe(4);
  });

  it('orders autosaves using the revision returned by each preceding write', async () => {
    const api = vi.fn()
      .mockResolvedValueOnce({ data: { revision: 1 } })
      .mockResolvedValueOnce({ data: { revision: 2 } });
    const sync = createDraftSync(api, 'u1');
    const first = sync.sync({ value: 1 }, 'Draft');
    const second = sync.sync({ value: 2 }, 'Draft');
    await Promise.all([first, second]);
    expect(api.mock.calls.map(call => call[1].body.baseRevision)).toEqual([0, 1]);
    expect(sync.revision).toBe(2);
  });

  it('does not issue requests or expose callbacks after account changes', async () => {
    let current = 'u1';
    const api = vi.fn().mockResolvedValue({ data: { revision: 1 } });
    const onStatus = vi.fn();
    const sync = createDraftSync(api, 'u1', () => current, onStatus);
    current = 'u2';
    expect(await sync.sync({ secret: 'u1 draft' }, 'Draft')).toBe(false);
    await expect(sync.list()).rejects.toThrow('Akun berubah');
    expect(api).not.toHaveBeenCalled();
    expect(onStatus).not.toHaveBeenCalled();
  });

  it('adopts a server document identity and revision for cross-device restoration', async () => {
    const sync = createDraftSync(vi.fn(), 'u1');
    const serverDraft = { document_id: 'server-id', revision: 7, payload: { deck: { title: 'Pulih', slides: [] } } };
    sync.adopt(serverDraft);
    expect(sync.documentId).toBe('server-id');
    expect(sync.revision).toBe(7);
  });

  it('creates explicit checkpoints only after pending autosave and uses its latest revision', async () => {
    const api = vi.fn()
      .mockResolvedValueOnce({ data: { revision: 1 } })
      .mockResolvedValue({ data: { revision: 1, created_at: 'now' } });
    const sync = createDraftSync(api, 'u1');
    const saving = sync.sync({ deck: { slides: [] } }, 'Draft');
    const firstCheckpoint = sync.checkpoint();
    await Promise.all([saving, firstCheckpoint]);
    await sync.checkpoint();
    const calls = api.mock.calls.filter(call => call[1]?.method === 'POST');
    expect(calls).toHaveLength(2);
    expect(calls.map(call => call[1].body.baseRevision)).toEqual([1, 1]);
    expect(calls[0][0]).toContain('/checkpoints');
  });

  it('refuses to checkpoint after offline, conflict, or account change', async () => {
    const offlineApi = vi.fn().mockRejectedValue(new Error('offline'));
    const offline = createDraftSync(offlineApi, 'u1');
    await offline.sync({ value: 'local' }, 'Draft');
    await expect(offline.checkpoint()).rejects.toThrow('Simpan draf ke server');
    expect(offlineApi.mock.calls.some(call => call[1]?.method === 'POST')).toBe(false);

    const conflictApi = vi.fn().mockRejectedValue(Object.assign(new Error('stale'), { status: 409, code: 'REVISION_CONFLICT' }));
    const conflict = createDraftSync(conflictApi, 'u1');
    await conflict.sync({ value: 'local' }, 'Draft');
    await expect(conflict.checkpoint()).rejects.toThrow('Simpan draf ke server');
    expect(conflictApi.mock.calls.some(call => call[1]?.method === 'POST')).toBe(false);

    let current = 'u1';
    const accountApi = vi.fn().mockResolvedValue({ data: { revision: 1 } });
    const accountSync = createDraftSync(accountApi, 'u1', () => current);
    await accountSync.sync({ value: 'owned' }, 'Draft');
    current = 'u2';
    await expect(accountSync.checkpoint()).rejects.toThrow('Simpan draf ke server');
    expect(accountApi.mock.calls.some(call => call[1]?.method === 'POST')).toBe(false);
  });
});
