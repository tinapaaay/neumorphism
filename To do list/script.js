'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const TASKS_KEY = 'todo-dashboard-tasks';
const SETTINGS_KEY = 'todo-dashboard-settings';
const NOTES_KEY = 'todo-dashboard-notes';
const WATER_KEY = 'todo-dashboard-water';
const uid = () => crypto.randomUUID();
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value);
function dateKey(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && dateKey(date) === value ? date : null;
}
function plusDays(key, amount) {
  const date = parseDate(key); if (!date) return null;
  date.setDate(date.getDate() + amount);
  return date.getFullYear() > 9999 || date.getFullYear() < 1 ? null : dateKey(date);
}
function shortDate(key) {
  return parseDate(key)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '';
}
function readStored(key, fallback) {
  try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
  catch { return fallback; }
}
let statusTimer;
function announce(text) {
  $('#app-status').textContent = text; $('#app-status').hidden = false;
  clearTimeout(statusTimer); statusTimer = setTimeout(() => { $('#app-status').hidden = true; }, 4500);
}
function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { announce('Changes are only kept in this tab. Browser storage is unavailable.'); return false; }
}
const defaults = { name: 'Tin', greeting: 'Everyday is a good day!', waterGoal: 2000, sound: 'pop', volume: 50 };
const savedSettings = readStored(SETTINGS_KEY, {});
let settings = { ...defaults };
if (savedSettings && typeof savedSettings === 'object') {
  if (typeof savedSettings.name === 'string' && savedSettings.name.trim()) settings.name = savedSettings.name.slice(0, 30);
  if (typeof savedSettings.greeting === 'string' && savedSettings.greeting.trim()) settings.greeting = savedSettings.greeting.slice(0, 80);
  if (Number.isFinite(savedSettings.waterGoal) && savedSettings.waterGoal >= 250 && savedSettings.waterGoal <= 10000 && savedSettings.waterGoal % 250 === 0) settings.waterGoal = savedSettings.waterGoal;
  if (['pop', 'chime', 'off'].includes(savedSettings.sound)) settings.sound = savedSettings.sound;
  if (Number.isFinite(savedSettings.volume)) settings.volume = Math.max(0, Math.min(100, savedSettings.volume));
}
let soundContext;
function playSound(done = true, sound = settings.sound, volume = settings.volume) {
  if (sound === 'off' || volume === 0) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    soundContext ||= new AudioContext();
    const play = () => {
      const start = soundContext.currentTime;
      const notes = sound === 'chime' ? [done ? 659.25 : 523.25, done ? 880 : 659.25] : [done ? 196 : 293.66];
      notes.forEach((frequency, index) => {
        const oscillator = soundContext.createOscillator();
        const gain = soundContext.createGain();
        const time = start + index * 0.09;
        const duration = sound === 'chime' ? 0.35 : 0.16;
        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, time);
        if (sound === 'pop') oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.55, time + duration);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume / 100 * 0.12), time + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        oscillator.connect(gain); gain.connect(soundContext.destination);
        oscillator.start(time); oscillator.stop(time + duration + 0.02);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    };
    if (soundContext.state === 'suspended') soundContext.resume().then(play).catch(() => {});
    else play();
  } catch { /* Task controls work even when audio is unavailable. */ }
}

