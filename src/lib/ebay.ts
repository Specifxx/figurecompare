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
  shippingOptions?: { shippingCost?: { value?: string; currency?: string } }[];
  condition?: string;
}

/** EU countries: an EU buyer's eBay row may come from a seller in any of them (no customs). */
export const EU_COUNTRIES: ReadonlySet<string> = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);

/** Where the products come from: sellers there are kept for every region, priced delivered (owner, 2026-10-31). */
export const HOME_COUNTRY = "JP";

/** eBay's two-letter country code for a region (the UK is GB on eBay). */
export const EBAY_COUNTRY: Partial<Record<RegionCode, string>> = { US: "US", UK: "GB", CA: "CA", AU: "AU", EU: "DE" };

/**
 * Is a seller local to the region? Visitor feedback (WargameCompare, 2026-10-31): overseas sellers' postage made eBay rows
 * "a lot of wasted clicks", so a region's row comes only from a seller in its own country (any EU country for the EU).
 * A listing that gives no location passes: the search itself asked for local sellers.
 */
export function localSeller(region: RegionCode, country: string | undefined): boolean {
  if (!country) return true;
  // The products' home country (Japan) is often the cheapest genuine source: its sellers stay, priced with postage.
  if (country === HOME_COUNTRY) return true;
  return region === "EU" ? EU_COUNTRIES.has(country) : country === EBAY_COUNTRY[region];
}

/** The postage eBay states for the listing, in minor units, or null when it states none (calculated) or in another currency. */
export function statedPostage(it: EbayItem, currency: string, minor: number): number | null {
  const c = it.shippingOptions?.[0]?.shippingCost;
  if (!c || c.value == null || (c.currency && c.currency !== currency)) return null;
  const n = Math.round(Number(c.value) * minor);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** May a stored row be shown? Only one with its postage known (rows from before 2026-10-31 have none). */
export const ebayRowShown = (pick: EbayPick | undefined): pick is EbayPick => !!pick && pick.sh != null;

// Bootleg figures overwhelmingly ship from these; an official figure from a
// real seller is still listed from Japan, the US, Europe or Australia.
const BOOTLEG_ORIGINS = new Set(["CN", "HK"]);

/**
 * The cheapest believable listing: new, from outside the bootleg origins, a
 * title that is still a figure of our lines (no pre-owned, bundle, accessory),
 * in the region's currency, and within 60%–300% of the stores' median; from a
 * seller in the region (localSeller) with postage eBay states, priced delivered. No
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
    if (!localSeller(region, it.itemLocation?.country)) continue;
    const sh = statedPostage(it, cur, minor);
    if (sh == null) continue;
    if ("refused" in readTitle(it.title)) continue;
    const p = Math.round(Number(it.price.value) * minor);
    if (!(p > 0) || p < ref * 0.6 || p > ref * 3) continue;
    // The row shows the DELIVERED price, and the cheapest delivered wins.
    if (!best || p + sh < best.p) best = { p: p + sh, sh, u: it.itemWebUrl.split("?")[0], t: it.title.slice(0, 120), img: it.image?.imageUrl ?? null };
  }
  return best;
}

/** Days a US pair's last check counts as older than it is (owner, 2026-11-01: "the eBay API for all websites should
 *  also prioritise the US"): the US comes round first and about a day sooner on every rotation. */
export const US_HEAD_START_DAYS = 1;

/** Which (figure, region) pairs to search today: pairs where stores sell the
 *  figure, never-checked first, then oldest check (the US's a day older), then
 *  the US before other regions, then most stores. */
export function planEbay(figures: Figure[], checked: Record<string, string>, regions: RegionCode[], budget: number): { f: Figure; region: RegionCode }[] {
  const pairs: { f: Figure; region: RegionCode; at: string; n: number }[] = [];
  const older = (day: string) => new Date(Date.parse(`${day.slice(0, 10)}T00:00:00Z`) - US_HEAD_START_DAYS * 86_400_000).toISOString().slice(0, 10);
  for (const f of figures) {
    for (const region of regions) {
      const offers = f.offers[region];
      if (!offers?.length) continue;
      const at = checked[`${f.jan}:${region}`] ?? "";
      pairs.push({ f, region, at: region === "US" && at && !Number.isNaN(Date.parse(at.slice(0, 10))) ? older(at) : at, n: offers.length });
    }
  }
  return pairs
    .sort((a, b) => a.at.localeCompare(b.at) || Number(b.region === "US") - Number(a.region === "US") || b.n - a.n || a.f.jan.localeCompare(b.f.jan))
    .slice(0, Math.max(0, budget))
    .map(({ f, region }) => ({ f, region }));
}
