export const createDraftDocumentId = () => globalThis.crypto?.randomUUID?.().replaceAll('-', '')
  || `slide-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

export function createDraftSync(api, ownerId, currentOwner = () => ownerId, onStatus = () => {}) {
  let documentId = createDraftDocumentId();
  let revision = 0;
  let blocked = false;
  let conflict = null;
  let queue = Promise.resolve();
  let pending = 0;

  const validOwner = () => String(currentOwner() ?? '') === String(ownerId);
  const status = (value, error = false) => { if (validOwner()) onStatus(value, error); };
  const adopt = draft => {
    documentId = draft.document_id;
    revision = Number(draft.revision) || 0;
    blocked = false;
    conflict = null;
    return { documentId, revision };
  };

  return {
    get documentId() { return documentId; },
    get revision() { return revision; },
    get blocked() { return blocked; },
    get conflict() { return conflict; },
    settled() { return queue; },
    restoreIdentity(id, baseRevision = 0) {
      if (typeof id === 'string' && id) documentId = id;
      revision = Number(baseRevision) || 0;
    },
    sync(payload, title) {
      if (!validOwner() || blocked) return Promise.resolve(false);
      const snapshot = JSON.parse(JSON.stringify({ title, payload }));
      pending++;
      status('Menyimpan ke server…');
      const targetDocumentId = documentId;
      queue = queue.then(async () => {
        if (!validOwner() || blocked) { pending--; return false; }
        try {
          const response = await api(`/document-drafts/presentation/${encodeURIComponent(targetDocumentId)}`, { method: 'PUT', body: { ...snapshot, baseRevision: revision } });
          if (!validOwner()) return false;
          if (!Number.isInteger(Number(response?.data?.revision)) || Number(response.data.revision) < 1) throw new Error('Respons server tidak memuat revisi draf.');
          revision = Number(response.data.revision);
          if (pending === 1) status('Tersimpan di server');
          return true;
        } catch (error) {
          if (!validOwner()) return false;
          if (error.status === 409 || error.code === 'REVISION_CONFLICT' || error.code === 'DRAFT_LIMIT_REACHED') {
            blocked = true;
            if (error.code === 'REVISION_CONFLICT') conflict = { documentId: targetDocumentId, baseRevision: revision };
            status(error.code === 'DRAFT_LIMIT_REACHED' ? 'Batas draf server tercapai. Draf lokal tetap tersimpan.' : 'Ada perubahan di perangkat lain. Pilih versi yang ingin dipakai.', true);
            return false;
          }
          if (pending === 1) status('Offline — draf tetap tersimpan di perangkat ini.', true);
          return false;
        } finally {
          pending--;
        }
      });
      return queue;
    },
    async list() {
      if (!validOwner()) throw new Error('Akun berubah. Muat ulang draf untuk akun ini.');
      const result = await api('/document-drafts?module=presentation');
      if (!validOwner()) throw new Error('Akun berubah. Muat ulang draf untuk akun ini.');
      return result.data || [];
    },
    async read(id) {
      if (!validOwner()) throw new Error('Akun berubah. Muat ulang draf untuk akun ini.');
      const result = await api(`/document-drafts/presentation/${encodeURIComponent(id)}`);
      if (!validOwner()) throw new Error('Akun berubah. Muat ulang draf untuk akun ini.');
      return result.data;
    },
    adopt,
    async checkpoint() {
      await queue;
      if (!validOwner() || !revision || blocked) throw new Error('Simpan draf ke server sebelum membuat checkpoint.');
      const result = await api(`/document-drafts/presentation/${encodeURIComponent(documentId)}/checkpoints`, { method: 'POST', body: { baseRevision: revision } });
      return result.data;
    },
  };
}
