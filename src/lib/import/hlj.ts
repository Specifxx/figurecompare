// Reads HobbyLink Japan (hlj.com), a long-standing Tokyo shop that ships worldwide. Its own platform has no
// product feed or sitemap, but every product page carries schema.org JSON-LD with the barcode (gtin13), the yen
// price and the stock, so it is matched by JAN like every Shopify store. The product list comes from its own
// search pages for each line (robots.txt allows them), and only titles readTitle accepts and HLJ marks
// orderable (in stock, pre-order, back-order) are opened. One request a second, HLJ_PAGES product pages a run.
// A Japan store (region JP, prices in yen): pages show it converted, under "Or import from Japan" (lib/fx.ts).
import type { Store } from "@/content/stores";
import { isJapaneseJan } from "../jan";
import { readTitle } from "../title";
import type { Listing, Stock } from "../types";
import type { ReadResult } from "./shopify";
import { fetchText, sleep } from "./http";

export const HLJ_BASE = "https://www.hlj.com";
export const HLJ_PAGES_PER_RUN = Number(process.env.HLJ_PAGES || 2500);
/** Search result pages per line (24 items a page). */
const MAX_SEARCH_PAGES = 400;
const PACE_MS = 1000;
const QUERIES = ["nendoroid", "figma", "pop up parade"];

export interface HljItem {
  code: string;
  path: string;
  name: string;
  status: string;
}

/** The items on one HLJ search page: code, product path, English name and HLJ's stock word. */
export function parseSearchPage(html: string): HljItem[] {
  const out: HljItem[] = [];
  const names = new Map<string, string>();
  const statuses = new Map<string, string>();
  for (const m of html.matchAll(/id="en_name_([A-Z0-9]+)"[^>]*value="([^"]*)"/g)) names.set(m[1], decode(m[2]));
  for (const m of html.matchAll(/id="item_status_([A-Z0-9]+)"[^>]*value="([^"]*)"/g)) statuses.set(m[1], m[2].toLowerCase());
  const seen = new Set<string>();
  for (const m of html.matchAll(/class="item-img-wrapper"\s+href="(\/[a-z0-9-]+-([a-z]{2,6}\d{3,7}))"/gi)) {
    const code = m[2].toUpperCase();
    if (seen.has(code) || !names.has(code)) continue;
    seen.add(code);
    out.push({ code, path: m[1], name: names.get(code)!, status: statuses.get(code) ?? "" });
  }
  return out;
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** HLJ's stock words that can be ordered today. */
export function orderableStatus(status: string): boolean {
  return /instock|in stock|preorder|pre-order|backorder|back-order|future/i.test(status);
}

export interface HljPage {
  name: string;
  jan: string | null;
  yen: number;
  st: Stock;
  img: string | null;
}

/** The product JSON-LD on an HLJ product page, or null when the page has none. */
export function parseProductPage(html: string): HljPage | null {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]) as { "@type"?: string; name?: string; gtin13?: string; image?: string; offers?: unknown };
      if (j["@type"] !== "Product" || !j.name) continue;
      const o = (Array.isArray(j.offers) ? j.offers[0] : j.offers) as { price?: string | number; priceCurrency?: string; availability?: string; itemCondition?: string } | undefined;
      if (!o || o.priceCurrency !== "JPY") return null;
      if (o.itemCondition && !/NewCondition/.test(o.itemCondition)) return null;
      const yen = Math.round(Number(o.price));
      if (!(yen > 0)) return null;
      const a = o.availability ?? "";
      const st: Stock = /InStock|LimitedAvailability/.test(a) ? "in" : /PreOrder|PreSale|BackOrder/.test(a) ? "pre" : "out";
      const jan = j.gtin13 && isJapaneseJan(String(j.gtin13)) ? String(j.gtin13) : null;
      return { name: decode(j.name), jan, yen, st, img: typeof j.image === "string" ? j.image : null };
    } catch {
      /* not this script */
    }
  }
  return null;
}

export async function readHlj(store: Store, pages = HLJ_PAGES_PER_RUN): Promise<ReadResult> {
  const res: ReadResult = { listings: [], seen: 0, refused: {}, noJan: 0 };
  const items = new Map<string, HljItem>();
  for (const q of QUERIES) {
    for (let page = 1; page <= MAX_SEARCH_PAGES; page++) {
      const found = parseSearchPage(await fetchText(`${store.base}/search/?q=${encodeURIComponent(q)}&page=${page}`));
      for (const it of found) items.set(it.code, it);
      await sleep(PACE_MS);
      if (found.length < 24) break;
    }
  }
  const refuse = (why: string) => (res.refused[why] = (res.refused[why] ?? 0) + 1);
  const todo: HljItem[] = [];
  for (const it of items.values()) {
    res.seen++;
    const t = readTitle(it.name);
    if ("refused" in t) refuse(t.refused);
    else if (!orderableStatus(it.status)) refuse("not-orderable");
    else todo.push(it);
  }
  for (const it of todo.slice(0, pages)) {
    let page: HljPage | null;
    try {
      page = parseProductPage(await fetchText(`${store.base}${it.path}`));
    } catch (e) {
      if (/HTTP (403|429)/.test((e as Error).message)) throw e;
      refuse("unreadable");
      await sleep(PACE_MS);
      continue;
    }
    await sleep(PACE_MS);
    if (!page) refuse("no-data");
    else if (!page.jan) res.noJan++;
    else {
      const t = readTitle(page.name);
      if ("refused" in t) refuse(t.refused);
      else res.listings.push(listingOf(store, it, page));
    }
  }
  return res;
}

export function listingOf(store: Store, it: HljItem, page: HljPage): Listing {
  return { store: store.id, region: store.region, title: page.name, jan: page.jan!, cents: page.yen, st: page.st, url: `${store.base}${it.path}`, img: page.img };
}
