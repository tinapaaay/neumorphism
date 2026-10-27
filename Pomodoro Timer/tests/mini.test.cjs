const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/../script.js','utf8');
let now=new Date(2026,9,24,12).getTime(),uid=0;
const TIMER='pomodoro-timer-state-v1',HISTORY='pomodoro-focus-history-v1',LAYOUT='pomodoro-widget-layout-v1';
function boot(storage={},broken=false){
 const nodes={},intervals=new Map();let intervalId=0;
 class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.events={};this.attrs={};this.style={removeProperty(k){delete this[k]}};this.hidden=false;this.value='';this.offsetWidth=360;this.offsetHeight=180;this.className='';this.classList={add:(...xs)=>{this.className=[...new Set([...this.className.split(' '),...xs])].join(' ')},remove:(...xs)=>{this.className=this.className.split(' ').filter(x=>!xs.includes(x)).join(' ')},contains:x=>this.className.split(' ').includes(x),toggle:(x,on)=>{if(on===undefined)on=!this.classList.contains(x);on?this.classList.add(x):this.classList.remove(x);return on;}};}
  addEventListener(k,f){(this.events[k]||=[]).push(f)}
  fire(k,e={}){for(const f of this.events[k]||[])f(e)}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]}removeAttribute(k){delete this.attrs[k]}
  appendChild(n){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(x=>x!==n);n.parentNode=this;this.children.push(n);return n}
  replaceChildren(){this.children=[]}before(n){const p=this.parentNode,i=p.children.indexOf(this);p.children.splice(i,0,n);n.parentNode=p}
  replaceWith(n){const p=this.parentNode;if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(x=>x!==n);p.children[p.children.indexOf(this)]=n;n.parentNode=p;this.parentNode=null}
  contains(n){return n===this||this.children.some(x=>x.contains(n))}
  querySelector(sel){if(sel==='.widget-drag-handle')return this.handle;if(sel==='.widget-return')return this.returnButton;return this.children.find(x=>x.classList.contains(sel.slice(1)))||null}
  getBoundingClientRect(){const left=parseFloat(this.style.left)||100,top=parseFloat(this.style.top)||100;return {left,top,right:left+this.offsetWidth,bottom:top+this.offsetHeight,width:this.offsetWidth,height:this.offsetHeight}}
  focus(){doc.activeElement=this}setCustomValidity(s){this.validation=s}reportValidity(){}showModal(){this.open=true}close(){this.open=false;this.fire('close')}setPointerCapture(){}hasPointerCapture(){return false}
 }
 const get=id=>nodes[id]||=(Object.assign(new Element(),{id}));
 const doc={body:new Element('body'),events:{},getElementById:get,createElement:t=>new Element(t),querySelector:()=>get('stage'),querySelectorAll(sel){if(sel==='dialog[open]')return Object.values(nodes).filter(x=>x.open);if(sel==='.movable-widget')return widgets;if(sel==='#calendarDays .cal-day-cell')return get('calendarDays').children.filter(x=>x.classList.contains('cal-day-cell'));return []},addEventListener(k,fn){this.events[k]=fn}};
 const panel=get('sidebarPanel');doc.body.appendChild(panel);
 const widgets=['profileWidget','goalWidget','calendarWidget','ambientWidget'].map(id=>{const w=get(id);w.className='sidebar-widget movable-widget';w.dataset.widgetName=id;w.handle=new Element('button');w.returnButton=new Element('button');w.appendChild(w.handle);w.appendChild(w.returnButton);panel.appendChild(w);return w});
 const win={innerWidth:1200,innerHeight:900,crypto:{randomUUID:()=>`session-${++uid}`},events:{},addEventListener(k,f){this.events[k]=f}};
 const c={document:doc,window:win,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}},localStorage:{getItem:k=>{if(broken)throw Error('blocked');return storage[k]||null},setItem:(k,v)=>{if(broken)throw Error('blocked');storage[k]=v}},setTimeout:()=>1,clearTimeout:()=>{},setInterval:fn=>{intervals.set(++intervalId,fn);return intervalId},clearInterval:id=>intervals.delete(id)};
 vm.createContext(c);vm.runInContext(source,c);return {c,get,widgets,win,run:s=>vm.runInContext(s,c),storage};
}

