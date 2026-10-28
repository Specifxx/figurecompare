# Working in this repo

FigureCompare (figurecompare.com) compares anime figure prices (Nendoroid, figma, POP UP PARADE) across real figure
stores in the US, UK, Canada, Australia, New Zealand, Europe and Singapore. A Compare Empire sister site
(RiftCompare is `Specifxx/TCGEmpire`). Read `README.md`, then `DECISIONS.md`.

## A fully static site: data in GitHub, pages on Vercel's CDN

- The daily import (`.github/workflows/import.yml`: `scripts/import.ts`, then `scripts/ebay-import.ts`) writes
  `data/public/*.json` and commits it to `main` with `[deploy]` in the subject: the one production build a day.
- Every page is prerendered at that build (`generateStaticParams` + `dynamicParams = false`): a visit is a static
  file, never a function. No database, no middleware, no ISR timer, no page reads cookies, headers or `searchParams`,
  every `next/link` has `prefetch={false}`, image optimisation is off. `tests/cost-rules.test.ts` pins all of it.
- The only function is eBay's account-deletion hook (`src/app/api/ebay/marketplace-deletion`); keep it while the
  eBay keyset exists.
- Never write anything private to `data/`: it is public with the source. Never edit `data/` by hand.
- The visitor's region is chosen in the browser (time zone, then their own pick in localStorage) by the script in
  `src/app/layout.tsx`; every region's prices are in the HTML and CSS shows one (`.rp-XX` in `globals.css`).

## Deploys are gated: never add `[deploy]` to a commit subject

Production builds only a commit whose SUBJECT carries `[deploy]` (`scripts/vercel-ignore-build.sh`,
`tests/vercel-ignore-build.test.ts`). The daily data commit carries it. "Push to prod" means land on `main` and ride
the next release; use *Production deploy* (or `[deploy]`) only when the owner says it is urgent, and say so.
Previews build only with `[preview]`, when the owner asks. `claude/*` branches never deploy (`vercel.json`).

## Matching: the barcode or nothing

- A listing is matched ONLY by its JAN (Japanese EAN-13, prefix 45/49, valid check digit; `src/lib/jan.ts`), read
  from the variant barcode, the SKU or a labelled "JAN:" in the description. No JAN, no listing. Never match on a
  title (re-releases, exclusives, "Ver. 2.0" and bootlegs look alike).
- The title decides only whether a listing belongs (`src/lib/title.ts`): our lines, new, one figure. Pre-owned,
  damaged, bootleg, bundles, lucky bags, parts, plush, Nendoroid More/Doll/Plus and figma Styles are refused. Every
  rule changed gets a real store title in `tests/title.test.ts`.
- A figure gets a page only when 2+ stores in one region sell it (`SITE.minStoresPerRegion`). Prices under 40% or
  over 250% of the region median (3+ stores) are dropped. A JAN two stores file under different lines keeps the
  majority, and is dropped on a tie (`src/lib/merge.ts`).
- Real stores only, never marketplaces (fakes). Stores live in `src/content/stores.ts`; read two at a time; a 403,
  429 or captcha stops that store (never worked around).
- Prices are never converted between currencies. A store charging another currency than its region's is skipped.
- Slugs are kept forever (`data/state/slugs.json`): a figure's URL never changes.

## Money

- Affiliate tags are added at build (`src/lib/affiliate.ts`): `figure-<region>-<placement>-<jan>` in EPN `customid`
  and Amazon `ascsubtag`; stores get `utm_source=figurecompare.com`.
- eBay and Amazon rows are pinned above the stores, labelled "Ad"/"Paid link", rel sponsored, never counted as a
  store and never "the cheapest". Commission never decides order.
- eBay listings come only from `scripts/ebay-import.ts` in GitHub Actions (Browse API by GTIN, new, Buy It Now,
  never from CN/HK sellers, 60%–300% of the store median, no row without a store reference). The keys are GitHub
  secrets only, never Vercel. Never raise `EBAY_DAILY_CAP` without the owner.
- No pop-ups, no interstitials (family pop-up policy). No ads beside a buy button.

## Design

Professional and unisex, for teens and adults (owner, 2026-10-28: the first candy look was too cute): neutral greys,
one red accent (`--pink` in `globals.css`, kept as a name), green for savings, Inter, flat cards with thin borders, no
mascot, sparkles, kaomoji or emoji decoration. The anime touch stays light: the star in the logo, a フィギュア kicker.
Never use character art, official logos or anime screenshots as decoration; product photos are the stores' own,
hotlinked. Respect `prefers-reduced-motion`. The link preview is drawn by `scripts/og/render.mjs` from real data.

## The site watches itself

`ops-monitor.yml` runs `scripts/ops-monitor.ts` every three hours; a failing check fails the run and GitHub emails
the owner. When you add a scheduled job, an external API or anything with a limit, add a check there.

## Checks

```
npm run typecheck
npm run lint
npm test
FIGURE_DATA_DIR=tests/fixtures/data npx next build   # every page prerenders against the fixture
```

Record non-obvious decisions in `DECISIONS.md` (newest at the bottom).
