import { readdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wranglerBin = resolve(root, 'node_modules/wrangler/bin/wrangler.js');
const primaryDb = 'kkg-wanayasa-db';

console.log('🤖 [SYNC AI PROVIDERS] Fetching active providers from primary DB:', primaryDb);

function runWrangler(args, cwd = root, json = false) {
  const res = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: process.env,
  });
  if (res.status !== 0) {
    throw new Error(`Wrangler error: ${res.stderr || res.stdout}`);
  }
  if (json) {
    const jsonStart = res.stdout.search(/[{\[]/);
    if (jsonStart === -1) throw new Error('No JSON output from wrangler command');
    const jsonEnd = Math.max(res.stdout.lastIndexOf('}'), res.stdout.lastIndexOf(']'));
    return JSON.parse(res.stdout.slice(jsonStart, jsonEnd + 1));
  }
  return res.stdout;
}

const literal = val => (val == null ? 'NULL' : `'${String(val).replaceAll("'", "''")}'`);

// 1. Fetch active providers from primary
const query = `SELECT name, slug, api_type, base_url, model, api_key, priority, is_active, max_tokens, temperature, extra_headers, extra_body, capability FROM ai_providers WHERE is_active = 1;`;
const res = runWrangler(['d1', 'execute', primaryDb, '--remote', '--command', query, '--json'], root, true);
const providers = res[0]?.results || [];

console.log(`   Found ${providers.length} active AI providers in primary database.`);
providers.forEach(p => console.log(`   -> [${p.api_type}] ${p.name} (${p.model})`));

// 2. Discover target databases
const installationsDir = resolve(root, 'installations');
const files = await readdir(installationsDir);
const targets = [];

for (const file of files) {
  if (file.endsWith('.json') && !file.includes('example')) {
    const raw = JSON.parse(await readFile(resolve(installationsDir, file), 'utf8'));
    targets.push(raw);
  }
}

// 3. Build Sync SQL
const sqlLines = [
  'DELETE FROM ai_providers;',
  ...providers.map(p => `INSERT INTO ai_providers (name, slug, api_type, base_url, model, api_key, priority, is_active, max_tokens, temperature, extra_headers, extra_body, capability) VALUES (${[
    literal(p.name),
    literal(p.slug),
    literal(p.api_type),
    literal(p.base_url),
    literal(p.model),
    literal(p.api_key),
    p.priority ?? 100,
    p.is_active ?? 1,
    p.max_tokens ?? 8192,
    p.temperature ?? 0.7,
    literal(p.extra_headers || '{}'),
    literal(p.extra_body || '{}'),
    literal(p.capability || 'text'),
  ].join(',')});`)
];

const syncSql = sqlLines.join('\n');
const tmpDir = await mkdtemp(resolve(tmpdir(), 'kkg-ai-sync-'));
const tmpFile = resolve(tmpDir, 'sync-ai.sql');
await writeFile(tmpFile, syncSql, { mode: 0o600, encoding: 'utf8' });

try {
  for (const t of targets) {
    console.log(`\n🚀 Applying AI providers to ${t.slug} (${t.databaseName})...`);
    runWrangler(['d1', 'execute', t.databaseName, '--remote', '--file', tmpFile]);
    console.log(`   ✅ Synced ${providers.length} AI providers to ${t.databaseName}`);
  }
} finally {
  await rm(tmpDir, { recursive: true, force: true });
}

console.log('\n✨ [AI SYNC COMPLETE] All fleet databases now have active AI providers!');
