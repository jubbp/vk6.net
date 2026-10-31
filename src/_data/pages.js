// Page text, keyed by file name: content/pages/<key>.md, or the Drive Doc's export if fetched.
import { listContent, readContent, renderMarkdown } from '../_lib/content.js';

export default function () {
const keys = new Set([...listContent('pages/'), ...listContent('_live/pages/')]
  .filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)));

const pages = {};
for (const key of keys) {
  const c = readContent(`pages/${key}.md`);
  // Docs exports start with the Doc's title as a heading; the page template supplies its own.
  const text = c.live ? c.text.replace(/^#\s+.*\n+/, '') : c.text;
  pages[key] = { html: renderMarkdown(text), fromDrive: c.live };
}
return pages;
}
