import { escapeHtml } from './utils.js';

const text = value => typeof value === 'string' ? value.trim() : '';

export function organizationIdentity(settings = {}, origin = globalThis.location?.origin || '') {
  let website = '';
  for (const candidate of [settings.app_url, settings.website_kkg, origin]) {
    try {
      const url = new URL(text(candidate));
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        website = url.href.replace(/\/$/, '');
        break;
      }
    } catch { /* Ignore unset/invalid links rather than borrowing another site's URL. */ }
  }
  const email = text(settings.email_kkg);
  return {
    name: text(settings.nama_kkg) || text(settings.nama_organisasi) || 'KKG',
    appName: text(settings.app_name) || 'RuangKKG',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '',
    website,
    address: text(settings.alamat_sekretariat),
    location: [settings.kecamatan, settings.kabupaten, settings.provinsi].map(text).filter(Boolean).join(', '),
  };
}

export function renderOrganizationContact(identity, className = '') {
  if (!identity.email) return '<span>Kontak pengurus belum dikonfigurasi</span>';
  return `<a href="mailto:${escapeHtml(identity.email)}" class="${escapeHtml(className)}">${escapeHtml(identity.email)}</a>`;
}
