// Owner, 2026-11-12: only eBay and TCGplayer are paid rows at the top; Amazon shows only with a real price, never as a
// search-link row. Source guard.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the pinned Amazon row needs a real price: no price, no row", () => {
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /if \(amazonUrl && live\)/);
  assert.doesNotMatch(s, /Also check on Amazon/);
});

test("Check on Amazon (owner, 2026-11-17): an unpriced affiliate row UNDER eBay at the top (owner, 2026-11-17 reversal)", () => {
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /if \(!live && amazonUrl\) \{/);
  assert.match(s, /pinned\.splice\(pinned\[0\]\?\.event\?\.source === "ebay" \? 1 : 0, 0, \{\s+name: "Check on Amazon"/);
  assert.match(s, /placement: "check_amazon"/);
});
