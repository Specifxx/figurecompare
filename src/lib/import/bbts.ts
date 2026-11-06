// Reads BigBadToyStore, the largest US figure shop, which runs its own
// platform: no product feed, product grids drawn by script, and no barcode
// anywhere on a product page. Its product pages do carry schema.org JSON-LD
// with the title, price, stock and photo, and its slugs carry the Nendoroid or
// figma catalogue number. So (owner, 2026-11-06, DECISIONS.md) this one store
// is matched by LINE + CATALOGUE NUMBER + NAME instead of the barcode:
//
// - only Nendoroid and figma (POP UP PARADE has no number: never matched);
// - the number must belong to exactly ONE barcode in the day's catalogue
//   (built from the barcode stores' listings); a number two JANs share (a
//   re-release, a DX version a store mislabelled) is dropped, not guessed;
// - the store's title must share a name word with the catalogue's name, so a
//   mistyped number never attaches the wrong character;
// - the title still goes through readTitle: dolls, Nendoroid More, parts,
//   pre-owned and bundles are refused as everywhere else.
//
// Pages are read from the product sitemaps robots.txt names (the search
// pages are disallowed, so they are never read), one a second, capped a run.
import type { Store } from "@/content/stores";
import type { LineKey } from "@/site";
import { readTitle, tidyName } from "../title";
import type { Listing, Stock } from "../types";
import type { ReadResult } from "./shopify";
import { fetchText, sleep } from "./http";

export const BBTS_BASE = "https://www.bigbadtoystore.com";
/** Product pages read per run (about 40 minutes at one a second). */
export const BBTS_PAGES_PER_RUN = Number(process.env.BBTS_PAGES || 2500);
const PACE_MS = 1000;

/** The line and catalogue number a BigBadToyStore product slug carries:
 *  ".../product/doki-doki-literature-club-nendoroid-no1817-monika-101589",
 *  ".../figma-no560-...", ".../figma-sp-148-...", ".../figma-ex-066-...". */
export function slugKey(url: string): { line: LineKey; number: string } | null {
  const slug = url.toLowerCase().split("/product/")[1] ?? "";
  const m = slug.match(/(?:^|-)(nendoroid|figma)-(?:no-?(\d{1,4})(?:-(dx))?|(sp|ex)-?(\d{1,4}))(?:-|$)/);
  if (!m) return null;
  const line = m[1] as LineKey;
  const number = m[2] ? `${String(Number(m[2]))}${m[3] ? "-DX" : ""}` : `${m[4].toUpperCase()}-${m[5]}`;
  // Nendoroid numbers are 2–4 digits, figma 1–3 (SP-/EX- aside): a slug like "nendoroid-no2" is a size, not a number.
  if (m[2] && line === "nendoroid" && m[2].length < 2) return null;
  return { line, number };
}

const STOP = new Set(["nendoroid", "figma", "pop", "parade", "ver", "version", "figure", "figures", "reissue", "rerun", "the", "and", "with", "from", "edition", "set"]);
/** The words of a name worth comparing: lower-case, three letters or more, not line or filler words. */
export function nameTokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)),
  );
}

export interface NumberIndex {
  /** "line:number" → the one JAN with that number, and the name words its listings use. */
  [key: string]: { jan: string; tokens: Set<string> };
}

/** The day's catalogue by catalogue number, from the barcode stores' listings:
 *  a number that belongs to exactly one JAN. */
export function indexByNumber(listings: Listing[]): NumberIndex {
  const jans = new Map<string, Map<string, Set<string>>>();
  for (const l of listings) {
    const info = readTitle(l.title);
    if ("refused" in info || !info.number || info.line === "pop-up-parade") continue;
    const key = `${info.line}:${info.number}`;
    const byJan = jans.get(key) ?? new Map<string, Set<string>>();
    const tokens = byJan.get(l.jan) ?? new Set<string>();
    for (const t of nameTokens(tidyName(l.title, info.line, info.number))) tokens.add(t);
    byJan.set(l.jan, tokens);
    jans.set(key, byJan);
  }
  const out: NumberIndex = {};
  for (const [key, byJan] of jans) {
    if (byJan.size !== 1) continue;
    const [[jan, tokens]] = [...byJan.entries()];
    out[key] = { jan, tokens };
  }
  return out;
}

export interface BbtsPage {
  name: string;
  img: string | null;
  offers: { name: string; price: number; currency: string; availability: string }[];
}

