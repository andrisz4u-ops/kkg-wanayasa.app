// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import app from '../src/index';
import admin from '../src/routes/admin';
import { validateEnv } from '../src/lib/env';
import { encrypt, decrypt, isEncrypted } from '../src/lib/crypto';
import { AIService } from '../src/services/ai';
import { migratedDatabase } from './helpers/migrated-db';

const key = 'fixture-encryption-material-for-unit-tests';
afterEach(() => { vi.restoreAllMocks(); });

describe('environment validation', () => {
  it('allows core services without optional provider encryption and normalizes empty values', () => {
    expect(validateEnv({})).toMatchObject({ ok: true, env: { ENVIRONMENT: 'production' } });
    expect(validateEnv({ ENVIRONMENT: 'production' }).ok).toBe(true);
    expect(validateEnv({ ENVIRONMENT: 'staging' }).ok).toBe(true);
    expect(validateEnv({ ENCRYPTION_KEY: key, SECRET_KEY: '', SENTRY_DSN: '' })).toMatchObject({ ok: true, env: { ENVIRONMENT: 'production', SECRET_KEY: undefined } });
    expect(validateEnv({ ENVIRONMENT: 'development', SECRET_KEY: '' }).ok).toBe(true);
    expect(validateEnv({ ENCRYPTION_KEY: ' '.repeat(32) }).ok).toBe(false);
  });

  it('returns a generic no-store 503 before accessing a database on invalid configuration', async () => {
    const prepare = vi.fn();
    const response = await app.request('/api/health', {}, { DB: { prepare } as any, R2_PUBLIC_URL: 'fixture-private-value' });
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).not.toContain('fixture-private-value');
    expect(prepare).not.toHaveBeenCalled();
  });

  it('preserves original service bindings and normalizes the selected environment', async () => {
    const first = vi.fn(async () => ({ ok: 1 }));
    const response = await app.request('/api/health', {}, { DB: { prepare: () => ({ first }) } as any, ENCRYPTION_KEY: key, AI: { run() {} } });
    expect(response.status).toBe(200);
    expect(first).toHaveBeenCalledOnce();
    expect(await response.json()).toMatchObject({ data: { environment: 'production' } });
  });

  it('serves the actual production landing page and reports feature readiness without an encryption key', async () => {
    const db = migratedDatabase();
    try {
      const env = { DB: db as any, ENVIRONMENT: 'production', R2_PUBLIC_URL: 'https://cdn.fixture.invalid' };
      const home = await app.request('/', {}, env);
      expect(home.status).toBe(200);
      expect(home.headers.get('content-type')).toContain('text/html');
      const health = await app.request('/api/health', {}, env);
      expect(health.status).toBe(200);
      expect(await health.json()).toMatchObject({ data: { status: 'degraded', database: true, features: { credential_encryption: false } } });
      await expect(encrypt('fixture-provider-credential', env)).rejects.toMatchObject({ code: 'ENCRYPTION_KEY_REQUIRED' });
    } finally { db.close(); }
  });

  it('keeps production login and R2 uploads working while credential writes fail closed', async () => {
    const db = migratedDatabase();
    try {
      const { hashPassword } = await import('../src/lib/auth');
      const hash = await hashPassword('FixturePassword123');
      db.sqlite.prepare("INSERT INTO users(id,nama,email,password_hash,role,role_label,is_approved) VALUES(900,'Admin','core@fixture.invalid',?,'admin','admin',1)").run(hash);
      const put = vi.fn(async () => ({}));
      const env = { DB: db as any, ENVIRONMENT: 'production', STORAGE: { put } as any, R2_PUBLIC_URL: 'https://cdn.fixture.invalid' };
      const login = await app.request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'core@fixture.invalid', password: 'FixturePassword123' }) }, env);
      expect(login.status).toBe(200);
      const cookies = login.headers.getSetCookie().flatMap(value => value.split(/,\s*(?=[^;,\s]+=[^;]*)/)).map(value => value.split(';')[0]).join('; ');
      const token = cookies.match(/csrf_token=([^;]+)/)![1];
      const form = new FormData();
      form.set('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'fixture.png', { type: 'image/png' }));
      const upload = await app.request('/api/files/upload', { method: 'POST', headers: { Cookie: cookies, 'X-CSRF-Token': token }, body: form }, env);
      expect(upload.status).toBe(201); expect(put).toHaveBeenCalledOnce();
      const provider = await app.request('/api/admin/ai-providers', { method: 'POST', headers: { Cookie: cookies, 'X-CSRF-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Fixture', slug: 'core-fixture', api_type: 'openai_compat', base_url: 'https://provider.fixture.invalid', model: 'fixture', api_key: 'fixture-provider-credential' }) }, env);
      expect(provider.status).toBe(503);
      expect(await provider.json()).toMatchObject({ error: { code: 'ENCRYPTION_KEY_REQUIRED' } });
      expect(db.sqlite.prepare("SELECT id FROM ai_providers WHERE slug='core-fixture'").get()).toBeUndefined();
    } finally { db.close(); }
  });
});

