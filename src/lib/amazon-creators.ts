/**
 * Amazon's Creators API (it replaced PA-API 5 in 2026), BUILD-SIDE ONLY: scripts/fetch-amazon-prices.ts runs
 * first in every Vercel build and looks each product up by its barcode. No page, component or route imports
 * this file (tests/amazon-api.test.ts), and the credentials never reach the browser.
 *
 * Access: the owner's Associates accounts (AU approved 2026-11-03, US 2026-11-05). ONE credential (Associates
 * Central → Tools → Creators API) serves every marketplace; access is per store and opens only once that
 * store's own account has qualifying sales (third-party guides say 10 in the last 30 days), so a refused
 * store (401/403/429) is skipped and the row keeps its "check the seller" search link. Limits: 1 request a
 * second and 8,640 a day at first; one getItems call carries ten items.
 *
 * Credentials: AMAZON_CREATORS_<US|UK|CA|EU|AU>_CLIENT_ID / _CLIENT_SECRET / _VERSION (GitHub secrets for the
 * ASIN finder, Vercel Production variables for the build's price fetch; never in the repo). A credential belongs
 * to the Associates account that made it: the AU one answers every US and UK call with 400 InvalidAssociate
 * ("Your credential is not linked to the partner tag", Compare Empire 2026-11-06), so the US store needs the US
 * credential (StoreID riftcompare-20, version 3.1). The AU variables stay the fallback, and a store they cannot
 * serve ends quietly as refused. The version (3.1 NA, 3.2 EU, 3.3 FE) picks the Login with Amazon token endpoint.
 *
 * getItems takes ASINs only (the docs list no EAN or UPC itemIdType), so scripts/amazon-asins.ts finds each
 * product's ASIN first with searchItems and keeps it only when Amazon's own externalIds carry our barcode.
 * Docs: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-curl
 */
import type { RegionCode } from "@/site";

export const CREATORS_API = "https://creatorsapi.amazon/catalog/v1";

const TOKEN_ENDPOINTS: Record<string, string> = {
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
};

/** The stores we have a tag for (lib/affiliate.ts amazonTag): marketplace host, currency and home region. */
export const MARKETS: Partial<Record<RegionCode, { marketplace: string; currency: string; version: string }>> = {
  US: { marketplace: "www.amazon.com", currency: "USD", version: "3.1" },
  CA: { marketplace: "www.amazon.ca", currency: "CAD", version: "3.1" },
  UK: { marketplace: "www.amazon.co.uk", currency: "GBP", version: "3.2" },
  EU: { marketplace: "www.amazon.de", currency: "EUR", version: "3.2" },
  AU: { marketplace: "www.amazon.com.au", currency: "AUD", version: "3.3" },
};

/** The token endpoint for a credential version; an unknown version falls back to the market's home region. */
export function tokenEndpoint(version: string | undefined, region: RegionCode): string {
  return TOKEN_ENDPOINTS[(version ?? "").trim()] ?? TOKEN_ENDPOINTS[MARKETS[region]?.version ?? "3.1"];
}

export interface Credentials { id: string; secret: string; version: string }

/** The region's credential from the environment (its own, else the AU-named one), or null: then nothing runs. */
export function credentialsFor(region: RegionCode, env: Record<string, string | undefined> = process.env): Credentials | null {
  for (const r of [region, "AU"]) {
    const k = `AMAZON_CREATORS_${r}_`;
    const id = env[`${k}CLIENT_ID`]?.trim();
    const secret = env[`${k}CLIENT_SECRET`]?.trim();
    if (id && secret) return { id, secret, version: env[`${k}VERSION`]?.trim() || MARKETS[region]?.version || "3.1" };
  }
  return null;
}

export interface Listing {
  price?: { money?: { amount?: number; currency?: string } };
  condition?: { value?: string };
  availability?: { type?: string };
  merchantInfo?: { name?: string };
  isBuyBoxWinner?: boolean;
}
export interface Item {
  asin: string;
  detailPageURL?: string;
  itemInfo?: { title?: { displayValue?: string }; externalIds?: { eans?: { displayValues?: string[] }; upcs?: { displayValues?: string[] } } };
  offersV2?: { listings?: Listing[] } | null;
}
interface Body { searchResult?: { items?: Item[] }; itemResults?: { items?: Item[] }; itemsResult?: { items?: Item[] } }

