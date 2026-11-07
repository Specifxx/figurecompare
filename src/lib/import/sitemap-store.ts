// Reads a store that runs its own platform (no Shopify or WooCommerce feed) but publishes product sitemaps and
// prints the barcode on every product page: Figuya (Berlin), Kurogami (Spain), Yorokonde (Germany), Mangatori
// (France) and Anime Import (Italy), the large
// European figure shops a visitor named on 2026-11-07 (DECISIONS.md). It stays inside the barcode rule: a page is
// listed only when the page itself carries a Japanese JAN, from schema.org JSON-LD (`gtin13` / `gtin`) or, on a
// Shopware 5 shop, its `itemprop="gtin13"` microdata. Product URLs come only from the sitemaps robots.txt names
// (never search or filter pages), kept when the URL names one of our lines; readTitle still decides on the page's
// own title. One request a second, `pages` product pages a run.
//
// The one exception is Archonia (Belgium, `byName`), which prints no barcode at all: the owner chose to list it
// (2026-11-07), matched by its whole name against the day's catalogue, only when exactly one figure fits.
//
// The pages are many (Figuya alone lists ~5,900 Nendoroid, figma and POP UP PARADE pages, mostly long sold out),
// so a run does not open all of them. `data/state/page-cache.json` keeps what each page said last time; each run
// re-reads the pages that were orderable first, then pages never read, then the rest, oldest first. A page read
// in the last week but not today still lists from the cache, with the stock it had then.
import zlib from "node:zlib";
import type { Store } from "@/content/stores";
import { REGION_BY_CODE } from "@/site";
import { isJapaneseJan } from "../jan";
import { readTitle, tidyName } from "../title";
import type { LineKey, RegionCode } from "@/site";
import { nameTokens } from "./bbts";
import type { Listing, Stock } from "../types";
import type { ReadResult } from "./shopify";
import { fetchText, sleep } from "./http";

export interface SitemapConfig {
  /** Sitemap or sitemap-index URLs (from the store's robots.txt). */
  maps: string[];
  /** A product URL must match this (case-insensitive): the language path and one of our lines. */
  match: string;
  /** Product pages a run (default SITEMAP_PAGES, 1,500). */
  pages?: number;
  /** The store prints no barcode anywhere (Archonia): its pages are matched by line, number and the WHOLE name
   *  against the barcode stores' catalogue of the day, only when exactly one figure fits (`matchByName`; owner,
   *  2026-11-07). Read after the barcode stores. */
  byName?: boolean;
}

export const SITEMAP_PAGES_PER_RUN = Number(process.env.SITEMAP_PAGES || 1500);
/** A page read within this many days still lists from the cache on a day it is not re-read. */
export const CACHE_DAYS = 7;
const PACE_MS = 1000;

/** What one product page said the last time it was read. */
export interface CachedPage {
  /** JAN, or null when the page had none (or no product data). */
  j: string | null;
  /** price in cents of the store's currency */
  p: number;
  s: Stock;
  /** title */
  n: string;
  /** photo */
  i: string | null;
  /** day read, YYYY-MM-DD */
  d: string;
}
export type PageCache = Record<string, CachedPage>;

