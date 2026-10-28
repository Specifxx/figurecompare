// Fills the barcode cache (data/state/barcodes.json) for many stores at once:
// each runner of .github/workflows/fill-barcodes.yml takes every Nth Shopify
// store and looks up the products the daily import has not asked about yet,
// about a request a second (Shopify 429s a faster runner). Each runner writes
// only its new entries; the workflow merges them into the cache on main. The
// daily import's own 2,400 lookups then go to products that are actually new.
import fs from "node:fs";
import { STORES } from "@/content/stores";
import { readShopify, type BarcodeCache } from "@/lib/import/shopify";

const SHARD = Number(process.env.SHARD ?? 0);
const SHARDS = Number(process.env.SHARDS ?? 1);
const MINUTES = Number(process.env.MINUTES ?? 100);

async function main() {
  const cache: BarcodeCache = JSON.parse(fs.readFileSync("data/state/barcodes.json", "utf8"));
  const before = new Set(Object.keys(cache));
  const budget = { lookups: 1e9 };
  setTimeout(() => (budget.lookups = 0), MINUTES * 60_000);
  const mine = STORES.filter((s) => s.platform === "shopify").filter((_, i) => i % SHARDS === SHARD);
  for (const s of mine) {
    const left = budget.lookups;
    try {
      const r = await readShopify(s, cache, budget);
      console.log(`✓ ${s.id}: ${r.listings.length} with a JAN, ${r.noJan} without`);
    } catch (e) {
      console.log(`✗ ${s.id}: ${(e as Error).message}`);
    }
    if (!left) break;
  }
  const delta: BarcodeCache = {};
  for (const [k, v] of Object.entries(cache)) if (!before.has(k)) delta[k] = v;
  fs.mkdirSync("probe", { recursive: true });
  fs.writeFileSync(`probe/barcodes-${SHARD}.json`, JSON.stringify(delta));
  console.log(`${Object.keys(delta).length} new barcode entries`);
}
main();
