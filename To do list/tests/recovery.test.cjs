const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const executablePath = process.env.OPERA_EXECUTABLE || (fs.existsSync('/Applications/Opera.app/Contents/MacOS/Opera') ? '/Applications/Opera.app/Contents/MacOS/Opera' : undefined);
async function fixture(t, seed, blocked = false) {
  const browser = await chromium.launch({ executablePath, headless: true }); t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1000, height: 850 }, timezoneId: 'Asia/Manila' });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') return route.abort();
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    return route.fulfill({ body: fs.readFileSync(path.join(root, file)), contentType: file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' });
  });
  const page = await context.newPage(); page.setDefaultTimeout(5000);
  await page.clock.install({ time: new Date('2026-10-28T06:00:00Z') });
  const errors = []; page.on('pageerror', error => errors.push(error.message)); t.after(() => assert.deepEqual(errors, []));
  await page.addInitScript(({seed, blocked}) => {
    if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('todo-dashboard-tasks', JSON.stringify(seed)); sessionStorage.setItem('seeded','yes'); }
    if (blocked) Storage.prototype.setItem = function() { throw new Error('Storage unavailable'); };
  }, { seed, blocked });
  await page.goto('http://localhost:5802/'); await page.locator('#daily-progress-ring').waitFor();
  return page;
}
const task = (id, pinned = false) => ({ id, text: id, done: false, pinned });
async function menu(page, name, action) {
  await page.getByRole('button', { name: `Options for task: ${name}`, exact: true }).click();
  await page.locator(`#task-options-menu [data-action="${action}"]`).click();
}
async function data(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('todo-dashboard-tasks'))); }

test('Undo preserves new tasks and the three-pin cap; menu and keyboard retain focus', async t => {
  const p = await fixture(t, { version: 2, tasks: [task('a',true), task('b',true), task('c',true), task('d'), task('e')], series: [], daily: {} });
  await menu(p, 'a', 'delete'); await menu(p, 'd', 'pin');
  assert.equal(await p.locator(':focus').getAttribute('aria-label'), 'Options for task: d');
  await p.locator('#add-task-button').click(); await p.locator('#new-task-input').fill('New task'); await p.locator('#add-task-form .task-submit').click();
  await p.locator('#notes-input').fill('Latest notes'); await p.locator('#open-settings').click(); await p.locator('#settings-name').fill('Latest name'); await p.locator('#settings-form button[type="submit"]').click();
  await p.locator('#undo-clear-tasks').click();
  assert.equal(await p.locator('#notes-input').inputValue(),'Latest notes'); assert.equal(await p.locator('.hello-tin span').textContent(),'Latest name');
  let state = await data(p); assert.equal(state.tasks.length, 6); assert.equal(state.tasks.filter(t=>t.pinned).length, 3); assert.equal(state.tasks.find(t=>t.id==='a').pinned, false);
  await p.getByRole('button', {name:'Options for task: d',exact:true}).press('Alt+ArrowUp');
  assert.equal(await p.locator(':focus').getAttribute('aria-label'), 'Options for task: d');
  assert.deepEqual((await p.locator('.todo-card .todo-task-label').allTextContents()).slice(0,3), ['b','d','c']);
  await p.locator('[data-task-id="e"]').dragTo(p.locator('[data-task-id="a"]'));
  state = await data(p); assert(state.tasks.findIndex(t=>t.id==='e') < state.tasks.findIndex(t=>t.id==='a'));
  await p.locator('[data-task-id="a"]').dragTo(p.locator('[data-task-id="b"]'));
  assert.match(await p.locator('#app-status').textContent(),/pinned group/);
});

test('backup download, validation, confirmed restore, undo restore, and reload', async t => {
  const p = await fixture(t, [task('Original')]);
  await p.locator('#notes-input').fill('Original notes'); await p.locator('#open-settings').click(); await p.locator('.backup-tools summary').click();
  const downloadPromise = p.waitForEvent('download'); await p.locator('#export-backup').click(); const download = await downloadPromise;
  const backup = JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(backup.app,'neumorphic-todo'); assert.equal(backup.data.notes,'Original notes');
  const changed = structuredClone(backup); changed.data.state.tasks=[{...task('Imported'), dueDate:'2026-10-28'}]; changed.data.state.daily={}; changed.data.settings.name='Restored profile'; changed.data.notes='Restored notes';
  await p.locator('#import-backup').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(changed))});
  await p.locator('#backup-preview').waitFor(); assert.equal(await p.locator('.hello-tin span').textContent(),'Tin');
  await p.locator('#confirm-restore').click(); assert.equal(await p.locator('.hello-tin span').textContent(),'Restored profile'); assert.equal(await p.locator('#notes-input').inputValue(),'Restored notes');
  await p.reload(); assert.equal(await p.locator('.hello-tin span').textContent(),'Restored profile');
  await p.locator('#open-settings').click(); await p.locator('.backup-tools summary').click(); await p.locator('#recover-backup').click();
  assert.equal(await p.locator('#notes-input').inputValue(),'Original notes'); assert.equal((await data(p)).tasks[0].text,'Original');
  await p.locator('#open-settings').click(); await p.locator('.backup-tools summary').click();
  await p.locator('#import-backup').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{')});
  await p.waitForFunction(()=>document.querySelector('#backup-status').textContent.includes('not valid JSON'));
  assert.equal((await data(p)).tasks[0].text,'Original');
  await p.locator('#import-backup').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'other'}))});
  await p.waitForFunction(()=>document.querySelector('#backup-status').textContent.includes('not a valid dashboard backup'));
  assert(await p.locator('#backup-preview').isHidden());
});

