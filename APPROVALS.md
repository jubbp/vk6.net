# To check and approve

Everything on the new site that needs a person to confirm, decide or set up before launch. Tick items off as they're settled; add new ones at the end of their section.

**Who:** *Team* = NewsWest team · *Committee* = WAARN committee · *Phillip* = setup tasks.

## 1. Decisions

- [ ] **Theme.** Interim theme from the banner colours (night black, dial amber, signal yellow, frame blue), with the tuning-dial artwork. Keep, adjust or replace? All colours are variables at the top of `src/assets/css/site.css`. *Team/Committee*
- [ ] **Logo.** Phillip chose the **red logo** (`redlogo.png`, Bob's 2020 logo folder in Drive). Download it into `src/assets/img/` so the header, favicon and link previews can use it; the drawn dial icon is a stand-in until then. Theme colours may change to suit it. *Phillip*
- [ ] **Callback form.** Two forms are live today ("Callbacks for NewsWest" on Home, "Callbacks" on The News). The new site uses **"Callbacks for NewsWest"** everywhere. Confirm, and retire the other. *Team*
- [ ] **Weekly email.** Set up a Google Group (e.g. `newswest-weekly@vk6.net`) or other list, and decide who sends it (could be automatic from the publisher). Then put the sign-up link in `settings.json` → `forms.emailSignup`. *Team/Phillip*
- [ ] **Podcast directories.** List NewsWest in Apple Podcasts, Spotify and Pocket Casts? Each needs the production feed address first (after cutover). Links go in `settings.json` → `podcast`. *Team*
- [ ] **WAARN Supporters scheme** (`/support/`), drafted for the committee 31 Oct 2026. Decide:
  - [ ] whether to run it, and its name ("WAARN Supporters" for now)
  - [ ] the amounts: drafted as Supporter $25/year, Club supporter $100/year, Sponsor by arrangement (`settings.json` → `supporters.tiers`)
  - [ ] the benefits promised: listing on the site, a thank-you on NewsWest once a year (individuals and clubs only), priority booking for PerthTech; check the committee can deliver each
  - [ ] sponsor wording: business sponsors are thanked on the website and at PerthTech only, **never on air** (amateur bands can't be used commercially); the page explains this. Check the wording
  - [ ] how people pay: bank transfer details by email (as drafted, so no account details on the public site), or an online payment page (`supporters.joinUrl`)
  - [ ] who looks after supporters: receipts, renewals, the supporters list (`content/supporters.csv`, names listed only with permission)
  - [ ] whether contributions are tax-deductible (the page makes no claim either way) and any reporting obligations
  - [ ] the promise to report how the money was spent at each AGM
  - [ ] PerthTech wording: "bring back PerthTech" (assumes it isn't currently running); confirm *Committee*
- [ ] **"Ready to publish" step** for Drive edits: publish as soon as a Doc changes (current design), or only Docs in a `Live` folder? *Team*
- [ ] **Who can edit** the website content folder in Drive. *Committee*
- [ ] **Cut-over date** for vk6.net to point at the new site (with or after the audio.vk6.net cutover). *Phillip/Committee*

## 2. Content to check

- [ ] **Broadcast time.** Old site said both 09:00 and 09:30 WST. New site says **09:30 WST (01:30 UTC), after the 09:00 WIA National News**, evening repeat 19:00. Correct? *Team*
- [ ] **Featured frequencies** in the "Next broadcast" box: VK6RAP 146.700 / 439.800 / 53.800 MHz and VK6RHF 29.680 MHz. Right ones to feature? *Team*
- [ ] **Deadlines.** Now in one place (`settings.json` → `deadlines`): audio noon Friday; text 5 pm Thursday; Helpline Thursday morning (old site said 10 pm Thursday). Confirm each. *Team, Roy VK6XV*
- [ ] **Team list** on About WAARN: Darren VK6EK, Phil VK6DEV, Steve VK6SJ, Anthony VK6AXB, Bob VK6POP. Current? *Team*
- [ ] **Broadcasts Sheet.** Most rows last confirmed 2017. Please review every row; also typos ("CB Chanel 4", "Online at Online at", "Automaticly"), and the 1.848 MHz rows marked summer/winter only. The site shows the Sheet as typed (it fixes only the "Chanel" and "Online at" repeats). *Team*
- [ ] **Becoming an Amateur.** Fees ($25 syllabus, $75 licence) and wording are from the old site and are probably out of date since licensing changes. *Team*
- [ ] **Clubs list** (`content/clubs.csv`): built from the old training-clubs list. Add missing clubs, meeting times and which clubs offer training; check the Southern Electronics Group website (none listed) and the WA VHF Group site (not responding). Better as a Google Sheet so clubs can be updated without the repo. *Team*
- [ ] **Helpline page.** Removed the Cedric VK6CD (SK) estate-sale item and its PDF. Restore if still current? Confirm Roy is happy for his email to stay on the page. *Roy VK6XV*
- [ ] **Relay NewsWest page.** Says the current episode is at `http://audio.vk6.net/YYYYMMDD.newswest.mp3`, published before the Sunday broadcast, and mentions broadcaster notifications. Check wording and timing. *Team*
- [ ] **History page.** Links to Text Editions and Video Broadcasts folders on audio.vk6.net; check they exist after the migration. Add more history? *Team*
- [ ] **Governance page.** Placeholders: committee, constitution, annual reports, AGM notices, membership. *Committee*
- [ ] **PerthTech page** (`/perthtech/`), written from the 2022–2024 PerthTech files in Drive. Check: the weekend format and Gidgegannup Recreation Club as "most recent" venue; the 2023 and 2024 talk highlights and presenters' names (all were announced on NewsWest); "began in April 2016", "2020 cancelled", "2022 funded largely by a raffle"; whether perthtech@vk6.net still reaches someone; and "We'd love to run PerthTech again" (no date promised). Photos from the 2022 and 2024 photo folders could be added with the people's agreement. *Team, Bob VK6POP*
- [ ] **Club news.** First post, "A new vk6.net is on the way", is a draft. *Team*
- [ ] **Scripts page.** Unchanged except punctuation. Still the scripts you want? *Team*

## 3. Accuracy

- [ ] **Map coordinates** (`content/locations.csv`) are town or suburb centres, typed in for this preview, not transmitter sites. Check each, especially Mount William, Mount Saddleback and Dazzler Range; or replace with real site coordinates. *Team*
- [ ] **Map scope.** Shows every active row of the Broadcasts Sheet, including CB relays and interstate. *Team*

## 4. Privacy (see `audio.vk6.net/docs/privacy-followups.md`)

- [ ] **Privacy statement** (`content/pages/privacy.md`) is a draft. Committee to approve. *Committee*
- [ ] **Corrections and removals** process (`content/pages/corrections.md`): who handles requests, and the promised timing ("usually within a week"). *Committee*
- [ ] **Weekly show-notes Doc** is shown on The News page (as on the old home page). It includes third parties' personal emails (e.g. Helpline sellers, a luncheon contact). Show as is, remove contact details, or stop showing it? *Committee*
- [ ] **Map tiles from OpenStreetMap.** Visitors' browsers fetch tiles from OpenStreetMap, which sees their IP address. Named in the privacy draft. OK? *Committee*
- [ ] **Google Forms.** The callback form is embedded from Google. OK? *Committee*
- [ ] **Visitor statistics.** None yet. Add cookie-free statistics later? *Committee*

## 5. Setup tasks

- [ ] Create a **club GitHub organisation** (e.g. `vk6arn`) from a club account; require two-factor sign-in for members. *Phillip*
- [ ] Create the **public repo**, push this folder, and turn on **Pages** with "GitHub Actions" as the source. *Phillip*
- [ ] **Verify vk6.net** in the organisation's Pages settings (prevents domain takeover). *Phillip*
- [ ] **Protect the main branch.** *Phillip*
- [ ] Create a **"Website content" folder** in Drive, add a Doc per page (start from `content/pages/*.md`), share each "anyone with the link can view", and put the Doc IDs in `settings.json` → `sources.pageDocs`. *Phillip*
- [ ] Optional: have the publisher (Apps Script) send a `content-updated` event to GitHub after each publish, so the site updates within minutes instead of on the hourly run (needs a GitHub token with minimal scope in Script Properties). *Phillip*
- [ ] **At cutover:** set `preview` to `false` in `settings.json` (turns off the preview bar and lets search engines in); switch `sources.feed`, `sources.episodesJson` and `podcast.feed` to the production bucket; add the custom domain in Pages settings and the DNS records at Namecheap. *Phillip*
- [ ] **Download the six images** from the current Google Site (Sites editor) before it's retired, in case any are wanted. *Phillip*

## 6. Settled

*(Move items here once decided, with the date and decision.)*

- **31 Oct 2026, What's on removed** (Phillip): meetings, nets and contest calendars aren't WAARN's core business. The pages, menu item and home-page list are gone; the old `/meeting/`, `/nets/` and `/contests/` addresses redirect to the Google Calendars, which carry on as before.