function normalizeTask(task) {
  if (!task || typeof task.text !== 'string' || !task.text.trim() || typeof task.done !== 'boolean') return null;
  return {
    id: validId(task.id) ? task.id : uid(), text: task.text.trim().slice(0, 80), done: task.done,
    dueDate: parseDate(task.dueDate) ? task.dueDate : null,
    completedDate: task.done ? (parseDate(task.completedDate) ? task.completedDate : dateKey()) : null,
    priority: ['high', 'low'].includes(task.priority) ? task.priority : 'normal', pinned: task.pinned === true,
    seriesId: validId(task.seriesId) ? task.seriesId : null,
    occurrenceDate: parseDate(task.occurrenceDate) ? task.occurrenceDate : null
  };
}
function normalizeDaily(daily) {
  if (!daily || typeof daily !== 'object' || Array.isArray(daily)) return {};
  return Object.fromEntries(Object.entries(daily).filter(([key, entries]) => parseDate(key) && entries && typeof entries === 'object' && !Array.isArray(entries)).sort(([a], [b]) => a.localeCompare(b)).slice(-31).map(([key, entries]) => [key, Object.fromEntries(Object.entries(entries).filter(([id, done]) => validId(id) && typeof done === 'boolean'))]));
}
function normalizeSeries(series) {
  if (!Array.isArray(series)) return [];
  const seen = new Set();
  return series.filter(item => item && validId(item.id) && !seen.has(item.id) && seen.add(item.id) && typeof item.text === 'string' && item.text.trim() && parseDate(item.start) && ['daily', 'weekly', 'custom'].includes(item.mode)).map(item => ({ id: item.id, text: item.text.trim().slice(0, 80), start: item.start, mode: item.mode, active: item.active !== false, priority: ['high', 'low'].includes(item.priority) ? item.priority : 'normal', days: [...new Set(Array.isArray(item.days) ? item.days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6) : [])], skipped: [...new Set(Array.isArray(item.skipped) ? item.skipped.filter(parseDate) : [])] })).filter(item => item.mode !== 'custom' || item.days.length);
}
const seeds = $$('#todo-container .todo-row:not(.add-task-row)').map(row => ({ text: row.querySelector('.todo-task-label').textContent, done: row.classList.contains('done') }));
const stored = readStored(TASKS_KEY, null);
// Retain the old task format once, before migrating existing browser data.
if (Array.isArray(stored)) {
  try {
    if (localStorage.getItem('todo-dashboard-tasks-backup-v1') === null) localStorage.setItem('todo-dashboard-tasks-backup-v1', JSON.stringify(stored));
  } catch { /* The current list remains available in memory. */ }
}
let state = { version: 2, tasks: seeds.map(normalizeTask), series: [], daily: {} };
if (Array.isArray(stored) && stored.every(task => task && typeof task.text === 'string' && typeof task.done === 'boolean')) state.tasks = stored.map(normalizeTask).filter(Boolean);
else if (stored && stored.version === 2 && Array.isArray(stored.tasks)) {
  state.tasks = stored.tasks.map(normalizeTask).filter(Boolean);
  state.series = normalizeSeries(stored.series);
  state.daily = normalizeDaily(stored.daily);
}
// Preserve task identity and enforce the same three-pin limit on restored data.
state.tasks = state.tasks.filter((task, index, all) => all.findIndex(other => other.id === task.id) === index);
let pins = 0; state.tasks.forEach(task => { if (task.pinned && ++pins > 3) task.pinned = false; });
let selectedDate = null;
let view = 'today';
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let undoState = null;
let editingId = null;
let dialogTrigger = null;
let menuTaskId = null;
let menuTrigger = null;
const taskDialog = $('#add-task-dialog');
const taskMenu = document.createElement('div');
taskMenu.id = 'task-options-menu'; taskMenu.className = 'task-options-menu';
taskMenu.setAttribute('popover', 'auto'); taskMenu.setAttribute('role', 'group'); taskMenu.setAttribute('aria-label', 'Task options');
taskMenu.innerHTML = '<button type="button" data-action="edit">Edit task</button><button type="button" data-action="pin">Pin to top 3</button><button type="button" data-action="up">Move up</button><button type="button" data-action="down">Move down</button><button type="button" data-action="stop">Stop repeating</button><button type="button" data-action="delete" class="task-delete">Delete task</button>';
document.body.append(taskMenu);
function getTask(id) { return state.tasks.find(task => task.id === id); }
function getSeries(task) { return state.series.find(series => series.id === task.seriesId); }
function isRepeating(task) { return getSeries(task)?.active !== false && Boolean(getSeries(task)); }
function scheduled(series, key) {
  if (series.active === false || key < series.start || series.skipped.includes(key)) return false;
  if (series.mode === 'daily') return true;
  const day = parseDate(key).getDay();
  return series.mode === 'weekly' ? day === parseDate(series.start).getDay() : series.days.includes(day);
}
function materializeRange(start, end) {
  let changed = false;
  const existing = new Set(state.tasks.filter(task => task.seriesId).map(task => `${task.seriesId}:${task.occurrenceDate}`));
  for (const series of state.series) {
    if (series.active === false) continue;
    for (let key = start; key && key <= end; key = plusDays(key, 1)) {
      const occurrence = `${series.id}:${key}`;
      if (scheduled(series, key) && !existing.has(occurrence)) {
        state.tasks.push(normalizeTask({ id: uid(), text: series.text, done: false, dueDate: key, priority: series.priority, seriesId: series.id, occurrenceDate: key }));
        existing.add(occurrence); changed = true;
      }
    }
  }
  return changed;
}
function ensureOccurrences() {
  const today = dateKey();
  let changed = materializeRange(today, plusDays(today, 30));
  const first = dateKey(calendarMonth);
  const last = dateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0));
  changed = materializeRange(first, last) || changed;
  // Clicking a date or visiting Upcoming expands the schedule without duplicate occurrences.
  return changed;
}
function orderedTasks() {
  return [...state.tasks.filter(task => task.pinned), ...state.tasks.filter(task => !task.pinned)];
}
function isTodayTask(task) {
  const today = dateKey();
  if (task.done) return task.completedDate === today || task.dueDate === today;
  return !task.dueDate || task.dueDate <= today;
}
function visibleTasks() {
  return orderedTasks().filter(task => {
    if (selectedDate) return task.dueDate === selectedDate;
    if (view === 'today') return isTodayTask(task);
    if (view === 'upcoming') return !task.done && task.dueDate > dateKey();
    if (view === 'completed') return task.done;
    return true;
  });
}
function syncDailyProgress() {
  const today = dateKey();
  if (!state.daily[today] || typeof state.daily[today] !== 'object' || Array.isArray(state.daily[today])) state.daily[today] = {};
  const daily = state.daily[today];
  state.tasks.forEach(task => {
    if (isTodayTask(task)) daily[task.id] = task.done;
    else delete daily[task.id];
  });
  Object.keys(state.daily).sort().slice(0, -31).forEach(key => delete state.daily[key]);
  return { total: Object.keys(daily).length, done: Object.values(daily).filter(value => value === true).length };
}
function persist() { syncDailyProgress(); writeStored(TASKS_KEY, state); }
function commit() { ensureOccurrences(); persist(); render(); }
function saveUndo(message) {
  undoState = structuredClone(state);
  $('#task-removal-message').textContent = message;
  $('#task-undo-toast').hidden = false;
}
function skipOccurrence(task) {
  const series = getSeries(task);
  if (series && task.occurrenceDate && !series.skipped.includes(task.occurrenceDate)) series.skipped.push(task.occurrenceDate);
}
function removeTasks(tasks, message) {
  if (!tasks.length) return;
  saveUndo(message);
  const ids = new Set(tasks.map(task => task.id));
  tasks.forEach(task => {
    skipOccurrence(task);
    if (!task.done) delete state.daily[dateKey()]?.[task.id];
  });
  state.tasks = state.tasks.filter(task => !ids.has(task.id));
  commit(); $('#add-task-button').focus();
}
$('#undo-clear-tasks').addEventListener('click', () => {
  if (!undoState) return;
  // Restore removed items without overwriting notes or personal settings.
  const snapshot = undoState; undoState = null;
  const currentPins = new Set(state.tasks.filter(task => task.pinned).map(task => task.id));
  const restoredIds = new Set(snapshot.tasks.map(task => task.id));
  const currentById = new Map(state.tasks.map(task => [task.id, task]));
  state.tasks = snapshot.tasks.map(task => currentById.get(task.id) || task).concat(state.tasks.filter(task => !restoredIds.has(task.id)));
  state.series = snapshot.series.map(series => {
    const current = state.series.find(item => item.id === series.id);
    return current ? { ...current, active: series.active, skipped: series.skipped } : series;
  }).concat(state.series.filter(series => !snapshot.series.some(item => item.id === series.id)));
  // Only merge progress entries for restored tasks; completed cleared work stays counted.
  for (const [day, entries] of Object.entries(snapshot.daily)) state.daily[day] = { ...entries, ...(state.daily[day] || {}) };
  // Restoring a deleted pin must not displace newly pinned work or exceed three.
  let availablePins = Math.max(0, 3 - currentPins.size);
  let unpinnedOnUndo = false;
  state.tasks.forEach(task => { if (task.pinned && !currentPins.has(task.id)) { task.pinned = availablePins > 0; if (!task.pinned) unpinnedOnUndo = true; availablePins--; } });
  $('#task-undo-toast').hidden = true; commit(); $('#add-task-button').focus();
  if (unpinnedOnUndo) announce('Restored tasks are unpinned because your top three is full.');
});
function toggleTask(id) {
  const task = getTask(id); if (!task) return;
  const before = syncDailyProgress();
  task.done = !task.done; task.completedDate = task.done ? dateKey() : null;
  commit(); playSound(task.done);
  const after = syncDailyProgress();
  if (task.done && after.total > 0 && after.done === after.total && before.done < before.total) celebrate();
  const row = $(`[data-task-id="${task.id}"]`);
  (row?.querySelector('.task-toggle') || $('#add-task-button')).focus();
}
let celebrationTimer;
function celebrate() {
  const element = $('#celebration'); element.hidden = false;
  element.classList.remove('celebrate'); void element.offsetWidth; element.classList.add('celebrate');
  clearTimeout(celebrationTimer); celebrationTimer = setTimeout(() => { element.hidden = true; }, 3200);
}
function createRow(task) {
  const row = document.createElement('div'); row.className = `todo-row${task.done ? ' done' : ''}${task.pinned ? ' pinned' : ''}`;
  row.dataset.taskId = task.id; row.dataset.priority = task.priority; row.dataset.dueDate = task.dueDate || '';
  row.draggable = true;
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'task-toggle';
  toggle.setAttribute('aria-pressed', String(task.done)); toggle.setAttribute('aria-label', task.text);
  const details = [task.priority !== 'normal' ? `${task.priority} priority` : '', task.dueDate ? `Due ${shortDate(task.dueDate)}` : '', isRepeating(task) ? 'Repeating task' : '', task.pinned ? 'Pinned' : ''].filter(Boolean).join(' · ');
  toggle.title = `${task.text}${details ? ' · ' + details : ''}`;
  if (details) toggle.setAttribute('aria-description', details);
  const ball = document.createElement('span'); ball.className = 'pop-ball ball-style-a'; ball.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span'); label.className = 'todo-task-label'; label.textContent = task.text;
  const badge = document.createElement('span'); badge.className = 'task-due-badge'; badge.setAttribute('aria-hidden', 'true');
  badge.textContent = [task.pinned ? '★' : '', isRepeating(task) ? '↻' : '', task.dueDate ? shortDate(task.dueDate) : ''].filter(Boolean).join(' ');
  badge.classList.toggle('overdue', Boolean(!task.done && task.dueDate && task.dueDate < dateKey()));
  toggle.append(ball, label, badge); toggle.addEventListener('click', () => toggleTask(task.id));
  const options = document.createElement('button'); options.type = 'button'; options.className = 'task-options'; options.textContent = '⋯';
  options.title = 'Task options · Alt + ↑/↓ to reorder'; options.setAttribute('aria-label', `Options for task: ${task.text}`); options.setAttribute('aria-expanded', 'false'); options.setAttribute('aria-controls', 'task-options-menu');
  options.addEventListener('click', () => openTaskMenu(task.id, options));
  options.addEventListener('keydown', event => {
    if (event.altKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); moveTask(task.id, event.key === 'ArrowUp' ? -1 : 1); }
  });
  row.append(toggle, options);
  row.addEventListener('dragstart', event => {
    event.dataTransfer.setData('text/plain', task.id); event.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging');
  });
  row.addEventListener('dragend', () => row.classList.remove('dragging'));
  row.addEventListener('dragover', event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; });
  row.addEventListener('drop', event => {
    event.preventDefault(); const source = getTask(event.dataTransfer.getData('text/plain'));
    if (!source || source.id === task.id) return;
    if (source.pinned !== task.pinned) { announce('Move within the pinned group, or unpin the task first.'); return; }
    const from = state.tasks.indexOf(source); state.tasks.splice(from, 1);
    const after = event.clientY > row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
    state.tasks.splice(state.tasks.indexOf(task) + (after ? 1 : 0), 0, source); commit();
  });
  return row;
}
function moveTask(id, direction) {
  const task = getTask(id); if (!task) return;
  const peers = visibleTasks().filter(other => other.pinned === task.pinned);
  const target = peers[peers.indexOf(task) + direction]; if (!target) return;
  state.tasks.splice(state.tasks.indexOf(task), 1);
  state.tasks.splice(state.tasks.indexOf(target) + (direction > 0 ? 1 : 0), 0, task);
  commit(); $(`[data-task-id="${id}"] .task-options`)?.focus();
}
function pinTask(task) {
  if (!task.pinned && state.tasks.filter(item => item.pinned).length >= 3) { announce('Three tasks are already pinned. Unpin one first.'); return; }
  task.pinned = !task.pinned; commit(); focusOptions(task.id);
}
function focusOptions(id) { ($(`[data-task-id="${id}"] .task-options`) || $('#add-task-button')).focus(); }
function openTaskMenu(id, trigger) {
  const task = getTask(id); if (!task) return;
  const wasOpen = taskMenu.matches(':popover-open') && menuTaskId === id;
  menuTrigger?.setAttribute('aria-expanded', 'false'); taskMenu.hidePopover(); if (wasOpen) return;
  menuTaskId = id; menuTrigger = trigger;
  taskMenu.querySelector('[data-action="pin"]').textContent = task.pinned ? 'Unpin task' : 'Pin to top 3';
  taskMenu.querySelector('[data-action="stop"]').hidden = !isRepeating(task);
  const peers = visibleTasks().filter(other => other.pinned === task.pinned);
  taskMenu.querySelector('[data-action="up"]').disabled = peers.indexOf(task) === 0;
  taskMenu.querySelector('[data-action="down"]').disabled = peers.indexOf(task) === peers.length - 1;
  const rect = trigger.getBoundingClientRect();
  taskMenu.showPopover();
  // On desktop the menu is zoomed, so screen pixels are divided by the zoom.
  const zoom = parseFloat(getComputedStyle(taskMenu).zoom) || 1;
  const { width, height } = taskMenu.getBoundingClientRect();
  taskMenu.style.left = `${Math.max(8, Math.min(rect.right - width, innerWidth - width - 8)) / zoom}px`;
  taskMenu.style.top = `${Math.max(8, Math.min(rect.bottom + 6, innerHeight - height - 8)) / zoom}px`;
  trigger.setAttribute('aria-expanded', 'true'); taskMenu.querySelector('button').focus();
}
taskMenu.addEventListener('toggle', () => { menuTrigger?.setAttribute('aria-expanded', String(taskMenu.matches(':popover-open'))); });
taskMenu.addEventListener('keydown', event => { if (event.key === 'Escape') menuTrigger?.focus(); });
taskMenu.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); const task = getTask(menuTaskId); if (!button || !task) return;
  taskMenu.hidePopover();
  switch (button.dataset.action) {
    case 'edit': openTaskDialog(task, menuTrigger); break;
    case 'delete': removeTasks([task], isRepeating(task) ? 'Occurrence deleted' : 'Task deleted'); break;
    case 'pin': pinTask(task); break;
    case 'up': moveTask(task.id, -1); break;
    case 'down': moveTask(task.id, 1); break;
    case 'stop': {
      saveUndo('Repeating stopped; current task kept'); const series = getSeries(task); series.active = false;
      state.tasks = state.tasks.filter(item => item.seriesId !== series.id || item.done || item.dueDate <= dateKey() || item.id === task.id);
      commit(); focusOptions(task.id); break;
    }
  }
});
$('#todo-container').addEventListener('scroll', () => taskMenu.hidePopover());
window.addEventListener('resize', () => taskMenu.hidePopover());

