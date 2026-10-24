import { readdirSync, readFileSync } from 'node:fs';
import { SqliteD1 } from './sqlite-d1';

/** Fresh current schema, using the shipped migrations rather than a second schema. */
export function migratedDatabase() {
  const db = new SqliteD1();
  try {
    db.sqlite.exec('PRAGMA foreign_keys=ON');
    for (const name of readdirSync('migrations').filter(name => name.endsWith('.sql')).sort()) {
      try { db.sqlite.exec(readFileSync(`migrations/${name}`, 'utf8')); }
      catch (error) { throw new Error(`Migration failed: ${name}`, { cause: error }); }
    }
    return db;
  } catch (error) { db.close(); throw error; }
}
