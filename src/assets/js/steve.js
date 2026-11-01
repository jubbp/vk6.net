// Where's Steve? Floats around the window for 10 seconds, bouncing off the edges, then curves into the
// bottom-right corner at the same speed and stays there. Pauses on hover or while the card is open.
// Still in the corner for people who turn off motion. Closing hides it for the rest of the visit.
// With data-once-a-day (the live site) each browser sees it on its first home-page visit of the (Perth) day only.
(() => {
  const box = document.getElementById('steve'), badge = document.getElementById('sf-badge'), card = document.getElementById('sf-card'), close = document.getElementById('sf-close');
  if (!box) return;
  try { if (sessionStorage.getItem('steve-closed') === '1') return; } catch (e) {}
  if (box.hasAttribute('data-once-a-day')) {
    const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);  // Perth date
    try { if (localStorage.getItem('steve-seen') === today) return; localStorage.setItem('steve-seen', today); } catch (e) {}
  }
  box.hidden = false;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FLOAT_FOR = 10000, SPEED = 230, t0 = performance.now();
  let held = false, raf, last, homeAt = 0;
  const ang = (Math.random() * 0.6 + 0.2) * Math.PI / 2 + Math.floor(Math.random() * 4) * Math.PI / 2;  // never too flat or steep
  let x = 40 + Math.random() * Math.max(0, innerWidth - 300), y = 80 + Math.random() * Math.max(0, innerHeight - 260);
  let vx = Math.cos(ang) * SPEED, vy = Math.sin(ang) * SPEED;
  const place = () => { box.style.transform = `translate(${x}px, ${y}px)`; };
  const park = () => { cancelAnimationFrame(raf); box.style.transform = ''; box.classList.add('still', 'flip'); };
  const step = (now) => {
    const dt = Math.min(0.032, (now - (last || now)) / 1000); last = now;
    if (!held && card.hidden) {
      const w = box.offsetWidth, h = box.offsetHeight, maxX = innerWidth - w - 8, maxY = innerHeight - h - 8;
      if (now - t0 > FLOAT_FOR) {
        homeAt = homeAt || now;
        const dx = innerWidth - w - 16 - x, dy = innerHeight - h - 16 - y, d = Math.hypot(dx, dy);
        if (d < 1.5) { park(); return; }
        let a = Math.atan2(vy, vx);
        const diff = Math.atan2(Math.sin(Math.atan2(dy, dx) - a), Math.cos(Math.atan2(dy, dx) - a));
        const rate = 1.6 + (now - homeAt) / 1000 * 1.2 + (d < 200 ? (200 - d) / 200 * 4 : 0);
        a += Math.max(-rate * dt, Math.min(rate * dt, diff));
        const sp = d < 70 ? Math.max(25, SPEED * d / 70) : SPEED;
        vx = Math.cos(a) * sp; vy = Math.sin(a) * sp;
      }
      x += vx * dt; y += vy * dt;
      if (now - t0 <= FLOAT_FOR) {
        if (x <= 8) { x = 8; vx = Math.abs(vx); } else if (x >= maxX) { x = maxX; vx = -Math.abs(vx); }
        if (y <= 8) { y = 8; vy = Math.abs(vy); } else if (y >= maxY) { y = maxY; vy = -Math.abs(vy); }
      } else { x = Math.max(8, Math.min(maxX, x)); y = Math.max(8, Math.min(maxY, y)); }
      box.classList.toggle('flip', x > innerWidth / 2 || now - t0 > FLOAT_FOR);
      place();
    } else { last = now; }
    raf = requestAnimationFrame(step);
  };
  if (still) box.classList.add('still', 'flip'); else { place(); raf = requestAnimationFrame(step); }
  box.addEventListener('mouseenter', () => { held = true; });
  box.addEventListener('mouseleave', () => { held = false; });
  box.addEventListener('focusin', () => { held = true; });
  box.addEventListener('focusout', () => { held = false; });
  const setOpen = (open) => { card.hidden = !open; badge.setAttribute('aria-expanded', String(open)); box.classList.toggle('open', open); };
  badge.addEventListener('click', () => setOpen(card.hidden));
  close.addEventListener('click', () => { box.hidden = true; cancelAnimationFrame(raf); try { sessionStorage.setItem('steve-closed', '1'); } catch (e) {} });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !card.hidden) { setOpen(false); badge.focus(); } });
})();
