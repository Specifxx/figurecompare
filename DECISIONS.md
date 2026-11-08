# Decisions

Newest at the bottom. Why FigureCompare is the way it is.

## Launch shape — 2026-10-28

**Owner:** "an anime figure compare one … quite more decorated, how weebs and anime enjoyers would love … cute
and pretty and colourful … and dynamic", with everything learned on the other sites applied: data in GitHub,
the site on Vercel, low Vercel cost, monitoring.

* **Lines: Nendoroid, figma, POP UP PARADE.** The research thread's rule was "start with Nendoroid and figma;
  scale figures later". POP UP PARADE is added because it is the most-bought Good Smile line, it carries the
  same clean JAN barcodes, and it is a fixed-size non-scale line, so the matching risk is the same as Nendoroid's.
  Scale figures, prize figures and Gunpla stay out (Gunpla belongs on Gundam Compare).
* **Matching by JAN only.** Figures come in look-alike versions (re-releases, store exclusives, "Ver. 2.0",
  bootlegs), so a title is never enough. A listing without a valid Japanese EAN-13 (45/49 prefix, check digit)
  is skipped. Shopify's public `products.json` has no barcode field (research probe, 2026-10-28), so the JAN is
  read from the SKU or a labelled "JAN:" in the description, and for stores marked `productJson` from
  `/products/<handle>.json`, cached by product id + updated_at and capped at 400 lookups per store per run.
* **Two stores in one region, or no page.** Comparing one shop is not a comparison, and it keeps `data/` small
  (YGO Compare's lesson: data size is build time and cold starts).
* **Regions without conversion.** US, UK, CA, AU, NZ, EU and SG, each in its own currency; prices are never
  converted. A JP region ("Ships from Japan", in yen) is built in, because importing is how many collectors buy:
  a figure page shows it under the visitor's own region as "Or import from Japan". It stays hidden until a
  Japan-based store is readable (the probe found none: AmiAmi, HLJ, Nin-Nin, Plaza Japan and Otaku Republic are
  custom sites or block runners).
* **One page per figure, not one per region.** Figure names are the same everywhere and the queries are global;
  per-region copies would split rankings (family lesson "SEO split pages"). The page carries every region's
  table and CSS shows the visitor's, chosen by a `<head>` script from localStorage or the time zone: no cookie,
  no middleware, no flash, and Googlebot (US time zone) sees the US table first.

## A fully static site — 2026-10-28

The cheapest Vercel shape there is. The family's bills came from ISR writes, function invocations and
prefetch renders (Rift Compare and YGO Compare DECISIONS, "Vercel cost"). Here:

* Every page is prerendered at the one daily build (`dynamicParams = false`), so there are no ISR writes and no
  function invocations for visitors at all. The data only changes at a release anyway, so an ISR timer could
  never show newer prices. Build time grows with the catalogue; the ops monitor warns when `figures.json` passes
  12 MB.
* No `/go` redirect route: links are tagged at build and clicks are Vercel Analytics events.
* Search is a static `/search-index.json`, fetched on first focus of the search box.
* `prefetch={false}` on every link, image optimisation off (store photos are hotlinked at 600 px from Shopify's
  CDN), robots blocks the bulk scrapers and every `?` URL.
* The only function is eBay's Marketplace Account Deletion hook, which eBay requires for production keys.

## Affiliates — 2026-10-28

* **eBay**: pinned row per region (the cheapest believable new Buy It Now listing found by barcode, else a
  search), labelled Ad. Bootlegs are mostly sold from China and Hong Kong, so those sellers are skipped, and a
  listing must sit within 60%–300% of the stores' median. Campaign: 5339155912, the one campaign every Compare
  site uses (hard-coded; see "One EPN campaign for every site", 2026-10-30).
* **Amazon**: a search row per region where an Associates tag exists (US falls back to the family tag).
* **HobbyLink Japan** (3%): searched by JAN once `HLJ_AFFILIATE_REF` exists.
* **Store programs**: a store's `affiliate` param is added when its env var is set; it is then labelled
  "Paid link". Commission never changes order.

## Design — 2026-10-28

Pastel candy palette with a night-sky theme, Fredoka + M PLUS Rounded 1c (self-hosted through @fontsource, no
Google Fonts request), sticker cards, a ribbon header, sparkles, kaomoji and an original mascot, Kira. No
character art, official logos or screenshots anywhere: the owner's no-trademark rule, and copyright. Motion
stops under `prefers-reduced-motion`. No pop-ups (family pop-up policy).

## What the first real imports taught — 2026-10-28

* **One shop under two names counts once.** Good Games and The Games Capital (AU) served the same 269
  listings at the same prices: 196 of the first 685 figures were "compared at two stores" that were one
  stock. The Games Capital is out of the store list, and `dropMirrors` (`src/lib/merge.ts`) drops any store
  whose barcode-and-price pairs are 80%+ another store's in the same region, so the next franchise twin is
  caught without anyone noticing it first. After it: 494 honest figures.
* **One name shape.** Stores write "2014 Chainsaw Man Nendoroid Kobeni", "(Stellar Blade) EVE | Nendoroid
  #2932", "Nendoroid - 1281 Waddle Dee - Kirby". `tidyName` makes every figure "<Line> <rest>" with the
  catalogue number taken out (it has its own chip, and it ends the slug). Slugs were reset once, before
  launch; from now on they are kept forever.
* **Barcodes are cached for good.** Keying the lookup cache on Shopify's `updated_at` re-asked for every
  barcode on the second run (stores bump it on each stock sync). A found barcode is kept; a product with
  none is asked again after 30 days. The 2,400-a-day budget now goes to products never looked up: Solaris
  Japan, Otaku Mart and Super Anime Store fill in over the first few days.
* **The ops monitor** warns when a store's figure collections come back empty, not when a store simply
  carries none of our lines (about 25 of the 72 do today; they are read daily and cost a second or two).
  The stores page lists only stores with a figure on the site.

## Sidebar menu and eBay on every page — 2026-10-28 (owner)

* **Navigation copies DexCompare and MTG Compare.** Desktop (xl and up) gets a sticky left sidebar with
  every line (with its count), deals, pre-orders, new arrivals, stores and the about pages; below xl the
  ☰ button opens a sheet listing the same, plus the region picker. No separate "choose your region" step:
  the region still comes from the time zone and can be changed from the header or the menu. The groups
  are one list (`src/lib/nav.ts`), so the two menus never disagree. Still static: the active link is
  marked in the browser.
* **eBay is the commission for now** (the store programs are not approved yet), so every page but terms,
  privacy and disclosure ends with an eBay strip (`src/components/EbayStrip.tsx`): real listings from
  `ebay.json` when we have three or more for the page's figures, otherwise eBay searches for the page's
  line or figure. Plus a small eBay box at the foot of the sidebar and the phone menu. Each is labelled
  "Ad", rel sponsored, tagged `figure-<region>-<placement>-…` so the reports show which placements earn,
  and drawn at build per region like the prices (no function, no request). Placed below the content,
  never beside a store's buy button, never a pop-up or a banner across the top. NZ searches go to
  ebay.com.au, which ships there. `tests/site.test.ts` fails on a page without one.

## A grown-up look — 2026-10-28 (owner)

* **The candy design was too cute.** The owner wants FigureCompare to read as a professional tool for teens and
  adults of any gender, not a kids' site. Now: neutral greys, one red accent, green only for savings, Inter, flat
  cards with thin borders, product photos on white. The mascot, sparkles, kaomoji, emoji icons, the savings
  marquee and the rainbow and polka-dot backgrounds are gone. The light anime touch left is the star in the logo
  and a フィギュア kicker on the home page. The colour tokens keep their old names (`--pink` is the red), so no
  component had to learn new ones. This replaces "Design — 2026-10-28" above.
* **The link preview shows the product.** `scripts/og/render.mjs` draws `src/app/opengraph-image.jpg` from
  today's data: the figure with the most in-stock stores in one region, five store prices, the lowest marked, the
  saving under them. Run it by hand and look before committing; Reddit and X keep a post's first thumbnail.
* **"Pre Owned" with a space is pre-owned.** Solaris Japan names its used variant "Pre Owned"; the variant and
  title filters only knew "pre-owned"/"preowned". Today the new variant was the cheaper one everywhere we
  checked, but a used copy could have been shown as the price.

## eBay first, everywhere — 2026-10-28 (owner)

eBay is the only commission until the store programs (and HobbyLink Japan) approve us, so it is never hidden:
an eBay button beside every figure's own buy button (hero and phone buy bar, `hero_ebay`/`buybar_ebay`; the
listing with its price when the eBay pass found one, else a search), the eBay row first in every price table
("Shown first", with how it compares to the cheapest store), an eBay strip at the top of every list page as well
as the bottom, and the eBay box first in the sidebar and phone menu. Stores stay sorted by price and the real
cheapest keeps its badge; the family's pinned-marketplace rule, as on the card sites.

