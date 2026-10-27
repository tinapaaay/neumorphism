import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './build.mjs';

const files = [
  ...readdirSync(root).filter((file) => file.endsWith('.js')),
  ...readdirSync(join(root, 'scripts')).filter((file) => file.endsWith('.mjs')).map((file) => `scripts/${file}`),
  ...readdirSync(join(root, 'tests')).filter((file) => file.endsWith('.cjs')).map((file) => `tests/${file}`),
];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${file}: ${result.stderr || result.error}`);
}
console.log(`Syntax passed for ${files.length} files.`);
