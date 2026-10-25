import { parseArgs } from 'node:util';
import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseInstallation, makeWranglerConfig, makeBootstrapSql } from './installation-config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const { values } = parseArgs({ options: { profile: { type: 'string' }, action: { type: 'string', default: 'check' }, remote: { type: 'boolean', default: false } } });
const actions = ['check', 'config', 'migrate', 'bootstrap', 'deploy'];
if (!values.profile || !actions.includes(values.action)) throw new Error('Usage: npm run installation -- --profile installations/gugus.json --action check|config|migrate|bootstrap|deploy [--remote]');
const config = parseInstallation(JSON.parse(await readFile(resolve(values.profile), 'utf8')));
const configPath = resolve(root, '.installations', config.slug, 'wrangler.json');
console.log(JSON.stringify({ action: values.action, project: config.projectName, database: config.databaseName,
    bucket: config.bucketName, region: config.organization.region_profile, schools: config.schools.length,
    target: values.remote ? 'REMOTE' : 'LOCAL' }, null, 2));

function wrangler(args, json = false) {
    const result = spawnSync(process.execPath, [resolve(root, 'node_modules/wrangler/bin/wrangler.js'), ...args, '--config', configPath], {
        cwd: root, env: process.env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    });
    // Never print a failed bootstrap command or SQL containing password hashes.
    if (result.status !== 0) throw new Error(`Wrangler ${args[0]} gagal; periksa target, akses Cloudflare dan status migrasi. Output SQL tidak ditampilkan.`);
    if (json) return JSON.parse(result.stdout);
    console.log(result.stdout);
}
if (values.action !== 'check') {
    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify(makeWranglerConfig(config), null, 2));
}
if (values.action === 'migrate') {
    wrangler(['d1', 'migrations', 'apply', config.databaseName, values.remote ? '--remote' : '--local']);
} else if (values.action === 'bootstrap') {
    const check = wrangler(['d1', 'execute', config.databaseName, values.remote ? '--remote' : '--local', '--command', 'SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM settings) AS settings;', '--json'], true);
    if (!check[0]?.success || check[0].results[0]?.users !== 0 || check[0].results[0]?.settings !== 0) throw new Error('Bootstrap hanya untuk database baru kosong setelah migrasi. Target sudah berisi akun/pengaturan.');
    const sql = makeBootstrapSql(config, process.env.KKG_INITIAL_ADMIN_PASSWORD);
    const dir = await mkdtemp(resolve(tmpdir(), 'kkg-install-'));
    try {
        const file = resolve(dir, 'bootstrap.sql');
        await writeFile(file, sql, { mode: 0o600 });
        wrangler(['d1', 'execute', config.databaseName, values.remote ? '--remote' : '--local', '--file', file, '--json'], true);
        console.log('Profil, sekolah, dan admin awal terpasang. Password tidak ditampilkan.');
    } finally { await rm(dir, { recursive: true, force: true }); }
} else if (values.action === 'deploy') {
    if (!values.remote) throw new Error('Deploy memerlukan --remote dan profile eksplisit.');
    const check = wrangler(['d1', 'execute', config.databaseName, '--remote', '--command', "SELECT value FROM settings WHERE key='installation_slug';", '--json'], true);
    if (!check[0]?.success || check[0].results[0]?.value !== config.slug) throw new Error('Identitas database tidak cocok dengan profile deployment.');
    // Static shell command for npm.cmd compatibility on Windows. No profile
    // values are interpolated into the shell; Wrangler always receives argv.
    const result = spawnSync('npm run build', { cwd: root, stdio: 'inherit', shell: true });
    if (result.status !== 0) throw new Error('Build gagal.');
    wrangler(['pages', 'deploy', resolve(root, 'dist'), '--project-name', config.projectName]);
}
