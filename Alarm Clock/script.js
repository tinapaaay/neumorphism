    // State management
    const state = {
      isRealtime: false, // Default is screenshot fixed mode (3:00)
      soundEnabled: true,
      alarms: [
        { id: 1, time: "5:00", period: "am", active: true },
        { id: 2, time: "7:00", period: "pm", active: false },
        { id: 3, time: "8:42", period: "pm", active: true }
      ]
    };

    // Soft synthesis audio for subtle physical click feedback
    let synth = null;
    function playClickSound(tone = 380) {
      if (!state.soundEnabled) return;
      try {
        if (!synth) {
          synth = new Tone.MembraneSynth({
            pitchDecay: 0.008,
            octaves: 2,
            oscillator: { type: "sine" },
            envelope: { attack: 0.001, decay: 0.08, sustain: 0.01, release: 0.08 }
          }).toDestination();
          synth.volume.value = -14;
        }
        if (Tone.context.state !== 'running') {
          Tone.start();
        }
        synth.triggerAttackRelease(tone, "32n");
      } catch (e) {
        // Fallback gracefully if WebAudio is restricted
      }
    }

    // Render the alarms list
    function renderAlarms() {
      const container = document.getElementById('alarmsList');
      container.innerHTML = '';

      state.alarms.forEach(alarm => {
        const row = document.createElement('div');
        row.className = "neu-pill-row flex items-center justify-between py-2.5 px-6 cursor-pointer select-none";
        row.onclick = (e) => {
          // If clicked outside switch, toggle switch directly
          toggleAlarm(alarm.id);
        };

        const timeContainer = document.createElement('div');
        timeContainer.className = "flex items-baseline space-x-1.5";

        const timeVal = document.createElement('span');
        timeVal.className = `text-[17px] font-bold tracking-tight transition-colors duration-200 ${alarm.active ? 'text-[#352531]' : 'text-[#7e737c]'}`;
        timeVal.textContent = alarm.time;

        const periodVal = document.createElement('span');
        periodVal.className = `text-sm font-semibold tracking-tight transition-colors duration-200 ${alarm.active ? 'text-[#584854]' : 'text-[#9c919a]'}`;
        periodVal.textContent = alarm.period;

        timeContainer.appendChild(timeVal);
        timeContainer.appendChild(periodVal);

        // Neumorphic Switch
        const switchBtn = document.createElement('div');
        switchBtn.className = `w-12 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 relative ${
          alarm.active ? 'neu-switch-track-active' : 'neu-switch-track-inactive'
        }`;

        const thumb = document.createElement('div');
        thumb.className = `w-5 h-5 rounded-full transition-transform duration-300 transform ${
          alarm.active 
            ? 'translate-x-6 neu-thumb-active' 
            : 'translate-x-0 neu-thumb-inactive'
        }`;

        switchBtn.appendChild(thumb);
        row.appendChild(timeContainer);
        row.appendChild(switchBtn);
        container.appendChild(row);
      });

      updateNextAlarmStatus();
    }

    // Toggle alarm status
    function toggleAlarm(id) {
      const alarm = state.alarms.find(a => a.id === id);
      if (alarm) {
        alarm.active = !alarm.active;
        playClickSound(alarm.active ? 460 : 320);
        renderAlarms();
        showToast(`Alarm for ${alarm.time} ${alarm.period.toUpperCase()} ${alarm.active ? 'enabled' : 'disabled'}`);
      }
    }

    // Realtime vs Screenshot clock time
    function updateClockHands() {
      const hourHand = document.getElementById('hourHand');
      const minuteHand = document.getElementById('minuteHand');

      if (!state.isRealtime) {
        // Static time matching the reference screenshot: 3:00 (Hour = 90 deg, Minute = 0 deg)
        hourHand.style.transform = `rotate(90deg)`;
        minuteHand.style.transform = `rotate(0deg)`;
        return;
      }

      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const minuteAngle = (minutes + seconds / 60) * 6; // 360 / 60
      const hourAngle = (hours + minutes / 60) * 30; // 360 / 12

      hourHand.style.transform = `rotate(${hourAngle}deg)`;
      minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }

    function toggleRealtimeMode() {
      state.isRealtime = !state.isRealtime;
      document.getElementById('clockModeLabel').textContent = state.isRealtime ? 'Live Time' : 'Screenshot (3:00)';
      updateClockHands();
      toggleSettingsMenu();
      showToast(state.isRealtime ? "Clock synced to real time" : "Clock restored to 3:00");
    }

    function toggleSound() {
      state.soundEnabled = !state.soundEnabled;
      document.getElementById('soundLabel').textContent = state.soundEnabled ? 'On' : 'Off';
      if (state.soundEnabled) playClickSound(520);
      toggleSettingsMenu();
      showToast(`Audio feedback ${state.soundEnabled ? 'enabled' : 'muted'}`);
    }

    function toggleSettingsMenu() {
      const menu = document.getElementById('settingsMenu');
      menu.classList.toggle('hidden');
    }

    // Modal controls for new alarms
    function openAddAlarmModal() {
      toggleSettingsMenu();
      document.getElementById('addAlarmModal').classList.remove('hidden');
    }

    function closeAddAlarmModal() {
      document.getElementById('addAlarmModal').classList.add('hidden');
    }

    function saveNewAlarm() {
      const hour = parseInt(document.getElementById('inputHour').value, 10);
      const min = parseInt(document.getElementById('inputMin').value, 10);
      const period = document.getElementById('inputPeriod').value;

      if (isNaN(hour) || hour < 1 || hour > 12) return;
      const formattedMin = (isNaN(min) || min < 0) ? "00" : (min < 10 ? "0" + min : min.toString());

      state.alarms.push({
        id: Date.now(),
        time: `${hour}:${formattedMin}`,
        period: period,
        active: true
      });

      closeAddAlarmModal();
      renderAlarms();
      playClickSound(580);
      showToast(`New alarm set for ${hour}:${formattedMin} ${period.toUpperCase()}`);
    }

    function updateNextAlarmStatus() {
      const activeCount = state.alarms.filter(a => a.active).length;
      const banner = document.getElementById('nextAlarmCountdown');
      if (activeCount === 0) {
        banner.textContent = "All alarms disabled";
      } else {
        const firstActive = state.alarms.find(a => a.active);
        banner.textContent = `Next alarm: ${firstActive.time} ${firstActive.period.toUpperCase()}`;
      }
    }

    function showToast(text) {
      const toast = document.getElementById('toastMessage');
      toast.textContent = text;
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -10px)';
      clearTimeout(window.toastTimer);
      window.toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 0)';
      }, 2200);
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('settingsMenu');
      const menuBtn = document.getElementById('menuBtn');
      if (!menu.contains(e.target) && !menuBtn.contains(e.target) && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
      }
    });

    // Clock Loop
    setInterval(updateClockHands, 1000);

    // Initial render
    window.onload = function() {
      renderAlarms();
      updateClockHands();
    };
