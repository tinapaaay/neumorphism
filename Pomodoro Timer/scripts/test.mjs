import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './build.mjs';

const suites = readdirSync(join(root, 'tests')).filter((file) => file.endsWith('.test.cjs')).sort();
if (!suites.length) throw new Error('No regression suites found.');
let failed = 0;
for (const suite of suites) {
  const result = spawnSync(process.execPath, [join(root, 'tests', suite)], { cwd: root, encoding: 'utf8' });
  if (result.status === 0) console.log(`PASS ${suite}`);
  else {
    failed++;
    console.error(`FAIL ${suite}\n${result.stdout || ''}${result.stderr || ''}${result.error || ''}`);
  }
}
console.log(`${suites.length - failed}/${suites.length} suites passed.`);
if (failed) process.exitCode = 1;
