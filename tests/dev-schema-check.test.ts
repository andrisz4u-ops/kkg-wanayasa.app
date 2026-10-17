import { describe, expect, it, vi } from 'vitest';
import { assertLocalSchemaReady, REQUIRED_LOCAL_SCHEMA, runIfLocalSchemaReady, type LocalSchemaStatement } from '../scripts/dev-schema-check.mjs';

class FakeLocalD1 {
  readonly tables = new Map(Object.entries(REQUIRED_LOCAL_SCHEMA).map(([table, columns]) => [table, new Set(columns)]));
  hasCounterSeed = true;
  failOnPrepare?: Error;

  prepare(sql: string) {
    if (this.failOnPrepare) throw this.failOnPrepare;
    let boundTable = '';
    const statement: LocalSchemaStatement = {
      bind: (...values: unknown[]) => {
        const table = values[0];
        if (typeof table === 'string') boundTable = table;
        return statement;
      },
      first: async () => sql.includes('sqlite_schema')
        ? this.tables.has(boundTable) ? { name: boundTable } : null
        : this.hasCounterSeed ? { singleton_id: 1 } : null,
      all: async () => {
        const match = sql.match(/^PRAGMA table_info\('([^']+)'\)$/);
        const columns = match ? this.tables.get(match[1]) : undefined;
        return { results: [...(columns || [])].map(name => ({ name })) };
      },
    };
    return statement;
  }
}

function fakeProxyFactory(db: FakeLocalD1) {
  const dispose = vi.fn(async () => {});
  const factory = vi.fn(async (_options: { configPath: string; remoteBindings: false; envFiles: [] }) => ({ env: { DB: db }, dispose }));
  return { factory, dispose };
}

describe('local development schema readiness guard', () => {
  it('accepts complete migrated schema and disposes the local platform proxy', async () => {
    const db = new FakeLocalD1();
    const { factory, dispose } = fakeProxyFactory(db);

    await expect(assertLocalSchemaReady({ getPlatformProxy: factory, configPath: 'wrangler.jsonc' })).resolves.toBeUndefined();

    expect(factory).toHaveBeenCalledWith({ configPath: 'wrangler.jsonc', remoteBindings: false, envFiles: [] });
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('reports missing admission, drafts, and classification columns rather than trusting migration history', async () => {
    const db = new FakeLocalD1();
    db.tables.delete('ai_user_admission');
    db.tables.delete('document_drafts');
    db.tables.get('ai_generation_logs')?.delete('classification_quality');
    const { factory, dispose } = fakeProxyFactory(db);

    await expect(assertLocalSchemaReady({ getPlatformProxy: factory, configPath: 'wrangler.jsonc' })).rejects.toMatchObject({
      missing: expect.arrayContaining([
        'ai_user_admission (tabel)',
        'document_drafts (tabel)',
        'ai_generation_logs.classification_quality',
      ]),
    });
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('requires the certificate issuance singleton and preserves schema inspection errors', async () => {
    const seededDb = new FakeLocalD1();
    seededDb.hasCounterSeed = false;
    await expect(assertLocalSchemaReady({ getPlatformProxy: fakeProxyFactory(seededDb).factory, configPath: 'wrangler.jsonc' }))
      .rejects.toMatchObject({ missing: expect.arrayContaining(['certificate_issuance_counter singleton_id=1 (seed)']) });

    const inspectionDb = new FakeLocalD1();
    const failure = new Error('local sqlite inspection failed');
    inspectionDb.failOnPrepare = failure;
    const { factory, dispose } = fakeProxyFactory(inspectionDb);
    await expect(assertLocalSchemaReady({ getPlatformProxy: factory, configPath: 'wrangler.jsonc' })).rejects.toBe(failure);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('does not start build or watchers when schema validation fails', async () => {
    const db = new FakeLocalD1();
    db.tables.delete('ai_user_admission');
    const { factory } = fakeProxyFactory(db);
    const startDev = vi.fn(async () => {});
    const logger = { error: vi.fn() };

    await expect(runIfLocalSchemaReady({ getPlatformProxy: factory, configPath: 'wrangler.jsonc', logger }, startDev)).resolves.toBe(false);

    expect(startDev).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('npm run db:migrate:local'));
  });
});
