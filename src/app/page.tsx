import { ChristmasGuide } from "@/components/ChristmasGuide";
import type { Metadata } from "next";
import Link from "next/link";
import { LINES, REGIONS, SITE } from "@/site";
import { activeStores, featuredDealsIn, featuredNewestIn, featuredPopular, featuredPopularIn, featuredPreordersIn, getFigures, getMeta, lineCounts } from "@/lib/data";
import { ago } from "@/lib/format";
import { LiveAgo } from "@/components/LiveAgo";
import { rankFigures } from "@/lib/home-demand";
import { SearchBox } from "@/components/SearchBox";
import { RegionChips } from "@/components/RegionPicker";
import { TileGrid } from "@/components/FigureTile";
import { Section } from "@/components/Section";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { CreatorsCornerBadge } from "@/components/creators/CreatorsCornerBadge";
import { JsonLd, faqLd, siteLd } from "@/lib/seo";
import { POSTS } from "@/content/blog";
import { SiteReviews } from "@/components/site-reviews/SiteReviews";

export const metadata: Metadata = {
  // 60 characters or fewer, keyword first, brand last (SEO audit, 2026-11-03).
  title: { absolute: `Nendoroid, figma & POP UP PARADE Prices | ${SITE.name}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

const FAQ: [string, string][] = [
  [
    "Where is the cheapest place to buy a Nendoroid or figma?",
    "It changes from figure to figure: a different store is cheapest for different releases, and pre-order prices move. We compare every real figure store's own price for the same JAN barcode every day and show the cheapest in-stock or pre-order price first for your country.",
  ],
  [
    "How do you avoid bootleg figures?",
    "We only list specialist figure shops and hobby stores, never open marketplaces where bootlegs hide, and match listings only by the JAN barcode printed on the box. Pre-owned, damaged, bundles and lucky bags are left out.",
  ],
  [
    "Do the prices include shipping or import charges?",
    "No. They are each store's listed item price in its own currency, never converted. Shipping, tax and import charges depend on where you live, so check the checkout before you buy.",
  ],
  [
    "Which countries do you compare?",
    "The United States, the United Kingdom, Canada, Australia, New Zealand, Europe and Singapore, plus stores shipping from Japan. Each region compares only stores charging in its own currency.",
  ],
];

export default function Home() {
  const meta = getMeta();
  const total = getFigures().length;
  const stores = Object.keys(activeStores()).length;
  const counts = lineCounts();
  return (
    <>
      <section className="border-b border-line bg-card">
        <div className="relative mx-auto max-w-6xl px-4 pb-7 pt-6 sm:pb-10 sm:pt-10 md:pt-14">
          {/* The creators hub, above the fold (owner, 2026-11-03): top-right corner from sm. Phone hero, 2026-11-19 (owner: "way
              too much going on in the mobile version of the home page"): the headline, one line and the gift guide; the header
              already has the search and the region, so the creators pill, region chips, second search and counts show from sm
              up. Same HTML at every width. */}
          <div className="hidden sm:contents"><CreatorsCornerBadge /></div>
          <ChristmasGuide />
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-pink">
            フィギュア price check
          </p>
          <h1 className="h-display max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Find the <span className="text-pink">lowest price</span> for any anime figure
          </h1>
          <p className="mt-3 max-w-2xl text-base text-soft sm:mt-4 sm:text-lg">
            Nendoroid, figma and POP UP PARADE prices from {stores || "real"} figure stores, matched by the barcode on the box and checked every day.
          </p>
          <div className="hidden sm:block"><RegionChips className="mt-6" /></div>
          <div className="mt-4 hidden max-w-2xl sm:block">
            <SearchBox big />
          </div>
          <div className="mt-5 hidden flex-wrap items-center gap-x-5 gap-y-2 text-sm text-soft sm:flex">
            <span><b className="text-ink">{total.toLocaleString("en-US")}</b> figures</span>
            <span><b className="text-ink">{stores}</b> stores</span>
            <span><b className="text-ink">{ACTIVE_REGIONS.length}</b> regions</span>
            {meta && <span>Checked <LiveAgo iso={meta.updatedAt} initial={ago(meta.updatedAt)} /></span>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* The three line tiles from sm up (2026-11-19): on a phone the chip row under the header names the same three. */}
        <section className="mt-10 hidden gap-4 sm:grid sm:grid-cols-3">
          {LINES.map((l) => (
            <Link prefetch={false} key={l.key} href={`/${l.key}`} className="sticker tile-hover p-5">
              <h2 className="h-display text-2xl">{l.name}</h2>
              <p className="mt-1 text-sm text-soft">{l.about}</p>
              <p className="mt-3 font-display font-semibold text-pink-deep">{counts[l.key].toLocaleString("en-US")} compared →</p>
            </Link>
          ))}
        </section>

        {REGIONS.map((r) => {
          const deals = rankFigures(featuredDealsIn(r.code, 24), r.code).slice(0, 8);
          const pre = rankFigures(featuredPreordersIn(r.code, 24), r.code).slice(0, 8);
          const pop = rankFigures(featuredPopularIn(r.code, 24), r.code).slice(0, 8);
          const fresh = featuredNewestIn(r.code, 8);
          return (
            <div key={r.code} className={`rp rp-${r.code}`}>
              {deals.length > 0 && (
                <Section title={`Biggest savings ${r.phrase}`} href="/deals" more="All deals">
                  <TileGrid figures={deals} region={r.code} rail />
                </Section>
              )}
              {pre.length > 0 && (
                <Section title={`Open for pre-order ${r.phrase}`} href="/preorders" more="All pre-orders">
                  <TileGrid figures={pre} region={r.code} rail />
                </Section>
              )}
              {pop.length > 0 && (
                <Section title={`Stocked by the most stores ${r.phrase}`}>
                  <TileGrid figures={pop} region={r.code} rail />
                </Section>
              )}
              {/* Just spotted from sm up: a phone gets three shelves, each one sideways row (2026-11-19). */}
              {fresh.length > 0 && (
                <div className="hidden sm:block">
                  <Section title="Just spotted" href="/new" more="Everything new">
                    <TileGrid figures={fresh} region={r.code} />
                  </Section>
                </div>
              )}
              {!deals.length && !pre.length && !pop.length && (
                <p className="sticker mt-10 p-6 text-center text-soft">No store {r.phrase} has figures in stock right now. Try another region.</p>
              )}
            </div>
          );
        })}

        {/* The eBay strip sits under the figure shelves, never above them (2026-11-19: on a phone it was the first thing after
            the hero, an ad above the page's own content). */}
        <EbayStrip className="mt-10" placement="home" queries={SITE_QUERIES} figures={featuredPopular(30)} title="Figures on eBay" />

        {/* "How it works", the browse links and the guide cards from sm up (2026-11-19): on a phone the menu and footer reach
            the same pages without three more screens. */}
        <section className="mt-14 hidden sm:block">
          <h2 className="h-display mb-4 text-2xl sm:text-3xl">
            How FigureCompare works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              ["Matched by barcode", "Every listing is matched on the JAN barcode printed on the box. No barcode, no match: we never guess from a title."],
              ["Real stores only", "Specialist figure shops and hobby stores, never open marketplaces where bootlegs hide. eBay and Amazon are shown apart and labelled."],
              ["Checked every day", "Prices, pre-orders and sold-outs are re-read daily, and each figure keeps its price history."],
            ].map(([t, d], i) => (
              <li key={t} className="sticker p-5">
                <span className="font-display text-sm font-bold text-pink">0{i + 1}</span>
                <h3 className="h-display mt-1 text-lg">{t}</h3>
                <p className="mt-1 text-sm text-soft">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 hidden sm:block">
          <h2 className="h-display mb-4 text-2xl sm:text-3xl">Browse figures</h2>
          <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {LINES.map((l) => (
              <li key={l.key}>
                <Link prefetch={false} href={`/${l.key}`} className="font-medium text-ink underline-offset-4 hover:underline">{l.name} prices</Link>
              </li>
            ))}
            <li><Link prefetch={false} href="/series" className="font-medium text-ink underline-offset-4 hover:underline">Figures by series</Link></li>
            <li><Link prefetch={false} href="/preorders" className="font-medium text-ink underline-offset-4 hover:underline">Pre-orders</Link></li>
            <li><Link prefetch={false} href="/deals" className="font-medium text-ink underline-offset-4 hover:underline">Deals</Link></li>
            <li><Link prefetch={false} href="/price-report" className="font-medium text-ink underline-offset-4 hover:underline">Monthly price report</Link></li>
          </ul>
        </section>

        {/* The site's own star score and approved reviews (owner, 2026-11-03), loaded in the browser; nothing until there is a rating. */}
        {/* Guides with thumbnails (owner, 2026-11-09): every post on the home page, server-rendered, below the figures. */}
        <div className="hidden sm:block">
        <Section title="Guides" href="/blog" more="All guides">
          <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...POSTS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((p) => (
              <li key={p.slug}>
                <Link prefetch={false} href={`/blog/${p.slug}`} className="sticker tile-hover group flex h-full flex-col overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image.src} alt={p.image.alt} width={1200} height={630} loading="lazy" decoding="async" className="aspect-[1200/630] w-full object-cover" />
                  <span className="flex flex-1 flex-col p-4">
                    <span className="font-semibold leading-snug group-hover:underline">{p.title}</span>
                    <span className="mt-1.5 line-clamp-2 text-sm text-soft">{p.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
        </div>

        <SiteReviews className="mt-14" />

        <section className="mt-14 max-w-3xl">
          <h2 className="h-display mb-4 text-2xl sm:text-3xl">Questions</h2>
          <div className="space-y-5">
            {FAQ.map(([q, a]) => (
              <div key={q}>
                <h3 className="font-bold">{q}</h3>
                <p className="mt-1 text-sm leading-relaxed text-soft">{a}</p>
              </div>
            ))}
          </div>
        </section>
        <JsonLd data={siteLd()} />
        <JsonLd data={faqLd(FAQ)} />
      </div>
    </>
  );
}
