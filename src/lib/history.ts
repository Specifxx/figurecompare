// Price history: the lowest orderable price per figure and region, stored only
// when it changes, as [day number, price] pairs, and trimmed to a year. A
// figure that fell out of the catalogue keeps its history for when it returns.
import type { RegionCode } from "@/site";
import type { Figure, History, Offer } from "./types";

export const dayNumber = (isoDate: string) => Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);
export const dayToDate = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);
const KEEP_DAYS = 366;

/** The cheapest offer someone can order today (in stock or pre-order). */
export function lowestOrderable(offers: Offer[] | undefined): Offer | null {
  let best: Offer | null = null;
  for (const o of offers ?? []) if (o.st !== "out" && (!best || o.p < best.p)) best = o;
  return best;
}

export function recordHistory(history: History, figures: Figure[], today: string): History {
  const day = dayNumber(today);
  for (const f of figures) {
    const h = (history[f.jan] ??= {});
    for (const [region, offers] of Object.entries(f.offers) as [RegionCode, Offer[]][]) {
      const low = lowestOrderable(offers);
      if (!low) continue;
      const series = (h[region] ??= []);
      const last = series[series.length - 1];
      if (last && last[0] === day) last[1] = low.p;
      else if (!last || last[1] !== low.p) series.push([day, low.p]);
    }
  }
  for (const h of Object.values(history)) {
    for (const [region, series] of Object.entries(h) as [RegionCode, [number, number][]][]) {
      // Keep the last point older than the window so the chart starts at a real price.
      const firstIn = series.findIndex(([d]) => d >= day - KEEP_DAYS);
      if (firstIn > 1) h[region] = series.slice(firstIn - 1);
    }
  }
  return history;
}

/** The price this region showed `days` ago, from the change log. */
export function priceOn(series: [number, number][] | undefined, day: number): number | null {
  if (!series?.length) return null;
  let p: number | null = null;
  for (const [d, v] of series) {
    if (d > day) break;
    p = v;
  }
  return p;
}
