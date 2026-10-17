import { Hono } from 'hono';
import { isDraftDocumentId, isDraftModule, isValidRevision, normalizeDraftTitle, parseDraft, readBoundedJson, DOCUMENT_DRAFT_MAX_CHECKPOINTS, DOCUMENT_DRAFT_MAX_PER_USER } from '../lib/document-drafts';
import { hashDraftContent } from '../lib/document-teacher-review';
import { requireSession } from '../lib/session-middleware';
import { errorResponse, Errors, successResponse } from '../lib/response';
import type { AppBindings } from '../types/env';

const documentDrafts = new Hono<{ Bindings: AppBindings }>();
documentDrafts.use('*', requireSession);

documentDrafts.get('/', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const module = c.req.query('module');
  if (module !== undefined && !isDraftModule(module)) return Errors.validation(c, 'Modul dokumen tidak valid');

  const result = module
    ? await c.env.DB.prepare(`
        SELECT module, document_id, title, revision, created_at, server_updated_at
        FROM document_drafts WHERE user_id = ? AND module = ?
        ORDER BY server_updated_at DESC, document_id ASC
      `).bind(userId, module).all()
    : await c.env.DB.prepare(`
        SELECT module, document_id, title, revision, created_at, server_updated_at
        FROM document_drafts WHERE user_id = ?
        ORDER BY server_updated_at DESC, module ASC, document_id ASC
      `).bind(userId).all();
  return successResponse(c, result.results || []);
});

documentDrafts.get('/:module/:documentId/checkpoints', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const { module, documentId } = getDraftPath(c);
  if (!module || !documentId) return Errors.validation(c, 'Identitas dokumen tidak valid');

  const exists = await findDraft(c, userId, module, documentId);
  if (!exists) return Errors.notFound(c, 'Draf');
  const result = await c.env.DB.prepare(`
    SELECT module, document_id, revision, title, payload_json, created_at
    FROM document_draft_checkpoints
    WHERE user_id = ? AND module = ? AND document_id = ?
    ORDER BY revision DESC
  `).bind(userId, module, documentId).all<{ payload_json: string }>();
  return successResponse(c, (result.results || []).map(parseDraft));
});

documentDrafts.get('/:module/:documentId/review/history', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const { module, documentId } = getDraftPath(c);
  if (!module || !documentId) return Errors.validation(c, 'Identitas dokumen tidak valid');
  if (!await findDraft(c, userId, module, documentId)) return Errors.notFound(c, 'Draf');

  const result = await c.env.DB.prepare(`
    SELECT module, document_id, revision, content_hash, status, mutation_id, created_at
    FROM document_teacher_reviews
    WHERE user_id = ? AND module = ? AND document_id = ?
    ORDER BY id DESC
  `).bind(userId, module, documentId).all();
  return successResponse(c, result.results || []);
});

documentDrafts.get('/:module/:documentId/review', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const { module, documentId } = getDraftPath(c);
  if (!module || !documentId) return Errors.validation(c, 'Identitas dokumen tidak valid');
  const draft = await findDraft(c, userId, module, documentId);
  if (!draft) return Errors.notFound(c, 'Draf');

  const contentHash = await hashDraftContent(draft.title, draft.payload_json);
  const action = await findActiveReview(c, userId, module, documentId, draft.revision, contentHash);
  return successResponse(c, {
    module, document_id: documentId, revision: draft.revision, content_hash: contentHash,
    status: action?.status || 'needs-review', action,
  });
});

