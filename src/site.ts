// FigureCompare's one config file: name, host, regions, figure lines and the
// sister sites. Store lists live in src/content/stores.ts.

export const SITE = {
  key: "figure",
  name: "FigureCompare",
  domain: "figurecompare.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://figurecompare.com").replace(/\/$/, ""),
  tagline: "Find the cheapest Nendoroid, figma and POP UP PARADE",
  description:
    "Compare Nendoroid, figma and POP UP PARADE prices across real anime figure stores in the US, UK, Canada, Australia, New Zealand, Europe and Singapore. Matched by barcode, updated daily.",
  /** A figure gets a page only when this many stores in one region sell it
   *  (comparing one shop is pointless, and it keeps data/ small). */
  /** Every contact address on the site (owner, 2026-10-28: one inbox for the family). */
  email: "compareempire@gmail.com",
  minStoresPerRegion: 2,
} as const;

export type RegionCode = "US" | "UK" | "CA" | "AU" | "NZ" | "EU" | "SG" | "JP";

export interface Region {
  code: RegionCode;
  name: string;
  /** "in Australia" / "from Japan" */
  phrase: string;
  currency: string;
  /** Shopify Markets country asked for on every request (prices follow the
   *  visitor's country, and GitHub's runners are in the US). */
  shopifyCountry: string;
  flag: string;
  ebayHost: string | null;
  amazonHost: string | null;
  /** IANA time zone prefixes that pick this region for a first-time visitor. */
  zones: string[];
}

export const REGIONS: Region[] = [
  { code: "US", name: "United States", phrase: "in the US", currency: "USD", shopifyCountry: "US", flag: "🇺🇸", ebayHost: "www.ebay.com", amazonHost: "www.amazon.com", zones: ["America/"] },
  { code: "UK", name: "United Kingdom", phrase: "in the UK", currency: "GBP", shopifyCountry: "GB", flag: "🇬🇧", ebayHost: "www.ebay.co.uk", amazonHost: "www.amazon.co.uk", zones: ["Europe/London", "Europe/Belfast", "Europe/Dublin"] },
  { code: "CA", name: "Canada", phrase: "in Canada", currency: "CAD", shopifyCountry: "CA", flag: "🇨🇦", ebayHost: "www.ebay.ca", amazonHost: "www.amazon.ca", zones: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax", "America/St_Johns", "America/Regina", "America/Montreal"] },
  { code: "AU", name: "Australia", phrase: "in Australia", currency: "AUD", shopifyCountry: "AU", flag: "🇦🇺", ebayHost: "www.ebay.com.au", amazonHost: "www.amazon.com.au", zones: ["Australia/"] },
  { code: "NZ", name: "New Zealand", phrase: "in New Zealand", currency: "NZD", shopifyCountry: "NZ", flag: "🇳🇿", ebayHost: null, amazonHost: null, zones: ["Pacific/Auckland", "Pacific/Chatham"] },
  { code: "EU", name: "Europe", phrase: "in Europe", currency: "EUR", shopifyCountry: "DE", flag: "🇪🇺", ebayHost: "www.ebay.de", amazonHost: "www.amazon.de", zones: ["Europe/"] },
  { code: "SG", name: "Singapore", phrase: "in Singapore", currency: "SGD", shopifyCountry: "SG", flag: "🇸🇬", ebayHost: "www.ebay.com", amazonHost: "www.amazon.sg", zones: ["Asia/Singapore", "Asia/Kuala_Lumpur"] },
  { code: "JP", name: "Ships from Japan", phrase: "from Japan", currency: "JPY", shopifyCountry: "JP", flag: "🇯🇵", ebayHost: null, amazonHost: null, zones: ["Asia/Tokyo"] },
];

export const REGION_BY_CODE = Object.fromEntries(REGIONS.map((r) => [r.code, r])) as Record<RegionCode, Region>;

/** Pick a region from the browser's time zone; the more specific match wins
 *  (America/Toronto is Canada, not the US). Japan-based visitors see JP. */
export function regionForZone(zone: string | undefined | null): RegionCode {
  if (!zone) return "US";
  let best: { code: RegionCode; len: number } = { code: "US", len: 0 };
  for (const r of REGIONS) {
    for (const z of r.zones) {
      if (zone.startsWith(z) && z.length > best.len) best = { code: r.code, len: z.length };
    }
  }
  return best.code;
}

export type LineKey = "nendoroid" | "figma" | "pop-up-parade";

export interface Line {
  key: LineKey;
  name: string;
  maker: string;
  /** One sentence for hub pages; facts only. */
  about: string;
  emoji: string;
}

export const LINES: Line[] = [
  {
    key: "nendoroid",
    name: "Nendoroid",
    maker: "Good Smile Company",
    about: "Good Smile Company's numbered chibi figures, about 10 cm tall, with swappable faces and parts.",
    emoji: "🍡",
  },
  {
    key: "figma",
    name: "figma",
    maker: "Max Factory",
    about: "Max Factory's numbered action figures, about 13–15 cm tall, fully poseable with smooth joints.",
    emoji: "🤸",
  },
  {
    key: "pop-up-parade",
    name: "POP UP PARADE",
    maker: "Good Smile Company",
    about: "Good Smile Company's affordable non-scale figures, mostly 15–18 cm tall, released fast and priced low.",
    emoji: "🎀",
  },
];

export const LINE_BY_KEY = Object.fromEntries(LINES.map((l) => [l.key, l])) as Record<LineKey, Line>;

/** The rest of Compare Empire, linked from every footer (family-links rule:
 *  descriptive anchors, plain followed links, footer only). */
export const SISTER_SITES: { name: string; url: string; anchor: string }[] = [
  { name: "RiftCompare", url: "https://riftcompare.com", anchor: "Riftbound card prices" },
  { name: "OP Compare", url: "https://opcompare.app", anchor: "One Piece card prices" },
  { name: "DexCompare", url: "https://dexcompare.app", anchor: "Pokémon sealed prices" },
  { name: "MTG Compare", url: "https://mtgcompare.app", anchor: "Magic: The Gathering sealed prices" },
  { name: "Gundam Compare", url: "https://gundamcompare.com", anchor: "Gundam card prices" },
  { name: "Lorcana Compare", url: "https://lorcanacompare.com", anchor: "Lorcana card prices" },
  { name: "YGO Compare", url: "https://ygocompare.com", anchor: "Yu-Gi-Oh! card prices" },
  { name: "WargameCompare", url: "https://wargamecompare.com", anchor: "Miniature wargame prices" },
  { name: "CamCompare", url: "https://www.camcompare.app", anchor: "Camera and lens prices" },
  { name: "Compare Empire", url: "https://compareempire.com", anchor: "Australian tech prices" },
];
