import { REGION_BY_CODE, type RegionCode } from "@/site";

const SYMBOL: Record<string, string> = { USD: "US$", NZD: "NZ$", GBP: "£", CAD: "C$", AUD: "A$", EUR: "€", SGD: "S$", JPY: "¥" };

/** A price in its own currency, never converted: "A$89.95", "¥6,800". */
export function money(minor: number, region: RegionCode): string {
  const cur = REGION_BY_CODE[region].currency;
  if (cur === "JPY") return `¥${Math.round(minor).toLocaleString("en-US")}`;
  const v = (minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${SYMBOL[cur] ?? `${cur} `}${v}`;
}

/** The decimal string schema.org wants. */
export function decimal(minor: number, region: RegionCode): string {
  return REGION_BY_CODE[region].currency === "JPY" ? String(Math.round(minor)) : (minor / 100).toFixed(2);
}

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function ago(iso: string, now = Date.now()): string {
  const h = Math.max(0, (now - Date.parse(iso)) / 3_600_000);
  if (h < 1) return "less than an hour ago";
  if (h < 24) return `${Math.floor(h)} hour${Math.floor(h) === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function niceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
