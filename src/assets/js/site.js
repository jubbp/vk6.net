// Menu, "next broadcast" box, and copying the podcast feed address.
(() => {
  // Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });
  // Only one dropdown open at a time; close on outside click or Escape.
  const groups = [...document.querySelectorAll('.nav-group')];
  groups.forEach((g) => g.addEventListener('toggle', () => {
    if (g.open) groups.filter((o) => o !== g).forEach((o) => { o.open = false; });
  }));
  document.addEventListener('click', (e) => groups.forEach((g) => { if (!g.contains(e.target)) g.open = false; }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') groups.forEach((g) => { g.open = false; }); });

  // Next broadcast (Perth has no daylight saving, so a fixed offset is exact).
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function nextBroadcast(cfg, now) {
    const off = cfg.utcOffsetHours * 3600e3;
    const local = new Date(now + off);
    const target = DAYS.indexOf(cfg.day);
    const slots = [];
    for (let week = 0; week < 2; week++) {
      const dayDiff = ((target - local.getUTCDay() + 7) % 7) + week * 7;
      for (const t of cfg.times) {
        const [h, m] = t.time.split(':').map(Number);
        const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + dayDiff, h, m) - off;
        slots.push({ ...t, start, end: start + cfg.durationMinutes * 60e3 });
      }
    }
    return slots.filter((s) => s.end > now).sort((a, b) => a.start - b.start)[0];
  }
  function clock(ms, off) {
    const d = new Date(ms + off);
    const h = d.getUTCHours(); const m = d.getUTCMinutes();
    return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
  }
  function until(ms) {
    const mins = Math.round(ms / 60e3);
    const d = Math.floor(mins / 1440); const h = Math.floor((mins % 1440) / 60); const m = mins % 60;
    const parts = [];
    if (d) parts.push(`${d} day${d > 1 ? 's' : ''}`);
    if (h) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
    if (!d && m) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
    return parts.join(', ') || 'a moment';
  }
  document.querySelectorAll('[data-next-broadcast]').forEach((box) => {
    const cfg = JSON.parse(box.dataset.nextBroadcast);
    const render = () => {
      const now = Date.now();
      const next = nextBroadcast(cfg, now);
      if (!next) return;
      const live = now >= next.start;
      box.classList.toggle('is-live', live);
      box.querySelector('[data-status]').textContent = live ? 'On air now' : `Next: ${next.label.toLowerCase()}`;
      box.querySelector('[data-next]').textContent = `${clock(next.start, cfg.utcOffsetHours * 3600e3)} ${cfg.timezone}`;
      box.querySelector('[data-countdown]').textContent = live ? `${next.note}. Tune in now.` : `In ${until(next.start - now)} · ${next.note}`;
    };
    render();
    setInterval(render, 30e3);
  });

  // "Podcast feed" buttons copy the address (a feed opened in a browser is just XML).
  document.querySelectorAll('[data-copy]').forEach((a) => a.addEventListener('click', async (e) => {
    if (!navigator.clipboard) return;
    e.preventDefault();
    await navigator.clipboard.writeText(a.dataset.copy);
    const was = a.textContent;
    a.textContent = 'Feed address copied';
    setTimeout(() => { a.textContent = was; }, 2500);
  }));
})();
