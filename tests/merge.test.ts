import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeListings, saneOffers, type MergeState } from "@/lib/merge";
import type { Listing } from "@/lib/types";

const L = (store: string, region: Listing["region"], cents: number, extra: Partial<Listing> = {}): Listing => ({
  store,
  region,
  title: "Nendoroid 2345 Frieren",
  jan: "4580590174528",
  cents,
  st: "in",
  url: `https://${store}.example/p`,
  img: null,
  ...extra,
});
const fresh = (): MergeState => ({ slugs: {}, first: {} });

test("one figure per JAN, kept when 2+ stores in one region sell it", () => {
  const out = mergeListings([L("a", "US", 5999), L("b", "US", 6499), L("c", "AU", 8995)], fresh(), "2026-10-28");
  assert.equal(out.length, 1);
  assert.equal(out[0].offers.US!.length, 2);
  assert.equal(out[0].offers.AU!.length, 1, "a single offer elsewhere is still shown");
  assert.equal(out[0].first, "2026-10-28");
});

test("one store in each region is not a comparison", () => {
  assert.equal(mergeListings([L("a", "US", 5999), L("c", "AU", 8995)], fresh(), "2026-10-28").length, 0);
});

test("a store listing a JAN twice counts once, its orderable cheapest copy", () => {
  const out = mergeListings([L("a", "US", 5999, { st: "out" }), L("a", "US", 6999), L("b", "US", 6499)], fresh(), "2026-10-28");
  assert.deepEqual(out[0].offers.US!.map((o) => [o.s, o.p]), [["b", 6499], ["a", 6999]]);
});

test("orderable first, then cheapest", () => {
  const out = mergeListings([L("a", "US", 4999, { st: "out" }), L("b", "US", 6499, { st: "pre" }), L("c", "US", 6999)], fresh(), "2026-10-28");
  assert.deepEqual(out[0].offers.US!.map((o) => o.s), ["c", "b", "a"]);
});

test("a JAN filed under two lines keeps the majority; a tie is dropped", () => {
  const fig = { title: "figma 567 Frieren" };
  assert.equal(mergeListings([L("a", "US", 5999), L("b", "US", 6499), L("c", "US", 6000, fig)], fresh(), "d")[0].offers.US!.length, 2);
  assert.equal(mergeListings([L("a", "US", 5999), L("c", "US", 6000, fig)], fresh(), "d").length, 0);
});

test("prices far from the median are dropped (3+ stores)", () => {
  const offers = [5999, 6299, 6499, 1500, 25000].map((p, i) => ({ s: String(i), p, st: "in" as const, u: "" }));
  assert.deepEqual(saneOffers(offers).map((o) => o.p), [5999, 6299, 6499]);
});

test("slugs are kept forever and never collide", () => {
  const state = fresh();
  const a = mergeListings([L("a", "US", 5999), L("b", "US", 6499)], state, "d")[0];
  const again = mergeListings([L("a", "US", 5999, { title: "Nendoroid 2345 Frieren Renamed" }), L("b", "US", 6499, { title: "Nendoroid 2345 Frieren Renamed" })], state, "e")[0];
  assert.equal(again.slug, a.slug);
  assert.equal(again.first, "d");
  const other = mergeListings([L("a", "US", 5999, { jan: "4545784068991" }), L("b", "US", 6499, { jan: "4545784068991" })], state, "e")[0];
  assert.notEqual(other.slug, a.slug);
});

test("names prefer English listings outside Japan and always say the line", () => {
  const out = mergeListings(
    [L("a", "JP", 6800, { title: "ねんどろいど 2345 フリーレン" }), L("b", "JP", 7000, { title: "ねんどろいど 2345 フリーレン" }), L("c", "US", 5999, { title: "Frieren Nendoroid 2345" })],
    fresh(),
    "d",
  );
  assert.equal(out[0].name, "Frieren Nendoroid 2345");
});
