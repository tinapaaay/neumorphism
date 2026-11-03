const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const test=require('node:test');
const root=path.resolve(__dirname,'..');
async function fixture(t,options={}){
 const b=await chromium.launch({executablePath:process.env.OPERA_EXECUTABLE || (fs.existsSync('/Applications/Opera.app/Contents/MacOS/Opera')?'/Applications/Opera.app/Contents/MacOS/Opera':undefined),headless:true});t.after(()=>b.close());
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',timezoneId:'Asia/Manila',...options});
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='localhost')return r.abort();const f=u.pathname==='/'?'index.html':u.pathname.slice(1);return r.fulfill({body:fs.readFileSync(path.join(root,f)),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'});});
 const p=await c.newPage();p.setDefaultTimeout(5000);const errors=[];p.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
 await p.addInitScript(()=>localStorage.setItem('todo-dashboard-tasks',JSON.stringify([{text:'One task',done:false}])));
 return p;
}
test('QA regression: mobile taps, full weekday labels and reduced-motion celebration',async t=>{
 const p=await fixture(t);await p.clock.install({time:new Date('2026-10-29T06:00:00Z')});await p.goto('http://localhost:5831/');
 await p.getByRole('button',{name:'Options for task: One task',exact:true}).tap();
 const menu=await p.locator('#task-options-menu').boundingBox();assert(menu.x>=0&&menu.x+menu.width<=390);
 await p.locator('[data-action="edit"]').tap();await p.locator('#task-repeat').selectOption('custom');
 for(const name of ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'])assert.equal(await p.getByRole('checkbox',{name,exact:true}).count(),1);
 await p.getByRole('checkbox',{name:'Wednesday',exact:true}).tap();assert(await p.getByRole('checkbox',{name:'Wednesday',exact:true}).isChecked());
 await p.locator('#cancel-task-dialog').tap();await p.getByRole('button',{name:'One task',exact:true}).tap();
 assert(await p.locator('#celebration').isVisible());assert.equal(await p.locator('#celebration').evaluate(el=>getComputedStyle(el).animationName),'none');
 await p.locator('#open-weekly-review').tap();assert.equal(await p.locator('#review-finished').textContent(),'1');
 assert(await p.locator('#weekly-review-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));
 await p.locator('#close-weekly-review').tap();assert.equal(await p.locator(':focus').getAttribute('id'),'open-weekly-review');
});
test('QA regression: DST fall-back does not reset water or daily progress before local midnight',async t=>{
 const p=await fixture(t,{timezoneId:'America/New_York'});await p.clock.install({time:new Date('2026-11-01T04:30:00Z')});await p.goto('http://localhost:5831/');
 assert.match(await p.locator('.time-remaining-detail').textContent(),/^24h (29|30)m left$/);
 await p.locator('#water-plus').tap();await p.clock.setSystemTime(new Date('2026-11-01T05:59:58Z'));await p.clock.runFor(3000);
 assert.equal(await p.locator('.clock-time').textContent(),'01:00');assert.equal(await p.locator('.water-intake-detail').textContent(),'250 / 2000 mL');assert.equal(await p.locator('#daily-progress-text').textContent(),'0 of 1 completed');
 await p.clock.setSystemTime(new Date('2026-11-02T05:00:01Z'));await p.clock.runFor(1100);
 assert.equal(await p.locator('.clock-date').textContent(),'2026/11/02');assert.equal(await p.locator('.water-intake-detail').textContent(),'0 / 2000 mL');
 const history=await p.evaluate(()=>JSON.parse(localStorage.getItem('todo-dashboard-water-history')));assert.equal(history['2026-11-01'].amount,250);assert.equal(history['2026-11-02'].amount,0);
});