export interface ProductPage {
  name: string;
  jan: string | null;
  price: number;
  currency: string;
  st: Stock;
  img: string | null;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

export function stockOf(availability: string): Stock {
  if (/InStock|LimitedAvailability|OnlineOnly/i.test(availability)) return "in";
  if (/PreOrder|PreSale|BackOrder/i.test(availability)) return "pre";
  return "out";
}

const janOf = (v: unknown): string | null => {
  const s = String(v ?? "").replace(/\D/g, "");
  return s && isJapaneseJan(s) ? s : null;
};

const absolute = (img: unknown, base: string): string | null => {
  const v = Array.isArray(img) ? img[0] : img;
  const s = typeof v === "string" ? v : v && typeof v === "object" && "url" in v ? String((v as { url: unknown }).url) : "";
  if (!s) return null;
  try {
    return new URL(s, base).href;
  } catch {
    return null;
  }
};

/** A product page's schema.org JSON-LD (Figuya, Kurogami), or null when it has no Product with an offer. */
export function parseJsonLd(html: string, base: string): ProductPage | null {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let j: Record<string, unknown>;
    try {
      j = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const nodes = (Array.isArray(j) ? j : Array.isArray(j["@graph"]) ? (j["@graph"] as unknown[]) : [j]) as Record<string, unknown>[];
    for (const n of nodes) {
      if (n?.["@type"] !== "Product" || typeof n.name !== "string") continue;
      const raw = Array.isArray(n.offers) ? n.offers : n.offers ? [n.offers] : [];
      const offers = (raw as Record<string, unknown>[])
        .filter((o) => !o.itemCondition || /NewCondition/.test(String(o.itemCondition)))
        .map((o) => ({ price: Number(o.price), currency: String(o.priceCurrency ?? ""), st: stockOf(String(o.availability ?? "")) }))
        .filter((o) => o.price > 0);
      if (!offers.length) return null;
      const rank = { in: 0, pre: 1, out: 2 } as const;
      const best = offers.sort((a, b) => rank[a.st] - rank[b.st] || a.price - b.price)[0];
      return { name: decode(n.name), jan: janOf(n.gtin13 ?? n.gtin ?? n.ean), price: best.price, currency: best.currency, st: best.st, img: absolute(n.image, base) };
    }
  }
  return null;
}

/** A Shopware 5 product page's microdata (Yorokonde): `itemprop="gtin13"`, the offer's price and currency, the
 *  title in the h1, and the stock from the theme's delivery line ("is--sold", "is--available", pre-order). */
export function parseShopware5(html: string, base: string): ProductPage | null {
  const name = html.match(/<h1[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h1>/)?.[1];
  const offer = html.indexOf('itemprop="offers"');
  if (!name || offer < 0) return null;
  const box = html.slice(offer, offer + 4000);
  const price = Number(box.match(/itemprop="price" content="([\d.]+)"/)?.[1]);
  const currency = box.match(/itemprop="priceCurrency" content="([A-Z]{3})"/)?.[1] ?? "";
  if (!(price > 0)) return null;
  const typ = box.match(/class="preorder--typ ([^"]*)"[^>]*>([^<]*)/);
  const orderable = /name="sQuantity"/.test(box);
  let st: Stock = "out";
  if (typ && /is--sold/.test(typ[1])) st = "out";
  else if (orderable) st = /pre-?order|vorbestell|is--preorder/i.test(typ ? typ[1] + " " + typ[2] : "") ? "pre" : "in";
  const img = html.match(/property="og:image" content="([^"]+)"/)?.[1];
  return { name: decode(name.replace(/<[^>]+>/g, "")), jan: janOf(html.match(/itemprop="gtin13" content="([^"]*)"/)?.[1]), price, currency, st, img: absolute(img, base) };
}

/** A WooCommerce product page drawn by an Elementor theme with no JSON-LD (Anime Import): the title in
 *  `h1.product_title`, the price in the first `p.price` after it (the sale price when one is shown), the barcode
 *  in its "EAN: …" line, and the stock from the add-to-cart button ("Pre-ordina", "Aggiungi al carrello"). */
export function parseWooPage(html: string, base: string): ProductPage | null {
  const h1 = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  if (!h1 || h1.index === undefined) return null;
  const after = html.slice(h1.index);
  const p = after.match(/<p class="price[^"]*">([\s\S]*?)<\/p>/)?.[1];
  if (!p) return null;
  const amount = (p.match(/<ins[^>]*>([\s\S]*?)<\/ins>/)?.[1] ?? p).replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#8364;|&euro;/g, " ");
  const cur = /€|&euro;|&#8364;/.test(p) ? "EUR" : "";
  const num = amount.match(/(\d{1,3}(?:[.\s]\d{3})*|\d+),(\d{2})/) ?? amount.match(/(\d+)\.(\d{2})/);
  if (!num || !cur) return null;
  const price = Number(num[1].replace(/[.\s]/g, "") + "." + num[2]);
  const button = html.match(/single_add_to_cart_button[^>]*>([^<]*)</)?.[1]?.trim() ?? "";
  const st: Stock = /out-of-stock|esaurito/i.test(html.match(/<p class="stock[^"]*"/)?.[0] ?? "") || !button ? "out" : /pre-?ordin|pre-?order/i.test(button) ? "pre" : "in";
  const img = html.match(/property="og:image" content="([^"]+)"/)?.[1];
  return { name: decode(h1[1].replace(/<[^>]+>/g, "")), jan: janOf(html.match(/\bEAN:\s*(\d{8,14})/)?.[1]), price, currency: cur, st, img: absolute(img, base) };
}

export function parseProductPage(html: string, base: string): ProductPage | null {
  return parseJsonLd(html, base) ?? parseShopware5(html, base) ?? parseWooPage(html, base);
}

/** Words that say nothing about WHICH figure: makers, packaging, the store's own filler. */
const NOISE = new Set([
  "good", "smile", "company", "gsc", "max", "factory", "freeing", "phat", "orange", "rouge", "kotobukiya", "pvc", "action",
  "figure", "figures", "figurine", "figur", "figura", "non", "scale", "backorder", "preorder", "order", "pre", "rerun",
  "run", "release", "reissue", "japan", "import", "official", "authentic", "new", "box", "anime", "toy", "toys", "version",
]);

/** The words of a title that name the figure (series and character), lower-case, without line, number or noise. */
export function nameWords(title: string, line: LineKey, number: string | null): Set<string> {
  return new Set([...nameTokens(tidyName(title, line, number))].filter((w) => !NOISE.has(w)));
}

/** The day's catalogue by name, from the barcode stores' listings: per JAN, its line, numbers, every word any store
 *  uses for it, and each store title's own words. */
export interface NameIndex {
  [jan: string]: { line: LineKey; numbers: Set<string>; all: Set<string>; titles: Set<string>[]; prices: Partial<Record<RegionCode, number[]>> };
}

export function indexByName(listings: Listing[]): NameIndex {
  const out: NameIndex = {};
  for (const l of listings) {
    const t = readTitle(l.title);
    if ("refused" in t) continue;
    const e = (out[l.jan] ??= { line: t.line, numbers: new Set(), all: new Set(), titles: [], prices: {} });
    if (e.line !== t.line) continue;
    if (l.cents > 0) (e.prices[l.region] ??= []).push(l.cents);
    if (t.number) e.numbers.add(t.number);
    const w = nameWords(l.title, t.line, t.number);
    if (!w.size) continue;
    for (const x of w) e.all.add(x);
    e.titles.push(w);
  }
  return out;
}

/** A name match's price must sit within this share of the other stores' median in its region (the figure's own
 *  price is the last check that the name landed on the right product). */
export const NAME_PRICE_BAND = [0.6, 1.6] as const;

export function inBand(cents: number, others: number[] | undefined): boolean {
  if (!others?.length) return false;
  const s = [...others].sort((a, b) => a - b);
  const m = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return cents >= m * NAME_PRICE_BAND[0] && cents <= m * NAME_PRICE_BAND[1];
}

/** The one JAN a barcode-less title names, or null. Both ways: every word of the title is a word some store uses for
 *  that figure, AND some store's whole title for it is inside this title's words (so "Nendoroid Miku" never lands
 *  on "Nendoroid Miku: Snow Ver." and the reverse). Same line, the same catalogue number when both give one, and
 *  exactly one figure must fit; a tie is no match. The caller then holds the price to NAME_PRICE_BAND. */
export function matchByName(title: string, index: NameIndex): string | null {
  const t = readTitle(title);
  if ("refused" in t) return null;
  const words = nameWords(title, t.line, t.number);
  if (words.size < 1) return null;
  const hits: string[] = [];
  for (const [jan, e] of Object.entries(index)) {
    if (e.line !== t.line) continue;
    if (t.number && e.numbers.size && !e.numbers.has(t.number)) continue;
    if (![...words].every((w) => e.all.has(w))) continue;
    if (!e.titles.some((s) => [...s].every((w) => words.has(w)))) continue;
    hits.push(jan);
    if (hits.length > 1) return null;
  }
  return hits[0] ?? null;
}

/** A sitemap's text: gzip is unpacked whether or not the server says so. */
async function fetchSitemap(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; FigureCompare/1.0; +https://figurecompare.com/stores)" }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf).toString("utf8") : buf.toString("utf8");
}

export const locsOf = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => decode(m[1]));

