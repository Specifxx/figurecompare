// eBay listings for each figure, looked up by its barcode through the Browse
// API (GitHub Actions only: the website never calls eBay and holds no eBay
// key). Off until EBAY_CLIENT_ID / EBAY_CLIENT_SECRET exist (a green no-op).
// One call per (figure, region), oldest-checked first, capped per day.
import fs from "node:fs";
import path from "node:path";
import { REGIONS, type RegionCode } from "@/site";
import { getFigures } from "@/lib/data";
import { ebayPick, planEbay, type EbayItem } from "@/lib/ebay";
import type { EbayData, Meta } from "@/lib/types";

const DATA = path.join(process.cwd(), "data");
const read = <T>(p: string, f: T): T => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, p), "utf8")) as T;
  } catch {
    return f;
  }
};

const MARKET: Partial<Record<RegionCode, { id: string; country: string }>> = {
  US: { id: "EBAY_US", country: "US" },
  UK: { id: "EBAY_GB", country: "GB" },
  CA: { id: "EBAY_CA", country: "CA" },
  AU: { id: "EBAY_AU", country: "AU" },
  EU: { id: "EBAY_DE", country: "DE" },
};

async function token(): Promise<string> {
  const id = process.env.EBAY_CLIENT_ID!;
  const secret = process.env.EBAY_CLIENT_SECRET!;
  const r = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!r.ok) throw new Error(`eBay token refused: HTTP ${r.status}`);
  return ((await r.json()) as { access_token: string }).access_token;
}

async function main() {
  const metaPath = path.join(DATA, "public/meta.json");
  const meta = read<Meta | null>("public/meta.json", null);
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    console.log("eBay keys not set: skipping (no-op).");
    return;
  }
  const budget = Number(process.env.EBAY_DAILY_CAP || 2500);
  const checked = read<Record<string, string>>("state/ebay-checked.json", {});
  const data = read<EbayData>("public/ebay.json", {});
  const figures = getFigures();
  const plan = planEbay(figures, checked, Object.keys(MARKET) as RegionCode[], budget);
  const tok = await token();
  const today = new Date().toISOString().slice(0, 10);
  let calls = 0;
  let failures = 0;
  for (const { f, region } of plan) {
    const m = MARKET[region]!;
    const cur = REGIONS.find((r) => r.code === region)!.currency;
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?gtin=${f.jan}&limit=25&sort=price&filter=${encodeURIComponent(`buyingOptions:{FIXED_PRICE},conditionIds:{1000},deliveryCountry:${m.country},priceCurrency:${cur}`)}`;
    calls++;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}`, "X-EBAY-C-MARKETPLACE-ID": m.id } });
    if (r.status === 429) {
      console.log("eBay 429: stopping for today.");
      break;
    }
    if (!r.ok) {
      // Nothing is written for a failed search; too many failures fail the run red.
      if (++failures >= 10) throw new Error(`eBay searches failing: HTTP ${r.status}`);
      continue;
    }
    const items = ((await r.json()) as { itemSummaries?: EbayItem[] }).itemSummaries ?? [];
    const pick = ebayPick(items, f.offers[region] ?? [], region);
    const entry = (data[f.jan] ??= {});
    if (pick) entry[region] = pick;
    else delete entry[region];
    if (!Object.keys(entry).length) delete data[f.jan];
    checked[`${f.jan}:${region}`] = today;
    await new Promise((res) => setTimeout(res, 150));
  }
  // Figures that left the catalogue lose their eBay rows.
  const live = new Set(figures.map((f) => f.jan));
  for (const jan of Object.keys(data)) if (!live.has(jan)) delete data[jan];
  fs.writeFileSync(path.join(DATA, "public/ebay.json"), JSON.stringify(data) + "\n");
  fs.writeFileSync(path.join(DATA, "state/ebay-checked.json"), JSON.stringify(checked) + "\n");
  if (meta) {
    meta.ebay = { at: new Date().toISOString(), day: today, calls, budget, listings: Object.keys(data).length };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1) + "\n");
  }
  console.log(`eBay: ${calls} calls of ${budget}; ${Object.keys(data).length} figures with an eBay listing.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
