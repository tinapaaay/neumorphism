const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const test=require('node:test');
const root=path.resolve(__dirname,'..');
async function fixture(t, payload={}, date='2026-10-29T06:00:00Z') {
 const browser=await chromium.launch({executablePath:process.env.OPERA_EXECUTABLE || (fs.existsSync('/Applications/Opera.app/Contents/MacOS/Opera')?'/Applications/Opera.app/Contents/MacOS/Opera':undefined),headless:true});t.after(()=>browser.close());
 const context=await browser.newContext({viewport:{width:1100,height:900},timezoneId:'Asia/Manila'});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='localhost')return r.abort();const f=u.pathname==='/'?'index.html':u.pathname.slice(1);return r.fulfill({body:fs.readFileSync(path.join(root,f)),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});});
 const p=await context.newPage();p.setDefaultTimeout(5000);const errors=[];p.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));await p.clock.install({time:new Date(date)});
 await p.addInitScript(data=>{if(!sessionStorage.getItem('seeded')){for(const [key,value] of Object.entries(data))localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seeded','yes');}},payload);
 await p.goto('http://localhost:5820/');return p;
}
const task=(id,done=false,completedDate=null,dueDate=null)=>({id,text:id,done,completedDate,dueDate});

test('weekly totals deduplicate cleared work, use actual completion dates, and label missing/future water honestly',async t=>{
 const p=await fixture(t,{'todo-dashboard-tasks':{version:2,tasks:[task('Finished',true,'2026-10-27'),task('Early',true,'2026-10-24','2026-10-27'),task('Old',true,'2026-10-24'),task('Carry',false,null,'2026-10-30'),task('No date'),task('Future',false,null,'2026-11-02')],series:[],daily:{'2026-10-26':{archived:true,Finished:false},'2026-10-27':{archived:true,Finished:true,Early:true}}},'todo-dashboard-water':{day:'2026-10-28',amount:1500},'todo-dashboard-water-history':{'2026-10-26':{amount:2000,goal:2000},'2026-10-27':{amount:2500,goal:3000}}});
 await p.locator('#open-weekly-review').click();assert.equal(await p.locator('#review-week-label').textContent(),'Oct 26 – Nov 1, 2026');
 assert.equal(await p.locator('#review-finished').textContent(),'2');assert.equal(await p.locator('#review-pending').textContent(),'2');assert.match(await p.locator('#review-archived').textContent(),/1 cleared task/);
 assert.match(await p.locator('#review-wins').textContent(),/Finished/);assert(!/Early/.test(await p.locator('#review-wins').textContent()));
 assert.equal(await p.locator('#review-water-goals').textContent(),'1/3');assert.match(await p.locator('#review-water-summary').textContent(),/6 L logged across 4/);
 assert.match(await p.locator('#review-water-chart [data-date="2026-10-28"]').getAttribute('aria-label'),/target not recorded/);
 assert.equal(await p.locator('#review-task-chart [data-date="2026-10-30"]').getAttribute('data-state'),'future');assert.equal(await p.locator('#review-water-chart [data-date="2026-10-25"]').count(),0);
 await p.locator('#review-prev').click();assert.equal(await p.locator('#review-week-label').textContent(),'Oct 19 – Oct 25, 2026');assert.equal(await p.locator('#review-finished').textContent(),'2');assert.equal(await p.locator('#review-water-goals').textContent(),'—');
 await p.locator('#review-current').click();assert(await p.locator('#review-next').isDisabled());await p.keyboard.press('Escape');assert.equal(await p.locator(':focus').getAttribute('id'),'open-weekly-review');
});

test('water history survives midnight, changing targets, reload, and portable backup restore',async t=>{
 const p=await fixture(t,{'todo-dashboard-tasks':[]},'2026-10-29T15:59:58Z');
 await p.locator('#water-plus').click();await p.locator('#water-plus').click();
 await p.locator('#open-settings').click();await p.locator('#settings-water').fill('3000');await p.locator('#settings-form button[type="submit"]').click();
 await p.locator('#open-weekly-review').click();await p.clock.runFor(3000);
 let history=await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-water-history')));assert.deepEqual(history['2026-10-29'],{amount:500,goal:3000});assert.deepEqual(history['2026-10-30'],{amount:0,goal:3000});
 assert.equal(await p.locator('#review-water-chart [data-date="2026-10-30"]').getAttribute('data-state'),'recorded');
 await p.locator('#close-weekly-review').click();await p.reload();await p.locator('#open-settings').click();if(await p.locator('.backup-tools').getAttribute('open')===null)await p.locator('.backup-tools summary').click();
 const downloading=p.waitForEvent('download');await p.locator('#export-backup').click();const file=await downloading;const backup=JSON.parse(fs.readFileSync(await file.path(),'utf8'));assert.equal(backup.data.waterHistory['2026-10-29'].goal,3000);
 await p.locator('#cancel-settings').click();await p.locator('#water-plus').click();
 await p.locator('#open-settings').click();if(await p.locator('.backup-tools').getAttribute('open')===null)await p.locator('.backup-tools summary').click();await p.locator('#import-backup').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await p.locator('#backup-preview').waitFor();await p.locator('#confirm-restore').click();
 history=await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-water-history')));assert.equal(history['2026-10-29'].amount,500);assert.equal(history['2026-10-30'].amount,0);
});

test('week ranges cross the year correctly and the review stays within mobile bounds',async t=>{
 const p=await fixture(t,{'todo-dashboard-tasks':{version:2,tasks:[],series:[],daily:{'2026-12-27':{cleared:true}}}},'2027-01-01T06:00:00Z');
 await p.locator('#open-weekly-review').click();assert.equal(await p.locator('#review-week-label').textContent(),'Dec 28, 2026 – Jan 3, 2027');
 await p.locator('#review-prev').click();assert.equal(await p.locator('#review-finished').textContent(),'1');assert.equal(await p.locator('#review-task-chart [data-date="2026-12-21"]').getAttribute('data-state'),'unrecorded');
 for(const width of [320,375,580,1100]){await p.setViewportSize({width,height:700});const bounds=await p.locator('#weekly-review-dialog').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width);assert(await p.locator('#weekly-review-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));}
});

test('older backups without water history remain restorable',async t=>{
 const p=await fixture(t,{'todo-dashboard-tasks':[]});
 const backup={app:'neumorphic-todo',version:1,data:{state:{version:2,tasks:[],series:[],daily:{}},settings:{name:'Legacy profile',greeting:'A good day',waterGoal:2000,sound:'off',volume:50},notes:'Legacy notes',water:{day:'2026-10-29',amount:1000}}};
 await p.locator('#open-settings').click();await p.locator('.backup-tools summary').click();await p.locator('#import-backup').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await p.locator('#backup-preview').waitFor();await p.locator('#confirm-restore').click();
 assert.equal(await p.locator('#notes-input').inputValue(),'Legacy notes');assert.equal(await p.locator('.water-intake-detail').textContent(),'1000 / 2000 mL');
 const history=await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-water-history')));assert.deepEqual(history,{'2026-10-29':{amount:1000,goal:2000}});
});
