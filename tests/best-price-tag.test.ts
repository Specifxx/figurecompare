// Owner, 2026-11-18: a cheapest row that is a plain store gets a small neutral "Best price" tag, not the green highlight; an affiliate
// cheapest row keeps the highlight; the hint appears only when the list has an eBay row.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PriceRows, type RowData } from "../src/components/PriceRows";
import { bestPriceHint, isPlainBest } from "../src/lib/best-tag";

// tsx compiles the components with the classic JSX transform (tsconfig "preserve"): give them React.
(globalThis as unknown as { React: typeof React }).React = React;

const row = (over: Partial<RowData>): RowData => ({
  name: "Shop",
  sub: null,
  price: "$10.00",
  status: "in",
  href: "https://example.com/p",
  paid: false,
  event: { source: "shop", region: "US", placement: "table" },
  ...over,
});
const ebay = row({ name: "eBay", pin: "ebay", paid: true, price: null, event: { source: "ebay", region: "US", placement: "table_pinned" } });
const brandOf = (r: RowData) => ({ brand: r.event.source });
const html = (pinned: RowData[], stores: RowData[]) => renderToStaticMarkup(createElement(PriceRows, { pinned, stores }));

test("a plain cheapest store gets the small Best price tag and no highlight", () => {
  const plain = { plainBest: true, bestHint: bestPriceHint([ebay].map(brandOf)) };
  const out = html([ebay], [row(plain)]);
  assert.match(out, /Best price/);
  assert.doesNotMatch(out, /border-save|bg-save\/5|font-semibold text-save|pr-p text-accent-deep/);
  assert.match(out, /\$10\.00/, "the price stays fully visible");
});

test("an affiliate cheapest row keeps the full highlight and no plain tag", () => {
  const out = html([], [row({ paid: true, highlight: true, sub: "Lowest store price" })]);
  assert.match(out, /border-pink shadow-sticker/);
  assert.doesNotMatch(out, /data-best-tag/);
});

test("the hint shows only when the list has an eBay row, and names only that row", () => {
  assert.equal(bestPriceHint([].map(brandOf)), null);
  assert.equal(bestPriceHint([{ brand: "amazon" }]), null);
  assert.equal(bestPriceHint([{ brand: "ebay" }]), "Prices and stock change: also check eBay");
  const withHint = html([ebay], [row({ plainBest: true, bestHint: bestPriceHint([ebay].map(brandOf)) })]);
  assert.match(withHint, /aria-label="Prices and stock change: also check eBay"/);
  assert.match(withHint, /title="Prices and stock change: also check eBay"/);
  const noHint = html([], [row({ plainBest: true, bestHint: bestPriceHint([].map(brandOf)) })]);
  assert.match(noHint, /Best price/);
  assert.doesNotMatch(noHint, /also check|aria-label="Prices/);
  assert.doesNotMatch(withHint, /cheaper/i, "never claims eBay is cheaper");
});

test("only a row that earns nothing is plain, and the table wires it", () => {
  assert.equal(isPlainBest({ paid: false }), true);
  assert.equal(isPlainBest({ paid: true }), false);
  const src = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(src, /plainRow = o === best && !winner && isPlainBest\(\{ paid: storePays\(o\.s\) \}\)/);
  assert.match(src, /\.\.\.orderRows\(pinned, stores\)/, "row order unchanged");
});
