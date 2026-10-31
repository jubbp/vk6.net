// Listen page: play any episode in the main player, and filter the archive by text and year.
(() => {
  const audio = document.querySelector('[data-np-audio]');
  const label = document.querySelector('[data-np-label]');
  const link = document.querySelector('[data-np-link]');
  const notes = document.querySelector('[data-np-notes]');
  const download = document.querySelector('[data-np-download]');

  document.querySelectorAll('[data-play]').forEach((btn) => btn.addEventListener('click', () => {
    if (!audio) return;
    const item = btn.closest('li');
    audio.src = btn.dataset.audio;
    link.textContent = btn.dataset.title;
    link.href = btn.dataset.link;
    download.href = btn.dataset.audio;
    label.textContent = 'Now playing';
    // Copy the item's notes, which the server already rendered as escaped HTML.
    notes.replaceChildren(...[...item.querySelector('.ep-notes').childNodes].map((n) => n.cloneNode(true)));
    audio.play().catch(() => {});
    document.querySelector('[data-player]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  // Search every year; open the years with matches and hide the rest.
  const q = document.querySelector('[data-search]');
  const count = document.querySelector('[data-count]');
  const groups = [...document.querySelectorAll('[data-year-group]')];
  const initialOpen = groups.map((g) => g.open);
  function filter() {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0;
    groups.forEach((g, i) => {
      const items = [...g.querySelectorAll('.episode-list > li')];
      let n = 0;
      for (const li of items) {
        const text = li.dataset.search;
        const squashed = text.replace(/\s+/g, '');
        const show = words.every((w) => text.includes(w) || squashed.includes(w));
        li.hidden = !show;
        if (show) n++;
      }
      total += n;
      g.hidden = n === 0;
      g.open = words.length ? n > 0 : initialOpen[i];
      g.querySelector('[data-year-count]').textContent = words.length ? `${n} found` : `${items.length} episodes`;
    });
    count.textContent = words.length ? `${total} episode${total === 1 ? '' : 's'} found` : `${total} episodes`;
    document.querySelector('[data-none]').hidden = total > 0;
  }
  q?.addEventListener('input', filter);
  const initial = new URLSearchParams(location.search).get('q');
  if (initial && q) { q.value = initial; filter(); }
})();
