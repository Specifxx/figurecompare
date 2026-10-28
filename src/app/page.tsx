import type { Metadata } from "next";
import Link from "next/link";
import { LINES, REGIONS, SITE } from "@/site";
import { activeStores, dealsIn, getFigures, getMeta, lineCounts, newest, newestIn, popular, popularIn, preordersIn } from "@/lib/data";
import { ago } from "@/lib/format";
import { SearchBox } from "@/components/SearchBox";
import { RegionPicker } from "@/components/RegionPicker";
import { TileGrid } from "@/components/FigureTile";
import { Section } from "@/components/Section";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name}: compare Nendoroid, figma & POP UP PARADE prices` },
  alternates: { canonical: "/" },
};

export default function Home() {
  const meta = getMeta();
  const total = getFigures().length;
  const stores = Object.keys(activeStores()).length;
  const counts = lineCounts();
  return (
    <>
      <section className="border-b border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pt-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-pink">フィギュア price check</p>
          <h1 className="h-display max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Find the <span className="text-pink">lowest price</span> for any anime figure
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-soft">
            Nendoroid, figma and POP UP PARADE prices from {stores || "real"} figure stores, matched by the barcode on the box and checked every day.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchBox big />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-soft">
            <span><b className="text-ink">{total.toLocaleString("en-US")}</b> figures</span>
            <span><b className="text-ink">{stores}</b> stores</span>
            <span><b className="text-ink">{ACTIVE_REGIONS.length}</b> regions</span>
            {meta && <span>Checked {ago(meta.updatedAt)}</span>}
            <span className="flex items-center gap-2">
              Prices for <RegionPicker />
            </span>
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

        <EbayStrip className="mt-10" placement="home" queries={SITE_QUERIES} figures={popular(30)} title="Figures on eBay" />

        {REGIONS.map((r) => {
          const deals = dealsIn(r.code, 8).map((d) => d.f);
          const pre = preordersIn(r.code, 8);
          const pop = popularIn(r.code, 8);
          const fresh = newestIn(r.code, 8);
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

        <EbayStrip className="mt-10" placement="home_new" queries={SITE_QUERIES} figures={newest(30)} title="New on eBay" />

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
      </div>
    </>
  );
}
