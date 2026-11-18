// The home page's ranking input and how a figure reads into it (lib/home-rank.ts; DECISIONS.md "Home pages rank items by
// demand", 2026-11-18). data/demand.json is written into the daily data commit by import.yml (scripts/pull-demand.sh, from
// RiftCompare's /api/demand/figure: figure page views, last 28 and 7 days) and read at build: imported, no request-time read.
import raw from "../../data/demand.json";
import type { RegionCode } from "@/site";
import { bestIn } from "./data";
import { rankItems, type DemandFile } from "./home-rank";
import type { Figure } from "./types";

// Through unknown: JSON imports type each pair as number[], not [number, number], so the first non-empty file
// fails the typecheck, and with it the next release's build (MTG and Dex, 2026-11-18).
export const HOME_DEMAND = raw as unknown as DemandFile;

/** Figures, most likely to earn first in a region: their page's views, stores in stock there, price, how new. */
export function rankFigures(list: readonly Figure[], region: RegionCode): Figure[] {
  return rankItems(
    list,
    (f) => {
      const best = bestIn(f, region);
      const offers = f.offers[region] ?? [];
      const open = offers.filter((o) => o.st !== "out");
      return {
        paths: [`/figure/${f.slug}`],
        clickKey: f.slug,
        priceCents: best?.offer.p ?? null,
        inStock: new Set(open.map((o) => o.s)).size,
        releaseDate: f.first ? f.first.slice(0, 10) : null,
        preorder: offers.some((o) => o.st === "pre"),
      };
    },
    HOME_DEMAND,
  );
}
