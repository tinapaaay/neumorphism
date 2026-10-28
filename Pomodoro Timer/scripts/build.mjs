import { cp, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const assets = [
  'index.html', 'help.html', 'privacy.html', 'site-info.css', 'base.css', 'style.css', 'favicon.svg', 'site.webmanifest',
  'script.js', 'mini-timer.js', 'ambient.js', 'data-tools.js', 'history-editor.js',
  'storage-safety.js', 'tab-coordination.js',
  'audio/credits.html', 'audio/rain.mp3', 'audio/fireplace.wav',
  'audio/beach.ogg', 'audio/jazz.ogg', 'audio/coffee-shop.ogg',
];

export async function buildSite(destination = join(root, 'dist')) {
  const output = resolve(destination);
  if (basename(output) !== 'dist' || output === root) throw new Error('Build destination must be a separate dist folder.');
  await mkdir(dirname(output), { recursive: true });
  const temp = await mkdtemp(join(dirname(output), '.build-'));
  try {
    for (const asset of assets) {
      await mkdir(dirname(join(temp, asset)), { recursive: true });
      await cp(join(root, asset), join(temp, asset), { dereference: true });
    }
    await writeFile(join(temp, '.nojekyll'), '');
    // Only the generated dist folder is replaced; source/test files are untouched.
    await rm(output, { recursive: true, force: true });
    await rename(temp, output);
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    throw error;
  }
  return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Built ${assets.length} site assets into ${await buildSite()}`);
}
