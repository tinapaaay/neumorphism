const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { boot, advance, setNow, HISTORY, TIMER } = require("./timer-fixture.cjs");
const safetySource = fs.readFileSync(path.join(__dirname, "../storage-safety.js"), "utf8");
const dataSource = fs.readFileSync(path.join(__dirname, "../data-tools.js"), "utf8");
const JOURNAL = "pomodoro-storage-transaction-v1";
const PROFILE = "pomodoro-local-profile";
const UNDO = "pomodoro-before-restore-v1";

function harness(initial = {}) {
  const data = { ...initial };
  let quota = Infinity, denyWrites = false;
  const storage = {
    getItem: (key) => data[key] ?? null,
    setItem(key, value) {
      if (denyWrites) throw Error("Storage blocked");
      const candidate = { ...data, [key]: String(value) };
      if (JSON.stringify(candidate).length > quota) throw Error("QuotaExceededError");
      data[key] = String(value);
    },
    removeItem: (key) => { delete data[key]; },
  };
  const context = { window: {}, localStorage: storage };
  vm.runInNewContext(safetySource, context);
  return { data, storage, safety: context.window.PomodoroStorageSafety,
    set quota(value) { quota = value; }, set denyWrites(value) { denyWrites = value; } };
}

let h = harness({ [PROFILE]: '{"name":"Original"}', [HISTORY]: '{"version":1,"entries":[],"baselineSeconds":0}' });
let original = { ...h.data };
h.quota = JSON.stringify(h.data).length + 1;
assert.throws(() => h.safety.transact({ [PROFILE]: '{"name":"New"}' }), /No saved data was changed/);
assert.deepEqual(h.data, original);
console.log("PASS: insufficient journal space leaves all original data byte-for-byte unchanged.");

h.quota = Infinity;
const realSet = h.storage.setItem;
let fail = true;
h.storage.setItem = (key, value) => {
  if (key === HISTORY && fail) { fail = false; throw Error("QuotaExceededError"); }
  realSet(key, value);
};
assert.throws(() => h.safety.transact({ [PROFILE]: '{"name":"New"}', [HISTORY]: "{}" }), /previous data was restored/);
assert.deepEqual(h.data, original);
console.log("PASS: partial restore rolls back profile/history and removes its journal only after successful recovery.");

h.storage.setItem = (key, value) => {
  if (key === HISTORY) h.denyWrites = true;
  realSet(key, value);
};
let blockedNotices = 0;
h.safety.onBlocked = () => { blockedNotices++; };
assert.throws(() => h.safety.transact({ [PROFILE]: '{"name":"New"}', [HISTORY]: "{}" }), /preserved in a recovery copy/);
assert(h.data[JOURNAL]);
assert.equal(h.safety.blocked, true);
assert.equal(blockedNotices, 1);
const durable = JSON.parse(h.data[JOURNAL]).before;
for (const [key, value] of Object.entries(original)) assert.equal(durable[key], value);
h.denyWrites = false; h.storage.setItem = realSet;
h.safety.recover(); assert.deepEqual(h.data, original);
assert.equal(h.safety.blocked, false);
console.log("PASS: persistent write failure retains a complete durable before-image; later recovery restores it exactly.");

// Simulate termination after the journal and one replacement write reached disk.
h.storage.setItem(JOURNAL, JSON.stringify({ version: 1, before: durable }));
h.storage.setItem(PROFILE, '{"name":"Interrupted replacement"}');
const reboot = harness(h.data); reboot.safety.recover();
assert.deepEqual(reboot.data, original);
console.log("PASS: interrupted multi-key restore recovers its before-image on a fresh startup.");

for (const raw of ["{broken", "null", "[]", '"text"']) {
  const corrupt = harness({ [HISTORY]: raw });
  assert.throws(() => corrupt.safety.inspect(), /damaged|unexpected format/);
  assert.equal(corrupt.data[HISTORY], raw);
}
const badJournal = harness({ [JOURNAL]: "{broken", [PROFILE]: '{"name":"Keep"}' });
assert.throws(() => badJournal.safety.recover(), /recovery copy is damaged/);
assert.equal(badJournal.data[JOURNAL], "{broken");
const notified = harness({ "pomodoro-last-notification-v1": '"session-123"' });
assert.doesNotThrow(() => notified.safety.inspect());
for (const [key, value] of [
  [HISTORY, { version: 1, baselineSeconds: 0, entries: [{ id: "broken", seconds: -1, endedAt: 0 }] }],
  ["pomodoro-task-queue-v1", { version: 1, tasks: [{ id: "broken", name: "" }] }],
  [TIMER, { version: 1, mode: "unknown" }],
]) {
  const raw = JSON.stringify(value), broken = harness({ [key]: raw });
  assert.throws(() => broken.safety.inspect(), /damaged/);
  assert.equal(broken.data[key], raw);
}
console.log("PASS: corrupt JSON/invalid root shapes and damaged journals are preserved and blocked; valid notification IDs remain supported.");

