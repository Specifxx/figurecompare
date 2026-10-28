// Reads a Shopify store's figure collections through the public products.json:
// 250 products a page, stopping at the first short page. Only titles of a line
// we cover go further. The barcode comes from the SKU or a "JAN:" line in the
// description; the list API has no barcode field, so otherwise it is looked up
// in /products/<handle>.json (barcode filled at 79 of 88 stores in the
// 2026-10-28 probe), cached by product id + updated_at in
// data/state/barcodes.json and capped per run. About a request a second:
// Shopify answers 429 to a runner going faster.
import { REGION_BY_CODE } from "@/site";
import type { Store } from "@/content/stores";
import { janOf } from "../jan";
import { readTitle } from "../title";
import type { Listing, Stock } from "../types";
import { fetchJson, sleep } from "./http";

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  sku?: string | null;
  barcode?: string | null;
}
export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html?: string | null;
  updated_at?: string;
  tags: string[] | string;
  product_type?: string;
  images?: { src: string }[];
  variants: ShopifyVariant[];
}

export interface ReadResult {
  listings: Listing[];
  seen: number;
  refused: Record<string, number>;
  noJan: number;
}

export type BarcodeCache = Record<string, { at: string; jan: string | null }>;

const MAX_PAGES = 80;
/** Barcode lookups per run, across every store (≈ 40 minutes at one a second
 *  per worker). New products wait for the next run once it is spent. */
export const PRODUCT_LOOKUPS_PER_RUN = 2400;
export const PACE_MS = 1000;
const PREORDER_TAG = /pre-?order|preorder|coming[\s-]?soon/i;

export function stockOf(available: boolean, preorder: boolean): Stock {
  return available ? (preorder ? "pre" : "in") : "out";
}

/** Shopify's CDN resizes on request: a 600 px photo, not the 3000 px original. */
export function sizedImage(src: string | undefined | null, width = 600): string | null {
  if (!src) return null;
  try {
    const u = new URL(src.startsWith("//") ? `https:${src}` : src);
    if (u.hostname === "cdn.shopify.com" || u.pathname.startsWith("/cdn/shop/")) u.searchParams.set("width", String(width));
    return u.toString();
  } catch {
    return null;
  }
}

/** One store product → zero or one listing (the cheapest orderable variant). */
export function listingFromProduct(store: Store, p: ShopifyProduct, cachedJan?: string | null): Listing | { refused: string } | { noJan: true } {
  const info = readTitle(p.title);
  if ("refused" in info) return { refused: info.refused };
  const tags = Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(",");
  const variants = p.variants.filter((v) => Number(v.price) > 0);
  if (!variants.length) return { refused: "no-price" };
  // A variant that names a condition other than new, or a deposit, is never the offer.
  const clean = variants.filter((v) => !/used|pre-?owned|damaged|deposit|b-?grade|box\s*damage/i.test(v.title || ""));
  if (!clean.length) return { refused: "pre-owned" };
  const orderable = clean.filter((v) => v.available);
  const v = (orderable.length ? orderable : clean).slice().sort((a, b) => Number(a.price) - Number(b.price))[0];
  const text = `${p.body_html ?? ""} ${tags.join(" ")}`;
  const jan = janOf({ barcode: v.barcode, sku: v.sku, text }) ?? cachedJan ?? null;
  if (!jan) return { noJan: true };
  const preorder = info.preorder || tags.some((t) => PREORDER_TAG.test(t)) || PREORDER_TAG.test(p.product_type ?? "");
  const minor = REGION_BY_CODE[store.region].currency === "JPY" ? 1 : 100;
  return {
    store: store.id,
    region: store.region,
    title: p.title,
    jan,
    cents: Math.round(Number(v.price) * minor),
    st: stockOf(v.available, preorder),
    url: `${store.base}/products/${p.handle}`,
    img: sizedImage(p.images?.[0]?.src),
  };
}

/** The currency the storefront charges for the region's country (cart.js). A
 *  store that answers in another currency is skipped for the run: prices are
 *  never converted. */
