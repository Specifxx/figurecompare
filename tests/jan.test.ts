import { test } from "node:test";
import assert from "node:assert/strict";
import { isJapaneseJan, janOf, normaliseBarcode, validEan13 } from "@/lib/jan";

test("EAN-13 check digit", () => {
  assert.equal(validEan13("4580590174528"), true);
  assert.equal(validEan13("4580590174521"), false);
  assert.equal(validEan13("458059017452"), false);
});

test("only Japanese prefixes count", () => {
  assert.equal(isJapaneseJan("4545784068991"), true); // Max Factory figma
  assert.equal(isJapaneseJan("0889698123459"), false); // a US UPC (Funko-style)
});

test("barcode, then SKU, then a labelled JAN in the text", () => {
  assert.equal(janOf({ barcode: "4580590174528" }), "4580590174528");
  assert.equal(janOf({ barcode: "", sku: "4580590174528" }), "4580590174528");
  assert.equal(janOf({ sku: "GSC-17452", text: "<p>JAN: 4580590174528</p>" }), "4580590174528");
  assert.equal(janOf({ text: "JAN Code：4545784068991" }), "4545784068991");
});

test("an unlabelled number, a bad check digit or two barcodes are not a match", () => {
  assert.equal(janOf({ text: "Item 4580590174528 ships soon" }), null);
  assert.equal(janOf({ barcode: "4580590174529" }), null);
  assert.equal(janOf({ text: "JAN: 4580590174528 / JAN: 4545784068991" }), null);
});

test("barcode normalisation", () => {
  assert.equal(normaliseBarcode(" 4580590-174528 "), "4580590174528");
  assert.equal(normaliseBarcode("ABC"), null);
});