documentDrafts.post('/:module/:documentId/review', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const { module, documentId } = getDraftPath(c);
  if (!module || !documentId) return Errors.validation(c, 'Identitas dokumen tidak valid');

  const parsed = await readBoundedJson(c.req.raw);
  if (!parsed.ok) return invalidBody(c, parsed.reason);
  const expectedRevision = parsed.value.expectedRevision;
  const status = parsed.value.status;
  const mutationId = parsed.value.mutationId;
  if (!isValidRevision(expectedRevision)
      || (status !== 'reviewed' && status !== 'rejected')
      || typeof mutationId !== 'string'
      || mutationId.length < 1 || mutationId.length > 128
      || !/^[A-Za-z0-9._:-]+$/.test(mutationId)) {
    return Errors.validation(c, 'expectedRevision, status, dan mutationId yang valid wajib diisi');
  }

  const previous = await findReviewMutation(c, userId, mutationId);
  if (previous) {
    return sameReviewMutation(previous, module, documentId, expectedRevision, status)
      ? successResponse(c, previous)
      : errorResponse(c, 'REVIEW_MUTATION_ID_REUSED', 'mutationId sudah digunakan untuk tindakan berbeda', 409);
  }

  const draft = await findDraft(c, userId, module, documentId);
  if (!draft) return Errors.notFound(c, 'Draf');
  if (draft.revision !== expectedRevision) {
    // The original lookup and revision read are separate statements. An identical
    // request may have committed between them while autosave advanced the draft.
    const winner = await findReviewMutation(c, userId, mutationId);
    if (winner) {
      return sameReviewMutation(winner, module, documentId, expectedRevision, status)
        ? successResponse(c, winner)
        : errorResponse(c, 'REVIEW_MUTATION_ID_REUSED', 'mutationId sudah digunakan untuk tindakan berbeda', 409);
    }
    return revisionConflict(c, draft.revision);
  }
  const contentHash = await hashDraftContent(draft.title, draft.payload_json);

  const inserted = await c.env.DB.prepare(`
    INSERT INTO document_teacher_reviews
      (user_id, module, document_id, revision, content_hash, status, mutation_id)
    SELECT user_id, module, document_id, revision, ?, ?, ?
    FROM document_drafts
    WHERE user_id = ? AND module = ? AND document_id = ? AND revision = ?
      AND title = ? AND payload_json = ?
    ON CONFLICT(user_id, mutation_id) DO NOTHING
    RETURNING module, document_id, revision, content_hash, status, mutation_id, created_at
  `).bind(contentHash, status, mutationId, userId, module, documentId, expectedRevision, draft.title, draft.payload_json).first();
  if (inserted) return successResponse(c, inserted, 'Teacher review recorded', 201);

  const winner = await findReviewMutation(c, userId, mutationId);
  if (winner) {
    return sameReviewMutation(winner, module, documentId, expectedRevision, status)
      ? successResponse(c, winner)
      : errorResponse(c, 'REVIEW_MUTATION_ID_REUSED', 'mutationId sudah digunakan untuk tindakan berbeda', 409);
  }
  const latest = await findDraft(c, userId, module, documentId);
  return latest ? revisionConflict(c, latest.revision) : Errors.notFound(c, 'Draf');
});

