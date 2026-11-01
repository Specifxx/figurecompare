// Series hubs (src/content/series.ts): name-only grouping, specific patterns, no figure in the wrong franchise.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SERIES } from "../src/content/series";

const of = (name: string) => SERIES.filter((s) => s.re.test(name)).map((s) => s.slug);

test("real titles land in their series, and only there", () => {
  assert.deepEqual(of("Nendoroid Hatsune Miku: Cinnamoroll Collaboration Ver."), ["hatsune-miku"]);
  assert.deepEqual(of("figma Hololive - Houshou Marine"), ["hololive"]);
  assert.deepEqual(of("Nendoroid Blue Archive - Asuna Ichinose"), ["blue-archive"]);
  assert.deepEqual(of("Nendoroid Asuna 2.0"), ["sword-art-online"]);
  assert.deepEqual(of("figma Satoru Gojo"), ["jujutsu-kaisen"]);
  assert.deepEqual(of("Nendoroid Fate/Grand Order - Lancer/Melusine"), ["fate"]);
  assert.deepEqual(of("POP UP PARADE Re:Zero - Rem: Ice Season Ver."), ["re-zero"]);
  assert.deepEqual(of("Nendoroid Link: Breath of the Wild Ver."), ["the-legend-of-zelda"]);
  assert.deepEqual(of("figma Wild Horse (Bay)"), []);
});

test("slugs are unique and URL-safe", () => {
  assert.equal(new Set(SERIES.map((s) => s.slug)).size, SERIES.length);
  for (const s of SERIES) assert.match(s.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});
