const fs=require('fs'),vm=require('vm'),assert=require('assert');
(async()=>{
const nodes={},store={},sources=[],tracks=[],events={},actions={};let failNext=false,delayNext=false,resolvePlay;
const get=id=>nodes[id]||=({value:id==='ambientSoundSelect'?'rain':id==='ambientVolume'?'35':'',events:{},addEventListener(k,f){this.events[k]=f},setAttribute(k,v){this[k]=v}});
class NativeAudio{constructor(src){this.src=src;this.events={};this.currentTime=0;this.paused=true;tracks.push(this)}addEventListener(k,f){this.events[k]=f}play(){this.paused=false;if(failNext){failNext=false;return Promise.reject(Error('blocked'))}if(delayNext){delayNext=false;return new Promise(resolve=>resolvePlay=resolve)}return Promise.resolve()}pause(){this.paused=true}removeAttribute(k){delete this[k]}load(){}}
class FakeAudioContext{constructor(){this.currentTime=0}resume(){return Promise.resolve()}createGain(){return{gain:{setValueAtTime(){},setTargetAtTime(){}},connect(){}}}createBuffer(c,n,r){return{getChannelData:()=>new Float32Array(n)}}createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true},stop(){assert(!this.stopped);this.stopped=true}};sources.push(s);return s}}
const c={document:{getElementById:get},Audio:NativeAudio,navigator:{mediaSession:{setActionHandler(k,f){actions[k]=f}}},window:{AudioContext:FakeAudioContext,addEventListener(k,f){events[k]=f}},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v}};
vm.createContext(c);const code=fs.readFileSync(__dirname+'/../ambient.js','utf8');vm.runInContext(code,c);
const settle=async()=>{await Promise.resolve();await Promise.resolve()};
assert.equal(tracks.length,0);assert.equal(get('ambientPlayButton').textContent,'Play');
get('ambientPlayButton').events.click();await settle();assert.equal(tracks[0].src,'audio/rain.mp3');assert(tracks[0].loop);assert(!tracks[0].paused);
// No sidebar/visibility listener pauses native audio.
assert(!events.visibilitychange);assert(!events.rainplayback);assert.equal(get('ambientPlayButton').textContent,'Pause');
for(const kind of ['fireplace','beach','jazz','cafe']){get('ambientSoundSelect').value=kind;get('ambientSoundSelect').events.change();await settle();assert(tracks.at(-2).paused);assert(!tracks.at(-1).paused);assert(tracks.at(-1).src.startsWith('audio/'));assert.equal(get('ambientStatus').textContent,`${{fireplace:'Fireplace',beach:'Beach',jazz:'Jazz',cafe:'Coffee shop'}[kind]} is playing.`)}
get('ambientVolume').value='0';get('ambientVolume').events.input();assert.equal(tracks.at(-1).volume,0);get('ambientVolume').value='70';get('ambientVolume').events.input();assert.equal(tracks.at(-1).volume,.7);assert.equal(JSON.parse(store['pomodoro-ambient-settings-v1']).volume,70);
tracks.at(-1).currentTime=31;actions.pause();assert(tracks.at(-1).paused);actions.play();await settle();assert.equal(tracks.at(-1).currentTime,31);assert.equal(get('ambientPlayButton').textContent,'Pause');
get('ambientSoundSelect').value='white';get('ambientSoundSelect').events.change();await settle();assert(tracks.at(-1).paused);assert(sources.at(-1).started);assert(get('ambientBackgroundLink').hidden);
get('ambientPlayButton').events.click();assert(sources.at(-1).stopped);get('ambientSoundSelect').value='rain';get('ambientSoundSelect').events.change();failNext=true;get('ambientPlayButton').events.click();await settle();assert.equal(get('ambientPlayButton').textContent,'Play');assert(tracks.at(-1).paused);
delayNext=true;get('ambientPlayButton').events.click();get('ambientPlayButton').events.click();resolvePlay();await settle();assert(tracks.at(-1).paused);assert.equal(get('ambientPlayButton').textContent,'Play');
get('ambientPlayButton').events.click();await settle();get('ambientBackgroundLink').events.click();assert(tracks.at(-1).paused);assert.equal(get('ambientPlayButton').textContent,'Play');
get('ambientPlayButton').events.click();await settle();events.pagehide();assert(tracks.at(-1).paused);
vm.runInContext(code,c);assert.equal(get('ambientVolume').value,70);assert.equal(get('ambientPlayButton').textContent,'Play');
for(const file of ['rain.mp3','fireplace.wav','beach.ogg','jazz.ogg','coffee-shop.ogg'])assert(fs.statSync(__dirname+'/../audio/'+file).size>10000);
console.log('PASS: five local recordings, loops, no sidebar/visibility pause, switching, volume, pause/resume position, media controls, failure recovery, rapid play/pause, optional YouTube link, unload and saved preferences without autoplay.');
})().catch(e=>{console.error(e);process.exit(1)});
