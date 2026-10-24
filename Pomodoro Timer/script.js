// State
let totalSeconds = 25 * 60;
let remainingSeconds = 25 * 60;
let isRunning = false;
let timerInterval = null;
let soundEnabled = true;
let currentMode = "pomodoro";
let timerDeadline = null;
let hintTimeout = null;
let timerSessionId = null;
let currentTask = "";
const TIMER_STORAGE_KEY = "pomodoro-timer-state-v1";

// Tone.js Synths
let mechanicalClickSynth = null;
let popUpSynth = null;
let finishChimeSynth = null;
let rewardPopSynth = null;

function initAudio() {
  if (!mechanicalClickSynth && window.Tone) {
    // Heavy tactile push down click
    mechanicalClickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.035,
      octaves: 3,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.06 },
    }).toDestination();
    mechanicalClickSynth.volume.value = -8;

    // Snappy spring pop-up release sound
    popUpSynth = new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves: 2.2,
      oscillator: { type: "sine" },
      envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.08 },
    }).toDestination();
    popUpSynth.volume.value = -10;

    // Rounded, quiet notes leave space for the tactile landing sound.
    finishChimeSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.004, decay: 0.45, sustain: 0, release: 0.65 },
    }).toDestination();
    finishChimeSynth.volume.value = -18;

    rewardPopSynth = new Tone.MembraneSynth({
      pitchDecay: 0.012,
      octaves: 1.4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.11, sustain: 0, release: 0.08 },
    }).toDestination();
    rewardPopSynth.volume.value = -17;
  }
}

function playAudioFeedback(action) {
  if (!soundEnabled) return;
  try {
    if (window.Tone && Tone.context.state !== "running") {
      Tone.start();
    }
    initAudio();

    if (action === "pushDown" && mechanicalClickSynth) {
      mechanicalClickSynth.triggerAttackRelease("D2", "16n");
    } else if (action === "popUp" && popUpSynth) {
      popUpSynth.triggerAttackRelease("A3", "16n");
    } else if (action === "rewardLaunch" && rewardPopSynth) {
      rewardPopSynth.triggerAttackRelease("C4", "64n", Tone.now(), 0.55);
    } else if (
      (action === "rewardLand" || action === "finish") &&
      finishChimeSynth
    ) {
      const now = Tone.now();
      if (action === "rewardLand" && rewardPopSynth) {
        rewardPopSynth.triggerAttackRelease("G4", "64n", now, 0.4);
      }
      // A short rising reward, synchronized to the bead receiving the circle.
      finishChimeSynth.triggerAttackRelease("E5", "16n", now + 0.015, 0.55);
      finishChimeSynth.triggerAttackRelease("G5", "16n", now + 0.085, 0.45);
      finishChimeSynth.triggerAttackRelease("C6", "8n", now + 0.155, 0.35);
    }
  } catch (e) {}
}

function formatTime(secs) {
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  const mm = mins < 10 ? "0" + mins : mins;
  const ss = remainingSecs < 10 ? "0" + remainingSecs : remainingSecs;
  return `${mm}:${ss}`;
}

function updateDisplay() {
  const display = document.getElementById("timeText");
  display.textContent = formatTime(remainingSeconds);
  document.title = isRunning
    ? `(${formatTime(remainingSeconds)}) Running...`
    : "Neumorphic Pomodoro Timer";
}

function showHint(text) {
  const annotation = document.getElementById("annotationEl");
  document.getElementById("annotationLabel").textContent = text;
  annotation.classList.remove("is-hidden");
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => {
    annotation.classList.add("is-hidden");
  }, 3000);
}

function setDialVisualState(pushed) {
  const dial = document.getElementById("timerButton");
  document
    .getElementById("plateElement")
    .classList.toggle("is-running", pushed);
  document
    .getElementById("breakMessage")
    .setAttribute("aria-hidden", String(currentMode === "pomodoro" || pushed));

  if (pushed) {
    // Pushed down into socket
    dial.classList.add("is-pushed");
    showHint("Push to pause");
  } else {
    // Popped back out / raised
    dial.classList.remove("is-pushed");
    showHint(
      remainingSeconds === totalSeconds ? "Push to start" : "Push to resume",
    );
  }
}

