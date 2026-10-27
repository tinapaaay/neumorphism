const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname, '../script.js'),'utf8');
let now=new Date(2026,9,24,12).getTime(),uid=0;
const TIMER='pomodoro-timer-state-v1',HISTORY='pomodoro-focus-history-v1',LAYOUT='pomodoro-widget-layout-v1';
function boot(storage={},broken=false,overrides={}){
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
 Object.assign(c.localStorage,overrides);vm.createContext(c);vm.runInContext(source,c);return {c,get,widgets,win,run:s=>vm.runInContext(s,c),storage};
}

module.exports={boot,setNow(value){now=value},advance(ms){now+=ms},getNow(){return now},TIMER,HISTORY};
