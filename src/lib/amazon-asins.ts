// Each product's Amazon ASIN per region, found by scripts/amazon-asins.ts in the daily import and committed to
// data/amazon/asins-<REGION>.json (Amazon lets an ASIN be stored; its prices never are). A miss is kept too,
// with the day it was checked, so it is retried only after RECHECK_MISS_DAYS. Read by the build's price fetch
// (scripts/fetch-amazon-prices.ts), never by a page.
import fs from "node:fs";
import path from "node:path";
import type { RegionCode } from "@/site";

/** JAN → [ASIN or null for "searched, not on Amazon", YYYY-MM-DD checked] */
export type AsinFile = Record<string, [string | null, string]>;
export interface AsinStatus { at: string; state: "off" | "refused" | "ok"; searched?: number; found?: number; known?: number; waiting?: number; note?: string }

export const RECHECK_MISS_DAYS = 30;
export const AMAZON_DIR = path.resolve(process.cwd(), process.env.FIGURE_AMAZON_DIR || "data/amazon");
export const asinFile = (r: RegionCode, dir = AMAZON_DIR) => path.join(dir, `asins-${r}.json`);
export const statusFile = (r: RegionCode, dir = AMAZON_DIR) => path.join(dir, `status-${r}.json`);

export function readAsins(r: RegionCode, dir = AMAZON_DIR): AsinFile {
  try {
    return JSON.parse(fs.readFileSync(asinFile(r, dir), "utf8")) as AsinFile;
  } catch {
    return {};
  }
}

export function readAsinStatus(r: RegionCode, dir = AMAZON_DIR): AsinStatus | null {
  try {
    return JSON.parse(fs.readFileSync(statusFile(r, dir), "utf8")) as AsinStatus;
  } catch {
    return null;
  }
}

/** Whether a barcode is due a search today: never searched, or a miss older than RECHECK_MISS_DAYS. */
export function dueForSearch(entry: AsinFile[string] | undefined, today: string): boolean {
  if (!entry) return true;
  if (entry[0]) return false;
  return (Date.parse(today) - Date.parse(entry[1])) / 864e5 >= RECHECK_MISS_DAYS;
}

/** The words a name search uses: house, name and size, without the house twice. */
export function searchWords(p: { brand?: string; name: string; size?: string | null }): string {
  const name = !p.brand || p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`;
  return `${name}${p.size && !name.toLowerCase().includes(p.size.toLowerCase()) ? ` ${p.size}` : ""}`.replace(/\s+/g, " ").trim();
}