function newSessionId() {
  return (
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function saveTimerState() {
  writeLocalData(TIMER_STORAGE_KEY, {
    version: 1,
    mode: currentMode,
    totalSeconds,
    remainingSeconds,
    running: isRunning,
    deadline: timerDeadline,
    sessionId: timerSessionId,
    soundEnabled,
    task: currentTask,
  });
}

function applyTimerVisuals() {
  const isBreak = currentMode !== "pomodoro";
  document.getElementById("plateElement").classList.toggle("is-break", isBreak);
  document.getElementById("modeShortBreak").hidden = !isBreak;
  document.getElementById("skipBreakButton").hidden = !isBreak;
  document.getElementById("modePomodoro").textContent =
    `${currentMode === "pomodoro" ? totalSeconds / 60 : profile.focusMinutes}m`;
  document.getElementById("modeShortBreak").textContent =
    `${currentMode === "longBreak" ? "Long break" : "Short break"} · ${totalSeconds / 60}m`;
  document.getElementById("breakMessage").textContent =
    currentMode === "longBreak" ? "Take a longer break" : "Take a break";
  document.getElementById("modePomodoro").classList.toggle("active", !isBreak);
  document.getElementById("modeShortBreak").classList.toggle("active", isBreak);
  document.getElementById("muteToggle").textContent = soundEnabled
    ? "🔊"
    : "🔇";
  updateDisplay();
  setDialVisualState(isRunning);
}

function finishTimer(notify = true) {
  ensureGoalDay();
  const finishedPomodoro = currentMode === "pomodoro";
  const pendingIndex = profile.goalChecks.findIndex(
    (checked, index) => index < profile.dailyGoal && !checked,
  );
  let rewardIndex = pendingIndex;
  if (rewardIndex < 0) {
    rewardIndex =
      Array.from({ length: profile.dailyGoal }, (_, i) => i).find(
        (i) => !profile.goalChecks[i],
      ) ?? profile.dailyGoal - 1;
  }
  const seconds = totalSeconds;
  const endedAt = timerDeadline || Date.now();
  const sessionId = timerSessionId;
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  remainingSeconds = 0;
  // An immutable session ID makes recovery idempotent if interrupted here.
  if (finishedPomodoro)
    recordFocusedSession(
      seconds,
      sessionId,
      endedAt,
      profile.showCurrentTask ? currentTask : "",
    );
  const completedInHistory =
    focusHistory.entries.findIndex((entry) => entry.id === sessionId) + 1;
  const nextMode = finishedPomodoro
    ? completedInHistory > 0 && completedInHistory % 4 === 0
      ? "longBreak"
      : "break"
    : "pomodoro";
  setMode(nextMode);
  if (notify && !finishedPomodoro) playAudioFeedback("finish");
  showHint(
    finishedPomodoro
      ? currentMode === "longBreak"
        ? "Push for a long break"
        : "Push to start break"
      : "Push for a new session",
  );
  if (notify && finishedPomodoro && !document.hidden)
    animateSessionToGoal(rewardIndex);
}

function tickTimer(notify = true) {
  if (!isRunning) return;
  remainingSeconds = Math.max(
    0,
    Math.ceil((timerDeadline - Date.now()) / 1000),
  );
  if (remainingSeconds === 0) finishTimer(notify);
  else updateDisplay();
}

function handleDialPress() {
  if (isRunning) {
    pauseTimer();
    return;
  }
  if (remainingSeconds <= 0) remainingSeconds = totalSeconds;
  timerSessionId ||= newSessionId();
  timerDeadline = Date.now() + remainingSeconds * 1000;
  isRunning = true;
  applyTimerVisuals();
  saveTimerState();
  playAudioFeedback("pushDown");
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 250);
}

function pauseTimer() {
  if (!isRunning) return;
  tickTimer();
  if (!isRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerDeadline = null;
  isRunning = false;
  applyTimerVisuals();
  saveTimerState();
  playAudioFeedback("popUp");
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  timerDeadline = null;
  timerSessionId = null;
  totalSeconds = configuredDuration(currentMode);
  remainingSeconds = totalSeconds;
  applyTimerVisuals();
  saveTimerState();
  showHint("Push to start");
}

function configuredDuration(mode) {
  if (mode === "longBreak") return profile.longBreakMinutes * 60;
  if (mode === "break") return profile.shortBreakMinutes * 60;
  return profile.focusMinutes * 60;
}

function setMode(mode) {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  timerDeadline = null;
  timerSessionId = null;
  currentMode =
    mode === "longBreak"
      ? "longBreak"
      : mode === "break" || mode === 5
        ? "break"
        : "pomodoro";
  totalSeconds = configuredDuration(currentMode);
  remainingSeconds = totalSeconds;
  applyTimerVisuals();
  saveTimerState();
}

function skipBreak() {
  if (currentMode === "pomodoro") return;
  setMode("pomodoro");
  handleDialPress();
}

function toggleAudio() {
  soundEnabled = !soundEnabled;
  document.getElementById("muteToggle").textContent = soundEnabled
    ? "🔊"
    : "🔇";
  saveTimerState();
}

function restoreTimerState() {
  const saved = readLocalData(TIMER_STORAGE_KEY);
  if (
    !saved ||
    saved.version !== 1 ||
    !["pomodoro", "break", "longBreak"].includes(saved.mode)
  )
    return false;
  const expected = saved.totalSeconds;
  if (
    !Number.isInteger(expected) ||
    expected < 60 ||
    expected > 10800 ||
    expected % 60 !== 0
  )
    return false;
  if (
    saved.totalSeconds !== expected ||
    !Number.isInteger(saved.remainingSeconds) ||
    saved.remainingSeconds < 0 ||
    saved.remainingSeconds > expected ||
    typeof saved.running !== "boolean"
  )
    return false;
  if (
    saved.running &&
    (!Number.isFinite(saved.deadline) ||
      saved.deadline <= 0 ||
      saved.deadline > Date.now() + expected * 1000 + 1000 ||
      typeof saved.sessionId !== "string" ||
      !saved.sessionId)
  )
    return false;
  clearInterval(timerInterval);
  timerInterval = null;
  currentTask = typeof saved.task === "string" ? saved.task.slice(0, 120) : "";
  document.getElementById("currentTaskInput").value = currentTask;
  currentMode = saved.mode;
  totalSeconds = expected;
  remainingSeconds = saved.remainingSeconds;
  isRunning = saved.running;
  timerDeadline = isRunning ? saved.deadline : null;
  timerSessionId = typeof saved.sessionId === "string" ? saved.sessionId : null;
  if (typeof saved.soundEnabled === "boolean")
    soundEnabled = saved.soundEnabled;
  if (isRunning) {
    tickTimer(false);
    if (isRunning) timerInterval = setInterval(tickTimer, 250);
  }
  applyTimerVisuals();
  return true;
}

document
  .getElementById("currentTaskInput")
  .addEventListener("input", (event) => {
    currentTask = event.target.value.slice(0, 120);
    saveTimerState();
  });

// Initial load
updateDisplay();
showHint("Push to start");

// Let the heading quietly disappear after the first introduction.
setTimeout(() => {
  document.querySelector(".stage-wrapper").classList.add("title-is-quiet");
}, 3500);

// Sidebar interactions from the provided design.
function toggleBead(button) {
  ensureGoalDay();
  const index = Number(button.dataset.sessionIndex);
  const active = !profile.goalChecks[index];
  profile.goalChecks[index] = active;
  button.classList.toggle("active", active);
  button.setAttribute("aria-pressed", String(active));
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {}
  playAudioFeedback("popUp");
}

function selectDate(cell) {
  if (!cell.dataset.date) return;
  selectedHistoryDay = cell.dataset.date;
  document.querySelectorAll("#calendarDays .cal-day-cell").forEach((day) => {
    const selected = day.dataset.date === selectedHistoryDay;
    day.classList.toggle("active-date", selected);
    day.setAttribute("aria-pressed", String(selected));
  });
  playAudioFeedback("popUp");
}

const sidebarShell = document.getElementById("sidebarShell");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarPanel = document.getElementById("sidebarPanel");
let sidebarCloseTimeout = null;
let sidebarPointerInside = false;

function setSidebarOpen(open) {
  clearTimeout(sidebarCloseTimeout);
  if (!open) hideHistoryPopup();
  sidebarShell.classList.toggle("is-open", open);
  sidebarToggle.setAttribute("aria-expanded", String(open));
  sidebarToggle.setAttribute(
    "aria-label",
    open ? "Hide goals and calendar" : "Show goals and calendar",
  );
  sidebarPanel.setAttribute("aria-hidden", String(!open));
  sidebarPanel.inert = !open;
}

sidebarShell.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "touch") return;
  sidebarPointerInside = true;
  setSidebarOpen(true);
});
sidebarShell.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "touch") return;
  sidebarPointerInside = false;
  sidebarCloseTimeout = setTimeout(() => {
    if (!sidebarPanel.contains(document.activeElement)) setSidebarOpen(false);
  }, 180);
});
sidebarToggle.addEventListener("click", () => {
  setSidebarOpen(sidebarToggle.getAttribute("aria-expanded") !== "true");
});
sidebarShell.addEventListener("focusout", (event) => {
  if (!sidebarShell.contains(event.relatedTarget) && !sidebarPointerInside)
    setSidebarOpen(false);
});
sidebarShell.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    sidebarToggle.focus();
    setSidebarOpen(false);
  }
});
document.addEventListener("pointerdown", (event) => {
  if (!sidebarShell.contains(event.target)) setSidebarOpen(false);
});