## 136 stores, and a shop is read only in its own currency — 2026-10-28 (owner)

The owner found Eren Yeager priced only in AU and UK: the US had three big figure shops. A two-pass probe
(`scripts/probe-stores.ts`, `.github/workflows/probe-stores.yml`, results in `probe/results.json` on the branch)
read ~380 candidate shops the way the import would and 64 joined (30 US, 10 CA, 8 UK, 6 EU, 6 AU, 2 NZ, 2 SG),
among them animate USA, Japan Figure Store, Nekotwo, Good Smile US, Hobby Bee and ToyCoin.

* **products.json is priced in the shop's own currency**, whatever `?country=` asks for: Shopify Markets only
  localises the checkout. The first probe would have filed Singapore's ToyCoin as a US store with SGD prices
  shown as dollars. The import now refuses a Shopify store whose `/meta.json` currency is not its region's,
  before the cart.js check; each shop is listed once, in its own currency's region.
* New shops get `collections: ["all"]` as the fallback, used only when `/collections.json` names no figure
  collection.
* Barcodes for the new shops come from `fill-barcodes.yml` (16 runners), not the daily import's 2,400-lookup
  budget, which the biggest catalogues would take for weeks. The import's timeout is 240 minutes for 136 stores.
* Left out: marketplaces and shops behind bot protection, a Japan-priced shop (Ninoma, JPY), shops with none of
  our lines or no readable barcodes, and The Games Capital (it redirects to Good Games, already listed).

## The link preview shows the gap, not one figure — 2026-10-29

With 41 shops selling to the US, the useful fact is how far apart they are on the same box. The preview
(`scripts/og/render.mjs`) now lists five well-known figures (one per franchise, best known first) in stock at five or
more US shops, each with its lowest and highest item price, under "Same figure, same box, different price". Still
drawn by hand from today's data and checked by eye before committing.

## The eBay keyset is shared with WargameCompare, 2,500 calls each — 2026-10-29

The owner's production keyset on his second eBay account (5,000 Browse calls a day) serves FigureCompare and
WargameCompare, 2,500 a day each, so `EBAY_DAILY_CAP` defaults to 2,500 (was 2,000). The deletion endpoint now
answers a notice with 200 (eBay accepts 200 to 204; 200 is the one every guide shows) and its challenge reply is
never cached. One app has one registered endpoint; both sites keep theirs deployed.

## One EPN campaign for FigureCompare and WargameCompare — 2026-10-29

The owner chose EPN campaign 5339155911 for both sites; it is now the default in `src/lib/affiliate.ts` (was the
family's shared 5339155912). The customid (`figure-…` / `wgc-…`) tells the sites apart in EPN's report.

## One eBay campaign for every Compare site, hard-coded — 2026-10-30

**Decided (owner).** Every Compare site now sends eBay clicks to ONE EPN campaign, 5339155912 (RiftCompare's,
already set up), hard-coded in the code: no variable overrides it any more, so a forgotten secret or Vercel
value can't split the sites again. The sites are told apart by the `customid` prefix alone, which comes first
in every tag; this site's is `figure-<region>`. Supersedes "One EPN campaign for FigureCompare and WargameCompare" (2026-10-29).
Replaced: 5339155911 (WargameCompare, FigureCompare, Compare Empire, K Young), 5339231473 (Lorcana),
5339231474 (Gundam), 5339234013 (YGO). Old secrets/variables (`EBAY_AFFILIATE_CAMPAIGN`,
`NEXT_PUBLIC_EBAY_CAMPAIGN_ID`, `EBAY_CAMPAIGN_ID`) are no longer read and can be deleted.

## 2026-10-30: quick view on every figure tile (from K Young)

Owner: "I really like the kaeyoung quick view pop ups, can we do that for … all the other sites". A plain click on a
figure tile now opens K Young's quick view at once, with what the tile already shows (photo, line, name). Every
store's price then loads from `/q/<slug>`, a static JSON written at build by a `force-static` route (one file per
figure, like the pages), so opening one reads a file from the CDN, never a function; it is fetched ahead when a mouse
rests on a tile. Its rows come from `priceRows()`, the same rows the figure page draws: eBay first, Amazon second,
then the stores by price, plus the Japan import table when a figure has one. The tile is still a real link, so
crawlers, new tabs and modified clicks reach the figure page, whose server HTML keeps every price.

## A contact page and the address in the footer — 2026-10-30

The owner: "make sure that contact information is really clear on all of our websites so that any feedback feeds
into the respective emails". The address (compareempire@gmail.com, `SITE.email`) was only on `/about` and
`/privacy`. Now `/contact` (static, in the sitemap) gives it with subject-filled mailto links for wrong prices, stores,
missing figures and press, and the footer links `/contact` and shows the address on every page. Still no form: the
site has no server to send one. `/contact` joins the legal pages that carry no eBay strip.

## 2026-10-31: wrong-price reports and store suggestions go to a private GitHub repo

**Owner:** "for all of these websites … we must have the ability to report any prices that are wrong, for users to
suggest a store … it's just stored within the GitHub … a daily job that checks for that."

* Every Compare Empire site now has the same two forms: **Report a wrong price** (a quiet link under the price table
  that opens in place, never a pop-up) and **Suggest a store**. Both POST to `/api/report`
  (`src/lib/reports-github.ts`, `src/components/ReportForms.tsx`: the same two files in every site repo).
* They are filed in ONE **private** repository, `Specifxx/compare-reports`: one new JSON file per report at
  `inbox/<site>/<day>/…json`, created through GitHub's contents API with `REPORTS_GITHUB_TOKEN` (a fine-grained token
  with Contents read/write on that repo only, Vercel only). Private because the site repos are public and a note is a
  stranger's free text; the K Young reviews branch is public because reviews are meant to be read.
* Nothing about the visitor is stored: no email field, no IP, no hash of one (the per-visitor limit, 6 an hour, lives
  in the function's memory), and email addresses, IP addresses and phone-like numbers in a note are blanked before
  the write. A honeypot field swallows bots.
* Each write creates a new file (no read, no sha), so reports never race, and the commit subject never carries
  `[deploy]`/`[preview]`. The route is POST only: no page view or crawler runs it, so it costs nothing at rest.
* A daily job in that repo (`triage.yml`) keeps one issue per site listing what is still open, flags repeat
  reports of the same product and store, and warns before the token expires. A handled report is moved to
  `done/<site>/`. Until the token is set the route answers 503 and the form says to email the site's address.

## Visitor reports live on each site's own `reports` branch, not a private repo — 2026-10-31

**Owner:** "we don't need a private repo for this … just build it into each site … inside the public GitHub, it's
fine. As long as it's not reflected on the front end." This replaces the private `Specifxx/compare-reports` repo
of the entry before it; everything else in that entry (the forms, no email/IP, redaction, new file per report,
POST only, 503 until the token is set) still holds.

* Each site writes its reports to **its own repo**, on an orphan branch named `reports` (`SITE_REPOS` in
  `src/lib/reports-github.ts`): `inbox/<site>/<day>/…json`, moved to `done/<site>/…` once handled. The branch is
  never merged into `main` and never deploys: `git.deploymentEnabled.reports = false` in `main`'s `vercel.json`
  (pinned by `tests/reports-github.test.ts`) and the branch's own `vercel.json` turns deploys off as well.
* Nothing on any site reads the branch, so no report ever shows on a page. The branch is public with the source,
  which is why nothing about the visitor is stored and notes are redacted before the write.
* One token, `REPORTS_GITHUB_TOKEN` (fine-grained, Contents read/write on the twelve site repos only), set in each
  Vercel project for Production.
* The daily triage moved to RiftCompare (`Specifxx/TCGEmpire`): `.github/workflows/reports-triage.yml` reads all
  twelve `reports` branches through the API and keeps one issue per site there, plus a once-a-day "Reports digest"
  comment. Those issues are public, so they link to each report's file and never quote a note. It fails (and
  GitHub emails the owner) when a site has no `reports` branch, or the token stops working or expires within 14
  days (checked only when the token is also a TCGEmpire Actions secret). The ops monitor's job list watches it.

