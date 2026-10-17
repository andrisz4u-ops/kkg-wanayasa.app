import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SqliteD1 } from './helpers/sqlite-d1';
import {
  acquireAssessmentGenerationRequest, completeAssessmentGenerationRequest, createAssessmentGenerationCompletionStatement,
  endAssessmentGenerationRequest, generationFencePredicate, loadAssessmentGenerationRequest,
} from '../src/lib/assessment-generation-requests';

let db: SqliteD1;
const doc = '123e4567-e89b-42d3-a456-426614174000';
const semantic = { topic: 'fractions', options: { count: 4, level: 'easy' } };
const recovery = { pg: [{ no: 1, soal: 'Which fraction is larger?' }], _persistence: { saveStatus: 'failed' as const } };
beforeEach(() => {
  db = new SqliteD1();
  db.sqlite.exec('PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2);');
  db.sqlite.exec(readFileSync('migrations/0043_assessment_generation_requests.sql', 'utf8'));
});

describe('assessment generation request ledger', () => {
  it('atomically returns exactly one winner for simultaneous acquisition', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: semantic })));
    expect(results.filter(result => result.kind === 'acquired')).toHaveLength(1);
    expect(results.filter(result => result.kind === 'conflict' && result.code === 'GENERATION_IN_PROGRESS')).toHaveLength(7);
  });

  it('conflicting hash does not change the original running record', async () => {
    const first = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: semantic });
    const conflict = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: { ...semantic, topic: 'other' } });
    expect(conflict).toMatchObject({ kind: 'conflict', code: 'GENERATION_INPUT_CONFLICT' });
    expect(await loadAssessmentGenerationRequest(db as any, 1, doc)).toMatchObject({ state: 'running', runToken: first.kind === 'acquired' ? first.fence.runToken : '' });
  });

  it('returns completed result for identical retry and isolates owners', async () => {
    const a = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: semantic });
    const b = await acquireAssessmentGenerationRequest(db as any, { ownerId: 2, clientDocumentId: doc, semanticInput: semantic });
    expect(a.kind).toBe('acquired'); expect(b.kind).toBe('acquired');
    if (a.kind !== 'acquired') return;
    expect(await completeAssessmentGenerationRequest(db as any, a.fence, { packageId: 55 })).toEqual({ completed: true });
    expect(await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: semantic })).toMatchObject({ kind: 'completed', record: { packageId: 55, result: null } });
    expect((await loadAssessmentGenerationRequest(db as any, 2, doc))?.state).toBe('running');
  });

  it('does not reacquire failed or cancelled identities', async () => {
    for (const [ownerId, state] of [[1, 'failed'], [2, 'cancelled']] as const) {
      const got = await acquireAssessmentGenerationRequest(db as any, { ownerId, clientDocumentId: doc, semanticInput: semantic });
      if (got.kind !== 'acquired') throw new Error('expected acquisition');
      expect(await endAssessmentGenerationRequest(db as any, got.fence, state, 'GENERATION_ABORTED')).toEqual({ ended: true });
      expect(await acquireAssessmentGenerationRequest(db as any, { ownerId, clientDocumentId: doc, semanticInput: semantic })).toMatchObject({ kind: 'conflict', code: 'GENERATION_ENDED' });
    }
  });

  it('fences stale tokens and permits cancellation even after its AI job is no longer live', async () => {
    const got = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: semantic });
    if (got.kind !== 'acquired') throw new Error('expected acquisition');
    expect(await completeAssessmentGenerationRequest(db as any, { ...got.fence, runToken: crypto.randomUUID() }, { packageId: 17 })).toEqual({ completed: false });
    expect(await endAssessmentGenerationRequest(db as any, { ...got.fence, jobId: 'missing-job-id' }, 'cancelled', 'USER_CANCELLED')).toEqual({ ended: true });
    expect(await completeAssessmentGenerationRequest(db as any, got.fence, { packageId: 17 })).toEqual({ completed: false });
  });

  it('requires an existing running, unexpired job for job-fenced completion', async () => {
    db.sqlite.exec(`CREATE TABLE ai_generation_jobs(user_id INTEGER,job_id TEXT,state TEXT,lease_until INTEGER,PRIMARY KEY(user_id,job_id));`);
    const got = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: semantic });
    if (got.kind !== 'acquired') throw new Error('expected acquisition');
    const fence = { ...got.fence, jobId: 'job-12345678' };
    expect(await completeAssessmentGenerationRequest(db as any, fence, { packageId: 17 })).toEqual({ completed: false });
    db.sqlite.prepare(`INSERT INTO ai_generation_jobs VALUES(1,'job-12345678','running',0)`).run();
    expect(await completeAssessmentGenerationRequest(db as any, fence, { packageId: 17 })).toEqual({ completed: false });
    db.sqlite.prepare(`UPDATE ai_generation_jobs SET lease_until=CAST(strftime('%s','now') AS INTEGER)+60`).run();
    expect(await completeAssessmentGenerationRequest(db as any, fence, { packageId: 17 })).toEqual({ completed: true });
    const sqlFence = generationFencePredicate(fence);
    expect(sqlFence.sql).toContain("agj.state='running'");
    expect(sqlFence.bindings).toEqual([1, doc, got.fence.runToken, 1, fence.jobId]);
  });

  it('canonicalizes object keys and rejects undefined semantic values', async () => {
    const one = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: { z: 1, a: { y: true, x: 2 } } });
    const retry = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: { a: { x: 2, y: true }, z: 1 } });
    expect(one.kind).toBe('acquired'); expect(retry).toMatchObject({ kind: 'conflict', code: 'GENERATION_IN_PROGRESS' });
    await expect(acquireAssessmentGenerationRequest(db as any, { ownerId: 2, clientDocumentId: doc, semanticInput: { schema: undefined } })).rejects.toThrow('semantic_input_invalid');
  });

  it('preserves nested own __proto__ keys when hashing and distinguishes their values', async () => {
    const aId = '123e4567-e89b-42d3-a456-426614174001';
    const bId = '123e4567-e89b-42d3-a456-426614174002';
    const emptyId = '123e4567-e89b-42d3-a456-426614174003';
    const a = JSON.parse('{"nested":{"__proto__":{"a":1},"z":2}}');
    const reorderedA = JSON.parse('{"nested":{"z":2,"__proto__":{"a":1}}}');
    const b = JSON.parse('{"nested":{"__proto__":{"b":1},"z":2}}');
    expect((await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: aId, semanticInput: a })).kind).toBe('acquired');
    expect(await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: aId, semanticInput: reorderedA })).toMatchObject({ kind: 'conflict', code: 'GENERATION_IN_PROGRESS' });
    expect((await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: bId, semanticInput: b })).kind).toBe('acquired');
    expect((await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: emptyId, semanticInput: {} })).kind).toBe('acquired');
  });

  it('requires package identity or valid failed-save recovery content and validates completed rows', async () => {
    const got = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: doc, semanticInput: semantic });
    if (got.kind !== 'acquired') throw new Error('expected acquisition');
    const count = () => db.sqlite.prepare('SELECT COUNT(*) AS n FROM assessment_generation_requests').get()?.n;
    const before = count();
    for (const invalid of [{ result: {} }, { result: null }, { packageId: 0 }, { packageId: -3 }, { packageId: 1.5 }, { packageId: Number.NaN }]) {
      expect(() => createAssessmentGenerationCompletionStatement(db as any, got.fence, invalid as any)).toThrow();
    }
    expect(count()).toBe(before);
    expect(await completeAssessmentGenerationRequest(db as any, got.fence, { packageId: null, result: recovery })).toEqual({ completed: true });
    expect((await loadAssessmentGenerationRequest(db as any, 1, doc))?.result).toEqual(recovery);

    const pointerDoc = '223e4567-e89b-42d3-a456-426614174001';
    const pointer = await acquireAssessmentGenerationRequest(db as any, { ownerId: 1, clientDocumentId: pointerDoc, semanticInput: semantic });
    if (pointer.kind !== 'acquired') throw new Error('expected acquisition');
    expect(await completeAssessmentGenerationRequest(db as any, pointer.fence, { packageId: 23 })).toEqual({ completed: true });
    expect((await loadAssessmentGenerationRequest(db as any, 1, pointerDoc))?.result).toBeNull();

    db.sqlite.prepare(`UPDATE assessment_generation_requests SET state='completed',package_id=NULL,result_json='{}' WHERE client_document_id=?`).run(pointerDoc);
    await expect(loadAssessmentGenerationRequest(db as any, 1, pointerDoc)).rejects.toThrow('assessment_generation_record_corrupt');
    db.sqlite.prepare(`UPDATE assessment_generation_requests SET package_id=23,result_json='null' WHERE client_document_id=?`).run(pointerDoc);
    expect((await loadAssessmentGenerationRequest(db as any, 1, pointerDoc))?.packageId).toBe(23);
  });

  it('rejects oversized completion payloads before preparing a write', () => {
    const fence = { ownerId: 1, clientDocumentId: doc, runToken: crypto.randomUUID() };
    expect(() => createAssessmentGenerationCompletionStatement(db as any, fence, { result: { _persistence: { saveStatus: 'failed' }, pg: [{ soal: 'x'.repeat(1024 * 1024) }] } })).toThrow('assessment_generation_result_too_large');
  });
});