function addNewTask() { openTaskDialog(null, $('#add-task-button')); }
function openTaskDialog(task, trigger) {
  editingId = task?.id || null; dialogTrigger = trigger;
  $('#add-task-form').reset(); $('#task-form-error').hidden = true; $('#new-task-input').setCustomValidity('');
  $('#add-task-title').textContent = task ? 'Edit your task' : 'A little task for today';
  $('#add-task-form .task-submit').textContent = task ? 'Save changes' : '+ Add task';
  $('#close-task-dialog').setAttribute('aria-label', task ? 'Close edit task' : 'Close add task');
  $('#new-task-input').value = task?.text || '';
  $('#task-due-date').value = task ? task.dueDate || '' : selectedDate || (view === 'upcoming' ? plusDays(dateKey(), 1) : dateKey());
  $('#task-priority').value = task?.priority || 'normal'; $('#task-pinned').checked = Boolean(task?.pinned);
  const series = task && isRepeating(task) ? getSeries(task) : null;
  $('#task-repeat').value = series?.mode || 'none';
  $$('#repeat-weekdays input').forEach(input => { input.checked = Boolean(series?.days.includes(Number(input.value))); });
  updateRepeatFields(); taskDialog.showModal(); $('#new-task-input').focus(); if (task) $('#new-task-input').select();
}
function updateRepeatFields() {
  $('#repeat-weekdays').hidden = $('#task-repeat').value !== 'custom';
  const task = getTask(editingId);
  $('#repeat-help').textContent = task && isRepeating(task) ? 'Edits apply to this occurrence. Changing repeat updates its future schedule.' : 'Repeats start on the due date, or today.';
}
$('#task-repeat').addEventListener('change', updateRepeatFields);
$('#clear-due-date').addEventListener('click', () => { $('#task-due-date').value = ''; });
$('#new-task-input').addEventListener('input', () => $('#new-task-input').setCustomValidity(''));
$('#close-task-dialog').addEventListener('click', () => taskDialog.close());
$('#cancel-task-dialog').addEventListener('click', () => taskDialog.close());
taskDialog.addEventListener('close', () => {
  const id = editingId;
  $('#add-task-form').reset(); editingId = null;
  const replacement = id && $(`[data-task-id="${id}"] .task-options`);
  (replacement || (dialogTrigger?.isConnected ? dialogTrigger : $('#add-task-button'))).focus();
});
function formError(message) { $('#task-form-error').textContent = message; $('#task-form-error').hidden = false; }
$('#add-task-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('#new-task-input').value.trim();
  if (!text) { $('#new-task-input').setCustomValidity('Please enter a task name.'); $('#new-task-input').reportValidity(); return; }
  const mode = $('#task-repeat').value;
  const days = $$('#repeat-weekdays input:checked').map(input => Number(input.value));
  if (mode === 'custom' && !days.length) { formError('Choose at least one weekday.'); return; }
  const pinned = $('#task-pinned').checked;
  if (pinned && state.tasks.filter(task => task.pinned && task.id !== editingId).length >= 3) { formError('Your top three is full. Unpin a task first.'); return; }
  let task = getTask(editingId);
  const dueDate = $('#task-due-date').value || (mode !== 'none' ? dateKey() : null);
  const priority = $('#task-priority').value;
  if (dueDate && !parseDate(dueDate)) { formError('Please choose a valid due date.'); return; }
  const oldSeries = task && isRepeating(task) ? getSeries(task) : null;
  const scheduleChanged = oldSeries ? oldSeries.mode !== mode || (mode === 'custom' && [...oldSeries.days].sort().join() !== [...days].sort().join()) : mode !== 'none';
  let firstOccurrence = dueDate;
  if (scheduleChanged && mode === 'custom') {
    while (firstOccurrence && !days.includes(parseDate(firstOccurrence).getDay())) firstOccurrence = plusDays(firstOccurrence, 1);
    if (!firstOccurrence) { formError('Choose an earlier start date for this schedule.'); return; }
  }
  if (task && scheduleChanged && undoState) { undoState = null; $('#task-undo-toast').hidden = true; }
  if (task) {
    task.text = text; task.dueDate = dueDate; task.priority = priority; task.pinned = pinned;
  } else {
    task = normalizeTask({ text, done: false, dueDate, priority, pinned }); state.tasks.push(task);
  }
  if (scheduleChanged) {
    if (oldSeries) {
      oldSeries.active = false;
      state.tasks = state.tasks.filter(item => item.id === task.id || item.seriesId !== oldSeries.id || item.done || item.dueDate < dateKey());
    }
    task.seriesId = null; task.occurrenceDate = null;
    if (mode !== 'none') {
      const series = { id: uid(), text, start: dueDate, mode, days, priority, skipped: [], active: true };
      state.series.push(series);
      // For selected weekdays, start with the first matching date rather than inventing an off-schedule occurrence.
      const first = firstOccurrence;
      task.dueDate = first; task.seriesId = series.id; task.occurrenceDate = first;
    }
  }
  if (!editingId && selectedDate && task.dueDate !== selectedDate) selectedDate = task.dueDate;
  if (!editingId && view === 'completed' && !selectedDate) view = task.dueDate > dateKey() ? 'upcoming' : 'today';
  if (!selectedDate && view === 'today' && task.dueDate > dateKey()) view = 'upcoming';
  else if (!selectedDate && view === 'upcoming' && (!task.dueDate || task.dueDate <= dateKey())) view = 'today';
  commit(); taskDialog.close();
});
$('#clear-finished-button').addEventListener('click', () => {
  const done = visibleTasks().filter(task => task.done); removeTasks(done, `${done.length} finished ${done.length === 1 ? 'task' : 'tasks'} cleared`);
});

