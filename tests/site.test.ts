import { test } from "node:test";
import assert from "node:assert/strict";
import { SISTER_SITES, regionForZone } from "@/site";
import { amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, storeUrl, subId } from "@/lib/affiliate";
import { judgeFreshness, judgeStores } from "../scripts/ops-monitor";
import { money } from "@/lib/format";
import { searchRows, type IndexRow } from "@/components/SearchBox";

test("regions from time zones, the specific one wins", () => {
  assert.equal(regionForZone("America/New_York"), "US");
  assert.equal(regionForZone("America/Toronto"), "CA");
  assert.equal(regionForZone("Europe/London"), "UK");
  assert.equal(regionForZone("Europe/Berlin"), "EU");
  assert.equal(regionForZone("Australia/Sydney"), "AU");
  assert.equal(regionForZone("Pacific/Auckland"), "NZ");
  assert.equal(regionForZone("Asia/Tokyo"), "JP");
  assert.equal(regionForZone("Asia/Kolkata"), "US");
  assert.equal(regionForZone(undefined), "US");
});

test("affiliate tags name the site, region, placement and product", () => {
  assert.equal(subId("AU", "table_pinned", "4580590174528"), "figure-au-table_pinned-4580590174528");
  const e = new URL(ebayAffiliateUrl("https://www.ebay.com.au/itm/1", "figure-au-x"));
  assert.equal(e.searchParams.get("customid"), "figure-au-x");
  assert.equal(e.searchParams.get("mkrid"), "705-53470-19255-0");
  assert.ok(e.searchParams.get("campid"));
  assert.match(ebaySearchUrl("Nendoroid Frieren", "UK", "t")!, /ebay\.co\.uk.*LH_BIN=1/);
  assert.equal(ebaySearchUrl("x", "JP", "t"), null);
  // New Zealand shops on eBay Australia (no eBay NZ in the Partner Network).
  assert.match(ebaySearchUrl("Nendoroid Frieren", "NZ", "t")!, /ebay\.com\.au.*campid=/);
  assert.match(amazonSearchUrl("x", "US", "figure-us-y")!, /tag=.*ascsubtag=figure-us-y/);
  assert.equal(amazonSearchUrl("x", "UK", "t"), null, "no UK tag yet, no Amazon UK row");
  assert.match(storeUrl("nope", "https://shop.example/p?a=1"), /utm_source=figurecompare\.com&utm_medium=referral/);
});

test("money stays in its own currency", () => {
  assert.equal(money(8995, "AU"), "A$89.95");
  assert.equal(money(6800, "JP"), "¥6,800");
  assert.equal(money(4999, "UK"), "£49.99");
});

test("the family footer lists every sister site once, on its canonical host", () => {
  const urls = SISTER_SITES.map((s) => s.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const u of ["https://riftcompare.com", "https://opcompare.app", "https://mtgcompare.app", "https://wargamecompare.com", "https://ygocompare.com"]) assert.ok(urls.includes(u), u);
  assert.ok(!urls.some((u) => u.includes("figurecompare")));
});

test("search: every word must match; a barcode finds its figure", () => {
  const rows: IndexRow[] = [
    ["a", "Nendoroid 2345 Frieren", "nendoroid", "4580590174528", {}],
    ["b", "figma 567 Makima", "figma", "4545784068991", {}],
    ["c", "POP UP PARADE Frieren L", "pop-up-parade", "4580590170001", {}],
  ];
  assert.deepEqual(searchRows(rows, "frieren").map((r) => r[0]), ["a", "c"]);
  assert.deepEqual(searchRows(rows, "nendo frieren").map((r) => r[0]), ["a"]);
  assert.deepEqual(searchRows(rows, "4545784068991").map((r) => r[0]), ["b"]);
});

test("ops monitor judgements", () => {
  const now = Date.parse("2026-10-28T12:00:00Z");
  assert.equal(judgeFreshness("2026-10-28T05:00:00Z", now).status, "ok");
  assert.equal(judgeFreshness("2026-10-27T00:00:00Z", now).status, "warn");
  assert.equal(judgeFreshness("2026-10-25T00:00:00Z", now).status, "fail");
  const run = (ok: boolean, matched = 5) => ({ ok, matched, listings: 10, refused: {}, noJan: 0, ms: 1, error: ok ? undefined : "HTTP 429" });
  assert.equal(judgeStores({ updatedAt: "", figures: 1, stores: { a: run(true), b: run(true) } }, 2).status, "ok");
  assert.equal(judgeStores({ updatedAt: "", figures: 1, stores: { a: run(false), b: run(true), c: run(true), d: run(true) } }, 4).status, "warn");
  assert.equal(judgeStores({ updatedAt: "", figures: 1, stores: { a: run(false), b: run(false), c: run(true) } }, 3).status, "fail");
  // A store with none of our lines is fine; an empty figure collection is not.
  assert.equal(judgeStores({ updatedAt: "", figures: 1, stores: { a: run(true, 0), b: run(true) } }, 2).status, "ok");
  assert.equal(judgeStores({ updatedAt: "", figures: 1, stores: { a: { ...run(true, 0), listings: 0 }, b: run(true) } }, 2).status, "warn");
});

test("one contact address everywhere (owner, 2026-10-28)", async () => {
  const fs = await import("node:fs");
  const { SITE } = await import("@/site");
  assert.equal(SITE.email, "compareempire@gmail.com");
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk("src").filter((f) => /\.(tsx?|md)$/.test(f))) {
    const other = (fs.readFileSync(f, "utf8").match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []).filter((a) => a !== SITE.email && !a.startsWith("@"));
    assert.deepEqual(other, [], `${f} has another address`);
  }
});

test("eBay strips on every page but the legal ones, labelled and sponsored (owner, 2026-10-28)", async () => {
  const fs = await import("node:fs");
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  const legal = /\/(terms|privacy|disclosure|contact)\/page\.tsx$/;
  for (const f of walk("src/app").filter((f) => /\/(page|not-found)\.tsx$/.test(f) && !legal.test(f))) {
    const src = fs.readFileSync(f, "utf8");
    const viaHub = src.includes("<LineHub") && fs.readFileSync("src/components/LineHub.tsx", "utf8").includes("<EbayStrip");
    assert.ok(src.includes("<EbayStrip") || viaHub, `${f} has no eBay strip`);
  }
  const strip = fs.readFileSync("src/components/EbayStrip.tsx", "utf8");
  assert.match(strip, /Ad · Paid link/);
  assert.ok((strip.match(/<OutLink/g) ?? []).length === (strip.match(/<OutLink[^>]*\bpaid\b/gs) ?? []).length, "every eBay link is paid (rel sponsored)");
  assert.ok(!fs.readFileSync("src/app/layout.tsx", "utf8").includes("<EbayStrip"), "no site-wide banner: one strip per page, below the content");
});

test("eBay sits beside every buy button and first in every price list (owner, 2026-10-28)", async () => {
  const fs = await import("node:fs");
  const page = fs.readFileSync("src/app/figure/[slug]/page.tsx", "utf8");
  assert.ok(page.includes('placement="hero_ebay"') && page.includes('placement="buybar_ebay"'), "hero and phone buy bar carry an eBay button");
  const table = fs.readFileSync("src/components/PriceTable.tsx", "utf8");
  assert.ok(table.indexOf('source: "ebay"') < table.indexOf("offers.map"), "the eBay row comes before the stores");
  // Owner, 2026-10-30: no wording about the order; the row is simply first.
  assert.doesNotMatch(table, /Shown first/);
});
