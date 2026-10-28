import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { dealsIn, popular } from "@/lib/data";
import { TileGrid } from "@/components/FigureTile";
import { PageHead } from "@/components/Section";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

export const metadata: Metadata = {
  title: "Anime figure deals today",
  description: "Nendoroid, figma and POP UP PARADE figures where the cheapest store is at least 10% under the dearest, in stock today. Per region, updated daily.",
  alternates: { canonical: "/deals" },
};

export default function Deals() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        emoji="💸"
        title="Figure deals today"
        sub="In stock figures where the cheapest store is at least 10% under the dearest one in your region. Same barcode, same box, different price ٩(◕‿◕)۶"
      />
      {REGIONS.map((r) => {
        const deals = dealsIn(r.code, 48).map((d) => d.f);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {deals.length ? <TileGrid figures={deals} region={r.code} /> : <p className="sticker p-6 text-center text-soft">No deals {r.phrase} today. Check back after tomorrow&apos;s price check (´･ω･`)</p>}
          </div>
        );
      })}
      <EbayStrip className="mt-10" placement="deals" queries={SITE_QUERIES} figures={popular(30)} />
    </div>
  );
}
