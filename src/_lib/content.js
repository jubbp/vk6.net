// Reads content: the live copy fetched from Drive/the bucket (content/_live/) if present,
// otherwise the copy kept in the repo (content/).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import MarkdownIt from 'markdown-it';
import { parse } from 'csv-parse/sync';

const CONTENT = new URL('../../content/', import.meta.url);
const LIVE = new URL('_live/', CONTENT);

export function readContent(path) {
  for (const base of [LIVE, CONTENT]) {
    const url = new URL(path, base);
    if (existsSync(url)) return { text: readFileSync(url, 'utf8'), live: base === LIVE };
  }
  return null;
}

export function listContent(dir) {
  const url = new URL(dir, CONTENT);
  return existsSync(url) ? readdirSync(url) : [];
}

export function readCsv(path) {
  const c = readContent(path);
  if (!c) return [];
  return parse(c.text, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true })
    .filter((row) => Object.values(row).some((v) => v));
}

// html: false so nothing typed into a Doc can inject markup or scripts (design §7b, security 3).
export const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

// Site-relative links ("/news/listen/") need the path prefix while the site is served from a sub-path.
const prefix = (process.env.PATH_PREFIX || '/').replace(/\/$/, '');
export function renderMarkdown(text) {
  const html = md.render(text);
  return prefix ? html.replace(/href="\/(?!\/)/g, `href="${prefix}/`) : html;
}

// Read on every build so the preview server picks up edits to content/settings.json.
export function loadSettings() {
  return JSON.parse(readFileSync(new URL('settings.json', CONTENT), 'utf8'));
}
