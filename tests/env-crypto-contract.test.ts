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
  it('requires a key outside explicit development and normalizes empty optional values', () => {
    expect(validateEnv({}).ok).toBe(false);
    expect(validateEnv({ ENVIRONMENT: 'production' }).ok).toBe(false);
    expect(validateEnv({ ENVIRONMENT: 'staging' }).ok).toBe(false);
    expect(validateEnv({ ENCRYPTION_KEY: key, SECRET_KEY: '', SENTRY_DSN: '' })).toMatchObject({ ok: true, env: { ENVIRONMENT: 'production', SECRET_KEY: undefined } });
    expect(validateEnv({ ENVIRONMENT: 'development', SECRET_KEY: '' }).ok).toBe(true);
    expect(validateEnv({ ENCRYPTION_KEY: ' '.repeat(32) }).ok).toBe(false);
  });

  it('returns a generic no-store 503 before accessing a database on invalid configuration', async () => {
    const prepare = vi.fn();
    const response = await app.request('/api/health', {}, { DB: { prepare } as any, SUPABASE_URL: 'fixture-private-value' });
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