## 2026-10-31 — Every figure link opens the quick view

Owner, 2026-10-31: "Whenever I click on any item … I want a quick view open like K Young." Tiles already carried
`data-qv`; `QuickView.tsx` now also opens for any other plain click on a link to `/figure/<slug>` (the search box's
results), reading the slug from the href, and `/q/<slug>` also returns `name`, `line` and `img` for those. Links inside
the quick view and on the figure's own page, and modified, middle and new-tab clicks, navigate as before.

## eBay: local sellers, delivered prices (2026-10-31)

A WargameCompare visitor's feedback (the owner passed it on for every sister site): eBay rows from overseas sellers
carried postage that made "a lot of wasted clicks". The pass keeps sellers in the region's own
country (`localSeller`: the region's own country, any EU country for the EU) and sends the buyer's country and a central postcode as `contextualLocation`, so eBay quotes real postage.
`ebayPick` keeps only a listing whose postage eBay states and stores the DELIVERED price (`p` = item + postage, `sh` the
postage); the price table says "incl. postage". Sellers in Japan, the products' home country and often the cheapest genuine source, stay
for every region (owner, the same day), priced with their postage like any other row; so the search asks only for
`deliveryCountry` and `localSeller` does the rest. Rows stored before this have no `sh`
and are hidden (`getEbay`), and the next eBay pass searches them first.

## Christmas theme: 1 November to Boxing Day (2026-11-01)

Owner, 2026-11-01: every Compare site gets a Christmas theme after the Halloween one, each its own take. Snow over the hero, a tree and gifts in the right corner, a candy-cane stripe under the header, lilac turned pine green, a Santa hat on the logo and a quiet メリークリスマス on the kicker. Prerendered pages carry the markup; the boot script decides whether it shows.

The season window is fixed in `src/lib/season.ts`: 1 November to 26 December, every year, by the visitor's own
date, stamped on `<html data-season>` by an inline boot script before first paint. `?season=christmas` previews it out
of season and `?season=off` hides it in season. Every decoration is CSS-gated on that attribute, `aria-hidden`,
`pointer-events: none`, painted under the content (never over a price or a button), animated with `transform`
only, and stopped under `prefers-reduced-motion`. The page's content and links stay in the server HTML; the season
adds no request, no script beyond the boot line and no database or data read. The shared rules sit between
`xmas-common:start` and `xmas-common:end` in `globals.css` (identical on every sister site); this site's colours sit in
the `xmas-site` block after it. Art is eight small SVGs in `public/xmas/`. To end it early, move the `to` date; after
Boxing Day it switches itself off.

## 2026-11-01: A beta community forum, no accounts, posts in this repo

The owner asked for "user forums ... you don't need to be able to sign in ...
put your name down ... it'll save your name ... all of this is public data ...
keep it within each website's repository", on every site, to give the sites a
reason to come back that search rankings alone don't. `/forum` (docs/forum.md):

- **Storage:** `forum.json` on this repo's public orphan branch `forum`
  (never deployed: its own vercel.json, plus `deploymentEnabled.forum: false`
  here). Written only by `POST /api/forum` with the visitor-reports token;
  a write reads the file's sha and retries when two posts race.
- **Cost:** pages read the file from raw.githubusercontent.com inside their
  normal cache life, never per visit; the browser fetches the newest copy from
  GitHub directly, so a new post shows in minutes with no deploy, no function
  and no database. Rebuilding pages for posts would have meant a build per post.
- **Spam:** honeypot, a 2.5 s minimum on the form, per-visitor limits (4 per
  10 min, 20 a day, 4 threads a day) and a per-instance cap, all in memory; no
  IP, email or hash is stored, and emails/IPs/phone numbers in posts are
  blanked. Links to other sites and slurs or strong profanity are HELD (filed
  under `held/` and flagged in the daily reports triage), never published.
- **Not dead when empty:** the site's topics with a line and a few prompts;
  never an invented post.
- **SEO:** threads are in the server HTML; a thread is noindex until it has a
  reply, the forum page until any thread has one; indexed threads carry
  DiscussionForumPosting JSON-LD.
- **Moderation:** the owner asks Claude; a post is removed by an edit to
  `forum.json` (`removeFromForum` in `src/lib/forum/core.ts`).

## 2026-11-01 — Series hubs (/series/<slug>)

Bill asked for SEO hubs for niches on every site. Figure searches name the franchise ("jujutsu kaisen nendoroid",
"hololive figma"), and the site only had line hubs, so `/series` lists 22 franchises with 12 or more figures and each
gets a prerendered page (src/content/series.ts, src/lib/series.ts; every region's prices in the HTML like every page,
at most 96 tiles). A figure joins a series by its NAME: fine for grouping, never for matching a listing, which stays the
JAN's job. Patterns are a series name or a character name nobody else carries ("Asuna" but not Blue Archive's Asuna
Ichinose); `tests/series.test.ts` holds real titles. Figure pages link their series; the hubs are in the sitemap and
the side menu.

## 2026-11-01: eBay and Amazon rows look like the other price rows

The owner: "the ebay and amazon links should blend in and look exactly the same as the other price rows … reflect that
change on the other sites that require it." Paid marketplace rows (eBay, Amazon, and TCGplayer where it is pinned) keep
their place and their "Ad"/paid-link label, but lose their brand tints and brand-coloured buttons: they use the same row
and the same button as a store. They are still never counted as a store and never re-ranked by commission. This
reverses the 2026-10-30 "bright, catchy colour" pinned rows; eBay ad strips and panels outside the price rows keep
their own look.

## 2026-11-01 — The US comes first in the eBay rotation

Owner, 2026-11-01: "the eBay API for all websites should also prioritise the US." `planEbay` rotates every
(figure, region) pair by its last check, never-checked first, so every region came round equally. Now a US pair's last
check counts as a day older (`US_HEAD_START_DAYS`) and the US wins a tie, so US figures are searched first and about a
day sooner on every lap, while the other regions still turn over (a US pair checked two days after a UK one waits).
The cap is unchanged (`EBAY_DAILY_CAP`, 2,500).

## 2026-11-02 — Black Friday page

`/black-friday` shows today's deals per region (`dealsIn`, the same tiles as `/deals`) under a Black Friday heading, at
one URL kept every year so links and rankings carry over. It has to be indexed weeks before the day (27 November 2026),
so it ships now; the footer and sitemap link it all year. Prerendered at the daily build like every page. Never a "was"
price of our own, a countdown, "ends soon" or an invented sale. Dates are pure (`src/lib/black-friday.ts`, tested). Part
of the passive-growth plan (owner, 2026-11-02: no daily Reddit posts).

## 2026-11-02 — Free link badges

`/widgets` gives blogs, clubs and stores plain-HTML link badges (a figure, a line, "our prices are compared here") that
the daily outreach offers instead of asking for a link (passive-growth plan, owner 2026-11-02). The card sites have a
live price iframe; this site doesn't, because a live badge needs a function or a script, and the site is fully static.
Each badge is one `<a>` with inline CSS (`src/lib/link-badges.ts`, tested), so the link sits on the other site's page.

## 2026-11-02 — Self-updating price report

