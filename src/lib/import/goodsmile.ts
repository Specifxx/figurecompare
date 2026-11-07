// Reads Good Smile Company's own global shop (goodsmile.com/en), which reopened on 2026-11-06 after its October
// outage (Reddit, r/Nendoroid, 2026-11-07: "curious why GoodSmile Global … aren't compared?"). It has no feed or
// sitemap and no robots.txt; its own list pages are drawn from a keyless, same-origin HTML fragment
// (/en/search/list, 60 items a page), and every product page carries schema.org JSON-LD with the JAN (gtin), the yen
// price and the stock. So, like HobbyLink Japan, it is matched by JAN alone. Only the three lines' categories and
// only items Good Smile marks orderable (search_status 1 = pre-order, 2 = in stock) are listed; a title readTitle
// refuses is never opened. One request a second. A Japan store (region JP, yen): shown converted under "Or import
// from Japan" (lib/fx.ts). No key from the page's JavaScript is used, and a 403/429 stops it for the run.
import type { Store } from "@/content/stores";
import { isJapaneseJan } from "../jan";
import { readTitle } from "../title";
import type { Listing, Stock } from "../types";
import type { ReadResult } from "./shopify";
import { fetchText, sleep } from "./http";

export const GSC_PAGES_PER_RUN = Number(process.env.GSC_PAGES || 1500);
const PACE_MS = 1000;
/** Good Smile's own category ids: Nendoroid Series, figma, POP UP PARADE. */
const CATEGORIES = [6, 2, 12];
/** Pre-order, in stock. */
const STATUSES = ["1", "2"];
const PAGE = 60;
const MAX_PAGES = 50;

export function listUrl(base: string, category: number, status: string, offset: number): string {
  const filter = {
    search_keyword: "",
    search_over18: false,
    search_category: [category],
    search_maker: [],
    search_title: [],
    search_status: status,
    release_date_from: "",
    release_date_to: "",
    search_bonus: false,
    search_exclusive: false,
    search_sale: false,
    search_sales_origin: false,
    tag: [],
  };
  return `${base}/en/search/list?filter=${encodeURIComponent(JSON.stringify(filter))}&orderBy=1&limit=${PAGE}&offset=${offset}&couponId=null&searchIndex=-1`;
}

export interface GscItem {
  id: string;
  name: string;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

/** The products on one list fragment: Good Smile's product id and its English title. */
export function parseListPage(html: string): GscItem[] {
  const out: GscItem[] = [];
  const seen = new Set<string>();
  for (const block of html.split('class="p-product-list__item"').slice(1)) {
    const id = block.match(/href="\/en\/product\/(\d+)"/)?.[1];
    const name = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: decode(name.replace(/<[^>]+>/g, "")) });
  }
  return out;
}

export interface GscPage {
  jan: string | null;
  yen: number;
  st: Stock;
  img: string | null;
  url: string | null;
}

/** The Product JSON-LD on a Good Smile product page, or null without one (or not in yen). */
export function parseProductPage(html: string, base: string): GscPage | null {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]) as { "@type"?: string; gtin?: string; gtin13?: string; image?: string; url?: string; offers?: unknown };
      if (j["@type"] !== "Product") continue;
      const o = (Array.isArray(j.offers) ? j.offers[0] : j.offers) as { price?: string | number; priceCurrency?: string; availability?: string } | undefined;
      if (!o || o.priceCurrency !== "JPY") return null;
      const yen = Math.round(Number(o.price));
      if (!(yen > 0)) return null;
      const a = o.availability ?? "";
      const st: Stock = /InStock|LimitedAvailability/.test(a) ? "in" : /PreOrder|PreSale|BackOrder/.test(a) ? "pre" : "out";
      const g = String(j.gtin13 ?? j.gtin ?? "");
      const img = typeof j.image === "string" ? (j.image.startsWith("/") ? `${base}${j.image}` : j.image) : null;
      return { jan: isJapaneseJan(g) ? g : null, yen, st, img, url: typeof j.url === "string" ? j.url : null };
    } catch {
      /* not this script */
    }
  }
  return null;
}

export async function readGoodSmile(store: Store, pages = GSC_PAGES_PER_RUN): Promise<ReadResult> {
  const res: ReadResult = { listings: [], seen: 0, refused: {}, noJan: 0 };
  const items = new Map<string, GscItem>();
  for (const cat of CATEGORIES)
    for (const status of STATUSES)
      for (let p = 0; p < MAX_PAGES; p++) {
        const found = parseListPage(await fetchText(listUrl(store.base, cat, status, p * PAGE)));
        for (const it of found) items.set(it.id, it);
        await sleep(PACE_MS);
        if (found.length < PAGE) break;
      }
  const refuse = (why: string) => (res.refused[why] = (res.refused[why] ?? 0) + 1);
  const todo: GscItem[] = [];
  for (const it of items.values()) {
    res.seen++;
    const t = readTitle(it.name);
    if ("refused" in t) refuse(t.refused);
    else todo.push(it);
  }
  for (const it of todo.slice(0, pages)) {
    let page: GscPage | null;
    try {
      page = parseProductPage(await fetchText(`${store.base}/en/product/${it.id}`), store.base);
    } catch (e) {
      if (/HTTP (403|429)/.test((e as Error).message)) throw e;
      refuse("unreadable");
      await sleep(PACE_MS);
      continue;
    }
    await sleep(PACE_MS);
    if (!page) refuse("no-data");
    else if (page.st === "out") refuse("not-orderable");
    else if (!page.jan) res.noJan++;
    else res.listings.push(listingOf(store, it, page));
  }
  return res;
}

export function listingOf(store: Store, it: GscItem, page: GscPage): Listing {
  return { store: store.id, region: store.region, title: it.name, jan: page.jan!, cents: page.yen, st: page.st, url: page.url ?? `${store.base}/en/product/${it.id}`, img: page.img };
}
