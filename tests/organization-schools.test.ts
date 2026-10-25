import { describe, expect, it, vi } from 'vitest';
vi.mock('../public/static/js/api.js', () => ({ api: vi.fn(), validators: {}, validateForm: vi.fn(), showFormErrors: vi.fn(), clearFormErrors: vi.fn() }));
import { api } from '../public/static/js/api.js';
// @ts-expect-error The browser auth module is plain JavaScript.
import { loadSekolahForRegister } from '../public/static/js/pages/auth.js';

describe('Installation registration schools', () => {
    it('uses only schools returned by the current database and clears stale options on failure', async () => {
        document.body.innerHTML = '<select><optgroup id="optgroup-anggota"></optgroup><option value="__other__">Lainnya</option></select>';
        const select = document.querySelector('select')!;
        vi.mocked(api).mockResolvedValueOnce({ data: [{ id: 10, nama: 'SD Gugus Baru', is_sekretariat: 1 }] });
        await loadSekolahForRegister(select);
        expect(select.textContent).toContain('SD Gugus Baru');
        expect(select.textContent).not.toContain('Nangerang');
        vi.mocked(api).mockResolvedValueOnce({ data: [] });
        await loadSekolahForRegister(select);
        expect(select.querySelectorAll('optgroup option')).toHaveLength(0);
        vi.mocked(api).mockRejectedValueOnce(new Error('fixture unavailable'));
        await loadSekolahForRegister(select);
        expect(select.querySelectorAll('optgroup option')).toHaveLength(0);
    });
});
