    let synth = null;

    function playPopSound(isDone) {
      try {
        if (!synth) {
          synth = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 3,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.12, sustain: 0.01, release: 0.2 }
          }).toDestination();
          synth.volume.value = -10;
        }
        if (Tone.context.state !== 'running') {
          Tone.start();
        }
        synth.triggerAttackRelease(isDone ? 'G3' : 'D4', '16n');
      } catch (err) {}
    }

    function toggleTask(elem) {
      const isDone = elem.classList.toggle('done');
      saveTasks();
      updateClearFinishedButton();
      playPopSound(isDone);
    }

    function addNewTask() {
      document.getElementById('add-task-dialog').showModal();
      document.getElementById('new-task-input').focus();
    }

    function closeTaskDialog() {
      document.getElementById('add-task-dialog').close();
    }

    const taskDialog = document.getElementById('add-task-dialog');
    const taskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('new-task-input');

    document.getElementById('close-task-dialog').addEventListener('click', closeTaskDialog);
    document.getElementById('cancel-task-dialog').addEventListener('click', closeTaskDialog);
    taskDialog.addEventListener('close', () => {
      taskForm.reset();
      taskInput.setCustomValidity('');
      document.getElementById('add-task-button').focus();
    });
    taskInput.addEventListener('input', () => taskInput.setCustomValidity(''));
    taskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const task = taskInput.value.trim();
      if (!task) {
        taskInput.setCustomValidity('Please enter a task name.');
        taskInput.reportValidity();
        return;
      }

      const container = document.getElementById('todo-container');
      const addRow = document.getElementById('add-task-button');
      const newRow = document.createElement('div');
      newRow.className = 'todo-row';
      newRow.onclick = function() { toggleTask(this); };
      const ball = document.createElement('div');
      ball.className = 'pop-ball ball-style-a';
      const label = document.createElement('span');
      label.className = 'todo-task-label';
      label.textContent = task;
      newRow.append(ball, label);
      container.insertBefore(newRow, addRow);
      saveTasks();
      closeTaskDialog();
      addRow.scrollIntoView({ block: 'nearest' });
      playPopSound(false);
    });

    function updateLiveClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      document.querySelector('.clock-time').textContent = `${hours}:${minutes}`;
      document.querySelector('.clock-day').textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
      document.querySelector('.clock-date').textContent = `${year}/${month}/${day}`;
    }

    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    const WATER_GOAL = 2000;
    const WATER_STEP = 250;
    const WATER_STORAGE_KEY = 'todo-dashboard-water';
    let waterDay = '';
    let waterAmount = 0;

    function localDayKey(now) {
      return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }

    function syncWaterDay(now) {
      const today = localDayKey(now);
      if (waterDay === today) return;
      waterDay = today;
      waterAmount = 0;
      try {
        const saved = JSON.parse(localStorage.getItem(WATER_STORAGE_KEY));
        if (saved && saved.day === today && Number.isFinite(saved.amount)) {
          waterAmount = Math.max(0, Math.min(WATER_GOAL, saved.amount));
        }
      } catch (error) {
        // Keep the controls usable when browser storage is unavailable.
      }
    }

    function renderSummaryProgress(selector, fraction, maxHeight) {
      const fill = document.querySelector(selector);
      const percent = Math.round(fraction * 100);
      fill.style.height = `${fraction * maxHeight}px`;
      fill.style.visibility = fraction > 0 ? 'visible' : 'hidden';
      fill.setAttribute('aria-valuenow', percent);
      return percent;
    }

    function renderWaterIntake() {
      const percent = renderSummaryProgress('.water-intake-fill', waterAmount / WATER_GOAL, 87);
      document.querySelector('.water-intake-value').textContent = `${percent}%`;
      document.querySelector('.water-intake-detail').textContent = `${waterAmount} / ${WATER_GOAL} mL`;
      document.getElementById('water-minus').disabled = waterAmount === 0;
      document.getElementById('water-plus').disabled = waterAmount === WATER_GOAL;
    }

    function changeWaterIntake(delta) {
      syncWaterDay(new Date());
      waterAmount = Math.max(0, Math.min(WATER_GOAL, waterAmount + delta));
      try {
        localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify({ day: waterDay, amount: waterAmount }));
      } catch (error) {
        // Continue tracking in memory if storage is unavailable.
      }
      renderWaterIntake();
    }

    function updateSummaryWidgets() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const remaining = midnight - now;
      const percent = renderSummaryProgress('.time-remaining-fill', remaining / (midnight - start), 100);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      document.querySelector('.time-remaining-value').textContent = `${percent}%`;
      document.querySelector('.time-remaining-detail').textContent = `${hours}h ${minutes}m left`;
      syncWaterDay(now);
      renderWaterIntake();
    }

    document.getElementById('water-minus').addEventListener('click', () => changeWaterIntake(-WATER_STEP));
    document.getElementById('water-plus').addEventListener('click', () => changeWaterIntake(WATER_STEP));
    updateSummaryWidgets();
    setInterval(updateSummaryWidgets, 1000);

    const TASKS_STORAGE_KEY = 'todo-dashboard-tasks';
    let lastClearedTasks = [];

    function updateClearFinishedButton() {
      const count = document.querySelectorAll('#todo-container .todo-row.done').length;
      const button = document.getElementById('clear-finished-button');
      button.disabled = count === 0;
      button.textContent = count ? `Clear finished (${count})` : 'Clear finished';
    }

    function saveTasks() {
      const tasks = Array.from(document.querySelectorAll('#todo-container .todo-row:not(.add-task-row)'), row => ({
        text: row.querySelector('.todo-task-label').textContent,
        done: row.classList.contains('done')
      }));
      try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        // Tasks remain usable when browser storage is unavailable.
      }
    }

    function restoreSavedTasks() {
      try {
        const saved = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY));
        if (!Array.isArray(saved) || !saved.every(task => task && typeof task.text === 'string' && typeof task.done === 'boolean')) return;
        const container = document.getElementById('todo-container');
        const addRow = document.getElementById('add-task-button');
        container.querySelectorAll('.todo-row:not(.add-task-row)').forEach(row => row.remove());
        saved.forEach(task => {
          const row = document.createElement('div');
          row.className = task.done ? 'todo-row done' : 'todo-row';
          row.onclick = function() { toggleTask(this); };
          const ball = document.createElement('div');
          ball.className = 'pop-ball ball-style-a';
          const label = document.createElement('span');
          label.className = 'todo-task-label';
          label.textContent = task.text;
          row.append(ball, label);
          container.insertBefore(row, addRow);
        });
      } catch (error) {
        // Use the original task list if saved data cannot be read.
      }
    }

    function clearFinishedTasks() {
      const rows = Array.from(document.querySelectorAll('#todo-container .todo-row.done'));
      if (!rows.length) return;
      lastClearedTasks = rows.map(row => ({ row, next: row.nextElementSibling }));
      rows.forEach(row => row.remove());
      saveTasks();
      updateClearFinishedButton();
      document.getElementById('task-removal-message').textContent = `${rows.length} finished ${rows.length === 1 ? 'task' : 'tasks'} cleared`;
      document.getElementById('task-undo-toast').hidden = false;
      document.getElementById('add-task-button').focus();
    }

    function undoClearTasks() {
      const container = document.getElementById('todo-container');
      const addRow = document.getElementById('add-task-button');
      lastClearedTasks.slice().reverse().forEach(({ row, next }) => {
        container.insertBefore(row, next && next.parentNode === container ? next : addRow);
      });
      lastClearedTasks = [];
      document.getElementById('task-undo-toast').hidden = true;
      saveTasks();
      updateClearFinishedButton();
      document.getElementById('clear-finished-button').focus();
    }

    document.getElementById('clear-finished-button').addEventListener('click', clearFinishedTasks);
    document.getElementById('undo-clear-tasks').addEventListener('click', undoClearTasks);
    restoreSavedTasks();
    updateClearFinishedButton();
