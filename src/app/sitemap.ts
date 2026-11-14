import type { MetadataRoute } from "next";
import { LINES, SITE } from "@/site";
import { getFigures, getHistory, getMeta, getPageState } from "@/lib/data";
import { figureLastmod, sitemapFigures } from "@/lib/index-tiers";
import { figuresOfSeries, liveSeries } from "@/lib/series";
import { figuresOfCharacter, liveCharacters } from "@/lib/characters";
import type { Figure } from "@/lib/types";
import { POSTS } from "@/content/blog";

// A lean core (SEO audit 2026-11-07, src/lib/index-tiers.ts sitemapFigures): hubs, series, guides and
// the SITEMAP_FIGURES core figures. Every other figure and line page 2+ stays live, indexable and linked;
// it just isn't advertised. Sold-out figures stay reachable but noindex.
//
// lastmod is the truth or it is left out (DECISIONS.md 2026-11-14): a figure, series or character page carries
// the day one of its prices last changed, a blog post its publication date, the lists that are rebuilt from the
// day's prices the import's time, and a page of fixed text none.
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = getMeta()?.updatedAt ?? new Date().toISOString();
  const day = updated.slice(0, 10);
  const history = getHistory();
  const figureDay = (f: Figure) => figureLastmod(f, history, day);
  const newest = (fs: Figure[]) => fs.reduce((d, f) => (figureDay(f) > d ? figureDay(f) : d), "") || undefined;
  const u = (p: string, priority: number, lastModified: string | undefined = updated): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${p}`, lastModified, priority });
  const fixed = (p: string, priority: number) => u(p, priority, "");
  return [
    u("/", 1),
    ...LINES.map((l) => u(`/${l.key}`, 0.9)),
    u("/series", 0.8),
    ...liveSeries().map((s) => u(`/series/${s.slug}`, 0.8, newest(figuresOfSeries(s.slug)))),
    // Character hubs (src/content/characters.ts): only characters with CHARACTER_MIN+ figures have a page.
    u("/characters", 0.7),
    ...liveCharacters().map((c) => u(`/character/${c.slug}`, 0.7, newest(figuresOfCharacter(c.slug)))),
    u("/deals", 0.8),
    u("/black-friday", 0.8),
    u("/cyber-monday", 0.8),
    ...["/boxing-day", "/january-sales", "/lunar-new-year", "/valentines-day"].map((p) => u(p, 0.7)),
    u("/preorders", 0.8),
    u("/new", 0.7),
    u("/blog", 0.7, POSTS.map((p) => p.date).sort().pop()),
    ...POSTS.map((p) => u(`/blog/${p.slug}`, 0.7, p.date)),
    u("/stores", 0.6),
    fixed("/widgets", 0.4),
    u("/price-report", 0.6),
    fixed("/is-this-a-good-price", 0.6),
    fixed("/about", 0.3),
    fixed("/creators", 0.4),
    fixed("/contact", 0.2),
    fixed("/how-we-pick-stores", 0.3),
    fixed("/list-your-store", 0.3),
    ...sitemapFigures(getFigures(), getPageState()?.core).map((f) => u(`/figure/${f.slug}`, 0.7, figureDay(f))),
  ].map(({ lastModified, ...rest }) => (lastModified ? { ...rest, lastModified } : rest));
}
