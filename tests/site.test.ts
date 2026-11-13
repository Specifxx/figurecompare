import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { navGroups } from "@/lib/nav";
import { regionForZone } from "@/site";
import { footerSisters } from "@/lib/family-network";
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
  assert.match(amazonSearchUrl("x", "UK", "t")!, /amazon\.co\.uk\/.*tag=compareempi03-21/, "the owner's UK account");
  assert.match(amazonSearchUrl("x", "EU", "t")!, /amazon\.de\/.*tag=compareempire-21/);
  assert.equal(amazonSearchUrl("x", "NZ", "t"), null, "no Amazon NZ");
  assert.doesNotMatch(readFileSync(new URL("../src/lib/affiliate.ts", import.meta.url), "utf8"), /AMAZON_TAG_|AMAZON_ASSOCIATE_TAG/, "tags are hard-coded");
  assert.match(amazonSearchUrl("x", "AU", "t")!, /^https:\/\/www\.amazon\.com\.au\/s\?.*tag=figurecompare-22/, "AU uses the family's AU tag");
  assert.match(storeUrl("nope", "https://shop.example/p?a=1"), /utm_source=figurecompare\.com&utm_medium=referral/);
});

test("money stays in its own currency", () => {
  assert.equal(money(8995, "AU"), "A$89.95");
  assert.equal(money(6800, "JP"), "¥6,800");
  assert.equal(money(4999, "UK"), "£49.99");
});

test("footer: no sister list, one internal link to /our-sites (owner, 2026-11-03; 2026-11-08)", () => {
  assert.deepEqual(footerSisters("figure"), []);
  const footer = readFileSync("src/components/Footer.tsx", "utf8");
  assert.doesNotMatch(footer, /footerSisters|Sister sites/);
  // 2026-11-08: one internal link to /our-sites, which lists every other family site once.
  assert.doesNotMatch(footer, /NETWORK_PAGE/);
  assert.match(footer, /href="\/our-sites"/);
  assert.doesNotMatch(readFileSync("src/app/our-sites/page.tsx", "utf8"), /nofollow|sponsored/);
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

test("the dropdown shows eight rows; the results page gets every match (Reddit, 2026-11-12)", async () => {
  const { DROPDOWN_ROWS, PAGE_ROWS } = await import("@/components/SearchBox");
  const rows: IndexRow[] = Array.from({ length: 12 }, (_, i) => [`m${i}`, `Nendoroid Puella Magi Madoka Magica - Figure ${String.fromCharCode(65 + i)}`, "nendoroid", `45805901000${String(i).padStart(2, "0")}`, {}]);
  assert.equal(searchRows(rows, "Madoka Nendoroid").length, DROPDOWN_ROWS);
  assert.equal(searchRows(rows, "Madoka Nendoroid", PAGE_ROWS + 1).length, 12);
  const fs = await import("node:fs");
  const box = fs.readFileSync("src/components/SearchBox.tsx", "utf8");
  assert.match(box, /See all/);
  assert.match(fs.readFileSync("src/app/search/page.tsx", "utf8"), /<SearchBox big autoFocus full \/>/);
  assert.match(fs.readFileSync("src/app/stores/page.tsx", "utf8"), /id="missing"/);
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
  // HobbyLink Japan seeing a handful of products means its paging broke (2026-11-13).
  assert.equal(judgeStores({ updatedAt: "", figures: 1, stores: { hlj: { ...run(true), listings: 75 }, b: run(true) } }, 2).status, "warn");
  assert.equal(judgeStores({ updatedAt: "", figures: 1, stores: { hlj: { ...run(true), listings: 6400 }, b: run(true) } }, 2).status, "ok");
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
  // The cart (owner 2026-11-06) is the visitor's own checkout list: no ad strip beside the checkout buttons.
  // /our-sites (2026-11-08) is a list of our own sites: no ad strip either.
  const legal = /\/(terms|privacy|disclosure|contact|how-we-pick-stores|list-your-store|cart|our-sites)\/page\.tsx$/;
  for (const f of walk("src/app").filter((f) => /\/(page|not-found)\.tsx$/.test(f) && !legal.test(f))) {
    const src = fs.readFileSync(f, "utf8");
    const viaHub = src.includes("<LineHub") && fs.readFileSync("src/components/LineHub.tsx", "utf8").includes("<EbayStrip");
    const viaSale = src.includes("<SaleSeasonPage") && fs.readFileSync("src/components/SaleSeasonPage.tsx", "utf8").includes("<EbayStrip");
    assert.ok(src.includes("<EbayStrip") || viaHub || viaSale, `${f} has no eBay strip`);
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

test("buy_click sends exactly retailer + placement, like the sister sites (Vercel Pro keeps two properties)", async () => {
  const fs = await import("node:fs");
  const out = fs.readFileSync("src/components/OutLink.tsx", "utf8");
  const call = out.slice(out.indexOf('track("buy_click"'), out.indexOf("});", out.indexOf('track("buy_click"')));
  assert.match(call, /retailer:/);
  assert.match(call, /placement:/);
  assert.equal((call.match(/^\s+\w+:/gm) ?? []).length, 2, "exactly two properties");
  assert.match(fs.readFileSync("src/app/layout.tsx", "utf8"), /<Analytics/);
});

test("navigation (Bill, 2026-11-09): series and characters one tap from every page, and from each line's hub", () => {
  const header = readFileSync("src/components/Header.tsx", "utf8");
  assert.match(header, /"\/series"/);
  assert.match(header, /"\/characters"/);
  const hub = readFileSync("src/components/LineHub.tsx", "utf8");
  assert.match(hub, /by series/);
  assert.match(hub, /by character/);
  const groups = navGroups({ nendoroid: 1, figma: 1, "pop-up-parade": 1 } as never, [{ slug: "hololive", name: "hololive" }]);
  const hrefs = groups.flatMap((g) => g.links.map((l) => l.href));
  assert.ok(hrefs.includes("/series/hololive") && hrefs.includes("/series") && hrefs.includes("/characters"));
});

test("header mega menus (Bill, 2026-11-09): built from the nav groups, empty markets dropped, keyboard and region support", async () => {
  const { headerMenus } = await import("@/lib/nav");
  const groups = navGroups({ nendoroid: 1, figma: 1, "pop-up-parade": 1 } as never, [{ slug: "hololive", name: "hololive" }]);
  const menus = headerMenus(groups, {
    lineRegions: { nendoroid: ["US"], figma: [] },
    series: [{ href: "/series/a", label: "A" }, { href: "/series/none", label: "None", regions: [] }],
    characters: [{ href: "/character/b", label: "B", regions: ["US", "JP"] }],
  });
  assert.ok(menus.length <= 7);
  const flat = menus.flatMap((m) => m.columns.flatMap((c) => c.links));
  assert.ok(!flat.some((l) => l.href === "/series/none" || l.href === "/figma"), "a link with no figures anywhere is left out");
  assert.deepEqual(flat.find((l) => l.href === "/nendoroid")!.regions, ["US"]);
  const dest = new Set(groups.flatMap((g) => g.links.map((l) => l.href)));
  for (const m of menus) assert.ok(dest.has(m.all.href), m.all.href);
  const comp = readFileSync("src/components/HeaderMenus.tsx", "utf8");
  assert.match(comp, /Escape/);
  assert.match(comp, /aria-expanded/);
  assert.match(comp, /rp-\$\{r\}/);
});
