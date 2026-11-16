// A small unpriced "Also on Amazon" line under a region's price table (owner, 2026-11-16). The 2026-11-12 rule (Amazon row only with a
// real price) took Amazon clicks to zero. This is not a row: one line, no price, labelled paid, product page only (never the quick view),
// and only where Amazon's own listing was matched to this exact JAN (scripts/amazon-asins.ts, data/amazon/): no match, no line. Hidden when
// the table already shows Amazon's priced row. The region's shared tag; never ranked, best, a deal or an alert.
import type { RegionCode } from "@/site";
import { REGION_BY_CODE } from "@/site";
import { amazonItemUrl, subId } from "@/lib/affiliate";
import { amazonLive } from "@/lib/amazon-live";
import { readAsins, type AsinFile } from "@/lib/amazon-asins";
import type { Product } from "@/lib/types";
import { OutLink } from "./OutLink";

const cache = new Map<string, AsinFile>();
const asins = (r: RegionCode) => {
  if (!cache.has(r)) cache.set(r, readAsins(r));
  return cache.get(r)!;
};

export function AmazonAlso({ f, region }: { f: Product; region: RegionCode }) {
  const asin = asins(region)[f.jan]?.[0];
  if (!asin || amazonLive(f.jan, region)) return null;
  const href = amazonItemUrl(asin, region, subId(region, "also_amazon", f.jan));
  if (!href) return null;
  const host = REGION_BY_CODE[region].amazonHost?.replace("www.", "");
  return (
    <p className="mt-3 text-sm text-soft">
      Also on Amazon:{" "}
      <OutLink href={href} paid event={{ source: "amazon", region, placement: "also_amazon", jan: f.jan }} className="font-medium text-pink-deep hover:underline">
        see this exact figure on {host} ↗
      </OutLink>{" "}
      <span className="text-xs">Paid link, price not shown.</span>
    </p>
  );
}
