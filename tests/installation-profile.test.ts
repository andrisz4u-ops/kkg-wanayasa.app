// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { parseInstallation, makeWranglerConfig, makeBootstrapSql } from '../scripts/installation-config.mjs';
import { migratedDatabase } from './helpers/migrated-db';
import { getOrganizationSettings, getDocumentOrganizationSettings } from '../src/lib/organization';
import { getTenantConfig, DEFAULT_TENANT_ID } from '../src/lib/tenant';
import { getCurrentUser, verifyPassword } from '../src/lib/auth';
import settings from '../src/routes/settings';
import tenants from '../src/routes/tenants';
import admin from '../src/routes/admin';
import templates from '../src/routes/templates';
import app from '../src/index';
import { renderHTML } from '../src/templates/layout';
import { generateSppdDocx } from '../src/lib/docx/sppd';
import { SqliteD1 } from './helpers/sqlite-d1';
import programSekolah from '../src/routes/program-sekolah';
import JSZip from 'jszip';

const template = JSON.parse(readFileSync('installations/gugus.example.json', 'utf8'));
const databases: ReturnType<typeof migratedDatabase>[] = [];
const fixturePassword = 'FixtureAdminPassword123';
function fixture(name: string) {
    const config = parseInstallation({ ...template, organization: { ...template.organization, nama_kkg: name } });
    const db = migratedDatabase(); databases.push(db);
    db.sqlite.exec(makeBootstrapSql(config, fixturePassword));
    return { db, config };
}
afterEach(() => { databases.splice(0).forEach(db => { db.close(); }); vi.restoreAllMocks(); });

