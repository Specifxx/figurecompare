// Owner, 2026-11-18: the Amazon row's button is Amazon amber, and the quick view carries a real "See full page" button.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("the Amazon button is amber with dark text, in both themes", () => {
  const css = read("src/app/globals.css");
  const m = /\.btn-amazon\s*\{([^}]*)\}/.exec(css);
  assert.ok(m, ".btn-amazon is defined");
  assert.match(m[1], /bg-\[#FFA41C\]/);
  assert.match(m[1], /hover:bg-\[#FA8900\]/);
  assert.match(m[1], /text-\[#111\]/);
  assert.doesNotMatch(css, /night"\]\s*\.btn-amazon/, "no night override: dark text on amber stays");
});

test("price rows give the Amazon row (priced and Check) the amber class, and never the buy colour", () => {
  const rows = read("src/components/PriceRows.tsx");
  assert.match(rows, /btn-amazon/);
  assert.match(rows, /amazon" \? "btn-amazon"/);
  assert.match(rows, /rel|OutLink/);
});

test("the quick view's full-page link is a 44px button naming price history and details", () => {
  const qv = read("src/components/QuickView.tsx");
  const m = /<Link[^>]*data-qv-full-page[^>]*>([\s\S]*?)<\/Link>/.exec(qv);
  assert.ok(m, "the See full page button exists");
  assert.match(m[0], /min-h-\[44px\]/);
  assert.match(m[1], /See full page: price history and details/);
});
