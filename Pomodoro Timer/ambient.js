// Self-contained soundscapes: no downloads or external audio requests.
(() => {
  const selection = document.getElementById('ambientSoundSelect');
  const volume = document.getElementById('ambientVolume');
  const output = document.getElementById('ambientVolumeValue');
  const button = document.getElementById('ambientPlayButton');
  const status = document.getElementById('ambientStatus');
  const key = 'pomodoro-ambient-settings-v1';
  const names = { rain: 'Rain', cafe: 'Café', white: 'White noise' };
  let context = null, gain = null, source = null, playing = false, generation = 0;
  const buffers = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Object.hasOwn(names, saved.sound)) selection.value = saved.sound;
    if (saved && Number.isFinite(saved.volume)) volume.value = Math.max(0, Math.min(100, saved.volume));
  } catch (_) { /* Settings are optional if storage is unavailable. */ }
  output.textContent = `${volume.value}%`;
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ sound: selection.value, volume: Number(volume.value) })); } catch (_) {}
  }
  function updateButton() {
    button.textContent = playing ? 'Pause' : 'Play';
    button.setAttribute('aria-pressed', String(playing));
  }
  function stopSource() {
    if (source) { source.stop(); source.disconnect(); source = null; }
  }
  function makeBuffer(kind) {
    if (buffers.has(kind)) return buffers.get(kind);
    const rate = 32000, duration = 16;
    const buffer = context.createBuffer(2, rate * duration, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let slow = 0, fast = 0, brown = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / rate, noise = Math.random() * 2 - 1;
        slow += 0.018 * (noise - slow);
        fast += 0.22 * (noise - fast);
        brown = (brown + 0.025 * noise) / 1.025;
        if (kind === 'white') data[i] = noise * 0.23;
        else if (kind === 'rain') {
          const swell = 0.85 + 0.1 * Math.sin(t * Math.PI / 4 + channel);
          data[i] = ((fast - slow) * 0.9 + brown * 1.6) * swell;
        } else {
          // Soft distant room murmur, with sparse cup-and-saucer clinks.
          const murmur = 0.55 + 0.18 * Math.sin(t * Math.PI / 2) + 0.13 * Math.sin(t * Math.PI * 1.5 + channel);
          let clink = 0;
          for (const at of [2.3 + channel * 0.15, 7.8, 12.5 - channel * 0.1]) {
            const d = t - at;
            if (d >= 0 && d < 0.65) clink += Math.sin(d * 2 * Math.PI * (1900 + channel * 95)) * Math.exp(-d * 14) * Math.min(1, d * 500) * 0.055;
          }
          data[i] = (slow * 2.3 + (fast - slow) * 0.17) * murmur + clink;
        }
      }
      // Join the loop gently without a periodic hard edge.
      const fade = rate / 20;
      for (let i = 0; i < fade; i++) { data[i] *= i / fade; data[data.length - 1 - i] *= i / fade; }
    }
    buffers.set(kind, buffer);
    return buffer;
  }
  async function play() {
    const token = ++generation;
    playing = true; updateButton();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio unavailable');
      if (!context) { context = new AudioContext(); gain = context.createGain(); gain.connect(context.destination); }
      await context.resume();
      if (token !== generation || !playing) return;
      stopSource();
      source = context.createBufferSource();
      source.buffer = makeBuffer(selection.value);
      source.loop = true;
      source.connect(gain);
      gain.gain.setValueAtTime(Number(volume.value) / 100 * 0.65, context.currentTime);
      source.start();
      status.textContent = `${names[selection.value]} is playing.`;
      save();
    } catch (_) {
      if (token !== generation) return;
      stopSource(); playing = false; updateButton();
      status.textContent = 'Could not play audio. Press Play to try again.';
    }
  }
  button.addEventListener('click', () => {
    if (playing) {
      generation++; playing = false; stopSource(); updateButton();
      status.textContent = 'Sound paused.';
    } else play();
  });
  selection.addEventListener('change', () => {
    save();
    if (playing) play();
    else status.textContent = `${names[selection.value]} selected. Press Play when ready.`;
  });
  volume.addEventListener('input', () => {
    output.textContent = `${volume.value}%`;
    if (gain) gain.gain.setTargetAtTime(Number(volume.value) / 100 * 0.65, context.currentTime, 0.03);
    save();
  });
  window.addEventListener('pagehide', () => { generation++; playing = false; stopSource(); updateButton(); });
})();
