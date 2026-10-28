// Reads a WooCommerce store through its public Store API
// (/wp-json/wc/store/v1/products), searching for each line we cover. Woo has no
// barcode field, so the JAN must be the SKU or a "JAN:" line in the description.
import { REGION_BY_CODE } from "@/site";
import type { Store } from "@/content/stores";
import { janOf } from "../jan";
import { readTitle } from "../title";
import type { Listing } from "../types";
import { fetchJson, sleep } from "./http";
import { sizedImage, stockOf, type ReadResult } from "./shopify";

export interface WooProduct {
  id: number;
  name: string;
  permalink: string;
  sku?: string;
  description?: string;
  short_description?: string;
  is_in_stock: boolean;
  is_purchasable?: boolean;
  prices: { price: string; currency_code: string; currency_minor_unit: number };
  images?: { src: string }[];
  tags?: { name: string }[];
}

const decode = (s: string) =>
  s.replace(/&#8211;|&ndash;/g, "–").replace(/&#8217;|&rsquo;/g, "’").replace(/&amp;/g, "&").replace(/&quot;|&#8220;|&#8221;/g, '"').replace(/&#0?39;/g, "'");

export function listingFromWoo(store: Store, p: WooProduct): Listing | { refused: string } | { noJan: true } {
  const title = decode(p.name);
  const info = readTitle(title);
  if ("refused" in info) return { refused: info.refused };
  const region = REGION_BY_CODE[store.region];
  if (p.prices.currency_code !== region.currency) return { refused: "currency" };
  const raw = Number(p.prices.price);
  if (!(raw > 0)) return { refused: "no-price" };
  const jan = janOf({ sku: p.sku, text: `${p.description ?? ""} ${p.short_description ?? ""}` });
  if (!jan) return { noJan: true };
  // Store API prices are in the currency's minor unit already.
  const minorUnit = p.prices.currency_minor_unit;
  const cents = region.currency === "JPY" ? Math.round(raw / 10 ** minorUnit) : Math.round((raw / 10 ** minorUnit) * 100);
  const preorder = info.preorder || (p.tags ?? []).some((t) => /pre-?order/i.test(t.name));
  return {
    store: store.id,
    region: store.region,
    title,
    jan,
    cents,
    st: stockOf(p.is_in_stock && p.is_purchasable !== false, preorder),
    url: p.permalink,
    img: sizedImage(p.images?.[0]?.src),
  };
}

export async function readWoo(store: Store): Promise<ReadResult> {
  const res: ReadResult = { listings: [], seen: 0, refused: {}, noJan: 0 };
  const seen = new Set<number>();
  for (const term of store.search ?? ["nendoroid", "figma", "pop up parade"]) {
    for (let page = 1; page <= 40; page++) {
      const list = await fetchJson<WooProduct[]>(`${store.base}/wp-json/wc/store/v1/products?per_page=100&page=${page}&search=${encodeURIComponent(term)}`);
      for (const p of list) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        res.seen++;
        const r = listingFromWoo(store, p);
        if ("refused" in r) res.refused[r.refused] = (res.refused[r.refused] ?? 0) + 1;
        else if ("noJan" in r) res.noJan++;
        else res.listings.push(r);
      }
      if (list.length < 100) break;
      await sleep(900);
    }
  }
  return res;
}
