import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const baselinePath = resolve(root, 'docs/design/ui-refinement-2026-10-03/output-baseline.json');
const walk = dir => readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
const pageNames = ['rpp', 'kisi', 'slide', 'analisis-cp', 'surat', 'proker', 'laporan', 'program-sekolah', 'games'];
const protectedFiles = [
  ...pageNames.map(name => `public/static/js/pages/${name}.js`),
  ...walk('public/static/js/pages/analisis-cp').filter(name => name.endsWith('.js')),
  'public/static/js/asesmen-docx.js', 'public/static/js/storage-archive.js',
  ...walk('src').filter(name => /\.(ts|tsx)$/.test(name) && name !== 'src/templates/layout.ts'),
];
const digest = path => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
if (process.argv.includes('--capture')) {
  writeFileSync(baselinePath, `${JSON.stringify({ captured: '2026-10-03', files: Object.fromEntries(protectedFiles.map(path => [path, digest(path)])) }, null, 2)}\n`);
  console.log(`Baseline: ${protectedFiles.length} protected source files (${relative(root, baselinePath)})`);
} else {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const changed = Object.entries(baseline.files).filter(([path, hash]) => digest(path) !== hash).map(([path]) => path);
  if (changed.length) {
    console.error(`Protected source changed:\n${changed.join('\n')}`);
    process.exitCode = 1;
  } else console.log(`PASS: ${Object.keys(baseline.files).length} protected source files unchanged from the pre-refinement working tree.`);
}
