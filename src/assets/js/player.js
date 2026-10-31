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

  const mainAudio = () => document.querySelector('[data-player] audio');
  // Jump the page's main player to a time (seconds) and play.
  const playFrom = (at) => {
    const audio = mainAudio();
    if (!audio) return;
    const go = () => { audio.currentTime = at; audio.play().catch(() => {}); };
    if (audio.readyState >= 1) go(); else { audio.addEventListener('loadedmetadata', go, { once: true }); audio.load(); }
  };

  // Copy a segment's share link; plain-HTTP pages have no clipboard API, so fall back to a hidden text box.
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    const box = Object.assign(document.createElement('textarea'), { value: text });
    box.style.cssText = 'position:fixed;opacity:0';
    document.body.append(box);
    box.select();
    const ok = document.execCommand('copy');
    box.remove();
    return ok;
  };

  // Show notes: a copy-link button copies that segment's link; anywhere else on a timed line jumps the player.
  document.addEventListener('click', async (e) => {
    const share = e.target.closest('[data-share]');
    if (share) {
      const url = new URL(share.dataset.share, location.href).href;
      const ok = await copy(url);
      share.classList.add(ok ? 'copied' : 'failed');
      share.setAttribute('aria-label', ok ? 'Link copied' : 'Copy failed');
      share.title = ok ? 'Link copied' : url;
      if (!ok) window.prompt('Copy this link:', url);
      setTimeout(() => { share.classList.remove('copied', 'failed'); share.setAttribute('aria-label', 'Copy a link to this segment'); share.title = 'Copy a link to this segment'; }, 2000);
      return;
    }
    const t = e.target.closest('[data-at]');
    if (t) playFrom(Number(t.dataset.at));
  });

  // Highlight the show-notes line for the part of the episode that's playing.
  const markCurrent = (audio) => {
    const lines = [...document.querySelectorAll('.lead-notes li[data-at]')];
    let current = null;
    for (const li of lines) if (Number(li.dataset.at) <= audio.currentTime + 0.5) current = li;
    lines.forEach((li) => li.classList.toggle('current', li === current && audio.currentTime > 0));
  };

  // A link with ?t=6:06 (or ?t=366): cue the player there, highlight the segment and offer to play
  // (browsers don't let a page start audio before the visitor clicks).
  const parseTime = (s) => {
    if (!s) return null;
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
    if (/^\d+(:\d{1,2}){1,2}$/.test(s)) return s.split(':').reduce((a, p) => a * 60 + Number(p), 0);
    const m = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    return m && m[0] ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : null;
  };
  const cueFromUrl = () => {
    const at = parseTime(new URLSearchParams(location.search).get('t'));
    const panel = document.querySelector('[data-player]');
    if (at === null || !panel) return;
    const lines = [...document.querySelectorAll('.lead-notes li[data-at]')];
    const line = lines.filter((li) => Number(li.dataset.at) <= at + 0.5).pop();
    line?.classList.add('cued');
    const topic = line ? line.textContent.replace(/^\s*\d+(:\d\d)+\s*/, '').trim() : '';
    const cue = document.createElement('button');
    cue.type = 'button';
    cue.className = 'pp-cue';
    cue.innerHTML = '<span aria-hidden="true">▶</span> ';
    cue.append(`Play from ${fmt(at)}${topic ? `: ${topic}` : ''}`);
    cue.addEventListener('click', () => { playFrom(at); cue.remove(); line?.classList.remove('cued'); });
    panel.querySelector('.pp-main').append(cue);
    // If they use the player's own play button instead, still start at the linked time.
    const audio = mainAudio();
    audio?.addEventListener('play', () => {
      if (cue.isConnected && audio.currentTime < 1) { cue.remove(); line?.classList.remove('cued'); playFrom(at); }
    }, { once: true });
    (line || panel).scrollIntoView({ block: 'center' });
  };

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
    ['timeupdate', 'emptied'].forEach((e) => audio.addEventListener(e, () => markCurrent(audio)));
    // Another page script may swap the episode (Listen page): keep the chosen speed.
    audio.addEventListener('loadstart', () => { audio.playbackRate = SPEEDS.includes(Number(speed.textContent.replace('×', ''))) ? Number(speed.textContent.replace('×', '')) : 1; tick(); });
  });
  cueFromUrl();
})();
