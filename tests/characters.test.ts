// Character hubs (src/content/characters.ts, DECISIONS.md 2026-11-08): real titles land on their character only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARACTERS, CHARACTER_MIN } from "../src/content/characters";

const of = (name: string) => CHARACTERS.filter((c) => c.re.test(name)).map((c) => c.slug);

test("real titles land on their character", () => {
  assert.deepEqual(of("Nendoroid Jujutsu Kaisen - Satoru Gojo: Suit Ver."), ["satoru-gojo"]);
  assert.deepEqual(of("POP UP PARADE Frieren: Blow Kiss Ver."), ["frieren"]);
  assert.deepEqual(of("Nendoroid Frieren: Beyond Journey's End - Fern: Winter Clothes Ver. [Basic]"), ["fern"]);
  assert.deepEqual(of("figma Power"), ["power"]);
  assert.deepEqual(of("Nendoroid Chainsaw Man - Power: Casual Outfit Ver. [Basic]"), ["power"]);
  assert.ok(of("POP UP PARADE KonoSuba - Aqua (Swimsuit Ver.)").includes("aqua-konosuba"));
});

test("namesakes from other shows stay out", () => {
  assert.deepEqual(of("POP UP PARADE Oshi no Ko - Aqua"), []);
  assert.deepEqual(of("Nendoroid To Love-Ru Darkness - Golden Darkness 2.0"), []);
  assert.deepEqual(of("figma Atelier Ryza: Ever Darkness & the Secret Hideout - Reisalin Stout"), []);
  assert.ok(!of("Nendoroid Power Rangers - Red Ranger").includes("power"));
});

test("slugs unique and URL-safe; a hub needs 3+ figures (owner, 2026-11-08)", () => {
  assert.equal(new Set(CHARACTERS.map((c) => c.slug)).size, CHARACTERS.length);
  for (const c of CHARACTERS) assert.match(c.slug, /^[a-z0-9-]+$/);
  assert.equal(CHARACTER_MIN, 3);
});