// Detachable cards: drag by the heading, leaving the controls usable.
const floatingWidgets = new Set();
const widgetControllers = new Map();
const LAYOUT_STORAGE_KEY = "pomodoro-widget-layout-v1";
let savedWidgetLayout = readLocalData(LAYOUT_STORAGE_KEY) || {};

function saveWidgetLayout() {
  const positions = {};
  floatingWidgets.forEach((widget) => {
    positions[widget.id] = {
      left: parseFloat(widget.style.left),
      top: parseFloat(widget.style.top),
    };
  });
  savedWidgetLayout = positions;
  writeLocalData(LAYOUT_STORAGE_KEY, positions);
}
function raiseWidget(widget) {
  if (!floatingWidgets.has(widget)) return;
  floatingWidgets.delete(widget);
  floatingWidgets.add(widget);
  floatingWidgets.forEach((card) => {
    card.style.zIndex = String(25 + Array.from(floatingWidgets).indexOf(card));
  });
  saveWidgetLayout();
}
function restoreWidgetLayout() {
  const positions = savedWidgetLayout;
  // Saved insertion order follows the cards from back to front.
  Object.entries(positions).forEach(([id, point]) => {
    const controller = widgetControllers.get(id);
    if (
      controller &&
      point &&
      Number.isFinite(point.left) &&
      Number.isFinite(point.top)
    )
      controller.detach(point.left, point.top);
  });
}

document.getElementById("resetLayoutButton").addEventListener("click", () => {
  widgetControllers.forEach((controller) => controller.returnToSidebar());
  saveWidgetLayout();
  setSidebarOpen(true);
  document.getElementById("resetLayoutButton").focus();
  document.getElementById("layoutResetStatus").textContent =
    "All cards returned to the sidebar.";
});

function clampWidgetPosition(widget, left, top) {
  const margin = 12;
  const maxLeft = Math.max(
    margin,
    window.innerWidth - widget.offsetWidth - margin,
  );
  const maxTop = Math.max(
    margin,
    window.innerHeight - widget.offsetHeight - margin,
  );
  widget.style.left = `${Math.min(maxLeft, Math.max(margin, left))}px`;
  widget.style.top = `${Math.min(maxTop, Math.max(margin, top))}px`;
}

