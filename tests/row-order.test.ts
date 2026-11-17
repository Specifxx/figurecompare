import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { orderRows } from "../src/lib/row-order";

const row = (name: string, paid: boolean, cents: number | null, status: string | null = "in") => ({ name, paid, price: cents === null ? null : `$${cents / 100}`, status, cart: { priceCents: cents ?? 0 } });

test("eBay, then Amazon (priced or Check), then other affiliated rows by price, then the cheapest plain store, then the rest", () => {
  const out = orderRows(
    [row("eBay", true, 4000), row("Check on Amazon", true, null), row("Partner", true, 2000)],
    [row("A", false, 2500), row("PaidStore2", true, 3500), row("PaidStore1", true, 3000), row("B", false, 4000), row("SoldOutPaid", true, null, "out")],
  );
  assert.deepEqual(out.pinned.map((r) => r.name), ["eBay", "Check on Amazon", "Partner", "PaidStore1", "PaidStore2"]);
  assert.deepEqual(out.stores.map((r) => r.name), ["A", "B", "SoldOutPaid"]);
});

test("the pinned rows keep their order even when Amazon is cheaper than eBay", () => {
  const out = orderRows([row("eBay", true, 5000), row("Amazon", true, 1000)], []);
  assert.deepEqual(out.pinned.map((r) => r.name), ["eBay", "Amazon"]);
});

test("the price rows go through orderRows (page and quick view share priceRows)", () => {
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /\.\.\.orderRows\(pinned, stores\)/);
});
