import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { preorders, preordersIn } from "@/lib/data";
import { TileGrid } from "@/components/FigureTile";
import { PageHead } from "@/components/Section";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

export const metadata: Metadata = {
  title: "Figure pre-orders: compare prices",
  description: "Nendoroid, figma and POP UP PARADE pre-orders open now, with every store's pre-order price compared in your region.",
  alternates: { canonical: "/preorders" },
};

export default function Preorders() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead emoji="📅" title="Figure pre-orders" sub="Pre-orders open now, most stores first. Lock in the lowest pre-order price before it sells out (っ˘ω˘ς )" />
      {REGIONS.map((r) => {
        const list = preordersIn(r.code, 96);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {list.length ? <TileGrid figures={list} region={r.code} /> : <p className="sticker p-6 text-center text-soft">No pre-orders open {r.phrase} right now.</p>}
          </div>
        );
      })}
      <EbayStrip className="mt-10" placement="preorders" queries={SITE_QUERIES} figures={preorders().slice(0, 30)} />
    </div>
  );
}
