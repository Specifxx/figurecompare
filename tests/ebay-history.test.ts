import { test } from "node:test";
import assert from "node:assert/strict";
import { ebayPick, planEbay, type EbayItem } from "@/lib/ebay";
import { dayNumber, priceOn, recordHistory } from "@/lib/history";
import type { Figure, Offer } from "@/lib/types";

const offers: Offer[] = [5999, 6499, 6999].map((p, i) => ({ s: `s${i}`, p, st: "in", u: "" }));
const item = (over: Partial<EbayItem>): EbayItem => ({ title: "Nendoroid 2345 Frieren", itemWebUrl: "https://www.ebay.com/itm/1?x=1", price: { value: "55.00", currency: "USD" }, itemLocation: { country: "US" }, shippingOptions: [{ shippingCost: { value: "0.00", currency: "USD" } }], ...over });

test("eBay: cheapest believable new listing", () => {
  const pick = ebayPick([item({}), item({ price: { value: "52.00", currency: "USD" }, itemWebUrl: "https://www.ebay.com/itm/2" })], offers, "US");
  assert.equal(pick?.p, 5200);
  assert.equal(pick?.u, "https://www.ebay.com/itm/2");
});

test("eBay: bootleg origins, too-cheap, pre-owned and other currencies are out", () => {
  assert.equal(ebayPick([item({ itemLocation: { country: "CN" } })], offers, "US"), null);
  assert.equal(ebayPick([item({ price: { value: "19.99", currency: "USD" } })], offers, "US"), null);
  assert.equal(ebayPick([item({ title: "Nendoroid 2345 Frieren used loose" })], offers, "US"), null);
  assert.equal(ebayPick([item({ price: { value: "55.00", currency: "AUD" } })], offers, "US"), null);
});

test("eBay: local sellers only, postage stated, priced and ranked delivered (visitor feedback 2026-10-31)", () => {
  const ship = (value: string, currency = "USD") => ({ shippingOptions: [{ shippingCost: { value, currency } }] });
  assert.ok(ebayPick([item({ itemLocation: { country: "JP" } })], offers, "US"), "a seller in Japan, the products' home country, stays (priced with postage)");
  assert.equal(ebayPick([item({ itemLocation: { country: "GB" } })], offers, "US"), null, "a UK seller for a US buyer");
  assert.equal(ebayPick([item({ shippingOptions: [{}] })], offers, "US"), null, "calculated postage");
  assert.equal(ebayPick([item({ shippingOptions: undefined })], offers, "US"), null, "no postage at all");
  assert.equal(ebayPick([item(ship("5.00", "JPY"))], offers, "US"), null, "postage in another currency");
  const pick = ebayPick([item({ price: { value: "50.00", currency: "USD" }, ...ship("15.00") }), item({ price: { value: "55.00", currency: "USD" }, ...ship("4.00"), itemWebUrl: "https://www.ebay.com/itm/3" })], offers, "US");
  assert.equal(pick?.u, "https://www.ebay.com/itm/3", "the cheapest delivered, not the cheapest item");
  assert.equal(pick?.p, 5900);
  assert.equal(pick?.sh, 400);
  const eu = (country: string) => item({ price: { value: "55.00", currency: "EUR" }, itemLocation: { country }, ...ship("4.90", "EUR") });
  const euOffers = offers.map((o) => ({ ...o }));
  assert.ok(ebayPick([eu("FR")], euOffers, "EU"), "a French seller for an EU buyer");
  assert.equal(ebayPick([eu("GB")], euOffers, "EU"), null, "a UK seller is outside the EU");
});

test("eBay: no store reference, no eBay row", () => {
  assert.equal(ebayPick([item({})], [], "US"), null);
});

test("eBay plan: never-checked first, within budget", () => {
  const f = (jan: string, regions: string[]): Figure => ({ jan, slug: jan, name: jan, line: "nendoroid", number: null, img: null, first: "d", offers: Object.fromEntries(regions.map((r) => [r, offers])) });
  const plan = planEbay([f("a", ["US", "AU"]), f("b", ["US"])], { "a:US": "2026-10-27" }, ["US", "AU"], 2);
  assert.deepEqual(plan.map((p) => `${p.f.jan}:${p.region}`), ["b:US", "a:AU"], "never-checked first, the US before other regions");
});

test("eBay plan: the US comes round first and a day sooner (owner, 2026-11-01)", () => {
  const f = (jan: string, regions: string[]): Figure => ({ jan, slug: jan, name: jan, line: "nendoroid", number: null, img: null, first: "d", offers: Object.fromEntries(regions.map((r) => [r, offers])) });
  const figs = [f("a", ["US", "UK"]), f("b", ["US", "UK"])];
  // Checked on the same day: the US first.
  assert.deepEqual(planEbay(figs, { "a:US": "2026-10-28", "a:UK": "2026-10-28", "b:US": "2026-10-30", "b:UK": "2026-10-30" }, ["US", "UK"], 2).map((p) => `${p.f.jan}:${p.region}`), ["a:US", "a:UK"]);
  // A US check a day newer still ties with the older UK one, and wins it.
  assert.deepEqual(planEbay(figs, { "a:US": "2026-10-29", "a:UK": "2026-10-28", "b:US": "2026-10-30", "b:UK": "2026-10-30" }, ["US", "UK"], 1).map((p) => `${p.f.jan}:${p.region}`), ["a:US"]);
  // Two days newer does not: coverage of the other regions still turns over.
  assert.deepEqual(planEbay(figs, { "a:US": "2026-10-30", "a:UK": "2026-10-28", "b:US": "2026-10-30", "b:UK": "2026-10-30" }, ["US", "UK"], 1).map((p) => `${p.f.jan}:${p.region}`), ["a:UK"]);
});

test("history records only changes and reads back by day", () => {
  const fig: Figure = { jan: "j", slug: "j", name: "j", line: "figma", number: null, img: null, first: "d", offers: { US: offers } };
  let h = recordHistory({}, [fig], "2026-10-01");
  h = recordHistory(h, [fig], "2026-10-02");
  assert.equal(h.j.US!.length, 1);
  h = recordHistory(h, [{ ...fig, offers: { US: [{ ...offers[0], p: 5499 }] } }], "2026-10-05");
  assert.deepEqual(h.j.US, [[dayNumber("2026-10-01"), 5999], [dayNumber("2026-10-05"), 5499]]);
  assert.equal(priceOn(h.j.US, dayNumber("2026-10-03")), 5999);
});

test("sold-out everywhere records nothing", () => {
  const fig: Figure = { jan: "k", slug: "k", name: "k", line: "figma", number: null, img: null, first: "d", offers: { US: [{ ...offers[0], st: "out" }] } };
  assert.deepEqual(recordHistory({}, [fig], "2026-10-01"), { k: {} });
});
