// The sitemap stops churning (DECISIONS.md 2026-11-14): a sticky core, truthful lastmod, series hubs that do not flicker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { figureLastmod, nextCore, sitemapFigures } from "../src/lib/index-tiers";
import { SERIES_KEEP, SERIES_MIN, seriesIsLive } from "../src/content/series";
import { dayNumber } from "../src/lib/history";
import type { Figure, Offer } from "../src/lib/types";

const offer = (st: Offer["st"] = "in"): Offer => ({ s: "a", p: 1000, st, u: "https://example.com" });
const fig = (jan: string, us: number, st: Offer["st"] = "in"): Figure => ({ jan, slug: `f-${jan}`, name: jan, line: "nendoroid", number: null, img: null, first: "2026-10-29", offers: { US: Array.from({ length: us }, () => offer(st)) } });

test("a figure in the core stays while it is indexable, whatever the ranking says today", () => {
  const all = [fig("1", 2), fig("2", 9), fig("3", 8), fig("4", 7)];
  assert.deepEqual(nextCore([], all, 2), ["2", "3"]);
  // "1" was in yesterday's core: it stays although three figures now outrank it.
  assert.deepEqual(nextCore(["1", "2"], all, 2), ["1", "2"]);
});

test("a core figure that sold out, fell to one store or left the catalogue gives its place to the ranking", () => {
  const all = [fig("1", 2, "out"), fig("2", 1), fig("3", 5), fig("4", 4), fig("5", 3)];
  assert.deepEqual(nextCore(["1", "2", "gone", "5"], all, 3), ["5", "3", "4"]);
  assert.deepEqual(nextCore(["5", "5", "3"], all, 3), ["5", "3", "4"]);
});

test("the sitemap lists the stored core, and never a page that is noindex or gone", () => {
  const all = [fig("1", 2), fig("2", 9), fig("3", 2, "out")];
  assert.deepEqual(sitemapFigures(all, ["1", "3", "gone"]).map((f) => f.jan), ["1"]);
  // No stored core (a fixture, the first run): the ranking alone.
  assert.deepEqual(sitemapFigures(all, null).map((f) => f.jan), ["2", "1"]);
  assert.deepEqual(sitemapFigures(all, []).map((f) => f.jan), ["2", "1"]);
});

test("a figure's lastmod is the day its lowest price last changed, never today's date by default", () => {
  const f = fig("1", 2);
  const history = { "1": { US: [[dayNumber("2026-11-01"), 1000], [dayNumber("2026-11-09"), 900]] as [number, number][], UK: [[dayNumber("2026-11-03"), 800]] as [number, number][] } };
  assert.equal(figureLastmod(f, history, "2026-11-14"), "2026-11-09");
  assert.equal(figureLastmod(f, {}, "2026-11-14"), "2026-10-29");
  // Never a date after the import's own day.
  assert.equal(figureLastmod(f, history, "2026-11-05"), "2026-11-05");
});

test("a series hub with a page keeps it down to SERIES_KEEP figures; a new hub still needs SERIES_MIN", () => {
  assert.ok(SERIES_KEEP < SERIES_MIN);
  assert.equal(seriesIsLive(SERIES_MIN, false), true);
  assert.equal(seriesIsLive(SERIES_MIN - 1, false), false);
  assert.equal(seriesIsLive(SERIES_MIN - 1, true), true);
  assert.equal(seriesIsLive(SERIES_KEEP, true), true);
  assert.equal(seriesIsLive(SERIES_KEEP - 1, true), false);
});

test("the import writes what the sitemap reads, and fixed pages carry no made-up lastmod", () => {
  const imp = readFileSync("scripts/import.ts", "utf8");
  assert.match(imp, /write\("public\/pages\.json"/);
  assert.match(imp, /nextCore\(prevPages\.core \?\? \[\], figures\)/);
  const sm = readFileSync("src/app/sitemap.ts", "utf8");
  assert.match(sm, /getPageState\(\)\?\.core/);
  for (const p of ["/about", "/contact", "/how-we-pick-stores", "/list-your-store"]) assert.ok(sm.includes(`fixed("${p}"`), p);
  assert.match(sm, /u\(`\/figure\/\$\{f\.slug\}`, 0\.7, figureDay\(f\)\)/);
});
