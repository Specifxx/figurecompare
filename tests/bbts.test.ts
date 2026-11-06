// BigBadToyStore: the one store matched by catalogue number and name, not barcode (DECISIONS.md, 2026-11-06).
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Store } from "@/content/stores";
import { indexByNumber, listingFromBbts, nameTokens, parseProductPage, slugKey } from "@/lib/import/bbts";
import type { Listing } from "@/lib/types";

const bbts: Store = { id: "bigbadtoystore", name: "BigBadToyStore", region: "US", base: "https://www.bigbadtoystore.com", platform: "bbts" };
const L = (title: string, jan: string, store = "a"): Listing => ({ store, region: "US", title, jan, cents: 5999, st: "in", url: "https://a.example/p", img: null });

// A real product page's JSON-LD (2026-11-06), cut to what the reader uses.
const page = (name: string, offers: string) =>
  `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":${JSON.stringify(name)},"productID":"191877","image":"https://images.bigbadtoystore.com/images/product/191877/x/original.jpg","offers":[${offers}]}</script></head></html>`;
const offer = (name: string, price: number, availability: string) =>
  `{"@type":"Offer","availability":"https://schema.org/${availability}","itemCondition":"https://schema.org/NewCondition","name":${JSON.stringify(name)},"price":${price},"priceCurrency":"USD","sku":"376235"}`;

test("slugs: the line and number BigBadToyStore writes into its product URLs", () => {
  assert.deepEqual(slugKey("https://www.bigbadtoystore.com/product/doki-doki-literature-club-nendoroid-no1817-monika-101589"), { line: "nendoroid", number: "1817" });
  assert.deepEqual(slugKey("https://www.bigbadtoystore.com/product/fate_grand-order-figma-no560-berserker-miyamoto-musashi-101256"), { line: "figma", number: "560" });
  assert.deepEqual(slugKey("https://www.bigbadtoystore.com/product/table-museum-annex-figma-sp-148-shakoki-dogu-104114"), { line: "figma", number: "SP-148" });
  assert.deepEqual(slugKey("https://www.bigbadtoystore.com/product/vocaloid-figma-ex-066-snow-miku-grand-voyage-ver-101728"), { line: "figma", number: "EX-066" });
  assert.deepEqual(slugKey("https://www.bigbadtoystore.com/product/figma-no490-horse-chestnut-version-2_0-reissue-105005"), { line: "figma", number: "490" });
  // No number: never a candidate. Swacchao, Doll and More are not figures either.
  assert.equal(slugKey("https://www.bigbadtoystore.com/product/demon-slayer-kimetsu-yaiba-nendoroid-swacchao-giyu-tomioka-101807"), null);
  assert.equal(slugKey("https://www.bigbadtoystore.com/product/nendoroid-doll-alice-another-color-ver-101940"), null);
  assert.equal(slugKey("https://www.bigbadtoystore.com/product/some-pop-up-parade-figure-123456"), null);
});

test("the number index keeps a number that belongs to exactly one barcode", () => {
  const idx = indexByNumber([
    L("Nendoroid 1817 Monika", "4580590123456"),
    L("Doki Doki Literature Club! Nendoroid Monika #1817", "4580590123456", "b"),
    // One number, two JANs (a re-release a store filed under the old number): dropped, not guessed.
    L("Nendoroid 1000 Hatsune Miku", "4545784000001"),
    L("Nendoroid 1000 Hatsune Miku (re-run)", "4545784000002", "b"),
    // POP UP PARADE has no number.
    L("POP UP PARADE Monika", "4580590999999"),
  ]);
  assert.deepEqual(Object.keys(idx), ["nendoroid:1817"]);
  assert.equal(idx["nendoroid:1817"].jan, "4580590123456");
  assert.ok(idx["nendoroid:1817"].tokens.has("monika"));
  assert.ok(!idx["nendoroid:1817"].tokens.has("nendoroid"));
});

test("name words: line words, filler and numbers are not compared", () => {
  assert.deepEqual([...nameTokens("Nendoroid Fuwawa Abyssgard Ver. 2.0 figure")], ["fuwawa", "abyssgard"]);
});

test("a product page: the JSON-LD's name, photo and new offers", () => {
  const p = parseProductPage(page("Hololive Production Nendoroid No.2918 Fuwawa Abyssgard", `${offer("BBTS Mint Packaging: …", 53.99, "PreOrder")},${offer("BBTS Mint Pro Packaging: …", 56.99, "PreOrder")}`));
  assert.equal(p?.name, "Hololive Production Nendoroid No.2918 Fuwawa Abyssgard");
  assert.equal(p?.offers.length, 2);
  assert.equal(parseProductPage("<html><body>no data</body></html>"), null);
});

test("a listing attaches to the figure whose number AND a name word agree; the cheapest packaging grade is the offer", () => {
  const idx = indexByNumber([L("Nendoroid 2918 Fuwawa Abyssgard", "4580590220003"), L("Nendoroid 1817 Monika", "4580590123456")]);
  const url = "https://www.bigbadtoystore.com/product/hololive-production-nendoroid-no2918-fuwawa-abyssgard-191877";
  const p = parseProductPage(page("Hololive Production Nendoroid No.2918 Fuwawa Abyssgard", `${offer("BBTS Mint Pro Packaging", 56.99, "PreOrder")},${offer("BBTS Mint Packaging", 53.99, "PreOrder")}`))!;
  const l = listingFromBbts(bbts, url, p, idx);
  assert.ok("jan" in l);
  assert.equal(l.jan, "4580590220003");
  assert.equal(l.cents, 5399);
  assert.equal(l.st, "pre");
  assert.equal(l.url, url);
  assert.equal(l.store, "bigbadtoystore");
  // Sold out: still a listing (the page shows "Last seen"), as out.
  const out = listingFromBbts(bbts, url, parseProductPage(page("Doki Doki Literature Club! Nendoroid No.1817 Monika", offer("BBTS Mint Packaging", 80.99, "OutOfStock")))!, idx);
  assert.ok("jan" in out && out.st === "out" && out.cents === 8099);
});

test("refused: a number the catalogue lacks, a name that disagrees, a doll, a foreign price, POP UP PARADE", () => {
  const idx = indexByNumber([L("Nendoroid 2918 Fuwawa Abyssgard", "4580590220003")]);
  const u = "https://www.bigbadtoystore.com/product/x-1";
  const o = offer("BBTS Mint Packaging", 50, "InStock");
  assert.deepEqual(listingFromBbts(bbts, u, parseProductPage(page("Nendoroid No.2919 Mococo Abyssgard", o))!, idx), { noMatch: true });
  // The store typed 2918 on another character: the name does not agree.
  assert.deepEqual(listingFromBbts(bbts, u, parseProductPage(page("Blue Archive Nendoroid No.2918 Mika Misono", o))!, idx), { refused: "name" });
  assert.deepEqual(listingFromBbts(bbts, u, parseProductPage(page("Nendoroid Doll No.2918 Fuwawa Abyssgard", o))!, idx), { refused: "accessory" });
  assert.deepEqual(listingFromBbts(bbts, u, parseProductPage(page("POP UP PARADE Fuwawa Abyssgard", o))!, idx), { noMatch: true });
  const eur = o.replace('"priceCurrency":"USD"', '"priceCurrency":"EUR"');
  assert.deepEqual(listingFromBbts(bbts, u, parseProductPage(page("Nendoroid No.2918 Fuwawa Abyssgard", eur))!, idx), { refused: "currency" });
});
