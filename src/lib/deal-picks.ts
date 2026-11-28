// The deals card's products (components/DealsPopup.tsx; owner, 2026-11-28: "for … Compare Empire, KaeYoung, ScentCompare with
// Black Friday, can we have some eBay or Amazon pop-ups … with actual products"). Computed once per region at build and served
// as one static file per region (/deal-picks/<region>, force-static), like the ad block's tiles (lib/side-rails.ts):
//
//   • Amazon first: products of OUR catalogue (Amazon's exception for pop-ups promoting "Products closely associated with the
//     materials on your Site") whose Amazon listing the build priced (lib/amazon-live.ts, under 24 hours old), Amazon's own
//     deal badge or saving first, then the most-stocked. Each carries its price's time; the browser drops it after 24 hours
//     and drops the badge after Amazon's own deal end, as the product page's Amazon row does. A link to that item only (/dp/),
//     never a deals or category page.
//   • eBay to fill: the daily import's live Buy It Now matches (a photo and a delivered price), most-stocked first.
//   • Nothing is invented: no "was" price, no saving of ours, no countdown. Server-only: reads data/ at build.
import type { RegionCode } from "@/site";
import { amazonItemUrl, ebayAffiliateUrl, subId } from "./affiliate";
import { AMAZON_CLOCK, amazonLive } from "./amazon-live";
import { getEbay, popularIn } from "./data";
import { money } from "./format";

export const MAX_PICKS = 4;
export const MIN_PICKS = 2;

export interface DealPick {
  id: string;
  brand: "amazon" | "ebay";
  name: string;
  img: string;
  price: string;
  href: string;
  /** Amazon only: when the price was fetched (ISO), Amazon's own deal badge or saving, and when that deal ends */
  at?: string;
  deal?: string;
  off?: number;
  until?: string;
}

export interface DealPicks {
  region: RegionCode;
  picks: DealPick[];
  /** the region's clock for Amazon's "as of" time */
  clock: { timeZone: string; label: string } | null;
}

const cache = new Map<RegionCode, DealPicks>();

export function dealPicksFor(region: RegionCode): DealPicks {
  const hit = cache.get(region);
  if (hit) return hit;
  const popular = popularIn(region, 600);
  const amazon: (DealPick & { score: number })[] = [];
  for (const [i, f] of popular.entries()) {
    if (!f.img) continue;
    const a = amazonLive(f.jan, region) as (ReturnType<typeof amazonLive> & { deal?: string; off?: number; until?: string }) | null;
    if (!a) continue;
    const href = amazonItemUrl(a.asin, region, subId(region, "deals-popup-amazon", f.jan));
    if (!href) continue;
    amazon.push({
      id: f.jan, brand: "amazon", name: f.name, img: f.img, price: money(a.p, region), href, at: a.at,
      ...(a.deal ? { deal: a.deal } : {}), ...(a.off ? { off: a.off } : {}), ...(a.until ? { until: a.until } : {}),
      score: (a.deal || a.off ? 0 : 10_000) + i,
    });
  }
  amazon.sort((x, y) => x.score - y.score);
  const picks: DealPick[] = amazon.slice(0, 3).map(({ score: _s, ...p }) => p);
  const ebay = getEbay();
  const ebayRegion: RegionCode = region === "NZ" ? "AU" : region;
  for (const f of region === "NZ" ? popularIn("AU", 600) : popular) {
    if (picks.length >= MAX_PICKS) break;
    if (picks.some((p) => p.id === f.jan)) continue;
    const e = ebay[f.jan]?.[ebayRegion];
    if (!e?.img || e.p == null) continue;
    picks.push({ id: f.jan, brand: "ebay", name: f.name, img: e.img, price: money(e.p, ebayRegion), href: ebayAffiliateUrl(e.u, subId(region, "deals-popup-ebay", f.jan)) });
  }
  const out: DealPicks = { region, picks: picks.length >= MIN_PICKS ? picks : [], clock: AMAZON_CLOCK[region] ?? null };
  cache.set(region, out);
  return out;
}
