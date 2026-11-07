// Infrastructure status (demonstration).
// 1. Report form in a dialog, preselecting the item whose button was pressed. Nothing is sent.
// 2. Live AllStar linking from AllStarLink's public stats (one request per hub, every minute
//    while the page is visible): hub cards, and a "linked / not linked" badge on each item.
//    Everything from the API is written with textContent, never as HTML.
(() => {
  const dlg = document.getElementById('report-dialog');
  if (dlg && dlg.showModal) {
    const form = dlg.querySelector('form');
    const done = dlg.querySelector('.rd-done');
    const send = form.querySelector('[type="submit"]');
    document.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', () => {
      form.reset();
      done.hidden = true;
      send.hidden = false;
      form.item.value = b.dataset.report;
      dlg.showModal();
      (b.dataset.report ? form.querySelector('[name="kind"]') : form.item).focus();
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      done.hidden = false;
      send.hidden = true;
    });
    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  const cfgEl = document.getElementById('allstar-data');
  if (!cfgEl || !window.fetch) return;
  const { hubs, nodes } = JSON.parse(cfgEl.textContent);
  const hubNodes = new Set(hubs.map((h) => h.node));
  const titleOf = (n) => (nodes[n] ? nodes[n].title : `AllStar ${n}`);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const ago = (iso) => {
    const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
  };
  const STALE_MIN = 15;   // a hub that hasn't reported for this long is shown as not reporting

  async function hubStatus(node) {
    try {
      const r = await fetch(`https://stats.allstarlink.org/api/stats/${node}`, { cache: 'no-store' });
      if (!r.ok) return { ok: false };
      const s = (await r.json()).stats;
      const linked = (s.data.linkedNodes || []).map((l) => ({
        node: String(l.name),
        call: l.callsign || '',
        where: (l.server && l.server.Location) || '',
      }));
      const fresh = Date.now() - Date.parse(s.updated_at) < STALE_MIN * 60000;
      return { ok: true, fresh, keyed: !!s.data.keyed, updated: s.updated_at, linked };
    } catch { return { ok: false }; }
  }

  function renderHub(h, st) {
    const card = document.querySelector(`.hub-card[data-hub="${h.node}"]`);
    if (!card) return;
    const state = card.querySelector('.hub-state');
    const body = card.querySelector('.hub-body');
    body.replaceChildren();
    card.classList.remove('is-up', 'is-stale', 'is-keyed');
    if (!st.ok) { state.textContent = 'No data'; body.append(el('p', 'small muted', "AllStarLink didn't answer. Trying again shortly.")); return; }
    card.classList.add(st.fresh ? 'is-up' : 'is-stale');
    if (st.keyed) card.classList.add('is-keyed');
    state.replaceChildren(el('i', 'dot'), document.createTextNode(st.fresh ? (st.keyed ? 'On air · TX now' : 'On air · idle') : 'Not reporting'));
    const ours = st.linked.filter((l) => nodes[l.node] && !hubNodes.has(l.node));
    const linkedHubs = st.linked.filter((l) => hubNodes.has(l.node));
    const hotspots = st.linked.filter((l) => !nodes[l.node] && !hubNodes.has(l.node) && /hotspot/i.test(l.where)).length;
    const others = st.linked.length - ours.length - linkedHubs.length - hotspots;
    body.append(el('p', 'small muted', `${st.linked.length} connected · updated ${ago(st.updated)}`));
    const row = (label, list) => {
      if (!list.length) return;
      const p = el('p', 'hub-row');
      p.append(el('span', 'hub-label', label));
      list.forEach((l) => p.append(el('span', 'hub-chip', l)));
      body.append(p);
    };
    row('Repeaters & gateways', ours.map((l) => titleOf(l.node)));
    row('Hubs', linkedHubs.map((l) => `⇄ ${titleOf(l.node)}`));
    const extra = [hotspots && `${hotspots} hotspot${hotspots > 1 ? 's' : ''}`, others > 0 && `${others} other node${others > 1 ? 's' : ''}`].filter(Boolean);
    if (extra.length) body.append(el('p', 'small muted', `+ ${extra.join(' · ')}`));
  }

  function renderBadges(status) {
    const answered = hubs.filter((h) => status[h.node].ok);
    const where = {};
    answered.forEach((h) => status[h.node].linked.forEach((l) => { (where[l.node] ||= []).push(h.node); }));
    const missing = [];
    document.querySelectorAll('.live-link[data-node]').forEach((b) => {
      const n = b.dataset.node;
      b.className = 'live-link';
      if (b.hasAttribute('data-is-hub')) {
        const st = status[n];
        if (!st) { b.textContent = ''; return; }
        b.classList.add(st.ok && st.fresh ? 'ok' : 'warn');
        b.textContent = st.ok ? (st.fresh ? `${st.linked.length} connected now` : 'Not reporting') : 'No data';
        return;
      }
      if (!answered.length) { b.textContent = ''; return; }
      const on = where[n] || [];
      const expect = b.dataset.expect;
      if (on.includes(expect)) { b.classList.add('ok'); b.textContent = 'Linked now'; }
      else if (on.length) { b.classList.add('ok'); b.textContent = `Linked via ${titleOf(on[0])}`; }
      else if (expect && !status[expect]?.ok) { b.textContent = ''; }
      else { b.classList.add('warn'); b.textContent = 'Not linked now'; missing.push(titleOf(n)); }
    });
    const sum = document.querySelector('.allstar-summary');
    const up = hubs.filter((h) => status[h.node].ok && status[h.node].fresh).length;
    sum.replaceChildren();
    if (!answered.length) { sum.append(el('span', 'muted', "Live AllStar status isn't available right now.")); return; }
    sum.append(el('b', null, `${up} of ${hubs.length} hubs on air. `));
    sum.append(document.createTextNode(missing.length
      ? `Not linked right now: ${missing.join(', ')}.`
      : 'Every repeater and gateway we track is linked.'));
  }

  async function refresh() {
    const results = await Promise.all(hubs.map((h) => hubStatus(h.node)));
    const status = Object.fromEntries(hubs.map((h, i) => [h.node, results[i]]));
    hubs.forEach((h) => renderHub(h, status[h.node]));
    renderBadges(status);
  }
  refresh();
  setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 60000);
})();
