import test from "node:test";
import assert from "node:assert/strict";
import { orderRows } from "../src/lib/row-order";

const row = (name: string, paid: boolean, cents: number | null, status: string | null = "in") => ({ name, paid, price: cents === null ? null : `$${cents / 100}`, status, cart: { priceCents: cents ?? 0 } });

test("affiliated rows first by price, unpriced after, then the cheapest plain store, then the rest", () => {
  const out = orderRows(
    [row("Check on eBay", true, null), row("Amazon", true, 3000), row("Check on Amazon", true, null)],
    [row("A", false, 2500), row("PaidStore", true, 3500), row("B", false, 4000), row("SoldOutPaid", true, null, "out")],
  );
  assert.deepEqual(out.pinned.map((r) => r.name), ["Amazon", "PaidStore", "Check on eBay", "Check on Amazon"]);
  assert.deepEqual(out.stores.map((r) => r.name), ["A", "B", "SoldOutPaid"]);
});

test("eBay stays above Amazon among unpriced rows", () => {
  const out = orderRows([row("Check on eBay", true, null), row("Check on Amazon", true, null)], []);
  assert.deepEqual(out.pinned.map((r) => r.name), ["Check on eBay", "Check on Amazon"]);
});

test("the price rows go through orderRows (page and quick view share priceRows)", async () => {
  const { readFileSync } = await import("node:fs");
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /\.\.\.orderRows\(pinned, stores\)/);
});
