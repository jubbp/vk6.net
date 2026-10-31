// Club news posts: content/news/YYYY-MM-DD-slug.md, first line "# Title".
import { listContent, readContent, renderMarkdown } from '../_lib/content.js';

export default () => listContent('news/').filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f)).sort().reverse().map((f) => {
  const text = readContent(`news/${f}`).text;
  const title = (text.match(/^#\s+(.+)$/m) || [])[1] || f;
  const body = text.replace(/^#\s+.+\n+/, '');
  return { date: f.slice(0, 10), slug: f.slice(11, -3), title, html: renderMarkdown(body), excerpt: body.split('\n\n')[0].replace(/[*_#>[\]]/g, '').slice(0, 220) };
});
