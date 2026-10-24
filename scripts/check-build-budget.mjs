import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

export function measureInitialModules(entry) {
  const visited = new Set();
  const external = new Set();
  let bytes = 0;
  function visit(file) {
    file = resolve(file);
    if (visited.has(file)) return;
    visited.add(file);
    const source = readFileSync(file, 'utf8'); bytes += Buffer.byteLength(source);
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
    for (const node of parsed.statements) {
      if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
      const specifier = node.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier)) continue;
      const name = specifier.text;
      if (name.startsWith('.')) visit(resolve(dirname(file), name.split(/[?#]/)[0]));
      else external.add(name);
    }
  }
  visit(entry);
  return { bytes, moduleCount: visited.size, external: [...external].sort() };
}

export function inspectBuildBudget(directory = 'dist', budgetPath = 'build-budget.json') {
  const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));
  const initial = measureInitialModules(resolve(directory, 'static/js/main.js'));
  const measures = {
    workerRawBytes: statSync(resolve(directory, '_worker.js')).size,
    initialLocalJsRawBytes: initial.bytes,
    stylesheetRawBytes: statSync(resolve(directory, 'static/style.css')).size,
  };
  for (const [name, bytes] of Object.entries(measures)) {
    if (!Number.isSafeInteger(budget[name]) || budget[name] <= 0) throw new Error(`Invalid budget: ${name}`);
  }
  return { measures, limits: budget, initial, failures: Object.keys(measures).filter(name => measures[name] > budget[name]) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = inspectBuildBudget();
    console.log(JSON.stringify(result, null, 2));
    if (result.failures.length) { console.error(`Build budget exceeded: ${result.failures.join(', ')}`); process.exitCode = 1; }
  } catch (error) { console.error(`Build budget incomplete: ${error.message}`); process.exitCode = 1; }
}
