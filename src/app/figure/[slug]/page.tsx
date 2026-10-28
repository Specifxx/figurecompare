import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LINE_BY_KEY, REGIONS, SITE, type RegionCode } from "@/site";
import { bestIn, figuresOfLine, getEbay, getFigure, getFigures, getHistory, regionsOf, spreadIn, storeCount, storeName } from "@/lib/data";
import { dayNumber, lowestOrderable } from "@/lib/history";
import { decimal, money, niceDate, pct } from "@/lib/format";
import { isIndexable } from "@/lib/index-tiers";
import { storeUrl } from "@/lib/affiliate";
import { FigureImage } from "@/components/FigureImage";
import { PriceTable } from "@/components/PriceTable";
import { PriceHistory } from "@/components/Sparkline";
import { RegionTabs } from "@/components/RegionPicker";
import { TileGrid } from "@/components/FigureTile";
import { OutLink } from "@/components/OutLink";
import { Sparkles } from "@/components/Sparkles";

// Prerendered at build, one static file per figure; a slug the release does
// not know is a 404, never a render on request.
export const dynamicParams = false;
export function generateStaticParams() {
  return getFigures().map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const f = getFigure(params.slug);
  if (!f) return {};
  const n = storeCount(f);
  const us = bestIn(f, "US");
  const title = `${f.name} price: compare ${n} store${n === 1 ? "" : "s"}`;
  const description = `${f.name} prices across ${n} figure stores${us ? `, from ${money(us.offer.p, "US")} in the US` : ""}. In stock, pre-order and sold-out listings matched by barcode (JAN ${f.jan}), updated daily.`;
  return {
    title,
    description,
    alternates: { canonical: `/figure/${f.slug}` },
    robots: isIndexable(f) ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `/figure/${f.slug}`, images: f.img ? [{ url: f.img }] : undefined },
  };
}

