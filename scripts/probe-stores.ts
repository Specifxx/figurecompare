// Store probe: reads candidate shops the way the import would and says which
// ones carry our lines, in which region's currency, and with how many barcodes.
// Run by .github/workflows/probe-stores.yml, sharded across runners (Shopify
// 429s one runner paging many shops). Input: probe/candidates.txt, one host a
// line. Output: probe/out-<shard>.json. Nothing here touches data/.
import fs from "node:fs";
import { REGIONS, type RegionCode } from "@/site";
import type { Store } from "@/content/stores";
import { readShopify, type ShopifyProduct } from "@/lib/import/shopify";
import { readWoo } from "@/lib/import/woo";
import { readTitle } from "@/lib/title";
import { fetchJson, sleep } from "@/lib/import/http";

const SHARD = Number(process.env.SHARD ?? 0);
const SHARDS = Number(process.env.SHARDS ?? 1);
const LOOKUPS = 15;

const hosts = [
  ...new Set(
    fs
      .readFileSync("probe/candidates.txt", "utf8")
      .split("\n")
      .map((l) => l.replace(/#.*/, "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean),
  ),
].filter((_, i) => i % SHARDS === SHARD);

type Result = {
  host: string;
  base?: string;
  name?: string;
  platform?: "shopify" | "woo" | null;
  regions?: RegionCode[];
  perRegion?: Partial<Record<RegionCode, { listings: number; noJan: number; seen: number; inStock: number; lines: Record<string, number> }>>;
  error?: string;
};

async function finalBase(host: string): Promise<string> {
  const res = await fetch(`https://${host}/`, { redirect: "follow", signal: AbortSignal.timeout(20_000), headers: { "User-Agent": "Mozilla/5.0 (compatible; FigureCompareBot/1.0; +https://figurecompare.com/about)" } });
  return new URL(res.url).origin;
}

async function probe(host: string): Promise<Result> {
  const r: Result = { host };
  try {
    r.base = await finalBase(host);
  } catch (e) {
    return { ...r, error: `home: ${(e as Error).message}` };
  }
  // Shopify?
  let shopify = false;
  try {
    const d = await fetchJson<{ products: ShopifyProduct[] }>(`${r.base}/products.json?limit=1`, {}, 2);
    shopify = Array.isArray(d.products);
  } catch {}
  if (shopify) {
    r.platform = "shopify";
    try {
      const meta = await fetchJson<{ name?: string }>(`${r.base}/meta.json`, {}, 1);
      r.name = meta.name;
    } catch {}
    const regions: RegionCode[] = [];
    for (const reg of REGIONS.filter((x) => x.code !== "JP")) {
      try {
        const c = await fetchJson<{ currency?: string }>(`${r.base}/cart.js?country=${reg.shopifyCountry}`, {}, 1);
        if (c.currency === reg.currency) regions.push(reg.code);
      } catch {}
      await sleep(700);
    }
    r.regions = regions;
    r.perRegion = {};
    // Read once, in the first region it charges (the others only reprice).
    for (const code of regions.slice(0, 1)) {
      const store: Store = { id: host, name: r.name ?? host, region: code, base: r.base!, platform: "shopify" };
      try {
        const res = await readShopify(store, {}, { lookups: LOOKUPS });
        r.perRegion[code] = summary(res);
      } catch (e) {
        // No figure collection: count our lines in /collections/all (first 8 pages).
        try {
          const res = await readShopify({ ...store, collections: ["all"] }, {}, { lookups: LOOKUPS });
          r.perRegion[code] = summary(res);
        } catch (e2) {
          r.error = `read: ${(e2 as Error).message}`;
        }
      }
    }
    return r;
  }
  // WooCommerce?
  try {
    const list = await fetchJson<{ prices: { currency_code: string } }[]>(`${r.base}/wp-json/wc/store/v1/products?per_page=1`, {}, 2);
    if (Array.isArray(list)) {
      r.platform = "woo";
      const cur = list[0]?.prices?.currency_code;
      const reg = REGIONS.find((x) => x.currency === cur && x.code !== "JP");
      r.regions = reg ? [reg.code] : [];
      r.perRegion = {};
      if (reg) {
        const res = await readWoo({ id: host, name: host, region: reg.code, base: r.base!, platform: "woo" });
        r.perRegion[reg.code] = summary(res);
      }
      return r;
    }
  } catch {}
  r.platform = null;
  return r;
}

function summary(res: Awaited<ReturnType<typeof readShopify>>) {
  const lines: Record<string, number> = {};
  for (const l of res.listings) {
    const i = readTitle(l.title);
    const k = "refused" in i ? "?" : i.line;
    lines[k] = (lines[k] ?? 0) + 1;
  }
  return { listings: res.listings.length, noJan: res.noJan, seen: res.seen, inStock: res.listings.filter((l) => l.st !== "out").length, lines };
}

async function main() {
  const out: Result[] = [];
  for (const h of hosts) {
    const t = Date.now();
    const r = await probe(h).catch((e) => ({ host: h, error: String(e) }));
    out.push(r);
    console.log(JSON.stringify(r), `${Math.round((Date.now() - t) / 1000)}s`);
    fs.writeFileSync(`probe/out-${SHARD}.json`, JSON.stringify(out, null, 1));
  }
}
main();
