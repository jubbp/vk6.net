import ical from 'node-ical';
import { readContent } from '../_lib/content.js';
// The VK6 club, nets and contest calendars (Google Calendar ICS, fetched into content/_live/calendars/),
// expanded into dated occurrences for the next few weeks. Times are shown in Perth (UTC+8, no daylight saving).
const DAYS = 56;
const perth = (d) => new Date(d.getTime() + 8 * 3600e3);
const fmt = (d) => {
  const p = perth(d);
  return {
    iso: d.toISOString(),
    day: p.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', ''),
    date: p.toISOString().slice(0, 10),
    time: p.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).replace(':00', '').replace(/\s/g, ''),
  };
};
function occurrences(file, from, to) {
  const c = readContent(`calendars/${file}.ics`);
  if (!c) return [];
  const out = [];
  for (const e of Object.values(ical.sync.parseICS(c.text))) {
    if (e.type !== 'VEVENT' || e.status === 'CANCELLED') continue;
    const len = (e.end ? +e.end : +e.start) - +e.start;
    const allDay = e.datetype === 'date';
    const add = (start, ev = e) => { if (start >= from && start < to) out.push({ key: '', title: (ev.summary?.val ?? ev.summary ?? '').trim(), where: (ev.location?.val ?? ev.location ?? '').trim(), allDay, ...fmt(start), end: new Date(+start + len).toISOString() }); };
    if (e.rrule) {
      // rrule gives occurrences as the event's local wall time labelled UTC; the gap between the real
      // start and rrule's dtstart is the zone offset (Perth has no daylight saving, so it holds).
      const shift = +e.start - +e.rrule.options.dtstart;
      for (const d of e.rrule.between(new Date(+from - 2 * 864e5), to, true)) {
        const start = new Date(+d + shift);
        const key = start.toISOString().slice(0, 10);
        if (e.exdate && Object.keys(e.exdate).some((k) => k.startsWith(key))) continue;
        const moved = e.recurrences && Object.entries(e.recurrences).find(([k]) => k.startsWith(key));
        if (moved) { if (moved[1].status !== 'CANCELLED') add(moved[1].start, moved[1]); } else add(start);
      }
    } else add(e.start);
  }
  // Drop near-duplicates (the same net entered twice with slightly different names).
  const norm = (t) => t.toLowerCase().replace(/^net:\s*/, '').replace(/[^a-z0-9]/g, '');
  return out.sort((a, b) => a.iso.localeCompare(b.iso))
    .filter((e, i, all) => all.findIndex((o) => o.iso === e.iso && norm(o.title) === norm(e.title)) === i)
    .map(({ key, ...e }) => ({ ...e, title: e.title.replace(/^NET:\s*/i, ''), time: e.allDay ? '' : e.time }));
}
export default () => {
  const from = new Date(), to = new Date(+from + DAYS * 864e5);
  const contests = [...occurrences('contests', from, to), ...occurrences('contestsVk4sn', from, to)]
    .filter((e, i, all) => all.findIndex((o) => o.title === e.title && o.date === e.date) === i);
  const meetings = occurrences('meetings', from, to).map((e) => ({ ...e, kind: 'meeting' }));
  const events = [...meetings, ...contests.map((e) => ({ ...e, kind: 'contest' }))].sort((a, b) => a.iso.localeCompare(b.iso));
  // Group by Perth week (Monday start) for the What's on page.
  const weekOf = (date) => { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  const weeks = [];
  for (const e of events) { const w = weekOf(e.date); let g = weeks.find((x) => x.week === w); if (!g) weeks.push(g = { week: w, events: [] }); g.events.push(e); }
  const twoWeeks = new Date(+from + 14 * 864e5).toISOString();
  const nets = occurrences('nets', from, new Date(+from + 7 * 864e5));
  const netDays = [];
  for (const e of nets) { let g = netDays.find((x) => x.date === e.date); if (!g) netDays.push(g = { date: e.date, nets: [] }); g.nets.push(e); }
  return { built: from.toISOString(), twoWeeks, meetings, contests, events, weeks, nets, netDays };
};