export default function FigurePage({ params }: { params: { slug: string } }) {
  const f = getFigure(params.slug);
  if (!f) notFound();
  const line = LINE_BY_KEY[f.line];
  const regions = regionsOf(f);
  const ebay = getEbay()[f.jan] ?? {};
  const history = getHistory()[f.jan] ?? {};
  const today = dayNumber(new Date().toISOString().slice(0, 10));
  const siblings = figuresOfLine(f.line)
    .filter((x) => x.jan !== f.jan)
    .sort((a, b) => storeCount(b) - storeCount(a))
    .slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: f.name,
    gtin13: f.jan,
    brand: { "@type": "Brand", name: line.maker },
    category: `Anime figures > ${line.name}`,
    image: f.img ?? undefined,
    url: `${SITE.url}/figure/${f.slug}`,
    offers: regions
      .map((r) => {
        const orderable = (f.offers[r] ?? []).filter((o) => o.st !== "out");
        if (!orderable.length) return null;
        const ps = orderable.map((o) => o.p);
        return {
          "@type": "AggregateOffer",
          priceCurrency: REGIONS.find((x) => x.code === r)!.currency,
          lowPrice: decimal(Math.min(...ps), r),
          highPrice: decimal(Math.max(...ps), r),
          offerCount: orderable.length,
          availability: orderable.some((o) => o.st === "in") ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
        };
      })
      .filter(Boolean),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-soft">
        <Link prefetch={false} href="/" className="hover:text-pink-deep">Home</Link> ›{" "}
        <Link prefetch={false} href={`/${line.key}`} className="hover:text-pink-deep">{line.name}</Link> ›{" "}
        <span className="text-ink">{f.name}</span>
      </nav>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative">
          <div className="sticker relative mx-auto max-w-sm -rotate-1 overflow-hidden bg-pink-pale md:max-w-none">
            <span aria-hidden className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 -translate-y-2 rotate-2 rounded-sm bg-lemon/80" />
            <Sparkles count={8} seed={f.jan.charCodeAt(12)} />
            <FigureImage src={f.img} alt={f.name} line={f.line} eager className="relative aspect-square w-full object-contain p-6" />
          </div>
          <p className="mt-2 text-center text-xs text-soft">Photo from a store listing.</p>
        </div>

        <div>
          <div className="flex flex-wrap gap-1.5">
            <span className="chip border-2 border-ink bg-pink text-white">{line.emoji} {line.name}{f.number ? ` No. ${f.number}` : ""}</span>
            <span className="chip border-2 border-line bg-card text-soft">{line.maker}</span>
            <span className="chip border-2 border-line bg-card text-soft">JAN {f.jan}</span>
          </div>
          <h1 className="h-display mt-2 text-3xl leading-tight sm:text-4xl">{f.name} price</h1>

          {regions.length > 1 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-soft">Prices in</p>
              <RegionTabs available={regions} />
            </div>
          )}

          {REGIONS.map((r) => {
            const b = bestIn(f, r.code);
            const s = spreadIn(f, r.code);
            return (
              <div key={r.code} className={`rp rp-${r.code} mt-4`}>
                {b ? (
                  <div className="sticker relative overflow-hidden bg-card p-4">
                    <div className="checker absolute inset-y-0 right-0 w-24 opacity-60" aria-hidden />
                    <p className="text-sm font-bold text-soft">
                      Cheapest {r.phrase} {b.offer.st === "pre" ? "(pre-order)" : ""}
                    </p>
                    <p className="h-display relative text-4xl text-pink-deep">{money(b.offer.p, r.code)}</p>
                    <p className="relative text-sm">
                      at <strong>{storeName(b.offer.s)}</strong> · {b.stores} store{b.stores === 1 ? "" : "s"} compared
                      {s != null && s >= 0.05 ? <> · <span className="font-bold text-mint">save up to {pct(s)}</span></> : null}
                    </p>
                    <OutLink
                      href={storeUrl(b.offer.s, b.offer.u)}
                      event={{ source: b.offer.s, region: r.code, placement: "hero", jan: f.jan }}
                      className="btn-pop relative mt-3 bg-buy px-6 py-2.5 text-white"
                    >
                      Buy at {storeName(b.offer.s)} <span aria-hidden>♡</span>
                    </OutLink>
                  </div>
                ) : (
                  <div className="sticker bg-card p-4 text-sm">
                    <p className="font-bold">
                      {f.offers[r.code]?.length ? `Sold out at every store ${r.phrase} right now (｡•́︿•̀｡)` : `No store ${r.phrase} lists this figure yet.`}
                    </p>
                    {regions.filter((x) => x !== r.code).length > 0 && (
                      <p className="mt-1 text-soft">
                        It is sold {regions.filter((x) => x !== r.code).map((x) => REGIONS.find((y) => y.code === x)!.phrase).join(", ")}: pick a region above, or check eBay below.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <h2 className="h-display mb-3 text-2xl">Every store&apos;s price ✦</h2>
          {REGIONS.map((r) => (
            <div key={r.code} className={`rp rp-${r.code}`}>
              <PriceTable f={f} region={r.code} ebay={ebay[r.code]} />
              {r.code !== "JP" && f.offers.JP?.length ? (
                <div className="mt-6">
                  <h3 className="h-display mb-1 text-lg">🇯🇵 Or import from Japan</h3>
                  <p className="mb-2 text-xs text-soft">Prices in yen, before international shipping and any import tax.</p>
                  <PriceTable f={f} region="JP" placement="japan" />
                </div>
              ) : null}
            </div>
          ))}
          <p className="mt-3 text-xs text-soft">
            Prices are what each store showed at our last check and exclude shipping. Every listing here carries this figure&apos;s barcode (JAN {f.jan}), so it is the same product, not a look-alike.
          </p>
        </div>

        <aside className="space-y-6">
          <div className="sticker p-4">
            <h2 className="h-display mb-2 text-lg">Price history 📈</h2>
            {REGIONS.map((r) => (
              <div key={r.code} className={`rp rp-${r.code}`}>
                <PriceHistory series={history[r.code]} region={r.code} today={today} />
              </div>
            ))}
          </div>
          <div className="sticker p-4 text-sm">
            <h2 className="h-display mb-2 text-lg">Figure facts</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-soft">Line</dt>
              <dd>{line.name}</dd>
              {f.number && (
                <>
                  <dt className="text-soft">Number</dt>
                  <dd>{f.number}</dd>
                </>
              )}
              <dt className="text-soft">Maker</dt>
              <dd>{line.maker}</dd>
              <dt className="text-soft">Barcode (JAN)</dt>
              <dd>{f.jan}</dd>
              <dt className="text-soft">Stores</dt>
              <dd>{storeCount(f)}</dd>
              <dt className="text-soft">First seen</dt>
              <dd>{niceDate(f.first)}</dd>
            </dl>
            <p className="mt-3 text-soft">{line.about}</p>
          </div>
        </aside>
      </section>

      {siblings.length > 0 && (
        <section className="mt-10">
          <h2 className="h-display mb-3 text-2xl">More {line.name} ♡</h2>
          <TileGrid figures={siblings} />
        </section>
      )}

      <section className="mt-10 max-w-3xl">
        <h2 className="h-display mb-3 text-2xl">Questions</h2>
        <Faq f={f} regions={regions} />
      </section>

      {/* Phone buy bar: the region's cheapest orderable store, always in reach. */}
      {REGIONS.map((r) => {
        const low = lowestOrderable(f.offers[r.code]);
        return low ? (
          <div key={r.code} className={`rp rp-${r.code}`}>
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t-2 border-line bg-card/95 px-4 py-2 backdrop-blur md:hidden">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-soft">Cheapest {r.phrase}: {storeName(low.s)}</p>
                <p className="h-display text-xl text-pink-deep">{money(low.p, r.code)}</p>
              </div>
              <OutLink href={storeUrl(low.s, low.u)} event={{ source: low.s, region: r.code, placement: "buybar", jan: f.jan }} className="btn-pop bg-buy text-white">
                Buy ♡
              </OutLink>
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}

function Faq({ f, regions }: { f: ReturnType<typeof getFigure> & {}; regions: RegionCode[] }) {
  const qa: [string, string][] = [];
  for (const r of regions) {
    const b = bestIn(f, r);
    const reg = REGIONS.find((x) => x.code === r)!;
    if (b) qa.push([`Where is ${f.name} cheapest ${reg.phrase}?`, `${storeName(b.offer.s)} at ${money(b.offer.p, r)}${b.offer.st === "pre" ? " (pre-order)" : ""}, the lowest of ${b.stores} store${b.stores === 1 ? "" : "s"} we compared at our last check.`]);
  }
  qa.push([
    `How do you know every store sells the same ${f.name}?`,
    `We match listings only by the barcode printed on the box (JAN ${f.jan}). A listing without a barcode is left out rather than guessed, so re-releases, exclusives and look-alikes never get mixed up.`,
  ]);
  qa.push(["Are these prices with shipping?", "No: they are the store's own listed price. Shipping, tax and import charges depend on where you live, so check the store's checkout before you buy."]);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="space-y-2">
        {qa.map(([q, a]) => (
          <details key={q} className="sticker group p-4">
            <summary className="cursor-pointer list-none font-bold">
              <span className="mr-1 inline-block text-pink transition group-open:rotate-90">▸</span> {q}
            </summary>
            <p className="mt-2 text-sm text-soft">{a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
