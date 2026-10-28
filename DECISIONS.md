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
  listing must sit within 60%–300% of the stores' median. Campaign: `EBAY_AFFILIATE_CAMPAIGN`, falling back to
  the family's shared campaign until FigureCompare has its own.
* **Amazon**: a search row per region where an Associates tag exists (US falls back to the family tag).
* **HobbyLink Japan** (3%): searched by JAN once `HLJ_AFFILIATE_REF` exists.
* **Store programs**: a store's `affiliate` param is added when its env var is set; it is then labelled
  "Paid link". Commission never changes order.

## Design — 2026-10-28

Pastel candy palette with a night-sky theme, Fredoka + M PLUS Rounded 1c (self-hosted through @fontsource, no
Google Fonts request), sticker cards, a ribbon header, sparkles, kaomoji and an original mascot, Kira. No
character art, official logos or screenshots anywhere: the owner's no-trademark rule, and copyright. Motion
stops under `prefers-reduced-motion`. No pop-ups (family pop-up policy).
