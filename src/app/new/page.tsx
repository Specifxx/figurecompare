import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { newest, newestIn } from "@/lib/data";
import { TileGrid } from "@/components/FigureTile";
import { PageHead } from "@/components/Section";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

export const metadata: Metadata = {
  title: "New anime figures in stores",
  description: "Nendoroid, figma and POP UP PARADE figures that just appeared in stores, newest first, with prices compared.",
  alternates: { canonical: "/new" },
};

export default function NewFigures() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead emoji="✨" title="Just spotted in stores" sub="Figures that appeared at two or more stores most recently, newest first." />
      {REGIONS.map((r) => {
        const list = newestIn(r.code, 48);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {list.length ? <TileGrid figures={list} region={r.code} /> : <p className="sticker p-6 text-center text-soft">Nothing new {r.phrase} yet.</p>}
          </div>
        );
      })}
      <EbayStrip className="mt-10" placement="new" queries={SITE_QUERIES} figures={newest(30)} />
    </div>
  );
}
