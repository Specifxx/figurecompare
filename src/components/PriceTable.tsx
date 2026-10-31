// One region's price table. Stores are in price order (orderable first);
// marketplaces (eBay, Amazon) sit pinned above them, labelled, never counted
// as a store and never the "best price" (family rule: paid rows pinned).
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, hljUrl, storePays, storeUrl, subId } from "@/lib/affiliate";
import { storeName } from "@/lib/data";
import { money } from "@/lib/format";
import type { EbayPick, Figure } from "@/lib/types";
import { PriceRows, type RowData, type RowsData } from "./PriceRows";

export function searchQuery(f: Figure): string {
  return f.name.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

/** How an eBay price compares with the cheapest store: never re-ranked, just said. */
function vsBest(p: number, bestP: number | undefined): string {
  if (bestP == null) return "new, Buy It Now";
  if (p < bestP) return "cheaper than every store";
  if (p === bestP) return "same as the cheapest store";
  return `+${Math.round(((p - bestP) / bestP) * 100)}% vs cheapest store`;
}

/** One region's rows: eBay first, Amazon second (then HobbyLink Japan on the
 *  Japan table), then the stores in price order. Plain data, so the quick view
 *  (/q/<slug>) draws the same rows as the figure page. */
export function priceRows(f: Figure, region: RegionCode, ebay?: EbayPick, placement = "table"): RowsData {
  const offers = f.offers[region] ?? [];
  const r = REGION_BY_CODE[region];
  const best = offers.find((o) => o.st !== "out");
  const q = searchQuery(f);
  const sub = subId(region, `${placement}_pinned`, f.jan);
  const ebayUrl = ebay ? ebayAffiliateUrl(ebay.u, sub) : ebaySearchUrl(q, region, sub);
  const amazonUrl = amazonSearchUrl(q, region, sub);
  // HobbyLink Japan ships worldwide from Japan: shown with the Japan table.
  const hlj = region === "JP" ? hljUrl(f.jan) : null;
  const pinned: RowData[] = [];
  if (ebayUrl)
    pinned.push({
      name: ebay ? "eBay" : "Search eBay",
      sub: ebay ? `${ebay.sh ? "incl. postage" : "free postage"}, ${vsBest(ebay.p, best?.p)}` : `New listings on ${ebayShopHost(region)?.replace("www.", "")}`,
      price: ebay ? money(ebay.p, region) : null,
      status: null,
      href: ebayUrl,
      paid: true,
      tint: "bg-lemon-pale",
      event: { source: "ebay", region, placement: `${placement}_pinned`, jan: f.jan },
    });
  if (amazonUrl)
    pinned.push({
      name: "Search Amazon",
      sub: `${r.amazonHost?.replace("www.", "")} · check the seller · Ad`,
      price: null,
      status: null,
      href: amazonUrl,
      paid: true,
      tint: "bg-lemon-pale",
      event: { source: "amazon", region, placement: `${placement}_pinned`, jan: f.jan },
    });
  if (hlj)
    pinned.push({
      name: "HobbyLink Japan",
      sub: "Search by barcode · ships worldwide · Ad",
      price: null,
      status: null,
      href: hlj,
      paid: true,
      tint: "bg-lemon-pale",
      event: { source: "hlj", region, placement: `${placement}_pinned`, jan: f.jan },
    });
  const stores: RowData[] = offers.map((o) => ({
    name: storeName(o.s),
    sub: o === best ? "Cheapest store" : null,
    price: money(o.p, region),
    status: o.st,
    href: storeUrl(o.s, o.u),
    paid: storePays(o.s),
    highlight: o === best,
    event: { source: o.s, region, placement, jan: f.jan },
  }));
  return { pinned, stores };
}

export function PriceTable({ f, region, ebay, placement = "table" }: { f: Figure; region: RegionCode; ebay?: EbayPick; placement?: string }) {
  return <PriceRows {...priceRows(f, region, ebay, placement)} />;
}
