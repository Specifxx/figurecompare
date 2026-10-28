// The daily import (import.yml): every store → data/public/figures.json,
// meta.json and history.json. Two stores at a time (Shopify 429s a runner that
// pages many shops at once). A store that fails keeps nothing from this run and
// shows in meta.json, where the ops monitor reads it.
import fs from "node:fs";
import path from "node:path";
import { STORES, type Store } from "@/content/stores";
import { REGION_BY_CODE } from "@/site";
import { dropMirrors, mergeListings, type MergeState } from "@/lib/merge";
import { recordHistory } from "@/lib/history";
import { readShopify, shopifyCurrency, shopifyOwnCurrency, PRODUCT_LOOKUPS_PER_RUN, type BarcodeCache, type ReadResult } from "@/lib/import/shopify";
import { readWoo } from "@/lib/import/woo";
import type { History, Listing, Meta, StoreRun } from "@/lib/types";

const DATA = path.join(process.cwd(), "data");
const read = <T>(p: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, p), "utf8")) as T;
  } catch {
    return fallback;
  }
};
const write = (p: string, v: unknown, pretty = false) => {
  fs.mkdirSync(path.dirname(path.join(DATA, p)), { recursive: true });
  fs.writeFileSync(path.join(DATA, p), JSON.stringify(v, null, pretty ? 1 : 0) + "\n");
};

const budget = { lookups: PRODUCT_LOOKUPS_PER_RUN };

async function readStore(store: Store, cache: BarcodeCache): Promise<ReadResult> {
  if (store.platform === "woo") return readWoo(store);
  const want = REGION_BY_CODE[store.region].currency;
  const own = await shopifyOwnCurrency(store);
  if (own && own !== want) throw new Error(`prices in ${own}, region needs ${want}`);
  const cur = await shopifyCurrency(store);
  if (cur && cur !== want) throw new Error(`charges ${cur}, region needs ${want}`);
  return readShopify(store, cache, budget);
}

async function main() {
  const only = process.env.STORES?.split(",").filter(Boolean);
  const stores = only ? STORES.filter((s) => only.includes(s.id)) : STORES;
  const cache = read<BarcodeCache>("state/barcodes.json", {});
  const state: MergeState = { slugs: read("state/slugs.json", {}), first: read("state/first-seen.json", {}) };
  const prevMeta = read<Meta | null>("public/meta.json", null);
  const prevFigures = read<{ figures: import("@/lib/types").Figure[] }>("public/figures.json", { figures: [] }).figures;

  const runs: Record<string, StoreRun> = {};
  const listings: Listing[] = [];
  const queue = stores.slice();
  async function worker() {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const t0 = Date.now();
      try {
        const r = await readStore(s, cache);
        listings.push(...r.listings);
        runs[s.id] = { ok: true, listings: r.seen, matched: r.listings.length, refused: r.refused, noJan: r.noJan, ms: Date.now() - t0 };
        console.log(`✓ ${s.id}: ${r.seen} products, ${r.listings.length} with a JAN on a covered line, ${r.noJan} without a JAN`);
      } catch (e) {
        runs[s.id] = { ok: false, error: (e as Error).message.slice(0, 200), listings: 0, matched: 0, refused: {}, noJan: 0, ms: Date.now() - t0 };
        console.log(`✗ ${s.id}: ${(e as Error).message}`);
      }
    }
  }
  await Promise.all([worker(), worker()]);

  // A store that failed today keeps yesterday's offers (marked as they were),
  // so one timeout does not drop a figure under the two-store rule. Its
  // listings come back from the previous figures file.
  const failed = new Set(Object.entries(runs).filter(([, r]) => !r.ok).map(([id]) => id));
  if (failed.size) {
    for (const f of prevFigures) {
      for (const [region, offers] of Object.entries(f.offers)) {
        for (const o of offers ?? []) {
          if (failed.has(o.s)) listings.push({ store: o.s, region: region as Listing["region"], title: f.name, jan: f.jan, cents: o.p, st: o.st, url: o.u, img: f.img });
        }
      }
    }
  }

  const mirrored = dropMirrors(listings, STORES.map((s) => s.id));
  for (const [id, of] of Object.entries(mirrored.mirrors)) {
    if (runs[id]) runs[id].mirrorOf = of;
    console.log(`= ${id} carries the same stock as ${of}: counted once`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const figures = mergeListings(mirrored.listings, state, today);
  // Refuse to publish an empty catalogue over a good one.
  if (prevFigures.length > 50 && figures.length < prevFigures.length * 0.5) {
    console.error(`Figures fell from ${prevFigures.length} to ${figures.length}; not publishing.`);
    process.exit(1);
  }
  const history = recordHistory(read<History>("public/history.json", {}), figures, today);

  const meta: Meta = { updatedAt: new Date().toISOString(), figures: figures.length, stores: runs, ebay: prevMeta?.ebay };
  write("public/figures.json", { figures });
  write("public/history.json", history);
  write("public/meta.json", meta, true);
  write("state/barcodes.json", cache);
  write("state/slugs.json", state.slugs, true);
  write("state/first-seen.json", state.first, true);
  console.log(`\n${figures.length} figures from ${listings.length} listings (${failed.size} store(s) failed, ${PRODUCT_LOOKUPS_PER_RUN - budget.lookups} barcode lookups).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
