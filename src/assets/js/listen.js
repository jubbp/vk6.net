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

  const q = document.querySelector('[data-search]');
  const year = document.querySelector('[data-year]');
  const count = document.querySelector('[data-count]');
  const items = [...document.querySelectorAll('.episode-list > li')];
  function filter() {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    for (const li of items) {
      const show = (!year.value || li.dataset.year === year.value) && words.every((w) => li.dataset.search.includes(w));
      li.hidden = !show;
      if (show) n++;
    }
    count.textContent = `${n} episode${n === 1 ? '' : 's'}${words.length || year.value ? ' found' : ''}`;
  }
  q?.addEventListener('input', filter);
  year?.addEventListener('change', filter);
  const initial = new URLSearchParams(location.search).get('q');
  if (initial && q) { q.value = initial; filter(); }
})();
