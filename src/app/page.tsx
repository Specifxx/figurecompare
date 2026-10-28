import type { Metadata } from "next";
import Link from "next/link";
import { LINES, REGIONS, SITE } from "@/site";
import { activeStores, dealsIn, getFigures, getMeta, lineCounts, newest, newestIn, popular, popularIn, preordersIn, storeName } from "@/lib/data";
import { ago, money, pct } from "@/lib/format";
import { Mascot } from "@/components/Mascot";
import { Sparkles } from "@/components/Sparkles";
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

const LINE_CARD = ["bg-pink-pale", "bg-lilac-pale", "bg-mint-pale"];

export default function Home() {
  const meta = getMeta();
  const total = getFigures().length;
  const stores = Object.keys(activeStores()).length;
  const counts = lineCounts();
  return (
    <>
      <section className="relative overflow-hidden">
        <Sparkles count={18} seed={3} />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 pb-8 pt-8 md:grid-cols-[1.4fr_1fr] md:pt-12">
          <div className="relative">
            <p className="chip mb-3 border-2 border-ink bg-lemon text-ink shadow-popsm">✦ フィギュア price check ✦</p>
            <h1 className="h-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Find your figure&apos;s <span className="rainbow-text">lowest price</span> ♡
            </h1>
            <p className="mt-3 max-w-xl text-lg text-soft">
              Nendoroid, figma and POP UP PARADE prices from {stores || "real"} figure stores, matched by the barcode on the box and checked every day.
            </p>
            <div className="mt-5 max-w-xl">
              <SearchBox big />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="chip border-2 border-line bg-card text-ink">🎁 {total.toLocaleString("en-US")} figures</span>
              <span className="chip border-2 border-line bg-card text-ink">🏪 {stores} stores</span>
              <span className="chip border-2 border-line bg-card text-ink">🌏 {ACTIVE_REGIONS.length} regions</span>
              {meta && <span className="chip border-2 border-line bg-card text-ink">⏰ checked {ago(meta.updatedAt)}</span>}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-soft">
              Showing prices for <RegionPicker />
            </div>
          </div>
          <div className="relative mx-auto hidden md:block">
            <div className="absolute -left-8 top-2 z-10 max-w-[13rem] rotate-[-4deg] rounded-3xl border-2 border-ink bg-card px-4 py-2 text-sm font-bold shadow-pop">
              I checked {stores || "every"} stores today so you don&apos;t have to! (๑˃ᴗ˂)ﻭ
            </div>
            <div className="motion-safe:animate-float">
              <Mascot size={260} />
            </div>
          </div>
        </div>
      </section>

      {REGIONS.map((r) => {
        const deals = dealsIn(r.code, 12);
        return deals.length ? (
          <div key={r.code} className={`rp rp-${r.code} overflow-hidden border-y-2 border-ink bg-pink py-2 text-white`} aria-label="Today's biggest savings">
            <div className="flex w-max motion-safe:animate-marquee hover:[animation-play-state:paused]">
              {[0, 1].map((k) => (
                <div key={k} className="flex shrink-0 gap-8 pr-8 font-display font-semibold" aria-hidden={k === 1}>
                  {deals.map((d) => (
                    <Link prefetch={false} key={d.f.jan} href={`/figure/${d.f.slug}`} className="whitespace-nowrap hover:underline" tabIndex={k ? -1 : 0}>
                      ✿ {d.f.name} {money(d.best.offer.p, r.code)} at {storeName(d.best.offer.s)} <span className="rounded-full bg-lemon px-2 text-ink">−{pct(d.spread)}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })}

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {LINES.map((l, i) => (
            <Link prefetch={false} key={l.key} href={`/${l.key}`} className={`sticker tile-hover relative overflow-hidden p-5 ${LINE_CARD[i]}`}>
              <span aria-hidden className="absolute -right-3 -top-3 text-7xl opacity-30">{l.emoji}</span>
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
                <Section title={`Biggest savings ${r.phrase}`} kaomoji="(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧" href="/deals" more="All deals">
                  <TileGrid figures={deals} region={r.code} />
                </Section>
              )}
              {pre.length > 0 && (
                <Section title={`Open for pre-order ${r.phrase}`} kaomoji="(っ˘ω˘ς )" href="/preorders" more="All pre-orders">
                  <TileGrid figures={pre} region={r.code} />
                </Section>
              )}
              {pop.length > 0 && (
                <Section title={`Stocked by the most stores ${r.phrase}`} kaomoji="ʕ•ᴥ•ʔ">
                  <TileGrid figures={pop} region={r.code} />
                </Section>
              )}
              {fresh.length > 0 && (
                <Section title="Just spotted" kaomoji="☆*:.｡.o(≧▽≦)o.｡.:*☆" href="/new" more="Everything new">
                  <TileGrid figures={fresh} region={r.code} />
                </Section>
              )}
              {!deals.length && !pre.length && !pop.length && (
                <p className="sticker mt-10 p-6 text-center text-soft">No store {r.phrase} has figures in stock right now. Try another region (・_・;)</p>
              )}
            </div>
          );
        })}

        <EbayStrip className="mt-10" placement="home_new" queries={SITE_QUERIES} figures={newest(30)} title="New on eBay" />

        <section className="mt-14">
          <h2 className="h-display mb-4 text-center text-3xl">
            How FigureCompare works <span className="text-pink">✧</span>
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              ["🔍", "Matched by barcode", "Every listing is matched on the JAN barcode printed on the box. No barcode, no match: we never guess from a title."],
              ["🏪", "Real stores only", "Specialist figure shops and hobby stores, never open marketplaces where bootlegs hide. eBay and Amazon are shown apart and labelled."],
              ["⏰", "Checked every day", "Prices, pre-orders and sold-outs are re-read daily, and each figure keeps its price history."],
            ].map(([e, t, d], i) => (
              <li key={t} className={`sticker relative p-5 ${["bg-sky-pale", "bg-lemon-pale", "bg-mint-pale"][i]}`}>
                <span className="absolute -top-4 left-4 grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-card font-display font-bold shadow-popsm">{i + 1}</span>
                <p className="text-3xl" aria-hidden>{e}</p>
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
