// ─────────────────────────────────────────────────────────────────────────────
// "or US$X on Amazon" under the cheapest store (2026-11-10, ported from RiftCompare's
// lib/paid-alternative.ts, owner 2026-10-27, as on KaeYoung and ScentCompare).
//
// The 30 days to 10 Nov: 27 buy clicks, 11 of them to a link that can earn
// (/mnt/project-files/traffic/zero-earnings-diagnosis-2026-11-10.html). The hero and
// the phone buy bar already carry the eBay button with its price beside the cheapest
// store, so eBay is not repeated here: this line names the cheapest OTHER paid row of
// the same table (Amazon's own listing, a store on a joined programme) when the
// cheapest orderable store is not a paid link and that row is within
// PAID_ALTERNATIVE_BAND of it. Quoted at its real price, labelled "Paid link", never
// called cheaper, never the best price, never a reorder. When the cheapest store
// already pays, nothing is added.
// ─────────────────────────────────────────────────────────────────────────────
import type { RegionCode } from "@/site";
import { amazonItemUrl, storePays, storeUrl, subId } from "./affiliate";
import { amazonLive } from "@/lib/amazon-live";
import { storeName } from "./data";
import { lowestOrderable } from "./history";
import type { Figure } from "./types";

/** At most 20% above the cheapest orderable store price. */
export const PAID_ALTERNATIVE_BAND = 1.2;

export interface PaidCandidate {
  name: string;
  /** minor units */
  p: number;
  href: string;
  /** the click event's source */
  source: string;
  /** Amazon only: when its price was fetched (shown for 24 hours, then hidden) */
  at?: string;
}

/** The cheapest paid candidate within the band, or null when the cheapest store pays or none qualifies. */
export function paidAlternative(cheapest: { p: number; paid: boolean } | null, candidates: PaidCandidate[]): { c: PaidCandidate; pctMore: number } | null {
  if (!cheapest || cheapest.paid || !(cheapest.p > 0)) return null;
  let pick: PaidCandidate | null = null;
  for (const c of candidates) if (c.p > 0 && c.p <= cheapest.p * PAID_ALTERNATIVE_BAND && (!pick || c.p < pick.p)) pick = c;
  return pick ? { c: pick, pctMore: Math.max(0, Math.round(((pick.p - cheapest.p) / cheapest.p) * 100)) } : null;
}

/** The paid alternative to a region's cheapest orderable store, links tagged with `placement` (hero_alt, buybar_alt). */
export function paidAlternativeFor(f: Figure, region: RegionCode, placement: string): { c: PaidCandidate; pctMore: number } | null {
  const offers = f.offers[region] ?? [];
  const low = lowestOrderable(offers);
  if (!low || storePays(low.s)) return null;
  const out: PaidCandidate[] = [];
  const az = amazonLive(f.jan, region);
  const azUrl = az && amazonItemUrl(az.asin, region, subId(region, placement, f.jan));
  if (az && azUrl) out.push({ name: "Amazon", p: az.p, href: azUrl, source: "amazon", at: az.at });
  for (const o of offers) if (o.st !== "out" && o !== low && storePays(o.s)) out.push({ name: storeName(o.s), p: o.p, href: storeUrl(o.s, o.u), source: o.s });
  return paidAlternative({ p: low.p, paid: false }, out);
}
