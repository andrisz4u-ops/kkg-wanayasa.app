import { DatabaseSync } from 'node:sqlite';

export class SqliteD1 {
  readonly sqlite = new DatabaseSync(':memory:');
  prepare(sql: string) {
    const db = this.sqlite;
    let values: any[] = [];
    const statement = {
      bind(...args: any[]) { values = args; return statement; },
      async first(column?: string) {
        const row = db.prepare(sql).get(...values);
        return row ? column ? row[column] : row : null;
      },
      async all() { return { results: db.prepare(sql).all(...values), success: true, meta: {} }; },
      async run() { return statement.execute(); },
      execute() {
        const result = db.prepare(sql).run(...values);
        return { success: true, results: [], meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
      },
    };
    return statement;
  }
  async batch(statements: any[]) {
    this.sqlite.exec('BEGIN');
    try {
      const results = statements.map(statement => statement.execute());
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
  close() { this.sqlite.close(); }
}
