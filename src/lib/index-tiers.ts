// Which figure pages ask to be indexed (and go in the sitemap). Family lesson
// (seo-split-pages, index tiers on MTG/Dex Compare): thin pages dilute a new
// domain, so a page earns its place by being worth landing on.
//   indexed: some region has 2+ stores AND someone can order it today
//   noindex, follow: everything sold out everywhere (the page stays for visitors)
import { SITE } from "@/site";
import { dayToDate } from "./history";
import type { Figure, History } from "./types";

export function isIndexable(f: Figure): boolean {
  const orderable = Object.values(f.offers).some((o) => o?.some((x) => x.st !== "out"));
  const compared = Object.values(f.offers).some((o) => (o?.length ?? 0) >= SITE.minStoresPerRegion);
  return orderable && compared;
}

/** Figure pages the sitemap lists (SEO audit 2026-11-07, DECISIONS.md "The sitemap lists a lean core"). */
export const SITEMAP_FIGURES = 300;

/** The ranking that fills the core: indexable, the most widely stocked first (stores stock what sells). */
function ranked(all: Figure[]): Figure[] {
  const stores = (f: Figure) => Object.values(f.offers).reduce((n, o) => n + (o?.length ?? 0), 0);
  return all.filter(isIndexable).sort((a, b) => stores(b) - stores(a) || a.slug.localeCompare(b.slug));
}

/** Tomorrow's core (JANs), from today's (DECISIONS.md 2026-11-14, "The sitemap stops churning"). A figure in the core
 *  stays while its page is indexable; only an empty place is filled, by the ranking. Ranking afresh every day swapped
 *  53 of the 300 in one week (7 to 13 November): a URL that leaves the sitemap and returns looks unimportant. PURE. */
export function nextCore(prev: readonly string[], all: Figure[], size = SITEMAP_FIGURES): string[] {
  const ok = new Set(all.filter(isIndexable).map((f) => f.jan));
  const kept = prev.filter((jan, i) => ok.has(jan) && prev.indexOf(jan) === i).slice(0, size);
  const has = new Set(kept);
  for (const f of ranked(all)) {
    if (kept.length >= size) break;
    if (!has.has(f.jan)) kept.push(f.jan);
  }
  return kept;
}

/** The sitemap's figures: the core the import keeps (data/public/pages.json), in its order, minus any page that is no
 *  longer indexable. Without that file (a fixture, a first run) the ranking alone. Every other indexable figure stays
 *  live and linked from its line, series and the lists; only the sitemap leaves it out. */
export function sitemapFigures(all: Figure[], core?: readonly string[] | null): Figure[] {
  if (core?.length) {
    const byJan = new Map(all.map((f) => [f.jan, f]));
    const kept = core.map((jan) => byJan.get(jan)).filter((f): f is Figure => Boolean(f) && isIndexable(f!));
    if (kept.length) return kept.slice(0, SITEMAP_FIGURES);
  }
  return ranked(all).slice(0, SITEMAP_FIGURES);
}

/** The day a figure's page last changed in a way a buyer would notice: the newest change of its lowest orderable price
 *  in any region (history.json records a point only when that price changes), else the day we first saw it. Never later
 *  than `cap` (the import's own day). The sitemap's lastmod: stamping every URL with today's date told Google nothing. */
export function figureLastmod(f: Pick<Figure, "jan" | "first">, history: History, cap: string): string {
  let day = 0;
  for (const series of Object.values(history[f.jan] ?? {})) {
    const last = series?.[series.length - 1];
    if (last && last[0] > day) day = last[0];
  }
  const d = day ? dayToDate(day) : f.first;
  return d && d < cap ? d : cap;
}
