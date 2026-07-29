import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const processes = [];
let shuttingDown = false;

function start(name, scriptPath, args = [], required = true) {
  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd: root,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  const prefix = `[${name}]`;
  child.stdout.on('data', (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (!required && (code === 0 || signal === 'SIGTERM')) {
      console.warn(`${prefix} stopped (non-blocking)`);
      return;
    }
    if (signal) {
      console.error(`${prefix} exited with signal ${signal}`);
    } else {
      console.error(`${prefix} exited with code ${code ?? 1}`);
    }
    shutdown(code ?? 1);
  });

  processes.push(child);
  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(exitCode), 100);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const cssCli = resolve(root, 'node_modules/tailwindcss/lib/cli.js');

const initialCss = spawnSync(process.execPath, [cssCli,
  '-i',
  './src/styles/input.css',
  '-o',
  './public/static/style.css',
  '--minify',
], { cwd: root, env: process.env, stdio: 'inherit' });

if (initialCss.status && initialCss.status !== 0) {
  process.exit(initialCss.status);
}

start('css', cssCli, [
  '-i',
  './src/styles/input.css',
  '-o',
  './public/static/style.css',
  '--watch',
], false);

start('vite', resolve(root, 'node_modules/vite/bin/vite.js'));
