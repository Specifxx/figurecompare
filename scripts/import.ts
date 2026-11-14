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
import { indexByNumber, readBbts, BBTS_PAGES_PER_RUN } from "@/lib/import/bbts";
import { readHlj } from "@/lib/import/hlj";
import { readGoodSmile } from "@/lib/import/goodsmile";
import { indexByName, readSitemapStore, type PageCache } from "@/lib/import/sitemap-store";
import { fetchFx, type Fx } from "@/lib/fx";
import type { History, Listing, Meta, StoreRun } from "@/lib/types";
import { demandSlugs, focusCatalog } from "@/lib/focus";
import { nextCore } from "@/lib/index-tiers";
import { SERIES, seriesIsLive } from "@/content/series";
import { execFileSync } from "node:child_process";

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
/** What each sitemap store's product pages said last time (lib/import/sitemap-store.ts). */
const pageCache = read<PageCache>("state/page-cache.json", {});

async function readStore(store: Store, cache: BarcodeCache): Promise<ReadResult> {
  if (store.platform === "woo") return readWoo(store);
  if (store.platform === "bbts") throw new Error("read after the barcode stores");
  if (store.platform === "hlj") return readHlj(store);
  if (store.platform === "goodsmile") return readGoodSmile(store);
  if (store.platform === "sitemap") return readSitemapStore(store, pageCache);
  const want = REGION_BY_CODE[store.region].currency;
  const own = await shopifyOwnCurrency(store);
  if (own && own !== want) throw new Error(`prices in ${own}, region needs ${want}`);
  const cur = await shopifyCurrency(store);
  if (cur && cur !== want) throw new Error(`charges ${cur}, region needs ${want}`);
  return readShopify(store, cache, budget);
}

/** Search Console page demand from this repo's `demand` branch (RiftCompare's sister-demand job); none when unreadable. */
function readDemand(): Set<string> {
  try {
    execFileSync("git", ["fetch", "--quiet", "--depth=1", "origin", "demand"], { stdio: "ignore", timeout: 60_000 });
    const raw = execFileSync("git", ["show", "FETCH_HEAD:gsc-pages.json"], { encoding: "utf8", timeout: 30_000 });
    const s = demandSlugs((JSON.parse(raw) as { pages?: Record<string, number[]> }).pages ?? {});
    console.log(`focus: ${s.size} figure pages with search demand`);
    return s;
  } catch {
    console.log("focus: no demand branch, the stocking rule alone decides");
    return new Set();
  }
}

async function main() {
  const only = process.env.STORES?.split(",").filter(Boolean);
  const afterBarcodes = (s: Store) => s.platform === "bbts" || Boolean(s.sitemap?.byName);
  const stores = (only ? STORES.filter((s) => only.includes(s.id)) : STORES).filter((s) => !afterBarcodes(s));
  const numbered = (only ? STORES.filter((s) => only.includes(s.id)) : STORES).filter(afterBarcodes);
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

  // The number-matched store(s) read last, against the barcode stores' catalogue of the day.
  for (const s of numbered) {
    const t0 = Date.now();
    try {
      const r = s.platform === "bbts" ? await readBbts(s, indexByNumber(listings), BBTS_PAGES_PER_RUN) : await readSitemapStore(s, pageCache, indexByName(listings));
      listings.push(...r.listings);
      runs[s.id] = { ok: true, listings: r.seen, matched: r.listings.length, refused: r.refused, noJan: r.noJan, ms: Date.now() - t0 };
      console.log(`✓ ${s.id}: ${r.seen} product pages, ${r.listings.length} matched by number and name, ${r.noJan} with no unique number`);
    } catch (e) {
      runs[s.id] = { ok: false, error: (e as Error).message.slice(0, 200), listings: 0, matched: 0, refused: {}, noJan: 0, ms: Date.now() - t0 };
      console.log(`✗ ${s.id}: ${(e as Error).message}`);
    }
  }

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
  const merged = mergeListings(mirrored.listings, state, today);
  // Refuse to publish an empty catalogue over a good one. Compared before the cull, against the last run's merged count.
  const prevMerged = prevMeta?.merged ?? prevFigures.length;
  if (prevMerged > 50 && merged.length < prevMerged * 0.5) {
    console.error(`Figures fell from ${prevMerged} to ${merged.length}; not publishing.`);
    process.exit(1);
  }
  // The low-traction cull (lib/focus.ts): only figures two stores can sell today, or that people find through search.
  const figures = focusCatalog(merged, readDemand());
  console.log(`focus: ${figures.length} of ${merged.length} figures listed`);
  // History keeps every merged figure, so one that is listed again returns with its chart.
  const history = recordHistory(read<History>("public/history.json", {}), merged, today);

  const meta: Meta = { updatedAt: new Date().toISOString(), figures: figures.length, merged: merged.length, stores: runs, ebay: prevMeta?.ebay };
  write("public/figures.json", { figures });
  write("public/history.json", history);
  write("public/meta.json", meta, true);
  // What the pages remember from one day to the next (DECISIONS.md 2026-11-14): the sitemap's core figures stay while
  // they are indexable, and a series hub that had a page keeps it down to SERIES_KEEP figures.
  const prevPages = read<{ core?: string[]; series?: string[] }>("public/pages.json", {});
  const wasLive = new Set(prevPages.series ?? []);
  const pages = {
    core: nextCore(prevPages.core ?? [], figures),
    series: SERIES.filter((s) => seriesIsLive(figures.filter((f) => s.re.test(f.name)).length, wasLive.has(s.slug))).map((s) => s.slug),
  };
  write("public/pages.json", pages, true);
  console.log(`pages: ${pages.core.length} core figures in the sitemap (${pages.core.filter((j) => !(prevPages.core ?? []).includes(j)).length} new), ${pages.series.length} series hubs`);
  // The day's yen rates for the Japan table (lib/fx.ts). A failed fetch keeps yesterday's file.
  try {
    write("public/fx.json", await fetchFx(), true);
  } catch (e) {
    console.log(`! FX rates not refreshed: ${(e as Error).message} (keeping ${read<Fx | null>("public/fx.json", null)?.date ?? "none"})`);
  }
  write("state/barcodes.json", cache);
  write("state/page-cache.json", pageCache);
  write("state/slugs.json", state.slugs, true);
  write("state/first-seen.json", state.first, true);
  console.log(`\n${figures.length} figures from ${listings.length} listings (${failed.size} store(s) failed, ${PRODUCT_LOOKUPS_PER_RUN - budget.lookups} barcode lookups).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
