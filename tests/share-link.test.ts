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

// Share-for-a-deal (owner, 2026-11-18).
import { pickShareArm } from "../src/components/ShareThanks";
test("the share-for-a-deal arm is drawn once, half and half, and kept; the thank-you points to the free deals page", async () => {
  assert.equal(pickShareArm(null, 0.2), "reward");
  assert.equal(pickShareArm(null, 0.8), "plain");
  assert.equal(pickShareArm("plain", 0.2), "plain");
  const src = (await import("node:fs")).readFileSync("src/components/ShareButton.tsx", "utf8");
  assert.match(src, /<ShareThanks href="\/deals"/);
  assert.match(src, /track\("share", \{ medium, arm \}\)/);
});
