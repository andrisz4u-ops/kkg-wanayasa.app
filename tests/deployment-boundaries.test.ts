// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/index';
import { getCurrentUser } from '../src/lib/auth';
import { DEFAULT_TENANT_ID } from '../src/lib/tenant';
import { SqliteD1 } from './helpers/sqlite-d1';

describe('Deployment boundaries', () => {
  let db: SqliteD1;
  beforeEach(() => { db = new SqliteD1(); });
  afterEach(() => db.close());

  it('does not expose database maintenance endpoints in production', async () => {
    for (const path of ['/api/init-db', '/api/db-patch/fix-notifications']) {
      const response = await app.request(`https://example.test${path}`, {
        method: 'POST',
        headers: { Cookie: 'csrf_token=maintenance-test', 'X-CSRF-Token': 'maintenance-test' },
      }, { DB: db as any, ENVIRONMENT: 'production' });
      expect(response.status).toBe(404);
    }
  });

  it('rejects a request for an organization whose data is not yet isolated', async () => {
    const response = await app.request('https://example.test/api/ai-providers/active', {
      headers: { 'X-Tenant-ID': 'other-organization' },
    }, { DB: db as any, ENVIRONMENT: 'production', ENCRYPTION_KEY: 'fixture-encryption-key-for-tests' });
    expect(response.status).toBe(403);
  });

  it('does not authorize a valid session from another organization', async () => {
    db.sqlite.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, nama TEXT, email TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT, is_active INTEGER DEFAULT 1);
      CREATE TABLE sekolah (id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT, kop_surat_url TEXT, npsn TEXT, alamat TEXT);
      CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT);
      INSERT INTO users (id, nama, role, tenant_id) VALUES (1, 'Guru', 'user', 'other-organization');
      INSERT INTO sessions VALUES ('session-one', 1, datetime('now', '+1 day'));`);
    expect(await getCurrentUser(db as any, 'session-one')).toBeNull();
    db.sqlite.prepare('UPDATE users SET tenant_id = ? WHERE id = 1').run(DEFAULT_TENANT_ID);
    expect(await getCurrentUser(db as any, 'session-one')).toMatchObject({ id: 1, tenant_id: DEFAULT_TENANT_ID });
  });
});