function renderCalendar() {
  const today = dateKey(); const year = calendarMonth.getFullYear(); const month = calendarMonth.getMonth();
  $('.cal-title-num').textContent = new Date().getDate();
  $('#calendar-month').textContent = calendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const grid = $('.cal-dates-wrap'); const focusedDay = grid.contains(document.activeElement) ? document.activeElement.dataset.date : null;
  grid.replaceChildren();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
  const dates = new Set(state.tasks.map(task => task.dueDate).filter(Boolean));
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
    const date = new Date(year, month, day); const key = dateKey(date);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'cal-date'; button.dataset.date = key; button.textContent = day;
    button.setAttribute('aria-label', date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + (dates.has(key) ? ', has tasks' : ''));
    button.setAttribute('aria-pressed', String(selectedDate === key));
    if (key === today) button.setAttribute('aria-current', 'date');
    button.classList.toggle('selected-day', selectedDate === key); button.classList.toggle('has-tasks', dates.has(key));
    button.addEventListener('click', () => { selectedDate = key; render(); }); grid.append(button);
  }
  if (focusedDay) grid.querySelector(`[data-date="${focusedDay}"]`)?.focus();
}
function render() {
  const tasks = visibleTasks();
  $$('#todo-container .todo-row:not(.add-task-row)').forEach(row => row.remove());
  const empty = $('#task-empty-message');
  const fragment = document.createDocumentFragment(); tasks.forEach(task => fragment.append(createRow(task))); empty.before(fragment);
  empty.hidden = tasks.length > 0;
  empty.textContent = selectedDate ? 'No tasks for this day yet.' : ({ today: 'A little breathing room. Add a task?', upcoming: 'Nothing planned ahead yet.', completed: 'Your finished tasks will appear here.', all: 'A fresh start. Add your first task.' })[view];
  $$('.task-views button').forEach(button => button.setAttribute('aria-pressed', String(!selectedDate && view === button.dataset.view)));
  $('#task-filter-label').textContent = selectedDate ? `Due ${shortDate(selectedDate)}, ${parseDate(selectedDate).getFullYear()}` : ({ today: 'Today, overdue & no date', upcoming: 'Your plans ahead', completed: 'A little collection of done', all: 'All tasks' })[view];
  $('#show-all-tasks').hidden = !selectedDate && view === 'all';
  const count = tasks.filter(task => task.done).length;
  $('#clear-finished-button').disabled = !count; $('#clear-finished-button').textContent = count ? `Clear finished (${count})` : 'Clear finished';
  const progress = syncDailyProgress(); const percent = progress.total ? Math.round(progress.done / progress.total * 100) : 0;
  $('#daily-progress-text').textContent = `${progress.done} of ${progress.total} completed`;
  $('#daily-progress-ring').style.setProperty('--progress', `${percent}%`); $('#daily-progress-ring').setAttribute('aria-valuenow', percent); $('#daily-progress-ring').setAttribute('aria-valuetext', `${progress.done} of ${progress.total} completed today`);
  renderCalendar();
  if ($('#weekly-review-dialog').open) renderWeeklyReview();
}
$$('.task-views button').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; selectedDate = null; render(); }));
$('#show-all-tasks').addEventListener('click', () => { selectedDate = null; view = 'all'; render(); });
$('#calendar-prev').addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1); ensureOccurrences(); persist(); render(); });
$('#calendar-next').addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1); ensureOccurrences(); persist(); render(); });
$('#calendar-today').addEventListener('click', () => { const now = new Date(); calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1); selectedDate = null; view = 'today'; ensureOccurrences(); render(); });

