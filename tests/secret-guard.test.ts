// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error CLI module is tested through its runtime exports.
import { isIgnoredPath, scanContent, scanRepository } from '../scripts/check-secrets.mjs';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const fixtureToken = () => 'ghp_' + 'A'.repeat(36);

describe('secret guard coverage', () => {
  it('does not confuse .github or district with ignored directory segments', () => {
    expect(isIgnoredPath('.github/workflows/verify.yml')).toBe(false);
    expect(isIgnoredPath('src/district/key.ts')).toBe(false);
    expect(isIgnoredPath('node_modules/library/index.js')).toBe(true);
    expect(isIgnoredPath('dist/_worker.js')).toBe(true);
  });

  it('does not exempt an entire line merely because it says example or mock', () => {
    const findings = scanContent('fixture.md', `example mock: ${fixtureToken()}`);
    expect(findings).toHaveLength(1);
    expect(JSON.stringify(findings)).not.toContain(fixtureToken());
    expect(scanContent('wrangler.preview.jsonc', '"ENCRYPTION_KEY": "fixture-value"')).toHaveLength(1);
  });

  it('examines workflows, untracked files, and staged bytes rather than later edits', () => {
    const root = mkdtempSync(join(tmpdir(), 'opencode', 'kkg-secret-guard-')); roots.push(root);
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
    const file = join(root, '.github', 'workflows', 'fixture.yml');
    writeFileSync(file, `token: ${fixtureToken()}`);
    expect(scanRepository({ cwd: root }).findings).toHaveLength(1);
    execFileSync('git', ['add', '.github/workflows/fixture.yml'], { cwd: root });
    writeFileSync(file, 'token: redacted');
    expect(scanRepository({ cwd: root }).findings).toHaveLength(0);
    expect(scanRepository({ cwd: root, staged: true }).findings).toHaveLength(1);
  });

  it('fails explicitly outside a git repository', () => {
    const root = mkdtempSync(join(tmpdir(), 'opencode', 'kkg-not-git-')); roots.push(root);
    expect(() => scanRepository({ cwd: root })).toThrow();
  });
});
