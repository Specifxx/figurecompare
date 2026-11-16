import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Amazon also-line: unpriced, product page only, only for a barcode-matched ASIN, never the quick view", () => {
  const c = readFileSync(new URL("../src/components/AmazonAlso.tsx", import.meta.url), "utf8");
  assert.match(c, /if \(!asin \|\| amazonLive\(f\.jan, region\)\) return null;/);
  const t = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(t, /also_amazon/);
  const q = readFileSync(new URL("../src/components/QuickView.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(q, /AmazonAlso/);
});