// Browser-local notes are independent from task edits and undo.
try { const notes = localStorage.getItem(NOTES_KEY); if (notes !== null) { $('#notes-input').value = notes; $('#notes-save-status').textContent = 'Saved'; } }
catch { $('#notes-save-status').textContent = 'Saving unavailable'; }
$('#notes-input').addEventListener('input', () => {
  try { localStorage.setItem(NOTES_KEY, $('#notes-input').value); $('#notes-save-status').textContent = 'Saved'; }
  catch { $('#notes-save-status').textContent = 'Not saved'; }
});
const WATER_HISTORY_KEY = 'todo-dashboard-water-history';
function normalizeWaterHistory(history) {
  if (!history || typeof history !== 'object' || Array.isArray(history)) return {};
  return Object.fromEntries(Object.entries(history).filter(([key, entry]) => parseDate(key) && entry && Number.isFinite(entry.amount) && entry.amount >= 0 && entry.amount <= 100000).sort(([a], [b]) => a.localeCompare(b)).slice(-31).map(([key, entry]) => [key, { amount: entry.amount, goal: Number.isFinite(entry.goal) && entry.goal >= 250 && entry.goal <= 10000 && entry.goal % 250 === 0 ? entry.goal : null }]));
}
let waterHistory = normalizeWaterHistory(readStored(WATER_HISTORY_KEY, {}));
function waterDateKey(day) {
  if (typeof day !== 'string') return null;
  const key = day.split('-').map((part, index) => index ? part.padStart(2, '0') : part).join('-');
  return parseDate(key) ? key : null;
}
function recordWaterDay(day, amount, goal) {
  const key = waterDateKey(day); if (!key || key > dateKey() || !Number.isFinite(amount) || amount < 0) return;
  const target = Number.isFinite(goal) && goal >= 250 && goal <= 10000 && goal % 250 === 0 ? goal : null;
  if (waterHistory[key]?.amount === amount && waterHistory[key]?.goal === target) return;
  waterHistory[key] = { amount, goal: target }; waterHistory = normalizeWaterHistory(waterHistory);
  writeStored(WATER_HISTORY_KEY, waterHistory);
  return true;
}
let waterDay = ''; let waterAmount = 0;
function syncWaterDay() {
  const now = new Date(); const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  if (waterDay === day) return;
  const saved = readStored(WATER_KEY, null);
  if (waterDay) recordWaterDay(waterDay, waterAmount, waterHistory[waterDateKey(waterDay)]?.goal);
  if (saved?.day && saved.day !== day) recordWaterDay(saved.day, saved.amount, waterHistory[waterDateKey(saved.day)]?.goal ?? saved.goal);
  waterDay = day;
  waterAmount = saved?.day === day && Number.isFinite(saved.amount) ? Math.max(0, saved.amount) : 0;
}
function renderSummaryProgress(selector, fraction, height) {
  const fill = $(selector); const value = Math.max(0, Math.min(1, fraction));
  fill.style.height = `${value * height}px`; fill.style.visibility = value > 0 ? 'visible' : 'hidden'; fill.setAttribute('aria-valuenow', Math.round(value * 100));
  return Math.round(value * 100);
}
function renderWater() {
  syncWaterDay(); const historyChanged = recordWaterDay(waterDay, waterAmount, settings.waterGoal);
  const percent = renderSummaryProgress('.water-intake-fill', waterAmount / settings.waterGoal, 87);
  $('.water-intake-value').textContent = `${percent}%`; $('.water-intake-detail').textContent = `${waterAmount} / ${settings.waterGoal} mL`;
  $('#water-minus').disabled = waterAmount === 0; $('#water-plus').disabled = waterAmount >= settings.waterGoal;
  if (historyChanged && $('#weekly-review-dialog').open) renderWeeklyReview();
}
function changeWater(delta) {
  syncWaterDay(); waterAmount = delta > 0 ? Math.min(settings.waterGoal, waterAmount + delta) : Math.max(0, waterAmount + delta);
  writeStored(WATER_KEY, { day: waterDay, amount: waterAmount, goal: settings.waterGoal }); renderWater();
}
$('#water-minus').addEventListener('click', () => changeWater(-250)); $('#water-plus').addEventListener('click', () => changeWater(250));
function applySettings() { $('.hello-tin span').textContent = settings.name; $('.everyday-sub').textContent = settings.greeting; renderWater(); }
const settingsDialog = $('#settings-dialog');
$('#open-settings').addEventListener('click', () => {
  $('#settings-name').value = settings.name; $('#settings-greeting').value = settings.greeting; $('#settings-water').value = settings.waterGoal;
  $('#settings-sound').value = settings.sound; $('#settings-volume').value = settings.volume; $('#settings-volume-value').textContent = `${settings.volume}%`; $('#settings-status').textContent = '';
  settingsDialog.showModal();
});
$('#settings-volume').addEventListener('input', () => { $('#settings-volume-value').textContent = `${$('#settings-volume').value}%`; });
$('#preview-sound').addEventListener('click', () => playSound(true, $('#settings-sound').value, Number($('#settings-volume').value)));
$('#close-settings').addEventListener('click', () => settingsDialog.close()); $('#cancel-settings').addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('close', () => $('#open-settings').focus());
$('#settings-form').addEventListener('submit', event => {
  event.preventDefault(); const name = $('#settings-name').value.trim(); const greeting = $('#settings-greeting').value.trim();
  if (!name || !greeting) { $('#settings-status').textContent = 'Please enter a name and greeting.'; return; }
  settings = { name, greeting, waterGoal: Number($('#settings-water').value), sound: $('#settings-sound').value, volume: Number($('#settings-volume').value) };
  writeStored(SETTINGS_KEY, settings); applySettings(); settingsDialog.close();
});
let lastDay = dateKey();
function updateClock() {
  const now = new Date(); $('.clock-time').textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); $('.clock-day').textContent = now.toLocaleDateString('en-US', { weekday: 'long' }); $('.clock-date').textContent = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const remaining = midnight - now;
  const percent = renderSummaryProgress('.time-remaining-fill', remaining / (midnight - start), 100);
  $('.time-remaining-value').textContent = `${percent}%`; $('.time-remaining-detail').textContent = `${Math.floor(remaining / 3600000)}h ${Math.floor(remaining % 3600000 / 60000)}m left`;
  if (dateKey(now) !== lastDay) { lastDay = dateKey(now); calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1); commit(); }
  renderWater();
}
ensureOccurrences(); persist(); render(); applySettings(); updateClock(); setInterval(updateClock, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClock(); });

