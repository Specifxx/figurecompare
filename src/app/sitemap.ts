import type { MetadataRoute } from "next";
import { LINES, SITE } from "@/site";
import { getFigures, getMeta } from "@/lib/data";
import { sitemapFigures } from "@/lib/index-tiers";
import { liveSeries } from "@/lib/series";
import { POSTS } from "@/content/blog";

// A lean core (SEO audit 2026-11-07, src/lib/index-tiers.ts sitemapFigures): hubs, series, guides and
// the SITEMAP_FIGURES most widely stocked indexable figures. Every other figure and line page 2+ stays
// live, indexable and linked; it just isn't advertised. Sold-out figures stay reachable but noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = getMeta()?.updatedAt ?? new Date().toISOString();
  const u = (p: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${p}`, lastModified: updated, priority });
  return [
    u("/", 1),
    ...LINES.map((l) => u(`/${l.key}`, 0.9)),
    u("/series", 0.8),
    ...liveSeries().map((s) => u(`/series/${s.slug}`, 0.8)),
    u("/deals", 0.8),
    u("/black-friday", 0.8),
    ...["/boxing-day", "/january-sales", "/lunar-new-year", "/valentines-day"].map((p) => u(p, 0.7)),
    u("/preorders", 0.8),
    u("/new", 0.7),
    u("/blog", 0.7),
    ...POSTS.map((p) => u(`/blog/${p.slug}`, 0.7)),
    u("/stores", 0.6),
    u("/widgets", 0.4),
    u("/price-report", 0.6),
    u("/about", 0.3),
    u("/creators", 0.4),
    u("/contact", 0.2),
    u("/how-we-pick-stores", 0.3),
    u("/list-your-store", 0.3),
    ...sitemapFigures(getFigures()).map((f) => u(`/figure/${f.slug}`, 0.7)),
  ];
}
