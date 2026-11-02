// Pulls live content into content/_live/ before a build:
//   episodes (bucket episodes.json, else the podcast feed), page text from Google Docs,
//   and the broadcasts and clubs Sheets.
// Everything is read from public "anyone with the link" exports, so no credentials are needed.
// A failed fetch only warns: the build falls back to the copies in content/.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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

// Demo source: the current audio host's Apache listings (root = current episode, archive/YYYY/MM/).
async function fromOldHost(base) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const links = async (url) => [...(await get(url)).matchAll(/href="([^"?\/][^"]*)"/g)].map((m) => m[1]);
  const files = (await links(base)).filter((f) => /^\d{8}\.newswest\.mp3$/i.test(f));
  for (const y of (await links(`${base}archive/`)).filter((x) => /^\d{4}\/$/.test(x))) {
    for (const m of (await links(`${base}archive/${y}`)).filter((x) => /^\d{2}\/$/.test(x))) {
      for (const f of await links(`${base}archive/${y}${m}`)) if (/^\d{8}\.newswest\.mp3$/i.test(f)) files.push(`archive/${y}${m}${f}`);
    }
  }
  return files.map((path) => {
    const [, yy, mm, dd] = path.match(/(\d{4})(\d{2})(\d{2})\.newswest\.mp3$/i);
    return { date: `${yy}-${mm}-${dd}`, title: `NewsWest, ${Number(dd)} ${MONTHS[Number(mm) - 1]} ${yy}`, audio: base + path, bytes: null, producer: '', items: [], summary: '', transcript: null };
  });
}

// This week's show notes Doc: segment headlines like "**1:08 RAOTC November bulletin, tomorrow (Clive VK6CSW)**".
// Only the headlines are used; the body text can hold people's contact details.
function notesFromDoc(md) {
  const date = (md.match(/NewsWest,\s+\w+\s+(\d{1,2})\s+(\w+)\s+(\d{4})/) || []);
  const producer = (md.match(/Produced by ([^.]+)\./) || [])[1] || '';
  const items = [...md.matchAll(/^\*\*(\d{1,2}):(\d{2})\s+(.+?)\*\*\s*$/gm)].map((m) => {
    const start = Number(m[1]) * 60 + Number(m[2]);
    const t = m[3].trim();
    const who = t.match(/^(.*?)\s*\(([^)]+)\)$/);
    return who ? { segment: who[2], topic: who[1], start, notes: [] } : { segment: '', topic: t, start, notes: [] };
  });
  return { day: date[1], month: date[2], year: date[3], producer, items };
}

await step('episodes', async () => {
  let episodes;
  if (src.oldHost) {
    episodes = await fromOldHost(src.oldHost);
    // Play from the HTTPS copy in the bucket where the file is there (same paths as the old host).
    let mirrored = 0;
    if (src.audioMirror) {
      const bucket = src.audioMirror.match(/storage\.googleapis\.com\/([^/]+)\//)[1];
      const names = new Set();
      let page = '';
      do {
        const r = JSON.parse(await get(`https://storage.googleapis.com/storage/v1/b/${bucket}/o?fields=items(name),nextPageToken${page && `&pageToken=${page}`}`));
        (r.items || []).forEach((o) => names.add(o.name));
        page = r.nextPageToken || '';
      } while (page);
      for (const e of episodes) {
        const path = e.audio.slice(src.oldHost.length);
        if (names.has(path)) { e.audio = src.audioMirror + path; mirrored++; }
      }
      // A date with a copy in the bucket drops any stray old-host-only duplicate (e.g. a misfiled file).
      const inBucket = new Set(episodes.filter((e) => e.audio.startsWith(src.audioMirror)).map((e) => e.date));
      episodes = episodes.filter((e) => e.audio.startsWith(src.audioMirror) || !inBucket.has(e.date));
    }
    // Chapter titles from the transcription trial's segment index (date, seconds, title, presenter):
    // the working copy next door if present, otherwise the copy kept in content/.
    const local = src.chaptersLocal && new URL(`../${src.chaptersLocal}`, root);
    const tsv = local && existsSync(local) ? local : src.chapters && new URL(src.chapters, root);
    if (tsv && existsSync(tsv)) {
      const byDate = {};
      for (const line of (await readFile(tsv, 'utf8')).split('\n')) {
        const [d, sec, title, who] = line.split('\t');
        if (!/^\d{8}$/.test(d || '') || !title) continue;
        (byDate[`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`] ??= []).push({ segment: (who || '').trim(), topic: title.trim(), start: Number(sec) || 0, notes: [] });
      }
      for (const e of episodes) if (byDate[e.date]) e.items = byDate[e.date].sort((a, b) => a.start - b.start);
    }
    try {
      const n = notesFromDoc(await get(`https://docs.google.com/document/d/${src.weeklyNotesDoc}/export?format=md`));
      const ep = episodes.find((e) => e.title === `NewsWest, ${n.day} ${n.month} ${n.year}`);
      if (ep && n.items.length) Object.assign(ep, { items: n.items, producer: n.producer });
    } catch { /* notes are optional */ }
    episodes.sort((a, b) => b.date.localeCompare(a.date));
    await writeFile(new URL('episodes.json', live), JSON.stringify(episodes, null, 1));
    return `${episodes.length} episodes from ${src.oldHost}${src.audioMirror ? `, ${mirrored} playing from ${src.audioMirror}` : ''}`;
  }
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