documentDrafts.post('/:module/:documentId/checkpoints', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const { module, documentId } = getDraftPath(c);
  if (!module || !documentId) return Errors.validation(c, 'Identitas dokumen tidak valid');

  const parsed = await readBoundedJson(c.req.raw);
  if (!parsed.ok) return invalidBody(c, parsed.reason);
  const baseRevision = parsed.value.baseRevision;
  if (!isValidRevision(baseRevision)) return Errors.validation(c, 'baseRevision harus berupa revisi positif');

  const draft = await findDraft(c, userId, module, documentId);
  if (!draft) return Errors.notFound(c, 'Draf');

  const existing = await c.env.DB.prepare(`
    SELECT module, document_id, revision, title, payload_json, created_at
    FROM document_draft_checkpoints
    WHERE user_id = ? AND module = ? AND document_id = ? AND revision = ?
  `).bind(userId, module, documentId, baseRevision).first<{ payload_json: string }>();
  if (existing) return successResponse(c, parseDraft(existing));
  if (draft.revision !== baseRevision) return revisionConflict(c, draft.revision);

  const checkpoint = await c.env.DB.prepare(`
    INSERT INTO document_draft_checkpoints
      (user_id, module, document_id, revision, title, payload_json)
    SELECT user_id, module, document_id, revision, title, payload_json
    FROM document_drafts
    WHERE user_id = ? AND module = ? AND document_id = ? AND revision = ?
      AND (SELECT COUNT(*) FROM document_draft_checkpoints
           WHERE user_id = ? AND module = ? AND document_id = ?) < ?
    ON CONFLICT(user_id, module, document_id, revision) DO NOTHING
    RETURNING module, document_id, revision, title, payload_json, created_at
  `).bind(userId, module, documentId, baseRevision, userId, module, documentId, DOCUMENT_DRAFT_MAX_CHECKPOINTS).first<{ payload_json: string }>();
  if (checkpoint) return successResponse(c, parseDraft(checkpoint), 'Checkpoint saved', 201);

  // A competing request may have inserted this exact immutable checkpoint. Resolve
  // that idempotency key before treating the no-op INSERT as a stale/quota failure.
  const winner = await c.env.DB.prepare(`
    SELECT module, document_id, revision, title, payload_json, created_at
    FROM document_draft_checkpoints
    WHERE user_id = ? AND module = ? AND document_id = ? AND revision = ?
  `).bind(userId, module, documentId, baseRevision).first<{ payload_json: string }>();
  if (winner) return successResponse(c, parseDraft(winner));

  const latest = await findDraft(c, userId, module, documentId);
  if (!latest) return Errors.notFound(c, 'Draf');
  if (latest.revision !== baseRevision) return revisionConflict(c, latest.revision);
  const count = await countCheckpoints(c, userId, module, documentId);
  if (count >= DOCUMENT_DRAFT_MAX_CHECKPOINTS) {
    return errorResponse(c, 'CHECKPOINT_LIMIT_REACHED', 'Batas 20 checkpoint per dokumen telah tercapai', 409);
  }
  return Errors.conflict(c, 'Checkpoint tidak dapat disimpan karena dokumen berubah');
});

documentDrafts.get('/:module/:documentId', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const { module, documentId } = getDraftPath(c);
  if (!module || !documentId) return Errors.validation(c, 'Identitas dokumen tidak valid');
  const draft = await findDraft(c, userId, module, documentId);
  if (!draft) return Errors.notFound(c, 'Draf');
  const contentHash = await hashDraftContent(draft.title, draft.payload_json);
  const action = await findActiveReview(c, userId, module, documentId, draft.revision, contentHash);
  return successResponse(c, {
    ...parseDraft(draft),
    review: { status: action?.status || 'needs-review', action },
  });
});

documentDrafts.put('/:module/:documentId', async c => {
  const userId = getUserId(c);
  if (!userId) return Errors.unauthorized(c);
  const { module, documentId } = getDraftPath(c);
  if (!module || !documentId) return Errors.validation(c, 'Identitas dokumen tidak valid');

  const parsed = await readBoundedJson(c.req.raw);
  if (!parsed.ok) return invalidBody(c, parsed.reason);
  const title = normalizeDraftTitle(parsed.value.title);
  const payload = parsed.value.payload;
  const baseRevision = parsed.value.baseRevision;
  if (!title || !isJsonObject(payload) || !isValidRevision(baseRevision, true)) {
    return Errors.validation(c, 'title, payload objek, dan baseRevision yang valid wajib diisi');
  }
  const payloadJson = JSON.stringify(payload);
  if (!payloadJson) return Errors.validation(c, 'Payload dokumen tidak valid');

  if (baseRevision === 0) {
    const created = await c.env.DB.prepare(`
      INSERT INTO document_drafts
        (user_id, module, document_id, title, payload_json, revision)
      SELECT ?, ?, ?, ?, ?, 1
      WHERE (SELECT COUNT(*) FROM document_drafts WHERE user_id = ?) < ?
      ON CONFLICT(user_id, module, document_id) DO NOTHING
      RETURNING module, document_id, title, payload_json, revision, created_at, server_updated_at
    `).bind(userId, module, documentId, title, payloadJson, userId, DOCUMENT_DRAFT_MAX_PER_USER).first<{ payload_json: string }>();
    if (created) return successResponse(c, parseDraft(created), 'Draft created', 201);

    const existing = await findDraft(c, userId, module, documentId);
    if (existing) {
      if (existing.title === title && canonicalJson(existing.payload_json) === canonicalJson(payloadJson)) {
        return successResponse(c, parseDraft(existing), 'Draft already created');
      }
      return revisionConflict(c, existing.revision);
    }
    return errorResponse(c, 'DRAFT_LIMIT_REACHED', 'Batas 50 draf per pengguna telah tercapai', 409);
  }

  const updated = await c.env.DB.prepare(`
    UPDATE document_drafts
    SET title = ?, payload_json = ?, revision = revision + 1, server_updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND module = ? AND document_id = ? AND revision = ?
    RETURNING module, document_id, title, payload_json, revision, created_at, server_updated_at
  `).bind(title, payloadJson, userId, module, documentId, baseRevision).first<{ payload_json: string }>();
  if (updated) return successResponse(c, parseDraft(updated));

  const latest = await findDraft(c, userId, module, documentId);
  return latest ? revisionConflict(c, latest.revision) : Errors.notFound(c, 'Draf');
});

