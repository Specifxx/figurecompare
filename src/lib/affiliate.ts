// Every outbound link is tagged here, at build time (there is no /go route:
// a click costs no function). Tag format, as on every Compare Empire site:
// `figure-<region>-<placement>-<jan>` in EPN's `customid` and Amazon's
// `ascsubtag`, so the earnings reports split by site, market and placement.
// Store links get utm_source so a store sees what we send it (the start of a
// partner-code conversation).
import { REGION_BY_CODE, SITE, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";

/** EPN campaign. FigureCompare's own once created (EBAY_AFFILIATE_CAMPAIGN);
 *  until then the family's shared campaign, split by the customid tag. */
export const EBAY_CAMPAIGN_ID = process.env.EBAY_AFFILIATE_CAMPAIGN || "5339155912";

/** Amazon Associates: each marketplace is its own program and tag. Only the US
 *  tag exists today (the family's); a region without one shows no Amazon row. */
export function amazonTag(region: RegionCode): string | null {
  const own = process.env[`AMAZON_TAG_${region}`];
  if (own) return own;
  return region === "US" ? process.env.AMAZON_ASSOCIATE_TAG || "riftcompare-20" : null;
}

/** HobbyLink Japan's affiliate query string (e.g. "ref=XXXX"), once approved. */
export const HLJ_REF = process.env.HLJ_AFFILIATE_REF || "";

const EBAY_ROTATION: Record<string, string> = {
  "ebay.com": "711-53200-19255-0",
  "ebay.co.uk": "710-53481-19255-0",
  "ebay.com.au": "705-53470-19255-0",
  "ebay.ca": "706-53473-19255-0",
  "ebay.de": "707-53477-19255-0",
};

export function subId(...parts: (string | number | null | undefined)[]): string {
  return (
    [SITE.key, ...parts]
      .filter((x) => x != null && x !== "")
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 60) || SITE.key
  );
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function ebayAffiliateUrl(url: string, sub: string): string {
  try {
    const u = new URL(url);
    const rot = EBAY_ROTATION[host(url)];
    if (!rot) return url;
    u.searchParams.set("mkevt", "1");
    u.searchParams.set("mkcid", "1");
    u.searchParams.set("mkrid", rot);
    u.searchParams.set("campid", EBAY_CAMPAIGN_ID);
    u.searchParams.set("toolid", "10001");
    u.searchParams.set("customid", sub);
    return u.toString();
  } catch {
    return url;
  }
}

export function storeUrl(storeId: string, url: string): string {
  try {
    const u = new URL(url);
    const store = STORE_BY_ID[storeId];
    const aff = store?.affiliate && process.env[store.affiliate.envVar];
    if (store?.affiliate && aff) u.searchParams.set(store.affiliate.param, aff);
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", SITE.domain);
      u.searchParams.set("utm_medium", "referral");
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** True when a click on this store's links can earn (shown as "Paid link"). */
export function storePays(storeId: string): boolean {
  const store = STORE_BY_ID[storeId];
  return !!(store?.affiliate && process.env[store.affiliate.envVar]);
}

/** eBay search, Buy It Now, new, cheapest first, in the region's eBay. */
export function ebaySearchUrl(query: string, region: RegionCode, sub: string): string | null {
  const h = REGION_BY_CODE[region].ebayHost;
  if (!h) return null;
  const u = `https://${h}/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_BIN=1&LH_ItemCondition=1000&_sop=15`;
  return ebayAffiliateUrl(u, sub);
}

export function amazonSearchUrl(query: string, region: RegionCode, sub: string): string | null {
  const tag = amazonTag(region);
  const h = REGION_BY_CODE[region].amazonHost;
  if (!tag || !h) return null;
  return `https://${h}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(tag)}&ascsubtag=${encodeURIComponent(sub)}`;
}

/** HobbyLink Japan searched by barcode, only once the affiliate code exists. */
export function hljUrl(jan: string): string | null {
  if (!HLJ_REF) return null;
  return `https://www.hlj.com/search/?q=${jan}&${HLJ_REF}`;
}
