// Yen converted for the Japan table, and HobbyLink Japan's reader (DECISIONS.md, 2026-11-06).
import assert from "node:assert/strict";
import { test } from "node:test";
import { convertYen, fxUsable, FX_TARGETS, type Fx } from "@/lib/fx";
import { orderableStatus, parseProductPage, parseSearchPage, searchUrl } from "@/lib/import/hlj";
import { mergeListings } from "@/lib/merge";
import type { Listing } from "@/lib/types";

const NOW = Date.parse("2026-11-06T06:00:00Z");
const fx: Fx = { at: "2026-11-06T05:30:00Z", date: "2026-11-05", rates: { USD: 0.0066, GBP: 0.0051, CAD: 0.0091, AUD: 0.0101, NZD: 0.011, EUR: 0.0061, SGD: 0.0087 } };

test("yen converts into the region's cents at the day's rate; stale or missing rates convert nothing", () => {
  assert.equal(convertYen(6182, "US", fx, NOW), 4080); // ¥6,182 × 0.0066 = $40.80
  assert.equal(convertYen(6182, "AU", fx, NOW), 6244);
  assert.equal(convertYen(6182, "US", { ...fx, at: "2026-10-20T00:00:00Z" }, NOW), null);
  assert.equal(convertYen(6182, "US", null, NOW), null);
  assert.equal(convertYen(6182, "US", { ...fx, rates: { EUR: 0.0061 } }, NOW), null);
  assert.ok(fxUsable(fx, NOW));
  assert.ok(!FX_TARGETS.includes("JPY") && FX_TARGETS.includes("USD"));
});

const L = (store: string, region: Listing["region"], cents: number): Listing => ({ store, region, title: "Nendoroid 2918 Fuwawa Abyssgard", jan: "4580590220003", cents, st: "in", url: `https://${store}.example/p`, img: null });

test("one local store plus one Japan store is a figure page; a Japan store alone is not", () => {
  const fresh = () => ({ slugs: {}, first: {} });
  const out = mergeListings([L("a", "US", 5399), L("hlj", "JP", 6182)], fresh(), "2026-11-06");
  assert.equal(out.length, 1);
  assert.equal(out[0].offers.JP?.[0].p, 6182);
  assert.equal(out[0].offers.US?.length, 1);
  assert.equal(mergeListings([L("hlj", "JP", 6182)], fresh(), "2026-11-06").length, 0);
  assert.equal(mergeListings([L("a", "US", 5399)], fresh(), "2026-11-06").length, 0);
});

// Cut from the real pages, 2026-11-06.
const search = `
  <input id="en_name_GSC58608" class="en_name" hidden="hidden" value="Nendoroid Ui">
  <input id="item_status_GSC58608" class="en_name" hidden="hidden" value="preorder">
  <div class="search-widget-block"><a class="item-img-wrapper" href="/nendoroid-ui-gsc58608"><img src="x"/></a></div>
  <input id="en_name_GSC20877" class="en_name" hidden="hidden" value="Nendoroid Plus: Hatsune Miku Rubber Mascot">
  <input id="item_status_GSC20877" class="en_name" hidden="hidden" value="instock">
  <div class="search-widget-block"><a class="item-img-wrapper" href="/nendoroid-plus-hatsune-miku-rubber-mascot-gsc20877"><img src="y"/></a></div>`;

test("an HLJ search page gives each item's code, path, English name and stock word", () => {
  const items = parseSearchPage(search);
  assert.deepEqual(items[0], { code: "GSC58608", path: "/nendoroid-ui-gsc58608", name: "Nendoroid Ui", status: "preorder" });
  assert.equal(items.length, 2);
  assert.ok(orderableStatus("preorder") && orderableStatus("instock") && orderableStatus("backorder"));
  assert.ok(!orderableStatus("soldout") && !orderableStatus("discontinued"));
});

const product = (offer: string, gtin = "4570232586086") =>
  `<script type="application/ld+json">{"@context":"http://schema.org/","@type":"Product","name":"Nendoroid Ui","productID":"GSC58608","sku":"GSC58608","gtin13":"${gtin}","image":"https://www.hlj.com/productimages/gsc/gsc58608_0.jpg","offers":${offer}}</script>`;

test("an HLJ product page gives the JAN, the yen price and the stock from its JSON-LD", () => {
  const p = parseProductPage(product(`{"@type":"Offer","availability":"https://schema.org/PreOrder","itemCondition":"http://schema.org/NewCondition","price":"6182","priceCurrency":"JPY"}`));
  assert.deepEqual(p, { name: "Nendoroid Ui", jan: "4570232586086", yen: 6182, st: "pre", img: "https://www.hlj.com/productimages/gsc/gsc58608_0.jpg" });
  assert.equal(parseProductPage(product(`{"@type":"Offer","availability":"https://schema.org/OutOfStock","price":"6182","priceCurrency":"JPY"}`))?.st, "out");
  // Not a Japanese barcode: no JAN, so no listing (the barcode rule).
  assert.equal(parseProductPage(product(`{"@type":"Offer","price":"6182","priceCurrency":"JPY"}`, "0123456789012"))?.jan, null);
  // A price not in yen is never read as yen.
  assert.equal(parseProductPage(product(`{"@type":"Offer","price":"41.00","priceCurrency":"USD"}`)), null);
  assert.equal(parseProductPage("<html></html>"), null);
});

test("HLJ's search pages are asked with a capital Page: a lower-case page repeats page 1 (2026-11-13)", () => {
  assert.equal(searchUrl("https://www.hlj.com", "pop up parade", 3), "https://www.hlj.com/search/?q=pop%20up%20parade&Page=3");
  assert.ok(!/[?&]page=/.test(searchUrl("https://www.hlj.com", "nendoroid", 2)));
});
