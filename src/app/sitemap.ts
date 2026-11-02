import type { MetadataRoute } from "next";
import { LINES, SITE } from "@/site";
import { getFigures, getMeta } from "@/lib/data";
import { isIndexable } from "@/lib/index-tiers";
import { pageCount } from "@/components/LineHub";
import { liveSeries } from "@/lib/series";

// Only pages worth landing on (src/lib/index-tiers.ts): hubs, and figures
// someone can order with 2+ stores compared. Sold-out figures stay reachable
// but noindex, and out of here.
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = getMeta()?.updatedAt ?? new Date().toISOString();
  const u = (p: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${p}`, lastModified: updated, priority });
  return [
    u("/", 1),
    ...LINES.map((l) => u(`/${l.key}`, 0.9)),
    ...LINES.flatMap((l) => Array.from({ length: pageCount(l.key) - 1 }, (_, i) => u(`/${l.key}/page/${i + 2}`, 0.4))),
    u("/series", 0.8),
    ...liveSeries().map((s) => u(`/series/${s.slug}`, 0.8)),
    u("/deals", 0.8),
    u("/black-friday", 0.8),
    u("/preorders", 0.8),
    u("/new", 0.7),
    u("/stores", 0.6),
    u("/widgets", 0.4),
    u("/price-report", 0.6),
    u("/about", 0.3),
    u("/contact", 0.2),
    ...getFigures().filter(isIndexable).map((f) => u(`/figure/${f.slug}`, 0.7)),
  ];
}
