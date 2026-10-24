// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import auth from '../src/routes/auth';
import { verifyPassword } from '../src/lib/auth';
import { resetRateLimits } from '../src/lib/ratelimit';
import { migratedDatabase } from './helpers/migrated-db';

const password = 'LegacyFixturePassword123';
const legacyHash = createHash('sha256').update(password).digest('hex');
let db: ReturnType<typeof migratedDatabase>;
beforeEach(() => {
  resetRateLimits(); db = migratedDatabase();
  db.sqlite.prepare("INSERT INTO users(id,nama,email,password_hash,role,is_approved) VALUES(900,'Guru','legacy@fixture.invalid',?,'user',1)").run(legacyHash);
});
afterEach(() => { db.close(); vi.restoreAllMocks(); });
const login = (database: any = db, suppliedPassword = password) => new Hono().route('/auth', auth).request('/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'legacy@fixture.invalid', password: suppliedPassword }),
}, { DB: database });

describe('legacy password migration', () => {
  it('upgrades on successful login and keeps subsequent logins working', async () => {
    expect((await login()).status).toBe(200);
    const stored = String(db.sqlite.prepare('SELECT password_hash FROM users WHERE id=900').get()?.password_hash);
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(await verifyPassword(password, stored)).toBe(true);
    expect((await login()).status).toBe(200);
  });

  it('does not rewrite the hash or issue a session for an incorrect password', async () => {
    expect((await login(db, 'WrongFixturePassword123')).status).toBe(401);
    expect(db.sqlite.prepare('SELECT password_hash FROM users WHERE id=900').get()?.password_hash).toBe(legacyHash);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get()?.n).toBe(0);
  });

  it('does not replace a password reset that wins the compare-and-set race', async () => {
    const replacement = createHash('sha256').update('NewFixturePassword123').digest('hex');
    const racedDb = {
      prepare(sql: string) {
        const statement = db.prepare(sql);
        if (sql.startsWith('UPDATE users SET password_hash = ? WHERE')) {
          const run = statement.run;
          statement.run = async () => {
            db.sqlite.prepare('UPDATE users SET password_hash=? WHERE id=900').run(replacement);
            return run();
          };
        }
        return statement;
      },
    };
    expect((await login(racedDb)).status).toBe(401);
    expect(db.sqlite.prepare('SELECT password_hash FROM users WHERE id=900').get()?.password_hash).toBe(replacement);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get()?.n).toBe(0);
  });
});
