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
      playPopSound(isDone);
    }

    function addNewTask() {
      const task = prompt('Enter new task:');
      if (!task || !task.trim()) return;

      const container = document.getElementById('todo-container');
      const addRow = container.lastElementChild;

      const newRow = document.createElement('div');
      newRow.className = 'todo-row';
      newRow.onclick = function() { toggleTask(this); };
      newRow.innerHTML = `
        <div class="pop-ball ball-style-a"></div>
        <span class="todo-task-label">${task.trim()}</span>
      `;

      container.insertBefore(newRow, addRow);
      playPopSound(false);
    }

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
