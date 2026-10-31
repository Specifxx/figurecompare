// The committed data under data/public, read at BUILD time only: every page is
// prerendered once per release (one [deploy] build a day), so a visit is a
// static file from Vercel's CDN, never a function and never a database read.
import fs from "node:fs";
import path from "node:path";
import { LINES, REGIONS, type LineKey, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { ebayRowShown } from "./ebay";
import { lowestOrderable } from "./history";
import type { EbayData, Figure, History, Meta, Offer } from "./types";

// FIGURE_DATA_DIR points local development and tests at a fixture; production
// always reads the committed files.
const DIR = path.resolve(process.cwd(), process.env.FIGURE_DATA_DIR || "data/public");
const memo = new Map<string, unknown>();
function load<T>(file: string, fallback: T): T {
  if (memo.has(file)) return memo.get(file) as T;
  let v: T = fallback;
  try {
    v = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")) as T;
  } catch {}
  memo.set(file, v);
  return v;
}

export const getFigures = (): Figure[] => load<{ figures: Figure[] }>("figures.json", { figures: [] }).figures.filter((f) => f.offers && Object.values(f.offers).some((o) => o?.length));
export const getMeta = (): Meta | null => load<Meta | null>("meta.json", null);
export const getHistory = (): History => load<History>("history.json", {});
// Rows from before 2026-10-31 carry no postage (the search took any seller anywhere): not shown (lib/ebay.ts ebayRowShown).
let ebayShown: EbayData | null = null;
export const getEbay = (): EbayData => {
  if (ebayShown) return ebayShown;
  const out: EbayData = {};
  for (const [jan, by] of Object.entries(load<EbayData>("ebay.json", {}))) {
    const kept = Object.fromEntries(Object.entries(by).filter(([, pick]) => ebayRowShown(pick)));
    if (Object.keys(kept).length) out[jan] = kept;
  }
  return (ebayShown = out);
};

export function getFigure(slug: string): Figure | undefined {
  return getFigures().find((f) => f.slug === slug);
}

export function figuresOfLine(line: LineKey): Figure[] {
  return getFigures().filter((f) => f.line === line);
}

/** Regions where this figure has at least one offer, in REGIONS order. */
export function regionsOf(f: Figure): RegionCode[] {
  return REGIONS.map((r) => r.code).filter((c) => f.offers[c]?.length);
}

export interface Best {
  region: RegionCode;
  offer: Offer;
  stores: number;
}

export function bestIn(f: Figure, region: RegionCode): Best | null {
  const offers = f.offers[region];
  const o = lowestOrderable(offers);
  return o ? { region, offer: o, stores: offers!.length } : null;
}

/** How many distinct stores carry the figure anywhere. */
export function storeCount(f: Figure): number {
  return new Set(Object.values(f.offers).flatMap((o) => (o ?? []).map((x) => x.s))).size;
}

/** The gap between the cheapest and the dearest orderable store in a region,
 *  as a share of the dearest: "save up to 31%". Only with 2+ orderable stores. */
export function spreadIn(f: Figure, region: RegionCode): number | null {
  const orderable = (f.offers[region] ?? []).filter((o) => o.st !== "out");
  if (orderable.length < 2) return null;
  const lo = Math.min(...orderable.map((o) => o.p));
  const hi = Math.max(...orderable.map((o) => o.p));
  return hi > 0 ? (hi - lo) / hi : null;
}

export const storeName = (id: string) => STORE_BY_ID[id]?.name ?? id;

/** Figures sold in a region by enough stores, best savings first: the deals list. */
export function dealsIn(region: RegionCode, limit = 48): { f: Figure; spread: number; best: Best }[] {
  const out: { f: Figure; spread: number; best: Best }[] = [];
  for (const f of getFigures()) {
    const s = spreadIn(f, region);
    const best = bestIn(f, region);
    if (s != null && s >= 0.1 && best && best.offer.st === "in") out.push({ f, spread: s, best });
  }
  return out.sort((a, b) => b.spread - a.spread).slice(0, limit);
}

export function lineCounts(): Record<LineKey, number> {
  const c = Object.fromEntries(LINES.map((l) => [l.key, 0])) as Record<LineKey, number>;
  for (const f of getFigures()) c[f.line]++;
  return c;
}

/** Newest first-seen figures (new announcements and new stock). */
export function newest(limit = 24): Figure[] {
  return getFigures().slice().sort((a, b) => b.first.localeCompare(a.first) || a.name.localeCompare(b.name)).slice(0, limit);
}

/** Figures on pre-order somewhere. */
export function preorders(): Figure[] {
  return getFigures().filter((f) => Object.values(f.offers).some((o) => o?.some((x) => x.st === "pre")));
}

/** Most-stocked figures: a stand-in for popularity until click data exists. */
export function popular(limit = 24): Figure[] {
  return getFigures().slice().sort((a, b) => storeCount(b) - storeCount(a) || a.name.localeCompare(b.name)).slice(0, limit);
}

/** Figures someone can order in this region today. */
export function orderableIn(region: RegionCode, list: Figure[] = getFigures()): Figure[] {
  return list.filter((f) => f.offers[region]?.some((o) => o.st !== "out"));
}

/** Pre-orders in a region, most stores first. */
export function preordersIn(region: RegionCode, limit = 24): Figure[] {
  return getFigures()
    .filter((f) => f.offers[region]?.some((o) => o.st === "pre"))
    .sort((a, b) => (b.offers[region]?.length ?? 0) - (a.offers[region]?.length ?? 0) || b.first.localeCompare(a.first))
    .slice(0, limit);
}

/** Most-stocked figures in a region (a stand-in for popularity). */
export function popularIn(region: RegionCode, limit = 24): Figure[] {
  return orderableIn(region)
    .sort((a, b) => (b.offers[region]?.length ?? 0) - (a.offers[region]?.length ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Newest figures orderable in a region. */
export function newestIn(region: RegionCode, limit = 24): Figure[] {
  return orderableIn(region)
    .sort((a, b) => b.first.localeCompare(a.first) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Stores with at least one listed figure, per region. */
export function activeStores(): Record<string, number> {
  const c: Record<string, number> = {};
  for (const f of getFigures()) for (const o of Object.values(f.offers)) for (const x of o ?? []) c[x.s] = (c[x.s] ?? 0) + 1;
  return c;
}
