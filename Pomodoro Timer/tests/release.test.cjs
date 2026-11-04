const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

(async () => {
  const root = path.join(__dirname, '..');
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  assert(!html.includes('cdn.tailwindcss.com'));
  const baseAt = html.indexOf('href="base.css"');
  const styleAt = html.search(/href="style\.css(\?[^"]*)?"/);
  assert(baseAt !== -1 && styleAt !== -1 && baseAt < styleAt);
  assert(html.includes('name="description"'));
  assert(html.includes('property="og:title"'));
  assert(html.includes('rel="icon" href="favicon.svg"'));
  assert(html.includes('defer src="https://cdnjs.cloudflare.com/ajax/libs/tone/'));
  const base = await fs.readFile(path.join(root, 'base.css'), 'utf8');
  for (const rule of ['box-sizing: border-box', '.relative', '.flex', '.flex-col', '.items-center', '.mt-7', '.space-x-2', '[hidden]', 'dialog:not([open])']) assert(base.includes(rule), rule);
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'site.webmanifest'), 'utf8'));
  assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './');
  assert.equal(manifest.icons[0].src, 'favicon.svg');
  const build = await import(pathToFileURL(path.join(root, 'scripts/build.mjs')).href);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pomodoro-release-'));
  try {
    const output = await build.buildSite(path.join(temp, 'dist'));
    for (const asset of build.assets) {
      assert.deepEqual(await fs.readFile(path.join(output, asset)), await fs.readFile(path.join(root, asset)), asset);
    }
    for (const forbidden of ['tests', 'docs', 'scripts', 'package.json', '.vscode']) {
      await assert.rejects(fs.stat(path.join(output, forbidden)), { code: 'ENOENT' });
    }
    // All local HTML and manifest references in the packaged entry point exist.
    for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      const target = match[1].split('?')[0];
      if (/^(https?:|data:|mailto:)/.test(target)) continue;
      await fs.stat(path.join(output, target));
    }
    await fs.writeFile(path.join(output, 'stale.js'), 'stale');
    await build.buildSite(output);
    await assert.rejects(fs.stat(path.join(output, 'stale.js')), { code: 'ENOENT' });
    await assert.rejects(build.buildSite(root), /separate dist folder/);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
  console.log('PASS: local CSS, metadata/icon/manifest, optional deferred sound dependency, exact asset packaging, clean rebuild and no source/test leakage.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
