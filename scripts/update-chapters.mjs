// Refresh content/chapters.tsv from the transcription trial's full segment index
// (~/NewsWest-Transcription/segment-index.csv: every episode it has processed, every
// segment titled, by rule or by hand). Run after segment_index.py, then commit the TSV.
//
// Usage: node scripts/update-chapters.mjs [path/to/segment-index.csv]
import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';

const src = process.argv[2] || `${homedir()}/NewsWest-Transcription/segment-index.csv`;
const out = new URL('../content/chapters.tsv', import.meta.url);

// The index is plain CSV: quoted fields may hold commas and doubled quotes.
const rows = [];
for (const line of (await readFile(src, 'utf8')).split(/\r?\n/)) {
  if (!line) continue;
  const f = [];
  for (const m of line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g)) f.push(m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2]);
  rows.push(f);
}
const tidy = (s) => (s || '').replace(/[\t\n]+/g, ' ').trim();
const lines = rows.slice(1)
  .filter(([date, start, , topic]) => /^\d{8}$/.test(date) && /^\d+:\d\d$/.test(start) && tidy(topic))
  .map(([date, start, , topic, who]) => {
    const [m, s] = start.split(':').map(Number);
    return [date, m * 60 + s, tidy(topic), tidy(who)].join('\t');
  });
await writeFile(out, lines.join('\n') + '\n');
const episodes = new Set(lines.map((l) => l.slice(0, 8))).size;
console.log(`content/chapters.tsv: ${lines.length} chapters in ${episodes} episodes, from ${src}`);
