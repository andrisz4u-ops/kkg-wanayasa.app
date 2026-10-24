// @vitest-environment node
import { expect, it } from 'vitest';
// @ts-expect-error This script is exercised using its runtime entry point.
import { verifyMigrations } from '../scripts/check-migrations.mjs';

it('applies every original migration name from empty and preserves data during a historical upgrade', async () => {
  const results = await verifyMigrations();
  expect(results).toEqual([
    { mode: 'fresh', migrations: expect.any(Number), schema: 'ready', integrity: 'ok' },
    { mode: 'upgrade', migrations: expect.any(Number), schema: 'ready', integrity: 'ok' },
  ]);
  expect(results[0].migrations).toBeGreaterThanOrEqual(45);
  expect(results[1].migrations).toBe(results[0].migrations);
});
