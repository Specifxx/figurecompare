# FigureCompare ✧

Compare Nendoroid, figma and POP UP PARADE prices across real anime figure stores in the US, UK, Canada,
Australia, New Zealand, Europe and Singapore. Matched by the barcode on the box, checked every day.
Live at **figurecompare.com**. A Compare Empire site.

## How it works

```
GitHub Actions, daily 05:23 UTC (import.yml)
  every store in src/content/stores.ts (Shopify products.json / WooCommerce Store API, 2 at a time)
  → listings with a Japanese JAN on a covered line (src/lib/jan.ts, src/lib/title.ts)
  → one figure per JAN, kept when 2+ stores in a region sell it (src/lib/merge.ts)
  → eBay Browse by GTIN, budgeted (scripts/ebay-import.ts; off until its keys exist)
  → data/public/{figures,history,ebay,meta}.json, data/state/*
  → commit to main with "[deploy]" in the subject → one Vercel build a day → IndexNow ping
```

* **No database, no functions for visitors.** Every page is prerendered at the daily build from the committed
  JSON; search is a static `/search-index.json`. The visitor's region is picked in the browser.
* **Deploys are gated** (`scripts/vercel-ignore-build.sh`): production builds only for `[deploy]` in the subject.
* **Monitoring**: `ops-monitor.yml` every three hours; a failure emails the owner through GitHub.

## Pages

Home (savings ticker, deals, pre-orders, most-stocked, new), `/figure/<slug>` (every store's price per region,
pinned eBay/Amazon rows, "import from Japan", price history, FAQ, Product + FAQ JSON-LD, phone buy bar),
`/nendoroid`, `/figma`, `/pop-up-parade` (paged), `/deals`, `/preorders`, `/new`, `/stores`, `/search`, `/about`,
`/disclosure`, `/privacy`, `/terms`, `sitemap.xml` (indexable figures only), `robots.txt`.

## Run locally

```
npm install
FIGURE_DATA_DIR=tests/fixtures/data npm run dev     # synthetic fixture (npx tsx tests/fixtures/make-fixture.ts)
STORES=store-id npx tsx scripts/import.ts           # a real import of one store
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`. Going live: `docs/SETUP.md`.
