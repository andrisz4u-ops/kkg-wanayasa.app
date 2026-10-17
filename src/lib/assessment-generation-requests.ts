const RESULT_MAX_BYTES = 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AssessmentGenerationFence = { ownerId: number; clientDocumentId: string; runToken: string; jobId?: string };
export type AssessmentGenerationRequestRecord = {
  ownerId: number;
  clientDocumentId: string;
  requestHash: string;
  hashSchema: 1;
  runToken: string;
  state: 'running' | 'completed' | 'failed' | 'cancelled';
  packageId: number | null;
  result: unknown | null;
  failureCode: string | null;
  createdAt: number;
  updatedAt: number;
};
export type AssessmentGenerationAcquireResult =
  | { kind: 'acquired'; fence: AssessmentGenerationFence }
  | { kind: 'completed'; record: AssessmentGenerationRequestRecord }
  | { kind: 'conflict'; code: 'GENERATION_INPUT_CONFLICT' | 'GENERATION_IN_PROGRESS' | 'GENERATION_ENDED' };
export type AssessmentGenerationRecoveryResult = {
  _persistence: { saveStatus: 'failed'; [key: string]: unknown };
  pg?: unknown[];
  isian?: { data: unknown[]; [key: string]: unknown } | null;
  uraian?: unknown[];
  [key: string]: unknown;
};
export type AssessmentGenerationCompletion =
  | { packageId: number; result?: never }
  | { packageId?: null; result: AssessmentGenerationRecoveryResult };

type Db = Pick<D1Database, 'prepare'>;
type Row = {
  owner_id: number; client_document_id: string; request_hash: string; hash_schema: number; run_token: string;
  state: string; package_id: number | null; result_json: string | null; failure_code: string | null;
  created_at: number; updated_at: number;
};

function canonical(value: unknown): string {
  const normalize = (v: unknown): unknown => {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (Array.isArray(v)) return v.map(item => {
      if (item === undefined) throw new TypeError('semantic_input_invalid');
      return normalize(item);
    });
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      const output: Record<string, unknown> = Object.create(null);
      for (const key of Object.keys(obj).sort()) {
        if (obj[key] === undefined) throw new TypeError('semantic_input_invalid');
        output[key] = normalize(obj[key]);
      }
      return output;
    }
    throw new TypeError('semantic_input_invalid');
  };
  return JSON.stringify({ schema: 1, semanticInput: normalize(value) });
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isRecoveryResult(value: unknown): value is AssessmentGenerationRecoveryResult {
  if (!isPlainRecord(value) || !isPlainRecord(value._persistence) || value._persistence.saveStatus !== 'failed') return false;
  const rows: unknown[] = [
    ...(Array.isArray(value.pg) ? value.pg : []),
    ...(isPlainRecord(value.isian) && Array.isArray(value.isian.data) ? value.isian.data : []),
    ...(Array.isArray(value.uraian) ? value.uraian : []),
  ];
  return rows.length > 0 && rows.every(row => isPlainRecord(row) &&
    ['soal', 'pertanyaan', 'question'].some(key => typeof row[key] === 'string' && (row[key] as string).trim().length > 0));
}

