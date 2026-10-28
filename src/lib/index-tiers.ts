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
