import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { api } from '../public/static/js/api.js';
import { state } from '../public/static/js/state.js';
import { renderGuru } from '../public/static/js/pages/guru.js';
import { renderForum } from '../public/static/js/pages/forum.js';
import { renderPengumuman } from '../public/static/js/pages/pengumuman.js';
import { renderAbsensi } from '../public/static/js/pages/absensi.js';
import { renderKalender, initKalender } from '../public/static/js/pages/kalender.js';

vi.mock('../public/static/js/api.js', () => ({ api: vi.fn() }));

beforeEach(() => {
  vi.mocked(api).mockReset();
  state.user = { id: 7, role: 'admin', nama: 'Guru Uji' };
});
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Failed loads remain distinct from successful empty collections', () => {
  it.each([
    ['guru', renderGuru],
    ['forum', renderForum],
    ['pengumuman', renderPengumuman],
    ['absensi', renderAbsensi],
  ])('distinguishes a failed %s load from a successful empty collection after recovery', async (page, render) => {
    vi.mocked(api).mockRejectedValueOnce(new Error('Connection unavailable'));
    document.body.innerHTML = await render();
    const alert = document.querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain('Periksa koneksi');
    expect(alert.querySelector<HTMLButtonElement>('button')!.textContent).toBe('Coba Lagi');
    vi.mocked(api).mockResolvedValueOnce({ data: [] });
    document.body.innerHTML = await render();
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.body.textContent).toMatch(/belum ada|percakapan pertama/i);
  });

  it('shows calendar load feedback, exposes failure, and recovers after a successful reload', async () => {
    document.body.innerHTML = await renderKalender();
    let reject: (error: Error) => void;
    vi.mocked(api).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const loading = initKalender();
    expect(document.querySelector('#calendar-body [role="status"]')?.textContent).toContain('Memuat agenda');
    reject!(new Error('Connection unavailable'));
    await loading;
    expect(document.querySelector('#calendar-body [role="alert"]')).not.toBeNull();
    expect(document.querySelector<HTMLButtonElement>('#calendar-body button')!.textContent).toBe('Coba Lagi');
    vi.mocked(api).mockResolvedValueOnce({ data: [] });
    await initKalender();
    expect(document.querySelector('#calendar-body [role="alert"]')).toBeNull();
    expect(document.querySelector('#calendar-body [role="status"]')).toBeNull();
  });

  it('keeps the new audit styles away from printed documents', () => {
    postcss.parse(readFileSync('src/styles/audit-refinement.css', 'utf8')).walkRules(rule => {
      let parent = rule.parent;
      let screen = false;
      while (parent) {
        if (parent.type === 'atrule' && parent.name === 'media' && parent.params === 'screen') screen = true;
        parent = parent.parent;
      }
      expect(screen, rule.selector).toBe(true);
    });
  });
});