async function hashSemanticInput(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function decodeRow(row: Row | null): AssessmentGenerationRequestRecord | null {
  if (!row) return null;
  if (!Number.isSafeInteger(row.owner_id) || typeof row.client_document_id !== 'string' || typeof row.request_hash !== 'string' ||
      row.hash_schema !== 1 || typeof row.run_token !== 'string' ||
      !['running', 'completed', 'failed', 'cancelled'].includes(row.state) ||
      (row.package_id !== null && !Number.isSafeInteger(row.package_id)) ||
      (row.failure_code !== null && typeof row.failure_code !== 'string') ||
      !Number.isSafeInteger(row.created_at) || !Number.isSafeInteger(row.updated_at)) {
    throw new Error('assessment_generation_record_corrupt');
  }
  let result: unknown = null;
  if (row.result_json !== null) {
    if (typeof row.result_json !== 'string' || new TextEncoder().encode(row.result_json).byteLength > RESULT_MAX_BYTES) throw new Error('assessment_generation_record_corrupt');
    try { result = JSON.parse(row.result_json); } catch { throw new Error('assessment_generation_record_corrupt'); }
  }
  if (row.state === 'completed' && !(row.package_id !== null && Number.isSafeInteger(row.package_id) && row.package_id > 0) && !isRecoveryResult(result)) {
    throw new Error('assessment_generation_record_corrupt');
  }
  return {
    ownerId: row.owner_id, clientDocumentId: row.client_document_id, requestHash: row.request_hash, hashSchema: 1,
    runToken: row.run_token, state: row.state as AssessmentGenerationRequestRecord['state'], packageId: row.package_id,
    result, failureCode: row.failure_code, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function loadAssessmentGenerationRequest(db: Db, ownerId: number, clientDocumentId: string): Promise<AssessmentGenerationRequestRecord | null> {
  const row = await db.prepare(`SELECT owner_id,client_document_id,request_hash,hash_schema,run_token,state,package_id,result_json,failure_code,created_at,updated_at
    FROM assessment_generation_requests WHERE owner_id=? AND client_document_id=?`).bind(ownerId, clientDocumentId).first<Row>();
  return decodeRow(row);
}

export async function acquireAssessmentGenerationRequest(db: Db, input: { ownerId: number; clientDocumentId?: string; semanticInput: unknown }): Promise<AssessmentGenerationAcquireResult> {
  const clientDocumentId = input.clientDocumentId ?? crypto.randomUUID();
  if (!Number.isSafeInteger(input.ownerId) || input.ownerId < 1 || !UUID_PATTERN.test(clientDocumentId)) throw new TypeError('assessment_generation_identity_invalid');
  const requestHash = await hashSemanticInput(input.semanticInput);
  const runToken = crypto.randomUUID();
  const inserted = await db.prepare(`INSERT INTO assessment_generation_requests(owner_id,client_document_id,request_hash,hash_schema,run_token,state)
    VALUES(?,?,?,1,?,'running') ON CONFLICT(owner_id,client_document_id) DO NOTHING RETURNING run_token`)
    .bind(input.ownerId, clientDocumentId, requestHash, runToken).first<{ run_token: string }>();
  if (inserted?.run_token === runToken) return { kind: 'acquired', fence: { ownerId: input.ownerId, clientDocumentId, runToken } };
  const record = await loadAssessmentGenerationRequest(db, input.ownerId, clientDocumentId);
  if (!record) throw new Error('assessment_generation_acquire_uncertain');
  if (record.requestHash !== requestHash || record.hashSchema !== 1) return { kind: 'conflict', code: 'GENERATION_INPUT_CONFLICT' };
  if (record.state === 'completed') return { kind: 'completed', record };
  if (record.state === 'running') return { kind: 'conflict', code: 'GENERATION_IN_PROGRESS' };
  return { kind: 'conflict', code: 'GENERATION_ENDED' };
}

export function generationFencePredicate(fence: AssessmentGenerationFence): { sql: string; bindings: unknown[] } {
  const base = `EXISTS (SELECT 1 FROM assessment_generation_requests agr WHERE agr.owner_id=? AND agr.client_document_id=? AND agr.run_token=? AND agr.state='running'`;
  const job = fence.jobId === undefined ? '' : ` AND EXISTS (SELECT 1 FROM ai_generation_jobs agj WHERE agj.user_id=? AND agj.job_id=? AND agj.state='running' AND agj.lease_until>=CAST(strftime('%s','now') AS INTEGER))`;
  return { sql: `${base}${job})`, bindings: fence.jobId === undefined ? [fence.ownerId, fence.clientDocumentId, fence.runToken] : [fence.ownerId, fence.clientDocumentId, fence.runToken, fence.ownerId, fence.jobId] };
}

export function createAssessmentGenerationCompletionStatement(db: Db, fence: AssessmentGenerationFence, completion: AssessmentGenerationCompletion): D1PreparedStatement {
  const hasPackageId = 'packageId' in completion && completion.packageId !== undefined && completion.packageId !== null;
  const packageId = hasPackageId ? completion.packageId : undefined;
  if (hasPackageId && (typeof packageId !== 'number' || !Number.isSafeInteger(packageId) || packageId <= 0)) throw new TypeError('assessment_generation_package_id_invalid');
  if (!hasPackageId && !isRecoveryResult(completion.result)) throw new TypeError('assessment_generation_recovery_result_invalid');
  const resultJson = JSON.stringify(hasPackageId ? null : completion.result);
  if (resultJson === undefined || new TextEncoder().encode(resultJson).byteLength > RESULT_MAX_BYTES) throw new RangeError('assessment_generation_result_too_large');
  const predicate = generationFencePredicate(fence);
  return db.prepare(`UPDATE assessment_generation_requests SET state='completed',package_id=?,result_json=?,failure_code=NULL,updated_at=CAST(strftime('%s','now') AS INTEGER)
    WHERE owner_id=? AND client_document_id=? AND run_token=? AND state='running'${fence.jobId === undefined ? '' : ` AND ${predicate.sql}`}`)
    .bind(hasPackageId ? packageId : null, resultJson, fence.ownerId, fence.clientDocumentId, fence.runToken,
      ...(fence.jobId === undefined ? [] : predicate.bindings));
}

export async function completeAssessmentGenerationRequest(db: Db, fence: AssessmentGenerationFence, completion: AssessmentGenerationCompletion): Promise<{ completed: boolean }> {
  const result = await createAssessmentGenerationCompletionStatement(db, fence, completion).run();
  return { completed: Number(result.meta.changes) === 1 };
}

export async function endAssessmentGenerationRequest(db: Db, fence: AssessmentGenerationFence, state: 'failed' | 'cancelled', failureCode: string): Promise<{ ended: boolean }> {
  if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(failureCode)) throw new TypeError('assessment_generation_failure_code_invalid');
  const result = await db.prepare(`UPDATE assessment_generation_requests SET state=?,failure_code=?,updated_at=CAST(strftime('%s','now') AS INTEGER)
    WHERE owner_id=? AND client_document_id=? AND run_token=? AND state='running'`)
    .bind(state, failureCode, fence.ownerId, fence.clientDocumentId, fence.runToken).run();
  return { ended: Number(result.meta.changes) === 1 };
}