/** Items from either operation's response (GetItems answers `itemResults`; older docs said `itemsResult`). */
export const itemsOf = (b: Body): Item[] => b.searchResult?.items ?? b.itemResults?.items ?? b.itemsResult?.items ?? [];

// OffersV2 availability that can be bought today ("IN_STOCK_SCARCE" is "Only 3 left").
const BUYABLE = new Set(["IN_STOCK", "IN_STOCK_SCARCE"]);

/**
 * The price we show for an item: the buy-box listing if it is new, in stock and in the store's currency, else
 * the cheapest such listing. Null when none qualifies (the row then keeps its search link and no price).
 */
export function pickListing(item: Item, currency: string): { amount: number; seller?: string } | null {
  const ok = (item.offersV2?.listings ?? []).filter(
    (l) => l.condition?.value === "New" && BUYABLE.has(l.availability?.type ?? "") && l.price?.money?.currency === currency && (l.price?.money?.amount ?? 0) > 0,
  );
  if (!ok.length) return null;
  const best = ok.find((l) => l.isBuyBoxWinner) ?? [...ok].sort((a, b) => a.price!.money!.amount! - b.price!.money!.amount!)[0];
  const seller = best.merchantInfo?.name;
  return { amount: best.price!.money!.amount!, seller: seller && !/^amazon/i.test(seller) ? seller : undefined };
}

export const PRICE_RESOURCES = [
  "itemInfo.title",
  "itemInfo.externalIds",
  "offersV2.listings.price",
  "offersV2.listings.condition",
  "offersV2.listings.availability",
  "offersV2.listings.merchantInfo",
  "offersV2.listings.isBuyBoxWinner",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class AmazonRefused extends Error {}

/** Amazon's answer when the credential is not linked to this store's tag (another country's account). */
export const isWrongAccount = (body: string) => /InvalidAssociate|not linked to the partner tag/i.test(body);

/** Whether Amazon's own barcodes for an item include ours (a 13-digit EAN; a UPC-A is that EAN minus its 0). */
export function barcodeMatches(item: Item, ean: string): boolean {
  const ours = new Set([ean, ean.replace(/^0/, ""), `0${ean}`]);
  const theirs = [...(item.itemInfo?.externalIds?.eans?.displayValues ?? []), ...(item.itemInfo?.externalIds?.upcs?.displayValues ?? [])];
  return theirs.some((b) => ours.has(b.trim()));
}

/** A signed-in caller for one store: one request a second, stops on 401/403/429 (access closed or limit hit). */
export async function creatorsClient(region: RegionCode, tag: string, creds: Credentials) {
  const market = MARKETS[region];
  if (!market) throw new Error(`no Amazon store for ${region}`);
  const tok = await fetch(tokenEndpoint(creds.version, region), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: creds.id, client_secret: creds.secret, scope: "creatorsapi::default" }),
  });
  if (!tok.ok) throw new AmazonRefused(`token ${tok.status}`);
  const bearer = ((await tok.json()) as { access_token: string }).access_token;
  let calls = 0;
  async function call(op: "searchItems" | "getItems", body: object): Promise<Item[]> {
    calls++;
    const res = await fetch(`${CREATORS_API}/${op}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json", "x-marketplace": market!.marketplace },
      body: JSON.stringify({ partnerTag: tag, marketplace: market!.marketplace, ...body }),
    });
    await sleep(1100);
    if (res.status === 401 || res.status === 403 || res.status === 429) throw new AmazonRefused(`${op} ${res.status} ${(await res.text()).slice(0, 160)}`);
    if (!res.ok) {
      const text = (await res.text()).slice(0, 160);
      // Every call would fail the same way: stop this store, not just this batch.
      if (isWrongAccount(text) || /AssociateNotEligible/i.test(text)) throw new AmazonRefused(`${op} ${res.status} ${text}`);
      throw new Error(`${op} ${res.status} ${text}`);
    }
    return itemsOf((await res.json()) as Body);
  }
  return { call, calls: () => calls };
}
