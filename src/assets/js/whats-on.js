// What's on: filter buttons (everything, club events, contests). Hides weeks left empty.
(() => {
  const chips = [...document.querySelectorAll('.chip[data-kind]')];
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    const k = c.dataset.kind;
    document.querySelectorAll('.event[data-kind]').forEach((e) => { e.hidden = k !== 'all' && e.dataset.kind !== k; });
    document.querySelectorAll('[data-week]').forEach((w) => { w.hidden = !w.querySelector('.event:not([hidden])'); });
  }));
})();
