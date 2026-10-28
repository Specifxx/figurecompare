import type { LineKey, RegionCode } from "@/site";

export type Stock = "in" | "pre" | "out";

/** One store's listing of one figure, as committed in data/public/figures.json. */
export interface Offer {
  /** store id (src/content/stores.ts) */
  s: string;
  /** price in the region currency's minor unit (cents; whole yen for JPY) */
  p: number;
  st: Stock;
  /** the listing's own URL (untagged; links are tagged at render) */
  u: string;
}

export interface Figure {
  jan: string;
  slug: string;
  name: string;
  line: LineKey;
  number: string | null;
  /** a store's own product photo, hotlinked */
  img: string | null;
  /** date (YYYY-MM-DD) the importer first saw this JAN */
  first: string;
  offers: Partial<Record<RegionCode, Offer[]>>;
}

export interface StoreRun {
  ok: boolean;
  error?: string;
  listings: number;
  matched: number;
  refused: Record<string, number>;
  noJan: number;
  ms: number;
}

export interface Meta {
  updatedAt: string;
  figures: number;
  stores: Record<string, StoreRun>;
  ebay?: { at: string; day: string; calls: number; budget: number; listings: number; skipped?: string };
}

/** The importer's raw reading of one store listing. */
export interface Listing {
  store: string;
  region: RegionCode;
  title: string;
  jan: string;
  cents: number;
  st: Stock;
  url: string;
  img: string | null;
}

/** Cheapest real eBay Buy It Now listings for a figure (data/public/ebay.json). */
export interface EbayPick {
  /** price in the region currency's minor unit */
  p: number;
  u: string;
  t: string;
  img: string | null;
}
export type EbayData = Record<string, Partial<Record<RegionCode, EbayPick>>>;

/** Lowest orderable price per region, recorded only when it changes:
 *  [daysSinceEpoch, minorUnits] pairs (data/public/history.json). */
export type History = Record<string, Partial<Record<RegionCode, [number, number][]>>>;
