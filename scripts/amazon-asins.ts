/**
 * Finds each product's Amazon ASIN, in every region we have an Amazon tag and a Creators API credential for,
 * in the daily import (GitHub Actions). The Creators API's getItems takes ASINs only, so the build's price fetch
 * needs them first. One searchItems by the barcode itself; if that finds nothing, one by the figure's name.
 * A result counts ONLY when Amazon's own externalIds carry our barcode (lib/amazon-creators.ts barcodeMatches):
 * the barcode-or-nothing rule, so a 50 ml is never a 100 ml and an EDT never an EDP. Products with the most
 * stores in the region go first. Found ASINs and misses go in data/amazon/asins-<REGION>.json; a miss is
 * retried after 30 days. Without credentials it does nothing; a refusal (that store's account has no API
 * access yet: 10 qualifying sales in 30 days) ends that region quietly and the next one still runs.
 *   npx tsx scripts/amazon-asins.ts            AMAZON_SEARCH_BUDGET=300 searches a region by default
 */
import fs from "node:fs";
import path from "node:path";
import { amazonTag } from "../src/lib/affiliate";
import { AmazonRefused, barcodeMatches, credentialsFor, creatorsClient, MARKETS } from "../src/lib/amazon-creators";
import { AMAZON_DIR, asinFile, dueForSearch, readAsins, searchWords, statusFile, type AsinFile, type AsinStatus } from "../src/lib/amazon-asins";
import type { Figure } from "../src/lib/types";
import { REGIONS, type RegionCode } from "../src/site";

const PRODUCTS = path.resolve(process.cwd(), process.env.FIGURE_DATA_DIR || "data/public", "figures.json");
const RESOURCES = ["itemInfo.title", "itemInfo.externalIds"];

async function region(code: RegionCode, products: Figure[]) {
  const tag = amazonTag(code);
  if (!tag || !MARKETS[code]) return;
  const status = (s: Omit<AsinStatus, "at">) => fs.writeFileSync(statusFile(code), JSON.stringify({ at: new Date().toISOString(), ...s }) + "\n");
  const creds = credentialsFor(code);
  if (!creds) {
    status({ state: "off" });
    return console.log(`Amazon ASINs ${code}: no AMAZON_CREATORS_* credentials, skipped.`);
  }
  const today = new Date().toISOString().slice(0, 10);
  const known: AsinFile = readAsins(code);
  const inRegion = products
    .map((p) => ({ p, n: (p.offers[code] ?? []).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n || a.p.jan.localeCompare(b.p.jan));
  const live = new Set(inRegion.map((x) => x.p.jan));
  const todo = inRegion.filter((x) => dueForSearch(known[x.p.jan], today));
  const api = await creatorsClient(code, tag, creds).catch((e) => {
    status({ state: "refused", note: (e as Error).message.slice(0, 160) });
    console.log(`Amazon ASINs ${code}: ${(e as Error).message}, skipped.`);
    return null;
  });
  const budget = Number(process.env.AMAZON_SEARCH_BUDGET || 300);
  let found = 0, searched = 0, refused = "";
  if (api)
    for (const { p } of todo) {
      if (api.calls() >= budget) break;
      try {
        let hit = (await api.call("searchItems", { keywords: p.jan, resources: RESOURCES, itemCount: 10 })).find((it) => barcodeMatches(it, p.jan));
        if (!hit && api.calls() < budget)
          hit = (await api.call("searchItems", { keywords: searchWords(p), resources: RESOURCES, itemCount: 10 })).find((it) => barcodeMatches(it, p.jan));
        searched++;
        known[p.jan] = [hit?.asin ?? null, today];
        if (hit) found++;
      } catch (e) {
        console.log(`Amazon ASINs ${code}: stopped at ${p.jan}: ${(e as Error).message}`);
        if (e instanceof AmazonRefused) {
          refused = (e as Error).message.slice(0, 160);
          break;
        }
      }
    }
  if (!api) return;
  // Products gone from the region drop out, so the file stays the size of the catalogue.
  const out = Object.fromEntries(Object.entries(known).filter(([e]) => live.has(e)).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(asinFile(code), JSON.stringify(out).replace(/\],"/g, '],\n"') + "\n");
  const asins = Object.values(out).filter((e) => e[0]).length;
  const waiting = Math.max(0, todo.length - searched);
  status({ state: refused && !searched ? "refused" : "ok", searched, found, known: asins, waiting, ...(refused ? { note: refused } : {}) });
  console.log(`Amazon ASINs ${code}: ${searched} searched, ${found} found, ${asins} known, ${waiting} waiting (${api.calls()} calls).`);
}

async function main() {
  if (!fs.existsSync(PRODUCTS)) return console.log("Amazon ASINs: no figures.json, skipped.");
  fs.mkdirSync(AMAZON_DIR, { recursive: true });
  const products = (JSON.parse(fs.readFileSync(PRODUCTS, "utf8")) as { figures: Figure[] }).figures;
  for (const r of REGIONS) await region(r.code, products).catch((e) => console.log(`Amazon ASINs ${r.code} skipped: ${(e as Error).message}`));
}

main().catch((e) => console.log(`Amazon ASINs skipped: ${(e as Error).message}`));
