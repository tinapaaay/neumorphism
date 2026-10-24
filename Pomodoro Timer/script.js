    // State
    let totalSeconds = 25 * 60;
    let remainingSeconds = 25 * 60;
    let isRunning = false;
    let timerInterval = null;
    let soundEnabled = true;
    let currentMode = 'pomodoro';
    let timerDeadline = null;
    let hintTimeout = null;

    // Tone.js Synths
    let mechanicalClickSynth = null;
    let popUpSynth = null;
    let finishChimeSynth = null;

    function initAudio() {
      if (!mechanicalClickSynth && window.Tone) {
        // Heavy tactile push down click
        mechanicalClickSynth = new Tone.MembraneSynth({
          pitchDecay: 0.035,
          octaves: 3,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.06 }
        }).toDestination();
        mechanicalClickSynth.volume.value = -8;

        // Snappy spring pop-up release sound
        popUpSynth = new Tone.MembraneSynth({
          pitchDecay: 0.06,
          octaves: 2.2,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.08 }
        }).toDestination();
        popUpSynth.volume.value = -10;

        // Pleasant chime on finish
        finishChimeSynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.02, decay: 0.9, sustain: 0.05, release: 1.2 }
        }).toDestination();
        finishChimeSynth.volume.value = -12;
      }
    }

    function playAudioFeedback(action) {
      if (!soundEnabled) return;
      try {
        if (window.Tone && Tone.context.state !== 'running') {
          Tone.start();
        }
        initAudio();

        if (action === 'pushDown' && mechanicalClickSynth) {
          mechanicalClickSynth.triggerAttackRelease("D2", "16n");
        } else if (action === 'popUp' && popUpSynth) {
          popUpSynth.triggerAttackRelease("A3", "16n");
        } else if (action === 'finish' && finishChimeSynth) {
          finishChimeSynth.triggerAttackRelease(["E5", "G#5", "B5"], "4n");
        }
      } catch (e) {}
    }

    function formatTime(secs) {
      const mins = Math.floor(secs / 60);
      const remainingSecs = secs % 60;
      const mm = mins < 10 ? '0' + mins : mins;
      const ss = remainingSecs < 10 ? '0' + remainingSecs : remainingSecs;
      return `${mm}:${ss}`;
    }

    function updateDisplay() {
      const display = document.getElementById('timeText');
      display.textContent = formatTime(remainingSeconds);
      document.title = isRunning ? `(${formatTime(remainingSeconds)}) Running...` : "Neumorphic Pomodoro Timer";
    }

    function showHint(text) {
      const annotation = document.getElementById('annotationEl');
      document.getElementById('annotationLabel').textContent = text;
      annotation.classList.remove('is-hidden');
      clearTimeout(hintTimeout);
      hintTimeout = setTimeout(() => {
        annotation.classList.add('is-hidden');
      }, 3000);
    }

    function setDialVisualState(pushed) {
      const dial = document.getElementById('timerButton');
      document.getElementById('plateElement').classList.toggle('is-running', pushed);
      document.getElementById('breakMessage').setAttribute('aria-hidden', String(currentMode !== 'break' || pushed));

      if (pushed) {
        // Pushed down into socket
        dial.classList.add('is-pushed');
        showHint("Push to pause");
      } else {
        // Popped back out / raised
        dial.classList.remove('is-pushed');
        showHint(remainingSeconds === totalSeconds ? "Push to start" : "Push to resume");
      }
    }

    function handleDialPress() {
      if (!isRunning) {
        // START: PUSH DOWN INTO SOCKET
        isRunning = true;
        setDialVisualState(true);
        playAudioFeedback('pushDown');

        timerDeadline = Date.now() + remainingSeconds * 1000;
        updateDisplay();
        timerInterval = setInterval(() => {
          remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
          updateDisplay();
          if (remainingSeconds === 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerDeadline = null;
            isRunning = false;
            const finishedPomodoro = currentMode === 'pomodoro';
            const nextButton = document.getElementById(finishedPomodoro ? 'modeShortBreak' : 'modePomodoro');
            setMode(finishedPomodoro ? 5 : 25, nextButton);
            playAudioFeedback('finish');
            showHint(finishedPomodoro ? 'Push to start break' : 'Push for a new session');
          }
        }, 250);
      } else {
        // PAUSE: POP BACK UP
        pauseTimer();
      }
    }

    function pauseTimer() {
      if (isRunning) {
        remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
        clearInterval(timerInterval);
        timerInterval = null;
        timerDeadline = null;
        isRunning = false;
        updateDisplay();
        setDialVisualState(false);
        playAudioFeedback('popUp');
      }
    }

    function resetTimer() {
      pauseTimer();
      remainingSeconds = totalSeconds;
      updateDisplay();
      setDialVisualState(false);
      showHint("Push to start");
    }

    function setMode(mins, element) {
      pauseTimer();
      currentMode = mins === 5 ? 'break' : 'pomodoro';
      document.getElementById('plateElement').classList.toggle('is-break', currentMode === 'break');
      document.getElementById('breakMessage').setAttribute('aria-hidden', String(currentMode !== 'break'));
      document.getElementById('modeShortBreak').hidden = currentMode !== 'break';
      totalSeconds = mins * 60;
      remainingSeconds = totalSeconds;
      updateDisplay();
      setDialVisualState(false);

      document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
      if (element) element.classList.add('active');
      showHint("Push to start");
    }

    function toggleAudio() {
      soundEnabled = !soundEnabled;
      document.getElementById('muteToggle').textContent = soundEnabled ? '🔊' : '🔇';
    }

    // Initial load
    updateDisplay();
    showHint("Push to start");

    // Let the heading quietly disappear after the first introduction.
    setTimeout(() => {
      document.querySelector('.stage-wrapper').classList.add('title-is-quiet');
    }, 3500);
