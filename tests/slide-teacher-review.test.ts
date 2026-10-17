import { describe, expect, it, vi } from 'vitest';
import { fetchTeacherReview, fetchTeacherReviewHistory, submitTeacherReview } from '../public/static/js/slides/teacher-review.js';

const setup = () => {
  let revision = 4;
  const client = { documentId: 'presentation-1', get revision() { return revision; }, blocked: false, sync: vi.fn(async () => { revision++; return true; }), changeRevision: (next: number) => { revision = next; } };
  const api = vi.fn().mockResolvedValue({ data: { revision: 5, status: 'reviewed', mutation_id: 'action-1' } });
  return { api, client };
};

describe('private presentation teacher-review client', () => {
  it('flushes the draft and submits only expected revision, status, and stable mutation id', async () => {
    const { api, client } = setup();
    const response = await submitTeacherReview(api, {
      client, currentOwner: () => 'owner-a', ownerId: 'owner-a', module: 'presentation', documentId: client.documentId,
      payload: { deck: { slides: [{ title: 'Water cycle' }] } }, title: 'Water cycle', status: 'reviewed', mutationId: 'action-1',
    });
    expect(client.sync).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledWith('/document-drafts/presentation/presentation-1/review', {
      method: 'POST', body: { expectedRevision: 5, status: 'reviewed', mutationId: 'action-1' },
    });
    expect(response.status).toBe('reviewed');
  });

  it('does not post review when local autosave is offline or conflicted', async () => {
    const { api, client } = setup();
    client.sync.mockResolvedValueOnce(false);
    await expect(submitTeacherReview(api, {
      client, currentOwner: () => 'owner-a', ownerId: 'owner-a', module: 'presentation', documentId: client.documentId,
      payload: {}, title: 'Draft', status: 'reviewed', mutationId: 'action-1',
    })).rejects.toThrow('Simpan perubahan');
    client.blocked = true;
    await expect(submitTeacherReview(api, {
      client, currentOwner: () => 'owner-a', ownerId: 'owner-a', module: 'presentation', documentId: client.documentId,
      payload: {}, title: 'Draft', status: 'reviewed', mutationId: 'action-2',
    })).rejects.toThrow('Simpan perubahan');
    expect(api).not.toHaveBeenCalled();
  });

  it('prevents cross-account, mismatched-document, and stale-version reviews', async () => {
    const { api, client } = setup();
    await expect(submitTeacherReview(api, {
      client, currentOwner: () => 'owner-b', ownerId: 'owner-a', module: 'presentation', documentId: client.documentId,
      payload: {}, title: 'Draft', status: 'reviewed', mutationId: 'action-1',
    })).rejects.toThrow('Akun atau draf berubah');
    await expect(submitTeacherReview(api, {
      client, currentOwner: () => 'owner-a', ownerId: 'owner-a', module: 'presentation', documentId: 'other-doc',
      payload: {}, title: 'Draft', status: 'reviewed', mutationId: 'action-2',
    })).rejects.toThrow('Akun atau draf berubah');
    client.changeRevision(8);
    await expect(submitTeacherReview(api, {
      client, currentOwner: () => 'owner-a', ownerId: 'owner-a', module: 'presentation', documentId: client.documentId,
      payload: {}, title: 'Draft', status: 'reviewed', mutationId: 'action-3', isCurrent: () => false,
    })).rejects.toThrow('Simpan perubahan');
    expect(api).not.toHaveBeenCalled();
  });

  it('uses the documented owner-scoped status and history GET paths', async () => {
    const api = vi.fn().mockResolvedValueOnce({ data: { revision: 5, status: 'needs-review', action: null } }).mockResolvedValueOnce({ data: [] });
    await fetchTeacherReview(api, 'presentation', 'doc-1');
    await fetchTeacherReviewHistory(api, 'presentation', 'doc-1');
    expect(api.mock.calls.map(call => call[0])).toEqual([
      '/document-drafts/presentation/doc-1/review',
      '/document-drafts/presentation/doc-1/review/history',
    ]);
  });
});