document.querySelectorAll(".movable-widget").forEach((widget) => {
  const handle = widget.querySelector(".widget-drag-handle");
  const returnButton = widget.querySelector(".widget-return");
  let placeholder = null;
  let drag = null;

  function detach(left, top) {
    if (floatingWidgets.has(widget)) return;
    const width = widget.offsetWidth;
    placeholder = document.createElement("button");
    placeholder.type = "button";
    placeholder.className = "widget-placeholder";
    placeholder.textContent = `↶ Return ${widget.dataset.widgetName}`;
    placeholder.addEventListener("click", returnToSidebar);
    widget.before(placeholder);
    document.body.appendChild(widget);
    widget.classList.add("is-floating");
    widget.style.width = `${width}px`;
    floatingWidgets.add(widget);
    raiseWidget(widget);
    clampWidgetPosition(widget, left, top);
    setSidebarOpen(false);
    saveWidgetLayout();
  }

  function returnToSidebar() {
    if (!floatingWidgets.has(widget)) return;
    widget.classList.remove("is-floating", "is-dragging");
    ["left", "top", "width", "z-index", "zIndex"].forEach((property) =>
      widget.style.removeProperty(property),
    );
    placeholder.replaceWith(widget);
    placeholder = null;
    floatingWidgets.delete(widget);
    saveWidgetLayout();
    if (sidebarToggle.getAttribute("aria-expanded") === "true") handle.focus();
    else sidebarToggle.focus();
  }

  widget.addEventListener("pointerdown", (event) => {
    if (event.button === 0) raiseWidget(widget);
  });
  widget.addEventListener("focusin", () => raiseWidget(widget));
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const rect = widget.getBoundingClientRect();
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    if (
      !drag.moved &&
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4
    )
      return;
    if (!drag.moved) {
      drag.moved = true;
      detach(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
      handle.setPointerCapture(event.pointerId);
      widget.classList.add("is-dragging");
    }
    clampWidgetPosition(
      widget,
      event.clientX - drag.offsetX,
      event.clientY - drag.offsetY,
    );
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    widget.classList.remove("is-dragging");
    if (drag.moved) saveWidgetLayout();
    drag = null;
    if (handle.hasPointerCapture(event.pointerId))
      handle.releasePointerCapture(event.pointerId);
  }
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
  handle.addEventListener("click", () => {
    if (floatingWidgets.has(widget)) {
      raiseWidget(widget);
      return;
    }
    const timer = document
      .getElementById("plateElement")
      .getBoundingClientRect();
    detach(timer.right + 32, timer.top);
    handle.focus();
  });
  handle.addEventListener("keydown", (event) => {
    if (!floatingWidgets.has(widget)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      returnToSidebar();
      return;
    }
    const movement = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    const step = event.shiftKey ? 30 : 10;
    clampWidgetPosition(
      widget,
      parseFloat(widget.style.left) + movement[0] * step,
      parseFloat(widget.style.top) + movement[1] * step,
    );
    saveWidgetLayout();
  });
  returnButton.addEventListener("click", returnToSidebar);
  widgetControllers.set(widget.id, { detach, returnToSidebar });
});
window.addEventListener("resize", () => {
  floatingWidgets.forEach((widget) =>
    clampWidgetPosition(
      widget,
      parseFloat(widget.style.left),
      parseFloat(widget.style.top),
    ),
  );
  saveWidgetLayout();
});

const PROFILE_STORAGE_KEY = "pomodoro-local-profile";
let profile = {
  name: "Christine Joy Espiritu",
  role: "Computer Science Student",
  joined: new Date().getFullYear(),
  photo: "",
  focusedSeconds: 0,
  dailyGoal: 6,
  goalDay: "",
  goalChecks: [],
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  showCurrentTask: true,
};
try {
  const saved = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
  if (saved && typeof saved.name === "string" && saved.name.trim()) {
    profile.name = saved.name.slice(0, 50);
    if (typeof saved.showCurrentTask === "boolean")
      profile.showCurrentTask = saved.showCurrentTask;
    if (typeof saved.role === "string") profile.role = saved.role.slice(0, 70);
    if (
      Number.isInteger(saved.joined) &&
      saved.joined > 2000 &&
      saved.joined <= new Date().getFullYear()
    )
      profile.joined = saved.joined;
    if (
      typeof saved.photo === "string" &&
      /^data:image\/(png|jpeg|webp);base64,/.test(saved.photo)
    )
      profile.photo = saved.photo;
    if (Number.isFinite(saved.focusedSeconds) && saved.focusedSeconds >= 0)
      profile.focusedSeconds = saved.focusedSeconds;
    if (
      Number.isInteger(saved.dailyGoal) &&
      saved.dailyGoal >= 1 &&
      saved.dailyGoal <= 99
    )
      profile.dailyGoal = saved.dailyGoal;
    if (typeof saved.goalDay === "string") profile.goalDay = saved.goalDay;
    if (Array.isArray(saved.goalChecks))
      profile.goalChecks = saved.goalChecks
        .slice(0, 99)
        .map((value) => value === true);
    for (const key of [
      "focusMinutes",
      "shortBreakMinutes",
      "longBreakMinutes",
    ]) {
      if (Number.isInteger(saved[key]) && saved[key] >= 1 && saved[key] <= 180)
        profile[key] = saved[key];
    }
  }
} catch (error) {
  /* Use defaults if browser storage is unavailable. */
}

function goalDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}
function ensureGoalDay() {
  const today = goalDayKey();
  if (profile.goalDay !== today) {
    profile.goalDay = today;
    profile.goalChecks = [];
  }
}
function renderGoalBeads() {
  ensureGoalDay();
  const container = document.getElementById("goalBeadsContainer");
  container.replaceChildren();
  for (let i = 0; i < profile.dailyGoal; i++) {
    const button = document.createElement("button");
    const active = Boolean(profile.goalChecks[i]);
    button.type = "button";
    button.className = active ? "goal-bead active" : "goal-bead";
    button.dataset.sessionIndex = String(i);
    button.setAttribute("aria-label", `Focus session ${i + 1}`);
    button.setAttribute("aria-pressed", String(active));
    button.addEventListener("click", () => toggleBead(button));
    container.appendChild(button);
  }
}

function renderProfile() {
  document.getElementById("currentTaskArea").hidden = !profile.showCurrentTask;
  renderGoalBeads();
  document.getElementById("profileName").textContent = profile.name;
  document.getElementById("profileRole").textContent = profile.role;
  document.getElementById("profileJoined").textContent =
    `joined since ${profile.joined}`;
  const image = document.getElementById("profilePhoto");
  image.hidden = !profile.photo;
  document.getElementById("profilePlaceholder").hidden = Boolean(profile.photo);
  if (profile.photo) image.src = profile.photo;
  else image.removeAttribute("src");
  const minutes = Math.floor(profile.focusedSeconds / 60);
  const hours = Math.floor(minutes / 60);
  document.getElementById("profileFocus").textContent =
    `Total Focused: ${hours ? `${hours}h ${minutes % 60}m` : `${minutes} min`}`;
}
function recordFocusedSession(
  seconds,
  sessionId = newSessionId(),
  endedAt = Date.now(),
  task = currentTask,
) {
  const latest = validHistory(readLocalData(HISTORY_STORAGE_KEY));
  if (latest) focusHistory = latest;
  if (!focusHistory.entries.some((entry) => entry.id === sessionId)) {
    focusHistory.entries.push({
      id: sessionId,
      seconds,
      endedAt,
      task: task.trim().slice(0, 120),
      day: localDateKey(new Date(endedAt)),
    });
    writeLocalData(HISTORY_STORAGE_KEY, focusHistory);
    ensureGoalDay();
    if (localDateKey(new Date(endedAt)) === goalDayKey()) {
      for (let i = 0; i < profile.dailyGoal; i++) {
        if (!profile.goalChecks[i]) {
          profile.goalChecks[i] = true;
          break;
        }
      }
    }
  }
  syncFocusedTotal();
  writeLocalData(PROFILE_STORAGE_KEY, profile);
  renderProfile();
  renderCalendar();
}

const profileDialog = document.getElementById("profileDialog");
const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileNameInput");
const profileRoleInput = document.getElementById("profileRoleInput");
const dailyGoalInput = document.getElementById("dailyGoalInput");
const showCurrentTaskInput = document.getElementById("showCurrentTaskInput");
const durationInputs = {
  focusMinutes: document.getElementById("focusMinutesInput"),
  shortBreakMinutes: document.getElementById("shortBreakMinutesInput"),
  longBreakMinutes: document.getElementById("longBreakMinutesInput"),
};
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profileStatus = document.getElementById("profileFormStatus");
let draftPhoto = "";

document.getElementById("editProfileButton").addEventListener("click", () => {
  profileNameInput.value = profile.name;
  profileRoleInput.value = profile.role;
  dailyGoalInput.value = profile.dailyGoal;
  showCurrentTaskInput.checked = profile.showCurrentTask;
  for (const [key, input] of Object.entries(durationInputs)) {
    input.value = profile[key];
    input.setCustomValidity("");
  }
  dailyGoalInput.setCustomValidity("");
  profilePhotoInput.value = "";
  profileNameInput.setCustomValidity("");
  profileStatus.textContent = "";
  draftPhoto = profile.photo;
  profileDialog.showModal();
  profileNameInput.focus();
});
document
  .getElementById("cancelProfile")
  .addEventListener("click", () => profileDialog.close());
