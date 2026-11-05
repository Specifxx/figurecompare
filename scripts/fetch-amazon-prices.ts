// Runs first in every Vercel build: Amazon's own price of each product, in every region we have an Amazon
// tag for, looked up by JAN with the Creators API (getItems, itemIdType EAN, ten a call, one call a
// second) and written to data/amazon-live/<REGION>.json (git-ignored). Amazon's licence lets a price be kept
// for 24 hours and shown with its time, so prices are fetched by each build and never committed; the
// product page shows one only while under 24 hours old (lib/amazon-live.ts). Products with the most stores
// first, AMAZON_BUILD_CALLS calls a region (30 by default: 300 products, about 35 seconds of build each).
// A price far from the region's store median (under 60% or over 160%) is dropped: a different pack size or
// a marketplace seller's fantasy. Without credentials, or on any error, it writes nothing and never fails
// the build; a store whose account has no API access yet (403) is skipped and the next region still runs.
//   npx tsx scripts/fetch-amazon-prices.ts
import fs from "node:fs";
import path from "node:path";
import { amazonTag } from "../src/lib/affiliate";
import { AmazonRefused, credentialsFor, creatorsClient, MARKETS, pickListing, PRICE_RESOURCES } from "../src/lib/amazon-creators";
import { AMAZON_LIVE_DIR, type AmazonLiveFile } from "../src/lib/amazon-live";
import type { Figure } from "../src/lib/types";
import { REGIONS, type RegionCode } from "../src/site";

const PRODUCTS = path.resolve(process.cwd(), process.env.FIGURE_DATA_DIR || "data/public", "figures.json");

function median(xs: number[]): number | undefined {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return undefined;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function region(code: RegionCode, figures: Figure[]) {
  const tag = amazonTag(code);
  const market = MARKETS[code];
  if (!tag || !market) return;
  const creds = credentialsFor(code);
  if (!creds) return console.log(`Amazon prices ${code}: no AMAZON_CREATORS_* credentials, skipped.`);
  const inRegion = figures
    .map((p) => ({ p, offers: (p.offers[code] ?? []).filter((o) => o.st !== "out") }))
    .filter((x) => x.offers.length)
    .sort((a, b) => b.offers.length - a.offers.length || b.offers[0].p - a.offers[0].p);
  const cap = Number(process.env.AMAZON_BUILD_CALLS || 30) * 10;
  const todo = inRegion.slice(0, cap);
  if (!todo.length) return;
  const api = await creatorsClient(code, tag, creds);
  const fetchedAt = new Date().toISOString();
  const prices: AmazonLiveFile["prices"] = {};
  for (let i = 0; i < todo.length; i += 10) {
    const batch = todo.slice(i, i + 10);
    let items;
    try {
      items = await api.call("getItems", { itemIds: batch.map((x) => x.p.jan), itemIdType: "EAN", resources: PRICE_RESOURCES });
    } catch (e) {
      console.log(`Amazon prices ${code}: ${(e as Error).message}`);
      if (e instanceof AmazonRefused) break;
      continue;
    }
    for (const x of batch) {
      const it = items.find((it) => (it.itemInfo?.externalIds?.eans?.displayValues ?? []).includes(x.p.jan));
      const pick = it && pickListing(it, market.currency);
      if (!pick) continue;
      const cents = Math.round(pick.amount * 100);
      const ref = median(x.offers.map((o) => o.p));
      if (ref && (cents < ref * 0.6 || cents > ref * 1.6)) continue;
      prices[x.p.jan] = { asin: it!.asin, p: cents };
    }
  }
  if (!Object.keys(prices).length) return console.log(`Amazon prices ${code}: none (${api.calls()} calls).`);
  fs.mkdirSync(AMAZON_LIVE_DIR, { recursive: true });
  fs.writeFileSync(path.join(AMAZON_LIVE_DIR, `${code}.json`), JSON.stringify({ fetchedAt, prices } satisfies AmazonLiveFile) + "\n");
  console.log(`Amazon prices ${code}: ${Object.keys(prices).length} of ${todo.length} products priced in ${api.calls()} calls.`);
}

async function main() {
  fs.rmSync(AMAZON_LIVE_DIR, { recursive: true, force: true });
  if (!fs.existsSync(PRODUCTS)) return console.log("Amazon prices: no figures.json, skipped.");
  const figures = (JSON.parse(fs.readFileSync(PRODUCTS, "utf8")) as { figures: Figure[] }).figures;
  for (const r of REGIONS) await region(r.code, figures).catch((e) => console.log(`Amazon prices ${r.code} skipped: ${(e as Error).message}`));
}

main().catch((e) => console.log(`Amazon prices skipped: ${(e as Error).message}`));
