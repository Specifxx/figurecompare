// The quick view's data: one small static JSON per figure, written at build
// (force-static, every slug prerendered), so opening a quick view reads a file
// from the CDN, never a function. Rows come from priceRows(), the same rows the
// figure page draws: eBay first, Amazon second, then the stores by price.
import { REGIONS } from "@/site";
import { getEbay, getFigure, getFigures, regionsOf } from "@/lib/data";
import { priceRows } from "@/components/PriceTable";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return getFigures().map((f) => ({ slug: f.slug }));
}

export function GET(_req: Request, { params }: { params: { slug: string } }) {
  const f = getFigure(params.slug);
  if (!f) return new Response("Not found", { status: 404 });
  const ebay = getEbay()[f.jan] ?? {};
  const sold = new Set(regionsOf(f));
  const rows = Object.fromEntries(REGIONS.filter((r) => r.code !== "JP").map((r) => [r.code, sold.has(r.code) ? priceRows(f, r.code, ebay[r.code], "quickview") : null]));
  const japan = f.offers.JP?.length ? priceRows(f, "JP", undefined, "quickview_japan") : null;
  return Response.json({ slug: f.slug, jan: f.jan, rows, japan, name: f.name, line: f.line, img: f.img });
}
