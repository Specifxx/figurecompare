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
