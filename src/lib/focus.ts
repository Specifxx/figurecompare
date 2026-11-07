// What FigureCompare lists (the low-traction cull, owner 2026-11-07: "any products that are not trendy, or very low traction or
// conversion, we probably want to get rid of", as Compare Empire's focus cull did). DECISIONS.md, 2026-11-07.
//
// The merge (lib/merge.ts) gives a figure a page when two stores in a region (a local store and a Japan store count together)
// list it, sold out or not. On 2026-11-07 that was 4,663 figures, 27,376 of 46,610 offers sold out; Search Console (56 days) put 2
// figure pages over a click or 10 impressions. A figure is listed when the same rule holds counting only stores that can sell it
// today (in stock or on pre-order), or when Search Console shows people finding its page. ≈4,660 → 2,880.
//
// Applied by scripts/import.ts after the merge, so figures.json, every prerendered page, search, the sitemap and the eBay pass see
// only listed figures; history.json keeps every figure, and slugs are kept forever, so a figure that qualifies again returns at the
// same URL with its chart. The site is fully static (no function to redirect from), so a culled figure's page is simply gone (404).
// PURE (tests/focus.test.ts).
import type { Figure } from "./types";

export const DEMAND_MIN_IMPRESSIONS = 10;

/** Figure slugs with real search demand, from the `demand` branch's gsc-pages.json (paths like /figure/<slug>). */
export function demandSlugs(pages: Record<string, number[]>): Set<string> {
  const out = new Set<string>();
  for (const [path, [clicks = 0, impressions = 0]] of Object.entries(pages)) {
    const m = /^\/figure\/([^/]+)$/.exec(path);
    if (m && (clicks > 0 || impressions >= DEMAND_MIN_IMPRESSIONS)) out.add(decodeURIComponent(m[1]));
  }
  return out;
}

/** Two stores that can sell it today in one region, a Japan store counting with any local region's. */
export function sellableCompared(f: Pick<Figure, "offers">, min = 2): boolean {
  const live = (r: string) => new Set((f.offers[r as keyof Figure["offers"]] ?? []).filter((o) => o.st !== "out").map((o) => o.s)).size;
  const jp = live("JP");
  return Object.keys(f.offers).some((r) => r !== "JP" && live(r) + jp >= min);
}

export function focusCatalog<T extends Pick<Figure, "slug" | "offers">>(figures: readonly T[], demand: ReadonlySet<string>): T[] {
  return figures.filter((f) => demand.has(f.slug) || sellableCompared(f));
}