function getUserId(c: any): number | string | null {
  const id = c.get('user')?.id;
  return (typeof id === 'number' || (typeof id === 'string' && id.length > 0)) ? id : null;
}

function getDraftPath(c: any) {
  const module = c.req.param('module');
  const documentId = c.req.param('documentId');
  return {
    module: isDraftModule(module) ? module : null,
    documentId: isDraftDocumentId(documentId) ? documentId : null,
  };
}

function findDraft(c: any, userId: number | string, module: string, documentId: string) {
  return c.env.DB.prepare(`
    SELECT module, document_id, title, payload_json, revision, created_at, server_updated_at
    FROM document_drafts WHERE user_id = ? AND module = ? AND document_id = ?
  `).bind(userId, module, documentId).first();
}

function countCheckpoints(c: any, userId: number | string, module: string, documentId: string) {
  return c.env.DB.prepare(`
    SELECT COUNT(*) AS count FROM document_draft_checkpoints
    WHERE user_id = ? AND module = ? AND document_id = ?
  `).bind(userId, module, documentId).first('count').then(Number);
}

function findReviewMutation(c: any, userId: number | string, mutationId: string) {
  return c.env.DB.prepare(`
    SELECT module, document_id, revision, content_hash, status, mutation_id, created_at
    FROM document_teacher_reviews WHERE user_id = ? AND mutation_id = ?
  `).bind(userId, mutationId).first();
}

function findActiveReview(c: any, userId: number | string, module: string, documentId: string, revision: number, contentHash: string) {
  return c.env.DB.prepare(`
    SELECT module, document_id, revision, content_hash, status, mutation_id, created_at
    FROM document_teacher_reviews
    WHERE user_id = ? AND module = ? AND document_id = ? AND revision = ? AND content_hash = ?
    ORDER BY id DESC LIMIT 1
  `).bind(userId, module, documentId, revision, contentHash).first();
}

function sameReviewMutation(action: any, module: string, documentId: string, revision: number, status: string): boolean {
  return action.module === module && action.document_id === documentId
    && action.revision === revision && action.status === status;
}

function revisionConflict(c: any, currentRevision: number) {
  return errorResponse(c, 'REVISION_CONFLICT', 'Revisi draf sudah berubah; muat ulang sebelum menyimpan', 409, { currentRevision });
}

function invalidBody(c: any, reason: 'too_large' | 'invalid_json' | 'invalid_payload') {
  if (reason === 'too_large') return errorResponse(c, 'PAYLOAD_TOO_LARGE', 'Ukuran permintaan melebihi 1 MiB', 413);
  if (reason === 'invalid_payload') return Errors.validation(c, 'Isi JSON harus berupa objek dengan kedalaman maksimal 32');
  return Errors.validation(c, 'Body harus berisi JSON yang valid');
}

function canonicalJson(value: string): string {
  return JSON.stringify(sortJsonKeys(JSON.parse(value)));
}

function sortJsonKeys(value: any): any {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortJsonKeys(value[key])]));
  }
  return value;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export default documentDrafts;
