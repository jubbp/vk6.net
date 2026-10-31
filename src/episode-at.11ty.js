// One small share page per timed segment: /episodes/<date>/at/<seconds>/.
// It carries a link preview naming the segment (Facebook, chat apps, email) and sends the
// visitor on to the episode page cued to that point (/episodes/<date>/?t=<seconds>).
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clock = (sec) => { sec = Math.floor(Number(sec) || 0); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = String(sec % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };

export default class {
  data() {
    return {
      pagination: {
        data: 'episodes',
        size: 1,
        alias: 'ch',
        before: (episodes) => episodes.flatMap((ep) => ep.items
          .filter((it) => it.start || it.start === 0)
          .map((it) => ({ ep, it }))),
      },
      permalink: ({ ch }) => `/episodes/${ch.ep.slug}/at/${Math.floor(ch.it.start)}/`,
      eleventyExcludeFromCollections: true,
    };
  }

  render({ ch, settings }) {
    const { ep, it } = ch;
    const base = settings.preview && settings.previewUrl ? settings.previewUrl : settings.url;
    const abs = (p) => new URL(p, base).href;
    const at = Math.floor(it.start);
    const target = `../../?t=${at}`;
    const title = `${it.topic}${it.segment ? ` (${it.segment})` : ''}`;
    const description = `Hear it on NewsWest, ${ep.longDate}, from ${clock(at)}. Weekly amateur radio news from WA Amateur Radio News, VK6ARN.`;
    return `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} – NewsWest, ${esc(ep.longDate)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${esc(abs(`/episodes/${ep.slug}/`))}">
  <meta property="og:site_name" content="${esc(settings.club)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)} – NewsWest, ${esc(ep.longDate)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(abs(`/episodes/${ep.slug}/at/${at}/`))}">
  <meta property="og:image" content="${esc(abs('/assets/img/og-image.png'))}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="WA Amateur Radio News logo: home of NewsWest, VK6ARN, since 1931">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="refresh" content="0; url=${target}">
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p><a href="${target}">${esc(title)}: NewsWest, ${esc(ep.longDate)}, from ${clock(at)}</a></p>
</body>
</html>
`;
  }
}