setNow(new Date(2026, 9, 27, 12).getTime());
let store = {}, a = boot(store);
a.run("animateSessionToGoal=()=>{};sendSessionNotification=()=>{};handleDialPress()");
const setItem = a.c.localStorage.setItem;
let historyBlocked = true;
a.c.localStorage.setItem = (key, value) => {
  if (key === HISTORY && historyBlocked) throw Error("QuotaExceededError");
  setItem(key, value);
};
advance(1500_000); a.run("tickTimer()");
assert.equal(a.run("completionPending"), true);
assert.equal(a.run("isRunning"), false);
assert.equal(a.run("currentMode"), "pomodoro");
assert.equal(a.run("focusHistory.entries.length"), 1);
assert.equal(JSON.parse(store[TIMER]).completionPending, true);
assert.equal(JSON.parse(store[HISTORY]).entries.length, 0);
a.run("resetTimer()"); assert.equal(a.run("completionPending"), true);
// Export still includes the unsaved completion, without requiring another write.
a.c.localStorage.removeItem = (key) => delete store[key];
vm.runInContext(safetySource, a.c); vm.runInContext(dataSource, a.c);
assert.equal(a.run("makePomodoroBackup().history.entries.length"), 1);
a.run('taskQueue.push({id:"other",name:"Other task",dailyTarget:1,done:false});selectQueueTask("other")');
assert.equal(a.run("selectedTaskId"), null);
a.run("pendingBackup=validatePomodoroBackup(makePomodoroBackup())");
a.get("confirmRestoreBackup").events.click[0]();
assert.match(a.get("restoreBackupStatus").textContent, /Save your finished session/);
assert.equal(a.run("completionPending"), true);
historyBlocked = false;
a.run("handleDialPress()");
assert.equal(a.run("completionPending"), false);
assert.equal(a.run("currentMode"), "break");
assert.equal(a.run("isRunning"), false);
assert.equal(JSON.parse(store[HISTORY]).entries.length, 1);
console.log("PASS: failed history save keeps completion pending/exportable; reset cannot discard it; retry saves once before changing mode.");

setNow(new Date(2026, 9, 27, 23, 30).getTime());
store = {}; a = boot(store); a.run("handleDialPress()");
const persistentFailure = { setItem(key, value) {
  if (key === HISTORY) throw Error("QuotaExceededError");
  store[key] = value;
} };
Object.assign(a.c.localStorage, persistentFailure);
advance(1500_000); a.run("tickTimer()");
advance(3 * 3600_000);
a = boot(store, false, persistentFailure);
assert.equal(a.run("completionPending"), true);
assert.equal(a.run("focusHistory.entries.length"), 1);
assert.equal(a.run("focusHistory.entries[0].day"), "2026-10-27");
a.c.localStorage.setItem = (key, value) => { store[key] = value; };
a.run("handleDialPress()");
assert.equal(JSON.parse(store[HISTORY]).entries.length, 1);
const completedId = JSON.parse(store[HISTORY]).entries[0].id;
// Replay an interrupted pre-transition timer against already-durable history.
const timer = JSON.parse(store[TIMER]);
store[TIMER] = JSON.stringify({ ...timer, mode: "pomodoro", totalSeconds: 1500,
  remainingSeconds: 0, running: false, sessionId: completedId, completionPending: true });
a = boot(store);
assert.equal(a.run("focusHistory.entries.length"), 1);
assert.equal(a.run("currentMode"), "break");
console.log("PASS: pending completion survives reload; crash after durable history does not create duplicate credit.");

// Exercise the real backup and Undo handlers with representative saved data.
a.c.localStorage.removeItem = (key) => delete store[key];
vm.runInContext(safetySource, a.c); vm.runInContext(dataSource, a.c);
a.run("var backup = validatePomodoroBackup(makePomodoroBackup())");
const before = { ...store };
a.run("applyPomodoroBackup(backup)");
assert(store[UNDO]); assert(!store[TIMER]); assert(!store[JOURNAL]);
let reloads = 0; a.win.location = { reload() { reloads++; } };
a.get("undoBackupRestore").events.click[0]();
assert.equal(reloads, 1);
assert.equal(store[HISTORY], before[HISTORY]);
assert.equal(JSON.parse(store[TIMER]).running, false);
assert(!store[UNDO]); assert(!store[JOURNAL]);
console.log("PASS: real backup round trip and Undo preserve history and restore a paused timer through durable transactions.");