/** Every product URL in the store's sitemaps that matches its pattern (an index is followed one level). */
export async function productUrls(cfg: SitemapConfig): Promise<string[]> {
  const re = new RegExp(cfg.match, "i");
  const out = new Set<string>();
  const queue = [...cfg.maps];
  for (let depth = 0, url = queue.shift(); url; url = queue.shift(), depth++) {
    if (depth > 60) break;
    const xml = await fetchSitemap(url);
    if (/<sitemapindex/i.test(xml)) queue.push(...locsOf(xml));
    else for (const loc of locsOf(xml)) if (re.test(loc)) out.add(loc);
    await sleep(PACE_MS);
  }
  return [...out];
}

/** The pages to open this run: orderable last time first, then never read (newest first), then the rest oldest first. */
export function pickPages(urls: string[], cache: PageCache, pages: number, byName = false): string[] {
  const rank = (u: string) => {
    const c = cache[u];
    if (!c) return 1;
    return (c.j || (byName && c.n)) && c.s !== "out" ? 0 : 2;
  };
  return urls
    .map((u, k) => ({ u, k, r: rank(u), d: cache[u]?.d ?? "" }))
    // Pages never read: the sitemap's end first, where these shops put their newest products (old ones often lack a JAN).
    .sort((a, b) => a.r - b.r || a.d.localeCompare(b.d) || (a.r === 1 ? b.k - a.k : a.k - b.k))
    .slice(0, pages)
    .map((x) => x.u);
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export async function readSitemapStore(store: Store, cache: PageCache, names?: NameIndex, today = new Date().toISOString().slice(0, 10)): Promise<ReadResult> {
  const cfg = store.sitemap;
  if (!cfg) throw new Error("no sitemap config");
  if (cfg.byName && !names) throw new Error("read after the barcode stores");
  const want = REGION_BY_CODE[store.region].currency;
  const res: ReadResult = { listings: [], seen: 0, refused: {}, noJan: 0 };
  const refuse = (why: string) => (res.refused[why] = (res.refused[why] ?? 0) + 1);
  const urls = await productUrls(cfg);
  if (!urls.length) throw new Error("no product URLs in the sitemaps");
  const live = new Set(urls);
  // A page the store no longer lists is forgotten.
  for (const u of Object.keys(cache)) if (u.startsWith(store.base) && !live.has(u)) delete cache[u];

  for (const url of pickPages(urls, cache, cfg.pages ?? SITEMAP_PAGES_PER_RUN, cfg.byName)) {
    let page: ProductPage | null;
    try {
      page = parseProductPage(await fetchText(url), store.base);
    } catch (e) {
      // A page that will not load is skipped; a store answering 403/429 fails the run (never worked around).
      if (/HTTP (403|429)/.test((e as Error).message)) throw e;
      await sleep(PACE_MS);
      continue;
    }
    await sleep(PACE_MS);
    if (!page) cache[url] = { j: null, p: 0, s: "out", n: "", i: null, d: today };
    else cache[url] = { j: page.jan, p: page.currency === want ? Math.round(page.price * 100) : 0, s: page.st, n: page.name, i: page.img, d: today };
    if (page && page.currency !== want) refuse("currency");
  }

  // Every page read in the last week lists; the newest reading of a JAN wins, an orderable one over a sold-out one.
  const byJan = new Map<string, Listing>();
  const rank = { in: 0, pre: 1, out: 2 } as const;
  for (const url of urls) {
    const c = cache[url];
    if (!c || daysBetween(c.d, today) > CACHE_DAYS) continue;
    res.seen++;
    if (!c.n) {
      refuse("no-data");
      continue;
    }
    const jan = c.j ?? (cfg.byName && names ? matchByName(c.n, names) : null);
    if (!jan) {
      res.noJan++;
      continue;
    }
    if (!(c.p > 0)) continue;
    // A name match needs another store's price for that figure in this region, and must sit near it.
    if (!c.j && !inBand(c.p, names?.[jan]?.prices[store.region])) {
      refuse("name-price");
      continue;
    }
    const t = readTitle(c.n);
    if ("refused" in t) {
      refuse(t.refused);
      continue;
    }
    const l: Listing = { store: store.id, region: store.region, title: c.n, jan, cents: c.p, st: c.s, url, img: c.i };
    const prev = byJan.get(jan);
    if (!prev || rank[l.st] < rank[prev.st] || (rank[l.st] === rank[prev.st] && l.cents < prev.cents)) byJan.set(jan, l);
  }
  res.listings = [...byJan.values()];
  return res;
}
