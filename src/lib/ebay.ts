// Pure eBay rules (tests/ebay.test.ts). eBay rows are labelled ads, pinned
// above the stores, never counted as a store and never the "best price".
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { median } from "./merge";
import { readTitle } from "./title";
import type { EbayPick, Figure, Offer } from "./types";

export interface EbayItem {
  title: string;
  itemWebUrl: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  itemLocation?: { country?: string };
  condition?: string;
}

// Bootleg figures overwhelmingly ship from these; an official figure from a
// real seller is still listed from Japan, the US, Europe or Australia.
const BOOTLEG_ORIGINS = new Set(["CN", "HK"]);

/**
 * The cheapest believable listing: new, from outside the bootleg origins, a
 * title that is still a figure of our lines (no pre-owned, bundle, accessory),
 * in the region's currency, and within 60%–300% of the stores' median. No
 * store reference, no eBay row (family rule).
 */
export function ebayPick(items: EbayItem[], storeOffers: Offer[], region: RegionCode): EbayPick | null {
  if (!storeOffers.length) return null;
  const ref = median(storeOffers.map((o) => o.p));
  const cur = REGION_BY_CODE[region].currency;
  const minor = cur === "JPY" ? 1 : 100;
  let best: EbayPick | null = null;
  for (const it of items) {
    if (!it.price || it.price.currency !== cur) continue;
    if (it.itemLocation?.country && BOOTLEG_ORIGINS.has(it.itemLocation.country)) continue;
    if ("refused" in readTitle(it.title)) continue;
    const p = Math.round(Number(it.price.value) * minor);
    if (!(p > 0) || p < ref * 0.6 || p > ref * 3) continue;
    if (!best || p < best.p) best = { p, u: it.itemWebUrl.split("?")[0], t: it.title.slice(0, 120), img: it.image?.imageUrl ?? null };
  }
  return best;
}

/** Which (figure, region) pairs to search today: pairs where stores sell the
 *  figure, never-checked first, then oldest check, then most stores. */
export function planEbay(figures: Figure[], checked: Record<string, string>, regions: RegionCode[], budget: number): { f: Figure; region: RegionCode }[] {
  const pairs: { f: Figure; region: RegionCode; at: string; n: number }[] = [];
  for (const f of figures) {
    for (const region of regions) {
      const offers = f.offers[region];
      if (!offers?.length) continue;
      pairs.push({ f, region, at: checked[`${f.jan}:${region}`] ?? "", n: offers.length });
    }
  }
  return pairs
    .sort((a, b) => a.at.localeCompare(b.at) || b.n - a.n || a.f.jan.localeCompare(b.f.jan))
    .slice(0, Math.max(0, budget))
    .map(({ f, region }) => ({ f, region }));
}
