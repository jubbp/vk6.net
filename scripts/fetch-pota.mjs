// Parks on the Air in WA: builds content/_live/pota.json from POTA's public API (api.pota.app).
// About 1,000 small requests, four at a time, so it takes a few minutes: run it on a schedule
// (hourly or daily), not on every build. The site builds without it; the POTA pages then say
// the figures aren't available yet.
//
// Usage: node scripts/fetch-pota.mjs
import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pota.app/';
const UA = { 'User-Agent': 'vk6.net (WA Amateur Radio News, newswest@vk6.net)' };
const out = new URL('../content/_live/pota.json', import.meta.url);

const get = async (path, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(API + path, { headers: UA }); if (r.ok) return await r.json(); } catch {}
    await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
  }
  return null;
};
const pool = async (items, fn, n = 4) => {
  const res = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; res[k] = await fn(items[k]); } }));
  return res;
};
const base = (c) => c.toUpperCase().replace(/^[A-Z0-9]+\//, '').replace(/\/[A-Z0-9]+$/, '');
const isVK6 = (c) => /^VK6[A-Z]{1,4}$/.test(c);
const day = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

const parks = await get('location/parks/AU-WA');
if (!parks) { console.error('POTA API not reachable; pota.json left as it was.'); process.exit(1); }
const name = Object.fromEntries(parks.map((p) => [p.reference, p.name]));
const activated = parks.filter((p) => p.activations > 0).map((p) => p.reference);
console.log(`${parks.length} WA parks, ${activated.length} activated; reading their histories…`);

const hist = await pool(activated, (ref) => get(`park/activations/${ref}?count=all`));
const boards = await pool(activated, (ref) => get(`park/leaderboard/${ref}`));
const acts = [];
activated.forEach((ref, k) => (hist[k] || []).forEach((a) => acts.push({ date: day(a.qso_date), call: base(a.activeCallsign), ref, qsos: a.totalQSOs, cw: a.qsosCW, data: a.qsosDATA, phone: a.qsosPHONE })));
acts.sort((a, b) => b.date.localeCompare(a.date) || b.qsos - a.qsos);

const today = new Date(); const ago = (n) => new Date(today - n * 864e5).toISOString().slice(0, 10);
const board = (rows) => {
  const m = new Map();
  for (const a of rows) if (isVK6(a.call)) { const e = m.get(a.call) || { call: a.call, activations: 0, parks: new Set(), qsos: 0 }; e.activations++; e.parks.add(a.ref); e.qsos += a.qsos; m.set(a.call, e); }
  return [...m.values()].map((e) => ({ ...e, parks: e.parks.size })).sort((a, b) => b.activations - a.activations || b.qsos - a.qsos);
};
const first = new Map(); for (const a of [...acts].reverse()) if (!first.has(a.ref)) first.set(a.ref, a.date);

// Hunters: POTA has no list of WA hunters, so check VK6 callsigns seen as activators or as top hunters of WA parks.
const hunterCalls = new Set(board(acts).map((e) => e.call));
boards.forEach((b) => (b?.hunter_qsos || []).forEach((h) => { const c = base(h.callsign); if (isVK6(c)) hunterCalls.add(c); }));
const calls = [...hunterCalls].sort();
const stats = await pool(calls, (c) => get(`stats/user/${c}`));
const hunters = calls.map((c, k) => ({ call: c, parks: stats[k]?.hunter?.parks || 0, qsos: stats[k]?.hunter?.qsos || 0 })).filter((h) => h.parks).sort((a, b) => b.parks - a.parks || b.qsos - a.qsos);

const years = {}; for (const a of acts) years[a.date.slice(0, 4)] = (years[a.date.slice(0, 4)] || 0) + 1;
const months = {};
for (const a of acts) { const m = a.date.slice(0, 7); (months[m] ||= []).push(a); }
const monthRows = Object.keys(months).sort().reverse().slice(0, 24).map((m) => {
  const rows = months[m]; const top = board(rows)[0];
  return { month: m, activations: rows.length, parks: new Set(rows.map((a) => a.ref)).size, firstEver: [...first.values()].filter((d) => d.startsWith(m)).length, qsos: rows.reduce((s, a) => s + a.qsos, 0), top: top ? { call: top.call, activations: top.activations } : null };
});
const perth = parks.filter((p) => !p.activations && Math.abs(p.latitude + 31.95) < 0.4 && Math.abs(p.longitude - 115.86) < 0.4);

const data = {
  generated: today.toISOString(),
  parks: { total: parks.length, activated: activated.length, never: parks.filter((p) => !p.activations).length, nearPerthNever: perth.length, nearPerthExamples: perth.slice(0, 4).map((p) => ({ ref: p.reference, name: p.name })) },
  totals: { activations: acts.length, qsos: acts.reduce((s, a) => s + a.qsos, 0), vk6Activators: board(acts).length, huntersChecked: calls.length },
  week: acts.filter((a) => a.date >= ago(7)).map((a) => ({ ...a, park: name[a.ref] })),
  month: acts.filter((a) => a.date >= ago(30) && a.date < ago(7)).slice(0, 12).map((a) => ({ ...a, park: name[a.ref] })),
  monthCount: acts.filter((a) => a.date >= ago(30)).length,
  activatorsYear: board(acts.filter((a) => a.date >= ago(365))).slice(0, 10),
  activatorsAll: board(acts).slice(0, 15),
  hunters: hunters.slice(0, 15),
  years, months: monthRows,
};
await mkdir(new URL('.', out), { recursive: true });
await writeFile(out, JSON.stringify(data, null, 1));
console.log(`pota.json: ${acts.length} activations, ${data.week.length} this week, ${hunters.length} VK6 hunters`);
