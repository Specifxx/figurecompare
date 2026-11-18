// Owner, 2026-11-18: withdrawing "eBay and Amazon are never the best price". A priced eBay or Amazon row strictly under the cheapest in-stock
// store (and not more than 25% under it) carries the highlight; the row order is unchanged. Source guard.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");

test("a priced eBay or Amazon row under the cheapest store takes the highlight, never one far under it", () => {
  assert.match(src, /const BEST_MAX_UNDER_STORES = 0\.75;/);
  assert.match(src, /\(p\.event\?\.source === "ebay" \|\| p\.event\?\.source === "amazon"\) && p\.status === "in"/);
  assert.match(src, /p\.cart!\.priceCents < best\.p && p\.cart!\.priceCents >= best\.p \* BEST_MAX_UNDER_STORES/);
  assert.match(src, /highlight: o === best && !winner,/, "only one row is highlighted");
});

test("the row order is still the affiliate rows first, then the stores", () => {
  assert.match(src, /\.\.\.orderRows\(pinned, stores\)/);
});
