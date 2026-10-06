import { escapeHtml } from './utils.js';

export function renderLoadFailure(title, page) {
  return `<section class="ui-load-state" role="alert">
    <h2>${escapeHtml(title)}</h2>
    <p>Data belum berhasil dimuat. Periksa koneksi Anda, lalu coba lagi.</p>
    <button type="button" onclick="navigate('${escapeHtml(page)}')">Coba Lagi</button>
  </section>`;
}

export function renderEmptyState(title, description) {
  return `<section class="ui-load-state"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></section>`;
}
