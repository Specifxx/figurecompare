import { LINES, REGIONS, SITE } from "@/site";
import { getFigures } from "@/lib/data";
import { liveSeries } from "@/lib/series";

// /llms.txt (llmstxt.org): a plain map of the site for AI answer engines (SEO audit, 2026-11-03), built at the release
// from the same data as the pages.
export const dynamic = "force-static";

export function GET() {
  const md = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description} ${getFigures().length.toLocaleString("en-US")} figures compared. Prices are each store's own, in its own currency, never converted. Real figure stores only, never open marketplaces.`,
    "",
    "## Main pages",
    ...LINES.map((l) => `- [${l.name} prices](${SITE.url}/${l.key}): ${l.about}`),
    `- [Pre-orders](${SITE.url}/preorders)`,
    `- [Deals](${SITE.url}/deals)`,
    `- [New figures](${SITE.url}/new)`,
    `- [Stores compared](${SITE.url}/stores)`,
    `- [Monthly price report](${SITE.url}/price-report)`,
    `- [How we pick stores](${SITE.url}/how-we-pick-stores)`,
    "",
    "## Figures by series",
    ...liveSeries().map((s) => `- [${s.name} figures](${SITE.url}/series/${s.slug})`),
    "",
    `Regions: ${REGIONS.map((r) => r.name).join(", ")}.`,
    "",
  ].join("\n");
  return new Response(md, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
