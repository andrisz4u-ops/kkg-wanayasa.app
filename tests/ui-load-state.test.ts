import { describe, expect, it } from 'vitest';
import { renderEmptyState, renderLoadingLines, renderLoadFailure } from '../public/static/js/ui-load-state.js';

describe('Shared load and empty states', () => {
  it('renders a friendly empty state with an illustration without changing copy', () => {
    const html = renderEmptyState('Belum ada <materi>', 'Coba & lagi');
    expect(html).toContain('ui-empty-art');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('<svg');
    expect(html).toContain('Belum ada &lt;materi&gt;');
    expect(html).toContain('Coba &amp; lagi');
    expect(html).not.toContain('<materi>');
  });

  it('keeps the failure state actionable with a retry target', () => {
    const html = renderLoadFailure('Forum belum dapat dimuat', 'forum');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Coba Lagi');
    expect(html).toContain("navigate('forum')");
  });

  it('renders an accessible loading shimmer with a label', () => {
    const html = renderLoadingLines('Memuat notifikasi');
    expect(html).toContain('fw-loading-lines');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Memuat notifikasi"');
  });
});