profileDialog.addEventListener("close", () => {
  if (sidebarPanel.contains(document.getElementById("profileWidget")))
    setSidebarOpen(true);
  document.getElementById("editProfileButton").focus();
});
profileNameInput.addEventListener("input", () =>
  profileNameInput.setCustomValidity(""),
);
dailyGoalInput.addEventListener("input", () =>
  dailyGoalInput.setCustomValidity(""),
);
Object.values(durationInputs).forEach((input) =>
  input.addEventListener("input", () => input.setCustomValidity("")),
);
document.getElementById("removeProfilePhoto").addEventListener("click", () => {
  draftPhoto = "";
  profilePhotoInput.value = "";
  profileStatus.textContent = "Default avatar selected. Save to apply.";
});
profilePhotoInput.addEventListener("change", () => {
  const file = profilePhotoInput.files[0];
  if (!file) return;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  ) {
    profileStatus.textContent = "Choose a PNG, JPG or WebP under 2 MB.";
    profilePhotoInput.value = "";
    return;
  }
  const saveButton = document.getElementById("saveProfileButton");
  saveButton.disabled = true;
  const reader = new FileReader();
  reader.onload = () => {
    draftPhoto = reader.result;
    profileStatus.textContent = "Photo selected. Save to apply.";
    saveButton.disabled = false;
  };
  reader.onerror = () => {
    profileStatus.textContent = "Could not read that photo. Try another.";
    saveButton.disabled = false;
  };
  reader.readAsDataURL(file);
});
profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = profileNameInput.value.trim();
  if (!name) {
    profileNameInput.setCustomValidity("Enter a display name.");
    profileNameInput.reportValidity();
    return;
  }
  const dailyGoal = Number(dailyGoalInput.value);
  if (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 99) {
    dailyGoalInput.setCustomValidity("Choose a whole number from 1 to 99.");
    dailyGoalInput.reportValidity();
    return;
  }
  const durations = {};
  for (const [key, input] of Object.entries(durationInputs)) {
    const minutes = Number(input.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
      input.setCustomValidity("Choose whole minutes from 1 to 180.");
      input.reportValidity();
      return;
    }
    durations[key] = minutes;
  }
  ensureGoalDay();
  const updated = {
    ...profile,
    name,
    role: profileRoleInput.value.trim(),
    photo: draftPhoto,
    dailyGoal,
    showCurrentTask: showCurrentTaskInput.checked,
    ...durations,
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    profileStatus.textContent =
      "Could not save on this browser. Try a smaller photo or allow browser storage.";
    return;
  }
  const refreshIdleTimer = !isRunning && remainingSeconds === totalSeconds;
  profile = updated;
  renderProfile();
  if (refreshIdleTimer) setMode(currentMode);
  profileDialog.close();
});
renderProfile();

const avatarUploadButton = document.getElementById("avatarUploadButton");
const avatarUploadInput = document.getElementById("avatarUploadInput");
const avatarUploadStatus = document.getElementById("avatarUploadStatus");

avatarUploadButton.addEventListener("click", () => {
  avatarUploadStatus.hidden = true;
  avatarUploadInput.value = "";
  avatarUploadInput.click();
});
avatarUploadInput.addEventListener("change", async () => {
  const file = avatarUploadInput.files[0];
  if (!file) return;
  avatarUploadStatus.hidden = false;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  ) {
    avatarUploadStatus.textContent = "Choose a PNG, JPG or WebP under 2 MB.";
    return;
  }
  avatarUploadButton.disabled = true;
  avatarUploadStatus.textContent = "Saving photo…";
  try {
    const photo = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    });
    const image = new Image();
    image.src = photo;
    try {
      await image.decode();
    } catch (error) {
      throw new Error("image");
    }
    const updated = { ...profile, photo };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      throw new Error("storage");
    }
    profile = updated;
    renderProfile();
    avatarUploadStatus.textContent = "Photo saved";
  } catch (error) {
    avatarUploadStatus.textContent =
      error.message === "storage"
        ? "Could not save. Try a smaller photo or allow browser storage."
        : "Could not open this image. Try another photo.";
  } finally {
    avatarUploadButton.disabled = false;
  }
});

setInterval(() => {
  if (profile.goalDay !== goalDayKey()) {
    renderGoalBeads();
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {}
  }
}, 60000);

function readLocalData(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    if (!(error instanceof SyntaxError)) showStorageNotice();
    return null;
  }
}
function writeLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    showStorageNotice();
    return false;
  }
}
function showStorageNotice() {
  const notice = document.getElementById("persistenceStatus");
  notice.hidden = false;
  notice.textContent =
    "Browser storage unavailable. Changes may last only for this visit.";
}
function localDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
const HISTORY_STORAGE_KEY = "pomodoro-focus-history-v1";
function validHistory(value) {
  if (
    !value ||
    value.version !== 1 ||
    !Number.isFinite(value.baselineSeconds) ||
    value.baselineSeconds < 0 ||
    !Array.isArray(value.entries)
  )
    return null;
  const ids = new Set();
  const entries = [];
  for (const entry of value.entries) {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !entry.id ||
      ids.has(entry.id) ||
      !Number.isFinite(entry.seconds) ||
      entry.seconds <= 0 ||
      entry.seconds > 86400 ||
      !Number.isFinite(entry.endedAt) ||
      !Number.isFinite(new Date(entry.endedAt).getTime())
    )
      continue;
    ids.add(entry.id);
    entries.push({
      id: entry.id,
      seconds: entry.seconds,
      endedAt: entry.endedAt,
      task: typeof entry.task === "string" ? entry.task.slice(0, 120) : "",
      day: localDateKey(new Date(entry.endedAt)),
    });
  }
  return { version: 1, baselineSeconds: value.baselineSeconds, entries };
}
const historyPopup = document.getElementById("historyPopup");
let historyPopupAnchor = null;

