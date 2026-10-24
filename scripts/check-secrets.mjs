#!/usr/bin/env node
// Working-tree or staged-index guard. This is not a Git-history scanner.
import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const patterns = [
  ['JWT credential', /eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g],
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/g],
  ['GitHub token', /(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{50,})/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g],
  ['Provider secret', /sk-(?:live|ant|proj)?[a-zA-Z0-9_-]{32,}/g],
];
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', '.wrangler', 'coverage', 'graphify-out']);
const maxBytes = 64 * 1024 * 1024;

export function isIgnoredPath(file) {
  return file.replaceAll('\\', '/').split('/').slice(0, -1).some(part => ignoredDirectories.has(part));
}

export function scanContent(file, content) {
  const findings = [];
  const wrangler = /^wrangler(?:[.-][^.]+)*\.jsonc?$/.test(basename(file));
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    for (const [name, pattern] of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) findings.push({ file, line: index + 1, pattern: name });
    }
    if (wrangler) {
      const property = line.match(/"([A-Z][A-Z0-9_]*)"\s*:/);
      if (property && /(?:^|_)(?:KEYS?|TOKEN|SECRET)(?:_|$)/.test(property[1])) {
        findings.push({ file, line: index + 1, pattern: `Secret binding ${property[1]} in Wrangler JSON; use Pages secrets` });
      }
    }
  }
  return findings; // Never return token bytes or previews.
}

export function scanRepository({ cwd = process.cwd(), staged = false } = {}) {
  const git = (args, encoding = 'utf8') => execFileSync('git', args, { cwd, encoding, maxBuffer: maxBytes });
  const names = git(staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
    : ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
  const files = [...new Set(names)].filter(file => !isIgnoredPath(file));
  const findings = [];
  let scanned = 0, binary = 0;
  for (const file of files) {
    let bytes;
    if (staged) {
      bytes = git(['show', `:${file}`], null); // Inspect the index, not unstaged edits.
    } else {
      let stat;
      try { stat = lstatSync(resolve(cwd, file)); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      if (stat.isSymbolicLink()) throw new Error(`Symlink needs explicit review: ${file}`);
      if (!stat.isFile()) continue;
      if (stat.size > maxBytes) throw new Error(`File exceeds scan budget: ${file}`);
      bytes = readFileSync(resolve(cwd, file));
    }
    if (bytes.subarray(0, 8192).includes(0)) { binary++; continue; }
    findings.push(...scanContent(file, bytes.toString('utf8')));
    scanned++;
  }
  return { findings, scanned, binary, scope: staged ? 'staged-index' : 'working-tree', historyScanned: false };
}

function main() {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => !['--staged', '--full-scan'].includes(arg)) || args.length > 1) throw new Error('Use --full-scan or --staged');
    const result = scanRepository({ staged: args.includes('--staged') });
    console.log(`[Security Guard] scope=${result.scope}; text=${result.scanned}; binary-skipped=${result.binary}; history=not-scanned`);
    for (const finding of result.findings) console.error(`${finding.file}:${finding.line}: ${finding.pattern}`);
    if (result.findings.length) {
      console.error('Kredensial terdeteksi. Simpan melalui Pages secrets atau .dev.vars; jangan menambahkan pengecualian baris umum.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`[Security Guard] Scan incomplete: ${error.message}`);
    process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
