// Parks on the Air in WA: keeps a local copy of the WA data in content/pota/ (committed, so it builds up
// a history and can be analysed offline) and writes the site's summary to content/pota/summary.json.
// Gentle on POTA: one request for the WA park list, then only the parks whose activation count has
// changed since the last run (a few a day). Hunter totals refresh monthly. POTA offers no official
// data API yet and doesn't support third-party use. POTA is not a contest, so the site shows activity
// and thanks, not rankings. Run daily: logs reach POTA days or weeks after an activation, so each
// activation's first-seen date is kept and the site lists what was newly logged, late uploads included.
//
// Usage: node scripts/fetch-pota.mjs [--full]   (--full re-reads every park's history)
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const API = 'https://api.pota.app/';
const UA = { 'User-Agent': 'vk6.net (WA Amateur Radio News, newswest@vk6.net)' };
const CACHE = new URL('../content/pota/', import.meta.url);
const out = new URL('../content/pota/summary.json', import.meta.url);  // what the site shows; committed with the cache
const FULL = process.argv.includes('--full');
let requests = 0;

const get = async (path, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    requests++;
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
const load = async (name, fallback) => { try { return JSON.parse(await readFile(new URL(name, CACHE), 'utf8')); } catch { return fallback; } };
const save = (name, data) => writeFile(new URL(name, CACHE), JSON.stringify(data, null, 1) + '\n');
const base = (c) => c.toUpperCase().replace(/^[A-Z0-9]+\//, '').replace(/\/[A-Z0-9]+$/, '');
const isVK6 = (c) => /^VK6[A-Z]{1,4}$/.test(c);
const day = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
const now = new Date().toISOString();
const perthToday = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const key = (a) => `${a.qso_date}|${a.activeCallsign}`;

await mkdir(CACHE, { recursive: true });
const parks = await get('location/parks/AU-WA');
if (!parks) { console.error('POTA API not reachable; cache and pota.json left as they were.'); process.exit(1); }
const name = Object.fromEntries(parks.map((p) => [p.reference, p.name]));

// Park histories: re-read only parks that are new or whose activation/attempt counts changed.
const cache = await load('activations.json', {});
// First-seen dates: parks cached before this was added are seeded with each activation's own date.
for (const c of Object.values(cache)) c.seen ||= Object.fromEntries(c.history.map((a) => [key(a), day(a.qso_date)]));
const changed = parks.filter((p) => p.activations > 0 && (FULL || !cache[p.reference] || cache[p.reference].activations !== p.activations || cache[p.reference].attempts !== p.attempts));
console.log(`${parks.length} WA parks; ${changed.length} with new activity to read${FULL ? ' (full refresh)' : ''}`);
const fresh = await pool(changed.map((p) => p.reference), (ref) => get(`park/activations/${ref}?count=all`));
const boards = await load('park-hunters.json', {});
const freshBoards = await pool(changed.map((p) => p.reference), (ref) => get(`park/leaderboard/${ref}`));
changed.forEach((p, k) => {
  if (fresh[k]) {
    const seen = cache[p.reference]?.seen || {};
    for (const a of fresh[k]) seen[key(a)] ||= perthToday;
    cache[p.reference] = { activations: p.activations, attempts: p.attempts, fetched: now, seen, history: fresh[k] };
  }
  if (freshBoards[k]) boards[p.reference] = (freshBoards[k].hunter_qsos || []).map((h) => h.callsign);
});
await save('parks.json', { fetched: now, parks });
await save('activations.json', cache);
await save('park-hunters.json', boards);
const activated = Object.keys(cache);
const acts = [];
for (const ref of activated) for (const a of cache[ref].history) acts.push({ date: day(a.qso_date), seen: cache[ref].seen[key(a)] || day(a.qso_date), call: base(a.activeCallsign), ref, qsos: a.totalQSOs, cw: a.qsosCW, data: a.qsosDATA, phone: a.qsosPHONE });
acts.sort((a, b) => b.date.localeCompare(a.date) || b.qsos - a.qsos);
const today = new Date(now); const ago = (n) => new Date(Date.parse(perthToday) - n * 864e5).toISOString().slice(0, 10);
const board = (rows) => {
  const m = new Map();
  for (const a of rows) if (isVK6(a.call)) { const e = m.get(a.call) || { call: a.call, activations: 0, parks: new Set(), qsos: 0 }; e.activations++; e.parks.add(a.ref); e.qsos += a.qsos; m.set(a.call, e); }
  return [...m.values()].map((e) => ({ ...e, parks: e.parks.size })).sort((a, b) => b.activations - a.activations || b.qsos - a.qsos);
};
const first = new Map(); for (const a of [...acts].reverse()) if (!first.has(a.ref)) first.set(a.ref, a.date);

// Hunters: POTA has no list of WA hunters, so check VK6 callsigns seen as activators or as top hunters
// of WA parks. Their totals are refreshed once a month (or for callsigns not seen before).
const hunterCalls = new Set(board(acts).map((e) => e.call));
Object.values(boards).forEach((list) => list.forEach((c) => { c = base(c); if (isVK6(c)) hunterCalls.add(c); }));
const calls = [...hunterCalls].sort();
const hcache = await load('hunters.json', {});
const stale = calls.filter((c) => FULL || !hcache[c] || (Date.now() - Date.parse(hcache[c].fetched)) > 28 * 864e5);
const stats = await pool(stale, (c) => get(`stats/user/${c}`));
stale.forEach((c, k) => { if (stats[k]) hcache[c] = { fetched: now, hunter: stats[k].hunter, activator: stats[k].activator }; });
await save('hunters.json', hcache);
const hunters = calls.map((c) => ({ call: c, parks: hcache[c]?.hunter?.parks || 0, qsos: hcache[c]?.hunter?.qsos || 0 })).filter((h) => h.parks).sort((a, b) => b.parks - a.parks || b.qsos - a.qsos);

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
  // Newly logged in the last 7 days (whenever the activation was), newest activation first; 'late'
  // marks logs that arrived more than 3 days after the activation.
  recent: acts.filter((a) => a.seen >= ago(7) || a.date >= ago(7)).map((a) => ({ ...a, park: name[a.ref], late: Date.parse(a.seen) - Date.parse(a.date) > 3 * 864e5 })),
  month: acts.filter((a) => a.date >= ago(30) && a.seen < ago(7) && a.date < ago(7)).slice(0, 12).map((a) => ({ ...a, park: name[a.ref] })),
  monthCount: acts.filter((a) => a.date >= ago(30)).length,
  activatorsYear: board(acts.filter((a) => a.date >= ago(365))).slice(0, 10),
  activatorsAll: board(acts).slice(0, 15),
  hunters: hunters.slice(0, 15),
  years, months: monthRows,
};
await writeFile(out, JSON.stringify(data, null, 1));
console.log(`pota.json: ${acts.length} activations, ${data.recent.length} newly logged this week, ${hunters.length} VK6 hunters; ${requests} requests to POTA`);
