import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanName, lineOf, numberOf, pickName, readTitle, tidyName } from "@/lib/title";

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

test("catalogue numbers where stores put them", () => {
  assert.equal(numberOf("1183 Nendoroid Figure Hunter x Hunter - Gon Freecss", "nendoroid"), "1183");
  assert.equal(numberOf("Nendoroid - 1596 Dark Magician Girl - Yu-Gi-Oh!", "nendoroid"), "1596");
  assert.equal(numberOf("(Stellar Blade) EVE | Nendoroid #2932", "nendoroid"), "2932");
  assert.equal(numberOf("DEATH NOTE: Nendoroid Misa Amane 2.0", "nendoroid"), null);
  assert.equal(numberOf("Kaiju No. 8 Nendoroid Kafka Hibino", "nendoroid"), null);
  assert.equal(numberOf("Avatar The Last Airbender Nendoroid - Aang - 1867", "nendoroid"), "1867");
  assert.equal(numberOf("Nendoroid 0544 Kirby", "nendoroid"), "544");
  assert.equal(numberOf("Nendoroid Hatsune Miku 3.0", "nendoroid"), null);
  assert.equal(numberOf("Hatsune Miku GT Project Nendoroid Racing Miku 2024", "nendoroid"), null);
});

test("every store's title becomes one name shape", () => {
  const t = (title: string, line: Parameters<typeof tidyName>[1], n: string | null) => tidyName(title, line, n);
  // Real titles from the 2026-10-28 first import.
  assert.equal(t("(Stellar Blade) EVE | Nendoroid #2932", "nendoroid", "2932"), "Nendoroid EVE (Stellar Blade)");
  assert.equal(t("1560 Chainsaw Man Nendoroid Denji", "nendoroid", "1560"), "Nendoroid Chainsaw Man - Denji");
  assert.equal(t("Nendoroid - 2582 Zhongli - Genshin Impact", "nendoroid", "2582"), "Nendoroid Zhongli - Genshin Impact");
  assert.equal(t("figma 296: Todomatsu Matsuno (Osomatsu-san)", "figma", "296"), "figma Todomatsu Matsuno (Osomatsu-san)");
  assert.equal(t("Hololive - Mori Calliope - figma #602 ( )", "figma", "602"), "figma Hololive - Mori Calliope");
  assert.equal(t("Bubble Uta POP UP PARADE Figure - Anime Collectible", "pop-up-parade", null), "POP UP PARADE Bubble Uta");
  assert.equal(t("Oreimo POP UP PARADE Kuroneko Pvc Fig", "pop-up-parade", null), "POP UP PARADE Oreimo - Kuroneko");
  assert.equal(t("Mr Love Queens Choice Nendoroid Zeyan Li (re-run)", "nendoroid", null), "Nendoroid Mr Love Queens Choice - Zeyan Li");
  assert.equal(t("Kaiju No. 8 Nendoroid Gen Narumi", "nendoroid", "2883"), "Nendoroid Kaiju No. 8 - Gen Narumi");
  assert.equal(t("Avatar The Last Airbender Nendoroid - Aang - 1867", "nendoroid", "1867"), "Nendoroid Avatar The Last Airbender - Aang");
  assert.equal(t("Nendoroid 0544 Kirby", "nendoroid", "544"), "Nendoroid Kirby");
  assert.equal(t("Hatsune Miku - Nendoroid Hatsune Miku - (NT Ver.)", "nendoroid", null), "Nendoroid Hatsune Miku - Hatsune Miku (NT Ver.)");
});
