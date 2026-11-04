// The numbers the blog's market post is written around, computed from the day's figures.json at build (src/app/blog/[slug]/page.tsx).
import { LINES, REGIONS, type LineKey } from "@/site";
import type { Figure } from "./types";

/** The numbers the November 2026 post is written around, from the day's figures.json at build. */
export function marketStats(figures: Figure[]) {
  const median = (xs: number[]) => (xs.length ? xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);
  const regions = REGIONS.filter((r) => r.code !== "JP").map((r) => {
    let listed = 0;
    const stores = new Set<string>();
    const byLine: Partial<Record<LineKey, number[]>> = {};
    const spreads: number[] = [];
    for (const f of figures) {
      const o = f.offers[r.code];
      if (!o?.length) continue;
      listed++;
      const live = o.filter((x) => x.st !== "out");
      for (const x of live) stores.add(x.s);
      if (!live.length) continue;
      const best = Math.min(...live.map((x) => x.p));
      (byLine[f.line] ??= []).push(best);
      if (live.length >= 3) spreads.push(Math.max(...live.map((x) => x.p)) / best);
    }
    return { r, listed, stores: stores.size, median: Object.fromEntries(LINES.map((l) => [l.key, median(byLine[l.key] ?? [])])) as Record<LineKey, number | null>, spread: median(spreads), spreadN: spreads.length };
  });
  const perLine = Object.fromEntries(LINES.map((l) => [l.key, figures.filter((f) => f.line === l.key).length])) as Record<LineKey, number>;
  const nums = figures.filter((f) => f.line === "nendoroid" && f.number && /^\d+$/.test(f.number)).map((f) => Number(f.number));
  const over3000 = nums.filter((n) => n >= 3000).length;
  const maxNum = nums.length ? Math.max(...nums) : null;
  const stocked = figures
    .map((f) => ({ f, n: Object.values(f.offers).reduce((a, o) => a + (o ? o.filter((x) => x.st !== "out").length : 0), 0) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const allStores = new Set<string>();
  for (const f of figures) for (const o of Object.values(f.offers)) for (const x of o ?? []) allStores.add(x.s);
  return { regions, perLine, over3000, maxNum, stocked, total: figures.length, stores: allStores.size };
}

