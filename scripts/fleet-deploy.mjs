import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseInstallation, makeWranglerConfig } from './installation-config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wranglerBin = resolve(root, 'node_modules/wrangler/bin/wrangler.js');

const shouldMigrate = process.argv.includes('--migrate');

console.log('🚀 [FLEET DEPLOY] Starting fleet build and deployment...');

// 1. Build project once
console.log('\n📦 [1/3] Building application bundle...');
const buildResult = spawnSync('npm run build', { cwd: root, stdio: 'inherit', shell: true });
if (buildResult.status !== 0) {
  console.error('❌ Build failed. Aborting deployment.');
  process.exit(1);
}

// 2. Discover all installations
const installationsDir = resolve(root, 'installations');
const files = await readdir(installationsDir);
const profiles = [];

for (const file of files) {
  if (file.endsWith('.json') && !file.includes('example')) {
    const raw = JSON.parse(await readFile(resolve(installationsDir, file), 'utf8'));
    profiles.push(raw);
  }
}

console.log(`\n📋 [2/3] Found ${profiles.length} cluster installations + 1 primary (kkg-wanayasa).`);

// Ensure each cluster's wrangler.json exists (generated on the fly on CI/CD)
for (const p of profiles) {
  const cfg = parseInstallation(p);
  const clusterDir = resolve(root, '.installations', cfg.slug);
  await mkdir(clusterDir, { recursive: true });
  await writeFile(resolve(clusterDir, 'wrangler.json'), JSON.stringify(makeWranglerConfig(cfg), null, 2));
}

// Helper to run wrangler
function runWrangler(args, cwd = root) {
  const res = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    console.error(`❌ Command failed: wrangler ${args.join(' ')}`);
  }
  return res.status === 0;
}

// Optional DB migration across all
if (shouldMigrate) {
  console.log('\n🗄️ Applying D1 migrations across fleet...');
  console.log('-> Migrating primary: kkg-wanayasa-db');
  runWrangler(['d1', 'migrations', 'apply', 'kkg-wanayasa-db', '--remote']);

  for (const p of profiles) {
    console.log(`-> Migrating ${p.databaseName}`);
    runWrangler(['d1', 'migrations', 'apply', p.databaseName, '--remote', '--config', resolve(root, '.installations', p.slug, 'wrangler.json')]);
  }
}

// 3. Deploy to all Pages projects
console.log('\n🌐 [3/3] Deploying to Cloudflare Pages fleet...');

// 3a. Primary (kkg-wanayasa)
console.log('\n--> Deploying Primary: kkg-wanayasa (ruangkkg.my.id)...');
runWrangler(['pages', 'deploy', resolve(root, 'dist'), '--project-name', 'kkg-wanayasa', '--commit-dirty=true']);

// 3b. Each cluster installation
for (const p of profiles) {
  console.log(`\n--> Deploying Cluster: ${p.projectName} (${p.slug})...`);
  const clusterDir = resolve(root, '.installations', p.slug);
  runWrangler(['pages', 'deploy', resolve(root, 'dist'), '--project-name', p.projectName, '--commit-dirty=true'], clusterDir);
}

console.log('\n✨ [FLEET DEPLOY COMPLETE] All clusters updated successfully!');

