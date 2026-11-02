import type { Metadata } from "next";
import Link from "next/link";
import { REGIONS } from "@/site";
import { dealsIn, popular } from "@/lib/data";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { TileGrid } from "@/components/FigureTile";
import { PageHead } from "@/components/Section";
import { listRegions, saleHeading, saleIntro, saleYear, SALE_SEASONS, type SaleSlug } from "@/lib/sale-seasons";

// The seasonal sale pages, /boxing-day, /january-sales, /lunar-new-year and /valentines-day (DECISIONS.md, "Seasonal sale
// pages", 2026-11-02): one URL each kept every year, with the Black Friday page's rows (dealsIn per region), prerendered at the
// daily build like every page. Every region's deals are in the HTML (CSS shows the visitor's), so the wording names them all.
const year = (slug: SaleSlug) => saleYear(slug, new Date().toISOString().slice(0, 10));
const PLACES = listRegions(REGIONS.map((r) => r.phrase.replace(/^in /, "")));

export function saleMetadata(slug: SaleSlug): Metadata {
  const y = year(slug);
  return {
    title: `Anime figure ${saleHeading(slug, y)}`,
    description: `${SALE_SEASONS[slug].name} ${y} deals on Nendoroid, figma and POP UP PARADE figures: in stock today where the cheapest store is at least 10% under the dearest, per region, updated daily.`,
    alternates: { canonical: `/${slug}` },
  };
}

export function SaleSeasonPage({ slug }: { slug: SaleSlug }) {
  const y = year(slug);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        title={`Anime figure ${saleHeading(slug, y)}`}
        sub={
          <>
            {saleIntro(slug, y, PLACES)} These are
            today&apos;s in-stock figures where the cheapest store is at least 10% under the dearest in your region: same barcode, same box. The page updates every day
            through the sales. We only see what a store asks when we read its prices, so check the store&apos;s page before you buy.
          </>
        }
      />
      {REGIONS.map((r) => {
        const deals = dealsIn(r.code, 60).map((d) => d.f);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {deals.length ? <TileGrid figures={deals} region={r.code} /> : <p className="sticker p-6 text-center text-soft">No figure is 10% under the dearest store {r.phrase} today.</p>}
          </div>
        );
      })}
      <EbayStrip className="mt-10" placement={slug.replace(/-/g, "_")} queries={SITE_QUERIES} figures={popular(30)} />
      <p className="mt-8 text-sm text-soft">
        <Link prefetch={false} href="/black-friday" className="underline">Black Friday deals</Link> · <Link prefetch={false} href="/deals" className="underline">Figure deals today</Link> · <Link prefetch={false} href="/preorders" className="underline">Figure pre-orders</Link> ·{" "}
        <Link prefetch={false} href="/stores" className="underline">Where to buy anime figures</Link>
      </p>
    </div>
  );
}
