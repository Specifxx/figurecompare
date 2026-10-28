import { test } from "node:test";
import assert from "node:assert/strict";
import { ebayPick, planEbay, type EbayItem } from "@/lib/ebay";
import { dayNumber, priceOn, recordHistory } from "@/lib/history";
import type { Figure, Offer } from "@/lib/types";

const offers: Offer[] = [5999, 6499, 6999].map((p, i) => ({ s: `s${i}`, p, st: "in", u: "" }));
const item = (over: Partial<EbayItem>): EbayItem => ({ title: "Nendoroid 2345 Frieren", itemWebUrl: "https://www.ebay.com/itm/1?x=1", price: { value: "55.00", currency: "USD" }, itemLocation: { country: "JP" }, ...over });

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

test("eBay: no store reference, no eBay row", () => {
  assert.equal(ebayPick([item({})], [], "US"), null);
});

test("eBay plan: never-checked first, within budget", () => {
  const f = (jan: string, regions: string[]): Figure => ({ jan, slug: jan, name: jan, line: "nendoroid", number: null, img: null, first: "d", offers: Object.fromEntries(regions.map((r) => [r, offers])) });
  const plan = planEbay([f("a", ["US", "AU"]), f("b", ["US"])], { "a:US": "2026-10-27" }, ["US", "AU"], 2);
  assert.deepEqual(plan.map((p) => `${p.f.jan}:${p.region}`), ["a:AU", "b:US"]);
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
