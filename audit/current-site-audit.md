# vk6.net: audit of the current site

**Date:** 31 October 2026\
**Site:** https://www.vk6.net (new Google Sites). `http://vk6.net` redirects to it.\
**Method:** crawled every page linked from the site menu, then checked every outbound link and embed. Raw data: `current-site-inventory-2026-10-31.json` (page text, links, images, embeds).

## 1. Pages

13 pages (`/` and `/home` are the same page). All are linked from the top menu; no hidden pages were found.

| Current URL | Menu label | What's on it | Content source today | Suggested source on the new site |
|---|---|---|---|---|
| `/` = `/home` | Home | Welcome, "thank you" to broadcasters, link to the Callbacks form; **embeds this week's show-notes Google Doc** | Sites text + Google Doc (`1wYN…cy4`), updated weekly | Latest episode from `episodes.json` (player and notes) + short welcome text from a Doc |
| `/news` | The News | Broadcast times, callbacks, link to audio.vk6.net, Callbacks form | Sites text | Doc |
| `/news/listen` | Listen | Only a NewsWest logo linking to audio.vk6.net | Sites | **Player and archive search** (design §7b) |
| `/news/broadcasts` | Broadcasts | Schedule table, "Local Edition" text, broadcaster sign-up form | Embedded Google Sheet (`1cmt…k6U`) | **Sheet-driven table** (same Sheet) |
| `/news/contact` | Submit your News | How to submit, deadlines, audio format, checklist | Sites text | Doc |
| `/news/scripts` | Scripts | Five promo scripts for listeners to record | Sites text | Doc |
| `/waarn` | WAARN | Club history, team list, education activities | Sites text | Doc |
| `/contests` | Contests | Links, field-day frequencies PDF, contest calendar | Sites text + Google Calendar embed (Alan VK4SN's calendar, two imported calendars, one vk6.net calendar) + Drive PDF | Doc + calendar |
| `/becoming-an-amateur` | Becoming an Amateur | Training clubs, licence levels, myths | Sites text | Doc (or Sheet for the club list) |
| `/vi6cro` | VI6CRO | 2023 Carnarvon eclipse event report | Sites text | Doc, under a "Past events" heading |
| `/meeting` | VK6 Club Calendar | Club meetings calendar | Google Calendar embed (vk6.net calendar) | Calendar |
| `/nets` | Nets | Nets calendar | Google Calendar embed (vk6.net calendar) | Calendar |
| `/helpline` | Helpline | Roy VK6XV's Helpline intro, an estate sale | Sites text + Drive PDF (`Cedric Things.pdf`) | Doc (see privacy, §4) |

**Calendars:** the three calendar embeds can stay as Google Calendar embeds, or the build can read their public iCal feeds and show an agenda list in the site's own style, which works better on phones. Either way, people keep editing the calendars exactly as now.

## 2. Forms and Drive files linked from the site

| Item | Where | Notes |
|---|---|---|
| Form "Callbacks for NewsWest" (`…5nlQQ`) | Home | **Two different callback forms are in use:** check which one the team reads, and retire the other |
| Form "Callbacks" (`…qVg`) | The News | |
| Form "VK6 NewsWest broadcast list" | Broadcasts | Old-style form link; it still redirects to a working form |
| Doc: weekly show notes (`1wYN…cy4`) | Home (embedded) | Updated every week |
| Sheet: broadcast schedule (`1cmt…k6U`) | Broadcasts (embedded + link) | |
| PDF: RD and John Moyle Field Day Frequencies | Contests | |
| PDF: Cedric Things | Helpline | Estate sale list |

All of these opened without a sign-in, so they're shared publicly. The new site can keep linking to the forms, or embed them.

## 3. Broken or outdated links

| Link | Page | Status | Fix |
|---|---|---|---|
| `hornucopia.com/contestcal/weeklycont.php` (WA7BNM calendar) | Contests | 404 | The calendar moved to `contestcalendar.com` |
| `carnarvon.org.au/events/solar-eclipse-2023` | VI6CRO | 404 | Remove (event over) |
| `wavhfgroup.org.au` | Becoming an Amateur | No response | Check whether the WA VHF Group has a new site |
| `audacity.sourceforge.net` | Scripts | 403 | Use `audacityteam.org` (already used on Submit your News) |

All other outbound links (clubs, WIA licence pages, RASA, Ham College, audio.vk6.net) work.

## 4. Content to check before moving

**Inconsistent facts:**

- **Main broadcast time:** "The News" says 09:30 WST (01:30 UTC); "Broadcasts" says 09:00 WST (01:30 UTC). 01:30 UTC is 09:30 WST. The Sheet lists the linked repeaters at 09:00.
- **Helpline deadline:** 10 pm Thursday (Helpline page) vs Thursday morning (recent show notes).
- **Script deadline:** "Thursday evening" and "5pm Thurs" on the same page.

**Probably out of date:**

- WAARN team list (Darren VK6EK, Phil VK6DEV, Steve VK6SJ, Anthony VK6AXB, Bob VK6POP).
- Home: "We've formed a new production team…".
- Calendar pages: instructions for Internet Explorer cookie problems.
- Broadcasts Sheet: most rows last confirmed in 2017; typos ("CB Chanel 4", "Online at Online at vk6.net"), blank spacer rows. A Sheet-driven page shows these exactly as typed, so tidy the Sheet first.
- Helpline: the Cedric VK6CD (SK) estate sale. Is it still current?

**Privacy** (see `audio.vk6.net/docs/privacy-followups.md`):

- The Helpline page publishes personal email addresses (Roy's and a family contact's) and an estate sale list.
- The embedded weekly show-notes Doc includes third parties' personal emails (e.g. Helpline sellers, a luncheon contact). This is the same open question as segment notes: on a better-indexed site it becomes more findable.

## 5. Images

Six images in total: the site banner/header (on most pages), a second banner variant (calendar, nets, helpline, VI6CRO pages), a home-page promo image, a News page image, the NewsWest logo (Listen) and a Helpline image. Google blocks direct downloads of Sites images, so **download the originals from the Google Sites editor** (or from Drive, if they were uploaded from there) into `assets/` before the old site is retired.

## 6. Old addresses

Recommendation: **keep the same paths on the new site** (`/news/listen`, `/news/broadcasts`, `/meeting`, …). Then no redirects are needed and every existing link keeps working. Where a page is renamed or merged, the old path gets a small redirect page.

The crawl only finds pages linked from the site itself. Once vk6.net is verified in Google Search Console (open item 12 in the project overview), its **Pages** and **Links** reports will show any other addresses Google knows about and which sites link in, so nothing that people still use gets missed.

## 7. Summary for the redesign

- 13 pages, under 3,000 words of content: small enough to rebuild in one go.
- Content already partly lives in Drive (show-notes Doc, broadcasts Sheet, calendars), which fits the Drive-driven plan.
- Biggest improvement: the **Listen** page, today just a logo link, becomes the player and archive search.
- Before moving: decide on the two callback forms, fix the broadcast time, tidy the broadcasts Sheet, update the team list, and settle the privacy question for the Helpline and show notes.
