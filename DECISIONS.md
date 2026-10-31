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
