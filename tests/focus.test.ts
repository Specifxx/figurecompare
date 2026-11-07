// The low-traction cull (lib/focus.ts, owner 2026-11-07): which figures are listed.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { demandSlugs, focusCatalog, sellableCompared } from "../src/lib/focus";
import type { Offer } from "../src/lib/types";

const o = (s: string, st: Offer["st"] = "in"): Offer => ({ s, p: 1000, st, u: "https://x" }) as Offer;

test("two stores that can sell it today in a region, a Japan store counting with a local one", () => {
  assert.equal(sellableCompared({ offers: { US: [o("a"), o("b", "pre")] } }), true);
  assert.equal(sellableCompared({ offers: { US: [o("a"), o("b", "out")] } }), false);
  assert.equal(sellableCompared({ offers: { UK: [o("a")], JP: [o("j")] } }), true);
  assert.equal(sellableCompared({ offers: { JP: [o("j"), o("k")] } }), false, "Japan alone is not a local page");
});

test("search demand keeps a figure; the import applies the rule and keeps history for all", () => {
  const kept = focusCatalog([{ slug: "a", offers: { US: [o("x")] } }, { slug: "b", offers: { US: [o("x")] } }], new Set(["b"]));
  assert.deepEqual(kept.map((f) => f.slug), ["b"]);
  assert.deepEqual([...demandSlugs({ "/figure/a": [1, 1, 1], "/figure/b": [0, 12, 1], "/nendoroid": [3, 99, 1] })].sort(), ["a", "b"]);
  const imp = fs.readFileSync("scripts/import.ts", "utf8");
  assert.match(imp, /focusCatalog\(merged, readDemand\(\)\)/);
  assert.match(imp, /\}\), merged, today\);/);
});
