import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanName, lineOf, numberOf, pickName, readTitle } from "@/lib/title";

const ok = (t: string) => {
  const r = readTitle(t);
  assert.ok(!("refused" in r), `${t} was refused: ${"refused" in r ? r.refused : ""}`);
  return r as Exclude<typeof r, { refused: string }>;
};
const refused = (t: string, why: string) => assert.deepEqual(readTitle(t), { refused: why }, t);

test("lines", () => {
  assert.equal(lineOf("Nendoroid 2345 Frieren"), "nendoroid");
  assert.equal(lineOf("figma 567 Makima"), "figma");
  assert.equal(lineOf("POP UP PARADE Frieren L Size"), "pop-up-parade");
  assert.equal(lineOf("Pop Up Parade Anya Forger"), "pop-up-parade");
  assert.equal(lineOf("Kotobukiya ARTFX J 1/8 scale"), null);
  assert.equal(lineOf("Configma figure stand"), null);
});

test("catalogue numbers", () => {
  assert.equal(numberOf("Nendoroid #1234 Rem", "nendoroid"), "1234");
  assert.equal(numberOf("Nendoroid No.1234-DX Rem", "nendoroid"), "1234-DX");
  assert.equal(numberOf("Nendoroid 1234b Ram", "nendoroid"), "1234-B");
  assert.equal(numberOf("figma 567 Makima", "figma"), "567");
  assert.equal(numberOf("figma SP-154 Ritsu", "figma"), "SP-154");
  assert.equal(numberOf("Nendoroid Frieren", "nendoroid"), null);
});

test("pre-orders are read from the title", () => {
  assert.equal(ok("[PRE-ORDER] Nendoroid 2345 Frieren").preorder, true);
  assert.equal(ok("Nendoroid 2345 Frieren (Preorder, ETA Mar 2027)").preorder, true);
  assert.equal(ok("Nendoroid 2345 Frieren").preorder, false);
});

test("not figures: accessories, parts, plush, dolls", () => {
  refused("Nendoroid More Face Swap 03", "accessory");
  refused("Nendoroid Plus Plushie Series Rem", "accessory");
  refused("Nendoroid Doll Outfit Set Frieren", "accessory");
  refused("Nendoroid Swacchao! Hatsune Miku", "accessory");
  refused("figma Styles Hoodie", "accessory");
  refused("Nendoroid 2345 Frieren Acrylic Stand", "accessory");
});

test("not new or not one figure", () => {
  refused("Nendoroid 2345 Frieren (Pre-owned)", "pre-owned");
  refused("figma 567 Makima - Used, box opened", "pre-owned");
  refused("Nendoroid 1234 Rem [Box Damaged]", "damaged");
  refused("Nendoroid 1234 Rem bootleg", "bootleg");
  refused("Nendoroid 1234 Rem + Nendoroid 1235 Ram", "bundle");
  refused("Nendoroid Lucky Bag 2026", "lucky-bag");
});

test("clean names", () => {
  assert.equal(cleanName("[PRE-ORDER] Good Smile Company Nendoroid 2345 Frieren (ETA Mar 2027)"), "Nendoroid 2345 Frieren");
  assert.equal(cleanName("【予約】NENDOROID 2345 FRIEREN"), "Nendoroid 2345 Frieren");
  assert.equal(cleanName("Max Factory figma 567 Makima - Chainsaw Man"), "figma 567 Makima - Chainsaw Man");
});

test("the most common name wins", () => {
  assert.equal(
    pickName(["Nendoroid 2345 Frieren", "[PRE-ORDER] Nendoroid 2345 Frieren", "Nendoroid Frieren - Frieren: Beyond Journey's End"], "2345"),
    "Nendoroid 2345 Frieren",
  );
});
