// Broadcast schedule from the Broadcasts Sheet, with map coordinates from content/locations.csv.
import { readCsv } from '../_lib/content.js';

export default function () {
const coords = Object.fromEntries(readCsv('locations.csv').map((r) => [r.Location.toLowerCase(), [Number(r.Lat), Number(r.Lon)]]));
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Daily', 'On Demand'];

const rows = readCsv('broadcasts.csv')
  .filter((r) => r.Type && r.Type !== 'Inactive')
  .map((r) => {
    const location = (r.Location || '').replace(/\s+/g, ' ').trim();
    const callbacks = (r.Callbacks || '').replace(/(Online at )+/g, 'Online at ').trim();
    return {
      type: r.Type, day: r.Day, time: r.Time, freq: r.Frequency.replace(/Chanel/i, 'Channel'),
      call: (r['Call Sign'] || '').trim(), location, callbacks, sponsor: r.Sponsor, note: r.Note,
      confirmed: r.Confirmed, ll: coords[location.toLowerCase()] ?? null,
    };
  });

const groups = [];
for (const r of rows) {
  const label = `${r.day}${r.time ? ` ${r.time}` : ''}`;
  let g = groups.find((x) => x.label === label);
  if (!g) groups.push((g = { label, day: r.day, time: r.time, rows: [] }));
  g.rows.push(r);
}
groups.sort((a, b) => (DAYS.indexOf(a.day) - DAYS.indexOf(b.day)) || String(a.time).localeCompare(String(b.time)));

// Map pins: one per place, listing every service heard there.
const places = {};
for (const r of rows.filter((x) => x.ll)) {
  const p = (places[r.location] ??= { location: r.location, ll: r.ll, services: [] });
  p.services.push(`${r.day} ${r.time}: ${r.freq}${/^[\d.,]+$/.test(r.freq) ? ' MHz' : ''}${r.call ? ` ${r.call}` : ''}`);
}

return { rows, groups, places: Object.values(places), unmapped: [...new Set(rows.filter((r) => !r.ll && r.location !== 'online').map((r) => r.location))] };
}
