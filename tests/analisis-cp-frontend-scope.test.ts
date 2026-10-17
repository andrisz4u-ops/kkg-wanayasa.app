import { describe, expect, it } from 'vitest';
import { runCpQualityGate } from '../public/static/js/pages/analisis-cp/validator.js';
import { renderVerificationView } from '../public/static/js/pages/analisis-cp/verification-view.js';

function sample(subject = 'IPAS', material = 'Ekosistem', cp = 'Menjelaskan kondisi geografis Indonesia.') {
  return {
    metadata: { mata_pelajaran: subject, kelas: '5', fase: 'Fase C' },
    semesters: [{ semester: 1, babs: [{ no: 1, bab: material, cp, items: [{
      kode_tp: '5.1', materi_pokok: material, tp: 'Murid mampu menganalisis hubungan antar komponen.',
      atp: 'Mengamati materi.', alokasi_waktu: '4 JP',
    }] }] }],
  };
}

function render(data: any): string {
  const container = document.createElement('div');
  renderVerificationView(container, data, { mataPelajaran: data.metadata?.mata_pelajaran });
  return container.innerHTML;
}

describe('Analisis CP frontend verification scope', () => {
  it('client fallback reports structural checks separately and does not claim alignment', () => {
    const result = runCpQualityGate(sample());
    expect(result.audit.summary).toMatchObject({
      passed_count: 0,
      structure_passed_count: 1,
      needs_review_count: 1,
      cp_alignment_pct: null,
      review_status: 'needs_teacher_review',
      verified_at: null,
    });
    expect(result.audit.items[0]).toMatchObject({
      status: 'flagged', structural_status: 'passed', cp_aligned: false,
      alignment_status: 'suspected_mismatch',
    });
    expect(result.audit.summary.verification_scope).toBe('deterministic');
  });

  it.each(['Matematika', 'Seni Musik'])('does not infer CP alignment for %s', subject => {
    const result = runCpQualityGate(sample(subject, 'Bilangan', 'CP tentang bilangan dan pola.'));
    expect(result.audit.items[0].cp_aligned).toBeNull();
    expect(result.audit.items[0].alignment_status).toBe('not_assessed');
    expect(result.audit.summary.cp_alignment_pct).toBeNull();
  });

  it('renders new-contract unknown alignment as not assessed and keeps teacher review visible', () => {
    const data: any = sample('Matematika', 'Bilangan', 'Capaian bilangan.');
    data._audit = runCpQualityGate(data).audit;
    const html = render(data);
    expect(html).toContain('Belum dinilai');
    expect(html).toContain('Perlu ditinjau guru');
    expect(html.split('<!-- Metric 2: CP Alignment -->')[1].split('<!-- Metric 3: JP Balance -->')[0]).not.toContain('100%');
    expect(html).not.toContain('Verified');
  });

  it('renders a server-contract item without converting null alignment into a pass', () => {
    const data: any = sample('Matematika', 'Bilangan', 'Capaian bilangan.');
    data._audit = {
      summary: {
        total_tp: 1, passed_count: 0, structure_passed_count: 1, needs_review_count: 1,
        cp_alignment_pct: null, review_status: 'needs_teacher_review',
        verification_scope: 'deterministic', kko_compliance_pct: 90,
        jp_compliance_pct: 100, grade: 'A', grade_label: 'Struktur baik; perlu ditinjau guru',
      },
      items: [{
        kode_tp: '5.1', status: 'needs_review', structural_status: 'passed', cp_aligned: null,
        alignment_status: 'not_assessed', notes: 'Keselarasan CP belum dinilai.',
      }],
    };
    const html = render(data);
    const alignmentMetric = html.split('<!-- Metric 2: CP Alignment -->')[1].split('<!-- Metric 3: JP Balance -->')[0];
    expect(alignmentMetric).toContain('Belum dinilai');
    expect(alignmentMetric).not.toContain('100%');
    expect(html).toContain('Perlu Tinjau Guru');
    expect(html).toContain('1 Struktur lolos');
  });

  it('downgrades legacy cached verified/100% claims without losing repair and warning states', () => {
    const data: any = sample();
    data._audit = {
      summary: { total_tp: 1, passed_count: 1, repaired_count: 0, flagged_count: 0, cp_alignment_pct: 100, grade: 'A', grade_label: 'Terstandarisasi penuh' },
      items: [{ kode_tp: '5.1', status: 'verified', cp_aligned: true, notes: 'Lolos.' }],
    };
    const html = render(data);
    expect(html).toContain('Belum dinilai');
    expect(html).toContain('Perlu Tinjau Guru');
    expect(html).toContain('Perlu ditinjau guru');
    expect(html.split('<!-- Metric 2: CP Alignment -->')[1].split('<!-- Metric 3: JP Balance -->')[0]).not.toContain('100%');
    expect(html).not.toContain('Verified');
    expect(data._audit.items[0].status).toBe('needs_review');
  });

  it('shows a neutral score and unknown metrics for an incomplete legacy summary', () => {
    const data: any = sample('Matematika', 'Bilangan', 'Capaian bilangan.');
    data._audit = {
      summary: { total_tp: 1, passed_count: 1, grade: 'A', grade_label: 'Tuntas' },
      items: [{ kode_tp: '5.1', status: 'verified', cp_aligned: true }],
    };
    const html = render(data);
    expect(html).toContain('Belum dinilai');
    expect(html).toContain('Skor struktur');
    expect(html).toContain('Grade —');
    expect(html).not.toContain('100%');
    expect(html).not.toContain('Terstandarisasi penuh');
  });

  it('includes clean, repaired, and flagged records in the full needs-review filter', () => {
    const data: any = sample('Matematika', 'Bilangan', 'Capaian bilangan.');
    const bab = data.semesters[0].babs[0];
    bab.items.push(
      { ...bab.items[0], kode_tp: '5.2' },
      { ...bab.items[0], kode_tp: '5.3' },
    );
    data._audit = {
      summary: {
        total_tp: 3, passed_count: 0, structure_passed_count: 1, needs_review_count: 3,
        repaired_count: 1, flagged_count: 1, cp_alignment_pct: null,
        review_status: 'needs_teacher_review', verification_scope: 'deterministic',
        grade: 'B', grade_label: 'Struktur baik; perlu ditinjau guru',
      },
      items: [
        { kode_tp: '5.1', status: 'needs_review', structural_status: 'passed', cp_aligned: null },
        { kode_tp: '5.2', status: 'repaired', structural_status: 'repaired', cp_aligned: null, notes: 'Diperbaiki; perlu tinjau guru.' },
        { kode_tp: '5.3', status: 'flagged', structural_status: 'flagged', cp_aligned: false, notes: 'Ada catatan; perlu tinjau guru.' },
      ],
    };
    const container = document.createElement('div');
    renderVerificationView(container, data, {});
    container.querySelector('[data-filter="needs_review"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(container.querySelectorAll('.tp-card')).toHaveLength(3);
    expect(container.innerHTML).toContain('Diperbaiki; perlu tinjau guru.');
    expect(container.innerHTML).toContain('Ada catatan; perlu tinjau guru.');
  });
});