`/price-report` is one page, kept at one URL, prerendered at each daily build from that day's prices: per region, how
many stores and figures are on sale, the typical gap between the cheapest and dearest store for the same JAN and how
often it is 10% or more, and the median price of a figure per line. It is the citable asset the daily outreach offers
figure writers (passive-growth plan, owner 2026-11-02), with a quote line. Pure numbers in `src/lib/price-report.ts`
(tested; the same file as KaeYoung's).
## 2026-11-02 — The monitor reports to Empire HQ; only red mails

The owner asked for one Monday email instead of a mail per site (the control tower, approved 2026-11-02). The ops
monitor now writes every result to `ops-status.json`, and its workflow force-pushes it as `status.json`, one orphan
commit, to this repo's public `ops-status` branch (never deployed, `vercel.json`). RiftCompare's ops monitor reads it
every three hours for Empire HQ (riftcompare.com/admin/hq) and the one Monday report, and mails the owner itself if
the file goes quiet for a day (a stopped monitor cannot mail). Only a FAILED check fails the run, which is GitHub's
email to the owner; warnings wait for HQ and Monday. The file carries status and the monitor's own sentences only,
the same as the public Actions log.

## 2026-11-02 — Seasonal sale pages

`/boxing-day`, `/january-sales`, `/lunar-new-year` and `/valentines-day` (owner-approved growth plan, 2026-11-02):
one URL each, kept every year like `/black-friday`, built weeks ahead so they are indexed before the day, with
the Black Friday page's rows (`dealsIn` per region, every region in the HTML, CSS showing the visitor's) from one
component, `src/components/SaleSeasonPage.tsx`, prerendered at the daily build. The intro names every region we
cover, never one country. Dates, the year a page is about (it rolls over a week after the event) and the intro are
pure in `src/lib/sale-seasons.ts` (`tests/sale-seasons.test.ts`); Lunar New Year is a published-date table to 2040
(6 February 2027). Footer and sitemap. Never a "was" price, a countdown or an invented sale.

## 2026-11-02 — Price alerts through RiftCompare's shared service

The owner chose "Yes, one shared service" for email price alerts on the sister sites. The site stays fully static,
with no database, accounts or mail key; the figure page gains an "Email me when the price drops" form.

- **The form** (`components/PriceAlertForm.tsx`, the same file on every sister site; `FigureAlert.tsx` reads the
  visitor's region with `useRegion`, since the page is one file for every region) posts
  `{site, productId (the JAN), region, email, targetCents}` straight to `https://riftcompare.com/api/sister-alerts`.
  RiftCompare keeps the address, sends one confirmation email (double opt-in) and checks daily. This site stores
  nothing and holds no key; it adds no function (the form is client-side, the feed `force-static`).
- **The prices** come from this site's own static `/alert-feed.json` (`lib/alert-feed.ts`), prerendered with each
  release from `figures.json`: `bestIn()` per region, the page's headline (cheapest orderable store price, never eBay
  or Amazon, never converted), Japan left out; plus the deals page's top three per region, with no reference price.
  WargameCompare's alert emails may end with one of them.
- The privacy page says what the form sends and links to RiftCompare's.

## 2026-11-02 — Share buttons

The owner wants word of mouth to be a big growth driver on every site (RiftCompare's DECISIONS has the twelve-site
entry). The figure page and the quick view get a Share button: the phone's share sheet, else the link and message
copied. No pop-up, no reward, and no function: the message (the real gap between the cheapest and dearest orderable
store in each region, `lib/share-texts.ts`) is written at build into the page and the quick view's static JSON, and
the button picks the visitor's region from the root's `data-region`. No per-figure share image: drawing thousands at
build is not worth the build time while the site-wide card exists. Every shared link carries
`utm_source=share&utm_medium=figure`; the button sends a Vercel `share` event, `ShareArrival` one `share_visit` per
tab when a shared link brings someone, and RiftCompare's weekly growth report counts both.


## Sites that grow each other: the family feed, cluster blocks and short footers (2026-11-02)

Owner, 2026-11-02: "We need each site to help each other grow as a team effort", and the
footer family lists were "a bit convoluted … I'm wondering if it actually helps". Plan:
"Sites that grow each other" in the consolidation doc (https://claude.ai/artifact/QjrWGrfBqH4sKctwdjwptK).

- **Three clusters** (`src/lib/family-network.ts`, the same file in every repo): card games
  (Rift, OP, Dex, MTG, Gundam, Lorcana, YGO, Cyberpunk), hobby (Wargame, Figure, Gunpla on
  Gundam Compare) and tech (Compare Empire, CamCompare). KaeYoung stays out.
- **The family feed.** Each site's own daily data job writes `family-feed.json` (its best real
  deals and pre-orders today, per region) beside the data it already commits, and copies its
  cluster sisters' feeds from raw.githubusercontent.com into `family-cluster.json`. Pages read
  the committed file: no database of another site, no request-time fetch, no new function. A
  feed older than four days, from the wrong site, with a link off its own host or a saving that
  isn't the arithmetic of its two prices is dropped (`validFeed`), so a block shows less, never a guess.
- **One block per page**, on the deals, Black Friday and pre-order pages: one tile per sister with
  its best item in the visitor's region, else the US price in its own currency. Labels never name
  a country. Plain followed links inside a cluster.
- **Footers: one short line.** The sites of our own cluster by name, then one "A Compare Empire
  site" link to https://compareempire.com/network, which lists every site. Why: nothing counts
  footer clicks, footer links get few, and Google gives little weight to sitewide links between
  one owner's look-alike sites (12 sites all cross-linked in every footer is the pattern it can
  read as a link scheme). Cross-traffic should come from the price blocks, which people have a
  reason to click.
