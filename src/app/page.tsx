import type { Metadata } from "next";
import Link from "next/link";
import { LINES, REGIONS, SITE } from "@/site";
import { activeStores, featuredDealsIn, featuredNewestIn, featuredPopular, featuredPopularIn, featuredPreordersIn, getFigures, getMeta, lineCounts } from "@/lib/data";
import { ago } from "@/lib/format";
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
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 md:pt-14">
          {/* The creators hub, above the fold (owner, 2026-11-03): top-right corner from sm, a pill above the kicker on a phone. */}
          <CreatorsCornerBadge />
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-pink">
            フィギュア price check
          </p>
          <h1 className="h-display max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Find the <span className="text-pink">lowest price</span> for any anime figure
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-soft">
            Nendoroid, figma and POP UP PARADE prices from {stores || "real"} figure stores, matched by the barcode on the box and checked every day.
          </p>
          <RegionChips className="mt-6" />
          <div className="mt-4 max-w-2xl">
            <SearchBox big />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-soft">
            <span><b className="text-ink">{total.toLocaleString("en-US")}</b> figures</span>
            <span><b className="text-ink">{stores}</b> stores</span>
            <span><b className="text-ink">{ACTIVE_REGIONS.length}</b> regions</span>
            {meta && <span>Checked {ago(meta.updatedAt)}</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {LINES.map((l) => (
            <Link prefetch={false} key={l.key} href={`/${l.key}`} className="sticker tile-hover p-5">
              <h2 className="h-display text-2xl">{l.name}</h2>
              <p className="mt-1 text-sm text-soft">{l.about}</p>
              <p className="mt-3 font-display font-semibold text-pink-deep">{counts[l.key].toLocaleString("en-US")} compared →</p>
            </Link>
          ))}
        </section>

        <EbayStrip className="mt-10" placement="home" queries={SITE_QUERIES} figures={featuredPopular(30)} title="Figures on eBay" />

        {REGIONS.map((r) => {
          const deals = featuredDealsIn(r.code, 8);
          const pre = featuredPreordersIn(r.code, 8);
          const pop = featuredPopularIn(r.code, 8);
          const fresh = featuredNewestIn(r.code, 8);
          return (
            <div key={r.code} className={`rp rp-${r.code}`}>
              {deals.length > 0 && (
                <Section title={`Biggest savings ${r.phrase}`} href="/deals" more="All deals">
                  <TileGrid figures={deals} region={r.code} />
                </Section>
              )}
              {pre.length > 0 && (
                <Section title={`Open for pre-order ${r.phrase}`} href="/preorders" more="All pre-orders">
                  <TileGrid figures={pre} region={r.code} />
                </Section>
              )}
              {pop.length > 0 && (
                <Section title={`Stocked by the most stores ${r.phrase}`}>
                  <TileGrid figures={pop} region={r.code} />
                </Section>
              )}
              {fresh.length > 0 && (
                <Section title="Just spotted" href="/new" more="Everything new">
                  <TileGrid figures={fresh} region={r.code} />
                </Section>
              )}
              {!deals.length && !pre.length && !pop.length && (
                <p className="sticker mt-10 p-6 text-center text-soft">No store {r.phrase} has figures in stock right now. Try another region.</p>
              )}
            </div>
          );
        })}


        <section className="mt-14">
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

        <section className="mt-14">
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
