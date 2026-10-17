import { describe, expect, it, vi } from 'vitest';
import * as utils from '../public/static/js/utils.js';
import { runCpQualityGate } from '../public/static/js/pages/analisis-cp/validator.js';
import { renderVerificationView } from '../public/static/js/pages/analisis-cp/verification-view.js';

describe('browser module contracts', () => {
  it('exports the runtime utilities, including loading helpers and forwarded modules', () => {
    expect(Object.keys(utils).sort()).toEqual([
      'avatar', 'badge', 'closeAiLiveMonitor', 'confirm', 'copyToClipboard', 'createSpinner',
      'debounce', 'detectUserDefaultKelas', 'detectUserDefaultMapel', 'emptyState', 'escapeHtml',
      'formatDate', 'formatDateTime', 'formatFileSize', 'formatRelativeTime', 'getActiveAiJobSignal',
      'getActiveAiProviders', 'getActiveTahunAjaran', 'getAvatarColor', 'getInitials',
      'getQueryParams', 'hasActiveAiJob', 'hideLoading', 'isAiJobRunning', 'moduleToast', 'nl2br',
      'openAiLiveMonitor', 'parseDate', 'populateAiModelSelect', 'renderTahunAjaranOptions',
      'showLoading', 'showToast', 'skeletonCards', 'skeletonList', 'skeletonTable', 'streamPost',
      'truncate',
    ]);
    expect(utils.detectUserDefaultKelas(null)).toBeTypeOf('number');
    expect(utils.detectUserDefaultMapel(null)).toBeTypeOf('string');
  });

  it('returns quality-gate data and audit, and invokes the verification callback names used at runtime', () => {
    const gate = runCpQualityGate({
      metadata: { kelas: '5', mata_pelajaran: 'IPAS', fase: 'Fase C' },
      semesters: [{ semester: 1, babs: [{ no: 1, bab: 'Ekosistem', cp: '', items: [{ kode_tp: '5.1', materi_pokok: 'Ekosistem', tp: 'Murid mampu menjelaskan ekosistem.', atp: 'Mengamati ekosistem.', alokasi_waktu: '4 JP' }] }] }],
    });
    expect(Object.keys(gate).sort()).toEqual(['audit', 'data']);
    expect(gate.data).toHaveProperty('_audit', gate.audit);

    const container = document.createElement('div');
    const onChange = vi.fn();
    const onBack = vi.fn();
    const onValidate = vi.fn();
    renderVerificationView(container, gate.data, {}, { onChange, onBack, onValidate });
    const textarea = container.querySelector<HTMLTextAreaElement>('.tp-textarea');
    if (!textarea) throw new Error('The rendered verification view omitted the TP editor');
    textarea.value = 'Murid mampu menganalisis ekosistem.';
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    container.querySelector<HTMLButtonElement>('#btn-back-to-input-form')?.click();
    container.querySelector<HTMLButtonElement>('#btn-commit-to-canvas')?.click();

    expect(onChange).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
    expect(onValidate).toHaveBeenCalledWith(expect.objectContaining({ _audit: expect.any(Object) }));
  });
});
