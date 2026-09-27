#!/usr/bin/env node
/**
 * scripts/check-secrets.mjs
 * Pre-commit / CI Guard: Mendeteksi dan mencegah kebocoran API Key dan Secret Tokens ke Git.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SECRET_PATTERNS = [
  {
    name: 'Supabase Service Role JWT Key',
    regex: /eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
    exclude: /placeholder|dummy|example|mock/i
  },
  {
    name: 'Google API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/g,
    exclude: /placeholder|dummy|example|mock/i
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{50,})/g,
    exclude: /placeholder/i
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
    exclude: null
  },
  {
    name: 'OpenAI / Claude Secret Key',
    regex: /sk-(?:live|ant|proj)?[a-zA-Z0-9_-]{32,}/g,
    exclude: /placeholder|dummy/i
  }
];

const IGNORED_FILES = [
  'package-lock.json',
  'scripts/check-secrets.mjs',
  '.git',
  'node_modules',
  'dist'
];

function getStagedOrTargetFiles() {
  try {
    // Coba ambil file yang sedang di-stage untuk git commit
    const staged = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (staged.length > 0) return staged;
  } catch (e) {
    // Abaikan jika bukan git repository atau gagal
  }

  // Jika tidak ada staged files, periksa file-file penting konfigurasi
  return ['wrangler.jsonc'];
}

function scanFile(filePath) {
  if (IGNORED_FILES.some(ign => filePath.includes(ign))) return [];
  if (!fs.existsSync(filePath)) return [];

  // Khusus wrangler.jsonc: cek jika vars memuat nama secret berbahaya
  if (filePath.endsWith('wrangler.jsonc') || filePath.endsWith('wrangler.json')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dangerousVars = ['SUPABASE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SECRET_KEY', 'PRIVATE_KEY', 'API_KEY'];
    for (const dVar of dangerousVars) {
      if (new RegExp(`"${dVar}"\\s*:`, 'i').test(content)) {
        return [{
          file: filePath,
          pattern: `Wrangler vars memuat secret key (${dVar})! Gunakan 'npx wrangler secret put' atau file lokal '.dev.vars'.`,
          line: 1
        }];
      }
    }
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory() || stat.size > 2 * 1024 * 1024) return []; // Lewati file biner > 2MB

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];
    for (const pat of SECRET_PATTERNS) {
      const matches = line.match(pat.regex);
      if (matches) {
        for (const m of matches) {
          if (pat.exclude && pat.exclude.test(line)) continue;
          // Lewati jika ini adalah placeholder dokumentasi atau template
          if (line.includes('your-secret') || line.includes('xxx') || line.includes('placeholder')) continue;

          findings.push({
            file: filePath,
            pattern: pat.name,
            line: lIdx + 1,
            snippet: m.slice(0, 12) + '...' + m.slice(-6)
          });
        }
      }
    }
  }

  return findings;
}

function main() {
  const files = getStagedOrTargetFiles();
  let totalFindings = [];

  for (const f of files) {
    const fFindings = scanFile(f);
    if (fFindings.length > 0) {
      totalFindings.push(...fFindings);
    }
  }

  if (totalFindings.length > 0) {
    console.error('\n\x1b[41m\x1b[37m[SECURITY GUARD] TERDETEKSI SECRET / API KEY BERBAHAYA!\x1b[0m');
    console.error('Commit DIBATALKAN untuk mencegah kebocoran kredensial ke GitHub:\n');
    totalFindings.forEach(f => {
      console.error(`  - \x1b[33m${f.file}:${f.line}\x1b[0m -> \x1b[31m${f.pattern}\x1b[0m`);
      if (f.snippet) console.error(`    Teks: ${f.snippet}`);
    });
    console.error('\n\x1b[36mSolusi:\x1b[0m');
    console.error('1. Hapus secret dari file kode / konfigurasi.');
    console.error('2. Simpan secret di Cloudflare menggunakan: npx wrangler secret put <NAME>');
    console.error('3. Untuk pengujian lokal, gunakan file .dev.vars (pastikan tercantum di .gitignore).\n');
    process.exit(1);
  }

  console.log('\x1b[32m[Security Guard] OK: Tidak ditemukan secret atau API key terlarang.\x1b[0m');
  process.exit(0);
}

main();
