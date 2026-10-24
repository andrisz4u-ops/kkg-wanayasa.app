// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import admin from '../src/routes/admin';
import { getCurrentUser, verifyPassword } from '../src/lib/auth';
import { resetRateLimits } from '../src/lib/ratelimit';
import { migratedDatabase } from './helpers/migrated-db';

let db: ReturnType<typeof migratedDatabase>;
const app = new Hono().route('/api/admin', admin);
const request = (path: string, method: string, body?: object) => app.request(`/api/admin${path}`, {
  method, headers: { Cookie: 'session=admin-fixture', 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
}, { DB: db as any, ENCRYPTION_KEY: 'fixture-encryption-key-for-admin-tests' });
beforeEach(() => {
  resetRateLimits(); db = migratedDatabase();
  db.sqlite.exec(`INSERT INTO users(id,nama,email,password_hash,role,role_label,is_approved) VALUES
    (900,'Admin','admin@fixture.invalid','old','admin','admin',1),
    (901,'Guru','guru@fixture.invalid','old','user','user',1);
    INSERT INTO sessions(id,user_id,expires_at) VALUES
    ('admin-fixture',900,datetime('now','+1 day')),('teacher-fixture',901,datetime('now','+1 day'));
    INSERT INTO ai_providers(id,name,slug,api_type,base_url,model,api_key) VALUES
    (900,'Fixture','fixture-provider','openai_compat','https://provider.invalid','fixture','');`);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { db.close(); vi.restoreAllMocks(); });

function failAudit() {
  db.sqlite.exec("CREATE TRIGGER fixture_audit_failure BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'fixture audit unavailable'); END;");
}

describe('critical admin mutations and audit are one transaction', () => {
  it.each([
    ['/settings', 'PUT', { nama_kkg: 'Nama Baru', gugus: '3' }, "SELECT value FROM settings WHERE key='nama_kkg'"],
    ['/users/901', 'PUT', { nama: 'Guru Baru', role: 'operator' }, 'SELECT nama,role,role_label FROM users WHERE id=901'],
    ['/ai-providers/900', 'PUT', { name: 'Provider Baru' }, 'SELECT name FROM ai_providers WHERE id=900'],
    ['/ai-providers/900', 'DELETE', undefined, 'SELECT name FROM ai_providers WHERE id=900'],
    ['/ai-providers/900/toggle', 'PUT', undefined, 'SELECT is_active FROM ai_providers WHERE id=900'],
    ['/users/901', 'DELETE', undefined, 'SELECT nama FROM users WHERE id=901'],
  ] as const)('rolls back %s when its audit insert fails', async (path, method, body, query) => {
    const before = db.sqlite.prepare(query).get(); failAudit();
    expect((await request(path, method, body)).status).toBe(500);
    expect(vi.mocked(console.error).mock.calls.some(args => args.some(value => value instanceof Error && value.message.includes('fixture audit unavailable')))).toBe(true);
    expect(db.sqlite.prepare(query).get()).toEqual(before);
  });

  it('rolls back the password and session deletion if reset auditing fails', async () => {
    failAudit();
    expect((await request('/users/901/reset-password', 'POST', { new_password: 'NewFixturePassword123' })).status).toBe(500);
    expect(db.sqlite.prepare('SELECT password_hash FROM users WHERE id=901').get()?.password_hash).toBe('old');
    expect(db.sqlite.prepare("SELECT id FROM sessions WHERE id='teacher-fixture'").get()).toBeDefined();
  });

  it.each([
    ['/users', { nama: 'Guru Baru', email: 'new@fixture.invalid', password: 'NewFixturePassword123', role: 'admin' }],
    ['/ai-providers', { name: 'Provider Baru', slug: 'new-provider', api_type: 'openai_compat', base_url: 'https://provider.invalid', model: 'fixture' }],
  ] as const)('does not create %s without its audit record', async (path, body) => {
    failAudit();
    expect((await request(path, 'POST', body)).status).toBe(500);
    expect(db.sqlite.prepare(path === '/users' ? "SELECT id FROM users WHERE email='new@fixture.invalid'" : "SELECT id FROM ai_providers WHERE slug='new-provider'").get()).toBeUndefined();
  });

  it('links a created user audit to its actual ID and stores the admin role correctly', async () => {
    const response = await request('/users', 'POST', { nama: 'Admin Baru', email: 'new@fixture.invalid', password: 'NewFixturePassword123', role: 'admin' });
    expect(response.status).toBe(201);
    const row = db.sqlite.prepare("SELECT id,role,role_label FROM users WHERE email='new@fixture.invalid'").get()!;
    expect(row).toMatchObject({ role: 'admin', role_label: 'admin' });
    expect(db.sqlite.prepare("SELECT entity_id FROM audit_logs WHERE action='USER_CREATE'").get()?.entity_id).toBe(row.id);
  });

  it('revokes a reset session immediately and records no credential bytes', async () => {
    expect(await getCurrentUser(db as any, 'teacher-fixture')).not.toBeNull();
    const password = 'NewFixturePassword123';
    expect((await request('/users/901/reset-password', 'POST', { new_password: password })).status).toBe(200);
    expect(await getCurrentUser(db as any, 'teacher-fixture')).toBeNull();
    expect(await verifyPassword(password, String(db.sqlite.prepare('SELECT password_hash FROM users WHERE id=901').get()?.password_hash))).toBe(true);
    const audits = JSON.stringify(db.sqlite.prepare('SELECT * FROM audit_logs').all());
    expect(audits).toContain('USER_PASSWORD_RESET'); expect(audits).not.toContain(password);
  });

  it('uses the current role and active state on the next request without a cache window', async () => {
    expect(await getCurrentUser(db as any, 'teacher-fixture')).toMatchObject({ role: 'user' });
    expect((await request('/users/901', 'PUT', { role: 'operator' })).status).toBe(200);
    expect(await getCurrentUser(db as any, 'teacher-fixture')).toMatchObject({ role: 'operator' });
    db.sqlite.exec('UPDATE users SET is_active=0 WHERE id=901');
    expect(await getCurrentUser(db as any, 'teacher-fixture')).toBeNull();
  });

  it('compares ISO-8601 expiry as a timestamp rather than as differently formatted text', async () => {
    db.sqlite.prepare("UPDATE sessions SET expires_at=? WHERE id='teacher-fixture'").run(new Date(Date.now() - 60_000).toISOString());
    expect(await getCurrentUser(db as any, 'teacher-fixture')).toBeNull();
    db.sqlite.prepare("UPDATE sessions SET expires_at=? WHERE id='teacher-fixture'").run(new Date(Date.now() + 60_000).toISOString());
    expect(await getCurrentUser(db as any, 'teacher-fixture')).toMatchObject({ id: 901 });
  });
});
