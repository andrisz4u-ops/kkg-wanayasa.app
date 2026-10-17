import { escapeHtml } from './utils.js';

export function renderLoadFailure(title, page) {
  return `<section class="ui-load-state" role="alert">
    <h2>${escapeHtml(title)}</h2>
    <p>Data belum berhasil dimuat. Periksa koneksi Anda, lalu coba lagi.</p>
    <button type="button" onclick="navigate('${escapeHtml(page)}')">Coba Lagi</button>
  </section>`;
}

export function renderEmptyState(title, description) {
  return `<section class="ui-load-state"><div class="ui-empty-art" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z"/><path d="M12 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z"/></svg></div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></section>`;
}

export function renderLoadingLines(label) {
  return `<div class="fw-loading-lines" role="status" aria-label="${escapeHtml(label)}"><span></span><span></span><span></span></div>`;
}
