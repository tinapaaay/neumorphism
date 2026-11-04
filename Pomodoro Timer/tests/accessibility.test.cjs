const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { boot, advance } = require("./timer-fixture.cjs");
const a = boot({});
const dial = a.get("timerButton");
assert.match(dial.getAttribute("aria-label"), /Start · Focus · 25:00 remaining/);
assert.equal(dial.getAttribute("aria-pressed"), "false");
a.run("handleDialPress()");
assert.match(dial.getAttribute("aria-label"), /Pause · Focus/);
assert.equal(dial.getAttribute("aria-pressed"), "true");
let status = a.get("timerA11yStatus").textContent, writes = 0;
Object.defineProperty(a.get("timerA11yStatus"), "textContent", {
  get() { return status; }, set(value) { status = value; writes++; },
});
advance(2000); a.run("tickTimer();updateDisplay()");
assert.equal(writes, 0);
assert.match(dial.getAttribute("aria-label"), /24:58 remaining/);
a.run("pauseTimer()"); assert.equal(status, "Focus paused");
assert.match(dial.getAttribute("aria-label"), /Resume/);
a.run("toggleAudio()");
assert.equal(a.get("muteToggle").getAttribute("aria-pressed"), "true");
assert.equal(a.get("muteToggle").getAttribute("aria-label"), "Unmute timer sounds");
a.run("setMode('break')"); assert.equal(status, "Short break ready");
console.log("PASS: action/mode/countdown labels, pressed/mute state, and phase-only live announcements without per-tick chatter.");

a.run(`taskQueue=[{id:'a',name:'First task',done:false,dailyTarget:1},
  {id:'b',name:'Second task',done:false,dailyTarget:1}];resetTimer();renderTaskQueue()`);
const first = a.run('queueFocusTargets.get("a:select")'); first.focus();
a.run('selectQueueTask("a",true)');
assert.notEqual(a.c.document.activeElement, first);
assert.equal(a.c.document.activeElement.dataset.queueFocusKey, "a:select");
a.run('queueFocusTargets.get("a:edit").focus();openQueueTaskEditor("a")');
assert.equal(a.c.document.activeElement, a.get("editQueueTaskName"));
a.get("editQueueTaskName").value = "Renamed task";
a.get("editQueueTaskTarget").value = "2";
a.get("editQueueTaskForm").fire("submit", { preventDefault() {} });
assert.equal(a.c.document.activeElement.dataset.queueFocusKey, "a:edit");
a.run('queueFocusTargets.get("a:delete").focus();deleteQueueTask("a")');
assert.equal(a.c.document.activeElement.dataset.queueFocusKey, "b:check");
a.run('queueFocusTargets.get("b:delete").focus();deleteQueueTask("b")');
assert.equal(a.c.document.activeElement, a.get("queueTaskInput"));
const reduced = boot({});
reduced.win.matchMedia = (query) => ({ matches: query.includes("reduced-motion") });
reduced.run('taskQueue=[{id:"done",name:"Complete me",done:false,dailyTarget:1}];renderTaskQueue();queueFocusTargets.get("done:check").focus();toggleQueueTask("done")');
assert.equal(reduced.c.document.activeElement, reduced.get("queueTaskInput"));
console.log("PASS: rerender preserves queue action focus; editor Save returns focus; deletion chooses a usable next target.");

a.run('historyMonth=new Date(2026,9,1);selectedHistoryDay="2026-10-31";renderCalendar()');
function cells() { return a.get("calendarDays").children.filter((cell) => cell.dataset.date); }
assert.equal(cells().filter((cell) => cell.tabIndex === 0).length, 1);
let selected = cells().find((cell) => cell.tabIndex === 0), prevented = 0;
selected.fire("keydown", { key: "ArrowRight", preventDefault() { prevented++; } });
assert.equal(prevented, 1);
assert.equal(a.c.document.activeElement.dataset.date, "2026-11-1");
assert.equal(cells().filter((cell) => cell.tabIndex === 0).length, 1);
a.c.document.activeElement.fire("keydown", { key: "Home", preventDefault() {} });
assert.equal(a.c.document.activeElement.dataset.date, "2026-10-26");
a.c.document.activeElement.fire("keydown", { key: "ArrowUp", preventDefault() {} });
assert.equal(a.c.document.activeElement.dataset.date, "2026-10-19");
a.run('historyMonth=new Date(2026,0,1);selectedHistoryDay="2026-1-17";renderCalendar()');
assert.equal(cells().filter((cell) => cell.tabIndex === 0).length, 1);
a.run("setSidebarOpen(true);historyPopup.hidden=false");
a.get("sidebarShell").fire("keydown", { key: "Escape", preventDefault() {}, stopPropagation() {} });
assert.equal(a.get("historyPopup").hidden, true);
assert.equal(a.get("sidebarToggle").getAttribute("aria-expanded"), "true");
a.get("sidebarShell").fire("keydown", { key: "Escape" });
assert.equal(a.get("sidebarToggle").getAttribute("aria-expanded"), "false");
assert.equal(a.c.document.activeElement, a.get("sidebarToggle"));
console.log("PASS: one calendar tab stop, arrow/week/Home/month-boundary navigation, tooltip-first Escape and drawer focus return.");

