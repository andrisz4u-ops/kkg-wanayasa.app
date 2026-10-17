import { describe, expect, it, vi } from 'vitest';
import { runCpQualityGate } from '../src/lib/cp-validator';

function input(tp = 'Murid mampu menghitung hasil penjumlahan bilangan.', mapel = 'Matematika') {
  return {
    metadata: { mata_pelajaran: mapel, kelas: '5', fase: 'Fase C' },
    user_note: 'keep this user edit',
    semesters: [{ semester: 1, babs: [{
      no: 1,
      bab: 'Bilangan',
      cp: 'Musik dan ekspresi musikal',
      items: [{ kode_tp: '5.1', tp, atp: 'Murid berlatih.', materi_pokok: 'Bilangan', alokasi_waktu: '4 JP', user_edit: 'preserve' }]
    }] }]
  };
}

function expectContract(audit: Awaited<ReturnType<typeof runCpQualityGate>>['audit']) {
  expect(audit.summary).toMatchObject({
    passed_count: 0,
    needs_review_count: audit.summary.total_tp,
    verification_scope: 'deterministic',
    review_status: 'needs_teacher_review',
    cp_alignment_pct: null,
    verified_at: null
  });
  expect(audit.summary.audited_at).toBeTruthy();
  expect(audit.items.every(item => item.status !== ('verified' as any))).toBe(true);
  expect(audit.items.every(item => item.cp_aligned !== true)).toBe(true);
}

describe('CP validator verification scope contract', () => {
  it('does not treat clean TP or unrelated non-IPAS CP text as verified/aligned', async () => {
    const ai = { generateJSON: vi.fn() } as any;
    const { data, audit } = await runCpQualityGate(input(), [], {}, { ai, preferredSlug: 'test' });

    expectContract(audit);
    expect(ai.generateJSON).not.toHaveBeenCalled();
    expect(audit.items[0]).toMatchObject({
      status: 'needs_review',
      structural_status: 'passed',
      cp_aligned: null,
      alignment_status: 'not_assessed',
      verification_scope: 'deterministic',
      review_status: 'needs_teacher_review'
    });
    expect(audit.summary.structure_passed_count).toBe(1);
    expect(data.user_note).toBe('keep this user edit');
    expect(data.semesters[0].babs[0].items[0].user_edit).toBe('preserve');
    expect(audit.summary.grade_label).toContain('perlu tinjauan guru');
  });

  it('keeps status and counts within deterministic scope when AI repairs a flagged TP', async () => {
    const ai = { generateJSON: vi.fn().mockResolvedValue({ verifications: [{
      kode_tp: '5.1', refined_tp: 'Murid mampu menghitung hasil penjumlahan bilangan.'
    }] }) } as any;
    const { audit } = await runCpQualityGate(input('memahami bilangan'), [], {}, { ai, preferredSlug: 'test' });

    expectContract(audit);
    expect(ai.generateJSON).toHaveBeenCalledTimes(1);
    expect(audit.items[0]).toMatchObject({ status: 'repaired', structural_status: 'repaired', cp_aligned: null });
    expect(audit.summary.repaired_count).toBe(1);
    expect(audit.summary.flagged_count).toBe(0);
    expect(audit.summary.structure_passed_count).toBe(0);
  });

  it.each([
    ['malformed response', { verifications: 'not-an-array' }],
    ['failed call', new Error('critic unavailable')]
  ])('keeps review scope after AI %s', async (_label, result) => {
    const generateJSON = vi.fn().mockImplementation(() => result instanceof Error ? Promise.reject(result) : Promise.resolve(result));
    const ai = { generateJSON } as any;
    const { audit } = await runCpQualityGate(input('memahami bilangan'), [], {}, { ai, preferredSlug: 'test' });

    expectContract(audit);
    expect(audit.items[0].status).toBe('flagged');
    expect(audit.items[0].structural_status).toBe('flagged');
    expect(audit.summary.flagged_count).toBe(1);
    expect(audit.summary.structure_passed_count).toBe(0);
  });

  it.each([
    ['object', { unexpected: true }],
    ['array', ['not', 'a', 'TP']],
    ['number', 42],
    ['whitespace-only string', '  \t  ']
  ])('ignores critic refined_tp with invalid %s type/content and null rows', async (_label, refinedTp) => {
    const originalTp = 'memahami bilangan';
    const ai = { generateJSON: vi.fn().mockResolvedValue({ verifications: [
      null,
      { kode_tp: '5.1', refined_tp: refinedTp }
    ] }) } as any;
    const { data, audit } = await runCpQualityGate(input(originalTp), [], {}, { ai, preferredSlug: 'test' });

    expectContract(audit);
    expect(audit.items[0]).toMatchObject({
      tp: originalTp,
      status: 'flagged',
      structural_status: 'flagged',
      review_status: 'needs_teacher_review'
    });
    expect(audit.items[0].repaired_fields).not.toContain('ai_critic_refined');
    expect(data.semesters[0].babs[0].items[0].tp).toBe(originalTp);
    expect(audit.summary.flagged_count).toBe(1);
    expect(audit.summary.repaired_count).toBe(0);
  });
});
