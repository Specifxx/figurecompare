// This site's price feed for RiftCompare's shared alert service (DECISIONS.md,
// "Price alerts through RiftCompare's shared service", 2026-11-02): the static
// file /alert-feed.json (src/app/alert-feed.json/route.ts), prerendered with
// every release from the same figures.json the pages read. The service fetches
// it once a day; its format is pinned at the top of RiftCompare's
// src/lib/sister-alerts/feed.ts.
//
// The price is bestIn() per region, as the page's headline shows it: the
// cheapest orderable (in stock or pre-order) store price, never eBay, Amazon or
// a conversion. Japan (yen, import) is left out. Deals are the deals page's
// (dealsIn: 10%+ spread, best in stock), three per region, without a reference.
import { REGIONS } from "@/site";
import { bestIn, dealsIn, getFigures } from "./data";

export const ALERT_SITE_KEY = "figure";
const ALERT_REGIONS = REGIONS.filter((r) => r.code !== "JP");

export interface AlertFeed {
  v: 1;
  site: string;
  generatedAt: string;
  items: Record<string, { n: string; u: string; p: Record<string, number> }>;
  deals: { n: string; u: string; r: string; p: number }[];
}

/** Every alert region's headline price for one figure (the page's form reads the visitor's). */
export function alertPrices(f: Parameters<typeof bestIn>[0]): Record<string, number> {
  const p: Record<string, number> = {};
  for (const r of ALERT_REGIONS) {
    const b = bestIn(f, r.code);
    if (b && b.offer.p > 0) p[r.code] = b.offer.p;
  }
  return p;
}

export function buildAlertFeed(now = new Date()): AlertFeed {
  const items: AlertFeed["items"] = {};
  for (const f of getFigures()) {
    const p = alertPrices(f);
    if (Object.keys(p).length) items[f.jan] = { n: f.name, u: `/figure/${f.slug}`, p };
  }
  const deals: AlertFeed["deals"] = [];
  for (const r of ALERT_REGIONS) for (const d of dealsIn(r.code, 3)) deals.push({ n: d.f.name, u: `/figure/${d.f.slug}`, r: r.code, p: d.best.offer.p });
  return { v: 1, site: ALERT_SITE_KEY, generatedAt: now.toISOString(), items, deals };
}