// Portable backups contain data only; source code and browser credentials are never included.
const RECOVERY_KEY = 'todo-dashboard-before-restore';
let pendingBackup = null;
let recoveryBackup = readStored(RECOVERY_KEY, null);
$('#recover-backup').hidden = !recoveryBackup;
function makeBackup() {
  syncWaterDay(); syncDailyProgress();
  return { app: 'neumorphic-todo', version: 1, createdAt: new Date().toISOString(), data: { state: structuredClone(state), settings: { ...settings }, notes: $('#notes-input').value, water: { day: waterDay, amount: waterAmount, goal: settings.waterGoal }, waterHistory: structuredClone(waterHistory) } };
}
function validateBackup(value) {
  const fail = () => { throw new Error('This is not a valid dashboard backup. Choose a JSON file downloaded from Backup & restore.'); };
  if (!value || value.app !== 'neumorphic-todo' || value.version !== 1 || !value.data) fail();
  const data = value.data, source = data.state, prefs = data.settings, water = data.water;
  if (!source || source.version !== 2 || !Array.isArray(source.tasks) || source.tasks.length > 10000 || !Array.isArray(source.series) || source.series.length > 1000) fail();
  if (!source.tasks.every(task => task && validId(task.id) && typeof task.text === 'string' && task.text.trim() && task.text.length <= 80 && typeof task.done === 'boolean' && (!task.dueDate || parseDate(task.dueDate)))) fail();
  if (new Set(source.tasks.map(task => task.id)).size !== source.tasks.length || source.tasks.filter(task => task.pinned).length > 3) fail();
  const series = normalizeSeries(source.series);
  if (series.length !== source.series.length || source.tasks.some(task => task.seriesId && (!series.some(item => item.id === task.seriesId) || !parseDate(task.occurrenceDate)))) fail();
  const occurrences = source.tasks.filter(task => task.seriesId).map(task => `${task.seriesId}:${task.occurrenceDate}`);
  if (new Set(occurrences).size !== occurrences.length) fail();
  if (!prefs || typeof prefs.name !== 'string' || !prefs.name.trim() || prefs.name.length > 30 || typeof prefs.greeting !== 'string' || !prefs.greeting.trim() || prefs.greeting.length > 80 || !Number.isFinite(prefs.waterGoal) || prefs.waterGoal < 250 || prefs.waterGoal > 10000 || prefs.waterGoal % 250 || !['pop', 'chime', 'off'].includes(prefs.sound) || !Number.isFinite(prefs.volume) || prefs.volume < 0 || prefs.volume > 100) fail();
  if (typeof data.notes !== 'string' || data.notes.length > 1000000 || !water || typeof water.day !== 'string' || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(water.day) || !parseDate(water.day.split('-').map((part, index) => index ? part.padStart(2, '0') : part).join('-')) || !Number.isFinite(water.amount) || water.amount < 0 || water.amount > 100000) fail();
  const history = normalizeWaterHistory(data.waterHistory);
  if (data.waterHistory !== undefined && (!data.waterHistory || typeof data.waterHistory !== 'object' || Array.isArray(data.waterHistory) || Object.keys(history).length !== Object.keys(data.waterHistory).length)) fail();
  return { app: value.app, version: 1, createdAt: value.createdAt, data: { state: { version: 2, tasks: source.tasks.map(normalizeTask), series, daily: normalizeDaily(source.daily) }, settings: { name: prefs.name.trim(), greeting: prefs.greeting.trim(), waterGoal: prefs.waterGoal, sound: prefs.sound, volume: prefs.volume }, notes: data.notes, water: { day: water.day, amount: water.amount, goal: Number.isFinite(water.goal) ? water.goal : null }, waterHistory: history } };
}
$('#export-backup').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(makeBackup(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `todo-backup-${dateKey()}.json`; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#backup-status').textContent = 'Backup downloaded. Keep it somewhere safe.';
});
let importRequest = 0;
$('#import-backup').addEventListener('change', async event => {
  const request = ++importRequest; const file = event.target.files[0];
  pendingBackup = null; $('#backup-preview').hidden = true; $('#backup-status').textContent = '';
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error('Choose a backup smaller than 2 MB.');
    const backup = validateBackup(JSON.parse(await file.text()));
    if (request !== importRequest) return;
    pendingBackup = backup;
    const data = backup.data;
    $('#backup-summary').textContent = `${data.state.tasks.length} tasks · ${data.state.series.filter(series => series.active).length} active schedules · ${data.notes.length} note characters · profile: ${data.settings.name}`;
    $('#backup-preview').hidden = false;
  } catch (error) {
    if (request === importRequest) $('#backup-status').textContent = error instanceof SyntaxError ? 'This file is not valid JSON. Your current data has not changed.' : error.message;
  }
});
function clearBackupPreview() {
  importRequest++; pendingBackup = null; $('#import-backup').value = ''; $('#backup-preview').hidden = true;
}
$('#cancel-restore').addEventListener('click', clearBackupPreview);
function restoreBackup(backup, keepRecovery) {
  const safe = validateBackup(backup);
  if (keepRecovery) { recoveryBackup = makeBackup(); writeStored(RECOVERY_KEY, recoveryBackup); $('#recover-backup').hidden = false; }
  state = safe.data.state; settings = safe.data.settings;
  waterHistory = safe.data.waterHistory; writeStored(WATER_HISTORY_KEY, waterHistory);
  $('#notes-input').value = safe.data.notes;
  try { localStorage.setItem(NOTES_KEY, safe.data.notes); $('#notes-save-status').textContent = 'Saved'; }
  catch { $('#notes-save-status').textContent = 'Not saved'; }
  writeStored(SETTINGS_KEY, settings); writeStored(WATER_KEY, safe.data.water);
  const now = new Date(); const todayWaterKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  waterDay = todayWaterKey; waterAmount = safe.data.water.day === todayWaterKey ? safe.data.water.amount : 0;
  undoState = null; $('#task-undo-toast').hidden = true; view = 'today'; selectedDate = null;
  calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1); clearBackupPreview();
  commit(); applySettings(); settingsDialog.close();
}
$('#confirm-restore').addEventListener('click', () => { if (pendingBackup) restoreBackup(pendingBackup, true); });
$('#recover-backup').addEventListener('click', () => {
  try { if (recoveryBackup) { restoreBackup(recoveryBackup, false); recoveryBackup = null; localStorage.removeItem(RECOVERY_KEY); $('#recover-backup').hidden = true; } }
  catch { $('#backup-status').textContent = 'The recovery copy could not be restored. Your current data has not changed.'; }
});
settingsDialog.addEventListener('close', clearBackupPreview);

