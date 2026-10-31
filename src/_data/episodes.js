// Episodes, newest first, from the bucket's episodes.json or the podcast feed (scripts/fetch-content.mjs).
import { readContent } from '../_lib/content.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export default function () {
const c = readContent('episodes.json');
// One episode per date: a stray duplicate file in the bucket must not break the build.
const seen = new Set();
const list = (c ? JSON.parse(c.text) : []).filter((e) => !seen.has(e.date) && seen.add(e.date));

return list.map((e) => {
  const [y, m, d] = e.date.split('-').map(Number);
  const items = e.items ?? [];
  return {
    ...e,
    items,
    year: y,
    longDate: `${d} ${MONTHS[m - 1]} ${y}`,
    slug: e.date,
    search: [e.title, e.producer, e.summary, ...items.flatMap((i) => [i.segment, i.topic, ...(i.notes ?? [])])]
      .filter(Boolean).join(' ').toLowerCase(),
  };
});
}