// Model the native blur/focusout that real DOM removal causes. The basic fixture
// intentionally does not dispatch those events, so cover their ordering here.
const native = boot({});
const shell = native.get("sidebarShell"), panel = native.get("sidebarPanel");
shell.appendChild(panel); shell.appendChild(native.get("sidebarToggle"));
for (const id of ["taskQueueList", "completedTaskQueueList", "queueTaskInput", "calendarDays"]) panel.appendChild(native.get(id));
const deferred = new Map(); let timeout = 0;
native.c.setTimeout = (fn) => { deferred.set(++timeout, fn); return timeout; };
native.c.clearTimeout = (id) => deferred.delete(id);
const flushFocus = () => {
  const callbacks = [...deferred.values()]; deferred.clear(); callbacks.forEach((fn) => fn());
};
for (const id of ["taskQueueList", "calendarDays"]) {
  const container = native.get(id), replace = container.replaceChildren.bind(container);
  container.replaceChildren = () => {
    const removedFocus = container.contains(native.c.document.activeElement);
    replace();
    if (removedFocus) {
      native.c.document.activeElement = null;
      shell.fire("focusout", { relatedTarget: null });
    }
  };
}
native.run('taskQueue=[{id:"native",name:"Keep focus",done:false,dailyTarget:1}];renderTaskQueue();setSidebarOpen(true);queueFocusTargets.get("native:select").focus();selectQueueTask("native")');
assert.equal(native.get("sidebarToggle").getAttribute("aria-expanded"), "true");
flushFocus();
assert.equal(native.get("sidebarToggle").getAttribute("aria-expanded"), "true");
assert.equal(native.c.document.activeElement.dataset.queueFocusKey, "native:select");
native.run('historyMonth=new Date(2026,9,1);selectedHistoryDay="2026-10-31";renderCalendar()');
const date = native.get("calendarDays").children.find((cell) => cell.dataset.date === "2026-10-31");
date.focus(); date.fire("keydown", { key: "ArrowRight", preventDefault() {} });
flushFocus();
assert.equal(native.get("sidebarToggle").getAttribute("aria-expanded"), "true");
assert.equal(native.c.document.activeElement.dataset.date, "2026-11-1");
native.get("currentTaskInput").focus(); shell.fire("focusout", { relatedTarget: native.get("currentTaskInput") });
flushFocus();
assert.equal(native.get("sidebarToggle").getAttribute("aria-expanded"), "false");
native.run('editingQueueTaskId="native";document.getElementById("queueTaskEditor").close()');
assert.equal(native.get("sidebarToggle").getAttribute("aria-expanded"), "true");
assert.equal(native.c.document.activeElement.dataset.queueFocusKey, "native:edit");
console.log("PASS: native-like removal/focusout ordering cannot close the drawer during queue/calendar rebuilds; real focus exit still closes it; editor return reopens it.");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
assert(html.includes('role="timer" aria-live="off"'));
assert(html.includes('id="calendarKeyboardHint"'));
assert(/id="timerA11yStatus"[^>]*>[\s\S]*?<\/p>\s*<div class="current-task"/.test(html));
assert(css.includes("outline: 3px solid var(--color-primary)"));
assert(css.includes("--color-primary: #2d627f;"));
assert(css.includes("min-height: 44px"));
assert(css.includes("animation: none !important"));
assert(css.includes("transition: none !important"));
function luminance(hex) {
  const c = hex.match(/[0-9a-f]{2}/gi).map((x) => parseInt(x, 16) / 255)
    .map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
for (const foreground of ["4b6575", "425e70", "2d627f"]) {
  for (const background of ["dce5ec", "e4edf3", "dde6ec"]) {
    const ratio = (luminance(background) + 0.05) / (luminance(foreground) + 0.05);
    assert(ratio >= 4.5, `${foreground}/${background}: ${ratio}`);
  }
}
console.log("PASS: accessible markup hooks, motion/focus/touch CSS rules, and selected text/background pairs exceed 4.5:1.");
console.log("NOTE: DOM/clock tests and static CSS checks do not replace real screen-reader, zoom, or touch testing.");
