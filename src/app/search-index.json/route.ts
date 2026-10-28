// The search box's index: one static JSON file per release (built at build
// time, served by the CDN), so search never runs a function.
import { REGIONS } from "@/site";
import { getFigures } from "@/lib/data";
import { lowestOrderable } from "@/lib/history";
import type { IndexRow } from "@/components/SearchBox";

export const dynamic = "force-static";

export function GET() {
  const rows: IndexRow[] = getFigures().map((f) => {
    const prices: IndexRow[4] = {};
    for (const r of REGIONS) {
      const low = lowestOrderable(f.offers[r.code]);
      if (low) prices[r.code] = low.p;
    }
    return [f.slug, f.name, f.line, f.jan, prices];
  });
  return new Response(JSON.stringify(rows), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