function weekStart(key) {
  const date = parseDate(key);
  return plusDays(key, -((date.getDay() + 6) % 7));
}
let reviewWeek = weekStart(dateKey());
const reviewDialog = $('#weekly-review-dialog');
function earliestReviewWeek() {
  const keys = [...Object.keys(state.daily), ...Object.keys(waterHistory), ...state.tasks.map(task => task.completedDate)].filter(key => parseDate(key) && key <= dateKey());
  return weekStart(keys.sort()[0] || dateKey());
}
function weeklySummary(start) {
  const end = plusDays(start, 6); const today = dateKey();
  const firstRecordedCompletion = new Map();
  for (const [day, entries] of Object.entries(state.daily).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [id, done] of Object.entries(entries)) if (done && !firstRecordedCompletion.has(id)) firstRecordedCompletion.set(id, day);
  }
  const completed = new Set();
  // A known completion date is authoritative; daily snapshots preserve cleared tasks.
  for (const task of state.tasks) {
    if (task.completedDate && task.completedDate >= start && task.completedDate <= end && task.completedDate <= today) completed.add(task.id);
    else if (!task.completedDate) {
      const first = firstRecordedCompletion.get(task.id);
      if (first && first >= start && first <= end && first <= today) completed.add(task.id);
    }
  }
  const knownIds = new Set(state.tasks.map(task => task.id));
  for (const [id, first] of firstRecordedCompletion) if (!knownIds.has(id) && first >= start && first <= end && first <= today) completed.add(id);
  const pending = orderedTasks().filter(task => !task.done && (!task.dueDate || task.dueDate <= end));
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = plusDays(start, index); const future = key > today;
    const entries = !future && Object.hasOwn(state.daily, key) ? state.daily[key] : null;
    const water = !future ? waterHistory[key] || null : null;
    return { key, future, total: entries ? Object.keys(entries).length : null, done: entries ? Object.values(entries).filter(value => value === true).length : null, water };
  });
  return { start, end, completed, pending, days, archived: [...completed].filter(id => !knownIds.has(id)).length };
}
function renderReviewChart(selector, days, waterChart = false) {
  const chart = $(selector); chart.replaceChildren();
  for (const day of days) {
    const date = parseDate(day.key); const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const value = waterChart ? day.water : day.total;
    const recorded = value !== null;
    const unknownGoal = waterChart && recorded && !day.water.goal;
    const percent = !recorded || day.future || unknownGoal ? 0 : waterChart ? Math.min(100, day.water.amount / day.water.goal * 100) : day.total ? day.done / day.total * 100 : 0;
    const caption = day.future ? 'Ahead' : !recorded ? '—' : waterChart ? `${Number((day.water.amount / 1000).toFixed(2))} L` : `${day.done}/${day.total}`;
    const description = day.future ? 'Future day, not counted' : !recorded ? 'No saved record' : waterChart ? `${day.water.amount} mL${day.water.goal ? ` of ${day.water.goal} mL target` : ', target not recorded'}` : `${day.done} of ${day.total} checklist tasks complete`;
    const item = document.createElement('div'); item.className = 'review-chart-day'; item.setAttribute('role', 'listitem');
    item.dataset.date = day.key; item.dataset.state = day.future ? 'future' : !recorded ? 'unrecorded' : unknownGoal ? 'unknown-goal' : 'recorded';
    item.setAttribute('aria-label', `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}: ${description}`); item.title = description;
    const track = document.createElement('div'); track.className = 'review-bar-track'; track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('div'); fill.className = 'review-bar-fill'; fill.style.height = `${percent}%`; track.append(fill);
    const label = document.createElement('span'); label.className = 'review-day-label'; label.textContent = weekday; label.setAttribute('aria-hidden', 'true');
    const detail = document.createElement('span'); detail.className = 'review-day-value'; detail.textContent = caption; detail.setAttribute('aria-hidden', 'true');
    item.append(track, label, detail); chart.append(item);
  }
}
function renderReviewList(selector, tasks, emptyMessage) {
  const list = $(selector); list.replaceChildren();
  if (!tasks.length) { const empty = document.createElement('li'); empty.className = 'review-empty'; empty.textContent = emptyMessage; list.append(empty); return; }
  for (const task of tasks.slice(0, 10)) {
    const row = document.createElement('li'); const name = document.createElement('span'); name.textContent = task.text;
    const date = document.createElement('small'); date.textContent = selector === '#review-wins' ? task.completedDate ? shortDate(task.completedDate) : 'Recorded' : task.dueDate ? shortDate(task.dueDate) : 'No date';
    row.append(name, date); list.append(row);
  }
  if (tasks.length > 10) { const more = document.createElement('li'); more.className = 'review-empty'; more.textContent = `And ${tasks.length - 10} more`; list.append(more); }
}
function renderWeeklyReview() {
  syncDailyProgress();
  const current = weekStart(dateKey());
  if (reviewWeek > current) reviewWeek = current;
  if (reviewWeek < earliestReviewWeek()) reviewWeek = earliestReviewWeek();
  const summary = weeklySummary(reviewWeek);
  const startYear = parseDate(summary.start).getFullYear(), endYear = parseDate(summary.end).getFullYear();
  $('#review-week-label').textContent = `${shortDate(summary.start)}${startYear !== endYear ? `, ${startYear}` : ''} – ${shortDate(summary.end)}, ${endYear}`;
  $('#review-prev').disabled = reviewWeek <= earliestReviewWeek(); $('#review-next').disabled = reviewWeek >= current;
  $('#review-current').textContent = reviewWeek === current ? 'This week' : 'Back to this week';
  $('#review-finished').textContent = summary.completed.size;
  $('#review-finished').title = 'Each task counts once in the weekly total, including cleared tasks with saved records.';
  $('#review-pending').textContent = summary.pending.length;
  const recordedWater = summary.days.filter(day => day.water);
  const waterTargets = recordedWater.filter(day => day.water.goal);
  const waterGoals = waterTargets.filter(day => day.water.amount >= day.water.goal);
  $('#review-water-goals').textContent = waterTargets.length ? `${waterGoals.length}/${waterTargets.length}` : '—';
  const totalWater = recordedWater.reduce((sum, day) => sum + day.water.amount, 0);
  $('#review-water-summary').textContent = recordedWater.length ? `${Number((totalWater / 1000).toFixed(2))} L logged across ${recordedWater.length} recorded ${recordedWater.length === 1 ? 'day' : 'days'}. Goals use each day's saved target.` : 'Water history starts when you use the tracker. No records for this week yet.';
  renderReviewChart('#review-task-chart', summary.days);
  renderReviewChart('#review-water-chart', summary.days, true);
  const wins = state.tasks.filter(task => summary.completed.has(task.id)).sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''));
  renderReviewList('#review-wins', wins, summary.archived ? 'Finished tasks have been cleared from the list.' : 'Little wins will appear here as you finish tasks.');
  renderReviewList('#review-carryover', summary.pending, 'A little breathing room. Nothing to carry over.');
  $('#review-archived').hidden = !summary.archived;
  $('#review-archived').textContent = `${summary.archived} cleared ${summary.archived === 1 ? 'task is' : 'tasks are'} included in the total.`;
}
$('#open-weekly-review').addEventListener('click', () => { reviewWeek = weekStart(dateKey()); renderWater(); renderWeeklyReview(); reviewDialog.showModal(); });
$('#close-weekly-review').addEventListener('click', () => reviewDialog.close());
reviewDialog.addEventListener('close', () => $('#open-weekly-review').focus());
$('#review-prev').addEventListener('click', () => { reviewWeek = plusDays(reviewWeek, -7); renderWeeklyReview(); });
$('#review-next').addEventListener('click', () => { reviewWeek = plusDays(reviewWeek, 7); renderWeeklyReview(); });
$('#review-current').addEventListener('click', () => { reviewWeek = weekStart(dateKey()); renderWeeklyReview(); });