export async function shopifyCurrency(store: Store): Promise<string | null> {
  const c = REGION_BY_CODE[store.region].shopifyCountry;
  for (const path of ["/cart.js", "/meta.json"]) {
    try {
      const d = await fetchJson<{ currency?: string }>(`${store.base}${path}?country=${c}`, {}, 1);
      if (d.currency) return d.currency;
    } catch {}
  }
  return null;
}

// Collections worth reading, best first: a line's own collection, then Good
// Smile / Max Factory, then broad anime-figure ones.
const LINE_COLLECTION = /nendoroid|figma|pop-?up-?parade|good-?smile|max-?factory/i;
const ANIME_COLLECTION = /anime[-_]?(figur|action|statue)|figur[a-z]*[-_]anime|non-scale/i;
const NOT_FIGURES = /doll|more|plush|parts|stand|keychain|funko|pop-vinyl|vinyl/i;

/** Pick the collections to read from a store's /collections.json handles. */
export function pickCollections(handles: string[], fallback: string[] = []): string[] {
  const line = handles.filter((h) => LINE_COLLECTION.test(h) && !NOT_FIGURES.test(h.replace(/pop-?up-?parade/i, "")));
  const anime = handles.filter((h) => ANIME_COLLECTION.test(h) && !line.includes(h));
  const picked = [...line, ...anime].slice(0, 6);
  return picked.length ? picked : fallback;
}

async function storeCollections(store: Store): Promise<string[]> {
  const handles: string[] = [];
  try {
    for (let page = 1; page <= 4; page++) {
      const d = await fetchJson<{ collections: { handle: string; products_count?: number }[] }>(`${store.base}/collections.json?limit=250&page=${page}`, {}, 2);
      handles.push(...d.collections.filter((c) => c.products_count == null || c.products_count > 0).map((c) => c.handle));
      if (d.collections.length < 250) break;
      await sleep(PACE_MS);
    }
  } catch {}
  return pickCollections(handles, store.collections ?? []);
}

export async function readShopify(store: Store, cache: BarcodeCache, budget: { lookups: number }): Promise<ReadResult> {
  const country = REGION_BY_CODE[store.region].shopifyCountry;
  const res: ReadResult = { listings: [], seen: 0, refused: {}, noJan: 0 };
  const seen = new Set<number>();
  const collections = await storeCollections(store);
  if (!collections.length) throw new Error("no figure collection found");
  const paths = collections.map((c) => `/collections/${c}/products.json`);
  for (const path of paths) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const data = await fetchJson<{ products: ShopifyProduct[] }>(`${store.base}${path}?limit=250&page=${page}&country=${country}`);
      for (const p of data.products) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        res.seen++;
        const key = `${store.id}:${p.id}`;
        const hit = cache[key] && cache[key].at === (p.updated_at ?? "") ? cache[key].jan : undefined;
        let r = listingFromProduct(store, p, hit);
        if ("noJan" in r && hit === undefined && budget.lookups > 0) {
          budget.lookups--;
          const jan = await productJsonJan(store, p).catch(() => undefined);
          // A failed lookup is not cached: it is tried again next run.
          if (jan !== undefined) cache[key] = { at: p.updated_at ?? "", jan };
          await sleep(PACE_MS);
          r = listingFromProduct(store, p, jan ?? null);
        }
        if ("refused" in r) res.refused[r.refused] = (res.refused[r.refused] ?? 0) + 1;
        else if ("noJan" in r) res.noJan++;
        else res.listings.push(r);
      }
      if (data.products.length < 250) break;
      await sleep(PACE_MS);
    }
  }
  return res;
}

async function productJsonJan(store: Store, p: ShopifyProduct): Promise<string | null> {
  const d = await fetchJson<{ product: ShopifyProduct }>(`${store.base}/products/${p.handle}.json`, {}, 2);
  for (const v of d.product.variants) {
    const jan = janOf({ barcode: v.barcode, sku: v.sku });
    if (jan) return jan;
  }
  return null;
}
