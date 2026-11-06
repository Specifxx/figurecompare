// One region's price table. Stores are in price order (orderable first);
// marketplaces (eBay, Amazon) sit pinned above them, drawn exactly like a store
// row (owner, 2026-11-01: "blend in"), labelled, never counted as a store and
// never the "best price" (family rule: paid rows pinned).
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonItemUrl, amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, hljUrl, storePays, storeUrl, subId } from "@/lib/affiliate";
import { getFx, storeName } from "@/lib/data";
import { convertYen } from "@/lib/fx";
import { AMAZON_CLOCK, amazonLive } from "@/lib/amazon-live";
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
export function priceRows(f: Figure, region: RegionCode, ebay?: EbayPick, placement = "table", view?: RegionCode): RowsData {
  const offers = f.offers[region] ?? [];
  const r = REGION_BY_CODE[region];
  const best = offers.find((o) => o.st !== "out");
  const q = searchQuery(f);
  const sub = subId(region, `${placement}_pinned`, f.jan);
  const ebayUrl = ebay ? ebayAffiliateUrl(ebay.u, sub) : ebaySearchUrl(q, region, sub);
  // Amazon's own listing and price when this build's Creators API lookup matched the JAN (2026-11-05), else a search.
  // The quick view carries the same tagged link (owner, 2026-11-06: a visitor-opened view of this one figure is the
  // Associates policy's "pop-up windows in conjunction with your Site promoting Products closely associated with the
  // materials on your Site"), but never Amazon's price: that stays on the figure page (24-hour licence, CLAUDE.md).
  const found = amazonLive(f.jan, region);
  const liveUrl = found && amazonItemUrl(found.asin, region, sub);
  const live = placement.startsWith("quickview") ? null : found;
  const amazonUrl = liveUrl ?? amazonSearchUrl(q, region, sub);
  const clock = AMAZON_CLOCK[region];
  // HobbyLink Japan ships worldwide from Japan: shown with the Japan table.
  // When HobbyLink Japan is one of the stores, its own row replaces the search.
  const hlj = region === "JP" && !offers.some((o) => o.s === "hlj") ? hljUrl(f.jan) : null;
  // The Japan table under another region: yen converted at the day's rate, the yen price beside it (lib/fx.ts).
  const convert = region === "JP" && view && view !== "JP" ? view : null;
  const fx = convert ? getFx() : null;
  const shown = (p: number) => {
    const c = convert ? convertYen(p, convert, fx) : null;
    return c == null ? money(p, region) : `≈ ${money(c, convert!)}`;
  };
  const pinned: RowData[] = [];
  if (ebayUrl)
    pinned.push({
      name: "eBay",
      sub: ebay ? `${ebay.sh ? "incl. postage" : "free postage"}, ${vsBest(ebay.p, best?.p)}` : `New listings on ${ebayShopHost(region)?.replace("www.", "")}`,
      price: ebay ? money(ebay.p, region) : null,
      // Like a store row (owner, 2026-11-06): a Buy It Now listing is in stock, with thumbs and the cart list.
      status: ebay ? "in" : null,
      href: ebayUrl,
      paid: true,
      pin: "ebay",
      vote: ebay?.u ?? ebayUrl,
      ...(ebay && region !== "JP" ? { cart: { title: f.name, image: f.img, priceCents: ebay.p, currency: r.currency } } : {}),
      event: { source: "ebay", region, placement: `${placement}_pinned`, jan: f.jan },
    });
  if (amazonUrl)
    pinned.push({
      name: "Amazon",
      sub: liveUrl ? `${r.amazonHost?.replace("www.", "")} · new, this exact JAN · Ad` : `Also check on Amazon · ${r.amazonHost?.replace("www.", "")} · Ad`,
      price: liveUrl && live ? money(live.p, region) : null,
      status: liveUrl && live ? "in" : null,
      href: amazonUrl,
      pin: "amazon",
      vote: amazonUrl,
      ...(liveUrl && live && region !== "JP" ? { cart: { title: f.name, image: f.img, priceCents: live.p, currency: r.currency } } : {}),
      live: liveUrl && live && clock ? { at: live.at, timeZone: clock.timeZone, zoneLabel: clock.label } : undefined,
      paid: true,
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
      event: { source: "hlj", region, placement: `${placement}_pinned`, jan: f.jan },
    });
  const stores: RowData[] = offers.map((o) => ({
    name: storeName(o.s),
    sub: convert
      ? [o === best ? "Cheapest in Japan" : null, convertYen(o.p, convert, fx) != null ? `${money(o.p, region)} · ships from Japan` : "ships from Japan"].filter(Boolean).join(" · ")
      : o === best ? "Cheapest store" : null,
    price: shown(o.p),
    status: o.st,
    href: storeUrl(o.s, o.u),
    vote: o.u,
    paid: storePays(o.s),
    highlight: o === best,
    event: { source: o.s, region, placement, jan: f.jan },
    // The cart list (components/cart, owner 2026-11-06): orderable rows in the region's own
    // currency. Never the Japan table (yen has no minor unit, and it is shown converted).
    ...(o.st !== "out" && region !== "JP" ? { cart: { title: f.name, image: f.img, priceCents: o.p, currency: r.currency } } : {}),
  }));
  return { pinned, stores };
}

export function PriceTable({ f, region, ebay, placement = "table", view }: { f: Figure; region: RegionCode; ebay?: EbayPick; placement?: string; view?: RegionCode }) {
  return <PriceRows {...priceRows(f, region, ebay, placement, view)} />;
}