- Here: `src/lib/family.ts` (deals from `dealsIn` against the dearest store, pre-orders' cheapest store, per region; "Ships from Japan" stays out of the network and shows the US tiles), `scripts/family-sync.ts` in `import.yml` before the data commit, files in `data/family/` read at build, the hobby block (Gunpla on Gundam Compare, WargameCompare) on `/deals`, `/black-friday` and `/preorders`, every region in the HTML as `.rp-XX`, an amber-only "Family feed" ops check, and a footer list of the two hobby sisters plus the network page. `SISTER_SITES` is gone.

## 2026-11-02 — Amazon Associates: following the Operating Agreement's Dos and Don'ts

The owner sent Amazon's own "Operating Agreement: Top Dos and Don'ts" page (2026-11-02: "make sure you
are following these instructions for all amazon affiliates"), and every site was audited against it.
The rules we keep, on every Compare Empire site:

- **Disclosure beside every Amazon link** ("Ad" / "Paid link"), and Amazon's statement "As an Amazon
  Associate I (we) earn from qualifying purchases." in the footer of every page.
- **Amazon's trademark notice** in the footer of every page: "Amazon and the Amazon logo are trademarks
  of Amazon.com, Inc. or its affiliates." No Amazon logo, screenshot, review or Amazon's own colours
  (its orange): the page "Don't use style or color of Amazon site which may cause confusion".
- **Links lead to a specific product** (an ASIN, or a search for that exact product's name), never a
  category or generic search: "All the links or buttons on your site should take customers to specific
  products on Amazon."
- **No Amazon link in a pop-up or layer**: the quick views show none; product pages carry the row.
- **Never Amazon prices in price tracking or alerts** ("Don't track prices or set price alerts"), and no
  Amazon link or trademark in any email, SMS or printed material.
- Every link tagged, rel="sponsored nofollow"; no incentive (cashback, discount) for buying through it.
- Here: the footer gained the statement and trademark line; the quick view rows (/q) have no Amazon row.

## 2026-11-02 — The region chooser in the home hero, with drawn flags

Owner: "the region switcher must be more prevalent on all sites, on the main home page hero etc … and have
the flags as well". The home hero has a "Prices for" row of every active region as a flag chip, above the
search (`RegionChips` in `RegionPicker.tsx`, the same `setRegion` as the header), replacing the small select
in the stats line. The header menu shows the region's flag and code with the native select laid invisibly
over them; the in-page region tabs, the phone menu and /stores carry flags too.

- **Flags are inline SVG (`src/components/Flag.tsx`), never emoji and never image files.** Windows draws a
  flag emoji as two letters; image files would break the no-new-hosting rule. Japan's flag is in the set
  for "From Japan". The page stays fully static: the chips are a client component over prerendered HTML.
  The same file is in every Compare Empire repo that has a region switcher; keep the copies identical.

## 2026-11-02 — At most one production build every 12 hours, and no branch but production deploys

**Why.** The owner capped Vercel spend at $5–6 a day across every site. 1 November cost $11.82 (normally
$2–4), and Build CPU was the largest line ($4.26), followed by CDN requests and ISR writes, which every
build multiplies (a deploy empties the page cache, so the next crawl re-renders and re-writes every page).
The `[deploy]` gate itself held; its premise did not: sessions landed 7–14 `[deploy]` commits a day per site
(manual "release now" runs and `[deploy]` in merge subjects), RiftCompare, OP, MTG and DexCompare alike.
Compare Empire's site built on every push to its production branch (84 commits that day) and CamCompare on
every three-hourly price commit, because neither had the gate.

**What.**
- `scripts/vercel-ignore-build.sh` skips a production `[deploy]` commit when the last production
  deployment (`VERCEL_GIT_PREVIOUS_SHA`, set by Vercel in that step) is under 12 hours old; the commit
  rides the next release. `[urgent]` in the SUBJECT overrides it, and only when the owner says a release
  cannot wait. An unset or unreadable last deployment builds (fail open). `tests/deploy-gap.test.ts` pins it,
  and the file is the same in every Compare Empire repo.
- `vercel.json` `git.deploymentEnabled` starts with `"**": false` and enables only the production branch
  (Vercel: when a branch matches several rules, any `true` wins). No preview is built for any branch or pull
  request, `[preview]` included; the older per-branch `false` entries stay for orphan commits' own copies.
- So "push to prod" means land on the production branch; the release reaches visitors within a day.

## 2026-11-03 — Footers link only card sites to card sites; every other site lists no sisters

The owner asked whether linking every Compare Empire site together helps or is a risk for search and for how the
sites look. Verdict: a sitewide footer link between sites one person owns carries little ranking value (Google
discounts it), and a mesh of unrelated sites (camera, appliance and figure sites in a card site's footer) can read
as a link network and looks odd to a reader. The owner said do it.

- `footerSisters()` in `lib/family-network.ts` (same file in every repo) now returns the other card sites for a card
  site and nothing for any other site. Gundam's Gunpla side no longer pulls WargameCompare and FigureCompare into its
  footer; the engine footer's heading is "Other card games".
- WargameCompare, FigureCompare, CamCompare and Compare Empire show no sister list in their footers, only one
  "A Compare Empire site" link to compareempire.com/network (Compare Empire: its own /network), the one page that
  lists every site. KaeYoung still links none.
- Anchors stay the brand name only, and links stay plain followed links: they are honest links between sites with
  one owner, not paid, so no `sponsored`/`nofollow`.
- Kept: the "Other card games" / hobby / tech price blocks on deals, Black Friday and pre-order pages
  (`clusterSisters`). They sit on a few pages, show real prices a reader of that page may want, and are not sitewide.

## 2026-11-03 — The quick view shows the product's own link

**Why.** Owner: "quickview popup should have a link change as well for all sites, instead of using the same link". The
pop-up kept the list page's URL, so a copied or bookmarked link lost the product, and Back left the page instead of
closing the pop-up.

**What.** Opening a quick view pushes the product page's own existing URL (/figure/<slug>) with `history.pushState`
(`src/lib/quick-view-url.ts`, the same file on every site). Back closes it and restores the list's URL, Forward reopens it,
closing it (×, Escape, the backdrop) steps back, so the history never fills with pop-ups. "See price history and details"
only hides the pop-up and navigates to the URL already shown, which Next turns into a replace: Back from the product page
goes to the list. The entry copies Next's own history state (`__NA` and the router tree), so the app router passes the
push through and the page under the pop-up never re-renders.

**SEO.** No new URL exists: the link is the canonical product page, which a reload, a share or a crawler gets in full
server HTML. Never a `?view=` or `#` variant (duplicate URLs, extra CDN copies). Pinned by `tests/quick-view-url.test.ts`.

## 2026-11-03 SEO audit: homepage schema, breadcrumbs, llms.txt, 55-char title

Bill's network SEO audit found no JSON-LD on the homepage, 12 empty `alt`s and a 61-character title. The homepage now
carries Organization + WebSite + a printed FAQ with FAQPage and links every line hub; figure, line hub and series pages
show a breadcrumb trail with a matching BreadcrumbList (`src/lib/seo.tsx`). The eBay strip and family cluster photos are
named. Product/AggregateOffer already existed on figure pages. `/llms.txt` is a static route. The sitemap (about 4,000
URLs) stays one file. hreflang is deliberately absent: every page is ONE URL for all regions. `tests/seo.test.ts`.

## Rate us and "What people say", run by RiftCompare (2026-11-03)

The owner wanted RiftCompare's rating pop-up on every site, each site's reviews public, and every written review approved in
RiftCompare's admin; star ratings count at once. This site stores nothing and gains no function: the corner card
(`components/site-reviews/RateCard.tsx`, in the root layout) posts cross-origin to `https://riftcompare.com/api/site-reviews`,
and the homepage's "What people say" reads the score and approved reviews from `https://riftcompare.com/api/site-reviews/figure`
in the browser (public JSON, CDN six hours), so every page stays a static file. The card copies RiftCompare's corner card, not
its rating drive: never on arrival, after 4 pages and 3 minutes or on return from a store tab, at most three times 14 days
apart, always closable (no pop-up policy breach: it is a small corner card, not an interstitial); "Rate us" in the footer opens
it. While no ad script is on the page it says "We don't run banner ads, so if this helped, please leave us a review." No email
asked for, never review markup. RiftCompare's DECISIONS.md, "Every site's reviews, approved in one queue".

## 2026-11-03: A Creators page and a homepage bubble, like RiftCompare's

Owner: "having the creators page for all of these sites as well is really, really good. Like just a bubble and then a
really nice formatted creators page, just like how RiftCompare does it." Word of mouth from creators and visitors is the
sites' main growth channel, so every site gets one.

`/creators` is RiftCompare's page in FigureCompare's theme, without the parts that need a database: the list is the
static array in `src/lib/creators.ts` (empty until the first creator agrees; the grid shows "Your channel here" spots,
never an invented creator), applying is a pre-filled email to `SITE.email`, and there are no creator codes. "Buy them a
coffee" is the creator's own Ko-fi, Patreon or tip page: the site never handles the money. No emoji or character art
(the design rules): the marks are the logo's star and a coffee cup, drawn inline. `CreatorsCornerBadge` is the bubble in
the homepage hero (top-right from sm, a pill above the kicker on a phone); the sidebar's "More", the footer and the
sitemap link the page. Prerendered like every page, with the usual eBay strip at the foot. Not called "partners"
anywhere: that word means the affiliate links.

## 2026-11-04: 14 stores from the big-store gap research (probe round 2)

Owner: "ensure all big stores are captured with no gaps … I don't have domain knowledge outside of Australia". A
research pass per region (Good Smile's partner-shop list, the r/AnimeFigures trusted-store list, Kotobukiya's and
Bandai Spirits' stockist lists, the country guides) named 86 figure shops not on the list. The probe
(`probe/results.json`) read them the way the import does; 14 read ten or more of our lines by JAN in their region's
currency and were added: Australia Animeworks, MegaCulture, One Stop Anime; Canada Navito World (3,900 JAN-matched
listings), Doki Doki Land; Europe Finanime (WooCommerce), Manganim, AniMuchuu, Amuzzi; Singapore Candytoyo, Toy Or
Game, Ani Mecha, Chronicles INC; US Books Kinokuniya USA. Left out: Shopify shops whose feed carries no JAN
(Nakama Toys, Otaku Pop US, Anime House NZ, Aniverse NZ, Unifig, Tistaminis, The Mad Shop, Global Gear, Good Smile
Europe's feed, Animefigures UK and the other Woo shops with 0 matched).

**The biggest names cannot be read**, and stay off until an adapter exists: BigBadToyStore, Entertainment Earth,
Tokyo Otaku Mode, Crunchyroll Store (US/AU), Kinokuniya aside; UK Forbidden Planet (forbiddenplanet.com), Zavvi, HMV,
Gamersheek; Figuya, Yorokonde, Archonia, Anime Island (EU); Anime Kaika, Mighty Ape, Popcultcha, Sugo Toys, Gamesmen
(AU); Mighty Ape NZ: custom platforms, no Shopify or WooCommerce feed, several behind bot walls. PrestaShop shops
(Mangatori, Myth Factory, Nekonokoe) have no feed either.

## 2026-11-04 — List your store: stores come to us

The owner stopped cold email outreach ("not really doing anything") and set the aim: be popular enough that stores
ask us, and encourage the ones that do. Every Compare Empire site now has `/list-your-store` (shared
`ListYourStore.tsx` + the `ListStore` form in `ReportForms.tsx`), linked from the footer, `/contact` and the stores
page: what a store gets (free, no contract, never pays to rank), what we need (a readable shop, own currency,
established), and what happens next (checked within a few days, reply through the store's own contact details).
The request is filed as a `suggest-store` report with `issue: "owner"`; RiftCompare's daily reports triage puts
those first and asks for a reply within two days. No email is asked for (the reports branch is public); no pop-up,
no cold email. RiftCompare and OP Compare keep their `/stores/suggest` page (now the owner pitch) and redirect
`/list-your-store` to it.

## 2026-11-05: Amazon's own price on the Amazon row, from the Creators API, by barcode

The owner's US Associates account was approved today and he asked for Amazon's API prices as price rows on every
site ("especially Compare Empire"; until now only CamCompare and Compare Empire had the machinery, and both wait
on Amazon granting access). Ported from KaeYoung the same day. Here it is the simplest shape the barcode allows: `scripts/fetch-amazon-prices.ts`
runs first in every Vercel build and asks the Creators API `getItems` for each product BY JAN (ten a call, one
call a second, `AMAZON_BUILD_CALLS` calls a region, 30 by default: the 300 products with the most stores), in
every region we have a tag for (US, UK, CA, AU, EU). No title matching and no ASIN finder: the barcode is the
match, as it is for the stores. The result goes to the git-ignored `data/amazon-live/<REGION>.json`; nothing is
committed (Amazon's licence lets a price be kept 24 hours and shown with its time). The product page's Amazon
row (`PriceTable.tsx`, through `lib/amazon-live.ts`) then shows Amazon's new, in-stock, buy-box price with "as of
<time> <region clock>" and the licence's disclaimer, links to the item's own `/dp/` page instead of a search, and
the browser hides the price after 24 hours (`AmazonPrice.tsx`) since the static page may be served that long.
A price under 60% or over 160% of the region's store median is dropped (a re-release, a bootleg, a fantasy
seller). Never a sort, the cheapest badge, deals, history, the alert feed, metadata or the quick view
(`tests/amazon-api.test.ts` pins the reader to the price table and the client to the build).

One credential serves every store: `AMAZON_CREATORS_AU_CLIENT_ID` / `_CLIENT_SECRET` / `_VERSION` as Vercel
Production variables (the same values as Compare Empire's and KaeYoung's; `AMAZON_CREATORS_<REGION>_*` would override for
one store). Access is per marketplace and opens by itself once that store's account has qualifying sales
(about 10 in 30 days); a refused store is skipped and the row keeps its search link, so the feature costs
nothing until then and switches on without a code change. The ops monitor cannot see a Vercel build, so a
failed fetch is silent by design: the fallback is the row as it was.

## 2026-11-06: Good Smile US is read whole, not through its collections

A visitor asked why Good Smile (US and Global), AmiAmi and BigBadToyStore were not compared. Good Smile US was
listed since 2026-10-28, but the collection finder (`pickCollections`) read 75 of its products: its
`/collections.json` has 250+ franchise collections, the ones named "good-smile-…" are small, and the whole
catalogue (1,614 published products, 570 of our lines, 538 with the JAN as the SKU) sat in collections it never
picked. A store can now say `allProducts: true` (`src/content/stores.ts`) and the reader pages `/products.json`
instead: the maker's own shop is the one place every line is, and the title filter keeps the rest out. Checked
by hand on 2026-11-06: 156 orderable Nendoroid / figma / POP UP PARADE products, all with a JAN.

The others stay out, and why: Good Smile's global shop (goodsmile.com, priced in yen; under maintenance on the
day, and the JP region is hidden because prices are never converted), AmiAmi (yen, a script-drawn shop with a
private API, never worked around), Good Smile Europe (its storefront feed publishes one product and SKUs are
internal codes), BigBadToyStore and Entertainment Earth (custom platforms; BigBadToyStore's product pages carry
a price in JSON-LD but no barcode, and the rule is the barcode or nothing: see the next entry if that changes).

## 2026-11-06: BigBadToyStore, matched by catalogue number: the one exception to "the barcode or nothing"

The same visitor asked about BigBadToyStore, the largest US figure shop, and the owner wants US listings ten times
Australia's. BigBadToyStore runs its own platform: no product feed, grids drawn by script, its search pages disallowed
by robots.txt, and no barcode on a product page. What it does have is schema.org JSON-LD on every product page (name,
price in USD, stock, photo) and the Nendoroid or figma catalogue number in every slug and title. So this ONE store is
matched by number, not barcode (`src/lib/import/bbts.ts`, `platform: "bbts"`), under rules that keep the barcode rule's
promise:

- Nendoroid and figma only; POP UP PARADE has no number and is never matched.
- The number must belong to exactly one JAN in the day's catalogue (built from the barcode stores' listings after
  they are read, `indexByNumber`). 409 of the catalogue's 3,690 numbered figures share their number with another JAN
  (re-releases, DX versions, a store's mislabelling): those are dropped, not guessed.
- The store's title must share a name word with the catalogue's name, so a mistyped number never attaches the wrong
  character; the title still goes through `readTitle`, so dolls, Nendoroid More, parts, pre-owned and bundles are
  refused as everywhere else. Several packaging grades of one product ("Mint", "Mint Pro") are one offer, the cheapest
  orderable.
- Read last, from the product sitemaps robots.txt names, one page a second, at most `BBTS_PAGES` (2,500) a run: about
  2,000 pages on the 2026-11-06 sample (69% of its numbered Nendoroid and figma slugs are in the catalogue).
- Every public line that said "only by barcode" (the figure page's note and FAQ, the stores page, List your store,
  CLAUDE.md) now names the exception. Never extend number matching to another store without the owner.

Checked and left out the same day: AmiAmi (yen, a script-drawn shop with a private API, never worked around), Good
Smile's global shop (yen; the JP region is hidden because prices are never converted), Good Smile Europe (its
storefront feed publishes one product and SKUs are internal codes), Entertainment Earth, Crunchyroll Store and Tokyo
Otaku Mode (custom platforms, no feed, no number in a slug to match on).

## 2026-11-06: Japan stores, shown in every region converted from yen

The owner, on the same visitor's question: "even if it's priced in yen, you can convert it ... as long as you can
ship to that country, it's fine ... we want to cover." Until now no price was ever converted and the JP region sat
empty. Now:

- Japan stores are region JP, priced in yen (their offers stay in yen in `figures.json`). Every other region's
  figure page and quick view shows them under "Or import from Japan", each price as "≈ US$40.80" with "¥6,182 ·
  ships from Japan" beside it, converted at the day's European Central Bank reference rate. The import writes the
  rates to `data/public/fx.json` (Frankfurter, no key); a failed fetch keeps yesterday's, and rates older than seven
  days are not used (the rows fall back to yen). The ops monitor shows the rates' age (amber only).
- A converted price is never the region's "Cheapest" headline, a deal, an alert price, an eBay or Amazon reference,
  metadata or JSON-LD: it excludes international shipping and import tax, and the rate moves. Where a region has no
  store at all, the headline box says "From Japan: ≈ US$40.80 at HobbyLink Japan (¥6,182, plus international
  shipping)" with a link, never "cheapest in the US".
- One local store plus one Japan store now qualifies a figure page (`mergeListings`); a Japan store alone does not.
- First Japan store: HobbyLink Japan (`platform: "hlj"`, `src/lib/import/hlj.ts`). No feed or sitemap, but every
  product page has JSON-LD with the barcode (gtin13), the yen price and the stock, so it is matched by JAN like the
  Shopify stores. The list comes from its search pages for the three lines (robots.txt allows them); only titles
  `readTitle` accepts and HLJ marks in stock, pre-order or back-order are opened, one a second, `HLJ_PAGES` (2,500) a
  run. Its affiliate reference (`HLJ_AFFILIATE_REF`, whole `key=value` pairs) is added to its rows; its pinned
  "search by barcode" row stays only on figures HLJ has no offer for.
- Still out: AmiAmi (a script-drawn shop behind an anti-bot layer; its private API is not ours to call), Good Smile's
  global shop (offline since 23 October 2026 after a security breach; recheck when it reopens). Yen-priced Shopify
  shops in Japan were sent through the store probe the same day (`probe/candidates.txt`, round 3).

## 2026-11-06 — Awin: a store that accepts us pays from the next build, with no step by hand

**Decision (owner: "check if we are making the most of Awin, and if it's not there, just do it"):** the family's Awin
account (Compare Empire, publisher 3144410) is read each morning by Compare Empire's `scripts/awin-sync.ts`, which
publishes the programmes that accepted us, with their tracked domains, in its public `data/awin/programmes.json`. This
site copies that file first in every build (`scripts/fetch-awin.ts` → `src/lib/awin-programmes.json`; the committed copy is
an empty list, so a failed fetch only leaves links untracked). `storeUrl` turns a link to a joined advertiser's own domain
into its Awin deep link to the same page (`clickref=<site>-<store>`), and `storePays` marks the row "Paid link". A store's
own affiliate variable, when set, still wins. Order and prices never change; eBay and Amazon are never wrapped.

## 2026-11-06 — Store thumbs up and down, one tally shared by every site

**Decision (owner: "a little mini area where you can rate a shop … thumbs up a store or thumbs down a store … across all
the sites you can now see that these stores are trusted"):** every store row carries two tiny thumbs beside the store's
name (`src/components/StoreVote.tsx`, the same file on every Compare Empire site), with counts once a store has votes and
a green "Trusted" mark from 3 thumbs up and 80% of the votes. RiftCompare keeps the votes and serves one public tally
(`riftcompare.com/api/store-votes`, CDN six hours), keyed by the store's host without "www.", so a shop listed on several
sites shares its thumbs; this site stores nothing and fetches the tally in the browser only (no function, no build
step). One vote per browser per store, a few per network, marketplaces (eBay, Amazon, TCGplayer…) get none. Votes never
order prices, hide a store or decide the cheapest. RiftCompare's DECISIONS.md, 2026-11-06, has the rules; change the
component there first and copy it.

## 2026-11-06 — Buy links open the store's checkout

**Decision (owner: "for all the sites that we can, send them directly to the checkout page, with the item in the
basket"):** an orderable listing at a Shopify store that pays us nothing opens that store's checkout with the figure in
the cart, through Shopify's cart permalink (`/cart/<variant id>:1`), as RiftCompare (#340), OP Compare (#99) and
KaeYoung (#58) do. The import names the variant on an orderable Shopify listing's URL (`?variant=<id>`, still the
product page), and `storeUrl` turns it into the cart link at build with `utm_content=checkout`. A store with its own
affiliate code or on Awin keeps its product page (its tracking runs there); eBay, Amazon, BBTS, HLJ and WooCommerce
stores are unchanged. `buy_click` stays retailer + placement (two properties). `lib/checkout-link.ts`,
`tests/checkout-link.test.ts`.

## 2026-11-06 — A cart list on every site

**Decision (owner: "I really like the cart feature … all of our websites"; built on RiftCompare first, TCGEmpire
#346):** every store price row gets an "Add to cart" button, and the header a cart with its count on every width.
`/cart` (static, noindexed, out of the sitemap) groups the lines by store with ONE "Check out at <store>" button per
store: Shopify's cart permalink `/cart/<variant>:<qty>,…`, which fills that store's cart and opens its checkout. The
list lives in the visitor's browser only (`localStorage` `ce_cart_v1`): no account, no database, no function. The page
re-checks each line's price and stock from the store's own `/products/<handle>.js` in the browser (Shopify serves it
with CORS open) and leaves a sold-out line out. A line is cartable only when the row's own buy link already is a cart
permalink (the single-click checkout links), so Awin and partner stores, and rows whose variant we don't know, stay
"manual" lines on their own tracked links; eBay, Amazon, TCGplayer and Cardmarket are never lines. Shared files, the
same in every site (port fixes by hand): `src/lib/cart-list.ts`, `src/components/cart/*` (`cart-config.ts` is the
one per-site file; styles imported once from the root layout), `tests/cart-list.test.ts`.

## 2026-11-06: Amazon prices find ASINs by JAN first (ported from ScentCompare #20)

The 2026-11-05 build fetch asked getItems with `itemIdType: "EAN"`. The Creators API documents ASIN as the only
itemIdType, so it could never have priced anything, even once Amazon opened access. Now `scripts/amazon-asins.ts`
runs in the daily import: per region, products with the most stores first, one searchItems by the JAN and,
failing that, one by the figure's name, kept only when the result's own `externalIds` list our JAN (a wrong match is worse
than none). Up to 300 calls a region a day (`AMAZON_SEARCH_BUDGET`), misses retried after 30 days,
`data/amazon/asins-<REGION>.json` committed (ASINs may be stored, prices may not). The build prices those ASINs, ten
a call, still within 60–160% of the store median. Credentials are per country (the AU credential answers US and UK
calls with 400 InvalidAssociate, found on Compare Empire), and InvalidAssociate / AssociateNotEligible now stop a
region at once. Until each Amazon account has 10 qualifying sales in 30 days the rows keep their tagged searches.


## 2026-11-06 — eBay and Amazon rows are full price rows, on top, outlined

**Decision (owner: "eBay prices and Amazon prices should function exactly like a normal store price row. So you can also
add to cart … if it's in stock … it just sits on the very top. And it has a different colored outline"):** the eBay row
is always the first row, with a green outline, and Amazon the second, with an amber one. Both carry everything a store
row has: the stock line, the store thumbs (one tally per eBay / Amazon domain, `ebay.com.au`, `amazon.com`…) and the
cart button. They are "manual" cart lines on their own tagged links (`src/lib/cart-list.ts`), never a Shopify checkout;
an Amazon line's price is dropped from the visitor's list after 24 hours (Amazon's licence), and the cart then says to
see today's price on Amazon. With no Amazon price the row reads "Also check on Amazon", a tagged link. Unchanged: neither
is counted as a store, "Best price", a deal, an alert price or the reference price; TCGplayer and Cardmarket stay
references (no thumbs, no cart line); no Amazon link in a pop-up.
FigureCompare: the Japan table's eBay and Amazon rows get no cart line (yen is shown converted), as its store rows.

## 2026-11-06: Tiles name the figure once, one eBay block per page

Underperformer review (owner: "fix everything"). Tiles showed the line twice ("POP UP PARADE" chip, then "POP UP PARADE
Frieren …"): the tile's name now drops the leading line label (`withoutLine`, the full name stays in the alt text and for
screen readers). Pages that carried an eBay strip at the top AND the bottom (series, deals, pre-orders, new, line hubs)
and the home page's second strip now keep one, the bottom strip with figures, so a shopper sees store prices first.
The Christmas look stays: the owner approved it on 1 November (season.ts window).

## 2026-11-06: The quick view carries the tagged Amazon link (owner)

Since 2026-11-02 the quick view showed no Amazon link (or, on KaeYoung and ScentCompare, an "Amazon" row that opened our
own product page), read as Amazon's ban on links in pop-ups. The owner noticed the quick view sends nobody to Amazon and
chose (2026-11-06) to put the product page's own tagged Amazon link there. Amazon's Participation Requirements, item
(o): "You will not post or serve any Special Links … within any pop-up or pop-under windows, transitional page ads, or
layer ads, except for pop-up windows in conjunction with your Site promoting Products closely associated with the
materials on your Site." A quick view the visitor opens for one product, showing that same product, fits the exception;
the owner accepted the remaining risk. The quick view shows the link only (the item's own page where the ASIN is known,
else the tagged search), never Amazon's price: that stays on the product page under the 24-hour licence. Uninvited
overlays (a phone ad dock, a corner card, an exit pop-up) still never carry Amazon, and an Amazon page is never framed
(item (n)).

## 2026-11-07 — Good Smile Global read again; maker's price, last check and the stores we can't compare (Reddit)

r/Nendoroid asked why Good Smile Global/US, AmiAmi and BigBadToyStore weren't compared. Good Smile US (#55) and
BBTS (#56) were already added on 6 Nov. Good Smile's global shop (goodsmile.com/en, offline since its October breach)
partly reopened on 6 Nov: product pages carry Product JSON-LD with the JAN (`gtin`), the yen price and the stock, and
its list pages come from a keyless same-origin HTML fragment (`/en/search/list`, 60 a page). No robots.txt, no key
from page JS, one request a second. So it is read like HobbyLink Japan (`src/lib/import/goodsmile.ts`, region JP,
only pre-order and in-stock items of the three lines, ~240 on 7 Nov), shown converted under "Or import from Japan".

Also: a store row over the maker's own price for that JAN (Good Smile US in the US table, Good Smile Global in the
Japan table) by 2% and $1/¥100 says "Above Good Smile …'s price" (never a re-rank); the figure page states the last
check time and links `/stores`, which now lists the big stores we can't compare and why (AmiAmi, Good Smile Europe,
Entertainment Earth, Crunchyroll Store, Tokyo Otaku Mode), with the store count and last check.

## 2026-11-07: The sitemap lists a lean core

The owner's Search Console and Bing audit (2026-11-07) found FigureCompare's sitemap at 4,182 URLs on a domain Google
was still processing. The family's young domains are stuck in "Discovered – currently not indexed": with few links,
Google samples a few templated pages instead of indexing thousands. The sitemap now lists the hubs, series and guides as
before plus the 300 most widely stocked indexable figures (`sitemapFigures`, `SITEMAP_FIGURES`); line page 2+ left it.
Nothing was noindexed, removed or moved: every other figure stays live, indexable and linked from its line, series and
the lists. Widen `SITEMAP_FIGURES` once Search Console shows the core mostly indexed (recheck ~25 Nov).
## 2026-11-07 — Black Friday strip and Cyber Monday page (owner: "capture all of the Black Friday SEO")

Black Friday is 27 November 2026 and Cyber Monday 30 November. Three additions, this site:

- **`/cyber-monday`**, its own URL for its own searches ("nendoroid cyber monday deals"), kept every year like
  `/black-friday`, listing the same real store deals. In the sitemap and footer; the two pages link each other.
- **The holiday strip**: one line under the header on every page, in the server HTML, linking `/black-friday`
  from 1 November to the Saturday after it, then `/cyber-monday` to the day after Cyber Monday, then nothing
  (`saleStrip` in `lib/black-friday.ts`, tested). The same link leads the nav while it shows. A link, never a
  pop-up (pop-up policy: no uninvited interruption on a visit's first page), never a countdown or "ends soon".
- **More on both pages, nothing taken away**: the URL, title and h1 of `/black-friday` are unchanged; below the
  existing tiles come four visible questions (the dates, whether stores have sales, shipping, how often it updates). No FAQ rich-result markup:
  Google shows those only for government and health sites since 2023, so the text is what ranks.
## 2026-11-07 — The low-traction cull: a figure needs two stores that can sell it today

Owner, 2026-11-07: apply Compare Empire's focus cull to every site. The merge's two-stores rule counted stores listing a figure
sold out (27,376 of 46,610 offers on 2026-11-07). `lib/focus.ts`, applied by `scripts/import.ts` after the merge, lists a figure
only when the same rule holds counting stores that can sell it today (in stock or pre-order), or when Search Console shows a click
or 10+ impressions on its page (the `demand` branch). ≈4,660 → 2,880 figures, so every build prerenders ~40% fewer pages.
history.json keeps every merged figure and slugs are kept forever, so a figure that qualifies again returns with its chart. The
site has no functions, so a culled figure's page is gone (404) rather than redirected; 2 figure pages had any search demand and
both stay. The half-size guard compares the merge's count before the cull (`meta.merged`).
## 2026-11-07 — The big European shops on their own platforms: Figuya, Kurogami, Yorokonde (Archonia not yet)

Owner, 2026-11-07: "you're definitely missing Archonia … and other European shops". Every EU store we had was Shopify or
WooCommerce; the large ones run their own platforms, which the 2026-10-29 probe could not read. Checked by hand that day:

- **Figuya** (Berlin, ~5,900 Nendoroid/figma/POP UP PARADE pages), **Kurogami** (Spain, ~610) and **Yorokonde**
  (Germany, ~1,600) publish product sitemaps and print the JAN on every product page (JSON-LD `gtin13`; Yorokonde's
  Shopware 5 `itemprop="gtin13"`). Added as `platform: "sitemap"` (`src/lib/import/sitemap-store.ts`): URLs only from
  the sitemaps robots.txt names, kept when the URL names a line, then the page's own JAN and title decide, as for every
  store. No search or filter page is read (all three disallow them). One page a second.
- **The page cache.** Figuya's pages are too many for one run, so `data/state/page-cache.json` keeps what each page said;
  a run (`SITEMAP_PAGES`, 1,500 pages a store) re-reads pages that were orderable first, then pages never read, then the
  rest oldest first, and a page read in the last 7 days lists from the cache with the stock it had. Its prices are public
  store prices, so the file may be public. Figuya's backlog fills in about four runs.
- **Archonia** (Belgium) is readable (product sitemaps, JSON-LD with price and stock) but shows NO barcode and its titles
  carry no catalogue number ("Nendoroid Sunna"), so it would need title matching, which the barcode rule forbids. Left
  out and listed on /stores under "Stores we can't compare yet"; the owner was asked.
- Not yet looked at closely: Mangatori (FR, PrestaShop, JANs appear on its category pages) and Anime Import (IT,
  WordPress with the Store API off). Next round.
## 2026-11-07 — Mangatori added; Anime Import and Archonia block GitHub's runners (owner: "add all of them in one pass")

- **Mangatori** (France, PrestaShop: JSON-LD `gtin13`, the JAN also ends each product URL) joins the sitemap reader,
  inside the barcode rule. A runner read 15 pages: 4 listed, the oldest pages carry no JAN.
- **Anime Import** (Italy) answers GitHub's runners 403 on product pages, and **Archonia** (Belgium) 403 on its
  sitemap, though both load in a browser. That is bot protection, which we never work around, so both stay out and
  are on /stores under "Stores we can't compare yet". For Archonia the owner had also approved matching by whole
  name (it prints no barcode); the matcher was written (commit ed0f26b on this PR's branch: line + number + both-ways
  name words + one figure only + 60–160% of the EU median) and removed unused. Bring it back from there if Archonia
  ever lets the runners in.

## Black Friday indexing push (2026-11-07)

Owner: get every Black Friday page indexed. The daily IndexNow ping sent only the hubs it named, so the sale pages
(`/black-friday`, `/cyber-monday`, the other seasonal pages) and the blog posts never went out; they are named now
(the sitemap already listed them). A Black Friday blog post goes live on 8 November (on 7 November for Figure; Scent's,
written for the 14th, moved up because it is only useful before the sales) and the two sale pages link to it once it is live. Every price in it is a live table of
the day's prices; no countdown, no "was" price.

## 2026-11-08 — One Our sites page instead of footer cross-links

From the owner's Search Console audit of DexCompare: its only links from other sites were ~9,000 site-wide footer
links from our own sites, all to its home page, with the brand or a keyword as the anchor. They pass no authority,
and a network of same-owner sites linking each other from every page is the pattern Google's link-spam policy warns
about. CamCompare indexes well with more of them, so they are not what holds a site back, but they buy nothing.
DexCompare's footer went first (CompareEmpire #153); every other site now does the same: the footer links one
internal page, `/our-sites`, and that page links each other family site once, by its plain name, from
`FAMILY_SITES` (`lib/family-network.ts`, unchanged; `footerSisters` stays for the shared test). Every other footer
link, page URL and title is unchanged. Cross-traffic still comes from the price blocks on the deals and pre-order pages.
