// Amazon's own price of a product, per region: what scripts/fetch-amazon-prices.ts fetched from the Creators
// API at the start of this build (data/amazon-live/<REGION>.json, git-ignored, never committed: Amazon's
// licence lets a price be kept 24 hours and shown with its time). Read at BUILD time only, by the product
// page's Amazon row alone: never by a sort, the cheapest badge, deals, history, the feed, metadata or the
// quick view. A price older than 24 hours is not read, and the browser hides it again after 24 hours
// (components/AmazonPrice.tsx), since the static page may be served for a day.
import fs from "node:fs";
import path from "node:path";
import type { RegionCode } from "@/site";

export interface AmazonLive {
  /** Amazon's own item, for a /dp/ link instead of a search */
  asin: string;
  /** new, in stock, in the region's currency, in minor units */
  p: number;
  /** ISO time the price was fetched */
  at: string;
}
export interface AmazonLiveFile { fetchedAt: string; prices: Record<string, { asin: string; p: number }> }

/** The clock an Amazon price's "as of" time is shown in: the region's own. */
export const AMAZON_CLOCK: Partial<Record<RegionCode, { timeZone: string; label: string }>> = {
  US: { timeZone: "America/New_York", label: "New York time" },
  CA: { timeZone: "America/Toronto", label: "Toronto time" },
  UK: { timeZone: "Europe/London", label: "London time" },
  EU: { timeZone: "Europe/Berlin", label: "Berlin time" },
  AU: { timeZone: "Australia/Sydney", label: "Sydney time" },
};

export const AMAZON_LIVE_DIR = path.resolve(process.cwd(), process.env.FIGURE_AMAZON_LIVE_DIR || "data/amazon-live");
export const AMAZON_MAX_AGE_H = 24;

/** Whether a price fetched at `at` may still be shown at `now`. */
export const isFreshAmazonPrice = (at: string | undefined, now = Date.now()) =>
  !!at && Number.isFinite(Date.parse(at)) && now - Date.parse(at) < AMAZON_MAX_AGE_H * 3600_000 && Date.parse(at) <= now + 60_000;

const cache = new Map<string, AmazonLiveFile | null>();
function fileFor(region: RegionCode): AmazonLiveFile | null {
  if (!cache.has(region)) {
    let v: AmazonLiveFile | null = null;
    try {
      const f = path.join(AMAZON_LIVE_DIR, `${region}.json`);
      if (fs.existsSync(f)) v = JSON.parse(fs.readFileSync(f, "utf8")) as AmazonLiveFile;
    } catch {
      v = null;
    }
    cache.set(region, v && isFreshAmazonPrice(v.fetchedAt) ? v : null);
  }
  return cache.get(region) ?? null;
}

/** The product's Amazon price in the region, if the build fetched one under 24 hours ago. */
export function amazonLive(jan: string, region: RegionCode): AmazonLive | null {
  const f = fileFor(region);
  const e = f?.prices[jan];
  return e ? { asin: e.asin, p: e.p, at: f!.fetchedAt } : null;
}
