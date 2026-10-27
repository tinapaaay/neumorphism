const assert = require("node:assert/strict");
const { boot, setNow, advance, getNow, HISTORY } = require("./timer-fixture.cjs");
const start = new Date(2026, 9, 27, 12).getTime();

function app() {
  setNow(start);
  const a = boot({});
  a.run(`
    var alerts = [], sounds = [];
    sendSessionNotification = (...args) => alerts.push(args);
    playAudioFeedback = (kind) => sounds.push(kind);
    animateSessionToGoal = () => {};
    profile.autoStartBreaks = true;
    profile.autoStartFocus = true;
    profile.preFinishCue = true;
    handleDialPress();
    sounds = [];
  `);
  return a;
}

let a = app();
advance(90_000); a.run("tickTimer()");
assert.equal(a.get("timeText").textContent, "23:30");
assert.equal(a.run("isRunning"), true);
assert.equal(a.run("focusHistory.entries.length"), 0);
a.run("pauseTimer()"); advance(8 * 3600_000);
a.win.events.focus();
assert.equal(a.get("timeText").textContent, "23:30");
assert.equal(a.run("isRunning"), false);
console.log("PASS: suspended callbacks catch up to deadline; paused time stays fixed across an eight-hour gap.");

a = app();
advance(8 * 3600_000); a.run("tickTimer()");
assert.equal(a.run("focusHistory.entries.length"), 1);
assert.equal(a.run("focusHistory.entries[0].seconds"), 1500);
assert.equal(a.run("focusHistory.entries[0].endedAt"), start + 1500_000);
assert.equal(a.run("currentMode"), "break");
assert.equal(a.run("isRunning"), false);
assert.equal(a.run("alerts.length"), 0);
assert.equal(a.run("sounds.length"), 0);
a.run("tickTimer();tickTimer()"); a.win.events.focus();
a.c.document.events.resume(); a.c.document.events.visibilitychange();
assert.equal(a.run("focusHistory.entries.length"), 1);
console.log("PASS: waking eight hours late credits one original session, with no stale cue/alert, auto-start or invented cycles.");

const restored = boot(a.storage);
assert.equal(restored.run("focusHistory.entries.length"), 1);
assert.equal(restored.run("isRunning"), false);
assert.equal(JSON.parse(a.storage[HISTORY]).entries.length, 1);
console.log("PASS: reload after wake cannot duplicate completed focus credit.");

for (const event of ["focus", "resume", "visibilitychange"]) {
  a = app(); advance(1501_000);
  if (event === "focus") a.win.events.focus();
  else a.c.document.events[event]();
  assert.equal(a.run("focusHistory.entries.length"), 1);
  assert.equal(a.run("isRunning"), false);
  assert.equal(a.run("alerts.length"), 0);
}
console.log("PASS: focus, resume and visible-page recovery immediately reconcile an expired timer without stale effects.");

a = app(); a.c.document.hidden = true;
advance(1510_000); a.run("tickTimer()");
assert.equal(a.run("focusHistory.entries.length"), 1);
assert.equal(a.run("alerts.length"), 1);
assert.equal(a.run("currentMode"), "break");
assert.equal(a.run("isRunning"), true);
assert.equal(a.run("timerDeadline"), getNow() + 300_000);
console.log("PASS: a recent background completion still notifies and honors optional auto-start.");

a = app(); a.run("setMode('break');handleDialPress();sounds=[]");
advance(4 * 3600_000); a.run("tickTimer()");
assert.equal(a.run("focusHistory.entries.length"), 0);
assert.equal(a.run("currentMode"), "pomodoro");
assert.equal(a.run("isRunning"), false);
assert.equal(a.run("alerts.length"), 0);
assert.equal(a.run("sounds.length"), 0);
console.log("PASS: a break expired during suspension prepares idle focus without adding work or starting another cycle.");

a = app();
setNow(new Date(2026, 9, 27, 23, 30).getTime());
a.run("resetTimer();handleDialPress();sounds=[]");
advance(3 * 3600_000); a.run("tickTimer()");
assert.equal(a.run("focusHistory.entries[0].day"), "2026-10-27");
assert.equal(a.run("focusHistory.entries.length"), 1);
console.log("PASS: crossing midnight credits the deadline's local date, not the later wake date.");
