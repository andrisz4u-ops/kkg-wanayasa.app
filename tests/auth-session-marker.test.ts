// @vitest-environment node
// Cookie header assertions need undici's getSetCookie; happy-dom's Headers
// implementation drops/merges Set-Cookie unreliably. No DOM is used here.
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import auth from '../src/routes/auth';
import { hashPassword } from '../src/lib/auth';
import { SqliteD1 } from './helpers/sqlite-d1';

let db: SqliteD1;
let app: Hono;

const getSetCookies = (res: Response): string[] => {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  const raw = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
  // Hono's test client may comma-join multiple Set-Cookie values into one entry;
  // split only on boundaries that start a new cookie (name=...), so attribute
  // values containing commas (e.g. Expires dates) are never split.
  return raw.flatMap(entry => entry.split(/,\s*(?=[^;,\s]+=[^;]*)/).map(s => s.trim()));
};

beforeEach(async () => {
  db = new SqliteD1();
  db.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, email TEXT, password_hash TEXT, nama TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, is_approved INTEGER, sekolah_id INTEGER, tenant_id TEXT);
    CREATE TABLE sekolah(id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT, kop_surat_url TEXT, npsn TEXT, alamat TEXT);
    CREATE TABLE sessions(id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT);
    CREATE TABLE audit_logs(id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT, entity_type TEXT, entity_id TEXT, details TEXT, ip_address TEXT, user_agent TEXT);`);
  const password_hash = await hashPassword('Rahasia123');
  db.sqlite.prepare(`INSERT INTO users(id, email, password_hash, nama, role, is_approved) VALUES(1, 'guru@example.test', ?, 'Guru A', 'user', 1)`).run(password_hash);
  app = new Hono().route('/api/auth', auth);
});

afterEach(() => { db.close(); });

const request = (url: string, options?: RequestInit) => app.request(url, options, { DB: db });

describe('UI-only login marker cookie', () => {
  it('sets kkg_logged_in=1 (readable by JS) on successful login', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'guru@example.test', password: 'Rahasia123' }),
    });
    expect(res.status).toBe(200);
    const cookies = getSetCookies(res);
    const marker = cookies.find(c => c.startsWith('kkg_logged_in=1'));
    expect(marker).toBeDefined();
    expect(marker).toContain('Path=/');
    expect(marker).toContain('Max-Age=');
    expect(marker).not.toContain('HttpOnly');
    expect(cookies.some(c => c.startsWith('session=') && c.includes('HttpOnly'))).toBe(true);
  });

  it('clears the marker on logout', async () => {
    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'guru@example.test', password: 'Rahasia123' }),
    });
    const sessionCookie = getSetCookies(login).find(c => c.startsWith('session='))!.split(';')[0];
    const res = await request('/api/auth/logout', { method: 'POST', headers: { Cookie: sessionCookie } });
    expect(res.status).toBe(200);
    expect(getSetCookies(res).some(c => c.startsWith('kkg_logged_in=') && c.includes('Max-Age=0'))).toBe(true);
  });

  it('clears the marker when /me finds a dead session', async () => {
    const res = await request('/api/auth/me', { headers: { Cookie: 'session=dead; kkg_logged_in=1' } });
    expect(res.status).toBe(401);
    expect(getSetCookies(res).some(c => c.startsWith('kkg_logged_in=') && c.includes('Max-Age=0'))).toBe(true);
  });

  it('refreshes the marker on valid /me so pre-fix sessions self-heal', async () => {
    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'guru@example.test', password: 'Rahasia123' }),
    });
    const sessionCookie = getSetCookies(login).find(c => c.startsWith('session='))!.split(';')[0];
    // Browser logged in before the marker shipped: valid session, no marker yet.
    const res = await request('/api/auth/me', { headers: { Cookie: sessionCookie } });
    expect(res.status).toBe(200);
    const marker = getSetCookies(res).find(c => c.startsWith('kkg_logged_in=1'));
    expect(marker).toBeDefined();
    expect(marker).toContain('Path=/');
    expect(marker).not.toContain('HttpOnly');
  });
});
