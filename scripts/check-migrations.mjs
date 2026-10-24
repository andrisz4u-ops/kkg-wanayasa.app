import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspectLocalSchema } from './dev-schema-check.mjs';

/** Exercise shipped names and SQL entirely in memory, never remote bindings. */
export async function verifyMigrations() {
  const names = readdirSync('migrations').filter(name => name.endsWith('.sql')).sort();
  if (!names.length || names.some(name => !/^\d{4}_[a-z0-9_]+\.sql$/.test(name))) throw new Error('Migration inventory invalid');
  const checkpoint = names.findIndex(name => name.startsWith('0028_'));
  if (checkpoint < 1) throw new Error('Historical upgrade checkpoint missing');
  const results = [];
  for (const mode of ['fresh', 'upgrade']) {
    const sqlite = new DatabaseSync(':memory:');
    try {
      sqlite.exec('PRAGMA foreign_keys=ON; CREATE TABLE d1_migrations(id INTEGER PRIMARY KEY, name TEXT UNIQUE);');
      const apply = name => {
        try { sqlite.exec(readFileSync(`migrations/${name}`, 'utf8')); sqlite.prepare('INSERT INTO d1_migrations(name) VALUES(?)').run(name); }
        catch (error) { throw new Error(`Migration ${name} failed in ${mode}`, { cause: error }); }
      };
      if (mode === 'upgrade') {
        names.slice(0, checkpoint).forEach(apply);
        sqlite.exec("INSERT INTO users(id,nama,email,password_hash,role) VALUES(900,'Migration Fixture','migration@fixture.invalid','fixture-only','user'); INSERT INTO sessions(id,user_id,expires_at) VALUES('migration-fixture',900,'2999-01-01 00:00:00');");
        names.slice(checkpoint).forEach(apply);
        if (sqlite.prepare('SELECT password_hash FROM users WHERE id=900').get()?.password_hash !== 'fixture-only' || !sqlite.prepare("SELECT id FROM sessions WHERE id='migration-fixture'").get()) throw new Error('Upgrade did not preserve historical rows');
      } else names.forEach(apply);
      const adapter = { prepare(sql) {
        let values = [];
        const statement = {
          bind(...args) { values = args; return statement; },
          async first() { return sqlite.prepare(sql).get(...values) || null; },
          async all() { return { results: sqlite.prepare(sql).all(...values) }; },
        };
        return statement;
      } };
      const missing = await inspectLocalSchema(adapter);
      if (missing.length) throw new Error(`Schema incomplete: ${missing.join(', ')}`);
      if (sqlite.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Foreign key check failed');
      if (sqlite.prepare('PRAGMA integrity_check').get()?.integrity_check !== 'ok') throw new Error('Integrity check failed');
      results.push({ mode, migrations: names.length, schema: 'ready', integrity: 'ok' });
    } finally { sqlite.close(); }
  }
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(await verifyMigrations(), null, 2)); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
