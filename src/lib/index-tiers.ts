// Which figure pages ask to be indexed (and go in the sitemap). Family lesson
// (seo-split-pages, index tiers on MTG/Dex Compare): thin pages dilute a new
// domain, so a page earns its place by being worth landing on.
//   indexed: some region has 2+ stores AND someone can order it today
//   noindex, follow: everything sold out everywhere (the page stays for visitors)
import { SITE } from "@/site";
import type { Figure } from "./types";

export function isIndexable(f: Figure): boolean {
  const orderable = Object.values(f.offers).some((o) => o?.some((x) => x.st !== "out"));
  const compared = Object.values(f.offers).some((o) => (o?.length ?? 0) >= SITE.minStoresPerRegion);
  return orderable && compared;
}

/** Figure pages the sitemap lists (SEO audit 2026-11-07, DECISIONS.md "The sitemap lists a lean core"). */
export const SITEMAP_FIGURES = 300;

/** The sitemap's figures: indexable, the most widely stocked first (stores stock what sells). Every other
 *  indexable figure stays live and linked from its line, series and the lists; only the sitemap leaves it out. */
export function sitemapFigures(all: Figure[]): Figure[] {
  const stores = (f: Figure) => Object.values(f.offers).reduce((n, o) => n + (o?.length ?? 0), 0);
  return all
    .filter(isIndexable)
    .sort((a, b) => stores(b) - stores(a) || a.slug.localeCompare(b.slug))
    .slice(0, SITEMAP_FIGURES);
}
