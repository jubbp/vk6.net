// Turns each [data-player] into an audio-app style player: play/pause, skip, seek, speed.
// The native <audio controls> stays as the fallback when JavaScript is off.
(() => {
  const fmt = (s) => {
    if (!isFinite(s)) return '--:--';
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  };
  const SPEEDS = [1, 1.25, 1.5, 2, 0.75];

  document.querySelectorAll('[data-player]').forEach((panel) => {
    const audio = panel.querySelector('audio');
    const ui = panel.querySelector('.pp-controls');
    if (!audio || !ui) return;
    audio.controls = false;
    audio.hidden = true;
    ui.hidden = false;

    const toggle = ui.querySelector('[data-toggle]');
    const seek = ui.querySelector('[data-seek]');
    const cur = ui.querySelector('[data-current]');
    const dur = ui.querySelector('[data-duration]');
    const speed = ui.querySelector('[data-speed]');
    let dragging = false;

    const sync = () => {
      const playing = !audio.paused && !audio.ended;
      panel.classList.toggle('is-playing', playing);
      toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    };
    const tick = () => {
      cur.textContent = fmt(audio.currentTime);
      dur.textContent = fmt(audio.duration);
      if (!dragging && audio.duration) seek.value = Math.round((audio.currentTime / audio.duration) * 1000);
      seek.style.setProperty('--pos', `${seek.value / 10}%`);
    };

    toggle.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
    ui.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => {
      audio.currentTime = Math.max(0, Math.min((audio.duration || Infinity), audio.currentTime + Number(b.dataset.skip)));
    }));
    seek.addEventListener('input', () => { dragging = true; seek.style.setProperty('--pos', `${seek.value / 10}%`); if (audio.duration) cur.textContent = fmt((seek.value / 1000) * audio.duration); });
    seek.addEventListener('change', () => { if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration; dragging = false; });
    speed.addEventListener('click', () => {
      const next = SPEEDS[(SPEEDS.indexOf(audio.playbackRate) + 1) % SPEEDS.length];
      audio.playbackRate = next;
      speed.textContent = `${next}×`;
    });
    ['play', 'pause', 'ended'].forEach((e) => audio.addEventListener(e, sync));
    ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied'].forEach((e) => audio.addEventListener(e, tick));
    // Another page script may swap the episode (Listen page): keep the chosen speed.
    audio.addEventListener('loadstart', () => { audio.playbackRate = SPEEDS.includes(Number(speed.textContent.replace('×', ''))) ? Number(speed.textContent.replace('×', '')) : 1; tick(); });
  });
})();
