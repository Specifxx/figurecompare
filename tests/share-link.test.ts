import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { priceGap, shareUrl } from "../src/lib/share-link";

// Word of mouth (DECISIONS.md, "Share buttons", 2026-11-02): client-side only, no new function.
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("every shared link carries utm_source=share", () => {
  assert.equal(shareUrl("https://figurecompare.com", "/figure/x", "figure"), "https://figurecompare.com/figure/x?utm_source=share&utm_medium=figure");
});

test("the price gap needs two stores and a real spread", () => {
  assert.equal(priceGap([{ priceCents: 5000, storeName: "A" }, { priceCents: 4000, storeName: "B" }])!.pct, 20);
  assert.equal(priceGap([{ priceCents: 5000, storeName: "A" }, { priceCents: 4000, storeName: "A" }]), null);
});

test("the share button is on the figure page and the quick view, and adds no function", () => {
  assert.match(read("src/app/figure/[slug]/page.tsx"), /<ShareButton /);
  assert.match(read("src/components/QuickView.tsx"), /<ShareButton /);
  assert.match(read("src/app/layout.tsx"), /<ShareArrival \/>/);
  assert.match(read("src/app/q/[slug]/route.ts"), /force-static/);
});