/** The product JSON-LD on a BigBadToyStore product page, or null when the page has none. */
export function parseProductPage(html: string): BbtsPage | null {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]) as { "@type"?: string; name?: string; image?: string; offers?: unknown };
      if (j["@type"] !== "Product" || !j.name) continue;
      const raw = Array.isArray(j.offers) ? j.offers : j.offers ? [j.offers] : [];
      const offers = raw
        .map((o) => o as { name?: string; price?: number | string; priceCurrency?: string; availability?: string; itemCondition?: string })
        .filter((o) => !o.itemCondition || /NewCondition/.test(o.itemCondition))
        .map((o) => ({ name: o.name ?? "", price: Number(o.price), currency: o.priceCurrency ?? "", availability: o.availability ?? "" }))
        .filter((o) => o.price > 0);
      return { name: j.name, img: typeof j.image === "string" ? j.image : null, offers };
    } catch {
      /* not this script */
    }
  }
  return null;
}

function stockOf(availability: string): Stock {
  if (/InStock|LimitedAvailability|OnlineOnly/.test(availability)) return "in";
  if (/PreOrder|PreSale|BackOrder/.test(availability)) return "pre";
  return "out";
}

/** One product page → a listing on the catalogue figure its number and name identify, or why not. */
export function listingFromBbts(store: Store, url: string, page: BbtsPage, index: NumberIndex): Listing | { refused: string } | { noMatch: true } {
  const info = readTitle(page.name);
  if ("refused" in info) return { refused: info.refused };
  if (info.line === "pop-up-parade" || !info.number) return { noMatch: true };
  const hit = index[`${info.line}:${info.number}`];
  if (!hit) return { noMatch: true };
  const words = nameTokens(tidyName(page.name, info.line, info.number));
  if (hit.tokens.size && words.size && ![...words].some((w) => hit.tokens.has(w))) return { refused: "name" };
  const offers = page.offers.filter((o) => o.currency === "USD");
  if (!offers.length) return { refused: page.offers.length ? "currency" : "no-price" };
  // Several packaging grades of one product: the cheapest orderable one is the offer.
  const rank = { in: 0, pre: 1, out: 2 } as const;
  const best = offers
    .map((o) => ({ ...o, st: stockOf(o.availability) }))
    .sort((a, b) => rank[a.st] - rank[b.st] || a.price - b.price)[0];
  return { store: store.id, region: store.region, title: page.name, jan: hit.jan, cents: Math.round(best.price * 100), st: best.st, url, img: page.img };
}

/** Every product URL in the sitemaps whose slug carries a number the catalogue knows. */
export async function candidateUrls(base: string, index: NumberIndex): Promise<string[]> {
  const idx = await fetchText(`${base}/sitemap-index.xml`);
  const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => /sitemap-products-\d+\.xml$/.test(u));
  const out: string[] = [];
  for (const map of maps) {
    const xml = await fetchText(map);
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const key = slugKey(m[1]);
      if (key && index[`${key.line}:${key.number}`]) out.push(m[1]);
    }
    await sleep(PACE_MS);
  }
  return [...new Set(out)];
}

export async function readBbts(store: Store, index: NumberIndex, pages = BBTS_PAGES_PER_RUN): Promise<ReadResult> {
  const res: ReadResult = { listings: [], seen: 0, refused: {}, noJan: 0 };
  const urls = (await candidateUrls(store.base, index)).slice(0, pages);
  for (const url of urls) {
    res.seen++;
    let page: BbtsPage | null;
    try {
      page = parseProductPage(await fetchText(url));
    } catch (e) {
      // A product page that will not load is skipped; a store answering 403/429 to every page fails the run.
      if (/HTTP (403|429)/.test((e as Error).message)) throw e;
      res.refused["unreadable"] = (res.refused["unreadable"] ?? 0) + 1;
      await sleep(PACE_MS);
      continue;
    }
    if (!page) res.refused["no-data"] = (res.refused["no-data"] ?? 0) + 1;
    else {
      const r = listingFromBbts(store, url, page, index);
      if ("refused" in r) res.refused[r.refused] = (res.refused[r.refused] ?? 0) + 1;
      else if ("noMatch" in r) res.noJan++;
      else res.listings.push(r);
    }
    await sleep(PACE_MS);
  }
  return res;
}
