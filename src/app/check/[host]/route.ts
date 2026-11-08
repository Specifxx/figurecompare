import { STORES, type Store } from "@/content/stores";
import { getFigures, getMeta } from "@/lib/data";
import { linkPath, medianCents, normaliseHost, variantOf, type CheckOffer, type CheckProduct, type StoreCheck } from "@/lib/link-check";
import { REGION_BY_CODE } from "@/site";

// /check/<host>: one store's listings, for the "Is this a good price?" checker (components/LinkChecker.tsx). The visitor pastes a
// product link; the browser fetches this file for that store's host, with each listed product's cheapest and median in-stock store
// price in the store's region, and finds the pasted listing. One static JSON per store, written at the release's build like every
// page (force-static, every store prerendered, any other host a 404): no function runs and the store is never fetched.
export const dynamic = "force-static";
export const dynamicParams = false;

const hostOf = (s: Store) => normaliseHost(new URL(s.base).hostname);

export function generateStaticParams() {
  return [...new Set(STORES.map(hostOf))].map((host) => ({ host }));
}

export function GET(_req: Request, { params }: { params: { host: string } }) {
  const host = normaliseHost(decodeURIComponent(params.host));
  const stores = STORES.filter((s) => hostOf(s) === host);
  const store = stores[0];
  if (!store) return new Response("Not found", { status: 404 });
  const ids = new Set(stores.map((s) => s.id));
  const offers: CheckOffer[] = [];
  const products: Record<string, CheckProduct> = {};
  for (const f of getFigures()) {
    const list = f.offers[store.region] ?? [];
    const mine = list.filter((o) => ids.has(o.s));
    if (!mine.length) continue;
    const open = list.filter((o) => o.st !== "out");
    const prices = open.map((o) => o.p);
    products[f.slug] = {
      name: f.name,
      href: `/figure/${f.slug}`,
      cheapestCents: prices.length ? Math.min(...prices) : null,
      medianCents: prices.length >= 2 ? medianCents(prices) : null,
      inStockStores: new Set(open.map((o) => o.s)).size,
      listedStores: new Set(list.map((o) => o.s)).size,
    };
    for (const o of mine) {
      let path = "";
      try {
        path = linkPath(new URL(o.u).pathname);
      } catch {
        continue;
      }
      offers.push([path, f.slug, o.p, o.st === "out" ? 0 : 1, variantOf(o.u)]);
    }
  }
  const body: StoreCheck = {
    v: 1,
    store: store.id,
    name: store.name,
    region: store.region,
    currency: REGION_BY_CODE[store.region].currency,
    checkedAt: getMeta()?.updatedAt ?? null,
    offers,
    products,
  };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
