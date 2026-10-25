import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { state } from '../public/static/js/state.js';
// @ts-expect-error Plain browser modules are exercised through their real renderers.
import { renderHome } from '../public/static/js/pages/home.js';
// @ts-expect-error Plain browser module.
import { renderPrivacyPolicy, renderTermsOfService } from '../public/static/js/pages/legal.js';
// @ts-expect-error Plain browser module.
import { buildSertifikatPaperHTML } from '../public/static/js/pages/sertifikat.js';
// @ts-expect-error Plain browser module.
import { renderProgramCanvas } from '../public/static/js/pages/program-sekolah/renderers.js';
// @ts-expect-error Plain browser module.
import { renderFooter } from '../public/static/js/components.js';
// @ts-expect-error Plain browser module.
import { organizationIdentity } from '../public/static/js/organization.js';

const originalSettings = state.settings;
const originalUser = state.user;
const certificate = { nomor_sertifikat: '001/UJI/2026', nama_guru: 'Guru Uji', sekolah_guru: 'SDN Uji', nama_kegiatan: 'Kegiatan Uji', tanggal: '2026-10-25', verify_url: 'https://gugus.fixture.invalid/verifikasi?token=fixture', materi_list: [] };
function profile(kecamatan: string) {
  return { nama_kkg: `KKG Gugus 4 ${kecamatan}`, app_name: `Portal ${kecamatan}`, gugus: '4', kecamatan, kabupaten: 'Purwakarta', provinsi: 'Jawa Barat', alamat_sekretariat: `Sekretariat ${kecamatan}`, app_url: `https://${kecamatan.toLowerCase()}.fixture.invalid`, email_kkg: `pengurus@${kecamatan.toLowerCase()}.fixture.invalid` };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  (state as any).user = null;
});
afterEach(() => {
  (state as any).settings = originalSettings;
  (state as any).user = originalUser;
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.body.classList.remove('rk-landing');
});

describe('Organization identity in actual public and printed output', () => {
  it.each(['Pasawahan', 'Sukasari'])('uses the %s profile in both certificate pages and its stamp', (kecamatan) => {
    (state as any).settings = profile(kecamatan);
    document.body.innerHTML = buildSertifikatPaperHTML(certificate);
    expect(document.querySelectorAll('.certificate-page')).toHaveLength(2);
    expect(document.querySelector('.certificate-page h2')?.textContent).toContain(`KKG Gugus 4 ${kecamatan}`);
    expect(document.body.textContent).toContain('KKG GUGUS 4');
    expect(document.body.textContent).toContain(kecamatan);
    expect(document.body.textContent).not.toMatch(/Wanayasa|GUGUS 3/i);
  });

  it('uses the selected organization contact on client-rendered home, policy, terms and footer', async () => {
    for (const kecamatan of ['Pasawahan', 'Sukasari']) {
      const current = profile(kecamatan);
      (state as any).settings = current;
      const outputs = [await renderHome(), await renderPrivacyPolicy(), await renderTermsOfService(), renderFooter()];
      for (const html of outputs) {
        expect(html).toContain(current.email_kkg);
        expect(html).toContain(current.nama_kkg);
        expect(html).not.toMatch(/ruangkkg\.my\.id|kkg-wanayasa|Nangerang|admin@/i);
      }
      expect(outputs[1]).toContain(current.app_url);
      if (kecamatan === 'Sukasari') expect(outputs.join('')).not.toContain('Pasawahan');
    }
  });

  it('shows an explicit unconfigured contact and never falls back to another service', async () => {
    (state as any).settings = {};
    for (const html of [await renderHome(), await renderPrivacyPolicy(), await renderTermsOfService(), renderFooter()]) {
      expect(html).toContain('Kontak pengurus belum dikonfigurasi');
      expect(html).not.toMatch(/mailto:|ruangkkg\.my\.id|Wanayasa/);
    }
    expect(organizationIdentity({ app_url: 'javascript:fixture' }, 'https://gugus.fixture.invalid').website).toBe('https://gugus.fixture.invalid');
  });

  it('escapes organization names in the stamp and legal page', async () => {
    (state as any).settings = { ...profile('Pasawahan'), nama_kkg: '<img src=x onerror=fixture>', gugus: '<script>fixture</script>' };
    for (const html of [buildSertifikatPaperHTML(certificate), await renderPrivacyPolicy()]) {
      document.body.innerHTML = html;
      expect(document.querySelector('img[onerror]')).toBeNull();
      expect(document.querySelector('script')).toBeNull();
    }
  });

  it('shows missing calendar identities rather than sample headmaster, NIP or school data', () => {
    const html = renderProgramCanvas({ metadata: { template_id: 'kalender-sekolah', nama_sekolah: 'SDN Uji Pasawahan', kecamatan: 'Pasawahan', kota: 'Purwakarta', tahun_ajaran: '2026/2027' } });
    expect(html).toContain('Kecamatan Pasawahan');
    expect(html).toContain('SDN Uji Pasawahan');
    expect(html).toContain('Nama kepala sekolah belum diisi');
    expect(html).toContain('Data belum lengkap');
    expect(html).not.toMatch(/Wanayasa|Nenden|20205869|19760314/);
    const completed = renderProgramCanvas({ metadata: { template_id: 'kalender-sekolah', nama_sekolah: 'SDN Baru', kecamatan: 'Sukasari', kota: 'Purwakarta', npsn: '12345678', kepala_sekolah: 'Kepala Uji', nip_kepala_sekolah: 'NIP-UJI' } });
    expect(completed).toContain('Kepala Uji');
    expect(completed).not.toContain('Data belum lengkap');
  });
});
