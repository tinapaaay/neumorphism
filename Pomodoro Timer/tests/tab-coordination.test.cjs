const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../tab-coordination.js"), "utf8");
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

// Browser lock lifetime is simulated explicitly; application storage is shared.
function environment() {
  let owner = null;
  const pending = [];
  const storage = { tasks: [], sessions: [], deadline: null };
  const pump = () => {
    if (owner || !pending.length) return;
    const item = pending.shift();
    owner = item;
    Promise.resolve().then(item.callback).then(() => {
      if (owner === item) owner = null;
      item.resolve(); pump();
    }, (error) => { if (owner === item) owner = null; item.reject(error); pump(); });
  };
  function open(id, options = {}) {
    const nodes = {}, events = {}, loaded = [], timers = new Map();
    let timerId = 0;
    let reloads = 0, snapshot;
    const node = (name) => nodes[name] ||= {
      hidden: name !== "tabGuard", inert: true, style: {},
      addEventListener(type, fn) { this[type] = fn; },
    };
    const locks = {
      request(name, callback) {
        assert.equal(name, "neumorphism-pomodoro-app-v1");
        return options.rejectLock ? Promise.reject(Error("blocked")) : new Promise((resolve, reject) => {
          pending.push({ id, callback, resolve, reject }); pump();
        });
      },
    };
    const context = {
      setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
      clearTimeout(id) { timers.delete(id); },
      navigator: options.unsupported ? {} : { locks },
      document: {
        getElementById: node,
        createElement: () => ({}),
        body: { appendChild(script) {
          loaded.push(script.src);
          Promise.resolve().then(() => {
            if (script.src === options.hangScript) return;
            if (script.src === options.runtimeScript) {
              events.error({filename: `https://example.test/pomodoro/${script.src}?v=1`});
              script.onload?.(); return;
            }
            if (script.src === options.failScript) return script.onerror();
            if (script.src === "storage-safety.js") context.window.PomodoroStorageSafety = {
              recover() {}, inspect() {
                if (options.corrupt) { const error = Error("Damaged saved data"); error.storageSafety = true; throw error; }
              },
            };
            if (script.src === "script.js") snapshot = JSON.parse(JSON.stringify(storage));
            script.onload();
          });
        } },
      },
      window: {
        location: { reload() { reloads++; } },
        addEventListener(name, fn) { events[name] = fn; },
        removeEventListener(name, fn) { if (events[name] === fn) delete events[name]; },
      },
    };
    vm.runInNewContext(source, context);
    return {
      loaded, node, events,
      expireLoads() { for (const fn of [...timers.values()]) fn(); },
      get snapshot() { return snapshot; }, get reloads() { return reloads; },
      close() {
        events.pagehide();
        for (let i = pending.length - 1; i >= 0; i--) {
          if (pending[i].id === id) pending.splice(i, 1);
        }
        if (owner?.id === id) owner = null;
        pump();
      },
    };
  }
  return { open, storage };
}

(async () => {
  const env = environment();
  const a = env.open("a"), b = env.open("b");
  await flush();
  assert.deepEqual(a.loaded, ["storage-safety.js", "script.js", "mini-timer.js", "ambient.js", "data-tools.js", "history-editor.js"]);
  assert.deepEqual(b.loaded, []);
  assert.equal(a.node("pomodoroApp").inert, false);
  assert.equal(a.node("tabGuard").hidden, true);
  assert.equal(b.node("pomodoroApp").hidden, true);
  assert.match(b.node("tabGuardMessage").textContent, /close it to continue here/);
  // Only the owner can have a timer, queue or history writer. A suspended owner
  // retains its lock: no timeout/clock jump gives a second tab permission.
  env.storage.tasks.push({ id: "a", name: "Keep this task" });
  env.storage.sessions.push({ id: "focus-1" });
  env.storage.deadline = 123456789;
  await flush(); assert.deepEqual(b.loaded, []);
  a.close(); await flush();
  assert.equal(b.snapshot.tasks[0].name, "Keep this task");
  assert.deepEqual(b.snapshot.sessions, [{ id: "focus-1" }]);
  assert.equal(b.snapshot.deadline, 123456789);
  assert.equal(b.node("pomodoroApp").inert, false);
  assert.equal(b.loaded.length, 6);
  console.log("PASS: one owner, waiting tab cannot boot/write, no lease timeout, fresh tasks/history/deadline on handoff.");

  const c = env.open("c"), d = env.open("d"); await flush();
  c.close(); b.close(); await flush();
  assert.equal(c.loaded.length, 0); assert.equal(d.loaded.length, 6);
  d.events.pageshow({ persisted: true }); assert.equal(d.reloads, 1);
  console.log("PASS: closing a waiting tab does not block the next tab; cached pages reload before reuse.");

  const failed = environment();
  const broken = failed.open("broken", { failScript: "ambient.js" });
  const waiting = failed.open("waiting"); await flush();
  assert.equal(broken.node("pomodoroApp").hidden, true);
  assert.equal(broken.node("tabGuardRetry").hidden, false);
  assert.equal(waiting.loaded.length, 0);
  assert.equal(broken.loaded.includes("data-tools.js"), false);
  broken.node("tabGuardRetry").click(); assert.equal(broken.reloads, 1);
  broken.close(); await flush(); assert.equal(waiting.loaded.length, 6);
  console.log("PASS: partial startup failure retains ownership until close, provides retry, and prevents a second writer.");

  for (const options of [{ unsupported: true }, { rejectLock: true }]) {
    const blocked = environment().open("blocked", options); await flush();
    assert.equal(blocked.loaded.length, 0);
    assert.equal(blocked.node("pomodoroApp").hidden, true);
    assert.equal(blocked.node("tabGuardRetry").hidden, false);
  }
  console.log("PASS: missing/denied locking fails visibly without starting competing application state.");

  const corrupt = environment().open("corrupt", { corrupt: true }); await flush();
  assert.deepEqual(corrupt.loaded, ["storage-safety.js"]);
  assert.equal(corrupt.node("pomodoroApp").hidden, true);
  assert.equal(corrupt.node("tabGuardRecovery").hidden, false);
  assert.match(corrupt.node("tabGuardTitle").textContent, /needs recovery/);
  console.log("PASS: damaged storage blocks all application writers before boot and offers a recovery download.");

  for (const options of [{hangScript: "history-editor.js"}, {runtimeScript: "script.js"}]) {
    const failing = environment();
    const owner = failing.open("owner", options), next = failing.open("next");
    await flush();
    if (options.hangScript) owner.expireLoads();
    await flush();
    assert.equal(owner.node("pomodoroApp").hidden, true);
    assert.equal(owner.node("tabGuardRetry").hidden, false);
    assert.equal(owner.node("tabGuardTitle").textContent, "Your timer could not load");
    assert.equal(next.loaded.length, 0);
    owner.close(); await flush(); assert.equal(next.loaded.length, 6);
  }
  console.log("PASS: stalled loads and startup runtime errors show retry without releasing ownership to a competing writer.");

  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  for (const file of ["storage-safety.js", "script.js", "mini-timer.js", "ambient.js", "data-tools.js", "history-editor.js"]) {
    assert.equal(html.includes(`<script src="${file}">`), false);
  }
  assert(html.includes('<script src="tab-coordination.js"></script>'));
  assert(html.includes('id="pomodoroApp" hidden inert'));
  console.log("PASS: HTML routes all application scripts through ownership gate; initial controls are hidden/inert.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
