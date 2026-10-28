const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {boot} = require('./timer-fixture.cjs');
const root = path.join(__dirname,'..');
// Crossing the mobile breakpoint docks floating cards without overwriting the
// saved desktop layout. Opening/closing cards must not reset an active timer.
const app = boot({});
app.run("widgetControllers.get('goalWidget').detach(500,300); handleDialPress()");
assert.equal(app.run('profile.name'),'Guest');
assert.equal(app.run('profile.role'),'');
const deadline = app.run('timerDeadline');
const layout = app.storage['pomodoro-widget-layout-v1'];
let mobile = true;
app.win.matchMedia = () => ({matches:mobile});
app.run('syncResponsiveLayout()');
assert.equal(app.run('floatingWidgets.size'),0);
assert.equal(app.get('sidebarToggle').getAttribute('aria-expanded'),'false');
assert.equal(app.get('sidebarPanel').inert,true);
app.get('sidebarShell').fire('pointerenter',{pointerType:'touch'});
assert.equal(app.get('sidebarToggle').getAttribute('aria-expanded'),'false');
app.get('sidebarToggle').fire('click');
assert.equal(app.get('sidebarToggle').getAttribute('aria-expanded'),'true');
assert.equal(app.get('sidebarPanel').inert,false);
app.get('historyPopup').hidden=true;
app.get('sidebarShell').fire('keydown',{key:'Escape'});
assert.equal(app.get('sidebarToggle').getAttribute('aria-expanded'),'false');
assert.equal(app.run('timerDeadline'),deadline); assert(app.run('isRunning'));
assert.equal(app.storage['pomodoro-widget-layout-v1'],layout);
mobile=false; app.run('syncResponsiveLayout()');
assert.equal(app.run('floatingWidgets.size'),1);
assert.equal(app.run('timerDeadline'),deadline);
// No identifying profile field is needed to save timer preferences.
const guest = boot({});
guest.get('editProfileButton').fire('click');
guest.get('profileNameInput').value='';
guest.get('profileRoleInput').value='';
guest.get('profileForm').fire('submit',{preventDefault(){}});
assert.equal(JSON.parse(guest.storage['pomodoro-local-profile']).name,'Guest');
assert.equal(boot(guest.storage).run('profile.name'),'Guest');
// Public help/privacy must work without JavaScript or third-party resources.
for(const file of ['help.html','privacy.html']) {
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert(html.includes('lang="en"')); assert(html.includes('name="viewport"'));
  assert(!/<script\b/.test(html)); assert(html.includes('href="./"'));
  assert(html.includes('href="audio/credits.html"'));
  for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    assert(!/^https?:/.test(match[1]),'Help/privacy should not require external assets');
    assert(fs.existsSync(path.join(root,match[1])));
  }
}
const privacy=fs.readFileSync(path.join(root,'privacy.html'),'utf8');
for(const text of ['Google Fonts','cdnjs','private browsing','Undo','YouTube','IP address','backups','site-data','Cookies &amp; browser storage','localStorage','optional']) assert(privacy.includes(text),text);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('href="help.html"')); assert(html.includes('href="privacy.html"'));
assert(!/<(?:audio|iframe)\b/i.test(html),'Initial load should not stream ambient recordings or YouTube');
const bootAssets=['index.html','base.css','style.css','tab-coordination.js','storage-safety.js','script.js','mini-timer.js','ambient.js','data-tools.js','history-editor.js'];
const bytes=bootAssets.reduce((total,file)=>total+fs.statSync(path.join(root,file)).size,0);
assert(bytes<250*1024,`Local startup assets grew beyond 250 KiB: ${bytes}`);
console.log(`PASS: mobile drawer/docking preserves timer and desktop layout; public help/privacy links work without JS; no initial media; local startup assets ${bytes} bytes.`);
console.log('NOTE: simulated responsive behavior is not a real-device, layout or screen-reader pass.');