test('damaged task IDs and progress data recover without crashing; storage failures stay usable', async t => {
  const p = await fixture(t, {version:2,tasks:[{id:'bad"]',text:'Recovered',done:false}],series:[{id:'broken',text:'Broken',start:'2026-10-28',mode:'custom',days:[]}],daily:{'2026-10-28':{'constructor':true,'garbage':'yes'}}});
  assert.equal(await p.locator('#daily-progress-text').textContent(),'0 of 1 completed');
  await p.getByRole('button',{name:'Recovered',exact:true}).click(); assert.equal(await p.locator('#daily-progress-text').textContent(),'1 of 1 completed');
  assert.equal((await data(p)).series.length,0);
  const blocked = await fixture(t, [task('Unsaved')], true);
  await blocked.getByRole('button',{name:'Unsaved',exact:true}).click(); assert.equal(await blocked.locator('#daily-progress-text').textContent(),'1 of 1 completed');
  await blocked.locator('#notes-input').fill('Still editable'); assert.equal(await blocked.locator('#notes-save-status').textContent(),'Not saved');
  assert.match(await blocked.locator('#app-status').textContent(),/storage is unavailable/);
});

test('changing a stopped recurrence cannot later revive the old schedule through stale Undo', async t => {
  const p = await fixture(t, []);
  await p.locator('#add-task-button').click(); await p.locator('#new-task-input').fill('Routine'); await p.locator('#task-repeat').selectOption('daily'); await p.locator('#add-task-form .task-submit').click();
  await menu(p,'Routine','stop');
  await menu(p,'Routine','edit'); await p.locator('#task-repeat').selectOption('weekly'); await p.locator('#add-task-form .task-submit').click();
  assert(await p.locator('#task-undo-toast').isHidden());
  const saved = await data(p); assert.deepEqual(saved.series.filter(s=>s.active).map(s=>s.mode), ['weekly']);
  // An undated task added from Upcoming switches to a view where it can be found.
  await p.locator('[data-view="upcoming"]').click(); await p.locator('#add-task-button').click(); await p.locator('#new-task-input').fill('No date'); await p.locator('#clear-due-date').click(); await p.locator('#add-task-form .task-submit').click();
  assert.equal(await p.locator('[data-view="today"]').getAttribute('aria-pressed'),'true'); assert(await p.getByRole('button',{name:'No date',exact:true}).isVisible());
});

test('sound preview respects off and zero volume and generates the selected chime', async t => {
  const p = await fixture(t, [task('Sound test')]);
  await p.evaluate(() => {
    const Original = window.AudioContext; window.audioOscillators = 0;
    window.AudioContext = class extends Original { createOscillator() { window.audioOscillators++; return super.createOscillator(); } };
  });
  await p.locator('#open-settings').click(); await p.locator('#settings-sound').selectOption('off'); await p.locator('#preview-sound').click(); assert.equal(await p.evaluate(()=>window.audioOscillators),0);
  await p.locator('#settings-sound').selectOption('pop'); await p.locator('#settings-volume').fill('0'); await p.locator('#preview-sound').click(); assert.equal(await p.evaluate(()=>window.audioOscillators),0);
  await p.locator('#settings-sound').selectOption('chime'); await p.locator('#settings-volume').fill('50'); await p.locator('#preview-sound').click(); await p.waitForFunction(()=>window.audioOscillators === 2);
  await p.locator('#settings-sound').selectOption('off'); await p.locator('#settings-form button[type="submit"]').click(); await p.getByRole('button',{name:'Sound test',exact:true}).click(); assert.equal(await p.evaluate(()=>window.audioOscillators),2);
});

test('task validation, long names, cancellation, due-date editing and leap-year dates', async t => {
  const p = await fixture(t, []);
  await p.locator('#add-task-button').click(); await p.locator('#new-task-input').fill('   '); await p.locator('#add-task-form .task-submit').click();
  assert(await p.locator('#add-task-dialog').isVisible()); assert.equal((await data(p)).tasks.length,0);
  await p.locator('#new-task-input').fill('L'.repeat(80)); await p.locator('#add-task-form .task-submit').click(); assert.equal((await data(p)).tasks[0].text.length,80);
  await menu(p,'L'.repeat(80),'edit'); await p.locator('#new-task-input').fill('Discard'); await p.keyboard.press('Escape'); assert.equal((await data(p)).tasks[0].text.length,80);
  await menu(p,'L'.repeat(80),'edit'); await p.locator('#new-task-input').fill('Future task'); await p.locator('#task-due-date').fill('2026-10-29'); await p.locator('#add-task-form .task-submit').click();
  assert.equal(await p.locator('[data-view="upcoming"]').getAttribute('aria-pressed'),'true');
  await p.locator('[data-date="2026-10-29"]').click(); assert(await p.getByRole('button',{name:'Future task',exact:true}).isVisible());
  for(let i=0;i<16;i++) await p.locator('#calendar-next').click(); assert.equal(await p.locator('#calendar-month').textContent(),'Feb 2028'); assert.equal(await p.locator('.cal-date').count(),29);
  await p.locator('#calendar-prev').click(); assert.equal(await p.locator('#calendar-month').textContent(),'Jan 2028');
  await p.locator('#calendar-today').click(); assert.equal(await p.locator('#calendar-month').textContent(),'Oct 2026');
  for (const width of [390,580,581]) { await p.setViewportSize({width,height:850}); assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); }
});
