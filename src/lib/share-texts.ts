// The share messages, written at build (server only: it reads the data files). lib/share-link.ts has the rest.
import { REGIONS, SITE, type RegionCode } from "@/site";
import type { Figure } from "./types";
import { storeName } from "./data";
import { money } from "./format";
import { priceGap } from "./share-link";

/** The share message in every region the figure is sold in (the button picks the visitor's; "" = no gap there). */
export function shareTexts(f: Figure): Partial<Record<RegionCode, string>> {
  const out: Partial<Record<RegionCode, string>> = {};
  for (const r of REGIONS) {
    const gap = priceGap((f.offers[r.code] ?? []).filter((o) => o.st !== "out").map((o) => ({ priceCents: o.p, storeName: storeName(o.s) })));
    if (gap) out[r.code] = `${f.name}: ${money(gap.low.priceCents, r.code)} at ${gap.low.storeName}, up to ${money(gap.high.priceCents, r.code)} elsewhere (${gap.pct}% less). Compared on ${SITE.name}`;
  }
  return out;
}
