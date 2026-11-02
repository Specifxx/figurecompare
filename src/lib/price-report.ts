// The self-updating monthly price report (DECISIONS.md, "Self-updating price report", 2026-11-02): the page outreach
// offers writers to quote, rebuilt from the day's prices at each daily build, so nobody writes it. Pure:
// tests/price-report.test.ts.
export interface ReportOffer { s: string; p: number; st: "in" | "pre" | "out" }
export interface ReportItem { offers: Partial<Record<string, ReportOffer[]>> }

export interface RegionStats {
  /** Stores with something orderable (in stock or pre-order). */
  stores: number;
  /** Items someone can order there today. */
  orderable: number;
  /** Items two or more stores sell, the ones a comparison can say something about. */
  compared: number;
  /** Median gap between the cheapest and dearest store, as a share of the dearest (0..1). */
  medianGap: number | null;
  /** Share of compared items where the cheapest store is 10%+ under the dearest. */
  gap10: number | null;
}

export function medianOf(xs: number[]): number | null {
  if (!xs.length) return null;
  const v = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

const orderableOf = (it: ReportItem, region: string) => (it.offers[region] ?? []).filter((o) => o.st !== "out");

export function regionStats(items: ReportItem[], region: string): RegionStats {
  const stores = new Set<string>();
  const gaps: number[] = [];
  let orderable = 0;
  for (const it of items) {
    const open = orderableOf(it, region);
    if (!open.length) continue;
    orderable++;
    for (const o of open) stores.add(o.s);
    if (new Set(open.map((o) => o.s)).size < 2) continue;
    const lo = Math.min(...open.map((o) => o.p));
    const hi = Math.max(...open.map((o) => o.p));
    if (hi > 0) gaps.push((hi - lo) / hi);
  }
  return { stores: stores.size, orderable, compared: gaps.length, medianGap: medianOf(gaps), gap10: gaps.length ? gaps.filter((g) => g >= 0.1).length / gaps.length : null };
}

/** The median of each item's cheapest orderable price in a region: "a typical Nendoroid costs". */
export function typicalPrice(items: ReportItem[], region: string): number | null {
  const lows = items.map((it) => orderableOf(it, region)).filter((o) => o.length).map((o) => Math.min(...o.map((x) => x.p)));
  const m = medianOf(lows);
  return m == null ? null : Math.round(m);
}

/** "November 2026" for the report's title, from the data's own date. */
export function reportMonth(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return (Number.isNaN(d.getTime()) ? new Date() : d).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export const pctText = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`);
