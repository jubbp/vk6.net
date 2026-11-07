import { readCsv } from '../_lib/content.js';
// Infrastructure status board (demonstration, sample data): repeaters, wireless links, digipeaters,
// beacons, gateways, receivers and sites, from content/infrastructure.csv; issues from
// content/infrastructure-issues.csv, linked to an item by Id (Item), plus any items it takes down
// (Affects: space-separated Ids, e.g. everything on a site that has lost power).
const ORDER = { down: 0, degraded: 1, maintenance: 2, unknown: 3, up: 4 };
const TYPES = ['Repeater', 'Link', 'Digipeater', 'Beacon', 'Gateway', 'Receiver', 'Site'];
export default () => {
  const items = readCsv('infrastructure.csv');
  const byId = Object.fromEntries(items.map((r) => [r.Id, r]));
  const issues = readCsv('infrastructure-issues.csv').map((i) => ({ ...i, item: byId[i.Item] }));
  const open = issues.filter((i) => i.State !== 'Resolved');
  const sort = (a, b) => ORDER[a.Status] - ORDER[b.Status] || a.Region.localeCompare(b.Region) || a.Name.localeCompare(b.Name);
  const affects = (i, id) => i.Item === id || (i.Affects || '').split(/\s+/).includes(id);
  const withIssues = items.map((r) => ({ ...r, issues: open.filter((i) => affects(i, r.Id)) }));
  const count = (s) => items.filter((r) => r.Status === s).length;
  return {
    groups: TYPES.map((t) => ({ type: t, items: withIssues.filter((r) => r.Type === t).sort(sort) })).filter((g) => g.items.length),
    open: open.sort((a, b) => ORDER[a.item?.Status] - ORDER[b.item?.Status] || b.Updated.localeCompare(a.Updated)),
    resolved: issues.filter((i) => i.State === 'Resolved').sort((a, b) => b.Updated.localeCompare(a.Updated)),
    counts: { up: count('up'), degraded: count('degraded'), down: count('down'), maintenance: count('maintenance'), unknown: count('unknown') },
    total: items.length,
    all: [...items].sort((a, b) => a.Type.localeCompare(b.Type) || a.Name.localeCompare(b.Name)),
  };
};