describe('encrypted provider credentials', () => {
  it('round-trips the existing ciphertext format and never treats failed decryption as empty', async () => {
    const encrypted = await encrypt('fixture-provider-credential', { ENCRYPTION_KEY: key });
    expect(isEncrypted(encrypted)).toBe(true);
    expect(await decrypt(encrypted, { ENCRYPTION_KEY: key })).toBe('fixture-provider-credential');
    await expect(decrypt(encrypted, {})).rejects.toMatchObject({ code: 'ENCRYPTION_KEY_REQUIRED' });
    await expect(decrypt(encrypted, { ENCRYPTION_KEY: 'different-fixture-encryption-material' })).rejects.toMatchObject({ code: 'DECRYPT_FAILED' });
    expect(await decrypt('legacy-plaintext-fixture', {})).toBe('legacy-plaintext-fixture');
  });

  it('does not overwrite ciphertext when masked-provider reconciliation cannot decrypt it', async () => {
    const db = migratedDatabase();
    try {
      const encrypted = await encrypt('fixture-provider-credential', { ENCRYPTION_KEY: key });
      db.sqlite.exec("INSERT INTO users(id,nama,email,password_hash,role,role_label,is_approved) VALUES(900,'Admin','admin@fixture.invalid','x','admin','admin',1); INSERT INTO sessions(id,user_id,expires_at) VALUES('fixture-session',900,datetime('now','+1 day'));");
      db.sqlite.prepare("INSERT INTO ai_providers(id,name,slug,api_type,base_url,model,api_key) VALUES(900,'Fixture','fixture','openai_compat','https://provider.invalid','fixture',?)").run(encrypted);
      const protectedApp = new Hono().route('/api/admin', admin);
      const response = await protectedApp.request('/api/admin/ai-providers/900', { method: 'PUT', headers: { Cookie: 'session=fixture-session', 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: 'fixt****tial' }) }, { DB: db as any, ENCRYPTION_KEY: 'wrong-fixture-encryption-material' });
      expect(response.status).toBe(503);
      expect(db.sqlite.prepare('SELECT api_key FROM ai_providers WHERE id=900').get()?.api_key).toBe(encrypted);
    } finally { db.close(); }
  });

  it('does not send unreadable ciphertext to any AI provider', async () => {
    const encrypted = await encrypt('fixture-provider-credential', { ENCRYPTION_KEY: key });
    const fetcher = vi.spyOn(globalThis, 'fetch');
    const ai = new AIService({ ENCRYPTION_KEY: 'wrong-fixture-encryption-material' });
    await expect(ai.loadProviders({ prepare: () => ({ all: async () => ({ results: [{ api_key: encrypted }] }) }) } as any)).rejects.toMatchObject({ code: 'DECRYPT_FAILED' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not apply create-schema defaults to omitted provider update fields', async () => {
    const db = migratedDatabase();
    try {
      const encrypted = await encrypt('fixture-provider-credential', { ENCRYPTION_KEY: key });
      db.sqlite.exec("INSERT INTO users(id,nama,email,password_hash,role,role_label,is_approved) VALUES(900,'Admin','admin@fixture.invalid','x','admin','admin',1); INSERT INTO sessions(id,user_id,expires_at) VALUES('fixture-session',900,datetime('now','+1 day'));");
      db.sqlite.prepare("INSERT INTO ai_providers(id,name,slug,api_type,base_url,model,api_key,max_tokens,priority,is_active) VALUES(900,'Fixture','fixture','openai_compat','https://provider.invalid','fixture',?,1024,9,0)").run(encrypted);
      const response = await new Hono().route('/api/admin', admin).request('/api/admin/ai-providers/900', { method: 'PUT', headers: { Cookie: 'session=fixture-session', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Renamed' }) }, { DB: db as any, ENCRYPTION_KEY: key });
      expect(response.status).toBe(200);
      expect(db.sqlite.prepare('SELECT api_key,max_tokens,priority,is_active FROM ai_providers WHERE id=900').get()).toMatchObject({ api_key: encrypted, max_tokens: 1024, priority: 9, is_active: 0 });
    } finally { db.close(); }
  });
});