function hideHistoryPopup() {
  if (historyPopupAnchor)
    historyPopupAnchor.removeAttribute("aria-describedby");
  historyPopupAnchor = null;
  historyPopup.hidden = true;
}
function showHistoryPopup(cell) {
  hideHistoryPopup();
  historyPopupAnchor = cell;
  const [year, month, day] = cell.dataset.date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const summary = dayHistory(cell.dataset.date);
  document.getElementById("historyPopupDate").textContent =
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  document.getElementById("historyPopupSessions").textContent =
    `${summary.count} ${summary.count === 1 ? "focus session" : "focus sessions"}`;
  document.getElementById("historyPopupDuration").textContent =
    `${focusDuration(summary.seconds)} focused`;
  const beads = document.getElementById("historyPopupBeads");
  beads.replaceChildren();
  beads.hidden = summary.count === 0;
  for (let i = 0; i < Math.min(summary.count, 7); i++) {
    const bead = document.createElement("span");
    bead.className = "history-popup-bead";
    beads.appendChild(bead);
  }
  if (summary.count > 7) {
    const extra = document.createElement("span");
    extra.className = "history-popup-extra";
    extra.textContent = `+${summary.count - 7}`;
    beads.appendChild(extra);
  }
  const tasks = document.getElementById("historyPopupTasks");
  tasks.replaceChildren();
  const sessions = focusHistory.entries.filter(
    (entry) => entry.day === cell.dataset.date,
  );
  tasks.hidden = sessions.length === 0;
  for (const entry of sessions.slice(-5).reverse()) {
    const item = document.createElement("li");
    item.textContent = `${entry.task || "Focus session"} · ${focusDuration(entry.seconds)}`;
    tasks.appendChild(item);
  }
  if (sessions.length > 5) {
    const extra = document.createElement("li");
    extra.textContent = `+${sessions.length - 5} earlier sessions`;
    tasks.appendChild(extra);
  }
  historyPopup.hidden = false;
  cell.setAttribute("aria-describedby", "historyPopup");
  const anchor = cell.getBoundingClientRect();
  const box = historyPopup.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - box.width - 12,
    Math.max(12, anchor.left + anchor.width / 2 - box.width / 2),
  );
  let top = anchor.top - box.height - 10;
  if (top < 12) top = anchor.bottom + 10;
  historyPopup.style.left = `${Math.max(12, left)}px`;
  historyPopup.style.top = `${Math.max(12, Math.min(window.innerHeight - box.height - 12, top))}px`;
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideHistoryPopup();
});
document.addEventListener("pointerdown", (event) => {
  if (historyPopupAnchor && !historyPopupAnchor.contains(event.target))
    hideHistoryPopup();
});
window.addEventListener("scroll", hideHistoryPopup, true);
window.addEventListener("resize", hideHistoryPopup);

let focusHistory = validHistory(readLocalData(HISTORY_STORAGE_KEY));
if (!focusHistory) {
  focusHistory = {
    version: 1,
    baselineSeconds: profile.focusedSeconds,
    entries: [],
  };
  writeLocalData(HISTORY_STORAGE_KEY, focusHistory);
}
let historyMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedHistoryDay = localDateKey(new Date());
let calendarTodayKey = selectedHistoryDay;

function syncFocusedTotal() {
  profile.focusedSeconds =
    focusHistory.baselineSeconds +
    focusHistory.entries.reduce((sum, entry) => sum + entry.seconds, 0);
}
function reconcileTodayGoal() {
  ensureGoalDay();
  const completed = focusHistory.entries.filter(
    (entry) => entry.day === goalDayKey(),
  ).length;
  for (let i = 0; i < Math.min(profile.dailyGoal, completed); i++)
    profile.goalChecks[i] = true;
}
function dayHistory(key) {
  const entries = focusHistory.entries.filter((entry) => entry.day === key);
  return {
    count: entries.length,
    seconds: entries.reduce((sum, entry) => sum + entry.seconds, 0),
  };
}
function focusDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes} min`;
}
function weeklyStats(today = new Date()) {
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const entries = focusHistory.entries.filter(
    (entry) =>
      entry.endedAt >= start.getTime() &&
      entry.endedAt < end.getTime() &&
      entry.endedAt <= today.getTime(),
  );
  const days = new Set(
    focusHistory.entries
      .filter((entry) => entry.endedAt <= today.getTime())
      .map((entry) => entry.day),
  );
  const cursor = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  // Yesterday's streak stays active while today is still in progress.
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    start,
    end,
    seconds: entries.reduce((sum, entry) => sum + entry.seconds, 0),
    count: entries.length,
    streak,
  };
}
function renderWeeklyStats() {
  const stats = weeklyStats();
  const last = new Date(stats.end);
  last.setDate(last.getDate() - 1);
  const format = (date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  document.getElementById("weeklyStatsRange").textContent =
    `${format(stats.start)} – ${format(last)} · Mon–Sun`;
  const minutes = Math.floor(stats.seconds / 60);
  document.getElementById("weeklyFocusTime").textContent =
    `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  document.getElementById("weeklySessions").textContent = String(stats.count);
  document.getElementById("weeklyStreak").textContent =
    `${stats.streak} ${stats.streak === 1 ? "day" : "days"}`;
}
function renderCalendar() {
  renderWeeklyStats();
  hideHistoryPopup();
  const year = historyMonth.getFullYear();
  const month = historyMonth.getMonth();
  document.getElementById("calendarMonthLabel").textContent =
    historyMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  const container = document.getElementById("calendarDays");
  container.replaceChildren();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < offset; i++)
    container.appendChild(document.createElement("span"));
  const days = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month, day);
    const key = localDateKey(date);
    const summary = dayHistory(key);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className =
      key === selectedHistoryDay ? "cal-day-cell active-date" : "cal-day-cell";
    cell.dataset.date = key;
    cell.setAttribute("aria-pressed", String(key === selectedHistoryDay));
    if (key === localDateKey(new Date()))
      cell.setAttribute("aria-current", "date");
    const label = `${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}: ${summary.count} sessions, ${focusDuration(summary.seconds)}`;
    cell.setAttribute("aria-label", label);

    const number = document.createElement("span");
    number.className = "day-num";
    number.textContent = day;
    cell.appendChild(number);
    const dots = document.createElement("span");
    dots.className = "dots-row";
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < Math.min(summary.count, 3); i++) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dots.appendChild(dot);
    }
    if (summary.count > 3) {
      const extra = document.createElement("span");
      extra.className = "calendar-extra";
      extra.textContent = "+";
      dots.appendChild(extra);
    }
    cell.appendChild(dots);
    cell.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") showHistoryPopup(cell);
    });
    cell.addEventListener("pointerleave", () => {
      if (!cell.matches(":focus-visible")) hideHistoryPopup();
    });
    cell.addEventListener("focus", () => showHistoryPopup(cell));
    cell.addEventListener("blur", hideHistoryPopup);
    cell.addEventListener("click", () => {
      selectDate(cell);
      showHistoryPopup(cell);
    });
    container.appendChild(cell);
  }
  floatingWidgets.forEach((widget) =>
    clampWidgetPosition(
      widget,
      parseFloat(widget.style.left),
      parseFloat(widget.style.top),
    ),
  );
}
function moveHistoryMonth(delta) {
  historyMonth = new Date(
    historyMonth.getFullYear(),
    historyMonth.getMonth() + delta,
    1,
  );
  selectedHistoryDay = localDateKey(historyMonth);
  renderCalendar();
}
document
  .getElementById("calendarPrevious")
  .addEventListener("click", () => moveHistoryMonth(-1));