(async()=>{
function miniWindow(app){
 const doc={documentElement:{},head:app.c.document.createElement('head'),body:app.c.document.createElement('body'),createElementNS:(ns,tag)=>app.c.document.createElement(tag),createElement:tag=>app.c.document.createElement(tag)};
 const events={},timers=new Map(),timeouts=new Map();let id=0;
 app.c.URL=URL;app.c.document.baseURI='http://localhost:5500/';
 return {document:doc,events,timers,timeouts,closed:false,setTimeout(fn,ms){timeouts.set(++id,{fn,ms});return id},clearTimeout(n){timeouts.delete(n)},focus(){},addEventListener(k,f){events[k]=f},setInterval(fn){timers.set(++id,fn);return id},clearInterval(n){timers.delete(n)},close(){this.closed=true;events.pagehide?.()}};
}
const miniCode=fs.readFileSync(__dirname+'/../mini-timer.js','utf8');
for(const pinned of [true,false]){
 const store={},app=boot(store);const popup=miniWindow(app);let opens=0;
 if(pinned)app.win.documentPictureInPicture={requestWindow:async()=>{opens++;return popup}};
 else app.win.open=()=>{opens++;return popup};
 app.win.focus=()=>{};vm.runInContext(miniCode,app.c);
 const open=app.get('miniTimerButton').events.click.at(-1);await open();assert.equal(opens,1);assert.equal(app.get('miniTimerButton').getAttribute('aria-pressed'),'true');assert.equal(popup.document.title,'25:00 · Focus');assert.equal(popup.document.head.children[0].href,'http://localhost:5500/base.css');assert.equal(popup.document.head.children[1].href,'http://localhost:5500/style.css');assert(popup.document.head.children[2].href.includes('family=Inter'));assert.equal(popup.document.body.children[0].children[1].className,'squircle-plate');
 const main=popup.document.body.children[0],dial=main.children[1].children[0].children[0],reset=main.children[4].children[0],skip=main.children[4].children[1];
 dial.fire('click');assert(app.run('isRunning'));assert(dial.classList.contains('is-pushed'));assert.equal(dial.getAttribute('aria-label'),'Pause · Focus · 25:00 remaining');
 const identity=app.run('timerSessionId');now+=61000;[...popup.timers.values()][0]();assert.equal(popup.document.title,'23:59 · Focus');assert.equal(app.run('timerSessionId'),identity);
 dial.fire('click');assert(!app.run('isRunning'));reset.fire('click');assert.equal(popup.document.title,'25:00 · Focus');app.run("setMode('break')");assert(!skip.hidden);skip.fire('click');assert(app.run('isRunning'));assert.equal(app.run('currentMode'),'pomodoro');
 app.run('currentTask="<img src=x onerror=alert(1)>";saveTimerState()');assert.equal(main.children[3].textContent,'<img src=x onerror=alert(1)>');assert.equal(main.children[3].children.length,0);
 popup.close();assert(app.run('isRunning'));assert.equal(popup.timers.size,0);assert.equal(app.get('miniTimerButton').getAttribute('aria-pressed'),'false');
}
// A visible mini view advances the original timer exactly once at its deadline.
const store={},app=boot(store),popup=miniWindow(app);app.win.open=()=>popup;vm.runInContext(miniCode,app.c);await app.get('miniTimerButton').events.click.at(-1)();app.run('handleDialPress()');now+=1501000;[...popup.timers.values()][0]();[...popup.timers.values()][0]();assert.equal(app.run('focusHistory.entries.length'),1);assert.equal(popup.document.title,'05:00 · Short break');assert(!app.run('isRunning'));app.win.events.pagehide();assert(popup.closed);
for(const pip of [false,true]){const app=boot({});if(pip)app.win.documentPictureInPicture={requestWindow:async()=>{throw Error('denied')}};else app.win.open=()=>null;vm.runInContext(miniCode,app.c);await app.get('miniTimerButton').events.click.at(-1)();assert(!app.get('miniTimerStatus').hidden);assert(!app.get('miniTimerButton').disabled);assert(!app.run('isRunning'));}
console.log('PASS: PiP/popup paths, one shared timer, controls, deadline updates, task text safety, session completion deduplication, close cleanup, parent unload and blocked-window recovery.');
})().catch(e=>{console.error(e);process.exit(1)});
