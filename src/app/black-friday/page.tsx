import type { Metadata } from "next";
import Link from "next/link";
import { REGIONS } from "@/site";
import { dealsIn, popular } from "@/lib/data";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { FamilyCluster } from "@/components/FamilyCluster";
import { TileGrid } from "@/components/FigureTile";
import { PageHead } from "@/components/Section";
import { blackFriday, cyberMonday, longDate, seasonYear } from "@/lib/black-friday";

// The Black Friday page (DECISIONS.md, "Black Friday page", 2026-11-02): today's deals at one URL kept every year,
// prerendered at the daily build like every page.
const year = () => seasonYear(new Date().toISOString().slice(0, 10));

export function generateMetadata(): Metadata {
  const y = year();
  return {
    title: `Anime figure Black Friday deals ${y}`,
    description: `Black Friday and Cyber Monday ${y} deals on Nendoroid, figma and POP UP PARADE figures: in stock today where the cheapest store is at least 10% under the dearest, per region, updated daily.`,
    alternates: { canonical: "/black-friday" },
  };
}

export default function BlackFriday() {
  const y = year();
  const bf = blackFriday(y);
  const before = new Date().toISOString().slice(0, 10) < bf;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        title={`Anime figure Black Friday deals ${y}`}
        sub={
          <>
            Black Friday is {longDate(bf)} and Cyber Monday is {longDate(cyberMonday(y))} {y}.{before ? " Many stores start their sales earlier." : ""} These are
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
      <FamilyCluster kind="deal" />
      <EbayStrip className="mt-10" placement="black_friday" queries={SITE_QUERIES} figures={popular(30)} />
      <p className="mt-8 text-sm text-soft">
        <Link prefetch={false} href="/deals" className="underline">Figure deals today</Link> · <Link prefetch={false} href="/preorders" className="underline">Figure pre-orders</Link> ·{" "}
        <Link prefetch={false} href="/stores" className="underline">Where to buy anime figures</Link>
      </p>
    </div>
  );
}
