import { readdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wranglerBin = resolve(root, 'node_modules/wrangler/bin/wrangler.js');
const primaryDb = 'kkg-wanayasa-db';

console.log('🔄 [SYNC MASTER CURRICULUM] Reading master data from primary DB:', primaryDb);

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

// 1. Fetch master data from primary database
console.log('📖 Fetching Capaian Pembelajaran (CP)...');
const cpRes = runWrangler(
  ['d1', 'execute', primaryDb, '--remote', '--command', 'SELECT mata_pelajaran, fase, teks_cp, elemen_json, regulasi FROM capaian_pembelajaran;', '--json'],
  root,
  true
);
const cpRows = cpRes[0]?.results || [];
console.log(`   Found ${cpRows.length} CP master records.`);

console.log('📚 Fetching Curriculum Standard Chapters...');
const chapRes = runWrangler(
  ['d1', 'execute', primaryDb, '--remote', '--command', 'SELECT mata_pelajaran, jenjang_kelas, buku_judul, chapters_json, tahun_terbit, penerbit FROM curriculum_standard_chapters;', '--json'],
  root,
  true
);
const chapRows = chapRes[0]?.results || [];
console.log(`   Found ${chapRows.length} standard chapter records.`);

console.log('✉️ Fetching System Surat Templates...');
const suratRes = runWrangler(
  ['d1', 'execute', primaryDb, '--remote', '--command', 'SELECT nama, jenis, deskripsi, konten, variables, is_active FROM surat_templates WHERE created_by IS NULL;', '--json'],
  root,
  true
);
const suratRows = suratRes[0]?.results || [];
console.log(`   Found ${suratRows.length} system surat template records.`);

// 2. Discover target cluster installations
const installationsDir = resolve(root, 'installations');
const files = await readdir(installationsDir);
const targets = [];

for (const file of files) {
  if (file.endsWith('.json') && !file.includes('example')) {
    const raw = JSON.parse(await readFile(resolve(installationsDir, file), 'utf8'));
    targets.push(raw);
  }
}

console.log(`\n🎯 Targets found: ${targets.length} clusters (${targets.map(t => t.databaseName).join(', ')})`);

// 3. Build SQL Sync Script
const sqlLines = [];

// Sync CP
for (const cp of cpRows) {
  sqlLines.push(
    `INSERT INTO capaian_pembelajaran (mata_pelajaran, fase, teks_cp, elemen_json, regulasi) VALUES (${[
      literal(cp.mata_pelajaran),
      literal(cp.fase),
      literal(cp.teks_cp),
      literal(cp.elemen_json),
      literal(cp.regulasi),
    ].join(',')}) ON CONFLICT(mata_pelajaran, fase) DO UPDATE SET teks_cp=excluded.teks_cp, elemen_json=excluded.elemen_json, regulasi=excluded.regulasi, updated_at=CURRENT_TIMESTAMP;`
  );
}

// Sync Chapters (Delete existing standard chapters then re-insert to avoid duplicate titles)
sqlLines.push('DELETE FROM curriculum_standard_chapters;');
for (const ch of chapRows) {
  sqlLines.push(
    `INSERT INTO curriculum_standard_chapters (mata_pelajaran, jenjang_kelas, buku_judul, chapters_json, tahun_terbit, penerbit) VALUES (${[
      literal(ch.mata_pelajaran),
      literal(ch.jenjang_kelas),
      literal(ch.buku_judul),
      literal(ch.chapters_json),
      ch.tahun_terbit ?? 'NULL',
      literal(ch.penerbit),
    ].join(',')});`
  );
}

// Sync Surat Templates
for (const st of suratRows) {
  sqlLines.push(
    `INSERT INTO surat_templates (nama, jenis, deskripsi, konten, variables, is_active, created_by) SELECT ${[
      literal(st.nama),
      literal(st.jenis),
      literal(st.deskripsi),
      literal(st.konten),
      literal(st.variables),
      st.is_active ?? 1,
      'NULL',
    ].join(',')} WHERE NOT EXISTS (SELECT 1 FROM surat_templates WHERE nama=${literal(st.nama)} AND created_by IS NULL);`
  );
}

const syncSql = sqlLines.join('\n');
const tmpDir = await mkdtemp(resolve(tmpdir(), 'kkg-sync-'));
const tmpFile = resolve(tmpDir, 'sync.sql');
await writeFile(tmpFile, syncSql, 'utf8');

// 4. Apply to each cluster
try {
  for (const t of targets) {
    console.log(`\n🚀 Applying sync to ${t.slug} (${t.databaseName})...`);
    runWrangler(['d1', 'execute', t.databaseName, '--remote', '--file', tmpFile]);
    console.log(`   ✅ Synced ${t.databaseName}`);
  }
} finally {
  await rm(tmpDir, { recursive: true, force: true });
}

console.log('\n✨ [CURRICULUM SYNC COMPLETE] All clusters are up to date with master curriculum!');
