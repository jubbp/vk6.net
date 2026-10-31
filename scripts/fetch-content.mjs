// Pulls live content into content/_live/ before a build:
//   episodes (bucket episodes.json, else the podcast feed), page text from Google Docs,
//   and the broadcasts and clubs Sheets.
// Everything is read from public "anyone with the link" exports, so no credentials are needed.
// A failed fetch only warns: the build falls back to the copies in content/.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

const root = new URL('../content/', import.meta.url);
const live = new URL('_live/', root);
const settings = JSON.parse(await readFile(new URL('settings.json', root), 'utf8'));
const src = settings.sources;
let failures = 0;

await mkdir(new URL('pages/', live), { recursive: true });

async function get(url) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function step(name, fn) {
  try {
    const note = await fn();
    console.log(`ok    ${name}${note ? `: ${note}` : ''}`);
  } catch (err) {
    failures++;
    console.warn(`WARN  ${name}: ${err.message} (keeping the fallback copy)`);
  }
}

// --- Episodes ---------------------------------------------------------------

function fromFeed(xml) {
  const doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(xml);
  const items = [].concat(doc?.rss?.channel?.item ?? []);
  return items.map((it) => {
    const audio = it.enclosure?.url ?? '';
    const m = audio.match(/(\d{4})(\d{2})(\d{2})\.newswest\.mp3/);
    const date = m ? `${m[1]}-${m[2]}-${m[3]}` : new Date(it.pubDate).toISOString().slice(0, 10);
    const text = String(it.description ?? '');
    const lines = text.split('\n').map((l) => l.trim());
    const notes = lines.filter((l) => l.startsWith('- ')).map((l) => {
      const body = l.slice(2);
      const i = body.indexOf(': ');
      return i > 0 ? { segment: body.slice(0, i), topic: body.slice(i + 2), notes: [] } : { segment: '', topic: body, notes: [] };
    });
    const producer = (text.match(/Produced by ([^\n]+?)\.?\s*$/m) || [])[1] || '';
    return {
      date,
      title: String(it.title ?? `NewsWest, ${date}`),
      audio,
      bytes: Number(it.enclosure?.length) || null,
      producer,
      items: notes,
      summary: notes.length ? '' : lines.filter(Boolean).join(' '),
      transcript: null,
    };
  });
}

await step('episodes', async () => {
  let episodes;
  try {
    episodes = JSON.parse(await get(src.episodesJson));
  } catch {
    episodes = fromFeed(await get(src.feed));
  }
  episodes.sort((a, b) => b.date.localeCompare(a.date));
  await writeFile(new URL('episodes.json', live), JSON.stringify(episodes, null, 1));
  return `${episodes.length} episodes`;
});

// --- Google Docs (page text) ------------------------------------------------

const docs = Object.entries(src.pageDocs).filter(([k, id]) => !k.startsWith('_') && id);
if (src.weeklyNotesDoc) docs.push(['this-week', src.weeklyNotesDoc]);
for (const [key, id] of docs) {
  await step(`doc ${key}`, async () => {
    const md = await get(`https://docs.google.com/document/d/${id}/export?format=md`);
    await writeFile(new URL(`pages/${key}.md`, live), md);
  });
}

// --- Google Sheets ----------------------------------------------------------

for (const [file, id] of [['broadcasts.csv', src.broadcastsSheet], ['clubs.csv', src.clubsSheet]]) {
  if (!id) continue;
  await step(`sheet ${file}`, async () => {
    const csv = await get(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);
    if (!csv.includes(',')) throw new Error('not CSV (is the Sheet shared publicly?)');
    await writeFile(new URL(file, live), csv);
  });
}

console.log(failures ? `Done with ${failures} warning(s).` : 'Done.');
