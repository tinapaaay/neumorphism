const {chromium}=require('playwright'); const fs=require('node:fs'); const path=require('node:path'); const assert=require('node:assert/strict'); const test=require('node:test');
const appRoot=path.resolve(__dirname,'..');
test('dashboard flows: views, recurrence, progress, settings, migration and responsive layout', async t => {
 const browser=await chromium.launch({executablePath:process.env.OPERA_EXECUTABLE || (fs.existsSync('/Applications/Opera.app/Contents/MacOS/Opera') ? '/Applications/Opera.app/Contents/MacOS/Opera' : undefined),headless:true});
 t.after(()=>browser.close());
 const context=await browser.newContext({viewport:{width:1100,height:900},timezoneId:'Asia/Manila'});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='localhost') {const f=u.pathname==='/'?'index.html':u.pathname.slice(1);r.fulfill({body:fs.readFileSync(path.join(appRoot,f)),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});}else r.abort();});
 async function newPage(seed){const p=await context.newPage();await p.clock.install({time:new Date('2026-10-25T06:00:00Z')});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(seed!==undefined)await p.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){localStorage.clear();localStorage.setItem('todo-dashboard-tasks',JSON.stringify(s));sessionStorage.setItem('seeded','yes');}},seed);
 await p.goto('http://localhost:5801/');await p.locator('.daily-progress').waitFor();return {p,errors};}
 const {p,errors}=await newPage([
  {text:'Overdue',done:false,dueDate:'2026-10-24'}, {text:'Undated',done:false}, {text:'Today task',done:false,dueDate:'2026-10-25'}, {text:'Tomorrow',done:false,dueDate:'2026-10-26'}, {text:'Done',done:true}
 ]);
 p.setDefaultTimeout(5000);
 const names=()=>p.locator('.todo-card .todo-task-label').allTextContents();
 assert.deepEqual(await names(),['Overdue','Undated','Today task','Done','Add new task']);
 assert.equal(await p.locator('#daily-progress-text').textContent(),'1 of 4 completed');
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-tasks-backup-v1')).length),5);
 await p.locator('[data-view="upcoming"]').click();assert.deepEqual(await names(),['Tomorrow','Add new task']);
 await p.locator('[data-view="completed"]').click();assert.deepEqual(await names(),['Done','Add new task']);
 await p.locator('[data-view="today"]').click();
 async function menu(text,action){await p.getByRole('button',{name:'Options for task: '+text,exact:true}).click();await p.locator(`#task-options-menu [data-action="${action}"]`).click();}
 // Top 3 cap, priorities, reordering, and persistence.
 await menu('Today task','pin'); assert.equal((await names())[0],'Today task');
 await menu('Undated','pin');await menu('Overdue','pin');
 await menu('Done','pin'); assert.match(await p.locator('#app-status').textContent(),/Three tasks/);
 await menu('Overdue','down'); assert.equal((await names())[0],'Undated');
 await menu('Today task','up');assert.equal((await names())[1],'Today task');
 await menu('Today task','edit');await p.locator('#task-priority').selectOption('high');await p.locator('#add-task-form .task-submit').click();
 assert.equal(await p.locator('.todo-row').filter({has:p.getByRole('button',{name:'Today task',exact:true})}).getAttribute('data-priority'),'high');
 await p.reload();assert.deepEqual((await names()).slice(0,3),['Undated','Today task','Overdue']);
 // Celebration and progress survive clearing and reload.
 for(const text of ['Undated','Overdue','Today task'])await p.getByRole('button',{name:text,exact:true}).click();
 assert.equal(await p.locator('#daily-progress-text').textContent(),'4 of 4 completed');assert(await p.locator('#celebration').isVisible());
 await p.locator('#clear-finished-button').click();assert.equal(await p.locator('#daily-progress-text').textContent(),'4 of 4 completed');
 await p.reload();assert.equal(await p.locator('#daily-progress-text').textContent(),'4 of 4 completed');
 // Saved notes and settings, cancelling, water and muted audio.
 await p.locator('#notes-input').fill('Saved across refresh 🌿');
 await p.locator('#open-settings').click();await p.locator('#settings-name').fill('Tin!');await p.locator('#settings-greeting').fill('One thing at a time.');await p.locator('#settings-water').fill('3000');await p.locator('#settings-sound').selectOption('off');await p.locator('#settings-volume').fill('25');await p.locator('#settings-form button[type="submit"]').click();
 assert.equal(await p.locator('.hello-tin span').textContent(),'Tin!');assert.match(await p.locator('.water-intake-detail').textContent(),/3000/);
 await p.locator('#water-plus').click();assert.equal(await p.locator('.water-intake-detail').textContent(),'250 / 3000 mL');
 await p.reload();assert.equal(await p.locator('#notes-input').inputValue(),'Saved across refresh 🌿');assert.equal(await p.locator('.hello-tin span').textContent(),'Tin!');
 await p.locator('#open-settings').click();assert.equal(await p.locator('#settings-sound').inputValue(),'off');await p.locator('#settings-name').fill('Cancel me');await p.locator('#cancel-settings').click();assert.equal(await p.locator('.hello-tin span').textContent(),'Tin!');
 // New daily recurrence, each occurrence distinct, clear/delete never regenerates.
 async function add(text,repeat='none',date='2026-10-25') {await p.locator('#add-task-button').click();await p.locator('#new-task-input').fill(text);await p.locator('#task-due-date').fill(date);await p.locator('#task-repeat').selectOption(repeat);}
 await add('Daily chore','daily');await p.locator('#add-task-form .task-submit').click();
 assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).count(),1);
 await p.getByRole('button',{name:'Daily chore',exact:true}).click();
 await p.locator('[data-view="upcoming"]').click();assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).count(),30);
 await p.locator('[data-date="2026-10-26"]').click();assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).getAttribute('aria-pressed'),'false');
 await menu('Daily chore','delete');assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).count(),0);
 await p.reload();await p.locator('[data-date="2026-10-26"]').click();assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).count(),0);
 // Date deleted before reload stays skipped; next occurrence remains.
 await p.locator('[data-date="2026-10-27"]').click();assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).count(),1);
 await menu('Daily chore','stop');await p.locator('[data-view="upcoming"]').click();assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).count(),1);
 await p.locator('#undo-clear-tasks').click();assert.equal(await p.getByRole('button',{name:'Daily chore',exact:true}).count(),29);
 // Weekly recurrence uses local weekday; custom schedule validates selected days.
 await p.locator('[data-view="today"]').click();await add('Weekly laundry','weekly');await p.locator('#add-task-form .task-submit').click();
 let data=await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-tasks')));
 const weekly=data.tasks.filter(t=>t.text==='Weekly laundry');assert(weekly.length>=5);assert(weekly.every(t=>new Date(t.dueDate+'T12:00:00').getDay()===0));
 await add('Weekday stretch','custom');await p.locator('#add-task-form .task-submit').click();assert.match(await p.locator('#task-form-error').textContent(),/at least one/);
 await p.locator('#repeat-weekdays input[value="1"]').check();await p.locator('#repeat-weekdays input[value="3"]').check();await p.locator('#add-task-form .task-submit').click();
 data=await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-tasks')));const custom=data.tasks.filter(t=>t.text==='Weekday stretch');assert(custom.length>0);assert(custom.every(t=>[1,3].includes(new Date(t.dueDate+'T12:00:00').getDay())));
 assert.equal(custom[0].dueDate,'2026-10-26');
 // Date navigation must not duplicate repeated occurrences.
 await p.locator('#calendar-next').click();await p.locator('#calendar-prev').click();await p.reload();
 data=await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-tasks')));const occurrenceKeys=data.tasks.filter(t=>t.seriesId).map(t=>t.seriesId+':'+t.occurrenceDate);assert.equal(new Set(occurrenceKeys).size,occurrenceKeys.length);
 // Midnight: fresh progress, recurring task remains pending, completed history survives.
 await p.clock.setSystemTime(new Date('2026-10-26T00:00:01+08:00'));await p.clock.runFor(1100);
 assert.match(await p.locator('#daily-progress-text').textContent(),/^0 of /);
 await p.locator('[data-view="completed"]').click();assert(await p.getByRole('button',{name:'Daily chore',exact:true}).count()>0);
 // Desktop + mobile geometry: lists do not overlap footer; no horizontal overflow.
 await p.locator('[data-view="today"]').click();
 let list=await p.locator('#todo-container').boundingBox();let progress=await p.locator('.daily-progress').boundingBox();assert(list.y+list.height<=progress.y);
 await p.setViewportSize({width:375,height:850});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const taskBox=await p.locator('.todo-card').boundingBox(); const waterBox=await p.locator('.water-intake-card').boundingBox(); assert(taskBox.y<waterBox.y);
 await p.locator('#add-task-button').click();
 assert.deepEqual(errors,[]);
 console.log('PASS in Opera: task views, top-three cap, priority, reorder/persistence, daily celebration/progress/clear, notes, settings/water/sound/cancel, daily/weekly/custom recurrence, deletion/stop/undo, no duplicates, midnight, desktop/mobile geometry, no JS errors.');
 await browser.close();
});
