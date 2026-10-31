# vk6.net

The website of WA Amateur Radio News (WAARN, callsign VK6ARN), the club that produces NewsWest. A static site built with [Eleventy](https://www.11ty.dev/) and published on GitHub Pages.

## Names

| Name | What it is | Use it for |
|---|---|---|
| **WA Amateur Radio News** | The club, and the owner of vk6.net | The site's identity: header, page titles, "about us" |
| **WAARN** | The club's short name | After the full name has appeared, in tight spaces, the URL `/waarn/` |
| **WA Amateur Radio News Inc** | The club's legal name (incorporated association) | Copyright, governance, formal documents |
| **VK6ARN** | The club's callsign | On-air identification, scripts ("This is VK6ARN") |
| **NewsWest** | The weekly news programme the club produces | Episodes, listening, broadcasts, podcast |

NewsWest is the programme, not the organisation; VK6ARN is a callsign, not a name for the club. Write "WA", not "W.A." or "Western Australian".

**Nothing commercial on air.** NewsWest is transmitted on amateur bands, which can't be used commercially. Businesses and sponsors are never mentioned on air, so the site must never promise an on-air mention to a business. Sponsors can be thanked on the website and at PerthTech. (Clubs and individual supporters can be thanked on air.)

Things waiting for a decision or a check are in [APPROVALS.md](APPROVALS.md). The audit of the old Google Site is in [audit/](audit/).

## How content gets onto the site

Most content is edited **outside this repo**, so club members can update the site without git:

| What | Edited in | Notes |
|---|---|---|
| Episodes and show notes | The publishing page (audio.vk6.net system) | Read from the bucket's `episodes.json`, or the podcast feed |
| Page text | Google Docs, one per page | IDs in `content/settings.json` → `sources.pageDocs`; blank = use `content/pages/<page>.md` |
| Broadcast schedule | The Broadcasts Google Sheet | Map coordinates in `content/locations.csv` |
| Broadcast times, deadlines, form links, menu | `content/settings.json` | The single place for these facts |
| Clubs list | `content/clubs.csv` (or a Sheet: `sources.clubsSheet`) | |
| Club news posts | `content/news/YYYY-MM-DD-slug.md` | First line `# Title` |

Every Doc and Sheet must be shared **"anyone with the link can view"**: the build reads public exports and needs no passwords. Nothing secret belongs in this repo, because it is public.

The site rebuilds **every hour**, on every push, and on demand (Actions → Build and publish → Run workflow). Each build runs `npm run fetch` (pulls everything above into `content/_live/`, which isn't committed) and then `npm run build`. If a fetch fails, the build uses the copies in `content/` and carries on.

### Writing in a Google Doc

- Use headings, bold, bulleted lists and links. Other formatting is ignored.
- The Doc's title (first heading) isn't shown; the site supplies the page title.
- Link to other pages on the site with their path, e.g. `/news/listen/`.
- HTML and scripts typed into a Doc are shown as plain text, never run.

## Working on the site

```sh
npm install
npm run fetch     # pull live content (optional; without it the repo copies are used)
npm start         # preview at http://localhost:8080, rebuilds as you edit
```

- Pages: `src/` (Nunjucks templates). Simple text pages are all listed in `src/text-pages.njk`.
- Layout and shared parts: `src/_includes/`.
- Data: `src/_data/` (turns content into what templates use).
- Styles and scripts: `src/assets/`. The theme's colours are the variables at the top of `site.css`.

## Addresses

The old Google Sites paths are kept (`/news/listen/`, `/news/broadcasts/`, `/waarn/`, …), so existing links keep working. `/home` redirects to `/`; the old calendar pages `/meeting/`, `/nets/` and `/contests/` redirect to the club's Google Calendars (`settings.json` → `legacyRedirects`). New pages: `/perthtech/`, `/news/coverage/`, `/news/relay/`, `/callbacks/`, `/subscribe/`, `/clubs/`, `/club-news/`, `/history/`, `/governance/`, `/support/`, `/privacy/`, `/corrections/`, and one page per episode at `/episodes/YYYY-MM-DD/`.

## Publishing (GitHub Pages)

`.github/workflows/build.yml` builds and deploys. In the repo settings, set Pages → Source to **GitHub Actions**. Until the custom domain is added, the site is served at `https://<org>.github.io/<repo>/`; the workflow handles the sub-path. While `preview` is `true` in `settings.json`, every page shows a preview bar and asks search engines not to index it.
