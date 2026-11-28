// The deals card's products for one region (lib/deal-picks.ts): one static JSON per region and release (force-static, every
// region prerendered), fetched by components/DealsPopup.tsx after hydration.
import { REGIONS } from "@/site";
import { dealPicksFor } from "@/lib/deal-picks";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.code.toLowerCase() }));
}

export function GET(_req: Request, { params }: { params: { region: string } }) {
  const r = REGIONS.find((x) => x.code.toLowerCase() === params.region);
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(dealPicksFor(r.code)), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
