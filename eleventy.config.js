export default function (config) {
  // Content lives outside src/: rebuild the preview when it changes.
  config.addWatchTarget('content/');
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  config.addPassthroughCopy({
    'node_modules/leaflet/dist/leaflet.js': 'assets/vendor/leaflet/leaflet.js',
    'node_modules/leaflet/dist/leaflet.css': 'assets/vendor/leaflet/leaflet.css',
    'node_modules/leaflet/dist/images': 'assets/vendor/leaflet/images',
  });

  // Absolute URL for link previews and structured data.
  config.addFilter('absolute', (path, base) => new URL(path, base).href);
  config.addFilter('json', (value) => JSON.stringify(value).replace(/</g, '\\u003c'));
  config.addFilter('clock', (sec) => { sec = Math.floor(Number(sec) || 0); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = String(sec % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; });
  // Split rendered page text just before some text (e.g. a heading), so something can sit between the parts.
  config.addFilter('splitBefore', (html, text) => { const i = html.indexOf(text); return i < 0 ? [html, ''] : [html.slice(0, i), html.slice(i)]; });
  // mailto: link with a subject and starter text (line breaks as CRLF, which every mail program accepts).
  config.addFilter('mailto', (email, subject, body) => `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body).replace(/%0A/g, '%0D%0A')}`);
  config.addFilter('megabytes', (bytes) => (bytes ? `${(bytes / 1048576).toFixed(1)} MB` : ''));
  config.addFilter('byYear', (episodes) => {
    const years = [];
    for (const e of episodes) {
      if (years.at(-1)?.year !== e.year) years.push({ year: e.year, episodes: [] });
      years.at(-1).episodes.push(e);
    }
    return years;
  });
  config.addFilter('years', (episodes) => [...new Set(episodes.map((e) => e.year))]);
  config.addFilter('byGroup', (events, group) => events.filter((e) => e.group === group));
  config.addFilter('byMonth', (events) => {
    const months = [];
    for (const e of events) {
      if (months.at(-1)?.month !== e.month) months.push({ month: e.month, events: [] });
      months.at(-1).events.push(e);
    }
    return months;
  });
  config.addFilter('thousands', (n) => Number(n || 0).toLocaleString('en-AU'));
  config.addFilter('shortDate', (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', ''));
  config.addFilter('monthName', (ym) => new Date(ym + '-01T00:00:00Z').toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' }));
  config.addFilter('perthTime', (iso) => new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Perth', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }));
  config.addFilter('limit', (list, n) => list.slice(0, n));
  // Menu highlighting: a group is current when one of its pages is; Listen also covers episode pages.
  config.addFilter('isCurrent', (item, page) => item.children
    ? item.children.some((c) => c.url === page.url)
    : page.url === item.url || (item.url === '/news/listen/' && page.url.startsWith('/episodes/')));

  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' },
    // Set by the GitHub Pages workflow when the site is served from a sub-path (before the custom domain).
    pathPrefix: process.env.PATH_PREFIX || '/',
    templateFormats: ['njk', 'md', '11ty.js'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
}