document
  .getElementById("calendarNext")
  .addEventListener("click", () => moveHistoryMonth(1));
document.getElementById("calendarToday").addEventListener("click", () => {
  const today = new Date();
  historyMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedHistoryDay = localDateKey(today);
  renderCalendar();
});
window.addEventListener("storage", (event) => {
  if (event.key === HISTORY_STORAGE_KEY) {
    const latest = validHistory(readLocalData(HISTORY_STORAGE_KEY));
    if (latest) {
      focusHistory = latest;
      syncFocusedTotal();
      reconcileTodayGoal();
      renderProfile();
      renderCalendar();
    }
  }
  if (event.key === TIMER_STORAGE_KEY) restoreTimerState();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tickTimer(false);
});
setInterval(() => {
  if (calendarTodayKey !== localDateKey(new Date())) {
    calendarTodayKey = localDateKey(new Date());
    renderCalendar();
  }
}, 60000);

syncFocusedTotal();
reconcileTodayGoal();
renderProfile();
renderCalendar();
restoreWidgetLayout();
if (!restoreTimerState()) setMode("pomodoro");

let goalRewardAnimation = null;
async function animateSessionToGoal(index) {
  if (goalRewardAnimation) return;
  const goal = document.getElementById("goalWidget");
  const target = document.getElementById("goalBeadsContainer").children[index];
  if (!target) return;
  goalRewardAnimation = true;
  const wasClosed =
    !goal.classList.contains("is-floating") &&
    sidebarToggle.getAttribute("aria-expanded") !== "true";
  let orb = null;
  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  try {
    target.classList.add("is-receiving-session");
    if (wasClosed) {
      setSidebarOpen(true);
      goal.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      });
      await new Promise((resolve) =>
        setTimeout(resolve, reducedMotion ? 0 : 280),
      );
    }
    const source = document
      .getElementById("timerButton")
      .getBoundingClientRect();
    const destination = target.getBoundingClientRect();
    const size = source.width;
    if (!reducedMotion && size > 0 && target.isConnected) {
      orb = document.createElement("div");
      orb.className = "session-transfer-orb";
      orb.setAttribute("aria-hidden", "true");
      orb.style.width = `${size}px`;
      orb.style.height = `${size}px`;
      orb.style.left = `${source.left}px`;
      orb.style.top = `${source.top}px`;
      document.body.appendChild(orb);
      const dx =
        destination.left +
        destination.width / 2 -
        source.left -
        source.width / 2;
      const dy =
        destination.top +
        destination.height / 2 -
        source.top -
        source.height / 2;
      const scale = destination.width / size;
      playAudioFeedback("rewardLaunch");
      const flight = orb.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 0.85 },
          {
            transform: `translate(${dx * 0.45}px, ${dy * 0.25 - 45}px) scale(0.5)`,
            opacity: 1,
            offset: 0.45,
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
            opacity: 1,
          },
        ],
        {
          duration: 1000,
          easing: "cubic-bezier(0.22, 0.65, 0.3, 1)",
          fill: "forwards",
        },
      );
      await flight.finished;
    }
    target.classList.remove("is-receiving-session");
    target.classList.add("is-rewarded");
    playAudioFeedback("rewardLand");
    await new Promise((resolve) =>
      setTimeout(resolve, reducedMotion ? 250 : 850),
    );
  } catch (error) {
    // Progress is already saved; animation never blocks the timer.
    playAudioFeedback("finish");
  } finally {
    if (orb) orb.remove();
    target.classList.remove("is-receiving-session", "is-rewarded");
    goalRewardAnimation = null;
    if (
      wasClosed &&
      !sidebarPointerInside &&
      !sidebarShell.contains(document.activeElement)
    )
      setSidebarOpen(false);
  }
}