describe('Independent installation profiles', () => {
    it('uses neutral metadata for an absent profile schema, while retaining a real legacy row', async () => {
        const empty = new SqliteD1(); databases.push(empty);
        const neutral = await getOrganizationSettings(empty as any);
        expect(neutral).toMatchObject({ nama_kkg: 'KKG', kecamatan: '', email_kkg: '', region_profile: 'custom' });
        expect(JSON.stringify(neutral)).not.toMatch(/Wanayasa|kkg-wanayasa/i);
        expect((await getDocumentOrganizationSettings(empty as any)).legacy_logo_assets).toBe(false);
        const legacy = migratedDatabase(); databases.push(legacy);
        expect((await getOrganizationSettings(legacy as any)).nama_kkg).toBe('KKG Gugus 3 Wanayasa');
    });

    it('surfaces unavailable profile reads instead of manufacturing organization defaults', async () => {
        const { db } = fixture('KKG Pasawahan');
        const realPrepare = db.prepare.bind(db);
        vi.spyOn(db, 'prepare').mockImplementation((sql: string) => {
            if (sql.includes('FROM settings')) throw new Error('fixture database temporarily unavailable');
            return realPrepare(sql);
        });
        await expect(getOrganizationSettings(db as any)).rejects.toThrow('temporarily unavailable');
        await expect(getTenantConfig(db as any)).rejects.toThrow('temporarily unavailable');
        const response = await settings.request('/public', {}, { DB: db as any });
        expect(response.status).toBe(500);
        expect(await response.text()).not.toContain('Wanayasa');
    });

    it('exports the selected school without borrowing the logged-in school headmaster', async () => {
        const { db } = fixture('KKG Pasawahan');
        db.sqlite.prepare("UPDATE settings SET value='Pasawahan' WHERE key='kecamatan'").run();
        const ownSchool: any = db.sqlite.prepare('SELECT id,nama FROM sekolah LIMIT 1').get();
        db.sqlite.prepare("UPDATE sekolah SET kepala_sekolah='Kepala Sekolah Akun',nip_kepala_sekolah='NIP-AKUN' WHERE id=?").run(ownSchool.id);
        db.sqlite.prepare('UPDATE users SET sekolah_id=?,sekolah=?').run(ownSchool.id, ownSchool.nama);
        const user: any = db.sqlite.prepare('SELECT id FROM users').get();
        db.sqlite.prepare("INSERT INTO sessions(id,user_id,expires_at) VALUES('kaldik-fixture',?,datetime('now','+1 day'))").run(user.id);
        db.sqlite.prepare("INSERT INTO sekolah(nama,npsn,tipe) VALUES('SDN Target Pasawahan','87654321','negeri')").run();
        const response = await programSekolah.request('/kaldik-excel', { method: 'POST', headers: { Cookie: 'session=kaldik-fixture', 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { metadata: { nama_sekolah: 'SDN Target Pasawahan' } } }) }, { DB: db as any });
        expect(response.status).toBe(200);
        const zip = await JSZip.loadAsync(await response.arrayBuffer());
        const worksheets = (await Promise.all(zip.file(/^xl\/worksheets\/sheet\d+\.xml$/).map(file => file.async('string')))).join('');
        expect(worksheets).toContain('SDN TARGET PASAWAHAN');
        expect(worksheets).toContain('Pasawahan');
        expect(worksheets).not.toMatch(/Wanayasa|Nenden|19760314|Kepala Sekolah Akun|NIP-AKUN/);
    });

    it('requires a school selection before calendar export', async () => {
        const { db } = fixture('KKG Sukasari');
        const user: any = db.sqlite.prepare('SELECT id FROM users').get();
        db.sqlite.prepare("INSERT INTO sessions(id,user_id,expires_at) VALUES('school-missing-fixture',?,datetime('now','+1 day'))").run(user.id);
        const response = await programSekolah.request('/kaldik-excel', { method: 'POST', headers: { Cookie: 'session=school-missing-fixture', 'Content-Type': 'application/json' }, body: '{}' }, { DB: db as any });
        expect(response.status).toBe(400);
        expect(await response.text()).toContain('Pilih sekolah');
    });

    it('bootstraps only the selected schools/admin and preserves the authentication namespace', async () => {
        const { db } = fixture("KKG Gugus O'Baru");
        expect(db.sqlite.prepare('SELECT nama FROM sekolah').all()).toEqual([{ nama: 'SDN Contoh' }]);
        const user: any = db.sqlite.prepare('SELECT * FROM users').get();
        expect(user.email).toBe('admin@example.org');
        expect(user.tenant_id).toBe(DEFAULT_TENANT_ID);
        expect(await verifyPassword(fixturePassword, user.password_hash)).toBe(true);
        db.sqlite.prepare("INSERT INTO sessions(id,user_id,expires_at) VALUES('installation-fixture',?,datetime('now','+1 day'))").run(user.id);
        expect(await getCurrentUser(db as any, 'installation-fixture')).toMatchObject({ role: 'admin' });
        const publicProfile = await getOrganizationSettings(db as any);
        expect(publicProfile.nama_kkg).toBe("KKG Gugus O'Baru");
        expect(JSON.stringify(publicProfile)).not.toContain(fixturePassword);
        expect(db.sqlite.prepare('SELECT konten FROM surat_templates').get()).toMatchObject({ konten: expect.stringContaining('{{nama_kkg}}') });
        const preview = await templates.request('/1/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"data":{}}' }, { DB: db as any });
        expect((await preview.json() as any).data.preview).toContain("KKG Gugus O'Baru");
        expect(() => db.sqlite.exec(makeBootstrapSql(parseInstallation(template), fixturePassword))).toThrow();
        expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM users').get()).toEqual({ n: 1 });
    });

    it('reads the latest canonical profile without leaking cached names across databases', async () => {
        const first = fixture('KKG Satu'), second = fixture('KKG Dua');
        expect((await getTenantConfig(first.db as any)).nama).toBe('KKG Satu');
        expect((await getTenantConfig(second.db as any)).nama).toBe('KKG Dua');
        first.db.sqlite.prepare("UPDATE settings SET value='KKG Diperbarui' WHERE key='nama_kkg'").run();
        const updated = await getOrganizationSettings(first.db as any);
        expect(updated.nama_organisasi).toBe('KKG Diperbarui');
        expect((await getTenantConfig(first.db as any)).nama).toBe('KKG Diperbarui');
        expect((await getTenantConfig(second.db as any)).nama).toBe('KKG Dua');
    });

    it('keeps admin settings and tenant edits on the same canonical record', async () => {
        const { db } = fixture('KKG Awal');
        const user: any = db.sqlite.prepare('SELECT id FROM users').get();
        db.sqlite.prepare("INSERT INTO sessions(id,user_id,expires_at) VALUES('profile-fixture',?,datetime('now','+1 day'))").run(user.id);
        const routes = new Hono().route('/admin', admin).route('/tenants', tenants).route('/settings', settings);
        const update = await routes.request('/admin/settings', { method: 'PUT', headers: { Cookie: 'session=profile-fixture', 'Content-Type': 'application/json' }, body: JSON.stringify({ nama_kkg: 'KKG Terbaru', gugus: '4', app_name: 'Portal Empat' }) }, { DB: db as any });
        expect(update.status).toBe(200);
        const current: any = await (await routes.request('/tenants/current', {}, { DB: db as any })).json();
        expect(current.data).toMatchObject({ nama: 'KKG Terbaru', school_count: 1 });
        const tenantEdit = await routes.request('/tenants/current', { method: 'PUT', headers: { Cookie: 'session=profile-fixture', 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: 'KKG Final', provinsi: 'Jawa Tengah' }) }, { DB: db as any });
        expect(tenantEdit.status).toBe(200);
        const profile: any = await (await routes.request('/settings/public', {}, { DB: db as any })).json();
        expect(profile.data).toMatchObject({ nama_kkg: 'KKG Final', nama_organisasi: 'KKG Final', provinsi: 'Jawa Tengah', app_name: 'Portal Empat' });
    });

    it('uses the selected name/domain in HTML and PWA and escapes profile text', async () => {
        const { db } = fixture('KKG & Contoh');
        const profile = await getOrganizationSettings(db as any);
        const html = renderHTML('blue', { ...profile, app_name: '</script><script>alert(1)</script>' });
        expect(html).toContain('KKG &amp; Contoh');
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).toContain('\\u003c/script>');
        expect(html).not.toContain('admin@ruangkkg.my.id');
        const response = await app.request('/api/settings/manifest', {}, { DB: db as any });
        expect(response.headers.get('content-type')).toContain('application/manifest+json');
        expect(await response.json()).toMatchObject({ name: 'RuangKKG - KKG & Contoh' });
    });

    it('reads a configured document logo from this R2 bucket without external fetching', async () => {
        const { db } = fixture('KKG Logo');
        db.sqlite.prepare("UPDATE settings SET value='/api/files/logos/own.png' WHERE key='logo_url'").run();
        const get = vi.fn(async () => ({ size: 8, httpMetadata: { contentType: 'image/png' }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }));
        const profile = await getDocumentOrganizationSettings(db as any, { get } as any);
        expect(get).toHaveBeenCalledWith('logos/own.png');
        expect(profile.legacy_logo_assets).toBe(false);
        expect(profile.logo_image).toEqual(new Uint8Array([1, 2, 3]));
        const doc = await generateSppdDocx({ sekolah_asal_nama: 'SD Baru', daftar_guru: [], tanggal_kegiatan: '2026-10-25', agenda: 'Rapat', tempat_kegiatan: 'Sekolah', isi_lhp: 'Selesai' } as any, { ...profile, kecamatan: 'Sukasari', kabupaten: 'Bandung' });
        const serialized = JSON.stringify(doc);
        expect(serialized).toContain('Sukasari');
        expect(serialized).not.toContain('Wanayasa');
    });

    it('rejects existing Wanayasa resources and keeps new deployment bindings explicit', () => {
        expect(() => parseInstallation({ ...template, databaseName: 'kkg-wanayasa-db' })).toThrow();
        expect(() => parseInstallation({ ...template, organization: { ...template.organization, kabupaten: 'Bandung' } })).toThrow();
        const config = makeWranglerConfig(parseInstallation(template));
        expect(config.d1_databases[0]).toMatchObject({ binding: 'DB', database_name: 'kkg-gugus-baru-db', migrations_dir: '../../migrations' });
        expect(config.r2_buckets[0].bucket_name).toBe('kkg-gugus-baru-storage');
        expect(config.vars.CORS_ORIGINS).toBe('https://kkg-gugus-baru.pages.dev');
    });

    it('does not apply Purwakarta-specific generators to custom regions', async () => {
        const { db } = fixture('KKG Luar Daerah');
        const response = await app.request('/api/program-sekolah/templates', {}, { DB: db as any, REGION_PROFILE: 'custom' });
        expect(response.status).toBe(409);
        expect(await response.json()).toMatchObject({ error: { code: 'REGIONAL_CONTENT_UNAVAILABLE' } });
        const publicResponse = await app.request('/api/settings/public', {}, { DB: db as any, REGION_PROFILE: 'custom' });
        expect(publicResponse.status).toBe(200);
    });
});
