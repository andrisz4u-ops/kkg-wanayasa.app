import { expect, it } from 'vitest';
import { setGenerationNotice } from '../public/static/js/ai-generation-notice.js';

it('keeps partial warnings outside the original document and clears them for a complete result', () => {
  const root = document.createElement('section');
  root.innerHTML = '<h2 data-generation-complete="Dokumen siap" data-generation-partial="Draf parsial">Dokumen siap</h2><div id="asesmen-canvas"><h1>Dokumen asli</h1><table><tbody><tr><td>Isi</td></tr></tbody></table></div>';
  const original = root.querySelector('#asesmen-canvas')!.outerHTML;
  setGenerationNotice(root, { partial: true, warnings: ['Bagian isian belum tersedia. <script>tidak dijalankan</script>'] });
  expect(root.querySelector('.ai-generation-notice')!.textContent).toContain('Bagian isian belum tersedia.');
  expect(root.querySelector('script')).toBeNull();
  expect(root.querySelector('[data-generation-complete]')!.textContent).toBe('Draf parsial');
  expect(root.querySelector('#asesmen-canvas')!.outerHTML).toBe(original);
  setGenerationNotice(root, { partial: false });
  expect(root.querySelector('.ai-generation-notice')).toBeNull();
  expect(root.querySelector('[data-generation-complete]')!.textContent).toBe('Dokumen siap');
  expect(root.querySelector('#asesmen-canvas')!.outerHTML).toBe(original);
});
