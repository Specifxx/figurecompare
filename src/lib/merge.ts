// Turns every store's listings into figures: one figure per JAN, offers grouped
// by region, a figure kept only when one region has enough stores. Pure, so
// tests/merge.test.ts can pin every rule.
import { LINES, REGIONS, SITE, type LineKey, type RegionCode } from "@/site";
import { pickName, readTitle } from "./title";
import { slugify } from "./slug";
import type { Figure, Listing, Offer } from "./types";

const STOCK_RANK = { in: 0, pre: 1, out: 2 } as const;

export function median(xs: number[]): number {
  const s = xs.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Offers in display order: orderable first, cheapest first. */
export function sortOffers(offers: Offer[]): Offer[] {
  return offers.slice().sort((a, b) => STOCK_RANK[a.st] - STOCK_RANK[b.st] || a.p - b.p || a.s.localeCompare(b.s));
}

/**
 * Drop prices that cannot be the same new product: with three or more stores,
 * anything under 40% or over 250% of the median is a misfiled listing, a
 * deposit, a bundle or a reseller markup. With two, nothing can be judged, so
 * both stay.
 */
export function saneOffers(offers: Offer[]): Offer[] {
  if (offers.length < 3) return offers;
  const med = median(offers.map((o) => o.p));
  return offers.filter((o) => o.p >= med * 0.4 && o.p <= med * 2.5);
}

export interface MergeState {
  /** jan → slug, kept forever so a URL never changes */
  slugs: Record<string, string>;
  /** jan → first seen date */
  first: Record<string, string>;
}

const LATIN = /^[\x20-\x7EÀ-ɏ‐-‧]+$/;

export function mergeListings(listings: Listing[], state: MergeState, today: string): Figure[] {
  const byJan = new Map<string, Listing[]>();
  for (const l of listings) {
    const list = byJan.get(l.jan) ?? [];
    list.push(l);
    byJan.set(l.jan, list);
  }
  const usedSlugs = new Set(Object.values(state.slugs));
  const out: Figure[] = [];
  for (const [jan, all] of byJan) {
    // The line every listing agrees on; a JAN two stores file under different
    // lines keeps only the majority's listings (and is dropped on a tie).
    const lines = new Map<LineKey, number>();
    const read = all.map((l) => ({ l, info: readTitle(l.title) }));
    for (const r of read) if (!("refused" in r.info)) lines.set(r.info.line, (lines.get(r.info.line) ?? 0) + 1);
    const ranked = [...lines.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length || (ranked[1] && ranked[1][1] === ranked[0][1])) continue;
    const line = ranked[0][0];
    const agreeing = read.filter((r) => !("refused" in r.info) && r.info.line === line).map((r) => r.l);

    const offers: Partial<Record<RegionCode, Offer[]>> = {};
    let qualifies = false;
    for (const region of REGIONS) {
      const inRegion = agreeing.filter((l) => l.region === region.code);
      // One offer per store: its orderable, cheapest listing.
      const perStore = new Map<string, Offer>();
      for (const l of inRegion) {
        const o: Offer = { s: l.store, p: l.cents, st: l.st, u: l.url };
        const prev = perStore.get(l.store);
        if (!prev || STOCK_RANK[o.st] < STOCK_RANK[prev.st] || (STOCK_RANK[o.st] === STOCK_RANK[prev.st] && o.p < prev.p)) perStore.set(l.store, o);
      }
      const kept = sortOffers(saneOffers([...perStore.values()]));
      if (!kept.length) continue;
      offers[region.code] = kept;
      if (kept.length >= SITE.minStoresPerRegion) qualifies = true;
    }
    if (!qualifies) continue;

    // Names from English-language listings outside Japan first.
    const named = agreeing.filter((l) => LATIN.test(l.title));
    const titles = (named.filter((l) => l.region !== "JP").length ? named.filter((l) => l.region !== "JP") : named.length ? named : agreeing).map((l) => l.title);
    const numbers = agreeing.map((l) => readTitle(l.title)).flatMap((i) => ("refused" in i || !i.number ? [] : [i.number]));
    const number = numbers.length ? mode(numbers) : null;
    const name = ensureLine(pickName(titles, number), line);

    let slug = state.slugs[jan];
    if (!slug) {
      const base = slugify(name) || `${line}-${jan}`;
      slug = usedSlugs.has(base) ? `${base}-${jan.slice(-5)}` : base;
      usedSlugs.add(slug);
      state.slugs[jan] = slug;
    }
    if (!state.first[jan]) state.first[jan] = today;
    const img = (agreeing.find((l) => l.img && l.region !== "JP") ?? agreeing.find((l) => l.img))?.img ?? null;
    out.push({ jan, slug, name, line, number, img, first: state.first[jan], offers });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function mode(xs: string[]): string {
  const c = new Map<string, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

/** Make sure the display name says what line it is ("Frieren" → "Nendoroid Frieren"). */
function ensureLine(name: string, line: LineKey): string {
  const l = LINES.find((x) => x.key === line)!;
  return new RegExp(l.name.replace(/\s+/g, "\\s*"), "i").test(name) ? name : `${l.name} ${name}`;
}
