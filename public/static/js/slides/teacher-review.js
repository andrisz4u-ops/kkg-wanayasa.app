const reviewPath = (module, documentId) => `/document-drafts/${encodeURIComponent(module)}/${encodeURIComponent(documentId)}/review`;

export async function fetchTeacherReview(api, module, documentId) {
  const response = await api(reviewPath(module, documentId));
  return response.data;
}

export async function fetchTeacherReviewHistory(api, module, documentId) {
  const response = await api(`${reviewPath(module, documentId)}/history`);
  return response.data || [];
}

export async function submitTeacherReview(api, { client, currentOwner, ownerId, module, documentId, payload, title, status, mutationId, isCurrent = () => true }) {
  if (!['reviewed', 'rejected'].includes(status) || !/^[A-Za-z0-9._:-]{1,128}$/.test(mutationId || '')) throw new Error('Tindakan tinjauan tidak valid.');
  if (String(currentOwner() ?? '') !== String(ownerId) || client.documentId !== documentId) throw new Error('Akun atau draf berubah. Tinjauan tidak dikirim.');
  const saved = await client.sync(payload, title);
  if (!saved || !isCurrent() || String(currentOwner() ?? '') !== String(ownerId) || client.documentId !== documentId || client.blocked) {
    throw new Error('Simpan perubahan ke server terlebih dahulu. Tinjauan belum dicatat.');
  }
  const expectedRevision = client.revision;
  if (!Number.isInteger(expectedRevision) || expectedRevision < 1) throw new Error('Versi draf belum tersimpan di server.');
  const response = await api(`${reviewPath(module, documentId)}`, {
    method: 'POST',
    body: { expectedRevision, status, mutationId },
  });
  if (!isCurrent() || String(currentOwner() ?? '') !== String(ownerId) || client.documentId !== documentId || client.revision !== expectedRevision) {
    throw new Error('Akun atau versi berubah selama tinjauan. Periksa status versi terbaru.');
  }
  return response.data;
}
