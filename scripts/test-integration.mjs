import { spawnSync } from 'node:child_process';
// Uses an owned temporary Miniflare database; never production bindings.
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/assessment-package-d1.integration.test.ts'], {
  stdio: 'inherit', env: { ...process.env, KKG_RUN_D1_INTEGRATION: '1' },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
